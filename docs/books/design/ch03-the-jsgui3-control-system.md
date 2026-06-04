# Chapter 3 — The jsgui3 Control System

## The Control Class

At the heart of jsgui3-html sits a single class: `Control`. Every button, text field, panel, toolbar, tree node, data grid, and window in the library inherits from `Control`. Understanding this class is essential to understanding the designer, because the designer manipulates `Control` instances — both the controls that make up the designer's own UI and the controls that the user places on the design canvas.

A `Control` is, at its simplest, a wrapper around a DOM element — or, more precisely, a wrapper around the *idea* of a DOM element, since on the server there is no DOM. The control maintains a virtual DOM representation (`this.dom`) that includes the tag name, attributes, CSS classes, inline styles, and child elements. On the server, this virtual DOM is serialised to HTML. On the client, it is linked to a real DOM element.

### Creating a Control

```javascript
const jsgui = require('jsgui3-html/html-core/html-core');
const { Control } = jsgui;

// A simple div
const div = new Control({ context, tag_name: 'div' });
div.add_class('my-panel');
div.dom.attributes.role = 'region';
div.add('Hello, World');
```

The `context` parameter is always required. It carries the rendering context — information about the document, the theme, the server or client environment. In a server application, the context comes from the `Active_HTML_Document`. On the client, it is obtained during hydration.

The `tag_name` defaults to `'div'` if not specified. Most custom controls leave it as `'div'` and add CSS classes to style themselves.

### The `__type_name` Convention

Every control class sets a `__type_name` in its constructor:

```javascript
class My_Button extends Control {
    constructor(spec = {}) {
        spec.__type_name = spec.__type_name || 'my_button';
        super(spec);
        // ...
    }
}
```

This type name is written to the DOM as a data attribute (`data-jsgui-type`), enabling the hydration system to find the correct constructor when activating server-rendered HTML on the client. For the designer, it also serves as the key into the control registry — mapping type names to palette icons, property schemas, and default specifications.

### Adding Children

Controls form a tree. Children are added with `this.add()`:

```javascript
const panel = new Control({ context, tag_name: 'div' });
panel.add_class('panel');

const title = new Control({ context, tag_name: 'h2' });
title.add('Settings');
panel.add(title);

const description = new Control({ context, tag_name: 'p' });
description.add('Configure your preferences below.');
panel.add(description);
```

You can add strings (which become text nodes), other controls, or arrays. The `add` method is variadic and chainable.

The `content` property on a control gives access to its children collection. You can call `this.content.clear()` to remove all children, or iterate over them.

### CSS Classes and Attributes

Controls manage their DOM attributes through the `this.dom.attributes` object and CSS classes through `add_class()` / `remove_class()`:

```javascript
const input = new Control({ context, tag_name: 'input' });
input.add_class('form-input');
input.add_class('form-input-large');
input.dom.attributes.type = 'text';
input.dom.attributes.placeholder = 'Enter your name';
input.dom.attributes['aria-label'] = 'Full name';
```

On the server, these attributes and classes are serialised into the HTML output. On the client, they are applied to the real DOM element during hydration. After hydration, you can also access `this.dom.el` to get the actual DOM element for direct manipulation, although the control system encourages working through its API rather than touching the DOM directly.

## The Control Hierarchy

The jsgui3-html control library is organised into a tiered hierarchy:

```
controls/organised/
├── 0-core/
│   ├── 0-basic/
│   │   ├── 0-native-compositional/    ← 18 native input controls
│   │   └── 1-compositional/           ← 44+ higher-level controls
│   └── 1-advanced/                    ← Advanced composite controls
├── 1-standard/
│   ├── 0-viewer/                      ← Display controls (Property_Viewer, Markdown_Viewer, etc.)
│   ├── 1-editor/                      ← Editing controls (Form_Container, Property_Grid, etc.)
│   ├── 2-misc/                        ← Miscellaneous
│   ├── 3-page/                        ← Page-level controls
│   ├── 4-data/                        ← Data display controls (Data_Table, Virtual_Grid, etc.)
│   ├── 5-ui/                          ← UI chrome (Toolbar, Toolbox, Tree, etc.)
│   └── 6-layout/                      ← Layout containers (Panel, Window, Split_Pane, etc.)
└── 2-showcase/                        ← Demo / showcase controls
```

This hierarchy matters for the designer because it defines the categories in the control palette. When the user opens the Toolbox and sees groups like "Common Controls," "Input Controls," "Layout Containers," and "Data Controls," those groups map directly to these directories.

### Native Compositional Controls (Tier 0-0-0)

These are the lowest-level interactive controls. They wrap a single native HTML element — `<input>`, `<select>`, `<textarea>`, `<button>` — with a standard jsgui3 interface:

| Control | HTML Element | Key Features |
|---------|-------------|--------------|
| `Text_Input` | `<input type="text">` | Placeholder, mask, validation, reactive value |
| `Checkbox` | `<input type="checkbox">` | Checked state, label, indeterminate |
| `Radio_Button` | `<input type="radio">` | Group management, label |
| `Select_Options` | `<select>` | Option management, selected value |
| `Date_Picker` | Custom | Calendar popup, date range support |
| `Button` | `<button>` | Click handling, icon, variant styling |
| `Textarea` | `<textarea>` | Autosize, mask support |
| `Number_Input` | `<input type="number">` | Min/max, step, validation |
| `Range_Input` | `<input type="range">` | Slider with value display |
| `File_Upload` | `<input type="file">` | Drag-drop zone, progress |
| `Email_Input` | `<input type="email">` | Email validation |
| `Password_Input` | `<input type="password">` | Show/hide toggle |
| `Tel_Input` | `<input type="tel">` | Phone formatting |
| `Url_Input` | `<input type="url">` | URL validation |
| `Icon` | `<span>` | Icon display (font icon or SVG) |
| `Meter` | `<meter>` | Value gauge |
| `Progress_Bar` | `<progress>` | Determinate/indeterminate |

These controls are the primary building blocks for data-entry forms. In the designer, they are the most commonly placed controls.

### Compositional Controls (Tier 0-0-1)

These are built from multiple elements and often incorporate mixins for advanced behaviour:

| Control | Description |
|---------|-------------|
| `Combo_Box` | Text input + dropdown list |
| `Color_Picker` | HSL wheel, gradient area, channel sliders, hex input |
| `Toggle_Switch` | iOS-style on/off toggle |
| `Toggle_Button` | Pressed/unpressed toggle |
| `Rating_Stars` | 1–5 star rating |
| `Number_Stepper` | +/- buttons with number display |
| `Time_Picker` | Hour/minute/second/AM-PM selectors |
| `Datetime_Picker` | Combined date and time |
| `Item_Selector` | Multi-select list with transfer buttons |
| `Combo_Box` | Searchable dropdown |
| `Context_Menu` | Right-click popup menu |
| `Dropdown_Menu` | Click-to-open menu |
| `List` | Scrollable list with selection |
| `Grid` | Flexible grid container |

Each of these is a self-contained component with its own CSS, its own event system, and its own API. In the designer, they appear in the palette and can be placed and configured like any other control.

## The Event System

Controls communicate through an event system. The `on()` method registers listeners, and `raise()` dispatches events:

```javascript
const button = new Button({ context, label: 'Save' });

button.on('click', (e) => {
    console.log('Button was clicked');
});

// Somewhere else:
button.raise('click', { source: 'keyboard' });
```

This event system is distinct from DOM events. It operates at the control level and is available on both server and client. DOM event listeners are attached during `activate()` and call through to the control event system:

```javascript
activate() {
    if (!this.__active) {
        super.activate();
        this.add_dom_event_listener('click', (e) => {
            this.raise('click', e);
        });
    }
}
```

For the designer, the event system is used extensively:

- The canvas raises `'selection-change'` events.
- The property grid raises `'property-change'` events.
- The document model raises `'node-added'`, `'node-removed'`, `'node-moved'`, `'property-changed'` events.
- The command history raises `'undo'` and `'redo'` events.

## The Static CSS Pattern

Every control class can define a static `css` property — a string of CSS rules scoped to the control's class name:

```javascript
class My_Panel extends Control {
    constructor(spec = {}) {
        spec.__type_name = spec.__type_name || 'my_panel';
        super(spec);
        this.add_class('my-panel');
    }
}

My_Panel.css = `
.my-panel {
    border: 1px solid var(--admin-border, #e2e8f0);
    border-radius: 8px;
    padding: 16px;
    background: var(--admin-card-bg, #fff);
}
.my-panel:hover {
    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}
`;
```

The server's rendering system collects all `css` properties from controls used on the page and injects them into a `<style>` tag. This means that only the CSS for controls actually present on the page is included — a form of automatic tree-shaking for styles.

For the designer, this pattern has an important implication: when the user places a new control type on the canvas, that control's CSS needs to be injected into the page. The design canvas must manage CSS injection for dynamically created controls.

## The `compose()` Pattern

Most controls build their internal structure in a `compose()` method called from the constructor:

```javascript
class Search_Bar extends Control {
    constructor(spec = {}) {
        spec.__type_name = spec.__type_name || 'search_bar';
        super(spec);
        this.add_class('search-bar');
        if (!spec.el) {
            this.compose();
        }
    }

    compose() {
        const { context } = this;

        this.icon = new Icon({ context, name: 'search' });
        this.add(this.icon);

        this.input = new Text_Input({ context, placeholder: 'Search...' });
        this.add(this.input);

        this.clear_btn = new Button({ context, label: '✕' });
        this.clear_btn.add_class('search-clear');
        this.add(this.clear_btn);
    }
}
```

The `if (!spec.el)` guard is important: when a control is being hydrated from existing DOM (the `el` property is the existing DOM element), the internal structure already exists in the HTML and does not need to be recreated. `compose()` only runs when the control is being created fresh.

For the designer, the `compose()` method is what determines a control's internal structure. A `Panel` with a `Title_Bar` and an inner content area composes those sub-controls in its `compose()`. When the designer serialises a form, it does not need to serialise the internal structure of each control — only the specification object that was passed to the constructor. The `compose()` method reproduces the internal structure deterministically from that specification.

## The `activate()` Lifecycle

The `activate()` method is where a control sets up its client-side behaviour — event listeners, DOM observations, timers, animations:

```javascript
activate() {
    if (!this.__active) {
        super.activate();

        // Attach DOM event listeners
        this.add_dom_event_listener('click', (e) => {
            this._handle_click(e);
        });

        // Start observations
        this._resize_observer = new ResizeObserver((entries) => {
            this._on_resize(entries);
        });
        this._resize_observer.observe(this.dom.el);
    }
}
```

The `if (!this.__active)` guard ensures activation only happens once. Calling `super.activate()` will recursively activate child controls.

For the designer, `activate()` is the boundary between "inert HTML" and "live control." The designer needs to activate controls on the canvas so they look and behave authentically — a `Toggle_Switch` should actually toggle when clicked, a `Combo_Box` should actually open its dropdown. However, the designer also needs to intercept these interactions to prevent them from executing their action semantics (you don't want a "Delete" button on the canvas to actually delete anything) while still allowing the visual response.

This is a nuanced challenge that Chapter 9 addresses in detail.

## The Data_Object Foundation

The `Data_Object` class from `lang-tools` is the backbone of reactive data in jsgui3. It provides observable properties with automatic change notification:

```javascript
const { Data_Object } = require('lang-tools');

const model = new Data_Object({ context });
model.set('title', 'My Form');
model.set('field_count', 0);

model.on('change', (e) => {
    console.log(`${e.name} changed from ${e.old} to ${e.value}`);
});

model.set('title', 'Contact Form');
// Output: "title changed from My Form to Contact Form"
```

The `Form_Container` control uses `Data_Object` for form values, validation state, and error messages. The existing WYSIWYG prototype also uses `Data_Object` for its model (field list, selection index, mode).

In the designer, the document model builds on `Data_Object` to provide an observable, serialisable representation of the entire form tree. When the user changes a property in the Property_Grid, that change propagates through the `Data_Object` to the canvas control, which updates its appearance in real time.

## Summary

The jsgui3 control system provides:

- A **universal `Control` base class** that works identically on server and client.
- A **virtual DOM** that enables server-side rendering and client-side hydration.
- A **hierarchical composition model** (`add()`, `compose()`) for building complex UIs from simple parts.
- An **event system** for control-to-control communication.
- A **static CSS pattern** for encapsulated, auto-collected component styles.
- An **`activate()` lifecycle** for binding client-side behaviour.
- **Observable `Data_Object` models** for reactive data binding.

The designer is built atop all of these. It does not fight the control system — it embraces it, using the same patterns to build the tool that the tool uses to build applications.
