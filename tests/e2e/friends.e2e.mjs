import { launch, open, startRun, check } from './harness.mjs';

// Amigos de Facu en el juego: Lale «Mantecoso» y su manteca (Task 5 del plan de personajes).
const { browser, page, errors } = await launch({ viewport: { width: 960, height: 540 } });
const G = (fn, arg) => page.evaluate(fn, arg);
const until = (fn, arg, ms = 8000) => page.waitForFunction(fn, arg, { timeout: ms, polling: 16 });

// Buenos Aires despejado (sin trampas de tramo ni oleadas), héroe con 5 de vida en (x, z)
const quiet = (x, z = 0) => G(([x, z]) => {
  const g = window.__game; g.setStage('vereda'); g.enemies.clear(); for (const k in g.waves) g.waves[k] = 'cleared';
  g.traps.disable(); g.butter?.clear(); g.hero.hp = g.hero.hpMax = 5; g.hero.inv = 0; g.hero.slideT = 0;
  g.hero.actor.position.set(x, 0, z); g.hero.actor.setFacing(1); g.facu.jokeCd = 99;
}, [x, z]);
// Anota dónde empezó y dónde terminó el patinazo (cuadro a cuadro)
const track = () => G(() => {
  const g = window.__game; window.__slide = { x0: null, x1: null, on: 0 };
  const tick = () => {
    const h = g.hero;
    if (h.slideT > 0) { if (window.__slide.x0 === null) window.__slide.x0 = h.actor.position.x; window.__slide.x1 = h.actor.position.x; window.__slide.on++; }
    requestAnimationFrame(tick);
  };
  tick();
});
const slideDone = () => until(() => window.__slide.x0 !== null && window.__game.hero.slideT <= 0);
// Tira una mancha de manteca en (x, z) y espera a que exista
const puddle = async (x, z) => {
  await G(([x, z]) => window.__game.butter.drop(x, z), [x, z]);
  await until(() => window.__game.butter.list[0]?.phase === 'puddle');
};
const hero = () => G(() => { const h = window.__game.hero; return { hp: h.hp, x: h.actor.position.x, slideT: h.slideT }; });

try {
  await open(page);
  await startRun(page, 'douge');

  // ---------- La manteca avisa ----------
  await quiet(20);
  const w = await G(async () => {
    const g = window.__game, hx = g.hero.actor.position.x;
    g.butter.drop(hx + 2, 0);
    const b = g.butter.list[0];
    const t0 = performance.now(); let tFlight = null, tPuddle = null, shadow = false;
    while (performance.now() - t0 < 4000) {
      if (b.phase === 'flight') { tFlight ??= performance.now(); if (b.shadow?.visible) shadow = true; }
      if (b.phase === 'puddle') { tPuddle = performance.now(); break; }
      await new Promise(r => setTimeout(r, 16));
    }
    return { ms: tFlight && tPuddle ? tPuddle - tFlight : -1, shadow };
  });
  check(w.shadow, 'durante el vuelo de la barra se ve su sombra');
  check(w.ms >= 800, `la sombra avisa ${Math.round(w.ms)} ms antes de que exista la mancha`);

  // ---------- Pisar la manteca: patina sin dañar, y no se puede caminar ----------
  await quiet(20);
  await track();
  await puddle(22.5, 0);
  await page.keyboard.down('ArrowRight');
  await until(() => window.__game.hero.slideT > 0);
  await page.keyboard.up('ArrowRight');
  await page.keyboard.down('ArrowLeft'); // querer volver no sirve mientras patina
  await slideDone();
  await page.keyboard.up('ArrowLeft');
  const s = await G(() => ({ ...window.__slide, hp: window.__game.hero.hp }));
  check(s.hp === 5, `patinar no saca vida (hp ${s.hp})`);
  check(s.x1 - s.x0 >= 1.5, `patina ${(s.x1 - s.x0).toFixed(2)} m aunque se camine al revés`);

  // ---------- El patinazo frena antes del piquete cerrado ----------
  const gx = await G(() => window.__game.world.gates.find(g => g.kind === 'piquete').x);
  await G(() => {
    const g = window.__game; g.setStage('piquete'); g.traps.disable(); g.butter?.clear();
    g.enemies.list.forEach(e => { e.stun = 99; e.pos.z = 3.4; e.pos.x -= 6; });
    g.hero.hp = g.hero.hpMax = 5; g.hero.inv = 0; g.hero.slideT = 0; g.facu.jokeCd = 99;
  });
  await G((gx) => window.__game.hero.actor.position.set(gx - 4, 0, -1), gx);
  await track();
  await puddle(gx - 1.5, -1);
  await page.keyboard.down('ArrowRight');
  await until(() => window.__game.hero.slideT > 0);
  await page.keyboard.up('ArrowRight');
  await slideDone();
  await page.waitForTimeout(300);
  const hf = await hero();
  const reach = await G(() => 0.95);
  check(hf.hp === 5, `patinar hacia el fuego no quema (hp ${hf.hp})`);
  check(hf.x < gx - reach, `el patinazo frena antes del fuego (x=${hf.x.toFixed(2)}, fuego en ${gx})`);

  // ---------- Lale tira manteca y a veces se resbala ----------
  const lale = (dx = 8) => G((dx) => {
    const g = window.__game; g.setStage('francia-quiet'); g.traps.disable(); g.enemies.clear(); g.butter?.clear();
    g.hero.hp = g.hero.hpMax = 99; g.hero.inv = 0; g.hero.actor.position.set(170, 0, 0); g.facu.jokeCd = 99;
    return g.enemies.spawn(170 + dx, 0, 'lale').hp;
  }, dx);
  const hit = (dmg = 1) => G((dmg) => {
    const g = window.__game, e = g.enemies.list.find(e => e.kind === 'lale');
    e.state = 'walk'; e.stun = 0;
    g.enemies.hitArea({ x: e.pos.x - 1, z: e.pos.z, facing: 1, reach: 2, depth: 1, dmg, knock: 2.5, strength: 1 });
    return { state: e.state, hp: e.hp, lean: e.actor.lean, pose: e.actor.pose };
  }, dmg);
  await G(() => { window.__rand = Math.random; Math.random = () => 0.1; });
  check(await lale() === 4, 'Lale tiene 4 de vida');
  await until(() => window.__game.butter.list.length >= 1, null, 6000);
  check(true, 'en pocos segundos Lale tira al menos una barra de manteca');
  const sl = await hit();
  check(sl.state === 'slipped' && sl.hp === 3, `un golpe y Lale se resbala (estado ${sl.state}, hp ${sl.hp})`);
  check(sl.pose === 'hurt' && Math.abs(sl.lean) > 0.8, `se ve caído (pose ${sl.pose}, inclinación ${sl.lean.toFixed(2)})`);
  await until(() => window.__game.enemies.list[0].state !== 'slipped', null, 4000);
  check(true, 'después de un rato se levanta');

  // No siempre se resbala
  await G(() => { Math.random = () => 0.9; });
  await lale();
  const ns = await hit();
  check(ns.state === 'hitstun', `con mala suerte no se resbala (estado ${ns.state})`);

  // ---------- Puntos de Lale ----------
  await G(() => { Math.random = () => 0.1; });
  await lale();
  const d = await G(() => {
    const g = window.__game; g.score.takeDamage(); // sin combo previo
    const before = g.score.total, e = g.enemies.list.find(e => e.kind === 'lale');
    g.enemies.hitArea({ x: e.pos.x - 1, z: e.pos.z, facing: 1, reach: 2, depth: 1, dmg: 99, knock: 2.5, strength: 1 });
    return g.score.total - before;
  });
  check(d === Math.round(200 * 1.1), `matar a Lale suma 200 × combo (${d})`);
  await G(() => { Math.random = window.__rand; });

  // ---------- Aparece en vereda-2 y en francia, con su cartel ----------
  await G(() => { window.__banners = []; const o = window.__game.banner; window.__game.banner = (...a) => { window.__banners.push(a[0]); return o(...a); }; });
  for (const [id, stage, at] of [['vereda-2', 'vereda', 52], ['francia', 'francia-quiet', 164]]) {
    await G(([id, stage, at]) => {
      const g = window.__game; g.setStage(stage); g.enemies.clear(); g.traps.disable();
      for (const k in g.waves) if (g.waves[k] === 'active') g.waves[k] = 'cleared';
      g.waves[id] = 'idle'; g.hero.hp = g.hero.hpMax = 99; g.hero.actor.position.set(at, 0, 0); g.facu.jokeCd = 99;
      window.__banners.length = 0;
    }, [id, stage, at]);
    await until((id) => window.__game.waves[id] === 'active', id, 3000);
    const r = await G(() => ({ kinds: window.__game.enemies.list.map(e => e.kind), banners: window.__banners.slice() }));
    check(r.kinds.includes('lale'), `en ${id} aparece Lale (${r.kinds.join(', ')})`);
    check(r.banners.some(t => t.includes('LALE')), `en ${id} sale el cartel de LALE «MANTECOSO»`);
  }

  check(errors.length === 0, 'sin errores en consola: ' + errors.join(' | '));
} finally { await browser.close(); }
