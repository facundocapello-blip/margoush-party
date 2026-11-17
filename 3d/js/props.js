import { itemMat } from './items.js';
// Cervezas y hongos (dan vida), hongos venenosos (pantalla psicodélica), cajones del pasaje y el secreto.
const GOOD_X = [18, 47, 70, 96, 124, 170, 196, 248]; // cerveza y hongo, alternados
const POISON_X = [84, 232];

function emojiTexture(emoji, tint = null) {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d');
  const r = g.createRadialGradient(64, 64, 10, 64, 64, 64);
  r.addColorStop(0, 'rgba(255,240,200,0.9)'); r.addColorStop(1, 'rgba(255,200,120,0)');
  g.fillStyle = r; g.fillRect(0, 0, 128, 128);
  g.font = '80px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(emoji, 64, 70);
  if (tint) {
    // Hongo venenoso: violeta con manchas verdes
    g.globalCompositeOperation = 'source-atop';
    g.fillStyle = 'rgba(150,60,220,0.65)'; g.fillRect(0, 0, 128, 128);
    g.fillStyle = '#7dff3a';
    for (const [x, y, r] of [[48, 40, 7], [74, 34, 6], [86, 52, 5], [58, 56, 5], [38, 56, 4]]) { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); }
    g.globalCompositeOperation = 'source-over';
  }
  const t = new THREE.CanvasTexture(c);
  t.encoding = THREE.sRGBEncoding;
  return t;
}

export function createProps(ctx) {
  const { scene, world, fx, game, assets } = ctx;
  const mats = {
    beer: assets.has?.('objetos_sheet') ? itemMat(assets, 'cerveza', '🍺') : new THREE.SpriteMaterial({ map: emojiTexture('🍺'), transparent: true, depthWrite: false }),
    mushroom: assets.has?.('objetos_sheet') ? itemMat(assets, 'hongo', '🍄') : new THREE.SpriteMaterial({ map: emojiTexture('🍄'), transparent: true, depthWrite: false }),
    poison: assets.has?.('objetos_sheet') ? itemMat(assets, 'hongo_veneno', '🍄') : new THREE.SpriteMaterial({ map: emojiTexture('🍄', true), transparent: true, depthWrite: false })
  };
  const crateGeo = new THREE.BoxGeometry(1.1, 1.1, 1.1);
  const crateMat = new THREE.MeshLambertMaterial({ color: 0xc28a52 });
  const bandMat = new THREE.MeshLambertMaterial({ color: 0x6b4126 });
  const pickups = { list: [] };
  const crates = { list: [] };

  function build() {
    for (const p of pickups.list) scene.remove(p.sprite);
    for (const c of crates.list) scene.remove(c.mesh);
    pickups.list.length = 0;
    crates.list.length = 0;
    const place = (x, z, kind, seed) => {
      const s = new THREE.Sprite(mats[kind]);
      s.scale.set(1.1, 1.1, 1);
      s.position.set(x, 0.9, z);
      scene.add(s);
      pickups.list.push({ x, z, kind, taken: false, sprite: s, seed });
    };
    GOOD_X.forEach((x, i) => place(x, [-2, 1.5, -0.5, 2.5][i % 4], i % 2 ? 'mushroom' : 'beer', i));
    POISON_X.forEach((x, i) => place(x, [1.2, -1.2][i], 'poison', 20 + i));
    for (const dx of [-1.15, 0, 1.15]) {
      const mesh = new THREE.Mesh(crateGeo, crateMat);
      const band = new THREE.Mesh(new THREE.BoxGeometry(1.14, 0.18, 1.14), bandMat);
      mesh.add(band);
      mesh.position.set(world.secret.x + dx, 0.55, -4.0);
      scene.add(mesh);
      crates.list.push({ x: world.secret.x + dx, z: -4.0, hp: 2, broken: false, mesh });
    }
    world.secret.sealed = true;
    world.secret.found = false;
  }
  build();

  return {
    pickups, crates,
    reset: build,
    hitArea({ x, z, facing, reach, depth }) {
      let n = 0;
      for (const c of crates.list) {
        if (c.broken) continue;
        const dx = (c.x - x) * facing;
        if (dx < -0.5 || dx > reach + 0.4 || Math.abs(c.z - z) > depth + 0.6) continue;
        c.hp--;
        n++;
        fx.hit(c.mesh.position.clone().setY(0.9), 0.8);
        c.mesh.rotation.y += 0.25;
        ctx.audio?.sfx('crate');
        if (c.hp <= 0) {
          c.broken = true;
          scene.remove(c.mesh);
          fx.dust(c.mesh.position);
        }
      }
      if (n && world.secret.sealed && crates.list.every(c => c.broken)) {
        world.secret.sealed = false;
        game.banner('PASAJE DEL CORTADO', '¡Se abrió el pasaje! Entrá a ver qué hay.');
      }
      return n;
    },
    update(dt, t) {
      const h = game.hero;
      const p = h.actor.position;
      for (const b of pickups.list) {
        if (b.taken) continue;
        b.sprite.position.y = 0.9 + Math.sin(t * 3 + b.seed) * 0.15;
        if (Math.abs(p.x - b.x) < 0.9 && Math.abs(p.z - b.z) < 0.9 && h.lift < 1.2) {
          b.taken = true;
          scene.remove(b.sprite);
          if (b.kind === 'poison') {
            game.psycho.start();
            fx.popup(b.sprite.position.clone().setY(2), '¡UFF! 🌀', '#c084fc', { size: 26, life: 1.1 });
            game.banner('🍄 ¡HONGO RARO!', 'Se te va la cabeza un ratito… pero no pasa nada.', 3);
            ctx.audio?.sfx('secret');
          } else {
            h.hp = Math.min(h.hpMax, h.hp + 1);
            game.score.addPickup('bottle');
            fx.popup(b.sprite.position.clone().setY(2), '+50 ❤️', '#ff9fb0', { size: 22 });
            ctx.audio?.sfx('pickup');
            // Chiste: Marine no dice «merci beaucoup», dice «¡Messi Goku!»
            if (game.heroId === 'marine') {
              fx.popup(b.sprite.position.clone().setY(2.8), '¡MESSI GOKU! ⚽🐉', '#ffd166', { size: 24, life: 1.2 });
              ctx.audio?.messiGoku();
            }
          }
        }
      }
      const s = world.secret;
      if (!s.sealed && !s.found && Math.abs(p.x - s.x) < s.halfWidth && p.z < s.doorZ + 0.35) {
        s.found = true;
        game.score.addPickup('secret');
        fx.popup(p.clone().setY(3), '¡SECRETO! +500', '#c084fc', { size: 26, life: 1.4 });
        game.banner('🌟 SECRETO', 'Encontraste el Pasaje del Cortado: +500 puntos.');
        ctx.audio?.sfx('secret');
      }
    }
  };
}
