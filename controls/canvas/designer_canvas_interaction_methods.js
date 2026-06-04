'use strict';

const { MoveControlCommand, ResizeControlCommand, DeleteControlCommand } = require('../../models/command_history');

module.exports = {
    _wire_canvas() {
        const that = this;
        if (!this._surface_el) return;

        this._surface_el.addEventListener('mousedown', (e) => {
            if (e.button !== 0) return;
            const rect = that._surface_el.getBoundingClientRect();
            const mx = e.clientX - rect.left;
            const my = e.clientY - rect.top;

            if (that._mode === 'place' && that._placement_type) {
                that._start_placement_drag(mx, my, e);
                return;
            }
            const handle = e.target.closest('.resize-handle');
            if (handle) {
                const item_el = handle.closest('.design-surface-item');
                if (item_el) {
                    that._start_resize(item_el, handle.getAttribute('data-dir'), e);
                    return;
                }
            }
            const target = e.target.closest('.design-surface-item');
            if (target) {
                const node_id = target.getAttribute('data-node-id');
                if (!node_id) return;
                if (!that.selection_model.is_selected(node_id)) {
                    if (e.ctrlKey || e.metaKey || e.shiftKey) that.selection_model.toggle(node_id);
                    else that.selection_model.select_exclusive(node_id);
                }
                that._start_drag(node_id, mx, my, e);
            } else {
                that.selection_model.clear();
                that._start_marquee(mx, my, e);
            }
        });

        this._surface_el.addEventListener('dblclick', (e) => {
            const target = e.target.closest('.design-surface-item');
            if (!target) return;
            const node_id = target.getAttribute('data-node-id');
            if (!node_id) return;
            that._start_inline_edit(node_id, target);
        });

        document.addEventListener('mousemove', (e) => {
            if (that._drag_state) that._on_drag_move(e);
            if (that._resize_state) that._on_resize_move(e);
            if (that._placement_state) that._on_placement_move(e);
            if (that._marquee_state) that._on_marquee_move(e);
        });
        document.addEventListener('mouseup', (e) => {
            if (that._drag_state) that._end_drag(e);
            if (that._resize_state) that._end_resize(e);
            if (that._placement_state) that._end_placement(e);
            if (that._marquee_state) that._end_marquee(e);
        });

        this._canvas_el.addEventListener('wheel', (e) => {
            if (!e.ctrlKey) return;
            e.preventDefault();
            const delta = e.deltaY < 0 ? 0.1 : -0.1;
            that._set_zoom(that._zoom + delta);
        }, { passive: false });

        this._build_viewport_toolbar();
        this._build_zoom_toolbar();
    },

    _wire_keyboard() {
        const that = this;
        if (!this._canvas_el) return;
        this._canvas_el.setAttribute('tabindex', '0');
        this._canvas_el.addEventListener('keydown', (e) => {
            if (e.key === 'Delete' || e.key === 'Backspace') {
                const sel = that.selection_model.get_selected();
                if (sel.length > 0) {
                    for (const id of sel) {
                        const node = that.document_model.get_node(id);
                        if (!node || node.control_type === 'form_container') continue;
                        that.command_history.execute(new DeleteControlCommand(that.document_model, { node_id: id }));
                    }
                    that.selection_model.clear();
                    e.preventDefault();
                }
            } else if (e.key === 'Escape') {
                that._reset_to_pointer();
                that.selection_model.clear();
            } else if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
                that.command_history[e.shiftKey ? 'redo' : 'undo']();
                e.preventDefault();
            } else if (e.key === 'y' && (e.ctrlKey || e.metaKey)) {
                that.command_history.redo();
                e.preventDefault();
            } else if (e.key === 'c' && (e.ctrlKey || e.metaKey)) {
                that._copy_selected();
                e.preventDefault();
            } else if (e.key === 'v' && (e.ctrlKey || e.metaKey)) {
                that._paste();
                e.preventDefault();
            } else if (e.key === 'a' && (e.ctrlKey || e.metaKey)) {
                if (that.document_model.root) {
                    that.selection_model.clear();
                    for (const [id] of that._items) that.selection_model.select_add(id);
                    e.preventDefault();
                }
            } else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                const sel = that.selection_model.get_selected();
                if (sel.length > 0) {
                    if ((e.altKey || e.shiftKey) && sel.length === 1 && that._can_reorder_node(sel[0]) && ['ArrowUp', 'ArrowDown'].includes(e.key)) {
                        that._move_node_in_parent(sel[0], e.key === 'ArrowUp' ? -1 : 1);
                        e.preventDefault();
                        return;
                    }
                    if (sel.some(id => that._is_layout_managed_node(id))) {
                        if (that._status_el) that._status_el.textContent = 'Arrow-key nudging is disabled for responsive auto-layout fields. Use Alt+ArrowUp/Down to reorder.';
                        e.preventDefault();
                        return;
                    }
                    const gx = that._grid_size[0];
                    const gy = that._grid_size[1];
                    let dx = 0;
                    let dy = 0;
                    if (e.key === 'ArrowLeft') dx = -gx;
                    if (e.key === 'ArrowRight') dx = gx;
                    if (e.key === 'ArrowUp') dy = -gy;
                    if (e.key === 'ArrowDown') dy = gy;
                    for (const id of sel) {
                        const node = that.document_model.get_node(id);
                        if (!node || node.control_type === 'form_container') continue;
                        const ox = node.properties.x || 0;
                        const oy = node.properties.y || 0;
                        that.command_history.execute(new MoveControlCommand(that.document_model, {
                            node_id: id,
                            old_pos: { x: ox, y: oy },
                            new_pos: { x: ox + dx, y: oy + dy }
                        }));
                    }
                    e.preventDefault();
                }
            }
        });
    },

    _start_drag(node_id, mx, my, e) {
        const selected = this.selection_model.get_selected();
        if (selected.some(id => this._is_layout_managed_node(id))) {
            if (this._status_el) this._status_el.textContent = 'This field is placed by responsive layout. Use spans, width policy, or the reorder arrows instead of dragging.';
            e.preventDefault();
            return;
        }
        const offsets = [];
        for (const id of selected) {
            const el = this._items.get(id);
            const node = this.document_model.get_node(id);
            if (!el || !node) continue;
            offsets.push({ id, el, start_x: node.properties.x || 0, start_y: node.properties.y || 0 });
        }
        if (offsets.length === 0) return;
        this._drag_state = { start_client_x: e.clientX, start_client_y: e.clientY, offsets, moved: false };
        document.body.style.cursor = 'grabbing';
        e.preventDefault();
    },

    _on_drag_move(e) {
        const ds = this._drag_state;
        const dx = e.clientX - ds.start_client_x;
        const dy = e.clientY - ds.start_client_y;
        if (Math.abs(dx) > 2 || Math.abs(dy) > 2) ds.moved = true;
        if (!ds.moved) return;
        const gx = this._grid_size[0];
        const gy = this._grid_size[1];
        const snap = this._settings.snap_to_grid;
        for (const item of ds.offsets) {
            let nx = item.start_x + dx;
            let ny = item.start_y + dy;
            if (snap) {
                nx = Math.round(nx / gx) * gx;
                ny = Math.round(ny / gy) * gy;
            }
            item.el.style.left = Math.max(0, nx) + 'px';
            item.el.style.top = Math.max(0, ny) + 'px';
        }
        this._show_alignment_guides(ds);
    },

    _end_drag(e) {
        const ds = this._drag_state;
        this._drag_state = null;
        document.body.style.cursor = '';
        if (!ds.moved) return;
        const gx = this._grid_size[0];
        const gy = this._grid_size[1];
        const dx = e.clientX - ds.start_client_x;
        const dy = e.clientY - ds.start_client_y;
        for (const item of ds.offsets) {
            const snap = this._settings.snap_to_grid;
            let nx = item.start_x + dx;
            let ny = item.start_y + dy;
            if (snap) {
                nx = Math.round(nx / gx) * gx;
                ny = Math.round(ny / gy) * gy;
            }
            nx = Math.max(0, nx);
            ny = Math.max(0, ny);
            if (nx !== item.start_x || ny !== item.start_y) {
                this.command_history.execute(new MoveControlCommand(this.document_model, {
                    node_id: item.id,
                    old_pos: { x: item.start_x, y: item.start_y },
                    new_pos: { x: nx, y: ny }
                }));
            }
        }
        this._clear_alignment_guides();
    },

    _show_alignment_guides(ds) {
        this._clear_alignment_guides();
        if (!this._surface_el) return;
        const drag_ids = new Set(ds.offsets.map(o => o.id));
        const surface_rect = this._surface_el.getBoundingClientRect();
        const drag_rects = ds.offsets.map(o => {
            const bounds = o.el.getBoundingClientRect();
            const l = bounds.left - surface_rect.left;
            const t = bounds.top - surface_rect.top;
            const w = bounds.width;
            const h = bounds.height;
            return { l, t, r: l + w, b: t + h, cx: l + w / 2, cy: t + h / 2 };
        });
        if (drag_rects.length === 0) return;
        const dr = {
            l: Math.min(...drag_rects.map(r => r.l)),
            t: Math.min(...drag_rects.map(r => r.t)),
            r: Math.max(...drag_rects.map(r => r.r)),
            b: Math.max(...drag_rects.map(r => r.b))
        };
        dr.cx = (dr.l + dr.r) / 2;
        dr.cy = (dr.t + dr.b) / 2;
        const thresh = 4;
        const guides = [];
        for (const [id, el] of this._items) {
            if (drag_ids.has(id)) continue;
            const bounds = el.getBoundingClientRect();
            const ox = bounds.left - surface_rect.left;
            const oy = bounds.top - surface_rect.top;
            const ow = bounds.width;
            const oh = bounds.height;
            const or = { l: ox, t: oy, r: ox + ow, b: oy + oh, cx: ox + ow / 2, cy: oy + oh / 2 };
            for (const [dv, ov] of [[dr.l, or.l], [dr.r, or.r], [dr.cx, or.cx], [dr.l, or.r], [dr.r, or.l]]) {
                if (Math.abs(dv - ov) < thresh) guides.push({ type: 'v', x: ov });
            }
            for (const [dv, ov] of [[dr.t, or.t], [dr.b, or.b], [dr.cy, or.cy], [dr.t, or.b], [dr.b, or.t]]) {
                if (Math.abs(dv - ov) < thresh) guides.push({ type: 'h', y: ov });
            }
        }
        const seen = new Set();
        this._guide_els = [];
        for (const g of guides) {
            const key = g.type + (g.x || g.y);
            if (seen.has(key)) continue;
            seen.add(key);
            if (this._guide_els.length >= 6) break;
            const line = document.createElement('div');
            line.className = 'alignment-guide alignment-guide-' + g.type;
            if (g.type === 'v') line.style.left = g.x + 'px';
            else line.style.top = g.y + 'px';
            this._surface_el.appendChild(line);
            this._guide_els.push(line);
        }
    },

    _clear_alignment_guides() {
        if (this._guide_els) {
            for (const el of this._guide_els) el.remove();
            this._guide_els = [];
        }
    },

    _start_marquee(mx, my, e) {
        const el = document.createElement('div');
        el.className = 'marquee-selection';
        el.style.left = mx + 'px';
        el.style.top = my + 'px';
        el.style.width = '0';
        el.style.height = '0';
        this._surface_el.appendChild(el);
        this._marquee_state = { start_mx: mx, start_my: my, el };
        e.preventDefault();
    },

    _on_marquee_move(e) {
        const ms = this._marquee_state;
        const rect = this._surface_el.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        const x = Math.min(ms.start_mx, mx);
        const y = Math.min(ms.start_my, my);
        const w = Math.abs(mx - ms.start_mx);
        const h = Math.abs(my - ms.start_my);
        ms.el.style.left = x + 'px';
        ms.el.style.top = y + 'px';
        ms.el.style.width = w + 'px';
        ms.el.style.height = h + 'px';
    },

    _end_marquee(e) {
        const ms = this._marquee_state;
        this._marquee_state = null;
        const rect = this._surface_el.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        const x1 = Math.min(ms.start_mx, mx);
        const y1 = Math.min(ms.start_my, my);
        const x2 = Math.max(ms.start_mx, mx);
        const y2 = Math.max(ms.start_my, my);
        ms.el.remove();

        if (x2 - x1 < 4 && y2 - y1 < 4) return;

        const surface_rect = this._surface_el.getBoundingClientRect();
        for (const [id, el] of this._items) {
            const bounds = el.getBoundingClientRect();
            const nx = bounds.left - surface_rect.left;
            const ny = bounds.top - surface_rect.top;
            const nw = bounds.width;
            const nh = bounds.height;
            if (nx < x2 && nx + nw > x1 && ny < y2 && ny + nh > y1) {
                this.selection_model.select_add(id);
            }
        }
    },

    _set_zoom(z) {
        this._zoom = Math.max(0.25, Math.min(4.0, Math.round(z * 100) / 100));
        if (this._surface_el) {
            this._surface_el.style.transform = 'scale(' + this._zoom + ')';
            this._surface_el.style.transformOrigin = 'top left';
        }
        if (this._zoom_label) this._zoom_label.textContent = Math.round(this._zoom * 100) + '%';
    },

    _build_zoom_toolbar() {
        if (!this._canvas_el) return;
        const bar = document.createElement('div');
        bar.className = 'zoom-toolbar';
        const that = this;
        const mkBtn = function (text, fn) {
            const b = document.createElement('button');
            b.className = 'zoom-btn';
            b.textContent = text;
            b.addEventListener('click', fn);
            return b;
        };
        bar.appendChild(mkBtn('−', function () { that._set_zoom(that._zoom - 0.1); }));
        this._zoom_label = document.createElement('span');
        this._zoom_label.className = 'zoom-label';
        this._zoom_label.textContent = '100%';
        bar.appendChild(this._zoom_label);
        bar.appendChild(mkBtn('+', function () { that._set_zoom(that._zoom + 0.1); }));
        bar.appendChild(mkBtn('Reset', function () { that._set_zoom(1.0); }));
        this._canvas_el.appendChild(bar);
    },

    _build_viewport_toolbar() {
        if (!this._canvas_el || this._viewport_toolbar_el) return;
        const bar = document.createElement('div');
        bar.className = 'viewport-toolbar';

        const title = document.createElement('div');
        title.className = 'viewport-toolbar-title';
        title.textContent = 'Responsive';
        bar.appendChild(title);

        const group = document.createElement('div');
        group.className = 'viewport-button-group';
        for (const preset of this._viewport_presets) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'viewport-btn';
            btn.setAttribute('data-viewport-id', preset.id);
            btn.textContent = preset.label;
            btn.addEventListener('click', () => this._set_viewport(preset.id));
            group.appendChild(btn);
        }
        bar.appendChild(group);

        const label = document.createElement('div');
        label.className = 'viewport-width-label';
        bar.appendChild(label);

        this._canvas_el.appendChild(bar);
        this._viewport_toolbar_el = bar;
        this._viewport_width_label_el = label;
        this._update_viewport_toolbar();
    },

    _start_resize(item_el, dir, e) {
        const node_id = item_el.getAttribute('data-node-id');
        const node = this.document_model.get_node(node_id);
        if (!node) return;
        if (this._is_layout_managed_node(node)) {
            if (this._status_el) this._status_el.textContent = 'Resize the container or change spans for auto-layout fields.';
            e.preventDefault();
            e.stopPropagation();
            return;
        }
        this._resize_state = {
            node_id,
            el: item_el,
            dir,
            start_x: node.properties.x || 0,
            start_y: node.properties.y || 0,
            start_w: node.properties.width || 100,
            start_h: node.properties.height || 32,
            start_mx: e.clientX,
            start_my: e.clientY
        };
        e.preventDefault();
        e.stopPropagation();
    },

    _on_resize_move(e) {
        const rs = this._resize_state;
        const dx = e.clientX - rs.start_mx;
        const dy = e.clientY - rs.start_my;
        const gx = this._grid_size[0];
        const gy = this._grid_size[1];
        let x = rs.start_x;
        let y = rs.start_y;
        let w = rs.start_w;
        let h = rs.start_h;
        if (rs.dir.includes('e')) w = Math.max(20, Math.round((rs.start_w + dx) / gx) * gx);
        if (rs.dir.includes('w')) {
            const nw2 = Math.max(20, Math.round((rs.start_w - dx) / gx) * gx);
            x = rs.start_x + (rs.start_w - nw2);
            w = nw2;
        }
        if (rs.dir.includes('s')) h = Math.max(16, Math.round((rs.start_h + dy) / gy) * gy);
        if (rs.dir.includes('n')) {
            const nh2 = Math.max(16, Math.round((rs.start_h - dy) / gy) * gy);
            y = rs.start_y + (rs.start_h - nh2);
            h = nh2;
        }
        rs.el.style.left = x + 'px';
        rs.el.style.top = y + 'px';
        rs.el.style.width = w + 'px';
        rs.el.style.height = h + 'px';
    },

    _end_resize() {
        const rs = this._resize_state;
        this._resize_state = null;
        const nx = parseInt(rs.el.style.left, 10) || 0;
        const ny = parseInt(rs.el.style.top, 10) || 0;
        const nw = parseInt(rs.el.style.width, 10) || 100;
        const nh = parseInt(rs.el.style.height, 10) || 32;
        if (nx !== rs.start_x || ny !== rs.start_y) {
            this.command_history.execute(new MoveControlCommand(this.document_model, {
                node_id: rs.node_id,
                old_pos: { x: rs.start_x, y: rs.start_y },
                new_pos: { x: nx, y: ny }
            }));
        }
        if (nw !== rs.start_w || nh !== rs.start_h) {
            this.command_history.execute(new ResizeControlCommand(this.document_model, {
                node_id: rs.node_id,
                old_size: { width: rs.start_w, height: rs.start_h },
                new_size: { width: nw, height: nh }
            }));
        }
    },

    _start_placement_drag(mx, my, e) {
        const parent_id = this._resolve_parent_id_for_target(e.target);
        const host = this._get_render_host(parent_id);
        const host_rect = host.getBoundingClientRect();
        const local_x = e.clientX - host_rect.left;
        const local_y = e.clientY - host_rect.top;
        const gx = this._grid_size[0];
        const gy = this._grid_size[1];
        const ghost = document.createElement('div');
        ghost.className = 'placement-ghost';
        ghost.style.cssText = 'left:' + (Math.round(local_x / gx) * gx) + 'px; top:' + (Math.round(local_y / gy) * gy) + 'px; width:0; height:0;';
        host.appendChild(ghost);
        this._placement_state = {
            start_x: Math.round(local_x / gx) * gx,
            start_y: Math.round(local_y / gy) * gy,
            ghost,
            host,
            parent_id,
            control_type: this._placement_type
        };
        e.preventDefault();
    },

    _on_placement_move(e) {
        const ps = this._placement_state;
        const rect = ps.host.getBoundingClientRect();
        const gx = this._grid_size[0];
        const gy = this._grid_size[1];
        const cx = Math.round((e.clientX - rect.left) / gx) * gx;
        const cy = Math.round((e.clientY - rect.top) / gy) * gy;
        ps.ghost.style.left = Math.min(ps.start_x, cx) + 'px';
        ps.ghost.style.top = Math.min(ps.start_y, cy) + 'px';
        ps.ghost.style.width = Math.abs(cx - ps.start_x) + 'px';
        ps.ghost.style.height = Math.abs(cy - ps.start_y) + 'px';
    },

    _end_placement(e) {
        const ps = this._placement_state;
        this._placement_state = null;
        if (ps.ghost.parentNode) ps.ghost.remove();
        const rect = ps.host.getBoundingClientRect();
        const gx = this._grid_size[0];
        const gy = this._grid_size[1];
        const cx = Math.round((e.clientX - rect.left) / gx) * gx;
        const cy = Math.round((e.clientY - rect.top) / gy) * gy;
        const entry = this.control_registry.get(ps.control_type);
        if (!entry) return;
        let x2;
        let y2;
        let w2;
        let h2;
        const dw = Math.abs(cx - ps.start_x);
        const dh = Math.abs(cy - ps.start_y);
        if (dw > 8 || dh > 8) {
            x2 = Math.min(ps.start_x, cx);
            y2 = Math.min(ps.start_y, cy);
            w2 = Math.max(20, dw);
            h2 = Math.max(16, dh);
        } else {
            x2 = ps.start_x;
            y2 = ps.start_y;
            const ds = entry.default_size;
            w2 = ds[0];
            h2 = ds[1];
        }
        this._place_control(ps.control_type, x2, y2, w2, h2, ps.parent_id);
        this._reset_to_pointer();
    }
};
