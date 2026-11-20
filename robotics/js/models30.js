// DUET Robotics Lab 360, batch 30: the two parts of parts30.js, at their real sizes (mm). Both have their header at z = 0
// (the terminals) and their body towards −z.
//   loadcell  the green HX711 board behind its header, four coloured wires to a 5 kg aluminium bar load cell on a printed
//             base, an acrylic platform on it; brass weights stand on the platform (one for every 500 g, a small one for
//             what is left), so the student sees what the scale carries.
//   vl53l0x   the purple GY-VL53L0XV2 board standing up by its header, looking along a ruler to the right (+x); a card
//             (white, grey or black) stands on the ruler at its distance (shown up to 20 cm); a faint red line marks the laser.
import * as THREE from 'three';
import { materials, box, cyl, shadows } from './models.js';

const P = 2.54;
const S = (o) => new THREE.MeshStandardMaterial(o);
let MM = null;
function mats() {
  if (MM) return MM; const M = materials();
  MM = { M, pin: S({ color: 0xd9c27a, metalness: 0.9, roughness: 0.3 }), plastic: S({ color: 0x1d1e22, roughness: 0.5 }), green: S({ color: 0x1e7a46, roughness: 0.55 }), chip: S({ color: 0x16171a, roughness: 0.4 }),
    alu: S({ color: 0xc3c8ce, metalness: 0.85, roughness: 0.35 }), base: S({ color: 0x3a3d44, roughness: 0.7 }), acrylic: new THREE.MeshPhysicalMaterial({ color: 0xe8f3ff, transparent: true, opacity: 0.55, roughness: 0.08 }),
    brass: S({ color: 0xc9a227, metalness: 0.85, roughness: 0.3 }), purple: S({ color: 0x5a2b8f, roughness: 0.55 }), wood: S({ color: 0xd9b77e, roughness: 0.7 }), ink: S({ color: 0x2b2b2b, roughness: 0.6 }),
    red: S({ color: 0xc92a2a, roughness: 0.5 }), blk: S({ color: 0x232428, roughness: 0.5 }), wht: S({ color: 0xf2f2f2, roughness: 0.5 }), grn: S({ color: 0x2f9e44, roughness: 0.5 }) };
  for (const m of Object.values(MM)) if (m.isMaterial) m.userData.shared = true;
  return MM;
}
const header = (K, g, n, top) => { for (let i = 0; i < n; i++) { const x = (i - (n - 1) / 2) * P; g.add(box(0.64, 6, 0.64, K.pin, x, top - 2, 0)); g.add(box(2.5, 2.5, 2.5, K.plastic, x, top + 0.8, 0)); } };
const tube = (pts, r, mat) => new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p))), 24, r, 6, false), mat);

export function buildLoadCell() {
  const K = mats(); const g = new THREE.Group(); const top = 4.6; header(K, g, 4, top);
  g.add(box(21, 1.6, 35, K.green, 0, top - 0.8, -19)); g.add(box(5, 1.2, 9, K.chip, 0, top + 0.6, -20)); // (the HX711 board and chip)
  const cx = -75, cz = -45; // the scale, to the left of the board
  g.add(box(30, 20, 40, K.base, cx - 30, 10, cz)); // (the base, holding one end of the bar)
  g.add(box(80, 12.7, 12.7, K.alu, cx, 26.4, cz)); g.add(box(18, 3, 13, K.base, cx + 34, 34.3, cz)); // (the bar, and the spacer under the platform)
  g.add(box(100, 4, 100, K.acrylic, cx + 20, 37.8, cz));
  [[K.red, -4], [K.blk, -1.5], [K.wht, 1.5], [K.grn, 4]].forEach(([m, d]) => g.add(tube([[cx - 38, 26, cz + d], [cx - 50, 14, cz + 16 + d], [-25, 4, -20 + d], [-9, top + 1, -32 + d]], 0.6, m)));
  const weights = new THREE.Group(); weights.position.set(cx + 20, 39.8, cz); g.add(weights);
  let last = -1;
  g.userData.update = (p) => { const gr = Math.round(p.state.grams || 0); if (gr === last) return false; last = gr; weights.clear();
    const big = Math.floor(gr / 500), rest = gr - big * 500; const spot = [[-22, -22], [22, -22], [-22, 22], [22, 22]];
    for (let i = 0; i < Math.min(big, 12); i++) { const [x, z] = spot[i % 4]; const y = 10 + Math.floor(i / 4) * 21; weights.add(cyl(16, 20, K.brass, x, y, z, 24)); weights.add(cyl(5, 6, K.brass, x, y + 13, z, 12)); } // (a 500 g weight: 32 × 20 mm with a knob)
    if (rest > 0) { const h = 3 + 14 * rest / 500; weights.add(cyl(6 + 6 * rest / 500, h, K.brass, 0, h / 2, 0, 20)); } return true; };
  shadows(g, true, false); return g;
}

export function buildVL53L0X() {
  const K = mats(); const g = new THREE.Group(); const top = 4.6; header(K, g, 4, top);
  const bd = new THREE.Group(); bd.position.set(6.5, top + 7, -2); bd.rotation.y = Math.PI / 2; g.add(bd); // (the board standing up by its header, its sensor looking along +x)
  bd.add(box(25, 13, 1.6, K.purple, 0, 0, 0)); bd.add(box(4.4, 2.4, 1, K.chip, 2, 0.5, 1.3)); bd.add(box(1.6, 1.2, 0.3, new THREE.MeshPhysicalMaterial({ color: 0x8fd3ff, roughness: 0.05, transparent: true, opacity: 0.8 }), 2, 0.6, 1.9));
  g.add(box(4, 8, 8, K.base, 5, top + 1, -2)); // (a small stand)
  const L = 200, x0 = 10; g.add(box(L, 2, 16, K.wood, x0 + L / 2, 1, -2)); for (let i = 0; i <= 20; i++) g.add(box(0.5, 0.1, i % 5 ? 4 : 8, K.ink, x0 + i * 10, 2.05, -8 + (i % 5 ? 2 : 0))); // (the ruler: a mark every cm)
  const cardM = S({ color: 0xf4f4f4, roughness: 0.8 }); const card = box(2, 50, 40, cardM, 0, 27, -2); g.add(card);
  const beamM = new THREE.MeshBasicMaterial({ color: 0xff3b3b, transparent: true, opacity: 0.22, depthWrite: false }); const beam = box(1, 0.6, 0.6, beamM, 0, top + 7.6, -4); g.add(beam);
  const COL = { white: 0xf4f4f4, grey: 0x8a8d92, black: 0x1b1c1f }; let last = '';
  g.userData.update = (p) => { const k = `${Math.round(p.state.mm)}|${p.state.surface}|${p.state.powered}`; if (k === last) return false; last = k;
    const d = Math.min(L, p.state.mm || 0); card.position.x = 8.5 + d + 1; cardM.color.setHex(COL[p.state.surface] || COL.white);
    beam.visible = !!p.state.powered; beam.scale.x = Math.max(1, d); beam.position.x = 8.5 + d / 2; return true; };
  shadows(g, true, false); return g;
}

export function buildPart30(part) { const B = { loadcell: buildLoadCell, vl53l0x: buildVL53L0X }[part.type]; return B ? B() : null; }
