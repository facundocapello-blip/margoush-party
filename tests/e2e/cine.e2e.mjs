// Escenas animadas: la intro (Le Concept → Cepi se lleva a Margot) se ve con franjas, subtítulos y SALTAR;
// SALTAR lleva a la persecución; la escena después del BYD termina en la calle de Buenos Aires.
import { launch, open, check, shot } from './harness.mjs';

const { browser, page, errors } = await launch({ viewport: { width: 390, height: 844 }, mobile: true });
try {
  await open(page);
  const g = (fn, a) => page.evaluate(fn, a);
  check(await g(() => window.__game.ctx.audio.current === 'menu'), 'la música de la portada arranca apenas carga el juego');
  await page.tap('#btn-play');
  await page.tap('#pick-douge');
  await page.waitForFunction(() => window.__game.state === 'intro', null, { timeout: 8000 });
  check(await g(() => !document.getElementById('cine').classList.contains('hidden')), 'la intro se ve como escena de cine');
  await page.waitForFunction(() => /domingo/.test(document.querySelector('.cine-sub span')?.textContent || ''), null, { timeout: 10000 });
  check(true, 'arranca en Le Concept con la familia');
  await page.waitForFunction(() => /bebé va a ser mía/.test(document.querySelector('.cine-sub span')?.textContent || ''), null, { timeout: 20000 });
  const r = await g(() => { const b = document.querySelector('.cine-sub').getBoundingClientRect(); return { l: b.left, r: b.right }; });
  check(r.l >= 0 && r.r <= 390, `el subtítulo entra en la pantalla (${Math.round(r.l)}–${Math.round(r.r)})`);
  check(await g(() => window.__game.ctx.camera.position.x > 136), 'la cámara va a mostrar a BIG CHAKY y la banda');
  check(await g(() => { const sc = window.__game.ctx.scene; let vis = null; sc.traverse(o => { if (o.isMesh && o.geometry?.parameters?.depth > 7 && o.parent?.type === 'Group' && o.parent.parent === sc && Math.abs(o.parent.position.x - 146.8) < 0.1) vis = o.parent.visible; }); return vis === false; }), 'en la intro no está la barrera del aeropuerto (nadie la atraviesa)');
  await shot(page, 'cine-chaky');
  await page.waitForFunction(() => /Papá/.test(document.querySelector('.cine-sub span')?.textContent || ''), null, { timeout: 60000 });
  await shot(page, 'cine-escape');
  await page.tap('.cine-skip');
  await page.waitForFunction(() => window.__game.state === 'chase', null, { timeout: 8000 });
  check(await g(() => { const sc = window.__game.ctx.scene; let vis = null; sc.traverse(o => { if (o.type === 'Group' && o.parent === sc && Math.abs(o.position.x - 146.8) < 0.1 && Math.abs(o.position.y - 1.32) < 0.01) vis = o.visible; }); return vis === true; }), 'después de la intro la barrera vuelve a estar');
  check(await g(() => document.getElementById('cine').classList.contains('hidden')), 'SALTAR lleva a la persecución y se va el cine');
  await g(() => window.__game.chase.dispose());
  // escena después de romper el BYD
  await g(() => { const G = window.__game; G.quickStart('douge'); });
  await page.waitForFunction(() => window.__game.state === 'playing');
  await g(() => { const G = window.__game; G.state = 'intro'; G.story.startIntro(G.hero, 'douge', 'byd'); });
  await page.waitForFunction(() => /Francia/.test(document.querySelector('.cine-sub span')?.textContent || ''), null, { timeout: 15000 });
  check(true, 'BIG CHAKY dice que se la lleva a Francia');
  await page.waitForFunction(() => window.__game.state === 'playing', null, { timeout: 60000 });
  check(await g(() => window.__game.level === 1 && window.__game.hero.actor.position.x < 8 && window.__game.ctx.audio.current === 'ba'), 'después sigue la calle de Buenos Aires con la murga');
  check(errors.length === 0, 'sin errores ' + errors.join(' | '));
} finally { await browser.close(); }
