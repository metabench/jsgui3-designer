# Chapter 18 — Industry Survey: Form Builder UX Patterns

> *A comparative analysis of how professional form builders approach the design problem — and what the jsgui3 designer can learn from each.*

## 18.1 Why Study the Landscape?

Before building a form designer, we must understand how the best tools in the market approach the problem. Each tool makes trade-offs between power and simplicity, and understanding those trade-offs helps us make informed decisions for the jsgui3 designer.

This chapter surveys the major archetypes of form builder UIs, catalogues their interaction patterns, and extracts actionable design principles.

## 18.2 The Five Archetypes

Through analysis of dozens of form building tools, five distinct UI archetypes emerge. Each serves a different audience and use case:

### Archetype 1: The IDE-Style Designer

**Examples**: Visual Studio WinForms, Power Apps Canvas, Retool, Zoho Creator

**Layout**: Three-panel layout with a control palette on the left, a design canvas in the centre, and a property inspector on the right. Often includes a document outline or control tree alongside the palette.

```
┌──────────┬──────────────────────────┬──────────────┐
│ Palette  │                          │  Properties  │
│          │                          │              │
│ □ Button │      Design Canvas       │  Name: btn1  │
│ □ Input  │                          │  Width: 200  │
│ □ Label  │   ┌─────────────────┐    │  Height: 40  │
│ □ Grid   │   │ [Username    ]  │    │  Text: Submit│
│          │   │ [Password    ]  │    │  Enabled: ✓  │
│ ──────── │   │ [  Submit  ]    │    │              │
│ Tree     │   └─────────────────┘    │  Events      │
│ ├ Form   │                          │  onClick: …  │
│ │ ├ txt1 │                          │              │
│ │ ├ txt2 │                          │              │
│ │ └ btn1 │                          │              │
└──────────┴──────────────────────────┴──────────────┘
```

**Key characteristics**:
- **Absolute or container-based positioning** — controls are placed at specific coordinates or within layout containers.
- **Rich property inspector** — exposes every property of the selected control: layout, style, data binding, events.
- **Drag-and-drop from palette** — the primary mechanism for placing new controls.
- **Direct manipulation** — resize handles, snap-to-grid, alignment guides on the canvas.
- **Control tree** — a hierarchical view of the document model, essential for managing z-order and nesting.

**Strengths**: Maximum power and flexibility. Supports complex, data-heavy forms with nested layouts.

**Weaknesses**: Steep learning curve. Can overwhelm casual users. Requires understanding of layout concepts.

**Relevance to jsgui3**: This is our primary archetype. The jsgui3 designer follows this model most closely, with `Property_Grid`, `Toolbox`, `Tree`, and `Split_Pane` mapping directly to these panels.

### Archetype 2: The Conversational Designer

**Examples**: Typeform, Tally, Conversational Forms

**Layout**: A preview panel showing one question at a time, with a question list on the left and styling controls on the right.

**Key characteristics**:
- **One question per page** — the form is presented as a conversation, not a document.
- **Sequential flow** — questions are ordered linearly with conditional branching.
- **Click-to-add** — new questions are added from a menu, not dragged onto a canvas.
- **Minimal property editing** — only the question text, type, and basic styling are exposed.
- **Strong branding** — themes are applied globally rather than per-control.

**Strengths**: Exceptional completion rates (~86% vs ~46% for traditional forms). Reduced cognitive load for respondents.

**Weaknesses**: Poor for complex data entry. Cannot display multiple fields simultaneously. Not suitable for transactional forms.

**Relevance to jsgui3**: We could support a "conversational mode" as an alternative rendering strategy for `Form_Container`, where the same form definition renders one field at a time with navigation controls.

### Archetype 3: The Wizard / Multi-Step Builder

**Examples**: JotForm, HubSpot Forms, Gravity Forms, WPForms

**Layout**: A form preview in the centre with a floating or docked field palette. Multi-step forms show a step indicator at the top.

**Key characteristics**:
- **Drag-and-drop reordering** — fields are placed in a single column and reordered by dragging.
- **Field insertion points** — drop zones appear between existing fields, showing where a new field will be placed.
- **Grouped sections** — related fields are grouped visually with section headers and dividers.
- **Template-first** — users start from 10,000+ templates rather than a blank canvas.
- **Click-to-configure** — clicking a field reveals a configuration panel, often as a popover or inline accordion.

**Strengths**: Accessible to non-technical users. Fast to get started with templates. Good for surveys, registrations, and lead capture.

**Weaknesses**: Limited layout control. Primarily single-column. Difficult to create complex, multi-column layouts.

**Relevance to jsgui3**: We should support this workflow as a simplified mode — a "form wizard builder" that constrains layout to single-column with sections, ideal for quick form creation.

### Archetype 4: The Grid-Based Canvas

**Examples**: MS Power Apps, Webflow Forms, Retool, Bubble

**Layout**: A free-form canvas with a grid system. Controls snap to grid points and can be arranged in complex layouts.

**Key characteristics**:
- **Grid snapping** — controls align to a configurable grid (8px, 12px, etc.).
- **Container-based layout** — horizontal and vertical containers control flow, similar to CSS Flexbox.
- **Responsive breakpoints** — different layouts at different screen widths (e.g., 600/900/1200px breakpoints).
- **Formula-driven properties** — sizes and positions can be expressions (e.g., `Parent.Width - 40`).
- **Smart guides and spacing indicators** — blue lines show distances between controls during drag.

**Strengths**: Powerful responsive design. Good for complex, data-driven applications. Bridges the gap between design and development.

**Weaknesses**: Requires understanding of layout containers and constraint systems. Steeper learning curve than wizard builders.

**Relevance to jsgui3**: We need responsive container support. The `horizontal` and `vertical` container primitives in jsgui3-html can serve as the foundation, with snap-to-grid and smart guides added to the designer canvas.

### Archetype 5: The Minimal Builder

**Examples**: Google Forms, Microsoft Forms, Canva Forms

**Layout**: A simple document-like interface where fields are added in sequence.

**Key characteristics**:
- **Click-to-add** — a floating "+" button or field type menu.
- **Linear arrangement** — fields are always in a single column.
- **Minimal styling** — basic theme selection, no per-control styling.
- **Instant sharing** — forms can be shared via link immediately.
- **Real-time collaboration** — multiple users can edit simultaneously.

**Strengths**: Fastest time to first form. Zero learning curve. Good enough for ~80% of simple form needs.

**Weaknesses**: Very limited customisation. Rigid layout. Poor branding options.

**Relevance to jsgui3**: We should ensure our full-power designer can export forms that are as clean and simple as these tools produce. Also, a "quick form" mode that hides the complexity could serve this use case.

## 18.3 Comparative Feature Matrix

| Feature | IDE-Style | Conversational | Wizard | Grid-Based | Minimal |
|---------|----------|---------------|--------|-----------|---------|
| **Primary audience** | Developers | Marketers | Business users | Low-code devs | Everyone |
| **Layout model** | Absolute/Container | Sequential | Single-column | Grid + Container | Single-column |
| **Control placement** | Drag to canvas | Click menu | Drag between fields | Drag to grid | Click "+" button |
| **Property editing** | Dedicated panel | Inline popover | Click-to-expand | Dedicated panel | Inline |
| **Responsiveness** | Manual | Automatic | Automatic | Breakpoints | Automatic |
| **Complexity ceiling** | Very high | Low | Medium | High | Very low |
| **Template library** | Small | Medium | Very large | Medium | Small |
| **Code generation** | Yes | No | Embed only | Yes | No |
| **Undo/Redo** | Full | Limited | Full | Full | Limited |
| **Learning curve** | Steep | None | Gentle | Moderate | None |

## 18.4 Canvas-Level Interaction Patterns

Across all archetypes, several canvas interaction patterns recur:

### Drag and Drop

The drag-and-drop workflow varies significantly:

| Phase | Best Practice | Anti-Pattern |
|-------|--------------|-------------|
| **Idle** | Grab handle icon, subtle hover effect | No visual indication of draggability |
| **Pickup** | Elevate with shadow, leave ghost in original position | Item just disappears from palette |
| **Transit** | Collapse large components to summary, cursor = grabbing | Full-size component obscures canvas |
| **Over drop zone** | Highlight zone, show insertion line, magnetic snap | No drop zone feedback |
| **Drop** | Smooth animation to final position | Instant teleport with no transition |
| **Cancel** | Return to original position with animation (Esc key) | No way to cancel mid-drag |

### Click-to-Add (Alternative to Drag)

Many modern tools prefer or offer click-to-add as an alternative:

1. User clicks a "+" button or empty area on the canvas.
2. A context menu or field type picker appears.
3. User selects a control type.
4. The control is inserted at the cursor position or at the end.

**Why this matters**: Click-to-add is more accessible (keyboard-friendly), faster for sequential form building, and works better on touch devices. Our designer should support both drag-and-drop AND click-to-add.

### Smart Guides and Spacing Indicators

Professional design tools (Figma, Sketch, Power Apps) show alignment feedback during drag:

```
         ← 24px →
        ┌─────────┐
        │ Label 1 │
        └─────────┘
              ↕ 8px
  ——— ← 24px →┌─────────┐
  |            │ Input 1 │← aligned to Label 1 left edge
  |            └─────────┘
  |                ↕ 8px
  ↕ 40px   ┌─────────┐
  |        │ Label 2 │
  ——— →    └─────────┘
```

**Key feedback elements**:
- **Alignment guides** (red or blue lines) appear when edges or centres align with other controls.
- **Spacing indicators** (measurements in px) show distances between controls.
- **Equal spacing highlights** appear when items are evenly distributed.
- **Snap-to-grid** dots show the grid the canvas uses.
- **Margin/padding indicators** show the container's internal spacing.

### Selection States

Controls on the canvas need multiple visual states:

| State | Visual Treatment |
|-------|-----------------|
| **Default** | Normal rendering, no adornment |
| **Hover** | Subtle outline or highlight border (dashed, semi-transparent) |
| **Selected** | Solid border with resize handles at corners and edges |
| **Multi-selected** | Individual outlines + bounding box around the group |
| **Focused (keyboard)** | Strong focus ring (accessibility requirement) |
| **Locked** | Lock icon, dimmed resize handles, no drag |
| **Hidden** | Ghost rendering at reduced opacity (visible in designer, hidden at runtime) |

## 18.5 Property Editing Patterns

Three patterns dominate for editing control properties:

### Pattern A: Dedicated Panel (IDE-Style)

A permanent panel on the right side of the screen, showing all properties of the selected control organised into categories (Layout, Appearance, Behaviour, Events).

**Pros**: All properties visible at once. Good for power users. Clear categorisation.
**Cons**: Takes permanent screen space. Can be overwhelming.
**Used by**: Visual Studio, Power Apps, Retool

### Pattern B: Inline Popover (Click-to-Configure)

Clicking a control on the canvas opens a floating popover with the most common properties.

**Pros**: Minimal screen usage. No context switch. Good for quick edits.
**Cons**: Can't show many properties at once. Must dismiss and reopen. May obscure canvas.
**Used by**: Webflow, JotForm, Typeform

### Pattern C: Sidebar Accordion

A sidebar that shows only the selected control's most relevant properties, with expandable sections for advanced settings.

**Pros**: Balanced approach. Shows important properties immediately, detailed settings on demand.
**Cons**: Requires expanding/collapsing. May require scrolling.
**Used by**: Wix, Squarespace, Canva

### Recommendation for jsgui3

Our `Property_Grid` already implements Pattern A, which is the right choice for our primary audience (developers building data-heavy forms). However, we should also consider:

1. **Inline quick-edit** — double-clicking a label on the canvas should allow inline text editing.
2. **Context-sensitive toolbar** — a floating toolbar appears near selected controls with the most common actions (bold, alignment, size).
3. **Categorised property groups** — organise properties into collapsible sections: Layout, Style, Data, Events.

## 18.6 Design Principles Extracted

From this survey, we can extract universal design principles for the jsgui3 designer:

### Principle 1: Progressive Disclosure

Start simple. Show only the most important properties and controls by default. Reveal advanced features on demand.

```
Beginner view:    [Name] [Type] [Required?]
Advanced view:    [Name] [Type] [Required?] [Validation] [Default] [Placeholder]
Expert view:      [Name] [Type] [Required?] [Validation] [Default] [Placeholder]
                  [CSS Class] [Data Source] [Binding Expression] [Events]
```

### Principle 2: Direct Manipulation

Users should be able to change properties by directly manipulating the canvas, not just through a property panel:
- **Resize** by dragging handles
- **Move** by dragging the control body
- **Edit text** by double-clicking labels
- **Change colour** by right-click context menu

### Principle 3: Immediate Feedback

Every user action should produce visible, immediate feedback:
- Dragging shows drop zones and alignment guides
- Property changes are reflected instantly on the canvas
- Invalid configurations show inline warnings
- Saved states show a brief confirmation

### Principle 4: Forgiveness

Make it safe to experiment:
- **Full undo/redo** (our ch12 Command Pattern) is non-negotiable
- **Confirmation dialogs** only for destructive actions (delete control, clear form)
- **Auto-save** with version history reduces save anxiety

### Principle 5: Multiple Workflows for Different Skill Levels

The same tool should support:
1. **Quick build** — template → customise → deploy (for beginners)
2. **Design build** — blank canvas → drag-and-drop → configure (for designers)
3. **Code build** — write form definition in code → preview (for developers)

## 18.7 Key Takeaways for the jsgui3 Designer

| Takeaway | Priority | Implementation |
|----------|----------|---------------|
| Support both drag-and-drop AND click-to-add | High | Add "+" insertion points between controls on the canvas |
| Implement smart guides and spacing indicators | High | Detect alignment during drag, render guide lines |
| Support responsive container layout | High | Horizontal/vertical containers with breakpoints |
| Add inline text editing on the canvas | Medium | Double-click label → edit in place → Enter to confirm |
| Provide a "quick form" simplified mode | Medium | Single-column wizard with section headers |
| Template library for common form types | Medium | Pre-built form definitions: login, signup, feedback, order |
| Context menu with common actions | Medium | Right-click → delete, duplicate, bring to front, lock |
| Multi-step form support | Low | Step container with progress indicator |
| Conversational form rendering mode | Low | Alternative renderer for `Form_Container` |

---

*Next: [Chapter 19 — Interaction Design Deep Dive](ch19-interaction-design-deep-dive.md) explores the detailed mechanics of drag-and-drop, selection, resizing, and keyboard interaction within the designer canvas.*
