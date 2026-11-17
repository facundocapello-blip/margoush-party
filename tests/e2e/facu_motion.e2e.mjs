import fs from 'node:fs';
import { launch, open, startRun, check } from './harness.mjs';

// El mini Facu: sin micrófono y con movimiento propio (balanceo, respiración y gestos al hablar)
const { browser, page, errors } = await launch({ viewport: { width: 960, height: 540 } });
const G = (fn, arg) => page.evaluate(fn, arg);
// Mide cuánto varían lean, stretch y lift de Facu durante `ms`
const sample = (ms) => G(async (ms) => {
  const a = window.__game.facu.actor, r = { lean: [1e9, -1e9], stretch: [1e9, -1e9], lift: [1e9, -1e9] };
  const t0 = performance.now();
  while (performance.now() - t0 < ms) {
    for (const k of Object.keys(r)) { r[k][0] = Math.min(r[k][0], a[k]); r[k][1] = Math.max(r[k][1], a[k]); }
    await new Promise(res => requestAnimationFrame(res));
  }
  return Object.fromEntries(Object.entries(r).map(([k, [lo, hi]]) => [k, hi - lo]));
}, ms);

try {
  await open(page);
  await startRun(page, 'douge');
  await G(() => { const g = window.__game; g.setStage('vereda'); g.enemies.clear(); g.traps.disable(); g.facu.jokeCd = 99; g.hero.hp = g.hero.hpMax = 99; });
  await page.waitForTimeout(2500); // que el auto alcance y se quede parado

  const idle = await sample(2600);
  check(idle.lean >= 0.05, `parado, Facu se balancea (lean ${idle.lean.toFixed(3)})`);
  check(idle.stretch >= 0.03, `parado, Facu respira (stretch ${idle.stretch.toFixed(3)})`);

  await G(() => window.__game.facu.say('Prueba de voz', 2.5));
  const talk = await sample(900);
  check(talk.stretch >= 0.06, `al hablar hace gestos más grandes (stretch ${talk.stretch.toFixed(3)})`);
  check(talk.lift >= 0.04, `al hablar da saltitos (lift ${talk.lift.toFixed(3)})`);

  const banner = await G(() => ({ text: document.querySelector('#banner').textContent, anim: getComputedStyle(document.querySelector('#banner img')).animationName }));
  check(banner.text.includes('FACU') && !banner.text.includes('🎤'), `el cartel de Facu ya no lleva micrófono (${banner.text.slice(0, 30)})`);
  check(banner.anim !== 'none', `el avatar del cartel se mueve (animación ${banner.anim})`);

  const host = await G(() => { const d = document.createElement('div'); d.className = 'host'; d.innerHTML = '<img>'; document.body.append(d); const a = getComputedStyle(d.querySelector('img')).animationName; d.remove(); return a; });
  check(host !== 'none', `el Facu de la pantalla final se mueve (animación ${host})`);
  check(!/micr[oó]fono/i.test(fs.readFileSync(new URL('../../3d/js/ui.js', import.meta.url), 'utf8')), 'ui.js no habla de micrófono');
  const tagText = await G(() => [...document.querySelectorAll('#labels .tag-name')].map(e => e.textContent));
  check(!tagText.includes('FACU'), 'el cartelito FACU sobre el mini Facu ya no está: ' + JSON.stringify(tagText));
  check(errors.length === 0, 'sin errores en consola: ' + errors.join(' | '));
} finally { await browser.close(); }
