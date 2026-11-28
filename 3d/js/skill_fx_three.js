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

export function createSkillFxPool(THREE, scene, camera, { maxActive = 8, baker = bakeSpriteSheet } = {}) {
  const cache = new Map();
  const made = {};
  let disposed = false;

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

    const baked = baker(preset);
    const tex = new THREE.CanvasTexture(baked.canvas);
    tex.generateMipmaps = false;
    if (THREE.LinearFilter !== undefined) {
      tex.minFilter = THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;
    }
    if (THREE.sRGBEncoding !== undefined) tex.encoding = THREE.sRGBEncoding;
    tex.needsUpdate = true;

    const entry = {
      id: presetId,
      tex,
      cols: baked.meta.cols,
      rows: baked.meta.rows,
      frames: baked.meta.frames,
      fps: baked.meta.fps
    };
    cache.set(presetId, entry);
    return entry;
  }

  function preload(presetIds = []) {
    if (disposed) return;
    for (let i = 0; i < presetIds.length; i++) getEntry(presetIds[i]);
  }

  function play(presetId, pos, { worldSize = 3.0, facing = 1, flat = false, yOffset = 0, opacity = 1 } = {}) {
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

    if (slot.mat.map !== entry.tex) {
      slot.mat.map = entry.tex;
      slot.mat.needsUpdate = true;
    }
    slot.mat.opacity = opacity;

    const sign = facing === -1 ? -1 : 1;
    slot.mesh.position.set(pos.x, pos.y + yOffset, pos.z);
    slot.mesh.scale.set(sign * worldSize, worldSize, 1);

    if (slot.flat) {
      slot.mesh.rotation.set(-Math.PI / 2, 0, 0);
    } else if (camera) {
      slot.mesh.lookAt(camera.position);
    }

    setCellUv(slot.geo.attributes.uv, 0, 0, entry.cols, entry.rows);
    slot.mesh.visible = true;

    made[presetId] = (made[presetId] || 0) + 1;
    return slot;
  }

  function update(dt) {
    if (disposed) return;
    for (let i = 0; i < slots.length; i++) {
      const s = slots[i];
      if (!s.active) continue;
      s.elapsed += dt;
      const e = s.entry;
      const idx = Math.floor(s.elapsed * e.fps);
      if (idx >= e.frames) {
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
    for (const entry of cache.values()) {
      entry.tex.dispose();
    }
    cache.clear();
  }

  return {
    preload,
    play,
    update,
    clear,
    dispose,
    made,
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
