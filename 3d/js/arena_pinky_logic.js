// Lógica pura de la Arena Final de Pinky «el Trapito» (Acto 4 — Playa de Estacionamiento):
// Intro revelación + 3 fases + remate final con Margot heroica.
//
// Fase 1 (HP 30→21): Dirige 1 auto a la vez entrando marcha atrás a uno de los 3 cajones;
//   cada 3 autos se distrae cobrando (`charge`) y queda abierto para pegarle.
// Fase 2 (HP 20→11): «Tarifa nocturna» — entran 2 autos en simultáneo (siempre queda ≥ 1 cajón libre).
// Fase 3 (HP 10→0): Ráfaga final + se habilita el **remate heroico de Margot** (grito supersónico
//   que despeja la playa y deja a Pinky listo para el K.O.).

export const PINKY_ARENA = {
  hpMax: 30,
  p2At: 20,
  p3At: 10,
  xMax: 4.3,
  zNear: 2.0,
  zFar: -8.2,
  bossZ: -11.8,
  lanes: [-2.9, 0, 2.9],
  laneHalfW: 1.15,
  warnTime: 0.95,
  carSpeed: 15.5,
  meleeZ: -6.2,
  meleeX: 2.3,
  points: { melee: 220, dodge: 120, margot: 500, feePenalty: 100 }
};

export function createPinkyArenaLogic({ rand = Math.random } = {}) {
  const A = PINKY_ARENA;
  const state = {
    hp: A.hpMax,
    hpMax: A.hpMax,
    phase: 1,          // 1 | 2 | 3 | 'ko'
    mode: 'reveal',    // 'reveal' | 'wave' | 'charge' | 'transition' | 'ko'
    pose: 'reveal',    // reveal | wave | charge | hurt | ko
    bossX: 0,
    cars: [],          // [{ id, lane, x, z, stage: 'warn'|'drive', t, hit }]
    margotReady: false,
    margotT: 0,        // > 0 mientras Margot hace su grito supersónico
    t: 0
  };

  let nextId = 1;
  let timer = 1.25; // revelación ágil al empezar
  let wavesLeft = 2;
  let poseName = 'reveal', poseT = 0;
  let afterPhase = null;
  let hitLock = 0;

  function setPose(name, dur) { poseName = name; poseT = dur; state.pose = name; }

  function pickLanes(count) {
    // Siempre deja al menos 1 cajón libre
    const maxCount = Math.min(count, A.lanes.length - 1);
    const pool = [0, 1, 2];
    const picked = [];
    for (let i = 0; i < maxCount; i++) {
      const idx = Math.floor(rand() * pool.length);
      picked.push(pool.splice(idx, 1)[0]);
    }
    return picked;
  }

  function spawnCarWave(count, evs) {
    const lanes = pickLanes(count);
    for (const lane of lanes) {
      state.cars.push({
        id: nextId++,
        lane,
        x: A.lanes[lane],
        z: A.bossZ + 1.5,
        stage: 'warn',
        t: 0,
        hit: false
      });
    }
    setPose('wave', 0.6);
    evs.push({ type: 'carWarn', lanes });
    evs.push({ type: 'voice', event: 'attack' });
  }

  function enterPhase(p, evs) {
    state.phase = p;
    state.mode = 'transition';
    state.cars.length = 0;
    timer = 1.45;
    afterPhase = p;
    if (p === 3) state.margotReady = true;
    setPose('reveal', 1.1);
    evs.push({ type: 'phase', phase: p });
    evs.push({ type: 'voice', event: 'phase' });
  }

  function damage(dmg, source, evs) {
    if (state.phase === 'ko') return;
    state.hp = Math.max(0, state.hp - dmg);
    evs.push({ type: 'bossHit', dmg, source, hp: state.hp });
    if (state.hp <= 0) {
      state.phase = 'ko';
      state.mode = 'ko';
      state.pose = 'ko';
      state.cars.length = 0;
      state.margotReady = false;
      evs.push({ type: 'ko' });
      evs.push({ type: 'voice', event: 'ko' });
      return;
    }
    if (state.phase === 1 && state.hp <= A.p2At) enterPhase(2, evs);
    else if (state.phase === 2 && state.hp <= A.p3At) enterPhase(3, evs);
  }

  function update(dt, hero) {
    const evs = [];
    state.t += dt;
    if (poseT > 0) poseT = Math.max(0, poseT - dt);
    if (hitLock > 0) hitLock = Math.max(0, hitLock - dt);
    if (state.margotT > 0) state.margotT = Math.max(0, state.margotT - dt);
    if (state.phase === 'ko') { state.pose = 'ko'; return evs; }

    if (state.mode === 'reveal') {
      state.pose = 'reveal';
      timer -= dt;
      if (timer <= 0) {
        state.mode = 'wave';
        wavesLeft = 2;
        timer = 0.4;
      }
      return evs;
    }

    if (state.mode === 'transition') {
      timer -= dt;
      if (timer <= 0) {
        state.mode = 'wave';
        wavesLeft = state.phase === 3 ? 2 : 2;
        timer = 0.45;
        if (afterPhase === 3) evs.push({ type: 'margotReady' });
        afterPhase = null;
      }
      return evs;
    }

    if (state.mode === 'charge') {
      timer -= dt;
      if (timer <= 0) {
        state.mode = 'wave';
        wavesLeft = 2;
        timer = 0.45;
        if (state.phase === 3 && !state.margotReady) {
          state.margotReady = true;
          evs.push({ type: 'margotReady' });
        }
      }
    } else if (state.mode === 'wave') {
      state.bossX = Math.sin(state.t * 1.2) * 2.2;
      timer -= dt;
      if (wavesLeft <= 0 && state.cars.length === 0 && timer <= 0) {
        state.mode = 'charge';
        state.bossX = 0;
        timer = 3.0;
        setPose('charge', 3.0);
        evs.push({ type: 'charging' });
        evs.push({ type: 'voice', event: 'taunt' });
      } else if (wavesLeft > 0 && timer <= 0 && state.cars.length === 0) {
        const count = state.phase >= 2 ? 2 : 1;
        spawnCarWave(count, evs);
        wavesLeft--;
        timer = wavesLeft <= 0 ? 0.75 : (state.phase === 3 ? 0.8 : 0.9);
      }
    }

    // Mover autos entrando marcha atrás
    const speed = A.carSpeed * (state.phase === 3 ? 1.18 : state.phase === 2 ? 1.08 : 1);
    for (let i = state.cars.length - 1; i >= 0; i--) {
      const c = state.cars[i];
      c.t += dt;
      if (c.stage === 'warn') {
        if (c.t >= A.warnTime) {
          c.stage = 'drive';
          c.t = 0;
          evs.push({ type: 'carGo', lane: c.lane });
        }
      } else {
        c.z += speed * dt;
        if (!c.hit && Math.abs(c.z - hero.z) < 1.15 && Math.abs(c.x - hero.x) < A.laneHalfW) {
          if (hero.dodging) {
            c.hit = true;
            evs.push({ type: 'dodge', x: hero.x, z: hero.z });
          } else if (!hero.inv) {
            c.hit = true;
            evs.push({ type: 'hurt', source: 'car', penalty: A.points.feePenalty });
            evs.push({ type: 'voice', event: 'taunt' });
          }
        }
        if (c.z > A.zNear + 3.5) state.cars.splice(i, 1);
      }
    }

    if (state.phase === 'ko') return evs.filter(e => e.type !== 'hurt');
    if (poseT > 0) state.pose = poseName;
    else if (state.mode === 'charge') state.pose = 'charge';
    else state.pose = 'wave';
    return evs;
  }

  function punch(area) {
    const evs = [];
    if (state.phase === 'ko' || state.mode === 'reveal' || state.mode === 'transition') return evs;
    if (area.z <= A.meleeZ && Math.abs(area.x - state.bossX) < A.meleeX && hitLock <= 0) {
      hitLock = 0.35;
      if (state.mode === 'charge') {
        setPose('hurt', 0.4);
        evs.push({ type: 'meleeHit', dmg: 3, x: state.bossX });
        evs.push({ type: 'voice', event: 'hurt' });
        damage(3, 'melee', evs);
      } else {
        evs.push({ type: 'guarded', x: state.bossX });
        evs.push({ type: 'voice', event: 'taunt' });
      }
    }
    return evs;
  }

  // Remate heroico de Margot en Fase 3: limpia autos, aturde y saca gran daño
  function triggerMargot() {
    const evs = [];
    if (!state.margotReady || state.phase === 'ko') return evs;
    state.margotReady = false;
    state.margotT = 2.0;
    state.cars.length = 0;
    state.mode = 'charge';
    timer = 2.6;
    setPose('hurt', 0.8);
    evs.push({ type: 'margotCry' });
    evs.push({ type: 'voice', event: 'hurt' });
    damage(6, 'margot', evs);
    return evs;
  }

  function power() {
    const evs = [];
    if (state.phase === 'ko' || state.mode === 'reveal' || state.mode === 'transition') return evs;
    state.cars.length = 0;
    state.mode = 'charge';
    timer = 2.0;
    setPose('hurt', 0.5);
    evs.push({ type: 'powerClear' });
    evs.push({ type: 'voice', event: 'hurt' });
    damage(5, 'power', evs);
    return evs;
  }

  function _setHp(hp) {
    state.hp = Math.max(0, Math.min(A.hpMax, hp));
    state.cars.length = 0;
    state.margotT = 0;
    if (state.hp <= 0) {
      state.phase = 'ko'; state.mode = 'ko'; state.pose = 'ko'; state.margotReady = false;
    } else if (state.hp <= A.p3At) {
      state.phase = 3; state.mode = 'wave'; wavesLeft = 2; timer = 0.5; state.margotReady = true;
    } else if (state.hp <= A.p2At) {
      state.phase = 2; state.mode = 'wave'; wavesLeft = 3; timer = 0.5; state.margotReady = false;
    } else {
      state.phase = 1; state.mode = 'reveal'; timer = 1.6; state.pose = 'reveal'; state.margotReady = false;
    }
  }

  return { state, update, punch, power, triggerMargot, _setHp };
}
