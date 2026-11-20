// Checkpoints: al morir se reintenta desde el último tramo (no desde Buenos Aires), el menú ofrece CONTINUAR
// y la pausa pide confirmación antes de reintentar o salir.
import { launch, open, startRun, check, shot } from './harness.mjs';

const { browser, page, errors } = await launch({ viewport: { width: 390, height: 844 }, mobile: true });
try {
  await open(page);
  const g = (fn, arg) => page.evaluate(fn, arg);
  const vis = (sel) => g((s) => { const e = document.querySelector(s); return !!e && !e.closest('.hidden') && !e.classList.contains('hidden'); }, sel);

  // Sin checkpoint guardado no aparece CONTINUAR
  check(!(await vis('#btn-continue')), 'sin partida guardada no hay CONTINUAR');

  // Selección de héroe: se puede volver
  await page.tap('#btn-play'); await page.waitForTimeout(300);
  check(await vis('#btn-select-back'), 'la selección tiene botón Volver');
  await page.tap('#btn-select-back'); await page.waitForTimeout(200);
  check(await vis('#btn-play'), 'Volver lleva al menú');
  check(!(await page.textContent('#pick-marine')).includes('Flamb'), 'Marine: sin Flambé');

  // Llegar al nivel 2 por la frontera guarda el checkpoint
  await startRun(page, 'marine');
  await g(() => { const G = window.__game; G.setStage('le-concept'); G.enemies.clear(); G.waves['le-concept'] = 'cleared'; G.levelExit = true; G.hero.actor.position.x = 144; G.score.addFlat(1234); });
  await page.waitForFunction(() => window.__game.checkpoint?.id === 'francia', null, { timeout: 20000 });
  check((await g(() => window.__game.storedCheckpoint()))?.id === 'francia', 'el checkpoint de Francia queda guardado en el celu');

  // Morir en Francia: el resultado ofrece reintentar desde Francia
  await page.waitForFunction(() => window.__game.state === 'playing', null, { timeout: 10000 });
  await g(() => { const G = window.__game; G.hero.hp = 0; G.onHeroDown(); });
  await page.waitForSelector('#btn-retry', { timeout: 5000 });
  check((await page.textContent('#btn-retry')).includes('Francia'), 'al morir aparece «Reintentar: Francia»');
  check((await page.textContent('#btn-again')).includes('cero'), 'la otra opción es «Empezar de cero»');
  await shot(page, 'checkpoint_result');
  await page.tap('#btn-retry');
  await page.waitForFunction(() => window.__game.state === 'playing', null, { timeout: 10000 });
  const at = await g(() => ({ lvl: window.__game.level, x: window.__game.hero.actor.position.x, hp: window.__game.hero.hp, max: window.__game.hero.hpMax, score: window.__game.score.total, hero: window.__game.heroId }));
  check(at.lvl === 2 && at.x >= 152, `reintenta en el nivel 2 (x=${at.x.toFixed(1)})`);
  check(at.hp === at.max, 'vuelve con la vida llena');
  check(at.score >= 1234 && at.hero === 'marine', `conserva el puntaje (${at.score}) y la heroína`);

  // Pausa: reintentar pide confirmación; «No» vuelve a jugar
  await page.tap('#btn-pause'); await page.waitForTimeout(200);
  check((await page.textContent('#btn-restart')).includes('Francia'), 'la pausa ofrece reintentar desde Francia');
  await page.tap('#btn-restart'); await page.waitForTimeout(150);
  check(await vis('#pause-confirm'), 'reintentar pide confirmación');
  await page.tap('#btn-confirm-no'); await page.waitForTimeout(200);
  check(await g(() => window.__game.state === 'playing'), '«No, seguir jugando» vuelve al juego');

  // Salir al menú (con confirmación) y CONTINUAR
  await page.tap('#btn-pause'); await page.waitForTimeout(200);
  await page.tap('#btn-home'); await page.waitForTimeout(150);
  check((await page.textContent('#pause-confirm-text')).includes('CONTINUAR'), 'salir avisa que se puede continuar');
  await page.tap('#btn-confirm-yes'); await page.waitForTimeout(400);
  check(await g(() => window.__game.state === 'menu'), 'sale al menú');
  check(await vis('#btn-continue'), 'el menú muestra CONTINUAR');
  check(/marine/i.test(await page.textContent('#btn-continue')), 'CONTINUAR dice con quién');
  await shot(page, 'checkpoint_menu');
  await page.tap('#btn-continue');
  await page.waitForFunction(() => window.__game.state === 'playing', null, { timeout: 10000 });
  check(await g(() => window.__game.level === 2), 'CONTINUAR arranca en Francia');

  // Checkpoint de BIG CHAKY: morir en la arena vuelve a la arena
  await g(() => window.__game.resumeAt({ id: 'boss', heroId: 'douge', score: 5000, time: 100 }));
  await page.waitForFunction(() => window.__game.state === 'arena', null, { timeout: 15000 });
  await g(() => { window.__game.hero.hp = 0; });
  await page.waitForSelector('#btn-retry', { timeout: 15000 });
  check((await page.textContent('#btn-retry')).includes('BIG CHAKY'), 'al caer con BIG CHAKY se reintenta la arena');
  await page.tap('#btn-retry');
  await page.waitForFunction(() => window.__game.state === 'arena', null, { timeout: 15000 });
  const ar = await g(() => { const s = window.__game.arena.state; return s && { hp: s.hp, phase: s.phase, max: s.hpMax, hero: window.__game.hero.hp, score: window.__game.score.total }; });
  console.log(ar);
  check(ar && ar.phase === 1 && ar.hero > 0, 'la arena arranca de nuevo con BIG CHAKY entero y el héroe con vida');

  // Empezar de cero borra el checkpoint
  await g(() => window.__game.quickStart('douge'));
  check(await g(() => !window.__game.storedCheckpoint()), 'empezar de cero borra el checkpoint');

  check(errors.length === 0, 'sin errores: ' + errors.join(' | '));
} finally {
  await browser.close();
}
