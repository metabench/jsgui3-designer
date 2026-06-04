/**
 * Control_Registry — Data-driven control catalog (Ch 6).
 *
 * Maps control type IDs to metadata: label, icon, category,
 * default_size, is_container, and property_schema.
 *
 * The palette is built from this registry, and the inspector
 * looks up property schemas from it.
 */

'use strict';

class Control_Registry {
    constructor() {
        this._entries = new Map();
    }

    register(entry) {
        this._entries.set(entry.id, entry);
    }

    get(id) {
        return this._entries.get(id);
    }

    all() {
        return Array.from(this._entries.values());
    }

    categories() {
        const cats = new Map();
        for (const entry of this._entries.values()) {
            const cat = entry.category || 'Other';
            if (!cats.has(cat)) cats.set(cat, []);
            cats.get(cat).push(entry);
        }
        return cats;
    }
}

// ── Shared property groups ──────────────────────────────────────────

const COMMON_FIELDS = [
    { key: 'name', label: 'Name', type: 'text', required: true },
    { key: 'visible', label: 'Visible', type: 'boolean' },
    { key: 'enabled', label: 'Enabled', type: 'boolean' },
];

const LAYOUT_FIELDS = [
    { key: 'x', label: 'Left', type: 'number' },
    { key: 'y', label: 'Top', type: 'number' },
    { key: 'width', label: 'Width', type: 'number', min: 20 },
    { key: 'height', label: 'Height', type: 'number', min: 16 },
];

const RESPONSIVE_ITEM_FIELDS = [
    { key: 'span_desktop', label: 'Desktop Span', type: 'number', min: 1, max: 12 },
    { key: 'span_tablet', label: 'Tablet Span', type: 'number', min: 1, max: 12 },
    { key: 'span_mobile', label: 'Mobile Span', type: 'number', min: 1, max: 12 },
    {
        key: 'width_policy', label: 'Width Policy', type: 'enum',
        options: ['fill', 'fit', 'fixed']
    },
    { key: 'new_row', label: 'Start New Row', type: 'boolean' },
    { key: 'min_width', label: 'Min Width', type: 'number', min: 0 },
];

const SPACING_ITEM_FIELDS = [
    {
        key: 'spacing_before', label: 'Space Before', type: 'enum',
        options: ['inherit', 'none', 'small', 'medium', 'large'], presentation: 'chips'
    },
    {
        key: 'spacing_after', label: 'Space After', type: 'enum',
        options: ['inherit', 'none', 'small', 'medium', 'large'], presentation: 'chips'
    },
];

const RESPONSIVE_CONTAINER_FIELDS = [
    {
        key: 'layout_mode', label: 'Layout', type: 'enum',
        options: ['none', 'vertical', 'horizontal', 'grid']
    },
    { key: 'padding', label: 'Padding', type: 'number', min: 0 },
    { key: 'gap', label: 'Gap', type: 'number', min: 0 },
    { key: 'columns_desktop', label: 'Desktop Columns', type: 'number', min: 1, max: 12 },
    { key: 'columns_tablet', label: 'Tablet Columns', type: 'number', min: 1, max: 12 },
    { key: 'columns_mobile', label: 'Mobile Columns', type: 'number', min: 1, max: 12 },
];

const SPACING_CONTAINER_FIELDS = [
    {
        key: 'spacing_mode', label: 'Spacing Mode', type: 'enum',
        options: ['semantic', 'exact'], presentation: 'chips'
    },
    {
        key: 'density', label: 'Density', type: 'enum',
        options: ['compact', 'balanced', 'airy'], presentation: 'chips'
    },
    {
        key: 'inset_style', label: 'Inset Style', type: 'enum',
        options: ['flush', 'padded', 'panel'], presentation: 'chips'
    },
    {
        key: 'section_separation', label: 'Section Separation', type: 'enum',
        options: ['none', 'small', 'medium', 'large'], presentation: 'chips'
    },
];

function make_schema(extra_groups = [], options = {}) {
    const spacing_fields = [...SPACING_ITEM_FIELDS];
    if (options.include_container_spacing) {
        spacing_fields.push(...SPACING_CONTAINER_FIELDS);
    }
    return [
        { group: 'Common', fields: [...COMMON_FIELDS] },
        ...extra_groups,
        { group: 'Spacing', fields: spacing_fields },
        { group: 'Responsive', fields: [...RESPONSIVE_ITEM_FIELDS] },
        { group: 'Layout', fields: [...LAYOUT_FIELDS] },
    ];
}

// ── Default registry ────────────────────────────────────────────────

function create_default_registry() {
    const registry = new Control_Registry();

    registry.register({
        id: 'form_container', label: 'Form', icon: '▤', category: 'Form',
        palette: false, default_size: [800, 600], is_container: true, resizable: false,
        property_schema: [
            {
                group: 'Form', fields: [
                    { key: 'name', label: 'Name', type: 'text', required: true },
                    { key: 'title', label: 'Title', type: 'text' },
                    { key: 'description', label: 'Description', type: 'textarea' },
                    { key: 'submit_label', label: 'Submit Label', type: 'text' },
                    { key: 'style_preset', label: 'Style Preset', type: 'enum', options: ['studio_blue'] },
                ]
            },
            {
                group: 'Spacing', fields: [
                    ...SPACING_CONTAINER_FIELDS
                ]
            },
            {
                group: 'Responsive Layout', fields: [
                    ...RESPONSIVE_CONTAINER_FIELDS,
                    { key: 'surface_max_width', label: 'Max Content Width', type: 'number', min: 320 },
                ]
            }
        ]
    });

    // ── Input Controls ──────────────────────────────────

    registry.register({
        id: 'text_input', label: 'Text Input', icon: '▬', category: 'Input Controls',
        default_size: [260, 72], is_container: false, resizable: true,
        property_schema: make_schema([
            {
                group: 'Text', fields: [
                    { key: 'label', label: 'Label', type: 'text' },
                    { key: 'placeholder', label: 'Placeholder', type: 'text' },
                    { key: 'helper_text', label: 'Help Text', type: 'textarea' },
                    { key: 'value', label: 'Default Value', type: 'text' },
                    { key: 'required', label: 'Required', type: 'boolean' },
                    { key: 'max_length', label: 'Max Length', type: 'number', min: 0 },
                    { key: 'autocomplete', label: 'Autocomplete', type: 'text' },
                ]
            }
        ])
    });

    registry.register({
        id: 'textarea', label: 'Textarea', icon: '☰', category: 'Input Controls',
        default_size: [280, 120], is_container: false, resizable: true,
        property_schema: make_schema([
            {
                group: 'Text', fields: [
                    { key: 'label', label: 'Label', type: 'text' },
                    { key: 'placeholder', label: 'Placeholder', type: 'text' },
                    { key: 'helper_text', label: 'Help Text', type: 'textarea' },
                    { key: 'value', label: 'Default Value', type: 'text' },
                    { key: 'required', label: 'Required', type: 'boolean' },
                ]
            }
        ])
    });

    registry.register({
        id: 'number_input', label: 'Number Input', icon: '#', category: 'Input Controls',
        default_size: [200, 72], is_container: false, resizable: true,
        property_schema: make_schema([
            {
                group: 'Number', fields: [
                    { key: 'label', label: 'Label', type: 'text' },
                    { key: 'helper_text', label: 'Help Text', type: 'textarea' },
                    { key: 'min', label: 'Min', type: 'number' },
                    { key: 'max', label: 'Max', type: 'number' },
                    { key: 'step', label: 'Step', type: 'number' },
                    { key: 'value', label: 'Default Value', type: 'number' },
                    { key: 'required', label: 'Required', type: 'boolean' },
                ]
            }
        ])
    });

    registry.register({
        id: 'checkbox', label: 'Checkbox', icon: '☑', category: 'Input Controls',
        default_size: [220, 40], is_container: false, resizable: false,
        property_schema: make_schema([
            {
                group: 'Checkbox', fields: [
                    { key: 'label', label: 'Label', type: 'text' },
                    { key: 'helper_text', label: 'Help Text', type: 'textarea' },
                    { key: 'checked', label: 'Checked', type: 'boolean' },
                ]
            }
        ])
    });

    registry.register({
        id: 'radio', label: 'Radio Button', icon: '◉', category: 'Input Controls',
        default_size: [220, 40], is_container: false, resizable: false,
        property_schema: make_schema([
            {
                group: 'Radio', fields: [
                    { key: 'label', label: 'Label', type: 'text' },
                    { key: 'helper_text', label: 'Help Text', type: 'textarea' },
                    { key: 'group_name', label: 'Group Name', type: 'text' },
                    { key: 'checked', label: 'Checked', type: 'boolean' },
                ]
            }
        ])
    });

    registry.register({
        id: 'select', label: 'Select', icon: '▼', category: 'Input Controls',
        default_size: [240, 72], is_container: false, resizable: true,
        property_schema: make_schema([
            {
                group: 'Select', fields: [
                    { key: 'label', label: 'Label', type: 'text' },
                    { key: 'options', label: 'Options', type: 'textarea' },
                    { key: 'helper_text', label: 'Help Text', type: 'textarea' },
                    { key: 'required', label: 'Required', type: 'boolean' },
                ]
            }
        ])
    });

    registry.register({
        id: 'date_picker', label: 'Date Picker', icon: '📅', category: 'Input Controls',
        default_size: [220, 72], is_container: false, resizable: true,
        property_schema: make_schema([
            {
                group: 'Date', fields: [
                    { key: 'label', label: 'Label', type: 'text' },
                    { key: 'helper_text', label: 'Help Text', type: 'textarea' },
                    { key: 'required', label: 'Required', type: 'boolean' },
                ]
            }
        ])
    });

    registry.register({
        id: 'toggle_switch', label: 'Toggle Switch', icon: '⏼', category: 'Input Controls',
        default_size: [200, 40], is_container: false, resizable: false,
        property_schema: make_schema([
            {
                group: 'Toggle', fields: [
                    { key: 'label', label: 'Label', type: 'text' },
                    { key: 'helper_text', label: 'Help Text', type: 'textarea' },
                    { key: 'checked', label: 'On', type: 'boolean' },
                ]
            }
        ])
    });

    registry.register({
        id: 'color_picker', label: 'Color Picker', icon: '🎨', category: 'Input Controls',
        default_size: [220, 72], is_container: false, resizable: false,
        property_schema: make_schema([
            {
                group: 'Color', fields: [
                    { key: 'label', label: 'Label', type: 'text' },
                    { key: 'helper_text', label: 'Help Text', type: 'textarea' },
                    { key: 'value', label: 'Default Color', type: 'color' },
                ]
            }
        ])
    });

    // ── Display Controls ────────────────────────────────

    registry.register({
        id: 'label', label: 'Label', icon: 'Aa', category: 'Display Controls',
        default_size: [120, 24], is_container: false, resizable: true,
        property_schema: make_schema([
            {
                group: 'Text', fields: [
                    { key: 'text', label: 'Text', type: 'text' },
                    { key: 'font_size', label: 'Font Size', type: 'number', min: 8 },
                ]
            }
        ])
    });

    registry.register({
        id: 'button', label: 'Button', icon: '⏺', category: 'Display Controls',
        default_size: [120, 36], is_container: false, resizable: true,
        property_schema: make_schema([
            {
                group: 'Button', fields: [
                    { key: 'label', label: 'Label', type: 'text' },
                    {
                        key: 'variant', label: 'Variant', type: 'enum',
                        options: ['default', 'primary', 'secondary', 'danger']
                    },
                ]
            }
        ])
    });

    registry.register({
        id: 'image', label: 'Image', icon: '🖼', category: 'Display Controls',
        default_size: [200, 150], is_container: false, resizable: true,
        property_schema: make_schema([
            {
                group: 'Image', fields: [
                    { key: 'src', label: 'Source URL', type: 'text' },
                    { key: 'alt', label: 'Alt Text', type: 'text' },
                ]
            }
        ])
    });

    registry.register({
        id: 'toolbar', label: 'Toolbar', icon: '━', category: 'Display Controls',
        default_size: [400, 40], is_container: true, resizable: true,
        property_schema: make_schema([
            {
                group: 'Toolbar', fields: [
                    ...RESPONSIVE_CONTAINER_FIELDS,
                ]
            }
        ], { include_container_spacing: true })
    });

    // ── Layout Containers ───────────────────────────────

    registry.register({
        id: 'panel', label: 'Panel', icon: '⬜', category: 'Layout Containers',
        default_size: [300, 200], is_container: true, resizable: true,
        property_schema: make_schema([
            {
                group: 'Panel', fields: [
                    { key: 'title', label: 'Title', type: 'text' },
                    { key: 'description', label: 'Description', type: 'textarea' },
                    { key: 'show_border', label: 'Show Border', type: 'boolean' },
                    ...RESPONSIVE_CONTAINER_FIELDS,
                    { key: 'background_color', label: 'Background', type: 'color' },
                ]
            }
        ], { include_container_spacing: true })
    });

    registry.register({
        id: 'group_box', label: 'Group Box', icon: '▣', category: 'Layout Containers',
        default_size: [280, 180], is_container: true, resizable: true,
        property_schema: make_schema([
            {
                group: 'Group', fields: [
                    { key: 'title', label: 'Title', type: 'text' },
                    { key: 'description', label: 'Description', type: 'textarea' },
                    ...RESPONSIVE_CONTAINER_FIELDS,
                ]
            }
        ], { include_container_spacing: true })
    });

    registry.register({
        id: 'tabbed_panel', label: 'Tabbed Panel', icon: '⊞', category: 'Layout Containers',
        default_size: [400, 300], is_container: true, resizable: true,
        property_schema: make_schema([
            {
                group: 'Tabs', fields: [
                    { key: 'tabs', label: 'Tab Labels', type: 'textarea' },
                    ...RESPONSIVE_CONTAINER_FIELDS,
                ]
            }
        ], { include_container_spacing: true })
    });

    registry.register({
        id: 'split_pane', label: 'Split Pane', icon: '⊟', category: 'Layout Containers',
        default_size: [400, 300], is_container: true, resizable: true,
        property_schema: make_schema([
            {
                group: 'Split', fields: [
                    ...RESPONSIVE_CONTAINER_FIELDS,
                    {
                        key: 'orientation', label: 'Orientation', type: 'enum',
                        options: ['horizontal', 'vertical']
                    },
                    { key: 'split_position', label: 'Split %', type: 'number', min: 10, max: 90 },
                ]
            }
        ], { include_container_spacing: true })
    });

    registry.register({
        id: 'accordion', label: 'Accordion', icon: '≡', category: 'Layout Containers',
        default_size: [300, 250], is_container: true, resizable: true,
        property_schema: make_schema([
            {
                group: 'Accordion', fields: [
                    { key: 'sections', label: 'Sections', type: 'textarea' },
                    ...RESPONSIVE_CONTAINER_FIELDS,
                ]
            }
        ], { include_container_spacing: true })
    });

    // ── Data Controls ───────────────────────────────────

    registry.register({
        id: 'data_grid', label: 'Data Grid', icon: '⊞', category: 'Data Controls',
        default_size: [400, 250], is_container: false, resizable: true,
        property_schema: make_schema([
            {
                group: 'Data', fields: [
                    { key: 'columns', label: 'Columns', type: 'number', min: 1 },
                    { key: 'rows', label: 'Visible Rows', type: 'number', min: 1 },
                ]
            }
        ])
    });

    registry.register({
        id: 'tree_view', label: 'Tree View', icon: '🌲', category: 'Data Controls',
        default_size: [250, 200], is_container: false, resizable: true,
        property_schema: make_schema([])
    });

    // ── SVG Controls ───────────────────────────────────

    registry.register({
        id: 'progress_bar', label: 'Progress Bar', icon: '▰', category: 'Display Controls',
        default_size: [200, 24], is_container: false, resizable: true,
        property_schema: make_schema([
            {
                group: 'Progress', fields: [
                    { key: 'value', label: 'Value', type: 'number', min: 0, max: 100 },
                    { key: 'color', label: 'Color', type: 'color' },
                    { key: 'label', label: 'Label', type: 'text' },
                    { key: 'show_text', label: 'Show %', type: 'boolean' },
                ]
            }
        ])
    });

    registry.register({
        id: 'gauge', label: 'Gauge', icon: '◔', category: 'Data Controls',
        default_size: [160, 160], is_container: false, resizable: true,
        property_schema: make_schema([
            {
                group: 'Gauge', fields: [
                    { key: 'value', label: 'Value', type: 'number' },
                    { key: 'min', label: 'Min', type: 'number' },
                    { key: 'max', label: 'Max', type: 'number' },
                    { key: 'color', label: 'Color', type: 'color' },
                    { key: 'label', label: 'Label', type: 'text' },
                ]
            }
        ])
    });

    return registry;
}

module.exports = { Control_Registry, create_default_registry };
