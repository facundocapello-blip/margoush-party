// «La arena de BIG CHAKY»: lógica pura de la pelea (sin Three.js ni DOM, se prueba con node --test).
// El héroe vive entre zNear y zFar; BIG CHAKY está al fondo (bossZ) sobre la tarima.
//
// TRES FASES (la del medio es el minijuego, como en todos los jefes):
//  1. BARRILES — tira series de 3 con trayectorias que se leen por la pose: rodante (recto: se devuelve),
//     en curva (sale por otro carril y se mete en el tuyo: correrse) y saltarín (pica: saltarlo).
//     El último de cada serie es dorado. Después de la serie descansa (recuperación): la ventana para devolver.
//  2. «CLASE DE BAILE» — estilo Pump It Up: flechas que suben por 5 carriles al compás; Chaky hace cada paso y
//     hay que tocar el carril cuando la flecha llega arriba. Ronda ganada (75 %) lo lastima; 4 ganadas curan, 2 perdidas sacan un corazón.
//  3. ENOJADO — ráfagas, cajones, el manotazo (la mano cae donde estabas, se traba: ventana) y el barril
//     gigante, que no se devuelve: hay que esquivarlo de costado.
//
// Estados del jefe (state.mode): attack, recover, transition, dice, vulnerable, ko. La presentación es de arena.js.
// Eventos: throw, hurt, dodge, returned, bossHit, handHit, slam, phase, rage, ko, voice, danceBeat,
// danceStep, diceResult, heal. `voice` lleva el evento de voz (voice.js elige la frase).
// PUNTAJE: solo `handHit`, `returned` y `diceResult` (ok) puntúan; `bossHit` es solo barra y feedback.
// Coordenadas: x a lo ancho (±xMax), z hacia el fondo negativo.

export const ARENA = {
  hp: 30,
  diceAt: 21,          // con esta vida empieza la clase de baile
  rageAt: 12,          // fase 3 (si un golpe lo baja de una hasta acá, se saltea el minijuego)
  xMax: 4.2, zNear: 0, zFar: -7, bossZ: -16, bossSway: 3,
  returnWindow: 0.6,   // s antes de que el barril llegue al héroe en los que el golpe lo devuelve
  returnR: 1.2,        // tolerancia de costado para devolver
  returnDmg: 5,        // dorado devuelto
  returnDmgWhite: 2,   // común devuelto
  handDmg: 2,
  powerDmg: 4,
  hitR: 1.05,
  phase1: {
    barrelSpeed: 7, gap: 0.95, rest: [1.7, 2.1], firstDelay: 1.0,
    // Series de 3: siempre termina en dorado (rodante). Se repiten en orden.
    patterns: [['roll', 'curve', 'gold'], ['bounce', 'roll', 'gold'], ['curve', 'bounce', 'gold']],
    curveShift: 2.6, bounceH: 1.8, bounceHops: 4
  },
  // Clase de baile (Pump It Up): flechas por ronda, compás, cuánto tarda en subir una flecha, ventanas de acierto
  dice: { rounds: [4, 6, 6, 8], beat: 0.6, travel: 1.8, perfect: 0.1, good: 0.24, pass: 0.75, result: 1.0, dmg: 2.25, healAt: 4, hurtAt: 2, start: 3.0 },
  phase3: { throwEvery: [0.9, 1.4], goldEvery: 3, slamEvery: 1, slamWarn: 0.8, stuck: 1.8, salvo: 0.4, salvoGap: 0.45, crateEvery: 3, crateTime: 0.8, giantEvery: 5, giantSpeed: 4.4, giantR: 1.9 },
  transition: 1.6,
  points: { returned: 300, returnedWhite: 120, hand: 50, dodge: 100, dice: 150 }
};

export const DANCE_LANES = 5; // ↙ ↖ ● ↗ ↘ (como Pump It Up)
export const DANCE_MOVES = ['jump', 'attack', 'dodge']; // (compatibilidad)

// Tiempos internos (s)
const WINDUP = 0.6;        // pose de tirar antes de soltar
const HAND_DOWN = 0.15;
const HAND_UP = 0.4;
const CRATE_H = 8;
const BARREL_Y = 1.1;      // el héroe en el aire (y >= esto) pasa por encima del barril
const BOUNCE_LOW = 0.9;    // el saltarín solo pega cuando está abajo
const HAND_LOCK = 0.2;
const REMOVE_Z = 4;
const smooth = (k) => { k = Math.max(0, Math.min(1, k)); return k * k * (3 - 2 * k); };

export function createArenaLogic({ rand = Math.random } = {}) {
  const A = ARENA, P1 = A.phase1, P3 = A.phase3, D = A.dice;
  const state = {
    phase: 1, mode: 'attack', hp: A.hp, hpMax: A.hp, bossX: 0, pose: 'idle',
    shots: [], hand: { state: 'none', x: 0, z: 0, t: 0 }, dice: null
  };
  let t = 0, nextId = 1;
  let timer = P1.firstDelay;   // s hasta la próxima acción
  let pat = 0, inSeries = 0;   // fase 1: patrón y posición en la serie
  let throws = 0, barrels = 0, sinceSlam = 0, salvoed = false;
  let handLock = 0, firstAttack = false;
  let poseName = null, poseT = 0;
  let after = null;            // fase a la que lleva la transición
  const crateT = new Map();

  const interval = () => { const [a, b] = P3.throwEvery; return a + rand() * (b - a); };
  const wantsSlam = () => state.phase === 3 && sinceSlam >= P3.slamEvery && state.hand.state === 'none';
  const clampX = (x) => Math.max(-A.xMax, Math.min(A.xMax, x));

  function clearAll() {
    state.shots = [];
    crateT.clear();
    Object.assign(state.hand, { state: 'none', t: 0 });
  }

  function toTransition(next, evs) {
    state.phase = next === 3 ? 3 : 2;
    state.mode = 'transition';
    after = next;
    timer = next === 2 ? D.start : A.transition;
    clearAll();
    if (next === 3) {
      state.pose = poseName = 'rage'; poseT = A.transition; // furioso toda la transición
      throws = 0; barrels = 0; sinceSlam = 0;
      evs.push({ type: 'phase', to: 3 }, { type: 'rage' }, { type: 'voice', event: 'phase' });
    } else {
      evs.push({ type: 'phase', to: 2 }, { type: 'voice', event: 'dice' });
    }
  }

  // Después de cambiar la vida: ko (una sola vez) o cambio de fase
  function checkLife(evs) {
    if (state.phase === 'ko') return;
    if (state.hp <= 0) {
      state.hp = 0;
      state.phase = 'ko'; state.mode = 'ko'; state.pose = 'ko'; state.dice = null;
      poseName = null; poseT = 0;
      clearAll();
      evs.push({ type: 'ko' }, { type: 'voice', event: 'ko' });
    } else if (state.phase === 1 && state.hp <= A.rageAt) toTransition(3, evs);
    else if (state.phase === 1 && state.hp <= A.diceAt) toTransition(2, evs);
  }

  function damage(dmg, by, evs) {
    if (state.phase === 'ko') return;
    state.hp = Math.max(state.phase === 2 ? A.rageAt : 0, state.hp - dmg); // el minijuego no lo noquea
    evs.push({ type: 'bossHit', dmg, by });
    const was = state.phase;
    checkLife(evs);
    if (state.phase === was && state.phase !== 'ko') { poseName = 'hurt'; poseT = 0.35; }
  }

  function touch(hero, by, evs) {
    if (hero.dodging) evs.push({ type: 'dodge' });
    else if (!hero.inv) evs.push({ type: 'hurt', by });
    return !!(hero.dodging || !hero.inv);
  }

  function barrel(type, hero) {
    const s = { id: nextId++, kind: 'barrel', type, gold: type === 'gold', x: state.bossX, z: A.bossZ, y: 0, returning: false };
    s.z0 = s.z;
    if (type === 'curve') {
      // sale por otro carril y se mete en el del héroe
      s.x1 = clampX(hero.x);
      s.x0 = clampX(s.x1 + (s.x1 > 0 ? -1 : 1) * P1.curveShift);
      s.x = s.x0;
    } else if (type === 'bounce' || type === 'giant') s.x = clampX(hero.x);
    return s;
  }

  // Fase 1: la serie de 3
  function releaseSeries(hero, evs) {
    const type = P1.patterns[pat % P1.patterns.length][inSeries];
    const s = barrel(type, hero);
    state.shots.push(s);
    evs.push({ type: 'throw', kind: 'barrel', shot: type });
    if (!firstAttack) { firstAttack = true; evs.push({ type: 'voice', event: 'attack' }); }
    inSeries++;
    if (inSeries >= 3) {
      inSeries = 0; pat++;
      state.mode = 'recover';
      const [a, b] = P1.rest; timer = a + rand() * (b - a);
    } else timer = P1.gap;
  }

  // Fase 3: ráfagas, cajones, gigante y manotazo
  function releaseRage(hero, evs) {
    if (wantsSlam()) {
      sinceSlam = 0;
      Object.assign(state.hand, { state: 'warn', x: hero.x, z: hero.z, t: 0 });
      return false;
    }
    throws++; sinceSlam++;
    let s;
    if (throws % P3.giantEvery === 0) {
      s = barrel('giant', hero);
      evs.push({ type: 'voice', event: 'special' });
    } else if (throws % P3.crateEvery === 2) {
      s = { id: nextId++, kind: 'crate', x: hero.x, z: hero.z, y: CRATE_H, returning: false };
      crateT.set(s.id, 0);
    } else {
      barrels++;
      s = barrel((barrels % P3.goldEvery === 0) ? 'gold' : 'roll', hero);
    }
    state.shots.push(s);
    evs.push({ type: 'throw', kind: s.kind, shot: s.type || 'crate' });
    return s.kind === 'barrel' && s.type !== 'giant';
  }

  function moveShots(dt, hero, evs) {
    const keep = [];
    for (const s of state.shots) {
      if (state.phase === 'ko') break;
      if (s.kind === 'crate') {
        const age = (crateT.get(s.id) || 0) + dt;
        crateT.set(s.id, age);
        s.y = Math.max(0, CRATE_H * (1 - age / P3.crateTime));
        if (age < P3.crateTime) { keep.push(s); continue; }
        crateT.delete(s.id);
        if (Math.hypot(hero.x - s.x, hero.z - s.z) < A.hitR) touch(hero, 'crate', evs);
        continue;
      }
      if (s.returning) {
        s.z -= P1.barrelSpeed * 2 * dt;
        if (s.z > A.bossZ) { keep.push(s); continue; }
        evs.push({ type: 'voice', event: 'returned' });
        damage(s.gold ? A.returnDmg : A.returnDmgWhite, 'barrel', evs);
        continue;
      }
      const speed = s.type === 'giant' ? P3.giantSpeed : P1.barrelSpeed;
      s.z += speed * dt;
      const p = (s.z - s.z0) / (A.zNear - s.z0); // 0 al salir, 1 en la línea del héroe
      if (s.type === 'curve') s.x = s.x0 + (s.x1 - s.x0) * smooth((p - 0.3) / 0.45);
      if (s.type === 'bounce') s.y = P1.bounceH * Math.abs(Math.sin(Math.PI * P1.bounceHops * Math.min(1.2, p)));
      const r = s.type === 'giant' ? P3.giantR : A.hitR;
      const close = Math.hypot(hero.x - s.x, hero.z - s.z) < r;
      const overIt = s.type === 'giant' ? false : hero.y >= BARREL_Y;
      const low = s.type !== 'bounce' || s.y < BOUNCE_LOW;
      if (close && low && !overIt) { if (touch(hero, 'barrel', evs)) continue; }
      if (s.z < REMOVE_Z) keep.push(s);
    }
    state.shots = state.phase === 'ko' ? [] : keep;
  }

  function moveHand(dt, hero, evs) {
    const h = state.hand;
    if (h.state === 'none') return;
    h.t += dt;
    if (h.state === 'warn' && h.t >= P3.slamWarn) {
      Object.assign(h, { state: 'down', t: 0 });
      evs.push({ type: 'slam', x: h.x, z: h.z });
      if (Math.hypot(hero.x - h.x, hero.z - h.z) < A.hitR) touch(hero, 'hand', evs);
    } else if (h.state === 'down' && h.t >= HAND_DOWN) {
      Object.assign(h, { state: 'stuck', t: 0 });
      evs.push({ type: 'voice', event: 'stuck' });
    } else if (h.state === 'stuck' && h.t >= P3.stuck) {
      Object.assign(h, { state: 'up', t: 0 });
    } else if (h.state === 'up' && h.t >= HAND_UP) {
      Object.assign(h, { state: 'none', t: 0 });
    }
  }

  // ---------- «Clase de baile» estilo Pump It Up (fase 2; internamente sigue llamándose `dice`) ----------
  // 5 carriles (↙ ↖ ● ↗ ↘). Las flechas suben al compás y hay que tocar su carril cuando llegan a la línea
  // de arriba; Chaky hace el mismo paso en ese momento. Cada ronda (4, 6, 6 y 8 flechas) se gana con el 75 %.
  function makeNotes(n) {
    const notes = []; let prev = -1;
    for (let i = 0; i < n; i++) {
      let lane = Math.floor(rand() * DANCE_LANES) % DANCE_LANES;
      if (lane === prev) lane = (lane + 1 + i) % DANCE_LANES;
      notes.push({ lane, time: D.travel + i * D.beat, judged: null });
      prev = lane;
    }
    return notes;
  }
  function startDice() {
    state.dice = { round: 0, total: D.rounds.length, notes: makeNotes(D.rounds[0]), stage: 'play', t: 0, hits: 0, combo: 0, beat: -1, ok: 0, bad: 0, last: null, res: [], step: null };
    state.mode = 'dice';
  }
  function endRound(evs) {
    const d = state.dice, ok = d.hits >= Math.ceil(d.notes.length * D.pass);
    d.stage = 'result'; d.t = 0; d.last = ok ? 'ok' : 'bad'; d.res[d.round] = d.last;
    if (ok) d.ok++; else d.bad++;
    evs.push({ type: 'diceResult', ok, round: d.round, hits: d.hits, of: d.notes.length }, { type: 'voice', event: ok ? 'good' : 'bad' });
    if (ok) damage(D.dmg, 'dice', evs);
  }
  function judge(d, note, grade, evs) {
    note.judged = grade;
    if (grade === 'miss') d.combo = 0; else { d.hits++; d.combo++; }
    evs.push({ type: 'danceStep', ok: grade !== 'miss', grade, lane: note.lane, combo: d.combo });
  }
  function updateDice(dt, hero, evs) {
    const d = state.dice;
    d.t += dt;
    if (d.stage === 'play') {
      if (d.beat < 0 && d.t > 0.05) { d.beat = 0; evs.push({ type: 'voice', event: 'count' }); }
      for (const n of d.notes) {
        if (!n.beatDone && d.t >= n.time) { n.beatDone = true; d.step = n.lane; d.stepT = d.t; evs.push({ type: 'danceBeat', lane: n.lane }); }
        if (!n.judged && d.t > n.time + D.good) judge(d, n, 'miss', evs);
      }
      if (d.notes.every(n => n.judged && n.beatDone)) endRound(evs);
    } else if (d.stage === 'result' && d.t >= D.result) {
      d.round++;
      if (d.round < d.total) { Object.assign(d, { notes: makeNotes(D.rounds[d.round]), stage: 'play', t: 0, hits: 0, combo: 0, beat: -1, step: null }); return; }
      if (d.ok >= D.healAt) evs.push({ type: 'heal' });
      if (d.bad >= D.hurtAt) evs.push({ type: 'hurt', by: 'dice' });
      state.dice = null;
      toTransition(3, evs);
    }
  }
  // El jugador tocó un carril
  function tap(lane) {
    const evs = [];
    const d = state.dice;
    if (!d || state.phase !== 2 || d.stage !== 'play') return evs;
    let best = null;
    for (const n of d.notes) if (!n.judged && n.lane === lane && Math.abs(n.time - d.t) <= D.good && (!best || Math.abs(n.time - d.t) < Math.abs(best.time - d.t))) best = n;
    if (!best) { evs.push({ type: 'danceStep', ok: false, grade: 'empty', lane, combo: d.combo }); return evs; }
    judge(d, best, Math.abs(best.time - d.t) <= D.perfect ? 'perfect' : 'good', evs);
    return evs; // el cierre de la ronda lo hace update (así Chaky marca también el último paso)
  }
  function act() { return []; } // los botones de pelea no cuentan en el baile

  function update(dt, hero) {
    const evs = [];
    if (state.phase === 'ko') return evs;
    t += dt;
    state.bossX = state.phase === 2 ? state.bossX * Math.max(0, 1 - dt * 3) : Math.sin(t * 0.6) * A.bossSway;
    if (poseT > 0) poseT -= dt;
    if (handLock > 0) handLock -= dt;

    if (state.mode === 'transition') {
      timer -= dt;
      if (timer <= 0) {
        if (after === 2) startDice();
        else { state.mode = 'attack'; timer = interval(); }
        after = null;
      }
    } else if (state.phase === 2) {
      if (state.dice) updateDice(dt, hero, evs);
    } else if (state.phase === 1) {
      timer -= dt;
      if (timer <= 0) { state.mode = 'attack'; releaseSeries(hero, evs); }
    } else {
      timer -= dt;
      if (timer <= 0) {
        const threw = releaseRage(hero, evs);
        if (threw && !salvoed && P3.salvo && rand() < P3.salvo) { timer = P3.salvoGap; salvoed = true; }
        else { timer = interval(); salvoed = false; }
      }
    }
    moveShots(dt, hero, evs);
    if (state.phase === 3) moveHand(dt, hero, evs);
    if (state.phase === 'ko') return evs.filter(e => e.type !== 'hurt');
    if (state.phase === 3 && state.mode !== 'transition') state.mode = state.hand.state === 'stuck' ? 'vulnerable' : 'attack';
    // pose
    if (state.phase === 2 && state.mode === 'dice') {
      // Chaky hace el paso de la flecha que llega: abajo = giro, arriba = piña, centro = salto
      const d = state.dice, inStep = d.stage === 'play' && d.step !== null && d.t - d.stepT < A.dice.beat * 0.75;
      const STEP = ['dance_dodge', 'dance_attack', 'dance_jump', 'dance_attack', 'dance_dodge'];
      state.pose = inStep ? STEP[d.step] : d.stage === 'result' && d.last === 'bad' ? 'dance_laugh' : 'dance_idle';
    }
    else if (poseT > 0) state.pose = poseName;
    else if (state.hand.state === 'warn' || state.hand.state === 'down') state.pose = 'slam';
    else if (state.mode === 'transition' || state.mode === 'recover') state.pose = 'idle';
    else if (timer <= WINDUP) state.pose = wantsSlam() ? 'slam' : 'throw';
    else state.pose = 'idle';
    return evs;
  }

  function punch(area) {
    const evs = [];
    if (state.phase === 'ko' || state.phase === 2) return evs;
    const maxD = A.returnWindow * P1.barrelSpeed;
    for (const s of state.shots) {
      if (s.kind !== 'barrel' || s.returning || s.type === 'bounce' || s.type === 'giant') continue;
      const d = area.z - s.z;
      if (Math.abs(s.x - area.x) < A.returnR && d > -0.3 && d <= maxD) {
        s.returning = true;
        evs.push({ type: 'returned', gold: s.gold });
      }
    }
    const h = state.hand;
    if (h.state === 'stuck' && handLock <= 0 && Math.hypot(area.x - h.x, area.z - h.z) < area.reach) {
      const dmg = A.handDmg * area.dmg;
      handLock = HAND_LOCK;
      evs.push({ type: 'handHit', dmg });
      damage(dmg, 'hand', evs);
    }
    return evs;
  }

  function power() {
    const evs = [];
    if (state.phase === 'ko' || state.phase === 2 || state.mode === 'transition') return evs;
    state.shots = [];
    crateT.clear();
    damage(A.powerDmg, 'power', evs);
    if (state.phase !== 'ko') evs.push({ type: 'voice', event: 'hurt' });
    return evs;
  }

  // Gancho de pruebas (e2e): fija la vida y aplica las mismas reglas que un daño
  function _setHp(hp) {
    const evs = [];
    if (state.phase === 'ko') return evs;
    state.hp = Math.max(0, Math.min(state.hpMax, hp));
    if (state.phase === 2 && state.hp > 0) { state.dice = null; toTransition(3, evs); }
    checkLife(evs);
    return evs;
  }

  return { get state() { return state; }, update, punch, power, act, tap, _setHp };
}
