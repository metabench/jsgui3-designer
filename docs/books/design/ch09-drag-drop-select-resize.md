# Chapter 9 — Drag, Drop, Select & Resize

## The Four Verbs of Visual Editing

Every interaction on the design canvas can be decomposed into four fundamental operations: **drag**, **drop**, **select**, and **resize**. These verbs combine to enable the full range of spatial manipulation that makes a visual designer what it is.

This chapter explores how these operations work in detail, how the jsgui3-html mixins implement them, and how the designer orchestrates them into a coherent user experience.

## Selection

### Click-to-Select

The most basic interaction: click a control to select it. The `selectable` mixin handles this:

```javascript
selectable(surface_item, surface_item, {
    click_selects: true,
    multi_select: true
});
```

When the user clicks a `Design_Surface_Item`:

1. The `selectable` mixin's click handler fires.
2. If Ctrl is held, the item is toggled in the selection (added if not selected, removed if selected).
3. If Ctrl is not held, the item becomes the exclusive selection (all other items are deselected).
4. The `'select'` or `'deselect'` event fires on the item.
5. The designer's selection model is updated.
6. The Property Grid loads the selected item's properties.
7. The item's CSS class is updated (`'selected'` added or removed).
8. Resize handles appear or disappear.

### Rubber-Band Selection

To select multiple controls at once, the user clicks on empty canvas space and drags to draw a selection rectangle. The `selection-box-host` mixin handles this:

When applied to the `Design_Canvas`:

1. The mixin detects a mousedown on the canvas background (not on a child control).
2. On mousemove, it draws a semi-transparent rectangle from the mousedown point to the current cursor position. The rectangle is a real DOM element with CSS styling:

```css
.selection-box {
    position: absolute;
    border: 1px dashed var(--designer-accent, #3b82f6);
    background: rgba(59, 130, 246, 0.08);
    pointer-events: none;
    z-index: 1000;
}
```

3. On mouseup, the mixin calculates the bounding box of the rectangle using `bounds_from_coords_pair()`, which normalises the coordinates regardless of drag direction.
4. The canvas iterates over all `Design_Surface_Item` children and tests whether each intersects with the selection rectangle.
5. All intersecting items are selected. If Ctrl was held, they are added to the existing selection.

### Selection Model

The `Selection_Model` is a simple observable collection:

```javascript
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
        this._selected.clear();
        this._emit('change');
    }

    get_selected() {
        return Array.from(this._selected);
    }

    is_selected(node_id) {
        return this._selected.has(node_id);
    }

    on(event, handler) {
        this._listeners.push({ event, handler });
    }

    _emit(event) {
        for (const l of this._listeners) {
            if (l.event === event) l.handler({ selected: this.get_selected() });
        }
    }
}
```

## Dragging Controls

### The Drag Flow

When the user presses the mouse button on a selected control and moves it, the `dragable` mixin takes over:

1. **`begin_drag(pos)`** — records the initial mouse position and the control's starting CSS position. If multiple controls are selected, all their starting positions are recorded.

2. **`move_drag(pos)`** — on each mousemove, calculates the delta from the start position. The control's `left` and `top` CSS properties are updated by the delta. If `grid_snap` is set, the position is rounded to the nearest grid point.

3. If **snap guides** are enabled, the canvas checks whether the dragged control's edges or centre align with any other control's edges or centre. If so, a guide line is drawn and the position snaps to the aligned value.

4. **`end_drag()`** — on mouseup, the final position is calculated. A `MoveControlCommand` is created with the old and new positions, and executed via the command history.

### Multi-Drag

When multiple controls are selected and the user drags one of them, all selected controls move together. The delta is applied uniformly to all selected controls:

```javascript
this.on('drag-move', (e) => {
    const delta = { dx: e.pos[0] - e.start[0], dy: e.pos[1] - e.start[1] };

    for (const node_id of selection_model.get_selected()) {
        const item = canvas.get_surface_item(node_id);
        if (item) {
            item.set_position(
                item.start_x + delta.dx,
                item.start_y + delta.dy
            );
        }
    }
});
```

### Drag Constraints

The `dragable` mixin supports several constraint modes:

| Option | Effect |
|--------|--------|
| `constrain_to_parent: true` | Cannot drag outside the parent container |
| `axis: 'x'` | Horizontal movement only |
| `axis: 'y'` | Vertical movement only |
| `grid_snap: [8, 8]` | Snap to an 8×8 grid |

For the designer, `constrain_to_parent` ensures controls stay within the canvas bounds, and `grid_snap` provides the snap-to-grid behaviour that produces clean layouts.

## Drag-and-Drop from the Palette

Dropping a new control from the palette onto the canvas is a different flow from dragging an existing control. The palette drag creates a **ghost element** — a semi-transparent preview of the control being placed:

1. **Mousedown on palette item** — a ghost element is created at the cursor position. The ghost is a simplified visual representation (typically just a rectangle with the control type label).

2. **Mousemove** — the ghost follows the cursor. When the cursor enters the canvas:
   - The ghost snaps to the grid.
   - The cursor changes to indicate a valid drop target.
   - In flow mode, an insertion line appears between existing controls.

3. **Mouseup over the canvas** — the ghost is removed, and a new control is created at the drop position.

4. **Mouseup outside the canvas** — the ghost is removed, and the drop is cancelled.

### Drop onto a Container

If the user drops a control onto an existing container control (like a `Panel` or `Group_Box`), the new control becomes a child of that container, not a child of the canvas root. The designer detects this by testing which container (if any) the drop position falls within.

Containers are identified by the `is_container` property in the control registry. When the cursor hovers over a container during drag, the container highlights to indicate that it will receive the dropped control.

## Resizing Controls

### Resize Handles

The `resizable` mixin adds resize handles to the control — small interactive regions at the corners and edges that the user can drag to change the control's dimensions.

In `resize_mode: 'all'`, eight handles are created:

| Handle | Position | Cursor | Resizes |
|--------|----------|--------|---------|
| NW | Top-left corner | `nw-resize` | Top + Left |
| N | Top edge midpoint | `n-resize` | Top |
| NE | Top-right corner | `ne-resize` | Top + Right |
| E | Right edge midpoint | `e-resize` | Right |
| SE | Bottom-right corner | `se-resize` | Bottom + Right |
| S | Bottom edge midpoint | `s-resize` | Bottom |
| SW | Bottom-left corner | `sw-resize` | Bottom + Left |
| W | Left edge midpoint | `w-resize` | Left |

Each handle is a small `div` element positioned absolutely relative to the control:

```css
.resize-handle {
    position: absolute;
    width: 8px;
    height: 8px;
    background: var(--designer-accent, #3b82f6);
    border: 1px solid #fff;
    z-index: 10;
}
.resize-handle-nw { top: -4px; left: -4px; cursor: nw-resize; }
.resize-handle-n  { top: -4px; left: 50%; transform: translateX(-50%); cursor: n-resize; }
.resize-handle-ne { top: -4px; right: -4px; cursor: ne-resize; }
/* ... etc for all 8 handles ... */
```

### Resize Constraints

The `resizable` mixin enforces:

- **Minimum size** — prevents controls from being resized below a threshold (e.g., 20×16 pixels).
- **Maximum size** — optional upper bounds.
- **Grid snapping** — the resized dimensions snap to the grid.
- **Aspect ratio lock** — holding Shift during resize maintains the width/height ratio.

### Resize and the Document Model

Like dragging, resizing goes through the command history:

```javascript
this.on('resize-end', (e) => {
    const cmd = new ResizeControlCommand(
        this.node_id,
        { width: e.old_width, height: e.old_height },
        { width: e.new_width, height: e.new_height }
    );
    command_history.execute(cmd);
});
```

The `ResizeControlCommand` updates the `width` and `height` properties in the document model, which triggers the canvas to update the control's visual size.

## Keyboard Nudging

Selected controls can be moved with the arrow keys:

| Keys | Movement |
|------|----------|
| Arrow | 1 pixel in the arrow direction |
| Shift + Arrow | Grid size pixels in the arrow direction |

Each nudge is a `MoveControlCommand`, but to avoid filling the history with dozens of tiny moves, consecutive nudges in the same direction within a short time window (e.g., 500ms) are merged into a single command.

## Interaction Modes

The canvas maintains an interaction mode that determines how mouse events are interpreted:

| Mode | Mousedown on control | Mousedown on empty space | Mousemove |
|------|---------------------|--------------------------|-----------|
| `select` | Select control | Start rubber-band | Continue rubber-band or move selected |
| `place` | (ignored) | Place new control | Show placement ghost |
| `preview` | Native interaction | (nothing) | (nothing) |

Mode transitions:

- Selecting a tool in the palette switches to `place` mode.
- After placing a control, mode switches back to `select`.
- The preview button toggles `preview` mode.
- Pressing Escape cancels placement and returns to `select`.

## Event Interception at Design Time

A critical challenge: controls on the design canvas are real, live `jsgui3-html` controls. A `Button` will try to fire its `click` event. A `Combo_Box` will try to open its dropdown. A `Text_Input` will accept keyboard input.

At design time, these behaviours need to be **intercepted**. The user should be able to select, drag, and resize controls without triggering their runtime actions.

The solution is an event interception layer on the `Design_Surface_Item`:

```javascript
activate() {
    super.activate();

    if (this.dom.el) {
        // Intercept all mouse events on the inner control
        this.dom.el.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            // Handle selection/drag instead
            this._handle_design_mousedown(e);
        }, true);  // Capture phase — runs before the inner control's listeners

        // Prevent keyboard input from reaching inner controls
        this.dom.el.addEventListener('keydown', (e) => {
            if (this._design_mode) {
                e.stopPropagation();
            }
        }, true);
    }
}
```

By using capture-phase event listeners on the `Design_Surface_Item`, the designer intercepts events before they reach the inner control. It then decides whether to handle them (selection, drag, resize) or pass them through (in preview mode).

## Double-Click to Edit

One exception to event interception: double-clicking a control enters **inline edit mode**. For a `Text_Input`, this lets the user type into the control's placeholder field. For a `Button`, this lets the user edit the button label. For a `Panel`, this lets the user edit the title.

Inline editing modifies the control's properties directly and creates a `ChangePropertyCommand` when the edit is committed (on Enter or blur).

## Summary

The four verbs of visual editing — drag, drop, select, resize — are implemented through:

- **`selectable`** — click-to-select with multi-select support.
- **`selection-box-host`** — rubber-band selection on the canvas.
- **`dragable`** — move controls with constraints and grid snapping.
- **`resizable`** — resize handles in all eight directions.
- A **Selection_Model** that coordinates selection state across all views.
- **Commands** that route all mutations through the undo/redo history.
- An **event interception layer** that prevents design-time interactions from triggering runtime behaviours.
- **Keyboard nudging** for precise positioning.
- **Interaction modes** that determine how mouse events are interpreted.

All of the low-level mechanics are provided by existing mixins. The designer's contribution is the orchestration: connecting these mechanics to the document model, the command history, and the UI coordination logic.
