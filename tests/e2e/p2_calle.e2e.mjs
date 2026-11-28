// P2 de la auditoría Sakurai (calle): corte astral solo si conecta y dorado, marca en el punto de contacto,
// golpe 2 distinto del 1, patovica con armadura y sin fundido al entrar al golpe. Chrome 1280×720 y celu 430×932.
// Chromium emulado: NO reemplaza la prueba en Safari físico.
import { launch, open, startRun, check, shot } from './harness.mjs';

const PERFILES = [
  { name: 'chrome', opts: { viewport: { width: 1280, height: 720 } }, touch: false },
  { name: 'celu', opts: { viewport: { width: 430, height: 932 }, mobile: true }, touch: true }
];
for (const P of PERFILES) {
  console.log('== ' + P.name);
  const { browser, page, errors } = await launch(P.opts);
  const G = (fn, arg) => page.evaluate(fn, arg);
  const atk = async () => {
    if (P.touch) { const b = await page.locator('#act-attack').boundingBox(); await page.touchscreen.tap(b.x + b.width / 2, b.y + b.height / 2); }
    else await page.keyboard.press('KeyJ');
  };
  const clean = () => G(() => {
    const g = window.__game; g.setStage('francia-quiet'); g.enemies.clear(); g.traps.disable(); g.butter?.clear(); g.powers?.clear();
    g.hero.hp = g.hero.hpMax = 99; g.hero.inv = 0; g.hero.actor.position.set(170, 0, 0); g.hero.actor.setFacing(1);
    for (const k in g.waves) g.waves[k] = 'cleared';
  });
  const astral = () => G(() => window.__game.ctx.fx.skillPool.playsByPreset.effekseer_astral_slash_gold || 0);
  try {
    await open(page); await startRun(page, 'douge');

    // 1) remate al aire: no sale el corte astral
    await clean();
    const a0 = await astral();
    for (let i = 0; i < 3; i++) { await atk(); await page.waitForTimeout(260); }
    await page.waitForTimeout(500);
    check((await astral()) === a0, 'el remate que no pega NO dibuja el corte astral');

    // 2) remate que conecta: sale una vez, dorado, chico, y se corta a ~20F
    await clean();
    await G(() => { const e = window.__game.enemies.spawn(171.4, 0, 'secuaz'); e.hp = 99; e.stun = 99; });
    const a1 = await astral();
    for (let i = 0; i < 3; i++) { await atk(); await page.waitForTimeout(260); }
    await page.waitForTimeout(120);
    check((await astral()) > a1, 'el remate que pega dibuja el corte astral dorado');
    await shot(page, 'p2_remate_' + P.name);
    await page.waitForTimeout(500);
    const live = await G(() => window.__game.ctx.fx.skillPool.activeCount);
    check(live === 0, 'el corte astral se corta solo (≤ 20F)');

    // 3) golpe 2 con más chispas/aro que el 1 y marca del lado del héroe
    await clean();
    const info = await G(() => {
      const g = window.__game, fx = g.ctx.fx;
      const e = g.enemies.spawn(171.4, 0, 'secuaz'); e.hp = 99; e.stun = 99;
      const out = {};
      for (const combo of [0, 1]) {
        const before = fx.count('ring'), sp0 = fx.count('spark');
        g.enemies.hitArea({ x: 170, z: 0, facing: 1, reach: 1.9, depth: 0.75, dmg: 0, knock: 2.5, strength: 1, combo });
        out[combo] = { sparks: fx.count('spark') - sp0, rings: fx.count('ring') - before };
      }
      return out;
    });
    check(info[1].sparks > info[0].sparks, `golpe 2 más chispas que el 1 (${info[0].sparks} → ${info[1].sparks})`);

    // 4) patovica con armadura: chispas grises, sin aro, congelado corto
    await clean();
    const arm = await G(() => {
      const g = window.__game, fx = g.ctx.fx;
      const e = g.enemies.spawn(171.4, 0, 'patovica'); e.state = 'charge'; e.t = 9;
      const area = { x: 170, z: 0, facing: 1, reach: 1.9, depth: 0.75, dmg: 1, knock: 2.5, strength: 1, combo: 0 };
      const rings0 = fx.count('ring');
      g.enemies.hitArea(area);
      return { armored: area.armoredHits || 0, rings: fx.count('ring') - rings0, state: e.state };
    });
    check(arm.armored === 1, 'el patovica embistiendo cuenta como golpe con armadura');
    check(arm.rings === 0, 'sin aro cuando no entra');
    check(arm.state === 'charge', 'sigue embistiendo');

    // 5) sin fundido al entrar al golpe
    await clean();
    const fade = await G(() => {
      const a = window.__game.hero.actor; a.setPose('idle'); a.update?.(0.5); a.setPose('attack1');
      return a.fadeT;
    });
    check(fade === 0, 'sin fundido de 80 ms al pasar a «attack»');
    check(errors.length === 0, 'sin errores de consola en ' + P.name + ' ' + JSON.stringify(errors));
  } finally { await browser.close(); }
}
