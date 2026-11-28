import { SpriteActor } from './sprites.js';
import { HITSTOP, anticipationK, followThrough } from './feedback.js';

// Las alturas de correr y pegar salen del manifiesto (misma cabeza en todas las poses)
export const HERO_CFG = {
  douge: { name: 'DOUGE', heightM: 2.3, speed: 6.6, scaleRef: 'douge_idle', poses: {
    idle: { tex: 'douge_idle' }, run: { tex: 'douge_run' }, attack: { tex: 'douge_attack' } } },
  marine: { name: 'MARINE', heightM: 2.2, speed: 7.2, scaleRef: 'marine_idle', poses: {
    idle: { tex: 'marine_idle' }, run: { tex: 'marine_run' }, attack: { tex: 'marine_attack' } } }
};

// Caminata: hasta `max` m/s (joystick a medias, o cuando camina solo) se usa la caminata en vez de correr.
// stride: metros por cuadro (10 cuadros = dos pasos de ~1,5 m)
export const WALK = { max: 3.9, stride: 0.3, auto: 3.4, h: 1.03 };

// Combo de 3: el tercero es el remate (la arena de BIG CHAKY usa los mismos tiempos)
export const SWINGS = [
  { dur: 0.26, hitAt: 0.09, reach: 1.9, dmg: 1, knock: 2.5, strength: 1 },
  { dur: 0.26, hitAt: 0.09, reach: 1.9, dmg: 1, knock: 2.5, strength: 1 },
  { dur: 0.4, hitAt: 0.14, reach: 2.3, dmg: 2, knock: 8, strength: 1.6 }
];
const INVULN = 0.7;
// Poder: se carga pegando (no con un reloj). Se lanza manteniendo apretado el golpe o con L/E.
export const POWER = { start: 1, hit: 0.07, finisher: 0.12, kill: 0.08, dodge: 0.15, hold: 0.45 };
// Puntería automática: al pegar, se da vuelta hacia el malo más cercano
export const AIM = { reach: 2.8, depth: 1.3, snapZ: 0.45 };

// Normalización exacta de altura visible entre hojas (idle, walk, run, combo y acciones)
// para que Douge y Marine mantengan siempre el mismo tamaño al correr, saltar o pegar.
const POSE_H = {
  douge: { idle: 0.96, walk: 0.98, run: 1.11, combo: 0.99, actions: 1.06 },
  marine: { idle: 0.96, walk: 0.99, run: 1.26, combo: 1.05, actions: 1.14 }
};

export function createHero(id, ctx) {
  const cfg = HERO_CFG[id];
  const ph = POSE_H[id] || POSE_H.douge;
  const { input, world, fx, game } = ctx;
  // Hojas nuevas de la guía AAA, si ya están: combo (3 golpes) y acciones (salto, esquive, golpeado, poder)
  const poses = {
    idle: { ...cfg.poses.idle, h: ph.idle },
    run: { ...cfg.poses.run, h: ph.run },
    attack: { ...cfg.poses.attack, h: ph.combo }
  };
  const A = ctx.assets;
  if (A.has?.(id + '_combo_sheet')) for (let i = 0; i < 3; i++) poses['attack' + (i + 1)] = { tex: id + '_combo_sheet', cell: i, h: ph.combo };
  if (A.has?.('rescate_sheet')) poses.carry = { tex: 'rescate_sheet', cell: id === 'douge' ? 0 : 1, h: ph.idle };
  if (A.has?.(id + '_actions_sheet')) ['jump', 'dodge', 'hurt', 'power'].forEach((n, i) => { poses[n] = { tex: id + '_actions_sheet', cell: i, h: ph.actions }; });
  // Caminata de 10 cuadros: se usa yendo despacio; rápido sigue la de correr (misma altura visual)
  if (A.has?.(id + '_walk_sheet')) poses.walk = { tex: id + '_walk_sheet', stride: WALK.stride, h: ph.walk };
  const actor = new SpriteActor(ctx.scene, ctx.assets, { poses, heightM: cfg.heightM, scaleRef: cfg.scaleRef });
  actor.snapHit = true;
  const has = (n) => !!actor.poses[n];

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
        // la primera vez se dice cómo se usa (mantener la piña); después alcanza con el aviso corto
        const first = !h.toldHold; h.toldHold = true;
        fx.popup(actor.position.clone().setY(3.1), first ? '⚡ ¡PODER LISTO! Mantené 👊' : '⚡ ¡PODER LISTO!', '#ffd36e', { size: 22, life: first ? 1.8 : 1.1, rise: 0.4 });
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
      actor.flash(INVULN, 0.3); // sin parpadeo mientras se ve la pose «hurt» (0,3 s)
      actor.hit();
      actor.vibrate(HITSTOP.hurt, 0.09);
      game.score.takeDamage();
      game.combo.reset();
      fx.flash('#ff4d5e', 0.3);
      fx.shake(0.25);
      if (performance.now() - lastStopAt > 350) fx.hitstop(HITSTOP.hurt);
      ctx.audio?.sfx('hurt');
      if (h.hp <= 0) {
        // última vida: congelado largo + flash blanco y sacudida grande (#003: «やられる瞬間にも止め＋フラッシュ»)
        fx.hitstop(HITSTOP.down); fx.flash('#ffffff', 0.4); fx.shake(0.5);
        game.onHeroDown();
      }
      return true;
    },

    update(dt) {
      h.inv = Math.max(0, h.inv - dt);
      h.comboWindow = Math.max(0, h.comboWindow - dt);
      h.powerT = Math.max(0, (h.powerT || 0) - dt);
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
      const prevX = p.x, prevZ = p.z;
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
      // Velocidad real de desplazamiento (evita que patine contra paredes o portones cerrados)
      const speed = dt > 0 && h.state === 'free' ? Math.hypot(p.x - prevX, p.z - prevZ) / dt : Math.hypot(vx, vz);
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
        const k = anticipationK(h.t, s.hitAt); // ya al 55 % en el 1.er cuadro
        actor.setPose('idle');
        actor.lean = 0.16 * k;
        actor.offsetX = -0.18 * k;
        actor.stretch = -0.05 * k;
      } else {
        // La pose del golpe queda congelada durante el hit-stop: tiene que estar ya en su punto máximo en el
        // cuadro del impacto (k = 1 de entrada, sin subir en 5 cuadros) y bajar después con el seguimiento.
        const settle = followThrough(h.t, s.hitAt, s.dur); // se sostiene ~40 % y recién baja
        const fin = h.combo === 2;
        actor.setPose(has('attack' + (h.combo + 1)) ? 'attack' + (h.combo + 1) : 'attack');
        actor.lean = (fin ? -0.2 : -0.14) * settle;
        actor.offsetX = (fin ? 0.4 : 0.3) * settle;
        actor.stretch = (fin ? 0.1 : 0.08) * settle;
        // el remate sale con un saltito
        if (h.combo === 2) hop = Math.sin(Math.min(1, (h.t - s.hitAt) / (s.dur - s.hitAt)) * Math.PI) * 0.45;
      }
    } else if (h.powerT > 0 && has('power')) {
      actor.setPose('power');
      actor.lean = 0; actor.offsetX = 0; actor.stretch = 0.04;
    } else if (h.inv > INVULN - 0.3 && has('hurt')) {
      actor.setPose('hurt');
      actor.lean = 0.12; actor.offsetX = 0; actor.stretch = 0;
    } else if (h.state === 'dodge') {
      actor.setPose(has('dodge') ? 'dodge' : 'run');
      actor.lean = -0.22; actor.offsetX = 0; actor.stretch = -0.06;
    } else if (h.slideT > 0 && h.lift === 0) {
      actor.setPose('run');
      actor.lean = 0.3; actor.offsetX = 0; actor.stretch = 0; // patina echado para atrás
    } else if (h.lift > 0) {
      actor.setPose(has('jump') ? 'jump' : 'run');
      actor.lean = h.vy > 0 ? 0.05 : -0.08; actor.offsetX = 0; actor.stretch = h.vy > 0 ? 0.05 : -0.02;
    } else if (speed > 0.3 && speed < WALK.max && has('walk')) {
      actor.setPose('walk');
      // un rebotecito por paso (cinco cuadros por paso)
      const phase = (actor.dist / WALK.stride) / 5 * Math.PI;
      actor.lift = Math.abs(Math.sin(phase)) * 0.03;
      actor.lean = 0; actor.offsetX = 0; actor.stretch = 0;
    } else if (speed > 0.3) {
      actor.setPose('run');
      // rebote: dos pasos por ciclo de cuadros
      const run = actor.poses.run;
      const phase = (actor.dist / run.stride) / (run.frames / 2) * Math.PI;
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

  let lastStopAt = -1e9;
  function landSwing() {
    const s = h.swing;
    const area = { x: actor.position.x, z: actor.position.z, facing: actor.facing, reach: s.reach, depth: 0.75, dmg: s.dmg, knock: s.knock, strength: s.strength, airborne: h.lift > 0.5 };
    fx.slash(new THREE.Vector3(actor.position.x, 1.25, actor.position.z), actor.facing, ['short', 'long', 'finisher'][h.combo]);
    const alive0 = game.enemies.alive();
    const foes = game.enemies.hitArea(area);
    const hits = foes + game.props.hitArea(area);
    if (foes > 0) {
      h.charge(s.strength > 1.2 ? POWER.finisher : POWER.hit);
      const ko = Math.max(0, alive0 - game.enemies.alive());
      if (ko) h.charge(POWER.kill * ko);
      // Hit-stop escalado (#047): base por golpe + 1F por malo extra (tope +2F) + 3F si hay KO; el último malo, 16F
      let f = HITSTOP.swing[h.combo] + Math.min(2, foes - 1) / 60;
      if (ko) f += HITSTOP.ko;
      if (ko && game.enemies.alive() === 0) { f = Math.max(f, HITSTOP.last); fx.flash('#ffffff', 0.38); }
      // Anti-encadenado: con varios malos el combo congelaba ~1/3 del tiempo y se sentía como lag
      const now = performance.now();
      if (!ko && now - lastStopAt < 350) f = Math.max(3 / 60, f * 0.6);
      lastStopAt = now;
      fx.hitstop(f);
    } else if (hits > 0) fx.hitstop(HITSTOP.prop);
    if (hits > 0 && s.strength > 1.2) fx.shake(0.28);
  }

  // Douge: «¡VERDADES A LOS GRITOS!» — onda en círculo que voltea a todos alrededor.
  // Marine «Hiedra»: «¡HIEDRA!» — brotan enredaderas que atrapan, aturden y pinchan, y una flor que cura 1 corazón.
  function usePower() {
    h.power = 0; h.holdT = 0; h.powerT = 0.6;
    const p = actor.position;
    h.state = 'free'; h.swing = null;
    h.inv = Math.max(h.inv, 0.6);
    if (id === 'douge') {
      game.powers.truthWave(p.x, p.z, actor.facing);
      fx.popup(p.clone().setY(4.6), '¡VERDADES A LOS GRITOS!', '#ffd36e', { size: 24, life: 1.1 });
      fx.shake(0.5); fx.hitstop(0.12);
      ctx.audio?.sfx('diushbag'); // el grito tipo «¡Hadouken!» acompaña la onda
    } else {
      game.powers.flambe(p.x, p.z, h, actor.facing);
      fx.popup(p.clone().setY(4.4), '¡HIEDRA! OH LÀ LÀ !', '#7ee0c3', { size: 24, life: 1.1 });
      fx.shake(0.35); fx.hitstop(0.1);
      ctx.audio?.say('Oh là là !', 'fr-FR', { female: true });
    }
    ctx.audio?.sfx('power');
  }

  return h;
}
