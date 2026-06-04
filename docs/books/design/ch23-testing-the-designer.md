# Chapter 23 — Testing the Designer

> *How to test a WYSIWYG form builder — from unit tests for coordinate math to visual regression tests for the design canvas, and end-to-end tests for complete user workflows.*

## 23.1 The Testing Challenge

Testing a visual designer is harder than testing a typical web application because:

1. **Spatial correctness matters** — a control at (100, 100) vs (101, 99) could indicate a snapping bug.
2. **Interactions are multi-step** — a drag-and-drop involves mousedown, multiple mousemoves, and mouseup.
3. **Visual feedback is critical** — selection outlines, resize handles, and alignment guides must look right.
4. **Undo/redo creates temporal complexity** — state must be perfectly reversible.
5. **Many subsystems interact** — canvas, property grid, document model, selection, and command history all respond to a single user action.

This chapter defines a layered testing strategy: unit → integration → visual → end-to-end.

## 23.2 Testing Pyramid

```
              ╱  ╲
             ╱ E2E ╲         Few:    10–20 critical user journeys
            ╱────────╲
           ╱  Visual   ╲      Some:  30–50 visual snapshot tests
          ╱──────────────╲
         ╱  Integration   ╲    Many:  100+ interaction tests
        ╱──────────────────╲
       ╱     Unit Tests     ╲   Most: 300+ pure logic tests
      ╱──────────────────────╲
```

## 23.3 Unit Tests

Unit tests cover pure logic with no DOM:

### Coordinate Math

```javascript
describe('Design_Canvas coordinate conversion', () => {
    it('screen_to_canvas at 100% zoom returns same coordinates', () => {
        const canvas = create_canvas({ zoom: 1.0 });
        expect(canvas.screen_to_canvas(200, 150)).toEqual({ x: 200, y: 150 });
    });

    it('screen_to_canvas at 200% zoom halves coordinates', () => {
        const canvas = create_canvas({ zoom: 2.0 });
        expect(canvas.screen_to_canvas(400, 300)).toEqual({ x: 200, y: 150 });
    });

    it('snap_to_grid rounds to nearest grid point', () => {
        const canvas = create_canvas({ grid_size: 8 });
        expect(canvas.snap_to_grid(13, 21)).toEqual({ x: 16, y: 24 });
        expect(canvas.snap_to_grid(4, 4)).toEqual({ x: 0, y: 0 });
        expect(canvas.snap_to_grid(12, 12)).toEqual({ x: 16, y: 16 });
    });
});
```

### Document Model

```javascript
describe('Document_Model', () => {
    it('add_node creates a node with correct parent', () => {
        const model = new Document_Model();
        const root = model.root;
        const child = model.add_node(root.id, 'text_input', { name: 'txtName' });

        expect(child.parent_id).toBe(root.id);
        expect(root.children).toContain(child);
    });

    it('remove_node removes from parent and flat map', () => {
        const model = new Document_Model();
        const child = model.add_node(model.root.id, 'text_input', {});
        model.remove_node(child.id);

        expect(model.root.children).not.toContain(child);
        expect(model.get_node(child.id)).toBeUndefined();
    });

    it('serialize/deserialize round-trips perfectly', () => {
        const model = build_complex_form_model(); // helper
        const json = model.serialize();
        const restored = Document_Model.from_json(json);

        expect(restored.serialize()).toEqual(json);
    });
});
```

### Selection Model

```javascript
describe('Selection_Model', () => {
    it('select_exclusive clears previous and selects one', () => {
        const sel = new Selection_Model();
        sel.select_exclusive('a');
        sel.select_exclusive('b');
        expect(sel.get_selected()).toEqual(['b']);
    });

    it('toggle adds if not selected, removes if selected', () => {
        const sel = new Selection_Model();
        sel.toggle('a');
        expect(sel.is_selected('a')).toBe(true);
        sel.toggle('a');
        expect(sel.is_selected('a')).toBe(false);
    });
});
```

### Command History (Undo/Redo)

```javascript
describe('Command_History', () => {
    it('execute runs command and pushes to undo stack', () => {
        const history = new Command_History();
        const cmd = new MockCommand();
        history.execute(cmd);

        expect(cmd.executed).toBe(true);
        expect(history.can_undo()).toBe(true);
    });

    it('undo reverses the last command', () => {
        const history = new Command_History();
        const cmd = new ChangePropertyCommand(model, 'node1', 'x', 100, 50);
        history.execute(cmd);
        history.undo();

        expect(model.get_node('node1').properties.x).toBe(50);
    });

    it('redo after undo re-applies', () => {
        const history = new Command_History();
        const cmd = new ChangePropertyCommand(model, 'node1', 'x', 100, 50);
        history.execute(cmd);
        history.undo();
        history.redo();

        expect(model.get_node('node1').properties.x).toBe(100);
    });
});
```

### Clipboard Manager

```javascript
describe('Clipboard_Manager', () => {
    it('clone_with_new_ids generates unique IDs', () => {
        const original = { id: 'n1', properties: { x: 10, y: 20 }, children: [
            { id: 'n2', properties: { x: 30, y: 40 }, children: [] }
        ]};

        const cloned = clipboard._clone_with_new_ids(original, { dx: 16, dy: 16 });

        expect(cloned.id).not.toBe('n1');
        expect(cloned.children[0].id).not.toBe('n2');
        expect(cloned.properties.x).toBe(26);
        expect(cloned.children[0].properties.x).toBe(46);
    });
});
```

## 23.4 Integration Tests

Integration tests exercise multiple subsystems together. They run in a browser-like environment (jsdom or Playwright):

### Drag-and-Drop

```javascript
describe('Drag and Drop integration', () => {
    it('dragging a control updates document model position', async () => {
        const { canvas, model } = setup_designer_with_one_control();
        const control = canvas.get_surface_items()[0];

        // Simulate drag
        await simulate.mousedown(control, { clientX: 100, clientY: 100 });
        await simulate.mousemove(document, { clientX: 150, clientY: 130 });
        await simulate.mouseup(document, { clientX: 150, clientY: 130 });

        const node = model.get_node(control.node_id);
        expect(node.properties.x).toBe(/* original_x + 50 */);
        expect(node.properties.y).toBe(/* original_y + 30 */);
    });

    it('dragging creates an undoable move command', async () => {
        const { canvas, history } = setup_designer_with_one_control();
        const control = canvas.get_surface_items()[0];
        const original_x = control.x;

        await simulate.drag(control, { dx: 50, dy: 30 });

        expect(history.can_undo()).toBe(true);

        history.undo();
        expect(control.x).toBe(original_x);
    });
});
```

### Property Grid ↔ Canvas Sync

```javascript
describe('Property Grid synchronization', () => {
    it('changing x in property grid moves control on canvas', () => {
        const { canvas, property_grid, model } = setup_full_designer();

        // Select a control
        canvas.select_control('node_001');

        // Change x property
        property_grid.set_value('x', 200);

        const item = canvas.get_surface_item('node_001');
        expect(item.style.left).toBe('200px');
    });

    it('dragging control updates property grid values', async () => {
        const { canvas, property_grid } = setup_full_designer();
        canvas.select_control('node_001');

        await simulate.drag(canvas.get_surface_item('node_001'), { dx: 50, dy: 0 });

        expect(property_grid.get_value('x')).toBe(/* original + 50 */);
    });
});
```

## 23.5 Visual Regression Tests

Visual tests guard against unintended visual changes. They compare screenshots of the designer at known states:

### Snapshot Strategy

```javascript
describe('Visual snapshots', () => {
    it('empty canvas matches baseline', async () => {
        const page = await launch_designer();
        await expect(page).toMatchSnapshot('empty-canvas');
    });

    it('canvas with 3 controls matches baseline', async () => {
        const page = await launch_designer();
        await page.load_form('test-fixtures/three-controls.form.json');
        await expect(page).toMatchSnapshot('three-controls');
    });

    it('selected control shows blue outline and handles', async () => {
        const page = await launch_designer();
        await page.load_form('test-fixtures/single-button.form.json');
        await page.click('[data-node-id="node_001"]');
        await expect(page).toMatchSnapshot('selected-control');
    });

    it('alignment guide appears during drag', async () => {
        const page = await launch_designer();
        await page.load_form('test-fixtures/two-controls.form.json');
        // Drag second control until its left edge aligns with first
        await simulate.drag_to_alignment(page, 'node_002', 'node_001', 'left');
        await expect(page).toMatchSnapshot('alignment-guide');
    });
});
```

### Recommended Tools

| Tool | Use Case |
|------|----------|
| **Playwright** | End-to-end visual testing with screenshot comparison |
| **jest-image-snapshot** | Pixel-level snapshot comparison in Node |
| **Chromatic** | Storybook-based visual regression (if using Storybook for components) |
| **Percy** | Cloud-based cross-browser visual testing |

## 23.6 End-to-End Tests

E2E tests simulate complete user journeys:

```javascript
describe('E2E: Build a contact form', () => {
    it('creates a complete form from scratch', async () => {
        const page = await launch_designer();

        // 1. Add a text input from the palette
        await page.click('[data-palette-item="text_input"]');
        await page.click('.design-canvas-surface', { position: { x: 100, y: 50 } });

        // 2. Set its properties
        await page.fill('[data-property="name"]', 'txtName');
        await page.fill('[data-property="label"]', 'Full Name');

        // 3. Add an email input
        await page.click('[data-palette-item="text_input"]');
        await page.click('.design-canvas-surface', { position: { x: 100, y: 100 } });
        await page.fill('[data-property="name"]', 'txtEmail');
        await page.fill('[data-property="label"]', 'Email');

        // 4. Add a submit button
        await page.click('[data-palette-item="button"]');
        await page.click('.design-canvas-surface', { position: { x: 100, y: 160 } });
        await page.fill('[data-property="label"]', 'Submit');

        // 5. Save the form
        await page.click('[data-action="save"]');

        // 6. Verify the saved JSON
        const json = await page.evaluate(() =>
            document.querySelector('.design-canvas').__component.document_model.serialize()
        );
        expect(json.root.children).toHaveLength(3);
        expect(json.root.children[0].properties.name).toBe('txtName');

        // 7. Switch to preview mode
        await page.click('[data-action="preview"]');
        const preview_input = page.locator('input[name="txtName"]');
        await expect(preview_input).toBeVisible();
        await expect(preview_input).toBeEditable();
    });
});
```

## 23.7 Testing Undo/Redo Exhaustively

Undo/redo bugs are the most insidious in a visual editor. Every mutation must round-trip:

```javascript
const MUTATION_TESTS = [
    { name: 'Add control',    before: () => ..., action: () => ..., verify_done: () => ..., verify_undone: () => ... },
    { name: 'Delete control',  ... },
    { name: 'Move control',    ... },
    { name: 'Resize control',  ... },
    { name: 'Change property', ... },
    { name: 'Paste controls',  ... },
    { name: 'Duplicate',       ... },
    { name: 'Cut controls',    ... },
    { name: 'Reparent',        ... },
];

for (const test of MUTATION_TESTS) {
    describe(`Undo/Redo: ${test.name}`, () => {
        it('action produces expected state', () => {
            test.before();
            test.action();
            test.verify_done();
        });

        it('undo reverses to exact previous state', () => {
            test.before();
            const snapshot_before = model.serialize();
            test.action();
            history.undo();
            expect(model.serialize()).toEqual(snapshot_before);
        });

        it('redo after undo restores action state', () => {
            test.before();
            test.action();
            const snapshot_after = model.serialize();
            history.undo();
            history.redo();
            expect(model.serialize()).toEqual(snapshot_after);
        });
    });
}
```

## 23.8 Test Fixtures

Maintain a set of `.form.json` fixture files for consistent testing:

```
test/
  fixtures/
    empty-form.form.json          ← No controls
    single-control.form.json      ← One text input
    three-controls.form.json      ← Three form fields
    nested-containers.form.json   ← Panels with children
    complex-form.form.json        ← 20+ controls, multiple containers
    validation-form.form.json     ← Form with validation rules
```

## 23.9 Accessibility Testing

Automated accessibility tests using `@axe-core/playwright`:

```javascript
describe('Accessibility', () => {
    it('empty designer has no accessibility violations', async () => {
        const page = await launch_designer();
        const results = await new AxeBuilder(page).analyze();
        expect(results.violations).toEqual([]);
    });

    it('form preview has no accessibility violations', async () => {
        const page = await launch_designer();
        await page.load_form('test-fixtures/complex-form.form.json');
        await page.click('[data-action="preview"]');
        const results = await new AxeBuilder(page).analyze();
        expect(results.violations).toEqual([]);
    });
});
```

## 23.10 Performance Testing

Track key performance benchmarks:

| Metric | Target | How to Measure |
|--------|--------|---------------|
| Form load (10 controls) | <100ms | `performance.measure()` around `load_form()` |
| Form load (50 controls) | <300ms | Same |
| Drag frame rate | ≥50fps | `requestAnimationFrame` counting during drag simulation |
| Undo latency | <50ms | Time `history.undo()` call |
| Property grid update | <30ms | Time from `set_value()` to canvas re-render |

```javascript
it('loads 50-control form in under 300ms', async () => {
    const start = performance.now();
    await designer.load_form('test-fixtures/large-form-50.form.json');
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(300);
});
```

---

*Testing is not optional for a tool that people will trust to build production forms. A comprehensive test suite is the foundation of reliability.*
