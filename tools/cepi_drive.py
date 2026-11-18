# Arma chase_cepi_drive.webp: el BYD con Cepi adentro manejando (sin asomarse), a partir de chase_cepi_windup.
import sys
from PIL import Image, ImageDraw, ImageFilter
src, out = sys.argv[1], sys.argv[2]
im = Image.open(src).convert('RGBA')
W, H = im.size
px = im.load()
orig = im.copy(); op = orig.load()
# 1) todo lo que está por encima del techo (cabeza, paleta, pelota) se borra
ROOF = 144
for y in range(0, ROOF):
    for x in range(W): px[x, y] = (0, 0, 0, 0)
# 2) por encima del parante delantero (de (130,146) a (56,210)) también, salvo el espejo
def above_pillar(x, y):
    if x >= 150: return False
    if 36 <= x <= 70 and 194 <= y <= 228: return False  # espejo
    if x < 52: return y < 195
    t = (x - 56) / (130 - 56)
    return y < 210 + (146 - 210) * t - 1
for y in range(ROOF, 215):
    for x in range(0, 150):
        if above_pillar(x, y): px[x, y] = (0, 0, 0, 0)
# 3) la puerta debajo de la mano: se copia la puerta de más a la derecha
for y in range(205, 242):
    for x in range(40, 101):
        if op[x, y][3] == 0: continue
        if 36 <= x <= 70 and y <= 226 and sum(op[x, y][:3]) < 330: continue  # espejo
        sx = int(round(101 + (101 - x) * 0.62))  # espejo de la puerta limpia
        r, g, b, a = op[sx, y]
        px[x, y] = (r, g, b, 255)
# 4) vidrio lateral polarizado con Cepi adentro (silueta oscura, gorra, mirando hacia adelante)
glass = Image.new('RGBA', (W, H), (0, 0, 0, 0)); gd = ImageDraw.Draw(glass)
poly = [(58, 209), (128, 149), (152, 147), (153, 207)]
gd.polygon(poly, fill=(44, 50, 64, 255))
mask = Image.new('L', (W, H), 0); ImageDraw.Draw(mask).polygon(poly, fill=255)
# reflejo del cielo arriba
sky = Image.new('RGBA', (W, H), (0, 0, 0, 0)); sd = ImageDraw.Draw(sky)
sd.polygon([(98, 176), (128, 151), (152, 149), (152, 158), (108, 178)], fill=(150, 160, 190, 120))
glass.alpha_composite(sky)
# Cepi: cabeza, gorra con visera hacia adelante (izquierda), hombro y mano al volante
cd = ImageDraw.Draw(glass)
sil = (20, 22, 30, 255)
cd.ellipse((100, 165, 128, 195), fill=sil)             # cabeza
cd.pieslice((97, 156, 131, 186), 180, 360, fill=(78, 80, 92, 255))  # gorra
cd.polygon([(99, 172), (84, 175), (86, 178), (100, 176)], fill=(66, 68, 80, 255))  # visera
cd.polygon([(92, 207), (100, 192), (132, 190), (146, 207)], fill=sil)  # hombros
cd.ellipse((70, 186, 92, 200), outline=(16, 18, 24, 255), width=3)  # volante
glass = glass.filter(ImageFilter.GaussianBlur(0.8))
glass.putalpha(Image.composite(glass.getchannel('A'), Image.new('L', (W, H), 0), mask))
im.alpha_composite(glass)
# marco del vidrio
d = ImageDraw.Draw(im)
d.line([(56, 210), (129, 147)], fill=(38, 40, 48, 255), width=3)
d.line([(56, 210), (153, 207)], fill=(30, 32, 38, 255), width=2)
d.polygon([(120, 147), (153, 143), (153, 149), (122, 151)], fill=(228, 230, 236, 255))  # borde del techo
d.line([(66, 213), (100, 212)], fill=(150, 154, 164, 255), width=1)  # línea de cintura
im.save(out, 'WEBP', quality=90, method=6)
