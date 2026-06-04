# Appendix A — Glossary & Quick Reference

> *Key terms, keyboard shortcuts, and API quick reference for the jsgui3 designer.*

## A.1 Glossary

| Term | Definition | Chapter |
|------|-----------|---------|
| **Acceptance Criteria (AC)** | A Given-When-Then specification that defines when a feature is complete | Ch 21 |
| **Activate** | The lifecycle method called when a jsgui3 control becomes interactive on the client side | Ch 3 |
| **Canvas** | The central WYSIWYG surface where form controls are placed and manipulated | Ch 5 |
| **Canvas Coordinates** | Logical coordinates on the design surface, independent of zoom level | Ch 5, 19 |
| **Command** | An object representing a reversible action (for undo/redo) | Ch 12 |
| **Command History** | The stack-based manager that tracks executed commands for undo/redo | Ch 12 |
| **Compose** | The lifecycle method in jsgui3 where a control builds its internal DOM structure | Ch 3 |
| **Control** | The base class for all UI elements in jsgui3-html | Ch 3 |
| **Control Mixin** | A function that adds behaviour (dragable, resizable, selectable) to a control | Ch 4 |
| **Control Registry** | A map of control type names to their classes and metadata, used by the palette | Ch 6 |
| **Data_Object** | jsgui3's observable data model class with get/set/on change events | Ch 3, 15 |
| **Deep Clone** | Creating a completely independent copy of a control subtree with new IDs | Ch 22 |
| **Design Mode** | Canvas mode showing design adornments (grid, outlines, handles) | Ch 5 |
| **Design Surface Item** | The wrapper control that adds design-time behaviour to a placed control | Ch 5 |
| **Design Token** | A named value (colour, spacing, font) that defines the design system | Ch 13 |
| **Document Model** | The hierarchical tree of form nodes that represents the form's structure | Ch 8 |
| **Drag Ghost** | A semi-transparent copy of a control shown during drag operations | Ch 9, 19 |
| **Drop Zone** | A highlighted area of a container indicating where a control will be placed | Ch 9 |
| **Flow Layout** | Layout mode where controls wrap based on available space | Ch 5, 20 |
| **Form Definition** | The `.form.json` file that serializes the complete document model | Ch 11 |
| **Grid Snap** | Feature that aligns control positions to the nearest grid point | Ch 5 |
| **Hydration** | The process of attaching client-side interactivity to server-rendered HTML | Ch 14 |
| **Inline Editing** | Double-clicking a control to edit its text content directly on the canvas | Ch 9, 19 |
| **Isomorphic** | Code that runs on both server and client (jsgui3's fundamental architecture) | Ch 1, 14 |
| **Node** | A single element in the document model tree | Ch 8 |
| **Node ID** | A unique identifier for each node in the document model | Ch 8 |
| **Overlay Layer** | The SVG layer above controls that renders selection outlines, handles, and guides | Ch 5 |
| **Palette** | The toolbox panel listing available controls for placement | Ch 6 |
| **Preview Mode** | Canvas mode showing the form as it would appear at runtime | Ch 5 |
| **Property Grid** | The inspector panel showing properties of the selected control | Ch 7 |
| **Resize Handle** | Small square elements on selected controls for resizing (8 per control: corners + edges) | Ch 9 |
| **Rubber-Band Selection** | Dragging on empty canvas to draw a rectangle that selects all enclosed controls | Ch 9 |
| **Screen Coordinates** | Pixel coordinates relative to the browser viewport | Ch 5 |
| **Selection Model** | The observable collection tracking which controls are currently selected | Ch 9 |
| **Smart Alignment Guide** | A visual line that appears when a dragged control aligns with another control's edge | Ch 5, 19 |
| **Snap-to-Grid** | Constraining control positions to multiples of the grid size | Ch 5 |
| **Spec** | A structured specification document in `docs/specs/` following the template in Ch 21 | Ch 21 |
| **Surface** | The inner scrollable area of the canvas where controls are placed | Ch 5 |
| **Value Editor Registry** | A map from data types to inline editor controls used in the Property Grid | Ch 7 |
| **WCAG** | Web Content Accessibility Guidelines — the standard for accessible web content | Ch 20 |
| **WYSIWYG** | "What You See Is What You Get" — the canvas shows the form as it looks at runtime | Ch 1 |

## A.2 Keyboard Shortcuts

### Canvas Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+C` | Copy selected controls |
| `Ctrl+X` | Cut selected controls |
| `Ctrl+V` | Paste controls |
| `Ctrl+D` | Duplicate selected controls |
| `Ctrl+A` | Select all controls |
| `Ctrl+Z` | Undo |
| `Ctrl+Y` / `Ctrl+Shift+Z` | Redo |
| `Delete` / `Backspace` | Delete selected controls |
| `Escape` | Deselect all / cancel current operation |
| `Arrow Keys` | Nudge selected controls by 1px |
| `Shift+Arrow Keys` | Nudge by grid size (8px) |
| `Tab` | Cycle through controls in tab order |
| `Ctrl+'` | Toggle grid visibility |
| `Ctrl+=` | Zoom in |
| `Ctrl+-` | Zoom out |
| `Ctrl+0` | Zoom to fit |
| `F5` | Toggle preview mode |
| `Ctrl+S` | Save form |
| `Space+Drag` | Pan the canvas |

### Property Grid Shortcuts

| Shortcut | Action |
|----------|--------|
| `Tab` | Move to next property |
| `Shift+Tab` | Move to previous property |
| `Enter` | Commit value and move to next row |
| `Escape` | Cancel editing, revert value |

## A.3 Control Type Quick Reference

| Control Type | Class Name | Category | Key Properties |
|-------------|------------|----------|---------------|
| `text_input` | `Text_Input` | Input | `name`, `label`, `input_type`, `placeholder`, `required` |
| `textarea` | `Textarea` | Input | `name`, `label`, `rows`, `placeholder` |
| `checkbox` | `Checkbox` | Input | `name`, `label`, `checked` |
| `radio_button` | `Radio_Button` | Input | `name`, `label`, `value`, `group` |
| `select_options` | `Select_Options` | Input | `name`, `label`, `options`, `multiple` |
| `combo_box` | `Combo_Box` | Input | `name`, `label`, `options`, `editable` |
| `number_input` | `Number_Input` | Input | `name`, `label`, `min`, `max`, `step` |
| `date_picker` | `Date_Picker` | Input | `name`, `label`, `format` |
| `toggle_switch` | `Toggle_Switch` | Input | `name`, `label`, `on_label`, `off_label` |
| `button` | `Button` | Action | `name`, `label`, `variant`, `disabled` |
| `panel` | `Panel` | Container | `title`, `collapsible`, `collapsed` |
| `group_box` | `Group_Box` | Container | `title`, `legend` |
| `tabbed_panel` | `Tabbed_Panel` | Container | `tabs`, `active_tab` |
| `accordion` | `Accordion` | Container | `panels`, `multi_open` |
| `split_pane` | `Split_Pane` | Container | `orientation`, `split_ratio` |
| `form_container` | `Form_Container` | Container | `layout_mode`, `label_width` |
| `data_table` | `Data_Table` | Data | `columns`, `data_source` |

## A.4 Event Quick Reference

| Event | Fired By | Payload |
|-------|----------|---------|
| `canvas_click` | Design Canvas | `{ x, y, target }` |
| `control_click` | Design Canvas | `{ control, x, y }` |
| `selection_change` | Selection Model | `{ selected: string[] }` |
| `node_added` | Document Model | `{ node, parent_id }` |
| `node_removed` | Document Model | `{ node, parent_id }` |
| `property_changed` | Document Model | `{ node_id, property, value, old_value }` |
| `node_moved` | Document Model | `{ node_id, new_parent_id, old_parent_id }` |
| `zoom_change` | Design Canvas | `{ zoom, previousZoom }` |
| `mode_change` | Design Canvas | `{ mode, previousMode }` |
| `command_executed` | Command History | `{ command }` |
| `undo` | Command History | `{ command }` |
| `redo` | Command History | `{ command }` |

## A.5 File Format Reference

### .form.json Structure

```json
{
    "version": "1.0",
    "name": "form-name",
    "title": "Human Readable Title",
    "description": "Optional description",
    "canvas": {
        "width": 800,
        "height": 600,
        "grid_size": [8, 8],
        "background": "#ffffff"
    },
    "root": {
        "id": "node_0001",
        "control_type": "form_container",
        "properties": { ... },
        "children": [ ... ]
    },
    "metadata": {
        "created": "ISO-8601",
        "modified": "ISO-8601",
        "author": "Author Name",
        "target_theme": "default"
    }
}
```

## A.6 CSS Class Reference

| Class | Applied To | Purpose |
|-------|-----------|---------|
| `.design-canvas-container` | Canvas wrapper | Contains viewport and coordinate bar |
| `.design-canvas-viewport` | Scrollable area | Manages scroll and zoom |
| `.design-canvas-surface` | Inner surface | Hosts controls and grid |
| `.design-surface-item` | Control wrapper | Wraps each placed control |
| `.design-surface-item.selected` | Selected control | Shows selection outline |
| `.resize-handle` | Resize squares | 8 handles per selected control |
| `.canvas-grid` | Grid overlay | SVG dot grid |
| `.canvas-overlay` | Overlay layer | Selection outlines, guides |
| `.alignment-guide` | Guide line | Red alignment line during drag |
| `.drop-zone` | Container highlight | Blue highlight during drag-over |

---

*Use this appendix as a quick lookup while working with the designer. For full details, see the referenced chapters.*
