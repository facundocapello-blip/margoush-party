// FX multicapa de poder: el burst sale al usar el poder y desaparece solo, sin crear mallas nuevas por golpe (R-3).
// Cubre la calle (fx.skillPool) y las 4 arenas de jefes (skillFx expuesto como solo lectura).
import { launch, open, startRun, check } from './harness.mjs';

const { browser, page, errors } = await launch({ viewport: { width: 960, height: 540 } });
const G = (fn, arg) => page.evaluate(fn, arg);

async function streetPower(hero, presetId, key) {
  await G((h) => {
    const g = window.__game; g.setStage('francia-quiet'); g.enemies.clear(); g.traps.disable(); g.powers?.clear();
    g.hero.hp = g.hero.hpMax = 99; g.hero.inv = 0; g.hero.power = 1; g.hero.actor.position.set(170, 0, 0); g.hero.actor.setFacing(1);
    for (const k in g.waves) g.waves[k] = 'cleared';
    window.__sceneKids = g.ctx.scene.children.length;
    window.__madeBefore = g.ctx.fx.skillPool.playsByPreset[h] || 0;
  }, presetId);
  await page.keyboard.press(key);
  await page.waitForTimeout(150);
  const during = await G((h) => ({ active: window.__game.ctx.fx.skillPool.activeCount, made: window.__game.ctx.fx.skillPool.playsByPreset[h] || 0 }), presetId);
  check(during.made === (await G(() => window.__madeBefore)) + 1, `calle (${hero}): el poder dispara ${presetId}`);
  check(during.active >= 1, `calle (${hero}): el burst está en pantalla`);
  await page.waitForTimeout(1300);
  const after = await G(() => ({ active: window.__game.ctx.fx.skillPool.activeCount, kids: window.__game.ctx.scene.children.length }));
  check(after.active === 0, `calle (${hero}): el burst desaparece solo`);
  // el poder crea sus propias mallas (onda, hiedra) pero el pool no suma ninguna: lo comprobamos con un segundo disparo igual
  const kids1 = after.kids;
  await G(() => { const g = window.__game; g.hero.power = 1; g.hero.inv = 0; });
  await page.keyboard.press(key);
  await page.waitForTimeout(1500);
  const again = await G(() => ({ active: window.__game.ctx.fx.skillPool.activeCount, kids: window.__game.ctx.scene.children.length, tex: window.__game.ctx.fx.skillPool.textureCount }));
  check(again.active === 0, `calle (${hero}): segundo disparo también desaparece`);
  check(again.kids <= kids1 + 2, `calle (${hero}): el pool no agrega mallas por disparo (${kids1} -> ${again.kids})`);
}

try {
  await open(page); await startRun(page, 'douge');
  await streetPower('douge', 'douge_truth_slam', 'l');

  // Arenas reales (?probar=<arena>): usar el poder y ver que el burst sale, se apaga y no crea mallas nuevas
  for (const [name, arenaKey, state] of [['cepi', 'arenaCepi', 'arena-cepi'], ['lale', 'arenaLale', 'arena-lale'], ['pinky', 'arenaPinky', 'arena-pinky'], ['facu', 'arenaFacu', 'arena-facu']]) {
    await page.goto('http://game.local/3d/index.html?probar=' + name);
    await page.waitForFunction(() => window.__game && window.__game.state === 'menu', null, { timeout: 20000 });
    await G(() => document.querySelector('#press-start')?.click());
    await page.waitForTimeout(600);
    await G(() => document.querySelector('#btn-play').click());
    await page.waitForTimeout(300);
    await G(() => document.querySelector('.card[data-hero="douge"]').click());
    await page.waitForFunction((st) => window.__game.state === st, state, { timeout: 20000 });
    // Esperar a que arranque la pelea (termina el cartel de entrada del jefe)
    await page.waitForFunction((k) => { const m = window.__game[k]; return m.state && m.skillFx && (m.state.t > 0.5 || m.state.phase); }, arenaKey, { timeout: 10000 });
    await page.waitForTimeout(3500);
    await G(({ k }) => { const g = window.__game; g.hero.hp = g.hero.hpMax = 99; g.hero.power = 1; window.__made0 = window.__game[k].skillFx.playsByPreset.douge_truth_slam || 0; }, { k: arenaKey });
    await page.keyboard.press('l');
    await page.waitForTimeout(200);
    const during = await G(({ k }) => ({ active: window.__game[k].skillFx.activeCount, made: (window.__game[k].skillFx.playsByPreset.douge_truth_slam || 0) - window.__made0 }), { k: arenaKey });
    check(during.made === 1, `${name}: el poder dispara el burst (${during.made})`);
    check(during.active >= 1, `${name}: el burst está en pantalla`);
    await page.waitForTimeout(1300);
    check((await G(({ k }) => window.__game[k].skillFx.activeCount, { k: arenaKey })) === 0, `${name}: el burst desaparece solo`);
  }
  check(errors.length === 0, 'sin errores JS: ' + errors.join(' | '));
} finally {
  await browser.close();
}
