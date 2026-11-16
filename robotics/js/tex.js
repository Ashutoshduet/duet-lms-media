// DUET Robotics Lab 360: textures drawn in code (canvas): the board's solder mask, copper, gold pads and white print,
// the breadboard's top with its holes, the cutting mat, resistor colour bands and chip markings. No brand artwork.
import * as THREE from 'three';
import { BOARDS, BB } from './boards.js';
import { bands } from './parts.js';

export const FONT = '"Noto Sans Devanagari", "Noto Sans", Arial, sans-serif';
let LITE = false; export function setLite(v) { LITE = v; }
function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function tex(c, srgb = true, aniso = 8) {
  const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = aniso; t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter; t.needsUpdate = true; return t;
}
// a normal map from a height canvas (Sobel), for the dents and bumps the light should catch
function normalFrom(hc, strength) {
  const w = hc.width, h = hc.height, src = hc.getContext('2d').getImageData(0, 0, w, h).data;
  const out = canvas(w, h), ctx = out.getContext('2d'), img = ctx.createImageData(w, h), d = img.data;
  const H = (x, y) => src[((Math.min(h - 1, Math.max(0, y)) * w) + Math.min(w - 1, Math.max(0, x))) * 4] / 255;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const dx = (H(x + 1, y) - H(x - 1, y)) * strength, dy = (H(x, y + 1) - H(x, y - 1)) * strength;
    const l = Math.hypot(dx, dy, 1), i = (y * w + x) * 4;
    d[i] = (-dx / l * 0.5 + 0.5) * 255; d[i + 1] = (dy / l * 0.5 + 0.5) * 255; d[i + 2] = (1 / l * 0.5 + 0.5) * 255; d[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0); return out;
}
function noise(ctx, w, h, a, step = 2) {
  for (let y = 0; y < h; y += step) for (let x = 0; x < w; x += step) { const v = Math.random(); ctx.fillStyle = `rgba(${v > 0.5 ? 255 : 0},${v > 0.5 ? 255 : 0},${v > 0.5 ? 255 : 0},${Math.abs(v - 0.5) * a})`; ctx.fillRect(x, y, step, step); }
}

// ------------------------------------------------------------------ the UNO R3 board
// returns { map, rough (G: roughness, B: metalness), bump } in board UV (u along x from the left, v from the bottom)
export function unoTextures() {
  const B = BOARDS.uno, W = B.size[0], Hh = B.size[1];
  const s = LITE ? 12 : 24; const w = Math.round(W * s), h = Math.round(Hh * s);
  const C = canvas(w, h), R = canvas(w, h), U = canvas(w, h);
  const c = C.getContext('2d'), r = R.getContext('2d'), u = U.getContext('2d');
  const X = (mm) => mm * s, Y = (mm) => (Hh - mm) * s; // board mm (from lower-left) -> px
  const IN = 25.4;
  // base: blue solder mask over the board, a little uneven
  c.fillStyle = '#0d3a74'; c.fillRect(0, 0, w, h);
  const g = c.createLinearGradient(0, 0, w, h); g.addColorStop(0, 'rgba(255,255,255,0.03)'); g.addColorStop(1, 'rgba(0,0,0,0.06)'); c.fillStyle = g; c.fillRect(0, 0, w, h);
  r.fillStyle = 'rgb(0,95,0)'; r.fillRect(0, 0, w, h); // roughness ~0.37, not metal
  u.fillStyle = '#7a7a7a'; u.fillRect(0, 0, w, h);
  // copper pours (a little lighter under the mask) and traces
  const pour = (x, y, ww, hh) => { c.fillStyle = 'rgba(70,140,230,0.10)'; c.fillRect(X(x), Y(y + hh), X(ww), hh * s); u.fillStyle = 'rgba(255,255,255,0.10)'; u.fillRect(X(x), Y(y + hh), X(ww), hh * s); };
  pour(2, 2, 22, 18); pour(30, 2, 34, 8); pour(44, 20, 20, 24); pour(4, 26, 18, 22);
  const trace = (pts, wd = 0.3) => {
    for (const [ctx, col] of [[c, 'rgba(58,120,210,0.32)'], [u, 'rgba(255,255,255,0.3)']]) {
      ctx.strokeStyle = col; ctx.lineWidth = wd * s; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath();
      pts.forEach(([x, y], i) => (i ? ctx.lineTo(X(x), Y(y)) : ctx.moveTo(X(x), Y(y)))); ctx.stroke();
    }
  };
  // a route as a PCB tool draws it: straight runs joined by 45° corners
  const route = (x0, y0, x1, y1, ym, wd = 0.25) => {
    const d = Math.min(1.2, Math.abs(x1 - x0) / 2), sy0 = Math.sign(ym - y0) || 1, sy1 = Math.sign(y1 - ym) || 1, sx = Math.sign(x1 - x0) || 1;
    trace([[x0, y0], [x0, ym - sy0 * d], [x0 + sx * d, ym], [x1 - sx * d, ym], [x1, ym + sy1 * d], [x1, y1]], wd);
  };
  // the chip's legs to the digital and analog headers: two buses
  for (let i = 0; i < 14; i++) { const x0 = 31.9 + i * 2.54; const hx = 2.6 * IN - i * 0.1 * IN - (i > 7 ? 0.06 * IN : 0); route(x0, 19.6, hx, 50.3, 24.5 + i * 0.62); }
  for (let i = 0; i < 6; i++) { const x0 = 31.9 + (13 - i) * 2.54; route(x0, 11.9, 1.9 * IN + i * 0.1 * IN, 3.2, 8.6 - i * 0.55); }
  trace([[6, 8.4], [20, 8.4], [24, 12.4], [30, 12.4]], 1.0); trace([[14.5, 12], [14.5, 4.6], [35.6, 4.6], [35.6, 3.2]], 0.8); // power
  route(9.5, 37.4, 16.0, 34.0, 36.2, 0.3); route(9.5, 35.8, 16.0, 33.2, 35.0, 0.3); // USB data
  for (let i = 0; i < 6; i++) route(22.3, 31.6 + i * 0.6, 26 + i * 0.8, 44, 31.6 + i * 0.6, 0.2);
  const rnd = (a, b) => a + Math.random() * (b - a);
  // vias
  for (let i = 0; i < 40; i++) { const x = rnd(4, 64), y = rnd(5, 46); for (const [ctx, col] of [[c, '#c9a54e'], [u, '#c0c0c0']]) { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(X(x), Y(y), 0.32 * s, 0, 7); ctx.fill(); } c.fillStyle = '#1a1a1a'; c.beginPath(); c.arc(X(x), Y(y), 0.14 * s, 0, 7); c.fill(); }
  // gold (ENIG) pads: metal, smooth
  const gold = (x, y, ww, hh, round) => {
    c.fillStyle = '#d8b765'; r.fillStyle = 'rgb(0,60,255)'; u.fillStyle = '#dcdcdc';
    for (const ctx of [c, r, u]) { ctx.beginPath(); if (round) ctx.arc(X(x), Y(y), ww * s, 0, 7); else ctx.rect(X(x - ww / 2), Y(y + hh / 2), ww * s, hh * s); ctx.fill(); }
  };
  const ring = (x, y, ro, ri) => { gold(x, y, ro, 0, true); c.fillStyle = '#121212'; c.beginPath(); c.arc(X(x), Y(y), ri * s, 0, 7); c.fill(); r.fillStyle = 'rgb(0,230,0)'; r.beginPath(); r.arc(X(x), Y(y), ri * s, 0, 7); r.fill(); u.fillStyle = '#202020'; u.beginPath(); u.arc(X(x), Y(y), ri * s, 0, 7); u.fill(); };
  // mounting holes
  for (const [x, y] of B.holes) ring(x, y, 2.6, 1.6);
  // header pads (seen around the black headers), ICSP pads, test pads
  for (const p of B.pins) { const x = p.at[0] + W / 2, y = Hh / 2 - p.at[1]; ring(x, y, 1.0, 0.5); }
  for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) ring(2.5 * IN - 1.27 + j * 2.54, 1.05 * IN - 2.54 + i * 2.54, 0.85, 0.45); // ICSP (chip)
  for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) ring(0.95 * IN + j * 2.54, 1.83 * IN + i * 2.54 - 2.54, 0.85, 0.45); // ICSP (USB chip)
  // pads for the small parts, the DIP socket's legs, the USB chip, the regulator
  for (let i = 0; i < 14; i++) for (const yy of [11.95, 19.55]) gold(32.0 + i * 2.54 - 0.4, yy, 1.4, 1.9, false);
  for (let i = 0; i < 8; i++) for (const [dx, dy, ww, hh] of [[-3.1, -2.2 + i * 0.6, 0.8, 0.3], [3.1, -2.2 + i * 0.6, 0.8, 0.3], [-2.2 + i * 0.6, 3.1, 0.3, 0.8], [-2.2 + i * 0.6, -3.1, 0.3, 0.8]]) gold(19.05 + dx, 34.3 + dy, ww, hh, false);
  const smd = [[24, 26, 0], [26.5, 26, 0], [29, 41, 1], [29, 43.5, 1], [10.5, 30, 0], [13, 30, 0], [24, 16, 1], [40.5, 26, 0], [43, 26, 0], [45.5, 26, 0], [52, 32, 1], [55, 32, 1], [58, 22, 0], [8, 20, 1], [22, 18, 0], [6, 44, 1], [12, 46, 0], [36, 24, 1]];
  for (const [x, y, rot] of smd) { const dx = rot ? 0 : 0.95, dy = rot ? 0.95 : 0; gold(x - dx, y - dy, 0.75, 0.9, false); gold(x + dx, y + dy, 0.75, 0.9, false); }
  for (const [x, y] of [[10, 8], [36, 8], [30, 30], [50, 40], [60, 15]]) gold(x, y, 0.7, 0, true); // test points
  // white print (silkscreen)
  const font = (px, wgt = 700) => `${wgt} ${px * s}px ${FONT}`;
  const silk = (txt, x, y, px, opts = {}) => {
    for (const [ctx, col] of [[c, '#f1f1ec'], [u, '#b8b8b8'], [r, 'rgb(0,150,0)']]) {
      ctx.save(); ctx.translate(X(x), Y(y)); if (opts.rot) ctx.rotate(opts.rot); ctx.font = font(px, opts.w || 700); ctx.fillStyle = col;
      ctx.textAlign = opts.align || 'center'; ctx.textBaseline = 'middle'; ctx.fillText(txt, 0, 0); ctx.restore();
    }
  };
  const box = (x, y, ww, hh, lw = 0.18) => { for (const [ctx, col] of [[c, '#f1f1ec'], [u, '#b8b8b8']]) { ctx.strokeStyle = col; ctx.lineWidth = lw * s; ctx.strokeRect(X(x), Y(y + hh), ww * s, hh * s); } };
  const line = (x1, y1, x2, y2, lw = 0.2) => { for (const [ctx, col] of [[c, '#f1f1ec'], [u, '#b8b8b8']]) { ctx.strokeStyle = col; ctx.lineWidth = lw * s; ctx.beginPath(); ctx.moveTo(X(x1), Y(y1)); ctx.lineTo(X(x2), Y(y2)); ctx.stroke(); } };
  // pin names beside the headers
  for (const p of B.pins) {
    const x = p.at[0] + W / 2, y = Hh / 2 - p.at[1];
    if (p.hdr === 'dl' || p.hdr === 'dh') { const lab = p.gpio !== undefined ? (B.pwm.includes(p.gpio) ? '~' : '') + p.gpio : p.label; silk(lab, x, y - 3.9, p.gpio !== undefined ? 1.25 : 0.95, { rot: -Math.PI / 2, align: 'right' }); }
    else if (p.label) silk(p.label, x, y + 3.6, p.hdr === 'an' ? 1.25 : 0.95, { rot: -Math.PI / 2, align: 'left' });
  }
  silk('TX▸1', 2.5 * IN + 1.6, 1.86 * IN - 5.2, 0.9, { rot: -Math.PI / 2 }); silk('RX◂0', 2.6 * IN + 1.6, 1.86 * IN - 5.2, 0.9, { rot: -Math.PI / 2 });
  silk('DIGITAL (PWM ~)', 1.75 * IN, 1.62 * IN - 0.6, 1.5);
  line(0.8 * IN, 1.62 * IN - 1.9, 2.66 * IN, 1.62 * IN - 1.9, 0.22);
  silk('POWER', 1.35 * IN, 0.44 * IN + 2.4, 1.4); silk('ANALOG IN', 2.15 * IN, 0.44 * IN + 2.4, 1.4);
  line(0.96 * IN, 0.44 * IN + 1.1, 1.74 * IN, 0.44 * IN + 1.1); line(1.86 * IN, 0.44 * IN + 1.1, 2.44 * IN, 0.44 * IN + 1.1);
  silk('UNO R3', 1.95 * IN, 1.27 * IN, 4.2, { w: 800 });
  silk('DUET STEM', 1.95 * IN, 1.27 * IN - 4.0, 1.7, { w: 700 });
  silk('ICSP', 2.5 * IN - 4.3, 1.05 * IN, 1.0, { rot: -Math.PI / 2 }); silk('ICSP', 0.95 * IN + 1.27, 1.83 * IN + 4.6, 0.9);
  silk('RESET', 0.34 * IN, 1.9 * IN - 4.6, 0.95); silk('L', 1.2 * IN - 2.7, 1.78 * IN, 1.05); silk('TX', 1.2 * IN - 2.9, 1.55 * IN, 0.95); silk('RX', 1.2 * IN - 2.9, 1.45 * IN, 0.95);
  silk('ON', 2.35 * IN + 2.6, 1.5 * IN, 1.05); silk('AREF', 1.04 * IN, 1.62 * IN - 3.2, 0.8); silk('16MHz', 1.0 * IN, 1.1 * IN - 3.6, 0.85);
  silk('MADE IN INDIA', 0.75 * IN, 0.98 * IN, 0.9, { w: 600 }); silk('+', 0.85 * IN + 3.3, 0.25 * IN + 1.3, 1.6); silk('+', 0.6 * IN + 3.3, 0.25 * IN + 1.3, 1.6);
  box(1.95 * IN - 18.6, 0.62 * IN - 4.6, 37.2, 9.2, 0.2); // the chip's outline
  box(0.75 * IN - 3.3, 1.35 * IN - 3.3, 6.6, 6.6); box(0.34 * IN - 3.4, 1.9 * IN - 3.4, 6.8, 6.8);
  for (const [x, y] of B.holes) { /* keep clear */ void x; void y; }
  noise(c, w, h, 0.05, 3);
  // the board's edges darker (mask thinner at the rout)
  c.strokeStyle = 'rgba(5,20,40,0.6)'; c.lineWidth = 0.4 * s; c.strokeRect(0, 0, w, h);
  const map = tex(C), rough = tex(R, false), bump = tex(U, false);
  return { map, rough, bump };
}

// ------------------------------------------------------------------ the breadboard's top
export function breadboardTextures() {
  const [Wb, Db] = BB.size; const s = LITE ? 8 : 14; const w = Math.round(Wb * s), h = Math.round(Db * s);
  const C = canvas(w, h), Hc = canvas(w, h); const c = C.getContext('2d'), hh = Hc.getContext('2d');
  const X = (mm) => (mm + Wb / 2) * s, Z = (mm) => (mm + Db / 2) * s;
  c.fillStyle = '#efece4'; c.fillRect(0, 0, w, h); noise(c, w, h, 0.035, 2);
  hh.fillStyle = '#808080'; hh.fillRect(0, 0, w, h);
  // the centre channel: shade
  const gc = c.createLinearGradient(0, Z(-1.6), 0, Z(1.6)); gc.addColorStop(0, '#cfccc3'); gc.addColorStop(0.5, '#a9a69c'); gc.addColorStop(1, '#cfccc3');
  c.fillStyle = gc; c.fillRect(0, Z(-1.5), w, 3 * s); hh.fillStyle = '#404040'; hh.fillRect(0, Z(-1.3), w, 2.6 * s);
  // rail lines (red +, blue −)
  const railLine = (z, col) => { c.fillStyle = col; c.fillRect(X(-77), Z(z) - 0.22 * s, X(77) - X(-77), 0.44 * s); };
  railLine(-26.2, '#d9261c'); railLine(-19.4, '#1f5fd1'); railLine(19.4, '#d9261c'); railLine(26.2, '#1f5fd1');
  // holes: square, with a dark inside and a slightly lighter chamfer
  const hs = 1.05; // hole opening (mm)
  for (const hl of BB.holes.values()) {
    const x = X(hl.x), z = Z(hl.z), a = hs * s;
    c.fillStyle = '#c9c5bb'; c.fillRect(x - a * 0.85, z - a * 0.85, a * 1.7, a * 1.7);
    c.fillStyle = '#2a2722'; c.fillRect(x - a / 2, z - a / 2, a, a);
    c.fillStyle = 'rgba(160,150,130,0.55)'; c.fillRect(x - a / 2, z - a / 2, a, a * 0.22); // the metal clip deep inside
    const gr = hh.createRadialGradient(x, z, a * 0.3, x, z, a * 1.0); gr.addColorStop(0, '#000'); gr.addColorStop(1, '#808080');
    hh.fillStyle = gr; hh.fillRect(x - a, z - a, a * 2, a * 2);
  }
  // labels
  c.fillStyle = '#9a968c'; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.font = `600 ${1.55 * s}px ${FONT}`;
  for (let col = 1; col <= 63; col++) if (col === 1 || col % 5 === 0) { const x = X((col - 32) * BB.P); c.fillText(String(col), x, Z(-16.6)); c.fillText(String(col), x, Z(16.6)); }
  c.font = `600 ${1.6 * s}px ${FONT}`;
  for (const r of BB.rows) { const z = Z(BB.rowZ[r] * BB.P); c.fillText(r, X(-80.6), z); c.fillText(r, X(80.6), z); }
  c.font = `700 ${2.3 * s}px ${FONT}`;
  for (const [z, t, col] of [[-24.13, '+', '#d9261c'], [-21.59, '−', '#1f5fd1'], [21.59, '+', '#d9261c'], [24.13, '−', '#1f5fd1']]) { c.fillStyle = col; c.fillText(t, X(-79.6), Z(z)); c.fillText(t, X(79.6), Z(z)); }
  const map = tex(C), normal = tex(normalFrom(Hc, LITE ? 3 : 5), false);
  return { map, normal };
}

// ------------------------------------------------------------------ the green cutting mat
export const MAT = { w: 430, d: 300 };
export function matTexture() {
  const s = LITE ? 2.4 : 4.4; const w = Math.round(MAT.w * s), h = Math.round(MAT.d * s);
  const C = canvas(w, h), c = C.getContext('2d');
  c.fillStyle = '#21543f'; c.fillRect(0, 0, w, h); noise(c, w, h, 0.07, 2);
  const X = (mm) => mm * s, Y = (mm) => mm * s, m = 12;
  for (let x = m; x <= MAT.w - m + 0.1; x += 10) { const major = Math.round((x - m) / 10) % 5 === 0; c.fillStyle = major ? 'rgba(210,235,220,0.42)' : 'rgba(200,230,215,0.2)'; c.fillRect(X(x) - (major ? 0.9 : 0.5), Y(m), major ? 1.8 : 1, Y(MAT.d - 2 * m)); }
  for (let y = m; y <= MAT.d - m + 0.1; y += 10) { const major = Math.round((y - m) / 10) % 5 === 0; c.fillStyle = major ? 'rgba(210,235,220,0.42)' : 'rgba(200,230,215,0.2)'; c.fillRect(X(m), Y(y) - (major ? 0.9 : 0.5), X(MAT.w - 2 * m), major ? 1.8 : 1); }
  // mm ticks and cm numbers along the top and the left
  c.fillStyle = 'rgba(225,240,230,0.75)'; c.font = `600 ${3.2 * s}px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle';
  for (let i = 0; i <= MAT.w - 2 * m; i++) { const x = X(m + i), L = i % 10 === 0 ? 4 : i % 5 === 0 ? 2.6 : 1.5; c.fillRect(x - 0.3, Y(m) - L * s, 0.6, L * s); if (i % 10 === 0 && i) c.fillText(String(i / 10), x, Y(m) - 6.5 * s); }
  // a 45° and 60° guide in the corner, and the name
  c.strokeStyle = 'rgba(210,235,220,0.3)'; c.lineWidth = 1.2;
  for (const a of [30, 45, 60]) { const r = 70; c.beginPath(); c.moveTo(X(MAT.w - m), Y(MAT.d - m)); c.lineTo(X(MAT.w - m - r * Math.cos(a * Math.PI / 180)), Y(MAT.d - m - r * Math.sin(a * Math.PI / 180))); c.stroke(); }
  c.beginPath(); c.arc(X(MAT.w - m), Y(MAT.d - m), 60 * s, Math.PI, Math.PI * 1.5); c.stroke();
  c.fillStyle = 'rgba(225,240,230,0.55)'; c.font = `700 ${5 * s}px ${FONT}`; c.textAlign = 'left'; c.fillText('DUET STEM · SELF-HEALING MAT', X(m + 4), Y(MAT.d - m + 5.5));
  return tex(C);
}

// ------------------------------------------------------------------ small parts
export function resistorTexture(ohms) {
  const C = canvas(256, 32), c = C.getContext('2d');
  c.fillStyle = '#d9c39a'; c.fillRect(0, 0, 256, 32);
  const g = c.createLinearGradient(0, 0, 256, 0); g.addColorStop(0, 'rgba(0,0,0,0.08)'); g.addColorStop(0.15, 'rgba(255,255,255,0.05)'); g.addColorStop(0.85, 'rgba(255,255,255,0.05)'); g.addColorStop(1, 'rgba(0,0,0,0.08)'); c.fillStyle = g; c.fillRect(0, 0, 256, 32);
  const b = bands(ohms); const pos = [62, 92, 122, 188];
  b.forEach((col, i) => { c.fillStyle = col; c.fillRect(pos[i] - 10, 0, 20, 32); });
  noise(c, 256, 32, 0.05, 2);
  return tex(C);
}
export function labelTexture(lines, opts = {}) { // laser marking on a black part
  const w = opts.w || 256, h = opts.h || 128; const C = canvas(w, h), c = C.getContext('2d');
  c.fillStyle = opts.bg || '#151515'; c.fillRect(0, 0, w, h); noise(c, w, h, 0.05, 2);
  c.fillStyle = opts.ink || 'rgba(200,200,200,0.75)'; c.textAlign = 'center'; c.textBaseline = 'middle';
  lines.forEach((t, i) => { c.font = `${i ? 500 : 700} ${(opts.size || 22) * (i ? 0.8 : 1)}px ${FONT}`; c.fillText(t, w / 2, h / 2 + (i - (lines.length - 1) / 2) * (opts.size || 22) * 1.15); });
  if (opts.dot) { c.fillStyle = 'rgba(0,0,0,0.6)'; c.beginPath(); c.arc(opts.dot[0] * w, opts.dot[1] * h, h * 0.09, 0, 7); c.fill(); }
  if (opts.notch) { c.fillStyle = '#0a0a0a'; c.beginPath(); c.arc(opts.notch === 'l' ? 0 : w, h / 2, h * 0.16, 0, 7); c.fill(); }
  return tex(C);
}
export function pcbTexture(w, h, draw, color = '#1d4aa8') { // a small module's board (HC-SR04, IR sensor)
  const s = 16; const C = canvas(Math.round(w * s), Math.round(h * s)), c = C.getContext('2d');
  c.fillStyle = color; c.fillRect(0, 0, C.width, C.height); noise(c, C.width, C.height, 0.05, 2);
  c.save(); c.scale(s, s); draw(c); c.restore(); return tex(C);
}
export function meshTexture() { // the metal mesh on the ultrasonic sensor's face
  const C = canvas(128, 128), c = C.getContext('2d'); c.fillStyle = '#9a9ea4'; c.fillRect(0, 0, 128, 128);
  c.fillStyle = '#2a2c30'; for (let y = 0; y < 128; y += 4) for (let x = (y / 4) % 2 ? 2 : 0; x < 128; x += 4) c.fillRect(x, y, 2.2, 2.2);
  const t = tex(C); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 3); return t;
}
export function ldrTexture() { // the light-sensitive track on an LDR's face
  const C = canvas(128, 128), c = C.getContext('2d');
  c.fillStyle = '#f2ece0'; c.beginPath(); c.arc(64, 64, 64, 0, 7); c.fill();
  c.fillStyle = '#b8432a'; c.beginPath(); c.arc(64, 64, 52, 0, 7); c.fill();
  c.strokeStyle = '#d8d8d4'; c.lineWidth = 7; c.beginPath(); // the two silver combs, meeting in a zig-zag
  for (let i = 0; i < 8; i++) { const y = 22 + i * 12; c.moveTo(i % 2 ? 26 : 102, y); c.lineTo(i % 2 ? 98 : 30, y); }
  c.stroke(); c.lineWidth = 9; c.beginPath(); c.moveTo(26, 16); c.lineTo(26, 112); c.moveTo(102, 16); c.lineTo(102, 112); c.stroke();
  return tex(C);
}
export function labelSticker(lines, bg, ink, w = 256, h = 160) {
  const C = canvas(w, h), c = C.getContext('2d'); c.fillStyle = bg; c.fillRect(0, 0, w, h); noise(c, w, h, 0.04, 2);
  c.fillStyle = ink; c.textAlign = 'center'; c.textBaseline = 'middle';
  lines.forEach(([t, px, y], i) => { c.font = `${i ? 600 : 800} ${px}px ${FONT}`; c.fillText(t, w / 2, y); });
  return tex(C);
}
export function radialTexture(inner = 'rgba(255,255,255,1)', outer = 'rgba(255,255,255,0)') {
  const C = canvas(128, 128), c = C.getContext('2d'); const g = c.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, inner); g.addColorStop(0.25, 'rgba(255,255,255,0.45)'); g.addColorStop(0.6, 'rgba(255,255,255,0.1)'); g.addColorStop(1, outer);
  c.fillStyle = g; c.fillRect(0, 0, 128, 128); return tex(C);
}
export function socketTopTexture() { // the top of a black female header: one square opening per pin
  const C = canvas(64, 64), c = C.getContext('2d'); c.fillStyle = '#18191b'; c.fillRect(0, 0, 64, 64); noise(c, 64, 64, 0.06, 2);
  c.fillStyle = '#2b2c2f'; c.fillRect(14, 14, 36, 36); c.fillStyle = '#050505'; c.fillRect(20, 20, 24, 24);
  c.fillStyle = 'rgba(214,183,101,0.55)'; c.fillRect(22, 38, 20, 4);
  const t = tex(C); t.wrapS = THREE.RepeatWrapping; return t;
}
