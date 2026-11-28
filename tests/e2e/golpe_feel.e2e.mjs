// Prueba "como el usuario": pelea con varios malos a la vez en Chrome de escritorio y en emulación de iPhone 15 Pro Max
// (430×932, táctil). Mide los cortes del cuadro (lag), el tiempo congelado, errores de consola y guarda capturas.
// Mismo Chromium en ambos: NO reemplaza la prueba en Safari físico.
import { launch, open, startRun, check, shot } from './harness.mjs';

const PERFILES = [
  { name: 'chrome', opts: { viewport: { width: 1280, height: 720 } }, touch: false },
  { name: 'celu', opts: { viewport: { width: 430, height: 932 }, mobile: true }, touch: true }
];
for (const P of PERFILES) {
  console.log('== ' + P.name);
  const { browser, page, errors } = await launch(P.opts);
  try {
    await open(page);
    await startRun(page, 'douge');
    await page.evaluate(() => {
      const g = window.__game, p = g.hero.actor.position;
      g.hero.hp = g.hero.hpMax = 99; // que no muera durante la prueba
      for (let i = 0; i < 5; i++) g.enemies.spawn(p.x + 1.2 + i * 0.35, (i - 2) * 0.5, 'secuaz');
      const s = window.__feel = { gaps: [], last: performance.now(), frozen: 0, frames: 0 };
      const tick = (t) => { s.gaps.push(t - s.last); s.last = t; s.frames++; requestAnimationFrame(tick); };
      requestAnimationFrame(tick);
      const f0 = g.fx?.frozen;
    });
    const t0 = Date.now();
    while (Date.now() - t0 < 6000) {
      if (P.touch) {
        const b = await page.locator('#act-attack').boundingBox();
        if (b) await page.touchscreen.tap(b.x + b.width / 2, b.y + b.height / 2);
      } else await page.keyboard.press('KeyJ');
      await page.waitForTimeout(140);
      if ((Date.now() - t0) % 2000 < 160) await page.evaluate(() => { const g = window.__game, p = g.hero.actor.position; if (g.enemies.alive() < 3) for (let i = 0; i < 3; i++) g.enemies.spawn(p.x + 1.2 + i * 0.4, (i - 1) * 0.5, 'secuaz'); });
    }
    const r = await page.evaluate(() => { const s = window.__feel, g = s.gaps.slice(5).sort((a, b) => a - b); const n = g.length;
      return { frames: s.frames, avg: g.reduce((a, b) => a + b, 0) / n, p95: g[Math.floor(n * 0.95)], max: g[n - 1], over50: g.filter(x => x > 50).length, over100: g.filter(x => x > 100).length, kills: window.__game.stats?.kills ?? null, hits: window.__game.score?.hits ?? null }; });
    await shot(page, 'golpe_feel_' + P.name);
    console.log(`frames ${r.frames} · prom ${r.avg.toFixed(1)} ms · p95 ${r.p95.toFixed(1)} ms · máx ${r.max.toFixed(0)} ms · cortes >50ms: ${r.over50} · >100ms: ${r.over100}`);
    check(errors.length === 0, 'sin errores de consola en ' + P.name + ' ' + JSON.stringify(errors));
    // SwiftShader (GL por software) no mide un iPhone: acá solo se compara contra otra versión, no hay umbral absoluto
  } finally { await browser.close(); }
}
