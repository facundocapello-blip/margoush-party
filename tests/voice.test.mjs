import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createVoice, CATALOG, COOLDOWN } from '../3d/js/voice.js';

const clock = () => { let t = 0; return { now: () => t, add: (s) => { t += s; } }; };

test('a higher priority line cuts the one that is playing; lower or equal ones are dropped', () => {
  const c = clock(), said = [];
  const v = createVoice({ speak: (txt) => said.push(txt), now: c.now, rand: () => 0.5 });
  assert.ok(v.say('chaky', 'attack'));
  assert.equal(v.say('chaky', 'taunt'), null);   // misma prioridad mientras habla
  assert.ok(v.say('chaky', 'hurt'));             // más importante: corta
  assert.ok(v.say('chaky', 'ko'));               // la derrota corta todo
  assert.equal(said.length, 3);
});

test('no line repeats twice in a row and every variant comes out', () => {
  const c = clock(), said = [];
  const v = createVoice({ speak: (txt) => said.push(txt), now: c.now });
  for (let i = 0; i < 30; i++) { v.say('chaky', 'attack'); c.add(10); }
  for (let i = 1; i < said.length; i++) assert.notEqual(said[i], said[i - 1]);
  assert.deepEqual(new Set(said), new Set(CATALOG.chaky.attack));
});

test('taunts wait their cooldown', () => {
  const c = clock();
  const v = createVoice({ now: c.now });
  assert.ok(v.say('chaky', 'taunt'));
  c.add(COOLDOWN.taunt - 0.5);
  assert.equal(v.say('chaky', 'taunt'), null);
  c.add(1);
  assert.ok(v.say('chaky', 'taunt'));
});

test('the four bosses have intro, attack, hurt, phase and ko lines', () => {
  for (const b of ['chaky', 'cepi', 'lale', 'pinky']) for (const ev of ['intro', 'attack', 'hurt', 'phase', 'ko']) assert.ok(CATALOG[b][ev]?.length, `${b}.${ev}`);
});
