// DUET Maths Lab 360, hands-on in 3D, batch 2: the student builds and moves things with their own hands (mouse drag, or
// hand / controller in the headset) and can stand inside the shape: (a + b)² grown into (a + b)³, a triangle cut and turned
// into a rectangle, a² + b² = c² with water, and speed inside a moving train.
import * as THREE from 'three';
import { Item } from './apparatus.js';
import { canvasTex } from './mats.js';
import { ease, lerp, clamp01 } from './mathlab2.js';
import { glow, rod, setRod, sign, stripe, setStripe, COL, handle, seg } from './mathworld.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const once = (f) => { let d = false; return (...a) => { if (!d) { d = true; f(...a); } }; };
// the step the student is on (handles work only in their own step)
const stepNow = (app, i) => { const r = app.runner; return !!(r.exp && r.i === i && r.state === 'todo'); };

// ------------------------------------------------------------------ Class 9: (a + b)² and then (a + b)³, built by hand
// Unit u = 10 cm on the table; a = 2 units, b = 1 unit. The 27 unit cells (i across, j towards the student, k up) are
// coloured by how many of their three sides are "a" (i < 2, j < 2, k < 2): 3 a³ blue, 2 a²b green, 1 ab² red, 0 b³ yellow.
export function identityCube(o = {}) {
  const it = new Item('wcube', { ...o, name: { en: '(a + b)³ blocks', hi: '(a + b)³ के ब्लॉक', hg: '(a + b)³ ke blocks' } });
  const u = o.u ?? 0.1, g = it.g;
  const cube = new THREE.Group(); g.add(cube); it.cube = cube;
  const C3 = { 3: new THREE.Color(0x3d7be0), 2: new THREE.Color(0x2ea36b), 1: new THREE.Color(0xd9493a), 0: new THREE.Color(0xf2c230) };
  const C2 = { 2: C3[3], 1: C3[2], 0: C3[0] }; // flat tiles: a² blue, ab green, b² yellow
  const geo = new THREE.BoxGeometry(0.94, 1, 0.94); geo.translate(0, 0.5, 0);
  const mat = new THREE.MeshStandardMaterial({ roughness: 0.42, metalness: 0.02, transparent: true, opacity: 1 });
  const cells = []; for (let k = 0; k < 3; k++) for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) cells.push({ i, j, k, n: (i < 2) + (j < 2) + (k < 2), n2: (i < 2) + (j < 2) });
  const im = new THREE.InstancedMesh(geo, mat, 27); im.castShadow = true; im.receiveShadow = true; im.frustumCulled = false; cube.add(im);
  // a thin white frame showing where the square of side a + b goes
  const fm = glow(0xffffff, 0.85), F = 1.5 * u + 0.006, fy = 0.002;
  const frame = new THREE.Group(); [[-F, -F, F, -F], [F, -F, F, F], [F, F, -F, F], [-F, F, -F, -F]].forEach(([x0, z0, x1, z1]) => frame.add(rod(V(x0, fy, z0), V(x1, fy, z1), 0.0025, fm))); cube.add(frame);
  // the four flat pieces start apart on the table; off[p] is how far each still is from its place (0 = in place)
  const P = { a2: { cells: (c) => c.i < 2 && c.j < 2, from: V(-0.42, 0, 0.02) }, b2: { cells: (c) => c.i === 2 && c.j === 2, from: V(0.38, 0, 0.13) },
    abx: { cells: (c) => c.i < 2 && c.j === 2, from: V(0.42, 0, -0.26) }, abz: { cells: (c) => c.i === 2 && c.j < 2, from: V(0.62, 0, -0.08) } };
  for (const k in P) P[k].off = 1;
  it.H = 0.08; // height in cells: a flat tile is 0.08 of a cell thick
  const M = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = V(1, 1, 1), pos = V(0, 0, 0);
  const pieceOf = (c) => Object.keys(P).find((k) => P[k].cells(c));
  const draw = () => {
    const H = it.H, flat = H < 0.5;
    cells.forEach((c, n) => {
      const h = clamp01(H - c.k); const p = P[pieceOf(c)];
      pos.set((c.i - 1) * u, c.k * u + 0.0006, (c.j - 1) * u).addScaledVector(p.from, p.off);
      sc.set(u, Math.max(1e-4, h * u), u); M.compose(pos, q, sc); im.setMatrixAt(n, h > 0.001 ? M : M.makeScale(0, 0, 0));
      im.setColorAt(n, flat ? C2[c.n2] : C3[c.n]);
    });
    im.instanceMatrix.needsUpdate = true; im.instanceColor.needsUpdate = true;
  };
  draw();
  it.place = (key, k) => { P[key].off = 1 - clamp01(k); draw(); };
  it.placed = (key) => P[key].off < 0.02;
  it.lift = (H) => { it.H = H; draw(); };
  it.see = (op) => { mat.opacity = op; mat.depthWrite = op > 0.99; frame.visible = op > 0.99; };
  // in the room (world) coordinates
  const W = (x, y, z) => cube.localToWorld(V(x, y, z));
  it.pieceTop = (key) => { const p = P[key], cs = cells.filter((c) => c.k === 0 && p.cells(c)); const x = cs.reduce((s, c) => s + (c.i - 1) * u, 0) / cs.length, z = cs.reduce((s, c) => s + (c.j - 1) * u, 0) / cs.length;
    return { home: W(x, 0.012, z), from: W(x + p.from.x, 0.012, z + p.from.z), now: W(x + p.from.x * p.off, 0.012, z + p.from.z * p.off) }; };
  // the lift handle: at the top front edge, pulled from left to right along it
  it.liftKnob = (k) => W(-1.5 * u - 0.03 + 0.36 * k, it.H * u + 0.012, 1.5 * u + 0.035);
  it.liftPath = () => [W(-1.5 * u - 0.03, it.H * u + 0.012, 1.5 * u + 0.035), W(-1.5 * u + 0.33, it.H * u + 0.012, 1.5 * u + 0.035)];
  // the middle of each kind of block (labels)
  it.centre = (n) => { const cs = cells.filter((c) => c.n === n); const v = V(0, 0, 0); for (const c of cs) v.add(V((c.i - 1) * u, (c.k + 0.5) * u, (c.j - 1) * u)); return W(v.x / cs.length, v.y / cs.length, v.z / cs.length); };
  // each of the 8 blocks of (a + b)³: its name and middle
  it.blocks = () => { const A = (c, v) => (v ? c < 2 : c === 2); const out = [];
    for (const [nm, ai, aj, ak] of [['a³', 1, 1, 1], ['a²b', 1, 1, 0], ['a²b', 1, 0, 1], ['a²b', 0, 1, 1], ['ab²', 1, 0, 0], ['ab²', 0, 1, 0], ['ab²', 0, 0, 1], ['b³', 0, 0, 0]]) {
      const cs = cells.filter((c) => A(c.i, ai) && A(c.j, aj) && A(c.k, ak)); const v = V(0, 0, 0); for (const c of cs) v.add(V((c.i - 1) * u, (c.k + 0.5) * u, (c.j - 1) * u)); v.divideScalar(cs.length);
      out.push({ name: nm, at: W(v.x, v.y, v.z), n: cs.length }); }
    return out; };
  it.at = (k) => ({ top: W(0, 3.6 * u, 0), side: W(1.5 * u + 0.08, 0.02, 0), front: W(0, 0.02, 1.5 * u + 0.07), a: W(-0.5 * u, 0.03, 1.5 * u + 0.06), b: W(u, 0.03, 1.5 * u + 0.06), sum: W(0, 0.12, 0), above: W(0, 4.4 * u, 0) }[k] || W(0, 0.2, 0));
  it.noGrab = true; it.noPhys = true; it.height = 0.3; it.radius = 0.2; it.grabY = 0.02; return it;
}
// joins the knobs to the blocks: step s1 places a² and b², s2 the two ab tiles, s3 raises by a, s4 by b
export function bindCubeHands(cube, knobs, app, s = { s1: 0, s2: 1, s3: 2, s4: 3 }, done = {}) {
  const prog = {};
  const tile = (key, knob, step) => handle(knob, {
    path: () => { const t = cube.pieceTop(key); return [t.from, t.home]; },
    active: () => stepNow(app, step) && !cube.placed(key), keepVisible: () => !cube.placed(key) && app.runner.i <= step,
    move: (k) => { prog[key] = Math.max(prog[key] || 0, k); cube.place(key, prog[key]); if (prog[key] > 0.92) { cube.place(key, 1); done.tile && done.tile(key); } },
    at: () => cube.pieceTop(key).now });
  tile('a2', knobs.a2, s.s1); tile('b2', knobs.b2, s.s1); tile('abx', knobs.abx, s.s2); tile('abz', knobs.abz, s.s2);
  let liftK = 0; const range = () => (app.runner.i === s.s4 ? [2, 3] : [0.08, 2]);
  handle(knobs.lift, {
    path: () => cube.liftPath(), active: () => (stepNow(app, s.s3) && cube.H < 1.98) || (stepNow(app, s.s4) && cube.H < 2.98), keepVisible: () => cube.H < 2.98 && app.runner.i >= s.s3 && app.runner.i <= s.s4,
    move: (k) => { const [h0, h1] = range(); liftK = Math.max(liftK, k); const H = lerp(h0, h1, liftK); cube.lift(Math.max(cube.H, H)); if (liftK > 0.95) { cube.lift(h1); liftK = 0; done.lift && done.lift(h1); } },
    at: () => cube.liftKnob(liftK) });
  const sync = () => { for (const key of ['a2', 'b2', 'abx', 'abz']) if (!knobs[key].held) knobs[key].g.position.copy(cube.pieceTop(key).now); if (!knobs.lift.held) knobs.lift.g.position.copy(cube.liftKnob(0)); };
  const p0 = cube.place, l0 = cube.lift; cube.place = (k, v) => { p0(k, v); sync(); }; cube.lift = (H) => { l0(H); sync(); };
  sync();
}

// ------------------------------------------------------------------ Class 6: area of a triangle, standing inside it
// A big cloth triangle on the ground around the student (base AB 3 m behind them, top C 2 m ahead). Cut along the line
// halfway up, cut the top piece down from C, and swing each small piece half a turn about the middle of its side: the
// triangle becomes a rectangle as long as the base and half as high.
let CLOTH = null;
const clothTex = () => CLOTH || (CLOTH = (() => { const t = canvasTex(256, 256, (x, w) => {
  x.fillStyle = '#d9692b'; x.fillRect(0, 0, w, w);
  for (let i = 0; i < w; i += 4) { x.fillStyle = i % 8 ? 'rgba(255,220,170,0.10)' : 'rgba(90,30,10,0.12)'; x.fillRect(i, 0, 2, w); x.fillRect(0, i, w, 2); }
  x.strokeStyle = 'rgba(255,236,190,0.55)'; x.lineWidth = 6; for (const y of [40, 216]) { x.beginPath(); x.moveTo(0, y); x.lineTo(w, y); x.stroke(); }
  x.fillStyle = 'rgba(255,236,190,0.5)'; for (let i = 0; i < 8; i++) { const cx = 16 + i * 32; x.beginPath(); x.moveTo(cx, 112); x.lineTo(cx + 12, 128); x.lineTo(cx, 144); x.lineTo(cx - 12, 128); x.closePath(); x.fill(); } });
  t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; })());
export function triangleCut(o = {}) {
  const it = new Item('wtriangle', { ...o, name: { en: 'Cloth triangle', hi: 'कपड़े का त्रिभुज', hg: 'Kapde ka triangle' } });
  const g = it.g, TH = 0.012;
  const A = new THREE.Vector2(-1.5, 0.5), B = new THREE.Vector2(1.5, 0.5), C = new THREE.Vector2(0.3, -1.5);
  const M1 = A.clone().add(C).multiplyScalar(0.5), M2 = B.clone().add(C).multiplyScalar(0.5), D = new THREE.Vector2(C.x, M1.y);
  it.pts = { A, B, C, M1, M2, D };
  const mat = new THREE.MeshStandardMaterial({ map: clothTex(), roughness: 0.95, color: 0x9a5a3a });
  // a flat piece of cloth (corners in x, z), its own pivot (where it turns) at p
  const piece = (pts, pivot) => {
    const sh = new THREE.Shape(pts.map((p) => new THREE.Vector2(p.x - pivot.x, -(p.y - pivot.y))));
    const geo = new THREE.ExtrudeGeometry(sh, { depth: TH, bevelEnabled: false }); geo.rotateX(-Math.PI / 2);
    const uv = geo.attributes.uv, ps = geo.attributes.position; for (let i = 0; i < uv.count; i++) uv.setXY(i, (ps.getX(i) + pivot.x) / 0.6, (ps.getZ(i) + pivot.y) / 0.6);
    const m = new THREE.Mesh(geo, mat); m.castShadow = true; m.receiveShadow = true;
    const pg = new THREE.Group(); pg.position.set(pivot.x, 0.004, pivot.y); pg.add(m); g.add(pg); return pg;
  };
  const trap = piece([A, B, M2, M1], new THREE.Vector2(0, 0)), L = piece([M1, D, C], M1), R = piece([D, M2, C], M2);
  void trap;
  // chalk lines: where to cut (dotted), and the cuts made
  const chalk = glow(0xffffff, 0.9), Y = TH + 0.006;
  const W3 = (p, y = Y) => V(p.x, y, p.y);
  const guide = new THREE.Group(); g.add(guide);
  const dots = (a, b) => { const n = Math.round(a.distanceTo(b) / 0.12); for (let i = 0; i < n; i++) { const k0 = i / n, k1 = (i + 0.45) / n; guide.add(stripe(W3(a.clone().lerp(b, k0)), W3(a.clone().lerp(b, k1)), 0.025, chalk, Y)); } };
  dots(M1, M2); dots(C, D);
  const cut1 = stripe(W3(M1), W3(M1), 0.02, glow(0x3a1d0c), Y + 0.001), cut2 = stripe(W3(C), W3(C), 0.02, glow(0x3a1d0c), Y + 0.001); g.add(cut1, cut2); cut1.visible = cut2.visible = false;
  // measures: base, height (from C straight down to the base) and the rectangle's grid
  const base = stripe(W3(A, 0), W3(B, 0), 0.05, glow(COL.base), Y + 0.002), F = new THREE.Vector2(C.x, A.y);
  const ht = rod(W3(C, 0.03), W3(F, 0.03), 0.018, glow(COL.up)); const rm = new THREE.Group(); rm.add(rod(W3(new THREE.Vector2(F.x + 0.15, F.y), 0.03), W3(new THREE.Vector2(F.x + 0.15, F.y - 0.15), 0.03), 0.01, glow(COL.up)), rod(W3(new THREE.Vector2(F.x + 0.15, F.y - 0.15), 0.03), W3(new THREE.Vector2(F.x, F.y - 0.15), 0.03), 0.01, glow(COL.up)));
  for (const m of [base, ht, rm]) { m.visible = false; g.add(m); }
  const grid = new THREE.Group(); for (const x of [-0.5, 0.5]) grid.add(stripe(W3(new THREE.Vector2(x, A.y)), W3(new THREE.Vector2(x, M1.y)), 0.03, glow(0xffffff, 0.95), Y + 0.003));
  grid.add(stripe(W3(new THREE.Vector2(A.x, M1.y)), W3(new THREE.Vector2(B.x, M1.y)), 0.03, glow(0xffffff, 0.95), Y + 0.003)); grid.visible = false; g.add(grid);
  it.cutK = [0, 0]; it.swingK = [0, 0];
  it.cut = (n, k) => { it.cutK[n] = Math.max(it.cutK[n], clamp01(k)); const [a, b, m] = n === 0 ? [M1, M2, cut1] : [C, D, cut2]; setStripe(m, W3(a), W3(a.clone().lerp(b, it.cutK[n]))); m.visible = it.cutK[n] > 0.01; if (it.cutK[0] > 0.97 && it.cutK[1] > 0.97) guide.visible = false; };
  // swing piece n (0 left about M1, 1 right about M2) half a turn, lifting it into the air on the way
  it.swing = (n, k) => { it.swingK[n] = Math.max(it.swingK[n], clamp01(k)); const e = it.swingK[n], pg = n === 0 ? L : R, sgn = n === 0 ? 1 : -1;
    pg.rotation.set(0, sgn * Math.PI * e, 0); pg.position.y = 0.004 + 0.6 * Math.sin(Math.PI * e) + (e > 0.999 ? 0.001 : 0); pg.rotation.z = sgn * 0.35 * Math.sin(Math.PI * e); cut1.visible = it.cutK[0] > 0.01 && (it.swingK[0] < 0.999 || it.swingK[1] < 0.999); cut2.visible = it.cutK[1] > 0.01 && it.swingK[0] < 0.05 && it.swingK[1] < 0.05; };
  it.tip = (n) => { const pg = n === 0 ? L : R; pg.updateMatrixWorld(true); const c = n === 0 ? C.clone().sub(M1) : C.clone().sub(M2); return pg.localToWorld(V(c.x, TH, c.y)); };
  it.measures = (on) => { base.visible = ht.visible = rm.visible = on; };
  it.grid = (on) => { grid.visible = on; };
  const H = 0.85; // handles float at waist height, above what they move
  it.knobCut = (n) => { const [a, b] = n === 0 ? [M1, M2] : [C, D]; const p = a.clone().lerp(b, it.cutK[n]); return g.localToWorld(V(p.x, H, p.y)); };
  it.cutPath = (n) => { const [a, b] = n === 0 ? [M1, M2] : [C, D]; return [g.localToWorld(V(a.x, H, a.y)), g.localToWorld(V(b.x, H, b.y))]; };
  it.knobSwing = (n) => it.tip(n).setY(H);
  it.swingPath = (n) => [g.localToWorld(V(C.x, H, C.y)), g.localToWorld(V(n === 0 ? A.x : B.x, H, A.y))];
  it.at = (k) => ({ base: g.localToWorld(V(0, 0.3, A.y + 0.25)), ht: g.localToWorld(V(C.x + 0.35, 0.45, (C.y + A.y) / 2)), cutL: g.localToWorld(V(-1.1, 0.4, -0.2)), cutR: g.localToWorld(V(1.4, 0.4, -0.2)),
    rect: g.localToWorld(V(0, 1.15, -1.2)), rect2: g.localToWorld(V(0, 0.85, -1.2)), w: g.localToWorld(V(0, 0.25, A.y + 0.3)), h: g.localToWorld(V(B.x + 0.35, 0.3, 0)), top: g.localToWorld(V(C.x, 0.5, C.y - 0.2)) }[k] || g.localToWorld(V(0, 1, -1)));
  it.noGrab = true; it.noPhys = true; it.height = 0.02; it.radius = 2; it.base = 0; return it;
}
// four handles: cut 1 (step s1), cut 2 (also step s1, after cut 1), swing left (s2), swing right (s3)
export function bindTriangleHands(tri, knobs, app, s = { s1: 1, s2: 2, s3: 3 }, done = {}) {
  const pos = { c0: () => tri.knobCut(0), c1: () => tri.knobCut(1), s0: () => tri.knobSwing(0), s1: () => tri.knobSwing(1) };
  handle(knobs.c0, { path: () => tri.cutPath(0), active: () => stepNow(app, s.s1) && tri.cutK[0] < 0.97, keepVisible: () => app.runner.i === s.s1 && tri.cutK[0] < 0.97,
    move: (k) => { tri.cut(0, k); if (tri.cutK[0] > 0.93) { tri.cut(0, 1); done.cut && done.cut(); } }, at: pos.c0 });
  handle(knobs.c1, { path: () => tri.cutPath(1), active: () => stepNow(app, s.s1) && tri.cutK[0] >= 0.97 && tri.cutK[1] < 0.97, keepVisible: () => app.runner.i === s.s1 && tri.cutK[0] >= 0.97 && tri.cutK[1] < 0.97,
    move: (k) => { tri.cut(1, k); if (tri.cutK[1] > 0.93) { tri.cut(1, 1); done.cut && done.cut(); } }, at: pos.c1 });
  handle(knobs.s0, { path: () => tri.swingPath(0), active: () => stepNow(app, s.s2) && tri.swingK[0] < 0.97, keepVisible: () => app.runner.i === s.s2 && tri.swingK[0] < 0.97,
    move: (k) => { tri.swing(0, k); if (tri.swingK[0] > 0.93) { tri.swing(0, 1); done.swing && done.swing(0); } }, at: pos.s0 });
  handle(knobs.s1, { path: () => tri.swingPath(1), active: () => stepNow(app, s.s3) && tri.swingK[1] < 0.97, keepVisible: () => app.runner.i === s.s3 && tri.swingK[1] < 0.97,
    move: (k) => { tri.swing(1, k); if (tri.swingK[1] > 0.93) { tri.swing(1, 1); done.swing && done.swing(1); } }, at: pos.s1 });
  const sync = () => { for (const k in pos) if (!knobs[k].held) knobs[k].g.position.copy(pos[k]()); };
  const c0 = tri.cut, s0 = tri.swing; tri.cut = (n, k) => { c0(n, k); sync(); }; tri.swing = (n, k) => { s0(n, k); sync(); };
  sync();
}

// ------------------------------------------------------------------ Class 8: a² + b² = c² with water, in 3D
// A clear wheel standing on the table: a right triangle (3, 4, 5) in the middle and a square box on each side, all the same
// depth. The two small boxes hold water (a² = 9 and b² = 16 small squares). Slide the lever: the wheel turns half a turn
// and the water runs through the middle into the big box on the hypotenuse, and fills it exactly (c² = 25).
const shoelace = (P) => { let a = 0; for (let i = 0; i < P.length; i++) { const p = P[i], q = P[(i + 1) % P.length]; a += p.x * q.y - q.x * p.y; } return Math.abs(a) / 2; };
const clipBelow = (P, y) => { const out = []; for (let i = 0; i < P.length; i++) { const p = P[i], q = P[(i + 1) % P.length], pi = p.y <= y, qi = q.y <= y;
  if (pi) out.push(p); if (pi !== qi) { const t = (y - p.y) / (q.y - p.y); out.push(new THREE.Vector2(p.x + (q.x - p.x) * t, y)); } } return out; };
export function pythagorasWheel(o = {}) {
  const it = new Item('wpywheel', { ...o, name: { en: 'Pythagoras water wheel', hi: 'पाइथागोरस पानी का पहिया', hg: 'Pythagoras paani ka wheel' } });
  const g = it.g, u = o.u ?? 0.034, D = 0.03, CY = 0.37; // unit, box depth, height of the wheel's centre above the table
  const v2 = (x, y) => new THREE.Vector2(x * u, y * u);
  const H1 = v2(-2.5, 0), H2 = v2(2.5, 0), R = v2(-0.7, -2.4), G = H1.clone().add(H2).add(R).multiplyScalar(1 / 3);
  const sq = (P, Q, Op) => { const d = Q.clone().sub(P), n = new THREE.Vector2(-d.y, d.x); if (n.dot(Op.clone().sub(P)) > 0) n.negate(); return [P, Q, Q.clone().add(n), P.clone().add(n)].map((p) => p.clone().sub(G)); };
  const tanks = [{ name: 'a²', sq: sq(H1, R, H2), area: 9 }, { name: 'b²', sq: sq(R, H2, H1), area: 16 }, { name: 'c²', sq: sq(H2, H1, R), area: 25 }];
  const tri = [H1, H2, R].map((p) => p.clone().sub(G));
  // the wheel: clear plastic, square boxes outlined in white, the triangle frosted; it turns about its centre
  const wheel = new THREE.Group(); wheel.position.set(0, CY, 0); g.add(wheel);
  const clear = new THREE.MeshStandardMaterial({ color: 0xdfefff, roughness: 0.15, metalness: 0, transparent: true, opacity: 0.16, depthWrite: false, side: THREE.DoubleSide });
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(7.2 * u, 7.2 * u, 0.006, 64).rotateX(Math.PI / 2), clear); disc.position.z = -D / 2 - 0.004; wheel.add(disc);
  const edgeM = new THREE.MeshStandardMaterial({ color: 0xf4f7fa, roughness: 0.3 });
  const outline = (poly, r = 0.0025) => { for (let i = 0; i < poly.length; i++) { const p = poly[i], q = poly[(i + 1) % poly.length]; for (const z of [-D / 2, D / 2]) wheel.add(rod(V(p.x, p.y, z), V(q.x, q.y, z), r, edgeM)); } };
  for (const t of tanks) outline(t.sq); outline(tri, 0.003);
  const triM = new THREE.Mesh(new THREE.ShapeGeometry(new THREE.Shape(tri)), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6, transparent: true, opacity: 0.5, depthWrite: false, side: THREE.DoubleSide })); wheel.add(triM);
  const axle = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, D + 0.05, 20).rotateX(Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x9aa3ad, metalness: 0.8, roughness: 0.3 })); wheel.add(axle);
  // the stand and the lever that turns it (a slider on the base, geared to the wheel)
  const wood = new THREE.MeshStandardMaterial({ color: 0x8a5a36, roughness: 0.7 }), steel = new THREE.MeshStandardMaterial({ color: 0xb8c0c8, metalness: 0.8, roughness: 0.3 });
  const box = (sx, sy, sz, x, y, z, m) => { const b = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), m); b.position.set(x, y, z); b.castShadow = b.receiveShadow = true; g.add(b); return b; };
  box(0.46, 0.025, 0.16, 0, 0.0125, 0.02, wood); box(0.03, CY, 0.03, 0, CY / 2 + 0.02, -D / 2 - 0.03, wood);
  const rail = box(0.36, 0.008, 0.012, 0, 0.03, 0.075, steel); void rail;
  // water: one shape per box, drawn upright (the wheel turns, the water stays level)
  const water = new THREE.Group(); water.position.set(0, CY, 0); g.add(water);
  const wm = new THREE.MeshStandardMaterial({ color: 0x2f8fd8, roughness: 0.1, transparent: true, opacity: 0.78, depthWrite: false });
  for (const t of tanks) { t.mesh = new THREE.Mesh(new THREE.BufferGeometry(), wm); t.mesh.renderOrder = 2; water.add(t.mesh); }
  const stream = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.006, 1, 10), wm); stream.visible = false; water.add(stream);
  it.theta = 0; it.f = 0;
  const lay = () => {
    const th = it.theta, c = Math.cos(th), s = Math.sin(th), rot = (p) => new THREE.Vector2(p.x * c - p.y * s, p.x * s + p.y * c);
    const amt = [9 * (1 - it.f), 16 * (1 - it.f), 25 * it.f];
    tanks.forEach((t, i) => {
      const P = t.sq.map(rot), A = amt[i] * u * u; t.mesh.geometry.dispose();
      if (A < 1e-7) { t.mesh.geometry = new THREE.BufferGeometry(); t.level = null; return; }
      let lo = Math.min(...P.map((p) => p.y)), hi = Math.max(...P.map((p) => p.y));
      for (let k = 0; k < 30; k++) { const m = (lo + hi) / 2; if (shoelace(clipBelow(P, m)) < A) lo = m; else hi = m; }
      const poly = clipBelow(P, (lo + hi) / 2); t.level = (lo + hi) / 2; t.cx = poly.reduce((q, p) => q + p.x, 0) / poly.length;
      const geo = new THREE.ExtrudeGeometry(new THREE.Shape(poly), { depth: D - 0.004, bevelEnabled: false }); geo.translate(0, 0, -(D - 0.004) / 2); t.mesh.geometry = geo;
    });
    wheel.rotation.z = th;
    const big = tanks[2]; const flowing = it.f > 0.002 && it.f < 0.998;
    stream.visible = flowing; if (flowing && big.level != null) { const top = 0.0, bot = big.level; const L = Math.max(0.005, top - bot); stream.scale.y = L; stream.position.set(0.005, (top + bot) / 2, 0); }
  };
  lay();
  it.turn = (k) => { it.turnK = Math.max(it.turnK || 0, clamp01(k)); it.theta = Math.PI * ease(it.turnK); it.f = THREE.MathUtils.smoothstep(it.theta, 0.5 * Math.PI, 0.95 * Math.PI); lay(); };
  const W = (x, y, z) => g.localToWorld(V(x, y, z));
  it.leverAt = () => W(-0.17 + 0.34 * (it.turnK || 0), 0.05, 0.075);
  it.leverPath = () => [W(-0.17, 0.05, 0.075), W(0.17, 0.05, 0.075)];
  // where the boxes are now (labels), in the room
  it.tankAt = (i) => { const th = it.theta, c = Math.cos(th), s = Math.sin(th); const m = tanks[i].sq.reduce((q, p) => q.add(p), new THREE.Vector2()).multiplyScalar(0.25); return W(m.x * c - m.y * s, CY + m.x * s + m.y * c, D / 2 + 0.03); };
  it.at = (k) => ({ top: W(-0.4, CY + 0.12, 0.04), sum: W(-0.4, CY + 0.06, 0.04), lever: W(0, 0.09, 0.12) }[k] || W(0, CY + 0.3, 0));
  it.noGrab = true; it.noPhys = true; it.height = CY + 0.3; it.radius = 0.25; it.base = 0; return it;
}
export function bindWheelHands(w, knob, app, step = 1, done = {}) {
  handle(knob, { path: () => w.leverPath(), active: () => stepNow(app, step) && (w.turnK || 0) < 0.97, keepVisible: () => (w.turnK || 0) < 0.97 && app.runner.i <= step,
    move: (k) => { w.turn(k); if ((w.turnK || 0) > 0.95) { w.turn(1); done.turn && done.turn(); } }, at: () => w.leverAt() });
  const t0 = w.turn; w.turn = (k) => { t0(k); if (!knob.held) knob.g.position.copy(w.leverAt()); };
  knob.g.position.copy(w.leverAt());
}

// ------------------------------------------------------------------ Class 8: speed, from inside a moving train
// The student sits by a window of a moving train (the coach stands still; the world outside slides past at the train's
// speed). Masts beside the track are 50 m apart. A ball rolls along the shelf under the windows; another train passes.
const canvasRep = (w, h, draw, rx, ry) => { const t = canvasTex(w, h, draw); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); return t; };
export function trainRide(o = {}) {
  const it = new Item('wtrain', { ...o, name: { en: 'Train coach', hi: 'रेल का डिब्बा', hg: 'Train ka dibba' } });
  const g = it.g, SPEED = o.speed ?? 20; it.speed = SPEED;
  // ---- the coach (it does not move): walls with barred windows, benches, a shelf under the windows, fans and lights
  const WZ = -0.85, Z2 = 2.15, X0 = -9, X1 = 9, TOP = 2.6, SILL = 0.85, WIN = 1.75;
  const parts = new Map(); const add = (m, geo) => { if (!parts.has(m)) parts.set(m, []); parts.get(m).push(geo); };
  const bx = (m, sx, sy, sz, x, y, z) => { const b = new THREE.BoxGeometry(sx, sy, sz); b.translate(x, y, z); add(m, b); };
  const M = (c, r = 0.7, e = 0) => new THREE.MeshStandardMaterial({ color: c, roughness: r, emissive: c, emissiveIntensity: e });
  const wallLo = M(0x4f6f8a, 0.6, 0.08), wallHi = M(0xb9c6cf, 0.8, 0.08), floor = M(0x5e5a55, 0.9, 0.06), ceil = M(0xdfe5ea, 0.9, 0.12), seat = M(0x26467e, 0.55, 0.06), steel = new THREE.MeshStandardMaterial({ color: 0xb9c2ca, metalness: 0.8, roughness: 0.35 }), shelf = M(0x8a6a4a, 0.6, 0.12), dark = M(0x2a2e33, 0.8, 0.05);
  bx(floor, X1 - X0, 0.04, Z2 - WZ, 0, -0.02, (WZ + Z2) / 2); bx(ceil, X1 - X0, 0.04, Z2 - WZ, 0, TOP + 0.02, (WZ + Z2) / 2);
  bx(wallLo, X1 - X0, SILL, 0.06, 0, SILL / 2, WZ - 0.03); bx(wallHi, X1 - X0, TOP - WIN, 0.06, 0, (WIN + TOP) / 2, WZ - 0.03); // window wall, below and above the windows
  bx(wallLo, X1 - X0, 1.0, 0.06, 0, 0.5, Z2 + 0.03); bx(wallHi, X1 - X0, TOP - 1.0, 0.06, 0, 1.0 + (TOP - 1.0) / 2, Z2 + 0.03); // the far wall (no windows open)
  for (const x of [X0, X1]) bx(wallHi, 0.06, TOP, Z2 - WZ, x, TOP / 2, (WZ + Z2) / 2);
  const bays = []; for (let x = -8; x <= 8; x += 2) bays.push(x);
  for (const x of bays) {
    bx(wallHi, 0.9, WIN - SILL, 0.06, x + 1, (SILL + WIN) / 2, WZ - 0.03); // the pillar between two windows
    for (let i = 1; i <= 4; i++) { const b = new THREE.CylinderGeometry(0.008, 0.008, 1.1, 8); b.rotateZ(Math.PI / 2); b.translate(x, SILL + (i * (WIN - SILL)) / 5, WZ - 0.02); add(steel, b); } // window bars
    bx(dark, 1.14, 0.03, 0.08, x, WIN + 0.01, WZ - 0.03); bx(dark, 1.14, 0.03, 0.08, x, SILL - 0.01, WZ - 0.03);
    for (const sx of [-0.85, 0.85]) { bx(seat, 0.5, 0.1, 1.5, x + sx, 0.45, WZ + 0.85); bx(seat, 0.1, 0.62, 1.5, x + sx + Math.sign(sx) * 0.22, 0.8, WZ + 0.85); bx(dark, 0.45, 0.42, 0.06, x + sx, 0.21, WZ + 0.2); } // benches facing each other
    bx(ceil, 0.08, 0.04, 1.2, x + 1, TOP - 0.03, 0.6); // a tube light
    bx(steel, 0.04, 0.04, 2.6, x + 1, TOP - 0.25, (WZ + Z2) / 2); // a hand rail along the roof
  }
  bx(shelf, X1 - X0 - 0.2, 0.03, 0.22, 0, SILL - 0.02, WZ + 0.11); // the long shelf under the windows
  const coach = new THREE.Group(); g.add(coach);
  for (const [m, list] of parts) { const mesh = new THREE.Mesh(mergeGeometries(list), m); mesh.userData.noHit = true; coach.add(mesh); }
  const tubeM = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }); for (const x of bays) { const t = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.02, 1.1), tubeM); t.position.set(x + 1, TOP - 0.055, 0.6); coach.add(t); }
  const fans = []; for (const x of [-4, 0, 4]) { const f = new THREE.Group(); f.position.set(x + 1, TOP - 0.35, 0.65); const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.08, 16), dark); f.add(hub);
    for (let i = 0; i < 3; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.01, 0.08), dark); b.position.x = 0.24; const p = new THREE.Group(); p.rotation.y = (i * 2 * Math.PI) / 3; p.add(b); f.add(p); } coach.add(f); fans.push(f); }
  // ---- outside: ground and the next track slide past; masts every 50 m, trees and bushes
  const field = canvasRep(512, 512, (x, w) => { x.fillStyle = '#7a5c3c'; x.fillRect(0, 0, w, w); for (let i = 0; i < 2600; i++) { x.fillStyle = `rgba(${60 + Math.random() * 60},${40 + Math.random() * 30},${20},${Math.random() * 0.35})`; x.fillRect(Math.random() * w, Math.random() * w, 3 + Math.random() * 9, 2 + Math.random() * 5); }
    for (let r = 0; r < w; r += 32) { x.fillStyle = 'rgba(70,120,40,0.85)'; for (let c = 0; c < w; c += 7) { x.beginPath(); x.ellipse(r + 8 + Math.random() * 6, c, 4 + Math.random() * 3, 3, 0, 0, 7); x.fill(); } } }, 40, 40);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: field, roughness: 1 })); ground.position.set(0, -0.05, -200 + WZ - 1.2); ground.userData.noHit = true; g.add(ground);
  const ballast = canvasRep(256, 128, (x, w, h) => { x.fillStyle = '#6d665e'; x.fillRect(0, 0, w, h); for (let i = 0; i < 1500; i++) { const c = 70 + Math.random() * 80; x.fillStyle = `rgb(${c},${c * 0.95},${c * 0.9})`; x.fillRect(Math.random() * w, Math.random() * h, 3, 3); }
    for (let s = 0; s < w; s += 32) { x.fillStyle = '#4a4540'; x.fillRect(s + 6, 18, 18, h - 36); } }, 100, 1);
  const track = new THREE.Mesh(new THREE.PlaneGeometry(400, 3).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: ballast, roughness: 1 })); track.position.set(0, -0.02, -5.2); g.add(track);
  for (const z of [-5.92, -4.48]) { const r = new THREE.Mesh(new THREE.BoxGeometry(400, 0.08, 0.07), steel); r.position.set(0, 0.04, z); g.add(r); }
  const wire = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 400, 6).rotateZ(Math.PI / 2), dark); wire.position.set(0, 5.6, -5.2); g.add(wire);
  const mastM = new THREE.MeshStandardMaterial({ color: 0x8c949b, metalness: 0.5, roughness: 0.5 });
  const mastGeo = mergeGeometries([new THREE.BoxGeometry(0.28, 7, 0.22).translate(0, 3.5, 0), new THREE.BoxGeometry(0.08, 0.08, 2.4).translate(0, 5.9, -1.2), new THREE.BoxGeometry(0.4, 0.6, 0.4).translate(0, 0.3, 0)]);
  const masts = []; for (let i = 0; i < 8; i++) { const m = new THREE.Mesh(mastGeo, mastM); m.position.set(-175 + i * 50, 0, -3.1); g.add(m); masts.push(m); }
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.3), new THREE.MeshBasicMaterial({ map: canvasTex(128, 76, (x, w, h) => { x.fillStyle = '#f4d23a'; x.fillRect(0, 0, w, h); x.fillStyle = '#111'; x.font = '700 44px sans-serif'; x.textAlign = 'center'; x.fillText('50 m', w / 2, 54); }) }));
  masts.forEach((m) => { const p = plate.clone(); p.position.set(0, 2.2, 0.12); m.add(p); });
  const treeN = 70, trunk = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.12, 0.2, 2.4, 6).translate(0, 1.2, 0), M(0x5a4030, 0.9), treeN), crown = new THREE.InstancedMesh((() => { const lumps = [[0, 3.7, 0, 1.5], [0.9, 3.2, 0.3, 1.1], [-0.8, 3.3, -0.2, 1.15], [0.2, 4.5, 0.1, 1.0]].map(([x, y, z, r]) => { const q = new THREE.IcosahedronGeometry(r, 1); const p = q.attributes.position;
    for (let i = 0; i < p.count; i++) { const k = 1 + (Math.sin(p.getX(i) * 7 + p.getY(i) * 5) * 0.08 + Math.cos(p.getZ(i) * 9) * 0.06); p.setXYZ(i, p.getX(i) * k, p.getY(i) * k * 0.85, p.getZ(i) * k); } q.translate(x, y, z); return q; });
    const m = mergeGeometries(lumps.map((q) => q.toNonIndexed())); m.computeVertexNormals(); return m; })(), new THREE.MeshStandardMaterial({ color: 0x4d6b30, roughness: 0.95, flatShading: true }), treeN);
  const trees = []; for (let i = 0; i < treeN; i++) { trees.push({ x: -200 + Math.random() * 400, z: -9 - Math.random() * 70, s: 0.7 + Math.random() * 1.1 }); } g.add(trunk, crown);
  const tm = new THREE.Matrix4(), tq = new THREE.Quaternion(), tv = V(0, 0, 0), ts = V(1, 1, 1);
  const drawTrees = () => { trees.forEach((t, i) => { ts.setScalar(t.s); tm.compose(tv.set(t.x, 0, t.z), tq, ts); trunk.setMatrixAt(i, tm); crown.setMatrixAt(i, tm); }); trunk.instanceMatrix.needsUpdate = crown.instanceMatrix.needsUpdate = true; };
  drawTrees();
  // ---- the other train (8 coaches, 175 m) on the next track
  const livery = canvasTex(512, 128, (x, w, h) => { x.fillStyle = '#1f4f9a'; x.fillRect(0, 0, w, h); x.fillStyle = '#f2f2f2'; x.fillRect(0, 70, w, 8); x.fillStyle = '#d23b2a'; x.fillRect(0, 82, w, 6);
    x.fillStyle = '#1a2230'; for (let i = 0; i < 12; i++) x.fillRect(14 + i * 41, 26, 28, 30); x.fillStyle = '#0d1118'; x.fillRect(4, 22, 18, 74); x.fillRect(w - 22, 22, 18, 74); });
  const other = new THREE.Group(); other.visible = false; g.add(other); const CL = 175 / 8;
  { const list = []; for (let i = 0; i < 8; i++) { const b = new THREE.BoxGeometry(CL - 0.8, 3.6, 3.0); b.translate(-(i * CL + CL / 2), 2.2, -5.2); list.push(b); } const c = new THREE.Mesh(mergeGeometries(list), new THREE.MeshStandardMaterial({ map: livery, roughness: 0.6 })); other.add(c); } // 8 coaches, one draw
  const nose = new THREE.Mesh(new THREE.BoxGeometry(2.4, 3.8, 3.0), M(0xc8372b, 0.5, 0.1)); nose.position.set(0.4, 2.3, -5.2); other.add(nose);
  it.other = { x: -400, on: false, speed: 15 };
  // ---- a stopwatch and a ball on the shelf, and speed arrows
  const watchC = document.createElement('canvas'); watchC.width = 256; watchC.height = 128; const watchT = new THREE.CanvasTexture(watchC); watchT.colorSpace = THREE.SRGBColorSpace;
  const watch = new THREE.Group(); watch.position.set(0.32, SILL + 0.035, WZ + 0.12); g.add(watch);
  const wb = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.035, 0.08), M(0xe0a020, 0.5, 0.1)); watch.add(wb);
  const face = new THREE.Mesh(new THREE.PlaneGeometry(0.09, 0.045), new THREE.MeshBasicMaterial({ map: watchT, toneMapped: false })); face.rotation.x = -Math.PI / 2 + 0.5; face.position.set(0, 0.026, 0.005); watch.add(face);
  const btn = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.012, 16), M(0xd23b2a, 0.4, 0.2)); btn.position.set(0, 0.024, -0.03); watch.add(btn);
  it.watch = { t: 0, run: false, shown: -1 };
  const drawWatch = () => { const t = it.watch.t, s = t.toFixed(2); if (s === it.watch.shown) return; it.watch.shown = s; const x = watchC.getContext('2d'); x.fillStyle = '#c9d8b8'; x.fillRect(0, 0, 256, 128); x.fillStyle = '#1b2414'; x.font = '700 76px monospace'; x.textAlign = 'center'; x.fillText(s, 128, 92); x.font = '600 26px monospace'; x.fillText(it.watch.run ? '● s' : 's', 222, 36); watchT.needsUpdate = true; };
  drawWatch();
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.035, 24, 16), new THREE.MeshStandardMaterial({ color: 0xd8302a, roughness: 0.35 })); ball.position.set(0, SILL + 0.034, WZ + 0.11); ball.castShadow = true; g.add(ball); it.ball = ball;
  it.ballV = 0;
  const arrow = (c) => { const gr = new THREE.Group(); const m = glow(c); const sh = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 1, 10).rotateZ(Math.PI / 2), m); const hd = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.08, 14).rotateZ(Math.PI / 2), m); gr.add(sh, hd); gr.visible = false; g.add(gr);
    gr.set = (x0, len, y) => { const L = Math.abs(len), sgn = Math.sign(len) || 1; sh.scale.x = Math.max(0.001, L - 0.08); sh.position.x = sgn * (L - 0.08) / 2; hd.position.x = sgn * (L - 0.04); hd.rotation.z = sgn > 0 ? Math.PI : 0; gr.position.set(x0, y, WZ + 0.05); gr.visible = L > 0.01; }; return gr; };
  it.arrows = { train: arrow(COL.base), ball: arrow(COL.up), total: arrow(COL.ok) };
  // ---- every frame: the world outside moves back at the train's speed
  it.update = (dt) => {
    dt = Math.min(dt || 0.016, 0.05); const d = SPEED * dt;
    field.offset.x -= d / 10; ballast.offset.x -= d / 4;
    for (const m of masts) { m.position.x += d; if (m.position.x > 225) m.position.x -= 400; }
    for (const t of trees) { t.x += d; if (t.x > 200) { t.x -= 400; t.z = -9 - Math.random() * 70; } } drawTrees();
    if (it.other.on) { it.other.x += (SPEED + it.other.speed) * dt; other.position.x = it.other.x; other.visible = it.other.x < 450; if (it.other.x > 450) it.other.on = false; }
    for (const f of fans) f.rotation.y += dt * 9;
    if (it.watch.run) it.watch.t += dt; drawWatch();
    if (it.ballV) it.ballHome = false; else if (it.ballHome) { const d = -ball.position.x, st = Math.sign(d) * Math.min(Math.abs(d), 1.5 * dt); ball.position.x += st; ball.rotation.z -= st / 0.035; if (Math.abs(d) < 1e-3) it.ballHome = false; } // rolls back to the student
    if (it.ballV) { ball.position.x += it.ballV * dt; ball.rotation.z -= (it.ballV * dt) / 0.035; if (Math.abs(ball.position.x) > 2.6) it.ballV = 0; }
  };
  // the next mast to pass the window (x = 0) arrives in this many seconds
  it.nextMast = () => { let best = 1e9; for (const m of masts) { const dx = -m.position.x; if (dx > 0.05 && dx / SPEED < best) best = dx / SPEED; } return best; };
  it.sendTrain = () => { it.other.x = -(SPEED + it.other.speed) * 3; it.other.on = true; other.position.x = it.other.x; other.visible = true; }; // its engine reaches the window in 3 s
  it.ballKnob = () => V(ball.position.x + 0.07, SILL + 0.05, WZ + 0.11);
  it.ballPath = (dir) => [V(ball.position.x + 0.07, SILL + 0.05, WZ + 0.11), V(ball.position.x + 0.07 + dir * 0.3, SILL + 0.05, WZ + 0.11)];
  g.traverse((m) => { if (m.isMesh) m.userData.noHit = true; }); for (const m of [wb, face, btn, ball]) m.userData.noHit = false;
  it.at = (k) => ({ watch: V(0.32, SILL + 0.16, WZ + 0.12), win: V(0, WIN + 0.22, WZ + 0.05), calc: V(0, WIN + 0.5, WZ + 0.05), calc2: V(0, WIN + 0.3, WZ + 0.05), ball: V(0, SILL + 0.22, WZ + 0.1), out: V(0, 1.25, -5.2) }[k] || V(0, 1.6, -0.5));
  it.noGrab = true; it.noPhys = true; it.height = 2.6; it.radius = 2; it.base = 0; return it;
}

// the ball's push: a knob beside it, pushed along the shelf (towards the engine in step s1, towards the back in s2)
export function bindTrainHands(tr, knob, app, s = { s1: 2, s2: 3 }, done = {}) {
  const dir = () => (app.runner.i === s.s2 ? 1 : -1); let pk = 0, lastStep = -1;
  handle(knob, { path: () => tr.ballPath(dir()), active: () => (stepNow(app, s.s1) || stepNow(app, s.s2)) && !tr.ballV && !tr.pushed[app.runner.i], keepVisible: () => (app.runner.i === s.s1 || app.runner.i === s.s2) && !tr.ballV && !tr.pushed[app.runner.i],
    move: (k) => { if (lastStep !== app.runner.i) { lastStep = app.runner.i; pk = 0; } pk = Math.max(pk, k); if (pk > 0.6) { tr.pushed[app.runner.i] = true; done.push && done.push(dir()); } }, at: () => tr.ballKnob() });
  tr.pushed = {};
  // when the second push comes, the ball (still rolling away, or at the far end of the shelf) rolls back to the student
  let seen = -1; const u = tr.update; tr.update = (dt, t) => { if (app.runner.i !== seen) { seen = app.runner.i; if (seen === s.s2 && !tr.pushed[s.s2]) { tr.ballV = 0; tr.ballHome = true; } } u(dt, t); };
  const sync = () => { if (!knob.held) knob.g.position.copy(tr.ballKnob()); };
  const u0 = tr.update; tr.update = (dt) => { u0(dt); sync(); };
}
