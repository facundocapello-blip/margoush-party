import { SpriteActor } from './sprites.js';

export const FACU_LINES = {
  intro: 'Buenas noches, Le Concept. Esta noche, BIG CHAKY se llevó a Margot. ¡Aplausos para nuestro héroe!',
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
  car.add(body, hood, trunk, bumperF, bumperB, glass, light, light2);
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
  const labels = document.querySelector('#labels');
  const tag = document.createElement('div');
  tag.className = 'tag-name';
  tag.textContent = 'FACU';
  const bubble = document.createElement('div');
  bubble.className = 'speech hidden';
  labels.append(tag, bubble);
  let bubbleT = 0;
  let jokeIdx = 0;
  let vx = 0, vy = 0, rolled = 0, idleT = 0;

  function place() {
    const h = game.hero.actor.position;
    car.position.set(Math.min(world.bounds.maxX - 2, h.x + AHEAD), 0, LANE_Z);
    vx = 0; vy = 0;
  }
  place();

  const project = (el, y) => {
    const v = actor.position.clone();
    v.y += y;
    v.project(ctx.camera);
    const vis = v.z < 1 && (game.state === 'playing' || game.state === 'rescue' || game.state === 'intro');
    el.style.display = vis ? '' : 'none';
    el.style.left = ((v.x + 1) / 2) * innerWidth + 'px';
    el.style.top = ((1 - v.y) / 2) * innerHeight + 'px';
  };

  function syncActor() {
    actor.position.set(car.position.x - 0.35, car.position.y + 0.1, LANE_Z);
    actor.setFacing(1);
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

    say(text, seconds = 2.5) {
      bubble.textContent = text;
      bubble.classList.remove('hidden');
      bubbleT = seconds;
    },

    update(dt) {
      const h = game.hero.actor.position;
      const p = car.position;
      f.jokeCd = Math.max(0, f.jokeCd - dt);
      if (Math.abs(h.x - p.x) > 16) { place(); fx.dust(p); }

      // Siempre para adelante: alcanza al héroe y lo espera; solo vuelve si quedó muy lejos
      const target = Math.min(world.bounds.maxX - 2, h.x + AHEAD);
      const diff = target - p.x;
      const want = diff > 0.2 ? Math.min(MAX_SPEED, diff * 2.5) : (diff < -7 ? -2 : 0);
      vx += (want - vx) * Math.min(1, dt * 5);
      if (want >= 0) vx = Math.max(0, vx);
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

      // Chiste con megáfono: aturde a los que rodean al héroe
      if (f.jokeCd <= 0) {
        const near = game.enemies.list.filter(e => e.hp > 0 && Math.hypot(e.pos.x - h.x, e.pos.z - h.z) < 4).length;
        if (near >= 2) {
          f.jokeCd = JOKE_EVERY;
          f.lastJokeStuns = game.enemies.stunAround(h.x, h.z, 4, 1.5);
          const line = FACU_LINES.jokes[jokeIdx++ % FACU_LINES.jokes.length];
          f.say('🎤 ' + line, 1.6);
          fx.popup(h.clone().setY(3.2), line, '#ffe08a', { size: 26, life: 1.1 });
          ctx.audio?.sfx('laugh');
        }
      }

      syncActor();
      actor.update(dt, 0);
      if (bubbleT > 0) { bubbleT -= dt; if (bubbleT <= 0) bubble.classList.add('hidden'); }
      f.refreshLabels();
    },

    // Para escenas: estaciona el auto en un lugar fijo
    park(x) {
      car.position.set(x, 0, LANE_Z);
      vx = 0; vy = 0;
      syncActor();
      actor.update(0, 0);
    },

    refreshLabels() { project(tag, actor.heightM + 0.3); project(bubble, actor.heightM + 0.75); },

    dispose() {
      scene.remove(car);
      car.traverse((o) => { if (o.geometry) o.geometry.dispose(); });
      actor.dispose();
      tag.remove();
      bubble.remove();
    }
  };
  syncActor();
  actor.update(0, 0);
  return f;
}
