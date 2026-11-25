// Lógica pura de la Arena Final de Facu «el Galerista» (Acto 5 — Galería HENRIS, Buenos Aires).
// Facu pinta en vivo con paleta y pincel: tiene juego propio (no es el de los autos de Pinky).
//
// Fase 1 (HP 30→21): «Obra en vivo» — apunta (`aim`, se marca el piso donde estás), revolea un pincelazo
//   de pintura (`throw`) que cae en parábola y deja un charco pegajoso que te frena. Después de 3
//   pincelazos se da vuelta a pintar su cuadro (`charge`/pose `paint`): ahí queda abierto para pegarle.
// Fase 2 (HP 20→11): minijuego «¿cuál es el cuadro verdadero?»: se muestra el verdadero, se mezclan
//   los tres y hay que pegarle al verdadero (cada acierto saca 3). El falso mancha de pintura (-1 ♥).
// Fase 3 (HP 10→0): se enoja: pincelazos de a dos + revolea cuadros por los carriles (con gesto previo)
//   y se habilita el remate de Margot: garabatea el cuadro con crayones y Facu se derrite («¡obra maestra!»).

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
  carSpeed: 14.5,      // velocidad de los cuadros revoleados (fase 3)
  frameWindup: 0.55,   // levanta el cuadro antes de revolearlo
  aim: 0.75,           // cuánto marca el piso antes de tirar la pintura
  aimFast: 0.6,
  blobFly: 0.72,       // vuelo de la pintura
  splashR: 1.25,       // radio de la mancha al caer
  puddleR: 1.2,
  puddleLife: 3.4,
  easelStandX: 0.7,   // donde se para a pintar (el atril está a su derecha)
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
    pose: 'reveal',    // reveal | aim | throw | paint | windup | hurt | love | ko
    bossX: 0,
    cars: [],          // cuadros revoleados (fase 3): [{ id, lane, x, z, stage: 'warn'|'drive', t, hit }]
    blobs: [],         // pincelazos: [{ id, x0, z0, tx, tz, stage: 'aim'|'fly', t, dur, color }]
    puddles: [],       // charcos de pintura pegajosa: [{ id, x, z, life, color }]
    pick: null,        // minijuego: { stage: 'show'|'shuffle'|'choose'|'result', t, round, frames: [{ id, x, real }] }
    windup: 0,         // 0..1 anticipación antes de cada tiro (la vista lo usa para el gesto)
    angry: false,
    margotReady: false,
    margotT: 0,
    t: 0
  };

  let nextId = 1;
  let timer = 1.25;
  let wavesLeft = 3;     // pincelazos (o tandas) que faltan en la serie actual
  let poseName = 'reveal', poseT = 0;
  let afterPhase = null;
  let hitLock = 0;
  let swap = null; // { a, b, fromA, fromB, t, left }
  let frameNext = false; // fase 3: alterna pincelazos y cuadros revoleados
  let pendingFrames = null; // { lanes, t } cuadro levantado esperando para salir
  const COLORS = ['#ff4f8b', '#3fa9ff', '#ffd23f', '#48d597', '#a35bff'];

  function setPose(name, dur) { poseName = name; poseT = dur; state.pose = name; }

  function pickLanes(count) {
    const maxCount = Math.min(count, A.lanes.length - 1); // siempre queda un carril libre
    const pool = [0, 1, 2];
    const picked = [];
    for (let i = 0; i < maxCount; i++) picked.push(pool.splice(Math.floor(rand() * pool.length), 1)[0]);
    return picked;
  }

  const clampX = (v) => Math.max(-A.xMax + 0.6, Math.min(A.xMax - 0.6, v));
  const clampZ = (v) => Math.max(A.zFar + 1.0, Math.min(A.zNear - 0.3, v));

  // Pincelazo: primero apunta (marca en el piso donde está el héroe), después vuela en parábola
  function aimBlobs(hero, evs) {
    const n = state.phase >= 3 ? 2 : 1;
    const aimDur = state.phase >= 3 ? A.aimFast : A.aim;
    for (let i = 0; i < n; i++) {
      const off = i === 0 ? 0 : (hero.x > 0 ? -2.4 : 2.4);
      state.blobs.push({
        id: nextId++, x0: state.bossX, z0: A.bossZ + 1.0,
        tx: clampX(hero.x + off), tz: clampZ(hero.z + (i ? 0.8 : 0)),
        stage: 'aim', t: 0, dur: aimDur, color: COLORS[Math.floor(rand() * COLORS.length)]
      });
    }
    setPose('aim', aimDur);
    evs.push({ type: 'aim', count: n });
    if (wavesLeft === 3 || state.phase >= 3) evs.push({ type: 'voice', event: 'attack' });
  }

  // Fase 3: levanta un cuadro (gesto) y recién después lo revolea por los carriles
  function liftFrames(evs) {
    pendingFrames = { lanes: pickLanes(2), t: 0 };
    setPose('windup', A.frameWindup);
    evs.push({ type: 'frameLift' });
  }
  function spawnFrameWave(lanes, evs) {
    for (const lane of lanes) {
      state.cars.push({ id: nextId++, lane, x: A.lanes[lane], z: A.bossZ + 1.5, stage: 'warn', t: 0, hit: false });
    }
    setPose('throw', 0.5);
    evs.push({ type: 'carWarn' });
    evs.push({ type: 'voice', event: 'attack' });
  }

  function startSeries() {
    state.mode = 'wave';
    wavesLeft = 3;
    timer = 0.45;
    frameNext = false;
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
    setPose('reveal', 0.5); // presenta el cuadro verdadero
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
    state.cars.length = 0; state.blobs.length = 0; pendingFrames = null;
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
      state.cars.length = 0; state.blobs.length = 0; state.pick = null; state.margotReady = false; pendingFrames = null;
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
    state.windup = 0;
    if (poseT > 0) poseT = Math.max(0, poseT - dt);
    if (hitLock > 0) hitLock = Math.max(0, hitLock - dt);
    if (state.margotT > 0) state.margotT = Math.max(0, state.margotT - dt);
    // los charcos se secan solos
    for (let i = state.puddles.length - 1; i >= 0; i--) {
      state.puddles[i].life -= dt;
      if (state.puddles[i].life <= 0) state.puddles.splice(i, 1);
    }
    if (state.phase === 'ko') { state.pose = 'ko'; return evs; }

    if (state.mode === 'reveal') {
      state.pose = 'reveal';
      timer -= dt;
      if (timer <= 0) startSeries();
      return evs;
    }

    if (state.mode === 'transition') {
      timer -= dt;
      if (timer <= 0) {
        afterPhase = null;
        if (state.phase === 2) startPick(evs);
        else {
          startSeries();
          evs.push({ type: 'margotReady' });
        }
      }
      return evs;
    }

    if (state.mode === 'pick') {
      updatePick(dt, evs);
      if (poseT > 0) state.pose = poseName; else state.pose = 'paint';
      return evs;
    }

    if (state.mode === 'charge') {
      state.bossX += (A.easelStandX - state.bossX) * Math.min(1, dt * 4); // va hasta su atril
      timer -= dt;
      if (timer <= 0) {
        startSeries();
        if (state.phase === 3 && !state.margotReady) { state.margotReady = true; evs.push({ type: 'margotReady' }); }
      }
    } else if (state.mode === 'wave') {
      const busy = state.blobs.length > 0 || state.cars.length > 0 || pendingFrames;
      // se pasea por la galería, pero se planta para apuntar/levantar el cuadro (el tiro sale de su mano)
      if (!busy) state.bossX += (Math.sin(state.t * 1.2) * 2.2 - state.bossX) * Math.min(1, dt * 3);
      timer -= dt;
      if (wavesLeft <= 0 && !busy && timer <= 0) {
        state.mode = 'charge'; timer = state.phase === 3 ? 2.4 : 3.0;
        setPose('paint', timer);
        evs.push({ type: 'charging' });
        evs.push({ type: 'voice', event: 'taunt' });
      } else if (wavesLeft > 0 && timer <= 0 && !busy) {
        if (state.phase >= 3 && frameNext) liftFrames(evs);
        else aimBlobs(hero, evs);
        frameNext = !frameNext;
        wavesLeft--;
        timer = wavesLeft <= 0 ? 0.6 : (state.phase === 3 ? 0.35 : 0.5);
      }
    }

    // Cuadro levantado: anticipación y después sale volando
    if (pendingFrames) {
      pendingFrames.t += dt;
      state.windup = Math.min(1, pendingFrames.t / A.frameWindup);
      if (pendingFrames.t >= A.frameWindup) { spawnFrameWave(pendingFrames.lanes, evs); pendingFrames = null; }
    }

    // Pincelazos
    for (let i = state.blobs.length - 1; i >= 0; i--) {
      const bl = state.blobs[i];
      bl.t += dt;
      if (bl.stage === 'aim') {
        state.windup = Math.max(state.windup, Math.min(1, bl.t / bl.dur));
        if (bl.t >= bl.dur) {
          bl.stage = 'fly'; bl.t = 0; bl.x0 = state.bossX;
          setPose('throw', 0.45);
          evs.push({ type: 'blobGo', x: bl.x0 });
        }
      } else if (bl.t >= A.blobFly) {
        state.blobs.splice(i, 1);
        state.puddles.push({ id: bl.id, x: bl.tx, z: bl.tz, life: A.puddleLife, color: bl.color });
        evs.push({ type: 'splat', x: bl.tx, z: bl.tz, color: bl.color });
        const hit = Math.hypot(hero.x - bl.tx, hero.z - bl.tz) < A.splashR && (hero.y || 0) < 1.2;
        if (hit) {
          if (hero.dodging) evs.push({ type: 'dodge', x: hero.x, z: hero.z });
          else if (!hero.inv) {
            evs.push({ type: 'hurt', source: 'paint', penalty: A.points.paintPenalty });
            evs.push({ type: 'voice', event: 'taunt' });
          }
        } else if (Math.hypot(hero.x - bl.tx, hero.z - bl.tz) < A.splashR + 1.1) {
          evs.push({ type: 'dodge', x: hero.x, z: hero.z });
        }
      }
    }

    // Cuadros revoleados (fase 3)
    const speed = A.carSpeed;
    for (let i = state.cars.length - 1; i >= 0; i--) {
      const c = state.cars[i];
      c.t += dt;
      if (c.stage === 'warn') {
        if (c.t >= A.warnTime) { c.stage = 'drive'; c.t = 0; evs.push({ type: 'carGo', lane: c.lane }); }
      } else {
        c.z += speed * dt;
        if (!c.hit && Math.abs(c.z - hero.z) < 1.15 && Math.abs(c.x - hero.x) < A.laneHalfW && (hero.y || 0) < 1.0) {
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
    else if (state.mode === 'charge') state.pose = 'paint';
    else state.pose = 'idle';
    return evs;
  }

  // ¿El héroe está pisando pintura? (la vista lo frena)
  function inPaint(x, z) {
    for (const p of state.puddles) if (Math.hypot(x - p.x, z - p.z) < A.puddleR) return true;
    return false;
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

  // Remate de Margot en la fase 3: garabatea el cuadro de Facu con crayones y él se derrite
  function triggerMargot() {
    const evs = [];
    if (!state.margotReady || state.phase === 'ko') return evs;
    state.margotReady = false;
    state.margotT = 2.2;
    state.cars.length = 0; state.blobs.length = 0; pendingFrames = null;
    state.mode = 'charge';
    timer = 2.8;
    setPose('love', 1.6);
    evs.push({ type: 'margotArt' });
    evs.push({ type: 'voice', event: 'margot' });
    damage(6, 'margot', evs);
    return evs;
  }

  function power() {
    const evs = [];
    if (state.phase === 'ko' || state.mode === 'reveal' || state.mode === 'transition') return evs;
    const inPick = state.mode === 'pick';
    state.cars.length = 0; state.blobs.length = 0; pendingFrames = null;
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
    state.cars.length = 0; state.blobs.length = 0; state.puddles.length = 0; state.pick = null; swap = null; pendingFrames = null;
    state.margotT = 0;
    state.angry = false;
    if (state.hp <= 0) {
      state.phase = 'ko'; state.mode = 'ko'; state.pose = 'ko'; state.margotReady = false;
    } else if (state.hp <= A.p3At) {
      state.phase = 3; startSeries(); timer = 0.5; state.margotReady = true; state.angry = true;
    } else if (state.hp <= A.p2At) {
      state.phase = 2; state.margotReady = false;
      startPick([]);
    } else {
      state.phase = 1; state.mode = 'reveal'; timer = 1.6; state.pose = 'reveal'; state.margotReady = false;
    }
  }

  return { state, update, punch, power, triggerMargot, inPaint, _setHp };
}
