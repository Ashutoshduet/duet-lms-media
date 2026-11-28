#!/usr/bin/env python3
"""DUET Little Learners: outlines of the letters (A-Z, a-z, Hindi vowels and consonants, 0-9) for the big 3D letters.
Reads the Noto Sans Devanagari fonts the apps already carry (SIL Open Font Licence) and writes early/data/glyphs.json:
{ char: { d: SVG path (font units, y up), w: advance, b: [xmin, ymin, xmax, ymax] } }.
The conjuncts क्ष, त्र and ज्ञ are single glyphs in the font, reached through its ligature tables (a tiny shaper below).
usage: python3 devtools/early/glyphs.py"""
import json, os
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.boundsPen import BoundsPen
HERE = os.path.dirname(os.path.abspath(__file__)); REPO = os.path.abspath(os.path.join(HERE, '..', '..'))
FONTS = os.path.join(REPO, 'early', 'fonts')
LAT = TTFont(os.path.join(FONTS, 'nsd-latin-700.woff2')); DEV = TTFont(os.path.join(FONTS, 'nsd-deva-700.woff2'))
HINDI = 'अ आ इ ई उ ऊ ऋ ए ऐ ओ औ अं अः क ख ग घ ङ च छ ज झ ञ ट ठ ड ढ ण त थ द ध न प फ ब भ म य र ल व श ष स ह क्ष त्र ज्ञ'.split()
LATIN = [chr(c) for c in range(65, 91)] + [chr(c) for c in range(97, 123)] + [str(i) for i in range(10)]

def lookups(font, tags):
    g = font['GSUB'].table; out = []
    for tag in tags:
        for fr in g.FeatureList.FeatureRecord:
            if fr.FeatureTag == tag:
                for li in fr.Feature.LookupListIndex:
                    if li not in out: out.append(li)
    return [g.LookupList.Lookup[i] for i in out]

def subtables(lk):
    for st in lk.SubTable:
        if lk.LookupType == 7: yield st.ExtSubTable.LookupType, st.ExtSubTable
        else: yield lk.LookupType, st

def shape(font, text):
    """glyph names for text: cmap, then single and ligature substitutions of the Indic features, in order"""
    cm = font.getBestCmap(); gl = [cm[ord(c)] for c in text]
    for lk in lookups(font, ['nukt', 'akhn', 'rphf', 'rkrf', 'blwf', 'half', 'cjct', 'pres', 'abvs', 'blws', 'psts']):
        for typ, st in subtables(lk):
            i = 0
            while i < len(gl):
                done = False
                if typ == 4 and gl[i] in st.ligatures:
                    for lig in st.ligatures[gl[i]]:
                        comp = lig.Component; n = len(comp)
                        if gl[i + 1:i + 1 + n] == list(comp): gl[i:i + 1 + n] = [lig.LigGlyph]; done = True; break
                elif typ == 1 and gl[i] in st.mapping and len(gl) > 1: pass  # single forms (half forms etc.) are not wanted alone
                i += 1
    return gl

def outline(font, names):
    gs = font.getGlyphSet(); hm = font['hmtx']; x = 0; parts = []; xmin = ymin = 1e9; xmax = ymax = -1e9
    for n in names:
        pen = SVGPathPen(gs)
        from fontTools.pens.transformPen import TransformPen
        gs[n].draw(TransformPen(pen, (1, 0, 0, 1, x, 0))); parts.append(pen.getCommands())
        bp = BoundsPen(gs); gs[n].draw(bp)
        if bp.bounds: a, b, c, d = bp.bounds; xmin = min(xmin, a + x); ymin = min(ymin, b); xmax = max(xmax, c + x); ymax = max(ymax, d)
        x += hm[n][0]
    return {'d': ' '.join(parts), 'w': x, 'b': [round(xmin), round(ymin), round(xmax), round(ymax)]}

out = {}
for c in LATIN: out[c] = outline(LAT, [LAT.getBestCmap()[ord(c)]])
for h in HINDI:
    names = shape(DEV, h); out[h] = outline(DEV, names); out[h]['g'] = names
    if len(names) > 1 and len(h) > 1 and '्' in h: print('NOT JOINED', h, names)
for i in range(10): out['०१२३४५६७८९'[i]] = outline(DEV, [DEV.getBestCmap()[ord('०१२३४५६७८९'[i])]])
os.makedirs(os.path.join(REPO, 'early', 'data'), exist_ok=True)
json.dump(out, open(os.path.join(REPO, 'early', 'data', 'glyphs.json'), 'w'), ensure_ascii=False, separators=(',', ':'))
print(len(out), 'glyphs;', 'conjuncts:', {h: out[h]['g'] for h in ('क्ष', 'त्र', 'ज्ञ', 'अं', 'अः')})
