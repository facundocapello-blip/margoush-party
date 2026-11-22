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
  await G(page, () => window.dispatchEvent(new Event('blur')));
  check(await G(page, () => window.__game.state === 'arena'), 'perder foco con la página visible permite seguir jugando');
  // fase 2: clase de baile — Chaky muestra los pasos, después tu turno
  await G(page, () => window.__game.arena.logic._setHp(21));
  await page.waitForFunction(() => document.querySelector('.phase-card')?.classList.contains('on'), null, { timeout: 8000 });
  check((await G(page, () => document.querySelector('.phase-card').textContent)).includes('BAILE'), 'cartel de fase 2: clase de baile');
  await shot(page, 'chaky-f2-cartel');
  await page.waitForFunction(() => window.__game.arena.logic.state.mode === 'dice', null, { timeout: 20000 });
  await page.waitForTimeout(400);
  check(await G(page, () => !document.querySelector('.piu').classList.contains('hidden') && getComputedStyle(document.getElementById('touch')).display === 'none'), 'aparecen los 5 carriles y se van los botones de pelea');
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
    check(fits, 'HUD, personajes y pista con espacio propio en ' + viewport.width + '×' + viewport.height);
  }
  // jugar la ronda tocando cada carril cuando la flecha llega (teclas Z Q S E C)
  const KEYS = ['KeyZ', 'KeyQ', 'KeyS', 'KeyE', 'KeyC'];
  const hp0 = await G(page, () => window.__game.arena.logic.state.hp);
  let shotDone = false;
  for (let k = 0; k < 400; k++) {
    const st = await G(page, () => { const d = window.__game.arena.logic.state.dice; if (!d || d.stage !== 'play') return null; const n = d.notes.find(n => !n.judged); return n && { dt: n.time - d.t, lane: n.lane }; });
    if (!st) break;
    if (!shotDone && st.dt < 0.9) { await shot(page, 'chaky-f2-flechas'); shotDone = true; }
    if (st.dt < 0.06) await page.keyboard.press(KEYS[st.lane]);
    else await page.waitForTimeout(15);
  }
  await page.waitForFunction(() => window.__game.arena.logic.state.dice?.stage === 'result', null, { timeout: 8000 });
  const res = await G(page, () => { const d = window.__game.arena.logic.state.dice; return d.hits + '/' + d.notes.length; });
  check(await G(page, () => window.__game.arena.logic.state.dice.last === 'ok'), 'siguiendo las flechas se gana la ronda ' + res);
  check((await G(page, () => window.__game.arena.logic.state.hp)) < hp0, 'y lo lastima');
  await shot(page, 'chaky-f2-acierto');
  // fase 3: enojado (manotazo)
  await page.waitForFunction(() => window.__game.arena.state.phase === 3 && window.__game.arena.state.mode !== 'transition', null, { timeout: 60000 });
  check(await G(page, () => document.querySelector('.chaky-sign').classList.contains('hidden')), 'fase 3: el cartel se va');
  check((await G(page, () => document.querySelector('#boss-bar span').textContent)).includes('3/3'), 'la barra muestra la fase');
  await page.waitForFunction(() => window.__game.arena.state.hand.state !== 'none', null, { timeout: 30000 });
  await shot(page, 'chaky-f3-mano');
  check(errors.length === 0, 'sin errores de consola ' + JSON.stringify(errors));
} finally {
  await browser.close();
}
