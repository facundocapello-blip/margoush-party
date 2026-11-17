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
// Poder: se carga pegando (no con un reloj). Se lanza manteniendo apretado el golpe o con L/E.
export const POWER = { start: 1, hit: 0.07, finisher: 0.12, kill: 0.08, dodge: 0.15, hold: 0.45 };
// Puntería automática: al pegar, se da vuelta hacia el malo más cercano
export const AIM = { reach: 2.8, depth: 1.3, snapZ: 0.45 };

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
    dodgeDir: 1, power: POWER.start, holdT: 0, holdUsed: false, dodgeCd: 0,
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

    // Suma a la barra de poder (pegar, rematar, voltear, esquivar justo)
    charge(k) {
      const was = h.power >= 1;
      h.power = Math.min(1, h.power + k);
      if (!was && h.power >= 1) {
        fx.popup(actor.position.clone().setY(3.1), '⚡ ¡PODER LISTO!', '#ffd36e', { size: 22, life: 1.1, rise: 0.4 });
        ctx.audio?.sfx('pickup');
      }
    },
    get powerReady() { return h.power >= 1; },

    hurt(amount, fromX) {
      // Esquive justo: el golpe te pasa por al lado y suma poder
      if (h.state === 'dodge' && game.state === 'playing' && !h.dodgeRewarded) {
        h.dodgeRewarded = true;
        h.charge(POWER.dodge);
        fx.popup(actor.position.clone().setY(2.8), '¡JUSTO!', '#9ad7ff', { size: 22, life: 0.7 });
      }
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

      if (input.consume('attack')) { h.buffer = 0.2; h.holdT = 0; h.holdUsed = false; }
      // Mantener apretado el golpe con la barra llena = poder
      if (input.pressed('attack')) {
        h.holdT += dt;
        if (!h.holdUsed && h.power >= 1 && h.holdT >= POWER.hold) { h.holdUsed = true; h.buffer = 0; usePower(); }
      } else h.holdT = 0;
      if (input.consume('jump') && h.lift === 0 && h.state !== 'dodge') { h.vy = 8.5; h.lift = 0.001; ctx.audio?.sfx('jump'); }
      h.dodgeCd = Math.max(0, h.dodgeCd - dt);
      if (input.consume('dodge') && h.state !== 'dodge' && h.dodgeCd <= 0) {
        h.state = 'dodge'; h.t = 0.24; h.inv = Math.max(h.inv, 0.35); h.dodgeCd = 0.7; h.dodgeRewarded = false;
        h.dodgeDir = Math.abs(input.moveX) > 0.2 ? Math.sign(input.moveX) : actor.facing;
        fx.dust(p);
        ctx.audio?.sfx('dodge');
      }
      if (input.consume('power')) {
        if (h.power >= 1) usePower();
        else fx.popup(actor.position.clone().setY(3), 'Cargá el poder pegando 👊', '#d9cff5', { size: 16, life: 0.9, rise: 0.2 });
      }

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
      h.hp = h.hpMax; h.inv = 0; h.state = 'free'; h.combo = 0; h.buffer = 0; h.lift = 0; h.vy = 0; h.knock = 0; h.knockZ = 0; h.power = POWER.start; h.holdT = 0; h.slowT = 0; h.stunT = 0; h.slideT = 0;
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
    autoAim();
    // pequeño avance para que el golpe tenga peso
    const x0 = actor.position.x;
    actor.position.x += actor.facing * (h.combo === 2 ? 0.45 : 0.25);
    world.clampPosition(actor.position, 0.4, x0);
    ctx.audio?.sfx(h.combo === 2 ? 'hitHeavy' : 'swing');
  }

  // Se da vuelta hacia el malo más cercano (y se acomoda un poco de carril) para no pegarle al aire
  function autoAim() {
    const p = actor.position;
    let best = null, bd = Infinity;
    const cands = game.enemies.list.filter(e => e.hp > 0 && e.state !== 'dead').map(e => e.pos);
    if (game.boss && !game.boss.dead) cands.push(game.boss.pos);
    for (const q of cands) {
      const dx = Math.abs(q.x - p.x), dz = Math.abs(q.z - p.z);
      if (dx > AIM.reach || dz > AIM.depth) continue;
      const d = dx + dz * 1.5;
      if (d < bd) { bd = d; best = q; }
    }
    if (!best) return;
    if (Math.abs(best.x - p.x) > 0.15) actor.setFacing(Math.sign(best.x - p.x));
    const dz = best.z - p.z;
    p.z += Math.sign(dz) * Math.min(Math.abs(dz), AIM.snapZ);
  }

  function landSwing() {
    const s = h.swing;
    const area = { x: actor.position.x, z: actor.position.z, facing: actor.facing, reach: s.reach, depth: 0.75, dmg: s.dmg, knock: s.knock, strength: s.strength, airborne: h.lift > 0.5 };
    fx.slash(new THREE.Vector3(actor.position.x, 1.25, actor.position.z), actor.facing, ['short', 'long', 'finisher'][h.combo]);
    const alive0 = game.enemies.alive();
    const foes = game.enemies.hitArea(area) + (game.boss ? game.boss.hitArea(area) : 0);
    const hits = foes + game.props.hitArea(area);
    if (foes > 0) {
      h.charge(s.strength > 1.2 ? POWER.finisher : POWER.hit);
      const ko = Math.max(0, alive0 - game.enemies.alive());
      if (ko) h.charge(POWER.kill * ko);
      fx.hitstop(s.strength > 1.2 ? 0.08 : 0.03);
    }
    if (hits > 0 && s.strength > 1.2) fx.shake(0.28);
  }

  // Douge: «¡VERDADES A LOS GRITOS!» — onda en círculo que voltea a todos alrededor.
  // Marine: «¡FLAMBÉ!» — giro con la sartén en llamas que quema y aturde, y un croissant que cura 1 corazón.
  function usePower() {
    h.power = 0; h.holdT = 0;
    const p = actor.position;
    h.state = 'free'; h.swing = null;
    h.inv = Math.max(h.inv, 0.6);
    if (id === 'douge') {
      game.powers.truthWave(p.x, p.z);
      fx.popup(p.clone().setY(4.6), '¡VERDADES A LOS GRITOS!', '#ffd36e', { size: 24, life: 1.1 });
      fx.shake(0.5); fx.hitstop(0.12);
    } else {
      game.powers.flambe(p.x, p.z, h);
      fx.popup(p.clone().setY(4.4), '¡FLAMBÉ! OH LÀ LÀ !', '#ff9fd0', { size: 24, life: 1.1 });
      fx.shake(0.35); fx.hitstop(0.1);
      ctx.audio?.say('Oh là là !', 'fr-FR');
    }
    ctx.audio?.sfx('power');
  }

  return h;
}
