"""Prueba de tools/cut_sheet.py con una hoja sintética (fondo verde, 4 figuras de distinto alto y altura)."""
import json
import os
import subprocess
import sys

import numpy as np
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))


def make_sheet(path):
    im = Image.new('RGB', (1600, 500), (0, 255, 0))
    d = ImageDraw.Draw(im)
    # (x, arriba, abajo): cada figura con su "cabeza" (círculo) y cuerpo, pies a distinta altura
    for x, top, bottom in [(120, 60, 420), (520, 110, 470), (900, 40, 380), (1300, 150, 440)]:
        d.ellipse((x + 40, top, x + 160, top + 120), fill=(230, 180, 140))
        d.rectangle((x + 20, top + 110, x + 180, bottom), fill=(140, 30, 40))
    im.save(path)


def test_cut_sheet(tmp_path):
    src = tmp_path / 'hoja.png'
    make_sheet(src)
    assets = tmp_path / 'assets'
    assets.mkdir()
    (assets / 'manifest.json').write_text(json.dumps({'otro': {'file': 'otro.webp', 'w': 1, 'h': 1}}))
    subprocess.run([sys.executable, os.path.join(HERE, 'cut_sheet.py'), str(src), 'prueba', '--assets', str(assets)], check=True)

    man = json.loads((assets / 'manifest.json').read_text())
    assert 'otro' in man, 'no borra lo que ya estaba en el manifiesto'
    m = man['prueba_sheet']
    assert m['file'] == 'prueba_sheet.webp' and m['frames'] == 4 and m['cols'] == 4 and m['rows'] == 1
    assert m['h'] == 400 and m['w'] % 4 == 0 and m['skull'] > 0

    arr = np.array(Image.open(assets / m['file']).convert('RGBA'))
    assert arr.shape[0] == m['h'] and arr.shape[1] == m['w']
    opaque = arr[:, :, 3] > 40
    green = (arr[:, :, 1] > 200) & (arr[:, :, 0] < 80) & (arr[:, :, 2] < 80)
    assert not (opaque & green).any(), 'quedaron píxeles del fondo verde'

    fw = m['w'] // 4
    bottoms = []
    for k in range(4):
        rows = np.nonzero(opaque[:, k * fw:(k + 1) * fw].any(axis=1))[0]
        assert len(rows), f'cuadro {k} vacío'
        bottoms.append(rows.max())
    assert max(bottoms) - min(bottoms) <= 2, f'pies desalineados {bottoms}'
