// Lógica pura de la Arena de Lale «Mantecoso» (Acto 3 — Obrador de Le Blé): 3 fases.
//
// Fase 1 (HP 30→21): Tira barras de manteca que dejan charcos resbalosos; golpear una bolsa de harina
//   lo enharina (`floured`) y lo vuelve vulnerable a golpes directos (`hurt`).
// Fase 2 (HP 20→11): Patina cruzando la pista (`skate`) dejando manteca; si le tirás harina o choca
//   con una bolsa explotada se frena enharinado (`floured`).
// Fase 3 (HP 10→0): «Subí el horno» — ráfagas rápidas de manteca + patinada con 2 bolsas hasta `ko`.

export const LALE_ARENA = {
  hpMax: 30,
  p2At: 20,
  p3At: 10,
  xMax: 4.3,
  zNear: 2.0,
  zFar: -8.5,
  bossZ: -11.5,
  butterSpeed: 12.5,
  butterHitR: 0.9,
  puddleR: 1.35,
  puddleLife: 6.5,
  bagHitR: 1.9,
  meleeZ: -6.5,
  meleeX: 2.4,
  skateZ: -3.2,
  skateSpeed: 8.6,
  skateWarn: 0.48,
  points: { flour: 250, melee: 180, dodge: 100, power: 300 }
};

export function createLaleArenaLogic({ rand = Math.random } = {}) {
  const A = LALE_ARENA;
  const state = {
    hp: A.hpMax,
    hpMax: A.hpMax,
    phase: 1,          // 1 | 2 | 3 | 'ko'
    mode: 'attack',    // 'attack' | 'skateWarn' | 'skate' | 'floured' | 'transition' | 'ko'
    pose: 'idle',      // idle | throw | skate | floured | hurt | ko
    bossX: 0,
    bossZ: A.bossZ,
    skateDir: 1,
    skateWarnZ: A.skateZ,
    shots: [],         // [{ id, x, z, vx, vz, targetZ }]
    puddles: [],       // [{ id, x, z, life }]
    bags: [],          // [{ id, x, z, alive }]
    slipping: false,
    t: 0
  };

  let nextId = 1;
  let timer = 0.85;
  let throwsLeft = 3;
  let skatePasses = 0;
  let poseName = 'idle', poseT = 0;
  let afterPhase = null;
  let hitLock = 0;

  function setPose(name, dur) { poseName = name; poseT = dur; state.pose = name; }

  function spawnBag(count = 1) {
    for (let k = 0; k < count; k++) {
      if (state.bags.filter(b => b.alive).length >= count) break;
      const side = (state.bags.length + k) % 2 === 0 ? -1 : 1;
      const bx = side * (1.5 + rand() * 2.1);
      const bz = -2.2 - rand() * 3.8;
      state.bags.push({ id: nextId++, x: bx, z: bz, alive: true });
    }
  }

  function addPuddle(px, pz) {
    if (state.puddles.length >= 6) state.puddles.shift();
    state.puddles.push({ id: nextId++, x: px, z: pz, life: A.puddleLife });
  }

  function enterPhase(p, evs) {
    state.phase = p;
    state.mode = 'transition';
    state.shots.length = 0;
    state.bags.length = 0;
    state.bossZ = A.bossZ;
    timer = 1.5;
    afterPhase = p;
    setPose('idle', 1.5);
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
      state.bags.length = 0;
      state.bossZ = A.bossZ;
      evs.push({ type: 'ko' });
      evs.push({ type: 'voice', event: 'ko' });
      return;
    }
    if (state.phase === 1 && state.hp <= A.p2At) enterPhase(2, evs);
    else if (state.phase === 2 && state.hp <= A.p3At) enterPhase(3, evs);
  }

  function startSkate(evs, targetZ = A.skateZ) {
    state.mode = 'skateWarn';
    state.skateDir = state.bossX >= 0 ? -1 : 1;
    state.bossX = -state.skateDir * (A.xMax - 0.3);
    state.skateWarnZ = targetZ;
    state.bossZ = targetZ;
    timer = A.skateWarn;
    skatePasses = state.phase === 3 ? 2 : 3;
    spawnBag(state.phase === 3 ? 2 : 1);
    setPose('skate', A.skateWarn);
    evs.push({ type: 'skateStart', dir: state.skateDir, z: targetZ });
    evs.push({ type: 'voice', event: 'attack' });
  }

  function throwButter(hero, evs) {
    const targetZ = Math.max(A.zFar + 1.5, Math.min(A.zNear - 0.5, hero.z));
    const distZ = Math.max(3, targetZ - A.bossZ);
    const speed = A.butterSpeed * (state.phase === 3 ? 1.15 : 1);
    const vx = Math.max(-7, Math.min(7, (hero.x - state.bossX) / (distZ / speed)));
    state.shots.push({ id: nextId++, x: state.bossX, z: A.bossZ + 1.0, vx, vz: speed, targetZ });
    setPose('throw', 0.45);
    evs.push({ type: 'throw', x: state.bossX });
    if (throwsLeft === 3) evs.push({ type: 'voice', event: 'attack' });
  }

  function flourBoss(evs) {
    state.mode = 'floured';
    state.bossZ = A.bossZ;
    state.shots.length = 0;
    timer = 3.0;
    hitLock = 0;
    setPose('floured', 3.0);
    evs.push({ type: 'floured', x: state.bossX });
    evs.push({ type: 'voice', event: 'hurt' });
    damage(state.phase === 2 ? 4 : 3, 'flour', evs);
  }

  function update(dt, hero) {
    const evs = [];
    state.t += dt;
    if (poseT > 0) poseT = Math.max(0, poseT - dt);
    if (hitLock > 0) hitLock = Math.max(0, hitLock - dt);
    if (state.phase === 'ko') { state.pose = 'ko'; return evs; }

    // Charcos de manteca en el piso
    state.slipping = false;
    for (let i = state.puddles.length - 1; i >= 0; i--) {
      const p = state.puddles[i];
      p.life -= dt;
      if (p.life <= 0) { state.puddles.splice(i, 1); continue; }
      if (hero.y <= 0.1 && Math.hypot(hero.x - p.x, hero.z - p.z) < A.puddleR) {
        state.slipping = true;
      }
    }

    if (state.mode === 'transition') {
      timer -= dt;
      if (timer <= 0) {
        if (afterPhase === 2) startSkate(evs);
        else {
          state.mode = 'attack';
          state.bossZ = A.bossZ;
          throwsLeft = 3;
          timer = 0.65;
          spawnBag(state.phase === 3 ? 2 : 1);
        }
        afterPhase = null;
      }
      return evs;
    }

    if (state.mode === 'floured') {
      timer -= dt;
      if (timer <= 0) {
        if (state.phase === 2) startSkate(evs, Math.max(-5.5, Math.min(-1.0, hero.z)));
        else {
          state.mode = 'attack';
          throwsLeft = 3;
          timer = 0.7;
          spawnBag(state.phase === 3 ? 2 : 1);
        }
      }
    } else if (state.mode === 'skateWarn') {
      state.pose = 'skate';
      timer -= dt;
      if (timer <= 0) {
        state.mode = 'skate';
        state.bossZ = state.skateWarnZ;
      }
    } else if (state.mode === 'skate') {
      state.pose = 'skate';
      const spd = A.skateSpeed * (state.phase === 3 ? 1.15 : 1);
      state.bossX += state.skateDir * spd * dt;
      // Deja charco de manteca al cruzar el centro
      if (Math.abs(state.bossX) < 0.25 && state.puddles.every(p => Math.hypot(p.x - state.bossX, p.z - state.bossZ) > 1.8)) {
        addPuddle(state.bossX, state.bossZ);
      }
      // Choque contra el héroe mientras patina
      if (hero.y < 0.75 && Math.abs(hero.z - state.bossZ) < 1.25 && Math.abs(hero.x - state.bossX) < 1.2) {
        if (hero.dodging) evs.push({ type: 'dodge', x: hero.x, z: hero.z });
        else if (!hero.inv) {
          evs.push({ type: 'hurt', source: 'skate' });
          evs.push({ type: 'voice', event: 'taunt' });
        }
      }
      if (Math.abs(state.bossX) >= A.xMax - 0.15) {
        state.bossX = Math.sign(state.bossX) * (A.xMax - 0.15);
        state.skateDir = -state.skateDir;
        skatePasses--;
        state.skateWarnZ = Math.max(-5.5, Math.min(-1.0, hero.z));
        state.bossZ = state.skateWarnZ;
        if (skatePasses <= 0) {
          state.bossZ = A.bossZ;
          if (state.phase === 3) {
            state.mode = 'attack';
            throwsLeft = 3;
            timer = 0.65;
            spawnBag(2);
          } else {
            // Queda respirando un instante antes de volver a patinar
            state.mode = 'attack';
            throwsLeft = 2;
            timer = 0.8;
            spawnBag(1);
          }
        } else {
          state.mode = 'skateWarn';
          timer = A.skateWarn * 0.85;
        }
      }
    } else if (state.mode === 'attack') {
      state.bossZ = A.bossZ;
      state.bossX = Math.sin(state.t * 1.1) * 2.5;
      if (state.bags.every(b => !b.alive)) spawnBag(state.phase === 3 ? 2 : 1);
      timer -= dt;
      if (timer <= 0) {
        throwButter(hero, evs);
        throwsLeft--;
        if (throwsLeft <= 0) {
          if (state.phase >= 2) startSkate(evs, Math.max(-5.5, Math.min(-1.0, hero.z)));
          else { throwsLeft = 3; timer = 1.4; }
        } else {
          timer = state.phase === 3 ? 0.65 : 0.85;
        }
      }
    }

    // Mover barras de manteca
    for (let i = state.shots.length - 1; i >= 0; i--) {
      const s = state.shots[i];
      s.x += s.vx * dt;
      s.z += s.vz * dt;
      if (Math.abs(s.z - hero.z) < 0.8 && Math.abs(s.x - hero.x) < A.butterHitR) {
        if (hero.dodging) {
          evs.push({ type: 'dodge', x: hero.x, z: hero.z });
          s.z = hero.z + 1.1;
        } else if (!hero.inv) {
          state.shots.splice(i, 1);
          addPuddle(s.x, hero.z);
          evs.push({ type: 'hurt', source: 'butter' });
          evs.push({ type: 'voice', event: 'taunt' });
          continue;
        }
      }
      if (s.z >= s.targetZ || s.z > A.zNear + 2) {
        addPuddle(Math.max(-A.xMax + 0.5, Math.min(A.xMax - 0.5, s.x)), Math.min(A.zNear, s.z));
        state.shots.splice(i, 1);
      }
    }

    if (state.phase === 'ko') return evs.filter(e => e.type !== 'hurt');
    if (poseT > 0) state.pose = poseName;
    else if (state.mode === 'floured') state.pose = 'floured';
    else if (state.mode === 'skate' || state.mode === 'skateWarn') state.pose = 'skate';
    else state.pose = 'idle';
    return evs;
  }

  function punch(area) {
    const evs = [];
    if (state.phase === 'ko' || state.mode === 'transition') return evs;

    // 1. Golpear una bolsa de harina → nube blanca directa a Lale!
    for (const b of state.bags) {
      if (b.alive && Math.hypot(area.x - b.x, area.z - b.z) < A.bagHitR) {
        b.alive = false;
        evs.push({ type: 'bagBurst', x: b.x, z: b.z });
        flourBoss(evs);
        return evs;
      }
    }

    // 2. Golpe directo a Lale cuando está enharinado, o contraataque experto al cruzar patinando
    const skating = state.mode === 'skate' || state.mode === 'skateWarn';
    const dist = Math.hypot(area.x - state.bossX, area.z - (skating ? state.bossZ : A.meleeZ));
    if (hitLock <= 0 && dist < A.meleeX && (skating || area.z <= A.meleeZ + 1.0)) {
      hitLock = 0.35;
      if (state.mode === 'floured') {
        setPose('hurt', 0.35);
        evs.push({ type: 'meleeHit', dmg: 2, x: state.bossX });
        evs.push({ type: 'voice', event: 'hurt' });
        damage(2, 'melee', evs);
      } else if (skating && dist < 1.7) {
        // Contraataque con timing justo mientras patina: lo frena y hace 2 de daño
        setPose('hurt', 0.4);
        evs.push({ type: 'meleeHit', dmg: 2, x: state.bossX });
        evs.push({ type: 'voice', event: 'hurt' });
        damage(2, 'skateCounter', evs);
        if (state.hp > 0 && state.mode !== 'transition') {
          state.mode = 'floured';
          state.bossZ = A.bossZ;
          timer = 2.0;
        }
      } else {
        // Resbaloso de manteca: zafa hasta que lo enharines
        evs.push({ type: 'slipAway', x: state.bossX });
        evs.push({ type: 'voice', event: 'taunt' });
      }
    }
    return evs;
  }

  function power() {
    const evs = [];
    if (state.phase === 'ko' || state.mode === 'transition') return evs;
    state.shots.length = 0;
    state.puddles.length = 0;
    state.mode = 'floured';
    state.bossZ = A.bossZ;
    timer = 2.2;
    setPose('hurt', 0.5);
    evs.push({ type: 'powerClear' });
    evs.push({ type: 'voice', event: 'hurt' });
    damage(5, 'power', evs);
    return evs;
  }

  function _setHp(hp) {
    state.hp = Math.max(0, Math.min(A.hpMax, hp));
    state.shots.length = 0;
    state.puddles.length = 0;
    state.bags.length = 0;
    state.bossZ = A.bossZ;
    if (state.hp <= 0) {
      state.phase = 'ko'; state.mode = 'ko'; state.pose = 'ko';
    } else if (state.hp <= A.p3At) {
      state.phase = 3; state.mode = 'attack'; throwsLeft = 3; timer = 0.6; spawnBag(2);
    } else if (state.hp <= A.p2At) {
      state.phase = 2; startSkate([]);
    } else {
      state.phase = 1; state.mode = 'attack'; throwsLeft = 3; timer = 0.7; spawnBag(1);
    }
  }

  spawnBag(1);
  return { state, update, punch, power, _setHp };
}
