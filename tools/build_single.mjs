// Arma MARGOUSH 3D en un solo archivo HTML (código, Three.js, imágenes y música adentro) para subirlo a cualquier lado.
// Uso: node tools/build_single.mjs [salida.html]
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire('/home/claude/tools/');
const esbuild = require('esbuild');
const ROOT = path.resolve(new URL('..', import.meta.url).pathname);
const G3 = path.join(ROOT, '3d');
const OUT = process.argv[2] || path.join(ROOT, 'dist', 'margoush-3d.html');
const THREE = process.env.THREE_JS || '/home/claude/tools/node_modules/three/build/three.min.js';

const MIME = { '.webp': 'image/webp', '.png': 'image/png', '.mp3': 'audio/mpeg', '.json': 'application/json' };
const dataUrl = (file) => `data:${MIME[path.extname(file)] || 'application/octet-stream'};base64,${fs.readFileSync(path.join(G3, 'assets', file)).toString('base64')}`;

const manifest = JSON.parse(fs.readFileSync(path.join(G3, 'assets', 'manifest.json'), 'utf8'));
const files = {};
for (const m of Object.values(manifest)) if (m.file && fs.existsSync(path.join(G3, 'assets', m.file))) files[m.file] = dataUrl(m.file);

const js = (await esbuild.build({ entryPoints: [path.join(G3, 'js', 'main.js')], bundle: true, format: 'esm', minify: true, write: false, target: 'es2020' })).outputFiles[0].text;
let css = fs.readFileSync(path.join(G3, 'css', 'game.css'), 'utf8').replace(/url\(\.\.\/assets\/([\w.-]+)\)/g, (_, f) => `url(${files[f] || dataUrl(f)})`);
let html = fs.readFileSync(path.join(G3, 'index.html'), 'utf8');
html = html.replace(/src="assets\/([\w.-]+)"/g, (_, f) => `src="${files[f] || dataUrl(f)}"`);
html = html.replace('<link rel="stylesheet" href="css/game.css">', () => `<style>${css}</style>`);
html = html.replace(/<script src="https:\/\/cdnjs[^"]+three\.min\.js"><\/script>/, () => `<script>${fs.readFileSync(THREE, 'utf8')}</script>`);
html = html.replace('<script type="module" src="js/main.js"></script>', () =>
  `<script>window.__EMBED=${JSON.stringify({ manifest, files })};</script>\n<script type="module">${js.replace(/<\/script/g, '<\\/script')}</script>`);
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, html);
console.log('ok', OUT, (fs.statSync(OUT).size / 1e6).toFixed(1) + ' MB');
