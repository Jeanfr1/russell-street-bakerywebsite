"""Subset the kit's P052 (URW base35, AGPL-3 with font exception) to the
glyphs the site uses and convert to WOFF2. The licence text ships next to the
fonts in public/fonts/. Run: npm run fonts"""
import os
import shutil

from fontTools import subset

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, '08-estudo', 'fonts')
OUT = os.path.join(ROOT, 'public', 'fonts')
os.makedirs(OUT, exist_ok=True)

# Basic Latin, Latin-1, Latin Extended-A, typographic punctuation, arrows
UNICODES = 'U+0020-007E,U+00A0-00FF,U+0100-017F,U+2010-2027,U+2030-203A,U+2190-2199,U+2212,U+00D7'

for name in ('P052-Roman', 'P052-Italic'):
    opts = subset.Options()
    opts.flavor = 'woff2'
    opts.layout_features = ['kern', 'liga', 'onum', 'lnum', 'pnum', 'tnum']
    opts.name_IDs = ['*']
    opts.notdef_outline = True
    font = subset.load_font(os.path.join(SRC, f'{name}.woff'), opts)
    sub = subset.Subsetter(opts)
    sub.populate(unicodes=subset.parse_unicodes(UNICODES))
    sub.subset(font)
    dest = os.path.join(OUT, f'{name.lower()}-v1.woff2')
    subset.save_font(font, dest, opts)
    print(f'{dest}: {os.path.getsize(dest) // 1024} KB')

shutil.copy(os.path.join(SRC, 'LICENCE.txt'), os.path.join(OUT, 'P052-LICENCE.txt'))
