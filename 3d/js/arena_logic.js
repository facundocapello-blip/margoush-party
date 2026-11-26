// «El escenario de BIG CHAKY»: duelo de baile directo en 3 rondas rápidas (sin barriles ni manotazo).
// Nuestro héroe (a la izquierda) y BIG CHAKY (a la derecha) están los dos DE FRENTE mirando a cámara
// sobre un escenario disco iluminado. Las flechas bajan por 5 carriles (↙ ↖ ● ↗ ↘) hacia los 5 botones
// inferiores. Cada paso acertado lastima a Chaky; si perdés tus corazones, gastás 1 de las 3 vidas extra
// (⭐⭐⭐) y seguís bailando desde esa misma ronda sin volver a empezar.

export const ARENA = {
  hp: 30,
  diceAt: 21,          // umbral de vida para Ronda 2 (compatibilidad con ?probar=chaky-cartel)
  rageAt: 11,          // umbral de vida para Ronda 3 (compatibilidad con ?probar=chaky-enojado)
  lives: 3,            // 3 vidas extra (⭐⭐⭐) para continuar en la misma ronda si perdés los corazones
  xMax: 4.2, zNear: 0, zFar: -7, bossZ: -12.8, bossSway: 0.22,
  stageX: 3.0,         // separación: héroe en -stageX y BIG CHAKY en +stageX (centro libre para Margot)
  stepDmg: 1.15,       // cada flecha acertada le baja vida a Chaky en tiempo real
  powerDmg: 4,
  hitR: 1.05,
  // Duelo de baile: 3 rondas ágiles (6, 8 y 10 pasos = 24 notas, ~32 s en total)
  dice: {
    rounds: [6, 8, 10],
    beats: [0.58, 0.52, 0.46],
    travels: [1.45, 1.32, 1.2],
    beat: 0.54,
    travel: 1.35,
    perfect: 0.11,
    good: 0.25,
    pass: 0.7,
    result: 0.9,
    dmg: 2.0,
    healAt: 2,
    hurtAt: 1,
    start: 1.15,
    feverAt: 4,
    feverMult: 1.35,
    emptyWindow: 1.0,
    emptyLimit: 3
  },
  transition: 0.9,
  points: { stepPerfect: 120, stepGood: 70, dice: 250, returned: 300, returnedWhite: 120, hand: 50, dodge: 100 }
};

export const DANCE_LANES = 5; // ↙ ↖ ● ↗ ↘
export const DANCE_MOVES = ['jump', 'attack', 'dodge'];

const STEP_POSE = ['dance_dodge', 'dance_attack', 'dance_jump', 'dance_attack', 'dance_dodge'];

export function createArenaLogic({ rand = Math.random } = {}) {
  const A = ARENA, D = A.dice;
  const state = {
    phase: 1,
    mode: 'dice',
    hp: A.hp,
    hpMax: A.hp,
    lives: A.lives,
    livesMax: A.lives,
    bossX: 3.0,
    heroX: -3.0,
    pose: 'dance_idle',
    heroPose: 'dance_idle',
    shots: [],
    hand: { state: 'none', x: 0, z: 0, t: 0 },
    dice: null
  };
  let t = 0, poseName = null, poseT = 0;

  function roundBeat(r) { return D.beats?.[r] ?? D.beat; }
  function roundTravel(r) { return D.travels?.[r] ?? D.travel; }

  function makeNotes(n, r = 0, lead = 0.25) {
    const notes = [];
    const beat = roundBeat(r), travel = roundTravel(r);
    let prev = -1, stairLeft = 0, stairDir = 1;
    for (let i = 0; i < n; i++) {
      let lane;
      if (r >= 1 && stairLeft > 0) {
        lane = prev + stairDir;
        if (lane < 0 || lane >= DANCE_LANES) {
          stairDir = -stairDir;
          lane = prev + stairDir;
        }
        stairLeft--;
      } else {
        lane = Math.floor(rand() * DANCE_LANES) % DANCE_LANES;
        if (lane === prev) lane = (lane + 1 + i) % DANCE_LANES;
        // En rondas 2 y 3, genera escaleras rítmicas de 2-3 carriles vecinos
        if (r >= 1 && (i === 2 || (r === 2 && i === 6))) {
          stairDir = lane <= 2 ? 1 : -1;
          stairLeft = r === 2 ? 2 : 1;
        }
      }
      notes.push({ lane, time: lead + travel + i * beat, judged: null, beatDone: false });
      prev = lane;
    }
    return notes;
  }

  function startRound(r, lead = 0.25) {
    const idx = Math.max(0, Math.min(D.rounds.length - 1, r));
    const prev = state.dice;
    state.phase = idx + 1;
    state.mode = 'dice';
    const combo = prev ? prev.combo : 0;
    state.dice = {
      round: idx,
      total: D.rounds.length,
      beatDur: roundBeat(idx),
      travel: roundTravel(idx),
      lead,
      notes: makeNotes(D.rounds[idx], idx, lead),
      stage: 'play',
      t: 0,
      hits: 0,
      combo,
      fever: combo >= D.feverAt,
      beat: -1,
      ok: prev ? prev.ok : 0,
      bad: prev ? prev.bad : 0,
      last: prev ? prev.last : null,
      res: prev ? [...prev.res] : [],
      step: null,
      stepT: 0,
      heroStep: null,
      heroStepT: 0,
      emptyTaps: []
    };
  }

  startRound(0, D.start);

  function triggerKo(evs) {
    if (state.phase === 'ko') return;
    state.hp = 0;
    state.phase = 'ko';
    state.mode = 'ko';
    state.pose = 'ko';
    poseName = null;
    poseT = 0;
    evs.push({ type: 'ko' }, { type: 'voice', event: 'ko' });
  }

  function damage(dmg, by, evs, allowKo = true) {
    if (state.phase === 'ko') return;
    const minHp = allowKo ? 0 : 0.5;
    state.hp = Math.max(minHp, Number((state.hp - dmg).toFixed(2)));
    evs.push({ type: 'bossHit', dmg, by });
    if (state.hp <= 0 && allowKo) {
      triggerKo(evs);
    } else if (by !== 'dice') {
      // Sacudón con una pose de baile (traje violeta): nunca vuelve a los sprites naranjas viejos
      poseName = 'dance_dodge';
      poseT = 0.24;
    }
  }

  function judge(d, note, grade, evs) {
    note.judged = grade;
    if (grade === 'miss') {
      d.combo = 0;
      d.fever = false;
      evs.push({ type: 'danceStep', ok: false, grade: 'miss', lane: note.lane, combo: 0, fever: false });
      evs.push({ type: 'hurt', by: 'dice' });
    } else {
      d.hits++;
      d.combo++;
      d.fever = d.combo >= D.feverAt;
      d.heroStep = note.lane;
      d.heroStepT = d.t;
      evs.push({ type: 'danceStep', ok: true, grade, lane: note.lane, combo: d.combo, fever: d.fever });
      // El daño por paso baja la barra en tiempo real (bonus en Modo Disco) y deja el KO para la 3.ª ronda
      damage(A.stepDmg * (d.fever ? D.feverMult : 1), 'dice', evs, false);
    }
  }

  function endRound(evs) {
    const d = state.dice;
    if (!d || d.stage === 'result') return;
    const ok = d.hits >= Math.ceil(d.notes.length * D.pass);
    d.stage = 'result';
    d.t = 0;
    d.last = ok ? 'ok' : 'bad';
    d.res[d.round] = d.last;
    if (ok) d.ok++; else d.bad++;
    evs.push({ type: 'diceResult', ok, round: d.round, hits: d.hits, of: d.notes.length });
    evs.push({ type: 'voice', event: ok ? 'good' : 'bad' });
    if (ok) {
      const isLastRound = d.round >= d.total - 1;
      damage(isLastRound ? Math.max(D.dmg, state.hp) : D.dmg, 'dice', evs, isLastRound);
      if (d.ok === D.healAt && state.phase !== 'ko') evs.push({ type: 'heal' });
    }
  }

  function update(dt) {
    const evs = [];
    if (state.phase === 'ko') return evs;
    t += dt;
    if (poseT > 0) poseT -= dt;
    state.bossX = A.stageX + Math.sin(t * 2.2) * A.bossSway;
    state.heroX = -A.stageX - Math.sin(t * 2.2) * (A.bossSway * 0.5);

    const d = state.dice;
    if (d) {
      d.t += dt;
      if (d.stage === 'play') {
        if (d.beat < 0 && d.t > 0.05) {
          d.beat = 0;
          evs.push({ type: 'voice', event: 'count' });
        }
        for (const n of d.notes) {
          if (!n.beatDone && d.t >= n.time) {
            n.beatDone = true;
            d.step = n.lane;
            d.stepT = d.t;
            evs.push({ type: 'danceBeat', lane: n.lane });
          }
          if (!n.judged && d.t > n.time + D.good) {
            judge(d, n, 'miss', evs);
          }
        }
        if (state.phase !== 'ko' && d.notes.every(n => n.judged && n.beatDone)) {
          endRound(evs);
        }
      } else if (d.stage === 'result' && d.t >= D.result) {
        if (state.hp <= 0) {
          triggerKo(evs);
        } else {
          const nextRound = d.round < d.total - 1 ? d.round + 1 : d.round;
          startRound(nextRound, 0.9);
          evs.push({ type: 'phase', to: state.phase });
        }
      }
    }

    if (state.phase === 'ko') return evs.filter(e => e.type !== 'hurt');

    // Pose de BIG CHAKY y del héroe (ambos de frente en el escenario)
    if (d) {
      const inStep = d.stage === 'play' && d.step !== null && (d.t - d.stepT) < d.beatDur * 0.8;
      const inHeroStep = d.stage === 'play' && d.heroStep !== null && (d.t - d.heroStepT) < d.beatDur * 0.85;
      state.pose = poseT > 0 && poseName
        ? poseName
        : inStep
          ? STEP_POSE[d.step]
          : (d.stage === 'result' && d.last === 'bad' ? 'dance_laugh' : 'dance_idle');
      state.heroPose = inHeroStep ? STEP_POSE[d.heroStep] : 'dance_idle';
    } else {
      state.pose = 'dance_idle';
      state.heroPose = 'dance_idle';
    }
    return evs;
  }

  function tap(lane) {
    const evs = [];
    const d = state.dice;
    if (!d || state.phase === 'ko' || d.stage !== 'play') return evs;
    let best = null;
    for (const n of d.notes) {
      if (!n.judged && n.lane === lane && Math.abs(n.time - d.t) <= D.good) {
        if (!best || Math.abs(n.time - d.t) < Math.abs(best.time - d.t)) best = n;
      }
    }
    if (!best) {
      d.heroStep = lane;
      d.heroStepT = d.t;
      d.combo = 0;
      d.fever = false;
      const win = D.emptyWindow ?? 1.0;
      const lim = D.emptyLimit ?? 3;
      d.emptyTaps = d.emptyTaps.filter(ts => d.t - ts <= win);
      d.emptyTaps.push(d.t);
      if (d.emptyTaps.length >= lim) {
        d.emptyTaps.length = 0;
        evs.push({ type: 'danceStep', ok: false, grade: 'miss', lane, combo: 0, fever: false });
        evs.push({ type: 'hurt', by: 'dice' });
      } else {
        evs.push({ type: 'danceStep', ok: false, grade: 'empty', lane, combo: 0, fever: false });
      }
      return evs;
    }
    const grade = Math.abs(best.time - d.t) <= D.perfect ? 'perfect' : 'good';
    judge(d, best, grade, evs);
    return evs;
  }

  // Gastar 1 de las 3 vidas extra (⭐⭐⭐) al quedarse sin corazones: sigue desde la misma ronda
  function useLife() {
    if (state.lives <= 0 || state.phase === 'ko') return false;
    state.lives--;
    const r = state.dice ? state.dice.round : Math.max(0, (Number(state.phase) || 1) - 1);
    startRound(r, 1.05);
    return true;
  }

  function punch() { return []; }
  function act() { return []; }

  function power() {
    const evs = [];
    if (state.phase === 'ko') return evs;
    damage(A.powerDmg, 'power', evs, true);
    if (state.phase !== 'ko') evs.push({ type: 'voice', event: 'hurt' });
    return evs;
  }

  // Gancho de pruebas (e2e y ?probar=chaky-cartel / ?probar=chaky-enojado)
  function _setHp(hp) {
    const evs = [];
    if (state.phase === 'ko') return evs;
    state.hp = Math.max(0, Math.min(state.hpMax, hp));
    if (state.hp <= 0) {
      triggerKo(evs);
      return evs;
    }
    const targetRound = state.hp <= A.rageAt ? 2 : state.hp <= A.diceAt ? 1 : 0;
    if ((state.dice?.round ?? 0) !== targetRound) {
      startRound(targetRound, 0.35);
      evs.push({ type: 'phase', to: state.phase });
    }
    return evs;
  }

  return { get state() { return state; }, update, punch, power, act, tap, useLife, _setHp };
}
