import { launch, open, startRun, check, shot } from './harness.mjs';

const { browser, page, errors } = await launch({ viewport: { width: 960, height: 540 } });
const G = (fn, arg) => page.evaluate(fn, arg);
try {
  await open(page);
  await startRun(page, 'marine');
  check(await G(() => !!window.__game.facu && window.__game.facu.actor.heightM < window.__game.hero.actor.heightM * 0.7), 'Facu aparece y es más chico que el héroe');

  await page.keyboard.down('ArrowRight');
  let maxGap = 0;
  for (let i = 0; i < 12; i++) {
    await page.waitForTimeout(200);
    maxGap = Math.max(maxGap, await G(() => { const a = window.__game.facu.actor.position, b = window.__game.hero.actor.position; return Math.hypot(a.x - b.x, a.z - b.z); }));
  }
  await page.keyboard.up('ArrowRight');
  check(maxGap <= 3, `Facu sigue al héroe a menos de 3 m (máx ${maxGap.toFixed(2)})`);

  // Con el héroe quieto, Facu pega solo
  await G(() => { const g = window.__game; g.setStage('vereda'); g.hero.hp = g.hero.hpMax = 99; g.facu.jokeCd = 99; g.enemies.list.forEach(e => e.hp = 50); });
  const start = await G(() => window.__game.enemies.list.reduce((s, e) => s + e.hp, 0));
  await page.waitForTimeout(6000);
  const end = await G(() => window.__game.enemies.list.reduce((s, e) => s + e.hp, 0));
  check(end < start, `Facu le pega a los enemigos sin que el héroe ataque (${start} → ${end})`);

  // El chiste aturde a 2 o más
  await G(() => { const g = window.__game; g.setStage('vereda'); g.hero.hp = g.hero.hpMax = 99; g.facu.jokeCd = 0; g.facu.lastJokeStuns = 0;
    g.enemies.list.forEach((e, i) => { e.pos.set(g.hero.actor.position.x + 1.5 + i * 0.6, 0, 0.3 * i); }); });
  let stunned = 0;
  for (let i = 0; i < 30 && stunned < 2; i++) { await page.waitForTimeout(500); stunned = await G(() => window.__game.facu.lastJokeStuns); }
  check(stunned >= 2, `el chiste aturde a ${stunned} enemigos`);
  await shot(page, 'facu');
  check(await G(() => window.__game.facu.lines.intro.startsWith('Buenas noches, Le Concept')), 'Facu tiene la línea de presentación');
  check(errors.length === 0, 'sin errores de consola ' + JSON.stringify(errors));
} finally {
  await browser.close();
}
