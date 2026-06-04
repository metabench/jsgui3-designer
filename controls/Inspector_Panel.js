/**
 * Inspector_Panel — Right-panel property inspector (Ch 7).
 *
 * Displays editable properties for the selected control.
 * Built from basic Controls since Property_Grid can't be deep-imported.
 */

'use strict';

const jsgui = require('jsgui3-client');
const Control = jsgui.Control;

class Inspector_Panel extends Control {
    constructor(spec = {}) {
        spec.__type_name = spec.__type_name || 'inspector_panel';
        super(spec);

        this.add_class('inspector-panel');

        this.document_model = spec.document_model;
        this.selection_model = spec.selection_model;
        this.command_history = spec.command_history;
        this.control_registry = spec.control_registry;

        this._current_node_id = null;
        this._editors = [];

        this.compose();
    }

    compose() {
        const { context } = this;

        // Title
        this._title = new Control({ context, tag_name: 'div' });
        this._title.add_class('inspector-title');
        this._title.add('Properties');
        this.add(this._title);

        // Subtitle showing selected control type
        this._subtitle = new Control({ context, tag_name: 'div' });
        this._subtitle.add_class('inspector-subtitle');
        this._subtitle.add('No selection');
        this.add(this._subtitle);

        // Scrollable properties container
        this._props_container = new Control({ context, tag_name: 'div' });
        this._props_container.add_class('inspector-props');
        this.add(this._props_container);
    }

    load_properties(node_id) {
        this._current_node_id = node_id;
        this._editors = [];

        if (!this._props_container.dom.el) return;

        // Clear existing
        this._props_container.dom.el.innerHTML = '';

        if (!node_id) {
            if (this._subtitle.dom.el) this._subtitle.dom.el.textContent = 'No selection';
            return;
        }

        const node = this.document_model.get_node(node_id);
        if (!node) return;

        const entry = this.control_registry.get(node.control_type);
        if (this._subtitle.dom.el) {
            this._subtitle.dom.el.textContent = entry ? entry.label : node.control_type;
        }

        const schema = entry ? entry.property_schema : [];

        // Build property rows by group
        for (const group of schema) {
            // Group header
            const group_hdr = document.createElement('div');
            group_hdr.className = 'inspector-group-header';
            group_hdr.textContent = group.group;
            this._props_container.dom.el.appendChild(group_hdr);

            for (const field of group.fields) {
                const row = document.createElement('div');
                row.className = 'inspector-row';

                const lbl = document.createElement('label');
                lbl.className = 'inspector-label';
                lbl.textContent = field.label;
                row.appendChild(lbl);

                const editor = this._create_editor(field, node.properties[field.key]);
                row.appendChild(editor);

                this._props_container.dom.el.appendChild(row);
            }
        }
    }

    _create_editor(field, value) {
        const container = document.createElement('div');
        container.className = 'inspector-editor';
        let input;

        switch (field.type) {
            case 'boolean': {
                input = document.createElement('input');
                input.type = 'checkbox';
                input.checked = !!value;
                input.addEventListener('change', () => {
                    this._on_property_change(field.key, input.checked);
                });
                break;
            }
            case 'number': {
                input = document.createElement('input');
                input.type = 'number';
                input.value = value != null ? value : '';
                if (field.min != null) input.min = field.min;
                if (field.max != null) input.max = field.max;
                input.addEventListener('change', () => {
                    this._on_property_change(field.key, parseFloat(input.value) || 0);
                });
                break;
            }
            case 'color': {
                input = document.createElement('input');
                input.type = 'color';
                input.value = value || '#ffffff';
                input.addEventListener('input', () => {
                    this._on_property_change(field.key, input.value);
                });
                break;
            }
            case 'enum': {
                input = document.createElement('select');
                for (const opt of (field.options || [])) {
                    const o = document.createElement('option');
                    o.value = opt;
                    o.textContent = opt;
                    if (opt === value) o.selected = true;
                    input.appendChild(o);
                }
                input.addEventListener('change', () => {
                    this._on_property_change(field.key, input.value);
                });
                break;
            }
            default: {
                // text
                input = document.createElement('input');
                input.type = 'text';
                input.value = value != null ? String(value) : '';
                input.addEventListener('change', () => {
                    this._on_property_change(field.key, input.value);
                });
                break;
            }
        }

        input.className = 'inspector-input';
        container.appendChild(input);

        this._editors.push({ key: field.key, input, type: field.type });
        return container;
    }

    _on_property_change(key, new_value) {
        if (!this._current_node_id) return;
        const node = this.document_model.get_node(this._current_node_id);
        if (!node) return;

        const old_value = node.properties[key];
        const { ChangePropertyCommand } = require('../models/command_history');
        const cmd = new ChangePropertyCommand(this.document_model, {
            node_id: this._current_node_id,
            key,
            old_value,
            new_value
        });
        this.command_history.execute(cmd);
    }

    refresh_values() {
        if (!this._current_node_id) return;
        const node = this.document_model.get_node(this._current_node_id);
        if (!node) return;

        for (const editor of this._editors) {
            const val = node.properties[editor.key];
            if (editor.type === 'boolean') {
                editor.input.checked = !!val;
            } else if (editor.type === 'number') {
                editor.input.value = val != null ? val : '';
            } else {
                editor.input.value = val != null ? String(val) : '';
            }
        }
    }

    activate() {
        super.activate();
        const that = this;

        // When selection changes, load new properties
        this.selection_model.on('change', (e) => {
            const selected = e.selected;
            if (selected.length === 1) {
                that.load_properties(selected[0]);
            } else {
                that.load_properties(null);
            }
        });

        // When a property changes externally (e.g., via undo/redo), refresh
        this.document_model.on('property-changed', (e) => {
            if (e.node_id === that._current_node_id) {
                that.refresh_values();
            }
        });

        // When a node is deleted and it was selected
        this.document_model.on('node-removed', (e) => {
            if (e.node.id === that._current_node_id) {
                that.load_properties(null);
            }
        });
    }
}

Inspector_Panel.css = `
.inspector-panel {
    width: 280px;
    min-width: 280px;
    background: #f8f9fa;
    border-left: 1px solid #dee2e6;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    font-family: 'Segoe UI', -apple-system, sans-serif;
}

.inspector-title {
    font-size: 13px;
    font-weight: 700;
    color: #333;
    padding: 12px 12px 2px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
}

.inspector-subtitle {
    font-size: 12px;
    color: #888;
    padding: 0 12px 8px;
    border-bottom: 1px solid #dee2e6;
}

.inspector-props {
    flex: 1;
    overflow-y: auto;
    padding: 4px 0;
}

.inspector-group-header {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: #666;
    padding: 10px 12px 4px;
    border-top: 1px solid #eee;
}
.inspector-group-header:first-child {
    border-top: none;
}

.inspector-row {
    display: flex;
    align-items: center;
    padding: 3px 12px;
    gap: 8px;
}

.inspector-label {
    width: 90px;
    min-width: 90px;
    font-size: 11px;
    color: #555;
    text-align: right;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.inspector-editor {
    flex: 1;
    min-width: 0;
}

.inspector-input {
    width: 100%;
    box-sizing: border-box;
    font-size: 11px;
    font-family: inherit;
    border: 1px solid #ccc;
    border-radius: 3px;
    padding: 3px 6px;
    background: #fff;
    color: #333;
    outline: none;
}
.inspector-input:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59,130,246,0.15);
}
.inspector-input[type="checkbox"] {
    width: auto;
    margin: 0;
}
.inspector-input[type="color"] {
    height: 24px;
    padding: 1px;
    cursor: pointer;
}
select.inspector-input {
    padding: 2px 4px;
}
`;

module.exports = Inspector_Panel;
