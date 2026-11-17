import { launch, check, shot } from './harness.mjs';

const visible = (page, sel) => page.evaluate((s) => { const e = document.querySelector(s); if (!e) return false; const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && +cs.opacity > 0.05; }, sel);
const rect = (page, sel) => page.evaluate((s) => document.querySelector(s)?.getBoundingClientRect().toJSON(), sel);
const overlap = (a, b) => a && b && a.left < b.right - 2 && b.left < a.right - 2 && a.top < b.bottom - 2 && b.top < a.bottom - 2;

for (const [w, h, name] of [[844, 390, 'acostado'], [390, 844, 'parado']]) {
  const { browser, page, errors } = await launch({ viewport: { width: w, height: h }, mobile: true });
  try {
    await page.goto('http://game.local/3d/index.html');
    await page.waitForFunction(() => window.__game && window.__game.state === 'menu', null, { timeout: 20000 });
    // deja terminar la entrada animada (logo que cae, personajes que entran)
    await page.waitForFunction(() => document.getAnimations().filter(a => a.effect?.target?.closest?.('#screen-menu') && a.effect.getComputedTiming().iterations !== Infinity).every(a => a.playState === 'finished'), null, { timeout: 8000 });
    check(await visible(page, '#press-start'), `${name}: se ve "TOCÁ PARA EMPEZAR"`);
    check(!(await visible(page, '#btn-play')), `${name}: antes del toque no están los botones`);
    check(await visible(page, '#screen-menu .logo'), `${name}: se ve el logo`);
    check(await page.$$eval('#cover-chaky, #cover-heroes, #cover-facu, #screen-menu .ribbon', n => n.length) === 0, `${name}: la portada no muestra a BIG CHAKY ni a nadie más`);
    check(!(await page.textContent('#screen-select')).includes('Facu te acompaña'), `${name}: la selección no promete a Facu todo el camino`);
    await shot(page, `cover-${name}-press`);

    await page.tap('#press-start');
    await page.waitForTimeout(900);
    check(await page.evaluate(() => window.__game.ctx.audio.current) === 'menu', `${name}: el toque arranca la música de la portada`);
    check(await visible(page, '#btn-play') && await visible(page, '#btn-ranking'), `${name}: después del toque aparecen ¡JUGAR! y Ranking`);
    const btns = [await rect(page, '#btn-play'), await rect(page, '#btn-ranking')];
    for (const sel of ['#screen-menu .logo']) {
      const r = await rect(page, sel);
      check(btns.every(b => !overlap(r, b)), `${name}: ${sel} no tapa los botones`);
    }
    for (const b of btns) check(b.left >= 0 && b.right <= w && b.bottom <= h, `${name}: los botones entran en pantalla`);
    await shot(page, `cover-${name}`);

    await page.tap('#btn-play');
    await page.tap('#pick-marine');
    await page.waitForTimeout(400);
    check(await page.evaluate(() => window.__game.ctx.audio.current) === null, `${name}: en la intro no suena el tema (solo los efectos)`);
    await page.tap('#game');
    await page.waitForFunction(() => window.__game.state === 'playing');
    check(await page.evaluate(() => window.__game.ctx.audio.current) === 'marine', `${name}: al jugar suena el tema del héroe`);
    await page.evaluate(() => window.__game.goMenu());
    await page.waitForTimeout(500);
    check(await page.evaluate(() => window.__game.ctx.audio.current) === 'menu', `${name}: al volver al menú vuelve la música de portada`);
    check(await visible(page, '#btn-play') && !(await visible(page, '#press-start')), `${name}: al volver no pide otro toque`);
    check(errors.length === 0, `${name}: sin errores de consola ` + JSON.stringify(errors));
  } finally {
    await browser.close();
  }
}
