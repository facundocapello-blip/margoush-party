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
  // fase 2: clase de baile — Chaky muestra los pasos, después tu turno
  await G(page, () => window.__game.arena.logic._setHp(21));
  await page.waitForFunction(() => document.querySelector('.phase-card')?.classList.contains('on'), null, { timeout: 8000 });
  check((await G(page, () => document.querySelector('.phase-card').textContent)).includes('BAILE'), 'cartel de fase 2: clase de baile');
  await shot(page, 'chaky-f2-cartel');
  await page.waitForFunction(() => window.__game.arena.logic.state.dice?.stage === 'demo' && window.__game.arena.logic.state.dice.beat >= 0, null, { timeout: 20000 });
  check(await G(page, () => !document.querySelector('.chaky-sign').classList.contains('hidden')), 'Chaky muestra el paso en el cartel');
  await shot(page, 'chaky-f2-demo');
  await page.waitForFunction(() => window.__game.arena.logic.state.dice?.stage === 'turn', null, { timeout: 20000 });
  check((await G(page, () => document.querySelector('.chaky-sign').textContent)).includes('TU TURNO'), '¡TU TURNO! con la fila de pasos');
  check(await G(page, () => !!document.querySelector('#touch .act.want')), 'la primera ronda marca el botón');
  await shot(page, 'chaky-f2-turno');
  const hp0 = await G(page, () => window.__game.arena.logic.state.hp);
  const keys = { jump: 'Space', attack: 'KeyJ', dodge: 'KeyK' };
  for (let k = 0; k < 6; k++) {
    const d = await G(page, () => { const d = window.__game.arena.logic.state.dice; return d && { stage: d.stage, m: d.seq[d.idx] }; });
    if (!d || d.stage !== 'turn') break;
    await page.keyboard.press(keys[d.m]); await page.waitForTimeout(450);
  }
  await page.waitForFunction(() => window.__game.arena.logic.state.dice?.stage === 'result', null, { timeout: 5000 });
  check(await G(page, () => window.__game.arena.logic.state.dice.last === 'ok'), 'repetir los pasos cuenta');
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
