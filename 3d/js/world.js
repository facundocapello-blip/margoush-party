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

// Locales icónicos de Buenos Aires (Punto de Oro, Le Blé, HENRIS; más Le Concept VIP) y París (Roland Garros, Granja de Maese LaPadite).
const LANDMARKS = [
  { id: 'punto_de_oro', x: 34, w: 9.2 },
  { id: 'le_ble', x: 86, w: 8.6 },
  { id: 'henris', x: 104, w: 7.4 },
  { id: 'roland_garros', x: 190, w: 10.2 },
  { id: 'granja_lapadite', x: 230, w: 10.4 }
];
function landmarkPainter(id) {
  return (c, w, h) => {
    const sign = (text, y, bg, fg, font, border) => {
      c.fillStyle = bg; c.beginPath(); c.roundRect(w * 0.12, y, w * 0.76, 110, 16); c.fill();
      if (border) { c.lineWidth = 8; c.strokeStyle = border; c.stroke(); }
      c.font = font; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.shadowColor = fg; c.shadowBlur = 18; c.fillStyle = fg; c.fillText(text, w / 2, y + 60); c.shadowBlur = 0;
    };
    if (id === 'granja_lapadite') {
      // Granja rural francesa de Maese LaPadite (Inglourious Basterds): cielo cálido, piedra, tejas, sábanas y tarros de leche
      const sky = c.createLinearGradient(0, 0, 0, h * 0.45);
      sky.addColorStop(0, '#4f79b8'); sky.addColorStop(1, '#f4d3a1');
      c.fillStyle = sky; c.fillRect(0, 0, w, h);
      c.fillStyle = '#4e7c3e';
      c.beginPath(); c.ellipse(w * 0.5, h * 0.62, w * 0.72, h * 0.34, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#d9c5a3'; c.fillRect(w * 0.16, h * 0.36, w * 0.68, h * 0.64);
      c.fillStyle = 'rgba(110,85,55,0.25)';
      for (let py = h * 0.4; py < h; py += 28) for (let px = w * 0.18; px < w * 0.82; px += 52) {
        c.fillRect(px + ((py / 28) % 2 ? 16 : 0), py, 36, 18);
      }
      c.fillStyle = '#9c432b';
      c.beginPath(); c.moveTo(w * 0.1, h * 0.4); c.lineTo(w * 0.5, h * 0.14); c.lineTo(w * 0.9, h * 0.4); c.closePath(); c.fill();
      c.strokeStyle = '#6b2a19'; c.lineWidth = 6; c.stroke();
      for (const wx of [w * 0.24, w * 0.64]) {
        c.fillStyle = '#4e677a'; c.fillRect(wx - 22, h * 0.52, 22, 92); c.fillRect(wx + 88, h * 0.52, 22, 92);
        c.fillStyle = '#ffdf9a'; c.fillRect(wx, h * 0.52, 88, 92);
        c.strokeStyle = '#5a3a22'; c.lineWidth = 6; c.strokeRect(wx, h * 0.52, 88, 92);
      }
      c.fillStyle = '#6d4426'; c.fillRect(w * 0.43, h * 0.58, w * 0.14, h * 0.42);
      c.strokeStyle = '#3e2412'; c.lineWidth = 6; c.strokeRect(w * 0.43, h * 0.58, w * 0.14, h * 0.42);
      c.strokeStyle = '#4a3a2a'; c.lineWidth = 3;
      c.beginPath(); c.moveTo(w * 0.02, h * 0.62); c.quadraticCurveTo(w * 0.1, h * 0.67, w * 0.18, h * 0.6); c.stroke();
      for (const sx of [w * 0.04, w * 0.1]) {
        c.fillStyle = '#fbfaf5'; c.beginPath(); c.roundRect(sx, h * 0.63, 38, 66, 6); c.fill();
      }
      for (const mx of [w * 0.37, w * 0.6]) {
        c.fillStyle = '#b9c4cf'; c.fillRect(mx, h * 0.84, 24, 52);
        c.fillStyle = '#8b99a8'; c.fillRect(mx + 4, h * 0.79, 16, 8);
      }
      sign('FERME LAPADITE', h * 0.42, '#4b2e19', '#fff1cf', '900 54px Georgia, "Times New Roman", serif', '#d9a452');
    } else if (id === 'le_ble') {
      c.fillStyle = '#efe3c8'; c.fillRect(0, 0, w, h);
      c.fillStyle = 'rgba(120,90,50,0.15)'; for (let y = 0; y < h; y += 40) c.fillRect(0, y, w, 3);
      // toldo a rayas
      for (let x = 0; x < w; x += 64) { c.fillStyle = (x / 64) % 2 ? '#f4efe4' : '#2f5d43'; c.fillRect(x, h * 0.53, 64, 44); }
      c.fillStyle = 'rgba(0,0,0,0.2)'; c.fillRect(0, h * 0.53 + 40, w, 8);
      // vidriera con panes
      const vg = c.createLinearGradient(0, h * 0.56, 0, h); vg.addColorStop(0, '#ffe7b0'); vg.addColorStop(1, '#f0a85a');
      c.fillStyle = '#4a3226'; c.fillRect(20, h * 0.62, w - 40, h * 0.38);
      c.fillStyle = vg; c.fillRect(40, h * 0.65, w * 0.56, h * 0.31);
      c.font = '64px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif'; c.textAlign = 'center';
      for (const [k, e] of ['🥖', '🥐', '🍞', '🥐', '🎂', '🥖'].entries()) c.fillText(e, 90 + (k % 3) * (w * 0.17), h * 0.77 + Math.floor(k / 3) * 70);
      c.fillStyle = '#6b4a33'; c.fillRect(w * 0.68, h * 0.65, w * 0.24, h * 0.35);
      sign('Le Blé', h * 0.3, '#2f5d43', '#fff3d6', 'italic 700 86px Georgia, "Times New Roman", serif', '#e9c46a');
    } else if (id === 'punto_de_oro') {
      c.fillStyle = '#1d2b3a'; c.fillRect(0, 0, w, h);
      // alambrado y luces de las canchas
      c.strokeStyle = 'rgba(200,220,230,0.35)'; c.lineWidth = 2;
      for (let x = -h; x < w; x += 26) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x + h * 0.45, h * 0.45); c.stroke(); c.beginPath(); c.moveTo(x + h * 0.45, 0); c.lineTo(x, h * 0.45); c.stroke(); }
      for (const lx of [w * 0.15, w * 0.85]) { c.fillStyle = '#ddd'; c.fillRect(lx - 4, 20, 8, h * 0.4); const g = c.createRadialGradient(lx, 40, 4, lx, 40, 90); g.addColorStop(0, 'rgba(255,255,230,1)'); g.addColorStop(1, 'rgba(255,255,230,0)'); c.fillStyle = g; c.fillRect(lx - 90, 0, 180, 140); }
      c.fillStyle = '#e8e4da'; c.fillRect(0, h * 0.45, w, h * 0.55);
      c.fillStyle = '#2e8b57'; c.fillRect(0, h * 0.45, w, 18);
      c.fillStyle = '#3a3a44'; c.fillRect(w * 0.3, h * 0.66, w * 0.4, h * 0.34);
      c.fillStyle = 'rgba(255,255,255,0.1)'; for (let x = w * 0.3; x < w * 0.7; x += 18) c.fillRect(x, h * 0.66, 4, h * 0.34);
      c.font = '70px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif'; c.textAlign = 'center';
      c.fillText('🎾', w * 0.15, h * 0.82); c.fillText('🏓', w * 0.85, h * 0.82);
      sign('Punto de Oro', h * 0.36, '#121a24', '#ffd36e', '900 74px Fredoka, "Arial Rounded MT Bold", Arial, sans-serif', '#ffd36e');
    } else {
      c.fillStyle = '#2a2433'; c.fillRect(0, 0, w, h);
      c.fillStyle = 'rgba(255,255,255,0.06)'; for (let y = 30; y < h; y += 60) c.fillRect(0, y, w, 6);
      // ventanales con cuadros de marco dorado
      for (let k = 0; k < 2; k++) {
        const x = 40 + k * (w * 0.5), y = h * 0.56, ww = w * 0.42, hh = h * 0.42;
        c.fillStyle = '#ffe9c2'; c.fillRect(x, y, ww, hh);
        const pal = [['#c8553d', '#2a6f97'], ['#588157', '#e9c46a']][k];
        for (let j = 0; j < 2; j++) {
          const fx = x + 20 + j * ww / 2, fy = y + 26, fw = ww / 2 - 40, fh = hh * 0.6;
          c.fillStyle = '#c9a227'; c.fillRect(fx - 8, fy - 8, fw + 16, fh + 16);
          c.fillStyle = pal[j]; c.fillRect(fx, fy, fw, fh);
          c.fillStyle = 'rgba(255,255,255,0.35)'; c.beginPath(); c.arc(fx + fw * 0.5, fy + fh * 0.45, fh * 0.22, 0, Math.PI * 2); c.fill();
        }
      }
      sign('HENRIS', h * 0.3, '#15111c', '#f1d48a', '700 92px Georgia, "Times New Roman", serif', '#c9a227');
    }
  };
}

// Asfalto porteño pintado por código (64 px por metro; el piso arranca 5,4 m detrás de z = 0).
// Capas: base con manchas grandes, huellas lustradas de las ruedas, parches de bacheo, fisuras,
// granito, tapa de cloaca, cordón cuneta con rejilla y la línea central gastada.
const PPM = 64;
function asphalt(ctx, w, h) {
  let seed = 11;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  const zy = (z) => (5.4 + z) * PPM; // z del mundo → fila de la textura
  ctx.fillStyle = '#433f49'; ctx.fillRect(0, 0, w, h);
  // manchas grandes de tono (el asfalto nunca es parejo)
  for (let n = 0; n < 26; n++) {
    const x = rnd() * w, y = zy(-3.8) + rnd() * (zy(4.2) - zy(-3.8)), r = 60 + rnd() * 170;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    const warm = rnd() < 0.5;
    g.addColorStop(0, warm ? 'rgba(92,72,84,0.35)' : 'rgba(28,24,40,0.35)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    for (const dx of [-w, 0, w]) { ctx.fillStyle = g; ctx.save(); ctx.translate(dx, 0); ctx.fillRect(x - r, y - r, r * 2, r * 2); ctx.restore(); }
  }
  // huellas de las ruedas: dos franjas por carril, más lisas y claras
  for (const z of [-2.55, -1.15, 1.15, 2.55]) {
    const y = zy(z), g = ctx.createLinearGradient(0, y - 26, 0, y + 26);
    g.addColorStop(0, 'rgba(120,108,128,0)'); g.addColorStop(0.5, 'rgba(120,108,128,0.16)'); g.addColorStop(1, 'rgba(120,108,128,0)');
    ctx.fillStyle = g; ctx.fillRect(0, y - 26, w, 52);
  }
  // parches de bacheo: rectángulos más oscuros con la junta clara
  for (const [x0, z0, pw, ph] of [[90, -2.9, 210, 1.4], [640, 1.4, 260, 1.7], [880, -1.1, 120, 0.9]]) {
    // borde irregular (cortado a mano) y apenas más oscuro que el resto
    const y0 = zy(z0), hh = ph * PPM, pts = [];
    for (let k = 0; k <= 8; k++) pts.push([x0 + pw * k / 8, y0 + (rnd() - 0.5) * 5]);
    for (let k = 1; k <= 4; k++) pts.push([x0 + pw + (rnd() - 0.5) * 5, y0 + hh * k / 4]);
    for (let k = 7; k >= 0; k--) pts.push([x0 + pw * k / 8, y0 + hh + (rnd() - 0.5) * 5]);
    for (let k = 3; k >= 1; k--) pts.push([x0 + (rnd() - 0.5) * 5, y0 + hh * k / 4]);
    ctx.beginPath(); pts.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py))); ctx.closePath();
    ctx.fillStyle = 'rgba(30,25,38,0.55)'; ctx.fill();
    ctx.strokeStyle = 'rgba(140,128,142,0.18)'; ctx.lineWidth = 2; ctx.stroke();
  }
  // granito: dos tamaños, tintes fríos y cálidos
  for (let n = 0; n < 14000; n++) {
    const l = 46 + rnd() * 70, s = rnd() < 0.85 ? 2 : 3, warm = rnd() < 0.4;
    ctx.fillStyle = `rgba(${l + (warm ? 14 : 0)},${l - 4},${l + (warm ? 0 : 14)},${0.25 + rnd() * 0.35})`;
    ctx.fillRect(rnd() * w, rnd() * h, s, s);
  }
  // fisuras: líneas quebradas oscuras con un borde claro
  const crack = (x, y, len, dir) => {
    const pts = [[x, y]];
    for (let i = 0; i < len; i++) { x += Math.cos(dir) * (8 + rnd() * 10); y += Math.sin(dir) * (8 + rnd() * 10); dir += (rnd() - 0.5) * 0.9; pts.push([x, y]); }
    for (const [col, lw, oy] of [['rgba(170,156,170,0.25)', 3, 1.5], ['rgba(14,10,20,0.8)', 2, 0]]) {
      ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.beginPath();
      pts.forEach(([px, py], i) => (i ? ctx.lineTo(px, py + oy) : ctx.moveTo(px, py + oy))); ctx.stroke();
    }
    if (rnd() < 0.7) { const [bx, by] = pts[(pts.length / 2) | 0]; crack(bx, by, (len / 2) | 0, dir + (rnd() < 0.5 ? 1 : -1)); }
  };
  for (const [x, z, len, dir] of [[300, -2.2, 14, 0.3], [520, 2.0, 18, -0.2], [760, -0.6, 10, 2.6], [40, 2.9, 12, 0.1], [960, -3.0, 9, 1.2]]) crack(x, zy(z), len, dir);
  // tapa de cloaca
  const mx = 430, my = zy(2.15), mr = 0.42 * PPM;
  ctx.fillStyle = '#25202b'; ctx.beginPath(); ctx.arc(mx, my, mr + 6, 0, Math.PI * 2); ctx.fill();
  const mg = ctx.createRadialGradient(mx - 8, my - 10, 4, mx, my, mr);
  mg.addColorStop(0, '#6a6070'); mg.addColorStop(1, '#3d3542'); ctx.fillStyle = mg;
  ctx.beginPath(); ctx.arc(mx, my, mr, 0, Math.PI * 2); ctx.fill();
  ctx.save(); ctx.beginPath(); ctx.arc(mx, my, mr - 4, 0, Math.PI * 2); ctx.clip();
  ctx.strokeStyle = 'rgba(30,24,34,0.7)'; ctx.lineWidth = 3;
  for (let k = -mr; k <= mr; k += 9) { ctx.beginPath(); ctx.moveTo(mx + k, my - mr); ctx.lineTo(mx + k + 6, my + mr); ctx.stroke(); }
  ctx.restore();
  // cordón cuneta de hormigón contra la vereda, con su rejilla
  const gy0 = zy(-3.85), gy1 = zy(-3.3);
  const cg = ctx.createLinearGradient(0, gy0, 0, gy1);
  cg.addColorStop(0, '#8d8590'); cg.addColorStop(0.8, '#6f6874'); cg.addColorStop(1, '#4a4350');
  ctx.fillStyle = cg; ctx.fillRect(0, gy0, w, gy1 - gy0);
  ctx.fillStyle = 'rgba(30,24,36,0.5)'; for (let x = 0; x < w; x += 2 * PPM) ctx.fillRect(x, gy0, 3, gy1 - gy0);
  ctx.fillStyle = '#1c1722'; ctx.fillRect(700, gy0 + 4, 1.1 * PPM, gy1 - gy0 - 8);
  ctx.fillStyle = '#5e5664'; for (let x = 706; x < 700 + 1.1 * PPM; x += 9) ctx.fillRect(x, gy0 + 6, 4, gy1 - gy0 - 12);
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(0, gy1, w, 5);
  // línea central discontinua, gastada (le faltan pedazos de pintura)
  const ly = zy(0), dash = 3.2 * PPM, period = w / 3;
  for (let x = 30; x < w; x += period) {
    ctx.fillStyle = 'rgba(244,234,214,0.8)'; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, ly - 5, dash, 10, 3) : ctx.rect(x, ly - 5, dash, 10); ctx.fill();
    ctx.fillStyle = 'rgba(59,52,67,0.85)';
    for (let n = 0; n < 12; n++) { ctx.beginPath(); ctx.ellipse(x + rnd() * dash, ly - 4 + rnd() * 8, 2 + rnd() * 6, 1.5 + rnd() * 2.5, rnd() * 3, 0, Math.PI * 2); ctx.fill(); }
  }
}

// Senda peatonal: barras blancas gastadas cruzando toda la calle (se pega encima del asfalto)
function zebra(ctx, w, h) {
  let seed = 5;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  const bar = h / 15;
  for (let i = 0; i < 15; i += 2) {
    ctx.fillStyle = 'rgba(240,232,218,0.9)'; ctx.fillRect(0, i * bar + 2, w, bar - 4);
    ctx.globalCompositeOperation = 'destination-out';
    for (let n = 0; n < 22; n++) { ctx.beginPath(); ctx.ellipse(rnd() * w, i * bar + rnd() * bar, 3 + rnd() * 9, 2 + rnd() * 4, rnd() * 3, 0, Math.PI * 2); ctx.fill(); }
    ctx.globalCompositeOperation = 'source-over';
  }
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

// Pintura del galpón de la guía, repetida a lo ancho de la pared
function galponTex(assets) {
  const t = assets.texture('galpon').clone();
  t.needsUpdate = true; t.wrapS = THREE.RepeatWrapping; t.repeat.set(70 / (13 * assets.meta('galpon').w / assets.meta('galpon').h), 1);
  return t;
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

// Lugares de la vereda porteña donde no se tapa ningún local: las columnas entre casitas de la pintura
// `calle_buenos_aires` (tres casitas por imagen; bordes en u = 0, 0,328 y 0,676), fuera de los locales famosos,
// de Le Concept y de la frontera. Sin la pintura, cada 17 m como antes.
export const BA_SEAMS_U = [0, 0.328, 0.676];
export function streetSpotsBA(assets, { lcLeft, lcRight }) {
  const blocked = [[lcLeft - 2.5, lcRight + 2.5], [BORDER_X - 5, Infinity],
    ...LANDMARKS.map(L => [L.x - L.w / 2 - 1.9, L.x + L.w / 2 + 1.9])];
  const free = (x) => !blocked.some(([a, b]) => x > a && x < b);
  const out = [];
  if (assets.has?.('calle_buenos_aires')) {
    const m = assets.meta('calle_buenos_aires'), PW = 9.3 * m.w / m.h;
    for (const [from, to] of [[-7, lcLeft], [lcRight, BORDER_X]]) {
      for (let x0 = from; x0 < to - 0.01; x0 += PW) {
        for (const u of BA_SEAMS_U) { const x = x0 + u * PW; if (x > from + 0.5 && x < to - 0.5 && free(x)) out.push(x); }
      }
    }
  } else {
    for (let x = 10; x < BORDER_X - 4; x += 17) if (free(x)) out.push(x);
  }
  return out.sort((a, b) => a - b);
}

export function buildStreet(scene, assets) {
  scene.background = new THREE.Color(0x2c2350);
  scene.fog = new THREE.Fog(0x2c2350, 30, 75);
  const hemi = new THREE.HemisphereLight(0x9a8ce0, 0x4a3020, 1.0);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffd9a8, 0.55);
  sun.position.set(-20, 30, 25);
  scene.add(sun);

  // Piso: asfalto porteño hasta la frontera, adoquines franceses hasta el galpón
  const baLen = BORDER_X + 20;
  // 22 m de fondo × 64 px/m = 1408 px; cada copia cubre 16 m de calle (1024 px)
  const asphaltFloor = new THREE.Mesh(new THREE.PlaneGeometry(baLen, 22), new THREE.MeshLambertMaterial({ color: 0xd8d0d4, map: canvasTex(1024, 1408, asphalt, baLen / 16, 1) }));
  asphaltFloor.rotation.x = -Math.PI / 2;
  asphaltFloor.position.set(BORDER_X - baLen / 2, 0, 5.6);
  scene.add(asphaltFloor);
  // Sendas peatonales: en la parada del colectivo y antes de Le Concept
  const zebraMat = new THREE.MeshLambertMaterial({ color: 0xc9c2cf, map: canvasTex(256, 512, zebra), transparent: true, depthWrite: false });
  for (const x of [74, 124]) {
    const zb = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 7.2), zebraMat);
    zb.rotation.x = -Math.PI / 2; zb.position.set(x, 0.012, 0.25);
    scene.add(zb);
  }
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
  const lcH = 9, lcW = 1.65 * lcH * ((U_LC[1] - U_LC[0]) * bgMeta.w) / (bgMeta.h * 0.835);
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
  if (assets.has?.('calle_buenos_aires')) {
    // Buenos Aires: alterna las casitas coloridas de Caminito (KIOSCO, PIZZERÍA, PARRILLA…) con calle_buenos_aires para que cada cuadra sea distinta
    const t = assets.texture('calle_buenos_aires'), m = assets.meta('calle_buenos_aires');
    const PH = 9.3, PW = PH * m.w / m.h, mat = new THREE.MeshBasicMaterial({ map: t, fog: false });
    const baMats = [0, 1, 2, 3, 4, 5].map(i => new THREE.MeshBasicMaterial({ map: canvasTex(512, 512, porteno(i)), fog: false }));
    const BW = 7.4, BH = 8.4;
    let bi = 0;
    for (const [from, to] of [[-7, lcLeft], [lcRight, BORDER_X]]) {
      let x0 = from, step = 0;
      while (x0 < to - 0.01) {
        if (step++ % 2 === 0) {
          const w = Math.min(BW, to - x0);
          const mesh = new THREE.Mesh(new THREE.PlaneGeometry(BW, BH), baMats[bi++ % baMats.length]);
          mesh.position.set(x0 + w / 2, BH / 2, BACK_Z - 0.02);
          if (w < BW) mesh.scale.x = w / BW;
          scene.add(mesh);
          x0 += w;
        } else {
          const w = Math.min(PW, to - x0);
          const mesh = new THREE.Mesh(new THREE.PlaneGeometry(PW, PH), mat);
          mesh.position.set(x0 + w / 2, PH / 2, BACK_Z - 0.02);
          if (w < PW) mesh.scale.x = w / PW;
          scene.add(mesh);
          x0 += w;
        }
      }
    }
  } else {
    const kBA = portenoRun(-7, lcLeft);
    portenoRun(lcRight, BORDER_X, kBA);
  }
  // Locales famosos, un poco adelante de las casitas
  for (const L of LANDMARKS) {
    const painted = assets.has?.(L.id);
    const tex = painted ? assets.texture(L.id) : canvasTex(768, 512, landmarkPainter(L.id));
    const aspect = painted ? assets.meta(L.id).w / assets.meta(L.id).h : 1.5;
    const H = L.w / aspect;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(L.w, H), new THREE.MeshBasicMaterial({ map: tex, fog: false }));
    m.position.set(L.x, H / 2, BACK_Z + 0.3);
    m.userData.landmark = L.id;
    scene.add(m);
    if (L.id === 'punto_de_oro') {
      // Cartel luminoso 🎾 PUNTO DE ORO bien visible sobre el club de pádel
      const poSign = new THREE.Mesh(new THREE.PlaneGeometry(5.8, 1.15), new THREE.MeshBasicMaterial({ map: canvasTex(1024, 196, (c, w, h) => {
        c.fillStyle = '#0f2038'; c.beginPath(); c.roundRect(6, 6, w - 12, h - 12, 22); c.fill();
        c.lineWidth = 9; c.strokeStyle = '#5ee08a'; c.stroke();
        c.font = '900 84px Fredoka, "Arial Rounded MT Bold", Arial, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.shadowColor = '#5ee08a'; c.shadowBlur = 22; c.fillStyle = '#ffd36e';
        c.fillText('🎾 PUNTO DE ORO', w / 2, h / 2 + 4);
      }), transparent: true, fog: false }));
      poSign.position.set(L.x, 3.85, BACK_Z + 0.7);
      scene.add(poSign);
    }
  }
  // Cielo porteño detrás de las casitas (atardecer cálido) y el Obelisco a lo lejos
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

  // LE CONCEPT VIP: el local más elegante y vistoso de Buenos Aires (el restaurante de Marine)
  const leConcept = new THREE.Group();
  leConcept.userData.leConcept = true;
  const front = new THREE.Mesh(new THREE.PlaneGeometry(lcW, lcH), new THREE.MeshBasicMaterial({ map: crop(U_LC[0], U_LC[1], 0.165), fog: false }));
  front.position.set(0, lcH / 2, 0);
  const sideMat = new THREE.MeshBasicMaterial({ color: 0x1a2644, fog: false });
  for (const sx of [-1, 1]) {
    const sidePanel = new THREE.Mesh(new THREE.PlaneGeometry(0.95, lcH), sideMat);
    sidePanel.rotation.y = sx * Math.PI / 2;
    sidePanel.position.set(sx * lcW / 2, lcH / 2, -0.45);
    leConcept.add(sidePanel);
  }
  const lcSign = new THREE.Mesh(new THREE.PlaneGeometry(7.2, 1.3), new THREE.MeshBasicMaterial({ map: canvasTex(1024, 192, (c, w, h) => {
    c.fillStyle = '#111f3f'; c.beginPath(); c.roundRect(6, 6, w - 12, h - 12, 22); c.fill();
    c.lineWidth = 9; c.strokeStyle = '#ffd36e'; c.stroke();
    c.font = '700 94px Georgia, "Times New Roman", serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.shadowColor = '#ffd36e'; c.shadowBlur = 32; c.fillStyle = '#fff3cf';
    c.fillText('★ LE CONCEPT ★', w / 2, h / 2 + 5);
  }), transparent: true, fog: false }));
  lcSign.position.set(0, 3.55, 0.35);
  const lcHalo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: 0xffd36e, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.72 }));
  lcHalo.scale.set(11.0, 3.6, 1); lcHalo.position.set(0, 3.55, 0.45);
  // Alfombra bordó VIP con ribetes dorados hasta la puerta
  const carpet = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 1.9), new THREE.MeshLambertMaterial({ color: 0x9a1b2b }));
  carpet.rotation.x = -Math.PI / 2;
  carpet.position.set(0, 0.17, 0.95);
  leConcept.add(carpet);
  const trimMat = new THREE.MeshBasicMaterial({ color: 0xf0c96a, fog: false });
  for (const sx of [-1, 1]) {
    const trim = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 1.9), trimMat);
    trim.rotation.x = -Math.PI / 2;
    trim.position.set(sx * 1.32, 0.175, 0.95);
    leConcept.add(trim);
  }
  // Guirnalda en arco de focos cálidos VIP
  const vipBulb = new THREE.SpriteMaterial({ map: glowTex(), color: 0xffe4a0, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true });
  for (let k = 0; k <= 16; k++) {
    const u = k / 16, bx = -lcW * 0.46 + u * lcW * 0.92, by = 4.65 - Math.sin(u * Math.PI) * 0.45;
    const sp = new THREE.Sprite(vipBulb); sp.scale.set(0.65, 0.65, 1); sp.position.set(bx, by, 0.32);
    leConcept.add(sp);
  }
  leConcept.add(front, lcSign, lcHalo);
  leConcept.position.set(LE_CONCEPT_X, -lcH * 0.165 * 0, BACK_Z + 0.55);
  scene.add(leConcept);

  // Francia: alterna edificios Haussmann de piedra crema/techo pizarra azulada (BOULANGERIE, FROMAGERIE, LIBRAIRIE, CAFÉ DE PARIS) con street_bg para diferenciarlo 100% de Buenos Aires
  const PARIS_SHOPS = [
    { name: 'BOULANGERIE', awning: '#264653', stripe: '#f4f1ea', stone: '#e7decb' },
    { name: 'FROMAGERIE',  awning: '#6d2e46', stripe: '#f4f1ea', stone: '#dfd3bc' },
    { name: 'LIBRAIRIE',   awning: '#2b4fa8', stripe: '#e8edf5', stone: '#eae2d0' },
    { name: 'CAFÉ DE PARIS', awning: '#1f5e42', stripe: '#f4f1ea', stone: '#e2d7c2' }
  ];
  const haussmannMat = (idx) => {
    const ps = PARIS_SHOPS[idx % PARIS_SHOPS.length];
    return new THREE.MeshBasicMaterial({ map: canvasTex(512, 512, (c, w, h) => {
      c.fillStyle = ps.stone; c.fillRect(0, 0, w, h);
      // Techo mansarda de pizarra azul-gris arriba
      c.fillStyle = '#334155'; c.fillRect(0, 0, w, 68);
      c.fillStyle = '#94a3b8'; c.fillRect(0, 66, w, 10);
      // Líneas de piedra caliza Haussmann
      c.fillStyle = 'rgba(110,95,70,0.14)';
      for (let y = 96; y < h * 0.58; y += 34) c.fillRect(0, y, w, 3);
      // Ventanas altas con balcones de hierro negro
      for (const wx of [w * 0.14, w * 0.58]) {
        c.fillStyle = '#1e293b'; c.fillRect(wx - 4, 98, 132, 168);
        const wg = c.createLinearGradient(0, 98, 0, 266);
        wg.addColorStop(0, '#93c5fd'); wg.addColorStop(1, '#3b5998');
        c.fillStyle = wg; c.fillRect(wx, 102, 124, 160);
        c.fillStyle = '#0f172a'; c.fillRect(wx - 12, 232, 148, 38);
      }
      // Toldo parisino a rayas + vidriera elegante en planta baja
      const top = h * 0.58;
      c.fillStyle = '#1e293b'; c.fillRect(14, top, w - 28, h - top);
      for (let x = 14; x < w - 14; x += 36) {
        c.fillStyle = ((x - 14) / 36) % 2 ? ps.stripe : ps.awning;
        c.fillRect(x, top + 6, Math.min(36, w - 14 - x), 42);
      }
      c.fillStyle = '#141824'; c.fillRect(30, top + 52, w - 60, 46);
      c.fillStyle = '#fde68a'; c.font = '900 32px Georgia, serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText(ps.name, w / 2, top + 76);
      const sg = c.createLinearGradient(0, top + 106, 0, h);
      sg.addColorStop(0, '#fef3c7'); sg.addColorStop(1, '#f59e0b');
      c.fillStyle = sg; c.fillRect(36, top + 106, w * 0.54, h - top - 116);
      c.fillStyle = '#3f2e21'; c.fillRect(w * 0.64, top + 106, w * 0.24, h - top - 106);
    }), fog: false });
  };
  const frParts = [[0, U_LC[0]], [U_LC[1], 1]].map(([u0, u1]) => ({ mat: new THREE.MeshBasicMaterial({ map: crop(u0, u1), fog: false }), w: (u1 - u0) * bgMeta.w / pxPerM }));
  let fx0 = BORDER_X, part = 0;
  while (fx0 < GALPON_X - 0.5) {
    if (part % 2 === 1) {
      const BW = 8.4, BH = 9.0, w = Math.min(BW, GALPON_X - fx0);
      const m = new THREE.Mesh(new THREE.PlaneGeometry(BW, BH), haussmannMat(part >> 1));
      m.position.set(fx0 + w / 2, BH / 2, BACK_Z - 0.02);
      if (w < BW) m.scale.x = w / BW;
      scene.add(m);
      fx0 += w;
    } else {
      const pt = frParts[(part >> 1) % 2];
      const w = Math.min(pt.w, GALPON_X - fx0);
      const m = new THREE.Mesh(new THREE.PlaneGeometry(pt.w, tileH), pt.mat);
      m.position.set(fx0 + pt.w / 2, tileH * (0.5 - 0.165), BACK_Z - 0.02);
      if (w < pt.w) { m.scale.x = w / pt.w; m.position.x = fx0 + w / 2; }
      scene.add(m);
      fx0 += w;
    }
    part++;
  }
  // Galpón del fondo
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(70, 13), new THREE.MeshBasicMaterial({ map: assets.has?.('galpon') ? galponTex(assets) : canvasTex(1024, 256, warehouse, 4, 1), fog: false }));
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
  const archParts = [];
  for (const z of [-3.95, 3.95]) {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 5.2, 10), archPoleMat);
    pole.position.set(BORDER_X + 0.5, 2.6, z);
    scene.add(pole);
    archParts.push(pole);
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
  // Barrera de la frontera: corta la calle al final de Buenos Aires y se levanta al pasar de nivel
  const borderBar = (() => {
    const x = BORDER_X - 2.2, z0 = 3.95, len = 7.9;
    const stripes = canvasTex(512, 32, (c, w, h) => {
      for (let i = 0; i < 16; i++) { c.fillStyle = i % 2 ? '#f4f1ea' : '#d8343f'; c.fillRect(i * w / 16, 0, w / 16, h); }
      c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(0, h - 6, w, 6);
    });
    const postMat = new THREE.MeshLambertMaterial({ map: canvasTex(32, 128, (c, w, h) => {
      for (let i = 0; i < 8; i++) { c.fillStyle = i % 2 ? '#1e1b22' : '#f2b705'; c.fillRect(0, i * h / 8, w, h / 8); }
    }) });
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.42, 1.5, 0.42), postMat); post.position.set(x, 0.75, z0 + 0.15);
    const rest = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.95, 0.22), postMat); rest.position.set(x, 0.47, z0 - len + 0.1);
    const pivot = new THREE.Group(); pivot.position.set(x, 1.32, z0);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.24, len).translate(0, 0, -len / 2), new THREE.MeshLambertMaterial({ map: stripes }));
    const weight = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.6), new THREE.MeshLambertMaterial({ color: 0x2a2630 })); weight.position.set(0, 0, 0.45);
    const plate = new THREE.Mesh(new THREE.PlaneGeometry(2.3, 0.62), new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, map: canvasTex(512, 138, (c, w, h) => {
      c.fillStyle = '#f2b705'; c.fillRect(0, 0, w, h); c.fillStyle = '#1e1b22'; c.fillRect(8, 8, w - 16, h - 16);
      c.font = '900 64px Fredoka, "Arial Rounded MT Bold", Arial, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillStyle = '#f2b705'; c.fillText('EMBARQUE ✈', w / 2, h / 2 + 4);
    }) }));
    plate.position.set(0, -0.48, -len * 0.42);
    // luz que titila arriba del poste: roja mientras está cerrada, verde al abrirse
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.17, 12, 10), new THREE.MeshBasicMaterial({ color: 0xff3b3b })); lamp.position.set(x, 1.68, z0 + 0.15);
    pivot.add(arm, weight, plate);
    scene.add(post, rest, pivot, lamp);
    let k = 0, target = 0, clock = 0;
    return {
      x,
      get open() { return target > 0; },
      get lift() { return k; },
      // La intro (domingo en Le Concept) pasa antes del viaje: ahí la barrera del aeropuerto no está
      // y así BIG CHAKY y la banda no la atraviesan al entrar ni Cepi al escaparse
      setVisible(v) { for (const m of [post, rest, pivot, lamp]) m.visible = v; },
      raise() { target = 1; lamp.material.color.set(0x5ee08a); },
      reset() { target = 0; k = 0; pivot.rotation.x = 0; lamp.material.color.set(0xff3b3b); },
      update(dt) {
        clock += dt;
        k += (target - k) * Math.min(1, dt * 6);
        pivot.rotation.x = k * Math.PI * 0.46 + (target && k > 0.97 ? Math.sin(clock * 18) * 0.01 : 0);
        lamp.visible = target > 0 || Math.sin(clock * 6) > -0.3;
      }
    };
  })();
  const airportSign = sign('✈ AEROPUERTO', BORDER_X - 5, 6.6, '#7ec8ff', 5); // fin del Nivel 1: se viaja en avión
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

  // Objetos pintados (kit hecho en Flow): planos parados con el dibujo; si falta la imagen queda la versión por código
  const artMats = {};
  const artGeo = new THREE.PlaneGeometry(1, 1).translate(0, 0.5, 0);
  function art(key, h, x, z, { flip = false, y = 0, parent = scene } = {}) {
    if (!assets.has?.(key)) return null;
    const meta = assets.meta(key);
    artMats[key] ||= new THREE.MeshBasicMaterial({ map: assets.texture(key), alphaTest: 0.3, transparent: true, side: THREE.DoubleSide });
    const m = new THREE.Mesh(artGeo, artMats[key]);
    m.scale.set(h * meta.w / meta.h * (flip ? -1 : 1), h, 1);
    m.position.set(x, y, z);
    parent.add(m);
    return m;
  }

  // Buenos Aires: plátanos, contenedores verdes y una parada de colectivo.
  // Van en las columnas que separan una casita de la otra en la pintura (nunca delante de una vidriera,
  // una puerta o un cartel) y lejos de los locales famosos y de Le Concept.
  const baSpots = streetSpotsBA(assets, { lcLeft, lcRight });
  const keepClear = (x) => [34, 46, 86, 104, 112].some(cx => Math.abs(x - cx) < 7.2);
  const treeXs = [], binXs = [];
  for (const x of baSpots) if (x >= 8 && !keepClear(x) && (!treeXs.length || x - treeXs[treeXs.length - 1] >= 16)) treeXs.push(x);
  for (const x of baSpots) {
    if (binXs.length >= 4 || keepClear(x) || treeXs.some(t => Math.abs(t - x) < 3) || binXs.some(b => Math.abs(b - x) < 20) || x < 14) continue;
    binXs.push(x);
  }
  const barkMat = new THREE.MeshLambertMaterial({ color: 0x8a7a63 });
  const crownMat = new THREE.MeshLambertMaterial({ color: 0x3f6b34 });
  for (const x of treeXs) {
    if (art('prop_arbol', 4.3, x, -4.85, { flip: treeXs.indexOf(x) % 2 === 1 })) continue;
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
  binXs.forEach((x, i) => {
    if (art('prop_contenedor', 1.55, x, -4.7, { flip: i % 2 === 1 })) return;
    const bin = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.25, 0.9), binMat);
    bin.position.set(x, 0.79, -4.75);
    const lid = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.12, 1.0), new THREE.MeshLambertMaterial({ color: 0x23603a }));
    lid.position.set(x, 1.47, -4.75);
    scene.add(bin, lid);
  });
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
    if (art('prop_maceta', 1.45, x, -5.0)) continue;
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.22, 0.5, 10), potMat);
    pot.position.set(x, 0.41, -5.0);
    const bush = new THREE.Mesh(new THREE.SphereGeometry(0.4, 10, 8), leafMat);
    bush.position.set(x, 0.95, -5.0);
    scene.add(pot, bush);
  }

  // Mesitas de Le Concept en la vereda y guirnalda de lucecitas
  const tableMat = new THREE.MeshLambertMaterial({ color: 0x2d2a2a });
  const clothMat = new THREE.MeshLambertMaterial({ color: 0xf4efe4 });
  // Con arte pintado: la mesita de mantel a cuadros con sillas de mimbre (la misma de la persecución)
  const cafeArt = assets.has?.('chase_ob_table');
  if (cafeArt) {
    const m = assets.meta('chase_ob_table'), h = 1.55, geo = new THREE.PlaneGeometry(h * m.w / m.h, h).translate(0, h / 2, 0);
    const mat = new THREE.MeshBasicMaterial({ map: assets.texture('chase_ob_table'), alphaTest: 0.45, side: THREE.DoubleSide });
    for (const x of [LE_CONCEPT_X - 6.5, LE_CONCEPT_X + 6.5]) {
      const t = new THREE.Mesh(geo, mat); t.position.set(x, 0, -4.4); scene.add(t);
    }
  }
  for (const x of cafeArt ? [] : [LE_CONCEPT_X - 7.5, LE_CONCEPT_X - 5.5, LE_CONCEPT_X + 5.5, LE_CONCEPT_X + 7.5]) {
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

  // Monumentos a Maradona en Argentina (Acto 1) y Monumentos a Zidane en Francia (Actos 3–4)
  for (const mx of [46, 112]) {
    if (art('monumento_maradona', 4.4, mx, -4.25)) {
      const pl = sign('★ MARADONA 10 ★', mx, 0.55, '#ffd36e', 2.4);
      pl.position.z = -3.95;
    }
  }
  for (const zx of [176, 244]) {
    if (art('monumento_zidane', 4.4, zx, -4.25)) {
      const pl = sign('★ ZIDANE 10 ★', zx, 0.55, '#ffd36e', 2.2);
      pl.position.z = -3.95;
    }
  }

  // Fuente de la plaza
  // la pintada va sobre la vereda (la vieja quedaba detrás de las fachadas)
  const paintedFountain = art('prop_fuente', 2.7, 220, -4.85);
  const stone = new THREE.MeshLambertMaterial({ color: 0xd8c3a5 });
  const basin = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.4, 0.6, 24), stone);
  basin.position.set(220, 0.3, -6.6);
  const water = new THREE.Mesh(new THREE.CircleGeometry(2.0, 24), new THREE.MeshBasicMaterial({ color: 0x6fc7e8 }));
  water.rotation.x = -Math.PI / 2; water.position.set(220, 0.62, -6.6);
  const column = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.35, 2.2, 10), stone);
  column.position.set(220, 1.4, -6.6);
  if (!paintedFountain) scene.add(basin, water, column);

  // En x=230 ahora luce La Granja de Maese LaPadite (sin el viejo bloque violeta liso)
  const pasajeSign = { visible: false, position: new THREE.Vector3(SECRET_X, 5.4, BACK_Z + 0.5) };

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
  // Vallas pintadas (mismo arte que la persecución de Cepi): el piquete y la grève se ven al nivel de los personajes
  const barricadeArt = assets.has?.('chase_ob_barricade');
  const barMat = barricadeArt ? new THREE.MeshBasicMaterial({ map: assets.texture('chase_ob_barricade'), alphaTest: 0.45, side: THREE.DoubleSide }) : null;
  const barGeo = barricadeArt ? new THREE.PlaneGeometry(1, 1).translate(0, 0.5, 0) : null;
  const barAspect = barricadeArt ? assets.meta('chase_ob_barricade').w / assets.meta('chase_ob_barricade').h : 1;
  function paintedRow(g, pieces, h, step, key = 'chase_ob_barricade') {
    let i = 0;
    const mat = key === 'chase_ob_barricade' ? barMat : (artMats[key] ||= new THREE.MeshBasicMaterial({ map: assets.texture(key), alphaTest: 0.3, transparent: true, side: THREE.DoubleSide }));
    const aspect = assets.meta(key).w / assets.meta(key).h;
    for (let z = -3.3; z <= 3.5; z += step, i++) {
      const m = new THREE.Mesh(barGeo, mat);
      // los que tienen cartel («CERRADO», «PRIVADO») no se espejan: las letras quedarían al revés
      const flip = key === 'chase_ob_barricade' && i % 2;
      m.scale.set(h * aspect * (flip ? -1 : 1), h * (0.92 + (i % 3) * 0.05), 1);
      m.position.set((i % 2 ? 0.12 : -0.12), 0, z);
      m.rotation.set(0, (i % 2 ? 0.12 : -0.1), 0);
      g.add(m);
      pieces.push({ mesh: m, base: m.position.clone(), baseRot: m.rotation.clone(), v: new THREE.Vector3(), spin: new THREE.Vector3() });
    }
  }
  const greveMat = new THREE.MeshBasicMaterial({ map: canvasTex(256, 112, (c, w, h) => {
    c.fillStyle = '#f4efe4'; c.fillRect(0, 0, w, h);
    c.strokeStyle = '#d23a3a'; c.lineWidth = 10; c.strokeRect(5, 5, w - 10, h - 10);
    c.font = '900 58px "Comic Sans MS", Arial'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#2b4fa8';
    c.fillText('GRÈVE !', w / 2, h / 2 + 4);
  }), side: THREE.DoubleSide });
  function buildPiquete(g, pieces, fires) {
    if (barricadeArt) paintedRow(g, pieces, 2.1, 1.25);
    for (let z = -3.4; z <= 3.5; z += barricadeArt ? 1.9 : 0.95) {
      if (!barricadeArt) for (let row = 0; row < 3; row++) {
        const m = new THREE.Mesh(tireGeo, tireMat);
        m.rotation.x = Math.PI / 2;
        m.position.set((Math.random() - 0.5) * 0.15, 0.2 + row * 0.4, z);
        g.add(m);
        pieces.push({ mesh: m, base: m.position.clone(), baseRot: m.rotation.clone(), v: new THREE.Vector3(), spin: new THREE.Vector3() });
      }
      const f = new THREE.Sprite(fireMat);
      f.position.set(barricadeArt ? 0.5 : 0, barricadeArt ? 1.2 : 1.75, z - (barricadeArt ? 0.3 : 0)); f.scale.set(1.1, 1.9, 1);
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
    // Buenos Aires: cajones de obra con cinta y «CERRADO»; la puerta del galpón: barricada con cadenas y «PRIVADO»
    const special = kind === 'crates' && x < BORDER_X ? 'prop_cajones' : kind === 'crates' && x > GALPON_X - 10 ? 'prop_galpon' : null;
    if (special && barricadeArt && assets.has?.(special)) {
      paintedRow(g, pieces, special === 'prop_galpon' ? 2.7 : 2.3, special === 'prop_galpon' ? 1.6 : 1.3, special);
      return { x, kind, open: false, mesh: g, pieces, fires, t: 0 };
    }
    if (kind === 'crates' && x > BORDER_X && barricadeArt) {
      paintedRow(g, pieces, 2.4, 1.15);
      const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 0.8), greveMat);
      sign.position.set(0.3, 2.55, 2.4); sign.rotation.set(-0.2, 0, -0.06);
      g.add(sign);
      pieces.push({ mesh: sign, base: sign.position.clone(), baseRot: sign.rotation.clone(), v: new THREE.Vector3(), spin: new THREE.Vector3() });
      return { x, kind, open: false, mesh: g, pieces, fires, t: 0 };
    }
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
    borderBar.update(dt);
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
    borderBar.reset();
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

  // Look por tramo, como la persecución: luz de atardecer y una bruma que suaviza lo lejano.
  // Las fachadas pintadas reciben la bruma (antes la ignoraban y brillaban a todo volumen).
  scene.traverse((o) => {
    const m = o.material;
    if (o.isMesh && m && m.isMeshBasicMaterial && m.map && !m.transparent && m.fog === false && o.position.z < BACK_Z + 1.2) { m.fog = true; m.needsUpdate = true; }
  });
  const look = createLook(scene, hemi, sun);
  look.update(LEVELS[0].start);
  // Intro (domingo en Le Concept): todavía no hay aeropuerto ni frontera, y la cámara va más lejos,
  // así que la bruma se aleja para que la escena no quede lavada/blanca.
  const introHide = [...archParts, welcome, airportSign].filter(Boolean);
  function setIntroMode(on) {
    for (const m of introHide) m.visible = !on;
    borderBar.setVisible(!on);
    look.intro = on;
    look.update(LEVELS[0].start, true);
  }

  return { treeXs, binXs, bounds: STREET, updateLook: look.update, setIntroMode, levelBounds: bounds, zones: ZONES, colliders: [], gates, secret, border: borderBar, leConcept, clampPosition, setLevelBounds, updateGates, resetGates, galponX: GALPON_X };
}

// ---------- Look por tramo (luz + bruma) ----------
// ba: atardecer porteño, el mismo de la persecución por la 9 de Julio
// fr: atardecer francés dorado, con una bruma más clara (la pintura de Francia ya es cálida y suave)
// galpon: la guarida sigue oscura, pero con humo cálido en vez de violeta plano
export const LOOKS = {
  ba: { bg: 0xe7b9a4, fog: 0xd9b0aa, near: 7, far: 60, sky: 0xffe6d2, ground: 0x6a5a66, hemi: 1.25, sun: 0xffc896, sunI: 0.95, tint: 0xeadcd8 },
  fr: { bg: 0xe8c9a8, fog: 0xe2c6ae, near: 3, far: 50, sky: 0xfff0dc, ground: 0x5a4c50, hemi: 1.0, sun: 0xffd9a8, sunI: 0.7, tint: 0xf0e6dc },
  galpon: { bg: 0x3b2c3a, fog: 0x6a4a44, near: 10, far: 58, sky: 0xc9a2c4, ground: 0x4a3020, hemi: 1.0, sun: 0xffb070, sunI: 0.7, tint: 0xe2d4d0 }
};
// Dónde se mezcla un look con el siguiente (x de la calle)
export function lookAt(x) {
  const mix = (a, b, k) => ({ a, b, k: Math.max(0, Math.min(1, k)) });
  if (x < BORDER_X - 4) return mix('ba', 'ba', 0);
  if (x < BORDER_X + 4) return mix('ba', 'fr', (x - (BORDER_X - 4)) / 8);
  if (x < GALPON_X - 14) return mix('fr', 'fr', 0);
  if (x < GALPON_X - 2) return mix('fr', 'galpon', (x - (GALPON_X - 14)) / 12);
  return mix('galpon', 'galpon', 0);
}
function createLook(scene, hemi, sun) {
  const ca = new THREE.Color(), cb = new THREE.Color();
  const col = (target, a, b, k) => target.copy(ca.setHex(a)).lerp(cb.setHex(b), k);
  const tinted = [];
  scene.traverse((o) => { if (o.isMesh && o.material?.isMeshBasicMaterial && o.material.map && o.material.fog && !tinted.includes(o.material)) tinted.push(o.material); });
  let last = null;
  const api = {
    intro: false,
    update(x, force = false) {
      const { a, b, k } = lookAt(x);
      const key = a + b + k.toFixed(2) + api.intro;
      if (key === last && !force) return;
      last = key;
      const A = LOOKS[a], B = LOOKS[b], L = (p) => A[p] + (B[p] - A[p]) * k;
      col(scene.background, A.bg, B.bg, k);
      col(scene.fog.color, A.fog, B.fog, k);
      scene.fog.near = api.intro ? 24 : L('near'); scene.fog.far = api.intro ? 110 : L('far');
      col(hemi.color, A.sky, B.sky, k); col(hemi.groundColor, A.ground, B.ground, k); hemi.intensity = L('hemi');
      col(sun.color, A.sun, B.sun, k); sun.intensity = L('sunI');
      // las fachadas pintadas apenas más apagadas: menos chillonas, mismo dibujo
      for (const m of tinted) col(m.color, A.tint, B.tint, k);
    }
  };
  return api;
}
