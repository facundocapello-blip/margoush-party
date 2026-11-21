// BIG CHAKY: las 3 fases en el celular vertical — barriles con trayectorias, «Chaky dice» con el cartel, y enojado.
import { launch, open, startRun, check, shot } from './harness.mjs';

const G = (page, fn, arg) => page.evaluate(fn, arg);
const { browser, page, errors } = await launch({ viewport: { width: 430, height: 932 }, mobile: true });
try {
  await open(page);
  await startRun(page, 'douge');
  await G(page, () => window.__game.setStage('galpon'));
  await page.waitForFunction(() => window.__game.state === 'arena', null, { timeout: 5000 });
  await G(page, () => { const h = window.__game.hero; h.hp = h.hpMax = 99; });
  // fase 1: aparece un barril en curva con su aviso en el piso
  await page.waitForFunction(() => window.__game.arena.state.shots.some(s => s.type === 'curve' && s.z > -10), null, { timeout: 30000 });
  await shot(page, 'chaky-f1-curva');
  check((await G(page, () => window.__game.arena.state.phase)) === 1, 'fase 1: barriles');
  // fase 2: «Chaky dice»
  await G(page, () => window.__game.arena.logic._setHp(21));
  await page.waitForFunction(() => window.__game.arena.state.dice?.stage === 'window', null, { timeout: 20000 });
  const sign = await G(page, () => { const e = document.querySelector('.chaky-sign'); const r = e.getBoundingClientRect(); return { vis: !e.classList.contains('hidden'), txt: e.textContent, top: r.top, bottom: r.bottom, left: r.left, right: r.right }; });
  check(sign.vis && sign.txt.length > 1, 'fase 2: el cartel se ve: ' + sign.txt);
  check(sign.top >= 0 && sign.left >= 0 && sign.right <= 430, 'el cartel entra en la pantalla ' + JSON.stringify(sign));
  await shot(page, 'chaky-f2-cartel');
  const hp0 = await G(page, () => window.__game.arena.logic.state.hp);
  const cmd = await G(page, () => window.__game.arena.state.dice.cmd);
  if (cmd !== 'still') await G(page, (c) => window.__game.arena.logic.act(c), cmd);
  await page.waitForFunction(() => window.__game.arena.state.dice?.stage === 'result', null, { timeout: 5000 });
  check(await G(page, () => window.__game.arena.state.dice.last === 'ok'), 'acertar el cartel cuenta');
  check((await G(page, () => window.__game.arena.logic.state.hp)) < hp0, 'y lo lastima');
  await shot(page, 'chaky-f2-acierto');
  // fase 3: enojado (manotazo)
  await G(page, () => window.__game.arena.logic._setHp(11));
  await page.waitForFunction(() => window.__game.arena.state.phase === 3 && window.__game.arena.state.mode !== 'transition', null, { timeout: 10000 });
  check(await G(page, () => document.querySelector('.chaky-sign').classList.contains('hidden')), 'fase 3: el cartel se va');
  check((await G(page, () => document.querySelector('#boss-bar span').textContent)).includes('3/3'), 'la barra muestra la fase');
  await page.waitForFunction(() => window.__game.arena.state.hand.state !== 'none', null, { timeout: 30000 });
  await shot(page, 'chaky-f3-mano');
  check(errors.length === 0, 'sin errores de consola ' + JSON.stringify(errors));
} finally {
  await browser.close();
}
