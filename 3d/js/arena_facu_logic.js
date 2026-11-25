// Lógica pura de la Arena Final de Facu «el Cerebro» (Acto 5 — Galería HENRIS, Buenos Aires).
// Intro revelación + 3 fases + remate final con Margot (el llanto de Margot lo ablanda).
//
// Fase 1 (HP 30→21): tira cuadros por los 3 carriles (aviso en el piso y después vuela el marco);
//   cada 2 tandas se queda sin cuadros (`charge`) y queda abierto para pegarle.
// Fase 2 (HP 20→11): minijuego «¿cuál es el cuadro verdadero?»: se muestra el verdadero, se mezclan
//   los tres y hay que pegarle al verdadero (cada acierto saca 3). El falso mancha de pintura (-1 ♥).
// Fase 3 (HP 10→0): se enoja: tira de a dos cuadros más rápido y se habilita el remate de Margot
//   (su llanto lo ablanda y lo deja listo para el K.O.).

export const FACU_ARENA = {
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
  carSpeed: 15.5,      // velocidad de los cuadros
  meleeZ: -6.2,
  meleeX: 2.3,
  pickZ: -8.6,         // dónde cuelgan los tres cuadros del minijuego
  pickReach: 1.5,
  pick: { show: 1.5, swap: 0.42, swaps: 5, choose: 6, result: 0.9 },
  points: { melee: 220, dodge: 120, margot: 500, pick: 300, paintPenalty: 100 }
};

export function createFacuArenaLogic({ rand = Math.random } = {}) {
  const A = FACU_ARENA;
  const state = {
    hp: A.hpMax,
    hpMax: A.hpMax,
    phase: 1,          // 1 | 2 | 3 | 'ko'
    mode: 'reveal',    // 'reveal' | 'wave' | 'charge' | 'transition' | 'pick' | 'ko'
    pose: 'reveal',    // reveal | throw | charge | hurt | ko  (la vista le agrega el enojo en la fase 3)
    bossX: 0,
    cars: [],          // cuadros en vuelo: [{ id, lane, x, z, stage: 'warn'|'drive', t, hit }]
    pick: null,        // minijuego: { stage: 'show'|'shuffle'|'choose'|'result', t, round, frames: [{ id, x, real }] }
    angry: false,
    margotReady: false,
    margotT: 0,
    t: 0
  };

  let nextId = 1;
  let timer = 1.25;
  let wavesLeft = 2;
  let poseName = 'reveal', poseT = 0;
  let afterPhase = null;
  let hitLock = 0;
  let swap = null; // { a, b, fromA, fromB, t, left }

  function setPose(name, dur) { poseName = name; poseT = dur; state.pose = name; }

  function pickLanes(count) {
    const maxCount = Math.min(count, A.lanes.length - 1); // siempre queda un carril libre
    const pool = [0, 1, 2];
    const picked = [];
    for (let i = 0; i < maxCount; i++) picked.push(pool.splice(Math.floor(rand() * pool.length), 1)[0]);
    return picked;
  }

  function spawnFrameWave(count, evs) {
    for (const lane of pickLanes(count)) {
      state.cars.push({ id: nextId++, lane, x: A.lanes[lane], z: A.bossZ + 1.5, stage: 'warn', t: 0, hit: false });
    }
    setPose('throw', 0.6);
    evs.push({ type: 'carWarn' });
    evs.push({ type: 'voice', event: 'attack' });
  }

  // ---------- minijuego de la fase 2 ----------
  function startPick(evs, round = 1) {
    const real = Math.floor(rand() * 3);
    state.mode = 'pick';
    state.cars.length = 0;
    state.pick = {
      stage: 'show', t: 0, round,
      frames: A.lanes.map((x, i) => ({ id: i, x, real: i === real }))
    };
    swap = null;
    setPose('throw', 0.5);
    evs.push({ type: 'pickStage', stage: 'show' });
    evs.push({ type: 'voice', event: 'pick' });
  }

  function startSwap(evs) {
    const P = state.pick;
    const a = Math.floor(rand() * 3);
    let b = Math.floor(rand() * 2); if (b >= a) b++;
    swap = { a, b, fromA: P.frames[a].x, fromB: P.frames[b].x, t: 0 };
    P.swapsLeft--;
  }

  function updatePick(dt, evs) {
    const P = state.pick;
    if (!P) return;
    P.t += dt;
    if (P.stage === 'show') {
      if (P.t >= A.pick.show) {
        P.stage = 'shuffle'; P.t = 0; P.swapsLeft = A.pick.swaps;
        evs.push({ type: 'pickStage', stage: 'shuffle' });
        startSwap(evs);
      }
    } else if (P.stage === 'shuffle') {
      if (swap) {
        swap.t += dt;
        const k = Math.min(1, swap.t / A.pick.swap), e = k * k * (3 - 2 * k);
        P.frames[swap.a].x = swap.fromA + (swap.fromB - swap.fromA) * e;
        P.frames[swap.b].x = swap.fromB + (swap.fromA - swap.fromB) * e;
        if (swap.t >= A.pick.swap) {
          swap = null;
          if (P.swapsLeft > 0) startSwap(evs);
          else { P.stage = 'choose'; P.t = 0; evs.push({ type: 'pickStage', stage: 'choose' }); }
        }
      }
    } else if (P.stage === 'choose') {
      if (P.t >= A.pick.choose) {
        evs.push({ type: 'pickTimeout' });
        evs.push({ type: 'voice', event: 'taunt' });
        P.stage = 'result'; P.t = 0; P.next = true;
      }
    } else if (P.stage === 'result') {
      if (P.t >= A.pick.result) {
        if (state.phase === 2) startPick(evs, P.round + (P.next ? 0 : 1));
        else { state.pick = null; }
      }
    }
  }

  function enterPhase(p, evs) {
    state.phase = p;
    state.mode = 'transition';
    state.cars.length = 0;
    state.pick = null;
    swap = null;
    timer = 1.45;
    afterPhase = p;
    if (p === 3) { state.margotReady = true; state.angry = true; }
    setPose('reveal', 1.1);
    evs.push({ type: 'phase', phase: p });
    evs.push({ type: 'voice', event: 'phase' });
  }

  function damage(dmg, source, evs) {
    if (state.phase === 'ko') return;
    state.hp = Math.max(0, state.hp - dmg);
    evs.push({ type: 'bossHit', dmg, source, hp: state.hp });
    if (state.hp <= 0) {
      state.phase = 'ko'; state.mode = 'ko'; state.pose = 'ko';
      state.cars.length = 0; state.pick = null; state.margotReady = false;
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
      if (timer <= 0) { state.mode = 'wave'; wavesLeft = 2; timer = 0.4; }
      return evs;
    }

    if (state.mode === 'transition') {
      timer -= dt;
      if (timer <= 0) {
        afterPhase = null;
        if (state.phase === 2) startPick(evs);
        else {
          state.mode = 'wave'; wavesLeft = 2; timer = 0.45;
          evs.push({ type: 'margotReady' });
        }
      }
      return evs;
    }

    if (state.mode === 'pick') {
      updatePick(dt, evs);
      if (poseT > 0) state.pose = poseName; else state.pose = 'charge';
      return evs;
    }

    if (state.mode === 'charge') {
      timer -= dt;
      if (timer <= 0) {
        state.mode = 'wave'; wavesLeft = 2; timer = 0.45;
        if (state.phase === 3 && !state.margotReady) { state.margotReady = true; evs.push({ type: 'margotReady' }); }
      }
    } else if (state.mode === 'wave') {
      state.bossX = Math.sin(state.t * 1.2) * 2.2;
      timer -= dt;
      if (wavesLeft <= 0 && state.cars.length === 0 && timer <= 0) {
        state.mode = 'charge'; state.bossX = 0; timer = 3.0;
        setPose('charge', 3.0);
        evs.push({ type: 'charging' });
        evs.push({ type: 'voice', event: 'taunt' });
      } else if (wavesLeft > 0 && timer <= 0 && state.cars.length === 0) {
        spawnFrameWave(state.phase >= 3 ? 2 : 1, evs);
        wavesLeft--;
        timer = wavesLeft <= 0 ? 0.75 : (state.phase === 3 ? 0.8 : 0.9);
      }
    }

    const speed = A.carSpeed * (state.phase === 3 ? 1.18 : 1);
    for (let i = state.cars.length - 1; i >= 0; i--) {
      const c = state.cars[i];
      c.t += dt;
      if (c.stage === 'warn') {
        if (c.t >= A.warnTime) { c.stage = 'drive'; c.t = 0; evs.push({ type: 'carGo', lane: c.lane }); }
      } else {
        c.z += speed * dt;
        if (!c.hit && Math.abs(c.z - hero.z) < 1.15 && Math.abs(c.x - hero.x) < A.laneHalfW) {
          if (hero.dodging) { c.hit = true; evs.push({ type: 'dodge', x: hero.x, z: hero.z }); }
          else if (!hero.inv) {
            c.hit = true;
            evs.push({ type: 'hurt', source: 'frame', penalty: A.points.paintPenalty });
            evs.push({ type: 'voice', event: 'taunt' });
          }
        }
        if (c.z > A.zNear + 3.5) state.cars.splice(i, 1);
      }
    }

    if (poseT > 0) state.pose = poseName;
    else if (state.mode === 'charge') state.pose = 'charge';
    else state.pose = state.angry ? 'throw' : 'reveal';
    return evs;
  }

  function punch(area) {
    const evs = [];
    if (state.phase === 'ko' || state.mode === 'reveal' || state.mode === 'transition') return evs;
    if (area.z > A.meleeZ || hitLock > 0) return evs;

    // Minijuego: pegarle al cuadro verdadero
    if (state.mode === 'pick') {
      const P = state.pick;
      if (!P || P.stage !== 'choose') { evs.push({ type: 'guarded', x: area.x }); return evs; }
      let best = null;
      for (const f of P.frames) if (Math.abs(area.x - f.x) <= A.pickReach && (!best || Math.abs(area.x - f.x) < Math.abs(area.x - best.x))) best = f;
      if (!best) return evs;
      hitLock = 0.35;
      P.stage = 'result'; P.t = 0; P.next = false; P.picked = best.id;
      if (best.real) {
        setPose('hurt', 0.4);
        evs.push({ type: 'pickRight', x: best.x, id: best.id });
        evs.push({ type: 'voice', event: 'hurt' });
        damage(3, 'pick', evs);
      } else {
        evs.push({ type: 'pickWrong', x: best.x, id: best.id });
        evs.push({ type: 'hurt', source: 'paint', penalty: A.points.paintPenalty });
        evs.push({ type: 'voice', event: 'taunt' });
      }
      return evs;
    }

    if (Math.abs(area.x - state.bossX) < A.meleeX) {
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

  // Remate de Margot en la fase 3: su llanto ablanda a Facu y le saca mucho
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
    const inPick = state.mode === 'pick';
    state.cars.length = 0;
    state.pick = null; swap = null;
    state.mode = 'charge';
    timer = 2.0;
    setPose('hurt', 0.5);
    evs.push({ type: 'powerClear' });
    evs.push({ type: 'voice', event: 'hurt' });
    damage(5, 'power', evs);
    // si el poder lo agarra en el minijuego y sigue en la fase 2, vuelve a empezar la ronda
    if (inPick && state.phase === 2) startPick(evs);
    return evs;
  }

  function _setHp(hp) {
    state.hp = Math.max(0, Math.min(A.hpMax, hp));
    state.cars.length = 0; state.pick = null; swap = null;
    state.margotT = 0;
    state.angry = false;
    if (state.hp <= 0) {
      state.phase = 'ko'; state.mode = 'ko'; state.pose = 'ko'; state.margotReady = false;
    } else if (state.hp <= A.p3At) {
      state.phase = 3; state.mode = 'wave'; wavesLeft = 2; timer = 0.5; state.margotReady = true; state.angry = true;
    } else if (state.hp <= A.p2At) {
      state.phase = 2; state.margotReady = false;
      startPick([]);
    } else {
      state.phase = 1; state.mode = 'reveal'; timer = 1.6; state.pose = 'reveal'; state.margotReady = false;
    }
  }

  return { state, update, punch, power, triggerMargot, _setHp };
}
