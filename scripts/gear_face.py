"""The Gear Cube's face, flat, 13 pieces, as agreed piece by piece: draws it
(argv[1], a PNG to look at) and, given a folder (argv[2]), the mask of one
piece of each kind at its set place (src/assets/gear: a corner top right, a
gear and a clip at the top, the center), which src/three/gearFace.ts turns
into place, and their outlines (outlines.json) for their volumes. Units: a cell is 100, the face 300 x 300, drawn at SCALE.

    python3 scripts/gear_face.py /tmp/face.png src/assets/gear
"""
import json, math, sys
from PIL import Image, ImageChops, ImageDraw

SCALE = 2
GREEN = (0, 145, 70)
GAP = 5                      # white seam between pieces

# --- the gear (an edge): a half disc on the face's side, 3 teeth inward
R = 50                       # half disc radius (the middle cell's width)
# Each tooth: direction (degrees from straight in), width at the disc, width
# at its end, length past the disc. All flare out, wider at their end than at
# the gear's heart: the middle one thin and long, a little; the two others
# more.
TEETH = [(-60, 13, 22, 20), (0, 11, 16, 32), (60, 13, 22, 20)]

# --- the center and its clips
SQUARE = 44                  # center square side
CLIP_W = 50                  # a clip's U, across: just wider than the square
CLIP_D = 22                  # its depth, toward the center
BAR = 7                      # its bars' thickness
CLIP_AT = 34                 # its base's distance from the square's side

def gear_polygons(cx, cy, inward):
    """The gear at (cx, cy) on the face's border, `inward` the unit vector
    toward the face's center: its half disc, then each tooth."""
    ix, iy = inward
    base = math.atan2(iy, ix)
    disc = []
    steps = 60
    for k in range(steps + 1):
        a = base - math.pi / 2 + math.pi * k / steps
        disc.append((cx + math.cos(a) * R, cy + math.sin(a) * R))
    teeth = []
    for t, root, tip, length in TEETH:
        a = base + math.radians(t)
        ux, uy = math.cos(a), math.sin(a)      # along the tooth
        sx, sy = -uy, ux                        # across it
        # From a little inside the disc (so it joins it) to its end.
        r0, r1 = R - 6, R + length
        teeth.append([
            (cx + ux * r0 - sx * root / 2, cy + uy * r0 - sy * root / 2),
            (cx + ux * r1 - sx * tip / 2, cy + uy * r1 - sy * tip / 2),
            (cx + ux * r1 + sx * tip / 2, cy + uy * r1 + sy * tip / 2),
            (cx + ux * r0 + sx * root / 2, cy + uy * r0 + sy * root / 2),
        ])
    return [disc] + teeth

def scaled(pts):
    return [(x * SCALE, y * SCALE) for x, y in pts]

img = Image.new('RGB', (300 * SCALE, 300 * SCALE), 'white')
ROUND = 3.5                    # every outward corner rounded, this radius
ROUND_CLIP = 1.5               # a clip's, finer (its bars are thin)

class Piece:
    """A piece's mask, drawn with the ImageDraw calls the face used."""
    def __init__(self):
        self.mask = Image.new('L', img.size, 0)
        self.draw = ImageDraw.Draw(self.mask)
        self.outline = []
    def polygon(self, pts, fill=None):
        self.draw.polygon(pts, fill=255)
        self.outline.append([(x / SCALE, y / SCALE) for x, y in pts])
    def rectangle(self, box, fill=None):
        self.draw.rectangle(box, fill=255)
        x0, y0, x1, y1 = (v / SCALE for v in box)
        self.outline.append([(x0, y0), (x1, y0), (x1, y1), (x0, y1)])

def disc(r):
    r = int(round(r))
    return [(dx, dy) for dx in range(-r, r + 1) for dy in range(-r, r + 1) if dx * dx + dy * dy <= r * r]

def morph(mask, r, op):
    out = mask
    for dx, dy in disc(r):
        out = op(out, ImageChops.offset(mask, dx, dy))
    return out

def rounded(mask, r):
    """Outward corners rounded to radius r, inward ones kept sharp."""
    return morph(morph(mask, r, ImageChops.darker), r, ImageChops.lighter)

pieces = []
def piece(r=ROUND, kind=''):
    p = Piece(); p.r = r; p.kind = kind; pieces.append(p); return p

gears = [
    gear_polygons(150, 0, (0, 1)),
    gear_polygons(150, 300, (0, -1)),
    gear_polygons(0, 150, (1, 0)),
    gear_polygons(300, 150, (-1, 0)),
]

# Corners: the top right one as traced (half of it, to its diagonal), the
# other half its mirror across that diagonal, the others turned a quarter at
# a time.
# Its two small teeth, square: one pointing across (left), the other (its
# mirror) pointing down, at right angles, their notch on the diagonal. Its
# points along the face's border, beside the gears, thin toward the corner.
HALF = [(205, 0), (240, 14), (222, 70), (198, 70), (198, 85), (215, 85)]
mirror = lambda p: (300 - p[1], 300 - p[0])
CORNER = [(300, 0)] + HALF + [mirror(p) for p in reversed(HALF[:-1])]
def turn(p, k):
    x, y = p
    for _ in range(k):
        x, y = 300 - y, x
    return (x, y)
CHAMFER = 6                  # a sharp point of a corner's, cut this far back

def chamfered(poly, limit=80):
    """Each point sharper than `limit` degrees cut back along its two sides."""
    out = []
    n = len(poly)
    for i, (x, y) in enumerate(poly):
        px, py = poly[i - 1]
        nx, ny = poly[(i + 1) % n]
        a = (px - x, py - y)
        b = (nx - x, ny - y)
        la, lb = math.hypot(*a), math.hypot(*b)
        angle = math.degrees(math.acos((a[0] * b[0] + a[1] * b[1]) / (la * lb)))
        if angle < limit:
            out.append((x + a[0] / la * CHAMFER, y + a[1] / la * CHAMFER))
            out.append((x + b[0] / lb * CHAMFER, y + b[1] / lb * CHAMFER))
        else:
            out.append((x, y))
    return out

CORNER = chamfered(CORNER)
for k in range(4):
    piece(kind='corner' if k == 0 else '').polygon(scaled([turn(p, k) for p in CORNER]))

# Gears.
for i, g in enumerate(gears):
    gp = piece(kind='gear' if i == 0 else '')
    for p in g:
        gp.polygon(scaled(p))

# Center square.
c0, c1 = 150 - SQUARE / 2, 150 + SQUARE / 2
piece(kind='center').rectangle([c0 * SCALE, c0 * SCALE, c1 * SCALE, c1 * SCALE])

# Clips: a U on each side of the square, open toward it.
CLIP_TIP = 23.5               # the arms lean in: their ends almost the square's width
CLIP_BOW = 4                 # the base bows toward the center, this deep
ARM_BASE, ARM_END = 9, 5.5   # an arm's width at the base, at its end
def clip(rotate):
    # Drawn for the top side, then turned a quarter at a time about the center.
    y0 = c0 - CLIP_AT
    y1 = y0 + CLIP_D
    half = CLIP_W / 2
    arc = [half * (2 * k / 40 - 1) for k in range(41)]
    # A circle's arc between the arms, CLIP_BOW deep in its middle; flat
    # above the arms, so nothing juts out where they meet it.
    inner = half - ARM_BASE
    radius = (inner ** 2 + CLIP_BOW ** 2) / (2 * CLIP_BOW)
    bow = lambda x: 0 if abs(x) >= inner else CLIP_BOW - (radius - math.sqrt(radius ** 2 - x ** 2))
    shapes = [
        # The base, full width, bowed a little toward the center (an arc).
        [(150 + x, y0 + bow(x)) for x in arc] + [(150 + x, y0 + BAR + bow(x)) for x in reversed(arc)],
        # The arms, leaning in toward their ends, thinning a little there.
        [(150 - half, y0), (150 - half + ARM_BASE, y0), (150 - CLIP_TIP + ARM_END, y1), (150 - CLIP_TIP, y1)],
        [(150 + half - ARM_BASE, y0), (150 + half, y0), (150 + CLIP_TIP, y1), (150 + CLIP_TIP - ARM_END, y1)],
    ]
    a = math.radians(90 * rotate)
    cp = piece(ROUND_CLIP, 'clip' if rotate == 0 else '')
    for corners in shapes:
        turned = [(150 + (x - 150) * math.cos(a) - (y - 150) * math.sin(a),
                   150 + (x - 150) * math.sin(a) + (y - 150) * math.cos(a)) for x, y in corners]
        cp.polygon(scaled(turned))
for k in range(4):
    clip(k)

for p in pieces:
    m = rounded(p.mask, p.r * SCALE)
    img.paste(GREEN, mask=m)
    if p.kind and len(sys.argv) > 2:
        m.save(f'{sys.argv[2]}/{p.kind}.png', optimize=True)
if len(sys.argv) > 2:
    # Each kind's outline (its polygons, in face units), for its pieces'
    # volumes in 3D (src/three/gearFace.ts).
    with open(f'{sys.argv[2]}/outlines.json', 'w') as f:
        json.dump({p.kind: [[[round(x, 2), round(y, 2)] for x, y in poly] for poly in p.outline]
                   for p in pieces if p.kind}, f)
img.save(sys.argv[1])
