// Partida completa con un "bot" de jugador casual-medio: capturas y registro de cada tramo.
import { launch, OUT } from './harness.mjs';
import fs from 'node:fs';
const hero = process.argv[2] || 'douge'; const from = process.argv[3] || '';
const { browser, page, errors } = await launch({ viewport: { width: 390, height: 844 }, mobile: true });
const log = []; const t0 = Date.now();
const L = (m) => { const s = `[${((Date.now() - t0) / 1000).toFixed(0)}s] ${m}`; log.push(s); console.log(s); };
const G = (fn, a) => page.evaluate(fn, a);
let shotN = 0; const shot = async (n) => page.screenshot({ path: `/home/claude/play/${hero}${from}_${String(++shotN).padStart(2, '0')}_${n}.png` });
const held = new Set();
async function hold(keys) {
  for (const k of [...held]) if (!keys.includes(k)) { await page.keyboard.up(k); held.delete(k); }
  for (const k of keys) if (!held.has(k)) { await page.keyboard.down(k); held.add(k); }
}
const tap = async (k) => { await page.keyboard.down(k); await page.waitForTimeout(40); await page.keyboard.up(k); };
try {
  await page.goto('http://game.local/3d/index.html');
  await page.waitForFunction(() => window.__game && window.__game.state === 'menu', null, { timeout: 30000 });
  await shot('portada'); await page.tap('#press-start'); await page.waitForTimeout(700); await shot('menu');
  await page.tap('#btn-play'); await page.waitForTimeout(600); await shot('eleccion');
  if (from) await G(([h, f]) => window.__game.resumeAt({ id: f, heroId: h, score: 0, time: 0 }), [hero, from]); else await page.tap('#pick-' + hero);
  let last = '', lastHp = -1, lastBanner = '', lastStage = '', tick = 0, lastShot = 0, deaths = 0;
  const end = Date.now() + 40 * 60 * 1000;
  while (Date.now() < end) {
    const s = await G(() => {
      const g = window.__game; const h = g.hero; const p = h?.actor.position;
      const en = (g.enemies?.list || []).filter(e => e.hp > 0 && !e.dead).map(e => ({ x: e.pos.x, z: e.pos.z, k: e.kind, st: e.state }));
      return { st: g.state, lvl: g.level, hp: h?.hp, hpMax: h?.hpMax, pw: h?.power, x: p?.x, z: p?.z, en, score: g.score?.total,
        banner: document.getElementById('banner')?.classList.contains('hidden') ? '' : document.getElementById('banner')?.innerText.replace(/\s+/g, ' '),
        cine: document.querySelector('.cine-sub span')?.textContent, chase: g.chase?.state, bonus: g.bonus?.state, arena: g.arena?.state,
        wave: Object.entries(g.waves || {}).filter(([k, v]) => v === 'active').map(([k]) => k).join(','), time: g.time };
    });
    tick++;
    const stage = s.st + (s.wave ? ':' + s.wave : '') + (s.lvl ? ' n' + s.lvl : '');
    if (stage !== lastStage) { L(`ETAPA ${stage} hp=${s.hp}/${s.hpMax} pts=${s.score} x=${s.x?.toFixed(0)} t=${s.time?.toFixed(0)}`); lastStage = stage; await shot(stage.replace(/[^a-z0-9-]/gi, '_')); }
    if (s.hp !== lastHp) { if (lastHp >= 0) L(`vida ${lastHp} → ${s.hp} (${s.st})`); lastHp = s.hp; }
    if (s.banner && s.banner !== lastBanner) { L(`CARTEL: ${s.banner}`); lastBanner = s.banner; }
    if (Date.now() - lastShot > 25000) { lastShot = Date.now(); await shot(s.st); }
    if (s.st === 'result') { await hold([]); await page.waitForTimeout(2500); await shot('resultado'); L('RESULTADO: ' + (await page.innerText('#screen-result')).replace(/\s+/g, ' ').slice(0, 300)); break; }
    if (s.st === 'intro' || s.st === 'curtain' || s.st === 'transition' || s.st === 'rescue') { await hold([]); await page.waitForTimeout(250); continue; }
    const keys = [];
    if (s.chase && s.st === 'chase') {
      // casual: va zigzagueando un poco, salta cada tanto, pega seguido
      const want = Math.sin(tick / 9) * 2.4;
      if (s.chase.x < want - 0.4) keys.push('ArrowRight'); else if (s.chase.x > want + 0.4) keys.push('ArrowLeft');
      await hold(keys); if (tick % 3 === 0) await tap('KeyJ'); if (tick % 11 === 0) await tap('Space'); if (tick % 17 === 0) await tap('KeyK');
      if (s.pw >= 100 && tick % 5 === 0) await tap('KeyL');
    } else if (s.bonus && s.bonus.phase !== undefined && s.st !== 'playing') {
      const tx = (s.bonus.cepiStun <= 0 && s.bonus.bat > 40 && tick % 4 === 0) ? s.bonus.cepiX : (s.bonus.spotX?.[s.bonus.spot] ?? 0);
      if (s.bonus.x < tx - 0.4) keys.push('ArrowRight'); else if (s.bonus.x > tx + 0.4) keys.push('ArrowLeft');
      await hold(keys); await tap('KeyJ'); if (s.pw >= 100) await tap('KeyL');
    } else if (s.arena && s.st !== 'playing') {
      const want = Math.sin(tick / 7) * 3;
      const ax = s.arena.hero?.x ?? 0;
      if (ax < want - 0.5) keys.push('ArrowRight'); else if (ax > want + 0.5) keys.push('ArrowLeft');
      await hold(keys); if (tick % 2 === 0) await tap('KeyJ'); if (tick % 9 === 0) await tap('KeyK'); if (s.pw >= 100) await tap('KeyL');
    } else if (s.st === 'playing') {
      const near = s.en.sort((a, b) => Math.abs(a.x - s.x) - Math.abs(b.x - s.x))[0];
      if (near && Math.abs(near.x - s.x) < 9) {
        const dx = near.x - s.x, dz = near.z - s.z;
        if (Math.abs(dx) > 1.3) keys.push(dx > 0 ? 'ArrowRight' : 'ArrowLeft');
        if (Math.abs(dz) > 0.5) keys.push(dz > 0 ? 'ArrowDown' : 'ArrowUp');
        await hold(keys);
        if (Math.abs(dx) < 2.2 && Math.abs(dz) < 1.1) await tap('KeyJ');
        if (tick % 13 === 0) await tap('KeyK');
        if (s.pw >= 100) await tap('KeyL');
      } else { await hold(['ArrowRight']); if (tick % 25 === 0) await tap('Space'); }
    } else { await hold([]); }
    await page.waitForTimeout(90);
  }
} catch (e) { L('ERROR BOT: ' + e.message); }
finally {
  L('errores: ' + JSON.stringify(errors));
  fs.writeFileSync(`/home/claude/play/${hero}${from}_log.txt`, log.join('\n'));
  await browser.close();
}
