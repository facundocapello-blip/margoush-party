// Arena de BIG CHAKY: duelo de baile directo en escenario con ambos de frente, 3 vidas extra y KO → rescate.
import { launch, open, startRun, check, shot } from './harness.mjs';

const G = (page, fn, arg) => page.evaluate(fn, arg);

for (const [hero, vp, mobile] of [['douge', { width: 960, height: 540 }, false], ['marine', { width: 844, height: 390 }, true]]) {
  const { browser, page, errors } = await launch({ viewport: vp, mobile });
  try {
    await open(page);
    await startRun(page, hero);
    await G(page, () => window.__game.setStage('galpon'));
    await page.waitForFunction(() => window.__game.state === 'arena', null, { timeout: 5000 });
    check(true, `${hero}: el galpón abre directo el escenario de baile de BIG CHAKY`);

    const st = await G(page, () => window.__game.arena.state);
    check(!!st.screen && st.hero.facing === 'front' && st.lives === 3, `${hero}: ambos de frente en escenario y 3 vidas extra`);
    await shot(page, `arena-${hero}`);

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
    check(await G(page, () => window.__game.lastResult.won === false && !window.__game.arena.active), `${hero}: si caés sin vidas, termina el juego y la arena se libera`);
    check(errors.length === 0, `${hero}: sin errores de consola ` + JSON.stringify(errors));
  } finally {
    await browser.close();
  }
}
