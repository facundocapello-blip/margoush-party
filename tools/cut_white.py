"""Saca el fondo blanco de un objeto generado en Flow y lo guarda como WebP transparente.

Uso: python3 -I tools/cut_white.py <entrada> <id> [--assets 3d/assets] [--h 384]

El fondo se busca desde los bordes (relleno conectado), así no se borran partes claras del objeto.
La sombra gris que deja la IA queda como sombra semitransparente.
"""
import argparse, json, os
import numpy as np
from PIL import Image
from scipy import ndimage


def cut_white(im, light=135):
    rgb = np.array(im.convert('RGB')).astype(float)
    mx, mn = rgb.max(axis=2), rgb.min(axis=2)
    sat = (mx - mn) / np.maximum(mx, 1)
    neutral = (sat < 0.10) & (mx > light)
    lab, _ = ndimage.label(neutral)
    border = np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))
    bg = np.isin(lab, border[border > 0])
    bg = ndimage.binary_opening(bg, iterations=1) | (bg & (mx > 248))
    shade = np.clip((246 - mx) / 110, 0, 0.55)       # sombra suave, solo cerca del piso
    rows = np.arange(rgb.shape[0])[:, None] / rgb.shape[0]
    shade = np.where(rows > 0.62, shade, 0)
    alpha = np.where(bg, shade, 1.0)
    # borde: suaviza un pixel
    edge = ndimage.binary_dilation(bg) & ~bg
    alpha = np.where(edge, np.maximum(alpha * 0.85, shade), alpha)
    col = np.where(bg[..., None], 0, rgb)
    out = np.dstack([col, alpha * 255]).astype(np.uint8)
    return Image.fromarray(out, 'RGBA')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('src'); ap.add_argument('ident')
    ap.add_argument('--assets', default='3d/assets'); ap.add_argument('--h', type=int, default=384)
    ap.add_argument('--light', type=int, default=135, help='más alto = borra solo lo casi blanco (agua, piedra clara)')
    a = ap.parse_args()
    im = cut_white(Image.open(a.src), a.light)
    bbox = Image.fromarray((np.array(im)[..., 3] > 12).astype(np.uint8) * 255).getbbox()
    im = im.crop(bbox)
    if im.height > a.h: im = im.resize((round(im.width * a.h / im.height), a.h), Image.LANCZOS)
    out = os.path.join(a.assets, a.ident + '.webp')
    im.save(out, 'WEBP', quality=86, method=6)
    p = os.path.join(a.assets, 'manifest.json')
    m = json.load(open(p))
    m[a.ident] = {'file': a.ident + '.webp', 'w': im.width, 'h': im.height, 'frames': 1, 'cols': 1, 'rows': 1}
    with open(p, 'w') as f: json.dump(m, f, indent=1, ensure_ascii=False); f.write('\n')
    print(a.ident, im.size, os.path.getsize(out))


if __name__ == '__main__':
    main()
