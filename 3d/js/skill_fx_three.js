// Puente cacheado y con pool fijo entre skill_fx.js (4 capas) y Three.js r128.
// Garantiza 0 asignaciones por cuadro (R-3) y 0 fugas WebGL al liberar (R-2).
import { bakeSpriteSheet, SKILL_PRESETS } from './skill_fx.js';

function setCellUv(uv, col, row, cols, rows) {
  const u0 = col / cols;
  const u1 = (col + 1) / cols;
  const v1 = 1 - row / rows;
  const v0 = 1 - (row + 1) / rows;
  uv.setXY(0, u0, v1);
  uv.setXY(1, u1, v1);
  uv.setXY(2, u0, v0);
  uv.setXY(3, u1, v0);
  uv.needsUpdate = true;
}

// Caché de módulo, compartida por todos los pools (calle + arenas):
// 1) BAKED: el horneado en canvas es CPU puro y no depende de la escena; se hace una sola vez por preset.
//    Se guarda solo canvas+meta (no `cells` ni `manifestEntry`) para no retener de más.
// 2) TEXTURES: la textura GPU se comparte entre pools vivos con conteo de referencias. Cuando el último
//    pool la suelta se hace dispose(), así cada arena sigue devolviendo el 100 % de lo que sube (R-2).
const BAKED = new WeakMap(); // baker -> Map(presetId -> { canvas, meta })
const TEXTURES = new WeakMap(); // THREE -> Map(presetId -> { entry, refs })

function bakedFor(baker, presetId, preset) {
  let perBaker = BAKED.get(baker);
  if (!perBaker) { perBaker = new Map(); BAKED.set(baker, perBaker); }
  let hit = perBaker.get(presetId);
  if (!hit) {
    const baked = baker(preset);
    hit = { canvas: baked.canvas, meta: baked.meta };
    perBaker.set(presetId, hit);
  }
  return hit;
}

// Efecto «suave»: se usa cuando el FX se dibuja delante del jefe (KO, cambio de fase) o si el jugador pidió
// movimiento reducido. Achica y baja la opacidad para no tapar la lectura del jefe ni de sus telegrafiados.
export const SOFT = { scale: 0.7, opacity: 0.5 };

export function createSkillFxPool(THREE, scene, camera, { maxActive = 8, baker = bakeSpriteSheet, reduceMotion = null } = {}) {
  const cache = new Map(); // presetId -> entry compartido, solo los que este pool tiene retenidos
  const playsByPreset = {};
  const queue = []; // presets pendientes de precarga diferida
  let disposed = false;
  let shared = TEXTURES.get(THREE);
  if (!shared) { shared = new Map(); TEXTURES.set(THREE, shared); }

  const slots = Array.from({ length: Math.max(1, maxActive) }, () => {
    const geo = new THREE.PlaneGeometry(1, 1);
    const mat = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 1,
      depthWrite: false,
      depthTest: false,
      blending: THREE.NormalBlending ?? 1,
      side: THREE.DoubleSide
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.visible = false;
    mesh.renderOrder = 18;
    scene.add(mesh);
    return {
      active: false,
      entry: null,
      elapsed: 0,
      lastFrame: -1,
      flat: false,
      mesh,
      geo,
      mat
    };
  });

  function getEntry(presetId) {
    if (disposed || !presetId) return null;
    if (cache.has(presetId)) return cache.get(presetId);
    const preset = SKILL_PRESETS[presetId];
    if (!preset) return null;

    let rec = shared.get(presetId);
    if (!rec) {
      const baked = bakedFor(baker, presetId, preset);
      const tex = new THREE.CanvasTexture(baked.canvas);
      tex.generateMipmaps = false;
      if (THREE.LinearFilter !== undefined) {
        tex.minFilter = THREE.LinearFilter;
        tex.magFilter = THREE.LinearFilter;
      }
      if (THREE.sRGBEncoding !== undefined) tex.encoding = THREE.sRGBEncoding;
      tex.needsUpdate = true;
      rec = {
        refs: 0,
        entry: {
          id: presetId,
          tex,
          cols: baked.meta.cols,
          rows: baked.meta.rows,
          frames: baked.meta.frames,
          fps: baked.meta.fps
        }
      };
      shared.set(presetId, rec);
    }
    rec.refs++;
    cache.set(presetId, rec.entry);
    return rec.entry;
  }

  // Precarga diferida: encola y hornea de a un preset por update() para evitar el tirón al entrar.
  // Si play() pide uno que sigue en cola, se hornea ahí mismo (sin esperas).
  function preload(presetIds = []) {
    if (disposed) return;
    for (let i = 0; i < presetIds.length; i++) {
      const id = presetIds[i];
      if (id && !cache.has(id) && !queue.includes(id)) queue.push(id);
    }
  }

  function flushPreload() {
    while (queue.length) getEntry(queue.shift());
  }

  function play(presetId, pos, { worldSize = 3.0, facing = 1, flat = false, yOffset = 0, opacity = 1, soften = false, maxSeconds = 0 } = {}) {
    if (disposed) return null;
    const entry = getEntry(presetId);
    if (!entry) return null;

    // Elegir primer slot libre o reciclar el más antiguo
    let slot = null;
    let oldest = slots[0];
    for (let i = 0; i < slots.length; i++) {
      const s = slots[i];
      if (!s.active) { slot = s; break; }
      if (s.elapsed > oldest.elapsed) oldest = s;
    }
    if (!slot) slot = oldest;

    slot.active = true;
    slot.entry = entry;
    slot.elapsed = 0;
    slot.lastFrame = 0;
    slot.flat = Boolean(flat);
    slot.cut = maxSeconds > 0 ? maxSeconds : 0; // corta el efecto antes de que termine la hoja (ej. 20F)

    if (slot.mat.map !== entry.tex) {
      slot.mat.map = entry.tex;
      slot.mat.needsUpdate = true;
    }
    const soft = soften || (reduceMotion ? Boolean(reduceMotion()) : false);
    const size = soft ? worldSize * SOFT.scale : worldSize;
    slot.mat.opacity = soft ? opacity * SOFT.opacity : opacity;

    const sign = facing === -1 ? -1 : 1;
    slot.mesh.position.set(pos.x, pos.y + yOffset, pos.z);
    slot.mesh.scale.set(sign * size, size, 1);

    if (slot.flat) {
      slot.mesh.rotation.set(-Math.PI / 2, 0, 0);
    } else if (camera) {
      slot.mesh.lookAt(camera.position);
    }

    setCellUv(slot.geo.attributes.uv, 0, 0, entry.cols, entry.rows);
    slot.mesh.visible = true;

    playsByPreset[presetId] = (playsByPreset[presetId] || 0) + 1;
    return slot;
  }

  function update(dt) {
    if (disposed) return;
    if (queue.length) getEntry(queue.shift());
    for (let i = 0; i < slots.length; i++) {
      const s = slots[i];
      if (!s.active) continue;
      s.elapsed += dt;
      const e = s.entry;
      const idx = Math.floor(s.elapsed * e.fps);
      if (idx >= e.frames || (s.cut && s.elapsed >= s.cut)) {
        s.active = false;
        s.entry = null;
        s.lastFrame = -1;
        s.mesh.visible = false;
        continue;
      }
      if (idx !== s.lastFrame) {
        s.lastFrame = idx;
        const c = idx % e.cols;
        const r = Math.floor(idx / e.cols);
        setCellUv(s.geo.attributes.uv, c, r, e.cols, e.rows);
      }
      if (!s.flat && camera) s.mesh.lookAt(camera.position);
    }
  }

  function clear() {
    for (let i = 0; i < slots.length; i++) {
      const s = slots[i];
      s.active = false;
      s.entry = null;
      s.elapsed = 0;
      s.lastFrame = -1;
      s.mesh.visible = false;
    }
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    clear();
    for (let i = 0; i < slots.length; i++) {
      const s = slots[i];
      scene.remove(s.mesh);
      s.geo.dispose();
      s.mat.dispose();
    }
    queue.length = 0;
    for (const [id, entry] of cache) {
      const rec = shared.get(id);
      if (rec && rec.entry === entry && --rec.refs <= 0) {
        entry.tex.dispose();
        shared.delete(id);
      }
    }
    cache.clear();
  }

  return {
    preload,
    flushPreload,
    play,
    update,
    clear,
    dispose,
    playsByPreset,
    get activeCount() {
      let n = 0;
      for (let i = 0; i < slots.length; i++) if (slots[i].active) n++;
      return n;
    },
    get textureCount() {
      return cache.size;
    }
  };
}
