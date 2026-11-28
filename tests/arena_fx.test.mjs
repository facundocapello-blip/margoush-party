import test from 'node:test';
import assert from 'node:assert/strict';
import { FX, heroPowerPresetId, heroPowerFx, createBurst, stepSparks } from '../3d/js/arena_fx.js';

function fakeT() {
  class Mesh {
    constructor(geo, mat) {
      this.geo = geo; this.mat = mat;
      this.position = { x: 0, y: 0, z: 0, set(x, y, z) { this.x = x; this.y = y; this.z = z; } };
      this.rotation = { x: 0, y: 0 };
      this.scale = { x: 1, y: 1, z: 1, set(x, y, z) { this.x = x; this.y = y; this.z = z; }, setScalar(s) { this.x = this.y = this.z = s; } };
    }
  }
  class MeshBasicMaterial { constructor(o) { Object.assign(this, o); } }
  const scene = { children: [], add(o) { this.children.push(o); }, remove(o) { this.children.splice(this.children.indexOf(o), 1); } };
  return { T: { Mesh, MeshBasicMaterial }, scene };
}

test('heroPowerFx elige el preset por héroe y lo dibuja delante del héroe', () => {
  const calls = [];
  const skillFx = { play: (...a) => { calls.push(a); return {}; } };
  assert.equal(heroPowerPresetId(true), FX.IVY);
  assert.equal(heroPowerPresetId(false), FX.TRUTH);
  heroPowerFx(skillFx, true, { x: 1, z: 2 });
  assert.deepEqual(calls[0], [FX.IVY, { x: 1, y: 1.6, z: 2.4 }, { worldSize: 4.6 }]);
  heroPowerFx(skillFx, false, { x: 0, z: 0 }, { facing: -1 });
  assert.equal(calls[1][0], FX.TRUTH);
  assert.equal(calls[1][2].facing, -1);
});

test('createBurst reutiliza un material por color, y la variante billete usa su propia vida', () => {
  const { T, scene } = fakeT();
  const kept = [];
  const sparks = [];
  const burst = createBurst(T, scene, (o) => { kept.push(o); return o; }, (h) => h, sparks, {
    geo: {}, scale: [0.65, 3.5, 1.1], spd: [2, 1], vy: [2, 1], life: [0.48, 0], bill: { vy: [3, 1], life: [0.85, 0] }
  });
  burst(0, 1, 0, '#fff', 4);
  burst(0, 1, 0, '#fff', 3, true);
  assert.equal(kept.length, 1, 'un solo material por color');
  assert.equal(sparks.length, 7);
  assert.equal(sparks[0].life, 0.48);
  assert.equal(sparks[0].p.scale.y, 3.5);
  assert.equal(sparks[4].life, 0.85);
  assert.equal(sparks[4].bill, true);
  assert.equal(sparks[4].p.scale.y, 1, 'el billete no se estira');
});

test('stepSparks las mueve y las saca de la escena al vencer', () => {
  const { T, scene } = fakeT();
  const sparks = [];
  const burst = createBurst(T, scene, (o) => o, (h) => h, sparks, { geo: {}, spd: [1, 0], vy: [1, 0], life: [0.2, 0] });
  burst(0, 1, 0, '#fff', 5);
  assert.equal(scene.children.length, 5);
  stepSparks(scene, sparks, 0.1);
  assert.equal(sparks.length, 5);
  stepSparks(scene, sparks, 0.15);
  assert.equal(sparks.length, 0);
  assert.equal(scene.children.length, 0);
});
