// DUET Robotics Lab 360, batch 3: the school-lab modules, modelled in code from their datasheet sizes (mm), our own work
// (no downloaded models, no brand artwork): 16×2 LCD with its I2C backpack, 0.96" OLED, 1-digit 7-segment, DHT11 module,
// soil moisture module, HC-SR501 PIR, KY-019 relay, VS1838B IR receiver, 4×4 membrane keypad, 28BYJ-48 + ULN2003,
// RC522 RFID reader, MQ-2 gas module, 4 × AA battery box, the pump's plug, the 230 V junction box.
// Same rules as models.js / models2.js: static pieces are merged by material; moving or glowing pieces are kept
// (userData.keep), and a part's model may carry userData.update(part, dt) -> true while it animates (view.js calls it: the hook batch 4 added).
import * as THREE from 'three';
import { materials, box, cyl, shadows } from './models.js';
import * as TX from './tex.js';
import { buildPlug } from './models2.js';
import { glyph } from './libs3.js';
import { KEYMAP } from './parts3.js';

const P = 2.54;
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
let LITE = false; export function setLite3(v) { LITE = v; }
const S = (o) => new THREE.MeshStandardMaterial(o);
const N = {}; // the extra shared materials of batch 3 (made once)
function mats() {
  const M = materials(); if (N.green) return M;
  Object.assign(N, {
    green: S({ color: 0x1d6b3a, roughness: 0.5 }), brass: S({ color: 0xd8b25a, metalness: 1, roughness: 0.35 }), nylon: S({ color: 0xe9e4d6, roughness: 0.6 }),
    termBlue: S({ color: 0x2f6fd0, roughness: 0.45 }), relayBlue: S({ color: 0x1f5fd8, roughness: 0.35 }), potBlue: S({ color: 0x2a5ad8, roughness: 0.4 }), potOrange: S({ color: 0xe88a1a, roughness: 0.45 }),
    dhtBlue: S({ color: 0x3a7ee0, roughness: 0.5 }), mesh: S({ color: 0xb8bcc2, metalness: 0.9, roughness: 0.45 }), bakelite: S({ color: 0x2a1c14, roughness: 0.6 }), ivory: S({ color: 0xf2efe6, roughness: 0.55 }),
    pvc: S({ color: 0xc8c9c4, roughness: 0.7 }), cable: S({ color: 0xeeeeea, roughness: 0.55 }), bezel: S({ color: 0x9da1a8, metalness: 0.8, roughness: 0.38 }), jst: S({ color: 0xf4f1e8, roughness: 0.5 }),
    redW: S({ color: 0xc8281c, roughness: 0.45 }), blackW: S({ color: 0x1b1b1d, roughness: 0.45 }), blueW: S({ color: 0x2457c8, roughness: 0.45 }), brownW: S({ color: 0x6a3f22, roughness: 0.45 }),
    pinkW: S({ color: 0xe86a9a, roughness: 0.45 }), yellowW: S({ color: 0xf0c018, roughness: 0.45 }), orangeW: S({ color: 0xf08a14, roughness: 0.45 }), cell: S({ color: 0x1c1c1c, roughness: 0.35, metalness: 0.2 }),
    cellTop: S({ color: 0xc9a24a, metalness: 0.9, roughness: 0.3 }), boxBlack: S({ color: 0x18181a, roughness: 0.7 }), canMetal: S({ color: 0xc7cacf, metalness: 1, roughness: 0.3 }),
    lens: new THREE.MeshPhysicalMaterial({ color: 0xf6f4ee, roughness: 0.55, transmission: LITE ? 0 : 0.2, thickness: 1 }), irLens: S({ color: 0x141418, roughness: 0.2, metalness: 0.1 }),
    acrylic: new THREE.MeshPhysicalMaterial({ color: 0x1a1a1c, roughness: 0.15, clearcoat: LITE ? 0 : 0.6 }), segOff: S({ color: 0x4a4a48, roughness: 0.6 }), face: S({ color: 0x151515, roughness: 0.4 }),
  });
  for (const m of Object.values(N)) m.userData.shared = true;
  return M;
}
export { N as MAT3 };
const keep = (o, role) => { o.userData.keep = true; if (role) { o.userData.role = role; o.name = role; } return o; };
const tube = (pts, r, mat, seg = 24, rs = 6) => new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), seg, r, rs, false), mat);
const ledMat = (col) => S({ color: 0xf2efe0, emissive: col, emissiveIntensity: 0, roughness: 0.3 });
// a small module's printed board (canvas), drawn once per kind and shared by every copy
const TEXC = {};
// a material (or texture) made once and used by every part of its kind: never disposed with one part (models.js dispose())
const share = (m) => { m.userData.shared = true; for (const k of ['map', 'emissiveMap', 'roughnessMap', 'normalMap']) if (m[k]) m[k].userData.shared = true; return m; };
function pcbMat(key, w, h, color, draw) { if (TEXC[key]) return TEXC[key]; const t = TX.pcbTexture(w, h, draw, color); t.userData.shared = true; const m = S({ map: t, roughness: 0.45 }); m.userData.shared = true; TEXC[key] = m; return m; }
function silk(c, t, x, y, px = 1.6, w = 700, col = '#f2f2ee') { c.fillStyle = col; c.font = `${w} ${px}px ${TX.FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(t, x, y); }
function holes(c, pts, r = 1.6) { for (const [x, y] of pts) { c.fillStyle = '#d8c070'; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); c.fillStyle = '#141414'; c.beginPath(); c.arc(x, y, r * 0.62, 0, 7); c.fill(); } }
function pads(c, xs, y, s = 1.6) { c.fillStyle = '#d8c070'; for (const x of xs) c.fillRect(x - s / 2, y - s / 2, s, s); }
// a flat board: w along x, d along z, its top at y; the print faces up (u = x, v = z)
function slab(w, d, t, top, M, x, y, z) { return box(w, t, d, [M.fr4, M.fr4, top, M.fr4, M.fr4, M.fr4], x, y - t / 2, z); }
// male header pins lying flat (pointing +z, at the student) with their black strip
function pinsFlat(n, x0, z0, y, M, len = 8) { const g = new THREE.Group(); g.add(box(n * P, 2.5, 2.5, M.black, x0 + (n - 1) * P / 2, y, z0 - 2)); for (let i = 0; i < n; i++) g.add(box(0.64, 0.64, len, M.gold, x0 + i * P, y, z0 - len / 2 + 0.6)); return g; }
function chip(M, w, d, h, label) { const g = new THREE.Group(); const top = S({ map: TX.labelTexture([label], { w: 128, h: 64, size: 20 }), roughness: 0.6 }); g.add(box(w, h, d, [M.epoxy, M.epoxy, top, M.epoxy, M.epoxy, M.epoxy], 0, h / 2, 0)); return g; }
function trimpot(M, mat, x, y, z) { const g = new THREE.Group(); g.position.set(x, y, z); g.add(box(6.6, 4.6, 7, mat, 0, 2.3, 0)); g.add(cyl(1.6, 0.6, N.brass, 0, 4.9, 0.2, 12)); g.add(box(2.4, 0.3, 0.5, M.darkIn, 0, 5.25, 0.2)); return g; }
function ledSmd(col, x, y, z) { const m = ledMat(col); const b = keep(box(1.6, 0.7, 0.8, m, x, y + 0.35, z)); return { b, m }; }

// ------------------------------------------------------------------ the character LCD's and the OLED's pictures
function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function screenTex(C, nearest) { const t = new THREE.CanvasTexture(C); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; if (nearest) { t.magFilter = THREE.NearestFilter; t.generateMipmaps = false; t.minFilter = THREE.LinearFilter; } return t; }
function drawLCD(C, s) {
  const c = C.getContext('2d'), W = C.width, H = C.height; const pw = !!s.powered, bl = pw && s.bl;
  c.fillStyle = bl ? '#2453d6' : pw ? '#14275c' : '#0f1a36'; c.fillRect(0, 0, W, H);
  const mx = W * 0.025, my = H * 0.09; const cw = (W - 2 * mx) / 16, ch = (H - 2 * my) / 2; const d = Math.min(cw / 5.6, ch / 8.8); const g = d * 0.86;
  const con = s.contrast === undefined ? 0.55 : s.contrast; const offA = !pw ? 0 : 0.07 + Math.max(0, con - 0.75) * 2.6; const onA = !pw ? 0 : Math.max(0, Math.min(1, (con - 0.18) * 2.4));
  const ink = bl ? '238,246,255' : '170,190,235';
  for (let r = 0; r < 2; r++) for (let i = 0; i < 16; i++) {
    let cols = null; const code = s.initd && s.on && s.ddram ? s.ddram[r][(i + (s.shift || 0)) % 40] : null;
    if (!s.initd && pw && r === 0) cols = [0x7f, 0x7f, 0x7f, 0x7f, 0x7f].map(() => 0xff); // not set up yet: the first row shows boxes
    else if (code !== null && code < 8 && s.cg) { const rows = s.cg[code]; cols = [0, 1, 2, 3, 4].map((k) => rows.reduce((a, row, j) => a | (((row >> (4 - k)) & 1) << j), 0)); }
    else if (code !== null) cols = glyph(code);
    const curHere = s.initd && s.cur && s.cur[0] === (i + (s.shift || 0)) % 40 && s.cur[1] === r;
    const x0 = mx + i * cw + (cw - 5 * d) / 2, y0 = my + r * ch + (ch - 8 * d) / 2;
    for (let k = 0; k < 5; k++) for (let j = 0; j < 8; j++) {
      let on = cols ? (cols[k] >> j) & 1 : 0; if (curHere && ((s.showCur && j === 7) || (s.blinkCur && (performance.now() / 500 | 0) % 2))) on = 1;
      c.fillStyle = `rgba(${ink},${on ? onA : offA})`; c.fillRect(x0 + k * d, y0 + j * d, g, g);
    }
  }
}
function drawOLED(C, s) {
  const c = C.getContext('2d'), W = C.width, H = C.height; const img = c.createImageData(W, H), dd = img.data; const k = W / 128;
  const on = s.powered && s.on && s.fb; const inv = !!s.inv;
  for (let y = 0; y < 64; y++) for (let x = 0; x < 128; x++) {
    let v = on ? s.fb[y * 128 + x] : 0; if (on && inv) v = 1 - v; const lit = v ? 1 : 0;
    for (let a = 0; a < k; a++) for (let b = 0; b < k; b++) { const i = ((y * k + b) * W + x * k + a) * 4; const edge = k > 1 && (a === k - 1 || b === k - 1); dd[i] = lit ? (edge ? 170 : 236) : 6; dd[i + 1] = lit ? (edge ? 200 : 246) : 8; dd[i + 2] = lit ? (edge ? 230 : 255) : 12; dd[i + 3] = 255; }
  }
  c.putImageData(img, 0, 0);
}

// ------------------------------------------------------------------ 16×2 LCD with the I2C backpack (80 × 36 mm, display up, on four brass standoffs)
// the backpack's four header pins (GND, VCC, SDA, SCL) stick out of its left end at the origin, along z
export function buildLCD() {
  const M = mats(); const g = new THREE.Group(); const cx = 44, cz = 8; // LCD board centre
  for (const [x, z] of [[6.5, -7.5], [81.5, -7.5], [6.5, 23.5], [81.5, 23.5]]) g.add(cyl(2.4, 14, N.brass, x, 7, z, 6));
  const top = pcbMat('lcdpcb', 80, 36, '#1d6b3a', (c) => { holes(c, [[2.5, 2.5], [77.5, 2.5], [2.5, 33.5], [77.5, 33.5]], 1.5); pads(c, Array.from({ length: 16 }, (_, i) => 8 + i * P), 2.6, 1.5); c.fillStyle = '#f2f2ee'; ['1', '16'].forEach((t, i) => silk(c, t, 8 + i * 15 * P, 5.2, 1.3)); });
  g.add(slab(80, 36, 1.6, top, M, cx, 15.6, cz));
  g.add(box(71.2, 6.8, 24.2, N.bezel, cx, 15.6 + 3.4, cz + 1.2)); // the metal frame
  g.add(box(65.6, 0.4, 16.6, N.face, cx, 22.6, cz + 1.4)); // the dark glass border
  // the backpack underneath (components facing the mat), the 16-pin header up to the LCD
  const bp = pcbMat('lcdbp', 41.5, 19, '#16191e', (c) => { silk(c, 'GND', 3.4, 9.5 - 3.81, 1.2); silk(c, 'VCC', 3.4, 9.5 - 1.27, 1.2); silk(c, 'SDA', 3.4, 9.5 + 1.27, 1.2); silk(c, 'SCL', 3.4, 9.5 + 3.81, 1.2); silk(c, 'LCM1602 IIC', 22, 15.8, 1.6); silk(c, 'A0 A1 A2', 33, 3.2, 1.1); });
  g.add(box(41.5, 1.6, 19, [M.fr4, M.fr4, bp, bp, M.fr4, M.fr4], 4 + 41.5 / 2, 7, 1));
  g.add(box(16 * P, 6.2, 2.5, M.black, 8 + 7.5 * P, 10.9, -6.5));
  const pcf = chip(M, 10, 4, 1.6, 'PCF8574T'); pcf.rotation.x = Math.PI; pcf.position.set(28, 6.2, 3); g.add(pcf);
  const pot = trimpot(M, N.potBlue, 40, 2, 4); pot.rotation.x = Math.PI; pot.position.y = 6.2; g.add(pot);
  g.add(box(5, 2.5, 2.5, M.black, 14, 4.9, 6)); g.add(box(2.5, 3, 5, M.black, 14, 3.4, 6));
  // the I2C header (along z), its pins pointing −x
  g.add(box(2.5, 2.5, 4 * P, M.black, 3, 7, 1.5 * P)); for (let i = 0; i < 4; i++) g.add(box(9, 0.64, 0.64, M.gold, 3.3, 7, i * P));
  // the screen
  const C = canvas(LITE ? 320 : 512, LITE ? 80 : 128); const tex = screenTex(C, false);
  const sm = S({ map: tex, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.1, roughness: 0.3 });
  const scr = keep(new THREE.Mesh(new THREE.PlaneGeometry(64.4, 16.1), sm), 'screen'); scr.rotation.x = -Math.PI / 2; scr.position.set(cx, 22.83, cz + 1.4); g.add(scr);
  let last = '', lt = 0; drawLCD(C, {});
  g.userData.update = (p, dt) => {
    const s = p.state; const k = [s.ver, s.powered, s.bl, s.contrast, s.initd, s.on, s.showCur, s.blinkCur && (performance.now() / 500 | 0)].join();
    lt += dt; if (k === last || lt < 0.06) return false; last = k; lt = 0; drawLCD(C, s); tex.needsUpdate = true;
    sm.emissiveIntensity = s.powered && s.bl ? 1.05 : 0.12; return true;
  };
  shadows(g); return g;
}

// ------------------------------------------------------------------ 0.96" OLED (27.3 × 27.8 mm), lying flat on the breadboard by its four pins
export function buildOLED() {
  const M = mats(); const g = new THREE.Group(); const cx = 1.5 * P;
  for (let i = 0; i < 4; i++) g.add(box(0.64, 9.5, 0.64, M.gold, i * P, -1.6, 0));
  g.add(box(4 * P, 2.5, 2.5, M.black, cx, 1.25, 0));
  const top = pcbMat('oled', 27.3, 27.8, '#1a3fa0', (c) => { ['GND', 'VCC', 'SCL', 'SDA'].forEach((t, i) => silk(c, t, 13.65 + (i - 1.5) * P, 4.4, 1.05)); pads(c, [0, 1, 2, 3].map((i) => 13.65 + (i - 1.5) * P), 1.6, 1.4); holes(c, [[2, 2], [25.3, 2], [2, 25.8], [25.3, 25.8]], 1.0); });
  g.add(slab(27.3, 27.8, 1.2, top, M, cx, 3.7, 11.9));
  g.add(box(26.7, 1.4, 19.3, N.face, cx, 4.4, 14.4)); // the glass
  const C = canvas(256, 128); const tex = screenTex(C, true); const sm = S({ map: tex, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 1.3, roughness: 0.25 });
  const scr = keep(new THREE.Mesh(new THREE.PlaneGeometry(21.74, 10.87), sm), 'screen'); scr.rotation.x = -Math.PI / 2; scr.position.set(cx, 5.12, 13.2); g.add(scr);
  drawOLED(C, {}); let last = '', lt = 0;
  g.userData.update = (p, dt) => { const s = p.state; const k = [s.ver, s.powered, s.on, s.inv].join(); lt += dt; if (k === last || lt < 0.06) return false; last = k; lt = 0; drawOLED(C, s); tex.needsUpdate = true; return true; };
  shadows(g, true, false); return g;
}

// ------------------------------------------------------------------ 1-digit 7-segment (0.56", 12.6 × 19 mm), across the middle gap
const SEG = { A: [0, 7.1, 6.0, 1.5, 0], B: [3.3, 3.6, 1.5, 6.0, 0], C: [2.9, -3.6, 1.5, 6.0, 0], D: [-0.4, -7.1, 6.0, 1.5, 0], E: [-3.7, -3.6, 1.5, 6.0, 0], F: [-3.3, 3.6, 1.5, 6.0, 0], G: [-0.2, 0, 6.0, 1.5, 0] };
export function buildSeg7() {
  const M = mats(); const g = new THREE.Group(); const cx = 2 * P, cz = -3 * P;
  for (let i = 0; i < 5; i++) { g.add(box(0.5, 7, 0.5, M.tin, i * P, -2.5, 0)); g.add(box(0.5, 7, 0.5, M.tin, i * P, -2.5, -6 * P)); }
  g.add(box(12.6, 7.6, 19, M.black, cx, 4.3, cz)); g.add(box(12.2, 0.2, 18.6, N.face, cx, 8.2, cz));
  const segs = {};
  for (const [k, [x, y, w, h]] of Object.entries(SEG)) {
    const m = S({ color: 0x55534f, emissive: 0xff2a14, emissiveIntensity: 0, roughness: 0.5 });
    const mesh = keep(new THREE.Mesh(new THREE.PlaneGeometry(w, h), m)); mesh.rotation.x = -Math.PI / 2; mesh.rotation.z = (k === 'B' || k === 'C' || k === 'E' || k === 'F') ? 0.09 : 0; mesh.position.set(cx + x * 0.92, 8.32, cz - y * 1.05); g.add(mesh); segs[k] = m;
  }
  const dm = S({ color: 0x55534f, emissive: 0xff2a14, emissiveIntensity: 0, roughness: 0.5 }); const dot = keep(new THREE.Mesh(new THREE.CircleGeometry(0.85, 12), dm)); dot.rotation.x = -Math.PI / 2; dot.position.set(cx + 5.0, 8.32, cz + 7.4); g.add(dot); segs.DP = dm;
  g.userData.update = (p) => { const s = p.state.seg || {}; let a = false; for (const k in segs) { const v = p.state.burnt ? 0 : Math.min(4.5, Math.pow((s[k] || 0) / 0.01, 0.6) * 3); if (Math.abs(segs[k].emissiveIntensity - v) > 0.02) { segs[k].emissiveIntensity = v; segs[k].color.setHex(v > 0.1 ? 0xffb0a0 : p.state.burnt ? 0x2b1f17 : 0x55534f); a = true; } } return a; };
  shadows(g, true, false); return g;
}

// ------------------------------------------------------------------ DHT11 module (blue sensor on a 14 × 28 mm board), standing in the breadboard
export function buildDHT11() {
  const M = mats(); const g = new THREE.Group(); const cx = P, y0 = 2.6;
  for (let i = 0; i < 3; i++) g.add(box(0.64, 9, 0.64, M.gold, i * P, -1.6, 0));
  g.add(box(3 * P, 2.5, 2.5, M.black, cx, 1.25, 0));
  const pm = pcbMat('dht', 14, 28, '#1a1d22', (c) => { silk(c, 'S', 7 - P, 26.4, 1.4); silk(c, '+', 7, 26.4, 1.6); silk(c, '−', 7 + P, 26.4, 1.6); silk(c, 'DHT11', 7, 21.5, 1.6); });
  g.add(box(14, 28, 1.6, [M.fr4, M.fr4, M.fr4, M.fr4, pm, pm], cx, y0 + 14, -1.4));
  const front = TEXC.dhtF || (TEXC.dhtF = share((() => { const t = TX.pcbTexture(12, 15.5, (c) => { c.fillStyle = '#1b4fa8'; for (let r = 0; r < 6; r++) for (let k = 0; k < 4; k++) c.fillRect(1.6 + k * 2.4, 1.4 + r * 2.0, 1.3, 1.2); }, '#3a7ee0'); t.userData.shared = true; return S({ map: t, roughness: 0.5 }); })()));
  g.add(box(12, 15.5, 5.5, [N.dhtBlue, N.dhtBlue, N.dhtBlue, N.dhtBlue, front, N.dhtBlue], cx, y0 + 19.5, 1.4));
  for (let i = 0; i < 4; i++) g.add(box(0.5, 2, 0.5, M.tin, cx - 3.8 + i * P, y0 + 10.8, 1.4));
  const pwr = ledSmd(0xff2a1a, cx + 4.5, y0 + 6, -0.3); pwr.b.rotation.x = Math.PI / 2; g.add(pwr.b); g.add(box(1.6, 0.8, 0.5, M.smdR, cx - 4, y0 + 6, -0.4));
  g.userData.face = new THREE.Vector3(0, 0, 1);
  g.userData.update = (p) => { const v = p.state.powered ? 2 : 0; if (pwr.m.emissiveIntensity !== v) { pwr.m.emissiveIntensity = v; return true; } return false; };
  shadows(g, true, false); return g;
}

// ------------------------------------------------------------------ soil moisture module (FC-28 comparator board, 30 × 16 mm) on the mat; its fork is in the pot
export function buildSoil() {
  const M = mats(); const g = new THREE.Group(); const top = 4.6;
  g.add(pinsFlat(4, -1.5 * P, 0, 4.5, M));
  const pm = pcbMat('soil', 16, 30, '#b8201c', (c) => { ['VCC', 'GND', 'DO', 'AO'].forEach((t, i) => silk(c, t, 8 + (i - 1.5) * P, 26.6, 1.0)); silk(c, 'PWR', 3.4, 18, 1.0); silk(c, 'DO', 12.6, 18, 1.0); holes(c, [[2.2, 2.2], [13.8, 2.2]], 1.1); pads(c, [8 - P / 2, 8 + P / 2], 2.6, 1.4); });
  g.add(slab(16, 30, 1.6, pm, M, 0, top, -17));
  for (const [x, z] of [[-6, -30], [6, -30], [-6, -6], [6, -6]]) g.add(cyl(1.5, 3, N.nylon, x, 1.5, z, 8));
  const lm = chip(M, 5, 4, 1.5, 'LM393'); lm.position.set(0, top, -14); g.add(lm);
  g.add(trimpot(M, N.potBlue, 0, top, -24));
  for (const [x, z] of [[-4, -19], [4, -19], [-5, -8], [5, -8]]) g.add(box(1.6, 0.5, 0.8, M.smdR, x, top + 0.25, z));
  const pwr = ledSmd(0xff2a1a, -4.6, top, -12); const dol = ledSmd(0x33ff55, 4.6, top, -12); g.add(pwr.b, dol.b);
  // the probe's 2-pin socket at the far end and a short piece of its cable
  g.add(box(2 * P, 2.5, 6, M.black, 0, top + 1.6, -31)); g.add(tube([V3(-1, top + 1.6, -34), V3(-1, 3, -44), V3(4, 2, -58)], 0.9, N.redW, 10, 6)); g.add(tube([V3(1.5, top + 1.6, -34), V3(1.5, 3, -44), V3(6.5, 2, -58)], 0.9, N.blackW, 10, 6));
  g.userData.cableEnd = V3(5, 2, -58);
  g.userData.update = (p) => { const a = p.state.powered ? 2.2 : 0, b = p.state.wet ? 2.6 : 0; if (pwr.m.emissiveIntensity !== a || dol.m.emissiveIntensity !== b) { pwr.m.emissiveIntensity = a; dol.m.emissiveIntensity = b; return true; } return false; };
  shadows(g); return g;
}

// ------------------------------------------------------------------ HC-SR501 PIR (32 × 24 mm) on a small acrylic stand; its dome looks along −z
export function buildPIR() {
  const M = mats(); const g = new THREE.Group(); const zb = -9, ym = 19;
  g.add(box(34, 3, 22, N.acrylic, 0, 1.5, zb + 2)); g.add(box(34, 8, 3, N.acrylic, 0, 7, zb + 2)); // the stand
  const pm = pcbMat('pir', 32.3, 24.3, '#1d6b3a', (c) => { silk(c, 'HC-SR501', 16, 4.4, 1.6); silk(c, 'TIME', 6.4, 19.6, 1.1); silk(c, 'SENS', 25.9, 19.6, 1.1); silk(c, 'VCC  OUT  GND', 16, 21.4, 1.05); silk(c, 'L  H', 16, 8.6, 1.1); holes(c, [[2, 2], [30.3, 2], [2, 22.3], [30.3, 22.3]], 1.0); });
  const pcb = box(32.3, 24.3, 1.6, [M.fr4, M.fr4, M.fr4, M.fr4, pm, M.fr4], 0, ym, zb); g.add(pcb);
  // the dome (Fresnel lens: faceted), on the far face
  const dome = new THREE.Mesh(new THREE.SphereGeometry(11.5, LITE ? 12 : 18, LITE ? 6 : 9, 0, Math.PI * 2, 0, Math.PI / 2), N.lens); dome.rotation.x = -Math.PI / 2; dome.position.set(0, ym, zb - 0.8); dome.scale.set(1, 0.9, 1); g.add(dome);
  g.add(cyl(11.8, 1.4, N.lens, 0, ym, zb - 1.2, 24).rotateX(Math.PI / 2));
  // the near face: two orange knobs, the jumper, the three pins pointing at the student
  for (const x of [-9.6, 9.6]) { const k = trimpot(M, N.potOrange, x, 0, 0); k.rotation.x = Math.PI / 2; k.position.set(x, ym - 6, zb + 0.8); g.add(k); }
  g.add(box(2 * P, 2.5, 2.5, M.black, 0, ym + 4, zb + 2.1)); g.add(box(3 * P, 2.5, 2.5, M.black, 0, 9, zb + 2.1));
  for (let i = -1; i <= 1; i++) g.add(box(0.64, 0.64, 9, M.gold, i * P, 9, zb + 5.2));
  g.add(box(4, 1.6, 1.4, M.epoxy, 0, ym + 9, zb + 1.5));
  g.userData.face = new THREE.Vector3(0, 0, -1);
  shadows(g); return g;
}

// ------------------------------------------------------------------ KY-019 relay module (26 × 34 mm): pins at the student's end, screw terminals at the far end
export function buildRelay() {
  const M = mats(); const g = new THREE.Group(); const top = 4.6;
  g.add(pinsFlat(3, -P, 0, 4, M));
  const pm = pcbMat('relay', 26, 34, '#1d4aa8', (c) => { silk(c, 'S', 13 - P, 31.2, 1.4); silk(c, '+', 13, 31.2, 1.6); silk(c, '−', 13 + P, 31.2, 1.6); silk(c, 'NO  COM  NC', 13, 6.6, 1.25); silk(c, 'KY-019', 4.4, 26, 1.1); holes(c, [[2.2, 16], [23.8, 16]], 1.2); });
  g.add(slab(26, 34, 1.6, pm, M, 0, top, -18));
  for (const [x, z] of [[-11, -31], [11, -31], [-11, -5], [11, -5]]) g.add(cyl(1.5, 3, N.nylon, x, 1.5, z, 8));
  // the relay can, its label, the terminal block, transistor, diode, LED
  const lab = TEXC.relayL || (TEXC.relayL = share(S({ map: TX.labelSticker([['SRD-05VDC-SL-C', 30, 46], ['10A 250VAC  10A 125VAC', 18, 92], ['10A 30VDC  10A 28VDC', 18, 126]], '#1f5fd8', '#eef2ff', 256, 160), roughness: 0.4 })));
  g.add(box(19, 15.3, 15.5, [N.relayBlue, N.relayBlue, lab, N.relayBlue, N.relayBlue, N.relayBlue], 0, top + 7.65, -17));
  const tg = new THREE.Group(); tg.position.set(0, top, -30.5); tg.add(box(15.2, 10, 7.4, N.termBlue, 0, 5, 0));
  for (const x of [-5, 0, 5]) { tg.add(cyl(1.6, 0.6, M.steel, x, 10.2, 0.6, 12)); tg.add(box(0.4, 0.3, 2.6, M.darkIn, x, 10.5, 0.6)); tg.add(box(3.4, 3.4, 0.2, M.darkIn, x, 4.4, -3.8)); }
  g.add(tg);
  g.add(box(4.6, 3.6, 2.6, M.epoxy, 7, top + 1.8, -6.5)); g.add(box(4, 1.6, 1.8, M.epoxy, -6.5, top + 0.8, -6.5)); g.add(box(0.8, 1.6, 1.8, M.white, -8, top + 0.8, -6.5));
  const led = ledSmd(0xff2a1a, -7, top, -3.5); g.add(led.b);
  let lastClicks = 0;
  g.userData.update = (p) => { const s = p.state; const v = s.on ? 2.6 : 0; let a = false; if (led.m.emissiveIntensity !== v) { led.m.emissiveIntensity = v; a = true; } if (s.clicks !== lastClicks) { lastClicks = s.clicks; try { if (window.app && window.app.sound) window.app.sound.click(); } catch (e) { /* no sound */ } a = true; } return a; };
  shadows(g); return g;
}

// ------------------------------------------------------------------ VS1838B IR receiver (legs in the breadboard, its dome facing the student)
export function buildIRRX() {
  const M = mats(); const g = new THREE.Group(); const cx = P;
  for (let i = 0; i < 3; i++) g.add(box(0.5, 9, 0.5, M.tin, i * P, -2.5 + 2, 0));
  g.add(box(7, 9, 5.6, N.irLens, cx, 6.5 + 4.5, 0)); g.add(box(7.4, 1.2, 6, N.irLens, cx, 6.5, 0));
  const d = new THREE.Mesh(new THREE.SphereGeometry(2.6, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), N.irLens); d.rotation.x = Math.PI / 2; d.position.set(cx, 11.5, 2.8); g.add(d);
  g.userData.face = new THREE.Vector3(0, 0, 1);
  shadows(g, true, false); return g;
}

// ------------------------------------------------------------------ 4×4 membrane keypad (69 × 77 mm) flat on the mat; its 8-way plug at the origin
export function buildKeypad() {
  const M = mats(); const g = new THREE.Group(); const z0 = -24, kz = z0 - 77 / 2;
  g.add(box(8 * P, 2.6, 7, M.black, 0, 1.6, -3.5)); for (let i = 0; i < 8; i++) g.add(box(1.4, 1.4, 0.3, M.darkIn, (i - 3.5) * P, 1.6, 0.02));
  const rib = TEXC.kpRib || (TEXC.kpRib = share((() => { const C = canvas(128, 32); const c = C.getContext('2d'); c.fillStyle = '#d8d4c8'; c.fillRect(0, 0, 128, 32); c.fillStyle = '#9a9a96'; for (let i = 0; i < 8; i++) c.fillRect(6 + i * 15.5, 0, 6, 32); const t = new THREE.CanvasTexture(C); t.colorSpace = THREE.SRGBColorSpace; return S({ map: t, roughness: 0.4, transparent: true, opacity: 0.92 }); })()));
  const r = new THREE.Mesh(new THREE.PlaneGeometry(8 * P, 18), rib); r.rotation.x = -Math.PI / 2; r.position.set(0, 0.35, -15); g.add(r);
  const face = TEXC.kp || (TEXC.kp = share((() => {
    const s = LITE ? 8 : 12; const C = canvas(69 * s, 77 * s); const c = C.getContext('2d'); c.scale(s, s);
    c.fillStyle = '#16171a'; c.fillRect(0, 0, 69, 77);
    KEYMAP.forEach((row, ri) => row.forEach((k, ci) => {
      const x = 4.5 + ci * 16, y = 5 + ri * 17.5; const col = ci === 3 ? '#c8241c' : (k === '*' || k === '#') ? '#1f5fd8' : '#2c2e33';
      const gr = c.createLinearGradient(0, y, 0, y + 13); gr.addColorStop(0, col); gr.addColorStop(1, '#0e0e10'); c.fillStyle = gr; c.beginPath(); c.roundRect(x, y, 13, 13, 2.2); c.fill();
      c.strokeStyle = 'rgba(255,255,255,0.25)'; c.lineWidth = 0.3; c.stroke(); c.fillStyle = '#f4f4f0'; c.font = `700 7px ${TX.FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(k, x + 6.5, y + 6.9);
    }));
    const t = new THREE.CanvasTexture(C); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return S({ map: t, roughness: 0.38 });
  })()));
  g.add(box(69, 0.9, 77, [M.black, M.black, face, M.black, M.black, M.black], 0, 0.45, kz));
  // one invisible box over each key (a tap or a click presses it), and a highlight on the pressed one
  const hl = keep(new THREE.Mesh(new THREE.PlaneGeometry(13, 13), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false })));
  hl.rotation.x = -Math.PI / 2; g.add(hl);
  for (let ri = 0; ri < 4; ri++) for (let ci = 0; ci < 4; ci++) { const k = keep(box(14, 3, 15, new THREE.MeshBasicMaterial({ visible: false }), -34.5 + 4.5 + ci * 16 + 6.5, 1.5, z0 - 5 - ri * 17.5 - 6.5), 'key3:' + (ri * 4 + ci)); g.add(k); }
  let lastK = '';
  g.userData.update = (p) => { const keys = Object.keys(p.state.keys || {}); const k = keys.join(); if (k === lastK) return false; lastK = k; if (keys.length) { const i = +keys[0]; hl.position.set(-34.5 + 4.5 + (i % 4) * 16 + 6.5, 0.95, z0 - 5 - Math.floor(i / 4) * 17.5 - 6.5); hl.material.opacity = 0.35; } else hl.material.opacity = 0; return true; };
  shadows(g, false, true); return g;
}

// ------------------------------------------------------------------ 28BYJ-48 stepper and its ULN2003 board (35 × 32 mm)
export const STEPG = { motor: [110, -20], shaftOff: -8, shaftTop: 31 }; // the motor's centre (part frame) and its shaft (8 mm off-centre)
export function buildStepper() {
  const M = mats(); const g = new THREE.Group(); const top = 4.6, bx = 11.4, bz = -17;
  g.add(pinsFlat(4, 0, 0, 7, M)); g.add(pinsFlat(2, 5.5 * P, 0, 7, M));
  const pm = pcbMat('uln', 35, 32, '#1d6b3a', (c) => { ['IN1', 'IN2', 'IN3', 'IN4'].forEach((t, i) => silk(c, t, 6 + i * P, 29.6, 0.95)); silk(c, '−', 6 + 5.5 * P, 29.6, 1.4); silk(c, '+', 6 + 6.5 * P, 29.6, 1.4); silk(c, '5-12V', 6 + 6 * P, 26.8, 1.1); ['A', 'B', 'C', 'D'].forEach((t, i) => silk(c, t, 9 + i * 5, 8.2, 1.3)); silk(c, 'ULN2003', 17.5, 22.5, 1.2); holes(c, [[2.2, 2.2], [32.8, 2.2], [2.2, 29.8], [32.8, 29.8]], 1.3); });
  g.add(slab(35, 32, 1.6, pm, M, bx, top, bz));
  for (const [x, z] of [[-4, -31], [27, -31], [-4, -3], [27, -3]]) g.add(cyl(1.5, 3, N.nylon, x, 1.5, z, 8));
  const ic = chip(M, 19.4, 6.4, 3.3, 'ULN2003APG'); ic.position.set(bx, top, bz + 1); g.add(ic); for (let i = 0; i < 8; i++) for (const s of [-1, 1]) g.add(box(0.5, 1.2, 0.7, M.tin, bx - 8.9 + i * P, top + 0.6, bz + 1 + s * 3.6));
  g.add(box(13, 6, 6, N.jst, bx, top + 3, bz - 12)); for (let i = 0; i < 5; i++) g.add(box(1.2, 4.5, 1.2, M.darkIn, bx - 5 + i * 2.5, top + 3.6, bz - 12));
  g.add(cyl(3, 5, M.epoxy, bx + 12, top + 2.5, bz - 6, 16)); g.add(box(2 * P, 2.5, P, M.black, bx + 12, top + 1.25, bz + 8)); g.add(box(4.8, 4, 2.4, M.black, bx + 12, top + 3, bz + 8));
  const leds = [0, 1, 2, 3].map((i) => { const m = ledMat(0xff2a1a); const b = keep(cyl(1.5, 2.6, m, 3.4 + i * 5 + 0.6, top + 1.3, bz - 8, 12)); g.add(b); return m; });
  // the motor: can Ø28 × 19, ears 42 mm apart, a blue back cap, the shaft 8 mm off-centre
  const [mx, mz] = STEPG.motor; const mo = new THREE.Group(); mo.position.set(mx, 0, mz); g.add(mo);
  mo.add(cyl(14, 19, N.canMetal, 0, 9.5, 0, 32)); mo.add(box(7, 0.8, 49, N.canMetal, 0, 19, 0)); for (const s of [-1, 1]) mo.add(cyl(3.5, 0.8, N.canMetal, 0, 19, s * 21, 16));
  mo.add(cyl(14.2, 1.2, N.relayBlue, 0, 0.6, 0, 32)); mo.add(box(16, 16, 6, N.relayBlue, 0, 8, 14.5)); mo.add(cyl(4.5, 1.5, N.canMetal, 0, 20, STEPG.shaftOff, 20));
  const shaft = keep(new THREE.Group(), 'shaft'); shaft.position.set(0, 20.6, STEPG.shaftOff); shaft.add(cyl(2.5, 10, M.brass || N.brass, 0, 5, 0, 12)); shaft.add(box(2.6, 6, 0.6, M.darkIn, 0, 7, 1.6));
  mo.add(shaft);
  const wires = [N.blueW, N.pinkW, N.yellowW, N.orangeW, N.redW];
  wires.forEach((m, i) => g.add(tube([V3(mx - 4 + i * 2, 8, mz + 17), V3(mx - 6 + i * 1.6, 3, mz + 26), V3(bx + 16, 2, bz + 6), V3(bx - 5 + i * 2.5, top + 5, bz - 15)].map((v, k) => (k === 2 ? V3(bx + 22, 3, bz - 26) : v)), 0.75, m, 16, 5)));
  g.userData.shaft = V3(mx, 30.6, mz + STEPG.shaftOff);
  g.userData.update = (p) => {
    const s = p.state; let a = false; (s.led || [0, 0, 0, 0]).forEach((v, i) => { const e = v * 3; if (Math.abs(leds[i].emissiveIntensity - e) > 0.02) { leds[i].emissiveIntensity = e; a = true; } });
    const r = -(s.angle || 0) * Math.PI / 180; if (Math.abs(shaft.rotation.y - r) > 1e-4) { shaft.rotation.y = r; a = true; } return a;
  };
  shadows(g); return g;
}

// ------------------------------------------------------------------ RC522 RFID reader (40 × 60 mm), flat on the mat; its pins at the origin
export function buildRFID() {
  const M = mats(); const g = new THREE.Group(); const top = 4.6;
  g.add(pinsFlat(8, -3.5 * P, 0, 4.5, M));
  const pm = pcbMat('rfid', 40, 60, '#1d4aa8', (c) => {
    c.strokeStyle = '#c8a35a'; c.lineWidth = 0.55; for (let k = 0; k < 4; k++) { const m = 3 + k * 1.3; c.beginPath(); c.roundRect(m, m, 40 - 2 * m, 36 - 2 * m, 2); c.stroke(); } // the antenna coil
    ['SDA', 'SCK', 'MOSI', 'MISO', 'IRQ', 'GND', 'RST', '3.3V'].forEach((t, i) => { c.save(); c.translate(20 + (i - 3.5) * P, 54.6); c.rotate(-Math.PI / 2); silk(c, t, 0, 0, 0.95); c.restore(); });
    silk(c, 'RFID-RC522', 20, 46, 1.7); holes(c, [[3.2, 3.2], [36.8, 3.2], [7, 44], [33, 44]], 1.4);
  });
  g.add(slab(40, 60, 1.6, pm, M, 0, top, -31));
  for (const [x, z] of [[-16.8, -58], [16.8, -58], [-13, -17], [13, -17]]) g.add(cyl(1.5, 3, N.nylon, x, 1.5, z, 8));
  const ic = chip(M, 5, 5, 0.9, 'RC522'); ic.position.set(-5, top, -20); g.add(ic);
  const xt = new THREE.Mesh(new THREE.CapsuleGeometry(1.8, 6, 4, 10), N.canMetal); xt.rotation.z = Math.PI / 2; xt.scale.set(1, 1, 0.6); xt.position.set(8, top + 1.4, -21); g.add(xt);
  for (const [x, z] of [[-12, -12], [-9, -12], [-6, -12], [2, -13], [5, -13], [12, -15], [-14, -22], [-12, -26]]) g.add(box(1.6, 0.5, 0.8, M.smdR, x, top + 0.25, z));
  const led = ledSmd(0xff2a1a, 14, top, -9); g.add(led.b);
  g.userData.reader = V3(0, top + 1, -38); // where a card is held
  g.userData.update = (p) => { const v = p.state.powered && !p.state.over ? 2.2 : 0; if (led.m.emissiveIntensity !== v) { led.m.emissiveIntensity = v; return true; } return false; };
  shadows(g); return g;
}

// ------------------------------------------------------------------ MQ-2 gas module (22 × 32 mm): the steel-mesh sensor on top
export function buildMQ2() {
  const M = mats(); const g = new THREE.Group(); const top = 4.6;
  g.add(pinsFlat(4, -1.5 * P, 0, 4.5, M));
  const pm = pcbMat('mq2', 22, 32, '#1d4aa8', (c) => { ['VCC', 'GND', 'DO', 'AO'].forEach((t, i) => silk(c, t, 11 + (i - 1.5) * P, 29.2, 1.0)); silk(c, 'MQ-2', 4, 6, 1.3); silk(c, 'PWR', 4.4, 22.4, 1.0); silk(c, 'DO', 17.8, 22.4, 1.0); holes(c, [[2.2, 2.2], [19.8, 2.2]], 1.1); });
  g.add(slab(22, 32, 1.6, pm, M, 0, top, -17));
  for (const [x, z] of [[-9, -31], [9, -31], [-9, -4], [9, -4]]) g.add(cyl(1.5, 3, N.nylon, x, 1.5, z, 8));
  g.add(cyl(9.8, 4, N.bakelite, 0, top + 2, -13, 28)); g.add(cyl(9.6, 0.8, M.steel, 0, top + 4.4, -13, 28));
  const meshMat = TEXC.mqMesh || (TEXC.mqMesh = share(S({ map: TX.meshTexture(), color: 0xd8dade, metalness: 0.8, roughness: 0.45 })));
  g.add(cyl(9.2, 10, meshMat, 0, top + 9.8, -13, LITE ? 18 : 28)); g.add(cyl(9.2, 0.6, meshMat, 0, top + 15, -13, LITE ? 18 : 28));
  const lm = chip(M, 5, 4, 1.5, 'LM393'); lm.position.set(6, top, -26.5); g.add(lm); g.add(trimpot(M, N.potBlue, -5, top, -27));
  const pwr = ledSmd(0xff2a1a, -6.6, top, -4.6), dol = ledSmd(0x33ff55, 6.6, top, -4.6); g.add(pwr.b, dol.b);
  g.userData.update = (p) => { const a = p.state.powered ? 2.2 : 0, b = p.state.gas ? 2.6 : 0; if (pwr.m.emissiveIntensity !== a || dol.m.emissiveIntensity !== b) { pwr.m.emissiveIntensity = a; dol.m.emissiveIntensity = b; return true; } return false; };
  shadows(g); return g;
}

// ------------------------------------------------------------------ 4 × AA battery box (6 V); its red and black wires end in a plug at the origin
export function buildAA4() {
  const M = mats(); const g = new THREE.Group();
  g.add(box(2 * P + P, 2.6, 13, M.black, P, 1.5, -6.5)); for (const x of [0, 2 * P]) g.add(box(1.4, 1.4, 0.3, M.darkIn, x, 1.5, 0.02));
  g.add(tube([V3(0, 1.5, -13), V3(-2, 3, -26), V3(-6, 6, -40)], 0.8, N.redW, 10, 6)); g.add(tube([V3(2 * P, 1.5, -13), V3(4, 3, -26), V3(2, 6, -40)], 0.8, N.blackW, 10, 6));
  const b = new THREE.Group(); b.position.set(-2, 0, -72); g.add(b);
  b.add(box(62, 3, 58, N.boxBlack, 0, 1.5, 0)); for (const s of [-1, 1]) b.add(box(62, 15, 2, N.boxBlack, 0, 7.5, s * 28)); for (const s of [-1, 1]) b.add(box(2, 15, 58, N.boxBlack, s * 30, 7.5, 0));
  const lab = TEXC.aaL || (TEXC.aaL = share(S({ map: TX.labelSticker([['1.5V AA', 44, 60], ['ALKALINE · LR6', 20, 110]], '#1d6b3a', '#f0e8c8', 256, 160), roughness: 0.4 })));
  for (let i = 0; i < 4; i++) { const z = (i - 1.5) * 14; const c = cyl(7, 50, i % 2 ? N.cell : lab, 0, 8.5, z, 20); c.rotation.z = Math.PI / 2; b.add(c); const tp = cyl(2.5, 1.4, N.cellTop, (i % 2 ? -1 : 1) * 25.6, 8.5, z, 12); tp.rotation.z = Math.PI / 2; b.add(tp); }
  shadows(g); return g;
}

// ------------------------------------------------------------------ the 230 V junction box (grey PVC, closed), its mains cable goes to the room
export function buildMainsBox(kind) {
  const M = mats(); const g = new THREE.Group();
  const tb = new THREE.Group(); tb.position.set(P, 0, -4); tb.add(box(11, 9, 7, N.ivory, 0, 4.5, 0)); for (const x of [-P, P]) { tb.add(cyl(1.6, 0.6, M.steel, x, 9.2, 0, 12)); tb.add(box(3.4, 3.4, 0.2, M.darkIn, x, 4, 3.6)); } g.add(tb);
  const bx = new THREE.Group(); bx.position.set(P, 0, -32); g.add(bx);
  bx.add(box(56, 26, 40, N.pvc, 0, 13, 0)); bx.add(box(57, 3, 41, N.pvc, 0, 26.5, 0));
  for (const [x, z] of [[-24, -16], [24, -16], [-24, 16], [24, 16]]) bx.add(cyl(1.6, 0.5, M.steel, x, 28.2, z, 10));
  const st = TEXC.mains || (TEXC.mains = share(S({ map: TX.labelSticker([['⚡ 230 V', 52, 62], ['DANGER · खतरा', 26, 116]], '#f2c418', '#141414', 256, 160), roughness: 0.5 })));
  const sm = new THREE.Mesh(new THREE.PlaneGeometry(30, 19), st); sm.rotation.x = -Math.PI / 2; sm.position.set(0, 28.1, 0); bx.add(sm);
  bx.add(cyl(3.6, 6, M.black, -31, 12, 0, 16).rotateZ(Math.PI / 2)); bx.add(tube([V3(-34, 12, 0), V3(-48, 10, 0), V3(-60, 4, 8)], 2.6, N.cable, 10, 8));
  // the two short wires from the box to its terminal block (brown live, the switched live)
  g.add(tube([V3(0, 6, -4), V3(0, 9, -12)], 0.8, N.brownW, 6, 6)); g.add(tube([V3(2 * P, 6, -4), V3(2 * P, 9, -12)], 0.8, N.brownW, 6, 6));
  g.userData.cableEnd = V3(P - 60, 4, -24); void kind;
  shadows(g); return g;
}

// ------------------------------------------------------------------ batch 3's parts, for buildPart (models.js)
export function buildPart3(part) {
  switch (part.type) {
    case 'lcd16': return buildLCD();
    case 'oled': return buildOLED();
    case 'seg7': return buildSeg7();
    case 'dht11': return buildDHT11();
    case 'soil': return buildSoil();
    case 'pir': return buildPIR();
    case 'relay': return buildRelay();
    case 'irrx': return buildIRRX();
    case 'keypad': return buildKeypad();
    case 'stepper': return buildStepper();
    case 'rfid': return buildRFID();
    case 'mq2': return buildMQ2();
    case 'aa4': return buildAA4();
    case 'pump': { const g = buildPlug(['#c8281c', '#1b1b1d']); return g; }
    case 'load230': return buildMainsBox(part.props && part.props.kind);
  }
  return null;
}
