"""Measure the hero layers against the kit's master scene.

1. Registers 05-camadas/pa-e-massas.png (peel + three doughs, RGBA) onto
   03-hero/forno-cena-mestre.png with SIFT + RANSAC (similarity transform).
   The kit says the layer was recomposed by the generator, so the preset
   numbers in the study (scale .70, +8vh) are guesses; this is the measurement.
2. Splits 05-camadas/croissant-em-camadas.png into its five sections and the
   ingredient cloud by connected components on alpha, so each piece can move
   on its own without the ghosting a straight CSS clip leaves on slanted cuts.

Writes src/data/hero.json and verification overlays to assets-src/measure/.
Masters are read only. Run: npm run hero
"""
import json
import os
import sys

import cv2
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = lambda *a: os.path.join(ROOT, *a)
OUT = P('assets-src', 'measure')
os.makedirs(OUT, exist_ok=True)
os.makedirs(P('assets-src', 'layers'), exist_ok=True)


def read_rgba(path):
    im = cv2.imread(path, cv2.IMREAD_UNCHANGED)
    if im.shape[2] == 3:
        im = cv2.cvtColor(im, cv2.COLOR_BGR2BGRA)
    return im


# ---------------------------------------------------------------- peel
master = cv2.imread(P('03-hero', 'forno-cena-mestre.png'))
plate = cv2.imread(P('03-hero', 'forno-fundo.png'))
peel = read_rgba(P('05-camadas', 'pa-e-massas.png'))
H, W = master.shape[:2]

sift = cv2.SIFT_create(nfeatures=6000)
mask_peel = (peel[..., 3] > 200).astype(np.uint8) * 255
mask_peel = cv2.erode(mask_peel, np.ones((9, 9), np.uint8))
kp1, d1 = sift.detectAndCompute(cv2.cvtColor(peel[..., :3], cv2.COLOR_BGR2GRAY), mask_peel)
# search only the lower half of the master, where the peel sits
mask_master = np.zeros((H, W), np.uint8)
mask_master[int(H * .5):, :] = 255
kp2, d2 = sift.detectAndCompute(cv2.cvtColor(master, cv2.COLOR_BGR2GRAY), mask_master)
matcher = cv2.BFMatcher(cv2.NORM_L2)
good = [m for m, n in matcher.knnMatch(d1, d2, k=2) if m.distance < .75 * n.distance]
src = np.float32([kp1[m.queryIdx].pt for m in good])
dst = np.float32([kp2[m.trainIdx].pt for m in good])
A, inl = cv2.estimateAffinePartial2D(src, dst, method=cv2.RANSAC, ransacReprojThreshold=4, maxIters=20000, confidence=.999)
s = float(np.hypot(A[0, 0], A[1, 0]))
rot = float(np.degrees(np.arctan2(A[1, 0], A[0, 0])))
tx, ty = float(A[0, 2]), float(A[1, 2])
n_in = int(inl.sum())
err = np.linalg.norm((src[inl.ravel() == 1] @ A[:, :2].T + A[:, 2]) - dst[inl.ravel() == 1], axis=1)
print(f'peel: {len(good)} matches, {n_in} inliers, scale {s:.4f}, rot {rot:.2f} deg, t=({tx:.1f},{ty:.1f}), median err {np.median(err):.2f}px')

# composite the registered peel over the empty oven and compare with the master
warp = cv2.warpAffine(peel, A, (W, H), flags=cv2.INTER_LINEAR, borderValue=(0, 0, 0, 0))
a = warp[..., 3:4].astype(np.float32) / 255
comp = (plate.astype(np.float32) * (1 - a) + warp[..., :3].astype(np.float32) * a).astype(np.uint8)
cv2.imwrite(os.path.join(OUT, 'peel-rebuilt.jpg'), comp, [cv2.IMWRITE_JPEG_QUALITY, 88])
side = np.hstack([master, comp])
cv2.imwrite(os.path.join(OUT, 'peel-side-by-side.jpg'), cv2.resize(side, (side.shape[1] // 2, side.shape[0] // 2)), [cv2.IMWRITE_JPEG_QUALITY, 85])
cv2.imwrite(os.path.join(OUT, 'peel-blend50.jpg'), cv2.addWeighted(master, .5, comp, .5, 0), [cv2.IMWRITE_JPEG_QUALITY, 85])
diff = cv2.absdiff(master, comp).mean()
print(f'peel: mean abs diff rebuilt vs master {diff:.2f}')

# the handle on the empty oven plate: lowest row where the wooden handle is
# visible, measured as the joint the blade must stay attached to.
JOINT = (990.0, 682.0)  # px on the 1536x1024 canvas: where the handle on the plate disappears behind the middle dough (joint-zoom.jpg)
dbg = comp.copy()
cv2.circle(dbg, (int(JOINT[0]), int(JOINT[1])), 10, (0, 0, 255), 2)
ys, xs = np.where(warp[..., 3] > 128)
bbox_peel = [int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())]
cv2.rectangle(dbg, tuple(bbox_peel[:2]), tuple(bbox_peel[2:]), (0, 255, 0), 2)
cv2.imwrite(os.path.join(OUT, 'peel-joint.jpg'), dbg, [cv2.IMWRITE_JPEG_QUALITY, 85])

# content box of the layer itself (soft edges included), so the web copy only
# carries the peel and not 60% of transparent canvas
ya, xa = np.where(peel[..., 3] > 2)
PAD = 8
content = [max(int(xa.min()) - PAD, 0), max(int(ya.min()) - PAD, 0)]
content += [min(int(xa.max()) + PAD + 1, W) - content[0], min(int(ya.max()) + PAD + 1, H) - content[1]]

# ---------------------------------------------------------------- croissant
cro = read_rgba(P('05-camadas', 'croissant-em-camadas.png'))
alpha = cro[..., 3]
core = (alpha > 140).astype(np.uint8)
n, lab, stats, cent = cv2.connectedComponentsWithStats(core, connectivity=8)
order = np.argsort(-stats[1:, cv2.CC_STAT_AREA]) + 1
big = [i for i in order if stats[i, cv2.CC_STAT_AREA] > 20000]
# five largest blobs in the lower band are the croissant sections
sections = sorted([i for i in big if cent[i][1] > H * .45], key=lambda i: cent[i][0])
print('croissant components >20k px:', [(int(i), int(stats[i, 4]), tuple(int(v) for v in cent[i])) for i in big])
if len(sections) != 5:
    sys.exit(f'expected 5 croissant sections, found {len(sections)}')

# every visible pixel (soft glow included) goes to its nearest section core,
# or to the ingredient cloud when it is nearer to a non-section blob.
section_mask = np.isin(lab, sections)
seeds = np.zeros((H, W), np.int32)
for k, i in enumerate(sections, 1):
    seeds[lab == i] = k
seeds[(core > 0) & ~section_mask] = 6  # ingredients, crumbs, butter, wheat
dist_inputs = []
for k in range(1, 7):
    d = cv2.distanceTransform((seeds != k).astype(np.uint8), cv2.DIST_L2, 5)
    dist_inputs.append(d)
owner = np.argmin(np.stack(dist_inputs), axis=0) + 1
visible = alpha > 2
# the flour stream lands on the crest of the middle section: above its crust
# (y < 374, read on s3-top-zoom.jpg) the pixels belong to the floating flour.
CREST = {3: 374}
# the flour stream itself spans x 660-820 at the crest; crumbs beside it keep
# their full alpha.
FLOUR_FEATHER = [(374, (660, 820))]
rows = np.arange(H)[:, None]
for k, y_cut in CREST.items():
    owner[(owner == k) & (rows < y_cut)] = 6

pieces = []
names = ['s1', 's2', 's3', 's4', 's5', 'ingredients']
for k, name in enumerate(names, 1):
    m = visible & (owner == k)
    ys, xs = np.where(m)
    x0, y0, x1, y1 = int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1
    piece = cro[y0:y1, x0:x1].copy()
    piece[..., 3] = np.where(m[y0:y1, x0:x1], piece[..., 3], 0)
    if name == 'ingredients':
        # soften the straight cut where the flour leaves the middle crest
        for y_cut, (sx0, sx1) in FLOUR_FEATHER:
            ramp = np.clip((y_cut - np.arange(y_cut - 14, y_cut)) / 14, 0, 1)
            band = piece[y_cut - 14 - y0:y_cut - y0, sx0 - x0:sx1 - x0, 3].astype(np.float32)
            piece[y_cut - 14 - y0:y_cut - y0, sx0 - x0:sx1 - x0, 3] = (band * ramp[:, None]).astype(np.uint8)
    cv2.imwrite(P('assets-src', 'layers', f'croissant-{name}.png'), piece)
    pieces.append({'id': name, 'x': x0, 'y': y0, 'w': x1 - x0, 'h': y1 - y0})

# exploded view: every piece moved further than the page ever moves it, on
# cream, to show ghosts or missing pixels at the cuts.
def compose(shifts, pad=100):
    canvas = np.full((H + 2 * pad, W + 2 * pad, 3), (221, 235, 244), np.float32)
    for p, (dx, dy) in zip(pieces, shifts):
        img = cv2.imread(P('assets-src', 'layers', f"croissant-{p['id']}.png"), cv2.IMREAD_UNCHANGED).astype(np.float32)
        x0, y0 = p['x'] + dx + pad, p['y'] + dy + pad
        a = img[..., 3:4] / 255
        region = canvas[y0:y0 + p['h'], x0:x0 + p['w']]
        canvas[y0:y0 + p['h'], x0:x0 + p['w']] = region * (1 - a) + img[..., :3] * a
    return canvas[pad:pad + H, pad:pad + W].astype(np.uint8)


closed = compose([(0, 0)] * 6)
cv2.imwrite(os.path.join(OUT, 'croissant-exploded.jpg'),
            np.vstack([closed, compose([(-70, 0), (-35, 6), (0, -4), (35, -6), (70, 4), (0, -40)])]),
            [cv2.IMWRITE_JPEG_QUALITY, 85])
ref = np.full((H, W, 3), (221, 235, 244), np.float32)
ref = (ref * (1 - alpha[..., None] / 255) + cro[..., :3] * (alpha[..., None] / 255)).astype(np.uint8)
print(f'croissant: mean abs diff closed pieces vs master {cv2.absdiff(ref, closed).mean():.3f}')

data = {
    'canvas': [W, H],
    'peel': {
        'note': 'similarity transform that puts 05-camadas/pa-e-massas.png on 03-hero/forno-cena-mestre.png',
        'scale': round(s, 5), 'rotation_deg': round(rot, 3), 'tx': round(tx, 2), 'ty': round(ty, 2),
        'inliers': n_in, 'median_err_px': round(float(np.median(err)), 2),
        'joint': list(JOINT), 'bbox_registered': bbox_peel,
        'content_rect': content,
    },
    'croissant': {'pieces': pieces},
}
os.makedirs(P('src', 'data'), exist_ok=True)
with open(P('src', 'data', 'hero.json'), 'w') as f:
    json.dump(data, f, indent=2)
print(json.dumps(data, indent=2))
