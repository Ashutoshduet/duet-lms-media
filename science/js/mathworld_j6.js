// DUET Maths Lab 360, hands-on for Class 5 (Maths Mela), batch J6: coconut saplings in rows, fold-and-cut paper
// designs, Nani's quilt (area and border), a 50 m race with a stopwatch, a frog and a rabbit jumping on a number track,
// a bus on a village map, and a pictograph of mangoes sold.
// Everything is real size and drawn here: no outside images.
import * as THREE from 'three';
import { Item } from './apparatus.js';
import { canvasTex } from './mats.js';
import { clamp01, ease } from './mathlab2.js';
import { pushKnob } from './mathworld3.js';
import { liveSign } from './mathworld4.js';
import { slideKnob } from './mathworld5.js';
import { tag, animator, woodTex, M, rnd, tex, noHit, stepNow, V, FONT, mangoTex } from './mathworld_j1.js';

const TW = (g) => (x, y, z) => g.localToWorld(V(x, y, z));
const tableLever = (g) => [TW(g)(-0.3, 0.1, 0.24), TW(g)(-0.3, 0.1, 0.32)];
const tableSlide = (g) => [TW(g)(-0.3, 0.1, 0.24), TW(g)(0.3, 0.1, 0.24)];
const floorLever = () => [V(-0.45, 1.0, -0.3), V(-0.45, 1.0, -0.05)];
const floorKnob = () => [V(-0.45, 1.0, -0.42), V(0.45, 1.0, -0.42)];
const done1 = (it, o) => { noHit(it.g); it.noGrab = true; it.noPhys = true; it.base = 0; Object.assign(it, o); return it; };
const IN = (n) => Math.round(n).toLocaleString('en-IN');

// a curved, drooping palm leaf (frond) along +z, for saplings and trees
function frondGeo(len, wid) {
  const gm = new THREE.PlaneGeometry(wid, len, 4, 10); gm.rotateX(-Math.PI / 2); gm.translate(0, 0, -len / 2);
  const p = gm.attributes.position; for (let i = 0; i < p.count; i++) { const z = -p.getZ(i), t = z / len, x = p.getX(i); p.setX(i, x * Math.sin(Math.PI * Math.min(1, t * 1.1 + 0.08))); p.setY(i, 0.45 * len * t - 0.85 * len * t * t + Math.abs(x) * 0.6); p.setZ(i, z); }
  gm.computeVertexNormals(); return gm;
}
const frondTex = () => tex(64, 256, (x) => { x.fillStyle = 'rgba(0,0,0,0)'; x.clearRect(0, 0, 64, 256); x.strokeStyle = '#5a7a22'; x.lineWidth = 3; x.beginPath(); x.moveTo(32, 0); x.lineTo(32, 256); x.stroke();
  for (let y = 6; y < 250; y += 7) { const w = 30 * Math.sin(Math.PI * (y / 256) * 0.95 + 0.1); x.strokeStyle = y % 14 ? '#3f7d1f' : '#4f8f27'; x.lineWidth = 4; x.beginPath(); x.moveTo(32, y); x.lineTo(32 - w, y + 10); x.moveTo(32, y); x.lineTo(32 + w, y + 10); x.stroke(); } });

// ------------------------------------------------------------------ Class 5 Ch 9 Coconut Farm: saplings in rows, 12 × 15
// A nursery bed at a coconut farm, with two grown coconut trees behind. The slider plants saplings 15 to a row until
// there are 12 rows; then the farmer moves them into rows of 20.
export function coconutNursery(o = {}) {
  const it = new Item('jcoco5', { ...o, name: { en: 'Coconut nursery', hi: 'नारियल की नर्सरी', hg: 'Nariyal ki nursery' } });
  const g = it.g, w_ = o.W || ((k) => k), NS = 180, PER = 5, r = rnd(19);
  const soilT = tex(256, 256, (x) => { const q = rnd(5); x.fillStyle = '#6b4a2e'; x.fillRect(0, 0, 256, 256); for (let i = 0; i < 2200; i++) { const c = q(); x.fillStyle = c < 0.5 ? 'rgba(40,26,14,0.35)' : 'rgba(150,110,70,0.3)'; x.fillRect(q() * 256, q() * 256, 2, 2); } for (let y = 0; y < 256; y += 21) { x.fillStyle = 'rgba(30,18,8,0.35)'; x.fillRect(0, y, 256, 5); } }, [4, 3]);
  const bed = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.05, 2.9), new THREE.MeshStandardMaterial({ map: soilT, roughness: 1 })); bed.position.set(0, 0.025, -2.2); bed.receiveShadow = true; g.add(bed);
  const trunkG = new THREE.CylinderGeometry(0.008, 0.02, 0.2, 7); trunkG.translate(0, 0.1, 0);
  const trunks = new THREE.InstancedMesh(trunkG, M(0x7a5a32, 0.85), NS); trunks.castShadow = true;
  const fm = new THREE.MeshStandardMaterial({ map: frondTex(), transparent: true, alphaTest: 0.35, side: THREE.DoubleSide, roughness: 0.7 });
  const fronds = new THREE.InstancedMesh(frondGeo(0.13, 0.06), fm, NS * PER); fronds.castShadow = true;
  trunks.frustumCulled = false; fronds.frustumCulled = false; g.add(trunks); g.add(fronds);
  const rot = [], scl = []; for (let i = 0; i < NS; i++) { rot.push(r() * 6.28); scl.push(0.85 + r() * 0.3); }
  const posA = (i) => V(-1.68 + (i % 15) * 0.24, 0.05, -1.0 - Math.floor(i / 15) * 0.22), posB = (i) => V(-1.71 + (i % 20) * 0.18, 0.05, -1.24 - Math.floor(i / 20) * 0.22);
  const P = []; for (let i = 0; i < NS; i++) P.push(posA(i));
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s3 = new THREE.Vector3(), up = V(0, 1, 0);
  const place = () => { for (let i = 0; i < NS; i++) { const p = P[i], s = scl[i]; q.setFromAxisAngle(up, rot[i]); s3.set(s, s, s); m4.compose(p, q, s3); trunks.setMatrixAt(i, m4);
      for (let f = 0; f < PER; f++) { e.set(-0.35, rot[i] + f * (Math.PI * 2 / PER), 0, 'YXZ'); q.setFromEuler(e); m4.compose(V(p.x, p.y + 0.19 * s, p.z), q, s3); fronds.setMatrixAt(i * PER + f, m4); } }
    trunks.instanceMatrix.needsUpdate = true; fronds.instanceMatrix.needsUpdate = true; };
  place();
  // two grown coconut trees behind the bed
  const ringT = tex(64, 256, (x) => { x.fillStyle = '#8a7258'; x.fillRect(0, 0, 64, 256); for (let y = 0; y < 256; y += 9) { x.fillStyle = 'rgba(50,38,26,0.55)'; x.fillRect(0, y, 64, 3); } }, [3, 6]);
  const fbig = frondGeo(2.6, 0.9), fM = new THREE.MeshStandardMaterial({ map: frondTex(), transparent: true, alphaTest: 0.35, side: THREE.DoubleSide, roughness: 0.7 });
  [[-3.2, -5.2, 0.15], [3.4, -5.8, -0.2]].forEach(([x, z, lean]) => { const tr = new THREE.Group(); tr.position.set(x, 0, z); g.add(tr);
    const pts = []; for (let k = 0; k <= 8; k++) { const t = k / 8; pts.push(V(Math.sin(t * 1.4) * lean * 3, t * 7, 0)); }
    const tg = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.16, 10); const tm = new THREE.Mesh(tg, new THREE.MeshStandardMaterial({ map: ringT, roughness: 0.9 })); tm.castShadow = true; tr.add(tm);
    const top = pts[8]; for (let f = 0; f < 11; f++) { const fr = new THREE.Mesh(fbig, fM); fr.position.copy(top); fr.rotation.set(-0.25 - (f % 3) * 0.15, f * (Math.PI * 2 / 11), 0, 'YXZ'); tr.add(fr); }
    for (let c = 0; c < 6; c++) { const nut = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 10), M(c % 2 ? 0x6f8f2a : 0x8a9a30, 0.6)); nut.position.copy(top).add(V(Math.cos(c) * 0.2, -0.25 - (c % 2) * 0.12, Math.sin(c) * 0.2)); tr.add(nut); } });
  const rd = liveSign(0.22, 3.6); rd.position.set(0, 0.75, -3.95); g.add(rd);
  animator(it); it.k = 0; it.n = 0;
  it.setK = (k) => { it.k = k; it.n = Math.floor(k * NS + 1e-6); trunks.count = it.n; fronds.count = it.n * PER; const rows = Math.floor(it.n / 15), rest = it.n % 15;
    rd.set([rest ? `${rows} × 15 + ${rest} = ${it.n}` : `${rows} × 15 = ${it.n}`], it.n >= NS ? '#8be07a' : '#ffd23f'); if (it.onK) it.onK(k); };
  it.regroup = (cb) => { if (it.busy) return false; const A = P.map((p) => p.clone());
    it.play(2.2, (k) => { const e2 = ease(k); for (let i = 0; i < NS; i++) { const b = posB(i); P[i].lerpVectors(A[i], b, e2); P[i].y = 0.05 + Math.sin(k * Math.PI) * 0.15; } place(); },
      () => { for (let i = 0; i < NS; i++) P[i].copy(posB(i)); place(); rd.set(['180 ÷ 20 = 9 ' + w_('rows')], '#8be07a'); if (cb) cb(); }); return true; };
  it.say = (l, c) => rd.set(l, c);
  it.setK(0); it.say([w_('15 saplings in a row')], '#ffffff');
  it.knobPath = floorKnob;
  return done1(it, { height: 0.3, radius: 2.4 });
}
export function bindCoconutHands(cn, knob, app, s = { plant: 1 }, done = {}) {
  const sync = slideKnob(knob, { path: () => cn.knobPath(), active: () => stepNow(app, s.plant), keepVisible: () => app.runner.i === s.plant, k: () => cn.k,
    set: (k) => { const kk = clamp01(k > 0.975 ? 1 : k); if (kk > cn.k) cn.setK(kk); if (cn.n >= 180 && done.all) done.all(); } });
  const s0 = cn.setK; cn.setK = (k) => { s0(k); sync(); };
}

// ------------------------------------------------------------------ Class 5 Ch 10 Symmetrical Designs: fold twice, cut once
// A square of kite paper lies on the table. Three pushes of the lever: fold it in half, fold it in half again, and cut the
// folded corner with scissors. Opened out, the cut is repeated four times: the design has 4 lines of symmetry and looks
// the same after a quarter turn.
export function foldCutPaper(o = {}) {
  const it = new Item('jcut5', { ...o, name: { en: 'Kite paper and scissors', hi: 'पतंग का काग़ज़ और कैंची', hg: 'Patang ka kaagaz aur kainchi' } });
  const g = it.g, w_ = o.W || ((k) => k), S = 0.24, Hf = S / 2, C = V(0, 0.003, -0.05);
  const paint = (cut) => (x) => { const rr = rnd(3); x.fillStyle = '#e8457f'; x.fillRect(0, 0, 512, 512); for (let i = 0; i < 900; i++) { x.fillStyle = `rgba(255,255,255,${rr() * 0.08})`; x.fillRect(rr() * 512, rr() * 512, 3, 1); }
    if (!cut) return; x.globalCompositeOperation = 'destination-out'; x.fillStyle = '#000';
    const hole = (f) => { x.beginPath(); f(); x.fill(); };
    hole(() => x.arc(256, 256, 44, 0, 7));
    [[256, 106], [256, 406], [106, 256], [406, 256]].forEach(([cx, cy]) => hole(() => { x.moveTo(cx, cy - 34); x.lineTo(cx + 26, cy); x.lineTo(cx, cy + 34); x.lineTo(cx - 26, cy); x.closePath(); }));
    [[161, 161], [351, 161], [161, 351], [351, 351]].forEach(([cx, cy]) => hole(() => x.arc(cx, cy, 24, 0, 7)));
    [[0, 0], [512, 0], [0, 512], [512, 512]].forEach(([cx, cy]) => hole(() => x.arc(cx, cy, 52, 0, 7)));
    [[256, 0], [256, 512], [0, 256], [512, 256]].forEach(([cx, cy]) => hole(() => x.arc(cx, cy, 30, 0, 7)));
    x.globalCompositeOperation = 'source-over'; };
  const tUncut = tex(512, 512, paint(false)), tCut = tex(512, 512, paint(true));
  const pm = new THREE.MeshStandardMaterial({ map: tUncut, roughness: 0.85, side: THREE.DoubleSide, alphaTest: 0.5 });
  const quad = (cx, cz) => { const gm = new THREE.PlaneGeometry(Hf, Hf); gm.rotateX(-Math.PI / 2); const p = gm.attributes.position, uv = gm.attributes.uv;
    for (let i = 0; i < p.count; i++) { const wx = cx + p.getX(i), wz = cz + p.getZ(i); uv.setXY(i, (wx + Hf) / S, (-wz + Hf) / S); p.setX(i, wx - (cx > 0 ? 0 : 0)); p.setZ(i, wz); } return new THREE.Mesh(gm, pm); };
  // hierarchy: root → bottom-left, VB (hinge x = 0) → bottom-right; H (hinge z = 0) → top-left, VT (hinge x = 0) → top-right
  const root = new THREE.Group(); root.position.copy(C); g.add(root);
  const q = Hf / 2;
  const BL = quad(-q, q); root.add(BL);
  const VB = new THREE.Group(); VB.position.y = 0.0012; root.add(VB); VB.add(quad(q, q));
  const H = new THREE.Group(); H.position.y = 0.0028; root.add(H); H.add(quad(-q, -q));
  const VT = new THREE.Group(); VT.position.y = 0.0012; H.add(VT); VT.add(quad(q, -q));
  // scissors
  const sc = new THREE.Group(); sc.visible = false; g.add(sc); const bladeM = M(0xd0d5da, 0.2, 0.9), handM = M(0xf28c28, 0.5);
  const blade = (s) => { const b = new THREE.Group(); const bl = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.002, 0.07), bladeM); bl.position.z = -0.035; b.add(bl); const ring = new THREE.Mesh(new THREE.TorusGeometry(0.014, 0.004, 8, 16), handM); ring.rotation.x = Math.PI / 2; ring.position.set(s * 0.012, 0, 0.02); b.add(ring); sc.add(b); return b; };
  const b1 = blade(1), b2 = blade(-1);
  // lines of symmetry
  const lineM = new THREE.MeshBasicMaterial({ color: 0x1d4fa0, toneMapped: false }); const lines = [];
  [0, Math.PI / 2, Math.PI / 4, -Math.PI / 4].forEach((a, i) => { const L = i < 2 ? S + 0.04 : S * 1.41 + 0.03; const lg = new THREE.Group(); for (let k = 0; k < 14; k++) { const d = new THREE.Mesh(new THREE.BoxGeometry(0.003, 0.001, L / 28), lineM); d.position.z = -L / 2 + (k + 0.25) * L / 14; lg.add(d); } lg.rotation.y = a; lg.position.y = 0.006; lg.visible = false; root.add(lg); lines.push(lg); });
  const rd = liveSign(0.07, 3.6); rd.position.set(0, 0.3, -0.3); g.add(rd);
  animator(it); it.n = 0;
  it.step = (cb) => { if (it.busy || it.n >= 3) return false; const i = it.n;
    if (i === 0) it.play(1.0, (k) => { const a = Math.PI * ease(k); VT.rotation.z = a; VB.rotation.z = a; }, () => { it.n = 1; rd.set([w_('folded in half: 2 layers')], '#ffd23f'); if (cb) cb(); });
    else if (i === 1) it.play(1.0, (k) => { H.rotation.x = Math.PI * ease(k); }, () => { it.n = 2; rd.set([w_('folded again: 4 layers')], '#ffd23f'); if (cb) cb(); });
    else { sc.visible = true; it.play(1.6, (k) => { const a = k * Math.PI * 0.5; sc.position.set(C.x - 0.13 * Math.cos(a) + 0.01, C.y + 0.012, C.z + 0.13 * Math.sin(a) - 0.01); sc.rotation.y = -a - Math.PI / 4; const snip = Math.abs(Math.sin(k * Math.PI * 6)) * 0.35; b1.rotation.y = snip; b2.rotation.y = -snip; },
      () => { sc.visible = false; pm.map = tCut; pm.needsUpdate = true; it.n = 3; rd.set([w_('cut through 4 layers at once')], '#8be07a'); if (cb) cb(); }); }
    return true; };
  it.unfold = (cb) => { if (it.busy) return false; it.play(1.6, (k) => { const e = ease(k); H.rotation.x = Math.PI * (1 - Math.min(1, e * 2)); const e2 = clamp01(e * 2 - 1); VT.rotation.z = Math.PI * (1 - e2); VB.rotation.z = Math.PI * (1 - e2); },
    () => { H.rotation.x = 0; VT.rotation.z = 0; VB.rotation.z = 0; rd.set([w_('the cut is repeated 4 times')], '#8be07a'); if (cb) cb(); }); return true; };
  it.showLines = () => { lines.forEach((l) => { l.visible = true; }); rd.set([w_('4 lines of symmetry')], '#8be07a'); };
  it.quarter = (cb) => { if (it.busy) return false; it.play(1.6, (k) => { root.rotation.y = -Math.PI / 2 * ease(k); }, () => { rd.set([`¼ ${w_('turn')}: ${w_('looks the same')}`], '#8be07a'); if (cb) cb(); }); return true; };
  it.say = (l, c) => rd.set(l, c);
  it.say([w_('fold, fold, cut')], '#ffffff');
  it.leverPath = () => tableLever(g);
  return done1(it, { height: 0.05, radius: 0.3 });
}
export function bindCutHands(fc, lever, app, s = { cut: 1 }, done = {}) {
  pushKnob(lever, { path: () => fc.leverPath(), active: () => stepNow(app, s.cut) && !fc.busy && fc.n < 3, keepVisible: () => app.runner.i === s.cut, press: () => fc.step(() => { if (fc.n >= 3 && done.all) done.all(); }) });
}

// ------------------------------------------------------------------ Class 5 Ch 11 Grandmother's Quilt: area and border
// Square block-printed patches, 10 cm each side, are stitched into a quilt of 4 rows of 6. A lace border goes round it
// (one coloured piece per patch side). The same 24 patches in 3 rows of 8 need a longer border.
export function nanisQuilt(o = {}) {
  const it = new Item('jquilt5', { ...o, name: { en: 'Quilt patches and lace', hi: 'रज़ाई के टुकड़े और लेस', hg: 'Razaai ke tukde aur lace' } });
  const g = it.g, w_ = o.W || ((k) => k), P = 0.1, ZC = -0.06, NP = 24;
  const prints = [
    (x) => { x.fillStyle = '#23407a'; x.fillRect(0, 0, 128, 128); x.fillStyle = '#f4efe2'; for (let i = 0; i < 6; i++) for (let j = 0; j < 6; j++) { x.beginPath(); x.arc(12 + i * 21 + (j % 2) * 10, 12 + j * 21, 4, 0, 7); x.fill(); } },
    (x) => { x.fillStyle = '#e1a21c'; x.fillRect(0, 0, 128, 128); x.fillStyle = '#b3261e'; for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) { const cx = 22 + i * 42, cy = 22 + j * 42; x.beginPath(); x.ellipse(cx, cy, 9, 15, 0.6, 0, 7); x.fill(); x.beginPath(); x.arc(cx + 8, cy - 12, 4, 0, 7); x.fill(); } },
    (x) => { x.fillStyle = '#c0392b'; x.fillRect(0, 0, 128, 128); x.fillStyle = 'rgba(255,255,255,0.85)'; for (let i = 0; i < 128; i += 16) { x.fillRect(i, 0, 5, 128); x.fillRect(0, i, 128, 5); } },
    (x) => { x.fillStyle = '#2f7a3d'; x.fillRect(0, 0, 128, 128); x.strokeStyle = '#f1e3b0'; x.lineWidth = 4; for (let i = -128; i < 256; i += 18) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i + 128, 128); x.stroke(); } },
    (x) => { x.fillStyle = '#f6f1e4'; x.fillRect(0, 0, 128, 128); x.fillStyle = '#2a63b5'; for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) { const cx = 32 + i * 64, cy = 32 + j * 64; for (let p = 0; p < 5; p++) { const a = p * 1.2566; x.beginPath(); x.arc(cx + Math.cos(a) * 11, cy + Math.sin(a) * 11, 8, 0, 7); x.fill(); } x.fillStyle = '#e1a21c'; x.beginPath(); x.arc(cx, cy, 6, 0, 7); x.fill(); x.fillStyle = '#2a63b5'; } },
    (x) => { x.fillStyle = '#e8762b'; x.fillRect(0, 0, 128, 128); x.strokeStyle = '#2b1d14'; x.lineWidth = 5; for (let y = 16; y < 128; y += 32) { x.beginPath(); for (let i = 0; i <= 8; i++) x.lineTo(i * 16, y + (i % 2 ? 10 : -10)); x.stroke(); } },
  ];
  const stitched = (f) => tex(128, 128, (x) => { f(x); x.strokeStyle = 'rgba(255,255,255,0.8)'; x.setLineDash([6, 5]); x.lineWidth = 2; x.strokeRect(6, 6, 116, 116); x.setLineDash([]); });
  const mats = prints.map((f) => new THREE.MeshStandardMaterial({ map: stitched(f), roughness: 0.95 }));
  const pg = new THREE.BoxGeometry(P * 0.985, 0.006, P * 0.985);
  const layA = (i) => V(-0.3 + P * ((i % 6) + 0.5), 0.003, ZC - 0.2 + P * (Math.floor(i / 6) + 0.5)), layB = (i) => V(-0.4 + P * ((i % 8) + 0.5), 0.003, ZC - 0.15 + P * (Math.floor(i / 8) + 0.5));
  const patches = []; for (let i = 0; i < NP; i++) { const m = new THREE.Mesh(pg, mats[(i * 5 + Math.floor(i / 6)) % 6]); m.castShadow = true; m.receiveShadow = true; m.visible = false; m.userData.to = layA(i); g.add(m); patches.push(m); }
  const basket = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.065, 0.06, 24, 1, true), new THREE.MeshStandardMaterial({ color: 0xb98a4e, roughness: 0.9, side: THREE.DoubleSide })); basket.position.set(0.48, 0.03, 0.12); g.add(basket);
  const laceA = new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.4, metalness: 0.5 }), laceB = new THREE.MeshStandardMaterial({ color: 0xb3261e, roughness: 0.5 });
  let lace = []; const laceG = new THREE.BoxGeometry(P * 0.96, 0.01, 0.012);
  const makeLace = (cols, rows, x0, z0) => { lace.forEach((m) => g.remove(m)); lace = []; const segs = [];
    for (let i = 0; i < cols; i++) segs.push([x0 + P * (i + 0.5), z0 - 0.008, 0]); for (let j = 0; j < rows; j++) segs.push([x0 + cols * P + 0.008, z0 + P * (j + 0.5), Math.PI / 2]);
    for (let i = cols - 1; i >= 0; i--) segs.push([x0 + P * (i + 0.5), z0 + rows * P + 0.008, 0]); for (let j = rows - 1; j >= 0; j--) segs.push([x0 - 0.008, z0 + P * (j + 0.5), Math.PI / 2]);
    segs.forEach(([x, z, ry], k) => { const m = new THREE.Mesh(laceG, k % 2 ? laceB : laceA); m.position.set(x, 0.005, z); m.rotation.y = ry; m.visible = false; g.add(m); lace.push(m); }); return lace; };
  const rd = liveSign(0.07, 3.6); rd.position.set(0, 0.3, -0.32); g.add(rd);
  animator(it); it.k = 0; it.n = 0; it.shape = 'A';
  it.setK = (k) => { it.k = k; const f = k * NP; it.n = Math.floor(f + 1e-6); const from = V(0.48, 0.08, 0.12);
    patches.forEach((m, i) => { if (i < it.n) { m.visible = true; m.position.copy(m.userData.to); } else if (i === it.n && f - i > 0.02) { const e = ease(f - i); m.visible = true; m.position.lerpVectors(from, m.userData.to, e); m.position.y += Math.sin(e * Math.PI) * 0.06; } else m.visible = false; });
    const rows = Math.floor(it.n / 6), rest = it.n % 6; rd.set([rest ? `${rows} × 6 + ${rest} = ${it.n} ${w_('squares')}` : `${w_('Area')} = ${rows} × 6 = ${it.n} ${w_('squares')}`], it.n >= NP ? '#8be07a' : '#ffd23f'); if (it.onK) it.onK(k); };
  it.lace = (cb) => { if (it.busy) return false; const L = it.shape === 'A' ? makeLace(6, 4, -0.3, ZC - 0.2) : makeLace(8, 3, -0.4, ZC - 0.15); const n = L.length;
    it.play(n * 0.09, (k) => { const m = Math.floor(k * n + 1e-6); L.forEach((s, i) => { s.visible = i < m; }); rd.set([`${w_('Border')}: ${m} ${w_('sides')}`], '#ffd23f'); },
      () => { L.forEach((s) => { s.visible = true; }); rd.set(it.shape === 'A' ? ['6 + 4 + 6 + 4 = 20 × 10 cm = 2 m'] : ['8 + 3 + 8 + 3 = 22 × 10 cm = 2 m 20 cm'], '#8be07a'); if (cb) cb(); }); return true; };
  it.rearrange = (cb) => { if (it.busy) return false; lace.forEach((m) => g.remove(m)); lace = []; const A = patches.map((m) => m.position.clone());
    it.play(1.8, (k) => { const e = ease(k); patches.forEach((m, i) => { m.position.lerpVectors(A[i], layB(i), e); m.position.y = 0.003 + Math.sin(k * Math.PI) * 0.04; }); },
      () => { patches.forEach((m, i) => { m.position.copy(layB(i)); m.userData.to = layB(i); }); it.shape = 'B'; rd.set([`${w_('Area')} = 3 × 8 = 24 ${w_('squares')}`], '#8be07a'); if (cb) cb(); }); return true; };
  it.say = (l, c) => rd.set(l, c);
  it.setK(0); it.say([w_('1 patch = 10 cm × 10 cm')], '#ffffff');
  it.knobPath = () => tableSlide(g);
  return done1(it, { height: 0.05, radius: 0.5 });
}
export function bindQuiltHands(nq, knob, app, s = { stitch: 1 }, done = {}) {
  const sync = slideKnob(knob, { path: () => nq.knobPath(), active: () => stepNow(app, s.stitch), keepVisible: () => app.runner.i === s.stitch, k: () => nq.k,
    set: (k) => { const kk = clamp01(k > 0.975 ? 1 : k); if (kk > nq.k) nq.setK(kk); if (nq.n >= 24 && done.all) done.all(); } });
  const s0 = nq.setK; nq.setK = (k) => { s0(k); sync(); };
}

// ------------------------------------------------------------------ Class 5 Ch 12 Racing Seconds: a 50 m race and a stopwatch
// Three lanes are painted on the playground, from a start line 56 m away to the finish line 6 m in front of you. Pushing
// the lever starts the race and your stopwatch together; each runner's time is read as they cross the line.
function runnerFig(jersey, skin, hair, num) {
  const f = new THREE.Group(); const sk = M(skin, 0.7), jm = M(jersey, 0.6), sh = M(0x22262c, 0.7), shoe = M(0xf2f2f2, 0.5);
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.11, 0.42, 14), jm); torso.position.y = 0.92; torso.castShadow = true; f.add(torso);
  const bib = new THREE.Mesh(new THREE.PlaneGeometry(0.14, 0.11), new THREE.MeshStandardMaterial({ map: tex(128, 96, (x) => { x.fillStyle = '#fafafa'; x.fillRect(0, 0, 128, 96); x.fillStyle = '#111'; x.font = `900 70px ${FONT}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(String(num), 64, 52); }), roughness: 0.8 })); bib.position.set(0, 0.95, 0.122); f.add(bib);
  const shorts = new THREE.Mesh(new THREE.CylinderGeometry(0.115, 0.12, 0.14, 14), sh); shorts.position.y = 0.66; f.add(shorts);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 12), sk); head.position.y = 1.25; f.add(head);
  const hr = new THREE.Mesh(new THREE.SphereGeometry(0.104, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), M(hair, 0.8)); hr.position.y = 1.26; hr.rotation.x = -0.25; f.add(hr);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.045, 0.07, 10), sk); neck.position.y = 1.15; f.add(neck);
  const limb = (r1, r2, len, mat) => { const p = new THREE.Group(); const m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, len, 10), mat); m.position.y = -len / 2; m.castShadow = true; p.add(m); return p; };
  const legs = [-1, 1].map((s) => { const L = limb(0.055, 0.04, 0.58, sk); L.position.set(s * 0.06, 0.62, 0); const sh2 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.05, 0.16), shoe); sh2.position.set(0, -0.6, 0.03); L.add(sh2); f.add(L); return L; });
  const arms = [-1, 1].map((s) => { const A = limb(0.035, 0.03, 0.5, sk); A.position.set(s * 0.155, 1.1, 0); const sl = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.04, 0.12, 10), jm); sl.position.y = -0.05; A.add(sl); f.add(A); return A; });
  f.pose = (ph, amp) => { legs[0].rotation.x = Math.sin(ph) * 0.8 * amp; legs[1].rotation.x = -Math.sin(ph) * 0.8 * amp; arms[0].rotation.x = -Math.sin(ph) * 0.9 * amp; arms[1].rotation.x = Math.sin(ph) * 0.9 * amp; f.children[0].rotation.x = 0.12 * amp; };
  return f;
}
export function raceTrack(o = {}) {
  const it = new Item('jrace5', { ...o, name: { en: '50 m race track and stopwatch', hi: '50 m की दौड़ और स्टॉपवॉच', hg: '50 m ki daud aur stopwatch' } });
  const g = it.g, w_ = o.W || ((k) => k), Z0 = -56, Z1 = -6, LX = [-1.4, 0, 1.4];
  const RUN = [{ n: 'Asha', t: 8, c: 0xd93a2b, s: 0x8d5a3b, h: 0x1a1210 }, { n: 'Ravi', t: 9, c: 0x2a6fd1, s: 0xa86f4c, h: 0x16100c }, { n: 'Meena', t: 11, c: 0xf2b632, s: 0x7a4a2e, h: 0x221510 }];
  const white = new THREE.MeshStandardMaterial({ color: 0xf6f6f2, roughness: 0.9 });
  [-2.1, -0.7, 0.7, 2.1].forEach((x) => { const l = new THREE.Mesh(new THREE.PlaneGeometry(0.06, Z1 - Z0 + 4), white); l.rotation.x = -Math.PI / 2; l.position.set(x, 0.006, (Z0 + Z1) / 2 + 1); g.add(l); });
  [Z0, Z1].forEach((z, i) => { const l = new THREE.Mesh(new THREE.PlaneGeometry(4.2, i ? 0.12 : 0.08), white); l.rotation.x = -Math.PI / 2; l.position.set(0, 0.007, z); g.add(l); });
  for (let m = 10; m < 50; m += 10) { const t = tag(`${m} m`, '#ffffff', 0.35); t.position.set(-2.7, 0.3, Z1 - m); g.add(t); }
  const flagM = M(0xd93a2b, 0.6); [-2.3, 2.3].forEach((x) => { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.4, 8), M(0xdddddd, 0.4, 0.5)); p.position.set(x, 0.7, Z1); g.add(p); const fl = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.2), flagM); fl.material.side = THREE.DoubleSide; fl.position.set(x + Math.sign(x) * -0.15, 1.3, Z1); g.add(fl); });
  const fin = tag(w_('FINISH'), '#ffffff', 0.25, 'rgba(180,30,30,0.9)'); fin.position.set(0, 1.65, Z1); g.add(fin);
  const st = tag(`${w_('START')} · 50 m`, '#ffffff', 0.9, 'rgba(30,60,140,0.9)'); st.position.set(0, 2.8, Z0); g.add(st);
  const runners = RUN.map((R, i) => { const f = runnerFig(R.c, R.s, R.h, i + 1); f.position.set(LX[i], 0, Z0); g.add(f); f.pose(0, 0); const nt = tag(w_(R.n), '#ffffff', 0.3); nt.position.set(0, 1.75, 0); f.add(nt); return f; });
  // the stopwatch in front of you
  const sw = new THREE.Group(); sw.position.set(0.38, 1.05, -0.55); sw.rotation.x = 0.5; g.add(sw);
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.025, 40), M(0xc9ced2, 0.25, 0.85)); body.rotation.x = Math.PI / 2; sw.add(body);
  const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.025, 12), M(0xb8bec6, 0.3, 0.85)); crown.position.y = 0.072; sw.add(crown);
  const btn = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.012, 12), M(0xd93a2b, 0.4)); btn.position.y = 0.088; sw.add(btn);
  const faceT = canvasTex(256, 256, () => {}); const face = new THREE.Mesh(new THREE.CircleGeometry(0.052, 40), new THREE.MeshBasicMaterial({ map: faceT, toneMapped: false })); face.position.z = 0.0131; sw.add(face);
  const paintW = (t) => { const x = faceT.image.getContext('2d'); x.fillStyle = '#e9efe4'; x.beginPath(); x.arc(128, 128, 128, 0, 7); x.fill(); x.fillStyle = '#9cb08a'; x.fillRect(28, 88, 200, 80); x.fillStyle = '#111'; x.font = `800 64px monospace`; x.textAlign = 'center'; x.textBaseline = 'middle';
    const s = Math.floor(t), d = Math.floor((t - s) * 10); x.fillText(`${String(s).padStart(2, '0')}.${d}`, 128, 130); x.font = `700 24px ${FONT}`; x.fillText('sec', 128, 200); faceT.needsUpdate = true; };
  paintW(0);
  const rd = liveSign(0.32, 3.6); rd.position.set(0, 2.6, -10); g.add(rd);
  animator(it); it.t = 0; it.done = []; it.ran = false;
  const f01 = (u) => { const a = 0.2; return u < a ? u * u / (2 * a * (1 - a / 2)) : (u - a / 2) / (1 - a / 2); };
  it.race = (cb) => { if (it.busy || it.ran) return false; it.ran = true; const TT = 13.5; let lastPaint = -1; rd.set([w_('On your marks… get set… GO!')], '#ffd23f');
    it.play(TT, (k) => { const t = k * TT - 1.0; it.t = Math.max(0, Math.min(11, t));
      runners.forEach((f, i) => { const R = RUN[i]; if (t <= 0) { f.pose(0, 0); return; } const u = t / R.t; let z, sp; if (u < 1) { z = Z0 + 50 * f01(u); sp = 1; } else { const ex = Math.min(1.5, (t - R.t)); z = Z1 + 3 * (1 - Math.pow(1 - ex / 1.5, 2)); sp = Math.max(0, 1 - ex / 1.5); }
        f.position.z = z; f.position.y = Math.abs(Math.sin(t * 9 + i)) * 0.05 * sp; f.pose(t * 9 + i, sp);
        if (u >= 1 && !it.done.includes(i)) { it.done.push(i); rd.set(it.done.map((j) => `${w_(RUN[j].n)}: ${RUN[j].t} s`), it.done.map((j, n) => (n === 0 ? '#8be07a' : '#ffffff'))); } });
      const p10 = Math.floor(it.t * 10); if (p10 !== lastPaint) { lastPaint = p10; paintW(it.t); } },
    () => { it.t = 11; paintW(11); runners.forEach((f) => f.pose(0, 0)); if (cb) cb(); }); return true; };
  it.say = (l, c) => rd.set(l, c);
  it.say([w_('50 m race: who is fastest?')], '#ffffff');
  it.leverPath = floorLever;
  return done1(it, { height: 2, radius: 3 });
}
export function bindRaceHands(rt, lever, app, s = { go: 1 }, done = {}) {
  pushKnob(lever, { path: () => rt.leverPath(), active: () => stepNow(app, s.go) && !rt.busy && !rt.ran, keepVisible: () => app.runner.i === s.go, press: () => rt.race(() => { if (done.all) done.all(); }) });
}

// ------------------------------------------------------------------ Class 5 Ch 13 Animal Jumps: multiples and common multiples
// A number track 0 … 30 is painted on the playground. The frog jumps 3 at a time and leaves green marks; the rabbit
// jumps 4 at a time and leaves orange marks. Where both have landed, a gold ring shows the common multiples.
function frogFig() { const f = new THREE.Group(); const gm = M(0x3f9a3a, 0.45), lm = M(0xb8d77a, 0.6);
  const b = new THREE.Mesh(new THREE.SphereGeometry(0.06, 16, 12), gm); b.scale.set(1, 0.65, 1.25); b.position.y = 0.045; f.add(b);
  const bel = new THREE.Mesh(new THREE.SphereGeometry(0.056, 14, 10), lm); bel.scale.set(0.95, 0.5, 1.15); bel.position.y = 0.035; f.add(bel);
  [-1, 1].forEach((s) => { const e = new THREE.Mesh(new THREE.SphereGeometry(0.018, 10, 8), gm); e.position.set(s * 0.03, 0.085, 0.045); f.add(e); const p = new THREE.Mesh(new THREE.SphereGeometry(0.009, 8, 6), M(0x111111, 0.3)); p.position.set(s * 0.033, 0.092, 0.058); f.add(p);
    const leg = new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 8), gm); leg.scale.set(0.6, 0.5, 1.4); leg.position.set(s * 0.06, 0.02, -0.03); f.add(leg); }); return f; }
function rabbitFig() { const f = new THREE.Group(); const wm = M(0xeeeae4, 0.8), pm = M(0xf2a9b3, 0.6);
  const b = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 12), wm); b.scale.set(0.9, 0.85, 1.2); b.position.y = 0.07; f.add(b);
  const h = new THREE.Mesh(new THREE.SphereGeometry(0.045, 14, 10), wm); h.position.set(0, 0.13, 0.07); f.add(h);
  [-1, 1].forEach((s) => { const ear = new THREE.Mesh(new THREE.SphereGeometry(0.018, 10, 8), wm); ear.scale.set(0.7, 3.2, 0.5); ear.position.set(s * 0.02, 0.2, 0.06); ear.rotation.z = -s * 0.15; f.add(ear); const inn = new THREE.Mesh(new THREE.SphereGeometry(0.01, 8, 6), pm); inn.scale.set(0.6, 3.6, 0.3); inn.position.set(s * 0.02, 0.2, 0.068); f.add(inn);
    const e = new THREE.Mesh(new THREE.SphereGeometry(0.008, 8, 6), M(0x111111, 0.3)); e.position.set(s * 0.024, 0.14, 0.105); f.add(e); });
  const tail = new THREE.Mesh(new THREE.SphereGeometry(0.025, 10, 8), wm); tail.position.set(0, 0.08, -0.085); f.add(tail); return f; }
export function numberTrackJumps(o = {}) {
  const it = new Item('jjump5', { ...o, name: { en: 'Number track, frog and rabbit', hi: 'संख्या पट्टी, मेंढक और खरगोश', hg: 'Number track, mendhak aur khargosh' } });
  const g = it.g, w_ = o.W || ((k) => k), U = 0.24, X0 = -3.6, Z = -1.6, N = 30;
  const trT = tex(4096, 128, (x) => { x.fillStyle = '#f7f3e8'; x.fillRect(0, 0, 4096, 128); const cw = 4096 / (N + 1); x.textAlign = 'center'; x.textBaseline = 'middle';
    for (let n = 0; n <= N; n++) { x.fillStyle = n % 2 ? '#efe6cf' : '#f7f3e8'; x.fillRect(n * cw, 0, cw, 128); x.strokeStyle = '#8a7a5a'; x.lineWidth = 3; x.strokeRect(n * cw, 0, cw, 128); x.fillStyle = '#1d2733'; x.font = `800 ${n > 9 ? 54 : 62}px ${FONT}`; x.fillText(String(n), n * cw + cw / 2, 66); } });
  trT.anisotropy = 8;
  const track = new THREE.Mesh(new THREE.PlaneGeometry(U * (N + 1), 0.42), new THREE.MeshStandardMaterial({ map: trT, roughness: 0.9 })); track.rotation.x = -Math.PI / 2; track.position.set(X0 + U * N / 2, 0.005, Z); track.receiveShadow = true; g.add(track);
  const xOf = (n) => X0 + n * U;
  const frog = frogFig(), rab = rabbitFig(); frog.position.set(xOf(0), 0.005, Z + 0.12); rab.position.set(xOf(0), 0.005, Z - 0.12); frog.rotation.y = Math.PI / 2; rab.rotation.y = Math.PI / 2; g.add(frog); g.add(rab);
  const markG = new THREE.CircleGeometry(0.045, 20), gM = new THREE.MeshBasicMaterial({ color: 0x3f9a3a, toneMapped: false }), oM = new THREE.MeshBasicMaterial({ color: 0xf08a2c, toneMapped: false });
  const ringM = new THREE.MeshBasicMaterial({ color: 0xffd23f, toneMapped: false }); const rings = [];
  const mark = (n, m, dz) => { const c = new THREE.Mesh(markG, m); c.rotation.x = -Math.PI / 2; c.position.set(xOf(n), 0.008, Z + dz); g.add(c); };
  const rd = liveSign(0.2, 3.6); rd.position.set(0, 1.25, -2.3); g.add(rd);
  animator(it); it.stage = 0; it.f = []; it.r = [];
  const hop = (fig, from, to, h, dz, m, list, cb) => { const a = xOf(from), b = xOf(to), sx = fig.scale.x; it.play(0.42, (k) => { fig.position.x = a + (b - a) * k; fig.position.y = 0.005 + Math.sin(k * Math.PI) * h; const sq = 1 + Math.sin(k * Math.PI) * 0.15; fig.scale.set(sx, sx * sq, sx); },
    () => { fig.position.set(b, 0.005, Z + dz); fig.scale.set(sx, sx, sx); mark(to, m, dz); list.push(to); if (cb) cb(); }); };
  const run = (fig, step, h, dz, m, list, max, fin) => { const go = () => { const at = list.length ? list[list.length - 1] : 0; if (at + step > max) { fin(); return; } hop(fig, at, at + step, h, dz, m, list, () => { rd.set([list.join(', ')], dz > 0 ? '#8be07a' : '#ffb070'); go(); }); }; go(); };
  it.jump = (cb) => { if (it.busy || it.stage >= 2) return false; const s = it.stage; it.stage = s + 0.5;
    if (s === 0) run(frog, 3, 0.25, 0.12, gM, it.f, N, () => { it.stage = 1; rd.set([`${w_('frog')}: 3, 6, 9 … 30`], '#8be07a'); if (cb) cb(); });
    else run(rab, 4, 0.3, -0.12, oM, it.r, N, () => { it.stage = 2; const both = it.f.filter((n) => it.r.includes(n));
      both.forEach((n) => { const r2 = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.012, 8, 28), ringM); r2.rotation.x = Math.PI / 2; r2.position.set(xOf(n), 0.02, Z); g.add(r2); rings.push(r2); });
      rd.set([`${w_('both')}: ${both.join(', ')}`], '#ffd23f'); if (cb) cb(); });
    return true; };
  it.say = (l, c) => rd.set(l, c);
  it.say([`${w_('frog')}: +3   ${w_('rabbit')}: +4`], '#ffffff');
  it.leverPath = floorLever;
  return done1(it, { height: 0.3, radius: 3.8 });
}
export function bindJumpHands5(nt, lever, app, s = { frog: 1, rabbit: 2 }, done = {}) {
  pushKnob(lever, { path: () => nt.leverPath(), active: () => !nt.busy && ((stepNow(app, s.frog) && nt.stage === 0) || (stepNow(app, s.rabbit) && nt.stage === 1)), keepVisible: () => app.runner.i === s.frog || app.runner.i === s.rabbit,
    press: () => nt.jump(() => { if (nt.stage === 1 && done.frog) done.frog(); if (nt.stage === 2 && done.rabbit) done.rabbit(); }) });
}

// ------------------------------------------------------------------ Class 5 Ch 14 Maps and Locations: a bus on a village map
// A map board of a village on the table: roads every block (1 block = 100 m), North to the top. Each push of the lever
// drives a toy bus one block from the school: 2 blocks North, then 3 blocks East, to the post office.
export function villageMap(o = {}) {
  const it = new Item('jmap5', { ...o, name: { en: 'Village map and toy bus', hi: 'गाँव का नक्शा और खिलौना बस', hg: 'Gaon ka naksha aur khilauna bus' } });
  const g = it.g, w_ = o.W || ((k) => k), B = 0.08, NB = 7, S = B * NB, C = V(0, 0.012, -0.08);
  const mapT = tex(1024, 1024, (x) => { const rr = rnd(9); x.fillStyle = '#cfe3a8'; x.fillRect(0, 0, 1024, 1024); for (let i = 0; i < 260; i++) { x.fillStyle = `rgba(${90 + rr() * 40},${140 + rr() * 40},${60 + rr() * 30},0.25)`; x.fillRect(rr() * 1024, rr() * 1024, 30 + rr() * 60, 20 + rr() * 40); }
    x.strokeStyle = '#7ab8e0'; x.lineWidth = 34; x.beginPath(); x.moveTo(0, 860); x.bezierCurveTo(300, 760, 520, 990, 1024, 900); x.stroke();
    const cw = 1024 / NB; x.strokeStyle = '#b9b2a4'; x.lineWidth = 22; for (let i = 0; i <= NB; i++) { const p = Math.min(1013, Math.max(11, i * cw)); x.beginPath(); x.moveTo(p, 0); x.lineTo(p, 1024); x.stroke(); x.beginPath(); x.moveTo(0, p); x.lineTo(1024, p); x.stroke(); }
    x.strokeStyle = '#f4f1e8'; x.lineWidth = 2; x.setLineDash([10, 10]); for (let i = 0; i <= NB; i++) { const p = Math.min(1013, Math.max(11, i * cw)); x.beginPath(); x.moveTo(p, 0); x.lineTo(p, 1024); x.stroke(); x.beginPath(); x.moveTo(0, p); x.lineTo(1024, p); x.stroke(); } x.setLineDash([]); });
  const board = new THREE.Mesh(new THREE.BoxGeometry(S, 0.012, S), [M(0x6b3f1d), M(0x6b3f1d), new THREE.MeshStandardMaterial({ map: mapT, roughness: 0.85 }), M(0x6b3f1d), M(0x6b3f1d), M(0x6b3f1d)]); board.position.set(C.x, 0.006, C.z); board.castShadow = true; g.add(board);
  const rimM = new THREE.MeshStandardMaterial({ map: woodTex('#6b3f1d', 23), roughness: 0.6 }); [[0, -1], [0, 1], [-1, 0], [1, 0]].forEach(([sx, sz]) => { const r = new THREE.Mesh(new THREE.BoxGeometry(sx ? 0.02 : S + 0.04, 0.016, sz ? 0.02 : S), rimM); r.position.set(C.x + sx * (S / 2 + 0.01), 0.008, C.z + sz * (S / 2 + 0.01)); g.add(r); });
  const at = (i, j) => V(C.x - S / 2 + i * B, C.y + 0.001, C.z + S / 2 - j * B); // road crossing i (east), j (north)
  const inBlock = (i, j) => V(C.x - S / 2 + (i + 0.5) * B, C.y, C.z + S / 2 - (j + 0.5) * B);
  const bld = (i, j, w, h, d, wall, roof, label, extra) => { const p = inBlock(i, j); const gg = new THREE.Group(); gg.position.copy(p); g.add(gg); const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), M(wall, 0.7)); b.position.y = h / 2; b.castShadow = true; gg.add(b);
    const r = new THREE.Mesh(new THREE.ConeGeometry(Math.max(w, d) * 0.75, h * 0.5, 4), M(roof, 0.6)); r.rotation.y = Math.PI / 4; r.position.y = h + h * 0.25; gg.add(r); if (extra) extra(gg, h);
    const t = tag(w_(label), '#ffffff', 0.022); t.position.set(0, h * 1.6 + 0.03, 0); gg.add(t); return gg; };
  const school = bld(2, 0, 0.05, 0.03, 0.04, 0xf2e4c4, 0x2a6fd1, 'School', (gg, h) => { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.0015, 0.0015, 0.06, 6), M(0xdddddd)); p.position.set(0.03, 0.03, 0); gg.add(p); const fl = new THREE.Mesh(new THREE.PlaneGeometry(0.02, 0.013), M(0xf08a2c)); fl.material.side = THREE.DoubleSide; fl.position.set(0.04, 0.054, 0); gg.add(fl); void h; });
  bld(5, 2, 0.05, 0.03, 0.04, 0xd9472b, 0x7a2a1a, 'Post Office');
  const temple = bld(0, 0, 0.035, 0.025, 0.035, 0xf6f1e4, 0xf08a2c, 'Temple'); void temple;
  bld(3, 5, 0.05, 0.035, 0.045, 0xffffff, 0xb3261e, 'Hospital');
  const well = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.012, 16), M(0x8a8f96, 0.7)); well.position.copy(inBlock(6, 4)).add(V(0, 0.006, 0)); g.add(well); const wt = tag(w_('Well'), '#ffffff', 0.022); wt.position.copy(inBlock(6, 4)).add(V(0, 0.04, 0)); g.add(wt);
  for (let k = 0; k < 5; k++) { const tr = new THREE.Mesh(new THREE.SphereGeometry(0.012, 10, 8), M(0x2f7a3d, 0.7)); tr.position.copy(inBlock(1, 4)).add(V((k % 3 - 1) * 0.022, 0.018, (Math.floor(k / 3) - 0.5) * 0.025)); g.add(tr); } const pt = tag(w_('Park'), '#ffffff', 0.022); pt.position.copy(inBlock(1, 4)).add(V(0, 0.05, 0)); g.add(pt);
  const nT = tex(128, 192, (x) => { x.fillStyle = 'rgba(255,255,255,0.92)'; x.beginPath(); x.roundRect(4, 4, 120, 184, 20); x.fill(); x.fillStyle = '#b3261e'; x.beginPath(); x.moveTo(64, 20); x.lineTo(96, 110); x.lineTo(64, 90); x.lineTo(32, 110); x.closePath(); x.fill(); x.fillStyle = '#1d2733'; x.font = `900 52px ${FONT}`; x.textAlign = 'center'; x.fillText(w_('N'), 64, 168); });
  const nArrow = new THREE.Mesh(new THREE.PlaneGeometry(0.045, 0.0675), new THREE.MeshBasicMaterial({ map: nT, transparent: true, toneMapped: false })); nArrow.rotation.x = -Math.PI / 2; nArrow.position.set(C.x + S / 2 + 0.05, 0.013, C.z - S / 2 + 0.04); g.add(nArrow);
  const scT = tex(256, 96, (x) => { x.fillStyle = 'rgba(255,255,255,0.92)'; x.fillRect(0, 0, 256, 96); x.fillStyle = '#1d2733'; x.fillRect(20, 30, 216 / 2, 12); x.strokeStyle = '#1d2733'; x.lineWidth = 3; x.strokeRect(20, 30, 216, 12); x.font = `800 26px ${FONT}`; x.textAlign = 'center'; x.fillText(`1 ${w_('block')} = 100 m`, 128, 80); });
  const scale = new THREE.Mesh(new THREE.PlaneGeometry(0.09, 0.034), new THREE.MeshBasicMaterial({ map: scT, toneMapped: false })); scale.rotation.x = -Math.PI / 2; scale.position.set(C.x + S / 2 + 0.06, 0.013, C.z + S / 2 - 0.03); g.add(scale);
  // toy bus
  const bus = new THREE.Group(); g.add(bus); const bb = new THREE.Mesh(new THREE.BoxGeometry(0.026, 0.018, 0.045), M(0xf2b632, 0.5)); bb.position.y = 0.013; bus.add(bb);
  const win = new THREE.Mesh(new THREE.BoxGeometry(0.027, 0.006, 0.035), M(0x2b3a4a, 0.3)); win.position.set(0, 0.017, 0.002); bus.add(win);
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.004, 10), M(0x111111)); w.rotation.z = Math.PI / 2; w.position.set(sx * 0.014, 0.005, sz * 0.014); bus.add(w); });
  const ROUTE = [[2, 1], [2, 2], [2, 3], [3, 3], [4, 3], [5, 3]]; // from the crossing at the school's corner, along the roads
  const pathM = new THREE.MeshBasicMaterial({ color: 0xd93a2b, toneMapped: false });
  bus.position.copy(at(...ROUTE[0])); bus.rotation.y = 0;
  const hl = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.004, 8, 24), new THREE.MeshBasicMaterial({ color: 0xffd23f, toneMapped: false })); hl.rotation.x = Math.PI / 2; hl.visible = false; g.add(hl);
  const rd = liveSign(0.07, 3.6); rd.position.set(0, 0.32, -0.36); g.add(rd);
  animator(it); it.n = 0; const DIRS = ['N', 'N', 'E', 'E', 'E'];
  it.move1 = (cb) => { if (it.busy || it.n >= 5) return false; const a = at(...ROUTE[it.n]), b = at(...ROUTE[it.n + 1]), dirE = DIRS[it.n] === 'E';
    const seg = new THREE.Mesh(new THREE.BoxGeometry(dirE ? B : 0.005, 0.001, dirE ? 0.005 : B), pathM); seg.position.copy(a.clone().lerp(b, 0.5)).add(V(0, 0.001, 0)); seg.visible = false; g.add(seg);
    const r0 = bus.rotation.y, r1 = dirE ? -Math.PI / 2 : 0;
    it.play(0.7, (k) => { const e = ease(k); bus.position.lerpVectors(a, b, e); bus.rotation.y = r0 + (r1 - r0) * Math.min(1, k * 3); seg.visible = k > 0.5; },
      () => { it.n++; const p = DIRS.slice(0, it.n); const nN = p.filter((d) => d === 'N').length, nE = it.n - nN; rd.set([`${nN} ${w_('North')}${nE ? `, ${nE} ${w_('East')}` : ''}`, `${it.n} × 100 m = ${it.n * 100} m`], it.n >= 5 ? ['#8be07a', '#8be07a'] : ['#ffd23f', '#ffffff']);
        if (it.n >= 5) { hl.position.copy(inBlock(5, 2)).add(V(0, 0.002, 0)); hl.visible = true; } if (cb) cb(); }); return true; };
  it.showTemple = () => { hl.position.copy(inBlock(0, 0)).add(V(0, 0.002, 0)); hl.visible = true; };
  void school;
  it.say = (l, c) => rd.set(l, c);
  it.say([w_('School → Post Office')], '#ffffff');
  it.leverPath = () => tableLever(g);
  return done1(it, { height: 0.08, radius: 0.4 });
}
export function bindMapHands(vm, lever, app, s = { drive: 1 }, done = {}) {
  pushKnob(lever, { path: () => vm.leverPath(), active: () => stepNow(app, s.drive) && !vm.busy && vm.n < 5, keepVisible: () => app.runner.i === s.drive, press: () => vm.move1(() => { if (vm.n >= 5 && done.all) done.all(); }) });
}

// ------------------------------------------------------------------ Class 5 Ch 15 Data Through Pictures: a pictograph of mangoes
// A fruit seller's board on the table. Key: one mango stands for 10 mangoes sold. Each push of the lever puts up one
// day's row: Monday 4, Tuesday 2½ (a cut half mango is 5), Wednesday 6, Thursday 3.
export function mangoPictograph(o = {}) {
  const it = new Item('jpict5', { ...o, name: { en: 'Mango pictograph board', hi: 'आमों का चित्रालेख बोर्ड', hg: 'Aamon ka pictograph board' } });
  const g = it.g, w_ = o.W || ((k) => k), DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday'], DATA = [4, 2.5, 6, 3], ZC = -0.08;
  const bT = tex(1024, 640, (x) => { x.fillStyle = '#f4ead2'; x.fillRect(0, 0, 1024, 640); x.strokeStyle = '#7a5a32'; x.lineWidth = 6; x.strokeRect(10, 10, 1004, 620); x.lineWidth = 2; for (let r = 1; r <= 4; r++) { x.beginPath(); x.moveTo(20, 70 + r * 120); x.lineTo(1004, 70 + r * 120); x.stroke(); } x.beginPath(); x.moveTo(250, 70); x.lineTo(250, 550); x.stroke();
    x.fillStyle = '#3b2a1a'; x.font = `800 40px ${FONT}`; x.textAlign = 'left'; x.textBaseline = 'middle'; x.fillText(w_('Mangoes sold'), 30, 42); x.font = `700 32px ${FONT}`; DAYS.forEach((d, i) => x.fillText(w_(d), 30, 130 + i * 120, 210));
    x.font = `700 36px ${FONT}`; x.fillText(`= 10 ${w_('mangoes')}`, 690, 595); });
  const board = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.012, 0.4), [M(0x6b3f1d), M(0x6b3f1d), new THREE.MeshStandardMaterial({ map: bT, roughness: 0.85 }), M(0x6b3f1d), M(0x6b3f1d), M(0x6b3f1d)]); board.position.set(0, 0.006, ZC); board.castShadow = true; g.add(board);
  const mg = new THREE.SphereGeometry(0.022, 18, 12); mg.scale(1.25, 0.8, 0.9); const mm = new THREE.MeshStandardMaterial({ map: mangoTex(), roughness: 0.45 });
  const halfG = new THREE.SphereGeometry(0.022, 18, 12, 0, Math.PI); halfG.scale(1.25, 0.8, 0.9); const flesh = new THREE.Mesh(new THREE.CircleGeometry(0.022, 20), M(0xf7b32b, 0.5));
  const mango = (half) => { const gg = new THREE.Group(); if (!half) { const m = new THREE.Mesh(mg, mm); m.castShadow = true; m.position.y = 0.017; gg.add(m); } else { const m = new THREE.Mesh(halfG, mm); m.rotation.x = Math.PI / 2; m.position.y = 0.0205; gg.add(m); const f = flesh.clone(); f.scale.set(1.25, 0.8, 1); f.rotation.x = -Math.PI / 2; f.position.y = 0.0212; gg.add(f); } return gg; };
  const key = mango(false); key.position.set(0.08, 0.012, ZC + 0.172); g.add(key);
  const pos = (r, c) => V(-0.32 + (250 + 45 + c * 95) / 1024 * 0.64, 0.012, ZC - 0.2 + (130 + r * 120) / 640 * 0.4);
  const rows = DATA.map((n, r) => { const arr = []; for (let c = 0; c < Math.ceil(n); c++) { const m = mango(c + 1 > n); m.position.copy(pos(r, c)); m.visible = false; g.add(m); arr.push(m); } return arr; });
  const cnt = DATA.map((n, r) => { const t = tag(`${n * 10}`, '#ffd23f', 0.035); t.position.copy(pos(r, 6.6)).add(V(0, 0.03, 0)); t.visible = false; g.add(t); return t; });
  const rd = liveSign(0.07, 3.6); rd.position.set(0, 0.3, -0.34); g.add(rd);
  animator(it); it.n = 0;
  it.addRow = (cb) => { if (it.busy || it.n >= 4) return false; const r = it.n, arr = rows[r];
    it.play(0.3 + arr.length * 0.12, (k) => { arr.forEach((m, c) => { const e = clamp01((k - c / arr.length * 0.7) / 0.3); m.visible = e > 0; m.position.y = 0.012 + (1 - ease(e)) * 0.08; }); },
      () => { arr.forEach((m) => { m.position.y = 0.012; m.visible = true; }); cnt[r].visible = true; it.n++; const n = DATA[r]; rd.set([`${w_(DAYS[r])}: ${n === 2.5 ? '2½' : n} × 10 = ${n * 10}`], '#ffd23f'); if (cb) cb(); }); return true; };
  it.say = (l, c) => rd.set(l, c);
  it.say([w_('one mango picture = 10 mangoes')], '#ffffff');
  it.leverPath = () => tableLever(g);
  return done1(it, { height: 0.05, radius: 0.45 });
}
export function bindPictoHands(mp, lever, app, s = { add: 1 }, done = {}) {
  pushKnob(lever, { path: () => mp.leverPath(), active: () => stepNow(app, s.add) && !mp.busy && mp.n < 4, keepVisible: () => app.runner.i === s.add, press: () => mp.addRow(() => { if (mp.n >= 4 && done.all) done.all(); }) });
}
export { IN };
