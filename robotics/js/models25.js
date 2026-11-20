// DUET Robotics Lab 360, batch 25: the three resistive sensors (parts25.js), from their datasheet sizes (mm). Each stands
// in the breadboard on two pins 5.08 mm apart (the holes at x = 0 and x = 2P), as the LDR does.
//   fsr   FSR 402: a round pad 18.3 mm across on a flat tail, standing up, its pad facing the student; it dips when pressed
//   flex  a 2.2" flex strip (56 × 6.4 mm), standing up; it bends towards the student as the bend grows
//   ntc   a black epoxy bead 3 mm across on two thin leads
import * as THREE from 'three';
import { materials, box, cyl, shadows } from './models.js';
import { buildMQ2 } from './models3.js';

const P = 2.54;
const S = (o) => new THREE.MeshStandardMaterial(o);
let MM = null;
function mats() {
  if (MM) return MM; const M = materials();
  MM = { M, pad: S({ color: 0x2a2b2e, roughness: 0.55 }), ring: S({ color: 0x8c6a3c, roughness: 0.5, metalness: 0.3 }), tail: S({ color: 0xc89a52, roughness: 0.45, metalness: 0.2 }),
    strip: S({ color: 0x1d1e22, roughness: 0.4 }), ink: S({ color: 0xa9adb3, roughness: 0.35, metalness: 0.4 }), bead: S({ color: 0x141416, roughness: 0.3 }), lead: S({ color: 0xc7ccd2, metalness: 0.9, roughness: 0.3 }) };
  for (const m of Object.values(MM)) if (m.isMaterial) m.userData.shared = true;
  return MM;
}
const leg = (x, y0, y1, mat, w = 0.5) => box(w, y1 - y0, w, mat, x, (y0 + y1) / 2, 0);

export function buildFSR() {
  const K = mats(); const g = new THREE.Group(); const cx = P;
  g.add(leg(0, -6, 3, K.M.tin || K.lead)); g.add(leg(2 * P, -6, 3, K.M.tin || K.lead));
  g.add(box(2 * P + 2, 2, 1.4, K.strip, cx, 3, 0)); // the crimped pins' block
  g.add(box(7, 26, 0.35, K.tail, cx, 4 + 13, 0)); // the flat tail with its two silver tracks
  for (const s of [-1.6, 1.6]) g.add(box(0.8, 26, 0.1, K.ink, cx + s, 4 + 13, 0.22));
  const pad = new THREE.Group(); pad.position.set(cx, 40, 0); g.add(pad);
  const ring = cyl(9.15, 0.4, K.ring, 0, 0, 0, 32); ring.rotation.x = Math.PI / 2; pad.add(ring);
  const act = cyl(6.35, 0.5, K.pad, 0, 0, 0.1, 32); act.rotation.x = Math.PI / 2; pad.add(act);
  g.userData.update = (p) => { const k = 1 - 0.35 * Math.min(1, (p.state.grams || 0) / 1000); if (Math.abs(pad.scale.z - k) < 0.01) return false; pad.scale.z = k; act.position.z = 0.1 - (1 - k) * 0.6; return true; };
  shadows(g, true, false); return g;
}

export function buildFlex() {
  const K = mats(); const g = new THREE.Group(); const cx = P; const N = 8, L = 56 / N;
  g.add(leg(0, -6, 3, K.M.tin || K.lead)); g.add(leg(2 * P, -6, 3, K.M.tin || K.lead));
  g.add(box(2 * P + 2.4, 3, 1.6, K.strip, cx, 3.5, 0));
  // a chain of segments: each turns a little more about x, so the strip curls towards the student (+z)
  const segs = []; let parent = g; let y0 = 5;
  for (let i = 0; i < N; i++) { const s = new THREE.Group(); s.position.set(i ? 0 : cx, i ? L : y0, 0); parent.add(s); const b = box(6.4, L, 0.4, K.strip, 0, L / 2, 0); s.add(b); s.add(box(4.2, L, 0.05, K.ink, 0, L / 2, -0.23)); segs.push(s); parent = s; }
  g.userData.update = (p) => { const a = Math.max(0, Math.min(180, p.state.bend || 0)) * Math.PI / 180 / N; if (Math.abs(segs[1].rotation.x - a) < 1e-3) return false; segs.forEach((s, i) => { if (i) s.rotation.x = a; }); return true; };
  shadows(g, true, false); return g;
}

export function buildNTC() {
  const K = mats(); const g = new THREE.Group(); const cx = P; const lift = 7;
  for (const x of [0, 2 * P]) { g.add(leg(x, -6, lift - 1.2, K.lead, 0.4)); }
  g.add(box(2 * P, 0.4, 0.4, K.lead, cx, lift - 1.2, 0));
  const bead = new THREE.Mesh(new THREE.SphereGeometry(1.6, 16, 12), K.bead); bead.position.set(cx, lift, 0); bead.scale.set(1.2, 1, 0.9); g.add(bead);
  shadows(g, true, false); return g;
}

// header pins pointing down at z = 0 (the module's terminals), along x
const header = (K, n, x0, y) => { const g = new THREE.Group(); for (let i = 0; i < n; i++) { g.add(box(0.64, 6, 0.64, K.lead, x0 + i * P, y - 2, 0)); g.add(box(2.5, 2.5, 2.5, K.strip, x0 + i * P, y + 0.8, 0)); } return g; };
const standoffs = (K, pts) => pts.map(([x, z]) => cyl(1.4, 3, K.nylon, x, 1.5, z, 8));
function canvasMat(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return S({ map: t, roughness: 0.55 }); }

// RCWL-0516: a 35.9 × 17.3 mm board, its microwave antenna traces at the far end, the RCWL-9196 chip, five pins at the near edge
export function buildRCWL() {
  const K = mats(); K.nylon = K.nylon || S({ color: 0xe9e4d6, roughness: 0.6 }); const g = new THREE.Group(); const top = 4.6;
  g.add(header(K, 5, -2 * P, top));
  const pm = canvasMat(256, 512, (c, w, h) => { c.fillStyle = '#1f6f4a'; c.fillRect(0, 0, w, h); c.strokeStyle = '#d9c27a'; c.lineWidth = 9;
    c.beginPath(); for (let i = 0; i < 6; i++) { const y = 40 + i * 30; c.moveTo(30, y); c.lineTo(226, y); } c.stroke(); c.lineWidth = 14; c.strokeRect(24, 24, 208, 190);
    c.fillStyle = '#ffffff'; c.font = '700 30px sans-serif'; c.fillText('RCWL-0516', 40, 300); c.font = '600 22px sans-serif'; ['3V3', 'GND', 'OUT', 'VIN', 'CDS'].forEach((t, i) => { c.save(); c.translate(52 + i * 38, 480); c.rotate(-Math.PI / 2); c.fillText(t, 0, 8); c.restore(); }); });
  g.add(box(17.3, 1.6, 35.9, [K.strip, K.strip, pm, K.strip, K.strip, K.strip], 0, top - 0.8, -17.9));
  for (const m of standoffs(K, [[-7, -33], [7, -33], [-7, -4], [7, -4]])) g.add(m);
  g.add(box(5, 1.5, 6, K.bead, 3, top + 0.75, -20)); g.add(box(2.4, 1, 2.4, K.bead, -4, top + 0.5, -21)); g.add(box(3, 2.2, 1.6, S({ color: 0xc9a85a, metalness: 0.6, roughness: 0.4 }), -4, top + 1.1, -14));
  shadows(g, true, false); return g;
}
// the red water level sensor (62 × 20 mm), standing in a clear cup: its header at the top, its ten tracks down in the water
export function buildWaterLevel() {
  const K = mats(); const g = new THREE.Group(); const yTop = 74, L = 62, z = -4;
  g.add(header(K, 3, -P, yTop)); // (S, +, −)
  const pm = canvasMat(160, 512, (c, w, h) => { c.fillStyle = '#c42a24'; c.fillRect(0, 0, w, h); c.fillStyle = '#d8d2c4'; for (let i = 0; i < 10; i++) c.fillRect(14 + i * 13.5, 170, 6, 330); c.fillStyle = '#ffffff'; c.font = '700 22px sans-serif'; c.fillText('S  +  −', 30, 40); c.font = '600 18px sans-serif'; c.fillText('WATER', 44, 110); c.fillText('SENSOR', 40, 135); });
  const board = new THREE.Mesh(new THREE.BoxGeometry(20, L, 1.6), [K.strip, K.strip, K.strip, K.strip, pm, K.strip]); board.position.set(0, yTop - 3 - L / 2, z); g.add(board);
  g.add(box(14, 2, 4, K.strip, 0, yTop - 2.5, z)); // (the header's block)
  const cupM = new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.22, roughness: 0.05, side: THREE.DoubleSide, depthWrite: false });
  const cup = new THREE.Mesh(new THREE.CylinderGeometry(19, 16, 52, 28, 1, true), cupM); cup.position.set(0, 26, z); g.add(cup);
  const base = cyl(16, 1.2, cupM, 0, 0.6, z, 28); g.add(base);
  const waterM = new THREE.MeshStandardMaterial({ color: 0x3a8fd8, transparent: true, opacity: 0.55, roughness: 0.1, depthWrite: false });
  const water = new THREE.Mesh(new THREE.CylinderGeometry(17.6, 16, 1, 28), waterM); water.position.set(0, 1.2, z); g.add(water);
  const bottom = yTop - 3 - L; // the board's lowest point
  g.userData.update = (p) => { const d = Math.max(0, Math.min(40, p.state.depth || 0)); const hgt = Math.max(0.01, bottom + d - 1.2); if (Math.abs(water.scale.y - hgt) < 0.05) return false; water.scale.y = hgt; water.position.y = 1.2 + hgt / 2; water.visible = d > 0.2; return true; };
  shadows(g, true, false); return g;
}
// GUVA-S12SD UV module: a small purple board, the tiny sensor with its clear window, three pins (−, +, OUT)
export function buildUVS() {
  const K = mats(); K.nylon = K.nylon || S({ color: 0xe9e4d6, roughness: 0.6 }); const g = new THREE.Group(); const top = 4.6;
  g.add(header(K, 3, -P, top));
  const pm = canvasMat(256, 320, (c, w, h) => { c.fillStyle = '#4b2a8c'; c.fillRect(0, 0, w, h); c.fillStyle = '#fff'; c.font = '700 28px sans-serif'; c.fillText('GUVA-S12SD', 30, 300); c.fillText('−   +  OUT', 50, 40); });
  g.add(box(15, 1.6, 20, [K.strip, K.strip, pm, K.strip, K.strip, K.strip], 0, top - 0.8, -10.5));
  g.add(box(3.6, 1.2, 3.6, K.bead, 0, top + 0.6, -12)); const win = box(1.6, 0.2, 1.6, new THREE.MeshPhysicalMaterial({ color: 0x9fd8ff, roughness: 0.05, transmission: 0.5, transparent: true, opacity: 0.8 }), 0, top + 1.3, -12); g.add(win);
  for (const m of standoffs(K, [[-5.5, -18], [5.5, -18]])) g.add(m);
  shadows(g, true, false); return g;
}

export function buildPart25(part) { const B = { fsr: buildFSR, flex: buildFlex, ntc: buildNTC, rcwl: buildRCWL, wlevel: buildWaterLevel, uvs: buildUVS, mq135: () => buildMQ2('MQ-135'), mq3: () => buildMQ2('MQ-3') }[part.type]; return B ? B() : null; }
