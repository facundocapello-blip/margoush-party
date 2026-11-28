# Repara agujeros que dejó el recorte de fondo verde en poses de arena (ropa oscura quedaba transparente).
# Uso: python3 -I tools/fix_alpha_holes.py 3d/assets/arena_x_pose.webp  (sobrescribe; probar con copia)
import sys
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
def disk(r):
    y, x = np.ogrid[-r:r+1, -r:r+1]; return x*x + y*y <= r*r
def fix(path, out=None, dry=False):
    im = Image.open(path).convert('RGBA'); a = np.array(im).astype(int)
    alpha = a[..., 3]; rgb = a[..., :3]
    opaque = alpha > 128
    trans = alpha < 40
    nz = rgb.max(2) >= 14
    brightgreen = (rgb[..., 1] > 150) & (rgb[..., 1] > rgb[..., 0] + 60)
    lab, n = ndi.label(trans)
    border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    fill = np.zeros_like(trans)
    for i in range(1, n + 1):
        if i in border: continue
        m = lab == i
        if m.sum() < 2: fill |= m; continue
        if m.sum() <= 2500 and (nz & m).sum() / m.sum() > 0.25 and not (brightgreen & m).mean() > 0.3: fill |= m
    closed = ndi.binary_closing(np.pad(opaque, 16), structure=disk(11))[16:-16, 16:-16]
    fill |= trans & closed & ~brightgreen & (nz | ndi.binary_closing(np.pad(opaque,16),structure=disk(11))[16:-16,16:-16])
    # evitar rellenar fleco exterior: exigir vecindad opaca
    near = ndi.binary_dilation(opaque, structure=disk(3))
    fill &= near | (~np.isin(lab, list(border)))
    cnt = int(fill.sum())
    if cnt and not dry:
        r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
        g2 = np.minimum(g, np.maximum(r, b) + 4)
        a[..., 1] = np.where(fill, g2, g)
        a[..., 3] = np.where(fill, 255, alpha)
        # alpha parcial de borde queda igual
        Image.fromarray(a.astype('uint8'), 'RGBA').save(out or path, 'WEBP', quality=90, alpha_quality=100, method=6)
    return cnt
if __name__ == '__main__':
    for p in sys.argv[1:]: print(p.split('/')[-1], fix(p, dry=True))
