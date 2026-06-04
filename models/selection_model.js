/**
 * Selection_Model — Observable selection state.
 *
 * Tracks which node IDs are selected and emits 'change' when the
 * selection changes.  Used by the canvas, inspector, and outline.
 */

'use strict';

class Selection_Model {
    constructor() {
        this._selected = new Set();
        this._listeners = [];
    }

    select_exclusive(node_id) {
        this._selected.clear();
        this._selected.add(node_id);
        this._emit('change');
    }

    select_add(node_id) {
        this._selected.add(node_id);
        this._emit('change');
    }

    deselect(node_id) {
        this._selected.delete(node_id);
        this._emit('change');
    }

    toggle(node_id) {
        if (this._selected.has(node_id)) {
            this._selected.delete(node_id);
        } else {
            this._selected.add(node_id);
        }
        this._emit('change');
    }

    clear() {
        if (this._selected.size === 0) return;
        this._selected.clear();
        this._emit('change');
    }

    get_selected() {
        return Array.from(this._selected);
    }

    is_selected(node_id) {
        return this._selected.has(node_id);
    }

    get count() {
        return this._selected.size;
    }

    // ── Events ────────────────────────────────────────────────────

    on(event, handler) {
        this._listeners.push({ event, handler });
    }

    off(event, handler) {
        this._listeners = this._listeners.filter(
            l => !(l.event === event && l.handler === handler)
        );
    }

    _emit(event) {
        const data = { selected: this.get_selected() };
        for (const l of this._listeners) {
            if (l.event === event) l.handler(data);
        }
    }
}

module.exports = Selection_Model;
