import { SpriteActor } from './sprites.js';

// Facu ya no acompaña toda la partida: aparece de golpe y en chiste, unos segundos por vez.
//  - Alcantarilla: una vez por nivel, cuando te rodean 2 malos o más, sale de una alcantarilla,
//    tira un chiste que los aturde y se vuelve a meter.
//  - Auto a toda velocidad: una vez por nivel cruza por el carril de atrás tocando bocina y saludando.
//  - Francia: al pasar al Nivel 2 aparece con boina y baguette («¡Allez, allez!») y desaparece.
//  - Resultado (si ganás): asoma por un costado de la pantalla (eso está en ui.js).
export const FACU_LINES = {
  level2: '¡Allez, allez!',
  jokes: ['¡JAJAJA! ¡No da más!', '¡Chiste malísimo! ¡JAJAJA!', '¡JAJAJA! ¡Qué chiste, che!'],
  honk: ['¡BIP BIP! ¡Aguante Margot!', '¡BIP BIP! ¡Voy a buscar facturas!'],
  result: ['¡Ni yo lo hacía tan rápido!', '¡Esto lo subo a Instagram!', '¡Aplausos para el héroe!']
};
export const FACU = { nearFoes: 2, nearR: 4, stun: 1.6, rise: 0.45, stay: 1.2, driveSpeed: 15, driveAt: { 1: 34, 2: 196 } };
const LANE_Z = -4.25; // carril de atrás, sobre la vereda

// Autito descapotable de Facu
function buildCar() {
  const car = new THREE.Group();
  const paint = new THREE.MeshLambertMaterial({ color: 0xe8434f });
  const dark = new THREE.MeshLambertMaterial({ color: 0x1b1626 });
  const chrome = new THREE.MeshLambertMaterial({ color: 0xd9d9e3 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.5, 1.15), paint);
  body.position.y = 0.6;
  const hood = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.22, 1.1), paint);
  hood.position.set(0.85, 0.94, 0);
  const trunk = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.2, 1.1), paint);
  trunk.position.set(-1.0, 0.93, 0);
  const bumperF = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.16, 1.2), chrome);
  bumperF.position.set(1.33, 0.42, 0);
  const bumperB = bumperF.clone(); bumperB.position.x = -1.33;
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.45), new THREE.MeshBasicMaterial({ color: 0xbfe6ff, transparent: true, opacity: 0.45, side: THREE.DoubleSide }));
  glass.position.set(0.38, 1.25, 0);
  glass.rotation.set(0, Math.PI / 2, -0.35);
  const lightMat = new THREE.MeshBasicMaterial({ color: 0xfff1b8 });
  const light = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 8), lightMat);
  light.position.set(1.32, 0.66, 0.42);
  const light2 = light.clone(); light2.position.z = -0.42;
  // Franja de carrera, asiento y halos de los faros
  const cream = new THREE.MeshLambertMaterial({ color: 0xfff1d6 });
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.62, 0.12, 1.17), cream);
  stripe.position.y = 0.66;
  const glowTex = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const g = c.getContext('2d'); const r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    r.addColorStop(0, 'rgba(255,240,180,1)'); r.addColorStop(1, 'rgba(255,220,140,0)');
    g.fillStyle = r; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c);
  })();
  const haloMat = new THREE.SpriteMaterial({ map: glowTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true });
  for (const z of [0.42, -0.42]) {
    const halo = new THREE.Sprite(haloMat);
    halo.scale.set(0.9, 0.9, 1);
    halo.position.set(1.42, 0.66, z);
    car.add(halo);
  }
  car.add(body, hood, trunk, bumperF, bumperB, glass, light, light2, stripe);
  const wheels = [];
  for (const [x, z] of [[0.85, 0.6], [-0.85, 0.6], [0.85, -0.6], [-0.85, -0.6]]) {
    const w = new THREE.Group();
    const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.2, 16), dark);
    tire.rotation.x = Math.PI / 2;
    const hub = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.08, 0.22), chrome);
    w.add(tire, hub);
    w.position.set(x, 0.3, z);
    car.add(w);
    wheels.push(w);
  }
  car.userData.wheels = wheels;
  car.userData.body = body;
  return car;
}

function emojiTex(emoji, size = 128) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  const g = c.getContext('2d');
  g.font = `${size * 0.78}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(emoji, size / 2, size * 0.56);
  const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding;
  return t;
}

export function createFacu(ctx) {
  const { scene, assets, fx, game } = ctx;
  const car = buildCar();
  car.visible = false;
  scene.add(car);
  const actor = new SpriteActor(scene, assets, { poses: { idle: { tex: 'facu' } }, heightM: 1.9, shadow: 0.4 });
  actor.mesh.visible = false; actor.shadow.visible = false;
  // Alcantarilla (disco oscuro con borde) y accesorios de Francia
  const hole = new THREE.Group();
  const rim = new THREE.Mesh(new THREE.CircleGeometry(0.85, 28), new THREE.MeshLambertMaterial({ color: 0x55545c }));
  const pit = new THREE.Mesh(new THREE.CircleGeometry(0.68, 28), new THREE.MeshBasicMaterial({ color: 0x0b0a10 }));
  rim.rotation.x = pit.rotation.x = -Math.PI / 2; rim.position.y = 0.03; pit.position.y = 0.035;
  hole.add(rim, pit); hole.visible = false; scene.add(hole);
  const baguette = new THREE.Sprite(new THREE.SpriteMaterial({ map: emojiTex('🥖'), transparent: true, depthWrite: false }));
  baguette.scale.set(0.9, 0.9, 1); baguette.visible = false; scene.add(baguette);
  // Boina francesa dibujada (antes era un cilindro que con la luz se veía como un cuadradito gris)
  const beretTex = (() => {
    const c = document.createElement('canvas'); c.width = 256; c.height = 128;
    const g = c.getContext('2d');
    g.translate(128, 74); g.rotate(-0.12);
    const body = g.createRadialGradient(-28, -22, 6, 0, 0, 110);
    body.addColorStop(0, '#4a4658'); body.addColorStop(0.45, '#22202c'); body.addColorStop(1, '#0d0c12');
    g.fillStyle = body; g.beginPath(); g.ellipse(6, 4, 108, 58, 0, Math.PI * 1.02, Math.PI * 2.02); g.quadraticCurveTo(70, 26, 0, 24); g.quadraticCurveTo(-80, 24, -102, 2); g.fill();
    g.fillStyle = '#121018'; g.beginPath(); g.ellipse(0, 20, 86, 10, 0, 0, Math.PI * 2); g.fill();     // borde que calza en la cabeza
    g.fillStyle = 'rgba(255,255,255,0.14)'; g.beginPath(); g.ellipse(-30, -20, 40, 9, -0.2, 0, Math.PI * 2); g.fill(); // brillo de la lana
    g.strokeStyle = '#0d0c12'; g.lineWidth = 7; g.lineCap = 'round'; g.beginPath(); g.moveTo(10, -38); g.quadraticCurveTo(16, -52, 26, -54); g.stroke(); // piquito
    const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; return t;
  })();
  const beret = new THREE.Sprite(new THREE.SpriteMaterial({ map: beretTex, transparent: true, depthWrite: false }));
  beret.scale.set(0.92, 0.5, 1); beret.renderOrder = 3; beret.visible = false; scene.add(beret);

  let act = null;          // aparición en curso: { kind, t, ... }
  let jokeIdx = 0, idleT = 0, talkT = 0;
  const shown = { hole: {}, drive: {} };

  function show(on) { actor.mesh.visible = on; actor.shadow.visible = on && act?.kind !== 'drive'; }
  function end() {
    act = null; show(false); car.visible = false; hole.visible = false; baguette.visible = false; beret.visible = false;
    actor.lift = 0; actor.lean = 0; actor.stretch = 0;
  }

  function startHole(h) {
    shown.hole[game.level] = true;
    const side = game.hero.actor.facing;
    const x = h.x + side * 2.2, z = Math.max(-3, Math.min(3, h.z + 1.2));
    hole.position.set(x, 0, z); hole.visible = true;
    actor.position.set(x, 0, z); actor.setFacing(-side);
    act = { kind: 'hole', t: 0, x, z, joked: false };
    show(true); fx.dust(actor.position);
  }
  function startDrive(h) {
    shown.drive[game.level] = true;
    car.visible = true;
    car.position.set(h.x - 14, 0, LANE_Z);
    act = { kind: 'drive', t: 0, honked: false };
    show(true);
    ctx.audio?.sfx('engine');
  }

  const f = {
    actor, car,
    lines: FACU_LINES,
    jokeCd: 0,           // las pruebas lo suben para que no aparezca
    lastJokeStuns: 0,
    get appearing() { return act?.kind || null; },

    // Facu habla por el canal único de mensajes (un cartel por vez)
    say(text, seconds = 2.6) {
      talkT = Math.max(talkT, seconds);
      game.banner('😄 FACU', text, seconds, { avatar: assets.url('facu') });
    },

    // Francia: aparece con boina y baguette al empezar el Nivel 2
    france(x) {
      end();
      act = { kind: 'france', t: 0, x };
      actor.position.set(x, 0, -1.6); actor.setFacing(-1);
      show(true);
      baguette.visible = beret.visible = true;
      fx.dust(actor.position);
      fx.popup(actor.position.clone().setY(2.7), FACU_LINES.level2, '#7ec8ff', { size: 26, life: 1.6, rise: 0.3 });
      ctx.audio?.say('Allez, allez !', 'fr-FR');
    },

    update(dt) {
      idleT += dt;
      f.jokeCd = Math.max(0, f.jokeCd - dt);
      const h = game.hero.actor.position;
      if (!act && game.state === 'playing') {
        const near = game.enemies.list.filter(e => e.hp > 0 && e.state !== 'dead' && Math.hypot(e.pos.x - h.x, e.pos.z - h.z) < FACU.nearR).length;
        if (f.jokeCd <= 0 && !shown.hole[game.level] && near >= FACU.nearFoes) startHole(h);
        else if (f.jokeCd <= 0 && !shown.drive[game.level] && h.x > FACU.driveAt[game.level] && game.enemies.alive() === 0) startDrive(h);
      }
      if (!act) return;
      act.t += dt;
      if (act.kind === 'hole') {
        // sube, cuenta el chiste (aturde), se ríe y se vuelve a meter
        const R = FACU.rise, S = FACU.stay, t = act.t;
        const up = t < R ? t / R : t < R + S ? 1 : Math.max(0, 1 - (t - R - S) / R);
        actor.lift = -1.9 * (1 - up);
        actor.stretch = Math.sin(idleT * 9) * 0.05;
        actor.lean = Math.sin(idleT * 8) * 0.1;
        if (!act.joked && t >= R) {
          act.joked = true;
          f.lastJokeStuns = game.enemies.stunAround(h.x, h.z, FACU.nearR + 0.5, FACU.stun);
          fx.popup(actor.position.clone().setY(2.6), FACU_LINES.jokes[jokeIdx++ % FACU_LINES.jokes.length], '#ffe08a', { size: 22, life: 1.5, rise: 0.3 });
          ctx.audio?.sfx('laugh');
        }
        if (t > R * 2 + S) { fx.dust(actor.position); end(); return; }
      } else if (act.kind === 'drive') {
        // cruza a toda velocidad por atrás, tocando bocina y saludando
        car.position.x += FACU.driveSpeed * dt;
        car.position.y = Math.abs(Math.sin(act.t * 18)) * 0.05;
        for (const w of car.userData.wheels) w.rotation.z -= FACU.driveSpeed * dt / 0.3;
        actor.position.set(car.position.x - 0.35, car.position.y + 0.1, LANE_Z);
        actor.setFacing(1);
        actor.lean = Math.sin(idleT * 10) * 0.12;
        actor.lift = Math.abs(Math.sin(idleT * 8)) * 0.1;
        if (!act.honked && car.position.x > h.x - 2) {
          act.honked = true;
          fx.popup(new THREE.Vector3(car.position.x, 3, LANE_Z), FACU_LINES.honk[game.level === 2 ? 1 : 0], '#ffe08a', { size: 22, life: 1.3, rise: 0.2 });
          ctx.audio?.sfx('horn');
        }
        if (car.position.x > h.x + 16) { end(); return; }
      } else if (act.kind === 'france') {
        const t = act.t;
        actor.lift = t < 0.35 ? Math.sin(t / 0.35 * Math.PI) * 0.7 : Math.abs(Math.sin(idleT * 5)) * 0.08;
        actor.lean = Math.sin(idleT * 4) * 0.08;
        const p = actor.position;
        beret.position.set(p.x + 0.03, actor.lift + 1.915, p.z + 0.12);
        baguette.position.set(p.x - 0.55, actor.lift + 1.05, p.z + 0.1);
        baguette.material.rotation = Math.sin(idleT * 6) * 0.5;
        if (t > 2.6) { fx.dust(p); end(); return; }
      }
      actor.update(dt, 0);
    },

    // Compatibilidad: escenas que antes estacionaban el auto (ya no hay auto que acompañe)
    park() {},
    celebrate() {},
    reset() { end(); shown.hole = {}; shown.drive = {}; },

    dispose() {
      end();
      scene.remove(car, hole, baguette, beret);
      car.traverse((o) => { if (o.geometry) o.geometry.dispose(); });
      actor.dispose();
    }
  };
  return f;
}
