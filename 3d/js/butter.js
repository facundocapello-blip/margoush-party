import { itemMat } from './items.js';
// Manteca de Lale «Mantecoso»: la barra viaja con sombra creciente (aviso) y deja una mancha
// amarilla donde cae. Pisar la mancha hace patinar al héroe, sin dañarlo.
export const BUTTER = { life: 6, radius: 0.7, slide: 0.5, speed: 5, flight: 0.9 };

function emojiTex(emoji) {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d');
  g.font = '96px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(emoji, 64, 72);
  const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding;
  return t;
}

export function createButter(ctx) {
  const { scene, game, fx } = ctx;
  const list = [];
  const barMat = itemMat(ctx.assets, 'manteca', '🧈');
  const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.4, depthWrite: false });
  const puddleMat = new THREE.MeshBasicMaterial({ color: 0xffd23a, transparent: true, opacity: 0.8, depthWrite: false });
  const disc = new THREE.CircleGeometry(BUTTER.radius, 28);

  function flat(mat, x, z, y) {
    const m = new THREE.Mesh(disc, mat.clone());
    m.rotation.x = -Math.PI / 2; m.position.set(x, y, z);
    scene.add(m);
    return m;
  }

  function dispose(b) {
    scene.remove(b.bar, b.shadow, b.puddle);
    b.shadow.material.dispose(); b.puddle.material.dispose(); b.bar.material.dispose();
  }

  return {
    list,
    // Tira una barra desde `from` (opcional, si no cae del cielo) hacia (x, z)
    drop(x, z, from = null) {
      const b = { x, z, t: 0, phase: 'flight', used: false, from: from ? from.clone() : new THREE.Vector3(x, 4, z) };
      b.shadow = flat(shadowMat, x, z, 0.04); b.shadow.scale.setScalar(0.3);
      b.puddle = flat(puddleMat, x, z, 0.035); b.puddle.visible = false;
      b.bar = new THREE.Sprite(barMat.clone()); b.bar.scale.set(0.7, 0.7, 1); b.bar.position.copy(b.from);
      scene.add(b.bar);
      list.push(b);
      return b;
    },
    update(dt) {
      const hero = game.hero, hp = hero.actor.position;
      for (let i = list.length - 1; i >= 0; i--) {
        const b = list[i];
        b.t += dt;
        if (b.phase === 'flight') {
          const k = Math.min(1, b.t / BUTTER.flight);
          b.bar.position.lerpVectors(b.from, new THREE.Vector3(b.x, 0.3, b.z), k);
          b.bar.position.y += Math.sin(k * Math.PI) * 2;
          b.bar.material.rotation = k * 7;
          b.shadow.scale.setScalar(0.3 + 0.7 * k);
          b.shadow.material.opacity = 0.25 + 0.3 * k;
          if (k >= 1) {
            b.phase = 'puddle'; b.t = 0;
            scene.remove(b.bar);
            b.shadow.visible = false; b.puddle.visible = true;
            fx.dust?.(new THREE.Vector3(b.x, 0, b.z));
          }
        } else {
          const left = BUTTER.life - b.t;
          b.puddle.material.opacity = Math.min(0.8, Math.max(0, left / 1.2) * 0.8); // se va apagando al final
          if (!b.used && hero.lift < 0.3 && hero.slideT <= 0 && Math.hypot(hp.x - b.x, hp.z - b.z) < BUTTER.radius) {
            b.used = true;
            const dir = Math.abs(game.input?.moveX || 0) > 0.2 ? Math.sign(game.input.moveX) : hero.actor.facing;
            hero.slide(dir, BUTTER.slide, BUTTER.speed);
          }
          if (left <= 0) { dispose(b); list.splice(i, 1); }
        }
      }
    },
    clear() {
      for (const b of list) dispose(b);
      list.length = 0;
    }
  };
}
