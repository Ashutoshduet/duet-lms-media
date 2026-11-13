// Maths lab, batch 2: a paper rectangle folded along its lines and a pinwheel turned about its centre (symmetry),
// algebra tiles that fill the square on a + b, a square with a corner cut out rearranged into a rectangle (a² − b²),
// a hemisphere bowl poured into a cylinder (volume of a sphere), and a model flagpole measured with a clinometer.
// Flat pieces are drawn in (u, v) on the table: u to the right, v away from the student (world x = u, z = -v).
import * as THREE from 'three';
import { Item, Vessel } from './apparatus.js';
import { canvasTex, woodTex } from './mats.js';

const paper = (c = 0xf4f0e4, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.92, side: THREE.DoubleSide, ...o });
const ink = (c = 0x26303a) => new THREE.LineBasicMaterial({ color: c });
function flat(points, mat, y = 0) {
  const s = new THREE.Shape(points.map(([u, v]) => new THREE.Vector2(u, v)));
  const g = new THREE.ShapeGeometry(s); g.rotateX(-Math.PI / 2); g.translate(0, y, 0);
  return new THREE.Mesh(g, mat);
}
function outline(points, mat, y = 0.0004, closed = true) {
  const p = points.map(([u, v]) => new THREE.Vector3(u, y, -v)); if (closed) p.push(p[0].clone());
  return new THREE.Line(new THREE.BufferGeometry().setFromPoints(p), mat);
}
function dashed(points, color = 0x26303a, y = 0.0006, dash = 0.004) {
  const p = points.map(([u, v]) => new THREE.Vector3(u, y, -v));
  const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints(p), new THREE.LineDashedMaterial({ color, dashSize: dash, gapSize: dash * 0.8 }));
  l.computeLineDistances(); return l;
}
const ease = (k) => (k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2);
const lerp = (a, b, k) => a + (b - a) * k;
const clamp01 = (k) => Math.min(1, Math.max(0, k));
const rect = (u0, v0, u1, v1) => [[u0, v0], [u1, v0], [u1, v1], [u0, v1]];
const board = (u0, v0, u1, v1, c) => flat(rect(u0, v0, u1, v1), new THREE.MeshStandardMaterial({ map: woodTex(c), roughness: 0.75 }), 0.002);
// a text label lying on a tile (w × d metres)
function topLabel(text, w, d, color = '#ffffff', y = 0.0004) {
  const px = 256, ph = Math.max(64, Math.round((px * d) / w));
  const t = canvasTex(px, ph, (x, W, H) => { x.clearRect(0, 0, W, H); x.fillStyle = color; x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = `700 ${Math.round(Math.min(H * 0.5, W * 0.3))}px sans-serif`; x.fillText(text, W / 2, H / 2 + 2); });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false }));
  m.rotation.x = -Math.PI / 2; m.position.y = y; return m;
}

// ------------------------------------------------------------------ algebra tiles: a², two ab, b² fill the square of side a + b
export function squareTiles(o = {}) {
  const it = new Item('msqtiles', { ...o, name: o.name || { en: 'Algebra tiles', hi: 'बीजगणित टाइलें', hg: 'Algebra tiles' } });
  const a = 0.075, b = 0.04, T = 0.004, Y = 0.004, F = [0.03, -0.07], S = a + b;
  it.g.add(board(-0.21, -0.12, 0.2, 0.13, '#b98a5a'));
  // the square of side a + b drawn on a sheet, with the sides marked a | b
  const sheet = flat(rect(F[0] - 0.012, F[1] - 0.012, F[0] + S + 0.012, F[1] + S + 0.012), paper(0xfbf9f3), 0.0022); it.g.add(sheet);
  const frame = new THREE.Group(); frame.add(outline(rect(F[0], F[1], F[0] + S, F[1] + S), ink(), 0.0028));
  for (const [p, q] of [[[F[0] + a, F[1] - 0.006], [F[0] + a, F[1] + 0.002]], [[F[0] - 0.006, F[1] + a], [F[0] + 0.002, F[1] + a]]]) frame.add(outline([p, q], ink(), 0.0028, false));
  frame.add(dashed([[F[0] + a, F[1]], [F[0] + a, F[1] + S]], 0x8a929c, 0.0026)); frame.add(dashed([[F[0], F[1] + a], [F[0] + S, F[1] + a]], 0x8a929c, 0.0026));
  frame.visible = false; it.g.add(frame); it.frame = frame;
  const defs = [
    { w: a, d: a, c: 0x3f8fd8, lab: 'a²', from: [-0.135, 0.06], to: [F[0] + a / 2, F[1] + a / 2], rot: 0 },
    { w: a, d: b, c: 0x55b36a, lab: 'ab', from: [-0.135, -0.025], to: [F[0] + a / 2, F[1] + a + b / 2], rot: 0 },
    { w: a, d: b, c: 0x55b36a, lab: 'ab', from: [-0.135, -0.08], to: [F[0] + a + b / 2, F[1] + a / 2], rot: Math.PI / 2 },
    { w: b, d: b, c: 0xf0c040, lab: 'b²', ink: '#3a2a00', from: [-0.045, -0.08], to: [F[0] + a + b / 2, F[1] + a + b / 2], rot: 0 },
  ];
  it.tiles = defs.map((t) => {
    const g = new THREE.Group(); const geo = new THREE.BoxGeometry(t.w - 0.0008, T, t.d - 0.0008);
    const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: t.c, roughness: 0.55 })); m.position.y = T / 2; g.add(m);
    m.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color: 0x1b1b1b, transparent: true, opacity: 0.35 })));
    const lb = t.rot ? topLabel(t.lab, t.d * 0.9, t.d * 0.6, t.ink || '#ffffff') : topLabel(t.lab, Math.min(t.w, t.d * 2) * 0.8, Math.min(t.d, t.w) * 0.8, t.ink || '#ffffff'); lb.position.y = T + 0.0004; lb.rotation.z = -t.rot; g.add(lb); // the turned tile keeps its label upright
    g.position.set(t.from[0], Y, -t.from[1]); g.userData.t = t; it.g.add(g); return g;
  });
  // tile i slides from the tray into its place in the square (k: 0 → 1)
  it.place = (i, k) => { const g = it.tiles[i], t = g.userData.t, e = ease(clamp01(k)); g.position.set(lerp(t.from[0], t.to[0], e), Y + Math.sin(Math.PI * e) * 0.04, -lerp(t.from[1], t.to[1], e)); g.rotation.y = t.rot * e; };
  const W = (u, v, up = 0.02) => it.g.localToWorld(new THREE.Vector3(u, Y + up, -v));
  const AT = { frame: [F[0] + S / 2, F[1] + S / 2], a2: defs[0].to, ab1: defs[1].to, ab2: defs[2].to, b2: defs[3].to,
    sideA: [F[0] + a / 2, F[1] - 0.016], sideB: [F[0] + a + b / 2, F[1] - 0.016], leftA: [F[0] - 0.018, F[1] + a / 2], leftB: [F[0] - 0.018, F[1] + a + b / 2], tray: [-0.135, 0.02] };
  it.at = (k) => W(AT[k][0], AT[k][1]);
  it.noGrab = true; it.height = 0.01; it.radius = 0.2; it.grabY = 0.005; return it;
}

// ------------------------------------------------------------------ a² − b²: a paper square with a small square cut from its corner, made into a rectangle
export function diffSquares(o = {}) {
  const it = new Item('mdiffsq', { ...o, name: o.name || { en: 'Paper square (side a) with a corner cut out (side b)', hi: 'काग़ज़ का वर्ग (भुजा a), कोने से छोटा वर्ग (भुजा b) कटा हुआ', hg: 'Kaagaz ka square (side a), kone se chhota square (side b) kata hua' } });
  const a = 0.1, b = 0.04, O = [-0.16, -0.06], Y = 0.003;
  it.g.add(board(-0.2, -0.11, 0.21, 0.12, '#b98a5a'));
  const piece = (pts, c, cu, cv) => { // a flat piece built around its own centre, so it can turn about it
    const g = new THREE.Group(); const local = pts.map(([u, v]) => [u - cu, v - cv]);
    g.add(flat(local, paper(c), 0.0006)); g.add(outline(local, ink(0x3a3a3a), 0.0009)); g.position.set(cu, Y, -cv); g.userData.home = [cu, cv]; it.g.add(g); return g;
  };
  // R1: the strip a × (a − b) at the bottom; R2: the piece (a − b) × b above it; the corner square b × b
  it.r1 = piece(rect(O[0], O[1], O[0] + a, O[1] + a - b), 0xf0a33a, O[0] + a / 2, O[1] + (a - b) / 2);
  it.r2 = piece(rect(O[0], O[1] + a - b, O[0] + a - b, O[1] + a), 0x5aa0e0, O[0] + (a - b) / 2, O[1] + a - b / 2);
  it.sq = piece(rect(O[0] + a - b, O[1] + a - b, O[0] + a, O[1] + a), 0xe8e2d2, O[0] + a - b / 2, O[1] + a - b / 2);
  it.cut = dashed([[O[0], O[1] + a - b], [O[0] + a - b, O[1] + a - b]], 0xc0392b, Y + 0.0012, 0.003); it.cut.visible = false; it.g.add(it.cut);
  // where the pieces go: the corner square to the side, R2 turned and laid at the end of R1
  const R2to = [O[0] + a + b / 2, O[1] + (a - b) / 2], SQto = [O[0] + a + 0.09, O[1] + a + 0.005];
  it.cutCorner = (k) => { const e = ease(clamp01(k)), h = it.sq.userData.home; it.sq.position.set(lerp(h[0], SQto[0], e), Y + Math.sin(Math.PI * e) * 0.04, -lerp(h[1], SQto[1], e)); };
  it.move = (k) => { const e = ease(clamp01(k)), h = it.r2.userData.home; it.r2.position.set(lerp(h[0], R2to[0], e), Y + 0.001 + Math.sin(Math.PI * e) * 0.04, -lerp(h[1], R2to[1], e)); it.r2.rotation.y = (-Math.PI / 2) * e; };
  const W = (u, v, up = 0.02) => it.g.localToWorld(new THREE.Vector3(u, Y + up, -v));
  const AT = { square: [O[0] + a / 2, O[1] + a / 2], corner: [O[0] + a - b / 2, O[1] + a - b / 2], aside: SQto, sideA: [O[0] + a / 2, O[1] - 0.014], left: [O[0] - 0.016, O[1] + a / 2],
    long: [O[0] + (a + b) / 2, O[1] - 0.014], short: [O[0] + a + b + 0.018, O[1] + (a - b) / 2], rect: [O[0] + (a + b) / 2, O[1] + (a - b) / 2] };
  it.at = (k) => W(AT[k][0], AT[k][1]);
  it.noGrab = true; it.height = 0.01; it.radius = 0.2; it.grabY = 0.005; return it;
}

// ------------------------------------------------------------------ symmetry: a rectangle folded along its middle and along its diagonal; a pinwheel turned
export function symmetryCards(o = {}) {
  const it = new Item('msym', { ...o, name: o.name || { en: 'Paper rectangles and a pinwheel card', hi: 'काग़ज़ के आयत और पिनव्हील कार्ड', hg: 'Kaagaz ke rectangle aur pinwheel card' } });
  const w = 0.11, h = 0.07, Y = 0.003; it.g.add(board(-0.21, -0.1, 0.22, 0.11, '#b98a5a'));
  const BASE = 0xfbf9f3, FOLD = 0xf0a33a;
  // card A: halves either side of the vertical middle line; the right half turns over onto the left one
  const A = [-0.13, 0.03];
  it.g.add(flat(rect(A[0] - w / 2, A[1] - h / 2, A[0], A[1] + h / 2), paper(BASE), Y));
  it.g.add(outline(rect(A[0] - w / 2, A[1] - h / 2, A[0] + w / 2, A[1] + h / 2), ink(), Y + 0.0004));
  it.lineA = dashed([[A[0], A[1] - h / 2 - 0.008], [A[0], A[1] + h / 2 + 0.008]], 0xc0392b, Y + 0.0012, 0.003); it.g.add(it.lineA);
  it.flapA = new THREE.Group(); it.flapA.position.set(A[0], Y + 0.0006, 0);
  { const m = flat(rect(0, A[1] - h / 2, w / 2, A[1] + h / 2), paper(FOLD), 0); it.flapA.add(m); it.flapA.add(outline(rect(0, A[1] - h / 2, w / 2, A[1] + h / 2), ink(), 0.0003)); }
  it.g.add(it.flapA);
  // card B: the same rectangle cut along a diagonal; the top triangle turns over about the diagonal
  const B = [0.02, 0.03], p0 = [B[0] - w / 2, B[1] - h / 2], p1 = [B[0] + w / 2, B[1] + h / 2];
  it.g.add(flat([p0, [p1[0], p0[1]], p1], paper(BASE), Y)); it.g.add(outline(rect(p0[0], p0[1], p1[0], p1[1]), ink(), Y + 0.0004));
  it.lineB = dashed([[p0[0] - 0.006, p0[1] - 0.004], [p1[0] + 0.006, p1[1] + 0.004]], 0xc0392b, Y + 0.0012, 0.003); it.g.add(it.lineB);
  it.flapB = new THREE.Group(); it.flapB.position.set(p0[0], Y + 0.0006, -p0[1]);
  { const tri = [[0, 0], [p1[0] - p0[0], p1[1] - p0[1]], [0, p1[1] - p0[1]]]; it.flapB.add(flat(tri, paper(FOLD), 0)); it.flapB.add(outline(tri, ink(), 0.0003)); }
  it.g.add(it.flapB); const axisB = new THREE.Vector3(p1[0] - p0[0], 0, -(p1[1] - p0[1])).normalize();
  // card C: a pinwheel that looks the same after every quarter turn, on a pin, over its traced outline
  const C = [0.155, -0.035], s = 0.075;
  const pin = canvasTex(256, 256, (x, W, H) => { x.clearRect(0, 0, W, H); x.fillStyle = '#fbf9f3'; x.fillRect(0, 0, W, H); const cols = ['#e0573e', '#3f8fd8', '#55b36a', '#f0a33a'];
    for (let i = 0; i < 4; i++) { x.save(); x.translate(W / 2, H / 2); x.rotate((i * Math.PI) / 2); x.fillStyle = cols[i % 2 ? 1 : 0]; x.beginPath(); x.moveTo(0, 0); x.lineTo(0, -H * 0.46); x.lineTo(W * 0.3, -H * 0.18); x.closePath(); x.fill(); x.restore(); }
    x.strokeStyle = '#26303a'; x.lineWidth = 6; x.strokeRect(3, 3, W - 6, H - 6); x.fillStyle = '#26303a'; x.beginPath(); x.arc(W / 2, H / 2, 9, 0, 7); x.fill(); });
  it.g.add(outline(rect(C[0] - s / 2, C[1] - s / 2, C[0] + s / 2, C[1] + s / 2), ink(0x8a929c), Y + 0.0002));
  it.wheel = new THREE.Mesh(new THREE.PlaneGeometry(s, s), new THREE.MeshStandardMaterial({ map: pin, roughness: 0.85, side: THREE.DoubleSide })); it.wheel.rotation.x = -Math.PI / 2;
  it.wheelG = new THREE.Group(); it.wheelG.position.set(C[0], Y + 0.002, -C[1]); it.wheelG.add(it.wheel); it.g.add(it.wheelG);
  // a small dot on one corner, so the turns can be counted
  const dot = new THREE.Mesh(new THREE.CircleGeometry(0.004, 16), new THREE.MeshBasicMaterial({ color: 0x111111 })); dot.rotation.x = -Math.PI / 2; dot.position.set(s / 2 - 0.008, 0.0005, -(s / 2 - 0.008)); it.wheelG.add(dot);
  it.foldA = (k) => { it.flapA.rotation.z = Math.PI * ease(clamp01(k)); };
  it.foldB = (k) => { it.flapB.quaternion.setFromAxisAngle(axisB, Math.PI * ease(clamp01(k))); };
  it.turn = (deg) => { it.wheelG.rotation.y = (-deg * Math.PI) / 180; };
  const W = (u, v, up = 0.02) => it.g.localToWorld(new THREE.Vector3(u, Y + up, -v));
  const AT = { A: [A[0], A[1] + h / 2 + 0.012], B: [B[0], B[1] + h / 2 + 0.012], Bover: [p0[0] + 0.004, p1[1] + 0.006], C: [C[0], C[1] + s / 2 + 0.012] };
  it.at = (k) => W(AT[k][0], AT[k][1]);
  it.noGrab = true; it.height = 0.01; it.radius = 0.22; it.grabY = 0.005; return it;
}

// ------------------------------------------------------------------ a hemisphere bowl (radius 3 cm) in a ring stand
export function hemisphere(o = {}) {
  const wall = 0.0012, R = (o.r ?? 0.03) + wall, y0 = 0.032; const pts = [];
  for (let i = 0; i <= 14; i++) { const t = (i / 14) * (Math.PI / 2); pts.push([Math.max(0.0008, R * Math.sin(t)), y0 + R * (1 - Math.cos(t))]); }
  const v = new Vessel('mhemi', pts, { ...o, wall, name: o.name || { en: 'Hemisphere bowl (radius 3 cm)', hi: 'अर्धगोला कटोरा (त्रिज्या 3 cm)', hg: 'Hemisphere bowl (radius 3 cm)' } });
  v.grabY = y0 + R * 0.85; v.standY = y0 + R * 0.45; v.standR = R * Math.sqrt(1 - 0.55 * 0.55) + 0.002; return v;
}

// ------------------------------------------------------------------ a model flagpole and a clinometer (protractor, straw and plumb line)
export function poleAndClinometer(o = {}) {
  const it = new Item('mpole', { ...o, name: o.name || { en: 'Model flagpole and clinometer', hi: 'झंडे का मॉडल और क्लाइनोमीटर', hg: 'Flagpole model aur clinometer' } });
  const H = 0.28, EYE = 0.03, P = [0.13, 0.03]; // pole height 28 cm; the straw is 3 cm above the table
  it.g.add(board(-0.2, -0.04, 0.2, 0.09, '#b98a5a'));
  const steel = new THREE.MeshStandardMaterial({ color: 0xb8bec6, metalness: 0.8, roughness: 0.35 });
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.0022, 0.003, H, 12), steel); pole.position.set(P[0], H / 2, -P[1]); it.g.add(pole);
  const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.016, 0.006, 20), new THREE.MeshStandardMaterial({ color: 0x5a5f66, roughness: 0.6 })); foot.position.set(P[0], 0.003, -P[1]); it.g.add(foot);
  const flagT = canvasTex(96, 64, (x, W, Hh) => { x.fillStyle = '#ff9933'; x.fillRect(0, 0, W, Hh / 3); x.fillStyle = '#ffffff'; x.fillRect(0, Hh / 3, W, Hh / 3); x.fillStyle = '#138808'; x.fillRect(0, (2 * Hh) / 3, W, Hh / 3); x.strokeStyle = '#000080'; x.lineWidth = 2; x.beginPath(); x.arc(W / 2, Hh / 2, Hh / 7, 0, 7); x.stroke(); });
  const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.045, 0.03), new THREE.MeshStandardMaterial({ map: flagT, side: THREE.DoubleSide, roughness: 0.8 })); flag.position.set(P[0] - 0.0245, H - 0.02, -P[1]); it.g.add(flag);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.004, 12, 8), new THREE.MeshStandardMaterial({ color: 0xd8b24a, metalness: 0.7, roughness: 0.3 })); knob.position.set(P[0], H + 0.003, -P[1]); it.g.add(knob);
  // the clinometer: a protractor (half disc, curved edge down) with a straw along its straight edge, on a stand
  const clin = new THREE.Group(); it.g.add(clin);
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.0015, 0.0015, EYE, 8), steel); rod.position.y = EYE / 2; clin.add(rod);
  const tilt = new THREE.Group(); tilt.position.y = EYE; clin.add(tilt);
  const pr = 0.026; const scale = canvasTex(256, 128, (x, W, Hh) => { x.clearRect(0, 0, W, Hh); x.fillStyle = 'rgba(235,240,245,0.92)'; x.beginPath(); x.moveTo(0, 0); x.arc(W / 2, 0, W / 2, 0, Math.PI); x.closePath(); x.fill();
    x.strokeStyle = '#26303a'; x.lineWidth = 2; x.stroke(); x.fillStyle = '#26303a'; x.font = '600 13px sans-serif'; x.textAlign = 'center';
    for (let d = 0; d <= 90; d += 10) for (const sgn of [1, -1]) { const a = Math.PI / 2 + sgn * (d * Math.PI) / 180; const r0 = W / 2 - (d % 30 ? 8 : 14); x.beginPath(); x.moveTo(W / 2 + Math.cos(a) * (W / 2 - 2), Math.sin(a) * (W / 2 - 2)); x.lineTo(W / 2 + Math.cos(a) * r0, Math.sin(a) * r0); x.stroke(); if (!(d % 30) && !(d === 0 && sgn < 0)) x.fillText(String(d), W / 2 + Math.cos(a) * (W / 2 - 26), Math.sin(a) * (W / 2 - 26) + 4); } });
  const disc = new THREE.Mesh(new THREE.PlaneGeometry(2 * pr, pr), new THREE.MeshBasicMaterial({ map: scale, transparent: true, side: THREE.DoubleSide, depthWrite: false })); disc.position.y = -pr / 2; tilt.add(disc);
  const straw = new THREE.Mesh(new THREE.CylinderGeometry(0.0022, 0.0022, 0.06, 12, 1, true), new THREE.MeshStandardMaterial({ color: 0xe0573e, roughness: 0.5, side: THREE.DoubleSide })); straw.rotation.z = Math.PI / 2; tilt.add(straw);
  // the plumb line hangs straight down from the centre, whatever the tilt
  const thread = new THREE.Mesh(new THREE.CylinderGeometry(0.0003, 0.0003, 0.024, 4), new THREE.MeshBasicMaterial({ color: 0x222222 })); thread.position.y = EYE - 0.012; clin.add(thread);
  const bob = new THREE.Mesh(new THREE.ConeGeometry(0.0028, 0.006, 10), new THREE.MeshStandardMaterial({ color: 0x8a6a3a, metalness: 0.6, roughness: 0.4 })); bob.rotation.x = Math.PI; bob.position.y = EYE - 0.026; clin.add(bob);
  // the tape along the table from the clinometer to the foot of the pole
  const tapeT = canvasTex(1024, 32, (x, W, Hh) => { x.fillStyle = '#f5d742'; x.fillRect(0, 0, W, Hh); x.strokeStyle = '#26303a'; x.fillStyle = '#26303a'; x.font = '600 18px sans-serif'; for (let c = 0; c <= 30; c++) { const px = (c / 30) * W; x.lineWidth = c % 5 ? 1 : 2; x.beginPath(); x.moveTo(px, 0); x.lineTo(px, c % 5 ? 10 : 16); x.stroke(); if (!(c % 5) && c) x.fillText(String(c), px - 10, 30); } });
  tapeT.wrapS = THREE.ClampToEdgeWrapping;
  const tape = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.012), new THREE.MeshStandardMaterial({ map: tapeT, roughness: 0.6 })); tape.rotation.x = -Math.PI / 2; tape.position.set(0, 0.0026, -(P[1] - 0.016)); it.g.add(tape);
  // the line of sight from the straw to the top of the pole
  const sight = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(1, 0, 0)]), new THREE.LineDashedMaterial({ color: 0xc0392b, dashSize: 0.008, gapSize: 0.006 })); sight.visible = false; it.g.add(sight);
  it.d = 0.25; it.ang = 0;
  const place = () => {
    clin.position.set(P[0] - it.d, 0.002, -P[1]); tilt.rotation.z = it.ang;
    tape.scale.x = it.d; tape.position.x = P[0] - it.d / 2; tapeT.repeat.set(it.d / 0.3, 1); tapeT.offset.set(0, 0); tapeT.needsUpdate = true;
    const a = new THREE.Vector3(P[0] - it.d, EYE, -P[1]), b = new THREE.Vector3(P[0], H, -P[1]);
    sight.geometry.setFromPoints([a, a.clone().lerp(b, Math.min(1, it.sightK ?? 1))]); sight.computeLineDistances();
  };
  place();
  it.setDist = (d) => { it.d = d; place(); };
  it.aim = (deg, k) => { it.ang = ((deg * Math.PI) / 180) * ease(clamp01(k)); place(); };
  it.sightOn = (k) => { sight.visible = k > 0; it.sightK = ease(clamp01(k)); place(); };
  it.tapeOn = (on) => { tape.visible = on; };
  tape.visible = false;
  const W = (x, y, z) => it.g.localToWorld(new THREE.Vector3(x, y, z));
  it.at = (k) => k === 'top' ? W(P[0], H + 0.01, -P[1]) : k === 'clin' ? W(P[0] - it.d, EYE + 0.035, -P[1]) : k === 'tape' ? W(P[0] - it.d / 2, 0.012, -(P[1] - 0.03)) : k === 'mid' ? W(P[0] - it.d / 2, (EYE + H) / 2 + 0.02, -P[1]) : W(P[0], H / 2, -P[1]);
  it.noGrab = true; it.height = H; it.radius = 0.22; it.grabY = 0.01; return it;
}

// shared with later maths batches
export { paper, ink, flat, outline, dashed, ease, lerp, clamp01, rect, board, topLabel };
