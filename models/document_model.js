/**
 * Document_Model — The single source of truth for the form design.
 *
 * A tree of nodes, each representing a control with an id, control_type,
 * properties, and children.  A flat Map provides O(1) access by id.
 *
 * Emits: node-added, node-removed, node-moved, property-changed, document-loaded
 */

'use strict';

class Document_Model {
    constructor() {
        this.root = null;
        this.nodes = new Map();   // id → node
        this._listeners = [];
        this._counter = 0;

        // Canvas-level metadata
        this.canvas_width = 800;
        this.canvas_height = 600;
        this.grid_size = [8, 8];
        this.canvas_background = '#ffffff';
        this.created = new Date().toISOString();
        this.author = '';
    }

    // ── Node Management ─────────────────────────────────────────────

    create_node(control_type, properties = {}) {
        const id = this._generate_id();
        const node = {
            id,
            control_type,
            properties: { ...properties },
            children: [],
            parent_id: null
        };
        this.nodes.set(id, node);
        return node;
    }

    add_child(parent_id, node, index = -1) {
        const parent = this.nodes.get(parent_id);
        if (!parent) throw new Error(`Parent node ${parent_id} not found`);

        node.parent_id = parent_id;
        if (index < 0 || index >= parent.children.length) {
            parent.children.push(node);
        } else {
            parent.children.splice(index, 0, node);
        }

        this.emit('node-added', { node, parent_id, index });
    }

    remove_node(node_id) {
        const node = this.nodes.get(node_id);
        if (!node) return;

        // Remove from parent's children
        if (node.parent_id) {
            const parent = this.nodes.get(node.parent_id);
            if (parent) {
                const idx = parent.children.indexOf(node);
                if (idx >= 0) parent.children.splice(idx, 1);
            }
        }

        // Recursively remove descendants
        this._remove_descendants(node);
        this.nodes.delete(node_id);
        this.emit('node-removed', { node });
    }

    move_node(node_id, new_parent_id, new_index) {
        const node = this.nodes.get(node_id);
        if (!node) return;

        const old_parent_id = node.parent_id;
        const old_parent = this.nodes.get(old_parent_id);
        const old_index = old_parent ? old_parent.children.indexOf(node) : -1;

        // Remove from old parent
        if (old_parent && old_index >= 0) {
            old_parent.children.splice(old_index, 1);
        }

        // Add to new parent
        const new_parent = this.nodes.get(new_parent_id);
        if (!new_parent) throw new Error(`New parent ${new_parent_id} not found`);
        node.parent_id = new_parent_id;
        if (new_index < 0 || new_index >= new_parent.children.length) {
            new_parent.children.push(node);
            new_index = new_parent.children.length - 1;
        } else {
            new_parent.children.splice(new_index, 0, node);
        }

        this.emit('node-moved', {
            node, old_parent_id, old_index, new_parent_id, new_index
        });
    }

    // ── Property Management ─────────────────────────────────────────

    set_property(node_id, key, value) {
        const node = this.nodes.get(node_id);
        if (!node) return;

        const old = node.properties[key];
        node.properties[key] = value;

        this.emit('property-changed', { node_id, key, value, old });
    }

    get_property(node_id, key) {
        const node = this.nodes.get(node_id);
        return node ? node.properties[key] : undefined;
    }

    // ── Queries ──────────────────────────────────────────────────────

    get_node(node_id) {
        return this.nodes.get(node_id);
    }

    get_children(node_id) {
        const node = this.nodes.get(node_id);
        return node ? node.children.slice() : [];
    }

    get_parent(node_id) {
        const node = this.nodes.get(node_id);
        return node && node.parent_id ? this.nodes.get(node.parent_id) : null;
    }

    get_ancestors(node_id) {
        const result = [];
        let current = this.get_parent(node_id);
        while (current) {
            result.push(current);
            current = this.get_parent(current.id);
        }
        return result;
    }

    // ── Initialise Root ──────────────────────────────────────────────

    init_root(properties = {}) {
        const root = this.create_node('form_container', {
            name: 'frmMain',
            title: 'Untitled Form',
            description: 'Add fields, sections, and actions to shape the form.',
            layout_mode: 'grid',
            spacing_mode: 'semantic',
            density: 'balanced',
            inset_style: 'padded',
            section_separation: 'medium',
            padding: 24,
            gap: 16,
            columns_desktop: 2,
            columns_tablet: 2,
            columns_mobile: 1,
            surface_max_width: 1180,
            submit_label: 'Submit',
            style_preset: 'studio_blue',
            ...properties
        });
        this.root = root;
        return root;
    }

    // ── Serialization ────────────────────────────────────────────────

    serialize() {
        if (!this.root) return null;
        return {
            meta: {
                canvas_width: this.canvas_width,
                canvas_height: this.canvas_height,
                grid_size: this.grid_size.slice(),
                canvas_background: this.canvas_background,
                created: this.created,
                author: this.author
            },
            root: this._serialize_node(this.root)
        };
    }

    _serialize_node(node) {
        return {
            id: node.id,
            control_type: node.control_type,
            properties: { ...node.properties },
            children: node.children.map(child => this._serialize_node(child))
        };
    }

    deserialize(data) {
        const root_data = data && data.root ? data.root : data;
        const meta = data && data.meta ? data.meta : null;
        this.nodes.clear();
        this.root = this._deserialize_node(root_data, null);

        if (meta) {
            if (meta.canvas_width != null) this.canvas_width = meta.canvas_width;
            if (meta.canvas_height != null) this.canvas_height = meta.canvas_height;
            if (Array.isArray(meta.grid_size) && meta.grid_size.length === 2) {
                this.grid_size = meta.grid_size.slice(0, 2);
            }
            if (meta.canvas_background) this.canvas_background = meta.canvas_background;
            if (meta.created) this.created = meta.created;
            if (meta.author != null) this.author = meta.author;
        }

        // Reset counter beyond highest existing id
        let max = 0;
        for (const id of this.nodes.keys()) {
            const num = parseInt(id.replace('node_', ''), 10);
            if (!isNaN(num) && num > max) max = num;
        }
        this._counter = max;

        this.emit('document-loaded', { root: this.root });
    }

    _deserialize_node(data, parent_id) {
        const node = {
            id: data.id,
            control_type: data.control_type,
            properties: { ...data.properties },
            children: [],
            parent_id
        };
        this.nodes.set(node.id, node);
        node.children = (data.children || []).map(
            child => this._deserialize_node(child, node.id)
        );
        return node;
    }

    // ── Events ───────────────────────────────────────────────────────

    on(event_name, handler) {
        this._listeners.push({ event_name, handler });
    }

    off(event_name, handler) {
        this._listeners = this._listeners.filter(
            l => !(l.event_name === event_name && l.handler === handler)
        );
    }

    emit(event_name, data) {
        for (const listener of this._listeners) {
            if (listener.event_name === event_name) {
                listener.handler(data);
            }
        }
    }

    // ── Internals ────────────────────────────────────────────────────

    _generate_id() {
        this._counter++;
        return `node_${String(this._counter).padStart(4, '0')}`;
    }

    _remove_descendants(node) {
        for (const child of node.children) {
            this._remove_descendants(child);
            this.nodes.delete(child.id);
        }
    }
}

module.exports = Document_Model;
