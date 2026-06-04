# Chapter 11 — Serialization & Code Generation

## The Form Definition Format

Every form created in the designer needs to be saved, loaded, exported, and converted to running code. The central artefact is the **form definition file** — a JSON document that captures the entire document model.

### File Format: `.form.json`

```json
{
    "version": "1.0",
    "name": "contact-form",
    "title": "Contact Form",
    "description": "A simple contact form with validation",
    "canvas": {
        "width": 800,
        "height": 600,
        "grid_size": [8, 8],
        "background": "#ffffff"
    },
    "root": {
        "id": "node_0001",
        "control_type": "form_container",
        "properties": {
            "name": "frmContact",
            "layout_mode": "auto",
            "label_width": "160px"
        },
        "children": [
            {
                "id": "node_0002",
                "control_type": "text_input",
                "properties": {
                    "name": "txtName",
                    "label": "Full Name",
                    "placeholder": "Enter your full name",
                    "required": true,
                    "x": 16,
                    "y": 16,
                    "width": 300,
                    "height": 32
                },
                "children": []
            },
            {
                "id": "node_0003",
                "control_type": "text_input",
                "properties": {
                    "name": "txtEmail",
                    "label": "Email Address",
                    "placeholder": "you@example.com",
                    "required": true,
                    "input_type": "email",
                    "x": 16,
                    "y": 64,
                    "width": 300,
                    "height": 32
                },
                "children": []
            },
            {
                "id": "node_0004",
                "control_type": "textarea",
                "properties": {
                    "name": "txtMessage",
                    "label": "Message",
                    "placeholder": "Your message",
                    "x": 16,
                    "y": 112,
                    "width": 300,
                    "height": 96,
                    "autosize": true
                },
                "children": []
            },
            {
                "id": "node_0005",
                "control_type": "button",
                "properties": {
                    "name": "btnSubmit",
                    "label": "Send Message",
                    "variant": "primary",
                    "x": 16,
                    "y": 224,
                    "width": 150,
                    "height": 40
                },
                "children": []
            }
        ]
    },
    "metadata": {
        "created": "2026-02-27T14:30:00Z",
        "modified": "2026-02-27T14:45:00Z",
        "author": "James Vickers",
        "target_theme": "default"
    }
}
```

### Why JSON?

JSON was chosen for the form definition because:

- It is human-readable and easily inspected.
- Every language and tool can parse it.
- It maps naturally to JavaScript objects.
- It has no executable code, making it safe to load from untrusted sources.
- It diffs cleanly in version control.
- It can be validated against a JSON Schema.

## Saving and Loading

### Save to File

The designer's Save function serialises the document model and writes it to disk:

```javascript
async function save_form(document_model, file_path) {
    const definition = {
        version: '1.0',
        name: document_model.root.properties.name,
        title: document_model.root.properties.title || 'Untitled Form',
        canvas: {
            width: document_model.canvas_width,
            height: document_model.canvas_height,
            grid_size: document_model.grid_size,
            background: document_model.canvas_background
        },
        root: document_model.serialize(),
        metadata: {
            created: document_model.created || new Date().toISOString(),
            modified: new Date().toISOString(),
            author: document_model.author
        }
    };

    const json = JSON.stringify(definition, null, 2);

    // On the client, send to the server via HTTP resource
    await http_resource.post('/api/forms/save', {
        path: file_path,
        content: json
    });
}
```

### Load from File

```javascript
async function load_form(file_path, document_model) {
    const response = await http_resource.get('/api/forms/load', {
        path: file_path
    });

    const definition = JSON.parse(response.content);

    document_model.canvas_width = definition.canvas.width;
    document_model.canvas_height = definition.canvas.height;
    document_model.grid_size = definition.canvas.grid_size;

    document_model.deserialize(definition.root);
}
```

### Client-Side Export/Import

The existing prototype implemented JSON export/import using the Blob API and FileReader API. This approach works for browser-only scenarios:

```javascript
// Export: download as .form.json
function export_form(document_model) {
    const definition = build_definition(document_model);
    const json = JSON.stringify(definition, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `${definition.name || 'form'}.form.json`;
    a.click();
    URL.revokeObjectURL(url);
}

// Import: file picker + parse
function import_form(document_model) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.form.json';

    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            const definition = JSON.parse(evt.target.result);
            document_model.deserialize(definition.root);
        };
        reader.readAsText(file);
    };

    input.click();
}
```

## Code Generation

Beyond saving/loading the form definition as JSON, the designer can generate executable jsgui3 code from the design. This is the equivalent of the code-behind files that Visual Studio generates for Windows Forms.

### Server Page Code

The simplest output is a jsgui3-server page that renders the form:

```javascript
// Generated by jsgui3-designer
// Form: Contact Form
// Date: 2026-02-27

const jsgui = require('jsgui3-html/html-core/html-core');
const { Control } = jsgui;
const Form_Container = require('jsgui3-html/controls/organised/1-standard/1-editor/Form_Container');
const Button = require('jsgui3-html/controls/organised/0-core/0-basic/0-native-compositional/Button');

class Contact_Form_Page extends Control {
    constructor(spec = {}) {
        spec.__type_name = spec.__type_name || 'contact_form_page';
        super(spec);
        this.add_class('contact-form-page');

        const { context } = this;

        this.form = new Form_Container({
            context,
            fields: [
                {
                    name: 'txtName',
                    label: 'Full Name',
                    type: 'text',
                    placeholder: 'Enter your full name',
                    required: true
                },
                {
                    name: 'txtEmail',
                    label: 'Email Address',
                    type: 'email',
                    placeholder: 'you@example.com',
                    required: true
                },
                {
                    name: 'txtMessage',
                    label: 'Message',
                    type: 'textarea',
                    placeholder: 'Your message',
                    autosize: true
                }
            ],
            layout_mode: 'auto',
            label_width: '160px'
        });

        this.submit_btn = new Button({
            context,
            label: 'Send Message'
        });
        this.submit_btn.add_class('btn-primary');

        this.add(this.form);
        this.add(this.submit_btn);
    }

    activate() {
        if (!this.__active) {
            super.activate();

            this.submit_btn.on('click', () => {
                const result = this.form.submit();
                if (result.valid) {
                    // Handle form submission
                    console.log('Form submitted:', this.form.get_values());
                }
            });
        }
    }
}

module.exports = Contact_Form_Page;
```

### Code Generation Engine

The code generator walks the document model tree and emits JavaScript:

```javascript
class Code_Generator {
    generate(document_model, options = {}) {
        const root = document_model.root;
        const class_name = this._to_class_name(root.properties.name || 'Form');

        const requires = new Set();
        const body_lines = [];

        this._generate_node(root, body_lines, requires, 1);

        const require_lines = Array.from(requires).map(r =>
            `const ${r.name} = require('${r.path}');`
        );

        return [
            '// Generated by jsgui3-designer',
            `// Form: ${root.properties.title || class_name}`,
            `// Date: ${new Date().toISOString().split('T')[0]}`,
            '',
            ...require_lines,
            '',
            `class ${class_name} extends Control {`,
            `    constructor(spec = {}) {`,
            `        spec.__type_name = spec.__type_name || '${root.properties.name}';`,
            `        super(spec);`,
            ...body_lines,
            `    }`,
            `}`,
            '',
            `module.exports = ${class_name};`
        ].join('\n');
    }

    _generate_node(node, lines, requires, depth) {
        const indent = '    '.repeat(depth + 1);
        const registry_entry = control_registry.get(node.control_type);

        requires.add({
            name: registry_entry.control_class.name,
            path: registry_entry.require_path
        });

        const var_name = node.properties.name || `ctrl_${node.id}`;

        lines.push(`${indent}this.${var_name} = new ${registry_entry.control_class.name}({`);
        lines.push(`${indent}    context,`);

        for (const [key, value] of Object.entries(node.properties)) {
            if (key === 'name' || key === 'x' || key === 'y') continue;
            lines.push(`${indent}    ${key}: ${JSON.stringify(value)},`);
        }

        lines.push(`${indent}});`);
        lines.push(`${indent}this.add(this.${var_name});`);

        for (const child of node.children) {
            lines.push('');
            this._generate_node(child, lines, requires, depth);
        }
    }
}
```

### Output Formats

The code generator supports multiple output formats:

| Format | Output | Use Case |
|--------|--------|----------|
| `jsgui3-page` | A complete server-renderable page class | Full-stack jsgui3 applications |
| `jsgui3-control` | A standalone control class | Embedding in existing pages |
| `form-container` | A `Form_Container` specification | Simple form rendering |
| `json` | The raw form definition JSON | Data-driven form engines |
| `html` | Static HTML (server-rendered snapshot) | Previewing, emailing, documentation |

## Template System

For common form patterns, the designer includes templates — pre-built form definitions that the user can start from:

- **Contact Form** — name, email, message, submit
- **Login Form** — username, password, remember me, submit
- **Registration Form** — name, email, password, confirm password, terms checkbox
- **Survey Form** — multiple question types
- **Settings Form** — grouped preferences with toggles

Templates are stored as `.form.json` files in a templates directory and loaded through the File → New from Template menu.

## Summary

Serialisation and code generation provide:

- A `.form.json` format for saving and loading form designs.
- Client-side export/import via Blob and FileReader APIs (inherited from the prototype).
- Server-side save/load via HTTP resources.
- Code generation that produces runnable jsgui3 JavaScript from the document model.
- Multiple output formats (page, control, form spec, JSON, HTML).
- A template system for common form patterns.
