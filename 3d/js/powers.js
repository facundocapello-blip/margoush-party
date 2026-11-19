import { itemMat } from './items.js';
// Poderes (se lanzan con la barra llena, manteniendo apretado el golpe). No hay que apuntar: actúan alrededor del héroe.
//  Douge  «¡VERDADES A LOS GRITOS!»: trompazo al piso, onda en círculo que voltea a todos y les grita verdades.
//  Marine «¡HIEDRA!»: brotan enredaderas que atrapan y aturden; quedan hojas que pinchan en el piso y sale una flor que cura 1 corazón.
//  (Internamente sigue llamándose «flambe»: las reglas de juego no cambiaron, solo el dibujo.)
export const POWERS = {
  wave: { radius: 4.4, depth: 2.6, dmg: 2, knock: 10, strength: 1.6, grow: 0.35 },
  flambe: { radius: 3.4, depth: 2.2, dmg: 1, stun: 1.6, heal: 1 },
  fire: { life: 3.5, radius: 2.2, depth: 1.6, tick: 0.7, dmg: 1 }
};
// Verdades bien evidentes que les grita Douge a los que vuela
export const TRUTHS = ['¡ESTÁS PELADO!', '¡ESO NO ES UN ASADO!', '¡TU EQUIPO SE VA A LA B!', '¡TENÉS OLOR A PATA!', '¡NO SABÉS PEGAR!', '¡TU VIEJA TE VISTE!', '¡CORRÉS COMO PATO!'];

function emojiTex(emoji) {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d');
  g.font = '100px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(emoji, 64, 72);
  const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding;
  return t;
}

export function createPowers(ctx) {
  const { scene, game, fx } = ctx;
  const waves = [], spins = [], fires = [], treats = [];
  const made = { wave: 0, flambe: 0 };
  const mat = (emoji) => new THREE.SpriteMaterial({ map: emojiTex(emoji), transparent: true, depthWrite: false });
  const panMat = itemMat(ctx.assets, 'hiedra', '🌿'), flameMat = mat('🍃'), croissantMat = itemMat(ctx.assets, 'flor', '🌺');
  const ringGeo = new THREE.RingGeometry(0.82, 1, 48);
  const fireDisc = new THREE.CircleGeometry(1, 32);

  function sprite(m, size, x, y, z) {
    const s = new THREE.Sprite(m.clone());
    s.scale.set(size, size, 1); s.position.set(x, y, z);
    scene.add(s);
    return s;
  }
  function flatRing(color, x, z) {
    const m = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.85, depthWrite: false, side: THREE.DoubleSide }));
    m.rotation.x = -Math.PI / 2; m.position.set(x, 0.06, z);
    scene.add(m);
    return m;
  }
  function drop(list, i) {
    const o = list[i];
    for (const m of o.meshes) { scene.remove(m); m.material.dispose(); }
    list.splice(i, 1);
  }
  // Todo lo que esté dentro de la elipse alrededor (x, z)
  function inside(px, pz, x, z, rx, rz) { const a = (px - x) / rx, b = (pz - z) / rz; return a * a + b * b <= 1; }
  function hitAround(x, z, rx, rz, dmg, knock, strength, onHit) {
    let n = 0;
    for (const e of game.enemies.list) {
      if (e.hp <= 0 || !inside(e.pos.x, e.pos.z, x, z, rx, rz)) continue;
      game.enemies.hitEnemy(e, Math.sign(e.pos.x - x) || 1, dmg, knock, strength);
      onHit?.(e);
      n++;
    }
    n += game.props.hitArea({ x: x - rx, z, facing: 1, reach: rx * 2, depth: rz });
    return n;
  }

  return {
    waves, fires, made,

    truthWave(x, z) {
      made.wave++;
      const P = POWERS.wave;
      const ring = flatRing(0xffd36e, x, z), ring2 = flatRing(0xffffff, x, z);
      waves.push({ x, z, t: 0, meshes: [ring, ring2], ring, ring2 });
      let k = 0;
      hitAround(x, z, P.radius, P.depth, P.dmg, P.knock, P.strength, (e) => {
        const line = TRUTHS[(made.wave * 3 + k++) % TRUTHS.length];
        fx.popup(e.pos.clone().setY(2.7 + ((k - 1) % 3) * 0.65), line, '#ffd36e', { size: 19, life: 1.6, rise: 0.35 });
      });
      fx.hit(new THREE.Vector3(x, 0.4, z), 2);
      ctx.audio?.sfx('slam');
    },

    flambe(x, z, hero) {
      made.flambe++;
      const P = POWERS.flambe, F = POWERS.fire;
      // la sartén gira alrededor de Marine
      const pan = sprite(panMat, 1.4, x + 1.4, 1.3, z);
      spins.push({ x, z, t: 0, meshes: [pan], pan });
      // aturde y quema a los de alrededor
      game.enemies.stunAround(x, z, P.radius, P.stun, 0);
      hitAround(x, z, P.radius, P.depth, P.dmg, 3, 1.2);
      // fuego en el piso (no lastima a Marine)
      const disc = new THREE.Mesh(fireDisc, new THREE.MeshBasicMaterial({ color: 0xff6a1a, transparent: true, opacity: 0.4, depthWrite: false }));
      disc.rotation.x = -Math.PI / 2; disc.scale.set(F.radius, F.depth, 1); disc.position.set(x, 0.04, z); scene.add(disc);
      const flames = [], meshes = [disc];
      for (let k = 0; k < 8; k++) {
        const a = (k / 8) * Math.PI * 2;
        const fl = sprite(flameMat, 1.1, x + Math.cos(a) * F.radius * 0.8, 0.6, z + Math.sin(a) * F.depth * 0.8);
        flames.push(fl); meshes.push(fl);
      }
      fires.push({ x, z, t: F.life, tick: F.tick, meshes, flames, disc });
      // el croissant salta del fuego y le cae en la mano: +1 corazón
      const c = sprite(croissantMat, 1.1, x, 1.2, z);
      treats.push({ t: 0, x, z, hero, meshes: [c], c, healed: false });
      fx.hit(new THREE.Vector3(x, 0.8, z), 1.6);
      ctx.audio?.sfx('fire');
    },

    update(dt) {
      for (let i = waves.length - 1; i >= 0; i--) {
        const w = waves[i], P = POWERS.wave;
        w.t += dt;
        const k = Math.min(1, w.t / P.grow);
        const ease = 1 - Math.pow(1 - k, 3);
        w.ring.scale.set(P.radius * ease, P.depth * ease, 1);
        w.ring2.scale.set(P.radius * ease * 0.8, P.depth * ease * 0.8, 1);
        w.ring.material.opacity = 0.85 * (1 - k);
        w.ring2.material.opacity = 0.6 * (1 - k);
        if (k >= 1) drop(waves, i);
      }
      for (let i = spins.length - 1; i >= 0; i--) {
        const s = spins[i];
        s.t += dt;
        const a = s.t * 18;
        s.pan.position.set(s.x + Math.cos(a) * 1.5, 1.3, s.z + Math.sin(a) * 0.9);
        s.pan.material.rotation = a;
        if (s.t > 0.55) drop(spins, i);
      }
      for (let i = treats.length - 1; i >= 0; i--) {
        const c = treats[i];
        c.t += dt;
        const hp = c.hero.actor.position;
        const k = Math.min(1, c.t / 0.9);
        c.c.position.set(c.x + (hp.x - c.x) * k, 1.2 + Math.sin(k * Math.PI) * 2.2 + k * 0.6, c.z + (hp.z - c.z) * k);
        c.c.material.rotation = c.t * 6;
        if (k >= 1 && !c.healed) {
          c.healed = true;
          const before = c.hero.hp;
          c.hero.hp = Math.min(c.hero.hpMax, c.hero.hp + POWERS.flambe.heal);
          fx.popup(hp.clone().setY(3), c.hero.hp > before ? '🌺 +1 ❤️' : '🌺 ¡QUÉ LINDA!', '#ffb3d9', { size: 24, life: 1 });
          ctx.audio?.sfx('pickup');
          drop(treats, i);
        }
      }
      for (let i = fires.length - 1; i >= 0; i--) {
        const f = fires[i], F = POWERS.fire;
        f.t -= dt; f.tick -= dt;
        f.flames.forEach((fl, k) => { const w = 1 + Math.sin(f.t * 12 + k * 1.7) * 0.18; fl.scale.set(1.1 * w, 1.1 * w * 1.15, 1); fl.position.y = 0.6 + Math.sin(f.t * 9 + k) * 0.08; });
        f.disc.material.opacity = Math.min(0.4, f.t / 1.0 * 0.4);
        if (f.tick <= 0) {
          f.tick = F.tick;
          for (const e of game.enemies.list) {
            if (e.hp > 0 && inside(e.pos.x, e.pos.z, f.x, f.z, F.radius, F.depth)) game.enemies.hitEnemy(e, Math.sign(e.pos.x - f.x) || 1, F.dmg, 1.5, 1);
          }
        }
        if (f.t <= 0) drop(fires, i);
      }
    },
    clear() {
      for (const list of [waves, spins, fires, treats]) while (list.length) drop(list, list.length - 1);
    }
  };
}
