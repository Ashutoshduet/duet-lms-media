// Maths lab, batch 9: three paper triangles compared by lifting, turning, flipping and placing one on another
// (Class 7, Geometric Twins: congruent triangles), and two equal staircases of unit cubes fitted together into a
// rectangle (Class 10, Arithmetic Progressions: the sum of the first n terms).
// Flat pieces are drawn in (u, v) on the table: u to the right, v away from the student (world x = u, z = -v).
import * as THREE from 'three';
import { Item } from './apparatus.js';
import { paper, ink, flat, outline, ease, lerp, clamp01, rect, board, topLabel } from './mathlab2.js';

const at3 = (it, Y) => (u, v, up = 0.02) => it.g.localToWorld(new THREE.Vector3(u, Y + up, -v));
const letter = (t, s = 0.03, color = '#1d2630') => { const m = topLabel(t, s, s, color, 0); m.renderOrder = 4; return m; };
const arc = (k, h) => Math.sin(Math.PI * clamp01(k)) * h; // up and down again while k goes 0 → 1

// ------------------------------------------------------------------ three paper triangles: ABC, its mirror twin PQR, and a bigger XYZ
export function triangleTwins(o = {}) {
  const it = new Item('mtwins', { ...o, name: o.name || { en: 'Three paper triangles to compare', hi: 'तुलना के लिए काग़ज़ के तीन त्रिभुज', hg: 'Compare karne ke liye kaagaz ke teen triangles' } });
  const Y = 0.003, PY = Y + 0.0006, s = 0.016; // s: metres per cm on the paper
  it.g.add(board(-0.23, -0.12, 0.23, 0.13, '#b98a5a'));
  // ABC: AB = 6 cm, BC = 5 cm, CA = 4 cm; the corners are kept about the centre of the triangle so it can turn in place
  const cy = Math.sqrt(16 - 2.25 ** 2), raw = [[0, 0], [6, 0], [2.25, cy]];
  const gx = (raw[0][0] + raw[1][0] + raw[2][0]) / 3, gy = (raw[0][1] + raw[1][1] + raw[2][1]) / 3;
  const T = raw.map(([x, y]) => [(x - gx) * s, (y - gy) * s]);
  const SIDES = ['6 cm', '5 cm', '4 cm']; // AB, BC, CA
  function tri(names, color, scale, mirror, sides) {
    const pts = T.map(([u, v]) => [(mirror ? -u : u) * scale, v * scale]);
    const g = new THREE.Group(); g.add(flat(pts, paper(color), 0)); g.add(outline(pts, ink(0x2b2b2b), 0.0003));
    it.g.add(g);
    const lab = names.map((n) => { const m = letter(n, 0.036); it.g.add(m); return m; });
    const len = sides.map((t) => { const m = letter(t, 0.06, '#7a2a12'); m.scale.set(1, 0.5, 1); it.g.add(m); return m; });
    const t = { g, pts, lab, len, home: new THREE.Vector3(), turn: 0, flip: 0, showLen: false, showLab: true };
    // a point of the triangle (local u, v) in the board's coordinates
    t.pos = (u, v, out = 0) => { const L = Math.hypot(u, v) || 1; const p = new THREE.Vector3(u * (1 + out / L), 0, -v * (1 + out / L)); p.applyEuler(g.rotation).add(g.position); return p; };
    t.sync = () => {
      g.rotation.set(0, t.turn, Math.PI * t.flip);
      pts.forEach(([u, v], i) => { const p = t.pos(u, v, 0.016); lab[i].position.set(p.x, g.position.y + 0.002, p.z); lab[i].visible = t.showLab; });
      pts.forEach(([u, v], i) => { const [u2, v2] = pts[(i + 1) % 3]; const mu = (u + u2) / 2, mv = (v + v2) / 2; const p = t.pos(mu, mv, 0.013); len[i].position.set(p.x, g.position.y + 0.002, p.z); len[i].visible = t.showLen; });
    };
    t.place = (x, z, y = PY, turn = t.turn, flip = t.flip) => { g.position.set(x, y, z); t.turn = turn; t.flip = flip; t.sync(); };
    return t;
  }
  const abc = tri(['A', 'B', 'C'], 0xf0a33a, 1, false, SIDES);
  const pqr = tri(['P', 'Q', 'R'], 0x7fb0dd, 1, true, SIDES);
  const xyz = tri(['X', 'Y', 'Z'], 0x8fcf8a, 1.5, false, ['9 cm', '7.5 cm', '6 cm']);
  const HOME = { abc: [-0.15, -0.04, 0, 0], pqr: [0.0, -0.035, 2.2, 0], xyz: [0.125, 0.035, 0, 0] };
  const home = (t, k) => { const h = HOME[k]; t.place(h[0], -h[1], PY + (k === 'xyz' ? 0 : 0.0004), h[2], h[3]); };
  it.tris = { abc, pqr, xyz };
  // where ABC lies, and where it lies with corner A on corner X (XYZ is 1.5 times ABC about its centre)
  const onX = () => { const h = HOME.xyz; return [h[0] + 0.5 * T[0][0], -(h[1] + 0.5 * T[0][1])]; };
  it.reset = () => { home(abc, 'abc'); home(pqr, 'pqr'); home(xyz, 'xyz'); [abc, pqr, xyz].forEach((t) => { t.showLen = false; t.showLab = true; t.sync(); }); };
  it.measure = (k) => { [abc, pqr, xyz].forEach((t, i) => { t.showLen = k * 3 > i + 0.2; t.sync(); }); };
  // PQR lifted, turned (not flipped) and laid on ABC: it does not fit
  it.tryPlace = (k) => { const e = ease(clamp01(k)), h = HOME.pqr, a = HOME.abc;
    pqr.showLen = k < 0.05; pqr.place(lerp(h[0], a[0], e), -lerp(h[1], a[1], e), PY + 0.0016 + arc(k, 0.05), lerp(h[2], 0, e), 0); };
  // PQR lifted again, turned over (flipped), and laid back on ABC: it fits exactly
  it.flipPlace = (k) => { const a = HOME.abc, up = k < 0.5 ? arc(k, 0.06) * 1 : arc(k, 0.06);
    pqr.place(a[0], -a[1], PY + 0.0016 + up, 0, ease(clamp01((k - 0.15) / 0.65))); pqr.showLab = k < 0.1; pqr.sync(); };
  // PQR goes back to its place (turned over), then ABC is laid on XYZ with corner A on corner X
  it.onBig = (k) => { const k1 = clamp01(k / 0.4), k2 = clamp01((k - 0.4) / 0.6), e1 = ease(k1), e2 = ease(k2), a = HOME.abc, h = HOME.pqr, x = onX();
    pqr.showLab = k1 >= 1; pqr.place(lerp(a[0], h[0], e1), -lerp(a[1], h[1], e1), PY + 0.0004 + arc(k1, 0.05), 0, 1);
    abc.showLen = false; abc.place(lerp(a[0], x[0], e2), lerp(-a[1], x[1], e2), PY + 0.0016 + arc(k2, 0.06), 0, 0); };
  // ABC goes back to its own place, beside its twin PQR
  it.backHome = (k) => { const e = ease(clamp01(k)), a = HOME.abc, x = onX(); abc.place(lerp(x[0], a[0], e), lerp(x[1], -a[1], e), PY + 0.0004 + arc(k, 0.05), 0, 0); };
  const W = at3(it, Y);
  it.at = (n) => {
    if (n === 'abc') return W(HOME.abc[0], HOME.abc[1] + 0.045); if (n === 'pqr') return W(HOME.pqr[0], HOME.pqr[1] + 0.05); if (n === 'xyz') return W(HOME.xyz[0], HOME.xyz[1] + 0.06);
    if (n === 'below') return W(HOME.abc[0], HOME.abc[1] - 0.06); if (n === 'front') return W(-0.06, -0.1); if (n === 'big') return W(HOME.xyz[0], HOME.xyz[1] - 0.065);
    const i = 'ABC'.indexOf(n); if (i >= 0) { const p = abc.pos(...abc.pts[i], 0.02); return it.g.localToWorld(new THREE.Vector3(p.x, Y + 0.02, p.z)); }
    return W(0, 0);
  };
  it.reset();
  it.noGrab = true; it.height = 0.01; it.radius = 0.22; it.grabY = 0.005; return it;
}

// ------------------------------------------------------------------ two staircases of unit cubes: columns of 2, 3, 4, 5, 6 (a = 2, d = 1, n = 5)
export function apStairs(o = {}) {
  const it = new Item('mapstairs', { ...o, name: o.name || { en: 'Unit cubes for two staircases', hi: 'दो सीढ़ियों के लिए इकाई घन', hg: 'Do seedhiyon ke liye unit cubes' } });
  const s = 0.02, Y = 0.003, n = 5, a = 2, d = 1, H = 2 * a + (n - 1) * d; // the rectangle is n columns × H rows
  const V0 = -0.088, UA = -0.135, UB = 0.035; // left edges of the two staircases
  it.g.add(board(-0.2, -0.125, 0.2, 0.135, '#b98a5a'));
  const geo = new THREE.BoxGeometry(s * 0.96, s * 0.96, s * 0.96), edges = new THREE.EdgesGeometry(geo);
  const cube = (c) => { const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: c, roughness: 0.55 })); m.add(new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x1b1b1b, transparent: true, opacity: 0.4 }))); return m; };
  // each staircase is a group whose origin is the centre of the n × H rectangle it belongs to, so it can turn half round
  const stair = (u0, cA, cB) => {
    const g = new THREE.Group(); g.position.set(u0 + (n * s) / 2, Y, -(V0 + (H * s) / 2)); it.g.add(g); const list = [];
    for (let i = 0; i < n; i++) for (let j = 0; j < a + i * d; j++) {
      const m = cube((i + j) % 2 ? cB : cA); m.userData.to = new THREE.Vector3(-(n * s) / 2 + (i + 0.5) * s, s / 2, (H * s) / 2 - (j + 0.5) * s);
      m.position.copy(m.userData.to); g.add(m); list.push(m);
    }
    return { g, list, u0 };
  };
  const A = stair(UA, 0xf0a33a, 0xe07b2a), B = stair(UB, 0x3f8fd8, 0x2f74b8);
  // the numbers at the foot of each column of the first staircase (2 … 6), and the column totals (8) once it is a rectangle
  const foot = []; for (let i = 0; i < n; i++) { const m = letter(String(a + i * d), 0.032, '#1d2630'); m.position.set(UA + (i + 0.5) * s, Y + 0.001, -(V0 - 0.014)); it.g.add(m); foot.push(m); }
  const tops = []; for (let i = 0; i < n; i++) { const m = letter(String(H), 0.034, '#0b5a1f'); m.position.set(UA + (i + 0.5) * s, Y + 0.001, -(V0 + H * s + 0.026)); m.visible = false; it.g.add(m); tops.push(m); }
  const build = (S, k) => { const N = S.list.length; S.list.forEach((m, q) => { const e = ease(clamp01(k * N - q)); m.visible = e > 0; m.position.copy(m.userData.to); m.position.y += (1 - e) * 0.06; }); };
  it.buildA = (k) => { build(A, k); foot.forEach((m, i) => { m.visible = k * n > i; }); };
  it.buildB = (k) => build(B, k);
  // B turns half round and slides onto A; the gaps of A are filled
  const cA = A.g.position.clone(), cB = B.g.position.clone();
  it.fit = (k) => { const k1 = clamp01(k / 0.45), k2 = clamp01((k - 0.45) / 0.55);
    B.g.rotation.y = Math.PI * ease(k1); B.g.position.lerpVectors(cB, cA, ease(k2)); B.g.position.y = Y + arc(k1, 0.05) + arc(k2, 0.05);
    if (k >= 1) { B.g.position.copy(cA); B.g.position.y = Y; } };
  it.totals = (k) => { tops.forEach((m, i) => { m.visible = k * n > i; }); };
  it.reset = () => { it.buildA(0); it.buildB(0); B.g.rotation.y = 0; B.g.position.copy(cB); it.totals(0); };
  const W = at3(it, Y);
  const AT = { stairA: [UA + (n * s) / 2, V0 + (H * s) / 2], stairB: [UB + (n * s) / 2, V0 + (H * s) / 2], foot: [UA + (n * s) / 2, V0 - 0.03],
    top: [UA + (n * s) / 2, V0 + H * s + 0.03], right: [UB + (n * s) / 2, V0 + (H * s) / 2], side: [UB + (n * s) / 2 - 0.01, V0 + H * s * 0.55], left: [UA - 0.03, V0 + (H * s) / 2] };
  it.at = (q) => W(AT[q][0], AT[q][1], 0.04);
  it.reset();
  it.noGrab = true; it.height = 0.05; it.radius = 0.2; it.grabY = 0.01; return it;
}
