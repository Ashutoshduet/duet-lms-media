// Maths lab, batch 3: a loop of string on a pegboard (same perimeter, different areas), two parallel lines and a
// transversal with a tracing of an angle, three sticks that may or may not make a triangle, a parallelogram cut and
// rearranged into a rectangle (and cut into two equal triangles), and a coordinate grid with counters.
// Flat pieces are drawn in (u, v) on the table: u to the right, v away from the student (world x = u, z = -v).
import * as THREE from 'three';
import { Item } from './apparatus.js';
import { canvasTex } from './mats.js';
import { paper, ink, flat, outline, dashed, ease, lerp, clamp01, rect, board, topLabel } from './mathlab2.js';

const D2R = Math.PI / 180;
// a flat strip of width w from p to q (a drawn line that stays visible from any distance)
function strip(p, q, w, color, y) {
  const du = q[0] - p[0], dv = q[1] - p[1], L = Math.hypot(du, dv) || 1, nu = (-dv / L) * (w / 2), nv = (du / L) * (w / 2);
  return flat([[p[0] + nu, p[1] + nv], [q[0] + nu, q[1] + nv], [q[0] - nu, q[1] - nv], [p[0] - nu, p[1] - nv]], new THREE.MeshBasicMaterial({ color }), y);
}
// a flat ring sector at the origin, from angle a0 to a1 (radians, counter-clockwise from +u)
function sector(r0, r1, a0, a1, color, opacity = 0.85) {
  const g = new THREE.RingGeometry(r0, r1, 28, 1, a0, Math.max(0.001, a1 - a0)); g.rotateX(-Math.PI / 2);
  return new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color, transparent: opacity < 1, opacity, side: THREE.DoubleSide, depthWrite: false }));
}
const at3 = (it, Y) => (u, v, up = 0.02) => it.g.localToWorld(new THREE.Vector3(u, Y + up, -v));

// ------------------------------------------------------------------ a loop of string 24 cm long round the pegs of a pegboard
export function perimeterLoop(o = {}) {
  const it = new Item('mperim', { ...o, name: o.name || { en: 'Pegboard and a loop of string 24 cm long', hi: 'खूँटियों वाला बोर्ड और 24 cm लंबा धागे का फंदा', hg: 'Pegboard aur 24 cm lambi dhaage ki loop' } });
  const s = 0.016, NX = 12, NY = 7, O = [-0.105, -0.07], Y = 0.003; // one square of the board = 1 cm
  it.g.add(board(-0.2, -0.11, 0.21, 0.12, '#b98a5a'));
  it.g.add(flat(rect(O[0] - 0.012, O[1] - 0.012, O[0] + NX * s + 0.012, O[1] + NY * s + 0.012), paper(0xf1ead8), Y));
  // faint grid lines and pegs every 1 cm
  const grid = new THREE.Group();
  for (let i = 0; i <= NX; i++) grid.add(outline([[O[0] + i * s, O[1]], [O[0] + i * s, O[1] + NY * s]], ink(0xc9bfa8), Y + 0.0004, false));
  for (let j = 0; j <= NY; j++) grid.add(outline([[O[0], O[1] + j * s], [O[0] + NX * s, O[1] + j * s]], ink(0xc9bfa8), Y + 0.0004, false));
  it.g.add(grid);
  const peg = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.0012, 0.0012, 0.006, 8), new THREE.MeshStandardMaterial({ color: 0xc8ccd2, metalness: 0.5, roughness: 0.4 }), (NX + 1) * (NY + 1));
  { const m = new THREE.Matrix4(); let n = 0; for (let i = 0; i <= NX; i++) for (let j = 0; j <= NY; j++) { m.makeTranslation(O[0] + i * s, Y + 0.003, -(O[1] + j * s)); peg.setMatrixAt(n++, m); } }
  it.g.add(peg);
  // the unit squares inside the loop (one tile of the texture = 1 square cm)
  const cell = canvasTex(64, 64, (x, W, H) => { x.fillStyle = '#9fd0f2'; x.fillRect(0, 0, W, H); x.strokeStyle = '#2f6fa6'; x.lineWidth = 3; x.strokeRect(1.5, 1.5, W - 3, H - 3); });
  cell.wrapS = cell.wrapT = THREE.RepeatWrapping;
  const fill = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshStandardMaterial({ map: cell, roughness: 0.9, transparent: true, opacity: 0.92, depthWrite: false }));
  fill.rotation.x = -Math.PI / 2; fill.position.y = Y + 0.0012; fill.visible = false; it.g.add(fill);
  // the string: four thin red bars round the pegs
  const sm = new THREE.MeshStandardMaterial({ color: 0xd8342c, roughness: 0.6 });
  const bars = [0, 1, 2, 3].map(() => { const m = new THREE.Mesh(new THREE.BoxGeometry(1, 0.003, 0.0032), sm); m.position.y = Y + 0.004; it.g.add(m); return m; });
  it.w = 11; it.h = 1;
  const draw = () => {
    const w = it.w * s, h = it.h * s, u0 = O[0], v0 = O[1];
    const set = (m, cu, cv, len, alongU) => { m.position.x = cu; m.position.z = -cv; m.scale.x = len + 0.003; m.rotation.y = alongU ? 0 : Math.PI / 2; };
    set(bars[0], u0 + w / 2, v0, w, true); set(bars[1], u0 + w / 2, v0 + h, w, true); set(bars[2], u0, v0 + h / 2, h, false); set(bars[3], u0 + w, v0 + h / 2, h, false);
    fill.scale.set(w, h, 1); fill.position.x = u0 + w / 2; fill.position.z = -(v0 + h / 2); cell.repeat.set(it.w, it.h);
  };
  draw();
  it.string = (on) => bars.forEach((b) => (b.visible = on)); it.string(false);
  it.squares = (on) => { fill.visible = on; };
  it.shape = (w, h) => { it.w = w; it.h = h; draw(); };
  // stretch the loop: the two sides always add up to 12 cm, so the perimeter stays 24 cm
  it.morph = (h0, h1, k) => { const h = lerp(h0, h1, ease(clamp01(k))); it.shape(12 - h, h); };
  const W = at3(it, Y);
  it.at = (k) => k === 'shape' ? W(O[0] + (it.w * s) / 2, O[1] + (it.h * s) / 2, 0.012) : k === 'right' ? W(O[0] + it.w * s + 0.01, O[1] + (it.h * s) / 2) : k === 'top' ? W(O[0] + (it.w * s) / 2, O[1] + it.h * s + 0.012) : W(0, 0);
  it.noGrab = true; it.height = 0.012; it.radius = 0.21; it.grabY = 0.005; return it;
}

// ------------------------------------------------------------------ two parallel lines, a transversal and tracing paper
export function parallelLines(o = {}) {
  const it = new Item('mparallel', { ...o, name: o.name || { en: 'Parallel lines, a transversal and tracing paper', hi: 'समांतर रेखाएँ, एक तिर्यक रेखा और ट्रेसिंग पेपर', hg: 'Parallel lines, ek transversal aur tracing paper' } });
  const Y = 0.003, vL = 0.055, vM = -0.045, T = 60 * D2R, C = [-0.03, 0.005], DIR = [Math.cos(T), Math.sin(T)];
  const onT = (v) => [C[0] + ((v - C[1]) / DIR[1]) * DIR[0], v];
  const P1 = onT(vL), P2 = onT(vM), M = [(P1[0] + P2[0]) / 2, (P1[1] + P2[1]) / 2];
  it.g.add(board(-0.21, -0.11, 0.21, 0.12, '#b98a5a'));
  it.g.add(flat(rect(-0.19, -0.097, 0.19, 0.102), paper(0xfbf9f3), Y));
  const INK = 0x26303a, LW = 0.0018;
  // line l (top) and the transversal t, drawn on the paper
  it.g.add(strip([-0.175, vL], [0.175, vL], LW, INK, Y + 0.0004));
  const t0 = [C[0] - 0.112 * DIR[0], C[1] - 0.112 * DIR[1]], t1 = [C[0] + 0.105 * DIR[0], C[1] + 0.105 * DIR[1]];
  it.g.add(strip(t0, t1, LW, INK, Y + 0.0004));
  // arrow marks show l and m are parallel
  const chev = (u, v) => outline([[u - 0.004, v - 0.0045], [u + 0.003, v], [u - 0.004, v + 0.0045]], ink(INK), 0, false);
  { const c = chev(0.13, vL); c.position.y = Y + 0.0006; it.g.add(c); }
  // line m (bottom) turns about its crossing P2 in the last step, so it is drawn in a group there
  it.mG = new THREE.Group(); it.mG.position.set(P2[0], Y + 0.0004, -P2[1]); it.g.add(it.mG);
  it.mG.add(strip([-0.175 - P2[0], 0], [0.175 - P2[0], 0], LW, INK, 0));
  it.mChev = chev(0.13 - P2[0], 0); it.mChev.position.y = 0.0002; it.mG.add(it.mChev);
  // angle a (top crossing, between l to the right and t going up) and angle b (the same corner at the bottom crossing)
  const R0 = 0.011, R1 = 0.019;
  const arcA = sector(R0, R1, 0, T, 0xf0a33a); arcA.position.set(P1[0], Y + 0.0009, -P1[1]); it.g.add(arcA);
  const arcB = sector(R0, R1, 0, T, 0x3f8fd8); arcB.position.set(P2[0], Y + 0.0009, -P2[1]); it.g.add(arcB);
  const arcC = sector(R0, R1, Math.PI, Math.PI + T, 0x55b36a); arcC.position.set(P1[0], Y + 0.0009, -P1[1]); arcC.visible = false; it.g.add(arcC);
  it.showC = (on) => { arcC.visible = on; };
  // tracing paper with angle a copied on it (origin at the vertex)
  const tr = new THREE.Group(); tr.visible = false; it.g.add(tr);
  { const sh = flat(rect(-0.014, -0.014, 0.036, 0.036), new THREE.MeshStandardMaterial({ color: 0xdff1ff, transparent: true, opacity: 0.45, roughness: 0.4, side: THREE.DoubleSide, depthWrite: false }), 0);
    tr.add(sh); tr.add(outline(rect(-0.014, -0.014, 0.036, 0.036), ink(0x7fa6c4), 0.0002));
    tr.add(strip([0, 0], [0.033, 0], 0.0013, 0xc0392b, 0.0004)); tr.add(strip([0, 0], [0.033 * Math.cos(T), 0.033 * Math.sin(T)], 0.0013, 0xc0392b, 0.0004));
    const a = sector(R0 + 0.002, R0 + 0.004, 0, T, 0xc0392b, 1); a.position.y = 0.0005; tr.add(a); }
  const trAt = (u, v, lift, rot) => { tr.position.set(u, Y + 0.0018 + lift, -v); tr.rotation.y = rot; };
  trAt(P1[0], P1[1], 0, 0);
  it.trace = (k) => { tr.visible = k > 0; tr.children[0].material.opacity = 0.45 * ease(clamp01(k)); };
  // slide the tracing down the transversal, from the top crossing to the bottom one
  it.slide = (k) => { const e = ease(clamp01(k)); trAt(lerp(P1[0], P2[0], e), lerp(P1[1], P2[1], e), Math.sin(Math.PI * e) * 0.02, 0); };
  // turn it half a turn about the middle point of the transversal between the lines: it lands on the top crossing
  it.turn = (k) => { const e = ease(clamp01(k)), f = Math.PI * e, du = P2[0] - M[0], dv = P2[1] - M[1];
    trAt(M[0] + du * Math.cos(f) - dv * Math.sin(f), M[1] + du * Math.sin(f) + dv * Math.cos(f), Math.sin(Math.PI * e) * 0.02, f); };
  // turn line m a little: the lines are no longer parallel and angle b changes
  it.tiltDeg = 0;
  it.tilt = (deg, k) => { const a = deg * D2R * ease(clamp01(k)); it.tiltDeg = a / D2R; it.mG.rotation.y = a; it.mChev.visible = false;
    arcB.geometry.dispose(); const g = new THREE.RingGeometry(R0, R1, 28, 1, a, T - a); g.rotateX(-Math.PI / 2); arcB.geometry = g; };
  const W = at3(it, Y);
  const lab = { a: [P1[0] + 0.026, P1[1] + 0.012], b: [P2[0] + 0.026, P2[1] + 0.012], c: [P1[0] - 0.03, P1[1] - 0.014], l: [0.17, vL + 0.01], m: [0.17, vM + 0.01], t: [t1[0], t1[1]], mid: [M[0] + 0.05, M[1]] };
  it.at = (k) => W(lab[k][0], lab[k][1]);
  it.noGrab = true; it.height = 0.01; it.radius = 0.21; it.grabY = 0.005; return it;
}

// ------------------------------------------------------------------ three sticks: do they make a triangle?
export function triangleSticks(o = {}) {
  const it = new Item('msticks', { ...o, name: o.name || { en: 'Sticks of different lengths', hi: 'अलग-अलग लंबाई की तीलियाँ', hg: 'Alag-alag lambai ki sticks' } });
  const s = 0.021, Y = 0.003, A = [-0.084, -0.06], WD = 0.007; // sticks a and b stand on the top edge of the base stick
  it.g.add(board(-0.2, -0.1, 0.2, 0.11, '#b98a5a'));
  it.g.add(flat(rect(-0.18, -0.095, 0.18, 0.1), paper(0xfbf9f3), Y));
  const mk = (color) => {
    const g = new THREE.Group(); const geo = new THREE.BoxGeometry(1, 0.005, WD); geo.translate(0.5, 0, 0);
    const bar = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color, roughness: 0.55 })); bar.position.y = 0.0025; g.add(bar);
    const end = new THREE.Mesh(new THREE.CylinderGeometry(0.0036, 0.0036, 0.006, 14), new THREE.MeshStandardMaterial({ color: 0x2b2b2b, roughness: 0.5 })); end.position.y = 0.003; g.add(end);
    g.userData = { bar, label: null, len: 0 }; it.g.add(g); return g;
  };
  const sticks = [mk(0xf0a33a), mk(0x55b36a), mk(0x3f8fd8)]; // a (from A), b (from B), c (the base)
  const setLen = (g, cm, flip) => {
    g.userData.len = cm; g.userData.bar.scale.x = cm * s;
    if (g.userData.label) { g.remove(g.userData.label); g.userData.label.material.map.dispose(); g.userData.label.geometry.dispose(); }
    const lb = topLabel(`${cm} cm`, 0.05, 0.017, '#26303a'); lb.position.set((cm * s) / 2, 0.006, flip ? 0.014 : -0.014); g.add(lb); g.userData.label = lb;
  };
  it.lens = [4, 5, 7]; it.angA = 90; it.angB = 90;
  const place = () => {
    const [a, b, c] = it.lens, B = [A[0] + c * s, A[1]];
    sticks[2].position.set(A[0], Y + 0.0004, -A[1]); sticks[2].rotation.y = 0;
    sticks[0].position.set(A[0], Y + 0.0006, -(A[1] + WD)); sticks[0].rotation.y = it.angA * D2R;
    sticks[1].position.set(B[0], Y + 0.0006, -(B[1] + WD)); sticks[1].rotation.y = (180 - it.angB) * D2R;
    // labels stay upright on the table
    for (const g of sticks) if (g.userData.label) g.userData.label.rotation.z = -g.rotation.y;
  };
  it.setLens = (L) => { it.lens = L; setLen(sticks[0], L[0]); setLen(sticks[1], L[1], true); setLen(sticks[2], L[2], true); place(); }; // b points left: its label goes on the other side, above it
  it.setLens([4, 5, 7]);
  // the angles at A and B where the two sticks meet (null: they cannot meet)
  it.solve = () => { const [a, b, c] = it.lens; if (a + b <= c) return null; return [Math.acos((a * a + c * c - b * b) / (2 * a * c)) / D2R, Math.acos((b * b + c * c - a * a) / (2 * b * c)) / D2R]; };
  // turn the two sticks from standing up (90°) towards each other until they meet, or until they lie flat on the base
  it.close = (k) => { const t = it.solve() || [0, 0], e = ease(clamp01(k)); it.angA = lerp(90, t[0], e); it.angB = lerp(90, t[1], e); place(); };
  it.open = (k) => { const t = it.solve() || [0, 0], e = ease(clamp01(k)); it.angA = lerp(t[0], 90, e); it.angB = lerp(t[1], 90, e); place(); };
  const W = at3(it, Y);
  it.at = (k) => { const [a, b, c] = it.lens;
    if (k === 'apex') { const t = it.solve(); if (t) return W(A[0] + a * s * Math.cos(t[0] * D2R), A[1] + WD + a * s * Math.sin(t[0] * D2R) + 0.012); }
    if (k === 'gap') return W(A[0] + ((a + (c - b)) / 2) * s, A[1] + WD + 0.014);
    if (k === 'base') return W(A[0] + (c * s) / 2, A[1] - 0.028);
    return W(A[0] + (c * s) / 2, A[1] + 0.05); };
  it.noGrab = true; it.height = 0.01; it.radius = 0.2; it.grabY = 0.005; return it;
}

// ------------------------------------------------------------------ parallelograms: one cut along its height into a rectangle, one cut along a diagonal
export function parallelogramCut(o = {}) {
  const it = new Item('mpgram', { ...o, name: o.name || { en: 'Two paper parallelograms (base 10 cm, height 6 cm)', hi: 'काग़ज़ के दो समांतर चतुर्भुज (आधार 10 cm, ऊँचाई 6 cm)', hg: 'Kaagaz ke do parallelogram (base 10 cm, height 6 cm)' } });
  const b = 0.1, h = 0.06, d = 0.03, Y = 0.003, U1 = -0.185, U2 = 0.035, V0 = -0.045;
  it.g.add(board(-0.21, -0.1, 0.21, 0.11, '#b98a5a'));
  const piece = (pts, c, cu, cv, lift = 0) => { const g = new THREE.Group(); const loc = pts.map(([u, v]) => [u - cu, v - cv]);
    g.add(flat(loc, paper(c), 0.0006)); g.add(outline(loc, ink(0x3a3a3a), 0.0009)); g.position.set(cu, Y + lift, -cv); g.userData.home = [cu, cv]; it.g.add(g); return g; };
  // first parallelogram: a right triangle cut off along the height, and the rest
  const A = [U1, V0], B = [U1 + b, V0], Cc = [U1 + b + d, V0 + h], Dd = [U1 + d, V0 + h], F = [U1 + d, V0];
  it.rest = piece([F, B, Cc, Dd], 0xf0a33a, U1 + d + b / 2, V0 + h / 2);
  it.tri = piece([A, F, Dd], 0xf6c27a, U1 + (2 * d) / 3, V0 + h / 3, 0.0002);
  it.hline = dashed([[Dd[0], Dd[1]], [F[0], F[1]]], 0xc0392b, Y + 0.0014, 0.003); it.g.add(it.hline);
  it.g.add(outline([[F[0], F[1] + 0.006], [F[0] + 0.006, F[1] + 0.006], [F[0] + 0.006, F[1]]], ink(0xc0392b), Y + 0.0014, false));
  // second parallelogram: two triangles along the diagonal A2–C2; the top one turns half round about the diagonal's middle
  const A2 = [U2, V0], B2 = [U2 + b, V0], C2 = [U2 + b + d, V0 + h], D2 = [U2 + d, V0 + h], M2 = [(A2[0] + C2[0]) / 2, (A2[1] + C2[1]) / 2];
  it.t1 = piece([A2, B2, C2], 0x55b36a, M2[0], M2[1]);
  it.t2 = piece([A2, C2, D2], 0x5aa0e0, M2[0], M2[1], 0.0003);
  it.diag = dashed([A2, C2], 0xc0392b, Y + 0.0016, 0.003); it.diag.visible = false; it.g.add(it.diag);
  it.cut = (k) => { const e = ease(clamp01(k)), hh = it.tri.userData.home; it.tri.position.set(hh[0] - 0.012 * e, Y + 0.0002 + Math.sin(Math.PI * e) * 0.01, -hh[1]); };
  it.slide = (k) => { const e = ease(clamp01(k)), hh = it.tri.userData.home; it.tri.position.set(lerp(hh[0] - 0.012, hh[0] + b, e), Y + 0.0002 + Math.sin(Math.PI * e) * 0.035, -hh[1]); };
  it.turn = (k) => { const e = ease(clamp01(k)); it.t2.rotation.y = Math.PI * e; it.t2.position.y = Y + 0.0012 + Math.sin(Math.PI * e) * 0.035; };
  const W = at3(it, Y);
  const AT = { base1: [U1 + b / 2, V0 - 0.012], h1: [F[0] - 0.012, V0 + h / 2], rect: [U1 + d + b / 2, V0 + h / 2], base2: [U2 + b / 2, V0 - 0.012], tri: [M2[0], M2[1]], top: [U1 + d + b / 2, V0 + h + 0.015] };
  it.at = (k) => W(AT[k][0], AT[k][1]);
  it.noGrab = true; it.height = 0.01; it.radius = 0.21; it.grabY = 0.005; return it;
}

// ------------------------------------------------------------------ a coordinate grid from −5 to 5 with counters
export function coordGrid(o = {}) {
  const it = new Item('mcoord', { ...o, name: o.name || { en: 'Coordinate grid and counters', hi: 'निर्देशांक ग्रिड और गोटियाँ', hg: 'Coordinate grid aur counters' } });
  const G = 0.022, Y = 0.003, N = 5, SIDE = (2 * N + 1.4) * G;
  it.g.add(board(-0.2, -0.14, 0.2, 0.14, '#b98a5a'));
  const tex = canvasTex(1024, 1024, (x, Wp, Hp) => {
    const u = Wp / (2 * N + 1.4), c = Wp / 2, P = (k) => c + k * u;
    x.fillStyle = '#fbf9f3'; x.fillRect(0, 0, Wp, Hp);
    x.strokeStyle = '#c9d6e2'; x.lineWidth = 2;
    for (let k = -N; k <= N; k++) { x.beginPath(); x.moveTo(P(k), P(-N)); x.lineTo(P(k), P(N)); x.stroke(); x.beginPath(); x.moveTo(P(-N), P(k)); x.lineTo(P(N), P(k)); x.stroke(); }
    x.strokeStyle = '#26303a'; x.fillStyle = '#26303a'; x.lineWidth = 5;
    x.beginPath(); x.moveTo(P(-N - 0.5), c); x.lineTo(P(N + 0.5), c); x.stroke(); x.beginPath(); x.moveTo(c, P(-N - 0.5)); x.lineTo(c, P(N + 0.5)); x.stroke();
    const arrow = (ax, ay, dx, dy) => { x.beginPath(); x.moveTo(ax + dx * 18, ay + dy * 18); x.lineTo(ax - dy * 10, ay + dx * 10); x.lineTo(ax + dy * 10, ay - dx * 10); x.closePath(); x.fill(); };
    arrow(P(N + 0.5), c, 1, 0); arrow(P(-N - 0.5), c, -1, 0); arrow(c, P(-N - 0.5), 0, -1); arrow(c, P(N + 0.5), 0, 1);
    x.font = '600 28px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'top';
    for (let k = -N; k <= N; k++) if (k) { x.fillText(String(k).replace('-', '−'), P(k), c + 10); }
    x.textAlign = 'right'; x.textBaseline = 'middle';
    for (let k = -N; k <= N; k++) if (k) { x.fillText(String(k).replace('-', '−'), c - 10, P(-k)); }
    x.font = 'italic 700 40px serif'; x.textAlign = 'left'; x.fillText('x', P(N + 0.25), c - 30); x.fillText('y', c + 14, P(-N - 0.35));
    x.font = '700 30px sans-serif'; x.textAlign = 'right'; x.textBaseline = 'top'; x.fillText('O', c - 8, c + 8);
  });
  const sheet = new THREE.Mesh(new THREE.PlaneGeometry(SIDE, SIDE), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 }));
  sheet.rotation.x = -Math.PI / 2; sheet.position.y = Y; it.g.add(sheet);
  // quadrant names with their signs, shown in the last step
  it.quads = [[3.4, 0.95, 'I  (+, +)'], [-3.4, 0.95, 'II  (−, +)'], [-3.4, -0.95, 'III  (−, −)'], [3.4, -0.95, 'IV  (+, −)']].map(([qx, qy, t]) => {
    const m = topLabel(t, 0.075, 0.018, '#7a2d8c'); m.position.set(qx * G, Y + 0.0012, -qy * G); m.visible = false; it.g.add(m); return m; });
  // counters and the dashed paths from O
  const cols = [0xe0573e, 0x3f8fd8, 0x55b36a, 0xf0a33a];
  it.pts = [['A', 3, 2], ['B', -2, 4], ['C', -4, -3], ['D', 2, -3]].map(([n, px, py], i) => {
    const g = new THREE.Group(); g.visible = false; it.g.add(g);
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.0065, 0.0065, 0.004, 24), new THREE.MeshStandardMaterial({ color: cols[i], roughness: 0.45 })); disc.position.y = 0.002; g.add(disc);
    const lb = topLabel(n, 0.018, 0.018, '#26303a'); lb.position.set(0.012, 0.0006, -0.011); g.add(lb);
    const path = new THREE.Group(); path.add(dashed([[0, 0], [px * G, 0]], cols[i], Y + 0.0009, 0.0025)); path.add(dashed([[px * G, 0], [px * G, py * G]], cols[i], Y + 0.0009, 0.0025)); path.visible = false; it.g.add(path);
    return { g, path, x: px, y: py };
  });
  // counter i walks from O along the x-axis, then up or down to its point (k: 0 → 1)
  it.place = (i, k) => { const p = it.pts[i], e = clamp01(k); p.g.visible = true; p.path.visible = e > 0.98;
    const a = ease(clamp01(e * 2)), b = ease(clamp01(e * 2 - 1)); p.g.position.set(p.x * G * a, Y + 0.0006 + Math.sin(Math.PI * e) * 0.012, -(p.y * G * b)); };
  it.showQuads = (on) => it.quads.forEach((m) => (m.visible = on));
  const W = at3(it, Y);
  it.at = (k) => { if (k === 'O') return W(0, 0); const p = it.pts.find((_, i) => 'ABCD'[i] === k); return p ? W(p.x * G, p.y * G) : W(0, 0); };
  it.noGrab = true; it.height = 0.01; it.radius = 0.2; it.grabY = 0.005; return it;
}
