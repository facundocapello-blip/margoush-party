import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PINKY_ARENA, createPinkyArenaLogic } from '../3d/js/arena_pinky_logic.js';

function step(logic, secs, hero = { x: 0, z: -1, y: 0, dodging: false, inv: false }, dt = 0.05) {
  const evs = [];
  for (let t = 0; t < secs; t += dt) evs.push(...logic.update(dt, hero));
  return evs;
}

test('pinky arena: starts in reveal, then warns and sends reversing cars', () => {
  const l = createPinkyArenaLogic({ rand: () => 0.1 });
  assert.equal(l.state.mode, 'reveal');
  assert.equal(l.state.pose, 'reveal');
  const evs = step(l, 3.8, { x: 4, z: -1, y: 0, dodging: false, inv: true });
  assert.ok(evs.some(e => e.type === 'carWarn'));
  assert.ok(evs.some(e => e.type === 'carGo'));
});

test('pinky arena: phase 2 sends 2 cars at once while always leaving at least 1 free bay', () => {
  const l = createPinkyArenaLogic({ rand: () => 0.5 });
  l._setHp(PINKY_ARENA.p2At);
  const evs = step(l, 1.0, { x: 4, z: -1, y: 0, dodging: false, inv: true });
  const warn = evs.find(e => e.type === 'carWarn');
  assert.ok(warn);
  assert.equal(warn.lanes.length, 2);
  assert.equal(new Set(warn.lanes).size, 2);
  assert.ok(warn.lanes.length < PINKY_ARENA.lanes.length, 'at least 1 bay must stay free');
});

test('pinky arena: punching Pinky while waving is guarded; punching while charging deals damage', () => {
  const l = createPinkyArenaLogic({ rand: () => 0.2 });
  step(l, 2.2, { x: 4, z: -1, y: 0, dodging: false, inv: true });
  assert.equal(l.state.mode, 'wave');
  const g = l.punch({ x: l.state.bossX, z: PINKY_ARENA.meleeZ, reach: 2, dmg: 1 });
  assert.ok(g.some(e => e.type === 'guarded'));
  assert.equal(l.state.hp, PINKY_ARENA.hpMax);

  // Advance until Pinky stops to charge parking fee
  for (let i = 0; i < 400 && l.state.mode !== 'charge'; i++) {
    l.update(0.05, { x: 4, z: -1, y: 0, dodging: false, inv: true });
  }
  assert.equal(l.state.mode, 'charge');
  const h = l.punch({ x: l.state.bossX, z: PINKY_ARENA.meleeZ, reach: 2, dmg: 1 });
  assert.ok(h.some(e => e.type === 'meleeHit'));
  assert.ok(l.state.hp < PINKY_ARENA.hpMax);
});

test('pinky arena: phase 3 unlocks Margot heroic cry, recharges if Pinky survives, and sets up KO', () => {
  const l = createPinkyArenaLogic({ rand: () => 0.5 });
  l._setHp(PINKY_ARENA.p3At);
  assert.equal(l.state.phase, 3);
  assert.equal(l.state.margotReady, true);
  step(l, 0.8, { x: 4, z: -1, y: 0, dodging: false, inv: true });
  assert.ok(l.state.cars.length > 0);

  const mEvs = l.triggerMargot();
  assert.ok(mEvs.some(e => e.type === 'margotPapilla'));
  assert.equal(l.state.cars.length, 0);
  assert.equal(l.state.hp, PINKY_ARENA.p3At - 6);
  assert.equal(l.state.mode, 'charge');
  assert.equal(l.state.margotReady, false);

  // If Pinky survives the charge window, Margot recharges for another cry
  step(l, 3.0, { x: 4, z: -1, y: 0, dodging: false, inv: true });
  assert.equal(l.state.margotReady, true);

  const koEvs = l.power();
  assert.ok(koEvs.some(e => e.type === 'ko'));
  assert.equal(l.state.phase, 'ko');
  assert.equal(l.state.pose, 'ko');
});
