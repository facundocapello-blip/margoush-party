import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createScore } from '../3d/js/score.js';

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
  assert.equal(r.total, 2000 + 1800 + 1000);
  assert.equal(r.rank, 'C');
  assert.deepEqual(r.breakdown, { play: 2000, hpBonus: 1800, timeBonus: 1000 });
  assert.ok(Number.isInteger(r.total));
});

test('time bonus never goes negative', () => {
  const r = createScore().finalize({ hpLeft: 0, hpMax: 5, seconds: 999 });
  assert.equal(r.total, 0);
});

test('rank thresholds', () => {
  const grade = (pts) => { const s = createScore(); s.addPickup('secret'); for (let i = 1; i < pts / 500; i++) s.addPickup('secret'); return s.finalize({ hpLeft: 0, hpMax: 5, seconds: 300 }).rank; };
  assert.equal(grade(15000), 'S');
  assert.equal(grade(10000), 'A');
  assert.equal(grade(6000), 'B');
  assert.equal(grade(5500), 'C');
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
