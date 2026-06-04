---
description: How SSR markup becomes interactive in the designer
---

# SSR → Activation Data Bridge (Designer Edition)

## Triggers
- `data-jsgui-fields`, `data-jsgui-ctrl-fields` attributes
- SSR hydration failures
- Server→client data not arriving
- Persisted fields not hydrating

## The Lifecycle

```
Server (server.js)
  → jsgui3-server renders Designer_App to HTML
  → HTML includes data-jsgui-id, data-jsgui-type, data-jsgui-fields attributes
  → Client JS bundle is linked

Browser
  → Client boot creates Client_Page_Context
  → pre_activate(context) reconstructs controls from DOM
  → activate(context) calls ctrl.activate() depth-first
  → Designer_App.activate() re-creates models + wires events
```

## Designer-Specific Pattern: Manual DOM Query

The designer uses a pragmatic pattern — rather than relying solely on jsgui3's 
`ctrl_fields` hydration, `activate()` queries the DOM directly:

```javascript
activate() {
    if (this.__activated) return;
    this.__activated = true;
    super.activate();

    // Direct DOM queries (robust fallback)
    this._surface_el = root.querySelector('.design-surface');
    this._canvas_el = root.querySelector('.design-canvas');
    this._inspector_panel_el = root.querySelector('.inspector-panel');
    // ... etc
}
```

This works because the designer's interactive layer (drag, resize, context menus) 
is all DOM manipulation added in `activate()`, not SSR-rendered state.

## Common Warnings (Safe to Ignore)
- `Missing context.map_Controls for type undefined` — Tags without `data-jsgui-type`
- `&&& no corresponding control` — Whitespace text nodes in DOM

## When This Matters
- Adding new controls that need SSR + client activation
- Changing the HTML structure in constructor (affects DOM queries in activate)
- Debugging "renders but doesn't work" issues
