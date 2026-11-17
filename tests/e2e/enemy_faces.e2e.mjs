import { launch, open, startRun, check } from './harness.mjs';

// Cada tipo de malo tiene su propia cara: cada uno usa un dibujo distinto, no el secuaz recoloreado
const { browser, page, errors } = await launch({ viewport: { width: 960, height: 540 } });
const G = (fn, arg) => page.evaluate(fn, arg);
const KINDS = ['secuaz', 'patovica', 'bombo', 'mozo', 'delivery'];

try {
  await open(page);
  await startRun(page, 'douge');
  await G(() => { const g = window.__game; g.setStage('vereda'); g.enemies.clear(); g.traps.disable(); });
  const info = await G((kinds) => kinds.map(k => {
    const e = window.__game.enemies.spawn(40, 0, k);
    return { kind: k, tex: e.k.tex };
  }), KINDS);
  const texs = info.map(i => i.tex);
  check(new Set(texs).size === KINDS.length, 'cada tipo usa un dibujo distinto: ' + texs.join(', '));
  for (const i of info) check(/^face_/.test(i.tex), `${i.kind} usa su propia cara (${i.tex})`);
  check(info.every(i => i.tex !== 'courier'), 'ninguno usa el courier base');
  // Lale usa su hoja de 4 poses (idle, paso, golpe, daño), no una sola imagen
  const lale = await G(() => { const e = window.__game.enemies.spawn(44, 0, 'lale'); const p = e.actor.poses;
    return { cells: ['idle', 'step', 'strike', 'hurt'].map(n => p[n] && p[n].cell), cols: p.idle && p.idle.cols }; });
  check(lale.cols === 4 && lale.cells.join() === '0,1,2,3', 'Lale usa su hoja de 4 poses: ' + JSON.stringify(lale));
  check(errors.length === 0, 'sin errores en consola: ' + errors.join(' | '));
  console.log('OK enemy_faces');
} finally {
  await browser.close();
}
