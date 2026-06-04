'use strict';

const { ReorderControlCommand } = require('../../models/command_history');
const { parseLines } = require('../wysiwyg/create_wysiwyg_element');

module.exports = {
    _get_breakpoint_for_width(width) {
        if (width <= 520) return 'mobile';
        if (width <= 960) return 'tablet';
        return 'desktop';
    },

    _sync_active_viewport_from_width() {
        if (this._preview_width == null) {
            this._active_viewport_id = 'design';
            return;
        }
        const width = this._preview_width || this.document_model.canvas_width || 800;
        const match = this._viewport_presets.find(preset => preset.width === width);
        this._active_viewport_id = match ? match.id : this._get_breakpoint_for_width(width);
    },

    _update_viewport_toolbar() {
        if (!this._viewport_toolbar_el || !this._viewport_width_label_el) return;
        const width = this._preview_width || this.document_model.canvas_width || 800;
        this._viewport_width_label_el.textContent = this._preview_width == null ? ('Canvas ' + width + 'px') : (width + 'px preview');
        this._viewport_toolbar_el.querySelectorAll('.viewport-btn').forEach((btn) => {
            btn.classList.toggle('active', btn.getAttribute('data-viewport-id') === this._active_viewport_id);
        });
    },

    _set_viewport(id) {
        const preset = this._viewport_presets.find(item => item.id === id);
        if (!preset) return;
        this._active_viewport_id = preset.id;
        this._preview_width = preset.width == null ? null : preset.width;
        this._apply_document_meta();
        this._update_viewport_toolbar();
        this._relayout_all();
        this._update_canvas_empty_state();
        if (this._status_el) {
            this._status_el.textContent = preset.width == null
                ? 'Canvas view'
                : `Preview: ${preset.label} ${preset.width}px`;
        }
    },

    _measure_host_width(host_el) {
        if (!host_el) return 0;
        return host_el.clientWidth || host_el.offsetWidth || parseInt(host_el.style.width, 10) || 0;
    },

    _get_responsive_value(props, key, breakpoint, fallback) {
        const specific_key = key + '_' + breakpoint;
        if (props[specific_key] != null && props[specific_key] !== '') return Number(props[specific_key]);
        if (breakpoint === 'mobile' && props[key + '_tablet'] != null && props[key + '_tablet'] !== '') return Number(props[key + '_tablet']);
        if (props[key + '_desktop'] != null && props[key + '_desktop'] !== '') return Number(props[key + '_desktop']);
        return fallback;
    },

    _get_width_policy(node) {
        return node && node.properties && node.properties.width_policy
            ? node.properties.width_policy
            : 'fill';
    },

    _get_active_style_preset() {
        const root = this.document_model && this.document_model.root;
        return root && root.properties && root.properties.style_preset
            ? root.properties.style_preset
            : 'studio_blue';
    },

    _normalize_spacing_choice(value, fallback) {
        if (value == null || value === '') return fallback;
        return String(value);
    },

    _resolve_spacing_scale(choice) {
        const tokens = this._get_style_tokens(this._get_active_style_preset());
        const spacing = tokens.spacing || {};
        const key = this._normalize_spacing_choice(choice, 'none');
        if (spacing[key] != null) return Number(spacing[key]);
        return spacing.medium != null ? Number(spacing.medium) : 16;
    },

    _get_spacing_mode(node) {
        const props = node && node.properties ? node.properties : {};
        if (props.spacing_mode === 'semantic' || props.spacing_mode === 'exact') {
            return props.spacing_mode;
        }
        if (props.density || props.inset_style || props.section_separation) {
            return 'semantic';
        }
        if (props.padding != null || props.gap != null) {
            return 'exact';
        }
        return 'semantic';
    },

    _resolve_container_semantic_spacing(node) {
        const props = node && node.properties ? node.properties : {};
        const style_tokens = this._get_style_tokens(this._get_active_style_preset());
        const density_name = this._normalize_spacing_choice(
            props.density,
            node && node.control_type === 'toolbar' ? 'compact' : 'balanced'
        );
        const inset_style = this._normalize_spacing_choice(
            props.inset_style,
            node && node.control_type === 'form_container' ? 'padded' : 'panel'
        );
        const section_separation = this._normalize_spacing_choice(props.section_separation, 'medium');
        const density_table = style_tokens.density || {};
        const inset_table = style_tokens.inset || {};
        const density = density_table[density_name] || density_table.balanced || {
            field_gap: 16,
            section_gap: 24,
            padding: 20
        };
        const inset = inset_table[inset_style] || inset_table.padded || {
            padding_adjust: 0,
            host_margin: 10
        };
        const gap = Math.max(0, Number(density.field_gap != null ? density.field_gap : 16));
        const section_total = this._resolve_section_gap_total(section_separation, density);
        return {
            spacing_mode: 'semantic',
            density: density_name,
            inset_style,
            section_separation,
            padding: Math.max(0, Number(density.padding != null ? density.padding : 20) + Number(inset.padding_adjust || 0)),
            gap,
            section_gap_total: Math.max(gap, section_total),
            section_gap_delta: Math.max(0, Math.max(gap, section_total) - gap),
            host_margin: Math.max(0, Number(inset.host_margin != null ? inset.host_margin : 10))
        };
    },

    _resolve_section_gap_total(section_separation, density) {
        const field_gap = Math.max(0, Number(density && density.field_gap != null ? density.field_gap : 16));
        const section_gap = Math.max(field_gap, Number(density && density.section_gap != null ? density.section_gap : 24));
        const spacing_small = this._resolve_spacing_scale('small');
        switch (this._normalize_spacing_choice(section_separation, 'medium')) {
            case 'none':
                return field_gap;
            case 'small':
                return Math.round((field_gap + section_gap) / 2);
            case 'large':
                return section_gap + spacing_small;
            case 'medium':
            default:
                return section_gap;
        }
    },

    _resolve_item_spacing(node) {
        const props = node && node.properties ? node.properties : {};
        const before_choice = this._normalize_spacing_choice(props.spacing_before, 'inherit');
        const after_choice = this._normalize_spacing_choice(props.spacing_after, 'inherit');
        const inherited = this._is_container_node(node)
            ? this._resolve_container_semantic_spacing(node).section_gap_delta
            : 0;
        return {
            before: before_choice === 'inherit' ? inherited : this._resolve_spacing_scale(before_choice),
            after: after_choice === 'inherit' ? inherited : this._resolve_spacing_scale(after_choice)
        };
    },

    _get_preferred_auto_layout_width(node, child_el) {
        const props = node.properties || {};
        if (props.width != null && props.width !== '') return Math.max(20, Number(props.width));
        const entry = this.control_registry.get(node.control_type);
        if (entry && Array.isArray(entry.default_size) && entry.default_size[0] != null) {
            return Math.max(20, Number(entry.default_size[0]));
        }
        return Math.max(20, child_el ? (child_el.offsetWidth || 160) : 160);
    },

    _resolve_auto_layout_width(node, child_el, available_width) {
        const policy = this._get_width_policy(node);
        if (policy === 'fill') return Math.max(20, available_width);
        const preferred = this._get_preferred_auto_layout_width(node, child_el);
        return Math.max(20, Math.min(preferred, available_width));
    },

    _get_container_layout(node, host_width) {
        const props = node.properties || {};
        const breakpoint = this._get_breakpoint_for_width(host_width);
        let mode = props.layout_mode || 'none';
        const spacing_mode = this._get_spacing_mode(node);
        const semantic_spacing = this._resolve_container_semantic_spacing(node);
        const padding = spacing_mode === 'semantic'
            ? semantic_spacing.padding
            : (props.padding != null ? Number(props.padding) : (node.control_type === 'form_container' ? 24 : 12));
        const gap = spacing_mode === 'semantic'
            ? semantic_spacing.gap
            : (props.gap != null ? Number(props.gap) : 12);
        const desktop_columns = this._get_responsive_value(props, 'columns', 'desktop', 2);
        const tablet_columns = this._get_responsive_value(props, 'columns', 'tablet', Math.min(desktop_columns, 2));
        const mobile_columns = this._get_responsive_value(props, 'columns', 'mobile', 1);
        let columns = desktop_columns;
        if (breakpoint === 'tablet') columns = tablet_columns;
        if (breakpoint === 'mobile') columns = mobile_columns;
        if (mode === 'horizontal' && breakpoint === 'mobile') mode = 'vertical';
        if (mode !== 'grid' && mode !== 'horizontal') columns = 1;
        if (mode === 'horizontal') columns = Math.max(1, node.children.length || 1);
        return {
            breakpoint,
            mode,
            padding,
            gap,
            spacing_mode,
            density: semantic_spacing.density,
            inset_style: semantic_spacing.inset_style,
            section_separation: semantic_spacing.section_separation,
            section_gap_delta: semantic_spacing.section_gap_delta,
            host_margin: semantic_spacing.host_margin,
            columns: Math.max(1, columns || 1),
            surface_max_width: props.surface_max_width != null ? Number(props.surface_max_width) : null
        };
    },

    _relayout_all() {
        if (!this._surface_el || !this.document_model.root) return;
        this._relayout_children(this.document_model.root, this._surface_el, true);
        this._refresh_selection_overlays();
    },

    _relayout_children(parent_node, host_el, is_root) {
        if (!parent_node || !host_el) return;

        const host_width = this._measure_host_width(host_el);
        const layout = this._get_container_layout(parent_node, host_width);
        host_el.classList.toggle('layout-host', layout.mode !== 'none');
        host_el.setAttribute('data-layout-mode', layout.mode);
        host_el.setAttribute('data-spacing-mode', layout.spacing_mode);
        host_el.setAttribute('data-density', layout.density || 'balanced');
        host_el.setAttribute('data-inset-style', layout.inset_style || 'padded');
        host_el.style.setProperty('--semantic-host-margin', (layout.host_margin != null ? layout.host_margin : 10) + 'px');

        let content_left = layout.padding;
        let content_width = Math.max(0, host_width - layout.padding * 2);
        if (is_root && layout.mode !== 'none' && layout.surface_max_width) {
            content_width = Math.min(content_width, layout.surface_max_width);
            content_left = Math.max(layout.padding, Math.round((host_width - content_width) / 2));
        }

        const column_width = layout.columns > 0
            ? Math.max(0, (content_width - layout.gap * (layout.columns - 1)) / layout.columns)
            : content_width;
        const place_child = (child, left, top, width, height, auto_layout) => {
            const child_el = this._items.get(child.id);
            if (!child_el) return;
            child_el.style.left = Math.round(left) + 'px';
            child_el.style.top = Math.round(top) + 'px';
            child_el.style.width = Math.round(width) + 'px';
            child_el.style.height = Math.round(height) + 'px';
            child_el.classList.toggle('auto-layout-item', auto_layout);
            child_el.setAttribute('data-auto-layout', auto_layout ? 'true' : 'false');
            child_el.setAttribute('data-width-policy', this._get_width_policy(child));
            const child_host = this._get_render_host(child.id);
            if (this._is_container_node(child) && child_host) {
                this._relayout_children(child, child_host, false);
            }
        };

        if (layout.mode === 'none') {
            for (const child of parent_node.children) {
                const child_el = this._items.get(child.id);
                if (!child_el) continue;
                const left = child.properties.x || 0;
                const top = child.properties.y || 0;
                const width = child.properties.width || child_el.offsetWidth || 120;
                const height = child.properties.height || child_el.offsetHeight || 48;
                place_child(child, left, top, width, height, false);
            }
            return;
        }

        if (layout.mode === 'vertical') {
            let cursor_y = layout.padding;
            let previous_spacing_after = 0;
            let is_first = true;
            for (const child of parent_node.children) {
                const child_el = this._items.get(child.id);
                if (!child_el) continue;
                const height = child.properties.height || child_el.offsetHeight || 48;
                const width = this._resolve_auto_layout_width(child, child_el, content_width);
                const item_spacing = this._resolve_item_spacing(child);
                const top = is_first
                    ? cursor_y + item_spacing.before
                    : cursor_y + layout.gap + Math.max(previous_spacing_after, item_spacing.before);
                place_child(child, content_left, top, width, height, true);
                cursor_y = top + height;
                previous_spacing_after = item_spacing.after;
                is_first = false;
            }
            return;
        }

        const rows = [];
        let current_row = null;
        for (const child of parent_node.children) {
            const child_el = this._items.get(child.id);
            if (!child_el) continue;
            const height = child.properties.height || child_el.offsetHeight || 48;
            let span = Math.max(1, this._get_responsive_value(child.properties || {}, 'span', layout.breakpoint, 1));
            const min_width = child.properties && child.properties.min_width != null && child.properties.min_width !== ''
                ? Number(child.properties.min_width)
                : 0;
            const start_new_row = layout.mode === 'grid' && !!child.properties.new_row;
            span = Math.min(layout.columns, span || 1);
            while (layout.mode === 'grid' && min_width > 0 && span < layout.columns) {
                const spanned_width = column_width * span + layout.gap * (span - 1);
                if (spanned_width >= min_width) break;
                span++;
            }
            if (!current_row || start_new_row || current_row.span_total + span > layout.columns) {
                current_row = {
                    items: [],
                    span_total: 0,
                    height: 0,
                    before: 0,
                    after: 0
                };
                rows.push(current_row);
            }
            const item_spacing = this._resolve_item_spacing(child);
            current_row.items.push({
                child,
                child_el,
                span,
                height,
                spacing_before: item_spacing.before,
                spacing_after: item_spacing.after
            });
            current_row.span_total += span;
            current_row.height = Math.max(current_row.height, height);
            current_row.before = Math.max(current_row.before, item_spacing.before);
            current_row.after = Math.max(current_row.after, item_spacing.after);
        }

        let cursor_y = layout.padding;
        let previous_row_after = 0;
        rows.forEach((row, row_index) => {
            const row_top = row_index === 0
                ? cursor_y + row.before
                : cursor_y + layout.gap + Math.max(previous_row_after, row.before);
            let cursor_col = 0;
            for (const item of row.items) {
                const left = content_left + cursor_col * (column_width + layout.gap);
                const available_width = column_width * item.span + layout.gap * (item.span - 1);
                const width = this._resolve_auto_layout_width(item.child, item.child_el, available_width);
                place_child(item.child, left, row_top, width, item.height, true);
                cursor_col += item.span;
            }
            cursor_y = row_top + row.height;
            previous_row_after = row.after;
        });
    },

    _update_canvas_empty_state() {
        if (!this._surface_el || !this.document_model.root) return;
        let empty = this._surface_el.querySelector('.canvas-empty-state');
        const has_children = this.document_model.root.children.length > 0;

        if (has_children) {
            if (empty) empty.remove();
            return;
        }

        if (!empty) {
            empty = document.createElement('div');
            empty.className = 'canvas-empty-state';
            this._surface_el.appendChild(empty);
        }

        const title = this.document_model.root.properties.title || 'Untitled Form';
        empty.innerHTML = '';
        const badge = document.createElement('div');
        badge.className = 'canvas-empty-badge';
        badge.textContent = 'Form Canvas';
        const heading = document.createElement('h2');
        heading.textContent = title;
        const text = document.createElement('p');
        text.textContent = 'Choose a field from the left, then click or drag on the canvas. New forms start in a responsive grid, and the viewport strip lets you inspect desktop, tablet, and mobile widths.';
        empty.appendChild(badge);
        empty.appendChild(heading);
        empty.appendChild(text);
    },

    _is_container_node(node_or_id) {
        const node = typeof node_or_id === 'string' ? this.document_model.get_node(node_or_id) : node_or_id;
        if (!node) return false;
        const entry = this.control_registry.get(node.control_type);
        return !!(entry && entry.is_container);
    },

    _get_parent_layout_mode(node_or_id) {
        const node = typeof node_or_id === 'string' ? this.document_model.get_node(node_or_id) : node_or_id;
        if (!node) return 'none';
        const parent = this.document_model.get_parent(node.id);
        return parent && parent.properties ? (parent.properties.layout_mode || 'none') : 'none';
    },

    _is_layout_managed_node(node_or_id) {
        return this._get_parent_layout_mode(node_or_id) !== 'none';
    },

    _can_reorder_node(node_or_id) {
        const node = typeof node_or_id === 'string' ? this.document_model.get_node(node_or_id) : node_or_id;
        if (!node) return false;
        const parent = this.document_model.get_parent(node.id);
        return !!(parent && (parent.properties.layout_mode || 'none') !== 'none' && parent.children.length > 1);
    },

    _sync_parent_render_order(parent_id) {
        const parent = !parent_id || (this.document_model.root && parent_id === this.document_model.root.id)
            ? this.document_model.root
            : this.document_model.get_node(parent_id);
        const host = this._get_render_host(parent_id);
        if (!parent || !host) return;

        for (const child of parent.children) {
            const child_el = this._items.get(child.id);
            if (child_el && child_el.parentNode === host) {
                host.appendChild(child_el);
            }
        }
    },

    _move_node_in_parent(node_id, delta) {
        const node = this.document_model.get_node(node_id);
        if (!node) return;
        const parent = this.document_model.get_parent(node.id);
        if (!parent) return;
        const old_index = parent.children.indexOf(node);
        const new_index = Math.max(0, Math.min(parent.children.length - 1, old_index + delta));
        if (old_index < 0 || new_index === old_index) return;

        this.command_history.execute(new ReorderControlCommand(this.document_model, {
            node_id: node.id,
            old_parent_id: parent.id,
            old_index,
            new_parent_id: parent.id,
            new_index
        }));
        this.selection_model.select_exclusive(node.id);
        if (this._status_el) {
            this._status_el.textContent = delta < 0 ? 'Moved field earlier in the section' : 'Moved field later in the section';
        }
    },

    _get_render_host(parent_id) {
        if (!parent_id || !this.document_model.root || parent_id === this.document_model.root.id) {
            return this._surface_el;
        }

        const parent_el = this._items.get(parent_id);
        if (!parent_el) return this._surface_el;

        return parent_el.querySelector('[data-children-host="true"]') || parent_el;
    },

    _resolve_parent_id_for_target(target) {
        if (target) {
            const container_el = target.closest('.design-surface-item[data-container="true"]');
            if (container_el) return container_el.getAttribute('data-node-id');
        }

        const selected = this.selection_model.get_selected();
        if (selected.length === 1 && this._is_container_node(selected[0])) {
            return selected[0];
        }

        return this.document_model.root ? this.document_model.root.id : null;
    },

    _parse_lines(value, fallback) {
        return parseLines(value, fallback);
    }
};
