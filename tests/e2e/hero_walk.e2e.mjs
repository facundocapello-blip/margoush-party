// Caminata de Douge (10 cuadros de un video) y de Marine (8 cuadros hechos en Flow a partir de su dibujo): despacio camina, rápido corre, y cruza la frontera caminando.
import { launch, open, startRun, check } from './harness.mjs';

for (const who of ['douge', 'marine']) {
const { browser, page, errors } = await launch({ viewport: { width: 844, height: 390 }, mobile: true });
try {
  await open(page);
  await startRun(page, who);
  const g = (fn) => page.evaluate(fn);
  check(await g(() => !!window.__game.hero.actor.poses.walk), who + ' tiene caminata');
  await g(() => { const G = window.__game; G.setStage('francia-quiet'); G.enemies.clear(); Object.defineProperty(G.input, 'moveX', { get: () => 0.5, configurable: true }); });
  await page.waitForTimeout(500);
  const slow = await g(() => ({ pose: window.__game.hero.actor.pose, f: window.__game.hero.actor.frame }));
  await page.waitForTimeout(250);
  const f2 = await g(() => window.__game.hero.actor.frame);
  check(slow.pose === 'walk', `joystick a medias: camina (${slow.pose})`);
  check(f2 !== slow.f, 'la caminata se anima');
  await g(() => Object.defineProperty(window.__game.input, 'moveX', { get: () => 1, configurable: true }));
  await page.waitForTimeout(300);
  check(await g(() => window.__game.hero.actor.pose) === 'run', 'a fondo: corre');
  check(errors.length === 0, 'sin errores ' + errors.join(' | '));
} finally {
  await browser.close();
}
}
