// DUET Science Lab 360, physics in real places, batch PW1 (Classes 6 and 7, NCERT Curiosity): a bar magnet hanging
// free in the school courtyard, three kinds of motion on the playground, thermometers in the sun and in the shade,
// a playground swing as a pendulum, the shadow of a stick through the day, and a torch shining through glass, butter
// paper and cardboard. Real size, drawn here (no outside images); the places are the Maths Lab's 360° photos.
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
const tableLever = (g) => [TW(g)(-0.3, 0.1, 0.24), TW(g)(-0.3, 0.1, 0.32)];
const floorLever = () => [V(-0.45, 1.0, -0.3), V(-0.45, 1.0, -0.05)];
const floorKnob = () => [V(-0.45, 1.0, -0.42), V(0.45, 1.0, -0.42)];
const done1 = (it, o) => { noHit(it.g); it.noGrab = true; it.noPhys = true; it.base = 0; Object.assign(it, o); return it; };
const rod = (a, b, r, mat) => { const d = b.clone().sub(a), m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, d.length(), 10), mat); m.position.copy(a).add(b).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize()); m.castShadow = true; return m; };
// a growing trail of points (the path something moved along)
function trail(color, max = 400) {
  const geo = new THREE.BufferGeometry(); const pos = new Float32Array(max * 3); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setDrawRange(0, 0);
  const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color, toneMapped: false, transparent: true, opacity: 0.95 })); line.frustumCulled = false; let n = 0;
  line.push = (p) => { if (n > 0) { const i = (n - 1) * 3; if (Math.hypot(pos[i] - p.x, pos[i + 1] - p.y, pos[i + 2] - p.z) < 0.02) return; } if (n >= max) { pos.copyWithin(0, 3); n = max - 1; } pos[n * 3] = p.x; pos[n * 3 + 1] = p.y; pos[n * 3 + 2] = p.z; n++; geo.setDrawRange(0, n); geo.attributes.position.needsUpdate = true; };
  line.clear = () => { n = 0; geo.setDrawRange(0, 0); };
  return line;
}
// a stopwatch face that can be painted with a time
function stopwatch() {
  const sw = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.025, 40), M(0xc9ced2, 0.25, 0.85)); body.rotation.x = Math.PI / 2; sw.add(body);
  const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.025, 12), M(0xb8bec6, 0.3, 0.85)); crown.position.y = 0.072; sw.add(crown);
  const btn = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.012, 12), M(0xd93a2b, 0.4)); btn.position.y = 0.088; sw.add(btn);
  const faceT = canvasTex(256, 256, () => {}); const face = new THREE.Mesh(new THREE.CircleGeometry(0.052, 40), new THREE.MeshBasicMaterial({ map: faceT, toneMapped: false })); face.position.z = 0.0131; sw.add(face);
  let last = -1; sw.show = (t) => { const p10 = Math.round(t * 10); if (p10 === last) return; last = p10; const x = faceT.image.getContext('2d'); x.fillStyle = '#e9efe4'; x.beginPath(); x.arc(128, 128, 128, 0, 7); x.fill(); x.fillStyle = '#9cb08a'; x.fillRect(28, 88, 200, 80);
    x.fillStyle = '#111'; x.font = '800 64px monospace'; x.textAlign = 'center'; x.textBaseline = 'middle'; const s = Math.floor(p10 / 10), d = p10 % 10; x.fillText(`${String(s).padStart(2, '0')}.${d}`, 128, 130); x.font = `700 24px ${FONT}`; x.fillText('sec', 128, 200); faceT.needsUpdate = true; };
  sw.show(0); return sw;
}

// ------------------------------------------------------------------ Class 6 Ch 4 Exploring Magnets: a magnet hung free points north–south
// On a table in the school courtyard (North is straight ahead, marked with a chalk arrow) a bar magnet hangs from a
// thread on a wooden stand. Let go, it swings and settles with its N end pointing north; an iron bar does not.
export function hangingMagnet(o = {}) {
  const it = new Item('pmagnet6', { ...o, name: { en: 'Freely hanging bar magnet', hi: 'स्वतंत्र रूप से लटका छड़ चुंबक', hg: 'Free latka bar magnet' } });
  const g = it.g, w_ = o.W || ((k) => k), C = V(0, 0, -0.06), HY = 0.3;
  const wood = new THREE.MeshStandardMaterial({ map: woodTex('#7a4a22', 77), roughness: 0.55 });
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.02, 0.14), wood); base.position.set(C.x - 0.2, 0.01, C.z); base.castShadow = true; g.add(base);
  g.add(rod(V(C.x - 0.26, 0.02, C.z), V(C.x - 0.26, HY + 0.02, C.z), 0.008, wood)); g.add(rod(V(C.x - 0.265, HY + 0.015, C.z), V(C.x + 0.01, HY + 0.015, C.z), 0.007, wood));
  const thread = rod(V(C.x, HY + 0.01, C.z), V(C.x, 0.15, C.z), 0.0008, M(0xf2efe6, 0.9)); g.add(thread);
  const hang = new THREE.Group(); hang.position.set(C.x, 0.14, C.z); g.add(hang);
  const stir = new THREE.Mesh(new THREE.TorusGeometry(0.012, 0.0015, 6, 20), steelMat()); stir.rotation.y = Math.PI / 2; stir.position.y = 0.002; hang.add(stir);
  const split = (letters) => tex(256, 64, (x) => { x.fillStyle = '#c62828'; x.fillRect(0, 0, 128, 64); x.fillStyle = '#1e4f9c'; x.fillRect(128, 0, 128, 64);
    if (letters) { x.fillStyle = '#fff'; x.font = `900 46px ${FONT}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('N', 40, 34); x.fillText('S', 216, 34); } });
  const sideM = new THREE.MeshStandardMaterial({ map: split(false), roughness: 0.45, metalness: 0.3 }), topM = new THREE.MeshStandardMaterial({ map: split(true), roughness: 0.45, metalness: 0.3 });
  const mMag = [sideM, sideM, topM, sideM, M(0x1e4f9c, 0.45, 0.3), M(0xc62828, 0.45, 0.3)];
  const mIron = new THREE.MeshStandardMaterial({ map: tex(128, 64, (x) => { x.fillStyle = '#6e7378'; x.fillRect(0, 0, 128, 64); const r = rnd(4); for (let i = 0; i < 300; i++) { x.fillStyle = `rgba(30,30,30,${r() * 0.2})`; x.fillRect(r() * 128, r() * 64, 3, 1); } }), roughness: 0.5, metalness: 0.6 });
  const BW = 0.016, BD = 0.11, barG = new THREE.BoxGeometry(BW, BW, BD); // along z: the N end is at −z (it points north when the magnet rests)
  { const P = barG.attributes.position, uv = barG.attributes.uv; for (let i = 0; i < 16; i++) { const u = (P.getZ(i) + BD / 2) / BD; uv.setXY(i, u, i < 8 ? uv.getY(i) : (P.getX(i) + BW / 2) / BW); } }
  const bar = new THREE.Mesh(barG, mMag); bar.position.y = -0.006; bar.castShadow = true; hang.add(bar);
  // chalk arrow and letters on the table: North straight ahead
  const arT = tex(256, 512, (x) => { x.clearRect(0, 0, 256, 512); x.strokeStyle = 'rgba(255,255,255,0.92)'; x.fillStyle = 'rgba(255,255,255,0.92)'; x.lineWidth = 14; x.lineCap = 'round'; x.beginPath(); x.moveTo(128, 470); x.lineTo(128, 120); x.stroke(); x.beginPath(); x.moveTo(128, 60); x.lineTo(70, 160); x.lineTo(186, 160); x.closePath(); x.fill();
    x.font = `900 90px ${FONT}`; x.textAlign = 'center'; x.fillStyle = '#ffd23f'; x.fillText(w_('N'), 128, 48 + 20); });
  const ar = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 0.12), new THREE.MeshBasicMaterial({ map: arT, transparent: true, toneMapped: false, depthWrite: false })); ar.rotation.x = -Math.PI / 2; ar.position.set(C.x + 0.17, 0.002, C.z); g.add(ar);
  const card = new THREE.Mesh(new THREE.CircleGeometry(0.075, 48), new THREE.MeshStandardMaterial({ color: 0xf6efdc, roughness: 0.85 })); card.rotation.x = -Math.PI / 2; card.position.set(C.x, 0.0015, C.z); g.add(card);
  const nsLine = new THREE.Mesh(new THREE.PlaneGeometry(0.003, 0.15), new THREE.MeshBasicMaterial({ color: 0x8a6a4a, toneMapped: false })); nsLine.rotation.x = -Math.PI / 2; nsLine.position.set(C.x, 0.0018, C.z); g.add(nsLine);
  const rd = liveSign(0.07, 3.6); rd.position.set(0, 0.34, -0.3); g.add(rd);
  animator(it); it.phi = 70 * DEG; it.iron = false; it.turns = 0; hang.rotation.y = -it.phi;
  const show = () => { hang.rotation.y = -it.phi; const d = Math.round(((it.phi / DEG) % 360 + 540) % 360 - 180); rd.set([`${w_('N end')}: ${Math.abs(d)}° ${d === 0 ? '' : d > 0 ? w_('east of north') : w_('west of north')}`], Math.abs(d) <= 2 && !it.iron ? '#8be07a' : '#ffd23f'); };
  it.release = (phi0, cb) => { if (it.busy) return false; it.phi = phi0; let w = 0, last = 0; const T = it.iron ? 3 : 9, om = 2 * Math.PI / 1.7, z = 0.16;
    it.play(T, (k) => { let dt = (k - last) * T; last = k; while (dt > 0) { const h = Math.min(dt, 0.01); dt -= h; const acc = it.iron ? -0.8 * w : -om * om * Math.sin(it.phi) - 2 * z * om * w; w += acc * h; it.phi += w * h; } show(); },
      () => { if (!it.iron) it.phi = Math.round(it.phi / (2 * Math.PI)) * 2 * Math.PI; show(); it.turns++; if (!it.iron) rd.set([`${w_('N end')} → ${w_('North')}`, `${w_('S end')} → ${w_('South')}`], ['#8be07a', '#8be07a']); if (cb) cb(); }); return true; };
  it.toIron = () => { it.iron = true; bar.material = mIron; it.phi = 70 * DEG; show(); };
  it.say = (l, c) => rd.set(l, c);
  show(); it.say([w_('Let it turn freely')], '#ffffff');
  it.leverPath = () => tableLever(g);
  return done1(it, { height: 0.35, radius: 0.3 });
}
export function bindMagnetHands(hm, lever, app, s = { first: 1, again: 2 }, done = {}) {
  pushKnob(lever, { path: () => hm.leverPath(), active: () => !hm.busy && ((stepNow(app, s.first) && hm.turns === 0) || (stepNow(app, s.again) && hm.turns === 1)), keepVisible: () => app.runner.i === s.first || app.runner.i === s.again,
    press: () => hm.release(hm.turns === 0 ? 110 * DEG : -140 * DEG, () => { if (hm.turns === 1 && done.first) done.first(); if (hm.turns === 2 && done.again) done.again(); }) });
}

// ------------------------------------------------------------------ Class 6 Ch 5 Measurement of Length and Motion: three kinds of motion
// On the playground: a swing, a merry-go-round and a football. Each push of the lever sets one moving, and a coloured
// line draws its path: an arc (to and fro), a circle (round and round) and a straight line.
function swingFrame(g, cx, cz, L, top = 2.3) {
  const pipe = M(0x2f6fb5, 0.35, 0.6), chainM = M(0xa7adb3, 0.3, 0.85), seatM = new THREE.MeshStandardMaterial({ map: woodTex('#9a6a3a', 31), roughness: 0.6 });
  const zs = [cz + 0.6, cz - 0.6]; zs.forEach((z) => { g.add(rod(V(cx - 0.8, 0, z), V(cx, top, z), 0.035, pipe)); g.add(rod(V(cx + 0.8, 0, z), V(cx, top, z), 0.035, pipe)); });
  g.add(rod(V(cx, top, zs[0] + 0.05), V(cx, top, zs[1] - 0.05), 0.04, pipe));
  const sw = new THREE.Group(); sw.position.set(cx, top, cz); g.add(sw);
  const chains = []; [-0.2, 0.2].forEach((dz) => { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 1, 6), chainM); c.position.set(0, -0.5, dz); c.castShadow = true; sw.add(c); chains.push(c); });
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.03, 0.48), seatM); seat.castShadow = true; sw.add(seat);
  sw.setL = (l) => { sw.L = l; chains.forEach((c) => { c.scale.y = l; c.position.y = -l / 2; }); seat.position.y = -l - 0.015; };
  sw.setL(L); sw.seat = seat; return sw;
}
export function motionKinds(o = {}) {
  const it = new Item('pmotion6', { ...o, name: { en: 'Swing, merry-go-round and football', hi: 'झूला, गोल चकरी और फ़ुटबॉल', hg: 'Jhoola, gol chakri aur football' } });
  const g = it.g, w_ = o.W || ((k) => k);
  // swing on the left: it moves to and fro along x
  const SX = -2.4, SZ = -3.2; const sw = swingFrame(g, SX, SZ, 1.8);
  // merry-go-round in the middle
  const mg = new THREE.Group(); mg.position.set(0.2, 0, -3.8); g.add(mg);
  const segT = tex(512, 512, (x) => { const cols = ['#d93a2b', '#f2b632', '#2a6fd1', '#2f9a4a']; for (let i = 0; i < 8; i++) { x.fillStyle = cols[i % 4]; x.beginPath(); x.moveTo(256, 256); x.arc(256, 256, 256, i * Math.PI / 4, (i + 1) * Math.PI / 4); x.closePath(); x.fill(); } x.fillStyle = '#444'; x.beginPath(); x.arc(256, 256, 40, 0, 7); x.fill(); });
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.25, 20), M(0x555a60, 0.5, 0.5)); hub.position.y = 0.125; mg.add(hub);
  const rot = new THREE.Group(); rot.position.y = 0.3; mg.add(rot);
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 0.05, 48), [M(0x8a9097, 0.4, 0.6), new THREE.MeshStandardMaterial({ map: segT, roughness: 0.55 }), M(0x555a60)]); disc.castShadow = true; rot.add(disc);
  for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2, ca = Math.cos(a), sa = Math.sin(a); rot.add(rod(V(ca * 0.2, 0.03, sa * 0.2), V(ca * 0.95, 0.03, sa * 0.95), 0.012, M(0xd0d5da, 0.3, 0.8))); rot.add(rod(V(ca * 0.95, 0.03, sa * 0.95), V(ca * 0.95, 0.55, sa * 0.95), 0.018, M(0xf2b632, 0.4)));
    rot.add(rod(V(ca * 0.25, 0.55, sa * 0.25), V(ca * 0.95, 0.55, sa * 0.95), 0.016, M(0xf2b632, 0.4))); }
  const post = rod(V(0, 0.03, 0), V(0, 0.75, 0), 0.03, M(0xd0d5da, 0.3, 0.8)); rot.add(post);
  const rider = new THREE.Mesh(new THREE.SphereGeometry(0.06, 14, 10), M(0xffffff, 0.3)); rider.position.set(0.85, 0.09, 0); rot.add(rider);
  // football on the right, rolling away in a straight line
  const ballT = tex(256, 128, (x) => { x.fillStyle = '#f8f8f6'; x.fillRect(0, 0, 256, 128); x.fillStyle = '#111'; for (let i = 0; i < 6; i++) for (let j = 0; j < 3; j++) { const cx = 20 + i * 44 + (j % 2) * 22, cy = 20 + j * 44; x.beginPath(); for (let k = 0; k < 5; k++) { const a = k * 1.2566 - Math.PI / 2; x.lineTo(cx + Math.cos(a) * 12, cy + Math.sin(a) * 12); } x.closePath(); x.fill(); } });
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.11, 24, 16), new THREE.MeshStandardMaterial({ map: ballT, roughness: 0.5 })); ball.castShadow = true; const BX = 2.4, BZ0 = -1.8, BZ1 = -7.5; ball.position.set(BX, 0.11, BZ0); g.add(ball);
  const tr = [trail(0xffd23f), trail(0xff5a8a), trail(0x5ad1ff)]; tr.forEach((t) => g.add(t));
  const names = ['to and fro (periodic)', 'circular', 'straight line (linear)'], tg = names.map((k, i) => { const t = tag(w_(k), '#ffffff', 0.2); t.position.set([SX, 0.2, BX][i], 2.9, [SZ, -3.8, -4][i]); t.visible = false; g.add(t); return t; });
  const rd = liveSign(0.22, 3.6); rd.position.set(0, 3.5, -5); g.add(rd);
  animator(it); it.n = 0; let t0 = [0, 0, 0], T = 0; const on = [false, false, false]; const TS = 2 * Math.PI * Math.sqrt(1.8 / 9.8);
  const u0 = it.update; it.update = (dt) => { u0(dt); dt = Math.min(dt || 0.016, 0.05); T += dt;
    if (on[0]) { const a = 0.55 * Math.cos(2 * Math.PI * (T - t0[0]) / TS); sw.rotation.z = a; const p = sw.seat.getWorldPosition(V(0, 0, 0)); g.worldToLocal(p); tr[0].push(p); }
    if (on[1]) { rot.rotation.y += dt * 0.9; const p = rider.getWorldPosition(V(0, 0, 0)); g.worldToLocal(p); p.y += 0.05; tr[1].push(p); }
    if (on[2]) { const s = Math.min(1, (T - t0[2]) / 4.5), z = BZ0 + (BZ1 - BZ0) * (1 - (1 - s) * (1 - s)); const dz = z - ball.position.z; ball.position.z = z; ball.rotation.x += dz / 0.11; tr[2].push(V(BX, 0.02, z)); } };
  it.start = (cb) => { if (it.busy || it.n >= 3) return false; const i = it.n; it.play(0.6, () => {}, () => { on[i] = true; t0[i] = T; tg[i].visible = true; it.n++; rd.set([w_(names[i])], '#ffd23f'); if (cb) cb(); }); return true; };
  it.say = (l, c) => rd.set(l, c);
  it.say([w_('Three things that move')], '#ffffff');
  it.leverPath = floorLever;
  return done1(it, { height: 2.5, radius: 3.5 });
}
export function bindMotionHands(mk, lever, app, s = { start: 1 }, done = {}) {
  pushKnob(lever, { path: () => mk.leverPath(), active: () => stepNow(app, s.start) && !mk.busy && mk.n < 3, keepVisible: () => app.runner.i === s.start, press: () => mk.start(() => { if (mk.n >= 3 && done.all) done.all(); }) });
}

// ------------------------------------------------------------------ Class 6 Ch 7 Temperature and its Measurement: sun and shade
// Two same weather thermometers (0–50 °C, 1 °C marks) on posts in the school courtyard: one in the sun, one under a big
// umbrella. The slider moves the time from 8 a.m. to 2 p.m.; the red liquid rises in both, more in the sun.
function thermometer(w_) {
  const t = new THREE.Group(); const L = 0.56, Y0 = 0.08; // bulb at the bottom; 0 °C at Y0, 50 °C at Y0 + L
  const board = new THREE.Mesh(new THREE.BoxGeometry(0.11, L + 0.18, 0.012), M(0xf7f5ee, 0.6)); board.position.set(0, Y0 + L / 2, -0.012); t.add(board);
  const scT = tex(256, 1280, (x) => { x.fillStyle = '#f7f5ee'; x.fillRect(0, 0, 256, 1280); const yOf = (c) => 1280 - (0.09 + (c / 50) * L) / (L + 0.18) * 1280; x.strokeStyle = '#1d2733'; x.fillStyle = '#1d2733'; x.textAlign = 'right'; x.textBaseline = 'middle';
    for (let c = 0; c <= 50; c++) { const y = yOf(c), big = c % 10 === 0, mid = c % 5 === 0; x.lineWidth = big ? 4 : 2; x.beginPath(); x.moveTo(big ? 150 : mid ? 162 : 172, y); x.lineTo(192, y); x.stroke(); x.beginPath(); x.moveTo(64, y); x.lineTo(big ? 106 : mid ? 96 : 86, y); x.stroke(); if (big || c % 5 === 0) { x.font = `800 ${big ? 46 : 30}px ${FONT}`; x.fillText(String(c), 252, y); } }
    x.font = `800 44px ${FONT}`; x.textAlign = 'center'; x.fillText('°C', 128, 60); });
  const face = new THREE.Mesh(new THREE.PlaneGeometry(0.11, L + 0.18), new THREE.MeshStandardMaterial({ map: scT, roughness: 0.6 })); face.position.set(0, Y0 + L / 2, -0.0055); t.add(face);
  const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, L + 0.06, 12), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.05, transparent: true, opacity: 0.35 })); glass.position.set(-0.004, Y0 + L / 2 + 0.02, 0.004); t.add(glass);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.011, 16, 12), M(0xd0141e, 0.25)); bulb.position.set(-0.004, Y0 - 0.075 + 0.075 - 0.01, 0.004); t.add(bulb);
  const col = new THREE.Mesh(new THREE.CylinderGeometry(0.0028, 0.0028, 1, 8), new THREE.MeshStandardMaterial({ color: 0xd0141e, roughness: 0.3, emissive: 0x300004 })); t.add(col);
  t.setC = (c) => { const h = Math.max(0.002, 0.01 + (c / 50) * L); col.scale.y = h; col.position.set(-0.004, Y0 - 0.01 + h / 2, 0.004); t.c = c; };
  t.setC(25); void w_; return t;
}
export function sunShadeThermo(o = {}) {
  const it = new Item('pthermo6', { ...o, name: { en: 'Thermometers in sun and shade', hi: 'धूप और छाँव में थर्मामीटर', hg: 'Dhoop aur chhaanv mein thermometer' } });
  const g = it.g, w_ = o.W || ((k) => k), Z = -0.85;
  const postM = new THREE.MeshStandardMaterial({ map: woodTex('#8a5a2b', 13), roughness: 0.6 });
  const th = [-0.42, 0.42].map((x) => { const p = new THREE.Mesh(new THREE.BoxGeometry(0.07, 1.35, 0.07), postM); p.position.set(x, 0.675, Z - 0.05); p.castShadow = true; g.add(p); const foot = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.04, 0.3), postM); foot.position.set(x, 0.02, Z - 0.05); g.add(foot);
    const t = thermometer(w_); t.position.set(x, 0.62, Z); g.add(t); return t; });
  // a big garden umbrella over the right one
  const um = new THREE.Group(); um.position.set(0.9, 0, Z - 0.25); g.add(um);
  um.add(rod(V(0, 0, 0), V(0, 2.25, 0), 0.02, M(0xdedede, 0.3, 0.6)));
  const canT = tex(512, 64, (x) => { for (let i = 0; i < 8; i++) { x.fillStyle = i % 2 ? '#f4efe2' : '#1f6f4a'; x.fillRect(i * 64, 0, 64, 64); } });
  const can = new THREE.Mesh(new THREE.ConeGeometry(1.15, 0.45, 16, 1, true), new THREE.MeshStandardMaterial({ map: canT, roughness: 0.8, side: THREE.DoubleSide })); can.position.y = 2.1; can.castShadow = true; um.add(can);
  const shade = new THREE.Mesh(new THREE.CircleGeometry(1.0, 40), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.38, depthWrite: false })); shade.rotation.x = -Math.PI / 2; shade.position.set(-0.35, 0.004, 0.1); um.add(shade);
  const lab = [tag(w_('In the sun'), '#ffd23f', 0.1), tag(w_('In the shade'), '#9fd3ff', 0.1)]; lab.forEach((t, i) => { t.position.set(i ? 0.42 : -0.42, 1.52, Z); g.add(t); });
  const clk = tag('8:00 a.m.', '#ffffff', 0.12); clk.position.set(0, 1.85, Z - 0.3); g.add(clk);
  const rd = liveSign(0.13, 3.6); rd.position.set(0, 1.65, Z - 0.3); g.add(rd);
  it.k = 0;
  const fmt = (k) => { const m = 8 * 60 + Math.round(k * 360), h = Math.floor(m / 60), mi = m % 60; return `${h > 12 ? h - 12 : h}:${String(mi).padStart(2, '0')} ${h >= 12 ? 'p.m.' : 'a.m.'}`; };
  it.setK = (k) => { it.k = k; const e = Math.sin(k * Math.PI / 2); const cs = 25 + 16 * e, cd = 25 + 8 * e; th[0].setC(cs); th[1].setC(cd); clk.setText(fmt(k));
    rd.set([`${w_('Sun')} ${Math.round(cs)} °C   ·   ${w_('Shade')} ${Math.round(cd)} °C`], k >= 1 - 1e-6 ? '#8be07a' : '#ffd23f'); if (it.onK) it.onK(k); };
  it.say = (l, c) => rd.set(l, c);
  it.setK(0);
  it.knobPath = floorKnob;
  return done1(it, { height: 2.3, radius: 1.3 });
}
export function bindThermoHands(st, knob, app, s = { time: 1 }, done = {}) {
  const sync = slideKnob(knob, { path: () => st.knobPath(), active: () => stepNow(app, s.time), keepVisible: () => app.runner.i === s.time, k: () => st.k,
    set: (k) => { const kk = clamp01(k > 0.975 ? 1 : k); if (kk > st.k) st.setK(kk); if (st.k >= 1 - 1e-6 && done.noon) done.noon(); } });
  const s0 = st.setK; st.setK = (k) => { s0(k); sync(); };
}

// ------------------------------------------------------------------ Class 7 Ch 8 Measurement of Time and Motion: a swing as a pendulum
// A playground swing right in front of you, its chains 2 m long. Slide the handle to pull the seat to one side; at the
// end it is let go and a stopwatch times 5 oscillations. Then the chains are hooked shorter (1.2 m) and it swings again.
export function swingPendulum(o = {}) {
  const it = new Item('pswing7', { ...o, name: { en: 'Playground swing and stopwatch', hi: 'झूला और स्टॉपवॉच', hg: 'Jhoola aur stopwatch' } });
  const g = it.g, w_ = o.W || ((k) => k), TOP = 2.4, CZ = -1.5;
  const sw = swingFrame(g, 0, CZ, 2.0, TOP);
  const st = stopwatch(); st.position.set(0.42, 1.12, -0.5); st.rotation.x = 0.45; g.add(st);
  const cnt = tag('0', '#ffd23f', 0.18); cnt.position.set(0, TOP + 0.35, CZ); g.add(cnt);
  const lenT = tag('2.0 m', '#ffffff', 0.12); lenT.position.set(-0.25, TOP - 1.0, CZ + 0.3); g.add(lenT);
  const tr = trail(0xffd23f, 300); g.add(tr);
  const rd = liveSign(0.16, 3.6); rd.position.set(0, 2.95, CZ - 0.6); g.add(rd);
  animator(it); it.k = 0; it.runs = 0; it.A = 0; const AMAX = 24 * DEG;
  const per = () => 2 * Math.PI * Math.sqrt(sw.L / 9.8);
  const pose = (a) => { sw.rotation.z = a; const p = sw.seat.getWorldPosition(V(0, 0, 0)); g.worldToLocal(p); tr.push(p); };
  it.setK = (k) => { if (it.busy) return; it.k = k; it.A = AMAX * k; pose(-it.A); rd.set([`${w_('Pulled to')} ${Math.round(it.A / DEG)}°`], '#ffd23f'); if (it.onK) it.onK(k); };
  it.swing = (cb) => { if (it.busy) return false; const T = per(), N = 5, D = N * T, A = it.A || AMAX; tr.clear(); st.show(0);
    it.play(D + 0.6, (k) => { const t = Math.min(D, k * (D + 0.6)); pose(-A * Math.cos(2 * Math.PI * t / T) * Math.exp(-t / 60)); st.show(t); const n = Math.min(N, Math.floor(t / T + 1e-6)); cnt.setText(String(n)); },
      () => { it.runs++; st.show(D); cnt.setText(String(N)); rd.set([`5 ${w_('oscillations')}: ${D.toFixed(1)} s`, `1 ${w_('oscillation')}: ${T.toFixed(1)} s`], ['#8be07a', '#ffd23f']); if (cb) cb(); }); return true; };
  it.shorten = (cb) => { if (it.busy) return false; const L0 = sw.L; it.play(1.6, (k) => { sw.setL(L0 + (1.2 - L0) * ease(k)); lenT.position.y = TOP - sw.L / 2; lenT.setText(`${sw.L.toFixed(1)} m`); }, () => { sw.setL(1.2); lenT.setText('1.2 m'); tr.clear(); it.A = AMAX; if (cb) cb(); }); return true; };
  it.say = (l, c) => rd.set(l, c);
  pose(0); it.say([`${w_('Chains')}: 2.0 m`], '#ffffff');
  it.knobPath = () => { const P = floorKnob(); return [P[1], P[0]]; }; // pull to the left
  return done1(it, { height: 2.6, radius: 1.5 });
}
export function bindSwingHands(sp, knob, app, s = { pull: 1 }, done = {}) {
  const sync = slideKnob(knob, { path: () => sp.knobPath(), active: () => stepNow(app, s.pull) && sp.runs === 0 && !sp.busy, keepVisible: () => app.runner.i === s.pull, k: () => sp.k,
    set: (k) => { const kk = clamp01(k); if (sp.busy || sp.runs > 0) return; sp.setK(kk); if (kk > 0.97) sp.swing(() => done.swung && done.swung()); } });
  const s0 = sp.setK; sp.setK = (k) => { s0(k); sync(); };
}

// ------------------------------------------------------------------ Class 7 Ch 12 Earth, Moon, and the Sun: a stick's shadow through the day
// A 1 m stick stands in an open field in central India (about 23° N) on a day in March. The slider moves the time from
// 8 a.m. to 4 p.m.; the Sun moves from east through south to west and the stick's shadow turns from west through north to
// east, shortest at noon. A chalk mark is left at the shadow's tip every hour.
export function stickShadow(o = {}) {
  const it = new Item('pshadow7', { ...o, name: { en: 'Stick and its shadow', hi: 'डंडा और उसकी छाया', hg: 'Danda aur uski chhaaya' } });
  const g = it.g, w_ = o.W || ((k) => k), B = V(0, 0, -2.2), H = 1.0, LAT = 23 * DEG;
  const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.02, H, 10), new THREE.MeshStandardMaterial({ map: woodTex('#b98a4e', 81), roughness: 0.7 })); stick.position.set(B.x, H / 2, B.z); g.add(stick);
  const sheet = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 2.6), new THREE.MeshStandardMaterial({ color: 0xf2efe6, roughness: 0.95 })); sheet.rotation.x = -Math.PI / 2; sheet.position.set(B.x, 0.003, B.z - 0.7); sheet.receiveShadow = false; g.add(sheet);
  const dirT = [['N', 0, -1.95], ['S', 0, 0.45], ['E', 2.15, -0.7], ['W', -2.15, -0.7]].map(([k, x, z]) => { const t = tag(w_(k), '#1d2733', 0.14, 'rgba(255,255,255,0.9)'); t.position.set(B.x + x, 0.12, B.z + z); g.add(t); return t; }); void dirT;
  const shM = new THREE.MeshBasicMaterial({ color: 0x1a1a1a, transparent: true, opacity: 0.55, depthWrite: false });
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.035), shM); shadow.rotation.x = -Math.PI / 2; g.add(shadow);
  const sun = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex(128, 128, (x) => { const gr = x.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,255,240,1)'); gr.addColorStop(0.35, 'rgba(255,240,180,0.95)'); gr.addColorStop(1, 'rgba(255,220,120,0)'); x.fillStyle = gr; x.fillRect(0, 0, 128, 128); }), depthTest: true, toneMapped: false, transparent: true })); sun.scale.set(5, 5, 1); g.add(sun);
  const dotM = new THREE.MeshBasicMaterial({ color: 0xd93a2b, toneMapped: false }); const marks = [];
  const rd = liveSign(0.2, 3.6); rd.position.set(0, 2.1, -3.6); g.add(rd);
  it.k = 0;
  const sunDir = (hr) => { const h = (hr - 12) * 15 * DEG; return V(-Math.sin(h), Math.cos(h) * Math.cos(LAT), Math.cos(h) * Math.sin(LAT)).normalize(); }; // x east, y up, z south (+z is towards you: south)
  const tipAt = (hr) => { const s = sunDir(hr); const k = H / s.y; return V(B.x - s.x * k, 0.006, B.z - s.z * k); };
  const card = (hr) => { const s = sunDir(hr); const d = V(-s.x, 0, -s.z); const a = Math.atan2(d.x, -d.z) / DEG; const n = ((Math.round(a / 45) % 8) + 8) % 8; return ['North', 'North-East', 'East', 'South-East', 'South', 'South-West', 'West', 'North-West'][n]; };
  it.setK = (k) => { it.k = k; const hr = 8 + 8 * k, s = sunDir(hr), tip = tipAt(hr), d = tip.clone().sub(V(B.x, 0.006, B.z)), len = d.length();
    shadow.scale.x = len; shadow.position.copy(V(B.x, 0.006, B.z)).addScaledVector(d, 0.5); shadow.rotation.z = -Math.atan2(d.z, d.x); shadow.rotation.order = 'XYZ';
    sun.position.copy(s).multiplyScalar(40).add(V(0, 0, -2.2));
    for (let h = 8; h <= 16; h++) if (h <= hr + 1e-6 && !marks[h]) { const m = new THREE.Mesh(new THREE.CircleGeometry(0.03, 16), dotM); m.rotation.x = -Math.PI / 2; m.position.copy(tipAt(h)).setY(0.008); g.add(m); const t = tag(`${h > 12 ? h - 12 : h}${h >= 12 ? 'pm' : 'am'}`, '#ffffff', 0.08); t.position.copy(tipAt(h)).setY(0.14); g.add(t); marks[h] = [m, t]; }
    const H24 = Math.floor(hr), mi = Math.round((hr - H24) * 60) % 60; rd.set([`${H24 > 12 ? H24 - 12 : H24}:${String(mi).padStart(2, '0')} ${H24 >= 12 ? 'p.m.' : 'a.m.'}   ·   ${w_('shadow')} ${len.toFixed(2)} m → ${w_(card(hr))}`], k >= 1 - 1e-6 ? '#8be07a' : '#ffd23f'); if (it.onK) it.onK(k); };
  it.noon = () => { const L = tipAt(12).sub(V(B.x, 0.006, B.z)).length(); rd.set([`12:00 · ${w_('shortest')}: ${L.toFixed(2)} m → ${w_('North')}`], '#8be07a'); };
  it.say = (l, c) => rd.set(l, c);
  it.setK(0);
  it.knobPath = floorKnob;
  return done1(it, { height: 1.2, radius: 2.5 });
}
export function bindShadowHands(ss, knob, app, s = { day: 1 }, done = {}) {
  const sync = slideKnob(knob, { path: () => ss.knobPath(), active: () => stepNow(app, s.day), keepVisible: () => app.runner.i === s.day, k: () => ss.k,
    set: (k) => { const kk = clamp01(k > 0.98 ? 1 : k); if (kk > ss.k) ss.setK(kk); if (ss.k >= 1 - 1e-6 && done.evening) done.evening(); } });
  const s0 = ss.setK; ss.setK = (k) => { s0(k); sync(); };
}

// ------------------------------------------------------------------ Class 7 Ch 11 Light: Shadows and Reflections: through glass, butter paper, cardboard
// On a classroom table a torch shines on a white screen. Each push of the lever holds a new sheet in the beam: clear
// glass (the patch stays bright), butter paper (dim and fuzzy) and a cardboard cut-out of a star (a sharp dark shadow).
export function torchSheets(o = {}) {
  const it = new Item('ptorch7', { ...o, name: { en: 'Torch, sheets and screen', hi: 'टॉर्च, शीटें और पर्दा', hg: 'Torch, sheets aur parda' } });
  const g = it.g, w_ = o.W || ((k) => k), Y = 0.1, Z = -0.08, XT = -0.34, XS = -0.12, XW = 0.3;
  // torch: a steel body pointing along +x
  const tb = new THREE.Group(); tb.position.set(XT, Y, Z); g.add(tb);
  const bodyM = M(0x2b2f35, 0.35, 0.6); const body = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.13, 20), bodyM); body.rotation.z = Math.PI / 2; body.position.x = -0.06; tb.add(body);
  const headM = M(0xc9ced2, 0.25, 0.85); const head = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.019, 0.04, 24), headM); head.rotation.z = -Math.PI / 2; head.position.x = 0.025; tb.add(head);
  const lens = new THREE.Mesh(new THREE.CircleGeometry(0.027, 24), new THREE.MeshBasicMaterial({ color: 0xfff6d0, toneMapped: false })); lens.rotation.y = Math.PI / 2; lens.position.x = 0.0455; tb.add(lens);
  const stand = new THREE.Mesh(new THREE.BoxGeometry(0.08, Y - 0.02, 0.05), new THREE.MeshStandardMaterial({ map: woodTex('#6b3f1d', 17), roughness: 0.6 })); stand.position.set(XT - 0.04, (Y - 0.02) / 2, Z); g.add(stand);
  // screen: white card on a wooden stand
  const scr = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.26, 0.3), M(0xf7f7f2, 0.85)); scr.position.set(XW, 0.13, Z); scr.castShadow = true; g.add(scr);
  const sb = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.015, 0.2), new THREE.MeshStandardMaterial({ map: woodTex('#6b3f1d', 17), roughness: 0.6 })); sb.position.set(XW, 0.0075, Z); g.add(sb);
  const patchT = canvasTex(256, 256, () => {}); const patch = new THREE.Mesh(new THREE.PlaneGeometry(0.25, 0.25), new THREE.MeshBasicMaterial({ map: patchT, transparent: true, toneMapped: false, depthWrite: false })); patch.rotation.y = -Math.PI / 2; patch.position.set(XW - 0.0045, Y, Z); g.add(patch);
  const paint = (mode) => { const x = patchT.image.getContext('2d'); x.clearRect(0, 0, 256, 256); const R = 92, b = mode === 1 ? 0.5 : 1, blur = mode === 1 ? 40 : 6;
    const gr = x.createRadialGradient(128, 128, Math.max(1, R - blur), 128, 128, R + blur); gr.addColorStop(0, `rgba(255,248,200,${0.95 * b})`); gr.addColorStop(1, 'rgba(255,248,200,0)'); x.fillStyle = gr; x.beginPath(); x.arc(128, 128, R + blur, 0, 7); x.fill();
    if (mode === 0) { x.fillStyle = `rgba(255,255,235,${0.95})`; x.beginPath(); x.arc(128, 128, R - 4, 0, 7); x.fill(); }
    if (mode === 2) { x.fillStyle = '#26221c'; x.beginPath(); for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, r = k % 2 ? 35 : 86; x.lineTo(128 + Math.cos(a) * r, 128 + Math.sin(a) * r); } x.closePath(); x.fill(); }
    patchT.needsUpdate = true; };
  paint(0);
  // the beam: a faint cone
  const cone = new THREE.Mesh(new THREE.CylinderGeometry(0.092, 0.027, XW - XT - 0.05, 24, 1, true), new THREE.MeshBasicMaterial({ color: 0xfff1b0, transparent: true, opacity: 0.08, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }));
  cone.rotation.z = Math.PI / 2; cone.position.set((XT + 0.05 + XW) / 2, Y, Z); g.add(cone);
  // sheets in a holder
  const holder = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.012, 0.16), new THREE.MeshStandardMaterial({ map: woodTex('#6b3f1d', 17), roughness: 0.6 })); holder.position.set(XS, 0.006, Z); g.add(holder);
  const glassM = new THREE.MeshStandardMaterial({ color: 0xe6f4ff, roughness: 0.03, transparent: true, opacity: 0.25 }), butterM = new THREE.MeshStandardMaterial({ color: 0xf4efe0, roughness: 0.9, transparent: true, opacity: 0.72 }), cardM = new THREE.MeshStandardMaterial({ color: 0xa9875a, roughness: 0.95 });
  const sheet = (m) => { const s = new THREE.Mesh(new THREE.BoxGeometry(0.003, 0.18, 0.14), m); s.position.set(XS, 0.09 + 0.25, Z); s.visible = false; g.add(s); return s; };
  const starShape = new THREE.Shape(); for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, r = k % 2 ? 0.0095 : 0.023; const px = Math.cos(a) * r, py = -Math.sin(a) * r; if (k) starShape.lineTo(px, py); else starShape.moveTo(px, py); }
  const card = new THREE.Group(); card.position.set(XS, 0.25, Z); card.visible = false; g.add(card);
  const starG = new THREE.ExtrudeGeometry(starShape, { depth: 0.003, bevelEnabled: false }); starG.rotateY(Math.PI / 2); const star = new THREE.Mesh(starG, cardM); star.position.y = Y; card.add(star);
  const stick = new THREE.Mesh(new THREE.BoxGeometry(0.003, Y - 0.02, 0.006), cardM); stick.position.y = (Y - 0.02) / 2; card.add(stick);
  const sheets = [sheet(glassM), sheet(butterM), card];
  const names = ['glass', 'butter paper', 'cardboard'], kinds = ['transparent', 'translucent', 'opaque'];
  const rd = liveSign(0.07, 3.6); rd.position.set(0, 0.34, -0.32); g.add(rd);
  animator(it); it.n = 0;
  it.next = (cb) => { if (it.busy || it.n >= 3) return false; const i = it.n, prev = i > 0 ? sheets[i - 1] : null, cur = sheets[i];
    cur.visible = true; it.play(1.0, (k) => { const e = ease(k); if (prev) prev.position.y = (prev === card ? 0 : 0.09) + 0.25 * e; cur.position.y = (cur === card ? 0 : 0.09) + 0.25 * (1 - e); if (k > 0.6) paint(i); },
      () => { if (prev) prev.visible = false; cur.position.y = cur === card ? 0 : 0.09; paint(i); it.n++; rd.set([`${w_(names[i])}: ${w_(kinds[i])}`], ['#8be07a', '#ffd23f', '#ff8a5a'][i]); if (cb) cb(); }); return true; };
  it.say = (l, c) => rd.set(l, c);
  it.say([w_('Light from the torch on the screen')], '#ffffff');
  it.leverPath = () => tableLever(g);
  return done1(it, { height: 0.3, radius: 0.4 });
}
export function bindTorchHands(ts, lever, app, s = { hold: 1 }, done = {}) {
  pushKnob(lever, { path: () => ts.leverPath(), active: () => stepNow(app, s.hold) && !ts.busy && ts.n < 3, keepVisible: () => app.runner.i === s.hold, press: () => ts.next(() => { if (ts.n >= 3 && done.all) done.all(); }) });
}
