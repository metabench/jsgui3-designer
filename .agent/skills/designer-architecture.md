---
description: Architecture overview and key patterns for the jsgui3-designer codebase
---

# Designer Architecture Guide

## Triggers
- How does the designer work? Architecture overview, file structure, control registry

## Architecture

```
server.js              — HTTP server (jsgui3-server), serves SSR page
client.js              — Designer_App control (constructor + activate + CSS)
models/
  document_model.js    — Tree of nodes (the form being designed)
  selection_model.js   — Currently selected nodes
  command_history.js   — Undo/redo stack (Command pattern)
  control_registry.js  — Registry of available control types + metadata
controls/
  Design_Canvas.js     — Canvas area (SSR wrapper)
  Inspector_Panel.js   — Property editor (SSR wrapper)
  Design_Surface_Item.js — Individual control on the canvas
```

## The Two-Phase Pattern

### Phase 1: Constructor (Server-Side Rendering)
The `Designer_App` constructor builds the HTML structure using jsgui3 controls.
This runs on the server and produces the initial HTML sent to the browser.

### Phase 2: `activate()` (Client-Side)
After the browser loads, `activate()` fires and sets up all interactivity:
- Re-creates models (they don't survive SSR serialization)
- Queries the DOM for key elements
- Wires event listeners (palette, canvas, keyboard, menus)
- Creates dynamic UI (controls list, inspector title bar, resize handles)

**Rule**: All interactivity goes in `activate()`, never in the constructor.

## Document Model
The form being designed is a tree of nodes:
```
root (form_container)
  ├─ button_0  { x:100, y:50, width:120, height:36 }
  ├─ text_input_0  { x:100, y:100, width:200, height:32 }
  └─ panel_0  { x:100, y:150, width:300, height:200 }
```

Each node has: `id`, `control_type`, `properties`, `children`, `parent_id`.

## Control Registry
Defines the 20 available control types with:
- `id`, `label`, `icon` — For the palette
- `default_size` — Initial width/height when placed
- `is_container` — Whether it can have children
- `resizable` — Whether resize handles appear
- `property_schema` — Fields shown in the inspector

## Command Pattern
All mutations go through commands for undo/redo:
- `AddControlCommand`, `DeleteControlCommand`
- `MoveControlCommand`, `ResizeControlCommand`
- `ChangePropertyCommand`

## Control Naming
Per-type sequential counters: `button_0`, `button_1`, `panel_0`, etc.
Managed by `_type_counters` in Designer_App, reset on "File → New".

## WYSIWYG Rendering
`_create_wysiwyg_element(control_type, props, entry)` generates actual HTML
elements (inputs, buttons, checkboxes, grids) for the canvas preview.

## CSS
All CSS is defined in `Designer_App.css` (static property on the class).
Uses vanilla CSS with no framework. Key class prefixes:
- `.designer-*` — Top-level layout
- `.palette-*` — Left palette
- `.design-*` — Canvas and surface items
- `.inspector-*` — Right panel
- `.ctx-*` — Context menus
- `.menu-*` — Menu bar
- `.wysiwyg-ctrl` / `.wys-*` — WYSIWYG control previews
