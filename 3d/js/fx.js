// Efectos de golpe: chispas, anillos, sacudón, congelado y textos flotantes.
import { fillText } from './i18n.js';
import { placePops } from './pop_layout.js';
import { createHitShake, flashAlpha, isReducedMotion } from './feedback.js';
import { createSkillFxPool } from './skill_fx_three.js';
export function createFx(scene, camera, labelsEl, flashEl) {
  // Este pool NO tiene dispose() a propósito: createFx se llama una sola vez al arrancar (main.js) y vive toda
  // la sesión. Sus texturas (calle + poderes del héroe) quedan compartidas con las arenas, que las reusan sin
  // rehornear. Entre escenas solo se hace clear() (ver más abajo), nunca se destruye.
  const skillPool = createSkillFxPool(THREE, scene, camera, { maxActive: 10, reduceMotion: isReducedMotion });
  skillPool.preload(['effekseer_astral_slash_gold', 'douge_truth_slam', 'marine_ivy_whirl']);
  const sparkTex = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const g = c.getContext('2d');
    const r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.4, 'rgba(255,220,120,0.9)'); r.addColorStop(1, 'rgba(255,140,60,0)');
    g.fillStyle = r; g.fillRect(0, 0, 64, 64);
    const t = new THREE.CanvasTexture(c);
    if (THREE.sRGBEncoding !== undefined) t.encoding = THREE.sRGBEncoding;
    return t;
  })();
  const sparkMat = new THREE.SpriteMaterial({ map: sparkTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true });
  // Pool de materiales de chispa: cada una necesita su propia opacidad, pero crear/destruir un material por chispa
  // (hasta 10 por golpe) generaba basura y recompilaciones; se reciclan al apagarse.
  const matPool = [];
  function sparkMaterial() {
    const m = matPool.pop() || sparkMat.clone();
    m.color.setHex(0xffffff); m.blending = THREE.AdditiveBlending; m.opacity = 1;
    return m;
  }
  function release(p) {
    scene.remove(p.obj);
    if (p.kind === 'spark') { if (matPool.length < 64) matPool.push(p.obj.material); else p.obj.material.dispose(); }
    else p.obj.material.dispose();
  }
  const ringGeo = new THREE.RingGeometry(0.75, 1, 32);
  const parts = [];
  // Estelas de ataque: arcos brillantes en el aire. `made` cuenta cuántas se dibujaron (para las pruebas)
  const made = { short: 0, long: 0, finisher: 0, enemy: 0, line: 0 };
  const SLASH = {
    short:    { r: 1.0, arc: 1.9, color: 0xffffff, life: 0.16, tilt: 0.3 },
    long:     { r: 1.25, arc: 2.3, color: 0xffe08a, life: 0.2, tilt: -0.35 },
    finisher: { r: 1.7, arc: 2.8, color: 0xffb02e, life: 0.28, tilt: 0.7 },
    enemy:    { r: 1.0, arc: 1.9, color: 0xff4d5e, life: 0.18, tilt: -0.3 }
  };
  const arcGeos = {};
  const lineGeo = new THREE.PlaneGeometry(1.3, 0.07);
  const pops = [];
  const shaker = createHitShake();
  let stop = 0;
  const proj = new THREE.Vector3();
  const lay = [];

  function popup(pos, text, color = '#fff', { size = 20, life = 0.8, rise = 1.4 } = {}) {
    const el = document.createElement('div');
    el.className = 'pop';
    fillText(el, text);
    el.style.color = color;
    el.style.fontSize = size + 'px';
    labelsEl.appendChild(el);
    pops.push({ el, pos: pos.clone(), life, max: life, rise });
  }

  return {
    // opts.combo: golpe 2 un poco más grande que el 1 (12 chispas, aro 0,75). opts.armored: golpe que no entra
    // (patovica embistiendo): chispas grises, sin aro.
    hit(pos, strength = 1, { combo = -1, armored = false } = {}) {
      // con mucha gente (varios golpes seguidos) se baja a 3 chispas para no asignar decenas de sprites por cuadro
      let n = parts.length > 36 ? 3 : Math.round(5 + strength * 5);
      if (!armored && combo === 1 && n > 3) n += 2;
      if (armored) n = Math.min(n, 4);
      for (let i = 0; i < n; i++) {
        const mat = sparkMaterial();
        if (armored) { mat.color.setHex(0x9aa0a8); mat.blending = THREE.NormalBlending; }
        const s = new THREE.Sprite(mat);
        const size = 0.35 + Math.random() * 0.35 * strength;
        s.scale.set(size, size, 1);
        s.position.copy(pos);
        const a = Math.random() * Math.PI * 2;
        const v = new THREE.Vector3(Math.cos(a) * (2 + Math.random() * 4) * strength, 1 + Math.random() * 4, Math.sin(a) * 1.5);
        scene.add(s);
        parts.push({ obj: s, v, life: 0.3 + Math.random() * 0.15, max: 0.45, kind: 'spark' });
      }
      if (armored) return;
      const ring = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: strength > 1.2 ? 0xffd36e : 0xffffff, transparent: true, opacity: 0.9, depthWrite: false, side: THREE.DoubleSide }));
      ring.position.copy(pos);
      ring.lookAt(camera.position);
      scene.add(ring);
      parts.push({ obj: ring, v: null, life: 0.2, max: 0.2, kind: 'ring', r: (combo === 1 ? 0.75 : 0.6) + strength * 0.5 });
      // Aro oscuro detrás (#effects «暗い色も混ぜる»): el blanco/dorado se pierde sobre asfalto claro y veredas
      const rim = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: 0x3a1020, transparent: true, opacity: 0.7, depthWrite: false, side: THREE.DoubleSide }));
      rim.position.copy(pos);
      rim.lookAt(camera.position);
      rim.translateZ(-0.02);
      scene.add(rim);
      parts.push({ obj: rim, v: null, life: 0.24, max: 0.24, kind: 'ring', r: 0.75 + strength * 0.55, op: 0.7 });
    },
    slash(pos, facing, kind = 'short') {
      const k = SLASH[kind];
      made[kind]++;
      arcGeos[kind] ??= new THREE.RingGeometry(0.6, 1, 20, 1, -k.arc / 2, k.arc);
      const m = new THREE.Mesh(arcGeos[kind], new THREE.MeshBasicMaterial({ color: k.color, transparent: true, opacity: 0.95, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }));
      m.position.set(pos.x + facing * 0.8, pos.y, pos.z + 0.35);
      m.lookAt(camera.position);
      m.rotateZ(k.tilt * facing);
      scene.add(m);
      parts.push({ obj: m, v: null, life: k.life, max: k.life, kind: 'slash', r: k.r, facing });
    },
    // Corte astral del remate: solo si el golpe conectó, dorado como la estela, chico y cortado a 20F para no
    // tapar el KO (antes: 40F, 3,1 m, cian, salía aunque no pegara).
    finisherFx(pos, facing) {
      skillPool.play('effekseer_astral_slash_gold', { x: pos.x + facing * 0.9, y: pos.y + 0.1, z: pos.z + 0.45 },
        { worldSize: 2.2, facing, opacity: 0.8, maxSeconds: 20 / 60 });
    },
    skill(presetId, pos, opts) { return skillPool.play(presetId, pos, opts); },
    skillPool,
    // Raya de velocidad detrás de algo que corre (embestida del patovica)
    speedLine(pos, facing) {
      made.line++;
      const m = new THREE.Mesh(lineGeo, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }));
      m.position.set(pos.x - facing * 0.7, 0.4 + Math.random() * 1.8, pos.z + (Math.random() - 0.5) * 0.6);
      m.lookAt(camera.position);
      scene.add(m);
      parts.push({ obj: m, v: new THREE.Vector3(-facing * 3, 0, 0), life: 0.18, max: 0.18, kind: 'line' });
    },
    made,
    count(kind) { return parts.filter(p => p.kind === kind).length; },
    dust(pos) {
      for (let i = 0; i < 3; i++) {
        const s = new THREE.Sprite(sparkMaterial());
        s.scale.set(0.5, 0.5, 1);
        s.position.copy(pos);
        s.position.y = 0.2;
        scene.add(s);
        parts.push({ obj: s, v: new THREE.Vector3((Math.random() - 0.5) * 2, 0.6, (Math.random() - 0.5)), life: 0.25, max: 0.25, kind: 'spark' });
      }
    },
    shake(amount, seconds) { shaker.set(amount, seconds); },
    hitstop(seconds) { stop = Math.max(stop, seconds); },
    flash(color = '#ff4d5e', opacity = 0.35) {
      flashEl.style.transition = 'none';
      flashEl.style.background = color;
      flashEl.style.opacity = flashAlpha(opacity);
      void flashEl.offsetWidth;
      flashEl.style.transition = 'opacity 0.35s ease-out';
      flashEl.style.opacity = 0;
    },
    popup,
    // Devuelve true mientras dura el congelado (el juego no avanza)
    frozen(dt) {
      if (stop > 0) { stop -= dt; return true; }
      return false;
    },
    applyShake(dt) {
      const s = shaker.step(dt);
      camera.position.x += s.x;
      camera.position.y += s.y;
    },
    update(dt) {
      skillPool.update(dt);
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.life -= dt;
        const k = Math.max(0, p.life / p.max);
        if (p.kind === 'spark') {
          p.v.y -= 14 * dt;
          p.obj.position.addScaledVector(p.v, dt);
          p.obj.material.opacity = k;
        } else if (p.kind === 'slash') {
          const sc = p.r * (0.7 + 0.5 * (1 - k));
          p.obj.scale.set(p.facing * sc, sc, 1);
          p.obj.material.opacity = k * 0.95;
        } else if (p.kind === 'line') {
          p.obj.position.addScaledVector(p.v, dt);
          p.obj.material.opacity = k * 0.8;
        } else {
          p.obj.scale.setScalar(p.r * (1.6 - k));
          p.obj.material.opacity = k * (p.op ?? 1);
        }
        if (p.life <= 0) {
          release(p);
          parts.splice(i, 1);
        }
      }
      const w = innerWidth, h = innerHeight;
      lay.length = 0;
      for (let i = pops.length - 1; i >= 0; i--) {
        const p = pops[i];
        p.life -= dt;
        p.pos.y += p.rise * dt;
        const v = proj.copy(p.pos).project(camera);
        // que los textos largos no se corten en el borde de la pantalla
        const half = (p.halfW ??= p.el.offsetWidth / 2);
        if (p.life > 0) lay.push({ o: p, el: p.el, x: Math.min(w - half - 6, Math.max(half + 6, ((v.x + 1) / 2) * w)), y: ((1 - v.y) / 2) * h });
        p.el.style.opacity = Math.min(1, p.life / (p.max * 0.4));
        if (p.life <= 0) { p.el.remove(); pops.splice(i, 1); }
      }
      placePops(lay.reverse(), dt);
    },
    clear() {
      skillPool.clear();
      for (const p of parts) release(p);
      parts.length = 0;
      for (const p of pops) p.el.remove();
      pops.length = 0;
      shaker.reset(); stop = 0;
    }
  };
}
