// Persecución de Cepi en el boulevard: se juega hacia el fondo y termina en la pelea con Cepi.
import { launch, open, startRun, check, shot } from './harness.mjs';

const G = (page, fn, arg) => page.evaluate(fn, arg);

async function toBoulevard(page, hero) {
  await startRun(page, hero);
  await G(page, () => {
    const g = window.__game;
    g.setStage('francia-quiet');
    g.waves['francia-2'] = 'cleared';
    for (const gate of g.world.gates) gate.open = true;
    g.hero.actor.position.set(213.5, 0, 0);
  });
  await page.waitForFunction(() => window.__game.state === 'chase', null, { timeout: 8000 });
}

for (const hero of ['douge', 'marine']) {
  const { browser, page, errors } = await launch({ viewport: { width: 844, height: 390 }, mobile: true });
  try {
    await open(page);
    await toBoulevard(page, hero);
    check(true, `${hero}: al llegar al boulevard arranca la persecución`);
    check(await G(page, () => !!document.querySelector('#chase-bat') && !document.querySelector('#hud').classList.contains('hidden')),
      `${hero}: se ve la batería del BYD y el HUD de siempre`);
    await G(page, () => { window.__game.hero.hp = window.__game.hero.hpMax = 99; });
    // GPU por software: se espera por distancia, no por tiempo
    await page.waitForFunction(() => window.__game.chase.state?.dist > 15, null, { timeout: 30000 });
    const s1 = await G(page, () => window.__game.chase.state);
    check(s1.phase === 'run' && s1.dist > 15, `${hero}: corre solo hacia el fondo (${s1.dist.toFixed(0)} m)`);

    // Pausa y vuelta a la persecución
    await G(page, () => window.__game.pause());
    check(await G(page, () => window.__game.state) === 'paused', `${hero}: se puede pausar`);
    const d1 = await G(page, () => window.__game.chase.state.dist);
    await page.waitForTimeout(500);
    check(await G(page, () => window.__game.chase.state.dist) === d1, `${hero}: en pausa no avanza`);
    await G(page, () => window.__game.resume());
    check(await G(page, () => window.__game.state) === 'chase', `${hero}: al seguir vuelve a la persecución`);

    // Controles: saltar y doblar
    await page.keyboard.press('Space');
    await page.waitForTimeout(150);
    check((await G(page, () => window.__game.chase.state.y)) > 0.3, `${hero}: SALTO salta`);
    await page.keyboard.down('ArrowLeft'); await page.waitForTimeout(300); await page.keyboard.up('ArrowLeft');
    check((await G(page, () => window.__game.chase.state.x)) < -1, `${hero}: el joystick dobla`);

    // Poder con la barra llena
    await G(page, () => { window.__game.hero.power = 1; });
    await page.keyboard.press('KeyL');
    await page.waitForTimeout(200);
    check((await G(page, () => window.__game.hero.power)) < 1, `${hero}: con la barra llena sale el poder`);
    await shot(page, `chase_${hero}`);

    // Hasta el final (rápido): el BYD se queda sin batería y empieza la pelea con Cepi
    await G(page, () => { window.__game.timeScale = 3; });
    await page.waitForFunction(() => window.__game.state === 'playing', null, { timeout: 60000 });
    await G(page, () => { window.__game.timeScale = 1; });
    const after = await G(page, () => {
      const g = window.__game;
      return { wave: g.waves.boulevard, alive: g.enemies.alive(), x: g.hero.actor.position.x, chase: g.chase.active, ui: !!document.querySelector('#chase-ui'), score: g.score.total };
    });
    check(!after.chase && !after.ui, `${hero}: al terminar se limpia la persecución`);
    check(after.wave === 'active' && after.alive === 1, `${hero}: después aparece Cepi para pelear`);
    check(after.score >= 500, `${hero}: suma puntos (${after.score})`);
    await page.waitForTimeout(400);
    await shot(page, `chase_${hero}_pelea`);
    check(errors.length === 0, `${hero}: sin errores (${errors.join(' | ')})`);
  } finally { await browser.close(); }
}

// Perder todos los corazones en la persecución termina la partida
{
  const { browser, page, errors } = await launch({ viewport: { width: 960, height: 540 } });
  try {
    await open(page);
    await toBoulevard(page, 'douge');
    await G(page, () => { window.__game.hero.hp = 1; window.__game.timeScale = 2; });
    await page.waitForFunction(() => window.__game.state === 'result', null, { timeout: 60000 });
    check(true, 'si te quedás sin corazones en la persecución, se termina la partida');
    check(await G(page, () => !document.querySelector('#chase-ui') && !window.__game.chase.active), 'y no queda nada de la persecución en pantalla');
    check(errors.length === 0, `sin errores (${errors.join(' | ')})`);
  } finally { await browser.close(); }
}
