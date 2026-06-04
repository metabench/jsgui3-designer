# jsgui3-designer

**The Visual User Interface Designer for the jsgui3 Ecosystem.**

`jsgui3-designer` is a desktop-grade visual editing application built on top of the `jsgui3` isomorphic framework. It allows developers and designers to visually compose, style, edit, and configure complex UI control trees, exporting them directly to isomorphic JavaScript code or JSON representations.

---

## Features

- **Visual Control Tree Builder:** Drag-and-drop hierarchy composition.
- **Isomorphic Live Preview:** Instantly previews changes in real-time as controls are composed.
- **Property Inspector:** Edit DOM attributes, CSS classes, and reactive data-bindings visually.
- **Theme Builder:** Adjust structural CSS styles and themes with interactive pickers.
- **Code Export:** Automatically generates clean, `snake_case` compliant isomorphic control files ready to drop into your `jsgui3-html` apps.

---

## Installation & Setup

1.  Clone this repository as part of your `jsgui3` workspace:
    ```bash
    git clone https://github.com/metabench/jsgui3-designer.git
    cd jsgui3-designer
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Link local packages (if you are doing active multi-repo development):
    ```bash
    npm link jsgui3-client
    npm link jsgui3-html
    npm link jsgui3-server
    npm link lang-tools
    ```

---

## Running the Designer

Launch the designer application server using Node.js:

```bash
node server.js
```

By default, the server will compile client assets, start dynamic bundling, and open the designer dashboard at `http://localhost:52000` (or the configured port).

---

## Ecosystem Coordination

This repository is a core component of the **jsgui3 ecosystem**. 

For cross-repo architecture maps, coding standards, coordination workflows, and orientation guides, see the ecosystem coordination headquarters:
👉 **[jsgui3-ecosystem](https://github.com/metabench/jsgui3-ecosystem)**
