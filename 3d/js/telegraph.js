// Avisos en el piso con el mismo lenguaje que la persecución: un blanco que se cierra donde va a caer algo.
// Dibujados por código (sin archivos): aro con borde oscuro, relleno suave y flechitas hacia adentro;
// un segundo aro se achica hasta coincidir con el primero justo cuando llega el tiro.
// También la mancha de manteca (charco brillante con borde irregular) en vez del disco plano.

const cache = new Map();
function tex(key, size, draw) {
  if (cache.has(key)) return cache.get(key);
  const c = document.createElement('canvas'); c.width = c.height = size;
  draw(c.getContext('2d'), size);
  const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding;
  cache.set(key, t);
  return t;
}

// Blanco: relleno suave + aro + 4 flechitas hacia el centro
function targetTex(color) {
  return tex('target' + color, 256, (g, S) => {
    const c = S / 2, R = S * 0.44;
    const fill = g.createRadialGradient(c, c, 0, c, c, R);
    fill.addColorStop(0, 'rgba(255,255,255,0)'); fill.addColorStop(0.5, hexA(color, 0.16)); fill.addColorStop(1, hexA(color, 0.5));
    g.fillStyle = fill; g.beginPath(); g.arc(c, c, R, 0, Math.PI * 2); g.fill();
    g.lineWidth = S * 0.05; g.strokeStyle = 'rgba(30,18,28,.55)'; g.beginPath(); g.arc(c, c, R, 0, Math.PI * 2); g.stroke();
    g.lineWidth = S * 0.03; g.strokeStyle = color; g.beginPath(); g.arc(c, c, R, 0, Math.PI * 2); g.stroke();
    g.fillStyle = color; g.strokeStyle = 'rgba(30,18,28,.6)'; g.lineWidth = S * 0.012;
    for (let i = 0; i < 4; i++) {
      const a = i * Math.PI / 2 + Math.PI / 4, r0 = R * 0.62, r1 = R * 0.86, w = 0.2;
      g.beginPath();
      g.moveTo(c + Math.cos(a) * r0, c + Math.sin(a) * r0);
      g.lineTo(c + Math.cos(a - w) * r1, c + Math.sin(a - w) * r1);
      g.lineTo(c + Math.cos(a + w) * r1, c + Math.sin(a + w) * r1);
      g.closePath(); g.fill(); g.stroke();
    }
    g.fillStyle = hexA(color, 0.9); g.beginPath(); g.arc(c, c, S * 0.025, 0, Math.PI * 2); g.fill();
  });
}
function ringTex(color) {
  return tex('ring' + color, 256, (g, S) => {
    const c = S / 2, R = S * 0.44;
    g.lineWidth = S * 0.045; g.strokeStyle = 'rgba(30,18,28,.45)'; g.beginPath(); g.arc(c, c, R, 0, Math.PI * 2); g.stroke();
    g.lineWidth = S * 0.025; g.strokeStyle = '#fff'; g.beginPath(); g.arc(c, c, R, 0, Math.PI * 2); g.stroke();
  });
}
function hexA(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`;
}

const geo = new Map();
const plane = (r) => { if (!geo.has(r)) geo.set(r, new THREE.PlaneGeometry(r * 2.27, r * 2.27)); return geo.get(r); };

// Aviso: (x, z) donde cae, radio en metros. update(k) con k de 0 (recién tirado) a 1 (llega).
export function makeWarning(scene, x, z, radius, color = '#ff4d5e') {
  const mk = (map, o) => {
    const m = new THREE.Mesh(plane(radius), new THREE.MeshBasicMaterial({ map, transparent: true, depthWrite: false, opacity: o }));
    m.rotation.x = -Math.PI / 2; m.position.set(x, 0.05, z); m.renderOrder = 2;
    scene.add(m);
    return m;
  };
  const base = mk(targetTex(color), 0.5), ring = mk(ringTex(color), 0);
  ring.position.y = 0.055;
  let alive = true;
  return {
    meshes: [base, ring],
    get visible() { return alive && base.visible; },
    update(k) {
      k = Math.max(0, Math.min(1, k));
      base.material.opacity = 0.45 + 0.5 * k;
      base.scale.setScalar(0.9 + 0.1 * k + (k > 0.8 ? Math.sin(k * 60) * 0.03 : 0));
      ring.scale.setScalar(2.1 - 1.1 * k);
      ring.material.opacity = Math.min(1, 0.2 + k);
    },
    dispose() {
      alive = false;
      for (const m of [base, ring]) { scene.remove(m); m.material.dispose(); }
    }
  };
}

// Charco de manteca derretida: borde ondulado, degradé dorado y brillos
export function butterPuddleTex() {
  return tex('butter', 256, (g, S) => {
    const c = S / 2;
    const blob = (R, wob, seed) => {
      g.beginPath();
      for (let i = 0; i <= 48; i++) {
        const a = (i / 48) * Math.PI * 2;
        const r = R * (1 + wob * (Math.sin(a * 3 + seed) * 0.5 + Math.sin(a * 5 + seed * 2) * 0.3 + Math.sin(a * 2 - seed) * 0.2));
        const px = c + Math.cos(a) * r, py = c + Math.sin(a) * r * 0.92;
        if (i) g.lineTo(px, py); else g.moveTo(px, py);
      }
      g.closePath();
    };
    blob(S * 0.4, 0.12, 1.3); g.fillStyle = 'rgba(120,80,10,.35)'; g.fill(); // sombra/borde
    blob(S * 0.37, 0.12, 1.3);
    const gr = g.createRadialGradient(c - S * 0.06, c - S * 0.06, S * 0.02, c, c, S * 0.4);
    gr.addColorStop(0, '#fff6c2'); gr.addColorStop(0.45, '#ffdf62'); gr.addColorStop(1, '#e9a92a');
    g.fillStyle = gr; g.fill();
    g.lineWidth = S * 0.012; g.strokeStyle = 'rgba(160,100,10,.6)'; g.stroke();
    // pancito de manteca a medio derretir en el medio
    g.fillStyle = '#fff1a8'; g.strokeStyle = 'rgba(170,110,20,.7)'; g.lineWidth = S * 0.01;
    g.beginPath(); g.roundRect ? g.roundRect(c - S * 0.1, c - S * 0.07, S * 0.2, S * 0.12, S * 0.03) : g.rect(c - S * 0.1, c - S * 0.07, S * 0.2, S * 0.12); g.fill(); g.stroke();
    // brillos
    g.fillStyle = 'rgba(255,255,255,.85)';
    for (const [dx, dy, r] of [[-0.18, -0.12, 0.035], [0.14, 0.1, 0.022], [-0.05, 0.17, 0.018], [0.2, -0.08, 0.015]]) {
      g.beginPath(); g.ellipse(c + dx * S, c + dy * S, r * S * 1.6, r * S, -0.5, 0, Math.PI * 2); g.fill();
    }
  });
}
