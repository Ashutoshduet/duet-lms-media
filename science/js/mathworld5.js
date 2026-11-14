// DUET Maths Lab 360, hands-on in 3D, batch 5 (Class 10): the biggest square tile for a floor (HCF), a stack of logs
// (arithmetic progression), a rope kept parallel to one side of a triangle the student stands in (basic proportionality
// theorem), a bicycle wheel on a road and ropes round a well (tangents), and two dice rolled again and again (probability).
import * as THREE from 'three';
import { Item } from './apparatus.js';
import { canvasTex } from './mats.js';
import { lerp, clamp01, ease } from './mathlab2.js';
import { glow, rod, setRod, rightMark, handle } from './mathworld.js';
import { pushKnob } from './mathworld3.js';
import { liveSign } from './mathworld4.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const FONT = '"Noto Sans Devanagari", "Noto Sans", system-ui, sans-serif';
const stepNow = (app, i) => { const r = app.runner; return !!(r.exp && r.i === i && r.state === 'todo'); };
const M = (c, r = 0.6, m = 0, e = 0) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m, emissive: c, emissiveIntensity: e });
// a knob slid along a straight path that sets a value k (0 … 1) as it goes
export function slideKnob(knob, o) {
  handle(knob, { path: o.path, active: o.active, keepVisible: o.keepVisible, move: (k) => o.set(k), at: () => { const [A, B] = o.path(); return A.clone().lerp(B, clamp01(o.k())); } });
  knob.g.position.copy(o.path()[0].clone().lerp(o.path()[1], clamp01(o.k())));
  return () => { if (!knob.held) { const [A, B] = o.path(); knob.g.position.copy(A.clone().lerp(B, clamp01(o.k()))); } };
}
// a post with a letter on it (points of a figure on the ground)
function post(letter, col = '#ffffff', h = 1.1) {
  const g = new THREE.Group(); const s = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, h, 8), M(0xdddddd, 0.4, 0.5)); s.position.y = h / 2; s.userData.noHit = true; g.add(s);
  const t = canvasTex(128, 128, (x) => { x.fillStyle = col; x.beginPath(); x.arc(64, 64, 60, 0, Math.PI * 2); x.fill(); x.fillStyle = '#10141c'; x.font = `800 84px ${FONT}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(letter, 64, 70); });
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, toneMapped: false })); sp.scale.set(0.26, 0.26, 1); sp.position.y = h + 0.14; sp.userData.noHit = true; g.add(sp);
  return g;
}

// ------------------------------------------------------------------ Ch 1 Real Numbers: the biggest square tile (HCF)
// A floor 360 cm × 240 cm is marked out in front of the student. A slider chooses a square tile size (20 … 150 cm); the
// floor fills with it at once: tiles that would have to be cut are red. Only common factors of 360 and 240 fit.
export function tileFloor(o = {}) {
  const it = new Item('wtilefloor', { ...o, name: { en: 'Floor to tile', hi: 'टाइल लगाने का फ़र्श', hg: 'Tile lagane ka farsh' } });
  const g = it.g, LW = 360, LD = 240, X0 = -1.8, Z0 = -0.55, txt = o.txt || {};
  const out = glow(0xffffff, 0.9); const c = [V(X0, 0.02, Z0), V(X0 + 3.6, 0.02, Z0), V(X0 + 3.6, 0.02, Z0 - 2.4), V(X0, 0.02, Z0 - 2.4)]; for (let i = 0; i < 4; i++) g.add(rod(c[i], c[(i + 1) % 4], 0.018, out));
  const geo = new THREE.BoxGeometry(1, 0.03, 1); geo.translate(0, 0.016, 0);
  const im = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ roughness: 0.5 }), 216); im.frustumCulled = false; im.receiveShadow = true; im.userData.noHit = true; g.add(im);
  const Mx = new THREE.Matrix4(), q = new THREE.Quaternion(), p = V(0, 0, 0), s = V(1, 1, 1), col = new THREE.Color();
  it.sizes = [20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150];
  it.fits = (cm) => LW % cm === 0 && LD % cm === 0;
  const rd = liveSign(0.2, 5); rd.position.set(0, 0.85, -3.3); g.add(rd); it.readout = rd;
  it.size = 0;
  it.setSize = (cm) => {
    if (cm === it.size) return; it.size = cm; const nx = Math.ceil(LW / cm), nz = Math.ceil(LD / cm); let n = 0;
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
      const w = Math.min(cm, LW - i * cm), d = Math.min(cm, LD - j * cm), full = w === cm && d === cm;
      p.set(X0 + (i * cm + w / 2) / 100, 0, Z0 - (j * cm + d / 2) / 100); s.set((w / 100) * 0.96, 1, (d / 100) * 0.96); Mx.compose(p, q, s); im.setMatrixAt(n, Mx);
      im.setColorAt(n, col.set(!full ? 0xd9493a : (i + j) % 2 ? 0xe2d3b5 : 0xb89f7d)); n++;
    }
    im.count = n; im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true;
    const f = it.fits(cm); rd.set([`${cm} cm`, f ? `${txt.fits || 'fits exactly'}: ${LW / cm} × ${LD / cm} = ${(LW / cm) * (LD / cm)} ${txt.tiles || 'tiles'}` : (txt.cut || 'tiles must be cut')], [f ? '#8be07a' : '#ff8a7a', '#ffffff']);
    if (it.onSize) it.onSize(cm);
  };
  it.setSize(50);
  it.kOf = (cm) => it.sizes.indexOf(cm) / (it.sizes.length - 1);
  it.knobPath = () => [V(0.2, 1.0, -0.3), V(0.75, 1.0, -0.3)];
  it.at = (k) => ({ w: V(0, 0.25, Z0 + 0.15), d: V(X0 - 0.3, 0.25, Z0 - 1.2), top: V(0, 2.1, -2.2) }[k] || V(0, 1.8, -2));
  it.noGrab = true; it.noPhys = true; it.height = 0.1; it.radius = 2; it.base = 0; return it;
}
export function bindTileHands(tf, knob, app, s = { tryS: 1, best: 2 }, done = {}) {
  const tried = new Set();
  const sync = slideKnob(knob, { path: () => tf.knobPath(), active: () => stepNow(app, s.tryS) || (stepNow(app, s.best) && tf.size !== 120), keepVisible: () => app.runner.i >= s.tryS && app.runner.i <= s.best,
    k: () => tf.kOf(tf.size), set: (k) => { const cm = tf.sizes[Math.round(k * (tf.sizes.length - 1))]; tf.setSize(cm); if (stepNow(app, s.tryS)) { tried.add(cm); if (tried.size >= 4) done.tried && done.tried(); } } });
  const r0 = knob.onRelease; knob.onRelease = () => { r0(); if (stepNow(app, s.best) && tf.size === 120) done.best && done.best(); };
  const s0 = tf.setSize; tf.setSize = (cm) => { s0(cm); sync(); };
}

// ------------------------------------------------------------------ Ch 5 Arithmetic Progressions: a stack of logs
// 10 logs in the bottom row, one fewer in each row above. Rows are added with a lever. Then the same stack, upside down,
// fills the gaps: every row then has 10 + 1 = 11 logs, so the logs in the stack are half of 10 × 11.
export function logStack(o = {}) {
  const it = new Item('wlogs', { ...o, name: { en: 'Stack of logs', hi: 'लट्ठों का ढेर', hg: 'Latthon ka dher' } });
  const g = it.g, N = 10, r = 0.1, len = 1.1;
  const bark = canvasTex(256, 128, (x) => { x.fillStyle = '#6b4a2e'; x.fillRect(0, 0, 256, 128); for (let i = 0; i < 90; i++) { x.strokeStyle = `rgba(${40 + Math.random() * 40},${25 + Math.random() * 25},12,0.7)`; x.lineWidth = 1 + Math.random() * 3; const y = Math.random() * 128; x.beginPath(); x.moveTo(0, y); x.lineTo(256, y + (Math.random() - 0.5) * 10); x.stroke(); } });
  const rings = canvasTex(128, 128, (x) => { x.fillStyle = '#d8b07a'; x.fillRect(0, 0, 128, 128); x.strokeStyle = 'rgba(130,85,40,0.6)'; for (let k = 6; k < 64; k += 7) { x.lineWidth = 2; x.beginPath(); x.arc(64, 64, k, 0, Math.PI * 2); x.stroke(); } x.strokeStyle = '#5a3a20'; x.lineWidth = 8; x.beginPath(); x.arc(64, 64, 62, 0, Math.PI * 2); x.stroke(); });
  const geo = new THREE.CylinderGeometry(r * 0.97, r * 0.97, len, 18); geo.rotateX(Math.PI / 2);
  const mats = [new THREE.MeshStandardMaterial({ map: bark, roughness: 0.9 }), new THREE.MeshStandardMaterial({ map: rings, roughness: 0.8 }), new THREE.MeshStandardMaterial({ map: rings, roughness: 0.8 })];
  const matsB = mats.map((m) => { const c = m.clone(); c.color = new THREE.Color(0x8fb4ff); return c; });
  const main = new THREE.InstancedMesh(geo, mats, 55), copy = new THREE.InstancedMesh(geo, matsB, 55);
  for (const m of [main, copy]) { m.frustumCulled = false; m.castShadow = true; m.userData.noHit = true; g.add(m); }
  const H = r * Math.sqrt(3);
  const pos = (k, i) => V(-1.1 + r + (i + k / 2) * 2 * r, r + k * H, 0);
  const cells = []; for (let k = 0; k < N; k++) for (let i = 0; i < N - k; i++) cells.push({ k, i });
  const cellsB = []; for (let k = 0; k < N; k++) for (let i = N - k; i <= N; i++) cellsB.push({ k, i });
  const Mx = new THREE.Matrix4(), q = new THREE.Quaternion(), one = V(1, 1, 1), zero = V(0, 0, 0);
  it.rows = 1; it.rise = {}; it.copyK = 0;
  const draw = () => {
    cells.forEach((c, n) => { const e = c.k < it.rows - 1 ? 1 : c.k === it.rows - 1 ? (it.rise[c.k] ?? 1) : 0; const p = pos(c.k, c.i); p.y += (1 - e) * 1.2; Mx.compose(p, q, e > 0 ? one : zero); main.setMatrixAt(n, Mx); });
    cellsB.forEach((c, n) => { const e = clamp01(it.copyK * 1.6 - (c.k / N) * 0.6); const p = pos(c.k, c.i).add(V(2.6 * (1 - ease(e)), 1.6 * (1 - ease(e)), 0)); Mx.compose(p, q, e > 0 ? one : zero); copy.setMatrixAt(n, Mx); });
    main.instanceMatrix.needsUpdate = true; copy.instanceMatrix.needsUpdate = true;
  };
  draw();
  it.add = () => { if (it.rows >= N) return false; it.rise[it.rows] = 0; it.rows += 1; if (it.onRow) it.onRow(it.rows); return true; };
  it.setCopy = (k) => { it.copyK = clamp01(k); draw(); };
  it.update = (dt) => { let ch = false; for (const k in it.rise) if (it.rise[k] < 1) { it.rise[k] = Math.min(1, it.rise[k] + (dt || 0.016) * 2.5); ch = true; } if (ch) draw(); };
  it.rowAt = (k) => g.localToWorld(pos(k, 0).add(V(-0.45, 0, 0.2)));
  it.topAt = () => g.localToWorld(V(0, 2.25, 0.3));
  it.leverPath = () => [V(-0.4, 1.0, -0.3), V(-0.4, 1.0, -0.02)];
  it.noGrab = true; it.noPhys = true; it.height = 1.8; it.radius = 1.3; it.base = 0; return it;
}

// ------------------------------------------------------------------ Ch 6 Triangles: the basic proportionality theorem
// A triangle of rope on the ground: A far ahead, B and C behind the student, who stands inside it. A yellow rope DE is
// kept parallel to BC and slid towards A or back; AD ÷ DB and AE ÷ EC are measured as it moves.
export function bptTriangle(o = {}) {
  const it = new Item('wbpt', { ...o, name: { en: 'Triangle on the ground', hi: 'ज़मीन पर त्रिभुज', hg: 'Zameen par triangle' } });
  const g = it.g, A = V(0, 0.03, -6.2), B = V(-2.3, 0.03, 0.8), C = V(2.3, 0.03, 0.8); it.A = A; it.B = B; it.C = C;
  const wm = glow(0xffffff, 0.95); for (const [a, b] of [[A, B], [B, C], [C, A]]) g.add(rod(a, b, 0.03, wm));
  const de = rod(A, B, 0.04, glow(0xffd23f)); g.add(de);
  const pa = post('A'), pb = post('B'), pc = post('C'), pd = post('D', '#ffd23f'), pe = post('E', '#ffd23f');
  pa.position.copy(A); pb.position.copy(B); pc.position.copy(C); for (const p of [pa, pb, pc, pd, pe]) g.add(p);
  // the small triangle ADE (shown in the last step)
  const fillM = new THREE.MeshBasicMaterial({ color: 0xffd23f, transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false, toneMapped: false });
  const fill = new THREE.Mesh(new THREE.BufferGeometry(), fillM); fill.userData.noHit = true; fill.visible = false; g.add(fill);
  const rd = liveSign(0.42, 3.4); rd.position.set(0, 2.1, -3.3); g.add(rd); it.readout = rd;
  it.t = 0.3;
  const L = A.distanceTo(B);
  it.setT = (t) => {
    it.t = t; const D = A.clone().lerp(B, t), E = A.clone().lerp(C, t); setRod(de, D.clone().setY(0.04), E.clone().setY(0.04)); pd.position.copy(D); pe.position.copy(E);
    fill.geometry.dispose(); fill.geometry = new THREE.BufferGeometry().setFromPoints([A.clone().setY(0.02), D.clone().setY(0.02), E.clone().setY(0.02)]);
    const ad = t * L, db = (1 - t) * L; rd.set([`AD = ${ad.toFixed(2)} m    DB = ${db.toFixed(2)} m`, `AE = ${ad.toFixed(2)} m    EC = ${db.toFixed(2)} m`, `AD/DB = ${(ad / db).toFixed(2)}     AE/EC = ${(ad / db).toFixed(2)}`], ['#ffffff', '#ffffff', '#8be07a']);
    if (it.onT) it.onT(t);
  };
  it.setT(it.t);
  it.showSmall = (on) => { fill.visible = on; };
  it.knobPath = () => [V(-0.4, 1.0, -0.45), V(0.4, 1.0, -0.45)]; // left: D near A (t small) … right: D near B
  it.kOf = (t) => (t - 0.15) / 0.7;
  it.at = (k) => { const D = A.clone().lerp(B, it.t), E = A.clone().lerp(C, it.t); return ({ ad: A.clone().lerp(D, 0.5).add(V(-0.4, 0.5, 0)), db: D.clone().lerp(B, 0.5).add(V(-0.4, 0.5, 0)), de: D.clone().lerp(E, 0.5).add(V(0, 0.45, 0)), small: A.clone().add(V(0, 1.6, 1.2)) }[k] || V(0, 2, -3)); };
  it.noGrab = true; it.noPhys = true; it.height = 1.2; it.radius = 4; it.base = 0; return it;
}
export function bindBptHands(bt, knob, app, s = { half: 1, two: 2 }, done = {}) {
  const goal = () => (stepNow(app, s.half) ? 0.5 : stepNow(app, s.two) ? 2 / 3 : null);
  const sync = slideKnob(knob, { path: () => bt.knobPath(), active: () => goal() != null && Math.abs(bt.t - goal()) > 1e-4, keepVisible: () => app.runner.i >= s.half && app.runner.i <= s.two,
    k: () => bt.kOf(bt.t), set: (k) => { const G = goal(); if (G == null) return; let t = 0.15 + 0.7 * clamp01(k); if (Math.abs(t - G) < 0.025) t = G; bt.setT(t); if (t === G) done.reach && done.reach(G); } });
  const s0 = bt.setT; bt.setT = (t) => { s0(t); sync(); };
}

// ------------------------------------------------------------------ Ch 10 Circles: a wheel on the road, ropes round a well
// A bicycle wheel stands on a road in front of the student; a stick from the student's hand pushes it along. The radius to
// the point where it touches the road is always at right angles to the road. Then a round well, and a pole P held by the
// student: the two ropes from P that just touch the well (tangents) are always equally long.
export function wheelAndWell(o = {}) {
  const it = new Item('wwheel', { ...o, name: { en: 'Wheel and well', hi: 'पहिया और कुआँ', hg: 'Pahiya aur kuan' } });
  const g = it.g, R = 0.34, WZ = -0.8;
  const road = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.02, 0.5), M(0x3a3d42, 0.9)); road.position.set(0, 0.01, WZ); road.receiveShadow = true; road.userData.noHit = true; g.add(road);
  const tline = rod(V(-2.3, 0.025, WZ), V(2.3, 0.025, WZ), 0.012, glow(0xffd23f)); g.add(tline);
  const wheel = new THREE.Group(); g.add(wheel); it.wheel = wheel;
  { const tyre = new THREE.Mesh(new THREE.TorusGeometry(R - 0.022, 0.022, 10, 48), M(0x1d1f22, 0.85)); const rim = new THREE.Mesh(new THREE.TorusGeometry(R - 0.05, 0.008, 6, 48), M(0xc9ced4, 0.3, 0.8));
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.08, 12), M(0xc9ced4, 0.3, 0.8)); hub.rotation.x = Math.PI / 2; wheel.add(tyre, rim, hub);
    for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2; wheel.add(rod(V(0, 0, 0), V(Math.cos(a) * (R - 0.05), Math.sin(a) * (R - 0.05), 0), 0.002, M(0xdddddd, 0.3, 0.8))); }
    wheel.traverse((m) => { m.userData.noHit = true; if (m.isMesh) m.castShadow = true; }); }
  const radius = rod(V(0, 0, 0), V(0, 1, 0), 0.01, glow(0x5ec8ff)); g.add(radius);
  const rmG = new THREE.Group(); rmG.add(rightMark(V(0, 0.03, 0), V(1, 0, 0), V(0, 1, 0), 0.07, glow(0xffffff), 0.005)); g.add(rmG);
  const stick = rod(V(0, 0, 0), V(0, 1, 0), 0.008, M(0x8a6a4a, 0.7)); g.add(stick);
  const tilted = rod(V(0, 0, 0), V(1, 0, 0), 0.01, glow(0xff5a4f)); tilted.visible = false; g.add(tilted);
  const cutDot = new THREE.Mesh(new THREE.SphereGeometry(0.025, 12, 8), glow(0xff5a4f)); cutDot.visible = false; cutDot.userData.noHit = true; g.add(cutDot);
  it.x = -1.2;
  it.roll = (x) => { it.x = x; wheel.position.set(x, R, WZ); wheel.rotation.z = -x / R; setRod(radius, V(x, R, WZ + 0.03), V(x, 0.03, WZ + 0.03)); rmG.position.set(x + 0.0, 0, WZ + 0.035); setRod(stick, V(x, R, WZ + 0.05), V(x + 0.05, 1.0, WZ + 0.05)); };
  it.roll(it.x);
  // a line through the touching point at angle φ to the road: where else it meets the wheel
  it.tilt = (deg) => { const x = it.x; if (deg == null) { tilted.visible = false; cutDot.visible = false; return; } const a = (deg * Math.PI) / 180, d = V(Math.cos(a), Math.sin(a), 0);
    tilted.visible = true; setRod(tilted, V(x, 0.03, WZ + 0.04).addScaledVector(d, -0.6), V(x, 0.03, WZ + 0.04).addScaledVector(d, 0.9)); const ch = 2 * R * Math.sin(a); cutDot.visible = Math.abs(ch) > 0.01; cutDot.position.set(x, 0.03, WZ + 0.04).addScaledVector(d, ch); };
  // the well and the pole
  const well = new THREE.Group(); well.visible = false; g.add(well); it.well = well; const O = V(1.6, 0, -2.6), r = 1.2; it.O = O; it.r = r;
  { const stone = new THREE.Mesh(new THREE.TorusGeometry(r, 0.1, 10, 64), M(0x9a948a, 0.95)); stone.rotation.x = Math.PI / 2; stone.position.copy(O).setY(0.1); const water = new THREE.Mesh(new THREE.CircleGeometry(r - 0.06, 48), new THREE.MeshStandardMaterial({ color: 0x2a6a8a, roughness: 0.15, metalness: 0.2 }));
    water.rotation.x = -Math.PI / 2; water.position.copy(O).setY(0.06); well.add(stone, water); well.traverse((m) => { m.userData.noHit = true; }); }
  const pole = post('P', '#ff9a4a', 1.0); well.add(pole);
  const ropeM = glow(0xffd23f), rA = rod(V(0, 0, 0), V(1, 0, 0), 0.015, ropeM), rB = rod(V(0, 0, 0), V(1, 0, 0), 0.015, ropeM), rOA = rod(V(0, 0, 0), V(1, 0, 0), 0.01, glow(0x5ec8ff)), rOB = rod(V(0, 0, 0), V(1, 0, 0), 0.01, glow(0x5ec8ff)); well.add(rA, rB, rOA, rOB);
  const pA = post('A', '#ffd23f', 0.5), pB = post('B', '#ffd23f', 0.5); well.add(pA, pB);
  const rd = liveSign(0.24, 4.4); rd.visible = false; g.add(rd); it.readout = rd;
  it.P = V(-0.2, 0, -0.6);
  it.setP = (P) => { it.P = P.clone().setY(0); const d = it.P.distanceTo(O), base = Math.atan2(it.P.z - O.z, it.P.x - O.x), al = Math.acos(r / d);
    const T1 = O.clone().add(V(Math.cos(base + al) * r, 0, Math.sin(base + al) * r)), T2 = O.clone().add(V(Math.cos(base - al) * r, 0, Math.sin(base - al) * r)), y = 0.22;
    pole.position.copy(it.P); pA.position.copy(T1); pB.position.copy(T2); setRod(rA, it.P.clone().setY(y), T1.clone().setY(y)); setRod(rB, it.P.clone().setY(y), T2.clone().setY(y)); setRod(rOA, O.clone().setY(y), T1.clone().setY(y)); setRod(rOB, O.clone().setY(y), T2.clone().setY(y));
    const L = Math.sqrt(d * d - r * r); rd.set([`PA = ${L.toFixed(2)} m     PB = ${L.toFixed(2)} m`, `OP = ${d.toFixed(2)} m   r = ${r.toFixed(1)} m`], ['#ffd23f', '#ffffff']); rd.position.copy(O).add(V(-0.6, 2.1, 0.4)); it.T1 = T1; it.T2 = T2; };
  it.setP(it.P);
  it.part2 = (on) => { well.visible = on; rd.visible = on; for (const m of [wheel, road, tline, radius, rmG, stick]) m.visible = !on; tilted.visible = false; cutDot.visible = false; };
  it.rollPath = () => [V(-1.2, 1.0, WZ + 0.05), V(0.9, 1.0, WZ + 0.05)];
  it.polePath = () => [V(-0.2, 1.0, -0.6), V(0.7, 1.0, -0.2)];
  it.at = (k) => ({ wheel: V(it.x, R * 2 + 0.25, WZ), touch: V(it.x + 0.25, 0.25, WZ + 0.1), well: O.clone().add(V(-0.3, 1.05, 0.6)) }[k] || V(0, 1.8, -1.5));
  it.noGrab = true; it.noPhys = true; it.height = 1; it.radius = 2.5; it.base = 0; return it;
}
export function bindWheelHands2(ww, stickKnob, poleKnob, app, s = { roll: 1, pole: 3 }, done = {}) {
  let rolled = 0, x0 = null, moved = 0, p0 = null;
  const syncA = slideKnob(stickKnob, { path: () => ww.rollPath(), active: () => stepNow(app, s.roll), keepVisible: () => app.runner.i <= s.roll,
    k: () => (ww.x + 1.2) / 2.1, set: (k) => { const x = -1.2 + 2.1 * k; if (x0 == null) x0 = ww.x; ww.roll(x); rolled = Math.max(rolled, Math.abs(x - x0)); if (rolled > 0.6) done.roll && done.roll(); } });
  const syncB = slideKnob(poleKnob, { path: () => ww.polePath(), active: () => stepNow(app, s.pole), keepVisible: () => app.runner.i === s.pole,
    k: () => { const [A, B] = ww.polePath(); const ab = B.clone().sub(A); return clamp01(ww.P.clone().setY(1).sub(A).dot(ab) / ab.lengthSq()); },
    set: (k) => { const [A, B] = ww.polePath(); const P = A.clone().lerp(B, k); if (p0 == null) p0 = ww.P.clone(); ww.setP(P); moved = Math.max(moved, P.clone().setY(0).distanceTo(p0)); if (moved > 0.5) done.pole && done.pole(); } });
  const r0 = ww.roll, s0 = ww.setP; ww.roll = (x) => { r0(x); syncA(); }; ww.setP = (P) => { s0(P); syncB(); };
}

// ------------------------------------------------------------------ Ch 14 Probability: two dice
// A red and a blue die on the table. A lever rolls them; every total (2 … 12) adds to a bar at the back of the table.
const PIPS = { 1: [[0.5, 0.5]], 2: [[0.28, 0.28], [0.72, 0.72]], 3: [[0.25, 0.25], [0.5, 0.5], [0.75, 0.75]], 4: [[0.28, 0.28], [0.72, 0.28], [0.28, 0.72], [0.72, 0.72]], 5: [[0.25, 0.25], [0.75, 0.25], [0.5, 0.5], [0.25, 0.75], [0.75, 0.75]], 6: [[0.28, 0.22], [0.72, 0.22], [0.28, 0.5], [0.72, 0.5], [0.28, 0.78], [0.72, 0.78]] };
function dieMesh(colour, S) {
  // faces in BoxGeometry order: +x 3, −x 4, +y 1, −y 6, +z 2, −z 5 (opposite faces add up to 7)
  const face = (n) => canvasTex(128, 128, (x) => { x.fillStyle = colour; x.fillRect(0, 0, 128, 128); x.fillStyle = '#ffffff'; for (const [u, v] of PIPS[n]) { x.beginPath(); x.arc(u * 128, v * 128, 12, 0, Math.PI * 2); x.fill(); } });
  const m = new THREE.Mesh(new THREE.BoxGeometry(S, S, S), [3, 4, 1, 6, 2, 5].map((n) => new THREE.MeshStandardMaterial({ map: face(n), roughness: 0.35 })));
  m.castShadow = true; m.userData.noHit = true; return m;
}
const UP = { 1: [0, 0, 0], 6: [Math.PI, 0, 0], 3: [0, 0, Math.PI / 2], 4: [0, 0, -Math.PI / 2], 2: [-Math.PI / 2, 0, 0], 5: [Math.PI / 2, 0, 0] };
export function diceTable(o = {}) {
  const it = new Item('wdice', { ...o, name: { en: 'Two dice', hi: 'दो पासे', hg: 'Do paase' } });
  const g = it.g, S = 0.045;
  const dA = dieMesh('#c8322a', S), dB = dieMesh('#2f5f9a', S); g.add(dA); g.add(dB);
  const homeA = V(-0.12, S / 2, 0.12), homeB = V(0.02, S / 2, 0.14); dA.position.copy(homeA); dB.position.copy(homeB);
  // the bar chart of totals at the back of the table
  const counts = new Array(13).fill(0); it.counts = counts; it.total = 0;
  const bars = []; for (let s = 2; s <= 12; s++) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1, 0.05), M(s === 7 ? 0xf2c230 : 0x5ec8ff, 0.5, 0, 0.1)); b.geometry.translate(0, 0.5, 0); b.position.set(-0.4 + (s - 2) * 0.08, 0, -0.22); b.scale.y = 0.0001; b.userData.noHit = true; g.add(b); bars[s] = b; }
  const axis = canvasTex(1024, 96, (x) => { x.fillStyle = 'rgba(12,16,24,0.85)'; x.fillRect(0, 0, 1024, 96); x.fillStyle = '#ffffff'; x.font = `800 56px ${FONT}`; x.textAlign = 'center'; x.textBaseline = 'middle'; for (let s = 2; s <= 12; s++) x.fillText(String(s), ((s - 2 + 0.5) / 11) * 1024, 50); });
  const ax = new THREE.Mesh(new THREE.PlaneGeometry(0.88, 0.0825), new THREE.MeshBasicMaterial({ map: axis, toneMapped: false })); ax.rotation.x = -Math.PI / 2 + 0.45; ax.position.set(0, 0.02, -0.15); ax.userData.noHit = true; g.add(ax);
  // the 6 × 6 table of all outcomes (the totals; the six 7s glow)
  const gridT = canvasTex(768, 768, (x) => { x.fillStyle = '#f4f1e8'; x.fillRect(0, 0, 768, 768); x.font = `800 60px ${FONT}`; x.textAlign = 'center'; x.textBaseline = 'middle';
    for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) { const cx = (b - 0.5) * 128, cy = (a - 0.5) * 128; if (a + b === 7) { x.fillStyle = '#f2c230'; x.fillRect(cx - 62, cy - 62, 124, 124); } x.fillStyle = '#1d2330'; x.fillText(String(a + b), cx, cy + 4); }
    x.strokeStyle = '#7a7f88'; x.lineWidth = 4; for (let k = 0; k <= 6; k++) { x.beginPath(); x.moveTo(k * 128, 0); x.lineTo(k * 128, 768); x.stroke(); x.beginPath(); x.moveTo(0, k * 128); x.lineTo(768, k * 128); x.stroke(); } });
  const grid = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.3), new THREE.MeshStandardMaterial({ map: gridT, roughness: 0.8 })); grid.rotation.x = -Math.PI / 2; grid.position.set(0.32, 0.002, 0.08); grid.visible = false; grid.userData.noHit = true; g.add(grid);
  const sc = (n) => 0.32 / Math.max(10, n); // height of one throw on a bar
  const drawBars = () => { const mx = Math.max(...counts); const u = sc(mx); for (let s = 2; s <= 12; s++) bars[s].scale.y = Math.max(0.0001, counts[s] * u); };
  it.rolling = 0; let anim = null;
  it.roll = (a, b) => { if (it.rolling) return false; a = a || 1 + Math.floor(Math.random() * 6); b = b || 1 + Math.floor(Math.random() * 6); it.rolling = 1;
    anim = { t: 0, a, b, ya: Math.random() * 6.28, yb: Math.random() * 6.28, sa: V(Math.random() * 9 + 6, Math.random() * 9 + 6, Math.random() * 9), sb: V(Math.random() * 9 + 6, Math.random() * 9, Math.random() * 9 + 6) }; return true; };
  const land = (m, n, yaw) => { const [x, y, z] = UP[n]; m.rotation.set(0, 0, 0); m.quaternion.setFromEuler(new THREE.Euler(x, 0, z)); m.quaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), yaw)); void y; };
  it.update = (dt) => {
    if (!anim) return; anim.t += Math.min(dt || 0.016, 0.05) / 0.9; const t = Math.min(1, anim.t), h = Math.sin(Math.PI * t) * 0.16;
    for (const [m, home, sp, dx] of [[dA, homeA, anim.sa, -0.06], [dB, homeB, anim.sb, 0.05]]) { m.position.copy(home).add(V(dx * Math.sin(Math.PI * t), h, -0.05 * t)); if (t < 1) { m.rotation.x += sp.x * 0.016; m.rotation.y += sp.y * 0.016; m.rotation.z += sp.z * 0.016; } }
    if (t >= 1) { land(dA, anim.a, anim.ya); land(dB, anim.b, anim.yb); dA.position.copy(homeA); dB.position.copy(homeB); counts[anim.a + anim.b]++; it.total++; it.last = [anim.a, anim.b]; drawBars(); anim = null; it.rolling = 0; if (it.onRoll) it.onRoll(it.last); }
  };
  land(dA, 3, 0.3); land(dB, 4, -0.2);
  it.bulk = (n) => { for (let i = 0; i < n; i++) { const a = 1 + Math.floor(Math.random() * 6), b = 1 + Math.floor(Math.random() * 6); counts[a + b]++; it.total++; } drawBars(); };
  it.showGrid = (on) => { grid.visible = on; };
  const W = (x, y, z) => g.localToWorld(V(x, y, z));
  it.leverPath = () => [W(-0.35, 0.1, 0.24), W(-0.35, 0.1, 0.32)];
  it.at = (k) => ({ dice: W(-0.05, 0.14, 0.13), chart: W(-0.28, 0.24, 0.02), seven: W(0, 0.36, -0.2), grid: W(0.32, 0.12, 0.08) }[k] || W(0, 0.3, 0));
  it.noGrab = true; it.noPhys = true; it.height = 0.2; it.radius = 0.4; it.base = 0; return it;
}
export function bindDiceHands(dt, lever, app, s = { roll: 1 }, done = {}) {
  pushKnob(lever, { path: () => dt.leverPath(), active: () => stepNow(app, s.roll) && !dt.rolling && dt.total < 5, keepVisible: () => app.runner.i === s.roll, press: () => dt.roll() });
  const r0 = dt.onRoll; dt.onRoll = (v) => { if (r0) r0(v); if (dt.total >= 5) done.five && done.five(); };
}
export { pushKnob as pushLever };
