import { SpriteActor } from './sprites.js';

export const FACU_LINES = {
  intro: 'Buenas noches, Le Concept. Esta noche, BIG CHAKY se llevó a Margot. ¡Aplausos para nuestro héroe!',
  result: '¡Señoras y señores, puntaje final!',
  jokes: ['¡JAJAJA!', '¡No da más!', '¡Qué chiste, che!']
};
const JOKE_EVERY = 12;
const HIT_EVERY = 1.0;

export function createFacu(ctx) {
  const { scene, assets, world, fx, game } = ctx;
  const actor = new SpriteActor(scene, assets, { poses: { idle: { tex: 'facu' } }, heightM: game.hero.actor.heightM * 0.6, shadow: 0.7 });
  const labels = document.querySelector('#labels');
  const tag = document.createElement('div');
  tag.className = 'tag-name';
  tag.textContent = 'FACU';
  const bubble = document.createElement('div');
  bubble.className = 'speech hidden';
  labels.append(tag, bubble);
  let bubbleT = 0;
  let hitCd = 0.8;
  let jokeIdx = 0;
  let walkT = 0;
  let swing = 0;

  function place() {
    const h = game.hero.actor.position;
    actor.position.set(h.x - game.hero.actor.facing * 1.4, 0, Math.min(world.bounds.maxZ, h.z + 0.9));
  }
  place();

  const project = (el, y) => {
    const v = actor.position.clone();
    v.y += y;
    v.project(ctx.camera);
    const vis = v.z < 1 && (game.state === 'playing' || game.state === 'rescue');
    el.style.display = vis ? '' : 'none';
    el.style.left = ((v.x + 1) / 2) * innerWidth + 'px';
    el.style.top = ((1 - v.y) / 2) * innerHeight + 'px';
  };

  const f = {
    actor,
    lines: FACU_LINES,
    jokeCd: 6,
    lastJokeStuns: 0,

    say(text, seconds = 2.5) {
      bubble.textContent = text;
      bubble.classList.remove('hidden');
      bubbleT = seconds;
    },

    update(dt) {
      const hero = game.hero.actor;
      const h = hero.position;
      const p = actor.position;
      hitCd = Math.max(0, hitCd - dt);
      f.jokeCd = Math.max(0, f.jokeCd - dt);
      swing = Math.max(0, swing - dt);

      if (Math.hypot(h.x - p.x, h.z - p.z) > 12) { place(); fx.dust(p); }

      // Objetivo: el enemigo vivo más cercano a Facu, si está cerca del héroe
      let target = null, best = 2.6;
      for (const e of game.enemies.list) {
        if (e.hp <= 0) continue;
        const d = Math.hypot(e.pos.x - p.x, e.pos.z - p.z);
        if (d < best && Math.abs(e.pos.x - h.x) < 6) { best = d; target = e; }
      }

      let gx, gz, stop;
      if (target) { gx = target.pos.x - Math.sign(target.pos.x - p.x || 1) * 1.0; gz = target.pos.z; stop = 0.15; }
      else { gx = h.x - hero.facing * 1.4; gz = Math.min(world.bounds.maxZ, h.z + 0.9); stop = 0.35; }
      const dx = gx - p.x, dz = gz - p.z, d = Math.hypot(dx, dz);
      let moving = false;
      if (d > stop) {
        const speed = d > 3 ? 11 : 7.5;
        const step = Math.min(d - stop * 0.5, speed * dt);
        p.x += (dx / d) * step;
        p.z += (dz / d) * step;
        moving = step > 0.01;
        if (Math.abs(dx) > 0.05) actor.setFacing(Math.sign(dx));
      }
      world.clampPosition(p, 0.2);

      if (target) {
        actor.setFacing(Math.sign(target.pos.x - p.x) || 1);
        if (hitCd <= 0 && Math.abs(target.pos.x - p.x) < 1.5 && Math.abs(target.pos.z - p.z) < 0.7) {
          hitCd = HIT_EVERY;
          swing = 0.2;
          game.enemies.hitArea({ x: p.x, z: p.z, facing: actor.facing, reach: 1.5, depth: 0.7, dmg: 1, knock: 2, strength: 0.8 });
        }
      }

      // Chiste: aturde a los que estén cerca
      if (f.jokeCd <= 0) {
        const near = game.enemies.list.filter(e => e.hp > 0 && Math.hypot(e.pos.x - p.x, e.pos.z - p.z) < 4).length;
        if (near >= 2) {
          f.jokeCd = JOKE_EVERY;
          f.lastJokeStuns = game.enemies.stunAround(p.x, p.z, 4, 1.5);
          const line = FACU_LINES.jokes[jokeIdx++ % FACU_LINES.jokes.length];
          f.say('🎤 ' + line, 1.6);
          fx.popup(p.clone().setY(2.6), line, '#ffe08a', { size: 26, life: 1.1 });
          ctx.audio?.sfx('laugh');
        }
      }

      // Animación: saltitos al caminar, inclinación al pegar
      walkT += dt * (moving ? 14 : 3);
      actor.lift = moving ? Math.abs(Math.sin(walkT)) * 0.12 : 0;
      actor.mesh.rotation.z = swing > 0 ? -actor.facing * Math.sin((swing / 0.2) * Math.PI) * 0.35 : (moving ? Math.sin(walkT) * 0.05 : 0);
      actor.update(dt, 0);

      if (bubbleT > 0) { bubbleT -= dt; if (bubbleT <= 0) bubble.classList.add('hidden'); }
      project(tag, actor.heightM + 0.35);
      project(bubble, actor.heightM + 0.75);
    },

    // Para escenas: mantiene las etiquetas en su lugar sin mover a Facu
    refreshLabels() { project(tag, actor.heightM + 0.35); project(bubble, actor.heightM + 0.75); },

    dispose() {
      actor.dispose();
      tag.remove();
      bubble.remove();
    }
  };
  return f;
}
