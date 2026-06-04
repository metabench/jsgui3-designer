---
description: Standard pattern for right-click context menus in the designer
---

# Context Menu Patterns (Designer Edition)

## Triggers
- context menu, right-click, popup menu, positioning, dismissal

## The Pattern (As Implemented)

The designer uses two context menus:
1. **Control context menu** — Right-click a surface item → Copy, Delete
2. **Canvas context menu** — Right-click empty canvas → Expand to fill, Paste

### Implementation in `client.js`

```javascript
// 1. Global mousedown listener closes menus reliably
document.addEventListener('mousedown', (e) => {
    const existing = document.querySelector('.ctx-menu');
    if (existing && !existing.contains(e.target)) {
        that._close_context_menu();
    }
}, true);  // capture phase = fires first

// 2. contextmenu event on canvas creates the menu
this._canvas_el.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    that._close_context_menu();
    // Create menu at e.pageX, e.pageY
    // Detect if right-click was on a control or empty canvas
    // Store surface-relative position for paste-at-position
});
```

### Key Design Decisions

1. **Append to `document.body`** — Avoids z-index/clipping issues from parent containers
2. **Use `capture: true`** for dismissal — Fires before any other click handlers
3. **Store surface-relative coords** — For paste, compute position relative to the 
   design surface, not the page: `e.clientX - surfRect.left`
4. **No `setTimeout` for dismissal** — Use mousedown capture instead of deferred click
   listeners to avoid stuck menus

### CSS Classes
- `.ctx-menu` — The floating menu container (`position:fixed; z-index:99999`)
- `.ctx-option` — Individual menu items with hover highlight

## Anti-Patterns
- **Using `setTimeout(() => document.addEventListener('click', ...))`** — Can leave 
  menus stuck if the click fires during the timeout delay
- **Not preventing default** — Native browser context menu will overlay yours
- **Positioning with `absolute`** — Use `fixed` to avoid scroll offset issues
