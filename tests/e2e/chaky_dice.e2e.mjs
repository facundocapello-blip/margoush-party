// BIG CHAKY: duelo de baile directo en escenario con ambos de frente, flechas que bajan hacia los 5 botones y 3 vidas extra.
import { launch, open, startRun, check, shot } from './harness.mjs';

const G = (page, fn, arg) => page.evaluate(fn, arg);
const { browser, page, errors } = await launch({ viewport: { width: 430, height: 932 }, mobile: true });
try {
  await open(page);
  await startRun(page, 'douge');
  await G(page, () => window.__game.setStage('galpon'));
  await page.waitForFunction(() => window.__game.state === 'arena', null, { timeout: 5000 });
  check((await G(page, () => window.__game.arena.state.phase)) === 1, 'arranca directo en la ronda 1 del baile');
  check((await G(page, () => window.__game.arena.state.lives)) === 3, 'arranca con 3 vidas extra (⭐⭐⭐)');
  await G(page, () => window.dispatchEvent(new Event('blur')));
  check(await G(page, () => window.__game.state === 'arena'), 'perder foco con la página visible permite seguir jugando');
  check(await G(page, () => !document.querySelector('.piu').classList.contains('hidden') && getComputedStyle(document.getElementById('touch')).display === 'none'), 'aparecen los 5 carriles de entrada y se ocultan los botones de pelea');

  for (const viewport of [{ width: 430, height: 710 }, { width: 667, height: 320 }]) {
    await page.setViewportSize(viewport);
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const fits = await G(page, () => {
      const { boss, hero } = window.__game.arena.state.screen;
      const hud = document.querySelector('#hud').getBoundingClientRect();
      const deck = document.querySelector('.piu').getBoundingClientRect();
      const lane = document.querySelector('.lane').getBoundingClientRect();
      return hud.bottom < boss.top && hero.feet < deck.top && lane.width >= 44 && lane.height >= 44;
    });
    check(fits, 'HUD, personajes de frente y pista con espacio propio en ' + viewport.width + '×' + viewport.height);
  }

  // Jugar la ronda tocando cada carril cuando la flecha baja al botón inferior (teclas Z Q S E C)
  const KEYS = ['KeyZ', 'KeyQ', 'KeyS', 'KeyE', 'KeyC'];
  const hp0 = await G(page, () => window.__game.arena.logic.state.hp);
  let shotDone = false;
  for (let k = 0; k < 400; k++) {
    const st = await G(page, () => {
      const d = window.__game.arena.logic.state.dice;
      if (!d || d.stage !== 'play') return null;
      const n = d.notes.find(n => !n.judged);
      return n && { dt: n.time - d.t, lane: n.lane };
    });
    if (!st) break;
    if (!shotDone && st.dt < 0.7) { await shot(page, 'chaky-baile-flechas'); shotDone = true; }
    if (st.dt < 0.06) await page.keyboard.press(KEYS[st.lane]);
    else await page.waitForTimeout(15);
  }
  await page.waitForFunction(() => window.__game.arena.logic.state.dice?.stage === 'result', null, { timeout: 8000 });
  const res = await G(page, () => { const d = window.__game.arena.logic.state.dice; return d.hits + '/' + d.notes.length; });
  check(await G(page, () => window.__game.arena.logic.state.dice.last === 'ok'), 'siguiendo las flechas que bajan se gana la ronda ' + res);
  check((await G(page, () => window.__game.arena.logic.state.hp)) < hp0, 'y cada paso acertado lastima a Big Chaky');
  await shot(page, 'chaky-baile-acierto');
  check(errors.length === 0, 'sin errores de consola ' + JSON.stringify(errors));
} finally {
  await browser.close();
}
