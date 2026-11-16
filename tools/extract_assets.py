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

from PIL import Image

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
        quality = 72 if name == 'street_bg' else 82
        im.save(os.path.join(out, name + '.webp'), 'WEBP', quality=quality, method=6)
        manifest[name] = {'file': name + '.webp', 'w': im.width, 'h': im.height,
                          'frames': frames, 'cols': cols, 'rows': rows}
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
