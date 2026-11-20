// DUET Robotics Lab 360, batch 2: the robots' parts and the robots, modelled in code from the datasheet sizes (mm).
// Parts: L298N motor driver, BO gear motor with its 65 mm wheel, 2 × 18650 battery holder, HC-05 Bluetooth, joystick
// module, 5 V adapter, MG996R servo, and the plugs of cables that go to a robot. Robots: the 4-joint arm, the smart
// dustbin, the hydraulic arm, the 2WD car, and the arena (floor, line track, walls). No brand artwork.
// Phones: static pieces are merged by material (a part is a few draw calls), big surfaces use Lambert shading, and
// nothing casts a real-time shadow in the robot scenes (a soft blob under each robot instead).
import * as THREE from 'three';
import { materials, mergeStatic, box, cyl, shadows } from './models.js';
import * as TX from './tex.js';
import { ARMG, CARG, SYR, HYDG, CAR14, CAR18, MAZE, mazeXY , CAR24 } from './robots.js';
export { ARMG, SYR, HYDG };

const P = 2.54;
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
let LITE = false; export function setLite2(v) { LITE = v; }
const S = (o) => new THREE.MeshStandardMaterial(o);
const Lm = (o) => new THREE.MeshLambertMaterial(o);
// the extra shared materials of batch 2 (made once)
const N = {};
function mats() {
  const M = materials();
  if (N.yellow) return M;
  Object.assign(N, {
    yellow: S({ color: 0xf2c418, roughness: 0.5 }), tyre: S({ color: 0x1b1b1c, roughness: 0.92 }), termBlue: S({ color: 0x2f6fd0, roughness: 0.45 }),
    termGreen: S({ color: 0x2c8a4a, roughness: 0.5 }), heat: S({ color: 0x1c1d20, metalness: 0.7, roughness: 0.45 }), nylon: S({ color: 0xe9e4d6, roughness: 0.6 }),
    redW: S({ color: 0xc8281c, roughness: 0.45 }), blackW: S({ color: 0x1b1b1d, roughness: 0.45 }), brownW: S({ color: 0x5a3a24, roughness: 0.45 }), orangeW: S({ color: 0xf08a14, roughness: 0.45 }),
    copper: S({ color: 0xc87a4a, metalness: 1, roughness: 0.35 }), blueW: S({ color: 0x2457c8, roughness: 0.45 }), greenW: S({ color: 0x23983a, roughness: 0.45 }), yellowW: S({ color: 0xf0c018, roughness: 0.45 }), wood: S({ color: 0xb08860, roughness: 0.8 }), servoBlack: S({ color: 0x18191b, roughness: 0.42 }),
    alu: S({ color: 0xc9ccd2, metalness: 1, roughness: 0.34 }), sleeve: S({ color: 0x2a2b2e, roughness: 0.7 }), grey: S({ color: 0x6b6e73, roughness: 0.55 }),
    glass: new THREE.MeshPhysicalMaterial({ color: 0xeef6ff, roughness: 0.08, transparent: true, opacity: 0.28, depthWrite: false, side: THREE.DoubleSide }),
  });
  for (const m of Object.values(N)) m.userData.shared = true;
  return M;
}
export { N as MAT2 };
const keep = (o, role) => { o.userData.keep = true; if (role) { o.userData.role = role; o.name = role; } return o; };
const tube = (pts, r, mat, seg = 24, rs = 6) => new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), seg, r, rs, false), mat);
const ledM = (col) => S({ color: 0xf2efe0, emissive: col, emissiveIntensity: 0, roughness: 0.3 });
const SCALE = () => (LITE ? 8 : 14); // pixels per mm on the small boards' textures

// ------------------------------------------------------------------ small printed boards (canvas)
const TEXC = {}; // the printed boards' pictures, drawn once and shared by every copy (kept when a part is removed)
function board(w, h, color, draw, key) { if (key && TEXC[key]) return TEXC[key]; const t = TX.pcbTexture(w, h, draw, color); if (key) { t.userData.shared = true; TEXC[key] = t; } return t; }
const sharedMat = (key, make) => { if (TEXC['m:' + key]) return TEXC['m:' + key]; const m = make(); m.userData.shared = true; TEXC['m:' + key] = m; return m; };
function silk(c, t, x, y, px = 1.7, w = 700) { c.font = `${w} ${px}px ${TX.FONT}`; c.fillText(t, x, y); }

// ------------------------------------------------------------------ L298N dual H-bridge module (43 × 43 mm)
export function buildL298N() {
  const M = mats(); const g = new THREE.Group(); const y0 = 3.2, t = 1.6, top = y0 + t;
  const tex = board(43, 43, '#b8201c', (c) => {
    c.fillStyle = 'rgba(255,190,170,0.18)'; for (let i = 0; i < 7; i++) c.fillRect(6 + i * 4.4, 30, 1.2, 9); // traces
    c.fillStyle = '#f0ece4'; c.textAlign = 'center';
    silk(c, 'L298N', 21.5, 25.5, 2.4); silk(c, 'OUT1', 6.6, 6.2, 1.4); silk(c, 'OUT2', 6.6, 22.4, 1.4); silk(c, 'OUT3', 36.4, 22.4, 1.4); silk(c, 'OUT4', 36.4, 6.2, 1.4);
    silk(c, '+12V GND +5V', 11.4, 37.4, 1.25); silk(c, 'ENA IN1 IN2 IN3 IN4 ENB', 31.6, 37.6, 1.0); silk(c, '5V-EN', 12, 31.5, 1.1); silk(c, 'POWER', 31, 31.4, 1.0);
    c.fillStyle = '#7a1210'; for (const [x, y] of [[2.6, 2.6], [40.4, 2.6], [2.6, 40.4], [40.4, 40.4]]) { c.beginPath(); c.arc(x, y, 1.9, 0, 7); c.fill(); }
    c.fillStyle = '#d8c070'; for (const [x, y] of [[2.6, 2.6], [40.4, 2.6], [2.6, 40.4], [40.4, 40.4]]) { c.beginPath(); c.arc(x, y, 1.6, 0, 7); c.fill(); c.fillStyle = '#2a0a08'; c.beginPath(); c.arc(x, y, 1.05, 0, 7); c.fill(); c.fillStyle = '#d8c070'; }
  }, 'l298n');
  const pm = sharedMat('l298n', () => S({ map: tex, roughness: 0.42 }));
  g.add(box(43, t, 43, [M.fr4, M.fr4, pm, M.fr4, M.fr4, M.fr4], 0, y0 + t / 2, 0));
  for (const [x, z] of [[-19, -19], [19, -19], [-19, 19], [19, 19]]) g.add(cyl(2.4, y0, N.nylon, x, y0 / 2, z, 10));
  // the heat sink at the back, with the L298N (Multiwatt-15) bolted to its front
  const hs = new THREE.Group(); hs.position.set(0, top, -13.5);
  hs.add(box(23, 3, 15, N.heat, 0, 1.5, 0)); for (let i = 0; i < 7; i++) hs.add(box(1.2, 24, 15, N.heat, -10.4 + i * 3.47, 13.5, 0));
  hs.add(box(20, 18, 5, M.epoxy, 0, 12, 9.6)); hs.add(cyl(1.7, 1.2, M.steel, 0, 18, 12.3, 12).rotateX(Math.PI / 2));
  for (let i = 0; i < 15; i++) hs.add(box(0.5, 4.5 + (i % 2) * 2, 0.5, M.tin, -8.9 + i * 1.27, 1.6, 9.6 + (i % 2 ? 2.4 : 0)));
  g.add(hs);
  // screw terminals: blue, 5.08 mm pitch, wire openings outwards
  const term = (n, x, z, ry) => { const tg = new THREE.Group(); tg.position.set(x, top, z); tg.rotation.y = ry;
    tg.add(box(7.6, 10, n * 5.08, N.termBlue, 0, 5, 0));
    for (let i = 0; i < n; i++) { const zz = (i - (n - 1) / 2) * 5.08; tg.add(cyl(1.6, 0.6, M.steel, -0.6, 10.2, zz, 12)); tg.add(box(0.4, 0.3, 2.6, M.darkIn, -0.6, 10.5, zz)); tg.add(box(0.2, 3.4, 3.4, M.darkIn, -3.85, 4.6, zz)); }
    g.add(tg); };
  term(2, -18.2, -5.95, 0); term(2, 18.2, -5.95, Math.PI); term(3, -10.1, 18.2, -Math.PI / 2);
  // the logic header (ENA IN1 IN2 IN3 IN4 ENB) and the 5V-EN jumper
  g.add(box(6 * P, 2.5, P, M.black, 3.2 + 2.5 * P, top + 1.25, 18.2));
  for (let i = 0; i < 6; i++) g.add(box(0.64, 8.2, 0.64, M.gold, 3.2 + i * P, top + 4.1, 18.2));
  g.add(box(P, 2.5, 2 * P, M.black, -2, top + 1.25, 12)); g.add(box(2.5, 6, 5, M.black, -2, top + 4.6, 12));
  // regulator, two capacitors, the power LED
  g.add(box(6.6, 2.3, 6.1, M.epoxy, -12, top + 1.15, 6)); g.add(box(5.2, 0.5, 2, M.tin, -12, top + 0.25, 2.6));
  for (const [x, z] of [[-3, 6], [8, 6]]) { g.add(cyl(4, 11, N.servoBlack, x, top + 5.5, z, 20)); g.add(cyl(3.9, 0.3, M.alu, x, top + 11.1, z, 20)); }
  const pw = ledM(0xff2a1a); const led = keep(box(1.6, 0.7, 0.8, pw, 14, top + 0.35, 10)); g.add(led);
  g.userData.leds = { pwr: pw };
  shadows(g); return g;
}

// ------------------------------------------------------------------ BO (TT) gear motor with a 65 mm wheel, on a block
// part frame: the solder tabs at the origin end (z = 0), the motor along −z, the shaft along x (wheel on side L = −x)
export const BOGEO = { axleY: 34, axleZ: -58, wheelX: 25, wheelR: 32.5, wheelW: 26 };
function tyreTexture() {
  const C = document.createElement('canvas'); C.width = 256; C.height = 32; const c = C.getContext('2d');
  c.fillStyle = '#1d1d1e'; c.fillRect(0, 0, 256, 32); c.fillStyle = '#0c0c0c';
  for (let i = 0; i < 32; i++) { c.fillRect(i * 8, 3, 3.4, 11); c.fillRect(i * 8 + 4, 18, 3.4, 11); }
  const t = new THREE.CanvasTexture(C); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.RepeatWrapping; return t;
}
let TYRE = null;
export function buildWheel() { // a yellow hub with six spokes and a black treaded rubber tyre; axis along x
  mats(); const w = new THREE.Group(); const R = BOGEO.wheelR, W = BOGEO.wheelW;
  if (!TYRE) { TYRE = S({ map: tyreTexture(), roughness: 0.9 }); TYRE.userData.shared = true; }
  const prof = [[22.5, -W / 2], [29, -W / 2], [31.5, -W / 2 + 2], [R, -W / 2 + 5], [R, W / 2 - 5], [31.5, W / 2 - 2], [29, W / 2], [22.5, W / 2]].map(([r, y]) => new THREE.Vector2(r, y));
  const tg = new THREE.LatheGeometry(prof, 40); const uv = tg.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setX(i, uv.getX(i) * 6);
  const ty = new THREE.Mesh(tg, TYRE); ty.rotation.z = Math.PI / 2; w.add(ty);
  const hub = new THREE.Group(); hub.rotation.z = Math.PI / 2;
  hub.add(cyl(23, 3, N.yellow, 0, -W / 2 + 6, 0, 32)); hub.add(cyl(23, 2.4, N.yellow, 0, W / 2 - 2, 0, 32)); hub.add(cyl(5.5, W - 4, N.yellow, 0, 2, 0, 16));
  for (let i = 0; i < 6; i++) { const s = box(3, W - 8, 19, N.yellow, 0, 1, 0); s.rotation.y = i * Math.PI / 3; s.position.set(Math.sin(i * Math.PI / 3) * 12, 1, Math.cos(i * Math.PI / 3) * 12); hub.add(s); }
  for (let i = 0; i < 6; i++) { const h = cyl(4.2, 0.5, M_dark(), Math.sin(i * Math.PI / 3 + 0.5) * 15, W / 2 - 0.6, Math.cos(i * Math.PI / 3 + 0.5) * 15, 12); hub.add(h); }
  w.add(hub); mergeStatic(w); return w; // one wheel: three draw calls
}
const M_dark = () => materials().darkIn;
export function buildBOMotor(side = 'L', stand = true) {
  const M = mats(); const g = new THREE.Group(); const { axleY: ay, axleZ: az } = BOGEO; const sx = side === 'L' ? -1 : 1;
  // gearbox: 18.8 thick (along the shaft), 22.5 tall, 37 long; the motor can behind it
  const gb = new THREE.Group(); gb.position.set(0, ay, 0);
  gb.add(box(18.8, 22.5, 37, N.yellow, 0, 0, -51)); gb.add(box(18.8, 4, 6, N.yellow, 0, 0, -71.5)); // the end with the mounting hole
  gb.add(cyl(1.6, 19.2, M.darkIn, 0, -6, -62, 10).rotateZ(Math.PI / 2)); gb.add(cyl(1.6, 19.2, M.darkIn, 0, 6, -40, 10).rotateZ(Math.PI / 2));
  const can = cyl(10, 25, M.alu, 0, 0, -20, 28); can.rotation.x = Math.PI / 2; can.scale.set(1, 1, 0.78); gb.add(can); // flattened can
  gb.add(box(14, 17, 7, M.white, 0, 0, -26)); gb.add(cyl(3, 2, M.white, 0, 0, -6.5, 14).rotateX(Math.PI / 2)); // the clip, the end bell
  for (const s of [-1, 1]) gb.add(box(2.6, 4, 0.4, N.copper, s * 3.2, 0, -5.2)); // solder tabs
  gb.add(cyl(2.7, 30, M.white, 0, 0, az + 0, 12).rotateZ(Math.PI / 2)); gb.children[gb.children.length - 1].position.set(0, 0, az); // the shaft (white plastic, double flat)
  g.add(gb);
  // the red and black leads: from the tabs to the ends you wire (at the origin, y = term)
  for (const [x, m] of [[-3.2, N.redW], [3.2, N.blackW]]) g.add(tube([V3(x * 0.4, ay, -5.4), V3(x, ay + 1.5, -2.5), V3(x, 34, 0)], 0.8, m, 8, 6));
  if (stand) g.add(box(30, ay - 11.3 - 0.4, 54, N.wood, 0, (ay - 11.3) / 2 - 0.2, -48)); // a wooden block: the wheel turns in the air
  const wh = keep(buildWheel(), 'wheel'); wh.position.set(sx * BOGEO.wheelX, ay, az); g.add(wh);
  g.userData.wheel = wh; shadows(g); return g;
}

// ------------------------------------------------------------------ 2 × 18650 battery holder (77 × 41 × 21 mm)
let CELL = null;
function cellMat() {
  if (CELL) return CELL;
  const C = document.createElement('canvas'); C.width = 256; C.height = 64; const c = C.getContext('2d');
  const gr = c.createLinearGradient(0, 0, 0, 64); gr.addColorStop(0, '#1d5aa6'); gr.addColorStop(0.5, '#2c74c8'); gr.addColorStop(1, '#173f7a'); c.fillStyle = gr; c.fillRect(0, 0, 256, 64);
  c.fillStyle = '#e8eef6'; c.font = `700 22px ${TX.FONT}`; c.textAlign = 'center'; c.fillText('18650  3.7V  2000mAh', 128, 30); c.font = `600 13px ${TX.FONT}`; c.fillText('Li-ion rechargeable', 128, 50);
  const t = new THREE.CanvasTexture(C); t.colorSpace = THREE.SRGBColorSpace; CELL = S({ map: t, roughness: 0.32 }); CELL.userData.shared = true; return CELL;
}
export function buildBattery18650() {
  const M = mats(); const g = new THREE.Group(); const cz = -42, L = 77, Wd = 41, H = 20;
  const hb = new THREE.Group(); hb.position.set(2.5, 0, cz);
  hb.add(box(L, 2, Wd, N.servoBlack, 0, 1, 0)); hb.add(box(L, H, 1.6, N.servoBlack, 0, H / 2, -Wd / 2 + 0.8)); hb.add(box(L, H, 1.6, N.servoBlack, 0, H / 2, Wd / 2 - 0.8));
  hb.add(box(1.6, H, Wd, N.servoBlack, 0, H / 2, 0)); for (const s of [-1, 1]) hb.add(box(2.4, H + 1, Wd, N.servoBlack, s * (L / 2 - 1.2), (H + 1) / 2, 0));
  for (const s of [-1, 1]) { const c = cyl(9.2, 65, cellMat(), 0, 10.5, s * 10, 32); c.rotation.z = Math.PI / 2; const uv = c.geometry.attributes.uv; void uv; hb.add(c); hb.add(cyl(3.6, 1.2, M.steel, 33, 10.5, s * 10, 16).rotateZ(Math.PI / 2)); hb.add(cyl(4.2, 6, M.steel, -35, 10.5, s * 10, 8).rotateZ(Math.PI / 2)); }
  g.add(hb);
  for (const [x, m] of [[0, N.redW], [5.08, N.blackW]]) { g.add(tube([V3(2.5 - L / 2 + 4, 8, cz + (x ? 6 : -6)), V3(-36, 4, -14), V3(x, 3, -4), V3(x, 3, 0)], 0.75, m, 16, 6)); g.add(box(0.9, 0.9, 3, M.tin, x, 3, 0.8)); }
  shadows(g); return g;
}

// ------------------------------------------------------------------ HC-05 on its carrier board (stands in a breadboard row)
export function buildHC05() {
  const M = mats(); const g = new THREE.Group(); const cx = 2.5 * P, y0 = 3.2, bw = 15.6, bh = 37;
  for (let i = 0; i < 6; i++) g.add(box(0.64, 9.5, 0.64, M.gold, i * P, -1.5, 0));
  g.add(box(6 * P, 2.5, 2.5, M.black, cx, 1.35, 0));
  const tex = board(bw, bh, '#1e4fb0', (c) => { c.fillStyle = '#f0f0f0'; c.textAlign = 'center'; ['EN', 'VCC', 'GND', 'TXD', 'RXD', 'STATE'].forEach((s, i) => { c.save(); c.translate(bw / 2 + (i - 2.5) * P, bh - 1.4); c.rotate(-Math.PI / 2); silk(c, s, 0, 0.4, 1.0, 600); c.restore(); }); silk(c, 'Bluetooth · ZS-040', bw / 2, 3, 1.1); silk(c, 'LEVEL: 3.3V', bw / 2, bh - 7.4, 1.0); }, 'hc05');
  const bm = sharedMat('hc05', () => S({ map: tex, roughness: 0.42 }));
  g.add(box(bw, bh, 1.6, [M.fr4, M.fr4, M.fr4, M.fr4, bm, bm], cx, y0 + bh / 2, -1.6));
  const mt = board(13, 27, '#1a7a3c', (c) => { c.fillStyle = 'rgba(220,200,120,0.85)'; for (let i = 0; i < 6; i++) c.fillRect(1 + (i % 2) * 9, 1.2 + i * 1.2, 2, 0.5); c.fillRect(1.6, 1.4, 9.8, 0.45); c.fillStyle = '#111'; c.fillRect(3.5, 11, 6, 6); c.fillStyle = '#ddd'; c.textAlign = 'center'; silk(c, 'HC-05', 6.5, 23, 1.6); }, 'hc05m');
  g.add(box(13, 27, 1.0, [M.fr4, M.fr4, M.fr4, M.fr4, sharedMat('hc05m', () => S({ map: mt, roughness: 0.45 })), M.fr4], cx, y0 + bh - 14.5, -0.3));
  g.add(box(4, 1.2, 3.2, M.black, cx + 4, y0 + 9, -0.2)); g.add(cyl(0.9, 0.8, M.white, cx + 4, y0 + 9, 1.3, 10).rotateX(Math.PI / 2)); // the key button
  const lm = ledM(0xff3020); g.add(keep(box(1.6, 0.8, 0.7, lm, cx - 4.5, y0 + 6, 0.3)));
  g.userData.leds = { st: lm }; g.userData.face = new THREE.Vector3(0, 0, 1); shadows(g, true, false); return g;
}

// ------------------------------------------------------------------ joystick module (KY-023 type)
export function buildJoystick() {
  const M = mats(); const g = new THREE.Group(); const y0 = 3.5, pw = 26, pl = 34, cz = -4 - pl / 2;
  for (let i = -2; i <= 2; i++) g.add(box(0.64, 0.64, 8, M.gold, i * P, y0 + 1.5, -2)); // right-angle pins pointing at you
  g.add(box(5 * P, 2.5, 2.5, M.black, 0, y0 + 1.5, -5));
  const tex = board(pw, pl, '#22252a', (c) => { c.fillStyle = '#e8e8e8'; c.textAlign = 'center'; ['GND', '+5V', 'VRx', 'VRy', 'SW'].forEach((s, i) => silk(c, s, pw / 2 + (i - 2) * P, pl - 1.6, 1.0, 600)); }, 'joy');
  g.add(box(pw, 1.6, pl, [M.fr4, M.fr4, sharedMat('joy', () => S({ map: tex, roughness: 0.45 })), M.fr4, M.fr4, M.fr4], 0, y0 + 0.8, cz));
  for (const [x, z] of [[-11, cz - 13], [11, cz - 13], [-11, cz + 13], [11, cz + 13]]) g.add(cyl(1.6, y0, N.nylon, x, y0 / 2, z, 8));
  g.add(box(20, 9, 20, N.grey, 0, y0 + 1.6 + 4.5, cz - 2)); g.add(box(4, 7, 8, M.potBlue, -12, y0 + 1.6 + 3.5, cz - 2)); g.add(box(8, 7, 4, M.potBlue, 0, y0 + 1.6 + 3.5, cz + 10));
  const dome = new THREE.Mesh(new THREE.SphereGeometry(8, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), N.grey); dome.position.set(0, y0 + 10.6, cz - 2); g.add(dome);
  const stick = keep(new THREE.Group(), 'stick'); stick.position.set(0, y0 + 11, cz - 2);
  stick.add(cyl(2.2, 12, M.black, 0, 6, 0, 12)); const capm = S({ color: 0x1b1b1d, roughness: 0.55 });
  stick.add(cyl(12, 7, capm, 0, 14, 0, 28, 11)); stick.add(new THREE.Mesh(new THREE.TorusGeometry(10.5, 1.0, 6, 28), capm).rotateX(Math.PI / 2).translateZ(-17.6));
  g.add(stick); g.userData.stick = stick; shadows(g); return g;
}

// ------------------------------------------------------------------ 5 V adapter: a DC jack to screw-terminal plug and its cable
export function buildPSU5() {
  const M = mats(); const g = new THREE.Group();
  g.add(box(10.2, 10, 8, N.termGreen, 2.54, 5, -4)); for (const x of [0, 5.08]) { g.add(cyl(1.6, 0.6, M.steel, x, 10.2, -4.6, 12)); g.add(box(3.4, 3.4, 0.2, M.darkIn, x, 4.8, 0.02)); }
  g.add(box(13, 12, 22, M.black, 2.54, 6, -19)); g.add(cyl(5.5, 10, M.black, 2.54, 6, -35, 20).rotateX(Math.PI / 2));
  g.add(tube([V3(2.54, 6, -40), V3(4, 5, -60), V3(20, 3, -78), V3(36, 3, -86)], 1.8, N.blackW, 14, 8));
  const brick = box(38, 26, 64, M.black, 50, 13, -92); brick.rotation.y = -0.5; g.add(brick);
  const lab = sharedMat('psu', () => S({ map: TX.labelSticker([['5V ⎓ 3A', 40, 56], ['INPUT 100–240V~ 50/60Hz', 13, 104], ['OUTPUT 5V 3A', 15, 132]], '#1b1b1d', '#c8c8c8', 256, 160), roughness: 0.5 }));
  const sticker = new THREE.Mesh(new THREE.PlaneGeometry(30, 19), lab); sticker.rotation.set(-Math.PI / 2, 0, -0.5); sticker.position.set(50, 26.1, -92); g.add(sticker);
  shadows(g); return g;
}

// ------------------------------------------------------------------ servos: the MG996R, and the plug of a servo in a robot
function connector3(n) { const M = mats(); const g = new THREE.Group(); g.add(box(n * P, 2.6, 13, M.black, ((n - 1) * P) / 2 - P, 1.5, -6.5)); for (let i = 0; i < n; i++) g.add(box(1.4, 1.4, 0.3, M.darkIn, -P + i * P, 1.5, 0.02)); return g; }
// the plug and a short piece of its cable, which goes on to the robot (worlds.js draws the rest)
export function buildPlug(cols) {
  const M = mats(); const g = new THREE.Group(); const n = cols.length; const x0 = n === 3 ? -P : -1.5 * P;
  g.add(box(n * P, 2.6, 13, M.black, x0 + ((n - 1) * P) / 2, 1.5, -6.5)); for (let i = 0; i < n; i++) g.add(box(1.4, 1.4, 0.3, M.darkIn, x0 + i * P, 1.5, 0.02));
  const rib = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V3(0, 1.5, -13), V3(0, 1.4, -22), V3(0, 1.2, -36)]), 8, 1, 8, false), ribbonMat(cols)); rib.scale.set(n * 0.66 * P / 2, 0.55, 1); rib.position.x = x0 + (n - 1) * P / 2; g.add(rib);
  g.userData.cableEnd = V3(x0 + (n - 1) * P / 2, 1.2, -36);
  shadows(g); return g;
}
export const PLUG_SERVO = () => ['#5a3a24', '#c8281c', '#f08a14'];
export const PLUG_IR = () => ['#c8281c', '#1b1b1d', '#f0c018'];
export const PLUG_US = () => ['#c8281c', '#2457c8', '#e8e8e4', '#1b1b1d'];
const RIB = {};
function ribbonMat(cols) { // a flat ribbon cable: the colours run along it (the tube's v goes round it)
  const k = cols.join(); if (RIB[k]) return RIB[k];
  const C = document.createElement('canvas'); C.width = 4; C.height = 64; const c = C.getContext('2d'); const n = cols.length;
  for (let i = 0; i < 64; i++) { const a = (i / 64) * Math.PI * 2; const side = Math.cos(a); const idx = Math.min(n - 1, Math.max(0, Math.floor((side + 1) / 2 * n))); c.fillStyle = cols[n - 1 - idx]; c.fillRect(0, i, 4, 1); }
  const t = new THREE.CanvasTexture(C); t.colorSpace = THREE.SRGBColorSpace; t.magFilter = THREE.NearestFilter; RIB[k] = S({ map: t, roughness: 0.45 }); RIB[k].userData.shared = true; return RIB[k];
}
export function buildMG996R(body = true) {
  const M = mats(); const g = new THREE.Group();
  g.add(connector3(3));
  g.add(tube([V3(-P * 0.5, 1.5, -13), V3(-P * 0.5, 2, -30), V3(-1, 5, -52), V3(-1, 8, -62)], 1.4, N.sleeve, 12, 6));
  if (!body) return g;
  const b = new THREE.Group(); b.position.set(0, 0, -86); g.add(b); b.add(mg996Body());
  const horn = keep(hornX(), 'horn'); horn.position.set(-10, 45.5, 0); b.add(horn); g.userData.horn = horn;
  shadows(g); return g;
}
export function mg996Body() { // 40.7 × 19.7 × 42.9 mm, flanges 54 mm; the output shaft at x = −10, top (y = 43)
  const M = mats(); const b = new THREE.Group();
  b.add(box(40.7, 37, 19.7, N.servoBlack, 0, 18.5, 0)); b.add(box(54, 2.5, 19.7, N.servoBlack, 0, 29, 0)); b.add(box(40.7, 6, 19.7, N.servoBlack, 0, 40, 0));
  for (const s of [-1, 1]) for (const z of [-5, 5]) b.add(cyl(1.1, 2.7, M.darkIn, s * 24, 29, z, 8));
  b.add(cyl(6.5, 2.2, N.servoBlack, -10, 44, 0, 20)); b.add(cyl(2.9, 2.0, M.gold, -10, 45.6, 0, 12));
  const st = new THREE.Mesh(new THREE.PlaneGeometry(30, 12), sharedMat('mg996', () => S({ map: TX.labelSticker([['MG996R', 44, 58], ['metal gear · 13 kg', 22, 112]], '#d9dadc', '#1a1a1c'), roughness: 0.5 })));
  st.position.set(2, 17, 9.9); b.add(st); return b;
}
function hornX() { const M = mats(); const h = new THREE.Group(); h.add(cyl(4, 2.6, M.white, 0, 0, 0, 16)); for (const a of [0, Math.PI / 2]) { const arm = box(30, 2, 5, M.white, 0, 0.3, 0); arm.rotation.y = a; h.add(arm); } return h; }
export function sg90Body() { // the blue SG90 (22.8 × 22.5 × 12.2, flanges 32.3); output shaft at x = −5.6, y = 29
  const M = materials(); const b = new THREE.Group();
  b.add(box(22.8, 22.5, 12.2, M.blueBody, 0, 11.25, 0)); b.add(box(32.3, 2.4, 12.2, M.blueBody, 0, 16.2, 0));
  b.add(box(11.6, 4.0, 11.6, M.blueBody, -5.6, 24.5, 0)); b.add(cyl(5.9, 4.0, M.blueBody, -5.6, 24.5, 0, 20)); b.add(cyl(2.4, 2.4, M.white, -5.6, 27.6, 0, 14));
  return b;
}

// ------------------------------------------------------------------ the HC-SR04 as it sits on a robot (no legs: its pins point back)
export function buildUSHead() {
  const M = mats(); const g = new THREE.Group(); const pw = 45, ph = 20;
  const pcbT = board(pw, ph, '#1e56b8', (c) => { c.fillStyle = '#e8e8e8'; c.font = `700 3px ${TX.FONT}`; c.textAlign = 'center'; c.fillText('HC-SR04', pw / 2, 4.2); c.font = `700 2.2px ${TX.FONT}`; c.fillText('T', 4, 10); c.fillText('R', pw - 4, 10); }, 'ushead');
  const pm = sharedMat('ushead', () => S({ map: pcbT, roughness: 0.45 })); g.add(box(pw, ph, 1.6, [M.fr4, M.fr4, M.fr4, M.fr4, pm, pm], 0, 0, 0));
  const mesh = sharedMat('usmesh', () => S({ map: TX.meshTexture(), metalness: 0.6, roughness: 0.5 }));
  for (const s of [-1, 1]) { const t = cyl(8.1, 12, M.alu, s * 13, 0, 6.8, 24); t.rotation.x = Math.PI / 2; g.add(t); const f = new THREE.Mesh(new THREE.CircleGeometry(7.2, 24), mesh); f.position.set(s * 13, 0, 12.82); g.add(f); }
  g.add(box(4 * P, 2.5, 6, M.black, 0, -ph / 2 + 1.3, -3.6)); return g;
}

// ------------------------------------------------------------------ the robot arm (4 joints): base, shoulder, elbow, gripper
// MG996R servos in brushed aluminium brackets; an SG90 works the claw. Joints in mm (robots.js ARMG): the shoulder axis 78
// above the desk, upper arm 105, forearm 100, claw 62 from the wrist plate to the finger tips.
export function buildArm() {
  const M = mats(); const A = ARMG; const g = new THREE.Group(); g.name = 'arm';
  const base = new THREE.Group(); g.add(base);
  base.add(cyl(62, 6, N.alu, 0, 3, 0, 40)); base.add(box(48, 40, 26, N.servoBlack, 0, 26, 0)); // the base plate and the base servo standing in it
  base.add(cyl(28, 6, N.alu, 0, 49, 0, 32)); for (let i = 0; i < 6; i++) base.add(cyl(2.4, 1.2, M.steel, Math.cos(i * 1.047) * 52, 6.4, Math.sin(i * 1.047) * 52, 10));
  const yaw = keep(new THREE.Group(), 'yaw'); yaw.position.y = 52; g.add(yaw);
  yaw.add(cyl(40, 4, N.alu, 0, 2, 0, 36)); // the turntable
  for (const s of [-1, 1]) yaw.add(box(3, A.h0 - 52 + 12, 40, N.alu, s * 26, (A.h0 - 52 + 12) / 2, 0)); // the shoulder's U bracket
  const shS = mg996Body(); shS.rotation.set(0, 0, Math.PI / 2); shS.position.set(22, A.h0 - 52 - 10, 0); yaw.add(shS); // the shoulder servo lies on its side
  const sh = keep(new THREE.Group(), 'shoulder'); sh.position.set(0, A.h0 - 52, 0); yaw.add(sh);
  for (const s of [-1, 1]) { sh.add(box(3, 22, A.L1 + 16, N.alu, s * 17, 0, A.L1 / 2)); }
  sh.add(cyl(9, 40, N.alu, 0, 0, 0, 20).rotateZ(Math.PI / 2)); sh.add(box(31, 3, 30, N.alu, 0, -9.5, A.L1 / 2));
  const elS = mg996Body(); elS.rotation.set(0, 0, Math.PI / 2); elS.position.set(18, -10, A.L1); sh.add(elS);
  const el = keep(new THREE.Group(), 'elbow'); el.position.set(0, 0, A.L1); sh.add(el);
  for (const s of [-1, 1]) el.add(box(3, 18, A.L2 + 12, N.alu, s * 13, 0, A.L2 / 2));
  el.add(cyl(7.5, 30, N.alu, 0, 0, 0, 18).rotateZ(Math.PI / 2)); el.add(box(23, 2.5, A.L2 - 30, N.alu, 0, 7.6, A.L2 / 2));
  // the wrist plate, the claw's SG90 and its two fingers
  const wr = new THREE.Group(); wr.position.set(0, 0, A.L2); el.add(wr);
  wr.add(box(44, 30, 3, N.alu, 0, 0, 1.5)); const gS = sg90Body(); gS.rotation.set(-Math.PI / 2, 0, 0); gS.position.set(5.6, 14, 4); wr.add(gS);
  const fingers = [];
  for (const s of [-1, 1]) {
    const f = keep(new THREE.Group(), 'finger'); f.position.set(s * 8, 0, 6); wr.add(f);
    f.add(box(4, 12, 34, N.alu, s * 2, 0, 15)); f.add(box(3, 12, 26, N.alu, s * 0.5, 0, 42)); f.add(box(2.4, 13, 22, N.servoBlack, -s * 0.9, 0, 46)); // rubber pad
    for (let i = 0; i < 5; i++) f.add(box(1.4, 3, 3, M.white, s * 2, 7, 4 + i * 6)); // gear teeth at the root
    fingers.push(f);
  }
  for (const f of fingers) { const ud = f.userData; mergeStatic(f); f.userData = ud; }
  const base2 = new THREE.Group(); base2.add(base); // (base stays still)
  for (const o of [base, yaw, sh, el, wr]) shadows(o, false, false);
  // merge every still piece of each moving link (a link is a few draw calls)
  for (const link of [base, yaw, sh, el, wr]) mergeLink(link);
  g.userData.j = { yaw, sh, el, fingers };
  return g;
}
// merge the static meshes of one link, but not the links (and fingers) hanging under it
function mergeLink(link) {
  const kids = link.children.filter((c) => c.userData.keep); for (const k of kids) link.remove(k);
  const ud = link.userData; mergeStatic(link); link.userData = ud; for (const k of kids) link.add(k);
}

// ------------------------------------------------------------------ the smart dustbin: a pedal bin with a servo-worked lid
export const BING = { r0: 108, r1: 122, h: 300, lidR: 128, hinge: [0, 300, -126] };
export function buildBin() {
  const M = mats(); const g = new THREE.Group(); g.name = 'bin'; const B = BING;
  const body = Lm({ color: 0x2d8a5a, side: THREE.DoubleSide }); const dark = Lm({ color: 0x1f6a44 });
  const prof = [[0, 0], [B.r0 - 6, 0], [B.r0, 6], [B.r1, B.h - 8], [B.r1 + 3, B.h - 4], [B.r1 + 3, B.h], [B.r1 - 2, B.h]].map(([r, y]) => new THREE.Vector2(r, y));
  g.add(new THREE.Mesh(new THREE.LatheGeometry(prof, 48), body));
  g.add(new THREE.Mesh(new THREE.CircleGeometry(B.r1 - 3, 40), dark).rotateX(-Math.PI / 2).translateZ(B.h - 40)); // the dark inside (a bag)
  const lid = keep(new THREE.Group(), 'lid'); lid.position.set(...B.hinge); g.add(lid);
  const lidM = Lm({ color: 0x2f9663 });
  const lg = new THREE.CylinderGeometry(B.lidR, B.lidR, 8, 48); lg.translate(0, 4, -B.hinge[2]); lid.add(new THREE.Mesh(lg, lidM));
  lid.add(box(60, 12, 14, dark, 0, 8, 8)); // the hinge block
  // the sensor on the front, near the top; the SG90 on the back, its horn pushing the lid
  const us = buildUSHead(); us.position.set(0, B.h - 34, B.r1 + 4); us.rotation.x = 0.04; g.add(us);
  g.add(box(56, 26, 6, dark, 0, B.h - 34, B.r1 - 1));
  const sv = sg90Body(); sv.rotation.set(0, Math.PI, 0); sv.position.set(-30, B.h - 30, -B.r1 - 8); g.add(sv);
  const horn = keep(new THREE.Group(), 'horn'); horn.position.set(-24.4, B.h - 1, -B.r1 - 8); g.add(horn);
  horn.add(box(26, 2, 5, M.white, 9, 0, 0));
  const ud = { lid, horn, us }; mergeStatic(g); g.userData = ud; return g;
}
export function buildPaperBall() { // a crumpled ball of paper
  const geo = new THREE.IcosahedronGeometry(17, 2); const p = geo.attributes.position; const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); const n = 0.78 + 0.32 * Math.abs(Math.sin(v.x * 0.9) * Math.cos(v.y * 1.1 + v.z * 0.7)); v.multiplyScalar(n); p.setXYZ(i, v.x, v.y, v.z); }
  geo.computeVertexNormals(); return new THREE.Mesh(geo, S({ color: 0xece8dc, roughness: 0.95, flatShading: true }));
}

// ------------------------------------------------------------------ the hydraulic arm: cardboard, two syringes, a tube of water
// Lengths in mm. The arm pivots on the pillar at (0, 150); the lift syringe pushes it 60 mm from the pivot.
function cardTexture() {
  const C = document.createElement('canvas'); C.width = 256; C.height = 256; const c = C.getContext('2d');
  c.fillStyle = '#b98d5a'; c.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 2600; i++) { c.fillStyle = `rgba(${90 + Math.random() * 60},${60 + Math.random() * 40},${30},${Math.random() * 0.12})`; c.fillRect(Math.random() * 256, Math.random() * 256, 1 + Math.random() * 3, 1); }
  c.fillStyle = 'rgba(80,50,20,0.07)'; for (let x = 0; x < 256; x += 8) c.fillRect(x, 0, 3, 256); // the flutes inside
  const t = new THREE.CanvasTexture(C); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}
function scaleTexture(ml) { // the printed scale on a syringe
  const C = document.createElement('canvas'); C.width = 256; C.height = 64; const c = C.getContext('2d'); c.clearRect(0, 0, 256, 64);
  c.fillStyle = 'rgba(20,20,20,0.85)'; c.font = `700 13px ${TX.FONT}`; c.textAlign = 'center';
  for (let i = 0; i <= ml * 2; i++) { const x = 18 + i / (ml * 2) * 220; c.fillRect(x - 0.6, 6, 1.2, i % 2 ? 9 : 16); if (i % 2 === 0 && (ml <= 10 || i % 4 === 0)) c.fillText(String(i / 2), x, 36); }
  c.font = `800 14px ${TX.FONT}`; c.fillText(ml + ' mL', 128, 58);
  const t = new THREE.CanvasTexture(C); t.colorSpace = THREE.SRGBColorSpace; return t;
}
export function buildSyringe(ml, waterM) { // along +x: the nozzle at x = 0, the barrel, then the plunger (role 'plunger')
  const M = mats(); const s = SYR[ml], r = s.d / 2; const g = new THREE.Group();
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(r + 0.9, r + 0.9, s.L + 8, 28, 1, true), N.glass); barrel.rotation.z = Math.PI / 2; barrel.position.x = 6 + (s.L + 8) / 2; g.add(barrel);
  const sc = new THREE.Mesh(new THREE.CylinderGeometry(r + 0.95, r + 0.95, s.L, 28, 1, true, -0.9, 1.8), new THREE.MeshBasicMaterial({ map: scaleTexture(ml), transparent: true, depthWrite: false }));
  sc.rotation.z = -Math.PI / 2; sc.rotation.x = Math.PI / 2; sc.position.x = 10 + s.L / 2; g.add(sc);
  g.add(cyl(2.2, 7, N.glass, 3.5, 0, 0, 12).rotateZ(Math.PI / 2)); g.add(box(3, (r + 6) * 2, 6, N.glass, s.L + 15, 0, 0)); // nozzle, finger grip
  const water = keep(new THREE.Mesh(new THREE.CylinderGeometry(r - 0.1, r - 0.1, 1, 24), waterM), 'water'); water.rotation.z = Math.PI / 2; g.add(water);
  const pl = keep(new THREE.Group(), 'plunger'); g.add(pl);
  pl.add(cyl(r - 0.05, 5, M.rubber, 2.5, 0, 0, 24).rotateZ(Math.PI / 2)); pl.add(box(s.L + 22, 1.6, r * 1.4, N.nylon, 5 + (s.L + 22) / 2, 0, 0)); pl.add(box(s.L + 22, r * 1.4, 1.6, N.nylon, 5 + (s.L + 22) / 2, 0, 0));
  pl.add(cyl(r + 4, 2, N.nylon, s.L + 28, 0, 0, 24).rotateZ(Math.PI / 2));
  mergeLink(pl); for (const o of pl.children) o.userData.role = 'plunger';
  g.userData = { s, water, pl, r }; mergeLink(g); // (barrel, nozzle and grip: one draw call; the water and the plunger move)
  return g;
}
export function buildHydraulic() {
  const M = mats(); const g = new THREE.Group(); g.name = 'hyd'; const H = HYDG;
  const ct = cardTexture(); const card = Lm({ map: ct }); const cardEdge = Lm({ color: 0x9a7448 });
  g.add(box(320, 6, 200, [cardEdge, cardEdge, card, cardEdge, cardEdge, cardEdge], 40, 3, 0)); // the base board
  for (const s of [-1, 1]) g.add(box(6, H.pivot[1] + 10, 50, [cardEdge, cardEdge, card, cardEdge, card, card], 0, (H.pivot[1] + 10) / 2 + 6, s * 18)); // the pillar (two layers)
  const arm = keep(new THREE.Group(), 'arm'); arm.position.set(0, H.pivot[1], 0); g.add(arm);
  arm.add(box(H.arm + 20, 30, 6, [cardEdge, cardEdge, card, card, card, card], H.arm / 2, 0, 0)); arm.add(cyl(3, 50, N.alu, 0, 0, 0, 10).rotateX(Math.PI / 2)); // the arm and its pivot (a pencil)
  const cup = new THREE.Group(); cup.position.set(H.arm - 6, 15, 0); arm.add(cup); // the load: a stack of twelve ₹5 coins (about 80 g)
  const coin = S({ color: 0xb8963f, metalness: 0.85, roughness: 0.55 }); // (not too shiny: no glow) for (let i = 0; i < 12; i++) cup.add(cyl(11.5, 2.2, coin, (i % 3 - 1) * 0.7, 1.2 + i * 2.3, (i % 2) * 0.5, 24));
  const waterM = S({ color: 0x2a7de0, roughness: 0.15, transparent: true, opacity: 0.75 });
  mergeLink(arm); g.userData = { arm, card, waterM }; mergeLink(g); g.userData = { arm, card, waterM }; // (board and pillar: two draw calls; the arm and its coins: three)
  return g;
}

// ------------------------------------------------------------------ the 2WD robot car (on the arena floor)
// car frame: forward +z, the wheel axle at z = 0, wheels at x = ±CAR.track/2, the IR sensors at the front (z = CAR.sensZ)
export const CAR = { ...CARG, plateL: 210, plateW: 118, plateY: 46, castZ: 150 };
export const CAR_BOARD = {}; // batch 6: another board on the plate for a kind of car (models6.js: the Pi 4 for 'pi')
export function buildCar(kind, parts, opt = {}) { // (batch 19: opt.board, another board on the plate, e.g. 'pi')
  const M = mats(); const g = new THREE.Group(); g.name = 'car';
  const still = new THREE.Group(); g.add(still);
  // the acrylic plate (clear, 3 mm) with its laser-cut slots
  const sh = new THREE.Shape(); const L = CAR.plateL, W = CAR.plateW; const z0 = -45;
  sh.moveTo(-W / 2, z0); sh.lineTo(W / 2, z0); sh.lineTo(W / 2, z0 + L - 30); sh.quadraticCurveTo(W / 2, z0 + L, 0, z0 + L); sh.quadraticCurveTo(-W / 2, z0 + L, -W / 2, z0 + L - 30); sh.closePath();
  for (const [x, z] of [[-30, 40], [30, 40], [0, 100], [-30, 120], [30, 120]]) { const h = new THREE.Path(); h.absellipse(x, z, 6, 3, 0, Math.PI * 2, true); sh.holes.push(h); }
  const pg = new THREE.ExtrudeGeometry(sh, { depth: 3, bevelEnabled: false }); pg.rotateX(Math.PI / 2); pg.translate(0, CAR.plateY + 3, 0); // shape (x, y) -> car (x, z); 3 mm thick
  const acr = S({ color: 0x9fd2f0, roughness: 0.3, transparent: true, opacity: 0.5, depthWrite: false, envMapIntensity: 0.4 });
  still.add(new THREE.Mesh(pg, acr));
  // the two motors under the plate at the back, the ball caster at the front
  for (const s of [-1, 1]) { // the shaft (motor frame: 0, axleY, axleZ) on the axle, the gearbox inside the wheel
    const mo = buildBOMotor(s > 0 ? 'L' : 'R', false); mo.remove(mo.userData.wheel);
    mo.position.set(s * (CAR.track / 2 - BOGEO.wheelX), 32.5 - BOGEO.axleY, -BOGEO.axleZ); still.add(mo);
  }
  const cast = new THREE.Group(); cast.position.set(0, 0, CAR.castZ); still.add(cast);
  cast.add(cyl(9, 5, M.steel, 0, CAR.plateY - 6, 0, 20)); cast.add(cyl(4, CAR.plateY - 20, N.copper, 0, (CAR.plateY - 8) / 2 + 6, 0, 10)); cast.add(new THREE.Mesh(new THREE.SphereGeometry(7.5, 16, 10), M.steel).translateY(7.5));
  // on the plate: the battery holder at the back, the driver, the Uno, a small breadboard
  const top = CAR.plateY + 3;
  const bat = buildBattery18650(); bat.position.set(-2.5, top, 22); still.add(bat); // the holder over the axle, its leads to the driver
  const drv = buildL298N(); drv.position.set(0, top, 26); still.add(drv);
  const bk = opt.board || kind; const uno = (CAR_BOARD[bk] || unoLite)(); uno.position.set(0, top, 88); still.add(uno); // (batch 6: CAR_BOARD)
  if (kind !== 'avoid' && !CAR_BOARD[bk]) { const bbm = miniBreadboard(); bbm.position.set(0, top, 143); still.add(bbm); }
  // a bundle of jumper wires from the Uno to the driver (it is wired!)
  const wm = [N.redW, N.blackW, N.orangeW, N.greenW, N.blueW, N.yellowW];
  for (let i = 0; i < 6; i++) still.add(tube([V3(3.2 + i * 2.54, top + 17, 44), V3(4 + i * 3, top + 32, 56), V3(-14 + i * 4, top + 26, 70), V3(-24.1, top + 15, 70 + i * 4)], 0.7, wm[i], 14, 5));
  const live = { motors: [], leds: {} };
  if (kind === 'line') { // two IR modules at the front edge, looking down at the floor
    for (const s of [-1, 1]) { const ir = irDown(); ir.position.set(s * CAR.sensX, 0, CAR.sensZ - 10); still.add(ir); live.leds['ir' + (s > 0 ? 'L' : 'R')] = ir.userData.det; }
  }
  if (kind === 'avoid' && opt.fixed) { // batch 19: the HC-SR04 fixed at the front on an acrylic bracket, looking straight ahead
    still.add(box(22, 16, 3, acr, 0, top + 8, CAR.usZ - 4)); const fr = buildUSHead(); fr.position.set(0, top + 26, CAR.usZ); still.add(fr);
  } else if (kind === 'avoid') { // the HC-SR04 on an SG90 at the front
    const sv = sg90Body(); sv.position.set(5.6, top, CAR.usZ); still.add(sv);
    const head = keep(new THREE.Group(), 'scan'); head.position.set(0, top + 29, CAR.usZ); g.add(head);
    head.add(box(48, 3, 14, M.white, 0, 1.5, 0)); const us = buildUSHead(); us.position.set(0, 14, 3); head.add(us); live.scan = head;
  }
  if (kind === 'soccer') { // (batch 24) the HC-05 as on the Bluetooth car, and an acrylic V-scoop on the nose (two plates and a floor lip)
    const bt = buildHC05(); bt.position.set(-6, top + 6, 140); still.add(bt); live.leds.bt = bt.userData.leds.st;
    for (const sd of [-1, 1]) { const pl = box(3, 40, 74, acr, 0, 0, 0); pl.position.set(sd * 52, 24, 205); pl.rotation.y = sd * -0.62; still.add(pl); }
    still.add(box(150, 3, 20, acr, 0, 30, 172)); still.add(box(40, 3, 46, acr, 0, CAR.plateY + 1.5, 160));
  }
  if (kind === 'bt') { const bt = buildHC05(); bt.scale.setScalar(1); bt.position.set(-6, top + 6, 140); still.add(bt); live.leds.bt = bt.userData.leds.st; }
  // batch 14
  if (kind === 'sumo') { // (batch 24) the edge IR modules at the front corners, as the table robot's, and the HC-SR04 fixed at the front
    still.add(box(130, 3, 22, acr, 0, CAR.plateY + 1.5, 196)); still.add(box(10, 3, 50, acr, -30, CAR.plateY + 1.5, 160)); still.add(box(10, 3, 50, acr, 30, CAR.plateY + 1.5, 160));
    for (const s of [-1, 1]) { const ir = irDown(); ir.position.set(s * CAR14.edgeX, 0, CAR14.edgeZ - 10); still.add(ir); live.leds['ir' + (s > 0 ? 'L' : 'R')] = ir.userData.det; }
    still.add(box(22, 16, 3, acr, 0, top + 8, CAR.usZ - 4)); const fr = buildUSHead(); fr.position.set(0, top + 26, CAR.usZ); still.add(fr);
  }
  if (kind === 'edge') { // two "cliff" IR modules on an acrylic bar out in front, at the corners
    still.add(box(130, 3, 22, acr, 0, CAR.plateY + 1.5, 196)); still.add(box(10, 3, 50, acr, -30, CAR.plateY + 1.5, 160)); still.add(box(10, 3, 50, acr, 30, CAR.plateY + 1.5, 160));
    for (const s of [-1, 1]) { const ir = irDown(); ir.position.set(s * CAR14.edgeX, 0, CAR14.edgeZ - 10); still.add(ir); live.leds['ir' + (s > 0 ? 'L' : 'R')] = ir.userData.det; }
  }
  if (kind === 'lap') { // the line sensors, and the lap sensor on the left side
    for (const s of [-1, 1]) { const ir = irDown(); ir.position.set(s * CAR.sensX, 0, CAR.sensZ - 10); still.add(ir); live.leds['ir' + (s > 0 ? 'L' : 'R')] = ir.userData.det; }
    still.add(box(36, 3, 14, acr, CAR14.markX - 14, CAR.plateY + 1.5, CAR14.markZ));
    const im = irDown(); im.position.set(CAR14.markX, 0, CAR14.markZ - 10); still.add(im); live.leds.irM = im.userData.det;
  }
  if (kind === 'pid') { // (batch 24) the five-sensor bar under the nose: one black board, five TCRT5000 eyes looking down, a red LED each
    const y = CAR.plateY - 4; still.add(box(72, 1.6, 22, M.fr4, 0, y, CAR24.fiveZ - 4)); still.add(box(30, 3, 34, acr, 0, CAR.plateY + 1.5, CAR24.fiveZ - 24));
    CAR24.five.forEach((x, i) => { still.add(box(10, 6, 5.8, M.black, x, y - 3.8, CAR24.fiveZ)); const d = ledM(0xff2a1a); g.add(keep(box(1.6, 0.7, 0.9, d, x, y + 1.1, CAR24.fiveZ - 10))); live.leds['s' + (i + 1)] = d; });
  }
  if (kind === 'light') { // two LDR "eyes" on short posts at the front, one looking left, one right
    const ldrM = S({ color: 0xc23a28, roughness: 0.4 }), face = S({ color: 0xe8d070, roughness: 0.5 });
    for (const sd of [-1, 1]) { const e = new THREE.Group(); e.position.set(sd * CAR14.ldrX, top, CAR14.ldrZ); e.rotation.y = sd * CAR14.ldrA * Math.PI / 180;
      e.add(cyl(1.2, 16, N.copper, -1.5, 8, 0, 6)); e.add(cyl(1.2, 16, N.copper, 1.5, 8, 0, 6));
      const head = cyl(4.2, 2.2, ldrM, 0, 17, 0, 18); head.rotation.x = Math.PI / 2; head.position.set(0, 17, 1.5); e.add(head);
      const f = new THREE.Mesh(new THREE.CircleGeometry(3.4, 18), face); f.position.set(0, 17, 2.7); e.add(f); still.add(e); }
  }
  if (kind === 'wallp') { // (batch 24) the wall follower: an HC-SR04 at the nose looking ahead, one at the right front corner looking right
    still.add(box(22, 16, 3, acr, 0, top + 8, CARG.usZ - 4)); const fr = buildUSHead(); fr.position.set(0, top + 26, CARG.usZ); still.add(fr);
    still.add(box(3, 8, 30, acr, -(CAR18.usLX - 3), top + 4, 100)); const rt = buildUSHead(); rt.rotation.y = -Math.PI / 2; rt.position.set(-CAR18.usLX, top + 14, 100); still.add(rt);
  }
  if (kind === 'maze' || kind === 'mazeR') { // batch 18: an HC-SR04 at the nose looking ahead, one on the left edge looking left (19: or the right), an IR under the nose
    const sd = kind === 'mazeR' ? -1 : 1;
    still.add(box(22, 16, 3, acr, 0, top + 8, CARG.usZ - 4)); const fr = buildUSHead(); fr.position.set(0, top + 26, CARG.usZ); still.add(fr); // on an acrylic bracket, over the breadboard
    still.add(box(3, 8, 30, acr, sd * (CAR18.usLX - 3), top + 4, CAR18.usLZ)); const lf = buildUSHead(); lf.rotation.y = sd * Math.PI / 2; lf.position.set(sd * CAR18.usLX, top + 14, CAR18.usLZ); still.add(lf);
    const ir = irDown(); ir.position.set(0, 0, CAR18.finZ - 10); still.add(ir); live.leds.irM = ir.userData.det;
  }
  if (kind === 'dance') { // a little flag on a mast: the dancer's ribbon
    still.add(cyl(1.4, 120, N.alu, -40, top + 60, 20, 8));
    const fl = new THREE.Mesh(new THREE.PlaneGeometry(46, 30), S({ color: 0xd0408a, roughness: 0.6, side: THREE.DoubleSide })); fl.position.set(-40 + 23, top + 104, 20); still.add(fl);
  }
  live.leds.pwr = drv.userData.leds.pwr;
  // wheels (they turn)
  for (const s of [-1, 1]) { const w = keep(buildWheel(), 'wheel'); w.position.set(s * CAR.track / 2, 32.5, 0); g.add(w); live.motors.push(w); }
  shadows(g, false, false);
  const keepLeds = []; still.traverse((o) => { if (o.isMesh && o.material && o.material.emissive && Object.values(live.leds).includes(o.material)) keepLeds.push(o); });
  for (const o of keepLeds) o.userData.keep = true;
  mergeStatic(still);
  // a soft shadow under the car
  const blob = new THREE.Mesh(new THREE.PlaneGeometry(260, 300), new THREE.MeshBasicMaterial({ map: TX.radialTexture('rgba(0,0,0,0.55)', 'rgba(0,0,0,0)'), transparent: true, depthWrite: false, opacity: 0.55, color: 0x000000 }));
  blob.rotation.x = -Math.PI / 2; blob.position.set(0, 0.6, 50); blob.renderOrder = -1; g.add(blob);
  g.userData.live = live; void parts;
  return g;
}
function irDown() { // an IR module mounted under the plate's front edge, its LEDs pointing at the floor
  const M = mats(); const g = new THREE.Group(); const y = CAR.plateY - 4;
  const pcb = board(14, 32, '#1b1d22', (c) => { c.fillStyle = '#eee'; c.font = `700 1.6px ${TX.FONT}`; c.textAlign = 'center'; c.fillText('IR', 7, 14); }, 'irdown');
  g.add(box(14, 1.6, 32, [M.fr4, M.fr4, M.fr4, sharedMat('irdown', () => S({ map: pcb, roughness: 0.45 })), M.fr4, M.fr4], 0, y, 0));
  g.add(box(6.5, 4.6, 6.8, M.potBlue, 0, y - 3.1, -6));
  for (const s of [-1, 1]) g.add(cyl(2.5, 6, s < 0 ? N.glass : M.blackGloss, s * 3.2, y - 4.6, 12, 16));
  const det = ledM(0x33ff55); g.add(keep(box(1.6, 0.7, 0.8, det, 3.5, y - 1.1, 2)));
  g.add(box(4, 12, 4, N.nylon, 0, y + 6.6, -10)); g.userData.det = det; return g;
}
function unoLite() { // the Uno on the car: a board, its headers, the USB and jack (a light copy: few draw calls)
  const M = mats(); const g = new THREE.Group();
  const pm = sharedMat('unolite', () => { const T = TX.unoTextures(); return S({ map: T.map, roughness: 0.55 }); });
  const b = box(68.6, 1.6, 53.3, [M.fr4, M.fr4, pm, M.fr4, M.fr4, M.fr4], 0, 5.8, 0); b.rotation.y = -Math.PI / 2; g.add(b);
  for (const s of [-1, 1]) g.add(box(2.54, 8.5, 48, M.black, s * 24.1, 6.6 + 4.25, -2));
  g.add(box(12, 10.9, 16, M.steel, -10, 6.6 + 5.4, -33)); g.add(box(9, 11, 14, M.black, 12, 6.6 + 5.5, -31)); g.add(box(9.6, 3.4, 35, M.epoxy, 10, 6.6 + 4.2, 12));
  for (const [x, z] of [[-20, -26], [20, -26], [-20, 26], [20, 26]]) g.add(cyl(1.6, 5, M.gold, x, 2.5, z, 8));
  return g;
}
function miniBreadboard() { const M = mats(); const g = new THREE.Group(); g.add(box(47, 8.5, 35, M.ivory, 0, 4.25, 0)); for (let i = 0; i < 2; i++) g.add(box(40, 0.2, 13, M.darkIn, 0, 8.55, i ? 7.5 : -7.5)); return g; }

// ------------------------------------------------------------------ the arena: a classroom floor, the line track, walls
export const ARENA = { w: 1600, d: 1100, mat: [1300, 860], wallH: 140 };
function tileTexture() {
  const C = document.createElement('canvas'); const n = LITE ? 256 : 512; C.width = C.height = n; const c = C.getContext('2d');
  c.fillStyle = '#b9b1a3'; c.fillRect(0, 0, n, n);
  for (let i = 0; i < n * 6; i++) { const v = 150 + Math.random() * 60; c.fillStyle = `rgba(${v},${v - 8},${v - 20},0.18)`; c.fillRect(Math.random() * n, Math.random() * n, 2 + Math.random() * 6, 1 + Math.random() * 2); }
  c.fillStyle = 'rgba(60,55,48,0.55)'; c.fillRect(0, 0, n, 2); c.fillRect(0, 0, 2, n);
  const t = new THREE.CanvasTexture(C); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; return t;
}
// track: the centre line of the black tape, a closed loop of points in arena mm (x, z); drawn 19 mm wide
export function trackTexture(pts, opts = {}) {
  const [mw, md] = ARENA.mat; const s = LITE ? 0.8 : 1.4; const C = document.createElement('canvas'); C.width = Math.round(mw * s); C.height = Math.round(md * s); const c = C.getContext('2d');
  c.fillStyle = '#f4f3ee'; c.fillRect(0, 0, C.width, C.height);
  for (let i = 0; i < 1800; i++) { c.fillStyle = `rgba(120,115,100,${Math.random() * 0.05})`; c.fillRect(Math.random() * C.width, Math.random() * C.height, 2, 2); }
  const X = (x) => (x + mw / 2) * s, Y = (z) => (z + md / 2) * s;
  if (pts) { c.strokeStyle = '#151515'; c.lineWidth = 19 * s; c.lineJoin = 'round'; c.beginPath(); pts.forEach(([x, z], i) => (i ? c.lineTo(X(x), Y(z)) : c.moveTo(X(x), Y(z)))); c.closePath(); c.stroke(); }
  if (opts.start) { const [x, z] = opts.start; c.fillStyle = 'rgba(40,160,80,0.9)'; c.fillRect(X(x) - 50 * s, Y(z) - 2 * s, 100 * s, 4 * s); c.font = `800 ${22 * s}px ${TX.FONT}`; c.textAlign = 'center'; c.fillText('START', X(x), Y(z) + 30 * s); }
  if (opts.park) { const [x, z, w, d] = opts.park; c.strokeStyle = '#e8a020'; c.lineWidth = 6 * s; c.strokeRect(X(x - w / 2), Y(z - d / 2), w * s, d * s); c.fillStyle = '#e8a020'; c.font = `800 ${64 * s}px ${TX.FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('P', X(x), Y(z)); }
  if (opts.stations) for (const [x, z, a, b, nm] of opts.stations) { c.fillStyle = '#121212'; c.fillRect(X(x - a / 2), Y(z - b / 2), a * s, b * s); c.fillStyle = 'rgba(30,90,170,0.85)'; c.font = `800 ${16 * s}px ${TX.FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle'; const ix = x > 300 ? x - 52 : x < -300 ? x + 52 : x, iz = Math.abs(x) > 300 ? z : z - 40; c.fillText('STATION ' + nm, X(ix), Y(iz)); c.textBaseline = 'alphabetic'; } // (batch 23: the delivery stations, named inside the track)
  if (opts.marker) { const [x, z, a, b] = opts.marker; c.fillStyle = '#121212'; c.fillRect(X(x - a / 2), Y(z - b / 2), a * s, b * s); c.fillStyle = 'rgba(20,20,20,0.75)'; c.font = `700 ${13 * s}px ${TX.FONT}`; c.textAlign = 'center'; c.fillText('LAP', X(x), Y(z - b / 2 - 8)); } // (batch 14: the lap marker)
  if (opts.dance) { // (batch 14: the dance mat: rings, a spot, the four directions)
    const [x, z, r] = opts.dance; c.lineWidth = 6 * s; c.strokeStyle = '#d0408a'; c.beginPath(); c.arc(X(x), Y(z), r * s, 0, Math.PI * 2); c.stroke();
    c.lineWidth = 3 * s; c.strokeStyle = '#3a6ad0'; c.beginPath(); c.arc(X(x), Y(z), r * 0.62 * s, 0, Math.PI * 2); c.stroke();
    c.fillStyle = '#f0b020'; c.beginPath(); c.arc(X(x), Y(z), 22 * s, 0, Math.PI * 2); c.fill();
    c.fillStyle = 'rgba(40,40,40,0.75)'; c.font = `800 ${30 * s}px ${TX.FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText('DANCE FLOOR', X(x), Y(z + r + 60)); for (const [dx, dz, t] of [[0, -1, '▲'], [0, 1, '▼'], [-1, 0, '◀'], [1, 0, '▶']]) c.fillText(t, X(x + dx * r * 0.8), Y(z + dz * r * 0.8));
  }
  c.fillStyle = 'rgba(30,30,30,0.5)'; c.font = `700 ${16 * s}px ${TX.FONT}`; c.textAlign = 'left'; c.textBaseline = 'alphabetic'; c.fillText(opts.dance ? 'DUET STEM · DANCE MAT 1300 × 860 mm' : 'DUET STEM · ROBOT TRACK 1300 × 860 mm · TAPE 19 mm', 20 * s, (md - 16) * s);
  const t = new THREE.CanvasTexture(C); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
// (batch 24) the sumo practice robot: a heavy red box on four wheels with a steel wedge at the front (it does not drive)
// (batch 24) a tennis ball, 65 mm: yellow-green felt and its white seam
export function buildBall() {
  const C = document.createElement('canvas'); C.width = 256; C.height = 128; const c = C.getContext('2d'); c.fillStyle = '#d4e33a'; c.fillRect(0, 0, 256, 128);
  for (let i = 0; i < 900; i++) { c.fillStyle = `rgba(${Math.random() < 0.5 ? '255,255,200' : '120,130,20'},0.18)`; c.fillRect(Math.random() * 256, Math.random() * 128, 2, 2); }
  c.strokeStyle = '#f6f6ee'; c.lineWidth = 5; c.beginPath(); for (let x = 0; x <= 256; x += 2) { const y = 64 + 34 * Math.sin(x / 256 * Math.PI * 4); x ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke();
  const t = new THREE.CanvasTexture(C); t.colorSpace = THREE.SRGBColorSpace; const m = new THREE.Mesh(new THREE.SphereGeometry(33, 28, 18), S({ map: t, roughness: 0.95 })); m.position.y = 33;
  const g = new THREE.Group(); g.add(m); g.userData.ball = m; // (the sphere rolls; its shadow stays on the floor)
  const sh = new THREE.Mesh(new THREE.CircleGeometry(30, 20), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.25, depthWrite: false })); sh.rotation.x = -Math.PI / 2; sh.position.y = 0.8; g.add(sh);
  return g;
}
export function buildSumoFoe() {
  const M = mats(); const g = new THREE.Group(); const red = S({ color: 0xc8281c, roughness: 0.5 }), steel = S({ color: 0xc9ced4, metalness: 0.8, roughness: 0.3 }), tyre = S({ color: 0x18181a, roughness: 0.8 });
  g.add(box(190, 70, 170, red, 0, 45, -10)); g.add(box(170, 6, 150, S({ color: 0x2a2b2e, roughness: 0.6 }), 0, 83, -10));
  const wedge = new THREE.Mesh(new THREE.BoxGeometry(196, 4, 50), steel); wedge.position.set(0, 14, 88); wedge.rotation.x = 0.42; g.add(wedge);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(cyl(22, 14, tyre, sx * 96, 22, sz * 55 - 10, 18).rotateZ(Math.PI / 2));
  const C = document.createElement('canvas'); C.width = 256; C.height = 96; const c = C.getContext('2d'); c.fillStyle = '#c8281c'; c.fillRect(0, 0, 256, 96); c.fillStyle = '#fff'; c.font = `800 44px ${TX.FONT}`; c.textAlign = 'center'; c.fillText('DUMMY', 128, 64);
  const t = new THREE.CanvasTexture(C); t.colorSpace = THREE.SRGBColorSpace; const lab = new THREE.Mesh(new THREE.PlaneGeometry(120, 45), S({ map: t, roughness: 0.6 })); lab.position.set(0, 50, 75.2); g.add(lab);
  mergeStatic(g); return g;
}
export function buildArena(opts) {
  if (opts.table) return buildDeskArena(opts.table);
  mats(); const g = new THREE.Group(); g.name = 'arena'; const A = ARENA; const [rw, rd] = opts.room || [A.w, A.d];
  const ft = tileTexture(); ft.repeat.set(rw * 1.8 / 600, rd * 1.8 / 600);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(rw * 1.8, rd * 1.8), Lm({ map: ft })); floor.rotation.x = -Math.PI / 2; floor.position.y = -0.5; g.add(floor);
  if (opts.maze) { const mat = new THREE.Mesh(new THREE.PlaneGeometry(rw, rd), Lm({ map: mazeTexture(rw, rd, opts) })); mat.rotation.x = -Math.PI / 2; mat.position.y = 0.2; g.add(mat); } // (batch 18)
  else if (!opts.plain) { const mat = new THREE.Mesh(new THREE.PlaneGeometry(A.mat[0], A.mat[1]), Lm({ map: trackTexture(opts.track, opts), color: 0xc4c2bc })); mat.rotation.x = -Math.PI / 2; mat.position.y = 0.2; g.add(mat); }
  if (opts.soccer) { // (batch 24) the pitch: green felt, white lines, the centre circle, a yellow goal at +x and a blue one at -x
    const C = document.createElement('canvas'); const k = 0.4; C.width = Math.round(rw * k); C.height = Math.round(rd * k); const c = C.getContext('2d');
    c.fillStyle = '#2f7d3a'; c.fillRect(0, 0, C.width, C.height); for (let i = 0; i < 10; i++) { c.fillStyle = i % 2 ? 'rgba(255,255,255,0.035)' : 'rgba(0,0,0,0.04)'; c.fillRect(i * C.width / 10, 0, C.width / 10, C.height); }
    c.strokeStyle = '#f4f4ef'; c.lineWidth = 20 * k; c.strokeRect(40 * k, 40 * k, (rw - 80) * k, (rd - 80) * k); c.beginPath(); c.moveTo(rw / 2 * k, 40 * k); c.lineTo(rw / 2 * k, (rd - 40) * k); c.stroke();
    c.beginPath(); c.arc(rw / 2 * k, rd / 2 * k, 240 * k, 0, 7); c.stroke(); c.fillStyle = '#f4f4ef'; c.beginPath(); c.arc(rw / 2 * k, rd / 2 * k, 14 * k, 0, 7); c.fill();
    for (const sx of [0, 1]) c.strokeRect(sx ? (rw - 40 - 300) * k : 40 * k, (rd / 2 - 350) * k, 300 * k, 700 * k);
    const t = new THREE.CanvasTexture(C); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; const f = new THREE.Mesh(new THREE.PlaneGeometry(rw, rd), Lm({ map: t })); f.rotation.x = -Math.PI / 2; f.position.y = 0.3; g.add(f);
    for (const [sx, col] of [[1, 0xf2c418], [-1, 0x2457c8]]) { const gm = Lm({ color: col }), net = new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.35, side: THREE.DoubleSide }); const x = sx * (rw / 2 - 60);
      for (const zz of [-1, 1]) g.add(box(120, 140, 12, gm, x, 70, zz * 231)); g.add(box(12, 140, 474, gm, sx * (rw / 2 - 6), 70, 0)); g.add(box(120, 10, 474, gm, x, 145, 0));
      const nt = new THREE.Mesh(new THREE.PlaneGeometry(450, 130), net); nt.position.set(sx * (rw / 2 - 14), 70, 0); nt.rotation.y = Math.PI / 2; g.add(nt);
      const fl = new THREE.Mesh(new THREE.PlaneGeometry(108, 450), Lm({ color: col })); fl.rotation.x = -Math.PI / 2; fl.position.set(x, 0.5, 0); g.add(fl); }
  }
  if (opts.ring) { // (batch 24) the sumo ring (dohyo): black, its white edge, the two brown start lines
    const R = opts.ring.r; const blk = new THREE.Mesh(new THREE.CircleGeometry(R, 96), Lm({ color: 0x141416 })); blk.rotation.x = -Math.PI / 2; blk.position.y = 0.4; g.add(blk);
    const wr = new THREE.Mesh(new THREE.RingGeometry(R - opts.ring.edge, R, 96), Lm({ color: 0xf2f2ee })); wr.rotation.x = -Math.PI / 2; wr.position.y = 0.6; g.add(wr);
    for (const z of [-250, 250]) { const ln = new THREE.Mesh(new THREE.PlaneGeometry(200, 20), Lm({ color: 0x8a5a2b })); ln.rotation.x = -Math.PI / 2; ln.position.set(0, 0.7, z); g.add(ln); }
    const sh = new THREE.Mesh(new THREE.RingGeometry(R, R + 30, 96), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.25, depthWrite: false })); sh.rotation.x = -Math.PI / 2; sh.position.y = 0.3; g.add(sh);
  }
  // plywood walls round the room, and boxes (obstacles)
  const ply = Lm(opts.maze ? { color: 0xd2b48a, emissive: 0x3a2c1c } : { color: 0xd2b48a }); const walls = new THREE.Group();
  for (const [x, z, w, d] of [[0, -rd / 2 - 6, rw + 24, 12], [0, rd / 2 + 6, rw + 24, 12], [-rw / 2 - 6, 0, 12, rd], [rw / 2 + 6, 0, 12, rd]]) walls.add(box(w, A.wallH, d, ply, x, A.wallH / 2, z));
  const pm = (c) => Lm({ color: c, emissive: 0x3a2c1c }); // (the faces away from the light are not black: plywood is pale)
  const ob = opts.maze ? [pm(0xc9a77a), pm(0xc9a77a), pm(0xe2c79c), ply, pm(0xd8b98c), pm(0xd8b98c)] : Lm({ map: cardTexture() }); // (batch 18: the maze's plywood, its cut top edge lighter)
  for (const o of opts.boxes || []) { if (o[6] === 'almirah') { g.add(buildAlmirah(o)); continue; } const b = box(o[2], o[4] || 160, o[3], ob, o[0], (o[4] || 160) / 2, o[1]); b.rotation.y = o[5] || 0; walls.add(b); }
  mergeStatic(walls); g.add(walls);
  return g;
}
// (batch 24) a steel almirah (the grey-green cupboard of Indian homes and staff rooms): two doors with a seam, a chrome
// handle and lock, a plinth; its doors face +z. o = [x, z, w, d, h]
function buildAlmirah(o) {
  const [x, z, w, d, h] = o; const g = new THREE.Group(); g.position.set(x, 0, z);
  const body = Lm({ color: 0x9fb0a6, emissive: 0x2e3631 }), dark = Lm({ color: 0x3d4440 }), door = Lm({ color: 0xaab9b0, emissive: 0x323a35 }), chrome = S({ color: 0xd8dade, metalness: 1, roughness: 0.25 });
  g.add(box(w, 60, d - 20, dark, 0, 30, -10)); g.add(box(w, h - 60, d, body, 0, 60 + (h - 60) / 2, 0)); g.add(box(w + 10, 14, d + 10, body, 0, h - 7, 0));
  for (const sx of [-1, 1]) g.add(box(w / 2 - 14, h - 110, 4, door, sx * (w / 4), 60 + (h - 60) / 2, d / 2 + 2));
  g.add(box(4, h - 110, 3, dark, 0, 60 + (h - 60) / 2, d / 2 + 3.5));
  g.add(box(10, 120, 14, chrome, 24, 60 + (h - 60) * 0.52, d / 2 + 9)); g.add(cyl(9, 6, chrome, -26, 60 + (h - 60) * 0.55, d / 2 + 6, 16).rotateX(Math.PI / 2));
  for (const sy of [0.2, 0.8]) for (const sx of [-1, 1]) g.add(box(4, 50, 6, dark, sx * (w / 2 - 4), 60 + (h - 60) * sy, d / 2 + 3));
  mergeStatic(g); return g;
}
// batch 18: the maze's floor: a white flex sheet with the cells' faint lines, START with its arrow, and the black FINISH square
function mazeTexture(rw, rd, opts) {
  const s = LITE ? 0.45 : 0.8; const C = document.createElement('canvas'); C.width = Math.round(rw * s); C.height = Math.round(rd * s); const c = C.getContext('2d');
  c.fillStyle = '#f2f1ec'; c.fillRect(0, 0, C.width, C.height);
  for (let i = 0; i < 2600; i++) { c.fillStyle = `rgba(120,115,100,${Math.random() * 0.05})`; c.fillRect(Math.random() * C.width, Math.random() * C.height, 2, 2); }
  const X = (x) => (x + rw / 2) * s, Y = (z) => (z + rd / 2) * s;
  c.strokeStyle = 'rgba(70,110,170,0.22)'; c.lineWidth = 2; c.setLineDash([10, 10]);
  for (let i = 1; i < MAZE.cols; i++) { c.beginPath(); c.moveTo(X(-rw / 2 + i * MAZE.cell), 0); c.lineTo(X(-rw / 2 + i * MAZE.cell), C.height); c.stroke(); }
  for (let j = 1; j < MAZE.rows; j++) { c.beginPath(); c.moveTo(0, Y(-rd / 2 + j * MAZE.cell)); c.lineTo(C.width, Y(-rd / 2 + j * MAZE.cell)); c.stroke(); }
  c.setLineDash([]);
  const [sx, sz] = mazeXY(...MAZE.start); c.fillStyle = 'rgba(40,150,80,0.9)'; c.fillRect(X(sx - 120), Y(sz - 140), 240 * s, 6 * s);
  c.font = `800 ${46 * s}px ${TX.FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('START', X(sx), Y(sz - 178));
  c.beginPath(); c.moveTo(X(sx), Y(sz - 120)); c.lineTo(X(sx - 40), Y(sz - 60)); c.lineTo(X(sx + 40), Y(sz - 60)); c.closePath(); c.fill();
  if (opts.finish) { const [fx, fz, fw, fd] = opts.finish; c.fillStyle = '#111'; c.fillRect(X(fx - fw / 2), Y(fz - fd / 2), fw * s, fd * s); c.fillStyle = '#f4f4f0'; c.font = `800 ${50 * s}px ${TX.FONT}`; c.fillText('FINISH', X(fx), Y(fz)); }
  c.fillStyle = 'rgba(30,30,30,0.5)'; c.font = `700 ${22 * s}px ${TX.FONT}`; c.textAlign = 'left'; c.textBaseline = 'alphabetic';
  c.fillText(`DUET STEM · MAZE ${opts.maze} · ${MAZE.cols} × ${MAZE.rows} ROOMS OF ${MAZE.cell / 10} cm`, 24 * s, (rd - 20) * s);
  const t = new THREE.CanvasTexture(C); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
// batch 14: a school desk (its top at y = 0, 750 mm above the tiled floor) for the table robot
export const DESK_H = 750;
function buildDeskArena([w, d]) {
  const M = mats(); const g = new THREE.Group(); g.name = 'arena';
  const ft = tileTexture(); ft.repeat.set(4000 / 600, 3000 / 600);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(4000, 3000), Lm({ map: ft })); floor.rotation.x = -Math.PI / 2; floor.position.y = -DESK_H; g.add(floor);
  const C = document.createElement('canvas'); C.width = 512; C.height = 360; const c = C.getContext('2d'); // the laminate top: pale wood with grain
  c.fillStyle = '#d9b98a'; c.fillRect(0, 0, 512, 360); for (let i = 0; i < 140; i++) { c.strokeStyle = `rgba(${120 + Math.random() * 40},${80 + Math.random() * 30},40,${0.08 + Math.random() * 0.1})`; c.lineWidth = 1 + Math.random() * 2; c.beginPath(); const y = Math.random() * 360; c.moveTo(0, y); c.bezierCurveTo(170, y + Math.random() * 14 - 7, 340, y + Math.random() * 14 - 7, 512, y + Math.random() * 10 - 5); c.stroke(); }
  const tt = new THREE.CanvasTexture(C); tt.colorSpace = THREE.SRGBColorSpace; tt.anisotropy = 4;
  const desk = new THREE.Group(); const top = Lm({ map: tt }), edge = Lm({ color: 0x8a6440 }), steel = M.steel || Lm({ color: 0x777b80 });
  desk.add(box(w, 24, d, [edge, edge, top, edge, edge, edge], 0, -12, 0));
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) desk.add(box(36, DESK_H - 24, 36, steel, sx * (w / 2 - 40), -DESK_H / 2 - 12, sz * (d / 2 - 40)));
  desk.add(box(w - 80, 30, 20, steel, 0, -60, d / 2 - 40)); desk.add(box(w - 80, 30, 20, steel, 0, -60, -d / 2 + 40));
  mergeStatic(desk); g.add(desk);
  const sh = blobShadow(w * 1.1, d * 1.1, 0.35); sh.position.y = -DESK_H + 0.5; g.add(sh);
  return g;
}
// batch 14: a torch on a little stand, its bulb lit, and its pool of light on the floor (the light-seeking robot's target)
export function buildTorch() { // it shines along +z (the world turns it towards the room)
  const M = mats(); const g = new THREE.Group(); g.name = 'torch';
  g.add(cyl(34, 6, N.grey, 0, 3, 0, 24)); g.add(cyl(4, 92, M.steel, 0, 49, 0, 10)); g.add(new THREE.Mesh(new THREE.SphereGeometry(7, 12, 8), N.grey).translateY(96));
  const head = new THREE.Group(); head.position.set(0, 100, 0); head.rotation.x = 0.22; g.add(head); // tilted a little down at the floor
  const tubeM = cyl(13, 70, N.blackW, 0, 0, 0, 20); tubeM.rotation.x = Math.PI / 2; head.add(tubeM);
  const lens = new THREE.Mesh(new THREE.CylinderGeometry(19, 13, 22, 24), N.blackW); lens.rotation.x = Math.PI / 2; lens.position.z = 44; head.add(lens);
  const bulb = new THREE.Mesh(new THREE.CircleGeometry(17, 24), new THREE.MeshBasicMaterial({ color: 0xfff4c8, toneMapped: false })); bulb.position.z = 55.3; head.add(bulb);
  const pool = new THREE.Mesh(new THREE.PlaneGeometry(1100, 1100), new THREE.MeshBasicMaterial({ map: TX.radialTexture('rgba(255,236,170,0.9)', 'rgba(255,236,170,0)'), transparent: true, depthWrite: false, opacity: 0.6, toneMapped: false }));
  pool.rotation.x = -Math.PI / 2; pool.position.set(0, 0.8, 380); pool.renderOrder = -1; g.add(pool);
  shadows(g, false, false); return g;
}
// a soft round shadow under a robot that stands still (no shadow maps in the robot scenes)
export function blobShadow(w, d, a = 0.45) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshBasicMaterial({ map: TX.radialTexture('rgba(0,0,0,1)', 'rgba(0,0,0,0)'), transparent: true, depthWrite: false, opacity: a, color: 0x000000 }));
  m.rotation.x = -Math.PI / 2; m.renderOrder = -1; return m;
}
// a cable bundle (one draw call) from a list of points
export function cableBundle(paths, r = 2.2) { mats(); const g = new THREE.Group(); for (const pts of paths) g.add(tube(pts, r, N.sleeve, 30, 6)); mergeStatic(g); return g; }

// ------------------------------------------------------------------ parts of batch 2, for buildPart (models.js)
export function buildPart2(part) {
  const pr = part.props || {};
  switch (part.type) {
    case 'l298n': return buildL298N();
    case 'bomotor': return buildBOMotor(pr.side || 'L');
    case 'bat18650': return buildBattery18650();
    case 'hc05': return buildHC05();
    case 'joystick': return buildJoystick();
    case 'psu5': return buildPSU5();
    case 'mg996r': return pr.mount ? buildPlug(PLUG_SERVO()) : buildMG996R(true);
    case 'servo': return pr.mount ? buildPlug(PLUG_SERVO()) : null;
    case 'ir': return pr.mount ? buildPlug(PLUG_IR()) : null; // (batch 24: the sensor on a machine in the scene, its cable plugged in here)
    case 'hcsr04f': return buildPlug(PLUG_US());
  }
  return null;
}
