/**
 * Design_Canvas — The central design surface (Ch 5).
 *
 * A scrollable canvas with a grid background where controls are placed.
 * Modes: 'select', 'place', 'preview'.
 */

'use strict';

const jsgui = require('jsgui3-client');
const Control = jsgui.Control;
const Design_Surface_Item = require('./Design_Surface_Item');

class Design_Canvas extends Control {
    constructor(spec = {}) {
        spec.__type_name = spec.__type_name || 'design_canvas';
        super(spec);

        this.add_class('design-canvas');
        this.dom.attributes.role = 'application';
        this.dom.attributes['aria-label'] = 'Design canvas';

        // Models
        this.document_model = spec.document_model;
        this.selection_model = spec.selection_model;
        this.command_history = spec.command_history;
        this.control_registry = spec.control_registry;

        // Canvas config
        this.grid_size = spec.grid_size || [8, 8];
        this.canvas_width = spec.canvas_width || 800;
        this.canvas_height = spec.canvas_height || 600;
        this._mode = 'select';
        this._placement_type = null;

        // Map node_id → Design_Surface_Item
        this._items = new Map();

        this.compose();
    }

    compose() {
        const { context } = this;

        // The surface is the fixed-size area where controls live
        this.surface = new Control({ context, tag_name: 'div' });
        this.surface.add_class('design-surface');
        this.surface.dom.attributes.style =
            `width:${this.canvas_width}px; height:${this.canvas_height}px;` +
            `--canvas-grid-x:${this.grid_size[0]}px; --canvas-grid-y:${this.grid_size[1]}px;`;

        this.add(this.surface);

        // Mode indicator
        this._mode_label = new Control({ context, tag_name: 'div' });
        this._mode_label.add_class('canvas-mode-label');
        this._mode_label.add('Select');
        this.add(this._mode_label);
    }

    set_mode(mode, options = {}) {
        this._mode = mode;
        this._placement_type = options.control_type || null;

        // Update cursor
        if (this.surface && this.surface.dom.el) {
            this.surface.dom.el.style.cursor = mode === 'place' ? 'crosshair' : 'default';
        }

        // Update mode label
        if (this._mode_label && this._mode_label.dom.el) {
            if (mode === 'place') {
                const entry = this.control_registry.get(this._placement_type);
                this._mode_label.dom.el.textContent = 'Place: ' + (entry ? entry.label : this._placement_type);
            } else if (mode === 'preview') {
                this._mode_label.dom.el.textContent = 'Preview';
            } else {
                this._mode_label.dom.el.textContent = 'Select';
            }
        }
    }

    place_control(control_type, x, y) {
        const { context, document_model, command_history, control_registry } = this;
        if (!document_model || !document_model.root) return null;

        const entry = control_registry.get(control_type);
        if (!entry) return null;

        const [w, h] = entry.default_size;

        // Snap to grid
        const gx = this.grid_size[0], gy = this.grid_size[1];
        const sx = Math.round(x / gx) * gx;
        const sy = Math.round(y / gy) * gy;

        // Create node in document model
        const node_id = document_model._generate_id();
        const properties = {
            name: control_type + '_' + node_id.replace('node_', ''),
            visible: true,
            enabled: true,
            x: sx,
            y: sy,
            width: w,
            height: h
        };

        // Use command for undo support
        const { AddControlCommand } = require('../models/command_history');
        const cmd = new AddControlCommand(document_model, {
            node_id,
            control_type,
            parent_id: document_model.root.id,
            index: -1,
            properties
        });
        command_history.execute(cmd);

        // Select the new control
        this.selection_model.select_exclusive(node_id);

        return node_id;
    }

    _create_surface_item(node) {
        const entry = this.control_registry.get(node.control_type);
        const item = new Design_Surface_Item({
            context: this.context,
            node_id: node.id,
            control_type: node.control_type,
            label: entry ? entry.label : node.control_type,
            x: node.properties.x || 0,
            y: node.properties.y || 0,
            width: node.properties.width || (entry ? entry.default_size[0] : 100),
            height: node.properties.height || (entry ? entry.default_size[1] : 32),
        });

        this._items.set(node.id, item);
        this.surface.add(item);

        // If already in the DOM, we need to tell jsgui to render it
        if (this.surface.dom.el) {
            const el = document.createElement('div');
            // Let jsgui handle it through its normal rendering
            item.dom.el = el;
            item.render_to_el(el);
            this.surface.dom.el.appendChild(el.firstChild || el);
            // Re-get the element after render
            if (item.dom.el) {
                item.activate();
            }
        }

        return item;
    }

    _remove_surface_item(node_id) {
        const item = this._items.get(node_id);
        if (item && item.dom.el) {
            item.dom.el.remove();
        }
        this._items.delete(node_id);
    }

    get_surface_item(node_id) {
        return this._items.get(node_id);
    }

    _update_selection_visuals() {
        for (const [id, item] of this._items) {
            item.set_selected(this.selection_model.is_selected(id));
        }
    }

    activate() {
        super.activate();
        const that = this;

        // ── Canvas click handler ─────────────────────────────────
        if (this.surface && this.surface.dom.el) {
            this.surface.dom.el.addEventListener('mousedown', (e) => {
                if (that._mode === 'preview') return;

                const rect = that.surface.dom.el.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                // Check if clicked on a surface item
                const target = e.target.closest('.design-surface-item');

                if (that._mode === 'place' && that._placement_type) {
                    // Place a new control
                    that.place_control(that._placement_type, x, y);
                    // Switch back to select mode (one-shot)
                    that.set_mode('select');
                    // Notify palette to reset
                    that.emit('placement-complete', {});
                } else if (target) {
                    // Clicked on a control — select it
                    const node_id = target.getAttribute('data-node-id');
                    if (node_id) {
                        if (e.ctrlKey || e.metaKey) {
                            that.selection_model.toggle(node_id);
                        } else {
                            that.selection_model.select_exclusive(node_id);
                        }
                    }
                } else {
                    // Clicked on empty space — clear selection
                    that.selection_model.clear();
                }
            });
        }

        // ── Keyboard handler ─────────────────────────────────────
        if (this.dom.el) {
            this.dom.el.setAttribute('tabindex', '0');
            this.dom.el.addEventListener('keydown', (e) => {
                if (e.key === 'Delete' || e.key === 'Backspace') {
                    const selected = that.selection_model.get_selected();
                    if (selected.length > 0) {
                        const { DeleteControlCommand, CompoundCommand } = require('../models/command_history');
                        if (selected.length === 1) {
                            const cmd = new DeleteControlCommand(that.document_model, { node_id: selected[0] });
                            that.command_history.execute(cmd);
                        } else {
                            const cmds = selected.map(id =>
                                new DeleteControlCommand(that.document_model, { node_id: id })
                            );
                            that.command_history.execute(new CompoundCommand('Delete controls', cmds));
                        }
                        that.selection_model.clear();
                        e.preventDefault();
                    }
                } else if (e.key === 'Escape') {
                    if (that._mode === 'place') {
                        that.set_mode('select');
                        that.emit('placement-complete', {});
                    }
                    that.selection_model.clear();
                } else if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
                    if (e.shiftKey) {
                        that.command_history.redo();
                    } else {
                        that.command_history.undo();
                    }
                    e.preventDefault();
                } else if (e.key === 'y' && (e.ctrlKey || e.metaKey)) {
                    that.command_history.redo();
                    e.preventDefault();
                } else if (e.key === 'a' && (e.ctrlKey || e.metaKey)) {
                    // Select all
                    const root = that.document_model.root;
                    if (root) {
                        for (const child of root.children) {
                            that.selection_model.select_add(child.id);
                        }
                    }
                    e.preventDefault();
                }
            });
        }

        // ── Listen to document model events ──────────────────────
        this.document_model.on('node-added', (e) => {
            that._create_surface_item(e.node);
        });

        this.document_model.on('node-removed', (e) => {
            that._remove_surface_item(e.node.id);
        });

        this.document_model.on('property-changed', (e) => {
            const item = that._items.get(e.node_id);
            if (!item) return;
            if (e.key === 'x' || e.key === 'y') {
                const node = that.document_model.get_node(e.node_id);
                if (node) item.set_position(node.properties.x || 0, node.properties.y || 0);
            }
            if (e.key === 'width' || e.key === 'height') {
                const node = that.document_model.get_node(e.node_id);
                if (node) item.set_size(node.properties.width || 100, node.properties.height || 32);
            }
        });

        this.document_model.on('document-loaded', () => {
            // Clear all existing items
            for (const [id] of that._items) {
                that._remove_surface_item(id);
            }
            // Recreate from document model root
            if (that.document_model.root) {
                for (const child of that.document_model.root.children) {
                    that._create_surface_item(child);
                }
            }
        });

        // ── Listen to selection changes ──────────────────────────
        this.selection_model.on('change', () => {
            that._update_selection_visuals();
        });
    }

    // Simple event emitter for canvas-specific events
    emit(name, data) {
        if (!this._canvas_listeners) return;
        for (const l of this._canvas_listeners) {
            if (l.name === name) l.handler(data);
        }
    }

    on(name, handler) {
        if (!this._canvas_listeners) this._canvas_listeners = [];
        this._canvas_listeners.push({ name, handler });
    }
}

Design_Canvas.css = `
.design-canvas {
    flex: 1;
    overflow: auto;
    background: #e8eaed;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 24px;
    position: relative;
}

.design-surface {
    position: relative;
    background-color: #ffffff;
    background-image:
        radial-gradient(circle, rgba(0,0,0,0.08) 1px, transparent 1px);
    background-size: var(--canvas-grid-x, 8px) var(--canvas-grid-y, 8px);
    box-shadow: 0 2px 12px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.06);
    border-radius: 2px;
    flex-shrink: 0;
}

.canvas-mode-label {
    position: absolute;
    bottom: 8px;
    right: 12px;
    font-size: 11px;
    color: #888;
    background: rgba(255,255,255,0.85);
    padding: 2px 8px;
    border-radius: 3px;
    pointer-events: none;
}
`;

module.exports = Design_Canvas;
