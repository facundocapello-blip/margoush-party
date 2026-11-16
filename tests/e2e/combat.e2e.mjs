import { launch, open, startRun, check, shot } from './harness.mjs';

const { browser, page, errors } = await launch({ viewport: { width: 960, height: 540 } });
const G = (fn, arg) => page.evaluate(fn, arg);
try {
  await open(page);
  await startRun(page, 'douge');

  // Mamadera: +50 y +1 de vida
  await G(() => { const g = window.__game; g.hero.hp = 3; const b = g.pickups.list.find(p => !p.taken); g.hero.actor.position.set(b.x, 0, b.z); });
  await page.waitForTimeout(400);
  const after = await G(() => ({ hp: window.__game.hero.hp, total: window.__game.score.total }));
  check(after.hp === 4, 'la mamadera suma 1 de vida');
  check(after.total === 50, 'la mamadera suma 50 puntos');

  // Pasaje sellado hasta romper los cajones
  await G(() => { const g = window.__game; g.setStage('plaza-quiet'); g.hero.actor.position.set(g.world.secret.x, 0, -3.0); });
  await page.keyboard.down('ArrowUp'); await page.waitForTimeout(900); await page.keyboard.up('ArrowUp');
  check(await G(() => window.__game.hero.actor.position.z) >= -3.61, 'el pasaje está cerrado con cajones');
  for (let i = 0; i < 24 && await G(() => window.__game.world.secret.sealed); i++) {
    const cx = await G(() => { const c = window.__game.crates.list.find(c => !c.broken); return c ? c.x : window.__game.world.secret.x; });
    await G((x) => { const p = window.__game.hero.actor.position; p.x = x - 1.0; p.z = -3.5; window.__game.hero.actor.setFacing(1); }, cx);
    await page.keyboard.press('KeyJ'); await page.waitForTimeout(260);
  }
  check(!(await G(() => window.__game.world.secret.sealed)), 'romper los cajones abre el pasaje');
  await G(() => window.__game.hero.actor.position.set(window.__game.world.secret.x, 0, -3.4));
  const before = await G(() => window.__game.score.total);
  await page.keyboard.down('ArrowUp'); await page.waitForTimeout(1200); await page.keyboard.up('ArrowUp');
  const s1 = await G(() => window.__game.score.total);
  check(s1 - before === 500, `el secreto da 500 (dio ${s1 - before})`);
  await page.keyboard.down('ArrowDown'); await page.waitForTimeout(700); await page.keyboard.up('ArrowDown');
  await page.keyboard.down('ArrowUp'); await page.waitForTimeout(1200); await page.keyboard.up('ArrowUp');
  check(await G(() => window.__game.score.total) === s1, 'el secreto cuenta una sola vez');

  // Daño: como mucho 1 por cada 0,7 s
  await G(() => { const g = window.__game; g.setStage('vereda'); g.hero.hp = 99; g.hero.hpMax = 99; g.hero.damageLog = []; });
  await page.waitForTimeout(6000);
  const log = await G(() => window.__game.hero.damageLog);
  check(log.length > 0, `los enemigos atacan (${log.length} golpes)`);
  let minGap = 99; for (let i = 1; i < log.length; i++) minGap = Math.min(minGap, log[i] - log[i - 1]);
  check(minGap >= 0.69, `nunca más de un daño cada 0,7 s (mínimo ${minGap.toFixed(2)} s)`);
  await shot(page, 'combat');

  // Bot: despeja la vereda en menos de 40 s
  await G(() => { const g = window.__game; g.setStage('vereda'); g.hero.hp = 99; g.hero.hpMax = 99; g.stats.maxMult = 1; });
  const t0 = Date.now();
  let held = null;
  while (Date.now() - t0 < 40000) {
    const s = await G(() => {
      const g = window.__game; const h = g.hero.actor.position;
      const alive = g.enemies.list.filter(e => e.hp > 0);
      if (!alive.length && g.waves.vereda === 'cleared') return { done: true };
      const e = alive.sort((a, b) => Math.abs(a.pos.x - h.x) - Math.abs(b.pos.x - h.x))[0];
      if (!e) return { key: 'ArrowRight' };
      const dx = e.pos.x - h.x, dz = e.pos.z - h.z;
      if (Math.abs(dz) > 0.4) return { key: dz > 0 ? 'ArrowDown' : 'ArrowUp' };
      if (Math.abs(dx) > 1.5) return { key: dx > 0 ? 'ArrowRight' : 'ArrowLeft' };
      return { attack: true, face: dx > 0 ? 'ArrowRight' : 'ArrowLeft' };
    });
    if (s.done) break;
    const want = s.key || null;
    if (held !== want) { if (held) await page.keyboard.up(held); if (want) await page.keyboard.down(want); held = want; }
    if (s.attack) {
      if (await G(() => window.__game.hero.actor.facing) !== (s.face === 'ArrowRight' ? 1 : -1)) { await page.keyboard.down(s.face); await page.waitForTimeout(40); await page.keyboard.up(s.face); }
      await page.keyboard.press('KeyJ');
    }
    await page.waitForTimeout(90);
  }
  if (held) await page.keyboard.up(held);
  const res = await G(() => ({ wave: window.__game.waves.vereda, total: window.__game.score.total, maxMult: window.__game.stats.maxMult, gate: window.__game.world.gates[0].open }));
  check(res.wave === 'cleared', `el bot despeja la vereda en ${(Date.now() - t0) / 1000 | 0} s`);
  check(!res.gate, 'la primera oleada no abre el portón: falta el patovica');
  await G(() => { const g = window.__game; g.hero.actor.position.set(52, 0, 0); });
  await page.waitForFunction(() => window.__game.waves['vereda-2'] === 'active', null, { timeout: 4000 });
  await G(() => window.__game.enemies.list.forEach(e => { e.hp = 0; }));
  await page.waitForFunction(() => window.__game.world.gates[0].open, null, { timeout: 4000 });
  check(true, 'despejar la oleada del portón lo abre');
  check(res.total > 0 && res.maxMult > 1, `suma puntos (${res.total}) y el multiplicador sube (${res.maxMult})`);

  // Minimizar la app pausa y suelta los controles
  await page.keyboard.down('ArrowRight');
  await G(() => { Object.defineProperty(document, 'hidden', { value: true, configurable: true }); document.dispatchEvent(new Event('visibilitychange')); });
  await page.waitForTimeout(150);
  check(await G(() => window.__game.state) === 'paused', 'al ocultar la página se pausa');
  await G(() => { Object.defineProperty(document, 'hidden', { value: false, configurable: true }); });
  await page.keyboard.up('ArrowRight');
  await page.click('#btn-resume');
  await page.waitForTimeout(150);
  check(await G(() => window.__game.state === 'playing' && window.__game.input.moveX === 0), 'al volver no queda ninguna tecla apretada');
  check(errors.length === 0, 'sin errores de consola ' + JSON.stringify(errors));
} finally {
  await browser.close();
}
