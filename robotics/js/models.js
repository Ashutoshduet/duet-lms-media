// DUET Robotics Lab 360: the 3D models, made in code (our own work: no downloaded models, no brand artwork).
// Units are mm. Each breadboard part is built with its first leg at the origin, standing on the breadboard's top (y = 0),
// legs going down into the holes. Free parts (servo, motor, battery, IR module) have their connector at the origin.
// Static pieces of a model are merged by material, so a part costs only a few draw calls on a phone.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { BOARDS, BB } from './boards.js';
import { LED_COLORS, PITCH as P } from './parts.js';
import * as TX from './tex.js';
import { buildPart2, setLite2 } from './models2.js';
import { buildPart4, setLite4 } from './models4.js'; // batch 4: the new boards' parts (bar graph, resistor network, touch plate, magnet)
import { buildPart3, setLite3 } from './models3.js'; // batch 3: the school-lab modules (LCD, OLED, relay, keypad, stepper, RFID…)
import { buildPart22 } from './models22.js'; import { buildPart24 } from './models24.js'; import { buildPart25 } from './models25.js'; import { buildPart26 } from './models26.js'; // batch 24: the MCP3008 chip // batch 22: the digital sensor modules
import { buildPart28 } from './models28.js'; // batch 28: the DS18B20 probe, the WS2812 stick
import { buildPart29 } from './models29.js'; // batch 29: the flex glove, the robot hand
import { buildPart6, setLite6 } from './models6.js'; // batch 6: the Pico, the Pi 4 (registered with models4.js), the active buzzer
import { buildPart7 } from './models7.js'; // batch 7: the bulb / fan on a 230 V box, the sanitizer bottle around the pump
import { buildPart12 } from './models12.js'; // batch 12: the test sample, the buzz wire, Newton's colour disc on the motor

let LITE = false; export function setLite(v) { LITE = v; TX.setLite(v); setLite2(v); setLite4(v); setLite3(v); setLite6(v); }
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);

// ------------------------------------------------------------------ materials (PBR)
const M = {};
export function materials() {
  if (M.gold) return M;
  const S = (o) => new THREE.MeshStandardMaterial(o);
  const Ph = (o) => (LITE ? new THREE.MeshStandardMaterial(Object.fromEntries(Object.entries(o).filter(([k]) => !/clearcoat|sheen|ior|specular/.test(k)))) : new THREE.MeshPhysicalMaterial(o));
  Object.assign(M, {
    gold: S({ color: 0xe8c374, metalness: 1, roughness: 0.26 }),
    tin: S({ color: 0xd4d7dc, metalness: 1, roughness: 0.32 }),
    steel: S({ color: 0xc9ccd1, metalness: 1, roughness: 0.38 }),
    alu: S({ color: 0xd8dade, metalness: 1, roughness: 0.42 }),
    black: S({ color: 0x141517, roughness: 0.55 }),
    blackGloss: Ph({ color: 0x101113, roughness: 0.32, clearcoat: 0.4, clearcoatRoughness: 0.4 }),
    epoxy: S({ color: 0x1a1a1b, roughness: 0.62 }),
    white: S({ color: 0xeeeee8, roughness: 0.5 }),
    ivory: S({ color: 0xf0ede6, roughness: 0.62 }),
    fr4: S({ color: 0x8f8a62, roughness: 0.7 }),
    darkIn: S({ color: 0x050505, roughness: 0.9 }),
    blueBody: Ph({ color: 0x1f4fd8, roughness: 0.35, transparent: true, opacity: 0.86, clearcoat: 0.6 }),
    potBlue: S({ color: 0x1d48b8, roughness: 0.45 }),
    knob: S({ color: 0x1a1a1c, roughness: 0.5 }),
    brownCap: S({ color: 0x9a6a44, roughness: 0.6 }),
    ceramic: S({ color: 0xc9a77c, roughness: 0.6 }),
    smdR: S({ color: 0x1d1d1d, roughness: 0.6 }),
    plasticRed: S({ color: 0xd8341c, roughness: 0.45 }),
    rubber: S({ color: 0x1e1f21, roughness: 0.9 }),
  });
  M.socket = TX.socketTopTexture(); M.socket.userData.shared = true;
  return M;
}
const box = (w, h, d, mat, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); return m; };
const cyl = (r, h, mat, x = 0, y = 0, z = 0, seg = 20, r2) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r2 === undefined ? r : r2, r, h, seg), mat); m.position.set(x, y, z); return m; };
function shadows(o, cast = true, recv = true) { o.traverse((m) => { if (m.isMesh) { m.castShadow = cast; m.receiveShadow = recv; } }); return o; }

// merge the static meshes of a model by material (kept: meshes, and their children, with userData.keep)
export function mergeStatic(root) {
  root.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(root.matrixWorld).invert();
  const groups = new Map(); const remove = [];
  const add = (mat, g, o) => { if (!groups.has(mat)) groups.set(mat, { geos: [], cast: false, recv: false }); const e = groups.get(mat); e.geos.push(g); e.cast = e.cast || o.castShadow; e.recv = e.recv || o.receiveShadow; };
  root.traverse((o) => {
    if (!o.isMesh || o === root || o.isInstancedMesh || o.isSkinnedMesh) return;
    for (let q = o; q && q !== root; q = q.parent) if (q.userData.keep) return;
    const g0 = o.geometry; let g = g0.index ? g0.toNonIndexed() : g0.clone();
    for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k);
    if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
    g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld));
    // a mesh with a material per face (a chip with a printed top): each face goes to its own material's pile
    if (Array.isArray(o.material)) { for (const gr of (g0.groups.length ? g0.groups : [{ start: 0, count: Infinity, materialIndex: 0 }])) { const m = o.material[gr.materialIndex]; if (m) add(m, sliceGeo(g, gr.start, Math.min(gr.count, g.attributes.position.count - gr.start)), o); } }
    else add(o.material, g, o);
    remove.push(o);
  });
  for (const o of remove) o.parent.remove(o);
  for (const [mat, e] of groups) { const g = mergeGeometries(e.geos, false); if (!g) continue; const m = new THREE.Mesh(g, mat); m.castShadow = e.cast; m.receiveShadow = e.recv; root.add(m); }
  return root;
}
// vertices [start, start + count) of a non-indexed geometry, as a geometry of its own
function sliceGeo(g, start, count) {
  const out = new THREE.BufferGeometry();
  for (const k of ['position', 'normal', 'uv']) { const a = g.attributes[k]; out.setAttribute(k, new THREE.BufferAttribute(a.array.slice(start * a.itemSize, (start + count) * a.itemSize), a.itemSize)); }
  return out;
}
export { box, cyl, shadows };

// ------------------------------------------------------------------ the bench: desk and cutting mat
export function buildBench(texLoader) {
  materials();
  const g = new THREE.Group(); g.name = 'bench';
  const load = (f, srgb) => { const t = texLoader.load(f); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1600 / 1830 * 1.6, 1000 / 1830 * 1.6); t.anisotropy = 8; return t; };
  const deskMat = new THREE.MeshStandardMaterial({ map: load('tex/oak_diff.jpg', true), roughnessMap: LITE ? null : load('tex/oak_rough.jpg'), normalMap: LITE ? null : load('tex/oak_nor_gl.jpg'), roughness: LITE ? 0.55 : 0.9, color: 0xf0dfc8 });
  if (deskMat.normalMap) deskMat.normalScale.set(0.4, 0.4);
  // only the top needs the wood's maps: the sides are plain wood (a top and a box: two draw calls, not six)
  const side = new THREE.MeshStandardMaterial({ color: 0x8a6440, roughness: 0.7 });
  const slab = (w, h, d, topM, sideM, x, y, z) => {
    const s = new THREE.Group(); s.position.set(x, y, z);
    const b = box(w, h - 0.05, d, sideM, 0, -0.025, 0); b.receiveShadow = true; s.add(b);
    const t = new THREE.Mesh(new THREE.PlaneGeometry(w, d), topM); t.rotation.x = -Math.PI / 2; t.position.y = h / 2; t.receiveShadow = true; s.add(t);
    return s;
  };
  const desk = slab(1800, 30, 1100, deskMat, side, -20, -3 - 15, 60); desk.name = 'desk'; g.add(desk); // (AR hides it: the real table is there)
  const matTex = TX.matTexture(); matTex.anisotropy = 8;
  const mTop = new THREE.MeshStandardMaterial({ map: matTex, roughness: 0.86 }), mSide = new THREE.MeshStandardMaterial({ color: 0x1a4433, roughness: 0.9 });
  const mat = slab(TX.MAT.w, 2.5, TX.MAT.d, mTop, mSide, -15, -1.25, 20); mat.name = 'mat';
  g.add(mat);
  return g;
}

// ------------------------------------------------------------------ the UNO R3 board
const UNO_SMD = [[24, 26, 0], [26.5, 26, 0], [29, 41, 1], [29, 43.5, 1], [10.5, 30, 0], [13, 30, 0], [24, 16, 1], [40.5, 26, 0], [43, 26, 0], [45.5, 26, 0], [52, 32, 1], [55, 32, 1], [58, 22, 0], [8, 20, 1], [22, 18, 0], [6, 44, 1], [12, 46, 0], [36, 24, 1]];
export function buildUno() {
  materials();
  const B = BOARDS.uno, W = B.size[0], H = B.size[1], top = B.pcbY + B.pcbT;
  const g = new THREE.Group(); g.name = 'uno';
  const T = TX.unoTextures();
  const pcb = new THREE.MeshStandardMaterial({ map: T.map, roughnessMap: T.rough, metalnessMap: T.rough, bumpMap: T.bump, bumpScale: LITE ? 0 : 1.2, roughness: 1, metalness: 1 });
  // the board outline with its four mounting holes
  const sh = new THREE.Shape(); B.outline.forEach(([x, y], i) => (i ? sh.lineTo(x - W / 2, y - H / 2) : sh.moveTo(x - W / 2, y - H / 2)));
  for (const [x, y] of B.holes) { const h = new THREE.Path(); h.absarc(x - W / 2, y - H / 2, 1.6, 0, Math.PI * 2, true); sh.holes.push(h); }
  const eg = new THREE.ExtrudeGeometry(sh, { depth: B.pcbT, bevelEnabled: false, curveSegments: 16 });
  const pos = eg.attributes.position, uv = eg.attributes.uv, nrm = eg.attributes.normal;
  for (let i = 0; i < pos.count; i++) if (Math.abs(nrm.getZ(i)) > 0.9) uv.setXY(i, (pos.getX(i) + W / 2) / W, (pos.getY(i) + H / 2) / H);
  const board = new THREE.Mesh(eg, [pcb, M.fr4]); board.rotation.x = -Math.PI / 2; board.position.y = B.pcbY; board.castShadow = true; board.receiveShadow = true; board.userData.keep = true; board.name = 'pcb';
  g.add(board);
  const parts = new THREE.Group(); g.add(parts);
  const L = (x, z) => [x, z]; // board-local mm
  // female headers (black, square openings on top): one top material for all four, the openings repeat along the u of
  // each header's top (n per header), so they merge into a single draw call
  const hdrs = { dl: [], dh: [], pw: [], an: [] }; for (const p of B.pins) hdrs[p.hdr].push(p);
  const topM = new THREE.MeshStandardMaterial({ map: M.socket, roughness: 0.6 });
  for (const k in hdrs) {
    const list = hdrs[k]; const xs = list.map((p) => p.at[0]); const x0 = Math.min(...xs), x1 = Math.max(...xs); const n = list.length;
    const b = box(x1 - x0 + 2.54, B.hdrH, 2.54, [M.black, M.black, topM, M.black, M.black, M.black], (x0 + x1) / 2, top + B.hdrH / 2, list[0].at[1]);
    const uv = b.geometry.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setX(i, uv.getX(i) * n);
    parts.add(b);
  }
  // ICSP (male 2 × 3) near the chip and near the USB chip
  for (const [cx, cz] of [[29.2, 0], [-10.2, -20.3]]) {
    parts.add(box(5.08, 2.5, 7.62, M.black, cx, top + 1.25, cz));
    for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) parts.add(box(0.64, 8.4, 0.64, M.gold, cx - 1.27 + j * 2.54, top + 3.4, cz - 2.54 + i * 2.54));
  }
  // the ATmega328P in its socket
  const chipR = B.regions.find((r) => r.id === 'mcu');
  const [mx, mz] = chipR.at;
  parts.add(box(36.4, 3.0, 9.6, M.black, mx, top + 1.5, mz)); // socket
  const chipTex = TX.labelTexture(['ATMEGA328P-PU', '2426  AVR · 8-bit · 16 MHz'], { w: 512, h: 104, size: 30, dot: [0.06, 0.72], notch: 'r' });
  const chipTop = new THREE.MeshStandardMaterial({ map: chipTex, roughness: 0.6 });
  parts.add(box(35.2, 3.4, 7.2, [M.epoxy, M.epoxy, chipTop, M.epoxy, M.epoxy, M.epoxy], mx, top + 3.0 + 1.7, mz));
  for (let i = 0; i < 14; i++) for (const s of [-1, 1]) { const x = mx - 16.51 + i * 2.54; parts.add(box(0.5, 2.4, 0.9, M.tin, x, top + 3.6, mz + s * 3.75)); parts.add(box(0.5, 0.3, 1.2, M.tin, x, top + 4.6, mz + s * 3.45)); }
  // the USB chip (QFN), crystal, regulator, capacitors, reset button
  const q = B.regions.find((r) => r.id === 'usbchip').at;
  parts.add(box(5, 0.9, 5, [M.epoxy, M.epoxy, new THREE.MeshStandardMaterial({ map: TX.labelTexture(['16U2', 'MU'], { w: 128, h: 128, size: 30, dot: [0.15, 0.15] }), roughness: 0.6 }), M.epoxy, M.epoxy, M.epoxy], q[0], top + 0.45, q[1]));
  const xt = B.regions.find((r) => r.id === 'xtal').at;
  const xShape = new THREE.Shape(); xShape.absarc(-3.4, 0, 2.3, Math.PI / 2, Math.PI * 1.5); xShape.absarc(3.4, 0, 2.3, -Math.PI / 2, Math.PI / 2);
  const xg = new THREE.ExtrudeGeometry(xShape, { depth: 3.5, bevelEnabled: true, bevelThickness: 0.3, bevelSize: 0.25, bevelSegments: 2, curveSegments: 12 });
  const xm = new THREE.Mesh(xg, M.steel); xm.rotation.x = -Math.PI / 2; xm.position.set(xt[0], top + 0.3, xt[1]); parts.add(xm);
  parts.add(box(9, 0.3, 3.4, M.black, xt[0], top + 0.15, xt[1]));
  const rg = B.regions.find((r) => r.id === 'reg').at;
  parts.add(box(6.5, 1.7, 3.5, M.epoxy, rg[0], top + 0.85, rg[1] + 1.2)); parts.add(box(3.0, 0.3, 2.2, M.tin, rg[0], top + 0.15, rg[1] - 2.2)); parts.add(box(6.5, 0.4, 0.1, M.tin, rg[0], top + 1.2, rg[1] - 0.55));
  const capTopM = new THREE.MeshStandardMaterial({ color: 0xbfc2c6, metalness: 1, roughness: 0.3 });
  for (const [cx, cz] of [[-15.5, 18.5], [-9.0, 18.5]]) {
    parts.add(box(6.6, 1.0, 6.6, M.black, cx, top + 0.5, cz));
    const can = cyl(3.1, 5.0, M.alu, cx, top + 1.0 + 2.5, cz, 24); parts.add(can);
    const capTop = cyl(3.0, 0.08, capTopM, cx, top + 6.02, cz, 24); parts.add(capTop);
    parts.add(box(1.2, 0.1, 5.8, M.black, cx - 2.2, top + 6.07, cz));
  }
  const rs = B.regions.find((r) => r.id === 'reset').at;
  parts.add(box(6.0, 3.0, 6.0, M.black, rs[0], top + 1.5, rs[1])); parts.add(box(6.2, 0.3, 6.2, M.steel, rs[0], top + 3.15, rs[1]));
  const rcap = cyl(1.75, 1.6, new THREE.MeshStandardMaterial({ color: 0x1c1c1e, roughness: 0.45 }), rs[0], top + 4.1, rs[1], 20); rcap.userData.keep = true; rcap.name = 'resetCap'; g.add(rcap);
  // USB-B and the power jack
  const us = B.regions.find((r) => r.id === 'usb').at;
  const shell = box(16, 10.9, 12, M.steel, us[0], top + 5.45, us[1]); parts.add(shell);
  parts.add(box(0.4, 7.6, 8.4, M.darkIn, us[0] - 8.0, top + 5.6, us[1])); parts.add(box(1.0, 3.0, 5.2, M.white, us[0] - 7.8, top + 5.0, us[1]));
  for (const s of [-1, 1]) parts.add(box(12, 0.25, 0.4, M.steel, us[0] + 1, top + 10.95, us[1] + s * 4));
  const jk = B.regions.find((r) => r.id === 'jack').at;
  parts.add(box(14.2, 11, 9, M.black, jk[0], top + 5.5, jk[1]));
  const hole = cyl(3.15, 0.5, M.darkIn, jk[0] - 7.1, top + 6.5, jk[1], 24); hole.rotation.z = Math.PI / 2; parts.add(hole);
  const jpin = cyl(1.0, 0.6, M.tin, jk[0] - 7.2, top + 6.5, jk[1], 12); jpin.rotation.z = Math.PI / 2; parts.add(jpin);
  // small parts: resistors and capacitors (0603)
  for (const [x, y, rot] of UNO_SMD) { const lx = x - W / 2, lz = H / 2 - y; const w = rot ? 0.8 : 1.6, d = rot ? 1.6 : 0.8; parts.add(box(w, 0.5, d, (x + y) % 2 > 1 ? M.smdR : M.ceramic, lx, top + 0.25, lz)); parts.add(box(rot ? 0.82 : 0.3, 0.52, rot ? 0.3 : 0.82, M.tin, lx - (rot ? 0 : 0.7), top + 0.26, lz - (rot ? 0.7 : 0))); parts.add(box(rot ? 0.82 : 0.3, 0.52, rot ? 0.3 : 0.82, M.tin, lx + (rot ? 0 : 0.7), top + 0.26, lz + (rot ? 0.7 : 0))); }
  // the four small LEDs: they light up
  const leds = {};
  const mkLed = (id, x, z, col) => {
    const m = new THREE.MeshStandardMaterial({ color: 0xf2efe0, roughness: 0.3, emissive: col, emissiveIntensity: 0, transparent: true, opacity: 0.92 });
    const b = box(1.6, 0.7, 0.8, m, x, top + 0.35, z); b.userData.keep = true; g.add(b); leds[id] = m;
  };
  mkLed('L', -3.8, -18.5, 0xffa020); mkLed('TX', -3.8, -12.7, 0xffb020); mkLed('RX', -3.8, -10.2, 0xffb020); mkLed('ON', 25.4, -12.7, 0x33ff55);
  shadows(parts); mergeStatic(parts); g.userData.leds = leds; g.userData.resetCap = rcap;
  // invisible boxes to pick the board's parts (labels, lesson 1)
  const pick = new THREE.Group(); pick.name = 'pick';
  const pm = new THREE.MeshBasicMaterial({ visible: false });
  for (const r of B.regions) { const b = box(r.hw * 2, r.h, r.hd * 2, pm, r.at[0], top + r.h / 2, r.at[1]); b.userData.region = r.id; pick.add(b); }
  g.add(pick);
  return g;
}

// ------------------------------------------------------------------ the breadboard
export function buildBreadboard() {
  materials();
  const [Wb, Db, Hb] = BB.size; const g = new THREE.Group(); g.name = 'breadboard';
  const T = TX.breadboardTextures();
  const topM = new THREE.MeshStandardMaterial({ map: T.map, normalMap: T.normal, roughness: 0.6, color: 0xffffff });
  const sh = new THREE.Shape(); const r = 1.4, w = Wb / 2, d = Db / 2;
  sh.moveTo(-w + r, -d); sh.lineTo(w - r, -d); sh.quadraticCurveTo(w, -d, w, -d + r); sh.lineTo(w, d - r); sh.quadraticCurveTo(w, d, w - r, d); sh.lineTo(-w + r, d); sh.quadraticCurveTo(-w, d, -w, d - r); sh.lineTo(-w, -d + r); sh.quadraticCurveTo(-w, -d, -w + r, -d);
  const eg = new THREE.ExtrudeGeometry(sh, { depth: Hb - 1.2, bevelEnabled: true, bevelThickness: 0.6, bevelSize: 0.5, bevelSegments: 2, curveSegments: 4 });
  eg.translate(0, 0, 0.6);
  const pos = eg.attributes.position, uv = eg.attributes.uv, nrm = eg.attributes.normal;
  for (let i = 0; i < pos.count; i++) if (Math.abs(nrm.getZ(i)) > 0.9) uv.setXY(i, (pos.getX(i) + w) / Wb, (pos.getY(i) + d) / Db);
  // top cap: the textured plastic; sides: plain
  // the shape's +y becomes the back (-z) after the turn, as the texture's top row
  const body = new THREE.Mesh(eg, [topM, M.ivory]); body.rotation.x = -Math.PI / 2; body.castShadow = true; body.receiveShadow = true; body.name = 'bbBody';
  g.add(body);
  return g;
}

// ------------------------------------------------------------------ parts
function leg(x, y0, y1, z = 0, mat, w = 0.5) { return box(w, y1 - y0, w, mat || M.tin, x, (y0 + y1) / 2, z); }
// an axial lead: down into the hole at (x, z), bent over to the body at height y, ending at xb
function axialLead(x, xb, y, r = 0.3) {
  const dir = Math.sign(xb - x); const bend = 0.9;
  const path = new THREE.CurvePath();
  path.add(new THREE.LineCurve3(V3(x, -6, 0), V3(x, y - bend, 0)));
  path.add(new THREE.QuadraticBezierCurve3(V3(x, y - bend, 0), V3(x, y, 0), V3(x + dir * bend, y, 0)));
  path.add(new THREE.LineCurve3(V3(x + dir * bend, y, 0), V3(xb, y, 0)));
  return new THREE.Mesh(new THREE.TubeGeometry(path, 16, r, 6, false), M.tin);
}
const LED_GEOS = {};
function ledGeos() {
  if (LED_GEOS.dome) return LED_GEOS;
  const pts = [V3(0, 0, 0), V3(2.5, 0, 0), V3(2.5, 5.4, 0)]; for (let i = 1; i <= 8; i++) { const a = i / 8 * Math.PI / 2; pts.push(V3(2.5 * Math.cos(a), 5.4 + 2.5 * Math.sin(a), 0)); }
  LED_GEOS.dome = new THREE.LatheGeometry(pts.map((p) => new THREE.Vector2(p.x, p.y)), 28);
  const fl = new THREE.Shape(); const R = 2.95, cut = -2.45; const a0 = Math.acos(cut / R);
  fl.moveTo(cut, -Math.sqrt(R * R - cut * cut)); fl.absarc(0, 0, R, -a0 + Math.PI * 2 - Math.PI * 2, a0, false); fl.lineTo(cut, Math.sqrt(R * R - cut * cut)); fl.lineTo(cut, -Math.sqrt(R * R - cut * cut));
  LED_GEOS.flange = new THREE.ExtrudeGeometry(fl, { depth: 1.0, bevelEnabled: false, curveSegments: 24 });
  LED_GEOS.dome.userData.shared = true; LED_GEOS.flange.userData.shared = true;
  return LED_GEOS;
}
export function buildLED(color, rgb) {
  materials(); const G = ledGeos();
  const g = new THREE.Group(); const lift = 3.0; const n = rgb ? 4 : 2; const cx = (n - 1) * P / 2;
  const c = rgb ? { body: 0xf4f4f0, glow: 0xffffff } : LED_COLORS[color];
  for (let i = 0; i < n; i++) g.add(leg(i * P, -6, lift + (rgb ? 0.3 : 0.3), 0, M.tin, 0.45));
  const body = new THREE.Group(); body.position.set(cx, lift, 0); body.userData.keep = true; g.add(body);
  const domeM = new THREE.MeshPhysicalMaterial({ color: rgb ? 0xf6f6f2 : c.body, roughness: rgb ? 0.55 : 0.28, transparent: true, opacity: rgb ? 0.86 : 0.8, emissive: c.glow, emissiveIntensity: 0, clearcoat: LITE ? 0 : 0.5 });
  const dome = new THREE.Mesh(G.dome, domeM); dome.position.y = 1.0; dome.castShadow = true; body.add(dome);
  const fl = new THREE.Mesh(G.flange, domeM); fl.rotation.x = -Math.PI / 2; body.add(fl);
  // the lead frame inside: the anvil (cathode) and the post (anode), and the tiny chip that glows
  const inner = new THREE.MeshStandardMaterial({ color: 0x8a8d92, metalness: 1, roughness: 0.4 });
  body.add(box(0.5, 4.2, 1.6, inner, rgb ? 0.3 : -0.7, 2.6, 0)); body.add(box(0.5, 3.6, 0.9, inner, rgb ? -0.9 : 0.7, 2.3, 0));
  const dieM = new THREE.MeshBasicMaterial({ color: c.glow, transparent: true, opacity: 0 });
  const die = new THREE.Mesh(new THREE.SphereGeometry(0.55, 10, 8), dieM); die.position.y = 4.6; body.add(die);
  g.userData.led = { domeM, dieM, base: new THREE.Color(rgb ? 0xf6f6f2 : c.body), glow: new THREE.Color(c.glow), body, top: lift + 8.4, cx };
  shadows(g, true, false); return g;
}
export function buildResistor(ohms, span) {
  materials(); const g = new THREE.Group(); const L = 6.3, x0 = (span * P - L) / 2, y = 1.85;
  const pts = [[0, 0], [0.95, 0], [1.25, 0.35], [1.25, 1.7], [1.05, 2.1], [1.05, 4.2], [1.25, 4.6], [1.25, 5.95], [0.95, 6.3], [0, 6.3]].map(([r, h]) => new THREE.Vector2(r, h));
  const geo = new THREE.LatheGeometry(pts, 22); const pos = geo.attributes.position, uv = geo.attributes.uv;
  for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getY(i) / L, (Math.atan2(pos.getZ(i), pos.getX(i)) / (Math.PI * 2)) + 0.5);
  const mat = new THREE.MeshPhysicalMaterial({ map: TX.resistorTexture(ohms), roughness: 0.45, clearcoat: LITE ? 0 : 0.35 });
  const body = new THREE.Mesh(geo, mat); body.rotation.z = -Math.PI / 2; body.position.set(x0, y, 0); body.castShadow = true; body.userData.keep = true; body.userData.role = 'body'; body.name = 'rbody';
  g.add(body); g.add(axialLead(0, x0 + 0.3, y)); g.add(axialLead(span * P, x0 + L - 0.3, y));
  g.userData.bodyMat = mat; shadows(g, true, false); return g;
}
export function buildDiode(span) {
  materials(); const g = new THREE.Group(); const L = 5.2, x0 = (span * P - L) / 2, y = 1.9;
  const b = cyl(1.35, L, M.blackGloss, x0 + L / 2, y, 0, 20); b.rotation.z = Math.PI / 2; g.add(b);
  const band = cyl(1.38, 0.9, new THREE.MeshStandardMaterial({ color: 0xbfc0c2, roughness: 0.5 }), x0 + L - 0.9, y, 0, 20); band.rotation.z = Math.PI / 2; g.add(band);
  g.add(axialLead(0, x0 + 0.3, y, 0.38)); g.add(axialLead(span * P, x0 + L - 0.3, y, 0.38));
  shadows(g, true, false); return g;
}
export function buildButton() {
  materials(); const g = new THREE.Group(); const cx = P, cz = 1.5 * P;
  g.add(box(6, 3.4, 6, M.black, cx, 1.9, cz)); g.add(box(6.2, 0.3, 6.2, M.steel, cx, 3.75, cz));
  for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) g.add(box(1.0, 0.8, 0.3, M.steel, cx + dx * 2.6, 3.3, cz + dz * 3.15));
  for (const [x, z] of [[0, 0], [2 * P, 0], [0, 3 * P], [2 * P, 3 * P]]) { g.add(leg(x, -6, 0.6, z, M.tin, 0.5)); g.add(box(0.5, 0.5, Math.abs(cz - z) - 2.5, M.tin, x, 0.55, (z + (cz + Math.sign(z - cz) * 2.5)) / 2)); }
  const cap = cyl(1.8, 1.7, new THREE.MeshStandardMaterial({ color: 0x232325, roughness: 0.42 }), cx, 4.75, cz, 24); cap.userData.keep = true; cap.userData.role = 'cap'; cap.name = 'cap';
  g.add(cap); g.userData.cap = cap; shadows(g, true, false); return g;
}
export function buildPot() {
  materials(); const g = new THREE.Group(); const cx = 2 * P, cz = 3.4; // legs at the back edge: the holes behind stay free to wire
  for (let i = 0; i < 3; i++) { g.add(leg(i * P * 2, -6, 1.2, 0, M.tin, 0.6)); g.add(box(0.6, 0.6, 1.6, M.tin, i * P * 2, 1.2, 0.6)); }
  g.add(box(9.8, 6.4, 9.8, M.potBlue, cx, 1.5 + 3.2, cz));
  g.add(cyl(3.6, 1.2, M.steel, cx, 8.5, cz, 20));
  const knob = new THREE.Group(); knob.position.set(cx, 9.1, cz); knob.userData.keep = true; knob.userData.role = 'knob'; knob.name = 'knob';
  const kb = cyl(6.0, 8.5, M.knob, 0, 4.25, 0, 24, 5.6); knob.add(kb);
  for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2; const r = box(0.6, 7.4, 0.6, M.knob, Math.cos(a) * 5.95, 3.9, Math.sin(a) * 5.95); r.rotation.y = -a; knob.add(r); }
  knob.add(box(0.9, 0.12, 4.2, M.white, 0, 8.56, 2.4)); // the pointer line
  g.add(knob); g.userData.knob = knob; shadows(g, true, false); return g;
}
export function buildBuzzer() {
  materials(); const g = new THREE.Group(); const cx = 1.5 * P;
  g.add(leg(0, -6, 0.6)); g.add(leg(3 * P, -6, 0.6));
  g.add(cyl(6.0, 8.5, M.blackGloss, cx, 0.6 + 4.25, 0, 32));
  g.add(cyl(1.1, 0.1, M.darkIn, cx, 0.6 + 8.52, 0, 16));
  const plus = new THREE.MeshBasicMaterial({ color: 0xdedede }); g.add(box(1.4, 0.1, 0.3, plus, 0.6, 9.15, 0)); g.add(box(0.3, 0.1, 1.4, plus, 0.6, 9.15, 0));
  shadows(g, true, false); return g;
}
export function buildLDR() {
  materials(); const g = new THREE.Group(); const cx = P; const lift = 4;
  g.add(leg(0, -6, lift, 0, M.tin, 0.4)); g.add(leg(2 * P, -6, lift, 0, M.tin, 0.4));
  const disc = cyl(2.6, 1.9, new THREE.MeshStandardMaterial({ color: 0xe8e0d0, roughness: 0.4 }), cx, lift + 2.6, 0, 24); disc.rotation.x = Math.PI / 2; g.add(disc);
  const face = new THREE.Mesh(new THREE.CircleGeometry(2.45, 24), new THREE.MeshPhysicalMaterial({ map: TX.ldrTexture(), roughness: 0.25, clearcoat: LITE ? 0 : 0.8 })); face.position.set(cx, lift + 2.6, 0.96); g.add(face);
  shadows(g, true, false); return g;
}
function to92(text) {
  const g = new THREE.Group(); const sh = new THREE.Shape(); const R = 2.4, fz = 1.3, a0 = Math.asin(fz / R);
  sh.moveTo(R * Math.cos(-a0), -fz); sh.absarc(0, 0, R, -a0, Math.PI + a0, false); sh.lineTo(R * Math.cos(-a0), -fz);
  const eg = new THREE.ExtrudeGeometry(sh, { depth: 4.8, bevelEnabled: false, curveSegments: 20 });
  const lab = TX.labelTexture(text, { w: 128, h: 128, size: 26 });
  const body = new THREE.Mesh(eg, M.epoxy); body.rotation.x = -Math.PI / 2; body.position.y = 3; g.add(body);
  const face = new THREE.Mesh(new THREE.PlaneGeometry(3.9, 4.4), new THREE.MeshStandardMaterial({ map: lab, roughness: 0.6 })); face.position.set(0, 3 + 2.4, fz + 0.02); g.add(face);
  return g;
}
export function buildTO92(label) {
  materials(); const g = new THREE.Group();
  for (let i = 0; i < 3; i++) { g.add(leg(i * P, -6, 1.8, 0, M.tin, 0.45)); const dx = (i - 1) * (P - 1.27); g.add(box(Math.abs(dx) + 0.45, 0.45, 0.45, M.tin, i * P - dx / 2, 1.8, 0)); g.add(leg(i * P - dx, 1.8, 3.2, 0, M.tin, 0.45)); }
  const b = to92(label); b.position.x = P; g.add(b); shadows(g, true, false); return g;
}
export function buildHCSR04() {
  materials(); const g = new THREE.Group(); const cx = 1.5 * P, y0 = 2.6, pw = 45, ph = 20;
  for (let i = 0; i < 4; i++) { g.add(leg(i * P, -6, y0 + 3, 0, M.gold, 0.64)); }
  g.add(box(4 * P, 2.5, 2.5, M.black, cx, 1.25 + 0.1, 0));
  const pcbT = TX.pcbTexture(pw, ph, (c) => {
    c.fillStyle = '#e8e8e8'; c.font = `700 3px ${TX.FONT}`; c.textAlign = 'center'; c.fillText('HC-SR04', pw / 2, 4.2);
    c.font = `600 1.6px ${TX.FONT}`; ['Vcc', 'Trig', 'Echo', 'Gnd'].forEach((t, i) => c.fillText(t, pw / 2 + (i - 1.5) * 2.54, ph - 3.2));
    c.font = `700 2.2px ${TX.FONT}`; c.fillText('T', 4, 10); c.fillText('R', pw - 4, 10);
  }, '#1e56b8');
  const pm = new THREE.MeshStandardMaterial({ map: pcbT, roughness: 0.45 });
  g.add(box(pw, ph, 1.6, [M.fr4, M.fr4, M.fr4, M.fr4, pm, pm], cx, y0 + ph / 2, -1.5));
  const mesh = TX.meshTexture(); const meshM = new THREE.MeshStandardMaterial({ map: mesh, metalness: 0.6, roughness: 0.5 });
  for (const s of [-1, 1]) {
    const t = cyl(8.1, 12, M.alu, cx + s * 13, y0 + ph / 2, 5.3, 32); t.rotation.x = Math.PI / 2; g.add(t);
    const f = new THREE.Mesh(new THREE.CircleGeometry(7.2, 32), meshM); f.position.set(cx + s * 13, y0 + ph / 2, 11.32); g.add(f);
    const ring = new THREE.Mesh(new THREE.RingGeometry(7.2, 8.1, 32), M.alu); ring.position.set(cx + s * 13, y0 + ph / 2, 11.31); g.add(ring);
  }
  const x = new THREE.Shape(); x.absarc(-2.8, 0, 1.8, Math.PI / 2, Math.PI * 1.5); x.absarc(2.8, 0, 1.8, -Math.PI / 2, Math.PI / 2);
  const xm = new THREE.Mesh(new THREE.ExtrudeGeometry(x, { depth: 3, bevelEnabled: false }), M.steel); xm.position.set(cx, y0 + ph - 2.4, -0.7); g.add(xm);
  shadows(g, true, false); g.userData.face = new THREE.Vector3(0, 0, 1); return g;
}
// free parts: the connector at the origin (pins along x), the body behind it (-z)
function connector(n, x0 = -P) {
  const g = new THREE.Group(); g.add(box(n * P, 2.6, 13, M.black, x0 + (n - 1) * P / 2, 1.3 + 0.2, -6.5));
  for (let i = 0; i < n; i++) g.add(box(1.4, 1.4, 0.3, M.darkIn, x0 + i * P, 1.5, 0.02));
  return g;
}
function ribbon(cols, from, to, x0, ctrl) { // a flat cable of coloured wires
  const g = new THREE.Group();
  cols.forEach((c, i) => {
    const off = x0 + i * 1.3;
    const curve = new THREE.CubicBezierCurve3(V3(from.x + off, from.y, from.z), V3(from.x + off, from.y, from.z - ctrl), V3(to.x + off * 0.5, to.y, to.z + ctrl), V3(to.x + off * 0.5, to.y, to.z));
    g.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 30, 0.62, 6, false), new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.4, clearcoat: LITE ? 0 : 0.5 })));
  });
  return g;
}
export function buildServo() {
  materials(); const g = new THREE.Group();
  g.add(connector(3));
  g.add(ribbon([0x5a3a24, 0xc8281c, 0xf08a14], V3(-P * 0.5, 1.5, -13), V3(-1, 4, -58), -1.3, 22));
  const body = new THREE.Group(); body.position.set(0, 0, -72); g.add(body);
  body.add(box(22.8, 22.5, 12.2, M.blueBody, 0, 11.25, 0));
  body.add(box(32.3, 2.4, 12.2, M.blueBody, 0, 16.2, 0));
  for (const s of [-1, 1]) body.add(cyl(1.0, 2.6, M.darkIn, s * 14, 16.2, 0, 12));
  body.add(box(11.6, 4.0, 11.6, M.blueBody, -5.6, 24.5, 0)); body.add(cyl(5.9, 4.0, M.blueBody, -5.6, 24.5, 0, 24));
  const sticker = new THREE.Mesh(new THREE.PlaneGeometry(20, 9), new THREE.MeshStandardMaterial({ map: TX.labelSticker([['SG90', 46, 52], ['9g · micro servo', 26, 106]], '#1a1a1c', '#e8e8e8'), roughness: 0.5 }));
  sticker.position.set(0, 9, 6.12); body.add(sticker);
  body.add(cyl(2.4, 2.4, M.white, -5.6, 27.6, 0, 16));
  const horn = new THREE.Group(); horn.position.set(-5.6, 29.0, 0); horn.userData.keep = true; horn.name = 'horn';
  const hs = new THREE.Shape(); hs.absarc(0, 0, 3.6, Math.PI / 2, Math.PI * 1.5); hs.lineTo(15, -1.8); hs.absarc(15, 0, 1.8, -Math.PI / 2, Math.PI / 2); hs.lineTo(0, 3.6);
  const hm = new THREE.Mesh(new THREE.ExtrudeGeometry(hs, { depth: 1.6, bevelEnabled: true, bevelThickness: 0.2, bevelSize: 0.2, bevelSegments: 1 }), M.white); hm.rotation.x = -Math.PI / 2; horn.add(hm);
  for (let i = 0; i < 5; i++) horn.add(cyl(0.45, 0.2, M.darkIn, 5 + i * 2.2, 1.85, 0, 8));
  body.add(horn); g.userData.horn = horn;
  shadows(g); return g;
}
export function buildMotor() {
  materials(); const g = new THREE.Group();
  g.add(connector(2, 0));
  g.add(ribbon([0xc8281c, 0x1b1b1d], V3(0, 1.5, -13), V3(-2, 10, -42), 0, 18));
  const body = new THREE.Group(); body.position.set(P, 0, -66); g.add(body);
  body.add(box(28, 6, 22, new THREE.MeshStandardMaterial({ color: 0xb08860, roughness: 0.8 }), 0, 3, 0)); // a small wooden stand
  const can = cyl(10.2, 25, M.alu, 0, 16.2, 0, 32); can.rotation.x = Math.PI / 2; body.add(can);
  const cap = cyl(9.6, 6, M.white, 0, 16.2, 15.2, 28); cap.rotation.x = Math.PI / 2; body.add(cap);
  for (const s of [-1, 1]) body.add(box(1.5, 3.4, 0.4, M.tin, s * 4, 21.5, 18.4));
  const sh = cyl(1.0, 9, M.steel, 0, 16.2, -16.5, 12); sh.rotation.x = Math.PI / 2; body.add(sh);
  const fan = new THREE.Group(); fan.position.set(0, 16.2, -20); fan.userData.keep = true; fan.name = 'fan';
  fan.add((() => { const h = cyl(2.6, 4, M.plasticRed, 0, 0, 0, 16); h.rotation.x = Math.PI / 2; return h; })());
  for (let i = 0; i < 3; i++) { const b = box(4.2, 15, 0.9, M.plasticRed, 0, 8.5, 0); b.rotation.y = 0.45; const p = new THREE.Group(); p.rotation.z = i * Math.PI * 2 / 3; p.add(b); fan.add(p); }
  const blur = new THREE.Mesh(new THREE.CircleGeometry(16.5, 40), new THREE.MeshBasicMaterial({ color: 0xd8341c, transparent: true, opacity: 0, depthWrite: false })); blur.position.z = -0.6; blur.rotation.y = Math.PI; fan.add(blur);
  body.add(fan); g.userData.fan = fan; g.userData.blur = blur;
  shadows(g); return g;
}
export function buildBattery() {
  materials(); const g = new THREE.Group();
  g.add(connector(2, 0));
  g.add(ribbon([0xc8281c, 0x1b1b1d], V3(0, 1.5, -13), V3(-2, 9, -40), 0, 16));
  const body = new THREE.Group(); body.position.set(P, 0, -70); g.add(body);
  const lab = TX.labelSticker([['9V', 92, 70], ['DUET POWER · 6F22', 22, 128]], '#1b2a4a', '#f0c030', 256, 160);
  const lm = new THREE.MeshStandardMaterial({ map: lab, roughness: 0.4 });
  body.add(box(48.5, 17.5, 26.5, [M.steel, M.steel, lm, M.black, lm, lm], 0, 8.75, 0));
  body.add(cyl(4.2, 2.6, M.steel, 9, 8.75, 13.3 + 1.3, 6)); body.add(cyl(3.3, 2.6, M.steel, -4, 8.75, 13.3 + 1.3, 16));
  for (const b of body.children.slice(-2)) b.rotation.x = Math.PI / 2;
  body.rotation.y = Math.PI / 2; body.position.x = 10;
  shadows(g); return g;
}
export function buildIR() {
  materials(); const g = new THREE.Group();
  // 3 header pins pointing back to the jumpers (VCC, GND, OUT at -P, 0, +P)
  for (let i = -1; i <= 1; i++) g.add(box(0.64, 0.64, 8, M.gold, i * P, 4, -3));
  g.add(box(3 * P, 2.5, 2.5, M.black, 0, 4, -6.5));
  const pw = 14, pl = 32;
  const pcb = TX.pcbTexture(pw, pl, (c) => {
    c.fillStyle = '#eee'; c.font = `700 1.6px ${TX.FONT}`; c.textAlign = 'center';
    c.save(); c.translate(pw / 2, pl - 9); c.fillText('VCC GND OUT', 0, 6); c.restore(); c.fillText('IR OBSTACLE', pw / 2, 13); c.fillText('LM393', pw / 2, 18.5);
  }, '#1b1d22');
  const pm = new THREE.MeshStandardMaterial({ map: pcb, roughness: 0.45 });
  const board = box(pw, 1.6, pl, [M.fr4, M.fr4, pm, M.fr4, M.fr4, M.fr4], 0, 4, -8 - pl / 2); g.add(board);
  g.add(box(6.5, 4.6, 6.8, M.potBlue, 0, 4.8 + 2.3, -26)); g.add(cyl(1.4, 0.4, M.brass || (M.brass = new THREE.MeshStandardMaterial({ color: 0xe8e0c8, metalness: 0.6, roughness: 0.4 })), 0, 9.6, -26, 12));
  g.add(box(4, 1.5, 5, M.epoxy, 0, 5.5, -18));
  const irLed = cyl(2.5, 5, M.irClear || (M.irClear = new THREE.MeshStandardMaterial({ color: 0xd8d8ff, roughness: 0.15, transparent: true, opacity: 0.6 })), -3.2, 6, -44, 20); irLed.rotation.x = Math.PI / 2; g.add(irLed);
  const pd = cyl(2.5, 5, M.blackGloss, 3.2, 6, -44, 20); pd.rotation.x = Math.PI / 2; g.add(pd);
  const led = (col) => { const m = new THREE.MeshStandardMaterial({ color: 0xf2efe0, emissive: col, emissiveIntensity: 0, roughness: 0.3 }); const b = box(1.6, 0.7, 0.8, m, 0, 5.15, 0); b.userData.keep = true; return { b, m }; };
  const pwr = led(0xff2a1a); pwr.b.position.set(-3.5, 5.15, -14); g.add(pwr.b); const det = led(0x33ff55); det.b.position.set(3.5, 5.15, -14); g.add(det.b);
  g.add(box(16, 3.2, 26, M.black, 0, 1.6, -22)); // a stand
  g.userData.leds = { pwr: pwr.m, det: det.m }; g.userData.face = new THREE.Vector3(0, 0, -1); // it looks away from the student
  shadows(g); return g;
}
// an obstacle in front of a distance sensor (a wooden block the student can slide)
export function buildObstacle() {
  materials(); const m = new THREE.MeshStandardMaterial({ color: 0xc8a070, roughness: 0.75 });
  const g = new THREE.Group(); g.add(box(40, 34, 8, m, 0, 17, 0)); shadows(g); return g;
}

export function buildPart(part) {
  let g = buildPart12(part); // batch 12 (models12.js)
  if (!g) g = buildPart7(part); // batch 7 (models7.js): only the props it knows (load230 show, pump in a bottle)
  if (!g) g = buildPart2(part); // batch 2 (robots), and the plugs of servos that sit in a robot
  if (!g) g = buildPart4(part); // batch 4
  if (!g) g = buildPart3(part); // batch 3 (models3.js)
  if (!g) g = buildPart6(part); // batch 6 (models6.js)
  if (!g) g = buildPart22(part); // batch 22 (models22.js)
  if (!g) g = buildPart24(part); // batch 24 (models24.js)
  if (!g) g = buildPart25(part); // batch 25 (models25.js)
  if (!g) g = buildPart26(part); // batch 26 (models26.js)
  if (!g) g = buildPart28(part); // batch 28 (models28.js)
  if (!g) g = buildPart29(part); // batch 29 (models29.js)
  if (!g) switch (part.type) {
    case 'led': g = buildLED(part.props.color); break;
    case 'rgb': g = buildLED('white', true); break;
    case 'resistor': g = buildResistor(part.props.ohms, part.props.span); break;
    case 'diode': g = buildDiode(part.props.span); break;
    case 'button': g = buildButton(); break;
    case 'pot': g = buildPot(); break;
    case 'buzzer': g = buildBuzzer(); break;
    case 'ldr': g = buildLDR(); break;
    case 'npn': g = buildTO92(['2N2222', 'A 331']); break;
    case 'lm35': g = buildTO92(['LM35', 'DZ']); break;
    case 'hcsr04': g = buildHCSR04(); break;
    case 'ir': g = buildIR(); break;
    case 'servo': g = buildServo(); break;
    case 'motor': g = buildMotor(); break;
    case 'battery': g = buildBattery(); break;
    default: g = new THREE.Group();
  }
  const ud = g.userData; mergeStatic(g); g.userData = ud;
  return g;
}

// ------------------------------------------------------------------ jumper wires
export const WIRE_COLORS = { red: 0xd42a1e, black: 0x1e1e20, yellow: 0xf0c018, green: 0x23983a, blue: 0x2457c8, orange: 0xf0761a, white: 0xeeeeea, purple: 0x7b3ac8, brown: 0x6a3f22 };
const wireMats = {};
export function wireMaterial(c) {
  if (!wireMats[c]) wireMats[c] = new THREE.MeshPhysicalMaterial({ color: WIRE_COLORS[c] || 0x888888, roughness: 0.32, clearcoat: LITE ? 0 : 0.7, clearcoatRoughness: 0.25 });
  return wireMats[c];
}
// a wire from a (point, direction out of the socket) to b; seed spreads wires that run side by side
export function wireCurve(a, da, b, db, seed = 0) {
  const A = V3(...a).addScaledVector(da, 13), Bp = V3(...b).addScaledVector(db, 13);
  const d = A.distanceTo(Bp); const k = Math.max(8, Math.min(70, d * 0.42));
  const side = new THREE.Vector3().subVectors(Bp, A).cross(V3(0, 1, 0)).normalize().multiplyScalar(((seed % 7) - 3) * 1.2);
  return new THREE.CubicBezierCurve3(A, A.clone().addScaledVector(da, k).add(side), Bp.clone().addScaledVector(db, k).add(side), Bp);
}
export function buildWire(a, da, b, db, color, seed, ghost) {
  materials(); const g = new THREE.Group();
  const curve = wireCurve(a, da, b, db, seed);
  const mat = ghost || wireMaterial(color);
  const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, LITE ? 32 : 56, 0.72, LITE ? 6 : 8, false), mat); tube.castShadow = !ghost; g.add(tube); tube.userData.wireTube = true;
  for (const [p, d] of [[a, da], [b, db]]) { // the black plastic end and the metal pin
    const end = new THREE.Group(); end.position.set(...p);
    const q = new THREE.Quaternion().setFromUnitVectors(V3(0, 1, 0), d); end.quaternion.copy(q);
    end.add(box(2.5, 13, 2.5, ghost || M.black, 0, 6.6, 0)); if (!ghost) end.add(box(0.64, 2.2, 0.64, M.tin, 0, -0.6, 0));
    end.traverse((o) => { if (o.isMesh) o.castShadow = !ghost; });
    g.add(end);
  }
  if (!ghost) mergeStatic(g); // tube, plastic ends, metal pins: three draw calls per wire
  return g;
}
// free a removed object's GPU memory (geometries, and the materials and textures made just for it)
export function dispose(obj) {
  const shared = new Set(Object.values(M)); for (const m of Object.values(wireMats)) shared.add(m);
  obj.traverse((o) => {
    if (o.geometry && !o.geometry.userData.shared) o.geometry.dispose();
    const mats = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : [];
    // the pictures and shapes go; the material is only let go (not disposed): three.js keeps its compiled shader, so the next
    // lesson with the same kind of material (a micro:bit desk, a room, an LED) does not compile it again (seconds on a phone)
    for (const m of mats) { if (shared.has(m) || m.userData.shared) continue; for (const k of ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'bumpMap', 'emissiveMap', 'alphaMap']) if (m[k] && !m[k].userData.shared) m[k].dispose(); }
  });
}
export function ghostMaterial(ok = true) {
  return new THREE.MeshBasicMaterial({ color: ok ? 0x46e07a : 0xff5040, transparent: true, opacity: 0.42, depthWrite: false });
}
export function ghostify(obj, mat) { obj.traverse((o) => { if (o.isMesh) { o.material = mat; o.castShadow = false; o.receiveShadow = false; } }); return obj; }
