import { SpriteActor } from './sprites.js';

export const FACU_LINES = {
  intro: '¡Buenas noches, Buenos Aires! ¡Aplausos para nuestro héroe!',
  level2: '¡Nivel 2: Francia! Allez, allez!',
  result: '¡Señoras y señores, puntaje final!',
  jokes: ['¡JAJAJA!', '¡No da más!', '¡Qué chiste, che!']
};
const JOKE_EVERY = 12;
const LANE_Z = -4.25; // carril de atrás, sobre la vereda: arriba en pantalla, fuera de la pelea
const AHEAD = 3; // va un poco adelante del héroe
const MAX_SPEED = 10;

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

export function createFacu(ctx) {
  const { scene, assets, world, fx, game } = ctx;
  const car = buildCar();
  scene.add(car);
  // Facu sentado: la carrocería tapa las piernas
  const actor = new SpriteActor(scene, assets, { poses: { idle: { tex: 'facu' } }, heightM: 1.9, shadow: 0 });
  actor.shadow.visible = false;
  let jokeIdx = 0;
  let vx = 0, vy = 0, rolled = 0, idleT = 0;
  let lean = 0, hopT = 0, cheer = false, talkT = 0;

  // Hasta dónde puede avanzar el auto: no pasa barreras cerradas que estén delante del héroe
  function gateLimit(hx) {
    let lim = Infinity;
    for (const g of world.gates) if (!g.open && hx < g.x) lim = Math.min(lim, g.x - 1.6);
    return lim;
  }

  function place() {
    const h = game.hero.actor.position;
    car.position.set(Math.min(world.bounds.maxX - 2, h.x + AHEAD, gateLimit(h.x)), 0, LANE_Z);
    vx = 0; vy = 0;
  }
  place();

  function syncActor() {
    actor.position.set(car.position.x - 0.35, car.position.y + 0.1, LANE_Z);
    actor.setFacing(1);
  }

  function animateFacu(dt, moving) {
    idleT += dt;
    talkT = Math.max(0, talkT - dt);
    const talking = talkT > 0;
    let lift = moving ? Math.abs(Math.sin(rolled * 2.2)) * 0.05 : Math.sin(idleT * 3) * 0.015;
    // siempre se mece y respira; al hablar gesticula más y pega saltitos
    let tilt = lean + Math.sin(idleT * 2.1) * 0.07;
    let breath = Math.sin(idleT * 2.6) * 0.04;
    if (talking) {
      lift += Math.abs(Math.sin(idleT * 9)) * 0.12;
      tilt += Math.sin(idleT * 8) * 0.1;
      breath += Math.sin(idleT * 9) * 0.05;
    }
    if (hopT > 0) {
      // se para a carcajadas y se sacude de la risa
      hopT = Math.max(0, hopT - dt);
      const k = 1 - hopT / 0.6;
      lift += Math.sin(k * Math.PI) * 0.5;
      tilt += Math.sin(k * Math.PI * 6) * 0.12;
    } else if (cheer) {
      lift += Math.abs(Math.sin(idleT * 7)) * 0.45;
      tilt += Math.sin(idleT * 7) * 0.08;
    }
    actor.lift = lift;
    actor.lean = tilt;
    actor.stretch = breath;
  }

  // ¿Hay cajones del pasaje sin romper adelante del auto?
  function cratesAhead(x) {
    return game.props.crates.list.some(c => !c.broken && c.x > x + 0.5 && c.x < x + 2.6);
  }

  const f = {
    actor, car,
    lines: FACU_LINES,
    jokeCd: 6,
    lastJokeStuns: 0,

    // Facu habla por el canal único de mensajes (un cartel por vez, arriba al centro)
    say(text, seconds = 2.6) {
      talkT = Math.max(talkT, seconds);
      game.banner('😄 FACU', text, seconds, { avatar: assets.url('facu') });
    },

    update(dt) {
      const h = game.hero.actor.position;
      const p = car.position;
      f.jokeCd = Math.max(0, f.jokeCd - dt);
      if (Math.abs(h.x - p.x) > 16) { place(); fx.dust(p); }

      // Siempre para adelante: alcanza al héroe y lo espera; solo vuelve si quedó muy lejos
      // frena antes de una barrera cerrada (y retrocede si quedó encima)
      const limit = gateLimit(h.x);
      const target = Math.min(world.bounds.maxX - 2, h.x + AHEAD, limit);
      const diff = target - p.x;
      const want = p.x > limit + 0.05 ? -3 : diff > 0.2 ? Math.min(MAX_SPEED, diff * 2.5) : (diff < -7 ? -2 : 0);
      const prevVx = vx;
      vx += (want - vx) * Math.min(1, dt * 5);
      if (want >= 0) vx = Math.max(0, vx);
      else if (want === -3) vx = Math.min(vx, 0);
      p.x += vx * dt;

      // Saltito sobre los cajones del pasaje
      if (p.y === 0 && vx > 0.5 && cratesAhead(p.x)) vy = 6.5;
      if (p.y > 0 || vy > 0) {
        vy -= 22 * dt;
        p.y = Math.max(0, p.y + vy * dt);
        if (p.y === 0) { vy = 0; fx.dust(p.clone().setX(p.x - 1)); }
      }
      car.rotation.z = p.y > 0 ? vy * 0.02 : 0;
      rolled += vx * dt;
      for (const w of car.userData.wheels) w.rotation.z = -rolled / 0.3;
      // Traqueteo del motor con el auto parado
      idleT += dt;
      car.userData.body.position.y = 0.6 + (Math.abs(vx) < 0.3 ? Math.sin(idleT * 30) * 0.008 : 0);

      // Chiste: aturde a los que rodean al héroe
      if (f.jokeCd <= 0) {
        const near = game.enemies.list.filter(e => e.hp > 0 && Math.hypot(e.pos.x - h.x, e.pos.z - h.z) < 4).length;
        if (near >= 2) {
          f.jokeCd = JOKE_EVERY;
          f.lastJokeStuns = game.enemies.stunAround(h.x, h.z, 4, 1.5);
          const line = FACU_LINES.jokes[jokeIdx++ % FACU_LINES.jokes.length];
          hopT = 0.6;
          fx.popup(h.clone().setY(3.2), line, '#ffe08a', { size: 26, life: 1.1 });
          ctx.audio?.sfx('laugh');
        }
      }

      syncActor();
      // Movimientos de Facu: se va para atrás al acelerar, para adelante al frenar, rebota con el empedrado
      const accel = dt > 0 ? (vx - prevVx) / dt : 0;
      lean += (Math.max(-0.28, Math.min(0.28, accel * 0.025)) - lean) * Math.min(1, dt * 8);
      animateFacu(dt, Math.abs(vx) > 0.3);
      actor.update(dt, 0);
    },

    // Festejo del rescate: salta en el asiento
    celebrate(dt) {
      cheer = true;
      animateFacu(dt, false);
      actor.update(dt, 0);
    },

    // Para escenas: estaciona el auto en un lugar fijo
    park(x) {
      car.position.set(x, 0, LANE_Z);
      vx = 0; vy = 0;
      syncActor();
      actor.update(0, 0);
    },


    dispose() {
      scene.remove(car);
      car.traverse((o) => { if (o.geometry) o.geometry.dispose(); });
      actor.dispose();
    }
  };
  syncActor();
  actor.update(0, 0);
  return f;
}
