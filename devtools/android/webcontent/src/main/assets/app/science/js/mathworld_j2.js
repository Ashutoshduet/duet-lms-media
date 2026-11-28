// DUET Maths Lab 360, hands-on for the youngest (Class 3, Maths Mela), batch J2: cutting a chikki fairly into halves
// and quarters, adding with walls and rows of bricks, sharing biscuits at the class party, filling a litre bottle and
// weighing a kilo, jumping along a chalk number line, setting a big clock, and buying a pot at the fair.
import * as THREE from 'three';
import { Item } from './apparatus.js';
import { canvasTex } from './mats.js';
import { clamp01, ease } from './mathlab2.js';
import { pushKnob } from './mathworld3.js';
import { liveSign } from './mathworld4.js';
import { slideKnob } from './mathworld5.js';
import { tag, animator, woodTex, steelMat, M, rnd, tex, noHit, stepNow, V, FONT } from './mathworld_j1.js';

const TW = (g) => (x, y, z) => g.localToWorld(V(x, y, z));
const tableLever = (g) => [TW(g)(-0.3, 0.1, 0.24), TW(g)(-0.3, 0.1, 0.32)];
const floorLever = () => [V(-0.45, 1.0, -0.3), V(-0.45, 1.0, -0.05)];
const floorKnob = () => [V(-0.45, 1.0, -0.42), V(0.45, 1.0, -0.42)];
const done1 = (it, o) => { noHit(it.g); it.noGrab = true; it.noPhys = true; it.base = 0; Object.assign(it, o); return it; };

// ------------------------------------------------------------------ Class 3 Ch 8 Fair Share: halves and quarters of a chikki
export function chikkiShare(o = {}) {
  const it = new Item('jchikki3', { ...o, name: { en: 'Chikki and plates', hi: 'चिक्की और थालियाँ', hg: 'Chikki aur thaaliyan' } });
  const g = it.g, w_ = o.W || ((k) => k);
  const cT = tex(256, 96, (x) => { x.fillStyle = '#b8761f'; x.fillRect(0, 0, 256, 96); const r = rnd(3); for (let i = 0; i < 70; i++) { x.fillStyle = r() < 0.5 ? '#e9c27a' : '#d9a85a'; x.beginPath(); x.ellipse(r() * 256, r() * 96, 6 + r() * 4, 4 + r() * 3, r() * 3, 0, 7); x.fill(); x.strokeStyle = 'rgba(90,50,10,0.5)'; x.stroke(); } });
  const board = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.012, 0.13), new THREE.MeshStandardMaterial({ map: woodTex('#c8925a', 17), roughness: 0.6 })); board.position.set(0, 0.006, -0.12); g.add(board);
  const PL = 0.06, pieces = [0, 1, 2, 3].map((i) => { const m = new THREE.Mesh(new THREE.BoxGeometry(PL, 0.014, 0.075), new THREE.MeshStandardMaterial({ map: cT, roughness: 0.35, bumpMap: cT, bumpScale: 0.8 })); m.castShadow = true; g.add(m); return m; });
  const PX = [-0.27, -0.09, 0.09, 0.27], plates = PX.map((x) => { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.058, 0.01, 36), steelMat()); p.position.set(x, 0.005, 0.12); g.add(p); return p; });
  const fr = PX.map((x) => { const t = tag('', '#ffd23f', 0.03); t.position.set(x, 0.08, 0.12); t.visible = false; g.add(t); return t; });
  // a roti cut badly: one big piece and one small piece
  const rT = tex(128, 128, (x) => { x.fillStyle = '#e2bd84'; x.beginPath(); x.arc(64, 64, 62, 0, 7); x.fill(); const r = rnd(8); for (let i = 0; i < 40; i++) { x.fillStyle = 'rgba(130,70,20,0.5)'; x.beginPath(); x.arc(64 + (r() - 0.5) * 100, 64 + (r() - 0.5) * 100, 3 + r() * 5, 0, 7); x.fill(); } });
  const roti = new THREE.Group(); roti.position.set(0, 0, -0.12); roti.visible = false; g.add(roti);
  [[0, 4.1], [4.1, 2.18]].forEach(([a0, a], i) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.006, 32, 1, false, a0, a), new THREE.MeshStandardMaterial({ map: rT, roughness: 0.8 })); m.position.set(i ? 0.02 : -0.02, 0.012, 0); roti.add(m); });
  const rd = liveSign(0.075, 3.4); rd.position.set(0, 0.17, -0.26); g.add(rd);
  animator(it); it.stage = 0; // 0 whole, 1 halves on 2 plates, 2 quarters on 4 plates
  const whole = (i) => V(-0.09 + i * PL + (i - 1.5) * 0.0005, 0.019, -0.12);
  const half = (i) => V(PX[i < 2 ? 1 : 2] + (i % 2 - 0.5) * PL, 0.018, 0.12);
  const quarter = (i) => V(PX[i], 0.018, 0.12);
  const at = (st, i) => (st === 0 ? whole(i) : st === 1 ? half(i) : quarter(i));
  const draw = (from, to, k) => { pieces.forEach((m, i) => { m.position.lerpVectors(at(from, i), at(to, i), ease(k)); m.position.y += Math.sin(k * Math.PI) * 0.06; });
    fr.forEach((t, i) => { const on = (to === 1 && (i === 1 || i === 2)) || to === 2; t.visible = on && k >= 1; t.setText(to === 1 ? '½' : '¼'); }); };
  it.cut = (cb) => { if (it.busy || it.stage >= 2) return false; const a = it.stage, b = a + 1; it.play(1.2, (k) => draw(a, b, k), () => { it.stage = b; draw(b, b, 1); rd.set([b === 1 ? `1 ÷ 2 = ½` : `½ ÷ 2 = ¼`], '#ffd23f'); if (cb) cb(); }); return true; };
  it.badRoti = () => { pieces.forEach((m) => { m.visible = false; }); fr.forEach((t) => { t.visible = false; }); board.visible = false; roti.visible = true; roti.children[1].position.x = 0.05; rd.set([w_('not equal → not halves')], '#ff8a5a'); };
  it.say = (l, c) => rd.set(l, c);
  draw(0, 0, 1); it.say(['1'], '#ffffff');
  it.leverPath = () => tableLever(g);
  return done1(it, { height: 0.05, radius: 0.45 });
}
export function bindChikkiHands(ck, lever, app, s = { cut: 1 }, done = {}) {
  pushKnob(lever, { path: () => ck.leverPath(), active: () => stepNow(app, s.cut) && !ck.busy && ck.stage < 1, keepVisible: () => app.runner.i === s.cut, press: () => ck.cut(() => done.cut && done.cut()) });
}

// ------------------------------------------------------------------ Class 3 Ch 9 House of Hundreds II: walls and rows of bricks
// A stack of 100 bricks (10 rows of 10), rows of 10 and loose bricks, in a school courtyard. 236 and 148 are put
// together; the 14 loose bricks are too many, so ten are laid into a new row (the lever): 384.
export function brickStacks(o = {}) {
  const it = new Item('jbricks3', { ...o, name: { en: 'Bricks in hundreds, tens and ones', hi: 'सैकड़ों, दहाइयों और इकाइयों में ईंटें', hg: 'Hundreds, tens aur ones mein eentein' } });
  const g = it.g, w_ = o.W || ((k) => k), BL = 0.11, BH = 0.07, BD = 0.23, MAX = 420;
  const bT = tex(128, 64, (x) => { x.fillStyle = '#a5462c'; x.fillRect(0, 0, 128, 64); const r = rnd(12); for (let i = 0; i < 300; i++) { x.fillStyle = r() < 0.5 ? 'rgba(70,20,10,0.35)' : 'rgba(220,120,80,0.3)'; x.fillRect(r() * 128, r() * 64, 2 + r() * 3, 2); } x.strokeStyle = 'rgba(60,20,10,0.5)'; x.lineWidth = 3; x.strokeRect(1, 1, 126, 62); });
  const im = new THREE.InstancedMesh(new THREE.BoxGeometry(BL * 0.96, BH * 0.94, BD * 0.97), new THREE.MeshStandardMaterial({ map: bT, roughness: 0.9 }), MAX); im.castShadow = true; im.receiveShadow = true; im.frustumCulled = false; g.add(im);
  const rd = liveSign(0.3, 3.4); rd.position.set(0, 1.2, -3.7); g.add(rd);
  // groups: list of { h, t, o, x } piles; each pile shows its hundreds (stacks), tens (rows) and loose
  it.piles = [{ h: 2, t: 3, o: 6, x: -1.35 }, { h: 1, t: 4, o: 8, x: 1.4 }]; it.merge = 0; let packK = 1;
  const mtx = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = V(1, 1, 1), r = rnd(4);
  const LOOSE = Array.from({ length: 30 }, (_, i) => ({ x: (r() - 0.5) * 0.7, z: (r() - 0.5) * 0.35, a: r() * 3 }));
  const tagH = [], tagT = [], tagO = []; ['H', 'T', 'O'].forEach((k, i) => { for (let p = 0; p < 2; p++) { const t = tag('0', ['#ff8a5a', '#ffd23f', '#8be07a'][i], 0.14); g.add(t); [tagH, tagT, tagO][i].push(t); } });
  const draw = () => { let n = 0; const m = ease(it.merge);
    it.piles.forEach((p, pi) => { const X = pi === 1 ? p.x + (-1.35 - p.x) * m : p.x, H = p.h, T = p.t, O = p.o;
      for (let h = 0; h < H; h++) for (let c = 0; c < 10; c++) for (let b = 0; b < 10; b++, n++) { const pos = V(X + (h + (pi === 1 ? 2 * m : 0)) * 1.25 + b * BL, BH / 2 + c * BH, -3.2); q.identity(); mtx.compose(pos, q, sc); im.setMatrixAt(n, mtx); }
      const tOff = pi === 1 ? 3 * m : 0;
      for (let t = 0; t < T; t++) for (let b = 0; b < 10; b++, n++) { const row = t + tOff; const pos = V(X + b * BL + Math.floor(row / 5) * 1.25, BH / 2, -2.55 + (row % 5) * 0.26 - (pi === 1 && m ? 0 : 0)); mtx.compose(pos, q.identity(), sc); im.setMatrixAt(n, mtx); }
      for (let i = 0; i < O; i++, n++) { const L = LOOSE[(i + pi * 9) % 30], base = pi === 1 ? (1 - m) * 0 : 0; void base; const pos = V(X + 0.5 + L.x, BH / 2, -1.25 + L.z); q.setFromAxisAngle(V(0, 1, 0), L.a); mtx.compose(pos, q, sc); im.setMatrixAt(n, mtx); }
      [tagH, tagT, tagO].forEach((arr, k) => { const t = arr[pi]; t.visible = !(pi === 1 && (m > 0.5 || H + T + O === 0)); t.setText(String([H, T, O][k])); t.position.set(X + 0.5, [1.0, 0.35, 0.3][k], [-3.2, -2.3, -1.25][k]); }); });
    if (packK < 1) { /* the ten bricks being laid into a row glide from the loose heap */ }
    im.count = n; im.instanceMatrix.needsUpdate = true; };
  it.value = (p) => p.h * 100 + p.t * 10 + p.o;
  it.label = () => { const [a, b] = it.piles; rd.set(it.combined ? [`${a.h} H  ${a.t} T  ${a.o} O = ${it.value(a)}`] : [`${it.value(a)} + ${it.value(b)}`], ['#ffd23f']); };
  animator(it);
  it.setMerge = (k) => { it.merge = k; draw(); };
  it.combine = () => { const [a, b] = it.piles; a.h += b.h; a.t += b.t; a.o += b.o; b.h = b.t = b.o = 0; it.merge = 0; it.combined = true; draw(); it.label(); };
  it.pack = (cb) => { const a = it.piles[0]; if (it.busy || a.o < 10) return false; it.play(1.0, (k) => { packK = k; }, () => { packK = 1; a.o -= 10; a.t += 1; if (a.t >= 10) { a.t -= 10; a.h += 1; } draw(); it.label(); if (cb) cb(); }); return true; };
  it.say = (l, c) => rd.set(l, c); it.words = w_;
  draw(); it.label();
  it.leverPath = floorLever;
  return done1(it, { height: 0.8, radius: 2.5 });
}
export function bindBrickHands(bs, lever, app, s = { pack: 2 }, done = {}) {
  pushKnob(lever, { path: () => bs.leverPath(), active: () => stepNow(app, s.pack) && !bs.busy && bs.piles[0].o >= 10, keepVisible: () => app.runner.i === s.pack, press: () => bs.pack(() => done.pack && done.pack()) });
}

// ------------------------------------------------------------------ Class 3 Ch 10 Fun at Class Party!: sharing biscuits
// 24 biscuits are shared among 4 friends: each push of the lever gives one biscuit to every plate. Then the same 24 are
// packed in small packets of 3.
export function biscuitShare(o = {}) {
  const it = new Item('jbiscuit3', { ...o, name: { en: 'Biscuits and plates', hi: 'बिस्किट और प्लेटें', hg: 'Biscuit aur plates' } });
  const g = it.g, N = 24;
  const bT = tex(128, 128, (x) => { const gr = x.createRadialGradient(64, 64, 20, 64, 64, 64); gr.addColorStop(0, '#e6b25c'); gr.addColorStop(1, '#c98a35'); x.fillStyle = gr; x.beginPath(); x.arc(64, 64, 63, 0, 7); x.fill();
    x.fillStyle = 'rgba(120,70,20,0.6)'; for (let i = 0; i < 9; i++) { const a = i * 0.7, rr = i ? 32 : 0; x.beginPath(); x.arc(64 + Math.cos(a) * rr, 64 + Math.sin(a) * rr, 3, 0, 7); x.fill(); } x.strokeStyle = 'rgba(150,90,30,0.7)'; x.lineWidth = 4; x.beginPath(); x.arc(64, 64, 56, 0, 7); x.stroke(); });
  const im = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.022, 0.022, 0.006, 24), [M(0xc98a35, 0.7), new THREE.MeshStandardMaterial({ map: bT, roughness: 0.7 }), M(0xc98a35, 0.7)], N); im.castShadow = true; im.frustumCulled = false; g.add(im);
  const PX = [-0.27, -0.09, 0.09, 0.27], plateT = tex(128, 128, (x) => { x.fillStyle = '#ffffff'; x.beginPath(); x.arc(64, 64, 63, 0, 7); x.fill(); x.strokeStyle = '#3aa0e0'; x.lineWidth = 8; x.beginPath(); x.arc(64, 64, 56, 0, 7); x.stroke(); });
  PX.forEach((px) => { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.006, 36), [M(0xffffff, 0.6), new THREE.MeshStandardMaterial({ map: plateT, roughness: 0.6 }), M(0xffffff, 0.6)]); p.position.set(px, 0.003, 0.11); g.add(p); });
  const tray = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.02, 0.12), new THREE.MeshStandardMaterial({ map: woodTex('#9a6534', 23), roughness: 0.6 })); tray.position.set(0, 0.01, -0.13); g.add(tray);
  const rd = liveSign(0.075, 3.4); rd.position.set(0, 0.17, -0.26); g.add(rd);
  animator(it); it.round = 0; it.mode = 'share'; let K = 1;
  const mtx = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = V(1, 1, 1);
  const home = (i) => V(-0.12 + (i % 6) * 0.048, 0.024 + Math.floor(i / 12) * 0.007, -0.15 + Math.floor((i % 12) / 6) * 0.05);
  const onPlate = (i) => { const p = i % 4, k = Math.floor(i / 4); return V(PX[p] + (k % 2 - 0.5) * 0.026, 0.01 + Math.floor(k / 2) * 0.0065, 0.11 + (k % 2 ? 0.012 : -0.012)); };
  const inPack = (i) => { const pk = Math.floor(i / 3), k = i % 3; return V(-0.3 + (pk % 8) * 0.085, 0.01 + k * 0.0065, -0.02); };
  const draw = () => { for (let i = 0; i < N; i++) { const dealt = Math.floor(i / 4) < it.round, moving = Math.floor(i / 4) === it.round - 1 && K < 1;
      let p = it.mode === 'pack' ? onPlate(i).lerp(inPack(i), ease(K)) : dealt ? (moving ? home(i).lerp(onPlate(i), ease(K)) : onPlate(i)) : home(i);
      if ((moving || it.mode === 'pack') && K < 1) p = p.clone().setY(p.y + Math.sin(K * Math.PI) * 0.05); mtx.compose(p, q, sc); im.setMatrixAt(i, mtx); } im.instanceMatrix.needsUpdate = true; };
  it.deal = (cb) => { if (it.busy || it.round >= 6) return false; it.round++; K = 0; it.play(0.7, (k) => { K = k; draw(); }, () => { K = 1; draw(); rd.set([`${it.round} × 4 = ${it.round * 4}`], '#ffd23f'); if (cb) cb(); }); return true; };
  it.packs = async (tween) => { it.mode = 'pack'; K = 0; await tween(2, (k) => { K = k; draw(); }); K = 1; draw(); };
  it.say = (l, c) => rd.set(l, c);
  draw(); it.say(['24 ÷ 4 = ?'], '#ffffff');
  it.leverPath = () => tableLever(g);
  return done1(it, { height: 0.05, radius: 0.45 });
}
export function bindBiscuitHands(bs, lever, app, s = { deal: 1 }, done = {}) {
  pushKnob(lever, { path: () => bs.leverPath(), active: () => stepNow(app, s.deal) && !bs.busy && bs.round < 6, keepVisible: () => app.runner.i === s.deal, press: () => bs.deal(() => { if (bs.round >= 6 && done.all) done.all(); }) });
}

// ------------------------------------------------------------------ Class 3 Ch 11 Filling and Lifting: a litre and a kilo
// A clear 1-litre bottle with marks, and a glass that holds 250 mL. Each push of the lever pours one glass in: four glasses
// fill the litre. Then a kitchen balance weighs four 250 g potatoes against a 1 kg weight.
export function litreKilo(o = {}) {
  const it = new Item('jlitre3', { ...o, name: { en: 'Bottle, glass and balance', hi: 'बोतल, गिलास और तराज़ू', hg: 'Bottle, glass aur taraazu' } });
  const g = it.g, BR = 0.042, BH = 0.2;
  const glassM = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.05, transmission: 0.9, thickness: 0.004, transparent: true, opacity: 0.35, depthWrite: false });
  const waterM = new THREE.MeshStandardMaterial({ color: 0x3f8fd6, roughness: 0.1, transparent: true, opacity: 0.7 });
  const bottle = new THREE.Group(); bottle.position.set(-0.18, 0, -0.08); g.add(bottle);
  const bw = new THREE.Mesh(new THREE.CylinderGeometry(BR, BR, BH, 32, 1, true), glassM); bw.position.y = BH / 2; bottle.add(bw);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.014, BR, 0.05, 24, 1, true), glassM); neck.position.y = BH + 0.025; bottle.add(neck);
  const water = new THREE.Mesh(new THREE.CylinderGeometry(BR * 0.95, BR * 0.95, 1, 32), waterM); water.position.y = 0; bottle.add(water);
  const marks = []; for (let k = 1; k <= 4; k++) { const y = (BH * 0.9) * k / 4; const m = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.002, 0.002), M(0x222222, 0.5)); m.position.set(-BR - 0.001, y, 0.01); m.rotation.y = 0.4; bottle.add(m); const t = tag(k === 4 ? '1 L' : `${k * 250} mL`, '#ffffff', 0.016); t.position.set(-BR - 0.045, y, 0); bottle.add(t); marks.push(t); }
  const gl = new THREE.Group(); gl.position.set(0.0, 0, 0.05); g.add(gl);
  const gw = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.03, 0.1, 28, 1, true), glassM); gw.position.y = 0.05; gl.add(gw);
  const gwat = new THREE.Mesh(new THREE.CylinderGeometry(0.033, 0.03, 0.085, 28), waterM); gwat.position.y = 0.043; gl.add(gwat);
  const gT = tag('250 mL', '#5ec8ff', 0.02); gT.position.set(0.0, 0.14, 0.05); g.add(gT);
  // a simple two-pan kitchen balance on the right
  const bal = new THREE.Group(); bal.position.set(0.2, 0, -0.06); g.add(bal); const metal = M(0xb8bec6, 0.3, 0.85);
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.012, 0.2, 12), metal); post.position.y = 0.1; bal.add(post);
  const beam = new THREE.Group(); beam.position.y = 0.2; bal.add(beam); const bm = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.006, 0.01), metal); beam.add(bm);
  const pans = [-0.12, 0.12].map((x) => { const p = new THREE.Group(); const dish = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.035, 0.012, 28), metal); dish.position.y = -0.11; p.add(dish);
    [0, 2.1, 4.2].forEach((a) => { const s2 = new THREE.Mesh(new THREE.CylinderGeometry(0.0008, 0.0008, 0.11, 4), M(0x777777)); s2.position.set(Math.cos(a) * 0.022, -0.055, Math.sin(a) * 0.022); s2.rotation.z = Math.cos(a) * 0.35; s2.rotation.x = -Math.sin(a) * 0.35; p.add(s2); }); p.position.x = x; beam.add(p); return p; });
  const wt = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.026, 0.03, 6), M(0x3a3a3a, 0.4, 0.7)); wt.position.set(0, -0.09, 0); pans[1].add(wt); const wtT = tag('1 kg', '#ffffff', 0.018); wtT.position.set(0, -0.035, 0.03); pans[1].add(wtT);
  const potT = tex(64, 64, (x) => { x.fillStyle = '#c9a06a'; x.fillRect(0, 0, 64, 64); const r = rnd(2); for (let i = 0; i < 40; i++) { x.fillStyle = 'rgba(90,60,30,0.5)'; x.beginPath(); x.arc(r() * 64, r() * 64, 1 + r() * 2, 0, 7); x.fill(); } });
  const pots = [0, 1, 2, 3].map((i) => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.022, 14, 10), new THREE.MeshStandardMaterial({ map: potT, roughness: 0.85 })); m.scale.set(1.35, 0.85, 1); m.visible = false; pans[0].add(m); m.position.set((i % 2 - 0.5) * 0.04, -0.093 + Math.floor(i / 2) * 0.02, (i < 2 ? -0.01 : 0.01)); return m; });
  const rd = liveSign(0.07, 3.4); rd.position.set(0, 0.24, -0.32); g.add(rd);
  animator(it); it.glasses = 0; it.potN = 0;
  const level = (v) => { const h = Math.max(0.001, BH * 0.9 * v); water.scale.y = h; water.position.y = h / 2; water.visible = v > 0.001; };
  const tilt = () => { const d = 1000 - it.potN * 250; beam.rotation.z = -Math.max(-0.25, Math.min(0.25, d / 1000 * 0.25)); pans.forEach((p) => { p.rotation.z = -beam.rotation.z; }); };
  it.pour = (cb) => { if (it.busy || it.glasses >= 4) return false; const v0 = it.glasses / 4, v1 = (it.glasses + 1) / 4, home = gl.position.clone(), lip = V(-0.13, 0.27, -0.08);
    it.play(2.0, (k) => { const up = k < 0.3 ? ease(k / 0.3) : k > 0.8 ? 1 - ease((k - 0.8) / 0.2) : 1; gl.position.lerpVectors(home, lip, up); gl.rotation.z = up * 1.9;
      if (k >= 0.3 && k <= 0.8) { const f = (k - 0.3) / 0.5; level(v0 + (v1 - v0) * f); gwat.scale.y = 1 - f; gwat.position.y = 0.043 * (1 - f); } },
    () => { gl.position.copy(home); gl.rotation.z = 0; gwat.scale.y = 1; gwat.position.y = 0.043; it.glasses++; level(it.glasses / 4); rd.set([`${it.glasses} × 250 mL = ${it.glasses * 250} mL`], '#5ec8ff'); if (cb) cb(); }); return true; };
  it.setPots = (n) => { it.potN = n; pots.forEach((m, i) => { m.visible = i < n; }); tilt(); };
  it.say = (l, c) => rd.set(l, c);
  level(0); it.setPots(0); it.say(['? mL'], '#ffffff');
  it.leverPath = () => tableLever(g);
  return done1(it, { height: 0.25, radius: 0.45 });
}
export function bindLitreHands(lk, lever, app, s = { pour: 1 }, done = {}) {
  pushKnob(lever, { path: () => lk.leverPath(), active: () => stepNow(app, s.pour) && !lk.busy && lk.glasses < 4, keepVisible: () => app.runner.i === s.pour, press: () => lk.pour(() => { if (lk.glasses >= 4 && done.all) done.all(); }) });
}

// ------------------------------------------------------------------ Class 3 Ch 12 Give and Take: jumps on a chalk number line
// A number line from 0 to 100 is drawn in chalk across the courtyard. A pebble starts at 38; each push of the lever is
// one jump: +10, +10, +5 lands on 63. Then it jumps back 27: −10, −10, −7 lands on 36.
export function chalkLine(o = {}) {
  const it = new Item('jline3', { ...o, name: { en: 'Chalk number line', hi: 'चॉक की संख्या रेखा', hg: 'Chalk ki number line' } });
  const g = it.g, U = 0.06, X0 = -3.0, Z = -2.0;
  const lineT = canvasTex(4096, 256, (x) => { x.clearRect(0, 0, 4096, 256); x.strokeStyle = 'rgba(250,250,245,0.95)'; x.fillStyle = 'rgba(250,250,245,0.95)'; x.lineWidth = 6; x.beginPath(); x.moveTo(20, 80); x.lineTo(4076, 80); x.stroke();
    for (let n = 0; n <= 100; n++) { const px = 20 + n * 40.56; x.lineWidth = n % 10 ? 3 : 7; x.beginPath(); x.moveTo(px, n % 10 ? 60 : 40); x.lineTo(px, n % 10 ? 100 : 120); x.stroke(); if (n % 10 === 0) { x.font = `700 70px ${FONT}`; x.textAlign = 'center'; x.fillText(String(n), px, 200); } } });
  const ln = new THREE.Mesh(new THREE.PlaneGeometry(100 * U * 4096 / 4056, 0.375), new THREE.MeshBasicMaterial({ map: lineT, transparent: true, depthWrite: false })); ln.rotation.x = -Math.PI / 2; ln.position.set(X0 + 50 * U, 0.012, Z + 0.06); g.add(ln);
  const peb = new THREE.Mesh(new THREE.SphereGeometry(0.035, 20, 14), M(0x7d7a74, 0.55)); peb.scale.set(1.2, 0.6, 1); peb.castShadow = true; g.add(peb);
  const arcs = []; const arcM = new THREE.MeshBasicMaterial({ color: 0xffd23f, toneMapped: false });
  const rd = liveSign(0.26, 3.4); rd.position.set(-0.2, 0.62, -2.9); g.add(rd);
  animator(it); it.np = 38; it.plan = [10, 10, 5]; it.k = 0; it.sum = 0;
  const xOf = (n) => X0 + n * U;
  it.place = () => { peb.position.set(xOf(it.np), 0.02, Z - 0.05); };
  const addArc = (a, b) => { const mid = (a + b) / 2, r = Math.abs(b - a) * U / 2; const geo = new THREE.TorusGeometry(r, 0.006, 6, 32, Math.PI); const m = new THREE.Mesh(geo, arcM); m.position.set(xOf(mid), 0.02, Z - 0.05); m.rotation.y = 0; g.add(m); arcs.push(m);
    const t = tag((b > a ? '+' : '−') + Math.abs(b - a), b > a ? '#8be07a' : '#ff8a5a', 0.1); t.position.set(xOf(mid), r + 0.12, Z - 0.05); g.add(t); arcs.push(t); };
  it.jump = (cb) => { if (it.busy || it.k >= it.plan.length) return false; const d = it.plan[it.k], a = it.np, b = a + d;
    it.play(0.8, (k) => { const n = a + d * ease(k); peb.position.set(xOf(n), 0.02 + Math.sin(k * Math.PI) * Math.abs(d) * U * 0.5, Z - 0.05); },
      () => { it.np = b; it.k++; it.place(); addArc(a, b); rd.set([`${it.start} ${d > 0 ? '+' : '−'} ${Math.abs(it.plan.slice(0, it.k).reduce((s, x) => s + x, 0))} = ${b}`], '#ffd23f'); if (cb) cb(); }); return true; };
  it.setPlan = (start, plan) => { it.start = start; it.np = start; it.plan = plan; it.k = 0; it.place(); };
  it.clearArcs = () => { arcs.forEach((m) => g.remove(m)); arcs.length = 0; };
  it.say = (l, c) => rd.set(l, c);
  it.setPlan(38, [10, 10, 5]); it.say(['38 + 25 = ?'], '#ffffff');
  it.leverPath = floorLever;
  return done1(it, { height: 0.05, radius: 3.2 });
}
export function bindJumpHands(cl, lever, app, s = { jump: 1 }, done = {}) {
  pushKnob(lever, { path: () => cl.leverPath(), active: () => stepNow(app, s.jump) && !cl.busy && cl.k < cl.plan.length, keepVisible: () => app.runner.i === s.jump, press: () => cl.jump(() => { if (cl.k >= cl.plan.length && done.all) done.all(); }) });
}

// ------------------------------------------------------------------ Class 3 Ch 13 Time Goes On: a big clock
// A big clock stands on the table. Slide the handle to turn the long hand once round: one hour passes, and the short
// hand moves from 7 to 8. Then half past 8 and quarter past 9.
export function bigClock(o = {}) {
  const it = new Item('jclock3', { ...o, name: { en: 'Big clock', hi: 'बड़ी घड़ी', hg: 'Badi ghadi' } });
  const g = it.g, R = 0.16, C = V(0, 0.2, -0.12);
  const faceT = tex(512, 512, (x) => { x.fillStyle = '#fbfaf6'; x.beginPath(); x.arc(256, 256, 250, 0, 7); x.fill(); x.strokeStyle = '#222'; x.lineCap = 'round';
    for (let m = 0; m < 60; m++) { const a = m * Math.PI / 30, r1 = m % 5 ? 228 : 215; x.lineWidth = m % 5 ? 3 : 8; x.beginPath(); x.moveTo(256 + Math.sin(a) * r1, 256 - Math.cos(a) * r1); x.lineTo(256 + Math.sin(a) * 240, 256 - Math.cos(a) * 240); x.stroke(); }
    x.fillStyle = '#1d2733'; x.font = `800 54px ${FONT}`; x.textAlign = 'center'; x.textBaseline = 'middle'; for (let h = 1; h <= 12; h++) { const a = h * Math.PI / 6; x.fillText(String(h), 256 + Math.sin(a) * 178, 258 - Math.cos(a) * 178); } });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(R + 0.015, R + 0.015, 0.04, 48), M(0x8a2b1e, 0.4, 0.3)); body.rotation.x = Math.PI / 2; body.position.copy(C).add(V(0, 0, -0.02)); g.add(body);
  const face = new THREE.Mesh(new THREE.CircleGeometry(R, 48), new THREE.MeshStandardMaterial({ map: faceT, roughness: 0.5 })); face.position.copy(C).add(V(0, 0, 0.001)); g.add(face);
  const stand = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.04, 0.1), new THREE.MeshStandardMaterial({ map: woodTex('#7a4a22', 5), roughness: 0.6 })); stand.position.set(0, 0.02, -0.14); g.add(stand);
  const hand = (len, w, c) => { const gg = new THREE.Group(); const m = new THREE.Mesh(new THREE.BoxGeometry(w, len, 0.004), M(c, 0.4, 0.4)); m.position.y = len / 2 - 0.01; gg.add(m); gg.position.copy(C).add(V(0, 0, 0.006)); g.add(gg); return gg; };
  const hh = hand(R * 0.55, 0.012, 0x1d2733), mh = hand(R * 0.85, 0.007, 0x1d2733); const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.012, 16), M(0xc0392b, 0.4)); pin.rotation.x = Math.PI / 2; pin.position.copy(C).add(V(0, 0, 0.012)); g.add(pin);
  const rd = liveSign(0.065, 3.4); rd.position.set(0.3, 0.12, -0.1); g.add(rd);
  it.min = 7 * 60;
  it.setMin = (m) => { it.min = m; mh.rotation.z = -(m % 60) * Math.PI / 30; hh.rotation.z = -((m / 60) % 12) * Math.PI / 6; const h = Math.floor(m / 60) % 12 || 12, mm = Math.round(m % 60); rd.set([`${h}:${String(mm).padStart(2, '0')}`], '#ffd23f'); if (it.onMin) it.onMin(m); };
  it.say = (l, c) => rd.set(l, c);
  it.setMin(420);
  it.knobPath = () => [TW(g)(-0.3, 0.1, 0.24), TW(g)(0.3, 0.1, 0.24)];
  return done1(it, { height: 0.4, radius: 0.3 });
}
export function bindClockHands(ck, knob, app, s = { turn: 1 }, done = {}) {
  const sync = slideKnob(knob, { path: () => ck.knobPath(), active: () => stepNow(app, s.turn), keepVisible: () => app.runner.i === s.turn, k: () => clamp01((ck.min - 420) / 60),
    set: (k) => { ck.setMin(420 + Math.round(clamp01(k) * 60)); if (ck.min >= 480 && done.hour) done.hour(); } });
  const s0 = ck.setMin; ck.setMin = (m) => { s0(m); sync(); };
}

// ------------------------------------------------------------------ Class 3 Ch 14 The Surajkund Fair: buying a pot with coins
// A potter's stall at the fair sells painted clay pots. The big pot costs ₹45. Each push of the lever puts one ₹10 coin on
// the counter: 10, 20, 30, 40, 50. The potter gives back ₹5. The pots have repeating patterns.
export function potStall(o = {}) {
  const it = new Item('jpots3', { ...o, name: { en: 'Pot stall', hi: 'मटकों की दुकान', hg: 'Matkon ki dukaan' } });
  const g = it.g;
  const clay = (pat) => tex(256, 128, (x) => { x.fillStyle = '#b5532d'; x.fillRect(0, 0, 256, 128); const cols = pat === 0 ? ['#f6e3c2', '#2b2b2b'] : pat === 1 ? ['#f2c230', '#2a6fd1'] : ['#ffffff', '#c0392b'];
    for (let i = 0; i < 16; i++) { x.fillStyle = cols[i % 2]; if (pat === 0) { x.beginPath(); x.moveTo(i * 16, 70); x.lineTo(i * 16 + 8, 50); x.lineTo(i * 16 + 16, 70); x.fill(); } else if (pat === 1) { x.beginPath(); x.arc(i * 16 + 8, 60, 6, 0, 7); x.fill(); } else x.fillRect(i * 16, 52, 8, 16); }
    x.fillStyle = 'rgba(0,0,0,0.15)'; x.fillRect(0, 40, 256, 3); x.fillRect(0, 80, 256, 3); });
  const potGeo = (s) => { const P = [[0.0, 0], [0.035, 0.002], [0.06, 0.02], [0.085, 0.06], [0.095, 0.1], [0.088, 0.14], [0.07, 0.17], [0.048, 0.19], [0.042, 0.205], [0.05, 0.215], [0.054, 0.222], [0.046, 0.224]]; return new THREE.LatheGeometry(P.map(([r2, y]) => new THREE.Vector2(r2 * s, y * s)), 40); };
  const pots = [[1.2, 0, -0.2, 45], [0.95, 1, 0.0, 30], [0.8, 2, 0.17, 25]].map(([s, pat, x, price]) => { const m = new THREE.Mesh(potGeo(s), new THREE.MeshStandardMaterial({ map: clay(pat), roughness: 0.85 })); m.castShadow = true; m.position.set(x, 0, -0.14); g.add(m);
    const t = tag('₹' + price, '#ffd23f', 0.026); t.position.set(x, 0.03, -0.01); g.add(t); return m; });
  void pots;
  const coinT = (v) => tex(128, 128, (x) => { const gr = x.createRadialGradient(54, 50, 10, 64, 64, 64); gr.addColorStop(0, v === 10 ? '#f1e2a6' : '#e8eaee'); gr.addColorStop(1, v === 10 ? '#b8a254' : '#9aa0a8'); x.fillStyle = gr; x.beginPath(); x.arc(64, 64, 62, 0, 7); x.fill();
    if (v === 10) { x.fillStyle = '#c8cdd4'; x.beginPath(); x.arc(64, 64, 44, 0, 7); x.fill(); } x.fillStyle = '#4a4a4a'; x.font = `800 50px ${FONT}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('₹' + v, 64, 68); });
  const c10M = new THREE.MeshStandardMaterial({ map: coinT(10), roughness: 0.35, metalness: 0.7 }), c5M = new THREE.MeshStandardMaterial({ map: coinT(5), roughness: 0.35, metalness: 0.7 });
  const coinG = new THREE.CylinderGeometry(0.0135, 0.0135, 0.0025, 32);
  const purse = []; for (let i = 0; i < 6; i++) { const c = new THREE.Mesh(coinG, [M(0xb8a254, 0.4, 0.7), c10M, c10M]); c.position.set(-0.12 + (i % 3) * 0.032, 0.0015 + Math.floor(i / 3) * 0.003, 0.17); g.add(c); purse.push(c); }
  const change = new THREE.Mesh(coinG, [M(0x9aa0a8, 0.4, 0.7), c5M, c5M]); change.visible = false; g.add(change);
  const counter = V(0.05, 0.0015, 0.1);
  const rd = liveSign(0.075, 3.4); rd.position.set(0, 0.3, -0.27); g.add(rd);
  animator(it); it.paid = 0;
  it.pay = (cb) => { if (it.busy || it.paid >= 5) return false; const c = purse[it.paid], a = c.position.clone(), b = counter.clone().add(V(it.paid * 0.004, it.paid * 0.0026, 0));
    it.play(0.6, (k) => { c.position.lerpVectors(a, b, ease(k)); c.position.y += Math.sin(k * Math.PI) * 0.05; }, () => { it.paid++; rd.set([`₹${it.paid * 10}`], it.paid * 10 >= 45 ? '#8be07a' : '#ffd23f'); if (cb) cb(); }); return true; };
  it.giveChange = async (tween) => { change.visible = true; const a = V(0.2, 0.04, -0.05), b = V(-0.03, 0.0015, 0.2); await tween(1, (k) => { change.position.lerpVectors(a, b, ease(k)); change.position.y += Math.sin(k * Math.PI) * 0.04; }); };
  it.say = (l, c) => rd.set(l, c);
  it.say(['₹45'], '#ffffff');
  it.leverPath = () => tableLever(g);
  return done1(it, { height: 0.3, radius: 0.45 });
}
export function bindPotHands(ps, lever, app, s = { pay: 1 }, done = {}) {
  pushKnob(lever, { path: () => ps.leverPath(), active: () => stepNow(app, s.pay) && !ps.busy && ps.paid < 5, keepVisible: () => app.runner.i === s.pay, press: () => ps.pay(() => { if (ps.paid >= 5 && done.all) done.all(); }) });
}
