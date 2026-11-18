#!/usr/bin/env python3
"""Fake phone-camera videos of the printed DUET Pad and DUET Cube, for the headless-Chrome tracker tests.

Each video is what a phone camera would see: the 300-dpi print lying on a wooden table (or the paper cube turning in a
hand), filmed from a moving, slightly shaky phone, with lens vignetting, blur when moving fast, sensor noise and JPEG
compression. A hand covers part of the pad for a while. Every frame carries its number as a 10-cell black/white code
in the top-left corner, so the test can match the tracker's pose to the true pose saved in <name>.json.

Usage: python3 devtools/ar/make_video.py [scratch dir] [pad|cube] [--y4m]   (needs markers.json and the *-300dpi.png from make_print.mjs)
Writes <scratch>/video/pad.mjpeg, cube.mjpeg (+ .y4m with --y4m) and pad.json, cube.json (true poses, OpenCV camera).
"""
import json, math, os, subprocess, sys
import numpy as np, cv2

S = next((a for a in sys.argv[1:] if not a.startswith('--') and a not in ('pad', 'cube')), '/tmp/claude-0/agent-ar/')
OUT = os.path.join(S, 'video'); os.makedirs(OUT, exist_ok=True)
W, H, FPS = 1280, 720, 30
HFOV = 64.0                                   # the tracker's default guess for a phone's main camera
FX = (W / 2) / math.tan(math.radians(HFOV / 2)); FY = FX; CX, CY = W / 2, H / 2
K = np.array([[FX, 0, CX], [0, FY, CY], [0, 0, 1]])
MK = json.load(open(os.path.join(S, 'markers.json')))
rng = np.random.default_rng(7)


def look_at(eye, target, up=(0, 1, 0)):
    f = np.asarray(target, float) - eye; f /= np.linalg.norm(f)
    r = np.cross(f, up); r /= np.linalg.norm(r)
    d = np.cross(f, r)
    R = np.stack([r, d, f]); return R, -R @ eye


def rot(axis, a):
    return cv2.Rodrigues(np.asarray(axis, float) * a)[0]


def wood(w_mm=1400, h_mm=1000, ppm=1.2):
    """our own procedural wooden table top, in plane coordinates (mm)"""
    w, h = int(w_mm * ppm), int(h_mm * ppm)
    y, x = np.mgrid[0:h, 0:w].astype(np.float32)
    n = cv2.resize(rng.random((h // 40 + 2, w // 8 + 2)).astype(np.float32), (w, h), interpolation=cv2.INTER_CUBIC)
    grain = np.sin((y * 0.11 + n * 9.0 + np.sin(x * 0.004) * 6.0)) * 0.5 + 0.5
    fine = cv2.GaussianBlur(rng.random((h, w)).astype(np.float32), (0, 0), 0.8)
    v = 0.78 + 0.13 * grain + 0.06 * fine
    base = np.array([60, 98, 140], np.float32) / 255.0      # BGR warm oak
    img = np.clip(v[..., None] * base[None, None, :] * 1.25, 0, 1)
    return (img * 255).astype(np.uint8), ppm, w_mm, h_mm


def plane_h(R, t, origin, ax_u, ax_v):
    """homography from plane coords (u, v) in metres to the image, for points origin + u*ax_u + v*ax_v"""
    M = np.stack([R @ ax_u, R @ ax_v, R @ origin + t], axis=1)
    return K @ M


def warp(img, Hm, mask_shape=None):
    return cv2.warpPerspective(img, Hm, (W, H), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=0)


def frame_code(img, n):
    # a white strip with 10 cells: the frame number in binary, most significant first (black = 1)
    cv2.rectangle(img, (8, 8), (16 + 10 * 24 + 8, 16 + 24 + 8), (255, 255, 255), -1)
    for i in range(10):
        if (n >> (9 - i)) & 1:
            cv2.rectangle(img, (16 + i * 24, 16), (16 + i * 24 + 23, 16 + 23), (0, 0, 0), -1)


def camera_finish(acc, speed):
    img = acc.astype(np.float32)
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    vig = 1.0 - 0.28 * (((xx - CX) / CX) ** 2 + ((yy - CY) / CY) ** 2) ** 1.2
    light = 0.92 + 0.12 * (1 - xx / W)                    # window light from the left
    img *= (vig * light)[..., None]
    img = cv2.GaussianBlur(img, (0, 0), 0.7 + min(speed, 1.5) * 0.5)
    img += rng.normal(0, 2.6, img.shape).astype(np.float32)
    return np.clip(img, 0, 255).astype(np.uint8)


def hand(img, cx, cy, ang, s):
    """a simple skin-coloured hand shape (palm + fingers) that hides part of the picture"""
    m = np.zeros((H, W), np.uint8)
    pts = cv2.ellipse2Poly((int(cx), int(cy)), (int(70 * s), int(95 * s)), int(ang), 0, 360, 10)
    cv2.fillPoly(m, [pts], 255)
    for k in range(4):
        a = math.radians(ang - 90 + (k - 1.5) * 14)
        x2, y2 = cx + math.cos(a) * 170 * s, cy + math.sin(a) * 170 * s
        cv2.line(m, (int(cx), int(cy)), (int(x2), int(y2)), 255, int(34 * s))
    a = cv2.GaussianBlur(m.astype(np.float32) / 255, (0, 0), 1.5)[..., None]
    shadow = cv2.GaussianBlur(np.roll(m, (14, 10), axis=(0, 1)).astype(np.float32) / 255, (0, 0), 14)[..., None]
    yy = np.linspace(0, 1, H, dtype=np.float32)[:, None, None]
    skin = np.array([112, 146, 196], np.float32) * (0.9 + 0.15 * yy)
    out = img.astype(np.float32) * (1 - 0.35 * shadow)
    return np.clip(out * (1 - a) + skin * a, 0, 255).astype(np.uint8)


def write(name, frames, poses):
    raw = os.path.join(OUT, name + '_frames'); os.makedirs(raw, exist_ok=True)
    for i, f in enumerate(frames): cv2.imwrite(os.path.join(raw, '%04d.jpg' % i), f, [cv2.IMWRITE_JPEG_QUALITY, 92])
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-framerate', str(FPS), '-i', os.path.join(raw, '%04d.jpg'), '-c:v', 'mjpeg', '-q:v', '3', '-f', 'mjpeg', os.path.join(OUT, name + '.mjpeg')], check=True)
    if '--y4m' in sys.argv:
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-framerate', str(FPS), '-i', os.path.join(raw, '%04d.jpg'), '-pix_fmt', 'yuv420p', os.path.join(OUT, name + '.y4m')], check=True)
    json.dump({'w': W, 'h': H, 'fps': FPS, 'hfov': HFOV, 'fx': FX, 'frames': poses}, open(os.path.join(OUT, name + '.json'), 'w'))
    print(name, len(frames), 'frames ->', os.path.join(OUT, name + '.mjpeg'))


# ----------------------------------------------------------------------------------------------- pad video
def pad_video():
    tex = cv2.imread(os.path.join(S, 'duet-pad-a4-300dpi.png'))
    th, tw = tex.shape[:2]; pw, ph = 0.297, 0.210
    tbl, ppm, tw_mm, th_mm = wood()
    # plane coords: pad frame x right, z towards you, y up; image u → +x, v → +z
    ex, ez = np.array([1.0, 0, 0]), np.array([0, 0, 1.0])
    A_pad = np.array([[pw / tw, 0, -pw / 2], [0, ph / th, -ph / 2], [0, 0, 1]])           # texture px → plane m
    A_tbl = np.array([[0.001 / ppm, 0, -tw_mm / 2000], [0, 0.001 / ppm, -th_mm / 2000 + 0.05], [0, 0, 1]])
    n = 7 * FPS; frames, poses = [], []
    keys = [  # time s, azimuth deg, elevation deg, distance m
        (0.0, 0, 56, 0.42), (1.0, 0, 56, 0.42), (2.4, 25, 46, 0.38), (3.5, 40, 40, 0.37), (4.3, 0, 60, 0.45),
        (5.0, -35, 64, 0.48), (6.0, -20, 58, 0.44), (7.0, 0, 56, 0.42)]
    def at(t):
        for (t0, *a), (t1, *b) in zip(keys, keys[1:]):
            if t0 <= t <= t1:
                u = (t - t0) / (t1 - t0); u = u * u * (3 - 2 * u)
                return [p + (q - p) * u for p, q in zip(a, b)]
        return keys[-1][1:]
    def cam(t):
        az, el, d = at(t)
        az, el = math.radians(az), math.radians(el)
        eye = np.array([d * math.cos(el) * math.sin(az), d * math.sin(el), d * math.cos(el) * math.cos(az)])
        shake = np.array([math.sin(t * 9.1), math.sin(t * 7.3 + 1), math.sin(t * 5.7 + 2)]) * 0.0006
        target = np.array([0.012 * math.sin(t * 0.9), 0, 0.01 * math.sin(t * 1.3)])
        return look_at(eye + shake, target)
    prevC = None
    for i in range(n):
        t = i / FPS
        R, tv = cam(t); C = -R.T @ tv
        speed = 0 if prevC is None else np.linalg.norm(C - prevC) * FPS / 0.25; prevC = C
        acc = np.zeros((H, W, 3), np.float32); subs = 3 if speed > 0.4 else 1
        for k in range(subs):
            Rk, tk = cam(t + (k - (subs - 1) / 2) / FPS / 2.5)
            Hp = plane_h(Rk, tk, np.zeros(3), ex, ez)
            img = warp(tbl, Hp @ A_tbl)
            pad = warp(tex, Hp @ A_pad); m = warp(np.full((th, tw), 255, np.uint8), Hp @ A_pad)
            # the paper's soft contact shadow on the table, then the paper
            sh = cv2.GaussianBlur(m.astype(np.float32), (0, 0), 6)[..., None] / 255.0
            img = (img * (1 - 0.22 * sh)).astype(np.uint8)
            img = np.where(m[..., None] > 127, (pad.astype(np.float32) * 0.97).astype(np.uint8), img)
            acc += img
        frame = camera_finish(acc / subs, speed)
        if 5.0 <= t <= 6.0:   # a hand reaches over the bottom-left of the pad
            k = min(1.0, (t - 5.0) / 0.25, (6.0 - t) / 0.25)
            P = K @ (R @ np.array([-0.118, 0.0, 0.075]) + tv); px, py = P[:2] / P[2]   # over the bottom-left marker
            frame = hand(frame, px - 40, py + 150 + 300 * (1 - k), -15, 1.3)
        frame_code(frame, i)
        frames.append(frame); poses.append({'i': i, 't': t, 'R': R.flatten().tolist(), 't3': tv.tolist(), 'hand': bool(5.0 <= t <= 6.0)})
    write('pad', frames, poses)


# ----------------------------------------------------------------------------------------------- cube video
def cube_video():
    sheet = cv2.imread(os.path.join(S, 'duet-cube-300dpi.png'))
    E = MK['cube']['edge']; x0 = (210 - 3 * E) / 2; y0 = 36; dpmm = sheet.shape[1] / 210.0
    e = E / 1000.0
    faces = []
    for fc in MK['cube']['faces']:
        c, r = fc['net']; xa, ya = int(round((x0 + c * E) * dpmm)), int(round((y0 + r * E) * dpmm)); s = int(round(E * dpmm))
        img = sheet[ya:ya + s, xa:xa + s].copy()
        cv2.rectangle(img, (0, 0), (s - 1, s - 1), (200, 200, 200), 3)   # the cut edge of the card
        n = np.array(fc['n'], float); up = np.array(fc['up'], float); right = np.cross(up, n)
        faces.append((img, n, up, right))
    tbl, ppm, tw_mm, th_mm = wood()
    n_frames = 7 * FPS; frames, poses = [], []
    Rcam, tcam = look_at(np.array([0, 0.30, 0.12]), np.array([0, 0.12, -0.12]))    # the phone, held still-ish
    def cube_pose(t):
        # the cube in the hand: held still for 1 s, then turned round and tipped forward and back
        if t < 1.0: yaw, pitch, roll = 0.55, 0.42, 0.05
        else:
            u = t - 1.0
            yaw = 0.55 + u * (2 * math.pi / 6.0); pitch = 0.42 + 0.45 * math.sin(u * 1.7); roll = 0.05 + 0.2 * math.sin(u * 1.1)
        Rw = rot([0, 1, 0], yaw) @ rot([1, 0, 0], pitch) @ rot([0, 0, 1], roll)
        pos = np.array([0.02 * math.sin(t * 1.4), 0.12 + 0.01 * math.sin(t * 2.1), -0.12 + 0.015 * math.sin(t * 0.8)])
        return Rw, pos
    A_tbl = np.array([[0.001 / ppm, 0, -tw_mm / 2000], [0, 0.001 / ppm, -th_mm / 2000 - 0.3], [0, 0, 1]])
    light = np.array([-0.4, 0.8, 0.45]); light /= np.linalg.norm(light)
    prev = None
    for i in range(n_frames):
        t = i / FPS
        shake = rot([1, 0, 0], 0.004 * math.sin(t * 8.3)) @ rot([0, 1, 0], 0.004 * math.sin(t * 6.1))
        Rc = shake @ Rcam; tc = shake @ tcam
        Rw, pos = cube_pose(t)
        R = Rc @ Rw; tv = Rc @ pos + tc                     # cube frame → camera
        speed = 0 if prev is None else np.linalg.norm(cv2.Rodrigues(R @ prev.T)[0]) * FPS / 3.0; prev = R
        img = warp(tbl, plane_h(Rc, tc, np.zeros(3), np.array([1.0, 0, 0]), np.array([0, 0, 1.0])) @ A_tbl)
        yy = np.linspace(0, 1, H, dtype=np.float32)[:, None, None]
        wall = np.array([200, 205, 212], np.float32) * (0.85 + 0.15 * yy)
        img = np.where(img.sum(axis=2, keepdims=True) == 0, wall.astype(np.uint8), img)
        # faces facing the camera, far ones first
        vis = []
        for (ftex, nrm, up, right) in faces:
            cc = R @ (nrm * e / 2) + tv; nc = R @ nrm
            if nc @ cc < 0: vis.append((np.linalg.norm(cc), ftex, nrm, up, right, nc))
        for _, ftex, nrm, up, right, nc in sorted(vis, key=lambda v: -v[0]):
            s = ftex.shape[0]
            A = np.array([[e / s, 0, -e / 2], [0, -e / s, e / 2], [0, 0, 1]])  # texture px → (right, up) metres
            Hf = plane_h(R, tv, nrm * e / 2, right, up) @ A
            shade = 0.62 + 0.38 * max(0.0, float((Rw @ nrm) @ light))
            fimg = warp((ftex.astype(np.float32) * shade).astype(np.uint8), Hf)
            m = warp(np.full((s, s), 255, np.uint8), Hf)
            img = np.where(m[..., None] > 127, fimg, img)
        frame = camera_finish(img, speed)
        # the hand holding the cube from below
        P = K @ (R @ np.array([0, -e * 0.62, 0]) + tv); px, py = P[:2] / P[2]
        frame = hand(frame, px + 30, py + 150, 260, 1.15)
        frame_code(frame, i)
        frames.append(frame); poses.append({'i': i, 't': t, 'R': R.flatten().tolist(), 't3': tv.tolist(), 'hand': True})
    write('cube', frames, poses)


if __name__ == '__main__':
    which = [a for a in sys.argv[1:] if a in ('pad', 'cube')] or ['pad', 'cube']
    if 'pad' in which: pad_video()
    if 'cube' in which: cube_video()
