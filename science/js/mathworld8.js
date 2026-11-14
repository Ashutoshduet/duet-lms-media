// DUET Maths Lab 360, hands-on in 3D, batch 8 (Class 8): a shepherd counting sheep with pebbles, bags and sacks (place
// value and zero), the corners of a four-sided field joined into a full turn (quadrilaterals), base-10 blocks that show
// the test for 9 (number play), a floor of 100 tiles painted with a roller (percentages), and a trapezium field doubled
// into a rectangle (area).
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
const DEG = Math.PI / 180;
const stepNow = (app, i) => { const r = app.runner; return !!(r.exp && r.i === i && r.state === 'todo'); };
const M = (c, r = 0.6, m = 0, e = 0) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m, emissive: c, emissiveIntensity: e });
const noHit = (o) => { o.traverse((m) => { m.userData.noHit = true; }); return o; };
function tag(text, col = '#ffffff', h = 0.2, bg = 'rgba(12,16,24,0.85)') {
  const w = String(text).length <= 2 ? 2 : String(text).length <= 4 ? 3 : 4, W = 128 * w;
  const t = canvasTex(W, 128, (x) => { x.fillStyle = bg; x.beginPath(); x.roundRect(4, 4, W - 8, 120, 40); x.fill(); x.fillStyle = col; x.font = `800 72px ${FONT}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(String(text), W / 2, 68); });
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: false, toneMapped: false })); s.scale.set(h * w, h, 1); s.renderOrder = 40; s.userData.noHit = true;
  s.setText = (txt, c = col) => { const x = t.image.getContext('2d'); x.clearRect(0, 0, W, 128); x.fillStyle = bg; x.beginPath(); x.roundRect(4, 4, W - 8, 120, 40); x.fill(); x.fillStyle = c; x.font = `800 72px ${FONT}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(String(txt), W / 2, 68); t.needsUpdate = true; };
  return s;
}
const flat = (geo, mat, y = 0.02) => { const m = new THREE.Mesh(geo, mat); m.rotation.x = -Math.PI / 2; m.position.y = y; m.userData.noHit = true; return m; };

// ------------------------------------------------------------------ Ch 3 A Story of Numbers: sheep, pebbles, bags, sacks
// Sheep walk out through a gate one by one. For each sheep a pebble drops into the "ones" tray; ten pebbles become a bag
// in the "tens" tray and ten bags a sack in the "hundreds" tray. The trays are the places of a numeral.
export function sheepCount(o = {}) {
  const it = new Item('wsheep', { ...o, name: { en: 'Sheep and pebbles', hi: 'भेड़ें और कंकड़', hg: 'Bhedein aur kankad' } });
  const g = it.g, Z = -3.3, GX = -1.0, X0 = -4.6, X1 = 3.6, SP = 1.0;
  const wood = M(0x8a6a44, 0.9);
  for (const dz of [-0.55, 0.55]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.0, 0.1), wood); p.position.set(GX, 0.5, Z + dz); g.add(p); }
  const bar = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 1.2), wood); bar.position.set(GX, 1.0, Z); g.add(bar);
  for (const dz of [-0.55, 0.55]) for (const y of [0.35, 0.7]) { const r = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.05, 0.04), wood); r.position.set(GX - 1.6, y, Z + dz); g.add(r); } // a lane to the gate
  // sheep: woolly body, dark head
  const NS = 18, bodyG = new THREE.SphereGeometry(0.2, 14, 10); bodyG.scale(1.45, 1, 1); const headG = new THREE.SphereGeometry(0.085, 10, 8); headG.scale(1.3, 1, 1);
  const bodies = new THREE.InstancedMesh(bodyG, M(0xf2efe6, 0.95), NS), heads = new THREE.InstancedMesh(headG, M(0x2a2622, 0.7), NS);
  const legG = new THREE.CylinderGeometry(0.022, 0.018, 0.3, 6); legG.translate(0, 0.15, 0); const legs = new THREE.InstancedMesh(legG, M(0x2a2622, 0.7), NS * 4);
  bodies.frustumCulled = heads.frustumCulled = legs.frustumCulled = false; g.add(bodies, heads, legs); bodies.count = heads.count = legs.count = 0;
  // the three trays on a low bench in front of the student: hundreds, tens, ones
  const TY = 0.42, TZ = -1.75, TX = [-0.35, 0.5, 1.35];
  const benchTop = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.08, 0.8), wood); benchTop.position.set(0.5, TY - 0.06, TZ); g.add(benchTop);
  for (const x of [-0.6, 1.6]) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.1, TY - 0.1, 0.6), wood); l.position.set(x, (TY - 0.1) / 2, TZ); g.add(l); }
  const trayM = M(0xc49a64, 0.85);
  TX.forEach((x) => { const b = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.03, 0.66), trayM); b.position.set(x, TY, TZ); g.add(b);
    for (const [dx, dz, w, d] of [[0, 0.32, 0.66, 0.02], [0, -0.32, 0.66, 0.02], [0.32, 0, 0.02, 0.66], [-0.32, 0, 0.02, 0.66]]) { const r = new THREE.Mesh(new THREE.BoxGeometry(w, 0.06, d), trayM); r.position.set(x + dx, TY + 0.03, TZ + dz); g.add(r); } });
  const place = ['100', '10', '1'].map((t, i) => { const s = tag(t, '#ffd23f', 0.13); s.position.set(TX[i], TY - 0.02, TZ + 0.46); g.add(s); return s; });
  const digit = TX.map((x) => { const s = tag('0', '#ffffff', 0.26); s.position.set(x, TY + 0.5, TZ); g.add(s); return s; });
  const cell = (i, k) => V(TX[i] + ((k % 3) - 1) * 0.19, TY + 0.06, TZ + (Math.floor(k / 3) - 1) * 0.19);
  const pebG = new THREE.SphereGeometry(0.05, 12, 8); pebG.scale(1, 0.7, 1);
  const bagG = new THREE.SphereGeometry(0.075, 12, 10); bagG.scale(1, 1.3, 1);
  const sackG = new THREE.SphereGeometry(0.09, 14, 10); sackG.scale(1, 1.5, 1);
  const pebbles = new THREE.InstancedMesh(pebG, M(0x8f8f8a, 0.8), 10), bags = new THREE.InstancedMesh(bagG, M(0xb07a3a, 0.9), 10), sacks = new THREE.InstancedMesh(sackG, M(0x7a5228, 0.9), 10);
  [pebbles, bags, sacks].forEach((m) => { m.frustumCulled = false; g.add(m); });
  const ghost = new THREE.Group(); g.add(ghost); ghost.visible = false; for (let k = 0; k < 10; k++) { const p = new THREE.Mesh(pebG, M(0x8f8f8a, 0.8)); p.position.copy(cell(2, k % 9)).sub(V(TX[2], 0, TZ)); ghost.add(p); }
  const mtx = new THREE.Matrix4();
  const fill = (mesh, i, n, lift) => { mesh.count = n; for (let k = 0; k < n; k++) { const p = cell(i, k); p.y += lift; mesh.setMatrixAt(k, mtx.makeTranslation(p.x, p.y, p.z)); } mesh.instanceMatrix.needsUpdate = true; };
  const rd = tag('0', '#ffd23f', 0.3); rd.position.set(2.5, 0.8, TZ); g.add(rd);
  it.count = 0; it.word = null;
  it.setCount = (n, zeroMark = false) => { it.count = n; const h = Math.floor(n / 100), t = Math.floor(n / 10) % 10, u = n % 10;
    fill(sacks, 0, h, 0.07); fill(bags, 1, t, 0.04); fill(pebbles, 2, u, 0);
    [h, t, u].forEach((d, i) => { digit[i].setText(d, zeroMark && d === 0 ? '#8be07a' : '#ffffff'); digit[i].visible = n >= [100, 10, 0][i] || (zeroMark && n >= 100); });
    rd.setText(n); };
  it.setCount(0);
  // bundling: ten pebbles fly to the tens tray (or ten bags to the hundreds tray)
  let fx = null;
  const bundle = (from, to) => { fx = { t: 0, a: V(TX[from], 0, TZ), b: V(TX[to], 0.05, TZ) }; ghost.position.copy(fx.a); ghost.scale.setScalar(1); ghost.visible = true; };
  it.add1 = () => { const n = it.count + 1; if (n % 100 === 0) bundle(1, 0); else if (n % 10 === 0) bundle(2, 1); it.setCount(n); };
  // the flock
  it.flowing = false; let T = 0, N = 0, passed = 0, speed = 1.6;
  it.flow = (n, sp = 1.6) => { if (it.flowing) return false; it.flowing = true; T = 0; N = n; passed = 0; speed = sp; return true; };
  it.update = (dt) => { dt = Math.min(dt || 0.016, 0.05);
    if (fx) { fx.t += dt * 2.5; const k = Math.min(1, fx.t); ghost.position.copy(fx.a).lerp(fx.b, ease(k)); ghost.position.y += Math.sin(k * Math.PI) * 0.35; ghost.scale.setScalar(1 - 0.6 * k); if (k >= 1) { fx = null; ghost.visible = false; } }
    if (!it.flowing) return; T += dt * speed; let vis = 0;
    for (let k = 0; k < N; k++) { const x = GX - SP * (k + 1) + T; if (x >= GX && k >= passed) { passed = k + 1; it.add1(); }
      if (x > X0 && x < X1 && vis < NS) { const bob = Math.abs(Math.sin((x + k) * 6)) * 0.05, wz = Z + Math.sin(k * 2.3) * 0.18 * clamp01((x - GX) / 1.5);
        mtx.makeTranslation(x, 0.46 + bob, wz); bodies.setMatrixAt(vis, mtx); mtx.makeTranslation(x + 0.33, 0.56 + bob, wz); heads.setMatrixAt(vis, mtx);
        [[0.17, 0.09], [0.17, -0.09], [-0.17, 0.09], [-0.17, -0.09]].forEach(([dx, dz], j) => { const sw = Math.sin((x + k) * 9 + j * 1.6) * 0.25; mtx.makeRotationZ(sw).setPosition(x + dx, 0.02 + bob * 0.5, wz + dz); legs.setMatrixAt(vis * 4 + j, mtx); }); vis++; } }
    bodies.count = heads.count = vis; legs.count = vis * 4; bodies.instanceMatrix.needsUpdate = heads.instanceMatrix.needsUpdate = legs.instanceMatrix.needsUpdate = true;
    if (GX - SP * N + T > X1) { it.flowing = false; bodies.count = heads.count = legs.count = 0; if (it.onFlow) it.onFlow(it.count); } };
  it.leverPath = () => [V(-0.45, 1.0, -0.3), V(-0.45, 1.0, -0.05)];
  it.at = (k) => ({ ones: V(TX[2], TY + 1.0, TZ), tens: V(TX[1], TY + 1.0, TZ), hund: V(TX[0], TY + 1.0, TZ), gate: V(GX, 1.4, Z), mid: V(0.5, 1.45, TZ - 0.3) }[k] || V(0.5, 1.5, TZ));
  noHit(g); it.noGrab = true; it.noPhys = true; it.height = 1; it.radius = 3; it.base = 0; return it;
}
export function bindSheepHands(sc, lever, app, s = { flow: 1 }, n = 23) {
  pushKnob(lever, { path: () => sc.leverPath(), active: () => stepNow(app, s.flow) && !sc.flowing && sc.count < n, keepVisible: () => app.runner.i === s.flow, press: () => sc.flow(n - sc.count, 2.2) });
}

// ------------------------------------------------------------------ Ch 4 Quadrilaterals: the corners of a field
// A four-sided field ABCD is roped out on the ground, with a coloured wedge in each corner. The corner D can be moved; the
// four angles always add up to 360°. Then the wedges fly to one point and close into a full turn.
export function quadCorners(o = {}) {
  const it = new Item('wquad', { ...o, name: { en: 'Four-sided field', hi: 'चार भुजाओं वाला खेत', hg: 'Chaar bhujaon wala khet' } });
  const g = it.g, A = V(-1.9, 0.03, -1.3), B = V(1.7, 0.03, -1.1), C = V(1.2, 0.03, -3.7), D0 = V(-2.3, 0.03, -3.9), D1 = V(-0.5, 0.03, -2.9), J = V(-0.1, 0.05, -2.4);
  const ropeM = glow(0xffffff), ropes = [0, 1, 2, 3].map(() => { const r = rod(V(), V(1, 0, 0), 0.022, ropeM); g.add(r); return r; });
  const mkPost = (L, col) => { const p = new THREE.Group(); p.add(rod(V(0, 0, 0), V(0, 0.75, 0), 0.02, M(0xdddddd, 0.4, 0.5))); const s = tag(L, col, 0.2); s.position.y = 0.92; p.add(s); g.add(p); return p; };
  const COLS = [0xff5a4f, 0xffd23f, 0x5ec8ff, 0x8be07a], HEX = ['#ff7a6f', '#ffd23f', '#7ad0ff', '#8be07a'];
  const posts = ['A', 'B', 'C', 'D'].map((L, i) => mkPost(L, HEX[i]));
  const wedges = COLS.map((c, i) => { const w = new THREE.Group(); const m = new THREE.Mesh(new THREE.CircleGeometry(0.6, 40, 0, 1), new THREE.MeshBasicMaterial({ color: c, toneMapped: false, transparent: true, opacity: 0.85, side: THREE.DoubleSide, depthWrite: false })); m.rotation.x = -Math.PI / 2; m.position.y = 0.012 + i * 0.004; m.renderOrder = 3; w.add(m); w.mesh = m; g.add(w); return w; });
  const diag = rod(V(), V(1, 0, 0), 0.02, glow(0xff9a4a)); diag.visible = false; g.add(diag);
  const triM = [new THREE.MeshBasicMaterial({ color: 0xffd23f, transparent: true, opacity: 0.18, side: THREE.DoubleSide, depthWrite: false, toneMapped: false }), new THREE.MeshBasicMaterial({ color: 0x5ec8ff, transparent: true, opacity: 0.18, side: THREE.DoubleSide, depthWrite: false, toneMapped: false })];
  const tris = triM.map((m) => { const t = new THREE.Mesh(new THREE.BufferGeometry(), m); t.visible = false; g.add(t); return t; });
  const rd = liveSign(0.8, 3.4); rd.position.set(-0.1, 1.2, -5.0); g.add(rd);
  const ang2 = (p) => Math.atan2(-p.z, p.x);
  it.kD = 0.5; it.D = D0.clone().lerp(D1, 0.5); it.joinK = 0; it.angles = [90, 90, 90, 90];
  const pts = () => [A, B, C, it.D];
  const draw = () => { const P = pts(); P.forEach((p, i) => { setRod(ropes[i], p, P[(i + 1) % 4]); posts[i].position.copy(p).setY(0); });
    const raw = P.map((p, i) => { const u = P[(i + 1) % 4].clone().sub(p).setY(0), v = P[(i + 3) % 4].clone().sub(p).setY(0); const a = ang2(u), b = ang2(v); let d = ((b - a + 3 * Math.PI) % (2 * Math.PI)) - Math.PI; const st = d < 0 ? b : a; d = Math.abs(d); return { st, d }; });
    raw.forEach((r, i) => { const w = wedges[i]; w.mesh.geometry.dispose(); w.mesh.geometry = new THREE.CircleGeometry(0.6, 40, r.st, r.d); w.st = r.st; w.d = r.d; });
    const a = raw.map((r) => Math.round(r.d / DEG)); a[3] = 360 - a[0] - a[1] - a[2]; it.angles = a;
    rd.set(['∠A + ∠B + ∠C + ∠D', `${a[0]}° + ${a[1]}° + ${a[2]}° + ${a[3]}° = 360°`], ['#ffffff', '#ffd23f']);
    if (diag.visible) it.showDiag(); it.join(it.joinK); };
  it.setD = (k) => { it.kD = clamp01(k); it.D = D0.clone().lerp(D1, it.kD); draw(); };
  it.join = (k) => { it.joinK = k; const P = pts(); let cum = 0; wedges.forEach((w, i) => { const phi = cum - w.st; cum += w.d; w.position.copy(P[i]).setY(0).lerp(J.clone().setY(0.03), ease(k)); w.position.y += Math.sin(k * Math.PI) * 0.6; w.rotation.y = phi * ease(k); }); };
  it.showDiag = () => { const P = pts(); diag.visible = true; setRod(diag, P[0].clone().setY(0.05), P[2].clone().setY(0.05));
    [[P[0], P[1], P[2]], [P[0], P[2], P[3]]].forEach((t, i) => { const arr = new Float32Array(t.flatMap((p) => [p.x, 0.015, p.z])); tris[i].geometry.dispose(); tris[i].geometry = new THREE.BufferGeometry(); tris[i].geometry.setAttribute('position', new THREE.BufferAttribute(arr, 3)); tris[i].visible = true; }); };
  draw();
  it.knobPath = () => [V(-0.45, 1.0, -0.42), V(0.45, 1.0, -0.42)];
  it.at = (k) => ({ j: J.clone().add(V(0, 0.9, 0)), t1: A.clone().lerp(B, 0.5).lerp(C, 0.33).add(V(0, 0.5, 0)), t2: A.clone().lerp(C, 0.5).lerp(it.D, 0.4).add(V(0, 0.5, 0)), d: it.D.clone().add(V(0, 1.3, 0)) }[k] || V(0, 1.5, -2.5));
  noHit(g); it.noGrab = true; it.noPhys = true; it.height = 1; it.radius = 3; it.base = 0; return it;
}
export function bindQuadHands(qc, knob, app, s = { move: 1 }, done = {}) {
  let k0 = null;
  const sync = slideKnob(knob, { path: () => qc.knobPath(), active: () => stepNow(app, s.move), keepVisible: () => app.runner.i <= s.move,
    k: () => qc.kD, set: (k) => { if (k0 == null) k0 = qc.kD; qc.setD(k); if (Math.abs(k - k0) > 0.3) done.move && done.move(); } });
  const s0 = qc.setD; qc.setD = (k) => { s0(k); sync(); };
}

// ------------------------------------------------------------------ Ch 5 Number Play: why the test for 9 works
// 342 is built from base-10 blocks on the table (unit cube 2.4 cm). From each hundred one cube is taken off (99 = 11 nines
// remain) and from each ten one cube (9 remains). The cubes taken off are the digit sum.
export function nineBlocks(o = {}) {
  const it = new Item('wnine', { ...o, name: { en: 'Base-10 blocks', hi: 'दहाई के ब्लॉक', hg: 'Base-10 blocks' } });
  const g = it.g, u = 0.024, MAX = 9 * 100 + 9 * 10 + 9;
  const cube = new THREE.BoxGeometry(u * 0.94, u * 0.94, u * 0.94);
  const im = new THREE.InstancedMesh(cube, new THREE.MeshStandardMaterial({ roughness: 0.5 }), MAX); im.frustumCulled = false; g.add(im);
  const C = { h: new THREE.Color(0x5ea8ff), t: new THREE.Color(0xff9a4a), o: new THREE.Color(0xffd23f), nine: new THREE.Color(0x6fcf5a), left: new THREE.Color(0xff5a8a) };
  const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.01, 32), M(0xf4f4f0, 0.5)); plate.position.set(0.3, 0.005, 0.12); g.add(plate);
  const mat = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.004, 0.5), M(0x24303c, 0.9)); mat.position.set(0.0, 0.002, -0.05); g.add(mat);
  const tags = ['100', '10', '1'].map((t) => { const s = tag(t, '#ffd23f', 0.045); g.add(s); return s; });
  const leftTag = tag('0', '#ff8aa8', 0.05); leftTag.position.set(0.3, 0.11, 0.08); g.add(leftTag); leftTag.visible = false;
  let cubes = [];
  const mtx = new THREE.Matrix4();
  it.build = (n) => { it.n = n; const h = Math.floor(n / 100), t = Math.floor(n / 10) % 10, o = n % 10; cubes = [];
    for (let a = 0; a < h; a++) for (let j = 0; j < 100; j++) cubes.push({ kind: 'h', grp: a, idx: j, home: V(-0.4 + a * (10 * u + 0.025) + (j % 10) * u + u / 2, u / 2 + 0.004, -0.27 + Math.floor(j / 10) * u + u / 2) });
    for (let a = 0; a < t; a++) for (let j = 0; j < 10; j++) cubes.push({ kind: 't', grp: a, idx: j, home: V(-0.4 + a * (u + 0.018) + u / 2, u / 2 + 0.004, 0.02 + j * u + u / 2) });
    for (let a = 0; a < o; a++) cubes.push({ kind: 'o', grp: a, idx: 0, home: V(-0.4 + (t + 0.6) * (u + 0.018) + (a % 3) * (u + 0.012) + 0.25, u / 2 + 0.004, 0.06 + Math.floor(a / 3) * (u + 0.012)) });
    cubes.forEach((c) => { c.p = c.home.clone(); c.col = C[c.kind]; });
    tags[0].position.set(-0.4 + h * (10 * u + 0.025) / 2, 0.06, -0.31); tags[0].visible = h > 0;
    tags[1].position.set(-0.4 + t * (u + 0.018) / 2, 0.06, 0.28); tags[1].visible = t > 0;
    tags[2].position.set(-0.4 + (t + 0.6) * (u + 0.018) + 0.287, 0.05, 0.155); tags[2].visible = o > 0;
    it.split = 0; leftTag.visible = false; it.draw(); };
  // the cubes that come off: the last cube of every hundred and of every ten, and every loose one
  const plateSpot = (k) => V(0.3 + ((k % 4) - 1.5) * (u + 0.006), u / 2 + 0.012 + Math.floor(k / 16) * u, 0.12 + ((Math.floor(k / 4) % 4) - 1.5) * (u + 0.006));
  it.draw = () => { let k = 0; const s = ease(clamp01(it.split));
    cubes.forEach((c, i) => { let p = c.home, col = c.col; const off = (c.kind === 'h' && c.idx === 99) || (c.kind === 't' && c.idx === 9) || c.kind === 'o';
      if (it.split > 0) { if (off) { const q = plateSpot(k++); p = c.home.clone().lerp(q, s); p.y += Math.sin(s * Math.PI) * 0.12; col = c.col.clone().lerp(C.left, s); } else col = c.col.clone().lerp(C.nine, s); }
      im.setMatrixAt(i, mtx.makeTranslation(p.x, p.y, p.z)); im.setColorAt(i, col); });
    im.count = cubes.length; im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true; };
  it.leftover = () => { const n = it.n; return Math.floor(n / 100) + Math.floor(n / 10) % 10 + n % 10; };
  it.setSplit = (k) => { it.split = k; it.draw(); if (k >= 1) { leftTag.setText(it.leftover()); leftTag.visible = true; } };
  it.build(342);
  const W = (x, y, z) => g.localToWorld(V(x, y, z));
  it.leverPath = () => [W(-0.35, 0.1, 0.24), W(-0.35, 0.1, 0.32)];
  it.at = (k) => ({ plate: W(0.3, 0.2, 0.12), top: W(0, 0.24, -0.1), right: W(0.3, 0.3, -0.1) }[k] || W(0, 0.2, 0));
  noHit(g); it.noGrab = true; it.noPhys = true; it.height = 0.05; it.radius = 0.45; it.base = 0; return it;
}
export function bindNineHands(nb, lever, app, s = { split: 1 }, done = {}) {
  let anim = false;
  pushKnob(lever, { path: () => nb.leverPath(), active: () => stepNow(app, s.split) && nb.split < 1 && !anim, keepVisible: () => app.runner.i === s.split,
    press: () => { anim = true; let t = 0; const id = setInterval(() => { t += 0.04; nb.setSplit(Math.min(1, t)); if (t >= 1) { clearInterval(id); anim = false; done.split && done.split(); } }, 30); } });
}

// ------------------------------------------------------------------ P2 Ch 1 Fractions in Disguise: a floor of 100 tiles
// A square floor of 10 × 10 tiles (20 cm each) lies in front of the student. A paint roller moves along the rows; the
// tiles behind it turn colour, one by one. Per cent means "out of a hundred".
export function percentFloor(o = {}) {
  const it = new Item('wpct', { ...o, name: { en: 'Floor of 100 tiles', hi: '100 टाइलों का फ़र्श', hg: '100 tiles ka farsh' } });
  const g = it.g, S = 0.22, O = V(-1.1, 0.012, -1.0); // the near-left corner of the floor; rows go away from the student
  const tileG = new THREE.BoxGeometry(S * 0.94, 0.02, S * 0.94);
  const im = new THREE.InstancedMesh(tileG, new THREE.MeshStandardMaterial({ roughness: 0.4 }), 100); im.frustumCulled = false; g.add(im);
  const base = new THREE.Color(0xe8e2d6), paint = new THREE.Color(0x3fa7ff), paint2 = new THREE.Color(0xff9a4a);
  const pos = (n) => { const r = Math.floor(n / 10), c = n % 10; return V(O.x + (c + 0.5) * S, O.y, O.z - (r + 0.5) * S); };
  const mtx = new THREE.Matrix4(); for (let n = 0; n < 100; n++) { const p = pos(n); im.setMatrixAt(n, mtx.makeTranslation(p.x, p.y, p.z)); im.setColorAt(n, base); }
  // a coarser 5 × 5 grid of "big tiles" (2 × 2 each), shown for the last step
  const bigT = canvasTex(512, 512, (x) => { x.strokeStyle = '#ff9a4a'; x.lineWidth = 10; for (let i = 0; i <= 5; i++) { x.beginPath(); x.moveTo(i * 102.4, 0); x.lineTo(i * 102.4, 512); x.stroke(); x.beginPath(); x.moveTo(0, i * 102.4); x.lineTo(512, i * 102.4); x.stroke(); } });
  const big = flat(new THREE.PlaneGeometry(10 * S, 10 * S), new THREE.MeshBasicMaterial({ map: bigT, transparent: true, depthWrite: false, toneMapped: false }), 0.03); big.position.x = O.x + 5 * S; big.position.z = O.z - 5 * S; big.visible = false; g.add(big);
  const roller = new THREE.Group(); const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, S * 0.95, 16), M(0x3fa7ff, 0.7)); drum.rotation.z = Math.PI / 2; drum.position.y = 0.07; roller.add(drum);
  roller.add(rod(V(S * 0.5, 0.07, 0), V(S * 0.5, 0.45, 0.25), 0.008, M(0xcccccc, 0.3, 0.8))); g.add(roller);
  const rd = liveSign(0.4, 3.2); rd.position.set(2.0, 0.75, -2.3); g.add(rd);
  it.n = 0; it.mark = null; it.col2 = false;
  it.word = null;
  it.setN = (n) => { n = Math.max(0, Math.min(100, Math.round(n))); it.n = n; for (let k = 0; k < 100; k++) im.setColorAt(k, k < n ? (it.col2 ? paint2 : paint) : base); im.instanceColor.needsUpdate = true;
    const p = pos(Math.min(99, n)); roller.position.set(p.x, 0, p.z); roller.visible = n < 100;
    rd.set([`${n} / 100 = ${n}%`], it.col2 ? '#ff9a4a' : '#7ad0ff'); };
  it.setN(0);
  // paint whole big tiles (2 × 2 small tiles each), row by row of the 5 × 5 big grid
  it.setBig = (nb) => { nb = Math.max(0, Math.min(25, Math.round(nb))); const on = new Set(); for (let b = 0; b < nb; b++) { const br = Math.floor(b / 5), bc = b % 5; for (const [dr, dc] of [[0, 0], [0, 1], [1, 0], [1, 1]]) on.add((2 * br + dr) * 10 + 2 * bc + dc); }
    it.n = on.size; for (let k = 0; k < 100; k++) im.setColorAt(k, on.has(k) ? paint2 : base); im.instanceColor.needsUpdate = true; roller.visible = false; rd.set([`${nb} / 25 = ${on.size} / 100`], '#ff9a4a'); };
  it.showBig = (on = true) => { big.visible = on; };
  it.knobPath = () => [V(-0.45, 1.0, -0.42), V(0.45, 1.0, -0.42)];
  it.at = (k) => ({ floor: V(O.x + 5 * S, 0.6, O.z - 5 * S), side: V(2.0, 0.35, -2.3), side2: V(2.0, 0.1, -2.3) }[k] || V(0, 1, -2));
  noHit(g); it.noGrab = true; it.noPhys = true; it.height = 0.05; it.radius = 1.5; it.base = 0; return it;
}
export function bindPctHands(pf, knob, app, s = { paint: 1 }, goal = 25, done = {}) {
  const sync = slideKnob(knob, { path: () => pf.knobPath(), active: () => stepNow(app, s.paint) && pf.n !== goal, keepVisible: () => app.runner.i === s.paint,
    k: () => pf.n / 40, set: (k) => { let n = Math.round(clamp01(k) * 40); if (Math.abs(n - goal) <= 1) n = goal; pf.setN(n); if (n === goal) done.goal && done.goal(); } });
  const s0 = pf.setN; pf.setN = (n) => { s0(n); sync(); };
}

// ------------------------------------------------------------------ P2 Ch 7 Area: a trapezium field doubled
// A right-angled trapezium field (parallel sides 4 m and 2 m, 2 m apart) is marked on 1 m squares. A copy swings round
// the middle of its slanted side (half a turn) and the two together make a 6 m × 2 m rectangle.
export function trapField(o = {}) {
  const it = new Item('wtrap', { ...o, name: { en: 'Trapezium field', hi: 'समलंब खेत', hg: 'Trapezium khet' } });
  const g = it.g, O = V(-1.7, 0, -1.4), P = (x, y, h = 0.02) => V(O.x + x, h, O.z - y);
  // 1 m squares
  const gridT = canvasTex(768, 256, (x) => { x.strokeStyle = 'rgba(255,255,255,0.5)'; x.lineWidth = 4; for (let i = 0; i <= 6; i++) { x.beginPath(); x.moveTo(i * 128, 0); x.lineTo(i * 128, 256); x.stroke(); } for (let j = 0; j <= 2; j++) { x.beginPath(); x.moveTo(0, j * 128); x.lineTo(768, j * 128); x.stroke(); } });
  const grid = flat(new THREE.PlaneGeometry(6, 2), new THREE.MeshBasicMaterial({ map: gridT, transparent: true, depthWrite: false, toneMapped: false }), 0.01); grid.position.set(O.x + 3, 0.01, O.z - 1); g.add(grid);
  const shape = new THREE.Shape([new THREE.Vector2(0, 0), new THREE.Vector2(4, 0), new THREE.Vector2(2, 2), new THREE.Vector2(0, 2)]);
  const mk = (c, op) => { const m = new THREE.Mesh(new THREE.ShapeGeometry(shape), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: op, side: THREE.DoubleSide, depthWrite: false, toneMapped: false })); m.rotation.x = -Math.PI / 2; return m; };
  const field = mk(0x6fcf5a, 0.55); field.position.set(O.x, 0.02, O.z); g.add(field);
  const edge = [[0, 0], [4, 0], [2, 2], [0, 2]]; for (let i = 0; i < 4; i++) { const [a, b] = [edge[i], edge[(i + 1) % 4]]; g.add(rod(P(a[0], a[1], 0.04), P(b[0], b[1], 0.04), 0.02, glow(0xffffff))); }
  // the copy turns about the middle of the slanted side, M = (3, 1)
  const piv = new THREE.Group(); piv.position.copy(P(3, 1, 0.03)); g.add(piv);
  const copy = mk(0xffd23f, 0.55); copy.position.set(-3, 0, 1); piv.add(copy); // shape (x, y) → local (x − 3, 0, −(y − 1))
  const cEdge = edge.map(([x, y]) => [x - 3, -(y - 1)]); for (let i = 0; i < 4; i++) { const [a, b] = [cEdge[i], cEdge[(i + 1) % 4]]; piv.add(rod(V(a[0], 0.02, a[1]), V(b[0], 0.02, b[1]), 0.018, glow(0xffd23f))); }
  piv.visible = false;
  const lab = (t, x, y, c = '#ffffff') => { const s = tag(t, c, 0.22); s.position.copy(P(x, y, 0.3)); g.add(s); return s; };
  const lA = lab('4 m', 2, -0.35), lB = lab('2 m', 1, 2.35), lH = lab('2 m', -0.45, 1); const l6 = lab('6 m', 3, -0.35, '#ffd23f'); l6.visible = false;
  it.k = 0;
  it.setK = (k) => { it.k = clamp01(k); piv.visible = true; piv.rotation.y = Math.PI * it.k; piv.position.y = 0.03 + Math.sin(it.k * Math.PI) * 0.5; if (it.k >= 1) { l6.visible = true; lA.visible = false; } };
  it.knobPath = () => [V(-0.45, 1.0, -0.42), V(0.45, 1.0, -0.42)];
  it.at = (k) => ({ rect: P(4.4, 3.0, 0.5), half: P(1.0, 3.0, 0.5), count: P(1.2, 1.0, 0.6) }[k] || P(3, 1, 1));
  noHit(g); it.noGrab = true; it.noPhys = true; it.height = 0.05; it.radius = 3; it.base = 0; return it;
}
export function bindTrapHands(tf, knob, app, s = { turn: 1 }, done = {}) {
  const sync = slideKnob(knob, { path: () => tf.knobPath(), active: () => stepNow(app, s.turn) && tf.k < 1, keepVisible: () => app.runner.i <= s.turn,
    k: () => tf.k, set: (k) => { let v = clamp01(k); if (v > 0.93) v = 1; tf.setK(v); if (v >= 1) done.turn && done.turn(); } });
  const s0 = tf.setK; tf.setK = (k) => { s0(k); sync(); };
}
