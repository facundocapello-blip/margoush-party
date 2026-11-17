// Objetos del juego: si ya está la hoja dibujada (objetos_sheet, grilla de 3×3 hecha con import_art.py)
// se usa su cuadro; si no, el emoji de siempre.
export const ITEM_CELLS = { manteca: 0, pelota: 1, ticket: 2, cerveza: 3, hongo: 4, hongo_veneno: 5, medialuna: 6, sarten: 7, corazon: 8 };

export function emojiTex(emoji, size = 128) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  const g = c.getContext('2d');
  g.font = `${size * 0.78}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(emoji, size / 2, size * 0.56);
  const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding;
  return t;
}

export function itemTex(assets, name, emoji) {
  const sheet = assets?.has?.('objetos_sheet') ? assets.texture('objetos_sheet') : null;
  if (!sheet || ITEM_CELLS[name] == null) return emojiTex(emoji);
  const i = ITEM_CELLS[name], t = sheet.clone();
  t.needsUpdate = true;
  t.repeat.set(1 / 3, 1 / 3);
  t.offset.set((i % 3) / 3, 1 - (Math.floor(i / 3) + 1) / 3);
  return t;
}

export function itemMat(assets, name, emoji) {
  return new THREE.SpriteMaterial({ map: itemTex(assets, name, emoji), transparent: true, depthWrite: false });
}
