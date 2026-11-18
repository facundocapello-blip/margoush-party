"""Importa el arte de la arena de BIG CHAKY (hecho en Flow) al juego como WebP transparentes.

Uso: python3 -I tools/import_arena.py [--assets 3d/assets] <imagen.jpg|png>...

Nombres de entrada (margoush_arena_<nombre>.jpg|png):
  chaky_front_<pose>      -> arena_chaky_<pose>        (fondo verde, recorte al borde, alto <= 768)
  <douge|marine>_back_<p> -> arena_<heroe>_back_<p>    (ídem)
  barril, cajon           -> arena_barril, arena_cajon (fondo blanco, sombra suave, alto <= 384)
  fondo                   -> arena_fondo               (opaco, ancho <= 1280)
Agrega cada uno a <assets>/manifest.json con la misma forma que los demás props.
"""
import argparse
import json
import os
import re
import sys

import numpy as np
from PIL import Image
from scipy import ndimage

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cut_sheet import remove_background  # noqa: E402
from cut_white import cut_white  # noqa: E402

CHAR_H = 768
OBJ_H = 384
BG_W = 1280
Q_CHAR, Q_OBJ, Q_BG = 82, 82, 82
POSES = {'idle', 'throw', 'slam', 'hurt', 'rage', 'ko'}
HERO_POSES = {'idle', 'run', 'punch', 'hurt'}


def target(stem):
    """(nombre en el juego, tipo) a partir del nombre del archivo, o None."""
    s = re.sub(r'^margoush_arena_', '', stem.lower())
    m = re.fullmatch(r'chaky_front_(\w+)', s)
    if m and m.group(1) in POSES:
        return 'arena_chaky_' + m.group(1), 'char'
    m = re.fullmatch(r'(douge|marine)_back_(\w+)', s)
    if m and m.group(2) in HERO_POSES:
        return f'arena_{m.group(1)}_back_{m.group(2)}', 'char'
    if s in ('barril', 'cajon'):
        return 'arena_' + s, 'obj'
    if s == 'fondo':
        return 'arena_fondo', 'bg'
    return None


def key_green(im):
    """Quita el verde de croma (algo desparejo por el JPG) sin dejar halo."""
    arr = remove_background(im, 'auto')
    rgb = arr[..., :3].astype(int)
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    cap = np.maximum(r, b)
    # verde que sobra en bordes/semitransparentes y en las sombras teñidas: se baja al otro canal más alto
    solid = ndimage.binary_erosion(arr[..., 3] > 250, iterations=3)
    spill = ~solid & (g > cap)
    # sombra verdosa (p. ej. bajo el cuerpo noqueado): se descarta, el juego dibuja la suya
    shade = (g > cap + 4) & (g < 200) & (cap < 150)
    rgb[..., 1] = np.where(spill | shade, cap, g)
    a = arr[..., 3].astype(float)
    a = np.where(shade, 0, a)
    arr[..., :3] = rgb.astype(np.uint8)
    arr[..., 3] = a.astype(np.uint8)
    pure = (arr[..., 3] > 0) & (g - cap > 55) & (g > 110)
    arr[..., 3] = np.where(pure, 0, arr[..., 3])
    # descarta islas chicas sueltas (ruido del JPG), conserva piezas grandes (objetos arrojados)
    mask = arr[..., 3] > 75
    lab, n = ndimage.label(mask, structure=np.ones((3, 3)))
    if n > 1:
        sizes = ndimage.sum(mask, lab, range(1, n + 1))
        keep_ids = [i + 1 for i, s in enumerate(sizes) if s >= max(sizes) * 0.01]
        keep = ndimage.binary_dilation(np.isin(lab, keep_ids), iterations=2)
        arr[..., 3] = np.where(keep, arr[..., 3], 0)
    return Image.fromarray(arr, 'RGBA')


def shadow_black(im, src):
    """La sombra del piso queda negra y suave: sin velo claro/lila del fondo blanco."""
    rgb = np.array(src.convert('RGB')).astype(float)
    a = np.array(im)
    mx, mn = rgb.max(axis=2), rgb.min(axis=2)
    sat = (mx - mn) / np.maximum(mx, 1)
    rows = np.arange(a.shape[0])[:, None] / a.shape[0]
    cand = (a[..., 3] < 250) | ((sat < 0.24) & (mx > 100) & (rows > 0.7)) | ((sat < 0.42) & (mx > 150) & (rows > 0.82))
    lab, _ = ndimage.label(cand)
    seeds = np.unique(lab[a[..., 3] < 250])
    shadow = np.isin(lab, seeds[seeds > 0]) & (rows > 0.62)
    shadow = shadow | (a[..., 3] < 250)
    a[..., :3] = np.where(shadow[..., None], 0, a[..., :3])
    soft = np.clip((250 - mx) / 150, 0, 0.55) * 255
    a[..., 3] = np.where(shadow, np.minimum(a[..., 3], soft).astype(np.uint8), a[..., 3])
    return Image.fromarray(a, 'RGBA')


def crop_fit(im, max_h):
    bbox = Image.fromarray((np.array(im)[..., 3] > 12).astype(np.uint8) * 255).getbbox()
    im = im.crop(bbox)
    if im.height > max_h:
        im = im.resize((round(im.width * max_h / im.height), max_h), Image.LANCZOS)
    return im


def import_one(src, assets):
    stem = os.path.splitext(os.path.basename(src))[0]
    t = target(stem)
    if not t:
        raise SystemExit(f'No sé qué es «{stem}»: usá margoush_arena_<nombre>.jpg|png con los nombres de la guía.')
    name, kind = t
    src_im = Image.open(src)
    if kind == 'char':
        im, q = crop_fit(key_green(src_im.convert('RGBA')), CHAR_H), Q_CHAR
    elif kind == 'obj':
        im, q = crop_fit(shadow_black(cut_white(src_im), src_im), OBJ_H), Q_OBJ
    else:
        im = src_im.convert('RGB')
        if im.width > BG_W:
            im = im.resize((BG_W, round(im.height * BG_W / im.width)), Image.LANCZOS)
        q = Q_BG
    out = os.path.join(assets, name + '.webp')
    im.save(out, 'WEBP', quality=q, method=6)
    path = os.path.join(assets, 'manifest.json')
    man = json.load(open(path, encoding='utf-8'))
    man[name] = {'file': name + '.webp', 'w': im.width, 'h': im.height, 'frames': 1, 'cols': 1, 'rows': 1}
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(man, f, indent=1, ensure_ascii=False)
        f.write('\n')
    return name, man[name], os.path.getsize(out)


if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('src', nargs='+')
    ap.add_argument('--assets', default=os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '3d', 'assets'))
    a = ap.parse_args()
    for s in a.src:
        name, meta, size = import_one(s, a.assets)
        print('ok', name, json.dumps(meta), size)
