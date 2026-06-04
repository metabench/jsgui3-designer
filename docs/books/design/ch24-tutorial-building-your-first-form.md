# Chapter 24 — Tutorial: Building Your First Form

> *A hands-on, step-by-step walkthrough that takes you from an empty canvas to a working contact form, exercising every major subsystem of the designer.*

## 24.1 What We Will Build

By the end of this chapter you will have:

1. Created a contact form with 5 fields: Name, Email, Phone, Message, and a Submit button.
2. Used the palette, canvas, and property grid panels.
3. Applied alignment guides and grid snapping.
4. Configured validation rules.
5. Saved the form as `.form.json`.
6. Previewed the form in runtime mode.

This tutorial references real APIs and control names from the jsgui3 ecosystem.

## 24.2 Step 1: Launch the Designer

Open the designer in your browser. You should see a three-panel layout:

```
┌──────────┬──────────────────────────────┬──────────────┐
│          │                              │              │
│ Palette  │      Design Canvas           │  Properties  │
│          │                              │              │
│ ────────│      (empty, with grid)       │              │
│ Controls │                              │              │
│ ────────│                              │              │
│  Text    │                              │              │
│  Email   │                              │              │
│  Button  │                              │              │
│  ...     │                              │              │
└──────────┴──────────────────────────────┴──────────────┘
```

**Verify**: The canvas shows a dot grid (8px spacing). The palette lists available controls. The property panel is empty (nothing selected).

## 24.3 Step 2: Add the First Control

1. In the **Palette**, find `Text_Input`.
2. Click it (single click — this selects the tool).
3. Click on the **canvas** at approximately position (20, 20).

A text input appears on the canvas with selection handles:

```
  ┌─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┐
  │ Text_Input                          │
  │ ┌─────────────────────────────────┐ │
  │ │                                 │ │
  │ └─────────────────────────────────┘ │
  └─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┘
```

**Verify**: The property grid now shows the text input's properties (name, label, x, y, width, height).

## 24.4 Step 3: Configure Properties

With the text input selected, set these properties in the **Property Grid**:

| Property | Value |
|----------|-------|
| `name` | `txtName` |
| `label` | `Full Name` |
| `required` | `true` |
| `placeholder` | `Enter your name` |
| `width` | `350` |

**Programming equivalent** (what this produces internally):

```javascript
const txtName = new Text_Input({
    context,
    name: 'txtName',
    label: 'Full Name',
    required: true,
    placeholder: 'Enter your name',
    style: { width: '350px' }
});
```

**Verify**: The control on the canvas updates its width in real-time as you change the `width` property. The label "Full Name" appears.

## 24.5 Step 4: Add More Controls

Repeat the process for each additional control:

| Control | Name | Label | Position (y) | Extra Properties |
|---------|------|-------|---------------|------------------|
| `Text_Input` | `txtEmail` | Email Address | ~70 | `input_type: email`, `required: true` |
| `Text_Input` | `txtPhone` | Phone Number | ~120 | `input_type: tel` |
| `Textarea` | `txtMessage` | Message | ~170 | `rows: 4`, `required: true` |
| `Button` | `btnSubmit` | Submit | ~280 | `variant: primary` |

**Tips**:
- After placing each control, use the **arrow keys** to nudge it into alignment (Shift+Arrow nudges by grid size — 8px).
- Watch for **alignment guides** (red lines) that appear when a control's edge lines up with another control.

After all controls are placed:

```
┌──────────────────────────────────────┐
│ Full Name                            │
│ ┌──────────────────────────────────┐ │
│ │ Enter your name                  │ │
│ └──────────────────────────────────┘ │
│ Email Address                        │
│ ┌──────────────────────────────────┐ │
│ │                                  │ │
│ └──────────────────────────────────┘ │
│ Phone Number                         │
│ ┌──────────────────────────────────┐ │
│ │                                  │ │
│ └──────────────────────────────────┘ │
│ Message                              │
│ ┌──────────────────────────────────┐ │
│ │                                  │ │
│ │                                  │ │
│ │                                  │ │
│ └──────────────────────────────────┘ │
│                                      │
│ ┌──────────────┐                     │
│ │    Submit     │                     │
│ └──────────────┘                     │
└──────────────────────────────────────┘
```

## 24.6 Step 5: Align Controls

Select all five controls (Ctrl+A or rubber-band select), then use the alignment toolbar:

1. Click **Align Left** — all controls snap to the same left edge.
2. Click **Distribute Vertically** — even vertical spacing between controls.

**Verify**: All controls have the same `x` value in the property grid. Vertical spacing is uniform.

## 24.7 Step 6: Add Validation

Select `txtEmail` and set these validation properties:

| Property | Value |
|----------|-------|
| `validation_pattern` | `^[^\s@]+@[^\s@]+\.[^\s@]+$` |
| `validation_message` | `Please enter a valid email address` |

Select `txtName` and set:

| Property | Value |
|----------|-------|
| `min_length` | `2` |
| `validation_message` | `Name must be at least 2 characters` |

## 24.8 Step 7: Save the Form

1. Press **Ctrl+S** or click the **Save** button in the toolbar.
2. Choose a filename: `contact-form.form.json`.

The saved file contains the complete document model as JSON (see Chapter 11 for format details).

**Verify**: Open `contact-form.form.json` in a text editor. You should see a JSON structure with `root.children` containing 5 nodes.

## 24.9 Step 8: Preview the Form

1. Press **F5** or click the **Preview** toggle in the toolbar.
2. The canvas switches to preview mode:

```
┌──────────────────────────────────────┐
│                                      │
│ Full Name                            │
│ ┌──────────────────────────────────┐ │
│ │ Enter your name                  │ │
│ └──────────────────────────────────┘ │
│ Email Address                        │
│ ┌──────────────────────────────────┐ │
│ │                                  │ │
│ └──────────────────────────────────┘ │
│ Phone Number                         │
│ ┌──────────────────────────────────┐ │
│ │                                  │ │
│ └──────────────────────────────────┘ │
│ Message                              │
│ ┌──────────────────────────────────┐ │
│ │                                  │ │
│ │                                  │ │
│ └──────────────────────────────────┘ │
│                                      │
│       ┌──────────────┐               │
│       │    Submit     │               │
│       └──────────────┘               │
│                                      │
└──────────────────────────────────────┘
```

**Test the form**:
1. Leave "Full Name" empty and click Submit → Error message appears: "Name must be at least 2 characters".
2. Enter "x" in Name → Error persists (min_length is 2).
3. Enter "Jo" → Error clears.
4. Enter "not-an-email" in Email → Error: "Please enter a valid email address".
5. Enter "jo@example.com" → Error clears.
6. Fill in Message and click Submit → All validation passes. Form data is collected.

**Verify**: Press F5 again to return to design mode. All design adornments (grid, outlines, handles) reappear.

## 24.10 Step 9: Undo/Redo

Let's verify undo works correctly:

1. Select the Submit button.
2. Change its `label` to "Send Message".
3. Press **Ctrl+Z** — the label reverts to "Submit".
4. Press **Ctrl+Y** — the label returns to "Send Message".
5. Delete the Submit button (press Delete).
6. Press **Ctrl+Z** — the button reappears, selected, at its original position.

## 24.11 Step 10: Duplicate and Clipboard

1. Select the Name field (`txtName`).
2. Press **Ctrl+D** (Duplicate) — a copy appears offset 16px down-right.
3. Change the duplicate's `name` to `txtCompany` and `label` to "Company".
4. Press **Ctrl+Z** twice — the duplicate disappears and properties revert.
5. Press **Ctrl+Y** twice — it comes back.

## 24.12 What We Exercised

This tutorial touched every major system:

| System | Operations |
|--------|-----------|
| **Palette** | Tool selection, click-to-add |
| **Canvas** | Control placement, grid snapping, alignment |
| **Property Grid** | Property editing, live preview |
| **Document Model** | Node creation, hierarchy |
| **Selection** | Click-to-select, Ctrl+A, rubber-band |
| **Alignment** | Align Left, Distribute Vertically |
| **Validation** | Pattern, required, min_length |
| **Serialization** | Save, load (.form.json) |
| **Preview Mode** | Design ↔ Preview toggle |
| **Undo/Redo** | Property change, delete, undo/redo |
| **Clipboard** | Duplicate |

## 24.13 Next Steps

Now that you've built a basic form, try:

- **Chapter 10** — Learn about `Form_Container` layouts and data binding.
- **Chapter 12** — Understand the full undo/redo command system.
- **Chapter 13** — Apply themes to change the form's visual style.
- **Chapter 15** — Bind form fields to a `Data_Object` for MVVM patterns.
- **Chapter 17** — Explore multi-page forms and tab-order management.

---

*Congratulations — you've built your first form with the jsgui3 designer.*
