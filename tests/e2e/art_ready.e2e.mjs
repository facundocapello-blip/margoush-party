import { launch, open, startRun, check } from './harness.mjs';

// El juego está listo para las imágenes de la guía AAA: si existen, las usa (con hojas falsas hechas en la página).
const { browser, page, errors } = await launch({ viewport: { width: 960, height: 540 } });
const G = (fn, arg) => page.evaluate(fn, arg);
try {
  await open(page);
  // Hojas falsas: cuadros de colores con el tamaño que deja import_art.py
  await G(() => {
    const a = window.__game.ctx.assets;
    const fake = (name, frames, cols = frames, rows = 1, cellW = 200, cellH = 512) => {
      const c = document.createElement('canvas'); c.width = cellW * cols; c.height = cellH * rows;
      const g = c.getContext('2d');
      for (let i = 0; i < frames; i++) { g.fillStyle = `hsl(${i * 50},70%,50%)`; g.fillRect((i % cols) * cellW + 40, Math.floor(i / cols) * cellH + 40, cellW - 80, cellH - 60); }
      const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding;
      a.add(name, t, { file: name + '.webp', w: c.width, h: c.height, frames, cols, rows, skull: cellW * 0.4, foot: 0.988 });
    };
    fake('lale_walk_sheet', 6); fake('lale_actions_sheet', 4);
    fake('douge_combo_sheet', 3); fake('douge_actions_sheet', 4);
    fake('chaky_walk_sheet', 6); fake('chaky_actions_sheet', 4);
    fake('objetos_sheet', 9, 3, 3, 256, 256);
  });
  await startRun(page, 'douge');

  // Malos: caminan con la tira de 6 cuadros y quedan KO con su pose
  await G(() => { const g = window.__game; g.setStage('francia-quiet'); g.enemies.clear(); g.traps.disable(); for (const k in g.waves) g.waves[k] = 'cleared';
    g.hero.hp = g.hero.hpMax = 99; g.hero.actor.position.set(170, 0, 0); window.__l = g.enemies.spawn(182, 0, 'lale'); });
  const poses = await G(() => Object.keys(window.__l.actor.poses));
  check(poses.includes('walk') && poses.includes('ko'), `Lale toma caminata y KO de las hojas nuevas (${poses.join(', ')})`);
  const frames = await G(async () => { const seen = new Set(); const t0 = performance.now();
    while (performance.now() - t0 < 2000) { const a = window.__l.actor; if (a.pose === 'walk') seen.add(a.frame); await new Promise(r => setTimeout(r, 30)); } return seen.size; });
  check(frames >= 3, `al caminar pasa por los cuadros de la tira (${frames} distintos)`);

  // Héroe: un dibujo por golpe del combo, salto, esquive, golpeado y poder
  const hp = await G(() => Object.keys(window.__game.hero.actor.poses));
  check(['attack1', 'attack2', 'attack3', 'jump', 'dodge', 'hurt', 'power'].every(p => hp.includes(p)), `Douge toma combo y acciones (${hp.join(', ')})`);
  await G(() => window.__game.enemies.clear());
  const seq = await G(async () => { const g = window.__game, out = new Set();
    for (let i = 0; i < 3; i++) { window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyJ' })); window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyJ' }));
      const t0 = performance.now(); while (performance.now() - t0 < 300) { out.add(g.hero.actor.pose); await new Promise(r => setTimeout(r, 15)); } }
    return [...out]; });
  check(seq.includes('attack1') && seq.includes('attack2'), `el combo muestra un dibujo por golpe (${seq.join(', ')})`);

  // BIG CHAKY camina con su tira
  await G(() => window.__game.setStage('galpon'));
  check(await G(() => window.__game.arena.active && window.__game.arena.state.bossTex.startsWith('arena_chaky')), 'BIG CHAKY aparece en su arena con su arte');

  // Objetos: cada uno sale de su cuadro de la grilla
  const it = await G(async () => { const m = await import('/3d/js/items.js'); const t = m.itemTex(window.__game.ctx.assets, 'pelota', '🎾'); return { rx: t.repeat.x, ox: t.offset.x, oy: t.offset.y }; });
  check(Math.abs(it.rx - 1 / 3) < 1e-6 && Math.abs(it.ox - 1 / 3) < 1e-6 && Math.abs(it.oy - 2 / 3) < 1e-6, 'la pelota de pádel sale de su cuadro de la grilla de objetos');

  // Locales famosos en Buenos Aires (dibujados por código hasta que llegue la pintura)
  const lm = await G(() => { const ids = []; window.__game.ctx.scene.traverse(o => { if (o.userData.landmark) ids.push(o.userData.landmark + '@' + Math.round(o.position.x)); }); return ids; });
  check(['punto_de_oro', 'le_ble', 'henris'].every(id => lm.some(s => s.startsWith(id))), `están Punto de Oro, Le Blé y HENRIS (${lm.join(', ')})`);
  check(errors.length === 0, 'sin errores en consola: ' + errors.join(' | '));
} finally { await browser.close(); }
