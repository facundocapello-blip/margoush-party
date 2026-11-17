// La calle: recorre +X de izquierda a derecha, con profundidad en Z (−3.6 atrás … 3.6 adelante).
// Primera mitad Buenos Aires, Le Concept en el medio, segunda mitad Francia y el galpón al final.
import { LE_CONCEPT_X, BORDER_X, GALPON_X, SECRET_X, STREET_MAX_X, GATES, LEVELS } from './level.js';

export const STREET = { minX: 1, maxX: STREET_MAX_X, minZ: -3.6, maxZ: 3.6 };
export const ZONES = [
  { id: 'buenos-aires', startX: 0, endX: BORDER_X },
  { id: 'le-concept', startX: LE_CONCEPT_X - 8, endX: LE_CONCEPT_X + 8 },
  { id: 'francia', startX: BORDER_X, endX: GALPON_X },
  { id: 'pasaje', startX: SECRET_X - 5, endX: SECRET_X + 5 },
  { id: 'galpon', startX: GALPON_X, endX: STREET_MAX_X }
];
const BACK_Z = -5.2;
const SHOPS = ['KIOSCO', 'PIZZERÍA', 'FARMACIA', 'PARRILLA', 'ALMACÉN', 'VERDULERÍA', 'HELADERÍA', 'LIBRERÍA'];

// Fachada porteña pintada por código, estilo Caminito (La Boca): chapa acanalada de colores fuertes,
// marcos de otro color, balcones de hierro y un local con cartel fileteado
const CHAPA = ['#d8343f', '#f2b705', '#1f7ae0', '#22a05a', '#ff7a1f', '#8a4fd6', '#e0567a', '#14a3a8'];
const MARCO = ['#f2b705', '#1f7ae0', '#d8343f', '#ff7a1f', '#22a05a', '#f2b705', '#1f7ae0', '#f4efe4'];
function porteno(i) {
  return (ctx, w, h) => {
    const wall = CHAPA[i % CHAPA.length], trim = MARCO[(i + 3) % MARCO.length];
    ctx.fillStyle = wall; ctx.fillRect(0, 0, w, h);
    // chapa acanalada
    for (let x = 0; x < w; x += 14) {
      ctx.fillStyle = 'rgba(255,255,255,0.13)'; ctx.fillRect(x, 0, 4, h);
      ctx.fillStyle = 'rgba(0,0,0,0.16)'; ctx.fillRect(x + 8, 0, 5, h);
    }
    // techo de chapa a dos aguas y cornisa
    ctx.fillStyle = '#5b4a44'; ctx.beginPath(); ctx.moveTo(-10, 46); ctx.lineTo(w / 2, 0); ctx.lineTo(w + 10, 46); ctx.closePath(); ctx.fill();
    ctx.fillStyle = trim; ctx.fillRect(0, 44, w, 12);
    const shopTop = h * 0.62;
    for (let f = 0; f < 2; f++) {
      const y = 92 + f * ((shopTop - 120) / 2);
      for (let k = 0; k < 2; k++) {
        const ww = w * 0.28, wh = 120, x = w * (k ? 0.6 : 0.12);
        const lit = (i * 5 + f * 3 + k) % 3 !== 0;
        const g = ctx.createLinearGradient(0, y, 0, y + wh);
        g.addColorStop(0, lit ? '#ffe3a1' : '#2f3550'); g.addColorStop(1, lit ? '#f39a4d' : '#1d2238');
        ctx.fillStyle = trim; ctx.fillRect(x - 9, y - 9, ww + 18, wh + 18);
        ctx.fillStyle = g; ctx.fillRect(x, y, ww, wh);
        ctx.fillStyle = trim; ctx.fillRect(x + ww / 2 - 3, y, 6, wh); ctx.fillRect(x, y + wh * 0.45, ww, 5);
        // macetas con malvones en el balcón
        ctx.fillStyle = '#b4643c'; ctx.fillRect(x + 4, y + wh - 16, 22, 12); ctx.fillRect(x + ww - 26, y + wh - 16, 22, 12);
        ctx.fillStyle = '#e8394a'; for (const fx of [x + 10, x + 18, x + ww - 20, x + ww - 12]) { ctx.beginPath(); ctx.arc(fx, y + wh - 20, 5, 0, Math.PI * 2); ctx.fill(); }
        // balcón de hierro
        ctx.fillStyle = '#1e1b22'; ctx.fillRect(x - 16, y + wh + 2, ww + 32, 6);
        for (let bx = x - 14; bx < x + ww + 16; bx += 9) ctx.fillRect(bx, y + wh - 24, 3, 28);
        ctx.fillRect(x - 16, y + wh - 28, ww + 32, 5);
      }
    }
    // Local de planta baja
    const top = shopTop;
    ctx.fillStyle = '#2a2230'; ctx.fillRect(12, top, w - 24, h - top);
    const sg = ctx.createLinearGradient(0, top + 70, 0, h);
    sg.addColorStop(0, '#ffe2a3'); sg.addColorStop(1, '#f2a35a');
    ctx.fillStyle = sg; ctx.fillRect(26, top + 78, w * 0.52, h - top - 90);
    ctx.fillStyle = '#4a3226'; ctx.fillRect(w * 0.62, top + 78, w * 0.3, h - top - 78);
    ctx.fillStyle = trim; ctx.fillRect(w * 0.62 + 10, top + 88, w * 0.3 - 20, 36);
    // persiana metálica a medio bajar
    ctx.fillStyle = '#8d8a92'; ctx.fillRect(26, top + 78, w * 0.52, 34);
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; for (let yy = top + 82; yy < top + 112; yy += 6) ctx.fillRect(26, yy, w * 0.52, 2);
    // Cartel fileteado: fondo negro, guardas de colores, rulos y letras cremas
    ctx.fillStyle = '#121016'; ctx.fillRect(16, top + 6, w - 32, 64);
    ctx.lineWidth = 4;
    for (const [c, o] of [['#d33c3c', 4], ['#2f8f5b', 10], ['#e9b949', 16]]) { ctx.strokeStyle = c; ctx.strokeRect(16 + o, top + 6 + o / 2, w - 32 - o * 2, 64 - o); }
    ctx.strokeStyle = '#e9b949'; ctx.lineWidth = 3;
    for (const cx of [40, w - 40]) { ctx.beginPath(); ctx.arc(cx, top + 38, 10, 0, Math.PI * 1.6); ctx.stroke(); ctx.beginPath(); ctx.arc(cx, top + 38, 4, 0, Math.PI * 2); ctx.fill(); }
    ctx.font = '900 34px Georgia, "Times New Roman", serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff1d6'; ctx.fillText(SHOPS[i % SHOPS.length], w / 2, top + 40);
  };
}

// Asfalto de la avenida, con línea central discontinua
function asphalt(ctx, w, h) {
  ctx.fillStyle = '#3a3640'; ctx.fillRect(0, 0, w, h);
  for (let n = 0; n < 2600; n++) {
    const l = 50 + Math.random() * 40;
    ctx.fillStyle = `rgba(${l},${l - 4},${l + 6},0.5)`;
    ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
  }
  // z = 0 está a 5,4 m del borde de atrás del piso (32 px por metro)
  ctx.fillStyle = 'rgba(255,240,200,0.75)';
  ctx.fillRect(20, 5.4 * 32 - 3, w * 0.55, 6);
  ctx.fillStyle = 'rgba(255,214,90,0.55)';
  ctx.fillRect(0, (5.4 - 3.75) * 32, w, 4);
}

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
  // Hormigón cálido gastado, con manchas de aceite
  ctx.fillStyle = '#5a4a4c'; ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 1400; i++) {
    const l = 60 + Math.random() * 45;
    ctx.fillStyle = `rgba(${l + 30},${l + 14},${l + 8},0.35)`;
    ctx.fillRect(Math.random() * w, Math.random() * h, 2 + Math.random() * 3, 2 + Math.random() * 3);
  }
  for (let i = 0; i < 3; i++) {
    const x = Math.random() * w, y = Math.random() * h, r = 20 + Math.random() * 30;
    const g = ctx.createRadialGradient(x, y, 2, x, y, r);
    g.addColorStop(0, 'rgba(20,14,24,0.55)'); g.addColorStop(1, 'rgba(20,14,24,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
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

  // Piso: asfalto porteño hasta la frontera, adoquines franceses hasta el galpón
  const baLen = BORDER_X + 20;
  const asphaltFloor = new THREE.Mesh(new THREE.PlaneGeometry(baLen, 22), new THREE.MeshLambertMaterial({ color: 0xbdb6c4, map: canvasTex(512, 704, asphalt, baLen / 16, 1) }));
  asphaltFloor.rotation.x = -Math.PI / 2;
  asphaltFloor.position.set(BORDER_X - baLen / 2, 0, 5.6);
  scene.add(asphaltFloor);
  const frLen = GALPON_X - BORDER_X;
  const floorMat = new THREE.MeshLambertMaterial({ color: 0x9c8a94, map: canvasTex(512, 512, cobble, frLen / 7, 6) });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(frLen, 22), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(BORDER_X + frLen / 2, 0.002, 5.6);
  scene.add(floor);
  const slab = new THREE.Mesh(new THREE.PlaneGeometry(70, 24), new THREE.MeshLambertMaterial({ color: 0xb8a39a, map: canvasTex(256, 256, concrete, 14, 4) }));
  slab.rotation.x = -Math.PI / 2;
  slab.position.set(GALPON_X + 35, 0.005, 4.6);
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
  const barrelMat = new THREE.MeshLambertMaterial({ map: canvasTex(128, 128, (c, w, h) => {
    c.fillStyle = '#a3402f'; c.fillRect(0, 0, w, h);
    c.fillStyle = '#6e2a20'; for (const y of [10, 60, 110]) c.fillRect(0, y, w, 8);
    c.fillStyle = 'rgba(255,255,255,0.12)'; c.fillRect(18, 0, 10, h);
    c.fillStyle = '#ffcc00'; c.fillRect(70, 30, 40, 24); c.fillStyle = '#111'; c.font = '900 20px Arial'; c.fillText('!', 86, 50);
  }) });
  const boxMat = new THREE.MeshLambertMaterial({ map: canvasTex(128, 128, (c, w, h) => {
    c.fillStyle = '#9a6a3c'; c.fillRect(0, 0, w, h);
    c.fillStyle = '#7a4f2a'; for (let y = 0; y < h; y += 32) c.fillRect(0, y, w, 6);
    c.strokeStyle = '#4a2c18'; c.lineWidth = 8; c.strokeRect(4, 4, w - 8, h - 8);
  }) });
  for (const [x, z, kind] of [[GALPON_X + 4, -5.6, 'b'], [GALPON_X + 5.1, -5.7, 'b'], [GALPON_X + 13, -5.6, 'x'], [GALPON_X + 14.2, -5.6, 'x'], [GALPON_X + 13.6, -5.6, 'x2'], [GALPON_X + 30, -5.6, 'b'], [GALPON_X + 39, -5.6, 'x']]) {
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
  // Vereda porteña de baldosas grises y vereda francesa de piedra clara
  const tiles = canvasTex(128, 64, (c, w, h) => {
    c.fillStyle = '#8f8c93'; c.fillRect(0, 0, w, h);
    c.strokeStyle = '#6c6a72'; c.lineWidth = 2;
    for (let x = 0; x <= w; x += 32) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, h); c.stroke(); }
    for (let y = 0; y <= h; y += 32) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); }
    c.fillStyle = 'rgba(0,0,0,0.12)'; for (let x = 6; x < w; x += 8) for (let y = 6; y < h; y += 8) c.fillRect(x, y, 2, 2);
  }, baLen / 2, 1);
  const curbBA = new THREE.Mesh(new THREE.BoxGeometry(baLen, 0.16, 1.4), new THREE.MeshLambertMaterial({ color: 0xc8c4cc, map: tiles }));
  curbBA.position.set(BORDER_X - baLen / 2, 0.08, -4.5);
  const curbFR = new THREE.Mesh(new THREE.BoxGeometry(frLen + 20, 0.16, 1.4), new THREE.MeshLambertMaterial({ color: 0xc9a98a }));
  curbFR.position.set(BORDER_X + (frLen + 20) / 2, 0.081, -4.5);
  scene.add(curbBA, curbFR);

  // Fachadas. La pintura del 2D (street_bg) tiene tres edificios: a la izquierda el del toldo rojo,
  // en el medio el local azul (LE CONCEPT) y a la derecha el rosado. Se recortan por separado.
  const bg = assets.texture('street_bg');
  const bgMeta = assets.meta('street_bg');
  const crop = (u0, u1, v0 = 0) => {
    const t = bg.clone();
    t.needsUpdate = true;
    t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
    t.offset.set(u0, v0);
    t.repeat.set(u1 - u0, 1 - v0);
    return t;
  };
  const tileH = 13, pxPerM = bgMeta.h / tileH;
  const U_LC = [0.415, 0.752];

  // Buenos Aires: edificios porteños hasta Le Concept y entre Le Concept y la frontera
  // La cámara ve unos 4 m de fachada: el local se escala para que vidrieras y cartel entren en cuadro
  const lcH = 9, lcW = 1.4 * lcH * ((U_LC[1] - U_LC[0]) * bgMeta.w) / (bgMeta.h * 0.835);
  const lcLeft = LE_CONCEPT_X - lcW / 2, lcRight = LE_CONCEPT_X + lcW / 2;
  // Nivel 1: casitas porteñas de chapa de colores (Buenos Aires ya no se parece a Francia)
  const baMats = Array.from({ length: CHAPA.length }, (_, i) => new THREE.MeshBasicMaterial({ map: canvasTex(512, 768, porteno(i)), fog: false }));
  function portenoRun(from, to, k = 0) {
    const BW = 6.2, BH = 9.3;
    let x0 = from;
    while (x0 < to - 0.01) {
      const w = Math.min(BW, to - x0);
      const m = new THREE.Mesh(new THREE.PlaneGeometry(BW, BH), baMats[k++ % baMats.length]);
      m.position.set(x0 + w / 2, BH / 2, BACK_Z - 0.02);
      if (w < BW) m.scale.x = w / BW;
      scene.add(m);
      x0 += w;
    }
    return k;
  }
  const kBA = portenoRun(-7, lcLeft);
  portenoRun(lcRight, BORDER_X, kBA);
  // Cielo porteño detrás de las casitas (más bajas que los edificios de París) y el Obelisco a lo lejos
  const baSky = new THREE.Mesh(new THREE.PlaneGeometry(BORDER_X + 30, 18), new THREE.MeshBasicMaterial({ map: canvasTex(64, 256, (c, w, h) => {
    const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#2b3f8f'); g.addColorStop(0.55, '#e0768a'); g.addColorStop(1, '#ffb36b');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
  }), fog: false }));
  baSky.position.set((BORDER_X - 30) / 2 + 10, 9, BACK_Z - 3);
  scene.add(baSky);
  const obeliscoMat = new THREE.MeshBasicMaterial({ color: 0xf1e9dc, fog: false });
  const obelisco = new THREE.Group();
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 1.1, 13, 4), obeliscoMat);
  shaft.rotation.y = Math.PI / 4; shaft.position.y = 6.5;
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.78, 1.6, 4), obeliscoMat);
  tip.rotation.y = Math.PI / 4; tip.position.y = 13.8;
  const win = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.45), new THREE.MeshBasicMaterial({ color: 0x2b2440, fog: false }));
  win.position.set(0, 12.4, 0.62);
  obelisco.add(shaft, tip, win);
  obelisco.position.set(96, 0, BACK_Z - 2.6);
  scene.add(obelisco);

  // LE CONCEPT: el local azul, más grande y adelantado, con cartel dorado sobre azul
  const leConcept = new THREE.Group();
  leConcept.userData.leConcept = true;
  const front = new THREE.Mesh(new THREE.PlaneGeometry(lcW, lcH), new THREE.MeshBasicMaterial({ map: crop(U_LC[0], U_LC[1], 0.165), fog: false }));
  front.position.set(0, lcH / 2, 0);
  const sideMat = new THREE.MeshBasicMaterial({ color: 0x1f2a44, fog: false });
  for (const sx of [-1, 1]) {
    const sidePanel = new THREE.Mesh(new THREE.PlaneGeometry(0.9, lcH), sideMat);
    sidePanel.rotation.y = sx * Math.PI / 2;
    sidePanel.position.set(sx * lcW / 2, lcH / 2, -0.45);
    leConcept.add(sidePanel);
  }
  const lcSign = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 1.2), new THREE.MeshBasicMaterial({ map: canvasTex(1024, 192, (c, w, h) => {
    c.fillStyle = '#16264a'; c.beginPath(); c.roundRect(6, 6, w - 12, h - 12, 18); c.fill();
    c.lineWidth = 8; c.strokeStyle = '#e9c46a'; c.stroke();
    c.font = '700 104px Georgia, "Times New Roman", serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.shadowColor = '#ffd36e'; c.shadowBlur = 28; c.fillStyle = '#ffe6a6';
    c.fillText('LE CONCEPT', w / 2, h / 2 + 6);
  }), transparent: true, fog: false }));
  lcSign.position.set(0, 3.3, 0.35);
  const lcHalo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: 0xffd36e, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.55 }));
  lcHalo.scale.set(9, 3.2, 1); lcHalo.position.set(0, 3.3, 0.45);
  // Alfombra roja hasta la puerta
  const carpet = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.4), new THREE.MeshLambertMaterial({ color: 0xa3202e }));
  carpet.rotation.x = -Math.PI / 2;
  carpet.position.set(0, 0.17, 0.75);
  leConcept.add(carpet);
  leConcept.add(front, lcSign, lcHalo);
  leConcept.position.set(LE_CONCEPT_X, -lcH * 0.165 * 0, BACK_Z + 0.55);
  scene.add(leConcept);

  // Francia: recortes del edificio del toldo rojo y del rosado, alternados (sin el local azul)
  const frParts = [[0, U_LC[0]], [U_LC[1], 1]].map(([u0, u1]) => ({ mat: new THREE.MeshBasicMaterial({ map: crop(u0, u1), fog: false }), w: (u1 - u0) * bgMeta.w / pxPerM }));
  let fx0 = BORDER_X, part = 0;
  while (fx0 < GALPON_X - 0.5) {
    const pt = frParts[part++ % 2];
    const w = Math.min(pt.w, GALPON_X - fx0);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(pt.w, tileH), pt.mat);
    m.position.set(fx0 + pt.w / 2, tileH * (0.5 - 0.165), BACK_Z - 0.02);
    if (w < pt.w) { m.scale.x = w / pt.w; m.position.x = fx0 + w / 2; }
    scene.add(m);
    fx0 += w;
  }
  // Galpón del fondo
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(70, 13), new THREE.MeshBasicMaterial({ map: canvasTex(1024, 256, warehouse, 4, 1), fog: false }));
  wall.position.set(GALPON_X + 35, 4.5, -6.8); // el galpón es más profundo: deja lugar a barriles detrás del carril del auto
  scene.add(wall);
  // Pared lateral que cierra la esquina entre la fachada y el fondo del galpón
  const side = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 13), new THREE.MeshBasicMaterial({ color: 0x1d1530, fog: false }));
  side.rotation.y = Math.PI / 2;
  side.position.set(GALPON_X + 0.4, 4.5, -6.0);
  scene.add(side);

  // Carteles
  const sign = (text, x, y, color, w = 7) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, w * 0.1875), new THREE.MeshBasicMaterial({ map: label(text, color), transparent: true, fog: false }));
    m.position.set(x, y, BACK_Z + 0.3);
    scene.add(m);
    return m;
  };
  sign('BUENOS AIRES', 9, 3.7, '#7ec8ff', 4.6);
  // Arco de bienvenida sobre la calle, en la frontera
  const archPoleMat = new THREE.MeshLambertMaterial({ color: 0x2b4fa8 });
  for (const z of [-3.95, 3.95]) {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 5.2, 10), archPoleMat);
    pole.position.set(BORDER_X + 0.5, 2.6, z);
    scene.add(pole);
  }
  const welcome = new THREE.Mesh(new THREE.PlaneGeometry(8.4, 1.25), new THREE.MeshBasicMaterial({ map: canvasTex(1024, 152, (c, w, h) => {
    const third = w / 3;
    c.fillStyle = '#2b4fa8'; c.fillRect(0, 0, third, h);
    c.fillStyle = '#f4f1ea'; c.fillRect(third, 0, third, h);
    c.fillStyle = '#d23a3a'; c.fillRect(third * 2, 0, third, h);
    c.fillStyle = 'rgba(16,10,30,0.72)'; c.fillRect(0, 22, w, h - 44);
    c.font = '900 78px Fredoka, "Arial Rounded MT Bold", Arial, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillStyle = '#ffffff'; c.fillText('BIENVENUE EN FRANCE', w / 2, h / 2 + 4);
  }), side: THREE.DoubleSide }));
  welcome.position.set(BORDER_X + 0.5, 4.7, 0);
  scene.add(welcome);
  sign('GALPÓN DEL FONDO', GALPON_X + 18, 7.6, '#ff7a6b', 9);

  // Faroles con halo
  const glow = glowTex();
  const postMat = new THREE.MeshLambertMaterial({ color: 0x1d1b2b });
  const bulbMat = new THREE.MeshBasicMaterial({ color: 0xffe2a8 });
  const haloMat = new THREE.SpriteMaterial({ map: glow, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true });
  for (let x = 6; x < GALPON_X; x += 15) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.13, 4.2, 8), postMat);
    post.position.set(x, 2.1, -4.95);
    scene.add(post);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 10), bulbMat);
    bulb.position.set(x, 4.3, -4.95);
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

  // Buenos Aires: plátanos, contenedores verdes y una parada de colectivo
  const barkMat = new THREE.MeshLambertMaterial({ color: 0x8a7a63 });
  const crownMat = new THREE.MeshLambertMaterial({ color: 0x3f6b34 });
  for (let x = 10; x < BORDER_X - 4; x += 17) {
    if (Math.abs(x - LE_CONCEPT_X) < 9) continue;
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.24, 3.4, 8), barkMat);
    trunk.position.set(x, 1.7, -4.75);
    scene.add(trunk);
    for (const [dx, dy, r] of [[0, 4.2, 1.5], [-0.9, 3.7, 1.1], [0.9, 3.8, 1.15]]) {
      const crown = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), crownMat);
      crown.position.set(x + dx, dy, -4.9);
      scene.add(crown);
    }
  }
  const binMat = new THREE.MeshLambertMaterial({ color: 0x2f7d4a });
  for (const x of [20, 53, 87, 110]) {
    const bin = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.25, 0.9), binMat);
    bin.position.set(x, 0.79, -4.75);
    const lid = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.12, 1.0), new THREE.MeshLambertMaterial({ color: 0x23603a }));
    lid.position.set(x, 1.47, -4.75);
    scene.add(bin, lid);
  }
  const stopPole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 3, 6), postMat);
  stopPole.position.set(70, 1.5, -4.4);
  const stopSign = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.9), new THREE.MeshBasicMaterial({ map: canvasTex(128, 128, (c, w, h) => {
    c.fillStyle = '#f2c230'; c.beginPath(); c.arc(64, 64, 60, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#111'; c.font = '900 30px Arial'; c.textAlign = 'center'; c.fillText('PARADA', 64, 58); c.font = '900 34px Arial'; c.fillText('60', 64, 94);
  }), transparent: true }));
  stopSign.position.set(70, 3.1, -4.35);
  scene.add(stopPole, stopSign);

  // Guirnaldas tricolor en Francia
  const flagCols = [0x2b4fa8, 0xf4f1ea, 0xd23a3a];
  const flagGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-0.22, 0, 0), new THREE.Vector3(0.22, 0, 0), new THREE.Vector3(0, -0.45, 0)]);
  const flagMats = flagCols.map(c => new THREE.MeshBasicMaterial({ color: c, side: THREE.DoubleSide }));
  // En Buenos Aires los banderines son celestes y blancos (como la bandera)
  const baFlagMats = [0x74b9e8, 0xf4f1ea].map(c => new THREE.MeshBasicMaterial({ color: c, side: THREE.DoubleSide }));
  for (let a = 6; a < GALPON_X - 8; a += 22) {
    if (a + 18 > LE_CONCEPT_X - 11 && a < LE_CONCEPT_X + 11) continue;
    const inBA = a + 18 < BORDER_X;
    for (let k = 0; k <= 22; k++) {
      const t = k / 22, x = a + t * 18, y = 4.35 - Math.sin(t * Math.PI) * 0.7;
      const f = new THREE.Mesh(flagGeo, inBA ? baFlagMats[k % 2] : flagMats[k % 3]);
      f.position.set(x, y, -4.7);
      scene.add(f);
    }
  }

  // Macetas sobre la vereda francesa
  const potMat = new THREE.MeshLambertMaterial({ color: 0xb4643c });
  const leafMat = new THREE.MeshLambertMaterial({ color: 0x4f7a3c });
  for (let x = BORDER_X + 4; x < GALPON_X; x += 15) {
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.22, 0.5, 10), potMat);
    pot.position.set(x, 0.41, -5.0);
    const bush = new THREE.Mesh(new THREE.SphereGeometry(0.4, 10, 8), leafMat);
    bush.position.set(x, 0.95, -5.0);
    scene.add(pot, bush);
  }

  // Mesitas de Le Concept en la vereda y guirnalda de lucecitas
  const tableMat = new THREE.MeshLambertMaterial({ color: 0x2d2a2a });
  const clothMat = new THREE.MeshLambertMaterial({ color: 0xf4efe4 });
  for (const x of [LE_CONCEPT_X - 7.5, LE_CONCEPT_X - 5.5, LE_CONCEPT_X + 5.5, LE_CONCEPT_X + 7.5]) {
    const top = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.06, 14), clothMat);
    top.position.set(x, 0.95, -4.45);
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.95, 6), tableMat);
    leg.position.set(x, 0.47, -4.45);
    for (const sx of [-0.75, 0.75]) {
      const chair = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.9, 0.42), tableMat);
      chair.position.set(x + sx, 0.45, -4.45);
      scene.add(chair);
    }
    scene.add(top, leg);
  }
  const bulbGlow = new THREE.SpriteMaterial({ map: glowTex(), color: 0xffe2a8, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true });
  for (let k = 0; k <= 26; k++) {
    const t = k / 26, x = LE_CONCEPT_X - 9 + t * 18, y = 6.6 - Math.sin(t * Math.PI) * 0.9;
    const b = new THREE.Sprite(bulbGlow);
    b.scale.set(0.55, 0.55, 1);
    b.position.set(x, y, -4.3);
    scene.add(b);
  }

  // Fuente de la plaza
  const stone = new THREE.MeshLambertMaterial({ color: 0xd8c3a5 });
  const basin = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.4, 0.6, 24), stone);
  basin.position.set(220, 0.3, -6.6);
  const water = new THREE.Mesh(new THREE.CircleGeometry(2.0, 24), new THREE.MeshBasicMaterial({ color: 0x6fc7e8 }));
  water.rotation.x = -Math.PI / 2; water.position.set(220, 0.62, -6.6);
  const column = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.35, 2.2, 10), stone);
  column.position.set(220, 1.4, -6.6);
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
  door.position.set(SECRET_X, 0, BACK_Z + 0.25);
  scene.add(door);
  const pasajeSign = sign('PASSAGE SECRET', SECRET_X, 5.4, '#c084fc', 4.4);
  pasajeSign.position.z = BACK_Z + 0.5;

  // Barricadas de cajones y tambores (2,4 m): no se saltan; al despejar la zona se derrumban
  const crateTex = canvasTex(128, 128, (c, w, h) => {
    c.fillStyle = '#8a5a34'; c.fillRect(0, 0, w, h);
    c.fillStyle = '#6b4126'; for (let y = 0; y < h; y += 32) c.fillRect(0, y, w, 6);
    c.strokeStyle = '#4a2c18'; c.lineWidth = 8; c.strokeRect(4, 4, w - 8, h - 8);
    c.beginPath(); c.moveTo(8, 8); c.lineTo(w - 8, h - 8); c.stroke();
  });
  const tagTex = canvasTex(256, 128, (c, w, h) => {
    c.fillStyle = '#ffcc00'; c.fillRect(0, 0, w, h);
    for (let i = -h; i < w; i += 40) { c.fillStyle = '#111'; c.beginPath(); c.moveTo(i, 0); c.lineTo(i + 20, 0); c.lineTo(i + 20 + h, h); c.lineTo(i + h, h); c.fill(); }
    c.fillStyle = '#111'; c.fillRect(20, 34, w - 40, 60);
    c.font = '900 40px Arial'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#ffcc00';
    c.fillText('CERRADO', w / 2, 66);
  });
  const crateMat = new THREE.MeshLambertMaterial({ map: crateTex });
  const drumMat = new THREE.MeshLambertMaterial({ color: 0x3f5d7a });
  const signMat = new THREE.MeshBasicMaterial({ map: tagTex });
  const crateGeo = new THREE.BoxGeometry(1.15, 1.15, 1.15);
  const drumGeo = new THREE.CylinderGeometry(0.5, 0.5, 1.15, 14);
  // Piquete: cubiertas apiladas con fuego y humo
  const tireGeo = new THREE.TorusGeometry(0.42, 0.2, 8, 18);
  const tireMat = new THREE.MeshLambertMaterial({ color: 0x1b1b1f });
  const fireMat = new THREE.SpriteMaterial({ map: canvasTex(64, 128, (c, w, h) => {
    const g = c.createRadialGradient(w / 2, h * 0.75, 2, w / 2, h * 0.6, h * 0.6);
    g.addColorStop(0, 'rgba(255,250,200,1)'); g.addColorStop(0.3, 'rgba(255,170,40,0.95)'); g.addColorStop(0.7, 'rgba(230,60,20,0.5)'); g.addColorStop(1, 'rgba(200,30,10,0)');
    c.fillStyle = g; c.beginPath(); c.moveTo(w / 2, 0); c.quadraticCurveTo(w, h * 0.6, w / 2, h); c.quadraticCurveTo(0, h * 0.6, w / 2, 0); c.fill();
  }), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true });
  const smokeMat = new THREE.SpriteMaterial({ map: glowTex(), color: 0x2a2630, transparent: true, opacity: 0.5, depthWrite: false });
  const corteTex = canvasTex(256, 128, (c, w, h) => {
    c.fillStyle = '#c8a46a'; c.fillRect(0, 0, w, h);
    c.strokeStyle = '#7a5a30'; c.lineWidth = 6; c.strokeRect(6, 6, w - 12, h - 12);
    c.font = '900 56px "Comic Sans MS", Arial'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#222';
    c.fillText('CORTE', w / 2, h / 2 + 4);
  });
  function buildPiquete(g, pieces, fires) {
    for (let z = -3.4; z <= 3.5; z += 0.95) {
      for (let row = 0; row < 3; row++) {
        const m = new THREE.Mesh(tireGeo, tireMat);
        m.rotation.x = Math.PI / 2;
        m.position.set((Math.random() - 0.5) * 0.15, 0.2 + row * 0.4, z);
        g.add(m);
        pieces.push({ mesh: m, base: m.position.clone(), baseRot: m.rotation.clone(), v: new THREE.Vector3(), spin: new THREE.Vector3() });
      }
      const f = new THREE.Sprite(fireMat);
      f.position.set(0, 1.75, z); f.scale.set(1.1, 1.9, 1);
      const sm = new THREE.Sprite(smokeMat.clone());
      sm.position.set(0, 3.2, z); sm.scale.set(2.2, 2.2, 1);
      g.add(f, sm);
      fires.push({ fire: f, smoke: sm, seed: Math.random() * 10, z });
    }
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.8), new THREE.MeshBasicMaterial({ map: corteTex }));
    sign.position.set(-0.6, 1.6, 2.6);
    sign.rotation.set(-0.15, 0, 0.08);
    g.add(sign);
    pieces.push({ mesh: sign, base: sign.position.clone(), baseRot: sign.rotation.clone(), v: new THREE.Vector3(), spin: new THREE.Vector3() });
  }

  const gates = GATES.map(({ x, kind }) => {
    const g = new THREE.Group();
    const pieces = [];
    const fires = [];
    g.position.x = x;
    scene.add(g);
    if (kind === 'piquete') { buildPiquete(g, pieces, fires); return { x, kind, open: false, mesh: g, pieces, fires, t: 0 }; }
    let i = 0;
    for (let z = -3.4; z <= 3.5; z += 1.15) {
      for (let row = 0; row < 2; row++) {
        const drum = (i++ % 3) === 1 && row === 0;
        const m = new THREE.Mesh(drum ? drumGeo : crateGeo, drum ? drumMat : crateMat);
        m.position.set((row ? 0.08 : -0.05) * ((i % 2) * 2 - 1), 0.58 + row * 1.15, z);
        m.rotation.y = (Math.random() - 0.5) * 0.25;
        g.add(m);
        pieces.push({ mesh: m, base: m.position.clone(), baseRot: m.rotation.clone(), v: new THREE.Vector3(), spin: new THREE.Vector3() });
      }
    }
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.9), signMat);
    sign.position.set(0, 2.75, 1.2);
    sign.rotation.x = -0.25;
    g.add(sign);
    pieces.push({ mesh: sign, base: sign.position.clone(), baseRot: sign.rotation.clone(), v: new THREE.Vector3(), spin: new THREE.Vector3() });
    return { x, kind, open: false, mesh: g, pieces, fires, t: 0 };
  });

  // Animación del derrumbe (se llama en cada cuadro)
  let fireClock = 0;
  function updateGates(dt) {
    fireClock += dt;
    for (const g of gates) {
      // El fuego del piquete titila mientras el corte sigue; al levantarse se apaga
      for (const f of g.fires) {
        const k = g.open ? Math.max(0, 1 - g.t * 1.5) : 1;
        const flick = 0.85 + Math.sin(fireClock * 13 + f.seed) * 0.12 + Math.sin(fireClock * 29 + f.seed * 2) * 0.06;
        f.fire.scale.set(1.1 * k, 1.9 * flick * k, 1);
        f.fire.material.opacity = k;
        const rise = (fireClock * 0.6 + f.seed) % 1;
        f.smoke.position.y = 2.6 + rise * 2.4;
        f.smoke.material.opacity = 0.45 * (1 - rise) * k;
      }
      if (!g.open || !g.mesh.visible) continue;
      if (g.t === 0) {
        for (const p of g.pieces) {
          p.v.set(2 + Math.random() * 4, 2 + Math.random() * 4, (Math.random() - 0.5) * 3);
          p.spin.set(Math.random() * 6, Math.random() * 4, -3 - Math.random() * 5);
        }
      }
      g.t += dt;
      for (const p of g.pieces) {
        p.v.y -= 18 * dt;
        p.mesh.position.addScaledVector(p.v, dt);
        if (p.mesh.position.y < 0.5) { p.mesh.position.y = 0.5; p.v.y *= -0.3; p.v.x *= 0.7; }
        p.mesh.rotation.x += p.spin.x * dt;
        p.mesh.rotation.z += p.spin.z * dt;
      }
      if (g.t > 1.3) g.mesh.visible = false;
    }
  }

  function resetGates() {
    for (const g of gates) {
      g.open = false; g.t = 0; g.mesh.visible = true;
      for (const p of g.pieces) { p.mesh.position.copy(p.base); p.mesh.rotation.copy(p.baseRot); }
    }
  }

  const secret = { x: SECRET_X, halfWidth: 1.4, doorZ: BACK_Z + 0.6, found: false, sealed: true };

  // Mantiene una posición dentro de la calle, respetando portones y el pasaje
  // prevX: dónde estaba antes de moverse. Decide de qué lado del portón queda;
  // sin él, un paso largo que cae pasando la mitad del portón lo cruzaba.
  // Límites del nivel actual: en el Nivel 1 no se cruza a Francia; en el 2 no se vuelve
  const bounds = { ...STREET, minX: LEVELS[0].minX, maxX: LEVELS[0].maxX };
  function setLevelBounds(minX, maxX) { bounds.minX = minX; bounds.maxX = maxX; }
  function clampPosition(pos, radius = 0.4, prevX = null) {
    pos.x = Math.min(bounds.maxX, Math.max(bounds.minX, pos.x));
    const inDoor = !secret.sealed && Math.abs(pos.x - secret.x) < secret.halfWidth;
    pos.z = Math.min(STREET.maxZ, Math.max(inDoor ? secret.doorZ : STREET.minZ, pos.z));
    for (const g of gates) {
      if (g.open) continue;
      const from = prevX ?? pos.x;
      if (from < g.x && pos.x > g.x - radius) pos.x = g.x - radius;
      else if (from >= g.x && pos.x < g.x + radius) pos.x = g.x + radius;
    }
    return pos;
  }

  return { bounds: STREET, levelBounds: bounds, zones: ZONES, colliders: [], gates, secret, leConcept, clampPosition, setLevelBounds, updateGates, resetGates, galponX: GALPON_X };
}
