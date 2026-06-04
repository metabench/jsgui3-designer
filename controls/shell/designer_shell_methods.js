'use strict';

const Document_Model = require('../../models/document_model');
const { DeleteControlCommand } = require('../../models/command_history');

module.exports = {
    _wire_menubar() {
        const bar = this.dom.el.querySelector('.designer-menubar');
        if (!bar) return;
        const that = this;

        const closeAll = () => {
            bar.querySelectorAll('.menu-dropdown').forEach(d => d.remove());
            bar.querySelectorAll('.menu-item').forEach(m => m.classList.remove('open'));
        };
        document.addEventListener('click', () => closeAll());

        bar.addEventListener('click', (e) => {
            e.stopPropagation();
            const item = e.target.closest('.menu-item');
            if (!item) return;
            const menuName = item.getAttribute('data-menu');
            closeAll();
            item.classList.add('open');
            const dd = document.createElement('div');
            dd.className = 'menu-dropdown';
            const rect = item.getBoundingClientRect();
            dd.style.left = rect.left + 'px';
            dd.style.top = rect.bottom + 'px';

            if (menuName === 'file') {
                dd.appendChild(that._menu_option('New', () => { closeAll(); that._file_new(); }));
                dd.appendChild(that._menu_option('Save', () => { closeAll(); that._file_save(); }));
                dd.appendChild(that._menu_option('Load', () => { closeAll(); that._file_load(); }));
                dd.appendChild(that._menu_separator());
                dd.appendChild(that._menu_option('Export AI JSON', () => { closeAll(); that._file_export_ai(); }));
            } else if (menuName === 'edit') {
                dd.appendChild(that._menu_option('Undo', () => { closeAll(); that.command_history.undo(); }, 'Ctrl+Z'));
                dd.appendChild(that._menu_option('Redo', () => { closeAll(); that.command_history.redo(); }, 'Ctrl+Y'));
                dd.appendChild(that._menu_separator());
                dd.appendChild(that._menu_option('Copy', () => { closeAll(); that._copy_selected(); }, 'Ctrl+C'));
                dd.appendChild(that._menu_option('Paste', () => { closeAll(); that._paste(); }, 'Ctrl+V'));
                dd.appendChild(that._menu_separator());
                dd.appendChild(that._menu_option('Settings…', () => { closeAll(); that._show_settings_dialog(); }));
            }
            document.body.appendChild(dd);
        });
    },

    _menu_option(label, action, shortcut) {
        const el = document.createElement('div');
        el.className = 'menu-option';
        const lbl = document.createElement('span');
        lbl.textContent = label;
        el.appendChild(lbl);
        if (shortcut) {
            const sc = document.createElement('span');
            sc.className = 'menu-shortcut';
            sc.textContent = shortcut;
            el.appendChild(sc);
        }
        el.addEventListener('click', (e) => { e.stopPropagation(); action(); });
        return el;
    },

    _menu_separator() {
        const el = document.createElement('div');
        el.className = 'menu-separator';
        return el;
    },

    _file_new() {
        if (this.command_history.is_modified() && !confirm('Discard current design?')) return;
        this.selection_model.clear();
        const fresh = new Document_Model();
        fresh.init_root();
        this._preview_width = null;
        this.document_model.deserialize(fresh.serialize());
        this.command_history.clear();
        this._type_counters = {};
        this._sync_active_viewport_from_width();
        this._update_viewport_toolbar();
        this._apply_document_meta();
        this._relayout_all();
        this._refresh_controls_list();
        this._update_canvas_empty_state();
        this._status_el.textContent = 'New design';
    },

    _file_save() {
        const data = this.document_model.serialize();
        this._download_json('design.form.json', data);
        this.command_history.mark_saved();
        this._status_el.textContent = 'Saved';
    },

    _file_load() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        const that = this;
        input.addEventListener('change', () => {
            const file = input.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () => {
                try {
                    const data = JSON.parse(reader.result);
                    that.selection_model.clear();
                    that._preview_width = null;
                    that.document_model.deserialize(data);
                    that.command_history.clear();
                    that._type_counters = {};
                    that._sync_active_viewport_from_width();
                    that._update_viewport_toolbar();
                    that._apply_document_meta();
                    that._relayout_all();
                    that._refresh_controls_list();
                    that._update_canvas_empty_state();
                    that._status_el.textContent = 'Loaded: ' + file.name;
                } catch (err) {
                    alert('Failed to load: ' + err.message);
                }
            };
            reader.readAsText(file);
        });
        input.click();
    },

    _show_settings_dialog() {
        const that = this;
        const backdrop = document.createElement('div');
        backdrop.className = 'settings-backdrop';

        const card = document.createElement('div');
        card.className = 'settings-card';

        const header = document.createElement('div');
        header.className = 'settings-header';
        header.innerHTML = '<span class="settings-icon">⚙</span><span>Settings</span>';
        card.appendChild(header);

        const body = document.createElement('div');
        body.className = 'settings-body';

        const addToggle = (label, desc, key) => {
            const row = document.createElement('div');
            row.className = 'settings-row';
            const info = document.createElement('div');
            info.className = 'settings-info';
            info.innerHTML = '<div class="settings-label">' + label + '</div><div class="settings-desc">' + desc + '</div>';
            row.appendChild(info);

            const toggle = document.createElement('label');
            toggle.className = 'settings-toggle';
            const cb = document.createElement('input');
            cb.type = 'checkbox';
            cb.checked = !!that._settings[key];
            cb.addEventListener('change', () => {
                that._settings[key] = cb.checked;
                that._apply_settings();
            });
            const slider = document.createElement('span');
            slider.className = 'settings-slider';
            toggle.appendChild(cb);
            toggle.appendChild(slider);
            row.appendChild(toggle);
            body.appendChild(row);
        };

        const addNumber = (label, desc, key, min, max) => {
            const row = document.createElement('div');
            row.className = 'settings-row';
            const info = document.createElement('div');
            info.className = 'settings-info';
            info.innerHTML = '<div class="settings-label">' + label + '</div><div class="settings-desc">' + desc + '</div>';
            row.appendChild(info);

            const input = document.createElement('input');
            input.type = 'number';
            input.className = 'settings-number';
            input.value = that._settings[key];
            input.min = min;
            input.max = max;
            input.addEventListener('change', () => {
                that._settings[key] = parseInt(input.value, 10) || min;
                that._grid_size = [that._settings[key], that._settings[key]];
                that._apply_settings();
            });
            row.appendChild(input);
            body.appendChild(row);
        };

        addToggle('Show Grid', 'Display alignment dot grid on canvas', 'show_grid');
        addToggle('Snap to Grid', 'Snap controls to grid when placing or moving', 'snap_to_grid');
        addNumber('Grid Size', 'Grid spacing in pixels', 'grid_size', 4, 32);
        addToggle('Ghost Drag', 'Show semi-transparent ghost when dragging controls', 'ghost_drag');

        card.appendChild(body);

        const footer = document.createElement('div');
        footer.className = 'settings-footer';
        const closeBtn = document.createElement('button');
        closeBtn.className = 'settings-close-btn';
        closeBtn.textContent = 'Close';
        closeBtn.addEventListener('click', () => backdrop.remove());
        footer.appendChild(closeBtn);
        card.appendChild(footer);

        backdrop.appendChild(card);
        document.body.appendChild(backdrop);

        backdrop.addEventListener('click', (e) => { if (e.target === backdrop) backdrop.remove(); });
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                backdrop.remove();
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);
        closeBtn.focus();
    },

    _apply_settings() {
        if (this._surface_el) {
            if (this._settings.show_grid) {
                const gs = this._settings.grid_size;
                this._surface_el.style.backgroundImage = 'radial-gradient(circle,#d0d4db 1px,transparent 1px)';
                this._surface_el.style.backgroundSize = gs + 'px ' + gs + 'px';
            } else {
                this._surface_el.style.backgroundImage = 'none';
            }
        }
        this._grid_size = [this._settings.grid_size, this._settings.grid_size];
    },

    _wire_context_menu() {
        if (!this._surface_el) return;
        const that = this;

        document.addEventListener('mousedown', (e) => {
            const existing = document.querySelector('.ctx-menu');
            if (existing && !existing.contains(e.target)) {
                that._close_context_menu();
            }
        }, true);

        this._canvas_el.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            that._close_context_menu();
            const menu = document.createElement('div');
            menu.className = 'ctx-menu';
            menu.style.left = e.pageX + 'px';
            menu.style.top = e.pageY + 'px';

            const paste_parent_id = that._resolve_parent_id_for_target(e.target);
            const paste_host = that._get_render_host(paste_parent_id);
            const paste_rect = paste_host.getBoundingClientRect();
            const pasteX = e.clientX - paste_rect.left;
            const pasteY = e.clientY - paste_rect.top;

            const target = e.target.closest('.design-surface-item');
            if (target) {
                const node_id = target.getAttribute('data-node-id');
                if (node_id && !that.selection_model.is_selected(node_id)) {
                    that.selection_model.select_exclusive(node_id);
                }
                menu.appendChild(that._ctx_option('Copy', 'Ctrl+C', () => that._copy_selected()));
                if (that._clipboard) {
                    menu.appendChild(that._ctx_option('Paste', 'Ctrl+V', () => that._paste_at_pos(pasteX, pasteY, paste_parent_id)));
                }
                menu.appendChild(that._ctx_separator());
                menu.appendChild(that._ctx_option('Delete', 'Del', () => {
                    const sel = that.selection_model.get_selected();
                    for (const id of sel) {
                        const node = that.document_model.get_node(id);
                        if (!node || node.control_type === 'form_container') continue;
                        that.command_history.execute(new DeleteControlCommand(that.document_model, { node_id: id }));
                    }
                    that.selection_model.clear();
                }));
            } else {
                menu.appendChild(that._ctx_option('Expand to fill window', '', () => that._expand_canvas_to_fill()));
                if (that._clipboard) {
                    menu.appendChild(that._ctx_separator());
                    menu.appendChild(that._ctx_option('Paste', 'Ctrl+V', () => that._paste_at_pos(pasteX, pasteY, paste_parent_id)));
                }
            }
            document.body.appendChild(menu);
        });
    },

    _ctx_option(label, shortcut, action) {
        const el = document.createElement('div');
        el.className = 'ctx-option';
        const labelSpan = document.createElement('span');
        labelSpan.textContent = label;
        el.appendChild(labelSpan);
        if (shortcut) {
            const sc = document.createElement('span');
            sc.className = 'ctx-shortcut';
            sc.textContent = shortcut;
            el.appendChild(sc);
        }
        el.addEventListener('click', (e) => {
            e.stopPropagation();
            this._close_context_menu();
            action();
        });
        return el;
    },

    _ctx_separator() {
        const el = document.createElement('div');
        el.className = 'ctx-separator';
        return el;
    },

    _close_context_menu() {
        document.querySelectorAll('.ctx-menu').forEach(m => m.remove());
    },

    _copy_selected() {
        const sel = this.selection_model.get_selected();
        if (sel.length === 0) return;
        const selected_ids = new Set(sel);
        const nodes = [];
        for (const id of sel) {
            const node = this.document_model.get_node(id);
            if (!node || node.control_type === 'form_container') continue;
            const has_selected_ancestor = this.document_model.get_ancestors(id)
                .some(ancestor => selected_ids.has(ancestor.id));
            if (has_selected_ancestor) continue;
            nodes.push(this.document_model._serialize_node(node));
        }
        if (nodes.length === 0) return;
        this._clipboard = nodes;
        this._status_el.textContent = `Copied ${nodes.length} control(s)`;
    },

    _paste() {
        this._paste_at_pos(null, null, null);
    },

    _paste_at_pos(px, py, parent_id) {
        if (!this._clipboard || this._clipboard.length === 0) return;
        const gx = this._grid_size[0];
        const gy = this._grid_size[1];
        const resolved_parent_id = parent_id || this._resolve_parent_id_for_target(null);
        let last_root_id = null;
        for (const data of this._clipboard) {
            let root_x;
            let root_y;
            if (px != null && py != null) {
                root_x = Math.round(px / gx) * gx;
                root_y = Math.round(py / gy) * gy;
            } else {
                root_x = (data.properties.x || 0) + 16;
                root_y = (data.properties.y || 0) + 16;
            }
            last_root_id = this._paste_serialized_subtree(data, resolved_parent_id, {
                root_x,
                root_y,
                source_root_x: data.properties.x || 0,
                source_root_y: data.properties.y || 0
            }, true);
        }
        if (last_root_id) this.selection_model.select_exclusive(last_root_id);
    }
};
