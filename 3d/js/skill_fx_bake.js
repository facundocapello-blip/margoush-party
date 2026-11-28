// HORNEADO de efectos de habilidades a hoja de sprites transparente (<= 2048 px de ancho por Safari iOS).
import { MAX_SAFARI_ATLAS, compileSkillEffect, renderSkillFrame } from './skill_fx_engine.js';

// --- Empaquetador y exportador automático de Hoja de Sprites transparente (<= 2048 px Safari iOS) ---

export function computeSheetLayout({ frames = 16, cellSize = 192, maxAtlasWidth = MAX_SAFARI_ATLAS } = {}) {
  const safeMax = Math.min(MAX_SAFARI_ATLAS, Math.max(256, maxAtlasWidth));
  const f = Math.max(1, Math.min(64, Math.round(frames)));
  let cell = Math.max(64, Math.min(512, Math.round(cellSize)));

  // Ajustar tamaño de celda si la grilla superara 2048x2048 px en iOS/WebGL
  while (cell > 64) {
    const maxCols = Math.max(1, Math.floor(safeMax / cell));
    const colsTry = Math.min(f, maxCols);
    const rowsTry = Math.ceil(f / colsTry);
    if (colsTry * cell <= safeMax && rowsTry * cell <= safeMax) break;
    cell -= 16;
  }

  const maxCols = Math.max(1, Math.floor(safeMax / cell));
  // Preferir grilla equilibrada cercana a cuadrada o potencia par sin pasar de safeMax
  let bestCols = Math.min(f, maxCols);
  let bestScore = Infinity;
  for (let c = 1; c <= Math.min(f, maxCols); c++) {
    const r = Math.ceil(f / c);
    if (r * cell > safeMax) continue;
    const emptyCells = c * r - f;
    const ratio = Math.max((c * cell) / (r * cell), (r * cell) / (c * cell));
    const score = emptyCells * 1.8 + ratio;
    if (score < bestScore) {
      bestScore = score;
      bestCols = c;
    }
  }
  const cols = bestCols;
  const rows = Math.ceil(f / cols);
  return {
    frames: f,
    cols,
    rows,
    cellW: cell,
    cellH: cell,
    w: cols * cell,
    h: rows * cell
  };
}

function defaultCreateCanvas(w, h) {
  if (typeof OffscreenCanvas !== 'undefined' && typeof document === 'undefined') {
    return new OffscreenCanvas(w, h);
  }
  if (typeof document !== 'undefined') {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    return c;
  }
  throw new Error('Se requiere document.createElement("canvas") o pasar options.createCanvas(w, h)');
}

export function bakeSpriteSheet(configOrCompiled, options = {}) {
  const compiled = configOrCompiled?.sparkPool ? configOrCompiled : compileSkillEffect(configOrCompiled);
  const frames = options.frames ?? compiled.sheet.frames;
  const fps = options.fps ?? compiled.sheet.fps;
  const cellSize = options.cellSize ?? compiled.sheet.cellSize;
  const maxAtlasWidth = options.maxAtlasWidth ?? compiled.sheet.maxAtlasWidth;

  const layout = computeSheetLayout({ frames, cellSize, maxAtlasWidth });
  const createCanvas = options.createCanvas || defaultCreateCanvas;
  const canvas = createCanvas(layout.w, layout.h);
  canvas.width = layout.w;
  canvas.height = layout.h;
  const ctx = canvas.getContext('2d', { alpha: true });

  // Limpieza total RGBA(0,0,0,0): fondo 100 % transparente
  ctx.clearRect(0, 0, layout.w, layout.h);

  const cells = new Array(layout.frames);
  const pad = 2; // margen interno anti-sangrado UV entre celdas vecinas
  const maxRefR = Math.max(
    compiled.layers.shockwave?.endRadius || 76,
    compiled.layers.trail?.radius || 68,
    (compiled.layers.core?.radius || 38) * Math.max(2.45, (compiled.layers.core?.flareLength || 1.9) * 1.12)
  ) * compiled.scale * 1.08;
  const fitRatio = (options.autoFit !== false && maxRefR > layout.cellW * 0.46)
    ? (layout.cellW * 0.46) / maxRefR
    : 1;

  for (let i = 0; i < layout.frames; i++) {
    const col = i % layout.cols;
    const row = Math.floor(i / layout.cols);
    const x = col * layout.cellW;
    const y = row * layout.cellH;
    // Muestreamos el centro de cada intervalo de cuadro para capturar tanto el ataque como la cola final
    const tNorm = layout.frames === 1 ? 0.35 : (i + 0.38) / layout.frames;

    ctx.save();
    ctx.beginPath();
    ctx.rect(x + pad, y + pad, layout.cellW - pad * 2, layout.cellH - pad * 2);
    ctx.clip();
    ctx.translate(x + layout.cellW * 0.5, y + layout.cellH * 0.5);
    if (fitRatio !== 1) ctx.scale(fitRatio, fitRatio);
    renderSkillFrame(ctx, compiled, tNorm, {
      x: 0,
      y: 0,
      facing: options.facing ?? 1,
      layerMask: options.layerMask || null
    });
    ctx.restore();

    cells[i] = { index: i, col, row, x, y, w: layout.cellW, h: layout.cellH, tNorm: +tNorm.toFixed(4) };
  }

  const fileBase = `${compiled.id}_${compiled.palette.id}_${compiled.size.id}`;
  const meta = {
    id: compiled.id,
    file: `${fileBase}_sheet.png`,
    w: layout.w,
    h: layout.h,
    cellW: layout.cellW,
    cellH: layout.cellH,
    frames: layout.frames,
    cols: layout.cols,
    rows: layout.rows,
    fps,
    duration: +(layout.frames / fps).toFixed(3),
    foot: 0.5,
    transparent: true,
    palette: compiled.palette.id,
    size: compiled.size.id,
    scale: compiled.scale
  };

  return {
    canvas,
    meta,
    manifestEntry: {
      [fileBase]: {
        file: meta.file,
        w: meta.w,
        h: meta.h,
        frames: meta.frames,
        cols: meta.cols,
        rows: meta.rows,
        foot: 0.5
      }
    },
    cells,
    compiled,
    toDataURL(type = 'image/png', quality) {
      return typeof canvas.toDataURL === 'function' ? canvas.toDataURL(type, quality) : null;
    },
    async toBlob(type = 'image/png', quality) {
      if (typeof canvas.convertToBlob === 'function') return canvas.convertToBlob({ type, quality });
      if (typeof canvas.toBlob === 'function') {
        return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
      }
      return null;
    }
  };
}

