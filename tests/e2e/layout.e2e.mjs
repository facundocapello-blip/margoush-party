import { launch, open, check, shot } from './harness.mjs';

const { browser, page, errors } = await launch({ viewport: { width: 844, height: 390 }, mobile: true });
const G = (fn, arg) => page.evaluate(fn, arg);
const rect = (sel) => G((s) => { const e = document.querySelector(s); if (!e || e.offsetParent === null && getComputedStyle(e).position !== 'fixed') { const r = e?.getBoundingClientRect(); return r && r.width ? r.toJSON() : null; } const r = e.getBoundingClientRect(); return r.width ? r.toJSON() : null; }, sel);
const overlap = (a, b) => a && b && a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
try {
  await open(page);
  await page.tap('#btn-play');
  await page.tap('#pick-douge');
  await page.waitForFunction(() => window.__game.state === 'intro', null, { timeout: 6000 }); // el festejo de la tarjeta dura ~1 s
  // Intro (escena animada): un solo cartel por vez; Facu no presenta; arranca en Le Concept y termina con el secuestro
  const seen = [];
  let maxBoxes = 0;
  for (let i = 0, t0 = Date.now(); Date.now() - t0 < 120000; i++) { // la escena dura ~16 s de juego (más lento sin placa de video)
    const s = await G(() => {
      const visible = [...document.querySelectorAll('#banner, .speech')].filter(e => !e.classList.contains('hidden') && getComputedStyle(e).display !== 'none');
      const cap = document.querySelector('.cine-cap.on b')?.textContent || '';
      return { n: visible.length, text: cap || (document.querySelector('#banner').classList.contains('hidden') ? '' : document.querySelector('#banner').textContent), state: window.__game.state };
    });
    maxBoxes = Math.max(maxBoxes, s.n);
    if (s.text && seen[seen.length - 1] !== s.text) seen.push(s.text);
    if (s.state !== 'intro') break;
    await page.waitForTimeout(150);
  }
  check(maxBoxes <= 1, `en la intro nunca hay dos carteles a la vez (máx ${maxBoxes})`);
  const iFacu = seen.findIndex(t => t.includes('FACU')), iKid = seen.findIndex(t => t.includes('SE LLEVÓ A MARGOT'));
  check(iFacu < 0 && iKid >= 0 && seen[0] === 'LE CONCEPT', 'en la intro Facu no presenta, arranca en Le Concept y aparece el secuestro: ' + JSON.stringify(seen));
  check(seen.every(t => t.length < 110), 'los mensajes son cortos (menos de 110 caracteres)');

  // Jugando: nada tapa el puntaje
  await page.waitForFunction(() => window.__game.state === 'chase', null, { timeout: 15000 });
  await page.evaluate(() => { const g = window.__game; g.chase.dispose(); g.quickStart(g.heroId); }); // la persecución se prueba en chase.e2e
  await page.waitForFunction(() => window.__game.state === 'playing', null, { timeout: 8000 });
  await G(() => window.__game.banner('PRUEBA', '¡Prueba de globo!', 3));
  await page.waitForTimeout(200);
  const score = await rect('#hud-score'), banner = await rect('#banner');
  check(!overlap(score, banner), 'el mensaje no tapa el puntaje');
  for (const c of ['#joystick', '#act-attack', '#act-jump', '#act-dodge']) check(!overlap(banner, await rect(c)), `el mensaje no tapa ${c}`);

  // Barra del jefe en la arena: arriba (abajo taparía los pies del héroe), sin chocar con los controles
  await G(() => window.__game.setStage('galpon'));
  await page.waitForTimeout(400);
  const bar = await rect('#boss-bar');
  check(bar && bar.top < 390 / 2, `la barra de BIG CHAKY va arriba (top ${bar && Math.round(bar.top)})`);
  for (const c of ['#joystick', '#act-attack', '#act-jump', '#act-dodge']) check(!overlap(bar, await rect(c)), `la barra no tapa ${c}`);
  await shot(page, 'layout-boss');
  check(errors.length === 0, 'sin errores de consola ' + JSON.stringify(errors));
} finally {
  await browser.close();
}
