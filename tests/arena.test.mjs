import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ARENA, DANCE_MOVES, createArenaLogic } from '../3d/js/arena_logic.js';

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
const H = ARENA.hp, HALF = 11; // HALF: vida de prueba ya en la fase 3 (enojado)
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

test('starts in phase 1 with full life, attacking', () => {
  const l = mk();
  assert.equal(l.state.phase, 1);
  assert.equal(l.state.mode, 'attack');
  assert.equal(l.state.hp, H);
  assert.equal(l.state.hpMax, H);
});

test('phase 1 throws series of 3 that follow the patterns, end in gold, then rests', () => {
  const l = mk(), hero = safeHero(), seen = new Map(), modes = new Set();
  for (let i = 0; i < 25 * 60; i++) {
    l.update(FPS, hero); modes.add(l.state.mode);
    for (const s of l.state.shots) if (!seen.has(s.id)) seen.set(s.id, s.type);
  }
  const types = [...seen.values()];
  const want = ARENA.phase1.patterns.flat();
  assert.ok(types.length >= 9, `shots ${types.length}`);
  types.forEach((ty, i) => assert.equal(ty, want[i % want.length], `shot ${i}`));
  assert.ok(modes.has('recover'), 'rests after a series');
  assert.ok(!types.includes('crate') && !types.includes('giant'), 'no crates or giants in phase 1');
});

test('the curve barrel starts in another lane and ends in the hero\'s', () => {
  const l = mk(), hero = { x: 2, z: -1.5, y: 0, dodging: false, inv: 99 };
  runUntil(l, hero, () => l.state.shots.some(s => s.type === 'curve'));
  const c = l.state.shots.find(s => s.type === 'curve');
  assert.ok(Math.abs(c.x - 2) >= ARENA.phase1.curveShift - 1e-9, `starts away: ${c.x}`);
  runUntil(l, hero, () => c.z > -2.5);
  assert.ok(Math.abs(c.x - 2) < 0.2, `ends in the lane: ${c.x}`);
});

test('the bouncing barrel cannot be returned and jumping clears it', () => {
  const l = mk(), hero = { x: 0, z: -1.5, y: 0, dodging: false, inv: 0 };
  // segunda serie: bounce, roll, gold
  runUntil(l, hero, () => l.state.shots.some(s => s.type === 'bounce'), 30);
  const b = l.state.shots.find(s => s.type === 'bounce');
  hero.x = b.x;
  while (hero.z - b.z > 2) l.update(FPS, hero);
  assert.equal(ofType(l.punch({ x: hero.x, z: hero.z, reach: 1.9, dmg: 1 }), 'returned').length, 0);
  hero.y = 1.5; // en el aire
  const evs = run(l, 0.6, hero);
  assert.ok(!evs.some(e => e.type === 'hurt'), 'jumping over it is safe');
});

test('punching a gold barrel in the window sends it back and hurts the boss', () => {
  const l = mk(), hero = safeHero();
  const evs = giveReturn(l, hero);
  const hit = ofType(evs, 'bossHit')[0];
  assert.equal(hit.dmg, ARENA.returnDmg);
  assert.equal(hit.by, 'barrel');
  assert.equal(l.state.hp, H - ARENA.returnDmg);
  assert.ok(evs.some(e => e.type === 'voice' && e.event === 'returned'));
  assert.ok(evs.some(e => e.type === 'voice' && e.event === 'attack'));
});

// Lleva a la clase de baile y juega las rondas: answer(seq, idx) → paso que hace el héroe (o null = nada)
function playDance(l, answer) {
  const hero = { x: 0, z: -1.5, y: 0, moving: false, dodging: false, inv: 99 };
  l._setHp(ARENA.diceAt);
  const evs = [];
  runUntil(l, hero, () => l.state.mode === 'dice', 6, evs);
  for (let i = 0; i < 90 * 60 && l.state.phase === 2; i++) {
    const d = l.state.dice;
    if (d && d.stage === 'turn' && d.t > 0.2) { const a = answer(d.seq, d.idx); if (a) evs.push(...l.act(a)); }
    evs.push(...l.update(FPS, hero));
  }
  return evs;
}

test('dance class: Chaky shows each step on the beat, then it is your turn', () => {
  const l = mk();
  const evs = playDance(l, (seq, i) => seq[i]);
  const demos = ofType(evs, 'danceDemo'), turns = ofType(evs, 'danceTurn');
  assert.equal(turns.length, ARENA.dice.rounds.length);
  assert.equal(demos.length, ARENA.dice.rounds.reduce((a, b) => a + b, 0));
  turns.forEach((tn, r) => assert.equal(tn.seq.length, ARENA.dice.rounds[r]));
  assert.ok(evs.some(e => e.type === 'voice' && e.event === 'count'));
});

test('dance class: repeating every step hurts him and a perfect class heals you', () => {
  const l = mk();
  const evs = playDance(l, (seq, i) => seq[i]);
  const res = ofType(evs, 'diceResult');
  assert.equal(res.length, ARENA.dice.rounds.length);
  assert.ok(res.every(r => r.ok));
  assert.equal(ofType(evs, 'heal').length, 1);
  assert.ok(!evs.some(e => e.type === 'hurt'));
  assert.equal(l.state.phase, 3);
  assert.equal(l.state.hp, Math.max(ARENA.rageAt, ARENA.diceAt - ARENA.dice.rounds.length * ARENA.dice.dmg));
});

test('dance class: a wrong step ends the round; two bad rounds cost a heart', () => {
  const l = mk();
  const evs = playDance(l, (seq, i) => DANCE_MOVES.find(m => m !== seq[i]));
  const res = ofType(evs, 'diceResult');
  assert.ok(res.every(r => !r.ok));
  assert.ok(ofType(evs, 'danceStep').every(s => !s.ok));
  assert.equal(l.state.hp, ARENA.diceAt);
  assert.equal(evs.filter(e => e.type === 'hurt' && e.by === 'dice').length, 1);
});

test('dance class: standing still runs out the time', () => {
  const l = mk();
  const evs = playDance(l, () => null);
  assert.ok(ofType(evs, 'diceResult').every(r => !r.ok));
  assert.equal(l.state.phase, 3);
});

test('phase 3 throws a giant barrel that cannot be returned and only dodging saves you', () => {
  const l = mk(), hero = { x: 0, z: -1.5, y: 0, dodging: false, inv: 99 };
  l._setHp(HALF);
  runUntil(l, hero, () => l.state.shots.some(s => s.type === 'giant'), 40);
  const g = l.state.shots.find(s => s.type === 'giant');
  hero.x = g.x;
  while (hero.z - g.z > 1) l.update(FPS, hero);
  assert.equal(ofType(l.punch({ x: hero.x, z: hero.z, reach: 1.9, dmg: 1 }), 'returned').filter(() => g.returning).length, 0);
  assert.equal(g.returning, false);
  hero.inv = 0; hero.y = 1.5; // saltar no alcanza
  const evs = run(l, 0.5, hero);
  assert.ok(evs.some(e => e.type === 'hurt' && e.by === 'barrel'));
});

test('power clears every shot and hurts him', () => {
  const l = mk(), hero = safeHero();
  runUntil(l, hero, () => l.state.shots.length > 0);
  const p = l.power();
  assert.equal(l.state.shots.length, 0);
  const hit = ofType(p, 'bossHit');
  assert.equal(hit.length, 1);
  assert.equal(hit[0].dmg, ARENA.powerDmg);
  assert.equal(hit[0].by, 'power');
  assert.equal(l.state.hp, H - ARENA.powerDmg);
});

test('punching a gold barrel in the window sends it back and hurts the boss', () => {
  const l = mk(), hero = safeHero();
  const evs = giveReturn(l, hero);
  const hit = ofType(evs, 'bossHit')[0];
  assert.equal(hit.dmg, ARENA.returnDmg);
  assert.equal(hit.by, 'barrel');
  assert.equal(l.state.hp, H - ARENA.returnDmg);
});

test('a plain barrel punched in the window goes back for less damage', () => {
  const l = mk(), hero = { x: 0, z: -3, y: 0, dodging: false, inv: 99 };
  runUntil(l, hero, () => l.state.shots.length > 0);
  const b = l.state.shots[0];
  assert.equal(b.kind, 'barrel');
  assert.ok(!b.gold);
  hero.x = b.x;
  while (hero.z - b.z > 1.5) l.update(FPS, hero);
  const p = l.punch({ x: hero.x, z: hero.z, reach: 1.9, dmg: 1 });
  assert.equal(ofType(p, 'returned').length, 1);
  assert.equal(ofType(p, 'returned')[0].gold, false);
  const evs = runUntil(l, hero, () => l.state.hp < H, 5);
  assert.equal(ofType(evs, 'bossHit')[0].dmg, ARENA.returnDmgWhite);
});

test('punching a barrel too early does nothing and it still hurts', () => {
  const l = mk(), hero = { x: 0, z: -3, y: 0, dodging: false, inv: 0 };
  const evs = runUntil(l, hero, () => l.state.shots.length > 0);
  const b = l.state.shots[0];
  hero.x = b.x;
  const maxD = ARENA.returnWindow * ARENA.phase1.barrelSpeed;
  while (hero.z - b.z > maxD + 1) evs.push(...l.update(FPS, hero));
  const p = l.punch({ x: hero.x, z: hero.z, reach: 1.9, dmg: 1 });
  assert.equal(ofType(p, 'returned').length, 0);
  assert.equal(b.returning, false);
  evs.push(...run(l, 1.5, hero));
  assert.ok(evs.some(e => e.type === 'hurt' && e.by === 'barrel'));
});

test('mashing punch from a corner (off the barrels\' line) never lowers his life', () => {
  const l = mk(), hero = { x: -4.2, z: -3, y: 0, dodging: false, inv: 99 };
  // los de curva se meten en su carril: se corre al costado contrario del barril que viene, nunca queda en la línea
  run(l, 60, hero, () => {
    const inc = l.state.shots.filter(s => s.kind === 'barrel' && !s.returning && s.z < hero.z + 0.5);
    const b = inc.find(s => s.type === 'curve') || inc[0];
    if (b) hero.x = (b.type === 'curve' ? b.x1 : b.x) > 0 ? -4.2 : 4.2;
    l.punch({ x: hero.x, z: hero.z, reach: 1.9, dmg: 1 });
  });
  assert.equal(l.state.hp, H);
  assert.equal(l.state.phase, 1);
});

test('the hand warns, lands, stays stuck and takes extra damage', () => {
  const l = mk(), hero = { x: -2, z: -4, y: 0, dodging: false, inv: 99 };
  l._setHp(HALF);
  assert.equal(l.state.phase, 3);
  const evs = runUntil(l, hero, () => l.state.hand.state === 'warn');
  assert.equal(l.state.hand.x, -2);
  assert.equal(l.state.hand.z, -4);
  evs.push(...run(l, ARENA.phase3.slamWarn + 0.15 + 0.05, hero));
  assert.equal(l.state.hand.state, 'stuck');
  assert.ok(ofType(evs, 'slam').length >= 1);
  assert.deepEqual(ofType(evs, 'slam')[0], { type: 'slam', x: -2, z: -4 });
  run(l, ARENA.phase3.stuck - 0.5, hero);
  assert.equal(l.state.hand.state, 'stuck');
  const p = l.punch({ x: -2, z: -4, reach: 1.9, dmg: 1 });
  const hh = ofType(p, 'handHit');
  assert.equal(hh.length, 1);
  assert.equal(hh[0].dmg, ARENA.handDmg);
  assert.equal(l.state.hp, HALF - ARENA.handDmg);
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
    l._setHp(HALF);
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
  // espera la mano trabada y un barril que SÍ quedaría dentro de hitR tras un paso más (hoy está afuera)
  const step = ARENA.phase1.barrelSpeed * FPS;
  const close = () => l.state.shots.find(s => s.kind === 'barrel' && !s.returning && s.z < hero.z &&
    hero.z - s.z >= ARENA.hitR && hero.z - (s.z + step) < ARENA.hitR);
  for (let i = 0; i < 120 * 60; i++) {
    const b = l.state.shots.find(s => s.kind === 'barrel' && !s.returning && s.z < hero.z);
    if (b) hero.x = b.x;
    if (l.state.hand.state === 'stuck' && close()) break;
    l.update(FPS, hero);
  }
  assert.equal(l.state.hand.state, 'stuck');
  assert.ok(close(), 'precondition: the barrel touches the hero on the next step');
  const hand = l.state.hand;
  hero.inv = 0;
  const punch = l.punch({ x: hand.x, z: hand.z, reach: 1.9, dmg: 1 });
  assert.equal(ofType(punch, 'ko').length, 1);
  const next = l.update(FPS, hero);
  assert.equal(next.filter(e => e.type === 'hurt').length, 0);
});

test('a ko in a frame drops the hurt events of that same frame', () => {
  const l = mk(), hero = { x: 0, z: -3, y: 0, dodging: false, inv: 0 };
  l._setHp(3.75);
  // un barril común que toca al héroe y, DESPUÉS en el arreglo, un devuelto que llega al jefe y lo noquea
  l.state.shots.push({ id: 900, kind: 'barrel', gold: false, x: 0, z: -3, y: 0, returning: false });
  l.state.shots.push({ id: 901, kind: 'barrel', gold: true, x: 0, z: ARENA.bossZ + 0.01, y: 0, returning: true });
  const evs = l.update(FPS, hero);
  assert.equal(ofType(evs, 'ko').length, 1);
  assert.equal(ofType(evs, 'hurt').length, 0);
});

test('the stuck hand cannot be mashed: hits are locked out for 0.2 s', () => {
  const l = mk(), hero = safeHero();
  l._setHp(HALF);
  runUntil(l, hero, () => l.state.hand.state === 'stuck');
  const hand = l.state.hand, evs = [];
  let hits = 0;
  while (l.state.phase === 3 && (l.state.hand.state === 'stuck' || hits === 0)) {
    const p = l.punch({ x: hand.x, z: hand.z, reach: 1.9, dmg: 0.1 }); // golpe flojo: sin tope no llega al ko
    hits += ofType(p, 'handHit').length;
    evs.push(...p, ...l.update(FPS, hero));
  }
  assert.ok(hits >= 2, `hits ${hits}`);
  assert.ok(hits <= Math.ceil(ARENA.phase3.stuck / 0.2), `hits ${hits}`);
  assert.ok(HALF - l.state.hp <= Math.ceil(ARENA.phase3.stuck / 0.2) * ARENA.handDmg * 0.1 + 1e-9);
});

test('two gold returns open the dance class (phase 2) after a short transition', () => {
  const l = mk(), hero = safeHero(), evs = [];
  for (let i = 0; i < 2; i++) evs.push(...giveReturn(l, hero));
  assert.equal(l.state.phase, 2);
  assert.equal(l.state.mode, 'transition');
  assert.ok(evs.some(e => e.type === 'phase' && e.to === 2));
  assert.ok(evs.some(e => e.type === 'voice' && e.event === 'dice'));
  evs.push(...run(l, ARENA.dice.start + ARENA.dice.lead + 0.1, hero));
  assert.equal(l.state.mode, 'dice');
  assert.ok(ofType(evs, 'danceDemo').length >= 1);
});
