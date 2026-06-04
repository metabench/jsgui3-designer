# Chapter 21 — The Specification System

> *A structured format for writing specs that an AI coding agent (or human developer) can use to implement the form builder feature by feature.*

## 21.1 Why Specs, Not Just Chapters?

The preceding chapters explain *how* the form builder should work. But explanatory prose is not sufficient to drive implementation. A coding agent needs:

1. **Precise scope** — what exactly to build (and not build).
2. **Acceptance criteria** — how to know it's done.
3. **Testable behaviour** — verifiable with automated tests.
4. **Dependencies** — what must exist before this can be built.
5. **Interface contracts** — exact APIs, events, and data formats.

This chapter defines the **spec format** used for all form builder specs living in `docs/specs/`. Each spec is a self-contained, implementable unit of work.

## 21.2 Design Principles for Our Spec Format

These principles emerged from research into spec-driven development, component specification formats, and AI-agent-friendly documentation:

| Principle | Rationale |
|-----------|-----------|
| **Markdown with YAML frontmatter** | Human-readable AND machine-parseable. Agents can extract metadata programmatically |
| **One spec per feature/component** | Keeps scope small and parallelisable |
| **Given-When-Then acceptance criteria** | Unambiguous, directly translatable to test cases |
| **Component anatomy diagrams** | Visual specification of structure prevents misinterpretation |
| **Explicit dependencies** | A spec declares what must exist before it can be implemented |
| **API-first** | Specifies the JavaScript API/constructor interface before describing visual behaviour |
| **Accessibility built-in** | Every spec includes an accessibility section — not an afterthought |
| **Living document** | Specs are updated as implementation reveals edge cases |

## 21.3 The Spec Template

Every spec in `docs/specs/` follows this template:

```markdown
---
id: SPEC-NNN
title: [Feature/Component Name]
status: draft | in-review | approved | implementing | done
priority: critical | high | medium | low
depends-on: [SPEC-001, SPEC-002]
book-refs: [ch05, ch09, ch19]
estimated-complexity: S | M | L | XL
---

# SPEC-NNN: [Feature/Component Name]

## 1. Overview

One paragraph describing what this feature/component does and why it matters.

## 2. Scope

### In Scope
- [Bullet list of what IS included]

### Out of Scope
- [Bullet list of what is NOT included — prevents scope creep]

## 3. Dependencies

| Dependency | Type | Status |
|-----------|------|--------|
| [SPEC-xxx] or [jsgui3 feature] | spec / library / framework | done / needed |

## 4. Anatomy (for UI components)

```
[ASCII diagram showing the component's visual structure,
 labelling each sub-element]
```

## 5. API

### Constructor / Configuration

```javascript
const component = new ComponentName({
    // Required properties
    property1: 'value',     // Type — description
    property2: 123,         // Type — description

    // Optional properties
    option1: true,          // Type — description (default: true)
});
```

### Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `name` | `string` | — | Required. Internal name |

### Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `method1()` | `(arg: Type) → ReturnType` | What it does |

### Events

| Event | Payload | When Fired |
|-------|---------|------------|
| `change` | `{ value, previousValue }` | When the value changes |

## 6. Behaviour

### 6.1 [Behaviour Category]

Describe the behaviour in detail. Use sub-sections for different aspects.

## 7. Acceptance Criteria

Each criterion uses Given-When-Then format:

- **AC-1**: Given [precondition], when [action], then [expected result].
- **AC-2**: Given [precondition], when [action], then [expected result].
- **AC-3**: ...

### Edge Cases

- **EC-1**: [Description of edge case and expected behaviour]

## 8. Accessibility

| Requirement | WCAG | Implementation |
|-------------|------|---------------|
| [Requirement] | [Criterion] | [How to implement] |

## 9. Visual States

| State | Description | Visual Treatment |
|-------|-------------|-----------------|
| Default | Normal state | ... |
| Hover | Mouse over | ... |
| Active | Being interacted with | ... |
| Disabled | Not interactive | ... |
| Error | Validation failed | ... |

## 10. Test Plan

### Unit Tests
- [ ] [Test description — what to assert]
- [ ] [Test description]

### Integration Tests
- [ ] [Test description — component interaction to verify]

### Visual / Manual Tests
- [ ] [Manual check description]

## 11. Implementation Notes

Any guidance for the implementer: suggested approach, known gotchas,
relevant code in the codebase to reference.

## 12. Open Questions

- [ ] [Unresolved question needing a decision]
```

## 21.4 Field-by-Field Guidance

### YAML Frontmatter

The frontmatter is the machine-readable header. Tools and agents can parse this to:
- **Discover specs** by status (`grep` for `status: approved`).
- **Build a dependency graph** from `depends-on`.
- **Prioritise work** using `priority` and `estimated-complexity`.
- **Cross-reference** to the book via `book-refs`.

```yaml
---
id: SPEC-005
title: Smart Alignment Guides
status: approved
priority: high
depends-on: [SPEC-001, SPEC-003]
book-refs: [ch05, ch09, ch19]
estimated-complexity: M
---
```

### Status Lifecycle

```
draft → in-review → approved → implementing → done
                  ↘ rejected (with reason)
```

| Status | Meaning |
|--------|---------|
| `draft` | Being written, not ready for review |
| `in-review` | Written, needs human review and approval |
| `approved` | Reviewed and approved — ready to implement |
| `implementing` | Work in progress |
| `done` | Implemented and tested |
| `rejected` | Reviewed and rejected — reason documented |

### Acceptance Criteria Format

Every acceptance criterion follows **Given-When-Then**:

```
Given [a specific starting state or precondition],
When [the user performs a specific action],
Then [a specific, observable, testable result occurs].
```

**Good examples**:
```
AC-1: Given a control is selected on the canvas,
      when the user drags a resize handle,
      then the control's dimensions update in real-time
      and the property panel shows the new width and height.

AC-2: Given the grid is enabled with 8px spacing,
      when a control is dragged near a grid line,
      then the control snaps to the nearest grid point
      and a visual indicator shows the snap.

AC-3: Given two controls exist on the canvas,
      when a control is dragged such that its left edge
      aligns with another control's left edge,
      then a vertical alignment guide (red line) appears.
```

**Bad examples**:
```
❌ "The resize should work properly."
   → Not testable. What is "properly"?

❌ "Drag and drop should be intuitive."
   → Subjective. Can't write a test for "intuitive".

❌ "Handles edge cases."
   → Which edge cases? List them explicitly.
```

### Complexity Estimates

| Size | Description | Typical Effort |
|------|-------------|---------------|
| **S** | Single function or simple UI addition | A few hours |
| **M** | Component with multiple interactions | 1-2 days |
| **L** | Multi-component feature with integration | 3-5 days |
| **XL** | Major subsystem or cross-cutting concern | 1-2 weeks |

## 21.5 Spec Directory Structure

```
docs/
  specs/
    README.md              ← Index of all specs with status
    SPEC-001-design-canvas.md
    SPEC-002-control-palette.md
    SPEC-003-property-grid.md
    SPEC-004-drag-and-drop.md
    SPEC-005-smart-alignment-guides.md
    SPEC-006-selection-model.md
    SPEC-007-resize-handles.md
    SPEC-008-undo-redo.md
    SPEC-009-form-serialization.md
    SPEC-010-responsive-containers.md
    ...
```

### Spec Index (README.md)

The spec index should be auto-maintainable:

```markdown
# Form Builder Specifications

| ID | Title | Status | Priority | Depends On | Complexity |
|----|-------|--------|----------|------------|------------|
| SPEC-001 | Design Canvas | approved | critical | — | L |
| SPEC-002 | Control Palette | approved | critical | SPEC-001 | M |
| SPEC-003 | Property Grid | approved | critical | SPEC-001 | M |
| SPEC-004 | Drag and Drop | approved | critical | SPEC-001, SPEC-002 | L |
| SPEC-005 | Smart Alignment Guides | draft | high | SPEC-001, SPEC-004 | M |
| ...  | ... | ... | ... | ... | ... |
```

## 21.6 Dependency Graph

Specs have dependencies. Implementation must respect this ordering. A typical dependency graph for the form builder:

```
SPEC-001 Design Canvas ──────────────────────┐
    ├── SPEC-002 Control Palette              │
    ├── SPEC-003 Property Grid                │
    ├── SPEC-004 Drag and Drop ───────────────┤
    │       ├── SPEC-005 Smart Alignment      │
    │       └── SPEC-006 Selection Model      │
    ├── SPEC-007 Resize Handles               │
    ├── SPEC-008 Undo/Redo                    │
    │       └── (all mutation specs depend)   │
    ├── SPEC-009 Form Serialization           │
    └── SPEC-010 Responsive Containers        │
                                              │
SPEC-011 Document Model ──────────────────────┘
    (foundational — most specs depend on this)
```

## 21.7 How Agents Use Specs

An AI coding agent should follow this workflow when implementing a spec:

1. **Read the spec** — parse the YAML frontmatter and all sections.
2. **Check dependencies** — verify all `depends-on` specs are `status: done`.
3. **Understand the API** — read Section 5 to understand the constructor, properties, methods, events.
4. **Read book chapters** — follow `book-refs` for background context.
5. **Implement** — write the code that satisfies Section 6 (Behaviour).
6. **Write tests** — translate Section 7 (Acceptance Criteria) into automated tests. Each AC becomes one or more test cases.
7. **Check accessibility** — ensure Section 8 requirements are met.
8. **Run test plan** — execute Section 10 test plan items.
9. **Update status** — change `status: implementing` → `status: done`.

### Machine-Readable Acceptance Criteria

For maximum automation, acceptance criteria can optionally be tagged with test IDs:

```markdown
- **AC-1** `[test:canvas.resize.realtime]`: Given a control is selected...
- **AC-2** `[test:canvas.snap.grid]`: Given the grid is enabled...
```

This allows an agent to grep for all AC tags and verify each has a corresponding test.

## 21.8 Spec Quality Checklist

Before marking a spec as `in-review`, verify:

- [ ] **Overview** clearly states what and why.
- [ ] **Scope** has both in-scope and out-of-scope lists.
- [ ] **Dependencies** are listed with their status.
- [ ] **API** has constructor, properties, methods, and events.
- [ ] **Acceptance criteria** use Given-When-Then format (minimum 3 per spec).
- [ ] **Edge cases** are listed explicitly.
- [ ] **Accessibility** section is present and references WCAG criteria.
- [ ] **Test plan** has at least 3 unit test items.
- [ ] **No subjective language** ("intuitive", "nice", "fast" → replaced with measurable criteria).
- [ ] **No ambiguous terms** ("properly", "correctly" → replaced with specific outcomes).

## 21.9 Relationship to the Book

The book (chapters 1–20) and the specs serve different purposes:

| Aspect | Book Chapters | Specs |
|--------|--------------|-------|
| **Purpose** | Explain concepts, architecture, design rationale | Define exactly what to build |
| **Audience** | Humans learning the system | Agents + developers implementing |
| **Format** | Narrative prose with code examples | Structured template with Given-When-Then |
| **Granularity** | Topic-level (e.g., "Drag and Drop") | Feature-level (e.g., "Smart Alignment Guides") |
| **Testability** | Not directly testable | Every AC is testable |
| **Lifecycle** | Stable after writing | Updated during implementation |

The book provides the **why and how**. Specs provide the **what, exactly**.

Book chapters are referenced by specs via `book-refs` in the frontmatter, creating a bidirectional knowledge graph.

---

*This chapter defines the system. The next step is to populate `docs/specs/` with individual specs for each form builder feature, starting with the foundational components: Design Canvas, Document Model, and Control Palette.*
