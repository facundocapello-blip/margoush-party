import { launch, open, startRun, check, shot } from './harness.mjs';

const { browser, page, errors } = await launch({ viewport: { width: 960, height: 540 } });
const G = (fn, arg) => page.evaluate(fn, arg);
const hold = async (key, ms) => { await page.keyboard.down(key); await page.waitForTimeout(ms); await page.keyboard.up(key); };
// Mide cuánto avanza el héroe corriendo a la derecha
const run = async (ms = 700) => { const a = await G(() => window.__game.hero.actor.position.x); await hold('ArrowRight', ms); return (await G(() => window.__game.hero.actor.position.x)) - a; };
// Zona tranquila para medir: Francia con todo despejado y sin trampas sueltas
const quiet = (x = 170) => G((x) => { const g = window.__game; g.setStage('francia-quiet'); g.traps?.disable?.(); g.enemies.clear(); g.hero.hp = g.hero.hpMax = 99; g.hero.actor.position.set(x, 0, 0); }, x);
const ONLY = process.argv[2];
try {
  await open(page);
  await startRun(page, 'douge');

  // ---------- Ganchos del héroe ----------
  if (!ONLY || ONLY === 'hero') {
    await quiet();
    const normal = await run();
    await quiet();
    await G(() => window.__game.hero.slow(2));
    const slowed = await run();
    check(slowed < normal * 0.65 && slowed > normal * 0.3, `lento corre la mitad (${slowed.toFixed(2)} m vs ${normal.toFixed(2)} m)`);

    await quiet();
    await G(() => { const g = window.__game; const e = g.enemies.spawn(171.3, 0, 'secuaz'); e.hp = 99; e.stun = 99; g.hero.stun(1.6); });
    const hp0 = await G(() => window.__game.enemies.list[0].hp);
    for (let i = 0; i < 4; i++) { await page.keyboard.press('KeyJ'); await page.waitForTimeout(80); }
    check(await G(() => window.__game.enemies.list[0].hp) === hp0, 'aturdido no puede pegar');
    const stunMove = await run(400); const st = await G(() => window.__game.hero.stunT); check(stunMove < 0.2, `aturdido no puede caminar (${stunMove.toFixed(2)} m, quedaba ${st.toFixed(2)} s)`);
    await page.waitForTimeout(1200);
    check(await run(400) > 1, 'al pasar el aturdimiento vuelve a moverse');

    await quiet();
    const before = await G(() => ({ x: window.__game.hero.actor.position.x, z: window.__game.hero.actor.position.z, hp: window.__game.hero.hp }));
    await G(() => window.__game.hero.push(-9, 6));
    await page.waitForTimeout(500);
    const after = await G(() => ({ x: window.__game.hero.actor.position.x, z: window.__game.hero.actor.position.z, hp: window.__game.hero.hp }));
    check(after.x < before.x - 0.6 && after.z > before.z + 0.3 && after.hp === before.hp, `un empujón lo mueve sin dañarlo (Δx ${(after.x - before.x).toFixed(2)}, Δz ${(after.z - before.z).toFixed(2)})`);
  }

  const until = (fn, arg, ms = 6000) => page.waitForFunction(fn, arg, { timeout: ms, polling: 16 });
  const H = () => G(() => { const h = window.__game.hero; return { x: h.actor.position.x, z: h.actor.position.z, hp: h.hp, slowT: h.slowT }; });
  // Nivel 1 sin malos: las oleadas se marcan como despejadas
  const ba = (x, z) => G(([x, z]) => { const g = window.__game; g.setStage('vereda'); g.enemies.clear(); for (const k in g.waves) g.waves[k] = 'cleared'; g.hero.hp = 5; g.hero.hpMax = 5; g.hero.inv = 0; g.hero.actor.position.set(x, 0, z); }, [x, z]);
  const trap = (kind) => G((k) => window.__game.traps.list.find(t => t.kind === k), kind);

  // ---------- Baldosa floja ----------
  if (!ONLY || ONLY === 'baldosa') {
    const t = await G(() => { const t = window.__game.traps.list.find(t => t.kind === 'baldosa'); return { x: t.x, z: t.z }; });
    await ba(t.x - 1.6, t.z);
    await hold('ArrowRight', 500);
    const h = await H();
    check(h.slowT > 0, `pisar la baldosa floja te deja lento (${h.slowT.toFixed(2)} s)`);
    check(h.hp === 5, 'la baldosa no saca vida');
  }

  // ---------- Sin baches ----------
  check(await G(() => !window.__game.traps.list.some(t => t.kind === 'bache')), 'no quedan baches en la calle');

  // ---------- Piquete ----------
  if (!ONLY || ONLY === 'piquete') {
    await G(() => { const g = window.__game; g.setStage('piquete'); g.traps.disable(); g.enemies.list.forEach(e => { e.stun = 99; e.pos.z = 3.4; e.pos.x -= 6; }); g.hero.hp = 5; g.hero.inv = 0; g.hero.actor.position.set(116.3, 0, -1); });
    await hold('ArrowRight', 700);
    const h = await H();
    const gx = await G(() => window.__game.world.gates.find(g => g.kind === 'piquete').x);
    check(h.hp === 4, `tocar el fuego del piquete quema (hp ${h.hp})`);
    check(h.x < gx, `el piquete no se cruza (x=${h.x.toFixed(2)})`);
    await G(() => { const g = window.__game; g.hero.actor.position.x = 115; g.enemies.list.forEach(e => { e.hp = 0; }); g.hero.inv = 0; });
    await until(() => window.__game.world.gates.find(g => g.kind === 'piquete').open);
    await page.waitForTimeout(400);
    // camina hasta pasar el corte (en Chrome sin GPU los cuadros van lentos: se espera la posición, no un tiempo fijo)
    await page.keyboard.down('ArrowRight');
    await until((gx) => window.__game.hero.actor.position.x > gx + 1, gx, 6000).catch(() => {});
    await page.keyboard.up('ArrowRight');
    const h2 = await H();
    check(h2.x > gx + 1 && h2.hp === 4, `vencida la banda del bombo, el corte se levanta (x=${h2.x.toFixed(2)}, hp ${h2.hp})`);
  }

  // ---------- Colectivo ----------
  if (!ONLY || ONLY === 'colectivo') {
    const bus = async (after) => {
      await G(() => { const g = window.__game; g.setStage('avenida'); g.enemies.clear(); for (const k in g.waves) if (g.waves[k] === 'active') g.waves[k] = 'cleared'; g.hero.hp = 5; g.hero.inv = 0; g.hero.actor.position.set(90, 0, 0); g.traps.forceNext('colectivo'); });
      await until(() => window.__game.traps.active.some(a => a.kind === 'colectivo'));
      const t0 = Date.now();
      await after?.();
      await until(() => !window.__game.traps.active.some(a => a.kind === 'colectivo'), null, 8000);
      return { warnMs: await G(() => window.__game.traps.lastWarnMs?.colectivo), hp: (await H()).hp, t0 };
    };
    const r1 = await bus();
    check(r1.warnMs >= 800, `el colectivo avisa ${r1.warnMs} ms antes`);
    check(r1.hp === 4, `el colectivo atropella al que está en su carril (hp ${r1.hp})`);
    const r2 = await bus(async () => { await G(() => { window.__game.hero.actor.position.z = 2.8; }); });
    check(r2.hp === 5, 'cambiarse de carril lo esquiva');
    const r3 = await bus(async () => {
      await until(() => { const a = window.__game.traps.active.find(a => a.kind === 'colectivo'); return a && a.state === 'go' && a.front > window.__game.hero.actor.position.x - 3.5; });
      await page.keyboard.press('KeyK');
    });
    check(r3.hp === 5, 'esquivar justo cuando llega lo evita');
  }

  // ---------- Boletas ----------
  if (!ONLY || ONLY === 'boletas') {
    const drop = async (move) => {
      await G(() => { const g = window.__game; g.setStage('avenida'); g.enemies.clear(); for (const k in g.waves) if (g.waves[k] === 'active') g.waves[k] = 'cleared'; g.traps.disable(); g.hero.actor.position.set(95, 0, 0); g.score.addPickup('bottle'); g.traps.forceNext('boletas', true); });
      const shadow = await G(() => { const a = window.__game.traps.active.find(a => a.kind === 'boletas'); return a && a.shadow.visible; });
      if (move) await G(() => { window.__game.hero.actor.position.z = 2.5; });
      const before = await G(() => window.__game.score.total);
      await until(() => !window.__game.traps.active.some(a => a.kind === 'boletas' && !a.landed), null, 4000);
      return { shadow, before, after: await G(() => window.__game.score.total) };
    };
    const d1 = await drop(false);
    check(d1.shadow, 'la boleta marca su sombra antes de caer');
    check(d1.before === 50 && d1.after === 0, `una boleta resta 100 y el puntaje no baja de 0 (${d1.before} → ${d1.after})`);
    const d2 = await drop(true);
    check(d2.after === d2.before, 'correrse de la sombra la esquiva');
  }

  // ---------- Sin grève ----------
  check(await G(() => !window.__game.traps.list.some(t => t.kind === 'greve')), 'no hay fila de grève que no te deje pasar');

  // ---------- Trottinette ----------
  if (!ONLY || ONLY === 'trottinette') {
    const ride = async (jump) => {
      await G(() => { const g = window.__game; g.setStage('francia-quiet'); g.traps.disable(); g.enemies.clear(); g.hero.hp = 5; g.hero.inv = 0; g.hero.actor.position.set(175, 0, 0); g.traps.forceNext('trottinette', true); });
      if (jump) {
        await until(() => { const a = window.__game.traps.active.find(a => a.kind === 'trottinette'); return a && a.state === 'go' && Math.abs(a.front - window.__game.hero.actor.position.x) < 5; });
        await G(() => { const h = window.__game.hero; h.vy = 8.5; h.lift = 0.001; });
      }
      await until(() => !window.__game.traps.active.some(a => a.kind === 'trottinette'), null, 6000);
      return { warn: await G(() => window.__game.traps.lastWarnMs?.trottinette), hp: (await H()).hp };
    };
    const t1 = await ride(false);
    check(t1.warn >= 800 && t1.hp === 4, `la trottinette avisa ${t1.warn} ms antes y pega (hp ${t1.hp})`);
    const t2 = await ride(true);
    check(t2.hp === 5, 'la trottinette se salta');
  }

  // ---------- Palomas ----------
  if (!ONLY || ONLY === 'palomas') {
    await G(() => { const g = window.__game; g.setStage('francia-quiet'); g.traps.disable(); g.enemies.clear(); g.hero.hp = 5; g.hero.actor.position.set(180, 0, 0); g.traps.forceNext('palomas', true); });
    const warn = await G(() => window.__game.traps.active.find(a => a.kind === 'palomas')?.state);
    await until(() => { const a = window.__game.traps.active.find(a => a.kind === 'palomas'); return a && a.state === 'fly'; });
    await page.waitForTimeout(300);
    const birds = await G(() => window.__game.traps.active.find(a => a.kind === 'palomas')?.birds.filter(b => b.visible).length ?? 0);
    await shot(page, 'trap-palomas');
    check(warn === 'warn' && birds >= 12, `las palomas avisan y después tapan la vista (${birds} palomas)`);
    await until(() => !window.__game.traps.active.some(a => a.kind === 'palomas'), null, 5000);
    check((await H()).hp === 5, 'las palomas no lastiman');
  }

  check(errors.length === 0, 'sin errores de consola ' + JSON.stringify(errors));
} finally {
  await browser.close();
}
