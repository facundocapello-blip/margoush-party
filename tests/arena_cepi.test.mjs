import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CEPI_ARENA, createCepiArenaLogic } from '../3d/js/arena_cepi_logic.js';

function step(logic, secs, hero = { x: 0, z: -1, y: 0, dodging: false, inv: false }, dt = 0.05) {
  const evs = [];
  for (let t = 0; t < secs; t += dt) evs.push(...logic.update(dt, hero));
  return evs;
}

test('cepi arena: starts in phase 1, serves 3 balls (including gold) and gets tired', () => {
  const l = createCepiArenaLogic({ rand: () => 0.4 });
  assert.equal(l.state.phase, 1);
  assert.equal(l.state.hp, CEPI_ARENA.hpMax);
  const evs = step(l, 4.0, { x: 4, z: -1, y: 0, dodging: false, inv: true });
  const serves = evs.filter(e => e.type === 'serve');
  assert.equal(serves.length, 3);
  assert.equal(serves[2].gold, true);
  assert.equal(l.state.mode, 'tired');
  assert.equal(l.state.pose, 'tired');
});

test('cepi arena: punching Cepi upfront while attacking triggers block, while tired deals damage', () => {
  const l = createCepiArenaLogic({ rand: () => 0.5 });
  const blockEvs = l.punch({ x: l.state.bossX, z: CEPI_ARENA.meleeZ - 0.5, reach: 2, dmg: 1 });
  assert.ok(blockEvs.some(e => e.type === 'block'));
  assert.equal(l.state.pose, 'block');
  assert.equal(l.state.hp, CEPI_ARENA.hpMax);

  // Wait until tired
  step(l, 4.0, { x: 4, z: -1, y: 0, dodging: false, inv: true });
  assert.equal(l.state.mode, 'tired');
  const hitEvs = l.punch({ x: l.state.bossX, z: CEPI_ARENA.meleeZ - 0.5, reach: 2, dmg: 1 });
  assert.ok(hitEvs.some(e => e.type === 'meleeHit'));
  assert.ok(l.state.hp < CEPI_ARENA.hpMax);
});

test('cepi arena: normal ball return chips 1 HP without stun; gold ball deals 4 HP and stuns', () => {
  const l = createCepiArenaLogic({ rand: () => 0.5 });
  const hero = { x: 0, z: -1, y: 0, dodging: false, inv: true };
  step(l, 0.9, hero);
  assert.ok(l.state.shots.length >= 1);
  assert.equal(l.state.shots[0].gold, false);
  // Return first (normal) ball
  let returnedNormal = false;
  for (let i = 0; i < 60 && !returnedNormal; i++) {
    l.update(0.05, hero);
    const s = l.state.shots[0];
    if (s && !s.gold && Math.abs(s.z - hero.z) < 1.0) {
      returnedNormal = l.punch({ x: s.x, z: hero.z, reach: 2, dmg: 1 }).some(e => e.type === 'returned');
    }
  }
  assert.ok(returnedNormal, 'normal ball should be returned');
  const normEvs = step(l, 1.0, hero);
  assert.ok(normEvs.some(e => e.type === 'bossHit' && e.source === 'returnedNormal' && e.dmg === 1));
  assert.notEqual(l.state.mode, 'stun', 'normal ball should not stun Cepi');

  // Wait for 3rd ball (gold) and return it
  let returnedGold = false;
  for (let i = 0; i < 120 && !returnedGold; i++) {
    l.update(0.05, hero);
    const g = l.state.shots.find(s => s.gold && !s.returning);
    if (g && Math.abs(g.z - hero.z) < 1.0) {
      returnedGold = l.punch({ x: g.x, z: hero.z, reach: 2, dmg: 1 }).some(e => e.type === 'returned' && e.gold);
    }
  }
  assert.ok(returnedGold, 'gold ball should be returned');
  const hitEvs = step(l, 1.2, hero);
  assert.ok(hitEvs.some(e => e.type === 'bossHit' && e.source === 'returned' && e.dmg === 4));
  assert.equal(l.state.mode, 'stun');
  assert.equal(l.state.pose, 'stun');
});

test('cepi arena: phase 2 duel turns back immediately, points, and rewards dodging to the opposite side', () => {
  const l = createCepiArenaLogic({ rand: () => 0.1 }); // dir = -1 (left)
  l._setHp(CEPI_ARENA.p2At);
  assert.equal(l.state.phase, 2);
  assert.equal(l.state.mode, 'duel');
  assert.equal(l.state.pose, 'back');

  // Wait for tell
  const tellEvs = step(l, 1.15);
  const tell = tellEvs.find(e => e.type === 'duelTell');
  assert.ok(tell);
  assert.equal(l.state.pose, 'point');

  // Pick opposite side (+1 when dir is -1)
  l.pickSide(-tell.dir);
  const resEvs = step(l, 1.85);
  assert.ok(resEvs.some(e => e.type === 'duelResult' && e.ok === true));
  assert.ok(l.state.hp < CEPI_ARENA.p2At);
});

test('cepi arena: phase 3 spawns 2 cardboard decoys + real Cepi; knocking both stuns Cepi and KO works', () => {
  const l = createCepiArenaLogic({ rand: () => 0.5 });
  l._setHp(CEPI_ARENA.p3At);
  assert.equal(l.state.phase, 3);
  assert.equal(l.state.decoys.length, 2);
  assert.ok(l.state.decoys.every(c => c.alive && c.lane !== l.state.bossLane));

  // Knock down both cardboard decoys
  const d0 = l.state.decoys[0], d1 = l.state.decoys[1];
  const cbEvs0 = l.punch({ x: d0.x, z: CEPI_ARENA.meleeZ - 0.5, reach: 2, dmg: 1 });
  assert.ok(cbEvs0.some(e => e.type === 'cardboard'));
  assert.equal(d0.alive, false);
  step(l, 0.3, { x: 4, z: 2, y: 0, dodging: false, inv: true });
  const cbEvs1 = l.punch({ x: d1.x, z: CEPI_ARENA.meleeZ - 0.5, reach: 2, dmg: 1 });
  assert.ok(cbEvs1.some(e => e.type === 'decoysCleared'));
  assert.equal(l.state.mode, 'stun');

  // Power twice finishes Cepi cleanly to KO
  l.power();
  const koEvs = l.power();
  assert.ok(koEvs.some(e => e.type === 'ko'));
  assert.equal(l.state.phase, 'ko');
  assert.equal(l.state.pose, 'ko');
  assert.equal(l.state.hp, 0);
});

test('cepi arena: a returned ball that changes phase or KOs while other balls fly does not crash', () => {
  for (const hp of [CEPI_ARENA.p2At + 1, 1]) {
    const l = createCepiArenaLogic({ rand: () => 0.5 });
    const hero = { x: 0, z: -1, y: 0, dodging: false, inv: true };
    l._setHp(hp);
    const mk = (z, gold) => ({ id: z, x: 0, z, vx: 0, vz: 0, gold, glass: false, bounced: false, returning: true });
    // el índice mayor se procesa primero: pega y vacía state.shots, el otro queda colgado
    l.state.shots.push(mk(5, false), mk(CEPI_ARENA.bossZ, true));
    let evs;
    assert.doesNotThrow(() => { evs = l.update(0.05, hero); });
    assert.ok(evs.some(e => e.type === 'phase' || e.type === 'ko'), 'debe llegar el evento phase/ko');
  }
});
