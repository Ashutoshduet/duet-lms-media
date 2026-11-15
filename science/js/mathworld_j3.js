// DUET Maths Lab 360, hands-on for Class 4 (Maths Mela), batch J3: building a cube frame from sticks and clay, a toy
// house seen from the front, the side and the top, marbles in pairs (odd and even), wooden blocks up to a thousand, a
// metre of ribbon cut into quarters, a measuring tape across the classroom, and buying dustbins for the village.
import * as THREE from 'three';
import { Item } from './apparatus.js';
import { canvasTex } from './mats.js';
import { clamp01, ease } from './mathlab2.js';
import { pushKnob } from './mathworld3.js';
import { liveSign } from './mathworld4.js';
import { slideKnob } from './mathworld5.js';
import { tag, animator, woodTex, M, rnd, tex, noHit, stepNow, V, FONT } from './mathworld_j1.js';

const TW = (g) => (x, y, z) => g.localToWorld(V(x, y, z));
const tableLever = (g) => [TW(g)(-0.3, 0.1, 0.24), TW(g)(-0.3, 0.1, 0.32)];
const tableSlide = (g) => [TW(g)(-0.3, 0.1, 0.24), TW(g)(0.3, 0.1, 0.24)];
const floorKnob = () => [V(-0.45, 1.0, -0.42), V(0.45, 1.0, -0.42)];
const done1 = (it, o) => { noHit(it.g); it.noGrab = true; it.noPhys = true; it.base = 0; Object.assign(it, o); return it; };
const stick = (a, b, r, mat) => { const d = b.clone().sub(a), L = d.length(); const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, L, 8), mat); m.position.copy(a).add(b).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize()); m.castShadow = true; return m; };

// ------------------------------------------------------------------ Class 4 Ch 1 Shapes Around Us: a cube frame of sticks and clay
export function cubeFrame(o = {}) {
  const it = new Item('jframe4', { ...o, name: { en: 'Sticks and clay balls', hi: 'डंडियाँ और मिट्टी की गोलियाँ', hg: 'Dandiyan aur mitti ki goliyan' } });
  const g = it.g, w_ = o.W || ((k) => k), C = V(0, 0.01, -0.06);
  const stickM = new THREE.MeshStandardMaterial({ map: woodTex('#d9b98a', 41), roughness: 0.6 }), clayM = new THREE.MeshStandardMaterial({ color: 0x3fa65a, roughness: 0.7 });
  let parts = []; it.n = 0; it.shape = 'cube'; it.sx = 1;
  const rd = liveSign(0.07, 3.6); rd.position.set(0, 0.24, -0.3); g.add(rd);
  const corners = () => { const s = 0.15, a = s * it.sx, b = s, c = s; if (it.shape === 'pyr') return [V(-0.08, 0, -0.08), V(0.08, 0, -0.08), V(0.08, 0, 0.08), V(-0.08, 0, 0.08), V(0, 0.15, 0)].map((p) => p.add(C));
    return [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1], [0, 1, 0], [1, 1, 0], [1, 1, 1], [0, 1, 1]].map(([x, y, z]) => V(C.x + (x - 0.5) * a, C.y + y * b, C.z + (z - 0.5) * c)); };
  const EC = [[0, 1], [1, 2], [2, 3], [3, 0], [0, 4], [1, 5], [2, 6], [3, 7], [4, 5], [5, 6], [6, 7], [7, 4]], EP = [[0, 1], [1, 2], [2, 3], [3, 0], [0, 4], [1, 4], [2, 4], [3, 4]];
  const draw = () => { parts.forEach((p) => g.remove(p)); parts = []; const P = corners(), E = it.shape === 'pyr' ? EP : EC, n = Math.min(it.n, E.length), used = new Set();
    for (let i = 0; i < n; i++) { const [a, b] = E[i]; const m = stick(P[a], P[b], 0.004, stickM); g.add(m); parts.push(m); used.add(a); used.add(b); }
    used.forEach((k) => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.011, 14, 10), clayM); m.position.copy(P[k]); m.castShadow = true; g.add(m); parts.push(m); });
    rd.set([`${w_('edges')}: ${n}   ${w_('corners')}: ${used.size}`], n >= E.length ? '#8be07a' : '#ffd23f'); };
  it.setN = (n) => { it.n = n; draw(); if (it.onN) it.onN(n); };
  it.setShape = (sh, sx = 1) => { it.shape = sh; it.sx = sx; it.n = sh === 'pyr' ? 8 : 12; draw(); };
  it.faces = (txt) => rd.set([txt], '#8be07a');
  it.setN(0);
  it.knobPath = () => tableSlide(g);
  return done1(it, { height: 0.2, radius: 0.3 });
}
export function bindFrameHands(cf, knob, app, s = { build: 1 }, done = {}) {
  const sync = slideKnob(knob, { path: () => cf.knobPath(), active: () => stepNow(app, s.build), keepVisible: () => app.runner.i === s.build, k: () => cf.n / 12,
    set: (k) => { const n = Math.round(clamp01(k) * 12); if (n !== cf.n) cf.setN(n); if (cf.n >= 12 && done.built) done.built(); } });
  const s0 = cf.setN; cf.setN = (n) => { s0(n); sync(); };
}

// ------------------------------------------------------------------ Class 4 Ch 2 Hide and Seek: a toy house from the front, side and top
export function toyHouse(o = {}) {
  const it = new Item('jhouse4', { ...o, name: { en: 'Toy house and view cards', hi: 'खिलौना घर और दृश्य कार्ड', hg: 'Khilauna ghar aur view cards' } });
  const g = it.g, w_ = o.W || ((k) => k);
  const house = new THREE.Group(); house.position.set(0, 0, -0.08); g.add(house); const pivot = new THREE.Group(); house.add(pivot);
  const wallT = tex(128, 128, (x) => { x.fillStyle = '#f2e6c8'; x.fillRect(0, 0, 128, 128); x.fillStyle = '#5a7fb0'; x.fillRect(22, 40, 26, 26); x.fillRect(80, 40, 26, 26); x.fillStyle = '#7a4a22'; x.fillRect(50, 70, 28, 58); });
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.1, 0.1), [M(0xf2e6c8), M(0xf2e6c8), M(0xf2e6c8), M(0xf2e6c8), new THREE.MeshStandardMaterial({ map: wallT, roughness: 0.7 }), M(0xf2e6c8)]); body.position.y = 0.05; body.castShadow = true; pivot.add(body);
  const roofS = new THREE.Shape([new THREE.Vector2(-0.09, 0), new THREE.Vector2(0.09, 0), new THREE.Vector2(0, 0.07)]); const roofG = new THREE.ExtrudeGeometry(roofS, { depth: 0.12, bevelEnabled: false }); roofG.translate(0, 0, -0.06);
  const roof = new THREE.Mesh(roofG, M(0xb8322f, 0.6)); roof.position.y = 0.1; roof.castShadow = true; pivot.add(roof);
  const chim = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.06, 0.025), M(0x6b6b6b, 0.8)); chim.position.set(0.045, 0.15, 0.02); pivot.add(chim);
  const card = (kind) => tex(256, 256, (x) => { x.fillStyle = '#fbf8f0'; x.fillRect(0, 0, 256, 256); x.strokeStyle = '#1d2733'; x.lineWidth = 6; x.fillStyle = 'rgba(184,50,47,0.25)';
    if (kind === 'front') { x.strokeRect(48, 120, 160, 100); x.beginPath(); x.moveTo(38, 120); x.lineTo(128, 50); x.lineTo(218, 120); x.closePath(); x.fill(); x.stroke(); x.strokeRect(150, 50, 24, 50); }
    if (kind === 'side') { x.strokeRect(68, 120, 120, 100); x.fillRect(58, 50, 140, 70); x.strokeRect(58, 50, 140, 70); x.strokeRect(150, 30, 24, 30); }
    if (kind === 'top') { x.fillRect(38, 58, 180, 140); x.strokeRect(38, 58, 180, 140); x.beginPath(); x.moveTo(38, 128); x.lineTo(218, 128); x.stroke(); x.fillStyle = '#6b6b6b'; x.fillRect(158, 110, 26, 26); }
    x.fillStyle = '#1d2733'; x.font = `800 30px ${FONT}`; x.textAlign = 'center'; x.fillText(w_(kind), 128, 245); });
  const cards = ['front', 'side', 'top'].map((k, i) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.12), new THREE.MeshStandardMaterial({ map: card(k), roughness: 0.8 })); m.rotation.x = -Math.PI / 2 + 0.5; m.position.set(-0.17 + i * 0.17, 0.035, 0.13); g.add(m); return m; });
  const glowRing = new THREE.Mesh(new THREE.RingGeometry(0.075, 0.085, 32), new THREE.MeshBasicMaterial({ color: 0xffd23f, toneMapped: false })); glowRing.rotation.x = -Math.PI / 2 + 0.5; glowRing.visible = false; g.add(glowRing);
  const rd = liveSign(0.07, 3.4); rd.position.set(0, 0.26, -0.3); g.add(rd);
  it.turn = 0; it.tilt = 0;
  const apply = () => { pivot.rotation.y = -it.turn * Math.PI / 2; pivot.rotation.x = it.tilt * Math.PI / 2; pivot.position.y = it.tilt * 0.06; };
  it.setTurn = (k) => { it.turn = clamp01(k); apply(); };
  it.setTilt = (k) => { it.tilt = clamp01(k); apply(); };
  it.pick = (i) => { glowRing.visible = i >= 0; if (i >= 0) glowRing.position.copy(cards[i].position).add(V(0, 0.002, 0)); };
  it.say = (l, c) => rd.set(l, c);
  apply(); it.pick(0); it.say([w_('front')], '#ffd23f');
  it.knobPath = () => tableSlide(g);
  return done1(it, { height: 0.2, radius: 0.35 });
}
export function bindHouseHands(th, knob, app, s = { turn: 1 }, done = {}) {
  const sync = slideKnob(knob, { path: () => th.knobPath(), active: () => stepNow(app, s.turn), keepVisible: () => app.runner.i === s.turn, k: () => th.turn,
    set: (k) => { th.setTurn(k > 0.96 ? 1 : k); if (th.turn >= 1) { th.pick(1); if (done.side) done.side(); } } });
  const s0 = th.setTurn; th.setTurn = (k) => { s0(k); sync(); };
}

// ------------------------------------------------------------------ Class 4 Ch 3 Pattern Around Us: marbles in pairs
export function marblePairs(o = {}) {
  const it = new Item('jmarble4', { ...o, name: { en: 'Marbles in pairs', hi: 'जोड़ों में कंचे', hg: 'Jodon mein kanche' } });
  const g = it.g, w_ = o.W || ((k) => k), N = 16;
  const mT = (c) => tex(64, 64, (x) => { x.fillStyle = c; x.fillRect(0, 0, 64, 64); x.strokeStyle = 'rgba(255,255,255,0.8)'; x.lineWidth = 6; x.beginPath(); x.moveTo(0, 40); x.bezierCurveTo(20, 10, 40, 60, 64, 24); x.stroke(); });
  const cols = ['#2a6fd1', '#d93a2b', '#2f9a4a', '#f2b632'];
  const mats = cols.map((c) => new THREE.MeshPhysicalMaterial({ map: mT(c), roughness: 0.05, clearcoat: 1, transmission: 0.3, thickness: 0.01 }));
  const marbles = []; for (let i = 0; i < N; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.012, 18, 12), mats[i % 4]); m.visible = false; m.castShadow = true; g.add(m); marbles.push(m); }
  const tray = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.008, 0.12), new THREE.MeshStandardMaterial({ map: woodTex('#c08850', 51), roughness: 0.6 })); tray.position.set(0, 0.004, -0.02); g.add(tray);
  const lone = new THREE.Mesh(new THREE.RingGeometry(0.017, 0.021, 24), new THREE.MeshBasicMaterial({ color: 0xff8a5a, toneMapped: false })); lone.rotation.x = -Math.PI / 2; lone.visible = false; g.add(lone);
  const rd = liveSign(0.07, 3.4); rd.position.set(0, 0.18, -0.26); g.add(rd);
  animator(it); it.n = 0;
  const spot = (i) => V(-0.2 + Math.floor(i / 2) * 0.05, 0.02, -0.045 + (i % 2) * 0.05);
  const show = () => { marbles.forEach((m, i) => { m.visible = i < it.n; m.position.copy(spot(i)); }); const odd = it.n % 2 === 1; lone.visible = odd; if (odd) lone.position.copy(spot(it.n - 1)).setY(0.009);
    rd.set([`${it.n}: ${it.n ? (odd ? w_('odd') : w_('even')) : ''}`], odd ? '#ff8a5a' : '#8be07a'); };
  it.add1 = (cb) => { if (it.busy || it.n >= N) return false; const i = it.n, m = marbles[i], to = spot(i), from = V(0.3, 0.1, 0.15); m.visible = true;
    it.play(0.5, (k) => { m.position.lerpVectors(from, to, ease(k)); m.position.y += Math.sin(k * Math.PI) * 0.06; }, () => { it.n++; show(); if (cb) cb(); }); return true; };
  it.setN = (n) => { it.n = n; show(); };
  it.say = (l, c) => rd.set(l, c);
  show(); it.say(['0'], '#ffffff');
  it.leverPath = () => tableLever(g);
  return done1(it, { height: 0.05, radius: 0.4 });
}
export function bindMarbleHands(mp, lever, app, s = { add: 1 }, done = {}) {
  pushKnob(lever, { path: () => mp.leverPath(), active: () => stepNow(app, s.add) && !mp.busy && mp.n < 8, keepVisible: () => app.runner.i === s.add, press: () => mp.add1(() => { if (mp.n >= 8 && done.all) done.all(); }) });
}

// ------------------------------------------------------------------ Class 4 Ch 4 Thousands Around Us: wooden blocks to a thousand
// Wooden base-ten blocks: a small cube is 1, a rod 10, a flat 100 and a big cube 1000. Each push of the lever stacks one
// more flat; ten flats make the big cube.
export function thousandBlocks(o = {}) {
  const it = new Item('jblocks4', { ...o, name: { en: 'Wooden base-ten blocks', hi: 'लकड़ी के गिनती ब्लॉक', hg: 'Lakdi ke ginti blocks' } });
  const g = it.g, u = 0.01, w_ = o.W || ((k) => k);
  const gridT = (n) => tex(256, 256, (x) => { x.fillStyle = '#e8c48c'; x.fillRect(0, 0, 256, 256); x.strokeStyle = 'rgba(90,55,20,0.55)'; x.lineWidth = 3; for (let i = 0; i <= n; i++) { const p = i * 256 / n; x.beginPath(); x.moveTo(p, 0); x.lineTo(p, 256); x.stroke(); x.beginPath(); x.moveTo(0, p); x.lineTo(256, p); x.stroke(); } });
  const flatM = new THREE.MeshStandardMaterial({ map: gridT(10), roughness: 0.6 }), unitM = new THREE.MeshStandardMaterial({ map: gridT(1), roughness: 0.6 });
  const rodT = tex(256, 32, (x) => { x.fillStyle = '#e8c48c'; x.fillRect(0, 0, 256, 32); x.strokeStyle = 'rgba(90,55,20,0.55)'; x.lineWidth = 3; for (let i = 0; i <= 10; i++) { x.beginPath(); x.moveTo(i * 25.6, 0); x.lineTo(i * 25.6, 32); x.stroke(); } });
  const rodM = new THREE.MeshStandardMaterial({ map: rodT, roughness: 0.6 });
  let objs = []; const clear = () => { objs.forEach((m) => g.remove(m)); objs = []; };
  const add = (geo, mat, p) => { const m = new THREE.Mesh(geo, mat); m.position.copy(p); m.castShadow = true; g.add(m); objs.push(m); return m; };
  const flatG = new THREE.BoxGeometry(10 * u, u, 10 * u), cubeG = new THREE.BoxGeometry(10 * u, 10 * u, 10 * u), rodG = new THREE.BoxGeometry(10 * u, u, u), unitG = new THREE.BoxGeometry(u, u, u);
  const rd = liveSign(0.07, 3.4); rd.position.set(0, 0.2, -0.26); g.add(rd);
  animator(it); it.flats = 6; it.val = [0, 0, 0, 0];
  const drawStack = (extraK = 1) => { clear(); for (let i = 0; i < it.flats; i++) { const p = V(-0.05, u / 2 + i * u, -0.06); if (i === it.flats - 1 && extraK < 1) { p.x += (1 - ease(extraK)) * 0.2; p.y += Math.sin(extraK * Math.PI) * 0.06; } add(flatG, flatM, p); }
    rd.set([`${it.flats} × 100 = ${it.flats * 100}`], it.flats >= 10 ? '#8be07a' : '#ffd23f'); };
  it.addFlat = (cb) => { if (it.busy || it.flats >= 10) return false; it.flats++; it.play(0.6, (k) => drawStack(k), () => { drawStack(1); if (it.flats >= 10) { clear(); add(cubeG, flatM, V(-0.05, 5 * u, -0.06)); rd.set([`10 × 100 = 1000`], '#8be07a'); } if (cb) cb(); }); return true; };
  it.showNumber = (th, h, t, o2) => { clear(); for (let i = 0; i < th; i++) add(cubeG, flatM, V(-0.3 + i * 0.12, 5 * u, -0.1)); for (let i = 0; i < h; i++) add(flatG, flatM, V(0.08, u / 2 + i * u * 1.05, -0.1));
    for (let i = 0; i < t; i++) add(rodG, rodM, V(0.2, u / 2, -0.15 + i * 0.015)); for (let i = 0; i < o2; i++) add(unitG, unitM, V(0.29 + (i % 3) * 0.015, u / 2, -0.15 + Math.floor(i / 3) * 0.015));
    const lab = [[`${th}`, -0.3 + (th - 1) * 0.06], [`${h}`, 0.08], [`${t}`, 0.2], [`${o2}`, 0.31]]; lab.forEach(([s2, x]) => { const tg = tag(s2, '#ffd23f', 0.03); tg.position.set(x, 0.14, -0.1); g.add(tg); objs.push(tg); });
    rd.set([`${th}${h}${t}${o2} = ${th} ${w_('thousands')} + ${h} ${w_('hundreds')} + ${t} ${w_('tens')} + ${o2} ${w_('ones')}`], '#ffd23f'); };
  it.say = (l, c) => rd.set(l, c);
  drawStack();
  it.leverPath = () => tableLever(g);
  return done1(it, { height: 0.12, radius: 0.4 });
}
export function bindBlockHands(tb, lever, app, s = { stack: 1 }, done = {}) {
  pushKnob(lever, { path: () => tb.leverPath(), active: () => stepNow(app, s.stack) && !tb.busy && tb.flats < 10, keepVisible: () => app.runner.i === s.stack, press: () => tb.addFlat(() => { if (tb.flats >= 10 && done.all) done.all(); }) });
}

// ------------------------------------------------------------------ Class 4 Ch 5 Sharing and Measuring: a metre of ribbon in quarters
export function ribbonMetre(o = {}) {
  const it = new Item('jribbon4', { ...o, name: { en: 'A metre of ribbon', hi: 'एक मीटर रिबन', hg: 'Ek metre ribbon' } });
  const g = it.g, L = 0.8, X0 = -0.4; // drawn 0.8 m long on the table so it fits, labelled as 1 m = 100 cm
  const scaleT = tex(1024, 64, (x) => { x.fillStyle = '#f6e7a8'; x.fillRect(0, 0, 1024, 64); x.fillStyle = '#1d2733'; x.strokeStyle = '#1d2733'; for (let c = 0; c <= 100; c++) { const p = 4 + c * 10.16; x.lineWidth = c % 10 ? 1.5 : 3; x.beginPath(); x.moveTo(p, 0); x.lineTo(p, c % 10 ? 14 : 26); x.stroke(); if (c % 10 === 0) { x.font = `700 20px ${FONT}`; x.textAlign = 'center'; x.fillText(String(c), Math.min(1010, Math.max(14, p)), 50); } } });
  const scale = new THREE.Mesh(new THREE.BoxGeometry(L + 0.01, 0.004, 0.05), [M(0xf6e7a8), M(0xf6e7a8), new THREE.MeshStandardMaterial({ map: scaleT, roughness: 0.6 }), M(0xf6e7a8), M(0xf6e7a8), M(0xf6e7a8)]); scale.position.set(0, 0.002, 0.04); g.add(scale);
  const satin = new THREE.MeshPhysicalMaterial({ color: 0xc8202a, roughness: 0.3, sheen: 1, sheenColor: new THREE.Color(0xff8090) });
  const pieces = [0, 1, 2, 3].map((i) => { const m = new THREE.Mesh(new THREE.BoxGeometry(L / 4, 0.002, 0.025), satin.clone()); m.position.set(X0 + L / 8 + i * L / 4, 0.005, -0.02); m.castShadow = true; g.add(m); return m; });
  const marks = []; const rd = liveSign(0.07, 3.4); rd.position.set(0, 0.17, -0.26); g.add(rd);
  animator(it); it.cuts = 0;
  const place = (gap) => { pieces.forEach((m, i) => { const grp = it.cuts >= 2 ? i : i < 2 ? 0 : 1, n = it.cuts >= 2 ? 4 : 2; void n; m.position.x = X0 + L / 8 + i * L / 4 + (grp - (it.cuts >= 2 ? 1.5 : 0.5)) * gap; }); };
  it.cut = (cb) => { if (it.busy || it.cuts >= 2) return false; it.cuts++; it.play(0.8, (k) => place(0.03 * ease(k)), () => { place(0.03);
      const ls = it.cuts === 1 ? [['½ m = 50 cm', -0.2], ['½ m = 50 cm', 0.2]] : [['¼', -0.3], ['¼', -0.1], ['¼', 0.1], ['¼', 0.3]]; marks.forEach((t) => g.remove(t)); marks.length = 0;
      ls.forEach(([s2, x]) => { const t = tag(s2, '#ffd23f', 0.026); t.position.set(x * (1 + (it.cuts === 1 ? 0 : 0.1)), 0.05, -0.02); g.add(t); marks.push(t); });
      rd.set([it.cuts === 1 ? '100 cm ÷ 2 = 50 cm' : '100 cm ÷ 4 = 25 cm'], '#ffd23f'); if (cb) cb(); }); return true; };
  it.threeQ = () => { pieces.forEach((m, i) => { m.material.color.setHex(i < 3 ? 0xffb020 : 0xc8202a); }); rd.set(['¾ m = 3 × 25 cm = 75 cm'], '#8be07a'); };
  it.say = (l, c) => rd.set(l, c);
  place(0); it.say(['1 m = 100 cm'], '#ffffff');
  it.leverPath = () => tableLever(g);
  return done1(it, { height: 0.02, radius: 0.45 });
}
export function bindRibbonHands(rb, lever, app, s = { cut: 1 }, done = {}) {
  pushKnob(lever, { path: () => rb.leverPath(), active: () => stepNow(app, s.cut) && !rb.busy && rb.cuts < 2, keepVisible: () => app.runner.i === s.cut, press: () => rb.cut(() => { if (rb.cuts >= 2 && done.all) done.all(); }) });
}

// ------------------------------------------------------------------ Class 4 Ch 6 Measuring Length: a tape across the classroom
// A measuring tape is hooked on the left wall of the classroom. Slide the handle to pull it out to the right wall: the
// room is 8 m 40 cm wide.
export function classTape(o = {}) {
  const it = new Item('jtape4', { ...o, name: { en: 'Measuring tape', hi: 'नापने का फ़ीता', hg: 'Naapne ka feeta' } });
  const g = it.g, XL = -4.2, XR = 4.2, Y = 0.95, Z = -1.2;
  const tapeT = canvasTex(8192, 64, (x) => { x.fillStyle = '#f2c230'; x.fillRect(0, 0, 8192, 64); x.fillStyle = '#1d2733'; x.strokeStyle = '#1d2733';
    for (let c = 0; c <= 900; c++) { const p = c * 8192 / 900; x.lineWidth = c % 10 ? 2 : 4; x.beginPath(); x.moveTo(p, 0); x.lineTo(p, c % 100 === 0 ? 40 : c % 10 ? 12 : 22); x.stroke(); if (c % 50 === 0 && c) { x.font = `800 ${c % 100 ? 22 : 30}px ${FONT}`; x.textAlign = 'center'; x.fillStyle = c % 100 ? '#1d2733' : '#c0392b'; x.fillText(c % 100 ? String(c) : `${c / 100} m`, p, 60); x.fillStyle = '#1d2733'; } } });
  tapeT.colorSpace = THREE.SRGBColorSpace; tapeT.anisotropy = 8;
  const tape = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.05), new THREE.MeshStandardMaterial({ map: tapeT, roughness: 0.4, metalness: 0.2, side: THREE.DoubleSide })); tape.rotation.x = -0.9; g.add(tape);
  const endTag = tag('0 cm', '#ffd23f', 0.09); g.add(endTag);
  const caseM = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.035), M(0xd93a2b, 0.4)); caseM.position.set(XL + 0.06, Y, Z); g.add(caseM);
  const hook = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.04, 0.035), M(0x8a8f96, 0.3, 0.9)); g.add(hook);
  const rd = liveSign(0.22, 3.2); rd.position.set(0, 1.45, Z - 0.4); g.add(rd);
  it.len = 0;
  it.setLen = (k) => { it.len = clamp01(k); const L = Math.max(0.001, (XR - XL - 0.1) * it.len); tape.scale.x = L; tape.position.set(XL + 0.1 + L / 2, Y, Z); tapeT.repeat.set(L / 9, 1); tapeT.offset.x = 0; hook.position.set(XL + 0.1 + L, Y, Z); endTag.position.set(XL + 0.1 + L, Y + 0.14, Z);
    const cm = Math.round((XR - XL) * 100 * it.len); endTag.setText(`${cm} cm`); rd.set([`${Math.floor(cm / 100)} m ${cm % 100} cm = ${cm} cm`], it.len >= 1 ? '#8be07a' : '#ffd23f'); if (it.onLen) it.onLen(it.len); };
  it.say = (l, c) => rd.set(l, c);
  it.setLen(0.02);
  it.knobPath = floorKnob;
  return done1(it, { height: 1.0, radius: 4 });
}
export function bindTapeHands(ct, knob, app, s = { pull: 1 }, done = {}) {
  const sync = slideKnob(knob, { path: () => ct.knobPath(), active: () => stepNow(app, s.pull), keepVisible: () => app.runner.i === s.pull, k: () => ct.len,
    set: (k) => { ct.setLen(k > 0.97 ? 1 : Math.max(0.02, k)); if (ct.len >= 1 && done.wall) done.wall(); } });
  const s0 = ct.setLen; ct.setLen = (k) => { s0(k); sync(); };
}

// ------------------------------------------------------------------ Class 4 Ch 7 The Cleanest Village: buying dustbins
// The village buys 3 dustbins at ₹245 each. Each push of the lever puts one ₹100 note on the counter until there is
// enough for ₹735; ₹800 is paid and ₹65 comes back.
export function dustbinShop(o = {}) {
  const it = new Item('jbins4', { ...o, name: { en: 'Dustbins and money', hi: 'कूड़ेदान और पैसे', hg: 'Kooda-daan aur paise' } });
  const g = it.g, w_ = o.W || ((k) => k);
  const binT = (c, word) => tex(256, 128, (x) => { x.fillStyle = c; x.fillRect(0, 0, 256, 128); x.fillStyle = 'rgba(255,255,255,0.92)'; x.font = `800 34px ${FONT}`; x.textAlign = 'center'; x.fillText(word, 128, 74); x.beginPath(); x.arc(128, 100, 9, 0, 7); x.fill(); });
  [[0x2f9a4a, w_('WET')], [0x2a6fd1, w_('DRY')], [0x2f9a4a, w_('WET')]].forEach(([c, word], i) => { const col = '#' + c.toString(16).padStart(6, '0'); const b = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.045, 0.14, 28), [new THREE.MeshStandardMaterial({ map: binT(col, word), roughness: 0.5 }), M(c, 0.5), M(c, 0.5)]); b.position.set(-0.15 + i * 0.15, 0.07, -0.14); b.castShadow = true; g.add(b);
    const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.012, 28), M(c, 0.4)); lid.position.set(-0.15 + i * 0.15, 0.146, -0.14); g.add(lid); const t = tag('₹245', '#ffd23f', 0.022); t.position.set(-0.15 + i * 0.15, 0.19, -0.14); g.add(t); });
  const noteT = (v, c) => tex(256, 112, (x) => { x.fillStyle = c; x.fillRect(0, 0, 256, 112); x.strokeStyle = 'rgba(0,0,0,0.25)'; x.lineWidth = 4; x.strokeRect(6, 6, 244, 100); x.fillStyle = 'rgba(0,0,0,0.65)'; x.font = `800 44px ${FONT}`; x.textAlign = 'center'; x.fillText('₹' + v, 128, 70); x.font = `700 14px ${FONT}`; x.fillText('DUET STEM · PLAY MONEY', 128, 100); });
  const n100 = new THREE.MeshStandardMaterial({ map: noteT(100, '#c8b6e2'), roughness: 0.8 });
  const noteG = new THREE.BoxGeometry(0.1, 0.0008, 0.045); const notes = []; for (let i = 0; i < 8; i++) { const m = new THREE.Mesh(noteG, [M(0xc8b6e2), M(0xc8b6e2), n100, M(0xc8b6e2), M(0xc8b6e2), M(0xc8b6e2)]); m.position.set(-0.12, 0.001 + i * 0.0009, 0.16); g.add(m); notes.push(m); }
  const chg = [['₹50', '#b6e2c8', 50], ['₹10', '#e8d9a8', 10], ['₹5', '#e8eaee', 5]].map(([s2, c, v]) => { const m = new THREE.Mesh(v === 50 ? noteG : new THREE.CylinderGeometry(0.0135, 0.0135, 0.0025, 24), v === 50 ? [M(0xb6e2c8), M(0xb6e2c8), new THREE.MeshStandardMaterial({ map: noteT(50, c), roughness: 0.8 }), M(0xb6e2c8), M(0xb6e2c8), M(0xb6e2c8)] : M(new THREE.Color(c).getHex(), 0.35, 0.7)); m.visible = false; g.add(m); void s2; return m; });
  const rd = liveSign(0.07, 3.6); rd.position.set(0, 0.26, -0.3); g.add(rd);
  animator(it); it.paid = 0;
  it.pay = (cb) => { if (it.busy || it.paid >= 8) return false; const m = notes[7 - it.paid], a = m.position.clone(), b = V(0.12 + it.paid * 0.004, 0.001 + it.paid * 0.0009, 0.06);
    it.play(0.5, (k) => { m.position.lerpVectors(a, b, ease(k)); m.position.y += Math.sin(k * Math.PI) * 0.04; }, () => { it.paid++; rd.set([`₹${it.paid * 100}`], it.paid * 100 >= 735 ? '#8be07a' : '#ffd23f'); if (cb) cb(); }); return true; };
  it.change = async (tween) => { chg.forEach((m) => { m.visible = true; }); await tween(1.2, (k) => { chg.forEach((m, i) => { m.position.set(0.2 - 0.3 * ease(k), 0.003 + Math.sin(k * Math.PI) * 0.04, 0.12 + i * 0.035); }); }); };
  it.say = (l, c) => rd.set(l, c);
  it.say(['3 × ₹245 = ?'], '#ffffff');
  it.leverPath = () => tableLever(g);
  return done1(it, { height: 0.2, radius: 0.45 });
}
export function bindBinHands(ds, lever, app, s = { pay: 2 }, done = {}) {
  pushKnob(lever, { path: () => ds.leverPath(), active: () => stepNow(app, s.pay) && !ds.busy && ds.paid < 8, keepVisible: () => app.runner.i === s.pay, press: () => ds.pay(() => { if (ds.paid >= 8 && done.all) done.all(); }) });
}
