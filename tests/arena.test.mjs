import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ARENA, createArenaLogic } from '../3d/js/arena_logic.js';

const FPS = 1 / 60;
const mk = () => createArenaLogic({ rand: () => 0.5 });
const safeHero = () => ({ x: 4.2, z: -3, y: 0, dodging: false, inv: 99 });

// Corre `secs` segundos y junta los eventos; `step(evs)` corre antes de cada cuadro
function run(logic, secs, hero, step) {
  const evs = [];
  for (let i = 0, n = Math.round(secs / FPS); i < n; i++) {
    if (step) step(evs);
    evs.push(...logic.update(FPS, hero));
  }
  return evs;
}
// Avanza cuadro a cuadro hasta que `cond()` sea cierto (máx. `max` s)
function runUntil(logic, hero, cond, max = 60, evs = []) {
  for (let i = 0, n = Math.round(max / FPS); i < n && !cond(); i++) evs.push(...logic.update(FPS, hero));
  assert.ok(cond(), 'condition reached');
  return evs;
}
const ofType = (evs, type) => evs.filter(e => e.type === type);
const goldFree = (logic) => logic.state.shots.find(s => s.kind === 'barrel' && s.gold && !s.returning);

// Espera un dorado, se para en su línea y lo devuelve de un golpe; corre hasta que le pega al jefe
function giveReturn(logic, hero) {
  const evs = [];
  for (let i = 0; i < 60 * 60; i++) {
    const b = goldFree(logic);
    if (b) {
      hero.x = b.x;
      const d = hero.z - b.z;
      if (d > 0 && d <= ARENA.returnWindow * ARENA.phase1.barrelSpeed - 0.05) {
        evs.push(...logic.punch({ x: hero.x, z: hero.z, reach: 1.9, dmg: 1 }));
        break;
      }
    }
    evs.push(...logic.update(FPS, hero));
  }
  assert.ok(ofType(evs, 'returned').length === 1, 'returned once');
  while (!ofType(evs, 'bossHit').length) evs.push(...logic.update(FPS, hero));
  return evs;
}

test('starts in phase 1 with full life', () => {
  const l = mk();
  assert.equal(l.state.phase, 1);
  assert.equal(l.state.hp, 30);
  assert.equal(l.state.hpMax, 30);
});

test('every third barrel is gold and crates never are', () => {
  const l2 = mk(), hero = safeHero(), seen = new Map(), throws = [];
  for (let i = 0; i < 40 * 60; i++) {
    throws.push(...l2.update(FPS, hero).filter(e => e.type === 'throw'));
    for (const s of l2.state.shots) if (!seen.has(s.id)) seen.set(s.id, { kind: s.kind, gold: s.gold });
  }
  const shots = [...seen.values()];
  const barrels = shots.filter(s => s.kind === 'barrel'), crates = shots.filter(s => s.kind === 'crate');
  assert.ok(barrels.length >= 6 && crates.length >= 2, `barrels ${barrels.length} crates ${crates.length}`);
  assert.equal(throws.length, shots.length);
  barrels.forEach((b, i) => assert.equal(!!b.gold, (i + 1) % 3 === 0, `barrel ${i}`));
  assert.ok(crates.every(c => !c.gold));
});

test('punching a gold barrel in the window sends it back and hurts the boss', () => {
  const l = mk(), hero = safeHero();
  const evs = giveReturn(l, hero);
  const hit = ofType(evs, 'bossHit')[0];
  assert.equal(hit.dmg, 3.75);
  assert.equal(hit.by, 'barrel');
  assert.equal(l.state.hp, 26.25);
});

test('punching a plain barrel does nothing and it still hurts', () => {
  const l = mk(), hero = { x: 0, z: -3, y: 0, dodging: false, inv: 0 };
  // el primer barril sale común: el héroe se para en su línea sin invulnerabilidad
  const evs = runUntil(l, hero, () => l.state.shots.length > 0);
  const b = l.state.shots[0];
  assert.equal(b.kind, 'barrel');
  assert.ok(!b.gold);
  hero.x = b.x;
  while (hero.z - b.z > 1.5) evs.push(...l.update(FPS, hero));
  const p = l.punch({ x: hero.x, z: hero.z, reach: 1.9, dmg: 1 });
  assert.equal(ofType(p, 'returned').length, 0);
  assert.equal(b.returning, false);
  evs.push(...run(l, 1, hero));
  assert.ok(evs.some(e => e.type === 'hurt' && e.by === 'barrel'));
});

test('mashing punch through phase 1 never lowers his life', () => {
  const l = mk(), hero = { x: -4.2, z: -3, y: 0, dodging: false, inv: 99 };
  run(l, 60, hero, () => l.punch({ x: hero.x, z: hero.z, reach: 1.9, dmg: 1 }));
  assert.equal(l.state.hp, 30);
  assert.equal(l.state.phase, 1);
});

test('four returns switch to phase 2 with rage', () => {
  const l = mk(), hero = safeHero(), evs = [];
  for (let i = 0; i < 4; i++) evs.push(...giveReturn(l, hero));
  evs.push(...run(l, 0.1, hero));
  assert.equal(l.state.phase, 2);
  assert.equal(l.state.hp, 15);
  assert.equal(ofType(evs, 'rage').length, 1);
  assert.ok(evs.some(e => e.type === 'line' && e.text === '¡Ahora sí me enojé!'));
});

test('the hand warns, lands, stays stuck and takes extra damage', () => {
  const l = mk(), hero = { x: -2, z: -4, y: 0, dodging: false, inv: 99 };
  l._setHp(15);
  assert.equal(l.state.phase, 2);
  const evs = runUntil(l, hero, () => l.state.hand.state === 'warn');
  assert.equal(l.state.hand.x, -2);
  assert.equal(l.state.hand.z, -4);
  evs.push(...run(l, ARENA.phase2.slamWarn + 0.15 + 0.05, hero));
  assert.equal(l.state.hand.state, 'stuck');
  assert.ok(ofType(evs, 'slam').length >= 1);
  assert.deepEqual(ofType(evs, 'slam')[0], { type: 'slam', x: -2, z: -4 });
  run(l, ARENA.phase2.stuck - 0.5, hero);
  assert.equal(l.state.hand.state, 'stuck');
  const p = l.punch({ x: -2, z: -4, reach: 1.9, dmg: 1 });
  const hh = ofType(p, 'handHit');
  assert.equal(hh.length, 1);
  assert.equal(hh[0].dmg, 1.5);
  assert.equal(l.state.hp, 13.5);
  // lejos de la mano no pega
  assert.equal(ofType(l.punch({ x: 4, z: -1, reach: 1.9, dmg: 1 }), 'handHit').length, 0);
  // con la mano ya levantada, golpear no baja la vida
  runUntil(l, hero, () => l.state.hand.state === 'none');
  const before = l.state.hp;
  const p2 = l.punch({ x: -2, z: -4, reach: 1.9, dmg: 1 });
  assert.equal(p2.length, 0);
  assert.equal(l.state.hp, before);
});

test('the hand hurts if you stay under it, dodging is rewarded', () => {
  const frameOfSlam = (hero) => {
    const l = mk();
    l._setHp(15);
    for (let i = 0; i < 30 * 60; i++) {
      const evs = l.update(FPS, hero);
      if (ofType(evs, 'slam').length) return evs;
    }
    assert.fail('no slam');
  };
  const hurt = frameOfSlam({ x: 4.2, z: -3, y: 0, dodging: false, inv: 0 });
  assert.ok(hurt.some(e => e.type === 'hurt' && e.by === 'hand'));
  const dodged = frameOfSlam({ x: 4.2, z: -3, y: 0, dodging: true, inv: 0 });
  assert.ok(dodged.some(e => e.type === 'dodge'));
  assert.ok(!dodged.some(e => e.type === 'hurt'));
});

test('power clears every shot and hurts him', () => {
  const l = mk(), hero = safeHero();
  runUntil(l, hero, () => l.state.shots.length > 0);
  const p = l.power();
  assert.equal(l.state.shots.length, 0);
  const hit = ofType(p, 'bossHit');
  assert.equal(hit.length, 1);
  assert.equal(hit[0].dmg, 4);
  assert.equal(hit[0].by, 'power');
  assert.equal(l.state.hp, 26);
});

function toStuckHand(l, hero) {
  l._setHp(1.5);
  return runUntil(l, hero, () => l.state.hand.state === 'stuck');
}

test('ko happens once and nothing hurts after it', () => {
  const l = mk(), hero = { x: 4.2, z: -3, y: 0, dodging: false, inv: 0 };
  const evs = toStuckHand(l, { ...hero, inv: 99 });
  const hand = l.state.hand;
  evs.push(...l.punch({ x: hand.x, z: hand.z, reach: 1.9, dmg: 1 }));
  evs.push(...l.punch({ x: hand.x, z: hand.z, reach: 1.9, dmg: 1 }));
  evs.push(...run(l, 10, hero));
  assert.equal(ofType(evs, 'ko').length, 1);
  assert.equal(l.state.phase, 'ko');
  assert.equal(l.state.hp, 0);
  assert.equal(l.state.shots.length, 0);
  assert.equal(l.state.hand.state, 'none');
  const after = run(l, 10, hero);
  assert.equal(after.filter(e => e.type === 'hurt' || e.type === 'throw').length, 0);
  assert.equal(l.power().length + l.punch({ x: 0, z: 0, reach: 5, dmg: 1 }).length, 0);
});

test('ko wins over a last hit in the same frame', () => {
  // tiros rápidos y héroe al fondo: un barril llega mientras la mano está trabada
  const l = createArenaLogic({ rand: () => 0 }), hero = { x: 0, z: ARENA.zFar, y: 0, dodging: false, inv: 99 };
  l._setHp(1.5);
  // espera la mano trabada y un barril a un cuadro de tocar al héroe
  const close = () => l.state.shots.find(s => s.kind === 'barrel' && !s.returning &&
    Math.hypot(hero.x - s.x, hero.z - s.z) < ARENA.hitR + 0.15);
  for (let i = 0; i < 120 * 60; i++) {
    const b = l.state.shots.find(s => s.kind === 'barrel' && !s.returning && s.z < hero.z);
    if (b) hero.x = b.x;
    if (l.state.hand.state === 'stuck' && close()) break;
    l.update(FPS, hero);
  }
  assert.equal(l.state.hand.state, 'stuck');
  assert.ok(close(), 'barrel about to touch');
  const hand = l.state.hand;
  hero.inv = 0;
  const punch = l.punch({ x: hand.x, z: hand.z, reach: 1.9, dmg: 1 });
  assert.equal(ofType(punch, 'ko').length, 1);
  const next = l.update(FPS, hero);
  assert.equal(next.filter(e => e.type === 'hurt').length, 0);
});
