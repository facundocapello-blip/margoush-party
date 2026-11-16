import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createScore, RANKS } from '../3d/js/score.js';

test('minion is worth 100 times the multiplier', () => {
  const s = createScore();
  s.addKill('minion');
  assert.equal(s.total, 100);
  for (let i = 0; i < 5; i++) s.addHit();
  s.addKill('minion');
  assert.equal(s.total, 100 + 150);
});

test('boss, bottle and secret values', () => {
  const s = createScore();
  s.addKill('boss'); s.addPickup('bottle'); s.addPickup('secret');
  assert.equal(s.total, 2000 + 50 + 500);
});

test('multiplier grows 0.1 per hit, caps at 3 and resets on damage', () => {
  const s = createScore();
  assert.equal(s.multiplier, 1);
  s.addHit(); s.addHit();
  assert.equal(s.multiplier, 1.2);
  for (let i = 0; i < 40; i++) s.addHit();
  assert.equal(s.multiplier, 3);
  s.takeDamage();
  assert.equal(s.multiplier, 1);
});

test('finalize adds hp and time bonuses and grades', () => {
  const s = createScore();
  s.addKill('boss');
  const r = s.finalize({ hpLeft: 3, hpMax: 5, seconds: 200 });
  // dos niveles: el bonus de tiempo cuenta hasta los 480 s
  assert.equal(r.total, 2000 + 1800 + 2800);
  assert.deepEqual(r.breakdown, { play: 2000, hpBonus: 1800, timeBonus: 2800 });
  assert.ok(Number.isInteger(r.total));
});

test('time bonus never goes negative', () => {
  const r = createScore().finalize({ hpLeft: 0, hpMax: 5, seconds: 999 });
  assert.equal(r.total, 0);
});

test('rank thresholds', () => {
  // puntos exactos con mamaderas (50 c/u); los cortes son múltiplos de 50
  const grade = (pts) => { const s = createScore(); for (let i = 0; i < pts / 50; i++) s.addPickup('bottle'); s.addPenalty(s.total - pts); return s.finalize({ hpLeft: 0, hpMax: 5, seconds: 480, won: false }).rank; };
  assert.ok(RANKS.S > RANKS.A && RANKS.A > RANKS.B && RANKS.B > 0);
  assert.equal(grade(RANKS.S), 'S');
  assert.equal(grade(RANKS.S - 1), 'A');
  assert.equal(grade(RANKS.A), 'A');
  assert.equal(grade(RANKS.B), 'B');
  assert.equal(grade(RANKS.B - 1), 'C');
});

test('new enemy kinds are worth their own points, times the multiplier', () => {
  const s = createScore();
  s.addKill('patovica'); assert.equal(s.total, 250);
  s.addKill('bombo'); s.addKill('mozo'); s.addKill('delivery'); assert.equal(s.total, 250 + 600);
  for (let i = 0; i < 10; i++) s.addHit();
  assert.equal(s.killValue('patovica'), 500);
  assert.equal(s.killValue('boss'), 2000);
});

test('penalties (boletas) subtract but never go below zero', () => {
  const s = createScore();
  s.addPickup('bottle');
  s.addPenalty(100);
  assert.equal(s.total, 0);
  s.addKill('minion'); s.addPenalty(30);
  assert.equal(s.total, 70);
});

test('totals are integers with fractional multipliers', () => {
  const s = createScore();
  for (let i = 0; i < 3; i++) s.addHit();
  s.addKill('minion');
  assert.ok(Number.isInteger(s.total));
  assert.equal(s.total, 130);
});

test('losing earns no hp or time bonus', () => {
  const s = createScore();
  s.addKill('minion');
  const r = s.finalize({ hpLeft: 5, hpMax: 5, seconds: 10, won: false });
  assert.equal(r.total, 100);
  assert.deepEqual(r.breakdown, { play: 100, hpBonus: 0, timeBonus: 0 });
});
