// DUET Science Lab 360, physics in real places, batch PW2 (Classes 8, 9 and 10): pulling a vegetable handcart with a
// spring balance (friction), a brick pressed into sand on each face (pressure), drawing water from a village well over
// a pulley (work), an echo from a wall across the playground (speed of sound), and a coin in a bucket that seems to
// rise as water is poured in (refraction). Real size, drawn here; the places are the Maths Lab's 360° photos.
import * as THREE from 'three';
import { Item } from './apparatus.js';
import { canvasTex } from './mats.js';
import { clamp01, ease } from './mathlab2.js';
import { pushKnob } from './mathworld3.js';
import { liveSign } from './mathworld4.js';
import { slideKnob } from './mathworld5.js';
import { tag, animator, woodTex, steelMat, M, rnd, tex, noHit, stepNow, V, FONT } from './mathworld_j1.js';

const DEG = Math.PI / 180;
const TW = (g) => (x, y, z) => g.localToWorld(V(x, y, z));
const tableSlide = (g) => [TW(g)(-0.3, 0.1, 0.24), TW(g)(0.3, 0.1, 0.24)];
const floorLever = () => [V(-0.45, 1.0, -0.3), V(-0.45, 1.0, -0.05)];
const floorKnob = () => [V(-0.45, 1.0, -0.42), V(0.45, 1.0, -0.42)];
const done1 = (it, o) => { noHit(it.g); it.noGrab = true; it.noPhys = true; it.base = 0; Object.assign(it, o); return it; };
const rod = (a, b, r, mat, seg = 10) => { const d = b.clone().sub(a), m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, d.length(), seg), mat); m.position.copy(a).add(b).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize()); m.castShadow = true; return m; };
const brickTex = (seed = 5, rep = [1, 1]) => tex(256, 256, (x) => { const r = rnd(seed); x.fillStyle = '#8a8070'; x.fillRect(0, 0, 256, 256); for (let row = 0; row < 8; row++) for (let c = -1; c < 5; c++) { const off = row % 2 ? 32 : 0; const v = 0.75 + r() * 0.3; x.fillStyle = `rgb(${Math.round(168 * v)},${Math.round(78 * v)},${Math.round(52 * v)})`; x.fillRect(c * 64 + off + 2, row * 32 + 2, 60, 28); } }, rep);
// a round dial with a needle (spring balance, scale): set(v) turns the needle over 0 … max
function dial(max, unit, step, label) {
  const g = new THREE.Group(); const T = tex(256, 256, (x) => { x.fillStyle = '#fbfaf6'; x.beginPath(); x.arc(128, 128, 126, 0, 7); x.fill(); x.strokeStyle = '#111'; x.fillStyle = '#111'; x.textAlign = 'center'; x.textBaseline = 'middle';
    for (let v = 0; v <= max; v += step / 5) { const a = (-135 + v / max * 270) * DEG, big = Math.abs(v / step - Math.round(v / step)) < 1e-6; x.lineWidth = big ? 4 : 2; x.beginPath(); x.moveTo(128 + Math.sin(a) * (big ? 96 : 106), 128 - Math.cos(a) * (big ? 96 : 106)); x.lineTo(128 + Math.sin(a) * 118, 128 - Math.cos(a) * 118); x.stroke();
      if (big) { x.font = `800 22px ${FONT}`; x.fillText(String(Math.round(v)), 128 + Math.sin(a) * 76, 130 - Math.cos(a) * 76); } }
    x.font = `800 24px ${FONT}`; x.fillText(unit, 128, 180); if (label) { x.font = `700 16px ${FONT}`; x.fillText(label, 128, 205); } });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.04, 40), M(0xc0392b, 0.4, 0.2)); body.rotation.x = Math.PI / 2; g.add(body);
  const face = new THREE.Mesh(new THREE.CircleGeometry(0.088, 40), new THREE.MeshBasicMaterial({ map: T, toneMapped: false })); face.position.z = 0.021; g.add(face);
  const nd = new THREE.Group(); nd.position.z = 0.023; g.add(nd); const nm = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.075, 0.002), new THREE.MeshBasicMaterial({ color: 0x111111 })); nm.position.y = 0.03; nd.add(nm);
  g.set = (v) => { nd.rotation.z = -(-135 + clamp01(v / max) * 270) * DEG; }; g.set(0); return g;
}

// ------------------------------------------------------------------ Class 8 Ch 5 Exploring Forces: pulling a handcart (friction)
// A vegetable seller's handcart stands in the school courtyard. A rope from its front runs through a big spring balance
// to your hand. Slide to pull harder: the cart does not move until the pull beats friction (25 N empty); then it rolls.
// Loaded with four sacks of onions, it needs 70 N.
export function handcart(o = {}) {
  const it = new Item('pcart8', { ...o, name: { en: 'Handcart and spring balance', hi: 'ठेला और कमानीदार तुला', hg: 'Thela aur spring balance' } });
  const g = it.g, w_ = o.W || ((k) => k), Z = -2.9;
  const cart = new THREE.Group(); cart.position.set(0, 0, Z); g.add(cart);
  const plank = new THREE.MeshStandardMaterial({ map: woodTex('#9a6a3a', 91), roughness: 0.65 }), iron = M(0x3a3f45, 0.5, 0.6);
  const bed = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.05, 1.5), plank); bed.position.y = 0.62; bed.castShadow = true; cart.add(bed);
  [[-0.45, 0], [0.45, 0]].forEach(([x]) => { const rail = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.12, 1.5), plank); rail.position.set(x * 0.98, 0.7, 0); cart.add(rail); });
  cart.add(rod(V(-0.3, 0.64, 0.75), V(-0.3, 0.9, 1.25), 0.02, iron)); cart.add(rod(V(0.3, 0.64, 0.75), V(0.3, 0.9, 1.25), 0.02, iron)); cart.add(rod(V(-0.32, 0.9, 1.25), V(0.32, 0.9, 1.25), 0.022, iron));
  const wheels = []; [[-0.48, -0.5], [0.48, -0.5], [-0.48, 0.45], [0.48, 0.45]].forEach(([x, z]) => { const w = new THREE.Group(); w.position.set(x, 0.3, z); cart.add(w);
    const tyre = new THREE.Mesh(new THREE.TorusGeometry(0.27, 0.03, 10, 32), M(0x1b1b1b, 0.85)); tyre.rotation.y = Math.PI / 2; w.add(tyre);
    for (let s = 0; s < 12; s++) { const sp = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.5, 4), M(0xb8bec6, 0.3, 0.8)); sp.rotation.x = s * Math.PI / 12; w.add(sp); }
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.08, 12), iron); hub.rotation.z = Math.PI / 2; w.add(hub); wheels.push(w); });
  cart.add(rod(V(-0.5, 0.3, -0.5), V(0.5, 0.3, -0.5), 0.015, iron)); cart.add(rod(V(-0.5, 0.3, 0.45), V(0.5, 0.3, 0.45), 0.015, iron));
  // vegetables on the empty cart: a few tomatoes and a basket
  const basket = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.12, 0.12, 20, 1, true), new THREE.MeshStandardMaterial({ color: 0xb98a4e, roughness: 0.9, side: THREE.DoubleSide })); basket.position.set(-0.2, 0.71, -0.4); cart.add(basket);
  for (let i = 0; i < 9; i++) { const t = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 10), M(0xd9302a, 0.35)); t.position.set(-0.2 + Math.cos(i * 0.7) * 0.08 * (i % 3) / 2, 0.75 + (i > 5 ? 0.03 : 0), -0.4 + Math.sin(i * 0.7) * 0.08 * (i % 3) / 2); cart.add(t); }
  // sacks of onions (shown when loaded)
  const sackT = tex(128, 128, (x) => { x.fillStyle = '#d8c9a0'; x.fillRect(0, 0, 128, 128); x.strokeStyle = 'rgba(110,90,50,0.45)'; for (let i = 0; i < 128; i += 5) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, 128); x.stroke(); x.beginPath(); x.moveTo(0, i); x.lineTo(128, i); x.stroke(); } x.fillStyle = 'rgba(160,60,90,0.5)'; for (let i = 0; i < 30; i++) { x.beginPath(); x.arc((i * 37) % 128, (i * 53) % 128, 6, 0, 7); x.fill(); } });
  const sacks = []; for (let i = 0; i < 4; i++) { const sg = new THREE.SphereGeometry(0.2, 16, 12); sg.scale(1, 0.6, 1.3); const s = new THREE.Mesh(sg, new THREE.MeshStandardMaterial({ map: sackT, roughness: 0.95 })); s.position.set(i % 2 ? 0.2 : -0.2, 0.76 + Math.floor(i / 2) * 0.2, i < 2 ? 0.2 : 0.0); s.castShadow = true; s.visible = false; cart.add(s); sacks.push(s); }
  // rope and spring balance
  const sb = dial(150, 'N', 25, w_('spring balance')); sb.position.set(0, 1.0, -0.8); sb.rotation.x = -0.1; g.add(sb);
  const ropeM = M(0xc9a96e, 0.9); let rope = null;
  const drawRope = () => { if (rope) { g.remove(rope); rope.geometry.dispose(); } rope = rod(V(0, 0.9, cart.position.z + 1.25), V(0, 0.92, -0.86), 0.008, ropeM, 6); g.add(rope); };
  drawRope();
  const rd = liveSign(0.2, 3.6); rd.position.set(0, 1.75, -2.6); g.add(rd);
  animator(it); it.k = 0; it.loaded = false; it.moved = 0; it.F = 0;
  const need = () => (it.loaded ? 70 : 25);
  it.setK = (k) => { if (it.busy) return; it.k = k; it.F = Math.round(k * 100); sb.set(it.F); const n = need();
    if (it.F >= n) { it.F = n; sb.set(n); it.roll(); return; }
    rd.set([`${w_('Pull')}: ${it.F} N`, w_('the cart does not move')], ['#ffd23f', '#ffffff']); if (it.onK) it.onK(k); };
  it.roll = (cb) => { if (it.busy) return false; const n = need(), z0 = cart.position.z; sb.set(n);
    it.play(1.6, (k) => { const e = ease(k); cart.position.z = z0 + 0.45 * e; wheels.forEach((w) => { w.rotation.x = (cart.position.z - Z) / 0.3; }); drawRope(); sb.set(k < 0.85 ? n * 0.8 : n * 0.8 * (1 - (k - 0.85) / 0.15)); },
      () => { it.moved++; sb.set(0); rd.set([`${w_('It starts moving at')} ${n} N`, w_(it.loaded ? 'loaded cart' : 'empty cart')], ['#8be07a', '#ffffff']); if (cb) cb(); if (it.onMoved) it.onMoved(); }); return true; };
  it.load = (cb) => { if (it.busy) return false; it.play(1.4, (k) => { sacks.forEach((s, i) => { const e = clamp01((k - i * 0.15) / 0.4); s.visible = e > 0; s.scale.setScalar(Math.max(0.01, e)); }); },
    () => { it.loaded = true; cart.position.z = Z; wheels.forEach((w) => { w.rotation.x = 0; }); drawRope(); rd.set([w_('4 sacks of onions loaded')], '#ffffff'); if (cb) cb(); }); return true; };
  it.pullTo = (F, cb) => { let f = 0; const step = () => { if (it.busy) return; f = Math.min(F, f + 1); it.F = f; sb.set(f); rd.set([`${w_('Pull')}: ${f} N`], '#ffd23f'); if (f < F) setTimeout(step, 25); else it.roll(cb); }; step(); };
  it.say = (l, c) => rd.set(l, c);
  it.say([w_('Pull slowly harder')], '#ffffff');
  it.knobPath = floorKnob;
  return done1(it, { height: 1.2, radius: 1.5 });
}
export function bindCartHands(hc, knob, app, s = { pull: 1 }, done = {}) {
  const sync = slideKnob(knob, { path: () => hc.knobPath(), active: () => stepNow(app, s.pull) && hc.moved === 0 && !hc.busy, keepVisible: () => app.runner.i === s.pull, k: () => hc.k,
    set: (k) => { if (hc.busy || hc.moved > 0) return; hc.onMoved = () => done.moved && done.moved(); hc.setK(clamp01(k)); } });
  const s0 = hc.setK; hc.setK = (k) => { s0(k); sync(); };
}

// ------------------------------------------------------------------ Class 8 Ch 6 Pressure: a brick on sand, on each face
// A sand pit on the playground and a clay brick (23 × 11 × 7.5 cm, 3 kg, so it weighs about 30 N). Each push of the
// lever presses it into the sand on a different face and lifts it: the smaller the face, the deeper the dent.
export function brickSand(o = {}) {
  const it = new Item('pbrick8', { ...o, name: { en: 'Brick and sand pit', hi: 'ईंट और रेत का गड्ढा', hg: 'Eent aur ret ka gaddha' } });
  const g = it.g, w_ = o.W || ((k) => k), Z = -1.25, SY = 0.18;
  const frameM = new THREE.MeshStandardMaterial({ map: woodTex('#6b3f1d', 37), roughness: 0.6 });
  [[0, -0.47, 1.6, 0.06], [0, 0.47, 1.6, 0.06]].forEach(([x, dz, w, d]) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, 0.22, d), frameM); b.position.set(x, 0.11, Z + dz); g.add(b); });
  [-0.77, 0.77].forEach((x) => { const b = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.22, 0.88), frameM); b.position.set(x, 0.11, Z); g.add(b); });
  const sandT = tex(256, 256, (x) => { const r = rnd(8); x.fillStyle = '#d9c08a'; x.fillRect(0, 0, 256, 256); for (let i = 0; i < 6000; i++) { const v = r(); x.fillStyle = v < 0.5 ? 'rgba(150,120,70,0.35)' : 'rgba(250,235,200,0.4)'; x.fillRect(r() * 256, r() * 256, 1.5, 1.5); } }, [3, 2]);
  const sandM = new THREE.MeshStandardMaterial({ map: sandT, roughness: 1 });
  const sand = new THREE.Mesh(new THREE.BoxGeometry(1.48, 0.02, 0.88), sandM); sand.position.set(0, SY - 0.01, Z); sand.receiveShadow = true; g.add(sand);
  const brickM = new THREE.MeshStandardMaterial({ map: tex(128, 64, (x) => { const r = rnd(3); x.fillStyle = '#a8492e'; x.fillRect(0, 0, 128, 64); for (let i = 0; i < 400; i++) { x.fillStyle = `rgba(${r() < 0.5 ? '60,20,10' : '230,150,110'},${r() * 0.25})`; x.fillRect(r() * 128, r() * 64, 2, 2); } }), roughness: 0.85 });
  const B = [0.23, 0.075, 0.11]; // length (x), height (y), width (z) when lying flat
  const brick = new THREE.Mesh(new THREE.BoxGeometry(B[0], B[1], B[2]), brickM); brick.castShadow = true; g.add(brick);
  const HOME = V(0.55, SY + 0.35, Z + 0.62);
  const POSES = [{ x: -0.45, rot: [0, 0, 0], face: [0.23, 0.11], h: 0.075, name: 'lying flat' }, { x: 0.0, rot: [Math.PI / 2, 0, 0], face: [0.23, 0.075], h: 0.11, name: 'on its side' }, { x: 0.45, rot: [0, 0, Math.PI / 2], face: [0.075, 0.11], h: 0.23, name: 'standing on end' }];
  const W = 30; POSES.forEach((p) => { p.A = p.face[0] * p.face[1]; p.P = W / p.A; p.depth = 0.006 * p.P / (W / (0.23 * 0.11)); });
  brick.position.copy(HOME);
  // a dent: darker towards its walls, darker the deeper it is
  const dentM = (d) => new THREE.MeshBasicMaterial({ map: tex(128, 128, (x) => { const k = Math.min(1, d / 0.02); x.fillStyle = `rgba(80,60,30,${0.35 + 0.45 * k})`; x.fillRect(0, 0, 128, 128); const gr = x.createRadialGradient(64, 64, 10, 64, 64, 90); gr.addColorStop(0, 'rgba(200,170,120,0.55)'); gr.addColorStop(1, 'rgba(40,28,12,0.6)'); x.fillStyle = gr; x.fillRect(0, 0, 128, 128); }), transparent: true, depthWrite: false });
  const rd = liveSign(0.13, 3.6); rd.position.set(0, 1.05, Z - 0.55); g.add(rd);
  const tags = [];
  animator(it); it.n = 0;
  it.press = (cb) => { if (it.busy || it.n >= 3) return false; const p = POSES[it.n], from = brick.position.clone(), r0 = brick.rotation.clone(), top = V(p.x, SY + 0.3, Z), down = V(p.x, SY + p.h / 2 - p.depth, Z);
    let hole = null;
    it.play(2.6, (k) => {
      if (k < 0.35) { const e = ease(k / 0.35); brick.position.lerpVectors(from, top, e); brick.position.y += Math.sin(e * Math.PI) * 0.1; brick.rotation.set(r0.x + (p.rot[0] - r0.x) * e, 0, r0.z + (p.rot[2] - r0.z) * e); }
      else if (k < 0.6) { const e = ease((k - 0.35) / 0.25); brick.position.lerpVectors(top, down, e); brick.rotation.set(p.rot[0], 0, p.rot[2]);
        if (e > 0.85 && !hole) { hole = new THREE.Mesh(new THREE.PlaneGeometry(p.face[0] * 1.02, p.face[1] * 1.02), dentM(p.depth)); hole.rotation.x = -Math.PI / 2; hole.position.set(p.x, SY + 0.002, Z); g.add(hole);
          hole.renderOrder = 1; } }
      else { const e = ease((k - 0.6) / 0.4); brick.position.lerpVectors(down, V(p.x, SY + 0.3, Z + 0.25), e); } },
    () => { it.n++; const t = tag(`${(p.P).toFixed(0)} Pa · ${(p.depth * 100).toFixed(1)} cm`, '#ffd23f', 0.06); t.position.set(p.x, SY + 0.08, Z + 0.25); g.add(t); tags.push(t);
      rd.set([`${w_(p.name)}: 30 N ÷ ${(p.A * 10000).toFixed(1)} cm² = ${p.P.toFixed(0)} Pa`], it.n >= 3 ? '#8be07a' : '#ffd23f'); if (cb) cb(); }); return true; };
  it.say = (l, c) => rd.set(l, c);
  it.say([w_('The same brick, 30 N, on three faces')], '#ffffff');
  it.leverPath = floorLever;
  return done1(it, { height: 0.5, radius: 1.2 });
}
export function bindBrickHands(bs, lever, app, s = { press: 1 }, done = {}) {
  pushKnob(lever, { path: () => bs.leverPath(), active: () => stepNow(app, s.press) && !bs.busy && bs.n < 3, keepVisible: () => app.runner.i === s.press, press: () => bs.press(() => { if (bs.n >= 3 && done.all) done.all(); }) });
}

// ------------------------------------------------------------------ Class 9 Ch 7 Work, Energy and Simple Machines: lifting a bucket to the roof
// At a house being built, a pulley hangs from a steel beam above the first-floor roof, 5 m up. A bucket of sand (10 kg)
// stands on the ground below it. Slide to pull the rope: the bucket rises 5 m and the work done (force × distance) adds up.
export function roofPulley(o = {}) {
  const it = new Item('ppulley9', { ...o, name: { en: 'Pulley, rope and bucket', hi: 'घिरनी, रस्सी और बाल्टी', hg: 'Ghirni, rassi aur baalti' } });
  const g = it.g, w_ = o.W || ((k) => k), ZF = -2.2, SLAB = 5.0, BX = -0.15, PY = 6.25;
  const conT = tex(128, 128, (x) => { const r = rnd(12); x.fillStyle = '#a7a39b'; x.fillRect(0, 0, 128, 128); for (let i = 0; i < 900; i++) { x.fillStyle = `rgba(${r() < 0.5 ? '70,70,65' : '210,205,195'},${r() * 0.3})`; x.fillRect(r() * 128, r() * 128, 2, 2); } }, [1, 4]);
  const conM = new THREE.MeshStandardMaterial({ map: conT, roughness: 0.9 });
  [[-1.6, ZF - 0.15], [1.6, ZF - 0.15], [-1.6, ZF - 3.0], [1.6, ZF - 3.0]].forEach(([x, z]) => { const c = new THREE.Mesh(new THREE.BoxGeometry(0.3, SLAB + 0.2, 0.3), conM); c.position.set(x, (SLAB + 0.2) / 2, z); c.castShadow = true; g.add(c); });
  const slab = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.2, 3.3), conM); slab.position.set(0, SLAB + 0.1, ZF - 1.55); slab.castShadow = true; g.add(slab);
  const wall = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2.6, 0.23), new THREE.MeshStandardMaterial({ map: brickTex(5, [5, 4]), roughness: 0.85 })); wall.position.set(0, 1.3, ZF - 3.0); g.add(wall);
  const steel = M(0x3a3f45, 0.45, 0.7);
  g.add(rod(V(0.6, SLAB + 0.2, ZF - 1.2), V(0.6, PY + 0.25, ZF - 1.2), 0.05, steel)); g.add(rod(V(0.6, PY + 0.25, ZF - 1.2), V(0.6, PY + 0.25, ZF + 0.3), 0.045, steel)); g.add(rod(V(0.6, PY + 0.25, ZF + 0.3), V(0.0, PY + 0.25, ZF + 0.3), 0.04, steel));
  const pul = new THREE.Group(); pul.position.set(0, PY, ZF + 0.3); g.add(pul);
  const spin = new THREE.Group(); pul.add(spin);
  spin.add(new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.03, 10, 32), M(0x4a4f55, 0.45, 0.7)));
  for (let s2 = 0; s2 < 6; s2++) { const sp = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.28, 0.012), M(0x4a4f55, 0.45, 0.7)); sp.rotation.z = s2 * Math.PI / 6; spin.add(sp); }
  [-1, 1].forEach((s2) => { const cheek = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.3, 0.008), M(0x2b2f35, 0.5, 0.6)); cheek.position.set(0, 0.12, s2 * 0.045); pul.add(cheek); });
  const sandT = tex(128, 128, (x) => { const r = rnd(8); x.fillStyle = '#c9ad78'; x.fillRect(0, 0, 128, 128); for (let i = 0; i < 1500; i++) { x.fillStyle = r() < 0.5 ? 'rgba(120,95,55,0.35)' : 'rgba(240,225,190,0.4)'; x.fillRect(r() * 128, r() * 128, 1.5, 1.5); } });
  const pile = new THREE.Mesh(new THREE.ConeGeometry(0.7, 0.45, 24), new THREE.MeshStandardMaterial({ map: sandT, roughness: 1 })); pile.position.set(-1.1, 0.22, ZF + 0.6); g.add(pile);
  const bucket = new THREE.Group(); g.add(bucket);
  const bkM = M(0x2b2f35, 0.5, 0.3); bkM.side = THREE.DoubleSide;
  const bk = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.13, 0.26, 28, 1, true), bkM); bk.position.y = 0.13; bk.castShadow = true; bucket.add(bk);
  const bs = new THREE.Mesh(new THREE.CircleGeometry(0.165, 28), new THREE.MeshStandardMaterial({ map: sandT, roughness: 1 })); bs.rotation.x = -Math.PI / 2; bs.position.y = 0.23; bucket.add(bs);
  const bh = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.006, 6, 24, Math.PI), M(0x8a9097, 0.3, 0.8)); bh.position.y = 0.26; bucket.add(bh);
  const ropeM = M(0xc9a96e, 0.9); let ropeL = null, ropeR = null; const R = 0.15;
  const pullEnd = () => V(0.45, 1.0, -0.55);
  const drawRope = () => { [ropeL, ropeR].forEach((r) => { if (r) { g.remove(r); r.geometry.dispose(); } });
    ropeL = rod(V(-R, PY, ZF + 0.3), V(-R, bucket.position.y + 0.4, ZF + 0.3), 0.008, ropeM, 6); ropeR = rod(V(R, PY, ZF + 0.3), pullEnd(), 0.008, ropeM, 6); g.add(ropeL); g.add(ropeR); };
  const hTag = tag('0 m', '#ffd23f', 0.22); g.add(hTag);
  const slabT = tag(`${w_('roof')} 5 m`, '#ffffff', 0.22); slabT.position.set(-1.9, SLAB + 0.4, ZF + 0.2); g.add(slabT);
  const rd = liveSign(0.3, 3.6); rd.position.set(0, 3.0, ZF - 0.3); g.add(rd);
  it.k = 0; const F = 98;
  it.setK = (k) => { it.k = k; const y = SLAB * k + (k > 0.98 ? 0.25 * (k - 0.98) / 0.02 : 0); bucket.position.set(-R, y, ZF + 0.3); spin.rotation.z = -k * SLAB / R; drawRope();
    const h = SLAB * k; hTag.setText(`${h.toFixed(1)} m`); hTag.position.set(-0.75, y + 0.3, ZF + 0.3);
    rd.set([`${w_('Force')} 98 N × ${h.toFixed(1)} m = ${Math.round(F * h)} J`], k >= 1 - 1e-6 ? '#8be07a' : '#ffd23f'); if (it.onK) it.onK(k); };
  it.say = (l, c) => rd.set(l, c);
  it.setK(0); it.say(['10 kg × 9.8 m/s² = 98 N'], '#ffffff');
  it.knobPath = floorKnob;
  return done1(it, { height: 6.5, radius: 2.5 });
}
export function bindPulleyHands(wp, knob, app, s = { pull: 1 }, done = {}) {
  const sync = slideKnob(knob, { path: () => wp.knobPath(), active: () => stepNow(app, s.pull), keepVisible: () => app.runner.i === s.pull, k: () => wp.k,
    set: (k) => { const kk = clamp01(k > 0.98 ? 1 : k); if (kk > wp.k) wp.setK(kk); if (wp.k >= 1 - 1e-6 && done.up) done.up(); } });
  const s0 = wp.setK; wp.setK = (k) => { s0(k); sync(); };
}

// ------------------------------------------------------------------ Class 9 Ch 10 Sound Waves: an echo from a wall 34 m away
// A tall brick wall stands across the playground, 34 m from you. Push the lever to clap: the sound spreads out, reaches the
// wall, reflects and comes back. It is shown slowed down 25 times; the stopwatch shows the real time, 0.20 s.
export function echoWall(o = {}) {
  const it = new Item('pecho9', { ...o, name: { en: 'Wall for an echo', hi: 'गूँज के लिए दीवार', hg: 'Goonj ke liye deewaar' } });
  const g = it.g, w_ = o.W || ((k) => k), D = 34, WH = 9, WW = 26;
  const wall = new THREE.Mesh(new THREE.BoxGeometry(WW, WH, 0.5), new THREE.MeshStandardMaterial({ map: brickTex(7, [WW / 2, WH / 2]), roughness: 0.85 })); wall.position.set(0, WH / 2, -D - 0.25); wall.castShadow = true; wall.receiveShadow = true; g.add(wall);
  const cap = new THREE.Mesh(new THREE.BoxGeometry(WW + 0.2, 0.2, 0.7), M(0xbdb6aa, 0.8)); cap.position.set(0, WH + 0.1, -D - 0.25); g.add(cap);
  for (let m = 0; m <= D; m += 2) { const d = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 1.0), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 })); d.rotation.x = -Math.PI / 2; d.position.set(0.9, 0.006, -m - 0.5); g.add(d); }
  const dt = tag('34 m', '#ffffff', 0.6); dt.position.set(1.6, 0.6, -D / 2); g.add(dt);
  const ringM = new THREE.MeshBasicMaterial({ color: 0x7ad0ff, transparent: true, opacity: 0.5, side: THREE.DoubleSide, depthWrite: false, toneMapped: false });
  const out = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2), ringM); out.visible = false; g.add(out);
  const back = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2), ringM.clone()); back.material.color.set(0xffb070); back.visible = false; g.add(back);
  const st = (() => { const sw = new THREE.Group(); const body = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.025, 40), M(0xc9ced2, 0.25, 0.85)); body.rotation.x = Math.PI / 2; sw.add(body);
    const T = canvasTex(256, 256, () => {}); const face = new THREE.Mesh(new THREE.CircleGeometry(0.052, 40), new THREE.MeshBasicMaterial({ map: T, toneMapped: false })); face.position.z = 0.0131; sw.add(face);
    sw.show = (t) => { const x = T.image.getContext('2d'); x.fillStyle = '#e9efe4'; x.beginPath(); x.arc(128, 128, 128, 0, 7); x.fill(); x.fillStyle = '#9cb08a'; x.fillRect(20, 88, 216, 80); x.fillStyle = '#111'; x.font = '800 60px monospace'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(t.toFixed(2), 128, 130); x.font = `700 24px ${FONT}`; x.fillText('sec', 128, 200); T.needsUpdate = true; }; sw.show(0); return sw; })();
  st.position.set(0.38, 1.1, -0.5); st.rotation.x = 0.45; g.add(st);
  const slow = tag(w_('slow motion: 25 times slower'), '#ffffff', 0.3); slow.position.set(0, 3.2, -8); slow.visible = false; g.add(slow);
  const rd = liveSign(1.0, 3.6); rd.position.set(0, 6.5, -24); g.add(rd);
  animator(it); it.claps = 0; const V0 = 340, SL = 25, TR = 2 * D / V0; // real time for the echo
  it.clap = (cb) => { if (it.busy) return false; slow.visible = true; out.visible = true; back.visible = false; const T = TR * SL;
    it.play(T + 0.8, (k) => { const tt = Math.min(TR, k * (T + 0.8) / SL); st.show(tt); const r = V0 * tt;
      if (r <= D) { out.visible = true; back.visible = false; out.scale.setScalar(Math.max(0.05, r)); out.position.set(0, 1.5, 0); out.material.opacity = 0.55 * (1 - r / (D * 1.6)); }
      else { out.visible = false; back.visible = true; const rb = r - D; back.scale.setScalar(r); back.position.set(0, 1.5, -2 * D); back.material.opacity = 0.55 * (1 - rb / (D * 1.6)); } },
    () => { out.visible = false; back.visible = false; slow.visible = false; st.show(TR); it.claps++; rd.set([`${w_('echo after')} ${TR.toFixed(2)} s`], '#8be07a'); if (cb) cb(); }); return true; };
  it.say = (l, c) => rd.set(l, c);
  it.say([w_('Clap and listen for the echo')], '#ffffff');
  it.leverPath = floorLever;
  return done1(it, { height: WH, radius: D + 2 });
}
export function bindEchoHands(ew, lever, app, s = { clap: 1 }, done = {}) {
  pushKnob(lever, { path: () => ew.leverPath(), active: () => stepNow(app, s.clap) && !ew.busy && ew.claps === 0, keepVisible: () => app.runner.i === s.clap, press: () => ew.clap(() => done.echo && done.echo()) });
}

// ------------------------------------------------------------------ Class 10 Ch 9 Light – Reflection and Refraction: a coin seems to rise
// A steel bucket on the kitchen table with a ₹5 coin at the bottom. Slide to pour water in, 30 cm deep: seen from above
// the coin seems to rise, to about 30 ÷ 1.33 = 22.6 cm below the surface. A ray shows light bending as it leaves the water.
export function coinBucket(o = {}) {
  const it = new Item('pcoin10', { ...o, name: { en: 'Bucket of water and a coin', hi: 'पानी की बाल्टी और सिक्का', hg: 'Paani ki baalti aur sikka' } });
  const g = it.g, w_ = o.W || ((k) => k), C = V(0, 0, -0.08), H = 0.34, R0 = 0.13, R1 = 0.17, HMAX = 0.3, N = 1.33;
  const bkM = new THREE.MeshStandardMaterial({ color: 0xd2d7dc, roughness: 0.22, metalness: 0.85, side: THREE.DoubleSide });
  const shell = new THREE.Mesh(new THREE.CylinderGeometry(R1, R0, H, 48, 1, true), bkM); shell.position.set(C.x, H / 2, C.z); shell.castShadow = true; g.add(shell);
  const bot = new THREE.Mesh(new THREE.CircleGeometry(R0, 40), M(0xb9bec4, 0.3, 0.8)); bot.rotation.x = -Math.PI / 2; bot.position.set(C.x, 0.002, C.z); g.add(bot);
  const lip = new THREE.Mesh(new THREE.TorusGeometry(R1, 0.006, 8, 48), bkM); lip.rotation.x = Math.PI / 2; lip.position.set(C.x, H, C.z); g.add(lip);
  const coinT = tex(128, 128, (x) => { const gr = x.createRadialGradient(54, 50, 6, 64, 64, 64); gr.addColorStop(0, '#f6e08a'); gr.addColorStop(1, '#b8902e'); x.fillStyle = gr; x.beginPath(); x.arc(64, 64, 63, 0, 7); x.fill(); x.strokeStyle = 'rgba(90,60,10,0.6)'; x.lineWidth = 4; x.beginPath(); x.arc(64, 64, 54, 0, 7); x.stroke(); x.fillStyle = '#6b4a10'; x.font = `900 52px ${FONT}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('5', 64, 68); });
  const coinM = new THREE.MeshStandardMaterial({ map: coinT, roughness: 0.3, metalness: 0.7 });
  const coin = new THREE.Mesh(new THREE.CylinderGeometry(0.0115, 0.0115, 0.002, 28), [M(0xb8902e, 0.3, 0.8), coinM, coinM]); coin.position.set(C.x + 0.03, 0.004, C.z); g.add(coin);
  const image = new THREE.Mesh(new THREE.CylinderGeometry(0.0115, 0.0115, 0.002, 28), [M(0xb8902e, 0.3, 0.8), new THREE.MeshBasicMaterial({ map: coinT, transparent: true, opacity: 0.85, toneMapped: false }), coinM]); image.visible = false; g.add(image);
  const waterM = new THREE.MeshStandardMaterial({ color: 0x5aa8d8, roughness: 0.04, metalness: 0.1, transparent: true, opacity: 0.32, depthWrite: false });
  const water = new THREE.Mesh(new THREE.CylinderGeometry(R0, R0, 0.001, 48), waterM); water.visible = false; g.add(water);
  const rAt = (y) => R0 + (R1 - R0) * y / H;
  // the jug pours from the side
  const jug = new THREE.Group(); jug.position.set(C.x + 0.32, 0, C.z + 0.05); g.add(jug);
  const jb = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.2, 24), M(0x2a6fd1, 0.4)); jb.position.y = 0.1; jug.add(jb);
  // rays: from the coin to the surface, then bending to the eye; and the dashed line back to the image
  const lineM = new THREE.LineBasicMaterial({ color: 0xffd23f, toneMapped: false }), dashM = new THREE.LineDashedMaterial({ color: 0xffffff, dashSize: 0.008, gapSize: 0.006, toneMapped: false });
  const ray = new THREE.Line(new THREE.BufferGeometry(), lineM), dash = new THREE.Line(new THREE.BufferGeometry(), dashM); ray.visible = false; dash.visible = false; g.add(ray); g.add(dash);
  const EYE = V(C.x - 0.16, 0.78, C.z + 0.1);
  const eyeT = tag(w_('your eye'), '#ffffff', 0.022); eyeT.position.copy(EYE); eyeT.visible = false; g.add(eyeT);
  const rd = liveSign(0.07, 3.6); rd.position.set(0, 0.5, -0.32); g.add(rd);
  it.k = 0;
  it.setK = (k) => { it.k = k; const h = HMAX * k; water.visible = h > 0.002; if (water.visible) { water.geometry.dispose(); water.geometry = new THREE.CylinderGeometry(rAt(h) - 0.002, R0 - 0.002, h, 48); water.position.set(C.x, h / 2, C.z); }
    const app = h - h / N; const showImg = h > 0.01; image.visible = showImg; coin.material[1].opacity = 1; image.position.set(coin.position.x, 0.004 + app, coin.position.z);
    jug.rotation.z = k > 0 && k < 1 ? 1.1 : 0; jug.position.y = k > 0 && k < 1 ? 0.3 : 0;
    // a ray from the coin up to the surface (closer to the normal in water) and out to the eye
    if (showImg) { // the surface point where a ray from the coin bends to reach the eye (Snell: n sin θwater = sin θair)
      const P0 = coin.position.clone().setY(0.005), dir = V(EYE.x - P0.x, 0, EYE.z - P0.z), Ue = dir.length(); dir.normalize(); const He = EYE.y - h, hw = h - 0.005;
      let lo = 0, hi = Ue; for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2, f = N * m / Math.hypot(m, hw) - (Ue - m) / Math.hypot(Ue - m, He); if (f > 0) hi = m; else lo = m; }
      const sx = (lo + hi) / 2, S = P0.clone().addScaledVector(dir, sx).setY(h), yImg = h - sx * He / (Ue - sx); image.position.set(P0.x, Math.max(0.004, yImg), P0.z);
      ray.geometry.setFromPoints([P0, S, EYE]); dash.geometry.setFromPoints([S, image.position.clone()]); dash.computeLineDistances(); ray.visible = dash.visible = eyeT.visible = true; }
    else { ray.visible = dash.visible = eyeT.visible = false; }
    rd.set(showImg ? [`${w_('water')} ${(h * 100).toFixed(0)} cm · ${w_('the coin looks')} ${(app * 100).toFixed(1)} cm ${w_('higher')}`] : [w_('An empty bucket: the coin is at the bottom')], k >= 1 - 1e-6 ? '#8be07a' : '#ffd23f'); if (it.onK) it.onK(k); };
  it.say = (l, c) => rd.set(l, c);
  it.setK(0);
  it.knobPath = () => tableSlide(g);
  return done1(it, { height: 0.4, radius: 0.4 });
}
export function bindCoinHands(cb, knob, app, s = { pour: 1 }, done = {}) {
  const sync = slideKnob(knob, { path: () => cb.knobPath(), active: () => stepNow(app, s.pour), keepVisible: () => app.runner.i === s.pour, k: () => cb.k,
    set: (k) => { const kk = clamp01(k > 0.98 ? 1 : k); if (kk > cb.k) cb.setK(kk); if (cb.k >= 1 - 1e-6 && done.full) done.full(); } });
  const s0 = cb.setK; cb.setK = (k) => { s0(k); sync(); };
}
