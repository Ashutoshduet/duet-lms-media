// DUET Robotics Lab 360, batch 5: the 3D models of the micro:bit lessons, made in code (our own work, no downloaded models,
// no brand artwork). Units are mm. The board is a BBC micro:bit V2 compatible board drawn from its published size
// (51.6 × 42 × 1.6 mm), front and back: the 5 × 5 LED display, buttons A and B, the touch logo, the edge connector with its
// five 4 mm holes for crocodile clips, and on the back the processor, motion sensor, speaker, microphone, USB, battery
// socket, reset button and the radio antenna. Also: crocodile-clip leads, an LED and a buzzer with leads, nails in a
// plant pot, a cardboard servo gate, a compass card, a battery pack and small props for each lesson's scene.
// Board frame: x to the right, z towards the student (the edge connector is at +z), y up; the PCB from y = 0 to y = 1.6.
import * as THREE from 'three';
import * as MD from './models.js';
import * as TX from './tex.js';

export const MBG = { W: 51.6, H: 42, T: 1.6 };
const { W, H, T } = MBG;
let LITE = false; export function setLite5(v) { LITE = !!v; }
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const box = (w, h, d, m, x = 0, y = 0, z = 0) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); return o; };
const cyl = (r, h, m, x = 0, y = 0, z = 0, seg = 20, r2) => { const o = new THREE.Mesh(new THREE.CylinderGeometry(r2 === undefined ? r : r2, r, h, seg), m); o.position.set(x, y, z); return o; };
const S = (o) => new THREE.MeshStandardMaterial(o);
const Ph = (o) => (LITE ? S(Object.fromEntries(Object.entries(o).filter(([k]) => !/clearcoat|sheen|transmission|ior|thickness/.test(k)))) : new THREE.MeshPhysicalMaterial(o));
function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function tex(c, srgb = true) { const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.needsUpdate = true; return t; }
// fine grain over a surface: one small tile of noise, repeated (fast, even on a phone)
const NTILE = {};
function noise(c, w, h, a, step = 2) {
  const k = a + ':' + step; let tile = NTILE[k];
  if (!tile) { tile = NTILE[k] = canvas(128, 128); const t = tile.getContext('2d'); const img = t.createImageData(128, 128); for (let y = 0; y < 128; y += step) for (let x = 0; x < 128; x += step) { const v = Math.random(); const g = v > 0.5 ? 255 : 0, al = Math.abs(v - 0.5) * a * 255; for (let j = 0; j < step; j++) for (let i = 0; i < step; i++) { const o = ((y + j) * 128 + x + i) * 4; img.data[o] = img.data[o + 1] = img.data[o + 2] = g; img.data[o + 3] = al; } } t.putImageData(img, 0, 0); }
  c.save(); c.fillStyle = c.createPattern(tile, 'repeat'); c.fillRect(0, 0, w, h); c.restore();
}
let RNG = 7; const rnd = () => { RNG = (RNG * 16807) % 2147483647; return RNG / 2147483647; };

// ------------------------------------------------------------------ the layout (board mm, seen from the front: x from the left edge, y down from the top edge)
export const LED_PITCH = [4.8, 4.4];
export const LED_C = [W / 2, 19.2];
export const BTN = { a: [6.4, 19.2], b: [W - 6.4, 19.2] };
export const LOGO = [W / 2, 5.4];
export const MICLED = [W / 2 + 8.2, 5.4];
// the edge connector: five big pads (with 4 mm holes) and the thin fingers between them
export const EDGE = (() => {
  const out = []; let x = 0.6; const seq = ['P0', 4, 'P1', 4, 'P2', 4, '3V', 4, 'GND'];
  for (const s of seq) { if (typeof s === 'string') { out.push({ id: s, big: true, x: x + 3.0, w: 6.0 }); x += 6.0 + 0.4; } else for (let i = 0; i < s; i++) { out.push({ big: false, x: x + 0.45, w: 0.8 }); x += 1.27; } }
  const shift = (W - x + 0.4) / 2 - 0.6; for (const e of out) e.x += shift; return out;
})();
export const HOLE_Y = H - 4.4; // hole centres (from the top edge)
export const HOLE_R = 2.0;
// board mm (front, from the top-left) -> model frame (centre origin, z towards the student)
export const fx = (x) => x - W / 2, fz = (y) => y - H / 2;
// the back, as you see it with the board turned over (logo still at the top): its x is mirrored
export const BACK = {
  usb: [W / 2, 2.6], jst: [W / 2 + 8.6, 3.0], reset: [W / 2 - 9.5, 3.4], mic: [W / 2 - 8.2, 5.4], ledY: [W / 2 - 4.6, 7.6], ledR: [W / 2 + 4.6, 7.6],
  ant: [4.8, 6.2], cpu: [W / 2 - 9.0, 17.5], iface: [W / 2 + 10.5, 15.0], motion: [9.5, 24.0], speaker: [W / 2, 25.6],
};
export const bx = (x) => W / 2 - x; // back x (as seen from the back) -> model x
export function padPos(id) { const e = EDGE.find((q) => q.id === id); return V3(fx(e.x), T + 0.05, fz(HOLE_Y)); }
// the board's parts a student can tap (lesson 1): [id, side (1 front / -1 back), x, y (board mm as seen from that side), w, d]
export const MB_REGIONS = [
  ['mb_leds', 1, LED_C[0], LED_C[1], 22, 20], ['mb_a', 1, BTN.a[0], BTN.a[1], 9, 9], ['mb_b', 1, BTN.b[0], BTN.b[1], 9, 9], ['mb_logo', 1, LOGO[0], LOGO[1], 11, 7],
  ['mb_mic', 1, MICLED[0], MICLED[1], 4, 4], ['mb_pins', 1, W / 2, H - 4.5, W - 2, 9],
  ['mb_cpu', -1, BACK.cpu[0], BACK.cpu[1], 11, 11], ['mb_motion', -1, BACK.motion[0], BACK.motion[1], 8, 8], ['mb_usb', -1, BACK.usb[0], BACK.usb[1], 10, 6], ['mb_battery', -1, BACK.jst[0], BACK.jst[1], 9, 7],
  ['mb_reset', -1, BACK.reset[0], BACK.reset[1], 6, 6], ['mb_speaker', -1, BACK.speaker[0], BACK.speaker[1], 11, 11], ['mb_micback', -1, BACK.mic[0], BACK.mic[1], 5, 5], ['mb_radio', -1, BACK.ant[0], BACK.ant[1], 10, 11],
  ['mb_iface', -1, BACK.iface[0], BACK.iface[1], 8, 8], ['mb_pins', -1, W / 2, H - 4.5, W - 2, 9],
];

// ------------------------------------------------------------------ the printed board: solder mask, gold, copper, white print
// the board's outline (shape y = board z; flip: shape y = -z, for the face that looks up)
function outline(flip) {
  const k = flip ? -1 : 1; const s = new THREE.Shape(); const rt = 3.2, rb = 1.0, w = W / 2, h = H / 2;
  s.moveTo(-w + rt, -h * k); s.lineTo(w - rt, -h * k); s.quadraticCurveTo(w, -h * k, w, (-h + rt) * k); s.lineTo(w, (h - rb) * k); s.quadraticCurveTo(w, h * k, w - rb, h * k); s.lineTo(-w + rb, h * k); s.quadraticCurveTo(-w, h * k, -w, (h - rb) * k); s.lineTo(-w, (-h + rt) * k); s.quadraticCurveTo(-w, -h * k, -w + rt, -h * k);
  for (const e of EDGE) if (e.big) { const p = new THREE.Path(); p.absarc(fx(e.x), fz(HOLE_Y) * k, HOLE_R, 0, Math.PI * 2, true); s.holes.push(p); }
  return s;
}
function boardTextures(side) {
  const s = LITE ? 11 : 20; const w = Math.round(W * s), h = Math.round(H * s);
  const C = canvas(w, h), R = canvas(w, h), c = C.getContext('2d'), r = R.getContext('2d');
  const X = (mm) => mm * s, Y = (mm) => mm * s;
  c.fillStyle = '#131416'; c.fillRect(0, 0, w, h); noise(c, w, h, 0.05, 2);
  r.fillStyle = 'rgb(0,120,0)'; r.fillRect(0, 0, w, h); // G: roughness (glossy mask), B: metalness
  const metal = (draw) => { r.fillStyle = 'rgb(0,90,255)'; draw(r); };
  // copper tracks under the mask: a little lighter, they catch the light
  RNG = side > 0 ? 11 : 23; c.strokeStyle = 'rgba(70,74,80,0.55)'; c.lineWidth = Math.max(1, s * 0.22); c.lineCap = 'round';
  for (let i = 0; i < 70; i++) { let x = 3 + rnd() * (W - 6), y = 9 + rnd() * (H - 22); c.beginPath(); c.moveTo(X(x), Y(y)); for (let k = 0; k < 3; k++) { if (rnd() < 0.5) x += (rnd() - 0.5) * 14; else y += (rnd() - 0.5) * 10; c.lineTo(X(x), Y(y)); } c.stroke(); }
  const gold = '#d6b25e';
  // the edge connector: gold fingers, the big pads with their holes
  for (const e of EDGE) {
    const top = e.big ? H - 9.4 : H - 5.2; const draw = (g) => { g.beginPath(); if (e.big) { g.moveTo(X(e.x - e.w / 2), Y(H)); g.lineTo(X(e.x - e.w / 2), Y(top + 2.4)); g.arc(X(e.x), Y(top + 2.4), X(e.w / 2), Math.PI, 0); g.lineTo(X(e.x + e.w / 2), Y(H)); } else g.rect(X(e.x - e.w / 2), Y(top), X(e.w), Y(H - top)); g.fill(); };
    const grd = c.createLinearGradient(0, Y(top), 0, Y(H)); grd.addColorStop(0, '#e6c573'); grd.addColorStop(1, '#bf9a48'); c.fillStyle = grd; draw(c); metal(draw);
  }
  c.fillStyle = '#efefe8'; c.textAlign = 'center'; c.textBaseline = 'middle';
  if (side > 0) {
    // the five pads' names, buttons A and B, the touch logo, the microphone light
    for (const e of EDGE) if (e.big) { c.font = `800 ${X(e.id === 'GND' ? 2.0 : 2.5)}px ${TX.FONT}`; c.fillText(e.id === 'P0' ? '0' : e.id === 'P1' ? '1' : e.id === 'P2' ? '2' : e.id, X(e.x), Y(H - 11.2)); }
    c.font = `800 ${X(3.2)}px ${TX.FONT}`; c.fillText('A', X(BTN.a[0]), Y(BTN.a[1] - 6.6)); c.fillText('B', X(BTN.b[0]), Y(BTN.b[1] - 6.6));
    c.strokeStyle = '#d8d8d0'; c.lineWidth = Math.max(1, s * 0.16); for (const k of ['a', 'b']) c.strokeRect(X(BTN[k][0] - 3.6), Y(BTN[k][1] - 3.6), X(7.2), Y(7.2));
    // LED pads (the little rectangles the LEDs sit on) and a faint frame round the display
    c.fillStyle = '#8f9196'; for (let j = 0; j < 5; j++) for (let i = 0; i < 5; i++) { const x = LED_C[0] + (i - 2) * LED_PITCH[0], y = LED_C[1] + (j - 2) * LED_PITCH[1]; c.fillRect(X(x - 0.75), Y(y - 1.25), X(1.5), Y(0.45)); c.fillRect(X(x - 0.75), Y(y + 0.8), X(1.5), Y(0.45)); }
    // the touch logo: a gold pad (our own shape), with a fingertip mark
    const lg = (g) => { const x = X(LOGO[0]), y = Y(LOGO[1]), rw = X(4.6), rh = Y(2.5); g.beginPath(); g.moveTo(x - rw + rh, y - rh); g.lineTo(x + rw - rh, y - rh); g.arc(x + rw - rh, y, rh, -Math.PI / 2, Math.PI / 2); g.lineTo(x - rw + rh, y + rh); g.arc(x - rw + rh, y, rh, Math.PI / 2, Math.PI * 1.5); g.fill(); };
    c.fillStyle = gold; lg(c); metal(lg);
    c.strokeStyle = '#131416'; c.lineWidth = X(0.35); for (let k = 1; k <= 3; k++) { c.beginPath(); c.ellipse(X(LOGO[0]), Y(LOGO[1] + 0.3), X(0.55 * k), Y(0.6 * k), 0, Math.PI * 1.05, Math.PI * 1.95); c.stroke(); }
    c.fillStyle = '#efefe8'; c.font = `700 ${X(1.25)}px ${TX.FONT}`; c.fillText('TOUCH', X(LOGO[0]), Y(LOGO[1] + 4.1));
    c.beginPath(); c.arc(X(MICLED[0]), Y(MICLED[1] - 1.9), X(0.55), 0, Math.PI * 2); c.fillStyle = '#efefe8'; c.fill(); c.fillRect(X(MICLED[0] - 0.12), Y(MICLED[1] - 1.4), X(0.24), Y(0.6));
    c.font = `600 ${X(1.35)}px ${TX.FONT}`; c.textAlign = 'left'; c.fillText('V2', X(2.2), Y(3.2)); c.textAlign = 'right'; c.fillText('DUET', X(W - 2.2), Y(3.2));
  } else {
    // the back, as you see it turned over: what each part is called, printed on the board as on the real one
    c.font = `700 ${X(1.15)}px ${TX.FONT}`; const lab = (txt, x, y, al = 'center') => { c.textAlign = al; for (const [i, l] of txt.split('\n').entries()) c.fillText(l, X(x), Y(y + i * 1.45)); };
    lab('PROCESSOR', BACK.cpu[0], BACK.cpu[1] + 5.6); lab('USB INTERFACE', BACK.iface[0], BACK.iface[1] + 4.6); lab('COMPASS &\nACCELEROMETER', BACK.motion[0], BACK.motion[1] + 3.0); lab('SPEAKER', BACK.speaker[0], BACK.speaker[1] - 5.4);
    lab('MIC', BACK.mic[0], BACK.mic[1] + 2.8); lab('USB', BACK.usb[0], BACK.usb[1] + 4.6); lab('BATTERY', BACK.jst[0], BACK.jst[1] + 4.6); lab('RESET\n& POWER', BACK.reset[0], BACK.reset[1] + 3.5);
    lab('BLUETOOTH\nANTENNA', BACK.ant[0] + 2.4, BACK.ant[1] + 6.4);
    // the antenna: a copper meander in the corner, left bare of solder mask
    const ant = (g) => { g.beginPath(); const x0 = 2.0, y0 = 2.2; g.moveTo(X(x0), Y(y0)); for (let i = 0; i < 5; i++) { g.lineTo(X(x0 + 7.5), Y(y0 + i * 1.6)); g.lineTo(X(x0 + 7.5), Y(y0 + i * 1.6 + 0.8)); g.lineTo(X(x0), Y(y0 + i * 1.6 + 0.8)); g.lineTo(X(x0), Y(y0 + i * 1.6 + 1.6)); } g.stroke(); };
    c.strokeStyle = '#c9874c'; c.lineWidth = X(0.42); ant(c); r.strokeStyle = 'rgb(0,110,200)'; r.lineWidth = X(0.42); ant(r);
    c.font = `600 ${X(1.15)}px ${TX.FONT}`; c.textAlign = 'center';
    for (const e of EDGE) if (e.big) c.fillText(e.id === 'P0' ? '0' : e.id === 'P1' ? '1' : e.id === 'P2' ? '2' : e.id, X(W - e.x), Y(H - 10.6));
    lab('micro:bit V2 compatible\nDUET STEM · CE · 3V', W - 2.6, 25.2, 'right');
  }
  const map = tex(C), rough = tex(R, false); for (const t of [map, rough]) { t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; }
  return { map, rough };
}

// ------------------------------------------------------------------ the board
// returns a group with userData: { leds (InstancedMesh: the light of each LED), halo, caps {a, b}, logoGlow, micLed, backLeds,
// picks (invisible boxes: role 'mbbtn:a', 'mbpad:P0', 'mbregion:mb_cpu', 'mbbody'), side meshes }
export function buildMicrobit(k = 0) {
  const MM = MD.materials(); RNG = 3;
  const g = new THREE.Group(); g.name = 'microbit' + k;
  const front = boardTextures(1), back = boardTextures(-1);
  const mask = (t) => Ph({ map: t.map, roughnessMap: t.rough, metalnessMap: t.rough, roughness: 1, metalness: 1, clearcoat: 0.35, clearcoatRoughness: 0.35 });
  // the board itself: a 1.6 mm slab (dark core edge), its two printed faces
  const body = new THREE.Mesh(new THREE.ExtrudeGeometry(outline(false), { depth: T - 0.04, bevelEnabled: false, curveSegments: 18 }), S({ color: 0x2c2a24, roughness: 0.8 }));
  body.rotation.x = Math.PI / 2; body.position.y = T - 0.02; g.add(body);
  // a face: the front looks up (its shape has y = -z, turned -90°), the back looks down (y = z, turned +90°); the back's
  // picture is drawn as you see it turned over, so its u runs from the board's right edge
  const face = (t, up) => {
    const geo = new THREE.ShapeGeometry(outline(up), 18); const pos = geo.attributes.position, uv = geo.attributes.uv;
    for (let i = 0; i < pos.count; i++) { const x = pos.getX(i), z = up ? -pos.getY(i) : pos.getY(i); uv.setXY(i, up ? (x + W / 2) / W : (W / 2 - x) / W, 1 - (z + H / 2) / H); }
    const m = new THREE.Mesh(geo, mask(t)); m.rotation.x = up ? -Math.PI / 2 : Math.PI / 2; m.position.y = up ? T : 0; m.userData.keep = true; return m;
  };
  g.add(face(front, true), face(back, false));
  // gold inside the five holes
  const parts = new THREE.Group(); g.add(parts);
  const holeM = S({ color: 0xd6b25e, metalness: 1, roughness: 0.3, side: THREE.DoubleSide });
  for (const e of EDGE) if (e.big) { const t = new THREE.Mesh(new THREE.CylinderGeometry(HOLE_R, HOLE_R, T, 20, 1, true), holeM); t.position.set(fx(e.x), T / 2, fz(HOLE_Y)); parts.add(t); }
  // the 25 LEDs (front): small pale bodies; their light is drawn by an instanced layer on top
  const ledM = S({ color: 0xe9e2d2, roughness: 0.32 }), dieM = S({ color: 0xc89a6a, roughness: 0.5 });
  const ledPos = [];
  for (let j = 0; j < 5; j++) for (let i = 0; i < 5; i++) {
    const x = fx(LED_C[0] + (i - 2) * LED_PITCH[0]), z = fz(LED_C[1] + (j - 2) * LED_PITCH[1]); ledPos.push([x, z]);
    parts.add(box(1.25, 0.55, 2.0, ledM, x, T + 0.28, z)); parts.add(box(0.5, 0.05, 0.5, dieM, x, T + 0.58, z));
  }
  const lightGeo = new THREE.PlaneGeometry(1.5, 2.2); lightGeo.rotateX(-Math.PI / 2);
  const lightM = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
  const leds = new THREE.InstancedMesh(lightGeo, lightM, 25); const haloGeo = new THREE.PlaneGeometry(8.5, 8.5); haloGeo.rotateX(-Math.PI / 2);
  const halo = new THREE.InstancedMesh(haloGeo, new THREE.MeshBasicMaterial({ map: haloTex(), color: 0xffffff, toneMapped: false, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }), 25);
  const mtx = new THREE.Matrix4(); const black = new THREE.Color(0, 0, 0);
  ledPos.forEach(([x, z], i) => { mtx.makeTranslation(x, T + 0.6, z); leds.setMatrixAt(i, mtx); leds.setColorAt(i, black); mtx.makeTranslation(x, T + 0.08, z); halo.setMatrixAt(i, mtx); halo.setColorAt(i, black); });
  for (const m of [leds, halo]) { m.instanceMatrix.needsUpdate = true; m.instanceColor.needsUpdate = true; m.frustumCulled = false; m.userData.keep = true; m.renderOrder = 3; g.add(m); }
  // buttons A and B: a 6 × 6 mm switch, a steel frame, a round black cap that goes down when pressed
  const caps = {};
  for (const id of ['a', 'b']) {
    const [bx0, bz0] = BTN[id]; const x = fx(bx0), z = fz(bz0);
    parts.add(box(6.0, 1.5, 6.0, MM.black, x, T + 0.75, z)); parts.add(box(6.2, 0.25, 6.2, MM.steel, x, T + 1.6, z));
    for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) parts.add(box(0.9, 0.3, 0.9, MM.tin, x + dx * 3.1, T + 0.15, z + dz * 2.4));
    const cap = cyl(1.75, 1.5, S({ color: 0x1e1f21, roughness: 0.45 }), x, T + 2.45, z, 24); cap.userData.keep = true; g.add(cap); caps[id] = cap;
  }
  // the touch logo's light (when touched) and the microphone light
  const logoGlow = new THREE.Mesh(new THREE.PlaneGeometry(10, 6), new THREE.MeshBasicMaterial({ map: haloTex(), color: 0xffd27a, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  logoGlow.rotation.x = -Math.PI / 2; logoGlow.position.set(fx(LOGO[0]), T + 0.05, fz(LOGO[1])); logoGlow.userData.keep = true; g.add(logoGlow);
  const micM = S({ color: 0xf2e6d0, roughness: 0.35, emissive: 0xff2a10, emissiveIntensity: 0 });
  const mic = box(0.8, 0.45, 1.5, micM, fx(MICLED[0]), T + 0.23, fz(MICLED[1])); mic.userData.keep = true; g.add(mic);
  // a few small parts on the front
  for (let i = 0; i < 10; i++) { const x = fx(10 + rnd() * 32), z = fz(28.5 + rnd() * 2.5); parts.add(box(1.0, 0.45, 0.5, i % 2 ? MM.smdR : MM.ceramic, x, T + 0.22, z)); }
  // ---- the back (y < 0): parts as seen with the board turned over (x mirrored: bx())
  const chip = (lines, w, d, h, x, z, sz = 22) => { const top = S({ map: TX.labelTexture(lines, { w: 256, h: Math.round(256 * d / w), size: sz, dot: [0.12, 0.2] }), roughness: 0.55 }); return box(w, h, d, [MM.epoxy, MM.epoxy, MM.epoxy, top, MM.epoxy, MM.epoxy], bx(x), -h / 2, fz(z)); };
  parts.add(chip(['N52833', 'QIAAA0'], 7, 7, 0.85, BACK.cpu[0], BACK.cpu[1]));
  parts.add(chip(['N52820', 'QDAA'], 5, 5, 0.85, BACK.iface[0], BACK.iface[1]));
  parts.add(chip(['303', 'AGR'], 2.4, 2.4, 1.0, BACK.motion[0], BACK.motion[1], 40));
  // the speaker: a black square transducer with a sound hole
  { const [x, z] = BACK.speaker; parts.add(box(9.0, 3.0, 9.0, MM.blackGloss, bx(x), -1.5, fz(z))); parts.add(cyl(1.1, 0.06, MM.darkIn, bx(x), -3.03, fz(z), 16)); parts.add(box(9.2, 0.3, 9.2, MM.steel, bx(x), -0.15, fz(z))); }
  // the microphone (a small metal can), the micro USB socket, the battery socket (JST PH, white), reset button
  { const [x, z] = BACK.mic; parts.add(box(3.5, 1.1, 2.7, MM.steel, bx(x), -0.55, fz(z))); }
  { const [x, z] = BACK.usb; parts.add(box(7.6, 2.7, 5.4, MM.steel, bx(x), -1.35, fz(z - 0.4))); parts.add(box(6.2, 1.7, 0.3, MM.darkIn, bx(x), -1.35, fz(z - 3.05))); parts.add(box(5.0, 0.6, 0.35, MM.white, bx(x), -1.45, fz(z - 3.0))); }
  { const [x, z] = BACK.jst; parts.add(box(7.0, 4.4, 5.6, MM.ivory, bx(x), -2.2, fz(z))); parts.add(box(6.0, 3.0, 0.5, MM.darkIn, bx(x), -2.4, fz(z - 2.6))); }
  { const [x, z] = BACK.reset; parts.add(box(4.0, 1.4, 3.0, MM.steel, bx(x), -0.7, fz(z))); parts.add(box(2.4, 0.6, 1.6, MM.black, bx(x), -1.7, fz(z))); }
  const backLeds = {};
  for (const [id, col] of [['ledY', 0xffb21a], ['ledR', 0xff2a14]]) { const m = S({ color: 0xf2efe0, roughness: 0.3, emissive: col, emissiveIntensity: 0 }); const o = box(1.5, 0.6, 0.8, m, bx(BACK[id][0]), -0.3, fz(BACK[id][1])); o.userData.keep = true; g.add(o); backLeds[id] = m; }
  for (let i = 0; i < 26; i++) { const x = 4 + rnd() * (W - 8), z = 10 + rnd() * 20; if (Math.hypot(x - BACK.cpu[0], z - BACK.cpu[1]) < 6 || Math.hypot(x - BACK.speaker[0], z - BACK.speaker[1]) < 7 || Math.hypot(x - BACK.iface[0], z - BACK.iface[1]) < 5) continue; parts.add(box(i % 3 ? 1.0 : 0.5, 0.45, i % 3 ? 0.5 : 1.0, i % 2 ? MM.smdR : MM.ceramic, bx(x), -0.22, fz(z))); }
  MD.mergeStatic(parts);
  // invisible boxes to point at
  const picks = new THREE.Group(); picks.name = 'mbpicks'; const pm = new THREE.MeshBasicMaterial({ visible: false });
  const pick = (role, x, y, z, w, h, d) => { const b = box(w, h, d, pm, x, y, z); b.userData.role = role; b.userData.board = k; picks.add(b); return b; };
  pick('mbbody', 0, T / 2, 0, W, T + 1, H);
  for (const id of ['a', 'b']) pick('mbbtn:' + id, fx(BTN[id][0]), T + 2.2, fz(BTN[id][1]), 8, 4, 8);
  pick('mbbtn:logo', fx(LOGO[0]), T + 0.6, fz(LOGO[1]), 10.5, 1.4, 6.4);
  for (const e of EDGE) if (e.big) pick('mbpad:' + e.id, fx(e.x), T / 2, fz(HOLE_Y + 0.8), 6.4, T + 3.2, 8.2);
  for (const [id, side, x, y, w, d] of MB_REGIONS) { if (id === 'mb_a' || id === 'mb_b' || id === 'mb_logo' || id === 'mb_pins') continue; pick('mbregion:' + id, side > 0 ? fx(x) : bx(x), side > 0 ? T + 0.8 : -1.6, fz(y), w, side > 0 ? 1.6 : 3.4, d); }
  g.add(picks);
  g.traverse((o) => { if (o.isMesh) { o.castShadow = false; o.receiveShadow = false; } });
  g.userData = { leds, halo, caps, logoGlow, micM, backLeds, picks, ledPos };
  return g;
}
let HALO = null;
export function haloTex() { if (!HALO) { HALO = TX.radialTexture(); HALO.userData = { shared: true }; } return HALO; }

// ------------------------------------------------------------------ crocodile clips and their leads
export const CLIP_COLORS = { red: 0xc8281c, black: 0x232325, yellow: 0xf0c018, green: 0x23983a, white: 0xeeeeea, blue: 0x2457c8 };
const clipMats = {};
function clipMat(c) { if (!clipMats[c]) { clipMats[c] = Ph({ color: CLIP_COLORS[c] || 0x888888, roughness: 0.42, clearcoat: 0.3 }); clipMats[c].userData.shared = true; } return clipMats[c]; }
let BOOT = null;
function bootGeo() {
  if (BOOT) return BOOT;
  const pts = [[0.0, 0], [1.6, 0], [2.6, 2], [3.4, 7], [3.9, 14], [3.6, 22], [2.6, 27], [1.4, 30], [1.2, 31]].map(([r, y]) => new THREE.Vector2(r, y));
  BOOT = new THREE.LatheGeometry(pts, 14); BOOT.scale(1, 1, 0.78); BOOT.userData.shared = true; return BOOT;
}
// one clip: the jaws at the origin pointing along -dir, the boot going away along dir; returns its parts and where the lead leaves
function clipAt(pos, dir, color, out, metal) {
  const d = dir.clone().normalize(); const q = new THREE.Quaternion().setFromUnitVectors(V3(0, 1, 0), d);
  const boot = new THREE.Mesh(bootGeo(), clipMat(color)); boot.quaternion.copy(q); boot.position.copy(pos).addScaledVector(d, 5.5); out.push(boot);
  for (const s of [-1, 1]) { // the two steel jaws with their teeth
    const j = box(3.0, 0.55, 8.5, metal, 0, 0, 0); const jq = new THREE.Quaternion().setFromUnitVectors(V3(0, 0, -1), d.clone().negate());
    j.quaternion.copy(jq); const side = V3(0, 1, 0).applyQuaternion(jq).multiplyScalar(s * 0.9); j.position.copy(pos).addScaledVector(d, 2.4).add(side); out.push(j);
  }
  return pos.clone().addScaledVector(d, 36);
}
// the lead between two clips: a soft curve that rests on the desk
export function buildLead(a, da, b, db, color, seed = 0) {
  const MM = MD.materials(); const parts = [];
  const ea = clipAt(a, da, color, parts, MM.steel), eb = clipAt(b, db, color, parts, MM.steel);
  const mid = ea.clone().lerp(eb, 0.5); const span = ea.distanceTo(eb);
  const sag = V3((seed % 7 - 3) * 2.5, Math.max(1.2, Math.min(ea.y, eb.y) * 0.25), 18 + span * 0.12 + (seed % 5) * 3);
  const pts = [ea, ea.clone().add(da.clone().normalize().multiplyScalar(14)).setY(Math.max(1.4, ea.y * 0.5)), mid.clone().add(sag), eb.clone().add(db.clone().normalize().multiplyScalar(14)).setY(Math.max(1.4, eb.y * 0.5)), eb];
  const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
  const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, LITE ? 28 : 48, 1.25, LITE ? 6 : 8, false), clipMat(color)); parts.push(tube);
  const g = new THREE.Group(); for (const p of parts) g.add(p); g.userData.curve = curve; return g;
}

// ------------------------------------------------------------------ parts on the desk (their clip points: userData.ends { pin: [pos, dir] })
const lead = (a, b, r, m) => { const d = b.clone().sub(a); const o = new THREE.Mesh(new THREE.CylinderGeometry(r, r, d.length(), 8), m); o.position.copy(a).add(b).multiplyScalar(0.5); o.quaternion.setFromUnitVectors(V3(0, 1, 0), d.normalize()); return o; };
// a 5 mm LED lying in a little foam block, its two legs bent out towards you
export function buildLooseLED(color) {
  const MM = MD.materials(); const g = new THREE.Group(); const c = colorOf(color);
  g.add(box(14, 6, 10, S({ color: 0x2a2c30, roughness: 0.95 }), 0, 3, -4)); // the foam block it stands in
  const domeM = Ph({ color: c.body, roughness: 0.25, transparent: true, opacity: 0.82, emissive: c.glow, emissiveIntensity: 0, clearcoat: 0.6 });
  const dome = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2.5, 5.4, 24), domeM); dome.position.set(0, 6 + 2.7, -4); g.add(dome);
  const tip = new THREE.Mesh(new THREE.SphereGeometry(2.5, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), domeM); tip.position.set(0, 6 + 5.4, -4); g.add(tip);
  g.add(cyl(2.95, 1.0, domeM, 0, 6.5, -4, 24));
  const legM = MM.tin; const A = V3(1.27, 6, -4), K = V3(-1.27, 6, -4);
  // the long leg (+) goes to the right, the short leg (−) to the left, both bent down onto the desk
  g.add(lead(A, V3(1.27, 6, 2), 0.25, legM), lead(V3(1.27, 6, 2), V3(5, 1.2, 9), 0.25, legM), lead(K, V3(-1.27, 6, 1), 0.25, legM), lead(V3(-1.27, 6, 1), V3(-5, 1.2, 6), 0.25, legM));
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTex(), color: c.glow, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })); glow.scale.set(22, 22, 1); glow.position.set(0, 9.5, -4); g.add(glow);
  g.userData = { domeM, glow, ends: { A: [V3(5, 1.2, 9), V3(0.3, 0.25, 1)], K: [V3(-5, 1.2, 6), V3(-0.3, 0.25, 1)] } };
  return g;
}
function colorOf(color) { const map = { red: [0xd8180c, 0xff3a1a], yellow: [0xf2b20c, 0xffb21a], green: [0x22c82a, 0x46ff40], blue: [0x1a46e6, 0x3a72ff], white: [0xf0f2f4, 0xe8f0ff] }; const [body, glow] = map[color] || map.red; return { body, glow }; }
// a piezo buzzer with a red and a black lead
export function buildLooseBuzzer() {
  const MM = MD.materials(); const g = new THREE.Group();
  g.add(cyl(6.0, 9.5, MM.blackGloss, 0, 4.75, -6, 32)); g.add(cyl(1.0, 0.1, MM.darkIn, 0, 9.55, -6, 16));
  const r = S({ color: 0xc8281c, roughness: 0.5 }), k = S({ color: 0x232325, roughness: 0.5 });
  g.add(lead(V3(2, 1, -1), V3(6, 1, 8), 0.6, r), lead(V3(-2, 1, -1), V3(-6, 1, 8), 0.6, k), lead(V3(6, 1, 8), V3(6.8, 1, 10.5), 0.35, MM.tin), lead(V3(-6, 1, 8), V3(-6.8, 1, 10.5), 0.35, MM.tin));
  g.userData = { ends: { P: [V3(6.8, 1.2, 10.5), V3(0.2, 0.3, 1)], N: [V3(-6.8, 1.2, 10.5), V3(-0.2, 0.3, 1)] } };
  return g;
}
// (batch 12) a 10 kΩ knob (potentiometer) on a foam block, its three legs bent out for the clips; userData.knob turns
export function buildLoosePot() {
  const MM = MD.materials(); const g = new THREE.Group();
  g.add(box(18, 6, 12, S({ color: 0x2a2c30, roughness: 0.95 }), 0, 3, -4)); // the foam block it stands in
  g.add(box(10, 6, 9.5, MM.potBlue, 0, 9, -4));
  const knob = new THREE.Group(); knob.position.set(0, 12, -4); knob.userData.keep = true; g.add(knob);
  knob.add(cyl(3.4, 5.5, MM.knob, 0, 2.75, 0, 18)); knob.add(box(0.8, 0.4, 2.8, MM.white, 0, 5.6, 1.4)); // the knob, its pointer line
  for (const x of [-2.54, 0, 2.54]) { g.add(lead(V3(x, 6, 0.8), V3(x, 6, 3), 0.3, MM.tin)); g.add(lead(V3(x, 6, 3), V3(x * 2.2, 1.2, 9), 0.3, MM.tin)); }
  g.userData = { knob, ends: { E1: [V3(-5.6, 1.2, 9), V3(-0.2, 0.3, 1)], W: [V3(0, 1.2, 9), V3(0, 0.3, 1)], E2: [V3(5.6, 1.2, 9), V3(0.2, 0.3, 1)] } };
  return g;
}
// the SG90 servo (models.js) on a cardboard base with a boom: the gate. Three jumper pins stick out of its plug for the clips.
export function buildGate() {
  const MM = MD.materials(); const g = new THREE.Group();
  const card = S({ color: 0xb98a55, roughness: 0.92 }), cardDark = S({ color: 0x9b7244, roughness: 0.95 });
  g.add(box(150, 3, 70, card, 30, 1.5, -40)); // the cardboard road base
  const road = S({ map: roadTex(), roughness: 0.9 }); const rd = new THREE.Mesh(new THREE.PlaneGeometry(70, 100), road); rd.rotation.set(-Math.PI / 2, 0, Math.PI / 2); rd.position.set(36, 3.05, -40); g.add(rd);
  const sv = MD.buildServo(); sv.position.set(-22, 3, 18); g.add(sv); // its plug at the front, its body further back
  const horn = sv.userData.horn;
  const boom = new THREE.Group(); boom.position.y = 1.0; horn.add(boom);
  const stripe = S({ map: stripeTex(), roughness: 0.6 }); const arm = box(118, 3.2, 6, [cardDark, cardDark, stripe, cardDark, stripe, stripe], 59, 1.6, 0); boom.add(arm);
  g.add(box(8, 30, 8, cardDark, 88, 18, -54)); // the post the boom rests on when shut
  // three jumper wires pushed into the servo's plug (2.54 mm apart), fanned out on the desk so that each crocodile clip has
  // its own pin to bite: brown GND, red + (VP), orange signal
  const jw = new THREE.Group(); const cols = [0x5a3a22, 0xc8302a, 0xf08a1c], house = S({ color: 0x1d1d1f, roughness: 0.6 });
  for (let i = 0; i < 3; i++) {
    const a = V3(-22 + (i - 1) * 2.54, 4.5, 18 + 6), e = V3(-22 + (i - 1) * 11, 1.4, 18 + 27);
    jw.add(box(2.2, 2.2, 7, house, a.x, a.y, a.z + 1)); // the jumper's plastic housing in the plug
    const c = new THREE.QuadraticBezierCurve3(V3(a.x, a.y, a.z + 4.5), V3((a.x + e.x) / 2, 4.2, (a.z + e.z) / 2 + 2), V3(e.x, e.y, e.z - 3.5));
    jw.add(new THREE.Mesh(new THREE.TubeGeometry(c, 12, 0.75, 6), S({ color: cols[i], roughness: 0.55 })));
    jw.add(box(2.2, 2.2, 6, house, e.x, e.y, e.z - 1)); jw.add(box(0.64, 0.64, 6, MM.gold, e.x, e.y, e.z + 4)); // its other end: a pin for the clip
  }
  MD.mergeStatic(jw); g.add(jw);
  const P = (i) => [V3(-22 + (i - 1) * 11, 1.4, 18 + 31), V3(0, 0.35, 1)];
  g.userData = { horn, boom, ends: { GND: P(0), VP: P(1), SIG: P(2) } };
  return g;
}
// (batch 13) an inchworm robot on a paper ruler track: two cardboard plates hinged at the servo, a rubber foot at the
// back (it grips) and an ice-cream-stick foot at the front (it slides). The worm stays in the picture and the paper track
// slides back under it as it walks (userData.pose(angle, mm)), so the clip leads stay put.
export function buildInchworm() {
  const MM = MD.materials(); const g = new THREE.Group();
  const card = S({ color: 0xb98a55, roughness: 0.92 }), rubber = S({ color: 0x1e1f21, roughness: 0.95 }), stick = S({ color: 0xd9b27c, roughness: 0.75 });
  const rt = rulerTex(); const track = new THREE.Mesh(new THREE.PlaneGeometry(240, 46), S({ map: rt, roughness: 0.9 })); track.rotation.x = -Math.PI / 2; track.position.set(40, 0.35, -40); track.userData.keep = true; g.add(track);
  const worm = new THREE.Group(); worm.position.set(-30, 0, -40); worm.userData.keep = true; g.add(worm);
  const rear = new THREE.Group(); worm.add(rear); rear.add(box(52, 2.5, 26, card, 26, 3, 0)); rear.add(box(6, 3, 26, rubber, 2, 1.5, 0)); // the rear plate, its rubber foot
  const sv = MD.buildServo(); sv.scale.setScalar(0.8); sv.position.set(34, 4.3, -8); rear.add(sv); // the servo on the rear plate, near the hinge
  const front = new THREE.Group(); worm.add(front); front.add(box(52, 2.5, 26, card, 26, 3, 0)); front.add(box(5, 2, 26, stick, 50, 1, 0)); // the front plate, its stick foot
  const MB = S({ color: 0x1d1d1f, roughness: 0.6 }); rear.add(box(10, 6, 6, MB, 8, 7, 0)); // a battery clip on top
  let last = '';
  const pose = (a, mm) => {
    const phi = Math.max(0, Math.min(40, (150 - a) / 3)) * Math.PI / 180; const k = a.toFixed(1) + '|' + Math.round(mm * 10); if (k === last) return false; last = k;
    rear.rotation.z = phi; const hx = 52 * Math.cos(phi), hy = 52 * Math.sin(phi); front.position.set(hx, hy, 0); front.rotation.z = -2 * phi; // an arch: both plates tilt up to the hinge
    rt.offset.x = -((mm / 240) % 1); return true;
  };
  // three jumper wires from the servo's plug to pins on the desk, as on the gate: brown GND, red + (VP), orange signal
  const jw = new THREE.Group(); const cols = [0x5a3a22, 0xc8302a, 0xf08a1c], house = S({ color: 0x1d1d1f, roughness: 0.6 });
  for (let i = 0; i < 3; i++) {
    const a = V3(-2 + (i - 1) * 2.5, 9, -30), e = V3(-22 + (i - 1) * 11, 1.4, 18 + 27);
    const c = new THREE.QuadraticBezierCurve3(a, V3((a.x + e.x) / 2, 16, (a.z + e.z) / 2), V3(e.x, e.y, e.z - 3.5));
    jw.add(new THREE.Mesh(new THREE.TubeGeometry(c, 16, 0.75, 6), S({ color: cols[i], roughness: 0.55 })));
    jw.add(box(2.2, 2.2, 6, house, e.x, e.y, e.z - 1)); jw.add(box(0.64, 0.64, 6, MM.gold, e.x, e.y, e.z + 4));
  }
  MD.mergeStatic(jw); g.add(jw);
  const P = (i) => [V3(-22 + (i - 1) * 11, 1.4, 18 + 31), V3(0, 0.35, 1)];
  g.userData = { horn: sv.userData.horn, pose, ends: { GND: P(0), VP: P(1), SIG: P(2) } };
  pose(150, 0); return g;
}
function rulerTex() { const C = canvas(1024, 192), c = C.getContext('2d'); c.fillStyle = '#f4efe2'; c.fillRect(0, 0, 1024, 192); c.fillStyle = '#2a2a2a'; c.font = '700 26px sans-serif'; c.textAlign = 'center';
  for (let mm = 0; mm < 240; mm++) { const x = mm / 240 * 1024; const h = mm % 10 === 0 ? 56 : mm % 5 === 0 ? 36 : 20; c.fillRect(x, 0, 2, h); if (mm % 10 === 0) c.fillText(String(mm / 10), x + 2, 92); }
  const t = tex(C); t.wrapS = THREE.RepeatWrapping; return t; }
function roadTex() { const C = canvas(256, 96), c = C.getContext('2d'); c.fillStyle = '#3a3b3e'; c.fillRect(0, 0, 256, 96); noise(c, 256, 96, 0.12, 2); c.fillStyle = '#e8e2d0'; for (let x = 8; x < 256; x += 36) c.fillRect(x, 45, 20, 5); c.fillRect(0, 4, 256, 3); c.fillRect(0, 89, 256, 3); return tex(C); }
function stripeTex() { const C = canvas(256, 16), c = C.getContext('2d'); for (let i = 0; i < 8; i++) { c.fillStyle = i % 2 ? '#f2f0ea' : '#d8261c'; c.fillRect(i * 32, 0, 32, 16); } return tex(C); }
// a clay pot with soil, a little plant and two galvanised nails as soil probes
export function buildPlant() {
  const MM = MD.materials(); const g = new THREE.Group();
  const clay = S({ color: 0xb4583a, roughness: 0.85 });
  const pts = [[0, 0], [24, 0], [26, 2], [33, 52], [37, 53], [37, 60], [34, 60], [33, 55]].map(([r, y]) => new THREE.Vector2(r, y));
  g.add(new THREE.Mesh(new THREE.LatheGeometry(pts, LITE ? 24 : 40), clay));
  const soilM = S({ map: soilTex(), roughness: 1, color: 0xffffff }); const soil = new THREE.Mesh(new THREE.CircleGeometry(33, LITE ? 24 : 40), soilM); soil.rotation.x = -Math.PI / 2; soil.position.y = 53; g.add(soil);
  // the plant: a stem and leaves (they droop when the soil dries)
  const leafM = Ph({ color: 0x3f8f3a, roughness: 0.55, side: THREE.DoubleSide, clearcoat: 0.2 }); const stemM = S({ color: 0x4f7f32, roughness: 0.7 });
  const plant = new THREE.Group(); plant.position.set(-6, 53, -6); g.add(plant);
  plant.add(cyl(1.2, 46, stemM, 0, 23, 0, 8));
  const leafShape = new THREE.Shape(); leafShape.moveTo(0, 0); leafShape.quadraticCurveTo(9, 6, 0, 26); leafShape.quadraticCurveTo(-9, 6, 0, 0);
  const leafGeo = new THREE.ShapeGeometry(leafShape, 8); const leaves = [];
  for (let i = 0; i < 7; i++) { const piv = new THREE.Group(); piv.position.y = 12 + i * 5.5; piv.rotation.y = i * 2.4; const lf = new THREE.Mesh(leafGeo, leafM); lf.rotation.x = -0.9; piv.add(lf); plant.add(piv); leaves.push(lf); }
  // the nails (probes) stuck in the soil, 30 mm apart
  const steel = S({ color: 0xb8bcc2, metalness: 1, roughness: 0.35 });
  const nail = (x, z) => { const n = new THREE.Group(); n.position.set(x, 53, z); n.add(cyl(1.4, 30, steel, 0, 5, 0, 10)); n.add(cyl(3.2, 1.2, steel, 0, 20.5, 0, 16)); g.add(n); };
  nail(-12, 18); nail(16, 18);
  g.userData = { leaves, plant, soilM, ends: { N1: [V3(-12, 69, 18), V3(-0.2, 0.6, 1)], N2: [V3(16, 69, 18), V3(0.2, 0.6, 1)] } };
  return g;
}
function soilTex() { const C = canvas(256, 256), c = C.getContext('2d'); c.fillStyle = '#4a3324'; c.fillRect(0, 0, 256, 256); for (let i = 0; i < 2600; i++) { const v = Math.random(); c.fillStyle = v < 0.3 ? '#2e1f15' : v < 0.6 ? '#5d432f' : v < 0.95 ? '#3b281b' : '#8a7a62'; c.fillRect(Math.random() * 256, Math.random() * 256, 2 + Math.random() * 4, 2 + Math.random() * 3); } return tex(C); }
// a compass card: the board lies on it, N E S W round the edge
export function buildCompassCard() {
  const C = canvas(512, 512), c = C.getContext('2d'); c.fillStyle = '#f2ead6'; c.fillRect(0, 0, 512, 512); noise(c, 512, 512, 0.04, 2);
  c.translate(256, 256); c.strokeStyle = '#3a3226'; c.lineWidth = 3; c.beginPath(); c.arc(0, 0, 220, 0, Math.PI * 2); c.stroke(); c.lineWidth = 1.5; c.beginPath(); c.arc(0, 0, 200, 0, Math.PI * 2); c.stroke();
  for (let a = 0; a < 360; a += 10) { const r0 = a % 90 === 0 ? 180 : a % 30 === 0 ? 190 : 195; c.beginPath(); c.moveTo(Math.sin(a * Math.PI / 180) * r0, -Math.cos(a * Math.PI / 180) * r0); c.lineTo(Math.sin(a * Math.PI / 180) * 200, -Math.cos(a * Math.PI / 180) * 200); c.stroke(); }
  c.font = `800 46px ${TX.FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle';
  for (const [l, a, col] of [['N', 0, '#c0281c'], ['E', 90, '#3a3226'], ['S', 180, '#3a3226'], ['W', 270, '#3a3226']]) { c.fillStyle = col; c.fillText(l, Math.sin(a * Math.PI / 180) * 238, -Math.cos(a * Math.PI / 180) * 238); }
  c.fillStyle = 'rgba(192,40,28,0.85)'; c.beginPath(); c.moveTo(0, -170); c.lineTo(14, -40); c.lineTo(-14, -40); c.fill();
  const m = new THREE.Mesh(new THREE.PlaneGeometry(150, 150), S({ map: tex(C), roughness: 0.9 })); m.rotation.x = -Math.PI / 2; m.position.y = 0.4; return m;
}
// a 2 × AAA battery pack with its lead and plug (it powers a micro:bit away from the computer)
export function buildBatteryPack() {
  const MM = MD.materials(); const g = new THREE.Group();
  g.add(box(26, 12, 52, MM.black, 0, 6, 0)); g.add(box(24, 0.5, 50, MM.blackGloss, 0, 12.2, 0));
  const sw = box(4, 2, 7, MM.steel, 7, 12.8, 14); g.add(sw);
  const lab = S({ map: TX.labelSticker([['2 × AAA', 40, 60], ['3 V · ON / OFF', 24, 116]], '#1b1b1d', '#d8d8d0', 256, 160), roughness: 0.5 }); const st = new THREE.Mesh(new THREE.PlaneGeometry(20, 13), lab); st.rotation.x = -Math.PI / 2; st.position.set(-1, 12.5, -8); g.add(st);
  return g;
}
// a micro USB cable from the board to the computer (out of the picture)
export function buildUsbCable(len = 160) {
  const MM = MD.materials(); const g = new THREE.Group(); const blk = S({ color: 0x1c1c1e, roughness: 0.6 });
  g.add(box(7.4, 2.4, 6, MM.steel, 0, 0, 3)); g.add(box(10.5, 6, 16, blk, 0, 0, 14));
  const curve = new THREE.CatmullRomCurve3([V3(0, 0, 22), V3(0, -2, 40), V3(8, -6, 70), V3(24, -8, len)]);
  g.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 1.8, 8, false), blk)); return g;
}
// a cup of hot chai (the thermometer lesson): warm it near the board
export function buildChai() {
  const g = new THREE.Group(); const glass = Ph({ color: 0xe6eef0, roughness: 0.08, transparent: true, opacity: 0.35, clearcoat: 1 }); const tea = S({ color: 0x9a5a2a, roughness: 0.3 });
  const pts = [[0, 0], [17, 0], [21, 50], [21.5, 52], [20.5, 52], [16, 1.5], [0, 1.5]].map(([r, y]) => new THREE.Vector2(r, y));
  g.add(new THREE.Mesh(new THREE.LatheGeometry(pts, 28), glass)); g.add(cyl(19.4, 40, tea, 0, 21, 0, 28, 16.5));
  return g;
}
// a soft shadow under something (no shadow-casting light: phones and the Quest)
export function contactShadow(w, d, o = 0.42) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshBasicMaterial({ map: shadowTex(), transparent: true, opacity: o, depthWrite: false, toneMapped: false })); m.rotation.x = -Math.PI / 2; m.position.y = 0.3; m.renderOrder = 1; return m; }
let SHT = null; function shadowTex() { if (SHT) return SHT; const C = canvas(128, 128), c = C.getContext('2d'); const gr = c.createRadialGradient(64, 64, 6, 64, 64, 64); gr.addColorStop(0, 'rgba(0,0,0,0.85)'); gr.addColorStop(0.55, 'rgba(0,0,0,0.35)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = gr; c.fillRect(0, 0, 128, 128); SHT = tex(C); SHT.userData = { shared: true }; return SHT; }
// a lanyard ribbon for the name badge
export function buildLanyard() {
  const g = new THREE.Group(); const C = canvas(512, 32), c = C.getContext('2d'); c.fillStyle = '#1f4fd8'; c.fillRect(0, 0, 512, 32); c.fillStyle = '#f0a65a'; c.font = `800 20px ${TX.FONT}`; for (let x = 10; x < 512; x += 128) c.fillText('DUET STEM', x, 23);
  const m = S({ map: tex(C), roughness: 0.8, side: THREE.DoubleSide });
  const curve = new THREE.CatmullRomCurve3([V3(-16, 2, -22), V3(-30, 1, -60), V3(-10, 1, -110), V3(30, 1, -120), V3(48, 1, -70), V3(18, 2, -22)]);
  const pts = curve.getPoints(60); const pos = []; const uv = [];
  pts.forEach((p, i) => { const t = pts[Math.min(i + 1, pts.length - 1)].clone().sub(pts[Math.max(0, i - 1)]).normalize(); const n = V3(-t.z, 0, t.x).multiplyScalar(6); pos.push(p.x - n.x, p.y, p.z - n.z, p.x + n.x, p.y, p.z + n.z); uv.push(i / 8, 0, i / 8, 1); });
  const idx = []; for (let i = 0; i < pts.length - 1; i++) { const a = i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx); geo.computeVertexNormals();
  C.getContext('2d'); const t = m.map; t.wrapS = THREE.RepeatWrapping;
  g.add(new THREE.Mesh(geo, m)); g.add(box(14, 3, 9, S({ color: 0xb8bcc2, metalness: 1, roughness: 0.3 }), 0, 2, -24));
  return g;
}
// a strap round the board (the step counter: a "watch")
export function buildStrap() {
  const g = new THREE.Group(); const m = S({ color: 0x2a2d33, roughness: 0.75 });
  for (const s of [-1, 1]) { const b = box(26, 2.2, 46, m, 0, -1.6, s * 44); g.add(b); for (let i = 0; i < 5; i++) if (s > 0) g.add(cyl(1.0, 2.4, S({ color: 0x0e0f10, roughness: 0.8 }), 0, -1.5, s * (40 + i * 6), 10)); }
  g.add(box(30, 3, 5, S({ color: 0xb8bcc2, metalness: 1, roughness: 0.35 }), 0, -1.4, 66));
  return g;
}
