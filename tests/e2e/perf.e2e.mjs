import { launch, open, startRun, check } from './harness.mjs';
import fs from 'node:fs';

const { browser, page, context, errors } = await launch({ viewport: { width: 844, height: 390 }, mobile: true });
const G = (fn, arg) => page.evaluate(fn, arg);
try {
  await open(page);
  const cdp = await context.newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await startRun(page, 'douge');
  await G(() => { const g = window.__game; g.setStage('plaza'); g.hero.hp = g.hero.hpMax = 99; g.perf.reset(); });
  // 20 s peleando en la plaza (la zona más cargada)
  const t0 = Date.now();
  while (Date.now() - t0 < 20000) {
    await page.keyboard.press('KeyJ');
    await page.waitForTimeout(250);
  }
  const perf = await G(() => ({ ...window.__game.perf.summary(), dpr: window.__game.pixelRatio() }));
  console.log('rendimiento', JSON.stringify(perf));
  check(perf.logicMs <= 4, `la lógica del juego usa ${perf.logicMs.toFixed(2)} ms por cuadro con CPU ×4 (máx 4)`);
  check(perf.avgFrameMs <= 26 || perf.level > 0, `si va lento baja la calidad sola (cuadro ${perf.avgFrameMs.toFixed(1)} ms, nivel ${perf.level}, dpr ${perf.dpr})`);
  check(errors.length === 0, 'sin errores de consola ' + JSON.stringify(errors));

  // Ranking real (solo si config.js ya tiene los datos de Supabase)
  const cfg = fs.readFileSync(new URL('../../3d/js/config.js', import.meta.url), 'utf8');
  if (/SUPABASE_URL = '(https:[^']+)'/.test(cfg)) {
    const nick = 'test-' + Date.now().toString(36).slice(-6);
    await page.unroute(/^(?!http:\/\/game\.local|https:\/\/cdnjs\.cloudflare\.com).*/);
    const res = await G(async (n) => {
      const r = window.__game.ranking;
      const s = await r.submit({ nickname: n, hero: 'douge', score: 1 });
      const t = await r.top({ period: 'week', limit: 200 });
      return { s, found: t.rows.some(x => x.nickname === n), online: t.online };
    }, nick);
    check(res.s.online && res.online && res.found, `Supabase real: se guarda y se lee "${nick}"`);
  } else {
    console.log('pendiente - Supabase todavía no configurado en 3d/js/config.js');
  }
} finally {
  await browser.close();
}
