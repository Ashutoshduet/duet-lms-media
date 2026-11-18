#!/usr/bin/env python3
"""Fake camera videos of a printed DUET AR card for the in-browser tests and screenshots (Chrome plays them as the camera
with --use-file-for-fake-video-capture). The phone sways gently round the card (or the card lies on the DUET Pad's stage).
Usage: python3 devtools/ar/card_video.py <out.mjpeg> <card number> [frames=60] [--pad] [--light normal|dim|yellow|glare]
       [--dist 0.35] [--tilt 35] [--w 1280 --h 720]"""
import argparse, math, os, subprocess, tempfile, sys
import numpy as np, cv2
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import card_photos as CP
a = argparse.ArgumentParser(); a.add_argument('out'); a.add_argument('card', type=int); a.add_argument('frames', type=int, nargs='?', default=60)
a.add_argument('--pad', action='store_true'); a.add_argument('--light', default='normal'); a.add_argument('--dist', type=float, default=0.36); a.add_argument('--tilt', type=float, default=38)
a.add_argument('--w', type=int, default=1280); a.add_argument('--h', type=int, default=720); a.add_argument('--table', default='wood')
o = a.parse_args()
src = centre = None
if o.pad:
    # the DUET Pad (300 dpi, A4 landscape) with the card laid on its stage
    pad = cv2.imread(os.path.join(CP.S, 'duet-pad-a4-300dpi.png'))
    page = CP.sheets[o.card // 4]; slot = o.card % 4; col, row = slot % 2, slot // 2; P = CP.PPM
    x0, y0 = int((CP.M + col * CP.CW) * P), int((CP.M + row * CP.CH) * P); card = page[y0:y0 + int(CP.CH * P), x0:x0 + int(CP.CW * P)]
    cy, cx = pad.shape[0] // 2, pad.shape[1] // 2; h, w = card.shape[:2]
    pad[cy - h // 2:cy - h // 2 + h, cx - w // 2:cx - w // 2 + w] = card
    src, centre = pad, (297 / 2, 210 / 2)
with tempfile.TemporaryDirectory() as td:
    for k in range(o.frames):
        ph = 2 * math.pi * k / o.frames
        img, q, R, t, f = CP.render(o.card, o.w, o.h, o.dist + 0.02 * math.sin(ph), math.radians(o.tilt + 4 * math.sin(ph * 2)), math.radians(90 + 8 * math.cos(ph)), 0.04 * math.sin(ph),
                                    (0.5 + 0.03 * math.sin(ph), 0.55), o.light, o.pad, o.table, seed=k, src=src, centre=centre)
        cv2.imwrite(os.path.join(td, f'{k:04d}.jpg'), img, [cv2.IMWRITE_JPEG_QUALITY, 90])
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-framerate', '30', '-i', os.path.join(td, '%04d.jpg'), '-c:v', 'mjpeg', '-q:v', '3', '-f', 'mjpeg', o.out], check=True)
print('video', o.out, o.frames, 'frames')
