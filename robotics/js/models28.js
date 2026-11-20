// DUET Robotics Lab 360, batch 28: the two parts of parts28.js, from their real sizes (mm).
//   ds18b20  the probe's three wires on a 3-pin header in the breadboard (black GND, yellow DATA, red VCC), the round black
//            cable arching over to the front of the breadboard, down into a 100 ml beaker of water on the mat, and the steel
//            tube (6 × 50 mm) standing in it. The water's colour follows its temperature (blue cold, clear, orange hot).
//   ws2812   the CJMCU-2812-8 stick (53 × 10 mm, black), its header at z = 0 (the terminals) and the board towards −z; eight
//            5050 LEDs, each lit in the colour its chip was last sent.
import * as THREE from 'three';
import { materials, box, cyl, shadows } from './models.js';

const P = 2.54, BBTOP = 8.5;
const S = (o) => new THREE.MeshStandardMaterial(o);
let MM = null;
function mats() {
  if (MM) return MM; const M = materials();
  MM = { M, black: S({ color: 0x17181b, roughness: 0.5 }), cable: S({ color: 0x1b1c1f, roughness: 0.65 }), pin: S({ color: 0xd9c27a, metalness: 0.9, roughness: 0.3 }), steel: S({ color: 0xc9ced4, metalness: 0.95, roughness: 0.22 }),
    red: S({ color: 0xc92a2a, roughness: 0.5 }), yel: S({ color: 0xf2c200, roughness: 0.5 }), wblk: S({ color: 0x2b2c30, roughness: 0.5 }), pcb: S({ color: 0x141518, roughness: 0.55 }), led: S({ color: 0xf1efe8, roughness: 0.35 }),
    glass: new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.2, roughness: 0.05, side: THREE.DoubleSide, depthWrite: false }) };
  for (const m of Object.values(MM)) if (m.isMaterial) m.userData.shared = true;
  return MM;
}
const tube = (pts, r, mat, seg = 40) => new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p))), seg, r, 8, false), mat);

export function buildDS18B20() {
  const K = mats(); const g = new THREE.Group();
  for (let i = 0; i < 3; i++) g.add(box(0.64, 9, 0.64, K.pin, i * P, -1.5, 0)); // (the header's pins, down into the holes)
  g.add(box(3 * P, 2.5, 2.5, K.black, P, 1.25, 0));
  const cols = [K.wblk, K.yel, K.red]; const top = [P, 18, 6]; // the three wires rise and meet in the cable
  cols.forEach((m, i) => g.add(tube([[i * P, 2.5, 0], [i * P, 7, 0.5], [P + (i - 1) * 1.2, 13, 2.5], top], 0.55, m, 16)));
  g.add(cyl(2.2, 4, K.black, P, 17, 6, 12)); // (the heat-shrink where they join)
  const bx = P + 34, bz = 82, by = -BBTOP; // the beaker on the mat, in front of the breadboard
  g.add(tube([[P, 19, 6], [P, 34, 16], [P + 12, 46, 40], [bx - 4, 70, bz - 14], [bx, 72, bz - 4], [bx, 61, bz]], 2, K.cable, 48));
  g.add(cyl(3, 50, K.steel, bx, by + 16 + 25, bz, 16)); g.add(cyl(3.1, 4, K.black, bx, by + 66 + 1, bz, 12)); // (the steel tube, its cable gland)
  const beaker = new THREE.Mesh(new THREE.CylinderGeometry(23, 23, 58, 32, 1, true), K.glass); beaker.position.set(bx, by + 29, bz); g.add(beaker);
  g.add(cyl(23, 1.5, K.glass, bx, by + 0.75, bz, 32)); const lip = new THREE.Mesh(new THREE.TorusGeometry(23, 0.8, 6, 32), K.glass); lip.rotation.x = Math.PI / 2; lip.position.set(bx, by + 58, bz); g.add(lip);
  const wM = new THREE.MeshStandardMaterial({ color: 0x6fb3e8, transparent: true, opacity: 0.5, roughness: 0.1, depthWrite: false }); const water = cyl(22.2, 40, wM, bx, by + 1.5 + 20, bz, 32); g.add(water);
  const cold = new THREE.Color(0x4f9be0), mid = new THREE.Color(0x8fc6ee), hot = new THREE.Color(0xe8834e);
  g.userData.update = (p) => { const w = p.state.water ?? 26; const c = w < 25 ? cold.clone().lerp(mid, Math.max(0, (w + 5) / 30)) : mid.clone().lerp(hot, Math.min(1, (w - 25) / 50)); if (wM.color.equals(c)) return false; wM.color.copy(c); return true; };
  shadows(g, true, false); return g;
}

let HALO = null; // a soft round glow, drawn once
function haloTex() { if (HALO) return HALO; const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'); const gr = x.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.35, 'rgba(255,255,255,0.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gr; x.fillRect(0, 0, 64, 64); HALO = new THREE.CanvasTexture(c); HALO.userData.shared = true; return HALO; }
export function buildWS2812() {
  const K = mats(); const g = new THREE.Group(); const top = 3.2;
  for (let i = -1; i <= 1; i++) { g.add(box(0.64, 6, 0.64, K.pin, i * P, top - 2, 0)); g.add(box(2.5, 2.5, 2.5, K.black, i * P, top + 0.8, 0)); }
  g.add(box(10.2, 1.6, 53, K.pcb, 0, top, -27.5));
  const halo = haloTex(); const leds = [], glows = [];
  for (let i = 0; i < 8; i++) { const z = -5 - i * 6.6; g.add(box(5, 1.5, 5, K.led, 0, top + 1.55, z)); const m = new THREE.MeshStandardMaterial({ color: 0x222222, emissive: 0x000000, roughness: 0.3 }); const lens = box(4.2, 0.3, 4.2, m, 0, top + 2.45, z); g.add(lens); leds.push(m);
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: halo, color: 0xffffff, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })); sp.scale.set(11, 11, 1); sp.position.set(0, top + 3.4, z); sp.visible = false; g.add(sp); glows.push(sp); }
  let last = '';
  g.userData.update = (p) => { const px = (p.state.powered && p.state.px) || []; const key = px.map((c) => c.join(',')).join(';'); if (key === last) return false; last = key;
    leds.forEach((m, i) => { const c = px[i] || [0, 0, 0]; const mx = Math.max(c[0], c[1], c[2]); const on = mx > 0; m.color.setRGB(0.1, 0.1, 0.1); // (an LED looks bright even at a low value: the colour, and a glow that grows with the square root)
      if (on) m.emissive.setRGB(c[0] / mx, c[1] / mx, c[2] / mx); else m.emissive.setRGB(0, 0, 0); m.emissiveIntensity = on ? 0.5 + 2.2 * Math.sqrt(mx / 255) : 0;
      const sp = glows[i]; sp.visible = on; if (on) { sp.material.color.setRGB(c[0] / mx, c[1] / mx, c[2] / mx); sp.material.opacity = 0.35 + 0.6 * Math.sqrt(mx / 255); } }); return true; };
  shadows(g, true, false); return g;
}

export function buildPart28(part) { const B = { ds18b20: buildDS18B20, ws2812: buildWS2812 }[part.type]; return B ? B() : null; }
