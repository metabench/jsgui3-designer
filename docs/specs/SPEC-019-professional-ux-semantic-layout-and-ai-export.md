---
id: SPEC-019
title: Professional UX, Semantic Layout, and AI-Ready Export
status: draft
priority: critical
depends-on: [SPEC-001, SPEC-002, SPEC-004, SPEC-012, SPEC-015, SPEC-017, SPEC-018]
book-refs: [ch18, ch19, ch20, ch21]
estimated-complexity: L
---

# SPEC-019: Professional UX, Semantic Layout, and AI-Ready Export

## 1. Overview

This specification defines how the current designer evolves from a capable prototype into a genuinely professional, user-friendly form builder.

The focus is not only on adding more features. The primary goal is to make the designer:

1. Faster and easier to use for non-technical authors.
2. Better at producing visually polished, responsive forms.
3. More semantic and less pixel-driven.
4. Better at exporting design intent so AI systems can recreate the form inside full applications.
5. Independent from any one data-binding/runtime strategy.

This is an umbrella specification. It covers semantic spacing, responsive layout semantics, user-friendly authoring flows, visual design direction, templates/presets, preview/linting, and AI-oriented export hardening.

## 2. Product Intent

### 2.1 Core Product Position

The designer should feel like:

- a modern form composition tool,
- with the confidence and clarity of older Visual Studio / Excel productivity software,
- without looking retro, toy-like, or web-dashboard-generic.

### 2.2 Primary User Outcomes

The product should let a user:

- build a good-looking responsive form quickly,
- understand why the layout behaves the way it does,
- avoid thinking in raw pixel values most of the time,
- preview how the form adapts across devices,
- export enough structure and design intent for a runtime or AI system to rebuild it reliably.

### 2.3 Design Principles

1. **Semantic over pixel-first**
   Use layout intent, spacing intent, and section intent before x/y/px.

2. **Fast defaults**
   A newly dropped control should usually look correct without adjustment.

3. **Visible structure**
   The user should always understand which container, section, row, or group they are editing.

4. **Gentle guidance**
   The editor should suggest good form design rather than simply allow bad design.

5. **Progressive disclosure**
   Common controls stay simple; advanced controls appear when needed.

6. **Export intent, not screenshots**
   Save enough meaning that downstream systems can recreate the design intelligently.

## 3. Scope

### In Scope

- Semantic spacing and density controls
- Responsive form layout semantics beyond columns/spans
- User-friendly editing flows for spacing, ordering, and structure
- Higher-quality list editors and section editors
- Modernized blue-gray visual system and style preset architecture
- Templates, presets, and guided empty states
- Preview, linting, and quality checks
- AI-ready export schema improvements
- Autosave and recovery recommendations

### Out of Scope

- Concrete runtime data binding integrations
- App-specific business logic
- Server-side multi-user collaboration
- Full code generation for every target framework
- Arbitrary design-tool-grade vector editing

## 4. Current State Summary

The current implementation already has a useful baseline:

- responsive containers,
- viewport previews,
- item spans,
- width policy (`fill`, `fit`, `fixed`),
- `new_row`,
- container nesting,
- semantic AI export,
- a stronger inspector and shell styling,
- reorder controls for auto-layout items.

The major remaining problem is that several important design decisions are still expressed numerically or mechanically when they should be expressed semantically and interactively.

Examples:

- spacing still relies heavily on `padding` / `gap` numbers,
- options are still edited as multiline text,
- many common actions still require inspector work,
- the editor does not yet guide the user strongly enough toward professional form composition.

## 5. Feature Program

The implementation program is split into seven feature tracks:

1. Semantic spacing and visual rhythm
2. Richer responsive layout semantics
3. Faster authoring and editing UX
4. Professional visual design system
5. Templates, presets, and guided composition
6. Preview, linting, and quality guidance
7. AI-ready persistence and export

Each track is detailed below.

## 6. Semantic Spacing and Visual Rhythm

### 6.1 Problem

Users should not need to think primarily in pixel numbers such as:

- `margin-top: 18`,
- `padding: 16`,
- `gap: 14`.

Those numbers are useful internally, but they are not the most user-friendly way to describe form rhythm.

Form authors think in terms like:

- compact
- comfortable
- airy
- keep this close to the previous field
- separate the action row
- make this section feel inset
- give this heading more breathing room

### 6.2 User-Facing Model

Spacing should be specified through semantic controls first.

#### Section-Level Spacing Controls

- `density`: `compact`, `balanced`, `airy`
- `inset_style`: `flush`, `padded`, `panel`
- `section_separation`: `none`, `small`, `medium`, `large`
- `heading_emphasis`: `none`, `standard`, `spacious`

#### Item-Level Spacing Controls

- `spacing_before`: `inherit`, `none`, `small`, `medium`, `large`
- `spacing_after`: `inherit`, `none`, `small`, `medium`, `large`
- `group_with_previous`: boolean
- `keep_with_next`: boolean
- `alignment_to_section`: `inherit`, `flush`, `inset`

#### Action Row Controls

- `action_emphasis`: `inline`, `separated`, `footer`
- `action_alignment`: `left`, `center`, `right`, `stretch`

### 6.3 Internal Representation

The document model should store semantic values, not only resolved numbers.

Example:

```json
{
  "density": "balanced",
  "spacing_before": "large",
  "inset_style": "panel",
  "action_emphasis": "footer"
}
```

The renderer resolves these values through style tokens.

### 6.4 Token Mapping

Each style preset defines a spacing token table.

Example:

```json
{
  "spacing": {
    "none": 0,
    "small": 8,
    "medium": 16,
    "large": 24
  },
  "density": {
    "compact": { "field_gap": 10, "section_gap": 16, "padding": 14 },
    "balanced": { "field_gap": 16, "section_gap": 24, "padding": 20 },
    "airy": { "field_gap": 24, "section_gap": 32, "padding": 28 }
  }
}
```

### 6.5 UI Changes

- Add a `Spacing` inspector group ahead of low-level numeric layout fields.
- Show choice chips for common spacing presets.
- Provide a "Use exact values" disclosure for advanced users.
- Show inline spacing badges on selected sections: `Balanced`, `Panel`, `Large separation`.

### 6.6 Acceptance Criteria

- A user can specify section rhythm without entering any pixel numbers.
- Changing a spacing preset updates canvas layout immediately.
- The export includes semantic spacing values and resolved style tokens.
- Existing numeric documents remain loadable.

## 7. Responsive Layout Semantics

### 7.1 Problem

The current responsive system has a good base, but it still lacks several author-friendly concepts needed for serious form design.

### 7.2 Required Additions

#### Container-Level Additions

- named breakpoints configurable per document
- label layout policy:
  - `top`
  - `left`
  - `inline-compact`
  - `auto`
- section alignment policy:
  - `start`
  - `center`
  - `stretch`
- mobile simplification policy:
  - `stack`
  - `preserve-groups`
  - `collapse-secondary`

#### Item-Level Additions

- `width_policy`: already implemented, keep and harden
- `new_row`: already implemented, keep and harden
- `visibility_by_breakpoint`:
  - `all`
  - `desktop-tablet`
  - `desktop-only`
  - `mobile-only`
- `order_override` by breakpoint
- `label_visibility`:
  - `show`
  - `compact`
  - `hidden-with-aria`
- `action_role`:
  - `none`
  - `primary`
  - `secondary`
  - `destructive`

### 7.3 Editor Behaviour

- The user should be able to mark a field as:
  - full row
  - half row
  - compact fit
  - start new row
- Breakpoint previews should be stateful and obvious.
- Containers should expose "desktop/tablet/mobile story" in one place rather than scattering controls.

### 7.4 Implementation Notes

- Keep the current layout engine as the core.
- Expand it to resolve:
  - breakpoint visibility
  - item ordering
  - label layout switching
  - action row layout
- Do not reintroduce pixel-first breakpoint editing.

### 7.5 Acceptance Criteria

- A user can express common responsive form patterns without using raw x/y overrides.
- The same form can adapt to mobile layout through semantic rules alone.
- The export contains both breakpoint definitions and per-item responsive intent.

## 8. Faster Authoring and Editing UX

### 8.1 Goal

The user should be able to build and adjust a form mostly on the canvas, with the inspector as support rather than a bottleneck.

### 8.2 Features

#### 8.2.1 Inline Add Controls

Show insertion affordances:

- between rows,
- inside empty containers,
- after the last item in a section,
- inside action rows.

Actions:

- `Add field`
- `Add section`
- `Add action`
- `Duplicate previous pattern`

#### 8.2.2 Drag-to-Reorder with Drop Indicators

Current arrow-based reorder is reliable but mechanical. The next step is:

- drag within responsive containers,
- show insertion lines,
- show row-preview placement,
- preserve undo/redo and DOM order.

#### 8.2.3 Quick Edit Popovers

Single-click or double-click quick edit should allow:

- label text,
- help text,
- required toggle,
- width policy,
- row/full-row choice,
- variant for buttons.

#### 8.2.4 Smart Inspector

The inspector should have two modes:

- `Quick`: common controls only
- `Advanced`: full schema

Quick mode should surface:

- content,
- layout role,
- spacing preset,
- responsive span,
- visibility,
- required state.

#### 8.2.5 Better Option Editors

Replace textarea-based editing for:

- select options,
- radio groups,
- tabs,
- accordion sections.

Required features:

- add/remove items
- reorder items
- default selection
- disabled option state
- per-item labels and values

#### 8.2.6 Structure Navigation

Add:

- breadcrumbs for nested containers,
- search in the outline,
- collapse/expand section tree,
- "select parent" and "focus children" actions.

#### 8.2.7 Command Palette

Provide a searchable command palette for:

- add field types
- wrap in section
- duplicate row
- switch viewport
- run lint
- export AI JSON

### 8.3 Acceptance Criteria

- A user can add, move, and edit common form content with minimal inspector dependence.
- The option editing experience no longer depends on newline text blobs.
- Nested structures are navigable without confusion.

## 9. Professional Visual Design System

### 9.1 Design Direction

The UI should reference the strengths of older Visual Studio / Excel-era productivity tools:

- strong pane separation,
- confident tool-window hierarchy,
- subtle gradients,
- readable blue-gray chrome,
- crisp control surfaces,
- dense but not cramped information presentation.

It must avoid:

- retro Windows XP parody,
- antique bevel overload,
- flat generic SaaS dashboard styling,
- neon accents,
- ornamental nostalgia.

### 9.2 Style System

Define style presets as named token sets.

Initial preset:

- `studio_blue`

Later presets:

- `studio_slate`
- `studio_light`
- `paper_forms`

Each preset includes:

- typography
- color roles
- spacing tokens
- radius tokens
- elevation tokens
- control chrome styles

### 9.3 Canvas and Inspector Direction

- Palette and inspector should feel like disciplined tool panes.
- The canvas should look like a design surface, not a blank white page floating in space.
- Selection states should be precise and understated.
- Empty states should feel instructive, not decorative.

### 9.4 Motion

Use restrained motion:

- viewport changes,
- panel opening,
- insertion indicators,
- preview mode transitions.

Avoid decorative animation.

### 9.5 Acceptance Criteria

- The interface feels more like a professional authoring tool than a demo app.
- New style presets can be added without rewriting component CSS.

## 10. Templates, Presets, and Guided Composition

### 10.1 Templates

Provide start templates:

- Contact form
- Registration form
- Checkout details
- Survey form
- Multi-step application
- Search/filter sidebar

### 10.2 Section Presets

Provide reusable sections:

- Contact details
- Address block
- Payment section
- Review summary
- Action footer
- Consent block

### 10.3 Field Presets

Provide content-aware field presets:

- Email
- Phone
- Date of birth
- Country select
- Password + confirm
- Search box

### 10.4 Guided Build Flow

First-run empty state should offer:

- start from blank
- start from template
- add first section

### 10.5 Acceptance Criteria

- A user can produce a respectable first form in under five minutes.
- Templates generate semantic structure, not just a static canvas snapshot.

## 11. Preview, Linting, and Guidance

### 11.1 Preview Mode

Preview should be a real runtime-feel mode:

- tab through fields,
- sample values,
- disabled/required/error states,
- action layout,
- mobile preview.

### 11.2 Linting

Add a design quality panel with rules such as:

- missing field labels,
- very narrow fields on mobile,
- inconsistent field widths within a section,
- submit actions appearing too early,
- sections with no heading,
- dense spacing around destructive actions,
- poor contrast in style presets.

### 11.3 Accessibility Guidance

Integrate with existing accessibility direction from chapter 20:

- label completeness,
- field grouping,
- touch target size,
- heading hierarchy,
- focus order.

### 11.4 Acceptance Criteria

- A user can detect obvious design issues before export.
- Preview and linting reinforce good practice rather than just report errors.

## 12. AI-Ready Save and Export Model

### 12.1 Principles

The saved model and the AI export are related but not identical.

- **Saved document**: canonical editable design state.
- **AI export**: normalized semantic handoff for recreation in full applications.

### 12.2 Export Requirements

The export must include:

- hierarchy
- component roles
- semantic content
- spacing semantics
- responsive rules
- breakpoint definitions
- style preset name
- style tokens
- accessibility hints
- implementation notes

It must not require:

- a specific framework,
- a specific state library,
- a specific binding system.

### 12.3 Expanded Export Shape

Example:

```json
{
  "schema": "jsgui3.ai-form/v2",
  "data_binding": null,
  "style_preset": "studio_blue",
  "breakpoints": {
    "desktop": 1280,
    "tablet": 900,
    "mobile": 430
  },
  "form": {
    "title": "Contact us",
    "layout": {
      "mode": "form-surface",
      "container": {
        "layout_mode": "grid",
        "density": "balanced",
        "inset_style": "panel"
      }
    },
    "components": [
      {
        "type": "text_input",
        "role": "field",
        "content": { "label": "Email" },
        "layout": {
          "mode": "responsive-item",
          "width_policy": "fill",
          "span": { "desktop": 1, "tablet": 1, "mobile": 1 },
          "spacing_before": "small"
        }
      }
    ]
  }
}
```

### 12.4 Compatibility Strategy

- Continue supporting current JSON document loading.
- Add export versioning.
- Keep `data_binding: null` by default.
- Add migration helpers when schema evolves.

### 12.5 Acceptance Criteria

- An external renderer or AI system can reconstruct layout and styling intent without reverse-engineering raw coordinates.
- The export remains understandable to humans.

## 13. Reliability and Trust Features

### 13.1 Autosave

Implement local autosave with:

- debounce,
- restore last working draft,
- visible saved state,
- explicit recovery flow after crash/reload.

### 13.2 Version History

Short-term requirement:

- rolling snapshots,
- named restore points,
- compare current vs previous snapshot.

### 13.3 Undo/Redo

Expand undo coverage for:

- reorder gestures,
- option list edits,
- template insertion,
- spacing preset changes,
- style preset changes.

## 14. Data Model Changes

### 14.1 New or Expanded Document Properties

At document / form level:

- `style_preset`
- `breakpoints`
- `density`
- `inset_style`
- `section_separation`

At container level:

- `label_layout`
- `action_alignment`
- `action_emphasis`
- `mobile_simplification`

At item level:

- `width_policy`
- `new_row`
- `spacing_before`
- `spacing_after`
- `group_with_previous`
- `keep_with_next`
- `visibility_by_breakpoint`
- `label_visibility`
- `action_role`

### 14.2 Registry Changes

- Add semantic groups in the property schema:
  - `Content`
  - `Spacing`
  - `Responsive`
  - `Appearance`
  - `Accessibility`
- Keep `Layout` for advanced users only.

## 15. UI Surface Changes

### 15.1 Palette

- Add search
- add templates shortcut
- add "recently used" controls

### 15.2 Canvas

- inline add affordances
- drop indicators
- spacing badges
- row/full-row toggles
- reorder drag indicators

### 15.3 Inspector

- quick/advanced modes
- semantic spacing chips
- breakpoint-aware controls
- richer list editors

### 15.4 Outline

- search
- collapse/expand
- drag reorder
- badges for sections and actions

## 16. Implementation Phases

### Phase 1: Semantic Spacing Foundation

Deliver:

- semantic spacing schema
- token mapping
- inspector chips
- AI export additions
- backward-compatible load/save

### Phase 2: Responsive Semantics Hardening

Deliver:

- breakpoint visibility
- label layout rules
- action row alignment
- order overrides

### Phase 3: Authoring Flow Improvements

Deliver:

- inline add buttons
- quick edit popovers
- drag-to-reorder
- breadcrumbs
- search

### Phase 4: List and Section Editors

Deliver:

- proper option editors
- tab editor
- accordion section editor
- reusable section presets

### Phase 5: Templates and Guided Start

Deliver:

- template library
- section presets
- first-run wizard

### Phase 6: Preview, Linting, and QA

Deliver:

- interactive preview
- lint panel
- responsive warnings
- accessibility guidance

### Phase 7: Reliability and Polish

Deliver:

- autosave
- recovery
- snapshot history
- command palette
- final visual polish pass

## 17. Testing Strategy

### Unit Tests

- semantic spacing resolution
- responsive layout resolution
- breakpoint visibility rules
- reorder commands
- export normalization

### Integration Tests

- add and reorder fields in responsive containers
- apply spacing presets and verify layout changes
- edit option lists visually
- switch viewport and verify semantic behaviour
- run preview and lint flows

### Browser / Manual Tests

- desktop / tablet / mobile authoring
- keyboard-only editing
- crash/recovery flow
- export inspection in realistic sample forms

## 18. Success Metrics

The work should be considered successful when:

1. A new user can create a respectable responsive form without editing pixel values.
2. Most common layout changes can be done from the canvas or a quick inspector.
3. Exported AI JSON captures enough design intent for downstream reconstruction.
4. The UI feels like a polished desktop-grade authoring tool.
5. Linting and preview catch common design mistakes before export.

## 19. Recommended Delivery Order

For best user impact, implementation should proceed in this order:

1. Semantic spacing
2. Inline add + quick edit
3. Drag-to-reorder with indicators
4. Better option editors
5. Templates and section presets
6. Preview and linting
7. Autosave and recovery

This order improves user-friendliness early while steadily strengthening the underlying model.

