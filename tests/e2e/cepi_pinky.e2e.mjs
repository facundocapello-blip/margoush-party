import { launch, open, startRun, check, shot } from './harness.mjs';

// Cepi «el Niño» (mini-jefe del nivel 2 y en la pantalla de derrota) y Pinky (viene a ayudar y se va a ver a Boca).
const { browser, page, errors } = await launch({ viewport: { width: 960, height: 540 } });
const G = (fn, arg) => page.evaluate(fn, arg);
const until = (fn, arg, ms = 8000) => page.waitForFunction(fn, arg, { timeout: ms, polling: 16 });
const overlap = (a, b) => !(a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top);

try {
  await open(page);
  await startRun(page, 'douge');
  await G(() => {
    window.__banners = [];
    const orig = window.__game.banner;
    window.__game.banner = (t, x, s, o) => { window.__banners.push(t + ' ' + x); return orig(t, x, s, o); };
  });

  // ---------- Cepi mini-jefe a mitad del nivel 2 ----------
  await G(() => {
    const g = window.__game; g.setStage('boulevard'); g.enemies.clear(); g.traps.disable();
    g.waves.boulevard = 'idle'; g.hero.hp = g.hero.hpMax = 99; g.hero.actor.position.set(214, 0, 0); g.facu.jokeCd = 99;
    window.__banners.length = 0;
  });
  await until(() => window.__game.waves.boulevard === 'active', null, 3000);
  const c = await G(() => {
    const g = window.__game, e = g.enemies.list.find(e => e.kind === 'cepi');
    const bar = document.querySelector('#boss-bar');
    return { level: g.level, has: !!e, hp: e?.hp, sheet: e?.actor.poses.idle?.tex?.image?.src || '', banners: window.__banners.slice(),
      bar: !bar.classList.contains('hidden'), barName: bar.querySelector('span').textContent };
  });
  check(c.level === 2 && c.has, 'Cepi aparece en el nivel 2 (oleada boulevard)');
  check(c.hp >= 12, `Cepi aguanta como mini-jefe (vida ${c.hp})`);
  check(c.banners.some(t => t.includes('CEPI')), 'sale el cartel de CEPI «EL NIÑO»');
  check(c.bar && c.barName.includes('CEPI'), 'se ve la barra de vida con su nombre');
  check(c.sheet.includes('cepi_sheet'), 'Cepi usa su hoja de poses');
  await page.waitForTimeout(1500);
  await shot(page, 'cepi-miniboss');
  await G(() => window.__game.enemies.clear());
  check(await G(() => document.querySelector('#boss-bar').classList.contains('hidden')), 'al irse Cepi se esconde la barra');

  // ---------- Pinky: una vez por nivel y nunca con malos vivos ----------
  await G(() => {
    const g = window.__game; g.setStage('vereda'); g.traps.disable(); g.hero.hp = g.hero.hpMax = 99; g.facu.jokeCd = 99;
    g.cameos.pinky.shown = { 1: false, 2: false }; window.__pinky = null;
    const tick = () => { if (g.cameos.pinky.actor && !window.__pinky) window.__pinky = { alive: g.enemies.alive(), state: g.state }; requestAnimationFrame(tick); };
    tick();
  });
  await page.waitForTimeout(2500);
  check(await G(() => window.__game.cameos.pinky.actor === null), 'con la banda viva Pinky no aparece');
  await G(() => { const g = window.__game; g.enemies.clear(); });
  await until(() => window.__game.cameos.pinky.shown[1] === true, null, 8000);
  const p0 = await G(() => window.__pinky);
  check(p0 && p0.alive === 0, 'Pinky entra recién con la zona despejada');
  check(await G(() => window.__banners.some(t => t.includes('PINKY'))), 'sale el cartel de PINKY');
  await until(() => window.__game.cameos.phase === 'party', null, 8000);
  await shot(page, 'pinky-gol');
  const walking = await G(async () => {
    const g = window.__game, x0 = g.hero.actor.position.x;
    return { state: g.state, x0 };
  });
  await page.keyboard.down('ArrowRight'); await page.waitForTimeout(400); await page.keyboard.up('ArrowRight');
  const x1 = await G(() => window.__game.hero.actor.position.x);
  check(walking.state === 'playing' && x1 > walking.x0 + 0.3, 'Pinky no frena el juego: el héroe camina');
  await until(() => window.__game.cameos.pinky.actor === null, null, 8000);
  check(true, 'Pinky se va a la cancha y desaparece');
  await page.waitForTimeout(4000);
  check(await G(() => window.__game.cameos.pinky.actor === null), 'Pinky no vuelve en el mismo nivel');

  // ---------- Volver al menú en medio de Pinky no deja actores ----------
  await G(() => { const g = window.__game; g.setStage('vereda'); g.enemies.clear(); g.traps.disable(); g.cameos.pinky.shown = { 1: false, 2: false }; });
  await until(() => window.__game.cameos.pinky.actor !== null, null, 8000);
  const mesh = await G(() => { window.__pm = window.__game.cameos.pinky.actor.mesh; window.__game.goMenu(); return !!window.__pm; });
  const left = await G(() => { let found = false; window.__game.ctx.scene.traverse(o => { if (o === window.__pm) found = true; }); return { actor: window.__game.cameos.pinky.actor, found }; });
  check(mesh && left.actor === null && !left.found, 'volver al menú en medio de Pinky no deja actores');

  // ---------- Cepi en la pantalla de derrota ----------
  for (const vp of [{ width: 960, height: 540 }, { width: 390, height: 844 }, { width: 844, height: 390 }]) {
    await page.setViewportSize(vp);
    await startRun(page, 'douge');
    await G(() => window.__game.finish(false));
    await page.waitForTimeout(3000);
    const r = await G(() => {
      const box = (s) => document.querySelector(s)?.getBoundingClientRect();
      const cepi = document.querySelector('#cepi');
      return { cepi: !!cepi, text: cepi?.querySelector('.host-bubble')?.textContent || '', sprite: !!cepi?.querySelector('.cepi-sprite'),
        facu: !!document.querySelector('#screen-result .host img[alt="Facu"]'),
        c: cepi && box('#cepi .cepi-sprite'), total: box('#result-total'), save: box('#btn-save'), again: box('#btn-again') };
    });
    check(r.cepi && r.sprite && !r.facu, `${vp.width}×${vp.height}: al perder aparece Cepi (no Facu) con su hoja`);
    check(r.text.length > 5, `Cepi grita: «${r.text}»`);
    check(!overlap(r.c, r.total) && !overlap(r.c, r.save) && !overlap(r.c, r.again), `${vp.width}×${vp.height}: Cepi no tapa puntaje ni botones`);
    await shot(page, `cepi-derrota-${vp.width}x${vp.height}`);
  }
  await page.setViewportSize({ width: 960, height: 540 });
  await startRun(page, 'douge');
  await G(() => window.__game.finish(true));
  await page.waitForTimeout(500);
  check(await G(() => !document.querySelector('#cepi') && !!document.querySelector('#screen-result .host img[alt="Facu"]')), 'al ganar no aparece Cepi: presenta Facu');

  check(errors.length === 0, 'sin errores en consola: ' + errors.join(' | '));
} finally { await browser.close(); }
