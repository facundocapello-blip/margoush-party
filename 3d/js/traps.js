// Trampas del recorrido. Las fijas (baldosa, bache) están siempre; las de tramo
// (colectivo, boletas, trottinette, palomas, grève) aparecen solas mientras el héroe está en su tramo.
// Todas avisan antes de actuar.
import { TRAPS } from './level.js';
import { SpriteActor } from './sprites.js';

export const TIMING = {
  colectivo: { warn: 1.0, speed: 28, lane: 1.3, length: 10 },
  trottinette: { warn: 0.85, speed: 20, lane: 0.8, length: 1.4, clearLift: 0.7 },
  boletas: { fall: 1.1, radius: 0.65, penalty: 100 },
  palomas: { warn: 0.8, fly: 1.6, count: 24 },
  greve: { speed: 1.9, distance: 15, start: 9, push: 7 },
  baldosa: { slow: 2, cooldown: 3 },
  fire: { reach: 0.95 }
};
const BILLS = ['EXPENSAS', 'LUZ', 'GAS', 'ABL', 'AGUA'];

function canvasTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding;
  return t;
}
const emoji = (e) => canvasTex(128, 128, (c) => { c.font = '96px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(e, 64, 72); });

export function createTraps(ctx) {
  const { scene, world, fx, game, assets } = ctx;
  const audio = () => ctx.audio;
  const list = TRAPS.map(t => ({ ...t, timer: (t.every || 0) * 0.6, cd: 0 }));
  const active = [];
  const lastWarnMs = {};
  let enabled = true;

  // ---------- materiales ----------
  const flat = (geo, mat, y = 0.03) => { const m = new THREE.Mesh(geo, mat); m.rotation.x = -Math.PI / 2; m.position.y = y; scene.add(m); return m; };
  const tileMat = new THREE.MeshLambertMaterial({ map: canvasTex(128, 128, (c, w, h) => {
    c.fillStyle = '#8f8c93'; c.fillRect(0, 0, w, h);
    c.strokeStyle = '#4a4850'; c.lineWidth = 6; c.strokeRect(3, 3, w - 6, h - 6);
    c.strokeStyle = '#3a383f'; c.lineWidth = 3; c.beginPath(); c.moveTo(20, 30); c.lineTo(60, 64); c.lineTo(50, 100); c.moveTo(60, 64); c.lineTo(108, 80); c.stroke();
    const g = c.createRadialGradient(80, 90, 4, 80, 90, 40); g.addColorStop(0, 'rgba(110,90,60,0.8)'); g.addColorStop(1, 'rgba(110,90,60,0)');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
  }) });
  const holeMat = new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, map: canvasTex(256, 256, (c, w, h) => {
    c.fillStyle = '#4a4650';
    c.beginPath();
    for (let i = 0; i <= 24; i++) { const a = i / 24 * Math.PI * 2, r = 118 + Math.sin(i * 2.7) * 8; c.lineTo(w / 2 + Math.cos(a) * r, h / 2 + Math.sin(a) * r); }
    c.fill();
    const g = c.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, 108);
    g.addColorStop(0, '#05030a'); g.addColorStop(0.8, '#120d18'); g.addColorStop(1, '#2a2530');
    c.fillStyle = g; c.beginPath();
    for (let i = 0; i <= 24; i++) { const a = i / 24 * Math.PI * 2, r = 104 + Math.sin(i * 3.1) * 9; c.lineTo(w / 2 + Math.cos(a) * r, h / 2 + Math.sin(a) * r); }
    c.fill();
  }) });
  const coneMat = new THREE.MeshLambertMaterial({ color: 0xff7a1a });
  const stripeMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
  const warnMat = new THREE.MeshBasicMaterial({ color: 0xff3b30, transparent: true, opacity: 0.35, depthWrite: false });
  const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.45, depthWrite: false });
  const birdMat = new THREE.SpriteMaterial({ map: emoji('🕊️'), transparent: true, depthWrite: false });
  const billTex = BILLS.map(b => canvasTex(128, 80, (c, w, h) => {
    c.fillStyle = '#f7f3e8'; c.fillRect(0, 0, w, h);
    c.fillStyle = '#c0392b'; c.fillRect(0, 0, w, 18);
    c.fillStyle = '#222'; c.font = '900 20px Arial'; c.textAlign = 'center'; c.fillText(b, w / 2, 46);
    c.fillStyle = '#888'; c.fillRect(14, 56, w - 28, 4); c.fillRect(14, 66, w - 50, 4);
  }));
  const greveTex = canvasTex(256, 128, (c, w, h) => {
    c.fillStyle = '#f4efe4'; c.fillRect(0, 0, w, h);
    c.strokeStyle = '#333'; c.lineWidth = 5; c.strokeRect(4, 4, w - 8, h - 8);
    c.fillStyle = '#c0392b'; c.font = '900 66px "Comic Sans MS", Arial'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText('GRÈVE !', w / 2, h / 2 + 4);
  });

  // ---------- trampas fijas ----------
  for (const t of list) {
    if (t.kind === 'baldosa') {
      const m = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.08, 1.3), tileMat);
      m.position.set(t.x, 0.04, t.z);
      m.rotation.set(0.05, 0.3, -0.06);
      scene.add(m);
      t.mesh = m;
    }
    if (t.kind === 'bache') {
      const d = t.z1 - t.z0;
      const m = flat(new THREE.PlaneGeometry(t.w + 0.5, d + 0.4), holeMat, 0.025);
      m.position.set(t.x, 0.025, (t.z0 + t.z1) / 2);
      // conitos a los costados
      for (const [cx, cz] of [[t.x - t.w / 2 - 0.5, t.z0 + 0.3], [t.x + t.w / 2 + 0.5, t.z1 - 0.3]]) {
        if (Math.abs(cz) > 3.7) continue;
        const cone = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.7, 12), coneMat);
        cone.position.set(cx, 0.35, cz);
        const band = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.16, 0.12, 12), stripeMat);
        band.position.set(cx, 0.42, cz);
        scene.add(cone, band);
      }
      t.mesh = m;
    }
  }

  // ---------- eventos de tramo ----------
  function laneStripe(len, width) {
    const m = flat(new THREE.PlaneGeometry(len, width), warnMat.clone(), 0.04);
    return m;
  }

  function buildBus() {
    const g = new THREE.Group();
    const L = TIMING.colectivo.length;
    const body = new THREE.Mesh(new THREE.BoxGeometry(L, 1.6, 2.4), new THREE.MeshLambertMaterial({ color: 0xc8312e }));
    body.position.y = 1.1;
    const top = new THREE.Mesh(new THREE.BoxGeometry(L, 1.1, 2.4), new THREE.MeshLambertMaterial({ color: 0xf0e2c0 }));
    top.position.y = 2.45;
    const win = new THREE.Mesh(new THREE.BoxGeometry(L - 1.2, 0.7, 2.45), new THREE.MeshBasicMaterial({ color: 0x2a3550 }));
    win.position.set(-0.3, 2.45, 0);
    const front = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.9, 2.0), new THREE.MeshBasicMaterial({ color: 0x2a3550 }));
    front.position.set(L / 2 + 0.01, 2.3, 0);
    const num = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.7), new THREE.MeshBasicMaterial({ map: canvasTex(128, 64, (c, w, h) => { c.fillStyle = '#111'; c.fillRect(0, 0, w, h); c.fillStyle = '#ffb000'; c.font = '900 44px Arial'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('60', w / 2, h / 2 + 2); }) }));
    num.position.set(L / 2 - 1.2, 3.1, 1.22);
    const wheelGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.3, 14);
    const wheelMat = new THREE.MeshLambertMaterial({ color: 0x151518 });
    for (const x of [-L / 2 + 1.6, L / 2 - 1.8]) for (const z of [-1.15, 1.15]) {
      const w = new THREE.Mesh(wheelGeo, wheelMat); w.rotation.x = Math.PI / 2; w.position.set(x, 0.5, z); g.add(w);
    }
    const light = new THREE.Sprite(new THREE.SpriteMaterial({ color: 0xfff1b0, transparent: true, opacity: 0.9 }));
    light.scale.set(0.5, 0.5, 1); light.position.set(L / 2 + 0.1, 1.2, 0.8);
    g.add(body, top, win, front, num, light);
    scene.add(g);
    return g;
  }

  function buildScooter() {
    const g = new THREE.Group();
    const mat = new THREE.MeshLambertMaterial({ color: 0x22c3a6 });
    const deck = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.1, 0.3), mat); deck.position.y = 0.22;
    const stem = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.2, 0.08), mat); stem.position.set(0.5, 0.8, 0); stem.rotation.z = -0.15;
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.6), new THREE.MeshLambertMaterial({ color: 0x18181c })); bar.position.set(0.58, 1.4, 0);
    for (const x of [-0.5, 0.5]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.1, 12), new THREE.MeshLambertMaterial({ color: 0x18181c })); w.rotation.x = Math.PI / 2; w.position.set(x, 0.14, 0); g.add(w); }
    g.add(deck, stem, bar);
    scene.add(g);
    const rider = new SpriteActor(scene, assets, { poses: { idle: { tex: 'courier_manifestante' } }, heightM: 2.0, shadow: 0 });
    return { g, rider };
  }

  function start(kind, forced = false) {
    const hp = game.hero.actor.position;
    const z = Math.max(-3.2, Math.min(3.2, hp.z));
    let a = null;
    if (kind === 'colectivo' || kind === 'trottinette') {
      const T = TIMING[kind];
      const dir = kind === 'colectivo' ? 1 : (Math.random() < 0.5 ? 1 : -1);
      const span = 50;
      a = { kind, state: 'warn', t: 0, warn: T.warn, lane: z, dir, front: hp.x - dir * 26, hitDone: false, stripe: laneStripe(span, T.lane * 2) };
      a.stripe.position.set(hp.x, 0.04, z);
      if (kind === 'colectivo') { a.mesh = buildBus(); audio()?.sfx('horn'); fx.popup(new THREE.Vector3(hp.x - dir * 6, 2.6, z), '🚌 ¡BOCINAZO!', '#ffd36e', { size: 24, life: 0.9, rise: 0.3 }); }
      else { const s = buildScooter(); a.mesh = s.g; a.rider = s.rider; audio()?.sfx('scooter'); fx.popup(new THREE.Vector3(hp.x - dir * 5, 2.4, z), '🛴', '#fff', { size: 28, life: 0.8, rise: 0.3 }); }
      a.mesh.visible = false;
    }
    if (kind === 'boletas') {
      const tx = forced ? hp.x : hp.x + (Math.random() - 0.3) * 3, tz = forced ? z : Math.max(-3.4, Math.min(3.4, z + (Math.random() - 0.5) * 2.4));
      const shadow = flat(new THREE.CircleGeometry(TIMING.boletas.radius, 20), shadowMat.clone(), 0.04);
      shadow.position.set(tx, 0.04, tz);
      const paper = new THREE.Mesh(new THREE.PlaneGeometry(0.75, 0.47), new THREE.MeshBasicMaterial({ map: billTex[(Math.random() * billTex.length) | 0], side: THREE.DoubleSide, transparent: true }));
      paper.position.set(tx, 7, tz);
      scene.add(paper);
      a = { kind, state: 'fall', t: 0, x: tx, z: tz, shadow, paper, landed: false, seed: Math.random() * 6 };
      audio()?.sfx('paper');
    }
    if (kind === 'palomas') {
      a = { kind, state: 'warn', t: 0, birds: [] };
      fx.popup(hp.clone().setY(3.2), '🐦 ¡PALOMAS!', '#ffffff', { size: 24, life: 0.9, rise: 0.3 });
      audio()?.sfx('flap');
    }
    if (kind === 'greve') {
      const T = TIMING.greve;
      const lb = world.levelBounds;
      let dir = -1, x0 = hp.x + T.start;
      if (x0 > lb.maxX - 1) { dir = 1; x0 = hp.x - T.start; }
      const slots = [-3.2, -2.1, -1.0, 0.1, 1.2, 2.3, 3.4];
      const gap = 1 + ((Math.random() * (slots.length - 2)) | 0);
      const gapZ = slots[gap];
      const people = [];
      slots.forEach((sz, i) => {
        if (i === gap) return;
        const actor = new SpriteActor(scene, assets, { poses: { idle: { tex: 'courier_manifestante' } }, heightM: 2.15 });
        actor.position.set(x0 + (Math.random() - 0.5) * 0.3, 0, sz);
        actor.setFacing(dir);
        const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.55), new THREE.MeshBasicMaterial({ map: greveTex, side: THREE.DoubleSide }));
        sign.position.set(0, 2.75, 0);
        actor.root.add(sign);
        people.push({ actor, seed: Math.random() * 6 });
      });
      a = { kind, state: 'march', t: 0, x: x0, dir, gapZ, people, walked: 0 };
      audio()?.sfx('crowd');
    }
    if (a) active.push(a);
    return a;
  }

  function finish(a) {
    if (a.stripe) { scene.remove(a.stripe); a.stripe.geometry.dispose(); }
    if (a.mesh) scene.remove(a.mesh);
    a.rider?.dispose();
    if (a.shadow) { scene.remove(a.shadow); a.shadow.geometry.dispose(); }
    if (a.paper) scene.remove(a.paper);
    for (const b of a.birds || []) scene.remove(b);
    for (const p of a.people || []) p.actor.dispose();
  }

  function heroInLaneHit(a, T, lift) {
    const hero = game.hero, hp = hero.actor.position;
    return Math.abs(hp.z - a.lane) < T.lane && hero.lift < lift && !hero.isDodging();
  }

  function updateActive(dt) {
    const hero = game.hero, hp = hero.actor.position;
    const cam = ctx.camera.position;
    for (let i = active.length - 1; i >= 0; i--) {
      const a = active[i];
      a.t += dt;
      if (a.kind === 'colectivo' || a.kind === 'trottinette') {
        const T = TIMING[a.kind];
        if (a.state === 'warn') {
          a.stripe.material.opacity = Math.floor(a.t * 10) % 2 ? 0.45 : 0.18;
          a.stripe.position.x = hp.x;
          if (a.t >= a.warn) {
            lastWarnMs[a.kind] = Math.round(a.t * 1000);
            a.state = 'go'; a.front = hp.x - a.dir * 24; a.mesh.visible = true;
            if (a.kind === 'colectivo') audio()?.sfx('engine');
          }
        } else {
          const prev = a.front;
          a.front += a.dir * T.speed * dt;
          a.stripe.material.opacity = 0.18;
          const L = T.length;
          a.mesh.position.set(a.front - a.dir * L / 2, 0, a.lane);
          a.mesh.rotation.y = a.dir > 0 ? 0 : Math.PI;
          if (a.rider) { a.rider.position.set(a.front - a.dir * 0.5, 0.25, a.lane); a.rider.setFacing(a.dir); a.rider.update(dt, 0); }
          // Pega una sola vez, cuando el frente pasa por donde está el héroe
          const crossed = (prev - hp.x) * (a.front - hp.x) <= 0;
          if (!a.hitDone && crossed) {
            a.hitDone = true;
            if (heroInLaneHit(a, T, a.kind === 'colectivo' ? 2.6 : T.clearLift)) {
              if (hero.hurt(1, a.front - a.dir * 2)) hero.push(a.dir * (a.kind === 'colectivo' ? 12 : 7), (hp.z >= a.lane ? 1 : -1) * 6);
            }
          }
          if (Math.abs(a.front - hp.x) > 30 && a.hitDone) { finish(a); active.splice(i, 1); }
        }
      } else if (a.kind === 'boletas') {
        const T = TIMING.boletas;
        if (!a.landed) {
          const k = Math.min(1, a.t / T.fall);
          a.paper.position.y = 7 * (1 - k) + 0.06;
          a.paper.position.x = a.x + Math.sin(a.t * 6 + a.seed) * 0.5 * (1 - k);
          a.paper.rotation.set(-Math.PI / 2 * k + Math.sin(a.t * 8) * 0.6 * (1 - k), 0, Math.sin(a.t * 5 + a.seed) * 0.8 * (1 - k));
          a.shadow.scale.setScalar(0.5 + 0.5 * k);
          a.shadow.material.opacity = 0.2 + 0.35 * k;
          if (k >= 1) {
            a.landed = true; a.t = 0;
            a.paper.position.set(a.x, 0.06, a.z);
            a.shadow.visible = false;
            if (Math.hypot(hp.x - a.x, hp.z - a.z) < T.radius && hero.lift < 1) {
              game.score.addPenalty(T.penalty);
              fx.popup(hp.clone().setY(2.8), '−100 ' + BILLS[(Math.random() * BILLS.length) | 0], '#ff6b6b', { size: 22, life: 1 });
              audio()?.sfx('coin');
            }
          }
        } else {
          a.paper.material.opacity = Math.max(0, 1 - a.t / 1.5);
          if (a.t > 1.5) { finish(a); active.splice(i, 1); }
        }
      } else if (a.kind === 'palomas') {
        const T = TIMING.palomas;
        if (a.state === 'warn' && a.t >= T.warn) {
          a.state = 'fly'; a.t = 0;
          for (let n = 0; n < T.count; n++) {
            const b = new THREE.Sprite(birdMat);
            const s = 0.9 + Math.random() * 0.9;
            b.scale.set(s, s, 1);
            b.userData = { x0: -12 - Math.random() * 8, y: 1.4 + Math.random() * 4.5, z: 3.5 + Math.random() * 4, v: 13 + Math.random() * 6, ph: Math.random() * 6 };
            scene.add(b);
            a.birds.push(b);
          }
        }
        if (a.state === 'fly') {
          for (const b of a.birds) {
            const u = b.userData;
            b.position.set(cam.x + u.x0 + u.v * a.t, u.y + Math.sin(a.t * 18 + u.ph) * 0.15, hp.z * 0.35 + u.z);
            b.material.rotation = Math.sin(a.t * 20 + u.ph) * 0.2;
          }
          if (a.t >= T.fly) { finish(a); active.splice(i, 1); }
        }
      } else if (a.kind === 'greve') {
        const T = TIMING.greve;
        const step = T.speed * dt;
        a.walked += step;
        a.x += a.dir * step;
        const fade = Math.max(0, Math.min(1, (T.distance - a.walked) / 1.5));
        for (const p of a.people) {
          p.actor.position.x = a.x + Math.sin(p.seed) * 0.15;
          p.actor.lift = Math.abs(Math.sin(a.t * 6 + p.seed)) * 0.1;
          p.actor.material.opacity = fade;
          p.actor.material.transparent = fade < 1;
          p.actor.update(dt, 0);
          // Empujan sin lastimar: no te dejan pasar y te corren para atrás
          if (fade > 0.3 && Math.abs(hp.z - p.actor.position.z) < 0.75 && Math.abs(hp.x - p.actor.position.x) < 0.8) {
            hp.x = p.actor.position.x + a.dir * 0.8;
            hero.push(a.dir * T.push, 0);
          }
        }
        if (a.walked >= T.distance) { finish(a); active.splice(i, 1); }
      }
    }
  }

  function updateStatic(dt) {
    const hero = game.hero, hp = hero.actor.position;
    for (const t of list) {
      if (t.kind === 'baldosa') {
        t.cd = Math.max(0, t.cd - dt);
        if (t.cd <= 0 && hero.lift < 0.1 && Math.abs(hp.x - t.x) < 0.65 && Math.abs(hp.z - t.z) < 0.65) {
          t.cd = TIMING.baldosa.cooldown;
          hero.slow(TIMING.baldosa.slow);
          fx.dust(hp);
          fx.popup(hp.clone().setY(2.6), '¡SPLASH!', '#c9a26b', { size: 22, life: 0.8 });
          audio()?.sfx('splash');
          t.wobble = 0.5;
        }
        if (t.wobble > 0) { t.wobble -= dt; t.mesh.rotation.x = 0.05 + Math.sin(t.wobble * 30) * 0.1 * t.wobble; }
      }
      if (t.kind === 'bache') {
        const inside = Math.abs(hp.x - t.x) < t.w / 2 && hp.z > t.z0 && hp.z < t.z1;
        if (!inside) { t.safeX = hp.x; t.safeZ = hp.z; continue; }
        if (hero.lift > 0.05 || hero.isDodging()) continue;
        // Cayó: pierde un corazón y vuelve al borde por donde vino
        const fromLeft = (t.safeX ?? hp.x) < t.x;
        hp.x = fromLeft ? t.x - t.w / 2 - 0.6 : t.x + t.w / 2 + 0.6;
        hero.knock = 0;
        fx.popup(hp.clone().setY(2.6), '¡BACHE!', '#ff9f43', { size: 24, life: 0.8 });
        audio()?.sfx('fall');
        hero.hurt(1, fromLeft ? hp.x + 2 : hp.x - 2);
        hero.knock = 0;
      }
    }
    // Fuego del piquete: quema al que se acerca mientras el corte sigue
    for (const g of world.gates) {
      if (g.kind !== 'piquete' || g.open) continue;
      if (Math.abs(hp.x - g.x) < TIMING.fire.reach && hero.lift < 1.6) {
        if (hero.hurt(1, g.x + (hp.x < g.x ? 1 : -1))) { hero.push((hp.x < g.x ? -1 : 1) * 9, 0); audio()?.sfx('fire'); fx.popup(hp.clone().setY(2.6), '¡QUEMA!', '#ff7a3c', { size: 24, life: 0.7 }); }
      }
    }
  }

  return {
    list, active, lastWarnMs,
    update(dt) {
      updateStatic(dt);
      const hx = game.hero.actor.position.x;
      if (enabled) {
        for (const t of list) {
          if (!t.every || hx < t.from || hx > t.to) continue;
          t.timer -= dt;
          if (t.timer <= 0) {
            t.timer = t.every * (0.8 + Math.random() * 0.4);
            if (!active.some(a => a.kind === t.kind)) start(t.kind);
          }
        }
      }
      updateActive(dt);
    },
    forceNext(kind, forced = false) { return start(kind, forced); },
    disable() { enabled = false; },
    reset() {
      for (const a of active) finish(a);
      active.length = 0;
      enabled = true;
      for (const t of list) { t.timer = (t.every || 0) * 0.6; t.cd = 0; t.safeX = undefined; }
    }
  };
}
