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
  await page.waitForTimeout(300);
  check(await visible('#rotate-hint'), 'en vertical aparece "Girá el celu" al empezar');
  const t0 = await G(() => window.__game.story.inIntro ? 'intro' : window.__game.state);
  await page.waitForTimeout(1500);
  check(await G(() => window.__game.portraitBlock === true) && t0 === 'intro' && await G(() => window.__game.story.inIntro), 'en vertical el juego espera (la intro no avanza)');
  await page.setViewportSize({ width: 844, height: 390 });
  await page.waitForTimeout(300);
  check(!(await visible('#rotate-hint')), 'al girar el celu el aviso se va');
  await page.tap('#game');
  await page.waitForFunction(() => window.__game.state === 'playing');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(300);
  check(await visible('#rotate-hint'), 'si se vuelve a poner vertical, vuelve el aviso');
  await G(() => window.__game.finish(false));
  await page.waitForTimeout(100);
  check(!(await visible('#rotate-hint')), 'el aviso se oculta en la pantalla de resultado');

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
