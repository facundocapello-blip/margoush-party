import { test } from 'node:test';
import assert from 'node:assert/strict';
import { margotMood, MARGOT_LINES } from '../3d/js/margot.js';

test('Margot llora si te pegan, si te queda 1 corazón o si la ve pasar', () => {
  assert.equal(margotMood({ hurt: true }), 'cry');
  assert.equal(margotMood({ hp: 1 }), 'cry');
  assert.equal(margotMood({ seen: true, cheer: true }), 'cry');
});

test('Margot se ríe si venís bien', () => {
  assert.equal(margotMood({ mult: 2 }), 'happy');
  assert.equal(margotMood({ cheer: true }), 'happy');
  assert.equal(margotMood({}), 'calm');
});

test('Margot llama a papá o a mamá según el héroe', () => {
  assert.match(MARGOT_LINES.douge, /Pap/);
  assert.match(MARGOT_LINES.marine, /Mama+n/);
});
