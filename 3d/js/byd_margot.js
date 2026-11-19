// Margot llorando en la luneta del BYD de Cepi (persecución y mini nivel «¡ROMPÉ EL BYD!»).
// Se pinta por código sobre los dibujos del auto visto de atrás: la carita de margot_faces (celda 2,
// llorando) asomada en el asiento de atrás, recortada por el vidrio. Así se entiende a quién perseguís.
// Rectángulo de la luneta en px de chase_cepi_drive / windup / throw (396×384)
export const BYD_WINDOW = { x: 118, y: 70, w: 204, h: 64 };
export const MARGOT_SEAT = { x: 166, y: 112, r: 31 };

// Devuelve un <canvas> con el auto y Margot en la luneta (o null si falta algún dibujo)
export function bydCanvasWithMargot(assets, key) {
  if (!assets.has?.(key) || !assets.has?.('margot_faces')) return null;
  const img = assets.texture(key).image, meta = assets.meta(key);
  const faces = assets.texture('margot_faces').image, fm = assets.meta('margot_faces');
  const c = document.createElement('canvas'); c.width = meta.w; c.height = meta.h;
  const g = c.getContext('2d');
  g.drawImage(img, 0, 0, meta.w, meta.h);
  const sx = meta.w / 396, sy = meta.h / 384, W = BYD_WINDOW, M = MARGOT_SEAT;
  const cw = fm.w / (fm.cols || 3), ch = fm.h;
  g.save();
  g.beginPath(); g.rect(W.x * sx, W.y * sy, W.w * sx, W.h * sy); g.clip();
  g.beginPath(); g.arc(M.x * sx, M.y * sy, M.r * sx, 0, Math.PI * 2); g.clip();
  g.drawImage(faces, cw * 2, 0, cw, ch, (M.x - M.r) * sx, (M.y - M.r) * sy, M.r * 2 * sx, M.r * 2 * sy);
  // reflejo del vidrio por encima, para que parezca adentro del auto
  g.fillStyle = 'rgba(190,210,235,.18)'; g.fillRect(W.x * sx, W.y * sy, W.w * sx, W.h * sy);
  g.restore();
  return c;
}

// Igual, pero como textura de Three.js (cacheada por dibujo)
const cache = new Map();
export function bydTextureWithMargot(assets, key) {
  if (cache.has(key)) return cache.get(key);
  const c = bydCanvasWithMargot(assets, key);
  if (!c) return null;
  const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding;
  cache.set(key, t);
  return t;
}
