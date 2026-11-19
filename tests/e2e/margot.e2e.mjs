// Margot presente: al despejar un tramo BIG CHAKY cruza al fondo con ella, Margot llama a su papá/mamá
// y su carita del HUD cambia (contenta → llorando).
import { launch, open, startRun, check, shot } from './harness.mjs';

const { browser, page, errors } = await launch({ viewport: { width: 390, height: 844 }, mobile: true });
try {
  await open(page);
  await startRun(page, 'douge');
  const g = (fn) => page.evaluate(fn);
  await page.waitForTimeout(300);
  check(await g(() => document.querySelector('#hud-margot').dataset.mood) === 'calm', 'Margot tranquila al empezar');
  check(await g(() => getComputedStyle(document.querySelector('#hud-margot')).backgroundImage.includes('margot_faces')), 'carita cargada');
  await g(() => { const G = window.__game; G.margot.cheer(); G.margot.cross(); });
  await page.waitForTimeout(300);
  check(await g(() => window.__game.margot.crossing), 'BIG CHAKY cruza con Margot');
  check(await g(() => document.querySelector('#hud-margot').dataset.mood) === 'happy', 'contenta al despejar');
  await page.waitForFunction(() => [...document.querySelectorAll('#labels .pop')].some(p => p.textContent.includes('Papá')), null, { timeout: 15000 }).catch(() => {});
  const pops = await g(() => [...document.querySelectorAll('#labels .pop')].map(p => p.textContent).join(' | '));
  check(pops.includes('Papá'), 'Margot grita ¡Papááá!: ' + pops);
  check(await g(() => document.querySelector('#hud-margot').dataset.mood) === 'cry', 'llora al verla pasar');
  await shot(page, 'margot_cruce');
  await page.waitForFunction(() => !window.__game.margot.crossing, null, { timeout: 30000 }).catch(() => {});
  check(!(await g(() => window.__game.margot.crossing)), 'se va');
  check(errors.length === 0, 'sin errores ' + errors.join(' | '));
} finally {
  await browser.close();
}
