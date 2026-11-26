import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LALE_ARENA, createLaleArenaLogic } from '../3d/js/arena_lale_logic.js';

function step(logic, secs, hero = { x: 0, z: -1, y: 0, dodging: false, inv: false }, dt = 0.05) {
  const evs = [];
  for (let t = 0; t < secs; t += dt) evs.push(...logic.update(dt, hero));
  return evs;
}

test('lale arena: starts in phase 1, throws butter leaving slippery puddles', () => {
  const l = createLaleArenaLogic({ rand: () => 0.4 });
  assert.equal(l.state.phase, 1);
  assert.ok(l.state.bags.length >= 1);
  const evs = step(l, 2.2, { x: 4, z: -1, y: 0, dodging: false, inv: true });
  assert.ok(evs.some(e => e.type === 'throw'));
  assert.ok(l.state.puddles.length >= 1);
});

test('lale arena: punching flour bag flours Lale and opens melee damage; punching while oily slips away', () => {
  const l = createLaleArenaLogic({ rand: () => 0.4 });
  const slip = l.punch({ x: l.state.bossX, z: LALE_ARENA.meleeZ, reach: 2, dmg: 1 });
  assert.ok(slip.some(e => e.type === 'slipAway'));
  assert.equal(l.state.hp, LALE_ARENA.hpMax);

  const bag = l.state.bags[0];
  const flEvs = l.punch({ x: bag.x, z: bag.z, reach: 2, dmg: 1 });
  assert.ok(flEvs.some(e => e.type === 'bagBurst'));
  assert.ok(flEvs.some(e => e.type === 'floured'));
  assert.equal(l.state.mode, 'floured');
  assert.equal(l.state.pose, 'floured');
  const hpAfterFlour = l.state.hp;
  assert.ok(hpAfterFlour < LALE_ARENA.hpMax);

  const hitEvs = l.punch({ x: l.state.bossX, z: LALE_ARENA.meleeZ, reach: 2, dmg: 1 });
  assert.ok(hitEvs.some(e => e.type === 'meleeHit'));
  assert.ok(l.state.hp < hpAfterFlour);
});

test('lale arena: phase 2 telegraphs skateWarn then skates across court and phase 3 reaches KO cleanly', () => {
  const l = createLaleArenaLogic({ rand: () => 0.5 });
  l._setHp(LALE_ARENA.p2At);
  assert.equal(l.state.phase, 2);
  assert.equal(l.state.mode, 'skateWarn');
  const x0 = l.state.bossX;
  step(l, 0.85, { x: 0, z: 2, y: 0, dodging: false, inv: true });
  assert.equal(l.state.mode, 'skate');
  assert.notEqual(l.state.bossX, x0);

  l._setHp(LALE_ARENA.p3At);
  assert.equal(l.state.phase, 3);
  assert.equal(l.state.bags.length, 2);
  l.power();
  const koEvs = l.power();
  assert.ok(koEvs.some(e => e.type === 'ko'));
  assert.equal(l.state.phase, 'ko');
  assert.equal(l.state.pose, 'ko');
});

test('D-3: balance de Lale (casual flojo 70–90 %, >= 1.5 golpes, 30–45 s; machacar < 15 %)', () => {
  function sim(profile) {
    const TRIALS = 40, DT = 1 / 30;
    let wins = 0, hitsTotal = 0;
    const durs = [];
    for (let s = 1; s <= TRIALS; s++) {
      let seed = s * 65537 + profile.length * 1237;
      const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
      const l = createLaleArenaLogic({ rand: rnd });
      let x = 0, z = -1.2, vx = 0, vz = 0, hp = 5, extraUsed = false, inv = 0, hurtT = 0, punchCd = 0;
      let driftX = 0, driftZ = 0, driftT = 0, reactT = 0, tx = 0, tz = -1.2;
      for (let step = 0; step < 120 * 30 && l.state.phase !== 'ko' && hp > 0; step++) {
        inv = Math.max(0, inv - DT); hurtT = Math.max(0, hurtT - DT); punchCd = Math.max(0, punchCd - DT);
        const S = l.state, evs = [];
        if (hurtT <= 0) {
          if (profile === 'masher') {
            driftT -= DT;
            if (driftT <= 0) { driftT = 0.7 + rnd() * 0.6; driftX = (rnd() - 0.5) * 2; driftZ = (rnd() - 0.5) * 2; }
            const len = Math.hypot(driftX, driftZ) || 1;
            tx = x + driftX / len * 6.3 * DT; tz = z + driftZ / len * 6.3 * DT;
            if (punchCd <= 0) { punchCd = 0.28; evs.push(...l.punch({ x, z, reach: 1.9, dmg: 1 })); }
          } else {
            reactT -= DT;
            if (reactT <= 0) {
              reactT = 0.28 + rnd() * 0.18;
              const bag = S.bags.find(b => b.alive);
              const incoming = S.shots.filter(b => b.z < z + 0.6).sort((a, b) => b.z - a.z)[0];
              if (S.mode === 'floured') {
                tx = S.bossX; tz = LALE_ARENA.meleeZ;
              } else if ((S.mode === 'skate' || S.mode === 'skateWarn') && Math.abs(z - S.bossZ) < 1.8 && rnd() < 0.65) {
                tx = x; tz = S.bossZ > -3.5 ? -6.0 : 1.0;
              } else if (incoming && Math.abs(incoming.x - x) < 1.5 && incoming.z > z - 6.0 && rnd() < 0.62) {
                tx = incoming.x >= 0 ? -3.0 : 3.0; tz = z;
              } else if (bag) {
                tx = bag.x; tz = bag.z;
              } else {
                tx = (rnd() - 0.5) * 4; tz = -1.2;
              }
            }
            const bag = S.bags.find(b => b.alive);
            if (S.mode === 'floured' && Math.hypot(x - S.bossX, z - LALE_ARENA.meleeZ) < LALE_ARENA.meleeX - 0.2 && punchCd <= 0) {
              punchCd = 0.52; evs.push(...l.punch({ x, z, reach: 1.9, dmg: 1 }));
            } else if (bag && Math.hypot(x - bag.x, z - bag.z) < LALE_ARENA.bagHitR - 0.1 && punchCd <= 0) {
              punchCd = 0.5; evs.push(...l.punch({ x, z, reach: 1.9, dmg: 1 }));
            }
          }
          const dx = tx - x, dz = tz - z, d = Math.hypot(dx, dz);
          const spd = profile === 'masher' ? 6.3 : 5.3;
          const wantVx = d > 0.1 ? (dx / d) * spd : 0;
          const wantVz = d > 0.1 ? (dz / d) * spd : 0;
          const grip = S.slipping ? Math.min(1, DT * 3.8) : 1;
          vx += (wantVx - vx) * grip; vz += (wantVz - vz) * grip;
          x = Math.max(-LALE_ARENA.xMax + 0.45, Math.min(LALE_ARENA.xMax - 0.45, x + vx * DT));
          z = Math.max(LALE_ARENA.zFar, Math.min(LALE_ARENA.zNear, z + vz * DT));
        } else { vx = 0; vz = 0; }
        evs.push(...l.update(DT, { x, z, y: 0, dodging: false, inv: inv > 0 }));
        for (const e of evs) if (e.type === 'hurt') {
          hitsTotal++; hp = Math.max(0, hp - 1); hurtT = 0.5; inv = 1.3;
          if (hp <= 0 && !extraUsed) { extraUsed = true; hp = 3; inv = 1.8; l.state.shots.length = 0; }
        }
      }
      if (l.state.phase === 'ko' && hp > 0) { wins++; durs.push(l.state.t); }
    }
    durs.sort((a, b) => a - b);
    const med = durs.length ? durs[Math.floor(durs.length / 2)] : 0;
    return { winRate: wins / TRIALS, avgHits: hitsTotal / TRIALS, medDur: med };
  }

  const masher = sim('masher');
  const casual = sim('casual');
  assert.ok(masher.winRate < 0.15, `machacar debe ganar < 15 % (ganó ${Math.round(masher.winRate * 100)} %)`);
  assert.ok(casual.winRate >= 0.7 && casual.winRate <= 0.9, `casual flojo debe ganar 70–90 % (ganó ${Math.round(casual.winRate * 100)} %)`);
  assert.ok(casual.avgHits >= 1.5, `casual flojo debe recibir >= 1.5 golpes (recibió ${casual.avgHits.toFixed(2)})`);
  assert.ok(casual.medDur >= 30 && casual.medDur <= 45, `duración mediana 30–45 s (fue ${casual.medDur.toFixed(1)} s)`);
});
