---
description: Autonomous iterative improvement loop — assess, plan, implement, test, summarize, repeat
---

# Iterative Improvements

## Triggers
- "improve the designer", "make it better", "iterate", "autonomous improvements"
- Any open-ended request to enhance the designer without a specific feature list

## Purpose
This skill enables autonomous, continuous improvement of the jsgui3-designer.
Rather than waiting for specific instructions, the agent inspects the current
state, identifies the highest-impact improvement, implements it, tests it,
documents it, and then repeats.

## The Loop

```
┌─────────────────────────────────────────────┐
│  1. ASSESS — What do we have right now?     │
│  2. THINK  — What's the best improvement?   │
│  3. PLAN   — How exactly will I do it?      │
│  4. BUILD  — Implement the change           │
│  5. TEST   — Verify it works (browser)      │
│  6. RECORD — Summarize what was done        │
│  7. REPEAT — Go back to step 1              │
└─────────────────────────────────────────────┘
```

## Detailed Steps

### Step 1: ASSESS — Inspect Current State

**Read the codebase:**
- View `client.js` outline to understand current features
- Check `models/control_registry.js` for control types
- Review the `.agent/skills/designer-architecture.md` for architecture context

**Look at the live app:**
- Start/restart server: `node server.js`
- Use browser subagent to navigate to `http://localhost:52030`
- Capture a full screenshot of the initial state
- Place several controls (buttons, inputs, panels, grids) on the canvas
- Capture a screenshot showing the populated designer
- Try the main workflows: placement, selection, drag, resize, undo, context menu
- Record what looks polished and what looks rough

**Build a mental inventory:**
- What features exist and work well?
- What's missing compared to a real form designer (e.g. Visual Studio, Qt Designer)?
- What looks visually rough or unpolished?
- What interactions feel clunky or broken?

### Step 2: THINK — Decide What to Improve

Evaluate improvements across these categories (ordered by typical impact):

#### Category A: Visual Polish (High User Impact)
- Do controls look realistic? (WYSIWYG fidelity)
- Is spacing/alignment consistent?
- Do colors, borders, and shadows look professional?
- Are fonts and text sizing appropriate?
- Does the selection state look clear?
- Is the grid visible and helpful?

#### Category B: Missing Core Features (Functional Gaps)
- Multi-select (shift/ctrl+click, marquee selection)
- Align/distribute tools
- Z-order (bring to front/send to back)
- Snap-to-grid toggle
- Grid visibility toggle
- Property binding (e.g. label text updates WYSIWYG preview live)
- Container nesting (drop controls inside panels/group boxes)
- Tab order editing
- Form preview mode (run the form without edit chrome)

#### Category C: Interaction Refinement
- Drag feedback (ghost/shadow while dragging)
- Better resize cursors and handle visibility
- Keyboard navigation (arrow keys nudge selected control)
- Double-click to edit text in-place
- Better status bar feedback
- Tooltip on hover showing control type/name

#### Category D: File & Persistence
- Auto-save / dirty indicator
- Recent files list
- Export to HTML/JSON schema
- Import from existing jsgui3 form definitions

#### Selection Criteria
Pick the single improvement that scores highest on:
1. **User-visible impact** — Will the user immediately notice the difference?
2. **Feasibility** — Can it be implemented in one iteration (< 200 lines)?
3. **Foundation value** — Does it enable future improvements?
4. **Risk** — Low chance of breaking existing features

### Step 3: PLAN — Define the Change

Write a concise plan:
- What exactly will change (files, methods, CSS)
- What the before/after should look like
- Any edge cases to handle
- How to test it

Keep scope tight. One improvement per iteration. Resist scope creep.

### Step 4: BUILD — Implement

- Edit `client.js` (or other files) with the changes
- Follow existing patterns (command pattern for mutations, CSS in the static block)
- Keep changes minimal and focused
- Restart the server after changes: terminate old → `node server.js`

### Step 5: TEST — Verify in Browser

**Mandatory testing protocol:**

1. **Smoke test** — Does the page load without errors?
   ```bash
   node -e "require('./client'); console.log('OK')"
   ```

2. **Visual verification** — Use browser subagent:
   - Load `http://localhost:52030`
   - Place controls, exercise the new feature
   - Capture before/after screenshots
   - Check browser console for errors

3. **Regression check** — Verify existing features still work:
   - Place a control (WYSIWYG renders correctly)
   - Select → drag → resize
   - Undo/redo
   - Context menu opens and closes
   - Inspector shows properties

4. **Edge cases** — Test boundary conditions specific to the improvement

### Step 6: RECORD — Document What Was Done

Update the working notes with:
- What was improved and why it was chosen
- Before/after screenshots (embedded in the summary)
- Any issues found and fixed during testing
- Ideas that came up but were deferred to future iterations

Format:
```markdown
## Iteration N: [Title of Improvement]

**Category:** [Visual Polish / Missing Feature / Interaction / File & Persistence]
**Impact:** [Brief description of user-visible change]

### Changes
- [File] — [What changed]

### Before / After
![Before](path/to/before.png)
![After](path/to/after.png)

### Testing
- ✅ Smoke test passed
- ✅ Visual verification
- ✅ Regression check
- ✅ Edge cases: [list]

### Deferred Ideas
- [Ideas that came up but belong in a future iteration]
```

### Step 7: REPEAT — Start the Next Iteration

Go back to Step 1. Take a fresh look at the app with the improvement applied.
The new state may reveal new priorities.

**Circuit breakers:**
- Stop after 5 iterations and summarize all changes to the user
- Stop if an improvement breaks something that can't be fixed quickly
- Stop if the remaining improvements are all large-scope (> 200 lines)
- Always stop and ask the user if unsure about a design decision

## Anti-Patterns

| Anti-Pattern | Why It's Bad | Do This Instead |
|-------------|-------------|-----------------|
| Giant refactors | High risk, hard to test, hard to undo | One small improvement per iteration |
| Skipping the screenshot | Can't verify visual quality without looking | Always capture before/after |
| Implementing 3 things at once | If something breaks, unclear which change caused it | One change, test, commit |
| Optimizing internals nobody sees | Low user impact | Prioritize visible improvements |
| Changing architecture | Out of scope for iterative polish | Plan separately, discuss with user |
| Not testing regressions | New features break old ones silently | Run the regression checklist every iteration |

## Example Iteration Ideas (Starter List)

These are seed ideas to get started. Always assess the actual current state first.

1. **Grid dots on the canvas** — Subtle dot grid to show alignment guides
2. **Live label update** — Changing the "label" property in inspector updates WYSIWYG preview immediately
3. **Selection marquee** — Drag on empty canvas to rubber-band select multiple controls
4. **Arrow key nudge** — Arrow keys move selected control by 1 grid unit
5. **Better drag feedback** — Semi-transparent ghost while dragging
6. **Snap lines** — Show alignment guides when dragging near other controls
7. **Double-click to edit** — Double-click a button or label to edit its text inline
8. **Tab order visualization** — Show numbered badges for tab order
9. **Zoom controls** — Zoom in/out on the canvas
10. **Form preview** — Preview the form without selection/resize chrome
