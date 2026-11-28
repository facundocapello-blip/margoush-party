// Piezas de FX compartidas por las 4 arenas de jefes (Cepi, Lale, Pinky, Facu).
// Vive aparte de arena.js (la arena de Chaky) para que las otras arenas no dependan de ese módulo de ~950 líneas.

// Ids de presets de skill_fx_presets.js, en un solo lugar para no repetir strings en cada arena.
export const FX = {
  IVY: 'marine_ivy_whirl',
  TRUTH: 'douge_truth_slam',
  HERO_CRY: 'margot_hero_cry',
  CEPI_SMASH: 'cepi_golden_smash',
  LALE_FLARE: 'lale_oven_flare',
  ASTRAL: 'effekseer_astral_slash'
};

export function heroPowerPresetId(isMarine) {
  return isMarine ? FX.IVY : FX.TRUTH;
}

// Hacia dónde mira algo en `fromX` para encarar a `toX` (1 = derecha, -1 = izquierda). Sin diferencia, 1.
export function facingToward(fromX, toX) {
  return toX < fromX ? -1 : 1;
}

// Poder del héroe (Marine: hiedra, Douge: verdades). `pos` es la posición del héroe en la arena;
// `facing` (opcional en `opts`) lo pasa la arena: normalmente hacia el jefe.
export function heroPowerFx(skillFx, isMarine, pos, opts = {}) {
  return skillFx.play(heroPowerPresetId(isMarine), { x: pos.x, y: 1.6, z: pos.z + 0.4 }, { worldSize: 4.6, ...opts });
}

// FX que se dibuja sobre el jefe en KO o cambio de fase: sale suave (más chico y translúcido) y mirando
// hacia el héroe, para no tapar al jefe ni sus telegrafiados (anti-objetivo del spec de FX).
export function bossFrontFx(skillFx, presetId, pos, { worldSize, heroX = 0, ...opts } = {}) {
  return skillFx.play(presetId, pos, { worldSize, facing: facingToward(pos.x, heroX), soften: true, ...opts });
}

// Chispas/cartón/billetes de impacto. `cfg`:
//   geo               geometría compartida de cada chispa (la arena la crea con keep())
//   spd, vy, life     [mínimo, rango aleatorio]
//   scale             [x, y, z] opcional para chispas que no son billete
//   bill              opcional { vy, life } para la variante «billete» (isBill = true)
// Los materiales por color se crean una vez y se liberan con la arena (keep).
export function createBurst(T, scene, keep, L, sparks, cfg) {
  const mats = {};
  return function burst(px, py, pz, hex, count = 8, isBill = false) {
    const m = mats[hex] || (mats[hex] = keep(new T.MeshBasicMaterial({ color: L(hex) })));
    const asBill = Boolean(isBill && cfg.bill);
    const vyCfg = asBill ? cfg.bill.vy : cfg.vy;
    const lifeCfg = asBill ? cfg.bill.life : cfg.life;
    for (let i = 0; i < count; i++) {
      const p = new T.Mesh(cfg.geo, m);
      p.position.set(px, py, pz);
      if (cfg.scale && !asBill) p.scale.set(cfg.scale[0], cfg.scale[1], cfg.scale[2]);
      const ang = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const spd = cfg.spd[0] + Math.random() * cfg.spd[1];
      scene.add(p);
      sparks.push({
        p,
        vx: Math.cos(ang) * spd,
        vy: vyCfg[0] + Math.random() * vyCfg[1],
        vz: Math.sin(ang) * spd,
        t: 0,
        life: lifeCfg[0] + Math.random() * lifeCfg[1],
        bill: asBill
      });
    }
  };
}

// Avanza y limpia las chispas. `spin` = [rot.x, rot.y] por segundo; `t` = reloj de la arena (vaivén de los billetes).
export function stepSparks(scene, sparks, dt, t = 0, spin = [10, 8]) {
  for (let i = sparks.length - 1; i >= 0; i--) {
    const q = sparks[i]; q.t += dt;
    if (q.t >= q.life) { scene.remove(q.p); sparks.splice(i, 1); continue; }
    q.vy -= (q.bill ? 5.5 : 13) * dt;
    q.p.position.x += (q.vx + (q.bill ? Math.sin(t * 10 + i) * 1.1 : 0)) * dt;
    q.p.position.y = Math.max(0.08, q.p.position.y + q.vy * dt);
    q.p.position.z += q.vz * dt;
    q.p.rotation.x += dt * (q.bill ? 6 : spin[0]);
    q.p.rotation.y += dt * (q.bill ? 9 : spin[1]);
    if (!q.bill) q.p.scale.setScalar(Math.max(0.01, 1 - q.t / q.life));
  }
}
