// Maths lab, batch 8: a paper rectangle folded into 3 columns and 4 rows and shaded to multiply two fractions
// (Class 7, Working with Fractions), and a paper trapezium cut at the midpoints of its slanting sides and turned into a
// rectangle (Class 8, Area).
// Flat pieces are drawn in (u, v) on the table: u to the right, v away from the student (world x = u, z = -v).
import * as THREE from 'three';
import { Item } from './apparatus.js';
import { paper, ink, flat, outline, dashed, ease, lerp, clamp01, rect, board, topLabel } from './mathlab2.js';

const at3 = (it, Y) => (u, v, up = 0.02) => it.g.localToWorld(new THREE.Vector3(u, Y + up, -v));
// a dot (a marked point) lying on the paper
function dot(u, v, y, r = 0.0045, color = 0xc0392b) {
  const g = new THREE.CircleGeometry(r, 24); g.rotateX(-Math.PI / 2);
  const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color })); m.position.set(u, y, -v); return m;
}
const letter = (t, u, v, y, s = 0.022, color = '#1d2630') => { const m = topLabel(t, s, s, color, y); m.position.set(u, y, -v); return m; };

// ------------------------------------------------------------------ a paper rectangle: 3 columns × 4 rows, folded and shaded
export function fractionFold(o = {}) {
  const it = new Item('mfracfold', { ...o, name: o.name || { en: 'A paper rectangle to fold and shade', hi: 'मोड़ने और रंगने के लिए काग़ज़ का आयत', hg: 'Fold aur shade karne ke liye kaagaz ka rectangle' } });
  const Y = 0.003, C = 3, R = 4, U0 = -0.15, V0 = -0.1, CW = 0.1, RH = 0.05, U1 = U0 + C * CW, V1 = V0 + R * RH, PY = Y + 0.0006;
  it.g.add(board(-0.21, -0.14, 0.21, 0.14, '#b98a5a'));
  const cellPts = (i, j, du = 0, dv = 0) => rect(U0 + i * CW - du, V0 + j * RH - dv, U0 + (i + 1) * CW - du, V0 + (j + 1) * RH - dv);
  // the paper is 12 cells, so the part being folded can leave the table while the rest stays
  const cells = []; for (let i = 0; i < C; i++) for (let j = 0; j < R; j++) { const m = flat(cellPts(i, j), paper(0xf4f0e4), PY); m.userData.ij = [i, j]; cells.push(m); it.g.add(m); }
  const border = outline(rect(U0, V0, U1, V1), ink(0x6b5a3a), PY + 0.0003); it.g.add(border);
  // creases appear once the paper has been folded
  const creasesV = [1, 2].map((i) => dashed([[U0 + i * CW, V0], [U0 + i * CW, V1]], 0x7a6a50, PY + 0.0004, 0.004));
  const creasesH = [1, 2, 3].map((j) => dashed([[U0, V0 + j * RH], [U1, V0 + j * RH]], 0x7a6a50, PY + 0.0004, 0.004));
  [...creasesV, ...creasesH].forEach((l) => { l.visible = false; it.g.add(l); });
  // shading: 2 columns blue, then 3 rows of the blue part green; numbers 1 … 6 on the green cells
  // (each cell is coloured itself, so the colour folds with the paper)
  const PAPER = new THREE.Color(0xf4f0e4), BLUE = new THREE.Color(0x7fb0dd), GREEN = new THREE.Color(0x3c9e55);
  let kb = 0, kg = 0;
  const paint = () => { cells.forEach((m) => { const [i, j] = m.userData.ij; const c = m.material.color.copy(PAPER);
    if (i < 2) { c.lerp(BLUE, kb); if (j < 3) c.lerp(GREEN, kg); } }); flaps.forEach((f) => f.sync()); };
  const nums = []; let n = 0; for (let j = R - 2; j >= 0; j--) for (let i = 0; i < 2; i++) { const m = letter(String(++n), U0 + (i + 0.5) * CW, V0 + (j + 0.5) * RH, PY + 0.0008, 0.05, '#ffffff'); m.renderOrder = 3; m.visible = false; nums.push(m); it.g.add(m); }
  // a flap: the cells on one side of a crease, turned over about it (axis 'u' = a crease across u at c, 'v' = a crease along v at c)
  const flaps = [];
  function flap(axis, c, side, lift) {
    const pick = cells.filter((m) => { const [i, j] = m.userData.ij; const mid = axis === 'u' ? U0 + (i + 0.5) * CW : V0 + (j + 0.5) * RH; return side > 0 ? mid > c : mid < c; });
    const g = new THREE.Group(); g.position.set(axis === 'u' ? c : 0, PY + lift, axis === 'u' ? 0 : -c); it.g.add(g);
    const twins = pick.map((m) => { const [i, j] = m.userData.ij; const t = flat(cellPts(i, j, axis === 'u' ? c : 0, axis === 'u' ? 0 : c), paper(0xf0ebdc), 0); g.add(t); return [m, t]; });
    const f = { g, pick, axis, side, k: 0, sync() { twins.forEach(([m, t]) => t.material.color.copy(m.material.color).multiplyScalar(0.97)); }, set(k) { f.k = k; const a = Math.PI * clamp01(k); g.visible = k > 0.001;
      if (axis === 'u') g.rotation.z = side * a; else g.rotation.x = side * a; refresh(); } };
    flaps.push(f); f.set(0); return f;
  }
  // a cell lies on the table unless a flap that holds it is lifted
  function refresh() { cells.forEach((m) => { m.visible = true; }); border.visible = !flaps.some((f) => f.k > 0.001); flaps.forEach((f) => { if (f.k > 0.001) f.pick.forEach((m) => { m.visible = false; }); }); }
  const fR = flap('u', U0 + 2 * CW, 1, 0.0012), fL = flap('u', U0 + CW, -1, 0.0024);
  const fHalf = flap('v', V0 + 2 * RH, 1, 0.0012), fTop = flap('v', V0 + 3 * RH, 1, 0.0024), fBot = flap('v', V0 + RH, -1, 0.0024);
  const bump = (k, a, b) => { const x = clamp01((k - a) / (b - a)); return ease(x < 0.5 ? x * 2 : 2 - x * 2); }; // 0 → 1 → 0 over [a, b]
  const hold = (k, a, b, c, d) => (k < b ? ease(clamp01((k - a) / (b - a))) : ease(1 - clamp01((k - c) / (d - c)))); // fold over, stay, open
  // fold into 3 like a letter: the right column over, the left column over it, then open both
  it.foldThirds = (k) => { fR.set(hold(k, 0, 0.3, 0.7, 0.95)); fL.set(hold(k, 0.3, 0.55, 0.62, 0.88)); if (k >= 1) creasesV.forEach((l) => { l.visible = true; }); };
  // fold into 4 the other way: in half, then each outer quarter over the next
  it.foldQuarters = (k) => { fHalf.set(bump(k, 0, 0.36)); fTop.set(bump(k, 0.36, 0.68)); fBot.set(bump(k, 0.68, 1)); if (k >= 1) creasesH.forEach((l) => { l.visible = true; }); };
  it.shadeBlue = (k) => { kb = clamp01(k); paint(); };
  it.shadeGreen = (k) => { kg = clamp01(k); paint(); };
  it.count = (k) => { nums.forEach((m, i) => { m.visible = k * nums.length > i + 0.2; }); };
  it.reset = () => { flaps.forEach((f) => f.set(0)); [...creasesV, ...creasesH].forEach((l) => { l.visible = false; }); kb = 0; kg = 0; paint(); nums.forEach((m) => { m.visible = false; }); };
  const W = at3(it, Y);
  const AT = { mid: [0, 0], top: [0, V1 + 0.02], c0: [U0 + CW / 2, V1 - RH / 2], c1: [U0 + 1.5 * CW, V1 - RH / 2], c2: [U0 + 2.5 * CW, V1 - RH / 2], blue: [U0 + CW, V1 - RH / 2], green: [U0 + CW, V0 + 1.5 * RH], right: [U1 - CW / 2, V0 + RH], below: [0, V0 - 0.025] };
  it.at = (k) => W(AT[k][0], AT[k][1]);
  it.noGrab = true; it.height = 0.01; it.radius = 0.2; it.grabY = 0.005; return it;
}

// ------------------------------------------------------------------ a paper trapezium (parallel sides 14 cm and 8 cm, height 6 cm)
export function trapeziumCut(o = {}) {
  const it = new Item('mtrapcut', { ...o, name: o.name || { en: 'A paper trapezium (parallel sides 14 cm and 8 cm, height 6 cm)', hi: 'काग़ज़ का समलंब (समांतर भुजाएँ 14 cm और 8 cm, ऊँचाई 6 cm)', hg: 'Kaagaz ka trapezium (parallel sides 14 cm aur 8 cm, height 6 cm)' } });
  const s = 0.018, Y = 0.003, PY = Y + 0.0006, V0 = -0.05;
  const P = (x, y) => [x * s, V0 + y * s];
  const A = P(-7, 0), B = P(7, 0), Cc = P(3, 6), D = P(-5, 6), I = P(-6, 3), J = P(5, 3);
  const L0 = P(-6, 0), R0 = P(5, 0), Lt = P(-6, 6), Rt = P(5, 6);
  it.g.add(board(-0.21, -0.12, 0.21, 0.12, '#b98a5a'));
  // the faint place of the rectangle the pieces will make
  const ghost = outline(rect(Lt[0], V0, Rt[0], V0 + 6 * s), new THREE.LineDashedMaterial({ color: 0x2f9a4a, dashSize: 0.004, gapSize: 0.003 }), PY + 0.0012); ghost.computeLineDistances(); ghost.visible = false; it.g.add(ghost);
  // the middle piece stays; the two corner triangles are cut off and turn half round about I and J
  const piece = (pts, c, pivot, lift) => { const g = new THREE.Group(); const loc = pts.map(([u, v]) => [u - pivot[0], v - pivot[1]]);
    const f = flat(loc, paper(0xf0a33a), 0), ol = outline(loc, ink(0x3a3a3a), 0.0003); ol.visible = false; g.add(f); g.add(ol); g.userData = { f, ol, c }; g.position.set(pivot[0], PY + lift, -pivot[1]); it.g.add(g); return g; };
  it.mid = piece([L0, R0, J, Cc, D, I], 0xf0a33a, [0, 0], 0);
  it.left = piece([A, L0, I], 0xf6c27a, I, 0.0004);
  it.right = piece([R0, B, J], 0xf6c27a, J, 0.0004);
  // the whole trapezium's outline (shown before the cut)
  const edge = outline([A, B, Cc, D], ink(0x26303a), PY + 0.0009); it.g.add(edge);
  // the height (red dotted, from D straight down), the midpoints and the cut lines through them
  it.hline = dashed([D, [D[0], V0]], 0xc0392b, PY + 0.0011, 0.003); it.g.add(it.hline);
  const marks = [dot(...I, 0), dot(...J, 0)]; marks.forEach((m, i) => { m.position.set((i ? J : I)[0], PY + 0.0013, -(i ? J : I)[1]); m.visible = false; it.g.add(m); });
  const cuts = [dashed([L0, Lt], 0xc0392b, PY + 0.0012, 0.003), dashed([R0, Rt], 0xc0392b, PY + 0.0012, 0.003)]; cuts.forEach((l) => { l.visible = false; it.g.add(l); });
  const names = [['A', A, -0.012, -0.008], ['B', B, 0.012, -0.008], ['C', Cc, 0.01, 0.01], ['D', D, -0.01, 0.01], ['I', I, -0.015, 0], ['J', J, 0.015, 0]]
    .map(([t, p, du, dv]) => { const m = letter(t, p[0] + du * 1.3, p[1] + dv * 1.3, PY + 0.0015, 0.04); m.renderOrder = 3; if (t === 'I' || t === 'J') m.visible = false; it.g.add(m); return m; });
  it.mark = (k) => { const on = k > 0.3, cut = k > 0.7; marks.forEach((m) => { m.visible = on; }); names[4].visible = on; names[5].visible = on; cuts.forEach((l) => { l.visible = cut; });
    [it.mid, it.left, it.right].forEach((g) => { g.userData.ol.visible = cut; g.userData.f.material.color.setHex(cut ? g.userData.c : 0xf0a33a); }); };
  const turn = (g, k) => { const e = ease(clamp01(k)); g.rotation.y = Math.PI * e; g.position.y = PY + 0.0004 + Math.sin(Math.PI * e) * 0.03; };
  it.turnLeft = (k) => { edge.visible = false; it.hline.visible = false; turn(it.left, k); };
  it.turnRight = (k) => { edge.visible = false; it.hline.visible = false; turn(it.right, k); if (k >= 1) ghost.visible = true; };
  it.reset = () => { edge.visible = true; it.hline.visible = true; ghost.visible = false; it.mark(0); turn(it.left, 0); turn(it.right, 0); };
  const W = at3(it, Y);
  const AT = { a: [0, V0 - 0.014], b: [(D[0] + Cc[0]) / 2, V0 + 6 * s + 0.014], h: [D[0] + 0.004, V0 + 3 * s], I: I, J: J, mid: [(Lt[0] + Rt[0]) / 2, V0 + 3 * s], top: [0, V0 + 6 * s + 0.03], below: [0, V0 - 0.035] };
  it.at = (k) => W(AT[k][0], AT[k][1]);
  it.noGrab = true; it.height = 0.01; it.radius = 0.2; it.grabY = 0.005; return it;
}
