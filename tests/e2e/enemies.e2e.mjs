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
