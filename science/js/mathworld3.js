// DUET Maths Lab 360, hands-on in 3D, batch 3: the student rides a glass lift through floors above and below the ground
// (integers), zooms into a ruler until they stand on its hundredths (decimals), folds a sheet of paper until it would reach
// beyond the Moon (powers), and opens a cylinder into its net, fills it and stands inside it (surface area and volume).
import * as THREE from 'three';
import { Item } from './apparatus.js';
import { canvasTex, photoTex } from './mats.js';
import { ease, lerp, clamp01 } from './mathlab2.js';
import { glow, rod, setRod, handle, seg } from './mathworld.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const FONT = '"Noto Sans Devanagari", "Noto Sans", system-ui, sans-serif';
// the step the student is on (handles work only in their own step)
const stepNow = (app, i) => { const r = app.runner; return !!(r.exp && r.i === i && r.state === 'todo'); };
const M = (c, r = 0.6, m = 0, e = 0) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m, emissive: c, emissiveIntensity: e });
// many boxes of one material become one mesh (few draw calls in the headset)
function merger() {
  const parts = new Map();
  const add = (m, geo) => { if (!parts.has(m)) parts.set(m, []); parts.get(m).push(geo); };
  const bx = (m, sx, sy, sz, x, y, z) => { const b = new THREE.BoxGeometry(sx, sy, sz); b.translate(x, y, z); add(m, b); return b; };
  const flush = (parent, o = {}) => { for (const [m, list] of parts) { const mesh = new THREE.Mesh(mergeGeometries(list), m); mesh.userData.noHit = true; mesh.receiveShadow = !!o.shadow; mesh.castShadow = !!o.cast; parent.add(mesh); } parts.clear(); };
  return { add, bx, flush };
}
// a flat sign (a plane with text), facing +z
function plate(lines, w, h, o = {}) {
  const W = 1024, H = Math.round((1024 * h) / w);
  const t = canvasTex(W, H, (x) => {
    x.fillStyle = o.bg || '#f4f1e8'; x.fillRect(0, 0, W, H);
    if (o.border) { x.strokeStyle = o.border; x.lineWidth = 24; x.strokeRect(12, 12, W - 24, H - 24); }
    x.textAlign = 'center'; x.textBaseline = 'middle';
    const n = lines.length; lines.forEach((l, i) => { const [txt, size, col] = l; x.fillStyle = col || o.color || '#1d2330'; x.font = `800 ${size}px ${FONT}`; x.fillText(txt, W / 2, (H * (i + 0.5)) / n); });
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), o.lit ? new THREE.MeshStandardMaterial({ map: t, roughness: 0.8 }) : new THREE.MeshBasicMaterial({ map: t, toneMapped: false }));
  m.userData.noHit = true; return m;
}
const fmtInt = (n) => (n > 0 ? '+' + n : n < 0 ? '−' + -n : '0');

// a knob that is pushed along a short path, or simply clicked / pinched: each push counts once, and it springs back
export function pushKnob(knob, o) {
  let k0 = 0, fired = false, wasHeld = false;
  handle(knob, { path: o.path, active: o.active, keepVisible: o.keepVisible,
    move: (k) => { k0 = k; if (k > 0.7 && !fired) { fired = true; o.press(); } if (k < 0.25) fired = false; },
    at: () => { const [A, B] = o.path(); return knob.held ? A.clone().lerp(B, k0) : A.clone(); } });
  const u0 = knob.update; knob.update = (dt, t) => { u0(dt, t); if (knob.held && !wasHeld) { wasHeld = true; fired = false; } };
  const r0 = knob.onRelease; knob.onRelease = () => { const pressed = fired; r0(); if (wasHeld && !pressed && o.active()) o.press(); k0 = 0; fired = false; wasHeld = false; };
  knob.g.position.copy(o.path()[0]);
}

// ------------------------------------------------------------------ Class 6: the other side of zero, in a glass lift
// The student stands in a glass lift on the side of the school building. The ground floor is 0, the floors above are
// +1 … +5 and the floors below the ground are −1, −2, −3. The lift stands still and the building (and the courtyard
// photo) slide past it. A vertical number line runs up the shaft beside the door.
export function liftRide(o = {}) {
  const it = new Item('wlift', { ...o, name: { en: 'Glass lift', hi: 'काँच की लिफ़्ट', hg: 'Glass lift' } });
  const g = it.g, FH = 3, NMIN = -3, NMAX = 5, names = o.names || {};
  const B = merger();
  const steel = M(0xb8c0c8, 0.32, 0.85, 0.02), dark = M(0x2b3036, 0.7, 0.2), floorM = M(0x55524e, 0.85), conc = M(0x9d978c, 0.95, 0, 0.08), slab = M(0xd6cfc2, 0.9, 0, 0.06),
    base = M(0x4c4943, 0.95, 0, 0.35), tube = M(0xfff6e0, 0.5, 0, 1), green = M(0x3f8a3a, 0.8, 0, 0.05), pot = M(0xa0522d, 0.8);
  const glass = new THREE.MeshStandardMaterial({ color: 0xcfe8f5, roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.13, depthWrite: false });
  // ---- the cabin (it stays with the student)
  const C = 0.92, TOP = 2.4;
  B.bx(floorM, 2 * C, 0.06, 2 * C, 0, -0.03, 0); B.bx(dark, 2 * C, 0.06, 2 * C, 0, TOP + 0.03, 0);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) B.bx(steel, 0.06, TOP, 0.06, sx * C, TOP / 2, sz * C);
  for (const y of [0.04, 0.95, TOP - 0.04]) { B.bx(steel, 2 * C, 0.04, 0.04, 0, y, -C); B.bx(steel, 2 * C, 0.04, 0.04, 0, y, C); B.bx(steel, 0.04, 0.04, 2 * C, -C, y, 0); B.bx(steel, 0.04, 0.04, 2 * C, C, y, 0); }
  B.bx(steel, 2 * C - 0.1, 0.9, 0.03, 0, 0.47, C - 0.01); // the back wall is steel up to the hand rail
  B.add(steel, (() => { const r = new THREE.CylinderGeometry(0.018, 0.018, 2 * C - 0.2, 12); r.rotateZ(Math.PI / 2); r.translate(0, 0.95, C - 0.08); return r; })());
  // the console beside the student: a display and two buttons (+ up, − down) on its front
  B.bx(steel, 0.26, 1.3, 0.14, 0.5, 0.65, -0.56); B.bx(dark, 0.22, 0.42, 0.01, 0.5, 1.08, -0.485);
  B.flush(g);
  const pane = (w, h, x, y, z, ry) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), glass); m.position.set(x, y, z); m.rotation.y = ry; m.userData.noHit = true; m.renderOrder = 5; g.add(m); };
  pane(2 * C, TOP, 0, TOP / 2, -C, 0); pane(2 * C, TOP, -C, TOP / 2, 0, Math.PI / 2); pane(2 * C, TOP, C, TOP / 2, 0, -Math.PI / 2); pane(2 * C, TOP - 0.95, 0, (TOP + 0.95) / 2, C, Math.PI);
  const lamp = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.5), glow(0xfff6e0)); lamp.rotation.x = Math.PI / 2; lamp.position.set(0, TOP - 0.005, 0); lamp.userData.noHit = true; g.add(lamp);
  // the display
  const dispC = document.createElement('canvas'); dispC.width = 256; dispC.height = 160; const dispT = new THREE.CanvasTexture(dispC); dispT.colorSpace = THREE.SRGBColorSpace;
  const disp = new THREE.Mesh(new THREE.PlaneGeometry(0.17, 0.106), new THREE.MeshBasicMaterial({ map: dispT, toneMapped: false })); disp.position.set(0.5, 1.2, -0.478); disp.userData.noHit = true; g.add(disp);
  let shown = null;
  const drawDisp = (n, dir) => { const key = n + '|' + dir; if (key === shown) return; shown = key; const x = dispC.getContext('2d'); x.fillStyle = '#0b1020'; x.fillRect(0, 0, 256, 160);
    x.fillStyle = n > 0 ? '#5ec8ff' : n < 0 ? '#ff9a4a' : '#ffffff'; x.font = `800 112px ${FONT}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(fmtInt(n), 150, 84);
    if (dir) { x.fillStyle = '#8be07a'; x.beginPath(); if (dir > 0) { x.moveTo(30, 100); x.lineTo(60, 50); x.lineTo(90, 100); } else { x.moveTo(30, 60); x.lineTo(60, 110); x.lineTo(90, 60); } x.fill(); }
    dispT.needsUpdate = true; };
  drawDisp(0, 0);
  // the fixed marker at eye height, pointing at the number line
  const mk = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.08, 3), glow(0xff5a4f)); mk.rotation.z = Math.PI / 2; mk.position.set(-0.5, 1.5, -C + 0.06); mk.userData.noHit = true; g.add(mk);

  // ---- the building and the shaft (they move: up when the lift goes down)
  const wv = new THREE.Group(); g.add(wv); it.wv = wv;
  const Y0 = NMIN * FH - 0.4, Y1 = NMAX * FH + 3.2;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) B.bx(steel, 0.09, Y1 - Y0, 0.09, sx * 1.0, (Y0 + Y1) / 2, sz * 1.0);
  for (let n = 0; n <= NMAX; n++) { const y = n * FH + 0.02; B.bx(steel, 2.08, 0.08, 0.08, 0, y, -1.0); B.bx(steel, 2.08, 0.08, 0.08, 0, y, 1.0); B.bx(steel, 0.08, 0.08, 2.08, -1.0, y, 0); B.bx(steel, 0.08, 0.08, 2.08, 1.0, y, 0); }
  // floors above the ground: a slab in front of the lift with columns, a back wall and a railing; +5 is a roof garden
  for (let n = 1; n <= NMAX; n++) {
    const y = n * FH; B.bx(slab, 4.6, 0.26, 3.1, 0, y - 0.13, -2.6);
    for (const sx of [-2.2, 2.2]) B.bx(slab, 0.3, FH, 0.3, sx, y - FH / 2, -4.0);
    for (const sx of [-2.3, 2.3]) { B.bx(steel, 0.04, 0.95, 0.04, sx, y + 0.47, -2.6); B.bx(steel, 0.04, 0.04, 3.1, sx, y + 0.95, -2.6); }
    if (n < NMAX) B.bx(conc, 4.6, FH - 0.26, 0.2, 0, y + (FH - 0.26) / 2, -4.15);
    else { for (const px of [-1.6, -0.8, 0.8, 1.6]) { B.bx(pot, 0.36, 0.34, 0.36, px, y + 0.17, -3.6); B.add(green, (() => { const s = new THREE.IcosahedronGeometry(0.34, 1); s.translate(px, y + 0.62, -3.6); return s; })()); } B.bx(steel, 4.6, 0.04, 0.04, 0, y + 0.95, -4.1); }
  }
  for (const sx of [-2.2, 2.2]) B.bx(slab, 0.3, FH, 0.3, sx, FH / 2, -4.0); // the ground-floor columns
  // below the ground: a concrete shaft with an opening onto each basement, and the basements themselves
  const OW = 1.7, OH = 2.6;
  B.bx(conc, 0.12, -Y0, 2.3, -1.12, Y0 / 2, 0); B.bx(conc, 0.12, -Y0, 2.3, 1.12, Y0 / 2, 0); B.bx(conc, 2.3, -Y0, 0.12, 0, Y0 / 2, 1.12);
  B.bx(conc, (2.3 - OW) / 2, -Y0, 0.12, -(OW / 2 + (2.3 - OW) / 4), Y0 / 2, -1.12); B.bx(conc, (2.3 - OW) / 2, -Y0, 0.12, OW / 2 + (2.3 - OW) / 4, Y0 / 2, -1.12);
  for (let n = NMIN; n <= -1; n++) {
    const y = n * FH; B.bx(conc, OW, FH - OH, 0.12, 0, y + OH + (FH - OH) / 2, -1.12); // the wall above the opening
    B.bx(base, 4.6, 0.12, 3.2, 0, y - 0.06, -2.7); B.bx(base, 4.6, 0.12, 3.2, 0, y + FH - 0.06, -2.7); // floor and ceiling
    B.bx(base, 4.6, FH, 0.12, 0, y + FH / 2, -4.3); B.bx(base, 0.12, FH, 3.2, -2.3, y + FH / 2, -2.7); B.bx(base, 0.12, FH, 3.2, 2.3, y + FH / 2, -2.7);
    B.bx(tube, 1.2, 0.03, 0.08, 0, y + FH - 0.13, -2.6); // a tube light
  }
  B.bx(conc, 0.12, 0.6, 2.3, 0, Y0 + 0.3, 0); // the bottom of the shaft
  // what is on each floor: desks, lab benches, computers, shelves; a car, boxes, a water tank below the ground
  { const wood = M(0x9a6b42, 0.7, 0, 0.05), blue = M(0x2f5f9a, 0.5, 0.2, 0.08), grey = M(0x333840, 0.5, 0.3, 0.05), red = M(0xb03a2e, 0.45, 0.3, 0.1), card = M(0xb08a5a, 0.85, 0, 0.12), tank = M(0x3d7be0, 0.5, 0.1, 0.1);
    const desk = (y, x, z) => { B.bx(wood, 0.9, 0.05, 0.5, x, y + 0.72, z); for (const dx of [-0.4, 0.4]) B.bx(grey, 0.04, 0.72, 0.4, x + dx, y + 0.36, z); };
    for (const x of [-1.3, 0, 1.3]) for (const z of [-2.2, -3.2]) desk(FH, x, z); // +1 classrooms
    for (const x of [-1.1, 1.1]) { B.bx(M(0xd8d8d0, 0.6, 0, 0.1), 1.6, 0.06, 0.7, x, 2 * FH + 0.9, -3.0); B.bx(wood, 1.5, 0.86, 0.6, x, 2 * FH + 0.43, -3.0); } // +2 lab benches
    for (const x of [-1.3, 0, 1.3]) { desk(3 * FH, x, -3.0); B.bx(grey, 0.45, 0.3, 0.04, x, 3 * FH + 0.95, -3.15); } // +3 computers
    for (const x of [-1.6, -0.55, 0.55, 1.6]) { B.bx(wood, 0.8, 2.0, 0.35, x, 4 * FH + 1.0, -3.7); for (const y of [0.45, 0.95, 1.45]) B.bx(x > 0 ? blue : red, 0.7, 0.3, 0.25, x, 4 * FH + y, -3.62); } // +4 library shelves
    B.bx(red, 1.7, 0.5, 0.8, -0.9, -FH + 0.4, -2.8); B.bx(red, 1.0, 0.42, 0.75, -1.05, -FH + 0.86, -2.8); for (const dx of [-1.5, -0.3]) for (const dz of [-3.15, -2.45]) { const w = new THREE.CylinderGeometry(0.17, 0.17, 0.12, 16); w.rotateX(Math.PI / 2); w.translate(dx, -FH + 0.17, dz); B.add(grey, w); } // −1 a parked car
    for (const [x, z, k] of [[-1.5, -3.6, 0], [-1.5, -3.6, 1], [-0.9, -3.7, 0], [1.2, -3.5, 0], [1.2, -3.5, 1], [1.6, -2.6, 0]]) B.bx(card, 0.55, 0.45, 0.5, x, -2 * FH + 0.225 + k * 0.45, z); // −2 boxes
    { const t = new THREE.CylinderGeometry(0.9, 0.9, 2.2, 32); t.translate(0.6, -3 * FH + 1.1, -3.0); B.add(tank, t); } // −3 the water tank
  }
  B.flush(wv);
  // a sign on each floor
  for (let n = NMIN; n <= NMAX; n++) {
    const nm = names[n] || '', col = n > 0 ? '#1f5f9e' : n < 0 ? '#b5561a' : '#1d2330';
    const s = plate([[fmtInt(n), 300, col], [nm, 120]], 1.3, 0.85, { bg: n < 0 ? '#e8e2d6' : '#f6f3ea', border: col });
    if (n === 0) { s.position.set(0, 1.5, -3.2); const post = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.2, 0.08), steel); post.position.set(0, 0.6, -3.22); post.userData.noHit = true; wv.add(post); }
    else if (n === NMAX) s.position.set(0, n * FH + 1.45, -4.05);
    else s.position.set(0, n * FH + 1.45, n < 0 ? -4.23 : -4.04);
    wv.add(s);
  }
  // the vertical number line up the shaft, beside the door: one mark per floor, at eye height on that floor
  const PX = 140, HH = Y1 - Y0;
  const lineT = canvasTex(256, Math.round(HH * PX), (x, w, h) => {
    x.fillStyle = '#fbfaf5'; x.fillRect(0, 0, w, h); x.fillStyle = '#1d2330'; x.fillRect(40, 0, 10, h);
    for (let n = NMIN; n <= NMAX; n++) { const yy = h - (n * FH + 1.5 - Y0) * PX; x.fillStyle = n > 0 ? '#1f5f9e' : n < 0 ? '#c0581a' : '#1d2330'; x.fillRect(20, yy - 6, 70, 12); x.font = `800 110px ${FONT}`; x.textBaseline = 'middle'; x.fillText(fmtInt(n), 98, yy + 6);
      for (let q = 1; q < 3; q++) { x.fillStyle = '#7a7f88'; x.fillRect(32, yy - q * FH * PX / 3 - 3, 26, 6); } }
  });
  const nl = new THREE.Mesh(new THREE.PlaneGeometry(0.34, HH), new THREE.MeshBasicMaterial({ map: lineT, toneMapped: false })); nl.position.set(-0.7, (Y0 + Y1) / 2, -0.985); nl.userData.noHit = true; wv.add(nl);

  // ---- riding
  it.f = 0; it.target = 0; it.moving = 0; it.presses = [];
  it.onShift = o.onShift || null; it.onArrive = null;
  const place = () => { const y = -it.f * FH; wv.position.y = y; if (it.onShift) it.onShift(y); };
  it.press = (d) => { it.target = Math.max(NMIN, Math.min(NMAX, it.target + d)); it.presses.push(d); };
  it.go = (n) => { it.target = Math.max(NMIN, Math.min(NMAX, n)); };
  it.update = (dt) => {
    dt = Math.min(dt || 0, 0.05); const d = it.target - it.f;
    if (Math.abs(d) > 1e-4) { const sp = Math.max(0.12, Math.min(0.75, Math.abs(d) * 1.4)); it.f += Math.sign(d) * Math.min(Math.abs(d), sp * dt); it.moving = Math.sign(d); place(); drawDisp(Math.round(it.f), Math.sign(d)); }
    else if (it.moving) { it.f = it.target; it.moving = 0; place(); drawDisp(it.target, 0); if (it.onArrive) it.onArrive(it.target); }
  };
  it.set = (n) => { it.f = it.target = n; it.moving = 0; place(); drawDisp(n, 0); };
  it.btnPath = (s) => { const y = s > 0 ? 1.03 : 0.9; return [V(0.5, y, -0.43), V(0.5, y, -0.478)]; };
  it.at = (k) => ({ disp: V(0.5, 1.42, -0.5), line: V(-0.25, 1.95, -0.9), eq: V(0.22, 1.84, -0.86), eq2: V(0.22, 1.69, -0.86), door: V(0.15, 1.6, -1.6) }[k] || V(0, 1.8, -0.9));
  it.noGrab = true; it.noPhys = true; it.height = 2.6; it.radius = 1.2; it.base = 0; return it;
}
// a lift button the student pushes (or clicks / pinches)
export function liftButton(sym = 1) {
  const it = new Item('wliftbtn', { name: sym > 0 ? { en: 'Up button (+)', hi: 'ऊपर का बटन (+)', hg: 'Upar ka button (+)' } : { en: 'Down button (−)', hi: 'नीचे का बटन (−)', hg: 'Neeche ka button (−)' } });
  const col = sym > 0 ? 0x2ea36b : 0xd9493a;
  const t = canvasTex(128, 128, (x) => { x.fillStyle = sym > 0 ? '#2ea36b' : '#d9493a'; x.fillRect(0, 0, 128, 128); x.fillStyle = '#ffffff'; x.font = `800 112px ${FONT}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(sym > 0 ? '+' : '−', 64, 70); });
  t.center.set(0.5, 0.5); t.rotation = Math.PI / 2;
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.05, 28), [new THREE.MeshStandardMaterial({ color: col, roughness: 0.4 }), new THREE.MeshStandardMaterial({ map: t, roughness: 0.4 }), new THREE.MeshStandardMaterial({ color: col, roughness: 0.4 })]);
  cap.rotation.x = Math.PI / 2; cap.position.z = -0.025; it.g.add(cap);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.004, 8, 32), glow(0xffd23f, 0.85)); ring.userData.noHit = true; it.g.add(ring); it.pulse = ring;
  it.height = 0.07; it.radius = 0.04; it.grabY = 0; it.base = 0; return it;
}
// joins the buttons to the lift; buttons work in the given steps
export function bindLiftHands(lift, up, down, app, steps = [1, 2, 3]) {
  const on = () => steps.some((i) => stepNow(app, i)) && !lift.busy;
  pushKnob(up, { path: () => lift.btnPath(1), active: on, keepVisible: () => true, press: () => lift.press(1) });
  pushKnob(down, { path: () => lift.btnPath(-1), active: on, keepVisible: () => true, press: () => lift.press(-1) });
}

// ------------------------------------------------------------------ Class 7: a peek beyond the point, inside a ruler
// A 30 cm ruler lies on the table with a piece of chalk on it, from 0 to 7.46 cm. Zooming makes the ruler and the chalk
// 10 and then 100 times bigger around the chalk's end, which comes to lie at the student's feet: first the ten tenths
// between 7 and 8 cm appear, then the ten hundredths between 7.4 and 7.5 cm.
export function rulerZoom(o = {}) {
  const it = new Item('wruler', { ...o, name: { en: 'Ruler and chalk', hi: 'स्केल और चॉक', hg: 'Scale aur chalk' } });
  const g = it.g, R = new THREE.Group(); g.add(R); it.R = R;
  const L = 0.3, WD = 0.032, TH = 0.003, END = o.end ?? 0.0746;
  // the ruler's face: numbers and millimetre marks along the edge nearest the student (z = 0); x = 0 is 0 cm
  const PXC = 120, MX = 0.012;
  const face = canvasTex(Math.round((L + 2 * MX) * 100 * PXC), Math.round(WD * 100 * PXC), (x, w, h) => {
    const gr = x.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#f7e7a8'); gr.addColorStop(1, '#f3dc86'); x.fillStyle = gr; x.fillRect(0, 0, w, h);
    x.fillStyle = '#121418'; x.textAlign = 'center'; x.font = `800 ${Math.round(PXC * 0.5)}px ${FONT}`;
    for (let m = 0; m <= L * 1000; m++) { const xx = (MX * 100 + m / 10) * PXC, len = m % 10 === 0 ? 0.62 : m % 5 === 0 ? 0.45 : 0.28; x.fillRect(xx - 2.5, h - len * PXC, 5, len * PXC); if (m % 10 === 0) x.fillText(String(m / 10), xx, h - 0.95 * PXC); }
    x.font = `600 ${Math.round(PXC * 0.22)}px ${FONT}`; x.fillText('cm', (MX * 100 + 0.5) * PXC, h - 1.55 * PXC);
  });
  const sideM = M(0xb89a3e, 0.8); const body = new THREE.Mesh(new THREE.BoxGeometry(L + 2 * MX, TH, WD), [sideM, sideM, new THREE.MeshStandardMaterial({ map: face, roughness: 0.85, color: 0xd9cfa8 }), sideM, sideM, sideM]);
  body.position.set(L / 2, -TH / 2, -WD / 2); body.castShadow = body.receiveShadow = true; body.userData.noHit = true; R.add(body);
  // crisp marks for the close-ups: millimetres from 6 to 9 cm, and tenths of a millimetre from 7.3 to 7.6 cm
  const markM = new THREE.MeshBasicMaterial({ color: 0x15171c }), mk = [];
  const mark = (x, len, w) => { const b = new THREE.BoxGeometry(w, 0.00002, len); b.translate(x, 0.00002, -len / 2); mk.push(b); };
  for (let m = 60; m <= 90; m++) mark(m / 1000, m % 10 === 0 ? 0.0062 : m % 5 === 0 ? 0.0045 : 0.0028, 0.00012);
  const fine = []; for (let q = 730; q <= 760; q++) { const len = q % 10 === 0 ? 0.0028 : q % 5 === 0 ? 0.0019 : 0.0012; const b = new THREE.BoxGeometry(0.00002, 0.00003, len); b.translate(q / 10000, 0.00003, -len / 2); fine.push(b); }
  const mkMesh = new THREE.Mesh(mergeGeometries(mk), markM); mkMesh.userData.noHit = true; mkMesh.visible = false; R.add(mkMesh);
  const fineMesh = new THREE.Mesh(mergeGeometries(fine), markM); fineMesh.userData.noHit = true; fineMesh.visible = false; R.add(fineMesh);
  // the chalk: from 0 to END along the ruler, lying on it near the edge
  const chalk = new THREE.Mesh(new THREE.CylinderGeometry(0.0048, 0.0048, END, 28), new THREE.MeshStandardMaterial({ color: 0xf6f5ef, roughness: 0.95 }));
  chalk.rotation.z = Math.PI / 2; chalk.position.set(END / 2, 0.0048, -0.0049);
  const tip = new THREE.Mesh(new THREE.BoxGeometry(0.00008, 0.00004, 0.0016), new THREE.MeshBasicMaterial({ color: 0xe0302a })); tip.position.set(END, 0.00002, 0.0008); tip.userData.noHit = true; R.add(tip); // a red pointer at the chalk's end
  chalk.castShadow = true; chalk.userData.noHit = true; R.add(chalk);
  // zoom: Z times bigger around the chalk's end (on the ruler's edge); its end moves from the table to the student's feet
  it.Z = 1; const P = V(END, 0, 0);
  const far = V(0, 0.34, -0.42); let home = null;
  it.zoom = (Z) => {
    if (!home) home = g.position.clone().add(P); // the chalk's end on the table (the ruler is not turned)
    it.Z = Z; const t = clamp01(Math.log10(Z) / 2), e = t * t * (3 - 2 * t);
    const pl = home.clone().lerp(far, e).sub(g.position);
    R.scale.setScalar(Z); R.position.copy(pl).addScaledVector(P, -Z);
    mkMesh.visible = Z > 3; fineMesh.visible = Z > 25;
    if (it.onZoom) it.onZoom(Z);
  };
  // where a mark of the ruler is now (in the room); cm: the reading
  it.markAt = (cm, up = 0) => R.localToWorld(V(cm / 100, up / it.Z, 0.0005));
  it.knobPath = () => [V(0.3, 1.02, -0.22), V(0.62, 1.02, -0.22)];
  it.at = (k) => ({ top: V(0, 1.75, -1.0), eq: V(0, 1.55, -1.0) }[k] || V(0, 1.6, -1));
  it.noGrab = true; it.noPhys = true; it.height = 0.02; it.radius = 0.16; it.base = 0; return it;
}
// the zoom handle: step s1 zooms 1 → 10, step s2 zooms 10 → 100
export function bindZoomHands(rz, knob, app, s = { s1: 1, s2: 2 }, done = {}) {
  let kk = 0, last = -1;
  const range = () => (app.runner.i === s.s2 ? [1, 2] : [0, 1]);
  handle(knob, { path: () => rz.knobPath(), active: () => (stepNow(app, s.s1) && rz.Z < 9.9) || (stepNow(app, s.s2) && rz.Z < 99), keepVisible: () => app.runner.i >= s.s1 && app.runner.i <= s.s2 && rz.Z < 99,
    move: (k) => { if (last !== app.runner.i) { last = app.runner.i; kk = 0; } kk = Math.max(kk, k); const [a, b] = range(); const Z = Math.pow(10, lerp(a, b, kk)); if (Z > rz.Z) rz.zoom(Z); if (kk > 0.95) { rz.zoom(Math.pow(10, b)); done.zoom && done.zoom(b); kk = 0; } },
    at: () => { const [A, B2] = rz.knobPath(); return A.clone().lerp(B2, kk); } });
  knob.g.position.copy(rz.knobPath()[0]);
}

// ------------------------------------------------------------------ Class 8: power play, folding paper to the Moon
// A sheet of paper (0.001 cm thick) is folded in half again and again: each fold doubles the layers. The student folds it
// four times on the table; then a lever "keeps folding": a tower of paper rises beside them (20 folds: about 10 m; 30
// folds: about 10 km, higher than Mount Everest), and finally, out in space, a line of paper from the Earth passes the
// Moon at 46 folds.
export function paperFold(o = {}) {
  const it = new Item('wpaper', { ...o, name: { en: 'Sheet of paper', hi: 'काग़ज़ की शीट', hg: 'Kaagaz ki sheet' } });
  const g = it.g, TV = o.tv ?? 0.0011; // how thick one layer is drawn (thicker than real, so the layers can be seen)
  const paperT = canvasTex(512, 512, (x) => { x.fillStyle = '#fbfbf7'; x.fillRect(0, 0, 512, 512); x.strokeStyle = 'rgba(80,120,190,0.25)'; x.lineWidth = 2; for (let y = 40; y < 512; y += 28) { x.beginPath(); x.moveTo(0, y); x.lineTo(512, y); x.stroke(); } x.strokeStyle = 'rgba(210,80,80,0.35)'; x.beginPath(); x.moveTo(60, 0); x.lineTo(60, 512); x.stroke(); });
  const edgeT = canvasTex(64, 256, (x) => { x.fillStyle = '#f4f4ee'; x.fillRect(0, 0, 64, 256); x.fillStyle = 'rgba(120,120,110,0.45)'; for (let y = 0; y < 256; y += 8) x.fillRect(0, y, 64, 1.5); });
  edgeT.wrapS = edgeT.wrapT = THREE.RepeatWrapping;
  const top = new THREE.MeshStandardMaterial({ map: paperT, roughness: 0.9 }), side = new THREE.MeshStandardMaterial({ map: edgeT, roughness: 0.9 });
  const mats = [side, side, top, top, side, side];
  const unit = new THREE.BoxGeometry(1, 1, 1); unit.translate(0, 0.5, 0);
  const stat = new THREE.Mesh(unit, mats), mov = new THREE.Mesh(unit, mats), hinge = new THREE.Group();
  for (const m of [stat, mov]) { m.castShadow = true; m.receiveShadow = true; m.userData.noHit = true; }
  g.add(stat); g.add(hinge); hinge.add(mov);
  it.w = o.w ?? 0.28; it.d = o.d ?? 0.2; it.layers = 1; it.folds = 0; it.k = 0; it.cx = 0; it.cz = 0;
  const T = () => it.layers * TV;
  // fold n: even folds bring the right half over the left, odd folds the near half over the far half
  const draw = () => {
    const t = T(), along = it.folds % 2 === 0, a = it.k * Math.PI;
    edgeT.repeat.set(1, it.layers / 32);
    if (along) {
      const hw = it.w / 2; stat.scale.set(hw, t, it.d); stat.position.set(it.cx - hw / 2, 0, it.cz);
      hinge.position.set(it.cx, t, it.cz); hinge.rotation.set(0, 0, a); mov.scale.set(hw, t, it.d); mov.position.set(hw / 2, -t, 0);
    } else {
      const hd = it.d / 2; stat.scale.set(it.w, t, hd); stat.position.set(it.cx, 0, it.cz - hd / 2);
      hinge.position.set(it.cx, t, it.cz); hinge.rotation.set(-a, 0, 0); mov.scale.set(it.w, t, hd); mov.position.set(0, -t, hd / 2);
    }
    mov.visible = true;
  };
  draw();
  it.fold = (k) => {
    it.k = clamp01(k); draw();
    if (it.k >= 1) { // the fold is done: one stack again, half as big, twice as many layers
      const along = it.folds % 2 === 0; it.layers *= 2; it.folds += 1; it.k = 0;
      if (along) { it.w /= 2; it.cx -= it.w / 2; } else { it.d /= 2; it.cz -= it.d / 2; }
      it.slide = 1; draw(); if (it.onFold) it.onFold(it.folds);
    }
  };
  // after a fold the stack slides back to the middle of the table
  it.update = (dt) => { if (it.slide) { const f = Math.min(1, (dt || 0.016) * 4); it.cx -= it.cx * f; it.cz -= it.cz * f; if (Math.abs(it.cx) + Math.abs(it.cz) < 1e-4) { it.cx = it.cz = 0; it.slide = 0; } if (it.k === 0) draw(); } };
  // the corner the student pulls over: the middle of the free edge of the moving half
  const W = (x, y, z) => g.localToWorld(V(x, y, z));
  it.foldKnob = (k = it.k) => { const t = T(), along = it.folds % 2 === 0, a = k * Math.PI; if (along) { const hw = it.w / 2; return W(it.cx + Math.cos(a) * hw, t + Math.sin(a) * hw + 0.012, it.cz); } const hd = it.d / 2; return W(it.cx, t + Math.sin(a) * hd + 0.012, it.cz + Math.cos(a) * hd); };
  it.foldPath = () => { const t = T(), along = it.folds % 2 === 0; if (along) { const hw = it.w / 2; return [W(it.cx + hw, t + 0.012, it.cz), W(it.cx - hw, t + 0.012, it.cz)]; } const hd = it.d / 2; return [W(it.cx, t + 0.012, it.cz + hd), W(it.cx, t + 0.012, it.cz - hd)]; };
  it.at = (k) => ({ top: W(0, 0.16, 0), side: W(0, 0.075, 0.11), eq: W(0, 0.17, 0) }[k] || W(0, 0.2, 0));
  it.noGrab = true; it.noPhys = true; it.height = 0.05; it.radius = 0.16; it.base = 0; return it;
}
// the folds beyond the table: a tower of paper on the ground beside the student, and the Earth and the Moon in space
export function foldBeyond(o = {}) {
  const it = new Item('wfoldbeyond', { ...o, name: { en: 'Folded paper', hi: 'मोड़ा हुआ काग़ज़', hg: 'Moda hua kaagaz' } });
  const g = it.g, SHEET = 1e-5; // one sheet: 0.001 cm = 0.00001 m
  // the tower (on the ground, at the item's place)
  const edgeT = canvasTex(64, 256, (x) => { x.fillStyle = '#f2f2ec'; x.fillRect(0, 0, 64, 256); x.fillStyle = 'rgba(110,110,100,0.35)'; for (let y = 0; y < 256; y += 6) x.fillRect(0, y, 64, 1.2); }); edgeT.wrapS = edgeT.wrapT = THREE.RepeatWrapping;
  const geo = new THREE.BoxGeometry(0.6, 1, 0.45); geo.translate(0, 0.5, 0);
  const tower = new THREE.Mesh(geo, [new THREE.MeshStandardMaterial({ map: edgeT, roughness: 0.9 }), new THREE.MeshStandardMaterial({ map: edgeT, roughness: 0.9 }), M(0xfbfbf7, 0.9), M(0xfbfbf7, 0.9), new THREE.MeshStandardMaterial({ map: edgeT, roughness: 0.9 }), new THREE.MeshStandardMaterial({ map: edgeT, roughness: 0.9 })]);
  tower.castShadow = true; tower.userData.noHit = true; tower.visible = false; tower.frustumCulled = false; g.add(tower); it.tower = tower;
  // a 3-storey building for size, beside the tower (10 m)
  const bld = new THREE.Group(); bld.position.set(2.6, 0, -2.6); g.add(bld); bld.visible = false;
  { const B = merger(), wall = M(0xd9c7a6, 0.9, 0, 0.05), win = M(0x3b5a78, 0.3, 0.3, 0.1), roof = M(0x8a6a50, 0.8);
    B.bx(wall, 2.2, 9.6, 2.2, 0, 4.8, 0); B.bx(roof, 2.4, 0.3, 2.4, 0, 9.75, 0);
    for (let f = 0; f < 3; f++) for (const x of [-0.55, 0.55]) B.bx(win, 0.6, 1.3, 0.04, x, 1.6 + f * 3.1, 1.11);
    B.flush(bld, { cast: true }); }
  it.bld = bld;
  // space: stars, the Earth and the Moon (1 m here = 20,000 km), and a line of paper from the Earth towards the Moon
  const space = new THREE.Group(); space.visible = false; g.add(space); it.space = space;
  { const n = 1800, pos = new Float32Array(n * 3); for (let i = 0; i < n; i++) { const u = Math.random() * 2 - 1, a = Math.random() * Math.PI * 2, s = Math.sqrt(1 - u * u); pos.set([90 * s * Math.cos(a), 90 * u, 90 * s * Math.sin(a)], i * 3); }
    const geoS = new THREE.BufferGeometry(); geoS.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const stars = new THREE.Points(geoS, new THREE.PointsMaterial({ color: 0xffffff, size: 0.35, sizeAttenuation: true, toneMapped: false })); stars.userData.noHit = true; space.add(stars); }
  const KM = 1 / 20000, ER = 6371 * KM, MR = 1737 * KM * 2.5, MD = 384400 * KM;
  const E0 = V(-0.62, 1.32, -1.15), dir = V(0.52, 0.11, -1).normalize();
  const earth = new THREE.Mesh(new THREE.SphereGeometry(ER, 64, 40), new THREE.MeshStandardMaterial({ map: photoTex('tex/earth.jpg'), roughness: 0.8, emissive: 0x1a2a40, emissiveIntensity: 0.25 }));
  earth.position.copy(E0); earth.rotation.set(0.35, 2.4, 0); earth.userData.noHit = true; space.add(earth);
  const moonT = canvasTex(512, 256, (x) => { x.fillStyle = '#9d9a94'; x.fillRect(0, 0, 512, 256); for (let i = 0; i < 260; i++) { const r = Math.random() ** 2 * 22 + 2, cx = Math.random() * 512, cy = Math.random() * 256; x.fillStyle = `rgba(${Math.random() < 0.5 ? '70,68,64' : '190,186,178'},${0.25 + Math.random() * 0.3})`; x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.fill(); } });
  const moon = new THREE.Mesh(new THREE.SphereGeometry(MR, 40, 24), new THREE.MeshStandardMaterial({ map: moonT, roughness: 1, emissive: 0x555555, emissiveIntensity: 0.35 }));
  moon.position.copy(E0).addScaledVector(dir, MD); moon.userData.noHit = true; space.add(moon);
  const halo = new THREE.Mesh(new THREE.SphereGeometry(MR * 1.6, 24, 16), glow(0xdfe8ff, 0.12)); halo.position.copy(moon.position); halo.userData.noHit = true; space.add(halo);
  const paper = rod(E0.clone().addScaledVector(dir, ER), E0.clone().addScaledVector(dir, ER + 0.001), 0.012, glow(0xfffbe8)); space.add(paper);
  const orbit = new THREE.Mesh(new THREE.TorusGeometry(MD, 0.012, 6, 160), glow(0x6f86b5, 0.35)); orbit.position.copy(E0); { const up = V(0, 1, 0), nrm = up.clone().addScaledVector(dir, -up.dot(dir)).normalize(); orbit.lookAt(E0.clone().add(nrm)); } orbit.userData.noHit = true; space.add(orbit);
  it.n = 4; it.mode = 'table';
  const fix = () => { space.position.copy(g.position).negate(); space.updateMatrixWorld(true); }; // space is drawn around the student (the room's origin)
  // the thickness after n folds, in metres
  it.thick = (n) => SHEET * Math.pow(2, n);
  it.setFolds = (n) => {
    it.n = n; const h = it.thick(n);
    if (n < 32) { if (it.mode !== 'ground') { it.mode = 'ground'; space.visible = false; if (it.onSpace) it.onSpace(false); } tower.visible = n > 8; bld.visible = n >= 16; tower.scale.y = Math.min(h, 3000); }
    else { if (it.mode !== 'space') { it.mode = 'space'; fix(); space.visible = true; tower.visible = false; bld.visible = false; if (it.onSpace) it.onSpace(true); } setRod(paper, E0.clone().addScaledVector(dir, ER), E0.clone().addScaledVector(dir, ER + Math.max(0.001, h / 1000 * KM))); }
  };
  it.towerTop = () => g.localToWorld(V(0, Math.min(it.thick(it.n), 40) + 0.3, 0));
  it.moonAt = () => { fix(); return space.localToWorld(moon.position.clone().add(V(0, MR + 0.7, 0))); };
  it.earthAt = () => { fix(); return space.localToWorld(E0.clone().add(V(0, ER + 0.16, 0))); };
  it.between = (d, up) => { fix(); return space.localToWorld(E0.clone().addScaledVector(dir, d).add(V(0, up, 0))); };
  it.tipAt = () => { fix(); return space.localToWorld(E0.clone().addScaledVector(dir, ER + Math.min(it.thick(it.n) / 1000 * KM, 30)).add(V(0, 1.2, 0))); };
  it.noGrab = true; it.noPhys = true; it.height = 1; it.radius = 0.5; it.base = 0; return it;
}
// the lever that keeps folding (step s1: 4 → 30 folds, step s2: 30 → 46)
export function bindFoldHands(sheet, beyond, foldKnob, lever, app, s = { f1: 1, f2: 2, t1: 3, t2: 4 }, done = {}, leverPath) {
  let fk = 0, wait = false;
  handle(foldKnob, { path: () => sheet.foldPath(), active: () => (stepNow(app, s.f1) && sheet.folds < 1) || (stepNow(app, s.f2) && sheet.folds < 4), keepVisible: () => app.runner.i <= s.f2 && sheet.folds < 4,
    move: (k) => { if (wait) return; fk = Math.max(fk, k); const f = sheet.folds; sheet.fold(fk > 0.93 ? 1 : fk); if (sheet.folds !== f) { fk = 0; wait = true; } }, at: () => sheet.foldKnob(fk) });
  const r0 = foldKnob.onRelease; foldKnob.onRelease = () => { r0(); wait = false; fk = sheet.k; }; // the next fold needs a fresh grip
  const n0 = sheet.fold; sheet.fold = (k) => { n0(k); if (!foldKnob.held) foldKnob.g.position.copy(sheet.foldKnob(sheet.k)); };
  const u0 = sheet.update; sheet.update = (dt) => { u0(dt); if (!foldKnob.held && sheet.slide) foldKnob.g.position.copy(sheet.foldKnob(0)); if (sheet.onFoldDone) { const f = sheet.folds; if (f !== sheet._seen) { sheet._seen = f; done.fold && done.fold(f); } } };
  sheet.onFoldDone = true; sheet._seen = 0;
  let lk = 0, last = -1;
  const range = () => (app.runner.i === s.t2 ? [30, 46] : [4, 30]);
  handle(lever, { path: leverPath, active: () => (stepNow(app, s.t1) && beyond.n < 30) || (stepNow(app, s.t2) && beyond.n < 46), keepVisible: () => app.runner.i >= s.t1 && app.runner.i <= s.t2 && beyond.n < 46,
    move: (k) => { if (last !== app.runner.i) { last = app.runner.i; lk = 0; } lk = Math.max(lk, k); const [a, b] = range(); const n = Math.round(lerp(a, b, lk)); if (n > beyond.n) { beyond.setFolds(n); done.n && done.n(n); } if (lk > 0.97) { beyond.setFolds(b); done.n && done.n(b); lk = 0; } },
    at: () => { const [A, B2] = leverPath(); return A.clone().lerp(B2, lk); } });
  foldKnob.g.position.copy(sheet.foldKnob(0)); lever.g.position.copy(leverPath()[0]);
}

// ------------------------------------------------------------------ Class 10: a cylinder opened into its net, filled, entered
// A card cylinder (r = 3.5 cm, h = 10 cm) stands on the table: a printed curved surface and two circles. The student tears
// it open along a side, unrolls the curved surface into a rectangle 2πr long and h high (the circles come to its top and
// bottom: the net), then fills a glass cylinder of the same size with discs 1 cm thick (πr² each), and finally stands inside
// a cylinder 20 times bigger.
export function cylinderNet(o = {}) {
  const it = new Item('wcylnet', { ...o, name: { en: 'Card cylinder', hi: 'गत्ते का बेलन', hg: 'Gatte ka cylinder' } });
  const g = it.g, r = o.r ?? 0.035, h = o.h ?? 0.1, Lc = 2 * Math.PI * r, LIFT = 2 * r + 0.004;
  it.r = r; it.h = h;
  // the curved surface's print: stripes, a band and small circles (a made-up juice can design, no brand)
  const printT = canvasTex(1024, 470, (x, w, hh) => {
    const gr = x.createLinearGradient(0, 0, 0, hh); gr.addColorStop(0, '#f6b733'); gr.addColorStop(1, '#ec8a1e'); x.fillStyle = gr; x.fillRect(0, 0, w, hh);
    x.fillStyle = '#2f8f4a'; x.fillRect(0, hh * 0.08, w, hh * 0.08); x.fillRect(0, hh * 0.84, w, hh * 0.08);
    x.fillStyle = 'rgba(255,255,255,0.9)'; x.fillRect(0, hh * 0.34, w, hh * 0.3);
    x.fillStyle = '#c4501b'; x.font = `800 ${Math.round(hh * 0.2)}px ${FONT}`; x.textAlign = 'center'; x.textBaseline = 'middle'; for (const cx of [w * 0.25, w * 0.75]) x.fillText('MANGO', cx, hh * 0.5);
    for (let i = 0; i < 14; i++) { x.fillStyle = 'rgba(255,240,180,0.55)'; x.beginPath(); x.arc((i + 0.5) * w / 14, hh * 0.25, hh * 0.035, 0, Math.PI * 2); x.fill(); x.beginPath(); x.arc((i + 0.5) * w / 14, hh * 0.75, hh * 0.035, 0, Math.PI * 2); x.fill(); }
  });
  // the inside of the card: a 1 cm grid (22 × 10 squares on the rectangle)
  const gridT = canvasTex(1100, 500, (x, w, hh) => { x.fillStyle = '#f3ecdc'; x.fillRect(0, 0, w, hh); x.strokeStyle = 'rgba(60,90,140,0.55)'; x.lineWidth = 2; const nx = Math.round(Lc * 100), ny = Math.round(h * 100);
    for (let i = 0; i <= nx; i++) { const xx = (i / (Lc * 100)) * w; x.beginPath(); x.moveTo(xx, 0); x.lineTo(xx, hh); x.stroke(); } for (let j = 0; j <= ny; j++) { const yy = (j / ny) * hh; x.beginPath(); x.moveTo(0, yy); x.lineTo(w, yy); x.stroke(); } });
  const NS = 72, geo = new THREE.PlaneGeometry(Lc, h, NS, 1); const posA = geo.attributes.position;
  const s0 = [], y0 = []; for (let i = 0; i < posA.count; i++) { s0.push(posA.getX(i) + Lc / 2); y0.push(posA.getY(i) + h / 2); }
  const front = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: printT, roughness: 0.55, side: THREE.FrontSide })), back = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: gridT, roughness: 0.9, side: THREE.BackSide }));
  for (const m of [front, back]) { m.castShadow = true; m.userData.noHit = true; g.add(m); }
  // the two circles (card), and a rim on each
  const capT = canvasTex(256, 256, (x) => { x.fillStyle = '#e8e2d2'; x.fillRect(0, 0, 256, 256); x.strokeStyle = 'rgba(150,120,60,0.6)'; x.lineWidth = 6; x.beginPath(); x.arc(128, 128, 118, 0, Math.PI * 2); x.stroke(); x.fillStyle = 'rgba(46,143,74,0.85)'; x.beginPath(); x.arc(128, 128, 42, 0, Math.PI * 2); x.fill(); });
  const capG = new THREE.CircleGeometry(r, 48); const capM = new THREE.MeshStandardMaterial({ map: capT, roughness: 0.8, side: THREE.DoubleSide });
  const lid = new THREE.Mesh(capG, capM), bot = new THREE.Mesh(capG, capM); for (const m of [lid, bot]) { m.castShadow = true; m.userData.noHit = true; g.add(m); }
  // the tear strip down the side facing the student, and the tear line it leaves
  const strip = new THREE.Mesh(new THREE.PlaneGeometry(0.006, 1), M(0xc8322a, 0.5)); strip.geometry.translate(0, -0.5, 0); strip.userData.noHit = true; g.add(strip);
  const ribbon = rod(V(0, h, r), V(0, h + 0.01, r + 0.01), 0.0016, M(0xc8322a, 0.5)); g.add(ribbon);
  const seam = new THREE.Mesh(new THREE.PlaneGeometry(0.0016, h), new THREE.MeshBasicMaterial({ color: 0x2a1a10 })); seam.position.set(0, h / 2, r + 0.0008); seam.userData.noHit = true; seam.visible = false; g.add(seam);
  it.cutK = 0; it.unK = 0;
  const p = V(0, 0, 0);
  // where a point of the surface is: s along the surface from the seam (0 … 2πr), y up; k = how far it is unrolled
  const surf = (s, y, k, out) => {
    const c = (1 - k) / r, sm = s - Lc / 2, lift = LIFT * seg(k, 0.55, 1);
    if (c > 1e-4) { const ph = sm * c; out.set(-Math.sin(ph) / c, y + lift, -r + (1 - Math.cos(ph)) / c); }
    else out.set(-sm, y + lift, -r);
    return out;
  };
  const lay = () => {
    const k = it.unK; for (let i = 0; i < posA.count; i++) { surf(s0[i], y0[i], k, p); posA.setXYZ(i, p.x, p.y, p.z); }
    posA.needsUpdate = true; geo.computeVertexNormals(); geo.computeBoundingSphere();
    // the circles: on the cylinder at first, then at the top and the bottom of the rectangle (the net)
    const e = ease(seg(k, 0.35, 1));
    lid.position.lerpVectors(V(0, h, 0), V(0, h + LIFT + r, -r - 0.001), e); lid.rotation.set(lerp(-Math.PI / 2, 0, e), 0, 0);
    bot.position.lerpVectors(V(0, 0.0008, 0), V(0, LIFT - r, -r - 0.001), e); bot.rotation.set(lerp(-Math.PI / 2, 0, e), 0, 0);
    const c = it.cutK; strip.visible = c < 0.999 && k < 0.02; strip.scale.y = h * (1 - c); strip.position.set(0, h - c * h, r + 0.0006);
    ribbon.visible = c > 0.01 && c < 0.999; seam.visible = c > 0.02 && k < 0.01;
  };
  lay();
  it.cut = (k) => { it.cutK = Math.max(it.cutK, clamp01(k)); lay(); if (ribbon.visible) setRod(ribbon, V(0, h - it.cutK * h, r + 0.002), it.ribbonEnd || V(0, h + 0.012, r + 0.012 + 0.188 * it.cutK)); };
  it.unroll = (k) => { if (it.cutK < 0.999) return; it.unK = Math.max(it.unK, clamp01(k)); lay(); };
  // the glass cylinder and its discs (volume)
  const vol = new THREE.Group(); vol.position.set(0.2, 0, 0.0); g.add(vol); it.vol = vol;
  const glassM = new THREE.MeshStandardMaterial({ color: 0xd9f0ff, roughness: 0.05, metalness: 0.05, transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false });
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(r + 0.001, r + 0.001, h, 48, 1, true), glassM); tube.position.y = h / 2; tube.userData.noHit = true; tube.renderOrder = 6; vol.add(tube);
  const rimM = M(0xb8c0c8, 0.3, 0.8); for (const y of [0, h]) { const t = new THREE.Mesh(new THREE.TorusGeometry(r + 0.001, 0.0012, 8, 48), rimM); t.rotation.x = Math.PI / 2; t.position.y = y; t.userData.noHit = true; vol.add(t); }
  const discs = []; const discG = new THREE.CylinderGeometry(r - 0.0005, r - 0.0005, 0.0096, 48); discG.translate(0, 0.0048, 0);
  for (let i = 0; i < 10; i++) { const d = new THREE.Mesh(discG, M(i % 2 ? 0x3d7be0 : 0x5ec8ff, 0.45)); d.position.y = i * 0.01 + 0.0002; d.visible = false; d.castShadow = true; d.userData.noHit = true; vol.add(d); discs.push(d); }
  // seen from inside when it is 20 times bigger: ribs, and the radius and the height marked
  const tank = new THREE.Group(); tank.visible = false; vol.add(tank);
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; const rb = new THREE.Mesh(new THREE.BoxGeometry(0.0009, h, 0.0009), rimM); rb.position.set(Math.cos(a) * (r + 0.0012), h / 2, Math.sin(a) * (r + 0.0012)); rb.userData.noHit = true; tank.add(rb); }
  const rLine = rod(V(0, 0.0004, 0), V(-r, 0.0004, 0), 0.0005, glow(0xffd23f)); tank.add(rLine);
  const hLine = rod(V(-r * 0.97, 0, -0.004), V(-r * 0.97, h, -0.004), 0.0005, glow(0x5ec8ff)); tank.add(hLine);
  it.tankMode = (on) => { tank.visible = on; glassM.opacity = on ? 0.38 : 0.22; glassM.color.set(on ? 0x8fc6ef : 0xd9f0ff); };
  vol.visible = false; it.nDisc = 0;
  it.showVol = (on) => { vol.visible = on; };
  it.fill = (n) => { n = Math.max(0, Math.min(10, Math.round(n))); it.nDisc = n; discs.forEach((d, i) => { d.visible = i < n; }); };
  it.discsSee = (on) => { for (const d of discs) d.visible = on && discs.indexOf(d) < it.nDisc; };
  it.grow = (S, to) => { vol.scale.setScalar(S); if (to) vol.position.copy(to); };
  // handles: the tear strip's end (pulled towards the student), the cut edge (pulled to the right), the fill knob
  const W = (x, y, z) => g.localToWorld(V(x, y, z));
  it.tearPath = () => [W(0, h + 0.012, r + 0.012), W(0, h + 0.012, r + 0.2)];
  it.tearAt = () => W(0, h + 0.012, r + 0.012 + 0.188 * it.cutK);
  it.edgeAt = (k = it.unK) => { surf(0, h / 2, k, p); return W(p.x + 0.004, p.y, p.z + 0.004); };
  it.edgePath = () => [it.edgeAt(0), it.edgeAt(1)];
  it.fillPath = () => [W(0.27, 0.012, 0.065), W(0.52, 0.012, 0.065)];
  it.at = (k) => ({ r: W(0.075, h + 0.03, 0.02), h: W(-0.06, h / 2, 0.03), top: W(0, h + 0.13, 0), len: W(0, LIFT - 0.012, -r + 0.004), ht: W(-Math.PI * r - 0.03, LIFT + h / 2, -r), csa: W(0, LIFT + h / 2, -r + 0.01), lid: W(0.16, LIFT + h + r, -r), vol: W(0.2, h + 0.06, 0), vol2: W(0.2, h + 0.11, 0), above: W(0, LIFT + h + 2 * r + 0.06, -r) }[k] || W(0, 0.2, 0));
  it.noGrab = true; it.noPhys = true; it.height = 0.2; it.radius = 0.2; it.base = 0; return it;
}
export function bindCylinderHands(cy, tear, edge, filler, app, s = { cut: 1, unroll: 2, fill: 4 }, done = {}) {
  handle(tear, { path: () => cy.tearPath(), active: () => stepNow(app, s.cut) && cy.cutK < 0.999, keepVisible: () => app.runner.i <= s.cut && cy.cutK < 0.999,
    move: (k, p) => { cy.ribbonEnd = cy.g.worldToLocal(p.clone()); cy.cut(k > 0.92 ? 1 : k); if (cy.cutK >= 0.999) done.cut && done.cut(); }, at: () => cy.tearAt() });
  let uk = 0;
  handle(edge, { path: () => cy.edgePath(), active: () => stepNow(app, s.unroll) && cy.cutK >= 0.999 && cy.unK < 0.999, keepVisible: () => app.runner.i === s.unroll && cy.unK < 0.999,
    move: (k) => { uk = Math.max(uk, k); cy.unroll(uk > 0.94 ? 1 : uk); if (cy.unK >= 0.999) done.unroll && done.unroll(); }, at: () => cy.edgeAt() });
  let fk = 0;
  handle(filler, { path: () => cy.fillPath(), active: () => stepNow(app, s.fill) && cy.nDisc < 10, keepVisible: () => app.runner.i === s.fill && cy.nDisc < 10,
    move: (k) => { fk = Math.max(fk, k); cy.fill(fk * 10.4); if (cy.nDisc >= 10) done.fill && done.fill(); }, at: () => { const [A, B2] = cy.fillPath(); return A.clone().lerp(B2, fk); } });
  const c0 = cy.cut, u0 = cy.unroll, f0 = cy.fill;
  cy.cut = (k) => { c0(k); if (!tear.held) tear.g.position.copy(cy.tearAt()); };
  cy.unroll = (k) => { u0(k); if (!edge.held) edge.g.position.copy(cy.edgeAt()); };
  cy.fill = (n) => { f0(n); if (!filler.held) { const [A, B2] = cy.fillPath(); filler.g.position.copy(A.clone().lerp(B2, cy.nDisc / 10)); } };
  const fu = filler.update; filler.update = (dt, t) => { fu(dt, t); if (stepNow(app, s.fill) && !cy.vol.visible) cy.showVol(true); };
  tear.g.position.copy(cy.tearAt()); edge.g.position.copy(cy.edgeAt()); filler.g.position.copy(cy.fillPath()[0]);
}
