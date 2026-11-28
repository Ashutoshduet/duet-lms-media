// DUET Maths Lab 360, hands-on in 3D, batch 10 (Class 7, Part 1): 1-cm cubes grown ten times at a time to a crore that
// the student stands inside (large numbers), a shop bill built item by item (arithmetic expressions), matchstick squares
// (letter-numbers), a magic square laid out on the ground (number play), and a tray of barfi cut into a fraction of a
// fraction (working with fractions).
import * as THREE from 'three';
import { Item } from './apparatus.js';
import { canvasTex } from './mats.js';
import { ease } from './mathlab2.js';
import { glow, rod, setRod } from './mathworld.js';
import { pushKnob } from './mathworld3.js';
import { liveSign } from './mathworld4.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const FONT = '"Noto Sans Devanagari", "Noto Sans", system-ui, sans-serif';
const stepNow = (app, i) => { const r = app.runner; return !!(r.exp && r.i === i && r.state === 'todo'); };
const M = (c, r = 0.6, m = 0, e = 0) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m, emissive: c, emissiveIntensity: e });
const noHit = (o) => { o.traverse((m) => { m.userData.noHit = true; }); return o; };
function tag(text, col = '#ffffff', h = 0.2, bg = 'rgba(12,16,24,0.85)') {
  const len = () => String(text).length; const w = len() <= 2 ? 2 : len() <= 4 ? 3 : len() <= 7 ? 4 : 6, W = 128 * w;
  const paint = (x, txt, c) => { x.clearRect(0, 0, W, 128); x.fillStyle = bg; x.beginPath(); x.roundRect(4, 4, W - 8, 120, 40); x.fill(); x.fillStyle = c; x.font = `800 ${String(txt).length > 9 ? 58 : 72}px ${FONT}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(String(txt), W / 2, 68); };
  const t = canvasTex(W, 128, (x) => paint(x, text, col));
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: false, toneMapped: false })); s.scale.set(h * w, h, 1); s.renderOrder = 40; s.userData.noHit = true;
  s.setText = (txt, c = col) => { paint(t.image.getContext('2d'), txt, c); t.needsUpdate = true; };
  return s;
}
// Indian grouping: 1,00,00,000
export const ind = (n) => { const s = String(n); if (s.length <= 3) return s; const last = s.slice(-3); let rest = s.slice(0, -3); const parts = []; while (rest.length > 2) { parts.unshift(rest.slice(-2)); rest = rest.slice(0, -2); } if (rest) parts.unshift(rest); return parts.join(',') + ',' + last; };

// ------------------------------------------------------------------ Ch 1 Large Numbers Around Us: from 1 to a crore
// A 1 cm cube sits on a stand. Each push of the lever makes ten times as many: a rod of 10, a flat of 100, a cube of 1,000
// (10 cm), a 1 m rod of 10,000, a 1 m × 1 m slab of a lakh, a 1 m cube of 10 lakh. A crore of them would be a cube
// 2.15 m wide, built round the student.
export function crorePlay(o = {}) {
  const it = new Item('wcrore', { ...o, name: { en: 'Cubes from one to a crore', hi: 'एक से करोड़ तक घन', hg: 'Ek se crore tak cubes' } });
  const g = it.g, SZ = -1.7;
  const stand = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.9, 0.5), M(0x8a6a44, 0.85)); stand.position.set(-1.25, 0.45, SZ); g.add(stand);
  const cube = new THREE.BoxGeometry(1, 1, 1);
  const COLS = [0xff5a4f, 0xffd23f, 0x6fcf5a, 0x5ec8ff, 0xffa64a, 0xc58bff, 0x5ee0d0];
  // stage k: cell size, cells along x, y, z, and the corner where it starts
  const ST = [[0.01, 1, 1, 1, V(-1.6, 0.9, SZ)], [0.01, 10, 1, 1, V(-1.53, 0.9, SZ)], [0.01, 10, 1, 10, V(-1.37, 0.9, SZ + 0.05)], [0.01, 10, 10, 10, V(-1.17, 0.9, SZ + 0.05)],
    [0.1, 10, 1, 1, V(-0.6, 0, SZ - 0.1)], [0.1, 10, 1, 10, V(0.6, 0, SZ - 0.1)], [0.1, 10, 10, 10, V(1.8, 0, SZ - 0.1)]];
  const mtx = new THREE.Matrix4();
  const stages = ST.map(([c, nx, ny, nz, P], k) => { const n = nx * ny * nz, im = new THREE.InstancedMesh(cube, M(COLS[k], 0.55, 0, 0.12), n); im.frustumCulled = false; let i = 0;
    for (let a = 0; a < nx; a++) for (let b = 0; b < ny; b++) for (let d = 0; d < nz; d++) { mtx.makeScale(c * 0.9, c * 0.9, c * 0.9).setPosition(P.x + (a + 0.5) * c, P.y + (b + 0.5) * c, P.z - (d + 0.5) * c); im.setMatrixAt(i++, mtx); }
    im.visible = false; g.add(im); return im; });
  const NUM = [1, 10, 100, 1000, 10000, 100000, 1000000];
  const tags = ST.map(([c, nx, ny, nz, P], k) => { const t = tag(ind(NUM[k]), '#ffffff', k < 4 ? 0.07 : 0.16); t.position.set(P.x + nx * c / 2, P.y + ny * c + (k < 4 ? 0.07 : 0.2), P.z - nz * c / 2); t.visible = false; g.add(t); return t; });
  // a crore: a cube 2.154 m wide around the student
  const S = Math.cbrt(1e7) / 100, crore = new THREE.Group(); crore.position.set(0, S / 2, -0.2);
  const face = new THREE.Mesh(new THREE.BoxGeometry(S, S, S), new THREE.MeshBasicMaterial({ color: 0x7ad0ff, transparent: true, opacity: 0.12, side: THREE.DoubleSide, depthWrite: false, toneMapped: false })); crore.add(face);
  crore.add(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(S, S, S)), new THREE.LineBasicMaterial({ color: 0x7ad0ff, toneMapped: false })));
  crore.visible = false; g.add(crore);
  const rd = liveSign(0.5, 3.6); rd.position.set(0.4, 1.6, -3.4); g.add(rd);
  it.words = () => ['lakh', 'crore'];
  it.stage = 0;
  const say = () => { const [lk, cr] = it.words(); const n = it.stage === 7 ? 1e7 : NUM[it.stage]; const extra = n === 1e5 ? ` = 1 ${lk}` : n === 1e6 ? ` = 10 ${lk}` : n === 1e7 ? ` = 1 ${cr}` : ''; rd.set([`${ind(n)}${extra}`], it.stage === 7 ? '#7ad0ff' : '#ffd23f'); };
  it.relabel = say;
  it.setStage = (k) => { it.stage = k; stages.forEach((m, i) => { m.visible = i <= Math.min(k, 6); }); tags.forEach((t, i) => { t.visible = i <= Math.min(k, 6); }); crore.visible = k >= 7; say(); };
  it.setStage(0);
  it.next = () => { if (it.stage >= 6) return false; it.setStage(it.stage + 1); return true; };
  it.leverPath = () => [V(-0.45, 1.0, -0.3), V(-0.45, 1.0, -0.05)];
  it.at = (k) => ({ m3: V(2.3, 1.55, SZ - 0.6), crore: V(0.4, 2.45, -1.3) }[k] || V(0, 1.5, -2));
  noHit(g); it.noGrab = true; it.noPhys = true; it.height = 1; it.radius = 2.5; it.base = 0; return it;
}
export function bindCroreHands(cp, lever, app, s = { grow: 1 }, done = {}) {
  pushKnob(lever, { path: () => cp.leverPath(), active: () => stepNow(app, s.grow) && cp.stage < 6, keepVisible: () => app.runner.i === s.grow, press: () => { if (cp.next() && cp.stage >= 6) done.grow && done.grow(); } });
}

// ------------------------------------------------------------------ Ch 2 Arithmetic Expressions: a shop bill
// Biscuits (₹12 a packet) and notebooks (₹25 each) are on a shelf. Each push of the lever puts the next item on the
// counter and the bill grows as an expression.
export function shopBill(o = {}) {
  const it = new Item('wshop', { ...o, name: { en: 'Shop counter', hi: 'दुकान का काउंटर', hg: 'Dukaan ka counter' } });
  const g = it.g;
  const shelf = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.02, 0.16), M(0x8a6a44, 0.8)); shelf.position.set(0, 0.12, -0.22); g.add(shelf);
  for (const x of [-0.34, 0.34]) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.12, 0.16), M(0x8a6a44, 0.8)); l.position.set(x, 0.06, -0.22); g.add(l); }
  const bisG = new THREE.BoxGeometry(0.1, 0.03, 0.065), nbG = new THREE.BoxGeometry(0.105, 0.012, 0.15);
  const bisT = canvasTex(256, 160, (x) => { x.fillStyle = '#e8762a'; x.fillRect(0, 0, 256, 160); for (let i = 0; i < 3; i++) { x.fillStyle = '#c98a3a'; x.beginPath(); x.arc(58 + i * 70, 80, 30, 0, Math.PI * 2); x.fill(); x.fillStyle = '#8a5a22'; for (let d = 0; d < 5; d++) { x.beginPath(); x.arc(58 + i * 70 + Math.cos(d * 1.3) * 14, 80 + Math.sin(d * 1.3) * 14, 3, 0, Math.PI * 2); x.fill(); } } });
  const nbT = canvasTex(160, 256, (x) => { x.fillStyle = '#2f6fd0'; x.fillRect(0, 0, 160, 256); x.fillStyle = '#ffffff'; x.fillRect(20, 30, 120, 60); x.strokeStyle = '#9ec2ff'; x.lineWidth = 4; for (let y = 120; y < 240; y += 24) { x.beginPath(); x.moveTo(20, y); x.lineTo(140, y); x.stroke(); } });
  const mk = (kind) => { const isB = kind === 'b'; const mats = [M(isB ? 0xe8762a : 0x2f6fd0, 0.7), M(isB ? 0xe8762a : 0x2f6fd0, 0.7), new THREE.MeshStandardMaterial({ map: isB ? bisT : nbT, roughness: 0.7 }), M(isB ? 0xe8762a : 0x2f6fd0, 0.7), M(isB ? 0xe8762a : 0x2f6fd0, 0.7), M(isB ? 0xe8762a : 0x2f6fd0, 0.7)];
    const m = new THREE.Mesh(isB ? bisG : nbG, mats); g.add(m); return m; };
  const ORDER = ['b', 'b', 'b', 'n', 'n'], PRICE = { b: 12, n: 25 };
  const items = ORDER.map((k, i) => { const m = mk(k); m.home = V(k === 'b' ? -0.25 + i * 0.11 : 0.12 + (i - 3) * 0.13, k === 'b' ? 0.145 : 0.137, -0.22); m.spot = V(-0.25 + i * 0.125, k === 'b' ? 0.015 : 0.006, 0.07); m.position.copy(m.home); return m; });
  const pB = tag('₹12', '#ffd23f', 0.04); pB.position.set(-0.14, 0.22, -0.2); g.add(pB);
  const pN = tag('₹25', '#7ad0ff', 0.04); pN.position.set(0.18, 0.22, -0.2); g.add(pN);
  const rd = liveSign(0.12, 3.4); rd.position.set(0, 0.34, -0.32); g.add(rd);
  it.n = 0; it.busy = false;
  const show = () => { const k = it.n; if (!k) { rd.set(['₹0'], '#ffffff'); return; } const parts = ORDER.slice(0, k).map((c) => PRICE[c]); const nb = ORDER.slice(0, k).filter((c) => c === 'b').length, nn = k - nb;
    const short = [nb ? (nb > 1 ? `${nb} × 12` : '12') : '', nn ? (nn > 1 ? `${nn} × 25` : '25') : ''].filter(Boolean).join(' + ');
    rd.set([parts.join(' + '), short], ['#ffffff', '#ffd23f']); };
  it.say = (lines, cols) => rd.set(lines, cols);
  it.setN = (k) => { it.n = k; items.forEach((m, i) => { m.position.copy(i < k ? m.spot : m.home); }); show(); };
  let anim = null;
  it.add1 = () => { if (it.busy || it.n >= ORDER.length) return false; const m = items[it.n]; anim = { m, t: 0, a: m.home.clone(), b: m.spot.clone() }; it.busy = true; it.n++; show(); return true; };
  it.update = (dt) => { if (!anim) return; anim.t = Math.min(1, anim.t + Math.min(dt || 0.016, 0.05) * 2.5); const p = anim.a.clone().lerp(anim.b, ease(anim.t)); p.y += Math.sin(anim.t * Math.PI) * 0.08; anim.m.position.copy(p); if (anim.t >= 1) { anim = null; it.busy = false; if (it.onAdd) it.onAdd(it.n); } };
  it.setN(0);
  const W = (x, y, z) => g.localToWorld(V(x, y, z));
  it.leverPath = () => [W(-0.3, 0.1, 0.24), W(-0.3, 0.1, 0.32)];
  it.at = (k) => ({ top: W(0, 0.43, -0.2), front: W(0.05, 0.12, 0.12) }[k] || W(0, 0.3, 0));
  noHit(g); it.noGrab = true; it.noPhys = true; it.height = 0.05; it.radius = 0.4; it.base = 0; return it;
}
export function bindShopHands(sb, lever, app, s = { add: 1 }, done = {}) {
  sb.onAdd = (n) => { if (n >= 5) done.all && done.all(); };
  pushKnob(lever, { path: () => sb.leverPath(), active: () => stepNow(app, s.add) && !sb.busy && sb.n < 5, keepVisible: () => app.runner.i === s.add, press: () => sb.add1() });
}

// ------------------------------------------------------------------ Ch 4 Expressions using Letter-Numbers: matchsticks
// Big matchsticks (40 cm) lie on the ground. One square needs 4; each push of the lever adds a square to the row, with
// the 3 new sticks lit up. The count follows 3n + 1.
export function matchRow(o = {}) {
  const it = new Item('wmatch', { ...o, name: { en: 'Matchstick squares', hi: 'तीलियों के वर्ग', hg: 'Teeliyon ke squares' } });
  const g = it.g, L = 0.32, Z = -1.9, MAX = 31;
  const stickG = new THREE.CylinderGeometry(0.014, 0.014, L * 0.9, 8); stickG.rotateZ(Math.PI / 2);
  const headG = new THREE.SphereGeometry(0.026, 12, 8); headG.scale(1.3, 1, 1); headG.translate(L * 0.46, 0, 0);
  const wood = new THREE.InstancedMesh(stickG, new THREE.MeshStandardMaterial({ roughness: 0.6 }), MAX), heads = new THREE.InstancedMesh(headG, M(0xd2382a, 0.5), MAX);
  wood.frustumCulled = heads.frustumCulled = false; g.add(wood, heads);
  const PLAIN = new THREE.Color(0xe8cf9a), NEW = new THREE.Color(0xffd23f);
  const rd = liveSign(0.45, 3.4); rd.position.set(0, 0.95, Z - 1.0); g.add(rd);
  it.words = () => ['squares', 'sticks'];
  it.n = 1;
  const mtx = new THREE.Matrix4(), q = new THREE.Quaternion();
  it.setN = (n) => { it.n = n; const x0 = -n * L / 2; const list = [];
    for (let i = 0; i < n; i++) { list.push([x0 + (i + 0.5) * L, Z, 0, i]); list.push([x0 + (i + 0.5) * L, Z - L, 0, i]); }
    for (let i = 0; i <= n; i++) list.push([x0 + i * L, Z - L / 2, Math.PI / 2, Math.max(0, i - 1)]);
    wood.count = heads.count = list.length;
    list.forEach(([x, z, r, sq], k) => { q.setFromAxisAngle(V(0, 1, 0), r); mtx.compose(V(x, 0.016, z), q, V(1, 1, 1)); wood.setMatrixAt(k, mtx); heads.setMatrixAt(k, mtx); wood.setColorAt(k, n > 1 && sq === n - 1 && n <= 5 ? NEW : PLAIN); });
    wood.instanceMatrix.needsUpdate = heads.instanceMatrix.needsUpdate = true; wood.instanceColor.needsUpdate = true;
    const [sw, st] = it.words(); rd.set([`${sw}: ${n}    ${st}: ${3 * n + 1}`], '#ffd23f'); };
  it.relabel = () => it.setN(it.n);
  it.setN(1);
  it.next = () => { if (it.n >= 5) return false; it.setN(it.n + 1); return true; };
  it.leverPath = () => [V(-0.45, 1.0, -0.3), V(-0.45, 1.0, -0.05)];
  it.at = (k) => ({ rule: V(0, 0.55, Z - 0.8), row: V(0, 0.45, Z - L / 2) }[k] || V(0, 1, Z));
  noHit(g); it.noGrab = true; it.noPhys = true; it.height = 0.05; it.radius = 2; it.base = 0; return it;
}
export function bindMatchHands(mr, lever, app, s = { add: 1 }, done = {}) {
  pushKnob(lever, { path: () => mr.leverPath(), active: () => stepNow(app, s.add) && mr.n < 5, keepVisible: () => app.runner.i === s.add, press: () => { if (mr.next() && mr.n >= 5) done.all && done.all(); } });
}

// ------------------------------------------------------------------ Ch 6 Number Play: a magic square on the ground
// A 3 × 3 grid is chalked on the ground. Each push of the lever drops the next row of numbered stones; every row, column
// and diagonal of the finished square adds up to 15.
export function magicSquare(o = {}) {
  const it = new Item('wmagic', { ...o, name: { en: 'Magic square', hi: 'जादुई वर्ग', hg: 'Magic square' } });
  const g = it.g, C = 0.9, CX = 0, CZ = -2.4, NUMS = [[8, 1, 6], [3, 5, 7], [4, 9, 2]]; // row 0 is the far row
  const cell = (r, c) => V(CX + (c - 1) * C, 0, CZ + (r - 1) * C);
  for (let i = 0; i <= 3; i++) { g.add(rod(V(CX - 1.5 * C, 0.012, CZ + (i - 1.5) * C), V(CX + 1.5 * C, 0.012, CZ + (i - 1.5) * C), 0.012, glow(0xffffff))); g.add(rod(V(CX + (i - 1.5) * C, 0.012, CZ - 1.5 * C), V(CX + (i - 1.5) * C, 0.012, CZ + 1.5 * C), 0.012, glow(0xffffff))); }
  const stoneG = new THREE.CylinderGeometry(0.3, 0.32, 0.08, 24);
  const stones = []; NUMS.forEach((row, r) => row.forEach((n, c) => { const s = new THREE.Group(); const m = new THREE.Mesh(stoneG, M(0x9a948a, 0.9)); m.position.y = 0.04; s.add(m); const t = tag(String(n), n === 5 ? '#8be07a' : '#ffffff', 0.26); t.position.y = 0.3; s.add(t); s.position.copy(cell(r, c)); s.visible = false; s.r = r; g.add(s); stones.push(s); }));
  const lines = [], sums = [];
  const addLine = (a, b, at) => { const l = rod(a.clone().setY(0.1), b.clone().setY(0.1), 0.02, glow(0x8be07a)); l.visible = false; g.add(l); lines.push(l); const t = tag('15', '#8be07a', 0.2); t.position.copy(at).setY(0.3); t.visible = false; g.add(t); sums.push(t); };
  for (let r = 0; r < 3; r++) addLine(cell(r, 0).add(V(-0.35, 0, 0)), cell(r, 2).add(V(0.35, 0, 0)), cell(r, 2).add(V(0.85, 0, 0)));
  for (let c = 0; c < 3; c++) addLine(cell(0, c).add(V(0, 0, -0.35)), cell(2, c).add(V(0, 0, 0.35)), cell(0, c).add(V(0, 0, -0.85)));
  addLine(cell(0, 0).add(V(-0.3, 0, -0.3)), cell(2, 2).add(V(0.3, 0, 0.3)), cell(2, 2).add(V(0.75, 0, 0.75)));
  addLine(cell(0, 2).add(V(0.3, 0, -0.3)), cell(2, 0).add(V(-0.3, 0, 0.3)), cell(2, 0).add(V(-0.75, 0, 0.75)));
  it.rows = 0; let drop = null;
  it.setRows = (n) => { it.rows = n; stones.forEach((s) => { s.visible = s.r < n; s.position.y = 0; }); lines.forEach((l, i) => { const on = i < 3 && i < n; l.visible = on; sums[i].visible = on; }); };
  it.next = () => { if (it.rows >= 3 || drop) return false; drop = { r: it.rows, t: 0 }; stones.forEach((s) => { if (s.r === drop.r) { s.visible = true; s.position.y = 1.2; } }); return true; };
  it.update = (dt) => { if (!drop) return; drop.t = Math.min(1, drop.t + Math.min(dt || 0.016, 0.05) * 2); stones.forEach((s) => { if (s.r === drop.r) s.position.y = 1.2 * (1 - drop.t * drop.t); });
    if (drop.t >= 1) { const r = drop.r; drop = null; it.setRows(r + 1); if (it.onRow) it.onRow(it.rows); } };
  it.busy = () => !!drop;
  it.showAll = (k = 8) => { lines.forEach((l, i) => { l.visible = i < k; sums[i].visible = i < k; }); };
  it.centre = (on = true) => { stones[4].scale.setScalar(on ? 1.25 : 1); };
  it.setRows(0);
  it.leverPath = () => [V(-0.45, 1.0, -0.3), V(-0.45, 1.0, -0.05)];
  it.at = (k) => ({ total: V(CX, 0.8, CZ - 2.1), mid: cell(1, 1).add(V(0, 0.8, 0)) }[k] || V(0, 1.2, CZ));
  noHit(g); it.noGrab = true; it.noPhys = true; it.height = 0.1; it.radius = 2; it.base = 0; return it;
}
export function bindMagicHands(ms, lever, app, s = { place: 1 }, done = {}) {
  ms.onRow = (n) => { if (n >= 3) done.all && done.all(); };
  pushKnob(lever, { path: () => ms.leverPath(), active: () => stepNow(app, s.place) && ms.rows < 3 && !ms.busy(), keepVisible: () => app.runner.i === s.place, press: () => ms.next() });
}

// ------------------------------------------------------------------ Ch 8 Working with Fractions: a tray of barfi
// A tray of barfi is cut into 4 strips; one strip has been eaten, so 3/4 is left. The lever drives a knife across that
// cuts the tray into 3 rows; then 2 of the 3 rows of what is left (2/3 of 3/4) are given away: 6 of 12 pieces, 1/2.
export function barfiTray(o = {}) {
  const it = new Item('wbarfi', { ...o, name: { en: 'Tray of barfi', hi: 'बर्फ़ी की थाली', hg: 'Barfi ki thaali' } });
  const g = it.g, TW = 0.4, TD = 0.3, PH = 0.025, cw = TW / 4, cd = TD / 3;
  const tray = new THREE.Mesh(new THREE.BoxGeometry(TW + 0.04, 0.012, TD + 0.04), M(0xc0c4c8, 0.3, 0.8)); tray.position.y = 0.006; g.add(tray);
  for (const [x, z, w, d] of [[0, (TD + 0.04) / 2, TW + 0.04, 0.008], [0, -(TD + 0.04) / 2, TW + 0.04, 0.008], [(TW + 0.04) / 2, 0, 0.008, TD + 0.04], [-(TW + 0.04) / 2, 0, 0.008, TD + 0.04]]) { const r = new THREE.Mesh(new THREE.BoxGeometry(w, 0.03, d), M(0xc0c4c8, 0.3, 0.8)); r.position.set(x, 0.02, z); g.add(r); }
  const pieceG = new THREE.BoxGeometry(1, PH, 1); pieceG.translate(0, PH / 2 + 0.012, 0);
  const pm = new THREE.InstancedMesh(pieceG, new THREE.MeshStandardMaterial({ roughness: 0.55 }), 12); pm.frustumCulled = false; g.add(pm);
  const BASE = new THREE.Color(0xf3dfa8), GIVE = new THREE.Color(0xff9a4a);
  const knife = new THREE.Group(); const blade = new THREE.Mesh(new THREE.BoxGeometry(0.003, 0.05, 0.16), M(0xdfe4ea, 0.2, 0.9)); blade.position.y = 0.06; knife.add(blade); const hd = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.025, 0.09), M(0x3a2a1a, 0.6)); hd.position.set(0, 0.08, 0.12); knife.add(hd); knife.visible = false; g.add(knife);
  const rd = liveSign(0.08, 4.0); rd.position.set(0, 0.12, -0.27); g.add(rd);
  it.rowsCut = 0; it.give = 0; it.lift = 0;
  const mtx = new THREE.Matrix4();
  const draw = () => { let k = 0; for (let c = 0; c < 4; c++) for (let r = 0; r < 3; r++) { const i = c * 3 + r, eaten = c === 3, gap = 0.006 * it.rowsCut;
    const given = !eaten && r < 2 && it.give > 0; const lift = given ? it.lift * 0.04 : 0;
    mtx.makeScale(cw - 0.006, eaten ? 0.0001 : 1, (it.rowsCut ? cd - gap : TD) ).setPosition(-TW / 2 + (c + 0.5) * cw, eaten ? -1 : lift, it.rowsCut ? -TD / 2 + (r + 0.5) * cd : 0);
    if (!it.rowsCut && r > 0) mtx.makeScale(0.0001, 0.0001, 0.0001).setPosition(0, -1, 0);
    pm.setMatrixAt(i, mtx); pm.setColorAt(i, given ? GIVE : BASE); k++; }
    pm.count = k; pm.instanceMatrix.needsUpdate = true; pm.instanceColor.needsUpdate = true; };
  it.say = (lines, cols) => rd.set(lines, cols);
  it.setCut = (v) => { it.rowsCut = v ? 1 : 0; draw(); };
  it.setGive = (k) => { it.give = k > 0 ? 1 : 0; it.lift = k; draw(); };
  it.cutting = false; let ct = null;
  it.cut = () => { if (it.cutting || it.rowsCut) return false; it.cutting = true; ct = { t: 0 }; knife.visible = true; return true; };
  it.update = (dt) => { if (!ct) return; ct.t = Math.min(1, ct.t + Math.min(dt || 0.016, 0.05) * 0.8); const pass = ct.t < 0.5 ? 0 : 1, u = (ct.t % 0.5) / 0.5; knife.rotation.y = Math.PI / 2; knife.position.set(-TW / 2 - 0.05 + u * (TW + 0.1), 0, -TD / 2 + (pass + 1) * cd);
    if (ct.t >= 1) { ct = null; knife.visible = false; it.cutting = false; it.setCut(true); if (it.onCut) it.onCut(); } };
  it.setCut(false);
  const W = (x, y, z) => g.localToWorld(V(x, y, z));
  it.leverPath = () => [W(-0.3, 0.1, 0.24), W(-0.3, 0.1, 0.32)];
  it.at = (k) => ({ top: W(0, 0.3, -0.24), side: W(0.3, 0.1, 0.0) }[k] || W(0, 0.2, 0));
  noHit(g); it.noGrab = true; it.noPhys = true; it.height = 0.05; it.radius = 0.35; it.base = 0; return it;
}
export function bindBarfiHands(bt, lever, app, s = { cut: 1 }, done = {}) {
  bt.onCut = () => done.cut && done.cut();
  pushKnob(lever, { path: () => bt.leverPath(), active: () => stepNow(app, s.cut) && !bt.cutting && !bt.rowsCut, keepVisible: () => app.runner.i === s.cut, press: () => bt.cut() });
}
void setRod;
