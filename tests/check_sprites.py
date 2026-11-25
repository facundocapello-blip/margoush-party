"""Verifica las tiras de correr: sin restos de cuadros vecinos y pies alineados. Sale con 1 si falla."""
import json, sys
import numpy as np
from PIL import Image
from scipy import ndimage

base = sys.argv[1]
man = json.load(open(base + '/manifest.json'))
bad = []
for name in ['douge_run', 'marine_run', 'chaky_run']:
    m = man[name]
    im = np.array(Image.open(base + '/' + m['file']).convert('RGBA'))
    fw = im.shape[1] // m['cols']
    bottoms = []
    for k in range(m['frames']):
        a = im[:, k * fw:(k + 1) * fw, 3] > 80
        lab, n = ndimage.label(a)
        sizes = ndimage.sum(a, lab, range(1, n + 1))
        main = sizes.max()
        if a.sum() - main > a.sum() * 0.01:
            bad.append(f'{name}[{k}] tiene restos sueltos ({int(a.sum() - main)} px)')
        bottoms.append(np.nonzero(a.any(axis=1))[0].max())
    if max(bottoms) - min(bottoms) > 3:
        bad.append(f'{name}: pies desalineados {bottoms}')
for name in ['douge_idle', 'douge_run', 'douge_attack', 'marine_idle', 'marine_run', 'marine_attack']:
    if not man[name].get('skull'):
        bad.append(f'{name}: falta el ancho de cabeza (skull) en el manifiesto')
print('\n'.join(bad) or 'ok')
sys.exit(1 if bad else 0)
