#!/usr/bin/env python3
"""Synthetic phone-camera photos of the printed DUET AR Cards, with their true poses, for the detection tests
(devtools/ar/card_test.mjs). The printed pages are the real PDF rendered at 300 dpi (make_cards.mjs writes them).

Each photo: a cut card (or the whole uncut page) lying on a table, seen by a phone camera (64° across, 1280×720 or 640×480)
from 20 to 60 cm, tilted up to 60°, turned any way, anywhere in the picture. Then what a phone does to it: blur (out of
focus or moving), sensor noise, vignetting, JPEG. And the light: normal, dim (×0.3, noisier), yellow (a tungsten bulb) or
a glare spot (a tube light reflected on the paper). Rendered at 2× and shrunk, so far cards are not aliased.
Also 'still' sequences: the same pose 30 times with only the noise and a tiny hand shake changing, to measure jitter.

Usage: python3 devtools/ar/card_photos.py <scratch dir> [n=1200]   (reads <scratch>/sheets/all-*.png, markers.json)
Writes <scratch>/photos/*.jpg and <scratch>/photos/gt.json."""
import json, math, os, sys, glob
import numpy as np, cv2

MAIN = __name__ == '__main__'   # (card_video.py imports this file for its renderer)
S = sys.argv[1] if MAIN and len(sys.argv) > 1 else os.environ.get('AR_SCRATCH', '/tmp/claude-0/agent-ar2/')
N = int(sys.argv[2]) if MAIN and len(sys.argv) > 2 else 1200
OUT = os.path.join(S, 'photos'); os.makedirs(OUT, exist_ok=True)
MK = json.load(open(os.path.join(S, 'markers.json')))
CARD = MK['card']; CW, CH = CARD['w'], CARD['h']; SH = CARD['sheet']; M = SH['margin']
DPI = 300; PPM = DPI / 25.4
rng = np.random.default_rng(11)
pages = sorted(glob.glob(os.path.join(S, 'sheets', 'all-*.png')))[1:]   # page 1 is the cover
sheets = [cv2.imread(p, cv2.IMREAD_COLOR) for p in pages]
HFOV = 64.0

def table_texture(kind, size=2048):
    """our own table tops: light wood, dark wood, grey laminate, a cloth"""
    y, x = np.mgrid[0:size, 0:size].astype(np.float32)
    if kind in ('wood', 'darkwood'):
        g = np.sin((x * 0.012 + 3 * np.sin(y * 0.004) + rng.normal(0, 0.02, (size, size)).cumsum(axis=1) * 0.02)) * 0.5 + 0.5
        base = np.array([96, 140, 182] if kind == 'wood' else [40, 62, 92], np.float32)   # BGR
        img = base[None, None, :] * (0.8 + 0.3 * g[..., None])
    elif kind == 'grey':
        img = np.full((size, size, 3), 150, np.float32) + rng.normal(0, 4, (size, size, 1))
    else:   # a blue cloth
        img = np.array([120, 70, 40], np.float32)[None, None, :] * (0.85 + 0.15 * (np.sin(x * 0.9) * np.sin(y * 0.9))[..., None])
    return np.clip(img + rng.normal(0, 3, img.shape), 0, 255).astype(np.uint8)
TABLES = {k: table_texture(k) for k in ('wood', 'darkwood', 'grey', 'cloth')}

def look_rotation(cam_dir, roll):
    """camera rotation (rows = camera x, y, z axes in card axes) for a camera on cam_dir looking at the card centre"""
    fwd = -cam_dir / np.linalg.norm(cam_dir); up = np.array([0, 0, -1.0])   # the card's top edge is "up" in the picture
    right = np.cross(fwd, up)
    if np.linalg.norm(right) < 1e-6: right = np.array([1.0, 0, 0])
    right /= np.linalg.norm(right); down = np.cross(fwd, right)
    R = np.stack([right, down, fwd])
    return cv2.Rodrigues(np.array([0, 0, roll]))[0] @ R

def align(a, b):   # rotation taking unit vector a to b
    v = np.cross(a, b); c = float(np.dot(a, b))
    if np.linalg.norm(v) < 1e-9: return np.eye(3)
    vx = np.array([[0, -v[2], v[1]], [v[2], 0, -v[0]], [-v[1], v[0], 0]])
    return np.eye(3) + vx + vx @ vx * (1 / (1 + c))

def render(card_no, W, H, dist, tilt, az, roll, at, cond, whole, table, shake=(0, 0), seed=None, src=None, centre=None):
    """src / centre: another page (e.g. the pad with a card laid on it) and the point (mm) the camera aims at"""
    r = np.random.default_rng(seed) if seed is not None else rng
    page = card_no // 4; slot = card_no % 4; col, row = slot % 2, slot // 2
    if src is None: src = sheets[page]
    cx_mm = M + col * CW + CW / 2; cy_mm = M + row * CH + CH / 2   # card centre on the page, mm
    if centre is not None: cx_mm, cy_mm = centre
    f = (max(W, H) / 2) / math.tan(math.radians(HFOV / 2)); SS = 2   # render at 2× then shrink (64° across the long side)
    K = np.array([[f * SS, 0, (W * SS) / 2 - 0.5], [0, f * SS, (H * SS) / 2 - 0.5], [0, 0, 1]])
    cam_dir = np.array([math.sin(tilt) * math.cos(az), math.cos(tilt), math.sin(tilt) * math.sin(az)])
    R = look_rotation(cam_dir, roll)
    ray = np.linalg.inv(K) @ np.array([at[0] * W * SS, at[1] * H * SS, 1.0]); ray /= np.linalg.norm(ray)
    R = align(np.array([0, 0, 1.0]), ray) @ R
    C = cam_dir * dist; t = -R @ C
    t = t + np.array([shake[0], shake[1], 0]) * dist / f   # a tiny hand shake (pixels)
    # page pixels (u, v) → card axes (X, Z) in metres → camera picture
    A = np.array([[1 / PPM / 1000, 0, -cx_mm / 1000], [0, 1 / PPM / 1000, -cy_mm / 1000], [0, 0, 1]])
    Hm = K @ np.column_stack([R[:, 0], R[:, 2], t]) @ A
    # the table: a big plane under the card (its texture is 2 mm a pixel)
    tb = TABLES[table]; At = np.array([[0.002, 0, -1.0], [0, 0.002, -1.0], [0, 0, 1]])
    Ht = K @ np.column_stack([R[:, 0], R[:, 2], t + R[:, 1] * 0.0004]) @ At
    img = cv2.warpPerspective(tb, Ht, (W * SS, H * SS), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
    if whole:   # the uncut page
        mask_src = np.full(src.shape[:2], 255, np.uint8)
    else:       # the card cut out along its lines (a little ragged)
        mask_src = np.zeros(src.shape[:2], np.uint8)
        j = r.normal(0, 0.4, 4) * PPM
        x0 = (M + col * CW) * PPM + j[0]; x1 = (M + (col + 1) * CW) * PPM + j[1]; y0 = (M + row * CH) * PPM + j[2]; y1 = (M + (row + 1) * CH) * PPM + j[3]
        cv2.rectangle(mask_src, (int(x0), int(y0)), (int(x1), int(y1)), 255, -1)
    paper = cv2.warpPerspective(src, Hm, (W * SS, H * SS), flags=cv2.INTER_AREA, borderValue=(0, 0, 0))
    mask = cv2.warpPerspective(mask_src, Hm, (W * SS, H * SS), flags=cv2.INTER_LINEAR, borderValue=0).astype(np.float32)[..., None] / 255
    img = (paper.astype(np.float32) * mask + img.astype(np.float32) * (1 - mask))
    img = cv2.resize(img, (W, H), interpolation=cv2.INTER_AREA)
    # light
    gain = {'normal': 1.0, 'dim': 0.3, 'yellow': 0.85, 'glare': 1.0}[cond] * r.uniform(0.9, 1.08)
    img *= gain
    if cond == 'yellow': img *= np.array([0.5, 0.82, 1.0], np.float32)   # BGR: a warm bulb
    if cond == 'glare':
        yy, xx = np.mgrid[0:H, 0:W].astype(np.float32); gx, gy = r.uniform(0.25, 0.75) * W, r.uniform(0.25, 0.75) * H
        sx, sy = r.uniform(0.05, 0.16) * W, r.uniform(0.04, 0.10) * H; ang = r.uniform(0, math.pi)
        dx, dy = xx - gx, yy - gy; u = dx * math.cos(ang) + dy * math.sin(ang); v = -dx * math.sin(ang) + dy * math.cos(ang)
        img += (r.uniform(120, 260) * np.exp(-(u * u / (sx * sx) + v * v / (sy * sy))))[..., None]
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32); rr = ((xx - W / 2) ** 2 + (yy - H / 2) ** 2) / ((W / 2) ** 2 + (H / 2) ** 2)
    img *= (1 - 0.3 * rr)[..., None]
    # optics and sensor
    blur = r.uniform(0.5, 1.6) * W / 1280 * 1.4
    if r.random() < 0.3:   # moving: a short streak
        L = int(r.uniform(3, 9) * W / 1280) * 2 + 1; k = np.zeros((L, L), np.float32); k[L // 2, :] = 1
        k = cv2.warpAffine(k, cv2.getRotationMatrix2D((L / 2 - 0.5, L / 2 - 0.5), r.uniform(0, 180), 1), (L, L)); k /= k.sum()
        img = cv2.filter2D(img, -1, k)
    img = cv2.GaussianBlur(img, (0, 0), max(0.3, blur))
    noise = (r.uniform(5, 9) if cond == 'dim' else r.uniform(1.5, 4))
    img += r.normal(0, noise, img.shape).astype(np.float32)
    if cond == 'dim': img = img / 0.3 * 0.55   # the phone brightens a dark picture (and its noise)
    img = np.clip(img, 0, 255).astype(np.uint8)
    q = int(r.uniform(55, 88))
    return img, q, R, t, f

def main():
    gt = []
    conds = ['normal', 'dim', 'yellow', 'glare']
    for i in range(N):
        W, H = (1280, 720) if i % 2 == 0 else (640, 480)
        card = int(rng.integers(0, 60)); dist = rng.uniform(0.2, 0.6); tilt = math.radians(rng.uniform(0, 60)); az = rng.uniform(0, 2 * math.pi)
        roll = rng.uniform(-math.pi, math.pi); cond = conds[i % 4] if i % 8 < 4 else conds[(i // 2) % 4]
        # where the card's centre is in the picture: further from the middle when the card is far (it fits)
        spread = 0.12 + 0.25 * (dist - 0.2) / 0.4
        at = (0.5 + rng.uniform(-spread, spread), 0.5 + rng.uniform(-spread, spread) * 0.8)
        whole = rng.random() < 0.25; table = ['wood', 'darkwood', 'grey', 'cloth'][int(rng.integers(0, 4))]
        img, q, R, t, f = render(card, W, H, dist, tilt, az, roll, at, cond, whole, table)
        fn = f'p{i:04d}.jpg'; cv2.imwrite(os.path.join(OUT, fn), img, [cv2.IMWRITE_JPEG_QUALITY, q])
        gt.append(dict(file=fn, card=card, id=100 + card, w=W, h=H, f=f, dist=dist, tilt=math.degrees(tilt), cond=cond, whole=whole, table=table, R=R.flatten().tolist(), t=t.tolist(), seq=None))
    # held still: 12 poses × 30 frames, only noise, JPEG and a 0.15 px shake change
    for s in range(12):
        W, H = (1280, 720) if s % 2 == 0 else (640, 480)
        card = int(rng.integers(0, 60)); dist = [0.25, 0.35, 0.45, 0.55][s % 4]; tilt = math.radians([10, 30, 45][s % 3]); az = rng.uniform(0, 2 * math.pi); roll = rng.uniform(-1, 1)
        cond = ['normal', 'dim', 'yellow', 'normal'][s % 4]; at = (0.5 + rng.uniform(-0.1, 0.1), 0.5 + rng.uniform(-0.08, 0.08))
        for k in range(30):
            img, q, R, t, f = render(card, W, H, dist, tilt, az, roll, at, cond, False, 'wood', shake=tuple(rng.normal(0, 0.15, 2)), seed=1000 + s * 100 + k)
            fn = f's{s:02d}_{k:02d}.jpg'; cv2.imwrite(os.path.join(OUT, fn), img, [cv2.IMWRITE_JPEG_QUALITY, q])
            gt.append(dict(file=fn, card=card, id=100 + card, w=W, h=H, f=f, dist=dist, tilt=math.degrees(tilt), cond=cond, whole=False, table='wood', R=R.flatten().tolist(), t=t.tolist(), seq=s))
    json.dump(gt, open(os.path.join(OUT, 'gt.json'), 'w'))
    print('photos', len(gt), 'in', OUT)

if __name__ == '__main__':
    main()
