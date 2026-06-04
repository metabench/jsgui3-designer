/**
 * Design_Surface_Item — Wrapper for a placed control on the canvas (Ch 5).
 *
 * Hosts a visual representation of the control with absolute positioning,
 * selection highlight, and a type badge.  Stores the node_id for linking
 * to the document model.
 */

'use strict';

const jsgui = require('jsgui3-client');
const Control = jsgui.Control;

class Design_Surface_Item extends Control {
    constructor(spec = {}) {
        spec.__type_name = spec.__type_name || 'design_surface_item';
        super(spec);

        this.add_class('design-surface-item');
        this.node_id = spec.node_id;
        this._control_type = spec.control_type || 'unknown';
        this._label = spec.label || this._control_type;

        // Absolute positioning
        const x = spec.x || 0;
        const y = spec.y || 0;
        const w = spec.width || 100;
        const h = spec.height || 32;

        this.dom.attributes.style =
            `position:absolute; left:${x}px; top:${y}px; width:${w}px; height:${h}px;`;
        this.dom.attributes['data-node-id'] = this.node_id;
        this.dom.attributes['data-control-type'] = this._control_type;

        // Inner: control type label + visual representation
        const inner = new Control({ context: this.context, tag_name: 'div' });
        inner.add_class('dsi-inner');

        const badge = new Control({ context: this.context, tag_name: 'span' });
        badge.add_class('dsi-badge');
        badge.add(this._label);
        inner.add(badge);

        this.add(inner);
    }

    set_position(x, y) {
        if (this.dom.el) {
            this.dom.el.style.left = x + 'px';
            this.dom.el.style.top = y + 'px';
        }
    }

    set_size(w, h) {
        if (this.dom.el) {
            this.dom.el.style.width = w + 'px';
            this.dom.el.style.height = h + 'px';
        }
    }

    set_selected(is_selected) {
        if (is_selected) {
            this.add_class('selected');
        } else {
            this.remove_class('selected');
        }
    }

    activate() {
        super.activate();
        // Clicks handled by Design_Canvas via delegation
    }
}

Design_Surface_Item.css = `
.design-surface-item {
    position: absolute;
    box-sizing: border-box;
    border: 1px solid rgba(0,0,0,0.15);
    background: #fff;
    cursor: default;
    user-select: none;
    transition: box-shadow 0.1s ease;
    display: flex;
    align-items: stretch;
}
.design-surface-item:hover {
    border-color: rgba(59, 130, 246, 0.4);
}
.design-surface-item.selected {
    outline: 2px solid #3b82f6;
    outline-offset: 1px;
    z-index: 5;
}
.dsi-inner {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    padding: 4px;
    font-size: 11px;
    color: #666;
    pointer-events: none;
}
.dsi-badge {
    font-size: 10px;
    color: #888;
    background: rgba(0,0,0,0.04);
    padding: 1px 6px;
    border-radius: 3px;
    white-space: nowrap;
}
.design-surface-item.selected .dsi-badge {
    background: rgba(59, 130, 246, 0.1);
    color: #3b82f6;
}
`;

module.exports = Design_Surface_Item;
