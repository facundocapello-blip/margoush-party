import { SpriteActor } from './sprites.js';
import { sheetPoses } from './cast.js';
import { WAVES } from './level.js';

// Pinky, el hincha de Boca: una vez por nivel, cuando la zona queda despejada, viene corriendo
// a ayudarte… escucha un gol por la radio, festeja y se va a la cancha. Nunca ayuda.
export const PINKY = { calm: 1.5, run: 7, leave: 9, keep: 2.5, wait: 0.8, party: 1.0, heightM: 2.25 };
export const PINKY_LINES = { hello: '¡Aguantá que te ayudo!', goal: '📻 ¡GOOOL DE BOCA!', bye: '¡Me voy a la cancha!' };

export function createCameos(ctx) {
  const { scene, assets, game, fx } = ctx;
  const pinky = { shown: { 1: false, 2: false }, actor: null };
  let p = null;   // estado de la aparición en curso
  let calm = 0;   // segundos seguidos con la zona despejada

  function ready() {
    const lvl = game.level;
    if (pinky.shown[lvl] || game.boss || game.story?.inIntro) return false;
    if (game.enemies.alive() > 0) return false;
    const mine = WAVES.filter(w => w.level === lvl);
    if (mine.some(w => game.waves[w.id] === 'active')) return false;
    return mine.some(w => game.waves[w.id] === 'cleared');
  }

  function enter() {
    const hx = game.hero.actor.position.x;
    const actor = new SpriteActor(scene, assets, { poses: sheetPoses(assets, 'pinky', 'courier_pinky'), heightM: PINKY.heightM });
    actor.position.set(hx - 12, 0, game.hero.actor.position.z + 0.6);
    actor.setFacing(1);
    actor.update(0, 0);
    pinky.actor = actor;
    pinky.shown[game.level] = true;
    p = { phase: 'come', t: 0, walk: 0 };
    game.banner('🔵🟡 PINKY', PINKY_LINES.hello, 2.6);
  }

  function say(text, color = '#ffe08a') {
    fx.popup(pinky.actor.position.clone().setY(PINKY.heightM + 0.7), text, color, { size: 22, life: 1.3, rise: 0.3 });
  }

  function goal() { p.phase = 'party'; p.t = 0; say(PINKY_LINES.goal, '#ffd34d'); ctx.audio?.sfx('goal'); }

  function remove() {
    pinky.actor?.dispose();
    pinky.actor = null;
    p = null;
  }

  function update(dt) {
    if (!pinky.actor) {
      calm = ready() ? calm + dt : 0;
      if (calm >= PINKY.calm) { calm = 0; enter(); }
      return;
    }
    const a = pinky.actor, hp = game.hero.actor.position;
    p.t += dt;
    let moving = false;
    if (p.phase === 'come') {
      const target = hp.x - PINKY.keep;
      const dx = target - a.position.x;
      const step = Math.min(Math.abs(dx), PINKY.run * dt) * Math.sign(dx);
      a.position.x += step;
      a.position.z += (hp.z + 0.6 - a.position.z) * Math.min(1, dt * 3);
      a.setFacing(1);
      moving = Math.abs(dx) > 0.05;
      if (Math.abs(dx) < 0.3 || p.t > 6) { p.phase = 'wait'; p.t = 0; }
    } else if (p.phase === 'wait') {
      if (p.t >= PINKY.wait) goal();
    } else if (p.phase === 'party') {
      a.lift = Math.abs(Math.sin(p.t * 9)) * 0.45;
      a.setPose(Math.floor(p.t * 6) % 2 ? 'strike' : 'idle');
      if (p.t >= (p.short ? 0.6 : PINKY.party)) { p.phase = 'leave'; p.t = 0; a.lift = 0; a.setFacing(-1); say(PINKY_LINES.bye); }
    } else if (p.phase === 'leave') {
      a.position.x -= PINKY.leave * dt;
      moving = true;
      if (hp.x - a.position.x > 16 || p.t > 4) { remove(); return; }
    }
    if (moving) {
      p.walk += dt;
      a.setPose(Math.floor(p.walk * 6) % 2 ? 'step' : 'idle');
      a.lift = Math.abs(Math.sin(p.walk * 12)) * 0.08;
    } else if (p.phase === 'wait') { a.setPose('idle'); a.lift = 0; }
    a.update(dt, 0);
  }

  return {
    pinky,
    update,
    get phase() { return p?.phase || null; },
    // Mientras Pinky actúa no entra la oleada siguiente (que el chiste no se pise con la pelea)
    get busy() { return !!p && p.phase !== 'leave'; },
    // Llegaste a la oleada siguiente: Pinky escucha el gol ya y se va enseguida (la oleada espera menos de un segundo)
    hurry() {
      if (!p || p.phase === 'leave') return;
      p.short = true;
      if (p.phase !== 'party') goal();
    },
    clear() { remove(); calm = 0; pinky.shown = { 1: false, 2: false }; },
    // Al cambiar de nivel: corta una aparición a medias (no se repite en el nivel que terminó)
    onLevelStart() { remove(); calm = 0; },
    dispose() { remove(); }
  };
}
