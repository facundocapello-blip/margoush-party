// Malos nuevos armados a partir del secuaz (courier): se recolorea la ropa por código
// y se pinta un accesorio encima de la caja que lleva en la mano.
// Coordenadas en píxeles de courier.webp (936 × 1024).

const SKINS = {
  patovica: { jacket: { h: 250, s: 0.12, l: 0.35 }, cap: { h: 250, s: 0.1, l: 0.35 }, paint: patovica },
  bombo: { jacket: { h: 200, s: 0.65, l: 1.25 }, cap: { h: 0, s: 0, l: 2.2 }, paint: bombo },
  mozo: { jacket: { h: 40, s: 0.08, l: 2.3 }, cap: { h: 0, s: 0, l: 0.3 }, paint: mozo },
  delivery: { jacket: { h: 145, s: 0.7, l: 1.15 }, cap: { h: 145, s: 0.7, l: 1.0 }, paint: delivery },
  manifestante: { jacket: { h: 215, s: 0.25, l: 1.1 }, cap: { h: 30, s: 0.15, l: 1.2 }, paint: null }
};

function rgb2hsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min, s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, s, l];
}
function hsl2rgb(h, s, l) {
  const k = (n) => (n + h / 30) % 12, a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [f(0) * 255, f(8) * 255, f(4) * 255];
}

function recolor(ctx, w, h, skin) {
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] < 10) continue;
    const y = (i / 4 / w) | 0;
    const [hh, ss, ll] = rgb2hsl(d[i], d[i + 1], d[i + 2]);
    let t = null;
    if ((hh >= 325 || hh <= 14) && ss > 0.22 && ll < 0.55 && y > 290 && y < 660) t = skin.jacket;      // campera bordó
    else if (hh >= 200 && hh <= 255 && ss > 0.2 && y < 270) t = skin.cap;                                // gorra azul
    if (!t) continue;
    const [r, g, b] = hsl2rgb(t.h, t.s, Math.min(0.95, ll * t.l));
    d[i] = r; d[i + 1] = g; d[i + 2] = b;
  }
  ctx.putImageData(img, 0, 0);
}

function patovica(c) {
  // Anteojos negros, auricular y la lista VIP en lugar de la caja
  c.fillStyle = '#0d0d12';
  c.beginPath(); c.roundRect(520, 186, 120, 44, 14); c.fill();
  c.fillRect(470, 196, 60, 10);
  c.fillStyle = 'rgba(255,255,255,0.35)'; c.fillRect(540, 194, 26, 6);
  c.strokeStyle = '#1a1a1a'; c.lineWidth = 5; c.beginPath(); c.moveTo(455, 250); c.quadraticCurveTo(430, 320, 470, 345); c.stroke();
  c.fillStyle = '#16151c'; c.beginPath(); c.roundRect(560, 405, 150, 185, 10); c.fill();
  c.fillStyle = '#f4efe4'; c.fillRect(576, 440, 118, 136);
  c.fillStyle = '#9a9aa5'; c.fillRect(605, 396, 60, 22);
  c.fillStyle = '#111'; c.font = '900 50px Arial'; c.textAlign = 'center'; c.fillText('VIP', 635, 500);
  c.fillStyle = '#777'; for (let y = 520; y < 570; y += 14) c.fillRect(590, y, 90, 5);
}

function bombo(c) {
  // Bombo blanco con aros celestes y un palillo
  c.save(); c.beginPath(); c.ellipse(660, 505, 145, 125, 0, 0, Math.PI * 2); c.clip();
  c.fillStyle = '#e9edf2'; c.fillRect(500, 370, 330, 270);
  c.fillStyle = '#6cb7e6'; c.fillRect(500, 400, 330, 30); c.fillRect(500, 580, 330, 30);
  c.strokeStyle = '#3a5d7a'; c.lineWidth = 7;
  for (let x = 525; x < 820; x += 40) { c.beginPath(); c.moveTo(x, 430); c.lineTo(x + 20, 580); c.stroke(); }
  c.restore();
  c.strokeStyle = '#2a2a2a'; c.lineWidth = 8; c.beginPath(); c.ellipse(660, 505, 145, 125, 0, 0, Math.PI * 2); c.stroke();
  c.strokeStyle = '#8a5a34'; c.lineWidth = 12; c.beginPath(); c.moveTo(700, 380); c.lineTo(790, 300); c.stroke();
  c.fillStyle = '#f4efe4'; c.beginPath(); c.arc(795, 295, 16, 0, Math.PI * 2); c.fill();
}

function mozo(c) {
  // Boina, moño y bandeja con croissants
  c.fillStyle = '#121216'; c.beginPath(); c.ellipse(500, 120, 175, 82, -0.12, 0, Math.PI * 2); c.fill();
  c.fillRect(495, 30, 12, 26);
  c.fillStyle = '#b3242e'; c.beginPath(); c.moveTo(470, 340); c.lineTo(430, 318); c.lineTo(430, 362); c.closePath(); c.fill();
  c.beginPath(); c.moveTo(470, 340); c.lineTo(510, 318); c.lineTo(510, 362); c.closePath(); c.fill();
  c.fillStyle = '#c9ccd4'; c.beginPath(); c.ellipse(650, 420, 150, 26, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#9da1ab'; c.beginPath(); c.ellipse(650, 428, 150, 18, 0, 0, Math.PI); c.fill();
  for (const [x, y] of [[590, 395], [660, 385], [720, 398]]) {
    c.fillStyle = '#d9912f'; c.beginPath(); c.ellipse(x, y, 38, 20, -0.2, 0, Math.PI * 2); c.fill();
    c.strokeStyle = '#9a5a1a'; c.lineWidth = 4; for (let k = -1; k <= 1; k++) { c.beginPath(); c.moveTo(x + k * 14, y - 18); c.lineTo(x + k * 14 + 6, y + 18); c.stroke(); }
  }
}

function delivery(c) {
  // Caja térmica verde con letras
  c.fillStyle = '#1f9e5a'; c.beginPath(); c.roundRect(548, 410, 182, 175, 14); c.fill();
  c.fillStyle = '#157544'; c.fillRect(548, 410, 182, 30);
  c.fillStyle = '#ffffff'; c.font = '900 30px Arial'; c.textAlign = 'center'; c.fillText('DELIVERY', 639, 510);
  c.beginPath(); c.arc(639, 548, 16, 0, Math.PI * 2); c.fill();
}

// Agrega al catálogo de recursos una textura por tipo: courier_<tipo>
export function registerSkins(assets) {
  const base = assets.texture('courier').image;
  const meta = assets.meta('courier');
  for (const [kind, skin] of Object.entries(SKINS)) {
    const c = document.createElement('canvas');
    c.width = meta.w; c.height = meta.h;
    const g = c.getContext('2d', { willReadFrequently: true });
    g.drawImage(base, 0, 0, meta.w, meta.h);
    recolor(g, meta.w, meta.h, skin);
    if (skin.paint) skin.paint(g);
    const tex = new THREE.CanvasTexture(c);
    tex.encoding = THREE.sRGBEncoding;
    tex.anisotropy = 4;
    assets.add('courier_' + kind, tex, { ...meta });
  }
}
