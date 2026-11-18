"""Borra la pelota de pádel dibujada en un sprite (la pelota la tira el juego aparte).

Uso: python3 -I tools/erase_ball.py <sprite.webp> [<sprite.webp> ...]
Busca manchas amarillo-verdosas grandes y las vuelve transparentes (con un margen de 3 px).
"""
import sys
import numpy as np
from PIL import Image
from scipy import ndimage

for path in sys.argv[1:]:
    im = Image.open(path).convert('RGBA')
    a = np.array(im).astype(int)
    r, g, b, al = a[..., 0], a[..., 1], a[..., 2], a[..., 3]
    ball = (al > 40) & (g > 150) & (r > 130) & (b < 120) & (g > b + 70) & (abs(r - g) < 70)
    lab, n = ndimage.label(ball)
    keep = np.zeros_like(ball)
    for i in range(1, n + 1):
        comp = lab == i
        if comp.sum() > 40: keep |= comp
    # la pelota entera (incluye el borde y la línea blanca) + margen
    filled = ndimage.binary_fill_holes(ndimage.binary_closing(keep, iterations=3))
    mask = ndimage.binary_dilation(filled, iterations=3)
    out = np.array(im)
    out[mask, 3] = 0
    # motitas sueltas que quedaron del brillo de la pelota
    solid = out[..., 3] > 20
    lab2, n2 = ndimage.label(solid)
    if n2 > 1:
        sizes = ndimage.sum(solid, lab2, range(1, n2 + 1))
        for i, sz in enumerate(sizes):
            if sz < 120: out[lab2 == i + 1, 3] = 0
    # borde verde del recorte original (chroma): se lo lleva al gris
    rgb = out[..., :3].astype(int)
    edge = ndimage.binary_dilation(out[..., 3] < 200, iterations=4) & (out[..., 3] > 0)
    green = edge & (rgb[..., 1] > rgb[..., 0] + 25) & (rgb[..., 1] > rgb[..., 2] + 25)
    cap = np.maximum(rgb[..., 0], rgb[..., 2])
    out[..., 1] = np.where(green, cap, out[..., 1])
    Image.fromarray(out, 'RGBA').save(path, 'WEBP', quality=90, method=6)
    print(path, int(mask.sum()), 'px borrados')
