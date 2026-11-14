// DUET Maths Lab 360: maths at real size in real places (see places.js). Things here stand on the ground (y = 0) around
// the student, who stands at the origin looking along −z: a flagpole in a school courtyard, the rails of a railway line,
// a roti on a kitchen table, a heap of grain in a farm, a playground marked out as a coordinate plane.
// Drawing helpers: glowing lines (rods) that read well in a headset, labels at a size you can read from where you stand,
// angle arcs, right-angle marks and a chalkboard that keeps the working.
import * as THREE from 'three';
import { Item } from './apparatus.js';
import { canvasTex } from './mats.js';
import { ease, lerp, clamp01 } from './mathlab2.js';

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
    x.fillStyle = '#21402f'; x.fillRect(0, 0, W, Hc);
    for (let i = 0; i < 1800; i++) { x.fillStyle = `rgba(255,255,255,${Math.random() * 0.03})`; x.fillRect(Math.random() * W, Math.random() * Hc, 3 + Math.random() * 46, 2 + Math.random() * 8); }
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
    const L = D * it.tapeK; tape.visible = L > 0.01; tape.scale.x = Math.max(0.01, L); tape.position.set(E.x - 0.12, 0.012, E.z - L / 2); tapeT.repeat.set(Math.max(0.001, it.tapeK), 1); tapeT.needsUpdate = true;
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
