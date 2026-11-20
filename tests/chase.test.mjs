import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildTrack, CHASE } from '../3d/js/chase.js';
import { WAVES } from '../3d/js/level.js';

test('the chase track always leaves a free lane and fits before the charger', () => {
  const { obstacles, pickups } = buildTrack();
  // pista simple (20/11): pocas cosas, bien separadas; los premios solo en arco sobre lo que se salta
  assert.ok(obstacles.length >= 12 && obstacles.length <= 22, `obstacles ${obstacles.length}`);
  assert.ok(pickups.length >= 3 && pickups.length % 3 === 0, `pickups ${pickups.length}`);
  assert.ok(obstacles.every(o => ['table', 'barricade', 'scooter'].includes(o.kind)), 'solo mesas, piquetes y monopatines');
  for (const o of obstacles) {
    assert.ok(o.s > 40 && o.s < CHASE.length - 40, `obstacle at ${o.s}`);
    // ninguno ocupa los tres carriles: la barricada tapa dos, el resto uno
    assert.ok(Math.abs(o.x) <= CHASE.lane, `obstacle x ${o.x}`);
  }
  const gaps = obstacles.slice(1).map((o, i) => o.s - obstacles[i].s);
  assert.ok(Math.min(...gaps) >= 34, 'there is room to react between obstacles');
});

test('the chase is no longer in the boulevard: it opens level 1 (no wave triggers it)', () => {
  assert.equal(WAVES.some(w => w.chase), false);
});
