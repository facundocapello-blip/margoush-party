"""Mete en el juego las imágenes de la guía «Imágenes para que el juego quede AAA».

Uso: python3 -I tools/import_art.py <imagen> [<imagen> ...] [--assets 3d/assets]

El nombre del archivo dice qué es (lale_camina.png, douge_combo.png, le_ble.png, objetos.png…).
- Personajes: se les saca el fondo verde y se cortan en cuadros iguales → <id>_sheet.webp (512 px de alto).
- Objetos: grilla de 3×3 → objetos_sheet.webp (9 cuadros).
- Fondos: se achican a 1280 px de ancho como máximo → <id>.webp.
Cada uno queda anotado en manifest.json; el juego lo usa solo si existe.
"""
import argparse
import json
import os
import sys

import numpy as np
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cut_sheet import cut, remove_background  # noqa: E402

CELL_H = 512
# nombre de la guía → (id en el juego, cuadros)
SHEETS = {
    'lale_camina': ('lale_walk', 6), 'lale_acciones': ('lale_actions', 4),
    'cepi_camina': ('cepi_walk', 6), 'cepi_acciones': ('cepi_actions', 4),
    'pinky_camina': ('pinky_walk', 6), 'pinky_acciones': ('pinky_actions', 4),
    'douge_combo': ('douge_combo', 3), 'douge_acciones': ('douge_actions', 4),
    'marine_combo': ('marine_combo', 3), 'marine_acciones': ('marine_actions', 4),
    'chaky_camina': ('chaky_walk', 6), 'chaky_acciones': ('chaky_actions', 4),
    'rescate': ('rescate', 2),
}
BACKGROUNDS = {'le_ble', 'punto_de_oro', 'henris', 'calle_buenos_aires', 'galpon'}
OBJECTS = 'objetos'
# orden de los objetos en la grilla (fila por fila), como pide la guía
OBJECT_NAMES = ['manteca', 'pelota', 'ticket', 'cerveza', 'hongo', 'hongo_veneno', 'medialuna', 'sarten', 'corazon']


def update_manifest(assets, name, entry):
    path = os.path.join(assets, 'manifest.json')
    man = json.load(open(path, encoding='utf-8'))
    man[name] = entry
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(man, f, indent=1, ensure_ascii=False)


def background(src, ident, assets, max_w=1280):
    im = Image.open(src).convert('RGB')
    if im.width > max_w:
        im = im.resize((max_w, round(im.height * max_w / im.width)), Image.LANCZOS)
    im.save(os.path.join(assets, ident + '.webp'), 'WEBP', quality=74, method=6)
    update_manifest(assets, ident, {'file': ident + '.webp', 'w': im.width, 'h': im.height, 'frames': 1, 'cols': 1, 'rows': 1})


def objects(src, assets, cell=256):
    im = Image.open(src).convert('RGBA')
    arr = remove_background(im, 'auto')
    h, w = arr.shape[:2]
    out = Image.new('RGBA', (cell * 3, cell * 3), (0, 0, 0, 0))
    for r in range(3):
        for c in range(3):
            piece = arr[r * h // 3:(r + 1) * h // 3, c * w // 3:(c + 1) * w // 3]
            ys, xs = np.nonzero(piece[:, :, 3] > 40)
            if not len(xs):
                continue
            p = Image.fromarray(piece).crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))
            k = (cell - 16) / max(p.width, p.height)
            p = p.resize((max(1, round(p.width * k)), max(1, round(p.height * k))), Image.LANCZOS)
            out.alpha_composite(p, (c * cell + (cell - p.width) // 2, r * cell + (cell - p.height) // 2))
    out.save(os.path.join(assets, 'objetos_sheet.webp'), 'WEBP', quality=84, method=6)
    update_manifest(assets, 'objetos_sheet', {'file': 'objetos_sheet.webp', 'w': out.width, 'h': out.height, 'frames': 9, 'cols': 3, 'rows': 3, 'names': OBJECT_NAMES})


def unspill(path, quality=80):
    """Los brillos semitransparentes sobre el verde quedan verdosos: los vuelve dorados y re-guarda liviano."""
    im = Image.open(path).convert('RGBA')
    a = np.array(im).astype(np.int32)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    green = (g > r + 18) & (g > b + 18) & (a[..., 3] > 0)
    a[..., 0] = np.where(green, np.maximum(r, g), r)
    a[..., 1] = np.where(green, np.minimum(g, (np.maximum(r, g) * 0.82).astype(np.int32)), g)
    Image.fromarray(a.clip(0, 255).astype(np.uint8)).save(path, 'WEBP', quality=quality, method=6)


def import_one(src, assets):
    stem = os.path.splitext(os.path.basename(src))[0].lower()
    if stem in SHEETS:
        ident, frames = SHEETS[stem]
        meta = cut(src, ident, frames, 'auto', assets, cell_h=CELL_H)
        unspill(os.path.join(assets, ident + '_sheet.webp'))
        return ident + '_sheet', meta
    if stem in BACKGROUNDS:
        background(src, stem, assets)
        return stem, None
    if stem == OBJECTS:
        objects(src, assets)
        return 'objetos_sheet', None
    raise SystemExit(f'No sé qué es «{stem}»: usá los nombres de la guía (p. ej. lale_camina.png).')


if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('src', nargs='+')
    ap.add_argument('--assets', default=os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '3d', 'assets'))
    a = ap.parse_args()
    for s in a.src:
        name, meta = import_one(s, a.assets)
        print('ok', name, json.dumps(meta) if meta else '')
