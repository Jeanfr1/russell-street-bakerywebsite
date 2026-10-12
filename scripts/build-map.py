"""Draw the Visit map from real OpenStreetMap geometry.

Input: assets-src/osm/area.json (Overpass, ways with geometry around Behan
Square: highways, Croke Park, the Royal Canal, the railway). The bakery's
OSM node sits at the exact centre of the viewBox, so the pin drawn at 50%/50%
stays on it under preserveAspectRatio="xMidYMid slice" at any aspect ratio.
Output: src/data/map.svg (inlined by src/render.js). © OpenStreetMap contributors.
Run: ~/anaconda3/bin/python3 scripts/build-map.py
"""
import json
import math
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LAT0, LON0 = 53.3590857, -6.2543962  # node shop=bakery "Russell Street Bakery"
VW, VH = 1500, 1000  # metres shown at the widest/tallest
KX = math.cos(math.radians(LAT0)) * 111320
KY = 110540

with open(os.path.join(ROOT, 'assets-src', 'osm', 'area.json')) as f:
    elements = json.load(f)['elements']


def xy(pt):
    return ((pt['lon'] - LON0) * KX, -(pt['lat'] - LAT0) * KY)


def simplify(pts, tol=1.6):
    """Douglas-Peucker on projected points (metres)."""
    if len(pts) < 3:
        return pts
    (x0, y0), (x1, y1) = pts[0], pts[-1]
    dx, dy = x1 - x0, y1 - y0
    norm = math.hypot(dx, dy) or 1e-9
    dmax, idx = 0, 0
    for i, (x, y) in enumerate(pts[1:-1], 1):
        d = abs(dy * x - dx * y + x1 * y0 - y1 * x0) / norm
        if d > dmax:
            dmax, idx = d, i
    if dmax > tol:
        return simplify(pts[:idx + 1], tol)[:-1] + simplify(pts[idx:], tol)
    return [pts[0], pts[-1]]


def path(pts, close=False):
    if len(pts) > 3 and pts[0] == pts[-1]:
        # a closed ring has no chord to measure against: simplify two halves
        mid = len(pts) // 2
        pts = simplify(pts[:mid + 1])[:-1] + simplify(pts[mid:])
    else:
        pts = simplify(pts)
    d = 'M' + ' L'.join(f'{x:.0f} {y:.0f}' for x, y in pts)
    return d + (' Z' if close else '')


def visible(pts, margin=120):
    return any(abs(x) < VW / 2 + margin and abs(y) < VH / 2 + margin for x, y in pts)


ROAD_CLASS = {
    'primary': 'major', 'secondary': 'major', 'secondary_link': 'major', 'trunk': 'major',
    'tertiary': 'mid', 'tertiary_link': 'mid',
    'residential': 'minor', 'living_street': 'minor', 'unclassified': 'minor', 'pedestrian': 'minor',
}
layers = {'canal': [], 'stadium': [], 'rail': [], 'major': [], 'mid': [], 'minor': []}
russell = []
for e in elements:
    if 'geometry' not in e:
        continue
    tags = e.get('tags', {})
    pts = [xy(p) for p in e['geometry']]
    if not visible(pts):
        continue
    if tags.get('leisure') == 'stadium':
        layers['stadium'].append(path(pts, close=True))
    elif tags.get('waterway') == 'canal':
        layers['canal'].append(path(pts))
    elif tags.get('railway') == 'rail' and 'service' not in tags:
        layers['rail'].append(path(pts))
    elif tags.get('highway') in ROAD_CLASS:
        layers[ROAD_CLASS[tags['highway']]].append(path(pts))
        if tags.get('name') == 'Russell Street':
            russell.extend(pts)

# label Russell Street along its own direction, offset from the pin
if russell:
    # principal axis of all Russell Street points (its ways are not ordered)
    mx = sum(p[0] for p in russell) / len(russell)
    my = sum(p[1] for p in russell) / len(russell)
    sxx = sum((p[0] - mx) ** 2 for p in russell)
    syy = sum((p[1] - my) ** 2 for p in russell)
    sxy = sum((p[0] - mx) * (p[1] - my) for p in russell)
    ang = math.degrees(0.5 * math.atan2(2 * sxy, sxx - syy))
    if ang > 90:
        ang -= 180
    if ang < -90:
        ang += 180
    ux, uy = math.cos(math.radians(ang)), math.sin(math.radians(ang))
    nearest = min(russell, key=lambda p: math.hypot(*p))
    lx, ly = nearest[0] - ux * 150 - uy * 14, nearest[1] - uy * 150 + ux * 14
else:
    ang, lx, ly = 0, -150, -14

stadium_c = None
for e in elements:
    if e.get('tags', {}).get('leisure') == 'stadium' and 'geometry' in e:
        pts = [xy(p) for p in e['geometry']]
        stadium_c = (sum(p[0] for p in pts) / len(pts), sum(p[1] for p in pts) / len(pts))

svg = [f'<svg class="map-svg" viewBox="{-VW / 2:.0f} {-VH / 2:.0f} {VW} {VH}" preserveAspectRatio="xMidYMid slice" '
       'xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="map-title">',
       '<title id="map-title">Map: Russell Street Bakery at Behan Square, Russell Street, beside Croke Park and the Royal Canal, Dublin 1</title>',
       f'<rect x="{-VW}" y="{-VH}" width="{VW * 2}" height="{VH * 2}" class="m-ground"/>']
for cls in ('stadium', 'canal', 'rail', 'minor', 'mid', 'major'):
    if layers[cls]:
        svg.append(f'<path class="m-{cls}" d="{" ".join(layers[cls])}"/>')
if stadium_c:
    svg.append(f'<text class="m-place" x="{stadium_c[0]:.0f}" y="{stadium_c[1]:.0f}" text-anchor="middle">Croke Park</text>')
svg.append(f'<text class="m-street" transform="translate({lx:.0f} {ly:.0f}) rotate({ang:.1f})" text-anchor="middle">RUSSELL STREET</text>')
svg.append('<g class="m-pin"><circle r="26" class="m-pin-halo"/><circle r="9"/></g>')
svg.append('</svg>')
out = os.path.join(ROOT, 'src', 'data', 'map.svg')
with open(out, 'w') as f:
    f.write('\n'.join(svg) + '\n')
print(out, os.path.getsize(out) // 1024, 'KB', {k: len(v) for k, v in layers.items()}, 'russell pts', len(russell), 'angle', round(ang, 1))
