# Chapter 8 — The Document Model

## Why a Document Model?

The design canvas shows controls visually. The property grid shows their properties textually. The document outline shows them hierarchically. But all three of these are *views* — they display and manipulate the form, but they are not the form itself.

The document model is the form itself. It is the single source of truth: a hierarchical data structure that describes every control in the form, its properties, its position, its children, and its relationships. Every operation in the designer — placing a control, moving it, changing a property, reordering children, deleting — is ultimately a mutation of the document model.

## Structure

The document model is a tree. Each node represents a control:

```javascript
{
    id: "node_001",
    control_type: "panel",
    properties: {
        name: "pnlMain",
        title: "Main Panel",
        x: 0,
        y: 0,
        width: 780,
        height: 560,
        padding: 16,
        background_color: "#ffffff",
        show_border: true,
        layout_mode: "vertical"
    },
    children: [
        {
            id: "node_002",
            control_type: "text_input",
            properties: {
                name: "txtFirstName",
                label: "First Name",
                placeholder: "Enter your first name",
                required: true,
                x: 16,
                y: 16,
                width: 300,
                height: 32
            },
            children: []
        },
        {
            id: "node_003",
            control_type: "text_input",
            properties: {
                name: "txtLastName",
                label: "Last Name",
                placeholder: "Enter your last name",
                required: true,
                x: 16,
                y: 64,
                width: 300,
                height: 32
            },
            children: []
        },
        {
            id: "node_004",
            control_type: "button",
            properties: {
                name: "btnSubmit",
                label: "Submit",
                x: 16,
                y: 112,
                width: 120,
                height: 36,
                variant: "primary"
            },
            children: []
        }
    ]
}
```

The root node is typically a container control (like `Panel` or `Form_Container`) that represents the form itself.

## The Document_Model Class

```javascript
const { Data_Object } = require('lang-tools');

class Document_Model {
    constructor() {
        this.root = null;
        this.nodes = new Map();  // id → node
        this.listeners = [];
    }

    // ── Node Management ──

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
                const index = parent.children.indexOf(node);
                if (index >= 0) parent.children.splice(index, 1);
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
        node.parent_id = new_parent_id;
        if (new_index < 0 || new_index >= new_parent.children.length) {
            new_parent.children.push(node);
        } else {
            new_parent.children.splice(new_index, 0, node);
        }

        this.emit('node-moved', {
            node, old_parent_id, old_index, new_parent_id, new_index
        });
    }

    // ── Property Management ──

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

    // ── Queries ──

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

    // ── Serialization ──

    serialize() {
        return this._serialize_node(this.root);
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
        this.nodes.clear();
        this.root = this._deserialize_node(data, null);
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

    // ── Events ──

    on(event_name, handler) {
        this.listeners.push({ event_name, handler });
    }

    emit(event_name, data) {
        for (const listener of this.listeners) {
            if (listener.event_name === event_name) {
                listener.handler(data);
            }
        }
    }
}
```

## Observable Properties and Reactive Updates

The document model emits events for every mutation. This is the mechanism by which the three views — canvas, property grid, document outline — stay synchronised:

| Event | Triggered By | Canvas Response | Property Grid Response | Outline Response |
|-------|-------------|-----------------|----------------------|-----------------|
| `node-added` | Placing a control | Creates Design_Surface_Item | (none) | Adds tree node |
| `node-removed` | Deleting a control | Removes Design_Surface_Item | Clears if node was selected | Removes tree node |
| `node-moved` | Drag to new parent, reorder | Repositions item | Updates position fields | Moves tree node |
| `property-changed` | Property Grid edit, drag, resize | Updates control appearance | Updates editor value | Updates label if name changed |
| `document-loaded` | File open, import | Full recompose | Clear | Full recompose |

## The Flat Map Advantage

The `nodes` Map provides O(1) access to any node by ID, which is critical for performance. When the canvas needs to update a control after a property change, it does not need to walk the tree — it goes directly to the node via its ID.

The tree structure (parent/children pointers) is maintained for serialisation and for the document outline view, but the flat map is the primary access path during interactive editing.

## ID Generation

Node IDs need to be unique within a document. A simple approach is a counter combined with a document-level prefix:

```javascript
_generate_id() {
    this._counter = (this._counter || 0) + 1;
    return `node_${String(this._counter).padStart(4, '0')}`;
}
```

When deserialising, the counter is set to one beyond the highest existing node number to avoid collisions.

## Comparison with the Prototype

The WYSIWYG prototype stored form data as a flat `fields[]` array:

```javascript
// Prototype model
{
    fields: [
        { type: 'text', label: 'First Name', name: 'firstName', ... },
        { type: 'email', label: 'Email', name: 'email', ... }
    ],
    selectedFieldIndex: 0,
    mode: 'edit',
    formTitle: 'My Form'
}
```

This flat array has no concept of hierarchy. You cannot nest a group of fields inside a panel, or a panel inside a tabbed panel, or a tabbed panel inside a split pane. The production document model solves this with the tree structure, enabling arbitrarily deep nesting of container controls.

## Summary

The document model:

- Represents the form as a tree of nodes, each with an ID, control type, properties, and children.
- Provides a flat `Map` for O(1) node access.
- Emits events for all mutations, enabling reactive updates across all views.
- Supports serialisation and deserialisation for file save/load and JSON import/export.
- Replaces the prototype's flat array with a hierarchical structure that supports nested containers.
