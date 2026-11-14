// DUET Maths Lab 360, hands-on in 3D, batch 6 (Class 10): a giant graph of a polynomial with a marker the student slides
// to its zeros, two ropes (linear equations) on a playground grid, a ball thrown up (quadratic equations), points and
// distances on the grid (coordinate geometry), and a plank that balances at the mean (statistics).
import * as THREE from 'three';
import { Item } from './apparatus.js';
import { canvasTex } from './mats.js';
import { clamp01 } from './mathlab2.js';
import { glow, rod, setRod } from './mathworld.js';
import { pushKnob } from './mathworld3.js';
import { liveSign } from './mathworld4.js';
import { slideKnob } from './mathworld5.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const FONT = '"Noto Sans Devanagari", "Noto Sans", system-ui, sans-serif';
const stepNow = (app, i) => { const r = app.runner; return !!(r.exp && r.i === i && r.state === 'todo'); };
const M = (c, r = 0.6, m = 0, e = 0) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m, emissive: c, emissiveIntensity: e });
const dot = (c, r = 0.06) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), glow(c)); m.userData.noHit = true; return m; };
function letterPost(letter, col = '#ffffff', h = 1.0) {
  const g = new THREE.Group(); const s = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, h, 8), M(0xdddddd, 0.4, 0.5)); s.position.y = h / 2; g.add(s);
  const t = canvasTex(256, 128, (x) => { x.fillStyle = col; x.beginPath(); x.roundRect(4, 4, 248, 120, 40); x.fill(); x.fillStyle = '#10141c'; x.font = `800 72px ${FONT}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(letter, 128, 68); });
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, toneMapped: false })); sp.scale.set(0.6, 0.3, 1); sp.position.y = h + 0.17; g.add(sp);
  g.traverse((m) => { m.userData.noHit = true; }); g.setLabel = (txt) => { const x = t.image.getContext('2d'); x.clearRect(0, 0, 256, 128); x.fillStyle = col; x.beginPath(); x.roundRect(4, 4, 248, 120, 40); x.fill(); x.fillStyle = '#10141c'; x.font = `800 ${txt.length > 6 ? 46 : 72}px ${FONT}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(txt, 128, 68); t.needsUpdate = true; };
  return g;
}
// a coordinate grid painted on the ground: origin at O, x along +x, y along −z (away from the student), u metres per unit
export function groundGrid(O, u, nx, ny) {
  const PX = 96, W = nx * PX + 2 * PX, H = ny * PX + 2 * PX;
  const t = canvasTex(W, H, (x) => { x.clearRect(0, 0, W, H); x.fillStyle = 'rgba(255,255,255,0.10)'; x.fillRect(PX, PX, nx * PX, ny * PX);
    x.strokeStyle = 'rgba(255,255,255,0.55)'; x.lineWidth = 3; for (let i = 0; i <= nx; i++) { x.beginPath(); x.moveTo(PX + i * PX, PX); x.lineTo(PX + i * PX, PX + ny * PX); x.stroke(); } for (let j = 0; j <= ny; j++) { x.beginPath(); x.moveTo(PX, PX + j * PX); x.lineTo(PX + nx * PX, PX + j * PX); x.stroke(); }
    x.strokeStyle = '#ffffff'; x.lineWidth = 9; x.beginPath(); x.moveTo(PX, H - PX); x.lineTo(W - PX / 2, H - PX); x.moveTo(PX, H - PX); x.lineTo(PX, PX / 2); x.stroke();
    x.fillStyle = '#ffffff'; x.font = `800 44px ${FONT}`; x.textAlign = 'center'; x.textBaseline = 'middle'; for (let i = 0; i <= nx; i++) x.fillText(String(i), PX + i * PX, H - PX / 2); for (let j = 1; j <= ny; j++) x.fillText(String(j), PX / 2, H - PX - j * PX);
    x.font = `800 56px ${FONT}`; x.fillText('x', W - PX / 3, H - PX); x.fillText('y', PX, PX / 3); });
  const m = new THREE.Mesh(new THREE.PlaneGeometry((nx + 2) * u, (ny + 2) * u), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, toneMapped: false }));
  m.rotation.x = -Math.PI / 2; m.position.set(O.x + (nx / 2) * u, 0.008, O.z - (ny / 2) * u); m.renderOrder = 2; m.userData.noHit = true; return m;
}

// ------------------------------------------------------------------ Ch 2 Polynomials: the zeros on a giant graph
// A graph board stands in the playground. The curve is y = x² − 2x + c (c = −3 at first). A marker slides along the
// x-axis; a pole from the axis up (green) or down (red) to the curve shows the value p(x).
export function polyGraph(o = {}) {
  const it = new Item('wpoly', { ...o, name: { en: 'Graph of a polynomial', hi: 'बहुपद का ग्राफ़', hg: 'Polynomial ka graph' } });
  const g = it.g, ux = 0.6, uy = 0.34, X0 = -2, X1 = 4, Y0 = -4, Y1 = 5, Z = -3.0, AY = 0.25 + -Y0 * uy; // axis height
  const wx = (x) => (x - 1) * ux, wy = (y) => AY + y * uy; it.wx = wx; it.wy = wy;
  const PX = 110, W = (X1 - X0 + 1) * PX, Hh = (Y1 - Y0 + 1) * PX;
  const t = canvasTex(W, Hh, (x) => { x.fillStyle = 'rgba(16,24,34,0.86)'; x.fillRect(0, 0, W, Hh); const cx = (v) => (v - X0 + 0.5) * PX, cy = (v) => Hh - (v - Y0 + 0.5) * PX;
    x.strokeStyle = 'rgba(255,255,255,0.22)'; x.lineWidth = 2; for (let v = X0; v <= X1; v++) { x.beginPath(); x.moveTo(cx(v), 0); x.lineTo(cx(v), Hh); x.stroke(); } for (let v = Y0; v <= Y1; v++) { x.beginPath(); x.moveTo(0, cy(v)); x.lineTo(W, cy(v)); x.stroke(); }
    x.strokeStyle = '#ffffff'; x.lineWidth = 6; x.beginPath(); x.moveTo(0, cy(0)); x.lineTo(W, cy(0)); x.moveTo(cx(0), 0); x.lineTo(cx(0), Hh); x.stroke();
    x.fillStyle = '#ffffff'; x.font = `800 40px ${FONT}`; x.textAlign = 'center'; x.textBaseline = 'middle'; for (let v = X0; v <= X1; v++) if (v) x.fillText(String(v), cx(v), cy(0) + 30); for (let v = Y0; v <= Y1; v++) if (v) x.fillText(String(v), cx(0) - 30, cy(v)); });
  const board = new THREE.Mesh(new THREE.PlaneGeometry(W / PX * ux, Hh / PX * uy), new THREE.MeshBasicMaterial({ map: t, toneMapped: false, transparent: true }));
  board.position.set(wx((X0 + X1) / 2), wy((Y0 + Y1) / 2), Z - 0.01); board.userData.noHit = true; g.add(board);
  for (const [a, b] of [[V(wx(X0) - 0.3, 0, Z - 0.03), V(wx(X0) - 0.3, wy(Y1) + 0.2, Z - 0.03)], [V(wx(X1) + 0.3, 0, Z - 0.03), V(wx(X1) + 0.3, wy(Y1) + 0.2, Z - 0.03)]]) g.add(rod(a, b, 0.04, M(0x8a6a4a, 0.7)));
  let tube = null; const tubeM = glow(0x5ec8ff);
  it.c = -3; it.p = (x) => x * x - 2 * x + it.c;
  it.setC = (c) => { it.c = c; if (tube) { g.remove(tube); tube.geometry.dispose(); } const pts = []; for (let x = X0; x <= X1 + 1e-6; x += 0.1) { const y = it.p(x); if (y <= Y1 + 0.2) pts.push(V(wx(x), wy(Math.max(Y0, y)), Z + 0.02)); }
    tube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 120, 0.025, 8), tubeM); tube.userData.noHit = true; g.add(tube); if (it.x != null) it.setX(it.x); };
  const gPos = glow(0x8be07a), gNeg = glow(0xff5a4f); const pole = rod(V(0, 0, 0), V(0, 1, 0), 0.03, gPos), mk = dot(0xffd23f, 0.07), top = dot(0xffffff, 0.05); g.add(pole, mk, top);
  const rd = liveSign(0.26, 3.4); rd.position.set(wx(1), wy(Y1) + 0.45, Z + 0.1); g.add(rd);
  it.x = 2.5;
  it.setX = (x) => { it.x = x; const y = it.p(x); mk.position.set(wx(x), wy(0), Z + 0.04); top.position.set(wx(x), wy(Math.max(Y0, Math.min(Y1, y))), Z + 0.04); pole.material = y >= 0 ? gPos : gNeg; setRod(pole, V(wx(x), wy(0), Z + 0.03), V(wx(x), wy(Math.max(Y0, Math.min(Y1, y))) + (Math.abs(y) < 0.02 ? 0.001 : 0), Z + 0.03));
    rd.set([`p(x) = x² − 2x ${it.c < 0 ? '− ' + -it.c : '+ ' + it.c}`, `x = ${x.toFixed(2)}    p(x) = ${y.toFixed(2)}`], ['#5ec8ff', Math.abs(y) < 0.005 ? '#8be07a' : '#ffffff']); };
  it.setC(-3); it.setX(2.5);
  it.zeroAt = (x) => V(wx(x), wy(0) + 0.35, Z + 0.1);
  it.knobPath = () => [V(-0.45, 1.0, -0.45), V(0.45, 1.0, -0.45)];
  it.kOf = (x) => (x - X0) / (X1 - X0); it.xOf = (k) => X0 + (X1 - X0) * k;
  it.at = (k) => ({ eq1: V(wx(1), wy(Y1) - 0.1, Z + 0.15), eq2: V(wx(1), wy(Y1) - 0.45, Z + 0.15), eq3: V(wx(1), wy(Y1) - 0.8, Z + 0.15) }[k] || V(0, 2, Z));
  it.noGrab = true; it.noPhys = true; it.height = 3.5; it.radius = 2.2; it.base = 0; return it;
}
export function bindPolyHands(pg, knob, app, s = { z1: 1, z2: 2 }, done = {}) {
  const found = new Set();
  const sync = slideKnob(knob, { path: () => pg.knobPath(), active: () => stepNow(app, s.z1) || stepNow(app, s.z2), keepVisible: () => app.runner.i >= s.z1 && app.runner.i <= s.z2,
    k: () => pg.kOf(pg.x), set: (k) => { let x = pg.xOf(k); for (const z of [-1, 3]) if (Math.abs(x - z) < 0.12) x = z; pg.setX(x);
      if (x === -1 || x === 3) { if (stepNow(app, s.z1) && !found.size) { found.add(x); done.zero && done.zero(1, x); } else if (stepNow(app, s.z2) && !found.has(x)) { found.add(x); done.zero && done.zero(2, x); } } } });
  const s0 = pg.setX; pg.setX = (x) => { s0(x); sync(); };
  pg.found = found;
}

// ------------------------------------------------------------------ Ch 3 Pair of linear equations: two ropes on a grid
// On a grid on the ground (1 unit = 0.6 m) the red rope is x + y = 5 and the blue rope x − y = 1. A pole moves along the
// red rope; its point (x, y) and the value of x − y are shown. Then the blue rope moves: parallel, then on top of the red.
export function twoLines(o = {}) {
  const it = new Item('wlines', { ...o, name: { en: 'Two lines on the ground', hi: 'ज़मीन पर दो रेखाएँ', hg: 'Zameen par do lines' } });
  const g = it.g, u = 0.6, O = V(-1.5, 0, 0.9); it.u = u; it.O = O;
  const P = (x, y, h = 0.03) => V(O.x + x * u, h, O.z - y * u); it.P = P;
  g.add(groundGrid(O, u, 7, 7));
  const red = rod(P(0, 5), P(5, 0), 0.03, glow(0xff5a4f)), blue = rod(P(1, 0), P(7, 6), 0.03, glow(0x5ec8ff)); g.add(red, blue);
  const lab = (txt, col) => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: canvasTex(512, 128, (x) => { x.fillStyle = 'rgba(12,16,24,0.85)'; x.beginPath(); x.roundRect(4, 4, 504, 120, 40); x.fill(); x.fillStyle = col; x.font = `800 72px ${FONT}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(txt, 256, 68); }), depthTest: false, toneMapped: false })); s.scale.set(0.8, 0.2, 1); s.renderOrder = 40; s.userData.noHit = true; return s; };
  const lr = lab('x + y = 5', '#ff8a7a'); lr.position.copy(P(0.4, 4.6, 0.5)); g.add(lr);
  const lb = lab('x − y = 1', '#7ad0ff'); lb.position.copy(P(6.4, 5.2, 0.5)); g.add(lb); it.blueLabel = lb;
  const pole = letterPost('(0, 5)', '#ffd23f', 1.0); g.add(pole);
  const rd = liveSign(0.22, 3.6); rd.position.copy(P(3.5, 7.2, 1.7)); g.add(rd);
  it.s = 0; // the pole's x on the red rope (0 … 5)
  it.setS = (x) => { it.s = x; const y = 5 - x; pole.position.copy(P(x, y, 0)); pole.setLabel(`(${fmt(x)}, ${fmt(y)})`); rd.set([`x + y = ${fmt(x + y)}`, `x − y = ${fmt(x - y)}`], ['#ff8a7a', Math.abs(x - y - 1) < 0.01 ? '#8be07a' : '#7ad0ff']); };
  const fmt = (v) => (Math.abs(v - Math.round(v)) < 0.01 ? String(Math.round(v)) : v.toFixed(1));
  it.setS(0.5);
  // the blue rope: from x − y = 1 to x + y = 2 (parallel) to 2x + 2y = 10 (the same line)
  it.blueTo = (a, b) => { setRod(blue, a, b); lb.position.copy(b).setY(0.55).add(V(0.2, 0, -0.2)); };
  it.ends = { cross: [P(1, 0), P(7, 6)], par: [P(0, 2), P(2, 0)], same: [P(0, 5), P(5, 0)] };
  it.setBlueText = (txt) => { lb.material.map = canvasTex(512, 128, (x) => { x.fillStyle = 'rgba(12,16,24,0.85)'; x.beginPath(); x.roundRect(4, 4, 504, 120, 40); x.fill(); x.fillStyle = '#7ad0ff'; x.font = `800 ${txt.length > 12 ? 56 : 72}px ${FONT}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(txt, 256, 68); }); };
  it.knobPath = () => [V(-0.45, 1.0, -0.4), V(0.45, 1.0, -0.4)];
  it.at = (k) => ({ cross: P(3, 2, 1.3), top: P(3.5, 7.2, 1.25), par: P(1, 1, 1.0) }[k] || P(3, 3, 1.5));
  it.noGrab = true; it.noPhys = true; it.height = 1; it.radius = 3; it.base = 0; return it;
}
export function bindLinesHands(tl, knob, app, s = { meet: 1 }, done = {}) {
  const sync = slideKnob(knob, { path: () => tl.knobPath(), active: () => stepNow(app, s.meet) && Math.abs(tl.s - 3) > 1e-6, keepVisible: () => app.runner.i <= s.meet,
    k: () => tl.s / 5, set: (k) => { let x = 5 * clamp01(k); if (Math.abs(x - 3) < 0.12) x = 3; tl.setS(x); if (x === 3) done.meet && done.meet(); } });
  const s0 = tl.setS; tl.setS = (x) => { s0(x); sync(); };
}

// ------------------------------------------------------------------ Ch 4 Quadratic equations: a ball thrown up
// A ball leaves the student's hand 1 m above the ground, going up at 4 m/s and sideways at 3 m/s:
// h = 1 + 4t − 5t² (metres, t in seconds). Its path is traced with dots; lines at 1.75 m and 2 m come later.
export function ballThrow(o = {}) {
  const it = new Item('wball', { ...o, name: { en: 'Ball and its path', hi: 'गेंद और उसका रास्ता', hg: 'Ball aur uska rasta' } });
  const g = it.g, X0 = -1.5, Z = -1.7, VX = 3;
  it.h = (t) => 1 + 4 * t - 5 * t * t;
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.05, 20, 14), M(0xf08a24, 0.5)); ball.castShadow = true; ball.userData.noHit = true; g.add(ball);
  const hand = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.04, 16), M(0x8a6a4a, 0.6)); hand.position.set(X0, 0.95, Z); hand.userData.noHit = true; g.add(hand);
  const stand = rod(V(X0, 0, Z), V(X0, 0.93, Z), 0.02, M(0x999999, 0.4, 0.6)); g.add(stand);
  const dots = new THREE.InstancedMesh(new THREE.SphereGeometry(0.02, 8, 6), glow(0xffd23f), 60); dots.count = 0; dots.frustumCulled = false; dots.userData.noHit = true; g.add(dots);
  const ground = rod(V(X0 - 0.3, 0.01, Z), V(X0 + 3.6, 0.01, Z), 0.012, glow(0xffffff, 0.8)); g.add(ground);
  const lineA = rod(V(X0 - 0.2, 1.75, Z), V(X0 + 3.4, 1.75, Z), 0.012, glow(0x8be07a)), lineB = rod(V(X0 - 0.2, 2.0, Z), V(X0 + 3.4, 2.0, Z), 0.012, glow(0xff5a4f)); lineA.visible = lineB.visible = false; g.add(lineA, lineB);
  const mkA = dot(0x8be07a, 0.045), mkB = dot(0x8be07a, 0.045); mkA.visible = mkB.visible = false; g.add(mkA, mkB);
  const P = (t) => V(X0 + VX * t, Math.max(0.05, it.h(t)), Z); it.P = P;
  it.t = 0; it.flying = 0; let lastDot = -1;
  it.place = (t) => { it.t = t; ball.position.copy(P(t)); };
  it.place(0);
  it.throw = () => { if (it.flying) return false; it.flying = 1; it.t = 0; dots.count = 0; lastDot = -1; return true; };
  it.update = (dt) => { if (!it.flying) return; it.t = Math.min(1, it.t + Math.min(dt || 0.016, 0.05) / 2.2); ball.position.copy(P(it.t)); const k = Math.floor(it.t / 0.025);
    if (k > lastDot) { lastDot = k; const m = new THREE.Matrix4().setPosition(P(k * 0.025)); dots.setMatrixAt(dots.count, m); dots.count = Math.min(60, dots.count + 1); dots.instanceMatrix.needsUpdate = true; }
    if (it.t >= 1) { it.flying = 0; ball.position.copy(P(1)); if (it.onLand) it.onLand(); } };
  it.showLine = (which) => { lineA.visible = which === 'a'; lineB.visible = which === 'b'; mkA.visible = mkB.visible = which === 'a'; if (which === 'a') { mkA.position.copy(P(0.3)); mkB.position.copy(P(0.5)); } };
  it.trace = () => { dots.count = 0; for (let k = 0; k <= 40; k++) { dots.setMatrixAt(dots.count, new THREE.Matrix4().setPosition(P(k * 0.025))); dots.count++; } dots.instanceMatrix.needsUpdate = true; };
  it.leverPath = () => [V(-0.45, 1.0, -0.3), V(-0.45, 1.0, -0.02)];
  it.at = (k) => ({ land: P(1).add(V(0, 0.35, 0)), top: P(0.4).add(V(0, 0.35, 0)), a: P(0.4).add(V(0, 0.55, 0)), eq1: V(1.15, 2.2, Z), eq2: V(1.15, 1.95, Z), eq3: V(1.15, 1.7, Z), start: V(X0, 1.3, Z) }[k] || V(0, 2, Z));
  it.noGrab = true; it.noPhys = true; it.height = 2; it.radius = 2; it.base = 0; return it;
}
export function bindThrowHands(bt, lever, app, s = { th: 1 }) {
  pushKnob(lever, { path: () => bt.leverPath(), active: () => stepNow(app, s.th) && !bt.flying && !bt.thrown, keepVisible: () => app.runner.i === s.th, press: () => { if (bt.throw()) bt.thrown = true; } });
}

// ------------------------------------------------------------------ Ch 7 Coordinate geometry: distance and section formulas
// A grid on the ground (1 unit = 0.45 m). A is at (1, 2). B starts at (7, 2) and slides up to (7, 10); then a point P
// slides along AB.
export function gridPoints(o = {}) {
  const it = new Item('wpoints', { ...o, name: { en: 'Points on a grid', hi: 'ग्रिड पर बिंदु', hg: 'Grid par points' } });
  const g = it.g, u = 0.45, O = V(-1.3, 0, 0.9);
  const P = (x, y, h = 0.03) => V(O.x + x * u, h, O.z - y * u); it.P = P;
  g.add(groundGrid(O, u, 9, 11));
  const pA = letterPost('A (1, 2)', '#ffd23f', 0.9), pB = letterPost('B', '#5ec8ff', 0.9), pP = letterPost('P', '#8be07a', 0.7); pA.position.copy(P(1, 2, 0)); g.add(pA, pB, pP); pP.visible = false;
  const ab = rod(P(1, 2), P(7, 2), 0.03, glow(0xffffff)), leg1 = rod(P(1, 2), P(7, 2), 0.02, glow(0xffd23f)), leg2 = rod(P(7, 2), P(7, 2.001), 0.02, glow(0x5ec8ff)); g.add(ab, leg1, leg2); leg1.visible = leg2.visible = false;
  const rd = liveSign(0.22, 3.4); rd.position.copy(P(4, 12, 1.5)); g.add(rd);
  it.by = 2; it.t = 0;
  it.setB = (y) => { it.by = y; pB.position.copy(P(7, y, 0)); pB.setLabel(`B (7, ${Math.round(y * 10) / 10})`); setRod(ab, P(1, 2), P(7, y)); setRod(leg2, P(7, 2), P(7, y + 0.001)); const d = Math.hypot(6, y - 2); rd.set([`AB = √(6² + ${(y - 2).toFixed(1)}²)`, `= ${d.toFixed(2)}`], ['#ffffff', Math.abs(y - 10) < 1e-6 ? '#8be07a' : '#ffffff']); };
  it.setB(2);
  it.legs = (on) => { leg1.visible = leg2.visible = on; };
  it.setP = (t) => { it.t = t; pP.visible = true; const x = 1 + 6 * t, y = 2 + (it.by - 2) * t; pP.position.copy(P(x, y, 0)); pP.setLabel(`P (${(Math.round(x * 10) / 10)}, ${(Math.round(y * 10) / 10)})`); rd.set([`AP : PB = ${t.toFixed(2)} : ${(1 - t).toFixed(2)}`, `P = (${x.toFixed(1)}, ${y.toFixed(1)})`], ['#ffffff', Math.abs(t - 0.5) < 1e-6 ? '#8be07a' : '#ffffff']); };
  it.bPath = () => [V(0.2, 1.0, -0.2), V(0.2, 1.0, -0.6)];
  it.pPath = () => [V(-0.4, 1.0, -0.45), V(0.4, 1.0, -0.45)];
  it.at = (k) => ({ leg1: P(4, 1.2, 0.4), leg2: P(7.8, 6, 0.4), ab: P(3.4, 6.6, 0.9), mid: P(4, 6, 1.2), q: P(2.5, 4, 1.0) }[k] || P(4, 6, 1.5));
  it.noGrab = true; it.noPhys = true; it.height = 1; it.radius = 3; it.base = 0; return it;
}
export function bindPointHands(gp, kB, kP, app, s = { b: 1, mid: 3 }, done = {}) {
  const syncB = slideKnob(kB, { path: () => gp.bPath(), active: () => stepNow(app, s.b) && gp.by < 10, keepVisible: () => app.runner.i <= s.b,
    k: () => (gp.by - 2) / 8, set: (k) => { let y = 2 + 8 * clamp01(k); if (y > 9.75) y = 10; gp.setB(y); if (y === 10) done.b && done.b(); } });
  const syncP = slideKnob(kP, { path: () => gp.pPath(), active: () => stepNow(app, s.mid) && Math.abs(gp.t - 0.5) > 1e-6, keepVisible: () => app.runner.i === s.mid,
    k: () => gp.t, set: (k) => { let t = clamp01(k); if (Math.abs(t - 0.5) < 0.03) t = 0.5; gp.setP(t); if (t === 0.5) done.mid && done.mid(); } });
  const b0 = gp.setB, p0 = gp.setP; gp.setB = (y) => { b0(y); syncB(); }; gp.setP = (t) => { p0(t); syncP(); };
}

// ------------------------------------------------------------------ Ch 13 Statistics: the mean is a balance point
// A plank marked 0 … 14 lies on a support on the table. One block stands at each student's marks: 1, 3, 3, 5, 8, 9, 13.
// The support slides under the plank; the plank tips towards the heavier side and is level only at the mean (6).
export function meanPlank(o = {}) {
  const it = new Item('wplank', { ...o, name: { en: 'Balance plank', hi: 'संतुलन पट्टा', hg: 'Balance plank' } });
  const g = it.g, u = 0.05, X0 = -0.35, data = o.data || [1, 3, 3, 5, 8, 9, 13]; it.data = data; it.mean = data.reduce((a, b) => a + b, 0) / data.length;
  const sup = new THREE.Mesh(new THREE.CylinderGeometry(0.0001, 0.045, 0.07, 3), M(0x3d7be0, 0.5)); sup.position.y = 0.035; sup.userData.noHit = true; g.add(sup);
  const piv = new THREE.Group(); piv.position.y = 0.072; g.add(piv);
  const scale = canvasTex(1024, 96, (x) => { x.fillStyle = '#e6d2a8'; x.fillRect(0, 0, 1024, 96); x.fillStyle = '#2a1f14'; x.font = `800 40px ${FONT}`; x.textAlign = 'center'; for (let v = 0; v <= 14; v++) { const xx = 1024 * (v + 0.5) / 15; x.fillRect(xx - 2, 0, 4, 28); x.fillText(String(v), xx, 66); } });
  const plank = new THREE.Mesh(new THREE.BoxGeometry(15 * u, 0.012, 0.07), [M(0xc9a978, 0.7), M(0xc9a978, 0.7), new THREE.MeshStandardMaterial({ map: scale, roughness: 0.7 }), M(0xc9a978, 0.7), M(0xc9a978, 0.7), M(0xc9a978, 0.7)]); plank.castShadow = true; plank.userData.noHit = true; piv.add(plank);
  const blocks = []; const cnt = {}; for (const v of data) { cnt[v] = (cnt[v] || 0) + 1; const b = new THREE.Mesh(new THREE.BoxGeometry(0.034, 0.034, 0.034), M(0xd9493a, 0.5)); b.userData = { v, k: cnt[v] - 1, noHit: true }; b.castShadow = true; piv.add(b); blocks.push(b); }
  it.f = 2; it.ang = 0;
  const layout = () => { plank.position.set((7 - it.f) * u, 0.006, 0); for (const b of blocks) b.position.set((b.userData.v - it.f) * u, 0.012 + 0.017 + b.userData.k * 0.035, 0); piv.position.x = X0 + (it.f + 0.5) * u; sup.position.x = piv.position.x; };
  it.setF = (f) => { it.f = f; layout(); };
  it.target = () => -Math.max(-0.22, Math.min(0.22, (it.mean - it.f) * 0.06));
  it.update = (dt) => { const tg = it.target(); it.ang += (tg - it.ang) * Math.min(1, (dt || 0.016) * 5); piv.rotation.z = it.ang; };
  it.setF(2);
  it.mark = (vals, col) => { for (const b of blocks) b.material.color.set(vals.includes(blocks.indexOf(b)) ? col : 0xd9493a); };
  const W = (x, y, z) => g.localToWorld(V(x, y, z));
  it.blockAt = (i) => { const b = blocks[i]; return b.getWorldPosition(V(0, 0, 0)).add(V(0, 0.08, 0)); };
  it.knobPath = () => [W(X0 + 0.5 * u, 0.02, 0.12), W(X0 + 14.5 * u, 0.02, 0.12)];
  it.at = (k) => ({ mean: W(0.02, 0.32, 0), eq: W(0.02, 0.25, 0), data: W(0.02, 0.4, 0) }[k] || W(0, 0.3, 0));
  it.noGrab = true; it.noPhys = true; it.height = 0.15; it.radius = 0.4; it.base = 0; return it;
}
export function bindPlankHands(mp, knob, app, s = { bal: 1 }, done = {}) {
  const sync = slideKnob(knob, { path: () => mp.knobPath(), active: () => stepNow(app, s.bal) && Math.abs(mp.f - mp.mean) > 1e-6, keepVisible: () => app.runner.i <= s.bal,
    k: () => mp.f / 14, set: (k) => { let f = 14 * clamp01(k); if (Math.abs(f - mp.mean) < 0.3) f = mp.mean; mp.setF(f); if (f === mp.mean) done.bal && done.bal(); } });
  const s0 = mp.setF; mp.setF = (f) => { s0(f); sync(); };
}
