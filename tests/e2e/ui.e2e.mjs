import { launch, open, check, shot } from './harness.mjs';

const SB = 'https://test.supabase.co';
const posts = [];
let rows = [];
let offline = false;
const routes = [
  ['**/3d/js/config.js', r => r.fulfill({ contentType: 'application/javascript', body: `export const SUPABASE_URL='${SB}'; export const SUPABASE_ANON_KEY='test-key';` })],
  [SB + '/**', async (route) => {
    if (offline) return route.abort();
    const req = route.request();
    if (req.method() === 'POST') {
      const body = JSON.parse(req.postData());
      posts.push(body);
      rows.push({ ...body, created_at: new Date().toISOString() });
      return route.fulfill({ status: 201, body: '' });
    }
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*' } });
    const sorted = [...rows].sort((a, b) => b.score - a.score);
    return route.fulfill({ contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(sorted) });
  }]
];

const { browser, page, errors } = await launch({ viewport: { width: 960, height: 540 }, routes });
const G = (fn, arg) => page.evaluate(fn, arg);
try {
  await open(page);
  await shot(page, 'menu');
  await page.click('#btn-play');
  await shot(page, 'select');
  await page.click('#pick-douge');
  await page.waitForTimeout(500);
  await page.mouse.click(480, 300);
  await page.waitForFunction(() => window.__game.state === 'playing');
  await G(() => { const g = window.__game; g.hero.hp = g.hero.hpMax = 99; });

  // Bot: recorre todo el nivel peleando hasta el resultado
  const t0 = Date.now();
  let held = null;
  while (Date.now() - t0 < 240000) {
    const s = await G(() => {
      const g = window.__game;
      if (g.state === 'result') return { done: true };
      if (g.state !== 'playing') return { wait: true };
      const h = g.hero.actor.position;
      const foes = g.enemies.list.filter(e => e.hp > 0).map(e => e.pos);
      if (g.boss && !g.boss.dead) foes.push(g.boss.pos);
      const e = foes.sort((a, b) => Math.abs(a.x - h.x) - Math.abs(b.x - h.x))[0];
      if (!e || Math.abs(e.x - h.x) > 12) return { key: 'ArrowRight' };
      const dx = e.x - h.x, dz = e.z - h.z;
      if (Math.abs(dz) > 0.4) return { key: dz > 0 ? 'ArrowDown' : 'ArrowUp' };
      if (Math.abs(dx) > (g.boss && e === g.boss.pos ? 2.2 : 1.5)) return { key: dx > 0 ? 'ArrowRight' : 'ArrowLeft' };
      return { attack: true, face: dx > 0 ? 1 : -1, facing: g.hero.actor.facing };
    });
    if (s.done) break;
    const want = s.key || null;
    if (held !== want) { if (held) await page.keyboard.up(held); if (want) await page.keyboard.down(want); held = want; }
    if (s.attack) {
      if (s.facing !== s.face) { const k = s.face > 0 ? 'ArrowRight' : 'ArrowLeft'; await page.keyboard.down(k); await page.waitForTimeout(30); await page.keyboard.up(k); }
      await page.keyboard.press('KeyJ');
    }
    await page.waitForTimeout(80);
  }
  if (held) await page.keyboard.up(held);
  check(await G(() => window.__game.state) === 'result', `el bot llega al resultado jugando (${(Date.now() - t0) / 1000 | 0} s)`);
  await page.waitForTimeout(1500);
  await shot(page, 'result');
  check(await page.isVisible('#result-total') && await page.isVisible('#result-rank'), 'el resultado muestra puntaje y nota');

  // Apodo con HTML y doble toque en Guardar
  await page.fill('#nick', '<img src=x onerror=alert(1)>');
  await page.dblclick('#btn-save');
  await page.waitForTimeout(800);
  check(posts.length === 1, `doble toque en Guardar envía un solo puntaje (${posts.length})`);
  await page.click('#btn-show-ranking');
  await page.waitForSelector('#rank-table tbody tr');
  await page.waitForTimeout(300);
  const imgs = await G(() => document.querySelectorAll('#rank-table img').length);
  const cell = await G(() => document.querySelector('#rank-table tbody tr td.nick').textContent);
  check(cell.startsWith('<img') && imgs === 0, 'el apodo con HTML se muestra como texto');
  check(await page.textContent('#rank-status') !== '' && !(await page.textContent('#rank-status')).includes('Sin conexión'), 'el ranking dice que está en línea');
  await shot(page, 'ranking');

  // Sin conexión
  offline = true;
  await page.click('#btn-rank-back');
  await G(() => window.__game.quickStart('marine'));
  await G(() => window.__game.finish(false));
  await page.fill('#nick', 'Faca');
  await page.click('#btn-save');
  await page.waitForSelector('#save-status:has-text("Sin conexión")', { timeout: 9000 });
  check((await page.textContent('#save-status')).includes('Sin conexión: tu puntaje quedó guardado en este celular'), 'sin internet avisa y guarda en el celular');

  // Pantalla chica: sin desborde horizontal
  await page.setViewportSize({ width: 320, height: 568 });
  await page.waitForTimeout(300);
  const over = await G(() => [...document.querySelectorAll('.screen:not(.hidden)')].map(s => s.scrollWidth - s.clientWidth).concat(document.documentElement.scrollWidth - innerWidth));
  check(over.every(v => v <= 1), 'sin desborde horizontal en 320×568 ' + JSON.stringify(over));
  await shot(page, 'result-small');
  const errs = errors.filter(e => !/supabase/.test(e));
  check(errs.length === 0, 'sin errores de consola ' + JSON.stringify(errs));
} finally {
  await browser.close();
}
