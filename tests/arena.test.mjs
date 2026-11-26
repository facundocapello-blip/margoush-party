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

test('both characters stand clearly separated side-by-side on stage facing front and Chaky stays in dance poses', () => {
  const l = mk();
  assert.ok(l.state.heroX <= -2.7, 'hero on the left side of the stage');
  assert.ok(l.state.bossX >= 2.7, 'Big Chaky on the right side of the stage');
  assert.ok(l.state.bossX - l.state.heroX >= 5.5, 'wide separation between hero and Big Chaky');
  assert.equal(l.state.pose, 'dance_idle');
  assert.equal(l.state.heroPose, 'dance_idle');
  // Al recibir daño durante el baile, Chaky nunca vuelve a la pose 'hurt' del buzo naranja
  const n = l.state.dice.notes[0];
  runUntil(l, safeHero(), () => Math.abs(l.state.dice.t - n.time) <= 0.02, 10);
  l.tap(n.lane);
  l.update(1 / 60);
  assert.notEqual(l.state.pose, 'hurt');
  assert.ok(l.state.pose.startsWith('dance_'));
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

test('4 aciertos seguidos activan Modo Disco (fever) con daño extra y un fallo lo reinicia', () => {
  const l = mk(), hero = safeHero();
  for (let i = 0; i < 4; i++) {
    const n = l.state.dice.notes[i];
    runUntil(l, hero, () => Math.abs(l.state.dice.t - n.time) <= 0.02, 10);
    const evs = l.tap(n.lane);
    if (i < 3) assert.equal(l.state.dice.fever, false);
    else {
      assert.equal(l.state.dice.fever, true);
      const hit = ofType(evs, 'bossHit')[0];
      assert.ok(hit.dmg > ARENA.stepDmg, 'Modo Disco hace más daño por paso');
    }
  }
  const n5 = l.state.dice.notes[4];
  runUntil(l, hero, () => n5.judged === 'miss', 10);
  assert.equal(l.state.dice.fever, false);
  assert.equal(l.state.dice.combo, 0);
});

test('D-1: un toque vacío corta combo; 3 vacíos en 1 s cuentan como fallo; palmear los 5 carriles pierde y un casual bueno gana', () => {
  // 1) Toque vacío corta combo/fever sin dañar de inmediato; al 3.º en 1 s daña
  const l = mk(), hero = safeHero();
  for (let i = 0; i < 4; i++) {
    const n = l.state.dice.notes[i];
    runUntil(l, hero, () => Math.abs(l.state.dice.t - n.time) <= 0.02, 10);
    l.tap(n.lane);
  }
  assert.equal(l.state.dice.fever, true);
  const wrongLane = (l.state.dice.notes[4].lane + 1) % DANCE_LANES;
  const e1 = l.tap(wrongLane);
  assert.equal(ofType(e1, 'danceStep')[0].grade, 'empty');
  assert.equal(ofType(e1, 'hurt').length, 0);
  assert.equal(l.state.dice.combo, 0);
  assert.equal(l.state.dice.fever, false);
  const e2 = l.tap(wrongLane);
  assert.equal(ofType(e2, 'hurt').length, 0);
  const e3 = l.tap(wrongLane);
  assert.equal(ofType(e3, 'danceStep')[0].grade, 'miss');
  assert.equal(ofType(e3, 'hurt').length, 1);

  // 2) Simulación de bots (20 semillas): palmear 5 carriles vs jugador casual bueno
  function sim(bot) {
    let wins = 0, livesSpent = 0;
    const TRIALS = 20;
    for (let s = 1; s <= TRIALS; s++) {
      let seed = s * 7919;
      const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
      const lg = createArenaLogic({ rand: rnd });
      let hp = 5, mashCd = 0;
      const reacted = new Set();
      for (let f = 0; f < 120 * 60 && lg.state.phase !== 'ko' && hp > 0; f++) {
        const d = lg.state.dice;
        const evs = [];
        if (d && d.stage === 'play') {
          if (bot === 'mash') {
            mashCd -= FPS;
            if (mashCd <= 0) {
              mashCd = 0.28;
              for (let lane = 0; lane < DANCE_LANES; lane++) evs.push(...lg.tap(lane));
            }
          } else {
            for (const n of d.notes) {
              if (!n.judged && !reacted.has(n) && d.t >= n.time - 0.04) {
                reacted.add(n);
                if (rnd() < 0.88) evs.push(...lg.tap(n.lane));
                else if (rnd() < 0.3) evs.push(...lg.tap((n.lane + 1) % DANCE_LANES));
              }
            }
          }
        }
        evs.push(...lg.update(FPS, hero));
        for (const e of evs) {
          if (e.type === 'heal') hp = Math.min(5, hp + 1);
          if (e.type === 'hurt') {
            hp--;
            if (hp <= 0) {
              if (lg.useLife()) { hp = 5; livesSpent++; reacted.clear(); }
              else break;
            }
          }
        }
      }
      if (lg.state.phase === 'ko' && hp > 0) wins++;
    }
    return { winRate: wins / TRIALS, avgLives: livesSpent / TRIALS };
  }

  const mash = sim('mash');
  const casual = sim('casual');
  assert.ok(mash.winRate < 0.2, `palmear los 5 carriles debe ganar < 20 % (ganó ${Math.round(mash.winRate * 100)} %)`);
  assert.ok(mash.avgLives >= 2, `palmear los 5 carriles debe gastar ≥ 2 estrellas (gastó ${mash.avgLives.toFixed(2)})`);
  assert.ok(casual.winRate >= 0.95, `jugador casual bueno debe ganar ≥ 95 % (ganó ${Math.round(casual.winRate * 100)} %)`);
});

