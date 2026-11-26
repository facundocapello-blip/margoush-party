import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CEPI_ARENA, createCepiArenaLogic } from '../3d/js/arena_cepi_logic.js';

function step(logic, secs, hero = { x: 0, z: -1, y: 0, dodging: false, inv: false }, dt = 0.05) {
  const evs = [];
  for (let t = 0; t < secs; t += dt) evs.push(...logic.update(dt, hero));
  return evs;
}

test('cepi arena: starts in phase 1, serves 3 balls (including gold) and gets tired', () => {
  const l = createCepiArenaLogic({ rand: () => 0.4 });
  assert.equal(l.state.phase, 1);
  assert.equal(l.state.hp, CEPI_ARENA.hpMax);
  const evs = step(l, 4.0, { x: 4, z: -1, y: 0, dodging: false, inv: true });
  const serves = evs.filter(e => e.type === 'serve');
  assert.equal(serves.length, 3);
  assert.equal(serves[2].gold, true);
  assert.equal(l.state.mode, 'tired');
  assert.equal(l.state.pose, 'tired');
});

test('cepi arena: punching Cepi upfront while attacking triggers block, while tired deals damage', () => {
  const l = createCepiArenaLogic({ rand: () => 0.5 });
  const blockEvs = l.punch({ x: l.state.bossX, z: CEPI_ARENA.meleeZ - 0.5, reach: 2, dmg: 1 });
  assert.ok(blockEvs.some(e => e.type === 'block'));
  assert.equal(l.state.pose, 'block');
  assert.equal(l.state.hp, CEPI_ARENA.hpMax);

  // Wait until tired
  step(l, 4.0, { x: 4, z: -1, y: 0, dodging: false, inv: true });
  assert.equal(l.state.mode, 'tired');
  const hitEvs = l.punch({ x: l.state.bossX, z: CEPI_ARENA.meleeZ - 0.5, reach: 2, dmg: 1 });
  assert.ok(hitEvs.some(e => e.type === 'meleeHit'));
  assert.ok(l.state.hp < CEPI_ARENA.hpMax);
});

test('cepi arena: normal ball return chips 1 HP without stun; gold ball deals 4 HP and stuns', () => {
  const l = createCepiArenaLogic({ rand: () => 0.5 });
  const hero = { x: 0, z: -1, y: 0, dodging: false, inv: true };
  step(l, 0.9, hero);
  assert.ok(l.state.shots.length >= 1);
  assert.equal(l.state.shots[0].gold, false);
  // Return first (normal) ball
  let returnedNormal = false;
  for (let i = 0; i < 60 && !returnedNormal; i++) {
    l.update(0.05, hero);
    const s = l.state.shots[0];
    if (s && !s.gold && Math.abs(s.z - hero.z) < 1.0) {
      returnedNormal = l.punch({ x: s.x, z: hero.z, reach: 2, dmg: 1 }).some(e => e.type === 'returned');
    }
  }
  assert.ok(returnedNormal, 'normal ball should be returned');
  const normEvs = step(l, 1.0, hero);
  assert.ok(normEvs.some(e => e.type === 'bossHit' && e.source === 'returnedNormal' && e.dmg === 1));
  assert.notEqual(l.state.mode, 'stun', 'normal ball should not stun Cepi');

  // Wait for 3rd ball (gold) and return it
  let returnedGold = false;
  for (let i = 0; i < 120 && !returnedGold; i++) {
    l.update(0.05, hero);
    const g = l.state.shots.find(s => s.gold && !s.returning);
    if (g && Math.abs(g.z - hero.z) < 1.0) {
      returnedGold = l.punch({ x: g.x, z: hero.z, reach: 2, dmg: 1 }).some(e => e.type === 'returned' && e.gold);
    }
  }
  assert.ok(returnedGold, 'gold ball should be returned');
  const hitEvs = step(l, 1.2, hero);
  assert.ok(hitEvs.some(e => e.type === 'bossHit' && e.source === 'returned' && e.dmg === 4));
  assert.equal(l.state.mode, 'stun');
  assert.equal(l.state.pose, 'stun');
});

test('cepi arena: phase 2 duel turns back immediately, points, and rewards dodging to the opposite side', () => {
  const l = createCepiArenaLogic({ rand: () => 0.1 }); // dir = -1 (left)
  l._setHp(CEPI_ARENA.p2At);
  assert.equal(l.state.phase, 2);
  assert.equal(l.state.mode, 'duel');
  assert.equal(l.state.pose, 'back');

  // Wait for tell
  const tellEvs = step(l, 1.15);
  const tell = tellEvs.find(e => e.type === 'duelTell');
  assert.ok(tell);
  assert.equal(l.state.pose, 'point');

  // Pick opposite side (+1 when dir is -1)
  l.pickSide(-tell.dir);
  const resEvs = step(l, 1.85);
  assert.ok(resEvs.some(e => e.type === 'duelResult' && e.ok === true));
  assert.ok(l.state.hp < CEPI_ARENA.p2At);
});

test('cepi arena: phase 3 spawns 2 cardboard decoys + real Cepi; knocking both stuns Cepi and KO works', () => {
  const l = createCepiArenaLogic({ rand: () => 0.5 });
  l._setHp(CEPI_ARENA.p3At);
  assert.equal(l.state.phase, 3);
  assert.equal(l.state.decoys.length, 2);
  assert.ok(l.state.decoys.every(c => c.alive && c.lane !== l.state.bossLane));

  // Knock down both cardboard decoys
  const d0 = l.state.decoys[0], d1 = l.state.decoys[1];
  const cbEvs0 = l.punch({ x: d0.x, z: CEPI_ARENA.meleeZ - 0.5, reach: 2, dmg: 1 });
  assert.ok(cbEvs0.some(e => e.type === 'cardboard'));
  assert.equal(d0.alive, false);
  step(l, 0.3, { x: 4, z: 2, y: 0, dodging: false, inv: true });
  const cbEvs1 = l.punch({ x: d1.x, z: CEPI_ARENA.meleeZ - 0.5, reach: 2, dmg: 1 });
  assert.ok(cbEvs1.some(e => e.type === 'decoysCleared'));
  assert.equal(l.state.mode, 'stun');

  // Power twice finishes Cepi cleanly to KO
  l.power();
  const koEvs = l.power();
  assert.ok(koEvs.some(e => e.type === 'ko'));
  assert.equal(l.state.phase, 'ko');
  assert.equal(l.state.pose, 'ko');
  assert.equal(l.state.hp, 0);
});

test('cepi arena: a returned ball that changes phase or KOs while other balls fly does not crash', () => {
  for (const hp of [CEPI_ARENA.p2At + 1, 1]) {
    const l = createCepiArenaLogic({ rand: () => 0.5 });
    const hero = { x: 0, z: -1, y: 0, dodging: false, inv: true };
    l._setHp(hp);
    const mk = (z, gold) => ({ id: z, x: 0, z, vx: 0, vz: 0, gold, glass: false, bounced: false, returning: true });
    // el índice mayor se procesa primero: pega y vacía state.shots, el otro queda colgado
    l.state.shots.push(mk(5, false), mk(CEPI_ARENA.bossZ, true));
    let evs;
    assert.doesNotThrow(() => { evs = l.update(0.05, hero); });
    assert.ok(evs.some(e => e.type === 'phase' || e.type === 'ko'), 'debe llegar el evento phase/ko');
  }
});

test('D-2: balance de Cepi (casual flojo >= machacador, novato >= 40 %, fase 1 <= 1.5 golpes)', () => {
  // Pegarle al aire activa recovery breve para que machacar no devuelva pelotas gratis
  const chk = createCepiArenaLogic({ rand: () => 0.5 });
  chk.punch({ x: 3.5, z: 1.5, reach: 2, dmg: 1 }); // golpe al aire
  chk.state.shots.push({ id: 99, x: 0, z: -1, vx: 0, vz: 8, gold: true, glass: false, bounced: false, returning: false });
  assert.equal(chk.punch({ x: 0, z: -1, reach: 2, dmg: 1 }).some(e => e.type === 'returned'), false, 'machacar al aire bloquea devolución inmediata');

  function sim(profile) {
    const TRIALS = 30;
    const DT = 1 / 30;
    let wins = 0, p1HitsTotal = 0;
    for (let s = 1; s <= TRIALS; s++) {
      let seed = s * 104729 + (profile.length * 997);
      const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
      const l = createCepiArenaLogic({ rand: rnd });
      let x = 0, z = -1.2, hp = 5, extraUsed = false, inv = 0, hurtT = 0, punchCd = 0, duelPickedRound = 0;
      let driftX = 0, driftZ = 0, driftT = 0;
      for (let step = 0; step < 110 * 30 && l.state.phase !== 'ko' && hp > 0; step++) {
        inv = Math.max(0, inv - DT);
        hurtT = Math.max(0, hurtT - DT);
        punchCd = Math.max(0, punchCd - DT);
        const S = l.state;
        const evs = [];
        if (hurtT <= 0) {
          if (profile === 'masher') {
            driftT -= DT;
            if (driftT <= 0) { driftT = 0.6 + rnd() * 0.6; driftX = (rnd() - 0.5) * 2; driftZ = (rnd() - 0.5) * 2; }
            const len = Math.hypot(driftX, driftZ) || 1;
            x = Math.max(-CEPI_ARENA.xMax + 0.45, Math.min(CEPI_ARENA.xMax - 0.45, x + (driftX / len) * 6.4 * DT));
            z = Math.max(CEPI_ARENA.zFar, Math.min(CEPI_ARENA.zNear, z + (driftZ / len) * 6.4 * DT));
            if (S.mode === 'duel' && S.duel?.stage === 'tell' && duelPickedRound !== S.duel.round) {
              duelPickedRound = S.duel.round;
              l.pickSide(rnd() < 0.5 ? -1 : 1);
            } else if (punchCd <= 0) {
              punchCd = 0.28;
              evs.push(...l.punch({ x, z, reach: 1.9, dmg: 1 }));
            }
          } else {
            const isNovice = profile === 'novice';
            const moveSpd = isNovice ? 5.2 : 6.0;
            const duelAcc = isNovice ? 0.68 : 0.85;
            const returnAcc = isNovice ? 0.42 : 0.72;
            let tx = x, tz = -1.0;
            if (S.mode === 'duel' && S.duel?.stage === 'tell' && duelPickedRound !== S.duel.round && S.duel.t > (isNovice ? 0.55 : 0.35)) {
              duelPickedRound = S.duel.round;
              const pick = rnd() < duelAcc ? -S.duel.dir : S.duel.dir;
              l.pickSide(pick);
              x = pick * 2.8;
            } else if (S.mode === 'tired' || S.mode === 'stun') {
              tx = S.bossX; tz = CEPI_ARENA.meleeZ - 0.3;
              if (Math.abs(x - S.bossX) < CEPI_ARENA.meleeX - 0.3 && z <= CEPI_ARENA.meleeZ && punchCd <= 0) {
                punchCd = isNovice ? 0.55 : 0.4;
                evs.push(...l.punch({ x, z, reach: 1.9, dmg: 1 }));
              }
            } else {
              // Esquivar pelotas entrantes o alinearse para devolver la dorada
              const incoming = S.shots.filter(b => !b.returning && b.z < z + 1.0).sort((a, b) => b.z - a.z)[0];
              if (incoming) {
                if (incoming.gold && rnd() < returnAcc) {
                  tx = incoming.x; tz = -1.0;
                  const dz = incoming.z - z;
                  if (Math.abs(incoming.x - x) < CEPI_ARENA.returnR * 0.85 && dz >= CEPI_ARENA.returnZMin && dz <= CEPI_ARENA.returnZMax && punchCd <= 0) {
                    punchCd = 0.45;
                    evs.push(...l.punch({ x, z, reach: 1.9, dmg: 1 }));
                  }
                } else {
                  const away = incoming.x >= 0 ? -2.8 : 2.8;
                  tx = away; tz = -0.6;
                }
              } else if (S.phase === 3) {
                const decoy = S.decoys.find(d => d.alive);
                if (decoy) {
                  tx = decoy.x; tz = CEPI_ARENA.meleeZ - 0.3;
                  if (Math.abs(x - decoy.x) < CEPI_ARENA.meleeX - 0.3 && z <= CEPI_ARENA.meleeZ && punchCd <= 0) {
                    punchCd = 0.45;
                    evs.push(...l.punch({ x, z, reach: 1.9, dmg: 1 }));
                  }
                }
              }
            }
            const dx = tx - x, dz = tz - z, d = Math.hypot(dx, dz);
            if (d > 0.1) {
              x = Math.max(-CEPI_ARENA.xMax + 0.45, Math.min(CEPI_ARENA.xMax - 0.45, x + (dx / d) * Math.min(d, moveSpd * DT)));
              z = Math.max(CEPI_ARENA.zFar, Math.min(CEPI_ARENA.zNear, z + (dz / d) * Math.min(d, moveSpd * DT)));
            }
          }
        }
        evs.push(...l.update(DT, { x, z, y: 0, dodging: false, inv: inv > 0 }));
        for (const e of evs) {
          if (e.type === 'hurt') {
            if (S.phase === 1) p1HitsTotal++;
            hp = Math.max(0, hp - 1);
            hurtT = 0.5; inv = 1.3;
            if (hp <= 0 && !extraUsed) { extraUsed = true; hp = 3; inv = 1.8; l.state.shots.length = 0; }
          }
        }
      }
      if (l.state.phase === 'ko' && hp > 0) wins++;
    }
    return { winRate: wins / TRIALS, p1Hits: p1HitsTotal / TRIALS };
  }

  const masher = sim('masher');
  const novice = sim('novice');
  const casual = sim('casual');
  assert.ok(casual.winRate >= masher.winRate, `casual flojo (${Math.round(casual.winRate * 100)} %) debe superar o igualar a machacador (${Math.round(masher.winRate * 100)} %)`);
  assert.ok(novice.winRate >= 0.4, `novato debe ganar >= 40 % (ganó ${Math.round(novice.winRate * 100)} %)`);
  assert.ok(casual.p1Hits <= 1.5, `golpes recibidos por casual en fase 1 <= 1.5 (recibió ${casual.p1Hits.toFixed(2)})`);
  assert.ok(novice.p1Hits <= 1.5, `golpes recibidos por novato en fase 1 <= 1.5 (recibió ${novice.p1Hits.toFixed(2)})`);
});
