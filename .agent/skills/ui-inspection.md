---
description: Autonomous visual verification of the designer UI
---

# UI Inspection (Designer Edition)

## Triggers
- UI verification, screenshots, layout metrics, visual testing

## Scope
Use this skill to verify the designer UI renders correctly after code changes.
Covers visual inspection, layout correctness, and interaction testing.

## Procedure

### 1. Start the Server
```bash
node server.js
# Wait for: "Server ready" + "Open http://localhost:52030 in your browser"
```

### 2. Visual Inspection (Browser Subagent)
Use the browser subagent tool to:
1. Navigate to `http://localhost:52030`
2. Wait 4 seconds for full load (SSR + activation)
3. Capture screenshot of initial state
4. Verify three-panel layout: Palette | Canvas | Inspector

### 3. Interaction Testing Checklist
- [ ] **Palette**: Click a control tool → should highlight, set mode to "Place"
- [ ] **Canvas placement**: Click canvas → should create WYSIWYG control
- [ ] **Selection**: Click existing control → blue selection border + resize handles
- [ ] **Drag**: Click+drag control → should move with grid snapping
- [ ] **Resize**: Drag resize handle → should resize the control
- [ ] **Inspector**: Selected control shows properties in right panel
- [ ] **Context menu**: Right-click → shows contextual options
- [ ] **Menu bar**: File/Edit menus open with correct options
- [ ] **Undo/Redo**: Ctrl+Z/Y or toolbar buttons work

### 4. Console Check
Always check the browser console for errors after testing.
Expected output: no errors. Warnings about `Missing context.map_Controls` are 
typically benign (see `jsgui3-ssr-data-bridge.md`).

### 5. Key Elements to Verify
| Element | CSS Selector | What to Check |
|---------|-------------|---------------|
| Palette | `.designer-palette` | All 20 controls listed |
| Canvas | `.design-surface` | White area, resize handle visible |
| Inspector | `.inspector-panel` | Title bar, controls dropdown |
| Menu bar | `.designer-menubar` | File + Edit visible |
| Status bar | `.designer-status` | Shows "Ready" or selection info |

## Evidence
Save screenshots to the artifacts directory for documentation.
