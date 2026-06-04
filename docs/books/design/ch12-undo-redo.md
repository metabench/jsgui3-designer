# Chapter 12 — Undo/Redo & the Command Pattern

## Why Undo Matters

Undo is not a convenience feature — it is a safety net that fundamentally changes how users interact with a tool. Without undo, every action is irreversible, and the user must be cautious. With undo, every action is exploratory, and the user can try things freely.

A visual designer without undo is a visual designer that nobody trusts.

## The Command Pattern

The Command Pattern is the standard solution for undo/redo. Every operation — every placement, every move, every resize, every property change, every deletion — is encapsulated in a command object with two methods:

```javascript
class Command {
    execute() {
        // Perform the operation
    }

    undo() {
        // Reverse the operation
    }
}
```

A command history maintains two stacks:

```
Undo Stack                    Redo Stack
┌────────────────────┐       ┌────────────────────┐
│ ChangePropertyCmd  │       │ (empty)             │
│ MoveControlCmd     │       │                     │
│ AddControlCmd      │       │                     │
│ AddControlCmd      │       │                     │
└────────────────────┘       └────────────────────┘
```

When the user presses Ctrl+Z,the top command is popped from the undo stack, its `undo()` method is called, and it is pushed onto the redo stack. Ctrl+Y does the reverse.

## The Command History Class

```javascript
class Command_History {
    constructor() {
        this._undo_stack = [];
        this._redo_stack = [];
        this._listeners = [];
        this._max_history = 100;
    }

    execute(cmd) {
        cmd.execute();
        this._undo_stack.push(cmd);
        this._redo_stack = [];  // New action clears redo stack

        // Trim history if too long
        if (this._undo_stack.length > this._max_history) {
            this._undo_stack.shift();
        }

        this._emit('execute', { command: cmd });
        this._emit('state-change');
    }

    undo() {
        if (this._undo_stack.length === 0) return false;
        const cmd = this._undo_stack.pop();
        cmd.undo();
        this._redo_stack.push(cmd);
        this._emit('undo', { command: cmd });
        this._emit('state-change');
        return true;
    }

    redo() {
        if (this._redo_stack.length === 0) return false;
        const cmd = this._redo_stack.pop();
        cmd.execute();
        this._undo_stack.push(cmd);
        this._emit('redo', { command: cmd });
        this._emit('state-change');
        return true;
    }

    can_undo() { return this._undo_stack.length > 0; }
    can_redo() { return this._redo_stack.length > 0; }

    get_undo_label() {
        if (this._undo_stack.length === 0) return null;
        return this._undo_stack[this._undo_stack.length - 1].label;
    }

    get_redo_label() {
        if (this._redo_stack.length === 0) return null;
        return this._redo_stack[this._redo_stack.length - 1].label;
    }

    clear() {
        this._undo_stack = [];
        this._redo_stack = [];
        this._emit('state-change');
    }

    on(event, handler) {
        this._listeners.push({ event, handler });
    }

    _emit(event, data) {
        for (const l of this._listeners) {
            if (l.event === event) l.handler(data || {});
        }
    }
}
```

### Toolbar Integration

The undo and redo buttons in the `Designer_Toolbar` are wired to the command history:

```javascript
command_history.on('state-change', () => {
    undo_button.set_enabled(command_history.can_undo());
    redo_button.set_enabled(command_history.can_redo());

    // Update tooltips with action labels
    undo_button.set_tooltip(
        command_history.can_undo()
            ? `Undo ${command_history.get_undo_label()}`
            : 'Nothing to undo'
    );
    redo_button.set_tooltip(
        command_history.can_redo()
            ? `Redo ${command_history.get_redo_label()}`
            : 'Nothing to redo'
    );
});
```

## Command Implementations

### AddControlCommand

```javascript
class AddControlCommand {
    constructor(document_model, { node_id, control_type, parent_id, index, properties }) {
        this.label = `Add ${control_type}`;
        this.document_model = document_model;
        this.node_id = node_id;
        this.control_type = control_type;
        this.parent_id = parent_id;
        this.index = index;
        this.properties = { ...properties };
    }

    execute() {
        const node = this.document_model.create_node(
            this.control_type, this.properties
        );
        node.id = this.node_id;
        this.document_model.nodes.set(node.id, node);
        this.document_model.add_child(this.parent_id, node, this.index);
    }

    undo() {
        this.document_model.remove_node(this.node_id);
    }
}
```

### MoveControlCommand

```javascript
class MoveControlCommand {
    constructor(document_model, { node_id, old_pos, new_pos }) {
        this.label = 'Move control';
        this.document_model = document_model;
        this.node_id = node_id;
        this.old_pos = old_pos;
        this.new_pos = new_pos;
    }

    execute() {
        this.document_model.set_property(this.node_id, 'x', this.new_pos.x);
        this.document_model.set_property(this.node_id, 'y', this.new_pos.y);
    }

    undo() {
        this.document_model.set_property(this.node_id, 'x', this.old_pos.x);
        this.document_model.set_property(this.node_id, 'y', this.old_pos.y);
    }
}
```

### ResizeControlCommand

```javascript
class ResizeControlCommand {
    constructor(document_model, { node_id, old_size, new_size }) {
        this.label = 'Resize control';
        this.document_model = document_model;
        this.node_id = node_id;
        this.old_size = old_size;
        this.new_size = new_size;
    }

    execute() {
        this.document_model.set_property(this.node_id, 'width', this.new_size.width);
        this.document_model.set_property(this.node_id, 'height', this.new_size.height);
    }

    undo() {
        this.document_model.set_property(this.node_id, 'width', this.old_size.width);
        this.document_model.set_property(this.node_id, 'height', this.old_size.height);
    }
}
```

### ChangePropertyCommand

```javascript
class ChangePropertyCommand {
    constructor(document_model, { node_id, key, old_value, new_value }) {
        this.label = `Change ${key}`;
        this.document_model = document_model;
        this.node_id = node_id;
        this.key = key;
        this.old_value = old_value;
        this.new_value = new_value;
    }

    execute() {
        this.document_model.set_property(this.node_id, this.key, this.new_value);
    }

    undo() {
        this.document_model.set_property(this.node_id, this.key, this.old_value);
    }
}
```

### DeleteControlCommand

```javascript
class DeleteControlCommand {
    constructor(document_model, { node_id }) {
        this.label = 'Delete control';
        this.document_model = document_model;
        this.node_id = node_id;
        this.saved_node = null;
        this.saved_parent_id = null;
        this.saved_index = null;
    }

    execute() {
        const node = this.document_model.get_node(this.node_id);
        this.saved_node = JSON.parse(JSON.stringify(
            this.document_model._serialize_node(node)
        ));
        this.saved_parent_id = node.parent_id;
        const parent = this.document_model.get_node(node.parent_id);
        this.saved_index = parent.children.indexOf(node);

        this.document_model.remove_node(this.node_id);
    }

    undo() {
        const restored = this.document_model._deserialize_node(
            this.saved_node, this.saved_parent_id
        );
        this.document_model.add_child(
            this.saved_parent_id, restored, this.saved_index
        );
    }
}
```

Note that `DeleteControlCommand` saves a deep copy of the entire subtree being deleted, so that undo can restore it with all children and properties intact.

## Compound Commands

Some user actions involve multiple atomic changes. For example, "move to a different parent" involves removing from one parent and adding to another. These are wrapped in a `CompoundCommand`:

```javascript
class CompoundCommand {
    constructor(label, commands) {
        this.label = label;
        this.commands = commands;
    }

    execute() {
        for (const cmd of this.commands) {
            cmd.execute();
        }
    }

    undo() {
        for (let i = this.commands.length - 1; i >= 0; i--) {
            this.commands[i].undo();
        }
    }
}
```

Undo reverses the commands in reverse order, ensuring consistency.

## Coalescing Rapid Changes

When the user types into the Property Grid's text editor, each keystroke generates a `ChangePropertyCommand`. Without coalescing, typing "Hello" into a label field would create five undo steps.

The solution is to merge consecutive property changes to the same key within a short time window:

```javascript
execute(cmd) {
    // Check for coalescing
    if (this._undo_stack.length > 0 && cmd.can_coalesce) {
        const last = this._undo_stack[this._undo_stack.length - 1];
        if (last.can_coalesce &&
            last.node_id === cmd.node_id &&
            last.key === cmd.key &&
            Date.now() - last.timestamp < 1000) {
            // Merge: keep the old_value from the first command,
            // use the new_value from the latest
            last.new_value = cmd.new_value;
            last.timestamp = Date.now();
            cmd.execute();
            this._emit('state-change');
            return;
        }
    }

    cmd.timestamp = Date.now();
    cmd.execute();
    this._undo_stack.push(cmd);
    this._redo_stack = [];
    this._emit('state-change');
}
```

This way, continuous typing coalesces into a single undo step.

## Modified State Tracking

The command history tracks whether the document has been modified since the last save:

```javascript
mark_saved() {
    this._saved_index = this._undo_stack.length;
}

is_modified() {
    return this._undo_stack.length !== this._saved_index;
}
```

The designer uses this to show a modified indicator (e.g., an asterisk in the title bar) and to prompt "Save changes?" when closing.

## Summary

The undo/redo system:

- Uses the Command Pattern: every operation is a command object with `execute()` and `undo()`.
- Maintains undo and redo stacks with configurable depth.
- Integrates with the toolbar (Ctrl+Z / Ctrl+Y, enabled/disabled state, action labels).
- Supports compound commands for multi-step operations.
- Coalesces rapid property changes to avoid excessive undo steps.
- Tracks modified state for save prompts.
