// DUET Robotics Lab 360, batch 12: the models of the Class 1 circuit parts (parts12.js). Our own work, modelled in code.
//   sample   two crocodile clips on stiff leads (in the breadboard holes) biting the ends of the thing under test: a steel
//            spoon, a coin, a pencil sharpened at both ends, a plastic ruler, a pink eraser, a wooden ice-cream stick
//   buzzwire a wooden base, two posts, the wavy steel wire with red tape rests at both ends, and the ring on its handle (drag
//            it: role 'knob'); it jumps against the wire and sparks when it touches; a curly lead goes back to the connector
//   motor { disc: true }  Newton's colour disc (the seven colours, twice round) in place of the fan; spinning fast, the
//            colours blur into a pale grey-white (view.js turns its blur up with the speed, to userData.blurMax)
import * as THREE from 'three';
import { box, cyl, shadows, buildMotor } from './models.js';
import { SAMPLES, BENDS } from './parts12.js';

const P = 2.54;
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const S = (o) => new THREE.MeshStandardMaterial(o);
const keep = (o, role) => { o.userData.keep = true; if (role) { o.userData.role = role; o.name = role; } return o; };
let M = null;
function mats() {
  if (M) return M;
  M = { steel: S({ color: 0xcfd2d6, metalness: 1, roughness: 0.28 }), tin: S({ color: 0xd4d7dc, metalness: 1, roughness: 0.32 }), red: S({ color: 0xd42a1e, roughness: 0.45 }),
    black: S({ color: 0x1e1e20, roughness: 0.5 }), coin: S({ color: 0xc6c3b8, metalness: 1, roughness: 0.35 }), yellow: S({ color: 0xf2c418, roughness: 0.5 }),
    wood: S({ color: 0xd9b27c, roughness: 0.75 }), woodDark: S({ color: 0xa87a4a, roughness: 0.7 }), graphite: S({ color: 0x3a3c40, metalness: 0.5, roughness: 0.4 }),
    ruler: S({ color: 0x9fd4f2, roughness: 0.2, transparent: true, opacity: 0.72 }), eraser: S({ color: 0xf2a0b0, roughness: 0.85 }), eraserBlue: S({ color: 0x3a74c8, roughness: 0.85 }),
    tape: S({ color: 0xd8281c, roughness: 0.6 }), lead: S({ color: 0x2457c8, roughness: 0.45 }), spark: new THREE.MeshBasicMaterial({ color: 0xffe08a, transparent: true, opacity: 0 }) };
  for (const m of Object.values(M)) m.userData.shared = true;
  return M;
}
const tube = (pts, r, mat, seg = 16, rs = 6) => new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), seg, r, rs, false), mat);

// ------------------------------------------------------------------ a crocodile clip, mouth pointing along +x (or -x)
function clip(mat, dir) {
  const g = new THREE.Group(); const M = mats();
  g.add(box(9, 2.2, 3.2, mat, -dir * 4.5, 1.6, 0)); g.add(box(9, 2.2, 3.2, mat, -dir * 4.5, -1.6, 0)); // the plastic sleeves
  const top = box(5, 0.6, 2.4, M.tin, dir * 1.6, 0.5, 0); top.rotation.z = dir * 0.12; g.add(top);
  const bot = box(5, 0.6, 2.4, M.tin, dir * 1.6, -0.5, 0); bot.rotation.z = -dir * 0.12; g.add(bot);
  for (let i = 0; i < 3; i++) g.add(box(0.5, 0.5, 2.4, M.tin, dir * (0.4 + i * 1.3), 0.1, 0)); // the teeth
  return g;
}

// the thing under test, centred on x = 0, lying along x, its middle at y = 0; returns its length (the clips bite its two ends)
function thing(mat) {
  const M = mats(); const g = new THREE.Group(); let len = 40;
  switch (mat) {
    case 'coin': { len = 14; const c = cyl(7, 1.3, M.coin, 0, 0, 0, 32); c.rotation.z = Math.PI / 2; c.rotation.y = Math.PI / 2; g.add(c); g.add(cyl(5.6, 1.4, M.steel, 0, 0, 0, 32).rotateZ(Math.PI / 2).rotateY(Math.PI / 2)); break; }
    case 'pencil': {
      len = 42; const b = cyl(3.2, 32, M.yellow, 0, 0, 0, 6); b.rotation.z = Math.PI / 2; g.add(b);
      for (const s of [-1, 1]) { const w = cyl(3.2, 4.2, M.wood, s * 18.1, 0, 0, 6, 0.9); w.rotation.z = -s * Math.PI / 2; g.add(w); const gr = cyl(0.9, 1.6, M.graphite, s * 20.6, 0, 0, 8, 0.2); gr.rotation.z = -s * Math.PI / 2; g.add(gr); }
      break;
    }
    case 'ruler': { len = 44; g.add(box(44, 1.2, 9, M.ruler, 0, 0, 0)); for (let i = 0; i <= 20; i++) g.add(box(0.25, 0.1, i % 5 ? 1.4 : 2.6, M.black, -20 + i * 2, 0.65, -4.5 + (i % 5 ? 0.7 : 1.3))); break; }
    case 'eraser': { len = 30; g.add(box(30, 6, 11, M.eraser, -3, 0, 0)); g.add(box(8, 6.1, 11.1, M.eraserBlue, 11.5, 0, 0)); break; }
    case 'stick': { len = 40; g.add(box(34, 1.6, 7, M.wood, 0, 0, 0)); for (const s of [-1, 1]) g.add(cyl(3.5, 1.6, M.wood, s * 17, 0, 0, 16)); break; }
    default: { // the steel spoon: its handle, its bowl
      len = 40; g.add(box(26, 1, 3.4, M.steel, -6, 0, 0));
      const bowl = new THREE.Mesh(new THREE.SphereGeometry(5, 20, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), M.steel); bowl.scale.set(1.5, 0.45, 1); bowl.rotation.x = Math.PI; bowl.position.set(13, 0.8, 0); g.add(bowl);
    }
  }
  return { g, len };
}

export function buildSample(part) {
  const M = mats(); const g = new THREE.Group(); const mat = SAMPLES[part.props.mat] ? part.props.mat : 'spoon';
  const cx = 2 * P, y = 14; const { g: t, len } = thing(mat); t.position.set(cx, y, 0); g.add(t);
  const half = len / 2 - 1.5;
  [[0, -1, M.red], [4 * P, 1, M.black]].forEach(([hx, s, m]) => {
    g.add(box(0.6, 3, 0.6, M.tin, hx, -1, 0)); // the leg in the hole
    const cxp = cx + s * half; const c = clip(m, -s); c.position.set(cxp + s * 1.2, y, 0); g.add(c);
    g.add(tube([V3(hx, 0, 0), V3(hx, 5, 0), V3((hx + cxp) / 2 + s * 4, y - 3, 0), V3(cxp + s * 9, y, 0)], 0.75, M.lead === m ? M.lead : m, 14, 6));
  });
  shadows(g); return g;
}

// ------------------------------------------------------------------ the buzz wire
const BX0 = P, BZ = -58, HALF = 42, WY = 30; // the base's centre (x, z), half the wire's length, the wire's height
function wireAt(u) { // a point of the wavy wire, u from 0 (start rest) to 1 (end rest), in the part's frame
  let y = 0; for (const [a, b] of BENDS) if (u >= a && u <= b) y += Math.sin((u - a) / (b - a) * Math.PI) * 11 * (a > 0.5 ? -0.8 : 1);
  return V3(BX0 - HALF + 2 * HALF * u, WY + y, BZ);
}
export function buildBuzzWire() {
  const M = mats(); const g = new THREE.Group();
  g.add(box(2 * P + P, 2.6, 13, M.black, P, 1.5, -6.5)); for (const x of [0, 2 * P]) g.add(box(1.4, 1.4, 0.3, M.black, x, 1.5, 0.02)); // the connector
  g.add(box(2 * HALF + 16, 6, 24, M.woodDark, BX0, 3, BZ)); // the base
  for (const s of [-1, 1]) g.add(cyl(2.4, WY, M.wood, BX0 + s * HALF, 6 + (WY - 6) / 2, BZ, 12)); // the posts
  const pts = []; for (let i = 0; i <= 80; i++) pts.push(wireAt(i / 80));
  g.add(tube(pts, 0.8, M.steel, 160, 8));
  for (const [a, b] of [[0, 0.04], [0.96, 1]]) { const q = []; for (let i = 0; i <= 6; i++) q.push(wireAt(a + (b - a) * i / 6)); g.add(tube(q, 1.5, M.tape, 8, 8)); } // the insulated rests
  g.add(tube([V3(0, 1.5, -13), V3(-6, 3, -30), V3(BX0 - HALF - 6, 5, BZ + 8), V3(BX0 - HALF, 8, BZ + 2.5)], 0.7, M.red, 16, 6)); // the wire's lead
  // the ring on its handle (drag it); a curly lead back to the connector
  const wand = keep(new THREE.Group(), 'knob'); g.add(wand);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(3.4, 0.55, 8, 24), M.steel); wand.add(ring);
  const stem = cyl(0.5, 10, M.steel, 0, -3.4 - 5, 0, 8); wand.add(stem);
  const handle = cyl(2.2, 16, M.wood, 0, -3.4 - 10 - 8, 0, 14); wand.add(handle);
  const spark = new THREE.Mesh(new THREE.SphereGeometry(1.6, 10, 8), M.spark); wand.add(spark);
  const leadHolder = keep(new THREE.Group()); g.add(leadHolder);
  let last = '';
  const place = (p) => {
    const s = p.state; const u = Math.max(0.01, Math.min(0.99, s.pos || 0)); const k = u.toFixed(4) + (s.touch ? 'T' : '');
    if (k === last) return false; last = k;
    const c = wireAt(u), d = wireAt(Math.min(1, u + 0.01)).sub(wireAt(Math.max(0, u - 0.01))).normalize();
    wand.position.copy(c); // the ring around the wire (its axis along the wire), the handle hanging below it
    ring.quaternion.setFromUnitVectors(V3(0, 0, 1), d); ring.position.set(0, s.touch ? -2.6 : 0, 0);
    stem.position.y = (s.touch ? -2.6 : 0) - 3.4 - 5; handle.position.y = (s.touch ? -2.6 : 0) - 3.4 - 10 - 8;
    spark.position.set(0, 0.3, 0); M.spark.opacity = s.touch ? 0.95 : 0;
    for (const o of leadHolder.children) { o.geometry.dispose(); } leadHolder.clear();
    const hEnd = V3(c.x, c.y - 30, c.z + 2); leadHolder.add(tube([V3(2 * P, 1.5, -13), V3(2 * P + 6, 3, -26), V3((2 * P + hEnd.x) / 2, 2, BZ + 18), V3(hEnd.x, 6, hEnd.z + 8), hEnd], 0.6, M.lead, 24, 6));
    return true;
  };
  g.userData.update = (p) => place(p) || !!p.state.touch || (p.state.v || 0) > 0.02; // (keep the frames coming while it touches or the hand slows: the touch ends by itself)
  g.userData.place = place;
  shadows(g); return g;
}

// ------------------------------------------------------------------ Newton's colour disc on the motor
const RAINBOW = ['#8b2cf0', '#3f2a9c', '#1e5bff', '#22a84a', '#f5d90a', '#ff8c00', '#e0261c'];
let DISC = null;
function discTexture() {
  if (DISC) return DISC;
  const C = document.createElement('canvas'); C.width = C.height = 256; const c = C.getContext('2d');
  const n = RAINBOW.length * 2;
  for (let i = 0; i < n; i++) { c.fillStyle = RAINBOW[i % RAINBOW.length]; c.beginPath(); c.moveTo(128, 128); c.arc(128, 128, 126, i / n * Math.PI * 2, (i + 1) / n * Math.PI * 2); c.closePath(); c.fill(); }
  c.fillStyle = '#eeeee8'; c.beginPath(); c.arc(128, 128, 14, 0, 7); c.fill();
  DISC = new THREE.CanvasTexture(C); DISC.colorSpace = THREE.SRGBColorSpace; DISC.userData = { shared: true };
  return DISC;
}
export function buildDiscMotor() {
  const g = buildMotor(); const fan = g.userData.fan; if (!fan) return g;
  for (const o of [...fan.children]) fan.remove(o);
  const disc = new THREE.Mesh(new THREE.CircleGeometry(17, 48), new THREE.MeshStandardMaterial({ map: discTexture(), roughness: 0.6, side: THREE.DoubleSide }));
  disc.rotation.y = Math.PI; fan.add(disc);
  fan.add(cyl(2.6, 4, S({ color: 0xeeeee8, roughness: 0.5 }), 0, 0, 0, 16).rotateX(Math.PI / 2));
  const blur = new THREE.Mesh(new THREE.CircleGeometry(17.2, 48), new THREE.MeshBasicMaterial({ color: 0xdcd8d0, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }));
  blur.position.z = -0.4; fan.add(blur); g.userData.blur = blur; g.userData.blurMax = 0.93;
  return g;
}

export function buildPart12(part) {
  if (part.type === 'sample') return buildSample(part);
  if (part.type === 'buzzwire') { const g = buildBuzzWire(); g.userData.place(part); return g; }
  if (part.type === 'motor' && part.props.disc) return buildDiscMotor();
  return null;
}
