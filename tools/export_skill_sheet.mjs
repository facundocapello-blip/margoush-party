// Exportador automático por CLI (cero dependencias externas) de hojas de sprites transparentes
// (PNG RGBA + manifest.json + vista previa local HTML).
// Usa un servidor HTTP efímero de Node + Chrome/Edge headless vía CDP nativo (WebSocket de Node 22).
//
// Uso:
//   node tools/export_skill_sheet.mjs
//   node tools/export_skill_sheet.mjs --preset=douge_truth_slam --palette=solar_gold --size=lg --frames=16
//   node tools/export_skill_sheet.mjs --json='{"preset":"marine_ivy_whirl","palette":"heroic_coral","size":"xl"}'
//
// Escribe en dist/fx-preview/ (ignorado por git para mantener 3d/assets/ < 10 MB).

import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(fileURLToPath(new URL('..', import.meta.url)));

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml'
};

export function parseArgs(argv) {
  const opts = {
    preset: 'effekseer_astral_slash',
    palette: null,
    size: null,
    frames: null,
    json: null,
    screenshot: null,
    out: path.join(ROOT, 'dist/fx-preview')
  };
  for (const arg of argv) {
    if (arg.startsWith('--preset=')) opts.preset = arg.slice('--preset='.length);
    else if (arg.startsWith('--palette=')) opts.palette = arg.slice('--palette='.length);
    else if (arg.startsWith('--size=')) opts.size = arg.slice('--size='.length);
    else if (arg.startsWith('--frames=')) opts.frames = Number(arg.slice('--frames='.length));
    else if (arg.startsWith('--json=')) opts.json = arg.slice('--json='.length);
    else if (arg.startsWith('--screenshot=')) opts.screenshot = path.resolve(ROOT, arg.slice('--screenshot='.length));
    else if (arg.startsWith('--out=')) opts.out = path.resolve(ROOT, arg.slice('--out='.length));
  }
  return opts;
}

function findBrowserExecutable() {
  const candidates = [
    process.env.CHROME_PATH,
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
  ];
  const found = candidates.find((p) => p && fs.existsSync(p));
  if (!found) throw new Error('No se encontró Chrome/Chromium/Edge instalado para exportar el PNG.');
  return found;
}

function startStaticServer(rootDir) {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
      const safePath = path.resolve(rootDir, '.' + urlPath);
      if (!safePath.startsWith(rootDir) || !fs.existsSync(safePath) || fs.statSync(safePath).isDirectory()) {
        res.writeHead(404);
        res.end('Not found');
        return;
      }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(safePath)] || 'application/octet-stream' });
      res.end(fs.readFileSync(safePath));
    });
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolve({ server, baseUrl: `http://127.0.0.1:${port}` });
    });
  });
}

function launchCdpBrowser(exePath) {
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fx-cdp-'));
  const proc = spawn(exePath, [
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    '--disable-dev-shm-usage',
    '--no-first-run',
    '--remote-debugging-port=0',
    `--user-data-dir=${userDataDir}`,
    'about:blank'
  ], { stdio: ['ignore', 'ignore', 'pipe'] });

  return new Promise((resolve, reject) => {
    let stderrBuf = '';
    const timer = setTimeout(() => {
      proc.kill('SIGKILL');
      reject(new Error('Tiempo agotado iniciando Chrome CDP: ' + stderrBuf));
    }, 10000);

    proc.stderr.on('data', (chunk) => {
      stderrBuf += chunk.toString('utf8');
      const m = stderrBuf.match(/DevTools listening on (ws:\/\/[^\s]+)/);
      if (m) {
        clearTimeout(timer);
        resolve({ proc, wsEndpoint: m[1], userDataDir });
      }
    });
    proc.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

async function connectPageSession(browserWsUrl) {
  const httpBase = browserWsUrl.replace(/^ws:/, 'http:').replace(/\/devtools\/browser\/.*$/, '');
  const listRes = await fetch(`${httpBase}/json/list`);
  const targets = await listRes.json();
  const pageTarget = targets.find((t) => t.type === 'page') || targets[0];
  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);

  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve, { once: true });
    ws.addEventListener('error', reject, { once: true });
  });

  let nextId = 1;
  const pending = new Map();
  ws.addEventListener('message', (ev) => {
    const msg = JSON.parse(String(ev.data));
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(msg.error.message));
      else resolve(msg.result);
    }
  });

  function send(method, params = {}) {
    const id = nextId++;
    ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
  }

  return { ws, send };
}

export async function exportSkillSheetCli(rawOpts = {}) {
  const opts = { ...parseArgs([]), ...rawOpts };
  const exePath = findBrowserExecutable();
  const { server, baseUrl } = await startStaticServer(ROOT);
  const { proc, wsEndpoint, userDataDir } = await launchCdpBrowser(exePath);

  try {
    const { ws, send } = await connectPageSession(wsEndpoint);
    await send('Page.enable');
    await send('Runtime.enable');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1360,
      height: 1180,
      deviceScaleFactor: 1,
      mobile: false
    });

    await send('Page.navigate', { url: `${baseUrl}/3d/fx-studio.html` });

    // Esperar a que el módulo inicialice y genere el primer bake
    let ready = false;
    for (let attempt = 0; attempt < 80; attempt++) {
      const check = await send('Runtime.evaluate', {
        expression: 'Boolean(window.__skillFxLab && window.__skillFxLab.getLatestBaked())',
        returnByValue: true
      });
      if (check.result?.value === true) { ready = true; break; }
      await new Promise((r) => setTimeout(r, 50));
    }
    if (!ready) {
      const hrefCheck = await send('Runtime.evaluate', { expression: 'document.readyState + " | " + location.href + " | " + document.body?.innerHTML?.slice(0,120)', returnByValue: true });
      throw new Error('La página FX Studio no terminó de inicializar: ' + hrefCheck.result?.value);
    }

    const evalRes = await send('Runtime.evaluate', {
      awaitPromise: true,
      returnByValue: true,
      expression: `((cfg) => {
        const { fxSystem } = window.__skillFxLab;
        let patch = { preset: cfg.preset };
        if (cfg.json) patch = { ...patch, ...JSON.parse(cfg.json) };
        if (cfg.palette) patch.palette = cfg.palette;
        if (cfg.size) patch.size = cfg.size;
        if (cfg.frames) patch.sheet = { ...(patch.sheet || {}), frames: cfg.frames };

        fxSystem.applyJson(patch);
        const baked = fxSystem.bakeSheet(cfg.frames ? { frames: cfg.frames } : {});
        const ctx = baked.canvas.getContext('2d');
        const imgData = ctx.getImageData(0, 0, baked.meta.w, baked.meta.h).data;

        const cornerAlpha = imgData[3] + imgData[(baked.meta.w - 1) * 4 + 3];
        let nonZeroPixels = 0;
        for (let i = 3; i < imgData.length; i += 16) {
          if (imgData[i] > 8) nonZeroPixels++;
        }

        return {
          dataUrl: baked.toDataURL('image/png'),
          meta: baked.meta,
          manifestEntry: baked.manifestEntry,
          resolvedJson: fxSystem.toJSON(),
          cornerAlpha,
          nonZeroPixels
        };
      })(${JSON.stringify(opts)})`
    });

    if (evalRes.exceptionDetails) {
      throw new Error('Fallo evaluando bakeSpriteSheet: ' + (evalRes.exceptionDetails.exception?.description || evalRes.exceptionDetails.text));
    }

    const exported = evalRes.result.value;
    fs.mkdirSync(opts.out, { recursive: true });

    const base64 = exported.dataUrl.replace(/^data:image\/png;base64,/, '');
    const pngPath = path.join(opts.out, exported.meta.file);
    const metaPath = path.join(opts.out, exported.meta.file.replace(/\.png$/, '.manifest.json'));
    const previewHtmlPath = path.join(opts.out, 'preview.html');

    fs.writeFileSync(pngPath, Buffer.from(base64, 'base64'));
    fs.writeFileSync(metaPath, JSON.stringify({
      meta: exported.meta,
      manifest: exported.manifestEntry,
      config: exported.resolvedJson
    }, null, 2));

    if (opts.screenshot) {
      await send('Runtime.evaluate', {
        expression: `(() => {
          const s = document.getElementById('timeline-scrub');
          if (s) { s.value = '28'; s.dispatchEvent(new Event('input')); }
        })()`
      });
      await new Promise((r) => setTimeout(r, 150));
      const shot = await send('Page.captureScreenshot', { format: 'png' });
      fs.mkdirSync(path.dirname(opts.screenshot), { recursive: true });
      fs.writeFileSync(opts.screenshot, Buffer.from(shot.data, 'base64'));
    }

    const previewHtml = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Vista previa local · ${exported.meta.file}</title>
  <style>
    body { margin: 0; padding: 24px; background: #12151c; color: #f4f1ea; font-family: system-ui, sans-serif; }
    .row { display: flex; gap: 24px; flex-wrap: wrap; align-items: flex-start; }
    .checker {
      background-color: #191d26;
      background-image: linear-gradient(45deg,#252b38 25%,transparent 25%),linear-gradient(-45deg,#252b38 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#252b38 75%),linear-gradient(-45deg,transparent 75%,#252b38 75%);
      background-size: 20px 20px; background-position: 0 0,0 10px,10px -10px,-10px 0;
      border: 1px solid #303746; border-radius: 10px; padding: 12px;
    }
    img { max-width: min(100%, 880px); height: auto; display: block; }
  </style>
</head>
<body>
  <h1 style="margin:0 0 6px;font-size:1.2rem;">${exported.meta.file}</h1>
  <p style="margin:0 0 18px;color:#9aa4b8;font-family:monospace;">${exported.meta.w}×${exported.meta.h} px · ${exported.meta.cols}×${exported.meta.rows} (${exported.meta.frames} cuadros @ ${exported.meta.fps} FPS) · Fondo RGBA transparente</p>
  <div class="row">
    <div class="checker">
      <canvas id="anim" width="${exported.meta.cellW}" height="${exported.meta.cellH}"></canvas>
    </div>
    <div class="checker">
      <img id="sheet" src="./${exported.meta.file}" alt="Sprite sheet">
    </div>
  </div>
  <script>
    const meta = ${JSON.stringify(exported.meta)};
    const img = document.getElementById('sheet');
    const c = document.getElementById('anim');
    const g = c.getContext('2d');
    const t0 = performance.now();
    function loop(now) {
      if (img.complete && img.naturalWidth > 0) {
        const idx = Math.floor(((now - t0) / 1000) * meta.fps) % meta.frames;
        const sx = (idx % meta.cols) * meta.cellW;
        const sy = Math.floor(idx / meta.cols) * meta.cellH;
        g.clearRect(0, 0, c.width, c.height);
        g.drawImage(img, sx, sy, meta.cellW, meta.cellH, 0, 0, meta.cellW, meta.cellH);
      }
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  </script>
</body>
</html>`;
    fs.writeFileSync(previewHtmlPath, previewHtml);
    await send('Browser.close').catch(() => {});
    ws.close();

    return {
      pngPath,
      metaPath,
      previewHtmlPath,
      meta: exported.meta,
      cornerAlpha: exported.cornerAlpha,
      nonZeroPixels: exported.nonZeroPixels
    };
  } finally {
    if (proc.exitCode === null) {
      proc.kill('SIGKILL');
      await new Promise((r) => proc.once('exit', r));
    }
    server.close();
    try { fs.rmSync(userDataDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 60 }); } catch (_) {}
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  const opts = parseArgs(process.argv.slice(2));
  const res = await exportSkillSheetCli(opts);
  console.log(`✓ Hoja de sprites transparente exportada: ${res.pngPath}`);
  console.log(`  Dimensiones: ${res.meta.w}x${res.meta.h} (${res.meta.cols}x${res.meta.rows}, ${res.meta.frames} cuadros @ ${res.meta.fps} FPS)`);
  console.log(`  Alfa en esquinas: ${res.cornerAlpha} (transparente) · muestras luminosas: ${res.nonZeroPixels}`);
  console.log(`  Manifiesto: ${res.metaPath}`);
  console.log(`  Vista previa local: ${res.previewHtmlPath}`);
}
