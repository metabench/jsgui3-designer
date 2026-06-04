'use strict';

function formatOptionLabel(option) {
    return String(option)
        .replace(/_/g, ' ')
        .replace(/\b\w/g, ch => ch.toUpperCase());
}

function createInspectorInput({ field, value, node_id, onChange }) {
    let input;
    let editor;
    switch (field.type) {
        case 'boolean':
            input = document.createElement('input');
            input.type = 'checkbox';
            input.checked = !!value;
            input.addEventListener('change', () => onChange(node_id, field.key, input.checked));
            editor = { key: field.key, input, type: field.type };
            break;
        case 'number':
            input = document.createElement('input');
            input.type = 'number';
            input.value = value != null ? value : '';
            if (field.min != null) input.min = field.min;
            if (field.max != null) input.max = field.max;
            input.addEventListener('change', () => onChange(node_id, field.key, parseFloat(input.value) || 0));
            editor = { key: field.key, input, type: field.type };
            break;
        case 'color':
            input = document.createElement('input');
            input.type = 'color';
            input.value = value || '#ffffff';
            input.addEventListener('input', () => onChange(node_id, field.key, input.value));
            editor = { key: field.key, input, type: field.type };
            break;
        case 'enum':
            if (field.presentation === 'chips') {
                input = document.createElement('div');
                input.className = 'inspector-chip-group';
                const buttons = [];
                const selected_value = value != null && value !== ''
                    ? String(value)
                    : ((field.options && field.options[0]) ? String(field.options[0]) : '');
                const set_value = (next_value) => {
                    const next = next_value != null ? String(next_value) : '';
                    buttons.forEach((btn) => btn.classList.toggle('active', btn.getAttribute('data-value') === next));
                };
                for (const opt of (field.options || [])) {
                    const btn = document.createElement('button');
                    btn.type = 'button';
                    btn.className = 'inspector-chip';
                    btn.setAttribute('data-value', opt);
                    btn.textContent = formatOptionLabel(opt);
                    btn.addEventListener('click', () => {
                        set_value(opt);
                        onChange(node_id, field.key, opt);
                    });
                    buttons.push(btn);
                    input.appendChild(btn);
                }
                set_value(selected_value);
                editor = { key: field.key, input, type: 'custom', set_value };
                break;
            }
            input = document.createElement('select');
            for (const opt of (field.options || [])) {
                const o = document.createElement('option');
                o.value = opt;
                o.textContent = formatOptionLabel(opt);
                if (opt === value) o.selected = true;
                input.appendChild(o);
            }
            input.addEventListener('change', () => onChange(node_id, field.key, input.value));
            editor = { key: field.key, input, type: field.type };
            break;
        case 'textarea':
            input = document.createElement('textarea');
            input.value = value != null ? String(value) : '';
            input.rows = Math.max(3, String(value || '').split(/\r?\n/).length || 3);
            input.addEventListener('change', () => onChange(node_id, field.key, input.value));
            editor = { key: field.key, input, type: field.type };
            break;
        default:
            input = document.createElement('input');
            input.type = 'text';
            input.value = value != null ? String(value) : '';
            input.addEventListener('change', () => onChange(node_id, field.key, input.value));
            editor = { key: field.key, input, type: field.type };
            break;
    }

    input.className = field.type === 'boolean' ? 'inspector-checkbox' : (input.className || 'inspector-input');
    return { element: input, editor };
}

module.exports = {
    createInspectorInput
};
