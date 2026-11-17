import fs from 'node:fs';
import { launch, open, startRun, check } from './harness.mjs';

// Facu se mueve cuando aparece (sale de la alcantarilla gesticulando), el cartel de Facu se anima y no hay micrófono
const { browser, page, errors } = await launch({ viewport: { width: 960, height: 540 } });
const G = (fn, arg) => page.evaluate(fn, arg);
try {
  await open(page);
  await startRun(page, 'douge');
  await G(() => { const g = window.__game; g.setStage('francia-quiet'); g.enemies.clear(); g.traps.disable(); for (const k in g.waves) g.waves[k] = 'cleared';
    g.hero.hp = g.hero.hpMax = 99; g.hero.actor.position.set(170, 0, 0); [[172, 0], [168, 0.5]].forEach(([x, z]) => g.enemies.spawn(x, z, 'lale'));
    g.facu.reset(); g.facu.jokeCd = 0; });
  await page.waitForFunction(() => window.__game.facu.appearing === 'hole', null, { timeout: 6000 });
  const m = await G(async () => {
    const a = window.__game.facu.actor, r = { lean: [1e9, -1e9], lift: [1e9, -1e9] }; const t0 = performance.now();
    while (performance.now() - t0 < 1200) { for (const k of Object.keys(r)) { r[k][0] = Math.min(r[k][0], a[k]); r[k][1] = Math.max(r[k][1], a[k]); } await new Promise(res => requestAnimationFrame(res)); }
    return { lean: r.lean[1] - r.lean[0], lift: r.lift[1] - r.lift[0] };
  });
  check(m.lift > 0.8, `sube de la alcantarilla (${m.lift.toFixed(2)} m)`);
  check(m.lean > 0.05, `gesticula mientras cuenta el chiste (lean ${m.lean.toFixed(3)})`);

  await G(() => window.__game.facu.say('Prueba de voz', 2.5));
  await page.waitForTimeout(200);
  const banner = await G(() => ({ text: document.querySelector('#banner').textContent, anim: getComputedStyle(document.querySelector('#banner img')).animationName }));
  check(banner.text.includes('FACU') && !banner.text.includes('🎤'), `el cartel de Facu no lleva micrófono (${banner.text.slice(0, 30)})`);
  check(banner.anim !== 'none', `el avatar del cartel se mueve (animación ${banner.anim})`);
  check(!/micr[oó]fono/i.test(fs.readFileSync(new URL('../../3d/js/ui.js', import.meta.url), 'utf8')), 'ui.js no habla de micrófono');
  const tagText = await G(() => [...document.querySelectorAll('#labels .tag-name')].map(e => e.textContent));
  check(!tagText.includes('FACU'), 'sin cartelito FACU sobre el mini Facu: ' + JSON.stringify(tagText));
  check(errors.length === 0, 'sin errores en consola: ' + errors.join(' | '));
} finally { await browser.close(); }
