#!/usr/bin/env python3
"""DUET Little Learners: three Harappan objects modelled from open-licence photographs (no 3D scan of them is openly
available). Writes raw GLB files to the scratch folder; prep.mjs (mode "light", source "file") then makes them small.
 - the "priest-king" and the "dancing girl": the figure is cut out of a frontal photo (GrabCut), its outline is
   "inflated" into a rounded body (each slice is a half circle as wide as the figure is there) and the photo's fine
   shading adds the carved detail; the back gets the same stone or bronze colour, without the photo's details
 - the "unicorn" seal and its modern impression (The Met, 49.40.1, CC0): the seal face is carved as deep as the photo's
   grooves are dark; a 3.8 x 3.8 x 1 cm block with the pierced boss on its back, as in the Met's photo of the back
usage: python3 relief.py <out folder>   (downloads the photos, then deletes them)"""
import cv2, numpy as np, json, struct, os, sys, urllib.request, urllib.parse, time
OUT = sys.argv[1] if len(sys.argv) > 1 else '/tmp/claude-0/agent-early/relief'; os.makedirs(OUT, exist_ok=True)
UA = {'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) open-content-fetch/1.0'}
SRC = {
  'king': ('https://commons.wikimedia.org/wiki/Special:FilePath/' + urllib.parse.quote('King_Priest,_Pakistan.jpg') + '?width=1280'),
  'girl': ('https://commons.wikimedia.org/wiki/Special:FilePath/' + urllib.parse.quote('Dancing_girl_of_Mohenjo-daro.jpg') + '?width=1280'),
  'seal': 'https://images.metmuseum.org/CRDImages/an/web-large/DP23101.jpg',
}
def fetch(k):
    f = os.path.join(OUT, k + '.src.jpg')
    if not os.path.exists(f): open(f, 'wb').write(urllib.request.urlopen(urllib.request.Request(SRC[k], headers=UA), timeout=60).read()); time.sleep(1)
    return cv2.imread(f)

def write_glb(path, prims, images):
    """prims: [{pos, nrm, uv, idx, image: i, rough, metal}], images: [jpeg bytes]"""
    bin_ = bytearray(); views = []; accs = []
    def view(data, target=None):
        while len(bin_) % 4: bin_.append(0)
        views.append({'buffer': 0, 'byteOffset': len(bin_), 'byteLength': len(data), **({'target': target} if target else {})}); bin_.extend(data); return len(views) - 1
    def acc(arr, typ, comp, target):
        v = view(arr.tobytes(), target); a = {'bufferView': v, 'componentType': comp, 'count': int(arr.shape[0]), 'type': typ}
        if typ == 'VEC3': a['min'] = arr.min(0).tolist(); a['max'] = arr.max(0).tolist()
        accs.append(a); return len(accs) - 1
    meshes_p = []; mats = []; texs = []; imgs = []
    for im in images: imgs.append({'bufferView': view(im), 'mimeType': 'image/jpeg'}); texs.append({'source': len(imgs) - 1, 'sampler': 0})
    for p in prims:
        mats.append({'pbrMetallicRoughness': {'baseColorTexture': {'index': p['image']}, 'roughnessFactor': p.get('rough', 0.7), 'metallicFactor': p.get('metal', 0.0)}})
        meshes_p.append({'attributes': {'POSITION': acc(p['pos'].astype(np.float32), 'VEC3', 5126, 34962), 'NORMAL': acc(p['nrm'].astype(np.float32), 'VEC3', 5126, 34962),
                                        'TEXCOORD_0': acc(p['uv'].astype(np.float32), 'VEC2', 5126, 34962)}, 'indices': acc(p['idx'].astype(np.uint32).reshape(-1), 'SCALAR', 5125, 34963), 'material': len(mats) - 1})
    gl = {'asset': {'version': '2.0', 'generator': 'DUET relief.py'}, 'scene': 0, 'scenes': [{'nodes': [0]}], 'nodes': [{'mesh': 0}], 'meshes': [{'primitives': meshes_p}],
          'materials': mats, 'textures': texs, 'images': imgs, 'samplers': [{'magFilter': 9729, 'minFilter': 9987}], 'accessors': accs, 'bufferViews': views, 'buffers': [{'byteLength': len(bin_)}]}
    js = json.dumps(gl).encode(); js += b' ' * ((4 - len(js) % 4) % 4)
    while len(bin_) % 4: bin_.append(0)
    with open(path, 'wb') as f:
        f.write(struct.pack('<III', 0x46546C67, 2, 12 + 8 + len(js) + 8 + len(bin_))); f.write(struct.pack('<II', len(js), 0x4E4F534A)); f.write(js); f.write(struct.pack('<II', len(bin_), 0x004E4942)); f.write(bin_)

def normals(pos, idx):
    n = np.zeros_like(pos); a, b, c = pos[idx[:, 0]], pos[idx[:, 1]], pos[idx[:, 2]]; fn = np.cross(b - a, c - a)
    for k in range(3): np.add.at(n, idx[:, k], fn)
    return n / np.maximum(1e-12, np.linalg.norm(n, axis=1, keepdims=True))

def bleed(img, mask, it=40):
    """spread the figure's colours past its edge, so the texture's edge never shows the background"""
    out = img.astype(np.float32).copy(); m = mask.astype(np.float32)
    for _ in range(it):
        s = cv2.blur(out * m[..., None], (5, 5)); w = cv2.blur(m, (5, 5)); grow = (w > 0.01) & (m < 0.5)
        out[grow] = s[grow] / w[grow, None]; m = np.maximum(m, grow.astype(np.float32))
    return out.clip(0, 255).astype(np.uint8)

def figure(name, rect, cut_y=None, dark=None, height_m=0.1, depth=1.0, detail=0.35, rough=0.7, metal=0.0, cells=170, back_tint=1.0):
    img = fetch(name); h, w = img.shape[:2]
    mask = np.zeros((h, w), np.uint8); bg = np.zeros((1, 65), np.float64); fg = np.zeros((1, 65), np.float64)
    cv2.grabCut(img, mask, rect, bg, fg, 6, cv2.GC_INIT_WITH_RECT)
    m = ((mask == 1) | (mask == 3)).astype(np.uint8)
    if dark is not None: m &= (cv2.cvtColor(img, cv2.COLOR_BGR2GRAY) < dark).astype(np.uint8)
    if cut_y: m[cut_y:, :] = 0
    m = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8)); m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
    n, lab, st, _ = cv2.connectedComponentsWithStats(m); big = 1 + np.argmax(st[1:, cv2.CC_STAT_AREA]); m = (lab == big).astype(np.uint8)
    # fill holes
    ff = m.copy(); cv2.floodFill(ff, None, (0, 0), 1); m = m | (1 - ff)
    ys, xs = np.where(m); y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1; pad = 6
    y0, x0 = max(0, y0 - pad), max(0, x0 - pad); y1, x1 = min(h, y1 + pad), min(w, x1 + pad)
    img, m = img[y0:y1, x0:x1], m[y0:y1, x0:x1]; H, W = m.shape
    cv2.imwrite(os.path.join(OUT, name + '_mask.png'), m * 255)
    # depth: a half circle across the figure, as wide as it is at each place
    d = cv2.distanceTransform(m, cv2.DIST_L2, 5).astype(np.float32)
    wloc = cv2.dilate(d, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (int(max(H, W) * 0.09) | 1,) * 2)); wloc = cv2.GaussianBlur(wloc, (0, 0), max(H, W) * 0.01)
    z = np.sqrt(np.clip(2 * wloc * d - d * d, 0, None)) * depth
    g = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY).astype(np.float32); hp = g - cv2.GaussianBlur(g, (0, 0), max(H, W) * 0.012)
    z += hp * detail * (np.clip(d / 6, 0, 1)); z = cv2.GaussianBlur(z, (0, 0), 1.2) * m
    # the texture: the photo (front) and a soft copy without detail (back), side by side
    col = bleed(img, m); soft = cv2.GaussianBlur(col, (0, 0), max(H, W) * 0.02); soft = (soft.astype(np.float32) * back_tint).clip(0, 255).astype(np.uint8)
    TH = 1024; TW = 512; atlas = np.concatenate([cv2.resize(col, (TW, TH), interpolation=cv2.INTER_AREA), cv2.resize(soft, (TW, TH), interpolation=cv2.INTER_AREA)], axis=1)
    ok, jpg = cv2.imencode('.jpg', atlas, [cv2.IMWRITE_JPEG_QUALITY, 92])
    # the grid of vertices (front and back), only where the figure is
    step = max(H, W) / cells; gy, gx = np.mgrid[0:H:step, 0:W:step]; gy = np.minimum(gy, H - 1); gx = np.minimum(gx, W - 1)
    R, C = gy.shape; inside = cv2.dilate(m, np.ones((3, 3), np.uint8))[gy.astype(int), gx.astype(int)] > 0
    zz = z[gy.astype(int), gx.astype(int)] * inside
    S = height_m / H  # metres per pixel
    pos = []; uv = []; idx = []
    for side in (1, -1):
        base = len(pos); vid = -np.ones((R, C), np.int64)
        for r in range(R):
            for c in range(C):
                if not inside[r, c]: continue
                vid[r, c] = len(pos); X = (gx[r, c] - W / 2) * S; Y = (H - gy[r, c]) * S; Z = zz[r, c] * S * side * (1 if side > 0 else 0.85)
                pos.append((X, Y, Z)); u = gx[r, c] / W * 0.5 + (0 if side > 0 else 0.5); uv.append((u, gy[r, c] / H))
        for r in range(R - 1):
            for c in range(C - 1):
                a, b, cc, dd = vid[r, c], vid[r, c + 1], vid[r + 1, c], vid[r + 1, c + 1]
                tri = [(a, cc, b), (b, cc, dd)] if side > 0 else [(a, b, cc), (b, dd, cc)]
                for t in tri:
                    if min(t) >= 0: idx.append(t)
                if a >= 0 and b >= 0 and cc >= 0 and dd < 0: idx.append((a, cc, b) if side > 0 else (a, b, cc))
                elif a >= 0 and b >= 0 and dd >= 0 and cc < 0: idx.append((a, dd, b) if side > 0 else (a, b, dd))
                elif a >= 0 and cc >= 0 and dd >= 0 and b < 0: idx.append((a, cc, dd) if side > 0 else (a, dd, cc))
                elif b >= 0 and cc >= 0 and dd >= 0 and a < 0: idx.append((b, cc, dd) if side > 0 else (b, dd, cc))
    pos = np.array(pos, np.float32); uv = np.array(uv, np.float32); idx = np.array(idx, np.int64)
    # weld the two sides along the outline (where the front's depth is ~0), so there is no crack
    nrm = normals(pos, idx)
    write_glb(os.path.join(OUT, name + '.glb'), [{'pos': pos, 'nrm': nrm, 'uv': uv, 'idx': idx, 'image': 0, 'rough': rough, 'metal': metal}], [jpg.tobytes()])
    print(name, len(pos), 'verts', len(idx), 'tris', W, 'x', H, 'px')

def seal():
    img = fetch('seal'); g = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    m = (g > 170).astype(np.uint8); m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((7, 7), np.uint8))
    n, lab, st, cen = cv2.connectedComponentsWithStats(m); order = np.argsort(-st[1:, cv2.CC_STAT_AREA])[:2] + 1
    boxes = sorted([st[i] for i in order], key=lambda s: s[0])  # left: the seal, right: the impression
    def crop(s, inset=4): x, y, w, h = s[:4]; return img[y + inset:y + h - inset, x + inset:x + w - inset]
    face, imp = crop(boxes[0]), crop(boxes[1])
    pieces = []; images = []
    def tile(colimg, depth_sign, size, thick, x_off, carve=0.0012, stone=None, boss=False, rough=0.6):
        N = 110; col = cv2.resize(colimg, (512, 512), interpolation=cv2.INTER_AREA)
        lum = cv2.GaussianBlur(cv2.cvtColor(col, cv2.COLOR_BGR2GRAY).astype(np.float32), (0, 0), 2.0); lum = (lum - lum.min()) / max(1, lum.max() - lum.min())
        hgt = (lum - np.median(lum)) * carve * depth_sign
        # the atlas: the face photo above, plain stone below (sides and back)
        st_col = stone if stone is not None else col.reshape(-1, 3).mean(0)
        plain = np.full((512, 512, 3), st_col, np.float32); plain += np.random.default_rng(1).normal(0, 6, plain.shape); plain = cv2.GaussianBlur(plain, (0, 0), 1.5).clip(0, 255).astype(np.uint8)
        ok, jpg = cv2.imencode('.jpg', np.concatenate([col, plain], axis=0), [cv2.IMWRITE_JPEG_QUALITY, 92]); images.append(jpg.tobytes()); im = len(images) - 1
        pos, uv, idx = [], [], []
        def V(p, t): pos.append(p); uv.append(t); return len(pos) - 1
        grid = np.zeros((N + 1, N + 1), np.int64)
        for r in range(N + 1):
            for c in range(N + 1):
                u, v = c / N, r / N; e = 1 if 0 < r < N and 0 < c < N else 0
                grid[r, c] = V((x_off + (u - 0.5) * size, thick + hgt[min(511, int(v * 511)), min(511, int(u * 511))] * e, (v - 0.5) * size), (u, v * 0.5))
        for r in range(N):
            for c in range(N): a, b, cc, d = grid[r, c], grid[r, c + 1], grid[r + 1, c], grid[r + 1, c + 1]; idx += [(a, cc, b), (b, cc, d)]
        # sides and bottom (plain stone)
        corners = [(-0.5, -0.5), (0.5, -0.5), (0.5, 0.5), (-0.5, 0.5)]
        for k in range(4):
            (ax, az), (bx, bz) = corners[k], corners[(k + 1) % 4]
            p = [V((x_off + ax * size, thick, az * size), (0.1, 0.6)), V((x_off + bx * size, thick, bz * size), (0.9, 0.6)), V((x_off + bx * size, 0, bz * size), (0.9, 0.9)), V((x_off + ax * size, 0, az * size), (0.1, 0.9))]
            idx += [(p[0], p[1], p[2]), (p[0], p[2], p[3])]
        p = [V((x_off + ax * size, 0, az * size), (0.2 + 0.6 * (ax + 0.5), 0.55 + 0.4 * (az + 0.5))) for ax, az in corners]; idx += [(p[0], p[2], p[1]), (p[0], p[3], p[2])]
        if boss:  # the pierced boss on the back: a half cylinder with a groove across it
            R = size * 0.2; L = size * 0.55; seg = 18
            for half in (-1, 1):
                z0, z1 = (0.03 * size, L / 2) if half > 0 else (-L / 2, -0.03 * size); ring = []
                for z in (z0, z1):
                    row = []
                    for i in range(seg + 1):
                        a = np.pi * i / seg; row.append(V((x_off + np.cos(a) * R, -np.sin(a) * R * 0.8, z), (0.2 + 0.6 * i / seg, 0.6 + 0.3 * (z - z0) / (z1 - z0))))
                    ring.append(row)
                for i in range(seg): a, b, c2, d = ring[0][i], ring[0][i + 1], ring[1][i], ring[1][i + 1]; idx += [(a, b, c2), (b, d, c2)]
                for z, rr in ((z0, ring[0]), (z1, ring[1])):
                    cidx = V((x_off, -R * 0.35, z), (0.5, 0.75))
                    for i in range(seg): idx.append((cidx, rr[i + 1], rr[i]) if (z == z1) == (half > 0) else (cidx, rr[i], rr[i + 1]))
        P = np.array(pos, np.float32); I = np.array(idx, np.int64); U = np.array(uv, np.float32)
        pieces.append({'pos': P, 'nrm': normals(P, I), 'uv': U, 'idx': I, 'image': im, 'rough': rough})
    # the seal (face up, carved in: dark grooves are deep) and its impression in clay (raised), side by side
    tile(face, +1, 0.038, 0.010, -0.023, carve=0.0014, boss=True, rough=0.55)
    tile(imp, +1, 0.040, 0.007, 0.024, carve=0.0012, stone=(110, 150, 196), rough=0.85)  # BGR: a pale terracotta
    write_glb(os.path.join(OUT, 'seal.glb'), pieces, images); print('seal', sum(len(p['pos']) for p in pieces), 'verts')

if __name__ == '__main__':
    figure('king', (270, 40, 820, 1200), cut_y=1232, height_m=0.175, depth=0.8, detail=0.30, rough=0.75, cells=160)
    figure('girl', (110, 30, 900, 1930), dark=125, height_m=0.105, depth=0.9, detail=0.18, rough=0.42, metal=0.55, cells=200, back_tint=0.9)
    seal()
    if '--keep' not in sys.argv:
        for f in os.listdir(OUT):
            if f.endswith('.src.jpg'): os.remove(os.path.join(OUT, f))
