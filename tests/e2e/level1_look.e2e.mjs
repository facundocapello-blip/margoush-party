import { launch, open, startRun, check } from './harness.mjs';

// Buenos Aires y Francia se ven distintos: casitas de chapa de colores, asfalto, banderines celestes y blancos
// y el Obelisco en el Nivel 1; fachadas pintadas, adoquines, guirnaldas tricolor y macetas en Francia.
const { browser, page, errors } = await launch({ viewport: { width: 960, height: 540 } });
const G = (fn, arg) => page.evaluate(fn, arg);
try {
  await open(page);
  await startRun(page, 'douge');
  const r = await G(() => {
    const { scene, assets } = window.__game.ctx;
    const bgImg = assets.texture('street_bg').image;
    const out = { painted1: 0, painted2: 0, celeste: 0, tricolor1: 0, tricolor2: 0, pots1: 0, pots2: 0, obelisco: 0 };
    scene.traverse(o => {
      if (!o.isMesh || !o.position) return;
      const x = o.position.x, inL1 = x > 0 && x < 112, inL2 = x > 152 && x < 260;
      const map = o.material.map;
      if (map && map.image === bgImg && o.position.z < -5) { if (inL1) out.painted1++; if (inL2) out.painted2++; }
      if (o.material.isMeshBasicMaterial && o.geometry.type === 'BufferGeometry' && o.position.z === -4.7) {
        const c = o.material.color.getHex();
        if (inL1 && c === 0x74b9e8) out.celeste++;
        if (c === 0xd23a3a) { if (inL1) out.tricolor1++; if (inL2) out.tricolor2++; }
      }
      // maceta: la pintada del kit (prop_maceta) o la de figuras simples
      const pot = (o.geometry.type === 'CylinderGeometry' && o.material.color && o.material.color.getHex() === 0xb4643c) || o.material?.map?.image?.src?.includes('prop_maceta');
      if (pot) { if (inL1) out.pots1++; if (inL2) out.pots2++; }
      if (o.geometry.type === 'ConeGeometry' && o.material.color && o.material.color.getHex() === 0xf1e9dc) out.obelisco++;
    });
    return out;
  });
  check(r.painted1 === 0 && r.painted2 >= 4, `Buenos Aires no usa las fachadas de París (BA ${r.painted1}, Francia ${r.painted2})`);
  check(r.celeste >= 10 && r.tricolor1 === 0, `en Buenos Aires los banderines son celestes y blancos (${r.celeste}; tricolor ${r.tricolor1})`);
  check(r.tricolor2 >= 5, `en Francia siguen las guirnaldas tricolor (${r.tricolor2})`);
  check(r.pots1 === 0 && r.pots2 >= 3, `las macetas francesas quedan en Francia (BA ${r.pots1}, Francia ${r.pots2})`);
  check(r.obelisco === 1, 'el Obelisco está en Buenos Aires');
  check(errors.length === 0, 'sin errores en consola: ' + errors.join(' | '));
} finally { await browser.close(); }
