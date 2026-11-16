import { SpriteActor } from './sprites.js';
import { WAVES } from './level.js';

// Tipos de malo. Todos salen del secuaz (courier) recoloreado en skins.js.
//  melee    — se acerca y pega (secuaz, patovica)
//  bombo    — se queda a media distancia y aturde con el bombo
//  mozo     — tira croissants desde lejos
//  delivery — embiste en bici en línea recta
export const KINDS = {
  secuaz: { tex: 'courier', hp: 3, scale: 1, speed: 3.2, windup: 0.55, ai: 'melee', points: 'minion' },
  patovica: { tex: 'courier_patovica', hp: 7, scale: 1.3, speed: 2.2, windup: 0.8, ai: 'melee', shove: 14, points: 'patovica' },
  bombo: { tex: 'courier_bombo', hp: 4, scale: 1.05, speed: 2.8, ai: 'bombo', points: 'bombo' },
  mozo: { tex: 'courier_mozo', hp: 3, scale: 1, speed: 3.0, ai: 'mozo', points: 'mozo' },
  delivery: { tex: 'courier_delivery', hp: 3, scale: 1, speed: 3.6, ai: 'delivery', points: 'delivery' }
};
const LEGACY = ['secuaz', 'secuaz', 'patovica']; // tipos numéricos viejos
const MAX_ATTACKERS = 2;
export const BOMBO = { every: 4, windup: 0.9, radius: 3.2, stun: 1 };
export const MOZO = { every: 2.5, flight: 0.9, hitRadius: 0.75 };
export const DELIVERY = { warn: 0.85, speed: 13, run: 14, dizzy: 1.5 };

function emojiTex(emoji) {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d');
  g.font = '96px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(emoji, 64, 72);
  const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding;
  return t;
}

export function createEnemies(ctx) {
  const { scene, assets, world, fx, game } = ctx;
  const list = [];
  const shots = []; // croissants en el aire

  // Telegrafías compartidas
  const dangerMat = new THREE.MeshBasicMaterial({ color: 0xff5a3c, transparent: true, opacity: 0.25, depthWrite: false, side: THREE.DoubleSide });
  const ringMat = new THREE.MeshBasicMaterial({ color: 0xffd36e, transparent: true, opacity: 0.85, depthWrite: false, side: THREE.DoubleSide });
  const croissantMat = new THREE.SpriteMaterial({ map: emojiTex('🥐'), transparent: true, depthWrite: false });
  const markMat = new THREE.MeshBasicMaterial({ color: 0xff5a3c, transparent: true, opacity: 0.5, depthWrite: false });
  const laneMat = new THREE.MeshBasicMaterial({ color: 0xff3b30, transparent: true, opacity: 0.35, depthWrite: false });
  const wheelGeo = new THREE.TorusGeometry(0.42, 0.06, 6, 18);
  const bikeMat = new THREE.MeshLambertMaterial({ color: 0x1f9e5a });
  const tireMat = new THREE.MeshLambertMaterial({ color: 0x18181c });

  function flatMesh(geo, mat) {
    const m = new THREE.Mesh(geo, mat);
    m.rotation.x = -Math.PI / 2;
    m.visible = false;
    scene.add(m);
    return m;
  }

  function buildBike() {
    const g = new THREE.Group();
    for (const x of [-0.65, 0.65]) { const w = new THREE.Mesh(wheelGeo, tireMat); w.position.set(x, 0.45, 0); g.add(w); }
    const frame = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.08, 0.08), bikeMat); frame.position.set(0, 0.75, 0); frame.rotation.z = 0.12;
    const fork = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.7, 0.08), bikeMat); fork.position.set(0.6, 0.8, 0);
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.6), tireMat); bar.position.set(0.6, 1.15, 0);
    g.add(frame, fork, bar);
    scene.add(g);
    return g;
  }

  function spawn(x, z, kind = 'secuaz') {
    if (typeof kind === 'number') kind = LEGACY[kind] || 'secuaz';
    const k = KINDS[kind];
    const actor = new SpriteActor(scene, assets, { poses: { idle: { tex: k.tex } }, heightM: 2.25 * k.scale });
    actor.position.set(x, 0, z);
    const e = { actor, pos: actor.position, kind, k, hp: k.hp, maxHp: k.hp, state: 'walk', t: 0, cd: 0.6 + Math.random(), stun: 0, kx: 0,
      slotZ: (Math.random() - 0.5) * 1.6, seed: Math.random() * 10, dead: 0, extras: [] };
    if (k.ai === 'bombo') {
      e.cd = 1.5 + Math.random();
      e.zone = flatMesh(new THREE.CircleGeometry(BOMBO.radius, 40), dangerMat);
      e.ring = flatMesh(new THREE.RingGeometry(0.85, 1, 40), ringMat);
      e.extras.push(e.zone, e.ring);
    }
    if (k.ai === 'mozo') e.cd = 1.2 + Math.random();
    if (k.ai === 'delivery') {
      e.cd = 1 + Math.random();
      e.bike = buildBike();
      e.lane = flatMesh(new THREE.PlaneGeometry(DELIVERY.run, 1.2), laneMat);
      e.extras.push(e.bike, e.lane);
    }
    list.push(e);
    return e;
  }

  function attackers() { return list.filter(e => e.hp > 0 && e.k.ai === 'melee' && (e.state === 'windup' || e.state === 'strike')).length; }

  function hideTells(e) { for (const m of [e.zone, e.ring, e.lane]) if (m) m.visible = false; }

  function damage(e, dmg, knockDir, knock, strength) {
    e.hp -= dmg;
    e.state = 'hitstun';
    e.t = strength > 1.2 ? 0.55 : 0.32;
    e.kx = knockDir * knock * (e.kind === 'patovica' ? 0.5 : 1);
    hideTells(e);
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
      const pts = game.score.killValue(e.k.points);
      game.score.addKill(e.k.points);
      fx.popup(e.pos.clone().setY(3.1), '+' + pts, '#7ee0c3', { size: 22, life: 0.9 });
      ctx.audio?.sfx('ko');
    }
  }

  function heroCanBeHit(hero, maxLift) { return hero.lift < maxLift && !hero.isDodging(); }

  // ---------- comportamientos ----------
  function melee(e, dt, hero, hp, dx, dz) {
    const a = e.actor;
    if (e.state === 'windup') {
      e.t -= dt;
      a.material.color.setHex(Math.floor(e.t * 20) % 2 ? 0xff8080 : 0xffffff);
      if (e.t <= 0) { e.state = 'strike'; e.t = 0.15; a.material.color.setHex(0xffffff); }
    } else if (e.state === 'strike') {
      e.t -= dt;
      const ex = (hp.x - e.pos.x) * a.facing;
      const reach = e.kind === 'patovica' ? 2.1 : 1.7;
      if (!e.struck && ex > -0.3 && ex < reach && Math.abs(dz) < 0.65 && hero.lift < 0.8) {
        e.struck = true;
        if (hero.hurt(1, e.pos.x) && e.k.shove) hero.push(a.facing * e.k.shove, 0);
      }
      if (e.t <= 0) { e.state = 'walk'; e.cd = e.kind === 'patovica' ? 1.8 : 1.2; e.struck = false; }
    } else {
      a.lean = 0;
      // Se acerca a un costado del héroe; si ya hay dos atacando, espera a distancia
      const side = dx > 0 ? -1 : 1;
      const busy = attackers() >= MAX_ATTACKERS;
      const near = e.kind === 'patovica' ? 1.7 : 1.35;
      approach(e, dt, hp.x + side * (busy ? 3.4 : near), hp.z + (busy ? e.slotZ : 0), e.k.speed);
      a.setFacing(dx >= 0 ? 1 : -1);
      if (!busy && e.cd <= 0 && Math.abs(dx) < near + 0.4 && Math.abs(dz) < 0.5) {
        e.state = 'windup';
        e.t = e.k.windup;
        fx.popup(e.pos.clone().setY(2.25 * e.k.scale + 0.6), '!', '#ffe08a', { size: 30, life: 0.5, rise: 0.4 });
      }
    }
  }

  function approach(e, dt, wantX, wantZ, speed) {
    const mx = wantX - e.pos.x, mz = wantZ - e.pos.z;
    const d = Math.hypot(mx, mz);
    if (d > 0.15) {
      e.pos.x += (mx / d) * Math.min(d, speed * dt);
      e.pos.z += (mz / d) * Math.min(d, speed * dt * 0.8);
    }
    e.actor.lift = d > 0.2 && e.k.ai !== 'delivery' ? Math.abs(Math.sin(performance.now() / 110 + e.seed)) * 0.12 : 0;
    return d;
  }

  function bombo(e, dt, hero, hp, dx) {
    const a = e.actor;
    a.setFacing(dx >= 0 ? 1 : -1);
    if (e.state === 'drum') {
      e.t += dt;
      const k = Math.min(1, e.t / BOMBO.windup);
      e.zone.visible = true; e.ring.visible = true;
      e.zone.position.set(e.pos.x, 0.04, e.pos.z);
      e.ring.position.set(e.pos.x, 0.05, e.pos.z);
      const r = 0.4 + k * (BOMBO.radius - 0.4);
      e.ring.scale.set(r, r, 1);
      a.lift = Math.abs(Math.sin(e.t * 22)) * 0.1;
      if (e.t >= BOMBO.windup) {
        hideTells(e);
        fx.popup(e.pos.clone().setY(2.9), '¡BOM!', '#ffd36e', { size: 30, life: 0.7 });
        fx.shake(0.15);
        ctx.audio?.sfx('bom');
        const d = Math.hypot(hp.x - e.pos.x, hp.z - e.pos.z);
        if (d < BOMBO.radius && heroCanBeHit(hero, 0.5)) hero.stun(BOMBO.stun);
        e.state = 'walk'; e.cd = BOMBO.every;
      }
      return;
    }
    // Se queda a media distancia, a un costado
    const side = dx > 0 ? -1 : 1;
    approach(e, dt, hp.x + side * 3.4, hp.z + e.slotZ, e.k.speed);
    const d = Math.hypot(hp.x - e.pos.x, hp.z - e.pos.z);
    if (e.cd <= 0 && d < BOMBO.radius + 1.5) {
      e.state = 'drum'; e.t = 0;
      ctx.audio?.sfx('bombo');
    }
  }

  function mozo(e, dt, hero, hp, dx) {
    const a = e.actor;
    a.setFacing(dx >= 0 ? 1 : -1);
    // Mantiene distancia: si el héroe se acerca, retrocede
    const side = dx > 0 ? -1 : 1;
    const lb = world.levelBounds;
    let wantX = hp.x + side * 7;
    if (wantX < lb.minX + 1 || wantX > lb.maxX - 1) wantX = hp.x - side * 7;
    approach(e, dt, wantX, hp.z + e.slotZ * 0.6, e.k.speed);
    if (e.cd <= 0 && Math.abs(dx) < 11) {
      e.cd = MOZO.every;
      const target = new THREE.Vector3(hp.x, 0, hp.z);
      const mark = new THREE.Mesh(new THREE.CircleGeometry(MOZO.hitRadius, 24), markMat);
      mark.rotation.x = -Math.PI / 2; mark.position.set(target.x, 0.05, target.z);
      const s = new THREE.Sprite(croissantMat); s.scale.set(0.8, 0.8, 1);
      const from = e.pos.clone().setY(1.7);
      s.position.copy(from);
      scene.add(mark, s);
      shots.push({ from, target, t: 0, sprite: s, mark });
      a.offsetX = 0.2;
      ctx.audio?.sfx('whoosh');
    } else a.offsetX *= 0.9;
  }

  function updateShots(dt) {
    const hero = game.hero, hp = hero.actor.position;
    for (let i = shots.length - 1; i >= 0; i--) {
      const s = shots[i];
      s.t += dt;
      const k = Math.min(1, s.t / MOZO.flight);
      s.sprite.position.lerpVectors(s.from, s.target, k);
      s.sprite.position.y = s.from.y * (1 - k) + Math.sin(k * Math.PI) * 3 + 0.3 * k;
      s.sprite.material.rotation = k * 8;
      s.mark.scale.setScalar(0.6 + 0.4 * k);
      s.mark.material.opacity = 0.3 + 0.4 * k;
      if (k >= 1) {
        if (Math.hypot(hp.x - s.target.x, hp.z - s.target.z) < MOZO.hitRadius && heroCanBeHit(hero, 0.8)) hero.hurt(1, s.target.x - 0.1);
        fx.dust(s.target);
        scene.remove(s.sprite, s.mark);
        s.mark.geometry.dispose();
        shots.splice(i, 1);
      }
    }
  }

  function delivery(e, dt, hero, hp, dx, dz) {
    const a = e.actor;
    if (e.state === 'ring') {
      e.t -= dt;
      e.lane.visible = true;
      e.lane.material.opacity = Math.floor(e.t * 12) % 2 ? 0.45 : 0.2;
      e.lane.position.set(e.pos.x + e.dir * DELIVERY.run / 2, 0.04, e.pos.z);
      if (e.t <= 0) { e.state = 'charge'; e.ran = 0; e.hitHero = false; hideTells(e); ctx.audio?.sfx('whoosh'); }
      return;
    }
    if (e.state === 'charge') {
      const prevX = e.pos.x;
      e.pos.x += e.dir * DELIVERY.speed * dt;
      world.clampPosition(e.pos, 0.2, prevX);
      const moved = Math.abs(e.pos.x - prevX);
      e.ran += moved;
      a.lean = -0.18;
      if (!e.hitHero && Math.abs(hp.x - e.pos.x) < 0.9 && Math.abs(hp.z - e.pos.z) < 0.7 && heroCanBeHit(hero, 1.0)) {
        e.hitHero = true;
        if (hero.hurt(1, e.pos.x - e.dir)) hero.push(e.dir * 10, 0);
      }
      if (e.ran >= DELIVERY.run || moved < DELIVERY.speed * dt * 0.3) {
        e.state = 'dizzy'; e.t = DELIVERY.dizzy;
        fx.popup(e.pos.clone().setY(2.9), '💫', '#fff', { size: 26, life: DELIVERY.dizzy, rise: 0.1 });
      }
      return;
    }
    if (e.state === 'dizzy') {
      e.t -= dt;
      a.lean = Math.sin(performance.now() / 80) * 0.1;
      if (e.t <= 0) { e.state = 'walk'; e.cd = 2.5; a.lean = 0; }
      return;
    }
    // Patrulla: se pone en el carril del héroe, a distancia
    a.lean = 0;
    const side = dx > 0 ? -1 : 1;
    const lb = world.levelBounds;
    let wantX = hp.x + side * 8;
    if (wantX < lb.minX + 1 || wantX > lb.maxX - 1) wantX = hp.x - side * 8;
    approach(e, dt, wantX, hp.z, e.k.speed);
    a.setFacing(dx >= 0 ? 1 : -1);
    if (e.cd <= 0 && Math.abs(dz) < 0.8 && Math.abs(dx) > 4 && Math.abs(dx) < 12) {
      e.state = 'ring'; e.t = DELIVERY.warn; e.dir = Math.sign(dx);
      fx.popup(e.pos.clone().setY(2.9), '🔔', '#fff', { size: 30, life: 0.8, rise: 0.3 });
      ctx.audio?.sfx('bell');
    }
  }

  return {
    list,
    shots,
    spawnWave(zoneId) {
      const hx = game.hero.actor.position.x;
      const wave = WAVES.find(w => w.id === zoneId);
      const lb = world.levelBounds;
      for (const d of wave ? wave.spawns : []) {
        const x = Math.min(lb.maxX - 1, Math.max(lb.minX + 1, hx + d.dx));
        spawn(x, d.dz, d.kind);
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
        if (e.state !== 'dead' && e.state !== 'hitstun') { e.state = 'walk'; e.cd = Math.max(e.cd, 1); hideTells(e); }
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
          a.lean = (1 - e.dead / 0.6) * -e.kx * 0.12;
          a.update(dt, 0);
          if (e.bike) e.bike.position.set(e.pos.x, 0, e.pos.z);
          if (e.dead <= 0) { remove(e); list.splice(i, 1); }
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
        } else if (e.k.ai === 'melee') melee(e, dt, hero, hp, dx, dz);
        else if (e.k.ai === 'bombo') bombo(e, dt, hero, hp, dx);
        else if (e.k.ai === 'mozo') mozo(e, dt, hero, hp, dx);
        else if (e.k.ai === 'delivery') delivery(e, dt, hero, hp, dx, dz);

        e.kx *= Math.max(0, 1 - dt * 7);
        e.pos.x += e.kx * dt;
        world.clampPosition(e.pos, 0.2, prevX);
        if (e.bike) {
          // va sentado en la bici
          e.bike.position.set(e.pos.x, 0, e.pos.z);
          e.bike.scale.x = a.facing;
          a.lift = Math.max(a.lift, 0.35);
          const roll = e.state === 'charge' ? DELIVERY.speed : e.state === 'walk' ? e.k.speed : 0;
          for (const w of e.bike.children.slice(0, 2)) w.rotation.z -= roll * dt / 0.42 * a.facing;
        }
        a.update(dt, 0);
      }
      updateShots(dt);
      // Separación para que no se apilen
      for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
        const a = list[i], b = list[j];
        if (a.hp <= 0 || b.hp <= 0 || a.state === 'charge' || b.state === 'charge') continue;
        const dx = b.pos.x - a.pos.x, dz = b.pos.z - a.pos.z, d = Math.hypot(dx, dz);
        if (d < 0.9 && d > 0.001) { const push = (0.9 - d) / 2; a.pos.x -= dx / d * push; a.pos.z -= dz / d * push; b.pos.x += dx / d * push; b.pos.z += dz / d * push; }
      }
    },

    clear() {
      for (const e of list) remove(e);
      list.length = 0;
      for (const s of shots) { scene.remove(s.sprite, s.mark); s.mark.geometry.dispose(); }
      shots.length = 0;
    }
  };

  function remove(e) {
    e.actor.dispose();
    for (const m of e.extras) scene.remove(m);
  }
}
