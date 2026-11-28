// Portada: botones «Ir directo al jefe» (sin recargar, mismo camino que ?probar=<jefe>).
// Se prueba en escritorio y en iPhone 15 Pro Max parado y acostado (Chromium emulado, no Safari).
import { launch, check, shot } from './harness.mjs';
if (!process.env.MARGOUSH_FACU_PASS) throw new Error('Falta MARGOUSH_FACU_PASS (contraseña de la pelea con Facu)');

const G = (page, fn, arg) => page.evaluate(fn, arg);
const rect = (page, sel) => page.evaluate((s) => document.querySelector(s)?.getBoundingClientRect().toJSON(), sel);
const overlap = (a, b) => a && b && a.left < b.right - 2 && b.left < a.right - 2 && a.top < b.bottom - 2 && b.top < a.bottom - 2;
const STATES = { chaky: 'arena', cepi: 'arena-cepi', lale: 'arena-lale', pinky: 'arena-pinky', facu: 'arena-facu' };

for (const [w, h, name, mobile] of [[1280, 720, 'escritorio', false], [430, 932, 'iphone-parado', true], [932, 430, 'iphone-acostado', true]]) {
  const { browser, page, errors } = await launch({ viewport: { width: w, height: h }, mobile });
  const tap = (sel) => mobile ? page.tap(sel) : page.click(sel);
  try {
    await page.goto('http://game.local/3d/index.html');
    await page.waitForFunction(() => window.__game && window.__game.state === 'menu', null, { timeout: 20000 });
    await page.waitForTimeout(2500);
    const row = await rect(page, '#boss-jump'), play = await rect(page, '#btn-play'), pod = await rect(page, '#cover-podium');
    check(row && row.left >= 0 && row.right <= w && row.top >= 0 && row.bottom <= h, `${name}: los botones de jefes entran en pantalla ${JSON.stringify(row && [row.left, row.top, row.right, row.bottom].map(Math.round))}`);
    check(!overlap(row, play) && !overlap(row, pod), `${name}: no tapan ¡JUGAR! ni el podio`);
    await shot(page, `boss-jump-portada-${name}`);
    let hero = 'douge';
    for (const [id, state] of Object.entries(STATES)) {
      await tap(`#boss-jump [data-probar="${id}"]`);
      await page.waitForTimeout(300);
      if (id === 'facu') {
        // Candado: sin la contraseña no se entra
        check(await G(page, () => !document.querySelector('#pass-gate').classList.contains('hidden')), `${name}: FACU pide contraseña`);
        await shot(page, `boss-jump-pass-${name}`);
        await page.fill('#pass-input', 'cualquiera');
        await page.press('#pass-input', 'Enter');
        await page.waitForTimeout(300);
        check(await G(page, () => !document.querySelector('#pass-error').classList.contains('hidden') && window.__game.state === 'menu'), `${name}: con la contraseña mal no entra`);
        // La contraseña real no va en el repo: se pasa por variable de entorno (MARGOUSH_FACU_PASS)
        await page.fill('#pass-input', process.env.MARGOUSH_FACU_PASS || '');
        await page.press('#pass-input', 'Enter');
        await page.waitForTimeout(300);
        check(await G(page, () => document.querySelector('#pass-gate').classList.contains('hidden')), `${name}: con la contraseña bien pasa a elegir héroe`);
      }
      await tap(`.card[data-hero="${hero}"]`);
      await page.waitForFunction((s) => window.__game.state === s, state, { timeout: 15000 });
      await page.waitForTimeout(2500);
      check(true, `${name}: ${id} → entra directo a ${state} con ${hero}`);
      await shot(page, `boss-jump-${id}-${name}`);
      await G(page, () => window.__game.goMenu());
      await page.waitForTimeout(900);
      hero = hero === 'douge' ? 'marine' : 'douge';
    }
    // Después de un atajo, ¡JUGAR! vuelve a la partida normal (intro)
    await tap('#btn-play');
    await page.waitForTimeout(300);
    await tap('.card[data-hero="marine"]');
    await page.waitForFunction(() => window.__game.state === 'intro', null, { timeout: 8000 });
    check(true, `${name}: ¡JUGAR! después de un atajo arranca la historia normal`);
    check(errors.length === 0, `${name}: sin errores de consola ` + JSON.stringify(errors));
  } finally {
    await browser.close();
  }
}

// Link directo ?probar=facu: también pide la contraseña al elegir héroe
{
  const { browser, page, errors } = await launch({ viewport: { width: 430, height: 932 }, mobile: true });
  try {
    await page.goto('http://game.local/3d/index.html?probar=facu');
    await page.waitForFunction(() => window.__game && window.__game.state === 'menu', null, { timeout: 20000 });
    await page.waitForTimeout(1500);
    await page.tap('#btn-play'); await page.waitForTimeout(300);
    await page.tap('.card[data-hero="douge"]');
    await page.waitForTimeout(1600);
    check(await G(page, () => !document.querySelector('#pass-gate').classList.contains('hidden') && window.__game.state !== 'arena-facu'), '?probar=facu: pide contraseña antes de la arena');
    await page.tap('#pass-cancel'); await page.waitForTimeout(300);
    check(await G(page, () => window.__game.state !== 'arena-facu'), '?probar=facu: cancelar no deja entrar');
    check(errors.length === 0, '?probar=facu: sin errores ' + JSON.stringify(errors));
  } finally { await browser.close(); }
}
