// Arena de BIG CHAKY: pelea en escena propia, barril devuelto, mano atascada, ko → rescate; y perder.
import { launch, open, startRun, check, shot } from './harness.mjs';

const G = (page, fn, arg) => page.evaluate(fn, arg);

for (const [hero, vp, mobile] of [['douge', { width: 960, height: 540 }, false], ['marine', { width: 844, height: 390 }, true]]) {
  const { browser, page, errors } = await launch({ viewport: vp, mobile });
  try {
    await open(page);
    await startRun(page, hero);
    await G(page, () => window.__game.setStage('galpon'));
    await page.waitForFunction(() => window.__game.state === 'arena', null, { timeout: 5000 });
    check(true, `${hero}: el galpón abre la arena`);
    await G(page, () => { const h = window.__game.hero; h.hp = h.hpMax = 99; });
    const b = await G(page, () => window.__game.arena.state.screen);
    check(!!b, `${hero}: hay cajas de pantalla para el jefe y el héroe`);
    await page.waitForFunction(() => window.__game.arena.state.shots.length > 0, null, { timeout: 20000 });
    await shot(page, `arena-${hero}`);
    check(true, `${hero}: BIG CHAKY tira cosas`);
    // fase 2 → mano: se espera por estado
    await G(page, () => window.__game.arena.logic._setHp(11));
    await page.waitForFunction(() => window.__game.arena.state.hand.state !== 'none', null, { timeout: 30000 });
    await shot(page, `arena-hand-${hero}`);
    check(true, `${hero}: en fase 2 aparece la mano`);
    const before = await G(page, () => window.__game.score.total);
    await G(page, () => window.__game.arena.logic._setHp(0));
    await page.waitForFunction(() => window.__game.state === 'rescue', null, { timeout: 20000 });
    check(await G(page, () => window.__game.score.total) - before >= 2000, `${hero}: ganar da 2000 y sigue el rescate`);
    check(!(await G(page, () => window.__game.arena.active)), `${hero}: la arena se liberó`);
    // Perder: vida 0 en la arena → resultado sin ganar
    await startRun(page, hero);
    await G(page, () => window.__game.setStage('galpon'));
    await page.waitForFunction(() => window.__game.state === 'arena', null, { timeout: 5000 });
    await G(page, () => { window.__game.hero.hp = 0; });
    await page.waitForFunction(() => window.__game.state === 'result', null, { timeout: 20000 });
    check(await G(page, () => window.__game.lastResult.won === false && !window.__game.arena.active), `${hero}: si caés, termina el juego y la arena se libera`);
    check(errors.length === 0, `${hero}: sin errores de consola ` + JSON.stringify(errors));
  } finally {
    await browser.close();
  }
}
