// MINI NIVEL «¡ROMPÉ EL BYD!»: después de la persecución (Nivel 1). Golpes reales con el teclado,
// la batería se carga sola, pegarle a Cepi lo desenchufa, si se carga se pierde un corazón y se reintenta,
// y al romperlo sigue la calle de Buenos Aires. Celu parado y acostado.
import { launch, open, startRun, check, shot } from './harness.mjs';

for (const [name, vp] of [['vertical', { width: 390, height: 844 }], ['horizontal', { width: 844, height: 390 }]]) {
  const { browser, page, errors } = await launch({ viewport: vp, mobile: true });
  try {
    await open(page);
    const g = (fn, arg) => page.evaluate(fn, arg);
    await startRun(page, name === 'vertical' ? 'douge' : 'marine');
    await g(() => window.__game.startBydLevel());
    await page.waitForFunction(() => window.__game.state === 'bonus', null, { timeout: 20000 });
    check(await g(() => window.__game.checkpoint?.id === 'byd'), `${name}: el mini nivel guarda checkpoint`);
    await page.waitForFunction(() => window.__game.bonus.state?.phase === 'play', null, { timeout: 10000 });
    await page.waitForFunction(() => window.__game.bonus.state.bat > 3, null, { timeout: 15000 });
    check(true, `${name}: la batería del BYD se va cargando sola`);
    check(await g(() => /⚡\d+%/.test(document.querySelector('#bonus-ui .bonus-clock b').textContent)), `${name}: se ve el % de carga`);
    await shot(page, `bonus-${name}`);
    const before = await g(() => ({ hp: window.__game.bonus.state.hp, score: window.__game.score.total }));
    for (let i = 0; i < 8; i++) { await page.keyboard.press('KeyJ'); await page.waitForTimeout(180); }
    const after = await g(() => ({ hp: window.__game.bonus.state.hp, score: window.__game.score.total }));
    check(after.hp < before.hp, `${name}: las trompadas le bajan la vida al auto (${before.hp} → ${after.hp})`);
    check(after.score > before.score, `${name}: cada golpe suma puntos`);
    // ir hasta Cepi y pegarle: se desenchufa
    await page.keyboard.down('ArrowRight');
    await page.waitForFunction(() => { const s = window.__game.bonus.state; return Math.abs(s.x - s.cepiX) < 0.5; }, null, { timeout: 8000 }).catch(() => {});
    await page.keyboard.up('ArrowRight');
    await page.keyboard.press('KeyJ');
    await page.waitForFunction(() => window.__game.bonus.state.cepiStun > 0, null, { timeout: 3000 }).catch(() => {});
    check(await g(() => window.__game.bonus.state.cepiStun > 0), `${name}: pegarle a Cepi lo desenchufa`);
    await shot(page, `bonus-${name}-cepi`);
    // pausa
    await page.keyboard.press('Escape'); await page.waitForTimeout(200);
    check(await g(() => window.__game.state === 'paused'), `${name}: se puede pausar`);
    await page.tap('#btn-resume'); await page.waitForTimeout(200);
    check(await g(() => window.__game.state === 'bonus'), `${name}: SEGUIR vuelve al mini nivel`);
    // dejar que se cargue: se pierde un corazón y se reintenta
    const hp0 = await g(() => window.__game.hero.hp);
    await g(() => { window.__game.timeScale = 4; });
    await page.waitForFunction(() => window.__game.bonus.state?.charged, null, { timeout: 30000 });
    await page.waitForFunction(() => window.__game.state === 'bonus' && window.__game.bonus.state?.bat < 5 && !window.__game.bonus.state.over, null, { timeout: 20000 });
    await g(() => { window.__game.timeScale = 1; });
    check(await g(() => window.__game.hero.hp) === hp0 - 1, `${name}: si se carga, perdés un corazón y se vuelve a intentar`);
    // romperlo del todo
    await g(() => { const B = window.__game.bonus; for (let i = 0; i < 80 && !B.logic.state.over; i++) B.logic.punch({ x: 99, dmg: 2, spotX: () => 0 }); });
    await page.waitForFunction(() => window.__game.state === 'playing', null, { timeout: 20000 }).catch(() => {});
    const st = await g(() => ({ state: window.__game.state, level: window.__game.level, x: window.__game.hero.actor.position.x, bonus: window.__game.bonus.active }));
    check(st.level === 1 && st.state === 'playing' && !st.bonus && st.x < 8, `${name}: después sigue la calle de Buenos Aires desde el principio (${JSON.stringify(st)})`);
    check(errors.length === 0, `${name}: sin errores ` + errors.join(' | '));
  } finally {
    await browser.close();
  }
}
