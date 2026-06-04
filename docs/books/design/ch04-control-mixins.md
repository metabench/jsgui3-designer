# Chapter 4 — Control Mixins: The Designer's Building Blocks

## What Are Mixins?

In jsgui3-html, a mixin is a function that takes a control instance and adds behaviour to it. Mixins are the mechanism for cross-cutting concerns — behaviours that many different controls might need but that do not belong in the base `Control` class.

```javascript
const dragable = require('jsgui3-html/control_mixins/dragable');
const selectable = require('jsgui3-html/control_mixins/selectable');

class Design_Surface_Item extends Control {
    constructor(spec) {
        super(spec);
        // Add design-time behaviours
        dragable(this, { constrain_to_parent: true });
        selectable(this, this, { click_selects: true });
    }
}
```

Mixins modify the control in place. They add properties, event listeners, CSS classes, and sometimes sub-elements (like resize handles). They are applied during construction and activated during `activate()`.

The `control_mixins/` directory in `jsgui3-html` contains over fifty mixins. For the designer, the following are the most important.

## The `dragable` Mixin

**File:** `jsgui3-html/control_mixins/dragable.js`  
**Lines:** ~277  
**Purpose:** Makes a control movable by mouse (and touch) dragging.

### How It Works

The `dragable` mixin adds three core methods to the control:

1. **`begin_drag(pos)`** — Called when the user presses the mouse button on the control. Records the initial position and emits a `drag-start` event.

2. **`move_drag(pos)`** — Called on each mousemove while dragging. Calculates the delta from the start position, applies constraints (grid snapping, parent bounds), updates the control's CSS `left` and `top`, and emits a `drag-move` event.

3. **`end_drag()`** — Called on mouseup. Finalises the position and emits a `drag-end` event.

### Options

```javascript
dragable(ctrl, {
    handle: '.title-bar',           // Only drag from this sub-element
    constrain_to_parent: true,      // Stay within parent bounds
    grid_snap: [10, 10],            // Snap to a 10×10 grid
    axis: 'x',                      // Constrain to horizontal movement
    drag_class: 'dragging'          // CSS class applied while dragging
});
```

### Designer Usage

On the design canvas, every placed control is wrapped in a `Design_Surface_Item` that has `dragable` applied. When the user drags a control, the `drag-move` events update the document model's `x` and `y` properties for that control, which in turn update the canvas position. The `drag-end` event creates a `MoveControlCommand` for the undo/redo history.

```javascript
dragable(this, { constrain_to_parent: true, grid_snap: [8, 8] });

this.on('drag-end', (e) => {
    const cmd = new MoveControlCommand(this.node_id, e.start, e.end);
    command_history.execute(cmd);
});
```

The `grid_snap` option is particularly useful for the designer — it lets the user align controls to a configurable grid, producing clean, evenly-spaced layouts.

## The `resizable` Mixin

**File:** `jsgui3-html/control_mixins/resizable.js`  
**Lines:** ~447  
**Purpose:** Adds resize handles to a control, allowing the user to change its dimensions.

### How It Works

The `resizable` mixin adds a resize handle element (typically a small `<div>` in the bottom-right corner) to the control. When the user drags the handle, the control's `width` and `height` CSS properties are updated.

More advanced modes support eight-direction resizing (all four corners and all four edges), but the default is a single bottom-right handle.

### Options

```javascript
resizable(ctrl, {
    resize_mode: 'br_handle',       // Bottom-right handle (default)
    min_width: 50,                   // Minimum width in pixels
    min_height: 30,                  // Minimum height in pixels
    max_width: 800,                  // Maximum width
    max_height: 600,                 // Maximum height
    grid_snap: [8, 8]               // Snap to grid
});
```

### Designer Usage

On the design canvas, selected controls show resize handles. The `resizable` mixin provides the mechanics; the designer adds the visual chrome (blue squares at corners and edges) and integrates with the command history:

```javascript
resizable(this, {
    resize_mode: 'all',
    min_width: 20,
    min_height: 20,
    grid_snap: this.designer.grid_size
});

this.on('resize-end', (e) => {
    const cmd = new ResizeControlCommand(this.node_id, e.old_size, e.new_size);
    command_history.execute(cmd);
});
```

## The `selectable` Mixin

**File:** `jsgui3-html/control_mixins/selectable.js`  
**Lines:** ~301  
**Purpose:** Tracks selection state as a reactive property and handles click-to-select behaviour.

### How It Works

The `selectable` mixin adds a `selected` property to the control. When `selected` is set to `true`, the `'selected'` CSS class is added to the control's DOM element. When set to `false`, the class is removed.

The mixin listens for click events and toggles the `selected` state. It supports multi-select via modifier keys (Ctrl+click adds to selection, Shift+click selects a range).

### The Isomorphic Setup

Interestingly, the `selectable` mixin has a `setup_isomorphic()` method that runs on both server and client. This means a control can be server-rendered in a selected state — the `selected` CSS class will be present in the HTML, and the correct styles will apply before any JavaScript runs.

For the designer, this is less relevant (selection is inherently an interactive concept), but it demonstrates the mixin system's adherence to the isomorphic principle.

### Designer Usage

The designer maintains a `Selection_Model` — an observable set of selected node IDs. When the user clicks a control on the canvas, the `selectable` mixin handles the click, and the designer's selection logic updates the selection model:

```javascript
selectable(this, this, {
    click_selects: true,
    multi_select: true
});

this.on('select', () => {
    selection_model.add(this.node_id);
});

this.on('deselect', () => {
    selection_model.remove(this.node_id);
});
```

## The `selection-box-host` Mixin

**File:** `jsgui3-html/control_mixins/selection-box-host.js`  
**Lines:** ~244  
**Purpose:** Implements rubber-band (marquee) selection — drag to draw a rectangle and select everything inside it.

### How It Works

When applied to a container control (like the design canvas), the `selection-box-host` mixin:

1. Listens for mousedown on the container background (not on child controls).
2. On mousemove, draws a semi-transparent blue rectangle from the mousedown point to the current mouse position.
3. On mouseup, calculates which child controls intersect with the rectangle and selects them.

The mixin includes a `bounds_from_coords_pair()` utility that normalises coordinate pairs into a `[left, top, width, height]` rectangle, handling all four drag directions (up-left, up-right, down-left, down-right).

### Designer Usage

The design canvas applies `selection-box-host` to enable rubber-band multi-selection:

```javascript
const selection_box_host = require('jsgui3-html/control_mixins/selection-box-host');

class Design_Canvas extends Control {
    constructor(spec) {
        super(spec);
        selection_box_host(this);
    }
}
```

When the user clicks on empty canvas space and drags, they see a selection rectangle. All controls that intersect with the rectangle are added to the selection model. This is the standard behaviour in every visual designer and is available out of the box.

## The `selected-resizable` Mixin

**File:** `jsgui3-html/control_mixins/selected-resizable.js`  
**Lines:** ~60  
**Purpose:** Combines `selectable` and `resizable` — resize handles only appear when the control is selected.

This mixin is a compositor. It applies both `selectable` and `resizable` to the control, and connects them so that the resize handles are only visible and active when the control is in the selected state.

For the designer, this is exactly the desired behaviour: you click a control to select it, and then blue resize handles appear at its edges and corners.

## The `selected-deletable` Mixin

**File:** `jsgui3-html/control_mixins/selected-deletable.js`  
**Lines:** ~55  
**Purpose:** Enables pressing the Delete key to remove selected controls.

When applied, this mixin listens for the Delete and Backspace keys on selected controls. When pressed, it raises a `'delete-requested'` event that the designer can handle:

```javascript
this.on('delete-requested', () => {
    const cmd = new DeleteControlCommand(this.node_id);
    command_history.execute(cmd);
});
```

## The `collapsible` Mixin

**File:** `jsgui3-html/control_mixins/collapsible.js`  
**Lines:** ~150  
**Purpose:** Makes a section expandable/collapsible with click-to-toggle and animated transitions.

The `Property_Grid` uses `collapsible` for its group headers. When you have a property grid with groups like "Layout," "Appearance," and "Data Binding," each group can be collapsed to save space. The mixin handles the toggle state, the CSS class, the `aria-expanded` attribute, and the height animation.

## The `input_validation` Mixin

**File:** `jsgui3-html/control_mixins/input_validation.js`  
**Lines:** ~175  
**Purpose:** Adds validation rules to input controls — required, pattern, min/max length, custom validators.

This mixin is used by `Form_Container` and individual form fields to validate user input. For the designer, it has a dual role:

1. **At design time:** The property grid for a text input might show validation-related properties (required, minLength, maxLength, pattern). These properties are stored in the document model.

2. **At runtime:** When the designed form is rendered, the `input_validation` mixin is applied to the controls configured with validation rules, enabling the validation behaviour that the designer specified.

## The `input_mask` Mixin

**File:** `jsgui3-html/control_mixins/input_mask.js`  
**Lines:** ~120  
**Purpose:** Applies input masks to text fields — phone numbers, credit cards, dates, custom patterns.

Like `input_validation`, this mixin is configured at design time (the user sets a mask pattern in the Property_Grid) and applied at runtime. The designer stores the mask configuration as part of the control's properties in the document model.

## The `popup` Mixin

**File:** `jsgui3-html/control_mixins/popup.js`  
**Lines:** ~130  
**Purpose:** Provides intelligent popup positioning — a control can display a popup that automatically avoids viewport edges.

This mixin is used by `Dropdown_Menu`, `Context_Menu`, `Tooltip`, `Date_Picker`, and `Combo_Box`. In the designer, it powers:

- Context menus on the canvas (right-click a control → Cut, Copy, Paste, Delete, Properties).
- Tooltip displays when hovering over palette items.
- Dropdown positioning in the Property_Grid's enum and color editors.

## The `keyboard_navigation` Mixin

**File:** `jsgui3-html/control_mixins/keyboard_navigation.js`  
**Lines:** ~155  
**Purpose:** Adds arrow-key navigation between items in a list or grid.

The `Property_Grid` uses this for navigating between property rows with the arrow keys. The `Toolbox` uses it for navigating between tool items. The design canvas uses it for nudging selected controls (Arrow keys move by 1 pixel, Shift+Arrow moves by the grid size).

## The `drag_like_events` Mixin

**File:** `jsgui3-html/control_mixins/drag_like_events.js`  
**Lines:** ~410  
**Purpose:** Unifies mouse and touch drag events into a single abstract stream.

This mixin normalises the differences between mouse events (`mousedown`, `mousemove`, `mouseup`) and touch events (`touchstart`, `touchmove`, `touchend`) into a single set of drag-like events with consistent coordinate values. Both `dragable` and `resizable` use this internally, which means the designer works on touch devices as well as with a mouse.

## The `display` Mixin

**File:** `jsgui3-html/control_mixins/display.js`  
**Lines:** ~350  
**Purpose:** Manages control visibility with show, hide, toggle, and display mode switching.

Used in the designer for:

- Showing/hiding the property panel and palette when toggling between design and preview modes.
- Conditional visibility of property groups based on the selected control type.
- Fade-in/fade-out transitions for toast notifications and modals.

## The `themeable` Mixin

**File:** `jsgui3-html/control_mixins/themeable.js`  
**Lines:** ~110  
**Purpose:** Integrates a control with the token-based theme system.

Controls that use `themeable` will read CSS custom properties (tokens) from `theme_params.js` and apply them. This means a `Text_Input` in the "Vista" theme looks different from the same `Text_Input` in the "Obsidian" theme — same structure, different visual treatment.

For the designer, `themeable` ensures that the controls on the canvas respond to theme changes. If the user switches the designer's theme, all the placed controls update their visual appearance accordingly. The designer can also offer a "target theme" selector that lets the user preview how their form will look in different themes without changing the designer's own theme.

## The Mixin Registry

**File:** `jsgui3-html/control_mixins/mixin_registry.js`  
**Lines:** ~115  
**Purpose:** A central registry that maps mixin names to mixin functions.

The mixin registry allows mixins to be looked up by name:

```javascript
const { get_mixin } = require('jsgui3-html/control_mixins/mixin_registry');

const dragable = get_mixin('dragable');
dragable(my_control, options);
```

For the designer, the mixin registry enables data-driven mixin application. The document model can specify which mixins a control should have (e.g., "this panel should be collapsible"), and the runtime renderer can look up and apply those mixins by name from the registry.

## Composing Mixins for Design-Time Behaviour

The power of the mixin system for the designer is in composition. A control on the design canvas typically has four or five mixins applied simultaneously:

```javascript
class Design_Surface_Item extends Control {
    constructor(spec) {
        super(spec);
        this.add_class('design-surface-item');

        // Selection: click to select, Ctrl+click for multi-select
        selectable(this, this, {
            click_selects: true,
            multi_select: true
        });

        // Dragging: move around the canvas
        dragable(this, {
            constrain_to_parent: true,
            grid_snap: spec.grid_size || [8, 8],
            handle: null  // drag from anywhere on the item
        });

        // Resizing: handles appear when selected
        resizable(this, {
            resize_mode: 'all',
            min_width: 20,
            min_height: 16,
            grid_snap: spec.grid_size || [8, 8]
        });

        // Deletion: Delete key removes selected controls
        // (from selected-deletable)
        this.on('keydown', (e) => {
            if ((e.key === 'Delete' || e.key === 'Backspace') && this.selected) {
                this.raise('delete-requested');
            }
        });
    }
}
```

These five mixins — `selectable`, `dragable`, `resizable`, `selected-deletable`, plus the canvas-level `selection-box-host` — provide the complete set of spatial interactions that a visual designer needs. They already exist. They are tested. They work with touch devices. They support grid snapping and constraint modes.

This is why building a WYSIWYG designer on top of jsgui3-html is feasible as a single-repository project rather than a multi-year, multi-team effort: the hardest interaction programming has already been done.

## Summary of Designer-Relevant Mixins

| Mixin | Role in Designer |
|-------|-----------------|
| `dragable` | Move controls on canvas |
| `resizable` | Resize controls with handles |
| `selectable` | Click-to-select controls |
| `selection-box-host` | Rubber-band multi-select |
| `selected-resizable` | Show resize handles only when selected |
| `selected-deletable` | Delete key removes selected controls |
| `collapsible` | Collapse property groups |
| `keyboard_navigation` | Arrow key navigation in property grid and canvas |
| `drag_like_events` | Unified mouse+touch drag support |
| `input_validation` | Runtime form validation (configured at design time) |
| `input_mask` | Runtime input masks (configured at design time) |
| `popup` | Context menus, dropdown positioning |
| `display` | Show/hide panels and controls |
| `themeable` | Theme integration for canvas controls |
| `tooltip` | Hover information on palette items |
| `a11y` | Accessibility attributes |
