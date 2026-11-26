import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeThemes, m2f } from '../3d/js/music.js';
import { ARENA } from '../3d/js/arena_logic.js';

// Todos los temas suenan (tocan notas válidas) y se repiten sin romperse
test('every theme plays valid notes for a long time', () => {
  const calls = [];
  const tone = (type, f0, f1, dur, vol, d) => calls.push({ type, f0, f1, dur, vol, d });
  const hiss = (dur, vol, f, q, d) => calls.push({ hiss: true, dur, vol, f0: f, f1: f, d });
  const T = makeThemes(tone, hiss);
  assert.deepEqual(Object.keys(T).sort(), ['ba', 'boss', 'byd', 'chase', 'disco', 'francia', 'intro', 'menu', 'rescate']);
  for (const [name, th] of Object.entries(T)) {
    calls.length = 0;
    for (let n = 0; n < 512; n++) th.play(n, 0.01, { intensity: n / 512, beat: 0.52 });
    assert.ok(calls.length > 300, `${name} plays (${calls.length})`);
    for (const c of calls) {
      assert.ok(Number.isFinite(c.f0) && c.f0 > 20 && c.f0 < 12000, `${name}: freq ${c.f0}`);
      assert.ok(c.dur > 0 && c.dur < 4 && c.vol > 0 && c.vol <= 0.6, `${name}: dur/vol ${c.dur}/${c.vol}`);
    }
    const st = th.stepFor ? th.stepFor({ intensity: 1, beat: 0.46 }) : th.step;
    assert.ok(st > 0.04 && st < 0.3, `${name}: step ${st}`);
  }
  assert.equal(Math.round(m2f(69)), 440);
});

test('D-4: disco theme quarter-note duration matches each Chaky dance round beat exactly', () => {
  const T = makeThemes(() => {}, () => {});
  for (const beat of ARENA.dice.beats) {
    const quarter = T.disco.stepFor({ beat }) * 4;
    assert.ok(Math.abs(quarter - beat) < 0.001, `quarter ${quarter} vs beat ${beat}`);
  }
});
