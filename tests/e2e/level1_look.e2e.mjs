import { launch, open, startRun, check } from './harness.mjs';

// El Nivel 1 tiene el mismo aspecto pintado que Francia (fachadas, adoquines, guirnaldas, macetas)
const { browser, page, errors } = await launch({ viewport: { width: 960, height: 540 } });
const G = (fn, arg) => page.evaluate(fn, arg);
try {
  await open(page);
  await startRun(page, 'douge');
  const r = await G(() => {
    const { scene, assets } = window.__game.ctx;
    const bgImg = assets.texture('street_bg').image;
    let painted = 0, flags = 0, pots = 0;
    scene.traverse(o => {
      if (!o.isMesh || !o.position) return;
      const inL1 = o.position.x > 0 && o.position.x < 112;
      if (inL1 && o.material.map && o.material.map.image === bgImg && o.position.z < -5) painted++;
      if (inL1 && o.material.isMeshBasicMaterial && o.geometry.type === 'BufferGeometry' && o.position.y > 3.5 && o.position.y < 4.5 && o.position.z === -4.7) flags++;
      if (inL1 && o.geometry.type === 'CylinderGeometry' && o.material.color && o.material.color.getHex() === 0xb4643c) pots++;
    });
    return { painted, flags, pots };
  });
  check(r.painted >= 4, `fachadas pintadas como en Francia en el tramo 0–112: ${r.painted}`);
  check(r.flags >= 20, `guirnaldas en el Nivel 1: ${r.flags}`);
  check(r.pots >= 3, `macetas en el Nivel 1: ${r.pots}`);
  check(errors.length === 0, 'sin errores en consola: ' + errors.join(' | '));
  console.log('OK level1_look');
} finally { await browser.close(); }
