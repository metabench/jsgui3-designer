# Chapter 13 — Theming & Visual Styling

## The jsgui3 Theme System

Theming in jsgui3-html is implemented through CSS custom properties (CSS variables) and a token-based design system. This approach gives the designer two capabilities:

1. **The designer itself can be themed** — dark mode, light mode, high-contrast mode.
2. **The form being designed can be themed independently** — the user can preview how their form will look in different themes.

### Theme Tokens

**File:** `jsgui3-html/themes/token_maps.js`

Theme tokens are a flat dictionary of named values. Each token maps to a CSS custom property:

| Token | CSS Variable | Purpose |
|-------|-------------|---------|
| `admin-bg` | `--admin-bg` | Page background |
| `admin-card-bg` | `--admin-card-bg` | Card/panel background |
| `admin-text` | `--admin-text` | Primary text colour |
| `admin-muted` | `--admin-muted` | Secondary/muted text |
| `admin-border` | `--admin-border` | Border lines |
| `admin-accent` | `--admin-accent` | Accent/highlight colour |
| `admin-hover` | `--admin-hover` | Hover state background |
| `admin-header-bg` | `--admin-header-bg` | Header background |
| `admin-font` | `--admin-font` | Font family |
| `j-radius` | `--j-radius` | Border radius |
| `j-touch-target` | `--j-touch-target` | Minimum touch target size |
| `j-error` | `--j-error` | Error colour |
| `j-success` | `--j-success` | Success colour |

### Theme Variants

**File:** `jsgui3-html/themes/variants.js`

Theme variants provide complete token maps for different visual styles. The existing variants include:

- **Default** — clean, light theme with blue accents.
- **Vista** — Windows Vista/7-inspired Aero glass aesthetic.
- **NT Server** — Windows NT-inspired compact, utilitarian design.
- **Obsidian** — dark theme with deep purples and blues.
- **Luxury** — high-contrast dark theme with gold accents.

Each variant defines every token:

```javascript
const obsidian = {
    'admin-bg': '#1a1b2e',
    'admin-card-bg': '#252640',
    'admin-text': '#e2e4f0',
    'admin-muted': '#8b8ea8',
    'admin-border': '#3a3c5c',
    'admin-accent': '#6366f1',
    'admin-hover': '#2e3050',
    // ...
};
```

### The `themeable` Mixin

Controls use the `themeable` mixin to integrate with the theme system. The mixin reads theme tokens from `theme_params.js` and applies them as CSS custom properties on the control's DOM element:

```javascript
const { themeable } = require('jsgui3-html/control_mixins/themeable');

class My_Control extends Control {
    constructor(spec) {
        super(spec);
        themeable(this, 'my_control', spec);
    }
}
```

The `themeable` mixin resolves tokens at construction time (for server-side rendering) and at activation time (for dynamic theme changes).

## Theming the Designer

The designer itself is a jsgui3 application, so it uses the same theme system. All of its UI — the toolbar, palette, property grid, canvas chrome, status bar — uses CSS custom properties.

The designer's theme is separate from the designed form's theme. The user can work in a dark-mode designer while previewing a light-mode form, or vice versa.

### Theme Switcher

A theme selector in the designer's View menu applies a theme variant to the designer shell:

```javascript
function apply_designer_theme(shell_element, theme_name) {
    const tokens = theme_variants[theme_name];
    for (const [key, value] of Object.entries(tokens)) {
        shell_element.style.setProperty(`--${key}`, value);
    }
}
```

## Theming the Designed Form

The user may want to preview their form in different themes — to see how it looks in Obsidian dark mode vs. the default light theme. The designer provides a "Target Theme" selector in the form properties panel.

When the target theme changes, the canvas surface element gets the theme tokens applied:

```javascript
function apply_canvas_theme(canvas_surface, theme_name) {
    const tokens = theme_variants[theme_name];
    for (const [key, value] of Object.entries(tokens)) {
        canvas_surface.dom.el.style.setProperty(`--${key}`, value);
    }
}
```

Because the controls on the canvas use CSS custom properties for all their colours, borders, radii, and fonts, changing the custom properties on their ancestor element instantly changes their appearance. No control rerender is needed.

This means the user can toggle between themes in real time and see every control on the canvas update simultaneously. A `Text_Input` that looks like a clean white field in the default theme becomes a dark-bordered field on a slate background in Obsidian — same control, different tokens.

## CSS-in-JS: The Static `css` Property

Each control class in jsgui3-html defines its CSS through a static `css` property:

```javascript
Text_Input.css = `
.jsgui-text-input {
    border: 1px solid var(--admin-border, #d1d5db);
    border-radius: var(--j-radius, 4px);
    padding: 6px 10px;
    font-family: var(--admin-font, sans-serif);
    color: var(--admin-text, #111827);
    background: var(--admin-card-bg, #ffffff);
}
.jsgui-text-input:focus {
    border-color: var(--admin-accent, #3b82f6);
    outline: none;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15);
}
`;
```

Key observations:

1. **Every colour, size, and font is a CSS variable** with a sensible fallback.
2. **The CSS is associated with the control class**, not a global stylesheet. Only the CSS for controls actually used on a page is included.
3. **The server collects and inlines this CSS** during page rendering.

For the designer, this pattern means:

- When the user places a new control type on the canvas, its CSS is automatically available.
- The CSS variables make theming work universally.
- The CSS for the designer's own controls (Design_Canvas, Design_Surface_Item) follows the same pattern.

## Designer-Specific Styles

Controls on the design canvas need additional styling that is not part of their normal CSS — selection outlines, resize handles, grid overlay, snap guides, insertion indicators. These are defined in a `designer.css` that supplements the controls' own styles:

```css
/* Selection outline */
.design-surface-item.selected {
    outline: 2px solid var(--designer-accent, #3b82f6);
    outline-offset: 1px;
    z-index: 1;
}

/* Resize handles */
.design-surface-item .resize-handle {
    width: 8px;
    height: 8px;
    background: var(--designer-accent, #3b82f6);
    border: 1px solid #fff;
    position: absolute;
    z-index: 10;
    box-shadow: 0 0 2px rgba(0,0,0,0.2);
}

/* Grid overlay */
.design-surface[data-show-grid="true"] {
    background-image:
        linear-gradient(to right,
            var(--designer-grid-color, rgba(0,0,0,0.03)) 1px,
            transparent 1px),
        linear-gradient(to bottom,
            var(--designer-grid-color, rgba(0,0,0,0.03)) 1px,
            transparent 1px);
}

/* Snap guide lines */
.snap-guide {
    position: absolute;
    background: var(--designer-guide-color, #ef4444);
    z-index: 100;
    pointer-events: none;
}
.snap-guide-horizontal {
    height: 1px;
    left: 0;
    right: 0;
}
.snap-guide-vertical {
    width: 1px;
    top: 0;
    bottom: 0;
}

/* Control type badge */
.design-surface-item .control-type-badge {
    position: absolute;
    top: -18px;
    left: 0;
    font-size: 10px;
    padding: 1px 6px;
    background: var(--designer-accent, #3b82f6);
    color: #fff;
    border-radius: 2px 2px 0 0;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.15s;
}
.design-surface-item.selected .control-type-badge,
.design-surface-item:hover .control-type-badge {
    opacity: 1;
}
```

The `designer-accent`, `designer-grid-color`, and `designer-guide-color` tokens are designer-specific — they are not part of the form being designed. This separation ensures that design-time visuals don't leak into the runtime form.

## Custom Control Styling

The Property Grid's Appearance section lets the user customise individual control styling:

- **CSS Class** — add custom CSS classes.
- **Font Size** — override the default font size.
- **Background Colour** — set using the `Color_Value_Editor`.
- **Border Radius** — override the default corner rounding.
- **Width / Height** — explicit dimensions.

These values are stored in the document model's properties and applied as inline styles or CSS classes on the control at runtime.

## Summary

Theming in the designer:

- Uses jsgui3-html's token-based theme system with CSS custom properties.
- Supports multiple theme variants (Default, Vista, NT Server, Obsidian, Luxury).
- Allows the designer and the designed form to have independent themes.
- Provides instant theme switching through CSS variable reassignment.
- Uses the static `css` property pattern for automatic CSS collection across controls.
- Adds designer-specific styles (selection chrome, grid, guides) that are separate from form styles.
