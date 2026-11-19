// Margot (la bebé de Douge y Marine) está presente todo el juego:
// - cross(): BIG CHAKY cruzando al fondo con el cochecito. YA NO SE USA (19/11 Facu pidió sacarlo);
//   ahora se la ve llorando en la luneta del BYD de Cepi durante la persecución (byd_margot.js).
// - Su carita en el HUD: tranquila, contenta si venís bien, llorando si te pegan o si la ve pasar.
export const SIGHT = { z: -4.2, heightM: 3.0, speed: 6.5, from: -11, to: 17, shout: 1.0, laugh: 2.3, cry: 3.2 };
export const MARGOT_LINES = { douge: '¡Papááá!', marine: 'Mamaaan !', chaky: '¡Jua, jua, jua!' };
export const FACES = { calm: 0, happy: 1, cry: 2 };

// Qué cara pone Margot (pura, para poder probarla)
export function margotMood({ hurt = false, hp = 5, mult = 1, seen = false, cheer = false } = {}) {
  if (hurt || seen || hp <= 1) return 'cry';
  if (cheer || mult >= 1.5) return 'happy';
  return 'calm';
}

// SpriteActor llega de afuera (main.js) para que la lógica de arriba se pueda probar sin Three.js
export function createMargot(ctx, SpriteActor) {
  const { scene, assets, game, fx } = ctx;
  let s = null;        // cruce en curso
  let seenT = 0;       // segundos que le quedan llorando por haberla visto pasar
  let cheerT = 0;      // segundos contenta (despejaste un tramo)

  function remove() { s?.actor.dispose(); s = null; }

  function say(text, color, y) {
    fx.popup(s.actor.position.clone().setY(y), text, color, { size: 22, life: 1.4, rise: 0.25 });
  }

  return {
    // BIG CHAKY cruza al fondo con Margot (una vez por tramo despejado)
    cross() {
      if (s || !assets.has?.('kidnap_sheet')) return;
      const hx = game.hero.actor.position.x;
      const actor = new SpriteActor(scene, assets, { poses: { push: { tex: 'kidnap_sheet', cell: 2 } }, heightM: SIGHT.heightM });
      actor.position.set(hx + SIGHT.from, 0, SIGHT.z);
      actor.setFacing(1);
      actor.update(0, 0);
      s = { actor, t: 0, start: hx, shouted: false, laughed: false };
    },
    cheer(seconds = 2.5) { cheerT = Math.max(cheerT, seconds); },
    update(dt) {
      seenT = Math.max(0, seenT - dt);
      cheerT = Math.max(0, cheerT - dt);
      if (!s) return;
      s.t += dt;
      const a = s.actor;
      a.position.x += SIGHT.speed * dt;
      a.lift = Math.abs(Math.sin(s.t * 13)) * 0.08;
      if (!s.shouted && s.t > SIGHT.shout) {
        s.shouted = true; seenT = SIGHT.cry;
        say(MARGOT_LINES[game.heroId] || MARGOT_LINES.douge, '#ffb3d9', SIGHT.heightM * 0.75);
        ctx.audio?.sfx?.('pickup');
      }
      if (!s.laughed && s.t > SIGHT.laugh) { s.laughed = true; say(MARGOT_LINES.chaky, '#ff9b6b', SIGHT.heightM + 0.5); }
      a.update(dt, 0);
      if (a.position.x > s.start + SIGHT.to) remove();
    },
    mood(h) {
      return margotMood({ hurt: h.inv > 0, hp: h.hp, mult: game.score.multiplier, seen: seenT > 0, cheer: cheerT > 0 });
    },
    get crossing() { return !!s; },
    clear() { remove(); seenT = 0; cheerT = 0; },
    dispose() { remove(); }
  };
}
