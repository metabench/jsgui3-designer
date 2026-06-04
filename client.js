/**
 * jsgui3-designer â€” Client entry point
 * Three-panel layout: Palette | Canvas | Inspector
 */
'use strict';

const jsgui = require('jsgui3-client');
const Control = jsgui.Control;
const Document_Model = require('./models/document_model');
const Selection_Model = require('./models/selection_model');
const { Command_History, AddControlCommand, ChangePropertyCommand } = require('./models/command_history');
const { create_default_registry } = require('./models/control_registry');
const Design_Canvas = require('./controls/Design_Canvas');
const Inspector_Panel = require('./controls/Inspector_Panel');
const { createInspectorInput } = require('./controls/inspector/create_inspector_input');
const { createWysiwygElement } = require('./controls/wysiwyg/create_wysiwyg_element');
const designerShellMethods = require('./controls/shell/designer_shell_methods');
const designerLayoutMethods = require('./controls/layout/designer_layout_methods');
const designerCanvasInteractionMethods = require('./controls/canvas/designer_canvas_interaction_methods');
const designerOverlayMethods = require('./controls/authoring/designer_overlay_methods');
const designerExportMethods = require('./controls/export/designer_export_methods');
const designerAppCss = require('./controls/styles/designer_app_css');

class Designer_App extends Control {
    constructor(spec = {}) {
        spec.__type_name = spec.__type_name || 'designer_app';
        super(spec);
        this.add_class('designer-app');
        this.dom.tagName = 'div';
        const { context } = this;

        // Models (SSR, re-created in activate)
        this.document_model = new Document_Model();
        this.selection_model = new Selection_Model();
        this.command_history = new Command_History();
        this.control_registry = create_default_registry();
        this.document_model.init_root();

        // â”€â”€ Menu Bar â”€â”€
        const menubar = new Control({ context, tag_name: 'div' });
        menubar.add_class('designer-menubar');
        const fileMenu = new Control({ context, tag_name: 'div' });
        fileMenu.add_class('menu-item');
        fileMenu.dom.attributes['data-menu'] = 'file';
        fileMenu.add('File');
        menubar.add(fileMenu);
        const editMenu = new Control({ context, tag_name: 'div' });
        editMenu.add_class('menu-item');
        editMenu.dom.attributes['data-menu'] = 'edit';
        editMenu.add('Edit');
        menubar.add(editMenu);
        this.add(menubar);

        // â”€â”€ Header â”€â”€
        const header = new Control({ context, tag_name: 'div' });
        header.add_class('designer-header');
        const title = new Control({ context, tag_name: 'span' });
        title.add_class('designer-header-title');
        title.add('jsgui3 Designer');
        header.add(title);
        const toolbar = new Control({ context, tag_name: 'div' });
        toolbar.add_class('designer-header-toolbar');
        this._btn_undo = new Control({ context, tag_name: 'button' });
        this._btn_undo.add_class('header-btn');
        this._btn_undo.dom.attributes.title = 'Undo (Ctrl+Z)';
        this._btn_undo.dom.attributes.disabled = 'true';
        this._btn_undo.add('\u21a9 Undo');
        toolbar.add(this._btn_undo);
        this._btn_redo = new Control({ context, tag_name: 'button' });
        this._btn_redo.add_class('header-btn');
        this._btn_redo.dom.attributes.title = 'Redo (Ctrl+Y)';
        this._btn_redo.dom.attributes.disabled = 'true';
        this._btn_redo.add('\u21aa Redo');
        toolbar.add(this._btn_redo);
        header.add(toolbar);
        this.add(header);

        // â”€â”€ Body â”€â”€
        const body = new Control({ context, tag_name: 'div' });
        body.add_class('designer-body');
        this._palette = this._build_palette();
        body.add(this._palette);
        this.canvas = new Design_Canvas({ context, document_model: this.document_model, selection_model: this.selection_model, command_history: this.command_history, control_registry: this.control_registry });
        body.add(this.canvas);
        this.inspector = new Inspector_Panel({ context, document_model: this.document_model, selection_model: this.selection_model, command_history: this.command_history, control_registry: this.control_registry });
        body.add(this.inspector);
        this.add(body);

        // â”€â”€ Status bar â”€â”€
        this._status_bar = new Control({ context, tag_name: 'div' });
        this._status_bar.add_class('designer-status');
        this._status_bar.add('Ready');
        this.add(this._status_bar);
    }

    _build_palette() {
        const { context } = this;
        const palette = new Control({ context, tag_name: 'div' });
        palette.add_class('designer-palette');
        const title = new Control({ context, tag_name: 'div' });
        title.add_class('palette-header');
        title.add('Controls');
        palette.add(title);
        const pointer_btn = new Control({ context, tag_name: 'button' });
        pointer_btn.add_class('palette-tool');
        pointer_btn.add_class('active');
        pointer_btn.dom.attributes['data-tool-id'] = 'pointer';
        pointer_btn.dom.attributes.type = 'button';
        const picon = new Control({ context, tag_name: 'span' });
        picon.add_class('palette-tool-icon');
        picon.add('\u21f1');
        pointer_btn.add(picon);
        const plbl = new Control({ context, tag_name: 'span' });
        plbl.add('Pointer');
        pointer_btn.add(plbl);
        palette.add(pointer_btn);
        const categories = this.control_registry.categories();
        for (const [cat_name, entries] of categories) {
            const group_hdr = new Control({ context, tag_name: 'div' });
            group_hdr.add_class('palette-group-header');
            group_hdr.add(cat_name);
            let added_group_header = false;
            for (const entry of entries) {
                if (entry.palette === false) continue;
                if (!added_group_header) {
                    palette.add(group_hdr);
                    added_group_header = true;
                }
                const btn = new Control({ context, tag_name: 'button' });
                btn.add_class('palette-tool');
                btn.dom.attributes['data-tool-id'] = entry.id;
                btn.dom.attributes.type = 'button';
                btn.dom.attributes.title = entry.label;
                const icon = new Control({ context, tag_name: 'span' });
                icon.add_class('palette-tool-icon');
                icon.add(entry.icon);
                btn.add(icon);
                const lbl = new Control({ context, tag_name: 'span' });
                lbl.add(entry.label);
                btn.add(lbl);
                palette.add(btn);
            }
        }
        return palette;
    }
    activate() {
        if (this.__activated) return;
        this.__activated = true;
        super.activate();
        const that = this;

        // Re-create models
        this.document_model = new Document_Model();
        this.selection_model = new Selection_Model();
        this.command_history = new Command_History();
        this.control_registry = create_default_registry();
        this.document_model.init_root();

        // Per-type counters for naming
        this._type_counters = {};

        // Clipboard
        this._clipboard = null;

        const root = this.dom.el;
        if (!root) return;

        this._palette_dom = root.querySelector('.designer-palette');
        this._surface_el = root.querySelector('.design-surface');
        this._canvas_el = root.querySelector('.design-canvas');
        this._mode_label_el = root.querySelector('.canvas-mode-label');
        this._inspector_panel_el = root.querySelector('.inspector-panel');
        this._inspector_title_el = root.querySelector('.inspector-title');
        this._inspector_props_el = root.querySelector('.inspector-props');
        this._inspector_subtitle_el = root.querySelector('.inspector-subtitle');
        this._undo_el = root.querySelector('.header-btn[title*="Undo"]');
        this._redo_el = root.querySelectorAll('.header-btn')[1];
        this._status_el = root.querySelector('.designer-status');
        this._body_el = root.querySelector('.designer-body');

        // Zoom state
        this._zoom = 1.0;

        this._mode = 'select';
        this._placement_type = null;
        this._items = new Map();
        this._grid_size = [8, 8];
        this._drag_state = null;
        this._resize_state = null;
        this._placement_state = null;

        // ── Settings ──
        this._settings = {
            show_grid: true,
            snap_to_grid: true,
            grid_size: 8,
            ghost_drag: false
        };
        this._viewport_presets = [
            { id: 'design', label: 'Design', width: null },
            { id: 'desktop', label: 'Desktop', width: 1280 },
            { id: 'tablet', label: 'Tablet', width: 900 },
            { id: 'mobile', label: 'Mobile', width: 430 }
        ];
        this._active_viewport_id = 'design';
        this._preview_width = null;

        // â”€â”€ Resizable inspector panel â”€â”€
        this._wire_inspector_resize();

        // â”€â”€ Inspector shell â”€â”€
        this._setup_inspector_shell();

        // â”€â”€ Canvas resize/move â”€â”€
        this._wire_canvas_resize_move();

        // â”€â”€ Menu bar â”€â”€
        this._wire_menubar();

        // â”€â”€ Context menu â”€â”€
        this._wire_context_menu();

        // â”€â”€ Wire everything â”€â”€
        this._wire_palette();
        this._wire_canvas();
        this._wire_keyboard();
        this._wire_document_model();
        this._wire_selection_model();
        this._wire_undo_redo();
        this._apply_document_meta();
        this._sync_active_viewport_from_width();
        this._update_viewport_toolbar();
        this._relayout_all();
        this._refresh_controls_list();
        this._clear_inspector();
        this._update_canvas_empty_state();
    }

    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    //  Inspector title bar + resizable width
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

    _setup_inspector_shell() {
        if (!this._inspector_panel_el) return;

        if (this._inspector_title_el) {
            this._inspector_title_el.textContent = 'Form Builder';
        }

        let summary = this._inspector_panel_el.querySelector('.inspector-summary');
        if (!summary) {
            summary = document.createElement('div');
            summary.className = 'inspector-summary';
            this._inspector_panel_el.insertBefore(summary, this._inspector_props_el);
        }

        let meta = this._inspector_panel_el.querySelector('.inspector-selection-meta');
        if (!meta) {
            meta = document.createElement('div');
            meta.className = 'inspector-selection-meta';
            summary.appendChild(meta);
        }

        let outline_header = this._inspector_panel_el.querySelector('.inspector-outline-header');
        if (!outline_header) {
            outline_header = document.createElement('div');
            outline_header.className = 'inspector-outline-header';
            outline_header.textContent = 'Form Outline';
            this._inspector_panel_el.insertBefore(outline_header, this._inspector_props_el);
        }

        let outline = this._inspector_panel_el.querySelector('.inspector-outline');
        if (!outline) {
            outline = document.createElement('div');
            outline.className = 'inspector-outline';
            this._inspector_panel_el.insertBefore(outline, this._inspector_props_el);
        }

        let props_header = this._inspector_panel_el.querySelector('.inspector-properties-header');
        if (!props_header) {
            props_header = document.createElement('div');
            props_header.className = 'inspector-properties-header';
            props_header.textContent = 'Properties';
            this._inspector_panel_el.insertBefore(props_header, this._inspector_props_el);
        }

        this._inspector_summary_el = summary;
        this._inspector_selection_meta_el = meta;
        this._inspector_outline_el = outline;
        this._inspector_properties_header_el = props_header;
    }

    _wire_inspector_resize() {
        if (!this._inspector_panel_el || !this._body_el) return;
        const handle = document.createElement('div');
        handle.className = 'inspector-resize-handle';
        this._inspector_panel_el.appendChild(handle);
        const that = this;
        let startX, startW;
        handle.addEventListener('mousedown', (e) => {
            startX = e.clientX;
            startW = this._inspector_panel_el.offsetWidth;
            e.preventDefault();
            const onMove = (ev) => {
                const dx = startX - ev.clientX;
                const newW = Math.max(180, Math.min(600, startW + dx));
                that._inspector_panel_el.style.width = newW + 'px';
                that._inspector_panel_el.style.minWidth = newW + 'px';
            };
            const onUp = () => {
                document.removeEventListener('mousemove', onMove);
                document.removeEventListener('mouseup', onUp);
            };
            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', onUp);
        });
    }

    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    //  Canvas resize/move + scrollbars
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

    _wire_canvas_resize_move() {
        if (!this._surface_el || !this._canvas_el) return;
        // Add canvas resize handle (bottom-right corner)
        const rh = document.createElement('div');
        rh.className = 'canvas-resize-handle';
        this._surface_el.appendChild(rh);
        const that = this;
        let startX, startY, startW, startH;
        rh.addEventListener('mousedown', (e) => {
            startX = e.clientX; startY = e.clientY;
            startW = that._surface_el.offsetWidth;
            startH = that._surface_el.offsetHeight;
            e.preventDefault(); e.stopPropagation();
            const onMove = (ev) => {
                const nw = Math.max(200, startW + (ev.clientX - startX));
                const nh = Math.max(150, startH + (ev.clientY - startY));
                that._surface_el.style.width = nw + 'px';
                that._surface_el.style.height = nh + 'px';
                that._preview_width = nw;
                that.document_model.canvas_width = nw;
                that.document_model.canvas_height = nh;
                that._sync_active_viewport_from_width();
                that._update_viewport_toolbar();
                that._relayout_all();
                that._update_canvas_empty_state();
            };
            const onUp = () => {
                document.removeEventListener('mousemove', onMove);
                document.removeEventListener('mouseup', onUp);
            };
            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', onUp);
        });
    }

    _expand_canvas_to_fill() {
        if (!this._surface_el || !this._canvas_el) return;
        const cs = getComputedStyle(this._canvas_el);
        const padL = parseFloat(cs.paddingLeft) || 0;
        const padR = parseFloat(cs.paddingRight) || 0;
        const padT = parseFloat(cs.paddingTop) || 0;
        const padB = parseFloat(cs.paddingBottom) || 0;
        // Subtract scrollbar width (typically 17px) and padding to prevent overflow
        const sbW = this._canvas_el.offsetWidth - this._canvas_el.clientWidth;
        const sbH = this._canvas_el.offsetHeight - this._canvas_el.clientHeight;
        const maxW = this._canvas_el.clientWidth - padL - padR - 2;
        const maxH = this._canvas_el.clientHeight - padT - padB - 2;
        const width = Math.max(200, maxW);
        const height = Math.max(150, maxH);
        this._surface_el.style.width = width + 'px';
        this._surface_el.style.height = height + 'px';
        this._preview_width = null;
        this.document_model.canvas_width = width;
        this.document_model.canvas_height = height;
        this._sync_active_viewport_from_width();
        this._update_viewport_toolbar();
        this._relayout_all();
        this._update_canvas_empty_state();
    }

    // Shell, file, settings, context-menu, and clipboard methods are mixed in below.

    // Export and style-token methods are mixed in below.

    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    //  Controls List Dropdown
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

    _get_node_caption(node) {
        if (!node) return '';
        if (node.control_type === 'form_container') {
            return node.properties.title || node.properties.name || 'Form';
        }
        const entry = this.control_registry.get(node.control_type);
        return node.properties.label ||
            node.properties.text ||
            node.properties.title ||
            node.properties.name ||
            (entry ? entry.label : node.control_type);
    }

    _collect_outline_rows(node, depth, rows) {
        rows.push({ node, depth });
        for (const child of node.children) {
            this._collect_outline_rows(child, depth + 1, rows);
        }
    }

    _refresh_controls_list() {
        if (!this._inspector_outline_el) return;

        const outline = this._inspector_outline_el;
        outline.innerHTML = '';

        const root = this.document_model.root;
        if (!root) return;

        const rows = [];
        this._collect_outline_rows(root, 0, rows);
        const selected = new Set(this.selection_model.get_selected());

        for (const row of rows) {
            const { node, depth } = row;
            const entry = this.control_registry.get(node.control_type);
            const item = document.createElement('button');
            item.type = 'button';
            item.className = 'outline-item';
            item.style.paddingLeft = (12 + depth * 14) + 'px';
            if (selected.has(node.id)) item.classList.add('selected');
            if (entry && entry.is_container) item.classList.add('container');

            const icon = document.createElement('span');
            icon.className = 'outline-icon';
            icon.textContent = node.control_type === 'form_container' ? '▤' : (entry ? entry.icon : '•');
            item.appendChild(icon);

            const label = document.createElement('span');
            label.className = 'outline-label';
            label.textContent = this._get_node_caption(node);
            item.appendChild(label);

            if (node.control_type !== 'form_container' && node.properties.name) {
                const meta = document.createElement('span');
                meta.className = 'outline-meta';
                meta.textContent = node.properties.name;
                item.appendChild(meta);
            }

            item.addEventListener('click', () => {
                this.selection_model.select_exclusive(node.id);
                if (this._canvas_el) this._canvas_el.focus();
            });
            outline.appendChild(item);
        }

        this._refresh_inspector_summary();
    }

    _refresh_inspector_summary() {
        if (!this._inspector_selection_meta_el) return;
        const selected = this.selection_model.get_selected();
        const total = Math.max(0, this.document_model.nodes.size - 1);

        if (selected.length === 0) {
            this._inspector_selection_meta_el.textContent = `${total} controls in this form`;
            return;
        }

        if (selected.length > 1) {
            this._inspector_selection_meta_el.textContent = `${selected.length} controls selected`;
            return;
        }

        const node = this.document_model.get_node(selected[0]);
        if (!node) {
            this._inspector_selection_meta_el.textContent = `${total} controls in this form`;
            return;
        }

        if (node.control_type === 'form_container') {
            this._inspector_selection_meta_el.textContent = 'Form settings and document metadata';
            return;
        }

        const parent = this.document_model.get_parent(node.id);
        const parent_caption = parent ? this._get_node_caption(parent) : 'Form';
        this._inspector_selection_meta_el.textContent = `Inside ${parent_caption}`;
    }

    _apply_document_meta() {
        if (!this._surface_el) return;
        const width = this._preview_width || this.document_model.canvas_width || 800;
        const height = this.document_model.canvas_height || 600;
        this._surface_el.style.width = width + 'px';
        this._surface_el.style.height = height + 'px';
        if (this.dom && this.dom.el && this.document_model.root) {
            this.dom.el.setAttribute('data-style-preset', this.document_model.root.properties.style_preset || 'studio_blue');
        }
        if (this.document_model.canvas_background) {
            this._surface_el.style.backgroundColor = this.document_model.canvas_background;
        }
    }

    // Layout, responsive spacing, and host-resolution methods are mixed in below.
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    //  Palette
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

    _wire_palette() {
        const that = this;
        if (!this._palette_dom) return;
        this._palette_dom.addEventListener('click', (e) => {
            const btn = e.target.closest('.palette-tool');
            if (!btn) return;
            const tool_id = btn.getAttribute('data-tool-id');
            if (!tool_id) return;
            that._palette_dom.querySelectorAll('.palette-tool').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            if (tool_id === 'pointer') {
                that._mode = 'select'; that._placement_type = null;
                if (that._surface_el) that._surface_el.style.cursor = 'default';
                if (that._mode_label_el) that._mode_label_el.textContent = 'Select';
            } else {
                that._mode = 'place'; that._placement_type = tool_id;
                if (that._surface_el) that._surface_el.style.cursor = 'crosshair';
                const entry = that.control_registry.get(tool_id);
                if (that._mode_label_el) that._mode_label_el.textContent = 'Place: ' + (entry ? entry.label : tool_id);
            }
        });
    }

    _reset_to_pointer() {
        this._mode = 'select'; this._placement_type = null;
        if (this._surface_el) this._surface_el.style.cursor = 'default';
        if (this._mode_label_el) this._mode_label_el.textContent = 'Select';
        if (this._palette_dom) {
            this._palette_dom.querySelectorAll('.palette-tool').forEach(b => b.classList.remove('active'));
            const ptr = this._palette_dom.querySelector('[data-tool-id="pointer"]');
            if (ptr) ptr.classList.add('active');
        }
    }

    // Canvas interaction, zoom, viewport toolbar, and keyboard methods are mixed in below.

    // ═══════════════════════════════════════════════════════
    //  Control Naming and Placement
    // ═══════════════════════════════════════════════════════

    _next_name(control_type) {
        if (!this._type_counters) this._type_counters = {};
        if (this._type_counters[control_type] == null) this._type_counters[control_type] = 0;
        return control_type + '_' + this._type_counters[control_type]++;
    }

    _default_control_properties(control_type) {
        switch (control_type) {
            case 'text_input':
                return { label: 'Text Input', placeholder: 'Enter text', width_policy: 'fill' };
            case 'textarea':
                return { label: 'Long Answer', placeholder: 'Type your response', width_policy: 'fill', span_desktop: 2, span_tablet: 2, span_mobile: 1 };
            case 'number_input':
                return { label: 'Quantity', placeholder: '0', min: 0, step: 1, width_policy: 'fill' };
            case 'checkbox':
                return { label: 'I agree to the terms', width_policy: 'fit' };
            case 'radio':
                return { label: 'Choice A', group_name: 'radio_group_0', width_policy: 'fit' };
            case 'select':
                return { label: 'Select', options: 'Option A\nOption B\nOption C', width_policy: 'fill' };
            case 'date_picker':
                return { label: 'Date', width_policy: 'fill' };
            case 'toggle_switch':
                return { label: 'Enable notifications', width_policy: 'fit' };
            case 'color_picker':
                return { label: 'Accent Color', value: '#2563eb', width_policy: 'fill' };
            case 'button':
                return { label: 'Continue', variant: 'primary', width_policy: 'fill', span_desktop: 2, span_tablet: 2, span_mobile: 1 };
            case 'label':
                return { text: 'Section heading', width_policy: 'fill', span_desktop: 2, span_tablet: 2, span_mobile: 1 };
            case 'panel':
                return {
                    title: 'Contact Details',
                    description: 'Group related fields into a clean section.',
                    width_policy: 'fill',
                    spacing_mode: 'semantic',
                    density: 'balanced',
                    inset_style: 'panel',
                    section_separation: 'medium',
                    layout_mode: 'grid',
                    columns_desktop: 2,
                    columns_tablet: 2,
                    columns_mobile: 1,
                    span_desktop: 2,
                    span_tablet: 2,
                    span_mobile: 1,
                    background_color: '#ffffff',
                    show_border: true
                };
            case 'group_box':
                return { title: 'Address', width_policy: 'fill', spacing_mode: 'semantic', density: 'balanced', inset_style: 'panel', section_separation: 'medium', layout_mode: 'grid', columns_desktop: 2, columns_tablet: 2, columns_mobile: 1, span_desktop: 2, span_tablet: 2, span_mobile: 1 };
            case 'tabbed_panel':
                return { tabs: 'Details\nReview', width_policy: 'fill', spacing_mode: 'semantic', density: 'balanced', inset_style: 'panel', section_separation: 'medium', layout_mode: 'grid', columns_desktop: 2, columns_tablet: 2, columns_mobile: 1, span_desktop: 2, span_tablet: 2, span_mobile: 1 };
            case 'split_pane':
                return { orientation: 'horizontal', split_position: 50, width_policy: 'fill', spacing_mode: 'semantic', density: 'balanced', inset_style: 'panel', section_separation: 'medium', span_desktop: 2, span_tablet: 2, span_mobile: 1 };
            case 'accordion':
                return { sections: 'Section 1\nSection 2', width_policy: 'fill', spacing_mode: 'semantic', density: 'balanced', inset_style: 'panel', section_separation: 'medium', layout_mode: 'vertical', span_desktop: 2, span_tablet: 2, span_mobile: 1 };
            case 'progress_bar':
                return { label: 'Completion', value: 65, show_text: true, width_policy: 'fill' };
            case 'gauge':
                return { label: 'Score', value: 65, min: 0, max: 100, width_policy: 'fit' };
            default:
                return {};
        }
    }

    _get_auto_layout_insert_index(parent_id, x, y) {
        const parent = this.document_model.get_node(parent_id);
        if (!parent || !parent.children || parent.children.length === 0) return -1;
        const mode = parent.properties && parent.properties.layout_mode ? parent.properties.layout_mode : 'none';
        if (mode === 'none') return -1;

        for (let i = 0; i < parent.children.length; i++) {
            const child = parent.children[i];
            const el = this._items.get(child.id);
            if (!el) continue;
            const left = parseInt(el.style.left, 10) || 0;
            const top = parseInt(el.style.top, 10) || 0;
            const width = parseInt(el.style.width, 10) || el.offsetWidth || 0;
            const height = parseInt(el.style.height, 10) || el.offsetHeight || 0;
            const mid_x = left + width / 2;
            const mid_y = top + height / 2;

            if (mode === 'vertical') {
                if (y < mid_y) return i;
                continue;
            }

            const same_row = y >= (top - height * 0.25) && y <= (top + height * 1.25);
            if (y < mid_y || (same_row && x < mid_x)) return i;
        }

        return -1;
    }

    _place_control(control_type, x, y, w, h, parent_id) {
        const entry = this.control_registry.get(control_type);
        if (!entry) return;
        if (w == null) { var ds2 = entry.default_size; w = ds2[0]; h = ds2[1]; }
        const name = this._next_name(control_type);
        const resolved_parent_id = parent_id || this.document_model.root.id;
        const index = this._get_auto_layout_insert_index(resolved_parent_id, x, y);
        this._place_control_with_props(control_type, {
            ...this._default_control_properties(control_type),
            name: name,
            visible: true,
            enabled: true,
            x: x,
            y: y,
            width: w,
            height: h
        }, resolved_parent_id, true, index);
    }

    _place_control_with_props(control_type, properties, parent_id, select_after = true, index = -1) {
        const node_id = this.document_model._generate_id();
        const cmd = new AddControlCommand(this.document_model, {
            node_id: node_id, control_type: control_type,
            parent_id: parent_id || this.document_model.root.id,
            index: index, properties: properties
        });
        this.command_history.execute(cmd);
        if (select_after) this.selection_model.select_exclusive(node_id);
        return node_id;
    }

    _paste_serialized_subtree(data, parent_id, anchor, is_root) {
        const props = { ...data.properties };
        props.x = is_root ? anchor.root_x : (props.x || 0);
        props.y = is_root ? anchor.root_y : (props.y || 0);
        props.name = this._next_name(data.control_type);

        const node_id = this._place_control_with_props(data.control_type, props, parent_id, false);
        for (const child of (data.children || [])) {
            this._paste_serialized_subtree(child, node_id, {
                root_x: (child.properties.x || 0),
                root_y: (child.properties.y || 0),
                source_root_x: anchor.source_root_x,
                source_root_y: anchor.source_root_y
            }, false);
        }
        return node_id;
    }

    _render_surface_item(node) {
        if (!this._surface_el) return;
        const entry = this.control_registry.get(node.control_type);
        const el = document.createElement('div');
        el.className = 'design-surface-item';
        el.setAttribute('data-node-id', node.id);
        el.setAttribute('data-control-type', node.control_type);
        if (entry && entry.is_container) el.setAttribute('data-container', 'true');
        el.style.cssText = 'position:absolute; left:' + (node.properties.x || 0) + 'px; top:' + (node.properties.y || 0) + 'px; width:' + (node.properties.width || 100) + 'px; height:' + (node.properties.height || 32) + 'px;';
        const inner = document.createElement('div');
        inner.className = 'dsi-inner';
        inner.appendChild(this._create_wysiwyg_element(node.control_type, node.properties, entry));
        el.appendChild(inner);
        this._get_render_host(node.parent_id).appendChild(el);
        this._items.set(node.id, el);
        for (const child of node.children) {
            this._render_surface_item(child);
        }
    }

    _create_wysiwyg_element(control_type, props, entry) {
        return createWysiwygElement(control_type, props, entry);
    }

    _refresh_wysiwyg_element(el, node) {
        const inner = el.querySelector('.dsi-inner');
        if (!inner) return;
        const entry = this.control_registry.get(node.control_type);
        const old_host = inner.querySelector('[data-children-host="true"]');
        const preserved_children = old_host ? Array.from(old_host.children) : [];
        inner.innerHTML = '';
        inner.appendChild(this._create_wysiwyg_element(node.control_type, node.properties, entry));
        const new_host = inner.querySelector('[data-children-host="true"]');
        if (new_host) {
            for (const child of preserved_children) {
                new_host.appendChild(child);
            }
        }
    }

    // Selection overlays and quick-edit methods are mixed in below.

    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    //  Document Model Wiring
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

    _remove_rendered_subtree(node) {
        for (const child of node.children) {
            this._remove_rendered_subtree(child);
        }
        const el = this._items.get(node.id);
        if (el) el.remove();
        this._items.delete(node.id);
    }

    _wire_document_model() {
        const that = this;
        this.document_model.on('node-added', (e) => {
            that._render_surface_item(e.node);
            that._sync_parent_render_order(e.parent_id);
            that._relayout_all();
            that._refresh_controls_list();
            that._update_canvas_empty_state();
        });
        this.document_model.on('node-removed', (e) => {
            that._remove_rendered_subtree(e.node);
            if (e.node.parent_id) that._sync_parent_render_order(e.node.parent_id);
            that._relayout_all();
            that._refresh_controls_list();
            that._update_canvas_empty_state();
        });
        this.document_model.on('node-moved', (e) => {
            const el = that._items.get(e.node.id);
            const host = that._get_render_host(e.new_parent_id);
            if (el && host && el.parentNode !== host) {
                host.appendChild(el);
            }
            if (e.old_parent_id) that._sync_parent_render_order(e.old_parent_id);
            if (e.new_parent_id) that._sync_parent_render_order(e.new_parent_id);
            that._relayout_all();
            that._refresh_controls_list();
            that._update_canvas_empty_state();
        });
        this.document_model.on('property-changed', (e) => {
            const node = that.document_model.get_node(e.node_id);
            const el = that._items.get(e.node_id);

            if (el && node) {
                if (e.key === 'x') el.style.left = node.properties.x + 'px';
                if (e.key === 'y') el.style.top = node.properties.y + 'px';
                if (e.key === 'width') el.style.width = node.properties.width + 'px';
                if (e.key === 'height') el.style.height = node.properties.height + 'px';
                if (!['x', 'y', 'width', 'height'].includes(e.key)) {
                    that._refresh_wysiwyg_element(el, node);
                }
            }

            if (['name', 'label', 'text', 'title'].includes(e.key) || e.node_id === (that.document_model.root && that.document_model.root.id)) {
                that._refresh_controls_list();
            }

            const sel = that.selection_model.get_selected();
            if (sel.length === 1 && sel[0] === e.node_id) {
                that._sync_inspector_field(e.key, node ? node.properties[e.key] : null);
                if (node && ['label', 'text', 'title', 'name'].includes(e.key) && that._inspector_subtitle_el) {
                    that._inspector_subtitle_el.textContent = that._get_node_caption(node);
                }
            }

            const selected_node = sel.length === 1 ? that.document_model.get_node(sel[0]) : null;
            if (selected_node && (e.key === 'layout_mode' || e.node_id === selected_node.id || e.node_id === selected_node.parent_id)) {
                that._load_inspector(selected_node.id);
            }

            that._apply_document_meta();
            that._relayout_all();
            that._update_viewport_toolbar();
            that._refresh_inspector_summary();
            that._update_canvas_empty_state();
        });
        this.document_model.on('document-loaded', () => {
            for (const child of Array.from(that._items.values())) {
                child.remove();
            }
            that._items.clear();
            if (that.document_model.root) {
                for (const child of that.document_model.root.children) {
                    that._render_surface_item(child);
                }
            }
            that._sync_active_viewport_from_width();
            that._apply_document_meta();
            that._update_viewport_toolbar();
            that._relayout_all();
            that._refresh_controls_list();
            that._update_canvas_empty_state();
        });
    }

    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    //  Selection Wiring
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

    _wire_selection_model() {
        const that = this;
        this.selection_model.on('change', (e) => {
            for (const [id, el] of that._items) el.classList.toggle('selected', that.selection_model.is_selected(id));
            that._refresh_selection_overlays();
            const sel = e.selected;
            if (sel.length === 1) that._load_inspector(sel[0]);
            else that._clear_inspector();
            that._refresh_controls_list();
            if (that._status_el) {
                if (sel.length === 0) that._status_el.textContent = 'Ready';
                else if (sel.length === 1) {
                    const node = that.document_model.get_node(sel[0]);
                    const entry = node ? that.control_registry.get(node.control_type) : null;
                    if (node && node.control_type === 'form_container') {
                        that._status_el.textContent = 'Selected: Form settings';
                    } else {
                        that._status_el.textContent = `Selected: ${entry ? entry.label : 'unknown'} (${node ? node.properties.name : ''})`;
                    }
                } else that._status_el.textContent = `Selected: ${sel.length} controls`;
            }
        });
    }

    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    //  Undo/Redo
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

    _wire_undo_redo() {
        const that = this;
        if (this._undo_el) this._undo_el.addEventListener('click', () => that.command_history.undo());
        if (this._redo_el) this._redo_el.addEventListener('click', () => that.command_history.redo());
        this.command_history.on('state-change', () => {
            if (that._undo_el) that._undo_el.disabled = !that.command_history.can_undo();
            if (that._redo_el) that._redo_el.disabled = !that.command_history.can_redo();
        });
    }

    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    //  Inspector
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

    _current_inspector_node_id = null;
    _inspector_editors = [];

    _load_inspector(node_id) {
        this._current_inspector_node_id = node_id;
        this._inspector_editors = [];
        const c = this._inspector_props_el;
        if (!c) return;
        c.innerHTML = '';
        const node = this.document_model.get_node(node_id);
        if (!node) return;
        const entry = this.control_registry.get(node.control_type);
        if (this._inspector_subtitle_el) this._inspector_subtitle_el.textContent = this._get_node_caption(node);
        const schema = entry ? entry.property_schema : [];
        const parent_layout_mode = this._get_parent_layout_mode(node);
        const node_layout_mode = node.properties.layout_mode || 'none';
        const width_policy = this._get_width_policy(node);
        const spacing_mode = this._get_spacing_mode(node);
        if (schema.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'inspector-empty';
            empty.textContent = 'No editable properties for this item yet.';
            c.appendChild(empty);
            this._refresh_inspector_summary();
            return;
        }
        for (const group of schema) {
            const visible_fields = group.fields.filter((field) => {
                if (parent_layout_mode !== 'none' && ['x', 'y'].includes(field.key)) return false;
                if (field.key === 'width' && parent_layout_mode !== 'none' && width_policy === 'fill') return false;
                if (field.key === 'width_policy' && parent_layout_mode === 'none') return false;
                if ((field.key === 'spacing_before' || field.key === 'spacing_after') && parent_layout_mode === 'none') return false;
                if (field.key === 'spacing_mode' && node.control_type !== 'form_container' && node_layout_mode === 'none') return false;
                if ((field.key === 'density' || field.key === 'inset_style') && (spacing_mode !== 'semantic' || node_layout_mode === 'none')) return false;
                if (field.key === 'new_row' && parent_layout_mode !== 'grid') return false;
                if (field.key.indexOf('span_') === 0 && parent_layout_mode !== 'grid') return false;
                if (field.key === 'min_width' && parent_layout_mode !== 'grid') return false;
                if ((field.key === 'padding' || field.key === 'gap') && (node_layout_mode === 'none' || spacing_mode !== 'exact')) return false;
                if (field.key.indexOf('columns_') === 0 && node_layout_mode !== 'grid') return false;
                return true;
            });
            if (visible_fields.length === 0) continue;
            const hdr = document.createElement('div');
            hdr.className = 'inspector-group-header';
            hdr.textContent = group.group;
            c.appendChild(hdr);
            for (const field of visible_fields) {
                const row = document.createElement('div');
                row.className = 'inspector-row';
                const lbl = document.createElement('label');
                lbl.className = 'inspector-label';
                lbl.textContent = field.label;
                row.appendChild(lbl);
                const ed = document.createElement('div');
                ed.className = 'inspector-editor';
                ed.appendChild(this._create_inspector_input(field, node.properties[field.key], node_id));
                row.appendChild(ed);
                c.appendChild(row);
            }
        }
    }

    _create_inspector_input(field, value, node_id) {
        const built = createInspectorInput({
            field,
            value,
            node_id,
            onChange: (resolved_node_id, key, next_value) => this._on_inspector_change(resolved_node_id, key, next_value)
        });
        this._inspector_editors.push(built.editor);
        return built.element;
    }

    _on_inspector_change(node_id, key, new_value) {
        const node = this.document_model.get_node(node_id);
        if (!node) return;
        this.command_history.execute(new ChangePropertyCommand(this.document_model, {
            node_id, key, old_value: node.properties[key], new_value
        }));
    }

    _sync_inspector_field(key, value) {
        // Map layout property keys to their inspector field keys
        const field_map = { x: 'x', y: 'y', width: 'width', height: 'height' };
        const field_key = field_map[key] || key;
        if (!this._inspector_editors) return;
        for (const editor of this._inspector_editors) {
            if (editor.key === field_key) {
                if (editor.type === 'boolean') editor.input.checked = !!value;
                else if (editor.type === 'custom' && typeof editor.set_value === 'function') editor.set_value(value);
                else editor.input.value = value != null ? value : '';
                break;
            }
        }
    }

    _clear_inspector() {
        this._current_inspector_node_id = null;
        this._inspector_editors = [];
        if (this._inspector_props_el) {
            this._inspector_props_el.innerHTML = '<div class="inspector-empty"><strong>Select a field or section.</strong><span>Properties, validation, and layout controls appear here when a single item is selected.</span></div>';
        }
        if (this._inspector_subtitle_el) this._inspector_subtitle_el.textContent = 'Nothing selected';
        this._refresh_inspector_summary();
    }
}
Object.assign(
    Designer_App.prototype,
    designerShellMethods,
    designerExportMethods,
    designerLayoutMethods,
    designerCanvasInteractionMethods,
    designerOverlayMethods
);
Designer_App.css = designerAppCss;

jsgui.controls.Designer_App = Designer_App;
jsgui.controls.Design_Canvas = Design_Canvas;
jsgui.controls.Inspector_Panel = Inspector_Panel;
const Design_Surface_Item = require('./controls/Design_Surface_Item');
jsgui.controls.Design_Surface_Item = Design_Surface_Item;
module.exports = jsgui;
