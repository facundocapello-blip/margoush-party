import { launch, open, startRun, check, shot } from './harness.mjs';

const { browser, page, errors } = await launch({ viewport: { width: 844, height: 390 } });
try {
  await open(page);
  await startRun(page, 'douge');
  const x0 = await page.evaluate(() => window.__game.hero.actor.position.x);
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(2000);
  const mid = await page.evaluate(() => ({ x: window.__game.hero.actor.position.x, f: window.__game.hero.actor.facing }));
  check(mid.x - x0 > 5, `el héroe avanza más de 5 m en 2 s (avanzó ${(mid.x - x0).toFixed(1)})`);
  check(mid.f === 1, 'mira a la derecha al ir a la derecha');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(500);
  await page.keyboard.up('ArrowRight');
  const sc = await page.evaluate(() => window.__game.heroScreen());
  check(sc.x > 0 && sc.x < 1 && sc.y > 0 && sc.y < 1, `el héroe sigue en pantalla al girar (${sc.x.toFixed(2)}, ${sc.y.toFixed(2)})`);
  await page.setViewportSize({ width: 844, height: 390 });
  await page.keyboard.down('ArrowLeft');
  await page.waitForTimeout(600);
  await page.keyboard.up('ArrowLeft');
  check(await page.evaluate(() => window.__game.hero.actor.facing) === -1, 'mira a la izquierda al ir a la izquierda');
  await page.waitForTimeout(400);
  await shot(page, 'walk');
  check(errors.length === 0, 'sin errores de consola ' + JSON.stringify(errors));
} finally {
  await browser.close();
}
