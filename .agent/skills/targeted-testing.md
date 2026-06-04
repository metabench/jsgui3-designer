---
description: Pick and run the smallest validation step for designer changes
---

# Targeted Testing (Designer Edition)

## Triggers
- run tests, validate changes, smoke test, verify build

## Procedure

### 0. Smoke Test (Always First)
The cheapest possible validation — does the module even load?
```bash
node -e "require('./client'); console.log('OK')"
```
This catches missing imports, syntax errors, and circular dependencies in <1 second.

### 1. Server Start Test
```bash
node server.js
# Success: "Server ready" message appears
# Failure: crash with error trace
```
This validates SSR rendering, bundling, and route setup — the full server pipeline.

### 2. Visual Verification
After server starts, use the browser subagent to:
1. Load `http://localhost:52030`
2. Check console for errors
3. Place a control and verify it renders

### 3. What to Test Based on What Changed

| Changed File | What to Test |
|-------------|-------------|
| `client.js` | Restart server → full visual check |
| `models/document_model.js` | Smoke test → add/remove/move controls |
| `models/command_history.js` | Undo/redo operations |
| `models/selection_model.js` | Selection and multi-select |
| `models/control_registry.js` | Palette rendering, default sizes |
| `controls/Design_Canvas.js` | Canvas rendering, grid |
| `controls/Inspector_Panel.js` | Property editing |
| `server.js` | Server restart only |

### 4. Validation Ladder
```
Smoke test (< 1s)
  → Server start (< 15s)
    → Browser visual check (~30s)
      → Full interaction test (~2min)
```

## Anti-Patterns
- **Running all tests when you only changed CSS** — Just restart and look
- **Skipping smoke test** — A 1-second smoke test catches 80% of import errors
- **Not restarting the server** — Changes to `client.js` require a server restart
