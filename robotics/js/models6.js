// DUET Robotics Lab 360, batch 6: the Raspberry Pi boards in 3D, made in code from the official mechanical drawings (our
// own work: no downloaded models, no logos or brand artwork). Units mm; a board is built round its own centre, on the mat.
//   Pico 51 × 21 × 1 mm: RP2040 (7 × 7 mm QFN-56), 2 MB flash, 12 MHz crystal, micro-USB, BOOTSEL, the green LED on GP25,
//     castellated pins on 2.54 mm (rows 17.78 mm apart), 2.1 mm holes 2 mm from the ends, its USB cable to the computer
//   Pi 4 Model B 85 × 56 mm: BCM2711 under its lid, LPDDR4, the 40-pin header J8 (pin 1 square, near the corner hole),
//     2 × USB 3 (blue) + 2 × USB 2, Gigabit Ethernet, USB-C power, 2 × micro-HDMI, audio, camera / display connectors,
//     microSD, the PWR (red) and ACT (green) LEDs. Beside it: a GPIO pinout card on the mat (physical and GPIO numbers, row
//     by row next to the header) and, to its left, a small 5" HDMI screen that shows the Pi's terminal; its USB-C and HDMI cables.
//   abuzz: the active buzzer (12 mm, sealed top, + mark) · piLite: the Pi on the robot car (few draw calls)
// Static pieces are merged by material (a board is about 15–20 draw calls); the LEDs and the screen stay their own.
import * as THREE from 'three';
import { materials, mergeStatic, box, cyl, shadows } from './models.js';
import * as TX from './tex.js';
import { BB } from './boards.js';
import { BUILD4, pcbMesh, soic, smd, smdLed, ledMat, tact, malePins, pickGroup, usbMicro } from './models4.js';
import { CAR_BOARD } from './models2.js';
import { J8, PI4 } from './boards6.js';
import { drawFigure } from './pi20.js'; // (batch 20: matplotlib's window on the little screen)

let LITE = false; export function setLite6(v) { LITE = v; }
const P = 2.54;
const FONT = TX.FONT, MONO = '"DejaVu Sans Mono", "Noto Sans Mono", Consolas, monospace';
function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function tex(c, srgb = true) { const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.needsUpdate = true; return t; }
const S = (o) => new THREE.MeshStandardMaterial(o);
// the few materials of these boards (made once, shared: they merge, and are never disposed)
let MM = null;
function mats() {
  if (MM) return MM; const M = materials();
  MM = { M, ivory: S({ color: 0xe9e2cf, roughness: 0.55 }), latch: S({ color: 0x2a2421, roughness: 0.5 }), blueTongue: S({ color: 0x2f6fd8, roughness: 0.45 }), lid: S({ color: 0xb9bcc1, metalness: 0.9, roughness: 0.38 }),
    can: S({ color: 0xcfd2d6, metalness: 0.95, roughness: 0.3 }), cable: S({ color: 0x18191b, roughness: 0.6 }), brass: S({ color: 0xc9a85a, metalness: 1, roughness: 0.35 }), sd: S({ color: 0x2b2d31, roughness: 0.5 }),
    bezel: S({ color: 0x111214, roughness: 0.35 }), acrylic: S({ color: 0xcfe8f5, roughness: 0.15, transparent: true, opacity: 0.45, depthWrite: false }), green: S({ color: 0x1e6a3b, roughness: 0.55 }), ledG: S({ color: 0x33ff66, emissive: 0x22cc44, emissiveIntensity: 0.6 }), ledY: S({ color: 0xffb020, emissive: 0xff9a10, emissiveIntensity: 0.4 }) };
  for (const m of Object.values(MM)) if (m.isMaterial) m.userData.shared = true;
  return MM;
}
const label = (lines, o = {}) => S({ map: TX.labelTexture(lines, Object.assign({ w: 256, h: 256, size: 30 }, o)), roughness: o.bg ? 0.4 : 0.6, metalness: o.bg ? 0.6 : 0 });
const top6 = (m, mat) => [mat, mat, m, mat, mat, mat]; // a box with a printed top
function tube(pts, r, mat, seg = 32, rs = 8) { return new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), seg, r, rs, false), mat); }
const V = (x, y, z) => new THREE.Vector3(x, y, z);

// a board's printed side (as models4.js, at the resolution this board needs: at most 1024 px wide)
function pcbTex(W, H, mask, s, draw) {
  const w = Math.round(W * s), h = Math.round(H * s);
  const C = canvas(w, h), R = canvas(w, h); const c = C.getContext('2d'), r = R.getContext('2d');
  const X = (mm) => mm * s, Y = (mm) => (H - mm) * s;
  c.fillStyle = mask; c.fillRect(0, 0, w, h);
  const gr = c.createLinearGradient(0, 0, w, h); gr.addColorStop(0, 'rgba(255,255,255,0.05)'); gr.addColorStop(1, 'rgba(0,0,0,0.08)'); c.fillStyle = gr; c.fillRect(0, 0, w, h);
  r.fillStyle = 'rgb(0,105,0)'; r.fillRect(0, 0, w, h);
  const P2 = {
    s, X, Y, ctx: c,
    trace(pts, wd = 0.22) { c.strokeStyle = 'rgba(120,200,140,0.22)'; c.lineWidth = wd * s; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(X(x), Y(y)) : c.moveTo(X(x), Y(y)))); c.stroke(); },
    pad(x, y, ww, hh, round) { c.fillStyle = '#d9b866'; r.fillStyle = 'rgb(0,60,255)'; for (const ctx of [c, r]) { ctx.beginPath(); if (round) ctx.arc(X(x), Y(y), ww * s, 0, 7); else ctx.rect(X(x - ww / 2), Y(y + hh / 2), ww * s, hh * s); ctx.fill(); } },
    ring(x, y, ro, ri, square) { if (square) this.pad(x, y, ro * 2, ro * 2); else this.pad(x, y, ro, 0, true); c.fillStyle = '#101010'; c.beginPath(); c.arc(X(x), Y(y), ri * s, 0, 7); c.fill(); },
    silk(txt, x, y, px, o = {}) { c.save(); c.translate(X(x), Y(y)); if (o.rot) c.rotate(o.rot); c.font = `${o.w || 700} ${px * s}px ${o.mono ? MONO : FONT}`; c.fillStyle = o.col || '#f2f2ec'; c.textAlign = o.align || 'center'; c.textBaseline = 'middle'; c.fillText(txt, 0, 0); c.restore(); },
    rect(x, y, ww, hh, lw = 0.16) { c.strokeStyle = '#f2f2ec'; c.lineWidth = lw * s; c.strokeRect(X(x), Y(y + hh), ww * s, hh * s); },
    fill(x, y, ww, hh, col) { c.fillStyle = col; c.fillRect(X(x), Y(y + hh), ww * s, hh * s); },
  };
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647; // (the same board every time)
  for (let i = 0; i < Math.round(W * H / 90); i++) { const x = 3 + rnd() * (W - 6), y = 3 + rnd() * (H - 6); P2.trace([[x, y], [x + (rnd() - 0.5) * 14, y], [x + (rnd() - 0.5) * 14, y + (rnd() - 0.5) * 9]]); }
  for (let i = 0; i < Math.round(W * H / 130); i++) { const x = 2 + rnd() * (W - 4), y = 2 + rnd() * (H - 4); P2.pad(x, y, 0.28, 0, true); c.fillStyle = '#121212'; c.beginPath(); c.arc(X(x), Y(y), 0.12 * s, 0, 7); c.fill(); }
  draw(P2, rnd);
  return { map: tex(C), rough: tex(R, false) };
}
const roundRect = (W, H, r) => { const o = []; for (const [cx, cy, a0] of [[W - r, r, -Math.PI / 2], [W - r, H - r, 0], [r, H - r, Math.PI / 2], [r, r, Math.PI]]) for (let i = 0; i <= 4; i++) { const a = a0 + i / 4 * Math.PI / 2; o.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); } return o; };

// ------------------------------------------------------------------ Raspberry Pi Pico (in the breadboard, USB to the left)
export function buildPico(def) {
  const { M } = mats(); const g = new THREE.Group(); g.name = 'pico';
  const W = 51, H = 21, y = def.pcbY, top = y + def.pcbT; const parts = new THREE.Group(); g.add(parts);
  const bx = (q) => q.at[0] + W / 2, by = (q) => H / 2 - q.at[1]; // board mm: x from the USB end, y from the front edge (row h)
  const T = pcbTex(W, H, '#1b7a44', LITE ? 12 : 20, (p, rnd) => {
    for (const q of def.pins) { // castellated pads: the hole, and the half-hole cut in the edge
      const x = bx(q), yy = by(q), edge = yy > H / 2 ? H : 0; const gnd = q.label === 'GND';
      p.pad(x, (yy + edge) / 2, 1.5, Math.abs(edge - yy) + 0.4); p.ring(x, yy, 0.85, 0.52, gnd);
      p.silk(q.label.replace('ADC_VREF', 'VREF').replace('3V3_EN', '3V3EN'), x, yy > H / 2 ? yy - 2.75 : yy + 2.75, 0.62, { rot: -Math.PI / 2, w: 600 });
    }
    p.silk('PICO', 42.0, 13.4, 2.4, { w: 800 }); p.silk('RP2040 · DUET STEM', 41.6, 10.2, 0.8, { w: 600 });
    p.silk('BOOTSEL', 12.1, 16.9, 0.75); p.silk('LED', 7.2, 4.3, 0.75); p.silk('USB', 3.4, 15.0, 0.7);
    p.silk('DEBUG', 47.2, 10.5, 0.62, { rot: -Math.PI / 2 }); for (const yy of [8.0, 10.5, 13.0]) p.ring(49.6, yy, 0.7, 0.4);
    for (let i = 0; i < 6; i++) p.pad(20 + rnd() * 26, 3.5 + rnd() * 14, 0.45, 0, true); // test points
    p.rect(22.4, 6.4, 8.2, 8.2); // the RP2040's outline
  });
  g.add(pcbMesh(W, H, roundRect(W, H, 0.8), [[2, 4.8, 1.05], [2, 16.2, 1.05], [49, 4.8, 1.05], [49, 16.2, 1.05]], T, 0, 0, y, def.pcbT));
  malePins(parts, def.pins, y, BB.top);
  usbMicro(parts, -24.0, 0, top, -1);
  parts.add(box(7, 0.9, 7, top6(label(['RP2040', 'RP2-B2 24/12'], { size: 32, dot: [0.16, 0.16] }), M.epoxy), 1.0, top + 0.45, 0));
  soic(parts, 8, 4.4, 5.6, -6.6, 0.2, top, ['W25Q16JV', 'IQ 2412'], Math.PI / 2);
  parts.add(box(3.2, 0.8, 2.5, M.steel, 6.2, top + 0.4, -3.6)); // the 12 MHz crystal
  parts.add(box(3.0, 1.5, 3.0, M.epoxy, 12.0, top + 0.75, 5.0)); parts.add(box(2.2, 0.8, 2.2, M.epoxy, 8.0, top + 0.4, 5.5)); // the SMPS: inductor, chip
  tact(parts, -13.4, -3.2, top, 4.2, 3.2, 0xf4f2ea);
  for (const [x, z, r] of [[-17.6, 4.0, 0], [-10.0, 4.6, 1], [-3.0, -5.2, 0], [-2.6, 5.6, 1], [4.8, 3.2, 0], [9.6, -1.4, 1], [15.2, 4.8, 0], [21.6, 4.4, 1], [10.6, 1.8, 0], [-17.8, -4.2, 1]]) smd(parts, x, z, top, r, (x + z) % 3 > 1);
  const leds = { ON: ledMat(0), TX: ledMat(0), RX: ledMat(0) }; smdLed(g, leds, 'L', -21.2, 6.2, top, 0x2fff58);
  // the USB cable to the computer, off the bench to the left
  const k = mats(); parts.add(box(9.5, 6.4, 8.2, k.cable, -32.0, top + 1.45, 0)); parts.add(tube([V(-36.5, top + 1.45, 0), V(-48, top + 0.5, -4), V(-62, 3, -14), V(-80, 2, -26), V(-108, 2, -30)], 1.9, k.cable, 24, 8));
  shadows(parts); mergeStatic(parts); g.userData.leds = leds;
  g.add(pickGroup(def, top));
  return g;
}

// ------------------------------------------------------------------ Raspberry Pi 4 Model B (on the mat)
// The board is built in its drawing's own frame (x along the 85 mm side, y up the 56 mm side, header at the top) in a group
// turned a quarter, so the header faces the breadboard and pin 1 is at the back (boards6.js: bench x = y − 28, z = x − 42.5).
const HOLES4 = [[3.5, 3.5], [61.5, 3.5], [3.5, 52.5], [61.5, 52.5]];
function pi4Tex(s) {
  return pcbTex(85, 56, '#17683a', s, (p, rnd) => {
    for (let n = 1; n <= 40; n++) { const k = Math.floor((n - 1) / 2); p.ring(PI4.hdrX + k * P, n % 2 ? PI4.rowIn : PI4.rowOut, 0.85, 0.5, n === 1); }
    for (const [x, y] of HOLES4) p.ring(x, y, 3.1, 1.38);
    for (const [x, y] of [[60.3, 47.3], [62.9, 47.3], [60.3, 49.9], [62.9, 49.9]]) p.ring(x, y, 0.8, 0.45); // PoE
    p.silk('J8', PI4.hdrX - 3.6, 52.5, 1.3); p.silk('1', PI4.hdrX - 1.9, 49.6, 1.1); p.silk('GPIO', 32.5, 48.4, 1.2, { w: 600 }); p.silk('POE', 61.6, 44.6, 1.0);
    p.silk('4 MODEL B', 62.5, 15.2, 2.2, { w: 800 }); p.silk('DUET STEM', 63.4, 11.8, 1.15, { w: 600 });
    p.silk('POWER IN', 11.2, 9.4, 1.0); p.silk('HDMI0', 26.0, 9.0, 1.0); p.silk('HDMI1', 39.5, 9.0, 1.0); p.silk('A/V', 53.5, 14.4, 1.0); p.silk('CAMERA', 49.4, 11.5, 1.0, { rot: -Math.PI / 2 }); p.silk('DISPLAY', 7.0, 28.0, 1.0, { rot: -Math.PI / 2 });
    p.silk('PWR', 5.6, 10.4, 0.85, { align: 'left' }); p.silk('ACT', 5.6, 12.8, 0.85, { align: 'left' });
    for (let i = 0; i < 40; i++) p.pad(14 + rnd() * 56, 15 + rnd() * 26, 0.3, 0.3); // tiny passives' pads
    p.rect(20.5, 23.5, 17, 17);
  });
}
// the terminal on the little screen: a title bar and the last lines of what the Pi printed
function terminal(W, H) {
  const C = canvas(W, H), c = C.getContext('2d'); const t = tex(C); const fs = Math.round(H / 19);
  let last = null;
  const draw = (text, title, fig, figV) => {
    const key = text + '|' + title + '|' + (fig ? figV : ''); if (key === last) return false; last = key;
    c.fillStyle = '#0d0f12'; c.fillRect(0, 0, W, H); c.fillStyle = '#2a2d33'; c.fillRect(0, 0, W, fs * 1.6);
    c.fillStyle = '#c8ccd2'; c.font = `600 ${fs * 0.95}px ${FONT}`; c.textBaseline = 'middle'; c.textAlign = 'center'; c.fillText(title || 'pi@raspberrypi: ~', W / 2, fs * 0.82);
    for (const [i, col] of ['#ff5f57', '#febc2e', '#28c840'].entries()) { c.fillStyle = col; c.beginPath(); c.arc(fs * (0.9 + i * 1.1), fs * 0.8, fs * 0.33, 0, 7); c.fill(); }
    c.font = `500 ${fs}px ${MONO}`; c.textAlign = 'left'; c.textBaseline = 'alphabetic'; const cw = c.measureText('M').width; const cols = Math.max(10, Math.floor((W - fs) / cw));
    const rows = []; for (const ln of String(text || '').replace(/\r/g, '').split('\n')) { if (!ln.length) { rows.push(''); continue; } for (let i = 0; i < ln.length; i += cols) rows.push(ln.slice(i, i + cols)); }
    while (rows.length && rows[rows.length - 1] === '') rows.pop();
    const n = Math.floor((H - fs * 2.2) / (fs * 1.18)); const show = rows.slice(-n);
    show.forEach((ln, i) => {
      const yy = fs * 2.6 + i * fs * 1.18; const m = /^(pi@raspberrypi)(:~ \$)(.*)$/.exec(ln);
      if (m) { c.fillStyle = '#5fd35f'; c.fillText(m[1], fs * 0.5, yy); let x = fs * 0.5 + c.measureText(m[1]).width; c.fillStyle = '#6aa8ff'; c.fillText(m[2], x, yy); x += c.measureText(m[2]).width; c.fillStyle = '#e8e8e8'; c.fillText(m[3], x, yy); }
      else { c.fillStyle = /Traceback|Error|^\s+File /.test(ln) ? '#ff8a7a' : '#e6e6e6'; c.fillText(ln, fs * 0.5, yy); }
    });
    if (fig) { // batch 20: matplotlib's window over the terminal, as on the Pi's desktop
      const x0 = W * 0.08, y0 = fs * 2.0, w = W * 0.84, h = H - y0 - fs * 0.6; c.fillStyle = '#d8d8d8'; c.fillRect(x0, y0, w, fs * 1.5);
      c.fillStyle = '#222'; c.font = `700 ${fs * 0.9}px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('Figure ' + (fig.n || 1), x0 + w / 2, y0 + fs * 0.75);
      c.save(); c.translate(x0, y0 + fs * 1.5); drawFigure(c, fig, w, h - fs * 1.5, { font: FONT }); c.restore();
    }
    t.needsUpdate = true; return true;
  };
  draw('pi@raspberrypi:~ $ ', ''); return { tex: t, draw };
}
export function buildPi4(def) {
  const K = mats(), { M } = K; const g = new THREE.Group(); g.name = 'pi4';
  const y = def.pcbY, top = y + def.pcbT;
  const b = new THREE.Group(); b.rotation.y = -Math.PI / 2; g.add(b); // the drawing's frame: X = x − 42.5, Z = 28 − y
  const parts = new THREE.Group(); b.add(parts);
  const A = (x, yy) => [x - 42.5, 28 - yy];
  const put = (w, h, d, mat, x, yy, y0, grp = parts) => { const [X, Z] = A(x, yy); const m = box(w, h, d, mat, X, y0 + h / 2, Z); grp.add(m); return m; }; // w along the drawing's x, d along its y
  const T = pi4Tex(LITE ? 7 : 12);
  { const pcb = pcbMesh(85, 56, roundRect(85, 56, 3), HOLES4.map(([x, yy]) => [x, yy, 1.375]), T, 0, 0, y, def.pcbT); b.add(pcb); }
  for (const [x, yy] of HOLES4) { const [X, Z] = A(x, yy); parts.add(cyl(2.6, y, M.rubber, X, y / 2, Z, 16)); parts.add(cyl(2.3, 0.6, K.brass, X, top + 0.3, Z, 16)); }
  // the processor under its lid, the memory, the USB controller, the power chip, the WiFi module's shield
  put(15, 0.9, 15, K.green, 29, 32, top); put(12.6, 1.3, 12.6, top6(label(['BCM2711', 'ZPKFSB06B0T'], { bg: '#c3c6cb', ink: 'rgba(40,42,46,0.85)', size: 30 }), K.lid), 29, 32, top + 0.9);
  put(10, 1.0, 14.4, top6(label(['LPDDR4', '4GB 3200'], { size: 30 }), M.epoxy), 45.8, 32, top);
  put(7, 0.9, 7, top6(label(['VL805', 'USB 3.0'], { size: 34, dot: [0.15, 0.15] }), M.epoxy), 64, 24, top);
  put(5, 0.8, 5, M.epoxy, 19, 13.4, top); put(6, 0.8, 6, M.epoxy, 60.5, 39, top); put(12, 1.6, 11, K.can, 11.4, 41.6, top);
  // the 40-pin header: its black base and 40 gold pins (8.5 mm above the board), and the PoE pins
  put(50.8, 2.5, 5.08, M.black, 32.5, 52.5, top);
  for (let n = 1; n <= 40; n++) { const k = Math.floor((n - 1) / 2); put(0.64, 9.2, 0.64, M.gold, PI4.hdrX + k * P, n % 2 ? PI4.rowIn : PI4.rowOut, top - 0.7); }
  put(5.08, 2.5, 5.08, M.black, 61.6, 48.6, top); for (const [x, yy] of [[60.3, 47.3], [62.9, 47.3], [60.3, 49.9], [62.9, 49.9]]) put(0.64, 8.4, 0.64, M.gold, x, yy, top - 0.4);
  // USB: two stacks (USB 2 black, USB 3 blue), Ethernet, overhanging the right edge
  for (const [yy, tongue] of [[9, M.black], [27, K.blueTongue]]) {
    put(17.5, 16, 14.6, M.steel, 78.95, yy, top); for (const h of [4.0, 11.6]) { put(0.4, 5.8, 12.6, M.darkIn, 87.55, yy, top + h - 2.9); put(3.4, 1.9, 11.4, tongue, 86.0, yy, top + h - 1.6); }
  }
  put(21.3, 13.5, 15.9, M.steel, 76.35, 45.75, top); put(0.4, 7.4, 12.2, M.darkIn, 86.9, 45.75, top + 3.0); put(0.5, 1.4, 2.6, K.ledG, 87.0, 51.0, top + 11.0); put(0.5, 1.4, 2.6, K.ledY, 87.0, 40.5, top + 11.0);
  // the bottom edge: USB-C, two micro-HDMI, audio
  put(8.9, 3.2, 7.4, M.steel, 11.2, 2.7, top); put(7.0, 1.7, 0.3, M.darkIn, 11.2, -1.0, top + 0.75);
  for (const x of [26, 39.5]) { put(6.6, 3.0, 7.6, M.steel, x, 2.8, top); put(5.2, 1.3, 0.3, M.darkIn, x, -1.0, top + 0.85); }
  put(7, 6.0, 12.5, M.black, 53.5, 6.75, top); { const [X, Z] = A(53.5, -0.6); const j = cyl(3.0, 2.6, M.black, X, top + 3.0, Z, 20); j.rotation.x = Math.PI / 2; parts.add(j); const h = cyl(1.8, 0.3, M.darkIn, X, top + 3.0, Z + 1.35, 16); h.rotation.x = Math.PI / 2; parts.add(h); }
  // camera and display connectors (white bodies, dark latches), the microSD card underneath, sticking out at the left
  for (const [x, yy] of [[45.0, 11.5], [2.6, 28]]) { put(3.6, 5.0, 22.4, K.ivory, x, yy, top); put(3.9, 0.9, 22.6, K.latch, x, yy, top + 5.0); }
  put(14, 1.4, 12.4, M.steel, 7.5, 28, y - 1.4); put(15, 0.8, 11, K.sd, 4.5, 28, y - 1.15);
  for (let i = 0; i < 26; i++) { const x = 14 + ((i * 37) % 56), yy = 15 + ((i * 23) % 26); if (Math.abs(x - 29) < 9 && Math.abs(yy - 32) < 9) continue; const [X, Z] = A(x, yy); smd(parts, X, Z, top, i % 2, i % 3 === 0); }
  const leds = { TX: ledMat(0), RX: ledMat(0) }; { const [X, Z] = A(2.2, 10.4); smdLed(b, leds, 'ON', X, Z, top, 0xff2a10, 1); } { const [X, Z] = A(2.2, 12.8); smdLed(b, leds, 'L', X, Z, top, 0x2fff58, 1); }
  // the cables (in the bench's frame): USB-C power off the bench to the left, micro-HDMI round to the screen
  const out = new THREE.Group(); out.userData.extras6 = true; g.add(out); // (app6.js hides these in the board box)
  out.add(box(11, 6.2, 9.6, K.cable, -35.5, top + 1.6, -31.3)); out.add(tube([V(-41, top + 1.6, -31.3), V(-50, 4, -26), V(-60, 2, 2), V(-74, 2, 32), V(-140, 2, 58), V(-205, 2, 66)], 1.9, K.cable, 40)); // (to the front left: the board box of Free build stands behind)
  out.add(box(11, 5.0, 8.6, K.cable, -35.5, top + 1.5, -16.5)); out.add(tube([V(-41, top + 1.5, -16.5), V(-54, 3, -22), V(-72, 2, -38), V(-88, 6, -40), V(-94, 12, -35)], 1.7, K.cable, 32));
  // the GPIO card on the mat, row by row beside the header, and the 5" screen behind the board
  out.add(pinCard());
  const scr = screen5(); scr.position.set(-117, 0, -14); scr.rotation.y = 0.55; scr.userData.extras6 = true; g.add(scr); // (left of the board, turned to the student)
  shadows(parts); shadows(out, false, true); mergeStatic(parts); mergeStatic(out);
  g.userData.leds = leds; g.userData.screen = scr.userData.screen;
  g.add(pickGroup(def, top));
  return g;
}
// the GPIO card: 22 × 56 mm, lying on the mat between the header and the breadboard. Row k sits level with header row k:
// the odd pin (the inner row) on the left, the even pin (the board's edge) on the right, as they stand on the board
function pinCard() {
  const s = LITE ? 10 : 16, Wc = 22, Hc = 57; const z0 = PI4.hdrX - 42.5 - 4.4; // the card's back edge (bench z), above pin 1
  const C = canvas(Math.round(Wc * s), Math.round(Hc * s)), c = C.getContext('2d');
  c.fillStyle = '#f7f5ee'; c.fillRect(0, 0, C.width, C.height); c.strokeStyle = '#9a968a'; c.lineWidth = 2; c.strokeRect(1, 1, C.width - 2, C.height - 2);
  c.fillStyle = '#26303a'; c.font = `800 ${2.0 * s}px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('GPIO · J8', C.width / 2, 2.0 * s);
  const col = (v) => (v === '5V' ? '#d8342a' : v === '3V3' ? '#e8891c' : v === 'GND' ? '#2a2a2a' : v === 0 || v === 1 ? '#8c8c8c' : '#1f8a4c');
  for (let k = 0; k < 20; k++) {
    const yy = (4.4 + k * P) * s;
    for (const [n, side] of [[2 * k + 1, 0], [2 * k + 2, 1]]) {
      const v = J8[n]; const name = typeof v === 'number' ? 'GPIO' + v : v; const cx = side ? Wc * s - 2.0 * s : 2.0 * s;
      c.fillStyle = col(v); c.beginPath(); c.arc(cx, yy, 1.05 * s, 0, 7); c.fill();
      c.fillStyle = '#fff'; c.font = `800 ${(n > 9 ? 0.95 : 1.15) * s}px ${FONT}`; c.textAlign = 'center'; c.fillText(String(n), cx, yy + 0.05 * s);
      c.fillStyle = col(v); c.font = `${typeof v === 'number' ? 700 : 800} ${1.25 * s}px ${FONT}`; c.textAlign = side ? 'right' : 'left'; c.fillText(name, side ? cx - 1.5 * s : cx + 1.5 * s, yy + 0.05 * s);
    }
  }
  c.fillStyle = '#c0392b'; c.font = `700 ${0.95 * s}px ${FONT}`; c.textAlign = 'center'; c.fillText('3.3 V logic · never 5 V into a GPIO', C.width / 2, (Hc - 1.2) * s);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(Wc, Hc), S({ map: tex(C), roughness: 0.85 })); m.rotation.x = -Math.PI / 2; m.position.set(30 + Wc / 2, 0.25, z0 + Hc / 2);
  m.userData.keep = true; m.receiveShadow = true; m.name = 'pincard'; return m;
}
// a 5-inch HDMI screen (800 × 480) on a small acrylic stand, leaning back a little; its picture is a canvas (the terminal)
function screen5() {
  const K = mats(); const g = new THREE.Group(); g.name = 'screen5';
  const tilt = new THREE.Group(); tilt.position.set(0, 10, 0); tilt.rotation.x = -0.2; g.add(tilt);
  tilt.add(box(122, 77, 6.5, K.bezel, 0, 38.5, 0)); tilt.add(box(96, 60, 3, K.green, 0, 38, -4.5)); tilt.add(box(15, 6, 10, K.M.steel, 34, 14, -8));
  const term = terminal(LITE ? 400 : 640, LITE ? 240 : 384);
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(110, 66), new THREE.MeshBasicMaterial({ map: term.tex, toneMapped: false })); glass.position.set(0, 38.5, 3.3); glass.userData.keep = true; glass.name = 'screen'; tilt.add(glass);
  g.add(box(70, 3, 46, K.acrylic, 0, 1.5, 2)); g.add(box(60, 40, 3, K.acrylic, 0, 20, -22)); // (the stand's foot and back)
  mergeStatic(g); g.userData.screen = term; return g;
}

// ------------------------------------------------------------------ the Pi on the robot car (forward +z): a light copy
let LITE_PI = null;
function piLite() {
  const K = mats(), { M } = K; const g = new THREE.Group();
  const pm = LITE_PI || (LITE_PI = (() => { const T = pi4Tex(5); const m = S({ map: T.map, roughness: 0.6 }); m.userData.shared = true; return m; })());
  const b = new THREE.Group(); b.rotation.y = -Math.PI / 2; g.add(b); // the board's long side along the car
  const A = (x, yy) => [x - 42.5, 28 - yy]; const put = (w, h, d, mat, x, yy, y0) => { const [X, Z] = A(x, yy); b.add(box(w, h, d, mat, X, y0 + h / 2, Z)); };
  put(85, 1.4, 56, [M.fr4, M.fr4, pm, M.fr4, M.fr4, M.fr4], 42.5, 28, 5); const t = 6.4;
  put(50.8, 8.5, 5.08, M.black, 32.5, 52.5, t); put(12.6, 2.2, 12.6, K.lid, 29, 32, t);
  for (const yy of [9, 27]) put(17.5, 16, 14.6, M.steel, 78.95, yy, t); put(21.3, 13.5, 15.9, M.steel, 76.35, 45.75, t);
  for (const [x, yy] of HOLES4) put(4, 5, 4, K.brass, x, yy, 0);
  return g;
}

// ------------------------------------------------------------------ the active buzzer (parts6.js): like the buzzer, sealed
export function buildActiveBuzzer() {
  const { M } = mats(); const g = new THREE.Group(); const cx = 1.5 * P;
  g.add(box(0.5, 7.2, 0.5, M.tin, 0, -2.4, 0)); g.add(box(0.5, 6.6, 0.5, M.tin, 3 * P, -2.7, 0)); // (the + leg is longer)
  g.add(cyl(6.0, 9.4, M.blackGloss, cx, 0.6 + 4.7, 0, 32));
  const C = canvas(128, 128), c = C.getContext('2d'); c.fillStyle = '#f3f1ea'; c.beginPath(); c.arc(64, 64, 62, 0, 7); c.fill(); c.fillStyle = '#333'; c.font = `700 15px ${FONT}`; c.textAlign = 'center'; c.font = `700 13px ${FONT}`; c.fillText('REMOVE SEAL', 68, 56); c.fillText('AFTER', 68, 72); c.fillText('WASHING', 68, 88); c.font = `800 34px ${FONT}`; c.fillText('+', 20, 76);
  const st = new THREE.Mesh(new THREE.CircleGeometry(5.2, 28), new THREE.MeshStandardMaterial({ map: tex(C), roughness: 0.7, transparent: true })); st.rotation.x = -Math.PI / 2; st.position.set(cx, 0.6 + 9.42, 0); g.add(st); // (the + over the long leg)
  shadows(g, true, false); return g;
}
export function buildPart6(part) { return part.type === 'abuzz' ? buildActiveBuzzer() : null; }

BUILD4.pico = buildPico; BUILD4.pi4 = buildPi4;
CAR_BOARD.pi = piLite;
