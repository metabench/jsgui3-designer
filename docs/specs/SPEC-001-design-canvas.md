---
id: SPEC-001
title: Design Canvas
status: draft
priority: critical
depends-on: []
book-refs: [ch05, ch18, ch19]
estimated-complexity: L
---

# SPEC-001: Design Canvas

## 1. Overview

The Design Canvas is the central panel of the form builder where users visually compose forms by placing, moving, and editing controls. It is the WYSIWYG surface — what the user sees on the canvas is what the form will look like at runtime.

The canvas must support both free-form (absolute) and flow-based (container) layout modes, respond to zoom/pan operations, render a configurable grid, and provide visual feedback during all interactions (drag, resize, selection, alignment).

## 2. Scope

### In Scope
- Rendering placed controls at their specified positions and sizes
- Grid overlay with configurable spacing (default 8px)
- Zoom (25%–400%) and pan (scroll / middle-click drag)
- Hosting the selection layer (selection outlines, resize handles)
- Hosting alignment guides during drag/resize operations
- Design-time vs. preview-mode toggle
- Canvas background customisation (colour, pattern)
- Coordinate display (mouse position in canvas coordinates)
- Click-on-empty to deselect all controls

### Out of Scope
- Drag-and-drop mechanics (SPEC-005)
- Selection model details (SPEC-006)
- Resize handle behaviour (SPEC-007)
- Smart alignment guides (SPEC-008)
- Undo/redo integration (SPEC-010)

## 3. Dependencies

| Dependency | Type | Status |
|-----------|------|--------|
| jsgui3-html `Control` class | framework | done |
| jsgui3-html CSS system | framework | done |
| `Data_Object` for observable state | framework | done |

## 4. Anatomy

```
┌─ Canvas Container (div.design-canvas-container) ──────────────────────┐
│ ┌─ Canvas Viewport (div.design-canvas-viewport) ─────────────────────┐│
│ │ ┌─ Canvas Surface (div.design-canvas-surface) ────────────────────┐││
│ │ │                                                                  │││
│ │ │   ┌─ Grid Layer (svg.canvas-grid) ──────────────────────────┐   │││
│ │ │   │  · · · · · · · · · · · · · · · · · · · · · · · · · ·   │   │││
│ │ │   │  · · · · · · · · · · · · · · · · · · · · · · · · · ·   │   │││
│ │ │   └─────────────────────────────────────────────────────────┘   │││
│ │ │                                                                  │││
│ │ │   ┌─ Controls Layer (div.canvas-controls) ──────────────────┐   │││
│ │ │   │  [Placed controls rendered here]                         │   │││
│ │ │   └─────────────────────────────────────────────────────────┘   │││
│ │ │                                                                  │││
│ │ │   ┌─ Overlay Layer (svg.canvas-overlay) ────────────────────┐   │││
│ │ │   │  [Selection outlines, resize handles, guides]            │   │││
│ │ │   └─────────────────────────────────────────────────────────┘   │││
│ │ │                                                                  │││
│ │ └──────────────────────────────────────────────────────────────────┘││
│ └────────────────────────────────────────────────────────────────────┘│
│ ┌─ Coordinate Bar ──────────────────────────────────────────────────┐ │
│ │ X: 124  Y: 56  │ Zoom: 100%  │ Grid: 8px                        │ │
│ └────────────────────────────────────────────────────────────────────┘│
└───────────────────────────────────────────────────────────────────────┘
```

**Layers** (bottom to top):
1. **Grid Layer** — SVG pattern of dots or lines at grid intervals.
2. **Controls Layer** — DOM elements for each placed control.
3. **Overlay Layer** — SVG for selection outlines, resize handles, alignment guides, rubber-band selection rectangle.

## 5. API

### Constructor / Configuration

```javascript
const canvas = new Design_Canvas({
    // Required
    document_model: documentModel,   // Document_Model — the form's data model

    // Optional
    grid_size: 8,                    // number — grid spacing in px (default: 8)
    grid_visible: true,              // boolean — show grid dots (default: true)
    grid_snap: true,                 // boolean — snap to grid during placement/move (default: true)
    zoom: 1.0,                       // number — initial zoom level 0.25–4.0 (default: 1.0)
    background_color: '#ffffff',     // string — canvas background colour
    mode: 'design',                  // 'design' | 'preview' — initial mode
    width: 800,                      // number — canvas logical width in px
    height: 600,                     // number — canvas logical height in px
});
```

### Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `grid_size` | `number` | `8` | Grid spacing in pixels |
| `grid_visible` | `boolean` | `true` | Whether grid dots are rendered |
| `grid_snap` | `boolean` | `true` | Whether controls snap to grid during drag/resize |
| `zoom` | `number` | `1.0` | Current zoom level (0.25 to 4.0) |
| `mode` | `string` | `'design'` | `'design'` or `'preview'` |
| `mouse_x` | `number` | `0` | Current mouse X in canvas coordinates (read-only) |
| `mouse_y` | `number` | `0` | Current mouse Y in canvas coordinates (read-only) |

### Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `zoom_in()` | `() → void` | Increase zoom by 25% (max 400%) |
| `zoom_out()` | `() → void` | Decrease zoom by 25% (min 25%) |
| `zoom_to_fit()` | `() → void` | Adjust zoom so all controls are visible |
| `zoom_to(level)` | `(level: number) → void` | Set zoom to specific level |
| `set_mode(mode)` | `(mode: 'design' \| 'preview') → void` | Switch between design and preview |
| `screen_to_canvas(x, y)` | `(x: number, y: number) → {x, y}` | Convert screen coordinates to canvas coordinates |
| `canvas_to_screen(x, y)` | `(x: number, y: number) → {x, y}` | Convert canvas coordinates to screen coordinates |
| `snap_to_grid(x, y)` | `(x: number, y: number) → {x, y}` | Return nearest grid-snapped coordinates |

### Events

| Event | Payload | When Fired |
|-------|---------|------------|
| `canvas_click` | `{ x, y, target, originalEvent }` | Click on empty canvas area |
| `canvas_dblclick` | `{ x, y, target, originalEvent }` | Double-click on canvas |
| `control_click` | `{ control, x, y, originalEvent }` | Click on a placed control |
| `control_dblclick` | `{ control, x, y, originalEvent }` | Double-click on a placed control |
| `zoom_change` | `{ zoom, previousZoom }` | Zoom level changes |
| `mode_change` | `{ mode, previousMode }` | Mode switches between design/preview |
| `mouse_move` | `{ x, y }` | Mouse moves over canvas (canvas coords) |

## 6. Behaviour

### 6.1 Grid Rendering

The grid is rendered as an SVG pattern of dots at `grid_size` intervals. The pattern tiles seamlessly regardless of zoom level or scroll position.

- Grid dots are 1px circles, colour `#e0e0e0` on light backgrounds, `#333333` on dark backgrounds.
- Grid respects zoom — dots remain 1px on screen but their spacing scales with zoom.
- Grid can be toggled with `Ctrl+'` keyboard shortcut.

### 6.2 Zoom Behaviour

- **Zoom centre**: Zoom towards the mouse cursor position (not the canvas centre).
- **Zoom levels**: 25%, 50%, 75%, 100%, 125%, 150%, 200%, 300%, 400%.
- **Ctrl+Scroll**: Zoom in/out.
- **Ctrl+=**: Zoom in. **Ctrl+-**: Zoom out. **Ctrl+0**: Zoom to fit.
- **Smooth zoom**: Animate between zoom levels (150ms ease-out).
- **Coordinate bar**: Shows current zoom percentage.

### 6.3 Pan Behaviour

- **Scroll**: Standard page scroll to pan.
- **Middle-click drag**: Pan the viewport.
- **Space+drag**: Pan the viewport (hold Space, then drag).

### 6.4 Mode Switching

- **Design mode**: Controls are rendered with design-time adornments (outlines, handles, labels). Interactions (drag, resize, select) are enabled.
- **Preview mode**: Controls render as they would at runtime. No outlines, no handles. Form validation and interaction work as they would for end users. The property panel and palette are dimmed or hidden.

### 6.5 Coordinate System

- Canvas coordinates are independent of zoom. A control at `(100, 100)` is always at `(100, 100)` in canvas space regardless of zoom level.
- Screen coordinates are used for mouse events and must be converted to canvas coordinates for all logic.
- The coordinate bar shows mouse position in canvas coordinates.

### 6.6 Canvas Resizing

- The canvas has a logical size (`width`, `height`) representing the form's design area.
- The viewport can be smaller or larger than the canvas (scrolls if smaller).
- The canvas can be resized by dragging its edge handles (bottom and right edges).

## 7. Acceptance Criteria

- **AC-1**: Given the canvas is initialised with default settings, when it renders, then a grid of dots at 8px intervals is visible and the zoom is 100%.

- **AC-2**: Given grid_visible is true, when the user presses Ctrl+', then the grid dots disappear and grid_visible becomes false.

- **AC-3**: Given the zoom is 100%, when the user scrolls Ctrl+Scroll Up over the canvas, then the zoom increases to 125% and the zoom animates smoothly towards the mouse cursor position.

- **AC-4**: Given the zoom is 25%, when the user presses Ctrl+- (zoom out), then the zoom remains at 25% (minimum).

- **AC-5**: Given the canvas has controls placed, when the user presses Ctrl+0, then the zoom adjusts so all controls fit within the viewport with 20px padding.

- **AC-6**: Given the canvas is in design mode, when the user clicks on an empty area, then any selected controls are deselected and a `canvas_click` event fires with canvas coordinates.

- **AC-7**: Given the canvas is in design mode, when the user clicks on a placed control, then a `control_click` event fires with the control reference and canvas coordinates.

- **AC-8**: Given the canvas is in design mode, when the user switches to preview mode, then all design adornments (grid, outlines, handles) are hidden and controls render as runtime.

- **AC-9**: Given `grid_snap` is true and `grid_size` is 8, when `snap_to_grid(13, 21)` is called, then it returns `{x: 16, y: 24}` (nearest grid points).

- **AC-10**: Given the canvas is at 200% zoom, when the user clicks at screen position (400, 300), then `screen_to_canvas()` converts this correctly to canvas coordinates accounting for zoom and scroll offset.

### Edge Cases

- **EC-1**: When the browser window is resized, the canvas viewport resizes but the canvas logical size remains unchanged.
- **EC-2**: When zoomed out to 25%, grid dots are not rendered if they would be less than 3px apart on screen (too dense to be useful).
- **EC-3**: When a control is placed at coordinates outside the canvas logical area, the canvas auto-expands to accommodate it.

## 8. Accessibility

| Requirement | WCAG | Implementation |
|-------------|------|---------------|
| Canvas role announced | 4.1.2 | `role="application"` with `aria-label="Form design canvas"` |
| Zoom level announced | 4.1.3 | `aria-live="polite"` region updates when zoom changes |
| Grid toggle announced | 4.1.3 | Screen reader announces "Grid hidden" / "Grid visible" |
| Mode switch announced | 4.1.3 | Screen reader announces "Design mode" / "Preview mode" |
| Keyboard zoom | 2.1.1 | Ctrl+= / Ctrl+- / Ctrl+0 work without mouse |
| Focus management | 2.4.3 | Tab moves focus to controls in DOM order |

## 9. Visual States

| State | Description | Visual Treatment |
|-------|-------------|-----------------|
| Default | Canvas with grid | White background, grey grid dots |
| Zoomed | Non-100% zoom | Grid scales, coordinate bar shows % |
| Panning | Space+drag active | Cursor changes to `grab` / `grabbing` |
| Preview | Preview mode | No grid, no outlines, runtime rendering |
| Empty | No controls placed | Centre-aligned hint text: "Drag controls here" |

## 10. Test Plan

### Unit Tests
- [ ] `snap_to_grid()` returns correct coordinates for various inputs and grid sizes
- [ ] `screen_to_canvas()` correctly accounts for zoom and scroll offset
- [ ] `canvas_to_screen()` is the inverse of `screen_to_canvas()`
- [ ] `zoom_in()` caps at 400% and `zoom_out()` floors at 25%
- [ ] `zoom_to_fit()` calculates correct zoom for given control positions
- [ ] Mode switching changes the `mode` property and fires `mode_change`

### Integration Tests
- [ ] Ctrl+Scroll zooms canvas toward cursor position
- [ ] Grid visibility toggles with Ctrl+'
- [ ] Clicking empty canvas fires `canvas_click` with correct coordinates
- [ ] Clicking a control fires `control_click` with control reference
- [ ] Canvas renders with grid dots at configured spacing

### Visual / Manual Tests
- [ ] Grid dots are visually uniform and aligned at all zoom levels
- [ ] Zoom animation is smooth (no jumps or flicker)
- [ ] Coordinate bar updates smoothly during mouse movement
- [ ] Preview mode hides all design adornments

## 11. Implementation Notes

- The canvas should extend `jsgui3-html Control` and compose the three layers (grid, controls, overlay) as child elements.
- Use CSS `transform: scale()` for zoom rather than re-rendering at different sizes — this gives smooth zoom and good performance.
- The grid should use an SVG `<pattern>` element for efficient tiling.
- Coordinate conversion must account for: canvas offset in the page, scroll position of the viewport, and current zoom level.
- Consider using `ResizeObserver` for viewport resize detection.
- The overlay layer (selection, guides) should be SVG for precise positioning and styling.

## 12. Open Questions

- [ ] Should the canvas support infinite scrolling (auto-expand as controls are placed), or fixed size with resize handles?
- [ ] Should we support multiple canvases (e.g., one per form page in a multi-page form)?
- [ ] What is the maximum recommended number of controls on a single canvas before performance degrades?
