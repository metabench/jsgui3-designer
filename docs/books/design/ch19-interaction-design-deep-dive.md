# Chapter 19 — Interaction Design Deep Dive

> *The mechanics of drag-and-drop, selection, resizing, keyboard interaction, and inline editing that make a form designer feel responsive and professional.*

## 19.1 The Interaction Layer

Chapter 9 covered the foundational mechanics of drag, drop, select, and resize from a framework perspective. This chapter goes deeper, examining the **user experience** of these interactions — the micro-interactions, feedback loops, and accessibility patterns that distinguish a polished designer from a prototype.

This chapter draws from research into how professional tools (Figma, Power Apps, VS Code, Webflow, JotForm) implement their interaction layers. The goal is to provide actionable specifications that can drive implementation in the jsgui3 designer.

## 19.2 Drag and Drop: The Complete Lifecycle

Drag-and-drop is the primary mechanism for placing controls, but the experience varies dramatically based on the quality of feedback at each stage.

### 19.2.1 The Six States of a Drag Operation

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│   IDLE   │────▶│  HOVER   │────▶│  PICKUP  │
│          │     │          │     │          │
│ No cursor│     │ Grab     │     │ Elevate  │
│ change   │     │ cursor   │     │ + ghost  │
└──────────┘     └──────────┘     └────┬─────┘
                                       │
                    ┌──────────────────┬┘
                    ▼                  ▼
              ┌──────────┐     ┌──────────┐
              │  TRANSIT  │────▶│OVER DROP │
              │          │     │  ZONE    │
              │ Follow   │     │          │
              │ cursor   │     │ Highlight│
              │ + shadow │     │ + snap   │
              └──────────┘     └────┬─────┘
                                    │
                    ┌───────────────┬┘
                    ▼              ▼
              ┌──────────┐  ┌──────────┐
              │  DROP    │  │  CANCEL  │
              │          │  │          │
              │ Animate  │  │ Return   │
              │ to pos   │  │ to orig  │
              └──────────┘  └──────────┘
```

### 19.2.2 Detailed Specifications

#### IDLE State
- **Draggable items in the palette**: Show a subtle grip handle (six dots pattern `⠿`).
- **Draggable controls on the canvas**: No visual change until hover.
- **Touch targets**: Minimum 44×44px for touch (WCAG 2.5.5).

#### HOVER State
- **Cursor**: Changes to `grab` (open hand).
- **Visual**: Subtle border highlight on the item. Optional: slight scale-up (1.02×) with transition.
- **Timing**: Hover effect should appear within 50ms for snappiness.

#### PICKUP State (pointerdown + move threshold)
- **Threshold**: Don't start dragging until the cursor has moved at least 4px from the initial click point. This prevents accidental drags when the user intended to click.
- **Ghost image**: Create a semi-transparent copy (opacity 0.6) at the original location.
- **Dragged element**: Elevate with `box-shadow` and slight scale-up (1.05×).
- **Cursor**: Changes to `grabbing` (closed hand).
- **Palette item**: If dragging from the palette, create a drag preview that represents the control type (icon + label).

#### TRANSIT State
- **Follow cursor**: The dragged element follows the cursor with zero lag. Use CSS `translate` for 60fps performance.
- **Large items**: For controls larger than 200×200px, collapse to a compact preview during drag displaying the control type icon and name.
- **Scroll zones**: When dragging near the canvas edge (within 40px), auto-scroll the canvas in that direction.

#### OVER DROP ZONE State
- **Drop zone identification**: Valid drop targets highlight. For an IDE-style canvas:
  - **Container backgrounds** get a coloured overlay (e.g., blue at 0.1 opacity).
  - **Insertion lines** appear between existing controls showing where the new control will be placed.
  - **Snapping**: If grid is enabled, the preview snaps to the nearest grid point.
- **Smart guides**: When the dragged element would align with an existing control's edge or centre, display a guide line:
  ```
  Guide line: 1px solid rgba(255, 0, 102, 0.8)
  Extends: Edge-to-edge of the canvas or container
  ```
- **Spacing indicators**: Display the distance in pixels between the dragged element and adjacent controls.
- **Invalid zones**: Grey overlay with a `not-allowed` cursor.

#### DROP State
- **Animation**: Animate the control from the cursor position to its final position (200ms ease-out).
- **Selection**: The dropped control becomes immediately selected, with resize handles visible.
- **Undo**: Register the drop as a single undoable command.
- **Audio**: Optional subtle "place" sound effect for tactile feedback.

#### CANCEL State (Esc key or drop outside canvas)
- **Animation**: Animate the dragged element back to its original position (300ms ease-out).
- **Ghost removal**: Remove the ghost image with a fade-out.
- **No state change**: The document model is not modified.

### 19.2.3 Drop Zone Strategies

Different slot types require different drop zone behaviours:

| Container Type | Drop Zone Behaviour |
|---------------|---------------------|
| **Absolute canvas** | Place at cursor position, snap to grid |
| **Vertical flow** | Insertion line between existing children |
| **Horizontal flow** | Insertion line between existing children (left/right) |
| **Grid layout** | Highlight the target grid cell |
| **Tabbed container** | Drop on tab header to add to that tab's content |

### 19.2.4 Keyboard Alternative to Drag

For accessibility (WCAG 2.1 Level AA), provide a keyboard-based workflow:

1. **Select** the source control (Tab to it, Enter to "pick up").
2. **Navigate** with Arrow keys. The control's intended position moves with visual feedback.
3. **Drop** with Enter (confirm) or Escape (cancel).
4. **Reorder** within a container: Select a control, then use Alt+Arrow to move it up/down/left/right within its parent.

Additionally, provide a non-drag method:
1. Focus the palette.
2. Arrow to the desired control type.
3. Press Enter → a dialog or insertion point appears asking where to place it.

## 19.3 Selection Model

### 19.3.1 Selection Modes

| Mode | Behaviour | Trigger |
|------|-----------|---------|
| **Single select** | Clicking a control selects it, deselecting all others | Click on a control |
| **Toggle select** | Clicking a control toggles its selection without affecting others | Ctrl+Click |
| **Range select** | Rubber-band selection of all controls within a drawn rectangle | Click+drag on empty canvas area |
| **Select all** | All controls in the active container become selected | Ctrl+A |
| **Deselect all** | No controls selected | Click on empty canvas area |

### 19.3.2 Multi-Select Operations

When multiple controls are selected, the following operations become available:

| Operation | Trigger | Behaviour |
|-----------|---------|-----------|
| **Move** | Drag any selected control | All selected controls move as a group |
| **Delete** | Delete key | All selected controls are removed |
| **Align left** | Toolbar / context menu | All controls align to the leftmost control's left edge |
| **Align top** | Toolbar / context menu | All controls align to the topmost control's top edge |
| **Distribute horizontally** | Toolbar / context menu | Equal horizontal spacing between controls |
| **Distribute vertically** | Toolbar / context menu | Equal vertical spacing between controls |
| **Group** | Ctrl+G | Wrap selected controls in a group container |
| **Ungroup** | Ctrl+Shift+G | Unwrap controls from their group |

### 19.3.3 Visual Treatment

```css
/* Selection indicators */
.control--selected {
    outline: 2px solid var(--selection-color, #0d99ff);
    outline-offset: 2px;
}

.control--hover {
    outline: 1px dashed var(--hover-color, #0d99ff80);
    outline-offset: 2px;
}

/* Resize handles */
.resize-handle {
    width: 8px;
    height: 8px;
    background: white;
    border: 2px solid var(--selection-color, #0d99ff);
    border-radius: 50%;
    position: absolute;
}

/* Bounding box for multi-select */
.multi-select-bounding-box {
    border: 1px dashed var(--selection-color, #0d99ff);
    background: rgba(13, 153, 255, 0.05);
}
```

## 19.4 Resize Interaction

### 19.4.1 Resize Handle Positions

For an absolute-positioned control, eight resize handles are placed:

```
    NW ──── N ──── NE
    │                │
    W     Control    E
    │                │
    SW ──── S ──── SE
```

Each handle constrains resize in specific directions:

| Handle | Cursor | Free Resize | Shift+Resize (Aspect) | Alt+Resize (Centre) |
|--------|--------|-------------|----------------------|---------------------|
| **NW** | `nwse-resize` | Move top-left | Proportional from SE | Resize equally from centre |
| **N** | `ns-resize` | Move top edge | N/A | Resize top and bottom equally |
| **NE** | `nesw-resize` | Move top-right | Proportional from SW | Resize equally from centre |
| **E** | `ew-resize` | Move right edge | N/A | Resize left and right equally |
| **SE** | `nwse-resize` | Move bottom-right | Proportional from NW | Resize equally from centre |
| **S** | `ns-resize` | Move bottom edge | N/A | Resize top and bottom equally |
| **SW** | `nesw-resize` | Move bottom-left | Proportional from NE | Resize equally from centre |
| **W** | `ew-resize` | Move left edge | N/A | Resize left and right equally |

### 19.4.2 Resize Constraints

Controls should respect minimum and maximum size constraints:

```javascript
// Example resize constraint configuration
const resizeConstraints = {
    minWidth: 20,
    minHeight: 20,
    maxWidth: Infinity,
    maxHeight: Infinity,
    maintainAspectRatio: false,  // true for images
    snapToGrid: true,
    gridSize: 8
};
```

### 19.4.3 Size Feedback During Resize

While resizing, show the current dimensions near the control:

```
┌───────────────────┐
│                   │ ← 240 × 36
│    [ Input    ]   │
│                   │
└───────────────────┘
```

The dimension label should:
- Appear near the bottom-right resize handle.
- Update in real-time as the user drags.
- Show both pixel and grid-column values (if grid is active).
- Disappear on mouseup after a 500ms delay.

## 19.5 Inline Editing

### 19.5.1 When to Use Inline Editing

Not all properties should be edited inline. The principle is: **editable inline = frequently changed + simple value + visible on canvas**.

| Property | Inline Edit? | Method |
|----------|-------------|--------|
| **Label text** | ✅ Yes | Double-click → contentEditable |
| **Placeholder text** | ✅ Yes | Double-click → contentEditable |
| **Button text** | ✅ Yes | Double-click → contentEditable |
| **Width/Height** | ✅ Yes (via handles) | Drag resize handles |
| **Position** | ✅ Yes (via drag) | Drag control body |
| **Font size** | ❌ No | Property panel (too many values) |
| **Data binding** | ❌ No | Property panel (complex expression) |
| **Event handlers** | ❌ No | Property panel (code editor) |
| **Validation rules** | ❌ No | Property panel (multi-field) |

### 19.5.2 Inline Text Editing Flow

```
1. User double-clicks a label control on the canvas.
2. The label text becomes a contentEditable region.
3. The text is selected (all or cursor placement).
4. A floating mini-toolbar appears above with basic formatting:
   [B] [I] [U] | [Font ▼] [Size ▼] | [Color ▼]
5. User types new text.
6. Press Enter or click outside to commit (registers undo command).
7. Press Escape to cancel and revert.
```

### 19.5.3 Keyboard Shortcuts

A complete form designer needs a comprehensive keyboard shortcut system:

| Category | Shortcut | Action |
|----------|----------|--------|
| **Selection** | Click | Select control |
| | Ctrl+Click | Toggle control in selection |
| | Ctrl+A | Select all controls in active container |
| | Escape | Deselect all / cancel current operation |
| | Tab | Select next control in tab order |
| | Shift+Tab | Select previous control in tab order |
| **Movement** | Arrow keys | Move selected control(s) by 1px (or 1 grid unit) |
| | Shift+Arrow | Move selected control(s) by 10px (or 1 grid cell) |
| **Sizing** | Alt+Arrow Right/Down | Increase width/height by 1px |
| | Alt+Arrow Left/Up | Decrease width/height by 1px |
| **Editing** | Delete / Backspace | Delete selected control(s) |
| | Ctrl+D | Duplicate selected control(s) |
| | Ctrl+C / Ctrl+V | Copy / Paste |
| | Ctrl+X | Cut |
| | Ctrl+Z | Undo |
| | Ctrl+Y / Ctrl+Shift+Z | Redo |
| **Grouping** | Ctrl+G | Group selected controls |
| | Ctrl+Shift+G | Ungroup |
| **Layout** | F2 | Enter inline edit mode on selected control |
| | Enter | Confirm inline edit / activate selected control |
| **Zoom** | Ctrl+= | Zoom in |
| | Ctrl+- | Zoom out |
| | Ctrl+0 | Zoom to fit |
| **View** | Ctrl+' | Toggle grid visibility |
| | Ctrl+; | Toggle smart guides |

## 19.6 Context Menus

Right-clicking on the canvas or a control should show a context-sensitive menu:

### On a Control
```
Cut                    Ctrl+X
Copy                   Ctrl+C
Paste                  Ctrl+V
─────────────────────────────
Duplicate              Ctrl+D
Delete                 Delete
─────────────────────────────
Bring to Front         Ctrl+Shift+]
Send to Back           Ctrl+Shift+[
Bring Forward          Ctrl+]
Send Backward          Ctrl+[
─────────────────────────────
Lock                   Ctrl+L
Group                  Ctrl+G
─────────────────────────────
Edit Properties...     F4
```

### On Empty Canvas Area
```
Paste                  Ctrl+V
─────────────────────────────
Select All             Ctrl+A
─────────────────────────────
Add Control            ▶ [submenu with control types]
─────────────────────────────
Grid Settings...
Canvas Properties...
```

## 19.7 The Interaction of Selection, Dragging, and Property Updates

This is where interaction design becomes subtle. The three systems (selection, drag, property panel) must work in concert:

```
┌─────────────────────────────────────────────────────────┐
│                    Interaction Flow                      │
│                                                         │
│  Click control → Select → Property panel updates        │
│       │                         │                       │
│       ├── Drag control ─────── Property panel shows     │
│       │      (X, Y update         new X, Y live)        │
│       │                                                 │
│       ├── Resize control ──── Property panel shows      │
│       │      (W, H update         new W, H live)        │
│       │                                                 │
│       ├── Edit in Property ── Canvas updates live        │
│       │      Panel (type              (re-renders)       │
│       │       a new width)                              │
│       │                                                 │
│       └── Double-click ────── Inline edit mode           │
│              (enter text           (no property panel    │
│               editing)              interaction)         │
└─────────────────────────────────────────────────────────┘
```

**Critical requirement**: Changes in the property panel must immediately reflect on the canvas, and vice versa. This bidirectional binding is what makes the experience feel WYSIWYG.

In the jsgui3 architecture, this is achieved through the observable property system: when a control's `.width` is set (whether by the property grid or by a resize handle), the control's DOM automatically re-renders.

## 19.8 Performance Considerations

Interaction responsiveness is critical for perceived quality. These benchmarks should be targeted:

| Interaction | Target Latency | Justification |
|-------------|---------------|---------------|
| Hover effect | <50ms | Must feel instant |
| Drag follow cursor | 16ms (60fps) | No perceptible lag |
| Drop animation | 200ms ease-out | Smooth but not slow |
| Property change → canvas update | <100ms | Must feel live |
| Canvas zoom | 16ms (60fps) | Smooth scrolling |
| Undo/Redo | <50ms | Must feel instant |
| Selection change → property panel update | <100ms | Must feel live |
| Context menu open | <50ms | Must feel responsive |

For large forms (50+ controls), consider:
- **Virtualised rendering**: Only render controls visible in the viewport.
- **Debounced property updates**: Batch rapid changes (e.g., during drag) into single DOM updates.
- **RequestAnimationFrame**: Use rAF for all visual updates during drag/resize.

---

*Next: [Chapter 20 — Responsive and Accessible Form Design](ch20-responsive-and-accessible-form-design.md) covers breakpoint systems, container queries, WCAG compliance, and how to ensure forms built with the designer work for all users.*
