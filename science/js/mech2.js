// Physics (Class 9), part 2: friction on different surfaces, a ball dropped into sand, a calorimeter that cools (Newton's law
// of cooling), a slinky that carries longitudinal and transverse pulses (a real 1D wave simulation), a drum skin with grains
// that jump, a balloon rocket on a thread, a cart pulled up an inclined plank, and two pipes for the reflection of sound.
import * as THREE from 'three';
import { Item } from './apparatus.js';
import { canvasTex, woodTex, glassMat } from './mats.js';

const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const steel = (c = 0x9aa0a6, r = 0.35) => new THREE.MeshStandardMaterial({ color: c, metalness: 0.85, roughness: r });
export const G = 9.8;

// ------------------------------------------------------------------ a board with a surface on top: wood, glass, sandpaper or cloth (static / sliding friction)
export const SURF = { wood: { ms: 0.42, mk: 0.34, en: 'Wooden board', hi: 'लकड़ी का तख़्ता', hg: 'Lakdi ka board' }, glass: { ms: 0.24, mk: 0.19, en: 'Glass sheet', hi: 'काँच की शीट', hg: 'Glass sheet' }, sand: { ms: 0.72, mk: 0.6, en: 'Sandpaper', hi: 'रेगमाल (सैंडपेपर)', hg: 'Sandpaper (regmaal)' }, cloth: { ms: 0.55, mk: 0.47, en: 'Cotton cloth', hi: 'सूती कपड़ा', hg: 'Cotton kapda' } };
export function surfaceBoard(kind = 'wood', o = {}) {
  const S = SURF[kind]; const it = new Item('board', { ...o, name: o.name || { en: S.en, hi: S.hi, hg: S.hg } });
  const L = o.len ?? 0.5, W = 0.12; const base = new THREE.Mesh(new THREE.BoxGeometry(L, 0.012, W), new THREE.MeshStandardMaterial({ map: woodTex('#9a6a3c'), roughness: 0.7 })); base.position.y = 0.006; it.g.add(base);
  let top = 0.012;
  if (kind === 'glass') { const g = new THREE.Mesh(new THREE.BoxGeometry(L - 0.01, 0.004, W - 0.01), glassMat({ opacity: 0.35, edge: 0.9, color: 0xcfeff0 })); g.position.y = 0.014; g.renderOrder = 6; it.g.add(g); top = 0.016; }
  if (kind === 'sand') { const t = canvasTex(256, 256, (x, w, h) => { x.fillStyle = '#b48a55'; x.fillRect(0, 0, w, h); for (let i = 0; i < 9000; i++) { x.fillStyle = `rgba(${60 + Math.random() * 90},${40 + Math.random() * 60},${20 + Math.random() * 30},0.6)`; x.fillRect(Math.random() * w, Math.random() * h, 1.2, 1.2); } }); const s = new THREE.Mesh(new THREE.BoxGeometry(L - 0.01, 0.0015, W - 0.01), new THREE.MeshStandardMaterial({ map: t, roughness: 1 })); s.position.y = 0.0128; it.g.add(s); top = 0.0136; }
  if (kind === 'cloth') { const t = canvasTex(256, 256, (x, w, h) => { x.fillStyle = '#e9e4d8'; x.fillRect(0, 0, w, h); x.strokeStyle = 'rgba(150,140,120,0.35)'; for (let i = 0; i < w; i += 3) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, h); x.stroke(); x.beginPath(); x.moveTo(0, i); x.lineTo(w, i); x.stroke(); } }); const s = new THREE.Mesh(new THREE.BoxGeometry(L - 0.006, 0.002, W - 0.004), new THREE.MeshStandardMaterial({ map: t, roughness: 1 })); s.position.y = 0.013; it.g.add(s); top = 0.014; }
  it.surf = kind; it.ms = S.ms; it.mk = S.mk; it.top = top; it.L = L; it.height = top; it.radius = L / 2; it.grabY = 0.006; it.noGrab = true; return it;
}
// a wooden block with a hook at one end (+x); slotted masses can be stacked on it
export function hookBlock(o = {}) {
  const it = new Item('hblock', { ...o, name: o.name || { en: 'Wooden block with a hook (400 g)', hi: 'हुक लगा लकड़ी का गुटका (400 ग्राम)', hg: 'Hook wala lakdi ka block (400 g)' } });
  const m = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.045, 0.065), new THREE.MeshStandardMaterial({ map: woodTex('#b47a44'), roughness: 0.7 })); m.position.y = 0.0225; it.g.add(m);
  const eye = new THREE.Mesh(new THREE.TorusGeometry(0.005, 0.0012, 6, 14), steel()); eye.rotation.y = Math.PI / 2; eye.position.set(0.055, 0.02, 0); it.g.add(eye);
  it.mass = 0.4; it.hookLocal = V3(0.06, 0.02, 0); it.height = 0.045; it.radius = 0.06; it.grabY = 0.03; return it;
}
export function slottedMass(g = 200, o = {}) {
  const it = new Item('smass', { ...o, name: o.name || { en: `Slotted mass (${g} g)`, hi: `खाँचेदार बाट (${g} ग्राम)`, hg: `Slotted mass (${g} g)` } });
  const h = g >= 200 ? 0.014 : 0.008; const m = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, h, 28), steel(0x8a8f96, 0.45)); m.position.y = h / 2; it.g.add(m);
  const t = canvasTex(128, 32, (x, w, hh) => { x.fillStyle = '#8a8f96'; x.fillRect(0, 0, w, hh); x.fillStyle = '#1b1b1b'; x.font = '700 22px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(`${g} g`, w / 2, hh / 2); });
  const lab = new THREE.Mesh(new THREE.CircleGeometry(0.012, 20), new THREE.MeshStandardMaterial({ map: t, roughness: 0.5 })); lab.rotation.x = -Math.PI / 2; lab.position.y = h + 0.0003; it.g.add(lab);
  it.mass = g / 1000; it.height = h; it.radius = 0.024; it.grabY = h / 2; return it;
}
// ------------------------------------------------------------------ a tray of loose sand; a dropped ball leaves a crater (deeper from a greater height)
export function sandTray(o = {}) {
  const it = new Item('sandtray', { ...o, name: o.name || { en: 'Tray of loose sand', hi: 'भुरभुरी रेत से भरी ट्रे', hg: 'Bhurbhuri ret wali tray' } });
  const W = 0.36, D = 0.26, H = 0.06; const wm = new THREE.MeshStandardMaterial({ map: woodTex('#7a5230'), roughness: 0.75 });
  for (const [w, d, x, z] of [[W, 0.012, 0, D / 2], [W, 0.012, 0, -D / 2], [0.012, D, W / 2, 0], [0.012, D, -W / 2, 0]]) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, H, d), wm); m.position.set(x, H / 2, z); it.g.add(m); }
  const fl = new THREE.Mesh(new THREE.BoxGeometry(W, 0.006, D), wm); fl.position.y = 0.003; it.g.add(fl);
  const tex = canvasTex(512, 512, (x, w, h) => { x.fillStyle = '#d8bf8c'; x.fillRect(0, 0, w, h); for (let i = 0; i < 26000; i++) { const c = 150 + Math.random() * 80; x.fillStyle = `rgba(${c},${c * 0.82},${c * 0.55},0.55)`; x.fillRect(Math.random() * w, Math.random() * h, 1.3, 1.3); } });
  const N = 96; const geo = new THREE.PlaneGeometry(W - 0.012, D - 0.012, N, Math.round((N * D) / W)); geo.rotateX(-Math.PI / 2); const sm = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: tex, roughness: 1 })); sm.position.y = H - 0.008; sm.receiveShadow = true; it.g.add(sm);
  it.surfY = H - 0.008; it.craters = [];
  // a crater at local (x, z): depth d, radius r, with a raised rim
  it.crater = (x, z, d, r) => { const p = geo.attributes.position; for (let i = 0; i < p.count; i++) { const dx = p.getX(i) - x, dz = p.getZ(i) - z; const q = Math.hypot(dx, dz) / r; let h = 0; if (q < 1) h = -d * (1 - q * q); else if (q < 1.6) h = d * 0.22 * Math.sin(((q - 1) / 0.6) * Math.PI); p.setY(i, p.getY(i) + h); } p.needsUpdate = true; geo.computeVertexNormals(); it.craters.push({ x, z, d, r }); };
  it.height = H; it.radius = W / 2; it.grabY = H / 2; it.noGrab = true; return it;
}
export function heavyBall(o = {}) {
  const it = new Item('hball', { ...o, name: o.name || { en: 'Heavy ball (500 g)', hi: 'भारी गेंद (500 ग्राम)', hg: 'Bhaari ball (500 g)' } });
  const r = 0.032; const m = new THREE.Mesh(new THREE.SphereGeometry(r, 32, 22), new THREE.MeshStandardMaterial({ color: 0x3b3f45, metalness: 0.7, roughness: 0.35 })); m.position.y = r; it.g.add(m);
  it.r = r; it.mass = 0.5; it.height = 2 * r; it.radius = r; it.grabY = r; return it;
}
// ------------------------------------------------------------------ a calorimeter (copper cup in an insulating jacket) with a lid, a stirrer and a thermometer; it cools by Newton's law
export function calorimeter(o = {}) {
  const it = new Item('calorimeter', { ...o, name: o.name || { en: 'Calorimeter with stirrer and thermometer', hi: 'विलोडक और तापमापी सहित कैलोरीमीटर', hg: 'Stirrer aur thermometer wala calorimeter' } });
  const jacket = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.12, 40, 1, true), new THREE.MeshStandardMaterial({ color: 0x5b4636, roughness: 0.85, side: THREE.DoubleSide })); jacket.position.y = 0.06; it.g.add(jacket);
  const jb = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.01, 40), new THREE.MeshStandardMaterial({ color: 0x5b4636, roughness: 0.85 })); jb.position.y = 0.005; it.g.add(jb);
  const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.042, 0.1, 40, 1, true), new THREE.MeshStandardMaterial({ color: 0xc8743a, metalness: 0.9, roughness: 0.3, side: THREE.DoubleSide })); cup.position.y = 0.065; it.g.add(cup);
  const water = new THREE.Mesh(new THREE.CircleGeometry(0.041, 40), new THREE.MeshStandardMaterial({ color: 0x9fc6e8, roughness: 0.1, transparent: true, opacity: 0.75 })); water.rotation.x = -Math.PI / 2; water.position.y = 0.095; it.g.add(water);
  const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.063, 0.063, 0.008, 40), new THREE.MeshStandardMaterial({ map: woodTex('#4a3a2c'), roughness: 0.8 })); lid.position.y = 0.124; it.g.add(lid);
  const st = new THREE.Group(); st.position.set(0.02, 0.128, 0); it.g.add(st); const sr = new THREE.Mesh(new THREE.CylinderGeometry(0.0015, 0.0015, 0.13, 8), steel(0xc8743a, 0.3)); sr.position.y = -0.02; st.add(sr); const ring = new THREE.Mesh(new THREE.TorusGeometry(0.008, 0.0012, 6, 16), steel(0xc8743a, 0.3)); ring.position.y = 0.045; ring.rotation.x = Math.PI / 2; st.add(ring);
  // the thermometer: a glass stem with a red column and a scale −10 … 110 °C
  const th = new THREE.Group(); th.position.set(-0.018, 0.128, 0.004); it.g.add(th);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.0035, 0.0035, 0.26, 12), glassMat({ opacity: 0.35, edge: 0.8 })); stem.position.y = 0.05; stem.renderOrder = 6; th.add(stem);
  const sc = canvasTex(64, 1024, (x, w, h) => { x.fillStyle = '#f7f4ea'; x.fillRect(0, 0, w, h); x.fillStyle = '#1b1b1b'; for (let t = -10; t <= 110; t++) { const y = h - 40 - ((t + 10) / 120) * (h - 80); const L = t % 10 === 0 ? 30 : t % 5 === 0 ? 20 : 11; x.fillRect(0, y - 1, L, 2); if (t % 10 === 0) { x.font = '600 18px sans-serif'; x.fillText(String(t), 32, y + 6); } } });
  const card = new THREE.Mesh(new THREE.PlaneGeometry(0.0075, 0.24), new THREE.MeshStandardMaterial({ map: sc, roughness: 0.6 })); card.position.set(0, 0.06, -0.001); th.add(card);
  const colM = new THREE.MeshBasicMaterial({ color: 0xc0281e }); const col = new THREE.Mesh(new THREE.CylinderGeometry(0.0009, 0.0009, 1, 6), colM); th.add(col); const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.0032, 10, 8), colM); bulb.position.y = -0.078; th.add(bulb);
  const y0 = 0.06 - 0.12 + (40 / 1024) * 0.24, ys = ((1024 - 80) / 1024) * 0.24; // where −10 °C and the full scale are on the stem
  it.T = 30; it.room = 30; it.k = 0.02504 / 60; it.heating = false; it.stirT = 0;
  it.update = (dt) => { const l = (it.lab && it.lab.chem && it.lab.chem.lapse) || 1; const h = dt * l; if (it.heating) it.T += Math.min(0.6 * h, 75 - it.T); else it.T += (it.room - it.T) * (1 - Math.exp(-it.k * h)); const top = y0 + ((it.T + 10) / 120) * ys; const bot = -0.075; col.scale.y = Math.max(0.001, top - bot); col.position.y = (top + bot) / 2; if (it.stirT > 0) { it.stirT -= dt; st.position.y = 0.128 + Math.abs(Math.sin(it.stirT * 9)) * 0.012; } };
  it.read = () => Math.round(it.T * 2) / 2; it.height = 0.13; it.radius = 0.065; it.grabY = 0.06; return it;
}
// ------------------------------------------------------------------ a slinky stretched along the table: N coils, a 2D wave on a chain (along x: longitudinal, along z: transverse)
export function slinky(o = {}) {
  const it = new Item('slinky', { ...o, name: o.name || { en: 'Slinky (a long soft spring)', hi: 'स्लिंकी (लंबी नरम कमानी)', hg: 'Slinky (lambi soft spring)' } });
  const n = o.n ?? 90, L = o.len ?? 1.2, R = 0.032; const dx = L / (n - 1);
  const geo = new THREE.TorusGeometry(R, 0.0011, 5, 28); const mat = steel(0xc8ccd2, 0.25); const im = new THREE.InstancedMesh(geo, mat, n); im.frustumCulled = false; it.g.add(im);
  const mark = new THREE.Mesh(new THREE.TorusGeometry(R + 0.0015, 0.0022, 6, 28), new THREE.MeshStandardMaterial({ color: 0xd32f2f, roughness: 0.5 })); it.g.add(mark); it.markI = o.mark ?? Math.round(n * 0.45);
  const ux = new Float32Array(n), vx = new Float32Array(n), uz = new Float32Array(n), vz = new Float32Array(n); const c = o.c ?? 1.6; // pulse speed, m/s
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI / 2, 0)), s = V3(1, 1, 1), p = V3(0, 0, 0);
  it.n = n; it.dx = dx; it.ux = ux; it.uz = uz; it.drive = null; // drive(t) → [ux0, uz0] moves the free end (coil 0)
  it.t = 0;
  it.update = (dt) => {
    const k = (c * c) / (dx * dx); let rem = Math.min(dt, 0.05);
    while (rem > 1e-6) { const h = Math.min(rem, 0.6 * dx / c); it.t += h;
      if (it.drive) { const [a, b] = it.drive(it.t); ux[0] = a; uz[0] = b; vx[0] = 0; vz[0] = 0; }
      for (let i = 1; i < n - 1; i++) { vx[i] += h * (k * (ux[i - 1] - 2 * ux[i] + ux[i + 1]) - 0.4 * vx[i]); vz[i] += h * (k * (uz[i - 1] - 2 * uz[i] + uz[i + 1]) - 0.4 * vz[i]); }
      for (let i = 1; i < n - 1; i++) { ux[i] += h * vx[i]; uz[i] += h * vz[i]; } ux[n - 1] = 0; uz[n - 1] = 0; rem -= h; } // the far end is held fixed
    for (let i = 0; i < n; i++) { p.set(-L / 2 + i * dx + ux[i], R + 0.001, uz[i]); m4.compose(p, q, s); im.setMatrixAt(i, m4); if (i === it.markI) { mark.position.copy(p); mark.quaternion.copy(q); } }
    im.instanceMatrix.needsUpdate = true;
  };
  it.endWorld = (i = 0) => it.g.localToWorld(V3(-L / 2 + i * dx + ux[i], R, uz[i]));
  it.L = L; it.height = 2 * R; it.radius = L / 2; it.grabY = R; it.noGrab = true; return it;
}
// ------------------------------------------------------------------ a drum: a tin with a rubber sheet stretched over its mouth; grains on it jump when it vibrates
export function drum(o = {}) {
  const it = new Item('drum', { ...o, name: o.name || { en: 'Tin with a stretched rubber sheet and grains', hi: 'तनी हुई रबर शीट वाला डिब्बा और दाने', hg: 'Tani hui rubber sheet wala dabba aur daane' } });
  const r = 0.06, h = 0.13; const can = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 40, 1, true), new THREE.MeshStandardMaterial({ color: 0xb8bec4, metalness: 0.85, roughness: 0.3, side: THREE.DoubleSide })); can.position.y = h / 2; it.g.add(can);
  const sheet = new THREE.Mesh(new THREE.CircleGeometry(r + 0.002, 40), new THREE.MeshStandardMaterial({ color: 0xd9472b, roughness: 0.6 })); sheet.rotation.x = -Math.PI / 2; sheet.position.y = h + 0.0005; it.g.add(sheet);
  const band = new THREE.Mesh(new THREE.TorusGeometry(r + 0.002, 0.002, 6, 40), new THREE.MeshStandardMaterial({ color: 0x1b1b1b, roughness: 0.6 })); band.rotation.x = Math.PI / 2; band.position.y = h - 0.008; it.g.add(band);
  const n = 160; const gm = new THREE.InstancedMesh(new THREE.SphereGeometry(0.0013, 5, 4), new THREE.MeshStandardMaterial({ color: 0xe8d9a8, roughness: 0.9 }), n); gm.frustumCulled = false; it.g.add(gm);
  const P = []; for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, q = Math.sqrt(Math.random()) * r * 0.85; P.push({ x: Math.cos(a) * q, z: Math.sin(a) * q, y: 0, v: 0 }); }
  const m4 = new THREE.Matrix4(); it.amp = 0; // vibration of the sheet (0 … 1)
  it.update = (dt) => { it.amp *= Math.exp(-dt / 0.6); for (let i = 0; i < n; i++) { const g = P[i]; if (g.y <= 0 && it.amp > 0.12) { const rr = Math.hypot(g.x, g.z) / r; g.v = (0.25 + Math.random() * 0.55) * it.amp * (1 - rr * rr) * 1.2; } g.v -= G * dt; g.y = Math.max(0, g.y + g.v * dt); if (g.y === 0) g.v = 0; m4.makeTranslation(g.x, h + 0.0015 + g.y, g.z); gm.setMatrixAt(i, m4); } gm.instanceMatrix.needsUpdate = true; };
  it.height = h; it.radius = r; it.grabY = h / 2; return it;
}
// ------------------------------------------------------------------ a balloon rocket: a straw on a long thread with a balloon taped under it
export function balloonRocket(o = {}) {
  const it = new Item('brocket', { ...o, name: o.name || { en: 'Balloon taped to a straw on a thread', hi: 'धागे पर स्ट्रॉ से चिपका गुब्बारा', hg: 'Dhaage par straw se chipka balloon' } });
  const straw = new THREE.Mesh(new THREE.CylinderGeometry(0.0035, 0.0035, 0.08, 12, 1, true), new THREE.MeshStandardMaterial({ color: 0xf2f2f2, roughness: 0.4, side: THREE.DoubleSide })); straw.rotation.z = Math.PI / 2; it.g.add(straw);
  const bal = new THREE.Group(); bal.position.y = -0.006; it.g.add(bal); const bm = new THREE.MeshPhysicalMaterial({ color: 0xd83a3a, roughness: 0.25, clearcoat: 0.6, transparent: true, opacity: 0.95 });
  const body = new THREE.Mesh(new THREE.SphereGeometry(1, 28, 18), bm); bal.add(body); const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.005, 0.016, 10), bm); neck.rotation.z = Math.PI / 2; bal.add(neck);
  for (const s of [-1, 1]) { const tp = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.0006, 0.014), new THREE.MeshStandardMaterial({ color: 0xe8e2c8, roughness: 0.6, transparent: true, opacity: 0.8 })); tp.position.set(s * 0.02, -0.0035, 0); it.g.add(tp); }
  it.air = 0; // 0 … 1, how full
  it.setAir = (a) => { it.air = a; const R = 0.008 + 0.05 * Math.cbrt(a); body.scale.set(R * 1.35, R, R); body.position.set(R * 0.35, -R, 0); neck.position.set(-R + R * 0.35 - 0.006, -R * 0.75, 0); };
  it.setAir(0); it.height = 0.01; it.radius = 0.05; it.grabY = 0; it.noRest = true; return it;
}
// ------------------------------------------------------------------ an inclined plank on a stack of books, and a toy cart
export function inclinePlank(o = {}) {
  const it = new Item('incline', { ...o, name: o.name || { en: 'Plank on a stack of books (inclined plane)', hi: 'किताबों पर रखा तख़्ता (आनत तल)', hg: 'Kitaabon par rakha plank (inclined plane)' } });
  const L = o.len ?? 0.8, h = o.h ?? 0.4; const ang = Math.asin(h / L);
  const books = [0xb3262b, 0x2e6da4, 0x2e7d4f, 0xc9a24a, 0x6a4c93]; let y = 0; let i = 0; while (y < h - 0.002) { const t = Math.min(0.04, h - y); const b = new THREE.Mesh(new THREE.BoxGeometry(0.16, t, 0.22), new THREE.MeshStandardMaterial({ color: books[i++ % 5], roughness: 0.75 })); b.position.set(L * Math.cos(ang) / 2 + 0.06, y + t / 2, 0); it.g.add(b); y += t; }
  const pl = new THREE.Group(); pl.position.set(-L * Math.cos(ang) / 2, 0, 0); pl.rotation.z = ang; it.g.add(pl);
  const pm = new THREE.Mesh(new THREE.BoxGeometry(L, 0.014, 0.15), new THREE.MeshStandardMaterial({ map: woodTex('#a77445'), roughness: 0.7 })); pm.position.set(L / 2, 0.007, 0); pl.add(pm);
  it.plank = pl; it.ang = ang; it.L = L; it.h = h; it.at = (s) => pl.localToWorld(V3(s, 0.014, 0)); // a point on the plank, s metres from its lower end
  it.height = h; it.radius = L / 2; it.grabY = 0.01; it.noGrab = true; return it;
}
export function toyCart(o = {}) {
  const it = new Item('cart', { ...o, name: o.name || { en: 'Toy cart (500 g)', hi: 'खिलौना गाड़ी (500 ग्राम)', hg: 'Toy cart (500 g)' } });
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.03, 0.07), new THREE.MeshStandardMaterial({ color: 0x2f6fb3, roughness: 0.45 })); body.position.y = 0.027; it.g.add(body);
  const load = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.025, 0.05), new THREE.MeshStandardMaterial({ color: 0x5b5f66, metalness: 0.7, roughness: 0.4 })); load.position.y = 0.054; it.g.add(load);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.008, 18), new THREE.MeshStandardMaterial({ color: 0x1b1b1b, roughness: 0.7 })); w.rotation.x = Math.PI / 2; w.position.set(sx * 0.042, 0.012, sz * 0.04); it.g.add(w); }
  const eye = new THREE.Mesh(new THREE.TorusGeometry(0.004, 0.001, 6, 12), steel()); eye.rotation.y = Math.PI / 2; eye.position.set(0.064, 0.027, 0); it.g.add(eye);
  it.mass = 0.5; it.hookLocal = V3(0.068, 0.027, 0); it.height = 0.067; it.radius = 0.07; it.grabY = 0.04; return it;
}
// ------------------------------------------------------------------ two pipes on the table pointing at a hard board; a ticking clock at one, the ear at the other
export function soundPipe(o = {}) {
  const it = new Item('pipe', { ...o, name: o.name || { en: 'Plastic pipe', hi: 'प्लास्टिक का पाइप', hg: 'Plastic pipe' } });
  const L = o.len ?? 0.4; const m = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, L, 28, 1, true), new THREE.MeshStandardMaterial({ color: 0x9a9fa6, roughness: 0.5, side: THREE.DoubleSide })); m.rotation.z = Math.PI / 2; m.position.set(L / 2, 0.022, 0); it.g.add(m);
  for (const s of [0, 1]) { const st = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.012, 0.05), new THREE.MeshStandardMaterial({ map: woodTex('#8a5a33'), roughness: 0.7 })); st.position.set(0.05 + s * (L - 0.1), 0.006, 0); it.g.add(st); }
  it.L = L; it.height = 0.044; it.radius = L / 2; it.grabY = 0.022; return it; // the pipe runs from the item's origin along local +x
}
export function hardBoard(o = {}) {
  const it = new Item('hboard', { ...o, name: o.name || { en: 'Hard board (reflecting surface)', hi: 'कठोर बोर्ड (परावर्तक सतह)', hg: 'Hard board (reflecting surface)' } });
  const m = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.16, 0.012), new THREE.MeshStandardMaterial({ map: woodTex('#6b4a2e'), roughness: 0.6 })); m.position.y = 0.08; it.g.add(m);
  const ft = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.012, 0.06), new THREE.MeshStandardMaterial({ map: woodTex('#6b4a2e'), roughness: 0.6 })); ft.position.set(0, 0.006, 0.02); it.g.add(ft);
  it.height = 0.16; it.radius = 0.15; it.grabY = 0.08; return it;
}
export function tickClock(o = {}) {
  const it = new Item('clock', { ...o, name: o.name || { en: 'Ticking clock', hi: 'टिक-टिक करती घड़ी', hg: 'Tik-tik karti ghadi' } });
  const b = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.012, 32), new THREE.MeshStandardMaterial({ color: 0xc0392b, roughness: 0.4 })); b.rotation.x = Math.PI / 2; b.position.y = 0.03; it.g.add(b);
  const f = canvasTex(128, 128, (x, w, h) => { x.fillStyle = '#fbf8ef'; x.beginPath(); x.arc(64, 64, 62, 0, 6.29); x.fill(); x.strokeStyle = '#1b1b1b'; x.lineWidth = 3; for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; x.beginPath(); x.moveTo(64 + Math.cos(a) * 54, 64 + Math.sin(a) * 54); x.lineTo(64 + Math.cos(a) * 46, 64 + Math.sin(a) * 46); x.stroke(); } x.lineWidth = 4; x.beginPath(); x.moveTo(64, 64); x.lineTo(64, 26); x.moveTo(64, 64); x.lineTo(92, 64); x.stroke(); });
  const face = new THREE.Mesh(new THREE.CircleGeometry(0.022, 32), new THREE.MeshStandardMaterial({ map: f, roughness: 0.4 })); face.position.set(0, 0.03, 0.0062); it.g.add(face);
  for (const s of [-1, 1]) { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.002, 0.002, 0.012, 8), steel()); l.position.set(s * 0.015, 0.006, 0); l.rotation.z = s * 0.4; it.g.add(l); }
  it.on = false; it.gain = 0.1; it.audio = null; let ph = 0;
  it.update = (dt) => { if (!it.on) return; ph += dt; if (ph >= 0.5) { ph -= 0.5; const a = it.audio; if (a && a.tone && it.gain > 0.0015) { a.tone(3100, 0.03, it.gain, 'square'); a.tone(1700, 0.025, it.gain * 0.5, 'sine'); } } };
  it.height = 0.055; it.radius = 0.026; it.grabY = 0.03; return it;
}
