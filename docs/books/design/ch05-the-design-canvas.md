# Chapter 5 — The Design Canvas

## The Heart of the Designer

The design canvas is the central surface where forms take shape. It occupies the largest area in the designer's layout — the wide middle panel between the palette on the left and the property inspector on the right. It is where controls are placed, arranged, selected, resized, and tested.

In a Visual Studio Windows Forms designer, the canvas is a fixed-size rectangle that represents the runtime form. Controls are positioned absolutely within this rectangle, and their coordinates correspond exactly to their positions at runtime. The jsgui3 designer follows this model as its primary mode, but also supports flow-based layout for responsive forms.

## Canvas Modes

The design canvas operates in three modes:

### Absolute Mode

Controls have explicit `x`, `y`, `width`, and `height` properties. They are positioned with `position: absolute` within the canvas container. This is the traditional form designer approach and is ideal for:

- Fixed-size dialog boxes
- Dashboard layouts with precise control placement
- Print forms and reports
- Kiosk/embedded interfaces

In absolute mode, the canvas shows a grid (configurable, typically 8×8 pixels) and supports snap-to-grid, snap-to-guides, and snap-to-edges-of-other-controls.

### Flow Mode

Controls are placed in document flow — they stack vertically and wrap horizontally according to CSS flexbox or CSS grid rules. Their position is determined by their order in the control tree and the flow properties of their parent container. This is ideal for:

- Responsive forms that adapt to different screen sizes
- Content-heavy pages where the layout needs to reflow
- Forms that closely follow the `Form_Container` runtime layout

In flow mode, drag-and-drop reorders controls rather than positioning them absolutely. A blue insertion line shows where the control will be inserted.

### Preview Mode

The canvas rendersthe form as it will appear at runtime, without any design chrome — no selection highlights, no resize handles, no grid, no snap guides. The user can interact with the controls normally (type into text fields, check checkboxes, open dropdowns) to test the form's behaviour.

## Building the Design Canvas

The `Design_Canvas` control extends `Control` and applies the `selection-box-host` mixin for rubber-band selection:

```javascript
const Control = require('jsgui3-html/html-core/control');
const selection_box_host = require('jsgui3-html/control_mixins/selection-box-host');

class Design_Canvas extends Control {
    constructor(spec = {}) {
        spec.__type_name = spec.__type_name || 'design_canvas';
        super(spec);

        this.add_class('design-canvas');
        this.dom.attributes.role = 'application';
        this.dom.attributes['aria-label'] = 'Design canvas';

        // The selection-box-host mixin enables rubber-band selection
        selection_box_host(this);

        // Canvas configuration
        this.grid_size = spec.grid_size || [8, 8];
        this.show_grid = spec.show_grid !== false;
        this.snap_to_grid = spec.snap_to_grid !== false;
        this.canvas_width = spec.canvas_width || 800;
        this.canvas_height = spec.canvas_height || 600;
        this.mode = spec.mode || 'absolute'; // 'absolute' | 'flow' | 'preview'

        // References to the models
        this.document_model = spec.document_model;
        this.selection_model = spec.selection_model;
        this.command_history = spec.command_history;

        if (!spec.el) {
            this.compose();
        }
    }

    compose() {
        const { context } = this;

        // The surface is the area within the canvas where controls are placed
        this.surface = new Control({ context, tag_name: 'div' });
        this.surface.add_class('design-surface');
        this.surface.dom.attributes.style =
            `width: ${this.canvas_width}px; height: ${this.canvas_height}px;`;
        this.add(this.surface);
    }
}
```

## The Grid

A visual grid helps the user align controls. It is drawn as a background pattern on the canvas surface using CSS:

```css
.design-surface {
    position: relative;
    background-color: var(--canvas-bg, #ffffff);
    background-image:
        linear-gradient(
            to right,
            var(--canvas-grid-color, rgba(0,0,0,0.05)) 1px,
            transparent 1px
        ),
        linear-gradient(
            to bottom,
            var(--canvas-grid-color, rgba(0,0,0,0.05)) 1px,
            transparent 1px
        );
    background-size: var(--canvas-grid-x, 8px) var(--canvas-grid-y, 8px);
}
```

The grid size is controlled by CSS custom properties, which the canvas updates when the user changes the grid spacing. The grid can be toggled on and off through the toolbar's View menu.

## Placing Controls

When the user clicks a control in the palette (or drags it onto the canvas), the canvas creates a new `Design_Surface_Item`. This is a wrapper control that hosts the actual `jsgui3-html` control and adds the design-time behaviours:

```javascript
place_control(control_type, position) {
    const { context } = this;

    // Look up the control class and default spec from the registry
    const registry_entry = control_registry.get(control_type);
    const ControlClass = registry_entry.control_class;
    const default_spec = registry_entry.default_spec();

    // Create the actual control
    const control_instance = new ControlClass({
        context,
        ...default_spec
    });

    // Wrap it in a Design_Surface_Item
    const item = new Design_Surface_Item({
        context,
        control: control_instance,
        position: position,
        size: registry_entry.default_size,
        grid_size: this.grid_size,
        node_id: generate_unique_id()
    });

    // Add to the canvas surface
    this.surface.add(item);

    // Update the document model
    const cmd = new AddControlCommand({
        node_id: item.node_id,
        control_type: control_type,
        position: position,
        size: registry_entry.default_size,
        properties: default_spec
    });
    this.command_history.execute(cmd);

    // Select the newly placed control
    this.selection_model.select_exclusive(item.node_id);

    return item;
}
```

## The Design Surface Item

The `Design_Surface_Item` is the wrapper that gives a placed control its design-time behaviour. It applies the `dragable`, `resizable`, and `selectable` mixins:

```javascript
class Design_Surface_Item extends Control {
    constructor(spec) {
        super(spec);
        this.add_class('design-surface-item');
        this.node_id = spec.node_id;

        // Position it absolutely on the canvas
        const [x, y] = spec.position;
        const [w, h] = spec.size;
        this.dom.attributes.style =
            `position: absolute; left: ${x}px; top: ${y}px; ` +
            `width: ${w}px; height: ${h}px;`;

        // The actual control lives inside
        this.inner_control = spec.control;
        this.add(this.inner_control);

        // Design-time behaviours
        dragable(this, {
            constrain_to_parent: true,
            grid_snap: spec.grid_size
        });

        resizable(this, {
            resize_mode: 'all',
            min_width: 20,
            min_height: 16,
            grid_snap: spec.grid_size
        });

        selectable(this, this, {
            click_selects: true,
            multi_select: true
        });
    }
}
```

### Selection Chrome

When a `Design_Surface_Item` is selected, it shows:

1. **A highlight border** — typically a dashed blue outline.
2. **Resize handles** — small squares at the four corners and four edge midpoints.
3. **A control type badge** — a small label showing "TextInput" or "Panel" in the corner.

These elements are added by the mixins and styled via CSS:

```css
.design-surface-item.selected {
    outline: 2px solid var(--designer-accent, #3b82f6);
    outline-offset: 1px;
}

.design-surface-item .resize-handle {
    width: 8px;
    height: 8px;
    background: var(--designer-accent, #3b82f6);
    border: 1px solid white;
    position: absolute;
    z-index: 10;
}
```

## Snap Guides

Smart snap guides help the user align controls without needing the grid. When dragging a control, the canvas checks whether it aligns with any other control's edges or centre lines:

- **Edge alignment** — left edge aligns with another control's left edge, right edge aligns with right edge, etc.
- **Centre alignment** — horizontal or vertical centre aligns with another control's centre.
- **Spacing alignment** — equal spacing between three or more controls.

When an alignment is detected, a guide line appears (a thin coloured line spanning the canvas), and the dragged control snaps to the aligned position.

## Canvas Keyboard Shortcuts

The design canvas handles the following keyboard shortcuts:

| Key | Action |
|-----|--------|
| Delete / Backspace | Delete selected controls |
| Arrow keys | Nudge selected controls by 1 pixel |
| Shift + Arrow keys | Nudge by grid size |
| Ctrl + A | Select all controls |
| Ctrl + C | Copy selected controls |
| Ctrl + X | Cut selected controls |
| Ctrl + V | Paste controls |
| Ctrl + D | Duplicate selected controls |
| Ctrl + Z | Undo |
| Ctrl + Y / Ctrl + Shift + Z | Redo |
| Escape | Deselect all |
| Tab | Cycle through controls (tab order) |

## Canvas Zoom and Scroll

For larger forms, the canvas supports:

- **Zoom** — Ctrl + mouse wheel zooms in/out. The canvas applies a CSS `transform: scale()` to the surface. Zoom levels from 25% to 400% are supported.
- **Pan** — When zoomed, the canvas becomes scrollable. Middle-mouse-button drag pans the view. Scrollbars appear at the edges.
- **Fit to screen** — A toolbar button or Ctrl+0 fits the entire form in the visible area.
- **Zoom readout** — The Status_Bar shows the current zoom level.

## The Relationship with the Document Model

The canvas is a *view* of the document model, not the model itself. The document model is the source of truth. When the user drags a control on the canvas:

1. The `dragable` mixin updates the DOM position in real time (for visual feedback).
2. On drag end, a `MoveControlCommand` is created and executed.
3. The command updates the document model's position data.
4. The document model emits a position change event.
5. The canvas verifies its visual state matches the model.

This separation ensures that undo/redo always works: undoing a move reverts the model, which reverts the canvas. The canvas never has state that the model doesn't know about.

## Summary

The design canvas brings together:

- The `Control` base class for structure.
- The `selection-box-host` mixin for rubber-band multi-selection.
- The `Design_Surface_Item` wrapper with `dragable`, `resizable`, and `selectable` mixins.
- A grid system for visual alignment.
- Smart snap guides for precise positioning.
- Keyboard shortcuts for efficient workflow.
- Zoom and scroll for working with large forms.
- A clean separation between the visual surface and the document model.

All of the interactive mechanics — dragging, resizing, selecting, rubber-banding — are provided by existing mixins. What the designer adds is the orchestration layer that connects these mechanics to the document model and command history.
