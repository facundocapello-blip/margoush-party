import { launch, open, startRun, check, shot } from './harness.mjs';

const { browser, page, errors } = await launch({ viewport: { width: 960, height: 540 } });
const G = (fn, arg) => page.evaluate(fn, arg);
try {
  await open(page);
  // Intro real desde el menú, salteable con un toque
  await page.click('#btn-play');
  await page.click('#pick-marine');
  await page.waitForTimeout(1200);
  check(await G(() => window.__game.state) === 'intro', 'arranca con la intro de BIG CHAKY');
  await shot(page, 'intro');
  const t0 = Date.now();
  await page.mouse.click(480, 300);
  await page.waitForFunction(() => window.__game.state === 'playing', null, { timeout: 2000 });
  check(Date.now() - t0 < 1000, `un toque saltea la intro (${Date.now() - t0} ms)`);

  // Jefe: la pelea es en la arena (escena propia)
  await G(() => window.__game.setStage('galpon'));
  await page.waitForFunction(() => window.__game.state === 'arena' && window.__game.arena.active, null, { timeout: 5000 });
  check(await G(() => window.__game.arena.logic.state.hp === 30 && window.__game.arena.logic.state.hpMax === 30), 'en el galpón arranca la arena con BIG CHAKY y 30 de vida');
  await G(() => { const h = window.__game.hero; h.hp = h.hpMax = 99; });
  await page.waitForTimeout(1500);
  await shot(page, 'boss');
  await G(() => window.__game.arena.logic._setHp(14));
  await page.waitForTimeout(300);
  check(await G(() => window.__game.arena.state.phase) === 2, 'a la mitad de vida pasa a la fase 2');
  const before = await G(() => window.__game.score.total);
  await G(() => window.__game.arena.logic._setHp(0));
  // GPU por software: se espera por estado, no por tiempo
  await page.waitForFunction(() => window.__game.state === 'rescue', null, { timeout: 15000 });
  check(await G(() => window.__game.score.total) - before >= 2000, 'derrotarlo da 2000 puntos');
  check(true, 'arranca el rescate');
  await page.waitForTimeout(1200);
  await shot(page, 'rescue');
  await page.waitForFunction(() => window.__game.story.rescue?.picked, null, { timeout: 6000 });
  check(true, 'el héroe llega a la jaula y alza a Margot');
  await page.waitForFunction(() => window.__game.story.rescue?.said >= 3, null, { timeout: 8000 });
  check(true, 'la banda llega a aplaudir');
  await shot(page, 'rescue-crew');
  await page.waitForFunction(() => window.__game.state === 'result', null, { timeout: 8000 });
  check(await G(() => (window.__game.lastResult.photo || '').startsWith('data:image/jpeg')), 'se saca la foto familiar');
  check(await G(() => !!document.querySelector('#result-photo') && !!document.querySelector('#btn-photo')), 'la foto aparece en el resultado con «Guardar la foto»');
  await shot(page, 'rescue-result');
  check(await G(() => window.__game.lastResult.won === true), 'termina en la pantalla de resultado ganando');
  check(errors.length === 0, 'sin errores de consola ' + JSON.stringify(errors));
} finally {
  await browser.close();
}
