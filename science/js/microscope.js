// DUET Science Lab 360, the biology bench: a compound microscope you work yourself, and what it shows.
// The microscope has a stage with clips, a lamp, a nosepiece with four objectives (4×, 10×, 40×, 100× oil) and a coarse
// and a fine focus knob (take hold of a knob and move your hand up or down to turn it). What you see through the 10×
// eyepiece is drawn from the specimen itself, at the magnification, focus and stain you have: a cell wall at 400× is
// where it would be, and out of focus it is blurred as much as a real lens would blur it. Specimens: onion peel, cheek
// cells, Rhoeo leaf peel (plasmolysis), leaf peel with stomata, Spirogyra, yeast, bacteria in curd, Paramecium, Amoeba
// (and binary fission), starch grains in potato, bread mould, Hydra with a bud, and permanent slides of parenchyma,
// xylem, striated muscle, a nerve cell and blood.
import * as THREE from 'three';
import { Item } from './apparatus.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const M = (c, r = 0.5, m = 0, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m, ...o });
const TAU = Math.PI * 2;
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
// a repeatable random number for a cell: the same cell looks the same at every magnification
function h2(i, j, s = 0) { let h = (i * 374761393 + j * 668265263 + s * 2147483647) | 0; h = (h ^ (h >>> 13)) * 1274126177; h ^= h >>> 16; return ((h >>> 0) % 100000) / 100000; }
const FONT = '"Noto Sans Devanagari", "Noto Sans", system-ui, sans-serif';

// ---------------------------------------------------------------------------------------------- the objectives
// field of view (µm across the eyepiece circle, field number 18 mm) and the depth over which the image stays sharp
// (what a camera on the microscope records, a little less than the eye sees through a wide-field eyepiece)
export const OBJ = [
  { x: 4, field: 2800, dof: 0.11, col: 0xd23b2f, name: '4×' },
  { x: 10, field: 1120, dof: 0.05, col: 0xe6c229, name: '10×' },
  { x: 40, field: 290, dof: 0.018, col: 0x2f7fd2, name: '40×' },
  { x: 100, field: 115, dof: 0.007, col: 0xf2f2f2, name: '100× oil' },
];
const SHARP = [0.42, 0.47, 0.5, 0.51]; // where the image is sharp (stage height 0…1): nearly parfocal, as in a real microscope

// ---------------------------------------------------------------------------------------------- specimens
// Each draws, in micrometres around (cx, cy), at s pixels per micrometre, everything inside a circle of radius R px.
// st: { stain, t (seconds), salt (0…1, plasmolysis), split (0…1, fission), slide (which permanent slide) }
const STAIN = {
  none: { wall: 'rgba(150,140,110,0.45)', fill: 'rgba(235,230,205,0.10)', nuc: 'rgba(150,140,120,0.35)' },
  safranin: { wall: 'rgba(196,40,72,0.9)', fill: 'rgba(240,150,170,0.18)', nuc: 'rgba(150,20,60,0.85)' },
  iodine: { wall: 'rgba(150,100,20,0.85)', fill: 'rgba(230,190,90,0.22)', nuc: 'rgba(120,70,10,0.9)' },
  mblue: { wall: 'rgba(40,80,170,0.55)', fill: 'rgba(130,170,230,0.28)', nuc: 'rgba(20,40,130,0.9)' },
};
function poly(x, pts) { x.beginPath(); pts.forEach(([a, b], i) => (i ? x.lineTo(a, b) : x.moveTo(a, b))); x.closePath(); }
// a wobbly closed outline around (0,0): n points, radius r, roughness k
function blob(x, cx, cy, r, n, k, seed, t = 0, sx = 1, sy = 1) {
  const P = []; for (let i = 0; i < n; i++) { const a = (i / n) * TAU; const w = 1 + k * (Math.sin(a * 3 + seed * 7 + t) * 0.5 + Math.sin(a * 5 + seed * 13 - t * 0.7) * 0.3 + (h2(i, seed | 0, 9) - 0.5) * 0.4);
    P.push([cx + Math.cos(a) * r * w * sx, cy + Math.sin(a) * r * w * sy]); }
  const mid = (i) => { const a = P[i % n], b = P[(i + 1) % n]; return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; }; // a smooth curve through the midpoints
  x.beginPath(); let m = mid(n - 1); x.moveTo(m[0], m[1]); for (let i = 0; i < n; i++) { m = mid(i); x.quadraticCurveTo(P[i][0], P[i][1], m[0], m[1]); } x.closePath();
}
export const SPECIMENS = {
  // onion peel: brick-like cells in rows, each with a cell wall and a nucleus
  onion(x, cx, cy, s, R, st) {
    const S = STAIN[st.stain] || STAIN.none, H = 62, span = R / s + 300;
    const j0 = Math.floor((cy - span) / H), j1 = Math.ceil((cy + span) / H);
    for (let j = j0; j <= j1; j++) {
      const off = h2(0, j, 1) * 240, y0 = j * H;
      for (let i = Math.floor((cx - span - off) / 250) - 1; i <= Math.ceil((cx + span - off) / 250) + 1; i++) {
        const xa = off + i * 250 + (h2(i, j, 2) - 0.5) * 60, xb = off + (i + 1) * 250 + (h2(i + 1, j, 2) - 0.5) * 60;
        const P = [[xa, y0 + (h2(i, j, 3) - 0.5) * 8], [xb, y0 + (h2(i + 1, j, 3) - 0.5) * 8], [xb + (h2(i + 1, j + 1, 4) - 0.5) * 20, y0 + H], [xa + (h2(i, j + 1, 4) - 0.5) * 20, y0 + H]].map(([a, b]) => [(a - cx) * s, (b - cy) * s]);
        poly(x, P); x.fillStyle = S.fill; x.fill(); x.strokeStyle = S.wall; x.lineWidth = Math.max(1, 3.2 * s); x.stroke();
        const nx = ((xa + xb) / 2 + (h2(i, j, 5) - 0.5) * 90 - cx) * s, ny = (y0 + H / 2 + (h2(i, j, 6) - 0.5) * 18 - cy) * s;
        x.beginPath(); x.ellipse(nx, ny, 11 * s, 8 * s, 0, 0, TAU); x.fillStyle = S.nuc; x.fill();
        if (s > 0.8) { x.beginPath(); x.arc(nx + 2 * s, ny - 1 * s, 2.5 * s, 0, TAU); x.fillStyle = 'rgba(40,10,20,0.6)'; x.fill(); } // nucleolus
      }
    }
  },
  // cheek cells: flat, irregular, scattered, each with a small dark nucleus; no cell wall
  cheek(x, cx, cy, s, R, st) {
    const S = STAIN[st.stain] || STAIN.none, G = 95, span = R / s + 100;
    for (let j = Math.floor((cy - span) / G); j <= Math.ceil((cy + span) / G); j++) for (let i = Math.floor((cx - span) / G); i <= Math.ceil((cx + span) / G); i++) {
      if (h2(i, j, 1) < 0.45) continue; const px = (i * G + h2(i, j, 2) * G - cx) * s, py = (j * G + h2(i, j, 3) * G - cy) * s, r = (30 + h2(i, j, 4) * 18) * s;
      blob(x, px, py, r, 9, 0.35, i * 31 + j); x.fillStyle = S.fill.replace(/0\.\d+\)$/, '0.32)'); x.fill(); x.strokeStyle = S.wall; x.lineWidth = Math.max(0.8, 1.2 * s); x.stroke();
      if (s > 0.25 && h2(i, j, 7) > 0.5) { x.beginPath(); x.moveTo(px - r * 0.5, py + r * 0.1); x.quadraticCurveTo(px, py + r * 0.4, px + r * 0.5, py + r * 0.05); x.strokeStyle = S.wall; x.stroke(); } // a fold
      x.beginPath(); x.arc(px + (h2(i, j, 5) - 0.5) * r * 0.3, py + (h2(i, j, 6) - 0.5) * r * 0.3, 5 * s, 0, TAU); x.fillStyle = S.nuc; x.fill();
    }
  },
  // Rhoeo leaf peel: purple cells; in salt solution the cell content shrinks away from the wall (plasmolysis)
  rhoeo(x, cx, cy, s, R, st) {
    const G = 110, span = R / s + 150, k = st.salt || 0;
    for (let j = Math.floor((cy - span) / 70); j <= Math.ceil((cy + span) / 70); j++) for (let i = Math.floor((cx - span) / G); i <= Math.ceil((cx + span) / G); i++) {
      const off = (j % 2) * G / 2, x0 = (i * G + off - cx) * s, y0 = (j * 70 - cy) * s, w = G * s, hh = 70 * s;
      const P = [[x0, y0], [x0 + w, y0 + (h2(i, j, 1) - 0.5) * 6 * s], [x0 + w + (h2(i, j, 2) - 0.5) * 10 * s, y0 + hh], [x0, y0 + hh]];
      poly(x, P); x.fillStyle = `rgba(150,60,170,${0.5 - 0.42 * k})`; x.fill(); x.strokeStyle = 'rgba(80,60,60,0.7)'; x.lineWidth = Math.max(1, 2.5 * s); x.stroke();
      if (k > 0.02) { blob(x, x0 + w / 2, y0 + hh / 2, (Math.min(w, hh) / 2) * (1 - 0.45 * k), 10, 0.15 * k, i * 7 + j); x.fillStyle = `rgba(140,40,170,${0.55 + 0.3 * k})`; x.fill(); }
      x.beginPath(); x.arc(x0 + w * 0.5, y0 + hh * 0.5, 7 * s, 0, TAU); x.fillStyle = 'rgba(70,20,90,0.6)'; x.fill();
    }
  },
  // the lower skin of a leaf: wavy (jigsaw) cells and stomata, each a pore between two bean-shaped guard cells with
  // chloroplasts; st.open: 0 closed … 1 open
  stomata(x, cx, cy, s, R, st) {
    const S = STAIN[st.stain] || STAIN.none, G = 52, span = R / s + 80;
    const vx = (i, j) => [i * G + (j % 2) * G / 2 + (h2(i, j, 1) - 0.5) * 18, j * G * 0.87 + (h2(i, j, 2) - 0.5) * 18];
    x.lineWidth = Math.max(0.8, 2 * s); x.strokeStyle = S.wall;
    for (let j = Math.floor((cy - span) / (G * 0.87)); j <= Math.ceil((cy + span) / (G * 0.87)); j++) for (let i = Math.floor((cx - span) / G) - 1; i <= Math.ceil((cx + span) / G) + 1; i++) {
      const a = vx(i, j), b = vx(i + 1, j), c = vx(i + (j % 2 ? 1 : 0), j + 1);
      for (const [p, q] of [[a, b], [a, c]]) { x.beginPath(); const n = 6; for (let k = 0; k <= n; k++) { const u = k / n; const dx = q[0] - p[0], dy = q[1] - p[1], L = Math.hypot(dx, dy) || 1; const w = Math.sin(u * Math.PI * 3 + i + j) * 5 * Math.sin(u * Math.PI);
        const px = (p[0] + dx * u - dy / L * w - cx) * s, py = (p[1] + dy * u + dx / L * w - cy) * s; k ? x.lineTo(px, py) : x.moveTo(px, py); } x.stroke(); }
    }
    const SG = 140, op = st.open ?? 0.8;
    for (let j = Math.floor((cy - span) / SG); j <= Math.ceil((cy + span) / SG); j++) for (let i = Math.floor((cx - span) / SG); i <= Math.ceil((cx + span) / SG); i++) {
      if (h2(i, j, 3) < 0.25) continue; const px = (i * SG + h2(i, j, 4) * SG * 0.6 - cx) * s, py = (j * SG + h2(i, j, 5) * SG * 0.6 - cy) * s, rot = (h2(i, j, 6) - 0.5) * 1.2;
      x.save(); x.translate(px, py); x.rotate(rot);
      x.beginPath(); x.ellipse(0, 0, 22 * s, 17 * s, 0, 0, TAU); x.fillStyle = 'rgba(255,255,255,0.35)'; x.fill(); // subsidiary
      for (const sd of [-1, 1]) { x.beginPath(); x.ellipse(sd * (6 + 2 * op) * s, 0, 7 * s, 15 * s, 0, 0, TAU); x.fillStyle = 'rgba(120,170,80,0.75)'; x.fill(); x.strokeStyle = S.wall; x.stroke();
        if (s > 0.6) for (let k = 0; k < 5; k++) { x.beginPath(); x.arc(sd * (6 + 2 * op) * s + (h2(k, i, 7) - 0.5) * 6 * s, (k - 2) * 5 * s, 1.6 * s, 0, TAU); x.fillStyle = '#2f7a1c'; x.fill(); } }
      x.beginPath(); x.ellipse(0, 0, Math.max(0.3, 2.5 * op) * s, 9 * op * s + 0.3, 0, 0, TAU); x.fillStyle = 'rgba(40,40,30,0.75)'; x.fill(); x.restore();
    }
  },
  // Spirogyra: green threads with a spiral ribbon of chloroplast in each cell
  spirogyra(x, cx, cy, s, R, st) {
    const L = R / s + 200;
    for (let f = -3; f <= 3; f++) {
      const ang = (h2(f, 1, 1) - 0.5) * 0.9, oy = f * 260 + (h2(f, 2, 2) - 0.5) * 120 - cy, W = 34;
      x.save(); x.rotate(ang); x.translate(0, oy * s);
      x.fillStyle = 'rgba(200,230,180,0.35)'; x.fillRect(-L * s, -W / 2 * s, 2 * L * s, W * s); x.strokeStyle = 'rgba(70,110,50,0.8)'; x.lineWidth = Math.max(1, 1.8 * s); x.strokeRect(-L * s, -W / 2 * s, 2 * L * s, W * s);
      const c0 = Math.floor((-L + cx) / 90) - 1; for (let c = c0; c < c0 + (2 * L) / 90 + 2; c++) { const xx = (c * 90 - cx) * s; x.beginPath(); x.moveTo(xx, -W / 2 * s); x.lineTo(xx, W / 2 * s); x.stroke(); }
      x.beginPath(); for (let u = -L; u <= L; u += 3) { const xx = u * s, yy = Math.sin(((u + cx) / 90) * TAU * 1.6) * (W / 2 - 4) * s; u === -L ? x.moveTo(xx, yy) : x.lineTo(xx, yy); }
      x.strokeStyle = 'rgba(40,140,40,0.9)'; x.lineWidth = Math.max(1.5, 6 * s); x.stroke();
      x.restore();
    }
  },
  // yeast: small oval cells, many with a bud, some in short chains
  yeast(x, cx, cy, s, R, st) {
    const G = 22, span = R / s + 30, S = STAIN[st.stain] || STAIN.none;
    for (let j = Math.floor((cy - span) / G); j <= Math.ceil((cy + span) / G); j++) for (let i = Math.floor((cx - span) / G); i <= Math.ceil((cx + span) / G); i++) {
      if (h2(i, j, 1) < 0.55) continue; const px = (i * G + h2(i, j, 2) * G - cx) * s, py = (j * G + h2(i, j, 3) * G - cy) * s, a = h2(i, j, 4) * TAU;
      const cell = (X0, Y0, r) => { x.beginPath(); x.ellipse(X0, Y0, r * s, r * 0.8 * s, a, 0, TAU); x.fillStyle = st.stain === 'none' ? 'rgba(220,210,170,0.6)' : S.fill.replace(/0\.\d+\)$/, '0.6)'); x.fill(); x.strokeStyle = 'rgba(90,80,60,0.8)'; x.lineWidth = Math.max(0.6, 0.7 * s); x.stroke(); };
      cell(px, py, 3.2); if (h2(i, j, 5) > 0.45) cell(px + Math.cos(a) * 4.4 * s, py + Math.sin(a) * 4.4 * s, 1.6 + h2(i, j, 6) * 1.2);
      if (h2(i, j, 7) > 0.8) cell(px - Math.cos(a) * 6 * s, py - Math.sin(a) * 6 * s, 3);
    }
  },
  // bacteria in curd (Lactobacillus): tiny rods, alone, in pairs and short chains, stained blue
  curd(x, cx, cy, s, R, st) {
    const G = 12, span = R / s + 20;
    x.strokeStyle = st.stain === 'mblue' ? 'rgba(30,60,170,0.9)' : 'rgba(120,120,110,0.45)'; x.lineCap = 'round';
    for (let j = Math.floor((cy - span) / G); j <= Math.ceil((cy + span) / G); j++) for (let i = Math.floor((cx - span) / G); i <= Math.ceil((cx + span) / G); i++) {
      if (h2(i, j, 1) < 0.5) continue; let px = (i * G + h2(i, j, 2) * G - cx) * s, py = (j * G + h2(i, j, 3) * G - cy) * s; const a = h2(i, j, 4) * TAU, n = 1 + Math.floor(h2(i, j, 5) * 3), L = 3 * s;
      x.lineWidth = Math.max(1, 0.9 * s);
      for (let k = 0; k < n; k++) { x.beginPath(); x.moveTo(px, py); px += Math.cos(a + k * 0.15) * L; py += Math.sin(a + k * 0.15) * L; x.lineTo(px, py); x.stroke(); px += Math.cos(a) * 0.6 * s; py += Math.sin(a) * 0.6 * s; }
    }
    // a few big curd fat globules
    for (let k = 0; k < 6; k++) { const px = ((h2(k, 1, 9) - 0.5) * 900 - cx) * s, py = ((h2(k, 2, 9) - 0.5) * 900 - cy) * s; x.beginPath(); x.arc(px, py, 14 * s, 0, TAU); x.strokeStyle = 'rgba(160,150,120,0.5)'; x.lineWidth = Math.max(1, 1 * s); x.stroke(); }
  },
  // Paramecium: slipper-shaped, covered with beating cilia, swimming across the field
  paramecium(x, cx, cy, s, R, st) {
    const wrap = (v) => ((((v + 650) % 1300) + 1300) % 1300) - 650; // they swim out of one side and come back in at the other
    for (let k = 0; k < 6; k++) {
      const sp = 30 + h2(k, 1, 1) * 40, a0 = h2(k, 2, 2) * TAU, turn = Math.sin(st.t * 0.3 + k) * 0.5, ang = a0 + turn;
      const px = wrap((h2(k, 3, 3) - 0.5) * 1100 + Math.cos(a0) * sp * st.t) - cx, py = wrap((h2(k, 4, 4) - 0.5) * 1100 + Math.sin(a0) * sp * st.t) - cy;
      x.save(); x.translate(px * s, py * s); x.rotate(ang);
      const L = 120, W = 38; x.beginPath(); x.ellipse(0, 0, L * s, W * s, 0, 0, TAU); x.fillStyle = 'rgba(200,215,190,0.55)'; x.fill(); x.strokeStyle = 'rgba(70,90,70,0.85)'; x.lineWidth = Math.max(1, 1.6 * s); x.stroke();
      if (s > 0.25) { x.lineWidth = Math.max(0.5, 0.6 * s); for (let i = 0; i < 64; i++) { const a = (i / 64) * TAU, bx = Math.cos(a) * L * s, by = Math.sin(a) * W * s, w = Math.sin(st.t * 14 + i * 0.6) * 0.5; x.beginPath(); x.moveTo(bx, by); x.lineTo(bx + Math.cos(a + w) * 7 * s, by + Math.sin(a + w) * 7 * s); x.stroke(); } }
      x.beginPath(); x.moveTo(-10 * s, -W * s * 0.2); x.quadraticCurveTo(20 * s, 6 * s, 40 * s, W * s * 0.1); x.strokeStyle = 'rgba(70,90,70,0.6)'; x.stroke(); // oral groove
      x.beginPath(); x.ellipse(-8 * s, 0, 26 * s, 12 * s, 0.2, 0, TAU); x.fillStyle = 'rgba(120,110,90,0.6)'; x.fill(); // macronucleus
      for (const cxv of [-70, 70]) { const r = (6 + 4 * Math.abs(Math.sin(st.t * 2 + cxv))) * s; x.beginPath(); x.arc(cxv * s, 0, r, 0, TAU); x.strokeStyle = 'rgba(80,100,120,0.7)'; x.stroke(); } // contractile vacuoles
      for (let i = 0; i < 6; i++) { x.beginPath(); x.arc((h2(i, k, 8) - 0.5) * 120 * s, (h2(i, k, 9) - 0.5) * 30 * s, 4 * s, 0, TAU); x.fillStyle = 'rgba(150,120,80,0.5)'; x.fill(); } // food vacuoles
      x.restore();
    }
  },
  // Amoeba: an ever-changing shape with pseudopodia; split > 0: dividing into two (binary fission)
  amoeba(x, cx, cy, s, R, st) {
    const k = st.split || 0, t = st.t;
    const one = (ox, oy, r, seed, nuc) => { blob(x, ox * s, oy * s, r * s, 18, 0.42, seed, t * 0.6); x.fillStyle = 'rgba(205,210,190,0.6)'; x.fill(); x.strokeStyle = 'rgba(80,90,70,0.8)'; x.lineWidth = Math.max(1, 1.4 * s); x.stroke();
      for (const n of nuc) { x.beginPath(); x.ellipse((ox + n[0]) * s, (oy + n[1]) * s, 22 * s, 18 * s, 0, 0, TAU); x.fillStyle = 'rgba(110,100,80,0.7)'; x.fill(); }
      for (let i = 0; i < 5; i++) { x.beginPath(); x.arc((ox + (h2(i, seed, 2) - 0.5) * r) * s, (oy + (h2(i, seed, 3) - 0.5) * r) * s, 8 * s, 0, TAU); x.strokeStyle = 'rgba(120,110,80,0.6)'; x.stroke(); }
      x.beginPath(); x.arc((ox - r * 0.4) * s, (oy + r * 0.3) * s, (10 + 6 * Math.abs(Math.sin(t))) * s, 0, TAU); x.strokeStyle = 'rgba(90,110,130,0.7)'; x.stroke(); };
    const ox = -cx, oy = -cy;
    if (k <= 0.01) one(ox, oy, 230, 3, [[20, -10]]);
    else if (k < 0.55) { const d = 140 * k; one(ox - d, oy, 210 - 40 * k, 3, [[-30 * k, -10], [30 * k + 10, 10]]); one(ox + d, oy, 210 - 40 * k, 5, []); }
    else { const d = 80 + 260 * (k - 0.5); one(ox - d, oy, 180, 3, [[0, 0]]); one(ox + d, oy, 180, 5, [[0, 0]]); }
  },
  // starch grains in potato: big cells packed with oval grains with rings around a point; iodine turns them blue-black
  potato(x, cx, cy, s, R, st) {
    const G = 150, span = R / s + 160, io = st.stain === 'iodine';
    for (let j = Math.floor((cy - span) / G); j <= Math.ceil((cy + span) / G); j++) for (let i = Math.floor((cx - span) / G); i <= Math.ceil((cx + span) / G); i++) {
      const x0 = (i * G - cx) * s, y0 = (j * G - cy) * s; x.strokeStyle = 'rgba(140,120,90,0.5)'; x.lineWidth = Math.max(1, 1.5 * s); x.strokeRect(x0, y0, G * s, G * s);
      for (let k = 0; k < 7; k++) { const gx = x0 + (0.15 + 0.7 * h2(i * 7 + k, j, 1)) * G * s, gy = y0 + (0.15 + 0.7 * h2(i * 7 + k, j, 2)) * G * s, r = (12 + h2(i * 7 + k, j, 3) * 20) * s, a = h2(k, i + j, 4) * TAU;
        x.beginPath(); x.ellipse(gx, gy, r, r * 0.75, a, 0, TAU); x.fillStyle = io ? 'rgba(25,20,70,0.85)' : 'rgba(250,250,240,0.55)'; x.fill(); x.strokeStyle = io ? 'rgba(10,10,40,0.9)' : 'rgba(150,140,120,0.7)'; x.stroke();
        if (s > 0.5) for (let q = 1; q < 4; q++) { x.beginPath(); x.ellipse(gx - r * 0.25, gy, r * (1 - q * 0.22), r * 0.75 * (1 - q * 0.22), a, 0, TAU); x.strokeStyle = io ? 'rgba(80,80,160,0.5)' : 'rgba(170,160,140,0.5)'; x.stroke(); } }
    }
  },
  // bread mould (Rhizopus): threads (hyphae) and upright stalks ending in round black spore cases
  mould(x, cx, cy, s, R, st) {
    x.lineCap = 'round';
    for (let k = 0; k < 26; k++) { let px = ((h2(k, 1, 1) - 0.5) * 3000 - cx) * s, py = ((h2(k, 2, 1) - 0.5) * 3000 - cy) * s, a = h2(k, 3, 1) * TAU;
      x.beginPath(); x.moveTo(px, py); for (let i = 0; i < 30; i++) { a += (h2(k, i, 4) - 0.5) * 0.5; px += Math.cos(a) * 60 * s; py += Math.sin(a) * 60 * s; x.lineTo(px, py); }
      x.strokeStyle = 'rgba(200,200,190,0.7)'; x.lineWidth = Math.max(1, 8 * s); x.stroke(); }
    for (let k = 0; k < 30; k++) { const px = ((h2(k, 5, 2) - 0.5) * 3000 - cx) * s, py = ((h2(k, 6, 2) - 0.5) * 3000 - cy) * s, a = h2(k, 7, 2) * TAU, L = (200 + h2(k, 8, 2) * 300) * s;
      x.beginPath(); x.moveTo(px, py); x.lineTo(px + Math.cos(a) * L, py + Math.sin(a) * L); x.strokeStyle = 'rgba(190,185,170,0.8)'; x.lineWidth = Math.max(1, 10 * s); x.stroke();
      x.beginPath(); x.arc(px + Math.cos(a) * L, py + Math.sin(a) * L, 55 * s, 0, TAU); x.fillStyle = 'rgba(25,25,25,0.92)'; x.fill();
      if (s > 0.4) for (let i = 0; i < 14; i++) { x.beginPath(); x.arc(px + Math.cos(a) * L + (h2(i, k, 9) - 0.5) * 80 * s, py + Math.sin(a) * L + (h2(i, k, 10) - 0.5) * 80 * s, 4 * s, 0, TAU); x.fillStyle = 'rgba(80,80,70,0.9)'; x.fill(); } }
  },
  // Hydra with a bud growing from its side (a permanent, stained slide)
  hydra(x, cx, cy, s, R, st) {
    const body = (ox, oy, L, W, a, tent) => { x.save(); x.translate(ox * s, oy * s); x.rotate(a);
      x.beginPath(); x.moveTo(-W * s, 0); x.quadraticCurveTo(-W * 1.1 * s, -L * 0.5 * s, -W * 0.7 * s, -L * s); x.lineTo(W * 0.7 * s, -L * s); x.quadraticCurveTo(W * 1.1 * s, -L * 0.5 * s, W * s, 0); x.closePath();
      x.fillStyle = 'rgba(200,110,140,0.75)'; x.fill(); x.strokeStyle = 'rgba(120,40,70,0.9)'; x.lineWidth = Math.max(1, 6 * s); x.stroke();
      for (let i = 0; i < tent; i++) { const b = -0.9 + (i / (tent - 1)) * 1.8; x.beginPath(); x.moveTo(b * W * 0.6 * s, -L * s); x.quadraticCurveTo((b * W * 0.6 + b * 120) * s, (-L - 180) * s, (b * W + b * 260) * s, (-L - 320) * s); x.lineWidth = Math.max(1, 12 * s); x.stroke(); }
      x.restore(); };
    body(-cx, 900 - cy, 1500, 160, 0, 6); body(150 - cx, 300 - cy, 450, 80, 1.0, 4);
  },
  // permanent slides of tissues: st.slide is one of parenchyma, xylem, muscle, neuron, blood
  tissue(x, cx, cy, s, R, st) {
    const k = st.slide || 'parenchyma';
    if (k === 'parenchyma') { const G = 70, span = R / s + 80; for (let j = Math.floor((cy - span) / G); j <= Math.ceil((cy + span) / G); j++) for (let i = Math.floor((cx - span) / G); i <= Math.ceil((cx + span) / G); i++) {
      blob(x, (i * G + (j % 2) * 35 - cx) * s, (j * G * 0.9 - cy) * s, 34 * s, 10, 0.08, i * 9 + j); x.fillStyle = 'rgba(250,215,225,0.35)'; x.fill(); x.strokeStyle = 'rgba(190,50,90,0.85)'; x.lineWidth = Math.max(1, 2.2 * s); x.stroke();
      x.beginPath(); x.arc((i * G + (j % 2) * 35 + 12 - cx) * s, (j * G * 0.9 - 8 - cy) * s, 6 * s, 0, TAU); x.fillStyle = 'rgba(150,30,70,0.7)'; x.fill(); } return; }
    if (k === 'xylem') { for (let v = -6; v <= 6; v++) { const x0 = (v * 120 - cx) * s, W = (50 + h2(v, 1, 1) * 30) * s; x.fillStyle = 'rgba(255,240,230,0.35)'; x.fillRect(x0, -R, W, 2 * R); x.strokeStyle = 'rgba(180,40,80,0.9)'; x.lineWidth = Math.max(1, 3 * s); x.strokeRect(x0, -R - 10, W, 2 * R + 20);
      const pitch = (v % 3 === 0 ? 14 : 26) * s; x.lineWidth = Math.max(1, 3.5 * s); for (let y = -R - ((cy * s) % pitch); y < R; y += pitch) { x.beginPath(); if (v % 3 === 0) { x.moveTo(x0, y); x.lineTo(x0 + W, y + pitch * 0.6); } else { x.ellipse(x0 + W / 2, y, W / 2, 3 * s, 0, 0, TAU); } x.stroke(); } } return; }
    if (k === 'muscle') { for (let f = -8; f <= 8; f++) { const y0 = (f * 60 - cy) * s, W = 52 * s; x.fillStyle = 'rgba(220,120,140,0.6)'; x.fillRect(-R, y0, 2 * R, W); x.strokeStyle = 'rgba(150,40,70,0.9)'; x.lineWidth = Math.max(1, 1.5 * s); x.strokeRect(-R - 5, y0, 2 * R + 10, W);
      const pitch = 2.5 * s; if (pitch > 1.5) { x.strokeStyle = 'rgba(110,30,60,0.55)'; x.lineWidth = Math.max(0.7, 1.1 * s); for (let xx = -R - ((cx * s) % (pitch * 2)); xx < R; xx += pitch * 2) { x.beginPath(); x.moveTo(xx, y0 + 2); x.lineTo(xx, y0 + W - 2); x.stroke(); } }
      for (let n = -6; n <= 6; n++) { x.beginPath(); x.ellipse((n * 150 + h2(n, f, 1) * 80 - cx) * s, y0 + (h2(n, f, 2) > 0.5 ? 6 : W / s - 6) * s, 14 * s, 4 * s, 0, 0, TAU); x.fillStyle = 'rgba(70,20,90,0.85)'; x.fill(); } } return; }
    if (k === 'neuron') { x.lineCap = 'round'; const ox = -cx * s, oy = -cy * s; x.strokeStyle = 'rgba(90,40,110,0.85)';
      for (let d = 0; d < 7; d++) { let a = (d / 7) * TAU + 0.3, px = ox, py = oy; x.lineWidth = Math.max(1, 10 * s); x.beginPath(); x.moveTo(px, py); for (let i = 0; i < 6; i++) { a += (h2(d, i, 1) - 0.5) * 0.7; px += Math.cos(a) * 45 * s; py += Math.sin(a) * 45 * s; x.lineTo(px, py); } x.stroke(); }
      x.lineWidth = Math.max(1, 14 * s); x.beginPath(); x.moveTo(ox, oy); x.bezierCurveTo(ox + 300 * s, oy + 60 * s, ox + 600 * s, oy - 80 * s, ox + 1200 * s, oy + 40 * s); x.stroke(); // the axon
      x.beginPath(); x.arc(ox, oy, 55 * s, 0, TAU); x.fillStyle = 'rgba(130,60,150,0.9)'; x.fill(); x.beginPath(); x.arc(ox + 8 * s, oy - 4 * s, 18 * s, 0, TAU); x.fillStyle = 'rgba(230,200,240,0.9)'; x.fill(); x.beginPath(); x.arc(ox + 10 * s, oy - 5 * s, 6 * s, 0, TAU); x.fillStyle = 'rgba(60,20,80,0.9)'; x.fill(); return; }
    if (k === 'blood') { const G = 9, span = R / s + 10; for (let j = Math.floor((cy - span) / G); j <= Math.ceil((cy + span) / G); j++) for (let i = Math.floor((cx - span) / G); i <= Math.ceil((cx + span) / G); i++) {
      const px = (i * G + h2(i, j, 1) * 4 - cx) * s, py = (j * G + h2(i, j, 2) * 4 - cy) * s; if (h2(i, j, 3) < 0.08) continue;
      if (h2(i, j, 4) > 0.997) { x.beginPath(); x.arc(px, py, 6 * s, 0, TAU); x.fillStyle = 'rgba(200,190,230,0.9)'; x.fill(); for (let l = 0; l < 3; l++) { x.beginPath(); x.arc(px + (l - 1) * 2.5 * s, py + (l % 2) * 1.5 * s, 1.8 * s, 0, TAU); x.fillStyle = 'rgba(80,30,140,0.95)'; x.fill(); } continue; } // a white cell (neutrophil)
      if (h2(i, j, 4) > 0.99) { x.beginPath(); x.arc(px, py, 1.2 * s, 0, TAU); x.fillStyle = 'rgba(120,60,150,0.8)'; x.fill(); continue; } // a platelet
      x.beginPath(); x.arc(px, py, 3.8 * s, 0, TAU); x.fillStyle = 'rgba(230,120,130,0.8)'; x.fill(); if (s > 2) { x.beginPath(); x.arc(px, py, 1.6 * s, 0, TAU); x.fillStyle = 'rgba(245,190,195,0.8)'; x.fill(); } } }
  },
};

// ---------------------------------------------------------------------------------------------- real photographs
// What the eyepiece shows is real: photographs taken through microscopes (sources and licences in micro/credits.json,
// shown on the credits page; how they were cut and scaled in devtools/micro/plates.py). Each specimen has square
// "plates" at different magnifications, [file, micrometres across]; the view takes the plate that just covers the
// field of the objective, crops it to the field, blurs it as far as the focus is off, and, when the photo was taken
// unstained, colours it the way the stain colours the real thing. Living things (Paramecium, Amoeba) are cut out of
// photographs and move over a photograph of their water.
export const PLATES = {
  // [file, width in µm, (stain the photo shows | 'own')]; v: films; sw: swimmers cut out of photos; seek: a film
  // stepped by a value of the experiment (plasmolysis follows the salt) instead of playing
  onion: { p: [['onion_4', 2800], ['onion_10', 1120], ['onion_40', 294]], stain0: 'none' },
  cheek: { p: [['cheek_4', 2800], ['cheek_10', 1120], ['cheek_40', 290]], stain0: 'mblue' },
  yeast: { p: [['yeast_10', 1120], ['yeast_40', 290], ['yeast_100', 105]], stain0: 'none' },
  curd: { p: [['curd_40', 290], ['curd_100', 115]], stain0: 'mblue' },
  stomata: { p: [['stoma_10', 1120, 'none'], ['stoma_40', 290, 'own']], stain0: 'none' },
  spirogyra: { p: [['spiro_10', 1120], ['spiro_40', 300]], stain0: 'own' },
  potato: { p: [['potato_40', 290, 'none'], ['potato_io_40', 290, 'iodine']], stain0: 'none' },
  mould: { p: [['mould_4', 2800], ['mould_10', 1120]], stain0: 'own' },
  hydra: { p: [['hydra_4', 2800], ['hydra_10', 1120]], stain0: 'own' },
  paramecium: { p: [['pond_4', 2800], ['pond_10', 1120]], v: [['para_v', 290]], stain0: 'own',
    sw: { f: ['para_s1', 'para_s2', 'para_s3', 'para_s4'], um: 230, n: 16, speed: 220, minField: 1000 } },
  amoeba: { p: [['amoeba_10', 1120]], v: [['amoeba_v', 330]], stain0: 'own' },
  rhoeo: { p: [], v: [['plas_v', 380]], seek: 'salt', stain0: 'own' },
  amoeba_split: { p: [], split: 1, stain0: 'own' },
  tissue_parenchyma: { p: [['pith_10', 1120], ['pith_40', 300]], stain0: 'own' },
  tissue_xylem: { p: [['xylem_10', 1120], ['xylem_40', 300]], stain0: 'own' },
  tissue_muscle: { p: [['muscle_40', 300], ['muscle_100', 120]], stain0: 'own' },
  tissue_neuron: { p: [['neuron_10', 1120]], stain0: 'own' },
  tissue_blood: { p: [['blood_40', 300], ['blood_100', 115]], stain0: 'own' },
};
const TINT = { safranin: 'rgb(200,30,80)', mblue: 'rgb(40,80,200)', iodine: 'rgb(170,105,15)' };
let EPOCH = 0; const IMG = {}, VID = {};
// a plate's picture (null until it has loaded; the view redraws itself when it arrives)
export function plateImg(f, cb) {
  let e = IMG[f];
  if (!e) { e = IMG[f] = { img: new Image(), ok: false, cbs: [] }; e.img.decoding = 'async';
    e.img.onload = () => { e.ok = true; EPOCH++; e.cbs.splice(0).forEach((c) => c(e.img)); }; e.img.onerror = () => console.warn('plate', f); e.img.src = 'micro/' + f + '.webp'; }
  if (e.ok) return e.img; if (cb) e.cbs.push(cb); return null;
}
// a short film of a living specimen (muted, looping), played only while the view is shown
function plateVid(f) {
  let e = VID[f];
  if (!e) { const v = document.createElement('video'); v.muted = true; v.loop = true; v.playsInline = true; v.preload = 'auto'; v.setAttribute('playsinline', ''); v.setAttribute('muted', '');
    e = VID[f] = { v, ok: false, seeking: false }; v.addEventListener('loadeddata', () => { e.ok = true; EPOCH++; }); v.addEventListener('seeked', () => { e.seeking = false; EPOCH++; }); v.onerror = () => console.warn('film', f);
    // the whole film is read first and played from memory: it can then be stepped to any moment (plasmolysis follows
    // the salt) whatever server or offline cache it came from
    fetch('micro/' + f + '.webm').then((r) => (r.ok ? r.blob() : Promise.reject(r.status))).then((b) => { v.src = URL.createObjectURL(b); }).catch(() => { v.src = 'micro/' + f + '.webm'; }); }
  return e;
}
export function pauseFilms() { for (const e of Object.values(VID)) if (!e.v.paused) e.v.pause(); }
export const plateKey = (st) => (st.spec === 'tissue' ? 'tissue_' + (st.slide || 'parenchyma') : st.spec === 'amoeba' && st.split > 0 ? 'amoeba_split' : st.spec);
// which photograph or film to show for a field of F micrometres: the smallest that covers it, else the widest
function pick(D, F, st = {}) {
  let all = [...D.p.map(([f, um, s]) => ({ f, um, s, img: 1 })), ...(D.v || []).map(([f, um, s]) => ({ f, um, s, vid: 1 }))];
  const want = st.stain || 'none', same = all.filter((it) => it.s === want);
  if (same.length) all = all.filter((it) => it.s === want || !it.s || it.s === 'own'); else if (all.some((it) => it.s && it.s !== 'own')) all = all.filter((it) => it.s !== 'iodine' || want === 'iodine');
  let best = null; for (const it of all) if (it.um >= F * 0.92 && (!best || it.um < best.um)) best = it;
  return best || all.reduce((a, b) => (b.um > a.um ? b : a));
}
// draw a still photograph of specimen D into ctx Y (centred, clipped) for a field of F micrometres across 2R pixels
function drawPlate(Y, D, it, st, F, R) {
  const s = (2 * R) / F; const img = plateImg(it.f); if (!img) return false;
  const size = it.um * s, ox = -(st.cx || 0) * s, oy = -(st.cy || 0) * s;
  const n = Math.ceil((R + Math.hypot(ox, oy) - size / 2) / size); // mirrored copies around it if the plate is smaller than the field
  const s0 = it.s || D.stain0; const own = s0 === 'own' || st.stain === s0 || !st.stain;
  Y.save(); if (!own) Y.filter = st.stain === 'none' ? 'saturate(0.2) contrast(0.7) brightness(1.12)' : 'saturate(0) contrast(1.08) brightness(1.06)';
  for (let j = -n; j <= n; j++) for (let i = -n; i <= n; i++) { Y.save(); Y.translate(ox + i * size, oy + j * size); Y.scale(i % 2 ? -1 : 1, j % 2 ? -1 : 1); Y.drawImage(img, -size / 2, -size / 2, size, size); Y.restore(); }
  Y.restore();
  if (!own && TINT[st.stain]) { Y.save(); Y.globalCompositeOperation = 'color'; Y.globalAlpha = 0.72; Y.fillStyle = TINT[st.stain]; Y.fillRect(-R - 8, -R - 8, 2 * R + 16, 2 * R + 16); Y.restore(); }
  return true;
}
// one frame of a film (centred square crop) for a field of F micrometres
function drawFilm(X, it, st, F, R, cx0, cy0) {
  const e = plateVid(it.f); if (!e.ok) return false; const v = e.v;
  if (it.seek != null) { if (!v.paused) v.pause(); const dur = isFinite(v.duration) && v.duration > 0 ? v.duration : (it.dur || 8.8); const tgt = Math.min(Math.max(0, it.seek), 1) * Math.max(0, dur - 0.08); if (!e.seeking && Math.abs(v.currentTime - tgt) > 0.03) { e.seeking = true; v.currentTime = tgt; } }
  else if (v.paused) v.play().catch(() => {});
  const vw = v.videoWidth, vh = v.videoHeight, side = Math.min(vw, vh), k = F / it.um, src = side * k;
  const sx = vw / 2 + ((st.cx || 0) / it.um) * side - src / 2, sy = vh / 2 + ((st.cy || 0) / it.um) * side - src / 2;
  X.drawImage(v, Math.max(0, sx), Math.max(0, sy), Math.min(src, vw), Math.min(src, vh), cx0 - R, cy0 - R, 2 * R, 2 * R); return true;
}
// swimmers cut out of photographs (Paramecium at low power): each on a smooth wandering path, turning to face where it goes
function drawSwimmers(X, D, st, F, R, cx0, cy0) {
  const sw = D.sw, files = [].concat(sw.f); const s = (2 * R) / F, box = F * 1.5;
  for (let k = 0; k < sw.n; k++) {
    const img = plateImg(files[k % files.length]); if (!img) continue;
    const h = (q) => h2(k, q, 31); const sp = sw.speed * (0.6 + 0.8 * h(1)), t = st.t + h(2) * 50;
    const ang = h(3) * TAU + Math.sin(t * 0.35 + h(4) * 6) * 1.3 + Math.sin(t * 0.13 + h(5) * 6) * 2;
    // position: integrate the heading roughly (a sum of drifting directions), wrapped in a box larger than the field
    const px = h(6) * box + sp * (Math.cos(h(3) * TAU) * t + Math.sin(t * 0.35 + h(4) * 6) * 3), py = h(7) * box + sp * (Math.sin(h(3) * TAU) * t + Math.cos(t * 0.13 + h(5) * 6) * 3);
    const wx = ((((px - (st.cx || 0)) % box) + box) % box) - box / 2, wy = ((((py - (st.cy || 0)) % box) + box) % box) - box / 2;
    const L = sw.um * (0.85 + 0.3 * h(8)) * s, W = L * (img.height / img.width);
    X.save(); X.globalCompositeOperation = 'multiply'; X.translate(cx0 + wx * s, cy0 + wy * s); X.rotate(ang); X.scale(1, 0.92 + 0.08 * Math.sin(t * 6 + k)); X.drawImage(img, -L / 2, -W / 2, L, W); X.restore();
  }
}

// Amoeba dividing: one cut-out from a photograph pinches in the middle and the two halves pull apart (split 0…1)
function drawFission(Y, st, F, R) {
  const img = plateImg('amoeba_s'); if (!img) return false; const s = (2 * R) / F, k = Math.min(1, Math.max(0, st.split || 0));
  Y.fillStyle = 'rgb(176,176,170)'; Y.fillRect(-R, -R, 2 * R, 2 * R);
  const L = 420 * s, W = L * (img.height / img.width), gap = k * L * 0.55, ox = -(st.cx || 0) * s, oy = -(st.cy || 0) * s;
  for (const side of [-1, 1]) {
    Y.save(); Y.globalCompositeOperation = 'multiply'; Y.translate(ox + side * gap * 0.5, oy); Y.beginPath(); // each daughter keeps its own half, rounding off as it separates
    Y.rect(side < 0 ? -L : -gap * 0.2 * k, -W, L + gap * 0.2 * k, 2 * W); Y.clip();
    Y.scale(1 - 0.25 * k, 1 + 0.12 * k * Math.sin(side)); Y.rotate(side * 0.12 * k); Y.drawImage(img, -L / 2, -W / 2, L, W); Y.restore();
  }
  return true;
}

// ---------------------------------------------------------------------------------------------- the view in the eyepiece
// A round picture floating above the microscope (in the headset too), redrawn only when something changes (or, for a
// living specimen, a few times a second).
export class EyepieceView {
  constructor(size = 0.34) {
    this.c = document.createElement('canvas'); this.c.width = this.c.height = 640; this.x = this.c.getContext('2d');
    this.tex = new THREE.CanvasTexture(this.c); this.tex.colorSpace = THREE.SRGBColorSpace;
    this.mesh = new THREE.Mesh(new THREE.CircleGeometry(size / 2, 64), new THREE.MeshBasicMaterial({ map: this.tex, toneMapped: false, transparent: true }));
    this.mesh.renderOrder = 30; this.mesh.userData.noHit = true; this.key = ''; this.lab = null;
    const ring = new THREE.Mesh(new THREE.RingGeometry(size / 2, size / 2 + 0.012, 64), M(0x15171b, 0.4, 0.3)); ring.userData.noHit = true; ring.position.z = -0.0005; this.mesh.add(ring);
    this.cap = document.createElement('canvas'); this.cap.width = 640; this.cap.height = 96; this.capTex = new THREE.CanvasTexture(this.cap); this.capTex.colorSpace = THREE.SRGBColorSpace;
    const cm = new THREE.Mesh(new THREE.PlaneGeometry(size, size * 0.15), new THREE.MeshBasicMaterial({ map: this.capTex, transparent: true, toneMapped: false })); cm.position.y = -size / 2 - 0.035; cm.userData.noHit = true; this.mesh.add(cm); this.capMesh = cm;
  }
  // st: { spec, stain, obj, focus, light, t, salt, split, slide, cx, cy, caption }
  draw(st) {
    const X = this.x, Wd = 640, R = 300, O = OBJ[st.obj || 0];
    const D = st.spec ? PLATES[plateKey(st)] : null; const it = D && !D.split ? pick(D, O.field, st) : null;
    if (it && D.seek) it.seek = st[D.seek] || 0;
    const film = !!(it && it.vid && !D.seek), step = !!(it && it.vid && D.seek), swim = !!(D && D.sw && it && it.img && O.field >= D.sw.minField);
    const live = film || swim || (!D && (st.spec === 'paramecium' || st.spec === 'amoeba'));
    const tq = live ? Math.round(st.t * (film ? 24 : 15)) : 0; // living specimens are redrawn many times a second
    const key = JSON.stringify({ ...st, t: tq, e: EPOCH }); if (key === this.key) return; this.key = key;
    // the sharp still picture is drawn only when the specimen, stain, objective or place changes; turning the focus
    // only blurs it again (one blur, cheap)
    const has = !!(D || (st.spec && SPECIMENS[st.spec]));
    const skey = JSON.stringify({ ...st, focus: 0, light: 0, caption: '', t: D ? 0 : tq, e: EPOCH });
    if (has && !film && !step && skey !== this.skey) { this.skey = skey;
      const S = this.sc || (this.sc = document.createElement('canvas')); S.width = S.height = 640; const Y = S.getContext('2d'); Y.clearRect(0, 0, 640, 640);
      Y.save(); Y.beginPath(); Y.arc(320, 320, R + 4, 0, TAU); Y.clip(); Y.translate(320, 320);
      if (D) { if (!(D.split ? drawFission(Y, st, O.field, R + 4) : drawPlate(Y, D, it, st, O.field, R + 4))) this.skey = ''; } else SPECIMENS[st.spec](Y, st.cx || 0, st.cy || 0, (2 * R) / O.field, R + 4, st);
      Y.restore(); }
    X.setTransform(1, 0, 0, 1, 0, 0); X.clearRect(0, 0, Wd, Wd); X.save(); X.beginPath(); X.arc(320, 320, R, 0, TAU); X.clip();
    const lit = st.light ?? 1; X.fillStyle = `rgb(${Math.round(245 * lit)},${Math.round(242 * lit)},${Math.round(228 * lit)})`; X.fillRect(0, 0, Wd, Wd);
    if (has) {
      const sharp = SHARP[st.obj || 0]; const off = Math.abs((st.focus ?? 0) - sharp); const blur = Math.min(26, (off / O.dof) * 3.2);
      if (blur < 24) { X.filter = blur > 0.4 ? `blur(${blur.toFixed(1)}px)` : 'none'; X.globalAlpha = Math.max(0.15, 1 - blur / 30);
        if (film || step) { if (!drawFilm(X, it, st, O.field, R + 4, 320, 320)) this.key = ''; } else if (this.sc) X.drawImage(this.sc, 0, 0);
        if (swim) drawSwimmers(X, D, st, O.field, R + 4, 320, 320);
        X.filter = 'none'; X.globalAlpha = 1; }
      if (lit < 1) { X.fillStyle = `rgba(0,0,0,${(1 - lit).toFixed(2)})`; X.fillRect(0, 0, Wd, Wd); }
    }
    const g = X.createRadialGradient(320, 320, R * 0.6, 320, 320, R); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.35)'); X.fillStyle = g; X.fillRect(0, 0, Wd, Wd);
    X.restore(); X.beginPath(); X.arc(320, 320, R, 0, TAU); X.strokeStyle = '#000'; X.lineWidth = 12; X.stroke();
    this.tex.needsUpdate = true;
    const C = this.cap.getContext('2d'); C.clearRect(0, 0, 640, 96); C.fillStyle = 'rgba(12,15,22,0.88)'; C.beginPath(); C.roundRect(20, 8, 600, 80, 18); C.fill();
    C.fillStyle = '#f3eee6'; C.font = `700 34px ${FONT}`; C.textAlign = 'center'; C.textBaseline = 'middle'; C.fillText(st.caption || `${O.name} × 10 = ${O.x * 10}×`, 320, 49); this.capTex.needsUpdate = true;
  }
}

// ---------------------------------------------------------------------------------------------- the microscope
// A real laboratory microscope: Poly Haven's "Industrial Microscope" (CC0), cut into the parts that move (the stage with
// its condenser, the revolving nosepiece with its four objectives, the coarse and fine focus knobs on both sides) in
// devtools/models/microscope.py. The numbers below are the model's own (metres, before MS_SCALE).
const MS_URL = 'models/microscope_lab.glb', MS_SCALE = 0.84;
const MSG = { axisZ: 0.041, stageTop: 0.1543, pivot: V(0, 0.2241, 0.0611), U: V(0, 0.9116, -0.4111).normalize(), knobY: 0.1082, knobZ: -0.1071,
  coarseX: 0.047, fineX: 0.071, lamp: 0.0868, cond: 0.1496, travel: 0.026, eye: V(0.0323, 0.355, 0.1585) };
let msP = null;
export function loadMicroscope() {
  if (!msP) msP = import('three/addons/loaders/GLTFLoader.js').then(async ({ GLTFLoader }) => { const { MeshoptDecoder } = await import('three/addons/libs/meshopt_decoder.module.js');
    const g = await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).loadAsync(MS_URL); return g.scene; });
  return msP;
}
// a real scanned model (Poly Haven, CC0) put in place of the simple shape it replaces, once it has loaded
const realP = {};
function realModel(g, url, size, tint) {
  realP[url] = realP[url] || import('three/addons/loaders/GLTFLoader.js').then(async ({ GLTFLoader }) => { const { MeshoptDecoder } = await import('three/addons/libs/meshopt_decoder.module.js');
    return (await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).loadAsync(url)).scene; });
  realP[url].then((sc) => {
    const m = sc.clone(true); const b = new THREE.Box3().setFromObject(m), sz = b.getSize(V()), k = size / Math.max(sz.x, sz.y, sz.z);
    m.scale.setScalar(k); m.position.set(-(b.min.x + sz.x / 2) * k, -b.min.y * k, -(b.min.z + sz.z / 2) * k);
    m.traverse((c) => { if (c.isMesh) { c.castShadow = true; c.userData.noHit = false; if (tint) { c.material = c.material.clone(); c.material.color.multiply(new THREE.Color(tint)); } } });
    for (const c of [...g.children]) if (c.userData.placeholder) g.remove(c);
    g.add(m);
  }).catch(() => {});
}
export function microscope(o = {}) {
  const it = new Item('microscope', { ...o, name: o.name || { en: 'Compound microscope', hi: 'संयुक्त सूक्ष्मदर्शी', hg: 'Compound microscope' } });
  const g = it.g; const root = new THREE.Group(); root.scale.setScalar(MS_SCALE); g.add(root);
  // the moving parts are groups at their own pivots; the model's meshes go into them when it has loaded
  const stage = new THREE.Group(); root.add(stage);
  const turret = new THREE.Group(); turret.position.copy(MSG.pivot); root.add(turret); it.nose = turret;
  const knobs = {}; for (const [k, x] of [['coarseL', -MSG.coarseX], ['coarseR', MSG.coarseX], ['fineL', -MSG.fineX], ['fineR', MSG.fineX]]) { const n = new THREE.Group(); n.position.set(x, MSG.knobY, MSG.knobZ); root.add(n); knobs[k] = n; }
  it.coarseL = knobs.coarseL; it.coarseR = knobs.coarseR; it.fineL = knobs.fineL; it.fineR = knobs.fineR;
  // the colour ring of each objective (4× red, 10× yellow, 40× blue, 100× white), on the barrel 25 mm below the nosepiece
  const p0 = V(0, 0.2241, MSG.axisZ).sub(MSG.pivot), d0 = V(0, -1, 0);
  OBJ.forEach((ob, i) => { const q = new THREE.Quaternion().setFromAxisAngle(MSG.U, (i - 1) * Math.PI / 2); const d = d0.clone().applyQuaternion(q);
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.01195, 0.01195, 0.0026, 32, 1, true), M(ob.col, 0.45, 0.1, { side: THREE.DoubleSide }));
    band.position.copy(p0.clone().applyQuaternion(q).addScaledVector(d, 0.025)); band.quaternion.setFromUnitVectors(V(0, 1, 0), d); band.userData.noHit = true; turret.add(band); });
  // light: the lamp's lens in the base and the condenser's top lens under the stage hole glow when the lamp is on
  const glow = (r, op) => new THREE.Mesh(new THREE.CircleGeometry(r, 28).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xfff4d6, transparent: true, opacity: op, depthWrite: false, toneMapped: false }));
  const lens = glow(0.0115, 0.9); lens.position.set(0, MSG.lamp, MSG.axisZ); root.add(lens); it.bulb = lens;
  const cond = glow(0.0056, 1); cond.position.set(0, MSG.cond, MSG.axisZ); stage.add(cond);
  const eye = new THREE.Object3D(); eye.position.copy(MSG.eye); root.add(eye); it.eyepiece = eye;
  it.ready = loadMicroscope().then((src) => {
    if (it.disposed) return; const m = src.clone(true); m.updateMatrixWorld(true);
    const put = (name, into, keepPos) => { const n = m.getObjectByName(name); if (!n) return; n.parent.remove(n); if (!keepPos) n.position.set(0, 0, 0); into.add(n); };
    put('stage', stage, true); put('turret', turret, false); for (const k of Object.keys(knobs)) put(k, knobs[k], false);
    put('body', root, true);
    root.traverse((x) => { if (x.isMesh) { x.castShadow = true; x.receiveShadow = true; } });
    applyObj(); it.setFocus(it.coarse, it.fine); it.loaded = true;
  }).catch((e) => console.warn('microscope model', e));
  it.obj = 0; it.focus = 0.12; it.coarse = 0.12; it.fine = 0; it.light = 1; it.stageY = 0;
  // the nosepiece turns to its target (the short way round), with a click at each objective
  let turn = 0, turnTo = 0; const qT = new THREE.Quaternion();
  const applyObj = () => turret.quaternion.setFromAxisAngle(MSG.U, turn);
  it.setObj = (i, now) => { const n = OBJ.length; const b = ((i % n) + n) % n; const dd = ((b - it.obj + n + n / 2) % n) - n / 2; turnTo += -dd * Math.PI / 2; it.obj = b; if (now || !it.loaded) { turn = turnTo; applyObj(); } };
  turnTo = turn = Math.PI / 2; // objective 0 (4×) in place
  const setStage = (k) => { const dy = (k - 0.47) * MSG.travel; stage.position.y = dy; it.stageY = (MSG.stageTop + dy) * MS_SCALE; if (it.slide && it.slide.onStage && !it.slide.held) it.slide.g.position.copy(it.stagePoint()); };
  it.setFocus = (coarse, fine = it.fine) => { it.coarse = clamp(coarse, 0, 1); it.fine = clamp(fine, -1, 1); it.focus = clamp(it.coarse + it.fine * 0.04, 0, 1); setStage(it.focus);
    const a = it.coarse * 12, b = it.fine * 6; knobs.coarseL.rotation.x = knobs.coarseR.rotation.x = a; knobs.fineL.rotation.x = knobs.fineR.rotation.x = b; };
  it.setLight = (v) => { it.light = clamp(v, 0, 1); lens.material.opacity = 0.9 * it.light; cond.material.opacity = it.light; lens.visible = cond.visible = it.light > 0.02; };
  applyObj(); it.setFocus(it.focus);
  it.height = 0.4; it.radius = 0.1; it.noGrab = true; it.noPhys = true; it.base = 0;
  // where things are, in the microscope's own frame (for the bench layout) and in the world
  it.knobAt = (kind, side = 1) => V(side * (kind === 'fine' ? 0.08 : 0.062), MSG.knobY, MSG.knobZ).multiplyScalar(MS_SCALE);
  it.knobR = (kind) => (kind === 'fine' ? 0.017 : 0.027) * MS_SCALE;
  it.stagePoint = () => { g.updateMatrixWorld(true); return g.localToWorld(V(0, it.stageY + 0.0003, MSG.axisZ * MS_SCALE)); };
  // the view
  it.view = new EyepieceView(o.viewSize || 0.34); it.view.mesh.position.set(0, 0.55, 0.02); g.add(it.view.mesh);
  it.view.mesh.visible = false; it.state = { spec: null, stain: 'none', cx: 0, cy: 0, t: 0 };
  it.look = (on = true) => { it.view.mesh.visible = on; if (!on) pauseFilms(); it.redraw(); };
  it.redraw = () => { const s = it.slide && it.slide.onStage ? it.slide : null; it.view.draw({ spec: s ? s.spec : null, stain: s ? s.stain : 'none', obj: it.obj, focus: it.focus, light: it.light, t: it.state.t, salt: s ? s.salt || 0 : 0, split: s ? s.split || 0 : 0, slide: s ? s.slideKind : null, open: s ? s.open : 1, cx: it.state.cx, cy: it.state.cy, caption: it.caption ? it.caption() : '' }); };
  const up0 = it.update; it.update = (dt, t) => { if (up0) up0(dt, t); it.state.t += dt || 0;
    if (turn !== turnTo) { const st = Math.min(Math.abs(turnTo - turn), (dt || 0.016) * 5.5); turn += Math.sign(turnTo - turn) * st; applyObj(); }
    if (it.view.mesh.visible) it.redraw(); };
  it.turning = () => turn !== turnTo;
  it.sharpness = () => { const off = Math.abs(it.focus - SHARP[it.obj]); return clamp(1 - off / (OBJ[it.obj].dof * 4), 0, 1); };
  it.sharpAt = (i = it.obj) => SHARP[i];
  return it;
}

// ---------------------------------------------------------------------------------------------- slides and tools
const glass = () => new THREE.MeshPhysicalMaterial({ color: 0xdff3f2, roughness: 0.08, metalness: 0, transmission: 0.6, transparent: true, opacity: 0.45, thickness: 0.001 });
function specTex(spec, stain, st = {}) { // a small picture of the specimen for the patch on the slide
  const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
  x.fillStyle = 'rgba(0,0,0,0)'; x.clearRect(0, 0, 128, 128); x.save(); x.beginPath(); x.arc(64, 64, 60, 0, TAU); x.clip(); x.translate(64, 64);
  if (SPECIMENS[spec]) SPECIMENS[spec](x, 0, 0, 60 / 1500, 60, { stain, t: 0, ...st }); x.restore();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
// a glass slide; spec: what is on it (or null), label: the sticker of a permanent slide
export function slide(o = {}) {
  const it = new Item('slide', { ...o, name: o.name || { en: 'Glass slide', hi: 'काँच की स्लाइड', hg: 'Glass slide' } });
  const m = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.0012, 0.025), glass()); m.position.y = 0.0006; it.g.add(m);
  it.patch = new THREE.Mesh(new THREE.CircleGeometry(0.008, 24).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false })); it.patch.position.y = 0.0013; it.patch.visible = false; it.g.add(it.patch);
  it.cover = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.0004, 0.022), glass()); it.cover.position.y = 0.0016; it.cover.visible = false; it.g.add(it.cover);
  if (o.label) { const c = document.createElement('canvas'); c.width = 128; c.height = 128; const x = c.getContext('2d'); x.fillStyle = '#f6f0dc'; x.fillRect(0, 0, 128, 128); x.fillStyle = '#222'; x.font = `700 30px ${FONT}`; x.textAlign = 'center'; x.textBaseline = 'middle';
    String(o.label).split(' ').slice(0, 3).forEach((w, i, a) => x.fillText(w, 64, 64 + (i - (a.length - 1) / 2) * 34)); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    const lab = new THREE.Mesh(new THREE.PlaneGeometry(0.02, 0.02).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: t })); lab.position.set(-0.026, 0.0014, 0); it.g.add(lab); }
  it.spec = null; it.stain = 'none'; it.salt = 0; it.split = 0; it.open = 1; it.slideKind = o.slideKind || null;
  it.setSpec = (spec, stain = it.stain, st = {}) => { it.spec = spec; it.stain = stain; Object.assign(it, st); it.patch.visible = !!spec; if (spec) { it.patch.material.map && it.patch.material.map.dispose(); it.patch.material.map = specTex(spec, stain, { slide: it.slideKind, ...st }); it.patch.material.needsUpdate = true; } };
  if (o.spec) it.setSpec(o.spec, o.stain || 'none', o.st || {});
  if (o.covered) it.cover.visible = true;
  it.height = 0.004; it.radius = 0.04; it.layH = 0.0006; it.grabY = 0.002; it.noPhys = true;
  return it;
}
// a dropper bottle of a stain or a liquid
export function dropperBottle(o = {}) {
  const it = new Item('dropbottle', { ...o, name: o.name || { en: 'Dropper bottle', hi: 'ड्रॉपर वाली बोतल', hg: 'Dropper bottle' } });
  const col = o.color ?? 0xc23a5a;
  const pts = [[0, 0], [0.016, 0], [0.017, 0.004], [0.017, 0.04], [0.01, 0.05], [0.007, 0.052]].map(([a, b]) => new THREE.Vector2(a, b));
  const b = new THREE.Mesh(new THREE.LatheGeometry(pts, 24), new THREE.MeshPhysicalMaterial({ color: 0x8a5a2a, roughness: 0.2, transmission: 0.3, transparent: true, opacity: 0.85 })); it.g.add(b);
  const liq = new THREE.Mesh(new THREE.CylinderGeometry(0.0155, 0.0155, 0.03, 20), M(col, 0.3, 0, { transparent: true, opacity: 0.85 })); liq.position.y = 0.017; it.g.add(liq);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.008, 16, 10), M(0x2a2a2a, 0.6)); bulb.scale.y = 1.5; bulb.position.y = 0.064; it.g.add(bulb);
  const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.0015, 0.03, 10), glass()); tip.position.y = 0.04; it.g.add(tip);
  if (o.label) { const c = document.createElement('canvas'); c.width = 256; c.height = 96; const x = c.getContext('2d'); x.fillStyle = '#f6f0dc'; x.fillRect(0, 0, 256, 96); x.fillStyle = '#222'; x.font = `700 34px ${FONT}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(o.label, 128, 48);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; const l = new THREE.Mesh(new THREE.CylinderGeometry(0.0172, 0.0172, 0.014, 24, 1, true, -0.9, 1.8), new THREE.MeshBasicMaterial({ map: t })); l.position.y = 0.022; it.g.add(l); }
  it.color = col; it.height = 0.075; it.radius = 0.018; it.grabY = 0.06;
  return it;
}
// a falling drop, from a point to a point (for the dropper and the needle)
export function dropFx(scene, from, to, color, done) {
  const d = new THREE.Mesh(new THREE.SphereGeometry(0.0025, 10, 8), M(color, 0.2, 0, { transparent: true, opacity: 0.9 })); d.position.copy(from); scene.add(d); let t = 0;
  const step = () => { t += 0.05; d.position.lerpVectors(from, to, Math.min(1, t * t)); if (t < 1) requestAnimationFrame(step); else { scene.remove(d); d.geometry.dispose(); done && done(); } }; step();
}
export function watchGlass(o = {}) {
  const it = new Item('watchglass', { ...o, name: o.name || { en: 'Watch glass of water', hi: 'पानी वाला वॉच ग्लास', hg: 'Paani wala watch glass' } });
  const pts = []; for (let i = 0; i <= 12; i++) { const u = i / 12; pts.push(new THREE.Vector2(u * 0.04, 0.012 * u * u + 0.001)); }
  it.g.add(new THREE.Mesh(new THREE.LatheGeometry(pts, 32), new THREE.MeshPhysicalMaterial({ color: 0xe8f4f4, roughness: 0.05, transmission: 0.7, transparent: true, opacity: 0.4, side: THREE.DoubleSide })));
  it.liquid = new THREE.Mesh(new THREE.CircleGeometry(0.03, 32).rotateX(-Math.PI / 2), M(o.color ?? 0xbfe3ea, 0.05, 0, { transparent: true, opacity: 0.55 })); it.liquid.position.y = 0.007; it.g.add(it.liquid);
  it.height = 0.014; it.radius = 0.042; it.noPhys = true; return it;
}
// a simple tool lying on the bench: forceps, needle, brush, toothpick, blotting paper
export function tool(kind, o = {}) {
  const N = { forceps: { en: 'Forceps', hi: 'चिमटी', hg: 'Forceps (chimti)' }, needle: { en: 'Needle', hi: 'सुई', hg: 'Needle (sui)' }, brush: { en: 'Fine brush', hi: 'बारीक ब्रश', hg: 'Fine brush' }, toothpick: { en: 'Clean toothpick', hi: 'साफ़ टूथपिक', hg: 'Saaf toothpick' }, blotter: { en: 'Blotting paper', hi: 'सोख्ता कागज़', hg: 'Blotting paper' }, coverslip: { en: 'Cover slip', hi: 'कवर स्लिप', hg: 'Cover slip' } };
  const it = new Item(kind, { ...o, name: o.name || N[kind] });
  const steel = M(0xc9ccd2, 0.25, 0.9), wood = M(0xb88a55, 0.6);
  if (kind === 'forceps') { for (const sd of [-1, 1]) { const a = new THREE.Mesh(new THREE.BoxGeometry(0.003, 0.002, 0.11), steel); a.position.set(sd * 0.003, 0.002, 0); a.rotation.y = sd * 0.03; it.g.add(a); } }
  else if (kind === 'needle') { const h = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.07, 10), wood); h.rotation.x = Math.PI / 2; h.position.set(0, 0.004, 0.03); it.g.add(h); const n = new THREE.Mesh(new THREE.CylinderGeometry(0.0007, 0.0002, 0.05, 6), steel); n.rotation.x = Math.PI / 2; n.position.set(0, 0.004, -0.03); it.g.add(n); }
  else if (kind === 'brush') { const h = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.1, 10), M(0xc23a3a, 0.5)); h.rotation.x = Math.PI / 2; h.position.y = 0.003; it.g.add(h); const b = new THREE.Mesh(new THREE.ConeGeometry(0.003, 0.012, 10), M(0x3a2a1a, 0.9)); b.rotation.x = -Math.PI / 2; b.position.set(0, 0.003, -0.056); it.g.add(b); }
  else if (kind === 'toothpick') { const t = new THREE.Mesh(new THREE.CylinderGeometry(0.0012, 0.0012, 0.065, 8), wood); t.rotation.x = Math.PI / 2; t.position.y = 0.0012; it.g.add(t); }
  else if (kind === 'blotter') { const p = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.001, 0.04), M(0xf2d6dc, 0.95)); p.position.y = 0.0005; it.g.add(p); }
  else if (kind === 'coverslip') { const p = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.0004, 0.022), glass()); p.position.y = 0.0002; it.g.add(p); }
  it.height = 0.006; it.radius = 0.04; it.grabY = 0.003; it.noPhys = true; return it;
}
// where a specimen comes from: a piece of onion, a Rhoeo leaf, a leaf, a potato, curd, a bread slice, a jar of pond water
export function source(kind, o = {}) {
  const N = { onion: { en: 'Onion', hi: 'प्याज़', hg: 'Pyaaz' }, rhoeo: { en: 'Rhoeo leaf', hi: 'रोईओ की पत्ती', hg: 'Rhoeo ki patti' }, leaf: { en: 'Fresh leaf', hi: 'ताज़ी पत्ती', hg: 'Taazi patti' }, potato: { en: 'Potato', hi: 'आलू', hg: 'Aloo' }, curd: { en: 'Curd', hi: 'दही', hg: 'Dahi' }, bread: { en: 'Mouldy bread', hi: 'फफूँद लगी ब्रेड', hg: 'Phaphoond lagi bread' }, pond: { en: 'Pond water', hi: 'तालाब का पानी', hg: 'Taalaab ka paani' }, yeast: { en: 'Yeast in sugar water', hi: 'चीनी के पानी में यीस्ट', hg: 'Cheeni ke paani mein yeast' } };
  const it = new Item('src_' + kind, { ...o, name: o.name || N[kind] }); const g = it.g;
  if (kind === 'onion') { realModel(g, 'models/yellow_onion.glb', 0.075); const a = new THREE.Mesh(new THREE.SphereGeometry(0.035, 24, 16, 0, Math.PI), M(0xd59a7a, 0.6)); a.rotation.z = Math.PI / 2; a.scale.set(1, 1.15, 1); a.position.y = 0.0; g.add(a); for (let i = 1; i < 4; i++) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.035 - i * 0.008, 0.0012, 6, 30, Math.PI), M(0xf2e6e0, 0.5)); r.rotation.set(-Math.PI / 2, 0, 0); r.position.y = 0.001; g.add(r); } it.height = 0.04; }
  else if (kind === 'rhoeo' || kind === 'leaf') { const s = new THREE.Shape(); s.moveTo(0, 0); s.quadraticCurveTo(0.025, 0.04, 0, 0.11); s.quadraticCurveTo(-0.025, 0.04, 0, 0); const m = new THREE.Mesh(new THREE.ShapeGeometry(s, 10).rotateX(-Math.PI / 2), M(kind === 'rhoeo' ? 0x6a3a7a : 0x3f8a2c, 0.6, 0, { side: THREE.DoubleSide })); m.position.set(0, 0.002, 0.05); g.add(m);
    if (kind === 'rhoeo') { const top = new THREE.Mesh(new THREE.ShapeGeometry(s, 10).rotateX(-Math.PI / 2), M(0x4a7a3a, 0.6)); top.position.set(0, 0.0025, 0.05); top.scale.set(0.9, 1, 0.9); g.add(top); } it.height = 0.005; }
  else if (kind === 'potato') { realModel(g, 'models/sweet_potato.glb', 0.085, 0xd9b48a); // a scanned sweet potato, recoloured to a potato's pale skin
    const p = new THREE.Mesh(new THREE.SphereGeometry(0.03, 20, 14), M(0xc89f62, 0.8)); p.scale.set(1.3, 0.7, 1); p.position.y = 0.02; g.add(p); const c = new THREE.Mesh(new THREE.CircleGeometry(0.025, 24).rotateX(-Math.PI / 2), M(0xf1e2b0, 0.7)); c.position.set(0.0, 0.041, 0); c.scale.set(1.2, 1, 0.8); g.add(c); it.height = 0.04; }
  else { const pts = [[0, 0], [0.03, 0], [0.032, 0.03], [0.034, 0.045]].map(([a, b]) => new THREE.Vector2(a, b)); g.add(new THREE.Mesh(new THREE.LatheGeometry(pts, 28), new THREE.MeshPhysicalMaterial({ color: 0xe8f0f0, roughness: 0.1, transmission: 0.6, transparent: true, opacity: 0.5, side: THREE.DoubleSide })));
    const fill = { curd: 0xf8f6ee, pond: 0x8aa86a, yeast: 0xe9dcb8, bread: 0xd9b88a }[kind] ?? 0xcccccc; const f = new THREE.Mesh(new THREE.CylinderGeometry(0.029, 0.029, 0.025, 24), M(fill, kind === 'curd' ? 0.6 : 0.2, 0, { transparent: kind !== 'curd', opacity: 0.85 })); f.position.y = 0.0135; g.add(f);
    if (kind === 'bread') { f.material.color.set(0xd4b07a); for (let i = 0; i < 9; i++) { const sp = new THREE.Mesh(new THREE.SphereGeometry(0.004, 8, 6), M(i % 3 ? 0x2a2a2a : 0x6a8a5a, 0.9)); sp.position.set((h2(i, 1, 1) - 0.5) * 0.04, 0.027, (h2(i, 2, 1) - 0.5) * 0.04); g.add(sp); } }
    it.height = 0.045; }
  if (kind === 'onion' || kind === 'potato') for (const c of g.children) if (!c.userData.real) c.userData.placeholder = true;
  it.radius = 0.04; it.noGrab = !!o.noGrab; it.noPhys = true; return it;
}
