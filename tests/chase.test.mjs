import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildTrack, CHASE, OBST } from '../3d/js/chase.js';
import { WAVES } from '../3d/js/level.js';

test('the chase track always leaves a free lane, allows jumping tables, and includes turbo ramps', () => {
  const { obstacles, pickups, ramps } = buildTrack();
  assert.equal(OBST.table.low, true, 'las mesas deben poderse saltar');
  assert.ok(obstacles.length >= 14 && obstacles.length <= 26, `obstacles ${obstacles.length}`);
  assert.ok(pickups.length >= 6 && pickups.length % 3 === 0, `pickups ${pickups.length}`);
  assert.ok(ramps.length >= 3, `turbo ramps ${ramps.length}`);
  assert.ok(obstacles.every(o => ['table', 'barricade', 'scooter', 'butter', 'pigeons'].includes(o.kind)), 'tipos válidos de obstáculos');
  for (const o of obstacles) {
    assert.ok(o.s > 40 && o.s < CHASE.length - 40, `obstacle at ${o.s}`);
    // ninguno ocupa los tres carriles: la barricada tapa dos, el resto uno
    assert.ok(Math.abs(o.x) <= CHASE.lane, `obstacle x ${o.x}`);
  }
  const gaps = obstacles.slice(1).map((o, i) => o.s - obstacles[i].s);
  assert.ok(Math.min(...gaps) >= 20, 'there is room to react between obstacles');
});

test('the chase is no longer in the boulevard: it opens level 1 (no wave triggers it)', () => {
  assert.equal(WAVES.some(w => w.chase), false);
});
