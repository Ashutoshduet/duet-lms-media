// DUET Science Lab 360, biology at the bench, batch BIO2: the living things and the special apparatus.
// Real leaves, flowers and a clay pot (Poly Haven "periwinkle_plant" = sadabahar, and "planter_pot_clay", both CC0; a leaf
// scanned by ambientCG, CC0) put together here into potted plants that grow, wilt, go pale in the dark, bend to the light and
// make starch where light, carbon dioxide and chlorophyll all reach the leaf. The test leaf keeps a map of its own starch,
// pixel by pixel, so iodine shows exactly what the student's plant did. Also: sunlight on the bench, a dark box, a clock
// for time-lapse, water baths that hold their temperature, and the extra chemistry of food tests (starch–iodine,
// saliva, biuret, potassium hydroxide) added to the shared chemistry engine without changing it.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { Item, Vessel } from './apparatus.js';
import { glassMat, canvasTex, cardTex, photoTex } from './mats.js';
import { SUBS, RULES } from './chem.js';
import { BENCH_Y } from './room.js';
import { liveSign } from './mathworld4.js';
import { handle } from './mathworld.js';
import { dress } from './models.js';
import { LITE } from './lite.js';

export const V = (x, y, z) => new THREE.Vector3(x, y, z);
export const N = (en, hi, hg) => ({ en, hi, hg: hg || en });
export const clamp01 = (x) => Math.max(0, Math.min(1, x));
export const lerp = (a, b, k) => a + (b - a) * k;
export const smooth = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
export const ease = (k) => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);
export function rnd(seed) { let s = seed >>> 0 || 1; return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
export const noHit = (o) => { o.traverse((m) => { if (m.isMesh) m.userData.noHit = true; }); return o; };
const M = (c, r = 0.6, m = 0, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m, ...o });

// ------------------------------------------------------------------ textures and models of this batch (science/bio2, models/bio2)
const TL = new THREE.TextureLoader(); const TX = {};
export function btex(name, o = {}) {
  const k = name + (o.rep ? o.rep.join('x') : '');
  if (!TX[k]) { const t = TL.load('bio2/' + name + '.webp'); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; if (o.rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...o.rep); } TX[k] = t; }
  return TX[k];
}
const IMG = {};
export function bimg(name) { return IMG[name] || (IMG[name] = new Promise((res) => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = 'bio2/' + name + '.webp'; })); }
let GL = null; const GLB = {};
export function bglb(name) {
  if (!GLB[name]) { GL ||= new GLTFLoader().setMeshoptDecoder(MeshoptDecoder); GLB[name] = GL.loadAsync('models/bio2/' + name + '.glb').then((g) => { g.scene.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; o.userData.noHit = false; } }); return g.scene; }); }
  return GLB[name];
}

// the pieces of the sadabahar atlas (cut by devtools from the Poly Haven colour map; petiole down, u across, v up)
const CELLS = { g1: { x: 0, y: 0, w: 0.125, h: 0.25, fw: 0.898, fh: 0.953, aspect: 0.475 }, g2: { x: 0.125, y: 0, w: 0.125, h: 0.25, fw: 0.906, fh: 0.926, aspect: 0.489 },
  g3: { x: 0.25, y: 0, w: 0.125, h: 0.25, fw: 0.906, fh: 0.922, aspect: 0.49 }, g4: { x: 0.375, y: 0, w: 0.125, h: 0.25, fw: 0.906, fh: 0.949, aspect: 0.476 },
  g5: { x: 0.5, y: 0, w: 0.125, h: 0.25, fw: 0.852, fh: 0.953, aspect: 0.448 }, g6: { x: 0.625, y: 0, w: 0.125, h: 0.25, fw: 0.906, fh: 0.906, aspect: 0.5 },
  y1: { x: 0.75, y: 0, w: 0.125, h: 0.25, fw: 0.891, fh: 0.953, aspect: 0.467 }, y2: { x: 0.875, y: 0, w: 0.125, h: 0.25, fw: 0.906, fh: 0.875, aspect: 0.518 },
  y3: { x: 0.75, y: 0.25, w: 0.125, h: 0.25, fw: 0.906, fh: 0.922, aspect: 0.49 }, young: { x: 0.875, y: 0.25, w: 0.125, h: 0.25, fw: 0.906, fh: 0.75, aspect: 0.6 },
  flower: { x: 0, y: 0.5, w: 0.25, h: 0.25, fw: 0.961, fh: 0.984 }, flower2: { x: 0.25, y: 0.5, w: 0.25, h: 0.25, fw: 0.961, fh: 0.984 } };
const MARGIN = 6 / 1024;
// a single leaf texture on its own (the test leaf, the ovate leaf): the leaf fills fw × fh of the image, bottom margin m
const SOLO = { test: { x: 0, y: 0, w: 1, h: 1, fw: 0.934, fh: 0.984, aspect: 0.475, m: 4 / 512 }, ovate: { x: 0, y: 0, w: 1, h: 1, fw: 0.9375, fh: 0.852, aspect: 0.55, m: 4 / 512 } };

// ------------------------------------------------------------------ chemistry of food and of living things (added to the shared engine)
// starch (boiled rice water / 1 % starch), iodine solution (iodine in potassium iodide), the blue-black starch–iodine complex,
// saliva (with the enzyme amylase), saliva that was boiled (the enzyme destroyed), maltose (sugar made from starch), gram flour
// (besan) in water (protein), the violet biuret complex and potassium hydroxide (takes up carbon dioxide)
Object.assign(SUBS, {
  starch: { f: 'Starch', n: N('Starch solution', 'स्टार्च का घोल', 'Starch ka ghol'), c: '#eef1f3', a: 0.24, pH: 7, cloud: 0.16, cloudC: '#f3f5f6' },
  iodine: { f: 'I₂ + KI', n: N('Iodine solution', 'आयोडीन का घोल', 'Iodine solution'), c: '#a35f16', a: 0.6, pH: 6.5, dye: 60 },
  sic: { f: 'Starch–iodine', n: N('Blue-black starch–iodine', 'नीला-काला (स्टार्च और आयोडीन)', 'Neela-kaala (starch aur iodine)'), c: '#0d1236', a: 0.94, pH: 7, dye: 300 },
  saliva: { f: 'Saliva', n: N('Saliva (diluted)', 'लार (पतली की हुई)', 'Laar (patli ki hui)'), c: '#eef0ea', a: 0.24, pH: 6.8, cloud: 0.14, cloudC: '#f2f3ee' },
  salivab: { f: 'Boiled saliva', n: N('Boiled saliva', 'उबाली हुई लार', 'Ubaali hui laar'), c: '#eef0ea', a: 0.24, pH: 6.8, cloud: 0.18, cloudC: '#f2f3ee' },
  maltose: { f: 'Maltose', n: N('Sugar (maltose) made from starch', 'स्टार्च से बनी शक्कर (माल्टोज़)', 'Starch se bani shakkar (maltose)'), c: '#f0f4f6', a: 0.17, pH: 7 },
  besan: { f: 'Gram flour + water', n: N('Gram flour (besan) in water', 'पानी में बेसन', 'Paani mein besan'), c: '#efe2b6', a: 0.5, pH: 6.6, cloud: 0.4, cloudC: '#efe6c4' },
  biuret: { f: 'Protein + Cu²⁺', n: N('Violet colour (protein)', 'बैंगनी रंग (प्रोटीन)', 'Baingani rang (protein)'), c: '#8e1f94', a: 0.88, pH: 12, dye: 240 },
  koh: { f: 'KOH', n: N('Potassium hydroxide solution', 'पोटैशियम हाइड्रॉक्साइड का घोल', 'Potassium hydroxide solution'), c: '#eef6ff', a: 0.18, h: -1, pH: 13.5 },
  chlor: { f: 'Chlorophyll in alcohol', n: N('Green alcohol (chlorophyll dissolved in it)', 'हरी अल्कोहल (इसमें क्लोरोफ़िल घुल गया)', 'Hari alcohol (isme chlorophyll ghul gaya)'), c: '#2f7a22', a: 0.8, pH: 7, dye: 45 },
  redink: { f: 'Red ink', n: N('Water with red ink (safranin)', 'लाल स्याही (सैफ्रानिन) वाला पानी', 'Laal syahi (safranin) wala paani'), c: '#b0182c', a: 0.8, pH: 7, dye: 40 },
});
export const PROTEIN = { milk: 0.6, milkfull: 1, skim: 1, besan: 0.9 }; // how much protein each sample brings to the biuret test (per mL, relative)
const has = (m, k, x = 0.005) => (m.liq[k] || 0) > x;
// the enzyme in saliva works best at body temperature, hardly at all in the cold, and is destroyed by heat
export const amylaseK = (T) => (T >= 62 ? 0 : T <= 37 ? Math.exp(-Math.pow((37 - T) / 13, 2)) : Math.max(0, 1 - Math.pow((T - 37) / 25, 2)));
RULES.push(
  // iodine meets starch: the blue-black complex forms at once
  { id: 'bio_starch_iodine', test: (v) => has(v.mix, 'iodine') && has(v.mix, 'starch'),
    run(v, dt) { const m = v.mix; const d = Math.min(m.liq.iodine, m.liq.starch * 0.5, dt * 3); m.liq.iodine -= d; m.liq.starch -= d; m.liq.sic = (m.liq.sic || 0) + d * 2; } },
  // amylase of saliva breaks starch (and the blue-black complex) into sugar; strong heat destroys it for ever
  { id: 'bio_amylase', test: (v) => has(v.mix, 'saliva') && (has(v.mix, 'starch') || has(v.mix, 'sic') || v.mix.temp > 62),
    run(v, dt, E) { const m = v.mix; if (m.temp > 62) { const d = Math.min(m.liq.saliva, dt * E.lapse * 0.2); m.liq.saliva -= d; m.liq.salivab = (m.liq.salivab || 0) + d; return; }
      const k = amylaseK(m.temp) * Math.min(1.5, m.liq.saliva) * 0.0042 * dt * E.lapse; if (k <= 0) return;
      const ds = Math.min(m.liq.starch || 0, k); if (ds > 0) { m.liq.starch -= ds; m.liq.maltose = (m.liq.maltose || 0) + ds; }
      const dc = Math.min(m.liq.sic || 0, k * 0.8); if (dc > 0) { m.liq.sic -= dc; m.liq.maltose = (m.liq.maltose || 0) + dc / 2; m.liq.iodine = (m.liq.iodine || 0) + dc / 2; } } },
  // biuret test: copper hydroxide in an alkaline liquid with protein turns into the violet complex
  { id: 'bio_biuret', test: (v) => (v.mix.ppt.cuoh2 || 0) > 0.002 && Object.keys(PROTEIN).some((k) => has(v.mix, k, 0.05)) && v.mix.pH() > 9,
    run(v, dt) { const m = v.mix; let P = 0; for (const k in PROTEIN) P += (m.liq[k] || 0) * PROTEIN[k]; const made = m.liq.biuret || 0; const room = Math.max(0, P * 0.03 - made);
      const d = Math.min(m.ppt.cuoh2, room, dt * 0.05); if (d <= 0) return; m.ppt.cuoh2 -= d; m.liq.biuret = made + d; m.cloud = Math.max(0, m.cloud - d * 4); } },
  // potassium hydroxide takes up carbon dioxide from the air above it
  { id: 'bio_koh_co2', test: (v) => has(v.mix, 'koh', 0.1) && ((v.gas && v.gas.CO2 > 0) || (v.gasIn && v.gasIn.CO2 > 0)),
    run(v) { if (v.gas) v.gas.CO2 = 0; if (v.gasIn) v.gasIn.CO2 = 0; } },
);

// ------------------------------------------------------------------ leaf geometry: a real leaf photo on a gently curved surface
// cell: a piece of an atlas (CELLS / SOLO); len: real length (m). o.fold: V along the midrib; o.arch: tip bends back; o.roll: radius
// to roll the leaf into a tube (0 = flat); o.flip: mirror the photo (variety between leaves)
export function leafGeo(cell, len, o = {}) {
  const nx = o.nx ?? 4, ny = o.ny ?? 8, wid = len * cell.aspect; const g = new THREE.BufferGeometry();
  const pos = new Float32Array((nx + 1) * (ny + 1) * 3), uv = new Float32Array((nx + 1) * (ny + 1) * 2), idx = [];
  const m = cell.m ?? MARGIN, vb = 1 - (cell.y + cell.h) + m;
  for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) {
    const a = j * (nx + 1) + i, xn = i / nx - 0.5, yn = j / ny;
    uv[a * 2] = cell.x + cell.w * (0.5 + (o.flip ? -xn : xn) * cell.fw); uv[a * 2 + 1] = vb + yn * cell.h * cell.fh;
  }
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const a = j * (nx + 1) + i, b = a + 1, c = a + nx + 1, d = c + 1; idx.push(a, b, c, b, d, c); }
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setIndex(idx);
  g.userData = { nx, ny, wid, len };
  shapeLeaf(g, o); return g;
}
export function shapeLeaf(g, o = {}) {
  const { nx, ny, wid, len } = g.userData; const p = g.attributes.position.array; const fold = o.fold ?? 0.14, arch = o.arch ?? 0.12, R = o.roll || 0, droop = o.droop || 0, curl = o.curl || 0;
  for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) {
    const a = (j * (nx + 1) + i) * 3, xn = i / nx - 0.5, yn = j / ny;
    let x = xn * wid, y = yn * len, z = fold * Math.abs(xn) * wid + curl * xn * xn * wid * 2.2 - arch * yn * yn * len;
    if (droop) { const ang = droop * yn * 1.4; const y2 = y * Math.cos(ang) - z * Math.sin(ang); z = y * Math.sin(ang) * -1 + z * Math.cos(ang); y = y2; } // the leaf blade hangs down along its length
    if (R > 0) { const th = x / R; x = R * Math.sin(th); z = R * (1 - Math.cos(th)) + z * 0.2; }
    p[a] = x; p[a + 1] = y; p[a + 2] = z;
  }
  g.attributes.position.needsUpdate = true; g.computeVertexNormals(); g.computeBoundingSphere(); g.computeBoundingBox();
}
// leaf material: alpha cut-out, both sides; shadows keep the leaf's outline
const MATS = {};
export function leafMat(map, key) {
  if (key && MATS[key]) return MATS[key];
  const m = new THREE.MeshStandardMaterial({ map, alphaTest: 0.45, side: THREE.DoubleSide, roughness: 0.62, metalness: 0 });
  m.userData.depth = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map, alphaTest: 0.45 });
  if (key) MATS[key] = m; return m;
}
function leafMesh(geo, mat) { const m = new THREE.Mesh(geo, mat); m.castShadow = !LITE; m.receiveShadow = true; if (mat.userData.depth) m.customDepthMaterial = mat.userData.depth; return m; }
const sbTex = () => btex('sadabahar');
// a plain green stem with fine lengthwise streaks (the sadabahar stem: green, reddish near the base)
let STEMT = null;
function stemTex() { return STEMT || (STEMT = canvasTex(64, 256, (x, w, h) => { const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#6f8a3c'); g.addColorStop(0.7, '#6a8238'); g.addColorStop(1, '#7a5a3a'); x.fillStyle = g; x.fillRect(0, 0, w, h);
  const r = rnd(7); for (let i = 0; i < 160; i++) { x.strokeStyle = `rgba(${r() < 0.5 ? '40,60,20' : '170,190,120'},${0.08 + r() * 0.12})`; x.lineWidth = 1 + r() * 2; const px = r() * w; x.beginPath(); x.moveTo(px, r() * h); x.lineTo(px + (r() - 0.5) * 2, r() * h); x.stroke(); } })); }
const stemMat = () => MATS.stem || (MATS.stem = M(0xffffff, 0.7, 0, { map: stemTex() }));

// ------------------------------------------------------------------ the clay pot with soil (a real scanned pot, CC0)
const SOILT = () => photoTex('tex/soil.jpg', { repeat: [1, 1] });
export function clayPot(h = 0.11) {
  const g = new THREE.Group(); const k = h / 0.222; const rim = 0.131 * k; // the scan is 22.2 cm high, 26.6 cm across
  bglb('clay_pot').then((s) => { const m = s.clone(true); m.scale.setScalar(k); g.add(m); }).catch(() => {});
  const soil = new THREE.Mesh(new THREE.CircleGeometry(rim * 0.9, 32).rotateX(-Math.PI / 2), M(0x6a5238, 0.97, 0, { map: SOILT() })); soil.position.y = h * 0.88; soil.receiveShadow = true; g.add(soil);
  g.userData = { h, rim, soilY: h * 0.88, soil }; return g;
}

// ------------------------------------------------------------------ the test leaf's skin: the photo, recoloured pixel by pixel
// starch (0…1 per pixel), chlorophyll left after alcohol (chl), boiled, iodine, a variegated (white) pattern, the black paper
export class LeafSkin {
  constructor(name, o = {}) {
    this.W = o.W ?? 256; this.H = o.H ?? 512; this.c = document.createElement('canvas'); this.c.width = this.W; this.c.height = this.H;
    this.tex = new THREE.CanvasTexture(this.c); this.tex.colorSpace = THREE.SRGBColorSpace; this.tex.anisotropy = 4;
    this.starch = new Float32Array(this.W * this.H).fill(o.starch ?? 1); this.vg = null; this.paper = null;
    this.st = { chl: 1, boiled: 0, iod: 0, wet: 0, dry: 0 }; this.ready = bimg(name).then((im) => { if (!im) return; const x = this.c.getContext('2d', { willReadFrequently: true }); x.drawImage(im, 0, 0, this.W, this.H); this.base = x.getImageData(0, 0, this.W, this.H); if (o.variegated) this.makeVariegation(o.seed ?? 3); this.draw(); });
  }
  // a cream-white margin and a few pale patches, as on a variegated croton or money plant: those cells have no chlorophyll
  makeVariegation(seed) {
    const { W, H } = this, a = this.base.data, inside = new Float32Array(W * H); for (let i = 0; i < W * H; i++) inside[i] = a[i * 4 + 3] > 100 ? 1e6 : 0;
    // distance to the edge (two-pass chamfer)
    const d = inside; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = y * W + x; if (!d[i]) continue; let v = d[i]; if (x > 0) v = Math.min(v, d[i - 1] + 1); if (y > 0) v = Math.min(v, d[i - W] + 1); if (x > 0 && y > 0) v = Math.min(v, d[i - W - 1] + 1.41); if (x < W - 1 && y > 0) v = Math.min(v, d[i - W + 1] + 1.41); d[i] = v; }
    for (let y = H - 1; y >= 0; y--) for (let x = W - 1; x >= 0; x--) { const i = y * W + x; if (!d[i]) continue; let v = d[i]; if (x < W - 1) v = Math.min(v, d[i + 1] + 1); if (y < H - 1) v = Math.min(v, d[i + W] + 1); if (x < W - 1 && y < H - 1) v = Math.min(v, d[i + W + 1] + 1.41); if (x > 0 && y < H - 1) v = Math.min(v, d[i + W - 1] + 1.41); d[i] = v; }
    const r = rnd(seed); const waves = Array.from({ length: 7 }, () => [r() * 6.28, 1 + Math.floor(r() * 5), 1 + Math.floor(r() * 7), 0.4 + r() * 0.6]);
    const blots = Array.from({ length: 4 }, () => [0.25 + r() * 0.5, 0.25 + r() * 0.55, 0.05 + r() * 0.07]);
    this.vg = new Float32Array(W * H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = y * W + x; if (!d[i]) continue; const u = x / W, v = y / H; let n = 0; for (const [p, fa, fb, s] of waves) n += Math.sin(p + fa * u * 6.28 + fb * v * 6.28) * s;
      const band = 14 + n * 6; let k = smooth(band + 3, band - 3, d[i]); for (const [bx, by, br] of blots) { const dd = Math.hypot((u - bx) * 1.0, (v - by) * 0.5); k = Math.max(k, smooth(br, br * 0.6, dd + n * 0.008)); }
      if (Math.abs(u - 0.5) < 0.012 && v > 0.04) k *= 0.6; this.vg[i] = k; }
  }
  // a black paper band across the leaf (y0…y1, from the base 0 to the tip 1), both sides
  setPaper(y0, y1) { this.paper = y0 == null ? null : [y0, y1]; }
  covered(u, v) { const P = this.paper; return !!P && v >= P[0] && v <= P[1]; }
  // hours of photosynthesis: rate(u, v) gives 0…1 for each point (light × carbon dioxide); chlorophyll is in the photo except
  // in the white patches; in the dark the leaf uses its starch up (respiration, and the starch moves to other parts)
  grow(hours, light, rate) {
    const { W, H } = this; const s = this.starch, vg = this.vg; const decay = Math.exp(-hours / 14);
    for (let y = 0; y < H; y++) { const v = 1 - y / H; for (let x = 0; x < W; x++) { const i = y * W + x; const u = x / W;
      let f = light * (this.covered(v * 0 + v, v) ? 0.02 : 1) * (rate ? rate(u, v) : 1) * (vg ? 1 - vg[i] : 1);
      const made = 1 - Math.exp(-hours * f / 2.2); s[i] = s[i] * decay + (1 - s[i] * decay) * made; } }
  }
  mean(sel) { const { W, H } = this; let a = 0, n = 0; const al = this.base ? this.base.data : null; for (let y = 0; y < H; y += 2) for (let x = 0; x < W; x += 2) { const i = y * W + x; if (al && al[i * 4 + 3] < 100) continue; if (sel && !sel(x / W, 1 - y / H, i)) continue; a += this.starch[i]; n++; } return n ? a / n : 0; }
  set(k, v) { this.st[k] = v; this.draw(); }
  draw() {
    if (!this.base) return; const { W, H } = this, b = this.base.data, st = this.st, s = this.starch, vg = this.vg;
    const out = this._out || (this._out = new ImageData(W, H)), o = out.data; const P = this.paper;
    for (let y = 0; y < H; y++) { const v = 1 - y / H; const under = P && v >= P[0] && v <= P[1] && st.paperOn; for (let x = 0; x < W; x++) {
      const i = y * W + x, a = i * 4; let r = b[a] / 255, g = b[a + 1] / 255, bl = b[a + 2] / 255; const lum = 0.3 * r + 0.59 * g + 0.11 * bl, L = Math.min(1.6, lum / 0.32);
      if (vg && vg[i] > 0) { const k = vg[i]; r = lerp(r, 0.93 * (0.75 + 0.3 * L), k); g = lerp(g, 0.91 * (0.75 + 0.3 * L), k); bl = lerp(bl, 0.72 * (0.75 + 0.3 * L), k); }
      if (st.dry > 0) { const k = st.dry; r = lerp(r, 0.55 * L, k); g = lerp(g, 0.42 * L, k); bl = lerp(bl, 0.2 * L, k); }
      if (st.boiled > 0) { r *= 1 - 0.12 * st.boiled; g *= 1 - 0.05 * st.boiled; bl *= 1 - 0.15 * st.boiled; }
      if (st.chl < 1) { const k = 1 - st.chl; r = lerp(r, 0.93 * (0.72 + 0.32 * L), k); g = lerp(g, 0.88 * (0.72 + 0.32 * L), k); bl = lerp(bl, 0.62 * (0.72 + 0.32 * L), k); }
      if (st.iod > 0) { const sk = smooth(0.12, 0.55, s[i]); const shade = 0.75 + 0.35 * L; const ir = lerp(0.74, 0.08, sk) * shade, ig = lerp(0.47, 0.08, sk) * shade, ib = lerp(0.14, 0.17, sk) * shade;
        const k = st.iod * (0.3 + 0.7 * (1 - st.chl)); r = lerp(r, ir, k); g = lerp(g, ig, k); bl = lerp(bl, ib, k); }
      if (under) { r = 0.05; g = 0.05; bl = 0.055; }
      o[a] = Math.min(255, r * 255); o[a + 1] = Math.min(255, g * 255); o[a + 2] = Math.min(255, bl * 255); o[a + 3] = b[a + 3]; } }
    this.c.getContext('2d').putImageData(out, 0, 0); this.tex.needsUpdate = true;
  }
}

// ------------------------------------------------------------------ a potted plant made of real leaves
// o: kind 'sb' (sadabahar) | 'ovate' (a variegated ornamental plant: o.skinVar); h: stem height; pairs: leaf pairs; flowers;
// white: white flowers; seed: the plant's own shape; test: which node carries the test leaf (it faces the student)
export function pottedPlant(o = {}) {
  const it = new Item('plant', { name: o.name || N('Potted plant (sadabahar)', 'गमले में लगा सदाबहार का पौधा', 'Gamle mein laga sadabahar ka paudha') });
  const r = rnd(o.seed ?? 5); let soilY = 0; if (!o.noPot) { const pot = clayPot(o.potH ?? 0.1); it.g.add(pot); it.pot = pot; soilY = pot.userData.soilY; }
  const kind = o.kind || 'sb'; const tex = kind === 'sb' ? sbTex() : o.skinVar ? o.skinVar.tex : btex('leaf_ovate');
  const mat = kind === 'sb' ? leafMat(tex, 'sb') : leafMat(tex, o.skinVar ? null : 'ovate');
  const cellsG = ['g1', 'g2', 'g3', 'g4', 'g5', 'g6'], cellsY = ['y1', 'y2', 'y3'];
  const root = new THREE.Group(); root.position.y = soilY; it.g.add(root); it.root = root;
  const H = o.h ?? 0.2, nP = o.pairs ?? 6; it.leaves = []; it.nodes = [];
  // the main stem: nodes up a gentle curve; internodes shorten towards the top
  const lean = V((r() - 0.5) * 0.02, 0, (r() - 0.5) * 0.02);
  const nodeAt = (k) => V(lean.x * k * k + Math.sin(k * 3 + 1) * 0.003, H * k, lean.z * k * k + Math.cos(k * 2.3) * 0.003);
  const k0 = o.k0 ?? 0.12; const nodeK = Array.from({ length: nP }, (_, i) => k0 + (0.8 - k0) * Math.pow(i / Math.max(1, nP - 1), 0.85));
  const stemPts = [V(0, -0.005, 0)]; for (let i = 0; i <= 10; i++) stemPts.push(nodeAt(i / 10));
  it.stemCurve = new THREE.CatmullRomCurve3(stemPts);
  const stem = new THREE.Mesh(taperTube(it.stemCurve, 0.0036, 0.0016, 24), stemMat()); stem.castShadow = true; root.add(stem); it.stem = stem;
  const makeLeaf = (node, ang, len, cell, o2 = {}) => {
    const pivot = new THREE.Group(); pivot.position.copy(node); pivot.rotation.order = 'YXZ'; pivot.rotation.y = ang; root.add(pivot);
    const tilt = new THREE.Group(); pivot.add(tilt); const elev = o2.elev ?? 0.5 + r() * 0.35; tilt.rotation.x = elev; // the leaf's angle above the horizontal (it points along −z of the pivot)
    const c = kind === 'sb' ? CELLS[cell] : SOLO.ovate; const geo = leafGeo(c, len, { fold: 0.16, arch: 0.18 + r() * 0.1, flip: r() < 0.5 });
    const m = leafMesh(geo, o2.mat || mat); m.rotation.x = -Math.PI / 2 + 0.0; // the photo's upper side faces up when the leaf lies out flat
    // petiole: a short green stalk
    tilt.add(m); m.position.y = 0; const lf = { pivot, tilt, mesh: m, len, elev, cell, ang, node, droop: 0 }; it.leaves.push(lf); return lf;
  };
  nodeK.forEach((k, i) => {
    const node = nodeAt(k); const base = i * Math.PI / 2 + (r() - 0.5) * 0.3 + (o.turn ?? 0); const len = (0.064 - 0.026 * (i / nP)) * (o.leafK ?? 1) * (0.92 + r() * 0.16);
    const n = { k, p: node, leaves: [] }; it.nodes.push(n);
    for (const sd of [0, Math.PI]) n.leaves.push(makeLeaf(node, base + sd, len * (0.94 + r() * 0.12), cellsG[Math.floor(r() * cellsG.length)]));
  });
  // side branches from the lower nodes (sadabahar branches freely): each a short stem with its own leaf pairs
  it.branches = [];
  for (let b = 0; b < (o.branches ?? 3); b++) {
    const nd = it.nodes[1 + b]; if (!nd) break; const az = b * 2.1 + 0.8 + (r() - 0.5) * 0.4; const out = V(Math.cos(az), 0, Math.sin(az)); const blen = (0.1 - b * 0.012) * (o.leafK ?? 1);
    const pts = [nd.p.clone()]; for (let i = 1; i <= 6; i++) { const k = i / 6; pts.push(nd.p.clone().add(out.clone().multiplyScalar(blen * k * 0.65)).add(V(0, blen * (k * 0.8 + k * k * 0.15), 0))); }
    const cv = new THREE.CatmullRomCurve3(pts); const bm = new THREE.Mesh(taperTube(cv, 0.0022, 0.0011, 12, 6), stemMat()); bm.castShadow = true; root.add(bm); it.branches.push(bm);
    for (let j = 1; j <= 3; j++) { const k = 0.3 + j * 0.22; const at = cv.getPoint(Math.min(1, k)); const base = az + j * Math.PI / 2 + 0.3; const len = (0.05 - j * 0.006) * (o.leafK ?? 1) * (0.9 + r() * 0.2);
      for (const sd of [0, Math.PI]) makeLeaf(at, base + sd, len, cellsG[Math.floor(r() * cellsG.length)]); }
    const tipP = cv.getPoint(1); for (const sd of [0, Math.PI]) makeLeaf(tipP, az + sd + 1.2, 0.02, 'young', { elev: 0.5 });
    if (b < (o.flowers ?? 2)) { const fl = flowerMesh(o.white ? whiteFlowerMat() : leafMat(sbTex(), 'sb'), b % 2 ? 'flower2' : 'flower', 0.032); fl.position.copy(tipP).add(V(0, 0.008, 0)); fl.rotation.set(-0.3, az, 0); root.add(fl); (it.flowersB ||= []).push(fl); }
  }
  // a young pair and the flowers at the top
  const top = nodeAt(1.0); for (const sd of [0, Math.PI]) makeLeaf(top, sd + 0.6, 0.022, 'young', { elev: 0.45 });
  it.flowers = [];
  const nFl = o.flowers ?? 2; const fmat = o.white ? whiteFlowerMat() : leafMat(sbTex(), 'sb');
  for (let i = 0; i < nFl; i++) { const at = nodeAt(0.86 + i * 0.07); const f = flowerMesh(fmat, i % 2 ? 'flower2' : 'flower', 0.034); f.position.copy(at).add(V(Math.cos(i * 2.4) * 0.012, 0.012, Math.sin(i * 2.4) * 0.012)); f.rotation.set(-0.35 - r() * 0.3, i * 2.4, 0); root.add(f); it.flowers.push(f); }
  // the test leaf: the biggest leaf of a low node, facing the student (+z); it gets its own skin
  const want = o.test ?? 1; const cands = it.nodes[Math.min(want, it.nodes.length - 1)].leaves;
  let best = cands[0]; for (const l of cands) if (-Math.cos(l.ang) > -Math.cos(best.ang)) best = l; // a leaf points along −z turned by ang: ang = π faces the student
  best.ang = Math.PI; best.pivot.rotation.y = Math.PI; best.elev = 0.42; best.tilt.rotation.x = 0.42;
  { const other = cands.find((l) => l !== best); if (other) { other.ang = 0; other.pivot.rotation.y = 0; } }
  if (o.skin) { const c = kind === 'sb' ? SOLO.test : SOLO.ovate; best.mesh.geometry.dispose(); best.mesh.geometry = leafGeo(c, best.len * 1.08, { fold: 0.06, arch: 0.08 }); best.mesh.material = leafMat(o.skin.tex); best.mesh.customDepthMaterial = best.mesh.material.userData.depth; best.skin = o.skin; }
  it.testLeaf = best;
  it.H = H; it.kind0 = kind; it.cellsY = cellsY; it.mat = mat;
  it.height = (o.potH ?? 0.1) + H + 0.03; it.radius = 0.09; it.grabY = (o.potH ?? 0.1) * 0.6; it.noPhys = true; it.base = 0;
  // ---- living states: wilting (no water), drying up, growing pale and tall in the dark (etiolation), growth
  it.state = { wilt: 0, dry: 0, pale: 0, grow: 0 };
  it.setLook = (s) => {
    Object.assign(it.state, s); const W = it.state.wilt, D = it.state.dry, Pl = it.state.pale, G = it.state.grow;
    root.scale.set(1 - 0.25 * Pl, 1 + 0.15 * G + 0.55 * Pl, 1 - 0.25 * Pl);
    for (const l of it.leaves) { if (l.plucked) continue; l.tilt.rotation.x = l.elev - W * 1.25 - D * 0.3; const k = 1 - 0.22 * Pl; l.mesh.scale.set(k, (1 - 0.3 * Pl) / (1 + 0.15 * G + 0.55 * Pl) * (1 + 0.1 * G), k);
      const g = l.mesh.geometry; if (W > 0.02 || l.droop > 0.02) { if (Math.abs((l.droop || 0) - W) > 0.03) { l.droop = W; shapeLeaf(g, { fold: 0.16 + W * 0.25, arch: 0.18 + W * 0.25, droop: W * 0.6, curl: D * 0.25 }); } } }
    // dry leaves: the yellow-brown leaves of the photo, and darker
    const dm = it.dryMat || (it.dryMat = mat.clone()); if (mat.userData.depth) dm.userData.depth = mat.userData.depth;
    dm.color.setRGB(1 - 0.45 * D, 1 - 0.55 * D, 1 - 0.7 * D);
    const pm = it.paleMat; if (Pl > 0 && !pm) { it.paleMat = paleMat(mat); }
    for (const l of it.leaves) { if (l.plucked || l.skin) continue; const useDry = D > 0.25; l.mesh.material = useDry ? dm : Pl > 0.05 && it.paleMat ? it.paleMat : mat;
      if (useDry && kind === 'sb' && !l.yCell) { l.yCell = cellsY[Math.floor(Math.abs(Math.sin(l.ang * 7.3)) * 3)]; const gg = leafGeo(CELLS[l.yCell], l.len, { fold: 0.3, arch: 0.4, droop: W * 0.6, curl: 0.3 }); l.mesh.geometry.dispose(); l.mesh.geometry = gg; } }
    if (it.paleMat) it.paleMat.userData.k.value = Pl;
    stem.material = Pl > 0.05 ? (it.paleStem || (it.paleStem = (() => { const sm = stemMat().clone(); sm.color.set(0xdfe2b8); return sm; })())) : stemMat();
    for (const f of it.flowers.concat(it.flowersB || [])) f.visible = D < 0.4 && Pl < 0.5;
  };
  // ---- pluck a leaf (the test leaf): it leaves the plant as its own item
  it.pluck = (lf = it.testLeaf) => { lf.plucked = true; const w = new THREE.Vector3(), q = new THREE.Quaternion(); lf.mesh.updateWorldMatrix(true, false); lf.mesh.getWorldPosition(w); lf.mesh.getWorldQuaternion(q); lf.tilt.remove(lf.mesh); return { mesh: lf.mesh, p: w, q }; };
  it.leafWorld = (lf = it.testLeaf, t = 0.5) => { lf.mesh.updateWorldMatrix(true, false); const g = lf.mesh.geometry.userData; return lf.mesh.localToWorld(V(0, g.len * t, 0.002)); };
  // the light the plant gets (set by where it stands) and whether it is watered
  it.light = 0.08; it.water = 1;
  // the soil takes water poured on it (by hand or with the Do it button): it darkens
  if (it.pot) { const soil = it.pot.userData.soil; soil.material = soil.material.clone(); it.ml = 0; it.rimR = it.pot.userData.rim * 0.85;
    it.mouthWorld = (out = new THREE.Vector3()) => it.g.localToWorld(out.set(0, it.pot.userData.soilY + 0.004, 0));
    it.receive = (portion, ml) => { it.ml += ml; const k = Math.min(1, it.ml / 40); soil.material.color.setRGB(0.416 - 0.2 * k, 0.322 - 0.17 * k, 0.22 - 0.12 * k); if (it.onWater) it.onWater(it.ml); }; }
  // take all the leaves off (a bare shoot)
  // leaves cut off with scissors: a short cut stalk (petiole stub) stays at every node
  it.removeLeaves = () => { const sg = new THREE.CylinderGeometry(0.0006, 0.0009, 0.006, 6).rotateX(Math.PI / 2).translate(0, 0, -0.0028); const sm = stemMat();
    for (const l of it.leaves) { if (l.skin) continue; l.mesh.visible = false; l.plucked = true; const st = new THREE.Mesh(sg, sm); l.tilt.add(st); } if (!it.testLeaf.skin) it.testLeaf.mesh.visible = false; };
  return it;
}
// a tube that gets thinner towards its tip
export function taperTube(curve, r0, r1, n = 20, rs = 8) {
  const g = new THREE.TubeGeometry(curve, n, 1, rs, false); const p = g.attributes.position, nrm = g.attributes.normal; const pts = curve.getSpacedPoints(n);
  for (let i = 0; i <= n; i++) { const r = lerp(r0, r1, i / n); for (let j = 0; j <= rs; j++) { const a = i * (rs + 1) + j; const c = pts[i]; p.setXYZ(a, c.x + nrm.getX(a) * r, c.y + nrm.getY(a) * r, c.z + nrm.getZ(a) * r); } }
  p.needsUpdate = true; g.computeVertexNormals(); return g;
}
// leaves grown in the dark: pale yellow-white, the photo's veins kept (lightened in the shader, so one texture serves both)
function paleMat(base) {
  const m = base.clone(); const k = { value: 0 }; m.userData.k = k; m.userData.depth = base.userData.depth;
  m.onBeforeCompile = (s) => { s.uniforms.uPale = k; s.fragmentShader = 'uniform float uPale;\n' + s.fragmentShader.replace('#include <map_fragment>', `#include <map_fragment>
    float lmP = dot(diffuseColor.rgb, vec3(0.3, 0.59, 0.11)); diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.95, 0.88, 0.48) * (0.5 + 1.1 * lmP), uPale * 0.85);`); };
  m.customProgramCacheKey = () => 'bio2pale'; return m;
}
// sadabahar flowers (white with a yellow eye for the transport experiment: the pink of the photo turned white, the eye kept)
let WFM = null;
function whiteFlowerMat() {
  if (WFM) return WFM; const m = leafMat(sbTex(), null).clone(); const red = { value: 0 }; m.userData.red = red; m.userData.depth = leafMat(sbTex(), 'sb').userData.depth;
  m.onBeforeCompile = (s) => { s.uniforms.uRed = red; s.fragmentShader = 'uniform float uRed;\n' + s.fragmentShader.replace('#include <map_fragment>', `#include <map_fragment>
    float pinkW = smoothstep(0.08, 0.2, diffuseColor.r - diffuseColor.g) * smoothstep(0.0, 0.12, diffuseColor.b - diffuseColor.g + 0.05);
    float lmW = dot(diffuseColor.rgb, vec3(0.3, 0.59, 0.11)); vec3 white = vec3(0.97, 0.96, 0.95) * (0.62 + 0.9 * lmW);
    // red ink climbs into the petals: first the veins (darker lines), then the whole petal turns pink-red
    float vein = smoothstep(0.02, 0.1, lmW - dot(white, vec3(0.3, 0.59, 0.11)) * 0.55);
    vec3 inked = mix(white, vec3(0.93, 0.4, 0.55) * (0.78 + 0.35 * lmW), clamp(uRed * 0.7 - 0.08 + vein * uRed * 0.55, 0.0, 0.72));
    diffuseColor.rgb = mix(diffuseColor.rgb, inked, pinkW);`); };
  m.customProgramCacheKey = () => 'bio2white'; WFM = m; return m;
}
function flowerMesh(mat, cell, size) {
  const c = CELLS[cell]; const g = new THREE.PlaneGeometry(size, size, 2, 2); const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, c.x + c.w * (0.5 + (uv.getX(i) - 0.5) * c.fw), 1 - (c.y + c.h) + MARGIN * 0.3 + c.h * (0.5 + (uv.getY(i) - 0.5) * c.fh) * 1.0);
  const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i); p.setZ(i, -Math.hypot(x, y) * 0.18); } g.computeVertexNormals(); g.rotateX(-Math.PI / 2);
  const grp = new THREE.Group(); const m = leafMesh(g, mat); m.position.y = 0.012; grp.add(m);
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.0022, 0.0012, 0.014, 8), M(0xb8c78a, 0.6)); tube.position.y = 0.005; grp.add(tube); return grp;
}
export const whiteFlowers = () => whiteFlowerMat();

// ------------------------------------------------------------------ sunlight on the bench, from the windows on the left
export function sunPatch(o = {}) {
  const it = new Item('sunpatch', { name: N('Sunlight from the window', 'खिड़की से आती धूप', 'Khidki se aati dhoop') });
  const w = o.w ?? 0.36, d = o.d ?? 0.32;
  const tex = canvasTex(256, 256, (x, W, H) => { const g = x.createRadialGradient(W / 2, H / 2, W * 0.15, W / 2, H / 2, W * 0.52); g.addColorStop(0, 'rgba(255,236,190,0.95)'); g.addColorStop(0.75, 'rgba(255,228,170,0.6)'); g.addColorStop(1, 'rgba(255,220,160,0)'); x.fillStyle = g; x.fillRect(0, 0, W, H);
    x.globalCompositeOperation = 'destination-out'; x.fillStyle = 'rgba(0,0,0,0.5)'; for (const f of [0.33, 0.66]) x.fillRect(f * W - 3, 0, 6, H); for (const f of [0.5]) x.fillRect(0, f * H - 3, W, 6); }); // the shadow of the window bars
  const patch = new THREE.Mesh(new THREE.PlaneGeometry(w, d).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.55, toneMapped: false })); patch.position.y = 0.002; patch.renderOrder = 2; it.g.add(patch);
  // a soft shaft of light from the upper left (sunlit dust), drawn, not lit: no extra light for phones and headsets
  const beamT = canvasTex(64, 256, (x, W, H) => { const g = x.createLinearGradient(0, 0, W, 0); g.addColorStop(0, 'rgba(255,240,200,0)'); g.addColorStop(0.5, 'rgba(255,240,200,0.5)'); g.addColorStop(1, 'rgba(255,240,200,0)'); x.fillStyle = g; x.fillRect(0, 0, W, H); const v = x.createLinearGradient(0, 0, 0, H); v.addColorStop(0, 'rgba(0,0,0,1)'); v.addColorStop(1, 'rgba(0,0,0,0)'); x.globalCompositeOperation = 'destination-out'; x.fillStyle = v; x.fillRect(0, 0, W, H); });
  for (const dz of [-d * 0.25, d * 0.25]) { const b = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.9, 0.9), new THREE.MeshBasicMaterial({ map: beamT, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.16, side: THREE.DoubleSide, toneMapped: false }));
    b.position.set(-0.32, 0.4, dz); b.rotation.set(0, 0, 0.72); b.renderOrder = 3; it.g.add(b); }
  it.w = w; it.d = d; it.inside = (p) => { const c = it.g.position; return Math.abs(p.x - c.x) < w / 2 && Math.abs(p.z - c.z) < d / 2; };
  noHit(it.g); it.noGrab = true; it.noPhys = true; it.height = 0.01; it.radius = w / 2; return it;
}
// ------------------------------------------------------------------ a cardboard box for darkness (lid opens; a side hole lets in one beam)
export function darkBox(o = {}) {
  const it = new Item('darkbox', { name: o.name || N('Dark box (cardboard carton)', 'अँधेरा डिब्बा (गत्ते का कार्टन)', 'Andhera dibba (gatte ka carton)') });
  const w = o.w ?? 0.3, d = o.d ?? 0.24, h = o.h ?? 0.32, t = 0.004; const mat = M(0xffffff, 0.9, 0, { map: cardTex([1, 1]), side: THREE.DoubleSide });
  const inner = M(0x6a5236, 0.95, 0, { side: THREE.DoubleSide });
  const box = new THREE.Group(); it.g.add(box);
  const wall = (W, H, x, y, z, ry, hole) => { let g; if (hole) { const s = new THREE.Shape(); s.moveTo(-W / 2, 0); s.lineTo(W / 2, 0); s.lineTo(W / 2, H); s.lineTo(-W / 2, H); s.lineTo(-W / 2, 0); const hp = new THREE.Path(); const hr = hole.r; hp.absarc(hole.x, hole.y, hr, 0, Math.PI * 2, true); s.holes.push(hp); g = new THREE.ShapeGeometry(s, 16); g.translate(0, -H / 2, 0); }
    else g = new THREE.PlaneGeometry(W, H); const m = new THREE.Mesh(g, mat); m.position.set(x, y, z); m.rotation.y = ry; m.castShadow = true; m.receiveShadow = true; box.add(m); return m; };
  wall(w, h, 0, h / 2, -d / 2, 0); wall(d, h, -w / 2, h / 2, 0, Math.PI / 2, o.hole ? { x: 0, y: h * 0.55, r: 0.022 } : null); wall(d, h, w / 2, h / 2, 0, -Math.PI / 2);
  const door = new THREE.Group(); door.position.set(0, 0, d / 2); box.add(door); const front = wall(w, h, 0, h / 2, 0, 0); box.remove(front); door.add(front); it.front = door; // the front opens down like a flap (the door)
  const lid = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat); lid.rotation.x = -Math.PI / 2; lid.position.y = h; box.add(lid); lid.castShadow = true;
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(w, d * 0.98).rotateX(-Math.PI / 2), inner); fl.position.y = 0.001; box.add(fl);
  it.open = 0; it.setOpen = (k) => { it.open = k; door.rotation.x = k * 1.45; };
  it.inside = (p) => { const c = it.g.position; return Math.abs(p.x - c.x) < w / 2 - 0.01 && Math.abs(p.z - c.z) < d / 2 - 0.01; };
  it.w = w; it.d = d; it.h = h; it.hole = !!o.hole; it.height = h; it.radius = Math.max(w, d) / 2; it.grabY = h; it.noGrab = true; it.noPhys = true; return it;
}

// ------------------------------------------------------------------ the clock: a real alarm clock and a slider to move time on
// hours: 0…max; the slider only goes forward (time does not run backwards). onHours(h, dh) is called as time moves.
export function timeSlider(app, o = {}) {
  const clk = new Item('bclock', { name: N('Clock (move the slider to let time pass)', 'घड़ी (समय आगे बढ़ाने के लिए स्लाइडर खिसकाइए)', 'Ghadi (time aage badhane ke liye slider khiskaiye)') });
  dress(clk, 'alarm_clock_01', { h: 0.085 }); const sign = liveSign(0.03, 4.4); sign.position.set(0, 0.12, 0); clk.g.add(sign); clk.sign = sign;
  clk.noGrab = true; clk.noPhys = true; clk.height = 0.09; clk.radius = 0.05;
  const knob = new Item('bknob', { name: N('Time slider', 'समय का स्लाइडर', 'Time slider') });
  const kb = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.012, 0.016, 20), M(0xf0a65a, 0.45)); kb.position.y = 0.008; knob.g.add(kb);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.02, 0.0025, 8, 32), new THREE.MeshBasicMaterial({ color: 0xffd23f, transparent: true, opacity: 0.85, toneMapped: false })); ring.rotation.x = Math.PI / 2; ring.position.y = 0.004; ring.userData.noHit = true; knob.g.add(ring); knob.pulse = ring;
  knob.height = 0.02; knob.radius = 0.016; knob.grabY = 0.01; knob.base = 0;
  const track = new Item('btrack', { name: N('Time slider', 'समय का स्लाइडर', 'Time slider') }); const L = o.len ?? 0.3;
  const slot = new THREE.Mesh(new THREE.BoxGeometry(L + 0.03, 0.006, 0.022), M(0x2a2f36, 0.5, 0.3)); slot.position.set(L / 2, 0.003, 0); track.g.add(slot);
  const tick = canvasTex(1024, 64, (x, W, H) => { x.fillStyle = '#1e2329'; x.fillRect(0, 0, W, H); x.fillStyle = '#e8e2d6'; const n = o.ticks ?? 8; for (let i = 0; i <= n; i++) { const px = 40 + (W - 80) * i / n; x.fillRect(px - 2, 6, 4, 22); } x.font = '700 26px sans-serif'; x.textAlign = 'center'; (o.labels || []).forEach(([f, t]) => x.fillText(t, 40 + (W - 80) * f, 56)); });
  const face = new THREE.Mesh(new THREE.PlaneGeometry(L + 0.03, 0.02).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: tick })); face.position.set(L / 2, 0.0062, 0.0); track.g.add(face);
  track.noGrab = true; track.noPhys = true; track.height = 0.01; track.radius = L / 2;
  const S = { hours: 0, max: o.max ?? 72, k: 0, clk, knob, track, L, fmt: o.fmt, onHours: o.onHours || null, target: null };
  S.text = () => { const h = S.hours; if (S.fmt) return S.fmt(h, app.lang); const L2 = app.lang; const d = Math.floor(h / 24), hh = Math.round(h % 24);
    const H2 = Math.round(h); void hh; const w = { en: () => `${H2} h` + (d ? ` · day ${d + 1}` : ''), hi: () => `${H2} घंटे` + (d ? ` · ${d + 1}वाँ दिन` : ''), hg: () => `${H2} ghante` + (d ? ` · din ${d + 1}` : '') }; return (w[L2] || w.en)(); };
  S.set = (h) => { h = Math.max(S.hours, Math.min(S.max, h)); const dh = h - S.hours; if (dh <= 1e-6) return; S.hours = h; S.k = h / S.max; if (!knob.held) knob.g.position.copy(S.at()); if (S.onHours) S.onHours(h, dh); clk.sign.set([S.text()], '#ffe7b0'); app.lab.emit('time', { h }); };
  S.at = () => track.g.localToWorld(V(S.k * L, 0.0, 0));
  handle(knob, { path: () => [track.g.localToWorld(V(0, 0, 0)), track.g.localToWorld(V(L, 0, 0))], active: () => S.active ? S.active() : true, at: () => S.at(), move: (k) => S.set(k * S.max), keepVisible: () => true });
  S.place = (x, z, o2 = {}) => { app.lab.add(track, x, z); app.lab.add(knob, x, z); app.lab.add(clk, x + (o2.clockDx ?? -0.07), z + (o2.clockDz ?? -0.02)); track.g.updateMatrixWorld(true); knob.g.position.copy(S.at()); clk.sign.set([S.text()], '#ffe7b0'); };
  // move time on smoothly to h (the Do it button)
  S.to = async (K, h, sec = 3) => { const h0 = S.hours; await K.tween(sec, (k) => S.set(h0 + (h - h0) * ease(k))); S.set(h); };
  return S;
}

// ------------------------------------------------------------------ a beaker water bath that holds its temperature (thermostat), with a thermometer in it
export function holdBath(K, x, z, T, o = {}) {
  const b = K.beaker(x, z, 'water', o.ml ?? 160, 250); b.mix.temp = T; b.hold = T; b.name = o.name || N(`Water bath at ${T} °C`, `${T} °C का वॉटर बाथ`, `${T} °C ka water bath`);
  const u0 = b.update.bind(b); b.update = (dt) => { u0(dt); if (b.hold != null && !b.onTripod) b.mix.temp += (b.hold - b.mix.temp) * Math.min(1, dt * 2); };
  if (o.ice) { K.A3.iceCubes(b, 5); }
  if (o.thermo !== false) { const th = K.A.thermometer(); K.add(th, x + 0.012, z - 0.012, { y: BENCH_Y + 0.004 }); th.g.rotation.z = -0.12; th.noGrab = true; th.noPhys = true; const tu = th.update; th.update = (dt, t) => { tu && tu(dt, t); th.setTemp(b.mix.temp); }; b.thermo = th; }
  return b;
}
// a test tube let go above a bath beaker stands in it (by hand); returns true if it did
export function bathOnRelease(K, t, baths, onIn) {
  const r0 = t.onRelease;
  t.onRelease = () => { if (r0) r0(); const p = t.g.position; for (const b of baths) { const m = b.g.position; if (Math.hypot(p.x - m.x, p.z - m.z) < 0.05 && p.y > BENCH_Y + 0.05) { const y = m.y + b.inner[0].y + 0.004; t.g.position.set(m.x, y, m.z); t.g.quaternion.identity(); t.bath = b; t.home = { p: t.g.position.clone(), q: t.g.quaternion.clone() }; K.lab.emit('bath', { v: t.id, in: b.id }); onIn && onIn(t, b); return; } } };
}

// ------------------------------------------------------------------ the starch test of a leaf: the leaf off the plant, boiled, decolourised in alcohol (in a water bath), iodine
// the plucked leaf as an item of its own: it can be carried, dropped into water, into the tube of alcohol or into the dish
export function leafItem(K, plant) {
  const it = new Item('bleaf', { name: N('The test leaf', 'जाँच वाली पत्ती', 'Jaanch wali patti') }); const lf = plant.testLeaf; const sk = lf.skin;
  const { mesh, p, q } = plant.pluck(lf); it.g.add(mesh); mesh.position.set(0, 0, 0); mesh.quaternion.identity(); mesh.scale.set(1, 1, 1);
  K.lab.add(it, p.x, p.z); it.g.position.copy(p); it.g.quaternion.copy(q); it.home = { p: p.clone(), q: q.clone() };
  it.mesh = mesh; it.skin = sk; it.len = mesh.geometry.userData.len; it.in = null; it.boiled = 0; it.paper = null;
  it.height = 0.01; it.radius = 0.03; it.grabY = 0.005; it.noPhys = true; it.base = 0; it.dragLift = 0.08;
  it.shape = (o) => shapeLeaf(mesh.geometry, { fold: 0.06, arch: 0.08, ...o });
  // the leaf's life after the plant: soft in boiling water, loses chlorophyll in hot alcohol (the alcohol turns green), takes up iodine
  it.update = (dt) => {
    const v = it.in; if (!v || !v.mix || !sk) return; const L = K.app.chem.lapse || 1; const T = v.mix.temp; let ch = false;
    if ((v.mix.liq.water || 0) > 1 && T > 80 && it.boiled < 1) { it.boiled = Math.min(1, it.boiled + dt * L / 45); sk.st.boiled = it.boiled; ch = true; }
    const alc = (v.mix.liq.spirit || 0) + (v.mix.liq.chlor || 0); if (alc > 1 && sk.st.chl > 0) { const rate = (T >= 65 ? 1 / 240 : T >= 45 ? 1 / 1500 : 1 / 9000) * (0.35 + 0.65 * it.boiled); const d = Math.min(sk.st.chl, dt * L * rate);
      sk.st.chl -= d; const m = v.mix; const take = Math.min(m.liq.spirit || 0, d * 3); m.liq.spirit -= take; m.liq.chlor = (m.liq.chlor || 0) + take; ch = true; }
    const iod = (v.mix.liq.iodine || 0) + (v.mix.liq.sic || 0); if (iod > 0.02 && sk.st.iod < 1) { sk.st.iod = Math.min(1, sk.st.iod + dt * 0.7 * Math.min(1, iod / 0.15)); ch = true; }
    if (ch) { it._dirty = (it._dirty || 0) + dt; if (it._dirty > 0.45) { it._dirty = 0; sk.draw(); } }
  };
  return it;
}
// put the leaf into a vessel: 'flat' at the bottom of a beaker or dish, 'roll' standing rolled up in a tube
export async function leafInto(K, lf, v, mode = 'flat', dur = 0.9) {
  // a dish: the leaf lies flat in the middle; a beaker: it curls up and lies on its side at the bottom; a tube: rolled, standing
  const dish = v.kind === 'petri' || v.kind === 'katori' || v.kind === 'dish'; if (mode === 'flat' && !dish) mode = 'curl';
  const top = v.mouthWorld(new THREE.Vector3()); const qF = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0)); const qS = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, Math.PI / 2));
  const q = mode === 'roll' ? new THREE.Quaternion() : mode === 'curl' ? qS : qF;
  await K.moveTo(lf, top.clone().add(V(0, 0.07, 0)), q, dur);
  if (mode === 'roll') lf.shape({ roll: Math.max(0.004, v.rInner(0.05) * 0.55) }); else if (mode === 'curl') lf.shape({ roll: 0.008, arch: 0.12 }); else lf.shape({ fold: 0.03, arch: 0.02 });
  const R = mode === 'curl' ? 0.008 : 0; const L = lf.len;
  const local = mode === 'roll' ? V(0, v.inner[0].y + 0.004, 0) : mode === 'curl' ? V(-L / 2, v.inner[0].y + 0.0015, 0) : V(0, v.inner[0].y + 0.0012, L / 2);
  const bottom = v.g.localToWorld(local); void R;
  const p0 = lf.g.position.clone(); await K.tween(0.6, (k) => lf.g.position.lerpVectors(p0, bottom, ease(k)));
  v.g.attach(lf.g); lf.in = v; lf.home = null; K.lab.emit('leaf_in', { obj: lf.id, in: v.id });
}
export async function leafOut(K, lf, to, q) { const v = lf.in; if (v) K.app.scene.attach(lf.g); lf.in = null; lf.shape({}); await K.moveTo(lf, to, q || new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0)), 0.9); }
// a leaf let go by hand above a vessel falls into it (a tube: rolled); anywhere else it lies on the bench
export function leafByHand(K, lf, vessels, onIn) {
  lf.onRelease = () => { const p = lf.g.getWorldPosition(new THREE.Vector3());
    for (const v of vessels) { if (!v.g.parent) continue; const m = v.mouthWorld(new THREE.Vector3()); if (Math.hypot(p.x - m.x, p.z - m.z) < Math.max(0.03, v.rimR * 1.3) && p.y > m.y - 0.03) { const mode = v.kind === 'testtube' ? 'roll' : 'flat'; leafInto(K, lf, v, mode, 0.3).then(() => onIn && onIn(v)); return; } }
    if (lf.in) { K.app.scene.attach(lf.g); lf.in = null; lf.shape({}); } lf.g.position.y = BENCH_Y + 0.003; lf.g.quaternion.setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0.4)); K.lab.emit('leaf_down', { obj: lf.id }); };
}
// alcohol must never be heated on a flame: a tube of spirit held over a burner catches fire
export function spiritWatch(K, tube, burner, onFire) {
  const u0 = tube.update.bind(tube); let fire = null, t = 0;
  tube.update = (dt, tt) => { u0(dt, tt); if (tt === undefined) return; const alc = (tube.mix.liq.spirit || 0) + (tube.mix.liq.chlor || 0);
    if (!fire && burner.lit && alc > 0.5 && !tube.bath && !tube.busyMove && burner.heatPoint) { const hp = burner.g.localToWorld(burner.heatPoint.clone()); const b = tube.g.localToWorld(V(0, 0, 0)); const shield = K.lab.vessels.some((v) => v !== tube && v.onTripod && Math.hypot(v.g.position.x - b.x, v.g.position.z - b.z) < v.rimR + 0.01);
      if (!shield && b.distanceTo(hp) < 0.06 && b.y < hp.y + 0.03) {
      fire = K.A3.candleFlame(); fire.traverse((o) => { if (o.isLight) o.intensity = 0; }); fire.children.filter((o) => o.isLight).forEach((o) => fire.remove(o)); fire.scale.setScalar(1.6); fire.position.set(0, tube.rimY + 0.012, 0); tube.g.add(fire); t = 0; K.lab.emit('spirit_fire', { v: tube.id }); onFire && onFire(); K.app.audio && K.app.audio.whoosh && K.app.audio.whoosh(); } }
    if (fire) { t += dt; fire.userData.tick && fire.userData.tick(K.app.t || t, 1.4, 1.2); tube.mix.liq.spirit = Math.max(0, (tube.mix.liq.spirit || 0) - dt * 0.4); if (t > 5) { tube.g.remove(fire); fire = null; } } };
}

// ------------------------------------------------------------------ small things
// a label card standing on the bench (A, B, C …)
export function card(text, o = {}) {
  const it = new Item('bcard', { name: N(text, text, text) });
  const t = canvasTex(256, 128, (x, W, H) => { x.fillStyle = '#f6f1e2'; x.fillRect(0, 0, W, H); x.strokeStyle = '#b9ab8a'; x.lineWidth = 6; x.strokeRect(3, 3, W - 6, H - 6); x.fillStyle = '#20262c'; x.font = `800 ${o.fs ?? 64}px "Noto Sans", sans-serif`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(text, W / 2, H / 2 + 4); });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(0.05, 0.025), M(0xffffff, 0.8, 0, { map: t })); m.position.y = 0.0135; m.rotation.x = -0.35; it.g.add(m);
  const leg = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.002, 0.012), M(0xd8ccb0, 0.8)); leg.position.set(0, 0.001, -0.01); it.g.add(leg);
  noHit(it.g); it.noGrab = true; it.noPhys = true; it.height = 0.028; it.radius = 0.026; return it;
}
// black paper strip (to cover part of a leaf) with two paper clips
export function paperStrip(o = {}) {
  const it = new Item('bpaper', { name: N('Strip of black paper and clips', 'काले कागज़ की पट्टी और क्लिप', 'Kaale kaagaz ki patti aur clips') });
  const w = o.w ?? 0.05, d = o.d ?? 0.016; const p = new THREE.Mesh(new THREE.BoxGeometry(w, 0.0006, d), M(0x111214, 0.9)); p.position.y = 0.0003; it.g.add(p);
  const p2 = p.clone(); p2.position.set(0.004, 0.0009, 0.003); it.g.add(p2); it.sheets = [p, p2];
  const clip = new THREE.Mesh(new THREE.TorusGeometry(0.004, 0.0006, 6, 16), M(0xc9cdd2, 0.25, 0.9)); clip.scale.set(1, 2.2, 1); clip.rotation.x = Math.PI / 2; clip.position.set(w * 0.3, 0.002, 0); it.g.add(clip); const c2 = clip.clone(); c2.position.x = -w * 0.3; it.g.add(c2); it.clips = [clip, c2];
  it.height = 0.004; it.radius = 0.03; it.grabY = 0.002; it.noPhys = true; return it;
}
// a magnifying glass (a real model) on the bench
export function lens() { const it = new Item('blens', { name: N('Magnifying glass', 'आवर्धक लेंस (मैग्निफ़ाइंग ग्लास)', 'Magnifying glass') }); dress(it, 'magnifying_glass_01', { rot: [-Math.PI / 2, Math.PI / 2, 0], order: 'YXZ', w: 0.155, pin: [0.243, 0, 0.5] }); /* lying flat, 15.5 cm long, its origin under the middle of the lens, the handle along +x */ it.height = 0.03; it.radius = 0.06; it.grabY = 0.01; it.noPhys = true; return it; }
export { M };
