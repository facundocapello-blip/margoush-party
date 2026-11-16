import { launch, open, startRun, check } from './harness.mjs';

// Efectos de ataque: estelas de golpe, puños de Douge, sartén en llamas de Marine, estelas de los malos
const clean = (page, x = 170) => page.evaluate((x) => {
  const g = window.__game; g.setStage('francia-quiet'); g.enemies.clear(); g.traps.disable(); g.butter?.clear(); g.powers?.clear();
  g.hero.hp = g.hero.hpMax = 99; g.hero.inv = 0; g.hero.powerCd = 0; g.hero.actor.position.set(x, 0, 0); g.hero.actor.setFacing(1); g.facu.jokeCd = 99;
  for (const k in g.waves) g.waves[k] = 'cleared';
}, x);

async function douge() {
  const { browser, page, errors } = await launch({ viewport: { width: 960, height: 540 } });
  const G = (fn, arg) => page.evaluate(fn, arg);
  try {
    await open(page); await startRun(page, 'douge');

    // Cada golpe dibuja una estela en el aire, aunque no pegue a nadie
    await clean(page);
    for (let i = 0; i < 3; i++) { await page.keyboard.press('j'); await page.waitForTimeout(220); }
    await page.waitForTimeout(400);
    const m = await G(() => ({ ...window.__game.ctx.fx.made }));
    check(m.short >= 1 && m.long >= 1 && m.finisher >= 1, `el combo dibuja estela corta, larga y de remate (${m.short}/${m.long}/${m.finisher})`);
    await page.waitForTimeout(500);
    check(await G(() => window.__game.ctx.fx.count('slash')) === 0, 'las estelas desaparecen solas');

    // Poder de Douge: puños llenos de verdades que atraviesan a los malos
    await clean(page);
    await G(() => {
      const g = window.__game;
      window.__es = [[173, 0], [176.5, 0.2], [163, 0]].map(([x, z]) => { const e = g.enemies.spawn(x, z, 'secuaz'); e.stun = 99; return e; });
    });
    await page.keyboard.press('l');
    await page.waitForTimeout(1800);
    const f = await G(() => ({ made: window.__game.powers.made.fist, live: window.__game.powers.fists.length, hp: window.__es.map(e => e.hp) }));
    check(f.made === 3, `salen 3 puños (${f.made})`);
    check(f.hp[0] < 3, 'el puño le pega al primer malo');
    check(f.hp[1] < 3, 'el puño atraviesa y le pega al de atrás');
    check(f.hp[2] === 3, 'el que está a la espalda no se toca');
    check(f.live === 0, 'los puños desaparecen al terminar su recorrido');

    // Estelas de los malos: golpe del secuaz y rayas de velocidad del patovica
    await clean(page);
    await G(() => window.__game.enemies.spawn(171.4, 0, 'secuaz'));
    await page.waitForFunction(() => window.__game.ctx.fx.made.enemy >= 1, null, { timeout: 9000 });
    check(true, 'el golpe del secuaz dibuja su estela roja');
    await clean(page);
    await G(() => { const e = window.__game.enemies.spawn(176, 0, 'patovica'); e.state = 'ring'; e.t = 0.05; e.dir = -1; });
    await page.waitForFunction(() => window.__game.ctx.fx.made.line >= 3, null, { timeout: 4000 });
    check(true, 'la embestida del patovica deja rayas de velocidad');

    check(errors.length === 0, 'sin errores en consola (Douge): ' + errors.join(' | '));
  } finally { await browser.close(); }
}

async function marine() {
  const { browser, page, errors } = await launch({ viewport: { width: 960, height: 540 } });
  const G = (fn, arg) => page.evaluate(fn, arg);
  try {
    await open(page); await startRun(page, 'marine');
    await clean(page);
    await G(() => {
      const g = window.__game;
      const dentro = g.enemies.spawn(174.5, 0, 'secuaz'); dentro.stun = 99;
      const fuera = g.enemies.spawn(174.5, 3.2, 'secuaz'); fuera.stun = 99;
      window.__in = dentro; window.__out = fuera;
    });
    await page.keyboard.press('l');
    await page.waitForTimeout(1300);
    const f = await G(() => ({ pan: window.__game.powers.made.pan, fires: window.__game.powers.fires.length }));
    check(f.pan === 1, 'Marine tira una sartén');
    check(f.fires === 1, 'la sartén deja fuego en el piso');
    await page.waitForTimeout(1500);
    const hp = await G(() => ({ inside: window.__in.hp, outside: window.__out.hp, hero: window.__game.hero.hp }));
    check(hp.inside <= 1, `el fuego quema al que se queda adentro (hp ${hp.inside})`);
    check(hp.outside === 3, 'al que está afuera del fuego no le pasa nada');
    check(hp.hero === 99, 'el fuego no lastima a Marine');
    await G(() => { window.__game.timeScale = 10; });
    await page.waitForFunction(() => window.__game.powers.fires.length === 0, null, { timeout: 8000 });
    await G(() => { window.__game.timeScale = 1; });
    check(true, 'el fuego se apaga solo');
    check(errors.length === 0, 'sin errores en consola (Marine): ' + errors.join(' | '));
  } finally { await browser.close(); }
}

await douge();
await marine();
