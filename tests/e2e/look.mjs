// Capturas de la calle en varios puntos (para comparar antes/después del look)
import { launch, open } from './harness.mjs';
const tag = process.argv[2] || 'antes';
for (const [w, h, o] of [[390, 844, 'v'], [844, 390, 'h']]) {
  const { browser, page, errors } = await launch({ viewport: { width: w, height: h }, mobile: true });
  try {
    await open(page);
    if (process.argv[4] === 'fr') await page.evaluate(() => window.__game.resumeAt({ id: 'francia', heroId: 'douge', score: 0, time: 0 }));
    else await page.evaluate(() => window.__game.quickStart('douge'));
    await page.waitForFunction(() => window.__game.state === 'playing', null, { timeout: 15000 });
    for (const x of (process.argv[3] || '12,40,90,128,175,225').split(',').map(Number)) {
      await page.evaluate((x) => { const g = window.__game; g.enemies.list.forEach(e => { e.hp = 0; }); g.hero.inv = 99; g.hero.actor.position.set(x, 0, 0.5);
        g.ctx.world.setLevelBounds(1, 315); }, x);
      await page.waitForTimeout(1600);
      await page.screenshot({ path: `/home/claude/look/${tag}_${o}_${x}.png` });
    }
    if (errors.length) console.log(errors);
  } finally { await browser.close(); }
}
