"""Reacomoda hojas de sprites con ancho > 2048 px en 2 filas (<= 2048 px) sin regenerar arte.

Uso: python tools/repack_sheets.py [3d/assets]
"""
import hashlib
import json
import math
import pathlib
import sys
from PIL import Image

MAX_W = 2048
ASSETS = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else '3d/assets')
MANIFEST = ASSETS / 'manifest.json'


def repack_one(name, meta):
    path = ASSETS / meta['file']
    im = Image.open(path).convert('RGBA')
    frames = int(meta.get('frames') or 1)
    old_cols = int(meta.get('cols') or frames)
    old_rows = int(meta.get('rows') or 1)
    if frames <= 1 or im.width <= MAX_W:
        return False

    fw = im.width // old_cols
    fh = im.height // old_rows
    new_rows = old_rows
    new_cols = old_cols
    while new_cols * fw > MAX_W and new_cols > 1:
        new_rows += 1
        new_cols = math.ceil(frames / new_rows)
    assert new_cols * fw <= MAX_W, f'{name}: no entra en {MAX_W}px ({new_cols}x{fw})'

    out = Image.new('RGBA', (new_cols * fw, new_rows * fh), (0, 0, 0, 0))
    for i in range(frames):
        sc, sr = i % old_cols, i // old_cols
        dc, dr = i % new_cols, i // new_cols
        cell = im.crop((sc * fw, sr * fh, (sc + 1) * fw, (sr + 1) * fh))
        out.paste(cell, (dc * fw, dr * fh))

    out.save(path, 'WEBP', quality=90, method=6)
    digest = hashlib.sha256(path.read_bytes()).hexdigest()[:8]
    meta['w'] = out.width
    meta['h'] = out.height
    meta['cols'] = new_cols
    meta['rows'] = new_rows
    meta['v'] = digest
    print(f'{name}: {im.width}x{im.height} ({old_cols}x{old_rows}) -> {out.width}x{out.height} ({new_cols}x{new_rows}), v={digest}')
    return True


def main():
    man = json.loads(MANIFEST.read_text(encoding='utf-8'))
    changed = 0
    for name, meta in man.items():
        if meta.get('file', '').endswith('.webp') and meta.get('w', 0) > MAX_W:
            if repack_one(name, meta):
                changed += 1
    if changed:
        MANIFEST.write_text(json.dumps(man, indent=1, ensure_ascii=False) + '\n', encoding='utf-8')
    print(f'reacomodadas: {changed}')


if __name__ == '__main__':
    main()
