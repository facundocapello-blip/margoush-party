import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ARENA, DANCE_LANES, createArenaLogic } from '../3d/js/arena_logic.js';

const FPS = 1 / 60;
const mk = () => createArenaLogic({ rand: () => 0.5 });
const safeHero = () => ({ x: -2.05, z: -12.5, y: 0, dodging: false, inv: 99 });

function run(logic, secs, hero, step) {
  const evs = [];
  for (let i = 0, n = Math.round(secs / FPS); i < n; i++) {
    if (step) step(evs);
    evs.push(...logic.update(FPS, hero));
  }
  return evs;
}

function runUntil(logic, hero, cond, max = 60, evs = []) {
  for (let i = 0, n = Math.round(max / FPS); i < n && !cond(); i++) evs.push(...logic.update(FPS, hero));
  assert.ok(cond(), 'condition reached');
  return evs;
}

const ofType = (evs, type) => evs.filter(e => e.type === type);

function playDance(l, hit) {
  const hero = safeHero();
  const evs = [];
  for (let i = 0; i < 90 * 60 && l.state.phase !== 'ko'; i++) {
    const d = l.state.dice;
    if (d && d.stage === 'play') {
      for (const n of d.notes) {
        if (!n.judged && Math.abs(n.time - d.t) < 0.02) {
          const lane = hit(n, d);
          if (lane !== null) evs.push(...l.tap(lane));
        }
      }
    }
    evs.push(...l.update(FPS, hero));
    // Si está jugando a errar todas, cortamos tras completar las 3 rondas
    if (l.state.dice && l.state.dice.res.length >= ARENA.dice.rounds.length && l.state.dice.stage === 'result') break;
  }
  return evs;
}

test('starts directly in the dance stage in round 1 with full life and 3 extra lives', () => {
  const l = mk();
  assert.equal(l.state.phase, 1);
  assert.equal(l.state.mode, 'dice');
  assert.equal(l.state.hp, ARENA.hp);
  assert.equal(l.state.hpMax, ARENA.hp);
  assert.equal(l.state.lives, 3);
  assert.equal(l.state.livesMax, 3);
  assert.equal(l.state.shots.length, 0);
  assert.ok(l.state.dice);
  assert.equal(l.state.dice.notes.length, ARENA.dice.rounds[0]);
});

test('both characters stand side-by-side on stage facing front', () => {
  const l = mk();
  assert.ok(l.state.heroX < 0, 'hero on the left side of the stage');
  assert.ok(l.state.bossX > 0, 'Big Chaky on the right side of the stage');
  assert.equal(l.state.pose, 'dance_idle');
  assert.equal(l.state.heroPose, 'dance_idle');
});

test('3 agile dance rounds of 6, 8 and 10 arrows (24 total) knock out Big Chaky when hit on time', () => {
  const l = mk();
  const evs = playDance(l, (n) => n.lane);
  const steps = ofType(evs, 'danceStep');
  assert.equal(steps.length, ARENA.dice.rounds.reduce((a, b) => a + b, 0));
  assert.ok(steps.every(s => s.grade === 'perfect'));
  assert.equal(ofType(evs, 'diceResult').length, ARENA.dice.rounds.length);
  assert.ok(ofType(evs, 'diceResult').every(r => r.ok));
  assert.equal(ofType(evs, 'heal').length, 1);
  assert.equal(l.state.phase, 'ko');
  assert.equal(l.state.hp, 0);
  assert.equal(ofType(evs, 'ko').length, 1);
});

test('every single hit arrow immediately damages Big Chaky', () => {
  const l = mk(), hero = safeHero();
  const hp0 = l.state.hp;
  const n = l.state.dice.notes[0];
  runUntil(l, hero, () => Math.abs(l.state.dice.t - n.time) <= 0.02, 10);
  const evs = l.tap(n.lane);
  assert.equal(ofType(evs, 'danceStep')[0].grade, 'perfect');
  assert.equal(ofType(evs, 'bossHit').length, 1);
  assert.ok(l.state.hp < hp0, 'hp drops on every hit arrow');
});

test('a tap slightly off the beat counts as good, not perfect, and still hurts Chaky', () => {
  const l = mk(), hero = safeHero();
  const n = l.state.dice.notes[0];
  runUntil(l, hero, () => l.state.dice.t >= n.time + (ARENA.dice.perfect + ARENA.dice.good) / 2, 10);
  const evs = l.tap(n.lane);
  const s = ofType(evs, 'danceStep')[0];
  assert.equal(s.grade, 'good');
  assert.equal(ofType(evs, 'bossHit').length, 1);
});

test('missing an arrow costs a heart; tapping an empty lane does not punish', () => {
  const l = mk(), hero = safeHero();
  const emptyEvs = l.tap(0);
  assert.equal(ofType(emptyEvs, 'danceStep')[0].grade, 'empty');
  assert.equal(ofType(emptyEvs, 'hurt').length, 0);

  const n = l.state.dice.notes[0];
  const evs = runUntil(l, hero, () => n.judged !== null, 10);
  assert.equal(n.judged, 'miss');
  assert.ok(evs.some(e => e.type === 'hurt' && e.by === 'dice'));
});

test('3 extra lives allow continuing from the same round without restarting from round 1', () => {
  const l = mk();
  l._setHp(ARENA.diceAt);
  assert.equal(l.state.phase, 2);
  assert.equal(l.state.dice.round, 1);
  assert.equal(l.state.lives, 3);

  assert.equal(l.useLife(), true);
  assert.equal(l.state.lives, 2);
  assert.equal(l.state.phase, 2, 'stays in round 2');
  assert.equal(l.state.dice.round, 1, 'continues from round index 1');

  assert.equal(l.useLife(), true);
  assert.equal(l.useLife(), true);
  assert.equal(l.state.lives, 0);
  assert.equal(l.useLife(), false, 'no extra lives left after spending all 3');
});

test('_setHp jumps to round 2, round 3 or ko for quick tests', () => {
  const l = mk();
  l._setHp(21);
  assert.equal(l.state.phase, 2);
  assert.equal(l.state.dice.round, 1);
  l._setHp(11);
  assert.equal(l.state.phase, 3);
  assert.equal(l.state.dice.round, 2);
  const evs = l._setHp(0);
  assert.equal(l.state.phase, 'ko');
  assert.equal(ofType(evs, 'ko').length, 1);
});

test('ko happens once and nothing hurts after it', () => {
  const l = mk(), hero = safeHero();
  const evs = l._setHp(0);
  assert.equal(ofType(evs, 'ko').length, 1);
  assert.equal(l.state.phase, 'ko');
  assert.equal(l.state.hp, 0);
  const after = run(l, 5, hero);
  assert.equal(after.filter(e => e.type === 'hurt').length, 0);
  assert.equal(l.tap(0).length, 0);
});
