# Chapter 1 — Introduction & Vision

## What Is jsgui3-designer?

jsgui3-designer is a WYSIWYG form builder and UI designer for the jsgui3 ecosystem. If you have ever used Visual Studio's Windows Forms designer, Delphi's form editor, or Interface Builder for macOS and iOS, then you already understand the core idea: you drag controls onto a canvas, arrange them visually, set their properties, and the tool generates the code or data representation that your application needs at runtime.

The difference is that jsgui3-designer targets the web. The forms and interfaces you build run inside a browser, rendered by jsgui3-html's isomorphic control system. The same component tree that the designer manipulates at design time is the same component tree that the server renders into HTML and the client hydrates into a live, interactive page.

This means there is no translation step between "what you see in the designer" and "what the user sees in production." The designer is not painting a picture of a user interface — it *is* the user interface, but paused at a moment in time, waiting for you to sculpt it.

## Why Build a Visual Designer?

Programmatic UI construction is powerful. The jsgui3-html control system lets you compose deeply nested, themeable, responsive interfaces entirely in JavaScript. But there are tasks where code is the wrong level of abstraction:

**Layout is spatial, not textual.** When you are deciding whether a label should sit to the left of a text field or above it, whether a panel should span two columns or three, whether a group of radio buttons should live inside an accordion or a tab — these are spatial decisions. They belong on a canvas, not in a text editor.

**Iteration speed matters.** Changing a margin from 8 pixels to 12 pixels, previewing it, changing it to 10, previewing again — this cycle takes seconds in a visual tool and minutes in a code-edit-refresh loop. Multiply by hundreds of properties across dozens of controls, and the time savings become enormous.

**Non-programmers need access.** Business analysts, designers, content editors — many people who understand what a form should look like and how it should behave do not write JavaScript. A visual designer gives them a seat at the table.

**Forms are the bread and butter of business software.** Every business application is, at some level, a machine for collecting, displaying, and transforming data. Forms are the interface between humans and that data. A tool that makes form creation fast and reliable pays dividends across every project in the ecosystem.

## The jsgui3 Advantage

Building a visual designer from scratch is a multi-year, multi-team effort. But we are not starting from scratch. The jsgui3 ecosystem provides an extraordinary foundation:

### A Complete Control Library

The `jsgui3-html` package contains over ninety production controls, organised into a clear hierarchy:

- **Native inputs** — `Text_Input`, `Checkbox`, `Select_Options`, `Date_Picker`, `Radio_Button`, `File_Upload`, `Number_Input`, `Range_Input`, `Textarea`, and more. These are the atomic building blocks of any form.

- **Compositional controls** — `Combo_Box`, `Color_Picker`, `Toggle_Switch`, `Rating_Stars`, `Time_Picker`, `Datetime_Picker`, `Number_Stepper`, `Item_Selector`. Higher-level controls composed from the native ones.

- **Layout containers** — `Panel`, `Split_Pane`, `Tabbed_Panel`, `Accordion`, `Window`, `Window_Manager`, `Modal`, `Drawer`, `Group_Box`, `Stack`, `Grid_Gap`, `Center`. These define the spatial structure of a page.

- **Editor controls** — `Form_Container`, `Form_Designer`, `Property_Editor`, `Property_Grid`, `Code_Editor`, `Rich_Text_Editor`. These are controls specifically designed for editing and inspecting data.

- **Data controls** — `Data_Table`, `Data_Grid`, `Data_Filter`, `Virtual_Grid`, `Virtual_List`, `Tree_Table`, `Key_Value_Table`. For displaying and interacting with datasets.

- **UI chrome** — `Toolbar`, `Toolbox`, `Tree`, `Status_Bar`, `Breadcrumbs`, `Command_Palette`, `Context_Menu`, `Toast`, `Tooltip`. The supporting cast of a professional desktop-class UI.

### A Mixin System Built for Design

The `control_mixins` directory contains the exact behaviours that a visual designer needs to apply to controls at design time:

- `dragable` — Makes any control draggable with mousedown/mousemove/mouseup handling, constraints, and grid snapping.
- `resizable` — Adds resize handles with minimum and maximum size constraints.
- `selectable` — Tracks selection state as a reactive property, applies CSS classes, handles click-to-select.
- `selection-box-host` — Implements rubber-band (marquee) selection for multi-selecting controls.
- `selected-resizable` and `selected-deletable` — Combine selection with resize and delete behaviours.

These mixins are composable. A control on the designer canvas can be simultaneously `dragable`, `resizable`, and `selectable`. This is not hypothetical — the mixins were designed for exactly this kind of composition.

### Isomorphic Rendering

jsgui3-html controls render on the server into static HTML and hydrate on the client into interactive controls. This is central to the designer's architecture: the form you design can be rendered on the server for SEO, initial page load performance, and progressive enhancement, then activated on the client for full interactivity.

### Property Grid with Value Editor Registry

The `Property_Grid` control is a Visual Studio-style two-column property inspector. It uses a `value_editor_registry` that maps data types (text, number, boolean, color, date, enum) to specialised inline editors. When you select a control on the designer canvas, the Property Grid shows that control's designable properties, each with the correct editor for its type.

This infrastructure already exists and works. We do not need to build a property editor from scratch.

### A Working Prototype

In `jsgui3-html/dev-examples/wysiwyg-form-builder/`, there is a functional prototype of a form builder. It has a three-panel layout (palette on the left, canvas in the centre, property editor on the right), a toolbar, click-to-add field creation, property editing, preview mode, and JSON import/export. This prototype was built as a demonstration; the jsgui3-designer project is where it will mature into a production tool.

## Design Philosophy

### The Form Is the Source of Truth

In many form-builder tools, the visual editor produces a JSON blob that is then interpreted at runtime by a separate rendering engine. The form definition and the rendered form are different things maintained by different code.

In jsgui3-designer, the form definition *is* the control tree. The designer manipulates real `jsgui3-html` controls — the same `Text_Input`, `Panel`, `Form_Container` that the end user will interact with. The serialised form definition is a snapshot of this control tree. The runtime rendering is a reconstruction of this same tree.

This "single representation" approach eliminates an entire class of bugs where the designer shows one thing and the runtime shows another.

### Design Time Is Just Another Mode

A `Text_Input` on the designer canvas is a real `Text_Input`. It simply has additional behaviours applied — drag handles, resize grips, selection highlighting — that are not present at runtime. These behaviours are added via mixins, not by wrapping the control in a different class.

This means that what you see at design time is exactly what the user sees at runtime, minus the design chrome. The control's styling, its theme response, its layout behaviour — all are authentic.

### Composable, Not Monolithic

The designer is not a single monolithic application. It is composed from the same building blocks it manages: `Toolbox` for the palette, `Property_Grid` for property editing, `Tree` for the document outline, `Toolbar` for actions, `Split_Pane` for the panel layout, `Window` for floating tool panels.

This recursive composition — a tool built from the tool's own materials — is both philosophically satisfying and practically powerful. Every improvement to the control library improves the designer itself.

## What This Book Covers

This book walks through the complete architecture and implementation of jsgui3-designer, from the foundational control system to advanced features like data binding and code generation.

- **Chapters 2–4** cover the foundational technologies: the architecture, the control system, and the mixin system.
- **Chapters 5–7** cover the three main panels of the designer: the canvas, the palette, and the property editor.
- **Chapters 8–9** cover the document model and the drag/drop/select/resize interactions.
- **Chapters 10–11** cover runtime form rendering and serialisation.
- **Chapters 12–14** cover undo/redo, theming, and server-side rendering.
- **Chapters 15–17** cover data binding, extensibility, and the feature roadmap.
- **Chapters 18–20** draw on deep research into professional form builders — an industry survey, interaction design specification, and responsive/accessible design guidance.
- **Chapter 21** defines the specification system for writing implementable specs.
- **Chapters 22–23** cover production concerns: clipboard operations and the testing strategy.
- **Chapter 24** is a hands-on tutorial that walks through building a complete form.
- **Appendix A** provides a glossary, keyboard shortcuts, and quick API reference.

Each chapter references specific files, classes, and APIs in the jsgui3 ecosystem. Code examples use the actual control constructors, mixin functions, and class hierarchies that exist in the `jsgui3-html`, `jsgui3-client`, and `jsgui3-server` packages. This is not a theoretical design document — it is a practical guide to building and extending a real tool from real components.

Let us begin.
