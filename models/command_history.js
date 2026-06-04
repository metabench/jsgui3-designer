/**
 * Command_History — Undo/redo system using the Command Pattern (Ch 12).
 *
 * Every designer operation is a command with execute() and undo().
 * The history maintains undo/redo stacks, supports coalescing of
 * rapid property changes, and tracks modified state.
 */

'use strict';

// ── Base Command ─────────────────────────────────────────────────────

class Command {
    constructor(label) {
        this.label = label || 'Unknown';
        this.timestamp = 0;
        this.can_coalesce = false;
    }
    execute() { }
    undo() { }
}

// ── Concrete Commands ────────────────────────────────────────────────

class AddControlCommand extends Command {
    constructor(document_model, { node_id, control_type, parent_id, index, properties }) {
        super(`Add ${control_type}`);
        this.document_model = document_model;
        this.node_id = node_id;
        this.control_type = control_type;
        this.parent_id = parent_id;
        this.index = index;
        this.properties = { ...properties };
    }

    execute() {
        const node = this.document_model.create_node(this.control_type, this.properties);
        // Override auto-generated id with the one we stored
        this.document_model.nodes.delete(node.id);
        node.id = this.node_id;
        this.document_model.nodes.set(node.id, node);
        this.document_model.add_child(this.parent_id, node, this.index);
    }

    undo() {
        this.document_model.remove_node(this.node_id);
    }
}

class MoveControlCommand extends Command {
    constructor(document_model, { node_id, old_pos, new_pos }) {
        super('Move control');
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

class ResizeControlCommand extends Command {
    constructor(document_model, { node_id, old_size, new_size }) {
        super('Resize control');
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

class ChangePropertyCommand extends Command {
    constructor(document_model, { node_id, key, old_value, new_value }) {
        super(`Change ${key}`);
        this.document_model = document_model;
        this.node_id = node_id;
        this.key = key;
        this.old_value = old_value;
        this.new_value = new_value;
        this.can_coalesce = true;
    }

    execute() {
        this.document_model.set_property(this.node_id, this.key, this.new_value);
    }

    undo() {
        this.document_model.set_property(this.node_id, this.key, this.old_value);
    }
}

class DeleteControlCommand extends Command {
    constructor(document_model, { node_id }) {
        super('Delete control');
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
        this.saved_index = parent ? parent.children.indexOf(node) : 0;

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

class ReorderControlCommand extends Command {
    constructor(document_model, { node_id, old_parent_id, old_index, new_parent_id, new_index }) {
        super('Reorder control');
        this.document_model = document_model;
        this.node_id = node_id;
        this.old_parent_id = old_parent_id;
        this.old_index = old_index;
        this.new_parent_id = new_parent_id;
        this.new_index = new_index;
    }

    execute() {
        this.document_model.move_node(this.node_id, this.new_parent_id, this.new_index);
    }

    undo() {
        this.document_model.move_node(this.node_id, this.old_parent_id, this.old_index);
    }
}

class CompoundCommand extends Command {
    constructor(label, commands) {
        super(label);
        this.commands = commands;
    }

    execute() {
        for (const cmd of this.commands) cmd.execute();
    }

    undo() {
        for (let i = this.commands.length - 1; i >= 0; i--) {
            this.commands[i].undo();
        }
    }
}

// ── Command History ──────────────────────────────────────────────────

class Command_History {
    constructor() {
        this._undo_stack = [];
        this._redo_stack = [];
        this._listeners = [];
        this._max_history = 100;
        this._saved_index = 0;
    }

    execute(cmd) {
        // Check for coalescing rapid property changes
        if (this._undo_stack.length > 0 && cmd.can_coalesce) {
            const last = this._undo_stack[this._undo_stack.length - 1];
            if (last.can_coalesce &&
                last.node_id === cmd.node_id &&
                last.key === cmd.key &&
                Date.now() - last.timestamp < 1000) {
                // Merge: keep old_value from first, new_value from latest
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
        this._redo_stack = [];  // New action clears redo

        // Trim history if too long
        if (this._undo_stack.length > this._max_history) {
            this._undo_stack.shift();
            if (this._saved_index > 0) this._saved_index--;
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

    mark_saved() {
        this._saved_index = this._undo_stack.length;
    }

    is_modified() {
        return this._undo_stack.length !== this._saved_index;
    }

    clear() {
        this._undo_stack = [];
        this._redo_stack = [];
        this._saved_index = 0;
        this._emit('state-change');
    }

    // ── Events ────────────────────────────────────────────────────

    on(event, handler) {
        this._listeners.push({ event, handler });
    }

    _emit(event, data) {
        for (const l of this._listeners) {
            if (l.event === event) l.handler(data || {});
        }
    }
}

module.exports = {
    Command_History,
    Command,
    AddControlCommand,
    MoveControlCommand,
    ResizeControlCommand,
    ChangePropertyCommand,
    DeleteControlCommand,
    ReorderControlCommand,
    CompoundCommand
};
