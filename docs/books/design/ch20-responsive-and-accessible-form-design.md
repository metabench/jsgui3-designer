# Chapter 20 — Responsive and Accessible Form Design

> *How to ensure forms built with the jsgui3 designer work beautifully across screen sizes and are usable by everyone, including users with disabilities.*

## 20.1 Why This Chapter Matters

A form builder that produces pixel-perfect forms on a desktop monitor but breaks on a phone is only half a tool. Similarly, a form that looks beautiful but cannot be navigated by keyboard or read by a screen reader excludes a significant portion of users.

This chapter covers two intertwined concerns:
1. **Responsive design** — how forms adapt to different screen sizes and devices.
2. **Accessibility** — how forms comply with WCAG 2.1 Level AA and serve all users.

These are not afterthoughts. They must be designed into the core of the form builder.

## 20.2 Responsive Form Layout

### 20.2.1 The Breakpoint System

The designer needs a breakpoint system that lets form authors define different layouts at different screen widths. Following industry practice (Power Apps, CSS frameworks), we define four default breakpoints:

| Size Name | Min Width | Typical Device | Column Grid |
|-----------|-----------|----------------|-------------|
| **Small** | 0px | Phone (portrait) | 1 column |
| **Medium** | 600px | Phone (landscape) / small tablet | 2 columns |
| **Large** | 900px | Tablet / small laptop | 3 columns |
| **Extra Large** | 1200px | Desktop monitor | 4+ columns |

These should be configurable by the form author.

### 20.2.2 Layout Strategies

Three layout strategies, in order of recommendation:

#### Strategy 1: Flow Layout with Container Controls (Recommended)

Controls are placed inside horizontal and vertical flow containers. The layout engine determines wrapping and sizing based on available space.

```
Desktop (>1200px):                   Mobile (<600px):
┌──────────────────────────────┐     ┌───────────────┐
│ [First Name] [Last Name   ] │     │ [First Name ] │
│ [Email                    ] │     │ [Last Name  ] │
│ [Phone     ] [Company     ] │     │ [Email      ] │
│ [  Submit  ]                │     │ [Phone      ] │
└──────────────────────────────┘     │ [Company    ] │
                                     │ [  Submit   ] │
                                     └───────────────┘
```

**Implementation in jsgui3**: Use horizontal containers with `flex-wrap: wrap`. Child controls have a `min-width` that triggers wrapping.

```javascript
const row = new Horizontal_Container({
    style: { 'flex-wrap': 'wrap', 'gap': '16px' }
});
row.add(new Text_Input({ 
    name: 'first_name',
    style: { 'flex': '1 1 200px' }  // Grows, shrinks, wraps at 200px
}));
row.add(new Text_Input({ 
    name: 'last_name',
    style: { 'flex': '1 1 200px' }
}));
```

#### Strategy 2: Grid Layout

Controls are placed on a responsive grid. Column count changes at breakpoints.

```javascript
const formGrid = new Grid_Container({
    columns: {
        small: 1,
        medium: 2,
        large: 3,
        xlarge: 4
    },
    gap: '16px'
});
```

#### Strategy 3: Absolute Layout with Responsive Rules (Legacy)

Controls have fixed positions, but the designer stores alternative positions per breakpoint. This is the Power Apps approach — powerful but labour-intensive.

```javascript
const submitButton = new Button({
    text: 'Submit',
    responsive: {
        xlarge: { x: 400, y: 300, width: 200 },
        large:  { x: 300, y: 250, width: 160 },
        medium: { x: 0, y: 200, width: '100%' },
        small:  { x: 0, y: 180, width: '100%' }
    }
});
```

### 20.2.3 Responsive Preview in the Designer

The designer canvas should offer responsive preview capability:

```
┌────────────────────────────────────────────────────┐
│  📱 375px  │  📱 768px  │  💻 1024px  │ 🖥 1440px │  ← Breakpoint switcher
├────────────────────────────────────────────────────┤
│                                                    │
│         ┌──── 375px ────┐                          │
│         │  [Name     ]  │                          │
│         │  [Email    ]  │                          │
│         │  [Message  ]  │                          │
│         │  [ Submit  ]  │                          │
│         └───────────────┘                          │
│                                                    │
│  Currently viewing: Small (375px)                  │
└────────────────────────────────────────────────────┘
```

The designer should provide:
- **Breakpoint bar** at the top to switch between preview sizes instantly.
- **Drag-to-resize** — a draggable edge on the canvas frame to see the form at any width.
- **Per-breakpoint property overrides** — e.g., "at small size, hide this field" or "at small size, this label appears above the field instead of beside it".
- **Active breakpoint indicator** — clearly shows which breakpoint is currently being edited.

### 20.2.4 Common Responsive Patterns for Forms

| Pattern | Description | When to Use |
|---------|-------------|-------------|
| **Stack on narrow** | Multi-column rows collapse to single column | Default for all field rows |
| **Hide on mobile** | Non-essential fields hidden at small breakpoints | Optional fields, decorative elements |
| **Full-width inputs** | Input fields expand to 100% width on mobile | Always on mobile |
| **Label position switch** | Labels move from beside to above fields | Below 600px |
| **Submit button full-width** | Submit button stretches to full container width | Below 600px |
| **Section tabbing** | Multi-section form becomes a tabbed or step-based form | Complex forms on mobile |

## 20.3 Accessibility in the Form Builder

Accessibility operates at two levels:
1. **The designer itself** must be accessible (so form authors with disabilities can use it).
2. **The forms it produces** must be accessible (so end users with disabilities can fill them in).

### 20.3.1 The WCAG 2.1 Level AA Checklist for Produced Forms

Every form output by the designer must meet these requirements:

#### Perceivable

| Requirement | WCAG | Implementation |
|-------------|------|---------------|
| Text has 4.5:1 contrast ratio | 1.4.3 | Enforce minimum contrast in theme system |
| Non-text UI has 3:1 contrast ratio | 1.4.11 | Borders, focus rings, icons meet ratio |
| Don't use colour alone to convey meaning | 1.4.1 | Error states use icon + text + colour |
| Text can be resized to 200% without loss | 1.4.4 | Use relative units (rem, em) not px for text |
| Content reflows at 320px without horizontal scroll | 1.4.10 | Flow layout strategy handles this |

#### Operable

| Requirement | WCAG | Implementation |
|-------------|------|---------------|
| All fields keyboard-accessible | 2.1.1 | Use native HTML form controls |
| No keyboard traps | 2.1.2 | Modals have escape-to-close |
| Tab order matches visual order | 2.4.3 | Serialisation uses DOM order = visual order |
| Focus is visible | 2.4.7 | Don't remove `:focus-visible` outlines |
| Touch targets are ≥44×44px | 2.5.5 | Enforce minimum size on interactive controls |

#### Understandable

| Requirement | WCAG | Implementation |
|-------------|------|---------------|
| Every field has a label | 1.3.1 | `<label for="...">` on every input |
| Required fields are identified | 3.3.2 | `required` attribute + visual indicator |
| Error messages are specific | 3.3.1 | "Email address is invalid" not "Error" |
| Error messages are associated | 3.3.1 | `aria-describedby` links error to field |
| Instructions are provided | 3.3.2 | Placeholder or help text explains format |

#### Robust

| Requirement | WCAG | Implementation |
|-------------|------|---------------|
| Valid HTML markup | 4.1.1 | Jsgui3 renderer produces valid HTML |
| Name, Role, Value for controls | 4.1.2 | Use semantic HTML; ARIA where needed |
| Status messages are announced | 4.1.3 | `aria-live` regions for validation feedback |

### 20.3.2 How the Designer Enforces Accessibility

The designer should actively prevent inaccessible form creation:

#### Automatic Enforcement

These rules are applied automatically during form generation:

1. **Auto-generate labels**: Every input control that doesn't have an explicit label gets one generated from its `name` property (e.g., `first_name` → "First Name").
2. **Auto-associate labels**: The renderer always outputs `<label for="control-id">` associations.
3. **Focus order from DOM order**: The serialiser outputs controls in visual reading order (top-to-bottom, left-to-right), ensuring tab order matches.
4. **Proper grouping**: Radio button and checkbox groups are automatically wrapped in `<fieldset>` with a `<legend>`.
5. **Error region**: Validation errors use `aria-describedby` to associate with their field and `role="alert"` for screen reader announcement.

#### Design-Time Warnings

The designer shows warnings (not blocking errors) when accessibility issues are detected:

```
⚠️ Accessibility Warnings (2)
├── ⚠ Input "field_3" has no label text
│   Suggestion: Add a label or set the 'aria-label' property
└── ⚠ Contrast ratio on "submit_btn" is 3.2:1 (minimum: 4.5:1)
    Suggestion: Use a darker text colour or lighter background
```

The warning panel should:
- Update live as the form is edited.
- Each warning is clickable to select the offending control.
- Provide a "Fix" button where automatic fixes are possible.

#### Accessibility Audit

A dedicated "Run Accessibility Check" command that performs a comprehensive audit:

1. Label association completeness
2. Colour contrast analysis
3. Tab order analysis (visual vs. DOM)
4. Touch target size check
5. Required field identification
6. Error message quality

Results shown in a listbox with severity levels (Error, Warning, Info).

### 20.3.3 Making the Designer Itself Accessible

The form designer tool must also be accessible:

| Feature | Requirement | Implementation |
|---------|-------------|---------------|
| **Palette** | Keyboard-navigable | Arrow keys to browse, Enter to select |
| **Canvas** | Keyboard-operable | Tab between controls, Arrow to move, see ch19 shortcuts |
| **Property Grid** | Screen-reader compatible | Proper ARIA roles on grid cells |
| **Control Tree** | Keyboard-navigable | Arrow keys up/down, Enter to select |
| **Drag-and-drop** | Keyboard alternative | Alt+Arrow to reorder, Enter to place |
| **Context menus** | Keyboard-accessible | Shift+F10 or dedicated Menu key |
| **Colour picker** | Text input option | Allow typing hex/rgb values, not just visual picker |
| **Zoom** | Respects OS zoom settings | Use relative sizing for designer chrome |

## 20.4 Form Validation UX

### 20.4.1 Validation Timing

Three validation strategies, each appropriate for different fields:

| Strategy | Timing | Best For |
|----------|--------|----------|
| **On blur** | Validate when user leaves a field | Most fields — gives user time to complete typing |
| **On input** | Validate as user types (debounced 300ms) | Format-sensitive fields: phone, email, dates |
| **On submit** | Validate all fields when form is submitted | Final safety net — always apply this |

The designer should let form authors configure validation timing per field.

### 20.4.2 Error Display Patterns

```
Good:                               Bad:
┌─────────────────────┐             ┌─────────────────────┐
│ Email Address        │             │ Email Address        │
│ ┌─ ─ ─ ─ ─ ─ ─ ─ ─┐│             │ ┌─────────────────┐ │
│ │ not-an-email     ││             │ │ not-an-email     │ │
│ └─ ─ ─ ─ ─ ─ ─ ─ ─┘│ ← red      │ └─────────────────┘ │
│ ⚠ Enter a valid     │   border    │                      │
│   email address     │ ← message   │  (no feedback at all)│
└─────────────────────┘             └─────────────────────┘
```

**Rules for error messages**:
1. Place the error message **below** the field, not in a toast or at the top of the form.
2. Use an icon (⚠) plus text, not colour alone.
3. Associate with `aria-describedby` so screen readers announce it.
4. Persist until the error is fixed — don't time-out.
5. On submit, scroll to and focus the first invalid field.

### 20.4.3 Success States

After the user fixes an error:
- Remove the error styling and message.
- Optionally show a brief success indicator (✓ checkmark) that fades after 2 seconds.
- Don't be overly celebratory — subtle confirmation is enough.

## 20.5 Touch and Mobile Considerations

### 20.5.1 Designer on Touch Devices

If the designer itself runs on a tablet:

| Interaction | Desktop | Touch Adaptation |
|-------------|---------|-----------------|
| **Hover states** | Visible on mouse hover | Use long-press to reveal hover info |
| **Right-click menu** | Right mouse button | Long-press on control |
| **Drag threshold** | 4px movement | 10px movement (prevent accidental drags) |
| **Resize handles** | 8×8px | 16×16px (larger touch targets) |
| **Property panel** | Always visible | Slide-out panel, dismissed with swipe |
| **Precision placement** | Mouse positioning | Snap-to-grid at coarser intervals |

### 20.5.2 Forms Produced for Mobile

When the designer outputs a form for mobile consumption:

1. **Stack all rows to single column** below the small breakpoint.
2. **Use native input types** where possible (`type="email"`, `type="tel"`, `type="date"`) to get the correct mobile keyboard.
3. **Make buttons full-width** on mobile.
4. **Increase vertical spacing** between fields for thumb targets.
5. **Use fixed position submit** — on long forms, pin the submit button to the bottom of the screen.
6. **Split long forms into steps** — multi-step with a progress indicator reduces mobile abandonment.

## 20.6 Internationalisation (i18n) Considerations

Forms need to work in different languages and cultures:

| Concern | Solution in Designer |
|---------|---------------------|
| **Right-to-left (RTL)** | Layout reverses for Arabic/Hebrew. Flow containers use `direction: rtl` |
| **Long labels** | Labels should truncate with ellipsis and show full text on hover/focus |
| **Date formats** | Date picker respects locale (DD/MM/YYYY vs. MM/DD/YYYY) |
| **Number formats** | Number inputs respect locale decimal separators |
| **Translation** | Externalise all visible text to a string table in the form definition |
| **Multi-byte characters** | Test with CJK text that may be wider than Latin characters |

## 20.7 Performance for Large Forms

Forms with 50+ controls need special consideration:

### 20.7.1 Virtual Scrolling

For very long scrolling forms, only render controls visible in the viewport plus a buffer zone:

```
┌─────────────────────┐
│   ▲ Buffer zone      │  ← Off-screen, rendered for smooth scroll
├─────────────────────┤
│   Field 23          │
│   Field 24          │  ← Viewport: visible to user
│   Field 25          │
├─────────────────────┤
│   ▼ Buffer zone      │  ← Off-screen, rendered for smooth scroll
└─────────────────────┘
    Fields 1-22: not rendered (DOM placeholders only)
    Fields 26+: not rendered (DOM placeholders only)
```

### 20.7.2 Lazy Validation

Don't validate all 50 fields on every keystroke. Instead:
- Validate the active field on blur.
- Validate all fields only on submit.
- Use a validation queue that processes asynchronously.

### 20.7.3 Render Budget

Target: Form should become interactive within 200ms of page load. For complex forms:
- Server-side render the initial HTML (jsgui3 SSR).
- Hydrate interactively on the client.
- Defer non-visible sections until scrolled into view.

## 20.8 Key Takeaways

| Area | Principle | Implementation Priority |
|------|-----------|------------------------|
| **Layout** | Flow-first, collapse to single column on mobile | High |
| **Breakpoints** | 4 configurable breakpoints (0/600/900/1200) | High |
| **Labels** | Auto-generate and auto-associate | High |
| **Tab order** | DOM order = visual order | High |
| **Contrast** | Enforce minimums in theme system | High |
| **Error messages** | Below field, icon + text, aria-describedby | High |
| **Keyboard** | Full keyboard operation of designer and output | High |
| **Accessibility audit** | Live warnings + on-demand full audit | Medium |
| **Responsive preview** | Breakpoint switcher in designer | Medium |
| **Touch** | Larger targets, adapted interactions | Medium |
| **Virtual scrolling** | For 50+ control forms | Low |
| **i18n** | RTL, locale-aware inputs, string externalization | Low |

---

*This concludes Part VII — Research-Informed Design. These three chapters (18–20) provide the empirical foundation for building a professional-quality form designer.*
