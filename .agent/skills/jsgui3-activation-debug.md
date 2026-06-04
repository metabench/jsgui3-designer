---
description: Debug jsgui3 client-side activation issues specific to the designer app
---

# jsgui3 Activation Debug (Designer Edition)

## Triggers
- Clicks don't work after page load
- `this.dom.el` is null in `activate()`
- `Missing context.map_Controls` warnings in console
- SSR renders but no interactivity

## Context
The jsgui3-designer uses SSR → client hydration. The `Designer_App.activate()` method
re-creates models and wires DOM events. If activation doesn't fire, the entire UI is
dead — no palette clicks, no canvas interaction, no inspector updates.

## Key Files
- `client.js` — `Designer_App.activate()` is the main entry point
- `controls/Design_Canvas.js` — canvas control
- `controls/Inspector_Panel.js` — property inspector
- `server.js` — SSR entry point

## Procedure

1. **Check console for errors** — Look for `Missing context.map_Controls` or JS errors
   during page load. These block activation.

2. **Verify the control is registered** — In `client.js`, ensure all controls are
   registered on `jsgui.controls`:
   ```javascript
   jsgui.controls.Designer_App = Designer_App;
   jsgui.controls.Design_Canvas = Design_Canvas;
   jsgui.controls.Inspector_Panel = Inspector_Panel;
   ```

3. **Check `activate()` guard** — `Designer_App.activate()` uses `if (this.__activated) return;`
   to prevent double activation. If something fails before the flag is set, activation
   may silently fail on retry.

4. **Verify DOM queries** — `activate()` queries the DOM for elements like
   `.design-surface`, `.design-canvas`, `.inspector-panel`. If SSR markup changes
   (class names, structure), these return null and features break silently.

5. **Rebuild after changes** — The server bundles JS. After changing `client.js`,
   you must restart `node server.js` to pick up changes.

## Anti-Patterns
- **Editing CSS for interactivity bugs** — If clicks don't work, it's almost always
  an activation/JS issue, not z-index or pointer-events.
- **Skipping server restart** — Changes to `client.js` require restarting `server.js`.

## Validation
```bash
# Quick smoke test
node -e "require('./client'); console.log('OK')"

# Full test: start server, load page, check console
node server.js
# Then open http://localhost:52030 and check browser console
```
