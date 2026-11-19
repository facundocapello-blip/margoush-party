import { launch, open, startRun, check, shot } from './harness.mjs';

const { browser, page, errors } = await launch({ viewport: { width: 960, height: 540 } });
const G = (fn, arg) => page.evaluate(fn, arg);
const waitFor = (fn, ms = 8000) => page.waitForFunction(fn, null, { timeout: ms });
try {
  await open(page);
  await startRun(page, 'douge');

  // Le Concept: un solo edificio, a mitad del recorrido
  const lc = await G(() => {
    const found = [];
    window.__game.ctx.scene.traverse(o => { if (o.userData.leConcept) found.push(o.position.x); });
    return found;
  });
  check(lc.length === 1, `Le Concept aparece una sola vez (${lc.length})`);
  check(lc[0] > 110 && lc[0] < 150, `Le Concept queda a mitad de camino (x=${lc[0]?.toFixed(1)})`);
  check(await G(() => window.__game.level) === 1, 'la partida arranca en el Nivel 1');

  // En el Nivel 1 no se puede pasar a Francia caminando
  await G(() => { const g = window.__game; g.setStage('le-concept'); g.enemies.list.forEach(e => { e.hp = 99; e.stun = 99; }); g.hero.actor.position.set(145, 0, 3); });
  await page.keyboard.down('ArrowRight'); await page.waitForTimeout(900); await page.keyboard.up('ArrowRight');
  const xN1 = await G(() => window.__game.hero.actor.position.x);
  check(xN1 <= 147, `en el Nivel 1 el héroe no cruza a Francia (x=${xN1.toFixed(1)})`);

  // Despejar la pelea de Le Concept termina el Nivel 1
  await G(() => { const g = window.__game; g.hero.hp = 2; g.hero.hpMax = 5; g.hero.actor.position.set(134, 0, 0); g.traps.forceNext('colectivo'); g.enemies.list.forEach(e => { e.hp = 0; }); });
  await page.waitForTimeout(1200);
  check(await G(() => window.__game.state) === 'playing' && await G(() => window.__game.levelExit), 'al despejar Le Concept todavía no cambia de nivel: hay que llegar al final');
  await G(() => window.__game.hero.actor.position.set(144, 0, 0));
  await waitFor(() => window.__game.state === 'transition', 4000);
  check(true, 'al llegar al final de la calle empieza la transición');
  check(await G(() => window.__game.world.border.open), 'se levanta la barrera de la frontera');
  const text = await page.textContent('#level-card');
  check(/NIVEL 1/.test(text) && /FRANCIA/i.test(text), `cartel de transición: "${text.replace(/\s+/g, ' ').trim()}"`);
  await shot(page, 'level-transition');
  const hurt = await G(() => { const g = window.__game; return g.hero.hurt(1, 0); });
  check(!hurt && await G(() => window.__game.hero.hp) === 2, 'durante la transición no se recibe daño');

  // En el medio está el BONUS «¡ROMPÉ EL BYD!» (su propia prueba: bonus.e2e): acá se rompe el auto de una
  await waitFor(() => window.__game.state === 'bonus', 9000);
  check(true, 'entre los dos niveles aparece el BONUS');
  await G(() => { const B = window.__game.bonus.logic; for (let i = 0; i < 80 && !B.state.over; i++) B.punch({ x: 99, dmg: 2, spotX: () => 0 }); });
  await waitFor(() => window.__game.state === 'playing' && window.__game.level === 2, 12000);
  const s2 = await G(() => ({ x: window.__game.hero.actor.position.x, hp: window.__game.hero.hp }));
  check(s2.x >= 152, `el Nivel 2 arranca en Francia (x=${s2.x.toFixed(1)})`);
  check(await G(() => window.__game.transCrossed), 'cruza caminando bajo el arco y entra con la cortina');
  check(s2.hp === 4, `la transición cura 2 corazones (hp ${s2.hp})`);
  check(await G(() => window.__game.traps.active.length) === 0, 'ninguna trampa de Buenos Aires pasa a Francia');

  // No se puede volver a Buenos Aires
  await page.keyboard.down('ArrowLeft'); await page.waitForTimeout(1500); await page.keyboard.up('ArrowLeft');
  const back = await G(() => window.__game.hero.actor.position.x);
  check(back >= 151.5, `no se puede volver al Nivel 1 (x=${back.toFixed(1)})`);
  await shot(page, 'level-francia');

  // Curar nunca pasa del máximo
  await G(() => { const g = window.__game; g.setStage('le-concept'); g.hero.hp = 5; g.enemies.list.forEach(e => { e.hp = 0; }); });
  await waitFor(() => window.__game.levelExit === true, 6000);
  await G(() => window.__game.hero.actor.position.set(144, 0, 0));
  await waitFor(() => window.__game.state === 'bonus', 9000);
  await G(() => { const B = window.__game.bonus.logic; for (let i = 0; i < 80 && !B.state.over; i++) B.punch({ x: 99, dmg: 2, spotX: () => 0 }); });
  await waitFor(() => window.__game.state === 'playing' && window.__game.level === 2, 12000);
  check(await G(() => window.__game.hero.hp) === 5, 'la cura no pasa del máximo');

  // Perder en el Nivel 2 guarda los puntos de los dos niveles, sin bonus
  const before = await G(() => { const g = window.__game; g.score.addKill('patovica'); return g.score.total; });
  await G(() => { const g = window.__game; g.hero.inv = 0; g.hero.hurt(99, 0); });
  await waitFor(() => window.__game.state === 'result', 4000);
  const r = await G(() => window.__game.lastResult);
  check(!r.won && r.total === before, `perder en Francia guarda ${before} puntos (guardó ${r.total})`);

  check(errors.length === 0, 'sin errores de consola ' + JSON.stringify(errors));
} finally {
  await browser.close();
}
