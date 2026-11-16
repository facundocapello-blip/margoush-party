// Poderes con gráfico propio: puños de Douge («Los puños llenos de verdades») y sartén en llamas de Marine.
export const POWERS = {
  fist: { count: 3, gap: 0.13, speed: 17, range: 7, dmg: 1, knock: 3.5, strength: 1.3 },
  pan: { speed: 11, range: 4.5, stun: 1.0, stunRadius: 2.2 },
  fire: { life: 4, radius: 1.5, depth: 1.3, tick: 0.7, dmg: 1 }
};
const PHRASES = ['¡VERDAD!', '¡Y SÍ!', '¡NO TE MIENTO!', '¡ASÍ ES!'];

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
  const fists = [], pans = [], fires = [], queue = [];
  const made = { fist: 0, pan: 0 };
  const mat = (emoji) => new THREE.SpriteMaterial({ map: emojiTex(emoji), transparent: true, depthWrite: false });
  const fistMat = mat('👊'), panMat = mat('🍳'), flameMat = mat('🔥');
  const fireDisc = new THREE.CircleGeometry(POWERS.fire.radius, 28);

  function sprite(m, size, x, y, z) {
    const s = new THREE.Sprite(m.clone());
    s.scale.set(size, size, 1); s.position.set(x, y, z);
    scene.add(s);
    return s;
  }
  function drop(list, i) {
    const o = list[i];
    for (const m of o.meshes) { scene.remove(m); m.material.dispose(); }
    list.splice(i, 1);
  }
  function burn(e, from, dmg, knock, strength) {
    return game.enemies.hitEnemy(e, Math.sign(e.pos.x - from) || 1, dmg, knock, strength);
  }

  return {
    fists, fires, made,
    // Douge: salen puños uno detrás de otro y atraviesan a los malos
    launchFists(x, z, facing) {
      for (let i = 0; i < POWERS.fist.count; i++) queue.push({ wait: i * POWERS.fist.gap, x, z, facing, i });
    },
    // Marine: tira una sartén; donde cae deja fuego y aturde a los de alrededor
    throwPan(x, z, facing) {
      made.pan++;
      const s = sprite(panMat, 1.3, x + facing * 0.8, 1.4, z);
      pans.push({ x: x + facing * 0.8, z, facing, ran: 0, meshes: [s], s });
      ctx.audio?.sfx('whoosh');
    },
    update(dt) {
      for (let i = queue.length - 1; i >= 0; i--) {
        const q = queue[i];
        q.wait -= dt;
        if (q.wait > 0) continue;
        queue.splice(i, 1);
        made.fist++;
        const s = sprite(fistMat, 1.9, q.x + q.facing * 0.9, 1.3, q.z);
        fists.push({ x: q.x + q.facing * 0.9, z: q.z, facing: q.facing, ran: 0, hit: new Set(), bossHit: false, meshes: [s], s });
        fx.popup(new THREE.Vector3(q.x + q.facing * 1.4, 2.7 + q.i * 0.35, q.z), PHRASES[(q.i + Math.floor(Math.random() * PHRASES.length)) % PHRASES.length], '#ffd36e', { size: 22, life: 0.8 });
        ctx.audio?.sfx('swing');
      }
      for (let i = fists.length - 1; i >= 0; i--) {
        const f = fists[i], P = POWERS.fist;
        const step = P.speed * dt;
        f.x += f.facing * step; f.ran += step;
        f.s.position.x = f.x;
        f.s.material.rotation = Math.sin(f.ran * 2) * 0.15;
        for (const e of game.enemies.list) {
          if (e.hp <= 0 || f.hit.has(e)) continue;
          const dx = (e.pos.x - f.x) * f.facing;
          if (dx < -0.5 || dx > 0.9 || Math.abs(e.pos.z - f.z) > 0.9) continue;
          f.hit.add(e);
          burn(e, f.x - f.facing, P.dmg, P.knock, P.strength);
        }
        if (game.boss && !f.bossHit && game.boss.hitArea({ x: f.x, z: f.z, facing: f.facing, reach: 0.6, depth: 0.8, dmg: P.dmg, strength: P.strength })) f.bossHit = true;
        if (f.ran >= P.range) drop(fists, i);
      }
      for (let i = pans.length - 1; i >= 0; i--) {
        const p = pans[i], P = POWERS.pan;
        const step = P.speed * dt;
        p.x += p.facing * step; p.ran += step;
        p.s.position.set(p.x, 1.4 - 0.9 * (p.ran / P.range), p.z);
        p.s.material.rotation += dt * 14;
        const hitSomething = game.enemies.list.some(e => e.hp > 0 && Math.abs(e.pos.x - p.x) < 0.8 && Math.abs(e.pos.z - p.z) < 0.9);
        if (p.ran < P.range && !hitSomething) continue;
        // aterriza: fuego en el piso y aturdimiento alrededor
        const F = POWERS.fire, meshes = [];
        const disc = new THREE.Mesh(fireDisc, new THREE.MeshBasicMaterial({ color: 0xff6a1a, transparent: true, opacity: 0.45, depthWrite: false }));
        disc.rotation.x = -Math.PI / 2; disc.position.set(p.x, 0.04, p.z); scene.add(disc); meshes.push(disc);
        const flames = [];
        for (let k = 0; k < 5; k++) {
          const fl = sprite(flameMat, 1.1, p.x + (k - 2) * 0.55, 0.6, p.z + ((k % 2) - 0.5) * 0.7);
          flames.push(fl); meshes.push(fl);
        }
        fires.push({ x: p.x, z: p.z, t: F.life, tick: 0, meshes, flames, disc });
        game.enemies.stunAround(p.x, p.z, P.stunRadius, P.stun, 0);
        game.boss?.stunAround?.(p.x, p.z, P.stunRadius);
        fx.hit(new THREE.Vector3(p.x, 0.8, p.z), 1.4);
        fx.shake(0.2);
        ctx.audio?.sfx('hitHeavy');
        drop(pans, i);
      }
      for (let i = fires.length - 1; i >= 0; i--) {
        const f = fires[i], F = POWERS.fire;
        f.t -= dt; f.tick -= dt;
        f.flames.forEach((fl, k) => { const w = 1 + Math.sin(f.t * 12 + k * 1.7) * 0.18; fl.scale.set(1.1 * w, 1.1 * w * 1.15, 1); fl.position.y = 0.6 + Math.sin(f.t * 9 + k) * 0.08; });
        f.disc.material.opacity = Math.min(0.45, f.t / 1.0 * 0.45);
        if (f.tick <= 0) {
          f.tick = F.tick;
          for (const e of game.enemies.list) {
            if (e.hp > 0 && Math.abs(e.pos.x - f.x) < F.radius && Math.abs(e.pos.z - f.z) < F.depth) burn(e, f.x, F.dmg, 1.5, 1);
          }
          game.boss?.hitArea?.({ x: f.x - F.radius, z: f.z, facing: 1, reach: F.radius * 2, depth: F.depth, dmg: F.dmg, strength: 1 });
        }
        if (f.t <= 0) drop(fires, i);
      }
    },
    clear() {
      queue.length = 0;
      for (const list of [fists, pans, fires]) while (list.length) drop(list, list.length - 1);
    }
  };
}
