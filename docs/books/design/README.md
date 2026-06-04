# The WYSIWYG Form Builder Book

A comprehensive guide to building a Visual Studio-style form designer with the jsgui3 ecosystem.

---

## Part I — Foundations

| Ch | Title | Description |
|----|-------|-------------|
| [1](ch01-introduction-and-vision.md) | **Introduction & Vision** | Why build a visual designer, the jsgui3 advantage, design philosophy |
| [2](ch02-architecture-overview.md) | **Architecture Overview** | Project structure, component tree, data flow, server/client split |
| [3](ch03-the-jsgui3-control-system.md) | **The jsgui3 Control System** | Control class, hierarchy, events, CSS, compose, activate, Data_Object |
| [4](ch04-control-mixins.md) | **Control Mixins** | Dragable, resizable, selectable, selection-box-host, and 12+ more |

## Part II — The Three Panels

| Ch | Title | Description |
|----|-------|-------------|
| [5](ch05-the-design-canvas.md) | **The Design Canvas** | Canvas modes, grid, snap guides, placing controls, zoom, keyboard shortcuts |
| [6](ch06-the-control-palette.md) | **The Control Palette** | Toolbox integration, registry-driven palette, drag-to-place, tool selection |
| [7](ch07-property-editing.md) | **Property Editing** | Property_Grid, value editor registry, schemas, live updates, inspector panel |

## Part III — Data & Interactions

| Ch | Title | Description |
|----|-------|-------------|
| [8](ch08-the-document-model.md) | **The Document Model** | Hierarchical tree, observable mutations, serialization, flat map |
| [9](ch09-drag-drop-select-resize.md) | **Drag, Drop, Select & Resize** | Mixin mechanics, multi-selection, event interception, interaction modes |

## Part IV — Runtime & Output

| Ch | Title | Description |
|----|-------|-------------|
| [10](ch10-form-rendering.md) | **Form Rendering** | Form_Container, adaptive layout, validation, Data_Object binding |
| [11](ch11-serialization-and-code-generation.md) | **Serialization & Code Generation** | .form.json format, save/load, code generation, templates |

## Part V — Infrastructure

| Ch | Title | Description |
|----|-------|-------------|
| [12](ch12-undo-redo.md) | **Undo/Redo** | Command Pattern, command implementations, coalescing, compound commands |
| [13](ch13-theming.md) | **Theming** | Token system, CSS variables, theme variants, designer vs form theming |
| [14](ch14-server-side-rendering.md) | **Server-Side Rendering** | Active_HTML_Document, hydration, CSS collection, form deployment |

## Part VI — Advanced Topics

| Ch | Title | Description |
|----|-------|-------------|
| [15](ch15-data-binding.md) | **Data Binding & MVVM** | Data_Object, binding modes, API sources, SSE, computed properties |
| [16](ch16-custom-controls.md) | **Building Custom Controls** | Control development, registry, design-time mode, plugins |
| [17](ch17-advanced-features-and-roadmap.md) | **Advanced Features & Roadmap** | Clipboard, alignment, tab order, multi-page, accessibility, roadmap |

## Part VII — Research-Informed Design

| Ch | Title | Description |
|----|-------|-------------|
| [18](ch18-industry-survey-form-builder-ux-patterns.md) | **Industry Survey: Form Builder UX Patterns** | Five archetypes (IDE, conversational, wizard, grid, minimal), feature matrix, design principles |
| [19](ch19-interaction-design-deep-dive.md) | **Interaction Design Deep Dive** | Drag-and-drop lifecycle, selection model, resize specs, inline editing, keyboard shortcuts, performance |
| [20](ch20-responsive-and-accessible-form-design.md) | **Responsive & Accessible Form Design** | Breakpoints, layout strategies, WCAG 2.1 AA, accessibility audit, validation UX, mobile, i18n |

## Part VIII — Specification System

| Ch | Title | Description |
|----|-------|-------------|
| [21](ch21-the-specification-system.md) | **The Specification System** | Spec format, YAML frontmatter, Given-When-Then ACs, template, dependency graphs, agent workflow |

> **Specs directory**: See [`docs/specs/`](../specs/README.md) for the individual implementable specifications.

## Part IX — Production Concerns

| Ch | Title | Description |
|----|-------|-------------|
| [22](ch22-clipboard-and-copy-paste.md) | **Clipboard & Copy-Paste** | Clipboard architecture, copy/cut/paste/duplicate, deep cloning, ID regeneration, positioning |
| [23](ch23-testing-the-designer.md) | **Testing the Designer** | Testing pyramid, unit/integration/visual/E2E tests, undo exhaustive testing, accessibility & perf |

## Part X — Getting Started

| Ch | Title | Description |
|----|-------|-------------|
| [24](ch24-tutorial-building-your-first-form.md) | **Tutorial: Building Your First Form** | Step-by-step walkthrough creating a contact form using every major subsystem |

## Appendices

| | Title | Description |
|---|-------|-------------|
| [A](appendix-a-glossary-and-quick-reference.md) | **Glossary & Quick Reference** | 40+ terms, keyboard shortcuts, control types, events, file format, CSS classes |
