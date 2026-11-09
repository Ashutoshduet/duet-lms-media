// Batch 6 apparatus (Class 10 book and lab-manual experiments): lather (foam) in a tube, a floating oil or ester layer,
// frost on a very cold beaker, water droplets that condense inside a heated tube, a thistle funnel, small dishes of
// burning naphthalene / camphor / alcohol, a plate that catches soot, metal pieces held in a flame, sparks of burning
// iron filings, cloth strips that smell of onion, a 15 cm scale, a black paper cover and a cake of home-made soap.
import * as THREE from 'three';
import { Item, Vessel, flame } from './apparatus.js';
import { candleFlame } from './apparatus3.js';
import { glassMat, canvasTex } from './mats.js';

const V2 = (r, y) => new THREE.Vector2(r, y);
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3();
const steel = (c = 0xc4c8cc, r = 0.3) => new THREE.MeshStandardMaterial({ color: c, metalness: 0.85, roughness: r });
const rnd = (a, b) => a + Math.random() * (b - a);
const hook = (v, fn) => { const u0 = v.update.bind(v); v.update = (dt, t) => { u0(dt, t); fn(dt, t); }; }; // run extra drawing after the vessel's own update each frame

// ------------------------------------------------------------------ lather: a column of white foam above the liquid
function foamTex() {
  return canvasTex(256, 256, (x, w, h) => {
    x.fillStyle = '#f4f6f6'; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 520; i++) { const r = rnd(3, 13); const px = rnd(0, w), py = rnd(0, h); const g = x.createRadialGradient(px - r * 0.3, py - r * 0.3, r * 0.1, px, py, r); g.addColorStop(0, 'rgba(255,255,255,0.95)'); g.addColorStop(0.75, 'rgba(236,240,242,0.6)'); g.addColorStop(1, 'rgba(170,182,190,0.75)'); x.fillStyle = g; x.beginPath(); x.arc(px, py, r, 0, 6.29); x.fill(); }
  }, { repeat: [2, 1] });
}
export function foam(v) {
  const tex = foamTex(); tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  const m = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 28), new THREE.MeshStandardMaterial({ map: tex, color: 0xffffff, roughness: 0.75, transparent: true, opacity: 0.96 }));
  m.visible = false; m.userData.noHit = true; m.renderOrder = 5; v.g.add(m); v.foam = 0;
  v.setFoam = (h) => { v.foam = h; if (h < 0.0008) { m.visible = false; return; } const y0 = v.heightFor(v.ml); const r = v.rInner(Math.min(v.rimY - 0.002, y0 + h * 0.5)) - 0.0003; m.visible = true; m.scale.set(r, h, r); m.position.y = y0 + h / 2; tex.repeat.set(2, Math.max(0.3, h / 0.02)); };
  return m;
}
// ------------------------------------------------------------------ a layer of oil (or ester) floating on water; it breaks up while the tube is shaken
export function floatLayer(v, subs, color = 0xe0b84a) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 32), new THREE.MeshPhysicalMaterial({ color, roughness: 0.08, transparent: true, opacity: 0.62, clearcoat: 1, depthWrite: false }));
  m.visible = false; m.userData.noHit = true; m.renderOrder = 5; v.g.add(m);
  const upd = () => {
    const mix = v.mix; if (!mix) return; let oil = 0; for (const s of subs) oil += mix.liq[s] || 0; oil *= 1 - Math.min(1, v.emul || 0);
    if (oil < 0.02 || v.ml < 0.05) { m.visible = false; return; }
    const top = v.heightFor(v.ml), bot = v.heightFor(Math.max(0, v.ml - oil)); const r = v.rInner(top) - 0.0003; m.visible = true;
    m.scale.set(r, Math.max(0.0006, top - bot), r); m.position.y = (top + bot) / 2;
  };
  hook(v, upd); return m;
}
// ------------------------------------------------------------------ frost: a very cold beaker gets a white coat of ice from the moist air
export function frost(v) {
  const tex = canvasTex(256, 256, (x, w, h) => { x.clearRect(0, 0, w, h); for (let i = 0; i < 2600; i++) { x.fillStyle = `rgba(255,255,255,${rnd(0.25, 0.9).toFixed(2)})`; const s = rnd(1, 3.2); x.fillRect(rnd(0, w), rnd(0, h), s, s); } });
  const prof = v.outer.map((p) => V2(p.x + 0.0007, p.y)).filter((p) => p.y < v.rimY * 0.7);
  const m = new THREE.Mesh(new THREE.LatheGeometry(prof, 36), new THREE.MeshStandardMaterial({ map: tex, color: 0xffffff, transparent: true, opacity: 0, roughness: 0.9, depthWrite: false }));
  m.renderOrder = 7; m.userData.noHit = true; v.g.add(m); v.mist = 0;
  v.setMist = (k) => { v.mist = k; m.material.opacity = 0.85 * k; };
  return m;
}
// ------------------------------------------------------------------ water droplets that condense on the cooler upper part inside a heated tube
export function droplets(v, o = {}) {
  const N = o.n ?? 40; const geo = new THREE.SphereGeometry(1, 8, 6);
  const im = new THREE.InstancedMesh(geo, new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.02, transparent: true, opacity: 0.6, clearcoat: 1, depthWrite: false }), N);
  im.renderOrder = 7; im.userData.noHit = true; im.count = 0; v.g.add(im);
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), S = new THREE.Vector3(); const pts = [];
  for (let i = 0; i < N; i++) { const y = v.rimY * rnd(o.lo ?? 0.55, o.hi ?? 0.92); const r = v.rInner(y) - 0.0006; const a = rnd(0, 6.29); pts.push([Math.cos(a) * r, y, Math.sin(a) * r, rnd(0.0004, 0.0009)]); }
  hook(v, () => { const n = Math.round(N * Math.min(1, v.condense || 0)); if (n === im.count) return; for (let i = 0; i < n; i++) { const p = pts[i]; M.compose(S.set(p[0], p[1], p[2]), Q, tmp.setScalar(p[3])); im.setMatrixAt(i, M); } im.count = n; im.instanceMatrix.needsUpdate = true; });
  return im;
}
// ------------------------------------------------------------------ a thistle funnel: acid poured in runs down its long stem into the flask
export function thistleFunnel(o = {}) {
  const stem = o.stem ?? 0.16; const prof = [[0.0028, 0], [0.0028, stem], [0.006, stem + 0.004], [0.012, stem + 0.012], [0.0135, stem + 0.022], [0.012, stem + 0.03], [0.0095, stem + 0.034]];
  const v = new Vessel('thistle', prof, { ...o, wall: 0.0008, name: o.name || { en: 'Thistle funnel', hi: 'थिसिल कीप', hg: 'Thistle funnel' }, cap: 6 });
  v.drainFast = true; v.grabY = stem + 0.015; v.noGrab = true; return v;
}
// ------------------------------------------------------------------ a small steel dish with a substance that burns; sooty (yellow, smoky) or clean (blue)
const BURN = { naph: { sooty: true, size: 1.5 }, camphor: { sooty: true, size: 1.35 }, ethanol: { sooty: false, size: 1 } };
export function burnDish(chem, o = {}) {
  const it = new Item('burncap', { ...o, name: o.name || { en: 'Steel cap', hi: 'स्टील का ढक्कन', hg: 'Steel cap' } });
  const cup = new THREE.Mesh(new THREE.LatheGeometry([V2(0.0001, 0), V2(0.016, 0), V2(0.017, 0.009), V2(0.0175, 0.0095)], 32), new THREE.MeshStandardMaterial({ color: 0xc9cdd1, metalness: 0.85, roughness: 0.3, side: THREE.DoubleSide })); it.g.add(cup);
  const B = BURN[chem] || BURN.ethanol; let fuel;
  if (chem === 'ethanol') { fuel = new THREE.Mesh(new THREE.CylinderGeometry(0.0155, 0.0155, 0.004, 28), new THREE.MeshPhysicalMaterial({ color: 0xe8f4ff, transparent: true, opacity: 0.45, roughness: 0.03, clearcoat: 1 })); fuel.position.y = 0.0035; }
  else { fuel = new THREE.Mesh(new THREE.SphereGeometry(0.009, 16, 10, 0, 6.29, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xf6f6f2, roughness: 0.7 })); fuel.scale.set(1, 0.55, 1); fuel.position.y = 0.0012; }
  fuel.userData.noHit = true; it.g.add(fuel);
  let f; if (B.sooty) { f = candleFlame(); f.scale.setScalar(B.size * 1.6); } else { f = flame('spirit'); f.scale.set(1.5, 1.1, 1.5); f.traverse((q) => { if (q.material?.uniforms?.c2) q.material.uniforms.c2.value.setHex(0x5a7cff); }); }
  f.position.y = 0.006; f.visible = false; it.g.add(f);
  it.chem = chem; it.sooty = B.sooty; it.fuel = 1; it.lit = false; it.heatPoint = V3(0, 0.03, 0); it.flameTop = 0.075; it.height = 0.01; it.radius = 0.018; it.grabY = 0.006;
  it.setLit = (on) => { it.lit = on && it.fuel > 0; f.visible = it.lit; };
  it.update = (dt, t) => {
    if (!it.lit) return; it.fuel = Math.max(0, it.fuel - dt * 0.008 * (it.lab?.chem?.lapse ?? 1)); fuel.scale.y = (chem === 'ethanol' ? 1 : 0.55) * Math.max(0.1, it.fuel);
    if (B.sooty) f.userData.tick(t, B.size * 1.6, 1.4); else f.userData.tick(t);
    if (B.sooty && it.lab && Math.random() < dt * 9) { const p = it.g.localToWorld(tmp.set(rnd(-0.003, 0.003), 0.012 + 0.07 * B.size, 0)); it.lab.fx.puff(p, Math.random() < 0.7 ? '#1d1b19' : '#3a3632', { alpha: 0.42, size: 0.006, grow: 0.05, life: 2.4, up: 0.09 }); }
    if (it.fuel <= 0) it.setLit(false);
  };
  return it;
}
// ------------------------------------------------------------------ a metal plate (held with tongs) that collects soot over a smoky flame
export function sootPlate(o = {}) {
  const it = new Item('plate', { ...o, name: o.name || { en: 'Metal plate', hi: 'धातु की प्लेट', hg: 'Metal plate' } });
  const c = document.createElement('canvas'); c.width = 128; c.height = 128; const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, map: tex, metalness: 0.6, roughness: 0.35 });
  const m = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.0015, 0.05), mat); m.position.y = 0.00075; it.g.add(m);
  const hdl = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.003, 0.008), steel(0x8a8f95)); hdl.position.set(0.062, 0.0015, 0); it.g.add(hdl);
  it.soot = 0; let drawn = -1;
  it.draw = () => { const x = c.getContext('2d'); x.fillStyle = '#c9cdd1'; x.fillRect(0, 0, 128, 128); const g = x.createLinearGradient(0, 0, 128, 128); g.addColorStop(0, 'rgba(255,255,255,0.25)'); g.addColorStop(1, 'rgba(0,0,0,0.12)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128);
    if (it.soot > 0.01) { const r = x.createRadialGradient(64, 64, 4, 64, 64, 30 + 30 * it.soot); r.addColorStop(0, `rgba(18,16,15,${Math.min(0.97, it.soot * 1.2).toFixed(2)})`); r.addColorStop(0.6, `rgba(28,25,22,${Math.min(0.8, it.soot * 0.9).toFixed(2)})`); r.addColorStop(1, 'rgba(40,36,32,0)'); x.fillStyle = r; x.fillRect(0, 0, 128, 128); }
    tex.needsUpdate = true; };
  it.draw();
  it.centerLocal = V3(0, 0, 0);
  it.flameTest = (dt, f, hp) => { if (!f.lit) return; const sooty = f.sooty || (f.kind === 'bunsen' && f.airClosed) || f.kind === 'candle'; const p = it.g.localToWorld(tmp.set(0, 0, 0)); const top = f.g.localToWorld(tmp2.set(0, f.flameTop ?? 0.08, 0)); const d = Math.hypot(p.x - hp.x, p.z - hp.z); if (d > 0.03 || p.y < hp.y - 0.01 || p.y > top.y + 0.05) return; it.over = { f, sooty }; if (sooty) it.soot = Math.min(1, it.soot + dt * 0.18); };
  it.update = () => { if (Math.abs(it.soot - drawn) > 0.02) { drawn = it.soot; it.draw(); if (it.soot > 0.4 && !it.sootEv) { it.sootEv = true; it.lab && it.lab.emit('soot', { obj: it.id }); } } };
  it.height = 0.003; it.radius = 0.04; it.grabY = 0.002; it.layH = 0.0015; return it;
}
// ------------------------------------------------------------------ the luminous (air hole closed) flame of a Bunsen burner
export function lumFlame() { const g = new THREE.Group(); const f = candleFlame(); g.add(f); g.scale.set(1, 1.35, 1); g.userData.tick = (t) => f.userData.tick(t, 2.3, 1.8); return g; }
// ------------------------------------------------------------------ a piece of metal (copper strip, aluminium foil, zinc strip) that is held in a flame
const METAL = {
  cu: { c: 0xc06a3e, shine: 0xd98a5a, w: 0.008, h: 0.05, d: 0.0006, name: { en: 'Copper strip', hi: 'ताँबे की पट्टी', hg: 'Copper strip' } },
  al: { c: 0xd8dbdf, shine: 0xeef0f2, w: 0.016, h: 0.045, d: 0.0003, name: { en: 'Aluminium foil', hi: 'एल्युमिनियम पन्नी', hg: 'Aluminium foil' } },
  zn: { c: 0xa9adb0, shine: 0xcfd3d6, w: 0.008, h: 0.045, d: 0.0009, name: { en: 'Zinc strip', hi: 'ज़िंक की पट्टी', hg: 'Zinc strip' } },
};
export function metalPiece(kind, o = {}) {
  const S = METAL[kind]; const it = new Item('metal', { ...o, name: S.name });
  const mat = new THREE.MeshStandardMaterial({ color: S.c, metalness: 0.75, roughness: 0.45, emissive: 0x000000 });
  const geo = new THREE.BoxGeometry(S.w, S.h, S.d, 4, 8, 1); if (kind === 'al') { const p = geo.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, p.getZ(i) + Math.sin(p.getY(i) * 260 + p.getX(i) * 300) * 0.0007); geo.computeVertexNormals(); }
  const m = new THREE.Mesh(geo, mat); m.position.y = S.h / 2; it.g.add(m); it.mesh = m; it.mat = mat;
  const glowC = new THREE.Color(kind === 'cu' ? 0xff5a1a : kind === 'zn' ? 0xffd24a : 0xff8a3a);
  it.kindM = kind; it.metal = true; it.S = { shine: S.shine, c: S.c }; it.hot = 0; it.ox = 0; it.tipLocal = V3(0, 0.004, 0);
  it.flameTest = (dt, f, hp) => { if (!f.lit || (f.kind !== 'bunsen' && f.kind !== 'lamp')) return; const tip = it.g.localToWorld(tmp.copy(it.tipLocal)); if (tip.distanceTo(hp) < 0.03) it.inFlame = 0.2; };
  it.update = (dt) => {
    const lapse = it.lab?.chem?.lapse ?? 1;
    if (it.inFlame > 0) { it.inFlame -= dt; it.hot = Math.min(1, it.hot + dt * 0.7); } else it.hot = Math.max(0, it.hot - dt * 0.35);
    if (it.hot > 0.5) it.ox = Math.min(1, it.ox + dt * lapse * (kind === 'cu' ? 0.12 : kind === 'zn' ? 0.06 : 0.01));
    const base = new THREE.Color(it.rubbed ? S.shine : S.c);
    if (kind === 'cu') base.lerp(new THREE.Color(0x1d1a19), it.ox);
    if (kind === 'zn') base.lerp(new THREE.Color(0xf4f2ea), it.ox * 0.9);
    if (kind === 'al') { base.lerp(new THREE.Color(0xb9bcbf), it.ox); if (it.hot > 0.85) m.scale.y = Math.max(0.82, m.scale.y - dt * 0.02); } // a thin foil edge sags and melts a little, it does not burn
    mat.color.copy(base); mat.roughness = 0.4 + 0.5 * it.ox; mat.metalness = 0.75 - 0.6 * it.ox;
    const glowK = kind === 'zn' ? it.hot * it.ox : kind === 'al' ? it.hot * 0.25 : it.hot * 0.8;
    mat.emissive.copy(glowC); mat.emissiveIntensity = glowK * 1.4;
    if (it.hot > 0.6 && it.lab && kind === 'cu' && Math.random() < dt * 3) { const tp = it.g.localToWorld(tmp.copy(it.tipLocal)); it.lab.fx.glow(tp, true, 1.2, 0x5aff9a, 0.04); }
    if (it.ox > 0.5 && !it.oxEv) { it.oxEv = true; it.lab && it.lab.emit('metal_heated', { obj: it.id, kind }); }
  };
  it.height = S.h; it.radius = S.w / 2; it.grabY = S.h * 0.8; it.layH = S.d; return it;
}
// ------------------------------------------------------------------ sparks: tiny glowing bits that fly out of a flame (burning iron filings)
export function sparks() {
  const it = new Item('sparks', { name: { en: 'Sparks', hi: 'चिंगारियाँ', hg: 'Chingaariyan' } }); it.noGrab = true;
  const N = 160; const geo = new THREE.BufferGeometry(); const pos = new Float32Array(N * 3); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setDrawRange(0, 0);
  const mat = new THREE.PointsMaterial({ color: 0xffb347, size: 0.004, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false });
  const pts = new THREE.Points(geo, mat); pts.frustumCulled = false; pts.renderOrder = 12; pts.userData.noHit = true; it.g.add(pts);
  const P = [];
  it.burst = (w, n = 6) => { for (let i = 0; i < n && P.length < N; i++) P.push({ p: w.clone(), v: V3(rnd(-0.12, 0.12), rnd(0.05, 0.3), rnd(-0.12, 0.12)), life: rnd(0.25, 0.7) }); };
  it.update = (dt) => {
    for (let i = P.length - 1; i >= 0; i--) { const q = P[i]; q.life -= dt; if (q.life <= 0) { P.splice(i, 1); continue; } q.v.y -= 0.5 * dt; q.p.addScaledVector(q.v, dt); }
    for (let i = 0; i < P.length; i++) { pos[i * 3] = P[i].p.x; pos[i * 3 + 1] = P[i].p.y; pos[i * 3 + 2] = P[i].p.z; } geo.setDrawRange(0, P.length); geo.attributes.position.needsUpdate = true;
  };
  it.height = 0.001; it.radius = 0.001; return it;
}
// ------------------------------------------------------------------ a strip of clean cloth kept overnight with chopped onion (olfactory indicator)
export function clothStrip(o = {}) {
  const it = new Item('cloth', { ...o, name: o.name || { en: 'Onion-smelling cloth strip', hi: 'प्याज़ की गंध वाली कपड़े की पट्टी', hg: 'Pyaaz ki gandh wali kapde ki patti' } });
  const tex = canvasTex(64, 128, (x, w, h) => { x.fillStyle = '#efe9da'; x.fillRect(0, 0, w, h); x.strokeStyle = 'rgba(160,150,128,0.25)'; for (let i = 0; i < w; i += 3) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, h); x.stroke(); } for (let j = 0; j < h; j += 3) { x.beginPath(); x.moveTo(0, j); x.lineTo(w, j); x.stroke(); } x.fillStyle = 'rgba(214,190,120,0.25)'; for (let k = 0; k < 5; k++) { x.beginPath(); x.ellipse(rnd(10, 54), rnd(10, 118), rnd(5, 12), rnd(4, 9), rnd(0, 3), 0, 6.29); x.fill(); } });
  const m = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.07, 0.0012), new THREE.MeshStandardMaterial({ map: tex, roughness: 1 })); m.position.y = 0.035; it.g.add(m);
  const wet = new THREE.Mesh(new THREE.BoxGeometry(0.0182, 0.03, 0.0013), new THREE.MeshStandardMaterial({ color: 0xd8d2c0, roughness: 0.6, transparent: true, opacity: 0.5 })); wet.position.y = 0.035; wet.visible = false; it.g.add(wet); it.wet = wet;
  it.onion = 1; it.got = {}; it.mouthLocal = V3(0, 0.035, 0.002); it.height = 0.07; it.radius = 0.01; it.grabY = 0.06; it.layH = 0.0006; return it;
}
// ------------------------------------------------------------------ a 15 cm scale (ruler) to measure the height of the lather
export function ruler(o = {}) {
  const it = new Item('ruler', { ...o, name: o.name || { en: 'Scale (15 cm)', hi: 'पैमाना (15 सेमी)', hg: 'Scale (15 cm)' } });
  const tex = canvasTex(128, 1024, (x, w, h) => { x.fillStyle = '#f3ecd2'; x.fillRect(0, 0, w, h); x.fillStyle = '#222'; x.font = '600 34px sans-serif';
    for (let mm = 0; mm <= 150; mm++) { const y = h - 12 - (mm / 150) * (h - 24); const L = mm % 10 === 0 ? 60 : mm % 5 === 0 ? 40 : 24; x.fillRect(0, y - 1, L, 2); if (mm % 10 === 0 && mm > 0) x.fillText(String(mm / 10), 68, y + 12); } });
  const m = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.16, 0.002), [new THREE.MeshStandardMaterial({ color: 0xe8dfc2 }), new THREE.MeshStandardMaterial({ color: 0xe8dfc2 }), new THREE.MeshStandardMaterial({ color: 0xe8dfc2 }), new THREE.MeshStandardMaterial({ color: 0xe8dfc2 }), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6 }), new THREE.MeshStandardMaterial({ color: 0xe8dfc2 })]);
  m.position.y = 0.08; it.g.add(m); it.zeroY = 0.08 - 0.08 + 0.16 * (12 / 1024); it.height = 0.16; it.radius = 0.012; it.grabY = 0.12; it.layH = 0.001; return it;
}
// ------------------------------------------------------------------ a black paper cover that keeps light away from a dish
export function cover(o = {}) {
  const it = new Item('cover', { ...o, name: o.name || { en: 'Black paper cover', hi: 'काले कागज़ का ढक्कन', hg: 'Kaale kaagaz ka dhakkan' } });
  const m = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.058, 0.05, 32, 1, true), new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.95, side: THREE.DoubleSide })); m.position.y = 0.025; it.g.add(m);
  const top = new THREE.Mesh(new THREE.CircleGeometry(0.05, 32), new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.95 })); top.rotation.x = -Math.PI / 2; top.position.y = 0.05; it.g.add(top);
  it.height = 0.05; it.radius = 0.058; it.grabY = 0.045; return it;
}
// ------------------------------------------------------------------ the cake of soap made in the lab (cut from the set curd)
export function soapCake(o = {}) {
  const it = new Item('soapcake', { ...o, name: o.name || { en: 'Cake of soap (made in the lab)', hi: 'साबुन की टिकिया (प्रयोगशाला में बनी)', hg: 'Saabun ki tikiya (lab mein bani)' } });
  const tex = canvasTex(128, 128, (x, w, h) => { x.fillStyle = '#efe4c4'; x.fillRect(0, 0, w, h); for (let i = 0; i < 900; i++) { x.fillStyle = `rgba(${Math.random() < 0.5 ? '255,250,236' : '214,200,160'},0.35)`; x.fillRect(rnd(0, w), rnd(0, h), rnd(1, 3), rnd(1, 3)); } });
  const g = new THREE.BoxGeometry(0.05, 0.018, 0.034, 6, 2, 4); const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i); const k = 1 - 0.08 * (Math.abs(x) / 0.025) ** 4 - 0.08 * (Math.abs(z) / 0.017) ** 4; p.setXYZ(i, x * k, y, z * k); } g.computeVertexNormals();
  const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.55 })); m.position.y = 0.009; it.g.add(m);
  it.height = 0.018; it.radius = 0.025; it.grabY = 0.009; return it;
}
// ------------------------------------------------------------------ a layer of soap curd that separates and floats when salt is added
export function curdLayer(v) {
  const tex = canvasTex(128, 128, (x, w, h) => { x.fillStyle = '#f1e6c6'; x.fillRect(0, 0, w, h); for (let i = 0; i < 400; i++) { x.fillStyle = `rgba(${Math.random() < 0.5 ? '255,252,240' : '205,190,150'},0.5)`; x.beginPath(); x.arc(rnd(0, w), rnd(0, h), rnd(1, 5), 0, 6.29); x.fill(); } });
  const m = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 32), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85 })); m.visible = false; m.userData.noHit = true; v.g.add(m);
  v.setCurd = (k) => { v.curd = k; if (k <= 0.01) { m.visible = false; return; } const top = v.heightFor(v.ml) + 0.002 * k; const h = 0.012 * k; const r = v.rInner(top) - 0.0004; m.visible = true; m.scale.set(r, h, r); m.position.y = top - h / 2; };
  return m;
}
void glassMat;
