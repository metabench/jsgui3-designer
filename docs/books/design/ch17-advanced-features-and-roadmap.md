# Chapter 17 — Advanced Features & Roadmap

## Where We Stand

The preceding sixteen chapters have described a complete WYSIWYG form builder:

- A spatial **design canvas** with grid, snap guides, and zoom.
- A **control palette** driven by the Toolbox and the control registry.
- A **property inspector** built on Property_Grid and the value editor registry.
- A **hierarchical document model** with observable mutations.
- Full **drag, drop, select, and resize** via the mixin system.
- Runtime **form rendering** through Form_Container.
- **Serialisation** to `.form.json` and **code generation** to runnable jsgui3 JavaScript.
- **Undo/redo** via the Command Pattern.
- **Theming** through CSS custom properties and existing theme variants.
- **Server-side rendering** and **hydration** through the isomorphic architecture.
- **Data binding** with Data_Object, HTTP resources, and SSE.
- **Custom control extensibility** through the plugin registry.

This chapter explores advanced features — capabilities that build on this foundation to make the designer a professional-grade tool.

## Copy, Cut, Paste

### Clipboard Model

The designer maintains a clipboard — a serialised snapshot of one or more controls:

```javascript
class Clipboard {
    constructor() {
        this._data = null;
    }

    copy(document_model, node_ids) {
        this._data = node_ids.map(id => {
            const node = document_model.get_node(id);
            return document_model._serialize_node(node);
        });
    }

    cut(document_model, node_ids, command_history) {
        this.copy(document_model, node_ids);
        const cmd = new CompoundCommand('Cut', node_ids.map(id =>
            new DeleteControlCommand(document_model, { node_id: id })
        ));
        command_history.execute(cmd);
    }

    paste(document_model, parent_id, command_history) {
        if (!this._data) return;

        const cmds = this._data.map(serialised => {
            const new_node = this._deep_clone_with_new_ids(serialised);
            // Offset position slightly so the paste is visible
            new_node.properties.x = (new_node.properties.x || 0) + 20;
            new_node.properties.y = (new_node.properties.y || 0) + 20;

            return new AddControlCommand(document_model, {
                node_id: new_node.id,
                control_type: new_node.control_type,
                parent_id,
                properties: new_node.properties
            });
        });

        command_history.execute(new CompoundCommand('Paste', cmds));
    }
}
```

### System Clipboard Integration

For copy/paste between designer instances (or between the designer and a text editor), the serialised JSON can be written to the system clipboard:

```javascript
async copy_to_system(document_model, node_ids) {
    this.copy(document_model, node_ids);
    const json = JSON.stringify(this._data, null, 2);
    await navigator.clipboard.writeText(json);
}

async paste_from_system(document_model, parent_id, command_history) {
    const text = await navigator.clipboard.readText();
    try {
        this._data = JSON.parse(text);
        this.paste(document_model, parent_id, command_history);
    } catch (e) {
        // Not valid JSON — ignore
    }
}
```

## Alignment and Distribution Tools

When multiple controls are selected, the Layout tab in the Inspector Panel offers alignment and distribution tools:

### Alignment

| Tool | Effect |
|------|--------|
| Align Left | Set all selected controls' X to the minimum X |
| Align Right | Set all selected controls' right edge to the maximum right edge |
| Align Top | Set all selected controls' Y to the minimum Y |
| Align Bottom | Set all selected controls' bottom edge to the maximum bottom edge |
| Centre Horizontal | Centre all controls between the leftmost and rightmost |
| Centre Vertical | Centre all controls between the topmost and bottommost |

### Distribution

| Tool | Effect |
|------|--------|
| Distribute Horizontally | Space controls evenly between the leftmost and rightmost |
| Distribute Vertically | Space controls evenly between the topmost and bottommost |
| Make Same Width | Set all controls to the average width |
| Make Same Height | Set all controls to the average height |
| Make Same Size | Set all controls to the average width and height |

Each alignment or distribution operation is a compound command — one `MoveControlCommand` or `ResizeControlCommand` per control, wrapped in a `CompoundCommand` for single-step undo.

## Tab Order Editor

Form usability depends heavily on tab order — the sequence in which controls receive focus when the user presses Tab. The designer provides a tab order editor:

1. Click "Edit Tab Order" in the toolbar.
2. The canvas shows each control with a numbered badge.
3. Click controls sequentially to set the order — the first click assigns tab index 1, the second assigns 2, and so on.
4. Click "Done" to save.

Tab order is stored in each control's `tab_index` property in the document model. At runtime, the `tabindex` HTML attribute is set accordingly.

## Multi-Page Forms

Many business forms span multiple pages — a wizard-style flow. The designer supports this through:

- A **page list** in the toolbar or a tab bar at the top of the canvas.
- Each page is a separate subtree in the document model.
- Navigation buttons (Next, Previous, Submit) are configured with target page properties.
- The preview mode lets the user step through pages.

```javascript
{
    id: 'root',
    control_type: 'multi_page_form',
    properties: { name: 'frmRegistration', title: 'User Registration' },
    children: [
        {
            id: 'page_1',
            control_type: 'form_page',
            properties: { title: 'Personal Information', page_number: 1 },
            children: [ /* ... fields ... */ ]
        },
        {
            id: 'page_2',
            control_type: 'form_page',
            properties: { title: 'Contact Details', page_number: 2 },
            children: [ /* ... fields ... */ ]
        },
        {
            id: 'page_3',
            control_type: 'form_page',
            properties: { title: 'Review & Submit', page_number: 3 },
            children: [ /* ... fields ... */ ]
        }
    ]
}
```

## Conditional Visibility

Controls can be configured to show or hide based on the values of other controls:

```javascript
{
    name: 'txtOtherReason',
    label: 'Please specify',
    type: 'text',
    visibility_rule: {
        depends_on: 'ddlReason',
        condition: 'equals',
        value: 'other'
    }
}
```

At runtime, the form engine evaluates visibility rules whenever a depended-upon field changes:

```javascript
function evaluate_visibility(field, form_values) {
    if (!field.visibility_rule) return true;
    const rule = field.visibility_rule;
    const dep_value = form_values[rule.depends_on];

    switch (rule.condition) {
        case 'equals': return dep_value === rule.value;
        case 'not_equals': return dep_value !== rule.value;
        case 'contains': return String(dep_value).includes(rule.value);
        case 'not_empty': return !!dep_value;
        case 'empty': return !dep_value;
        default: return true;
    }
}
```

At design time, the Property Grid shows a Visibility section where the user configures the rule via dropdowns.

## Responsive Layout Designer

Beyond the first approach of absolute positioning, the designer supports a responsive grid layout mode:

- The canvas shows a 12-column grid overlay.
- Controls span a configurable number of columns.
- At different breakpoints, controls can span different column counts.
- The preview mode lets the user resize the viewport to test responsiveness.

```javascript
{
    name: 'txtEmail',
    label: 'Email',
    responsive: {
        lg: { columns: 6 },    // Half width on large screens
        md: { columns: 8 },    // Two-thirds on medium screens
        sm: { columns: 12 }    // Full width on small screens
    }
}
```

This generates CSS that uses media queries and CSS grid column spans.

## Form Validation Rules Designer

While basic validation (required, pattern, min/max) is configurable through the property grid, complex validation rules need a dedicated editor:

- **Cross-field validation** — "Confirm password must match password."
- **Conditional validation** — "If country is US, state is required."
- **Custom messages** — localised error messages for each rule.
- **Validation timing** — on blur, on change, on submit, or debounced.

The Validation Rules Designer is a modal dialog where the user:

1. Selects a field.
2. Adds validation rules from a list of templates.
3. Configures each rule's parameters and error message.
4. Optionally writes a custom validator expression.

## Accessibility Inspector

The designer includes an accessibility checker that analyses the form and reports issues:

| Check | Description |
|-------|-------------|
| Missing labels | Input controls without associated labels |
| Low contrast | Text/background colour combinations that fail WCAG AA |
| Missing alt text | Images without alternative text |
| Tab order gaps | Non-sequential or missing tab indices |
| ARIA compliance | Missing `role`, `aria-label`, `aria-describedby` |

The checker produces a report panel at the bottom of the designer, with each issue linked to the offending control. Clicking an issue selects the control on the canvas.

The `a11y` mixin from `jsgui3-html/control_mixins/a11y.js` provides the runtime accessibility attributes. The designer's checker ensures these are configured correctly at design time.

## Collaborative Editing

For teams working on the same form, the designer can support collaborative editing:

- **File locking** — when one user opens a form, others see it as read-only. Simple but effective for small teams.
- **Real-time collaboration** — using the `SSE_Resource` from `jsgui3-client` for server-sent events, changes from one user's session are broadcast to others. Each edit is a command object that can be serialised and replayed on other clients.

## The Document Outline Panel

The `Tree` control from `jsgui3-html` powers the Document Outline — a hierarchical view of the form's control tree:

```
▼ frmContact (Form Container)
  ├── txtFirstName (Text Input)
  ├── txtLastName (Text Input)
  ├── ddlCountry (Combo Box)
  ├── ▼ pnlAddress (Panel)
  │   ├── txtStreet (Text Input)
  │   ├── txtCity (Text Input)
  │   └── txtPostcode (Text Input)
  └── btnSubmit (Button)
```

Features:

- **Click to select** — clicking a node in the tree selects the control on the canvas.
- **Drag to reorder** — dragging nodes in the tree reorders siblings or reparents controls.
- **Right-click context menu** — cut, copy, paste, delete, wrap in panel.
- **Synchronized selection** — selecting on the canvas highlights the tree node, and vice versa.

The `Tree` control already supports all of these features. The designer wires it to the document model and selection model.

## Performance Considerations

### Virtual Rendering for Large Forms

Forms with hundreds of controls can become slow if every control is a live DOM element. The `Virtual_List` and `Virtual_Grid` controls from `jsgui3-html` solve this by rendering only the controls visible in the viewport:

```javascript
const Virtual_List = require(
    'jsgui3-html/controls/organised/1-standard/4-data/Virtual_List'
);

// For the document outline with many nodes
this.outline = new Virtual_List({
    context,
    item_height: 28,
    items: this._flatten_tree(document_model.root),
    render_item: (item) => this._create_tree_node(item)
});
```

### Deferred Activation

For the canvas, controls outside the visible viewport can be rendered as simple `<div>` placeholders and activated only when scrolled into view:

```javascript
const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
        if (entry.isIntersecting) {
            const item = this._items.get(entry.target);
            if (item && !item.activated) {
                item.inner_control.activate();
                item.activated = true;
            }
        }
    }
});
```

## Roadmap

### Phase 1 — Core Designer (this book)
*Status: Architecture defined, prototype exists, implementation ready.*
- [x] Design canvas with absolute positioning
- [x] Palette → canvas placement
- [x] Property Grid integration
- [x] Document model with observable mutations
- [x] Undo/redo
- [x] Save/load .form.json
- [x] Preview mode
- [x] Theme support

### Phase 2 — Enhanced Editing
- [ ] Flow (responsive) layout mode
- [ ] Alignment and distribution tools
- [ ] Tab order editor
- [ ] Copy/cut/paste with system clipboard
- [ ] Rulers and snap guides
- [ ] Zoom and pan
- [ ] Keyboard shortcuts

### Phase 3 — Data & Logic
- [ ] Data binding designer
- [ ] Conditional visibility rules
- [ ] Cross-field validation rule builder
- [ ] API data source configuration
- [ ] Form submission action builder
- [ ] Multi-page form wizard

### Phase 4 — Advanced Features
- [ ] Code generation (jsgui3 server page, standalone control)
- [ ] Custom control plugin system
- [ ] Accessibility checker
- [ ] Document outline with Tree
- [ ] Responsive breakpoint preview
- [ ] Form templates library

### Phase 5 — Collaboration & Polish
- [ ] File locking for team editing
- [ ] Real-time collaborative editing via SSE
- [ ] Performance optimisation (virtual rendering, deferred activation)
- [ ] Comprehensive keyboard shortcut system
- [ ] Full documentation and tutorials

## Conclusion

The jsgui3-designer project transforms the jsgui3 ecosystem from a programmatic UI framework into a visual development environment. The vast library of controls, the mixin system, the isomorphic rendering architecture, the theme engine, and the property editing infrastructure — all of these exist and work today. They were not designed for a form builder specifically, but they were designed with the principles that make a form builder possible: composability, observability, and isomorphism.

What this project adds is the orchestration: the design canvas, the document model, the command history, the palette-to-canvas flow, and the code generator. These are significant components, but they build on a deep foundation. The mixins save months of interaction programming. The Property_Grid saves weeks of inspector development. The Form_Container and the theme system save weeks of runtime rendering work.

The result is a tool that lets users build forms visually, preview them instantly, save them as data, and deploy them as running code — all within the same ecosystem that powers the rest of their application.

This is not a separate tool bolted onto a framework. It is the framework, looking at itself in a mirror.
