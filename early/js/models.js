// DUET Little Learners: 3D models. Open-licence scans and models (models/<id>.glb, made small by devtools/early/prep.mjs)
// and things we model here from measurements and photographs ('@id'): fruit and vegetables no open scan exists for,
// toys, instruments, tools, a flag, Harappan beads, weights and a painted pot, counting marbles and pencils, a knife and baskets.
// Every model sits on the ground (y = 0), centred, and is sized by fit().
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';

const loader = new GLTFLoader(); loader.setMeshoptDecoder(MeshoptDecoder);
const glbCache = new Map(); const texLoader = new THREE.TextureLoader();
// photo-modelled Harappan pieces and other ids that are files although the data names them '@'
const FILE = { '@seal': 'h_seal', '@girl': 'h_girl', '@king': 'h_king' };
export const modelUrl = (id) => new URL(`../models/${id}.glb`, import.meta.url).href;

export async function loadGLB(id) {
  if (!glbCache.has(id)) glbCache.set(id, loader.loadAsync(modelUrl(id)).then((g) => { g.scene.traverse((o) => { if (o.isMesh) { o.frustumCulled = !o.isSkinnedMesh; for (const m of [].concat(o.material)) { m.userData.shared = true; for (const k in m) if (m[k] && m[k].isTexture) { m[k].userData.shared = true; m[k].anisotropy = 4; } } o.geometry.userData.shared = true; } }); return g; }));
  return glbCache.get(id);
}
// a fresh copy of a model: { obj, anims }
export async function model(id) {
  if (FILE[id]) id = FILE[id];
  if (id.startsWith('@')) { const f = PROC[id.slice(1)]; if (!f) throw new Error('no model ' + id); const o = await f(); o.userData.proc = true; return { obj: o, anims: [] }; }
  const g = await loadGLB(id); const skinned = g.animations.length > 0 || hasSkin(g.scene);
  const obj = skinned ? SkeletonUtils.clone(g.scene) : g.scene.clone(true);
  obj.userData.id = id; return { obj, anims: g.animations };
}
const hasSkin = (o) => { let s = false; o.traverse((c) => { if (c.isSkinnedMesh) s = true; }); return s; };
// size it: its largest side (or height) becomes s metres; then it stands on y = 0, centred
export function fit(obj, s, by = 'max') {
  obj.updateMatrixWorld(true); const b = new THREE.Box3().setFromObject(obj, true); const d = b.getSize(new THREE.Vector3());
  const k = s / Math.max(1e-6, by === 'height' ? d.y : Math.max(d.x, d.y, d.z)); obj.scale.multiplyScalar(k);
  obj.updateMatrixWorld(true); b.setFromObject(obj, true); const c = b.getCenter(new THREE.Vector3());
  const wrap = new THREE.Group(); wrap.add(obj); obj.position.x -= c.x; obj.position.z -= c.z; obj.position.y -= b.min.y; wrap.userData.size = b.getSize(new THREE.Vector3()); wrap.userData.inner = obj; return wrap;
}
export async function loadTex(url, o = {}) {
  const t = await texLoader.loadAsync(url); t.colorSpace = o.linear ? THREE.NoColorSpace : THREE.SRGBColorSpace; t.anisotropy = o.aniso || 4;
  if (o.repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(o.repeat[0], o.repeat[1]); } return t;
}

// ------------------------------------------------------------ painting textures in code
export function canvasTex(w, h, draw, o = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); draw(g, w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = o.linear ? THREE.NoColorSpace : THREE.SRGBColorSpace; t.anisotropy = 4;
  if (o.repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(o.repeat[0], o.repeat[1]); }
  return t;
}
let seed = 7; export const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
export const rr = (a, b) => a + (b - a) * rnd();
// smooth noise on a canvas: small random images drawn large (soft), a few sizes on top of each other
export function noise(g, w, h, colA, colB, octaves = [8, 24, 64], alpha = 0.5) {
  for (const n of octaves) { const c = document.createElement('canvas'); c.width = n; c.height = Math.max(2, Math.round(n * h / w)); const x = c.getContext('2d'); const id = x.createImageData(c.width, c.height);
    for (let i = 0; i < id.data.length; i += 4) { const v = rnd(); const a = hex(colA), b = hex(colB); id.data[i] = a[0] + (b[0] - a[0]) * v; id.data[i + 1] = a[1] + (b[1] - a[1]) * v; id.data[i + 2] = a[2] + (b[2] - a[2]) * v; id.data[i + 3] = 255; }
    x.putImageData(id, 0, 0); g.globalAlpha = alpha; g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high'; g.drawImage(c, 0, 0, w, h); }
  g.globalAlpha = 1;
}
export function speckle(g, w, h, n, col, r0, r1, alpha = 1) { g.fillStyle = col; g.globalAlpha = alpha; for (let i = 0; i < n; i++) { g.beginPath(); g.ellipse(rnd() * w, rnd() * h, rr(r0, r1), rr(r0, r1) * rr(0.6, 1), rnd() * 3, 0, Math.PI * 2); g.fill(); } g.globalAlpha = 1; }
const hex = (c) => { const n = parseInt(c.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const std = (o) => new THREE.MeshStandardMaterial({ roughness: 0.6, metalness: 0, ...o });
const mesh = (g, m) => { const x = new THREE.Mesh(g, m); return x; };
// bend a geometry along x as it goes up y (a gentle curve)
function bend(geo, k, axis = 'y') { const p = geo.attributes.position; for (let i = 0; i < p.count; i++) { const y = axis === 'y' ? p.getY(i) : p.getZ(i); p.setX(i, p.getX(i) + k * y * y); } geo.computeVertexNormals(); return geo; }
// a tube whose thickness changes along it: r(t), t from 0 to 1
function tube(curve, segs, rad, radial = 10, closed = false) {
  const g = new THREE.TubeGeometry(curve, segs, 1, radial, closed); const p = g.attributes.position; const P = new THREE.Vector3(), C = new THREE.Vector3();
  for (let i = 0; i <= segs; i++) { const t = i / segs; curve.getPointAt(t, C); const r = typeof rad === 'function' ? rad(t) : rad; for (let j = 0; j <= radial; j++) { const k = i * (radial + 1) + j; P.fromBufferAttribute(p, k).sub(C).multiplyScalar(r).add(C); p.setXYZ(k, P.x, P.y, P.z); } }
  g.computeVertexNormals(); return g;
}
const lathe = (pts, segs = 48) => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), segs);
let woodTex = null; const wood = () => woodTex || (woodTex = canvasTex(512, 512, (g, w, h) => { g.fillStyle = '#9a6a3c'; g.fillRect(0, 0, w, h); noise(g, w, h, '#7a4f2a', '#b98653', [6, 20], 0.6);
  for (let i = 0; i < 90; i++) { g.strokeStyle = `rgba(70,40,20,${rr(0.08, 0.25)})`; g.lineWidth = rr(0.6, 2.2); g.beginPath(); const x = rnd() * w; g.moveTo(x, 0); for (let y = 0; y <= h; y += 32) g.lineTo(x + Math.sin(y * 0.02 + i) * 6, y); g.stroke(); } }, { repeat: [1, 1] }));

// ------------------------------------------------------------ the models made here
export const PROC = {
  // jamun: a little cluster of glossy, deep purple berries
  async jamun() {
    const tex = canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#240b26'; g.fillRect(0, 0, w, h); noise(g, w, h, '#1a0619', '#4a2350', [6, 14, 40], 0.55); speckle(g, w, h, 160, '#6b4a78', 1, 4, 0.25); speckle(g, w, h, 60, '#130412', 0.5, 2, 0.6); });
    const mat = std({ map: tex, roughness: 0.28, envMapIntensity: 1.3 }); const cal = std({ color: 0x3b2a18, roughness: 0.8 });
    const grp = new THREE.Group(); const base = new THREE.SphereGeometry(0.011, 40, 28); base.scale(0.82, 1.15, 0.82);
    const spots = [[0, 0, 0, 0.2], [0.02, -0.002, 0.008, 1.6], [-0.018, -0.001, 0.012, -1.1], [0.006, 0.0, -0.02, 2.6], [-0.008, 0.019, 0.004, 0.9]];
    for (const [x, y, z, r] of spots) { const b = mesh(base, mat); b.position.set(x, 0.011 + y, z); b.rotation.set(1.35 + rr(-0.2, 0.2), r, 0); grp.add(b);
      const c = mesh(new THREE.CylinderGeometry(0.0026, 0.0032, 0.0016, 10), cal); c.position.set(0, 0.0128, 0); b.add(c); }
    return grp;
  },
  // okra (bhindi): five ridges, fine fuzz, a green cap and stalk
  async okra() {
    const L = 0.12, R = 0.0085, NS = 60, NA = 40; const pos = [], uv = [], idx = [];
    for (let i = 0; i <= NS; i++) { const t = i / NS; const prof = (t < 0.07 ? Math.sqrt(t / 0.07) * 0.85 + 0.15 : 1) * Math.pow(1 - Math.pow(Math.max(0, (t - 0.35) / 0.65), 1.6), 0.9); const y = t * L;
      for (let j = 0; j <= NA; j++) { const a = (j / NA) * Math.PI * 2; const ridge = 0.86 + 0.16 * Math.pow(Math.abs(Math.cos(a * 2.5)), 6); const r = R * prof * ridge + 0.0002;
        pos.push(Math.cos(a) * r + 0.012 * t * t, y, Math.sin(a) * r); uv.push(j / NA, t); } }
    for (let i = 0; i < NS; i++) for (let j = 0; j < NA; j++) { const a = i * (NA + 1) + j, b = a + NA + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx); geo.computeVertexNormals();
    const tex = canvasTex(256, 512, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#3f6e22'); gr.addColorStop(0.15, '#5d9431'); gr.addColorStop(1, '#78ad44'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
      for (let k = 0; k < 5; k++) { const x = (k + 0.5) * w / 5; g.fillStyle = 'rgba(160,210,110,0.35)'; g.fillRect(x - 3, 0, 6, h); }
      noise(g, w, h, '#4c7f28', '#8fc458', [10, 40, 120], 0.25); speckle(g, w, h, 900, 'rgba(220,240,200,0.35)', 0.4, 1.2); g.fillStyle = '#2f5418'; g.fillRect(0, 0, w, h * 0.06); });
    const pod = mesh(geo, std({ map: tex, roughness: 0.55 })); pod.rotation.z = Math.PI; pod.position.y = L; // tip down
    const cap = mesh(new THREE.CylinderGeometry(0.0062, 0.0088, 0.008, 10), std({ color: 0x35571c, roughness: 0.7 })); cap.position.y = L + 0.002;
    const stalk = mesh(tube(new THREE.CatmullRomCurve3([new THREE.Vector3(0, L + 0.004, 0), new THREE.Vector3(0.002, L + 0.016, 0), new THREE.Vector3(0.008, L + 0.026, 0)]), 8, 0.0022, 6), std({ color: 0x4f7a2a, roughness: 0.7 }));
    const g = new THREE.Group(); g.add(pod, cap, stalk); g.rotation.z = Math.PI / 2 - 0.12; const w = new THREE.Group(); w.add(g); g.position.set(-L / 2, 0.01, 0); return w;
  },
  // bottle gourd (lauki): long, pale green, a slim neck and a fuller end
  async lauki() {
    const pts = []; const L = 0.42; for (let i = 0; i <= 40; i++) { const t = i / 40; const r = 0.042 + 0.032 * Math.pow(Math.sin(Math.min(1, t * 1.25) * Math.PI / 2), 1.5) - 0.012 * Math.pow(t, 3); const e = t < 0.04 ? Math.sqrt(t / 0.04) : t > 0.96 ? Math.sqrt((1 - t) / 0.04) : 1; pts.push([Math.max(0.0005, r * e), t * L]); }
    pts.reverse(); const geo = bend(lathe(pts.map(([r, y]) => [r * (y < 0.33 * L ? 1.18 : 1), y]), 56), 0.25);
    const tex = canvasTex(512, 512, (g, w, h) => { g.fillStyle = '#a9c97a'; g.fillRect(0, 0, w, h); noise(g, w, h, '#93b862', '#c3dc98', [8, 30, 90], 0.45);
      for (let i = 0; i < 26; i++) { g.strokeStyle = 'rgba(120,160,80,0.18)'; g.lineWidth = rr(2, 6); const x = rnd() * w; g.beginPath(); g.moveTo(x, 0); g.lineTo(x + rr(-8, 8), h); g.stroke(); }
      speckle(g, w, h, 700, 'rgba(235,245,215,0.55)', 0.6, 2.2); });
    const m = mesh(geo, std({ map: tex, roughness: 0.42 })); const stem = mesh(tube(new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.004, 0.018, 0), new THREE.Vector3(0.012, 0.03, 0)]), 8, (t) => 0.006 - 0.002 * t, 7), std({ color: 0x5a6b33, roughness: 0.8 }));
    stem.position.set(0.25 * L * L, L, 0); const g = new THREE.Group(); g.add(m, stem); g.rotation.z = Math.PI / 2 - 0.06; const w = new THREE.Group(); w.add(g); g.position.set(L * 0.5, 0.07, 0); return w;
  },
  // a pea pod, half open: shiny green shells and a row of round peas (opens further when "cut")
  async peapod() {
    const L = 0.085; const shell = (open) => { const g = new THREE.SphereGeometry(0.5, 40, 16, 0, Math.PI, 0, Math.PI); g.scale(L, 0.014, 0.011); g.rotateX(Math.PI / 2); return g; };
    const tex = canvasTex(256, 128, (g, w, h) => { g.fillStyle = '#5a9a2c'; g.fillRect(0, 0, w, h); noise(g, w, h, '#4a8622', '#7cb648', [8, 24, 70], 0.4); speckle(g, w, h, 140, 'rgba(200,235,160,0.25)', 0.5, 1.5); });
    const sm = std({ map: tex, roughness: 0.38, side: THREE.DoubleSide }); const pm = std({ color: 0x86c04a, roughness: 0.32 });
    const grp = new THREE.Group(); const hinge = new THREE.Group(); grp.add(hinge);
    const bottom = mesh(shell(), sm); bottom.rotation.x = 0; hinge.add(bottom);
    const top = new THREE.Group(); const topShell = mesh(shell(), sm); topShell.rotation.x = Math.PI; top.add(topShell); hinge.add(top);
    const n = 7; for (let i = 0; i < n; i++) { const t = (i + 0.5) / n - 0.5; const r = 0.0052 * (1 - 0.35 * Math.pow(Math.abs(t) * 2, 3)); const p = mesh(new THREE.SphereGeometry(r, 18, 12), pm); p.position.set(t * L * 0.86, 0.004, 0); hinge.add(p); }
    const stalk = mesh(tube(new THREE.CatmullRomCurve3([new THREE.Vector3(-L / 2, 0, 0), new THREE.Vector3(-L / 2 - 0.01, 0.003, 0), new THREE.Vector3(-L / 2 - 0.018, 0.009, 0)]), 6, 0.0016, 6), std({ color: 0x4d7d28 })); hinge.add(stalk);
    hinge.position.y = 0.011; top.rotation.z = 0; top.position.z = -0.0;
    grp.userData.open = (k) => { top.rotation.x = -k * 1.9; top.position.y = 0; }; grp.userData.open(0.35); grp.userData.canOpen = true;
    return grp;
  },
  // a paper kite (patang): tissue paper, a bamboo spine and bow, a little tail
  async kite() {
    const S = 0.36; const tex = canvasTex(512, 512, (g, w, h) => { g.fillStyle = '#e8352a'; g.fillRect(0, 0, w, h); g.fillStyle = '#ffd23f'; g.beginPath(); g.moveTo(0, 0); g.lineTo(w, h); g.lineTo(0, h); g.closePath(); g.fill();
      g.fillStyle = '#1f6fd1'; g.beginPath(); g.arc(w / 2, h / 2, w * 0.12, 0, Math.PI * 2); g.fill(); noise(g, w, h, '#ffffff', '#c8b090', [40, 140], 0.07);
      for (let i = 0; i < 400; i++) { g.strokeStyle = 'rgba(255,255,255,0.05)'; g.beginPath(); const x = rnd() * w, y = rnd() * h; g.moveTo(x, y); g.lineTo(x + rr(-12, 12), y + rr(-12, 12)); g.stroke(); } });
    const geo = new THREE.PlaneGeometry(S, S, 16, 16); geo.rotateZ(Math.PI / 4); const p = geo.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i); p.setZ(i, -0.06 * (x * x) / (S * S) * 4 + 0.015 * Math.max(0, y) / S); } geo.computeVertexNormals();
    const paper = mesh(geo, std({ map: tex, roughness: 0.85, side: THREE.DoubleSide, transparent: true, opacity: 0.96 }));
    const bam = std({ color: 0xc9a46a, roughness: 0.65 }); const D = S * Math.SQRT1_2;
    const spine = mesh(new THREE.CylinderGeometry(0.0016, 0.0016, D * 2, 6), bam); spine.position.z = 0.004;
    const bow = mesh(tube(new THREE.QuadraticBezierCurve3(new THREE.Vector3(-D, 0, 0.002), new THREE.Vector3(0, D * 0.42, 0.03), new THREE.Vector3(D, 0, 0.002)), 24, 0.0013, 5), bam);
    const tail = mesh(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-0.04, -D, 0), new THREE.Vector3(0.04, -D, 0), new THREE.Vector3(0, -D - 0.07, 0)]).setIndex([0, 1, 2]), std({ color: 0xffd23f, side: THREE.DoubleSide, roughness: 0.85 })); tail.geometry.computeVertexNormals();
    const k = new THREE.Group(); k.add(paper, spine, bow, tail); k.rotation.x = -0.25; const w = new THREE.Group(); w.add(k); k.position.y = D + 0.07; return w;
  },
  // a bird's nest of twigs with three speckled eggs
  async nest() {
    const parts = []; const R = 0.075;
    for (let i = 0; i < 170; i++) { const a0 = rnd() * Math.PI * 2, span = rr(0.6, 1.6), h0 = rr(0.0, 0.055), rad = R + rr(-0.02, 0.025) + h0 * 0.35; const pts = [];
      for (let k = 0; k < 5; k++) { const a = a0 + span * k / 4; const rk = rad + rr(-0.006, 0.006); pts.push(new THREE.Vector3(Math.cos(a) * rk, h0 + rr(-0.006, 0.006) + Math.sin(k) * 0.004, Math.sin(a) * rk)); }
      const g = tube(new THREE.CatmullRomCurve3(pts), 10, (t) => rr(0.0016, 0.0028) * (1 - 0.4 * t), 4); const c = new THREE.Color().setHSL(rr(0.06, 0.09), rr(0.35, 0.55), rr(0.18, 0.4));
      const n = g.attributes.position.count; const col = new Float32Array(n * 3); for (let j = 0; j < n; j++) col.set([c.r, c.g, c.b], j * 3); g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.deleteAttribute('uv'); parts.push(g); }
    const twigs = mesh(mergeGeometries(parts), std({ vertexColors: true, roughness: 0.95 }));
    const bowl = mesh(new THREE.SphereGeometry(R * 0.95, 32, 12, 0, Math.PI * 2, Math.PI * 0.55, Math.PI * 0.45), std({ color: 0x6b5232, roughness: 1, side: THREE.DoubleSide })); bowl.position.y = 0.05;
    const etex = canvasTex(256, 128, (g, w, h) => { g.fillStyle = '#a9d7d6'; g.fillRect(0, 0, w, h); noise(g, w, h, '#98cbca', '#c4e6e4', [8, 30], 0.4); speckle(g, w, h, 110, '#5a4632', 0.6, 2.4, 0.7); });
    const em = std({ map: etex, roughness: 0.4 }); const egg = new THREE.SphereGeometry(0.013, 24, 16); egg.scale(1, 1.32, 1);
    const g = new THREE.Group(); g.add(twigs, bowl); for (const [x, z, r] of [[-0.016, 0.006, 1.2], [0.014, -0.01, 1.4], [0.004, 0.02, 1.7]]) { const e = mesh(egg, em); e.position.set(x, 0.028, z); e.rotation.set(r, rnd() * 3, 0.3); g.add(e); }
    return g;
  },
  // tamarind (imli): curved, lumpy brown pods
  async tamarind() {
    const tex = canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#8b5a2b'; g.fillRect(0, 0, w, h); noise(g, w, h, '#6e4520', '#b07a43', [6, 20, 70], 0.55); speckle(g, w, h, 300, 'rgba(60,35,15,0.4)', 0.5, 2); for (let i = 0; i < 40; i++) { g.strokeStyle = 'rgba(70,40,15,0.35)'; g.lineWidth = rr(0.5, 1.5); g.beginPath(); const x = rnd() * w, y = rnd() * h; g.moveTo(x, y); g.lineTo(x + rr(-30, 30), y + rr(-4, 4)); g.stroke(); } });
    const m = std({ map: tex, roughness: 0.85 }); const g = new THREE.Group();
    for (let i = 0; i < 4; i++) { const L = rr(0.1, 0.14), bendK = rr(0.02, 0.045); const pts = []; for (let k = 0; k <= 6; k++) { const t = k / 6; pts.push(new THREE.Vector3(t * L - L / 2, 0, bendK * Math.sin(t * Math.PI))); }
      const seeds = Math.round(rr(4, 7)); const p = mesh(tube(new THREE.CatmullRomCurve3(pts), 60, (t) => 0.0085 * (0.78 + 0.22 * Math.abs(Math.sin(t * Math.PI * seeds))) * Math.min(1, Math.sqrt(Math.min(t, 1 - t) / 0.06)), 10), m);
      p.position.set(rr(-0.02, 0.02), 0.008 + i * 0.006, (i - 1.5) * 0.017); p.rotation.y = rr(-0.5, 0.5); g.add(p); }
    return g;
  },
  // sugarcane (eekh): jointed canes with waxy nodes
  async sugarcane() {
    const tex = canvasTex(128, 1024, (g, w, h) => { const nodes = 7; for (let k = 0; k < nodes; k++) { const y0 = k * h / nodes, y1 = (k + 1) * h / nodes; const gr = g.createLinearGradient(0, y0, 0, y1); gr.addColorStop(0, '#c9b78d'); gr.addColorStop(0.08, '#6a2a3a'); gr.addColorStop(0.5, '#5a2032'); gr.addColorStop(0.9, '#7a3346'); gr.addColorStop(0.97, '#d8cfae'); gr.addColorStop(1, '#a89a70'); g.fillStyle = gr; g.fillRect(0, y0, w, y1 - y0); }
      noise(g, w, h, '#3f1422', '#8a4a5a', [6, 20], 0.18); for (let i = 0; i < 60; i++) { g.strokeStyle = 'rgba(255,240,230,0.06)'; g.lineWidth = rr(1, 3); const x = rnd() * w; g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); } });
    const m = std({ map: tex, roughness: 0.45 }); const top = std({ color: 0xe2d4a8, roughness: 0.9 }); const g = new THREE.Group();
    for (let i = 0; i < 3; i++) { const L = 0.75, R = 0.014; const c = mesh(new THREE.CylinderGeometry(R, R * 1.04, L, 20, 1, false), m); const cap = mesh(new THREE.CircleGeometry(R, 20), top); cap.rotation.x = -Math.PI / 2; cap.position.y = L / 2; c.add(cap);
      c.rotation.z = Math.PI / 2; c.position.set(rr(-0.03, 0.03), R + i * R * 1.7, (i - 1) * 0.026); c.rotation.y = rr(-0.15, 0.15); g.add(c); }
    return g;
  },
  // a ball of wool (oon)
  async wool() {
    const tex = canvasTex(64, 256, (g, w, h) => { g.fillStyle = '#c23a3a'; g.fillRect(0, 0, w, h); for (let y = -w; y < h + w; y += 9) { g.strokeStyle = 'rgba(90,10,15,0.45)'; g.lineWidth = 3; g.beginPath(); g.moveTo(0, y); g.lineTo(w, y + w * 0.7); g.stroke(); g.strokeStyle = 'rgba(255,170,160,0.25)'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, y + 4); g.lineTo(w, y + 4 + w * 0.7); g.stroke(); } }, { repeat: [1, 30] });
    const m = std({ map: tex, roughness: 1 }); const parts = []; const R = 0.05;
    const core = new THREE.SphereGeometry(R * 0.93, 24, 16); core.deleteAttribute('uv'); core.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(core.attributes.position.count * 2), 2));
    for (let i = 0; i < 46; i++) { const ax = new THREE.Vector3(rr(-1, 1), rr(-1, 1), rr(-1, 1)).normalize(); const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), ax); const pts = []; const r = R * rr(0.97, 1.03);
      for (let k = 0; k < 24; k++) { const a = k / 24 * Math.PI * 2; pts.push(new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r).applyQuaternion(q)); }
      parts.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), 48, 0.0034, 5, true)); }
    const end = []; for (let k = 0; k <= 8; k++) { const t = k / 8; end.push(new THREE.Vector3(R * Math.cos(t * 1.2), -R * 0.95 + 0.0034 + Math.max(0, -Math.sin(t * 1.2)) * 0, R * Math.sin(t * 1.2) * 0.4 + t * 0.07)); end[k].y = Math.max(-R + 0.0035, -R * Math.cos(t * 1.6)); }
    parts.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(end), 30, 0.0034, 5, false));
    const ball = mesh(mergeGeometries(parts), m); const coreM = mesh(core, std({ color: 0x8e2328, roughness: 1 })); const g = new THREE.Group(); g.add(ball, coreM); g.children.forEach((c) => (c.position.y = R)); return g;
  },
  // ektara: a gourd with a skin top, a bamboo neck, one string and a peg
  async ektara() {
    const gourd = mesh(lathe([[0.001, 0], [0.05, 0.006], [0.085, 0.04], [0.095, 0.08], [0.08, 0.12], [0.06, 0.135]], 40), std({ color: 0xa0612d, roughness: 0.38 }));
    const skin = mesh(new THREE.CircleGeometry(0.06, 36), std({ color: 0xd8c39a, roughness: 0.8 })); skin.rotation.x = -Math.PI / 2; skin.position.y = 0.1352;
    const bamboo = std({ map: canvasTex(64, 512, (g, w, h) => { g.fillStyle = '#cfae6c'; g.fillRect(0, 0, w, h); noise(g, w, h, '#b8944f', '#e0c48a', [4, 16], 0.5); for (const y of [0.25, 0.55, 0.85]) { g.fillStyle = '#8a6a36'; g.fillRect(0, y * h, w, 6); } }), roughness: 0.55 });
    const g = new THREE.Group(); g.add(gourd, skin);
    for (const s of [-1, 1]) { const st = mesh(new THREE.CylinderGeometry(0.008, 0.01, 0.62, 10), bamboo); st.position.set(s * 0.035, 0.36, 0); st.rotation.z = -s * 0.06; g.add(st); }
    const peg = mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.09, 10), std({ color: 0x5a3b1e, roughness: 0.5 })); peg.rotation.z = Math.PI / 2; peg.position.set(0, 0.64, 0); g.add(peg);
    const str = mesh(new THREE.CylinderGeometry(0.0008, 0.0008, 0.505, 4), std({ color: 0xdddddd, metalness: 0.8, roughness: 0.3 })); str.position.set(0, 0.388, 0.004); g.add(str);
    g.rotation.z = -0.25; return g;
  },
  // the national flag of India (3:2) on a pole; the cloth waves
  async flag() {
    const tex = canvasTex(768, 512, (g, w, h) => { g.fillStyle = '#FF9933'; g.fillRect(0, 0, w, h / 3); g.fillStyle = '#FFFFFF'; g.fillRect(0, h / 3, w, h / 3); g.fillStyle = '#138808'; g.fillRect(0, 2 * h / 3, w, h / 3);
      const cx = w / 2, cy = h / 2, R = h / 6 * 0.9; g.strokeStyle = '#000080'; g.lineWidth = 7; g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.stroke(); g.fillStyle = '#000080'; g.beginPath(); g.arc(cx, cy, R * 0.17, 0, Math.PI * 2); g.fill();
      for (let i = 0; i < 24; i++) { const a = i * Math.PI / 12; g.lineWidth = 2.4; g.beginPath(); g.moveTo(cx + Math.cos(a) * R * 0.17, cy + Math.sin(a) * R * 0.17); g.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); g.stroke(); g.beginPath(); g.arc(cx + Math.cos(a + Math.PI / 24) * R * 0.93, cy + Math.sin(a + Math.PI / 24) * R * 0.93, 2.5, 0, Math.PI * 2); g.fill(); }
      noise(g, w, h, '#000000', '#ffffff', [60, 200], 0.04); });
    const W = 0.6, H = 0.4; const geo = new THREE.PlaneGeometry(W, H, 30, 12); geo.translate(W / 2, 0, 0); const cloth = mesh(geo, std({ map: tex, roughness: 0.85, side: THREE.DoubleSide }));
    const base = Float32Array.from(geo.attributes.position.array); const pole = mesh(new THREE.CylinderGeometry(0.008, 0.01, 1.05, 12), std({ color: 0xcfd2d6, metalness: 0.8, roughness: 0.3 })); pole.position.y = 0.525;
    const knob = mesh(new THREE.SphereGeometry(0.016, 16, 12), std({ color: 0xd4a640, metalness: 0.9, roughness: 0.3 })); knob.position.y = 1.06;
    cloth.position.set(0.008, 1.05 - H / 2 - 0.01, 0); const g = new THREE.Group(); g.add(pole, knob, cloth);
    g.userData.tick = (t) => { const p = geo.attributes.position; for (let i = 0; i < p.count; i++) { const x = base[i * 3], y = base[i * 3 + 1]; const k = x / W; p.setZ(i, Math.sin(x * 11 - t * 4.2 + y * 2) * 0.03 * k + Math.sin(x * 23 - t * 6.5) * 0.008 * k); p.setY(i, y - k * k * 0.03); } p.needsUpdate = true; geo.computeVertexNormals(); };
    g.userData.tick(0); return g;
  },
  // damru: two wooden cones, skin heads, a cord with two beads
  async damru() {
    const w = std({ map: wood(), roughness: 0.45, color: 0xb07a45 }); const body = mesh(lathe([[0.05, 0], [0.012, 0.075], [0.05, 0.15]], 40), w);
    const skin = std({ color: 0xe0cfa5, roughness: 0.75 }); const t1 = mesh(new THREE.CircleGeometry(0.05, 32), skin); t1.rotation.x = Math.PI / 2; const t2 = t1.clone(); t2.rotation.x = -Math.PI / 2; t2.position.y = 0.15;
    const cordM = std({ color: 0xb01e28, roughness: 0.8 }); const waist = mesh(new THREE.TorusGeometry(0.0135, 0.003, 8, 24), cordM); waist.rotation.x = Math.PI / 2; waist.position.y = 0.075;
    const g = new THREE.Group(); g.add(body, t1, t2, waist);
    for (const s of [-1, 1]) { const c = mesh(tube(new THREE.CatmullRomCurve3([new THREE.Vector3(s * 0.014, 0.075, 0), new THREE.Vector3(s * 0.05, 0.065, 0.01), new THREE.Vector3(s * 0.085, 0.05, 0.015)]), 10, 0.0012, 4), cordM); g.add(c); const b = mesh(new THREE.SphereGeometry(0.008, 14, 10), std({ color: 0x3a2a1c, roughness: 0.4 })); b.position.set(s * 0.088, 0.048, 0.016); g.add(b); }
    const rim = mesh(new THREE.TorusGeometry(0.05, 0.003, 6, 32), std({ color: 0x8c2a1c, roughness: 0.6 })); rim.rotation.x = Math.PI / 2; const rim2 = rim.clone(); rim2.position.y = 0.15; g.add(rim, rim2);
    return g;
  },
  // dholak: a barrel drum with rope lacing and rings
  async dholak() {
    const L = 0.42; const pts = []; for (let i = 0; i <= 20; i++) { const t = i / 20; pts.push([0.085 + 0.025 * Math.sin(t * Math.PI) - 0.006 * t, t * L]); }
    const body = mesh(lathe(pts, 48), std({ map: canvasTex(512, 256, (g, w, h) => { g.fillStyle = '#7b3f1c'; g.fillRect(0, 0, w, h); noise(g, w, h, '#5e2e12', '#9b5a2c', [6, 24], 0.55); for (const y of [0.2, 0.5, 0.8]) { g.fillStyle = '#d9a441'; g.fillRect(0, y * h - 4, w, 8); } }), roughness: 0.35 }));
    const skin = std({ color: 0xe6d6b0, roughness: 0.8 }); const a = mesh(new THREE.CircleGeometry(0.085, 32), skin); a.rotation.x = Math.PI / 2; const b = mesh(new THREE.CircleGeometry(0.079, 32), skin); b.rotation.x = -Math.PI / 2; b.position.y = L;
    const rope = []; const n = 22; for (let i = 0; i < n; i++) { const a0 = i / n * Math.PI * 2, a1 = (i + 0.5) / n * Math.PI * 2; rope.push(tube(new THREE.LineCurve3(new THREE.Vector3(Math.cos(a0) * 0.09, 0.01, Math.sin(a0) * 0.09), new THREE.Vector3(Math.cos(a1) * 0.112, L / 2, Math.sin(a1) * 0.112)), 1, 0.0022, 4)); rope.push(tube(new THREE.LineCurve3(new THREE.Vector3(Math.cos(a1) * 0.112, L / 2, Math.sin(a1) * 0.112), new THREE.Vector3(Math.cos(a0 + Math.PI / n * 2) * 0.084, L - 0.01, Math.sin(a0 + Math.PI / n * 2) * 0.084)), 1, 0.0022, 4)); }
    const ropes = mesh(mergeGeometries(rope), std({ color: 0xe9e2cc, roughness: 0.9 }));
    const g = new THREE.Group(); g.add(body, a, b, ropes); g.rotation.z = Math.PI / 2; const w = new THREE.Group(); w.add(g); g.position.set(L / 2, 0.11, 0); return w;
  },
  // bow (dhanush) and arrow (baan)
  async bow() {
    const L = 0.9; const arc = new THREE.QuadraticBezierCurve3(new THREE.Vector3(0, -L / 2, 0), new THREE.Vector3(0.24, 0, 0), new THREE.Vector3(0, L / 2, 0));
    const stave = mesh(tube(arc, 50, (t) => 0.006 + 0.005 * Math.sin(t * Math.PI), 8), std({ map: canvasTex(64, 512, (g, w, h) => { g.fillStyle = '#c99a58'; g.fillRect(0, 0, w, h); noise(g, w, h, '#a87a3c', '#e0b878', [4, 16], 0.5); g.fillStyle = '#5a2c1a'; g.fillRect(0, h * 0.44, w, h * 0.12); }), roughness: 0.5 }));
    const str = mesh(new THREE.CylinderGeometry(0.0009, 0.0009, L, 4), std({ color: 0xf0eadc, roughness: 0.8 })); const g = new THREE.Group(); g.add(stave, str); g.rotation.z = Math.PI / 2; const w = new THREE.Group(); w.add(g); g.position.y = 0.02; return w;
  },
  async arrow() {
    const g = new THREE.Group(); const L = 0.7; const shaft = mesh(new THREE.CylinderGeometry(0.004, 0.004, L, 8), std({ color: 0xc8a06a, roughness: 0.6 })); shaft.rotation.z = Math.PI / 2; g.add(shaft);
    const head = new THREE.Shape(); head.moveTo(0, 0); head.lineTo(-0.05, 0.016); head.lineTo(-0.04, 0); head.lineTo(-0.05, -0.016); head.closePath();
    const hm = mesh(new THREE.ExtrudeGeometry(head, { depth: 0.002, bevelEnabled: true, bevelThickness: 0.001, bevelSize: 0.001, bevelSegments: 1 }), std({ color: 0xb8bcc4, metalness: 0.9, roughness: 0.3 })); hm.position.set(L / 2 + 0.05, 0, -0.001); g.add(hm);
    const fm = std({ color: 0xe8e2d6, roughness: 0.9, side: THREE.DoubleSide }); for (let i = 0; i < 3; i++) { const s = new THREE.Shape(); s.moveTo(0, 0); s.lineTo(0.09, 0); s.lineTo(0.075, 0.018); s.lineTo(0.0, 0.022); s.closePath(); const f = mesh(new THREE.ShapeGeometry(s), i === 0 ? std({ color: 0xc0392b, side: THREE.DoubleSide, roughness: 0.9 }) : fm); f.position.x = -L / 2 + 0.005; f.rotation.x = i * Math.PI * 2 / 3; g.add(f); }
    g.position.y = 0.025; const w = new THREE.Group(); w.add(g); w.rotation.y = 0.3; return w;
  },
  // a brass water tap (nal) with a drop of water
  async tap() {
    const brass = std({ color: 0xc9a14a, metalness: 1, roughness: 0.28 }); const g = new THREE.Group();
    const plate = mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.008, 32), brass); plate.rotation.z = Math.PI / 2; plate.position.set(-0.06, 0.12, 0);
    const pipe = mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.06, 20), brass); pipe.rotation.z = Math.PI / 2; pipe.position.set(-0.03, 0.12, 0);
    const body = mesh(new THREE.SphereGeometry(0.022, 24, 16), brass); body.scale.set(1.3, 1, 1); body.position.set(0.005, 0.12, 0);
    const spout = mesh(tube(new THREE.CatmullRomCurve3([new THREE.Vector3(0.02, 0.12, 0), new THREE.Vector3(0.055, 0.115, 0), new THREE.Vector3(0.07, 0.09, 0), new THREE.Vector3(0.072, 0.07, 0)]), 20, (t) => 0.011 - 0.002 * t, 14), brass);
    const stem = mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.03, 12), brass); stem.position.set(0.005, 0.15, 0);
    const handle = mesh(new THREE.BoxGeometry(0.075, 0.009, 0.014), brass); handle.position.set(0.005, 0.168, 0); handle.rotation.y = 0.5;
    const drop = mesh(new THREE.SphereGeometry(0.0055, 16, 12), std({ color: 0xbfe3ff, roughness: 0.05, transparent: true, opacity: 0.55 })); drop.scale.y = 1.35; drop.position.set(0.072, 0.055, 0);
    g.add(plate, pipe, body, spout, stem, handle, drop); g.userData.tick = (t) => { const k = (t * 0.6) % 1; drop.position.y = 0.06 - k * k * 0.06; drop.visible = k < 0.95; }; return g;
  },
  // lattu: a painted wooden spinning top with a metal tip
  async top() {
    const tex = canvasTex(256, 256, (g, w, h) => { const cols = ['#c0392b', '#f1c40f', '#27ae60', '#2980b9', '#c0392b', '#f1c40f']; cols.forEach((c, i) => { g.fillStyle = c; g.fillRect(0, i * h / cols.length, w, h / cols.length + 1); }); noise(g, w, h, '#000000', '#ffffff', [20, 80], 0.08); });
    const body = mesh(lathe([[0.002, 0.012], [0.018, 0.022], [0.036, 0.045], [0.04, 0.058], [0.036, 0.066], [0.014, 0.072], [0.011, 0.085], [0.006, 0.09], [0.001, 0.091]], 48), std({ map: tex, roughness: 0.3 }));
    const nail = mesh(new THREE.ConeGeometry(0.003, 0.014, 10), std({ color: 0x9ea2a8, metalness: 1, roughness: 0.3 })); nail.rotation.x = Math.PI; nail.position.y = 0.007;
    const g = new THREE.Group(); g.add(body, nail); g.rotation.z = 0.32; const w = new THREE.Group(); w.add(g); g.position.y = 0.004; w.userData.tick = (t) => { g.rotation.y = t * 9; }; return w;
  },
  // a coil of jute rope (rassi)
  async rope() {
    const tex = canvasTex(64, 128, (g, w, h) => { g.fillStyle = '#b08a52'; g.fillRect(0, 0, w, h); for (let y = -w; y < h + w; y += 16) { g.strokeStyle = 'rgba(80,55,25,0.55)'; g.lineWidth = 4; g.beginPath(); g.moveTo(0, y); g.lineTo(w, y + w * 0.9); g.stroke(); g.strokeStyle = 'rgba(230,200,150,0.35)'; g.lineWidth = 3; g.beginPath(); g.moveTo(0, y + 7); g.lineTo(w, y + 7 + w * 0.9); g.stroke(); } noise(g, w, h, '#7a5a30', '#d0aa70', [8, 24], 0.2); }, { repeat: [1, 160] });
    const pts = []; const r0 = 0.03, rT = 0.012; let a = 0, r = r0; for (let layer = 0; layer < 2; layer++) { const turns = 4; for (let i = 0; i < turns * 32; i++) { a += Math.PI * 2 / 32; r = layer === 0 ? r0 + (i / 32) * rT * 2.05 : r0 + rT * 2.05 * turns - (i / 32) * rT * 2.05 - rT; pts.push(new THREE.Vector3(Math.cos(a) * r, rT + layer * rT * 1.85 + 0.002 * Math.sin(a * 3), Math.sin(a) * r)); } }
    for (let k = 1; k <= 6; k++) pts.push(new THREE.Vector3(Math.cos(a) * r + k * 0.022, rT * 2.9 - k * 0.004, Math.sin(a) * r + k * 0.01));
    return new THREE.Group().add(mesh(tube(new THREE.CatmullRomCurve3(pts), pts.length * 3, rT, 9), std({ map: tex, roughness: 0.95 })));
  },
  // a hexagonal wooden block (shatkon)
  async hexagon() {
    const s = new THREE.Shape(); for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; const p = [Math.cos(a) * 0.08, Math.sin(a) * 0.08]; i ? s.lineTo(...p) : s.moveTo(...p); } s.closePath();
    const geo = new THREE.ExtrudeGeometry(s, { depth: 0.022, bevelEnabled: true, bevelThickness: 0.005, bevelSize: 0.005, bevelSegments: 3 }); geo.rotateX(-Math.PI / 2);
    const m = mesh(geo, std({ map: wood(), color: 0xe0b070, roughness: 0.45 })); m.position.y = 0.005; const g = new THREE.Group(); g.add(m); m.rotation.y = 0.2; return g;
  },
  // trishul: a three-pronged steel head on a wooden shaft
  async trishul() {
    const steel = std({ color: 0xbfc3c9, metalness: 1, roughness: 0.25 }); const g = new THREE.Group();
    const shaft = mesh(new THREE.CylinderGeometry(0.008, 0.009, 0.8, 12), std({ color: 0x7a4d24, roughness: 0.5 })); shaft.position.y = 0.4; g.add(shaft);
    const collar = mesh(new THREE.CylinderGeometry(0.014, 0.012, 0.03, 16), steel); collar.position.y = 0.81; g.add(collar);
    const blade = (w, h) => { const s = new THREE.Shape(); s.moveTo(-w, 0); s.quadraticCurveTo(-w * 1.1, h * 0.55, 0, h); s.quadraticCurveTo(w * 1.1, h * 0.55, w, 0); s.closePath(); const ge = new THREE.ExtrudeGeometry(s, { depth: 0.003, bevelEnabled: true, bevelThickness: 0.002, bevelSize: 0.002, bevelSegments: 1 }); ge.translate(0, 0, -0.0015); return ge; };
    const mid = mesh(blade(0.014, 0.17), steel); mid.position.y = 0.82; g.add(mid);
    for (const s of [-1, 1]) { const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0.83, 0), new THREE.Vector3(s * 0.05, 0.84, 0), new THREE.Vector3(s * 0.075, 0.9, 0), new THREE.Vector3(s * 0.07, 0.96, 0)]); g.add(mesh(tube(curve, 30, (t) => 0.007 * (1 - t * 0.85), 8), steel)); }
    const bar = mesh(new THREE.TorusGeometry(0.05, 0.004, 8, 24, Math.PI), steel); bar.position.y = 0.83; bar.rotation.z = Math.PI; bar.scale.y = 0.35; g.add(bar);
    return g;
  },
  // fruits in a basket (phal)
  async fruits() {
    const b = await PROC.basket({ r: 0.16, h: 0.08, shallow: true }); const g = new THREE.Group(); g.add(b);
    const put = async (id, s, x, y, z, rx = 0, ry = 0, rz = 0) => { const { obj } = await model(id); const f = fit(obj, s); f.position.set(x, y, z); f.rotation.set(rx, ry, rz); g.add(f); };
    await Promise.all([put('mango', 0.11, -0.05, 0.035, 0.02, 0, 0.6, 0.2), put('apple', 0.075, 0.06, 0.035, 0.04), put('banana', 0.19, 0.0, 0.07, -0.04, 0.3, 0.3, 0.15), put('pomegranate', 0.075, 0.035, 0.04, -0.06)]);
    return g;
  },
  // a woven cane basket
  async basket(o = {}) {
    const R = o.r || 0.2, H = o.h || 0.16; const tex = canvasTex(512, 256, (g, w, h) => { g.fillStyle = '#7a5428'; g.fillRect(0, 0, w, h); const cw = 32, ch = 16;
      for (let y = 0; y < h; y += ch) for (let x = 0; x < w; x += cw) { const off = ((y / ch) % 2) * cw / 2; const gr = g.createLinearGradient(0, y, 0, y + ch); gr.addColorStop(0, '#b8894c'); gr.addColorStop(0.5, '#e2bb7a'); gr.addColorStop(1, '#9c7038'); g.fillStyle = gr; roundR(g, x + off + 1, y + 1, cw - 2, ch - 2, 6); g.fill(); }
      noise(g, w, h, '#6a4520', '#e9c88f', [16, 64], 0.12); }, { repeat: [6, 2] });
    const m = std({ map: tex, roughness: 0.75, side: THREE.DoubleSide }); const g = new THREE.Group();
    const wall = mesh(lathe([[R * 0.72, 0.004], [R * 0.86, H * 0.3], [R * 0.97, H * 0.75], [R, H]], 48), m); wall.geometry.attributes.uv.array.forEach((v, i, a) => { if (i % 2 === 1) a[i] = v; }); g.add(wall);
    const floor = mesh(new THREE.CircleGeometry(R * 0.72, 40), std({ map: tex, roughness: 0.8 })); floor.rotation.x = -Math.PI / 2; floor.position.y = 0.005; g.add(floor);
    const rim = mesh(new THREE.TorusGeometry(R, 0.009, 10, 48), std({ color: 0x8c6230, roughness: 0.6 })); rim.rotation.x = Math.PI / 2; rim.position.y = H; g.add(rim);
    return g;
  },
  // ---------------- counting things
  async marble() { return mesh(new THREE.SphereGeometry(0.5, 32, 20), marbleMat()); },
  async pencil() { return mesh(pencilGeo(), std({ vertexColors: true, roughness: 0.45 })); },
  async knife() {
    const s = new THREE.Shape(); s.moveTo(0, 0); s.lineTo(0.17, 0); s.quadraticCurveTo(0.2, 0.006, 0.205, 0.03); s.lineTo(0, 0.034); s.closePath();
    const blade = mesh(new THREE.ExtrudeGeometry(s, { depth: 0.0015, bevelEnabled: true, bevelThickness: 0.0006, bevelSize: 0.0008, bevelSegments: 1 }), std({ color: 0xd4d8de, metalness: 1, roughness: 0.18 }));
    const hs = new THREE.Shape(); hs.moveTo(-0.11, 0.004); hs.quadraticCurveTo(-0.115, 0.03, -0.1, 0.032); hs.lineTo(0, 0.031); hs.lineTo(0, 0.004); hs.closePath();
    const handle = mesh(new THREE.ExtrudeGeometry(hs, { depth: 0.012, bevelEnabled: true, bevelThickness: 0.003, bevelSize: 0.003, bevelSegments: 2 }), std({ map: wood(), color: 0x6b4226, roughness: 0.5 })); handle.position.z = -0.006;
    const g = new THREE.Group(); g.add(blade, handle); for (const x of [-0.08, -0.04]) { const r = mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.02, 10), std({ color: 0xd8dde3, metalness: 1, roughness: 0.25 })); r.rotation.x = Math.PI / 2; r.position.set(x, 0.018, 0.0); g.add(r); }
    return g;
  },
  // ---------------- Harappa
  async hpot() { // a red jar painted with black bands, intersecting circles and pipal leaves
    const tex = canvasTex(1024, 512, (g, w, h) => { g.fillStyle = '#a4452a'; g.fillRect(0, 0, w, h); noise(g, w, h, '#8a3620', '#c05a36', [8, 30, 90], 0.45); speckle(g, w, h, 500, 'rgba(60,20,10,0.25)', 0.5, 2);
      const ink = 'rgba(28,16,12,0.92)'; g.fillStyle = ink; for (const [y, t] of [[0.06, 10], [0.2, 6], [0.27, 14], [0.62, 12], [0.68, 5], [0.85, 8]]) g.fillRect(0, y * h, w, t);
      g.strokeStyle = ink; g.lineWidth = 4; const r = 34; for (let x = r; x < w + r; x += r * 1.5) for (const yy of [0.37, 0.52]) { g.beginPath(); g.arc(x, yy * h, r, 0, Math.PI * 2); g.stroke(); }
      for (let x = 30; x < w; x += 128) { g.save(); g.translate(x, 0.13 * h); g.beginPath(); g.moveTo(0, -22); g.quadraticCurveTo(26, -6, 0, 26); g.quadraticCurveTo(-26, -6, 0, -22); g.fill(); g.restore(); }
      for (let x = 0; x < w; x += 22) { g.beginPath(); g.arc(x, 0.765 * h, 11, Math.PI, 0); g.stroke(); } noise(g, w, h, '#5a2010', '#e08a60', [40, 160], 0.08); });
    const prof = [[0.02, 0], [0.06, 0.005], [0.09, 0.04], [0.13, 0.11], [0.155, 0.18], [0.15, 0.23], [0.12, 0.27], [0.085, 0.29], [0.075, 0.30], [0.085, 0.315], [0.092, 0.32], [0.086, 0.322], [0.07, 0.31]];
    const m = mesh(lathe(prof, 56), std({ map: tex, roughness: 0.8, side: THREE.DoubleSide })); return new THREE.Group().add(m);
  },
  async beads() { // a string of long carnelian beads (some etched with white lines) and small round beads
    const etched = canvasTex(256, 64, (g, w, h) => { g.fillStyle = '#b8401c'; g.fillRect(0, 0, w, h); noise(g, w, h, '#9a2c10', '#e06a34', [6, 20], 0.5); g.strokeStyle = 'rgba(250,240,225,0.95)'; g.lineWidth = 5; for (let x = 20; x < w; x += 64) { g.beginPath(); g.arc(x, h / 2, 14, 0, Math.PI * 2); g.stroke(); } g.beginPath(); g.moveTo(0, h / 2); g.lineTo(w, h / 2); g.stroke(); });
    const plain = canvasTex(256, 64, (g, w, h) => { g.fillStyle = '#c24a1e'; g.fillRect(0, 0, w, h); noise(g, w, h, '#8f2a0e', '#ee8040', [4, 12, 30], 0.6); for (let i = 0; i < 6; i++) { g.strokeStyle = 'rgba(255,200,150,0.18)'; g.lineWidth = rr(2, 6); g.beginPath(); g.moveTo(0, rnd() * h); g.lineTo(w, rnd() * h); g.stroke(); } });
    const mA = std({ map: plain, roughness: 0.18, envMapIntensity: 1.4 }), mB = std({ map: etched, roughness: 0.2, envMapIntensity: 1.3 }), mS = std({ color: 0xa83a18, roughness: 0.22 });
    const long = lathe([[0.0012, -0.03], [0.0045, -0.022], [0.0062, 0], [0.0045, 0.022], [0.0012, 0.03]], 18); long.rotateZ(Math.PI / 2);
    const g = new THREE.Group(); const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(-0.11, 0, -0.04), new THREE.Vector3(-0.07, 0, 0.05), new THREE.Vector3(0, 0, 0.085), new THREE.Vector3(0.07, 0, 0.05), new THREE.Vector3(0.11, 0, -0.04)]);
    const n = 15; const thread = mesh(tube(curve, 60, 0.0009, 4), std({ color: 0xd9cdb0, roughness: 0.9 })); thread.position.y = 0.006; g.add(thread);
    for (let i = 0; i < n; i++) { const t = (i + 0.5) / n; const p = curve.getPointAt(t), d = curve.getTangentAt(t); const lg = i % 2 === 0; const b = mesh(lg ? long : new THREE.SphereGeometry(0.0055, 14, 10), lg ? (i % 6 === 2 ? mB : mA) : mS);
      b.position.set(p.x, 0.0062, p.z); b.rotation.y = -Math.atan2(d.z, d.x); if (lg) b.scale.setScalar(rr(0.75, 1.05)); g.add(b); }
    return g;
  },
  async weights() { // cubes of banded chert: each one twice as heavy as the one before (1, 2, 4, 8, 16)
    const tex = canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#c9c1b2'; g.fillRect(0, 0, w, h); for (let y = 0; y < h; y += rr(5, 16)) { g.fillStyle = `rgba(${rnd() < 0.5 ? '120,95,70' : '230,224,212'},${rr(0.15, 0.45)})`; g.fillRect(0, y, w, rr(2, 9)); } noise(g, w, h, '#a89c88', '#e8e2d6', [8, 30], 0.3); speckle(g, w, h, 80, 'rgba(90,70,50,0.4)', 0.5, 1.5); });
    const m = std({ map: tex, roughness: 0.42 }); const g = new THREE.Group(); let x = -0.06;
    for (const k of [1, 2, 4, 8, 16]) { const s = 0.011 * Math.cbrt(k); const geo = new THREE.BoxGeometry(s, s, s, 2, 2, 2); roundBox(geo, s * 0.08); const c = mesh(geo, m); c.position.set(x + s / 2, s / 2, 0); c.rotation.y = rr(-0.3, 0.3); g.add(c); x += s + 0.012; }
    return g;
  },
};
function roundR(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
function roundBox(geo, r) { const p = geo.attributes.position; const v = new THREE.Vector3(); geo.computeBoundingBox(); const h = geo.boundingBox.max.clone(); for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); const c = v.clone().clamp(h.clone().subScalar(r).negate(), h.clone().subScalar(r)); const d = v.clone().sub(c); if (d.length() > 0) v.copy(c.add(d.normalize().multiplyScalar(r))); p.setXYZ(i, v.x, v.y, v.z); } geo.computeVertexNormals(); }
let _mm = null; export function marbleMat() {
  return _mm || (_mm = std({ map: canvasTex(256, 128, (g, w, h) => { g.fillStyle = '#e8f4ff'; g.fillRect(0, 0, w, h); for (let i = 0; i < 5; i++) { g.strokeStyle = `rgba(255,255,255,${0.7})`; g.lineWidth = rr(8, 18); g.beginPath(); g.moveTo(rnd() * w, 0); g.bezierCurveTo(rnd() * w, h * 0.3, rnd() * w, h * 0.7, rnd() * w, h); g.stroke(); } g.globalAlpha = 0.85; g.fillStyle = '#ffffff'; noise(g, w, h, '#b8d0e8', '#ffffff', [6, 20], 0.35); g.globalAlpha = 1; }),
    roughness: 0.06, metalness: 0.0, envMapIntensity: 1.6, transparent: true, opacity: 0.93 }));
}
function pencilGeo() { // a yellow hexagonal pencil: sharpened wood, graphite tip, metal band and pink eraser (one geometry, vertex colours)
  const parts = []; const R = 0.0042, L = 0.15; const col = (geo, c) => { const n = geo.attributes.position.count, a = new Float32Array(n * 3), C = new THREE.Color(c).convertSRGBToLinear(); for (let i = 0; i < n; i++) a.set([C.r, C.g, C.b], i * 3); geo.setAttribute('color', new THREE.BufferAttribute(a, 3)); geo.deleteAttribute('uv'); return geo; };
  const body = new THREE.CylinderGeometry(R, R, L, 6); parts.push(col(body.toNonIndexed(), '#f2c230'));
  const wood_ = new THREE.CylinderGeometry(0.0012, R, 0.018, 6, 1, true); wood_.translate(0, L / 2 + 0.009, 0); parts.push(col(wood_.toNonIndexed(), '#e3b98a'));
  const tip = new THREE.ConeGeometry(0.0012, 0.004, 6); tip.translate(0, L / 2 + 0.018 + 0.002, 0); parts.push(col(tip.toNonIndexed(), '#2a2a2e'));
  const band = new THREE.CylinderGeometry(R * 1.05, R * 1.05, 0.009, 12); band.translate(0, -L / 2 - 0.0045, 0); parts.push(col(band.toNonIndexed(), '#b9bcc2'));
  const er = new THREE.CylinderGeometry(R * 0.98, R * 0.98, 0.008, 12); er.translate(0, -L / 2 - 0.013, 0); parts.push(col(er.toNonIndexed(), '#e98a8f'));
  const g = mergeGeometries(parts); g.rotateZ(Math.PI / 2); g.computeVertexNormals(); return g;
}
