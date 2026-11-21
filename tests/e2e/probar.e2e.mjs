// Links de prueba (?probar=…): elegir héroe con el dedo y entrar directo al tramo pedido.
import { launch, check } from './harness.mjs';

const G = (page, fn, arg) => page.evaluate(fn, arg);
const CASES = [
  ['chaky', () => window.__game.state === 'arena' && window.__game.arena.logic.state.phase === 1],
  ['chaky-cartel', () => window.__game.state === 'arena' && window.__game.arena.logic.state.phase === 2],
  ['chaky-enojado', () => window.__game.state === 'arena' && window.__game.arena.logic.state.phase === 3],
  ['persecucion', () => window.__game.state === 'chase'],
  ['francia', () => window.__game.state === 'playing' && window.__game.level === 2]
];
const { browser, page, errors } = await launch({ viewport: { width: 430, height: 932 }, mobile: true });
try {
  for (const [id, cond] of CASES) {
    await page.goto('http://game.local/3d/index.html?probar=' + id);
    await page.waitForFunction(() => window.__game && window.__game.state === 'menu', null, { timeout: 20000 });
    await G(page, () => document.querySelector('#press-start')?.click());
    await page.waitForTimeout(600);
    await G(page, () => document.querySelector('#btn-play').click());
    await page.waitForTimeout(300);
    await G(page, () => document.querySelector('.card[data-hero="marine"]').click());
    await page.waitForFunction(cond, null, { timeout: 15000 });
    check(true, `?probar=${id} entra directo`);
    await page.waitForTimeout(1700);
    check(!(await G(page, () => { try { return localStorage.getItem('margoush3d_checkpoint'); } catch (_) { return null; } })), `?probar=${id} no deja «continuar»`);
  }
  check(errors.length === 0, 'sin errores de consola ' + JSON.stringify(errors));
} finally {
  await browser.close();
}
