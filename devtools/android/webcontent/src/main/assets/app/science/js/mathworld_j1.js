// DUET Maths Lab 360, hands-on for the youngest (Class 3, Maths Mela), batch J1: counting mangoes with tally marks,
// toys that roll or slide, bundles of ten sticks, Nani's laddoos (taking away and adding with boxes of ten), a giant
// tangram, a wooden abacus that carries over, and rakhis on cards (equal groups).
// Everything is real size and made to look like the real thing: textures are drawn here (no outside images).
import * as THREE from 'three';
import { Item } from './apparatus.js';
import { canvasTex } from './mats.js';
import { clamp01, ease } from './mathlab2.js';
import { pushKnob } from './mathworld3.js';
import { liveSign } from './mathworld4.js';
import { slideKnob } from './mathworld5.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const FONT = '"Noto Sans Devanagari", "Noto Sans", system-ui, sans-serif';
const stepNow = (app, i) => { const r = app.runner; return !!(r.exp && r.i === i && r.state === 'todo'); };
const M = (c, r = 0.6, m = 0) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m });
const noHit = (o) => { o.traverse((m) => { m.userData.noHit = true; }); return o; };
const rnd = (s) => () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
const once = (f) => { let d = false; return () => { if (!d) { d = true; f(); } }; };
const tex = (w, h, f, rep) => { const t = canvasTex(w, h, f); if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]); } t.colorSpace = THREE.SRGBColorSpace; return t; };
function tag(text, col = '#ffffff', h = 0.2, bg = 'rgba(12,16,24,0.85)') {
  const n = String(text).length, w = n <= 2 ? 2 : n <= 4 ? 3 : n <= 7 ? 4 : 6, W = 128 * w;
  const paint = (x, txt, c) => { x.clearRect(0, 0, W, 128); x.fillStyle = bg; x.beginPath(); x.roundRect(4, 4, W - 8, 120, 40); x.fill(); x.fillStyle = c; x.font = `800 ${String(txt).length > 8 ? 56 : 72}px ${FONT}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(String(txt), W / 2, 68); };
  const t = canvasTex(W, 128, (x) => paint(x, text, col));
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: false, toneMapped: false })); s.scale.set(h * w, h, 1); s.renderOrder = 40; s.userData.noHit = true;
  s.setText = (txt, c = col) => { paint(t.image.getContext('2d'), txt, c); t.needsUpdate = true; };
  return s;
}
// a small "busy" animation helper: run f(k) for 0..1 over sec seconds, then done()
function animator(it) {
  let A = null; it.busy = false;
  it.play = (sec, f, done) => { A = { t: 0, sec, f, done }; it.busy = true; };
  it.stop = () => { A = null; it.busy = false; };
  it.update = (dt) => { if (!A) return; A.t = Math.min(1, A.t + Math.min(dt || 0.016, 0.05) / A.sec); A.f(A.t); if (A.t >= 1) { const d = A.done; A = null; it.busy = false; if (d) d(); } };
}

// ------------------------------------------------------------------ shared real-looking things
let T = {};
const woodTex = (base = '#b07a45', seed = 3) => T['wood' + base + seed] || (T['wood' + base + seed] = tex(256, 256, (x) => { const r = rnd(seed); x.fillStyle = base; x.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 70; i++) { const y = r() * 256; x.strokeStyle = `rgba(70,40,15,${0.08 + r() * 0.18})`; x.lineWidth = 1 + r() * 3; x.beginPath(); x.moveTo(0, y); for (let k = 0; k <= 8; k++) x.lineTo(k * 32, y + Math.sin(k * 0.9 + i) * (2 + r() * 4)); x.stroke(); } }));
const mangoTex = () => T.mango || (T.mango = tex(256, 128, (x) => { const g = x.createLinearGradient(0, 0, 256, 0); g.addColorStop(0, '#5f9a2c'); g.addColorStop(0.35, '#b9c437'); g.addColorStop(0.6, '#f2b632'); g.addColorStop(0.85, '#f08a2c'); g.addColorStop(1, '#d9532a');
  x.fillStyle = g; x.fillRect(0, 0, 256, 128); const r = rnd(7); for (let i = 0; i < 160; i++) { x.fillStyle = `rgba(255,240,200,${r() * 0.35})`; x.fillRect(r() * 256, r() * 128, 1.5, 1.5); } }));
const weaveTex = () => T.weave || (T.weave = tex(256, 128, (x) => { x.fillStyle = '#8a5a2b'; x.fillRect(0, 0, 256, 128);
  for (let i = 0; i < 16; i++) for (let j = 0; j < 8; j++) { const over = (i + j) % 2; x.fillStyle = over ? '#c9965a' : '#a8743f'; x.fillRect(i * 16 + 1, j * 16 + 1, 14, 14); x.strokeStyle = 'rgba(60,35,10,0.5)'; x.strokeRect(i * 16 + 1, j * 16 + 1, 14, 14); } }, [3, 1]));
const gamchhaTex = () => T.gam || (T.gam = tex(256, 256, (x) => { x.fillStyle = '#f4efe6'; x.fillRect(0, 0, 256, 256); x.fillStyle = 'rgba(200,30,40,0.75)';
  for (let i = 0; i < 256; i += 32) { x.fillRect(i, 0, 10, 256); x.fillRect(0, i, 256, 10); } x.fillStyle = 'rgba(30,60,160,0.5)'; for (let i = 16; i < 256; i += 32) { x.fillRect(i, 0, 3, 256); x.fillRect(0, i, 256, 3); } }));
const steelMat = () => T.steel || (T.steel = new THREE.MeshStandardMaterial({ color: 0xd6dade, roughness: 0.22, metalness: 0.85 }));

// ------------------------------------------------------------------ Class 3 Ch 1 What's in a Name?: counting mangoes with tally marks
// Twelve mangoes lie on a checked cloth in an orchard. Each push of the lever puts one mango in the basket and the child
// draws one chalk line on the slate; every fifth line crosses the four before it. Then names are counted the same way.
export function mangoTally(o = {}) {
  const it = new Item('jmango3', { ...o, name: { en: 'Mangoes, basket and slate', hi: 'आम, टोकरी और स्लेट', hg: 'Aam, tokri aur slate' } });
  const g = it.g, N = 12, r = rnd(11);
  const cloth = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.7), new THREE.MeshStandardMaterial({ map: gamchhaTex(), roughness: 0.95 })); cloth.rotation.x = -Math.PI / 2; cloth.position.set(-0.6, 0.006, -1.45); g.add(cloth);
  const mg = new THREE.SphereGeometry(0.05, 20, 14); mg.scale(1, 0.82, 0.78); const mm = new THREE.MeshStandardMaterial({ map: mangoTex(), roughness: 0.45 });
  const stalkG = new THREE.CylinderGeometry(0.003, 0.004, 0.022, 6), stalkM = M(0x4d3a1e, 0.8), leafG = new THREE.SphereGeometry(0.025, 8, 6); leafG.scale(1, 0.12, 0.38); const leafM = M(0x2f6b25, 0.6);
  const home = [], inB = [], mangoes = [];
  for (let i = 0; i < N; i++) { const row = Math.floor(i / 4), col = i % 4; home.push(V(-0.82 + col * 0.13 + (row % 2) * 0.05 + (r() - 0.5) * 0.02, 0.042 + (row === 2 ? 0.03 : 0), -1.3 - row * 0.12 + (r() - 0.5) * 0.02));
    const a = i * 2.4, rad = i < 6 ? 0.1 : 0.06; inB.push(V(0.3 + Math.cos(a) * rad, 0.05 + Math.floor(i / 6) * 0.07, -1.45 + Math.sin(a) * rad));
    const m = new THREE.Group(); const b = new THREE.Mesh(mg, mm); b.castShadow = true; m.add(b); const s = new THREE.Mesh(stalkG, stalkM); s.position.set(-0.045, 0.012, 0); s.rotation.z = 1.2; m.add(s);
    if (i % 3 === 0) { const l = new THREE.Mesh(leafG, leafM); l.position.set(-0.07, 0.016, 0.01); l.rotation.y = 0.5; m.add(l); }
    m.rotation.y = r() * 6; m.position.copy(home[i]); g.add(m); mangoes.push(m); }
  // a woven basket
  const bk = new THREE.Group(); bk.position.set(0.3, 0, -1.45); g.add(bk);
  const wall = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.15, 0.17, 40, 1, true), new THREE.MeshStandardMaterial({ map: weaveTex(), roughness: 0.9, side: THREE.DoubleSide })); wall.position.y = 0.085; bk.add(wall);
  const bot = new THREE.Mesh(new THREE.CircleGeometry(0.15, 32), new THREE.MeshStandardMaterial({ map: weaveTex(), roughness: 0.9 })); bot.rotation.x = -Math.PI / 2; bot.position.y = 0.004; bk.add(bot);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.012, 8, 40), M(0x7a4a22, 0.8)); rim.rotation.x = Math.PI / 2; rim.position.y = 0.17; bk.add(rim);
  // a slate on a small wooden easel
  const SW = 0.7, SH = 0.5; let mode = 'tally', names = [];
  const slateT = canvasTex(700, 500, () => {}); slateT.colorSpace = THREE.SRGBColorSpace;
  const chalk = (x, x0, y0, n, h = 70) => { const rr = rnd(5 + n); x.strokeStyle = 'rgba(245,245,240,0.92)'; x.lineCap = 'round'; x.lineWidth = 7;
    for (let k = 0; k < n; k++) { const grp = Math.floor(k / 5), j = k % 5, gx = x0 + grp * 110; x.beginPath();
      if (j < 4) { const xx = gx + j * 20 + (rr() - 0.5) * 3; x.moveTo(xx, y0 + (rr() - 0.5) * 4); x.lineTo(xx + (rr() - 0.5) * 4, y0 + h); } else { x.moveTo(gx - 10, y0 + h * 0.8); x.lineTo(gx + 72, y0 + h * 0.2); } x.stroke(); } };
  const paintSlate = () => { const x = slateT.image.getContext('2d'); x.fillStyle = '#5a3a1e'; x.fillRect(0, 0, 700, 500); x.fillStyle = '#2b3135'; x.fillRect(24, 24, 652, 452);
    const r2 = rnd(4); for (let i = 0; i < 400; i++) { x.fillStyle = `rgba(255,255,255,${r2() * 0.04})`; x.fillRect(24 + r2() * 650, 24 + r2() * 450, 6, 2); }
    x.fillStyle = 'rgba(245,245,240,0.92)'; x.font = `700 46px ${FONT}`;
    if (mode === 'tally') { chalk(x, 70, 45, it.n, 80); if (it.n) { x.font = `800 72px ${FONT}`; x.fillStyle = '#ffd23f'; x.fillText(String(it.n), 560, 420); } }
    else names.forEach(([nm, n], i) => { x.fillStyle = 'rgba(245,245,240,0.92)'; x.font = `700 44px ${FONT}`; x.fillText(nm, 50, 115 + i * 170); chalk(x, 60, 140 + i * 170, n, 60); x.fillStyle = '#ffd23f'; x.font = `800 52px ${FONT}`; x.fillText(String(n), 600, 195 + i * 170); });
    slateT.needsUpdate = true; };
  const slate = new THREE.Mesh(new THREE.BoxGeometry(SW, SH, 0.02), [M(0x5a3a1e), M(0x5a3a1e), M(0x5a3a1e), M(0x5a3a1e), new THREE.MeshStandardMaterial({ map: slateT, roughness: 0.85 }), M(0x5a3a1e)]);
  slate.position.set(0.95, 0.72, -1.85); slate.rotation.x = -0.18; slate.rotation.y = -0.3; g.add(slate);
  const legM = new THREE.MeshStandardMaterial({ map: woodTex('#8a5a2e'), roughness: 0.8 });
  [[-0.28, 0.12], [0.28, 0.12], [0, -0.3]].forEach(([dx, dz]) => { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.015, 1.05, 8), legM); const p = V(0.95 + dx * 0.94, 0.47, -1.85 + dz * 0.6 + dx * 0.3); l.position.copy(p); l.rotation.set(dz > 0 ? 0.17 : -0.3, 0, dx * -0.2); g.add(l); });
  const rd = liveSign(0.26, 2.4); rd.position.set(-0.15, 0.62, -2.05); g.add(rd);
  animator(it); it.n = 0;
  it.setN = (n) => { it.n = Math.max(0, Math.min(N, n)); mangoes.forEach((m, i) => m.position.copy(i < it.n ? inB[i] : home[i])); paintSlate(); };
  it.add1 = (cb) => { if (it.busy || it.n >= N) return false; const i = it.n, a = home[i].clone(), b = inB[i];
    it.play(0.55, (k) => { const e = ease(k); mangoes[i].position.lerpVectors(a, b, e); mangoes[i].position.y += Math.sin(k * Math.PI) * 0.35; },
      () => { it.n++; paintSlate(); if (it.onAdd) it.onAdd(it.n); if (cb) cb(); }); return true; };
  it.showNames = (list) => { mode = 'names'; names = list; paintSlate(); };
  it.say = (l, c) => rd.set(l, c);
  it.setN(0); it.say(['?'], '#ffffff');
  it.leverPath = () => [V(-0.45, 1.0, -0.3), V(-0.45, 1.0, -0.05)];
  it.at = (k) => ({ slate: V(0.95, 0.75, -1.8), basket: V(0.3, 0.2, -1.45) }[k] || V(0, 0.4, -1.5));
  noHit(g); it.noGrab = true; it.noPhys = true; it.height = 0.9; it.radius = 1.2; it.base = 0; return it;
}
export function bindMangoHands(mt, lever, app, s = { add: 1 }, done = {}) {
  pushKnob(lever, { path: () => mt.leverPath(), active: () => stepNow(app, s.add) && !mt.busy && mt.n < 12, keepVisible: () => app.runner.i === s.add,
    press: () => mt.add1(() => { if (mt.n >= 12 && done.all) done.all(); }) });
}

// ------------------------------------------------------------------ Class 3 Ch 2 Toy Joy: toys that roll or slide
// Five toys on a classroom table: a rubber ball, a wooden block, a tin, a birthday cap (cone) and a matchbox. A plank
// leans on books; each push of the lever sends the next toy down. Curved toys roll far; flat toys slide and stop.
export function toyRamp(o = {}) {
  const it = new Item('jtoys3', { ...o, name: { en: 'Toys and a slope', hi: 'खिलौने और ढलान', hg: 'Khilaune aur dhalaan' } });
  const g = it.g, X0 = -0.36, TOP = 0.13, LEN = 0.42, ang = Math.atan2(TOP, LEN), w_ = o.W || ((k) => k);
  const plank = new THREE.Mesh(new THREE.BoxGeometry(LEN / Math.cos(ang) + 0.02, 0.012, 0.16), new THREE.MeshStandardMaterial({ map: woodTex('#c08850', 9), roughness: 0.6 }));
  plank.position.set(X0 + LEN / 2, TOP / 2, -0.1); plank.rotation.z = -ang; g.add(plank);
  const bookC = [0x2d5aa8, 0xb8322f, 0x2f8a4a]; bookC.forEach((c, i) => { const b = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.04, 0.17), M(c, 0.7)); b.position.set(X0 - 0.02, 0.02 + i * 0.041, -0.1); b.rotation.y = (i - 1) * 0.08; g.add(b); });
  const ballT = tex(128, 64, (x) => { x.fillStyle = '#d93a2b'; x.fillRect(0, 0, 128, 64); x.fillStyle = '#f2c230'; x.fillRect(0, 26, 128, 12); x.fillStyle = '#2a5fd1'; x.fillRect(60, 0, 8, 64); });
  const tinT = tex(256, 64, (x) => { x.fillStyle = '#c9cfd6'; x.fillRect(0, 0, 256, 64); x.fillStyle = '#e04a2a'; x.fillRect(0, 12, 256, 40); x.fillStyle = '#fff'; x.font = `800 26px ${FONT}`; x.fillText('DUET  MILK', 40, 41); });
  const capT = tex(128, 128, (x) => { x.fillStyle = '#7b3fd1'; x.fillRect(0, 0, 128, 128); for (let i = 0; i < 40; i++) { x.fillStyle = ['#ffd23f', '#5ec8ff', '#ff6fa8'][i % 3]; x.beginPath(); x.arc((i * 37) % 128, (i * 53) % 128, 5, 0, 7); x.fill(); } });
  const boxT = tex(128, 64, (x) => { x.fillStyle = '#f2e6c8'; x.fillRect(0, 0, 128, 64); x.fillStyle = '#c0392b'; x.fillRect(6, 6, 116, 52); x.fillStyle = '#f2e6c8'; x.font = `800 22px ${FONT}`; x.fillText('MATCH', 30, 40); });
  const toys = [
    { k: 'ball', m: new THREE.Mesh(new THREE.SphereGeometry(0.035, 24, 16), new THREE.MeshStandardMaterial({ map: ballT, roughness: 0.4 })), r: 0.035, roll: 1, run: 0.3 },
    { k: 'block', m: new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.06), new THREE.MeshStandardMaterial({ map: woodTex('#e0b070', 21), roughness: 0.6 })), r: 0.03, roll: 0, run: 0.04 },
    { k: 'tin', m: new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.08, 28), [new THREE.MeshStandardMaterial({ map: tinT, roughness: 0.3, metalness: 0.6 }), M(0xc9cfd6, 0.25, 0.9), M(0xc9cfd6, 0.25, 0.9)]), r: 0.03, roll: 1, run: 0.28 },
    { k: 'cap', m: new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.09, 28), new THREE.MeshStandardMaterial({ map: capT, roughness: 0.5 })), r: 0.03, roll: 2, run: 0.15 },
    { k: 'box', m: new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.025, 0.05), new THREE.MeshStandardMaterial({ map: boxT, roughness: 0.6 })), r: 0.0125, roll: 0, run: 0.06 },
  ];
  toys.forEach((t, i) => { if (t.k === 'tin') t.m.rotation.x = Math.PI / 2; if (t.k === 'cap') t.m.rotation.z = Math.PI / 2; t.m.castShadow = true; t.home = V(-0.38 + i * 0.07, 0, 0.2); t.shelf = V(-0.38 + i * 0.075, 0, 0.2); t.m.position.copy(t.home).setY(t.k === 'tin' || t.k === 'cap' ? 0.03 : t.r); g.add(t.m); });
  const trays = [['rolls', -0.1, 0x2f8a4a], ['slides', 0.17, 0xb8322f]].map(([w, x0, c]) => { const tr = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.008, 0.1), M(c, 0.7)); tr.position.set(x0 + 0.1, 0.004, 0.17); g.add(tr); const t = tag(w_(w), '#ffffff', 0.026); t.position.set(x0 + 0.1, 0.045, 0.235); g.add(t); t.w = w; return t; });
  const rd = liveSign(0.075, 3.4); rd.position.set(0.05, 0.17, -0.26); g.add(rd);
  animator(it); it.sent = 0;
  const bottom = V(X0 + LEN + 0.02, 0, -0.1);
  it.send = (cb) => { if (it.busy || it.sent >= toys.length) return false; const t = toys[it.sent], start = V(X0 + 0.02, TOP + t.r + 0.01, -0.1), p0 = t.m.position.clone(), q0 = t.m.rotation.clone();
    const end = bottom.clone().add(V(t.run, 0, t.roll === 2 ? 0.12 : 0)); const tray = t.roll ? V(-0.06 + it.sent * 0.035, 0, 0.17) : V(0.22 + it.sent * 0.025, 0, 0.17);
    it.play(3.2, (k) => { const y0 = t.k === 'tin' || t.k === 'cap' ? 0.03 : t.r;
      if (k < 0.2) { t.m.position.lerpVectors(p0, start, ease(k / 0.2)); t.m.position.y += Math.sin(k / 0.2 * Math.PI) * 0.06; }
      else if (k < 0.65) { const s = (k - 0.2) / 0.45, d = t.roll ? s * s : Math.min(1, s * 1.4) ** 2; const onRamp = Math.min(1, d * 1.5);
        const pr = start.clone().lerp(V(X0 + LEN, y0, -0.1), onRamp); const flat = Math.max(0, d * 1.5 - 1) / 0.5; pr.add(V((end.x - X0 - LEN) * flat, 0, (end.z + 0.1) * flat * flat));
        t.m.position.copy(pr); if (t.roll === 1) { if (t.k === 'ball') t.m.rotation.z = q0.z - d * 9; else t.m.rotation.y = q0.y + d * 9; } if (t.roll === 2) t.m.rotation.y = d * 2.5; }
      else { const s = ease((k - 0.65) / 0.35); t.m.position.lerpVectors(end.clone().setY(y0), tray.clone().setY(y0), s); t.m.position.y += Math.sin(s * Math.PI) * 0.08; } },
    () => { it.sent++; if (it.sent >= 5) rd.set([`3 ${w_('roll')} · 2 ${w_('slide')}`], '#ffd23f'); if (it.onSend) it.onSend(it.sent); if (cb) cb(); }); return true; };
  it.stack = () => { const pos = [V(0.27, 0, -0.14)]; let y = 0; ['block', 'box', 'tin'].forEach((k) => { const t = toys.find((x) => x.k === k); const h = k === 'block' ? 0.06 : k === 'box' ? 0.025 : 0.08; if (k === 'tin') t.m.rotation.set(0, 0, 0); t.m.position.set(pos[0].x, y + h / 2, pos[0].z); y += h; }); };
  it.faces = () => { const f = w_('flat'), cu = w_('curved'); const lab = [['ball', `0 ${f} · 1 ${cu}`], ['block', `6 ${f}`], ['tin', `2 ${f} · 1 ${cu}`], ['cap', `1 ${f} · 1 ${cu}`], ['box', `6 ${f}`]];
    lab.forEach(([k, s], i) => { const t = toys.find((x) => x.k === k); const tg = tag(s, '#ffd23f', 0.022); tg.position.copy(t.m.position).add(V(0, 0.07 + (i % 2) * 0.03, 0)); g.add(tg); }); };
  it.say = (l, c) => rd.set(l, c); it.say(['?'], '#ffffff');
  const W = (x, y, z) => g.localToWorld(V(x, y, z));
  it.leverPath = () => [W(-0.3, 0.1, 0.24), W(-0.3, 0.1, 0.32)];
  noHit(g); it.noGrab = true; it.noPhys = true; it.height = 0.1; it.radius = 0.45; it.base = 0; return it;
}
export function bindToyHands(tr, lever, app, s = { send: 1 }, done = {}) {
  pushKnob(lever, { path: () => tr.leverPath(), active: () => stepNow(app, s.send) && !tr.busy && tr.sent < 5, keepVisible: () => app.runner.i === s.send,
    press: () => tr.send(() => { if (tr.sent >= 5 && done.all) done.all(); }) });
}

// ------------------------------------------------------------------ Class 3 Ch 3 Double Century: bundles of ten sticks
// Loose ice-cream sticks lie on the table. Each push of the lever ties ten loose sticks with a rubber band. Ten bundles
// make a big bundle of a hundred; two big bundles are 200.
export function stickBundles(o = {}) {
  const it = new Item('jsticks3', { ...o, name: { en: 'Ice-cream sticks', hi: 'आइसक्रीम की डंडियाँ', hg: 'Ice-cream ki dandiyan' } });
  const g = it.g, MAX = 200, r = rnd(5);
  const stickG = new THREE.BoxGeometry(0.1, 0.0025, 0.01); const im = new THREE.InstancedMesh(stickG, new THREE.MeshStandardMaterial({ map: woodTex('#e3c18a', 31), roughness: 0.7 }), MAX); im.frustumCulled = false; im.castShadow = true; g.add(im);
  const bandM = M(0xd8352a, 0.5); const bands = []; for (let i = 0; i < 22; i++) { const b = new THREE.Mesh(new THREE.TorusGeometry(0.012, 0.0025, 6, 16), bandM); b.rotation.y = Math.PI / 2; b.visible = false; g.add(b); bands.push(b); }
  const loose = []; for (let i = 0; i < MAX; i++) loose.push({ p: V(-0.33 + r() * 0.3, 0.002 + r() * 0.004, -0.15 + r() * 0.28), a: r() * 3.1 });
  const rd = liveSign(0.075, 3.4); rd.position.set(0, 0.17, -0.26); g.add(rd);
  animator(it); it.total = 37; it.tied = 0; it.big = 0; let tieK = 1;
  const mtx = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = V(1, 1, 1), up = V(0, 1, 0);
  const LAY = [[0, 0], [0, 1], [0, 2], [0, 3], [1, 0.5], [1, 1.5], [1, 2.5], [2, 1], [2, 2], [3, 1.5]];
  const bundleAt = (b) => { if (b < it.big * 10) { const h = Math.floor(b / 10), [ly, ix] = LAY[b % 10]; return V(-0.02 + h * 0.2 + (ix - 1.5) * 0.024, 0.006 + ly * 0.02, -0.02); } const k = b - it.big * 10; return V(0.03 + (k % 5) * 0.05, 0.006, -0.19 + Math.floor(k / 5) * 0.115); };
  const draw = () => { let n = 0; const nb = it.tied;
    for (let b = 0; b < nb; b++) { const c = bundleAt(b), last = b === nb - 1 && tieK < 1;
      for (let s = 0; s < 10 && n < MAX; s++, n++) { const L = loose[n], tp = V(c.x + ((s % 3) - 1) * 0.004, c.y + Math.floor(s / 3) * 0.003, c.z + ((s % 4) - 1.5) * 0.003); const p = last ? L.p.clone().lerp(tp, ease(tieK)) : tp;
        q.setFromAxisAngle(up, last ? L.a * (1 - ease(tieK)) + Math.PI / 2 * ease(tieK) : Math.PI / 2); mtx.compose(p, q, sc); im.setMatrixAt(n, mtx); }
      bands[b] && (bands[b].visible = !last || tieK > 0.9, bands[b].position.set(c.x, c.y + 0.006, c.z), bands[b].scale.setScalar(b < it.big * 10 ? 1 : 1)); }
    for (let b = nb; b < bands.length; b++) bands[b].visible = false;
    for (; n < it.total; n++) { const L = loose[n]; q.setFromAxisAngle(up, L.a); mtx.compose(L.p, q, sc); im.setMatrixAt(n, mtx); }
    im.count = it.total; im.instanceMatrix.needsUpdate = true;
    const t = it.tied, l = it.total - t * 10; rd.set([`${t} × 10 + ${l} = ${it.total}`], ['#ffd23f']); };
  it.setTotal = (n) => { it.total = n; draw(); };
  it.tie = (cb) => { if (it.busy || it.total - it.tied * 10 < 10) return false; it.tied++; tieK = 0; it.play(0.8, (k) => { tieK = k; draw(); }, () => { tieK = 1; draw(); if (it.onTie) it.onTie(it.tied); if (cb) cb(); }); return true; };
  it.makeHundreds = () => { it.big = Math.floor(it.tied / 10); draw(); };
  it.tieAll = () => { it.tied = Math.floor(it.total / 10); tieK = 1; draw(); };
  it.say = (l, c) => rd.set(l, c);
  draw();
  const W = (x, y, z) => g.localToWorld(V(x, y, z));
  it.leverPath = () => [W(-0.3, 0.1, 0.24), W(-0.3, 0.1, 0.32)];
  noHit(g); it.noGrab = true; it.noPhys = true; it.height = 0.05; it.radius = 0.45; it.base = 0; return it;
}
export function bindStickBundleHands(sb, lever, app, s = { tie: 1 }, done = {}) {
  pushKnob(lever, { path: () => sb.leverPath(), active: () => stepNow(app, s.tie) && !sb.busy && sb.total - sb.tied * 10 >= 10, keepVisible: () => app.runner.i === s.tie,
    press: () => sb.tie(() => { if (sb.total - sb.tied * 10 < 10 && done.all) done.all(); }) });
}

// ------------------------------------------------------------------ Class 3 Ch 4 Vacation with My Nani Maa: Nani's laddoos
// Nani's laddoos sit in steel boxes of ten, with some loose. To give away 17 when only 2 are loose, the child opens a box
// with the lever (one ten becomes ten ones). Then Mami brings 28 more, and ten loose ones are packed into a new box.
export function laddooBoxes(o = {}) {
  const it = new Item('jladdoo3', { ...o, name: { en: 'Laddoos in boxes of ten', hi: 'दस-दस लड्डुओं के डिब्बे', hg: 'Das-das laddoo ke dibbe' } });
  const g = it.g, MAX = 70, w_ = o.W || ((k) => k);
  const lT = tex(128, 128, (x) => { x.fillStyle = '#f0a43a'; x.fillRect(0, 0, 128, 128); const r = rnd(9); for (let i = 0; i < 500; i++) { const c = r(); x.fillStyle = c < 0.5 ? 'rgba(255,200,90,0.9)' : c < 0.85 ? 'rgba(200,110,20,0.8)' : 'rgba(255,240,200,0.9)'; x.beginPath(); x.arc(r() * 128, r() * 128, 2 + r() * 3, 0, 7); x.fill(); } });
  const im = new THREE.InstancedMesh(new THREE.SphereGeometry(0.016, 14, 10), new THREE.MeshStandardMaterial({ map: lT, roughness: 0.8, bumpMap: lT, bumpScale: 0.6 }), MAX); im.frustumCulled = false; im.castShadow = true; g.add(im);
  const boxG = new THREE.BoxGeometry(0.19, 0.012, 0.085); const boxes = []; for (let i = 0; i < 7; i++) { const b = new THREE.Mesh(boxG, steelMat()); b.visible = false; g.add(b); boxes.push(b); }
  const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.075, 0.01, 40), steelMat()); plate.position.set(0.2, 0.005, -0.08); g.add(plate);
  const gone = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.065, 0.01, 32), M(0x2f6b9a, 0.4, 0.3)); gone.position.set(0.22, 0.005, 0.13); g.add(gone);
  const gT = tag(w_('eaten'), '#ff8a5a', 0.026); gT.position.set(0.22, 0.05, 0.21); g.add(gT);
  const rd = liveSign(0.075, 3.6); rd.position.set(0, 0.17, -0.26); g.add(rd);
  animator(it); it.tens = 5; it.ones = 2; it.eaten = 0; it.open = -1; let openK = 0;
  const mtx = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = V(1, 1, 1);
  const boxPos = (b) => V(-0.3 + (b % 2) * 0.21, 0.006, -0.17 + Math.floor(b / 2) * 0.1);
  const loosePos = (i) => { const a = i * 2.39996, rad = 0.013 * Math.sqrt(i + 0.5) * 1.9; return V(0.2 + Math.cos(a) * rad, 0.026 + (i > 24 ? 0.02 : 0), -0.08 + Math.sin(a) * rad); };
  const eatPos = (i) => { const a = i * 2.39996, rad = 0.012 * Math.sqrt(i + 0.5) * 1.9; return V(0.22 + Math.cos(a) * rad, 0.026, 0.13 + Math.sin(a) * rad); };
  const draw = () => { let n = 0;
    boxes.forEach((b, i) => { b.visible = i < it.tens + (it.open >= 0 && openK < 1 ? 1 : 0); b.position.copy(boxPos(i)); });
    for (let b = 0; b < it.tens; b++) for (let s = 0; s < 10; s++, n++) { const p = boxPos(b).add(V(-0.072 + (s % 5) * 0.036, 0.022, -0.018 + Math.floor(s / 5) * 0.036)); mtx.compose(p, q, sc); im.setMatrixAt(n, mtx); }
    if (it.open >= 0 && openK < 1) for (let s = 0; s < 10; s++, n++) { const a = boxPos(it.open).add(V(-0.072 + (s % 5) * 0.036, 0.022, -0.018 + Math.floor(s / 5) * 0.036)), b = loosePos(it.ones - 10 + s); const p = a.lerp(b, ease(openK)); p.y += Math.sin(openK * Math.PI) * 0.08; mtx.compose(p, q, sc); im.setMatrixAt(n, mtx); }
    for (let i = 0; i < it.ones - (it.open >= 0 && openK < 1 ? 10 : 0); i++, n++) { mtx.compose(loosePos(i), q, sc); im.setMatrixAt(n, mtx); }
    for (let i = 0; i < it.eaten; i++, n++) { mtx.compose(eatPos(i), q, sc); im.setMatrixAt(n, mtx); }
    im.count = n; im.instanceMatrix.needsUpdate = true; };
  it.show = (lines, cols) => rd.set(lines, cols);
  it.count = () => it.tens * 10 + it.ones;
  it.label = () => rd.set([`${it.tens} ${w_('tens')} + ${it.ones} ${w_('ones')} = ${it.count()}`], ['#ffd23f']);
  it.openBox = (cb) => { if (it.busy || it.tens < 1) return false; it.tens--; it.ones += 10; it.open = it.tens; openK = 0; it.play(1.0, (k) => { openK = k; draw(); }, () => { openK = 1; it.open = -1; draw(); it.label(); if (cb) cb(); }); return true; };
  it.eat = (n) => { it.ones -= n; it.eaten += n; draw(); };
  it.eatBox = () => { it.tens--; it.eaten += 10; draw(); };
  it.setAll = (t, o2) => { it.tens = t; it.ones = o2; draw(); };
  it.pack = () => { if (it.ones >= 10) { it.ones -= 10; it.tens++; draw(); } };
  draw(); it.label();
  const W = (x, y, z) => g.localToWorld(V(x, y, z));
  it.leverPath = () => [W(-0.3, 0.1, 0.24), W(-0.3, 0.1, 0.32)];
  noHit(g); it.noGrab = true; it.noPhys = true; it.height = 0.05; it.radius = 0.45; it.base = 0; return it;
}
export function bindLaddooHands(lb, lever, app, s = { open: 1 }, done = {}) {
  pushKnob(lever, { path: () => lb.leverPath(), active: () => stepNow(app, s.open) && !lb.busy && lb.ones < 10, keepVisible: () => app.runner.i === s.open,
    press: () => lb.openBox(() => { if (done.open) done.open(); }) });
}

// ------------------------------------------------------------------ Class 3 Ch 5 Fun with Shapes: a giant tangram
// Seven big wooden tangram pieces lie scattered on the classroom floor. Slide the handle and they glide together into
// one square; then they become a house. Every piece has only straight sides.
export function bigTangram(o = {}) {
  const it = new Item('jtangram3', { ...o, name: { en: 'Giant tangram', hi: 'बड़ा टैनग्राम', hg: 'Bada tangram' } });
  const g = it.g, S = 1.2, C = V(0, 0, -1.9), u = S / 4, w_ = o.W || ((k) => k);
  // pieces in the square (unit = S/4), as polygons around their own centre
  const P = [
    { c: 0xd93a2b, pts: [[0, 0], [4, 0], [2, 2]] }, { c: 0x2a6fd1, pts: [[0, 0], [2, 2], [0, 4]] },
    { c: 0xf2b632, pts: [[4, 0], [4, 2], [3, 1]] }, { c: 0x2f9a4a, pts: [[3, 1], [4, 2], [3, 3], [2, 2]] },
    { c: 0x8a4fd1, pts: [[2, 2], [3, 3], [1, 3]] }, { c: 0xf07a2a, pts: [[0, 4], [1, 3], [3, 3], [2, 4]] }, { c: 0x1fa3a3, pts: [[2, 4], [4, 2], [4, 4]] }];
  const house = [[-0.1, -2.2, 0], [0.1, -1.6, -Math.PI / 2], [2.2, -0.2, 0], [1.4, -1.1, 0], [1.9, 0.6, 0], [0.4, 0.8, 0], [-1.2, 0.5, 0]];
  const scatter = [[-1.6, -0.9, 0.7], [1.5, -1.2, -0.4], [-1.3, 0.9, 2.1], [1.8, 0.8, 1.2], [0.2, 1.3, -1.0], [-2.2, 0.1, 0.4], [2.3, -0.2, 2.6]];
  const pieces = P.map((p, i) => { const cx = p.pts.reduce((s, q) => s + q[0], 0) / p.pts.length, cz = p.pts.reduce((s, q) => s + q[1], 0) / p.pts.length;
    const sh = new THREE.Shape(p.pts.map(([x, z]) => new THREE.Vector2((x - cx) * u, -(z - cz) * u)));
    const geo = new THREE.ExtrudeGeometry(sh, { depth: 0.03, bevelEnabled: true, bevelSize: 0.008, bevelThickness: 0.006, bevelSegments: 2 }); geo.rotateX(-Math.PI / 2);
    const mat = new THREE.MeshStandardMaterial({ color: p.c, map: woodTex('#ffffff', 40 + i), roughness: 0.55 });
    const m = new THREE.Mesh(geo, mat); m.castShadow = true; m.receiveShadow = true; g.add(m);
    const sq = V(C.x + (cx - 2) * u, 0.003, C.z + (cz - 2) * u); const sc = V(C.x + scatter[i][0] * 0.45, 0.003, C.z + scatter[i][1] * 0.45); const hs = V(C.x + house[i][0] * u * 0.8, 0.003, C.z + house[i][1] * u * 0.8);
    return { m, sq, sc, scR: scatter[i][2], hs, hR: house[i][2], n: p.pts.length }; });
  const rd = liveSign(0.3, 2.6); rd.position.set(0, 0.95, -2.9); g.add(rd);
  it.k = 0; it.h = 0;
  const place = () => { const k = ease(clamp01(it.k)), h = ease(clamp01(it.h)); pieces.forEach((p) => { const a = p.sc.clone().lerp(p.sq, k), r1 = p.scR * (1 - k);
    p.m.position.copy(a.lerp(p.hs, h)); p.m.position.y = 0.003 + Math.sin(k * Math.PI) * 0.15 * (1 - h) + Math.sin(h * Math.PI) * 0.15; p.m.rotation.y = r1 * (1 - h) + p.hR * h; }); };
  it.setK = (k) => { it.k = clamp01(k); place(); if (it.onK) it.onK(it.k); };
  it.setH = (h) => { it.h = h; place(); };
  it.glowPieces = (ids, on = true) => { pieces.forEach((p, i) => { p.m.material.emissive.setHex(on && ids.includes(i) ? 0x664400 : 0x000000); p.m.position.y = on && ids.includes(i) ? 0.06 : 0.003; }); };
  it.corners = () => { pieces.forEach((p) => { const t = tag(String(p.n), '#ffd23f', 0.13); t.position.copy(p.m.position).add(V(0, 0.18, 0)); g.add(t); }); };
  it.say = (l, c) => rd.set(l, c);
  it.setK(0); it.say([`7 ${w_('pieces')}`], '#ffffff');
  it.knobPath = () => [V(-0.45, 1.0, -0.42), V(0.45, 1.0, -0.42)];
  it.at = () => C.clone().add(V(0, 0.8, 0));
  noHit(g); it.noGrab = true; it.noPhys = true; it.height = 0.04; it.radius = 1.6; it.base = 0; return it;
}
export function bindTangramHands(tg, knob, app, s = { slide: 1 }, done = {}) {
  const sync = slideKnob(knob, { path: () => tg.knobPath(), active: () => stepNow(app, s.slide), keepVisible: () => app.runner.i <= s.slide, k: () => tg.k,
    set: (k) => { tg.setK(k > 0.97 ? 1 : k); if (tg.k >= 1 && done.done) done.done(); } });
  const s0 = tg.setK; tg.setK = (k) => { s0(k); sync(); };
}

// ------------------------------------------------------------------ Class 3 Ch 6 House of Hundreds I: a wooden abacus
// A spike abacus with three rods (hundreds, tens, ones) shows 97. Each push of the lever adds one bead to the ones rod.
// Ten beads on a rod go back, and one bead goes on the next rod: 97, 98, 99, 100.
export function spikeAbacus(o = {}) {
  const it = new Item('jabacus3', { ...o, name: { en: 'Wooden abacus', hi: 'लकड़ी का गिनतारा', hg: 'Lakdi ka abacus' } });
  const g = it.g, X = [-0.14, 0, 0.14], R = 0.0135, H0 = 0.035, COL = [0xd93a2b, 0x2a6fd1, 0x2f9a4a];
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.03, 0.12), new THREE.MeshStandardMaterial({ map: woodTex('#9a6534', 13), roughness: 0.6 })); base.position.set(0, 0.015, -0.05); g.add(base);
  X.forEach((x, i) => { const rodm = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.3, 10), M(0xb8b8b8, 0.3, 0.8)); rodm.position.set(x, 0.18, -0.05); g.add(rodm);
    const t = tag(['H', 'T', 'O'][i], '#ffffff', 0.035); t.position.set(x, 0.02, 0.03); g.add(t); });
  const beadG = new THREE.TorusGeometry(R, 0.0095, 12, 24); beadG.rotateX(Math.PI / 2);
  const beads = [[], [], []]; for (let r = 0; r < 3; r++) for (let b = 0; b < 10; b++) { const m = new THREE.Mesh(beadG, new THREE.MeshStandardMaterial({ color: COL[r], roughness: 0.35 })); m.castShadow = true; m.visible = false; g.add(m); beads[r].push(m); }
  const vals = [0, 9, 7]; let fly = null;
  const rd = liveSign(0.06, 3.6); rd.position.set(0.33, 0.12, -0.08); g.add(rd);
  const nums = X.map((x) => { const t = tag('0', '#ffd23f', 0.05); t.position.set(x, 0.36, -0.02); g.add(t); return t; });
  const draw = () => { for (let r = 0; r < 3; r++) { beads[r].forEach((m, b) => { m.visible = b < vals[r]; m.position.set(X[r], H0 + b * 0.022, -0.05); }); nums[r].setText(String(vals[r])); }
    if (fly) { const { r, k, from } = fly; for (let b = 0; b < 10; b++) { const m = beads[r][b]; m.visible = true; const up = V(X[r], H0 + b * 0.022 + k * 0.32, -0.05); m.position.copy(up); m.scale.setScalar(1 - k * 0.6); if (k >= 1) m.visible = false; } void from; }
    else beads.flat().forEach((m) => m.scale.setScalar(1)); };
  it.value = () => vals[0] * 100 + vals[1] * 10 + vals[2];
  it.label = () => { const v = it.value(); rd.set([`${vals[0]} H  ${vals[1]} T  ${vals[2]} O = ${v}`], ['#ffd23f']); };
  animator(it);
  // add one bead to ones; carry when a rod reaches ten
  it.add1 = (cb) => { if (it.busy) return false; vals[2]++; draw(); it.label();
    const carry = (r) => { if (vals[r] < 10 || r === 0) { it.label(); if (cb) cb(); return; } fly = { r, k: 0 };
      it.play(1.0, (k) => { fly.k = k; draw(); }, () => { fly = null; vals[r] = 0; vals[r - 1]++; draw(); carry(r - 1); }); };
    carry(2); return true; };
  it.set = (h, t, o2) => { it.stop(); fly = null; vals[0] = h; vals[1] = t; vals[2] = o2; draw(); it.label(); };
  it.say = (l, c) => rd.set(l, c);
  draw(); it.label();
  const W = (x, y, z) => g.localToWorld(V(x, y, z));
  it.leverPath = () => [W(-0.3, 0.1, 0.24), W(-0.3, 0.1, 0.32)];
  noHit(g); it.noGrab = true; it.noPhys = true; it.height = 0.3; it.radius = 0.3; it.base = 0; return it;
}
export function bindAbacusHands(ab, lever, app, s = { add: 1 }, done = {}) {
  pushKnob(lever, { path: () => ab.leverPath(), active: () => stepNow(app, s.add) && !ab.busy && ab.value() < 100, keepVisible: () => app.runner.i === s.add,
    press: () => ab.add1(() => { if (ab.value() >= 100 && done.all) done.all(); }) });
}

// ------------------------------------------------------------------ Class 3 Ch 7 Raksha Bandhan: rakhis on cards
// Each card at the rakhi stall holds 4 rakhis. Each push of the lever puts one more card on the table: 4, 8, 12, 16, 20.
// Then the 20 rakhis stand in 5 rows of 4, and turned around they are 4 rows of 5.
export function rakhiCards(o = {}) {
  const it = new Item('jrakhi3', { ...o, name: { en: 'Rakhis on cards', hi: 'कार्ड पर राखियाँ', hg: 'Card par rakhiyan' } });
  const g = it.g, MAXC = 5, w_ = o.W || ((k) => k);
  const rT = (c1, c2) => tex(128, 128, (x) => { x.translate(64, 64); for (let k = 0; k < 12; k++) { x.rotate(Math.PI / 6); x.fillStyle = k % 2 ? c1 : c2; x.beginPath(); x.ellipse(0, -36, 12, 26, 0, 0, 7); x.fill(); }
    x.fillStyle = '#ffd23f'; x.beginPath(); x.arc(0, 0, 22, 0, 7); x.fill(); x.fillStyle = '#fff6c8'; for (let k = 0; k < 8; k++) { x.beginPath(); x.arc(Math.cos(k * 0.785) * 14, Math.sin(k * 0.785) * 14, 3, 0, 7); x.fill(); } });
  const mats = [rT('#e8364f', '#ff9f1c'), rT('#2a6fd1', '#5ec8ff'), rT('#2f9a4a', '#a6e05a'), rT('#8a4fd1', '#ff6fa8')].map((t) => new THREE.MeshStandardMaterial({ map: t, roughness: 0.5, transparent: true, alphaTest: 0.1 }));
  const flowerG = new THREE.CircleGeometry(0.022, 24); flowerG.rotateX(-Math.PI / 2);
  const threadM = M(0xc8202a, 0.7); const cardM = new THREE.MeshStandardMaterial({ color: 0xfbf6ea, roughness: 0.8 });
  const cards = []; for (let c = 0; c < MAXC; c++) { const cg = new THREE.Group(); const card = new THREE.Mesh(new THREE.BoxGeometry(0.21, 0.004, 0.065), cardM); card.position.y = 0.002; cg.add(card);
    for (let k = 0; k < 4; k++) { const f = new THREE.Mesh(flowerG, mats[k]); f.position.set(-0.075 + k * 0.05, 0.006, 0); cg.add(f); const th = new THREE.Mesh(new THREE.TorusGeometry(0.018, 0.0012, 4, 20, Math.PI), threadM); th.rotation.x = Math.PI / 2; th.position.set(-0.075 + k * 0.05, 0.0045, 0.012); cg.add(th); }
    cg.visible = false; g.add(cg); cards.push(cg); }
  const rd = liveSign(0.075, 3.4); rd.position.set(0, 0.17, -0.26); g.add(rd);
  animator(it); it.n = 0; it.turned = 0;
  const cardPos = (c) => V(-0.05, 0, -0.17 + c * 0.075);
  const draw = () => { const tk = ease(it.turned); cards.forEach((cg, c) => { cg.visible = c < it.n; cg.position.copy(cardPos(c)); cg.rotation.y = -tk * Math.PI / 2; if (tk > 0) cg.position.set(-0.17 + c * 0.075 * tk + (1 - tk) * 0.12, 0, -0.17 + c * 0.075 * (1 - tk) + tk * 0.0); }); };
  it.add1 = (cb) => { if (it.busy || it.n >= MAXC) return false; const c = it.n; it.n++; draw(); const cg = cards[c], to = cardPos(c);
    it.play(0.6, (k) => { cg.position.copy(to).add(V(0.3 * (1 - ease(k)), Math.sin(k * Math.PI) * 0.08, 0)); }, () => { draw(); rd.set([Array.from({ length: it.n }, (_, i) => 4 * (i + 1)).join(', ')], ['#ffd23f']); if (cb) cb(); }); return true; };
  it.setTurn = (k) => { it.turned = k; draw(); };
  it.say = (l, c) => rd.set(l, c);
  draw(); it.say([w_('4 rakhis on each card')], '#ffffff');
  const W = (x, y, z) => g.localToWorld(V(x, y, z));
  it.leverPath = () => [W(-0.3, 0.1, 0.24), W(-0.3, 0.1, 0.32)];
  noHit(g); it.noGrab = true; it.noPhys = true; it.height = 0.05; it.radius = 0.45; it.base = 0; return it;
}
export function bindRakhiHands(rc, lever, app, s = { add: 1 }, done = {}) {
  pushKnob(lever, { path: () => rc.leverPath(), active: () => stepNow(app, s.add) && !rc.busy && rc.n < 5, keepVisible: () => app.runner.i === s.add,
    press: () => rc.add1(() => { if (rc.n >= 5 && done.all) done.all(); }) });
}
export { once, tag, animator, woodTex, steelMat, M, rnd, tex, noHit, stepNow, V, FONT, mangoTex, weaveTex, gamchhaTex };
