# Chapter 7 — Property Editing & the Property Grid

## The Inspector Panel

When the user selects a control on the design canvas, the right panel — the Inspector Panel — shows that control's editable properties. This is the same concept as Visual Studio's Properties window: a two-column grid with property names on the left and editors on the right.

jsgui3-html provides two controls for this purpose:

1. **`Property_Grid`** — a VS-style two-column property grid with type-aware value editors, collapsible groups, keyboard navigation, and validation. This is the primary choice for the designer.

2. **`Property_Editor`** — a simpler panel that creates text inputs and checkboxes for editing selected item properties. This was used in the WYSIWYG prototype.

The production designer uses `Property_Grid` because of its superior features: the value editor registry, the grouped/collapsible layout, and the keyboard navigation.

## The Property Grid

**File:** `jsgui3-html/controls/organised/1-standard/1-editor/Property_Grid.js`  
**Lines:** ~359

The `Property_Grid` takes two inputs:

1. **A schema** — an array of property definitions, optionally grouped. Each property definition specifies the key, label, data type, and type-specific options (min/max, enum values, etc.).

2. **A data object** — a plain JavaScript object with the current property values.

### Schema Format

```javascript
const schema = [
    {
        group: 'Common',
        fields: [
            { key: 'name', label: 'Name', type: 'text' },
            { key: 'visible', label: 'Visible', type: 'boolean' },
            { key: 'enabled', label: 'Enabled', type: 'boolean' }
        ]
    },
    {
        group: 'Layout',
        fields: [
            { key: 'x', label: 'Left', type: 'number', min: 0 },
            { key: 'y', label: 'Top', type: 'number', min: 0 },
            { key: 'width', label: 'Width', type: 'number', min: 1 },
            { key: 'height', label: 'Height', type: 'number', min: 1 }
        ]
    },
    {
        group: 'Appearance',
        fields: [
            { key: 'label', label: 'Label', type: 'text' },
            { key: 'placeholder', label: 'Placeholder', type: 'text' },
            { key: 'css_class', label: 'CSS Class', type: 'text' },
            { key: 'background_color', label: 'Background', type: 'color' }
        ]
    },
    {
        group: 'Validation',
        fields: [
            { key: 'required', label: 'Required', type: 'boolean' },
            { key: 'min_length', label: 'Min Length', type: 'number', min: 0 },
            { key: 'max_length', label: 'Max Length', type: 'number', min: 0 },
            { key: 'pattern', label: 'Pattern', type: 'text' }
        ]
    }
];
```

### Creating a Property Grid

```javascript
const Property_Grid = require('jsgui3-html/controls/organised/1-standard/1-editor/Property_Grid');

const property_grid = new Property_Grid({
    context,
    schema: schema,
    data: {
        name: 'txtFirstName',
        visible: true,
        enabled: true,
        x: 16,
        y: 24,
        width: 200,
        height: 32,
        label: 'First Name',
        placeholder: 'Enter your first name',
        required: true
    }
});
```

### Property Change Events

When the user edits a value in the Property Grid, it fires a `'property-change'` event:

```javascript
property_grid.on('property-change', (e) => {
    const { key, value, old, valid } = e;
    console.log(`Property "${key}" changed from "${old}" to "${value}"`);

    if (valid) {
        // Update the document model
        const cmd = new ChangePropertyCommand(
            selected_node_id, key, old, value
        );
        command_history.execute(cmd);
    }
});
```

The event includes the property key, the new value, the old value, and a `valid` flag indicating whether the value passed the editor's validation rules.

### Validation Errors

When a value fails validation (e.g. a negative number for a field with `min: 0`), the Property Grid fires a `'validation-error'` event and highlights the row with a red accent:

```javascript
property_grid.on('validation-error', (e) => {
    const { key, message } = e;
    status_bar.show_message(`Invalid value for ${key}: ${message}`);
});
```

## The Value Editor Registry

**File:** `jsgui3-html/controls/organised/1-standard/1-editor/value_editors/value_editor_registry.js`

The Property Grid does not create editors directly. Instead, it calls `create_editor(type, options)` from the value editor registry, which maps type strings to editor classes:

| Type | Editor Class | Widget |
|------|-------------|--------|
| `'text'` | `Text_Value_Editor` | Inline text input |
| `'number'` | `Number_Value_Editor` | Number input with validation |
| `'boolean'` | `Boolean_Value_Editor` | Checkbox |
| `'color'` | `Color_Value_Editor` | Colour swatch + colour picker popup |
| `'date'` | `Date_Value_Editor` | Date input + date picker popup |
| `'enum'` | `Enum_Value_Editor` | Dropdown select |

### Registering Custom Editors

The registry is extensible. For the designer, we can add custom editor types:

```javascript
const { register_editor } = require(
    'jsgui3-html/controls/organised/1-standard/1-editor/' +
    'value_editors/value_editor_registry'
);

// A custom editor for CSS unit values (e.g., "100px", "50%", "auto")
class CSS_Unit_Editor extends Value_Editor_Base {
    // ...
}

register_editor('css_unit', CSS_Unit_Editor);
```

Now any property in the schema with `type: 'css_unit'` will automatically use the `CSS_Unit_Editor`.

### The Value Editor Base Class

**File:** `value_editors/Value_Editor_Base.js`

All value editors extend `Value_Editor_Base`, which provides:

- `get_value()` — returns the current value.
- `set_value(value, options)` — sets the value, optionally suppressing the change event.
- `validate()` — returns `{ valid, message }`.
- `'value-change'` event — fired when the user changes the value.

Custom editors override the `compose()` method to build their UI and wire their internal controls to the `get_value` / `set_value` / `validate` interface.

## Loading Properties for a Selected Control

When the selection changes on the canvas, the inspector panel loads the appropriate schema and data for the selected control:

```javascript
selection_model.on('change', (e) => {
    const selected_ids = selection_model.get_selected();

    if (selected_ids.length === 0) {
        // Nothing selected — show the canvas/form properties
        inspector.load_form_properties();
    } else if (selected_ids.length === 1) {
        // Single selection — show the control's properties
        const node = document_model.get_node(selected_ids[0]);
        const schema = control_registry.get(node.control_type).property_schema;
        inspector.load_properties(schema, node.properties);
    } else {
        // Multi-selection — show common properties
        inspector.load_multi_properties(selected_ids);
    }
});
```

### Multi-Selection Properties

When multiple controls are selected, the property grid shows only the properties that all selected controls share. If all values are identical, that value is displayed. If they differ, the editor shows a blank or "varies" indicator.

Changing a property in a multi-selection applies the change to all selected controls simultaneously. This is implemented as a compound command (a single undo step that contains multiple property changes).

### Form-Level Properties

When no controls are selected, the inspector shows properties of the form itself:

- Form title
- Form description
- Default width and height
- Background colour
- Grid size
- Snap settings
- Target theme

These are stored in the document model's root node.

## Property Schemas per Control Type

Each control type registered in the control registry includes a `property_schema` — the array of property definitions that the Property Grid uses when that control type is selected.

### Example: Text Input Schema

```javascript
{
    id: 'text_input',
    label: 'Text Input',
    category: 'Common Controls',
    control_class: Text_Input,
    property_schema: [
        {
            group: 'Common',
            fields: [
                { key: 'name', label: 'Name', type: 'text', required: true },
                { key: 'visible', label: 'Visible', type: 'boolean' },
                { key: 'enabled', label: 'Enabled', type: 'boolean' },
                { key: 'tab_index', label: 'Tab Index', type: 'number', min: -1 }
            ]
        },
        {
            group: 'Text',
            fields: [
                { key: 'label', label: 'Label', type: 'text' },
                { key: 'placeholder', label: 'Placeholder', type: 'text' },
                { key: 'value', label: 'Default Value', type: 'text' },
                { key: 'max_length', label: 'Max Length', type: 'number', min: 0 },
                { key: 'input_type', label: 'Input Type', type: 'enum',
                  options: ['text', 'email', 'password', 'url', 'tel', 'search'] }
            ]
        },
        {
            group: 'Validation',
            fields: [
                { key: 'required', label: 'Required', type: 'boolean' },
                { key: 'pattern', label: 'Pattern (Regex)', type: 'text' },
                { key: 'mask_type', label: 'Input Mask', type: 'enum',
                  options: ['none', 'phone', 'credit_card', 'date', 'custom'] },
                { key: 'mask_pattern', label: 'Mask Pattern', type: 'text' }
            ]
        },
        {
            group: 'Layout',
            fields: [
                { key: 'x', label: 'Left', type: 'number' },
                { key: 'y', label: 'Top', type: 'number' },
                { key: 'width', label: 'Width', type: 'number', min: 20 },
                { key: 'height', label: 'Height', type: 'number', min: 16 }
            ]
        },
        {
            group: 'Appearance',
            fields: [
                { key: 'css_class', label: 'CSS Class', type: 'text' },
                { key: 'font_size', label: 'Font Size', type: 'number', min: 8 }
            ]
        }
    ]
}
```

### Example: Panel Schema

```javascript
{
    id: 'panel',
    label: 'Panel',
    category: 'Layout Containers',
    control_class: Panel,
    is_container: true,
    property_schema: [
        {
            group: 'Common',
            fields: [
                { key: 'name', label: 'Name', type: 'text', required: true },
                { key: 'visible', label: 'Visible', type: 'boolean' },
                { key: 'title', label: 'Title', type: 'text' }
            ]
        },
        {
            group: 'Layout',
            fields: [
                { key: 'x', label: 'Left', type: 'number' },
                { key: 'y', label: 'Top', type: 'number' },
                { key: 'width', label: 'Width', type: 'number', min: 40 },
                { key: 'height', label: 'Height', type: 'number', min: 30 },
                { key: 'padding', label: 'Padding', type: 'number', min: 0 },
                { key: 'layout_mode', label: 'Layout', type: 'enum',
                  options: ['none', 'vertical', 'horizontal', 'grid'] }
            ]
        },
        {
            group: 'Appearance',
            fields: [
                { key: 'show_border', label: 'Show Border', type: 'boolean' },
                { key: 'background_color', label: 'Background', type: 'color' },
                { key: 'border_radius', label: 'Border Radius', type: 'number', min: 0 }
            ]
        }
    ]
}
```

## Live Property Updates

When the user changes a property in the Property Grid, the change propagates immediately to the control on the canvas. This creates a tight feedback loop: change a label → see it update instantly.

The flow is:

1. User edits a value in the Property Grid.
2. Property Grid fires `'property-change'` event.
3. Inspector Panel creates a `ChangePropertyCommand` and executes it.
4. The command updates the document model node's property.
5. The document model fires a `'property-changed'` event.
6. The canvas's `Design_Surface_Item` listener receives the event.
7. The inner control is updated (e.g., `text_input.set_value()` or `panel.title = ...`).
8. The user sees the change on the canvas immediately.

This two-way live binding between the Property Grid and the canvas — mediated by the document model — is one of the designer's most important user-experience features.

## The Inspector Panel Wrapper

The Inspector Panel is not just a naked Property Grid. It wraps the Property Grid in a `Tabbed_Panel` with multiple tabs:

### Properties Tab
The main tab, showing the `Property_Grid` for the selected control.

### Events Tab
Lists the events that the selected control can emit (e.g., `'click'`, `'change'`, `'submit'`). The user can bind each event to an action — navigate to a page, show a message, call an API, or execute custom JavaScript.

### Layout Tab
Shows alignment and distribution tools — align left, align right, centre horizontally, distribute vertically, etc. These tools operate on the current selection and are particularly useful when multiple controls are selected.

### Data Tab
Shows data binding options — connecting control properties to data sources, model fields, or API endpoints. This tab is covered in Chapter 15.

```javascript
const Tabbed_Panel = require('jsgui3-html/controls/organised/1-standard/6-layout/Tabbed_Panel');

class Inspector_Panel extends Control {
    constructor(spec) {
        super(spec);
        this.add_class('inspector-panel');

        const { context } = this;

        this.tabs = new Tabbed_Panel({ context });

        // Properties tab
        this.property_grid = new Property_Grid({ context, schema: [], data: {} });
        this.tabs.add_tab('properties', 'Properties', this.property_grid);

        // Events tab
        this.events_panel = new Control({ context, tag_name: 'div' });
        this.tabs.add_tab('events', 'Events', this.events_panel);

        // Layout tab
        this.layout_panel = new Control({ context, tag_name: 'div' });
        this.tabs.add_tab('layout', 'Layout', this.layout_panel);

        this.add(this.tabs);
    }

    load_properties(schema, data) {
        // Update the Property Grid with new schema and data
        this.property_grid.set_schema(schema);
        this.property_grid.set_values(data);
    }
}
```

## Relationship to the Prototype

The WYSIWYG form builder prototype used `Property_Editor` — a simpler control that creates text inputs and checkboxes dynamically based on the selected field. It handled each property type manually:

```javascript
// From the prototype's Property_Editor
this._add_property_group(context, 'Label', properties.label || '', (value) => {
    properties.label = value;
    if (this.on_change) this.on_change();
});
```

The production designer replaces this with `Property_Grid` and the value editor registry, gaining:

- Automatic type-aware editors (color pickers, date pickers, enum dropdowns).
- Collapsible property groups with persistent state.
- Keyboard navigation between property rows.
- Validation with visual error indicators.
- Extensibility through custom value editors.

This is a substantial upgrade from the prototype, and it is achieved by using an existing control rather than building something new.

## Summary

The property editing system:

- Uses `Property_Grid` from `jsgui3-html` for a VS-style two-column property inspector.
- Leverages the `value_editor_registry` for type-specific inline editors (text, number, boolean, color, date, enum).
- Supports custom value editors through the extensible registry.
- Loads property schemas dynamically from the control registry based on the selected control type.
- Supports multi-selection with common-property editing.
- Provides live updates: property changes propagate instantly to the canvas.
- Wraps the Property Grid in a `Tabbed_Panel` with additional tabs for events, layout, and data binding.
