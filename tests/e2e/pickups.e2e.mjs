import { launch, open, startRun, check } from './harness.mjs';

// Cervezas 🍺 y hongos 🍄 dan vida y puntos; el hongo venenoso solo pone la pantalla psicodélica (sin daño, sin invertir controles)
const { browser, page, errors } = await launch({ viewport: { width: 960, height: 540 } });
const G = (fn, arg) => page.evaluate(fn, arg);
const take = (kind) => G((kind) => {
  const g = window.__game; g.hero.hp = 3; g.hero.inv = 0; g.score.takeDamage();
  const b = g.pickups.list.find(p => !p.taken && p.kind === kind);
  if (!b) return null;
  const before = g.score.total;
  g.hero.actor.position.set(b.x, 0, b.z);
  return { before, x: b.x };
}, kind);
const state = () => G(() => { const g = window.__game; return { hp: g.hero.hp, total: g.score.total, psy: g.psycho.t, active: g.psycho.active, filter: document.querySelector('#game').style.filter }; });
try {
  await open(page);
  await startRun(page, 'douge');

  const kinds = await G(() => window.__game.pickups.list.map(p => p.kind));
  check(kinds.filter(k => k === 'beer').length >= 3, `hay cervezas (${kinds.join(',')})`);
  check(kinds.filter(k => k === 'mushroom').length >= 3, 'hay hongos buenos');
  check(kinds.filter(k => k === 'poison').length === 2, 'hay 2 hongos venenosos');
  check(!kinds.includes('bottle') && !kinds.includes(undefined), 'ya no quedan mamaderas');

  for (const k of ['beer', 'mushroom']) {
    const t = await take(k);
    await page.waitForTimeout(400);
    const s = await state();
    check(s.hp === 4, `${k}: suma 1 de vida (hp ${s.hp})`);
    check(s.total - t.before === 50, `${k}: suma 50 puntos (${s.total - t.before})`);
    check(!s.active, `${k}: no pone la pantalla psicodélica`);
  }

  // Hongo venenoso: sin daño ni puntos, 6 s de pantalla psicodélica
  const t = await take('poison');
  await page.waitForTimeout(400);
  const p = await state();
  check(p.hp === 3, `veneno: no saca ni da vida (hp ${p.hp})`);
  check(p.total === t.before, 'veneno: no da puntos');
  check(p.active && p.psy > 5 && p.psy <= 6, `veneno: pantalla psicodélica ~6 s (${p.psy.toFixed(2)})`);
  await page.waitForTimeout(300);
  check((await state()).filter.includes('hue-rotate'), 'se aplica el giro de colores al juego');
  // Los controles NO se invierten
  await G(() => { const g = window.__game; g.hero.actor.position.set(20, 0, 0); });
  await page.keyboard.down('ArrowRight'); await page.waitForTimeout(300); await page.keyboard.up('ArrowRight');
  check(await G(() => window.__game.hero.actor.position.x) > 20.5, 'con el hongo los controles siguen normales');
  // Se termina
  await G(() => { window.__game.timeScale = 10; });
  await page.waitForFunction(() => !window.__game.psycho.active, null, { timeout: 8000 });
  await G(() => { window.__game.timeScale = 1; });
  const e = await state();
  check(!e.active && !e.filter.includes('hue-rotate'), 'pasados los 6 s vuelve todo a la normalidad');

  // Empezar de nuevo limpia el efecto
  await take('poison'); await page.waitForTimeout(300);
  await G(() => window.__game.setStage('vereda'));
  check(!(await state()).active, 'reiniciar el tramo corta el efecto');

  check(errors.length === 0, 'sin errores en consola: ' + errors.join(' | '));
} finally { await browser.close(); }
