// R-2: Fugas de memoria al entrar y salir de las 5 arenas, la persecución, el bonus BYD y las cinemáticas.
// Renderiza varios cuadros dentro de cada escena para forzar la subida de geometrías y texturas a WebGL,
// llama a dispose() y verifica que renderer.info.memory vuelva a <= 110 % tras recorrer todo.
import { launch, check } from './harness.mjs';

const G = (page, fn, arg) => page.evaluate(fn, arg);
const { browser, page, errors } = await launch({ viewport: { width: 430, height: 932 }, mobile: true });

try {
  await page.goto('http://game.local/3d/index.html');
  await page.waitForFunction(() => window.__game && window.__game.state === 'menu', null, { timeout: 25000 });

  await G(page, () => window.__game.quickStart('douge'));
  await page.waitForFunction(() => window.__game.state === 'playing', null, { timeout: 15000 });
  await page.waitForTimeout(300);

  // Precargamos los prefijos diferidos
  await G(page, async () => {
    await window.__game.ctx.assets.ensure([
      'arena_chaky_dance_', 'arena_fondo', 'arena_aeropuerto_fondo', 'douge_dance_sheet',
      'arena_cepi_', 'arena_lale_', 'arena_pinky_', 'arena_facu_', 'arena_margot_',
      'arena_douge_back_', 'chase_', 'byd_broken_',
      'cepi_walk_sheet', 'lale_walk_sheet', 'lale_actions_sheet', 'pinky_walk_sheet', 'pinky_actions_sheet', 'chaky_', 'facu'
    ]);
  });

  const runCycle = async (name) => G(page, (n) => {
    const g = window.__game;
    const before = g.memory();
    const map = { chaky: g.arena, cepi: g.arenaCepi, lale: g.arenaLale, pinky: g.arenaPinky, facu: g.arenaFacu, chase: g.chase, byd: g.bonus };
    const mod = map[n];
    mod.start();
    // Renderizar varios cuadros para que Three.js suba las geometrías/texturas a GPU
    for (let i = 0; i < 6; i++) { mod.update(0.05); mod.render(); }
    // Pool de FX multicapa de la arena: disparar 4 presets y renderizar para que sus texturas suban a GPU
    // (si no se dispara nada, el pool nunca sube nada y esta prueba no lo vería)
    const pool = mod.skillFx || null;
    let poolPeak = null;
    if (pool) {
      for (const id of ['douge_truth_slam', 'cepi_golden_smash', 'lale_oven_flare', 'margot_hero_cry']) pool.play(id, { x: 0, y: 1.6, z: -2 }, { worldSize: 3 });
      for (let i = 0; i < 3; i++) { mod.update(0.05); mod.render(); }
      poolPeak = { tex: pool.textureCount, active: pool.activeCount };
    }
    const peak = g.memory();
    mod.dispose();
    const after = g.memory();
    return { before, peak, after, poolPeak, poolAfter: pool ? { tex: pool.textureCount, active: pool.activeCount } : null };
  }, name);

  const modes = ['chaky', 'cepi', 'lale', 'pinky', 'facu', 'chase', 'byd'];

  // Pasada 1: calienta texturas compartidas de assets.js en GPU
  for (const m of modes) {
    const r = await runCycle(m);
    console.log(`[warm] ${m}: geo ${r.before.geometries}->${r.peak.geometries}->${r.after.geometries}, tex ${r.before.textures}->${r.peak.textures}->${r.after.textures}`);
  }

  const base = await G(page, () => window.__game.memory());
  console.log('BASE after warm:', base);

  // Pasada 2: cada entrada+salida debe liberar el 100 % de sus recursos propios
  const leaks = [];
  for (const m of modes) {
    const r = await runCycle(m);
    const dg = r.after.geometries - r.before.geometries;
    const dt = r.after.textures - r.before.textures;
    console.log(`[pass2] ${m}: geo ${r.before.geometries}->${r.peak.geometries}->${r.after.geometries} (d=${dg}), tex ${r.before.textures}->${r.peak.textures}->${r.after.textures} (d=${dt})`);
    if (dg > 0 || dt > 0) leaks.push(`${m}(geo+${dg},tex+${dt})`);
    if (r.poolPeak) {
      console.log(`        pool FX: texturas ${r.poolPeak.tex} activos ${r.poolPeak.active} -> al salir ${r.poolAfter.tex}/${r.poolAfter.active}`);
      if (r.poolPeak.tex < 4 || r.poolPeak.active < 1) leaks.push(`${m}(el pool no llegó a subir sus texturas: ${r.poolPeak.tex} tex, ${r.poolPeak.active} activos)`);
      if (r.poolAfter.tex !== 0 || r.poolAfter.active !== 0) leaks.push(`${m}(pool FX retiene ${r.poolAfter.tex} tex / ${r.poolAfter.active} activos tras dispose)`);
    }
  }

  const end = await G(page, () => window.__game.memory());
  // También probamos cinemáticas (pre_chaky, pre_cepi, pre_lale, pre_pinky, post_pinky)
  const cineMem = await G(page, () => {
    const g = window.__game;
    const before = g.memory();
    for (const k of ['pre_chaky', 'pre_cepi', 'pre_lale', 'pre_pinky', 'post_pinky']) {
      g.story.startIntro(g.hero, 'douge', k);
      for (let i = 0; i < 4; i++) g.story.updateIntro(0.15);
      g.story.endIntro();
    }
    return { before, after: g.memory() };
  });
  console.log('CINE:', cineMem.before, '->', cineMem.after);
  console.log('END:', end, 'ratios:', (end.geometries / base.geometries).toFixed(3), (end.textures / base.textures).toFixed(3), 'leaks:', leaks);
  check(cineMem.after.geometries <= Math.ceil(cineMem.before.geometries * 1.1), `cine geometries <= 110%`);
  check(end.geometries <= Math.ceil(base.geometries * 1.1), `geometries <= 110% (${end.geometries} vs base ${base.geometries})`);
  check(end.textures <= Math.ceil(base.textures * 1.1), `textures <= 110% (${end.textures} vs base ${base.textures})`);
  check(leaks.length === 0, 'sin fugas por arena: ' + leaks.join(', '));
  check(errors.length === 0, 'sin errores JS: ' + errors.join(' | '));
} finally {
  await browser.close();
}
