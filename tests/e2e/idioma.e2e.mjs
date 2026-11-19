// Idioma: con la banderita francesa los menús y carteles salen en francés, lo que dicen los porteños
// queda en castellano con subtítulo en francés, y se recuerda al recargar.
import { launch, open, startRun, check, shot } from './harness.mjs';

const { browser, page, errors } = await launch({ viewport: { width: 390, height: 844 }, mobile: true });
try {
  await open(page);
  const g = (fn, a) => page.evaluate(fn, a);
  check(await g(() => document.querySelector('#btn-play').textContent) === '¡JUGAR!', 'arranca en castellano');
  await page.click('#lang-pick [data-lang="fr"]');
  check(await g(() => document.querySelector('#btn-play').textContent) === 'JOUER !', 'menú en francés');
  check(await g(() => document.documentElement.lang) === 'fr', 'html lang=fr');
  await shot(page, 'idioma_portada_fr');
  await open(page); // recarga: se acuerda
  check(await g(() => document.querySelector('#btn-play').textContent) === 'JOUER !', 'se recuerda al recargar');
  await startRun(page, 'marine');
  await page.waitForTimeout(300);
  const hud = await g(() => document.querySelector('#hud-power-text').textContent);
  check(hud === 'POUVOIR' || hud === '⚡ PRÊT !', 'HUD en francés: ' + hud);
  await g(() => { const G = window.__game; G.banner('LA VEREDA', '¡Llegó la banda de BIG CHAKY!'); });
  await page.waitForTimeout(100);
  check(/LE TROTTOIR/.test(await g(() => document.querySelector('#banner').textContent)), 'cartel traducido');
  await g(() => { const G = window.__game; G.ctx.fx.popup(G.hero.actor.position.clone().setY(3), '¡Andá a jugar a la bolita!', '#fff', { life: 3 }); });
  await page.waitForTimeout(150);
  const pop = await g(() => [...document.querySelectorAll('#labels .pop')].map(p => p.textContent).find(t => t.includes('bolita')));
  check(pop && pop.includes('Va jouer aux billes'), 'dicho con subtítulo: ' + pop);
  await shot(page, 'idioma_juego_fr');
  await page.click('#btn-pause');
  check(await g(() => document.querySelector('#btn-resume').textContent) === 'CONTINUER', 'pausa en francés');
  await page.click('#btn-resume');
  await g(() => localStorage.setItem('margoush3d_lang', 'es'));
  check(errors.length === 0, 'sin errores ' + errors.join(' | '));
} finally {
  await browser.close();
}
