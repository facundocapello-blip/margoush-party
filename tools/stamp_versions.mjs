// Pone una «versión» (hash del contenido) a cada archivo del juego 3D en 3d/index.html:
// - un importmap que manda cada js/<x>.js a js/<x>.js?v=<hash>
// - main.js y game.css con ?v=<hash>
// Así Safari nunca mezcla un archivo nuevo con otro viejo que tenía guardado (eso congelaba la intro).
// Correr antes de subir:  node tools/stamp_versions.mjs   (la prueba tests/versions.test.mjs avisa si te olvidaste)
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT = path.resolve(new URL('..', import.meta.url).pathname);
const DIR = path.join(ROOT, '3d');
const hash = (f) => crypto.createHash('sha1').update(fs.readFileSync(f)).digest('hex').slice(0, 10);

export function expectedStamps() {
  const js = fs.readdirSync(path.join(DIR, 'js')).filter(f => f.endsWith('.js')).sort();
  const imports = {};
  for (const f of js) imports['./js/' + f] = './js/' + f + '?v=' + hash(path.join(DIR, 'js', f));
  return { imports, main: imports['./js/main.js'], css: './css/game.css?v=' + hash(path.join(DIR, 'css', 'game.css')) };
}

export function stampedHtml(html) {
  const st = expectedStamps();
  const map = '<script type="importmap">\n' + JSON.stringify({ imports: st.imports }, null, 2) + '\n  </script>';
  html = html.replace(/\s*<script type="importmap">[\s\S]*?<\/script>/, '');
  html = html.replace(/<script type="module" src="[^"]*"><\/script>/, map + '\n  <script type="module" src="' + st.main.slice(2) + '"></script>');
  html = html.replace(/<link rel="stylesheet" href="css\/game\.css[^"]*">/, '<link rel="stylesheet" href="' + st.css.slice(2) + '">');
  return html;
}

if (import.meta.url === 'file://' + process.argv[1]) {
  const f = path.join(DIR, 'index.html');
  const before = fs.readFileSync(f, 'utf8'), after = stampedHtml(before);
  fs.writeFileSync(f, after);
  console.log(before === after ? 'index.html ya estaba al día' : 'index.html actualizado con las versiones');
}
