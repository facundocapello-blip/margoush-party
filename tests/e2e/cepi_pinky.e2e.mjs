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
    const g = window.__game, e = g.enemies.list.find(e => e.kind === 'cepiJefe');
    const bar = document.querySelector('#boss-bar');
    return { level: g.level, has: !!e, hp: e?.hp, sheet: e?.actor.poses.idle?.tex?.image?.src || '', banners: window.__banners.slice(),
      bar: !bar.classList.contains('hidden'), barName: bar.querySelector('span').textContent };
  });
  check(c.level === 2 && c.has, 'Cepi jefe aparece en el nivel 2 (oleada boulevard)');
  check(c.hp >= 12, `Cepi aguanta como mini-jefe (vida ${c.hp})`);
  check(c.banners.some(t => t.includes('CEPI')), 'sale el cartel de CEPI «EL NIÑO»');
  check(c.bar && c.barName.includes('CEPI'), 'se ve la barra de vida con su nombre');
  check(c.sheet.includes('cepi_sheet'), 'Cepi usa su hoja de poses');
  await page.waitForTimeout(1500);
  await shot(page, 'cepi-miniboss');
  await G(() => window.__game.enemies.clear());
  check(await G(() => document.querySelector('#boss-bar').classList.contains('hidden')), 'al irse Cepi se esconde la barra');

  // ---------- Pinky trapito: si te pega, te cobra el estacionamiento ----------
  await G(() => { const g = window.__game; g.setStage('francia-quiet'); g.enemies.clear(); g.traps.disable(); for (const k in g.waves) g.waves[k] = 'cleared';
    g.hero.hp = g.hero.hpMax = 99; g.hero.inv = 0; g.hero.actor.position.set(170, 0, 0); g.score.addKill('boss'); window.__s0 = g.score.total;
    window.__p = g.enemies.spawn(172, 0, 'pinky'); });
  await page.waitForFunction(() => window.__game.hero.hp < 99, null, { timeout: 12000 });
  const fee = await G(() => window.__s0 - window.__game.score.total);
  check(fee === 100, `el trapito te saca $100 de puntaje cuando te pega (${fee})`);
  check(await G(() => window.__p.actor.poses.idle.tex.image.src.includes('pinky_sheet')), 'Pinky usa su hoja de poses');
  check(await G(() => window.__game.cameos.pinky.actor === null), 'Pinky ya no aparece como ayudante');

  // ---------- Cepi tira pelotazos de pádel ----------
  await G(() => { const g = window.__game; g.enemies.clear(); g.hero.hp = 99; g.hero.inv = 0; window.__c = g.enemies.spawn(176, 0, 'cepi'); });
  await page.waitForFunction(() => window.__game.enemies.shots.length > 0, null, { timeout: 8000 });
  check(true, 'Cepi tira un pelotazo de pádel con su sombra');

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
