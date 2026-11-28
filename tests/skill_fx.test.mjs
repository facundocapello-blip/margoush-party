import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  SKILL_PALETTES,
  SKILL_SIZES,
  SKILL_PRESETS,
  MAX_SAFARI_ATLAS,
  compileSkillEffect,
  applySkillPatch,
  computeSheetLayout,
  bakeSpriteSheet,
  renderSkillFrame,
  SkillFxSystem,
  SpriteSheetPlayer
} from '../3d/js/skill_fx.js';

function makeMockCanvasFactory() {
  return function createCanvas(w, h) {
    const ops = [];
    const gradStub = () => ({ addColorStop() {} });
    const ctx = {
      globalCompositeOperation: 'source-over',
      globalAlpha: 1,
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 1,
      save() { ops.push('save'); },
      restore() { ops.push('restore'); },
      clearRect(x, y, cw, ch) { ops.push(['clearRect', x, y, cw, ch]); },
      translate(x, y) { ops.push(['translate', x, y]); },
      rotate(a) { ops.push(['rotate', a]); },
      scale(sx, sy) { ops.push(['scale', sx, sy]); },
      beginPath() { ops.push('beginPath'); },
      closePath() { ops.push('closePath'); },
      moveTo(x, y) { ops.push(['moveTo', x, y]); },
      lineTo(x, y) { ops.push(['lineTo', x, y]); },
      quadraticCurveTo() { ops.push('quad'); },
      arc() { ops.push('arc'); },
      rect(x, y, rw, rh) { ops.push(['rect', x, y, rw, rh]); },
      clip() { ops.push('clip'); },
      fill() { ops.push('fill'); },
      stroke() { ops.push('stroke'); },
      drawImage(...args) { ops.push(['drawImage', ...args]); },
      createRadialGradient() { return gradStub(); },
      createLinearGradient() { return gradStub(); }
    };
    return {
      width: w,
      height: h,
      ops,
      getContext() { return ctx; },
      toDataURL() { return 'data:image/png;base64,iVBORw0KGgo='; }
    };
  };
}

test('todos los presets incluyen explícitamente las 4 capas tipo Effekseer', () => {
  const ids = Object.keys(SKILL_PRESETS);
  assert.ok(ids.length >= 6);
  for (const id of ids) {
    const compiled = compileSkillEffect(SKILL_PRESETS[id]);
    assert.equal(compiled.id, id);
    for (const layer of ['core', 'trail', 'shockwave', 'sparks']) {
      assert.ok(compiled.layers[layer], `${id} debe definir capa ${layer}`);
      assert.equal(compiled.layers[layer].enabled, true);
    }
    assert.ok(compiled.sparkPool.length > 0);
    assert.ok(compiled.shardPool.length > 0);
  }
});

test('cambio en 1 clic de paleta y tamaño vía JSON actualiza colores y escala sin perder capas', () => {
  const sys = new SkillFxSystem('douge_truth_slam');
  assert.equal(sys.compiled.palette.id, 'solar_gold');
  assert.equal(sys.compiled.scale, 1.0);

  // Cambio de paleta en 1 clic
  sys.setPalette('emerald_ivy');
  assert.equal(sys.compiled.palette.id, 'emerald_ivy');
  assert.equal(sys.compiled.palette.hex.primary, SKILL_PALETTES.emerald_ivy.primary);

  // Cambio de tamaño en 1 clic
  sys.setSize('xl');
  assert.equal(sys.compiled.size.id, 'xl');
  assert.equal(sys.compiled.scale, SKILL_SIZES.xl.scale);

  // Patch JSON declarativo con paleta personalizada hexadecimal y escala numérica
  const patched = applySkillPatch(sys.toJSON(), JSON.stringify({
    palette: { id: 'neon_mint', core: '#ffffff', primary: '#12f7d6', secondary: '#0b7285', accent: '#c3fae8', debris: '#ffd43b' },
    size: 1.25
  }));
  const custom = compileSkillEffect(patched);
  assert.equal(custom.palette.id, 'neon_mint');
  assert.deepEqual(custom.palette.rgb.primary, { r: 0x12, g: 0xf7, b: 0xd6 });
  assert.equal(custom.scale, 1.25);
  assert.equal(custom.layers.shockwave.rings, 3);
});

test('cada una de las 4 capas puede aislarse y dibuja primitivas de forma independiente', () => {
  const createCanvas = makeMockCanvasFactory();
  const canvas = createCanvas(256, 256);
  const ctx = canvas.getContext('2d');

  for (const preset of Object.values(SKILL_PRESETS)) {
    const compiled = compileSkillEffect(preset);
    for (const solo of ['core', 'trail', 'shockwave', 'sparks']) {
      const mask = { core: false, trail: false, shockwave: false, sparks: false, [solo]: true };
      const count = renderSkillFrame(ctx, compiled, 0.25, { x: 128, y: 128, layerMask: mask });
      assert.ok(count > 0, `${preset.id} capa ${solo} debería emitir primitivas en t=0.25`);
    }
    const muted = renderSkillFrame(ctx, compiled, 0.25, {
      x: 128, y: 128,
      layerMask: { core: false, trail: false, shockwave: false, sparks: false }
    });
    assert.equal(muted, 0);
  }
});

test('bakeSpriteSheet limpia alfa transparente, recorta celdas y respeta <= 2048 px de Safari iOS', () => {
  const createCanvas = makeMockCanvasFactory();

  for (const sizeKey of Object.keys(SKILL_SIZES)) {
    for (const frames of [12, 16, 24, 36, 64]) {
      const layout = computeSheetLayout({ frames, cellSize: SKILL_SIZES[sizeKey].cellSize });
      assert.ok(layout.w <= MAX_SAFARI_ATLAS, `ancho ${layout.w} > 2048 en ${sizeKey}/${frames}f`);
      assert.ok(layout.h <= MAX_SAFARI_ATLAS, `alto ${layout.h} > 2048 en ${sizeKey}/${frames}f`);
      assert.ok(layout.cols * layout.rows >= frames);
    }

    const cfg = applySkillPatch('marine_ivy_whirl', { size: sizeKey, sheet: { frames: 16 } });
    const baked = bakeSpriteSheet(cfg, { createCanvas });
    assert.equal(baked.meta.transparent, true);
    assert.ok(baked.meta.w <= MAX_SAFARI_ATLAS && baked.meta.h <= MAX_SAFARI_ATLAS);
    assert.equal(baked.cells.length, 16);

    // Primera operación sobre el lienzo debe ser clearRect completo para fondo transparente
    assert.deepEqual(baked.canvas.ops[0], ['clearRect', 0, 0, baked.meta.w, baked.meta.h]);
    const entry = Object.values(baked.manifestEntry)[0];
    assert.equal(entry.w, baked.meta.w);
    assert.equal(entry.cols, baked.meta.cols);
    assert.equal(entry.rows, baked.meta.rows);
    assert.equal(entry.frames, 16);
  }
});

test('SpriteSheetPlayer y SkillFxSystem reciclan instancias sin fugas y recortan el cuadro exacto', () => {
  const createCanvas = makeMockCanvasFactory();
  const baked = bakeSpriteSheet('cepi_golden_smash', { createCanvas, frames: 16, fps: 20 });
  const player = new SpriteSheetPlayer(baked);
  const dst = createCanvas(200, 200);
  const ctx = dst.getContext('2d');

  assert.equal(player.frameIndex, 0);
  player.update(5 / 20 + 0.001); // avanzar al cuadro índice 5
  assert.equal(player.frameIndex, 5);
  player.draw(ctx, 100, 100);

  const drawOp = dst.ops.find((op) => Array.isArray(op) && op[0] === 'drawImage');
  assert.ok(drawOp, 'SpriteSheetPlayer.draw debe invocar drawImage');
  const expectedCol = 5 % baked.meta.cols;
  const expectedRow = Math.floor(5 / baked.meta.cols);
  assert.equal(drawOp[2], expectedCol * baked.meta.cellW);
  assert.equal(drawOp[3], expectedRow * baked.meta.cellH);

  // Pool fijo sin crecimiento de memoria
  const sys = new SkillFxSystem('lale_oven_flare', { maxInstances: 4 });
  for (let i = 0; i < 10; i++) sys.spawn(50, 50);
  assert.equal(sys.pool.length, 4);
  assert.equal(sys.activeCount, 4);
  sys.update(5.0);
  assert.equal(sys.activeCount, 0);
});
