import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { poseHeight, CROSSFADE, poseImpulseKind, poseScaleBlend } from '../3d/js/poses.js';

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

test('A-5: fundido cruzado ~80 ms interpola tamaño sin saltos y aplica squash & stretch al caer o recibir golpe', () => {
  assert.equal(CROSSFADE, 0.08);
  assert.equal(poseImpulseKind('arena_cepi_hurt'), -1);
  assert.equal(poseImpulseKind('arena_facu_windup'), 1);
  assert.equal(poseImpulseKind('arena_facu_idle'), 0);

  // Al inicio del fundido (fadeT = CROSSFADE), mantiene el tamaño anterior y el fantasma es visible
  const t0 = poseScaleBlend(2.0, 4.0, 3.0, 5.0, CROSSFADE, 0, 0, 0);
  assert.ok(Math.abs(t0.w - 2.0) < 0.001 && Math.abs(t0.h - 4.0) < 0.001);
  assert.ok(t0.ghostOpacity > 0.7);

  // A mitad del fundido (40 ms), el tamaño está justo en el medio (sin salto brusco)
  const mid = poseScaleBlend(2.0, 4.0, 3.0, 5.0, CROSSFADE / 2, 0, 0, 0);
  assert.ok(Math.abs(mid.w - 2.5) < 0.01 && Math.abs(mid.h - 4.5) < 0.01);

  // Al terminar el fundido (fadeT = 0), llega al tamaño objetivo y el fantasma desaparece
  const end = poseScaleBlend(2.0, 4.0, 3.0, 5.0, 0, 0, 0, 0);
  assert.ok(Math.abs(end.w - 3.0) < 0.001 && Math.abs(end.h - 5.0) < 0.001);
  assert.equal(end.ghostOpacity, 0);

  // Rebote al caer de un salto (landT = 0.5): se ensancha y se aplasta levemente
  const land = poseScaleBlend(2.0, 4.0, 2.0, 4.0, 0, 0, 0, 0.5);
  assert.ok(land.w > 2.15 && land.h < 3.7);
});
