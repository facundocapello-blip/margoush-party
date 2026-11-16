// Poses de los personajes dibujados con IA: una hoja <id>_sheet con 4 cuadros en fila
// (parado, paso, golpe, golpeado). Si la hoja todavía no está, el personaje usa su dibujo de siempre.
export const POSE_CELLS = { idle: 0, step: 1, strike: 2, hurt: 3 };

export function sheetPoses(assets, id, fallbackTex) {
  const sheet = id + '_sheet';
  const has = assets.has ? assets.has(sheet) : !!assets.texture(sheet);
  const poses = {};
  for (const [name, cell] of Object.entries(POSE_CELLS)) poses[name] = has ? { tex: sheet, cell } : { tex: fallbackTex };
  return poses;
}
