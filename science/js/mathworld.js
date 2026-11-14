// DUET Maths Lab 360: maths at real size in real places (see places.js). Things here stand on the ground (y = 0) around
// the student, who stands at the origin looking along −z: a flagpole in a school courtyard, the rails of a railway line,
// a roti on a kitchen table, a heap of grain in a farm, a playground marked out as a coordinate plane.
// Drawing helpers: glowing lines (rods) that read well in a headset, labels at a size you can read from where you stand,
// angle arcs, right-angle marks and a chalkboard that keeps the working.
import * as THREE from 'three';
import { Item } from './apparatus.js';
import { canvasTex } from './mats.js';
import { ease, lerp, clamp01 } from './mathlab2.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const FONT = '"Noto Sans Devanagari", "Noto Sans", system-ui, sans-serif';
export const COL = { sight: 0xff5a4f, base: 0xffd23f, up: 0x5ec8ff, ok: 0x8be07a, white: 0xffffff, second: 0xc58bff };

// ------------------------------------------------------------------ drawing helpers
export const glow = (c, op = 1) => new THREE.MeshBasicMaterial({ color: c, toneMapped: false, transparent: op < 1, opacity: op, depthWrite: op >= 1 });
const UPV = V(0, 1, 0);
// a straight glowing line between two points (a thin cylinder: real lines are one pixel wide in a headset)
export function rod(a, b, r, mat) { const m = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 10, 1, false), mat); m.userData.r = r; setRod(m, a, b); m.userData.noHit = true; return m; }
export function setRod(m, a, b) {
  const d = b.clone().sub(a), L = Math.max(1e-4, d.length()); const r = m.userData.r;
  m.position.copy(a).addScaledVector(d, 0.5); m.scale.set(r, L, r); m.quaternion.setFromUnitVectors(UPV, d.multiplyScalar(1 / L)); m.visible = L > 1e-3;
}
// a dashed line: n short rods
export function dashes(a, b, r, mat, step = 0.5) {
  const g = new THREE.Group(); const L = a.distanceTo(b), n = Math.max(1, Math.round(L / step));
  for (let i = 0; i < n; i++) { const k0 = i / n, k1 = (i + 0.55) / n; g.add(rod(a.clone().lerp(b, k0), a.clone().lerp(b, k1), r, mat)); }
  return g;
}
// a label you can read: text drawn on a sprite h metres tall (any language; the width follows the text)
export function sign(text, h = 0.3, o = {}) {
  const fs = 96, pad = 34; const meas = document.createElement('canvas').getContext('2d'); meas.font = `700 ${fs}px ${FONT}`;
  const lines = String(text).split('\n'); const tw = Math.max(...lines.map((l) => meas.measureText(l).width));
  const W = Math.min(4096, Math.ceil(tw + pad * 2)), H = Math.ceil(fs * 1.32 * lines.length + pad * 0.9);
  const tex = canvasTex(W, H, (x) => {
    x.fillStyle = o.bg || 'rgba(12,16,24,0.82)'; x.beginPath(); x.roundRect(4, 4, W - 8, H - 8, Math.min(46, H / 3)); x.fill();
    if (o.edge) { x.strokeStyle = o.edge; x.lineWidth = 8; x.stroke(); }
    x.fillStyle = o.color || '#ffffff'; x.font = `700 ${fs}px ${FONT}`; x.textAlign = 'center'; x.textBaseline = 'middle';
    lines.forEach((l, i) => x.fillText(l, W / 2, pad * 0.45 + fs * 1.32 * (i + 0.5)));
  });
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true, toneMapped: false }));
  sp.scale.set((h * W) / H * lines.length, h * lines.length, 1); sp.renderOrder = 40; sp.userData.noHit = true; return sp;
}
// an arc for an angle: centre c, from direction u through angle a (radians) towards direction v (both unit, in one plane)
export function arc(c, u, v, rad, a, mat, w = 0.05) {
  const g = new THREE.Group(); const n = u.clone().cross(v).normalize(); const w2 = n.clone().cross(u).normalize();
  const geo = new THREE.RingGeometry(rad - w, rad, 40, 1, 0, Math.max(0.001, a)); const m = new THREE.Mesh(geo, mat); m.userData.noHit = true;
  const basis = new THREE.Matrix4().makeBasis(u.clone().normalize(), w2, n); m.quaternion.setFromRotationMatrix(basis); m.material.side = THREE.DoubleSide; g.add(m); g.position.copy(c); return g;
}
// the small square that marks a right angle at p between directions u and v
export function rightMark(p, u, v, s, mat, r = 0.02) {
  const g = new THREE.Group(); const a = p.clone().addScaledVector(u, s), b = a.clone().addScaledVector(v, s), c = p.clone().addScaledVector(v, s);
  g.add(rod(a, b, r, mat), rod(b, c, r, mat)); return g;
}
// a chalkboard on a stand that keeps the working: board.write(['tan θ = h ÷ d', …])
export function chalkboard(o = {}) {
  const it = new Item('chalkboard', { ...o, name: { en: 'Chalkboard', hi: 'ब्लैकबोर्ड', hg: 'Blackboard' } });
  const w = o.w ?? 2.4, h = o.h ?? 1.5, y0 = o.y ?? 0.9;
  const wood = new THREE.MeshStandardMaterial({ color: 0x6b4a2e, roughness: 0.7 });
  const c = document.createElement('canvas'); c.width = 1600; c.height = Math.round(1600 * h / w); const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const face = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95 })); face.position.set(0, y0 + h / 2, 0.026); it.g.add(face);
  const back = new THREE.Mesh(new THREE.BoxGeometry(w + 0.12, h + 0.12, 0.05), wood); back.position.set(0, y0 + h / 2, 0); it.g.add(back);
  for (const sx of [-1, 1]) { const leg = new THREE.Mesh(new THREE.BoxGeometry(0.07, y0 + h + 0.1, 0.07), wood); leg.position.set(sx * (w / 2 + 0.02), (y0 + h + 0.1) / 2, -0.04); it.g.add(leg); }
  const tray = new THREE.Mesh(new THREE.BoxGeometry(w, 0.04, 0.12), wood); tray.position.set(0, y0 - 0.02, 0.07); it.g.add(tray);
  it.g.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
  it.lines = [];
  it.draw = (title) => {
    const x = c.getContext('2d'), W = c.width, Hc = c.height;
    if (!it.bg) { // the board's dusty green, drawn once
      it.bg = document.createElement('canvas'); it.bg.width = W; it.bg.height = Hc; const b = it.bg.getContext('2d');
      b.fillStyle = '#21402f'; b.fillRect(0, 0, W, Hc);
      for (let i = 0; i < 1800; i++) { b.fillStyle = `rgba(255,255,255,${Math.random() * 0.03})`; b.fillRect(Math.random() * W, Math.random() * Hc, 3 + Math.random() * 46, 2 + Math.random() * 8); }
    }
    x.drawImage(it.bg, 0, 0);
    x.textBaseline = 'top'; let y = 46;
    if (title || it.title) { x.fillStyle = 'rgba(255,214,120,0.95)'; x.font = `700 74px ${FONT}`; x.fillText(title || it.title, 56, y, W - 100); y += 110; }
    for (const l of it.lines) { const big = l.big ? 84 : 66; x.font = `${l.big ? 700 : 600} ${big}px ${FONT}`; x.fillStyle = l.c || 'rgba(244,240,226,0.95)'; x.fillText(l.t, 64, y, W - 120); y += big * 1.42; }
    tex.needsUpdate = true;
  };
  it.write = (lines, title) => { it.lines = lines.map((l) => (typeof l === 'string' ? { t: l } : l)); if (title) it.title = title; it.draw(); };
  it.add = (l) => { it.lines.push(typeof l === 'string' ? { t: l } : l); it.draw(); };
  it.draw(); it.noGrab = true; it.noPhys = true; it.height = y0 + h; it.radius = w / 2; it.base = 0; return it;
}

// ------------------------------------------------------------------ Class 10: the height of a flagpole (school courtyard)
// The student stands at the origin; the clinometer is in front of the eye at E. The pole stands D metres ahead of E.
export function flagpoleScene(o = {}) {
  const it = new Item('wflagpole', { ...o, name: { en: 'Flagpole', hi: 'झंडे का खंभा', hg: 'Flagpole' } });
  const EYE = o.eye ?? 1.5, D = o.d ?? 15, ANG = o.angle ?? 30;
  const H = +(EYE + D * Math.tan((ANG * Math.PI) / 180)).toFixed(2); // 10.16 m
  const E = V(0.28, EYE, -0.45), P = V(E.x, 0, E.z - D); // eye (straw) and the foot of the pole
  it.H = H; it.D = D; it.EYE = EYE; it.E = E; it.P = P;
  const g = it.g;
  // the flagpole: a stepped concrete base, a tapered steel pole, a gold finial and the tricolour flying from the top
  const con = new THREE.MeshStandardMaterial({ color: 0xc9c2b4, roughness: 0.92 });
  const plinth = new THREE.Group(); plinth.position.copy(P); g.add(plinth);
  [[1.9, 0.16], [1.4, 0.16], [0.9, 0.16]].forEach(([s, hh], i) => { const b = new THREE.Mesh(new THREE.BoxGeometry(s, hh, s), con); b.position.y = hh / 2 + i * hh; plinth.add(b); });
  const steel = new THREE.MeshStandardMaterial({ color: 0xd4d8dd, metalness: 0.85, roughness: 0.28 });
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.07, H - 0.48, 20), steel); pole.position.set(P.x, 0.48 + (H - 0.48) / 2, P.z); g.add(pole);
  const fin = new THREE.Mesh(new THREE.SphereGeometry(0.09, 20, 14), new THREE.MeshStandardMaterial({ color: 0xd9b24c, metalness: 0.9, roughness: 0.25 })); fin.position.set(P.x, H + 0.06, P.z); g.add(fin);
  const flagT = canvasTex(600, 400, (x, W, Hh) => {
    x.fillStyle = '#FF9933'; x.fillRect(0, 0, W, Hh / 3); x.fillStyle = '#FFFFFF'; x.fillRect(0, Hh / 3, W, Hh / 3); x.fillStyle = '#138808'; x.fillRect(0, (2 * Hh) / 3, W, Hh / 3);
    const cx = W / 2, cy = Hh / 2, R = Hh / 7.2; x.strokeStyle = '#000080'; x.fillStyle = '#000080'; x.lineWidth = 5; x.beginPath(); x.arc(cx, cy, R, 0, 7); x.stroke();
    x.lineWidth = 2; for (let k = 0; k < 24; k++) { const a = (k / 24) * Math.PI * 2; x.beginPath(); x.moveTo(cx, cy); x.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); x.stroke(); }
    x.beginPath(); x.arc(cx, cy, R * 0.18, 0, 7); x.fill();
  });
  const FW = 1.8, FH = 1.2; const fgeo = new THREE.PlaneGeometry(FW, FH, 18, 8); fgeo.translate(-FW / 2, 0, 0);
  const flag = new THREE.Mesh(fgeo, new THREE.MeshStandardMaterial({ map: flagT, side: THREE.DoubleSide, roughness: 0.85 }));
  flag.position.set(P.x - 0.05, H - 0.15 - FH / 2, P.z); flag.rotation.y = Math.PI / 2 + 0.5; g.add(flag); flag.castShadow = true;
  const fx0 = Float32Array.from(fgeo.attributes.position.array);
  const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, H - 1, 4), new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.9 })); rope.position.set(P.x + 0.08, 1 + (H - 1) / 2, P.z); g.add(rope);
  for (const m of [pole, fin, ...plinth.children]) { m.castShadow = true; m.receiveShadow = true; }
  // the clinometer in front of the eye: a big protractor (curved edge down) with a straw along its straight edge and a plumb line
  const clin = new THREE.Group(); clin.position.copy(E); g.add(clin);
  const tilt = new THREE.Group(); clin.add(tilt); tilt.rotation.y = -Math.PI / 2; // its straight edge points to −z (to the pole)
  const pr = 0.16; const scale = canvasTex(512, 256, (x, W, Hh) => {
    x.clearRect(0, 0, W, Hh); x.fillStyle = 'rgba(236,241,246,0.95)'; x.beginPath(); x.moveTo(0, 0); x.arc(W / 2, 0, W / 2, 0, Math.PI); x.closePath(); x.fill();
    x.strokeStyle = '#26303a'; x.lineWidth = 3; x.stroke(); x.fillStyle = '#26303a'; x.font = '700 22px sans-serif'; x.textAlign = 'center';
    for (let d = 0; d <= 90; d += 5) for (const sgn of [1, -1]) { const a = Math.PI / 2 + sgn * (d * Math.PI) / 180; const r0 = W / 2 - (d % 10 ? 10 : 22); x.lineWidth = d % 10 ? 1.5 : 3; x.beginPath(); x.moveTo(W / 2 + Math.cos(a) * (W / 2 - 3), Math.sin(a) * (W / 2 - 3)); x.lineTo(W / 2 + Math.cos(a) * r0, Math.sin(a) * r0); x.stroke(); if (!(d % 30) && !(d === 0 && sgn < 0)) x.fillText(String(d), W / 2 + Math.cos(a) * (W / 2 - 46), Math.sin(a) * (W / 2 - 46) + 8); }
  });
  const disc = new THREE.Mesh(new THREE.PlaneGeometry(2 * pr, pr), new THREE.MeshBasicMaterial({ map: scale, transparent: true, side: THREE.DoubleSide, depthWrite: false })); disc.position.y = -pr / 2; tilt.add(disc);
  const straw = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.36, 14, 1, true), new THREE.MeshStandardMaterial({ color: 0xe0573e, roughness: 0.5, side: THREE.DoubleSide })); straw.rotation.z = Math.PI / 2; tilt.add(straw);
  const thread = new THREE.Mesh(new THREE.CylinderGeometry(0.0015, 0.0015, 0.15, 4), new THREE.MeshBasicMaterial({ color: 0x222222 })); thread.position.y = -0.075; clin.add(thread);
  const bob = new THREE.Mesh(new THREE.ConeGeometry(0.012, 0.03, 12), new THREE.MeshStandardMaterial({ color: 0x8a6a3a, metalness: 0.6, roughness: 0.4 })); bob.rotation.x = Math.PI; bob.position.y = -0.16; clin.add(bob);
  // the tape along the ground from under the eye to the foot of the pole, numbered every metre
  const tapeT = canvasTex(2048, 48, (x, W, Hh) => { x.fillStyle = '#f2d23a'; x.fillRect(0, 0, W, Hh); x.strokeStyle = '#1d232b'; x.fillStyle = '#1d232b'; x.font = '700 30px sans-serif'; x.textAlign = 'center';
    for (let c = 0; c <= D * 10; c++) { const px = (c / (D * 10)) * W; x.lineWidth = c % 10 ? 1 : 3; x.beginPath(); x.moveTo(px, 0); x.lineTo(px, c % 10 ? 10 : 22); x.stroke(); if (!(c % 10) && c) x.fillText(String(c / 10), px - 16, 42); } });
  const tape = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.07), new THREE.MeshStandardMaterial({ map: tapeT, roughness: 0.55 })); tape.rotation.set(-Math.PI / 2, 0, Math.PI / 2); g.add(tape); tape.receiveShadow = true;
  // the right triangle: level line from the eye, the pole above eye level, and the line of sight
  const F = V(P.x, EYE, P.z), T = V(P.x, H, P.z);
  const mSight = glow(COL.sight), mBase = glow(COL.base), mUp = glow(COL.up), mOk = glow(COL.ok);
  const sight = rod(E, T, 0.025, mSight), base = rod(E, F, 0.025, mBase), up = rod(F, T, 0.035, mUp), eyeUp = rod(V(P.x, 0.02, P.z + 0.09), V(P.x, EYE, P.z + 0.09), 0.03, glow(COL.ok));
  const rm = rightMark(F, V(0, 0, 1), V(0, 1, 0), 0.6, mBase, 0.02);
  const ang = arc(E, V(0, 0, -1), V(0, 1, 0).add(V(0, 0, -1)).normalize(), 1.6, (ANG * Math.PI) / 180, glow(0xffffff, 0.9), 0.06);
  for (const m of [sight, base, up, eyeUp, rm, ang]) { m.visible = false; g.add(m); }
  // a second look from closer (60°): a ghost clinometer, its own sight line and angle
  const D2 = +(D * Math.tan((ANG * Math.PI) / 180) / Math.tan((60 * Math.PI) / 180)).toFixed(2); it.D2 = D2; // 5 m
  const E2 = V(E.x, EYE, P.z + D2); const ghost = clin.clone(); ghost.position.copy(E2); ghost.children[0].rotation.x = 0; ghost.traverse((m) => { if (m.isMesh) { m.material = m.material.clone(); m.material.transparent = true; m.material.opacity = 0.75; } }); ghost.visible = false; g.add(ghost);
  const sight2 = rod(E2, T, 0.025, glow(COL.second)), base2 = rod(E2, F, 0.025, glow(COL.second, 0.8)); const ang2 = arc(E2, V(0, 0, -1), V(0, 1, 0).add(V(0, 0, -1)).normalize(), 1.1, Math.PI / 3, glow(COL.second, 0.9), 0.06);
  for (const m of [sight2, base2, ang2]) { m.visible = false; g.add(m); }
  // state
  it.tapeK = 0; it.aimK = 0; it.sightK = 0;
  const update = () => {
    const L = D * it.tapeK; tape.visible = L > 0.01; tape.scale.x = Math.max(0.01, L); tape.position.set(E.x - 0.12, 0.012, E.z - L / 2); tapeT.repeat.set(Math.max(0.001, it.tapeK), 1); // (only the texture's repeat changes: no new upload)
    tilt.rotation.z = ((ANG * Math.PI) / 180) * ease(clamp01(it.aimK)); // the straw tilts up towards the top; the plumb line stays vertical
    setRod(sight, E, E.clone().lerp(T, ease(clamp01(it.sightK)))); sight.visible = it.sightK > 0;
  };
  update();
  it.measure = (k) => { it.tapeK = k; update(); };
  it.aim = (k) => { it.aimK = k; update(); };
  it.look = (k) => { it.sightK = k; update(); };
  it.triangle = (on) => { base.visible = up.visible = rm.visible = ang.visible = on; };
  it.eyeLine = (on) => { eyeUp.visible = on; };
  it.closer = (k) => { ghost.visible = k > 0; ghost.children[0].rotation.z = (Math.PI / 3) * ease(clamp01(k)); setRod(sight2, E2, E2.clone().lerp(T, ease(clamp01(k)))); sight2.visible = k > 0.05; base2.visible = ang2.visible = k > 0.95; };
  it.at = (k) => ({ top: V(T.x, T.y + 0.7, T.z), eye: V(E.x - 0.1, E.y + 0.45, E.z - 1.2), tape: V(E.x, 0.5, E.z - D / 2), up: V(P.x - 0.9, (EYE + H) / 2, P.z), mid: V(E.x, (EYE + H) / 2 + 0.6, E.z - D / 2 - 0.5), base: V(E.x, EYE - 0.5, E.z - D / 2), eyeH: V(P.x - 0.7, EYE / 2, P.z + 0.1), e2: V(E2.x, EYE + 1.0, E2.z - 0.5) }[k] || T.clone());
  // the flag flies
  let t0 = 0; it.update = (dt) => { t0 += dt || 0.016; const p = fgeo.attributes.position; for (let i = 0; i < p.count; i++) { const x = fx0[i * 3], y = fx0[i * 3 + 1]; const f = -x / FW; p.setZ(i, Math.sin(x * 3.1 - t0 * 5.2 + y * 1.3) * 0.12 * f + Math.sin(x * 7 - t0 * 8) * 0.03 * f); } p.needsUpdate = true; fgeo.computeVertexNormals(); };
  it.noGrab = true; it.noPhys = true; it.height = H; it.radius = 1; it.base = 0; return it;
}

// ------------------------------------------------------------------ Class 7: parallel lines and a transversal (railway line)
// The rails of the photo (places.js 'rail': the track runs straight ahead) are the parallel lines l and m; a straight
// cable laid across them is the transversal t. Angles 1–4 are at P (on l), 5–8 at Q (on m), counted the same way round.
export function railScene(o = {}) {
  const it = new Item('wrail', { ...o, name: { en: 'Railway line', hi: 'रेल की पटरी', hg: 'Railway line' } });
  const g = it.g, XL = -0.505, XM = 0.635, Y = 0.035, A = ((o.angle ?? 55) * Math.PI) / 180;
  const C = V(0.07, Y, -5), r = V(0, 0, -1), t = V(Math.sin(A), 0, -Math.cos(A));
  const P = C.clone().addScaledVector(t, (XL - C.x) / t.x), Q = C.clone().addScaledVector(t, (XM - C.x) / t.x);
  it.P = P; it.Q = Q; it.A = A;
  // the rails, lit up
  const mL = glow(COL.base), mM = glow(COL.base);
  const railL = rod(V(XL, Y, -0.6), V(XL, Y, -40), 0.022, mL), railM = rod(V(XM, Y, -0.6), V(XM, Y, -40), 0.022, mM);
  railL.visible = railM.visible = false; g.add(railL, railM);
  // gaps measured at three places
  const gaps = [-2.2, -8, -16].map((z) => { const m = rod(V(XL, Y + 0.01, z), V(XM, Y + 0.01, z), 0.015, glow(COL.ok)); m.visible = false; g.add(m); return m; });
  // the transversal: a cable across the track
  const T0 = C.clone().addScaledVector(t, -3.2), T1 = C.clone().addScaledVector(t, 3.2);
  const cable = rod(T0, T0, 0.03, glow(COL.up)); g.add(cable); cable.visible = false;
  // the eight angles
  const dirs = { 1: [r, t], 2: [t, r.clone().negate()], 3: [r.clone().negate(), t.clone().negate()], 4: [t.clone().negate(), r] };
  const sizes = { 1: A, 2: Math.PI - A, 3: A, 4: Math.PI - A };
  const col = { 1: 0xff8a3d, 2: 0x3dd6ff, 3: 0xff8a3d, 4: 0x3dd6ff };
  it.arcs = {}; it.nums = {};
  for (const [n, at] of [[1, P], [5, Q]]) for (let k = 1; k <= 4; k++) {
    const id = n + k - 1; const [u, v] = dirs[k]; const a = arc(at.clone().setY(Y + 0.02), u, v, 0.42, sizes[k], glow(col[k], 0.9), 0.08); a.visible = false; g.add(a); it.arcs[id] = a;
    const mid = u.clone().add(v).normalize(); const s = sign(String(id), 0.2, { bg: 'rgba(12,16,24,0.75)' }); s.position.copy(at).addScaledVector(mid, 0.68).setY(0.22); s.visible = false; g.add(s); it.nums[id] = s;
  }
  // a copy of an angle that slides along the transversal
  it.ghost = null;
  it.glowRails = (on) => { railL.visible = railM.visible = on; };
  it.gaps = (k) => gaps.forEach((m, i) => { m.visible = k > i / 3; });
  it.cable = (k) => { setRod(cable, T0, T0.clone().lerp(T1, ease(clamp01(k)))); cable.visible = k > 0.01; };
  it.angles = (on, ids) => { for (const id of ids || Object.keys(it.arcs)) { it.arcs[id].visible = on; it.nums[id].visible = on; } };
  it.slide = (from, k) => { // a bright copy of angle `from` (at P) moves to Q
    if (!it.ghost) { it.ghost = it.arcs[from].clone(); it.ghost.traverse((m) => { if (m.isMesh) m.material = glow(0xffffff, 0.85); }); g.add(it.ghost); }
    it.ghost.position.copy(P.clone().setY(Y + 0.05).lerp(Q.clone().setY(Y + 0.05), ease(clamp01(k)))); it.ghost.visible = k > 0;
  };
  it.clearGhost = () => { if (it.ghost) { g.remove(it.ghost); it.ghost = null; } };
  it.at = (k) => ({ l: V(XL - 0.35, 0.45, -3), m: V(XM + 0.35, 0.45, -3), t: T1.clone().setY(0.5), gap: V((XL + XM) / 2, 0.45, -2.2), P: P.clone().setY(0.75), Q: Q.clone().setY(0.75), mid: C.clone().setY(1.2) }[k] || C.clone());
  it.noGrab = true; it.noPhys = true; it.height = 0.1; it.radius = 1; it.base = 0; return it;
}

// ------------------------------------------------------------------ Class 10: the area of a circle with a roti (kitchen table)
// A roti of radius 10 cm on a steel plate is cut into 16 equal pieces; the pieces are laid head to tail into a shape that
// is nearly a rectangle, πr long and r high. Drawn in (u, v) on the table like the paper version (world x = u, z = −v).
export function rotiSectors(o = {}) {
  const it = new Item('wroti', { ...o, name: { en: 'Roti cut into 16 pieces', hi: '16 टुकड़ों में कटी रोटी', hg: '16 tukdon mein kati roti' } });
  const r = 0.1, n = 16, d = (2 * Math.PI) / n, th = 0.003, C = [-0.16, 0.06];
  // the roti's face: golden brown, with the darker spots of a tawa and a few puffed blisters
  const tex = canvasTex(1024, 1024, (x, W) => {
    const g = x.createRadialGradient(W / 2, W / 2, W * 0.05, W / 2, W / 2, W / 2); g.addColorStop(0, '#e2b56e'); g.addColorStop(0.85, '#d7a45c'); g.addColorStop(1, '#b97f3c');
    x.fillStyle = g; x.fillRect(0, 0, W, W);
    for (let i = 0; i < 900; i++) { const a = Math.random() * 7, rr = Math.sqrt(Math.random()) * W * 0.47; const px = W / 2 + Math.cos(a) * rr, py = W / 2 + Math.sin(a) * rr, s = 3 + Math.random() * (Math.random() < 0.15 ? 26 : 9);
      x.fillStyle = `rgba(${90 + Math.random() * 40},${50 + Math.random() * 25},${20},${0.12 + Math.random() * 0.45})`; x.beginPath(); x.ellipse(px, py, s, s * (0.5 + Math.random() * 0.5), Math.random() * 3, 0, 7); x.fill(); }
    for (let i = 0; i < 2600; i++) { x.fillStyle = `rgba(255,236,190,${Math.random() * 0.16})`; x.fillRect(Math.random() * W, Math.random() * W, 2, 2); }
  });
  const top = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.82 }), side = new THREE.MeshStandardMaterial({ color: 0xc28a46, roughness: 0.9 });
  // a steel thali and a wooden board
  const steel = new THREE.MeshStandardMaterial({ color: 0xe4e8ec, metalness: 0.75, roughness: 0.32 });
  const plate = new THREE.Mesh(new THREE.LatheGeometry([new THREE.Vector2(0, 0), new THREE.Vector2(0.125, 0), new THREE.Vector2(0.135, 0.012), new THREE.Vector2(0.145, 0.016), new THREE.Vector2(0.146, 0.012)], 48), steel);
  plate.position.set(C[0], 0, -C[1]); it.g.add(plate);
  const board = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.018, 0.22), new THREE.MeshStandardMaterial({ color: 0xc39a6b, roughness: 0.6 })); board.position.set(0.17, 0.009, 0.0); it.g.add(board);
  for (const m of [plate, board]) { m.castShadow = true; m.receiveShadow = true; }
  // the 16 pieces (each with the part of the roti's face it had, so the uncut roti looks whole)
  it.sectors = [];
  for (let j = 0; j < n; j++) {
    const a0 = -Math.PI / 2 + j * d, sh = new THREE.Shape(); sh.moveTo(0, 0); for (let k = 0; k <= 8; k++) { const a = a0 + (d * k) / 8; sh.lineTo(r * Math.cos(a), r * Math.sin(a)); }
    const geo = new THREE.ExtrudeGeometry(sh, { depth: th, bevelEnabled: false, curveSegments: 1 }); geo.rotateX(-Math.PI / 2);
    const p = geo.attributes.position, uv = geo.attributes.uv; for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / (2 * r) + 0.5, -p.getZ(i) / (2 * r) + 0.5);
    const m = new THREE.Mesh(geo, [top, side]); m.castShadow = true; m.receiveShadow = true;
    const g = new THREE.Group(); g.add(m); it.g.add(g);
    const mid = a0 + d / 2; g.userData.c = { u: C[0], v: C[1], rot: 0, mid };
    it.sectors.push(g);
  }
  // laid out on the board: the pieces of the top half point down (their curved edge at the bottom), the others point up
  const s = 2 * r * Math.sin(d / 2), base = [0.17 - 4 * s - s / 4, -0.045];
  it.sectors.forEach((g, j) => { const c = g.userData.c, i = j % (n / 2), up = j >= n / 2;
    // a piece whose middle points along angle mid: turned so it points down (+π/2 − mid … ) or up
    const rotDown = -Math.PI / 2 - c.mid, rotUp = Math.PI / 2 - c.mid;
    g.userData.t = up ? { u: base[0] + (i + 0.5) * s, v: base[1] + r * Math.cos(d / 2), rot: rotDown } : { u: base[0] + (i + 1) * s, v: base[1], rot: rotUp };
  });
  // cut lines (a knife's marks) shown while cutting
  const cuts = new THREE.Group(); for (let j = 0; j < n / 2; j++) { const a = -Math.PI / 2 + j * d; const ln = rod(V(C[0] - Math.cos(a) * r, 0.0042, -C[1] + Math.sin(a) * r), V(C[0] + Math.cos(a) * r, 0.0042, -C[1] - Math.sin(a) * r), 0.0008, new THREE.MeshBasicMaterial({ color: 0x5b3a1a })); cuts.add(ln); } cuts.visible = false; it.g.add(cuts);
  const place = (g, u, v, rot, lift = 0) => { g.position.set(u, 0.017 + lift, -v); g.rotation.y = rot; };
  it.sectors.forEach((g) => place(g, C[0], C[1], 0));
  it.cutK = 0;
  it.cut = (k) => { cuts.visible = k > 0 && k < 1; const e = ease(clamp01(k)); it.sectors.forEach((g) => { const c = g.userData.c; place(g, c.u + Math.cos(c.mid) * 0.004 * e, c.v + Math.sin(c.mid) * 0.004 * e, 0); }); };
  it.arrange = (k) => it.sectors.forEach((g, j) => { const e = ease(clamp01((k - (j / n) * 0.6) / 0.4)); const a = g.userData.c, b = g.userData.t; place(g, lerp(a.u + Math.cos(a.mid) * 0.004, b.u, e), lerp(a.v + Math.sin(a.mid) * 0.004, b.v, e), lerp(0, b.rot, e), 0.03 * Math.sin(Math.PI * e) + (e > 0.99 ? 0.001 : 0)); });
  // measuring lines along the new shape
  const yL = 0.024, L0 = V(base[0] + s / 2, yL, -(base[1] - 0.012)), L1 = V(base[0] + 8.5 * s, yL, -(base[1] - 0.012));
  const H0 = V(base[0] + 8.5 * s + 0.012, yL, -base[1]), H1 = V(base[0] + 8.5 * s + 0.012, yL, -(base[1] + r * Math.cos(d / 2)));
  const lenL = rod(L0, L1, 0.0016, glow(COL.base)), htL = rod(H0, H1, 0.0016, glow(COL.up)); lenL.visible = htL.visible = false; it.g.add(lenL, htL);
  it.measures = (on) => { lenL.visible = htL.visible = on; };
  const W = (u, v, up = 0.05) => it.g.localToWorld(V(u, up, -v));
  it.at = (k) => ({ roti: W(C[0], C[1] + 0.02, 0.09), len: W(base[0] + 4.4 * s, base[1] - 0.04, 0.05), ht: W(base[0] + 8.5 * s + 0.07, base[1] + r / 2, 0.05), area: W(0.17, 0.1, 0.12) }[k]);
  it.noGrab = true; it.noPhys = true; it.height = 0.03; it.radius = 0.3; it.grabY = 0.01; return it;
}

// ------------------------------------------------------------------ shared: real models, paint on the ground, cones, wheat
const MDIR = '../maths/models/';
let gltf = null; const glbs = {};
// a scanned model from maths/models (Poly Haven, CC0), loaded once and copied for each use
export function glb(name) {
  if (!glbs[name]) { gltf ||= new GLTFLoader().setMeshoptDecoder(MeshoptDecoder); glbs[name] = gltf.loadAsync(MDIR + name).then((g) => g.scene); }
  return glbs[name].then((s) => s.clone(true));
}
// scale a model so its largest side is `size` m, centred on x and z, standing on y = 0 (or centred on y)
function fit(s, size, centreY = false) {
  const b = new THREE.Box3().setFromObject(s), d = b.getSize(V(0, 0, 0)), k = size / Math.max(d.x, d.y, d.z), c = b.getCenter(V(0, 0, 0));
  s.scale.multiplyScalar(k); s.position.set(-c.x * k, centreY ? -c.y * k : -b.min.y * k, -c.z * k);
  s.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; m.userData.noHit = true; } }); return s;
}
// a painted stripe on the ground from a to b (w wide): pitch lines, axes
const STRIPE = new THREE.BoxGeometry(1, 0.004, 1);
export function stripe(a, b, w, mat, y = 0.007) { const m = new THREE.Mesh(STRIPE, mat); m.userData.w = w; m.userData.y = y; m.userData.noHit = true; m.receiveShadow = true; setStripe(m, a, b); return m; }
export function setStripe(m, a, b) {
  const dx = b.x - a.x, dz = b.z - a.z, L = Math.hypot(dx, dz);
  m.position.set((a.x + b.x) / 2, m.userData.y, (a.z + b.z) / 2); m.rotation.set(0, -Math.atan2(dz, dx), 0); m.scale.set(Math.max(1e-4, L), 1, m.userData.w); m.visible = L > 1e-3;
}
// an orange traffic cone with a white band (about 50 cm tall)
export function trafficCone(h = 0.5) {
  const g = new THREE.Group(), r0 = 0.13, r1 = 0.02, rAt = (f) => r0 - (r0 - r1) * f;
  const or = new THREE.MeshStandardMaterial({ color: 0xff5a14, roughness: 0.5 }), wh = new THREE.MeshStandardMaterial({ color: 0xf4f4f0, roughness: 0.3 });
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.03, 0.34), new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.85 })); base.position.y = 0.015;
  const body = new THREE.Mesh(new THREE.CylinderGeometry(r1, r0, h, 24, 1, true), or); body.position.y = 0.03 + h / 2;
  const band = new THREE.Mesh(new THREE.CylinderGeometry(rAt(0.62) + 0.002, rAt(0.42) + 0.002, 0.2 * h, 24, 1, true), wh); band.position.y = 0.03 + 0.52 * h;
  for (const m of [base, body, band]) { m.castShadow = true; m.receiveShadow = true; m.userData.noHit = true; g.add(m); }
  return g;
}
// wheat grains, close up (tiles seamlessly)
let WHEAT = null;
function wheatTex() {
  if (WHEAT) return WHEAT;
  WHEAT = canvasTex(512, 512, (x, W) => {
    x.fillStyle = '#9c6c2c'; x.fillRect(0, 0, W, W);
    const grain = (px, py, a, l, c) => {
      x.save(); x.translate(px, py); x.rotate(a);
      x.fillStyle = `rgb(${c[0]},${c[1]},${c[2]})`; x.beginPath(); x.ellipse(0, 0, l, l * 0.56, 0, 0, 7); x.fill();
      x.fillStyle = 'rgba(255,240,200,0.28)'; x.beginPath(); x.ellipse(-l * 0.2, -l * 0.16, l * 0.5, l * 0.2, 0, 0, 7); x.fill();
      x.strokeStyle = 'rgba(95,58,20,0.45)'; x.lineWidth = 1.2; x.beginPath(); x.moveTo(-l * 0.75, l * 0.06); x.lineTo(l * 0.75, l * 0.06); x.stroke(); x.restore();
    };
    for (let i = 0; i < 4200; i++) {
      const px = Math.random() * W, py = Math.random() * W, a = Math.random() * Math.PI, l = 6 + Math.random() * 3, v = Math.random();
      const c = [Math.round(196 + v * 40), Math.round(140 + v * 40), Math.round(62 + v * 28)];
      for (const ox of [-W, 0, W]) for (const oy of [-W, 0, W]) if (px + ox > -12 && px + ox < W + 12 && py + oy > -12 && py + oy < W + 12) grain(px + ox, py + oy, a, l, c);
    }
  });
  WHEAT.wrapS = WHEAT.wrapT = THREE.RepeatWrapping; return WHEAT;
}
const wheatMat = (rx, ry = rx) => { const t = wheatTex().clone(); t.repeat.set(rx, ry); t.needsUpdate = true; return new THREE.MeshStandardMaterial({ map: t, roughness: 0.92 }); };
// a stream of falling grains: flow(from, velocity, floorY) while pouring, stop() after; tick(dt) every frame
function grainStream(n = 200) {
  const geo = new THREE.SphereGeometry(0.0042, 6, 4); geo.scale(1, 1.8, 1);
  const m = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7 }), n);
  m.frustumCulled = false; m.userData.noHit = true; m.castShadow = false;
  const P = new Float32Array(n * 3), Vl = new Float32Array(n * 3), live = new Uint8Array(n), Q = [];
  const M = new THREE.Matrix4(), Z = new THREE.Matrix4().makeScale(0, 0, 0), pos = V(0, 0, 0), one = V(1, 1, 1), col = new THREE.Color();
  for (let i = 0; i < n; i++) { Q.push(new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.random() * 6, Math.random() * 6, Math.random() * 6))); m.setMatrixAt(i, Z); const v = Math.random(); m.setColorAt(i, col.setRGB(0.78 + v * 0.16, 0.55 + v * 0.15, 0.24 + v * 0.1)); }
  const st = { on: false, src: V(0, 0, 0), vel: V(0, 0, 0), floor: 0 }; let acc = 0, alive = 0; m.visible = false;
  m.flow = (src, vel, floor) => { st.on = true; st.src.copy(src); st.vel.copy(vel); st.floor = floor; };
  m.stop = () => { st.on = false; };
  m.tick = (dt) => {
    if (!st.on && !alive) { m.visible = false; return; }
    dt = Math.min(dt || 0.016, 0.05); m.visible = true;
    if (st.on) { acc += dt * 520; while (acc >= 1) { acc -= 1; const i = live.indexOf(0); if (i < 0) { acc = 0; break; } live[i] = 1; alive++;
      P[i * 3] = st.src.x + (Math.random() - 0.5) * 0.03; P[i * 3 + 1] = st.src.y; P[i * 3 + 2] = st.src.z + (Math.random() - 0.5) * 0.03;
      Vl[i * 3] = st.vel.x + (Math.random() - 0.5) * 0.08; Vl[i * 3 + 1] = st.vel.y; Vl[i * 3 + 2] = st.vel.z + (Math.random() - 0.5) * 0.08; } }
    for (let i = 0; i < n; i++) {
      if (!live[i]) continue;
      Vl[i * 3 + 1] -= 9.8 * dt; P[i * 3] += Vl[i * 3] * dt; P[i * 3 + 1] += Vl[i * 3 + 1] * dt; P[i * 3 + 2] += Vl[i * 3 + 2] * dt;
      if (P[i * 3 + 1] < st.floor) { live[i] = 0; alive--; m.setMatrixAt(i, Z); continue; }
      M.compose(pos.set(P[i * 3], P[i * 3 + 1], P[i * 3 + 2]), Q[i], one); m.setMatrixAt(i, M);
    }
    m.instanceMatrix.needsUpdate = true;
  };
  return m;
}
const seg = (k, a, b) => clamp01((k - a) / (b - a));

// ------------------------------------------------------------------ Class 9: coordinates on the playground
// The playground is painted as a coordinate plane: the x-axis across, the y-axis straight ahead (on the pitch line of the
// photo), the origin O 5 m in front of the student, a mark every metre. A football and traffic cones are the points.
export function coordField(o = {}) {
  const it = new Item('wcoord', { ...o, name: { en: 'Coordinate plane on the playground', hi: 'खेल के मैदान पर निर्देशांक तल', hg: 'Playground par coordinate plane' } });
  const g = it.g, OZ = o.oz ?? -5, XS = [-6, 6], YS = [-4, 5];
  const P = (x, y, h = 0) => V(x, h, OZ - y); it.P = P;
  const paint = new THREE.MeshStandardMaterial({ color: 0xf7f7f2, roughness: 0.9 });
  // the axes: four half-lines that grow out of O, a mark and a number every metre
  const halves = [[XS[1], 0], [XS[0], 0], [0, YS[1]], [0, YS[0]]].map(([x, y]) => { const m = stripe(P(0, 0), P(x, y), 0.1, paint); m.visible = false; g.add(m); return { m, x, y, L: Math.abs(x || y) }; });
  const ticks = [];
  const num = (n, at) => { const s = sign(String(n).replace('-', '−'), 0.26, { bg: 'rgba(12,16,24,0.6)' }); s.position.copy(at); s.visible = false; g.add(s); return s; };
  for (let x = XS[0]; x <= XS[1]; x++) if (x) { const m = stripe(P(x, -0.22), P(x, 0.22), 0.06, paint); m.visible = false; g.add(m); ticks.push({ h: x > 0 ? 0 : 1, d: Math.abs(x), m, s: num(x, P(x, -0.55, 0.2)) }); }
  for (let y = YS[0]; y <= YS[1]; y++) if (y) { const m = stripe(P(-0.22, y), P(0.22, y), 0.06, paint); m.visible = false; g.add(m); ticks.push({ h: y > 0 ? 2 : 3, d: Math.abs(y), m, s: num(y, P(-0.6, y, 0.2)) }); }
  const names = [['x', P(XS[1] + 0.6, 0, 0.3)], ['y', P(0, YS[1] + 0.6, 0.3)]].map(([t, at]) => { const s = sign(t, 0.42, { color: '#ffd23f' }); s.position.copy(at); s.visible = false; g.add(s); return s; });
  // a string grid, one metre apart
  const parts = [];
  for (let x = XS[0]; x <= XS[1]; x++) if (x) { const b = new THREE.BoxGeometry(0.025, 0.002, YS[1] - YS[0]); b.translate(x, 0.004, OZ - (YS[0] + YS[1]) / 2); parts.push(b); }
  for (let y = YS[0]; y <= YS[1]; y++) if (y) { const b = new THREE.BoxGeometry(XS[1] - XS[0], 0.002, 0.025); b.translate(0, 0.004, OZ - y); parts.push(b); }
  const grid = new THREE.Mesh(mergeGeometries(parts), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35, depthWrite: false, toneMapped: false })); grid.visible = false; grid.userData.noHit = true; g.add(grid);
  // the four quadrants, tinted
  const QC = [0x8be07a, 0x5ec8ff, 0xff8a3d, 0xc58bff];
  it.quadMeshes = [[1, 1], [-1, 1], [-1, -1], [1, -1]].map(([sx, sy], i) => {
    const w = sx > 0 ? XS[1] : -XS[0], d = sy > 0 ? YS[1] : -YS[0];
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d).rotateX(-Math.PI / 2), glow(QC[i], 0.2)); m.position.copy(P((sx * w) / 2, (sy * d) / 2, 0.005)); m.visible = false; m.userData.noHit = true; g.add(m); return m;
  });
  // the points: a football at A, cones at B, C and D
  const PTS = o.points || [{ n: 'A', x: 4, y: 3, ball: true }, { n: 'B', x: -3, y: 4 }, { n: 'C', x: -4, y: -2 }, { n: 'D', x: 3, y: -3 }]; it.PTS = PTS;
  const mX = glow(COL.base), mY = glow(COL.up), BR = 0.11;
  for (const p of PTS) {
    p.r1 = rod(P(0, 0, 0.03), P(0, 0, 0.03), 0.03, mX); p.r2 = rod(P(0, 0, 0.03), P(0, 0, 0.03), 0.03, mY); p.r1.visible = p.r2.visible = false; g.add(p.r1, p.r2);
    p.obj = new THREE.Group(); p.obj.visible = false; g.add(p.obj);
    if (p.ball) {
      p.spin = new THREE.Group(); p.spin.position.y = BR; p.obj.add(p.spin);
      const tmp = new THREE.Mesh(new THREE.SphereGeometry(BR, 24, 16), new THREE.MeshStandardMaterial({ color: 0xf0f0f0, roughness: 0.6 })); tmp.castShadow = true; p.spin.add(tmp);
      glb('football.glb').then((s) => { p.spin.remove(tmp); p.spin.add(fit(s, 2 * BR, true)); }).catch(() => { /* keep the plain ball */ });
    } else p.obj.add(trafficCone());
    p.walker = new THREE.Mesh(new THREE.RingGeometry(0.16, 0.22, 32).rotateX(-Math.PI / 2), glow(0xffffff, 0.9)); p.walker.visible = false; p.walker.userData.noHit = true; g.add(p.walker);
    p.dot = new THREE.Mesh(new THREE.CircleGeometry(0.1, 24).rotateX(-Math.PI / 2), glow(0xffffff)); p.dot.position.copy(P(p.x, p.y, 0.012)); p.dot.visible = false; p.dot.userData.noHit = true; g.add(p.dot);
  }
  // the straight line from O to the ball
  const oa = rod(P(0, 0, 0.05), P(0, 0, 0.05), 0.035, glow(COL.ok)); oa.visible = false; g.add(oa);
  it.axes = (k) => {
    const e = ease(clamp01(k)); for (const h of halves) { setStripe(h.m, P(0, 0), P(h.x * e, h.y * e)); h.m.visible = e > 0.001; }
    for (const t of ticks) { const on = e * halves[t.h].L >= t.d - 0.01; t.m.visible = on; t.s.visible = on; }
    for (const s of names) s.visible = e > 0.98; grid.visible = e > 0.98;
  };
  it.place = (i, k) => {
    const p = PTS[i], e = ease(clamp01(k / 0.86)), L1 = Math.abs(p.x), L2 = Math.abs(p.y), d = e * (L1 + L2), a = Math.min(d, L1), b = Math.max(0, d - L1), sx = Math.sign(p.x), sy = Math.sign(p.y);
    setRod(p.r1, P(0, 0, 0.03), P(sx * a, 0, 0.03)); p.r1.visible = a > 0.01;
    setRod(p.r2, P(p.x, 0, 0.03), P(p.x, sy * b, 0.03)); p.r2.visible = b > 0.01;
    const cur = P(sx * a, sy * b, 0);
    if (p.ball) { p.obj.visible = k > 0; p.obj.position.copy(cur); p.spin.rotation.set((-sy * b) / BR, 0, (-sx * a) / BR); }
    else { p.walker.visible = k > 0 && k < 0.9; p.walker.position.copy(cur).setY(0.015); const f = seg(k, 0.86, 1); p.obj.visible = k > 0.86; p.obj.position.copy(P(p.x, p.y, (1 - f) * (1 - f) * 1.4)); }
    p.dot.visible = k >= 1;
  };
  it.quads = (on) => it.quadMeshes.forEach((m) => { m.visible = on; });
  it.straight = (k) => { const A = PTS[0]; setRod(oa, P(0, 0, 0.05), P(0, 0, 0.05).lerp(P(A.x, A.y, 0.05), ease(clamp01(k)))); oa.visible = k > 0.01; };
  it.at = (k) => {
    const p = PTS.find((q) => q.n === k); if (p) return P(p.x, p.y, p.ball ? 0.75 : 1.0);
    return { O: P(-0.9, -0.9, 0.7), q1: P(4.5, 1.6, 0.6), q2: P(-4.5, 1.6, 0.6), q3: P(-2.2, -3.2, 0.6), q4: P(1.6, -1.4, 0.6), OA: P(2.0, 1.5, 0.9), top: P(5.4, 1.2, 0.9) }[k] || P(0, 0, 1);
  };
  it.noGrab = true; it.noPhys = true; it.height = 0.1; it.radius = 6; it.base = 0; return it;
}

// ------------------------------------------------------------------ Class 6: the same rope, different fields (a farm)
// A farmer has 24 m of rope and four posts. The rope goes round the posts; the posts can be moved. The area inside is
// counted in squares of 1 m.
export function fencePlot(o = {}) {
  const it = new Item('wfence', { ...o, name: { en: 'Rope fence round a plot', hi: 'खेत के टुकड़े के चारों ओर रस्सी की बाड़', hg: 'Plot ke chaaron or rassi ki fence' } });
  const g = it.g, C = V(0, 0, o.cz ?? -6.5), PER = 24;
  const wt = new THREE.TextureLoader().load('../maths/tex/wood_table_diff.jpg'); wt.colorSpace = THREE.SRGBColorSpace; wt.wrapS = wt.wrapT = THREE.RepeatWrapping; wt.repeat.set(0.25, 1.6);
  const wood = new THREE.MeshStandardMaterial({ map: wt, color: 0x9c7a58, roughness: 0.88 });
  const PH = 1.05, postGeo = new THREE.CylinderGeometry(0.045, 0.055, PH, 10); postGeo.translate(0, PH / 2, 0);
  const capGeo = new THREE.ConeGeometry(0.046, 0.07, 10); capGeo.translate(0, PH + 0.035, 0);
  const posts = [0, 1, 2, 3].map(() => { const p = new THREE.Group(); const a = new THREE.Mesh(postGeo, wood), b = new THREE.Mesh(capGeo, wood); for (const m of [a, b]) { m.castShadow = true; m.receiveShadow = true; m.userData.noHit = true; p.add(m); } g.add(p); return p; });
  const ropeM = new THREE.MeshStandardMaterial({ color: 0xd6c08a, roughness: 0.95 });
  const ropes = []; for (const hy of [0.92, 0.5]) for (let s = 0; s < 4; s++) { const r = rod(V(0, 0, 0), V(0, 0, 0), 0.011, ropeM); r.castShadow = true; r.visible = false; g.add(r); ropes.push({ r, hy, s }); }
  // the coil of rope that unwinds
  const coil = new THREE.Group(); for (let i = 0; i < 4; i++) { const t = new THREE.Mesh(new THREE.TorusGeometry(0.17 - i * 0.012, 0.016, 6, 28).rotateX(Math.PI / 2), ropeM); t.position.y = 0.018 + i * 0.03; t.castShadow = true; coil.add(t); } g.add(coil);
  // squares of 1 m
  const tiles = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.9, 0.9).rotateX(-Math.PI / 2), glow(0xb6f27a, 0.42), 40); tiles.count = 0; tiles.frustumCulled = false; tiles.userData.noHit = true; g.add(tiles);
  it.a = o.a ?? 10; it.b = PER / 2 - it.a; it.ropeK = 0; it.labels = [];
  const corners = () => { const a = it.a, b = it.b; return [V(-a / 2, 0, C.z + b / 2), V(a / 2, 0, C.z + b / 2), V(a / 2, 0, C.z - b / 2), V(-a / 2, 0, C.z - b / 2)]; };
  const update = () => {
    const c = corners(), L = [it.a, it.b, it.a, it.b], cum = [0, it.a, it.a + it.b, 2 * it.a + it.b], run = it.ropeK * PER;
    posts.forEach((p, i) => { const k = ease(clamp01((run - cum[i] + 1.5) / 1.5)); p.position.copy(c[i]); p.scale.set(1, Math.max(0.001, k), 1); p.visible = k > 0.001; });
    for (const { r, hy, s } of ropes) { const len = Math.min(L[s], Math.max(0, run - cum[s])); const a = c[s].clone().setY(hy), b = c[(s + 1) % 4].clone().setY(hy); setRod(r, a, a.clone().lerp(b, len / L[s])); r.visible = len > 0.01; }
    coil.position.copy(c[0]).add(V(-0.45, 0, 0.35)); const ck = 1 - it.ropeK; coil.scale.set(1, Math.max(0.001, ck), 1); coil.visible = ck > 0.02;
  };
  update();
  it.fence = (k) => { it.ropeK = clamp01(k); update(); };
  it.tiles = (k) => {
    const n = Math.round(it.a * it.b), m = Math.floor(clamp01(k) * n + 1e-6), M = new THREE.Matrix4(); tiles.count = m;
    for (let i = 0; i < m; i++) { const row = Math.floor(i / it.a), col = i % it.a; M.makeTranslation(-it.a / 2 + col + 0.5, 0.02, C.z + it.b / 2 - row - 0.5); tiles.setMatrixAt(i, M); }
    tiles.instanceMatrix.needsUpdate = true;
  };
  it.morph = (a0, a1, k) => { it.a = lerp(a0, a1, ease(clamp01(k))); it.b = PER / 2 - it.a; tiles.count = 0; update(); if (k >= 1) { it.a = a1; it.b = PER / 2 - a1; update(); } };
  it.sides = (on) => {
    for (const s of it.labels) g.remove(s); it.labels = []; if (!on) return;
    const a = Math.round(it.a), b = Math.round(it.b);
    const s1 = sign(`${a} m`, 0.36, { color: '#ffd23f' }); s1.position.set(0, 0.4, C.z + b / 2 + 0.55);
    const s2 = sign(`${b} m`, 0.36, { color: '#5ec8ff' }); s2.position.set(a / 2 + 0.75, 0.4, C.z);
    g.add(s1, s2); it.labels.push(s1, s2);
  };
  it.at = (k) => ({ top: V(0, 2.1, C.z), area: V(0, 1.55, C.z), note: V(0, 2.7, C.z), rope: V(-it.a / 2 - 1.2, 1.4, C.z + it.b / 2) }[k] || V(0, 1.5, C.z));
  it.noGrab = true; it.noPhys = true; it.height = 1; it.radius = 6; it.base = 0; return it;
}

// ------------------------------------------------------------------ Class 10: a cone of wheat and a drum (a farm)
// A cone-shaped measure and a steel drum with the same radius (30 cm) and height (70 cm). The cone is filled with wheat
// from a bucket and emptied into the drum: three cones fill it. Then the same rule finds the wheat in a heap.
export function grainScene(o = {}) {
  const it = new Item('wgrain', { ...o, name: { en: 'Wheat, a cone and a drum', hi: 'गेहूँ, शंकु और ड्रम', hg: 'Gehun, cone aur drum' } });
  const g = it.g, R = 0.3, H = 0.7, Z = -2.1, DX = 0.5, CX = -0.45, RIM = 0.84;
  it.R = R; it.H = H;
  const steel = new THREE.MeshStandardMaterial({ color: 0xc3c9cf, metalness: 0.85, roughness: 0.36 });
  const steelIn = new THREE.MeshStandardMaterial({ color: 0x9aa1a8, metalness: 0.8, roughness: 0.45, side: THREE.BackSide });
  const brass = new THREE.MeshStandardMaterial({ color: 0xd2a856, metalness: 0.88, roughness: 0.3, side: THREE.DoubleSide });
  const iron = new THREE.MeshStandardMaterial({ color: 0x34383c, metalness: 0.6, roughness: 0.55 });
  const sh = (m) => { m.castShadow = true; m.receiveShadow = true; m.userData.noHit = true; return m; };
  // the drum, open at the top
  const drum = new THREE.Group(); drum.position.set(DX, 0, Z); g.add(drum);
  const wall = sh(new THREE.Mesh(new THREE.CylinderGeometry(R, R, H, 48, 1, true), steel)); wall.position.y = H / 2;
  const wallIn = sh(new THREE.Mesh(new THREE.CylinderGeometry(R - 0.004, R - 0.004, H, 48, 1, true), steelIn)); wallIn.position.y = H / 2;
  const floor = sh(new THREE.Mesh(new THREE.CircleGeometry(R, 48).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x8d949b, metalness: 0.8, roughness: 0.5 }))); floor.position.y = 0.008;
  const rimT = sh(new THREE.Mesh(new THREE.TorusGeometry(R + 0.002, 0.011, 8, 48).rotateX(Math.PI / 2), steel)); rimT.position.y = H;
  const rimB = sh(new THREE.Mesh(new THREE.TorusGeometry(R + 0.004, 0.014, 8, 48).rotateX(Math.PI / 2), steel)); rimB.position.y = 0.014;
  drum.add(wall, wallIn, floor, rimT, rimB);
  const dfillGeo = new THREE.CylinderGeometry(R - 0.006, R - 0.006, 1, 48); dfillGeo.translate(0, 0.5, 0);
  const dfill = sh(new THREE.Mesh(dfillGeo, wheatMat(3))); dfill.visible = false; drum.add(dfill);
  const marks = [1, 2].map((n) => { const m = new THREE.Mesh(new THREE.TorusGeometry(R - 0.004, 0.005, 6, 48).rotateX(Math.PI / 2), glow(COL.ok)); m.position.y = (H * n) / 3; m.visible = false; m.userData.noHit = true; drum.add(m); return m; });
  // the cone-shaped measure (brass, point down) in a three-legged stand
  const home = V(CX, RIM, Z);
  const cone = new THREE.Group(); cone.position.copy(home); g.add(cone); // origin: the centre of its rim
  cone.add(sh(new THREE.Mesh(new THREE.LatheGeometry([new THREE.Vector2(0.004, -H), new THREE.Vector2(R, 0), new THREE.Vector2(R + 0.01, 0.006)], 48), brass)));
  cone.add(sh(new THREE.Mesh(new THREE.TorusGeometry(R + 0.006, 0.007, 6, 48).rotateX(Math.PI / 2), brass)));
  const cfillGeo = new THREE.ConeGeometry(R - 0.004, H, 48); cfillGeo.rotateX(Math.PI); cfillGeo.translate(0, H / 2, 0);
  const cfill = sh(new THREE.Mesh(cfillGeo, wheatMat(2))); cfill.position.y = -H; cfill.visible = false; cone.add(cfill);
  const stand = new THREE.Group(); stand.position.set(CX, 0, Z); g.add(stand);
  stand.add(sh(new THREE.Mesh(new THREE.TorusGeometry(R + 0.02, 0.012, 6, 40).rotateX(Math.PI / 2), iron))); stand.children[0].position.y = RIM - 0.014;
  for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI * 2 + 0.5; stand.add(sh(rod(V(Math.cos(a) * (R + 0.02), RIM - 0.014, Math.sin(a) * (R + 0.02)), V(Math.cos(a) * (R + 0.16), 0, Math.sin(a) * (R + 0.16)), 0.012, iron))); }
  // a steel bucket full of wheat
  const BH = 0.3, B0 = 0.12, B1 = 0.15, bhome = V(-1.15, 0, Z - 0.15);
  const bucket = new THREE.Group(); bucket.position.copy(bhome); g.add(bucket);
  bucket.add(sh(new THREE.Mesh(new THREE.LatheGeometry([new THREE.Vector2(0, 0.003), new THREE.Vector2(B0, 0), new THREE.Vector2(B1, BH), new THREE.Vector2(B1 + 0.008, BH + 0.004)], 40), new THREE.MeshStandardMaterial({ color: 0xc8ced4, metalness: 0.85, roughness: 0.34, side: THREE.DoubleSide }))));
  const handle = sh(new THREE.Mesh(new THREE.TorusGeometry(B1, 0.005, 6, 24, Math.PI), iron)); handle.position.y = BH; handle.rotation.y = Math.PI / 2; bucket.add(handle);
  const bf = BH * 0.86; const bfillGeo = new THREE.CylinderGeometry(B0 + (B1 - B0) * 0.86 - 0.006, B0 - 0.004, bf, 40); bfillGeo.translate(0, bf / 2, 0);
  bucket.add(sh(new THREE.Mesh(bfillGeo, wheatMat(1.5))));
  // the heap of wheat on the threshing floor: a cone with a rounded top
  const HP = V(-2.6, 0, -4.9), HR = 1.5, HHt = 1.0; it.HR = HR; it.HH = HHt;
  const prof = [[HR + 0.1, 0], [HR, 0.04]]; for (let i = 1; i <= 10; i++) { const t = i / 10; prof.push([HR * (1 - t) + 0.02, 0.04 + (HHt - 0.06) * t - (t > 0.85 ? (t - 0.85) * 0.06 : 0)]); } prof.push([0, HHt]);
  const hg = new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r, y)), 96);
  { const p = hg.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), r = Math.hypot(x, z); if (r < 0.05 || y < 0.03) continue; const a = Math.atan2(z, x), t = y / HHt;
    const d = (Math.sin(a * 7 + y * 9) * 0.6 + Math.sin(a * 19 - y * 23) * 0.3 + Math.sin(a * 41 + y * 47) * 0.15) * 0.028 * Math.sin(Math.PI * Math.min(1, t * 1.15)); p.setX(i, (x / r) * (r + d)); p.setZ(i, (z / r) * (r + d)); } hg.computeVertexNormals(); }
  const hm = wheatMat(12, 4); hm.color.set(0xf2dcb0);
  const heap = sh(new THREE.Mesh(hg, hm)); heap.position.copy(HP); g.add(heap);
  const xr = (c) => { const m = glow(c); m.depthTest = false; return m; };
  const hLine = rod(HP.clone().setY(0.02), HP.clone().setY(HHt), 0.018, xr(COL.up)), rLine = rod(HP.clone().setY(0.03), HP.clone().add(V(HR, 0.03, 0)), 0.018, xr(COL.base));
  for (const m of [hLine, rLine]) { m.renderOrder = 30; m.visible = false; g.add(m); }
  // radius and height of the cone and the drum
  const dims = new THREE.Group(); dims.visible = false; g.add(dims);
  dims.add(rod(V(DX, H + 0.03, Z), V(DX + R, H + 0.03, Z), 0.008, glow(COL.base)), rod(V(DX + R + 0.07, 0, Z), V(DX + R + 0.07, H, Z), 0.008, glow(COL.up)));
  dims.add(rod(V(CX, RIM + 0.03, Z), V(CX - R, RIM + 0.03, Z), 0.008, glow(COL.base)), rod(V(CX, RIM - H, Z), V(CX, RIM, Z).add(V(0, 0, 0)), 0.008, xr(COL.up)));
  dims.children[3].renderOrder = 30;
  // falling grain
  const stream = grainStream(); g.add(stream);
  it.coneF = 0; it.drumF = 0;
  const setCone = (f) => { it.coneF = f; cfill.visible = f > 0.002; const s = Math.cbrt(Math.max(0.002, f)); cfill.scale.setScalar(s); };
  const setDrum = (f) => { it.drumF = f; dfill.visible = f > 0.002; dfill.scale.y = Math.max(0.001, f * (H - 0.012)); dfill.position.y = 0.01; };
  it.dims = (on) => { dims.visible = on; };
  // the bucket is lifted over the cone, tipped, and pours until the cone is full
  const lipB = V(B1, BH, 0), TB = 1.75; const rz = (v, th) => V(v.x * Math.cos(th) + v.y * Math.sin(th), -v.x * Math.sin(th) + v.y * Math.cos(th), v.z);
  const bPour = V(CX - 0.06, RIM + 0.16, Z).sub(rz(lipB, TB));
  it.fillCone = (k, f0 = 0) => {
    const up = ease(seg(k, 0, 0.2)), tilt = ease(seg(k, 0.2, 0.34)) * (1 - ease(seg(k, 0.84, 0.92))), back = ease(seg(k, 0.88, 1)), th = tilt * TB;
    const p = bhome.clone().lerp(bPour, up * (1 - back)); p.y += Math.sin(Math.PI * up) * 0.12 * (1 - back); bucket.position.copy(p); bucket.rotation.z = -th;
    const f = lerp(f0, 1, seg(k, 0.34, 0.84)); setCone(f);
    if (k > 0.3 && k < 0.84) stream.flow(p.clone().add(rz(lipB, th)), V(0.35, 0, 0), RIM - H + H * Math.cbrt(Math.max(0.01, f)) - 0.02); else stream.stop();
  };
  // the cone is lifted out of its stand, carried over the drum and tipped; the wheat runs into the drum
  const lipC = V(R, 0, 0), TC = 2.15, cPour = V(DX - 0.08, H + 0.12, Z).sub(rz(lipC, TC));
  it.pour = (n, k) => {
    const lift = ease(seg(k, 0, 0.14)), over = ease(seg(k, 0.1, 0.3)), tilt = ease(seg(k, 0.26, 0.42)) * (1 - ease(seg(k, 0.84, 0.92))), back = ease(seg(k, 0.88, 1)), th = tilt * TC;
    const up = home.clone().add(V(0, 0.8, 0)), p = home.clone().lerp(up, lift).lerp(cPour, over); if (back > 0) p.copy(cPour.clone().lerp(up, Math.min(1, back * 2)).lerp(home, Math.max(0, back * 2 - 1)));
    cone.position.copy(p); cone.rotation.z = -th;
    const f = 1 - seg(k, 0.4, 0.84); setCone(k >= 1 ? 0 : f); const D = (n - 1 + seg(k, 0.44, 0.88)) / 3; setDrum(D);
    if (k > 0.38 && k < 0.84) stream.flow(p.clone().add(rz(lipC, th)), V(0.25, 0, 0), H * D + 0.005); else stream.stop();
    if (k >= 1) { cone.position.copy(home); cone.rotation.z = 0; }
  };
  it.mark = (n, on) => { if (marks[n - 1]) marks[n - 1].visible = on; };
  it.heapMeasure = (on) => { hLine.visible = rLine.visible = on; };
  it.update = (dt) => stream.tick(dt);
  it.at = (k) => ({ drum: V(DX, H + 0.35, Z), drumR: V(DX + R / 2, H + 0.16, Z), drumH: V(DX + R + 0.3, H / 2, Z), cone: V(CX, RIM + 0.4, Z), coneR: V(CX - R / 2, RIM + 0.16, Z), coneH: V(CX - 0.45, RIM - H / 2, Z), m1: V(DX + R + 0.35, H / 3, Z), m2: V(DX + R + 0.35, (2 * H) / 3, Z), full: V(DX, H + 0.55, Z), heap: V(HP.x + 0.3, HHt + 0.42, HP.z + 0.3), heapR: V(HP.x + HR / 2, 0.35, HP.z + 0.4), heapH: V(HP.x - 0.45, HHt / 2 + 0.1, HP.z + 0.3), calc: V(-0.8, 1.9, -3.4) }[k] || V(0, 1.2, Z));
  it.noGrab = true; it.noPhys = true; it.height = 1; it.radius = 3; it.base = 0; return it;
}

// ------------------------------------------------------------------ hands-on: things the student moves along a path
// A handle is an item the student grabs (mouse drag, or a hand / controller in the headset) and moves along a path from A
// to B; how far along it is (k, 0…1) drives the activity. With the mouse it stays on the path; in a hand it follows the hand
// and k comes from the nearest point of the path. Let go: it stays where the work has got to.
function handle(it, o) {
  const v = V(0, 0, 0), ab = V(0, 0, 0), ap = V(0, 0, 0);
  it.noGrab = false; it.noPhys = true; it.k = 0;
  const kOf = (p) => { const [A, B] = o.path(); ab.subVectors(B, A); ap.subVectors(p, A); const L2 = ab.lengthSq() || 1; const k = clamp01(ap.dot(ab) / L2); const off = ap.addScaledVector(ab, -k).setY(0).length(); return { k, off }; };
  const upd0 = it.update;
  it.update = (dt, t) => {
    if (upd0) upd0(dt, t);
    const on = o.active(); it.g.visible = on || !!o.keepVisible?.();
    if (it.pulse) it.pulse.scale.setScalar(1 + 0.25 * Math.sin((t || performance.now() / 1000) * 5) * (on && !it.held ? 1 : 0));
    if (!it.held || !on) return;
    if (it.held === 'pointer' && it._set && it.g.position.distanceToSquared(it._set) < 1e-10) return; // the mouse has not moved
    const p = it.g.getWorldPosition(v), r = kOf(p);
    if (it.held !== 'pointer' && r.off > 0.25) return; // a hand far from the path does nothing
    o.move(r.k, p.clone());
    if (it.held === 'pointer') { it.g.position.copy(o.at()); it._set = it.g.position.clone(); }
  };
  it.onRelease = () => { const q = o.at(); const p0 = it.g.position.clone(), q0 = it.g.quaternion.clone(), q1 = new THREE.Quaternion();
    let n = 0; const step = () => { n++; const e = Math.min(1, n / 12); it.g.position.lerpVectors(p0, o.at(), e); it.g.quaternion.slerpQuaternions(q0, q1, e); if (e < 1 && !it.held) requestAnimationFrame(step); }; void q; step(); };
  return it;
}
// a round mat made of rings of coloured rope, one inside the other (radius R, n rings), lying on the table. It can be cut
// along a radius (the cut faces the student) and its rings straightened: each ring keeps its length 2πρ and lies straight,
// the longest nearest the student, so together they make a triangle with base 2πR and height R.
let ROPE = null;
const ropeTex = () => ROPE || (ROPE = (() => { const t = canvasTex(128, 32, (x, W, H) => {
  const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#9a948a'); g.addColorStop(0.25, '#f2eee6'); g.addColorStop(0.5, '#ffffff'); g.addColorStop(0.75, '#f2eee6'); g.addColorStop(1, '#9a948a'); x.fillStyle = g; x.fillRect(0, 0, W, H);
  x.strokeStyle = 'rgba(60,45,30,0.38)'; x.lineWidth = 3; for (let i = -2; i < 10; i++) { x.beginPath(); x.moveTo(i * 16, H); x.lineTo(i * 16 + 22, 0); x.stroke(); }
  x.strokeStyle = 'rgba(255,255,255,0.35)'; x.lineWidth = 2; for (let i = -2; i < 10; i++) { x.beginPath(); x.moveTo(i * 16 + 6, H); x.lineTo(i * 16 + 28, 0); x.stroke(); } }); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; })());
export function ringMat(o = {}) {
  const it = new Item('wringmat', { ...o, name: { en: 'Round rope mat', hi: 'रस्सी की गोल चटाई', hg: 'Rassi ki gol chatai' } });
  const R = o.r ?? 0.2, S = 72, COLS = [0xc8382c, 0xe9a92b, 0x2e7d4f, 0x2c5fa8, 0xefe6d2];
  const mats = COLS.map((c) => new THREE.MeshStandardMaterial({ map: ropeTex(), color: c, roughness: 0.88 }));
  it.R = R; it.cutK = 0; it.unK = 0; it.rings = []; it.n = 0;
  const holder = new THREE.Group(); it.g.add(holder);
  const geo = () => { const g = new THREE.BufferGeometry(), n = (S + 1) * 2; const nor = new Float32Array(n * 3); for (let i = 0; i < n; i++) nor[i * 3 + 1] = 1;
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(n * 2), 2));
    const idx = []; for (let j = 0; j < S; j++) { const a = j * 2, b = a + 1, c = a + 2, d = a + 3; idx.push(a, b, c, b, d, c); } g.setIndex(idx); return g; };
  const build = (n) => {
    for (const r of it.rings) { holder.remove(r.m); r.m.geometry.dispose(); }
    it.rings = []; it.n = n; const w = R / n;
    for (let i = 0; i < n; i++) { const m = new THREE.Mesh(geo(), mats[i % COLS.length]); m.castShadow = true; m.receiveShadow = true; m.frustumCulled = false; holder.add(m); it.rings.push({ m, rho: (i + 0.5) * w, w: w * (n > 20 ? 0.98 : 0.9), y: 0.004 + i * 0.0004 }); }
    draw();
  };
  // ring i: an arc of fixed length 2πρ that opens from a full circle (k = 0) into a straight line (k = 1) around its cut
  const draw = () => {
    const k = it.unK, cutAt = it.cutK * (R + 0.012);
    for (const r of it.rings) {
      const p = r.m.geometry.attributes.position.array, uv = r.m.geometry.attributes.uv.array, L = 2 * Math.PI * r.rho, cut = cutAt >= r.rho + r.w / 2 || k > 0;
      const gap = cut ? 0.0025 : 0, zm = -r.rho + 2 * r.rho * ease(k), straight = 1 - k < 1e-4, Rk = r.rho / Math.max(1e-4, 1 - k);
      for (let j = 0; j <= S; j++) {
        const s = -L / 2 + gap + ((L - 2 * gap) * j) / S; let px, pz, nx, nz;
        if (straight) { px = s; pz = zm; nx = 0; nz = 1; } else { const f = s / Rk; px = Rk * Math.sin(f); pz = zm + Rk * (1 - Math.cos(f)); nx = -Math.sin(f); nz = Math.cos(f); }
        const h = r.w / 2, a = j * 6;
        p[a] = px - nx * h; p[a + 1] = r.y; p[a + 2] = pz - nz * h; p[a + 3] = px + nx * h; p[a + 4] = r.y; p[a + 5] = pz + nz * h;
        uv[j * 4] = (s + L / 2) / 0.03; uv[j * 4 + 1] = 0; uv[j * 4 + 2] = (s + L / 2) / 0.03; uv[j * 4 + 3] = 1;
      }
      r.m.geometry.attributes.position.needsUpdate = true; r.m.geometry.attributes.uv.needsUpdate = true; r.m.geometry.computeBoundingSphere();
    }
  };
  build(o.n ?? 10);
  // the cut line (a radius) and the measuring lines of the triangle
  const cutLine = rod(V(0, 0.012, 0), V(0, 0.012, 0), 0.0015, glow(0xffffff, 0.9)); cutLine.visible = false; it.g.add(cutLine);
  const base = rod(V(-Math.PI * R, 0.012, R + 0.012), V(Math.PI * R, 0.012, R + 0.012), 0.0025, glow(COL.base)), ht = rod(V(0, 0.014, R), V(0, 0.014, 0), 0.0025, glow(COL.up));
  base.visible = ht.visible = false; it.g.add(base, ht);
  it.cut = (k) => { it.cutK = Math.max(it.cutK, clamp01(k)); const L = it.cutK * (R + 0.012); setRod(cutLine, V(0, 0.012, 0), V(0, 0.012, L)); cutLine.visible = it.cutK > 0.01 && it.unK < 0.05; draw(); if (it.cutK >= 0.98 && it.onCut) it.onCut(); };
  it.unroll = (k) => { if (it.cutK < 0.98) return; it.unK = clamp01(k); cutLine.visible = it.unK < 0.05; draw(); if (it.unK >= 0.985 && it.onStraight) { it.unK = 1; draw(); it.onStraight(); } };
  it.rebuild = (n) => { build(n); };
  it.measures = (on) => { base.visible = ht.visible = on; };
  // where things are, in the room
  const W = (x, y, z) => it.g.localToWorld(V(x, y, z));
  it.cutterAt = () => W(0, 0, it.cutK * (R + 0.012)); // the cutter's wheel touches the mat here
  it.cutPath = () => [W(0, 0, 0), W(0, 0, R + 0.012)];
  it.endAt = () => { const r = it.rings[it.rings.length - 1], L = 2 * Math.PI * r.rho, k = it.unK; if (1 - k < 1e-4) return W(L / 2 + 0.012, 0.006, -r.rho + 2 * r.rho * ease(k)); const Rk = r.rho / (1 - k), f = L / 2 / Rk; return W(Rk * Math.sin(f) + 0.012, 0.006, -r.rho + 2 * r.rho * ease(k) + Rk * (1 - Math.cos(f))); };
  it.pullPath = () => [W(0, 0.006, R), W(Math.PI * R + 0.012, 0.006, R)];
  // how far the rings are straightened when the end of the outer ring is pulled to (world) point p: the end's x grows with k
  it.kForEnd = (p) => { const x = it.g.worldToLocal(p.clone()).x - 0.012, r = it.rings[it.rings.length - 1], L = 2 * Math.PI * r.rho;
    const ex = (k) => (1 - k < 1e-4 ? L / 2 : (r.rho / (1 - k)) * Math.sin((L / 2) * (1 - k) / r.rho)); if (x <= 0) return 0; if (x >= L / 2) return 1;
    let lo = 0, hi = 1; for (let i = 0; i < 22; i++) { const m = (lo + hi) / 2; if (ex(m) < x) lo = m; else hi = m; } return (lo + hi) / 2; };
  it.at = (k) => ({ cut: W(0.07, 0.05, R / 2), base: W(0, 0.03, R + 0.06), ht: W(-0.05, 0.04, R / 2), area: W(0, 0.12, -0.02), area2: W(0, 0.075, -0.02), tri: W(0, 0.09, R / 2), circle: W(0, 0.07, -R - 0.03) }[k] || W(0, 0.1, 0));
  it.noGrab = true; it.noPhys = true; it.height = 0.02; it.radius = R; it.grabY = 0.01; return it;
}
// a pizza cutter: its wheel rolls along the cut
export function pizzaCutter(o = {}) {
  const it = new Item('wcutter', { ...o, name: { en: 'Cutter', hi: 'कटर', hg: 'Cutter' } });
  const steel = new THREE.MeshStandardMaterial({ color: 0xdfe3e8, metalness: 0.9, roughness: 0.25 }), red = new THREE.MeshStandardMaterial({ color: 0xc8322a, roughness: 0.5 });
  const wheel = new THREE.Group(); wheel.position.y = 0.032; it.g.add(wheel);
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.0025, 36), steel); disc.rotation.z = Math.PI / 2; wheel.add(disc);
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.012, 16), steel); hub.rotation.z = Math.PI / 2; wheel.add(hub);
  const fork = rod(V(0.008, 0.032, 0), V(0.008, 0.07, 0.04), 0.003, steel); it.g.add(fork);
  const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.013, 0.1, 16), red); grip.position.set(0.008, 0.105, 0.077); grip.rotation.x = Math.PI / 4; it.g.add(grip);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.02, 0.003, 8, 32), glow(0xffd23f, 0.85)); ring.position.copy(grip.position); ring.rotation.x = Math.PI / 4 + Math.PI / 2; ring.userData.noHit = true; it.g.add(ring); it.pulse = ring;
  for (const m of [disc, hub, grip]) { m.castShadow = true; }
  it.spin = (d) => { wheel.rotation.x -= d / 0.032; };
  it.height = 0.15; it.radius = 0.04; it.grabY = 0.1; it.base = 0; return it;
}
// a glowing knob at the cut end of the outer ring: pull it to straighten the rings
export function pullTab(o = {}) {
  const it = new Item('wpull', { ...o, name: { en: 'End of the rope', hi: 'रस्सी का सिरा', hg: 'Rassi ka sira' } });
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.014, 20, 14), new THREE.MeshStandardMaterial({ color: 0xffd23f, emissive: 0x7a5a00, roughness: 0.4 })); knob.position.y = 0.012; it.g.add(knob);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.026, 0.003, 8, 32), glow(0xffd23f, 0.85)); ring.rotation.x = Math.PI / 2; ring.position.y = 0.006; ring.userData.noHit = true; it.g.add(ring); it.pulse = ring;
  it.height = 0.03; it.radius = 0.02; it.grabY = 0.012; it.base = 0; return it;
}
// joins the cutter and the rope end to the mat: each works only in its own step of the activity
export function bindRingHands(mat, cutter, tab, app, steps = { cut: 0, pull: 1 }) {
  const now = (i) => { const r = app.runner; return r.exp && r.i === i && r.state === 'todo'; };
  let last = 0;
  handle(cutter, { path: () => mat.cutPath(), active: () => now(steps.cut) && mat.cutK < 0.98, keepVisible: () => mat.cutK < 0.98,
    move: (k) => { const before = mat.cutK; mat.cut(k); cutter.spin((mat.cutK - before) * (mat.R + 0.012)); }, at: () => mat.cutterAt() });
  handle(tab, { path: () => mat.pullPath(), active: () => now(steps.pull) && mat.cutK >= 0.98 && mat.unK < 0.985, keepVisible: () => mat.cutK >= 0.98 && mat.unK < 0.985,
    move: (k, p) => { mat.unroll(mat.kForEnd(p)); }, at: () => mat.endAt() });
  // follow the mat when the activity moves them (the Do it button)
  const c0 = mat.cut, u0 = mat.unroll;
  mat.cut = (k) => { const before = mat.cutK; c0(k); if (!cutter.held) { cutter.g.position.copy(mat.cutterAt()); cutter.spin((mat.cutK - before) * (mat.R + 0.012)); } };
  mat.unroll = (k) => { u0(k); if (!tab.held) tab.g.position.copy(mat.endAt()); };
  cutter.g.position.copy(mat.cutterAt()); tab.g.position.copy(mat.endAt()); void last;
}
