// DUET Maths Lab 360, hands-on in 3D, batch 14: the chapters that only had table-top models get a real-place, hands-on
// version — sharing rotis (fractions), a rangoli folded and turned (symmetry), three sticks that may or may not make a
// triangle, a stack of cubes (squares and cubes), a garden cut into four beds (distributing), a field that leans
// (perimeter and area), and a big spinner (probability).
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
const basic = (c, op = 1) => new THREE.MeshBasicMaterial({ color: c, transparent: op < 1, opacity: op, side: THREE.DoubleSide, depthWrite: op >= 1, toneMapped: false });
function tag(text, col = '#ffffff', h = 0.2, bg = 'rgba(12,16,24,0.85)') {
  const n = String(text).length, w = n <= 2 ? 2 : n <= 4 ? 3 : n <= 7 ? 4 : 6, W = 128 * w;
  const paint = (x, txt, c) => { x.clearRect(0, 0, W, 128); x.fillStyle = bg; x.beginPath(); x.roundRect(4, 4, W - 8, 120, 40); x.fill(); x.fillStyle = c; x.font = `800 ${String(txt).length > 8 ? 56 : 72}px ${FONT}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(String(txt), W / 2, 68); };
  const t = canvasTex(W, 128, (x) => paint(x, text, col));
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: false, toneMapped: false })); s.scale.set(h * w, h, 1); s.renderOrder = 40; s.userData.noHit = true;
  s.setText = (txt, c = col) => { paint(t.image.getContext('2d'), txt, c); t.needsUpdate = true; };
  return s;
}
const flatPoly = (pts, mat, y = 0.012) => { const sh = new THREE.Shape(pts.map(([x, z]) => new THREE.Vector2(x, -z))); const geo = new THREE.ShapeGeometry(sh); geo.rotateX(-Math.PI / 2); const m = new THREE.Mesh(geo, mat); m.position.y = y; m.userData.noHit = true; return m; };

// ------------------------------------------------------------------ Class 6 Ch 7 Fractions: 3 rotis for 4 children
// Three rotis lie on the table and four plates wait in front. The lever cuts every roti into 4 equal pieces; then each
// child gets one piece from each roti: 3 quarters, which sit on the plate as three-quarters of a roti.
let rotiTexC = null;
const rotiTex = () => rotiTexC || (rotiTexC = canvasTex(256, 256, (x) => { x.fillStyle = '#e7c48a'; x.beginPath(); x.arc(128, 128, 126, 0, 7); x.fill();
  for (let i = 0; i < 90; i++) { const a = Math.random() * 7, r = Math.random() * 115, s = 3 + Math.random() * 9; x.fillStyle = `rgba(${120 + Math.random() * 40},${70 + Math.random() * 30},30,${0.35 + Math.random() * 0.4})`; x.beginPath(); x.ellipse(128 + Math.cos(a) * r, 128 + Math.sin(a) * r, s, s * 0.7, a, 0, 7); x.fill(); } }));
export function rotiShare(o = {}) {
  const it = new Item('wroti6', { ...o, name: { en: 'Rotis and plates', hi: 'रोटियाँ और थालियाँ', hg: 'Rotiyan aur thaaliyan' } });
  const g = it.g, R = 0.075;
  const RC = [-0.2, 0, 0.2].map((x) => V(x, 0, -0.1)), PC = [-0.3, -0.1, 0.1, 0.3].map((x) => V(x, 0, 0.13));
  const plateG = new THREE.CylinderGeometry(0.085, 0.07, 0.012, 32); const plateM = M(0xd8dce0, 0.25, 0.7);
  PC.forEach((p) => { const pl = new THREE.Mesh(plateG, plateM); pl.position.copy(p).setY(0.006); g.add(pl); });
  const kids = PC.map((p, i) => { const t = tag(String(i + 1), '#ffd23f', 0.035); t.position.copy(p).add(V(0, 0.03, 0.1)); g.add(t); return t; }); void kids;
  const pieceMat = new THREE.MeshStandardMaterial({ map: rotiTex(), roughness: 0.85 });
  // each roti = 8 eighths; quarter q = eighths 2q and 2q + 1
  const pieces = [];
  for (let r = 0; r < 3; r++) for (let e = 0; e < 8; e++) { const geo = new THREE.CylinderGeometry(R, R, 0.006, 6, 1, false, e * Math.PI / 4, Math.PI / 4); const uv = geo.attributes.uv, pos = geo.attributes.position;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, 0.5 + pos.getX(i) / (2 * R), 0.5 - pos.getZ(i) / (2 * R)); // top-down map of the whole roti
    const m = new THREE.Mesh(geo, pieceMat); m.r = r; m.e = e; m.q = e >> 1; g.add(m); pieces.push(m); }
  const lineM = new THREE.MeshBasicMaterial({ color: 0x5a3a1a, toneMapped: false });
  const cuts = []; for (let r = 0; r < 3; r++) for (let e = 0; e < 8; e++) { const a = e * Math.PI / 4, c = rod(RC[r].clone().setY(0.0075), RC[r].clone().add(V(R * Math.sin(a), 0.0075, R * Math.cos(a))), 0.0012, lineM); c.visible = false; c.e = e; g.add(c); cuts.push(c); }
  const rd = liveSign(0.09, 3.4); rd.position.set(0, 0.17, -0.24); g.add(rd);
  it.cut = 0; it.deal = 0; it.eighths = false;
  const place = () => { const d = ease(clamp01(it.deal));
    pieces.forEach((m) => { const gap = it.cut ? 0.004 : 0, mid = (m.q * 2 + 1) * Math.PI / 4, home = RC[m.r].clone().add(V(Math.sin(mid) * gap, 0.009, Math.cos(mid) * gap));
      const dst = PC[m.q].clone().add(V(0, 0.016, 0)), rot = (m.r - m.q) * Math.PI / 2;
      m.position.copy(home).lerp(dst, d); m.position.y += Math.sin(d * Math.PI) * 0.08; m.rotation.y = rot * d; });
    cuts.forEach((c) => { c.visible = it.cut > 0 && it.deal === 0 && (c.e % 2 === 0 || it.eighths); }); };
  it.say = (lines, cols) => rd.set(lines, cols);
  it.setCut = (v) => { it.cut = v; place(); };
  it.setDeal = (k) => { it.deal = k; place(); };
  const eighthLines = []; PC.forEach((p) => { for (let r = 0; r < 3; r++) { const a = (r * 90 + 45) * DEG, l = rod(p.clone().setY(0.0235), p.clone().add(V(R * Math.sin(a), 0.0235, R * Math.cos(a))), 0.0012, lineM); l.visible = false; g.add(l); eighthLines.push(l); } });
  it.setEighths = (v) => { it.eighths = v; eighthLines.forEach((l) => { l.visible = v; }); place(); };
  let anim = null; it.busy = false;
  it.doCut = () => { if (it.busy || it.cut) return false; it.busy = true; anim = { t: 0 }; return true; };
  it.update = (dt) => { if (!anim) return; anim.t = Math.min(1, anim.t + Math.min(dt || 0.016, 0.05) * 1.5); cuts.forEach((c) => { c.visible = (c.e % 2 === 0) && (c.e / 8) < anim.t; }); if (anim.t >= 1) { anim = null; it.busy = false; it.setCut(1); if (it.onCut) it.onCut(); } };
  it.setCut(0); it.say(['3 ÷ 4 = ?'], '#ffd23f');
  const W = (x, y, z) => g.localToWorld(V(x, y, z));
  it.leverPath = () => [W(-0.3, 0.1, 0.24), W(-0.3, 0.1, 0.32)];
  it.at = (k) => ({ top: W(0, 0.28, -0.24), plate: W(-0.3, 0.12, 0.13) }[k] || W(0, 0.2, 0));
  noHit(g); it.noGrab = true; it.noPhys = true; it.height = 0.05; it.radius = 0.4; it.base = 0; return it;
}
export function bindRotiHands(rs, lever, app, s = { cut: 1 }, done = {}) {
  rs.onCut = () => done.cut && done.cut();
  pushKnob(lever, { path: () => rs.leverPath(), active: () => stepNow(app, s.cut) && !rs.busy && !rs.cut, keepVisible: () => app.runner.i === s.cut, press: () => rs.doCut() });
}

// ------------------------------------------------------------------ Class 6 Ch 9 Symmetry: a rangoli folded and turned
// A square rangoli (2 m) on the ground: only its left half is drawn, the right half is folded over the middle line. The
// lever unfolds it like paper; then a handle turns the whole rangoli, and it looks the same after every quarter turn.
let rangT = null;
const rangoliTex = () => rangT || (rangT = canvasTex(1024, 1024, (x) => { const C = 512; x.fillStyle = '#7a1f2b'; x.fillRect(0, 0, 1024, 1024); x.strokeStyle = '#f6e7c1'; x.lineWidth = 14; x.strokeRect(20, 20, 984, 984);
  const petal = (a, len, wid, col) => { x.save(); x.translate(C, C); x.rotate(a); x.fillStyle = col; x.beginPath(); x.moveTo(0, -60); x.quadraticCurveTo(wid, -len * 0.55, 0, -len); x.quadraticCurveTo(-wid, -len * 0.55, 0, -60); x.fill(); x.restore(); };
  for (let k = 0; k < 4; k++) { petal(k * Math.PI / 2, 470, 190, '#ffb020'); petal(k * Math.PI / 2, 380, 110, '#ff5a3c'); petal(k * Math.PI / 2 + Math.PI / 4, 330, 90, '#2fb06a'); petal(k * Math.PI / 2 + Math.PI / 4, 240, 50, '#f6e7c1'); }
  for (let k = 0; k < 4; k++) { x.save(); x.translate(C, C); x.rotate(k * Math.PI / 2 + Math.PI / 4); x.fillStyle = '#3f8fe0'; x.beginPath(); x.arc(0, -560, 50, 0, 7); x.fill(); x.restore(); }
  for (let k = 0; k < 4; k++) { x.save(); x.translate(C, C); x.rotate(k * Math.PI / 2); x.fillStyle = '#f6e7c1'; x.beginPath(); x.arc(0, -495, 26, 0, 7); x.fill(); x.restore(); }
  x.fillStyle = '#ffd23f'; x.beginPath(); x.arc(C, C, 90, 0, 7); x.fill(); x.fillStyle = '#7a1f2b'; x.beginPath(); x.arc(C, C, 45, 0, 7); x.fill(); }));
export function rangoliFold(o = {}) {
  const it = new Item('wrang', { ...o, name: { en: 'Rangoli', hi: 'रंगोली', hg: 'Rangoli' } });
  const g = it.g, S = 2.0, C = V(0, 0.012, -2.4);
  const spin = new THREE.Group(); spin.position.copy(C); g.add(spin);
  const half = (u0) => { const geo = new THREE.PlaneGeometry(S / 2, S); geo.rotateX(-Math.PI / 2); const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setX(i, u0 + uv.getX(i) * 0.5); return new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: rangoliTex(), roughness: 0.9, side: THREE.FrontSide })); };
  const left = half(0); left.position.x = -S / 4; spin.add(left); left.material.emissive = new THREE.Color(0x000000);
  const hinge = new THREE.Group(); spin.add(hinge); const right = half(0.5); right.position.x = S / 4; right.position.y = 0.002; hinge.add(right);
  const backM = new THREE.MeshStandardMaterial({ color: 0xe9dfc8, roughness: 0.95, side: THREE.BackSide }); const back = new THREE.Mesh(right.geometry, backM); back.position.copy(right.position); hinge.add(back);
  const mirror = rod(V(0, 0.03, -S / 2 - 0.15).add(C), V(0, 0.03, S / 2 + 0.15).add(C), 0.014, glow(0x7ad0ff)); g.add(mirror);
  const lines = [0, 45, 90, 135].map((a) => { const d = V(Math.sin(a * DEG), 0, Math.cos(a * DEG)).multiplyScalar(S * 0.72); const l = rod(C.clone().add(d).setY(0.035), C.clone().sub(d).setY(0.035), 0.012, glow(0x8be07a)); l.visible = false; g.add(l); return l; });
  // fixed marks to compare the turned rangoli with
  const mark = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.22, 3), glow(0xffffff)); mark.rotation.x = Math.PI / 2; mark.position.copy(C).add(V(0, 0.05, -S / 2 - 0.25)); g.add(mark);
  const dot = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 8), glow(0xff3b30)); dot.position.set(0, 0.06, -S / 2 + 0.06); spin.add(dot); dot.visible = false;
  const rd = liveSign(0.42, 3.2); rd.position.copy(C).add(V(S / 2 + 1.0, 0.45, 0)); g.add(rd);
  it.fold = 1; it.ang = 0; it.matches = new Set();
  it.setFold = (k) => { it.fold = clamp01(k); hinge.rotation.z = Math.PI * ease(it.fold); };
  it.words = () => ['turned', 'same again'];
  const say = () => { const [tw, sw] = it.words(), a = Math.round(it.ang), on = it.ang > 45 && Math.abs(a / 90 - Math.round(a / 90)) * 90 < 4; if (on) it.matches.add(Math.round(a / 90));
    rd.set([`${tw}: ${a}°`, `${sw}: ${it.matches.size}`], [on ? '#8be07a' : '#ffffff', '#ffd23f']); mark.material = on ? glow(0x8be07a) : glow(0xffffff); };
  it.relabel = say;
  it.setAng = (a) => { it.ang = Math.max(0, Math.min(360, a)); spin.rotation.y = -it.ang * DEG; dot.visible = true; say(); };
  it.showLines = (on = true) => { lines.forEach((l) => { l.visible = on; }); mirror.visible = !on; };
  it.hideAll = () => { lines.forEach((l) => { l.visible = false; }); mirror.visible = false; };
  it.say = (l, c) => rd.set(l, c);
  it.setFold(1); it.say(['?'], '#ffffff');
  it.leverPath = () => [V(-0.45, 1.0, -0.3), V(-0.45, 1.0, -0.05)];
  it.knobPath = () => [V(-0.45, 1.0, -0.42), V(0.45, 1.0, -0.42)];
  it.at = (k) => ({ mid: C.clone().add(V(0, 0.9, 0)), side: C.clone().add(V(S / 2 + 1.0, 1.0, 0)) }[k] || C.clone().add(V(0, 1, 0)));
  noHit(g); it.noGrab = true; it.noPhys = true; it.height = 0.02; it.radius = 2; it.base = 0; return it;
}
export function bindRangoliHands(rf, lever, knob, app, s = { unfold: 1, turn: 3 }, done = {}) {
  let anim = false;
  pushKnob(lever, { path: () => rf.leverPath(), active: () => stepNow(app, s.unfold) && rf.fold > 0 && !anim, keepVisible: () => app.runner.i === s.unfold,
    press: () => { anim = true; let t = 1; const id = setInterval(() => { t -= 0.04; rf.setFold(Math.max(0, t)); if (t <= 0) { clearInterval(id); anim = false; done.unfold && done.unfold(); } }, 30); } });
  const sync = slideKnob(knob, { path: () => rf.knobPath(), active: () => stepNow(app, s.turn), keepVisible: () => app.runner.i === s.turn, k: () => rf.ang / 360,
    set: (k) => { rf.hideAll(); let a = clamp01(k) * 360; const n = Math.round(a / 90) * 90; if (Math.abs(a - n) < 5) a = n;
      const lo = Math.min(rf.ang, a), hi = Math.max(rf.ang, a); for (let m = 90; m <= 360; m += 90) if (m > lo && m <= hi) rf.matches.add(m / 90); // a quick hand still counts every quarter turn it passes
      rf.setAng(a); if (rf.matches.size >= 4) done.turn && done.turn(); } });
  const s0 = rf.setAng; rf.setAng = (a) => { s0(a); sync(); };
}

// ------------------------------------------------------------------ Class 7 Ch 7 Three Intersecting Lines: three sticks
// Two long sticks lie on the ground from A (1.5 m apart: AB) and from A (1 m). The third stick, from B, can be made longer
// or shorter with the handle. The free ends meet — making a triangle — only when the third stick is between 0.5 m and 2.5 m.
export function threeSticks(o = {}) {
  const it = new Item('wsticks', { ...o, name: { en: 'Three sticks', hi: 'तीन डंडियाँ', hg: 'Teen dandiyan' } });
  const g = it.g, a = 1.5, b = 1.0, A = V(-0.75, 0.04, -2.3), B = V(0.75, 0.04, -2.3);
  const wood = (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.7 });
  const sAB = rod(A, B, 0.03, wood(0xc8a060)), sB = rod(A, A.clone().add(V(0, 0, -1)), 0.03, wood(0x5ec8ff)), sC = rod(B, B.clone().add(V(0, 0, -1)), 0.03, wood(0xff8a5a)); g.add(sAB, sB, sC);
  const peg = (p, L) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.12, 12), M(0x444444, 0.5)); m.position.copy(p).setY(0.06); g.add(m); const t = tag(L, '#ffffff', 0.18); t.position.copy(p).add(V(0, 0.32, 0.12)); g.add(t); return t; };
  peg(A, 'A'); peg(B, 'B'); const tC = tag('C', '#8be07a', 0.18); g.add(tC);
  const gapM = glow(0xff3b30); const gap = rod(A, B, 0.02, gapM); gap.visible = false; g.add(gap);
  const fill = new THREE.Mesh(new THREE.BufferGeometry(), basic(0x8be07a, 0.18)); fill.userData.noHit = true; g.add(fill);
  const lenT = [tag('1.5 m', '#e8d0a0', 0.15), tag('1 m', '#7ad0ff', 0.15), tag('c', '#ffb08a', 0.15)]; lenT.forEach((t) => g.add(t));
  const rd = liveSign(0.42, 3.2); rd.position.set(2.2, 0.6, -2.5); g.add(rd);
  it.c = 1.3; it.seen = { ok: false, bad: false }; it.ok = true; it.angles = [0, 0, 0];
  it.words = () => ['makes a triangle', 'ends do not meet', 'lies flat'];
  it.setC = (c) => { it.c = Math.max(0.2, Math.min(3.0, c)); const cc = it.c, x = (a * a + b * b - cc * cc) / (2 * a), h2 = b * b - x * x; const dir = V(1, 0, 0), up = V(0, 0, -1);
    let Pb, Pc; it.ok = h2 > 1e-4 && cc > Math.abs(a - b) && cc < a + b;
    if (it.ok) { const h = Math.sqrt(h2); Pb = Pc = A.clone().addScaledVector(dir, x).addScaledVector(up, h); }
    else if (cc >= a + b) { Pb = A.clone().addScaledVector(dir, -b); Pc = B.clone().addScaledVector(dir, -cc); Pb.z -= 0.06; Pc.z += 0.06; }
    else { Pb = A.clone().addScaledVector(dir, b); Pc = B.clone().addScaledVector(dir, -cc); Pb.z -= 0.06; Pc.z += 0.06; }
    setRod(sB, A, Pb); setRod(sC, B, Pc); gap.visible = !it.ok && Pb.distanceTo(Pc) > 0.13; if (gap.visible) setRod(gap, Pb.clone().setY(0.08), Pc.clone().setY(0.08));
    tC.visible = it.ok; if (it.ok) tC.position.copy(Pb).add(V(0, 0.32, -0.1));
    fill.visible = it.ok; if (it.ok) { fill.geometry.dispose(); fill.geometry = new THREE.BufferGeometry().setFromPoints([A, B, Pb].map((p) => p.clone().setY(0.015))); }
    lenT[0].position.copy(A).lerp(B, 0.5).add(V(0, 0.2, 0.2)); lenT[1].position.copy(A).lerp(Pb, 0.5).add(V(-0.15, 0.2, 0)); lenT[2].position.copy(B).lerp(Pc, 0.5).add(V(0.18, 0.2, 0)); lenT[2].setText(`${cc.toFixed(1)} m`);
    if (it.ok) { const ang = (P, Q, R) => Math.round(Q.clone().sub(P).angleTo(R.clone().sub(P)) / DEG); it.angles = [ang(A, B, Pb), ang(B, A, Pb), 0]; it.angles[2] = 180 - it.angles[0] - it.angles[1]; }
    it.seen[it.ok ? 'ok' : 'bad'] = true; const [mw, nw, fw] = it.words(), edge = Math.abs(cc - (a + b)) < 0.05 || Math.abs(cc - Math.abs(a - b)) < 0.05;
    rd.set([`1.5 + 1 = 2.5`, `c = ${cc.toFixed(1)} m: ${it.ok ? mw : edge ? fw : nw}`], ['#ffffff', it.ok ? '#8be07a' : edge ? '#ffd23f' : '#ff7a6f']); };
  it.relabel = () => it.setC(it.c);
  it.say = (l, c) => rd.set(l, c);
  it.setC(1.3); it.seen = { ok: false, bad: false };
  it.knobPath = () => [V(-0.45, 1.0, -0.42), V(0.45, 1.0, -0.42)];
  it.kOf = (c) => (c - 0.2) / 2.8; it.cOf = (k) => 0.2 + clamp01(k) * 2.8;
  it.at = (k) => ({ apex: V(0, 1.0, -3.2), rule: V(2.2, 1.25, -2.5) }[k] || V(0, 1.0, -2.5));
  noHit(g); it.noGrab = true; it.noPhys = true; it.height = 0.05; it.radius = 2; it.base = 0; return it;
}
export function bindStickHands(ts, knob, app, s = { slide: 1 }, done = {}) {
  const sync = slideKnob(knob, { path: () => ts.knobPath(), active: () => stepNow(app, s.slide), keepVisible: () => app.runner.i <= s.slide, k: () => ts.kOf(ts.c),
    set: (k) => { ts.setC(Math.round(ts.cOf(k) * 10) / 10); if (ts.seen.ok && ts.seen.bad) done.both && done.both(); } });
  const s0 = ts.setC; ts.setC = (c) => { s0(c); sync(); };
}

// ------------------------------------------------------------------ Class 8 Ch 1 A Square and A Cube: a stack of boxes
// Boxes (15 cm) are stacked into cubes 1, 8, 27, 64. Each push of the lever adds a new shell in a new colour. Then the 64
// boxes are laid flat: they make an 8 × 8 square too.
export function cubeStack(o = {}) {
  const it = new Item('wcubes8', { ...o, name: { en: 'Stack of boxes', hi: 'डिब्बों का ढेर', hg: 'Dibbon ka dher' } });
  const g = it.g, s = 0.15, C0 = V(-0.3, 0, -2.1);
  const boxT = canvasTex(64, 64, (x) => { x.fillStyle = '#ffffff'; x.fillRect(0, 0, 64, 64); x.strokeStyle = 'rgba(0,0,0,0.35)'; x.lineWidth = 6; x.strokeRect(3, 3, 58, 58); });
  const im = new THREE.InstancedMesh(new THREE.BoxGeometry(s * 0.96, s * 0.96, s * 0.96), new THREE.MeshStandardMaterial({ map: boxT, roughness: 0.6 }), 64); im.frustumCulled = false; g.add(im);
  const COL = [0xffd23f, 0xff7a5a, 0x5ec8ff, 0x8be07a].map((c) => new THREE.Color(c));
  const rd = liveSign(0.4, 3.0); rd.position.set(1.35, 0.5, -2.1); g.add(rd);
  const cells = []; for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) for (let k = 0; k < 4; k++) cells.push({ i, j, k, sh: Math.max(i, j, k) });
  cells.sort((p, q) => p.sh - q.sh || p.j - q.j || p.k - q.k || p.i - q.i);
  it.n = 1; it.flat = 0;
  const mtx = new THREE.Matrix4();
  const draw = () => { const n = it.n, list = cells.filter((c) => c.sh < n), f = ease(clamp01(it.flat));
    list.forEach((c, idx) => { const p3 = V(C0.x + (c.i + 0.5) * s, (c.j + 0.5) * s, C0.z - (c.k + 0.5) * s), fr = Math.floor(idx / 8), fc = idx % 8, p2 = V(-0.6 + (fc + 0.5) * s, s / 2, -1.5 - (fr + 0.5) * s);
      const p = p3.lerp(p2, f); p.y += Math.sin(f * Math.PI) * 0.3; mtx.makeTranslation(p.x, p.y, p.z); im.setMatrixAt(idx, mtx); im.setColorAt(idx, COL[c.sh]); });
    im.count = list.length; im.instanceMatrix.needsUpdate = true; im.instanceColor.needsUpdate = true; };
  it.setN = (n) => { it.n = Math.max(1, Math.min(4, n)); draw(); const N = it.n; rd.set([`${N} × ${N} × ${N} = ${N ** 3}`, N > 1 ? `+${N ** 3 - (N - 1) ** 3}` : ''], ['#ffd23f', '#ffffff']); };
  it.setFlat = (k) => { it.flat = k; draw(); };
  it.say = (l, c) => rd.set(l, c);
  it.setN(1);
  it.leverPath = () => [V(-0.45, 1.0, -0.3), V(-0.45, 1.0, -0.05)];
  it.at = (k) => ({ top: V(0, 1.0, -2.3) }[k] || V(0, 1, -2.2));
  noHit(g); it.noGrab = true; it.noPhys = true; it.height = 0.6; it.radius = 1.2; it.base = 0; return it;
}
export function bindCubeHands(cs, lever, app, s = { grow: 1 }, done = {}) {
  pushKnob(lever, { path: () => cs.leverPath(), active: () => stepNow(app, s.grow) && cs.n < 4, keepVisible: () => app.runner.i === s.grow, press: () => { cs.setN(cs.n + 1); if (cs.n >= 4) done.grow && done.grow(); } });
}

// ------------------------------------------------------------------ Class 8 Ch 6 We Distribute, Yet Things Multiply: a garden
// A garden 23 m × 14 m (drawn at 1 m = 15 cm, with 1 m squares) is cut into four beds by two paths: one after 20 m, one
// after 10 m. The four beds are 200, 30, 80 and 12 m² — together 23 × 14 = 322 m².
export function gardenBeds(o = {}) {
  const it = new Item('wgarden', { ...o, name: { en: 'Garden beds', hi: 'बगीचे की क्यारियाँ', hg: 'Bageeche ki kyaariyan' } });
  const g = it.g, u = 0.15, grp = new THREE.Group(); g.add(grp);
  const rd = liveSign(0.42, 3.6); rd.position.set(0.3, 0.75, -4.1); g.add(rd);
  const COLS = [0x6fcf5a, 0xffd23f, 0x5ec8ff, 0xff8a5a];
  it.cuts = 0; it.dims = [23, 14, 20, 10];
  const clear = () => { while (grp.children.length) { const c = grp.children.pop(); c.traverse((m) => { if (m.geometry) m.geometry.dispose(); }); } };
  it.build = (W, H, a, c, cuts) => { clear(); it.dims = [W, H, a, c]; it.cuts = cuts; const X0 = -W * u / 2, Z0 = -1.35;
    const P = (x, y) => [X0 + x * u, Z0 - y * u];
    const rect = (x0, y0, x1, y1, col, op) => grp.add(flatPoly([P(x0, y0), P(x1, y0), P(x1, y1), P(x0, y1)], basic(col, op), 0.012));
    if (cuts === 0) rect(0, 0, W, H, 0x4f9a3a, 0.75);
    else { rect(0, 0, a, c, COLS[0], 0.7); rect(a, 0, W, c, COLS[1], 0.75); rect(0, c, a, H, COLS[2], 0.7); rect(a, c, W, H, COLS[3], 0.75); }
    const lm = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35, toneMapped: false });
    for (let x = 0; x <= W; x++) { const [x0, z0] = P(x, 0), [, z1] = P(x, H); const r = rod(V(x0, 0.016, z0), V(x0, 0.016, z1), 0.004, lm); grp.add(r); }
    for (let y = 0; y <= H; y++) { const [x0, z0] = P(0, y), [x1] = P(W, y); const r = rod(V(x0, 0.016, z0), V(x1, 0.016, z0), 0.004, lm); grp.add(r); }
    const path = (x0, y0, x1, y1) => { const [ax, az] = P(x0, y0), [bx, bz] = P(x1, y1); grp.add(rod(V(ax, 0.03, az), V(bx, 0.03, bz), 0.035, glow(0xf0e0b0))); };
    if (cuts >= 1) path(a, 0, a, H); if (cuts >= 2) path(0, c, W, c);
    const lab = (t, x, y, col = '#ffffff', h = 0.17) => { const s = tag(t, col, h); const [px, pz] = P(x, y); s.position.set(px, 0.3, pz); grp.add(s); };
    lab(`${W} m`, W / 2, -1.6); lab(`${H} m`, -2.2, H / 2);
    if (cuts >= 1) { lab(`${a}`, a / 2, -0.9, '#ffd23f', 0.13); lab(`${W - a}`, a + (W - a) / 2, -0.9, '#ffd23f', 0.13); }
    if (cuts >= 2) { lab(`${c}`, -1.2, c / 2, '#7ad0ff', 0.13); lab(`${H - c}`, -1.2, c + (H - c) / 2, '#7ad0ff', 0.13); }
    it.labs = { a, c, W, H, P }; };
  it.areas = () => { const [W, H, a, c] = it.dims; for (const [x, y, v] of [[a / 2, c / 2, a * c], [a + (W - a) / 2, c / 2, (W - a) * c], [a / 2, c + (H - c) / 2, a * (H - c)], [a + (W - a) / 2, c + (H - c) / 2, (W - a) * (H - c)]]) { const s = tag(String(v), '#ffffff', 0.2); const [px, pz] = it.labs.P(x, y); s.position.set(px, 0.45, pz); grp.add(s); } };
  it.say = (l, c) => rd.set(l, c);
  it.cut1 = () => { if (it.cuts >= 2) return false; const [W, H, a, c] = it.dims; it.build(W, H, a, c, it.cuts + 1); if (it.onCut) it.onCut(it.cuts); return true; };
  it.build(23, 14, 20, 10, 0); it.say(['23 × 14 = ?'], '#ffd23f');
  it.leverPath = () => [V(-0.45, 1.0, -0.3), V(-0.45, 1.0, -0.05)];
  it.at = (k) => ({ sum: V(0.3, 1.2, -4.1) }[k] || V(0, 1, -2.4));
  noHit(g); it.noGrab = true; it.noPhys = true; it.height = 0.05; it.radius = 2.5; it.base = 0; return it;
}
export function bindGardenHands(gb, lever, app, s = { cut: 1 }, done = {}) {
  gb.onCut = (n) => { if (n >= 2) done.cut && done.cut(); };
  pushKnob(lever, { path: () => gb.leverPath(), active: () => stepNow(app, s.cut) && gb.cuts < 2, keepVisible: () => app.runner.i === s.cut, press: () => gb.cut1() });
}

// ------------------------------------------------------------------ Class 9 Ch 6 Measuring Space: a field that leans
// A field in the shape of a parallelogram: base 4 m, height 2 m. The handle slides its far side sideways. The area stays
// 8 m² (same base, same height) while the perimeter grows. A triangle is cut off and moved to show the rectangle inside.
export function leanField(o = {}) {
  const it = new Item('wlean', { ...o, name: { en: 'Leaning field', hi: 'तिरछा खेत', hg: 'Tirchha khet' } });
  const g = it.g, B = 4, H = 2, O = V(-2.0, 0, -1.4);
  const P = (x, y, h = 0.015) => V(O.x + x, h, O.z - y);
  const gridT = canvasTex(1024, 512, (x) => { x.strokeStyle = 'rgba(255,255,255,0.35)'; x.lineWidth = 3; for (let i = 0; i <= 16; i++) { x.beginPath(); x.moveTo(i * 64, 0); x.lineTo(i * 64, 512); x.stroke(); } for (let j = 0; j <= 8; j++) { x.beginPath(); x.moveTo(0, j * 64); x.lineTo(1024, j * 64); x.stroke(); } });
  const grid = new THREE.Mesh(new THREE.PlaneGeometry(8, 4), new THREE.MeshBasicMaterial({ map: gridT, transparent: true, depthWrite: false, toneMapped: false })); grid.rotation.x = -Math.PI / 2; grid.position.copy(P(4, 1, 0.008)); grid.userData.noHit = true; g.add(grid);
  const body = new THREE.Mesh(new THREE.BufferGeometry(), basic(0x6fcf5a, 0.55)); body.userData.noHit = true; g.add(body);
  const piece = new THREE.Mesh(new THREE.BufferGeometry(), basic(0xffd23f, 0.75)); piece.userData.noHit = true; piece.visible = false; g.add(piece);
  const edges = [0, 1, 2, 3].map(() => { const r = rod(V(), V(1, 0, 0), 0.018, glow(0xffffff)); g.add(r); return r; });
  const hgt = rod(V(), V(1, 0, 0), 0.012, glow(0x7ad0ff)); g.add(hgt); const diag = rod(V(), V(1, 0, 0), 0.016, glow(0xff8a5a)); diag.visible = false; g.add(diag);
  const half = new THREE.Mesh(new THREE.BufferGeometry(), basic(0xff8a5a, 0.45)); half.userData.noHit = true; half.visible = false; g.add(half);
  const tB = tag('4 m', '#ffffff', 0.17), tH = tag('2 m', '#7ad0ff', 0.17); g.add(tB, tH);
  const rd = liveSign(0.4, 3.6); rd.position.set(0.3, 0.7, -4.2); g.add(rd);
  const heron = new THREE.Group(); heron.visible = false; g.add(heron);
  it.s = 0; it.moved = 0; it.maxS = 0;
  it.words = () => ['area', 'perimeter'];
  const tri = (pts) => new THREE.BufferGeometry().setFromPoints(pts);
  it.setS = (s) => { it.s = Math.max(0, Math.min(3, s)); it.maxS = Math.max(it.maxS, it.s); const s2 = it.s, a = P(0, 0), b = P(B, 0), c = P(B + s2, H), d = P(s2, H);
    body.geometry.dispose(); body.geometry = tri([a, b, c, a, c, d]); [[a, b], [b, c], [c, d], [d, a]].forEach(([p, q], i) => setRod(edges[i], p.clone().setY(0.03), q.clone().setY(0.03)));
    setRod(hgt, P(s2, H, 0.035), P(s2, 0, 0.035)); tB.position.copy(P(B / 2, -0.35, 0.25)); tH.position.copy(P(s2 + 0.25, H / 2, 0.25));
    const side = Math.hypot(s2, H), per = 2 * (B + side), [aw, pw] = it.words(); rd.set([`${aw} = 4 × 2 = 8 m²`, `${pw} = 2 × (4 + ${side.toFixed(2)}) = ${per.toFixed(1)} m`], ['#8be07a', '#ffd23f']); };
  it.relabel = () => it.setS(it.s);
  it.setMove = (k) => { it.moved = clamp01(k); const s2 = it.s; piece.visible = true; const e = ease(it.moved); piece.geometry.dispose(); piece.geometry = tri([P(0, 0, 0.02), P(s2, 0, 0.02), P(s2, H, 0.02)].map((p) => p.add(V(B * e, 0, 0)))); };
  it.showHalf = () => { const s2 = it.s; diag.visible = true; setRod(diag, P(0, 0, 0.04), P(B + s2, H, 0.04)); half.visible = true; half.geometry.dispose(); half.geometry = tri([P(0, 0, 0.022), P(B, 0, 0.022), P(B + s2, H, 0.022)]); };
  it.showHeron = () => { const k = 0.25, A = P(0.5, -0.6), Bv = A.clone().add(V(14 * k, 0, 0)); const x = (14 * 14 + 13 * 13 - 15 * 15) / (2 * 14), h = Math.sqrt(13 * 13 - x * x), Cv = A.clone().add(V(x * k, 0, -h * k));
    [body, piece, half, diag, hgt, ...edges, tB, tH, grid].forEach((m) => { m.visible = false; }); heron.visible = true;
    heron.add(new THREE.Mesh(tri([A, Bv, Cv].map((p) => p.clone().setY(0.02))), basic(0xc58bff, 0.5))); [[A, Bv, '14'], [Bv, Cv, '15'], [Cv, A, '13']].forEach(([p, q, t]) => { heron.add(rod(p.clone().setY(0.03), q.clone().setY(0.03), 0.018, glow(0xffffff))); const s = tag(`${t} m`, '#ffffff', 0.17); s.position.copy(p).lerp(q, 0.5).add(V(0, 0.3, 0)); heron.add(s); }); };
  it.say = (l, c) => rd.set(l, c);
  it.setS(0); it.maxS = 0;
  it.knobPath = () => [V(-0.45, 1.0, -0.42), V(0.45, 1.0, -0.42)];
  it.at = (k) => ({ mid: P(3, 1.2, 0.8) }[k] || P(2, 1, 1));
  noHit(g); it.noGrab = true; it.noPhys = true; it.height = 0.05; it.radius = 3; it.base = 0; return it;
}
export function bindLeanHands(lf, knob, app, s = { lean: 1 }, done = {}) {
  const sync = slideKnob(knob, { path: () => lf.knobPath(), active: () => stepNow(app, s.lean), keepVisible: () => app.runner.i <= s.lean, k: () => lf.s / 3,
    set: (k) => { lf.setS(Math.round(clamp01(k) * 3 * 10) / 10); if (lf.maxS >= 2) done.lean && done.lean(); } });
  const s0 = lf.setS; lf.setS = (s) => { s0(s); sync(); };
}

// ------------------------------------------------------------------ Class 9 Ch 7 The Mathematics of Maybe: a big spinner
// A spinner 2 m wide lies on the ground, one quarter red. Each push of the lever spins it many times (10, then 40 more, then
// 150 more) and a board keeps count. The share of red gets closer and closer to 1/4.
function mulberry(seed) { return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
export function bigSpinner(o = {}) {
  const it = new Item('wspin', { ...o, name: { en: 'Big spinner', hi: 'बड़ा स्पिनर', hg: 'Bada spinner' } });
  const g = it.g, R = 1.0, C = V(0, 0.012, -2.3);
  const disc = new THREE.Group(); disc.position.copy(C); g.add(disc);
  const SECT = [0xff3b30, 0xffd23f, 0x3fa7ff, 0x6fcf5a];
  it.redShare = 0.25;
  const build = () => { while (disc.children.length) disc.remove(disc.children[0]); const red = it.redShare * Math.PI * 2, rest = (Math.PI * 2 - red) / 3;
    const sec = (st, len, c) => { const m = new THREE.Mesh(new THREE.CircleGeometry(R, 48, st, len), basic(c)); m.rotation.x = -Math.PI / 2; disc.add(m); };
    sec(0, red, SECT[0]); for (let i = 0; i < 3; i++) sec(red + i * rest, rest, SECT[i + 1]);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(R, 0.025, 8, 64), M(0xdddddd, 0.4, 0.5)); rim.rotation.x = Math.PI / 2; rim.position.y = 0.01; disc.add(rim); };
  build();
  const arrow = new THREE.Group(); arrow.position.copy(C).setY(0.06); g.add(arrow);
  const shaft = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.03, R * 0.85), M(0x222222, 0.4)); shaft.position.z = -R * 0.38; arrow.add(shaft);
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.2, 3), M(0x222222, 0.4)); tip.rotation.x = -Math.PI / 2; tip.position.z = -R * 0.85; arrow.add(tip);
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.06, 16), M(0xcccccc, 0.3, 0.7)); arrow.add(hub);
  const rd = liveSign(0.45, 3.2); rd.position.set(2.0, 0.75, -2.4); g.add(rd);
  const bars = [0].map(() => { const b = new THREE.Mesh(new THREE.BoxGeometry(0.26, 1, 0.26), M(0xff3b30, 0.6)); b.geometry.translate(0, 0.5, 0); b.position.set(1.75, 0, -1.7); b.scale.y = 0.001; g.add(b); return b; });
  const theory = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.014, 0.014), glow(0x8be07a)); theory.position.set(1.75, 0, -1.55); g.add(theory);
  it.words = () => ['spins', 'red'];
  let rnd = mulberry(o.seed || 16);
  it.n = 0; it.red = 0; it.busy = false; let A = null;
  const say = () => { const [sw, rw] = it.words(), f = it.n ? it.red / it.n : 0; rd.set([`${sw}: ${it.n}    ${rw}: ${it.red}`, `${rw} ÷ ${sw} = ${f.toFixed(3)}`], ['#ffffff', '#ffd23f']); bars[0].scale.y = Math.max(0.001, f * 2.4); theory.position.y = it.redShare * 2.4; };
  it.relabel = say;
  it.spin = (k) => { if (it.busy) return false; let last = 0; for (let i = 0; i < k; i++) { last = rnd(); if (last < it.redShare) it.red++; } it.n += k; const TAU = Math.PI * 2, from = arrow.rotation.y, base = from - 4 * TAU, tgt = last * TAU - Math.PI / 2; A = { t: 0, from, to: base + (((tgt - base) % TAU) + TAU) % TAU }; it.busy = true; return true; };
  it.update = (dt) => { if (!A) return; A.t = Math.min(1, A.t + Math.min(dt || 0.016, 0.05) * 0.8); arrow.rotation.y = A.from + (A.to - A.from) * (1 - (1 - A.t) ** 3); if (A.t >= 1) { A = null; it.busy = false; say(); if (it.onSpin) it.onSpin(it.n); } };
  it.reset = (share, seed) => { it.redShare = share; build(); rnd = mulberry(seed); it.n = 0; it.red = 0; say(); };
  it.batches = [10, 40, 150];
  it.next = () => { const done = it.n; const k = done < 10 ? 10 - done : done < 50 ? 50 - done : 200 - done; if (k <= 0) return false; return it.spin(k); };
  it.say = (l, c) => rd.set(l, c);
  say();
  it.leverPath = () => [V(-0.45, 1.0, -0.3), V(-0.45, 1.0, -0.05)];
  it.at = (k) => ({ board: V(2.0, 1.25, -2.4) }[k] || C.clone().add(V(0, 1, 0)));
  noHit(g); it.noGrab = true; it.noPhys = true; it.height = 0.05; it.radius = 2; it.base = 0; return it;
}
export function bindSpinHands(bs, lever, app, s = { spin: 1 }, done = {}) {
  bs.onSpin = (n) => { if (n >= 200) done.all && done.all(); };
  pushKnob(lever, { path: () => bs.leverPath(), active: () => stepNow(app, s.spin) && !bs.busy && bs.n < 200, keepVisible: () => app.runner.i === s.spin, press: () => bs.next() });
}
