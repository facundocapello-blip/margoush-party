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
    check(await visible(page, '#screen-menu .logo'), `${name}: se ve el logo`);
    check(await page.$$eval('#cover-chaky, #cover-heroes, #cover-facu, #screen-menu .ribbon', n => n.length) === 0, `${name}: la portada no muestra a BIG CHAKY ni a nadie más`);
    check(!(await page.textContent('#screen-select')).includes('Facu te acompaña'), `${name}: la selección no promete a Facu todo el camino`);
    // Apenas entrás: ¡JUGAR!, el idioma al lado y el podio, sin un toque previo
    check(await visible(page, '#btn-play') && await visible(page, '#lang-pick') && await visible(page, '#cover-podium'), `${name}: de entrada se ven ¡JUGAR!, el idioma y el podio`);
    const play = await rect(page, '#btn-play'), lang = await rect(page, '#lang-pick'), pod = await rect(page, '#cover-podium'), logo = await rect(page, '#screen-menu .logo');
    check(Math.abs((play.top + play.bottom) / 2 - (lang.top + lang.bottom) / 2) < 12 && lang.left > play.right - 2, `${name}: el idioma está al lado de ¡JUGAR!`);
    if (w > h) check(pod.left > play.right && pod.left > w * 0.5, `${name}: el podio queda a la derecha`);
    for (const r of [play, lang, pod]) check(r.left >= 0 && r.right <= w && r.top >= 0 && r.bottom <= h, `${name}: ${JSON.stringify([Math.round(r.left), Math.round(r.top), Math.round(r.right), Math.round(r.bottom)])} entra en pantalla`);
    for (const r of [play, lang, pod]) check(!overlap(logo, r), `${name}: el logo no tapa nada`);
    check(!overlap(pod, play) && !overlap(pod, lang), `${name}: el podio no tapa los botones`);
    await shot(page, `cover-${name}`);
    await page.tap('#lang-pick [data-lang="fr"]');
    check(await page.textContent('#btn-play') === 'JOUER !' && /Podium/.test(await page.textContent('#podium-title')), `${name}: el idioma cambia la portada al toque`);
    await page.tap('#lang-pick [data-lang="es"]');
    await page.tap('#screen-menu .cover-bg', { force: true }).catch(() => {});
    await page.waitForTimeout(600);
    check(await page.evaluate(() => window.__game.ctx.audio.current) === 'menu', `${name}: suena la música de la portada`);

    await page.tap('#btn-play');
    await page.tap('#pick-marine');
    await page.waitForFunction(() => window.__game.state === 'intro', null, { timeout: 6000 }); // el festejo de la tarjeta dura ~1 s
    await page.waitForTimeout(400);
    check(await page.evaluate(() => window.__game.ctx.audio.current) === 'intro', `${name}: en la intro suena el «¡uh, no!»`);
    await page.tap('#game');
    await page.waitForFunction(() => window.__game.state === 'chase', null, { timeout: 15000 });
    check(await page.evaluate(() => window.__game.ctx.audio.current) === 'chase', `${name}: en la persecución suena su música`);
    await page.evaluate(() => { const g = window.__game; g.chase.dispose(); g.quickStart(g.heroId); }); // la persecución se prueba en chase.e2e
    await page.waitForFunction(() => window.__game.state === 'playing');
    check(await page.evaluate(() => window.__game.ctx.audio.current) === 'ba', `${name}: en Buenos Aires suena la murga`);
    await page.evaluate(() => window.__game.goMenu());
    await page.waitForTimeout(500);
    check(await page.evaluate(() => window.__game.ctx.audio.current) === 'menu', `${name}: al volver al menú vuelve la música de portada`);
    await page.waitForTimeout(1000); // el podio vuelve a entrar con su animación
    check(await visible(page, '#btn-play') && await visible(page, '#cover-podium'), `${name}: al volver está todo a la vista`);
    check(errors.length === 0, `${name}: sin errores de consola ` + JSON.stringify(errors));
  } finally {
    await browser.close();
  }
}
