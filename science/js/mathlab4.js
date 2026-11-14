// Maths lab, batch 4: balls arranged in triangles (triangular numbers, two triangles make a rectangle, two neighbours
// make a square), and a paper circle folded so the ends of a chord meet (the perpendicular from the centre bisects
// the chord, and two such creases cross at the centre).
// Flat pieces are drawn in (u, v) on the table: u to the right, v away from the student (world x = u, z = -v).
import * as THREE from 'three';
import { Item } from './apparatus.js';
import { paper, ink, flat, outline, dashed, ease, lerp, clamp01, rect, board, topLabel } from './mathlab2.js';

const at3 = (it, Y) => (u, v, up = 0.02) => it.g.localToWorld(new THREE.Vector3(u, Y + up, -v));
// a flat strip of width w from p to q (a drawn line that stays visible from any distance)
function strip(p, q, w, color, y) {
  const du = q[0] - p[0], dv = q[1] - p[1], L = Math.hypot(du, dv) || 1, nu = (-dv / L) * (w / 2), nv = (du / L) * (w / 2);
  return flat([[p[0] + nu, p[1] + nv], [q[0] + nu, q[1] + nv], [q[0] - nu, q[1] - nv], [p[0] - nu, p[1] - nv]], new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide }), y);
}

// ------------------------------------------------------------------ balls in triangles: 1, 3, 6, 10
export function triangleBalls(o = {}) {
  const it = new Item('mtriballs', { ...o, name: o.name || { en: 'Balls for triangular numbers', hi: 'त्रिकोणीय संख्याओं के लिए गेंदें', hg: 'Triangular numbers ke liye balls' } });
  const s = 0.024, R = 0.0105, Y = 0.003, N = 4;
  const U0 = -0.05, V0 = 0.038; // the top-left place (row 0, column 0); rows come towards the student
  it.g.add(board(-0.2, -0.1, 0.2, 0.11, '#b98a5a'));
  it.g.add(flat(rect(-0.185, -0.088, 0.185, 0.098), paper(0x2f5d50), Y)); // a green cloth to keep the balls still
  const geo = new THREE.SphereGeometry(R, 20, 14);
  const mk = (n, color) => Array.from({ length: n }, () => { const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color, roughness: 0.35, metalness: 0.05 })); m.visible = false; it.g.add(m); return m; });
  const yel = mk(10, 0xf2b632), blue = mk(10, 0x3f8fd8), green = mk(6, 0x55b36a);
  const put = (m, u, v, lift = 0) => m.position.set(u, Y + R + lift, -v);
  // the yellow triangle: row r has r + 1 balls; tilt 1 = centred rows (a triangle), 0 = rows pushed to the left (a staircase)
  const yIdx = []; for (let r = 0; r < N; r++) for (let j = 0; j <= r; j++) yIdx.push([r, j]);
  it.tilt = 1; it.rows = 0;
  const yPos = (r, j, t = it.tilt) => [U0 + (j + t * ((N - 1) / 2 - r / 2)) * s, V0 - r * s * lerp(1, 0.87, t)];
  const drawY = () => yIdx.forEach(([r, j], i) => { const m = yel[i]; m.visible = r < it.rows; const [u, v] = yPos(r, j); put(m, u, v); });
  // rows appear one by one (k: 0 → 1 drops row n − 1 in from above)
  it.showRows = (n, k = 1) => { it.rows = n; drawY(); const e = ease(clamp01(k)); yIdx.forEach(([r], i) => { if (r === n - 1) yel[i].position.y += (1 - e) * 0.05; }); };
  it.push = (k) => { it.tilt = 1 - ease(clamp01(k)); drawY(); };
  // a copy turned half round fills the rest of a rectangle (blue: 4 rows × 5) or of a square (green: 4 × 4)
  const bT = []; for (let r = 0; r < N; r++) for (let j = r + 1; j <= N; j++) bT.push([U0 + j * s, V0 - r * s]);
  const gT = []; for (let r = 0; r < N; r++) for (let j = r + 1; j < N; j++) gT.push([U0 + j * s, V0 - r * s]);
  const bring = (balls, T, C, k, from) => { const e = ease(clamp01(k)), a = Math.PI * (1 - e);
    balls.forEach((m, i) => { m.visible = k > 0; const du = T[i][0] - C[0], dv = T[i][1] - C[1];
      put(m, C[0] + du * Math.cos(a) - dv * Math.sin(a) + from * (1 - e), C[1] + du * Math.sin(a) + dv * Math.cos(a), Math.sin(Math.PI * e) * 0.03); }); };
  const rectC = [U0 + (N / 2) * s, V0 - ((N - 1) / 2) * s], sqC = [U0 + ((N - 1) / 2) * s, V0 - ((N - 1) / 2) * s];
  it.bringBlue = (k) => bring(blue, bT, rectC, k, 0.1);
  it.bringGreen = (k) => bring(green, gT, sqC, k, 0.1);
  it.hideBlue = (k) => { const e = ease(clamp01(k)); blue.forEach((m, i) => { m.visible = e < 1; put(m, bT[i][0] + e * 0.2, bT[i][1], Math.sin(Math.PI * e) * 0.02); }); };
  // a frame drawn round the rectangle or the square
  const frame = (w, h) => { const g = outline(rect(U0 - s / 2 - 0.003, V0 - (N - 0.5) * s - 0.003, U0 + (w - 0.5) * s + 0.003, V0 + s / 2 + 0.003), ink(0xffffff), Y + 0.0006); g.visible = false; it.g.add(g); return g; };
  it.rectFrame = frame(N + 1, N); it.sqFrame = frame(N, N);
  // labels on the cloth: the number of balls in each row, and the size of the rectangle or square
  it.rowLabels = Array.from({ length: N }, (_, r) => { const m = topLabel(String(r + 1), 0.03, 0.02, '#ffe7a3', Y + 0.0006); m.position.x = U0 - s - 0.012; m.position.z = -(V0 - r * s); m.visible = false; it.g.add(m); return m; });
  it.showRowLabels = (on) => it.rowLabels.forEach((m, r) => { m.visible = on && r < it.rows; });
  const W = at3(it, Y);
  it.at = (k) => { const n = Math.max(1, it.rows);
    if (k === 'apex') return W(yPos(0, 0)[0], V0 + 0.012, 0.03);
    if (k === 'tri') return W(yPos(n - 1, n - 1)[0] + 0.03, V0 - (n - 1) * s * 0.9, 0.025);
    if (k === 'rect') return W(U0 + (N + 0.6) * s, V0 - 0.5 * s, 0.025);
    if (k === 'sq') return W(U0 + (N - 0.4) * s, V0 - 0.5 * s, 0.025);
    if (k === 'below') return W(U0 + (N / 2) * s, V0 - N * s, 0.02);
    return W(0, 0); };
  it.noGrab = true; it.height = 0.02; it.radius = 0.2; it.grabY = 0.008; return it;
}

// ------------------------------------------------------------------ a paper circle folded so the two ends of a chord meet
export function chordFold(o = {}) {
  const it = new Item('mchord', { ...o, name: o.name || { en: 'A paper circle (radius 5 cm), ruler and pencil', hi: 'काग़ज़ का वृत्त (त्रिज्या 5 cm), रूलर और पेंसिल', hg: 'Kaagaz ka circle (radius 5 cm), ruler aur pencil' } });
  const s = 0.0135, Rr = 5 * s, Y = 0.003, O = [-0.005, -0.012];
  it.g.add(board(-0.2, -0.1, 0.2, 0.11, '#b98a5a'));
  // the drawing is turned by 20° so that no fold is seen edge-on from the front
  const cb = Math.cos(20 * Math.PI / 180), sb = Math.sin(20 * Math.PI / 180), rot = (x, y) => [x * cb - y * sb, x * sb + y * cb];
  const P = (x, y) => { const r = rot(x * s, y * s); return [O[0] + r[0], O[1] + r[1]]; }; // a point x cm across and y cm up from the centre (before the turn)
  const Q = (p, x, y) => { const r = rot(x, y); return [p[0] + r[0], p[1] + r[1]]; }; // p moved by (x, y) metres in the turned drawing
  // chord AB: 8 cm long, 3 cm below the centre; chord CD: 6 cm long, 4 cm from the centre, up and to the right
  const A = P(-4, -3), B = P(4, -3), M = P(0, -3);
  const a2 = 50 * Math.PI / 180, nn = [Math.cos(a2), Math.sin(a2)], tt = [-Math.sin(a2), Math.cos(a2)];
  const C = P(4 * nn[0] + 3 * tt[0], 4 * nn[1] + 3 * tt[1]), D = P(4 * nn[0] - 3 * tt[0], 4 * nn[1] - 3 * tt[1]), Nm = P(4 * nn[0], 4 * nn[1]);
  const RED = 0xc0392b, BLUE = 0x2f6fa6, PEN = 0x26303a, LW = 0.0016;
  // what is drawn on the paper, in board (u, v): kind, points, colour; shown or not
  const marks = {
    O: { dot: O, txt: 'O', c: PEN, on: true },
    AB: { seg: [A, B], c: RED, on: false }, A: { dot: A, txt: 'A', c: RED, on: false, off: [-0.008, -0.006] }, B: { dot: B, txt: 'B', c: RED, on: false, off: [0.008, -0.006] },
    crease1: { seg: [P(0, -5), P(0, 5)], c: PEN, dash: true, on: false }, M: { dot: M, txt: 'M', c: PEN, on: false, off: [0.007, 0.007] },
    CD: { seg: [C, D], c: BLUE, on: false }, C: { dot: C, txt: 'C', c: BLUE, on: false, off: [0.004, 0.009] }, D: { dot: D, txt: 'D', c: BLUE, on: false, off: [0.009, 0.002] },
    crease2: { seg: [P(-5 * nn[0], -5 * nn[1]), P(5 * nn[0], 5 * nn[1])], c: PEN, dash: true, on: false }, N: { dot: Nm, txt: 'N', c: PEN, on: false, off: [-0.008, 0.004] },
    OM: { seg: [O, M], c: 0x7a2d8c, on: false },
  };
  // a half-plane: points p with (p − O)·n ≥ 0 (null: the whole circle)
  const side = (p, n) => (p[0] - O[0]) * n[0] + (p[1] - O[1]) * n[1];
  const clip = (p, q, n) => { const a = side(p, n), b = side(q, n); if (a < -1e-9 && b < -1e-9) return null; if (a >= -1e-9 && b >= -1e-9) return [p, q];
    const t = a / (a - b), x = [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]; return a >= 0 ? [p, x] : [x, q]; };
  // one layer of paper with its marks: the whole disc, or the half on the side n of a line through O
  // (to = a function that maps board (u, v) into the layer's own (u, v); marks are drawn on both faces; turn keeps the letters upright)
  const layer = (n, to = (p) => p, color = 0xfbf9f3, turn = 0) => {
    const g = new THREE.Group(), seg = 64, pts = [];
    if (!n) for (let i = 0; i < seg; i++) { const a = (i / seg) * 2 * Math.PI; pts.push([O[0] + Rr * Math.cos(a), O[1] + Rr * Math.sin(a)]); }
    else { const a0 = Math.atan2(n[1], n[0]) - Math.PI / 2; for (let i = 0; i <= seg / 2; i++) { const a = a0 + (i / (seg / 2)) * Math.PI; pts.push([O[0] + Rr * Math.cos(a), O[1] + Rr * Math.sin(a)]); } }
    const loc = pts.map(to);
    g.add(flat(loc, paper(color), 0)); g.add(outline(loc, ink(0x8a7f68), 0.0003, true));
    for (const k in marks) { const m = marks[k]; if (!m.on) continue;
      if (m.seg) { const c = n ? clip(m.seg[0], m.seg[1], n) : m.seg; if (!c) continue; const p = to(c[0]), q = to(c[1]);
        for (const y of [0.0005, -0.0005]) g.add(m.dash ? dashed([p, q], m.c, y, 0.003) : strip(p, q, LW, m.c, y)); }
      if (m.dot && (!n || side(m.dot, n) >= -1e-6)) { const p = to(m.dot);
        for (const y of [0.0007, -0.0007]) { const d = new THREE.Mesh(new THREE.CircleGeometry(0.0022, 14), new THREE.MeshBasicMaterial({ color: m.c, side: THREE.DoubleSide })); d.rotation.x = -Math.PI / 2; d.position.set(p[0], y, -p[1]); g.add(d); }
        if (m.txt) { const off = m.off || [0.008, 0.006], lb = topLabel(m.txt, 0.026, 0.026, '#26303a', 0.0008); const q = to([m.dot[0] + off[0], m.dot[1] + off[1]]); lb.position.x = q[0]; lb.position.z = -q[1]; lb.rotation.z = -turn; g.add(lb); } } }
    return g; };
  const holder = new THREE.Group(); holder.position.y = Y; it.g.add(holder);
  const clear = () => { while (holder.children.length) { const c = holder.children.pop(); c.traverse((x) => { x.geometry?.dispose?.(); if (x.material) { x.material.map?.dispose?.(); x.material.dispose?.(); } }); } };
  // the flat circle with every mark that is on
  it.redraw = () => { clear(); holder.add(layer(null)); it.fold = null; };
  // fold about the line through O along d (unit): the half on the side n turns over onto the other half
  const makeFold = (d, n) => { clear(); holder.add(layer([-n[0], -n[1]]));
    const piv = new THREE.Group(), ang = Math.atan2(d[1], d[0]); piv.position.set(O[0], 0.0008, -O[1]); piv.rotation.y = ang; holder.add(piv);
    const flap = new THREE.Group(); piv.add(flap);
    // board (u, v) → the pivot's own (u, v): move O to 0 and turn so d lies along +u (the fold axis is the pivot's x axis)
    const to = (p) => { const x = p[0] - O[0], y = p[1] - O[1]; return [x * Math.cos(ang) + y * Math.sin(ang), -x * Math.sin(ang) + y * Math.cos(ang)]; };
    flap.add(layer(n, to, 0xf7dcae, ang)); it.fold = flap; }; // the back of the paper is shown a little darker, so the fold can be seen
  it.foldAB = (k) => { if (!it.fold || it.fold.userData.id !== 1) { makeFold(rot(0, 1), rot(-1, 0)); it.fold.userData.id = 1; } it.fold.rotation.x = Math.PI * ease(clamp01(k)); };
  it.foldCD = (k) => { if (!it.fold || it.fold.userData.id !== 2) { makeFold(rot(nn[0], nn[1]), rot(tt[0], tt[1])); it.fold.userData.id = 2; } it.fold.rotation.x = Math.PI * ease(clamp01(k)); };
  it.show = (...ks) => { ks.forEach((k) => (marks[k].on = true)); it.redraw(); };
  // the chord is drawn with a pencil from one end to the other (k: 0 → 1)
  it.drawChord = (k, which = 'AB') => { const m = marks[which], [p, q] = which === 'AB' ? [A, B] : [C, D], e = ease(clamp01(k));
    m.seg = [p, [lerp(p[0], q[0], e), lerp(p[1], q[1], e)]]; m.on = true; marks[which[0]].on = true; marks[which[1]].on = e >= 1; it.redraw(); };
  // a small right-angle mark at M (between the crease going up and MB)
  const rt = outline([Q(M, 0, 0.006), Q(M, 0.006, 0.006), Q(M, 0.006, 0)], ink(0x7a2d8c), Y + 0.0012, false); rt.visible = false; it.g.add(rt);
  it.rightAngle = (on) => { rt.visible = on; };
  it.redraw();
  const W = at3(it, Y);
  const AT = { O: O, A: A, B: B, M: M, C: C, D: D, N: Nm, AB: Q(M, 0, -0.016), OM: Q(O, 0.03, -1.5 * s), top: [O[0], O[1] + Rr + 0.008], right: [O[0] + Rr + 0.02, O[1]] };
  it.at = (k) => W(AT[k][0], AT[k][1]);
  it.noGrab = true; it.height = 0.01; it.radius = 0.2; it.grabY = 0.005; return it;
}
