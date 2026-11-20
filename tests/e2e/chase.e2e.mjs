// Persecución de Cepi al principio del Nivel 1 (se llevó a Margot): se juega hacia el fondo y termina
// en el mini nivel «¡ROMPÉ EL BYD!».
import { launch, open, startRun, check, shot } from './harness.mjs';

const G = (page, fn, arg) => page.evaluate(fn, arg);

async function toBoulevard(page, hero) {
  await G(page, (h) => window.__game.quickChase(h), hero);
  await page.waitForFunction(() => window.__game.state === 'chase', null, { timeout: 8000 });
}

for (const hero of ['douge', 'marine']) {
  const { browser, page, errors } = await launch({ viewport: { width: 844, height: 390 }, mobile: true });
  try {
    await open(page);
    await toBoulevard(page, hero);
    check(await G(page, () => window.__game.level) === 1, `${hero}: al empezar la partida arranca la persecución (Nivel 1)`);
    check(await G(page, () => !!document.querySelector('#chase-bat') && !document.querySelector('#hud').classList.contains('hidden')),
      `${hero}: se ve la batería del BYD y el HUD de siempre`);
    await G(page, () => { window.__game.hero.hp = window.__game.hero.hpMax = 99; });
    // GPU por software: se espera por distancia, no por tiempo
    await page.waitForFunction(() => window.__game.chase.state?.dist > 15, null, { timeout: 30000 });
    const s1 = await G(page, () => window.__game.chase.state);
    check(s1.phase === 'run' && s1.dist > 15, `${hero}: corre solo hacia el fondo (${s1.dist.toFixed(0)} m)`);
    // Cepi maneja mirando adelante y se da vuelta solo para sacar
    const poses = new Set([s1.cepi]);
    for (let i = 0; i < 300 && !(poses.has('windup') && poses.has('throw') && poses.size >= 3); i++) {
      poses.add(await G(page, () => window.__game.chase.state.cepi)); await page.waitForTimeout(40);
    }
    check(poses.has('drive') && poses.has('windup') && poses.has('throw'), `${hero}: Cepi alterna manejar / darse vuelta / sacar (${[...poses].join(', ')})`);

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
    // GPU por software: se espera por posición, no por tiempo
    await page.keyboard.down('ArrowLeft');
    await page.waitForFunction(() => window.__game.chase.state.x < -1, null, { timeout: 5000 }).catch(() => {});
    await page.keyboard.up('ArrowLeft');
    check((await G(page, () => window.__game.chase.state.x)) < -1, `${hero}: el joystick dobla`);

    // Solo volante y salto: la piña, el esquive y el poder no hacen nada y sus botones no se ven
    await G(page, () => { window.__game.hero.power = 1; });
    await page.keyboard.press('KeyL'); await page.keyboard.press('KeyJ'); await page.keyboard.press('KeyK');
    await page.waitForTimeout(200);
    check((await G(page, () => window.__game.hero.power)) === 1, `${hero}: en la persecución no hay poder`);
    check(await G(page, () => ['#act-attack', '#act-dodge'].every(q => { const e = document.querySelector(q); return !e || getComputedStyle(e).display === 'none'; })), `${hero}: no se ven los botones de piña ni esquive`);
    await shot(page, `chase_${hero}`);

    // Hasta el final (rápido): el BYD se queda sin batería y sigue el mini nivel de romperlo
    await G(page, () => { window.__game.timeScale = 3; });
    await page.waitForFunction(() => window.__game.state === 'bonus', null, { timeout: 60000 });
    await G(page, () => { window.__game.timeScale = 1; });
    const after = await G(page, () => {
      const g = window.__game;
      return { chase: g.chase.active, ui: !!document.querySelector('#chase-ui'), score: g.score.total, cp: g.checkpoint?.id, level: g.level };
    });
    check(!after.chase && !after.ui, `${hero}: al terminar se limpia la persecución`);
    check(after.cp === 'byd' && after.level === 1, `${hero}: después viene «¡ROMPÉ EL BYD!» (con checkpoint)`);
    check(after.score >= 500, `${hero}: suma puntos (${after.score})`);
    check(errors.length === 0, `${hero}: sin errores (${errors.join(' | ')})`);
  } finally { await browser.close(); }
}

// En la persecución no se pierde la partida: como mucho quedás con un corazón
{
  const { browser, page, errors } = await launch({ viewport: { width: 960, height: 540 } });
  try {
    await open(page);
    await toBoulevard(page, 'douge');
    await G(page, () => { window.__game.hero.hp = 1; window.__game.timeScale = 2; });
    await page.waitForTimeout(6000);
    check(await G(page, () => window.__game.state === 'chase' && window.__game.hero.hp === 1), 'con un corazón la persecución sigue: los golpes no te dejan sin vida');
    check(errors.length === 0, `sin errores (${errors.join(' | ')})`);
  } finally { await browser.close(); }
}
