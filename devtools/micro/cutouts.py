# Cut-outs from the eyepiece photographs, for what one photo cannot show by itself (science/micro/*.webp):
# - scattered low-power views (cheek cells, yeast): the real cells cut out of high-power photos and spread over a
#   background, the way a smear looks at 4× and 10×;
# - swimmers (Paramecium) and the Amoeba for the dividing time-lapse: one organism cut out of a photo.
# Bright-field light passes through the specimen, so every cut-out is kept as its transmission (the photo divided by
# its own empty background): laid over any background it multiplies, as the real thing does, and where two cells
# overlap both darken the light. The sprites are saved the same way (white = clear), for 'multiply' in the page.
# usage: python3 cutouts.py <dir of originals> <out dir>
import sys, os, json, random
import numpy as np, cv2
from PIL import Image
from scipy import ndimage as ndi
SRC, OUT = sys.argv[1], sys.argv[2]; os.makedirs(OUT, exist_ok=True)
N = 1024

def load(name):
    for ext in ('.jpg', '.png'):
        p = f'{SRC}/{name}{ext}'
        if os.path.exists(p): return np.asarray(Image.open(p).convert('RGB')).astype(np.float32)
    raise FileNotFoundError(name)

def texture(g, s=3):
    m = cv2.GaussianBlur(g, (0, 0), s); return np.sqrt(np.maximum(cv2.GaussianBlur(g * g, (0, 0), s) - m * m, 0))

def smooth_bg(img, mask, s):
    """the background under the objects, filled in from the background around them (normalised convolution)"""
    wgt = (1 - mask).astype(np.float32)
    num = cv2.GaussianBlur(img * wgt[..., None], (0, 0), s); den = cv2.GaussianBlur(wgt, (0, 0), s)[..., None]
    return num / np.maximum(den, 1e-3)

def objects(img, thresh=14, min_area=200, max_frac=0.35, close=5, sigma=None, tex=4.0, split=0):
    """Things that stand out from the smooth background: [(T, alpha, area)] where T = transmission (float, 1 = clear),
    and the background itself"""
    h, w = img.shape[:2]; s = sigma or max(h, w) / 10
    tx = texture(img.mean(2))
    m = (tx > tex).astype(np.uint8)  # edges and grain first: these are never the plain background
    m = ndi.binary_fill_holes(cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((25, 25), np.uint8))).astype(np.uint8)
    for _ in range(3):  # the background with the objects taken out, then the objects again against it
        bg = smooth_bg(img, cv2.dilate(m, np.ones((15, 15), np.uint8)), s)
        diff = np.abs(img - bg).mean(2)
        m = ((cv2.GaussianBlur(diff, (0, 0), 2) > thresh) | (tx > tex)).astype(np.uint8)
    k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (close, close))
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, k, iterations=2); m = ndi.binary_fill_holes(m).astype(np.uint8); m = cv2.morphologyEx(m, cv2.MORPH_OPEN, k)
    if split:  # cells lying against each other: cut along the watershed of the distance to the background
        from skimage.segmentation import watershed
        from skimage.feature import peak_local_max
        d = ndi.distance_transform_edt(m); d = cv2.GaussianBlur(d.astype(np.float32), (0, 0), 3)
        pk = peak_local_max(d, min_distance=int(split), labels=ndi.label(m)[0], exclude_border=False)
        mk = np.zeros(m.shape, np.int32); mk[tuple(pk.T)] = np.arange(1, len(pk) + 1)
        lab = watershed(-d, mk, mask=m.astype(bool))
    else:
        lab, _ = ndi.label(m)
    T = np.clip(img / np.maximum(bg, 1), 0, 1.15)
    out = []
    for i, sl in enumerate(ndi.find_objects(lab)):
        if sl is None: continue
        ys, xs = sl; area = int((lab[sl] == i + 1).sum())
        if area < min_area or area > max_frac * h * w: continue
        if ys.start <= 1 or xs.start <= 1 or ys.stop >= h - 1 or xs.stop >= w - 1: continue  # cut by the edge of the photo
        pad = 8; y0, y1, x0, x1 = max(0, ys.start - pad), min(h, ys.stop + pad), max(0, xs.start - pad), min(w, xs.stop + pad)
        a = (lab[y0:y1, x0:x1] == i + 1).astype(np.float32); a = cv2.dilate(a, np.ones((3, 3), np.uint8)); a = cv2.GaussianBlur(a, (0, 0), 1.6)
        out.append((T[y0:y1, x0:x1].copy(), a, area))
    objects.mask = m
    return out, bg

def background(img, bg):
    """the photo's own background, smooth, with a little of its fine grain"""
    grain = img - cv2.GaussianBlur(img, (0, 0), 3)
    return bg + np.clip(grain, -6, 6) * 0.6

def place(canvas, T, a, x, y, f, ang):
    """multiply one cut-out into the canvas at (x, y), scaled by f and turned by ang degrees"""
    h, w = a.shape; c = np.cos(np.radians(ang)) * f; s = np.sin(np.radians(ang)) * f
    W = int(abs(c) * w + abs(s) * h) + 4; H = int(abs(s) * w + abs(c) * h) + 4
    M = np.array([[c, s, W / 2 - c * w / 2 - s * h / 2], [-s, c, H / 2 + s * w / 2 - c * h / 2]], np.float32)
    Tw = cv2.warpAffine(T, M, (W, H), flags=cv2.INTER_AREA if f < 1 else cv2.INTER_CUBIC, borderValue=(1, 1, 1))
    aw = cv2.warpAffine(a, M, (W, H), flags=cv2.INTER_LINEAR)[..., None]
    X0, Y0 = int(x - W / 2), int(y - H / 2); N_ = canvas.shape[0]
    cx0, cy0, cx1, cy1 = max(0, X0), max(0, Y0), min(N_, X0 + W), min(N_, Y0 + H)
    if cx0 >= cx1 or cy0 >= cy1: return
    sub = (slice(cy0 - Y0, cy1 - Y0), slice(cx0 - X0, cx1 - X0))
    canvas[cy0:cy1, cx0:cx1] *= 1 - aw[sub] + aw[sub] * Tw[sub]

def scatter(name, srcs, cal, um, n, clump=0.3, seed=3, **kw):
    """cal: µm per pixel of the source photos; um: width of the plate"""
    objs = []
    for j, src in enumerate(srcs):
        img_ = load(src); o_, bg_ = objects(img_, **kw); objs += o_
        if j == 0: img, bg = img_, bg_
    if not objs: print('no objects in', srcs); return
    k = cal / (um / N)  # source pixels -> plate pixels
    base = cv2.resize(background(img, bg), (N, N), interpolation=cv2.INTER_AREA)
    canvas = cv2.GaussianBlur(base, (0, 0), 1.0).astype(np.float32)
    rnd = random.Random(seed); centres = []
    for j in range(n):
        T, a, _ = objs[rnd.randrange(len(objs))]
        f = k * rnd.uniform(0.85, 1.15); r = max(a.shape) * f
        if rnd.random() < 0.5: T, a = T[:, ::-1], a[:, ::-1]  # either face up
        if centres and rnd.random() < clump: cx, cy = rnd.choice(centres); x = cx + rnd.gauss(0, r * 0.6); y = cy + rnd.gauss(0, r * 0.6)
        elif n < 6: x, y = rnd.uniform(r * 0.35, N - r * 0.35), rnd.uniform(r * 0.25, N - r * 0.25)  # a few big ones: inside the view
        else: x, y = rnd.uniform(-r / 3, N + r / 3), rnd.uniform(-r / 3, N + r / 3)
        centres.append((x, y)); place(canvas, np.ascontiguousarray(T), np.ascontiguousarray(a), x, y, f, rnd.uniform(0, 360))
    Image.fromarray(np.clip(canvas, 0, 255).astype(np.uint8)).save(f'{OUT}/{name}.webp', 'WEBP', quality=80, method=6)
    print(name, len(objs), 'objects', os.path.getsize(f'{OUT}/{name}.webp'))

def sprite(name, src, pick=0, maxw=560, **kw):
    """one organism, turned so that it lies along the x axis: rgb = its transmission (white = clear), alpha = its outline"""
    img = load(src); objs, _ = objects(img, **kw); objs.sort(key=lambda t: -t[2])
    if pick >= len(objs): print('only', len(objs), 'objects in', src); return None
    T, a, _ = objs[pick]
    ys, xs = np.nonzero(a > 0.5); ev, evec = np.linalg.eigh(np.cov(np.vstack([xs - xs.mean(), ys - ys.mean()]))); v = evec[:, 1]
    ang = np.degrees(np.arctan2(v[1], v[0]))
    rgba = np.dstack([np.clip(T, 0, 1) * 255, a * 255]).astype(np.uint8)
    im = Image.fromarray(rgba, 'RGBA'); im = im.rotate(ang, resample=Image.BICUBIC, expand=True, fillcolor=(255, 255, 255, 0)); im = im.crop(im.getchannel('A').getbbox())
    if im.width > maxw: im = im.resize((maxw, int(im.height * maxw / im.width)), Image.LANCZOS)
    im.save(f'{OUT}/{name}.webp', 'WEBP', quality=88, method=6); print(name, im.size, os.path.getsize(f'{OUT}/{name}.webp'))
    return list(im.size)

def pond():
    """pond water at low power: the specks and bits of plant from the Paramecium photo spread over its own water"""
    db = dict(thresh=28, min_area=40, tex=20, close=5, max_frac=0.002)
    scatter('pond_10', ['para_d'], 0.45, 1120, 260, clump=0.35, seed=7, **db)
    scatter('pond_4', ['para_d'], 0.45, 2800, 700, clump=0.4, seed=8, **db)
    # an Amoeba or two among the specks, for the 10× view of the Amoeba slide
    scatter('amoeba_10', ['amoeba_c', 'amoeba_b'], 0.45, 1120, 3, clump=0, seed=5, thresh=8, min_area=2000, close=9, tex=3)

if __name__ == '__main__' and len(sys.argv) > 3:  # only some steps: cutouts.py src out pond
    for step in sys.argv[3].split(','): globals()[step]()
    sys.exit(0)

if __name__ == '__main__':
    info = {}
    ck = dict(thresh=12, min_area=3000, tex=5, split=60)
    scatter('cheek_10', ['cheek_a', 'cheek_b'], 0.25, 1120, 70, clump=0.45, **ck)
    scatter('cheek_4', ['cheek_a', 'cheek_b'], 0.25, 2800, 260, clump=0.5, **ck)
    ye = dict(thresh=8, min_area=150, close=3, tex=4)
    scatter('yeast_40', ['yeast_f'], 0.11, 290, 340, clump=0.55, **ye)
    scatter('yeast_10', ['yeast_f'], 0.11, 1120, 2600, clump=0.6, **ye)
    pa = dict(thresh=28, min_area=8000, tex=20, close=11)
    for i in range(5): info['para_s%d' % i] = sprite('para_s%d' % i, 'para_d', i, **pa)
    am = dict(thresh=8, min_area=2000, close=9, tex=3)
    info['amoeba_s'] = sprite('amoeba_s', 'amoeba_c', 0, **am)
    info['amoeba_s2'] = sprite('amoeba_s2', 'amoeba_b', 0, **am)
    print(json.dumps(info))
