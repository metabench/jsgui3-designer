# Chapter 16 — Building Custom Controls

## Extensibility by Design

A form builder that only supports its built-in set of controls is a limited tool. Business applications need domain-specific controls — an address lookup, a currency selector, a CAPTCHA widget, a signature pad, a product configurator. The designer must be extensible: developers should be able to create custom controls and have them appear in the palette, be placeable on the canvas, and be editable in the property grid.

In jsgui3-designer, this is achieved through the **control registry**. Adding a custom control to the designer is a matter of:

1. Writing the control class (extending `Control`).
2. Registering it with a property schema and metadata.

## Writing a Custom Control

A custom control follows the same patterns as every control in `jsgui3-html`:

```javascript
const jsgui = require('jsgui3-html/html-core/html-core');
const { Control } = jsgui;
const Text_Input = require('jsgui3-html/controls/organised/0-core/0-basic/0-native-compositional/Text_Input');
const Button = require('jsgui3-html/controls/organised/0-core/0-basic/0-native-compositional/Button');

class Address_Lookup extends Control {
    constructor(spec = {}) {
        spec.__type_name = spec.__type_name || 'address_lookup';
        super(spec);
        this.add_class('address-lookup');

        if (!spec.el) {
            this.compose(spec);
        }
    }

    compose(spec) {
        const { context } = this;

        // Search row
        this.search_row = new Control({ context, tag_name: 'div' });
        this.search_row.add_class('address-search-row');

        this.search_input = new Text_Input({
            context,
            placeholder: spec.placeholder || 'Start typing an address...'
        });

        this.search_button = new Button({
            context,
            label: spec.button_label || 'Find'
        });

        this.search_row.add(this.search_input);
        this.search_row.add(this.search_button);
        this.add(this.search_row);

        // Results area
        this.results = new Control({ context, tag_name: 'div' });
        this.results.add_class('address-results');
        this.add(this.results);

        // Detail fields (populated after selection)
        this.detail_fields = new Control({ context, tag_name: 'div' });
        this.detail_fields.add_class('address-details');
        this.add(this.detail_fields);
    }

    activate() {
        if (!this.__active) {
            super.activate();

            this.search_button.on('click', () => {
                this._do_search(this.search_input.get_value());
            });

            this.search_input.on('keydown', (e) => {
                if (e.key === 'Enter') {
                    this._do_search(this.search_input.get_value());
                }
            });
        }
    }

    async _do_search(query) {
        // Implementation: call address API, display results, etc.
    }

    get_value() {
        return this._selected_address;
    }

    set_value(address) {
        this._selected_address = address;
        this._display_address(address);
    }
}

Address_Lookup.css = `
.address-lookup {
    display: flex;
    flex-direction: column;
    gap: 8px;
}
.address-search-row {
    display: flex;
    gap: 8px;
}
.address-search-row .jsgui-text-input {
    flex: 1;
}
.address-results {
    max-height: 200px;
    overflow-y: auto;
    border: 1px solid var(--admin-border, #e2e8f0);
    border-radius: var(--j-radius, 4px);
    display: none;
}
.address-details {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 4px 12px;
}
`;

module.exports = Address_Lookup;
```

Key points:

- The control extends `Control` and follows the `__type_name`, `compose`, `activate` pattern.
- It is composed from existing controls (`Text_Input`, `Button`).
- It has a static `css` property for its styles.
- It implements `get_value()` and `set_value()` for data binding compatibility.

## Registering a Custom Control

The control registry is the central database that the palette, canvas, and property grid all consult:

```javascript
const control_registry = require('./models/control_registry');
const Address_Lookup = require('./custom_controls/Address_Lookup');

control_registry.register({
    id: 'address_lookup',
    label: 'Address Lookup',
    icon: '📍',
    category: 'Custom Controls',
    control_class: Address_Lookup,
    require_path: './custom_controls/Address_Lookup',

    default_size: [400, 180],

    default_spec: () => ({
        placeholder: 'Start typing an address...',
        button_label: 'Find',
        api_key: '',
        country_filter: ''
    }),

    is_container: false,

    property_schema: [
        {
            group: 'Common',
            fields: [
                { key: 'name', label: 'Name', type: 'text', required: true },
                { key: 'visible', label: 'Visible', type: 'boolean' },
                { key: 'enabled', label: 'Enabled', type: 'boolean' }
            ]
        },
        {
            group: 'Address Lookup',
            fields: [
                { key: 'placeholder', label: 'Placeholder', type: 'text' },
                { key: 'button_label', label: 'Button Label', type: 'text' },
                { key: 'api_key', label: 'API Key', type: 'text' },
                { key: 'country_filter', label: 'Country Filter', type: 'text' }
            ]
        },
        {
            group: 'Layout',
            fields: [
                { key: 'x', label: 'Left', type: 'number' },
                { key: 'y', label: 'Top', type: 'number' },
                { key: 'width', label: 'Width', type: 'number', min: 200 },
                { key: 'height', label: 'Height', type: 'number', min: 100 }
            ]
        }
    ]
});
```

Once registered:

- The control appears in the palette under "Custom Controls."
- Clicking it in the palette activates placement mode, creating an `Address_Lookup` on click.
- Selecting it on the canvas shows the "Address Lookup" property group in the Property Grid.
- The code generator knows its `require_path` for generating `require()` statements.
- Saving and loading works through the standard serialisation path.

## Design-Time vs. Runtime Behaviour

Custom controls may need different behaviour at design time and runtime. For example, the `Address_Lookup` should not make actual API calls when it is on the design canvas — it should show a placeholder representation of the control.

This is handled by checking the context or a `design_mode` flag:

```javascript
compose(spec) {
    const { context } = this;

    if (spec.design_mode) {
        // Show a simplified placeholder at design time
        this.add_class('design-mode-placeholder');
        const placeholder = new Control({ context, tag_name: 'div' });
        placeholder.add('📍 Address Lookup');
        placeholder.add_class('placeholder-label');
        this.add(placeholder);
    } else {
        // Full interactive version at runtime
        this._compose_full(spec);
    }
}
```

When the design canvas creates a control, it passes `design_mode: true` in the specification. In preview mode, controls are created without this flag.

## Creating Container Controls

Container controls — those that can hold child controls — need additional registration:

```javascript
control_registry.register({
    id: 'card',
    label: 'Card',
    icon: '🃏',
    category: 'Custom Controls',
    control_class: Card,
    is_container: true,

    drop_zone_spec: {
        accepts: ['*'],          // Accepts any control type
        max_children: 10,        // Maximum children
        layout: 'vertical'      // How children are arranged
    },

    property_schema: [
        {
            group: 'Card',
            fields: [
                { key: 'title', label: 'Title', type: 'text' },
                { key: 'subtitle', label: 'Subtitle', type: 'text' },
                { key: 'elevated', label: 'Elevated', type: 'boolean' },
                { key: 'padding', label: 'Padding', type: 'number', min: 0 }
            ]
        }
    ]
});
```

The `is_container: true` flag tells the designer that other controls can be dropped into this control. The `drop_zone_spec` provides additional configuration: which control types are accepted, how many children are allowed, and how children are arranged.

On the design canvas, container controls show a dashed outline when a control is being dragged over them, indicating they are valid drop targets.

## Custom Value Editors

If your custom control has properties that the built-in value editors (text, number, boolean, color, date, enum) cannot handle, you can create custom value editors. For example, an `Address_Lookup` might need an "API Provider" editor that shows a branded dropdown with logos:

```javascript
const { Value_Editor_Base } = require(
    'jsgui3-html/controls/organised/1-standard/1-editor/value_editors/Value_Editor_Base'
);
const { register_editor } = require(
    'jsgui3-html/controls/organised/1-standard/1-editor/value_editors/value_editor_registry'
);

class API_Provider_Editor extends Value_Editor_Base {
    compose() {
        const { context } = this;

        this.select = new Control({ context, tag_name: 'select' });

        const providers = [
            { value: 'google', label: 'Google Maps' },
            { value: 'mapbox', label: 'Mapbox' },
            { value: 'here', label: 'HERE' },
            { value: 'ordnance', label: 'Ordnance Survey' }
        ];

        for (const p of providers) {
            const option = new Control({ context, tag_name: 'option' });
            option.dom.attributes.value = p.value;
            option.add(p.label);
            this.select.add(option);
        }

        this.add(this.select);
    }

    get_value() {
        return this.select.dom.el ? this.select.dom.el.value : this._value;
    }

    set_value(value) {
        this._value = value;
        if (this.select.dom.el) {
            this.select.dom.el.value = value;
        }
    }
}

// Register it
register_editor('api_provider', API_Provider_Editor);
```

Then use it in the property schema:

```javascript
{ key: 'api_provider', label: 'API Provider', type: 'api_provider' }
```

The Property Grid will now use the `API_Provider_Editor` when displaying this property.

## Loading Custom Controls as Plugins

For larger organisations, custom controls can be packaged as npm modules and loaded dynamically:

```javascript
// In the designer's configuration
const plugins = [
    'jsgui3-designer-plugin-maps',
    'jsgui3-designer-plugin-charts',
    'my-company-form-controls'
];

for (const plugin_name of plugins) {
    const plugin = require(plugin_name);
    if (plugin.register) {
        plugin.register(control_registry);
    }
}
```

A plugin exports a `register` function that adds its controls to the registry:

```javascript
// jsgui3-designer-plugin-maps/index.js
const Map_View = require('./controls/Map_View');
const Address_Lookup = require('./controls/Address_Lookup');

module.exports = {
    register(registry) {
        registry.register({ id: 'map_view', ... });
        registry.register({ id: 'address_lookup', ... });
    }
};
```

## Best Practices for Custom Controls

1. **Follow the patterns.** Use `__type_name`, `compose()`, `activate()`, static `css`, and `get_value()` / `set_value()`. This ensures your control works seamlessly with the designer's infrastructure.

2. **Use CSS variables.** Style your control with `var(--admin-text)`, `var(--admin-border)`, etc. This ensures it responds to theme changes.

3. **Support `design_mode`.** Provide a simplified design-time appearance that communicates the control's purpose without executing its runtime logic.

4. **Provide a complete property schema.** The more properties you expose in the Property Grid, the more configurable your control is in the designer.

5. **Implement `get_value()` and `set_value()`.** This enables data binding and makes your control work with `Form_Container`.

6. **Use existing controls.** Compose your custom control from existing `jsgui3-html` controls rather than building from raw DOM. This reduces code, improves consistency, and ensures theme support.

## Summary

Custom control development:

- Follows the standard jsgui3-html control patterns.
- Is registered via the control registry with metadata and property schema.
- Automatically appears in the palette, is placeable on the canvas, and is editable in the Property Grid.
- Supports design-time vs. runtime behaviour modes.
- Can extend the value editor registry for custom property types.
- Can be packaged as plugins for distribution.
