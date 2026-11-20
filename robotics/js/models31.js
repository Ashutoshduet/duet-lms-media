// DUET Robotics Lab 360, batch 31: the SIM800L V2.0 board (parts31.js), at its real size (mm): a red board 40 × 26 mm, the
// SIM800L in its metal can, the micro-SIM holder, a coiled spring antenna, the NET light, and its 4-pin header at z = 0
// (the terminals) with the board towards −z. The NET light blinks as the real one does: every second while it looks for the
// network, every 3 s once it has it; it flickers when the board browns out on the Arduino's 5V.
import * as THREE from 'three';
import { materials, box, cyl, shadows } from './models.js';

const P = 2.54;
const S = (o) => new THREE.MeshStandardMaterial(o);
let MM = null;
function mats() {
  if (MM) return MM; const M = materials();
  MM = { M, pin: S({ color: 0xd9c27a, metalness: 0.9, roughness: 0.3 }), plastic: S({ color: 0x1d1e22, roughness: 0.5 }), red: S({ color: 0xb3262b, roughness: 0.55 }), can: S({ color: 0xc9ced4, metalness: 0.9, roughness: 0.28 }),
    sim: S({ color: 0x8a8f96, metalness: 0.7, roughness: 0.35 }), coil: S({ color: 0xd8b04a, metalness: 0.9, roughness: 0.3 }), card: S({ color: 0xe9e2c8, roughness: 0.6 }) };
  for (const m of Object.values(MM)) if (m.isMaterial) m.userData.shared = true;
  return MM;
}
export function buildSIM800L() {
  const K = mats(); const g = new THREE.Group(); const top = 4.6;
  for (let i = 0; i < 4; i++) { const x = (i - 1.5) * P; g.add(box(0.64, 6, 0.64, K.pin, x, top - 2, 0)); g.add(box(2.5, 2.5, 2.5, K.plastic, x, top + 0.8, 0)); }
  g.add(box(26, 1.6, 40, K.red, 0, top - 0.8, -21)); g.add(box(15.8, 2.4, 17.8, K.can, -3, top + 1.2, -25)); g.add(box(15, 1.6, 13, K.sim, 4, top + 0.8, -8)); g.add(box(11, 0.5, 12, K.card, 4, top + 1.85, -8.5));
  const coil = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(Array.from({ length: 60 }, (_, i) => new THREE.Vector3(9 + 2.2 * Math.cos(i * 0.6), top + 2.4 + 2.2 * Math.sin(i * 0.6), -24 - i * 0.28))), 120, 0.35, 5, false), K.coil); g.add(coil);
  const led = new THREE.MeshStandardMaterial({ color: 0x3a0d0d, emissive: 0xff2a1a, emissiveIntensity: 0 }); g.add(box(1.6, 0.8, 1, led, -10, top + 0.4, -38));
  g.userData.update = (p) => { const s = p.state; if (!s.powered) { if (led.emissiveIntensity) { led.emissiveIntensity = 0; return true; } return false; }
    const t = performance.now() / 1000; const on = s.weak ? Math.random() < 0.3 : s.reg ? t % 3 < 0.07 : t % 1 < 0.07; led.emissiveIntensity = on ? 2.8 : 0; return true; };
  shadows(g, true, false); return g;
}
export function buildPart31(part) { return part.type === 'sim800l' ? buildSIM800L() : null; }
