import { launch, open, startRun, check, shot } from './harness.mjs';

// Controles para iPhone: joystick flotante, 3 botones, puntería automática, barra de poder (mantener 👊), indicaciones.
const { browser, page, errors } = await launch({ viewport: { width: 844, height: 390 }, mobile: true });
const G = (fn, arg) => page.evaluate(fn, arg);
const cdp = await page.context().newCDPSession(page);
const touch = (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts.map(([x, y, id]) => ({ x, y, id })) });
const box = async (s) => (await page.$(s)).boundingBox();
const quiet = (x = 170) => G((x) => {
  const g = window.__game; g.setStage('francia-quiet'); g.enemies.clear(); g.traps.disable(); g.butter?.clear(); g.powers?.clear();
  for (const k in g.waves) g.waves[k] = 'cleared';
  g.hero.hp = g.hero.hpMax = 99; g.hero.inv = 0; g.hero.power = 0; g.hero.actor.position.set(x, 0, 0); g.hero.actor.setFacing(1); g.facu.jokeCd = 99;
}, x);

try {
  await G(() => localStorage.removeItem('margoush3d_coach')).catch(() => {});
  await open(page);
  await G(() => localStorage.removeItem('margoush3d_coach'));
  await startRun(page, 'douge');

  // ---------- Tres botones grandes, sin ⚡ suelto ----------
  const ids = await G(() => [...document.querySelectorAll('#actions .act')].map(b => b.id));
  check(ids.length === 3 && !ids.includes('act-power'), `quedan 3 botones: ${ids.join(', ')}`);
  for (const s of ['#act-attack', '#act-jump', '#act-dodge', '#btn-mute', '#btn-pause']) {
    const b = await box(s);
    check(b.width >= 44 && b.height >= 44, `${s} mide ${Math.round(b.width)}×${Math.round(b.height)} (≥ 44 px)`);
  }

  // ---------- Indicaciones de la primera partida ----------
  const c0 = await G(() => document.querySelector('#coach').textContent);
  check(/pulgar/i.test(c0), `primera indicación: «${c0}»`);
  await shot(page, 'controls-coach');

  // ---------- Joystick flotante: tocás en cualquier lado de la mitad izquierda y caminás ----------
  const x0 = await G(() => window.__game.hero.actor.position.x);
  await touch('touchStart', [[300, 220, 1]]);
  const j = await box('#joystick');
  check(Math.abs(j.x + j.width / 2 - 300) < 4 && Math.abs(j.y + j.height / 2 - 220) < 4, 'el joystick aparece donde apoyaste el pulgar');
  await touch('touchMove', [[350, 220, 1]]);
  await page.waitForTimeout(700);
  await touch('touchEnd', []);
  const x1 = await G(() => window.__game.hero.actor.position.x);
  check(x1 - x0 > 2, `el héroe camina (${(x1 - x0).toFixed(1)} m)`);
  const jh = await box('#joystick');
  check(jh.x < 80, 'al soltar, el joystick vuelve a su lugar');
  await page.waitForTimeout(900);
  check(/3 veces/.test(await G(() => document.querySelector('#coach').textContent)), 'después de caminar enseña el combo');

  // ---------- Puntería automática: el malo de atrás recibe el golpe ----------
  await quiet();
  await G(() => { const e = window.__game.enemies.spawn(168.6, 0.5, 'secuaz'); e.stun = 99; window.__back = e; });
  const a = await box('#act-attack');
  await touch('touchStart', [[a.x + 40, a.y + 40, 2]]); await page.waitForTimeout(60); await touch('touchEnd', []);
  await page.waitForTimeout(400);
  const aim = await G(() => ({ hp: window.__back.hp, facing: window.__game.hero.actor.facing, pw: window.__game.hero.power }));
  check(aim.facing === -1 && aim.hp < 3, `al pegar se da vuelta solo y le pega al de atrás (hp ${aim.hp})`);
  check(aim.pw > 0, `pegar carga la barra de poder (${aim.pw.toFixed(2)})`);

  // ---------- Barra vacía: mantener 👊 no lanza poder ----------
  await quiet();
  await touch('touchStart', [[a.x + 40, a.y + 40, 2]]); await page.waitForTimeout(900); await touch('touchEnd', []);
  check(await G(() => window.__game.powers.made.wave) === 0, 'con la barra vacía, mantener 👊 solo pega');

  // ---------- Barra llena: el 👊 late y mantenerlo lanza el poder ----------
  await quiet();
  await G(() => { const g = window.__game; g.hero.power = 1; [[173, 0], [167, 0.3]].forEach(([x, z]) => { const e = g.enemies.spawn(x, z, 'secuaz'); e.stun = 99; }); });
  await page.waitForTimeout(100);
  const ready = await G(() => ({ btn: document.querySelector('#act-attack').classList.contains('ready'), hud: document.querySelector('#hud-power-text').textContent }));
  check(ready.btn && /LISTO/.test(ready.hud), `con la barra llena el 👊 late y el HUD dice «${ready.hud}»`);
  await shot(page, 'controls-ready');
  await touch('touchStart', [[a.x + 40, a.y + 40, 2]]); await page.waitForTimeout(700); await touch('touchEnd', []);
  await page.waitForTimeout(300);
  const p = await G(() => ({ made: window.__game.powers.made.wave, hp: window.__game.enemies.list.map(e => e.hp), pw: window.__game.hero.power }));
  check(p.made === 1 && p.pw === 0, 'mantener 👊 con la barra llena lanza el poder y vacía la barra');
  check(p.hp.every(h => h < 3), `el poder voltea a los de adelante y atrás (${p.hp.join('/')})`);

  // ---------- Esquive justo suma poder ----------
  await quiet();
  await G(() => { const h = window.__game.hero; h.state = 'dodge'; h.t = 0.24; h.dodgeRewarded = false; h.hurt(1, h.actor.position.x + 1); });
  check(await G(() => window.__game.hero.power) > 0.1, 'esquivar justo un golpe suma poder');

  // ---------- Pinky no se pisa con la oleada siguiente ----------
  await G(() => { const g = window.__game; g.setStage('vereda'); g.enemies.clear(); g.traps.disable(); g.cameos.pinky.shown = { 1: false, 2: false }; g.hero.hp = 99; });
  await page.waitForFunction(() => window.__game.cameos.busy, null, { timeout: 8000 });
  await G(() => window.__game.hero.actor.position.set(window.__game.hero.actor.position.x + 30, 0, 0)); // pasa el disparador de vereda-2
  await page.waitForTimeout(150);
  const held = await G(() => ({ w: window.__game.waves['vereda-2'], ph: window.__game.cameos.phase }));
  check(held.w === 'idle' && held.ph === 'party', `al llegar a la oleada, Pinky festeja el gol ya y la oleada espera (${held.w}, ${held.ph})`);
  const tw = Date.now();
  await page.waitForFunction(() => window.__game.waves['vereda-2'] === 'active', null, { timeout: 4000 });
  check(Date.now() - tw < 2500, `la oleada entra enseguida, cuando Pinky se va (${Date.now() - tw} ms)`);
  check(await G(() => Object.values(window.__game.waves).filter(v => v === 'active').length) === 1, 'nunca hay dos oleadas a la vez');

  // ---------- Elección de héroe: dice en qué se diferencian ----------
  const cards = await G(() => [...document.querySelectorAll('.card em')].map(e => e.textContent));
  check(cards.length === 2 && cards.every(t => t.includes('⚡')), `las cartas explican el poder: ${cards.join(' | ')}`);

  check(errors.length === 0, 'sin errores en consola: ' + errors.join(' | '));
} finally { await browser.close(); }
