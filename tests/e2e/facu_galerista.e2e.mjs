// Facu galerista (pintura con gesto previo + atril) y remates de Margot sin llanto (papilla / crayones), en celular vertical.
import { launch, check, shot } from './harness.mjs';

const G = (page, fn, arg) => page.evaluate(fn, arg);
const { browser, page, errors } = await launch({ viewport: { width: 430, height: 932 }, mobile: true });

async function enter(id, cond) {
  await page.goto('http://game.local/3d/index.html?probar=' + id);
  await page.waitForFunction(() => window.__game && window.__game.state === 'menu', null, { timeout: 20000 });
  await G(page, () => document.querySelector('#press-start')?.click());
  await page.waitForTimeout(600);
  await G(page, () => document.querySelector('#btn-play').click());
  await page.waitForTimeout(300);
  await G(page, () => document.querySelector('.card[data-hero="douge"]').click());
  await page.waitForFunction(cond, null, { timeout: 20000 });
}

try {
  // ---- Fase 1: apunta, tira pintura, deja charcos, se pone a pintar ----
  await enter('facu', () => window.__game.state === 'arena-facu');
  await G(page, () => { window.__game.hero.hp = window.__game.hero.hpMax = 99; });
  let sawAim = false, sawWindup = false, sawPuddle = false, sawPaint = false;
  for (let i = 0; i < 70; i++) {
    const s = await G(page, () => { const S = window.__game.arenaFacu.state; return { aim: S.blobs.some(b => b.stage === 'aim'), w: S.windup, pud: S.puddles.length, pose: S.pose }; });
    sawAim ||= s.aim; sawWindup ||= s.w > 0.3; sawPuddle ||= s.pud > 0; sawPaint ||= s.pose === 'paint';
    if (s.aim && s.w > 0.5 && !(await G(page, () => window.__shotAim))) { await shot(page, 'facu_f1_apunta'); await G(page, () => { window.__shotAim = 1; }); }
    if (sawPaint) break;
    await page.waitForTimeout(150);
  }
  check(sawAim && sawWindup, 'fase 1: apunta al héroe con gesto previo (windup)');
  check(sawPuddle, 'fase 1: la pintura deja charcos en el piso');
  check(sawPaint, 'fase 1: se pone a pintar en el atril (momento para pegarle)');
  await page.waitForTimeout(700);
  await shot(page, 'facu_f1_pinta');

  // ---- Fase 3: Margot garabatea el cuadro con crayones ----
  await enter('facu-enojado', () => window.__game.state === 'arena-facu' && window.__game.arenaFacu.state.phase === 3);
  await G(page, () => { window.__game.hero.hp = window.__game.hero.hpMax = 99; });
  await page.waitForFunction(() => window.__game.arenaFacu.state.margotReady && !document.querySelector('.margot-btn').classList.contains('hidden'), null, { timeout: 12000 });
  const btn = await G(page, () => document.querySelector('.margot-btn span').textContent);
  check(!/GRITO|llanto/i.test(btn), 'el botón de Margot ya no habla de grito/llanto: ' + btn);
  await page.waitForTimeout(2600);
  await G(page, () => document.querySelector('.margot-btn').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })));
  await page.waitForTimeout(1300);
  const st = await G(page, () => window.__game.arenaFacu.state.pose);
  check(st === 'love', 'Facu se derrite con los garabatos (pose love): ' + st);
  await shot(page, 'facu_f3_crayones');

  // ---- Pinky: papilla a los anteojos ----
  await enter('pinky-margot', () => window.__game.state === 'arena-pinky' && window.__game.arenaPinky.state.phase === 3);
  await G(page, () => { window.__game.hero.hp = window.__game.hero.hpMax = 99; });
  await page.waitForFunction(() => !document.querySelector('.margot-btn').classList.contains('hidden'), null, { timeout: 12000 });
  await page.waitForTimeout(2600);
  await G(page, () => document.querySelector('.margot-btn').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })));
  await page.waitForTimeout(400);
  await shot(page, 'pinky_papilla_vuela');
  await page.waitForTimeout(700);
  await shot(page, 'pinky_papilla_cara');
  check(true, 'pinky: papilla lanzada');

  check(errors.length === 0, 'sin errores de consola ' + JSON.stringify(errors));
} finally {
  await browser.close();
}
