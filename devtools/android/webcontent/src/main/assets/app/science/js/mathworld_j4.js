// DUET Maths Lab 360, hands-on for Class 4 (Maths Mela), batch J4: weighing a rice bag with standard weights, egg
// trays in equal groups, rounding the tiger count on a hill track, completing a butterfly with a mirror, a station
// clock in 24-hour time, ticket bundles at the transport museum, and a bar graph of how children come to school.
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
const floorLever = () => [V(-0.45, 1.0, -0.3), V(-0.45, 1.0, -0.05)];
const floorKnob = () => [V(-0.45, 1.0, -0.42), V(0.45, 1.0, -0.42)];
const done1 = (it, o) => { noHit(it.g); it.noGrab = true; it.noPhys = true; it.base = 0; Object.assign(it, o); return it; };
const metal = () => M(0xb8bec6, 0.3, 0.85);

// ------------------------------------------------------------------ Class 4 Ch 8 Weigh it, Pour it: a rice bag and standard weights
export function riceBalance(o = {}) {
  const it = new Item('jrice4', { ...o, name: { en: 'Balance and weights', hi: 'तराज़ू और बाट', hg: 'Taraazu aur baat' } });
  const g = it.g;
  const bal = new THREE.Group(); bal.position.set(0, 0, -0.08); g.add(bal);
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.016, 0.26, 12), metal()); post.position.y = 0.13; bal.add(post);
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.015, 0.08), new THREE.MeshStandardMaterial({ map: woodTex('#6b3f1d', 8), roughness: 0.6 })); base.position.y = 0.0075; bal.add(base);
  const beam = new THREE.Group(); beam.position.y = 0.26; bal.add(beam); beam.add(new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.008, 0.012), metal()));
  const pointer = new THREE.Mesh(new THREE.ConeGeometry(0.006, 0.05, 8), M(0xc0392b, 0.4)); pointer.position.y = 0.03; beam.add(pointer);
  const pans = [-0.18, 0.18].map((x) => { const p = new THREE.Group(); const dish = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.05, 0.014, 32), metal()); dish.position.y = -0.17; p.add(dish);
    [0, 2.1, 4.2].forEach((a) => { const s2 = new THREE.Mesh(new THREE.CylinderGeometry(0.0008, 0.0008, 0.17, 4), M(0x777777)); s2.position.set(Math.cos(a) * 0.035, -0.085, Math.sin(a) * 0.035); s2.rotation.z = Math.cos(a) * 0.4; s2.rotation.x = -Math.sin(a) * 0.4; p.add(s2); }); p.position.x = x; beam.add(p); return p; });
  const sackT = tex(128, 128, (x) => { x.fillStyle = '#e9dcc0'; x.fillRect(0, 0, 128, 128); x.strokeStyle = 'rgba(120,100,60,0.4)'; for (let i = 0; i < 128; i += 4) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, 128); x.stroke(); x.beginPath(); x.moveTo(0, i); x.lineTo(128, i); x.stroke(); }
    x.fillStyle = '#2f6b25'; x.font = `800 22px ${FONT}`; x.textAlign = 'center'; x.fillText('RICE', 64, 60); x.fillText('?', 64, 92); });
  const sackG = new THREE.SphereGeometry(0.05, 20, 14); sackG.scale(1, 1.25, 0.8); const sack = new THREE.Mesh(sackG, new THREE.MeshStandardMaterial({ map: sackT, roughness: 0.9 })); sack.position.set(0, -0.1, 0); sack.castShadow = true; pans[0].add(sack);
  const W = [500, 200, 50]; const wObj = W.map((w, i) => { const r = w === 500 ? 0.028 : w === 200 ? 0.022 : 0.016, h = w === 500 ? 0.04 : w === 200 ? 0.032 : 0.024;
    const gg = new THREE.Group(); const m = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.85, r, h, 6), M(0x3a3a3a, 0.35, 0.75)); gg.add(m); const kn = new THREE.Mesh(new THREE.SphereGeometry(r * 0.35, 10, 8), M(0x3a3a3a, 0.35, 0.75)); kn.position.y = h / 2 + r * 0.2; gg.add(kn);
    const t = tag(`${w} g`, '#ffffff', 0.016); t.position.y = h + 0.02; gg.add(t); gg.home = V(0.1 + i * 0.07, h / 2, 0.15); gg.position.copy(gg.home); g.add(gg); gg.h = h; return gg; });
  const rd = liveSign(0.07, 3.4); rd.position.set(0, 0.36, -0.3); g.add(rd);
  animator(it); it.on = 0; it.bag = 750;
  const tilt = () => { const d = W.slice(0, it.on).reduce((s, w) => s + w, 0) - it.bag; beam.rotation.z = Math.max(-0.22, Math.min(0.22, d / 600 * 0.22)); pans.forEach((p) => { p.rotation.z = -beam.rotation.z; }); };
  const onPan = (i) => { const off = [V(-0.02, 0, 0), V(0.03, 0, -0.01), V(0.02, 0, 0.03)][i]; const local = V(0, -0.163 + wObj[i].h / 2, 0).add(off); return pans[1].localToWorld(local.clone()); };
  it.addW = (cb) => { if (it.busy || it.on >= W.length) return false; const i = it.on, gg = wObj[i], a = gg.position.clone();
    it.play(0.8, (k) => { g.updateMatrixWorld(true); const b = g.worldToLocal(onPan(i)); gg.position.lerpVectors(a, b, ease(k)); gg.position.y += Math.sin(k * Math.PI) * 0.1; },
      () => { it.on++; pans[1].attach(gg); gg.position.copy(V(0, -0.163 + gg.h / 2, 0).add([V(-0.02, 0, 0), V(0.03, 0, -0.01), V(0.02, 0, 0.03)][i])); gg.rotation.set(0, 0, 0); tilt(); const s = W.slice(0, it.on).reduce((x, w) => x + w, 0);
        rd.set([`${W.slice(0, it.on).join(' + ')} = ${s} g`], s === it.bag ? '#8be07a' : '#ffd23f'); if (cb) cb(); }); return true; };
  it.say = (l, c) => rd.set(l, c);
  tilt(); it.say(['? g'], '#ffffff');
  it.leverPath = () => tableLever(g);
  return done1(it, { height: 0.3, radius: 0.4 });
}
export function bindRiceHands(rb, lever, app, s = { add: 1 }, done = {}) {
  pushKnob(lever, { path: () => rb.leverPath(), active: () => stepNow(app, s.add) && !rb.busy && rb.on < 3, keepVisible: () => app.runner.i === s.add, press: () => rb.addW(() => { if (rb.on >= 3 && done.all) done.all(); }) });
}

// ------------------------------------------------------------------ Class 4 Ch 9 Equal Groups: egg trays
export function eggTrays(o = {}) {
  const it = new Item('jeggs4', { ...o, name: { en: 'Egg trays', hi: 'अंडों की ट्रे', hg: 'Andon ki tray' } });
  const g = it.g, MAXT = 7;
  const pulpT = tex(128, 128, (x) => { x.fillStyle = '#b9b1a3'; x.fillRect(0, 0, 128, 128); const r = rnd(6); for (let i = 0; i < 900; i++) { x.fillStyle = `rgba(${r() < 0.5 ? '90,85,80' : '230,225,215'},0.25)`; x.fillRect(r() * 128, r() * 128, 2, 1); } });
  const eggT = tex(64, 64, (x) => { x.fillStyle = '#f3ead9'; x.fillRect(0, 0, 64, 64); const r = rnd(3); for (let i = 0; i < 60; i++) { x.fillStyle = 'rgba(160,120,80,0.25)'; x.beginPath(); x.arc(r() * 64, r() * 64, r() * 1.5, 0, 7); x.fill(); } });
  const eggG = new THREE.SphereGeometry(0.019, 16, 12); eggG.scale(1, 1.3, 1);
  const trays = []; for (let t = 0; t < MAXT; t++) { const tg = new THREE.Group(); const base = new THREE.Mesh(new THREE.BoxGeometry(0.135, 0.016, 0.09), new THREE.MeshStandardMaterial({ map: pulpT, roughness: 0.95 })); base.position.y = 0.008; tg.add(base);
    for (let k = 0; k < 6; k++) { const e = new THREE.Mesh(eggG, new THREE.MeshStandardMaterial({ map: eggT, roughness: 0.6 })); e.position.set(-0.044 + (k % 3) * 0.044, 0.035, -0.022 + Math.floor(k / 3) * 0.044); e.castShadow = true; tg.add(e); }
    tg.visible = false; g.add(tg); trays.push(tg); }
  const rd = liveSign(0.07, 3.4); rd.position.set(0, 0.2, -0.28); g.add(rd);
  animator(it); it.n = 0;
  const spot = (t) => V(-0.28 + (t % 4) * 0.15, 0, -0.16 + Math.floor(t / 4) * 0.12);
  it.add1 = (cb) => { if (it.busy || it.n >= MAXT) return false; const t = it.n, tg = trays[t], b = spot(t), a = V(0.35, 0.15, 0.2); tg.visible = true;
    it.play(0.6, (k) => { tg.position.lerpVectors(a, b, ease(k)); tg.position.y += Math.sin(k * Math.PI) * 0.05; }, () => { it.n++; rd.set([Array.from({ length: it.n }, (_, i) => 6 * (i + 1)).join(', ')], '#ffd23f'); if (cb) cb(); }); return true; };
  it.say = (l, c) => rd.set(l, c);
  it.say(['6 eggs in a tray'], '#ffffff');
  it.leverPath = () => tableLever(g);
  return done1(it, { height: 0.06, radius: 0.45 });
}
export function bindEggHands(et, lever, app, s = { add: 1 }, done = {}) {
  pushKnob(lever, { path: () => et.leverPath(), active: () => stepNow(app, s.add) && !et.busy && et.n < 7, keepVisible: () => app.runner.i === s.add, press: () => et.add1(() => { if (et.n >= 7 && done.all) done.all(); }) });
}

// ------------------------------------------------------------------ Class 4 Ch 10 Elephants, Tigers, and Leopards: rounding hills
// India counted 3,682 tigers. A wavy track runs from 3,600 to 3,700: the hundreds sit in the valleys and 3,650 on the
// hilltop. A ball put on 3,682 rolls down into the nearer valley, 3,700. With valleys at every ten it rolls to 3,680.
export function roundingHills(o = {}) {
  const it = new Item('jround4', { ...o, name: { en: 'Rounding hills', hi: 'पूर्णांकन की पहाड़ियाँ', hg: 'Rounding ki pahaadiyan' } });
  const g = it.g, X0 = -2.4, X1 = 2.4, Z = -2.4, w_ = o.W || ((k) => k);
  let step = 100, lo = 3600; const N0 = 3682;
  const xOf = (n) => X0 + (n - lo) / 100 * (X1 - X0);
  const yOf = (n) => 0.35 + 0.28 * (1 - Math.cos(2 * Math.PI * (n - lo) / step)) / 2;
  let track = null, labels = []; const trackM = new THREE.MeshStandardMaterial({ color: 0xd9d2c4, roughness: 0.5 });
  const build = () => { if (track) g.remove(track); labels.forEach((l) => g.remove(l)); labels = [];
    const pts = []; for (let i = 0; i <= 200; i++) { const n = lo + i / 2; pts.push(V(xOf(n), yOf(n), Z)); } track = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 300, 0.02, 8), trackM); track.castShadow = true; g.add(track);
    for (let n = lo; n <= lo + 100; n += step === 100 ? 10 : 2) { const big = (n - lo) % step === 0; if (step === 100 || big) { const t = tag((n).toLocaleString('en-IN'), big ? '#8be07a' : '#ffffff', big ? 0.13 : 0.08); t.position.set(xOf(n), yOf(n) - 0.12, Z + 0.05); g.add(t); labels.push(t); }
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, yOf(n), 6), M(0x8a6a4a, 0.8)); post.position.set(xOf(n), yOf(n) / 2, Z - 0.05); g.add(post); labels.push(post); } };
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.05, 20, 14), M(0xf2b632, 0.35)); ball.castShadow = true; g.add(ball);
  const signT = tex(512, 256, (x) => { x.fillStyle = '#2f5a2a'; x.fillRect(0, 0, 512, 256); x.strokeStyle = '#f2e6c8'; x.lineWidth = 8; x.strokeRect(8, 8, 496, 240); x.fillStyle = '#f2e6c8'; x.font = `800 40px ${FONT}`; x.textAlign = 'center'; x.fillText(w_('Tigers in India'), 256, 90); x.font = `900 96px ${FONT}`; x.fillStyle = '#ffd23f'; x.fillText('3,682', 256, 200); });
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.4), new THREE.MeshStandardMaterial({ map: signT, roughness: 0.7 })); sign.position.set(-1.9, 1.25, Z - 0.3); g.add(sign);
  const rd = liveSign(0.24, 3.4); rd.position.set(0.6, 1.25, Z - 0.3); g.add(rd);
  animator(it); it.n = N0;
  const put = (n) => { it.n = n; ball.position.set(xOf(n), yOf(n) + 0.07, Z); };
  it.roll = (cb) => { if (it.busy) return false; const target = Math.round((it.n - lo) / step) * step + lo, a = it.n; it.play(1.6, (k) => put(a + (target - a) * ease(k)), () => { put(target); rd.set([`${N0.toLocaleString('en-IN')} ≈ ${target.toLocaleString('en-IN')}`], '#8be07a'); if (it.onRoll) it.onRoll(target); if (cb) cb(); }); return true; };
  it.tens = () => { step = 10; lo = 3600; build(); put(N0); rd.set([w_('nearest ten?')], '#ffd23f'); };
  it.reset = () => put(N0);
  it.say = (l, c) => rd.set(l, c);
  build(); put(N0); it.say([w_('nearest hundred?')], '#ffd23f');
  it.leverPath = floorLever;
  return done1(it, { height: 0.7, radius: 2.6 });
}
export function bindRoundHands(rh, lever, app, s = { roll: 1 }, done = {}) {
  pushKnob(lever, { path: () => rh.leverPath(), active: () => stepNow(app, s.roll) && !rh.busy && rh.n === 3682, keepVisible: () => app.runner.i === s.roll, press: () => rh.roll(() => done.roll && done.roll()) });
}

// ------------------------------------------------------------------ Class 4 Ch 11 Fun with Symmetry: a mirror completes the butterfly
export function mirrorButterfly(o = {}) {
  const it = new Item('jmirror4', { ...o, name: { en: 'Half butterfly and a mirror', hi: 'आधी तितली और दर्पण', hg: 'Aadhi titli aur mirror' } });
  const g = it.g, S = 0.3, w_ = o.W || ((k) => k);
  const halfT = tex(512, 512, (x) => { x.fillStyle = '#fbf8f0'; x.fillRect(0, 0, 512, 512); x.strokeStyle = 'rgba(80,120,200,0.35)'; x.lineWidth = 2; for (let i = 0; i <= 16; i++) { x.beginPath(); x.moveTo(i * 32, 0); x.lineTo(i * 32, 512); x.stroke(); x.beginPath(); x.moveTo(0, i * 32); x.lineTo(512, i * 32); x.stroke(); }
    // right half of a butterfly, body on the left edge
    x.fillStyle = '#ff8a1f'; x.beginPath(); x.moveTo(0, 230); x.bezierCurveTo(140, 40, 430, 60, 440, 200); x.bezierCurveTo(420, 270, 180, 260, 0, 250); x.fill();
    x.fillStyle = '#d93a2b'; x.beginPath(); x.moveTo(0, 262); x.bezierCurveTo(160, 270, 360, 330, 330, 430); x.bezierCurveTo(260, 470, 90, 380, 0, 300); x.fill();
    x.fillStyle = '#1d2733'; x.beginPath(); x.arc(300, 170, 28, 0, 7); x.fill(); x.fillStyle = '#ffffff'; x.beginPath(); x.arc(300, 170, 12, 0, 7); x.fill(); x.fillStyle = '#2a6fd1'; x.beginPath(); x.arc(220, 360, 22, 0, 7); x.fill();
    x.fillStyle = '#3a2a1a'; x.fillRect(0, 140, 14, 260); x.strokeStyle = '#3a2a1a'; x.lineWidth = 5; x.beginPath(); x.moveTo(6, 140); x.quadraticCurveTo(40, 80, 70, 70); x.stroke(); });
  const paper = new THREE.Mesh(new THREE.PlaneGeometry(S, S), new THREE.MeshStandardMaterial({ map: halfT, roughness: 0.85 })); paper.rotation.x = -Math.PI / 2; paper.position.set(S / 2, 0.002, -0.05); g.add(paper);
  const ghostM = new THREE.MeshStandardMaterial({ map: halfT, roughness: 0.85, transparent: true, opacity: 0 }); const ghost = new THREE.Mesh(new THREE.PlaneGeometry(S, S), ghostM); ghost.rotation.x = -Math.PI / 2; ghost.scale.x = -1; ghost.position.set(-S / 2, 0.003, -0.05); g.add(ghost);
  const blank = new THREE.Mesh(new THREE.PlaneGeometry(S, S), new THREE.MeshStandardMaterial({ color: 0xfbf8f0, roughness: 0.9 })); blank.rotation.x = -Math.PI / 2; blank.position.set(-S / 2, 0.001, -0.05); g.add(blank);
  const mirror = new THREE.Group(); const glass = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.14, S * 0.9), new THREE.MeshStandardMaterial({ color: 0xdfe8ee, roughness: 0.02, metalness: 1 })); glass.position.y = 0.07; mirror.add(glass);
  const frame = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.15, S * 0.92), M(0x5a3a1e, 0.6)); frame.position.set(0.004, 0.072, 0); mirror.add(frame); mirror.position.set(0, 0, -0.05); g.add(mirror);
  const rd = liveSign(0.07, 3.4); rd.position.set(0, 0.25, -0.3); g.add(rd);
  animator(it); it.placed = 0;
  const setM = (k) => { mirror.position.y = 0.25 * (1 - ease(k)); mirror.position.x = -0.25 * (1 - ease(k)); ghostM.opacity = Math.max(0, (k - 0.6) / 0.4) * 0.9; };
  it.place = (cb) => { if (it.busy || it.placed) return false; it.play(1.6, (k) => setM(k), () => { it.placed = 1; setM(1); rd.set([w_('line of symmetry')], '#8be07a'); if (cb) cb(); }); return true; };
  it.lift = async (tween) => { await tween(1.2, (k) => { mirror.position.y = 0.25 * ease(k); ghostM.opacity = 0.9 + 0.1 * k; }); ghostM.opacity = 1; ghostM.transparent = false; };
  it.say = (l, c) => rd.set(l, c);
  setM(0); it.say([w_('half a butterfly')], '#ffffff');
  it.leverPath = () => tableLever(g);
  return done1(it, { height: 0.15, radius: 0.35 });
}
export function bindMirrorHands(mb, lever, app, s = { place: 1 }, done = {}) {
  pushKnob(lever, { path: () => mb.leverPath(), active: () => stepNow(app, s.place) && !mb.busy && !mb.placed, keepVisible: () => app.runner.i === s.place, press: () => mb.place(() => done.placed && done.placed()) });
}

// ------------------------------------------------------------------ Class 4 Ch 12 Ticking Clocks: a station clock in 24-hour time
export function stationClock(o = {}) {
  const it = new Item('jstation4', { ...o, name: { en: 'Station clock and board', hi: 'स्टेशन की घड़ी और बोर्ड', hg: 'Station ki ghadi aur board' } });
  const g = it.g, C = V(-0.7, 2.3, -3.2), R = 0.32, w_ = o.W || ((k) => k);
  const faceT = tex(512, 512, (x) => { x.fillStyle = '#fbfaf6'; x.beginPath(); x.arc(256, 256, 250, 0, 7); x.fill(); x.strokeStyle = '#111'; x.lineCap = 'butt'; for (let m = 0; m < 60; m++) { const a = m * Math.PI / 30; x.lineWidth = m % 5 ? 4 : 12; const r1 = m % 5 ? 225 : 195; x.beginPath(); x.moveTo(256 + Math.sin(a) * r1, 256 - Math.cos(a) * r1); x.lineTo(256 + Math.sin(a) * 242, 256 - Math.cos(a) * 242); x.stroke(); }
    x.fillStyle = '#111'; x.font = `800 50px ${FONT}`; x.textAlign = 'center'; x.textBaseline = 'middle'; for (let h = 1; h <= 12; h++) { const a = h * Math.PI / 6; x.fillText(String(h), 256 + Math.sin(a) * 160, 258 - Math.cos(a) * 160); } });
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 2.0, 12), M(0x2b3a4a, 0.5, 0.4)); post.position.set(C.x, 1.0, C.z); g.add(post);
  const body = new THREE.Mesh(new THREE.CylinderGeometry(R + 0.03, R + 0.03, 0.1, 48), M(0x1d2733, 0.4, 0.5)); body.rotation.x = Math.PI / 2; body.position.copy(C); g.add(body);
  const face = new THREE.Mesh(new THREE.CircleGeometry(R, 48), new THREE.MeshStandardMaterial({ map: faceT, roughness: 0.4 })); face.position.copy(C).add(V(0, 0, 0.052)); g.add(face);
  const hand = (len, w2) => { const gg = new THREE.Group(); const m = new THREE.Mesh(new THREE.BoxGeometry(w2, len, 0.006), M(0x111111, 0.4)); m.position.y = len / 2 - 0.02; gg.add(m); gg.position.copy(C).add(V(0, 0, 0.058)); g.add(gg); return gg; };
  const hh = hand(R * 0.55, 0.026), mh = hand(R * 0.85, 0.016);
  const boardT = canvasTex(1024, 384, () => {}); const board = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.6), new THREE.MeshBasicMaterial({ map: boardT, toneMapped: false })); board.position.set(0.7, 2.2, -3.25); g.add(board);
  const boardFrame = new THREE.Mesh(new THREE.BoxGeometry(1.68, 0.68, 0.06), M(0x1d2733, 0.5, 0.4)); boardFrame.position.set(0.7, 2.2, -3.29); g.add(boardFrame);
  [-0.05, 1.45].forEach((x) => { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.9, 8), M(0x2b3a4a, 0.5, 0.4)); p.position.set(x, 0.95, -3.3); g.add(p); });
  const rd = liveSign(0.2, 3.4); rd.position.set(0, 1.25, -3.0); g.add(rd);
  it.min = 21 * 60 + 30; it.start = it.min;
  const fmt = (m) => { const d = Math.floor(m / 1440), mm = ((m % 1440) + 1440) % 1440, h = Math.floor(mm / 60), mi = mm % 60; return { h24: `${String(h).padStart(2, '0')}:${String(mi).padStart(2, '0')}`, h12: `${h % 12 || 12}:${String(mi).padStart(2, '0')} ${h < 12 ? 'a.m.' : 'p.m.'}`, d }; };
  const paintBoard = () => { const x = boardT.image.getContext('2d'); x.fillStyle = '#0b0f14'; x.fillRect(0, 0, 1024, 384); x.font = `700 40px ${FONT}`; x.fillStyle = '#9fd17a'; x.fillText(w_('DEPARTS'), 40, 70); x.fillText(w_('ARRIVES'), 540, 70);
    x.font = `800 110px monospace`; x.fillStyle = '#ffb020'; x.fillText('21:30', 40, 200); x.fillText(it.min >= it.start + 165 ? '00:15' : '--:--', 540, 200); x.font = `700 40px ${FONT}`; x.fillStyle = '#e6e6e6'; x.fillText('9:30 p.m.', 40, 270); if (it.min >= it.start + 165) x.fillText(`12:15 a.m. (${w_('next day')})`, 540, 270);
    x.fillStyle = '#7ad0ff'; x.fillText(`${w_('Journey')}: 2 h 45 min`, 40, 350); boardT.needsUpdate = true; };
  it.setMin = (m) => { it.min = m; mh.rotation.z = -(m % 60) * Math.PI / 30; hh.rotation.z = -((m / 60) % 12) * Math.PI / 6; const f = fmt(m); rd.set([`${f.h24}  ·  ${f.h12}${f.d ? ' (+1)' : ''}`], m >= it.start + 165 ? '#8be07a' : '#ffd23f'); paintBoard(); if (it.onMin) it.onMin(m); };
  it.say = (l, c) => rd.set(l, c);
  it.setMin(it.start);
  it.knobPath = floorKnob;
  return done1(it, { height: 2.5, radius: 2 });
}
export function bindStationHands(sc, knob, app, s = { go: 1 }, done = {}) {
  const sync = slideKnob(knob, { path: () => sc.knobPath(), active: () => stepNow(app, s.go), keepVisible: () => app.runner.i === s.go, k: () => clamp01((sc.min - sc.start) / 165),
    set: (k) => { sc.setMin(sc.start + Math.round(clamp01(k > 0.97 ? 1 : k) * 165)); if (sc.min >= sc.start + 165 && done.arrive) done.arrive(); } });
  const s0 = sc.setMin; sc.setMin = (m) => { s0(m); sync(); };
}

// ------------------------------------------------------------------ Class 4 Ch 13 The Transport Museum: ticket bundles, × 10 and × 100
export function ticketBundles(o = {}) {
  const it = new Item('jticket4', { ...o, name: { en: 'Museum tickets', hi: 'संग्रहालय के टिकट', hg: 'Museum ke ticket' } });
  const g = it.g, w_ = o.W || ((k) => k);
  const tkT = tex(256, 96, (x) => { x.fillStyle = '#f7e08a'; x.fillRect(0, 0, 256, 96); x.strokeStyle = '#b8322f'; x.lineWidth = 4; x.setLineDash([8, 6]); x.strokeRect(6, 6, 244, 84); x.setLineDash([]); x.fillStyle = '#7a2a1a'; x.font = `800 26px ${FONT}`; x.textAlign = 'center'; x.fillText(w_('TRANSPORT MUSEUM'), 128, 40); x.font = `900 34px ${FONT}`; x.fillText('₹10', 128, 80); });
  const tkM = new THREE.MeshStandardMaterial({ map: tkT, roughness: 0.8 }), sideM = M(0xf7e08a, 0.8);
  const bundleG = new THREE.BoxGeometry(0.1, 0.012, 0.04); const bundles = []; for (let i = 0; i < 12; i++) { const b = new THREE.Mesh(bundleG, [sideM, sideM, tkM, sideM, sideM, sideM]); b.visible = false; b.castShadow = true; g.add(b); const band = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.0135, 0.041), M(0xd8352a, 0.5)); b.add(band); bundles.push(b); }
  const rd = liveSign(0.065, 3.8); rd.position.set(0, 0.2, -0.28); g.add(rd);
  animator(it); it.n = 0;
  const spot = (i) => V(-0.25 + (i % 5) * 0.115, 0.006 + Math.floor(i / 10) * 0.013, -0.15 + Math.floor((i % 10) / 5) * 0.06);
  it.add1 = (cb) => { if (it.busy || it.n >= 10) return false; const b = bundles[it.n], to = spot(it.n), from = V(0.35, 0.12, 0.2); b.visible = true;
    it.play(0.45, (k) => { b.position.lerpVectors(from, to, ease(k)); b.position.y += Math.sin(k * Math.PI) * 0.04; }, () => { it.n++; rd.set([`${it.n} × 10 = ${it.n * 10} ${w_('tickets')}`, `${it.n * 10} × ₹10 = ₹${it.n * 100}`], ['#ffd23f', '#8be07a']); if (cb) cb(); }); return true; };
  it.say = (l, c) => rd.set(l, c);
  it.say([w_('10 tickets in a bundle')], '#ffffff');
  it.leverPath = () => tableLever(g);
  return done1(it, { height: 0.05, radius: 0.45 });
}
export function bindTicketHands(tb, lever, app, s = { add: 1 }, done = {}) {
  pushKnob(lever, { path: () => tb.leverPath(), active: () => stepNow(app, s.add) && !tb.busy && tb.n < 10, keepVisible: () => app.runner.i === s.add, press: () => tb.add1(() => { if (tb.n >= 10 && done.all) done.all(); }) });
}

// ------------------------------------------------------------------ Class 4 Ch 14 Data Handling: how we come to school
// A bar graph board lies on the classroom floor with four columns: walk, cycle, bus, auto. Each push of the lever adds the
// votes of one row of children as blocks on the bars.
export function schoolBars(o = {}) {
  const it = new Item('jbars4', { ...o, name: { en: 'Bar graph with blocks', hi: 'ब्लॉकों से दंड आलेख', hg: 'Blocks se bar graph' } });
  const g = it.g, w_ = o.W || ((k) => k), CAT = ['walk', 'cycle', 'bus', 'auto'], COL = [0x2f9a4a, 0x2a6fd1, 0xf2b632, 0xd93a2b];
  const ROWS = [[2, 1, 2, 1], [2, 2, 2, 0], [1, 1, 3, 1], [2, 1, 2, 1]]; // votes from each row of children: walk 7, cycle 5, bus 9, auto 3
  const boardT = tex(512, 512, (x) => { x.fillStyle = '#fbf8f0'; x.fillRect(0, 0, 512, 512); x.strokeStyle = 'rgba(80,120,200,0.35)'; x.lineWidth = 2; for (let i = 0; i <= 10; i++) { x.beginPath(); x.moveTo(60, 470 - i * 44); x.lineTo(500, 470 - i * 44); x.stroke(); }
    x.fillStyle = '#1d2733'; x.font = `700 22px ${FONT}`; for (let i = 0; i <= 10; i++) x.fillText(String(i), 24, 478 - i * 44); x.lineWidth = 4; x.strokeStyle = '#1d2733'; x.beginPath(); x.moveTo(60, 20); x.lineTo(60, 470); x.lineTo(500, 470); x.stroke(); });
  const board = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.6), new THREE.MeshStandardMaterial({ map: boardT, roughness: 0.85 })); board.rotation.x = -Math.PI / 2; board.position.set(0, 0.004, -2.1); g.add(board);
  const BS = 0.13; const blocks = []; const blockG = new THREE.BoxGeometry(BS * 0.9, BS * 0.6, 0.1375 * 0.94);
  const colX = (c) => -0.48 + c * 0.3;
  const labels = CAT.map((k, c) => { const t = tag(w_(k), '#ffffff', 0.1); t.position.set(colX(c) + 0.1, 0.08, -1.28); g.add(t); return t; }); void labels;
  const cnt = CAT.map((k, c) => { const t = tag('0', '#ffd23f', 0.09); t.position.set(colX(c) + 0.1, 0.25, -1.45); g.add(t); return t; });
  const rd = liveSign(0.26, 3.4); rd.position.set(0, 0.95, -3.0); g.add(rd);
  animator(it); it.row = 0; it.v = [0, 0, 0, 0];
  const place = (c, k) => V(colX(c) + 0.1, BS * 0.3, -1.431 - (k + 0.5) * 0.1375);
  it.addRow = (cb) => { if (it.busy || it.row >= ROWS.length) return false; const add = ROWS[it.row], made = [];
    add.forEach((n, c) => { for (let j = 0; j < n; j++) { const m = new THREE.Mesh(blockG, M(COL[c], 0.5)); m.castShadow = true; m.userData.to = place(c, it.v[c] + j); g.add(m); blocks.push(m); made.push(m); } it.v[c] += n; });
    it.play(0.8, (k) => { made.forEach((m) => { const to = m.userData.to; m.position.set(to.x, to.y + (1 - ease(k)) * 0.6, to.z); }); }, () => { it.row++; it.v.forEach((v, c) => cnt[c].setText(String(v))); rd.set([`${it.v.reduce((s, x) => s + x, 0)} ${w_('children')}`], '#ffd23f'); if (cb) cb(); }); return true; };
  it.say = (l, c) => rd.set(l, c);
  it.say([w_('How do you come to school?')], '#ffffff');
  it.leverPath = floorLever;
  return done1(it, { height: 0.2, radius: 1.2 });
}
export function bindBarHands(sb, lever, app, s = { vote: 1 }, done = {}) {
  pushKnob(lever, { path: () => sb.leverPath(), active: () => stepNow(app, s.vote) && !sb.busy && sb.row < 4, keepVisible: () => app.runner.i === s.vote, press: () => sb.addRow(() => { if (sb.row >= 4 && done.all) done.all(); }) });
}
