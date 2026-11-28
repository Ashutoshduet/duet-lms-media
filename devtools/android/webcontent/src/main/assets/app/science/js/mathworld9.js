// DUET Maths Lab 360, hands-on in 3D, batch 9 (Class 8, Part 2): workers harvesting a field (inverse proportion and
// sharing in a ratio), a Sierpinski triangle grown on the ground (fractals), stacks of bricks levelled to their mean
// (mean and median), and a "think of a number" trick played with a bag of marbles (algebra play).
import * as THREE from 'three';
import { Item } from './apparatus.js';
import { canvasTex } from './mats.js';
import { clamp01, ease } from './mathlab2.js';
import { glow, rod } from './mathworld.js';
import { pushKnob } from './mathworld3.js';
import { liveSign } from './mathworld4.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const FONT = '"Noto Sans Devanagari", "Noto Sans", system-ui, sans-serif';
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
// a simple standing person: body, head, a coloured shirt
function person(shirt = 0x3fa7ff) {
  const g = new THREE.Group();
  const legs = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.1, 0.8, 10), M(0x3a3f4a, 0.8)); legs.position.y = 0.4; g.add(legs);
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.14, 0.62, 12), M(shirt, 0.7)); body.position.y = 1.1; g.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.12, 14, 10), M(0xb07a52, 0.7)); head.position.y = 1.55; g.add(head);
  const hat = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.03, 16), M(0xd8c088, 0.9)); hat.position.y = 1.64; g.add(hat);
  return noHit(g);
}

// ------------------------------------------------------------------ P2 Ch 3 Proportional Reasoning-2: harvesting a field
// A field has 12 rows of wheat. One worker cuts one row in a day. The lever calls more workers (1, 2, 3, 4, 6, 12); they
// harvest the field and the number of days shrinks: workers × days = 12. Then the harvest is shared in a ratio.
export function harvestField(o = {}) {
  const it = new Item('wharvest', { ...o, name: { en: 'Wheat field', hi: 'गेहूँ का खेत', hg: 'Gehun ka khet' } });
  const g = it.g, R = 12, PER = 14, X0 = -2.2, DX = 0.36, Z0 = -1.8, Z1 = -4.6;
  const rowX = (r) => X0 + r * DX;
  const soil = new THREE.Mesh(new THREE.PlaneGeometry(R * DX + 0.4, Z0 - Z1 + 0.4), M(0x6a4a30, 1)); soil.rotation.x = -Math.PI / 2; soil.position.set(X0 + (R - 1) * DX / 2, 0.01, (Z0 + Z1) / 2); g.add(soil);
  const stalkG = new THREE.CylinderGeometry(0.014, 0.026, 0.9, 6); stalkG.translate(0, 0.45, 0);
  const stalks = new THREE.InstancedMesh(stalkG, new THREE.MeshStandardMaterial({ roughness: 0.8 }), R * PER); stalks.frustumCulled = false; g.add(stalks);
  const GOLD = new THREE.Color(0xd9b44a), CUT = new THREE.Color(0x9a7a3a), A1 = new THREE.Color(0xffd23f), A2 = new THREE.Color(0x5ec8ff);
  const sz = (j) => Z0 - (j + 0.5) * (Z0 - Z1) / PER;
  const mtx = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3();
  it.cut = new Array(R).fill(0); // how far each row has been cut (0 … 1)
  it.share = null;
  const drawRows = () => { for (let r = 0; r < R; r++) for (let j = 0; j < PER; j++) { const k = r * PER + j, done = (j + 0.5) / PER < it.cut[r]; sc.set(1, done ? 0.18 : 1, 1); q.setFromAxisAngle(V(0, 0, 1), Math.sin(k * 1.7) * 0.06);
    mtx.compose(V(rowX(r) + Math.sin(k * 3.1) * 0.03, 0, sz(j)), q, sc); stalks.setMatrixAt(k, mtx); stalks.setColorAt(k, it.share ? (r < it.share ? A1 : A2) : done ? CUT : GOLD); }
    stalks.instanceMatrix.needsUpdate = true; stalks.instanceColor.needsUpdate = true; };
  drawRows();
  const SH = [0x3fa7ff, 0xff7a5a, 0x6fcf5a, 0xffd23f, 0xc58bff, 0xff9ad0, 0x5ee0d0, 0xffa64a, 0x9ab0ff, 0xe0e070, 0xa0e0a0, 0xf08080];
  const men = SH.map((c) => { const p = person(c); p.scale.setScalar(0.8); p.visible = false; g.add(p); return p; });
  const rd = liveSign(0.6, 2.4); rd.position.set(2.9, 1.55, -3.0); g.add(rd);
  it.words = () => ['workers', 'days'];
  it.w = 1; it.working = false; let day = 0, t = 0;
  const label = () => { const [wk, dy] = it.words(); rd.set([`${wk}: ${it.w}    ${dy}: ${R / it.w}`, `${it.w} × ${R / it.w} = ${R}`], ['#ffffff', '#ffd23f']); };
  it.setW = (w) => { it.w = w; it.cut.fill(0); day = 0; men.forEach((m, i) => { m.visible = i < w; m.position.set(rowX(i), 0, Z0 + 0.45); m.rotation.y = Math.PI; }); drawRows(); label(); };
  it.relabel = label;
  it.work = () => { if (it.working) return false; it.cut.fill(0); day = 0; t = 0; it.working = true; return true; };
  it.update = (dt) => { if (!it.working) return; t += Math.min(dt || 0.016, 0.05) / 0.8; const D = R / it.w;
    while (t >= 1 && day < D) { for (let i = 0; i < it.w; i++) it.cut[day * it.w + i] = 1; day++; t -= 1; }
    if (day >= D) { it.working = false; men.forEach((m, i) => { if (i < it.w) m.position.set(rowX(i + (D - 1) * it.w), 0, Z1 - 0.3); }); drawRows(); if (it.onDone) it.onDone(it.w); return; }
    for (let i = 0; i < it.w; i++) { const r = day * it.w + i; it.cut[r] = t; men[i].position.set(rowX(r), 0, Z0 + 0.3 - t * (Z0 - Z1 + 0.6)); men[i].rotation.y = Math.PI; } drawRows(); };
  const order = [1, 2, 3, 4, 6, 12];
  it.more = () => { const i = order.indexOf(it.w); if (i < order.length - 1) it.setW(order[i + 1]); it.work(); };
  it.setShare = (n) => { it.share = n; drawRows(); };
  it.setW(1);
  it.leverPath = () => [V(-0.45, 1.0, -0.3), V(-0.45, 1.0, -0.05)];
  it.at = (k) => ({ table: V(2.9, 0.75, -3.0), a: V(rowX(3.5), 1.5, Z0 - 0.2), b: V(rowX(9.5), 1.5, Z0 - 0.2) }[k] || V(0, 1.5, -3));
  noHit(g); it.noGrab = true; it.noPhys = true; it.height = 1; it.radius = 3; it.base = 0; return it;
}
export function bindHarvestHands(hf, lever, app, s = { more: 1 }, upto = 4) {
  pushKnob(lever, { path: () => hf.leverPath(), active: () => stepNow(app, s.more) && !hf.working && hf.w < upto, keepVisible: () => app.runner.i === s.more, press: () => hf.more() });
}

// ------------------------------------------------------------------ P2 Ch 4 Exploring Some Geometric Themes: a fractal
// A big yellow triangle lies on the ground. The rule: join the midpoints of each yellow triangle's sides and take out the
// middle one. Each push of the lever applies the rule once more.
export function sierpinski(o = {}) {
  const it = new Item('wsier', { ...o, name: { en: 'Sierpinski triangle', hi: 'सियरपिंस्की त्रिभुज', hg: 'Sierpinski triangle' } });
  const g = it.g, L = 3.6, A = V(-L / 2, 0, -1.4), H = L * Math.sqrt(3) / 2; // A: front-left corner; the apex points away from the student
  const tri = new THREE.Shape([new THREE.Vector2(0, 0), new THREE.Vector2(1, 0), new THREE.Vector2(0.5, Math.sqrt(3) / 2)]);
  const geo = new THREE.ShapeGeometry(tri); geo.rotateX(-Math.PI / 2); // (x, y) → (x, 0, −y)
  const MAXN = 729, im = new THREE.InstancedMesh(geo, new THREE.MeshBasicMaterial({ color: 0xffd23f, toneMapped: false, side: THREE.DoubleSide }), MAXN); im.frustumCulled = false; g.add(im);
  const holeT = new THREE.Mesh(new THREE.ShapeGeometry(tri), new THREE.MeshBasicMaterial({ color: 0x1a1f26, transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false })); holeT.geometry.rotateX(-Math.PI / 2); holeT.scale.setScalar(L); holeT.position.copy(A).setY(0.008); g.add(holeT);
  const out = [[0, 0], [1, 0], [0.5, Math.sqrt(3) / 2]].map(([x, y]) => A.clone().add(V(x * L, 0.03, -y * L))); for (let i = 0; i < 3; i++) g.add(rod(out[i], out[(i + 1) % 3], 0.015, glow(0xffffff)));
  const corner = new THREE.Group(); const cpts = [[0, 0], [0.5, 0], [0.25, Math.sqrt(3) / 4]].map(([x, y]) => A.clone().add(V(x * L, 0.05, -y * L))); for (let i = 0; i < 3; i++) corner.add(rod(cpts[i], cpts[(i + 1) % 3], 0.025, glow(0x5ec8ff))); corner.visible = false; g.add(corner);
  const rd = liveSign(0.7, 2.8); rd.position.set(L / 2 + 0.9, 0.9, -1.4 - H / 2 - 0.3); g.add(rd);
  it.words = () => ['triangles', 'left'];
  it.stage = 0;
  const mtx = new THREE.Matrix4();
  it.setStage = (n) => { it.stage = n; const s = L / Math.pow(2, n); let list = [[0, 0]];
    for (let k = 0; k < n; k++) { const h = 1 / Math.pow(2, k + 1); list = list.flatMap(([x, y]) => [[x, y], [x + h, y], [x + h / 2, y + h * Math.sqrt(3) / 2]]); }
    im.count = list.length; list.forEach(([x, y], i) => { mtx.makeScale(s, 1, s).setPosition(A.x + x * L, 0.02, A.z - y * L); im.setMatrixAt(i, mtx); }); im.instanceMatrix.needsUpdate = true;
    const [tw, lw] = it.words(), num = Math.pow(3, n), den = Math.pow(4, n);
    rd.set([`${tw}: ${num}`, `${lw}: ${n === 0 ? '1' : `${num}/${den}`}`], ['#ffd23f', '#ffffff']); };
  it.relabel = () => it.setStage(it.stage);
  it.showCorner = (on = true) => { corner.visible = on; };
  it.setStage(0);
  it.leverPath = () => [V(-0.45, 1.0, -0.3), V(-0.45, 1.0, -0.05)];
  it.at = (k) => ({ corner: A.clone().add(V(L * 0.25, 0.8, -L * 0.15)), top: A.clone().add(V(L / 2, 1.1, -H - 0.2)) }[k] || V(0, 1.2, -2.5));
  noHit(g); it.noGrab = true; it.noPhys = true; it.height = 0.05; it.radius = 3; it.base = 0; return it;
}
export function bindSierHands(sp, lever, app, s = { grow: 1 }, upto = 3, done = {}) {
  pushKnob(lever, { path: () => sp.leverPath(), active: () => stepNow(app, s.grow) && sp.stage < upto, keepVisible: () => app.runner.i === s.grow, press: () => { sp.setStage(sp.stage + 1); if (sp.stage >= upto) done.grow && done.grow(); } });
}

// ------------------------------------------------------------------ P2 Ch 5 Tales by Dots and Lines: levelling the stacks
// Five stacks of bricks (2, 8, 4, 7, 4) stand on the ground. Each push of the lever moves one brick from the tallest
// stack to the shortest; when they are level, every stack is the mean. Then the median, and what an outlier does.
export function brickStacks(o = {}) {
  const it = new Item('wbricks', { ...o, name: { en: 'Stacks of bricks', hi: 'ईंटों के ढेर', hg: 'Eenton ke dher' } });
  const g = it.g, BW = 0.42, BH = 0.16, BD = 0.22, GAP = 0.75, Z = -2.1, MAXB = 40;
  const brickG = new THREE.BoxGeometry(BW, BH * 0.94, BD);
  const im = new THREE.InstancedMesh(brickG, new THREE.MeshStandardMaterial({ roughness: 0.85 }), MAXB); im.frustumCulled = false; g.add(im);
  const RED = new THREE.Color(0xb5523b), MOVE = new THREE.Color(0xffb04a);
  const meanLine = new THREE.Mesh(new THREE.BoxGeometry(1, 0.012, 0.012), glow(0x8be07a)); meanLine.visible = false; g.add(meanLine);
  const tags = []; const rd = liveSign(0.55, 3.4); rd.position.set(-0.45, 2.15, Z - 0.3); g.add(rd);
  it.words = () => ['mean', 'median'];
  it.h = [2, 8, 4, 7, 4]; let fly = null; const mtx = new THREE.Matrix4();
  const xOf = (i, n) => (i - (n - 1) / 2) * GAP;
  const draw = () => { const n = it.h.length; let k = 0;
    it.h.forEach((hh, i) => { for (let b = 0; b < hh; b++) { if (fly && fly.to === i && b === hh - 1) continue; mtx.makeTranslation(xOf(i, n), BH * (b + 0.5), Z + (b % 2 ? 0.01 : -0.01)); im.setMatrixAt(k, mtx); im.setColorAt(k, RED); k++; } });
    if (fly) { const p = fly.a.clone().lerp(fly.b, ease(fly.t)); p.y += Math.sin(fly.t * Math.PI) * 0.6; mtx.makeTranslation(p.x, p.y, p.z); im.setMatrixAt(k, mtx); im.setColorAt(k, MOVE); k++; }
    im.count = k; im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true;
    while (tags.length < n) { const t = tag('0', '#ffffff', 0.2); g.add(t); tags.push(t); }
    tags.forEach((t, i) => { t.visible = i < n; if (i < n) { t.position.set(xOf(i, n), BH * it.h[i] + 0.22, Z); t.setText(it.h[i]); } }); };
  it.total = () => it.h.reduce((a, b) => a + b, 0);
  it.level = () => Math.max(...it.h) - Math.min(...it.h) <= 0;
  it.moving = false;
  it.move1 = () => { if (it.moving || it.level()) return false; const n = it.h.length; let hi = 0, lo = 0; it.h.forEach((v, i) => { if (v > it.h[hi]) hi = i; if (v < it.h[lo]) lo = i; });
    it.h[hi]--; it.h[lo]++; fly = { t: 0, to: lo, a: V(xOf(hi, n), BH * (it.h[hi] + 0.5), Z), b: V(xOf(lo, n), BH * (it.h[lo] - 0.5), Z) }; it.moving = true; draw(); return true; };
  it.update = (dt) => { if (!fly) return; fly.t += Math.min(dt || 0.016, 0.05) * 2.2; if (fly.t >= 1) { fly = null; it.moving = false; draw(); if (it.onMove) it.onMove(); } else draw(); };
  it.setH = (h) => { it.h = h.slice(); fly = null; it.moving = false; meanLine.visible = false; draw(); };
  it.showMean = (m) => { const n = it.h.length; meanLine.visible = true; meanLine.scale.x = (n - 1) * GAP + BW + 0.3; meanLine.position.set(0, BH * m, Z + BD / 2 + 0.02); };
  it.say = (lines, cols) => rd.set(lines, cols);
  it.setH(it.h);
  it.leverPath = () => [V(-0.45, 1.0, -0.3), V(-0.45, 1.0, -0.05)];
  it.at = (k) => ({ mid: V(0, 1.75, Z), right: V(2.6, 1.0, Z) }[k] || V(0, 1.5, Z));
  noHit(g); it.noGrab = true; it.noPhys = true; it.height = 1; it.radius = 2.5; it.base = 0; return it;
}
export function bindBrickHands(bs, lever, app, s = { level: 1 }, done = {}) {
  bs.onMove = () => { if (bs.level()) done.level && done.level(); };
  pushKnob(lever, { path: () => bs.leverPath(), active: () => stepNow(app, s.level) && !bs.moving && !bs.level(), keepVisible: () => app.runner.i === s.level, press: () => bs.move1() });
}

// ------------------------------------------------------------------ P2 Ch 6 Algebra Play: think of a number
// A cloth bag holds a secret number of marbles (x). Each push of the lever carries out one instruction of the trick with
// bags and loose marbles on the table; at the end only 3 marbles are left, whatever was in the bag.
export function marbleTrick(o = {}) {
  const it = new Item('wtrick', { ...o, name: { en: 'Bag of marbles', hi: 'कंचों की थैली', hg: 'Kanchon ki thaili' } });
  const g = it.g, secret = o.secret || 7;
  const cloth = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.004, 0.36), M(0x2a4a3a, 0.95)); cloth.position.set(0, 0.002, -0.02); g.add(cloth);
  const bagG = new THREE.SphereGeometry(0.045, 18, 14); bagG.scale(1, 1.25, 1); bagG.translate(0, 0.055, 0);
  const mkBag = () => { const b = new THREE.Group(); b.add(new THREE.Mesh(bagG, M(0x8a5a2e, 0.9))); const tie = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.02, 0.03, 10), M(0x6a4422, 0.9)); tie.position.y = 0.115; b.add(tie); const x = tag('x', '#ffd23f', 0.035); x.position.set(0, 0.17, 0); b.add(x); g.add(b); return b; };
  const bags = [mkBag(), mkBag()];
  const marbleG = new THREE.SphereGeometry(0.011, 14, 10);
  const COLS = [0x5ec8ff, 0xff7a5a, 0x8be07a, 0xffd23f, 0xc58bff];
  const marbles = []; for (let i = 0; i < 12; i++) { const m = new THREE.Mesh(marbleG, new THREE.MeshStandardMaterial({ color: COLS[i % 5], roughness: 0.15, metalness: 0.1 })); m.visible = false; g.add(m); marbles.push(m); }
  const inside = []; for (let i = 0; i < secret; i++) { const m = new THREE.Mesh(marbleG, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.15 })); m.visible = false; g.add(m); inside.push(m); }
  const rd = liveSign(0.11, 2.6); rd.position.set(0.12, 0.17, -0.16); g.add(rd);
  // states of the trick: bags shown, loose marbles, expression
  const S = [[1, 0, 'x', ''], [1, 5, 'x + 5', '+ 5'], [2, 10, '2x + 10', '× 2'], [2, 6, '2x + 6', '− 4'], [1, 3, 'x + 3', '÷ 2'], [0, 3, '3', '− x']];
  it.k = 0; it.busy = false;
  const spot = (i, n) => { const row = Math.floor(i / 6), col = i % 6; return V(0.06 + col * 0.03, 0.011, -0.05 + row * 0.04 + (n > 6 ? -0.02 : 0)); };
  it.set = (k) => { it.k = k; const [nb, nm, ex, op] = S[k]; bags.forEach((b, i) => { b.visible = i < nb; b.position.set(-0.22 + i * 0.12, 0, -0.03); b.scale.setScalar(1); });
    marbles.forEach((m, i) => { m.visible = i < nm; m.position.copy(spot(i, nm)); }); rd.set(op ? [op, ex] : [ex], op ? ['#7ad0ff', k === 5 ? '#8be07a' : '#ffd23f'] : '#ffd23f'); };
  it.next = () => { if (it.k >= 5) return false; it.set(it.k + 1); if (it.onStep) it.onStep(it.k); return true; };
  it.open = () => { const b = bags[0]; b.visible = true; b.position.set(-0.22, 0, -0.03); b.scale.set(1, 0.35, 1); inside.forEach((m, i) => { m.visible = true; m.position.set(-0.3 + (i % 4) * 0.028, 0.011, 0.06 + Math.floor(i / 4) * 0.028); }); };
  it.set(0);
  const W = (x, y, z) => g.localToWorld(V(x, y, z));
  it.leverPath = () => [W(-0.3, 0.1, 0.24), W(-0.3, 0.1, 0.32)];
  it.at = (k) => ({ top: W(0, 0.33, -0.16), bag: W(-0.22, 0.14, 0.0), loose: W(0.14, 0.12, 0.05) }[k] || W(0, 0.2, 0));
  noHit(g); it.noGrab = true; it.noPhys = true; it.height = 0.05; it.radius = 0.4; it.base = 0; return it;
}
export function bindTrickHands(mt, lever, app, s = { play: 1 }, done = {}) {
  mt.onStep = (k) => { if (k >= 5) done.end && done.end(); };
  pushKnob(lever, { path: () => mt.leverPath(), active: () => stepNow(app, s.play) && mt.k < 5, keepVisible: () => app.runner.i === s.play, press: () => mt.next() });
}
