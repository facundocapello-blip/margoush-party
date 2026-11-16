import { SpriteActor } from './sprites.js';
import { WAVES } from './level.js';

const TYPES = [
  { tint: 0xffffff, hp: 3, scale: 1 },
  { tint: 0xbfe3ff, hp: 3, scale: 1 },
  { tint: 0xffc7a6, hp: 5, scale: 1.14 } // el grandote
];
const KIND_TYPE = { secuaz: 0, patovica: 2, bombo: 1, mozo: 1, delivery: 1 }; // provisorio hasta los malos nuevos
const MAX_ATTACKERS = 2;

export function createEnemies(ctx) {
  const { scene, assets, world, fx, game } = ctx;
  const list = [];

  function spawn(x, z, type) {
    const t = TYPES[type];
    const actor = new SpriteActor(scene, assets, { poses: { idle: { tex: 'courier' } }, heightM: 2.25 * t.scale, tint: t.tint });
    actor.position.set(x, 0, z);
    const e = { actor, pos: actor.position, hp: t.hp, maxHp: t.hp, type, state: 'walk', t: 0, cd: 0.6 + Math.random(), stun: 0, kx: 0, slotZ: (Math.random() - 0.5) * 1.6, seed: Math.random() * 10, dead: 0 };
    list.push(e);
    return e;
  }

  function attackers() { return list.filter(e => e.hp > 0 && (e.state === 'windup' || e.state === 'strike')).length; }

  function damage(e, dmg, knockDir, knock, strength) {
    e.hp -= dmg;
    e.state = 'hitstun';
    e.t = strength > 1.2 ? 0.55 : 0.32;
    e.kx = knockDir * knock;
    e.actor.hit();
    e.actor.flash(0.12);
    const at = e.pos.clone().setY(1.4);
    fx.hit(at, strength);
    fx.popup(at.clone().setY(2.6), String(dmg * 10), strength > 1.2 ? '#ffd36e' : '#fff', { size: strength > 1.2 ? 26 : 20, life: 0.6 });
    game.score.addHit();
    game.combo.add(1);
    ctx.audio?.sfx(strength > 1.2 ? 'hitHeavy' : 'hit');
    if (e.hp <= 0) {
      e.state = 'dead';
      e.dead = 0.6;
      e.kx = knockDir * Math.max(knock, 7);
      game.score.addKill('minion');
      fx.popup(e.pos.clone().setY(3.1), '+' + Math.round(100 * game.score.multiplier), '#7ee0c3', { size: 22, life: 0.9 });
      ctx.audio?.sfx('ko');
    }
  }

  return {
    list,
    spawnWave(zoneId) {
      const hx = game.hero.actor.position.x;
      const wave = WAVES.find(w => w.id === zoneId);
      const lb = world.levelBounds;
      for (const d of wave ? wave.spawns : []) {
        const x = Math.min(lb.maxX - 1, Math.max(lb.minX + 1, hx + d.dx));
        spawn(x, d.dz, KIND_TYPE[d.kind]);
      }
    },
    spawn,
    alive() { return list.filter(e => e.hp > 0).length; },

    hitArea({ x, z, facing, reach, depth, dmg, knock, strength }) {
      let n = 0;
      for (const e of list) {
        if (e.hp <= 0) continue;
        const dx = (e.pos.x - x) * facing;
        if (dx < -0.4 || dx > reach || Math.abs(e.pos.z - z) > depth) continue;
        damage(e, dmg, facing, knock, strength);
        n++;
      }
      return n;
    },

    // Aturde alrededor (poder de Marine, chiste de Facu)
    stunAround(x, z, radius, seconds, dmg = 0) {
      let n = 0;
      for (const e of list) {
        if (e.hp <= 0 || Math.hypot(e.pos.x - x, e.pos.z - z) > radius) continue;
        e.stun = Math.max(e.stun, seconds);
        if (e.state === 'windup' || e.state === 'strike') { e.state = 'walk'; e.cd = 1; }
        if (dmg) damage(e, dmg, Math.sign(e.pos.x - x) || 1, 3, 1);
        n++;
      }
      return n;
    },

    update(dt) {
      const hero = game.hero;
      const hp = hero.actor.position;
      for (let i = list.length - 1; i >= 0; i--) {
        const e = list[i];
        const a = e.actor;
        const prevX = e.pos.x;
        if (e.state === 'dead') {
          e.dead -= dt;
          e.pos.x += e.kx * dt;
          a.lift = Math.max(0, a.lift + (e.dead > 0.3 ? 4 : -6) * dt);
          a.material.opacity = 1;
          a.lean = (1 - e.dead / 0.6) * -e.kx * 0.12;
          a.update(dt, 0);
          if (e.dead <= 0) { a.dispose(); list.splice(i, 1); }
          continue;
        }
        e.cd = Math.max(0, e.cd - dt);
        const dx = hp.x - e.pos.x, dz = hp.z - e.pos.z;

        if (e.stun > 0) {
          e.stun -= dt;
          a.lean = Math.sin(performance.now() / 90 + e.seed) * 0.08;
        } else if (e.state === 'hitstun') {
          e.t -= dt;
          if (e.t <= 0) { e.state = 'walk'; e.cd = Math.max(e.cd, 0.5); }
        } else if (e.state === 'windup') {
          e.t -= dt;
          a.material.color.setHex(Math.floor(e.t * 20) % 2 ? 0xff8080 : TYPES[e.type].tint);
          if (e.t <= 0) { e.state = 'strike'; e.t = 0.15; a.material.color.setHex(TYPES[e.type].tint); }
        } else if (e.state === 'strike') {
          e.t -= dt;
          const ex = (hp.x - e.pos.x) * a.facing;
          if (!e.struck && ex > -0.3 && ex < 1.7 && Math.abs(dz) < 0.65 && hero.lift < 0.8) {
            e.struck = true;
            hero.hurt(1, e.pos.x);
          }
          if (e.t <= 0) { e.state = 'walk'; e.cd = 1.2; e.struck = false; }
        } else {
          a.lean = 0;
          // Se acerca a un costado del héroe; si ya hay dos atacando, espera a distancia
          const side = dx > 0 ? -1 : 1;
          const busy = attackers() >= MAX_ATTACKERS;
          const wantX = hp.x + side * (busy ? 3.4 : 1.35);
          const wantZ = hp.z + (busy ? e.slotZ : 0);
          const mx = wantX - e.pos.x, mz = wantZ - e.pos.z;
          const d = Math.hypot(mx, mz);
          const speed = 3.2;
          if (d > 0.15) {
            e.pos.x += (mx / d) * Math.min(d, speed * dt);
            e.pos.z += (mz / d) * Math.min(d, speed * dt * 0.8);
          }
          a.setFacing(dx >= 0 ? 1 : -1);
          if (!busy && e.cd <= 0 && Math.abs(dx) < 1.7 && Math.abs(dz) < 0.5) {
            e.state = 'windup';
            e.t = 0.55;
            fx.popup(e.pos.clone().setY(2.9), '!', '#ffe08a', { size: 30, life: 0.5, rise: 0.4 });
          }
          a.lift = d > 0.2 ? Math.abs(Math.sin(performance.now() / 110 + e.seed)) * 0.12 : 0;
        }
        e.kx *= Math.max(0, 1 - dt * 7);
        e.pos.x += e.kx * dt;
        world.clampPosition(e.pos, 0.2, prevX);
        a.update(dt, 0);
      }
      // Separación para que no se apilen
      for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
        const a = list[i], b = list[j];
        if (a.hp <= 0 || b.hp <= 0) continue;
        const dx = b.pos.x - a.pos.x, dz = b.pos.z - a.pos.z, d = Math.hypot(dx, dz);
        if (d < 0.9 && d > 0.001) { const push = (0.9 - d) / 2; a.pos.x -= dx / d * push; a.pos.z -= dz / d * push; b.pos.x += dx / d * push; b.pos.z += dz / d * push; }
      }
    },

    clear() {
      for (const e of list) e.actor.dispose();
      list.length = 0;
    }
  };
}
