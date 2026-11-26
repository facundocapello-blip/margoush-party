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
