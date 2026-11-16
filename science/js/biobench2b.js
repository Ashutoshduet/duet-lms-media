// DUET Science Lab 360, biology at the bench, batch BIO2, part 2: food on a white tile (real photos of bread, apple and
// cucumber; potato and rice drawn from their real look), oil-paper squares, moong seeds that soak, sprout and breathe, a
// small refrigerator, raisins that swell and shrink, Hydrilla under a funnel with a lamp that can be moved, a polythene bag
// that mists up, a sadabahar twig in red ink and a slice of its stem, bean seedlings that bend to light, and a respirometer.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { Item, Vessel, testTube, funnel as glassFunnel } from './apparatus.js';
import { glassMat, canvasTex } from './mats.js';
import { BENCH_Y } from './room.js';
import { liveSign } from './mathworld4.js';
import { handle } from './mathworld.js';
import { V, N, M, rnd, clamp01, lerp, smooth, ease, btex, bimg, leafGeo, leafMat, taperTube, noHit, whiteFlowers } from './biobench2.js';

const TAU = Math.PI * 2;
// smooth 3D value noise (for wrinkles and cotton)
function noise3(x, y, z) {
  const h = (i, j, k) => { let n = i * 374761393 + j * 668265263 + k * 1274126177; n = (n ^ (n >>> 13)) * 1274126177; return ((n ^ (n >>> 16)) >>> 0) / 4294967296; };
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z), xf = x - xi, yf = y - yi, zf = z - zi; const s = (t) => t * t * (3 - 2 * t); const u = s(xf), v = s(yf), w = s(zf);
  const L = (a, b, t) => a + (b - a) * t;
  return L(L(L(h(xi, yi, zi), h(xi + 1, yi, zi), u), L(h(xi, yi + 1, zi), h(xi + 1, yi + 1, zi), u), v), L(L(h(xi, yi, zi + 1), h(xi + 1, yi, zi + 1), u), L(h(xi, yi + 1, zi + 1), h(xi + 1, yi + 1, zi + 1), u), v), w);
}

// ------------------------------------------------------------------ food samples on a white tile: each is a tiny "vessel" so that
// a drop from a dropper (by hand or by the Do it button) lands on it; the iodine spreads into a spot whose colour depends on starch
const FOOD = {
  potato: { n: N('Raw potato slice', 'कच्चे आलू का टुकड़ा', 'Kachche aloo ka tukda'), starch: 1, r: 0.021 },
  rice: { n: N('Boiled rice', 'उबले हुए चावल', 'Ubale hue chawal'), starch: 1, r: 0.018 },
  bread: { n: N('Piece of bread', 'ब्रेड का टुकड़ा', 'Bread ka tukda'), starch: 0.9, r: 0.021 },
  apple: { n: N('Slice of ripe apple', 'पके सेब की फाँक', 'Pake seb ki phaank'), starch: 0.04, r: 0.022 },
  cucumber: { n: N('Cucumber slice', 'खीरे का टुकड़ा', 'Kheere ka tukda'), starch: 0, r: 0.018 },
};
// raw potato flesh, drawn: pale cream with fine grain and the faint ring of its vascular tissue
function potatoTex() { return canvasTex(256, 256, (x, W, H) => { const r = rnd(21); const g = x.createRadialGradient(W / 2, H / 2, 10, W / 2, H / 2, W / 2); g.addColorStop(0, '#f2e7c2'); g.addColorStop(0.78, '#efe0b4'); g.addColorStop(0.86, '#e7d39e'); g.addColorStop(0.9, '#efe2b8'); g.addColorStop(0.97, '#e6d6a8'); g.addColorStop(1, '#8c6a42'); x.fillStyle = g; x.fillRect(0, 0, W, H);
  for (let i = 0; i < 2500; i++) { const a = r() * TAU, d = Math.sqrt(r()) * W * 0.47; x.fillStyle = `rgba(${r() < 0.5 ? '255,250,230' : '200,180,130'},${0.08 + r() * 0.12})`; x.fillRect(W / 2 + Math.cos(a) * d, H / 2 + Math.sin(a) * d, 1 + r() * 2, 1 + r() * 2); }
  x.strokeStyle = 'rgba(190,165,110,0.35)'; x.lineWidth = 2; x.beginPath(); x.ellipse(W / 2, H / 2, W * 0.4, H * 0.39, 0.2, 0, TAU); x.stroke(); }); }
export function foodSample(kind) {
  const F = FOOD[kind]; const R = F.r;
  const v = new Vessel('food', [[0, 0], [R, 0], [R, 0.006], [R + 0.0004, 0.0065]], { wall: 0.0004, noRim: true, name: F.n, cap: 4 });
  v.glass.material = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }); v.food = kind; v.starchK = F.starch;
  const u0 = v.update.bind(v); v.update = (dt) => { u0(dt); v.liq.visible = false; stainTick(v, dt); };
  // the top surface: a canvas over the photo (so the iodine spot can be painted on it)
  const C = document.createElement('canvas'); C.width = C.height = 256; const tex = new THREE.CanvasTexture(C); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4; v.canvas = C; v.ctex = tex;
  let base = null; const drawBase = (img) => { base = img; if (v.redraw) v.redraw(); };
  const side = (c) => M(c, 0.7);
  if (kind === 'potato') { const top = potatoTex(); top.needsUpdate = true; drawBase(top.image);
    const s = new THREE.Mesh(new THREE.CylinderGeometry(R, R * 1.02, 0.007, 36), [side(0xa98552), M(0xffffff, 0.55, 0, { map: tex }), side(0xd9c48e)]); s.position.y = 0.0035; v.g.add(s); s.castShadow = true; }
  else if (kind === 'cucumber') { bimg('cucumber_slice').then(drawBase); const s = new THREE.Mesh(new THREE.CylinderGeometry(R, R, 0.005, 36), [side(0x3f6a2a), M(0xffffff, 0.35, 0, { map: tex }), side(0xc8dcb0)]); s.position.y = 0.0025; v.g.add(s); s.castShadow = true; }
  else if (kind === 'apple') { bimg('apple_half').then(drawBase); const s = new THREE.Mesh(new THREE.CylinderGeometry(R, R, 0.006, 36), [side(0xb2423a), M(0xffffff, 0.45, 0, { map: tex }), side(0xeee0b8)]); s.scale.set(0.92, 1, 1.0); s.position.y = 0.003; v.g.add(s); s.castShadow = true; }
  else if (kind === 'bread') { bimg('bread_slice').then((im) => drawBase(im ? { crop: im } : null)); const s = new THREE.Mesh(new THREE.BoxGeometry(R * 2.1, 0.009, R * 1.9), [side(0xb07a3e), side(0xb07a3e), M(0xffffff, 0.8, 0, { map: tex }), side(0xd8c49a), side(0xb07a3e), side(0xb07a3e)]); s.position.y = 0.0045; v.g.add(s); s.castShadow = true; }
  else if (kind === 'rice') { // a small heap of boiled grains; they take up the stain grain by grain
    const n = 95, r = rnd(5); const geo = new THREE.CapsuleGeometry(0.00125, 0.0032, 3, 8); const gp = geo.attributes.position; for (let i = 0; i < gp.count; i++) { const y = gp.getY(i); gp.setX(i, gp.getX(i) * (1 - 0.12 * Math.abs(y) / 0.0028)); gp.setZ(i, gp.getZ(i) * 0.85); } geo.computeVertexNormals(); const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.38, transparent: true, opacity: 0.94 });
    const im = new THREE.InstancedMesh(geo, mat, n); const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(); v.grains = [];
    for (let i = 0; i < n; i++) { const a = r() * TAU, d = Math.sqrt(r()) * R * 0.92; const h = 0.0012 + Math.pow(1 - d / R, 0.8) * 0.0075 * (0.4 + 0.6 * r()); e.set(Math.PI / 2 + (r() - 0.5) * 1.1, r() * TAU, (r() - 0.5) * 1.1); q.setFromEuler(e); const p = V(Math.cos(a) * d, h, Math.sin(a) * d); const k = 0.85 + r() * 0.3;
      m4.compose(p, q, V(k, k, k)); im.setMatrixAt(i, m4); const c0 = new THREE.Color(0xf6f3ea).multiplyScalar(0.93 + r() * 0.07); im.setColorAt(i, c0); v.grains.push({ d, p, c0 }); }
    im.castShadow = true; v.g.add(im); v.rice = im; }
  v.stain = 0; v.redraw = () => { const x = C.getContext('2d'); x.clearRect(0, 0, 256, 256);
    if (base && base.crop) x.drawImage(base.crop, base.crop.width * 0.12, base.crop.height * 0.16, base.crop.width * 0.72, base.crop.height * 0.62, 0, 0, 256, 256); else if (base) x.drawImage(base, 0, 0, 256, 256); else { x.fillStyle = '#eee'; x.fillRect(0, 0, 256, 256); }
    if (v.stain > 0) { const s = v.starchK; const col = s > 0.3 ? [16, 18, 40] : s > 0.03 ? [90, 60, 40] : [168, 98, 24]; const rad = 30 + 80 * Math.min(1, v.stain);
      const g = x.createRadialGradient(128, 128, rad * 0.2, 128, 128, rad); g.addColorStop(0, `rgba(${col},${0.92})`); g.addColorStop(0.7, `rgba(${col},${0.8})`); g.addColorStop(1, `rgba(${col},0)`); x.globalCompositeOperation = s > 0.3 ? 'source-atop' : 'multiply'; x.fillStyle = g; x.fillRect(0, 0, 256, 256); x.globalCompositeOperation = 'source-over'; }
    tex.needsUpdate = true; };
  v.redraw();
  v.height = 0.012; v.radius = R; v.grabY = 0.004; v.noGrab = true; v.noPhys = true; return v;
}
// a spoonful of boiled rice settled at the bottom of a test tube (chewed: broken, smaller bits); the liquid above tints it
export function riceInTube(t, chewed = false, seed = 3) {
  const n = chewed ? 22 : 11, r = rnd(seed); const geo = chewed ? new THREE.IcosahedronGeometry(0.0013, 0) : new THREE.CapsuleGeometry(0.00115, 0.003, 3, 6);
  const im = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 }), n); const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
  const y0 = t.inner[0].y; for (let i = 0; i < n; i++) { const y = y0 + 0.0014 + (i / n) * (chewed ? 0.007 : 0.008) + r() * 0.0012; const R = Math.max(0.0005, t.rInner(y) - 0.0018); const a = r() * Math.PI * 2, d = Math.sqrt(r()) * R;
    e.set(Math.PI / 2 + (r() - 0.5) * 1.2, r() * 6.3, (r() - 0.5) * 1.2); q.setFromEuler(e); const k = chewed ? 0.5 + r() * 0.7 : 0.9 + r() * 0.2; m4.compose(V(Math.cos(a) * d, y, Math.sin(a) * d), q, V(k, k * (chewed ? 0.6 + r() * 0.6 : 1), k)); im.setMatrixAt(i, m4);
    im.setColorAt(i, new THREE.Color(0xf4f1e6).multiplyScalar(0.9 + r() * 0.1)); }
  im.renderOrder = -1; return im;
}
function stainTick(v, dt) {
  const iod = (v.mix.liq.iodine || 0) + (v.mix.liq.sic || 0); const want = Math.min(1.2, iod / 0.12); if (want <= v.stain + 0.005) return;
  v.stain = Math.min(want, v.stain + dt * 0.6); v._t = (v._t || 0) + dt; if (v._t > 0.15) { v._t = 0; v.redraw(); }
  if (v.rice) { const s = v.starchK; const c = new THREE.Color(); v.grains.forEach((gr, i) => { const k = clamp01(v.stain * 1.6 - gr.d / v.radius * 0.9); c.copy(gr.c0).lerp(new THREE.Color(s > 0.3 ? 0x141834 : 0xa86a20), k * 0.95); v.rice.setColorAt(i, c); }); v.rice.instanceColor.needsUpdate = true; }
}

// ------------------------------------------------------------------ the oil (paper) test: a square of white paper; a fat leaves a patch you can see light through
export function paperSquare(o = {}) {
  const it = new Item('bpapersq', { name: o.name || N('Square of white paper', 'सफ़ेद कागज़ का चौकोर टुकड़ा', 'Safed kaagaz ka chaukor tukda') });
  const C = document.createElement('canvas'); C.width = C.height = 256; const tex = new THREE.CanvasTexture(C); tex.colorSpace = THREE.SRGBColorSpace; const E = document.createElement('canvas'); E.width = E.height = 128; const etex = new THREE.CanvasTexture(E); etex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.MeshStandardMaterial({ map: tex, emissiveMap: etex, emissive: 0x000000, roughness: 0.95, side: THREE.DoubleSide });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 0.06).rotateX(-Math.PI / 2), mat); m.position.y = 0.0006; m.receiveShadow = true; it.g.add(m); it.sheet = m;
  const r = rnd(o.seed ?? 3); const fib = Array.from({ length: 900 }, () => [r() * 256, r() * 256, r() * 6.28, 2 + r() * 8, r()]);
  it.oil = 0; it.wet = 0; it.patch = { x: 0.5 + (r() - 0.5) * 0.1, y: 0.5 + (r() - 0.5) * 0.1, s: 0.2 + r() * 0.05 };
  it.draw = () => { const x = C.getContext('2d'); x.fillStyle = '#f7f6f1'; x.fillRect(0, 0, 256, 256); for (const [a, b, c, l, k] of fib) { x.strokeStyle = `rgba(${k < 0.5 ? '210,205,195' : '255,255,255'},0.35)`; x.lineWidth = 1; x.beginPath(); x.moveTo(a, b); x.lineTo(a + Math.cos(c) * l, b + Math.sin(c) * l); x.stroke(); }
    const P = it.patch; const blob = (ctx, W, col, k) => { if (k <= 0.01) return; const cx = P.x * W, cy = P.y * W, rr = P.s * W * (0.7 + 0.5 * k); ctx.fillStyle = col; ctx.beginPath(); for (let i = 0; i <= 24; i++) { const a = i / 24 * TAU; const q = rr * (1 + 0.13 * Math.sin(a * 3 + P.x * 20) + 0.08 * Math.sin(a * 5 + 1)); ctx.lineTo(cx + Math.cos(a) * q, cy + Math.sin(a) * q); } ctx.fill(); };
    blob(x, 256, `rgba(196,186,150,${0.55 * it.oil})`, it.oil); blob(x, 256, `rgba(170,170,165,${0.45 * it.wet})`, it.wet);
    const e = E.getContext('2d'); e.fillStyle = '#000'; e.fillRect(0, 0, 128, 128); blob(e, 128, `rgba(255,236,190,${0.95 * it.oil})`, it.oil); tex.needsUpdate = true; etex.needsUpdate = true; };
  // held up against a lamp: light comes through the paper, much more through an oily patch
  it.backlit = (on) => { mat.emissive.set(on ? 0xffffff : 0x000000); mat.emissiveIntensity = on ? 1.4 : 0; it.lit = on; };
  it.update = (dt) => { if (it.wet > 0 && !it.lit) { const L = it.app ? it.app.chem.lapse || 1 : 1; const d = dt * L / 240; it.wet = Math.max(0, it.wet - d); it._t = (it._t || 0) + dt; if (it._t > 0.3) { it._t = 0; it.draw(); } } };
  it.draw(); it.height = 0.002; it.radius = 0.035; it.grabY = 0.001; it.noPhys = true; it.base = 0; return it;
}
// the samples for the oil test: groundnuts, a lump of butter, cucumber slices (mustard oil comes in a dropper bottle)
export function fatSample(kind) {
  const it = new Item('bfat', { name: { nut: N('Crushed groundnuts', 'कुचली हुई मूँगफली', 'Kuchli hui moongphali'), butter: N('Butter', 'मक्खन', 'Makkhan'), cucumber: N('Cucumber slice', 'खीरे का टुकड़ा', 'Kheere ka tukda'), potato: N('Raw potato slice', 'कच्चे आलू का टुकड़ा', 'Kachche aloo ka tukda') }[kind] });
  const r = rnd(9); it.fat = { nut: 1, butter: 1, cucumber: 0, potato: 0 }[kind]; it.water = { nut: 0.1, butter: 0.2, cucumber: 1, potato: 0.6 }[kind];
  if (kind === 'nut') { const skin = M(0xa8653a, 0.55), core = M(0xe9cf9a, 0.6); for (let i = 0; i < 5; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.0045, 12, 10), i % 2 ? skin : core); m.scale.set(1.5, 0.75, 1); m.position.set((r() - 0.5) * 0.02, 0.003, (r() - 0.5) * 0.016); m.rotation.y = r() * 3; m.castShadow = true; it.g.add(m); } }
  else if (kind === 'butter') { const g = new THREE.BoxGeometry(0.022, 0.012, 0.016, 4, 2, 4); const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i); p.setXYZ(i, x * (1 - 0.06 * Math.abs(y) / 0.006), y, z); } g.computeVertexNormals(); const m = new THREE.Mesh(g, M(0xf3df8a, 0.35)); m.position.y = 0.006; m.castShadow = true; it.g.add(m); }
  else if (kind === 'cucumber') { const t = btex('cucumber_slice'); const m = new THREE.Mesh(new THREE.CylinderGeometry(0.017, 0.017, 0.005, 32), [M(0x3f6a2a, 0.5), M(0xffffff, 0.35, 0, { map: t }), M(0xc8dcb0, 0.5)]); m.position.y = 0.0025; m.castShadow = true; it.g.add(m); }
  else { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.006, 32), [M(0xa98552, 0.7), M(0xf0e2b6, 0.6), M(0xd9c48e, 0.6)]); m.position.y = 0.003; it.g.add(m); }
  it.height = 0.012; it.radius = 0.02; it.grabY = 0.005; it.noPhys = true; return it;
}

// ------------------------------------------------------------------ moong (green gram) seeds: soak, swell, sprout
const SEEDG = new THREE.SphereGeometry(1, 12, 9);
const seedMat = () => M(0x587026, 0.32); const hilumMat = () => M(0xf2efe2, 0.6); const rootMat = () => M(0xf4efdc, 0.55); const plumMat = () => M(0xc9d36a, 0.55);
export function seedGroup(n, o = {}) {
  const g = new THREE.Group(); const r = rnd(o.seed ?? 1); const seeds = []; const sm = seedMat(), hm = hilumMat(), rm = rootMat(), pm = plumMat();
  for (let i = 0; i < n; i++) {
    const s = new THREE.Group(); const a = r() * TAU, d = Math.sqrt(r()) * (o.R ?? 0.03); s.position.set(Math.cos(a) * d, 0.002, Math.sin(a) * d); s.rotation.y = r() * TAU; g.add(s);
    const body = new THREE.Mesh(SEEDG, sm); body.scale.set(0.0024, 0.0016, 0.0017); body.castShadow = true; s.add(body);
    const hil = new THREE.Mesh(SEEDG, hm); hil.scale.set(0.0011, 0.00035, 0.0005); hil.position.set(0, 0.0004, 0.0016); s.add(hil);
    const sd = { g: s, body, k: 0.75 + r() * 0.6, swell: 0, prog: 0, root: null, plum: null, rm, pm, dead: false, curve: (r() - 0.5) * 2, dir: r() * TAU };
    seeds.push(sd);
  }
  g.seeds = seeds;
  // swell 0…1 (water taken in), grow: hours of growth (0 = not yet sprouted)
  g.setSeed = (sd, swell, grow) => {
    sd.swell = swell; const k = 1 + 0.32 * swell; sd.body.scale.set(0.0024 * k, 0.0016 * k, 0.0017 * k); sd.body.material = sd.body.material; sd.g.position.y = 0.0016 * k;
    const L = grow > 0 ? Math.min(0.045, grow * 0.0011) : 0; // about 2.5 cm of root in a day
    if (L > 0.0005 && Math.abs((sd.L || 0) - L) > 0.0004) { sd.L = L; if (sd.root) { sd.g.remove(sd.root); sd.root.geometry.dispose(); }
      const pts = []; const nP = 8; for (let i = 0; i <= nP; i++) { const t = i / nP; const ang = sd.curve * t * 1.6; pts.push(V(Math.sin(ang) * L * 0.5 * t, -0.0005 - t * 0.0012, 0.0016 + Math.cos(ang * 0.6) * L * t)); }
      sd.root = new THREE.Mesh(taperTube(new THREE.CatmullRomCurve3(pts), 0.0007, 0.0003, 10, 6), sd.rm); sd.root.castShadow = true; sd.g.add(sd.root);
      if (L > 0.012) { if (!sd.plum) { sd.plum = new THREE.Mesh(new THREE.SphereGeometry(0.0012, 8, 6), sd.pm); sd.plum.scale.set(1, 0.7, 1.6); sd.g.add(sd.plum); } sd.plum.position.set(0, 0.0018 * k, -0.0012); sd.plum.scale.setScalar(Math.min(1.6, (L - 0.012) * 90)); sd.body.material = sd.split || (sd.split = M(0x6f7d34, 0.45)); } }
  };
  return g;
}
// the cotton in a container: a soft white layer that greys as it takes up water
export function cottonBed(R, o = {}) {
  const g = new THREE.CircleGeometry(R, 40, 0, TAU); g.rotateX(-Math.PI / 2); const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i); const d = Math.hypot(x, z) / R; p.setY(i, (0.004 + noise3(x * 400, 0, z * 400) * 0.003) * (1 - d * d * 0.6)); } g.computeVertexNormals();
  const m = new THREE.Mesh(g, M(0xf6f5f0, 1)); m.receiveShadow = true; m.userData.noHit = true; m.setWet = (k) => m.material.color.setRGB(0.965 - 0.12 * k, 0.96 - 0.11 * k, 0.94 - 0.08 * k); return m;
}
// germination: needs water, air and warmth. Each seed has its own speed; flooded seeds swell but get no air.
export function germinate(seeds, hours, env) {
  // env: { moist 0…1, flooded bool, T °C }
  for (const sd of seeds.seeds) {
    const wetT = env.moist > 0.2 || env.flooded ? hours : 0; sd.wetH = (sd.wetH || 0) + wetT;
    const swell = clamp01((sd.wetH || 0) / 10); const warm = env.T >= 20 ? 1 : env.T >= 12 ? 0.25 : 0.0;
    const can = env.moist > 0.2 && !env.flooded && !sd.dead; if (can) sd.prog += hours * warm * sd.k;
    const grow = Math.max(0, sd.prog - 22); seeds.setSeed(sd, swell, grow);
  }
}

// ------------------------------------------------------------------ a small refrigerator (4 °C inside)
export function fridge(o = {}) {
  const it = new Item('bfridge', { name: N('Refrigerator (about 4 °C inside)', 'फ्रिज (अंदर लगभग 4 °C)', 'Fridge (andar lagbhag 4 °C)') });
  const w = 0.3, h = 0.42, d = 0.28, t = 0.012; const white = M(0xeceff1, 0.35, 0.05), in_ = M(0xf6f8f9, 0.5), grey = M(0x9aa2a8, 0.35, 0.6);
  const box = (W, H, D, x, y, z, m) => { const b = new THREE.Mesh(new THREE.BoxGeometry(W, H, D), m); b.position.set(x, y, z); b.castShadow = true; b.receiveShadow = true; it.g.add(b); return b; };
  box(w, t, d, 0, t / 2, 0, white); box(w, t, d, 0, h - t / 2, 0, white); box(t, h, d, -w / 2 + t / 2, h / 2, 0, white); box(t, h, d, w / 2 - t / 2, h / 2, 0, white); box(w, h, t, 0, h / 2, -d / 2 + t / 2, in_);
  box(w - 2 * t, 0.004, d - t, 0, h * 0.5, 0.002, new THREE.MeshStandardMaterial({ color: 0xdfe8ee, transparent: true, opacity: 0.5, roughness: 0.1 })); // a glass shelf
  const door = new THREE.Group(); door.position.set(-w / 2, 0, d / 2); it.g.add(door);
  const dp = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.02), white); dp.position.set(w / 2, h / 2, 0.01); dp.castShadow = true; door.add(dp);
  const hd = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.16, 0.016), grey); hd.position.set(w - 0.03, h * 0.6, 0.028); door.add(hd);
  const lab = canvasTex(128, 32, (x, W, H) => { x.fillStyle = '#9aa2a8'; x.font = '700 20px sans-serif'; x.textAlign = 'center'; x.fillText('4 °C', W / 2, 23); }); const lt = new THREE.Mesh(new THREE.PlaneGeometry(0.05, 0.0125), new THREE.MeshBasicMaterial({ map: lab, transparent: true })); lt.position.set(w / 2, h - 0.04, 0.0205); door.add(lt);
  it.setOpen = (k) => { it.open = k; door.rotation.y = -k * 1.9; }; it.setOpen(0);
  it.inside = (p) => { const c = it.g.position; return Math.abs(p.x - c.x) < w / 2 - 0.015 && Math.abs(p.z - c.z) < d / 2 - 0.01; }; it.shelfY = h * 0.5 + 0.002; it.floorY = t;
  it.w = w; it.h = h; it.d = d; it.noGrab = true; it.noPhys = true; it.height = h; it.radius = w / 2; return it;
}

// ------------------------------------------------------------------ raisins: wrinkled and dark when dry, plump and lighter when they take in water
export function raisins(n = 6, o = {}) {
  const it = new Item('braisins', { name: o.name || N('Raisins (kishmish)', 'किशमिश', 'Kishmish (raisins)') }); const r = rnd(o.seed ?? 4);
  const tex = btex('raisin_skin'); it.list = [];
  for (let i = 0; i < n; i++) {
    const geo = new THREE.IcosahedronGeometry(1, 3); const p = geo.attributes.position; const base = Float32Array.from(p.array); const sx = 0.0045 + r() * 0.0008, sy = 0.0028, sz = 0.0033;
    const mat = new THREE.MeshStandardMaterial({ map: tex, color: 0xffffff, roughness: 0.42 }); const m = new THREE.Mesh(geo, mat); m.castShadow = true; m.receiveShadow = true;
    const a = (i / n) * TAU + r() * 0.5, d = 0.006 + r() * 0.01; m.position.set(Math.cos(a) * d, 0.003, Math.sin(a) * d); m.rotation.set((r() - 0.5) * 0.4, r() * TAU, (r() - 0.5) * 0.3); it.g.add(m);
    const seed = r() * 100; const rs = { m, base, sx, sy, sz, seed, k: -1 };
    rs.set = (k) => { if (Math.abs(k - rs.k) < 0.01) return; rs.k = k; const amp = lerp(0.24, 0.03, clamp01(k)), sc = lerp(1, 1.42, clamp01(k)) * (k < 0 ? 1 + k * 0.12 : 1);
      for (let j = 0; j < p.count; j++) { const x = base[j * 3], y = base[j * 3 + 1], z = base[j * 3 + 2]; const nz = noise3(x * 3.1 + seed, y * 3.1, z * 3.1) * 0.65 + noise3(x * 7 + seed, y * 7, z * 7) * 0.35; const f = 1 - amp * nz;
        p.setXYZ(j, x * sx * sc * f, y * sy * sc * f * (1 + 0.12 * k), z * sz * sc * f); }
      p.needsUpdate = true; geo.computeVertexNormals(); geo.computeBoundingSphere(); m.position.y = sy * sc * 0.85; mat.color.setRGB(1 + 0.65 * Math.max(0, k), 1 + 0.3 * Math.max(0, k), 1 - 0.05 * Math.max(0, k)); /* plump raisins turn a lighter amber-brown */ mat.roughness = 0.42 - 0.2 * Math.max(0, k); };
    rs.set(0); it.list.push(rs);
  }
  it.k = 0; it.setSwell = (k) => { it.k = k; for (const rs of it.list) rs.set(k); };
  it.height = 0.008; it.radius = 0.02; it.grabY = 0.004; it.noPhys = true; return it;
}
// water moves in or out of the raisins until inside and outside are balanced: plain water → swell; strong sugar or salt → shrink
export function raisinTarget(v) { if (!v || !v.mix) return 0; const m = v.mix; const tot = Math.max(1e-6, m.ml()); const strong = ((m.liq.sugar || 0) + (m.liq.nacl || 0) * 1.6) / tot; return strong > 0.5 ? -0.25 : 1 - 2.4 * strong; }

// ------------------------------------------------------------------ Hydrilla: thin stems with whorls of small toothed leaves (the scanned leaf, narrowed)
export function hydrillaTwig(len = 0.1, o = {}) {
  const r = rnd(o.seed ?? 2); const parts = []; const lg = (l) => { const g = leafGeo({ x: 0, y: 0, w: 1, h: 1, fw: 0.9375, fh: 0.852, aspect: 0.2, m: 4 / 512 }, l, { nx: 1, ny: 3, fold: 0.1, arch: 0.15 }); return g; };
  const pts = []; for (let i = 0; i <= 8; i++) { const t = i / 8; pts.push(V(Math.sin(t * 3 + (o.seed ?? 0)) * 0.006 * t, t * len, Math.cos(t * 2.3) * 0.004 * t)); }
  const cv = new THREE.CatmullRomCurve3(pts); const stem = taperTube(cv, 0.0008, 0.0005, 16, 5);
  for (let w = 0.04; w < 1; w += 0.065) { const at = cv.getPoint(w); const tan = cv.getTangent(w); const q0 = new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), tan); const nL = 4 + (r() < 0.3 ? 1 : 0);
    for (let j = 0; j < nL; j++) { const l = (0.009 + r() * 0.004) * (w > 0.85 ? 0.6 : 1); const g = lg(l); const m4 = new THREE.Matrix4(); const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.9 - r() * 0.4, (j / nL) * TAU + w * 7, 0, 'YXZ')); q.premultiply(q0); m4.compose(at, q, V(1, 1, 1)); g.applyMatrix4(m4); parts.push(g); } }
  const leaves = mergeGeometries(parts.map((g) => { g.deleteAttribute('normal'); return g; }), false); leaves.computeVertexNormals();
  const grp = new THREE.Group(); const lm = leafMat(btex('leaf_ovate'), 'hydrilla'); const lmesh = new THREE.Mesh(leaves, lm); lmesh.customDepthMaterial = lm.userData.depth; grp.add(lmesh); grp.add(new THREE.Mesh(stem, M(0x7c9a42, 0.6)));
  grp.tip = cv.getPoint(0); grp.top = cv.getPoint(1); return grp;
}
// the set-up: a 500 mL beaker of water, Hydrilla under an upside-down funnel, a test tube full of water upside down over the funnel's stem
const BUBBLE_ML = 0.0005; // one bubble from a Hydrilla twig, about 1 mm across
export function hydrillaSet(K, x, z, o = {}) {
  const b = K.beaker(x, z, 'water', 470, 500); b.name = N('Beaker of water with Hydrilla', 'हाइड्रिला वाला पानी का बीकर', 'Hydrilla wala paani ka beaker'); b.noGrab = true;
  // a funnel a little smaller than the beaker (mouth 6.6 cm), standing upside down on the bottom over the twigs; its stem stays under water
  const FS = 0.8, FH = 0.097 * FS, bot = b.inner[0].y, mouthY = bot + 0.005, tipY = mouthY + FH;
  const tw = new THREE.Group(); for (let i = 0; i < 4; i++) { const t = hydrillaTwig(0.027 + i * 0.003, { seed: i + 1 }); t.position.set(Math.cos(i * 1.7) * 0.008, bot + 0.002, Math.sin(i * 1.7) * 0.008); t.rotation.set(0, i * 1.3, (i - 1.5) * 0.06); tw.add(t); } b.g.add(tw); b.twigs = tw;
  // cut ends (where the bubbles come from) are at the top of each twig
  tw.updateMatrixWorld(true); b.cutEnds = tw.children.map((t) => t.top.clone().applyMatrix4(t.matrix));
  const fn = glassFunnel(); fn.noGrab = true; K.add(fn, x, z, { y: BENCH_Y }); fn.g.rotation.set(Math.PI, 0, 0); fn.g.scale.setScalar(FS); fn.g.position.y = b.g.position.y + tipY; fn.g.visible = !!o.funnelOn; b.funnel = fn; fn.g.traverse((m) => { if (m.isMesh) m.renderOrder = 3; if (m.isMesh && m.material && m.material.transparent && m.material.opacity < 0.2) { m.material = m.material.clone(); m.material.opacity = 0.3; } }); // drawn before the water (renderOrder 4), so it shows through it b.mouthY = mouthY; b.coneTop = mouthY + 0.042 * FS;
  // the test tube, upside down: its mouth 2 cm below the tip of the funnel's stem, its closed end standing out of the water
  const tb = testTube(); tb.name = N('Test tube full of water, upside down', 'पानी से भरी, उलटी रखी टेस्ट ट्यूब', 'Paani se bhari, ulti rakhi test tube'); K.add(tb, x, z, { y: BENCH_Y }); tb.g.rotation.set(Math.PI, 0, 0); tb.noGrab = true; b.tube = tb; tb.g.visible = !!o.tubeOn;
  const placeTube = () => { tb.g.position.set(x, b.g.position.y + tipY - 0.02 + 0.15, z); }; placeTube(); b.placeTube = placeTube;
  // the water inside the upturned tube (drawn here: the tube's own liquid would settle at its closed end) and the gas at its top
  const wcol = new THREE.Mesh(new THREE.CylinderGeometry(0.0078, 0.0078, 1, 20), new THREE.MeshStandardMaterial({ color: 0xbfd8e8, transparent: true, opacity: 0.32, roughness: 0.05, depthWrite: false })); wcol.renderOrder = 5; wcol.userData.noHit = true; tb.g.add(wcol);
  // the line where water meets the gas (a thin bright meniscus), so the gas collected can be seen and measured
  const men = new THREE.Mesh(new THREE.CylinderGeometry(0.0079, 0.0079, 0.0012, 20), new THREE.MeshStandardMaterial({ color: 0xf2f8ff, transparent: true, opacity: 0.75, roughness: 0.1, depthWrite: false })); men.renderOrder = 6; men.userData.noHit = true; tb.g.add(men);
  // tube local y runs from the closed end (0) to the mouth (0.15): upside down the gas sits at the closed end, held upright it rises to the mouth
  b.up = false; b.gas = 0; b.setGas = (ml) => { b.gas = ml; const gasH = Math.min(0.13, ml * 0.0045); const lo = b.up ? 0.004 : 0.002 + gasH, hi = b.up ? 0.148 - gasH : 0.146;
    wcol.scale.y = Math.max(0.001, hi - lo); wcol.position.y = (lo + hi) / 2; men.position.y = b.up ? hi : lo; men.visible = gasH > 0.0015; };
  b.setUpright = (up) => { b.up = up; b.setGas(b.gas); };
  b.setGas(0);
  // bubbles: little spheres that leave a cut end, rise into the funnel, up its stem and into the tube
  const bub = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 8, 6), new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.55, roughness: 0.05, metalness: 0.1 }), 60); bub.count = 0; bub.renderOrder = 3; bub.userData.noHit = true; b.g.add(bub);
  const live = []; const m4 = new THREE.Matrix4(); b.rate = 0; let acc = 0; b.counted = 0; b.counting = false;
  b.bubbleTick = (dt, lapse = 1) => {
    acc += dt * lapse * b.rate / 60; while (acc >= 1) { acc -= 1; const e = b.cutEnds[Math.floor(Math.random() * b.cutEnds.length)]; live.push({ p: e.clone().add(V((Math.random() - 0.5) * 0.004, 0, (Math.random() - 0.5) * 0.004)), s: 0.0008 + Math.random() * 0.0006, ph: 0 }); if (b.counting) b.counted++; if (live.length > 58) { live.shift(); if (tb.g.visible && fn.g.visible) b.setGas(b.gas + BUBBLE_ML); } } // (in a fast time-lapse most bubbles are not drawn, but their gas still collects)
    const ty = b.g.worldToLocal(tb.g.position.clone()).y; // the closed end of the upturned tube
    let n = 0; for (let i = live.length - 1; i >= 0; i--) { const q = live[i]; q.p.y += dt * Math.min(3, lapse) * 0.06;
      if (fn.g.visible && q.p.y > b.mouthY + 0.004) { const k = clamp01((q.p.y - b.mouthY) / (b.coneTop - b.mouthY)); const rMax = Math.max(0.0012, 0.033 * (1 - k) + 0.0022 * k); const rr = Math.hypot(q.p.x, q.p.z); if (rr > rMax) { q.p.x *= rMax / rr; q.p.z *= rMax / rr; } } // the cone leads it to the stem
      const top = tb.g.visible && fn.g.visible ? ty - 0.004 - Math.min(0.13, b.gas * 0.0045) : b.heightFor(b.ml);
      if (q.p.y > top) { live.splice(i, 1); if (tb.g.visible && fn.g.visible) b.setGas(b.gas + BUBBLE_ML); continue; }
      m4.compose(q.p, new THREE.Quaternion(), V(q.s, q.s, q.s)); bub.setMatrixAt(n++, m4); }
    bub.count = n; bub.instanceMatrix.needsUpdate = true;
  };
  return b;
}
// a reading lamp with a bright bulb (drawn glow, no extra light): its distance from the beaker is set with a handle on a scale
export function deskLamp(o = {}) {
  const it = new Item('blamp', { name: N('Table lamp (100 W bulb)', 'टेबल लैंप (100 वाट का बल्ब)', 'Table lamp (100 W bulb)') });
  const dark = M(0x2a2f36, 0.4, 0.5); const base = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.045, 0.012, 28), dark); base.position.y = 0.006; it.g.add(base);
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.16, 10), dark); arm.position.set(0, 0.085, 0); it.g.add(arm);
  const sh = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.045, 0.06, 28, 1, true), M(0x2e4f7a, 0.45, 0.2, { side: THREE.DoubleSide })); sh.rotation.z = Math.PI / 2; sh.position.set(0.03, 0.15, 0); it.g.add(sh);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.017, 18, 14), new THREE.MeshStandardMaterial({ color: 0xfff6e0, emissive: 0xffe6a8, emissiveIntensity: 0, roughness: 0.2 })); bulb.position.set(0.045, 0.15, 0); it.g.add(bulb);
  const glowT = canvasTex(128, 128, (x, W) => { const g = x.createRadialGradient(W / 2, W / 2, 2, W / 2, W / 2, W / 2); g.addColorStop(0, 'rgba(255,245,215,1)'); g.addColorStop(0.3, 'rgba(255,230,170,0.5)'); g.addColorStop(1, 'rgba(255,220,150,0)'); x.fillStyle = g; x.fillRect(0, 0, W, W); });
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowT, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false })); glow.scale.setScalar(0.07); glow.position.copy(bulb.position); glow.visible = false; glow.userData.noHit = true; it.g.add(glow);
  const coneT = canvasTex(64, 128, (x, W, H) => { const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, 'rgba(255,240,200,0.45)'); g.addColorStop(1, 'rgba(255,240,200,0)'); x.fillStyle = g; x.fillRect(0, 0, W, H); });
  const cone = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.3, 24, 1, true), new THREE.MeshBasicMaterial({ map: coneT, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, opacity: 0.35, toneMapped: false })); cone.rotation.z = Math.PI / 2; cone.position.set(0.2, 0.15, 0); cone.visible = false; cone.userData.noHit = true; it.g.add(cone);
  it.on = false; it.setOn = (on) => { it.on = on; bulb.material.emissiveIntensity = on ? 2.5 : 0; glow.visible = on; cone.visible = on; };
  it.bulbLocal = bulb.position.clone(); it.height = 0.18; it.radius = 0.05; it.grabY = 0.09; it.noPhys = true; return it;
}

// ------------------------------------------------------------------ a polythene bag tied over a shoot; it mists up and collects drops
export function polyBag(o = {}) {
  const it = new Item('bbag', { name: N('Polythene bag', 'पॉलीथीन की थैली', 'Polythene ki thaili') });
  const R = o.r ?? 0.07, H = o.h ?? 0.16, r = rnd(o.seed ?? 3); const prof = []; for (let i = 0; i <= 14; i++) { const t = i / 14; const rr = t < 0.12 ? lerp(0.006, R * 0.7, t / 0.12) : t > 0.82 ? R * Math.sqrt(Math.max(0, 1 - Math.pow((t - 0.82) / 0.18, 2))) * 0.98 + 0.001 : R * (0.7 + 0.3 * Math.sin((t - 0.12) / 0.7 * Math.PI / 2)); prof.push(new THREE.Vector2(Math.max(0.001, rr), t * H)); }
  const geo = new THREE.LatheGeometry(prof, 28); const p = geo.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i); const n = noise3(x * 60, y * 40, z * 60) - 0.5; const d = Math.hypot(x, z); if (d > 0.002) { const f = 1 + n * 0.22; p.setX(i, x * f); p.setZ(i, z * f); } p.setY(i, y + n * 0.006); } geo.computeVertexNormals();
  const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.16, roughness: 0.18, metalness: 0, side: THREE.DoubleSide, depthWrite: false }); const bag = new THREE.Mesh(geo, mat); bag.renderOrder = 8; it.g.add(bag);
  const tie = new THREE.Mesh(new THREE.TorusGeometry(0.0065, 0.0012, 6, 16), M(0xd9d2c0, 0.8)); tie.rotation.x = Math.PI / 2; tie.position.y = 0.004; it.g.add(tie);
  // droplets on the inside: they grow as water vapour condenses on the bag
  const nD = 260, dropM = new THREE.MeshStandardMaterial({ color: 0xf4f9ff, transparent: true, opacity: 0.72, roughness: 0.03, metalness: 0.0 }); const drops = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), dropM, nD); drops.renderOrder = 7; drops.userData.noHit = true; it.g.add(drops);
  const D = []; for (let i = 0; i < nD; i++) { const t = 0.18 + r() * 0.7, a = r() * TAU; const rr = prof[Math.round(t * 14)].x * 0.96; D.push({ p: V(Math.cos(a) * rr, t * H, Math.sin(a) * rr), s: (0.0009 + r() * 0.0018) * (t < 0.4 ? 1.35 : 1), t: r() }); } // lower down the drops have run together and are bigger
  const pool = new THREE.Mesh(new THREE.SphereGeometry(0.012, 16, 8, 0, TAU, Math.PI / 2, Math.PI / 2), dropM); pool.position.y = 0.014; pool.scale.set(1, 0.35, 1); pool.visible = false; it.g.add(pool);
  it.k = -1; it.setMist = (k) => { if (Math.abs(k - it.k) < 0.004) return; it.k = k; mat.opacity = 0.16 + 0.32 * smooth(0, 0.6, k); mat.color.setRGB(1, 1, 1); mat.roughness = 0.18 + 0.5 * smooth(0, 0.6, k);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(); let n = 0; for (const d of D) { const s = d.s * smooth(d.t * 0.6, d.t * 0.6 + 0.4, k); if (s < 0.0002) continue; m4.compose(d.p, q, V(s, s * 1.15, s * 0.5)); drops.setMatrixAt(n++, m4); } drops.count = n; drops.instanceMatrix.needsUpdate = true; pool.visible = k > 0.7; pool.scale.set(clamp01((k - 0.7) * 3), 0.35 * clamp01((k - 0.7) * 3), clamp01((k - 0.7) * 3)); };
  it.setMist(0); it.height = H; it.radius = R; it.grabY = H * 0.5; it.noPhys = true; return it;
}

// ------------------------------------------------------------------ the twig in red ink, and a thin slice of its stem
// the leaves' veins turn red as the ink climbs (the pale midrib and veins of the photo are tinted in the shader)
export function inkLeafMat(base) {
  const m = base.clone(); const ink = { value: 0 }; m.userData.ink = ink; m.userData.depth = base.userData.depth;
  m.onBeforeCompile = (s) => { s.uniforms.uInk = ink; s.fragmentShader = 'uniform float uInk;\n' + s.fragmentShader.replace('#include <map_fragment>', `#include <map_fragment>
    float lmI = dot(diffuseColor.rgb, vec3(0.3, 0.59, 0.11)); float veinI = smoothstep(0.34, 0.55, lmI) * smoothstep(0.25, 0.05, diffuseColor.g - diffuseColor.b - 0.15);
    diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.78, 0.16, 0.24) * (0.65 + 0.5 * lmI), clamp(uInk * veinI * 1.1, 0.0, 0.9));`); };
  m.customProgramCacheKey = () => 'bio2ink'; return m;
}
// the cut stem seen through a lens: skin, cortex, a ring of vascular bundles (xylem red with ink), and pith
export function sectionTexture(inked) {
  return canvasTex(512, 512, (x, W) => { const c = W / 2, R = W * 0.47, r = rnd(31); x.fillStyle = '#0d1014'; x.fillRect(0, 0, W, W);
    const cells = (r0, r1, n, sz, col) => { for (let i = 0; i < n; i++) { const a = r() * TAU, d = r0 + Math.sqrt(r()) * (r1 - r0); x.strokeStyle = col; x.lineWidth = 1; x.beginPath(); x.ellipse(c + Math.cos(a) * d, c + Math.sin(a) * d, sz * (0.7 + r() * 0.6), sz * (0.6 + r() * 0.5), r() * 3, 0, TAU); x.stroke(); } };
    let g = x.createRadialGradient(c, c, 0, c, c, R); g.addColorStop(0, '#f1ecd6'); g.addColorStop(0.58, '#ebe5c8'); g.addColorStop(0.7, '#cfdba8'); g.addColorStop(0.93, '#a9c47a'); g.addColorStop(0.985, '#5f8a35'); g.addColorStop(1, '#3e6424'); x.fillStyle = g; x.beginPath(); x.arc(c, c, R, 0, TAU); x.fill();
    cells(0, R * 0.55, 380, 9, 'rgba(160,150,110,0.35)'); cells(R * 0.72, R * 0.95, 520, 5, 'rgba(70,100,40,0.35)');
    const nb = 14; for (let i = 0; i < nb; i++) { const a = i / nb * TAU + r() * 0.1; const d = R * 0.63; const bx = c + Math.cos(a) * d, by = c + Math.sin(a) * d; x.save(); x.translate(bx, by); x.rotate(a);
      x.fillStyle = '#c9cf9a'; x.beginPath(); x.ellipse(R * 0.05, 0, R * 0.05, R * 0.045, 0, 0, TAU); x.fill(); // phloem (outer side)
      x.fillStyle = inked ? '#b51830' : '#d8d3a4'; x.beginPath(); x.ellipse(-R * 0.02, 0, R * 0.055, R * 0.05, 0, 0, TAU); x.fill(); // xylem
      x.fillStyle = inked ? 'rgba(90,0,15,0.55)' : 'rgba(150,140,90,0.5)'; for (let k = 0; k < 6; k++) { x.beginPath(); x.arc(-R * 0.03 + (r() - 0.5) * R * 0.05, (r() - 0.5) * R * 0.06, R * 0.009, 0, TAU); x.fill(); } x.restore(); }
    x.strokeStyle = inked ? 'rgba(170,30,50,0.35)' : 'rgba(170,170,120,0.3)'; x.lineWidth = 3; x.beginPath(); x.arc(c, c, R * 0.63, 0, TAU); x.stroke(); });
}

// ------------------------------------------------------------------ bean seedlings on a wire mesh over a flask: shoots grow towards light, roots grow down
export function seedlingFlask(K, x, z, o = {}) {
  const f = K.flask(x, z, 'water', 92); f.name = N('Conical flask of water with bean seedlings on a wire mesh', 'तार की जाली पर अंकुरित सेम के बीजों वाला पानी का कोनिकल फ़्लास्क', 'Taar ki jaali par ankurit sem ke beejon wala paani ka conical flask');
  const meshT = canvasTex(128, 128, (c, W) => { c.clearRect(0, 0, W, W); c.strokeStyle = '#9aa0a6'; c.lineWidth = 2; for (let i = 0; i < W; i += 10) { c.beginPath(); c.moveTo(i, 0); c.lineTo(i, W); c.stroke(); c.beginPath(); c.moveTo(0, i); c.lineTo(W, i); c.stroke(); } });
  const net = new THREE.Mesh(new THREE.CircleGeometry(0.02, 24).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: meshT, transparent: true, alphaTest: 0.3, metalness: 0.6, roughness: 0.4, side: THREE.DoubleSide })); net.position.y = f.rimY + 0.001; f.g.add(net);
  const seeds = []; const r = rnd(o.seed ?? 8); const leafM = leafMat(btex('leaf_ovate'), 'ovate');
  for (let i = 0; i < 3; i++) { const g = new THREE.Group(); g.position.set((i - 1) * 0.008, f.rimY + 0.003, (r() - 0.5) * 0.006); f.g.add(g);
    const sd = { g, shoot: [V(0, 0, 0), V(0, 0.004, 0)], root: [V(0, 0, 0), V(0, -0.004, 0)], dirS: V((r() - 0.5) * 0.2, 1, (r() - 0.5) * 0.2).normalize(), dirR: V((r() - 0.5) * 0.2, -1, (r() - 0.5) * 0.2).normalize(), sm: null, rm: null, top: new THREE.Group(), k: 0.85 + r() * 0.3 };
    // the swollen seed (two cotyledons) carried on top of the shoot, and the first pair of leaves
    const cot = new THREE.Mesh(new THREE.SphereGeometry(0.005, 14, 10), M(0xd9cf8e, 0.55)); cot.scale.set(1.3, 0.75, 1); sd.top.add(cot); sd.cot = cot;
    sd.leaves = []; for (const sdx of [-1, 1]) { const lp = new THREE.Group(); lp.rotation.set(0, sdx > 0 ? 0 : Math.PI, 0); const lm = new THREE.Mesh(leafGeo({ x: 0, y: 0, w: 1, h: 1, fw: 0.9375, fh: 0.852, aspect: 0.62, m: 4 / 512 }, 0.02, { fold: 0.2, arch: 0.2 }), leafM); lm.rotation.x = -Math.PI / 2 + 0.5; lm.customDepthMaterial = leafM.userData.depth; lp.add(lm); lp.scale.setScalar(0.3); sd.top.add(lp); sd.leaves.push(lp); }
    g.add(sd.top); seeds.push(sd); }
  const shootM = M(0xb9cf7a, 0.6), rootM = M(0xf2ecd8, 0.6);
  f.seedlings = seeds; f.light = null; // the light direction in the room (null: no single direction)
  const rebuild = (sd) => { if (sd.sm) { sd.g.remove(sd.sm); sd.sm.geometry.dispose(); } if (sd.rm) { sd.g.remove(sd.rm); sd.rm.geometry.dispose(); }
    if (sd.shoot.length > 1) { sd.sm = new THREE.Mesh(taperTube(new THREE.CatmullRomCurve3(sd.shoot), 0.0014, 0.0011, Math.max(4, sd.shoot.length * 2), 6), shootM); sd.sm.castShadow = true; sd.g.add(sd.sm); }
    if (sd.root.length > 1) { sd.rm = new THREE.Mesh(taperTube(new THREE.CatmullRomCurve3(sd.root), 0.0011, 0.0004, Math.max(4, sd.root.length * 2), 6), rootM); sd.g.add(sd.rm); }
    const tip = sd.shoot[sd.shoot.length - 1]; sd.top.position.copy(tip); const d = sd.dirS.clone(); sd.top.quaternion.setFromUnitVectors(V(0, 1, 0), d); const L = sd.len || 0; for (const lp of sd.leaves) lp.scale.setScalar(clamp01(0.3 + L * 12)); };
  seeds.forEach(rebuild);
  // grow for h hours: new growth near the tip turns towards the light (or upwards in the dark); roots go down
  f.grow = (h) => { const q = f.g.getWorldQuaternion(new THREE.Quaternion()).invert(); const up = V(0, 1, 0).applyQuaternion(q); const Ld = f.light ? f.light.clone().applyQuaternion(q).normalize() : null;
    for (const sd of seeds) { let left = h; while (left > 0) { const dh = Math.min(2, left); left -= dh; const gs = 0.0016 * dh * sd.k; sd.len = (sd.len || 0) + gs;
        const want = Ld ? Ld.clone().multiplyScalar(0.9).add(up.clone().multiplyScalar(0.25)).normalize() : up.clone(); sd.dirS.lerp(want, Math.min(1, 0.09 * dh)).normalize();
        const t = sd.shoot[sd.shoot.length - 1]; const last = sd.shoot.length > 1 ? sd.shoot[sd.shoot.length - 2] : null; if (last && t.distanceTo(last) < 0.004) t.add(sd.dirS.clone().multiplyScalar(gs)); else sd.shoot.push(t.clone().add(sd.dirS.clone().multiplyScalar(gs)));
        const down = up.clone().negate(); sd.dirR.lerp(down, Math.min(1, 0.08 * dh)).normalize(); const rt = sd.root[sd.root.length - 1]; const rl = sd.root.length > 1 ? sd.root[sd.root.length - 2] : null; const gr = 0.0014 * dh * sd.k;
        if (rl && rt.distanceTo(rl) < 0.004) rt.add(sd.dirR.clone().multiplyScalar(gr)); else sd.root.push(rt.clone().add(sd.dirR.clone().multiplyScalar(gr))); }
      rebuild(sd); } };
  // how much the shoots lean towards a direction (−1 … 1), and how far down the roots point
  f.bend = (dirW) => { const q = f.g.getWorldQuaternion(new THREE.Quaternion()); let s = 0; for (const sd of seeds) { const d = sd.dirS.clone().applyQuaternion(q); s += d.dot(dirW); } return s / seeds.length; };
  f.rootDown = () => { const q = f.g.getWorldQuaternion(new THREE.Quaternion()); let s = 0; for (const sd of seeds) s += -sd.dirR.clone().applyQuaternion(q).y; return s / seeds.length; };
  return f;
}

// ------------------------------------------------------------------ a bent glass tube from a cork into a beaker of coloured water; the water climbs it as gas is used up
export function bentTube(K, from, to, o = {}) {
  const a = from.mouthWorld(new THREE.Vector3()); const end = to.g.localToWorld(V(0.0, to.inner[0].y + 0.02, 0)); const hy = Math.max(a.y, to.mouthWorld(new THREE.Vector3()).y) + 0.05;
  const pts = [a.clone().add(V(0, -0.012, 0)), a.clone().add(V(0, 0.03, 0)), V(a.x, hy - 0.012, a.z), V(a.x + (end.x - a.x) * 0.12, hy, a.z + (end.z - a.z) * 0.12), V(end.x - (end.x - a.x) * 0.12, hy, end.z - (end.z - a.z) * 0.12), V(end.x, hy - 0.012, end.z), end.clone()];
  const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.05); const glass = new THREE.Mesh(new THREE.TubeGeometry(curve, 80, 0.0028, 8), glassMat({ opacity: 0.22 })); glass.renderOrder = 7; K.app.scene.add(glass); K.extras.push(glass);
  const cork = new THREE.Mesh(new THREE.CylinderGeometry(from.rimR * 1.08, from.rimR * 0.86, 0.016, 16), M(0xb08850, 0.9)); cork.position.y = from.rimY - 0.004; from.g.add(cork);
  // the water column: from the beaker's water level up the last (vertical) limb of the tube
  const col = new THREE.Mesh(new THREE.CylinderGeometry(0.0019, 0.0019, 1, 10), new THREE.MeshStandardMaterial({ color: o.color ?? 0xc8384a, roughness: 0.3, transparent: true, opacity: 0.85 })); col.renderOrder = 6; K.app.scene.add(col); K.extras.push(col);
  const mark = new THREE.Mesh(new THREE.TorusGeometry(0.0036, 0.0007, 6, 16), M(0x1a1a1a, 0.6)); mark.rotation.x = Math.PI / 2; mark.visible = false; K.app.scene.add(mark); K.extras.push(mark);
  const T = { glass, cork, col, mark, rise: 0, x: end.x, z: end.z, top: hy - 0.012 };
  T.set = (rise) => { T.rise = rise; const base = to.levelWorld(); const y1 = Math.min(T.top, base + rise); col.scale.y = Math.max(0.0005, y1 - base); col.position.set(T.x, base + (y1 - base) / 2, T.z); col.visible = rise > 0.0005 || true; };
  T.markAt = () => { mark.position.set(T.x, to.levelWorld() + T.rise, T.z); mark.visible = true; T.mark0 = T.rise; };
  T.set(0.002); return T;
}
// a razor blade (for cutting a thin slice)
export function blade() { const it = new Item('bblade', { name: N('Razor blade', 'ब्लेड', 'Blade') }); const st = M(0xd2d6db, 0.18, 0.95); const b = new THREE.Mesh(new THREE.BoxGeometry(0.043, 0.0004, 0.022), st); b.position.y = 0.0004; it.g.add(b); const slot = new THREE.Mesh(new THREE.BoxGeometry(0.026, 0.0006, 0.003), M(0x22262b, 0.6)); slot.position.y = 0.0006; it.g.add(slot); b.castShadow = true; it.height = 0.002; it.radius = 0.025; it.grabY = 0.001; it.noPhys = true; return it; }
// a half-metre wooden scale lying on the bench, centimetres marked from its left end
export function benchScale(L = 0.5) {
  const it = new Item('bscale', { name: N('Metre scale', 'मीटर स्केल', 'Meter scale') });
  const tex = canvasTex(2048, 96, (x, W, H) => { x.fillStyle = '#e9dcb4'; x.fillRect(0, 0, W, H); x.fillStyle = '#1e1e1e'; const n = Math.round(L * 1000); x.font = '700 30px sans-serif'; x.textAlign = 'center';
    for (let mm = 0; mm <= n; mm++) { const px = 10 + (W - 20) * mm / n; const h = mm % 10 === 0 ? 34 : mm % 5 === 0 ? 24 : 12; x.fillRect(px - 1, 0, 2, h); if (mm % 50 === 0) x.fillText(String(mm / 10), px, 72); } });
  const m = new THREE.Mesh(new THREE.BoxGeometry(L, 0.003, 0.03), [M(0xd8c89a, 0.7), M(0xd8c89a, 0.7), M(0xffffff, 0.6, 0, { map: tex }), M(0xd8c89a, 0.7), M(0xd8c89a, 0.7), M(0xd8c89a, 0.7)]); m.position.set(L / 2, 0.0015, 0); m.receiveShadow = true; it.g.add(m);
  it.height = 0.003; it.radius = L / 2; it.noGrab = true; it.noPhys = true; return it;
}
export { noise3 };
