import { launch, open, startRun, check } from './harness.mjs';

// Efectos de ataque: estelas de golpe, puños de Douge, sartén en llamas de Marine, estelas de los malos
const clean = (page, x = 170) => page.evaluate((x) => {
  const g = window.__game; g.setStage('francia-quiet'); g.enemies.clear(); g.traps.disable(); g.butter?.clear(); g.powers?.clear();
  g.hero.hp = g.hero.hpMax = 99; g.hero.inv = 0; g.hero.power = 1; g.hero.actor.position.set(x, 0, 0); g.hero.actor.setFacing(1); g.facu.jokeCd = 99;
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

    // Poder de Douge: «¡VERDADES A LOS GRITOS!», onda en círculo que voltea a todos alrededor (también a los de atrás)
    await clean(page);
    await G(() => {
      const g = window.__game;
      window.__es = [[172.5, 0], [167.5, 0.4], [170, 1.6], [178, 0]].map(([x, z]) => { const e = g.enemies.spawn(x, z, 'secuaz'); e.stun = 99; return e; });
    });
    await page.keyboard.press('l');
    await page.waitForTimeout(900);
    const f = await G(() => ({ made: window.__game.powers.made.wave, live: window.__game.powers.waves.length, hp: window.__es.map(e => e.hp), pw: window.__game.hero.power }));
    check(f.made === 1, 'sale la onda de verdades');
    check(f.hp[0] < 3 && f.hp[1] < 3 && f.hp[2] < 3, `voltea a los de adelante, atrás y al costado (${f.hp.join('/')})`);
    check(f.hp[3] === 3, 'al que está lejos no lo toca');
    check(f.pw === 0, 'usar el poder vacía la barra');
    check(f.live === 0, 'la onda desaparece sola');
    await page.keyboard.press('l');
    await page.waitForTimeout(300);
    check(await G(() => window.__game.powers.made.wave) === 1, 'con la barra vacía no sale otro poder');

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
      const dentro = g.enemies.spawn(171.2, 0, 'secuaz'); dentro.stun = 99;
      const fuera = g.enemies.spawn(176.5, 3.2, 'secuaz'); fuera.stun = 99;
      window.__in = dentro; window.__out = fuera;
    });
    await G(() => { window.__game.hero.hp = 3; window.__game.hero.hpMax = 5; });
    await page.keyboard.press('l');
    await page.waitForFunction(() => window.__game.hero.hp > 3, null, { timeout: 5000 }).catch(() => {});
    const f = await G(() => ({ fl: window.__game.powers.made.flambe, fires: window.__game.powers.fires.length, stun: window.__in.stun, hero: window.__game.hero.hp }));
    check(f.fl === 1, 'Marine hace el flambé');
    check(f.fires === 1, 'queda fuego en el piso alrededor');
    check(f.hero === 4, `el croissant le devuelve 1 corazón (hp ${f.hero})`);
    await page.waitForTimeout(1500);
    const hp = await G(() => ({ inside: window.__in.hp, outside: window.__out.hp }));
    check(hp.inside <= 1, `el fuego quema al que se queda adentro (hp ${hp.inside})`);
    check(hp.outside === 3, 'al que está lejos no le pasa nada');
    await G(() => { window.__game.timeScale = 10; });
    await page.waitForFunction(() => window.__game.powers.fires.length === 0, null, { timeout: 8000 });
    await G(() => { window.__game.timeScale = 1; });
    check(true, 'el fuego se apaga solo');
    check(errors.length === 0, 'sin errores en consola (Marine): ' + errors.join(' | '));
  } finally { await browser.close(); }
}

await douge();
await marine();
