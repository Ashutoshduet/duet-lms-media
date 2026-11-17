// DUET Science Lab 360, biology in real places, batch BW4 (the ocean and animals), part 3: on the beach. Salt from the
// sea in a salt pan (the way salt is made on the coasts of Gujarat and Tamil Nadu), and a whale's blubber tested with
// cans of warm water in a tub of ice water, while a whale breathes out at sea. Every mesh drawn here uses the shared BW4
// material (oceanworld1.js), the sea too (it lies where the sea-breeze activity of physworld3.js draws it).
import * as THREE from 'three';
import { Item } from './apparatus.js';
import { clamp01, ease } from './mathlab2.js';
import { liveSign } from './mathworld4.js';
import { slideKnob } from './mathworld5.js';
import { tag, animator, rnd, tex, noHit, stepNow, V } from './mathworld_j1.js';
import { mergeGeoms } from './bioworld1.js';
import { carry } from './bioworld4.js';
import { BENCH_Y } from './room.js';
import { LITE } from './lite.js';
import { lm, oModel, zoomBubble, spot, done1, dryLand } from './oceanworld1.js';
import { flyT, clock } from './oceanworld1.js';

const TAU = Math.PI * 2;
const N3 = (en, hi, hg) => ({ en, hi, hg: hg || en });
const Y = BENCH_Y;
const lathe = (pts, mat, seg = 32) => { const m = new THREE.Mesh(new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg), mat); m.castShadow = true; m.receiveShadow = true; return m; };
const T = {};
// the shallow sea along the left (x < SX), as in physworld3.js's beach: water that mirrors the sky, ripples, foam
const SX = -2.6;
function shallowSea(g) {
  // a colour map of ripples (dark troughs, light streaks of sky, a few glints) on the shared Lambert material: opaque,
  // no reflections to compute, so the big sea costs no more per pixel than the sand
  const seaT = T.sea || (T.sea = tex(256, 256, (x) => { x.fillStyle = '#1f6f86'; x.fillRect(0, 0, 256, 256); const r = rnd(21);
    for (let i = 0; i < 1500; i++) { const v = r(); x.fillStyle = v < 0.45 ? 'rgba(14,72,98,0.45)' : v < 0.97 ? 'rgba(112,184,210,0.33)' : 'rgba(235,248,255,0.7)'; x.beginPath(); x.ellipse(r() * 256, r() * 256, v < 0.97 ? 6 + r() * 14 : 1.5 + r() * 2, v < 0.97 ? 1.5 + r() * 2.5 : 0.8, 0, 0, 7); x.fill(); } }, [30, 60]));
  const seaM = lm({ map: seaT });
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(90, 180), seaM); sea.rotation.x = -Math.PI / 2; sea.position.set(SX - 45, 0.012, 0); sea.receiveShadow = true; sea.userData.noHit = true; g.add(sea);
  sea.onBeforeRender = () => { const k = performance.now() * 1e-5; seaT.offset.set(k * 0.7, k); };
  const foamT = T.foam || (T.foam = tex(64, 512, (x) => { x.clearRect(0, 0, 64, 512); const r = rnd(5); for (let i = 0; i < 260; i++) { x.fillStyle = `rgba(255,255,255,${0.25 + r() * 0.5})`; x.beginPath(); x.ellipse(20 + r() * 30, r() * 512, 3 + r() * 8, 2 + r() * 10, 0, 0, 7); x.fill(); } }, [1, 14]));
  const foam = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 110), new THREE.MeshBasicMaterial({ map: foamT, transparent: true, depthWrite: false, opacity: 0.8 })); foam.rotation.x = -Math.PI / 2; foam.position.set(SX + 0.05, 0.016, 0); foam.userData.noHit = true; g.add(foam);
  return { sea };
}

// ------------------------------------------------------------------ Class 6: salt from the sea, in a salt pan
// A salt pan dug in the sand beside the sea: a shallow bed with mud walls, fed by a channel through a wooden gate. The
// student lets the sea in, shuts the gate, and runs the days: the sun and the wind take the water away, the brine grows
// stronger (and pinker), and salt crystals form when it holds about 26 % salt. Then the salt is raked into a heap.
export function saltPan(o = {}) {
  const it = new Item('bsalt', { ...o, name: N3('A salt pan by the sea', 'समुद्र के किनारे नमक की क्यारी', 'Samudra ke kinaare namak ki kyaari') });
  const g = it.g, w_ = o.W || ((k) => k), ticks = []; dryLand(); const r = rnd(19);
  shallowSea(g);
  const PC = V(-1.85, 0, -0.55), PW = 1.0, PD = 1.6; // the pan's centre, size, depth below its walls
  const mudM = lm({ map: T.mud || (T.mud = tex(128, 128, (x) => { x.fillStyle = '#7d6a52'; x.fillRect(0, 0, 128, 128); for (let i = 0; i < 700; i++) { x.fillStyle = `rgba(${r() < 0.5 ? '60,48,34' : '150,135,110'},0.35)`; x.beginPath(); x.arc(r() * 128, r() * 128, 1 + r() * 3, 0, TAU); x.fill(); } })) });
  const walls = [new THREE.BoxGeometry(PW + 0.24, 0.1, 0.12).translate(0, 0.05, PD / 2 + 0.06), new THREE.BoxGeometry(PW + 0.24, 0.1, 0.12).translate(0, 0.05, -PD / 2 - 0.06), new THREE.BoxGeometry(0.12, 0.1, PD).translate(PW / 2 + 0.06, 0.05, 0),
    new THREE.BoxGeometry(0.12, 0.1, PD / 2 - 0.12).translate(-PW / 2 - 0.06, 0.05, PD / 4 + 0.06), new THREE.BoxGeometry(0.12, 0.1, PD / 2 - 0.12).translate(-PW / 2 - 0.06, 0.05, -PD / 4 - 0.06)];
  const wm = new THREE.Mesh(mergeGeoms(walls), mudM); wm.position.copy(PC); wm.castShadow = true; wm.receiveShadow = true; g.add(wm);
  const bed = new THREE.Mesh(new THREE.PlaneGeometry(PW, PD).rotateX(-Math.PI / 2), lm({ map: T.mud, color: 0x8a7a66 })); bed.position.copy(PC).add(V(0, 0.005, 0)); bed.receiveShadow = true; g.add(bed);
  // the channel from the sea to the pan's gate
  const ch = new THREE.Mesh(new THREE.PlaneGeometry(Math.abs(SX - (PC.x - PW / 2)) + 0.2, 0.22).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x2f7a8a, transparent: true, opacity: 0.85, depthWrite: false })); ch.position.set((SX + PC.x - PW / 2) / 2, 0.014, PC.z); g.add(ch);
  const banks = new THREE.Mesh(mergeGeoms([new THREE.BoxGeometry(Math.abs(SX - (PC.x - PW / 2)), 0.08, 0.08).translate(0, 0.04, 0.15), new THREE.BoxGeometry(Math.abs(SX - (PC.x - PW / 2)), 0.08, 0.08).translate(0, 0.04, -0.15)]), mudM); banks.position.set((SX + PC.x - PW / 2) / 2, 0, PC.z); g.add(banks);
  // the gate: a wooden board that slides up in two posts
  const wood = lm({ map: T.wood || (T.wood = tex(64, 128, (x) => { x.fillStyle = '#8b6a44'; x.fillRect(0, 0, 64, 128); for (let i = 0; i < 30; i++) { x.strokeStyle = `rgba(60,40,20,${0.2 + r() * 0.3})`; x.beginPath(); x.moveTo(r() * 64, 0); x.lineTo(r() * 64, 128); x.stroke(); } })) });
  const GX = PC.x - PW / 2 - 0.06; const posts = new THREE.Mesh(mergeGeoms([new THREE.BoxGeometry(0.05, 0.5, 0.05).translate(0, 0.25, 0.15), new THREE.BoxGeometry(0.05, 0.5, 0.05).translate(0, 0.25, -0.15)]), wood); posts.position.set(GX, 0, PC.z); g.add(posts);
  const board = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.2, 0.26), wood); board.position.set(GX, 0.1, PC.z); board.castShadow = true; g.add(board);
  it.gate = 0; it.gatePath = () => [V(GX + 0.08, 0.32, PC.z + 0.18), V(GX + 0.08, 0.62, PC.z + 0.18)];
  // the water in the pan, the salt crust, the crystals and the heap
  const water = new THREE.Mesh(new THREE.PlaneGeometry(PW - 0.01, PD - 0.01).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x3f8a96, transparent: true, opacity: 0.0, depthWrite: false })); water.position.copy(PC); water.renderOrder = 7; g.add(water);
  const crustT = T.crust || (T.crust = tex(256, 256, (x) => { x.clearRect(0, 0, 256, 256); x.fillStyle = 'rgba(246,243,236,0.78)'; x.fillRect(0, 0, 256, 256); for (let i = 0; i < 2600; i++) { x.fillStyle = `rgba(255,255,255,${0.3 + r() * 0.6})`; const s = 1 + r() * 4; x.fillRect(r() * 256, r() * 256, s, s); } }, [3, 2]));
  const crust = new THREE.Mesh(new THREE.PlaneGeometry(PW - 0.02, PD - 0.02).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: crustT, color: 0xf7f4ee, transparent: true, opacity: 0, depthWrite: false })); crust.position.copy(PC).add(V(0, 0.008, 0)); crust.renderOrder = 6; g.add(crust);
  const NC = LITE ? 160 : 320; const cry = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), lm({ color: 0xfbfaf6 }), NC); cry.count = 0; cry.frustumCulled = false; cry.userData.noHit = true; g.add(cry);
  const CP = Array.from({ length: NC }, () => V(PC.x + (r() - 0.5) * (PW - 0.06), 0.006, PC.z + (r() - 0.5) * (PD - 0.06))), CR = Array.from({ length: NC }, () => r() * TAU);
  const heap = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.18, 24, 4), lm({ map: crustT, color: 0xf6f3ec })); heap.position.set(PC.x + 0.15, 0.09, PC.z - PD / 2 + 0.3); heap.scale.setScalar(0.001); heap.visible = false; heap.castShadow = true; g.add(heap);
  const rake = new THREE.Group(); { const h = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 1.4, 8), wood); h.rotation.x = -1.05; h.position.set(0, 0.6, 0.35); rake.add(h); const head = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.06, 0.03), wood); head.position.set(0, 0.03, 0); rake.add(head); } rake.position.set(PC.x + 0.1, 0, PC.z + PD / 2 - 0.15); g.add(rake); noHit(rake);
  it.rakePath = () => [V(PC.x + 0.62, 0.2, PC.z + 0.7), V(PC.x + 0.62, 0.2, PC.z - 0.7)];
  // the two bowls on the table: sea water and tap water, drying in the same sun
  const steel = lm({ color: 0xcfd4d8 }); const bowls = [-0.35, 0.35].map((x, i) => { const b = lathe([[0, 0], [0.06, 0.002], [0.09, 0.03], [0.095, 0.045], [0.09, 0.045], [0.085, 0.03], [0.058, 0.006], [0, 0.006]], steel, 32); b.position.set(x, Y, -0.75); g.add(b);
    const w = new THREE.Mesh(new THREE.CircleGeometry(0.08, 28).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: i ? 0xb9d6e0 : 0x8fb7c2, transparent: true, opacity: 0.5, depthWrite: false })); w.position.set(x, Y + 0.035, -0.75); g.add(w);
    const c = new THREE.Mesh(new THREE.CircleGeometry(0.07, 28).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: crustT, color: 0xffffff, transparent: true, opacity: 0, depthWrite: false })); c.position.set(x, Y + 0.008, -0.75); g.add(c);
    const lb = tag(w_(i ? 'tap water' : 'sea water'), '#ffffff', 0.045); lb.position.set(x, Y + 0.13, -0.75); g.add(lb); return { w, c }; });
  // signs
  const sign = liveSign(0.09, 4.8); sign.position.set(-0.9, 1.6, -1.4); g.add(sign); it.say = (l, c) => sign.set(l, c);
  it.bubble = zoomBubble({ at: V(-0.45, 1.45, -1.25), r: 0.14, hide: [sign] }); g.add(it.bubble);
  // the state: depth of water let in (m), days, salt
  it.d0 = 0; it.depth = 0; it.t = 0; it.tMax = 12; it.raked = 0; it.gateEverOpen = false;
  const VOL = PW * PD; // m², × depth = m³
  it.saltKg = () => 35 * VOL * it.d0 * 1000 / 1000; // 35 g of salt in each litre of sea water
  it.salinity = () => (it.depth > 0.0005 ? Math.min(26.5, 3.5 * it.d0 / it.depth) : 0);
  it.crystKg = () => { const S = it.saltKg(); if (it.depth <= 0.0005) return S; const dissolved = Math.min(S, 0.265 / (1 - 0.265) * 1000 * VOL * it.depth); return Math.max(0, S - dissolved); };
  const draw = () => { const dep = it.depth; water.visible = dep > 0.0005; water.position.y = 0.006 + dep; const sal = it.salinity(); water.material.opacity = 0.55 + 0.25 * clamp01(dep / 0.1);
    water.material.color.setRGB(lerp(0.25, 0.78, clamp01((sal - 8) / 18)), lerp(0.54, 0.58, clamp01((sal - 8) / 18)), lerp(0.59, 0.62, clamp01((sal - 8) / 18)));
    const cr = it.saltKg() > 0 ? it.crystKg() / it.saltKg() : 0; crust.material.opacity = it.d0 > 0 ? 0.95 * clamp01(cr * 1.4) * (1 - it.raked) : 0;
    const n = Math.round(NC * clamp01(cr) * (1 - it.raked)); const dm = new THREE.Object3D(); for (let i = 0; i < n; i++) { dm.position.copy(CP[i]); dm.position.y = 0.008 + Math.max(0, dep - 0.004) * 0; dm.rotation.set(0.2, CR[i], 0.1); dm.scale.setScalar(0.006 + 0.012 * cr * ((i % 7) / 7 + 0.5)); dm.updateMatrix(); cry.setMatrixAt(i, dm.matrix); } cry.count = n; cry.instanceMatrix.needsUpdate = true;
    heap.visible = it.raked > 0.01; heap.scale.setScalar(Math.max(0.001, it.raked * Math.cbrt(Math.max(0.05, it.saltKg() / 5.6))));
    // the bowls: the sea-water one leaves a white crust, the tap-water one only a faint ring
    const k = clamp01(it.t / 3); bowls.forEach((b, i) => { b.w.material.opacity = 0.5 * (1 - k); b.w.position.y = Y + 0.008 + 0.027 * (1 - k); b.c.material.opacity = i ? 0.12 * k : 0.9 * clamp01((k - 0.6) / 0.4); });
    const kg = it.raked > 0.5 ? it.saltKg() : it.crystKg();
    it.say([`${w_('Water in the pan')}: ${(dep * 100).toFixed(1)} cm · ${w_('Day')} ${it.t.toFixed(1)}`, `${w_('Salt in the water')}: ${sal.toFixed(1)} % · ${w_('Salt crystals')}: ${kg.toFixed(1)} kg`], ['#ffffff', '#ffd23f']); };
  const lerp = (a, b, k) => a + (b - a) * k;
  it.setGate = (k) => { it.gate = clamp01(k); board.position.y = 0.1 + 0.25 * it.gate; if (it.gate > 0.2) it.gateEverOpen = true; };
  it.setT = (t) => { it.t = Math.max(0, Math.min(it.tMax, t)); it.depth = Math.max(0, it.d0 - 0.01 * it.t); draw(); }; // about 1 cm of water a day goes into the air (sun and sea wind)
  it.setRake = (k) => { it.raked = Math.max(it.raked, clamp01(k)); rake.position.z = PC.z + PD / 2 - 0.15 - 1.1 * clamp01(k); draw(); };
  it.knobPath = () => [V(-0.45, Y + 0.02, -0.42), V(0.45, Y + 0.02, -0.42)];
  animator(it); const up0 = it.update; const tick = clock();
  it.cap = () => 0.12; // the sea's own level (bindSalt holds it to a trickle until the student is asked to watch it rise)
  it.update = (dt, t) => { up0(dt); const d = Math.min(dt || 0.016, 0.05), dr = tick();
    // while the gate is open the sea flows in, up to the sea's own level (12 cm here); about 0.8 cm a second at full open
    if (it.gate > 0.05 && it.t === 0 && it.d0 < it.cap()) { it.d0 = Math.min(it.cap(), it.d0 + it.gate * 0.008 * dr); it.depth = it.d0; draw(); }
    ch.material.opacity = 0.85; for (const f of ticks) f(d, t); };
  it.views = { all: { p: V(-0.1, 1.85, 0.9), t: V(-1.7, 0.1, -0.7) }, pan: { p: V(-0.9, 1.55, 0.55), t: V(-1.85, 0.05, -0.6) }, gate: { p: V(-1.45, 1.35, 0.45), t: V(-2.4, 0.15, -0.55) }, table: { p: V(0, 1.45, 0.2), t: V(0, Y, -0.8) } };
  it.setT(0);
  return done1(it, { height: 0.5, radius: 1.6 });
}
export function bindSalt(sp, th, app, s, done = {}) {
  let fired = {}; sp.cap = () => (app.runner.i >= s.close ? 0.12 : 0.01);
  const syncG = slideKnob(th.gate, { path: () => sp.gatePath(), active: () => stepNow(app, s.open) || stepNow(app, s.close), keepVisible: () => app.runner.i === s.open || app.runner.i === s.close, k: () => sp.gate,
    set: (k) => { sp.setGate(k); if (stepNow(app, s.open) && sp.gate > 0.8 && !fired.open) { fired.open = 1; done.open && done.open(); } if (stepNow(app, s.close) && sp.gate < 0.06 && sp.d0 > 0.01 && !fired.close) { fired.close = 1; sp.setGate(0); done.close && done.close(); } } });
  const g0 = sp.setGate; sp.setGate = (k) => { g0(k); syncG(); };
  const syncT = slideKnob(th.knob, { path: () => sp.knobPath(), active: () => stepNow(app, s.days), keepVisible: () => app.runner.i === s.days, k: () => sp.t / sp.tMax,
    set: (k) => { if (sp.gate > 0.05) return; sp.setT(Math.max(sp.t, Math.round(k * sp.tMax * 10) / 10)); if (sp.t >= sp.tMax - 1e-6 && !fired.days) { fired.days = 1; done.days && done.days(); } } });
  const t0 = sp.setT; sp.setT = (t) => { t0(t); syncT(); };
  const syncR = slideKnob(th.rake, { path: () => sp.rakePath(), active: () => stepNow(app, s.rake), keepVisible: () => app.runner.i === s.rake, k: () => sp.raked,
    set: (k) => { sp.setRake(k); if (sp.raked > 0.97 && !fired.rake) { fired.rake = 1; sp.setRake(1); done.rake && done.rake(); } } });
  const r0 = sp.setRake; sp.setRake = (k) => { r0(k); syncR(); };
  const u0 = sp.update; sp.update = (dt, t) => { u0(dt, t); const i = app.runner.i; if (i === s.days && sp.t > 6) { const p = V(-1.75, 0.01, -0.5); sp.bubble.look(p, p.clone().add(V(0.02, 0.09, 0.06)), sp.W(sp.crystKg() > 0.1 ? 'Salt crystals: little cubes' : 'Brine: very salty water')); } else if (i !== s.days) sp.bubble.hideBubble(); };
}

// ------------------------------------------------------------------ Class 6 (7): a whale's blubber, tested with warm cans in ice water
// A cold morning on the beach. Out at sea a whale comes up to breathe. On the table: a tub of ice water (1 °C) and three
// steel cans of warm water (37 °C, as warm as a whale's body), each with a thermometer: one bare, one wrapped in a thick
// layer of fat (ghee in a bag: the "blubber"), one in a woollen sock. The student puts them in the ice water and runs
// the clock. Each can cools by Newton's law of cooling, at the rate its wrapping lets heat out.
export const CANS = { bare: { tau: 4 }, fat: { tau: 60 }, wool: { tau: 12 } };
export function blubberTest(o = {}) {
  const it = new Item('bblub', { ...o, name: N3('A tub of ice water and three warm cans', 'बर्फ़ के पानी का टब और तीन गरम डिब्बे', 'Barf ke paani ka tub aur teen garam dibbe') });
  const g = it.g, w_ = o.W || ((k) => k), ticks = []; dryLand(); const r = rnd(23);
  shallowSea(g);
  // the whale far out at sea: it rises, blows a spout and dives again
  const wh = oModel('whale', { face: [1, 0.15], speed: 0.6 }); const whG = new THREE.Group(); whG.add(wh); whG.position.set(-38, -2.5, -46); g.add(whG); let wt = 0;
  const spray = []; const spM = new THREE.MeshBasicMaterial({ color: 0xf2f8ff, transparent: true, opacity: 0.8, toneMapped: false, depthWrite: false }); for (let i = 0; i < 16; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.35, 6, 4), spM); m.visible = false; m.userData.noHit = true; g.add(m); spray.push({ m, v: V(), life: 0 }); }
  ticks.push((dt) => { wt += dt; const ph = (wt % 16) / 16; const up = ph < 0.35 ? Math.sin(ph / 0.35 * Math.PI) : 0; whG.position.y = -2.6 + up * 2.1; whG.position.x = -38 + (wt % 64) * 0.4; wh.tick(dt);
    if (Math.abs(ph - 0.17) < dt / 16 * 1.01 + 1e-4) { const p = whG.position.clone().add(V(2.5, 1.0, 0)); for (const s of spray) { s.m.position.copy(p); s.v.set((Math.random() - 0.5) * 1.2, 4 + Math.random() * 3, (Math.random() - 0.5) * 1.2); s.life = 1 + Math.random() * 0.6; s.m.visible = true; } }
    for (const s of spray) { if (s.life <= 0) continue; s.life -= dt; s.v.y -= 4.9 * dt; s.m.position.addScaledVector(s.v, dt); s.m.scale.setScalar(1 + (1.6 - s.life) * 1.5); if (s.life <= 0) s.m.visible = false; } });
  it.whale = whG;
  // the tub of ice water
  const TB = V(0, Y, -0.82), TR = 0.24; const steel = lm({ color: 0xc7ccd0 });
  { const tub = lathe([[0, 0], [TR * 0.9, 0], [TR, 0.02], [TR * 1.05, 0.18], [TR * 1.08, 0.19], [TR * 1.03, 0.19], [TR * 0.98, 0.025], [TR * 0.88, 0.006], [0, 0.006]], steel, 40); tub.position.copy(TB); g.add(tub); }
  const wat = new THREE.Mesh(new THREE.CircleGeometry(TR * 1.02, 36).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x9cc3cf, transparent: true, opacity: 0.55, depthWrite: false })); wat.position.copy(TB).add(V(0, 0.15, 0)); wat.renderOrder = 8; g.add(wat);
  const iceM = new THREE.MeshBasicMaterial({ color: 0xeef7fb, transparent: true, opacity: 0.8, depthWrite: false }); for (let i = 0; i < 9; i++) { const c = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.03, 0.04), iceM); const a = r() * TAU, d = 0.06 + r() * 0.14; c.position.copy(TB).add(V(Math.cos(a) * d, 0.152, Math.sin(a) * d)); c.rotation.set(r(), r(), r()); c.renderOrder = 9; g.add(c); }
  it.slotIn = (i) => TB.clone().add(V((i - 1) * 0.14, 0.02, (i % 2) * 0.04 - 0.02));
  // the sign, the bubble (the whale, up close: a thick white layer under its dark skin)
  const sign = liveSign(0.085, 5.0); sign.position.set(0, Y + 0.72, -1.15); g.add(sign); it.say = (l, c) => sign.set(l, c);
  it.bubble = zoomBubble({ at: V(-0.7, Y + 0.6, -1.0), r: 0.15, fov: 12, hide: [sign] }); g.add(it.bubble);
  it.t = 0; it.tMax = 10; it.cans = [];
  // each can's temperature: in the tub it cools towards 1 °C, out of it towards the 14 °C air (much more slowly)
  it.tempOf = (c) => { const tIn = c.inT != null ? Math.max(0, it.t - c.inT) : 0, tOut = it.t - tIn; const tau = CANS[c.wrap].tau; const Ta = 37 + (14 - 37) * (1 - Math.exp(-tOut / (tau * 6)));
    return tIn > 0 ? 1 + (Ta - 1) * Math.exp(-tIn / tau) : Ta; };
  it.setT = (t) => { it.t = Math.max(0, Math.min(it.tMax, t)); for (const c of it.cans) { if (c.inTub && c.inT == null) c.inT = it.t; const v = it.tempOf(c); c.tg.setText(`${v.toFixed(1)} °C`, v > 25 ? '#ff9a6a' : v > 12 ? '#ffd23f' : '#7cd3ff'); c.tg.position.copy(c.g.position).add(V(0, 0.26, 0)); }
    it.say([`${w_('Clock')}: ${it.t.toFixed(1)} ${w_('min')} · ${w_('ice water')} 1 °C`, it.cans.map((c) => `${w_(c.label)} ${it.tempOf(c).toFixed(1)} °C`).join(' · ')], ['#ffffff', '#ffd23f']); };
  it.knobPath = () => [V(-0.45, Y + 0.02, -0.42), V(0.45, Y + 0.02, -0.42)];
  animator(it); const up0 = it.update;
  it.update = (dt, t) => { up0(dt); const d = Math.min(dt || 0.016, 0.05); for (const f of ticks) f(d, t); it.cans.forEach((c, i) => c.tg.position.copy(c.g.position).add(V(0, 0.26 + (i % 2) * 0.07, 0))); }; // the middle label a little higher, so the three do not overlap
  it.views = { all: { p: V(0, 1.6, 0.6), t: V(-0.6, Y - 0.1, -1.4) }, table: { p: V(0, 1.45, 0.2), t: V(0, Y + 0.05, -0.8) }, sea: { p: V(0, 1.7, 0.6), t: V(-12, 1.0, -16) } };
  return done1(it, { height: 0.5, radius: 1.2 });
}
// a steel can of warm water, bare / wrapped in fat / in a woollen sock, with its thermometer reading over it
export function warmCan(wrap) {
  const g = new THREE.Group(); const r = rnd(wrap.length);
  g.add(lathe([[0, 0], [0.035, 0], [0.036, 0.004], [0.036, 0.13], [0.033, 0.135], [0, 0.135]], lm({ color: 0xd9dde0 }), 28));
  if (wrap === 'fat') { const f = lathe([[0.037, 0.0], [0.056, 0.004], [0.06, 0.06], [0.056, 0.126], [0.037, 0.13]], lm({ map: T.fat || (T.fat = tex(64, 64, (x) => { x.fillStyle = '#efe0a8'; x.fillRect(0, 0, 64, 64); for (let i = 0; i < 120; i++) { x.fillStyle = `rgba(${r() < 0.5 ? '255,248,215' : '210,190,130'},0.4)`; x.beginPath(); x.arc(r() * 64, r() * 64, 1 + r() * 3, 0, TAU); x.fill(); } })) }), 28); g.add(f);
    const bag = lathe([[0.061, 0.0], [0.063, 0.065], [0.06, 0.13], [0.04, 0.155]], new THREE.MeshBasicMaterial({ color: 0xf5f8fa, transparent: true, opacity: 0.18, depthWrite: false, side: THREE.DoubleSide }), 28); bag.castShadow = false; g.add(bag); }
  if (wrap === 'wool') { const w = lathe([[0.037, 0.0], [0.045, 0.004], [0.046, 0.12], [0.04, 0.13]], lm({ map: T.knit || (T.knit = tex(64, 64, (x) => { x.fillStyle = '#8a3a30'; x.fillRect(0, 0, 64, 64); for (let j = 0; j < 8; j++) for (let i = 0; i < 8; i++) { x.fillStyle = (i + j) % 2 ? '#a24a3c' : '#743128'; x.beginPath(); x.ellipse(i * 8 + 4, j * 8 + 4, 3, 4, 0.4, 0, TAU); x.fill(); } }, [3, 2])) }), 28); g.add(w); }
  const th = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.18, 8), lm({ color: 0xe8eef0 })); th.position.set(0.012, 0.18, 0); g.add(th);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.005, 8, 6), lm({ color: 0xc8202a })); bulb.position.set(0.012, 0.27, 0); g.add(bulb);
  noHit(g); return g;
}
export function bindBlubber(bt, cans, knob, app, s, done = {}) {
  bt.cans = cans; const W = bt.W || ((k) => k);
  for (const c of cans) { c.tg = tag('37.0 °C', '#ff9a6a', 0.05); bt.g.add(c.tg); c.inTub = false; c.inT = null; }
  bt.dip = (c, cb) => { const i = cans.indexOf(c); c.flying = true; flyT(c, bt.slotIn(i), 0, 0.8, () => { c.flying = false; c.placed = false; c.inTub = true; if (c.inT == null) c.inT = bt.t; c.home = { p: c.g.position.clone(), q: c.g.quaternion.clone() }; bt.setT(bt.t); if (cb) cb(c); }); };
  for (const c of cans) carry(c, [{ at: () => bt.slotIn(1), r: 0.28, open: () => stepNow(app, s.dip) && !c.inTub, put: (x) => bt.dip(x, () => { if (cans.every((k) => k.inTub) && done.dip) done.dip(); }) }],
    { carryY: Y + 0.3, free: (x) => { if (x.inTub && !stepNow(app, s.dip)) { x.inTub = false; x.outT = bt.t; return false; } return false; } });
  const sync = slideKnob(knob, { path: () => bt.knobPath(), active: () => stepNow(app, s.clock), keepVisible: () => app.runner.i === s.clock, k: () => bt.t / bt.tMax,
    set: (k) => { bt.setT(Math.max(bt.t, Math.round(k * bt.tMax * 10) / 10)); if (bt.t >= bt.tMax - 1e-6 && done.clock) done.clock(); } });
  const s0 = bt.setT; bt.setT = (t) => { s0(t); sync(); };
  const u0 = bt.update; bt.update = (dt, t) => { u0(dt, t); if (app.runner.i === s.look) { const p = bt.whale.position.clone().add(V(2, 0.4, 0)); bt.bubble.look(p, p.clone().add(V(-4, 2.5, 9)), W('A whale: up to 30 cm of blubber under its skin')); } else bt.bubble.hideBubble(); };
}
