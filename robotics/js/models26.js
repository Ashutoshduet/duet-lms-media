// DUET Robotics Lab 360, batch 26: the four I2C modules (parts26.js), from their board sizes (mm). Each lies on the mat with
// its header pins at z = 0 (the terminals) and its board towards −z, as the batch-3 modules do. The MPU-6050's board
// tilts and turns with the module (its pins stay where the wires are).
import * as THREE from 'three';
import { materials, box, cyl, shadows } from './models.js';

const P = 2.54, D2R = Math.PI / 180;
const S = (o) => new THREE.MeshStandardMaterial(o);
let MM = null;
function mats() {
  if (MM) return MM; const M = materials();
  MM = { M, black: S({ color: 0x18191c, roughness: 0.45 }), pin: S({ color: 0xd9c27a, metalness: 0.9, roughness: 0.3 }), plastic: S({ color: 0x1d1e22, roughness: 0.5 }), nylon: S({ color: 0xe9e4d6, roughness: 0.6 }),
    can: S({ color: 0xd2d5da, metalness: 0.9, roughness: 0.3 }), cell: S({ color: 0xc8ccd2, metalness: 0.95, roughness: 0.22 }) };
  for (const m of Object.values(MM)) if (m.isMaterial) m.userData.shared = true;
  return MM;
}
const header = (K, n, x0, y) => { const g = new THREE.Group(); for (let i = 0; i < n; i++) { g.add(box(0.64, 6, 0.64, K.pin, x0 + i * P, y - 2, 0)); g.add(box(2.5, 2.5, 2.5, K.plastic, x0 + i * P, y + 0.8, 0)); } return g; };
function pcb(w, d, color, draw) {
  const c = document.createElement('canvas'); c.width = Math.round(w * 12); c.height = Math.round(d * 12); const x = c.getContext('2d'); x.fillStyle = color; x.fillRect(0, 0, c.width, c.height); x.fillStyle = '#ffffff'; x.textBaseline = 'middle'; draw(x, c.width, c.height);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; const top = S({ map: t, roughness: 0.55 }); const edge = S({ color, roughness: 0.6 });
  return [edge, edge, top, edge, edge, edge];
}
const labels = (x, names, w, h, y) => { x.font = `700 ${Math.round(h * 0.09)}px sans-serif`; x.textAlign = 'center'; names.forEach((n, i) => x.fillText(n, (i + 0.5) * w / names.length, y)); x.textAlign = 'left'; };

// GY-521: 21.2 × 16.4 mm, the MPU-6050 (a 4 × 4 mm QFN), the axis arrows printed by it
export function buildMPU6050() {
  const K = mats(); const g = new THREE.Group(); const top = 4.6; g.add(header(K, 8, -3.5 * P, top));
  const b = new THREE.Group(); b.position.set(0, top, -9.5); g.add(b);
  b.add(box(21.2, 1.6, 16.4, pcb(21.2, 16.4, '#1f4fae', (x, w, h) => { labels(x, ['VCC', 'GND', 'SCL', 'SDA', 'XDA', 'XCL', 'AD0', 'INT'], w, h, h * 0.9); x.font = `700 ${Math.round(h * 0.11)}px sans-serif`; x.fillText('GY-521', w * 0.06, h * 0.12);
    x.strokeStyle = '#fff'; x.lineWidth = 3; x.beginPath(); x.moveTo(w * 0.72, h * 0.45); x.lineTo(w * 0.92, h * 0.45); x.moveTo(w * 0.72, h * 0.45); x.lineTo(w * 0.72, h * 0.18); x.stroke(); x.fillText('X', w * 0.93, h * 0.45); x.fillText('Y', w * 0.68, h * 0.12); }), 0, -0.8, 0));
  b.add(box(4, 0.9, 4, K.black, -2, 0.45, -1)); b.add(box(2.6, 1, 1.6, K.black, -7.5, 0.5, -3)); // (the MPU-6050, the regulator)
  for (const [x, z] of [[-8.6, -5.2], [8.6, -5.2]]) b.add(cyl(1.5, 0.3, K.can, x, 0.15, z, 12));
  for (const [x, z] of [[-8, 1], [8, 1]]) g.add(cyl(1.4, top - 0.8, K.nylon, x, (top - 0.8) / 2, -9.5 + z, 8));
  g.userData.update = (p) => { const s = p.state; const rx = (s.roll || 0) * D2R, rz = -(s.pitch || 0) * D2R, ry = (s.yaw || 0) * D2R; if (Math.abs(b.rotation.x - rx) + Math.abs(b.rotation.z - rz) + Math.abs(b.rotation.y - ry) < 1e-3 && !(s.shake > 0)) return false;
    const j = s.shake > 0 ? (Math.random() - 0.5) * 0.15 : 0; b.rotation.set(rx + j, ry, rz - j, 'YXZ'); b.position.y = top + Math.max(Math.abs(Math.sin(rx)), Math.abs(Math.sin(rz))) * 8; return true; };
  shadows(g, true, false); return g;
}
// ZS-042: 38 × 22 mm, the DS3231 (SOIC-16), the 24C32 memory, the coin cell in its holder
export function buildRTC() {
  const K = mats(); const g = new THREE.Group(); const top = 4.6; g.add(header(K, 6, -2.5 * P, top));
  g.add(box(22, 1.6, 38, pcb(22, 38, '#1f4fae', (x, w, h) => { labels(x, ['32K', 'SQW', 'SCL', 'SDA', 'VCC', 'GND'], w, h * 0.3, h * 0.96); x.font = `700 ${Math.round(w * 0.08)}px sans-serif`; x.fillText('DS3231', w * 0.08, h * 0.08); x.fillText('AT24C32', w * 0.5, h * 0.08); }), 0, top - 0.8, -19.5));
  g.add(box(7.5, 2.4, 10.3, K.black, -4, top + 1.2, -12)); g.add(box(5, 1.6, 4, K.black, 5.5, top + 0.8, -32));
  const hold = cyl(10.5, 2.2, K.black, 0, top + 1.1, -27, 32); g.add(hold); g.add(cyl(10, 3.2, K.cell, 0, top + 2.4, -27, 32)); g.add(box(4, 0.6, 22, K.cell, 0, top + 4.1, -27));
  for (const [x, z] of [[-9, -3], [9, -3], [-9, -36], [9, -36]]) g.add(cyl(1.4, top - 0.8, K.nylon, x, (top - 0.8) / 2, z, 8));
  shadows(g, true, false); return g;
}
// GY-302: 18.5 × 13.9 mm, the BH1750 under its little clear window
export function buildBH1750() {
  const K = mats(); const g = new THREE.Group(); const top = 4.6; g.add(header(K, 5, -2 * P, top));
  g.add(box(18.5, 1.6, 13.9, pcb(18.5, 13.9, '#1f4fae', (x, w, h) => { labels(x, ['VCC', 'GND', 'SCL', 'SDA', 'ADDR'], w, h, h * 0.9); x.font = `700 ${Math.round(h * 0.12)}px sans-serif`; x.fillText('GY-302', w * 0.06, h * 0.14); }), 0, top - 0.8, -8));
  g.add(box(3.4, 1.2, 2.2, K.black, 0, top + 0.6, -9)); g.add(box(1.4, 0.15, 1.2, new THREE.MeshPhysicalMaterial({ color: 0xbfe3ff, roughness: 0.05, transparent: true, opacity: 0.85 }), 0, top + 1.25, -9));
  for (const [x, z] of [[-7, -12.5], [7, -12.5]]) g.add(cyl(1.3, top - 0.8, K.nylon, x, (top - 0.8) / 2, z, 8));
  shadows(g, true, false); return g;
}
// GY-68: 13 × 10 mm (purple), the BMP180 in its little metal can
export function buildBMP180() {
  const K = mats(); const g = new THREE.Group(); const top = 4.6; g.add(header(K, 4, -1.5 * P, top));
  g.add(box(13, 1.6, 12, pcb(13, 12, '#5a2b8f', (x, w, h) => { labels(x, ['VIN', 'GND', 'SCL', 'SDA'], w, h, h * 0.88); x.font = `700 ${Math.round(h * 0.12)}px sans-serif`; x.fillText('GY-68', w * 0.06, h * 0.13); }), 0, top - 0.8, -7));
  g.add(box(3.6, 0.9, 3.8, K.can, 0, top + 0.45, -7.5)); g.add(cyl(0.35, 0.1, K.black, 0.9, top + 0.95, -6.8, 8));
  g.add(cyl(1.2, top - 0.8, K.nylon, 0, (top - 0.8) / 2, -11, 8));
  shadows(g, true, false); return g;
}

export function buildPart26(part) { const B = { mpu6050: buildMPU6050, rtc3231: buildRTC, bh1750: buildBH1750, bmp180: buildBMP180 }[part.type]; return B ? B() : null; }
