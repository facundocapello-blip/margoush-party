"""Extrae y comprime el arte y la música de MARGOUSH V23.8 (HTML con todo embebido).

Uso: python3 -I tools/extract_assets.py <V23.8.html> <carpeta de salida>
"""
import base64
import io
import json
import os
import re
import subprocess
import sys
import tempfile

import numpy as np
from PIL import Image
from scipy import ndimage

# Orden de las imágenes embebidas en V23.8 (verificado por tamaño en cada corrida).
IMAGES = [
    # (índice, nombre, columnas, filas, cuadros, ancho, alto originales)
    (2, 'boss_idle', 1, 1, 1, 503, 731),
    (3, 'boss_run', 1, 1, 1, 597, 674),
    (4, 'boss_attack', 1, 1, 1, 711, 506),
    (5, 'boss_hurt', 1, 1, 1, 523, 472),
    (6, 'douge_idle', 1, 1, 1, 194, 420),
    (7, 'douge_run', 6, 1, 6, 2172, 724),
    (8, 'douge_attack', 1, 1, 1, 398, 420),
    (9, 'marine_idle', 1, 1, 1, 168, 420),
    (10, 'marine_run', 6, 1, 6, 2172, 724),
    (11, 'marine_attack', 1, 1, 1, 390, 420),
    (12, 'chaky_run', 6, 1, 6, 2172, 724),
    (14, 'margot_sheet', 2, 2, 4, 1254, 1254),
    (15, 'street_bg', 1, 1, 1, 1536, 1024),
    (16, 'courier', 1, 1, 1, 1199, 1312),
    (17, 'kidnap_sheet', 2, 2, 4, 1254, 1254),
    (18, 'facu', 1, 1, 1, 395, 783),
]
AUDIO = ['music_douge', 'music_marine']


def scaled(im, cols, rows):
    """Cuadros de hasta 400 px de alto; el resto con el lado mayor en 1024 px."""
    if cols * rows > 1:
        factor = min(1.0, 400 / (im.height / rows))
    else:
        factor = min(1.0, 1024 / max(im.size))
    if factor < 1.0:
        im = im.resize((round(im.width * factor), round(im.height * factor)), Image.LANCZOS)
    return im


RUN_STRIPS = {'douge_run', 'marine_run', 'chaky_run'}
FOOT_Y = 0.925  # fracción de la celda donde apoyan los pies en las tiras de correr


def main_component(alpha):
    """Máscara de la silueta principal (descarta restos de cuadros vecinos)."""
    mask = alpha > 75
    lab, n = ndimage.label(mask, structure=np.ones((3, 3)))
    if n == 0:
        return mask
    sizes = ndimage.sum(mask, lab, range(1, n + 1))
    keep = lab == (int(np.argmax(sizes)) + 1)
    # conserva los bordes suaves pegados a la silueta
    return ndimage.binary_dilation(keep, iterations=2)


def clean_strip(im, frames):
    """Limpia cada cuadro y lo re-centra con los pies a la misma altura."""
    w, h = im.size
    fw = w // frames
    out = Image.new('RGBA', (fw * frames, h), (0, 0, 0, 0))
    for k in range(frames):
        cell = np.array(im.crop((k * fw, 0, (k + 1) * fw, h)))
        keep = main_component(cell[:, :, 3])
        cell[:, :, 3] = np.where(keep, cell[:, :, 3], 0)
        ys, xs = np.nonzero(cell[:, :, 3] > 75)
        top, bot, left, right = ys.min(), ys.max(), xs.min(), xs.max()
        piece = Image.fromarray(cell).crop((left, top, right + 1, bot + 1))
        x = (fw - piece.width) // 2
        y = int(round(h * FOOT_Y)) - piece.height
        out.alpha_composite(piece, (k * fw + max(0, x), max(0, y)))
    return out


def skull_width(im, cols, rows):
    """Ancho de la cabeza en px (mediana bajo el borde superior) del primer cuadro."""
    cell = np.array(im.crop((0, 0, im.width // cols, im.height // rows)))
    mask = main_component(cell[:, :, 3])
    ys = np.nonzero(mask.any(axis=1))[0]
    top = ys.min()
    span = max(8, int((ys.max() - top) * 0.1))
    widths = []
    for y in range(top + span // 2, top + span // 2 + span):
        xs = np.nonzero(mask[y])[0]
        if len(xs):
            widths.append(xs.max() - xs.min() + 1)
    return float(np.median(widths))


def main(src, out):
    os.makedirs(out, exist_ok=True)
    html = io.open(src, encoding='utf-8', errors='replace').read()
    pngs = re.findall(r'data:image/png;base64,([A-Za-z0-9+/=]+)', html)
    mp3s = re.findall(r'data:audio/mpeg;base64,([A-Za-z0-9+/=]+)', html)
    manifest = {}
    for idx, name, cols, rows, frames, w0, h0 in IMAGES:
        im = Image.open(io.BytesIO(base64.b64decode(pngs[idx]))).convert('RGBA')
        if im.size != (w0, h0):
            raise SystemExit(f'{name}: esperaba {w0}x{h0}, encontré {im.size}')
        im = scaled(im, cols, rows)
        if name in RUN_STRIPS:
            im = clean_strip(im, frames)
        elif cols * rows == 1 and name != 'street_bg':
            arr = np.array(im)
            arr[:, :, 3] = np.where(main_component(arr[:, :, 3]), arr[:, :, 3], 0)
            im = Image.fromarray(arr)
        quality = 72 if name == 'street_bg' else 82
        im.save(os.path.join(out, name + '.webp'), 'WEBP', quality=quality, method=6)
        manifest[name] = {'file': name + '.webp', 'w': im.width, 'h': im.height,
                          'frames': frames, 'cols': cols, 'rows': rows,
                          'skull': round(skull_width(im, cols, rows), 1)}
        if name in RUN_STRIPS:
            manifest[name]['foot'] = FOOT_Y
    for name, b64 in zip(AUDIO, mp3s):
        with tempfile.NamedTemporaryFile(suffix='.mp3', delete=False) as tmp:
            tmp.write(base64.b64decode(b64))
        target = os.path.join(out, name + '.mp3')
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', tmp.name,
                        '-ac', '1', '-b:a', '64k', target], check=True)
        os.unlink(tmp.name)
        manifest[name] = {'file': name + '.mp3', 'w': 0, 'h': 0, 'frames': 0, 'cols': 0, 'rows': 0}
    with open(os.path.join(out, 'manifest.json'), 'w') as f:
        json.dump(manifest, f, indent=1)


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
