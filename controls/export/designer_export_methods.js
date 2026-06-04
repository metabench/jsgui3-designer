'use strict';

module.exports = {
    _download_json(filename, data) {
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 0);
    },

    _get_style_tokens(style_preset) {
        if (style_preset === 'studio_blue') {
            return {
                typography: {
                    ui_font: 'Segoe UI Variable Text, Segoe UI, Tahoma, sans-serif',
                    heading_weight: 700,
                    body_weight: 500
                },
                color: {
                    chrome_top: '#f3f7fc',
                    chrome_bottom: '#dbe6f3',
                    accent: '#2d5f9b',
                    accent_soft: '#dce9f7',
                    panel_fill: '#f8fbff',
                    canvas_fill: '#e7edf5',
                    border: '#9fb2c7',
                    text: '#21364d',
                    muted_text: '#607287'
                },
                shape: {
                    control_radius: 8,
                    panel_radius: 10,
                    field_radius: 7
                },
                finish: {
                    panel_shadow: '0 14px 28px rgba(28, 47, 74, 0.12)',
                    input_shadow: 'inset 0 1px 0 rgba(255,255,255,0.85)'
                },
                spacing: {
                    none: 0,
                    small: 8,
                    medium: 16,
                    large: 24
                },
                density: {
                    compact: { field_gap: 10, section_gap: 16, padding: 14 },
                    balanced: { field_gap: 16, section_gap: 24, padding: 20 },
                    airy: { field_gap: 24, section_gap: 32, padding: 28 }
                },
                inset: {
                    flush: { padding_adjust: -10, host_margin: 6 },
                    padded: { padding_adjust: 0, host_margin: 10 },
                    panel: { padding_adjust: 8, host_margin: 12 }
                },
                direction: 'Modernized blue-gray productivity UI with subtle gradients, crisp separators, and restrained bevels inspired by Visual Studio and Excel circa 2005.'
            };
        }

        return {};
    },

    _serialize_layout_for_ai(node) {
        const props = node.properties || {};
        const parent = this.document_model.get_parent(node.id);
        const parent_layout_mode = parent && parent.properties ? (parent.properties.layout_mode || 'none') : 'none';
        const layout = {
            width: props.width != null ? Number(props.width) : null,
            height: props.height != null ? Number(props.height) : null
        };

        if (parent_layout_mode === 'none' && node.control_type !== 'form_container') {
            layout.mode = 'absolute';
            layout.x = props.x != null ? Number(props.x) : 0;
            layout.y = props.y != null ? Number(props.y) : 0;
        } else if (node.control_type !== 'form_container') {
            layout.mode = 'responsive-item';
            layout.width_policy = this._get_width_policy(node);
            layout.span = {
                desktop: this._get_responsive_value(props, 'span', 'desktop', 1),
                tablet: this._get_responsive_value(props, 'span', 'tablet', 1),
                mobile: this._get_responsive_value(props, 'span', 'mobile', 1)
            };
            if (props.new_row) layout.new_row = true;
            if (props.min_width != null && props.min_width !== '') {
                layout.min_width = Number(props.min_width);
            }
            if (props.spacing_before && props.spacing_before !== 'inherit') {
                layout.spacing_before = props.spacing_before;
            }
            if (props.spacing_after && props.spacing_after !== 'inherit') {
                layout.spacing_after = props.spacing_after;
            }
        } else {
            layout.mode = 'form-surface';
        }

        if (this._is_container_node(node)) {
            const spacing_mode = this._get_spacing_mode(node);
            const semantic_spacing = this._resolve_container_semantic_spacing(node);
            layout.container = {
                layout_mode: props.layout_mode || 'none',
                spacing_mode,
                padding: semantic_spacing.padding,
                gap: semantic_spacing.gap,
                columns: {
                    desktop: this._get_responsive_value(props, 'columns', 'desktop', 1),
                    tablet: this._get_responsive_value(props, 'columns', 'tablet', 1),
                    mobile: this._get_responsive_value(props, 'columns', 'mobile', 1)
                }
            };
            if (spacing_mode === 'semantic') {
                layout.container.density = semantic_spacing.density;
                layout.container.inset_style = semantic_spacing.inset_style;
                layout.container.section_separation = semantic_spacing.section_separation;
            }
            if (props.surface_max_width != null && props.surface_max_width !== '') {
                layout.container.max_width = Number(props.surface_max_width);
            }
        }

        return layout;
    },

    _serialize_node_for_ai(node) {
        const entry = this.control_registry.get(node.control_type);
        const props = node.properties || {};
        const component = {
            id: node.id,
            type: node.control_type,
            title: entry ? entry.label : node.control_type,
            name: props.name || null,
            visible: props.visible !== false,
            enabled: props.enabled !== false,
            layout: this._serialize_layout_for_ai(node)
        };

        const content = {};
        if (props.title) content.title = props.title;
        if (props.description) content.description = props.description;
        if (props.text) content.text = props.text;
        if (props.label) content.label = props.label;
        if (props.placeholder) content.placeholder = props.placeholder;
        if (props.helper_text) content.helper_text = props.helper_text;
        if (props.submit_label) content.submit_label = props.submit_label;
        if (Object.keys(content).length > 0) component.content = content;

        const behavior = {};
        if (props.required != null) behavior.required = !!props.required;
        if (props.checked != null) behavior.checked = !!props.checked;
        if (props.max_length != null && props.max_length !== '') behavior.max_length = Number(props.max_length);
        if (props.autocomplete) behavior.autocomplete = props.autocomplete;
        if (props.min != null && props.min !== '') behavior.min = Number(props.min);
        if (props.max != null && props.max !== '') behavior.max = Number(props.max);
        if (props.step != null && props.step !== '') behavior.step = Number(props.step);
        if (props.value != null && props.value !== '') behavior.default_value = props.value;
        if (props.group_name) behavior.group_name = props.group_name;
        if (Object.keys(behavior).length > 0) component.behavior = behavior;

        if (props.options) component.options = this._parse_lines(props.options);
        if (props.tabs) component.tabs = this._parse_lines(props.tabs);
        if (props.sections) component.sections = this._parse_lines(props.sections);

        const appearance = {};
        if (props.variant) appearance.variant = props.variant;
        if (props.background_color) appearance.background_color = props.background_color;
        if (props.show_border != null) appearance.show_border = !!props.show_border;
        if (props.orientation) appearance.orientation = props.orientation;
        if (props.split_position != null && props.split_position !== '') {
            appearance.split_position = Number(props.split_position);
        }
        if (Object.keys(appearance).length > 0) component.appearance = appearance;

        if (node.children.length > 0) {
            component.children = node.children.map(child => this._serialize_node_for_ai(child));
        }

        return component;
    },

    _file_export_ai() {
        if (!this.document_model.root) return;
        const root = this.document_model.root;
        const style_preset = root.properties.style_preset || 'studio_blue';
        const data = {
            schema: 'jsgui3.ai-form/v2',
            version: 2,
            exported_at: new Date().toISOString(),
            intent: 'Semantic form-design export for recreating this UI inside a full application without coupling to a specific data-binding system.',
            data_binding: null,
            style_preset,
            style_tokens: this._get_style_tokens(style_preset),
            breakpoints: this._viewport_presets
                .filter(preset => preset.width != null)
                .reduce((acc, preset) => {
                    acc[preset.id] = preset.width;
                    return acc;
                }, {}),
            canvas: {
                width: this.document_model.canvas_width,
                height: this.document_model.canvas_height,
                background: this.document_model.canvas_background,
                grid_size: this.document_model.grid_size.slice()
            },
            form: {
                id: root.id,
                name: root.properties.name || null,
                title: root.properties.title || 'Untitled Form',
                description: root.properties.description || '',
                submit_label: root.properties.submit_label || 'Submit',
                layout: this._serialize_layout_for_ai(root),
                components: root.children.map(child => this._serialize_node_for_ai(child))
            },
            implementation_guidance: {
                preferred_layout_engine: 'CSS grid and flexbox',
                accessibility: 'Use semantic labels, field grouping, and keyboard-safe focus order.',
                note: 'Preserve the responsive spans and container layout settings; attach bindings later in the host application.'
            }
        };

        this._download_json('design.form.ai.json', data);
        this._status_el.textContent = 'Exported AI JSON';
    }
};
