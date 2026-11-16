import { launch, open, startRun, check, shot } from './harness.mjs';

const { browser, page, errors } = await launch({ viewport: { width: 960, height: 540 } });
const G = (fn, arg) => page.evaluate(fn, arg);
const hold = async (key, ms) => { await page.keyboard.down(key); await page.waitForTimeout(ms); await page.keyboard.up(key); };
// Mide cuánto avanza el héroe corriendo a la derecha
const run = async (ms = 700) => { const a = await G(() => window.__game.hero.actor.position.x); await hold('ArrowRight', ms); return (await G(() => window.__game.hero.actor.position.x)) - a; };
// Zona tranquila para medir: Francia con todo despejado y sin trampas sueltas
const quiet = (x = 170) => G((x) => { const g = window.__game; g.setStage('francia-quiet'); g.traps?.disable?.(); g.enemies.clear(); g.hero.hp = g.hero.hpMax = 99; g.hero.actor.position.set(x, 0, 0); }, x);
const ONLY = process.argv[2];
try {
  await open(page);
  await startRun(page, 'douge');

  // ---------- Ganchos del héroe ----------
  if (!ONLY || ONLY === 'hero') {
    await quiet();
    const normal = await run();
    await quiet();
    await G(() => window.__game.hero.slow(2));
    const slowed = await run();
    check(slowed < normal * 0.65 && slowed > normal * 0.3, `lento corre la mitad (${slowed.toFixed(2)} m vs ${normal.toFixed(2)} m)`);

    await quiet();
    await G(() => { const g = window.__game; const e = g.enemies.spawn(171.3, 0, 'secuaz'); e.hp = 99; e.stun = 99; g.hero.stun(1.6); });
    const hp0 = await G(() => window.__game.enemies.list[0].hp);
    for (let i = 0; i < 4; i++) { await page.keyboard.press('KeyJ'); await page.waitForTimeout(80); }
    check(await G(() => window.__game.enemies.list[0].hp) === hp0, 'aturdido no puede pegar');
    const stunMove = await run(400); const st = await G(() => window.__game.hero.stunT); check(stunMove < 0.2, `aturdido no puede caminar (${stunMove.toFixed(2)} m, quedaba ${st.toFixed(2)} s)`);
    await page.waitForTimeout(1200);
    check(await run(400) > 1, 'al pasar el aturdimiento vuelve a moverse');

    await quiet();
    const before = await G(() => ({ x: window.__game.hero.actor.position.x, z: window.__game.hero.actor.position.z, hp: window.__game.hero.hp }));
    await G(() => window.__game.hero.push(-9, 4));
    await page.waitForTimeout(500);
    const after = await G(() => ({ x: window.__game.hero.actor.position.x, z: window.__game.hero.actor.position.z, hp: window.__game.hero.hp }));
    check(after.x < before.x - 0.6 && after.z > before.z + 0.3 && after.hp === before.hp, `un empujón lo mueve sin dañarlo (Δx ${(after.x - before.x).toFixed(2)}, Δz ${(after.z - before.z).toFixed(2)})`);
  }

  check(errors.length === 0, 'sin errores de consola ' + JSON.stringify(errors));
} finally {
  await browser.close();
}
