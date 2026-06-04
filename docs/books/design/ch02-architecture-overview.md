# Chapter 2 — Architecture Overview

## The Big Picture

jsgui3-designer is a three-layer application: a **server layer** that serves the designer UI, a **client layer** that runs the interactive designer in the browser, and a **document layer** that models the form being designed. These layers map directly onto the three packages in the dependency list:

| Layer | Package | Role |
|-------|---------|------|
| Server | `jsgui3-server` | Serves the designer page, handles file I/O, publishes API endpoints |
| Client | `jsgui3-client` | Hydrates the server-rendered page, manages client-side state, communicates with the server |
| Document / Controls | `jsgui3-html` | Provides the control system, mixins, themes, and the entire control library |

There is also `lang-tools`, which provides foundational utilities — `Data_Object` for observable models, functional programming helpers, and type-checking utilities. It underpins the MVVM architecture that connects the document model to the designer's UI.

## Project Structure

```
jsgui3-designer/
├── index.js                    ← Package entry point
├── package.json                ← Dependencies: jsgui3-html, jsgui3-client, jsgui3-server, lang-tools
├── docs/
│   └── book/                   ← This book
├── server.js                   ← Designer server application
├── client.js                   ← Client-side activation and orchestration
├── controls/
│   ├── Design_Canvas.js        ← The central design surface
│   ├── Design_Surface_Item.js  ← Wrapper for controls on the canvas
│   ├── Control_Palette.js      ← Left panel — field/control palette
│   ├── Inspector_Panel.js      ← Right panel — property inspector
│   ├── Document_Outline.js     ← Hierarchical control tree view
│   └── Designer_Toolbar.js     ← Top action bar
├── models/
│   ├── document_model.js       ← The form's hierarchical data model
│   ├── control_registry.js     ← Maps control types to schemas and metadata
│   └── command_history.js      ← Undo/redo command stack
├── commands/
│   ├── add_control.js          ← Add a control to the canvas
│   ├── move_control.js         ← Move a control's position
│   ├── resize_control.js       ← Resize a control
│   ├── delete_control.js       ← Remove a control
│   └── change_property.js      ← Change a control's property value
├── serialization/
│   ├── form_schema.js          ← JSON schema for form definitions
│   └── code_generator.js       ← Generates jsgui3 code from a design
└── themes/
    └── designer.css            ← Designer-specific styling
```

This structure mirrors the separation of concerns that runs through the entire jsgui3 ecosystem: controls are independent and composable, models are observable and serialisable, and the server/client boundary is crossed transparently.

## Component Architecture

The designer's UI is itself a jsgui3 application. Here is the component tree at the top level:

```
Designer_App (Active_HTML_Document)
└── Designer_Shell
    ├── Designer_Toolbar
    │   ├── File actions (New, Open, Save, Save As)
    │   ├── Edit actions (Undo, Redo, Cut, Copy, Paste, Delete)
    │   ├── View actions (Zoom, Grid, Snap, Rulers)
    │   └── Mode toggle (Design / Preview / Code)
    ├── Split_Pane (horizontal)
    │   ├── Control_Palette (left, ~200px)
    │   │   └── Toolbox
    │   │       ├── Group: Common Controls
    │   │       ├── Group: Input Controls
    │   │       ├── Group: Layout Containers
    │   │       └── Group: Data Controls
    │   ├── Split_Pane (vertical, centre)
    │   │   ├── Design_Canvas (main area)
    │   │   │   └── Design_Surface_Item (one per placed control)
    │   │   │       └── [actual jsgui3-html control instance]
    │   │   └── Document_Outline (optional bottom panel)
    │   │       └── Tree
    │   └── Inspector_Panel (right, ~280px)
    │       └── Tabbed_Panel
    │           ├── Tab: Properties
    │           │   └── Property_Grid
    │           ├── Tab: Layout
    │           │   └── [alignment/sizing tools]
    │           └── Tab: Events
    │               └── [event binding UI]
    └── Status_Bar
        ├── Selected control info
        ├── Position / size readout
        └── Zoom level
```

Every named component in this tree is either an existing `jsgui3-html` control or a new control that we build in this project. The `Split_Pane`, `Toolbox`, `Toolbar`, `Tabbed_Panel`, `Tree`, `Status_Bar`, and `Property_Grid` are all production-ready controls from the library. The `Design_Canvas`, `Design_Surface_Item`, `Control_Palette`, `Inspector_Panel`, `Document_Outline`, and `Designer_Toolbar` are new controls specific to the designer.

## Data Flow

The designer's data flows through three interconnected models:

### 1. The Document Model

The document model is the canonical representation of the form being designed. It is a tree of nodes, each with:

- A **control type** (e.g. `Text_Input`, `Panel`, `Form_Container`)
- A **unique identifier**
- A **properties object** (label, placeholder, required, width, height, position, etc.)
- An ordered list of **children** (for container controls)

The document model is observable. When a property changes — whether because the user dragged a control, typed into the property grid, or executed an undo command — the model emits change events. The canvas and the property grid both listen to these events and update themselves accordingly.

### 2. The Selection Model

The selection model tracks which controls are currently selected. It is a simple observable set of node IDs. When the selection changes:

- The canvas updates selection highlights and resize handles.
- The property grid loads the selected control's schema and current values.
- The document outline highlights the corresponding tree node.
- The toolbar enables or disables context-sensitive actions (Cut, Copy, Delete, Align).

### 3. The Command History

Every mutation to the document model goes through a command object. Commands implement an `execute()` and `undo()` interface. The command history maintains two stacks — undo and redo — enabling full history navigation.

This is the standard Command Pattern, and it integrates naturally with the document model's observable properties: `execute()` modifies the model (which triggers UI updates), and `undo()` restores the previous state (which triggers the reverse UI updates).

```
User Action
    ↓
Command.execute()
    ↓
Document Model mutation
    ↓
Change event emitted
    ↓
┌───────────────┬─────────────────┬──────────────────┐
│ Canvas update │ Property_Grid   │ Document_Outline  │
│ (reposition,  │ update (show    │ update (reflect   │
│  resize,      │ new values)     │ tree changes)     │
│  recompose)   │                 │                   │
└───────────────┴─────────────────┴──────────────────┘
```

## Server-Client Architecture

### Server Role

The `jsgui3-server` package provides an HTTP server built on Node.js. For the designer, the server:

1. **Serves the designer page.** Using `Active_HTML_Document`, it renders the complete designer UI on the server as HTML and sends it to the browser. This includes all control CSS (each control has a static `css` property that the server collects and inlines).

2. **Handles form files.** Open, save, and management of `.form.json` files. The server reads and writes these files to disk.

3. **Publishes control metadata.** The control registry — which control types are available, what their property schemas look like, what icons they use — can be published as a JSON endpoint so the client palette stays in sync with available controls.

### Client Role

The `jsgui3-client` package provides the client-side runtime:

1. **Hydrates the page.** The server-rendered HTML is activated: event listeners are attached, the DOM is walked, and server-rendered controls become live, interactive controls. This is handled by `page-context.js` and the control system's `activate()` lifecycle method.

2. **Runs the designer.** All interactive behaviour — drag and drop, selection, property editing, undo/redo — runs entirely on the client. The designer does not round-trip to the server for each interaction.

3. **Communicates via resources.** When the user saves a form, the client sends the serialised document model to the server via `Data_Get_Post_Delete_HTTP_Resource` from `jsgui3-client`. This resource class handles HTTP verbs (GET, POST, DELETE) with a clean API.

### The Isomorphic Boundary

The key architectural insight of jsgui3 is that the same `Control` class runs on both server and client. The `Text_Input` constructor works identically in Node.js and in the browser. On the server, it builds a virtual DOM tree (plain JavaScript objects representing elements, attributes, and children). On the client, it wraps actual DOM elements.

For the designer, this means:

- The initial page load is fast (server-rendered HTML).
- The designer's controls (toolbar, palette, property grid) hydrate seamlessly.
- The designed form's controls are real `jsgui3-html` controls, not simulation or mockups.

## The Control Lifecycle

Understanding the control lifecycle is essential for the designer, because the designer manipulates controls that are in different lifecycle states:

1. **Construction** (`new Control(spec)`) — The control is created with a specification object. The virtual DOM tree is built. CSS classes are added. Child controls are composed. This happens on both server and client.

2. **Rendering** (`control.htmlify()`) — The virtual DOM tree is serialised to an HTML string. This happens only on the server, during the initial page render.

3. **Hydration** (`control.activate()`) — The control's virtual DOM is connected to the real DOM. Event listeners are attached. This happens only on the client, during page initialisation.

4. **Interaction** — The control responds to user events. Properties change. The DOM is updated. This is the steady-state on the client.

In the designer, controls on the canvas are in a special state: they are fully constructed and hydrated, but they also have design-time behaviours (drag handles, resize grips) applied via mixins. When the user switches to Preview mode, those design-time behaviours are removed, and the controls are in their normal runtime state.

## Technology Dependencies Recap

| Dependency | Version | What It Provides |
|-----------|---------|-----------------|
| `jsgui3-html` | `^0.0.187` | Controls, mixins, themes, html-core, Property_Grid, Form_Container, Toolbox, Toolbar, Window, etc. |
| `jsgui3-client` | `^0.0.129` | Client runtime, HTTP resources, SSE, page context, hydration |
| `jsgui3-server` | `^0.0.152` | HTTP server, static file serving, Active_HTML_Document, publishers |
| `lang-tools` | `^0.0.45` | Data_Object (observable models), type utilities, transforms |

All four packages are already listed in `package.json`. The foundation is laid. What remains is to build the designer-specific components on top of it — and that is what the remaining chapters of this book address.
