// Remate de Margot en las arenas finales (Pinky y Facu): algo gracioso, nunca llorando.
//  · 'papilla'  → Margot festeja y le revolea el plato de papilla de zapallo a la cara del jefe:
//                 queda con la cara embadurnada (ciego) mientras dura el remate.
//  · 'crayons'  → Margot gatea hasta el atril del jefe y garabatea el cuadro con crayones;
//                 el jefe se derrite de amor (corazones). La vista de Facu pinta los garabatos en el lienzo.
// Sólo vista (Three.js); la lógica de cada arena decide cuándo y cuánto daño hace.

export function createMargotFinish({ T, scene, assets, keep, unit, L, kind = 'papilla' }) {
  // Margot contenta: arena_margot_cheer (brazos arriba) o la celda «feliz» de margot_sheet
  let map = null, mw = 1, mh = 1;
  if (assets.has('arena_margot_cheer')) {
    const m = assets.meta('arena_margot_cheer'); map = assets.texture('arena_margot_cheer'); mw = m.w; mh = m.h;
  } else if (assets.has('margot_sheet')) {
    const m = assets.meta('margot_sheet');
    const tx = keep(assets.texture('margot_sheet').clone());
    tx.needsUpdate = true; tx.repeat.set(0.5, 0.5); tx.offset.set(0.5, 0); // celda 3: feliz con los brazos arriba
    map = tx; mw = m.w / 2; mh = m.h / 2;
  }
  const mesh = new T.Mesh(unit, keep(new T.MeshBasicMaterial({ map, alphaTest: 0.4, side: T.DoubleSide })));
  mesh.visible = false; scene.add(mesh);
  const aspect = mw / mh;

  const tex = (w, h, draw) => {
    const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
    const t = keep(new T.CanvasTexture(c)); t.encoding = T.sRGBEncoding; return t;
  };
  const spr = (map, sx, sy) => {
    const s = new T.Sprite(keep(new T.SpriteMaterial({ map, transparent: true, depthWrite: false })));
    s.scale.set(sx, sy, 1); s.visible = false; scene.add(s); return s;
  };

  // Plato de papilla de zapallo (con cuchara) y la plasta en la cara
  const bowl = spr(tex(128, 96, (g) => {
    g.fillStyle = '#ffb347'; g.beginPath(); g.ellipse(64, 40, 46, 20, 0, 0, 6.283); g.fill();
    g.fillStyle = '#ffd27a'; g.beginPath(); g.ellipse(56, 34, 22, 8, 0, 0, 6.283); g.fill();
    g.fillStyle = '#ff8ec7'; g.beginPath(); g.moveTo(14, 42); g.quadraticCurveTo(64, 98, 114, 42); g.closePath(); g.fill();
    g.fillStyle = '#ffffff'; g.globalAlpha = 0.5; g.fillRect(30, 56, 40, 6); g.globalAlpha = 1;
    g.strokeStyle = '#d9d9e6'; g.lineWidth = 7; g.lineCap = 'round'; g.beginPath(); g.moveTo(88, 30); g.lineTo(118, 6); g.stroke();
  }), 1.3, 1.0);
  const splat = spr(tex(160, 160, (g) => {
    g.fillStyle = '#ffa53a';
    g.beginPath(); g.arc(80, 70, 46, 0, 6.283); g.fill();
    for (let i = 0; i < 9; i++) { const a = i / 9 * 6.283; g.beginPath(); g.arc(80 + Math.cos(a) * 52, 70 + Math.sin(a) * 44, 14 + (i % 3) * 5, 0, 6.283); g.fill(); }
    for (const dx of [-30, 4, 34]) { g.fillRect(80 + dx - 6, 100, 12, 34 + (dx & 15)); g.beginPath(); g.arc(80 + dx, 136 + (dx & 15), 8, 0, 6.283); g.fill(); }
    g.fillStyle = '#ffd27a'; g.beginPath(); g.ellipse(66, 56, 18, 9, -0.5, 0, 6.283); g.fill();
  }), 2.1, 2.1);

  // Crayones volando y corazones
  const heartTex = tex(64, 64, (g) => {
    g.fillStyle = '#ff4f8b'; g.beginPath(); g.moveTo(32, 56); g.bezierCurveTo(-6, 30, 12, 2, 32, 20); g.bezierCurveTo(52, 2, 70, 30, 32, 56); g.fill();
  });
  const hearts = Array.from({ length: 7 }, () => spr(heartTex, 0.8, 0.8));
  const CRAY = ['#ff3b3b', '#2f8bff', '#ffd400', '#28c76f', '#a24bff'];
  const crayons = CRAY.map((c) => spr(tex(64, 16, (g) => {
    g.fillStyle = c; g.fillRect(8, 3, 48, 10); g.beginPath(); g.moveTo(56, 3); g.lineTo(64, 8); g.lineTo(56, 13); g.fill();
    g.fillStyle = 'rgba(255,255,255,.6)'; g.fillRect(14, 5, 22, 2);
  }), 0.9, 0.22));

  let faceT = 0, landed = false; // faceT: tiempo desde que la papilla le pegó en la cara

  // t: reloj · mT: margotT restante · dur: duración total del remate
  // boss: { x, z, h } · idle: { x, z } dónde espera Margot · easel: { x, y, z } (crayones)
  function draw(dt, t, mT, dur, boss, idle, easel) {
    const active = mT > 0;
    const p = active ? 1 - mT / dur : 0; // 0 → 1
    if (!active) {
      mesh.visible = true;
      const h = 1.85; mesh.scale.set(h * aspect, h, 1);
      mesh.position.set(idle.x, Math.abs(Math.sin(t * 5)) * 0.12, idle.z);
      bowl.visible = false; for (const c of crayons) c.visible = false;
      landed = false;
    } else if (kind === 'papilla') {
      // Margot salta al frente, festeja y revolea el plato
      const h = 2.3 + Math.sin(Math.min(1, p * 4) * Math.PI) * 0.3; mesh.scale.set(h * aspect, h, 1);
      mesh.visible = true; mesh.position.set(0, Math.abs(Math.sin(t * 9)) * 0.35, -5.2);
      const fly = Math.min(1, p / 0.32);
      bowl.visible = fly < 1;
      if (bowl.visible) {
        const sx = 0.6, sy = 2.0, sz = -5.2, ex = boss.x - 0.45, ey = boss.h * 0.74, ez = boss.z + 0.6;
        bowl.position.set(sx + (ex - sx) * fly, sy + (ey - sy) * fly + Math.sin(fly * Math.PI) * 3.2, sz + (ez - sz) * fly);
        bowl.material.rotation = fly * 9;
      } else if (!landed) { landed = true; faceT = 0.01; }
    } else {
      // Margot gatea hasta el atril y garabatea; tira crayones y corazones
      mesh.visible = true;
      const h = 1.7; mesh.scale.set(h * aspect, h, 1);
      const k = Math.min(1, p / 0.25), e = k * k * (3 - 2 * k);
      mesh.position.set(idle.x + (easel.x + 0.9 - idle.x) * e, Math.abs(Math.sin(t * 12)) * 0.18, idle.z + (easel.z + 0.9 - idle.z) * e);
      crayons.forEach((c, i) => {
        c.visible = p > 0.25 && p < 0.85;
        const a = t * 8 + i * 1.3;
        c.position.set(easel.x + Math.cos(a) * 1.1, easel.y + Math.sin(a * 1.4) * 0.8, easel.z + 0.4);
        c.material.rotation = a;
      });
    }
    // Plasta de papilla pegada en la cara (si Pinky tiene su sprite 3D arena_pinky_stun, la papilla ya está dibujada en él)
    if (faceT > 0) { faceT += dt; if (faceT > 3.2) faceT = 0; }
    splat.visible = kind === 'papilla' && faceT > 0 && !assets.has('arena_pinky_stun');
    if (splat.visible) {
      const pop = Math.min(1, faceT * 6);
      splat.scale.set(1.8 * pop, 1.8 * pop, 1);
      splat.position.set(boss.x - 0.45, boss.h * 0.74 - Math.min(0.4, faceT * 0.1), boss.z + 0.7);
    }
    // Corazones (crayones) — salen de Facu derretido
    hearts.forEach((s, i) => {
      s.visible = kind === 'crayons' && active && p > 0.45;
      if (!s.visible) return;
      const q = ((t * 0.7 + i / hearts.length) % 1);
      s.position.set(boss.x + Math.sin(i * 2.1 + t * 2) * 1.6, boss.h * 0.6 + q * 3.2, boss.z + 0.6);
      s.material.opacity = 1 - q;
      s.scale.setScalar(0.5 + q * 0.7);
    });
  }

  return { draw, mesh, get blind() { return faceT > 0; } };
}
