import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LALE_ARENA, createLaleArenaLogic } from '../3d/js/arena_lale_logic.js';

function step(logic, secs, hero = { x: 0, z: -1, y: 0, dodging: false, inv: false }, dt = 0.05) {
  const evs = [];
  for (let t = 0; t < secs; t += dt) evs.push(...logic.update(dt, hero));
  return evs;
}

test('lale arena: starts in phase 1, throws butter leaving slippery puddles', () => {
  const l = createLaleArenaLogic({ rand: () => 0.4 });
  assert.equal(l.state.phase, 1);
  assert.ok(l.state.bags.length >= 1);
  const evs = step(l, 2.2, { x: 4, z: -1, y: 0, dodging: false, inv: true });
  assert.ok(evs.some(e => e.type === 'throw'));
  assert.ok(l.state.puddles.length >= 1);
});

test('lale arena: punching flour bag flours Lale and opens melee damage; punching while oily slips away', () => {
  const l = createLaleArenaLogic({ rand: () => 0.4 });
  const slip = l.punch({ x: l.state.bossX, z: LALE_ARENA.meleeZ, reach: 2, dmg: 1 });
  assert.ok(slip.some(e => e.type === 'slipAway'));
  assert.equal(l.state.hp, LALE_ARENA.hpMax);

  const bag = l.state.bags[0];
  const flEvs = l.punch({ x: bag.x, z: bag.z, reach: 2, dmg: 1 });
  assert.ok(flEvs.some(e => e.type === 'bagBurst'));
  assert.ok(flEvs.some(e => e.type === 'floured'));
  assert.equal(l.state.mode, 'floured');
  assert.equal(l.state.pose, 'floured');
  const hpAfterFlour = l.state.hp;
  assert.ok(hpAfterFlour < LALE_ARENA.hpMax);

  const hitEvs = l.punch({ x: l.state.bossX, z: LALE_ARENA.meleeZ, reach: 2, dmg: 1 });
  assert.ok(hitEvs.some(e => e.type === 'meleeHit'));
  assert.ok(l.state.hp < hpAfterFlour);
});

test('lale arena: phase 2 telegraphs skateWarn then skates across court and phase 3 reaches KO cleanly', () => {
  const l = createLaleArenaLogic({ rand: () => 0.5 });
  l._setHp(LALE_ARENA.p2At);
  assert.equal(l.state.phase, 2);
  assert.equal(l.state.mode, 'skateWarn');
  const x0 = l.state.bossX;
  step(l, 0.85, { x: 0, z: 2, y: 0, dodging: false, inv: true });
  assert.equal(l.state.mode, 'skate');
  assert.notEqual(l.state.bossX, x0);

  l._setHp(LALE_ARENA.p3At);
  assert.equal(l.state.phase, 3);
  assert.equal(l.state.bags.length, 2);
  l.power();
  const koEvs = l.power();
  assert.ok(koEvs.some(e => e.type === 'ko'));
  assert.equal(l.state.phase, 'ko');
  assert.equal(l.state.pose, 'ko');
});
