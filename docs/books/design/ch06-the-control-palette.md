# Chapter 6 — The Control Palette & Toolbox

## The Palette Panel

The control palette is the left panel of the designer. It presents the available controls as a categorised, scrollable list. The user clicks an item in the palette to select a tool, then clicks (or click-drags) on the canvas to place a control of that type.

In Visual Studio's Windows Forms designer, this panel is called the "Toolbox." jsgui3-html already has a `Toolbox` control — a grouped tool palette with collapsible groups, tool selection, keyboard navigation, and hover events. The designer's palette is built on top of it.

## The Toolbox Control

**File:** `jsgui3-html/controls/organised/1-standard/5-ui/Toolbox.js`  
**Lines:** ~343

The `Toolbox` control provides:

- **Collapsible groups** — each group has a header that can be clicked to collapse or expand the group. This uses the `collapsible` mixin internally.
- **Tool buttons** — each tool is a clickable row with an optional icon, a label, and an optional keyboard shortcut indicator.
- **Active tool tracking** — one tool can be active at a time. The active tool is highlighted with a distinctive background colour.
- **Selection events** — when the user clicks a tool, the Toolbox emits a `'select'` event with the `tool_id`, the tool specification, and the previously active tool.
- **Hover events** — when the user hovers over a tool, the Toolbox emits a `'hover'` event.

### Creating a Toolbox

```javascript
const Toolbox = require('jsgui3-html/controls/organised/1-standard/5-ui/Toolbox');

const palette = new Toolbox({
    context,
    groups: [
        {
            id: 'pointer',
            label: 'Tools',
            tools: [
                { id: 'select', icon: '⬆', label: 'Select / Move', shortcut: 'V' }
            ]
        },
        {
            id: 'common',
            label: 'Common Controls',
            tools: [
                { id: 'label',      icon: 'Aa', label: 'Label' },
                { id: 'text_input', icon: '▭',  label: 'Text Input' },
                { id: 'button',     icon: '⬜', label: 'Button' },
                { id: 'checkbox',   icon: '☐',  label: 'Checkbox' },
                { id: 'radio',      icon: '◉',  label: 'Radio Button' },
                { id: 'select',     icon: '▾',  label: 'Dropdown' }
            ]
        },
        {
            id: 'input',
            label: 'Input Controls',
            tools: [
                { id: 'textarea',     icon: '≡',  label: 'Text Area' },
                { id: 'number_input', icon: '#',  label: 'Number Input' },
                { id: 'date_picker',  icon: '📅', label: 'Date Picker' },
                { id: 'time_picker',  icon: '🕐', label: 'Time Picker' },
                { id: 'color_picker', icon: '🎨', label: 'Colour Picker' },
                { id: 'file_upload',  icon: '📎', label: 'File Upload' },
                { id: 'range_input',  icon: '—',  label: 'Slider' },
                { id: 'toggle_switch',icon: '⚙',  label: 'Toggle Switch' }
            ]
        },
        {
            id: 'layout',
            label: 'Layout Containers',
            tools: [
                { id: 'panel',        icon: '▢',  label: 'Panel' },
                { id: 'group_box',    icon: '▣',  label: 'Group Box' },
                { id: 'tabbed_panel', icon: '⊞',  label: 'Tab Control' },
                { id: 'accordion',    icon: '☰',  label: 'Accordion' },
                { id: 'split_pane',   icon: '⫿',  label: 'Split Pane' },
                { id: 'stack',        icon: '▥',  label: 'Stack' }
            ]
        },
        {
            id: 'data',
            label: 'Data Controls',
            tools: [
                { id: 'data_table',   icon: '▦',  label: 'Data Table' },
                { id: 'data_grid',    icon: '▩',  label: 'Data Grid' },
                { id: 'tree_view',    icon: '🌲', label: 'Tree View' },
                { id: 'list_view',    icon: '☰',  label: 'List View' }
            ]
        }
    ],
    active_tool: 'select'
});
```

### Handling Tool Selection

When the user selects a tool in the palette, the designer enters "placement mode" for that tool. The next click on the canvas will create an instance of the selected control:

```javascript
palette.on('select', (e) => {
    const { tool_id, tool } = e;

    if (tool_id === 'select') {
        // The pointer tool — switch to selection mode
        canvas.set_mode('select');
    } else {
        // A control tool — switch to placement mode
        canvas.set_mode('place', { control_type: tool_id });
    }
});
```

In placement mode, the canvas cursor changes to a crosshair, and the next click (or click-drag) creates the control:

- **Click** — creates the control at the default size, centred on the click point.
- **Click-drag** — creates the control with the size defined by the drag rectangle.

After placing a control, the palette automatically switches back to the pointer tool (the "one-shot" pattern used by Visual Studio and most other designer tools).

## The Palette's Relationship to the Control Registry

The control palette is not hard-coded. Its contents come from the **control registry** (`models/control_registry.js`), which maps control type IDs to:

| Property | Description |
|----------|-------------|
| `id` | Unique identifier (e.g. `'text_input'`) |
| `label` | Display name (e.g. `'Text Input'`) |
| `icon` | Palette icon |
| `category` | Group name (e.g. `'Common Controls'`) |
| `control_class` | The `jsgui3-html` constructor (e.g. `Text_Input`) |
| `default_spec` | Function returning the default constructor spec |
| `default_size` | Default `[width, height]` when placed |
| `property_schema` | Array of property definitions for the Property_Grid |
| `is_container` | Whether this control can contain children |

The palette is built from the registry at startup:

```javascript
function build_palette_from_registry(context, registry) {
    const groups_map = {};

    for (const entry of registry.all()) {
        const category = entry.category || 'Other';
        if (!groups_map[category]) {
            groups_map[category] = {
                id: category.toLowerCase().replace(/\s+/g, '_'),
                label: category,
                tools: []
            };
        }
        groups_map[category].tools.push({
            id: entry.id,
            icon: entry.icon,
            label: entry.label
        });
    }

    return new Toolbox({
        context,
        groups: Object.values(groups_map),
        active_tool: 'select'
    });
}
```

This means that adding a new control to the designer is a matter of registering it in the control registry. The palette, canvas, and property inspector all respond to the registry — no hard-coded control lists to update.

## Drag-and-Drop from Palette

Beyond click-to-place, the palette supports dragging a control directly onto the canvas. The flow is:

1. **Mousedown on a palette item** — the palette creates a ghost element (a semi-transparent copy of the palette item) and begins a drag operation.

2. **Mousemove** — the ghost follows the cursor. If the cursor is over the canvas, the canvas shows a drop indicator:
   - In absolute mode: a dotted outline rectangle at the cursor position, snapped to the grid.
   - In flow mode: a horizontal insertion line between existing controls.

3. **Mouseup over the canvas** — the control is created at the drop position. If the user dragged a rectangle (mousedown + drag), the control is created with that size.

4. **Mouseup outside the canvas** — the drag is cancelled.

This uses the `dragable` mixin on the palette items, with a custom ghost element rather than moving the actual palette item.

## Palette Customisation

Users may want to customise the palette — hiding controls they never use, rearranging groups, adding custom controls from their own codebases. The palette supports:

- **Hiding groups** — right-click the group header → "Hide Group". Hidden groups can be re-shown from a "Show All" option.
- **Custom groups** — the user can create a "Favourites" group and drag frequently-used controls into it.
- **Search** — a search bar at the top of the palette filters tools by name. This is implemented with a `Text_Input` that filters the Toolbox's visible items.

```javascript
// Search filtering
search_input.on('input', () => {
    const query = search_input.get_value().toLowerCase();
    palette.filter_tools((tool) =>
        tool.label.toLowerCase().includes(query)
    );
});
```

## The Pointer Tool

The first item in the palette is always the pointer / selection tool. When active:

- Clicking a control on the canvas selects it.
- Ctrl+clicking adds to the selection.
- Click-dragging on empty space starts a rubber-band selection.
- Click-dragging on a selected control moves it (and all other selected controls).
- Dragging a resize handle resizes the selected control.

This is the default tool and the one the user spends most of their time with. All the mechanics for this tool — selection, dragging, resizing, rubber-banding — are provided by the mixins documented in Chapter 4.

## Relationship to the WYSIWYG Prototype

The existing prototype in `jsgui3-html/dev-examples/wysiwyg-form-builder/` uses a simpler palette approach: a flat list of `PaletteItem` controls (custom `Control` subclass) with click-to-add behaviour. Each palette item stores a field type string and, on click, calls `_addField(type)` on the `FormBuilder`.

The production designer evolves this in three ways:

1. **Uses the `Toolbox` control** instead of custom palette items — getting collapsible groups, keyboard navigation, and hover events for free.

2. **Draws from the control registry** instead of a hard-coded array — making the palette extensible and data-driven.

3. **Supports drag-and-drop** in addition to click-to-place — giving the user more control over initial positioning and sizes.

## Summary

The control palette:

- Is built on the existing `Toolbox` control from `jsgui3-html`.
- Is driven by the control registry, not hard-coded lists.
- Supports click-to-place and drag-to-place workflows.
- Includes a pointer/selection tool as the default.
- Offers search, customisation, and group management.
- Automatically switches back to the pointer tool after placing a control.
