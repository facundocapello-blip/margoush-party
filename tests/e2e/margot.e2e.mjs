// Margot presente: su carita del HUD cambia (contenta → llorando). BIG CHAKY ya no cruza al fondo
// al despejar un tramo (Facu lo pidió sacar: no tenía sentido).
import { launch, open, startRun, check, shot } from './harness.mjs';

const { browser, page, errors } = await launch({ viewport: { width: 390, height: 844 }, mobile: true });
try {
  await open(page);
  await startRun(page, 'douge');
  const g = (fn) => page.evaluate(fn);
  await page.waitForTimeout(300);
  check(await g(() => document.querySelector('#hud-margot').dataset.mood) === 'calm', 'Margot tranquila al empezar');
  check(await g(() => getComputedStyle(document.querySelector('#hud-margot')).backgroundImage.includes('margot_faces')), 'carita cargada');
  // Despejar un tramo de verdad: Margot contenta y nadie cruza al fondo
  await g(() => { const G = window.__game; G.hero.actor.position.x = 23; });
  await page.waitForFunction(() => window.__game.waves.vereda === 'active', null, { timeout: 8000 });
  await g(() => window.__game.enemies.list.forEach(e => { e.hp = 0; }));
  await page.waitForFunction(() => window.__game.waves.vereda === 'cleared', null, { timeout: 8000 });
  check(await g(() => document.querySelector('#hud-margot').dataset.mood) === 'happy', 'contenta al despejar');
  await page.waitForTimeout(1500);
  check(!(await g(() => window.__game.margot.crossing)), 'BIG CHAKY no cruza al fondo');
  await g(() => { const h = window.__game.hero; h.hp = 1; });
  await page.waitForTimeout(2500);
  check(await g(() => document.querySelector('#hud-margot').dataset.mood) === 'cry', 'llora si te queda 1 corazón');
  await shot(page, 'margot_hud');
  check(errors.length === 0, 'sin errores ' + errors.join(' | '));
} finally {
  await browser.close();
}
