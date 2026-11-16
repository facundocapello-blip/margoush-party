import { launch, open, startRun, check, shot } from './harness.mjs';

const { browser, page, errors } = await launch({ viewport: { width: 960, height: 540 } });
const G = (fn, arg) => page.evaluate(fn, arg);
try {
  await open(page);
  await startRun(page, 'marine');
  check(await G(() => !!window.__game.facu && !!window.__game.facu.car), 'Facu va en su auto');

  // Va por el carril de atrás (arriba en pantalla), sin meterse en la pelea, y solo avanza
  await page.keyboard.down('ArrowRight');
  let minZ = 0, maxZ = -99, back = 0, prev = await G(() => window.__game.facu.car.position.x), gap = 0;
  for (let i = 0; i < 15; i++) {
    await page.waitForTimeout(200);
    const s = await G(() => ({ x: window.__game.facu.car.position.x, z: window.__game.facu.car.position.z, hx: window.__game.hero.actor.position.x }));
    maxZ = Math.max(maxZ, s.z); minZ = Math.min(minZ, s.z);
    back = Math.max(back, prev - s.x); prev = s.x;
    gap = Math.max(gap, Math.abs(s.x - s.hx));
  }
  await page.keyboard.up('ArrowRight');
  check(maxZ <= -3.9, `el auto va por el carril de atrás (z máx ${maxZ.toFixed(2)})`);
  check(back < 0.01, 'mientras el héroe avanza, el auto nunca retrocede');
  check(gap < 6, `el auto acompaña al héroe (distancia máx ${gap.toFixed(1)} m)`);
  // Facu se mueve en el auto: se inclina al acelerar y salta al contar el chiste
  const lean = await G(async () => {
    const g = window.__game; g.facu.park(g.hero.actor.position.x - 4);
    let m = 0; const t0 = performance.now();
    while (performance.now() - t0 < 700) { m = Math.max(m, Math.abs(g.facu.actor.lean)); await new Promise(r => setTimeout(r, 30)); }
    return m;
  });
  check(lean > 0.05, `Facu se inclina cuando el auto acelera (${lean.toFixed(3)})`);
  await shot(page, 'facu-car');

  // Facu ya no pelea cuerpo a cuerpo
  await G(() => { const g = window.__game; g.setStage('vereda'); g.hero.hp = g.hero.hpMax = 99; g.facu.jokeCd = 99; g.enemies.list.forEach(e => e.hp = 50); });
  const start = await G(() => window.__game.enemies.list.reduce((s, e) => s + e.hp, 0));
  await page.waitForTimeout(4000);
  check(await G(() => window.__game.enemies.list.reduce((s, e) => s + e.hp, 0)) === start, 'Facu no se mete a pegar');

  // El chiste desde el auto aturde a los que rodean al héroe
  await G(() => { const g = window.__game; g.facu.jokeCd = 0; g.facu.lastJokeStuns = 0;
    g.enemies.list.forEach((e, i) => { e.pos.set(g.hero.actor.position.x + 1.5 + i * 0.6, 0, 0.3 * i); }); });
  let stunned = 0;
  for (let i = 0; i < 20 && stunned < 2; i++) { await page.waitForTimeout(300); stunned = await G(() => window.__game.facu.lastJokeStuns); }
  check(stunned >= 2, `el chiste aturde a ${stunned} enemigos`);
  const hop = await G(async () => { let m = 0; const t0 = performance.now(); while (performance.now() - t0 < 600) { m = Math.max(m, window.__game.facu.actor.lift - window.__game.facu.car.position.y); await new Promise(r => setTimeout(r, 30)); } return m; });
  check(hop > 0.25, `Facu se para en el auto al contar el chiste (${hop.toFixed(2)} m)`);
  check(await G(() => window.__game.facu.lines.intro.startsWith('¡Buenas noches, Buenos Aires')), 'Facu sigue presentando la partida');

  // Salta los cajones del pasaje en vez de atravesarlos
  await G(() => { const g = window.__game; g.setStage('plaza-quiet'); g.hero.actor.position.set(g.world.secret.x - 5, 0, 0); g.facu.car.position.x = g.world.secret.x - 4; });
  await page.keyboard.down('ArrowRight');
  let maxLift = 0;
  for (let i = 0; i < 10; i++) { await page.waitForTimeout(150); maxLift = Math.max(maxLift, await G(() => window.__game.facu.car.position.y)); }
  await page.keyboard.up('ArrowRight');
  check(maxLift > 0.6, `el auto salta los cajones (altura ${maxLift.toFixed(2)} m)`);
  check(errors.length === 0, 'sin errores de consola ' + JSON.stringify(errors));
} finally {
  await browser.close();
}
