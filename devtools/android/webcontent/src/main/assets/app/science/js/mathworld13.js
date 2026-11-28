// DUET Maths Lab 360, hands-on in 3D, batch 13 (Class 6): Kaprekar's game with giant digit blocks (number play), a fruit
// survey stacked into 3D bars (data handling), chairs arranged in equal rows (prime time), and a peg-and-rope compass on
// the field (playing with constructions).
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
  const paint = (x, txt, c) => { x.clearRect(0, 0, W, 128); x.fillStyle = bg; x.beginPath(); x.roundRect(4, 4, W - 8, 120, 40); x.fill(); x.fillStyle = c; x.font = `800 ${String(txt).length > 8 ? 56 : 72}px ${FONT}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(String(txt), W / 2, 68); };
  const t = canvasTex(W, 128, (x) => paint(x, text, col));
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: false, toneMapped: false })); s.scale.set(h * w, h, 1); s.renderOrder = 40; s.userData.noHit = true;
  s.setText = (txt, c = col) => { paint(t.image.getContext('2d'), txt, c); t.needsUpdate = true; };
  return s;
}

// ------------------------------------------------------------------ Ch 3 Number Play: Kaprekar's game
// Four big digit blocks stand on the ground showing a number. One round: arrange the digits from largest to smallest
// (front row), from smallest to largest (back row), and subtract. Every 4-digit number with at least two different digits
// reaches 6174 within 7 rounds, and then stays there.
let digMats = null, plainM = null; // made on first use, so the module can load without a DOM
const mats13 = () => { if (!digMats) { digMats = Array.from({ length: 10 }, (_, d) => new THREE.MeshStandardMaterial({ roughness: 0.6, map: canvasTex(256, 256, (x) => { x.fillStyle = '#f4ead2'; x.fillRect(0, 0, 256, 256); x.strokeStyle = '#c9b48a'; x.lineWidth = 10; x.strokeRect(5, 5, 246, 246); x.fillStyle = '#1d2a3a'; x.font = `800 190px ${FONT}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(String(d), 128, 140); }) })); plainM = new THREE.MeshStandardMaterial({ color: 0xe8dcc0, roughness: 0.7 }); } };
function digitBlock(s = 0.4) { mats13(); const m = new THREE.Mesh(new THREE.BoxGeometry(s, s, s), [plainM, plainM, plainM, plainM, digMats[0], plainM]); m.setDigit = (d) => { m.material[4] = digMats[d]; m.digit = d; }; m.setDigit(0); return m; }
export function kaprekar(o = {}) {
  const it = new Item('wkap', { ...o, name: { en: 'Digit blocks', hi: 'अंकों के ब्लॉक', hg: 'Digit blocks' } });
  const g = it.g, S = 0.4, GAP = 0.48, ZF = -1.9, ZB = -2.6;
  const xs = (i) => (i - 1.5) * GAP;
  const front = [0, 1, 2, 3].map((i) => { const b = digitBlock(S); b.position.set(xs(i), S / 2, ZF); g.add(b); return b; });
  const bench = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.5, 0.4), M(0x8a6a44, 0.85)); bench.position.set(0, 0.25, ZB); g.add(bench);
  const back = [0, 1, 2, 3].map((i) => { const b = digitBlock(S * 0.8); b.position.set(xs(i), 0.5 + S * 0.4, ZB); b.visible = false; g.add(b); return b; });
  const minus = tag('−', '#ffffff', 0.3); minus.position.set(xs(-0.9), 0.75, ZB); minus.visible = false; g.add(minus);
  const rd = liveSign(0.5, 3.6); rd.position.set(0, 1.35, ZB - 0.5); g.add(rd);
  const D4 = (n) => String(n).padStart(4, '0').split('').map(Number);
  it.n = 3524; it.hist = []; it.busy = false; let A = null;
  it.setN = (n) => { it.n = n; D4(n).forEach((d, i) => { front[i].setDigit(d); front[i].position.set(xs(i), S / 2, ZF); }); back.forEach((b) => { b.visible = false; }); minus.visible = false; };
  const show = () => { const L = it.hist.slice(-2); rd.set(L.length ? L : [String(it.n).padStart(4, '0')], L.length > 1 ? ['#9aa6b2', it.n === 6174 ? '#8be07a' : '#ffd23f'] : (it.n === 6174 && L.length ? '#8be07a' : '#ffd23f')); };
  it.round = () => { if (it.busy) return false; const d = D4(it.n), desc = [...d].sort((a, b) => b - a), asc = [...desc].reverse();
    const big = +desc.join(''), small = +asc.join(''), diff = big - small;
    // where each front block goes so that the row reads in descending order
    const used = new Set(); const target = d.map((v) => { for (let k = 0; k < 4; k++) if (!used.has(k) && desc[k] === v) { used.add(k); return k; } return 0; });
    A = { t: 0, target, asc, eqn: `${desc.join('')} − ${asc.join('')} = ${String(diff).padStart(4, '0')}`, diff }; it.busy = true; return true; };
  it.update = (dt) => { if (!A) return; A.t = Math.min(1, A.t + Math.min(dt || 0.016, 0.05) * 0.7); const t = A.t;
    front.forEach((b, i) => { const k = ease(clamp01(t / 0.35)); b.position.x = xs(i) + (xs(A.target[i]) - xs(i)) * k; b.position.y = S / 2 + Math.sin(k * Math.PI) * 0.25; });
    if (t > 0.4 && !back[0].visible) { back.forEach((b, i) => { b.setDigit(A.asc[i]); b.visible = true; }); minus.visible = true; }
    if (t >= 1) { it.hist.push(A.eqn); const n = A.diff; A = null; it.busy = false; it.setN(n); show(); if (it.onRound) it.onRound(n); } };
  it.reset = (n) => { it.hist = []; it.setN(n); show(); };
  it.setN(3524); show();
  it.leverPath = () => [V(-0.45, 1.0, -0.3), V(-0.45, 1.0, -0.05)];
  it.at = (k) => ({ top: V(0, 1.0, ZF) }[k] || V(0, 1, ZF));
  noHit(g); it.noGrab = true; it.noPhys = true; it.height = 0.4; it.radius = 1.5; it.base = 0; return it;
}
export function bindKapHands(kp, lever, app, s = { play: 1 }, done = {}) {
  kp.onRound = (n) => { if (n === 6174) done.reach && done.reach(); };
  pushKnob(lever, { path: () => kp.leverPath(), active: () => stepNow(app, s.play) && !kp.busy && kp.n !== 6174, keepVisible: () => app.runner.i === s.play, press: () => kp.round() });
}

// ------------------------------------------------------------------ Ch 4 Data Handling and Presentation: fruit crates
// A class voted for its favourite fruit: mango 8, banana 5, apple 3, guava 6. A tally board stands behind; each push of the
// lever stacks one fruit's crates into a bar (1 crate = 1 vote). Then 1 crate stands for 2 votes, as in a pictograph.
export function fruitBars(o = {}) {
  const it = new Item('wfruit', { ...o, name: { en: 'Fruit survey', hi: 'फलों का सर्वे', hg: 'Fruit survey' } });
  const g = it.g, CNT = [8, 5, 3, 6], COL = [0xffb020, 0xf5e050, 0xd8352a, 0x8fc94a], CW = 0.36, CH = 0.16, CD = 0.28, GAP = 0.62, Z = -2.0;
  const xs = (i) => (i - 1.5) * GAP;
  const crateG = new THREE.BoxGeometry(CW, CH * 0.92, CD);
  const crateT = canvasTex(128, 64, (x) => { x.fillStyle = '#b07a3e'; x.fillRect(0, 0, 128, 64); x.fillStyle = '#8a5a26'; for (let k = 0; k < 4; k++) x.fillRect(0, 4 + k * 16, 128, 4); });
  const crates = new THREE.InstancedMesh(crateG, new THREE.MeshStandardMaterial({ map: crateT, roughness: 0.8 }), 40); crates.frustumCulled = false; g.add(crates);
  const fruitG = new THREE.SphereGeometry(0.075, 16, 12);
  const fruits = new THREE.InstancedMesh(fruitG, new THREE.MeshStandardMaterial({ roughness: 0.5 }), 40); fruits.frustumCulled = false; g.add(fruits);
  const nameT = [0, 1, 2, 3].map((i) => { const t = tag('', '#ffffff', 0.13); t.position.set(xs(i), 0.22, Z + 0.3); g.add(t); return t; });
  const cntT = [0, 1, 2, 3].map((i) => { const t = tag('0', '#ffd23f', 0.15); t.visible = false; g.add(t); return t; });
  // the tally board
  const BW = 1024, BH = 400, cv = document.createElement('canvas'); cv.width = BW; cv.height = BH; const btex = new THREE.CanvasTexture(cv); btex.colorSpace = THREE.SRGBColorSpace;
  const board = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 2.4 * BH / BW), new THREE.MeshBasicMaterial({ map: btex, toneMapped: false })); board.position.set(0, 2.0, Z - 0.7); g.add(board);
  it.words = () => ['mango', 'banana', 'apple', 'guava'];
  const drawBoard = () => { const c = cv.getContext('2d'), names = it.words(); c.fillStyle = '#1b2a22'; c.fillRect(0, 0, BW, BH); c.strokeStyle = '#c9a66b'; c.lineWidth = 14; c.strokeRect(7, 7, BW - 14, BH - 14);
    names.forEach((nm, i) => { const y = 70 + i * 82; c.fillStyle = '#ffffff'; c.font = `700 46px ${FONT}`; c.textAlign = 'left'; c.textBaseline = 'middle'; c.fillText(nm, 50, y);
      c.strokeStyle = '#f4f0e0'; c.lineWidth = 7; const n = CNT[i]; for (let k = 0; k < n; k++) { const grp = Math.floor(k / 5), j = k % 5, x0 = 420 + grp * 160; if (j < 4) { c.beginPath(); c.moveTo(x0 + j * 26, y - 28); c.lineTo(x0 + j * 26, y + 28); c.stroke(); } else { c.beginPath(); c.moveTo(x0 - 14, y + 24); c.lineTo(x0 + 92, y - 24); c.stroke(); } }
      c.fillStyle = '#ffd23f'; c.textAlign = 'right'; c.fillText(String(n), BW - 50, y); });
    btex.needsUpdate = true; };
  it.relabel = () => { drawBoard(); it.words().forEach((n, i) => nameT[i].setText(n)); };
  it.shown = 0; it.per = 1; it.busy = false; let A = null;
  const mtx = new THREE.Matrix4(), fc = new THREE.Color();
  const draw = (anim) => { let k = 0, f = 0; for (let i = 0; i < 4; i++) { const full = i < it.shown, h = full ? CNT[i] / it.per : 0, growing = anim && anim.i === i, hh = growing ? CNT[i] / it.per * ease(anim.t) : h;
      const whole = Math.floor(hh + 1e-6), part = hh - whole; for (let b = 0; b < whole; b++) { mtx.makeTranslation(xs(i), CH * (b + 0.5), Z); crates.setMatrixAt(k++, mtx); }
      if (part > 0.01) { mtx.makeScale(1, part, 1).setPosition(xs(i), CH * (whole + part / 2), Z); crates.setMatrixAt(k++, mtx); }
      if (hh > 0) { mtx.makeTranslation(xs(i), CH * hh + 0.07, Z); fruits.setMatrixAt(f, mtx); fruits.setColorAt(f, fc.set(COL[i])); f++; cntT[i].visible = !growing || anim.t > 0.95; cntT[i].position.set(xs(i), CH * hh + 0.32, Z); cntT[i].setText(it.per === 1 ? String(CNT[i]) : `${CNT[i]}`); } else cntT[i].visible = false; }
    crates.count = k; fruits.count = f; crates.instanceMatrix.needsUpdate = true; fruits.instanceMatrix.needsUpdate = true; if (fruits.instanceColor) fruits.instanceColor.needsUpdate = true; };
  it.next = () => { if (it.busy || it.shown >= 4) return false; A = { i: it.shown, t: 0 }; it.shown++; it.busy = true; return true; };
  it.update = (dt) => { if (!A) return; A.t = Math.min(1, A.t + Math.min(dt || 0.016, 0.05) * 1.6); draw(A); if (A.t >= 1) { A = null; it.busy = false; draw(); if (it.onBar) it.onBar(it.shown); } };
  it.setPer = (p) => { it.per = p; draw(); };
  it.setShown = (n) => { it.shown = n; draw(); };
  it.relabel(); draw();
  it.leverPath = () => [V(-0.45, 1.0, -0.3), V(-0.45, 1.0, -0.05)];
  it.at = (k) => ({ side: V(1.75, 1.0, Z), key: V(1.75, 0.6, Z) }[k] || V(0, 1.6, Z));
  noHit(g); it.noGrab = true; it.noPhys = true; it.height = 1; it.radius = 1.5; it.base = 0; return it;
}
export function bindFruitHands(fb, lever, app, s = { stack: 1 }, done = {}) {
  fb.onBar = (n) => { if (n >= 4) done.all && done.all(); };
  pushKnob(lever, { path: () => fb.leverPath(), active: () => stepNow(app, s.stack) && !fb.busy && fb.shown < 4, keepVisible: () => app.runner.i === s.stack, press: () => fb.next() });
}

// ------------------------------------------------------------------ Ch 5 Prime Time: chairs in equal rows
// Chairs for a class are set out on the ground in r equal rows (r chosen with a slider). If r does not divide the number
// of chairs, the chairs left over are red. 12 chairs fit several rectangles; 7 chairs fit only one row (prime).
export function chairRows(o = {}) {
  const it = new Item('wchairs', { ...o, name: { en: 'Chairs in rows', hi: 'क़तारों में कुर्सियाँ', hg: 'Kataaron mein kursiyan' } });
  const g = it.g, SP = 0.36, Z0 = -1.7, MAXC = 12;
  const seatG = new THREE.BoxGeometry(0.3, 0.035, 0.28); seatG.translate(0, 0.3, 0);
  const backG = new THREE.BoxGeometry(0.3, 0.3, 0.03); backG.translate(0, 0.46, -0.13);
  const legG = new THREE.BoxGeometry(0.025, 0.3, 0.025);
  const seats = new THREE.InstancedMesh(seatG, new THREE.MeshStandardMaterial({ roughness: 0.6 }), MAXC), backs = new THREE.InstancedMesh(backG, new THREE.MeshStandardMaterial({ roughness: 0.6 }), MAXC), legs = new THREE.InstancedMesh(legG, M(0x3a3f4a, 0.5, 0.4), MAXC * 4);
  [seats, backs, legs].forEach((m) => { m.frustumCulled = false; g.add(m); });
  const OK = new THREE.Color(0x3fa7ff), BAD = new THREE.Color(0xff4a3a);
  const rd = liveSign(0.42, 3.0); rd.position.set(1.85, 0.75, -2.6); g.add(rd);
  it.words = () => ['rows', 'chairs', 'left over'];
  it.n = 12; it.r = 1; it.found = new Set();
  const mtx = new THREE.Matrix4();
  it.set = (n, r) => { it.n = n; it.r = Math.max(1, Math.min(n, Math.round(r))); const per = Math.floor(n / it.r), left = n - per * it.r; let k = 0;
    const cols = Math.max(per, left ? 1 : 0);
    for (let row = 0; row < it.r; row++) for (let c = 0; c < per; c++) place(k++, c, row, cols, it.r + (left ? 1 : 0), false);
    for (let c = 0; c < left; c++) place(k++, c, it.r, cols, it.r + 1, true);
    seats.count = backs.count = k; legs.count = k * 4; [seats, backs, legs].forEach((m) => { m.instanceMatrix.needsUpdate = true; }); seats.instanceColor.needsUpdate = true; backs.instanceColor.needsUpdate = true;
    const [rw, cw, lw] = it.words(); rd.set(left ? [`${n} = ${it.r} × ${per} + ${left}`, `${lw}: ${left}`] : [`${n} = ${it.r} × ${per}`], left ? ['#ffffff', '#ff7a6f'] : ['#8be07a']); void rw; void cw;
    if (!left) it.found.add(it.r); };
  function place(k, c, row, cols, rows, bad) { const x = (c - (cols - 1) / 2) * SP, z = Z0 - row * SP * 1.1; void rows;
    mtx.makeTranslation(x, 0, z); seats.setMatrixAt(k, mtx); backs.setMatrixAt(k, mtx); seats.setColorAt(k, bad ? BAD : OK); backs.setColorAt(k, bad ? BAD : OK);
    [[-0.13, -0.12], [0.13, -0.12], [-0.13, 0.12], [0.13, 0.12]].forEach(([dx, dz], j) => { mtx.makeTranslation(x + dx, 0.15, z + dz); legs.setMatrixAt(k * 4 + j, mtx); }); }
  it.set(12, 1);
  it.knobPath = () => [V(-0.45, 1.0, -0.42), V(0.45, 1.0, -0.42)];
  it.kOf = (r) => (r - 1) / (it.n - 1); it.rOf = (k) => 1 + Math.round(clamp01(k) * (it.n - 1));
  it.at = (k) => ({ list: V(1.85, 1.25, -2.6) }[k] || V(0, 1.2, -2.5));
  noHit(g); it.noGrab = true; it.noPhys = true; it.height = 0.6; it.radius = 3; it.base = 0; return it;
}
export function bindChairHands(cr, knob, app, s = { rows: 1 }, done = {}) {
  const sync = slideKnob(knob, { path: () => cr.knobPath(), active: () => stepNow(app, s.rows), keepVisible: () => app.runner.i <= s.rows,
    k: () => cr.kOf(cr.r), goal: () => cr.kOf(cr.r < cr.n ? cr.r + 1 : 1) /* the trigger tries one more row each time */, set: (k) => { const r = cr.rOf(k); if (r !== cr.r) cr.set(cr.n, r); const mid = [...cr.found].filter((v) => v > 1 && v < cr.n); if (mid.length >= 2) done.found && done.found(); } });
  const s0 = cr.set; cr.set = (n, r) => { s0(n, r); sync(); };
}

// ------------------------------------------------------------------ Ch 8 Playing with Constructions: a rope compass
// A peg is driven into the field with a 1.5 m rope tied to it. Walking the rope end round draws a circle in chalk. Then the
// same rope length is stepped round the circle: it fits exactly 6 times, and joining the marks gives a regular hexagon.
export function ropeCompass(o = {}) {
  const it = new Item('wrope', { ...o, name: { en: 'Rope compass', hi: 'रस्सी का परकार', hg: 'Rassi ka compass' } });
  const g = it.g, C = V(0, 0, -2.6), R = 1.5;
  const peg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.02, 0.35, 10), M(0x8a6a44, 0.8)); peg.position.copy(C).setY(0.17); g.add(peg);
  const ropeR = rod(V(), V(1, 0, 0), 0.012, M(0xe8d8a8, 0.8)); g.add(ropeR);
  const chalk = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.14, 12), glow(0xffffff)); g.add(chalk);
  const P = (deg, r = R) => C.clone().add(V(r * Math.cos(deg * Math.PI / 180), 0, -r * Math.sin(deg * Math.PI / 180)));
  const lineM = glow(0xffffff); let arc = null;
  const drawArc = (deg) => { if (arc) { g.remove(arc); arc.geometry.dispose(); } if (deg < 1) { arc = null; return; } const pts = []; const n = Math.max(2, Math.ceil(deg / 3)); for (let i = 0; i <= n; i++) pts.push(P(deg * i / n).setY(0.015)); arc = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), n * 2, 0.018, 6, false), lineM); g.add(arc); };
  const marks = [], chords = [], hex = [];
  for (let i = 0; i < 6; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 8), glow(0xffd23f)); m.position.copy(P(i * 60)).setY(0.04); m.visible = false; g.add(m); marks.push(m);
    const c = rod(P(i * 60).setY(0.04), P((i + 1) * 60).setY(0.04), 0.014, glow(0xffd23f, 0.6)); c.visible = false; g.add(c); chords.push(c);
    const h = rod(P(i * 60).setY(0.03), P((i + 1) * 60).setY(0.03), 0.025, glow(0x8be07a)); h.visible = false; g.add(h); hex.push(h); }
  const rd = liveSign(0.4, 3.0); rd.position.set(2.5, 0.6, C.z); g.add(rd);
  it.deg = 0;
  it.setDeg = (d) => { it.deg = Math.max(it.deg, Math.min(360, d)); const e = P(d).setY(0.07); setRod(ropeR, C.clone().setY(0.1), e); chalk.position.copy(P(d)).setY(0.07); drawArc(it.deg); };
  it.say = (lines, cols) => rd.set(lines, cols);
  it.step = (k) => { for (let i = 0; i < 6; i++) { marks[i].visible = i <= k; chords[i].visible = i < k; } const d = Math.min(k, 6) * 60; setRod(ropeR, C.clone().setY(0.1), P(d).setY(0.07)); chalk.position.copy(P(d)).setY(0.07); };
  it.showHex = () => { hex.forEach((h) => { h.visible = true; }); };
  it.setDeg(0); it.say(['r = 1.5 m'], '#ffffff');
  it.knobPath = () => [V(-0.45, 1.0, -0.42), V(0.45, 1.0, -0.42)];
  it.at = (k) => ({ side: P(0).add(V(0.7, 0.5, 0)) }[k] || C.clone().add(V(0, 1, 0)));
  noHit(g); it.noGrab = true; it.noPhys = true; it.height = 0.3; it.radius = 2; it.base = 0; return it;
}
export function bindRopeHands(rc, knob, app, s = { draw: 1 }, done = {}) {
  const sync = slideKnob(knob, { path: () => rc.knobPath(), active: () => stepNow(app, s.draw) && rc.deg < 360, keepVisible: () => app.runner.i <= s.draw,
    k: () => rc.deg / 360, set: (k) => { let d = clamp01(k) * 360; if (d > 352) d = 360; rc.setDeg(d); if (rc.deg >= 360) done.circle && done.circle(); } });
  const s0 = rc.setDeg; rc.setDeg = (d) => { s0(d); sync(); };
}
