# Chapter 22 — Clipboard & Copy-Paste

> *How to implement Cut, Copy, Paste, and Duplicate for controls on the design canvas, using serialization to bridge the clipboard — so the form builder feels as natural as a desktop application.*

## 22.1 Why Clipboard Matters

Clipboard operations are one of the most instinctive interactions in any visual editor. Users expect Ctrl+C, Ctrl+V, Ctrl+X, and Ctrl+D to work just like they do in every other application. A form builder that doesn't support clipboard is immediately frustrating.

But clipboard in a visual designer is more complex than copying text. We need to:

1. **Serialize** one or more controls (including nested children) into a portable format.
2. **Store** that representation on the system clipboard (for cross-window paste) or an internal buffer.
3. **Deserialize** the representation back into new controls with new unique IDs.
4. **Handle positioning** — where do pasted controls appear?
5. **Integrate with undo/redo** — paste and cut are undoable commands.
6. **Handle cross-form paste** — copying from one form and pasting into another.

## 22.2 The Clipboard Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      User Action                         │
│                                                         │
│  Ctrl+C / Ctrl+X / Ctrl+V / Ctrl+D                     │
└──────────────────────┬──────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────┐
│               Clipboard Manager                          │
│                                                         │
│  copy(selection)     → serialize → clipboard buffer      │
│  cut(selection)      → serialize → clipboard + delete    │
│  paste(position)     → deserialize → new controls        │
│  duplicate(selection)→ serialize → deserialize in-place   │
└──────────────┬──────────────────────┬───────────────────┘
               ▼                      ▼
    ┌──────────────────┐  ┌──────────────────────┐
    │ System Clipboard │  │ Internal Buffer      │
    │ (navigator.      │  │ (for duplicate and   │
    │  clipboard API)  │  │  fallback)           │
    └──────────────────┘  └──────────────────────┘
```

### Why Both System and Internal Clipboard?

- **System clipboard** enables cross-window, cross-tab paste. The user can copy controls from one form and paste into another open in a different tab.
- **Internal buffer** is a fallback for when the Clipboard API is unavailable (some browsers restrict it) and is used for Duplicate (which doesn't need to involve the system clipboard).

## 22.3 Serialization Format

Controls are serialized to JSON using the same `.form.json` sub-tree format from Chapter 11:

```json
{
    "clipboard_type": "jsgui3-designer-controls",
    "version": "1.0",
    "source_canvas_size": { "width": 800, "height": 600 },
    "nodes": [
        {
            "id": "node_0042",
            "control_type": "text_input",
            "properties": {
                "name": "txtEmail",
                "label": "Email Address",
                "input_type": "email",
                "x": 16,
                "y": 64,
                "width": 300,
                "height": 32
            },
            "children": []
        }
    ]
}
```

**Key decisions**:
- **Include a type marker** (`clipboard_type`) so paste can identify our format vs. plain text.
- **Preserve relative positions** — when copying multiple controls, store their absolute positions. When pasting, offset them relative to the paste point.
- **Include children recursively** — copying a Panel copies all its children.
- **Don't include IDs in the deserialized result** — generate new unique IDs to prevent collisions.

## 22.4 Operations in Detail

### Copy (Ctrl+C)

```javascript
async copy(selection) {
    const nodes = selection.get_selected_nodes();
    if (nodes.length === 0) return;

    const payload = {
        clipboard_type: 'jsgui3-designer-controls',
        version: '1.0',
        source_canvas_size: this.canvas.get_size(),
        nodes: nodes.map(node => this.document_model.serialize_node(node))
    };

    const json = JSON.stringify(payload, null, 2);

    // Store internally (always works)
    this._internal_buffer = payload;

    // Try system clipboard (may fail in some browsers)
    try {
        await navigator.clipboard.writeText(json);
    } catch (e) {
        console.warn('System clipboard unavailable, using internal buffer');
    }
}
```

### Cut (Ctrl+X)

Cut = Copy + Delete, wrapped in a compound command for undo:

```javascript
async cut(selection) {
    await this.copy(selection);

    const nodes = selection.get_selected_nodes();
    const command = new CompoundCommand('Cut Controls', [
        ...nodes.map(node => new DeleteControlCommand(this.document_model, node.id))
    ]);
    this.command_history.execute(command);
}
```

### Paste (Ctrl+V)

```javascript
async paste(target_position) {
    let payload = this._internal_buffer;

    // Try reading from system clipboard
    try {
        const text = await navigator.clipboard.readText();
        const parsed = JSON.parse(text);
        if (parsed.clipboard_type === 'jsgui3-designer-controls') {
            payload = parsed;
        }
    } catch (e) {
        // Use internal buffer
    }

    if (!payload || payload.nodes.length === 0) return;

    // Calculate offset from original position to paste position
    const bounds = this._calculate_bounds(payload.nodes);
    const offset = {
        dx: target_position.x - bounds.x,
        dy: target_position.y - bounds.y
    };

    // Offset by a small amount to visually distinguish from original
    if (offset.dx === 0 && offset.dy === 0) {
        offset.dx = 16;
        offset.dy = 16;
    }

    // Deep clone with new IDs and offset positions
    const new_nodes = payload.nodes.map(node =>
        this._clone_with_new_ids(node, offset)
    );

    const command = new CompoundCommand('Paste Controls', [
        ...new_nodes.map(node =>
            new AddControlCommand(this.document_model, node, this._active_container)
        )
    ]);
    this.command_history.execute(command);

    // Select the newly pasted controls
    this.selection.select_exclusive(new_nodes.map(n => n.id));
}
```

### Duplicate (Ctrl+D)

Duplicate is a shortcut for copy-paste-in-place with a small offset:

```javascript
duplicate(selection) {
    const nodes = selection.get_selected_nodes();
    if (nodes.length === 0) return;

    const offset = { dx: 16, dy: 16 };
    const new_nodes = nodes.map(node => {
        const serialized = this.document_model.serialize_node(node);
        return this._clone_with_new_ids(serialized, offset);
    });

    const command = new CompoundCommand('Duplicate Controls', [
        ...new_nodes.map(node =>
            new AddControlCommand(this.document_model, node, node.parent_id)
        )
    ]);
    this.command_history.execute(command);

    this.selection.select_exclusive(new_nodes.map(n => n.id));
}
```

### ID Regeneration (Deep Clone)

When pasting or duplicating, all node IDs in the subtree must be regenerated to prevent collisions:

```javascript
_clone_with_new_ids(node, offset = { dx: 0, dy: 0 }) {
    const id_map = new Map();

    function regenerate(n) {
        const old_id = n.id;
        const new_id = generate_unique_id();
        id_map.set(old_id, new_id);

        return {
            ...n,
            id: new_id,
            properties: {
                ...n.properties,
                x: (n.properties.x || 0) + offset.dx,
                y: (n.properties.y || 0) + offset.dy,
                name: n.properties.name + '_copy'
            },
            children: (n.children || []).map(child => regenerate(child))
        };
    }

    return regenerate(node);
}
```

## 22.5 Paste Positioning Rules

| Scenario | Paste Position |
|----------|---------------|
| **First paste after copy** | Original position + 16px offset (down-right) |
| **Second paste** | Previous paste position + 16px offset |
| **Paste with right-click** | At the right-click position |
| **Paste into a different container** | Top-left of the target container |
| **Paste from another form** | Centre of the current canvas viewport |

## 22.6 Edge Cases

| Edge Case | Handling |
|-----------|---------|
| **Paste control with same name** | Append `_copy`, `_copy2`, etc. to the `name` property |
| **Paste into a read-only form** | Disable paste (Ctrl+V does nothing) |
| **Copy container with children** | Deep copy: serialize entire subtree including all children |
| **Paste from non-designer source** | If clipboard contains plain text (not our JSON), ignore silently |
| **Paste at canvas edge** | Clamp to canvas bounds, or expand canvas if auto-expand is enabled |
| **Browser denies clipboard access** | Fall back to internal buffer. Show a non-blocking toast: "Clipboard access denied — using internal clipboard" |

---

*Next: [Chapter 23 — Testing the Designer](ch23-testing-the-designer.md)*
