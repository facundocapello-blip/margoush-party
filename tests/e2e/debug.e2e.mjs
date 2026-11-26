// R-1: Modo diagnóstico (?debug=1): muestra métricas arriba a la izquierda; sin ?debug=1 no existe.
import { launch, check, shot } from './harness.mjs';

const G = (page, fn, arg) => page.evaluate(fn, arg);
const { browser, page, errors } = await launch({ viewport: { width: 430, height: 932 }, mobile: true });

try {
  // 1) Con ?probar=cepi-duelo&debug=1 (con Marine, para el caso de pantalla negra reportado en iPhone)
  await page.goto('http://game.local/3d/index.html?probar=cepi-duelo&debug=1');
  await page.waitForFunction(() => window.__game && window.__game.state === 'menu', null, { timeout: 20000 });
  await G(page, () => document.querySelector('#press-start')?.click());
  await page.waitForTimeout(550);
  await G(page, () => document.querySelector('#btn-play').click());
  await page.waitForTimeout(250);
  await G(page, () => document.querySelector('.card[data-hero="marine"]').click());
  await page.waitForFunction(() => window.__game.state === 'arena-cepi', null, { timeout: 25000 });
  await page.waitForTimeout(600);

  const dbg = await G(page, () => {
    const el = document.querySelector('#debug-hud');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { text: el.textContent || '', top: r.top, left: r.left, width: r.width, height: r.height };
  });
  check(!!dbg && dbg.width > 40 && dbg.height > 20, 'con ?debug=1 aparece la cajita #debug-hud arriba a la izquierda');
  check(dbg.top < 80 && dbg.left < 40, `posición arriba a la izquierda (top=${Math.round(dbg.top)}, left=${Math.round(dbg.left)})`);
  check(/FPS\s+\d+/.test(dbg.text) && /\(\d+\.\dms\)/.test(dbg.text), 'muestra FPS y ms por cuadro: ' + dbg.text.split('\n')[0]);
  check(/Q:\d+/.test(dbg.text) && /DPR:\d+\.\d+/.test(dbg.text), 'muestra perf.level y DPR');
  check(/calls:\d+/.test(dbg.text) && /geo:\d+/.test(dbg.text) && /tex:\d+/.test(dbg.text), 'muestra calls, geometries y textures: ' + dbg.text.split('\n')[1]);
  check(/err:0/.test(dbg.text), 'muestra frameErrors en 0: ' + dbg.text.split('\n')[2]);
  await shot(page, 'r1_debug_cepi_duelo');

  // 2) Sin ?debug=1 la cajita NO existe
  await page.goto('http://game.local/3d/index.html?probar=cepi-duelo');
  await page.waitForFunction(() => window.__game && window.__game.state === 'menu', null, { timeout: 20000 });
  check(await G(page, () => document.querySelector('#debug-hud') === null), 'sin ?debug=1 la cajita #debug-hud no existe');
  check(errors.length === 0, 'sin errores ' + errors.join(' | '));
} finally {
  await browser.close();
}
