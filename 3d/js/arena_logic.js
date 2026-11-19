// «La arena de BIG CHAKY»: lógica pura de la pelea final (sin Three.js ni DOM, se prueba con node --test).
// El héroe vive entre zNear y zFar; BIG CHAKY está al fondo (bossZ) y se pasea de lado a lado tirando
// barriles (ruedan hacia el héroe) y cajones (caen donde estaba el héroe). Los barriles dorados se
// devuelven de un golpe y son lo único que lo lastima en la fase 1. Con la mitad de vida se enoja:
// fase 2, con el manotazo (la mano cae donde estabas, se traba y ahí sí se le pega).
// Eventos: throw, hurt, dodge, returned, bossHit, handHit, slam, rage, ko, line.
// PUNTAJE: solo cuentan `handHit` (+50) y `returned` (+300); `bossHit` es únicamente para la barra de vida
// y el feedback de daño (también sale al pegarle a la mano, no hay que puntuarlo de nuevo).
// Coordenadas: x a lo ancho (±xMax), z hacia el fondo negativo.

export const ARENA = {
  hp: 30,
  xMax: 4.2, zNear: 0, zFar: -7, bossZ: -16, bossSway: 3,
  returnWindow: 0.3,   // s antes de que el barril llegue al héroe en los que el golpe lo devuelve
  returnDmg: 3.75,     // 4 devoluciones = la mitad de la vida
  handDmg: 1.5,        // multiplica el daño del golpe
  powerDmg: 4,
  hitR: 1.05,
  phase1: { throwEvery: [2.2, 3.2], goldEvery: 3, barrelSpeed: 7, crateTime: 1.1 },
  phase2: { throwEvery: [1.5, 2.3], goldEvery: 4, slamEvery: 2, slamWarn: 0.9, stuck: 2.0 },
  points: { returned: 300, hand: 50, dodge: 100 }
};

// Tiempos internos (s)
const WINDUP = 0.6;        // pose de tirar antes de soltar
const HAND_DOWN = 0.15;    // la mano cae
const HAND_UP = 0.4;       // la mano se levanta
const CRATE_H = 8;         // altura desde la que cae el cajón
const BARREL_Y = 1.1;      // el héroe en el aire (y >= esto) pasa por encima del barril
const HAND_LOCK = 0.2;     // s mínimos entre golpes a la mano trabada
const REMOVE_Z = 4;        // el barril que pasó de largo se descarta

const LINES = {
  first: '¡Tomá, barrilito!',
  returned: '¡Me devolviste el barril, atrevido!',
  rage: '¡Ahora sí me enojé!',
  stuck: '¡Soltá, soltá!',
  power: '¡Eso no vale!'
};

export function createArenaLogic({ rand = Math.random } = {}) {
  const A = ARENA;
  const state = {
    phase: 1, hp: A.hp, hpMax: A.hp, bossX: 0, pose: 'idle',
    shots: [], hand: { state: 'none', x: 0, z: 0, t: 0 }
  };
  let t = 0, nextId = 1;
  let timer = 0;               // s hasta la próxima acción
  let throws = 0, barrels = 0; // contadores de la fase actual
  let sinceSlam = 0;           // tiros desde el último manotazo
  let firstLine = false;
  let handLock = 0;            // s hasta poder volver a pegarle a la mano
  let poseName = null, poseT = 0; // pose forzada (hurt / rage) y cuánto dura
  const crateT = new Map();    // id del cajón → segundos que lleva cayendo

  const cfg = () => (state.phase === 2 ? A.phase2 : A.phase1);
  const interval = () => { const [a, b] = cfg().throwEvery; return a + rand() * (b - a); };
  const wantsSlam = () => state.phase === 2 && sinceSlam >= A.phase2.slamEvery && state.hand.state === 'none';
  timer = interval();

  function clearAll() {
    state.shots = [];
    crateT.clear();
    Object.assign(state.hand, { state: 'none', t: 0 });
  }

  // Después de cambiar la vida: ko (una sola vez) o cambio a fase 2
  function checkLife(evs) {
    if (state.phase === 'ko') return;
    if (state.hp <= 0) {
      state.hp = 0;
      state.phase = 'ko';
      state.pose = 'ko';
      poseName = null; poseT = 0;
      clearAll();
      evs.push({ type: 'ko' });
    } else if (state.phase === 1 && state.hp <= state.hpMax / 2) {
      state.phase = 2;
      state.pose = poseName = 'rage';
      poseT = 1.2;
      throws = 0; barrels = 0; sinceSlam = 0;
      timer = 1.5 + interval();
      evs.push({ type: 'rage' }, { type: 'line', text: LINES.rage });
    }
  }

  function damage(dmg, by, evs) {
    if (state.phase === 'ko') return;
    state.hp = Math.max(0, state.hp - dmg);
    evs.push({ type: 'bossHit', dmg, by });
    const was = state.phase;
    checkLife(evs);
    if (state.phase === was && state.phase !== 'ko') { poseName = 'hurt'; poseT = 0.35; }
  }

  // Un proyectil o la mano toca al héroe: esquive > invulnerable > daño
  function touch(hero, by, evs) {
    if (hero.dodging) evs.push({ type: 'dodge' });
    else if (!hero.inv) evs.push({ type: 'hurt', by });
    return !!(hero.dodging || !hero.inv);
  }

  function release(hero, evs) {
    if (wantsSlam()) {
      sinceSlam = 0;
      Object.assign(state.hand, { state: 'warn', x: hero.x, z: hero.z, t: 0 });
      return;
    }
    const kind = throws % 3 === 2 ? 'crate' : 'barrel';
    throws++; sinceSlam++;
    const c = cfg();
    const shot = { id: nextId++, kind, gold: false, x: state.bossX, z: A.bossZ, y: 0, returning: false };
    if (kind === 'barrel') {
      shot.gold = (barrels + 1) % c.goldEvery === 0;
      barrels++;
    } else {
      shot.x = hero.x; shot.z = hero.z; shot.y = CRATE_H;
      crateT.set(shot.id, 0);
    }
    state.shots.push(shot);
    evs.push({ type: 'throw', kind });
    if (kind === 'barrel' && !firstLine) { firstLine = true; evs.push({ type: 'line', text: LINES.first }); }
  }

  function moveShots(dt, hero, evs) {
    const c = A.phase1, keep = [];
    for (const s of state.shots) {
      if (state.phase === 'ko') break;
      if (s.kind === 'crate') {
        const age = (crateT.get(s.id) || 0) + dt;
        crateT.set(s.id, age);
        s.y = Math.max(0, CRATE_H * (1 - age / c.crateTime));
        if (age < c.crateTime) { keep.push(s); continue; }
        crateT.delete(s.id);
        if (Math.hypot(hero.x - s.x, hero.z - s.z) < A.hitR) touch(hero, 'crate', evs);
      } else if (s.returning) {
        s.z -= c.barrelSpeed * 2 * dt;
        if (s.z > A.bossZ) { keep.push(s); continue; }
        evs.push({ type: 'line', text: LINES.returned });
        damage(A.returnDmg, 'barrel', evs);
      } else {
        s.z += c.barrelSpeed * dt;
        if (Math.hypot(hero.x - s.x, hero.z - s.z) < A.hitR && hero.y < BARREL_Y) {
          if (touch(hero, 'barrel', evs)) continue; // golpeó o lo esquivaron: el barril se va
        }
        if (s.z < REMOVE_Z) keep.push(s);
      }
    }
    state.shots = state.phase === 'ko' ? [] : keep;
  }

  function moveHand(dt, hero, evs) {
    const h = state.hand;
    if (h.state === 'none') return;
    h.t += dt;
    if (h.state === 'warn' && h.t >= A.phase2.slamWarn) {
      Object.assign(h, { state: 'down', t: 0 });
      evs.push({ type: 'slam', x: h.x, z: h.z });
      if (Math.hypot(hero.x - h.x, hero.z - h.z) < A.hitR) touch(hero, 'hand', evs);
    } else if (h.state === 'down' && h.t >= HAND_DOWN) {
      Object.assign(h, { state: 'stuck', t: 0 });
      evs.push({ type: 'line', text: LINES.stuck });
    } else if (h.state === 'stuck' && h.t >= A.phase2.stuck) {
      Object.assign(h, { state: 'up', t: 0 });
    } else if (h.state === 'up' && h.t >= HAND_UP) {
      Object.assign(h, { state: 'none', t: 0 });
    }
  }

  function update(dt, hero) {
    const evs = [];
    if (state.phase === 'ko') return evs;
    t += dt;
    state.bossX = Math.sin(t * 0.6) * A.bossSway;
    if (poseT > 0) poseT -= dt;
    if (handLock > 0) handLock -= dt;
    timer -= dt;
    if (timer <= 0) { release(hero, evs); timer = interval(); }
    moveShots(dt, hero, evs);
    if (state.phase !== 'ko') moveHand(dt, hero, evs);
    // si lo noquearon en este cuadro, ningún golpe al héroe del mismo cuadro vale
    if (state.phase === 'ko') return evs.filter(e => e.type !== 'hurt');
    // pose
    if (state.phase === 'ko') state.pose = 'ko';
    else if (poseT > 0) state.pose = poseName;
    else if (state.hand.state === 'warn' || state.hand.state === 'down') state.pose = 'slam';
    else if (timer <= WINDUP) state.pose = wantsSlam() ? 'slam' : 'throw';
    else state.pose = 'idle';
    return evs;
  }

  function punch(area) {
    const evs = [];
    if (state.phase === 'ko') return evs;
    // un dorado que viene hacia el héroe, dentro de la ventana, vuelve
    const maxD = A.returnWindow * A.phase1.barrelSpeed;
    for (const s of state.shots) {
      if (s.kind !== 'barrel' || !s.gold || s.returning) continue;
      const d = area.z - s.z;
      if (Math.abs(s.x - area.x) < A.hitR && d > 0 && d <= maxD) {
        s.returning = true;
        evs.push({ type: 'returned' });
      }
    }
    // la mano trabada se castiga
    const h = state.hand;
    if (h.state === 'stuck' && handLock <= 0 && Math.hypot(area.x - h.x, area.z - h.z) < area.reach) {
      const dmg = A.handDmg * area.dmg;
      handLock = HAND_LOCK;
      // handHit es lo que puntúa (+50); el bossHit de abajo es solo para la barra de vida / feedback
      evs.push({ type: 'handHit', dmg });
      damage(dmg, 'hand', evs);
    }
    return evs;
  }

  function power() {
    const evs = [];
    if (state.phase === 'ko') return evs;
    state.shots = [];
    crateT.clear();
    damage(A.powerDmg, 'power', evs);
    if (state.phase !== 'ko') evs.push({ type: 'line', text: LINES.power });
    return evs;
  }

  // Gancho de pruebas (e2e): fija la vida y aplica las mismas reglas que un daño
  function _setHp(hp) {
    const evs = [];
    if (state.phase === 'ko') return evs;
    state.hp = Math.max(0, Math.min(state.hpMax, hp));
    checkLife(evs);
    return evs;
  }

  return { get state() { return state; }, update, punch, power, _setHp };
}
