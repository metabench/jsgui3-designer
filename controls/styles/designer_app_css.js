'use strict';

module.exports = `
.designer-app { display:flex; flex-direction:column; height:100vh; font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,sans-serif; color:#333; background:#f0f1f3; overflow:hidden; }

/* Menu Bar */
.designer-menubar { display:flex; height:24px; align-items:center; background:#e8eaed; border-bottom:1px solid #ccc; padding:0 4px; flex-shrink:0; user-select:none; }
.menu-item { padding:2px 10px; font-size:12px; cursor:pointer; border-radius:2px; position:relative; }
.menu-item:hover, .menu-item.open { background:#d0d4db; }
.menu-dropdown { position:fixed; background:#fff; border:1px solid #bbb; border-radius:4px; box-shadow:0 4px 12px rgba(0,0,0,.18); min-width:180px; z-index:9999; padding:4px 0; }
.menu-option { display:flex; justify-content:space-between; align-items:center; padding:5px 20px; font-size:12px; cursor:pointer; }
.menu-option:hover { background:#e8f0fe; }
.menu-shortcut { font-size:11px; color:#888; margin-left:24px; }
.menu-separator { height:1px; background:#ddd; margin:4px 0; }

/* Header */
.designer-header { display:flex; align-items:center; justify-content:space-between; height:36px; padding:0 16px; background:#1e293b; color:#e2e8f0; flex-shrink:0; }
.designer-header-title { font-size:14px; font-weight:700; letter-spacing:-0.01em; }
.designer-header-toolbar { display:flex; gap:4px; }
.header-btn { font-size:11px; font-family:inherit; background:rgba(255,255,255,.08); color:#e2e8f0; border:1px solid rgba(255,255,255,.1); border-radius:4px; padding:3px 10px; cursor:pointer; transition:background .12s; }
.header-btn:hover:not(:disabled) { background:rgba(255,255,255,.16); }
.header-btn:disabled { opacity:.35; cursor:default; }

/* Body */
.designer-body { display:flex; flex:1; overflow:hidden; }

/* Palette */
.designer-palette { width:200px; min-width:200px; background:#fff; border-right:1px solid #dee2e6; overflow-y:auto; display:flex; flex-direction:column; padding:4px 0; user-select:none; flex-shrink:0; }
.palette-header { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.05em; color:#666; padding:10px 14px 6px; }
.palette-group-header { font-size:10px; font-weight:600; text-transform:uppercase; letter-spacing:.05em; color:#999; padding:12px 14px 4px; border-top:1px solid #eee; margin-top:4px; }
.palette-tool { display:flex; align-items:center; gap:8px; width:100%; padding:5px 14px; font-size:12px; font-family:inherit; color:#444; background:none; border:none; border-left:3px solid transparent; cursor:pointer; text-align:left; transition:background .1s; }
.palette-tool:hover { background:#f0f4ff; }
.palette-tool.active { background:#e8f0fe; border-left-color:#3b82f6; color:#1d4ed8; font-weight:600; }
.palette-tool-icon { width:20px; text-align:center; font-size:14px; flex-shrink:0; }

/* Canvas area */
.design-canvas { flex:1; overflow:auto; background:#d6dbe3; position:relative; padding:24px; }
.design-surface { position:relative; background:#fff; border:1px solid #b0b8c4; box-shadow:0 2px 12px rgba(0,0,0,.10); min-width:400px; min-height:300px; background-image:radial-gradient(circle,#d0d4db 1px,transparent 1px); background-size:8px 8px; }

/* Canvas resize handle */
.canvas-resize-handle { position:absolute; right:0; bottom:0; width:14px; height:14px; cursor:nwse-resize; z-index:5; background:linear-gradient(135deg,transparent 60%,#888 60%,#888 70%,transparent 70%,transparent 80%,#888 80%); }

/* Status bar */
.designer-status { height:24px; display:flex; align-items:center; padding:0 14px; font-size:11px; color:#666; background:#f0f1f3; border-top:1px solid #dee2e6; flex-shrink:0; }

/* Inspector Panel */
.inspector-panel { width:280px; min-width:280px; background:#fff; border-left:1px solid #dee2e6; overflow-y:auto; display:flex; flex-direction:column; position:relative; flex-shrink:0; }
.inspector-title-bar { padding:6px 14px; font-size:12px; font-weight:600; color:#1e1e1e; background:linear-gradient(180deg,#e8e8e8 0%,#d0d0d0 100%); border-bottom:1px solid #bbb; letter-spacing:.02em; flex-shrink:0; }
.inspector-resize-handle { position:absolute; left:0; top:0; bottom:0; width:4px; cursor:ew-resize; background:transparent; z-index:10; }
.inspector-resize-handle:hover { background:rgba(59,130,246,.3); }

/* Controls list */
.controls-list-bar { display:flex; align-items:center; gap:6px; padding:6px 10px; border-bottom:1px solid #dee2e6; background:#f8f9fb; flex-shrink:0; }
.controls-list-label { font-size:11px; font-weight:600; color:#666; white-space:nowrap; }
.controls-list-select { flex:1; font-size:11px; font-family:inherit; padding:3px 4px; border:1px solid #ccc; border-radius:3px; background:#fff; }

/* Surface items */
.design-surface-item { position:absolute; border:1px solid #b0b8c4; background:rgba(255,255,255,.95); border-radius:2px; cursor:grab; user-select:none; transition:box-shadow .08s; overflow:visible; }
.design-surface-item:hover { box-shadow:0 0 0 1px #6b9eff; }
.design-surface-item.selected { border-color:#3b82f6; box-shadow:0 0 0 2px rgba(59,130,246,.35); }
.dsi-inner { width:100%; height:100%; pointer-events:none; position:relative; overflow:hidden; }
.dsi-inner > * { pointer-events:none; }

/* WYSIWYG control styles */
.wysiwyg-ctrl { box-sizing:border-box; font-family:'Segoe UI',sans-serif; font-size:12px; }
.wysiwyg-ctrl.wys-text-input, .wysiwyg-ctrl.wys-number-input, .wysiwyg-ctrl.wys-date-picker { width:100%; height:100%; padding:4px 8px; border:1px solid #aaa; border-radius:3px; background:#fff; }
.wysiwyg-ctrl.wys-textarea { width:100%; height:100%; padding:4px 8px; border:1px solid #aaa; border-radius:3px; background:#fff; resize:none; }
.wysiwyg-ctrl.wys-button { width:100%; height:100%; padding:4px 12px; border:1px solid #888; border-radius:3px; background:linear-gradient(180deg,#f8f8f8,#e0e0e0); cursor:default; font-weight:500; display:flex; align-items:center; justify-content:center; }
.wysiwyg-ctrl.wys-label { width:100%; height:100%; display:flex; align-items:center; padding:0 4px; }
.wysiwyg-ctrl.wys-checkbox, .wysiwyg-ctrl.wys-radio, .wysiwyg-ctrl.wys-toggle-switch { display:flex; align-items:center; gap:6px; width:100%; height:100%; padding:0 4px; }
.wysiwyg-ctrl.wys-select { width:100%; height:100%; padding:4px 8px; border:1px solid #aaa; border-radius:3px; background:#fff; }
.wysiwyg-ctrl.wys-image { width:100%; height:100%; background:#eee; border:1px dashed #bbb; display:flex; align-items:center; justify-content:center; color:#888; font-size:24px; }
.wysiwyg-ctrl.wys-panel { width:100%; height:100%; border:1px solid #ccc; background:#f5f5f5; }
.wysiwyg-ctrl.wys-group-box { width:100%; height:100%; border:1px solid #aaa; border-radius:3px; padding-top:16px; position:relative; }
.wysiwyg-ctrl.wys-group-box::before { content:attr(data-title); position:absolute; top:-8px; left:8px; background:#fff; padding:0 4px; font-size:11px; color:#555; }
.wysiwyg-ctrl.wys-toolbar { width:100%; height:100%; background:linear-gradient(180deg,#f0f0f0,#e0e0e0); border-bottom:1px solid #ccc; display:flex; align-items:center; padding:0 8px; }
.wysiwyg-ctrl.wys-tabbed-panel { width:100%; height:100%; border:1px solid #ccc; }
.wysiwyg-ctrl .wys-tab-bar { display:flex; background:#e8e8e8; border-bottom:1px solid #ccc; }
.wysiwyg-ctrl .wys-tab { padding:4px 12px; font-size:11px; border-right:1px solid #ccc; }
.wysiwyg-ctrl .wys-tab.active { background:#fff; }
.wysiwyg-ctrl.wys-split-pane { width:100%; height:100%; display:flex; border:1px solid #ccc; }
.wysiwyg-ctrl .wys-split-left, .wysiwyg-ctrl .wys-split-right { flex:1; }
.wysiwyg-ctrl .wys-splitter { width:4px; background:#ddd; cursor:ew-resize; }
.wysiwyg-ctrl.wys-data-grid { width:100%; height:100%; border:1px solid #ccc; display:flex; flex-direction:column; }
.wysiwyg-ctrl .wys-grid-header { display:flex; background:#e8e8e8; border-bottom:1px solid #ccc; font-size:11px; font-weight:600; }
.wysiwyg-ctrl .wys-grid-cell { flex:1; padding:3px 6px; border-right:1px solid #ddd; }
.wysiwyg-ctrl .wys-grid-row { display:flex; border-bottom:1px solid #eee; font-size:11px; }
.wysiwyg-ctrl.wys-tree-view { width:100%; height:100%; border:1px solid #ccc; padding:4px; font-size:11px; overflow:auto; background:#fff; }
.wysiwyg-ctrl.wys-accordion { width:100%; height:100%; border:1px solid #ccc; }
.wysiwyg-ctrl .wys-acc-header { padding:6px 10px; background:#e8e8e8; border-bottom:1px solid #ccc; font-size:11px; font-weight:600; }
.wysiwyg-ctrl.wys-color-picker { width:100%; height:100%; }

/* Resize handles */
.resize-handle { position:absolute; width:8px; height:8px; background:#3b82f6; border:1px solid #fff; border-radius:1px; z-index:10; }
.resize-n { top:-4px; left:50%; transform:translateX(-50%); cursor:ns-resize; }
.resize-s { bottom:-4px; left:50%; transform:translateX(-50%); cursor:ns-resize; }
.resize-e { right:-4px; top:50%; transform:translateY(-50%); cursor:ew-resize; }
.resize-w { left:-4px; top:50%; transform:translateY(-50%); cursor:ew-resize; }
.resize-ne { top:-4px; right:-4px; cursor:nesw-resize; }
.resize-nw { top:-4px; left:-4px; cursor:nwse-resize; }
.resize-se { bottom:-4px; right:-4px; cursor:nwse-resize; }
.resize-sw { bottom:-4px; left:-4px; cursor:nesw-resize; }

/* Placement ghost */
.placement-ghost { position:absolute; border:2px dashed #3b82f6; background:rgba(59,130,246,.06); border-radius:2px; pointer-events:none; z-index:20; }

/* Context menu */
.ctx-menu { position:fixed; background:#fff; border:1px solid #bbb; border-radius:4px; box-shadow:0 4px 12px rgba(0,0,0,.18); min-width:200px; z-index:99999; padding:4px 0; }
.ctx-option { display:flex; align-items:center; justify-content:space-between; padding:6px 16px; font-size:12px; cursor:pointer; }
.ctx-option:hover { background:#e8f0fe; }
.ctx-shortcut { font-size:11px; color:#888; margin-left:24px; font-family:'Segoe UI',monospace; }
.ctx-separator { height:1px; background:#e0e2e6; margin:4px 8px; }

/* SVG controls */
.wysiwyg-ctrl.wys-progress-bar { width:100%; height:100%; overflow:hidden; border-radius:4px; }
.wysiwyg-ctrl.wys-progress-bar svg { display:block; }
.wysiwyg-ctrl.wys-gauge { width:100%; height:100%; display:flex; align-items:center; justify-content:center; }
.wysiwyg-ctrl.wys-gauge svg { display:block; }

/* Settings Dialog */
.settings-backdrop { position:fixed; inset:0; z-index:100000; background:rgba(30,41,59,.45); backdrop-filter:blur(6px); -webkit-backdrop-filter:blur(6px); display:flex; align-items:center; justify-content:center; animation:settingsFadeIn .15s ease; }
@keyframes settingsFadeIn { from{opacity:0} to{opacity:1} }
.settings-card { width:420px; max-width:90vw; background:#fff; border-radius:12px; box-shadow:0 20px 60px rgba(0,0,0,.25),0 0 0 1px rgba(255,255,255,.1); overflow:hidden; animation:settingsSlideUp .2s ease; }
@keyframes settingsSlideUp { from{transform:translateY(20px);opacity:0} to{transform:translateY(0);opacity:1} }
.settings-header { background:linear-gradient(135deg,#4a5568 0%,#2d3748 100%); color:#fff; padding:16px 24px; display:flex; align-items:center; gap:10px; font-size:15px; font-weight:600; }
.settings-icon { font-size:20px; opacity:.8; }
.settings-body { padding:8px 0; }
.settings-row { display:flex; align-items:center; justify-content:space-between; padding:12px 24px; border-bottom:1px solid #f0f1f3; }
.settings-row:last-child { border-bottom:none; }
.settings-info { flex:1; margin-right:16px; }
.settings-label { font-size:13px; font-weight:600; color:#1e293b; }
.settings-desc { font-size:11px; color:#64748b; margin-top:2px; }
.settings-number { width:64px; padding:4px 8px; border:1px solid #d1d5db; border-radius:6px; font-size:13px; text-align:center; outline:none; }
.settings-number:focus { border-color:#3b82f6; box-shadow:0 0 0 2px rgba(59,130,246,.2); }

/* Toggle switch */
.settings-toggle { position:relative; display:inline-block; width:44px; height:24px; flex-shrink:0; }
.settings-toggle input { opacity:0; width:0; height:0; }
.settings-slider { position:absolute; inset:0; background:#cbd5e1; border-radius:24px; cursor:pointer; transition:background .2s, box-shadow .2s; }
.settings-slider::before { content:''; position:absolute; width:18px; height:18px; left:3px; bottom:3px; background:#fff; border-radius:50%; transition:transform .2s; box-shadow:0 1px 3px rgba(0,0,0,.2); }
.settings-toggle input:checked + .settings-slider { background:#3b82f6; }
.settings-toggle input:checked + .settings-slider::before { transform:translateX(20px); }
.settings-toggle input:focus + .settings-slider { box-shadow:0 0 0 3px rgba(59,130,246,.25); }

.settings-footer { padding:12px 24px; border-top:1px solid #e5e7eb; display:flex; justify-content:flex-end; }
.settings-close-btn { padding:7px 24px; background:#3b82f6; color:#fff; border:none; border-radius:6px; font-size:13px; font-weight:500; cursor:pointer; transition:background .15s; }
.settings-close-btn:hover { background:#2563eb; }
.settings-close-btn:focus { outline:none; box-shadow:0 0 0 3px rgba(59,130,246,.35); }

/* Alignment guides */
.alignment-guide { position:absolute; pointer-events:none; z-index:50; }
.alignment-guide-v { width:1px; top:0; bottom:0; border-left:1px dashed rgba(59,130,246,.7); }
.alignment-guide-h { height:1px; left:0; right:0; border-top:1px dashed rgba(59,130,246,.7); }

/* Inline text editing */
.inline-edit-input { position:absolute; z-index:30; box-sizing:border-box; border:2px solid #3b82f6; border-radius:2px; background:#fff; padding:2px 4px; font-size:12px; font-family:'Segoe UI',sans-serif; outline:none; box-shadow:0 0 0 2px rgba(59,130,246,.2); }

/* Marquee selection */
.marquee-selection { position:absolute; border:1px dashed #3b82f6; background:rgba(59,130,246,.08); z-index:60; pointer-events:none; }

/* Zoom toolbar */
.zoom-toolbar { position:absolute; bottom:8px; left:8px; z-index:50; display:flex; align-items:center; gap:4px; background:rgba(255,255,255,.92); border:1px solid #ccc; border-radius:4px; padding:2px 6px; box-shadow:0 1px 3px rgba(0,0,0,.12); font-size:11px; }
.zoom-btn { border:none; background:transparent; cursor:pointer; font-size:13px; padding:2px 6px; border-radius:3px; color:#333; }
.zoom-btn:hover { background:#e5e7eb; }
.zoom-label { min-width:36px; text-align:center; font-weight:500; color:#555; }

/* Professionalized form-builder shell */
.designer-app { background:#eef2f6; color:#1f2937; }
.designer-header { background:linear-gradient(180deg,#24324a 0%,#1f2937 100%); box-shadow:inset 0 -1px 0 rgba(255,255,255,.04); }
.designer-palette { width:224px; min-width:224px; background:#f9fbfc; border-right:1px solid #d7dee7; padding:8px 0 12px; }
.palette-header { padding:12px 16px 8px; font-size:11px; color:#516173; }
.palette-group-header { padding:14px 16px 6px; color:#7b8794; border-top:1px solid #edf1f5; }
.palette-tool { padding:7px 16px; border-left-width:4px; color:#24324a; }
.palette-tool:hover { background:#edf5ff; }
.palette-tool.active { background:#e7f0ff; border-left-color:#2563eb; color:#123a7a; }

.design-canvas { background:
    radial-gradient(circle at top left, rgba(255,255,255,.75), transparent 36%),
    linear-gradient(180deg,#dde4eb 0%,#e9eef3 100%);
    padding:28px;
}
.design-surface { border:1px solid #c9d4df; box-shadow:0 20px 45px rgba(15,23,42,.10), 0 1px 0 rgba(255,255,255,.95); border-radius:14px; overflow:visible; }
.design-surface-item { border:1px solid rgba(148,163,184,.45); border-radius:12px; background:rgba(255,255,255,.92); box-shadow:0 6px 12px rgba(15,23,42,.05); overflow:visible; }
.design-surface-item:hover { box-shadow:0 0 0 1px rgba(37,99,235,.35), 0 6px 12px rgba(15,23,42,.05); }
.design-surface-item.selected { border-color:#2563eb; box-shadow:0 0 0 3px rgba(37,99,235,.16), 0 10px 18px rgba(15,23,42,.08); }
.dsi-inner { width:100%; height:100%; pointer-events:none; position:relative; overflow:visible; }
.dsi-inner > * { pointer-events:none; }
.dsi-inner [data-children-host],
.dsi-inner [data-children-host] * { pointer-events:auto; }

.canvas-empty-state {
    position:absolute;
    inset:56px 72px auto 72px;
    max-width:420px;
    padding:22px 24px;
    border:1px solid rgba(148,163,184,.35);
    border-radius:18px;
    background:rgba(255,255,255,.92);
    box-shadow:0 14px 32px rgba(15,23,42,.08);
    pointer-events:none;
}
.canvas-empty-badge {
    display:inline-flex;
    align-items:center;
    height:24px;
    padding:0 10px;
    border-radius:999px;
    background:#e8eef7;
    color:#425466;
    font-size:11px;
    font-weight:700;
    text-transform:uppercase;
    letter-spacing:.08em;
}
.canvas-empty-state h2 { margin:12px 0 8px; font-size:24px; line-height:1.1; color:#10233f; }
.canvas-empty-state p { margin:0; font-size:13px; line-height:1.6; color:#5b6b7e; }

.inspector-panel {
    width:320px;
    min-width:320px;
    background:#f8fafc;
    border-left:1px solid #d7dee7;
    display:flex;
    flex-direction:column;
}
.inspector-title {
    padding:18px 18px 6px;
    font-size:11px;
    font-weight:800;
    text-transform:uppercase;
    letter-spacing:.12em;
    color:#6b7b8d;
}
.inspector-subtitle {
    padding:0 18px 4px;
    font-size:20px;
    font-weight:700;
    color:#15273f;
    border-bottom:none;
}
.inspector-summary {
    margin:0 18px 16px;
    padding:12px 14px;
    border:1px solid #dbe3ec;
    border-radius:14px;
    background:#ffffff;
    box-shadow:0 1px 2px rgba(15,23,42,.04);
}
.inspector-selection-meta {
    font-size:12px;
    line-height:1.5;
    color:#617286;
}
.inspector-outline-header,
.inspector-properties-header {
    padding:0 18px 8px;
    font-size:11px;
    font-weight:800;
    text-transform:uppercase;
    letter-spacing:.12em;
    color:#7b8794;
}
.inspector-outline {
    margin:0 12px 16px;
    padding:8px 0;
    border:1px solid #dbe3ec;
    border-radius:14px;
    background:#ffffff;
    box-shadow:0 1px 2px rgba(15,23,42,.04);
}
.outline-item {
    width:100%;
    display:flex;
    align-items:center;
    gap:8px;
    padding:8px 12px;
    border:none;
    background:transparent;
    text-align:left;
    font:inherit;
    color:#24324a;
    cursor:pointer;
}
.outline-item:hover { background:#f3f7fb; }
.outline-item.selected { background:#e7f0ff; color:#123a7a; }
.outline-item.container .outline-label { font-weight:700; }
.outline-icon { width:16px; text-align:center; color:#5e7186; flex-shrink:0; }
.outline-label { flex:1; min-width:0; font-size:12px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.outline-meta { font-size:11px; color:#7b8794; white-space:nowrap; }

.inspector-props {
    flex:1;
    margin:0 12px 12px;
    padding:8px 0 16px;
    border:1px solid #dbe3ec;
    border-radius:14px;
    background:#ffffff;
    overflow:auto;
}
.inspector-group-header {
    padding:14px 16px 8px;
    font-size:11px;
    font-weight:800;
    text-transform:uppercase;
    letter-spacing:.08em;
    color:#6b7b8d;
}
.inspector-row { display:flex; flex-direction:column; gap:6px; padding:0 16px 12px; }
.inspector-label { font-size:12px; font-weight:600; color:#314155; }
.inspector-editor { width:100%; }
.inspector-chip-group {
    display:flex;
    flex-wrap:wrap;
    gap:8px;
}
.inspector-chip {
    min-height:34px;
    padding:0 12px;
    border:1px solid #cbd6e2;
    border-radius:999px;
    background:linear-gradient(180deg,#ffffff,#f5f8fc);
    color:#314155;
    font:600 11px/1 inherit;
    letter-spacing:.02em;
    cursor:pointer;
    transition:border-color .12s, background .12s, box-shadow .12s, color .12s;
}
.inspector-chip:hover {
    border-color:#9fb3cb;
    background:linear-gradient(180deg,#ffffff,#eef4fb);
}
.inspector-chip.active {
    border-color:#2563eb;
    background:linear-gradient(180deg,#eff6ff,#dbeafe);
    box-shadow:0 0 0 3px rgba(37,99,235,.12);
    color:#173a7a;
}
.inspector-input {
    width:100%;
    min-height:38px;
    padding:8px 10px;
    border:1px solid #ccd6e2;
    border-radius:10px;
    background:#fbfdff;
    font:inherit;
    color:#1f2937;
    box-sizing:border-box;
}
textarea.inspector-input {
    min-height:88px;
    resize:vertical;
    line-height:1.5;
}
.inspector-checkbox {
    width:18px;
    height:18px;
    accent-color:#2563eb;
}
.inspector-input:focus {
    outline:none;
    border-color:#2563eb;
    box-shadow:0 0 0 3px rgba(37,99,235,.12);
}
.inspector-empty {
    display:flex;
    flex-direction:column;
    gap:6px;
    padding:18px 16px;
    color:#607086;
    font-size:12px;
    line-height:1.5;
}
.inspector-empty strong { color:#1f2937; font-size:13px; }

.wysiwyg-ctrl { box-sizing:border-box; font-family:'Segoe UI',sans-serif; font-size:12px; color:#24324a; }
.wys-field-shell { width:100%; height:100%; display:flex; flex-direction:column; gap:6px; padding:10px 12px; background:linear-gradient(180deg,rgba(255,255,255,.98),rgba(248,250,252,.98)); }
.wys-field-label { font-size:12px; font-weight:700; color:#1f2937; line-height:1.2; }
.wys-required { color:#dc2626; }
.wys-field-body { flex:1; min-height:0; }
.wys-field-help { font-size:11px; line-height:1.4; color:#64748b; }
.wys-text-input, .wys-number-input, .wys-date-picker, .wys-select {
    width:100%;
    height:40px;
    padding:0 12px;
    border:1px solid #cbd5e1;
    border-radius:10px;
    background:#fff;
}
.wys-textarea {
    width:100%;
    height:100%;
    min-height:66px;
    padding:10px 12px;
    border:1px solid #cbd5e1;
    border-radius:10px;
    background:#fff;
    resize:none;
}
.wys-choice-group {
    width:100%;
    height:100%;
    display:flex;
    flex-direction:column;
    justify-content:center;
    gap:8px;
    padding:10px 12px;
    background:linear-gradient(180deg,rgba(255,255,255,.98),rgba(248,250,252,.98));
}
.wys-choice-row { display:flex; align-items:center; gap:10px; font-size:12px; font-weight:600; color:#24324a; }
.wys-toggle-track {
    position:relative;
    width:38px;
    height:22px;
    border-radius:999px;
    background:#cbd5e1;
    flex-shrink:0;
}
.wys-toggle-track.is-on { background:#3b82f6; }
.wys-toggle-knob {
    position:absolute;
    top:3px;
    left:3px;
    width:16px;
    height:16px;
    border-radius:50%;
    background:#fff;
    box-shadow:0 1px 2px rgba(15,23,42,.25);
}
.wys-toggle-track.is-on .wys-toggle-knob { left:19px; }
.wys-color-row {
    display:flex;
    align-items:center;
    gap:10px;
    height:40px;
    padding:0 12px;
    border:1px solid #cbd5e1;
    border-radius:10px;
    background:#fff;
}
.wys-color-swatch {
    width:18px;
    height:18px;
    border-radius:999px;
    border:2px solid rgba(255,255,255,.95);
    box-shadow:0 0 0 1px rgba(148,163,184,.55);
}
.wys-color-value { font-size:12px; font-weight:600; color:#334155; }
.wys-button {
    width:100%;
    height:100%;
    display:flex;
    align-items:center;
    justify-content:center;
    border-radius:12px;
    padding:0 16px;
    font-weight:700;
    border:1px solid #cbd5e1;
    background:linear-gradient(180deg,#ffffff,#f1f5f9);
}
.wys-button-primary { background:linear-gradient(180deg,#2563eb,#1d4ed8); color:#fff; border-color:#1d4ed8; }
.wys-button-secondary { background:linear-gradient(180deg,#334155,#1f2937); color:#fff; border-color:#1f2937; }
.wys-button-danger { background:linear-gradient(180deg,#ef4444,#dc2626); color:#fff; border-color:#dc2626; }
.wys-label { width:100%; height:100%; display:flex; align-items:center; padding:8px 10px; font-weight:600; color:#334155; }
.wys-image {
    width:100%;
    height:100%;
    border:1px dashed #c1cad5;
    border-radius:12px;
    display:flex;
    align-items:center;
    justify-content:center;
    background:repeating-linear-gradient(45deg,#f8fafc,#f8fafc 12px,#f1f5f9 12px,#f1f5f9 24px);
    color:#94a3b8;
    font-size:24px;
}
.wys-toolbar {
    width:100%;
    height:100%;
    display:flex;
    align-items:center;
    gap:10px;
    padding:8px 12px;
    border-radius:12px;
    background:linear-gradient(180deg,#fbfdff,#eef2f7);
    border:1px solid #d7dee7;
}
.wys-toolbar-title { font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:.08em; color:#607086; }
.wys-toolbar-host {
    position:relative;
    flex:1;
    min-height:34px;
    border:1px dashed #c9d4df;
    border-radius:10px;
    background:rgba(255,255,255,.85);
}
.wys-panel, .wys-tabbed-panel, .wys-accordion, .wys-group-box {
    width:100%;
    height:100%;
    display:flex;
    flex-direction:column;
    border:1px solid #d5dee8;
    border-radius:14px;
    background:linear-gradient(180deg,rgba(255,255,255,.98),rgba(245,248,251,.98));
}
.wys-panel-header {
    padding:12px 14px 0;
    font-size:13px;
    font-weight:700;
    color:#15273f;
}
.wys-panel-description {
    padding:0 14px 10px;
    font-size:11px;
    line-height:1.45;
    color:#64748b;
}
.wys-panel-body, .wys-tab-body, .wys-accordion-body, .wys-group-box-body {
    position:relative;
    flex:1;
    min-height:54px;
    margin:var(--semantic-host-margin, 10px);
    border:1px dashed #d4dce6;
    border-radius:12px;
    background:rgba(255,255,255,.86);
}
.wys-panel-body[data-inset-style="flush"],
.wys-tab-body[data-inset-style="flush"],
.wys-accordion-body[data-inset-style="flush"],
.wys-group-box-body[data-inset-style="flush"],
.wys-toolbar-host[data-inset-style="flush"],
.wys-split-left[data-inset-style="flush"] {
    border-style:solid;
    background:rgba(255,255,255,.72);
}
.wys-panel-body[data-inset-style="panel"],
.wys-tab-body[data-inset-style="panel"],
.wys-accordion-body[data-inset-style="panel"],
.wys-group-box-body[data-inset-style="panel"],
.wys-toolbar-host[data-inset-style="panel"],
.wys-split-left[data-inset-style="panel"] {
    border-color:#c4d2e1;
    box-shadow:inset 0 1px 0 rgba(255,255,255,.92), 0 6px 14px rgba(15,23,42,.05);
    background:linear-gradient(180deg,rgba(255,255,255,.96),rgba(244,248,252,.92));
}
.wys-group-box { padding-top:14px; position:relative; }
.wys-group-box::before {
    content:attr(data-title);
    position:absolute;
    top:-10px;
    left:14px;
    padding:0 8px;
    background:#f8fafc;
    font-size:11px;
    font-weight:700;
    color:#475569;
}
.wys-tab-bar {
    display:flex;
    gap:6px;
    padding:10px 10px 0;
    border-bottom:none;
    background:transparent;
}
.wys-tab {
    padding:8px 12px;
    font-size:11px;
    font-weight:700;
    color:#64748b;
    border-radius:10px 10px 0 0;
    background:#edf2f7;
    border:1px solid transparent;
}
.wys-tab.active { background:#ffffff; color:#1f2937; border-color:#d5dee8; border-bottom-color:#ffffff; }
.wys-split-pane {
    width:100%;
    height:100%;
    display:flex;
    gap:8px;
    padding:10px;
    border:1px solid #d5dee8;
    border-radius:14px;
    background:linear-gradient(180deg,#ffffff,#f5f8fb);
}
.wys-split-pane.is-vertical { flex-direction:column; }
.wys-split-left, .wys-split-right {
    position:relative;
    flex:1;
    min-height:54px;
    border:1px dashed #d4dce6;
    border-radius:12px;
    background:rgba(255,255,255,.88);
}
.wys-split-right {
    display:flex;
    align-items:center;
    justify-content:center;
    color:#7b8794;
    font-size:11px;
    font-weight:700;
}
.wys-splitter {
    width:8px;
    border-radius:999px;
    background:linear-gradient(180deg,#dbe4ee,#c9d4df);
    flex-shrink:0;
}
.wys-split-pane.is-vertical .wys-splitter { width:auto; height:8px; }
.wys-acc-header {
    padding:10px 12px;
    font-size:11px;
    font-weight:700;
    color:#334155;
    border-bottom:1px solid #e5eaf0;
}
.wys-acc-header.muted { color:#64748b; background:#f8fafc; }

/* Studio blue shell */
.designer-app[data-style-preset="studio_blue"] {
    --studio-ink:#22384f;
    --studio-muted:#61748a;
    --studio-border:#9eb1c6;
    --studio-border-soft:#c7d3e0;
    --studio-accent:#2e5f98;
    --studio-accent-soft:#dfeaf7;
    --studio-panel:#f7fbff;
    --studio-panel-2:#e8f0fa;
    --studio-canvas:#e6edf5;
    --studio-white:#ffffff;
    background:linear-gradient(180deg,#eef3f8 0%,#e3ebf4 100%);
    font-family:'Segoe UI Variable Text','Segoe UI',Tahoma,sans-serif;
}
.designer-app[data-style-preset="studio_blue"] .designer-menubar {
    height:26px;
    background:linear-gradient(180deg,#f8fbff 0%,#dce7f4 100%);
    border-bottom:1px solid var(--studio-border);
    box-shadow:inset 0 1px 0 rgba(255,255,255,.92);
}
.designer-app[data-style-preset="studio_blue"] .menu-item {
    color:var(--studio-ink);
    border:1px solid transparent;
    border-radius:5px;
}
.designer-app[data-style-preset="studio_blue"] .menu-item:hover,
.designer-app[data-style-preset="studio_blue"] .menu-item.open {
    background:linear-gradient(180deg,#ffffff 0%,#edf4fc 100%);
    border-color:#bfd0e2;
}
.designer-app[data-style-preset="studio_blue"] .menu-dropdown,
.designer-app[data-style-preset="studio_blue"] .ctx-menu {
    border:1px solid var(--studio-border);
    border-radius:8px;
    background:linear-gradient(180deg,#ffffff 0%,#f1f6fc 100%);
    box-shadow:0 16px 30px rgba(32,54,81,.16);
}
.designer-app[data-style-preset="studio_blue"] .designer-header {
    height:40px;
    background:linear-gradient(180deg,#486b94 0%,#35597f 48%,#2d4e72 100%);
    border-bottom:1px solid #274564;
    box-shadow:inset 0 1px 0 rgba(255,255,255,.18);
}
.designer-app[data-style-preset="studio_blue"] .designer-header-title {
    letter-spacing:.01em;
    text-shadow:0 1px 0 rgba(0,0,0,.2);
}
.designer-app[data-style-preset="studio_blue"] .header-btn {
    min-height:24px;
    padding:3px 10px;
    border-radius:6px;
    border-color:rgba(201,220,239,.38);
    background:linear-gradient(180deg,rgba(255,255,255,.22),rgba(200,219,239,.10));
    box-shadow:inset 0 1px 0 rgba(255,255,255,.22);
}
.designer-app[data-style-preset="studio_blue"] .header-btn:hover:not(:disabled) {
    background:linear-gradient(180deg,rgba(255,255,255,.32),rgba(200,219,239,.18));
}
.designer-app[data-style-preset="studio_blue"] .designer-palette,
.designer-app[data-style-preset="studio_blue"] .inspector-panel {
    background:linear-gradient(180deg,#f8fbff 0%,#eef4fb 100%);
    border-color:var(--studio-border-soft);
}
.designer-app[data-style-preset="studio_blue"] .palette-header,
.designer-app[data-style-preset="studio_blue"] .inspector-title,
.designer-app[data-style-preset="studio_blue"] .inspector-outline-header,
.designer-app[data-style-preset="studio_blue"] .inspector-properties-header {
    color:#5b7189;
}
.designer-app[data-style-preset="studio_blue"] .palette-tool,
.designer-app[data-style-preset="studio_blue"] .outline-item {
    border-radius:7px;
}
.designer-app[data-style-preset="studio_blue"] .palette-tool:hover,
.designer-app[data-style-preset="studio_blue"] .outline-item:hover {
    background:linear-gradient(180deg,#fdfefe 0%,#edf4fb 100%);
}
.designer-app[data-style-preset="studio_blue"] .palette-tool.active,
.designer-app[data-style-preset="studio_blue"] .outline-item.selected {
    background:linear-gradient(180deg,#fefefe 0%,#e2ecf8 100%);
    border-left-color:var(--studio-accent);
    box-shadow:inset 0 0 0 1px rgba(125,153,187,.28);
}
.designer-app[data-style-preset="studio_blue"] .inspector-summary,
.designer-app[data-style-preset="studio_blue"] .inspector-outline,
.designer-app[data-style-preset="studio_blue"] .inspector-props {
    border-color:var(--studio-border-soft);
    background:linear-gradient(180deg,#ffffff 0%,#f7fbff 100%);
    box-shadow:inset 0 1px 0 rgba(255,255,255,.82), 0 4px 12px rgba(40,60,88,.04);
}
.designer-app[data-style-preset="studio_blue"] .inspector-input {
    border-color:#b9c9da;
    border-radius:8px;
    background:linear-gradient(180deg,#ffffff 0%,#f5f9fd 100%);
    box-shadow:inset 0 1px 0 rgba(255,255,255,.85);
}
.designer-app[data-style-preset="studio_blue"] .design-canvas {
    padding:72px 28px 32px;
    background:
        radial-gradient(circle at top left, rgba(255,255,255,.92), transparent 32%),
        linear-gradient(180deg,#dfe8f2 0%,#e9eff6 100%);
}
.designer-app[data-style-preset="studio_blue"] .design-surface {
    border:1px solid var(--studio-border);
    border-radius:10px;
    box-shadow:0 18px 36px rgba(31,50,76,.13), inset 0 1px 0 rgba(255,255,255,.92);
    background-image:
        linear-gradient(180deg,rgba(248,251,255,.96),rgba(255,255,255,.98)),
        linear-gradient(rgba(112,137,166,.07) 1px, transparent 1px),
        linear-gradient(90deg, rgba(112,137,166,.07) 1px, transparent 1px);
    background-size:100% 100%, 24px 24px, 24px 24px;
}
.designer-app[data-style-preset="studio_blue"] .design-surface-item {
    border-color:#afc0d2;
    border-radius:9px;
    background:linear-gradient(180deg,rgba(255,255,255,.97),rgba(245,249,253,.95));
    box-shadow:0 10px 20px rgba(33,53,79,.08);
}
.designer-app[data-style-preset="studio_blue"] .design-surface-item.selected {
    border-color:var(--studio-accent);
    box-shadow:0 0 0 3px rgba(46,95,152,.14), 0 14px 28px rgba(33,53,79,.10);
}
.designer-app[data-style-preset="studio_blue"] .design-surface-item.auto-layout-item {
    cursor:default;
}
.designer-app[data-style-preset="studio_blue"] .canvas-empty-state {
    border-color:#bfcede;
    border-radius:14px;
    background:linear-gradient(180deg,rgba(255,255,255,.96),rgba(243,248,253,.96));
}
.designer-app[data-style-preset="studio_blue"] .canvas-empty-badge {
    background:linear-gradient(180deg,#eef4fc,#d9e6f4);
    color:#4e6580;
}
.viewport-toolbar {
    position:absolute;
    top:16px;
    right:18px;
    z-index:55;
    display:flex;
    align-items:center;
    gap:10px;
    min-height:38px;
    padding:6px 8px 6px 12px;
    border:1px solid #9eb1c6;
    border-radius:10px;
    background:linear-gradient(180deg,rgba(255,255,255,.96),rgba(230,239,249,.96));
    box-shadow:0 12px 26px rgba(31,50,76,.12), inset 0 1px 0 rgba(255,255,255,.86);
}
.viewport-toolbar-title {
    font-size:11px;
    font-weight:800;
    text-transform:uppercase;
    letter-spacing:.1em;
    color:#5f7389;
}
.viewport-button-group {
    display:flex;
    align-items:center;
    gap:4px;
    padding:3px;
    border:1px solid #c1cfde;
    border-radius:8px;
    background:linear-gradient(180deg,#f7fbff,#ebf2fa);
}
.viewport-btn {
    min-width:64px;
    min-height:26px;
    padding:0 10px;
    border:1px solid transparent;
    border-radius:6px;
    background:transparent;
    color:#29445f;
    font:inherit;
    font-size:12px;
    font-weight:700;
    cursor:pointer;
}
.viewport-btn:hover {
    background:linear-gradient(180deg,#ffffff,#edf4fb);
    border-color:#c4d2e0;
}
.viewport-btn.active {
    background:linear-gradient(180deg,#ffffff 0%,#dce8f6 100%);
    border-color:#9fb6cf;
    color:#1f456d;
    box-shadow:inset 0 1px 0 rgba(255,255,255,.95);
}
.viewport-width-label {
    min-width:104px;
    text-align:right;
    font-size:12px;
    font-weight:700;
    color:#49627c;
}
.zoom-toolbar {
    bottom:12px;
    left:12px;
    gap:6px;
    padding:4px 8px;
    border:1px solid #a9bccf;
    border-radius:10px;
    background:linear-gradient(180deg,rgba(255,255,255,.94),rgba(235,242,250,.94));
    box-shadow:0 10px 22px rgba(31,50,76,.10), inset 0 1px 0 rgba(255,255,255,.84);
}
.zoom-btn {
    min-width:28px;
    min-height:24px;
    border:1px solid transparent;
    border-radius:6px;
    font-weight:700;
}
.zoom-btn:hover {
    background:linear-gradient(180deg,#ffffff,#ecf3fb);
    border-color:#c1cfde;
}
.zoom-label {
    min-width:48px;
    color:#4f647a;
    font-weight:700;
}
.reorder-handle-bar {
    position:absolute;
    top:8px;
    right:8px;
    z-index:24;
    display:flex;
    gap:4px;
    pointer-events:auto;
}
.reorder-handle-btn {
    width:24px;
    height:24px;
    padding:0;
    border:1px solid #b7c6d5;
    border-radius:6px;
    background:linear-gradient(180deg,#ffffff 0%,#edf3fa 100%);
    color:#28425e;
    font:inherit;
    font-size:12px;
    font-weight:800;
    cursor:pointer;
    box-shadow:inset 0 1px 0 rgba(255,255,255,.9);
}
.reorder-handle-btn:hover:not(:disabled) {
    background:linear-gradient(180deg,#ffffff 0%,#e4eef9 100%);
    border-color:#98afc8;
}
.reorder-handle-btn:disabled {
    opacity:.42;
    cursor:default;
}
.quick-edit-bar {
    position:absolute;
    left:12px;
    width:max-content;
    max-width:calc(100% - 24px);
    top:-18px;
    z-index:28;
    display:flex;
    align-items:center;
    flex-wrap:wrap;
    gap:6px;
    padding:6px 8px;
    border:1px solid rgba(151,170,191,.75);
    border-radius:12px;
    background:linear-gradient(180deg,rgba(255,255,255,.98),rgba(239,245,251,.98));
    box-shadow:0 10px 22px rgba(15,23,42,.12);
    pointer-events:auto;
}
.quick-edit-btn,
.quick-edit-chip,
.inline-add-slot,
.inline-add-option {
    min-height:28px;
    padding:0 10px;
    border:1px solid #b9c9da;
    border-radius:999px;
    background:linear-gradient(180deg,#ffffff 0%,#edf3fa 100%);
    color:#28425e;
    font:inherit;
    font-size:11px;
    font-weight:700;
    cursor:pointer;
    box-shadow:inset 0 1px 0 rgba(255,255,255,.92);
}
.quick-edit-btn:hover,
.quick-edit-chip:hover,
.inline-add-slot:hover,
.inline-add-option:hover {
    border-color:#8ea8c2;
    background:linear-gradient(180deg,#ffffff 0%,#e4eef9 100%);
}
.quick-edit-btn.active,
.quick-edit-chip.active {
    border-color:#2563eb;
    background:linear-gradient(180deg,#eff6ff 0%,#dbeafe 100%);
    color:#173a7a;
    box-shadow:0 0 0 3px rgba(37,99,235,.12);
}
.quick-edit-choices {
    display:flex;
    align-items:center;
    gap:4px;
}
.quick-edit-chip {
    min-width:48px;
    padding:0 9px;
}
.quick-edit-add-btn {
    margin-left:auto;
}
.inline-add-slot {
    position:absolute;
    z-index:26;
    min-width:104px;
    box-shadow:0 10px 20px rgba(15,23,42,.10);
    pointer-events:auto;
}
.inline-add-menu {
    position:absolute;
    z-index:27;
    display:flex;
    flex-direction:column;
    gap:6px;
    min-width:156px;
    padding:8px;
    border:1px solid #c2d0dd;
    border-radius:14px;
    background:linear-gradient(180deg,rgba(255,255,255,.98),rgba(244,248,252,.98));
    box-shadow:0 18px 34px rgba(15,23,42,.14);
    pointer-events:auto;
}
.inline-add-option {
    display:flex;
    align-items:center;
    justify-content:flex-start;
    text-align:left;
    border-radius:10px;
}
.design-surface-item.auto-layout-item[data-width-policy="fixed"] {
    border-style:dashed;
}
.designer-app[data-style-preset="studio_blue"] .designer-status {
    background:linear-gradient(180deg,#f8fbff 0%,#dde8f4 100%);
    border-top:1px solid var(--studio-border);
    color:#50657d;
}
.designer-app[data-style-preset="studio_blue"] .wys-field-shell,
.designer-app[data-style-preset="studio_blue"] .wys-choice-group {
    background:linear-gradient(180deg,#ffffff 0%,#f6f9fd 100%);
}
.designer-app[data-style-preset="studio_blue"] .wys-field-label,
.designer-app[data-style-preset="studio_blue"] .wys-panel-header {
    color:var(--studio-ink);
}
.designer-app[data-style-preset="studio_blue"] .wys-field-help,
.designer-app[data-style-preset="studio_blue"] .wys-panel-description,
.designer-app[data-style-preset="studio_blue"] .wys-toolbar-title {
    color:var(--studio-muted);
}
.designer-app[data-style-preset="studio_blue"] .wys-text-input,
.designer-app[data-style-preset="studio_blue"] .wys-number-input,
.designer-app[data-style-preset="studio_blue"] .wys-date-picker,
.designer-app[data-style-preset="studio_blue"] .wys-select,
.designer-app[data-style-preset="studio_blue"] .wys-textarea,
.designer-app[data-style-preset="studio_blue"] .wys-color-row {
    border-color:#b7c6d5;
    border-radius:8px;
    background:linear-gradient(180deg,#ffffff 0%,#f4f8fc 100%);
    box-shadow:inset 0 1px 0 rgba(255,255,255,.88);
}
.designer-app[data-style-preset="studio_blue"] .wys-button {
    border-color:#9fb1c4;
    border-radius:8px;
    background:linear-gradient(180deg,#ffffff 0%,#e2ebf6 100%);
    box-shadow:inset 0 1px 0 rgba(255,255,255,.92);
}
.designer-app[data-style-preset="studio_blue"] .wys-button-primary {
    border-color:#2a5588;
    background:linear-gradient(180deg,#5c84b2 0%,#366293 100%);
}
.designer-app[data-style-preset="studio_blue"] .wys-toolbar,
.designer-app[data-style-preset="studio_blue"] .wys-panel,
.designer-app[data-style-preset="studio_blue"] .wys-tabbed-panel,
.designer-app[data-style-preset="studio_blue"] .wys-accordion,
.designer-app[data-style-preset="studio_blue"] .wys-group-box,
.designer-app[data-style-preset="studio_blue"] .wys-split-pane {
    border-color:#b7c6d5;
    border-radius:10px;
    background:linear-gradient(180deg,#fbfdff 0%,#edf3fa 100%);
    box-shadow:inset 0 1px 0 rgba(255,255,255,.9);
}
.designer-app[data-style-preset="studio_blue"] .wys-panel-header {
    padding:10px 12px 0;
}
.designer-app[data-style-preset="studio_blue"] .wys-panel-body,
.designer-app[data-style-preset="studio_blue"] .wys-tab-body,
.designer-app[data-style-preset="studio_blue"] .wys-accordion-body,
.designer-app[data-style-preset="studio_blue"] .wys-group-box-body,
.designer-app[data-style-preset="studio_blue"] .wys-toolbar-host,
.designer-app[data-style-preset="studio_blue"] .wys-split-left,
.designer-app[data-style-preset="studio_blue"] .wys-split-right {
    border-color:#c5d2df;
    border-radius:8px;
    background:linear-gradient(180deg,rgba(255,255,255,.95),rgba(244,248,252,.92));
}
.designer-app[data-style-preset="studio_blue"] .wys-tab {
    border-radius:8px 8px 0 0;
    background:linear-gradient(180deg,#edf3fb 0%,#dfe9f6 100%);
}
.designer-app[data-style-preset="studio_blue"] .wys-tab.active {
    background:linear-gradient(180deg,#ffffff 0%,#f7fbff 100%);
    border-color:#b7c6d5;
}
.designer-app[data-style-preset="studio_blue"] .wys-splitter {
    background:linear-gradient(180deg,#dfe8f2,#bfcddd);
}
@media (max-width: 1100px) {
    .designer-body { flex-direction:column; }
    .designer-palette {
        width:auto;
        min-width:0;
        max-height:210px;
        border-right:none;
        border-bottom:1px solid #c9d5e2;
    }
    .design-canvas { min-height:360px; }
    .inspector-panel {
        width:auto;
        min-width:0;
        max-height:340px;
        border-left:none;
        border-top:1px solid #c9d5e2;
    }
}
@media (max-width: 720px) {
    .designer-header {
        padding:0 10px;
        gap:8px;
    }
    .designer-header-toolbar {
        flex-wrap:wrap;
        justify-content:flex-end;
    }
    .design-canvas {
        padding:92px 14px 20px;
    }
    .viewport-toolbar {
        left:14px;
        right:14px;
        justify-content:space-between;
        flex-wrap:wrap;
    }
    .viewport-width-label {
        min-width:0;
        width:100%;
        text-align:left;
    }
}
`;
