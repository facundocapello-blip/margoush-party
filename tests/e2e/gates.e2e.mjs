import { launch, open, startRun, check } from './harness.mjs';

const { browser, page, errors } = await launch({ viewport: { width: 960, height: 540 } });
const G = (fn, arg) => page.evaluate(fn, arg);
try {
  await open(page);
  await startRun(page, 'douge');
  await G(() => { const g = window.__game; g.hero.hp = g.hero.hpMax = 99; });
  const GX = await G(() => window.__game.world.gates[0].x);

  // La barrera se ve alta: no invita a saltarla
  const hgt = await G(() => { const b = new THREE.Box3().setFromObject(window.__game.world.gates[0].mesh); return b.max.y - b.min.y; });
  check(hgt >= 2.3, `la barrera mide ${hgt.toFixed(2)} m de alto (el salto llega a 1,4 m)`);

  // Reproducción del reporte: correr y esquivar sin parar (clic derecho) contra el portón cerrado
  // Sin oleadas en el medio: que el único cartel sea el del portón
  await G(() => { const g = window.__game; g.waves.vereda = g.waves['vereda-2'] = 'cleared'; g.hero.actor.position.set(g.world.gates[0].x - 4, 0, 0); });
  await page.keyboard.down('ArrowRight');
  for (let i = 0; i < 40; i++) {
    await page.mouse.down({ button: 'right' }); await page.mouse.up({ button: 'right' });
    await page.keyboard.press('KeyK');
    await page.waitForTimeout(60);
  }
  await page.keyboard.up('ArrowRight');
  const x1 = await G(() => window.__game.hero.actor.position.x);
  check((await page.textContent('#banner')).includes('PASO CERRADO'), 'al chocar el portón avisa que hay que despejar la zona');
  check(x1 < GX, `esquivando sin parar no se atraviesa el portón cerrado (x=${x1.toFixed(2)})`);

  const cx = await G(() => window.__game.facu.car.position.x);
  check(cx + 1.3 < GX, `el auto de Facu frena antes de la barrera (frente en ${(cx + 1.3).toFixed(2)})`);

  // Un esquive pegado al portón tampoco lo cruza, aunque el cuadro sea largo
  await G(() => { const g = window.__game; g.timeScale = 3; g.hero.actor.position.set(g.world.gates[0].x - 0.5, 0, 0); g.hero.actor.setFacing(1); });
  await page.keyboard.press('KeyK');
  await page.waitForTimeout(400);
  await G(() => { window.__game.timeScale = 1; });
  const x2 = await G(() => window.__game.hero.actor.position.x);
  check(x2 < GX, `un esquive largo junto al portón no lo cruza (x=${x2.toFixed(2)})`);

  // El esquive tiene recarga: no se puede encadenar sin fin
  const n = await G(async () => {
    const g = window.__game; g.hero.actor.position.set(20, 0, 0);
    let dodges = 0, was = false;
    const t0 = performance.now();
    while (performance.now() - t0 < 1000) {
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyK' }));
      window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyK' }));
      await new Promise(r => setTimeout(r, 30));
      const is = g.hero.state === 'dodge';
      if (is && !was) dodges++;
      was = is;
    }
    return dodges;
  });
  check(n <= 2, `en 1 s entran como mucho 2 esquives (${n})`);

  // Red de seguridad: si de alguna forma pasa un portón cerrado, vuelve a la zona
  await G(() => window.__game.hero.actor.position.set(window.__game.world.gates[0].x + 20, 0, 0));
  await page.waitForTimeout(300);
  const x3 = await G(() => window.__game.hero.actor.position.x);
  check(x3 < GX, `si aparece del otro lado de un portón cerrado, vuelve a su zona (x=${x3.toFixed(2)})`);
  // Al despejar la zona la barrera se derrumba y desaparece
  await G(() => window.__game.setStage('plaza-quiet'));
  const falling = await G(() => window.__game.world.gates[0].mesh.visible);
  await page.waitForTimeout(2000);
  const gone = await G(() => !window.__game.world.gates[0].mesh.visible);
  check(falling && gone, 'al abrirse, la barrera se ve caer y después desaparece');

  // Un enemigo revoleado contra el portón no lo atraviesa (si no, la zona no se puede terminar)
  await G(() => { const g = window.__game; g.setStage('vereda'); g.enemies.clear(); g.hero.actor.position.set(g.world.gates[0].x - 2, 0, 0);
    const e = g.enemies.spawn(g.world.gates[0].x - 0.5, 0, 0); e.hp = 99; e.stun = 5;
    g.enemies.hitArea({ x: 86.6, z: 0, facing: 1, reach: 2, depth: 1, dmg: 0, knock: 40, strength: 1 }); });
  await page.waitForTimeout(600);
  const ex = await G(() => window.__game.enemies.list[0].pos.x);
  check(ex < GX, `un enemigo revoleado no cruza el portón (x=${ex.toFixed(2)})`);
  check(errors.length === 0, 'sin errores de consola ' + JSON.stringify(errors));
} finally {
  await browser.close();
}
