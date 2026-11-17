import { launch, open, check } from './harness.mjs';

const { browser, page, errors } = await launch({ viewport: { width: 390, height: 844 }, mobile: true });
const G = (fn, arg) => page.evaluate(fn, arg);
const visible = (sel) => G((s) => { const e = document.querySelector(s); const cs = getComputedStyle(e); return cs.display !== 'none' && cs.visibility !== 'hidden' && !e.classList.contains('hidden'); }, sel);
try {
  await open(page);
  // iOS solo habla si la voz se habilitó con un toque: se prepara al elegir héroe
  await G(() => { window.__spoken = 0; speechSynthesis.speak = () => { window.__spoken++; }; });
  await page.tap('#btn-play');
  await page.tap('#pick-marine');
  check(await G(() => window.__spoken) > 0, 'la voz queda habilitada con el toque de elegir héroe');
  await page.tap('#game');
  await page.waitForFunction(() => window.__game.state === 'playing');
  check(!(await G(() => document.querySelector('#rotate-hint'))), 'con el celu parado se juega directo (sin aviso de girar)');
  // En vertical: los personajes se ven grandes, el cartel y la barra del jefe no tapan los botones
  const hero = await G(() => { const g = window.__game, a = g.hero.actor; const top = a.position.clone(); top.y += a.heightM; const v = top.project(g.ctx.camera), b = a.position.clone().project(g.ctx.camera); return (v.y - b.y) / 2 * innerHeight; });
  check(hero > 844 * 0.1, `el héroe mide ${Math.round(hero)} px de alto en vertical`);
  await G(() => { const g = window.__game; g.hero.hp = 99; g.banner('PRUEBA', 'Cartel de prueba para ver dónde cae', 5); g.setStage('galpon'); g.banner('PRUEBA', 'Cartel de prueba para ver dónde cae', 5); });
  await page.waitForTimeout(500);
  const ov = (a, b) => a && b && a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
  const r = await G(() => Object.fromEntries(['#banner', '#boss-bar', '#joystick', '#act-attack', '#act-jump', '#act-dodge', '#hud-score'].map(s => [s, document.querySelector(s).getBoundingClientRect().toJSON()])));
  for (const c of ['#joystick', '#act-attack', '#act-jump', '#act-dodge']) {
    check(!ov(r['#banner'], r[c]) && !ov(r['#boss-bar'], r[c]), `en vertical, cartel y barra del jefe no tapan ${c}`);
  }
  check(!ov(r['#banner'], r['#boss-bar']) && !ov(r['#boss-bar'], r['#hud-score']), 'en vertical, cartel, barra y puntaje no se pisan');
  await page.screenshot({ path: new URL('./out/mobile-portrait.png', import.meta.url).pathname });
  await G(() => window.__game.finish(false));
  await page.waitForTimeout(100);

  // Un toque perdido no debe dejar trabado el botón de golpe
  await G(() => window.__game.quickStart('douge'));
  await G(() => window.__game.pause());
  const tap = (id) => G((pid) => {
    const b = document.querySelector('#act-attack');
    b.dispatchEvent(new PointerEvent('pointerdown', { pointerId: pid, bubbles: true }));
    if (pid !== 7) b.dispatchEvent(new PointerEvent('pointerup', { pointerId: pid, bubbles: true }));
  }, id);
  await tap(7); // se pierde el pointerup (llamada entrante)
  await G(() => window.__game.input.reset());
  await tap(8);
  const first = await G(() => window.__game.input.consume('attack'));
  await tap(9);
  const second = await G(() => window.__game.input.consume('attack'));
  check(first && second, `después de un toque perdido el botón sigue andando (${first}, ${second})`);
  check(errors.length === 0, 'sin errores de consola ' + JSON.stringify(errors));
} finally {
  await browser.close();
}
