import { launch, open, startRun, check, shot } from './harness.mjs';

const { browser, page, errors } = await launch({ viewport: { width: 960, height: 540 } });
const G = (fn, arg) => page.evaluate(fn, arg);
try {
  await open(page);
  // Intro real desde el menú, salteable con un toque
  await page.click('#btn-play');
  await page.click('#pick-marine');
  await page.waitForTimeout(1200);
  check(await G(() => window.__game.state) === 'intro', 'arranca con la intro de BIG CHAKY');
  await shot(page, 'intro');
  const t0 = Date.now();
  await page.mouse.click(480, 300);
  await page.waitForFunction(() => window.__game.state === 'playing', null, { timeout: 2000 });
  check(Date.now() - t0 < 1000, `un toque saltea la intro (${Date.now() - t0} ms)`);

  // Jefe
  await G(() => window.__game.setStage('galpon'));
  check(await G(() => window.__game.boss && window.__game.boss.hp === 30 && window.__game.boss.hpMax === 30), 'en el galpón aparece BIG CHAKY con 30 de vida');
  await page.waitForTimeout(1500);
  await shot(page, 'boss');
  // Con defensa: casi no siente golpes fuera de sus momentos expuestos
  const guarded = await G(() => { const b = window.__game.boss; const h0 = b.hp; b.exposedT = 0; b.stun = 0; b.hitArea({ x: b.pos.x - 1, z: b.pos.z, facing: 1, reach: 2, depth: 1, dmg: 3, knock: 0, strength: 1 }); b.inv = 0; return h0 - b.hp; });
  check(guarded > 0 && guarded < 1.5, `fuera de sus momentos expuestos casi no siente los golpes (${guarded.toFixed(2)} de 3)`);
  const hit = (dmg) => G((d) => { const b = window.__game.boss; b.expose(3); b.inv = 0; return b.hitArea({ x: b.pos.x - 1, z: b.pos.z, facing: 1, reach: 2, depth: 1, dmg: d, knock: 0, strength: 1 }); }, dmg);
  await hit(15);
  check(await G(() => window.__game.boss.phase) === 2, 'a la mitad de vida pasa a la fase 2');
  const before = await G(() => window.__game.score.total);
  await page.waitForTimeout(300);
  await hit(15);
  await page.waitForTimeout(400);
  check(await G(() => window.__game.score.total) - before >= 2000, 'derrotarlo da 2000 puntos');
  check(await G(() => window.__game.state) === 'rescue', 'arranca el rescate');
  await page.waitForTimeout(1200);
  await shot(page, 'rescue');
  await page.waitForFunction(() => window.__game.story.rescue?.picked, null, { timeout: 6000 });
  check(true, 'el héroe llega a la jaula y alza a Margot');
  await page.waitForFunction(() => window.__game.story.rescue?.said >= 3, null, { timeout: 8000 });
  check(true, 'la banda llega a aplaudir');
  await shot(page, 'rescue-crew');
  await page.waitForFunction(() => window.__game.state === 'result', null, { timeout: 8000 });
  check(await G(() => (window.__game.lastResult.photo || '').startsWith('data:image/jpeg')), 'se saca la foto familiar');
  check(await G(() => !!document.querySelector('#result-photo') && !!document.querySelector('#btn-photo')), 'la foto aparece en el resultado con «Guardar la foto»');
  await shot(page, 'rescue-result');
  check(await G(() => window.__game.lastResult.won === true), 'termina en la pantalla de resultado ganando');
  check(errors.length === 0, 'sin errores de consola ' + JSON.stringify(errors));
} finally {
  await browser.close();
}
