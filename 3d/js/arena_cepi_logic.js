// Lógica pura de la Arena de Cepi (Nivel 2 — Cancha de Pádel): 3 fases, sin Three.js ni DOM.
//
// Fase 1 (HP 30→21): Saque y remate — series de 3 pelotazos (normales, por el vidrio y Punto de Oro).
//   Devolver la pelota dorada con piña lo deja aturdido (`stun`); tras cada serie queda cansado (`tired`).
//   Si le pegás de frente cuando está entero, bloquea con la paleta (`block`).
// Fase 2 (HP 20→11): Duelo de la flechita — Cepi se da vuelta (`back`), apunta a un costado (`point`)
//   y tira un misil a esa mitad de la cancha. Hay que esquivar/moverse al lado opuesto para lastimarlo.
// Fase 3 (HP 10→0): Señuelos de cartón — 2 gigantografías (`cardboard`) + 1 Cepi real en 3 carriles.
//   Los de cartón se voltean; devolver la dorada o pegarle al real lo lastima y vuelve a barajar.

export const CEPI_ARENA = {
  hpMax: 30,
  p2At: 20,
  p3At: 10,
  xMax: 4.2,
  zNear: 2.0,
  zFar: -8.0,      // frente a la red (la red está en z = -8.6)
  netZ: -8.6,
  bossZ: -12.6,
  ballSpeed: 10.5, // ~1 s de vuelo: legible y divertido para jugador casual en iPhone
  ballHitR: 0.9,
  returnR: 2.15,
  returnZMin: -2.8,
  returnZMax: 1.8,
  meleeZ: -6.3,    // cerca de la red para pegarle de frente o voltear cartones
  meleeX: 2.2,
  lanes: [-2.65, 0, 2.65],
  windup: 0.42,    // anticipación (paleta arriba) antes de cada saque
  duel: { hide: 1.05, tell: 1.75, tellFast: 1.45, result: 1.05 },
  points: { returned: 300, normalReturn: 120, melee: 180, duel: 250, cardboard: 100, dodge: 100 }
};

export function createCepiArenaLogic({ rand = Math.random } = {}) {
  const A = CEPI_ARENA;
  const state = {
    hp: A.hpMax,
    hpMax: A.hpMax,
    phase: 1,         // 1 | 2 | 3 | 'ko'
    mode: 'attack',   // 'attack' | 'tired' | 'stun' | 'transition' | 'duel' | 'ko'
    pose: 'idle',     // idle | smash | block | tired | stun | back | point | ko
    bossX: 0,
    windup: 0,        // 0..1 anticipación antes del saque (la vista hace el gesto)
    bossLane: 1,      // 0 | 1 | 2 (en fase 3)
    pointDir: 0,      // -1 izquierda | +1 derecha (en fase 2)
    duel: null,       // { stage: 'hide'|'tell'|'result', t, dir, round, won, last }
    decoys: [],       // [{ id, lane, x, alive, tilt }] en fase 3
    shots: [],        // [{ id, x, z, vx, vz, gold, glass, bounced, returning, targetLane }]
    t: 0
  };

  let nextId = 1;
  let timer = 0.85;
  let seriesLeft = 3;
  let poseName = 'idle', poseT = 0;
  let afterPhase = null;
  let hitLock = 0;

  function setPose(name, dur) { poseName = name; poseT = dur; state.pose = name; }

  function spawnDecoys() {
    const realLane = Math.floor(rand() * 3);
    state.bossLane = realLane;
    state.bossX = A.lanes[realLane];
    state.decoys = [];
    for (let l = 0; l < 3; l++) {
      if (l === realLane) continue;
      state.decoys.push({ id: nextId++, lane: l, x: A.lanes[l], alive: true, fallT: 0 });
    }
  }

  function startDuelRound() {
    const dir = rand() < 0.5 ? -1 : 1;
    const prev = state.duel;
    state.duel = {
      stage: 'hide',
      t: 0,
      dir,
      round: prev ? prev.round + 1 : 1,
      won: prev ? prev.won : 0,
      last: null,
      picked: 0
    };
    state.pointDir = 0;
    state.mode = 'duel';
    state.pose = 'back';
    setPose('back', A.duel.hide);
    state.bossX = 0;
    state.shots.length = 0;
  }

  function enterPhase(p, evs) {
    state.phase = p;
    state.mode = 'transition';
    state.shots.length = 0;
    state.duel = null;
    state.decoys = [];
    timer = 1.6;
    afterPhase = p;
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
      state.shots.length = 0;
      state.duel = null;
      state.decoys = [];
      evs.push({ type: 'ko' });
      evs.push({ type: 'voice', event: 'ko' });
      return;
    }
    if (state.phase === 1 && state.hp <= A.p2At) {
      enterPhase(2, evs);
    } else if (state.phase === 2 && state.hp <= A.p3At) {
      enterPhase(3, evs);
    }
  }

  function shootBall(hero, gold, glass, evs) {
    const fromX = state.bossX;
    let vx;
    if (glass) {
      // Rebota en una pared lateral antes de cruzar al héroe
      const wall = fromX >= 0 ? -A.xMax : A.xMax;
      const distZ = Math.max(4, hero.z - A.bossZ);
      const tFlight = distZ / A.ballSpeed;
      vx = ((wall - fromX) + (wall - hero.x)) / tFlight;
    } else {
      const distZ = Math.max(4, hero.z - A.bossZ);
      vx = (hero.x - fromX) / (distZ / A.ballSpeed);
    }
    const maxVx = glass ? 9.5 : 5.5;
    vx = Math.max(-maxVx, Math.min(maxVx, vx));
    state.shots.push({
      id: nextId++,
      x: fromX,
      z: A.bossZ + 1.2,
      vx,
      vz: A.ballSpeed * (gold ? 0.88 : 1.0),
      gold,
      glass,
      bounced: false,
      returning: false
    });
    setPose('smash', 0.45);
    evs.push({ type: 'serve', gold, glass, x: fromX });
    if (gold || glass) evs.push({ type: 'voice', event: 'attack' });
  }

  function updateDuel(dt, hero, evs) {
    const d = state.duel;
    d.t += dt;
    if (d.stage === 'hide') {
      state.pose = 'back';
      if (d.t >= A.duel.hide) {
        d.stage = 'tell';
        d.t = 0;
        state.pointDir = d.dir;
        state.pose = 'point';
        evs.push({ type: 'duelTell', dir: d.dir, round: d.round });
        evs.push({ type: 'voice', event: 'attack' });
      }
    } else if (d.stage === 'tell') {
      state.pose = 'point';
      const tellDur = d.round <= 1 ? A.duel.tell : A.duel.tellFast;
      if (d.t >= tellDur) {
        // Chequea de qué lado quedó el héroe (o si eligió lado con tap/esquive)
        const heroSide = d.picked !== 0 ? d.picked : (hero.x < -0.35 ? -1 : hero.x > 0.35 ? 1 : 0);
        const safe = heroSide === -d.dir; // lado CONTRARIO al que apunta Cepi
        d.stage = 'result';
        d.t = 0;
        d.last = safe ? 'ok' : 'bad';
        if (safe) {
          d.won++;
          state.pose = 'stun';
          evs.push({ type: 'duelResult', ok: true, dir: d.dir, won: d.won });
          evs.push({ type: 'voice', event: 'hurt' });
          damage(4, 'duel', evs);
        } else {
          state.pose = 'smash';
          evs.push({ type: 'duelResult', ok: false, dir: d.dir, won: d.won });
          if (!hero.inv) evs.push({ type: 'hurt', source: 'duel' });
          evs.push({ type: 'voice', event: 'taunt' });
        }
      }
    } else if (d.stage === 'result') {
      state.pose = d.last === 'ok' ? 'stun' : 'idle';
      if (d.t >= A.duel.result && state.phase === 2) {
        startDuelRound();
      }
    }
  }

  function update(dt, hero) {
    const evs = [];
    state.t += dt;
    state.windup = 0;
    if (poseT > 0) poseT = Math.max(0, poseT - dt);
    if (hitLock > 0) hitLock = Math.max(0, hitLock - dt);
    if (state.phase === 'ko') {
      state.pose = 'ko';
      return evs;
    }

    // Animar cartones caídos
    for (const c of state.decoys) {
      if (!c.alive && c.fallT < 1) c.fallT = Math.min(1, c.fallT + dt * 4);
    }

    if (state.mode === 'transition') {
      state.pose = 'idle';
      timer -= dt;
      if (timer <= 0) {
        if (afterPhase === 2) startDuelRound();
        else if (afterPhase === 3) {
          state.mode = 'attack';
          seriesLeft = 3;
          timer = 0.7;
          spawnDecoys();
          evs.push({ type: 'shuffle', lane: state.bossLane });
        }
        afterPhase = null;
      }
      return evs;
    }

    if (state.mode === 'duel') {
      updateDuel(dt, hero, evs);
      return evs;
    }

    if (state.mode === 'stun' || state.mode === 'tired') {
      timer -= dt;
      if (timer <= 0) {
        state.mode = 'attack';
        seriesLeft = 3;
        timer = 0.65;
        if (state.phase === 3) {
          spawnDecoys();
          evs.push({ type: 'shuffle', lane: state.bossLane });
        }
      }
    } else if (state.mode === 'attack') {
      // En fase 1 Cepi se mueve suave de lado a lado; en fase 3 se queda en su carril con los cartones
      if (state.phase === 1 && timer > A.windup) {
        state.bossX = Math.sin(state.t * 1.15) * 2.6;
      }
      timer -= dt;
      state.windup = timer > 0 && timer < A.windup ? 1 - timer / A.windup : 0; // levanta la paleta antes del saque
      if (timer <= 0) {
        const isLast = seriesLeft <= 1;
        const gold = isLast;
        const glass = !gold && state.phase === 1 && seriesLeft === 2;
        shootBall(hero, gold, glass, evs);
        seriesLeft--;
        if (seriesLeft <= 0) {
          state.mode = 'tired';
          timer = state.phase === 3 ? 3.4 : 3.2;
          evs.push({ type: 'tired' });
        } else {
          timer = state.phase === 3 ? 1.0 : 1.15;
        }
      }
    }

    // Mover pelotas
    for (let i = state.shots.length - 1; i >= 0; i--) {
      const s = state.shots[i];
      if (!s) continue; // damage() puede vaciar state.shots (cambio de fase / KO) en medio del bucle
      s.x += s.vx * dt;
      s.z += s.vz * dt;
      // Rebote en las paredes de vidrio
      if (!s.returning && (s.x < -A.xMax || s.x > A.xMax)) {
        s.x = Math.max(-A.xMax, Math.min(A.xMax, s.x));
        s.vx = -s.vx;
        s.bounced = true;
        evs.push({ type: 'glassBounce', x: s.x, z: s.z });
      }
      if (s.returning) {
        // Va derecho al Cepi real: la dorada aturde (4 HP), la normal solo raspa (1 HP) sin aturdir
        if (s.z <= A.bossZ + 1.0) {
          state.shots.splice(i, 1);
          if (s.gold) {
            state.mode = 'stun';
            timer = 2.8;
            setPose('stun', 2.8);
            evs.push({ type: 'voice', event: 'hurt' });
            damage(4, 'returned', evs);
          } else {
            setPose('block', 0.35);
            evs.push({ type: 'voice', event: 'taunt' });
            damage(1, 'returnedNormal', evs);
          }
          continue;
        }
      } else {
        // Impacto contra el héroe
        if (Math.abs(s.z - hero.z) < 0.75 && Math.abs(s.x - hero.x) < A.ballHitR) {
          if (hero.dodging) {
            evs.push({ type: 'dodge', x: hero.x, z: hero.z });
            s.z = hero.z + 1.1; // la deja pasar
          } else if (!hero.inv) {
            state.shots.splice(i, 1);
            evs.push({ type: 'hurt', source: 'ball' });
            evs.push({ type: 'voice', event: 'taunt' });
            continue;
          }
        }
        if (s.z > A.zNear + 3) state.shots.splice(i, 1);
      }
    }

    if (state.phase === 'ko') return evs.filter(e => e.type !== 'hurt');

    // Pose actual
    if (poseT > 0) state.pose = poseName;
    else if (state.mode === 'stun') state.pose = 'stun';
    else if (state.mode === 'tired') state.pose = 'tired';
    else state.pose = 'idle';

    return evs;
  }

  // En fase 2 (Duelo de la flechita), el jugador puede elegir lado directamente con botón o esquive
  function pickSide(side) {
    if (state.mode === 'duel' && state.duel && state.duel.stage === 'tell') {
      state.duel.picked = side < 0 ? -1 : 1;
    }
  }

  function punch(area) {
    const evs = [];
    if (state.phase === 'ko' || state.mode === 'duel' || state.mode === 'transition') return evs;

    // 1. Devolver una pelota en la ventana (la dorada hace 4 HP y aturde; la normal hace 1 HP sin aturdir)
    for (const s of state.shots) {
      if (s.returning) continue;
      const dz = s.z - area.z;
      if (Math.abs(s.x - area.x) < A.returnR && dz >= A.returnZMin && dz <= A.returnZMax) {
        s.returning = true;
        const distZ = Math.max(2, s.z - A.bossZ);
        const speed = 26;
        s.vz = -speed;
        s.vx = (state.bossX - s.x) / (distZ / speed);
        evs.push({ type: 'returned', gold: s.gold, x: s.x, z: s.z });
        return evs;
      }
    }

    // 2. Golpe cerca de la red (fase 3: voltear cartones o pegarle al real; fase 1: pegar si está cansado/aturdido, sino bloquea)
    if (area.z <= A.meleeZ && hitLock <= 0) {
      if (state.phase === 3) {
        // Primero revisar señuelos de cartón cercanos
        for (const c of state.decoys) {
          if (c.alive && Math.abs(area.x - c.x) < A.meleeX) {
            c.alive = false;
            hitLock = 0.25;
            evs.push({ type: 'cardboard', x: c.x, id: c.id });
            // Si volteó los dos cartones, Cepi queda aturdido y expuesto para pegarle directo
            if (state.decoys.every(d => !d.alive) && state.mode !== 'stun') {
              state.mode = 'stun';
              timer = 2.1;
              setPose('stun', 2.1);
              evs.push({ type: 'decoysCleared' });
              evs.push({ type: 'voice', event: 'hurt' });
            }
            return evs;
          }
        }
      }
      if (Math.abs(area.x - state.bossX) < A.meleeX) {
        hitLock = 0.35;
        if (state.mode === 'tired' || state.mode === 'stun') {
          const dmg = state.mode === 'stun' ? 3 : 2;
          evs.push({ type: 'meleeHit', dmg, x: state.bossX });
          evs.push({ type: 'voice', event: 'hurt' });
          damage(dmg, 'melee', evs);
          if (state.phase === 3 && state.hp > 0) {
            state.mode = 'attack';
            seriesLeft = 3;
            timer = 0.8;
            spawnDecoys();
            evs.push({ type: 'shuffle', lane: state.bossLane });
          }
        } else {
          // Bloquea con la paleta si le pegás de frente cuando está entero
          setPose('block', 0.55);
          evs.push({ type: 'block', x: state.bossX });
          evs.push({ type: 'voice', event: 'taunt' });
        }
      }
    }
    return evs;
  }

  function power() {
    const evs = [];
    if (state.phase === 'ko' || state.mode === 'transition') return evs;
    state.shots.length = 0;
    for (const c of state.decoys) c.alive = false;
    state.mode = 'stun';
    timer = 2.0;
    setPose('stun', 2.0);
    evs.push({ type: 'powerClear' });
    evs.push({ type: 'voice', event: 'hurt' });
    damage(5, 'power', evs);
    return evs;
  }

  function _setHp(hp) {
    state.hp = Math.max(0, Math.min(A.hpMax, hp));
    state.shots.length = 0;
    state.decoys = [];
    state.duel = null;
    if (state.hp <= 0) {
      state.phase = 'ko'; state.mode = 'ko'; state.pose = 'ko';
    } else if (state.hp <= A.p3At) {
      state.phase = 3; state.mode = 'attack'; seriesLeft = 3; timer = 0.6;
      spawnDecoys();
    } else if (state.hp <= A.p2At) {
      state.phase = 2;
      startDuelRound();
    } else {
      state.phase = 1; state.mode = 'attack'; seriesLeft = 3; timer = 0.7;
    }
  }

  return { state, update, punch, power, pickSide, _setHp };
}
