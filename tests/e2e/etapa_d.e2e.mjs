// Etapa D: textos flotantes que no se pisan, cartel de fase como cinta bajo el HUD y Margot
// sin llanto en las cinemáticas (se ríe y le tira el chupete al que la lleva). Celular vertical.
import { launch, check, shot } from './harness.mjs';

const G = (page, fn, arg) => page.evaluate(fn, arg);
const { browser, page, errors } = await launch({ viewport: { width: 430, height: 932 }, mobile: true });
const overlap = (a, b) => a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 1 && b.top < a.bottom - 1;

try {
  // ---- 1) Textos flotantes en la calle: 4 en el mismo lugar no se pisan ----
  await page.goto('http://game.local/3d/index.html');
  await page.waitForFunction(() => window.__game && window.__game.state === 'menu', null, { timeout: 20000 });
  await G(page, () => window.__game.quickStart('douge'));
  await page.waitForFunction(() => window.__game.state === 'playing', null, { timeout: 20000 });
  await G(page, () => { const g = window.__game, p = g.hero.actor.position.clone().setY(2.4); ['+100', '¡COMBO x3!', '+250', '¡Bien!'].forEach(t => g.ctx.fx.popup(p, t, '#ffd36e', { size: 22, life: 2, rise: 0.2 })); });
  await page.waitForTimeout(350);
  const rects = await G(page, () => [...document.querySelectorAll('#labels .pop')].map(e => e.getBoundingClientRect().toJSON()));
  let pisados = 0; for (let i = 0; i < rects.length; i++) for (let j = i + 1; j < rects.length; j++) if (overlap(rects[i], rects[j])) pisados++;
  check(rects.length >= 4 && pisados === 0, `4 textos en el mismo punto no se pisan (${rects.length} textos, ${pisados} pisados)`);
  const hudB = await G(page, () => document.getElementById('hud').getBoundingClientRect().bottom);
  check(rects.every(r => r.top >= hudB - 1), 'ningún texto queda debajo del HUD de arriba');
  await shot(page, 'etapa_d_textos');

  // ---- 2) Cartel de fase: cinta debajo del HUD, no en el medio de la pelea ----
  await page.goto('http://game.local/3d/index.html?probar=lale');
  await page.waitForFunction(() => window.__game && window.__game.state === 'menu', null, { timeout: 20000 });
  await G(page, () => document.querySelector('#press-start')?.click());
  await page.waitForTimeout(600);
  await G(page, () => document.querySelector('#btn-play').click());
  await page.waitForTimeout(300);
  await G(page, () => document.querySelector('.card[data-hero="douge"]').click());
  await page.waitForFunction(() => document.querySelector('#arena-ui .phase-card.on'), null, { timeout: 25000 });
  await page.waitForTimeout(450);
  const card = await G(page, () => ({ c: document.querySelector('#arena-ui .phase-card').getBoundingClientRect().toJSON(), hud: Math.max(document.getElementById('hud').getBoundingClientRect().bottom, document.getElementById('boss-bar').getBoundingClientRect().bottom), h: innerHeight }));
  check(card.c.top >= card.hud - 2, `el cartel arranca debajo del HUD y la barra del jefe (cartel ${Math.round(card.c.top)} / HUD ${Math.round(card.hud)})`);
  check(card.c.bottom < card.h * 0.36, `el cartel no tapa el centro de la pelea (termina en ${Math.round(card.c.bottom / card.h * 100)}% de la altura)`);
  await shot(page, 'etapa_d_cartel_fase');

  // ---- 3) Cinemáticas: Margot no llora, le tira el chupete al que la lleva ----
  for (const [kind, hero, re] of [['pre_cepi', 'douge', /Papááá, más rápido/], ['pre_pinky', 'marine', /plus vite/]]) {
    await page.goto('http://game.local/3d/index.html');
    await page.waitForFunction(() => window.__game && window.__game.state === 'menu', null, { timeout: 20000 });
    await G(page, (h) => window.__game.quickStart(h), hero);
    await page.waitForFunction(() => window.__game.state === 'playing', null, { timeout: 20000 });
    await G(page, ([k, h]) => { const g = window.__game; g.state = 'intro'; g.story.startIntro(g.hero, h, k); }, [kind, hero]);
    await page.waitForFunction((src) => new RegExp(src).test(document.querySelector('.cine-sub span')?.textContent || ''), re.source, { timeout: 15000 });
    check(true, `${kind}: Margot grita «${re.source}» (no llora)`);
    await page.waitForFunction(() => window.__game.story.cine.chupetes > 0 && [...document.querySelectorAll('#labels .pop')].some(e => /TOC/.test(e.textContent)), null, { timeout: 5000 });
    check(true, `${kind}: el chupete le pega en la cabeza («¡TOC!»)`);
    await shot(page, 'etapa_d_' + kind);
  }
  check(errors.length === 0, 'sin errores ' + errors.join(' | '));
} finally { await browser.close(); }
