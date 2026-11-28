// DUET Science Lab 360, batch SX-CGM, maths on the bench, done with your own hands:
//  - the sum of the first n squares: square layers of wooden cubes stacked into a pyramid in a corner jig, then six such
//    pyramids fitted into one box n × (n + 1) × (2n + 1), so 1² + 2² + … + n² = n(n + 1)(2n + 1) ÷ 6;
//  - a³ − b³: a small cube lifted out of the corner of a big one, the rest sawn into three blocks and laid side by side,
//    so a³ − b³ = (a − b)(a² + ab + b²).
// Every cube is drawn as a real painted or plain wooden block; the counts and numbers come from what the student chose.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { Item, clamp01, ease, liveSign, tag, tex, rnd, noHit, stepNow, V, carry, thing, clock, done1, slider, button, mat, std, steel, woodTex, box, TAU, N3, lerp, BENCH_Y, LITE } from './sxkit.js';

const Y = BENCH_Y;
// ------------------------------------------------------------------ painted wooden cubes
// a unit cube's texture: paint over wood grain, a darker worn edge all round (so every cube in a block can be counted)
const T = {};
const cubeTex = () => T.cube || (T.cube = tex(128, 128, (x) => { const r = rnd(5); x.fillStyle = '#f2f2f2'; x.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 40; i++) { const y = r() * 128; x.strokeStyle = `rgba(90,90,90,${0.05 + r() * 0.08})`; x.lineWidth = 0.6 + r() * 1.6; x.beginPath(); x.moveTo(0, y); for (let k = 0; k <= 4; k++) x.lineTo(k * 32, y + Math.sin(k + i) * 2); x.stroke(); }
  const g = (a) => `rgba(40,30,20,${a})`; x.strokeStyle = g(0.55); x.lineWidth = 7; x.strokeRect(0, 0, 128, 128); x.strokeStyle = g(0.2); x.lineWidth = 14; x.strokeRect(0, 0, 128, 128); }));
const cubeMat = () => mat('sxcube', () => new THREE.MeshStandardMaterial({ map: cubeTex(), roughness: 0.62, metalness: 0 }));
const COLS = [0xe0782f, 0x2f6fc0, 0x3f9a4a, 0xe3b92c, 0xb0413e, 0x7a4fa8];
// an instanced block of unit cubes (u: size in metres) at the given cells [[x, y, z], …] (cell 0,0,0 has its corner at 0)
function cubes(cells, u, col) { const im = new THREE.InstancedMesh(new THREE.BoxGeometry(u * 0.985, u * 0.985, u * 0.985), cubeMat(), Math.max(1, cells.length)); const d = new THREE.Object3D(), c = new THREE.Color(col);
  cells.forEach(([x, y, z], i) => { d.position.set((x + 0.5) * u, (y + 0.5) * u, (z + 0.5) * u); d.updateMatrix(); im.setMatrixAt(i, d.matrix); im.setColorAt(i, c); });
  im.count = cells.length; im.castShadow = true; im.receiveShadow = true; im.userData.noHit = true; return im; }
// a smooth move of a thing in real time (position with a little lift, and turn), then cb
function moveT(it, p, q, sec = 0.9, cb) { it.flying = true; const p0 = it.g.position.clone(), q0 = it.g.quaternion.clone(); let k = 0; const dt = clock(); const lift = 0.08;
  const step = () => { k = Math.min(1, k + dt() / sec); const e = ease(k); it.g.position.lerpVectors(p0, p, e); it.g.position.y += Math.sin(e * Math.PI) * lift; it.g.quaternion.slerpQuaternions(q0, q, e); if (k < 1) requestAnimationFrame(step); else { it.flying = false; it.home = { p: p.clone(), q: q.clone() }; if (cb) cb(); } };
  step(); }
const run = (f) => new Promise((r) => f(r));

// ------------------------------------------------------------------ Class 9 (8): the sum of the first n squares
// The corner pyramid: a layer of n × n cubes, on it (n − 1) × (n − 1) pushed into the same corner, … up to 1 × 1.
const pyrCells = (n) => { const c = []; for (let y = 0; y < n; y++) for (let x = 0; x < n - y; x++) for (let z = 0; z < n - y; z++) c.push([x, y, z]); return c; };
// six corner pyramids fill the box (2n + 1) long, n + 1 deep and n high (a tiling found by an exact-cover search and
// checked for n = 3 … 8). Each placement turns the pyramid (a signed permutation of its axes) and slides it.
// Pyramid cell (x, z, layer) → box cell (c1, c2, c3) = R·(x, z, layer) − min + t; the box is drawn with length = c3,
// height = c1, depth = c2.
const PLACE = (n) => [[[0, 1, 2], [1, 1, 1], [0, 0, 0]], [[2, 0, 1], [-1, 1, -1], [0, 0, 1]], [[0, 2, 1], [-1, 1, 1], [0, 0, n + 1]], [[0, 2, 1], [1, -1, -1], [0, 1, 0]], [[2, 0, 1], [1, -1, 1], [0, 1, n]], [[0, 1, 2], [-1, -1, -1], [0, 1, n + 1]]];
// the pose (quaternion, offset in units) that takes the standing pyramid (cells [x, layer, z] as drawn) to its place
function poseOf(n, k) {
  const [p, s, t] = PLACE(n)[k]; const R = new THREE.Matrix3().set(...[0, 1, 2].flatMap((i) => [0, 1, 2].map((j) => (p[i] === j ? s[i] : 0)))); // tiling: R · (x, z, layer)
  const Ms = new THREE.Matrix3().set(1, 0, 0, 0, 0, 1, 0, 1, 0); // standing (x, layer, z) → (x, z, layer)
  const Mb = new THREE.Matrix3().set(0, 0, 1, 1, 0, 0, 0, 1, 0); // tiling (c1, c2, c3) → drawn (c3, c1, c2)
  let Q = new THREE.Matrix3().multiplyMatrices(Mb, R).multiply(Ms); // drawn standing → drawn box (before the slide)
  if (Q.determinant() < 0) Q.multiply(new THREE.Matrix3().set(0, 0, 1, 0, 1, 0, 1, 0, 0)); // a mirror image: swap the pyramid's two flat axes first (it is symmetric about its diagonal)
  const cells = pyrCells(n).map(([x, y, z]) => new THREE.Vector3(x, y, z).applyMatrix3(Q)); const mn = V(Math.min(...cells.map((c) => c.x)), Math.min(...cells.map((c) => c.y)), Math.min(...cells.map((c) => c.z)));
  const off = new THREE.Vector3(t[2], t[0], t[1]).sub(mn); // in drawn box units
  const h = V(0.5, 0.5, 0.5); const T0 = off.clone().add(h).sub(h.clone().applyMatrix3(Q));
  const M4 = new THREE.Matrix4().setFromMatrix3(Q); const q = new THREE.Quaternion().setFromRotationMatrix(M4);
  return { q, T: T0 };
}
export function squarePyramid(o = {}) {
  const it = new Item('sxsq', { ...o, name: N3('Cubes, a corner jig and a box', 'घन, एक कोना-साँचा और एक बक्सा', 'Cubes, ek corner jig aur ek box') });
  const g = it.g, W = o.W || ((k) => k), u = 0.022;
  it.n = 4; it.stack = []; it.inBox = []; it.counted = false;
  // the corner jig (a plywood base with two low walls at the back and on the left) and the clear box on its board
  const ply = std(0xd9b98a, 0.7, 0, { map: woodTex('#cfa875', 11) });
  const jig = new THREE.Group(); g.add(jig);
  const acry = mat('sxacry', () => new THREE.MeshStandardMaterial({ color: 0xe8f4fa, roughness: 0.05, transparent: true, opacity: 0.16, depthWrite: false, side: THREE.DoubleSide }));
  const boxG = new THREE.Group(); g.add(boxG);
  const JX = -0.14, BX = 0.12, BZ = -0.06; // jig corner and box corner (item-local, x right, z towards the student)
  it.jigAt = () => g.localToWorld(V(JX, 0.012, BZ)); it.boxAt = () => g.localToWorld(V(BX, 0.012, BZ));
  const sign = liveSign(0.055, 7); sign.position.set(0.02, 0.24, -0.34); g.add(sign); it.say = (l, c) => sign.set(l, c);
  const build = () => {
    const n = it.n; jig.clear(); boxG.clear();
    const S = (n + 0.6) * u; jig.add(box(S, 0.012, S, ply, JX + S / 2 - 0.3 * u, 0.006, BZ + S / 2 - 0.3 * u), box(S, 0.03, 0.006, ply, JX + S / 2 - 0.3 * u, 0.027, BZ - 0.3 * u - 0.003), box(0.006, 0.03, S, ply, JX - 0.3 * u - 0.003, 0.027, BZ + S / 2 - 0.3 * u));
    const L = (2 * n + 1) * u, D = (n + 1) * u, H = n * u;
    boxG.add(box(L + 0.03, 0.012, D + 0.03, ply, BX + L / 2, 0.006, BZ + D / 2));
    const walls = [new THREE.BoxGeometry(L, H, 0.003).translate(L / 2, H / 2, 0), new THREE.BoxGeometry(L, H, 0.003).translate(L / 2, H / 2, D), new THREE.BoxGeometry(0.003, H, D).translate(0, H / 2, D / 2), new THREE.BoxGeometry(0.003, H, D).translate(L, H / 2, D / 2)];
    const wm = new THREE.Mesh(mergeGeometries(walls), acry); wm.position.set(BX, 0.012, BZ); wm.renderOrder = 8; boxG.add(wm);
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(L, H, D)), mat('sxedge', () => new THREE.LineBasicMaterial({ color: 0xbfe4f2, transparent: true, opacity: 0.8 }))); edges.position.set(BX + L / 2, 0.012 + H / 2, BZ + D / 2); boxG.add(edges);
    noHit(jig); noHit(boxG);
  };
  it.build = build; build();
  it.unit = u;
  // the step-by-step sums shown on the sign
  it.sum = () => it.stack.reduce((a, L) => a + L.k * L.k, 0);
  it.show = () => { const n = it.n, s = it.stack.map((L) => `${L.k}²`).join(' + ');
    if (it.counted) { const N = n * (n + 1) * (2 * n + 1); it.say([`${W('Box')}: ${2 * n + 1} × ${n + 1} × ${n} = ${N} ${W('cubes')} = 6 × ${N / 6}`, `1² + 2² + … + ${n}² = ${n} × ${n + 1} × ${2 * n + 1} ÷ 6 = ${N / 6}`], ['#ffd23f', '#8be07a']); return; }
    if (it.inBox.length) { it.say([`${W('Pyramids in the box')}: ${it.inBox.length} / 6`, `${W('Each pyramid')}: ${n * (n + 1) * (2 * n + 1) / 6} ${W('cubes')}`], ['#ffffff', '#ffd23f']); return; }
    it.say([`n = ${n} · ${W('Layers in the pyramid')}: ${it.stack.length} / ${n}`, s ? `${s} = ${it.sum()} ${W('cubes')}` : W('Put the biggest layer in the corner first')], ['#ffffff', '#ffd23f']); };
  it.views = { all: { p: V(0, 0.5, 0.56), t: V(0, 0.08, -0.12) }, n: { p: V(-0.12, 0.42, 0.46), t: V(-0.14, 0.08, -0.1) }, jig: { p: V(-0.2, 0.44, 0.44), t: V(-0.16, 0.08, -0.1) }, box: { p: V(0.08, 0.5, 0.5), t: V(0.12, 0.08, -0.08) } };
  it.show();
  return done1(it, { height: 0.15, radius: 0.4 });
}
// the square layers (things to carry), the five other pyramids, and the knobs, joined to the steps
export function bindPyramid(sq, K, s, done = {}) {
  const app = K.app, u = sq.unit, fired = new Set(); const once = (k, f) => { if (fired.has(k)) return; fired.add(k); f && f(); };
  const W = sq.W || ((k) => k);
  let layers = [], pyrs = [];
  const tray = (k, n) => { let x = -0.56; for (let j = n; j > k; j--) x += j * u + 0.012; return V(sq.g.position.x + x, Y, sq.g.position.z - 0.02 + 0.0); }; // laid in a row, biggest on the left
  const layerHome = (L) => tray(L.k, sq.n);
  const make = () => {
    for (const L of layers) { L.g.parent && L.g.parent.remove(L.g); K.lab.items.splice(K.lab.items.indexOf(L), 1); } for (const P of pyrs) { P.g.parent && P.g.parent.remove(P.g); K.lab.items.splice(K.lab.items.indexOf(P), 1); }
    layers = []; pyrs = []; mine = null; sq.stack = []; sq.inBox = []; sq.counted = false; const n = sq.n;
    for (let k = n; k >= 1; k--) { const cells = []; for (let x = 0; x < k; x++) for (let z = 0; z < k; z++) cells.push([x, 0, z]);
      const grp = new THREE.Group(); grp.add(cubes(cells, u, COLS[0]));
      const L = K.add(thing(N3(`Layer ${k} × ${k}`, `${k} × ${k} की परत`, `${k} × ${k} ki parat`), grp, { hitR: Math.max(0.03, k * u * 0.7), hitY: u / 2 }), 0, 0, { y: Y }); L.k = k; L.g.position.copy(layerHome(L)); L.home = { p: L.g.position.clone(), q: L.g.quaternion.clone() };
      carry(L, [{ open: () => stepNow(app, s.stack), at: () => sq.jigAt().add(V(n * u * 0.5, 0, n * u * 0.5)), r: 0.12, put: (it) => putLayer(it) }], { lift: 0.12 }); layers.push(L); }
    // five pyramids already built by friends, standing behind (any of them can go into the box)
    for (let i = 1; i < 6; i++) { const grp = new THREE.Group(); grp.add(cubes(pyrCells(n), u, COLS[i])); const P = K.add(thing(N3('Pyramid of cubes', 'घनों का पिरामिड', 'Cubes ka pyramid'), grp, { hitR: n * u * 0.8, hitY: n * u * 0.4 }), 0, 0, { y: Y });
      P.g.position.set(sq.g.position.x - 0.5 + (i - 1) * 0.2, Y, sq.g.position.z - 0.3); P.home = { p: P.g.position.clone(), q: P.g.quaternion.clone() }; P.pi = i; makeBoxable(P); pyrs.push(P); }
    sq.show();
  };
  // a layer let go over the jig: it goes in only on a bigger layer (or as the first one, into the corner)
  const putLayer = (L) => {
    const top = sq.stack[sq.stack.length - 1]; const n = sq.n;
    if (top && L.k >= top.k) { sq.say([W('It does not fit there'), W('A bigger layer cannot rest on a smaller one')], ['#ffb46b', '#ffffff']); L.placed = true; moveT(L, L.home.p.clone(), L.home.q.clone(), 0.7, () => { L.placed = false; }); return; }
    sq.stack.push(L); L.noGrab = true; const y = (sq.stack.length - 1) * u; const to = sq.jigAt().add(V(0, y, 0)); to.y = Y + 0.012 + y;
    return new Promise((r) => moveT(L, to, new THREE.Quaternion(), 0.6, () => { sq.show(); if (sq.stack.length === n && sq.stack.every((x, i) => x.k === n - i) && !mine) { finishPyramid(); once('stack', done.stack); } r(); }));
    sq.show();
  };
  // the pyramid just built becomes one thing that can be carried into the box
  let mine = null;
  const finishPyramid = () => { if (mine) return; const n = sq.n; const grp = new THREE.Group(); grp.add(cubes(pyrCells(n), u, COLS[0])); mine = K.add(thing(N3('Your pyramid', 'आपका पिरामिड', 'Aapka pyramid'), grp, { hitR: n * u * 0.8, hitY: n * u * 0.4 }), 0, 0, { y: Y });
    mine.g.position.copy(sq.jigAt()); mine.g.position.y = Y + 0.012; mine.home = { p: mine.g.position.clone(), q: mine.g.quaternion.clone() }; mine.pi = 0; makeBoxable(mine);
    for (const L of layers) L.g.visible = false; pyrs.unshift(mine); };
  function makeBoxable(P) { carry(P, [{ open: () => stepNow(app, s.box), at: () => sq.boxAt().add(V((2 * sq.n + 1) * u / 2, 0, (sq.n + 1) * u / 2)), r: 0.16, put: (it) => putPyr(it) }], { lift: 0.14 }); P.noGrab = true; }
  const putPyr = (P) => { if (P.slot != null || sq.inBox.length >= 6) return Promise.resolve(); const k = sq.inBox.length; P.slot = k; sq.inBox.push(P); P.noGrab = true; const { q, T } = poseOf(sq.n, k);
    const to = sq.boxAt().add(T.multiplyScalar(u)); to.y = Y + 0.012 + T.y; sq.show(); return new Promise((r) => moveT(P, to, q, 1.1, () => { P.landed = true; sq.show(); if (pyrs.every((x) => x.landed)) once('box', done.box); r(); })); };
  // the knob that chooses n (3, 4 or 5)
  const knobN = s.knobN; const P0 = () => sq.g.localToWorld(V(-0.36, 0.02, 0.1)), P1 = () => sq.g.localToWorld(V(-0.12, 0.02, 0.1));
  slider(knobN, { path: () => [P0(), P1()], active: () => stepNow(app, s.n), keepVisible: () => app.runner.i === s.n, k: () => (sq.n - 3) / 2,
    set: (k) => { const n = 3 + Math.round(clamp01(k) * 2); if (n !== sq.n) { sq.n = n; sq.build(); make(); } once('n', done.n); } });
  const nTag = tag('n = 4', '#ffd23f', 0.035); nTag.position.set(-0.24, 0.07, 0.1); sq.g.add(nTag); sq.nTag = nTag;
  const u0 = sq.update; sq.update = (dt, t) => { if (u0) u0(dt, t); nTag.visible = app.runner.i === s.n; nTag.setText(`n = ${sq.n}`);
    // the layers and the pyramids can be carried only in their own step
    for (const L of layers) if (!sq.stack.includes(L)) L.noGrab = !stepNow(app, s.stack); for (const P of pyrs) if (P.slot == null) P.noGrab = !stepNow(app, s.box); };
  // Do it: the same moves, one after another
  sq.doStack = async () => { while (sq.stack.length) { const L = sq.stack.pop(); L.noGrab = false; await new Promise((r) => moveT(L, L.home.p.clone(), L.home.q.clone(), 0.4, r)); } // a wrong stack is taken down first
    for (const L of [...layers].sort((a, b) => b.k - a.k)) { L.placed = true; await putLayer(L); } };
  sq.doBox = async () => { for (const P of [...pyrs]) { if (P.slot != null) continue; await putPyr(P); } };
  sq.count = () => { sq.counted = true; sq.show(); once('count', done.count); };
  sq.setN = (n) => { if (n !== sq.n) { sq.n = n; sq.build(); make(); } };
  make();
}

// ------------------------------------------------------------------ Class 9: a³ − b³ with a sawn wooden cube
// A wooden cube of side a = 5 (each unit 3 cm, marked by lines) with a small cube of side b in its top front right
// corner (the student chooses b = 1, 2 or 3). Unit cells: x right, y up, z towards the student.
// gridded wood: the texture repeats once per unit, so every face shows its unit squares
const gridTex = () => T.grid || (T.grid = (() => { const t = tex(128, 128, (x) => { const r = rnd(9); x.fillStyle = '#d9b07a'; x.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 9; i++) { const y = r() * 128; x.strokeStyle = `rgba(120,75,35,${0.04 + r() * 0.07})`; x.lineWidth = 1 + r() * 3; x.beginPath(); x.moveTo(0, y); for (let k = 0; k <= 4; k++) x.lineTo(k * 32, y + Math.sin(k * 0.9 + i) * 3); x.stroke(); }
  x.strokeStyle = 'rgba(55,30,12,0.85)'; x.lineWidth = 4; x.strokeRect(0, 0, 128, 128); }); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; })());
const gridMat = (c) => mat('sxgrid' + c, () => new THREE.MeshStandardMaterial({ map: gridTex(), color: c, roughness: 0.66 }));
// a box of w × h × d units whose faces carry one texture tile per unit
function gridBlock(w, h, d, u, c = 0xffffff) { const gm = new THREE.BoxGeometry(w * u, h * u, d * u); const uv = gm.attributes.uv, nrm = gm.attributes.normal;
  for (let i = 0; i < uv.count; i++) { const nx = Math.abs(nrm.getX(i)), ny = Math.abs(nrm.getY(i)); const [su, sv] = nx > 0.5 ? [d, h] : ny > 0.5 ? [w, d] : [w, h]; uv.setXY(i, uv.getX(i) * su, uv.getY(i) * sv); }
  gm.translate(w * u / 2, h * u / 2, d * u / 2); const m = new THREE.Mesh(gm, gridMat(c)); m.castShadow = true; m.receiveShadow = true; m.userData.noHit = true; return m; }
export function cubeDiff(o = {}) {
  const it = new Item('sxcd', { ...o, name: N3('A wooden cube to saw', 'आरी से काटने वाला लकड़ी का घन', 'Aari se kaatne wala lakdi ka cube') });
  const g = it.g, W = o.W || ((k) => k), u = 0.03, a = 5; it.a = a; it.b = 2; it.u = u; it.cut1 = 0; it.cut2 = 0;
  const C0 = V(-0.2, 0, -0.09); // the big cube's corner (left, back, bottom), item-local
  const ply = std(0xd9b98a, 0.7, 0, { map: woodTex('#c9a070', 13) });
  g.add(box(0.34, 0.014, 0.31, ply, C0.x + 0.13, 0.007, C0.z + 0.125)); // the sawing board under the cube (the blocks are laid out on it too)
  const sign = liveSign(0.055, 7); sign.position.set(0.04, 0.27, -0.3); g.add(sign); it.say = (l, c) => sign.set(l, c);
  const parts = new THREE.Group(); g.add(parts);
  // the saw: a steel blade with teeth and a wooden handle, lying across its cut line
  const saw = new THREE.Group(); { const bl = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.05, 0.0012), steel()); bl.position.set(0.13, 0, 0); saw.add(bl);
    const teeth = new THREE.Mesh(new THREE.PlaneGeometry(0.26, 0.004), mat('sxteeth', () => new THREE.MeshStandardMaterial({ map: tex(256, 8, (x) => { x.fillStyle = '#c8ccd0'; for (let i = 0; i < 64; i++) { x.beginPath(); x.moveTo(i * 4, 0); x.lineTo(i * 4 + 2, 8); x.lineTo(i * 4 + 4, 0); x.fill(); } }), transparent: true, alphaTest: 0.4, metalness: 0.8, roughness: 0.3, side: THREE.DoubleSide })));
    teeth.position.set(0.13, -0.027, 0); saw.add(teeth); const hd = box(0.07, 0.06, 0.018, std(0x7a4a26, 0.55, 0, { map: woodTex('#7a4a26', 4) }), -0.03, 0.006, 0); saw.add(hd); }
  saw.traverse((m) => { m.userData.noHit = true; m.castShadow = true; }); saw.visible = false; g.add(saw);
  const kerf = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), mat('sxkerf', () => new THREE.MeshBasicMaterial({ color: 0x2a190c }))); kerf.visible = false; kerf.userData.noHit = true; g.add(kerf); // the slot the saw leaves (2 mm)
  // the pieces (unit boxes): S the small corner cube, P1 the bottom slab, P2 and P3 the two blocks above it
  it.build = () => { parts.clear(); const b = it.b, ab = a - b;
    it.P = { S: gridBlock(b, b, b, u, 0xf2d8a8), P1: gridBlock(a, ab, a, u, 0xffffff), P2: gridBlock(ab, b, a, u, 0xf4e6c8), P3: gridBlock(b, b, ab, u, 0xe8cfa0) };
    const at = { S: [ab, ab, ab], P1: [0, 0, 0], P2: [0, ab, 0], P3: [ab, ab, 0] };
    for (const k in it.P) { const m = it.P[k]; m.position.copy(C0).add(V(at[k][0] * u, at[k][1] * u + 0.014, at[k][2] * u)); m.userData.home = m.position.clone(); parts.add(m); }
    it.cut1 = 0; it.cut2 = 0; it.lifted = false; it.laid = { P2: false, P3: false }; if (it.hideFaces) it.hideFaces(); it.show(); };
  // where the cube's corner and the cut lines are (world)
  it.cornerW = () => g.localToWorld(C0.clone().add(V(0, 0.014, 0)));
  it.sAt = () => g.localToWorld(C0.clone().add(V((a - it.b / 2) * u, 0.014 + (a - it.b / 2) * u, (a - it.b / 2) * u)));
  it.cutPath = (n) => { const ab = a - it.b; return n === 1 ? [g.localToWorld(C0.clone().add(V(-0.04, 0.014 + ab * u, a * u + 0.03))), g.localToWorld(C0.clone().add(V(-0.04, 0.014 + ab * u, -0.06)))]
    : [g.localToWorld(C0.clone().add(V(ab * u, 0.014 + a * u + 0.04, a * u + 0.03))), g.localToWorld(C0.clone().add(V(ab * u, 0.014 + a * u + 0.04, -0.06)))]; };
  // a cut: the saw runs along its line from front to back; the kerf shows where it has been
  it.setCut = (n, k) => { k = clamp01(k); const ab = a - it.b; saw.visible = k > 0 && k < 1; kerf.visible = k > 0 && k < 1;
    if (n === 1) { if (k <= it.cut1) return; it.cut1 = k; saw.rotation.set(0, Math.PI / 2, 0); saw.position.copy(C0).add(V(a * u * 0.5, 0.014 + ab * u + 0.025, a * u * (1 - k) + 0.01)); saw.rotation.z = 0;
      kerf.scale.set(a * u + 0.001, 0.002, a * u * k); kerf.rotation.set(0, 0, 0); kerf.position.copy(C0).add(V(a * u / 2, 0.014 + ab * u, a * u * (1 - k / 2) + 0.0005));
      if (k >= 1) { it.P.P2.position.y += 0.004; it.P.P3.position.y += 0.004; } }
    else { if (k <= it.cut2) return; it.cut2 = k; saw.rotation.set(0, Math.PI / 2, Math.PI / 2); saw.position.copy(C0).add(V(ab * u, 0.014 + a * u + 0.02, a * u * (1 - k) + 0.01));
      kerf.scale.set(0.002, b0() * u + 0.001, a * u * k); kerf.rotation.set(0, 0, 0); kerf.position.copy(C0).add(V(ab * u, 0.018 + (a - it.b / 2) * u, a * u * (1 - k / 2) + 0.0005));
      if (k >= 1) { it.P.P3.position.x += 0.006; } }
    if (k >= 1) { saw.visible = false; kerf.visible = false; } it.show(); };
  // once laid out: outlines and names on the three top faces
  const faceT = new THREE.Group(); g.add(faceT); noHit(faceT);
  it.showFaces = () => { faceT.clear(); const b = it.b, ab = a - b, y = 0.014 + ab * u + 0.002;
    const rect = (x0, z0, w, d, col, txt) => { const ln = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints([V(x0, y, z0), V(x0 + w, y, z0), V(x0 + w, y, z0 + d), V(x0, y, z0 + d)]), mat('sxl' + col, () => new THREE.LineBasicMaterial({ color: col }))); ln.position.copy(C0); faceT.add(ln);
      const t = tag(txt, '#' + col.toString(16).padStart(6, '0'), 0.018); t.position.copy(C0).add(V(x0 + w / 2, y + 0.02, z0 + d / 2)); faceT.add(t); };
    rect(0.002, 0.002, a * u - 0.004, a * u - 0.004, 0x5ec8ff, `a² = ${a * a}`); rect(a * u + 0.005, 0.002, b * u - 0.004, a * u - 0.004, 0xffb46b, `ab = ${a * b}`); rect(a * u + 0.005, (a + b) * u - b * u + 0.005, b * u - 0.004, b * u - 0.004, 0x8be07a, `b² = ${b * b}`);
    const h = tag(`a − b = ${ab}`, '#ffffff', 0.018); h.position.copy(C0).add(V(-0.03, 0.014 + ab * u / 2, a * u)); faceT.add(h); };
  it.hideFaces = () => faceT.clear();
  const b0 = () => it.b;
  // the blocks laid flat beside the bottom slab, a − b side up: P2 (turned a quarter about z) along its right side, P3
  // (turned a quarter about x) in front of P2; their top faces make a² + ab + b². (Positions are of each block's origin,
  // its corner before the turn.)
  it.layAt = (k) => { const b = it.b; return g.localToWorld(C0.clone().add(k === 'P2' ? V((a + b) * u + 0.003, 0.014, 0) : V(a * u + 0.003, 0.014, (a + b) * u + 0.003))); };
  it.show = () => { const b = it.b, ab = a - b; const big = a * a * a, sm = b * b * b;
    if (it.laid.P2 && it.laid.P3) { it.say([`${W('Top faces')}: a² + ab + b² = ${a * a} + ${a * b} + ${b * b} = ${a * a + a * b + b * b} · ${W('height')} a − b = ${ab}`, `a³ − b³ = ${big} − ${sm} = ${big - sm} = ${ab} × ${a * a + a * b + b * b}`], ['#ffffff', '#8be07a']); return; }
    if (it.cut1 >= 1) { it.say([`${W('Three blocks')}: ${a}×${a}×${ab} + ${ab}×${b}×${a} + ${b}×${b}×${ab}`, `= ${a * a * ab} + ${ab * b * a} + ${b * b * ab} = ${big - sm}`], ['#ffffff', '#ffd23f']); return; }
    if (it.lifted) { it.say([`${W('What is left')}: a³ − b³ = ${big} − ${sm} = ${big - sm} ${W('unit cubes')}`, W('Saw along the line to cut off the bottom slab')], ['#ffd23f', '#ffffff']); return; }
    it.say([`a = ${a}, b = ${b}: a³ = ${big} · b³ = ${sm}`, W('Lift the small cube out of the corner')], ['#ffffff', '#ffd23f']); };
  it.views = { all: { p: V(0, 0.46, 0.5), t: V(0, 0.1, -0.1) }, cube: { p: V(-0.06, 0.42, 0.42), t: V(-0.1, 0.09, -0.06) }, lay: { p: V(0.02, 0.62, 0.46), t: V(-0.05, 0.02, -0.06) } };
  it.build();
  return done1(it, { height: 0.2, radius: 0.35 });
}
// the small cube to carry, the saw handle, the blocks to lay out, the b knob
export function bindCubeDiff(cd, K, s, done = {}) {
  const app = K.app, u = cd.u, a = cd.a, fired = new Set(); const once = (k, f) => { if (fired.has(k)) return; fired.add(k); f && f(); };
  // the small cube as a thing (its mesh moves into the thing)
  let S = null, P2 = null, P3 = null;
  const things = () => { for (const t of [S, P2, P3]) if (t) { t.g.parent && t.g.parent.remove(t.g); const i = K.lab.items.indexOf(t); if (i >= 0) K.lab.items.splice(i, 1); }
    const mk = (key, label) => { const m = cd.P[key]; const w = m.getWorldPosition(V(0, 0, 0)); const grp = new THREE.Group(); const T = K.add(thing(label, grp, { hitR: 0.05, hitY: 0.02 }), 0, 0, { y: Y });
      T.g.position.copy(w); m.position.set(0, 0, 0); grp.add(m); T.home = { p: w.clone(), q: new THREE.Quaternion() }; T.key = key; return T; };
    S = mk('S', N3('Small cube b³', 'छोटा घन b³', 'Chhota cube b³')); P2 = mk('P2', N3('Block (a − b) × b × a', 'ब्लॉक (a − b) × b × a', 'Block (a − b) × b × a')); P3 = mk('P3', N3('Block b × b × (a − b)', 'ब्लॉक b × b × (a − b)', 'Block b × b × (a − b)'));
    carry(S, [{ open: () => stepNow(app, s.lift), at: () => cd.g.localToWorld(V(-0.33, 0, 0.06)), r: 0.12, put: (t) => putS(t) }], { lift: 0.08, free: (t, p) => (stepNow(app, s.lift) && Math.hypot(p.x - t.home.p.x, p.z - t.home.p.z) > 0.08 ? (putS(t), true) : false) });
    for (const T of [P2, P3]) carry(T, [{ open: () => stepNow(app, s.lay) && cd.cut2 >= 1, at: () => cd.layAt(T.key).add(V(-0.02, 0, 0.02)), r: 0.13, put: (t) => layOut(t) }], { lift: 0.1 });
    cd.things = { S, P2, P3 }; };
  const putS = (t) => { if (cd.lifted) return Promise.resolve(); cd.lifted = true; t.noGrab = true; cd.show(); return new Promise((r) => moveT(t, cd.g.localToWorld(V(-0.33, 0.0, 0.06)), new THREE.Quaternion(), 0.8, () => { once('lift', done.lift); r(); })); };
  // P2 has its a − b side along x: turn it a quarter about z; P3 has it along z: turn it a quarter about x
  const layOut = (t) => { if (cd.laid[t.key]) return Promise.resolve(); cd.laid[t.key] = true; t.noGrab = true; const b = cd.b, ab = a - b;
    const q = t.key === 'P2' ? new THREE.Quaternion().setFromAxisAngle(V(0, 0, 1), Math.PI / 2) : new THREE.Quaternion().setFromAxisAngle(V(1, 0, 0), -Math.PI / 2);
    const p = cd.layAt(t.key); void ab;
    return new Promise((r) => moveT(t, p, q, 0.9, () => { t.landed = true; cd.show(); if (P2.landed && P3.landed) { cd.showFaces(); once('lay', done.lay); } r(); })); };
  // b: the knob chooses 1, 2 or 3
  const kb = s.knobB; const A0 = () => cd.g.localToWorld(V(-0.3, 0.02, 0.12)), A1 = () => cd.g.localToWorld(V(-0.08, 0.02, 0.12));
  slider(kb, { path: () => [A0(), A1()], active: () => stepNow(app, s.b), keepVisible: () => app.runner.i === s.b, k: () => (cd.b - 1) / 2,
    set: (k) => { const b = 1 + Math.round(clamp01(k) * 2); if (b !== cd.b) { cd.b = b; cd.build(); things(); } once('b', done.b); } });
  const bTag = tag('b = 2', '#ffd23f', 0.035); bTag.position.set(-0.19, 0.07, 0.12); cd.g.add(bTag);
  // the saw: its handle slides along each cut
  for (const [n, key] of [[1, 'cut1'], [2, 'cut2']]) slider(s['saw' + n], { path: () => cd.cutPath(n), active: () => stepNow(app, s[key]) && (n === 1 ? cd.lifted : cd.cut1 >= 1), keepVisible: () => app.runner.i === s[key], k: () => cd[key],
    set: (k) => { cd.setCut(n, k); if (cd[key] >= 0.98) { cd.setCut(n, 1); once(key, done[key]); } } });
  const u0 = cd.update; cd.update = (dt, t) => { if (u0) u0(dt, t); bTag.visible = app.runner.i === s.b; bTag.setText(`b = ${cd.b}`);
    if (S && !cd.lifted) S.noGrab = !stepNow(app, s.lift); for (const T of [P2, P3]) if (T && !cd.laid[T.key]) T.noGrab = !(stepNow(app, s.lay) && cd.cut2 >= 1); };
  cd.doLift = () => putS(S);
  cd.doLay = async () => { await layOut(P2); await layOut(P3); };
  cd.setB = (b) => { if (b !== cd.b) { cd.b = b; cd.build(); things(); } };
  things();
}
