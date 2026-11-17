import { launch, open, check, shot } from './harness.mjs';

const { browser, page, errors } = await launch({ viewport: { width: 844, height: 390 }, mobile: true });
const G = (fn, arg) => page.evaluate(fn, arg);
const rect = (sel) => G((s) => { const e = document.querySelector(s); if (!e || e.offsetParent === null && getComputedStyle(e).position !== 'fixed') { const r = e?.getBoundingClientRect(); return r && r.width ? r.toJSON() : null; } const r = e.getBoundingClientRect(); return r.width ? r.toJSON() : null; }, sel);
const overlap = (a, b) => a && b && a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
try {
  await open(page);
  await page.tap('#btn-play');
  await page.tap('#pick-douge');
  // Intro: un solo mensaje por vez, primero Facu y después el secuestro
  const seen = [];
  let maxBoxes = 0;
  for (let i = 0; i < 40; i++) {
    const s = await G(() => {
      const visible = [...document.querySelectorAll('#banner, .speech')].filter(e => !e.classList.contains('hidden') && getComputedStyle(e).display !== 'none');
      return { n: visible.length, text: document.querySelector('#banner').classList.contains('hidden') ? '' : document.querySelector('#banner').textContent, state: window.__game.state };
    });
    maxBoxes = Math.max(maxBoxes, s.n);
    if (s.text && seen[seen.length - 1] !== s.text) seen.push(s.text);
    if (s.state !== 'intro') break;
    await page.waitForTimeout(150);
  }
  check(maxBoxes <= 1, `en la intro nunca hay dos carteles a la vez (máx ${maxBoxes})`);
  const iFacu = seen.findIndex(t => t.includes('FACU')), iKid = seen.findIndex(t => t.includes('SE LLEVÓ A MARGOT'));
  check(iFacu >= 0 && iKid > iFacu, 'primero habla Facu y después aparece el secuestro: ' + JSON.stringify(seen));
  check(seen.every(t => t.length < 110), 'los mensajes son cortos (menos de 110 caracteres)');

  // Jugando: nada tapa el puntaje
  await page.waitForFunction(() => window.__game.state === 'playing', null, { timeout: 8000 });
  await G(() => window.__game.facu.say('¡Prueba de globo de Facu!', 3));
  await page.waitForTimeout(200);
  const score = await rect('#hud-score'), banner = await rect('#banner');
  check(!overlap(score, banner), 'el mensaje de Facu no tapa el puntaje');
  for (const c of ['#joystick', '#act-attack', '#act-jump', '#act-dodge']) check(!overlap(banner, await rect(c)), `el mensaje no tapa ${c}`);
  const car = await G(() => { const g = window.__game; const v = g.facu.car.position.clone(); v.y += 1.2; v.project(g.ctx.camera); return { x: (v.x + 1) / 2 * innerWidth, y: (1 - v.y) / 2 * innerHeight }; });
  check(!(car.x > banner.left && car.x < banner.right && car.y > banner.top && car.y < banner.bottom), 'el mensaje no tapa el auto de Facu');

  // Barra del jefe abajo al centro, sin chocar con los controles
  await G(() => window.__game.setStage('galpon'));
  await page.waitForTimeout(400);
  const bar = await rect('#boss-bar');
  check(bar && bar.top > 390 / 2, `la barra de BIG CHAKY va abajo (top ${bar && Math.round(bar.top)})`);
  for (const c of ['#joystick', '#act-attack', '#act-jump', '#act-dodge']) check(!overlap(bar, await rect(c)), `la barra no tapa ${c}`);
  await shot(page, 'layout-boss');
  check(errors.length === 0, 'sin errores de consola ' + JSON.stringify(errors));
} finally {
  await browser.close();
}
