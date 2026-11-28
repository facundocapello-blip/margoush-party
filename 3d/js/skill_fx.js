// Generador y reproductor reutilizable de efectos de habilidades multicapa (2D / 2.5D)
// Referencia arquitectónica: estructura de nodos superpuestos de Effekseer (https://github.com/effekseer/Effekseer)
// y arquetipos CC-0 (https://effekseer.github.io/en/contribute.html), adaptado a MARGOUSH (Canvas2D + puente Three.js).
//
// Capas explícitas del efecto:
//   1. core      — Núcleo brillante (Sprite + Cross-Flare estelar aditivo)
//   2. trail     — Estela de trayectoria (Ribbon / Track teselado con caída alfa/ancho)
//   3. shockwave — Onda de choque anular (Ring con radios interno/externo de easing independiente)
//   4. sparks    — Chispas y fragmentos (Streaks estirados por velocidad + fragmentos giratorios)

import { SKILL_PALETTES, SKILL_SIZES, SKILL_PRESETS } from './skill_fx_presets.js';

export { SKILL_PALETTES, SKILL_SIZES, SKILL_PRESETS };

export const SKILL_LAYER_ORDER = ['shockwave', 'trail', 'sparks', 'core'];
export const MAX_SAFARI_ATLAS = 2048;

const TAU = Math.PI * 2;
const DEG2RAD = Math.PI / 180;

// --- Utilidades deterministas y curvas de easing estilo Effekseer PVA/Easing ---

export function mulberry32(seed) {
  let a = (seed >>> 0) || 1;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const lerp = (a, b, t) => a + (b - a) * t;
const easeOutQuad = (t) => 1 - (1 - t) * (1 - t);
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
const easeOutQuart = (t) => 1 - Math.pow(1 - t, 4);
const easeOutBack = (t) => {
  const c1 = 1.70158, c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

function windowProgress(tNorm, startAt = 0, endAt = 1) {
  const span = Math.max(0.001, endAt - startAt);
  if (tNorm < startAt || tNorm > endAt) return -1;
  return clamp01((tNorm - startAt) / span);
}

// Convierte #rgb / #rrggbb a { r, g, b } para gradientes sin halo gris en alfa=0
export function parseHexColor(hex, fallback = { r: 255, g: 255, b: 255 }) {
  if (typeof hex !== 'string') return fallback;
  const clean = hex.trim().replace(/^#/, '');
  if (/^[0-9a-fA-F]{3}$/.test(clean)) {
    return {
      r: parseInt(clean[0] + clean[0], 16),
      g: parseInt(clean[1] + clean[1], 16),
      b: parseInt(clean[2] + clean[2], 16)
    };
  }
  if (/^[0-9a-fA-F]{6}$/.test(clean)) {
    return {
      r: parseInt(clean.slice(0, 2), 16),
      g: parseInt(clean.slice(2, 4), 16),
      b: parseInt(clean.slice(4, 6), 16)
    };
  }
  return fallback;
}

function rgba(rgb, alpha) {
  const a = alpha < 0 ? 0 : alpha > 1 ? 1 : +alpha.toFixed(4);
  return `rgba(${rgb.r},${rgb.g},${rgb.b},${a})`;
}

// --- Resolución y fusión declarativa JSON (paleta y tamaño con un clic) ---

function cloneDeep(obj) {
  return JSON.parse(JSON.stringify(obj));
}

export function resolvePalette(paletteInput) {
  if (typeof paletteInput === 'string' && SKILL_PALETTES[paletteInput]) {
    const p = SKILL_PALETTES[paletteInput];
    return {
      id: p.id,
      label: p.label,
      hex: { core: p.core, primary: p.primary, secondary: p.secondary, accent: p.accent, debris: p.debris },
      rgb: {
        core: parseHexColor(p.core),
        primary: parseHexColor(p.primary),
        secondary: parseHexColor(p.secondary),
        accent: parseHexColor(p.accent),
        debris: parseHexColor(p.debris)
      }
    };
  }
  const base = SKILL_PALETTES.astral_cyan;
  const custom = (paletteInput && typeof paletteInput === 'object') ? paletteInput : {};
  const hex = {
    core: custom.core || base.core,
    primary: custom.primary || base.primary,
    secondary: custom.secondary || base.secondary,
    accent: custom.accent || base.accent,
    debris: custom.debris || custom.accent || base.debris
  };
  return {
    id: custom.id || 'custom',
    label: custom.label || { es: 'Personalizada', fr: 'Personnalisée' },
    hex,
    rgb: {
      core: parseHexColor(hex.core),
      primary: parseHexColor(hex.primary),
      secondary: parseHexColor(hex.secondary),
      accent: parseHexColor(hex.accent),
      debris: parseHexColor(hex.debris)
    }
  };
}

export function resolveSize(sizeInput) {
  if (typeof sizeInput === 'string' && SKILL_SIZES[sizeInput]) {
    return { ...SKILL_SIZES[sizeInput] };
  }
  if (typeof sizeInput === 'number' && Number.isFinite(sizeInput)) {
    const scale = Math.max(0.25, Math.min(3.0, sizeInput));
    const cellSize = scale <= 0.6 ? 128 : scale <= 0.85 ? 160 : scale <= 1.1 ? 192 : scale <= 1.45 ? 256 : 320;
    return { id: 'custom', scale, cellSize, label: { es: `${scale.toFixed(2)}×`, fr: `${scale.toFixed(2)}×` } };
  }
  if (sizeInput && typeof sizeInput === 'object') {
    const scale = Math.max(0.25, Math.min(3.0, Number(sizeInput.scale) || 1));
    const cellSize = Math.max(64, Math.min(512, Math.round(Number(sizeInput.cellSize) || 192)));
    return { id: sizeInput.id || 'custom', scale, cellSize, label: sizeInput.label || { es: `${scale}×`, fr: `${scale}×` } };
  }
  return { ...SKILL_SIZES.md };
}

export function applySkillPatch(baseConfig, jsonPatch) {
  const base = typeof baseConfig === 'string'
    ? (SKILL_PRESETS[baseConfig] ? cloneDeep(SKILL_PRESETS[baseConfig]) : JSON.parse(baseConfig))
    : cloneDeep(baseConfig || SKILL_PRESETS.effekseer_astral_slash);
  const patch = typeof jsonPatch === 'string' ? JSON.parse(jsonPatch) : (jsonPatch || {});

  // Si el patch cambia de arquetipo base (`preset` o `id` conocido sin capas completas), parte de ese preset
  let target = base;
  if (patch.preset && SKILL_PRESETS[patch.preset]) {
    target = cloneDeep(SKILL_PRESETS[patch.preset]);
  }

  const merged = {
    ...target,
    ...patch,
    sheet: { ...(target.sheet || {}), ...(patch.sheet || {}) },
    layers: {
      core: { ...(target.layers?.core || {}), ...(patch.layers?.core || {}) },
      trail: { ...(target.layers?.trail || {}), ...(patch.layers?.trail || {}) },
      shockwave: { ...(target.layers?.shockwave || {}), ...(patch.layers?.shockwave || {}) },
      sparks: { ...(target.layers?.sparks || {}), ...(patch.layers?.sparks || {}) }
    }
  };
  delete merged.preset;
  return merged;
}

// Precompila partículas deterministas de la capa 4 para evitar asignaciones por cuadro (R-3 safe)
export function compileSkillEffect(inputConfig) {
  const raw = typeof inputConfig === 'string'
    ? (SKILL_PRESETS[inputConfig] ? cloneDeep(SKILL_PRESETS[inputConfig]) : JSON.parse(inputConfig))
    : cloneDeep(inputConfig || SKILL_PRESETS.effekseer_astral_slash);

  const fallback = SKILL_PRESETS.effekseer_astral_slash;
  const palette = resolvePalette(raw.palette);
  const size = resolveSize(raw.size);
  const duration = Math.max(0.15, Math.min(4.0, Number(raw.duration) || fallback.duration));
  const seed = (Number(raw.seed) || 108) >>> 0;

  const layers = {
    core: { ...fallback.layers.core, ...(raw.layers?.core || {}) },
    trail: { ...fallback.layers.trail, ...(raw.layers?.trail || {}) },
    shockwave: { ...fallback.layers.shockwave, ...(raw.layers?.shockwave || {}) },
    sparks: { ...fallback.layers.sparks, ...(raw.layers?.sparks || {}) }
  };

  const sheet = {
    frames: Math.max(4, Math.min(64, Math.round(Number(raw.sheet?.frames) || 16))),
    fps: Math.max(6, Math.min(60, Math.round(Number(raw.sheet?.fps) || 24))),
    cellSize: Number(raw.sheet?.cellSize) || size.cellSize,
    maxAtlasWidth: Math.min(MAX_SAFARI_ATLAS, Math.max(256, Number(raw.sheet?.maxAtlasWidth) || MAX_SAFARI_ATLAS))
  };

  // Precompilar descriptores inmutables de chispas y fragmentos
  const rng = mulberry32(seed);
  const sp = layers.sparks;
  const sparkCount = Math.max(0, Math.min(96, Math.round(sp.sparkCount ?? 20)));
  const shardCount = Math.max(0, Math.min(64, Math.round(sp.shardCount ?? 10)));
  const dirRad = (sp.directionDeg ?? 0) * DEG2RAD;
  const spreadRad = (sp.spreadDeg ?? 360) * DEG2RAD;

  const sparkPool = new Array(sparkCount);
  for (let i = 0; i < sparkCount; i++) {
    const angle = dirRad + (rng() - 0.5) * spreadRad;
    const speed = lerp(sp.speedMin ?? 110, sp.speedMax ?? 300, Math.pow(rng(), 0.72));
    sparkPool[i] = {
      vx0: Math.cos(angle) * speed,
      vy0: Math.sin(angle) * speed,
      delay: rng() * 0.14,
      lifeFrac: lerp(0.52, 0.96, rng()),
      lenScale: lerp(0.75, 1.45, rng()),
      thick: lerp(1.6, 3.6, rng()),
      useAccent: rng() > 0.45
    };
  }

  const shardPool = new Array(shardCount);
  for (let i = 0; i < shardCount; i++) {
    const angle = dirRad + (rng() - 0.5) * spreadRad;
    const speed = lerp((sp.speedMin ?? 110) * 0.65, (sp.speedMax ?? 300) * 0.82, rng());
    shardPool[i] = {
      vx0: Math.cos(angle) * speed,
      vy0: Math.sin(angle) * speed,
      delay: rng() * 0.12,
      lifeFrac: lerp(0.62, 1.0, rng()),
      radius: lerp(4.2, 8.8, rng()) * (sp.shardSize ?? 1),
      rot0: rng() * TAU,
      spin: (rng() > 0.5 ? 1 : -1) * lerp(4.5, 13.0, rng()),
      flipFreq: lerp(5.0, 11.0, rng()),
      tintCore: rng() > 0.68
    };
  }

  return {
    id: raw.id || 'custom_skill',
    name: raw.name || { es: 'Habilidad Personalizada', fr: 'Compétence Personnalisée' },
    raw,
    palette,
    size,
    scale: size.scale,
    duration,
    seed,
    sheet,
    layers,
    sparkPool,
    shardPool
  };
}

// --- Evaluador paramétrico de trayectoria (compartido por Capa 2 Trail y Capa 1 Core opcional) ---

// Reutilización de objeto temporal para evitar basura en el GC
const _pt = { x: 0, y: 0, tx: 1, ty: 0 };

function evalTrajectory(trail, u, ribbonIdx, ribbonCount, scale, facing) {
  const mode = trail.mode || 'slash_arc';
  const R = (trail.radius ?? 68) * scale;
  const tiltY = trail.tiltY ?? 0.75;
  const turb = (trail.turbulence ?? 0.12) * scale;

  if (mode === 'ground_slam') {
    const side = ribbonIdx % 2 === 0 ? 1 : -1;
    const spread = ribbonIdx * 10 * scale * side;
    const yStart = -R * 1.18;
    const yEnd = R * 0.18;
    const ease = easeOutQuad(u);
    const x = (Math.sin(u * Math.PI) * 14 * side * scale + spread * (1 - u)) * facing;
    const y = lerp(yStart, yEnd, ease);
    _pt.x = x;
    _pt.y = y;
    _pt.tx = side * 0.15 * facing;
    _pt.ty = 1;
    return _pt;
  }

  if (mode === 'projectile_lance') {
    const span = R * 1.65;
    const x0 = -span * 0.55 * facing;
    const x1 = span * 0.62 * facing;
    const ang = (trail.startDeg ?? -20) * DEG2RAD;
    const forward = lerp(x0, x1, easeOutCubic(u));
    const wave = Math.sin(u * TAU * 1.5 + ribbonIdx * Math.PI) * (10 * scale + turb * 30) * (1 - u * 0.55);
    const cosA = Math.cos(ang), sinA = Math.sin(ang);
    _pt.x = forward * cosA - wave * sinA;
    _pt.y = (forward * sinA * facing + wave * cosA) * tiltY;
    _pt.tx = cosA * facing;
    _pt.ty = sinA * tiltY;
    return _pt;
  }

  if (mode === 'spiral_vortex') {
    const phaseOff = (ribbonIdx / Math.max(1, ribbonCount)) * TAU;
    const angle = (trail.startDeg ?? 0) * DEG2RAD + phaseOff + u * (trail.arcDeg ?? 380) * DEG2RAD * facing;
    const rad = R * lerp(0.24, 1.0, easeOutCubic(u)) + Math.sin(u * 14 + ribbonIdx) * turb * 16;
    _pt.x = Math.cos(angle) * rad;
    _pt.y = Math.sin(angle) * rad * tiltY - u * 8 * scale;
    _pt.tx = -Math.sin(angle) * facing;
    _pt.ty = Math.cos(angle) * tiltY * facing;
    return _pt;
  }

  if (mode === 'radial_burst') {
    const armAngle = (trail.startDeg ?? -90) * DEG2RAD + (ribbonIdx / Math.max(1, ribbonCount)) * TAU;
    const curl = Math.sin(u * Math.PI * 1.5) * 0.28 * (ribbonIdx % 2 === 0 ? 1 : -1);
    const a = armAngle + curl;
    const dist = R * lerp(0.1, 1.02, easeOutQuart(u));
    _pt.x = Math.cos(a) * dist * facing;
    _pt.y = Math.sin(a) * dist * tiltY;
    _pt.tx = Math.cos(a) * facing;
    _pt.ty = Math.sin(a) * tiltY;
    return _pt;
  }

  // Por defecto: 'slash_arc' (arco de corte estilo Effekseer Ribbon)
  const rOff = ribbonIdx === 0 ? 1 : (1 - ribbonIdx * 0.17);
  const startRad = (trail.startDeg ?? -140) * DEG2RAD;
  const sweepRad = (trail.arcDeg ?? 230) * DEG2RAD;
  const angle = startRad + easeOutCubic(u) * sweepRad;
  const rad = R * rOff + Math.sin(u * 10 + ribbonIdx * 2.1) * turb * 14;
  _pt.x = Math.cos(angle) * rad * facing;
  _pt.y = Math.sin(angle) * rad * tiltY;
  _pt.tx = -Math.sin(angle) * facing;
  _pt.ty = Math.cos(angle) * tiltY;
  return _pt;
}

// Buffers preasignados para teselación de cinta (máx 32 segmentos, 0 allocs en render)
const MAX_SEG = 28;
const _lx = new Float32Array(MAX_SEG + 1);
const _ly = new Float32Array(MAX_SEG + 1);
const _rx = new Float32Array(MAX_SEG + 1);
const _ry = new Float32Array(MAX_SEG + 1);
const _cx = new Float32Array(MAX_SEG + 1);
const _cy = new Float32Array(MAX_SEG + 1);

// --- CAPA 3: Onda de choque anular (Effekseer Ring Renderer) ---

function renderShockwaveLayer(ctx, compiled, tNorm, ox, oy) {
  const sw = compiled.layers.shockwave;
  if (!sw.enabled) return 0;
  const kBase = windowProgress(tNorm, sw.startAt ?? 0.04, sw.endAt ?? 0.9);
  if (kBase < 0) return 0;

  const { rgb } = compiled.palette;
  const scale = compiled.scale;
  const rings = Math.max(1, Math.min(4, Math.round(sw.rings ?? 2)));
  const stagger = sw.stagger ?? 0.1;
  const tiltY = sw.tiltY ?? 0.75;
  const rot = (sw.rotationDeg ?? 0) * DEG2RAD;
  let drawn = 0;

  ctx.save();
  ctx.translate(ox, oy);
  if (rot !== 0) ctx.rotate(rot);
  ctx.scale(1, tiltY);

  for (let i = 0; i < rings; i++) {
    const span = Math.max(0.2, 1 - stagger * (rings - 1));
    const k = clamp01((kBase - i * stagger) / span);
    if (k <= 0 || k >= 1) continue;

    const rScale = 1 - i * 0.16;
    const r0 = (sw.startRadius ?? 12) * scale * rScale;
    const r1 = (sw.endRadius ?? 82) * scale * rScale;
    // Radio exterior avanza con outQuart; interior lo alcanza con outQuad -> anillo se adelgaza con elegancia
    const outerR = lerp(r0, r1, easeOutQuart(k));
    const baseThick = (sw.thickness ?? 18) * scale * rScale * (1 - k * 0.82);
    const innerR = Math.max(0.5, outerR - Math.max(1.5, baseThick));
    const alpha = Math.pow(1 - k, 1.45) * (i === 0 ? 0.92 : 0.65);

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const grad = ctx.createRadialGradient(0, 0, innerR * 0.92, 0, 0, outerR * 1.04);
    const colOuter = i % 2 === 0 ? rgb.primary : rgb.accent;
    grad.addColorStop(0, rgba(rgb.secondary, 0));
    grad.addColorStop(0.38, rgba(colOuter, alpha * 0.55));
    grad.addColorStop(0.78, rgba(rgb.core, alpha * 0.92));
    grad.addColorStop(1, rgba(colOuter, 0));

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, outerR * 1.04, 0, TAU);
    ctx.arc(0, 0, innerR * 0.92, 0, TAU, true);
    ctx.fill('evenodd');

    // Filo energético nítido exterior
    ctx.strokeStyle = rgba(rgb.core, alpha * 0.8);
    ctx.lineWidth = Math.max(1, 2.2 * scale * (1 - k));
    ctx.beginPath();
    ctx.arc(0, 0, outerR * 0.97, 0, TAU);
    ctx.stroke();

    // Ticks radiales opcionales de onda supersónica
    const dashes = Math.round(sw.dashCount ?? 0);
    if (dashes > 0 && i === 0) {
      ctx.strokeStyle = rgba(rgb.accent, alpha * 0.72);
      ctx.lineWidth = Math.max(1, 1.8 * scale);
      for (let d = 0; d < dashes; d++) {
        const a = (d / dashes) * TAU + k * 0.45;
        const rIn = outerR * 0.88;
        const rOut = outerR * 1.08;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * rIn, Math.sin(a) * rIn);
        ctx.lineTo(Math.cos(a) * rOut, Math.sin(a) * rOut);
        ctx.stroke();
      }
    }
    ctx.restore();
    drawn++;
  }

  ctx.restore();
  return drawn;
}

// --- CAPA 2: Estela de trayectoria (Effekseer Ribbon / Track Renderer) ---

function strokeTaperedRibbon(ctx, count, halfWidths, colorHead, colorTail, alpha) {
  const last = count - 1;
  for (let i = 0; i < count; i++) {
    const s = last > 0 ? i / last : 0;
    const hw = halfWidths * Math.sin(Math.pow(s, 0.65) * Math.PI);
    const dx = _cx[Math.min(last, i + 1)] - _cx[Math.max(0, i - 1)];
    const dy = _cy[Math.min(last, i + 1)] - _cy[Math.max(0, i - 1)];
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    _lx[i] = _cx[i] + nx * hw;
    _ly[i] = _cy[i] + ny * hw;
    _rx[i] = _cx[i] - nx * hw;
    _ry[i] = _cy[i] - ny * hw;
  }
  const grad = ctx.createLinearGradient(_cx[0], _cy[0], _cx[count - 1], _cy[count - 1]);
  grad.addColorStop(0, rgba(colorTail, 0));
  grad.addColorStop(0.35, rgba(colorTail, alpha * 0.62));
  grad.addColorStop(0.82, rgba(colorHead, alpha * 0.95));
  grad.addColorStop(1, rgba(colorHead, alpha));

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(_lx[0], _ly[0]);
  for (let i = 1; i < count; i++) ctx.lineTo(_lx[i], _ly[i]);
  for (let i = count - 1; i >= 0; i--) ctx.lineTo(_rx[i], _ry[i]);
  ctx.closePath();
  ctx.fill();
}

function renderTrailLayer(ctx, compiled, tNorm, ox, oy, facing) {
  const tr = compiled.layers.trail;
  if (!tr.enabled) return 0;
  const k = windowProgress(tNorm, tr.startAt ?? 0, tr.endAt ?? 0.78);
  if (k < 0) return 0;

  const { rgb } = compiled.palette;
  const scale = compiled.scale;
  const ribbonCount = Math.max(1, Math.min(6, Math.round(tr.ribbons ?? 2)));
  const winLen = clamp01(tr.length ?? 0.6);
  const uHead = clamp01(k * (1 + winLen * 0.35));
  const uTail = clamp01(k * (1 + winLen * 0.35) - winLen);
  if (uHead - uTail < 0.015) return 0;

  const fade = k > 0.72 ? (1 - (k - 0.72) / 0.28) : 1;
  const alpha = clamp01(fade) * 0.95;
  const baseWidth = (tr.width ?? 22) * scale * 0.5;
  const segs = 22;

  ctx.save();
  ctx.translate(ox, oy);
  ctx.globalCompositeOperation = 'lighter';

  for (let r = 0; r < ribbonCount; r++) {
    for (let i = 0; i < segs; i++) {
      const s = i / (segs - 1);
      const u = lerp(uTail, uHead, s);
      const pt = evalTrajectory(tr, u, r, ribbonCount, scale, facing);
      _cx[i] = pt.x;
      _cy[i] = pt.y;
    }
    const rScale = r === 0 ? 1 : (tr.mode === 'radial_burst' || tr.mode === 'spiral_vortex' ? 0.92 : 0.65);
    const outerCol = r % 2 === 0 ? rgb.primary : rgb.accent;
    // Pasada 1: aura exterior de color
    strokeTaperedRibbon(ctx, segs, baseWidth * rScale, outerCol, rgb.secondary, alpha * 0.78);
    // Pasada 2: espina incandescente interior blanca
    strokeTaperedRibbon(ctx, segs, baseWidth * rScale * 0.36, rgb.core, outerCol, alpha * 0.92);
  }

  ctx.restore();
  return ribbonCount;
}

// --- CAPA 4: Chispas estiradas por velocidad + Fragmentos geométricos ---

function drawShardShape(ctx, shape, r) {
  ctx.beginPath();
  if (shape === 'leaf') {
    ctx.moveTo(r * 1.35, 0);
    ctx.quadraticCurveTo(0, -r * 0.85, -r * 1.2, 0);
    ctx.quadraticCurveTo(0, r * 0.85, r * 1.35, 0);
  } else if (shape === 'star') {
    const spikes = 4;
    for (let i = 0; i < spikes * 2; i++) {
      const rad = i % 2 === 0 ? r * 1.25 : r * 0.42;
      const a = (i / (spikes * 2)) * TAU;
      if (i === 0) ctx.moveTo(Math.cos(a) * rad, Math.sin(a) * rad);
      else ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
    }
  } else if (shape === 'shard') {
    ctx.moveTo(r * 1.2, -r * 0.2);
    ctx.lineTo(r * 0.15, -r * 0.85);
    ctx.lineTo(-r * 1.05, r * 0.15);
    ctx.lineTo(-r * 0.1, r * 0.78);
  } else {
    // 'diamond'
    ctx.moveTo(r * 1.3, 0);
    ctx.lineTo(0, -r * 0.68);
    ctx.lineTo(-r * 1.3, 0);
    ctx.lineTo(0, r * 0.68);
  }
  ctx.closePath();
}

function renderSparksLayer(ctx, compiled, tNorm, ox, oy, facing) {
  const sp = compiled.layers.sparks;
  if (!sp.enabled) return 0;
  const kLayer = windowProgress(tNorm, sp.startAt ?? 0.02, sp.endAt ?? 1.0);
  if (kLayer < 0) return 0;

  const { rgb } = compiled.palette;
  const scale = compiled.scale;
  const drag = Math.max(0.2, sp.drag ?? 2.6);
  const gravity = (sp.gravity ?? 180) * scale;
  const bounce = sp.bounce ?? 0;
  const floorY = 44 * scale;
  const spanSec = compiled.duration * ((sp.endAt ?? 1.0) - (sp.startAt ?? 0.02));
  let activeCount = 0;

  ctx.save();
  ctx.translate(ox, oy);

  // Sub-emisor A: chispas estiradas según vector velocidad instantáneo (BillboardRotated)
  ctx.globalCompositeOperation = 'lighter';
  const sparkScale = (sp.sparkSize ?? 1) * scale;
  for (let i = 0; i < compiled.sparkPool.length; i++) {
    const p = compiled.sparkPool[i];
    if (kLayer < p.delay) continue;
    const pk = (kLayer - p.delay) / p.lifeFrac;
    if (pk <= 0 || pk >= 1) continue;

    const dt = pk * p.lifeFrac * spanSec;
    const expDrag = Math.exp(-drag * dt);
    const invDrag = (1 - expDrag) / drag;
    const vx0 = p.vx0 * scale * facing;
    const vy0 = p.vy0 * scale;

    const px = vx0 * invDrag;
    let py = vy0 * invDrag + 0.5 * gravity * dt * dt;
    const vx = vx0 * expDrag;
    let vy = vy0 * expDrag + gravity * dt;

    if (bounce > 0 && py > floorY) {
      const over = py - floorY;
      py = floorY - over * bounce;
      vy = -Math.abs(vy) * bounce;
    }

    const speed = Math.hypot(vx, vy);
    const ang = Math.atan2(vy, vx);
    const streakLen = Math.max(4 * sparkScale, Math.min(34 * sparkScale, speed * 0.075 * p.lenScale));
    const thick = p.thick * sparkScale * (1 - pk * 0.65);
    const alpha = Math.pow(1 - pk, 1.25);
    const tailCol = p.useAccent ? rgb.accent : rgb.primary;

    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(ang);
    const g = ctx.createLinearGradient(-streakLen, 0, thick * 1.4, 0);
    g.addColorStop(0, rgba(tailCol, 0));
    g.addColorStop(0.65, rgba(tailCol, alpha * 0.85));
    g.addColorStop(1, rgba(rgb.core, alpha));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(thick * 1.5, 0);
    ctx.lineTo(-streakLen * 0.3, -thick * 0.75);
    ctx.lineTo(-streakLen, 0);
    ctx.lineTo(-streakLen * 0.3, thick * 0.75);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    activeCount++;
  }

  // Sub-emisor B: fragmentos geométricos con rotación 3D simulada
  ctx.globalCompositeOperation = 'source-over';
  const shape = sp.shardShape || 'diamond';
  for (let i = 0; i < compiled.shardPool.length; i++) {
    const d = compiled.shardPool[i];
    if (kLayer < d.delay) continue;
    const pk = (kLayer - d.delay) / d.lifeFrac;
    if (pk <= 0 || pk >= 1) continue;

    const dt = pk * d.lifeFrac * spanSec;
    const invDrag = (1 - Math.exp(-drag * 0.8 * dt)) / (drag * 0.8);
    const px = d.vx0 * scale * facing * invDrag;
    let py = d.vy0 * scale * invDrag + 0.5 * gravity * dt * dt;
    if (bounce > 0 && py > floorY) py = floorY - (py - floorY) * bounce;

    const alpha = pk < 0.12 ? pk / 0.12 : Math.pow(1 - (pk - 0.12) / 0.88, 1.35);
    const r = d.radius * scale * (1 - pk * 0.45);
    const tumble = Math.max(0.22, Math.abs(Math.cos(dt * d.flipFreq + d.rot0)));

    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(d.rot0 + dt * d.spin * facing);
    ctx.scale(1, tumble);
    ctx.fillStyle = rgba(d.tintCore ? rgb.core : rgb.debris, alpha * 0.92);
    drawShardShape(ctx, shape, r);
    ctx.fill();
    ctx.strokeStyle = rgba(rgb.core, alpha * 0.65);
    ctx.lineWidth = Math.max(0.8, 1.1 * scale);
    ctx.stroke();
    ctx.restore();
    activeCount++;
  }

  ctx.restore();
  return activeCount;
}

// --- CAPA 1: Núcleo brillante (Effekseer Sprite + Cross-Flare Node) ---

function drawStarFlare(ctx, rays, outerLen, innerR, rot, colorRgb, alpha) {
  ctx.save();
  ctx.rotate(rot);
  ctx.fillStyle = rgba(colorRgb, alpha);
  ctx.beginPath();
  const total = rays * 2;
  for (let i = 0; i < total; i++) {
    const r = i % 2 === 0 ? outerLen : innerR;
    const a = (i / total) * TAU;
    if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function renderCoreLayer(ctx, compiled, tNorm, ox, oy, facing) {
  const core = compiled.layers.core;
  if (!core.enabled) return 0;
  const k = windowProgress(tNorm, core.startAt ?? 0, core.endAt ?? 0.82);
  if (k < 0) return 0;

  const { rgb } = compiled.palette;
  const scale = compiled.scale;
  let cx = ox, cy = oy;
  if (core.followTrajectory && compiled.layers.trail.enabled) {
    const tr = compiled.layers.trail;
    const kt = clamp01(windowProgress(tNorm, tr.startAt ?? 0, tr.endAt ?? 0.78));
    const pt = evalTrajectory(tr, kt, 0, 1, scale, facing);
    cx += pt.x;
    cy += pt.y;
  }

  const attack = k < 0.16 ? easeOutBack(k / 0.16) : 1 - Math.pow((k - 0.16) / 0.84, 1.65);
  const pulse = 1 + Math.sin(k * Math.PI * 5) * 0.07;
  const rad = Math.max(2, (core.radius ?? 38) * scale * Math.max(0.05, attack) * pulse);
  const intensity = clamp01((core.intensity ?? 1.0) * (k < 0.1 ? k / 0.1 : Math.pow(1 - k, 1.15)));
  const rot = k * (core.spinSpeed ?? 2.0) * facing;
  const rays = Math.max(4, Math.min(16, Math.round(core.rays ?? 8)));
  const flareLen = rad * (core.flareLength ?? 1.9);

  ctx.save();
  ctx.translate(cx, cy);
  ctx.globalCompositeOperation = 'lighter';

  // 1. Halo radial suave (gradiente del mismo RGB hacia alfa 0 -> cero borde gris)
  const haloR = rad * 2.15;
  const halo = ctx.createRadialGradient(0, 0, 0, 0, 0, haloR);
  halo.addColorStop(0, rgba(rgb.core, intensity * 0.95));
  halo.addColorStop(0.26, rgba(rgb.primary, intensity * 0.72));
  halo.addColorStop(0.62, rgba(rgb.secondary, intensity * 0.28));
  halo.addColorStop(1, rgba(rgb.secondary, 0));
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(0, 0, haloR, 0, TAU);
  ctx.fill();

  // 2. Destello estelar cruzado (Cross-Flare) con contrarrotación secundaria
  drawStarFlare(ctx, rays, flareLen, rad * 0.18, rot, rgb.accent, intensity * 0.72);
  drawStarFlare(ctx, Math.max(4, Math.floor(rays / 2)), flareLen * 0.74, rad * 0.13, -rot * 0.65 + Math.PI / rays, rgb.core, intensity * 0.88);

  // 3. Núcleo incandescente central según geometría elegida
  const shape = core.shape || 'starburst';
  ctx.fillStyle = rgba(rgb.core, Math.min(1, intensity * 1.1));
  if (shape === 'diamond') {
    ctx.save();
    ctx.rotate(rot * 0.4);
    drawShardShape(ctx, 'diamond', rad * 0.52);
    ctx.fill();
    ctx.restore();
  } else {
    ctx.beginPath();
    ctx.arc(0, 0, rad * 0.36, 0, TAU);
    ctx.fill();
  }

  ctx.restore();
  return 1;
}

// --- Renderizado de un cuadro determinista completo (las 4 capas superpuestas) ---

export function renderSkillFrame(ctx, compiled, tNorm, options = {}) {
  const ox = options.x ?? 0;
  const oy = options.y ?? 0;
  const facing = options.facing === -1 ? -1 : 1;
  const mask = options.layerMask || null;
  const clampedT = clamp01(tNorm);

  let primitives = 0;
  if (!mask || mask.shockwave !== false) primitives += renderShockwaveLayer(ctx, compiled, clampedT, ox, oy);
  if (!mask || mask.trail !== false) primitives += renderTrailLayer(ctx, compiled, clampedT, ox, oy, facing);
  if (!mask || mask.sparks !== false) primitives += renderSparksLayer(ctx, compiled, clampedT, ox, oy, facing);
  if (!mask || mask.core !== false) primitives += renderCoreLayer(ctx, compiled, clampedT, ox, oy, facing);
  return primitives;
}

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

// --- Reproductor ligero 2D de hojas de sprites exportadas (para validar y usar en minijuegos) ---

export class SpriteSheetPlayer {
  constructor(bakedOrImage, meta) {
    this.setSheet(bakedOrImage, meta);
    this.time = 0;
    this.playing = true;
    this.loop = true;
  }

  setSheet(bakedOrImage, meta) {
    if (bakedOrImage && bakedOrImage.canvas && bakedOrImage.meta) {
      this.source = bakedOrImage.canvas;
      this.meta = bakedOrImage.meta;
    } else {
      this.source = bakedOrImage;
      this.meta = meta;
    }
    this.time = 0;
  }

  get frameIndex() {
    if (!this.meta) return 0;
    const raw = Math.floor(this.time * (this.meta.fps || 24));
    return this.loop ? (raw % this.meta.frames) : Math.min(this.meta.frames - 1, raw);
  }

  update(dt) {
    if (!this.playing || !this.meta) return;
    this.time += dt;
    const total = this.meta.frames / (this.meta.fps || 24);
    if (!this.loop && this.time >= total) {
      this.time = total;
      this.playing = false;
    }
  }

  draw(ctx, x, y, { scale = 1, alpha = 1, flipX = false } = {}) {
    if (!this.source || !this.meta) return;
    const { cols, cellW, cellH } = this.meta;
    const idx = this.frameIndex;
    const sx = (idx % cols) * cellW;
    const sy = Math.floor(idx / cols) * cellH;
    const dw = cellW * scale;
    const dh = cellH * scale;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x, y);
    if (flipX) ctx.scale(-1, 1);
    ctx.drawImage(this.source, sx, sy, cellW, cellH, -dw * 0.5, -dh * 0.5, dw, dh);
    ctx.restore();
  }
}

// --- Sistema en tiempo real 2D con pool de instancias (0 allocs en update) ---

export class SkillFxSystem {
  constructor(initialConfig = SKILL_PRESETS.effekseer_astral_slash, { maxInstances = 24, onChange = null } = {}) {
    this.onChange = onChange;
    this.layerMask = { core: true, trail: true, shockwave: true, sparks: true };
    this.pool = Array.from({ length: maxInstances }, () => ({
      active: false, x: 0, y: 0, facing: 1, t: 0, compiled: null
    }));
    this.setConfig(initialConfig);
  }

  setConfig(config) {
    this.compiled = compileSkillEffect(config);
    this.onChange?.(this.compiled, this.toJSON());
    return this.compiled;
  }

  applyJson(jsonPatch) {
    const nextRaw = applySkillPatch(this.compiled.raw, jsonPatch);
    return this.setConfig(nextRaw);
  }

  // Cambio de paleta en 1 clic (ID de SKILL_PALETTES o paleta JSON personalizada)
  setPalette(paletteIdOrObject) {
    return this.applyJson({ palette: paletteIdOrObject });
  }

  // Cambio de tamaño en 1 clic ('xs'|'sm'|'md'|'lg'|'xl' o factor numérico)
  setSize(sizeIdOrScale) {
    return this.applyJson({ size: sizeIdOrScale });
  }

  setLayerEnabled(layerName, enabled) {
    if (layerName in this.layerMask) {
      this.layerMask[layerName] = Boolean(enabled);
      this.onChange?.(this.compiled, this.toJSON());
    }
  }

  toJSON() {
    return cloneDeep(this.compiled.raw);
  }

  spawn(x, y, { facing = 1, config = null } = {}) {
    const compiled = config ? (config.sparkPool ? config : compileSkillEffect(config)) : this.compiled;
    let slot = null;
    for (let i = 0; i < this.pool.length; i++) {
      if (!this.pool[i].active) { slot = this.pool[i]; break; }
    }
    if (!slot) slot = this.pool[0]; // recicla la instancia más antigua si el pool está lleno
    slot.active = true;
    slot.x = x;
    slot.y = y;
    slot.facing = facing === -1 ? -1 : 1;
    slot.t = 0;
    slot.compiled = compiled;
    return slot;
  }

  get activeCount() {
    let n = 0;
    for (let i = 0; i < this.pool.length; i++) if (this.pool[i].active) n++;
    return n;
  }

  clear() {
    for (let i = 0; i < this.pool.length; i++) {
      this.pool[i].active = false;
      this.pool[i].compiled = null;
    }
  }

  update(dt) {
    for (let i = 0; i < this.pool.length; i++) {
      const inst = this.pool[i];
      if (!inst.active) continue;
      inst.t += dt;
      if (inst.t >= inst.compiled.duration) {
        inst.active = false;
        inst.compiled = null;
      }
    }
  }

  render(ctx) {
    let primitives = 0;
    for (let i = 0; i < this.pool.length; i++) {
      const inst = this.pool[i];
      if (!inst.active) continue;
      const tNorm = inst.t / inst.compiled.duration;
      primitives += renderSkillFrame(ctx, inst.compiled, tNorm, {
        x: inst.x,
        y: inst.y,
        facing: inst.facing,
        layerMask: this.layerMask
      });
    }
    return primitives;
  }

  bakeSheet(options = {}) {
    return bakeSpriteSheet(this.compiled, { layerMask: this.layerMask, ...options });
  }
}

// --- Puente opcional para escenas 2.5D Three.js r128 de MARGOUSH (compatible con sprites.js) ---

export function createThreeSkillBurst(THREE, scene, camera, bakedSheet, position, { worldSize = 2.6 } = {}) {
  const tex = new THREE.CanvasTexture(bakedSheet.canvas);
  const { cols, rows, frames, fps } = bakedSheet.meta;
  tex.repeat.set(1 / cols, 1 / rows);
  tex.offset.set(0, 1 - 1 / rows);
  tex.needsUpdate = true;

  const mat = new THREE.MeshBasicMaterial({
    map: tex,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide
  });
  const geo = new THREE.PlaneGeometry(worldSize, worldSize);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.copy(position);
  if (camera) mesh.lookAt(camera.position);
  scene.add(mesh);

  let elapsed = 0;
  let disposed = false;

  return {
    mesh,
    update(dt) {
      if (disposed) return false;
      elapsed += dt;
      const idx = Math.floor(elapsed * fps);
      if (idx >= frames) {
        this.dispose();
        return false;
      }
      const c = idx % cols;
      const r = Math.floor(idx / cols);
      tex.offset.set(c / cols, 1 - (r + 1) / rows);
      if (camera) mesh.lookAt(camera.position);
      return true;
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      scene.remove(mesh);
      geo.dispose();
      mat.dispose();
      tex.dispose();
    }
  };
}
