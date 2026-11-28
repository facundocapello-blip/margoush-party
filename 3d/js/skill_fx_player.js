// REPRODUCCIÓN de hojas de sprites ya horneadas: reproductor 2D, sistema de ráfagas y puente a Three.js r128.
import { SKILL_PALETTES, SKILL_PRESETS } from './skill_fx_presets.js';
import { applySkillPatch, cloneDeep, compileSkillEffect, renderSkillFrame } from './skill_fx_engine.js';
import { bakeSpriteSheet } from './skill_fx_bake.js';

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
  tex.generateMipmaps = false;
  if (THREE.LinearFilter !== undefined) {
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
  }
  if (THREE.sRGBEncoding !== undefined) tex.encoding = THREE.sRGBEncoding;
  const { cols, rows, frames, fps } = bakedSheet.meta;
  tex.repeat.set(1 / cols, 1 / rows);
  tex.offset.set(0, 1 - 1 / rows);
  tex.needsUpdate = true;

  const mat = new THREE.MeshBasicMaterial({
    map: tex,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.NormalBlending ?? 1,
    side: THREE.DoubleSide
  });
  const geo = new THREE.PlaneGeometry(worldSize, worldSize);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.renderOrder = 18;
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
