// DUET Robotics Lab 360, batch 29: the bionic hand's parts (parts29.js), at their real sizes (mm). Both lie beside their
// 7-pin header (the terminals, along x at z = 0).
//   flexglove  a black knit glove on an (unseen) hand, 40 mm over the mat behind its header, palm down, fingers pointing
//              away (−z), as the student's own right hand; a flex strip on each finger; its wrist board (5 × 10 kΩ) by the header. Each finger
//              curls (three joints) as far as it is bent.
//   robohand   a white 3D-printed forearm behind its header, the hand at its end lying palm up, fingers pointing away,
//              thumb on the right; each finger curls up over the palm as its servo turns (the thumb the other way).
import * as THREE from 'three';
import { materials, box, cyl, shadows } from './models.js';

const P = 2.54, D2R = Math.PI / 180;
const S = (o) => new THREE.MeshStandardMaterial(o);
let MM = null;
function mats() {
  if (MM) return MM; const M = materials();
  MM = { M, pin: S({ color: 0xd9c27a, metalness: 0.9, roughness: 0.3 }), plastic: S({ color: 0x1d1e22, roughness: 0.5 }), knit: S({ color: 0x26282d, roughness: 0.95 }), cuff: S({ color: 0x2f6fd0, roughness: 0.9 }),
    strip: S({ color: 0x15161a, roughness: 0.4 }), ink: S({ color: 0xa9adb3, roughness: 0.35, metalness: 0.4 }), board: S({ color: 0x2d7a4b, roughness: 0.6 }), res: S({ color: 0xd8c39a, roughness: 0.5 }),
    print: S({ color: 0xf1f0ea, roughness: 0.7 }), joint: S({ color: 0xd7d5cc, roughness: 0.6 }), line: S({ color: 0xe8f4ff, roughness: 0.3 }), ribbon: S({ color: 0x9aa0a8, roughness: 0.6 }) };
  for (const m of Object.values(MM)) if (m.isMaterial) m.userData.shared = true;
  return MM;
}
const header7 = (K, g, top) => { for (let i = 0; i < 7; i++) { g.add(box(0.64, 6, 0.64, K.pin, (i - 3) * P, top - 2, 0)); g.add(box(2.5, 2.5, 2.5, K.plastic, (i - 3) * P, top + 0.8, 0)); } };
// a finger: three segments in a chain from `at`, pointing along `dir` (+1: +x, −1: −x), each turning about z
function finger(parent, mat, at, L, r, dir) {
  const segs = []; let par = parent; const lens = [L * 0.42, L * 0.33, L * 0.25];
  lens.forEach((l, i) => { const s = new THREE.Group(); s.position.set(i ? dir * lens[i - 1] : at[0], i ? 0 : at[1], i ? 0 : at[2]); par.add(s); const m = new THREE.Mesh(new THREE.CapsuleGeometry(r * (1 - i * 0.08), l - 2 * r, 4, 10), mat); m.rotation.z = Math.PI / 2; m.position.x = dir * l / 2; s.add(m); segs.push(s); par = s; });
  return segs;
}

export function buildFlexGlove() {
  const K = mats(); const g0 = new THREE.Group(); const top = 4.6; header7(K, g0, top);
  g0.add(box(26, 1.6, 16, K.board, 0, top, -11)); for (let i = 0; i < 5; i++) g0.add(box(1.6, 1.6, 6, K.res, (i - 2) * 4.2, top + 1.6, -13)); // (the wrist board: five 10 kΩ)
  // the glove lies like your own right hand on the table: palm down, fingers pointing away (−z), thumb on the left. It is
  // drawn along −x and turned a quarter round, at a child's size
  const g = new THREE.Group(); g.rotation.y = -Math.PI / 2; g.scale.setScalar(0.75); g.position.z = -24; g0.add(g);
  const H = 40, cx = -100; const hand = new THREE.Group(); hand.position.set(cx, H, 0); g.add(hand);
  hand.add(box(90, 24, 82, K.knit, 0, 0, 0)); const cuff = cyl(42, 36, K.cuff, 60, 0, 0, 20); cuff.rotation.z = Math.PI / 2; cuff.scale.set(1, 1, 0.55); hand.add(cuff);
  const F = [[28, 64, 9.5], [8, 72, 10], [-12, 70, 10], [-30, 60, 9]]; const curls = []; // (index … little, from the thumb's side)
  F.forEach(([z, L, r]) => { const segs = finger(hand, K.knit, [-45, 0, z], L, r, -1); curls.push(segs); segs[0].add(box(L * 0.42, 0.5, 5, K.strip, -L * 0.21, r + 0.3, 0)); segs[1].add(box(L * 0.33, 0.5, 5, K.strip, -L * 0.165, r + 0.2, 0)); });
  const th = new THREE.Group(); th.position.set(-20, -2, 44); th.rotation.y = 0.6; hand.add(th); curls.unshift(finger(th, K.knit, [0, 0, 0], 52, 10.5, -1));
  g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(-8, top + 2, 0), new THREE.Vector3(-14, 22, 0), new THREE.Vector3(cx + 70, H + 6, 0)]), 20, 2.4, 6, false), K.ribbon)); // (the strips' wires, to the wrist board)
  g0.userData.update = (p) => { const b = p.state.bend || []; let ch = false; curls.forEach((segs, i) => { const a = (b[i] || 0) / 90 * 62 * D2R; segs.forEach((s) => { if (Math.abs(s.rotation.z - a) > 1e-3) { s.rotation.z = a; ch = true; } }); }); return ch; };
  shadows(g0, true, false); return g0;
}

export function buildRoboHand() {
  const K = mats(); const g0 = new THREE.Group(); const top = 4.6; header7(K, g0, top);
  // the forearm (a white 3D print, the servos inside) away from the header (−z), the hand at its end lying palm up, fingers
  // pointing away, thumb on the right; drawn along +x and turned a quarter round, at 72 % of life size (a kit hand)
  const g = new THREE.Group(); g.rotation.y = Math.PI / 2; g.scale.setScalar(0.72); g.position.z = -4; g0.add(g);
  g.add(box(150, 44, 58, K.print, 22 + 75, 22, 0)); g.add(box(6, 30, 50, K.joint, 22 + 150 + 3, 18, 0));
  for (let i = 0; i < 5; i++) g.add(box(12, 3, 22, S({ color: 0x2a62c9, roughness: 0.5 }), 50 + i * 24, 45.5, 0)); // (the five SG90s seen through the open top)
  const hand = new THREE.Group(); hand.position.set(22 + 150 + 6 + 45, 14, 0); g.add(hand);
  hand.add(box(90, 18, 80, K.print, 0, 0, 0));
  const F = [[27, 62, 8.5], [8, 70, 9], [-11, 68, 9], [-29, 58, 8]]; const curls = [];
  F.forEach(([z, L, r]) => { curls.push(finger(hand, K.print, [45, 4, z], L, r, 1)); });
  const th = new THREE.Group(); th.position.set(-15, 4, 40); th.rotation.y = -0.75; hand.add(th); curls.unshift(finger(th, K.print, [0, 0, 0], 50, 9.5, 1));
  for (const z of [27, 8, -11, -29]) g.add(box(150, 0.5, 0.5, K.line, 22 + 150, 26, z * 0.6)); // (the fishing lines, into the forearm)
  g0.userData.update = (p) => { const c = (p.state.ang || []).map((a, i) => (i === 0 ? 180 - a : a)); let ch = false; curls.forEach((segs, i) => { const a = (c[i] || 0) / 180 * 78 * D2R; segs.forEach((s) => { if (Math.abs(s.rotation.z - a) > 1e-3) { s.rotation.z = a; ch = true; } }); }); return ch; };
  shadows(g0, true, false); return g0;
}

export function buildPart29(part) { const B = { flexglove: buildFlexGlove, robohand: buildRoboHand }[part.type]; return B ? B() : null; }
