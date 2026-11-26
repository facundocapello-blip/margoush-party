// Escala y transiciones suaves entre poses (A-5):
// - poseHeight: mantiene la cabeza del mismo tamaño entre hojas de distinto recorte.
// - poseScaleBlend: interpola tamaño durante ~80 ms al cambiar de pose + squash & stretch
//   (anticipación al atacar, retroceso al recibir golpe, rebote al caer de un salto).
export const CROSSFADE = 0.08;

export function poseHeight(manifest, name, refName) {
  const m = manifest[name], r = manifest[refName];
  if (!m.skull || !r.skull) return 1;
  return ((m.h / m.rows) / m.skull) / ((r.h / r.rows) / r.skull);
}

export function poseImpulseKind(poseName) {
  const s = String(poseName || '').toLowerCase();
  if (/hurt|stun|ko|down|fall/.test(s)) return -1;
  if (/punch|attack|strike|throw|smash|windup|aim|jump|power|slam|dance_jump/.test(s)) return 1;
  return 0;
}

export function poseScaleBlend(prevW, prevH, targetW, targetH, fadeT, impT = 0, impSign = 0, landT = 0) {
  const f = Math.max(0, Math.min(1, fadeT / CROSSFADE));
  const u = 1 - f;
  const e = u * u * (3 - 2 * u);
  const bw = prevW > 0 ? prevW + (targetW - prevW) * e : targetW;
  const bh = prevH > 0 ? prevH + (targetH - prevH) * e : targetH;
  const imp = impSign * Math.sin(Math.max(0, Math.min(1, impT)) * Math.PI) * 0.065;
  const land = Math.sin(Math.max(0, Math.min(1, landT)) * Math.PI) * 0.11;
  return {
    w: bw * (1 + land - imp * 0.5),
    h: bh * (1 - land + imp),
    ghostOpacity: f * 0.78
  };
}

// Fundido cruzado (~80 ms) + squash & stretch para sprites planos de las arenas (sin costo cuando no cambian)
export function triggerSpriteBlend(m, prevMap, prevW, prevH, key, unitGeo, keep, scene) {
  const tw = m.userData.w, th = m.userData.hh;
  m.userData.tw = tw; m.userData.th = th;
  if (!prevMap || !prevW || !prevH || typeof THREE === 'undefined') return;
  let g = m.userData.ghost;
  if (!g) {
    const mat = keep(new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, alphaTest: 0.05, depthWrite: false, side: THREE.DoubleSide }));
    g = new THREE.Mesh(unitGeo, mat);
    g.visible = false;
    scene.add(g);
    m.userData.ghost = g;
  }
  g.material.map = prevMap;
  g.material.opacity = 0.78;
  g.material.needsUpdate = true;
  g.position.copy(m.position);
  g.position.z -= 0.015;
  g.rotation.copy(m.rotation);
  g.scale.copy(m.scale);
  g.visible = true;
  const kind = poseImpulseKind(key);
  const b = m.userData._blend || (m.userData._blend = { fadeT: 0, prevW: tw, prevH: th, impT: 0, impSign: 0, landT: 0, wasAir: false, lastMs: 0 });
  b.fadeT = CROSSFADE;
  b.prevW = prevW;
  b.prevH = prevH;
  if (kind !== 0) { b.impT = 1; b.impSign = kind; }
  // Evita salto brusco de tamaño en el cuadro 0 de la nueva pose
  const out = poseScaleBlend(prevW, prevH, tw, th, b.fadeT, b.impT, b.impSign, b.landT);
  m.userData.w = out.w;
  m.userData.hh = out.h;
}

export function stepSpriteBlend(m, py = 0) {
  const b = m.userData._blend || (m.userData._blend = { fadeT: 0, prevW: 0, prevH: 0, impT: 0, impSign: 0, landT: 0, wasAir: false, lastMs: 0 });
  const now = typeof performance !== 'undefined' ? performance.now() : 0;
  const dt = b.lastMs ? Math.min(0.05, Math.max(0, (now - b.lastMs) / 1000)) : 1 / 60;
  b.lastMs = now;
  const inAir = py > 0.08;
  if (b.wasAir && !inAir) b.landT = 1;
  b.wasAir = inAir;
  if (b.fadeT > 0) b.fadeT = Math.max(0, b.fadeT - dt);
  if (b.impT > 0) b.impT = Math.max(0, b.impT - dt * 6.5);
  if (b.landT > 0) b.landT = Math.max(0, b.landT - dt * 6.2);
  const tw = m.userData.tw ?? m.userData.w;
  const th = m.userData.th ?? m.userData.hh;
  if (tw && th) {
    if (b.fadeT > 0 || b.impT > 0 || b.landT > 0) {
      const out = poseScaleBlend(b.prevW || tw, b.prevH || th, tw, th, b.fadeT, b.impT, b.impSign, b.landT);
      m.userData.w = out.w;
      m.userData.hh = out.h;
      const g = m.userData.ghost;
      if (g) {
        g.visible = b.fadeT > 0 && m.visible;
        if (g.visible) {
          g.material.opacity = out.ghostOpacity;
          g.position.set(m.position.x, m.position.y, m.position.z - 0.015);
          g.rotation.copy(m.rotation);
        }
      }
    } else {
      m.userData.w = tw;
      m.userData.hh = th;
      if (m.userData.ghost) m.userData.ghost.visible = false;
    }
  }
}
