import { launch, open, startRun, check, shot } from './harness.mjs';

const { browser, page, errors } = await launch({ viewport: { width: 960, height: 540 } });
const G = (fn, arg) => page.evaluate(fn, arg);
const until = (fn, arg, ms = 6000) => page.waitForFunction(fn, arg, { timeout: ms, polling: 16 });
// Calle francesa despejada, héroe inmortal en x=170, y un malo del tipo pedido
const solo = (kind, dx = 3, dz = 0) => G(([kind, dx, dz]) => {
  const g = window.__game; g.setStage('francia-quiet'); g.traps?.disable?.(); g.enemies.clear();
  g.hero.hp = g.hero.hpMax = 99; g.hero.inv = 0; g.hero.actor.position.set(170, 0, 0); g.facu.jokeCd = 99;
  const e = g.enemies.spawn(170 + dx, dz, kind); e.cd = 0; return e.hp;
}, [kind, dx, dz]);
const E = () => G(() => { const e = window.__game.enemies.list[0]; return e && { state: e.state, t: e.t, hp: e.hp, x: e.pos.x }; });
try {
  await open(page);
  await startRun(page, 'douge');

  // Cada tipo tiene su propio dibujo
  const imgs = await G(() => {
    const g = window.__game; g.setStage('francia-quiet'); g.enemies.clear();
    return ['secuaz', 'patovica', 'bombo', 'mozo', 'delivery'].map((k, i) => g.enemies.spawn(165 + i * 2.5, 0, k).actor.poses.idle.tex.image);
  }).then(() => G(() => new Set(window.__game.enemies.list.map(e => e.actor.poses.idle.tex.image)).size));
  check(imgs === 5, `cinco malos, cinco dibujos distintos (${imgs})`);
  await G(() => { window.__game.enemies.list.forEach(e => { e.stun = 99; }); window.__game.hero.actor.position.set(169, 0, 2.5); });
  await page.waitForTimeout(600);
  await shot(page, 'enemies-lineup');

  // El patovica aguanta 7 golpes
  await solo('patovica');
  const hits = await G(() => { const g = window.__game, e = g.enemies.list[0]; let n = 0; while (e.hp > 0 && n < 20) { e.state = 'walk'; g.enemies.hitArea({ x: e.pos.x - 1, z: e.pos.z, facing: 1, reach: 2, depth: 1, dmg: 1, knock: 0, strength: 1 }); n++; } return n; });
  check(hits === 7, `el patovica cae con 7 golpes (${hits})`);

  // El del bombo aturde si te agarra en el piso…
  await solo('bombo', 2.5);
  await until(() => window.__game.enemies.list[0].state === 'drum');
  const warnStart = Date.now();
  await until(() => window.__game.enemies.list[0].state !== 'drum');
  check(Date.now() - warnStart >= 800, `el bombo avisa ${Date.now() - warnStart} ms antes`);
  check(await G(() => window.__game.hero.stunT) > 0, 'el bombo aturde si estás cerca y en el piso');
  // …pero no si saltás a tiempo
  await solo('bombo', 2.5);
  await until(() => { const e = window.__game.enemies.list[0]; return e.state === 'drum' && e.t > 0.6; });
  await G(() => { const h = window.__game.hero; h.vy = 8.5; h.lift = 0.001; });
  await until(() => window.__game.enemies.list[0].state !== 'drum');
  check(await G(() => window.__game.hero.stunT) === 0, 'saltando el bombazo no te aturde');

  // El mozo: el croissant cae donde marcó la sombra
  await solo('mozo', 7);
  await until(() => window.__game.enemies.shots.length > 0);
  const tgt = await G(() => { const s = window.__game.enemies.shots[0]; return { x: s.target.x, z: s.target.z, mark: s.mark.visible }; });
  check(tgt.mark && Math.abs(tgt.x - 170) < 0.3, 'el croissant marca dónde va a caer');
  const hp1 = await G(() => window.__game.hero.hp);
  await until(() => window.__game.enemies.shots.length === 0, null, 3000);
  check(await G(() => window.__game.hero.hp) === hp1 - 1, 'quedarse en la marca duele');
  await solo('mozo', 7);
  await until(() => window.__game.enemies.shots.length > 0);
  await G(() => window.__game.hero.actor.position.z = 2.2);
  const hp2 = await G(() => window.__game.hero.hp);
  await until(() => window.__game.enemies.shots.length === 0, null, 3000);
  check(await G(() => window.__game.hero.hp) === hp2, 'salir de la marca lo esquiva');

  // El delivery: timbre y franja antes de embestir
  await solo('delivery', 8);
  await until(() => window.__game.enemies.list[0].state === 'ring');
  const ringAt = Date.now();
  const hp3 = await G(() => window.__game.hero.hp);
  await until(() => window.__game.enemies.list[0].state === 'charge');
  check(Date.now() - ringAt >= 800, `el delivery avisa ${Date.now() - ringAt} ms antes`);
  await until(() => window.__game.enemies.list[0].state === 'dizzy', null, 3000);
  check(await G(() => window.__game.hero.hp) === hp3 - 1, 'el delivery atropella al que se queda en el carril');
  await solo('delivery', 8);
  await until(() => window.__game.enemies.list[0].state === 'charge');
  await page.keyboard.press('KeyK');
  const hp4 = await G(() => window.__game.hero.hp);
  await until(() => window.__game.enemies.list[0].state === 'dizzy', null, 3000);
  check(await G(() => window.__game.hero.hp) === hp4, 'esquivar a tiempo evita al delivery');

  // ---------- Personalidad de cada malo ----------
  // Oleada grande: como mucho 2 de cerca y 1 de lejos atacando a la vez
  await G(() => { const g = window.__game; g.setStage('boulevard'); g.traps.disable(); g.hero.hp = g.hero.hpMax = 99; g.facu.jokeCd = 99; });
  const peak = await G(() => new Promise((res) => {
    const g = window.__game; let m = 0, r = 0; if (typeof g.enemies.attacking !== 'function') return res({ m: -1, r: -1 });
    const id = setInterval(() => { const a = g.enemies.attacking(); m = Math.max(m, a.melee); r = Math.max(r, a.ranged); }, 50);
    setTimeout(() => { clearInterval(id); res({ m, r }); }, 8000);
  }));
  check(peak.m >= 1 && peak.m <= 2 && peak.r <= 1, `oleada grande respeta turnos (cerca ${peak.m}, lejos ${peak.r})`);

  // Los que esperan miran al héroe y no tiemblan
  await G(() => { const g = window.__game; g.setStage('francia-quiet'); g.traps.disable(); g.enemies.clear(); g.facu.jokeCd = 99;
    g.hero.hp = 99; g.hero.inv = 999; g.hero.actor.position.set(170, 0, 0);
    for (const [x, z, k] of [[174, -1, 'secuaz'], [175, 1, 'secuaz'], [166, 0.5, 'secuaz'], [176, 0, 'patovica'], [165, -1.5, 'patovica']]) g.enemies.spawn(x, z, k); });
  await page.waitForTimeout(2000);
  const waits = await G(() => new Promise((res) => {
    // Por malo: tiempo esperando, cuántas veces cambia de sentido mientras espera (temblor) y si siempre mira al héroe
    const g = window.__game, h = g.hero.actor.position, track = new Map();
    const id = setInterval(() => { for (const e of g.enemies.list) { const t = track.get(e) || { time: 0, flips: 0, dir: 0, faced: true, last: null };
      if (e.state === 'wait') {
        if (t.last) { t.time += 0.05; const step = e.pos.x - t.last.x; if (Math.abs(step) > 0.04) { const d = Math.sign(step); if (t.dir && d !== t.dir) t.flips++; t.dir = d; } }
        t.last = { x: e.pos.x }; if (e.actor.facing !== Math.sign(h.x - e.pos.x)) t.faced = false;
      } else { t.last = null; t.dir = 0; }
      track.set(e, t); } }, 50);
    setTimeout(() => { clearInterval(id); res([...track.values()].map(t => ({ time: +t.time.toFixed(2), flips: t.flips, faced: t.faced }))); }, 3000);
  }));
  check(waits.reduce((s, w) => s + w.time, 0) >= 4 && waits.every(w => w.faced && w.flips <= 2), `los que esperan miran al héroe y no tiemblan ${JSON.stringify(waits)}`);

  // El patovica anuncia la embestida y te lleva puesto si te quedás en el carril
  await solo('patovica', 6);
  await G(() => { window.__game.hero.inv = 0; });
  await until(() => window.__game.enemies.list[0].lane?.visible);
  const laneAt = Date.now();
  const hp5 = await G(() => window.__game.hero.hp);
  await until(() => window.__game.enemies.list[0].state === 'charge', null, 3000);
  check(Date.now() - laneAt >= 800, `el patovica anuncia la embestida ${Date.now() - laneAt} ms antes`);
  await until(() => window.__game.enemies.list[0].state !== 'charge', null, 3000);
  check(await G(() => window.__game.hero.hp) === hp5 - 1, 'la embestida del patovica pega al que se queda en el carril');
  await solo('patovica', 6);
  await until(() => window.__game.enemies.list[0].state === 'charge', null, 4000);
  await page.keyboard.press('KeyK');
  const hp6 = await G(() => window.__game.hero.hp);
  await until(() => window.__game.enemies.list[0].state !== 'charge', null, 3000);
  check(await G(() => window.__game.hero.hp) === hp6, 'esquivar a tiempo evita la embestida');

  // El secuaz busca pegarte por la espalda
  let behind = 0;
  for (let i = 0; i < 3 && !behind; i++) {
    await solo('secuaz', 2.5);
    await G(() => { const g = window.__game; g.hero.inv = 999; g.hero.actor.setFacing(1); });
    await until(() => window.__game.enemies.list[0].state === 'windup', null, 6000);
    if (await G(() => { const g = window.__game, e = g.enemies.list[0]; return Math.sign(e.pos.x - g.hero.actor.position.x) === -g.hero.actor.facing; })) behind++;
  }
  check(behind >= 1, 'el secuaz rodea para pegar por la espalda');

  // El del bombo camina a los saltos, al ritmo
  await solo('bombo', 10);
  await G(() => { window.__game.enemies.list[0].cd = 99; });
  const hops = await G(() => new Promise((res) => {
    const e = window.__game.enemies.list[0]; let n = 0, up = false;
    const id = setInterval(() => { const l = e.actor.lift; if (l > 0.18 && !up) { n++; up = true; } else if (l < 0.05) up = false; }, 16);
    setTimeout(() => { clearInterval(id); res(n); }, 2000);
  }));
  check(hops >= 3, `el bombo salta al ritmo (${hops} saltos en 2 s)`);

  // ---------- Poses por hoja (dibujos nuevos) ----------
  // Una hoja de prueba de 4 cuadros para el secuaz: el juego la usa en lugar del dibujo viejo
  await G(() => {
    const c = document.createElement('canvas'); c.width = 400; c.height = 100;
    const x = c.getContext('2d'); ['#f00', '#0f0', '#00f', '#ff0'].forEach((col, i) => { x.fillStyle = col; x.fillRect(i * 100 + 30, 10, 40, 90); });
    window.__game.ctx.assets.add('secuaz_sheet', new THREE.CanvasTexture(c), { file: 'x', w: 400, h: 100, frames: 4, cols: 4, rows: 1 });
  });
  const posesSeen = async (ms) => G((ms) => new Promise((res) => { const e = window.__game.enemies.list[0], seen = new Set();
    const id = setInterval(() => seen.add(e.actor.pose), 16); setTimeout(() => { clearInterval(id); res([...seen]); }, ms); }), ms);
  await solo('secuaz', 9);
  check(await G(() => Object.keys(window.__game.enemies.list[0].actor.poses).join()) === 'idle,step,strike,hurt', 'con hoja nueva, el secuaz tiene sus 4 poses');
  await G(() => { window.__game.hero.inv = 999; });
  const walkPoses = await posesSeen(900);
  check(walkPoses.includes('idle') && walkPoses.includes('step'), `caminando alterna parado y paso (${walkPoses})`);
  await until(() => window.__game.enemies.list[0].state === 'windup', null, 6000);
  check(await G(() => { const e = window.__game.enemies.list[0]; return e.actor.pose === 'idle' && e.actor.lean > 0; }), 'al anunciar el golpe toma impulso para atrás');
  await until(() => window.__game.enemies.list[0].state === 'strike', null, 3000);
  check(await G(() => window.__game.enemies.list[0].actor.pose) === 'strike', 'al pegar usa la pose de golpe');
  await G(() => { const g = window.__game, e = g.enemies.list[0]; e.hp = 99; g.enemies.hitArea({ x: e.pos.x - 1, z: e.pos.z, facing: 1, reach: 2, depth: 1, dmg: 1, knock: 0, strength: 1 }); });
  await page.waitForTimeout(50);
  check(await G(() => window.__game.enemies.list[0].actor.pose) === 'hurt', 'golpeado usa la pose de golpeado');
  await G(() => { const g = window.__game; g.enemies.clear(); g.hero.inv = 0; });
  check(await G(() => Object.keys(window.__game.enemies.spawn(170, 0, 'mozo').actor.poses).length) === 4 && await G(() => window.__game.enemies.list[0].actor.poses.idle.tex.image === window.__game.enemies.list[0].actor.poses.strike.tex.image), 'sin hoja nueva, el mozo sigue con su dibujo de siempre');
  await G(() => window.__game.enemies.clear());

  // Puntos por tipo
  const pts = await G(() => {
    const g = window.__game, out = {};
    for (const k of ['secuaz', 'patovica', 'bombo', 'mozo', 'delivery']) {
      g.enemies.clear(); g.score.takeDamage();
      const e = g.enemies.spawn(175, 0, k); const before = g.score.total;
      e.hp = 1; g.enemies.hitArea({ x: 174, z: 0, facing: 1, reach: 2, depth: 1, dmg: 1, knock: 0, strength: 1 });
      out[k] = g.score.total - before;
    }
    return out;
  });
  // el golpe ya sube el combo a ×1.1 antes de contar la baja
  check(pts.secuaz === 110 && pts.patovica === 275 && pts.bombo === 220 && pts.mozo === 220 && pts.delivery === 220, 'puntos por tipo ' + JSON.stringify(pts));

  check(errors.length === 0, 'sin errores de consola ' + JSON.stringify(errors));
} finally {
  await browser.close();
}
