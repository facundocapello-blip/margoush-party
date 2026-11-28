import test from 'node:test';
import assert from 'node:assert/strict';
import { createSkillFxPool } from '../3d/js/skill_fx_three.js';

function createFakeThree() {
  const stats = { textures: 0, texDisposed: 0, geos: 0, geoDisposed: 0, mats: 0, matDisposed: 0 };

  class Vector3 {
    constructor(x = 0, y = 0, z = 0) { this.x = x; this.y = y; this.z = z; }
    set(x, y, z) { this.x = x; this.y = y; this.z = z; return this; }
    copy(v) { this.x = v.x; this.y = v.y; this.z = v.z; return this; }
  }

  class CanvasTexture {
    constructor(canvas) {
      this.canvas = canvas;
      this.needsUpdate = false;
      this.generateMipmaps = true;
      this.minFilter = 0;
      this.disposed = false;
      stats.textures++;
    }
    dispose() {
      if (!this.disposed) { this.disposed = true; stats.texDisposed++; }
    }
  }

  class PlaneGeometry {
    constructor(w, h) {
      this.w = w; this.h = h;
      this.disposed = false;
      const arr = new Float32Array([0, 1, 1, 1, 0, 0, 1, 0]);
      this.attributes = {
        uv: {
          array: arr,
          needsUpdate: false,
          setXY(idx, u, v) { arr[idx * 2] = u; arr[idx * 2 + 1] = v; }
        }
      };
      stats.geos++;
    }
    dispose() {
      if (!this.disposed) { this.disposed = true; stats.geoDisposed++; }
    }
  }

  class MeshBasicMaterial {
    constructor(opts = {}) {
      Object.assign(this, opts);
      this.disposed = false;
      stats.mats++;
    }
    dispose() {
      if (!this.disposed) { this.disposed = true; stats.matDisposed++; }
    }
  }

  class Mesh {
    constructor(geometry, material) {
      this.geometry = geometry;
      this.material = material;
      this.position = new Vector3();
      this.scale = new Vector3(1, 1, 1);
      this.rotation = { x: 0, y: 0, z: 0, set(x, y, z) { this.x = x; this.y = y; this.z = z; } };
      this.visible = true;
      this.renderOrder = 0;
      this.lookedAt = null;
    }
    lookAt(pos) { this.lookedAt = { x: pos.x, y: pos.y, z: pos.z }; }
  }

  const THREE = {
    Vector3,
    CanvasTexture,
    PlaneGeometry,
    MeshBasicMaterial,
    Mesh,
    NormalBlending: 1,
    AdditiveBlending: 2,
    DoubleSide: 2,
    LinearFilter: 1006,
    sRGBEncoding: 3001
  };

  const scene = {
    children: [],
    add(o) { this.children.push(o); },
    remove(o) { const i = this.children.indexOf(o); if (i >= 0) this.children.splice(i, 1); }
  };

  const camera = { position: new Vector3(0, 5, 12) };
  return { THREE, scene, camera, stats };
}

function createFakeBaker() {
  const calls = [];
  const baker = (preset) => {
    calls.push(preset.id);
    return {
      canvas: { width: 1536, height: 384, id: preset.id },
      meta: { cols: 8, rows: 2, frames: 16, fps: 24, w: 1536, h: 384 }
    };
  };
  return { baker, calls };
}

test('cachea texturas por preset y no vuelve a hornear en disparos repetidos', () => {
  const { THREE, scene, camera, stats } = createFakeThree();
  const { baker, calls } = createFakeBaker();
  const pool = createSkillFxPool(THREE, scene, camera, { maxActive: 4, baker });

  const s1 = pool.play('douge_truth_slam', { x: 1, y: 0.5, z: 2 }, { worldSize: 5 });
  const s2 = pool.play('douge_truth_slam', { x: 3, y: 0.5, z: 2 }, { worldSize: 4 });
  assert.ok(s1 && s2);
  assert.equal(calls.length, 1);
  assert.equal(stats.textures, 1);
  assert.equal(pool.textureCount, 1);
  assert.equal(pool.activeCount, 2);
  assert.equal(pool.made.douge_truth_slam, 2);
});

test('recicla el slot más antiguo cuando se supera maxActive sin crear meshes extra', () => {
  const { THREE, scene, camera, stats } = createFakeThree();
  const { baker } = createFakeBaker();
  const pool = createSkillFxPool(THREE, scene, camera, { maxActive: 2, baker });

  pool.play('douge_truth_slam', { x: 0, y: 1, z: 0 });
  pool.update(0.1);
  pool.play('marine_ivy_whirl', { x: 1, y: 1, z: 0 });
  pool.update(0.05);
  pool.play('cepi_golden_smash', { x: 2, y: 1, z: 0 });

  assert.equal(pool.activeCount, 2);
  assert.equal(scene.children.length, 2);
  assert.equal(stats.geos, 2);
  assert.equal(stats.mats, 2);
});

test('aplica facing ±1, actualiza UVs por cuadro y se oculta al terminar', () => {
  const { THREE, scene, camera } = createFakeThree();
  const { baker } = createFakeBaker();
  const pool = createSkillFxPool(THREE, scene, camera, { maxActive: 2, baker });

  const slot = pool.play('effekseer_astral_slash', { x: 2, y: 1.2, z: 0.4 }, { worldSize: 3.2, facing: -1 });
  assert.equal(slot.mesh.visible, true);
  assert.equal(slot.mesh.scale.x, -3.2);
  assert.equal(slot.mesh.scale.y, 3.2);

  // Avanzar al cuadro 1 (fps = 24 -> 0.05s => frame 1 => col=1, row=0)
  pool.update(0.05);
  assert.ok(Math.abs(slot.mesh.geometry.attributes.uv.array[0] - 1 / 8) < 1e-6);

  // Avanzar más allá de 16 / 24 = 0.667s => termina y se oculta
  pool.update(0.7);
  assert.equal(slot.mesh.visible, false);
  assert.equal(pool.activeCount, 0);
});

test('preset desconocido retorna null sin romper el bucle y clear() limpia activos', () => {
  const { THREE, scene, camera } = createFakeThree();
  const { baker } = createFakeBaker();
  const pool = createSkillFxPool(THREE, scene, camera, { maxActive: 3, baker });

  assert.equal(pool.play('no_existe', { x: 0, y: 0, z: 0 }), null);
  pool.play('margot_hero_cry', { x: 0, y: 2, z: 0 });
  assert.equal(pool.activeCount, 1);
  pool.clear();
  assert.equal(pool.activeCount, 0);
});

test('dispose() es idempotente y libera todas las geometrías, materiales y texturas (R-2)', () => {
  const { THREE, scene, camera, stats } = createFakeThree();
  const { baker } = createFakeBaker();
  const pool = createSkillFxPool(THREE, scene, camera, { maxActive: 3, baker });

  pool.preload(['douge_truth_slam', 'lale_oven_flare']);
  pool.flushPreload();
  pool.play('douge_truth_slam', { x: 0, y: 1, z: 0 });
  assert.equal(stats.textures, 2);
  assert.equal(scene.children.length, 3);

  pool.dispose();
  pool.dispose(); // idempotente

  assert.equal(scene.children.length, 0);
  assert.equal(stats.geoDisposed, 3);
  assert.equal(stats.matDisposed, 3);
  assert.equal(stats.texDisposed, 2);
  assert.equal(pool.activeCount, 0);
  assert.equal(pool.textureCount, 0);
});

test('configura sRGBEncoding, NormalBlending y depthTest:false para fidelidad en escenas 3D', () => {
  const { THREE, scene, camera } = createFakeThree();
  const { baker } = createFakeBaker();
  const pool = createSkillFxPool(THREE, scene, camera, { maxActive: 1, baker });

  const slot = pool.play('douge_truth_slam', { x: 0, y: 1.5, z: 0 });
  assert.equal(slot.mat.map.encoding, THREE.sRGBEncoding);
  assert.equal(slot.mat.map.minFilter, THREE.LinearFilter);
  assert.equal(slot.mat.map.magFilter, THREE.LinearFilter);
  assert.equal(slot.mat.blending, THREE.NormalBlending);
  assert.equal(slot.mat.depthTest, false);
  assert.equal(slot.mat.depthWrite, false);
  assert.ok(slot.mesh.renderOrder >= 18);
});

test('preload es diferido: hornea un preset por update() y play() lo hornea al instante si aún no tocó', () => {
  const { THREE, scene, camera, stats } = createFakeThree();
  const { baker, calls } = createFakeBaker();
  const pool = createSkillFxPool(THREE, scene, camera, { maxActive: 2, baker });

  pool.preload(['douge_truth_slam', 'lale_oven_flare', 'margot_hero_cry']);
  assert.equal(calls.length, 0, 'preload no hornea en el mismo cuadro');
  pool.update(0.016);
  assert.equal(calls.length, 1);
  pool.update(0.016);
  assert.equal(calls.length, 2);

  // Pedido directo de uno que sigue en cola: se hornea ahí mismo y no se vuelve a hornear después
  assert.ok(pool.play('margot_hero_cry', { x: 0, y: 1, z: 0 }));
  assert.equal(calls.length, 3);
  pool.update(0.016);
  pool.update(0.016);
  assert.equal(calls.length, 3);
  assert.equal(stats.textures, 3);
  pool.dispose();
});

test('dos pools comparten horneado y textura; la textura se libera al soltarla el último', () => {
  const { THREE, scene, camera, stats } = createFakeThree();
  const { baker, calls } = createFakeBaker();
  const street = createSkillFxPool(THREE, scene, camera, { maxActive: 2, baker });
  street.preload(['douge_truth_slam']);
  street.flushPreload();

  const arena = createSkillFxPool(THREE, scene, camera, { maxActive: 2, baker });
  arena.play('douge_truth_slam', { x: 0, y: 1, z: 0 });
  arena.play('lale_oven_flare', { x: 0, y: 1, z: 0 });
  assert.equal(calls.filter(id => id === 'douge_truth_slam').length, 1, 'no se vuelve a hornear');
  assert.equal(stats.textures, 2, 'douge_truth_slam se sube a GPU una sola vez');

  arena.dispose();
  assert.equal(stats.texDisposed, 1, 'solo la propia de la arena (lale) se libera; la de la calle sigue viva');

  // Segunda arena: lale se re-sube a GPU pero NO se vuelve a hornear
  const arena2 = createSkillFxPool(THREE, scene, camera, { maxActive: 2, baker });
  arena2.play('lale_oven_flare', { x: 0, y: 1, z: 0 });
  assert.equal(calls.filter(id => id === 'lale_oven_flare').length, 1);
  assert.equal(stats.textures, 3);
  arena2.dispose();
  street.dispose();
  assert.equal(stats.texDisposed, 3);
});
