# Chapter 10 — Form Rendering with Form_Container

## From Design to Runtime

Everything in chapters 5 through 9 is about the design experience — how the user builds a form visually. This chapter is about the other side: how the designed form is rendered at runtime, when an end user fills it in.

The bridge between design time and runtime is the `Form_Container` control.

## The Form_Container Control

**File:** `jsgui3-html/controls/organised/1-standard/1-editor/Form_Container.js`  
**Lines:** ~503

`Form_Container` is a `<form>` element wrapper that takes a `fields` array and renders a complete, interactive form with labels, inputs, validation messages, and status badges.

### Constructor

```javascript
const Form_Container = require('jsgui3-html/controls/organised/1-standard/1-editor/Form_Container');

const contact_form = new Form_Container({
    context,
    fields: [
        {
            name: 'firstName',
            label: 'First Name',
            type: 'text',
            placeholder: 'Enter your first name',
            required: true
        },
        {
            name: 'email',
            label: 'Email Address',
            type: 'email',
            placeholder: 'you@example.com',
            required: true,
            validator: (value) => {
                if (!value.includes('@')) return 'Please enter a valid email';
                return true;
            }
        },
        {
            name: 'message',
            label: 'Message',
            type: 'textarea',
            placeholder: 'Your message here',
            autosize: true
        },
        {
            name: 'newsletter',
            label: 'Subscribe to newsletter',
            type: 'checkbox'
        }
    ],
    layout_mode: 'auto',       // 'auto', 'phone', 'tablet', 'desktop'
    label_width: '160px',
    show_status_badge: true
});
```

### What It Creates

For each field in the `fields` array, `Form_Container` creates:

1. A **wrapper `div`** with the class `form-container-field` and a `data-field-name` attribute.
2. A **`<label>`** element with the field's label text.
3. An **input control** — dispatched by `create_input_control()`:
   - `type: 'text'` → `Text_Input`
   - `type: 'textarea'` → `Textarea`
   - `type: 'checkbox'` → `<input type="checkbox">`
   - `type: 'email'`, `'password'`, `'number'`, `'tel'`, `'url'` → `Text_Input` with the appropriate `type` attribute
   - If `field.input_control` is provided, that control is used directly
4. An **`Inline_Validation_Message`** control for error/success messages.
5. An optional **`Badge`** control for status indicators.

### Layout System

`Form_Container` implements an adaptive layout system with three modes:

| Mode | Label Position | Input Size | Use Case |
|------|---------------|------------|----------|
| `desktop` | Side-by-side (left of input) | Standard | Wide screens |
| `tablet` | Side-by-side (narrower label) | Larger touch target | Medium screens |
| `phone` | Stacked (above input) | Largest touch target | Small screens |

When `layout_mode` is set to `'auto'`, the form automatically switches between these modes based on the viewport width, using a configurable breakpoint (default 600px).

This is implemented via a `data-layout-mode` attribute on the form element, with CSS grid variations for each mode:

```css
/* Desktop: label to the left */
.form-container-field {
    display: grid;
    grid-template-columns: var(--form-label-width, 160px) 1fr auto;
}

/* Phone: label on top */
.form-container[data-layout-mode="phone"] .form-container-field {
    grid-template-columns: 1fr;
}
```

### Form Values with Data_Object

`Form_Container` uses `Data_Object` instances for its three observable channels:

- **`this.values`** — current field values. Updated on input/change events.
- **`this.validation`** — per-field validation status objects. Updated on validate.
- **`this.errors`** — per-field error message strings. Updated on validate.

These are two-way bound: changing `this.values` updates the input controls, and user input updates `this.values`.

```javascript
// Get all form values
const data = contact_form.get_values();
// { firstName: 'Jane', email: 'jane@example.com', message: 'Hello', newsletter: true }

// Set a value programmatically
contact_form.set_value('firstName', 'James');

// Validate all fields
const result = contact_form.validate();
// { valid: false, errors: { email: 'Please enter a valid email' } }

// Submit (validates first)
const submit_result = contact_form.submit();
// Fires 'submit' event if valid, 'invalid' event if not
```

### Validation System

`Form_Container` supports multiple validation mechanisms per field:

1. **Required validation** — built in. If `field.required` is true and the value is empty, validation fails.
2. **Single validator** — `field.validator` is a function that returns `true`, `false`, a string (error message), or an object `{ valid: boolean, message: string }`.
3. **Multiple validators** — `field.validators` is an array of validator functions.

Validators receive the field value and the entire form values object, enabling cross-field validation:

```javascript
{
    name: 'confirmPassword',
    label: 'Confirm Password',
    type: 'password',
    required: true,
    validator: (value, allValues) => {
        if (value !== allValues.password) {
            return 'Passwords do not match';
        }
        return true;
    }
}
```

### The `field_status` Mixin

Each field wrapper has the `field_status` mixin applied, which manages the visual status of the field:

- **No status** — default appearance.
- **`'error'`** — red border, red error message, error badge.
- **`'success'`** — green border, success badge.

The status is updated by `update_field_status()`, which the validation system calls after each validation run.

## From Document Model to Form_Container

When the designer exports or previews a form, the document model's tree is translated into a `Form_Container` specification:

```javascript
function document_to_form_spec(document_model) {
    const root = document_model.root;
    const fields = [];

    function collect_fields(node) {
        if (is_input_type(node.control_type)) {
            fields.push({
                name: node.properties.name,
                label: node.properties.label,
                type: map_control_type_to_form_type(node.control_type),
                placeholder: node.properties.placeholder,
                required: node.properties.required,
                value: node.properties.value,
                mask_type: node.properties.mask_type,
                mask_pattern: node.properties.mask_pattern,
                validators: build_validators(node.properties)
            });
        }
        for (const child of node.children) {
            collect_fields(child);
        }
    }

    collect_fields(root);

    return {
        fields,
        layout_mode: root.properties.layout_mode || 'auto',
        label_width: root.properties.label_width,
        show_status_badge: root.properties.show_status_badge
    };
}
```

This translation flattens the document model's tree into the `fields` array that `Form_Container` expects. Container controls (panels, tabs) contribute their layout modes but are not themselves fields.

For more complex forms with nested layouts, the designer can generate a control tree directly rather than using `Form_Container` — each container in the document model maps to a `Panel` or `Tabbed_Panel` or `Group_Box`, and each input control maps to its corresponding `jsgui3-html` control. Chapter 11 covers this in detail.

## Preview Mode

When the user clicks "Preview" in the designer toolbar, the canvas switches from the design surface to a rendered form. The existing prototype implemented this by creating `FormField` instances for each field and a `Button` for submit.

The production designer does the same, but uses `Form_Container` for a more complete rendering:

```javascript
_render_preview() {
    const form_spec = document_to_form_spec(this.document_model);

    this.preview_form = new Form_Container({
        context: this.context,
        ...form_spec
    });

    this.preview_form.on('submit', (e) => {
        this.show_preview_data(e.values);
    });

    this.canvas_parent.add(this.preview_form);
}
```

In preview mode:
- Design chrome is hidden (no selection, no resize handles, no grid).
- The form is interactive — the user can type into inputs, check boxes, open dropdowns.
- Validation works — required fields show errors, patterns are checked.
- A "Submit" button triggers validation and shows the collected data.

This lets the user test the form's behaviour before deploying it.

## Server-Side Rendering

Because `Form_Container` is isomorphic, the designed form can be rendered on the server:

```javascript
// server.js
const { Active_HTML_Document } = require('jsgui3-html');
const Form_Container = require('jsgui3-html/controls/organised/1-standard/1-editor/Form_Container');

function render_form(form_definition, context) {
    const form = new Form_Container({
        context,
        ...form_definition
    });

    return form.htmlify();  // Returns HTML string
}
```

The server-rendered HTML includes all the form structure, labels, inputs, and CSS. On the client, `activate()` adds the event listeners for validation, submission, and adaptive layout. The user never sees a blank page or a loading spinner — the form is immediately visible and interactive.

## Custom Input Controls

`Form_Container`'s `create_input_control()` method has a powerful escape hatch: if a field definition includes an `input_control` property, that control is used directly instead of creating a default one:

```javascript
const Color_Picker = require('jsgui3-html/controls/organised/0-core/0-basic/1-compositional/Color_Picker');

{
    name: 'brand_color',
    label: 'Brand Colour',
    input_control: new Color_Picker({ context }),
    required: true
}
```

This means the designer can offer any `jsgui3-html` control as a form field type — not just the basic inputs. `Rating_Stars`, `Toggle_Switch`, `Date_Picker`, `Time_Picker`, `Item_Selector` — all can be used as form fields.

## Summary

`Form_Container` is the runtime rendering engine for designed forms:

- Creates a complete form from a `fields` array specification.
- Renders adaptive layouts that respond to screen size.
- Provides full validation with required, pattern, and custom validators.
- Uses observable `Data_Object` for reactive form values.
- Supports server-side rendering and client-side hydration.
- Accepts any `jsgui3-html` control as a custom input.
- Powers the designer's preview mode.

The document model (Chapter 8) is translated into a `Form_Container` specification for preview and deployment. For complex layouts with nested containers, the designer can also generate a full control tree — which is the subject of Chapter 11.
