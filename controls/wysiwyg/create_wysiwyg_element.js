'use strict';

function parseLines(value, fallback) {
    const lines = String(value || fallback || '')
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(Boolean);
    return lines.length ? lines : (fallback ? [fallback] : []);
}

function createFieldShell(control_type, props, label_text) {
    const shell = document.createElement('div');
    shell.className = 'wysiwyg-ctrl wys-field-shell wys-field-' + control_type;

    const label = document.createElement('div');
    label.className = 'wys-field-label';
    label.textContent = label_text || 'Field';
    if (props.required) {
        const req = document.createElement('span');
        req.className = 'wys-required';
        req.textContent = ' *';
        label.appendChild(req);
    }
    shell.appendChild(label);

    const body = document.createElement('div');
    body.className = 'wys-field-body';
    shell.appendChild(body);

    if (props.helper_text) {
        const help = document.createElement('div');
        help.className = 'wys-field-help';
        help.textContent = props.helper_text;
        shell.appendChild(help);
    }

    return { shell, body };
}

function createWysiwygElement(control_type, props, entry) {
    const label = props.label || props.text || props.title || props.name || (entry ? entry.label : control_type);
    let el;

    switch (control_type) {
        case 'text_input': {
            const field = createFieldShell(control_type, props, label);
            el = field.shell;
            const input = document.createElement('input');
            input.type = 'text';
            input.tabIndex = -1;
            input.className = 'wysiwyg-ctrl wys-text-input';
            input.placeholder = props.placeholder || '';
            field.body.appendChild(input);
            break;
        }
        case 'textarea': {
            const field = createFieldShell(control_type, props, label);
            el = field.shell;
            const input = document.createElement('textarea');
            input.tabIndex = -1;
            input.className = 'wysiwyg-ctrl wys-textarea';
            input.placeholder = props.placeholder || '';
            field.body.appendChild(input);
            break;
        }
        case 'number_input': {
            const field = createFieldShell(control_type, props, label);
            el = field.shell;
            const input = document.createElement('input');
            input.type = 'number';
            input.tabIndex = -1;
            input.className = 'wysiwyg-ctrl wys-number-input';
            if (props.placeholder) input.placeholder = props.placeholder;
            field.body.appendChild(input);
            break;
        }
        case 'checkbox': {
            el = document.createElement('div');
            el.className = 'wysiwyg-ctrl wys-choice-group';
            const row = document.createElement('label');
            row.className = 'wys-choice-row';
            const cb = document.createElement('input');
            cb.type = 'checkbox';
            cb.tabIndex = -1;
            cb.checked = !!props.checked;
            const cl = document.createElement('span');
            cl.textContent = label;
            row.appendChild(cb);
            row.appendChild(cl);
            el.appendChild(row);
            if (props.helper_text) {
                const help = document.createElement('div');
                help.className = 'wys-field-help';
                help.textContent = props.helper_text;
                el.appendChild(help);
            }
            break;
        }
        case 'radio': {
            el = document.createElement('div');
            el.className = 'wysiwyg-ctrl wys-choice-group';
            const row = document.createElement('label');
            row.className = 'wys-choice-row';
            const rb = document.createElement('input');
            rb.type = 'radio';
            rb.tabIndex = -1;
            rb.checked = !!props.checked;
            const rl = document.createElement('span');
            rl.textContent = label;
            row.appendChild(rb);
            row.appendChild(rl);
            el.appendChild(row);
            if (props.helper_text) {
                const help = document.createElement('div');
                help.className = 'wys-field-help';
                help.textContent = props.helper_text;
                el.appendChild(help);
            }
            break;
        }
        case 'select': {
            const field = createFieldShell(control_type, props, label);
            el = field.shell;
            const select = document.createElement('select');
            select.className = 'wysiwyg-ctrl wys-select';
            select.tabIndex = -1;
            const options = parseLines(props.options, 'Choose an option');
            for (const option_text of options.slice(0, 4)) {
                const option = document.createElement('option');
                option.textContent = option_text;
                select.appendChild(option);
            }
            field.body.appendChild(select);
            break;
        }
        case 'date_picker': {
            const field = createFieldShell(control_type, props, label);
            el = field.shell;
            const input = document.createElement('input');
            input.type = 'date';
            input.tabIndex = -1;
            input.className = 'wysiwyg-ctrl wys-date-picker';
            field.body.appendChild(input);
            break;
        }
        case 'toggle_switch': {
            el = document.createElement('div');
            el.className = 'wysiwyg-ctrl wys-choice-group';
            const row = document.createElement('div');
            row.className = 'wys-choice-row';
            const toggle = document.createElement('span');
            toggle.className = 'wys-toggle-track' + (props.checked ? ' is-on' : '');
            const knob = document.createElement('span');
            knob.className = 'wys-toggle-knob';
            toggle.appendChild(knob);
            const text = document.createElement('span');
            text.textContent = label;
            row.appendChild(toggle);
            row.appendChild(text);
            el.appendChild(row);
            if (props.helper_text) {
                const help = document.createElement('div');
                help.className = 'wys-field-help';
                help.textContent = props.helper_text;
                el.appendChild(help);
            }
            break;
        }
        case 'color_picker': {
            const field = createFieldShell(control_type, props, label);
            el = field.shell;
            const row = document.createElement('div');
            row.className = 'wys-color-row';
            const swatch = document.createElement('span');
            swatch.className = 'wys-color-swatch';
            swatch.style.background = props.value || '#3b82f6';
            const value = document.createElement('span');
            value.className = 'wys-color-value';
            value.textContent = props.value || '#3b82f6';
            row.appendChild(swatch);
            row.appendChild(value);
            field.body.appendChild(row);
            break;
        }
        case 'button': {
            el = document.createElement('div');
            el.className = 'wysiwyg-ctrl wys-button wys-button-' + (props.variant || 'default');
            el.textContent = label;
            break;
        }
        case 'label': {
            el = document.createElement('div');
            el.className = 'wysiwyg-ctrl wys-label';
            el.textContent = label;
            break;
        }
        case 'image': {
            el = document.createElement('div');
            el.className = 'wysiwyg-ctrl wys-image';
            el.textContent = '\uD83D\uDDBC';
            break;
        }
        case 'toolbar': {
            el = document.createElement('div');
            el.className = 'wysiwyg-ctrl wys-toolbar';
            const title = document.createElement('div');
            title.className = 'wys-toolbar-title';
            title.textContent = 'Toolbar';
            const host = document.createElement('div');
            host.className = 'wys-toolbar-host';
            host.setAttribute('data-children-host', 'true');
            el.appendChild(title);
            el.appendChild(host);
            break;
        }
        case 'panel': {
            el = document.createElement('div');
            el.className = 'wysiwyg-ctrl wys-panel';
            if (props.title) {
                const header = document.createElement('div');
                header.className = 'wys-panel-header';
                header.textContent = props.title;
                el.appendChild(header);
            }
            if (props.description) {
                const desc = document.createElement('div');
                desc.className = 'wys-panel-description';
                desc.textContent = props.description;
                el.appendChild(desc);
            }
            const body = document.createElement('div');
            body.className = 'wys-panel-body';
            body.setAttribute('data-children-host', 'true');
            if (props.background_color) body.style.backgroundColor = props.background_color;
            el.appendChild(body);
            break;
        }
        case 'group_box': {
            el = document.createElement('div');
            el.className = 'wysiwyg-ctrl wys-group-box';
            el.setAttribute('data-title', label);
            const body = document.createElement('div');
            body.className = 'wys-group-box-body';
            body.setAttribute('data-children-host', 'true');
            if (props.description) {
                const desc = document.createElement('div');
                desc.className = 'wys-panel-description';
                desc.textContent = props.description;
                body.appendChild(desc);
            }
            el.appendChild(body);
            break;
        }
        case 'tabbed_panel': {
            el = document.createElement('div');
            el.className = 'wysiwyg-ctrl wys-tabbed-panel';
            const tabs = parseLines(props.tabs, 'Details\nReview');
            const bar = document.createElement('div');
            bar.className = 'wys-tab-bar';
            tabs.slice(0, 4).forEach((tab_name, index) => {
                const tab = document.createElement('div');
                tab.className = 'wys-tab' + (index === 0 ? ' active' : '');
                tab.textContent = tab_name;
                bar.appendChild(tab);
            });
            const body = document.createElement('div');
            body.className = 'wys-tab-body';
            body.setAttribute('data-children-host', 'true');
            el.appendChild(bar);
            el.appendChild(body);
            break;
        }
        case 'split_pane': {
            el = document.createElement('div');
            el.className = 'wysiwyg-ctrl wys-split-pane';
            const left = document.createElement('div');
            left.className = 'wys-split-left';
            left.setAttribute('data-children-host', 'true');
            const splitter = document.createElement('div');
            splitter.className = 'wys-splitter';
            const right = document.createElement('div');
            right.className = 'wys-split-right';
            right.textContent = 'Secondary pane';
            if (props.orientation === 'vertical') {
                el.classList.add('is-vertical');
            }
            el.appendChild(left);
            el.appendChild(splitter);
            el.appendChild(right);
            break;
        }
        case 'accordion': {
            el = document.createElement('div');
            el.className = 'wysiwyg-ctrl wys-accordion';
            const sections = parseLines(props.sections, 'Section 1\nSection 2');
            const header = document.createElement('div');
            header.className = 'wys-acc-header';
            header.textContent = '\u25BE ' + sections[0];
            const body = document.createElement('div');
            body.className = 'wys-accordion-body';
            body.setAttribute('data-children-host', 'true');
            el.appendChild(header);
            el.appendChild(body);
            for (const section_name of sections.slice(1, 3)) {
                const section = document.createElement('div');
                section.className = 'wys-acc-header muted';
                section.textContent = '\u25B8 ' + section_name;
                el.appendChild(section);
            }
            break;
        }
        case 'data_grid': {
            el = document.createElement('div');
            el.className = 'wysiwyg-ctrl wys-data-grid';
            el.innerHTML = '<div class="wys-grid-header"><div class="wys-grid-cell">Column A</div><div class="wys-grid-cell">Column B</div></div><div class="wys-grid-row"><div class="wys-grid-cell">&nbsp;</div><div class="wys-grid-cell">&nbsp;</div></div><div class="wys-grid-row"><div class="wys-grid-cell">&nbsp;</div><div class="wys-grid-cell">&nbsp;</div></div>';
            break;
        }
        case 'tree_view': {
            el = document.createElement('div');
            el.className = 'wysiwyg-ctrl wys-tree-view';
            el.innerHTML = '\u25be Root<br>&nbsp;&nbsp;\u25b8 Child 1<br>&nbsp;&nbsp;\u25b8 Child 2';
            break;
        }
        case 'progress_bar': {
            const val = Math.max(0, Math.min(100, props.value || 65));
            const col = props.color || '#3b82f6';
            const showText = props.show_text !== false;
            el = document.createElement('div');
            el.className = 'wysiwyg-ctrl wys-progress-bar';
            const NS = 'http://www.w3.org/2000/svg';
            const svg = document.createElementNS(NS, 'svg');
            svg.setAttribute('width', '100%');
            svg.setAttribute('height', '100%');
            svg.setAttribute('viewBox', '0 0 200 24');
            svg.setAttribute('preserveAspectRatio', 'none');
            const track = document.createElementNS(NS, 'rect');
            track.setAttribute('x', '0');
            track.setAttribute('y', '0');
            track.setAttribute('width', '200');
            track.setAttribute('height', '24');
            track.setAttribute('rx', '4');
            track.setAttribute('fill', '#e2e8f0');
            svg.appendChild(track);
            const fill = document.createElementNS(NS, 'rect');
            fill.setAttribute('x', '0');
            fill.setAttribute('y', '0');
            fill.setAttribute('width', String(val * 2));
            fill.setAttribute('height', '24');
            fill.setAttribute('rx', '4');
            fill.setAttribute('fill', col);
            svg.appendChild(fill);
            if (showText) {
                const txt = document.createElementNS(NS, 'text');
                txt.setAttribute('x', '100');
                txt.setAttribute('y', '16');
                txt.setAttribute('text-anchor', 'middle');
                txt.setAttribute('font-size', '11');
                txt.setAttribute('font-weight', '600');
                txt.setAttribute('fill', val > 45 ? '#fff' : '#333');
                txt.setAttribute('font-family', 'Segoe UI, sans-serif');
                txt.textContent = val + '%';
                svg.appendChild(txt);
            }
            el.appendChild(svg);
            break;
        }
        case 'gauge': {
            const val = props.value || 65;
            const minV = props.min || 0;
            const maxV = props.max || 100;
            const col = props.color || '#3b82f6';
            const pct = Math.max(0, Math.min(1, (val - minV) / (maxV - minV || 1)));
            el = document.createElement('div');
            el.className = 'wysiwyg-ctrl wys-gauge';
            const NS = 'http://www.w3.org/2000/svg';
            const size = 160;
            const svg = document.createElementNS(NS, 'svg');
            svg.setAttribute('width', '100%');
            svg.setAttribute('height', '100%');
            svg.setAttribute('viewBox', '0 0 ' + size + ' ' + size);
            const cx = size / 2;
            const cy = size / 2;
            const r = 58;
            const sw = 12;
            const startA = 135;
            const endA = 405;
            const totalA = endA - startA;
            const deg2rad = d => d * Math.PI / 180;
            const arcPath = (sa, ea) => {
                const x1 = cx + r * Math.cos(deg2rad(sa));
                const y1 = cy + r * Math.sin(deg2rad(sa));
                const x2 = cx + r * Math.cos(deg2rad(ea));
                const y2 = cy + r * Math.sin(deg2rad(ea));
                const large = (ea - sa) > 180 ? 1 : 0;
                return 'M ' + x1.toFixed(1) + ',' + y1.toFixed(1) + ' A ' + r + ',' + r + ' 0 ' + large + ' 1 ' + x2.toFixed(1) + ',' + y2.toFixed(1);
            };
            const trackP = document.createElementNS(NS, 'path');
            trackP.setAttribute('d', arcPath(startA, endA));
            trackP.setAttribute('fill', 'none');
            trackP.setAttribute('stroke', '#e2e8f0');
            trackP.setAttribute('stroke-width', String(sw));
            trackP.setAttribute('stroke-linecap', 'round');
            svg.appendChild(trackP);
            if (pct > 0.005) {
                const valA = startA + pct * totalA;
                const valP = document.createElementNS(NS, 'path');
                valP.setAttribute('d', arcPath(startA, valA));
                valP.setAttribute('fill', 'none');
                valP.setAttribute('stroke', col);
                valP.setAttribute('stroke-width', String(sw));
                valP.setAttribute('stroke-linecap', 'round');
                svg.appendChild(valP);
            }
            const txt = document.createElementNS(NS, 'text');
            txt.setAttribute('x', String(cx));
            txt.setAttribute('y', String(cy + 6));
            txt.setAttribute('text-anchor', 'middle');
            txt.setAttribute('dominant-baseline', 'middle');
            txt.setAttribute('font-size', '28');
            txt.setAttribute('font-weight', '700');
            txt.setAttribute('fill', '#333');
            txt.setAttribute('font-family', 'Segoe UI, sans-serif');
            txt.textContent = String(Math.round(val));
            svg.appendChild(txt);
            if (label && label !== props.name) {
                const lbl = document.createElementNS(NS, 'text');
                lbl.setAttribute('x', String(cx));
                lbl.setAttribute('y', String(cy + 28));
                lbl.setAttribute('text-anchor', 'middle');
                lbl.setAttribute('font-size', '10');
                lbl.setAttribute('fill', '#888');
                lbl.setAttribute('font-family', 'Segoe UI, sans-serif');
                lbl.textContent = label;
                svg.appendChild(lbl);
            }
            el.appendChild(svg);
            break;
        }
        default: {
            el = document.createElement('div');
            el.className = 'wysiwyg-ctrl';
            el.style.cssText = 'width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:10px;color:#888;background:rgba(240,241,243,.7);';
            el.textContent = entry ? entry.label : control_type;
        }
    }

    return el;
}

module.exports = {
    createWysiwygElement,
    parseLines
};
