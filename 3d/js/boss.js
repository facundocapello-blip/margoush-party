import { SpriteActor } from './sprites.js';

const HP = 30;
const POSES = {
  idle: { tex: 'boss_idle' }, run: { tex: 'boss_run' }, attack: { tex: 'boss_attack' }, hurt: { tex: 'boss_hurt' }
};

export function createBoss(ctx, x) {
  const { scene, assets, world, fx, game } = ctx;
  const actor = new SpriteActor(scene, assets, { poses: POSES, heightM: 3.6, shadow: 0.8, scaleRef: 'boss_idle' });
  actor.position.set(x, 0, 0);
  actor.setFacing(-1);
  const bar = document.querySelector('#boss-bar');
  const fill = document.querySelector('#boss-fill');
  bar.querySelector('span').textContent = 'BIG CHAKY';
  bar.classList.remove('hidden');
  fill.style.width = '100%';

  // Onda del pisotón
  const ringMat = new THREE.MeshBasicMaterial({ color: 0xff6b5b, transparent: true, opacity: 0.85, side: THREE.DoubleSide, depthWrite: false });
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.85, 1, 48), ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.06;
  ring.visible = false;
  scene.add(ring);
  // Aviso de embestida
  const laneMat = new THREE.MeshBasicMaterial({ color: 0xff3b3b, transparent: true, opacity: 0.25, depthWrite: false });
  const lane = new THREE.Mesh(new THREE.PlaneGeometry(1, 1.4), laneMat);
  lane.rotation.x = -Math.PI / 2;
  lane.position.y = 0.05;
  lane.visible = false;
  scene.add(lane);

  const b = {
    actor, pos: actor.position, hp: HP, hpMax: HP, phase: 1,
    state: 'enter', t: 1.2, cd: 1.5, attacks: 0, dir: -1, kx: 0, inv: 0, stun: 0, hurtT: 0,
    wave: null, struck: false, chain: 0, dead: false,

    hitArea({ x, z, facing, reach, depth, dmg, strength }) {
      if (b.dead || b.inv > 0) return 0;
      const dx = (b.pos.x - x) * facing;
      if (dx < -0.6 || dx > reach + 0.8 || Math.abs(b.pos.z - z) > depth + 0.4) return 0;
      b.inv = 0.12;
      b.hp = Math.max(0, b.hp - dmg);
      b.hurtT = 0.22;
      actor.hit();
      actor.flash(0.12);
      b.kx = facing * (strength > 1.2 ? 3 : 1);
      if (strength > 1.2 && b.state === 'windup') { b.state = 'recover'; b.t = 0.5; lane.visible = false; }
      const at = b.pos.clone().setY(2.2);
      fx.hit(at, strength + 0.3);
      fx.popup(at.clone().setY(4), String(dmg * 10), '#ffd36e', { size: 24, life: 0.6 });
      game.score.addHit();
      game.combo.add(1);
      ctx.audio?.sfx(strength > 1.2 ? 'hitHeavy' : 'hit');
      fill.style.width = (b.hp / b.hpMax) * 100 + '%';
      if (b.phase === 1 && b.hp <= b.hpMax / 2 && b.hp > 0) enrage();
      if (b.hp <= 0) die();
      return 1;
    },

    stunAround(x, z, r) {
      if (b.dead || Math.hypot(b.pos.x - x, b.pos.z - z) > r) return 0;
      b.stun = 0.8;
      if (b.state === 'windup') { b.state = 'recover'; b.t = 0.4; lane.visible = false; }
      return 1;
    },

    update(dt) {
      const hero = game.hero;
      const hp = hero.actor.position;
      b.inv = Math.max(0, b.inv - dt);
      b.hurtT = Math.max(0, b.hurtT - dt);
      b.cd = Math.max(0, b.cd - dt);
      b.kx *= Math.max(0, 1 - dt * 6);
      b.pos.x += b.kx * dt;

      if (b.wave) updateWave(dt, hero);
      if (b.dead) { actor.setPose('hurt'); actor.update(dt, 0); return; }
      if (b.stun > 0) { b.stun -= dt; actor.lean = Math.sin(performance.now() / 80) * 0.06; actor.setPose('hurt'); actor.update(dt, 0); return; }
      actor.lean = 0;

      const dx = hp.x - b.pos.x, dz = hp.z - b.pos.z;
      let speed = 0;
      if (b.state === 'enter') {
        b.t -= dt;
        if (b.t <= 0) b.state = 'walk';
      } else if (b.state === 'walk') {
        b.dir = dx >= 0 ? 1 : -1;
        actor.setFacing(b.dir);
        const fast = b.phase === 2 ? 3.6 : 2.6;
        if (Math.abs(dx) > 2.6 || Math.abs(dz) > 0.6) {
          const d = Math.hypot(dx, dz);
          b.pos.x += (dx / d) * fast * dt;
          b.pos.z += (dz / d) * fast * dt * 0.8;
          speed = fast;
        }
        if (b.cd <= 0 && Math.abs(dx) < 6) startAttack();
      } else if (b.state === 'windup') {
        b.t -= dt;
        actor.material.color.setHex(Math.floor(b.t * 16) % 2 ? 0xff9090 : 0xffffff);
        if (b.t <= 0) {
          actor.material.color.setHex(0xffffff);
          lane.visible = false;
          if (b.kind === 'slam') {
            b.wave = { r: 0.5, hit: false, x: b.pos.x, z: b.pos.z };
            ring.visible = true;
            fx.shake(0.45);
            ctx.audio?.sfx('slam');
            b.state = 'recover'; b.t = b.phase === 2 ? 0.7 : 1.0;
          } else {
            b.state = 'lunge'; b.t = 0.38; b.struck = false;
            ctx.audio?.sfx('swing');
          }
        }
      } else if (b.state === 'lunge') {
        b.t -= dt;
        b.pos.x += b.dir * 11 * dt;
        speed = 11;
        if (!b.struck && Math.abs(hp.x - b.pos.x) < 1.7 && Math.abs(dz) < 0.85 && hero.lift < 1) {
          b.struck = true;
          hero.hurt(1, b.pos.x);
        }
        if (b.t <= 0) {
          if (b.phase === 2 && b.chain === 0) { b.chain = 1; startLunge(0.35); }
          else { b.chain = 0; b.state = 'recover'; b.t = b.phase === 2 ? 0.55 : 0.8; }
        }
      } else if (b.state === 'recover') {
        b.t -= dt;
        if (b.t <= 0) { b.state = 'walk'; b.cd = b.phase === 2 ? 0.7 : 1.2; }
      }
      world.clampPosition(b.pos, 0.6);
      b.pos.x = Math.max(world.galponX + 2, b.pos.x);

      if (b.hurtT > 0) actor.setPose('hurt');
      else if (b.state === 'windup' || b.state === 'lunge') actor.setPose('attack');
      else actor.setPose(speed > 0.2 ? 'run' : 'idle');
      actor.lift = speed > 0.2 && b.state === 'walk' ? Math.abs(Math.sin(performance.now() / 140)) * 0.15 : 0;
      actor.update(dt, speed);
    },

    dispose() {
      actor.dispose();
      scene.remove(ring, lane);
      bar.classList.add('hidden');
    }
  };

  function startLunge(windup) {
    b.kind = 'lunge';
    b.dir = game.hero.actor.position.x >= b.pos.x ? 1 : -1;
    actor.setFacing(b.dir);
    b.state = 'windup';
    b.t = windup;
    lane.visible = true;
    lane.scale.x = 6;
    lane.position.set(b.pos.x + b.dir * 3, 0.05, b.pos.z);
    fx.popup(b.pos.clone().setY(4.2), '!', '#ffe08a', { size: 34, life: 0.5, rise: 0.3 });
  }

  function startAttack() {
    b.attacks++;
    if (b.attacks % 3 === 0) {
      b.kind = 'slam';
      b.state = 'windup';
      b.t = 0.7;
      fx.popup(b.pos.clone().setY(4.2), '¡SALTÁ!', '#ffe08a', { size: 28, life: 0.7, rise: 0.3 });
    } else {
      startLunge(b.phase === 2 ? 0.4 : 0.5);
    }
  }

  function updateWave(dt, hero) {
    const w = b.wave;
    w.r += 11 * dt;
    ring.position.set(w.x, 0.06, w.z);
    ring.scale.setScalar(w.r);
    ringMat.opacity = Math.max(0, 0.85 * (1 - w.r / 7.5));
    const hp = hero.actor.position;
    const d = Math.hypot(hp.x - w.x, (hp.z - w.z) * 1.4);
    if (!w.hit && Math.abs(d - w.r) < 0.6 && hero.lift < 0.5) { w.hit = true; hero.hurt(1, w.x); }
    if (w.r >= 7.5) { b.wave = null; ring.visible = false; }
  }

  function enrage() {
    b.phase = 2;
    fx.flash('#ff4d5e', 0.35);
    fx.shake(0.5);
    game.banner('👑 BIG CHAKY — ¡FURIOSO!', 'Embiste dos veces seguidas. Saltá la onda del pisotón.');
    ctx.audio?.sfx('roar');
  }

  function die() {
    b.dead = true;
    lane.visible = false;
    game.score.addKill('boss');
    fx.popup(b.pos.clone().setY(4.5), '+2000', '#7ee0c3', { size: 34, life: 1.4 });
    fx.hitstop(0.25);
    fx.shake(0.7);
    fx.flash('#fff2c4', 0.6);
    ctx.audio?.sfx('ko');
    bar.classList.add('hidden');
    game.onBossDown();
  }

  return b;
}
