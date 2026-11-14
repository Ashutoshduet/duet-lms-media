// DUET Maths Lab 360, hands-on in 3D, batch 11 (Class 7, Part 2): a triangular plot picked up, turned and flipped onto
// its twin (congruence), a frog jumping on an integer line (multiplying integers), two frogs whose jumps meet (LCM) and two
// ribbons cut into the longest equal pieces (HCF), and a 1 m square painted in tenths (multiplying decimals).
import * as THREE from 'three';
import { Item } from './apparatus.js';
import { canvasTex } from './mats.js';
import { clamp01, ease } from './mathlab2.js';
import { glow, rod, setRod } from './mathworld.js';
import { pushKnob } from './mathworld3.js';
import { liveSign } from './mathworld4.js';
import { slideKnob } from './mathworld5.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const FONT = '"Noto Sans Devanagari", "Noto Sans", system-ui, sans-serif';
const stepNow = (app, i) => { const r = app.runner; return !!(r.exp && r.i === i && r.state === 'todo'); };
const M = (c, r = 0.6, m = 0, e = 0) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m, emissive: c, emissiveIntensity: e });
const noHit = (o) => { o.traverse((m) => { m.userData.noHit = true; }); return o; };
function tag(text, col = '#ffffff', h = 0.2, bg = 'rgba(12,16,24,0.85)') {
  const n = String(text).length, w = n <= 2 ? 2 : n <= 4 ? 3 : n <= 7 ? 4 : 6, W = 128 * w;
  const paint = (x, txt, c) => { x.clearRect(0, 0, W, 128); x.fillStyle = bg; x.beginPath(); x.roundRect(4, 4, W - 8, 120, 40); x.fill(); x.fillStyle = c; x.font = `800 72px ${FONT}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(String(txt), W / 2, 68); };
  const t = canvasTex(W, 128, (x) => paint(x, text, col));
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: false, toneMapped: false })); s.scale.set(h * w, h, 1); s.renderOrder = 40; s.userData.noHit = true;
  s.setText = (txt, c = col) => { paint(t.image.getContext('2d'), txt, c); t.needsUpdate = true; };
  return s;
}
function frog(col = 0x5fbf3f) {
  const g = new THREE.Group(); const body = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 12), M(col, 0.6)); body.scale.set(1.2, 0.8, 1); body.position.y = 0.09; g.add(body);
  for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), M(0xffffff, 0.3)); e.position.set(0.07, 0.17, s * 0.05); g.add(e); const p = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 6), M(0x111111, 0.3)); p.position.set(0.095, 0.175, s * 0.05); g.add(p);
    const leg = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), M(col, 0.6)); leg.scale.set(1.6, 0.6, 0.8); leg.position.set(-0.06, 0.04, s * 0.09); g.add(leg); }
  return noHit(g);
}
// a number line on the ground along x: value v at x = x0 + v * u
function numberLine(g, x0, z, u, a, b, step = 1, labelEvery = 1, h = 0.13) {
  g.add(rod(V(x0 + (a - 0.4) * u, 0.012, z), V(x0 + (b + 0.4) * u, 0.012, z), 0.012, glow(0xffffff)));
  for (let v = a; v <= b; v += step) { g.add(rod(V(x0 + v * u, 0.012, z - 0.05), V(x0 + v * u, 0.012, z + 0.05), 0.008, glow(0xffffff)));
    if (v % labelEvery === 0) { const t = tag(String(v).replace('-', '−'), v === 0 ? '#ffd23f' : '#ffffff', h); t.position.set(x0 + v * u, 0.1, z + 0.2); g.add(t); } }
}

// ------------------------------------------------------------------ P2 Ch 1 Geometric Twins: two triangular plots
// A right-angled triangular plot ABC (sides 1.5 m, 2 m, 2.5 m) is roped out. A copy lies elsewhere, turned round and
// flipped over. A slider picks the copy up, turns it, flips it and puts it down on ABC: it fits exactly.
export function twinTriangles(o = {}) {
  const it = new Item('wtwins', { ...o, name: { en: 'Twin triangles', hi: 'जुड़वाँ त्रिभुज', hg: 'Judwaan triangles' } });
  const g = it.g, T = [[0, 0], [2, 0], [2, 1.5]], O1 = V(-2.3, 0, -1.4), O2 = V(1.6, 0, -2.5);
  const shape = new THREE.Shape(T.map(([u, v]) => new THREE.Vector2(u, v)));
  const triGeo = new THREE.ShapeGeometry(shape); triGeo.rotateX(-Math.PI / 2); // (u, v) → (u, 0, −v)
  const L = (u, v) => V(u, 0, -v);
  const base = new THREE.Mesh(triGeo, new THREE.MeshBasicMaterial({ color: 0x5ec8ff, transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false, toneMapped: false })); base.position.copy(O1).setY(0.01); g.add(base);
  const A = T.map(([u, v]) => O1.clone().add(L(u, v)));
  for (let i = 0; i < 3; i++) g.add(rod(A[i].clone().setY(0.03), A[(i + 1) % 3].clone().setY(0.03), 0.02, glow(0x5ec8ff)));
  ['A', 'B', 'C'].forEach((n, i) => { const t = tag(n, '#7ad0ff', 0.22); t.position.copy(A[i]).add(V(i === 0 ? -0.2 : 0.2, 0.3, i === 2 ? -0.15 : 0.15)); g.add(t); });
  // the copy
  const cp = new THREE.Group(); cp.rotation.order = 'YXZ'; g.add(cp);
  const cm = new THREE.Mesh(triGeo, new THREE.MeshBasicMaterial({ color: 0xffd23f, transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false, toneMapped: false })); cp.add(cm);
  for (let i = 0; i < 3; i++) { const [a, b] = [T[i], T[(i + 1) % 3]]; cp.add(rod(L(a[0], a[1]).setY(0.015), L(b[0], b[1]).setY(0.015), 0.02, glow(0xffd23f))); }
  const pl = ['P', 'Q', 'R'].map((n) => { const t = tag(n, '#ffd23f', 0.22); g.add(t); return t; });
  const sides = [['2 m', 1, -0.25], ['1.5 m', 2.3, 0.75], ['2.5 m', 0.75, 0.9]].map(([s, u, v]) => { const t = tag(s, '#ffffff', 0.18); t.position.copy(O1.clone().add(L(u, v))).setY(0.35); t.visible = false; g.add(t); return t; });
  const YAW0 = 2.4;
  it.k = 0;
  it.setK = (k) => { it.k = clamp01(k); const e = ease(it.k); cp.position.copy(O2).lerp(O1, e); cp.position.y = 0.03 + Math.sin(e * Math.PI) * 0.8; cp.rotation.y = YAW0 * (1 - e); cp.rotation.x = Math.PI * (1 - e);
    cp.updateMatrixWorld(true); T.forEach(([u, v], i) => { const p = cp.localToWorld(L(u, v)); pl[i].position.copy(p).add(V(0, 0.45, 0)); }); };
  it.showSides = (on = true) => sides.forEach((s) => { s.visible = on; });
  it.setK(0);
  it.knobPath = () => [V(-0.45, 1.0, -0.42), V(0.45, 1.0, -0.42)];
  it.at = (k) => ({ rules: V(1.4, 1.2, -3.6), fit: O1.clone().add(V(1.0, 1.0, -0.6)) }[k] || V(0, 1.2, -2));
  noHit(g); it.noGrab = true; it.noPhys = true; it.height = 0.05; it.radius = 3; it.base = 0; return it;
}
export function bindTwinHands(tw, knob, app, s = { move: 1 }, done = {}) {
  const sync = slideKnob(knob, { path: () => tw.knobPath(), active: () => stepNow(app, s.move) && tw.k < 1, keepVisible: () => app.runner.i <= s.move,
    k: () => tw.k, set: (k) => { let v = clamp01(k); if (v > 0.94) v = 1; tw.setK(v); if (v >= 1) done.move && done.move(); } });
  const s0 = tw.setK; tw.setK = (k) => { s0(k); sync(); };
}

// ------------------------------------------------------------------ P2 Ch 2 Operations with Integers: a jumping frog
// A number line from −8 to 8 (0.3 m per unit) lies on the ground. The frog makes jumps of a given size; a ghost trail of
// dots shows where it landed. Multiplying by a negative number turns the whole walk round.
export function integerFrog(o = {}) {
  const it = new Item('wifrog', { ...o, name: { en: 'Frog on a number line', hi: 'संख्या रेखा पर मेंढक', hg: 'Number line par mendhak' } });
  const g = it.g, u = 0.3, Z = -1.9, x0 = 0, X = (v) => V(x0 + v * u, 0, Z);
  numberLine(g, x0, Z, u, -8, 8, 1, 2);
  const f = frog(); g.add(f); f.position.copy(X(0));
  const ghost = frog(0x9adf7f); ghost.traverse((m) => { if (m.material) { m.material = m.material.clone(); m.material.transparent = true; m.material.opacity = 0.6; } }); ghost.visible = false; g.add(ghost);
  const dotG = new THREE.SphereGeometry(0.04, 10, 8), dots = []; for (let i = 0; i < 6; i++) { const d = new THREE.Mesh(dotG, glow(0xffd23f)); d.visible = false; g.add(d); dots.push(d); }
  const arcs = []; const arcM = glow(0xffd23f, 0.8);
  const rd = liveSign(0.45, 3.6); rd.position.set(0, 0.95, Z - 1.0); g.add(rd);
  it.pt = 0; it.jumps = 0; it.size = -2; it.busy = false; let J = null;
  const arcFor = (a, b, col) => { const pts = []; for (let i = 0; i <= 16; i++) { const t = i / 16, p = X(a + (b - a) * t); p.y = 0.05 + Math.sin(t * Math.PI) * 0.35; pts.push(p); } const c = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.012, 6, false), col ? glow(col, 0.8) : arcM); g.add(c); arcs.push(c); return c; };
  it.reset = () => { arcs.forEach((a) => { g.remove(a); a.geometry.dispose(); }); arcs.length = 0; dots.forEach((d) => { d.visible = false; }); it.pt = 0; it.jumps = 0; f.position.copy(X(0)); f.rotation.y = 0; ghost.visible = false; };
  it.say = (lines, cols) => rd.set(lines, cols);
  it.jump = (size) => { if (it.busy) return false; J = { a: it.pt, b: it.pt + size, t: 0 }; f.rotation.y = size < 0 ? Math.PI : 0; it.busy = true; return true; };
  it.update = (dt) => { if (!J) return; J.t = Math.min(1, J.t + Math.min(dt || 0.016, 0.05) * 2.2); const p = X(J.a + (J.b - J.a) * J.t); p.y = Math.sin(J.t * Math.PI) * 0.35; f.position.copy(p);
    if (J.t >= 1) { arcFor(J.a, J.b); it.pt = J.b; dots[Math.min(5, it.jumps)].position.copy(X(it.pt)).setY(0.04); dots[Math.min(5, it.jumps)].visible = true; it.jumps++; J = null; it.busy = false; if (it.onJump) it.onJump(it.jumps, it.pt); } };
  it.ghostAt = (v) => { ghost.visible = true; ghost.position.copy(X(v)); };
  it.mirrorTrail = (from, to) => { arcFor(0, to, 0xff7a5a); };
  it.setFrog = (v, face = 1) => { it.pt = v; f.position.copy(X(v)); f.rotation.y = face < 0 ? Math.PI : 0; };
  it.say(['3 × (−2) = ?'], '#ffd23f');
  it.leverPath = () => [V(-0.45, 1.0, -0.3), V(-0.45, 1.0, -0.05)];
  it.at = (k) => ({ left: X(-6).add(V(0, 0.75, 0)), right: X(6).add(V(0, 0.75, 0)) }[k] || V(0, 1, Z));
  noHit(g); it.noGrab = true; it.noPhys = true; it.height = 0.05; it.radius = 3; it.base = 0; return it;
}
export function bindIntFrogHands(fr, lever, app, s = { jump: 1 }, n = 3, size = -2, done = {}) {
  fr.onJump = (k) => { if (k >= n) done.all && done.all(); };
  pushKnob(lever, { path: () => fr.leverPath(), active: () => stepNow(app, s.jump) && !fr.busy && fr.jumps < n, keepVisible: () => app.runner.i === s.jump, press: () => fr.jump(size) });
}

// ------------------------------------------------------------------ P2 Ch 3 Finding Common Ground: frogs and ribbons
// Two frogs start at 0 on a line of stones from 0 to 24: the red frog jumps 4 at a time, the blue frog 6. Stones where
// both have landed light up gold. Then two ribbons, 12 m and 18 m (drawn small), are cut into the longest equal pieces.
export function lcmFrogs(o = {}) {
  const it = new Item('wlcm', { ...o, name: { en: 'Two jumping frogs', hi: 'कूदते दो मेंढक', hg: 'Koodte do mendhak' } });
  const g = it.g, u = 0.15, Z = -1.9, x0 = -1.8, X = (v, dz = 0) => V(x0 + v * u, 0, Z + dz);
  numberLine(g, x0, Z, u, 0, 24, 1, 4, 0.12);
  const stoneG = new THREE.CylinderGeometry(0.062, 0.066, 0.025, 16);
  const stones = []; for (let v = 0; v <= 24; v++) { const s = new THREE.Mesh(stoneG, M(0x9a948a, 0.9)); s.position.copy(X(v)).setY(0.02); g.add(s); stones.push(s); }
  const red = frog(0xff5a4f), blue = frog(0x3fa7ff); red.scale.setScalar(0.7); blue.scale.setScalar(0.7); g.add(red, blue);
  const SZ = { r: 4, b: 6 };
  const marks = { r: new Set([0]), b: new Set([0]) };
  const SM = { gold: glow(0xffd23f), r: glow(0xff6a5f), b: glow(0x4fa8ff), n: M(0x6a665e, 0.9) };
  const paint = () => stones.forEach((s, v) => { const r = marks.r.has(v), b = marks.b.has(v); s.material = r && b && v ? SM.gold : r ? SM.r : b ? SM.b : SM.n; });
  const rd = liveSign(0.55, 3.4); rd.position.set(0, 0.85, Z - 1.7); g.add(rd);
  // ribbons for the HCF
  const ribbons = new THREE.Group(); ribbons.visible = false; g.add(ribbons);
  const rib = (len, z, col) => { const m = new THREE.Mesh(new THREE.BoxGeometry(len * u, 0.01, 0.08), M(col, 0.6)); m.position.set(x0 + len * u / 2, 0.02, Z + z); ribbons.add(m); return m; };
  rib(12, -0.6, 0xc58bff); rib(18, -0.9, 0x5ee0d0);
  const cuts = []; for (const [len, z] of [[12, -0.6], [18, -0.9]]) for (let v = 6; v < len; v += 6) { const c = rod(X(v, z - 0.08).setY(0.03), X(v, z + 0.08).setY(0.03), 0.008, glow(0xffffff)); c.visible = false; ribbons.add(c); cuts.push(c); }
  it.fpos = { r: 0, b: 0 }; it.busy = false; let J = [];
  const place = () => { red.position.copy(X(it.fpos.r, -0.12)); blue.position.copy(X(it.fpos.b, 0.12)); };
  it.say = (lines, cols) => rd.set(lines, cols);
  it.jump = () => { if (it.busy) return false; J = []; if (it.fpos.r + SZ.r <= 24) J.push(['r', it.fpos.r, it.fpos.r + SZ.r]); if (it.fpos.b + SZ.b <= 24) J.push(['b', it.fpos.b, it.fpos.b + SZ.b]); if (!J.length) return false; it.busy = true; it.jt = 0; return true; };
  it.update = (dt) => { if (!it.busy) return; it.jt = Math.min(1, it.jt + Math.min(dt || 0.016, 0.05) * 2); for (const [w, a, b] of J) { const f = w === 'r' ? red : blue, p = X(a + (b - a) * it.jt, w === 'r' ? -0.12 : 0.12); p.y = Math.sin(it.jt * Math.PI) * 0.3; f.position.copy(p); }
    if (it.jt >= 1) { for (const [w, , b] of J) { it.fpos[w] = b; marks[w].add(b); } paint(); place(); it.busy = false; if (it.onJump) it.onJump(); } };
  it.both = (v) => marks.r.has(v) && marks.b.has(v);
  it.showRibbons = (cut = false) => { ribbons.visible = true; cuts.forEach((c) => { c.visible = cut; }); };
  place(); paint();
  it.leverPath = () => [V(-0.45, 1.0, -0.3), V(-0.45, 1.0, -0.05)];
  it.at = (k) => ({ v12: X(12).add(V(0, 0.55, 0)), v24: X(24).add(V(0, 0.55, 0)), rib: X(9, 1.3).setY(0.3) }[k] || V(0, 1, Z));
  noHit(g); it.noGrab = true; it.noPhys = true; it.height = 0.05; it.radius = 3; it.base = 0; return it;
}
export function bindLcmHands(lf, lever, app, s = { jump: 1 }, done = {}) {
  lf.onJump = () => { if (lf.both(12)) done.meet && done.meet(); };
  pushKnob(lever, { path: () => lf.leverPath(), active: () => stepNow(app, s.jump) && !lf.busy && !lf.both(12), keepVisible: () => app.runner.i === s.jump, press: () => lf.jump() });
}

// ------------------------------------------------------------------ P2 Ch 4 Another Peek Beyond the Point: 0.3 × 0.4
// A 1 m × 1 m square on the floor is divided into 100 small squares (0.1 m each). The lever marks a strip 0.3 m wide, then
// a strip 0.4 m deep; where they cross is a 0.3 m × 0.4 m rectangle of 12 small squares: 0.12 m².
export function decimalSquare(o = {}) {
  const it = new Item('wdec', { ...o, name: { en: 'Square metre in tenths', hi: 'दसवें हिस्सों में वर्ग मीटर', hg: 'Dasve hisson mein square metre' } });
  const g = it.g, S = 1.0, c = S / 10, O = V(-0.5, 0.012, -1.4); // near-left corner; columns along x, rows away from the student
  const im = new THREE.InstancedMesh(new THREE.BoxGeometry(c * 0.94, 0.012, c * 0.94), new THREE.MeshStandardMaterial({ roughness: 0.5 }), 100); im.frustumCulled = false; g.add(im);
  const BASE = new THREE.Color(0xf0ece2), YEL = new THREE.Color(0xffe066), BLU = new THREE.Color(0x8ac8ff), BOTH = new THREE.Color(0x5fbf3f);
  const mtx = new THREE.Matrix4(); for (let r = 0; r < 10; r++) for (let q = 0; q < 10; q++) { mtx.makeTranslation(O.x + (q + 0.5) * c, O.y, O.z - (r + 0.5) * c); im.setMatrixAt(r * 10 + q, mtx); im.setColorAt(r * 10 + q, BASE); }
  g.add(rod(V(O.x, 0.03, O.z + 0.06), V(O.x + S, 0.03, O.z + 0.06), 0.008, glow(0xffffff)));
  const t1 = tag('1 m', '#ffffff', 0.12); t1.position.set(O.x + S / 2, 0.1, O.z - S - 0.14); g.add(t1);
  const tw = tag('0.3 m', '#ffd23f', 0.12), td = tag('0.4 m', '#7ad0ff', 0.12); tw.visible = td.visible = false; g.add(tw, td);
  tw.position.set(O.x + 0.15, 0.1, O.z + 0.15); td.position.set(O.x - 0.2, 0.1, O.z - 0.2);
  const rd = liveSign(0.3, 3.4); rd.position.set(1.2, 0.36, O.z - 0.55); g.add(rd);
  it.marks = 0;
  it.setMarks = (n) => { it.marks = n; for (let r = 0; r < 10; r++) for (let q = 0; q < 10; q++) { const a = n >= 1 && q < 3, b = n >= 2 && r < 4; im.setColorAt(r * 10 + q, a && b ? BOTH : a ? YEL : b ? BLU : BASE); } im.instanceColor.needsUpdate = true; tw.visible = n >= 1; td.visible = n >= 2;
    rd.set(n === 0 ? ['1 × 1 = 1 m²'] : n === 1 ? ['0.3 m'] : ['0.3 × 0.4 = ?'], n === 0 ? '#ffffff' : '#ffd23f'); };
  it.say = (lines, cols) => rd.set(lines, cols);
  it.setMarks(0);
  it.leverPath = () => [V(-0.45, 1.0, -0.3), V(-0.45, 1.0, -0.05)];
  it.at = (k) => ({ both: V(O.x + 0.15, 0.35, O.z - 0.2), side: V(1.2, 0.1, O.z - 0.3) }[k] || V(0, 0.8, O.z - 0.5));
  noHit(g); it.noGrab = true; it.noPhys = true; it.height = 0.02; it.radius = 1; it.base = 0; return it;
}
export function bindDecHands(ds, lever, app, s = { mark: 1 }, done = {}) {
  pushKnob(lever, { path: () => ds.leverPath(), active: () => stepNow(app, s.mark) && ds.marks < 2, keepVisible: () => app.runner.i === s.mark, press: () => { ds.setMarks(ds.marks + 1); if (ds.marks >= 2) done.all && done.all(); } });
}
void setRod; void canvasTex;
