# Form Builder Specifications

Structured, implementable specifications for the jsgui3-designer WYSIWYG form builder.

**Spec format**: See [Chapter 21 — The Specification System](../books/design/ch21-the-specification-system.md)

## Spec Index

| ID | Title | Status | Priority | Depends On | Complexity |
|----|-------|--------|----------|------------|------------|
| [SPEC-001](SPEC-001-design-canvas.md) | Design Canvas | draft | critical | — | L |
| SPEC-002 | Document Model | planned | critical | — | L |
| SPEC-003 | Control Palette & Toolbox | planned | critical | SPEC-001, SPEC-002 | M |
| SPEC-004 | Property Grid | planned | critical | SPEC-001, SPEC-002 | M |
| SPEC-005 | Drag and Drop | planned | critical | SPEC-001, SPEC-002, SPEC-003 | L |
| SPEC-006 | Selection Model | planned | high | SPEC-001, SPEC-002 | M |
| SPEC-007 | Resize Handles | planned | high | SPEC-001, SPEC-006 | M |
| SPEC-008 | Smart Alignment Guides | planned | high | SPEC-001, SPEC-005 | M |
| SPEC-009 | Inline Text Editing | planned | medium | SPEC-001, SPEC-006 | S |
| SPEC-010 | Undo / Redo | planned | critical | SPEC-002 | M |
| SPEC-011 | Form Serialization | planned | critical | SPEC-002 | M |
| SPEC-012 | Responsive Containers | planned | high | SPEC-001, SPEC-002 | L |
| SPEC-013 | Context Menus | planned | medium | SPEC-001, SPEC-006 | S |
| SPEC-014 | Keyboard Shortcuts | planned | high | SPEC-001, SPEC-006 | M |
| SPEC-015 | Theming & Design Tokens | planned | medium | SPEC-001 | M |
| SPEC-016 | Accessibility Audit Panel | planned | medium | SPEC-001, SPEC-002 | M |
| SPEC-017 | Form Preview & Export | planned | high | SPEC-002, SPEC-011 | M |
| SPEC-018 | Template Library | planned | medium | SPEC-011 | M |
| [SPEC-019](SPEC-019-professional-ux-semantic-layout-and-ai-export.md) | Professional UX, Semantic Layout, and AI-Ready Export | draft | critical | SPEC-001, SPEC-002, SPEC-004, SPEC-012, SPEC-015, SPEC-017, SPEC-018 | L |

## Dependency Graph

```
SPEC-002 Document Model ─────────────────────────────────┐
    │                                                     │
SPEC-001 Design Canvas ──────────────────────────────┐    │
    ├── SPEC-003 Control Palette ─────────────────┐  │    │
    │       └── SPEC-005 Drag and Drop ──────────┤  │    │
    │               └── SPEC-008 Alignment Guides │  │    │
    ├── SPEC-004 Property Grid                    │  │    │
    ├── SPEC-006 Selection Model ─────────────────┤  │    │
    │       ├── SPEC-007 Resize Handles           │  │    │
    │       ├── SPEC-009 Inline Edit              │  │    │
    │       └── SPEC-013 Context Menus            │  │    │
    ├── SPEC-010 Undo/Redo ◄──────────────────────┘  │    │
    ├── SPEC-011 Serialization                        │    │
    │       ├── SPEC-017 Preview & Export              │    │
    │       └── SPEC-018 Template Library              │    │
    ├── SPEC-012 Responsive Containers                 │    │
    ├── SPEC-014 Keyboard Shortcuts                    │    │
    ├── SPEC-015 Theming                               │    │
    └── SPEC-016 Accessibility Audit                   │    │
```

## Status Legend

| Status | Meaning |
|--------|---------|
| `planned` | Identified, not yet written |
| `draft` | Being written |
| `in-review` | Ready for human review |
| `approved` | Approved — ready to implement |
| `implementing` | Work in progress |
| `done` | Implemented and tested |
