'use strict';

const { ChangePropertyCommand } = require('../../models/command_history');

module.exports = {
    _update_resize_handles() {
        this._surface_el.querySelectorAll('.resize-handle').forEach(h => h.remove());
        const selected = this.selection_model.get_selected();
        if (selected.length !== 1) return;
        const nid = selected[0], el = this._items.get(nid), node = this.document_model.get_node(nid);
        if (!el || !node) return;
        if (this._is_layout_managed_node(node)) return;
        const entry = this.control_registry.get(node.control_type);
        if (entry && entry.resizable === false) return;
        for (const dir of ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw']) {
            const h = document.createElement('div');
            h.className = 'resize-handle resize-' + dir;
            h.setAttribute('data-dir', dir);
            el.appendChild(h);
        }
    },

    _update_reorder_handles() {
        if (!this._surface_el) return;
        this._surface_el.querySelectorAll('.reorder-handle-bar').forEach(h => h.remove());
        const selected = this.selection_model.get_selected();
        if (selected.length !== 1) return;

        const node = this.document_model.get_node(selected[0]);
        const el = this._items.get(selected[0]);
        if (!node || !el || !this._can_reorder_node(node)) return;

        const parent = this.document_model.get_parent(node.id);
        const index = parent ? parent.children.indexOf(node) : -1;
        if (!parent || index < 0) return;

        const bar = document.createElement('div');
        bar.className = 'reorder-handle-bar';
        const mkBtn = (label, title, delta, disabled) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'reorder-handle-btn';
            btn.textContent = label;
            btn.title = title;
            btn.disabled = disabled;
            btn.addEventListener('mousedown', (e) => {
                e.preventDefault();
                e.stopPropagation();
            });
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this._move_node_in_parent(node.id, delta);
            });
            return btn;
        };

        bar.appendChild(mkBtn('↑', 'Move earlier', -1, index === 0));
        bar.appendChild(mkBtn('↓', 'Move later', 1, index === parent.children.length - 1));
        el.appendChild(bar);
    },

    _refresh_selection_overlays() {
        this._update_resize_handles();
        this._update_reorder_handles();
        this._update_quick_edit_bar();
        this._update_inline_add_buttons();
    },

    _clear_inline_add_menu() {
        if (!this._inline_add_menu) return;
        if (typeof this._inline_add_menu.cleanup === 'function') this._inline_add_menu.cleanup();
        if (this._inline_add_menu.menu && this._inline_add_menu.menu.parentNode) {
            this._inline_add_menu.menu.remove();
        }
        this._inline_add_menu = null;
    },

    _get_inline_add_context() {
        const selected = this.selection_model.get_selected();
        if (selected.length !== 1) return null;
        const node = this.document_model.get_node(selected[0]);
        if (!node) return null;

        if (this._is_container_node(node) && (node.properties.layout_mode || 'none') !== 'none') {
            return {
                parent_node: node,
                selected_node: node,
                host: this._get_render_host(node.id),
                insertion_index: node.children.length,
                mode: node.properties.layout_mode || 'none',
                kind: 'container-end'
            };
        }

        const parent = this.document_model.get_parent(node.id);
        if (!parent || (parent.properties.layout_mode || 'none') === 'none') return null;
        return {
            parent_node: parent,
            selected_node: node,
            host: this._get_render_host(parent.id),
            insertion_index: parent.children.indexOf(node) + 1,
            mode: parent.properties.layout_mode || 'none',
            kind: 'after-selected'
        };
    },

    _get_inline_add_slot_position(context) {
        const host = context.host;
        if (!host) return null;
        const host_width = host.clientWidth || parseInt(host.style.width, 10) || 220;
        const clamp_left = (value) => Math.max(14, Math.min(value, Math.max(14, host_width - 116)));

        if (context.kind === 'after-selected') {
            const anchor_el = this._items.get(context.selected_node.id);
            if (!anchor_el) return null;
            const left = clamp_left((parseInt(anchor_el.style.left, 10) || 0) + Math.min(52, Math.round((parseInt(anchor_el.style.width, 10) || 160) / 2)) - 46);
            const top = (parseInt(anchor_el.style.top, 10) || 0) + (parseInt(anchor_el.style.height, 10) || 48) + 12;
            return { left, top };
        }

        if (context.parent_node.children.length > 0) {
            let bottom = 0;
            let left = 18;
            for (const child of context.parent_node.children) {
                const child_el = this._items.get(child.id);
                if (!child_el) continue;
                const child_top = parseInt(child_el.style.top, 10) || 0;
                const child_height = parseInt(child_el.style.height, 10) || child_el.offsetHeight || 0;
                bottom = Math.max(bottom, child_top + child_height);
                left = parseInt(child_el.style.left, 10) || left;
            }
            return { left: clamp_left(left), top: bottom + 14 };
        }

        return {
            left: clamp_left(Math.round((host_width - 116) / 2)),
            top: 18
        };
    },

    _insert_inline_control(control_type, parent_id, index) {
        const entry = this.control_registry.get(control_type);
        if (!entry) return;
        const default_size = entry.default_size || [180, 48];
        this._clear_inline_add_menu();
        this._place_control_with_props(control_type, {
            ...this._default_control_properties(control_type),
            name: this._next_name(control_type),
            visible: true,
            enabled: true,
            x: 0,
            y: 0,
            width: default_size[0],
            height: default_size[1]
        }, parent_id, true, index);
        if (this._status_el) this._status_el.textContent = 'Added ' + (entry.label || control_type);
    },

    _open_inline_add_menu(context, trigger_button) {
        if (!context || !context.host || !trigger_button) return;
        this._clear_inline_add_menu();

        const menu = document.createElement('div');
        menu.className = 'inline-add-menu';
        const common_types = ['text_input', 'select', 'checkbox', 'button'];
        if (context.parent_node && context.parent_node.id === (this.document_model.root && this.document_model.root.id)) {
            common_types.push('panel');
        }
        const unique_types = Array.from(new Set(common_types));
        unique_types.forEach((control_type) => {
            const entry = this.control_registry.get(control_type);
            if (!entry) return;
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'inline-add-option';
            btn.textContent = (entry.icon ? entry.icon + ' ' : '') + entry.label;
            btn.addEventListener('mousedown', (e) => {
                e.preventDefault();
                e.stopPropagation();
            });
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this._insert_inline_control(control_type, context.parent_node.id, context.insertion_index);
            });
            menu.appendChild(btn);
        });

        menu.style.left = Math.max(10, trigger_button.offsetLeft) + 'px';
        menu.style.top = (trigger_button.offsetTop + trigger_button.offsetHeight + 8) + 'px';
        menu.addEventListener('mousedown', (e) => {
            e.preventDefault();
            e.stopPropagation();
        });
        context.host.appendChild(menu);

        const close = (event) => {
            if (menu.contains(event.target) || trigger_button.contains(event.target)) return;
            this._clear_inline_add_menu();
        };
        setTimeout(() => document.addEventListener('mousedown', close), 0);
        this._inline_add_menu = {
            menu,
            cleanup: () => document.removeEventListener('mousedown', close)
        };
    },

    _update_inline_add_buttons() {
        if (!this._surface_el) return;
        this._surface_el.querySelectorAll('.inline-add-slot').forEach((slot) => slot.remove());
        this._clear_inline_add_menu();

        const context = this._get_inline_add_context();
        if (!context || !context.host) return;

        const position = this._get_inline_add_slot_position(context);
        if (!position) return;

        const slot = document.createElement('button');
        slot.type = 'button';
        slot.className = 'inline-add-slot';
        slot.textContent = '+ Add field';
        slot.style.left = position.left + 'px';
        slot.style.top = position.top + 'px';
        slot.addEventListener('mousedown', (e) => {
            e.preventDefault();
            e.stopPropagation();
        });
        slot.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this._open_inline_add_menu(context, slot);
        });
        context.host.appendChild(slot);
    },

    _append_quick_choice_group(bar, options, current_value, on_select) {
        const group = document.createElement('div');
        group.className = 'quick-edit-choices';
        options.forEach((option) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'quick-edit-chip' + (option.value === current_value ? ' active' : '');
            btn.textContent = option.label;
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                on_select(option.value);
            });
            group.appendChild(btn);
        });
        bar.appendChild(group);
    },

    _update_quick_edit_bar() {
        if (!this._surface_el) return;
        this._surface_el.querySelectorAll('.quick-edit-bar').forEach((bar) => bar.remove());

        const selected = this.selection_model.get_selected();
        if (selected.length !== 1) return;

        const node = this.document_model.get_node(selected[0]);
        const el = this._items.get(selected[0]);
        if (!node || !el) return;

        const bar = document.createElement('div');
        bar.className = 'quick-edit-bar';
        const swallow = (e) => {
            e.preventDefault();
            e.stopPropagation();
        };
        bar.addEventListener('mousedown', swallow);

        const addButton = (label, class_name, on_click, active) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = class_name + (active ? ' active' : '');
            btn.textContent = label;
            btn.addEventListener('click', (e) => {
                swallow(e);
                on_click();
            });
            bar.appendChild(btn);
            return btn;
        };

        const primary_key = this._get_primary_inline_edit_property(node);
        if (primary_key) {
            const label = primary_key === 'title' ? 'Edit title' : (primary_key === 'text' ? 'Edit text' : 'Edit label');
            addButton(label, 'quick-edit-btn', () => this._start_inline_edit(node.id, el, primary_key), false);
        }

        if (this._node_supports_property(node, 'required')) {
            addButton('Required', 'quick-edit-btn', () => this._set_node_property(node.id, 'required', !node.properties.required), !!node.properties.required);
        }

        if (this._get_parent_layout_mode(node) !== 'none' && this._node_supports_property(node, 'width_policy')) {
            this._append_quick_choice_group(bar, [
                { label: 'Fill', value: 'fill' },
                { label: 'Fit', value: 'fit' },
                { label: 'Fixed', value: 'fixed' }
            ], this._get_width_policy(node), (value) => this._set_node_property(node.id, 'width_policy', value));
        }

        if (this._is_container_node(node) && (node.properties.layout_mode || 'none') !== 'none' && this._node_supports_property(node, 'density')) {
            this._append_quick_choice_group(bar, [
                { label: 'Compact', value: 'compact' },
                { label: 'Balanced', value: 'balanced' },
                { label: 'Airy', value: 'airy' }
            ], node.properties.density || 'balanced', (value) => this._set_node_property(node.id, 'density', value));

            const add_field_btn = addButton('+ Field', 'quick-edit-btn quick-edit-add-btn', () => {
                const context = {
                    parent_node: node,
                    selected_node: node,
                    host: this._get_render_host(node.id),
                    insertion_index: node.children.length,
                    mode: node.properties.layout_mode || 'none',
                    kind: 'container-end'
                };
                this._open_inline_add_menu(context, add_field_btn);
            }, false);
        }

        if (bar.childElementCount > 0) {
            el.appendChild(bar);
        }
    },

    _get_schema_field(node, key) {
        const resolved = typeof node === 'string' ? this.document_model.get_node(node) : node;
        if (!resolved) return null;
        const entry = this.control_registry.get(resolved.control_type);
        if (!entry || !Array.isArray(entry.property_schema)) return null;
        for (const group of entry.property_schema) {
            const field = (group.fields || []).find(item => item.key === key);
            if (field) return field;
        }
        return null;
    },

    _node_supports_property(node, key) {
        return !!this._get_schema_field(node, key);
    },

    _get_primary_inline_edit_property(node) {
        if (!node) return null;
        if (node.control_type === 'label') return 'text';
        if (['text_input', 'textarea', 'number_input', 'select', 'date_picker', 'color_picker'].includes(node.control_type)) return 'label';
        if (['button', 'checkbox', 'radio', 'toggle_switch', 'progress_bar', 'gauge'].includes(node.control_type)) return 'label';
        if (['panel', 'group_box'].includes(node.control_type)) return 'title';
        return null;
    },

    _set_node_property(node_id, key, new_value) {
        const node = this.document_model.get_node(node_id);
        if (!node || node.properties[key] === new_value) return;
        this.command_history.execute(new ChangePropertyCommand(this.document_model, {
            node_id,
            key,
            old_value: node.properties[key],
            new_value
        }));
    },

    _start_inline_edit(node_id, item_el, forced_prop_key = null) {
        if (this._inline_edit) this._end_inline_edit(false);
        const node = this.document_model.get_node(node_id);
        if (!node) return;
        const prop_key = forced_prop_key || this._get_primary_inline_edit_property(node);
        if (!prop_key) return;

        const current_val = node.properties[prop_key] || '';
        const inner = item_el.querySelector('.dsi-inner');
        if (!inner) return;

        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'inline-edit-input';
        input.value = current_val;
        input.style.left = '0';
        input.style.top = '0';
        input.style.width = (node.properties.width || 100) + 'px';
        input.style.height = (node.properties.height || 24) + 'px';
        inner.style.visibility = 'hidden';
        item_el.appendChild(input);

        input.addEventListener('mousedown', (e) => e.stopPropagation());

        let committed = false;
        this._inline_edit = { node_id, prop_key, input, inner, item_el };

        const commit = (save) => {
            if (committed) return;
            committed = true;
            this._end_inline_edit(save);
        };

        input.addEventListener('blur', () => commit(true));
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                commit(true);
            }
            if (e.key === 'Escape') {
                e.preventDefault();
                commit(false);
            }
            e.stopPropagation();
        });

        setTimeout(() => {
            input.focus();
            input.select();
        }, 0);
    },

    _end_inline_edit(save) {
        const ie = this._inline_edit;
        if (!ie) return;
        this._inline_edit = null;
        const val = ie.input.value;
        ie.inner.style.visibility = '';
        ie.input.remove();
        if (save) {
            const node = this.document_model.get_node(ie.node_id);
            if (node) {
                this.command_history.execute(new ChangePropertyCommand(this.document_model, {
                    node_id: ie.node_id,
                    key: ie.prop_key,
                    old_value: node.properties[ie.prop_key],
                    new_value: val
                }));
            }
        }
    }
};
