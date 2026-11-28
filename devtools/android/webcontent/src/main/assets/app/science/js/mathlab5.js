// Maths lab, batch 5: regular tiles fitted round one point (which regular polygons tile a floor: triangles, squares
// and hexagons do, pentagons leave a gap), and a paper quadrilateral whose four corners are torn off and put
// together round one point (the angles of a quadrilateral add up to 360°).
// Flat pieces are drawn in (u, v) on the table: u to the right, v away from the student (world x = u, z = -v).
import * as THREE from 'three';
import { Item } from './apparatus.js';
import { paper, ink, flat, outline, dashed, ease, lerp, clamp01, rect, board, topLabel } from './mathlab2.js';

const at3 = (it, Y) => (u, v, up = 0.02) => it.g.localToWorld(new THREE.Vector3(u, Y + up, -v));
const D2R = Math.PI / 180;
// a thin tile (a flat polygon given in its own (u, v), with thickness T) with a dark edge
function slab(pts, color, T = 0.003, o = {}) {
  const g = new THREE.Group();
  const sh = new THREE.Shape(pts.map(([u, v]) => new THREE.Vector2(u, v)));
  const geo = new THREE.ExtrudeGeometry(sh, { depth: T, bevelEnabled: false }); geo.rotateX(-Math.PI / 2);
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color, roughness: 0.55, ...o })); g.add(m);
  g.add(outline(pts, new THREE.LineBasicMaterial({ color: 0x1b1b1b, transparent: true, opacity: 0.55 }), T + 0.0003));
  return g;
}
// a sector (a wedge of a circle) from angle a0 to a1 (radians), radius r, centre at (0, 0)
const sector = (r, a0, a1, n = 24) => { const p = [[0, 0]]; for (let i = 0; i <= n; i++) { const a = lerp(a0, a1, i / n); p.push([r * Math.cos(a), r * Math.sin(a)]); } return p; };

// ------------------------------------------------------------------ regular tiles round one point
export function polygonTiles(o = {}) {
  const it = new Item('mtiling', { ...o, name: o.name || { en: 'Regular tiles: triangles, squares, hexagons, pentagons', hi: 'नियमित टाइलें: त्रिभुज, वर्ग, षट्भुज, पंचभुज', hg: 'Regular tiles: triangle, square, hexagon, pentagon' } });
  const s = 0.05, T = 0.003, Y = 0.003, P = [0.07, 0.0], TRAY = [-0.125, 0.0], ST = -50 * D2R; // ST: where the first tile starts, so the gap and the overlap face the student
  it.g.add(board(-0.21, -0.125, 0.21, 0.125, '#b98a5a'));
  it.g.add(flat(rect(-0.198, -0.113, 0.198, 0.113), paper(0x2f5d50), Y - 0.0004)); // a green mat
  // the point P where the corners meet, drawn on the floor
  const dot = new THREE.Mesh(new THREE.CircleGeometry(0.003, 16), new THREE.MeshBasicMaterial({ color: 0xc0392b })); dot.rotation.x = -Math.PI / 2; dot.position.set(P[0], Y + 0.0005, -P[1]); it.g.add(dot);
  const pl = topLabel('P', 0.036, 0.036, '#ffffff', Y + 0.0006); pl.position.set(P[0] - 0.01, Y + 0.0006, -(P[1] + 0.012)); it.g.add(pl);
  // a regular n-gon with one corner at (0, 0), its corner angle centred on the direction b (radians)
  const ngon = (n, b) => { const R = s / (2 * Math.sin(Math.PI / n)), cx = R * Math.cos(b), cy = R * Math.sin(b), pts = [];
    for (let k = 0; k < n; k++) { const a = b + Math.PI + (2 * Math.PI * k) / n; pts.push([cx + R * Math.cos(a), cy + R * Math.sin(a)]); } return pts; };
  const COL = { 3: 0xf0a030, 4: 0x3f8fd8, 6: 0x55b36a, 5: 0x9b6bc8 };
  const sets = {};
  // tiles of n sides, count of them, laid one after another round P (tile i spans the angles i·α … (i + 1)·α)
  const mkSet = (n, count) => { const alpha = Math.PI - (2 * Math.PI) / n, tiles = [];
    for (let i = 0; i < count; i++) {
      const g = new THREE.Group(), b = (i + 0.5) * alpha + ST;
      const extra = n === 5 && i === 3; // the fourth pentagon, which overlaps the first
      const t = slab(ngon(n, b), extra ? 0xd0503c : COL[n], T, extra ? { transparent: true, opacity: 0.8 } : {}); g.add(t);
      const lb = topLabel(Math.round(alpha / D2R) + '°', 0.032, 0.02, '#ffffff', T + 0.0005);
      const d = n === 3 ? 0.45 * s : 0.5 * s; lb.position.set(d * Math.cos(b), T + 0.0005, -d * Math.sin(b)); g.add(lb);
      const R = s / (2 * Math.sin(Math.PI / n)); // the pile is centred on the tile's middle, not on its corner
      g.visible = false; g.userData.lift = extra ? 0.004 : i * 0.0003; g.userData.from = [TRAY[0] - R * Math.cos(b), TRAY[1] - R * Math.sin(b)]; it.g.add(g); tiles.push(g);
    }
    sets[n] = tiles; return tiles; };
  mkSet(3, 6); mkSet(4, 4); mkSet(6, 3); mkSet(5, 4);
  // tile i of set n flies from the pile on the left into its place round P (k: 0 → 1)
  it.place = (n, i, k) => { const g = sets[n][i], e = ease(clamp01(k)); g.visible = k > 0;
    const f = g.userData.from;
    g.position.set(lerp(f[0], P[0], e), Y + g.userData.lift + i * (1 - e) * (T + 0.0004) + Math.sin(Math.PI * e) * 0.035, -lerp(f[1], P[1], e)); };
  // the pile of tiles waiting on the left (shown before they are placed)
  it.pile = (n, on = true) => sets[n].forEach((g, i) => { g.visible = on; g.position.set(g.userData.from[0], Y + g.userData.lift + i * (T + 0.0004), -g.userData.from[1]); });
  // a whole set slides off to the right and goes away (k: 0 → 1)
  it.clear = (n, k) => { const e = ease(clamp01(k)); sets[n].forEach((g) => { g.visible = e < 1; g.position.set(P[0] + e * 0.25, Y + g.userData.lift + Math.sin(Math.PI * e) * 0.02, -P[1]); }); };
  // the gap left by three pentagons: a red wedge of 36°
  const a5 = 108 * D2R, gap = flat(sector(0.75 * s, ST + 3 * a5, ST + 2 * Math.PI), new THREE.MeshBasicMaterial({ color: 0xe74c3c, side: THREE.DoubleSide }), 0);
  gap.position.set(P[0], Y + 0.0008, -P[1]); gap.visible = false; it.g.add(gap); it.gap = gap;
  // a ring round the full turn at P
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.02, 0.0225, 48), new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide })); ring.rotation.x = -Math.PI / 2; ring.position.set(P[0], Y + T + 0.001, -P[1]); ring.visible = false; it.g.add(ring); it.ring = ring;
  const W = at3(it, Y);
  const AT = { P: P, top: [P[0], P[1] + 0.1], right: [P[0] + 0.1, P[1] + 0.03], below: [P[0], P[1] - 0.1], tray: [TRAY[0], TRAY[1] + 0.05], gap: [P[0] + 0.012, P[1] - 0.03], over: [P[0] + 0.07, P[1] - 0.02] };
  it.at = (k) => W(AT[k][0], AT[k][1], 0.02);
  it.noGrab = true; it.height = 0.01; it.radius = 0.2; it.grabY = 0.005; return it;
}

// ------------------------------------------------------------------ a paper quadrilateral with its four corners torn off
export function quadCorners(o = {}) {
  const it = new Item('mquadcorners', { ...o, name: o.name || { en: 'A paper quadrilateral, scissors and a protractor', hi: 'काग़ज़ का चतुर्भुज, कैंची और चाँदा', hg: 'Kaagaz ka quadrilateral, kainchi aur protractor' } });
  const Y = 0.003, r = 0.03, ANG = [70, 105, 95, 90], NAMES = ['A', 'B', 'C', 'D'], Pt = [0.125, 0.0];
  it.g.add(board(-0.21, -0.125, 0.21, 0.125, '#b98a5a'));
  it.g.add(flat(rect(-0.198, -0.113, 0.198, 0.113), paper(0x2f5d50), Y - 0.0004)); // a green cutting mat
  // build ABCD (anticlockwise) from its angles: AB along u, BC 8 cm long, then CD and DA meet to close it
  const dirs = [0]; for (let i = 1; i < 4; i++) dirs.push(dirs[i - 1] + (180 - ANG[i]) * D2R);
  const A0 = [0, 0], B0 = [0.15, 0], C0 = [B0[0] + 0.1 * Math.cos(dirs[1]), B0[1] + 0.085 * Math.sin(dirs[1])];
  // D = C + t·d2 = A + s·(−d3)
  const d2 = [Math.cos(dirs[2]), Math.sin(dirs[2])], d3 = [-Math.cos(dirs[3]), -Math.sin(dirs[3])];
  const det = d2[0] * (-d3[1]) - d2[1] * (-d3[0]), rx = A0[0] - C0[0], ry = A0[1] - C0[1];
  const t = (rx * (-d3[1]) - ry * (-d3[0])) / det; const D0 = [C0[0] + t * d2[0], C0[1] + t * d2[1]];
  const raw = [A0, B0, C0, D0], cu = raw.reduce((a, p) => a + p[0], 0) / 4, cv = raw.reduce((a, p) => a + p[1], 0) / 4;
  const Q = raw.map(([u, v]) => [u - cu - 0.08, v - cv]);
  // at each corner: the interior angle starts at the direction to the next corner and turns anticlockwise to the previous one
  const start = Q.map((p, i) => { const n = Q[(i + 1) % 4]; return Math.atan2(n[1] - p[1], n[0] - p[0]); });
  const span = ANG.map((a) => a * D2R);
  // the paper with its corners cut away (each corner leaves a curved notch of radius r)
  const cut = []; for (let i = 0; i < 4; i++) { const p = Q[i]; for (let j = 0; j <= 16; j++) { const a = start[i] + span[i] * (1 - j / 16); cut.push([p[0] + r * Math.cos(a), p[1] + r * Math.sin(a)]); } }
  it.g.add(flat(cut, paper(0xfbf9f3), Y)); it.g.add(outline(cut, ink(0x8a7f68), Y + 0.0003));
  // letters outside each corner
  Q.forEach((p, i) => { const b = start[i] + span[i] / 2 + Math.PI, lb = topLabel(NAMES[i], 0.036, 0.036, '#ffffff', Y + 0.0006); lb.position.set(p[0] + 0.016 * Math.cos(b), Y + 0.0006, -(p[1] + 0.016 * Math.sin(b))); it.g.add(lb); });
  // the diagonal AC drawn on the paper (from the notch at A to the notch at C)
  const ac = [Q[2][0] - Q[0][0], Q[2][1] - Q[0][1]], L = Math.hypot(ac[0], ac[1]), un = [ac[0] / L, ac[1] / L];
  const diag = dashed([[Q[0][0] + un[0] * r, Q[0][1] + un[1] * r], [Q[2][0] - un[0] * r, Q[2][1] - un[1] * r]], 0x2f6fa6, Y + 0.0006, 0.004); diag.visible = false; it.g.add(diag); it.diag = diag;
  // the four coloured corners: each is built round its own corner point, so it turns about it
  const COL = [0xe74c3c, 0x3f8fd8, 0x55b36a, 0xf0a030];
  it.corners = Q.map((p, i) => { const g = new THREE.Group();
    const pts = sector(r, start[i], start[i] + span[i]), mat = paper(0xfbf9f3); g.add(flat(pts, mat, 0)); g.add(outline(pts, ink(0x3a3a3a), 0.0003));
    const b = start[i] + span[i] / 2, lb = topLabel(ANG[i] + '°', 0.03, 0.018, '#ffffff', 0.0006); lb.position.set(0.6 * r * Math.cos(b), 0.0006, -0.6 * r * Math.sin(b)); g.add(lb);
    g.position.set(p[0], Y + 0.0004, -p[1]); g.userData = { home: p, b, mat, col: new THREE.Color(COL[i]) }; lb.visible = false; g.userData.lb = lb; it.g.add(g); return g; });
  // the corners are coloured in (k: 0 → 1)
  const white = new THREE.Color(0xfbf9f3);
  it.colour = (k) => it.corners.forEach((g) => { g.userData.mat.color.copy(white).lerp(g.userData.col, ease(clamp01(k))); g.userData.lb.visible = k >= 1; });
  // torn off: each corner moves a little away from the paper, outwards (k: 0 → 1)
  const out = 0.02;
  const torn = (g) => { const b = g.userData.b + Math.PI, h = g.userData.home; return [h[0] + out * Math.cos(b), h[1] + out * Math.sin(b)]; };
  it.tear = (k) => { const e = ease(clamp01(k)); it.corners.forEach((g) => { const q = torn(g), h = g.userData.home; g.position.set(lerp(h[0], q[0], e), Y + 0.0004 + Math.sin(Math.PI * e) * 0.01, -lerp(h[1], q[1], e)); }); };
  // corner i goes to the point P and turns so that it starts where the corner before it ends (k: 0 → 1)
  let cum = Math.PI / 2 - (span[0] + span[1]) / 2; const goal = span.map((sp) => { const a = cum; cum += sp; return a; });
  const PD = new THREE.Mesh(new THREE.CircleGeometry(0.0028, 16), new THREE.MeshBasicMaterial({ color: 0x26303a })); PD.rotation.x = -Math.PI / 2; PD.position.set(Pt[0], Y + 0.0003, -Pt[1]); it.g.add(PD);
  const pl = topLabel('P', 0.036, 0.036, '#ffffff', Y + 0.0006); pl.position.set(Pt[0] + 0.044, Y + 0.0006, -Pt[1]); it.g.add(pl);
  it.move = (i, k) => { const g = it.corners[i], q = torn(g), e = ease(clamp01(k));
    g.position.set(lerp(q[0], Pt[0], e), Y + 0.0004 + i * 0.0002 + Math.sin(Math.PI * e) * 0.03, -lerp(q[1], Pt[1], e)); g.rotation.y = (goal[i] - start[i]) * e; };
  const ring = new THREE.Mesh(new THREE.RingGeometry(r + 0.003, r + 0.005, 64), new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide })); ring.rotation.x = -Math.PI / 2; ring.position.set(Pt[0], Y + 0.0012, -Pt[1]); ring.visible = false; it.g.add(ring); it.ring = ring;
  const W = at3(it, Y);
  const mid = [(Q[0][0] + Q[2][0]) / 2, (Q[0][1] + Q[2][1]) / 2];
  const AT = { A: Q[0], B: Q[1], C: Q[2], D: Q[3], mid, quad: [-0.085, 0.02], below: [-0.08, -0.095], P: Pt, Pup: [Pt[0], Pt[1] + 0.055], Pdown: [Pt[0], Pt[1] - 0.06] };
  it.at = (k) => W(AT[k][0], AT[k][1], 0.02);
  it.angles = ANG; it.noGrab = true; it.height = 0.01; it.radius = 0.2; it.grabY = 0.005; return it;
}
