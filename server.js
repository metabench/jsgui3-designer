/**
 * jsgui3-designer — Server entry point
 *
 * Serves the Designer_Palette control as a web page.
 * Run:  node server.js
 */

const jsgui = require('./client');
const Server = require('jsgui3-server/server');
const { Designer_App } = jsgui.controls;

const port = parseInt(process.env.PORT, 10) || 52030;

const server = new Server({
    Ctrl: Designer_App,
    src_path_client_js: require.resolve('./client.js'),
    name: 'jsgui3-designer'
});

server.on('ready', () => {
    server.start(port, (err) => {
        if (err) throw err;
        console.log('');
        console.log('═'.repeat(50));
        console.log('  jsgui3-designer');
        console.log('═'.repeat(50));
        console.log(`  Open http://localhost:${port} in your browser`);
        console.log('═'.repeat(50));
        console.log('');
    });
});
