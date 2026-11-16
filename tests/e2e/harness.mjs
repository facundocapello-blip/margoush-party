// Arnés de pruebas: sirve el repo desde disco en http://game.local/ dentro de Chrome sin pantalla.
import { chromium } from '/opt/npm-tools/node_modules/playwright/index.mjs';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(new URL('../../', import.meta.url).pathname);
const THREE_LOCAL = '/home/claude/tools/node_modules/three/build/three.min.js';
const TYPES = { '.html': 'text/html', '.js': 'application/javascript', '.mjs': 'application/javascript', '.css': 'text/css',
  '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png', '.mp3': 'audio/mpeg', '.svg': 'image/svg+xml' };
export const OUT = path.join(ROOT, 'tests/e2e/out');
fs.mkdirSync(OUT, { recursive: true });

export async function launch({ viewport = { width: 960, height: 540 }, mobile = false, routes = [] } = {}) {
  const browser = await chromium.launch({
    executablePath: '/usr/bin/google-chrome',
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox', '--autoplay-policy=no-user-gesture-required']
  });
  const context = await browser.newContext(mobile ? { viewport, hasTouch: true, isMobile: true, deviceScaleFactor: 2 } : { viewport });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/ERR_FAILED|Failed to load resource/.test(m.text())) errors.push('console: ' + m.text()); });
  for (const [pattern, handler] of routes) await page.route(pattern, handler);
  await page.route('**/*', async (route) => {
    const url = new URL(route.request().url());
    if (url.hostname === 'cdnjs.cloudflare.com' && url.pathname.endsWith('three.min.js'))
      return route.fulfill({ contentType: 'application/javascript', body: fs.readFileSync(THREE_LOCAL) });
    if (url.hostname !== 'game.local') return route.fallback();
    const file = path.join(ROOT, decodeURIComponent(url.pathname));
    if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) return route.fulfill({ status: 404, body: 'no' });
    return route.fulfill({ contentType: TYPES[path.extname(file)] || 'application/octet-stream', body: fs.readFileSync(file) });
  });
  await page.route(/^(?!http:\/\/game\.local|https:\/\/cdnjs\.cloudflare\.com).*/, r => r.abort());
  return { browser, context, page, errors };
}

export async function open(page) {
  await page.goto('http://game.local/3d/index.html');
  await page.waitForFunction(() => window.__game && window.__game.state === 'menu', null, { timeout: 20000 });
}

// Del menú a jugar con el héroe elegido, saltando la intro si existe.
export async function startRun(page, hero = 'douge') {
  await page.evaluate((h) => window.__game.quickStart(h), hero);
  await page.waitForFunction(() => window.__game.state === 'playing', null, { timeout: 10000 });
}

export function check(cond, msg) {
  if (!cond) throw new Error('FALLÓ: ' + msg);
  console.log('ok -', msg);
}

export async function shot(page, name) {
  await page.screenshot({ path: path.join(OUT, name + '.png') });
}
