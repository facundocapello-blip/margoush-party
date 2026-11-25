import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveOverlaps } from '../3d/js/pop_layout.js';

const overlap = (a, b) => Math.abs(a.x - b.x) < (a.w + b.w) / 2 && Math.abs(a.y - b.y) < (a.h + b.h) / 2;

test('tres textos en el mismo punto quedan separados', () => {
  const boxes = [0, 1, 2].map(() => ({ x: 200, y: 300, w: 80, h: 24 }));
  resolveOverlaps(boxes, { top: 60, bottom: 800 });
  for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) assert.ok(!overlap(boxes[i], boxes[j]), `${i} y ${j} se pisan`);
  assert.equal(boxes[0].y, 300, 'el más viejo no se mueve');
});

test('textos separados no se mueven', () => {
  const boxes = [{ x: 100, y: 300, w: 80, h: 24 }, { x: 300, y: 300, w: 80, h: 24 }];
  resolveOverlaps(boxes, { top: 60, bottom: 800 });
  assert.deepEqual(boxes.map(b => b.y), [300, 300]);
});

test('nunca quedan debajo del HUD de arriba', () => {
  const boxes = [{ x: 200, y: 20, w: 80, h: 24 }, { x: 200, y: 70, w: 80, h: 24 }];
  resolveOverlaps(boxes, { top: 60, bottom: 800 });
  for (const b of boxes) assert.ok(b.y - b.h / 2 >= 60);
  assert.ok(!overlap(boxes[0], boxes[1]));
});
