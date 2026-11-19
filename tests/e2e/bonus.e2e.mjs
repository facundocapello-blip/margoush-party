// BONUS «¡ROMPÉ EL BYD!»: entre Buenos Aires y Francia; golpes reales con el teclado, el auto se rompe,
// al final sigue Francia (con checkpoint) y suma puntos. Celu parado y acostado.
import { launch, open, startRun, check, shot } from './harness.mjs';

for (const [name, vp] of [['vertical', { width: 390, height: 844 }], ['horizontal', { width: 844, height: 390 }]]) {
  const { browser, page, errors } = await launch({ viewport: vp, mobile: true });
  try {
    await open(page);
    const g = (fn, arg) => page.evaluate(fn, arg);
    await startRun(page, name === 'vertical' ? 'douge' : 'marine');
    await g(() => { const G = window.__game; G.setStage('le-concept'); G.enemies.clear(); G.waves['le-concept'] = 'cleared'; G.levelExit = true; G.hero.actor.position.x = 144; });
    await page.waitForFunction(() => window.__game.state === 'bonus', null, { timeout: 20000 });
    check(true, `${name}: al cruzar la frontera arranca el BONUS`);
    await page.waitForFunction(() => window.__game.bonus.state?.phase === 'play', null, { timeout: 10000 });
    await shot(page, `bonus-${name}`);
    const before = await g(() => ({ hp: window.__game.bonus.state.hp, score: window.__game.score.total }));
    for (let i = 0; i < 8; i++) { await page.keyboard.press('KeyJ'); await page.waitForTimeout(180); }
    const after = await g(() => ({ hp: window.__game.bonus.state.hp, score: window.__game.score.total }));
    check(after.hp < before.hp, `${name}: las trompadas le bajan la vida al auto (${before.hp} → ${after.hp})`);
    check(after.score > before.score, `${name}: cada golpe suma puntos`);
    // pausa en el bonus
    await page.keyboard.press('Escape'); await page.waitForTimeout(200);
    check(await g(() => window.__game.state === 'paused'), `${name}: el bonus se puede pausar`);
    await page.tap('#btn-resume'); await page.waitForTimeout(200);
    check(await g(() => window.__game.state === 'bonus'), `${name}: SEGUIR vuelve al bonus`);
    // romperlo del todo
    await g(() => { const B = window.__game.bonus; for (let i = 0; i < 80 && !B.logic.state.over; i++) B.logic.punch({ x: 99, dmg: 2, spotX: () => 0 }); });
    // (los golpes directos a la lógica no pasan por los efectos: se fuerza el final por el reloj del juego)
    await page.waitForFunction(() => window.__game.state === 'playing' && window.__game.level === 2, null, { timeout: 20000 }).catch(() => {});
    const st = await g(() => ({ state: window.__game.state, level: window.__game.level, cp: window.__game.checkpoint?.id, bonus: window.__game.bonus.active }));
    check(st.level === 2 && st.state === 'playing' && !st.bonus, `${name}: después del bonus sigue Francia (${JSON.stringify(st)})`);
    check(st.cp === 'francia', `${name}: y queda el checkpoint de Francia`);
    check(errors.length === 0, `${name}: sin errores ` + errors.join(' | '));
  } finally {
    await browser.close();
  }
}
