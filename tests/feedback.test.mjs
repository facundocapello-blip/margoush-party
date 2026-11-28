import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createShake, setReducedMotion, shakeScale, flashAlpha } from '../3d/js/feedback.js';

test('shaker decae a 0 en <= 1/decay s y produce offset suave', () => {
  const s = createShake({ decay: 2.0, maxX: 0.4, maxY: 0.3 });
  s.add(1);
  assert.equal(s.trauma, 1);
  const first = s.step(1 / 60);
  assert.ok(Math.abs(first.x) <= 0.4 && Math.abs(first.y) <= 0.3);
  for (let i = 0; i < 32; i++) s.step(1 / 60);
  assert.equal(s.trauma, 0);
  const rest = s.step(1 / 60);
  assert.equal(rest.x, 0);
  assert.equal(rest.y, 0);
});

test('setReducedMotion atenúa shakeScale y flashAlpha', () => {
  const store = new Map();
  globalThis.localStorage = { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, String(v)) };
  setReducedMotion(false);
  assert.equal(shakeScale(), 1);
  assert.equal(flashAlpha(0.5), 0.5);
  setReducedMotion(true);
  assert.ok(shakeScale() < 0.3);
  assert.ok(flashAlpha(0.5) <= 0.15);
  delete globalThis.localStorage;
});

test('Fase 4: portada sin Margoth y piso ancho en Pinky', () => {
  assert.equal(fs.readFileSync('3d/js/cover.js', 'utf8').includes('Margoth'), false);
  assert.equal(fs.readFileSync('3d/js/arena_pinky.js', 'utf8').includes('PlaneGeometry(64, 26)'), true);
});

test('createHitShake: arranca en el máximo, 3 patrones distintos y se apaga en su duración', async () => {
  const { createHitShake, HIT_SHAKE, hitShakeTier } = await import('../3d/js/feedback.js');
  setReducedMotion(false);
  assert.equal(hitShakeTier(0.03), HIT_SHAKE.tiny);
  assert.equal(hitShakeTier(0.12), HIT_SHAKE.small);
  assert.equal(hitShakeTier(0.25), HIT_SHAKE.mid);
  assert.equal(hitShakeTier(0.5), HIT_SHAKE.big);
  assert.equal(HIT_SHAKE.small.x, 0, 'la chica es solo vertical');
  const s = createHitShake();
  s.set(0.25);
  const first = s.step(1 / 60);
  assert.ok(Math.abs(first.x) === HIT_SHAKE.mid.x && Math.abs(first.y) === HIT_SHAKE.mid.y, 'cuadro 1 al máximo');
  for (let i = 0; i < 10; i++) s.step(1 / 60);
  assert.equal(s.active, false);
  assert.equal(s.step(1 / 60).x, 0);
  // una sacudida chica no pisa una grande en curso
  s.set(0.5); s.step(1 / 60); s.set(0.12);
  assert.ok(Math.abs(s.step(1 / 60).x) > 0.1);
});

test('P1 Sakurai: anticipación al 55 % en el 1.er cuadro, seguimiento sostenido y vibración que decae', async () => {
  const { anticipationK, followThrough, vibeOffset, FOLLOW_HOLD } = await import('../3d/js/feedback.js');
  assert.ok(anticipationK(0, 0.1) >= 0.55 - 1e-9, 'el 1.er cuadro ya tiene la pose a medias');
  assert.equal(anticipationK(0.1, 0.1), 1);
  assert.equal(anticipationK(0, 0), 1);
  assert.equal(followThrough(0.1, 0.1, 0.3), 1, 'máximo en el cuadro del impacto');
  const holdEnd = 0.1 + 0.2 * FOLLOW_HOLD;
  assert.equal(followThrough(holdEnd, 0.1, 0.3), 1, 'se sostiene durante el tramo de seguimiento');
  assert.ok(followThrough(0.2, 0.1, 0.3) < 1 && followThrough(0.2, 0.1, 0.3) > 0);
  assert.ok(Math.abs(followThrough(0.3, 0.1, 0.3)) < 1e-9, 'termina en 0');
  const a = vibeOffset(0, 0.1, 0.1), b = vibeOffset(2 / 60, 0.1, 0.1);
  assert.ok(Math.abs(a) > Math.abs(b) && Math.sign(a) !== Math.sign(b), 'alterna de signo y decae');
  assert.equal(vibeOffset(0.2, 0.1, 0.1), 0);
});
