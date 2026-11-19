"""Prueba de tools/import_arena.py con imágenes sintéticas (verde croma, blanco, fondo opaco).

Correr: python3 -I tools/test_import_arena.py
"""
import json
import os
import subprocess
import sys
import tempfile

import numpy as np
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))


def run(tmp, files):
    assets = os.path.join(tmp, 'assets')
    os.makedirs(assets, exist_ok=True)
    mp = os.path.join(assets, 'manifest.json')
    if not os.path.exists(mp):
        json.dump({'otro': {'file': 'otro.webp', 'w': 1, 'h': 1}}, open(mp, 'w'))
    subprocess.run([sys.executable, '-I', os.path.join(HERE, 'import_arena.py'), '--assets', assets, *files], check=True)
    return assets, json.load(open(mp))


def test_character(tmp, ext):
    src = os.path.join(tmp, 'margoush_arena_chaky_front_idle.' + ext)
    im = Image.new('RGB', (200, 300), (0, 0xB1, 0x40))
    ImageDraw.Draw(im).ellipse((60, 40, 140, 260), fill=(240, 120, 20))
    im.save(src)
    assets, man = run(tmp, [src])
    assert 'otro' in man
    m = man['arena_chaky_idle']
    assert m['file'] == 'arena_chaky_idle.webp' and m['w'] > 0 and m['h'] > 0
    out = Image.open(os.path.join(assets, m['file']))
    assert out.mode == 'RGBA' and out.height <= 768 and (out.width, out.height) == (m['w'], m['h'])
    arr = np.array(out)
    opaque = arr[..., 3] > 40
    green = (arr[..., 1] > 150) & (arr[..., 0] < 100) & (arr[..., 2] < 120)
    assert opaque.any() and not (opaque & green).any(), 'quedaron píxeles verdes'
    assert (arr[..., 3] == 0).any(), 'sin transparencia'


def test_object(tmp):
    src = os.path.join(tmp, 'margoush_arena_barril.png')
    im = Image.new('RGB', (300, 300), (255, 255, 255))
    ImageDraw.Draw(im).ellipse((90, 60, 210, 270), fill=(120, 70, 30))
    im.save(src)
    assets, man = run(tmp, [src])
    m = man['arena_barril']
    arr = np.array(Image.open(os.path.join(assets, m['file'])))
    assert arr.shape[2] == 4 and (arr[..., 3] < 20).any() and (arr[..., 3] > 240).any()
    assert arr.shape[0] <= 384


def test_background(tmp):
    src = os.path.join(tmp, 'margoush_arena_fondo.png')
    Image.new('RGB', (1920, 1080), (40, 30, 60)).save(src)
    assets, man = run(tmp, [src])
    m = man['arena_fondo']
    out = Image.open(os.path.join(assets, m['file']))
    assert out.width <= 1280 and out.width == m['w'] and out.height == m['h']
    assert 'A' not in out.getbands() or np.array(out.convert('RGBA'))[..., 3].min() == 255


if __name__ == '__main__':
    for ext in ('png', 'jpg'):
        with tempfile.TemporaryDirectory() as t:
            test_character(t, ext)
    with tempfile.TemporaryDirectory() as t:
        test_object(t)
    with tempfile.TemporaryDirectory() as t:
        test_background(t)
    print('PASS')
