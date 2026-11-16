import { SpriteActor } from './sprites.js';

// Las alturas de correr y pegar salen del manifiesto (misma cabeza en todas las poses)
export const HERO_CFG = {
  douge: { name: 'DOUGE', heightM: 2.3, speed: 6.6, scaleRef: 'douge_idle', poses: {
    idle: { tex: 'douge_idle' }, run: { tex: 'douge_run' }, attack: { tex: 'douge_attack' } } },
  marine: { name: 'MARINE', heightM: 2.2, speed: 7.2, scaleRef: 'marine_idle', poses: {
    idle: { tex: 'marine_idle' }, run: { tex: 'marine_run' }, attack: { tex: 'marine_attack' } } }
};

// Combo de 3: el tercero es el remate
const SWINGS = [
  { dur: 0.26, hitAt: 0.09, reach: 1.9, dmg: 1, knock: 2.5, strength: 1 },
  { dur: 0.26, hitAt: 0.09, reach: 1.9, dmg: 1, knock: 2.5, strength: 1 },
  { dur: 0.4, hitAt: 0.14, reach: 2.3, dmg: 2, knock: 8, strength: 1.6 }
];
const INVULN = 0.7;
const POWER_CD = 7;

export function createHero(id, ctx) {
  const cfg = HERO_CFG[id];
  const { input, world, fx, game } = ctx;
  const actor = new SpriteActor(ctx.scene, ctx.assets, { poses: cfg.poses, heightM: cfg.heightM, scaleRef: cfg.scaleRef });

  const h = {
    id, actor, hp: 5, hpMax: 5, speed: cfg.speed,
    inv: 0, damageLog: [],
    state: 'free', t: 0,
    combo: 0, comboWindow: 0, buffer: 0, swing: null, swingHit: false,
    lift: 0, vy: 0,
    dodgeDir: 1, powerCd: 0, dodgeCd: 0,
    knock: 0, knockZ: 0,
    slowT: 0, slowF: 1, stunT: 0,
    slideT: 0, slideDir: 1, slideSpeed: 5,

    // Trampas y malos: andar lento (baldosa), quedar aturdido (bombo), ser empujado (grève)
    slow(seconds, factor = 0.5) { h.slowT = Math.max(h.slowT, seconds); h.slowF = factor; },
    stun(seconds) {
      if (h.state === 'dodge') return false;
      h.stunT = Math.max(h.stunT, seconds);
      h.state = 'free'; h.buffer = 0; h.swing = null;
      fx.popup(actor.position.clone().setY(2.9), '💫', '#fff', { size: 30, life: seconds, rise: 0.1 });
      return true;
    },
    // Patinar sobre la manteca: avanza solo, no se puede caminar; sí pegar y saltar. No da invulnerabilidad.
    slide(dirX, seconds, speed = 5) {
      h.slideT = seconds; h.slideDir = dirX >= 0 ? 1 : -1; h.slideSpeed = speed;
      fx.popup(actor.position.clone().setY(2.9), '¡RESBALÓN!', '#ffd23a', { size: 24, life: 0.8 });
      ctx.audio?.sfx('fall');
    },
    push(vx, vz) { h.knock += vx; h.knockZ += vz; },
    isDodging() { return h.state === 'dodge'; },

    hurt(amount, fromX) {
      if (h.inv > 0 || h.state === 'dodge' || game.state !== 'playing') return false;
      h.hp = Math.max(0, h.hp - amount);
      h.inv = INVULN;
      h.damageLog.push(Math.round(game.time * 1000) / 1000);
      h.knock = (actor.position.x >= fromX ? 1 : -1) * 6;
      h.state = 'free';
      actor.flash(INVULN);
      actor.hit();
      game.score.takeDamage();
      game.combo.reset();
      fx.flash('#ff4d5e', 0.3);
      fx.shake(0.25);
      ctx.audio?.sfx('hurt');
      if (h.hp <= 0) game.onHeroDown();
      return true;
    },

    update(dt) {
      h.inv = Math.max(0, h.inv - dt);
      h.powerCd = Math.max(0, h.powerCd - dt);
      h.comboWindow = Math.max(0, h.comboWindow - dt);
      h.buffer = Math.max(0, h.buffer - dt);
      const p = actor.position;
      h.slowT = Math.max(0, h.slowT - dt);
      h.slideT = Math.max(0, h.slideT - dt);
      if (h.stunT > 0) {
        // Aturdido: se tambalea en el lugar y no responde a los controles
        h.stunT = Math.max(0, h.stunT - dt);
        for (const k of ['attack', 'jump', 'dodge', 'power']) input.consume(k);
        h.knock *= Math.max(0, 1 - dt * 8); h.knockZ *= Math.max(0, 1 - dt * 8);
        const prevX = p.x;
        p.x += h.knock * dt; p.z += h.knockZ * dt;
        world.clampPosition(p, 0.4, prevX);
        actor.setPose('idle');
        actor.lean = Math.sin(performance.now() / 70) * 0.12;
        actor.update(dt, 0);
        return;
      }

      if (input.consume('attack')) h.buffer = 0.2;
      if (input.consume('jump') && h.lift === 0 && h.state !== 'dodge') { h.vy = 8.5; h.lift = 0.001; ctx.audio?.sfx('jump'); }
      h.dodgeCd = Math.max(0, h.dodgeCd - dt);
      if (input.consume('dodge') && h.state !== 'dodge' && h.dodgeCd <= 0) {
        h.state = 'dodge'; h.t = 0.24; h.inv = Math.max(h.inv, 0.35); h.dodgeCd = 0.7;
        h.dodgeDir = Math.abs(input.moveX) > 0.2 ? Math.sign(input.moveX) : actor.facing;
        fx.dust(p);
        ctx.audio?.sfx('dodge');
      }
      if (input.consume('power') && h.powerCd <= 0) usePower();

      // Golpes
      if (h.state === 'free' && h.buffer > 0) startSwing();
      if (h.state === 'attack') {
        h.t += dt;
        if (!h.swingHit && h.t >= h.swing.hitAt) { h.swingHit = true; landSwing(); }
        if (h.t >= h.swing.dur) { h.state = 'free'; h.comboWindow = 0.45; if (h.buffer > 0) startSwing(); }
      }

      // Movimiento
      let vx = 0, vz = 0;
      if (h.state === 'dodge') {
        h.t -= dt;
        vx = h.dodgeDir * 15;
        actor.setFacing(h.dodgeDir);
        if (h.t <= 0) h.state = 'free';
      } else if (h.slideT > 0) {
        vx = h.slideDir * h.slideSpeed;
      } else {
        const mx = input.moveX, mz = input.moveZ;
        const len = Math.max(1, Math.hypot(mx, mz));
        const slow = (h.state === 'attack' ? 0.25 : 1) * (h.slowT > 0 ? h.slowF : 1);
        vx = (mx / len) * h.speed * slow;
        vz = (mz / len) * h.speed * 0.7 * slow;
        if (h.state !== 'attack' && Math.abs(mx) > 0.15) actor.setFacing(Math.sign(mx));
      }
      h.knock *= Math.max(0, 1 - dt * 8);
      h.knockZ *= Math.max(0, 1 - dt * 8);
      const prevX = p.x;
      p.x += (vx + h.knock) * dt;
      p.z += (vz + h.knockZ) * dt;
      // Patinando no se cae al bache ni se mete en el fuego: frena en el borde
      if (h.slideT > 0 && h.state !== 'dodge') p.x = game.traps?.safeStop(prevX, p.x, p.z) ?? p.x;
      world.clampPosition(p, 0.4, prevX);

      // Salto
      if (h.lift > 0) {
        h.vy -= 26 * dt;
        h.lift = Math.max(0, h.lift + h.vy * dt);
        if (h.lift === 0) { h.vy = 0; fx.dust(p); }
      }
      const speed = Math.hypot(vx, vz);
      animate(dt, speed);
      actor.update(dt, speed);
    },

    reset() {
      h.hp = h.hpMax; h.inv = 0; h.state = 'free'; h.combo = 0; h.buffer = 0; h.lift = 0; h.vy = 0; h.knock = 0; h.knockZ = 0; h.powerCd = 0; h.slowT = 0; h.stunT = 0; h.slideT = 0;
      h.damageLog = [];
    }
  };

  // Animación con peso: anticipación y estirón al pegar, rebote al correr, respiración quieto
  let breathT = 0;
  function animate(dt, speed) {
    breathT += dt;
    let hop = 0;
    if (h.state === 'attack') {
      const s = h.swing;
      if (h.t < s.hitAt) {
        // anticipación: se echa para atrás con la pose de reposo
        const k = h.t / s.hitAt;
        actor.setPose('idle');
        actor.lean = 0.16 * k;
        actor.offsetX = -0.18 * k;
        actor.stretch = -0.05 * k;
      } else {
        const k = Math.min(1, (h.t - s.hitAt) / 0.08);
        const settle = Math.max(0, 1 - (h.t - s.hitAt) / (s.dur - s.hitAt));
        actor.setPose('attack');
        actor.lean = -0.1 * settle;
        actor.offsetX = (0.25 * k) * settle;
        actor.stretch = 0.06 * settle;
        // el remate sale con un saltito
        if (h.combo === 2) hop = Math.sin(Math.min(1, (h.t - s.hitAt) / (s.dur - s.hitAt)) * Math.PI) * 0.45;
      }
    } else if (h.state === 'dodge') {
      actor.setPose('run');
      actor.lean = -0.22; actor.offsetX = 0; actor.stretch = -0.06;
    } else if (h.slideT > 0 && h.lift === 0) {
      actor.setPose('run');
      actor.lean = 0.3; actor.offsetX = 0; actor.stretch = 0; // patina echado para atrás
    } else if (h.lift > 0) {
      actor.setPose('run');
      actor.lean = h.vy > 0 ? 0.05 : -0.08; actor.offsetX = 0; actor.stretch = h.vy > 0 ? 0.05 : -0.02;
    } else if (speed > 0.3) {
      actor.setPose('run');
      // rebote: dos pasos por ciclo de 6 cuadros
      const phase = (actor.dist / actor.poses.run.stride) / 3 * Math.PI;
      actor.lift = Math.abs(Math.sin(phase)) * 0.07;
      actor.lean = -0.06; actor.offsetX = 0; actor.stretch = 0;
    } else {
      actor.setPose('idle');
      actor.lean = 0; actor.offsetX = 0;
      actor.stretch = Math.sin(breathT * 2.4) * 0.012;
    }
    if (h.lift > 0) actor.lift = h.lift + hop;
    else if (speed <= 0.3 || h.state !== 'free') actor.lift = hop;
  }

  function startSwing() {
    h.buffer = 0;
    h.combo = h.comboWindow > 0 ? (h.combo + 1) % 3 : 0;
    h.swing = SWINGS[h.combo];
    h.state = 'attack';
    h.t = 0;
    h.swingHit = false;
    if (Math.abs(input.moveX) > 0.2) actor.setFacing(Math.sign(input.moveX));
    // pequeño avance para que el golpe tenga peso
    const x0 = actor.position.x;
    actor.position.x += actor.facing * (h.combo === 2 ? 0.45 : 0.25);
    world.clampPosition(actor.position, 0.4, x0);
    ctx.audio?.sfx(h.combo === 2 ? 'hitHeavy' : 'swing');
  }

  function landSwing() {
    const s = h.swing;
    const area = { x: actor.position.x, z: actor.position.z, facing: actor.facing, reach: s.reach, depth: 0.75, dmg: s.dmg, knock: s.knock, strength: s.strength, airborne: h.lift > 0.5 };
    fx.slash(new THREE.Vector3(actor.position.x, 1.25, actor.position.z), actor.facing, ['short', 'long', 'finisher'][h.combo]);
    const hits = game.enemies.hitArea(area) + (game.boss ? game.boss.hitArea(area) : 0) + game.props.hitArea(area);
    if (hits > 0 && s.strength > 1.2) { fx.hitstop(0.08); fx.shake(0.28); }
  }

  function usePower() {
    h.powerCd = POWER_CD;
    const p = actor.position;
    if (id === 'douge') {
      game.powers.launchFists(p.x, p.z, actor.facing);
      game.props.hitArea({ x: p.x, z: p.z, facing: actor.facing, reach: 3.8, depth: 1.1 });
      fx.popup(p.clone().setY(3.2).setX(p.x + actor.facing * 1.5), '¡VERDADES!', '#ffd36e', { size: 28, life: 1 });
      fx.shake(0.4); fx.hitstop(0.1);
      ctx.audio?.sfx('power');
    } else {
      game.powers.throwPan(p.x, p.z, actor.facing);
      const hit = 0;
      fx.popup(p.clone().setY(3.3), 'OH LÀ LÀ !', '#ff9fd0', { size: 28, life: 1 });
      fx.shake(0.25);
      ctx.audio?.sfx('power');
      ctx.audio?.say('Oh là là !', 'fr-FR');
      if (hit) fx.hitstop(0.06);
    }
  }

  return h;
}
