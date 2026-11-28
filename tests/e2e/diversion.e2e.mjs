// Prueba «como el usuario» de la ronda de diversión: devolver el tiro, punto débil tras la embestida, tachos y bonus LIMPIO.
// Chromium emulado (no Safari físico).
import { launch, open, startRun, check, shot } from './harness.mjs';

const PERFILES = [
  { name: 'chrome', opts: { viewport: { width: 1280, height: 720 } }, touch: false },
  { name: 'celu', opts: { viewport: { width: 430, height: 932 }, mobile: true }, touch: true }
];
for (const P of PERFILES) {
  console.log('== ' + P.name);
  const { browser, page, errors } = await launch(P.opts);
  try {
    await open(page);
    await startRun(page, 'douge');
    const attack = async () => {
      if (P.touch) { const b = await page.locator('#act-attack').boundingBox(); await page.touchscreen.tap(b.x + b.width / 2, b.y + b.height / 2); }
      else await page.keyboard.press('KeyJ');
    };
    const wait = (ms) => page.waitForTimeout(ms);
    await page.evaluate(() => { const g = window.__game; g.hero.hp = g.hero.hpMax = 99; });

    // 1) Devolver el pelotazo: un mozo lanza una medialuna, el héroe la golpea cuando baja
    await page.evaluate(() => {
      const g = window.__game, p = g.hero.actor.position;
      const e = g.enemies.spawn(p.x + 6, p.z, 'mozo'); e.cd = 0; e.hp = e.maxHp = 6; window.__mozo = e;
    });
    let reflected = false, t0 = Date.now();
    while (Date.now() - t0 < 9000 && !reflected) {
      const near = await page.evaluate(() => {
        const g = window.__game, s = g.enemies.shots[0], p = g.hero.actor.position;
        if (!s) return null;
        g.hero.actor.setFacing(window.__mozo.pos.x > p.x ? 1 : -1); // el tiro cae donde está parado
        return { k: s.t / 0.9, refl: !!s.reflected };
      });
      if (near && near.k > 0.4 && near.k < 0.85 && !near.refl) await attack();
      await wait(30);
      reflected = await page.evaluate(() => window.__game.enemies.shots.some(s => s.reflected));
    }
    check(reflected, 'el golpe devolvió el tiro del mozo');
    await shot(page, 'diversion_devuelta_' + P.name);
    const hp0 = await page.evaluate(() => window.__mozo.hp);
    await wait(900);
    const hp1 = await page.evaluate(() => window.__mozo.hp);
    check(hp1 < hp0 || hp1 <= 0, 'la medialuna devuelta lastimó al mozo (' + hp0 + ' → ' + hp1 + ')');

    // 2) Punto débil tras la embestida: daño doble
    await page.evaluate(() => { const g = window.__game; g.enemies.clear(); const e = g.enemies.spawn(g.hero.actor.position.x + 1.1, g.hero.actor.position.z, 'patovica'); e.weak = 1.5; e.hp = e.maxHp = 20; window.__pat = e; g.hero.actor.setFacing(1); });
    await attack(); await wait(400);
    const d = await page.evaluate(() => 20 - window.__pat.hp);
    check(d >= 2, 'golpe al patovica agotado hace daño doble (' + d + ')');

    // 3) Tachos: se rompen en 2 golpes y suelta premios
    const before = await page.evaluate(() => { const g = window.__game, b = g.props.bins.list[0]; const p = g.hero.actor.position; g.enemies.clear(); p.x = b.x - 1; p.z = b.z; g.hero.actor.setFacing(1); return { n: g.props.pickups.list.length, hp: b.hp }; });
    await attack(); await wait(450); await attack(); await wait(450);
    const after = await page.evaluate(() => { const g = window.__game, b = g.props.bins.list[0]; return { n: g.props.pickups.list.length, broken: b.broken }; });
    check(after.broken && after.n > before.n, 'el tacho se rompió y soltó premios (' + before.n + ' → ' + after.n + ')');
    await shot(page, 'diversion_tacho_' + P.name);

    // 4) LIMPIO: despejar un tramo sin que te peguen suma 300
    const s0 = await page.evaluate(() => { const g = window.__game; g.enemies.clear(); const p = g.hero.actor.position; p.x = 23; return g.score.total; });
    await wait(300);
    await page.evaluate(() => { const g = window.__game; for (const e of g.enemies.list) e.hp = 1; g.hero.actor.position.x = g.enemies.list[0]?.pos.x - 1.2 || g.hero.actor.position.x; });
    for (let i = 0; i < 40 && (await page.evaluate(() => window.__game.enemies.alive())) > 0; i++) {
      await page.evaluate(() => { const g = window.__game; const e = g.enemies.list.find(q => q.hp > 0); if (e) { g.hero.actor.position.x = e.pos.x - 1.1; g.hero.actor.position.z = e.pos.z; g.hero.actor.setFacing(1); } });
      await attack(); await wait(120);
    }
    await wait(500);
    const s1 = await page.evaluate(() => window.__game.score.total);
    check(s1 - s0 >= 300, 'bonus LIMPIO sumado (' + s0 + ' → ' + s1 + ')');
    check(errors.length === 0, 'sin errores de consola en ' + P.name + ' ' + JSON.stringify(errors));
  } finally { await browser.close(); }
}
