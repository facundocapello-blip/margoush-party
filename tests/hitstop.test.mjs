import test from 'node:test';
import assert from 'node:assert/strict';
import { HITSTOP } from '../3d/js/feedback.js';

test('hit-stop de la calle: escalado por golpe y mínimo perceptible (≥ 4F)', () => {
  const F = 1 / 60;
  assert.equal(HITSTOP.swing.length, 3, 'un valor por golpe del combo');
  assert.ok(HITSTOP.swing[0] >= 4 * F - 1e-9, 'el golpe 1 no baja de 4F');
  assert.ok(HITSTOP.swing[1] > HITSTOP.swing[0] && HITSTOP.swing[2] > HITSTOP.swing[1], 'crece con el golpe');
  assert.ok(HITSTOP.last > HITSTOP.swing[2] + HITSTOP.ko, 'el último malo congela más que cualquier remate con KO');
  assert.ok(HITSTOP.hurt > 0 && HITSTOP.down > HITSTOP.hurt, 'también se congela cuando le pegan al héroe');
});
