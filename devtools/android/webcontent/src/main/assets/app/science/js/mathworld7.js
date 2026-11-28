// DUET Maths Lab 360, hands-on in 3D, batch 7 (Class 9): a tank filling at a steady rate (linear polynomials), √2 swung
// onto a number line and the square-root spiral (the world of numbers), angles in a big circle on the ground (circles), and
// a bamboo and a pond weed growing week by week (sequences and progressions).
import * as THREE from 'three';
import { Item } from './apparatus.js';
import { canvasTex } from './mats.js';
import { clamp01 } from './mathlab2.js';
import { glow, rod, setRod, arc, rightMark } from './mathworld.js';
import { pushKnob } from './mathworld3.js';
import { liveSign } from './mathworld4.js';
import { slideKnob } from './mathworld5.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const FONT = '"Noto Sans Devanagari", "Noto Sans", system-ui, sans-serif';
const DEG = Math.PI / 180;
const stepNow = (app, i) => { const r = app.runner; return !!(r.exp && r.i === i && r.state === 'todo'); };
const M = (c, r = 0.6, m = 0, e = 0) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m, emissive: c, emissiveIntensity: e });
const ball = (c, r = 0.05) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), glow(c)); m.userData.noHit = true; return m; };
function tag(text, col = '#ffffff', h = 0.2) {
  const w = text.length <= 2 ? 2 : text.length <= 4 ? 3 : 4, W = 128 * w; // short tags get a narrower box
  const t = canvasTex(W, 128, (x) => { x.fillStyle = 'rgba(12,16,24,0.85)'; x.beginPath(); x.roundRect(4, 4, W - 8, 120, 40); x.fill(); x.fillStyle = col; x.font = `800 ${text.length > 9 ? 56 : 72}px ${FONT}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(text, W / 2, 68); });
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: false, toneMapped: false })); s.scale.set(h * w, h, 1); s.renderOrder = 40; s.userData.noHit = true; return s;
}

// ------------------------------------------------------------------ Ch 2 Linear polynomials: a tank filling steadily
// A clear tank starts with 20 cm of water; the tap adds 10 cm a minute. A board beside it plots h (cm) against t (minutes).
export function tankGraph(o = {}) {
  const it = new Item('wtank', { ...o, name: { en: 'Tank and graph', hi: 'टंकी और ग्राफ़', hg: 'Tanki aur graph' } });
  const g = it.g, TX = -1.2, TZ = -2.0, R = 0.5, H = 1.5;
  const glass = new THREE.Mesh(new THREE.CylinderGeometry(R, R, H, 48, 1, true), new THREE.MeshStandardMaterial({ color: 0xd9f0ff, roughness: 0.05, transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false })); glass.position.set(TX, H / 2, TZ); glass.userData.noHit = true; glass.renderOrder = 5; g.add(glass);
  for (const y of [0.005, H]) { const r = new THREE.Mesh(new THREE.TorusGeometry(R, 0.015, 8, 48), M(0xb8c0c8, 0.3, 0.8)); r.rotation.x = Math.PI / 2; r.position.set(TX, y, TZ); r.userData.noHit = true; g.add(r); }
  const scaleT = canvasTex(64, 1024, (x) => { x.fillStyle = 'rgba(255,255,255,0.9)'; for (let c = 0; c <= 150; c += 10) { const y = 1024 - (c / 150) * 1024; x.fillRect(0, y - 2, c % 50 === 0 ? 64 : 34, 4); } });
  const scale = new THREE.Mesh(new THREE.PlaneGeometry(0.06, H), new THREE.MeshBasicMaterial({ map: scaleT, transparent: true, toneMapped: false })); scale.position.set(TX + 0.02, H / 2, TZ + R + 0.01); scale.userData.noHit = true; g.add(scale);
  const water = new THREE.Mesh(new THREE.CylinderGeometry(R - 0.01, R - 0.01, 1, 48), new THREE.MeshStandardMaterial({ color: 0x3d8fd0, roughness: 0.1, transparent: true, opacity: 0.75 })); water.geometry.translate(0, 0.5, 0); water.position.set(TX, 0.01, TZ); water.userData.noHit = true; g.add(water);
  const pipe = rod(V(TX + 0.15, H + 0.25, TZ), V(TX + 0.15, H + 0.05, TZ), 0.03, M(0x8a8f96, 0.4, 0.7)); g.add(pipe);
  const stream = rod(V(TX + 0.15, H + 0.05, TZ), V(TX + 0.15, 0.2, TZ), 0.012, new THREE.MeshBasicMaterial({ color: 0x8fd0ff, transparent: true, opacity: 0.7 })); stream.visible = false; g.add(stream);
  // the graph board: t from 0 to 15 (min) across, h from 0 to 160 (cm) up
  const BX = 0.1, BY = 0.35, BZ = -2.4, sx = 0.12, sy = 0.012;
  const P = (t, h) => V(BX + t * sx, BY + h * sy, BZ + 0.01); it.P = P;
  const bt = canvasTex(1024, 1024, (x) => { x.fillStyle = 'rgba(16,24,34,0.88)'; x.fillRect(0, 0, 1024, 1024); const L = 110, T = 40, W = 1024 - L - 40, Hh = 1024 - T - 110; const X = (t) => L + (t / 16) * W, Y = (h) => T + Hh - (h / 170) * Hh;
    x.strokeStyle = 'rgba(255,255,255,0.2)'; x.lineWidth = 2; for (let t = 0; t <= 16; t++) { x.beginPath(); x.moveTo(X(t), Y(0)); x.lineTo(X(t), Y(170)); x.stroke(); } for (let h = 0; h <= 170; h += 10) { x.beginPath(); x.moveTo(X(0), Y(h)); x.lineTo(X(16), Y(h)); x.stroke(); }
    x.strokeStyle = '#ffffff'; x.lineWidth = 5; x.beginPath(); x.moveTo(X(0), Y(0)); x.lineTo(X(16), Y(0)); x.moveTo(X(0), Y(0)); x.lineTo(X(0), Y(170)); x.stroke();
    x.fillStyle = '#ffffff'; x.font = `700 34px ${FONT}`; x.textAlign = 'center'; for (let t = 0; t <= 16; t += 2) x.fillText(String(t), X(t), Y(0) + 40); x.textAlign = 'right'; for (let h = 0; h <= 160; h += 20) x.fillText(String(h), X(0) - 12, Y(h) + 12);
    x.textAlign = 'center'; x.font = `800 40px ${FONT}`; x.fillText('t (min)', X(13), Y(0) + 86); x.save(); x.translate(36, Y(120)); x.rotate(-Math.PI / 2); x.fillText('h (cm)', 0, 0); x.restore(); });
  // board placed so that its plot area matches P(): plot area is 16 × 170 units
  const bw = 16 * sx / ((1024 - 150) / 1024), bh = 170 * sy / ((1024 - 150) / 1024);
  const board = new THREE.Mesh(new THREE.PlaneGeometry(bw, bh), new THREE.MeshBasicMaterial({ map: bt, toneMapped: false, transparent: true })); board.position.set(BX - (110 / 1024) * bw + bw / 2, BY - (110 / 1024) * bh + bh / 2, BZ); board.userData.noHit = true; g.add(board);
  const dots = []; for (let t = 0; t <= 13; t++) { const d = ball(0xffd23f, 0.03); d.position.copy(P(t, 20 + 10 * t)); d.visible = false; g.add(d); dots.push(d); }
  const lineA = rod(P(0, 20), P(13, 150), 0.012, glow(0xffd23f)), lineB = rod(P(0, 20), P(6.5, 150), 0.012, glow(0xff7a5a)), lineFull = rod(P(0, 150), P(16, 150), 0.006, glow(0x8be07a, 0.8));
  lineA.visible = lineB.visible = lineFull.visible = false; g.add(lineA, lineB, lineFull);
  it.t = 0; it.filling = 0; it.rate = 10;
  it.level = (cm) => { water.scale.y = Math.max(0.001, cm / 100); };
  it.level(20);
  it.open = () => { if (it.filling || it.t >= 10) return false; it.filling = 1; stream.visible = true; return true; };
  it.update = (dt) => { if (!it.filling) return; it.t = Math.min(10, it.t + Math.min(dt || 0.016, 0.05) * 1.6); it.level(20 + 10 * it.t); const n = Math.floor(it.t + 1e-6); for (let k = 0; k <= n && k < dots.length; k++) dots[k].visible = true;
    if (it.t >= 10) { it.filling = 0; stream.visible = false; if (it.onFull) it.onFull(); } };
  it.showLine = (k, on = true) => { ({ a: lineA, b: lineB, full: lineFull })[k].visible = on; };
  it.showDots = (n) => { dots.forEach((d, i) => { d.visible = i <= n; }); };
  it.leverPath = () => [V(-0.45, 1.0, -0.3), V(-0.45, 1.0, -0.05)];
  it.at = (k) => ({ tank: V(TX, H + 0.45, TZ), fast: P(11.6, 102).add(V(0, 0, 0.05)), slope: P(11.6, 78).add(V(0, 0, 0.05)), rate: P(11.6, 55).add(V(0, 0, 0.05)), full: P(11.6, 31).add(V(0, 0, 0.05)), icpt: P(4.8, 8).add(V(0, 0, 0.05)) }[k] || V(0, 2, BZ));
  it.noGrab = true; it.noPhys = true; it.height = 2; it.radius = 2; it.base = 0; return it;
}
export function bindTankHands(tg, lever, app, s = { fill: 1 }) {
  pushKnob(lever, { path: () => tg.leverPath(), active: () => stepNow(app, s.fill) && !tg.filling && tg.t < 10, keepVisible: () => app.runner.i === s.fill, press: () => tg.open() });
}

// ------------------------------------------------------------------ Ch 3 The world of numbers: √2 and the square-root spiral
// A number line lies on the ground (1 m between whole numbers). A 1 m square stands on [0, 1]; its diagonal (√2) is swung
// down onto the line like a compass. Then a square-root spiral is built beside it.
export function rootSpiral(o = {}) {
  const it = new Item('wroot', { ...o, name: { en: 'Number line and spiral', hi: 'संख्या रेखा और सर्पिल', hg: 'Number line aur spiral' } });
  const g = it.g, O = V(-1.0, 0.02, -1.4), u = 1.0; it.O = O;
  const X = (v) => O.clone().add(V(v * u, 0, 0));
  g.add(rod(X(-0.3), X(3.3), 0.015, glow(0xffffff)));
  for (let v = 0; v <= 3; v++) { g.add(rod(X(v).add(V(0, 0, -0.08)), X(v).add(V(0, 0, 0.08)), 0.012, glow(0xffffff))); const s = tag(String(v), '#ffffff', 0.17); s.position.copy(X(v)).add(V(0, 0.12, 0.3)); g.add(s); }
  for (let v = 1; v < 30; v++) if (v % 10) g.add(rod(X(v / 10).add(V(0, 0, 0)), X(v / 10).add(V(0, 0, 0.05)), 0.005, glow(0xffffff, 0.8)));
  // the square on [0, 1]
  const sq = [X(0), X(1), X(1).add(V(0, 0, -u)), X(0).add(V(0, 0, -u))]; for (let i = 0; i < 4; i++) g.add(rod(sq[i], sq[(i + 1) % 4], 0.012, glow(0x5ec8ff)));
  const diag = rod(X(0), X(1).add(V(0, 0, -u)), 0.022, glow(0xffd23f)); g.add(diag);
  const arcM = glow(0xffd23f, 0.6); let arcG = null;
  const mk = ball(0xff5a4f, 0.05); mk.visible = false; g.add(mk);
  it.a = 45; // the diagonal's angle above the line (degrees, measured in the ground plane, away from the student)
  it.swing = (a) => { it.a = a; const L = Math.SQRT2 * u, e = X(0).add(V(L * Math.cos(a * DEG), 0, -L * Math.sin(a * DEG))); setRod(diag, X(0), e);
    if (arcG) { g.remove(arcG); arcG.traverse((m) => m.geometry && m.geometry.dispose()); } if (a < 44.9) { arcG = arc(X(0).add(V(0, 0.005, 0)), V(1, 0, 0), V(0, 0, -1), L, 45 * DEG, arcM, 0.012); arcG.rotation.set(0, 0, 0); g.add(arcG); }
    mk.visible = a < 0.01; mk.position.copy(X(Math.SQRT2)); };
  it.swing(45);
  // the square-root spiral, centred to the right
  const C = V(2.6, 0.03, -3.0), su = 0.45, sp = new THREE.Group(); g.add(sp); it.spiral = sp; sp.visible = false;
  const hyps = [], outers = [], tags = []; let ang = 0, r = 1;
  sp.add(rod(C, C.clone().add(V(su, 0, 0)), 0.012, glow(0x5ec8ff)));
  for (let n = 1; n <= 8; n++) { const d = V(Math.cos(ang), 0, -Math.sin(ang)), p = C.clone().addScaledVector(d, r * su), perp = V(-d.z, 0, d.x).multiplyScalar(-1), q = p.clone().addScaledVector(perp, su);
    const sq = Number.isInteger(Math.sqrt(n + 1)), h1 = rod(C, q, 0.012, glow(sq ? 0x8be07a : 0xffd23f)), s2 = rod(p, q, 0.012, glow(0x5ec8ff)); sp.add(h1, s2); hyps.push(h1); outers.push(s2);
    const r2 = Math.sqrt(r * r + 1), out = q.clone().sub(C).setY(0).normalize(); const tg = tag(`√${n + 1}`, sq ? '#8be07a' : '#ffd23f', 0.16); tg.position.copy(q).addScaledVector(out, 0.22).add(V(0, 0.12, 0)); sp.add(tg); tags.push(tg);
    ang += Math.atan2(1, r); r = r2; }
  it.spiralUpTo = (n) => { sp.visible = n > 0; hyps.forEach((m, i) => { m.visible = i < n; }); outers.forEach((m, i) => { m.visible = i < n; }); tags.forEach((m, i) => { m.visible = i < n; }); };
  it.knobPath = () => [V(-0.5, 1.0, -0.45), V(0.2, 1.0, -0.45)];
  it.at = (k) => ({ diag: X(0.5).add(V(0, 0.35, -0.5)), root2: X(Math.SQRT2).add(V(0, 0.45, 0.1)), spiral: C.clone().add(V(0, 1.1, 0)), kinds: V(-0.2, 0.95, -3.2) }[k] || V(0, 1.6, -2));
  it.noGrab = true; it.noPhys = true; it.height = 1; it.radius = 3; it.base = 0; return it;
}
export function bindRootHands(rs, knob, app, s = { swing: 2 }, done = {}) {
  const sync = slideKnob(knob, { path: () => rs.knobPath(), active: () => stepNow(app, s.swing) && rs.a > 0, keepVisible: () => app.runner.i <= s.swing,
    k: () => 1 - rs.a / 45, set: (k) => { let a = 45 * (1 - clamp01(k)); if (a < 2) a = 0; rs.swing(a); if (a === 0) done.swing && done.swing(); } });
  const s0 = rs.swing; rs.swing = (a) => { s0(a); sync(); };
}

// ------------------------------------------------------------------ Ch 5 Circles: angles in a big circle on the ground
// A circle of radius 2 m with centre O. A and B are on it; a pole P on the near arc has ropes to A and B, and the angle at
// P is measured. First AB is a diameter (angle 90°), then B moves and the angle at the centre is twice the angle at P.
export function circleAngles(o = {}) {
  const it = new Item('wcircle', { ...o, name: { en: 'Circle on the ground', hi: 'ज़मीन पर वृत्त', hg: 'Zameen par circle' } });
  const g = it.g, C = V(0, 0.03, -2.7), R = 2; it.C = C;
  const ring = new THREE.Mesh(new THREE.TorusGeometry(R, 0.025, 8, 128), glow(0xffffff)); ring.rotation.x = Math.PI / 2; ring.position.copy(C); ring.userData.noHit = true; g.add(ring);
  const Pt = (th) => C.clone().add(V(R * Math.cos(th * DEG), 0, R * Math.sin(th * DEG)));
  const mkPost = (letter, col) => { const p = new THREE.Group(); p.add(rod(V(0, 0, 0), V(0, 0.9, 0), 0.018, M(0xdddddd, 0.4, 0.5))); const s = tag(letter, col, 0.2); s.position.y = 1.05; p.add(s); return p; };
  const pA = mkPost('A', '#ffd23f'), pB = mkPost('B', '#ffd23f'), pP = mkPost('P', '#ff9a4a'), pO = mkPost('O', '#ffffff'), pQ = mkPost('Q', '#7ad0ff'); pO.position.copy(C); g.add(pA, pB, pP, pO, pQ); pQ.visible = false;
  const ropeM = glow(0xffd23f), rA = rod(V(), V(1, 0, 0), 0.02, ropeM), rB = rod(V(), V(1, 0, 0), 0.02, ropeM), oA = rod(V(), V(1, 0, 0), 0.015, glow(0x7ad0ff)), oB = rod(V(), V(1, 0, 0), 0.015, glow(0x7ad0ff)), qA = rod(V(), V(1, 0, 0), 0.02, glow(0x7ad0ff)), qB = rod(V(), V(1, 0, 0), 0.02, glow(0x7ad0ff));
  g.add(rA, rB, oA, oB, qA, qB); oA.visible = oB.visible = qA.visible = qB.visible = false;
  const rd = liveSign(1.0, 2.2); rd.position.copy(C).add(V(1.8, 0.5, -2.6)); g.add(rd); // behind the circle, at eye height
  it.thA = 180; it.thB = 0; it.thP = 120; it.thQ = null; it.showO = false;
  const angAt = (V0, V1, V2) => { const a = V1.clone().sub(V0).setY(0).normalize(), b = V2.clone().sub(V0).setY(0).normalize(); return Math.acos(Math.max(-1, Math.min(1, a.dot(b)))) / DEG; };
  it.angP = () => angAt(Pt(it.thP), Pt(it.thA), Pt(it.thB));
  it.draw = () => { const A = Pt(it.thA), B = Pt(it.thB), P = Pt(it.thP), y = 0.4; pA.position.copy(A); pB.position.copy(B); pP.position.copy(P);
    setRod(rA, P.clone().setY(y), A.clone().setY(y)); setRod(rB, P.clone().setY(y), B.clone().setY(y));
    oA.visible = oB.visible = it.showO; if (it.showO) { setRod(oA, C.clone().setY(0.2), A.clone().setY(0.2)); setRod(oB, C.clone().setY(0.2), B.clone().setY(0.2)); }
    const lines = [`∠APB = ${it.angP().toFixed(0)}°`]; const cols = ['#ffd23f'];
    if (it.showO) { const c = (((it.thB - it.thA) % 360) + 360) % 360; lines.push(`∠AOB = ${(c > 180 ? 360 - c : c).toFixed(0)}°`); cols.push('#7ad0ff'); }
    if (it.thQ != null) { const Q = Pt(it.thQ); pQ.visible = true; pQ.position.copy(Q); qA.visible = qB.visible = true; setRod(qA, Q.clone().setY(0.3), A.clone().setY(0.3)); setRod(qB, Q.clone().setY(0.3), B.clone().setY(0.3)); lines.push(`∠AQB = ${angAt(Q, A, B).toFixed(0)}°`); cols.push('#7ad0ff'); }
    rd.set(lines, cols); };
  it.setP = (th) => { it.thP = th; it.draw(); };
  it.draw();
  it.knobPath = () => [V(-0.5, 1.0, -0.4), V(0.5, 1.0, -0.4)];
  it.kOf = (th) => (160 - th) / 140; it.thOf = (k) => 160 - 140 * clamp01(k); // left end: P at 160°, right end: P at 20°
  it.at = (k) => ({ p: Pt(it.thP).add(V(0, 1.45, 0)), o: C.clone().add(V(0.6, 0.6, 0)), sum: C.clone().add(V(R + 0.9, 0.6, 0.3)) }[k] || C.clone().add(V(0, 2, 0)));
  it.noGrab = true; it.noPhys = true; it.height = 1; it.radius = 2.5; it.base = 0; return it;
}
export function bindCircleHands(ca, knob, app, s = { move: 1 }, done = {}) {
  let p0 = null;
  const sync = slideKnob(knob, { path: () => ca.knobPath(), active: () => stepNow(app, s.move), keepVisible: () => app.runner.i <= s.move,
    k: () => ca.kOf(ca.thP), set: (k) => { const th = ca.thOf(k); if (p0 == null) p0 = ca.thP; ca.setP(th); if (Math.abs(th - p0) > 40) done.move && done.move(); } });
  const s0 = ca.setP; ca.setP = (th) => { s0(th); sync(); };
}

// ------------------------------------------------------------------ Ch 8 Sequences: a bamboo and a pond weed, week by week
// The bamboo is 50 cm tall in week 1 and grows 30 cm a week (AP). The pond has 64 squares; the weed covers 1 square in week
// 1 and doubles every week (GP). A lever moves on one week at a time.
export function growPatterns(o = {}) {
  const it = new Item('wgrow', { ...o, name: { en: 'Bamboo and pond', hi: 'बाँस और तालाब', hg: 'Baans aur talaab' } });
  const g = it.g, BXp = -1.0, BZ = -2.0, PC = V(1.1, 0.02, -2.3), S = 0.2;
  const bam = new THREE.Group(); bam.position.set(BXp, 0, BZ); g.add(bam);
  const seg = new THREE.CylinderGeometry(0.045, 0.05, 0.3, 14); seg.translate(0, 0.15, 0);
  const segM = M(0x5a9a3a, 0.6, 0, 0.08), nodeM = M(0x3e6e28, 0.6);
  const segs = []; for (let i = 0; i < 12; i++) { const m = new THREE.Mesh(seg, segM); m.position.y = i * 0.3; m.castShadow = true; m.userData.noHit = true; const n = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.01, 6, 16), nodeM); n.rotation.x = Math.PI / 2; n.position.y = 0.3; m.add(n); bam.add(m); segs.push(m); }
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.14, 0.25, 20), M(0xa0522d, 0.8)); pot.position.set(BXp, 0.125, BZ); pot.userData.noHit = true; g.add(pot);
  const ruler = rod(V(BXp + 0.25, 0, BZ), V(BXp + 0.25, 2.4, BZ), 0.01, glow(0xffffff, 0.7)); g.add(ruler);
  for (let c = 50; c <= 230; c += 30) { const t = tag(`${c}`, '#ffffff', 0.09); t.position.set(BXp + 0.42, c / 100, BZ); g.add(t); g.add(rod(V(BXp + 0.2, c / 100, BZ), V(BXp + 0.3, c / 100, BZ), 0.006, glow(0xffffff))); }
  const water = new THREE.Mesh(new THREE.CircleGeometry(1.25, 48), new THREE.MeshStandardMaterial({ color: 0x2a5a6a, roughness: 0.15, metalness: 0.2 })); water.rotation.x = -Math.PI / 2; water.position.copy(PC); water.userData.noHit = true; g.add(water);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(1.25, 0.06, 8, 48), M(0x9a948a, 0.95)); rim.rotation.x = Math.PI / 2; rim.position.copy(PC).setY(0.04); rim.userData.noHit = true; g.add(rim);
  const gridT = canvasTex(512, 512, (x) => { x.strokeStyle = 'rgba(255,255,255,0.35)'; x.lineWidth = 3; for (let i = 0; i <= 8; i++) { x.beginPath(); x.moveTo(i * 64, 0); x.lineTo(i * 64, 512); x.stroke(); x.beginPath(); x.moveTo(0, i * 64); x.lineTo(512, i * 64); x.stroke(); } });
  const grid = new THREE.Mesh(new THREE.PlaneGeometry(8 * S, 8 * S), new THREE.MeshBasicMaterial({ map: gridT, transparent: true, depthWrite: false, toneMapped: false })); grid.rotation.x = -Math.PI / 2; grid.position.copy(PC).setY(0.035); grid.userData.noHit = true; g.add(grid);
  const leafG = new THREE.CylinderGeometry(S * 0.45, S * 0.45, 0.02, 7); const weed = new THREE.InstancedMesh(leafG, M(0x4fa83a, 0.7, 0, 0.12), 64); weed.count = 0; weed.frustumCulled = false; weed.userData.noHit = true; g.add(weed);
  const order = []; for (let k = 0; k < 64; k++) order.push(k); // fill order: 1, 2, 4 … as compact rectangles
  const cellPos = (n) => { const i = n % 8, j = Math.floor(n / 8); return V(PC.x + (i - 3.5) * S, 0.045, PC.z + (j - 3.5) * S); };
  const rect = (count) => { const w = Math.pow(2, Math.ceil(Math.log2(count) / 2)); const out = []; for (let n = 0; n < count; n++) out.push((n % w) + 8 * Math.floor(n / w)); return out; };
  it.week = 1; it.hOf = (w) => 50 + 30 * (w - 1); it.cover = (w) => Math.pow(2, w - 1);
  const draw = () => { const h = it.hOf(it.week) / 100; segs.forEach((m, i) => { const top = (i + 1) * 0.3; m.visible = i * 0.3 < h; m.scale.y = m.visible ? Math.min(1, (h - i * 0.3) / 0.3) : 1; });
    const c = Math.min(64, it.cover(it.week)), cells = rect(c); weed.count = c; cells.forEach((n, k) => { weed.setMatrixAt(k, new THREE.Matrix4().makeRotationY(n * 1.3).setPosition(cellPos(n))); }); weed.instanceMatrix.needsUpdate = true;
    if (it.onWeek) it.onWeek(it.week); };
  it.setWeek = (w) => { it.week = w; draw(); };
  it.next = () => { if (it.week >= 7) return false; it.setWeek(it.week + 1); return true; };
  draw(); void order;
  const rd = liveSign(0.5, 2.6); rd.position.set(0.5, 2.45, -2.9); g.add(rd); it.readout = rd;
  const upd = () => rd.set([`${it.word ? it.word() : 'week'} ${it.week}`, `${it.hOf(it.week)} cm   ·   ${Math.min(64, it.cover(it.week))} / 64`], ['#ffffff', '#ffd23f']);
  const n0 = it.setWeek; it.setWeek = (w) => { n0(w); upd(); }; upd(); it.relabel = upd;
  it.leverPath = () => [V(-0.45, 1.0, -0.3), V(-0.45, 1.0, -0.05)];
  it.at = (k) => ({ bam: V(BXp, 2.75, BZ), pond: PC.clone().add(V(0, 1.2, 0)), ap: V(0.6, 1.65, -2.8), gp: V(0.6, 1.35, -2.8) }[k] || V(0, 2, -2));
  it.noGrab = true; it.noPhys = true; it.height = 2.5; it.radius = 2.5; it.base = 0; return it;
}
export function bindGrowHands(gp, lever, app, upto = { 1: 4, 3: 7 }, done = {}) {
  const lim = () => { for (const i in upto) if (stepNow(app, +i)) return upto[i]; return 0; };
  pushKnob(lever, { path: () => gp.leverPath(), active: () => gp.week < lim(), keepVisible: () => lim() > 0, press: () => { if (gp.next()) done.week && done.week(gp.week); } });
}
