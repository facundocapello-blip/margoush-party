// Poses de los personajes dibujados con IA.
//  - <id>_sheet: 4 cuadros en fila (parado, paso, golpe, golpeado) — las hojas de antes.
//  - <id>_actions_sheet: 4 cuadros (parado, golpe/lanzamiento, golpeado, KO) — las de la guía AAA.
//  - <id>_walk_sheet: tira de caminata de 6 cuadros (se anima según lo que camina).
// Si la hoja todavía no está, el personaje usa su dibujo de siempre.
export const POSE_CELLS = { idle: 0, step: 1, strike: 2, hurt: 3 };
export const ACTION_CELLS = { idle: 0, strike: 1, hurt: 2, ko: 3 };
export const WALK_STRIDE = 0.2; // metros por cuadro de la caminata

export function sheetPoses(assets, id, fallbackTex) {
  const has = (n) => (assets.has ? assets.has(n) : !!assets.texture(n));
  const poses = {};
  if (has(id + '_actions_sheet')) {
    const s = id + '_actions_sheet';
    for (const [name, cell] of Object.entries(ACTION_CELLS)) poses[name] = { tex: s, cell };
    poses.step = { tex: s, cell: 0 };
  } else {
    const sheet = id + '_sheet', ok = has(sheet);
    for (const [name, cell] of Object.entries(POSE_CELLS)) poses[name] = ok ? { tex: sheet, cell } : { tex: fallbackTex };
  }
  if (has(id + '_walk_sheet')) poses.walk = { tex: id + '_walk_sheet', stride: WALK_STRIDE };
  return poses;
}
