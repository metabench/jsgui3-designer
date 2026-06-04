# Chapter 15 — Data Binding & MVVM

## The Model-View-ViewModel Pattern

Data binding is the mechanism that connects a form's controls to a data source. When the user types into a text field, that value needs to end up in a model. When the model changes (e.g., a record is loaded from a database), the form controls need to update to show the new values.

In jsgui3, this is implemented through the **Model-View-ViewModel (MVVM)** pattern, powered by the `Data_Object` class from `lang-tools`.

## Data_Object: The Observable Model

`Data_Object` is the reactive data container at the foundation of jsgui3's data layer. It provides:

- **Observable properties** — when a value is set, change listeners are notified.
- **Deep observation** — changes to nested objects propagate.
- **Batch updates** — multiple property changes can be grouped into a single notification.

```javascript
const { Data_Object } = require('lang-tools');

const person = new Data_Object({ context });
person.set('firstName', 'James');
person.set('lastName', 'Vickers');
person.set('email', 'james@example.com');

person.on('change', (e) => {
    console.log(`${e.name} → ${e.value}`);
});

person.set('firstName', 'Jim');
// Output: "firstName → Jim"
```

## How Form_Container Uses Data_Object

The `Form_Container` control from Chapter 10 maintains three `Data_Object` instances:

1. **`form.values`** — the current field values.
2. **`form.validation`** — per-field validation state.
3. **`form.errors`** — per-field error messages.

When the user types into a text field, the form's `values` object is updated. When a validation rule fails, the `errors` object is updated. These changes propagate to any listeners — including the form fields themselves, which update their visual status.

This is two-way binding: UI → model (user input updates values) and model → UI (changing values programmatically updates the controls).

## Binding at Design Time

The designer's property grid includes a **Data** tab where the user can configure data binding for each control. This goes beyond simple label/placeholder configuration — it connects the control to a data source.

### Binding Properties

For each control, the user can set:

| Property | Description |
|----------|-------------|
| `data_field` | The field name in the data model that this control binds to |
| `data_source` | Which data source this control reads from (for multi-source forms) |
| `binding_mode` | `'two-way'` (default), `'one-way'`, or `'one-time'` |
| `format` | A transform applied when displaying the value (e.g., date formatting) |
| `parse` | A transform applied when writing the value back (e.g., string → number) |

### Example: Binding a Text Input

In the property grid's Data tab:

```
Data Field:     [firstName        ]
Data Source:    [default           ▾]
Binding Mode:   [Two-way           ▾]
Format:        [                  ]
Parse:         [                  ]
```

This stores in the document model:

```javascript
{
    id: 'node_002',
    control_type: 'text_input',
    properties: {
        name: 'txtFirstName',
        label: 'First Name',
        data_field: 'firstName',
        data_source: 'default',
        binding_mode: 'two-way'
    }
}
```

### At Runtime

When the designed form is rendered, the data binding configuration is used to wire controls to a `Data_Object`:

```javascript
function bind_form_to_model(form_container, model) {
    for (const field of form_container.fields) {
        const binding = field.data_binding;
        if (!binding) continue;

        const control = field.input_control;

        // Model → UI
        model.on('change', (e) => {
            if (e.name === binding.data_field) {
                let value = e.value;
                if (binding.format) value = binding.format(value);
                control.set_value(value);
            }
        });

        // UI → Model (only for two-way binding)
        if (binding.binding_mode === 'two-way') {
            control.on('change', () => {
                let value = control.get_value();
                if (binding.parse) value = binding.parse(value);
                model.set(binding.data_field, value);
            });
        }
    }

    // Initial population
    for (const field of form_container.fields) {
        const binding = field.data_binding;
        if (!binding) continue;

        let value = model.get(binding.data_field);
        if (binding.format) value = binding.format(value);
        field.input_control.set_value(value);
    }
}
```

## The Data_Model_View_Model_Control Pattern

The WYSIWYG prototype used `Data_Model_View_Model_Control` — a jsgui3 control that extends `Control` with a built-in `Data_Object` model. This pattern is useful for the designer itself:

```javascript
const Data_Model_View_Model_Control = require(
    'jsgui3-html/controls/organised/0-core/0-basic/Data_Model_View_Model_Control'
);

class FormBuilder extends Data_Model_View_Model_Control {
    constructor(spec) {
        super(spec);

        // The model tracks the designer's state
        this.model.set('mode', 'edit');        // 'edit' | 'preview'
        this.model.set('selected_index', -1);
        this.model.set('fields', []);
        this.model.set('modified', false);

        // React to model changes
        this.model.on('change', (e) => {
            if (e.name === 'mode') {
                this._switch_mode(e.value);
            }
            if (e.name === 'selected_index') {
                this._update_selection(e.value);
            }
        });
    }
}
```

This pattern keeps the designer's own state (which mode are we in, what is selected, is the document modified) in an observable model, enabling reactive UI updates.

## Server-Side Data Sources

For forms that load data from a server, the `Data_Get_Post_Delete_HTTP_Resource` from `jsgui3-client` provides the transport:

```javascript
const Data_Get_Post_Delete_HTTP_Resource = require(
    'jsgui3-client/data-get-post-delete-http-resource'
);

const person_resource = new Data_Get_Post_Delete_HTTP_Resource({
    base_url: '/api/people'
});

// Load a person's data
const person = await person_resource.get('/123');

// Bind to form
bind_form_to_model(form, person);

// Save updated data
form.on('submit', async () => {
    if (form.validate().valid) {
        await person_resource.post('/123', form.get_values());
    }
});
```

## SSE for Real-Time Updates

For forms that need real-time data updates (e.g., a dashboard with live metrics), `jsgui3-client` provides `SSE_Resource` for server-sent events:

```javascript
const SSE_Resource = require('jsgui3-client/sse-resource');

const live_data = new SSE_Resource({ url: '/api/live/metrics' });

live_data.on('data', (metrics) => {
    model.set('cpu_usage', metrics.cpu);
    model.set('memory_usage', metrics.memory);
    // The bound controls update automatically
});
```

## Computed Properties

Some form fields display calculated values — a "Full Name" that concatenates first and last name, a "Total" that sums line items. The designer supports these through computed bindings:

```javascript
{
    name: 'txtFullName',
    label: 'Full Name',
    data_binding: {
        computed: true,
        depends_on: ['firstName', 'lastName'],
        compute: (model) => {
            return `${model.get('firstName')} ${model.get('lastName')}`;
        }
    }
}
```

At design time, the Property Grid's Data tab shows a formula editor for computed fields. At runtime, the computed value is recalculated whenever any of its dependencies change.

## Data Source Configuration

The designer allows the user to configure data sources for the form:

### Static Data Source

For dropdowns, lists, and combo boxes, the data source is a static array of options:

```javascript
{
    name: 'ddlCountry',
    label: 'Country',
    type: 'select',
    data_source: {
        type: 'static',
        items: [
            { value: 'GB', label: 'United Kingdom' },
            { value: 'US', label: 'United States' },
            { value: 'FR', label: 'France' }
        ]
    }
}
```

### API Data Source

For dropdowns populated from an API:

```javascript
{
    name: 'ddlDepartment',
    label: 'Department',
    type: 'combo_box',
    data_source: {
        type: 'api',
        url: '/api/departments',
        value_field: 'id',
        label_field: 'name'
    }
}
```

At runtime, the form fetches the data from the API and populates the control.

## Cascading Data Sources

Some forms have dependent fields — selecting a country populates the cities dropdown, selecting a department populates the team dropdown. The designer supports cascading dependencies:

```javascript
{
    name: 'ddlCity',
    label: 'City',
    type: 'combo_box',
    data_source: {
        type: 'api',
        url: '/api/cities',
        depends_on: 'ddlCountry',
        params: { country: '{ddlCountry}' }
    }
}
```

When the country dropdown changes, the city dropdown reloads with filtered results.

## Summary

Data binding in the designer:

- Is powered by `Data_Object` from `lang-tools` for observable models.
- Supports two-way, one-way, and one-time binding modes.
- Integrates with `Data_Get_Post_Delete_HTTP_Resource` for server data.
- Supports real-time updates via `SSE_Resource`.
- Enables computed properties with dependency tracking.
- Supports static, API, and cascading data sources.
- Is configured through the Property Grid's Data tab at design time.
- Is executed automatically at runtime by the form rendering engine.
