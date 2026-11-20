// DUET Robotics Lab 360, batch 22: the eight digital sensor modules (parts22.js), modelled from their datasheet sizes (mm).
// The same small board for all (3 header pins, an LM393, the blue sensitivity knob, PWR and DO LEDs) with each one's own
// sensing element, and the thing the student brings to it: a candle (flame), a magnet (reed, hall), drops on a rain plate,
// a spectacle frame (blink). userData.update lights the LEDs and shows what is happening (view.js calls it each frame).
import * as THREE from 'three';
import { materials, box, cyl, shadows } from './models.js';
import * as TX from './tex.js';
import { KINDS22 } from './parts22.js';

const P = 2.54;
const S = (o) => new THREE.MeshStandardMaterial(o);
let MM = null;
function mats() {
  if (MM) return MM; const M = materials();
  MM = { M, blue: S({ color: 0x2f6fd8, roughness: 0.45 }), glass: S({ color: 0xdff4ff, roughness: 0.05, transparent: true, opacity: 0.45 }), wax: S({ color: 0xf3ead6, roughness: 0.7 }),
    wick: S({ color: 0x222222, roughness: 0.8 }), red: S({ color: 0xc8281c, roughness: 0.4 }), steel: S({ color: 0xc8ccd2, metalness: 0.95, roughness: 0.3 }), frame: S({ color: 0x15161a, roughness: 0.45 }),
    nickel: S({ color: 0xd9d4c6, metalness: 0.9, roughness: 0.35 }), plate: S({ color: 0x1d4aa8, roughness: 0.5 }), water: S({ color: 0x9fd6ff, roughness: 0.05, transparent: true, opacity: 0.7 }) };
  for (const m of Object.values(MM)) if (m.isMaterial) m.userData.shared = true;
  return MM;
}
const ledMat = (col) => S({ color: 0xf2efe0, emissive: col, emissiveIntensity: 0, roughness: 0.3 });

// (batch 22) the cup anemometer: a little breakout with the two leads, a mast, a hub with three arms and cups that turns
function buildAnemo() {
  const Q = mats(), M = Q.M; const g = new THREE.Group();
  for (const i of [-1, 1]) g.add(box(0.64, 0.64, 8, M.gold, i * P, 4, -3));
  g.add(box(2 * P + 2.5, 2.5, 2.5, M.black, 0, 4, -6.5));
  const pcb = TX.pcbTexture(12, 14, (c) => { c.fillStyle = '#eee'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = `700 1.4px ${TX.FONT}`; c.save(); c.translate(6, 6); c.rotate(Math.PI); c.fillText('WIND', 0, 0); c.restore(); }, '#1d6b3a');
  g.add(box(12, 1.6, 14, [M.fr4, M.fr4, S({ map: pcb, roughness: 0.45 }), M.fr4, M.fr4, M.fr4], 0, 4, -15)); g.add(box(12, 3.2, 14, M.black, 0, 1.6, -15));
  g.add(box(3, 2, 22, M.black, 0, 1, -33)); // the cable to the mast
  const mast = new THREE.Group(); mast.position.set(0, 0, -52); g.add(mast);
  mast.add(cyl(9, 3, M.black, 0, 1.5, 0, 20)); mast.add(cyl(1.6, 70, Q.steel, 0, 38, 0, 12));
  const hub = new THREE.Group(); hub.position.y = 74; hub.userData.keep = true; mast.add(hub); hub.add(cyl(3.2, 6, S({ color: 0xf2f2ee, roughness: 0.5 }), 0, 0, 0, 16));
  const cupM = S({ color: 0xf4f4f0, roughness: 0.45, side: THREE.DoubleSide });
  for (let k = 0; k < 3; k++) { const a = k * 2 * Math.PI / 3; const arm = new THREE.Group(); arm.rotation.y = a; hub.add(arm);
    const r = box(22, 1.2, 1.2, Q.steel, 11, 0, 0); arm.add(r);
    const cup = new THREE.Mesh(new THREE.SphereGeometry(5.5, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), cupM); cup.rotation.x = Math.PI / 2; cup.position.set(24, 0, 0); arm.add(cup); }
  let vis = 0; g.userData.update = (p, dt) => { const w = p.state.wind || 0; if (!w) return false; vis += Math.min(w / 2.4, 2.5) * 2 * Math.PI * (dt || 0.016); hub.rotation.y = -vis; return true; };
  g.userData.face = new THREE.Vector3(0, 0, -1);
  shadows(g); return g;
}

export function buildPart22(part) {
  if (part.type === 'anemo') return buildAnemo();
  const K = KINDS22[part.type]; if (!K) return null;
  const Q = mats(), M = Q.M; const g = new THREE.Group(); const kind = part.type;
  // header pins pointing back to the jumpers (VCC, GND, OUT at -P, 0, +P), and the board running away from the student
  for (let i = -1; i <= 1; i++) g.add(box(0.64, 0.64, 8, M.gold, i * P, 4, -3));
  g.add(box(3 * P, 2.5, 2.5, M.black, 0, 4, -6.5));
  const pw = 14, pl = 30;
  // the print reads the right way up for the student facing the module (it is placed turned round, its pins to the board)
  const up = (c, txt, x, y) => { c.save(); c.translate(x, y); c.rotate(Math.PI); c.fillText(txt, 0, 0); c.restore(); };
  const pcb = TX.pcbTexture(pw, pl, (c) => { c.fillStyle = '#eee'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = `700 1.05px ${TX.FONT}`;
    up(c, 'VCC', pw / 2 - P, pl - 3); up(c, 'GND', pw / 2, pl - 3); up(c, 'DO', pw / 2 + P, pl - 3);
    c.font = `700 1.6px ${TX.FONT}`; up(c, K.label, pw / 2, 7.6); up(c, kind === 'hall' ? 'A3144' : 'LM393', pw / 2, 5.2); }, '#1b4fb0');
  g.add(box(pw, 1.6, pl, [M.fr4, M.fr4, S({ map: pcb, roughness: 0.45 }), M.fr4, M.fr4, M.fr4], 0, 4, -8 - pl / 2));
  if (kind !== 'hall') { g.add(box(6.5, 4.6, 6.8, Q.blue, 0, 7.1, -24)); g.add(cyl(1.4, 0.4, Q.nickel, 0, 9.6, -24, 12)); } // the sensitivity knob
  g.add(box(4, 1.5, 5, M.epoxy, 0, 5.5, -16));
  const pwr = ledMat(0xff2a1a), det = ledMat(0x33ff55); const lp = box(1.6, 0.7, 0.8, pwr, -3.5, 5.15, -12), ld = box(1.6, 0.7, 0.8, det, 3.5, 5.15, -12); lp.userData.keep = ld.userData.keep = true; g.add(lp, ld);
  g.add(box(16, 3.2, 24, M.black, 0, 1.6, -20)); // a stand
  const head = new THREE.Group(); head.position.set(0, 5.6, -40); head.userData.keep = true; g.add(head); const extra = new THREE.Group(); extra.userData.keep = true; g.add(extra);
  let prop = null;
  switch (kind) {
    case 'flame': { const d = cyl(2.5, 5, M.blackGloss, 0, 0.6, -2, 20); d.rotation.x = Math.PI / 2; head.add(d); // the dark IR photodiode, looking forward
      prop = new THREE.Group(); prop.position.set(0, 0, -70); prop.add(cyl(6, 22, Q.wax, 0, 11, 0, 20)); prop.add(cyl(0.5, 3, Q.wick, 0, 23.5, 0, 6));
      const fl = new THREE.Mesh(new THREE.SphereGeometry(2.6, 12, 10), new THREE.MeshBasicMaterial({ color: 0xffb030, transparent: true, opacity: 0.95, toneMapped: false })); fl.scale.set(1, 2.1, 1); fl.position.y = 28.5; fl.userData.keep = true; prop.add(fl); prop.userData.flame = fl; break; }
    case 'sound': { const m = cyl(4.9, 5.5, Q.steel, 0, 2.6, 0, 24); head.add(m); head.add(cyl(4.2, 0.2, M.black, 0, 5.45, 0, 24)); break; } // the electret capsule, its felt face up
    case 'reed': case 'hall': {
      if (kind === 'reed') { const t = cyl(1.3, 14, Q.glass, 0, 1.5, 0, 12); t.rotation.z = Math.PI / 2; head.add(t); const r = box(12, 0.3, 0.5, Q.nickel, 0, 1.5, 0); head.add(r); }
      else { head.add(box(4, 3, 1.5, M.black, 0, 1.6, 0)); for (const x of [-1.27, 0, 1.27]) head.add(box(0.4, 0.4, 3, Q.nickel, x, 0.6, 2)); }
      prop = new THREE.Group(); prop.position.set(0, 0, -62); prop.add(box(20, 8, 10, Q.red, -5, 4, 0)); prop.add(box(10, 8, 10, Q.steel, 10, 4, 0)); break; } // a bar magnet: red N, grey S
    case 'tilt': { const c = cyl(3, 10, Q.steel, 0, 3.2, 0, 18); c.rotation.x = Math.PI / 2; head.add(c); break; }
    case 'vibe': { const c = cyl(2.5, 9, M.blackGloss || M.black, 0, 2.8, 0, 18); c.rotation.x = Math.PI / 2; head.add(c); head.add(box(5, 0.3, 4, Q.nickel, 0, 5.7, 0)); break; }
    case 'rain': { // a separate rain plate on two wires, nickel combs on a blue board
      prop = new THREE.Group(); prop.position.set(0, 0, -78); const C = document.createElement('canvas'); C.width = 256; C.height = 200; const c = C.getContext('2d'); c.fillStyle = '#1d4aa8'; c.fillRect(0, 0, 256, 200); c.strokeStyle = '#d9d4c6'; c.lineWidth = 7;
      for (let i = 0; i < 9; i++) { const y = 20 + i * 20; c.beginPath(); c.moveTo(i % 2 ? 236 : 20, y); c.lineTo(i % 2 ? 40 : 216, y); c.stroke(); } c.beginPath(); c.moveTo(20, 16); c.lineTo(20, 184); c.moveTo(236, 36); c.lineTo(236, 196); c.stroke();
      const t = new THREE.CanvasTexture(C); t.colorSpace = THREE.SRGBColorSpace; prop.add(box(54, 1.6, 40, [Q.plate, Q.plate, S({ map: t, roughness: 0.4 }), Q.plate, Q.plate, Q.plate], 0, 0.8, 0));
      prop.add(box(1.1, 1.1, 20, Q.red, -1, 1.2, 29), box(1.1, 1.1, 20, M.black, 1, 1.2, 29)); // its two-wire lead to the little board
      const drops = new THREE.Group(); drops.userData.keep = true; for (let i = 0; i < 9; i++) { const d = new THREE.Mesh(new THREE.SphereGeometry(2 + (i % 3) * 0.6, 10, 8), Q.water); d.scale.y = 0.45; d.position.set(-20 + (i * 17) % 40, 2, -14 + (i * 11) % 28); drops.add(d); }
      drops.visible = false; prop.add(drops); prop.userData.drops = drops; break; }
    case 'blink': { // the IR pair on an arm of a spectacle frame
      for (const s of [-1, 1]) { const d = cyl(1.6, 4, s < 0 ? M.blackGloss : Q.glass, s * 2.5, 0.6, -2, 16); d.rotation.x = Math.PI / 2; head.add(d); }
      prop = new THREE.Group(); prop.position.set(0, 0, -64); for (const s of [-1, 1]) { const rim = new THREE.Mesh(new THREE.TorusGeometry(9, 1.1, 8, 24), Q.frame); rim.position.set(s * 12, 12, 0); prop.add(rim); } prop.add(box(6, 1.6, 1.6, Q.frame, 0, 12, 0));
      const lid = new THREE.Group(); lid.userData.keep = true; for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.CircleGeometry(7.6, 20), S({ color: 0xf5e6d8, roughness: 0.6 })); e.position.set(s * 12, 12, -0.5); lid.add(e); const pu = new THREE.Mesh(new THREE.CircleGeometry(3, 16), M.black); pu.position.set(s * 12, 12, -0.4); pu.userData.pupil = true; lid.add(pu); } prop.add(lid); prop.userData.eyes = lid; break; }
  }
  if (prop) extra.add(prop);
  let last = null;
  g.userData.update = (p) => { // the LEDs, and what the student did
    const s = p.state, on = !!(s.trig || s.pulse > 0), pw2 = !!s.powered; const k = `${pw2}|${on}|${kind === 'tilt' ? s.trig : ''}`;
    if (prop && prop.userData.flame) { prop.visible = true; prop.userData.flame.visible = !!s.trig; if (s.trig) { prop.userData.flame.scale.y = 1.9 + Math.sin(performance.now() / 70) * 0.25; } }
    if (k === last && !(prop && prop.userData.flame && s.trig)) return false; last = k;
    pwr.emissiveIntensity = pw2 ? 2.2 : 0; det.emissiveIntensity = pw2 && on ? 2.6 : 0;
    if (prop && (kind === 'reed' || kind === 'hall')) prop.position.z = s.trig ? -50 : -78;
    if (prop && prop.userData.drops) prop.userData.drops.visible = !!s.trig;
    if (prop && prop.userData.eyes) for (const o of prop.userData.eyes.children) { if (o.userData.pupil) o.visible = !on; else o.material.color.setHex(on ? 0xd8a080 : 0xf5e6d8); } // a closed eyelid (or a blink): no pupil
    if (kind === 'tilt') head.rotation.z = s.trig ? 1.2 : 0;
    if (kind === 'vibe' || kind === 'sound') head.position.y = 5.6 + (on ? 0.6 : 0);
    return true;
  };
  g.userData.face = new THREE.Vector3(0, 0, -1);
  shadows(g); return g;
}
