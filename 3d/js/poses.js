// Escala de cada pose para que la cabeza mida siempre lo mismo (las imágenes del 2D vienen a escalas distintas).
// Devuelve el alto de la celda relativo a la pose de referencia (normalmente la de reposo).
export function poseHeight(manifest, name, refName) {
  const m = manifest[name], r = manifest[refName];
  if (!m.skull || !r.skull) return 1;
  return ((m.h / m.rows) / m.skull) / ((r.h / r.rows) / r.skull);
}
