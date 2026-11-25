import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { poseHeight } from '../3d/js/poses.js';

const man = JSON.parse(fs.readFileSync(new URL('../3d/assets/manifest.json', import.meta.url)));
// Tamaño de cabeza en metros = alto dibujado / alto de celda en px × ancho de cabeza en px
const headM = (name, ref, heightM) => {
  const m = man[name];
  return heightM * poseHeight(man, name, ref) / (m.h / m.rows) * m.skull;
};

for (const [hero, poses] of [['douge', ['run', 'attack']], ['marine', ['run', 'attack']]]) {
  test(`${hero}: la cabeza mide lo mismo en todas las poses`, () => {
    const ref = hero + '_idle';
    const base = headM(ref, ref, 2.3);
    for (const p of poses) {
      const v = headM(`${hero}_${p}`, ref, 2.3);
      assert.ok(Math.abs(v / base - 1) < 0.03, `${p}: ${(v / base).toFixed(2)}× la cabeza en reposo`);
    }
  });
}
