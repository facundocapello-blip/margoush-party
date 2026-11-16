// La calle: recorre +X de izquierda a derecha, con profundidad en Z (−3.6 atrás … 3.6 adelante).
export const STREET = { minX: 1, maxX: 218, minZ: -3.6, maxZ: 3.6 };
export const ZONES = [
  { id: 'le-concept', startX: 0, endX: 30 },
  { id: 'vereda', startX: 30, endX: 90 },
  { id: 'plaza', startX: 90, endX: 140 },
  { id: 'pasaje', startX: 112, endX: 122 },
  { id: 'galpon', startX: 170, endX: 220 }
];
const BACK_Z = -5.2;
const GALPON_X = 165;

function canvasTex(w, h, draw, repeatX = 1, repeatY = 1) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.encoding = THREE.sRGBEncoding;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeatX, repeatY);
  t.anisotropy = 4;
  return t;
}

function cobble(ctx, w, h) {
  ctx.fillStyle = '#4a3a3c';
  ctx.fillRect(0, 0, w, h);
  const s = 32;
  for (let y = 0; y < h; y += s) {
    for (let x = -s; x < w; x += s) {
      const off = (y / s) % 2 ? s / 2 : 0;
      const l = 120 + Math.random() * 45;
      ctx.fillStyle = `rgb(${l + 30},${l + 4},${l - 18})`;
      ctx.beginPath();
      ctx.roundRect(x + off + 2, y + 2, s - 4, s - 4, 7);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,230,190,0.12)';
      ctx.fillRect(x + off + 5, y + 4, s - 12, 4);
    }
  }
}

function warehouse(ctx, w, h) {
  // Chapa acanalada oscura con ventanales altos encendidos
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#241b3d'); g.addColorStop(1, '#3d2b3a');
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  for (let x = 0; x < w; x += 12) {
    ctx.fillStyle = 'rgba(255,255,255,0.05)'; ctx.fillRect(x, 0, 3, h);
    ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.fillRect(x + 6, 0, 4, h);
  }
  for (let x = 40; x < w; x += 256) {
    const wg = ctx.createLinearGradient(0, h * 0.12, 0, h * 0.4);
    wg.addColorStop(0, '#ffd79a'); wg.addColorStop(1, '#ff9f5a');
    ctx.fillStyle = '#120c22'; ctx.fillRect(x - 6, h * 0.1 - 6, 172, h * 0.32 + 12);
    ctx.fillStyle = wg; ctx.fillRect(x, h * 0.1, 160, h * 0.32);
    ctx.fillStyle = '#120c22';
    for (let i = 1; i < 4; i++) ctx.fillRect(x + i * 40 - 2, h * 0.1, 4, h * 0.32);
    ctx.fillRect(x, h * 0.26 - 2, 160, 4);
  }
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(0, h * 0.86, w, h * 0.14);
}

function concrete(ctx, w, h) {
  ctx.fillStyle = '#3a3342'; ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 900; i++) {
    const l = 40 + Math.random() * 30;
    ctx.fillStyle = `rgba(${l + 20},${l + 10},${l + 30},0.35)`;
    ctx.fillRect(Math.random() * w, Math.random() * h, 3, 3);
  }
  ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 3;
  for (let x = 0; x <= w; x += w / 2) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
  for (let y = 0; y <= h; y += h / 2) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
}

function label(text, color = '#ffd36e', w = 1024, h = 192) {
  return canvasTex(w, h, (ctx) => {
    ctx.fillStyle = 'rgba(16,10,30,0.88)';
    ctx.beginPath(); ctx.roundRect(8, 8, w - 16, h - 16, 30); ctx.fill();
    ctx.lineWidth = 10; ctx.strokeStyle = color; ctx.stroke();
    ctx.font = `900 ${Math.floor(h * 0.5)}px Fredoka, "Arial Rounded MT Bold", Arial, sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.shadowColor = color; ctx.shadowBlur = 24; ctx.fillStyle = color;
    ctx.fillText(text, w / 2, h / 2 + 4);
  });
}

const glowTex = () => canvasTex(128, 128, (ctx) => {
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,220,150,1)'); g.addColorStop(0.35, 'rgba(255,180,90,0.45)'); g.addColorStop(1, 'rgba(255,160,80,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 128);
});

export function buildStreet(scene, assets) {
  scene.background = new THREE.Color(0x2c2350);
  scene.fog = new THREE.Fog(0x2c2350, 30, 75);
  scene.add(new THREE.HemisphereLight(0x9a8ce0, 0x4a3020, 1.0));
  const sun = new THREE.DirectionalLight(0xffd9a8, 0.55);
  sun.position.set(-20, 30, 25);
  scene.add(sun);

  // Piso
  const floorMat = new THREE.MeshLambertMaterial({ color: 0x9c8a94, map: canvasTex(512, 512, cobble, 36, 6) });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(GALPON_X + 20, 22), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set((GALPON_X - 20) / 2, 0, 5.6);
  scene.add(floor);
  const slab = new THREE.Mesh(new THREE.PlaneGeometry(70, 22), new THREE.MeshLambertMaterial({ color: 0x8a7f96, map: canvasTex(256, 256, concrete, 14, 4) }));
  slab.rotation.x = -Math.PI / 2;
  slab.position.set(GALPON_X + 35, 0.005, 5.6);
  scene.add(slab);
  // Franja amarilla de seguridad y portón de entrada al galpón
  const stripe = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 9), new THREE.MeshBasicMaterial({ color: 0xffc23d }));
  stripe.rotation.x = -Math.PI / 2;
  stripe.position.set(GALPON_X + 0.5, 0.02, -0.4);
  scene.add(stripe);
  const frameMat = new THREE.MeshLambertMaterial({ color: 0x2a2140 });
  const jamb = new THREE.Mesh(new THREE.BoxGeometry(1.2, 9, 1.2), frameMat);
  jamb.position.set(GALPON_X - 0.2, 4.5, BACK_Z + 0.4);
  scene.add(jamb);
  // Barriles y cajas del galpón
  const barrelMat = new THREE.MeshLambertMaterial({ color: 0x8a3b3b });
  const boxMat = new THREE.MeshLambertMaterial({ color: 0x9a6a3c });
  for (const [x, z, kind] of [[GALPON_X + 4, -4.3, 'b'], [GALPON_X + 5.1, -4.5, 'b'], [GALPON_X + 13, -4.4, 'x'], [GALPON_X + 14.2, -4.4, 'x'], [GALPON_X + 13.6, -4.4, 'x2'], [GALPON_X + 30, -4.3, 'b'], [GALPON_X + 39, -4.4, 'x']]) {
    const m = kind === 'b' ? new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 1.3, 14), barrelMat) : new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 1.2), boxMat);
    m.position.set(x, kind === 'x2' ? 1.8 : kind === 'b' ? 0.65 : 0.6, z);
    scene.add(m);
  }
  // Lámparas colgantes con halo
  const lampGlow = glowTex();
  for (const x of [GALPON_X + 10, GALPON_X + 24, GALPON_X + 38, GALPON_X + 50]) {
    const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 3, 4), new THREE.MeshBasicMaterial({ color: 0x111111 }));
    cord.position.set(x, 8.5, -2);
    const shade = new THREE.Mesh(new THREE.ConeGeometry(0.6, 0.5, 14, 1, true), new THREE.MeshLambertMaterial({ color: 0x2d2d3a, side: THREE.DoubleSide }));
    shade.position.set(x, 7, -2);
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: lampGlow, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
    halo.position.set(x, 6.7, -2); halo.scale.set(3, 3, 1);
    const pool = new THREE.Mesh(new THREE.CircleGeometry(3.2, 24), new THREE.MeshBasicMaterial({ map: lampGlow, transparent: true, opacity: 0.45, blending: THREE.AdditiveBlending, depthWrite: false }));
    pool.rotation.x = -Math.PI / 2; pool.position.set(x, 0.03, -0.8);
    scene.add(cord, shade, halo, pool);
  }

  // Vereda
  const curb = new THREE.Mesh(new THREE.BoxGeometry(GALPON_X + 20, 0.16, 1.4), new THREE.MeshLambertMaterial({ color: 0xc9a98a }));
  curb.position.set((GALPON_X - 20) / 2, 0.08, -4.5);
  scene.add(curb);

  // Fachadas pintadas: el mismo fondo del 2D, en mosaico detrás de la calle
  const bg = assets.texture('street_bg');
  const bgMeta = assets.meta('street_bg');
  const tileH = 13, tileW = tileH * bgMeta.w / bgMeta.h;
  const bgMat = new THREE.MeshBasicMaterial({ map: bg, fog: false });
  for (let x = -20; x < GALPON_X; x += tileW) {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(tileW, tileH), bgMat);
    p.position.set(x + tileW / 2, tileH * (0.5 - 0.165), BACK_Z);
    scene.add(p);
  }
  // Galpón del fondo
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(70, 13), new THREE.MeshBasicMaterial({ map: canvasTex(1024, 256, warehouse, 4, 1), fog: false }));
  wall.position.set(GALPON_X + 35, 4.5, BACK_Z + 0.05);
  scene.add(wall);

  // Carteles
  const sign = (text, x, y, color, w = 7) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, w * 0.1875), new THREE.MeshBasicMaterial({ map: label(text, color), transparent: true, fog: false }));
    m.position.set(x, y, BACK_Z + 0.3);
    scene.add(m);
    return m;
  };
  sign('LE CONCEPT', 9, 7.2, '#ffd36e');
  sign('LA PLAZA', 115, 7.2, '#7ee0c3', 5.5);
  sign('GALPÓN DEL FONDO', GALPON_X + 18, 7.6, '#ff7a6b', 9);

  // Faroles con halo
  const glow = glowTex();
  const postMat = new THREE.MeshLambertMaterial({ color: 0x1d1b2b });
  const bulbMat = new THREE.MeshBasicMaterial({ color: 0xffe2a8 });
  const haloMat = new THREE.SpriteMaterial({ map: glow, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true });
  for (let x = 6; x < GALPON_X; x += 15) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.13, 4.2, 8), postMat);
    post.position.set(x, 2.1, -4.3);
    scene.add(post);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 10), bulbMat);
    bulb.position.set(x, 4.3, -4.3);
    scene.add(bulb);
    const halo = new THREE.Sprite(haloMat);
    halo.scale.set(3.4, 3.4, 1);
    halo.position.copy(bulb.position);
    scene.add(halo);
    const pool = new THREE.Mesh(new THREE.CircleGeometry(2.6, 24), new THREE.MeshBasicMaterial({ map: glow, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false }));
    pool.rotation.x = -Math.PI / 2;
    pool.position.set(x, 0.02, -2.6);
    scene.add(pool);
  }

  // Macetas y bolardos sobre la vereda
  const potMat = new THREE.MeshLambertMaterial({ color: 0xb4643c });
  const leafMat = new THREE.MeshLambertMaterial({ color: 0x4f7a3c });
  for (let x = 13; x < GALPON_X; x += 15) {
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.32, 0.6, 10), potMat);
    pot.position.set(x, 0.46, -4.6);
    const bush = new THREE.Mesh(new THREE.SphereGeometry(0.6, 10, 8), leafMat);
    bush.position.set(x, 1.15, -4.6);
    scene.add(pot, bush);
  }

  // Mesitas de Le Concept
  const tableMat = new THREE.MeshLambertMaterial({ color: 0x2d2a2a });
  for (const x of [3.5, 7.5, 11.5]) {
    const top = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.06, 14), tableMat);
    top.position.set(x, 0.95, -3.95);
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.95, 6), tableMat);
    leg.position.set(x, 0.47, -3.95);
    scene.add(top, leg);
  }

  // Fuente de la plaza
  const stone = new THREE.MeshLambertMaterial({ color: 0xd8c3a5 });
  const basin = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.4, 0.6, 24), stone);
  basin.position.set(104, 0.3, -6.6);
  const water = new THREE.Mesh(new THREE.CircleGeometry(2.0, 24), new THREE.MeshBasicMaterial({ color: 0x6fc7e8 }));
  water.rotation.x = -Math.PI / 2; water.position.set(104, 0.62, -6.6);
  const column = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.35, 2.2, 10), stone);
  column.position.set(104, 1.4, -6.6);
  scene.add(basin, water, column);

  // Entrada del pasaje secreto (sellada por cajones en Task 5)
  const door = new THREE.Group();
  const dark = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 4.2), new THREE.MeshBasicMaterial({ color: 0x0b0716 }));
  dark.position.set(0, 2.1, 0);
  const archMat = new THREE.MeshLambertMaterial({ color: 0x6b4b8a });
  const left = new THREE.Mesh(new THREE.BoxGeometry(0.4, 4.6, 0.4), archMat); left.position.set(-1.8, 2.3, 0.1);
  const right = left.clone(); right.position.x = 1.8;
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(4, 0.4, 0.4), archMat); lintel.position.set(0, 4.6, 0.1);
  door.add(dark, left, right, lintel);
  door.position.set(117, 0, BACK_Z + 0.25);
  scene.add(door);
  const pasajeSign = sign('PASAJE DEL CORTADO', 117, 5.4, '#c084fc', 4.4);
  pasajeSign.position.z = BACK_Z + 0.5;

  // Portones de cinta: se abren al despejar cada zona (Task 5)
  const gates = [88, 150].map((x) => {
    const g = new THREE.Group();
    const tapeMat = new THREE.MeshBasicMaterial({ map: canvasTex(64, 16, (c, w, h) => { for (let i = 0; i < w; i += 16) { c.fillStyle = (i / 16) % 2 ? '#111' : '#ffcc00'; c.fillRect(i, 0, 16, h); } }, 12, 1) });
    for (const y of [0.7, 1.3]) {
      const tape = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.16, 7.6), tapeMat);
      tape.position.set(0, y, 0);
      g.add(tape);
    }
    for (const z of [-3.9, 3.9]) {
      const cone = new THREE.Mesh(new THREE.ConeGeometry(0.3, 1.5, 10), new THREE.MeshLambertMaterial({ color: 0xff6a2a }));
      cone.position.set(0, 0.75, z);
      g.add(cone);
    }
    g.position.x = x;
    scene.add(g);
    return { x, open: false, mesh: g };
  });

  const secret = { x: 117, halfWidth: 1.4, doorZ: BACK_Z + 0.6, found: false, sealed: true };

  // Mantiene una posición dentro de la calle, respetando portones y el pasaje
  function clampPosition(pos, radius = 0.4) {
    pos.x = Math.min(STREET.maxX, Math.max(STREET.minX, pos.x));
    const inDoor = !secret.sealed && Math.abs(pos.x - secret.x) < secret.halfWidth;
    pos.z = Math.min(STREET.maxZ, Math.max(inDoor ? secret.doorZ : STREET.minZ, pos.z));
    for (const g of gates) {
      if (g.open) continue;
      if (pos.x > g.x - radius && pos.x < g.x + radius) pos.x = pos.x < g.x ? g.x - radius : g.x + radius;
    }
    return pos;
  }

  return { bounds: STREET, zones: ZONES, colliders: [], gates, secret, clampPosition, galponX: GALPON_X };
}
