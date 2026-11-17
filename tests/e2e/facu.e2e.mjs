import { launch, open, startRun, check, shot } from './harness.mjs';

// Facu aparece de golpe y en chiste: alcantarilla (aturde), auto a toda velocidad, Francia y el resultado.
const { browser, page, errors } = await launch({ viewport: { width: 960, height: 540 } });
const G = (fn, arg) => page.evaluate(fn, arg);
const until = (fn, arg, ms = 6000) => page.waitForFunction(fn, arg, { timeout: ms, polling: 30 });
try {
  await open(page);
  await startRun(page, 'marine');
  check(await G(() => !window.__game.facu.car.visible && !window.__game.facu.actor.mesh.visible), 'Facu ya no acompaña en su auto toda la partida');

  // ---------- Alcantarilla: con 2 malos cerca sale, tira el chiste (aturde) y se vuelve a meter ----------
  await G(() => { const g = window.__game; g.setStage('francia-quiet'); g.enemies.clear(); g.traps.disable(); for (const k in g.waves) g.waves[k] = 'cleared';
    g.hero.hp = g.hero.hpMax = 99; g.hero.actor.position.set(170, 0, 0); [[172, 0], [168, 0.5]].forEach(([x, z]) => g.enemies.spawn(x, z, 'pinky'));
    g.facu.reset(); g.facu.jokeCd = 0; g.facu.lastJokeStuns = 0; });
  await until(() => window.__game.facu.appearing === 'hole');
  check(true, 'Facu sale de la alcantarilla cuando te rodean');
  await until(() => window.__game.facu.lastJokeStuns >= 2);
  check(true, 'el chiste aturde a los malos de alrededor');
  await shot(page, 'facu-alcantarilla');
  await until(() => window.__game.facu.appearing === null, null, 6000);
  check(await G(() => !window.__game.facu.actor.mesh.visible), 'después se vuelve a meter y desaparece');
  await G(() => { window.__game.enemies.list.forEach(e => { e.stun = 0; }); window.__game.facu.lastJokeStuns = 0; });
  await page.waitForTimeout(1500);
  check(await G(() => window.__game.facu.appearing) === null, 'la alcantarilla sale una sola vez por nivel');

  // ---------- Auto a toda velocidad: cruza por atrás tocando bocina ----------
  await G(() => { const g = window.__game; g.enemies.clear(); g.facu.reset(); g.facu.jokeCd = 0; g.hero.actor.position.set(200, 0, 0); });
  await until(() => window.__game.facu.appearing === 'drive');
  const z = await G(() => window.__game.facu.car.position.z);
  check(z <= -3.9, `el auto cruza por el carril de atrás (z ${z.toFixed(2)})`);
  await until(() => window.__game.facu.appearing === null, null, 6000);
  check(await G(() => !window.__game.facu.car.visible), 'el auto se va y no vuelve a acompañar');

  // ---------- Francia: boina y baguette ----------
  await G(() => window.__game.facu.france(window.__game.hero.actor.position.x + 3));
  check(await G(() => window.__game.facu.appearing === 'france'), 'al pasar a Francia aparece con boina y baguette');
  await until(() => window.__game.facu.appearing === null, null, 6000);

  // ---------- Facu no pelea ----------
  await G(() => { const g = window.__game; g.setStage('piquete'); g.traps.disable(); g.hero.hp = g.hero.hpMax = 99; g.enemies.list.forEach(e => e.hp = 50); });
  const start = await G(() => window.__game.enemies.list.reduce((s, e) => s + e.hp, 0));
  await page.waitForTimeout(3000);
  check(await G(() => window.__game.enemies.list.reduce((s, e) => s + e.hp, 0)) === start, 'Facu no se mete a pegar');

  // ---------- Resultado: asoma y dice una frase (no presenta el puntaje) ----------
  await G(() => { window.__game.score.addKill('minion'); window.__game.finish(true); });
  await page.waitForTimeout(300);
  const r = await G(() => ({ peek: !!document.querySelector('#screen-result .host.peek img[alt="Facu"]'), text: document.querySelector('#screen-result .host-bubble').textContent }));
  check(r.peek && !/puntaje final/i.test(r.text), `al ganar Facu asoma con «${r.text}»`);
  check(errors.length === 0, 'sin errores de consola ' + JSON.stringify(errors));
} finally {
  await browser.close();
}
