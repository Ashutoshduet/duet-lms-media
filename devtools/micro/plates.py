# The eyepiece photographs of Science Lab 360's microscope (science/micro/*.webp) from the original photomicrographs.
# usage: python3 plates.py <dir of originals> <out dir>
# Each plate is a square, 1024 px, covering `um` micrometres. `cal` is the original's micrometres per pixel, judged
# from the size of known structures in it (onion epidermal cell ~80 µm wide, red blood cell ~7.5-9 µm, pith cell ~80 µm,
# skeletal muscle fibre ~60 µm); `c` the centre of the crop as fractions of the original.
# Low-power views wider than any photograph ("quilt") are pieced together from random patches of a higher-power
# photograph, with soft seams, the way a real slide repeats the same tissue.
import sys, os, json, random
from PIL import Image, ImageFilter
import numpy as np
SRC, OUT = sys.argv[1], sys.argv[2]; os.makedirs(OUT, exist_ok=True)
N = 1024
P = [
    # name, source, cal (µm/px of original), um (plate width), centre
    ('onion_10', 'onion_a', 0.609, 1120, (0.5, 0.5)),
    ('onion_40', 'onion_b', 0.160, 294, (0.5, 0.5)),
    ('pith_10', 'pith_a', 0.609, 1120, (0.56, 0.5)),
    ('pith_40', 'pith_b', 0.34, 300, (0.7, 0.55)),
    ('muscle_40', 'muscle_a', 0.22, 300, (0.5, 0.5)),
    ('muscle_100', 'muscle_c', 0.115, 120, (0.62, 0.5)),
    ('neuron_10', 'neuron_a', 0.609, 1120, (0.5, 0.5)),
    ('blood_40', 'blood_a', 0.22, 300, (0.5, 0.5)),
    ('blood_100', 'blood_b', 0.0625, 115, (0.5, 0.5)),
]
P += [
    ('cheek_40', 'cheek_a', 0.25, 290, (0.5, 0.55)),
    ('yeast_100', 'yeast_f', 0.11, 105, (0.5, 0.5)),
    ('curd_100', 'curd_b', 0.155, 115, (0.469, 0.29)),
    ('stoma_10', 'stoma_c', 1.313, 1120, (0.667, 0.5)),
    ('stoma_40', 'stoma_i', 0.3816, 290, (0.45, 0.38)),
    ('spiro_10', 'spiro_d', 1.3176, 1120, (0.5, 0.5)),
    ('spiro_40', 'spiro_c', 0.4286, 300, (0.62, 0.32)),
    ('potato_io_40', 'potato_a', 0.29, 290, (0.4, 0.58)),
    ('potato_40', 'potato_b', 0.414, 290, (0.5, 0.5)),
    ('mould_10', 'rhiz_c', 1.094, 1120, (0.6, 0.5)),
    ('mould_4', 'rhiz_e', 2.1875, 2800, (0.5, 0.4)),
    ('hydra_4', 'hydra_c', 1.823, 2800, (0.5, 0.42)),
    ('hydra_10', 'hydra_c', 1.6, 1120, (0.55, 0.5)),
    ('xylem_40', 'xylem_a', 0.23, 300, (0.47, 0.5)),
    ('xylem_10', 'xylem_d', 0.609, 1120, (0.6, 0.5)),
]
# low-power views pieced together from a higher-power photograph; box: the part of the original to take patches from
QUILT = [('onion_4', 'onion_a', 0.609, 2800, None), ('cheek_10', 'cheek_a', 0.25, 1120, None), ('cheek_4', 'cheek_a', 0.25, 2800, None),
         ('yeast_40', 'yeast_f', 0.11, 290, None), ('yeast_10', 'yeast_f', 0.11, 1120, None),
         ('curd_40', 'curd_b', 0.155, 290, (0.469, 0.29, 740)), ('pond_4', 'amoeba_bcc', 0.55, 2800, (0.78, 0.17, 360)), ('pond_10', 'amoeba_bcc', 0.55, 1120, (0.78, 0.17, 360))]
def crop(im, cal, um, c):
    w, h = im.size; px = um / cal
    px = min(px, h, w)
    cx, cy = c[0] * w, c[1] * h; x0 = min(max(0, cx - px / 2), w - px); y0 = min(max(0, cy - px / 2), h - px)
    return im.crop((int(x0), int(y0), int(x0 + px), int(y0 + px))).resize((N, N), Image.LANCZOS)
def save(im, name):
    im.save(f'{OUT}/{name}.webp', 'WEBP', quality=80, method=6); print(name, os.path.getsize(f'{OUT}/{name}.webp'))
for name, src, cal, um, c in P:
    save(crop(Image.open(f'{SRC}/{src}.jpg').convert('RGB'), cal, um, c), name)
for name, src, cal, um, box in QUILT:
    im = Image.open(f'{SRC}/{src}.jpg').convert('RGB'); w, h = im.size
    if box: cx, cy, side = box; cx *= w; cy *= h; im = im.crop((int(cx - side / 2), int(cy - side / 2), int(cx + side / 2), int(cy + side / 2))); w, h = im.size
    k = (cal / (um / N)); sm = np.asarray(im.resize((max(8, int(w * k)), max(8, int(h * k))), Image.LANCZOS)).astype(np.float32)
    if min(sm.shape[:2]) < 240:  # a small source: tile it up before taking patches (mirrored, so the joins match)
        while min(sm.shape[:2]) < 240: sm = np.concatenate([np.concatenate([sm, sm[:, ::-1]], 1), np.concatenate([sm[::-1], sm[::-1, ::-1]], 1)], 0)
    rnd = random.Random(7); T = min(220, min(sm.shape[:2]) - 1); F = max(24, T // 4); acc = np.zeros((N + T, N + T, 3), np.float32); wt = np.zeros((N + T, N + T, 1), np.float32)
    ramp = np.minimum(1, np.minimum(np.arange(T) + 1, T - np.arange(T)) / F); win = (ramp[:, None] * ramp[None, :])[..., None]
    for y in range(-T // 2, N, T - F):
        for x in range(-T // 2, N, T - F):
            sx = rnd.randrange(0, sm.shape[1] - T); sy = rnd.randrange(0, sm.shape[0] - T); p = sm[sy:sy + T, sx:sx + T]
            if rnd.random() < 0.5: p = p[::-1, ::-1]
            yy, xx = y + T // 2, x + T // 2; acc[yy:yy + T, xx:xx + T] += p * win; wt[yy:yy + T, xx:xx + T] += win
    out = (acc / np.maximum(wt, 1e-6))[T // 2:T // 2 + N, T // 2:T // 2 + N]
    save(Image.fromarray(np.clip(out, 0, 255).astype(np.uint8)), name)
