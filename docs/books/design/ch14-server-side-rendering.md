# Chapter 14 — Server-Side Rendering & Hydration

## The Isomorphic Philosophy

jsgui3's defining technical feature is isomorphic rendering: the same JavaScript code runs on both the server (Node.js) and the client (the browser). A `Text_Input` created on the server builds a virtual DOM tree. That tree is serialised to HTML and sent to the browser. On the browser, the same `Text_Input` constructor is used to hydrate the existing HTML — wrapping the DOM elements and attaching event listeners.

This is not an afterthought or an optimisation. It is the foundation of the architecture. The designer benefits from it in three ways:

1. **Fast initial load.** The designer's entire UI — toolbar, palette, canvas, property grid, status bar — is rendered on the server as HTML. The browser shows a fully-formed UI immediately, without waiting for JavaScript to download, parse, and execute.

2. **Pre-rendered forms.** When the user opens a saved form, the server can render the designed form and send the HTML to the client. The client then hydrates the controls, making them interactive.

3. **SEO and accessibility.** Server-rendered forms are accessible to screen readers, search engines, and users with JavaScript disabled.

## The `Active_HTML_Document` Class

The entry point for isomorphic rendering is `Active_HTML_Document`, available in both `jsgui3-html` and `jsgui3-server`. This class represents a complete HTML document — `<html>`, `<head>`, `<body>` — as a control tree.

```javascript
const { Active_HTML_Document } = require('jsgui3-html');
const Control = require('jsgui3-html/html-core/control');

class Designer_App extends Active_HTML_Document {
    constructor(spec = {}) {
        spec.__type_name = spec.__type_name || 'designer_app';
        super(spec);

        const { context } = this;

        // <title>
        const title = new Control({ context, tag_name: 'title' });
        title.add('jsgui3 Designer');
        this.head.add(title);

        // Body class
        this.body.add_class('designer-body');

        // The designer UI
        this.designer_shell = new Designer_Shell({ context });
        this.body.add(this.designer_shell);
    }

    activate() {
        if (!this.__active) {
            super.activate();
            // All child controls are now hydrated and interactive
        }
    }
}
```

On the server, `Designer_App` is instantiated, and `.htmlify()` is called to produce the complete HTML string. This string is sent as the HTTP response.

On the client, the existing HTML is parsed by the browser. `Designer_App` is constructed with the `el` (element) parameter pointing to the existing `<html>` element. Instead of building new DOM, it walks the existing DOM and wraps each element with the corresponding control instance. Then `activate()` is called, which recursively activates all controls, attaching event listeners.

## The Server: `jsgui3-server`

The `jsgui3-server` package provides an HTTP server that handles the rendering pipeline. The key component is `serve-factory.js`, which creates the server with page routes:

```javascript
const server = require('jsgui3-server');

const app = server.create({
    port: 9100,
    pages: {
        '/': {
            page_class: Designer_App,
            client_script: './client.js'
        }
    }
});

app.start();
```

When a request comes in for `/`, the server:

1. Creates a rendering context.
2. Instantiates `Designer_App` with the context.
3. Collects CSS from all controls in the tree (via the static `css` properties).
4. Renders the control tree to an HTML string (`.htmlify()`).
5. Injects the collected CSS into a `<style>` tag in the `<head>`.
6. Injects a `<script>` tag pointing to the bundled client JavaScript.
7. Sends the complete HTML as the response.

## The Client: Hydration

The client script is bundled (typically by Browserify or a similar tool) and loaded by the browser after the HTML is rendered. The client script's job is to hydrate the page:

```javascript
// client.js
const Designer_App = require('./controls/Designer_App');

document.addEventListener('DOMContentLoaded', () => {
    const app = new Designer_App({
        el: document.documentElement,
        context: page_context
    });
    app.activate();
});
```

The `el` parameter tells the constructor to use the existing DOM rather than creating new elements. The `activate()` call walks the tree and attaches event listeners to every control.

### The `if (!spec.el)` Guard

This is why every control's constructor has the pattern:

```javascript
if (!spec.el) {
    this.compose();
}
```

When `el` is provided (during hydration), the control skips `compose()` because the DOM structure already exists. It uses the existing elements instead of creating new ones.

### The `if (!this.__active)` Guard

Similarly, `activate()` uses a guard to ensure it runs only once:

```javascript
activate() {
    if (!this.__active) {
        super.activate();
        // ... attach event listeners ...
    }
}
```

This prevents double-activation if `activate()` is called multiple times.

## CSS Collection

One of the server's key responsibilities is collecting CSS. Each control class has a static `css` property. The server walks the control tree, collects all unique `css` strings, deduplicates them, and injects them into the `<head>`:

```html
<head>
    <title>jsgui3 Designer</title>
    <style>
        /* Text_Input */
        .jsgui-text-input { /* ... */ }
        /* Button */
        .jsgui-button { /* ... */ }
        /* Property_Grid */
        .property-grid { /* ... */ }
        /* ... etc for every control used on the page ... */
    </style>
    <script src="/client.bundle.js" defer></script>
</head>
```

This means the page's CSS is automatically correct — it includes exactly the styles needed for the controls present on the page, nothing more and nothing less.

For the designer, this has an important implication: when the user places a new control type on the canvas at design time (after the initial page load), that control's CSS may not be in the page yet. The canvas needs to dynamically inject CSS for newly-used control types.

## Dynamic CSS Injection

When a new control type is placed on the canvas that was not present during the initial server render, the Design_Canvas injects its CSS:

```javascript
_inject_control_css(ControlClass) {
    if (!ControlClass.css) return;
    if (this._injected_css.has(ControlClass)) return;

    const style = document.createElement('style');
    style.textContent = ControlClass.css;
    style.setAttribute('data-control', ControlClass.name);
    document.head.appendChild(style);

    this._injected_css.add(ControlClass);
}
```

This ensures that every control on the canvas is properly styled, regardless of when it was added.

## The Page Context

The `page-context.js` in `jsgui3-server` provides the rendering context that controls need. It carries:

- **Theme information** — which theme tokens are active.
- **View environment** — layout mode, viewport size.
- **Document reference** — the `Active_HTML_Document` instance.
- **Client resources** — HTTP resource instances for server communication.

The context is passed as a constructor parameter to every control. It is the thread that connects a control to its environment.

## Form Deployment

When the user is satisfied with their form design and wants to deploy it, the jsgui3-server infrastructure makes this straightforward:

### As a Server-Rendered Page

The generated code from Chapter 11 produces a control class that can be registered as a page route:

```javascript
const Contact_Form = require('./generated/Contact_Form');

app.add_page('/contact', {
    page_class: Contact_Form,
    client_script: './generated/contact_client.js'
});
```

The form is server-rendered on first request, hydrated on the client, and fully interactive. No separate rendering engine is needed — the form definition *is* the control tree.

### As an Embedded Control

The generated control can also be embedded in an existing page:

```javascript
const Contact_Form = require('./generated/Contact_Form');

class My_Page extends Active_HTML_Document {
    constructor(spec) {
        super(spec);
        const { context } = this;

        // ... other page content ...

        this.form = new Contact_Form({ context });
        this.body.add(this.form);
    }
}
```

### As a Data-Driven Form

For dynamic forms (where the form definition comes from a database or API), the `Form_Container` can render a form from a JSON specification at runtime:

```javascript
// Load form definition from API
const response = await fetch('/api/forms/contact');
const definition = await response.json();

// Render the form
const form = new Form_Container({
    context,
    fields: definition.fields,
    layout_mode: definition.layout_mode
});

page.body.add(form);
form.activate();
```

## Summary

Server-side rendering and hydration:

- Are built into jsgui3 at every level — controls, themes, CSS, page structure.
- Provide instant page loads with pre-rendered HTML.
- Enable seamless activation of interactive behaviour on the client.
- Handle CSS collection and injection automatically.
- Support dynamic CSS injection for design-time control placement.
- Enable multiple deployment modes: server-rendered pages, embedded controls, and data-driven forms.

The designer does not need to implement an SSR system — it inherits one from the jsgui3 stack.
