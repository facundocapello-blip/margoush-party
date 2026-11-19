import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BONUS, createBonusLogic } from '../3d/js/bonus.js';

const spots = [-1.2, 0, 1.2];
const spotX = (i) => spots[i];
const mk = () => { let k = 0; return createBonusLogic({ rand: () => [0.1, 0.9, 0.5][k++ % 3] }); };

test('starts with full car and 20 seconds', () => {
  const l = mk();
  assert.equal(l.state.hp, BONUS.hp);
  assert.equal(l.state.t, BONUS.time);
  assert.equal(l.state.over, false);
});

test('punching in front of the glowing spot hits triple and moves the spot', () => {
  const l = mk(), s0 = l.state.spot;
  const evs = l.punch({ x: spotX(s0), dmg: 1, spotX });
  assert.equal(evs[0].dmg, BONUS.spotMult);
  assert.equal(evs[0].spot, s0);
  assert.notEqual(l.state.spot, s0);
  assert.equal(l.state.hp, BONUS.hp - BONUS.spotMult);
});

test('punching away from the spot hits normal', () => {
  const l = mk(), s0 = l.state.spot;
  const far = spotX(s0) + 2;
  const evs = l.punch({ x: far, dmg: 2, spotX });
  assert.equal(evs[0].dmg, 2);
  assert.equal(evs[0].spot, -1);
  assert.equal(l.state.spot, s0);
});

test('the car breaks by stages and wrecks once, reporting the time left', () => {
  const l = mk(), evs = [];
  l.update(5);
  while (!l.state.over) evs.push(...l.punch({ x: 99, dmg: 2, spotX }));
  assert.deepEqual(evs.filter(e => e.type === 'stage').map(e => e.stage), [1, 2, 3, 4]);
  const w = evs.filter(e => e.type === 'wreck');
  assert.equal(w.length, 1);
  assert.equal(w[0].timeLeft, BONUS.time - 5);
  assert.equal(l.punch({ x: 0, dmg: 1, spotX }).length, 0);
  assert.equal(l.update(1).length, 0);
});

test('time runs out once and then nothing counts', () => {
  const l = mk();
  const evs = [];
  for (let i = 0; i < 25 * 60; i++) evs.push(...l.update(1 / 60));
  assert.equal(evs.filter(e => e.type === 'timeup').length, 1);
  assert.equal(l.state.wrecked, false);
  assert.equal(l.punch({ x: 0, dmg: 1, spotX }).length, 0);
});

test('a decent player can wreck it in time: ~1 punch every 0.3 s, half on the spot', () => {
  const l = createBonusLogic({ rand: Math.random });
  let t = 0, n = 0;
  while (!l.state.over) {
    l.update(0.3); t += 0.3; n++;
    const dmg = [1, 1, 2][n % 3];
    l.punch({ x: n % 2 ? spotX(l.state.spot) : 99, dmg, spotX });
  }
  assert.ok(l.state.wrecked, 'wrecked');
  assert.ok(t > 5 && t < 15, `took ${t.toFixed(1)} s`);
});
