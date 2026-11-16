"""Recorta una hoja de personaje hecha con IA (4 poses en fila sobre fondo liso) y la suma al juego.

Uso: python3 -I tools/cut_sheet.py <hoja.png> <id> [--frames 4] [--bg auto|#RRGGBB] [--assets 3d/assets]

Escribe <assets>/<id>_sheet.webp (cuadros iguales en fila, fondo transparente, pies alineados abajo,
alto 400 px) y agrega o actualiza su entrada en <assets>/manifest.json.
"""
import argparse
import json
import os
import sys

import numpy as np
from PIL import Image
from scipy import ndimage

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from extract_assets import main_component, skull_width  # noqa: E402

CELL_H = 400
FOOT_PAD = 6  # px libres debajo de los pies
TOL = 70      # distancia de color al fondo que se considera fondo


def background(arr, spec):
    if spec != 'auto':
        h = spec.lstrip('#')
        return np.array([int(h[i:i + 2], 16) for i in (0, 2, 4)], dtype=float)
    corners = np.concatenate([arr[:8, :8].reshape(-1, 3), arr[:8, -8:].reshape(-1, 3),
                              arr[-8:, :8].reshape(-1, 3), arr[-8:, -8:].reshape(-1, 3)])
    return np.median(corners, axis=0)


def remove_background(im, spec):
    rgb = np.array(im.convert('RGB')).astype(float)
    bg = background(rgb, spec)
    dist = np.sqrt(((rgb - bg) ** 2).sum(axis=2))
    alpha = np.clip((dist - TOL * 0.6) / (TOL * 0.4), 0, 1)
    # Despega el color del fondo de los bordes (sin halo verde)
    k = alpha[..., None]
    fg = np.where(k > 0, (rgb - bg * (1 - k)) / np.maximum(k, 1e-3), rgb)
    fg = np.clip(fg, 0, 255)
    near_bg = dist < TOL * 1.6
    if bg[1] > bg[0] + 60 and bg[1] > bg[2] + 60:  # fondo verde: le saca el verde que quede en los bordes
        g_cap = np.maximum(fg[..., 0], fg[..., 2])
        fg[..., 1] = np.where(near_bg & (fg[..., 1] > g_cap), g_cap, fg[..., 1])
    out = np.dstack([fg, alpha * 255]).astype(np.uint8)
    return out


def split_columns(alpha, frames):
    """Corta en las columnas vacías más anchas; si no alcanzan, en partes iguales."""
    w = alpha.shape[1]
    filled = ndimage.binary_closing(alpha.max(axis=0) > 40, iterations=3)
    lab, n = ndimage.label(filled)
    if n >= frames:
        spans = sorted([np.nonzero(lab == i)[0] for i in range(1, n + 1)], key=len, reverse=True)[:frames]
        spans = sorted(spans, key=lambda s: s[0])
        return [(int(s[0]), int(s[-1]) + 1) for s in spans]
    step = w / frames
    return [(round(i * step), round((i + 1) * step)) for i in range(frames)]


def cut(src, ident, frames=4, bg='auto', assets='3d/assets'):
    im = Image.open(src).convert('RGBA')
    arr = remove_background(im, bg)
    pieces = []
    for x0, x1 in split_columns(arr[:, :, 3], frames):
        cell = arr[:, x0:x1].copy()
        keep = main_component(cell[:, :, 3])
        cell[:, :, 3] = np.where(keep, cell[:, :, 3], 0)
        ys, xs = np.nonzero(cell[:, :, 3] > 40)
        pieces.append(Image.fromarray(cell).crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1)))
    # Misma escala para las 4 poses: la más alta ocupa la celda
    scale = (CELL_H - FOOT_PAD - 4) / max(p.height for p in pieces)
    pieces = [p.resize((max(1, round(p.width * scale)), max(1, round(p.height * scale))), Image.LANCZOS) for p in pieces]
    cw = max(p.width for p in pieces) + 8
    cw += (-cw) % 2
    sheet = Image.new('RGBA', (cw * frames, CELL_H), (0, 0, 0, 0))
    for k, p in enumerate(pieces):
        sheet.alpha_composite(p, (k * cw + (cw - p.width) // 2, CELL_H - FOOT_PAD - p.height))
    name = ident + '_sheet'
    sheet.save(os.path.join(assets, name + '.webp'), 'WEBP', quality=82, method=6)
    path = os.path.join(assets, 'manifest.json')
    man = json.load(open(path, encoding='utf-8'))
    man[name] = {'file': name + '.webp', 'w': sheet.width, 'h': sheet.height, 'frames': frames,
                 'cols': frames, 'rows': 1, 'skull': round(skull_width(sheet, frames, 1), 1),
                 'foot': round((CELL_H - FOOT_PAD) / CELL_H, 3)}
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(man, f, indent=1, ensure_ascii=False)
    return man[name]


if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('src')
    ap.add_argument('id')
    ap.add_argument('--frames', type=int, default=4)
    ap.add_argument('--bg', default='auto')
    ap.add_argument('--assets', default=os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '3d', 'assets'))
    a = ap.parse_args()
    print(json.dumps(cut(a.src, a.id, a.frames, a.bg, a.assets)))
