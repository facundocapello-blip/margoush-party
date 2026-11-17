"""Prueba de tools/import_art.py con imágenes sintéticas (tira de 6, grilla de objetos y fondo)."""
import json
import os
import subprocess
import sys

from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))


def figures(path, n):
    im = Image.new('RGB', (n * 300, 600), (0, 255, 0))
    d = ImageDraw.Draw(im)
    for k in range(n):
        x = k * 300 + 80 + (k % 2) * 20
        d.ellipse((x + 30, 60, x + 130, 160), fill=(230, 180, 140))
        d.rectangle((x, 160, x + 160, 560 - (k % 3) * 10), fill=(30, 60, 150))
    im.save(path)


def test_import_art(tmp_path):
    assets = tmp_path / 'assets'
    assets.mkdir()
    (assets / 'manifest.json').write_text(json.dumps({}))
    walk = tmp_path / 'lale_camina.png'; figures(walk, 6)
    grid = tmp_path / 'objetos.png'
    im = Image.new('RGB', (900, 900), (0, 255, 0)); d = ImageDraw.Draw(im)
    for r in range(3):
        for c in range(3):
            d.ellipse((c * 300 + 60, r * 300 + 60, c * 300 + 240, r * 300 + 240), fill=(200, 40 * r, 60 * c))
    im.save(grid)
    bg = tmp_path / 'le_ble.png'; Image.new('RGB', (3000, 2000), (120, 80, 40)).save(bg)
    subprocess.run([sys.executable, '-I', os.path.join(HERE, 'import_art.py'), str(walk), str(grid), str(bg), '--assets', str(assets)], check=True)
    man = json.loads((assets / 'manifest.json').read_text())
    w = man['lale_walk_sheet']
    assert w['frames'] == 6 and w['cols'] == 6 and w['h'] == 512
    sheet = Image.open(assets / 'lale_walk_sheet.webp')
    assert sheet.size == (w['w'], 512) and sheet.mode == 'RGBA'
    # el verde se fue: las esquinas son transparentes
    assert sheet.getpixel((1, 1))[3] == 0
    o = man['objetos_sheet']
    assert o['cols'] == 3 and o['rows'] == 3 and len(o['names']) == 9
    assert man['le_ble']['w'] == 1280


if __name__ == '__main__':
    import tempfile, pathlib
    with tempfile.TemporaryDirectory() as t:
        test_import_art(pathlib.Path(t))
    print('ok - import_art')
