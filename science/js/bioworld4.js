// DUET Science Lab 360, biology in real places, batch BW3: nature and ecosystems. A village pond, a desert, a snowy
// forest in the hills, a kitchen, a grassland, a sunflower field and a forest slope, each a real 360° photo (Poly Haven,
// CC0) or a built room, with real scanned plants and animals (camel, cactus, fir, sunflower, bumblebee, coconut, snail…;
// credited in models/eco/credits.json). Everything the student handles (leaves, stalks, bags, thermometers, bowls of
// milk, bottles, balloons, seeds, tubes, slopes of soil) is drawn here, and what happens follows what the student did.
import * as THREE from 'three';
import { Item } from './apparatus.js';
import { clamp01, ease } from './mathlab2.js';
import { pushKnob } from './mathworld3.js';
import { liveSign } from './mathworld4.js';
import { slideKnob } from './mathworld5.js';
import { tag, animator, woodTex, M, rnd, tex, noHit, stepNow, V, FONT } from './mathworld_j1.js';
import { ECO, ecoModel, flyTo, mergeGeoms } from './bioworld1.js';
import { PLACES } from './places.js';
import { BENCH_Y } from './room.js';

const TAU = Math.PI * 2;
const N3 = (en, hi, hg) => ({ en, hi, hg: hg || en });
const done1 = (it, o) => { noHit(it.g); it.noGrab = true; it.noPhys = true; it.base = 0; Object.assign(it, o); return it; };
const lerp = (a, b, k) => a + (b - a) * k;

// ------------------------------------------------------------------ the new models and places
// (real size and the way the head points in the file, as in the ECO table of bioworld1.js)
Object.assign(ECO, {
  camel: { h: 2.0, head: [1, 0] }, cactus: { h: 1.6, head: [0, 1] }, bumblebee: { len: 0.022, head: [-0.7, -0.7] }, coconut: { len: 0.16, head: [1, 0] },
  sunflower_head: { len: 0.28, head: [0, 1] }, sunflower_stem: { h: 1.5, head: [0, 1] }, potted_plant_02: { h: 0.5, head: [0, 1] }, fir_sapling: { h: 1.6, head: [0, 1] },
  rooibos_bush: { raw: 1 }, boulder_04: { raw: 1 }, dead_branch: { raw: 1 },
});
// a desert at noon (Goegap, Namaqualand: sand, rocks and scrub, very like the dry west of Rajasthan) and a snowy forest in
// winter with firs and spruces (yaw: turned so the open sand and the forest path lie straight ahead)
if (!PLACES.desert) PLACES.desert = { img: 'goegap', h: 1.6, r: 60, yaw: 0.314, sun: [0.535, 0.726, 0.433], sunI: 2.6, sky: 0.3, env: 1.0, name: N3('Desert', 'रेगिस्तान', 'Registan (desert)') };
if (!PLACES.snow) PLACES.snow = { img: 'snowy_forest_path_01', h: 1.6, r: 30, yaw: 0.88, sun: [0.766, 0.385, 0.515], sunI: 1.3, sky: 0.55, env: 1.1, name: N3('Snowy forest in winter', 'सर्दियों में बर्फ़ से ढका जंगल', 'Sardiyon mein barf wala jungle') };

// ------------------------------------------------------------------ shared pieces
const T = {};
const MAT = {};
const steel = () => MAT.steel || (MAT.steel = new THREE.MeshStandardMaterial({ color: 0xdadee2, roughness: 0.2, metalness: 0.92 }));
const brass = () => MAT.brass || (MAT.brass = new THREE.MeshStandardMaterial({ color: 0xc9a050, roughness: 0.28, metalness: 0.9 }));
const glass = () => MAT.glass || (MAT.glass = new THREE.MeshStandardMaterial({ color: 0xeef7fb, roughness: 0.04, metalness: 0, transparent: true, opacity: 0.2, depthWrite: false, side: THREE.DoubleSide, envMapIntensity: 1.6 }));
const waterM = (c = 0x9cc4d2, op = 0.45) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.04, metalness: 0.05, transparent: true, opacity: op, depthWrite: false, envMapIntensity: 1.4 });
const lathe = (pts, mat, seg = 40) => { const m = new THREE.Mesh(new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg), mat); m.castShadow = true; m.receiveShadow = true; return m; };
const disc = (r, mat, seg = 40) => { const m = new THREE.Mesh(new THREE.CircleGeometry(r, seg).rotateX(-Math.PI / 2), mat); return m; };
// a steel katori / bowl (r: rim radius, h: depth); level(k) sets what is inside (0 … 1 of the depth)
function bowlMesh(r, h, mat = steel()) { const g = new THREE.Group(); const b = lathe([[0, 0], [r * 0.62, 0.002], [r * 0.86, h * 0.25], [r * 0.98, h * 0.7], [r, h], [r * 0.97, h], [r * 0.95, h * 0.72], [r * 0.83, h * 0.27], [r * 0.6, 0.006], [0, 0.005]], mat); g.add(b); return g; }
const rOfBowl = (r, h, y) => { const k = clamp01(y / h); return k < 0.25 ? lerp(r * 0.6, r * 0.83, k / 0.25) : k < 0.72 ? lerp(r * 0.83, r * 0.95, (k - 0.25) / 0.47) : lerp(r * 0.95, r * 0.97, (k - 0.72) / 0.28); };
// a glowing ring that shows where to put something (only while that step is on)
function spot(r = 0.08, col = 0xffd23f) { const m = new THREE.Mesh(new THREE.TorusGeometry(r, 0.004, 8, 48), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.85, toneMapped: false, depthWrite: false })); m.rotation.x = Math.PI / 2; m.visible = false; m.renderOrder = 12; m.userData.noHit = true; return m; }
// a rough clay pot (terracotta), r: rim radius
const clayTex = () => T.clay || (T.clay = tex(256, 256, (x) => { x.fillStyle = '#b4613a'; x.fillRect(0, 0, 256, 256); const r = rnd(83); for (let i = 0; i < 2500; i++) { const v = r(); x.fillStyle = v < 0.5 ? 'rgba(90,40,20,0.18)' : 'rgba(230,170,130,0.16)'; x.fillRect(r() * 256, r() * 256, 1 + r() * 3, 1 + r() * 2); } x.fillStyle = 'rgba(240,230,210,0.25)'; for (let i = 0; i < 40; i++) x.fillRect(r() * 256, r() * 256, 2 + r() * 10, 1); }, [3, 1]));
function clayPot(r = 0.08, h = 0.12) { const g = new THREE.Group(); g.add(lathe([[0, 0], [r * 0.72, 0], [r * 0.78, 0.01], [r * 0.95, h * 0.85], [r, h * 0.86], [r * 1.06, h * 0.9], [r * 1.06, h], [r * 0.98, h], [r * 0.93, h * 0.88], [r * 0.7, 0.012], [0, 0.012]], new THREE.MeshStandardMaterial({ map: clayTex(), roughness: 0.9 }))); const soil = disc(r * 0.93, new THREE.MeshStandardMaterial({ color: 0x4a3524, roughness: 1 })); soil.position.y = h * 0.84; g.add(soil); return g; }
// droplets of water as seen on the inside of a misted plastic bag or sheet (white, alpha)
const dropsTex = () => T.drops || (T.drops = tex(512, 512, (x) => { x.clearRect(0, 0, 512, 512); const r = rnd(29);
  for (let i = 0; i < 2600; i++) { const s = r() < 0.92 ? 0.8 + r() * 2.2 : 3 + r() * 6, px = r() * 512, py = r() * 512; const g = x.createRadialGradient(px - s * 0.3, py - s * 0.3, 0, px, py, s); g.addColorStop(0, 'rgba(255,255,255,0.95)'); g.addColorStop(0.6, 'rgba(225,238,245,0.55)'); g.addColorStop(1, 'rgba(200,220,230,0.15)'); x.fillStyle = g; x.beginPath(); x.ellipse(px, py, s, s * (1 + r() * 0.3), 0, 0, TAU); x.fill(); } }));
// a thin sheet of clear polythene (a bag or a cover)
const polyM = () => new THREE.MeshStandardMaterial({ color: 0xf4f8fa, roughness: 0.18, metalness: 0, transparent: true, opacity: 0.2, depthWrite: false, side: THREE.DoubleSide });
const mistM = () => new THREE.MeshStandardMaterial({ map: dropsTex(), color: 0xffffff, roughness: 0.1, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide });
// a clear polythene bag pulled over a plant: a soft dome open at the bottom (w: radius, h: height), with a misting layer
function polyBag(w, h) { const g = new THREE.Group(); const pts = []; for (let i = 0; i <= 14; i++) { const k = i / 14; pts.push([w * (0.7 + 0.3 * Math.sin(k * Math.PI * 0.95 + 0.15)) * (1 - 0.92 * Math.pow(k, 6)), h * k]); }
  const geo = new THREE.LatheGeometry(pts.map(([a, b]) => new THREE.Vector2(a, b)), 28); { const p = geo.attributes.position, r = rnd(5); for (let i = 0; i < p.count; i++) { const n = 1 + (r() - 0.5) * 0.06; p.setX(i, p.getX(i) * n); p.setZ(i, p.getZ(i) * n); } geo.computeVertexNormals(); }
  const bag = new THREE.Mesh(geo, polyM()); bag.renderOrder = 9; g.add(bag); const mist = new THREE.Mesh(geo.clone().scale(0.985, 0.99, 0.985), mistM()); mist.renderOrder = 10; g.add(mist);
  const tie = new THREE.Mesh(new THREE.TorusGeometry(w * 0.72, 0.003, 6, 32), new THREE.MeshStandardMaterial({ color: 0xe9e4d4, roughness: 0.7 })); tie.rotation.x = Math.PI / 2; tie.position.y = 0.01; g.add(tie);
  g.userData.mist = mist; g.userData.setMist = (k) => { mist.material.opacity = 0.9 * clamp01(k); bag.material.opacity = 0.2 + 0.25 * clamp01(k); }; return g; }
// a folded polythene bag lying flat (what the student picks up)
export function foldedBag() { const g = new THREE.Group(); const geo = new THREE.PlaneGeometry(0.16, 0.2, 8, 8).rotateX(-Math.PI / 2); const p = geo.attributes.position, r = rnd(17); for (let i = 0; i < p.count; i++) p.setY(i, 0.003 + r() * 0.006); geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0xf2f6f8, roughness: 0.2, transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false })); m.userData.noHit = true; g.add(m); return g; }
// a steel knife with a wooden handle, lying along x
export function knife() { const g = new THREE.Group(); const shp = new THREE.Shape(); shp.moveTo(0, 0); shp.lineTo(0.13, 0.004); shp.quadraticCurveTo(0.15, 0.012, 0.13, 0.022); shp.lineTo(0, 0.022); shp.closePath();
  const bl = new THREE.Mesh(new THREE.ExtrudeGeometry(shp, { depth: 0.0015, bevelEnabled: false }), steel()); bl.rotation.x = -Math.PI / 2; bl.position.set(0, 0.004, 0.011); g.add(bl);
  const h = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.014, 0.02), new THREE.MeshStandardMaterial({ map: woodTex('#6b4428', 7), roughness: 0.6 })); h.position.set(-0.05, 0.008, 0); g.add(h); g.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.userData.noHit = true; } }); return g; }
// a glass thermometer (−10 … 110 °C) lying along x, bulb at −x; set(t) moves the red column
const thermoTex = () => T.thermo || (T.thermo = tex(1024, 64, (x) => { x.fillStyle = '#fbfbf6'; x.fillRect(0, 0, 1024, 64); x.fillStyle = '#222'; x.font = `600 22px ${FONT}`; x.textAlign = 'center';
  for (let t = -10; t <= 110; t += 2) { const px = 70 + (t + 10) / 120 * 920; const big = t % 10 === 0; x.fillRect(px - 1, 0, 2, big ? 26 : t % 5 === 0 ? 18 : 12); if (big) x.fillText(String(t), px, 54); } x.fillText('°C', 40, 54); }));
export function thermometer() { const g = new THREE.Group(); const L = 0.3, x0 = -L / 2;
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.0045, 0.0045, L, 16).rotateZ(Math.PI / 2), glass()); tube.position.y = 0.005; tube.renderOrder = 8; g.add(tube);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.0055, 16, 12).scale(1.6, 1, 1), new THREE.MeshStandardMaterial({ color: 0xc8202a, roughness: 0.25 })); bulb.position.set(x0 + 0.006, 0.005, 0); g.add(bulb);
  const col = new THREE.Mesh(new THREE.CylinderGeometry(0.0013, 0.0013, 1, 8).rotateZ(Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xd0202a, roughness: 0.3, emissive: 0x300000 })); col.position.y = 0.005; g.add(col);
  const sc = new THREE.Mesh(new THREE.PlaneGeometry(L * 0.94, 0.006).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: thermoTex(), roughness: 0.6 })); sc.position.set(0.002, 0.0095, 0); g.add(sc);
  const span = (t) => 0.021 + (t + 10) / 120 * (L * 0.94 * 0.9); g.userData.t = 25;
  g.userData.set = (t) => { g.userData.t = t; const s = span(t); col.scale.x = s; col.position.x = x0 + 0.006 + s / 2; };
  g.userData.set(25); g.traverse((m) => { if (m.isMesh) m.userData.noHit = true; }); return g; }
// bead-shaped drops of water (instanced), for leaves
const dropM = () => MAT.drop || (MAT.drop = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.02, metalness: 0.15, transparent: true, opacity: 0.62, envMapIntensity: 2.4 }));

// a calendar or clock: a knob slid along a path in the steps that move time on (lim(i): the furthest it may go in step i)
export function bindTimeHands(sc, knob, app, s, done = {}) {
  const steps = Object.values(s); const lim = () => (sc.limFor ? sc.limFor(app.runner.i) : sc.tMax);
  const sync = slideKnob(knob, { path: () => sc.knobPath(), active: () => steps.some((i) => stepNow(app, i)) && !sc.busy, keepVisible: () => steps.includes(app.runner.i), k: () => sc.t / sc.tMax,
    set: (k) => { if (sc.canTime && !sc.canTime()) return; sc.setT(Math.min(lim(), Math.round(k * sc.tMax * 10) / 10)); if (sc.t >= lim() - 1e-6 && done.end) done.end(app.runner.i); } });
  const s0 = sc.setT; sc.setT = (t) => { s0(t); sync(); };
}
// carry a thing and let it go: over an open place it is used there (put), anywhere else it goes back where it was
export function carry(it, zones, o = {}) {
  it.noGrab = false; it.dragLift = o.lift ?? Math.max(0.05, (o.carryY ?? BENCH_Y + 0.14) - it.g.position.y);
  it.onRelease = () => { if (it.flying || it.used) return; const p = it.g.getWorldPosition(V(0, 0, 0));
    for (const z of zones) { if (z.open && !z.open()) continue; const a = z.at(); if (Math.hypot(p.x - a.x, p.z - a.z) < (z.r ?? 0.16)) { it.placed = true; z.put(it); return; } }
    if (o.free && o.free(it, p)) return;
    it.placed = true; flyTo(it, it.home.p.clone(), new THREE.Euler().setFromQuaternion(it.home.q).y, 0.7, () => { it.placed = false; }); };
  return it;
}
// show the rings of the places that are open now
export function zoneRings(rings, app) { return (dt, t) => { for (const [m, open] of rings) { m.visible = !!open(); if (m.visible) m.scale.setScalar(1 + 0.08 * Math.sin((t ?? performance.now() / 1000) * 5)); } }; }

// ------------------------------------------------------------------ Class 6: plants and animals of the pond (adaptations)
// Lotus plants stand in the village pond (pondScene of bioworld1.js). On the table: a lotus leaf, a peepal leaf, a glass
// bowl of pond water with a small fish, a lotus stalk, a knife and a brass lota of water. Water poured on the lotus leaf
// rolls off in beads; on the peepal leaf it spreads and wets it. The stalk, cut, shows its air channels and floats.
const lotusTex = () => T.lotus || (T.lotus = tex(512, 512, (x) => { const g = x.createRadialGradient(256, 256, 6, 256, 256, 256); g.addColorStop(0, '#b9c97a'); g.addColorStop(0.06, '#6a8c42'); g.addColorStop(0.5, '#4d7a3c'); g.addColorStop(1, '#3d6a33'); x.fillStyle = g; x.fillRect(0, 0, 512, 512);
  // veins run straight out from the middle and fork twice on the way to the edge (as on a real lotus leaf)
  const r = rnd(9); x.lineCap = 'round'; const vein = (x0, y0, a, d0, d1, w, al) => { x.strokeStyle = `rgba(200,222,160,${al})`; x.lineWidth = w; x.beginPath(); x.moveTo(x0, y0); let px = x0, py = y0;
    for (let d = d0; d <= d1; d += 12) { const aa = a + Math.sin(d * 0.05 + a * 7) * 0.015; px = 256 + Math.cos(aa) * d; py = 256 + Math.sin(aa) * d; x.lineTo(px, py); } x.stroke(); return [px, py]; };
  for (let i = 0; i < 22; i++) { const a = i / 22 * TAU + (r() - 0.5) * 0.08, f1 = 110 + r() * 30, f2 = 185 + r() * 25;
    const [x1, y1] = vein(256 + Math.cos(a) * 16, 256 + Math.sin(a) * 16, a, 16, f1, 3, 0.5);
    for (const s1 of [-1, 1]) { const a1 = a + s1 * 0.07; const [x2, y2] = vein(x1, y1, a1, f1, f2, 1.8, 0.4); for (const s2 of [-1, 1]) vein(x2, y2, a1 + s2 * 0.035, f2, 252, 1.1, 0.3); } }
  x.fillStyle = 'rgba(180,205,212,0.1)'; for (let i = 0; i < 900; i++) { x.beginPath(); x.arc(r() * 512, r() * 512, 1 + r() * 4, 0, TAU); x.fill(); } })); // the bluish waxy bloom
// a round, slightly cupped lotus leaf of radius R (centre at 0), its stalk joined underneath in the middle
function lotusLeaf(R, cup = 0.12, flip = false) { const seg = 56, rings = 9, pos = [], uv = [], idx = [];
  pos.push(0, 0, 0); uv.push(0.5, 0.5); for (let j = 1; j <= rings; j++) for (let i = 0; i < seg; i++) { const k = j / rings, a = i / seg * TAU, rr = R * k; const wav = k > 0.8 ? Math.sin(a * 7 + j) * 0.012 * R * (k - 0.8) * 5 : 0; pos.push(Math.cos(a) * rr, cup * R * k * k + wav, Math.sin(a) * rr); uv.push(0.5 + Math.cos(a) * 0.5 * k, 0.5 + Math.sin(a) * 0.5 * k); }
  for (let i = 0; i < seg; i++) idx.push(0, 1 + (i + 1) % seg, 1 + i); for (let j = 1; j < rings; j++) for (let i = 0; i < seg; i++) { const a = 1 + (j - 1) * seg + i, b = 1 + (j - 1) * seg + (i + 1) % seg, c = a + seg, d = b + seg; idx.push(a, b, d, a, d, c); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx); geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, MAT.lotus || (MAT.lotus = new THREE.MeshStandardMaterial({ map: lotusTex(), roughness: 0.62, side: THREE.DoubleSide }))); m.castShadow = true; m.receiveShadow = true; if (flip) m.scale.y = -1; return m; }
const peepalTex = (wet) => T['peepal' + wet] || (T['peepal' + wet] = tex(256, 512, (x) => { x.clearRect(0, 0, 256, 512); x.save(); x.translate(128, 40);
  const path = () => { x.beginPath(); x.moveTo(0, 0); x.bezierCurveTo(70, -30, 128, 70, 110, 190); x.bezierCurveTo(95, 290, 40, 360, 0, 470); x.bezierCurveTo(-40, 360, -95, 290, -110, 190); x.bezierCurveTo(-128, 70, -70, -30, 0, 0); x.closePath(); };
  path(); const g = x.createLinearGradient(-110, 0, 110, 0); if (wet) { g.addColorStop(0, 'rgba(22,52,22,0.95)'); g.addColorStop(0.5, 'rgba(34,74,30,0.85)'); g.addColorStop(1, 'rgba(22,52,22,0.95)'); } else { g.addColorStop(0, '#3f7a34'); g.addColorStop(0.5, '#5c9844'); g.addColorStop(1, '#3d7432'); } x.fillStyle = g; x.fill();
  if (wet) { x.save(); path(); x.clip(); x.strokeStyle = 'rgba(225,240,235,0.12)'; x.lineWidth = 3; const r = rnd(8); for (let i = 0; i < 9; i++) { x.beginPath(); const y0 = 60 + r() * 330, x0 = -80 + r() * 160; x.moveTo(x0, y0); x.quadraticCurveTo(x0 + 20, y0 + 25, x0 + 5 + r() * 30, y0 + 50 + r() * 40); x.stroke(); } x.restore(); }
  if (!wet) { x.strokeStyle = '#c9dc9a'; x.lineWidth = 4; x.beginPath(); x.moveTo(0, 0); x.lineTo(0, 440); x.stroke(); x.lineWidth = 1.6; x.strokeStyle = 'rgba(200,220,150,0.7)'; for (let i = 1; i < 9; i++) { const y = i * 44; for (const s of [-1, 1]) { x.beginPath(); x.moveTo(0, y); x.quadraticCurveTo(s * 50, y + 10, s * (100 - Math.abs(i - 3) * 9), y + 46); x.stroke(); } } } x.restore(); }));
function peepalLeaf(L = 0.16, wet = false) { const m = new THREE.Mesh(new THREE.PlaneGeometry(L * 0.55, L * 1.1).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: peepalTex(wet), transparent: wet, alphaTest: wet ? 0 : 0.5, roughness: wet ? 0.05 : 0.45, depthWrite: !wet, side: THREE.DoubleSide })); m.receiveShadow = true; return m; }
// the cut end of a lotus stalk: big and small air channels in a pale ring
const stalkEndTex = () => T.stalkEnd || (T.stalkEnd = tex(256, 256, (x) => { x.fillStyle = '#5f7f3a'; x.beginPath(); x.arc(128, 128, 126, 0, TAU); x.fill(); x.fillStyle = '#e6e8c4'; x.beginPath(); x.arc(128, 128, 116, 0, TAU); x.fill();
  const holes = [[0, 0, 22]]; for (let i = 0; i < 6; i++) holes.push([Math.cos(i / 6 * TAU) * 58, Math.sin(i / 6 * TAU) * 58, 24]); for (let i = 0; i < 12; i++) holes.push([Math.cos((i + 0.5) / 12 * TAU) * 92, Math.sin((i + 0.5) / 12 * TAU) * 92, 9]);
  for (const [hx, hy, s] of holes) { const g = x.createRadialGradient(128 + hx, 128 + hy, 0, 128 + hx, 128 + hy, s); g.addColorStop(0, '#2b2a1c'); g.addColorStop(0.8, '#4a4a30'); g.addColorStop(1, '#a9ad80'); x.fillStyle = g; x.beginPath(); x.ellipse(128 + hx, 128 + hy, s, s * 0.85, Math.atan2(hy, hx), 0, TAU); x.fill(); } }));
const stalkSkin = () => T.stalkSkin || (T.stalkSkin = tex(128, 256, (x) => { x.fillStyle = '#6f8f40'; x.fillRect(0, 0, 128, 256); const r = rnd(3); for (let i = 0; i < 220; i++) { x.fillStyle = `rgba(${r() < 0.5 ? '60,80,30' : '150,170,90'},0.35)`; x.fillRect(r() * 128, r() * 256, 1.5, 3 + r() * 6); } x.fillStyle = 'rgba(90,60,40,0.7)'; for (let i = 0; i < 40; i++) x.fillRect(r() * 128, r() * 256, 2, 2); }));
// a piece of lotus stalk, 14 cm long, along x; endCap shows the channels once it is cut
export function lotusStalk() { const g = new THREE.Group(); const R = 0.011, L = 0.14;
  const c = new THREE.Mesh(new THREE.CylinderGeometry(R, R, L, 18, 1, true).rotateZ(Math.PI / 2), new THREE.MeshStandardMaterial({ map: stalkSkin(), roughness: 0.5 })); c.position.y = R; c.castShadow = true; g.add(c);
  const capM = new THREE.MeshStandardMaterial({ color: 0x6a8a3c, roughness: 0.6 }), cut = new THREE.MeshStandardMaterial({ map: stalkEndTex(), roughness: 0.35 });
  const a = new THREE.Mesh(new THREE.CircleGeometry(R, 18).rotateY(-Math.PI / 2), capM); a.position.set(-L / 2, R, 0); g.add(a); const b = new THREE.Mesh(new THREE.CircleGeometry(R, 18).rotateY(Math.PI / 2), capM); b.position.set(L / 2, R, 0); g.add(b);
  g.userData.cut = () => { b.material = cut; a.material = cut; }; g.traverse((m) => { if (m.isMesh) m.userData.noHit = true; }); return g; }
// a brass lota (a round water pot) with water in it
export function lota() { const g = new THREE.Group(); g.add(lathe([[0, 0], [0.035, 0.002], [0.058, 0.035], [0.062, 0.06], [0.05, 0.095], [0.032, 0.11], [0.03, 0.125], [0.042, 0.135], [0.04, 0.138], [0.028, 0.128], [0.028, 0.11], [0, 0.11]], brass(), 40)); g.traverse((m) => { if (m.isMesh) m.userData.noHit = true; }); return g; }
export function pondAdapt(o = {}) {
  const it = new Item('bpadapt', { ...o, name: N3('Lotus and peepal leaves, a bowl of pond water', 'कमल और पीपल के पत्ते, तालाब के पानी का कटोरा', 'Kamal aur peepal ke patte, talaab ke paani ka katora') });
  const g = it.g, w_ = o.W || ((k) => k), Y = BENCH_Y, r = rnd(23), ticks = [];
  // lotus plants in the pond: round leaves held up over the water on long stalks, a pink flower and a bud
  const stalkM = new THREE.MeshStandardMaterial({ color: 0x6d8a3c, roughness: 0.6 });
  [[-0.75, -2.35, 0.24, 0.32], [-0.35, -2.05, 0.2, 0.18], [0.25, -2.5, 0.27, 0.45], [0.95, -2.75, 0.22, 0.26], [-0.1, -3.4, 0.25, 0.38], [0.6, -3.7, 0.2, 0.3], [-0.9, -3.2, 0.23, 0.42]].forEach(([x, z, R, hh]) => {
    const leaf = lotusLeaf(R, 0.18); leaf.position.set(x, -0.05 + hh, z); leaf.rotation.set((r() - 0.5) * 0.4, r() * TAU, (r() - 0.5) * 0.4); g.add(leaf);
    const st = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.007, hh + 0.1, 8), stalkM); st.position.set(x, -0.05 + (hh - 0.1) / 2, z); g.add(st); });
  const pink = new THREE.MeshStandardMaterial({ color: 0xf2a9c4, roughness: 0.55, side: THREE.DoubleSide }), tip = new THREE.MeshStandardMaterial({ color: 0xe0608e, roughness: 0.55, side: THREE.DoubleSide });
  const flower = new THREE.Group(); for (let i = 0; i < 16; i++) { const pg = new THREE.SphereGeometry(0.05, 10, 8, 0, Math.PI); pg.scale(0.45, 1, 0.22); pg.translate(0, 0.05, 0); const pm = new THREE.Mesh(pg, i % 3 ? pink : tip); const ring = i < 8 ? 0 : 1; pm.rotation.set(ring ? 0.35 : 0.75, i / 8 * TAU + ring * 0.4, 0, 'YXZ'); flower.add(pm); }
  const pod = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.012, 0.02, 16), new THREE.MeshStandardMaterial({ color: 0xd8c94a, roughness: 0.6 })); pod.position.y = 0.03; flower.add(pod); flower.position.set(0.55, 0.62, -2.4); g.add(flower);
  { const st = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.007, 0.67, 8), stalkM); st.position.set(0.55, 0.28, -2.4); g.add(st); }
  const bud = new THREE.Mesh(new THREE.SphereGeometry(0.03, 14, 10).scale(1, 1.7, 1), tip); bud.position.set(-0.55, 0.5, -2.6); g.add(bud); { const st = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.006, 0.55, 8), stalkM); st.position.set(-0.55, 0.2, -2.6); g.add(st); }
  // on the table: a cut lotus leaf, tilted a little to the right (as it lies on its own stalk), and a peepal leaf
  const LL = V(-0.42, Y + 0.012, -0.78), RL = 0.15, tilt = -0.16; const leafG = new THREE.Group(); leafG.position.copy(LL); leafG.rotation.z = tilt; g.add(leafG);
  leafG.add(lotusLeaf(RL, 0.12)); const nub = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.012, 10), stalkM); nub.position.y = -0.006; leafG.add(nub);
  const PL = V(0.02, Y + 0.002, -0.8); const peepal = peepalLeaf(0.17); peepal.position.copy(PL); peepal.rotation.y = 0.3; g.add(peepal);
  const wetLeaf = peepalLeaf(0.17, true); it.wetLeaf = wetLeaf; wetLeaf.position.copy(PL).add(V(0, 0.0012, 0)); wetLeaf.rotation.y = 0.3; wetLeaf.material.opacity = 0; wetLeaf.renderOrder = 7; g.add(wetLeaf);
  // a glass bowl of pond water with a small fish
  const BW = V(0.55, Y, -0.8), BR = 0.12; const bowl = lathe([[0, 0], [BR * 0.7, 0.002], [BR * 0.95, 0.04], [BR, 0.09], [BR * 0.985, 0.095], [BR * 0.93, 0.045], [BR * 0.68, 0.006], [0, 0.006]], glass(), 48); bowl.position.copy(BW); bowl.renderOrder = 8; g.add(bowl);
  const surf = disc(BR * 0.975, waterM(0xa9cfc4, 0.2)); surf.position.copy(BW).add(V(0, 0.078, 0)); surf.renderOrder = 9; g.add(surf); const inside = lathe([[0, 0.007], [BR * 0.69, 0.008], [BR * 0.94, 0.046], [BR * 0.975, 0.078], [0, 0.078]], waterM(0x8fb8a2, 0.1), 40); inside.position.copy(BW); inside.renderOrder = 7; g.add(inside);
  const fish = ecoModel('bluegill', { len: 0.075, face: [1, 0] }); g.add(fish); let fa = 0;
  ticks.push((dt) => { fa += dt * 0.9; fish.position.set(BW.x + Math.cos(fa) * 0.05, BW.y + 0.035 + Math.sin(fa * 2.3) * 0.006, BW.z + Math.sin(fa) * 0.04); fish.rotation.y = Math.atan2(-Math.cos(fa) * 0.04, -Math.sin(fa) * 0.05); fish.tick(dt); });
  // signs and the places to put things
  const sign = liveSign(0.1, 4.6); sign.position.set(0, Y + 0.55, -0.95); g.add(sign); it.say = (l, c) => sign.set(l, c);
  const rings = [[spot(0.16), () => it.open === 'lotus'], [spot(0.1), () => it.open === 'peepal'], [spot(0.05), () => it.open === 'stalk'], [spot(0.12), () => it.open === 'bowl']];
  rings[0][0].position.copy(LL).add(V(0, 0.04, 0)); rings[1][0].position.copy(PL).add(V(0, 0.01, 0)); rings[3][0].position.copy(BW).add(V(0, 0.1, 0)); rings.forEach(([m]) => g.add(m)); ticks.push(zoneRings(rings));
  it.at = { lotus: () => LL.clone(), peepal: () => PL.clone(), bowl: () => BW.clone() };
  // pouring: the lota tilts over the leaf and water falls in drops
  const beads = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 12, 8), dropM(), 40); beads.count = 0; beads.frustumCulled = false; g.add(beads); const B = [];
  // water spread on the peepal leaf: one thin, flat, glossy sheet with a ragged edge that grows as water is poured (no beads)
  const filmTex = T.film || (T.film = tex(256, 256, (x) => { x.fillStyle = '#000'; x.fillRect(0, 0, 256, 256); const r = rnd(41), ph = [r() * TAU, r() * TAU, r() * TAU]; x.beginPath();
    for (let i = 0; i <= 72; i++) { const a = i / 72 * TAU, rr = 112 * (0.8 + 0.1 * Math.sin(3 * a + ph[0]) + 0.06 * Math.sin(5 * a + ph[1]) + 0.04 * Math.sin(11 * a + ph[2])); const px = 128 + Math.cos(a) * rr * 0.78, py = 128 + Math.sin(a) * rr; if (i) x.lineTo(px, py); else x.moveTo(px, py); }
    x.closePath(); x.filter = 'blur(4px)'; x.fillStyle = '#fff'; x.fill(); x.filter = 'none'; }));
  const film = new THREE.Mesh(new THREE.PlaneGeometry(0.09, 0.13).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x1d3a18, alphaMap: filmTex, transparent: true, opacity: 0, roughness: 0.03, envMapIntensity: 1.4, depthWrite: false }));
  film.position.copy(PL).add(V(0.004, 0.0024, 0.012)); film.rotation.y = 0.3; film.renderOrder = 8; film.visible = false; film.userData.noHit = true; g.add(film);
  const dm = new THREE.Object3D(); const leafY = (u, v) => 0.12 * RL * (u * u + v * v) / (RL * RL);
  ticks.push((dt) => { const d = Math.min(0.033, dt || 0.016); let n = 0;
    for (const b of B) { if (b.dead) continue; b.t += d;
      if (b.on === 'lotus') { // a bead rolls downhill on the waxy leaf (to the right, the low side), and drops off the edge
        if (b.t > b.wait) { b.vu += (Math.sin(-tilt) * 9.8 * 0.55 - b.u * b.k) * d; b.vv += -b.v * b.k * d; b.vu *= 0.995; b.u += b.vu * d; b.v += b.vv * d; if (b.u > RL * 0.55) b.vu += 2.5 * d; }
        if (Math.hypot(b.u, b.v) > RL * 0.97) { b.on = 'fall'; const w = leafG.localToWorld(V(b.u, leafY(b.u, b.v) + b.s, b.v)); b.p = w; b.vy = 0; }
        else { const w = leafG.localToWorld(V(b.u, leafY(b.u, b.v) + b.s * 0.8, b.v)); dm.position.copy(w); } }
      if (b.on === 'fall') { b.vy -= 9.8 * d; b.p.y += b.vy * d; b.p.x += 0.15 * d; if (b.p.y < Y + b.s * 0.4) { b.p.y = Y + b.s * 0.4; b.sq = Math.min(1, (b.sq || 0) + d * 3); if (b.sq >= 1) b.dead = true; } dm.position.copy(b.p); }
      if (b.on === 'peepal') { b.sq = Math.min(1, (b.sq || 0) + d * 2.5); b.s = Math.min(0.008, b.s + d * 0.01); if (b.t > 0.4) b.dead = true; dm.position.copy(b.p); } // a drop flattens at once and runs into the film
      dm.scale.set(b.s, b.s * (b.sq ? 0.5 - 0.42 * b.sq : 0.82), b.s); dm.updateMatrix(); beads.setMatrixAt(n++, dm.matrix); }
    beads.count = n; beads.instanceMatrix.needsUpdate = true; });
  animator(it); const up0 = it.update; it.wet = 0;
  it.pour = (lt, which, cb) => { if (it.busy) return false; const at = which === 'lotus' ? LL.clone().add(V(-0.04, 0.2, 0.0)) : PL.clone().add(V(-0.05, 0.2, 0)); const p0 = lt.g.position.clone(); lt.flying = true;
    const stream = []; for (let i = 0; i < 10; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(0.004, 8, 6), dropM()); s.visible = false; g.add(s); stream.push(s); }
    it.play(3.2, (k) => { const e = ease(clamp01(k / 0.25)), tl = ease(clamp01((k - 0.2) / 0.15)) * (1 - ease(clamp01((k - 0.8) / 0.2))); lt.g.position.lerpVectors(p0, at, e); if (k > 0.8) lt.g.position.lerpVectors(at, lt.home.p, ease((k - 0.8) / 0.2)); lt.g.rotation.set(0, 0, -1.7 * tl);
      const spout = lt.g.localToWorld(V(0.035, 0.13, 0)); const pour = k > 0.35 && k < 0.78; stream.forEach((s, i) => { s.visible = pour; if (!pour) return; const q = ((k * 9 + i / 10) % 1); s.position.copy(spout).add(V(0.01, -q * (spout.y - Y - 0.02), 0)); });
      if (pour && Math.random() < 0.5) { if (which === 'lotus') { const a = Math.random() * TAU, d = Math.random() * 0.06; B.push({ on: 'lotus', u: -0.03 + Math.cos(a) * d, v: Math.sin(a) * d, vu: 0, vv: 0, s: 0.003 + Math.random() * 0.004, t: 0, wait: 0.2 + Math.random() * 0.8, k: Math.random() < 0.4 ? 16 : 4 }); }
        else { const a = Math.random() * TAU, d = Math.random() * 0.04; B.push({ on: 'peepal', p: PL.clone().add(V(Math.cos(a) * d, 0.0025, Math.sin(a) * d)), s: 0.003, t: 0 }); } }
      if (which === 'peepal' && k > 0.4) { it.wet = Math.max(it.wet, clamp01((k - 0.4) / 0.45)); wetLeaf.material.opacity = 0.75 * it.wet; film.visible = true; film.material.opacity = 0.55 * it.wet; film.scale.setScalar(0.3 + 0.7 * it.wet); } },
    () => { stream.forEach((s) => g.remove(s)); lt.g.rotation.set(0, 0, 0); lt.g.position.copy(lt.home.p); lt.flying = false; lt.placed = false; if (cb) cb(); }); return true; };
  // cutting the stalk: the knife saws across it, then the cut end turns to face the student
  it.cut = (kn, st, cb) => { if (it.busy) return false; const p0 = kn.g.position.clone(), at = st.g.position.clone().add(V(0.05, 0.025, 0)); kn.flying = true;
    it.play(2.2, (k) => { const e = ease(clamp01(k / 0.3)); kn.g.position.lerpVectors(p0, at, e); kn.g.rotation.set(0, Math.PI / 2, 0); if (k > 0.3 && k < 0.75) kn.g.position.z = at.z + Math.sin((k - 0.3) * 40) * 0.025; kn.g.position.y = at.y - clamp01((k - 0.3) / 0.45) * 0.02; if (k > 0.75) kn.g.position.lerpVectors(at, kn.home.p, ease((k - 0.75) / 0.25)); },
      () => { kn.g.position.copy(kn.home.p); kn.g.rotation.set(0, 0, 0); kn.flying = false; kn.placed = false; st.model.userData.cut(); st.cut = true; flyTo(st, st.g.position.clone(), -Math.PI / 2 + 0.25, 0.6, () => { st.home.p.copy(st.g.position); st.home.q.copy(st.g.quaternion); st.placed = false; if (cb) cb(); }); }); return true; };
  // the stalk pushed under the water and let go: it bobs up and floats
  it.sink = (st, cb) => { if (it.busy) return false; const p0 = st.g.position.clone(); st.flying = true; st.inWater = true;
    it.play(3.4, (k) => { const top = BW.clone().add(V(0, 0.16, 0)), deep = BW.clone().add(V(0, 0.018, 0)), fl = BW.clone().add(V(0.01, 0.066, 0.01));
      if (k < 0.25) st.g.position.lerpVectors(p0, top, ease(k / 0.25)); else if (k < 0.45) st.g.position.lerpVectors(top, deep, ease((k - 0.25) / 0.2)); else { const q = (k - 0.45) / 0.55; st.g.position.lerpVectors(deep, fl, ease(clamp01(q * 1.6))); st.g.position.y += Math.sin(q * 14) * 0.004 * (1 - q); } st.g.rotation.set(0, 0.3, 0); },
    () => { st.flying = false; st.home.p.copy(st.g.position); st.home.q.copy(st.g.quaternion); let t = 0; ticks.push((dt) => { if (st.held || !st.inWater) return; t += dt; st.g.position.y = BW.y + 0.066 + Math.sin(t * 2) * 0.0015; }); if (cb) cb(); }); return true; };
  it.update = (dt, t) => { up0(dt); const tt = t ?? performance.now() / 1000; for (const f of ticks) f(dt || 0.016, tt); };
  it.views = { lotus: { p: V(-0.3, 1.38, -0.2), t: V(-0.4, Y, -0.8) }, peepal: { p: V(0.05, 1.38, -0.25), t: V(0.02, Y, -0.8) }, stalk: { p: V(0.25, 1.25, -0.25), t: V(0.25, Y, -0.62) }, bowl: { p: V(0.55, 1.22, -0.35), t: V(0.55, Y + 0.04, -0.8) }, pond: { p: V(0, 2.05, 1.35), t: V(0, 0.35, -2.0) } };
  it.say([w_('Water on two leaves')], '#ffffff');
  return done1(it, { height: 0.2, radius: 1.0 });
}
// binds the lota, the knife and the stalk to the leaves and the bowl, each in its own step
export function bindPondAdapt(pa, th, app, s, done = {}) {
  // which place is open now: worked out when asked (a hand may let go between two frames)
  Object.defineProperty(pa, 'open', { configurable: true, get: () => (stepNow(app, s.pour1) ? 'lotus' : stepNow(app, s.pour2) ? 'peepal' : stepNow(app, s.cut) && !th.stalk.cut ? 'stalk' : stepNow(app, s.float) && th.stalk.cut ? 'bowl' : null) });
  carry(th.lota, [{ at: pa.at.lotus, r: 0.2, open: () => pa.open === 'lotus' && !pa.busy, put: (lt) => pa.pour(lt, 'lotus', () => done.pour1 && done.pour1()) },
    { at: pa.at.peepal, r: 0.15, open: () => pa.open === 'peepal' && !pa.busy, put: (lt) => pa.pour(lt, 'peepal', () => done.pour2 && done.pour2()) }]);
  carry(th.knife, [{ at: () => th.stalk.g.position.clone(), r: 0.12, open: () => pa.open === 'stalk' && !pa.busy, put: (kn) => pa.cut(kn, th.stalk, () => done.cut && done.cut()) }]);
  carry(th.stalk, [{ at: pa.at.bowl, r: 0.15, open: () => pa.open === 'bowl' && !pa.busy, put: (st) => pa.sink(st, () => done.float && done.float()) }]);
}

// ------------------------------------------------------------------ Class 6: a camel and a cactus in the desert
// A camel stands on the sand, cacti and dry bushes around, boulders in the heat. On the table: a leafy plant and a cactus in
// clay pots, a piece of cactus stem, a thermometer, a knife and two polythene bags. Beside the table a spot of open sand
// and a pole with a hook as high as a camel's body.
const ribTex = () => T.rib || (T.rib = tex(256, 256, (x) => { const g = x.createLinearGradient(0, 0, 256, 0); for (let i = 0; i <= 6; i++) { g.addColorStop(i / 6, i % 2 ? '#4f8a52' : '#2f6a3c'); } x.fillStyle = g; x.fillRect(0, 0, 256, 256); const r = rnd(5);
  for (let i = 0; i < 6; i++) for (let j = 0; j < 7; j++) { const px = (i + 0.5) / 6 * 256 + (i % 2 ? 0 : 0), py = j / 7 * 256 + 18; x.fillStyle = '#e8e2cc'; x.beginPath(); x.arc(px, py, 4, 0, TAU); x.fill(); x.strokeStyle = 'rgba(250,245,225,0.9)'; x.lineWidth = 1; for (let k = 0; k < 5; k++) { x.beginPath(); x.moveTo(px, py); x.lineTo(px + (r() - 0.5) * 22, py + (r() - 0.5) * 22); x.stroke(); } }
  x.fillStyle = 'rgba(200,220,200,0.12)'; for (let i = 0; i < 500; i++) x.fillRect(r() * 256, r() * 256, 2, 2); }, [1, 1]));
const cactusCutTex = () => T.ccut || (T.ccut = tex(256, 256, (x) => { x.fillStyle = '#2f6a3c'; x.beginPath(); x.arc(128, 128, 127, 0, TAU); x.fill(); const g = x.createRadialGradient(128, 128, 10, 128, 128, 118); g.addColorStop(0, '#d9e8b4'); g.addColorStop(0.55, '#c4dc96'); g.addColorStop(0.62, '#8fb86a'); g.addColorStop(0.68, '#c8de9c'); g.addColorStop(1, '#a8c97c'); x.fillStyle = g; x.beginPath(); x.arc(128, 128, 116, 0, TAU); x.fill();
  const r = rnd(4); for (let i = 0; i < 40; i++) { const a = r() * TAU, d = r() * 100; x.fillStyle = 'rgba(255,255,255,0.55)'; x.beginPath(); x.arc(128 + Math.cos(a) * d, 128 + Math.sin(a) * d, 1 + r() * 4, 0, TAU); x.fill(); } }));
// a ribbed piece of cactus stem (along x), with white spines on its ribs; cut() opens a fresh wet face
export function cactusPiece() { const g = new THREE.Group(); const R = 0.022, L = 0.1; const geo = new THREE.CylinderGeometry(R, R, L, 36, 6, true); { const p = geo.attributes.position; for (let i = 0; i < p.count; i++) { const a = Math.atan2(p.getZ(i), p.getX(i)); const k = 0.82 + 0.18 * Math.abs(Math.cos(a * 3)); p.setX(i, p.getX(i) * k); p.setZ(i, p.getZ(i) * k); } geo.computeVertexNormals(); }
  geo.rotateZ(Math.PI / 2); const body = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: ribTex(), roughness: 0.42 })); body.position.y = R; body.castShadow = true; g.add(body);
  const capM = new THREE.MeshStandardMaterial({ color: 0x5c7a40, roughness: 0.8 }); const ends = [-1, 1].map((s) => { const c = new THREE.Mesh(new THREE.CircleGeometry(R * 0.98, 24).rotateY(s * Math.PI / 2), capM); c.position.set(s * L / 2, R, 0); g.add(c); return c; });
  g.userData.cut = () => { const m = new THREE.MeshStandardMaterial({ map: cactusCutTex(), roughness: 0.08, metalness: 0.05 }); ends[1].material = m; };
  g.traverse((m) => { if (m.isMesh) m.userData.noHit = true; }); return g; }
export function desertScene(o = {}) {
  const it = new Item('bdesert', { ...o, name: N3('Desert: a camel and cacti', 'रेगिस्तान: ऊँट और कैक्टस', 'Registan: oont aur cactus') });
  const g = it.g, w_ = o.W || ((k) => k), Y = BENCH_Y, r = rnd(47), ticks = [];
  const camel = ecoModel('camel', { face: [1, 0.45], h: 2.05 }); camel.position.set(-2.35, 0, -2.0); g.add(camel);
  for (const [x, z, h, f] of [[1.75, -2.5, 1.9, [0, 1]], [2.5, -3.6, 1.2, [1, 0.5]], [-0.8, -4.6, 1.5, [-1, 1]], [3.4, -1.6, 0.9, [-1, 0.2]]]) { const c = ecoModel('cactus', { h, face: f }); c.position.set(x, 0, z); g.add(c); }
  for (let i = 0; i < 7; i++) { const a = -0.6 + r() * 3.6, d = 2.2 + r() * 3.5; const b = ecoModel('rooibos_bush', { k: 0.35 + r() * 0.4, face: [r() - 0.5, r() - 0.5] }); b.position.set(Math.cos(a + Math.PI / 2) * d * (r() < 0.5 ? 1 : -1), 0, -Math.abs(Math.sin(a + Math.PI / 2) * d) - 0.8); g.add(b); }
  for (const [x, z, k] of [[0.9, -3.4, 0.45], [-1.4, -3.6, 0.3], [2.6, -2.4, 0.22], [-3.2, -3.3, 0.6]]) { const b = ecoModel('boulder_04', { k, face: [r() - 0.5, r() - 0.5] }); b.position.set(x, -0.02, z); g.add(b); }
  for (const [x, z] of [[0.6, -1.6], [-1.6, -1.2]]) { const b = ecoModel('dead_branch', { k: 1.2, face: [r() - 0.5, r() - 0.5] }); b.position.set(x, 0, z); b.rotation.z = 1.4; g.add(b); }
  // the spot of open sand and the pole with a hook at the height of a camel's body
  const SAND = V(-1.5, 0.0, -0.25), HOOK = V(-1.45, 1.55, -0.75);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 1.9, 10), new THREE.MeshStandardMaterial({ map: woodTex('#8a6a42', 13), roughness: 0.85 })); pole.position.set(HOOK.x - 0.03, 0.95, HOOK.z); pole.castShadow = true; g.add(pole);
  const peg = new THREE.Mesh(new THREE.TorusGeometry(0.012, 0.0025, 6, 16, Math.PI * 1.4), steel()); peg.position.set(HOOK.x, HOOK.y + 0.005, HOOK.z); peg.rotation.y = Math.PI / 2; g.add(peg);
  const bandM = new THREE.MeshStandardMaterial({ color: 0xc9b07a, roughness: 0.8 }); const band = new THREE.Mesh(new THREE.CylinderGeometry(0.031, 0.031, 0.04, 10), bandM); band.position.set(HOOK.x - 0.03, HOOK.y, HOOK.z); g.add(band);
  // on the table: two plants in clay pots, side by side in the sun
  const PA = V(-0.4, Y, -0.82), PB = V(0.2, Y, -0.82);
  const leafy = ecoModel('potted_plant_02', { h: 0.5, face: [0.3, 1] }); leafy.position.copy(PA); g.add(leafy);
  const pot = clayPot(0.085, 0.13); pot.position.copy(PB); g.add(pot); const cac = ecoModel('cactus', { h: 0.36, face: [0, 1] }); cac.position.copy(PB).add(V(0, 0.105, 0)); g.add(cac);
  const bags = [polyBag(0.2, 0.42), polyBag(0.12, 0.42)]; bags[0].position.copy(PA).add(V(0, 0.09, 0)); bags[1].position.copy(PB).add(V(0, 0.12, 0)); bags.forEach((b) => { b.visible = false; g.add(b); });
  it.bagged = [false, false];
  // signs: the thermometer's reading, the clock
  const tSign = liveSign(0.085, 2.6); tSign.visible = false; g.add(tSign); const sign = liveSign(0.1, 4.6); sign.position.set(0, Y + 0.72, -1.0); g.add(sign); it.say = (l, c) => sign.set(l, c);
  const rings = [[spot(0.12), () => it.open === 'sand'], [spot(0.05), () => it.open === 'hook'], [spot(0.2), () => it.open === 'bag' && !it.bagged[0]], [spot(0.14), () => it.open === 'bag' && !it.bagged[1]], [spot(0.08), () => it.open === 'cut']];
  rings[0][0].position.copy(SAND).add(V(0, 0.01, 0)); rings[1][0].position.copy(HOOK).add(V(0, -0.02, 0)); rings[2][0].position.copy(PA).add(V(0, 0.06, 0)); rings[3][0].position.copy(PB).add(V(0, 0.15, 0)); rings.forEach(([m]) => g.add(m)); ticks.push(zoneRings(rings));
  it.at = { sand: () => SAND.clone(), hook: () => HOOK.clone(), leafy: () => PA.clone(), cactus: () => PB.clone() }; it.ring = (i) => rings[i][0];
  animator(it); const up0 = it.update;
  // the thermometer follows the temperature where it is: air at the table 38 °C, on the sand 62 °C, at the hook 41 °C
  it.temp = { now: 38, goal: 38 }; it.thermo = null;
  it.putThermo = (th, where, cb) => { const to = where === 'sand' ? SAND.clone().add(V(0, 0.0, 0)) : HOOK.clone().add(V(0, -0.17, 0)); th.flying = true;
    flyTo(th, to, where === 'sand' ? 0.2 : 0, 0.9, () => { th.flying = false; th.where = where; th.home.p.copy(th.g.position); th.home.q.copy(th.g.quaternion); if (where === 'hook') { th.g.rotation.set(0, 0, Math.PI / 2); th.home.q.copy(th.g.quaternion); }
      it.temp.goal = where === 'sand' ? 62 : 41; it.temp.cb = cb; }); };
  ticks.push((dt) => { const T0 = it.temp; if (!it.thermo) return; const th = it.thermo; if (th.held) T0.goal = 38; T0.now += (T0.goal - T0.now) * Math.min(1, (dt || 0.016) * 1.2); th.model.userData.set(T0.now);
    tSign.visible = true; tSign.position.copy(th.g.position).add(V(0.0, th.where === 'hook' ? 0.28 : 0.12, 0)); tSign.set([`${Math.round(T0.now)} °C`], T0.now > 55 ? '#ff8a6a' : '#ffd23f'); if (T0.cb && Math.abs(T0.now - T0.goal) < 0.6) { const c = T0.cb; T0.cb = null; c(); } });
  // the knife cuts the cactus piece: a wet, pale green inside
  it.cut = (kn, pc, cb) => { if (it.busy) return false; const p0 = kn.g.position.clone(), at = pc.g.position.clone().add(V(0.03, 0.05, 0)); kn.flying = true;
    it.play(2.2, (k) => { kn.g.position.lerpVectors(p0, at, ease(clamp01(k / 0.3))); kn.g.rotation.set(0, Math.PI / 2, 0); if (k > 0.3 && k < 0.75) kn.g.position.z = at.z + Math.sin((k - 0.3) * 40) * 0.03; kn.g.position.y = at.y - clamp01((k - 0.3) / 0.45) * 0.045; if (k > 0.75) kn.g.position.lerpVectors(at, kn.home.p, ease((k - 0.75) / 0.25)); },
      () => { kn.g.position.copy(kn.home.p); kn.g.rotation.set(0, 0, 0); kn.flying = false; kn.placed = false; pc.model.userData.cut(); pc.cut = true; flyTo(pc, pc.g.position.clone(), -Math.PI / 2 + 0.35, 0.6, () => { pc.home.p.copy(pc.g.position); pc.home.q.copy(pc.g.quaternion); pc.placed = false; if (cb) cb(); }); }); return true; };
  it.bag = (bg, i, cb) => { bg.flying = true; const to = (i ? PB : PA).clone().add(V(0, 0.5, 0)); flyTo(bg, to, 0, 0.7, () => { bg.g.visible = false; bg.used = true; bags[i].visible = true; it.bagged[i] = true; bags[i].scale.set(1, 0.2, 1);
    it.play(0.8, (k) => bags[i].scale.set(1, 0.2 + 0.8 * ease(k), 1), () => { if (cb) cb(); }); }); };
  // the clock: 11 in the morning to 3 in the afternoon. Leaves give out water vapour; the cactus hardly any
  it.t = 0; it.tMax = 4; it.setT = (t) => { it.t = Math.max(0, Math.min(it.tMax, t)); const k = clamp01(it.t / 3); if (it.bagged[0]) bags[0].userData.setMist(k); if (it.bagged[1]) bags[1].userData.setMist(k * 0.1); const hr = 11 + it.t, h12 = ((Math.floor(hr) - 1) % 12) + 1;
    it.say([`${h12}:${String(Math.round((hr % 1) * 60)).padStart(2, '0')} ${hr < 12 ? 'am' : 'pm'}`, it.t > 0.5 ? `${w_('Leafy plant')}: ${w_(k > 0.6 ? 'bag full of water drops' : 'bag misting up')} · ${w_('Cactus')}: ${w_('almost dry')}` : w_('Both plants in the sun')], ['#ffffff', '#ffd23f']); };
  it.knobPath = () => [V(-0.4, Y + 0.02, -0.45), V(0.4, Y + 0.02, -0.45)];
  it.update = (dt, t) => { up0(dt); const tt = t ?? performance.now() / 1000; for (const f of ticks) f(dt || 0.016, tt); camel.tick && camel.tick(dt); };
  it.views = { camel: { p: V(-0.9, 1.6, 0.5), t: V(-2.2, 1.15, -2.0) }, table: { p: V(-0.1, 1.55, 0.25), t: V(-0.1, Y + 0.15, -0.8) }, sand: { p: V(-1.05, 1.05, 0.45), t: V(-1.5, 0.05, -0.3) }, hook: { p: V(-0.75, 1.6, 0.35), t: V(-1.4, 1.3, -0.75) },
    piece: { p: V(0.6, 1.3, -0.25), t: V(0.62, Y + 0.02, -0.78) }, all: { p: V(0, 1.75, 0.9), t: V(-0.4, 0.8, -2.0) } };
  it.say([w_('Noon in the desert')], '#ffffff');
  return done1(it, { height: 0.6, radius: 1.5 });
}
export function bindDesert(ds, th, app, s, done = {}) {
  Object.defineProperty(ds, 'open', { configurable: true, get: () => (stepNow(app, s.sand) ? 'sand' : stepNow(app, s.hook) ? 'hook' : stepNow(app, s.cut) && !th.piece.cut ? 'cut' : stepNow(app, s.bag) ? 'bag' : null) });
  ds.thermo = th.thermo;
  carry(th.thermo, [{ at: ds.at.sand, r: 0.25, open: () => ds.open === 'sand', put: (x) => ds.putThermo(x, 'sand', () => done.sand && done.sand()) },
    { at: ds.at.hook, r: 0.25, open: () => ds.open === 'hook', put: (x) => ds.putThermo(x, 'hook', () => done.hook && done.hook()) }]);
  carry(th.knife, [{ at: () => th.piece.g.position.clone(), r: 0.13, open: () => ds.open === 'cut' && !ds.busy, put: (kn) => ds.cut(kn, th.piece, () => done.cut && done.cut()) }]);
  th.bags.forEach((bg) => carry(bg, [0, 1].map((i) => ({ at: i ? ds.at.cactus : ds.at.leafy, r: 0.2, open: () => ds.open === 'bag' && !ds.bagged[i], put: (b) => ds.bag(b, i, () => { if (ds.bagged[0] && ds.bagged[1] && done.bag) done.bag(); }) }))));
}

// ------------------------------------------------------------------ Class 6: snow on the branches of a fir
// A young fir stands in the snowy forest (firs and spruces all around in the photo). Beside it a fir branch is clamped to
// a wooden stake; its tip can be set level or sloping down. Snow falls in the night: on a level branch it piles up until
// the branch bends and cracks; on a sloping one it slides off.
function firBranch(L = 0.62) { const g = new THREE.Group(); const r = rnd(61);
  const twigM = new THREE.MeshStandardMaterial({ color: 0x5a4632, roughness: 0.85 }); const tw = []; const needles = [];
  const main = new THREE.CylinderGeometry(0.0035, 0.008, L, 6).rotateZ(Math.PI / 2); main.translate(L / 2, 0, 0); tw.push(main);
  const addNeedles = (x0, z0, dirx, dirz, len, sc) => { const n = Math.floor(len / 0.004); for (let i = 0; i < n; i++) { const u = i / n, px = x0 + dirx * len * u, pz = z0 + dirz * len * u; for (const s of [-1, 1]) { const nl = 0.018 * sc * (1 - 0.4 * u) * (0.85 + r() * 0.3); needles.push({ p: V(px, 0.002, pz), a: Math.atan2(dirz, dirx) + s * (1.25 + (r() - 0.5) * 0.3), l: nl, tilt: 0.15 + r() * 0.1 }); } } };
  addNeedles(0, 0, 1, 0, L, 1.1);
  for (let i = 1; i < 14; i++) { const x = L * i / 14, s = i % 2 ? 1 : -1, len = 0.16 * (1 - i / 16), ang = 0.75; const dx = Math.cos(ang), dz = s * Math.sin(ang);
    const t = new THREE.CylinderGeometry(0.0015, 0.0025, len, 5).rotateZ(Math.PI / 2); t.translate(len / 2, 0, 0); t.rotateY(-Math.atan2(dz, dx)); t.translate(x, 0, 0); tw.push(t); addNeedles(x, 0, dx, dz, len, 1); }
  const twig = new THREE.Mesh(mergeGeoms(tw), twigM); twig.castShadow = true; g.add(twig);
  const ng = new THREE.PlaneGeometry(1, 0.0016); ng.translate(0.5, 0, 0); const nd = new THREE.InstancedMesh(ng, new THREE.MeshStandardMaterial({ color: 0x2c4a2a, roughness: 0.55, side: THREE.DoubleSide }), needles.length * 2);
  // each needle: two crossed thin cards (one lying flat, one on edge), so it shows from above and from the side
  const m4 = new THREE.Object3D(), col = new THREE.Color(); needles.forEach((n, i) => { for (let k = 0; k < 2; k++) { m4.position.copy(n.p); m4.rotation.set(0, 0, 0); m4.rotateY(-n.a); m4.rotateZ(n.tilt); if (!k) m4.rotateX(Math.PI / 2); m4.scale.set(n.l, 1, 1); m4.updateMatrix(); nd.setMatrixAt(i * 2 + k, m4.matrix); col.setHSL(0.3 + r() * 0.03, 0.35, 0.18 + r() * 0.06); nd.setColorAt(i * 2 + k, col); } });
  nd.castShadow = true; g.add(nd); g.traverse((m) => { m.userData.noHit = true; }); return g; }
const snowM = () => MAT.snow || (MAT.snow = new THREE.MeshStandardMaterial({ color: 0xf6f9fc, roughness: 0.92, emissive: 0x1a2028, emissiveIntensity: 0.25 }));
const flakeTex = () => T.flake || (T.flake = tex(32, 32, (x) => { const g = x.createRadialGradient(16, 16, 0, 16, 16, 16); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.5, 'rgba(255,255,255,0.7)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 32, 32); }));
export function snowTrees(o = {}) {
  const it = new Item('bsnow', { ...o, name: N3('A fir branch in the snow', 'बर्फ़ में देवदार की टहनी', 'Barf mein deodar ki tehni') });
  const g = it.g, w_ = o.W || ((k) => k), r = rnd(13), ticks = [];
  const fir = ecoModel('fir_sapling', { h: 1.65, face: [0, 1] }); fir.position.set(0.75, 0, -1.55); g.add(fir);
  // snow on the young fir: a few soft lumps that slide down its sloping branches when it snows
  // the stake and the branch (its base held in a clamp; it turns about the clamp)
  const P = V(-0.45, 1.12, -0.95); const stake = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.035, P.y + 0.1, 10), new THREE.MeshStandardMaterial({ map: woodTex('#7a5a3a', 21), roughness: 0.85 })); stake.position.set(P.x - 0.04, (P.y + 0.1) / 2, P.z); stake.castShadow = true; g.add(stake);
  const clamp = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.06), new THREE.MeshStandardMaterial({ color: 0x3a3e44, roughness: 0.4, metalness: 0.7 })); clamp.position.copy(P); g.add(clamp);
  const arm = new THREE.Group(); arm.position.copy(P); g.add(arm); const br = firBranch(0.62); arm.add(br);
  // snow on the branch: soft rounded lumps that overlap into one ridge (smooth, gently uneven)
  const load = new THREE.Group(); arm.add(load); const lumps = []; for (let i = 0; i < 9; i++) { const gm = new THREE.SphereGeometry(0.05, 18, 10); const p = gm.attributes.position, ph = r() * 9; for (let j = 0; j < p.count; j++) { const v = V(p.getX(j), p.getY(j), p.getZ(j)); const n = 1 + 0.1 * Math.sin(v.x * 70 + ph) * Math.cos(v.z * 60 + ph) + 0.05 * Math.sin(v.y * 90 + ph); v.multiplyScalar(n); p.setXYZ(j, v.x * 1.5, Math.max(-0.012, v.y) * 0.85, v.z * 1.45); } gm.computeVertexNormals();
    const m = new THREE.Mesh(gm, snowM()); m.position.set(0.05 + i * 0.065, 0.006, (r() - 0.5) * 0.04); m.castShadow = true; load.add(m); lumps.push(m); }
  const heap = new THREE.Mesh(new THREE.SphereGeometry(0.16, 20, 10, 0, TAU, 0, Math.PI / 2).scale(1.3, 0.35, 1), snowM()); heap.visible = false; g.add(heap);
  const crack = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.012, 0.014), new THREE.MeshBasicMaterial({ color: 0x1a120a })); crack.position.set(0.02, 0.004, 0); crack.visible = false; arm.add(crack);
  // snowflakes falling (one Points object)
  const NF = 900, fp = new Float32Array(NF * 3); for (let i = 0; i < NF; i++) { fp[i * 3] = (r() - 0.5) * 4; fp[i * 3 + 1] = r() * 3; fp[i * 3 + 2] = -0.3 - r() * 3.5; }
  const fg = new THREE.BufferGeometry(); fg.setAttribute('position', new THREE.BufferAttribute(fp, 3)); const flakes = new THREE.Points(fg, new THREE.PointsMaterial({ map: flakeTex(), size: 0.022, transparent: true, depthWrite: false, opacity: 0.9 })); flakes.visible = false; flakes.frustumCulled = false; g.add(flakes);
  const sign = liveSign(0.1, 4.6); sign.position.set(-0.1, 1.95, -1.2); g.add(sign); it.say = (l, c) => sign.set(l, c);
  const angSign = tag('0°', '#ffd23f', 0.06); g.add(angSign);
  it.ang = 0; it.snow = 0; it.slid = false; it.broke = false; it.trials = [];
  const pose = () => { const bend = it.broke ? 0.22 : it.load01 ? it.load01 * 0.12 : 0; arm.rotation.z = -(it.ang * Math.PI / 180) - bend; const tip = arm.localToWorld(V(0.62, 0, 0)); angSign.position.copy(tip).add(V(0.08, 0.06, 0.05)); angSign.setText(`${Math.round(it.ang)}°`); };
  it.load01 = 0;
  it.setAng = (a) => { if (it.snowing) return; it.ang = Math.max(0, Math.min(60, a)); it.load01 = 0; it.broke = false; crack.visible = false; lumps.forEach((m) => { m.visible = false; }); pose(); if (it.onAng) it.onAng(it.ang); };
  // a night of snow: how much stays on the branch depends on its slope (snow slides off slopes steeper than about 35°)
  it.letSnow = (cb) => { if (it.snowing) return false; it.snowing = true; flakes.visible = true; const stays = it.ang < 20 ? 1 : it.ang < 35 ? 1 - (it.ang - 20) / 15 * 0.8 : 0; let k = 0; const a0 = it.ang;
    lumps.forEach((m) => { m.visible = true; m.scale.setScalar(0.001); m.position.x = 0.05 + lumps.indexOf(m) * 0.065; m.position.y = 0.006; });
    const step = (dt) => { k = Math.min(1, k + dt / 5); const grow = ease(clamp01(k / 0.7));
      lumps.forEach((m, i) => { const s = 0.25 + 0.75 * grow * (1 - i / 16); if (stays > 0.02) m.scale.set(s, s * (0.4 + 0.8 * stays) , s); else { const q = (k * 5 + i * 0.37) % 1; m.scale.setScalar(0.35 + 0.3 * q); m.position.x = 0.05 + i * 0.065 + q * 0.2; m.position.y = 0.006; m.visible = q < 0.85; } });
      it.load01 = stays * grow; if (stays > 0.6 && k > 0.8 && !it.broke && a0 < 20) { it.broke = true; crack.visible = true; } pose();
      heap.visible = stays < 0.9 && k > 0.2; if (heap.visible) { const tip = arm.localToWorld(V(0.58, 0, 0)); heap.position.set(tip.x, 0, tip.z); heap.scale.setScalar(0.3 + 0.7 * grow * (1 - stays)); }
      if (k >= 1) { ticks.splice(ticks.indexOf(step), 1); flakes.visible = false; it.snowing = false; lumps.forEach((m) => { m.visible = stays > 0.02; }); it.trials.push({ ang: a0, stays }); if (cb) cb(stays); } };
    ticks.push(step); return true; };
  ticks.push((dt) => { if (!flakes.visible) return; const p = fg.attributes.position; for (let i = 0; i < NF; i++) { let y = p.getY(i) - dt * 0.55; if (y < 0) y += 3; p.setY(i, y); p.setX(i, p.getX(i) + Math.sin(y * 3 + i) * dt * 0.05); } p.needsUpdate = true; });
  it.knobPath = () => [V(0.05, 1.0, -0.5), V(0.45, 1.0, -0.5)];
  // the handle sits on the branch 42 cm out from the clamp: level at one end of its path, 60° down at the other
  it.tipPath = () => [V(P.x + 0.42, P.y, P.z), V(P.x + 0.42 * Math.cos(Math.PI / 3), P.y - 0.42 * Math.sin(Math.PI / 3), P.z)];
  it.update = (dt, t) => { const d = dt || 0.016; for (const f of [...ticks]) f(d, t); };
  it.views = { all: { p: V(0.1, 1.55, 0.6), t: V(0.1, 0.9, -1.3) }, branch: { p: V(-0.15, 1.45, -0.15), t: V(-0.15, 1.0, -0.95) }, needles: { p: V(-0.05, 1.3, -0.62), t: V(-0.1, 1.08, -0.95) } };
  pose(); lumps.forEach((m) => { m.visible = false; }); it.say([w_('Winter in the hills')], '#ffffff');
  return done1(it, { height: 1.2, radius: 1.0 });
}
// the tip handle sets the angle in the two "set the branch" steps; the snow knob lets it snow in the two "snow" steps
export function bindSnow(sn, tip, knob, app, s, done = {}) {
  const angOK = (i) => (i === s.flat ? sn.ang <= 15 : sn.ang >= 40);
  slideKnob(tip, { path: () => sn.tipPath(), active: () => (stepNow(app, s.flat) || stepNow(app, s.slope)) && !sn.snowing, keepVisible: () => app.runner.i === s.flat || app.runner.i === s.slope, k: () => sn.ang / 60,
    set: (k) => { sn.setAng(Math.round(k * 60)); } });
  const t0 = tip.onRelease; tip.onRelease = () => { t0 && t0(); const i = app.runner.i; if ((stepNow(app, s.flat) || stepNow(app, s.slope)) && angOK(i) && done.set) done.set(i); };
  const s0 = sn.setAng; sn.setAng = (a) => { s0(a); if (!tip.held) { const [A, B] = sn.tipPath(); tip.g.position.copy(A.clone().lerp(B, sn.ang / 60)); } };
  pushKnob(knob, { path: () => [V(0.25, 1.0, -0.62), V(0.25, 1.0, -0.42)], active: () => (stepNow(app, s.snow1) || stepNow(app, s.snow2)) && !sn.snowing, keepVisible: () => app.runner.i === s.snow1 || app.runner.i === s.snow2,
    press: () => sn.letSnow((st) => done.snowed && done.snowed(st)) });
}
// ---- end of part 1

// ------------------------------------------------------------------ Class 6: the water cycle in a basin, a bag and a glass
// On a table by the pond: a wide steel basin of muddy pond water with an empty katori standing in its middle, a clear
// sheet, a small stone, a potted plant, a polythene bag, a steel glass of water and a bowl of ice. The sun warms the
// basin: water evaporates, condenses under the sheet and, if the stone makes the sheet dip over the katori, drips into it.
export function waterCycle(o = {}) {
  const it = new Item('bwcycle', { ...o, name: N3('Basin of pond water under the sun', 'धूप में तालाब के पानी का तसला', 'Dhoop mein talaab ke paani ka tasla') });
  const g = it.g, w_ = o.W || ((k) => k), Y = BENCH_Y, ticks = [];
  const BC = V(-0.35, Y, -0.8), BR = 0.24, BH = 0.1;
  const basin = lathe([[0, 0], [BR * 0.8, 0.002], [BR * 0.95, BH * 0.4], [BR, BH], [BR * 1.04, BH + 0.004], [BR * 1.035, BH + 0.008], [BR * 0.985, BH], [BR * 0.935, BH * 0.4], [BR * 0.79, 0.006], [0, 0.006]], steel(), 56); basin.position.copy(BC); g.add(basin);
  const rIn = (y) => (y < BH * 0.4 ? lerp(BR * 0.79, BR * 0.935, y / (BH * 0.4)) : lerp(BR * 0.935, BR * 0.985, (y - BH * 0.4) / (BH * 0.6)));
  const mudM = waterM(0x5a4628, 0.9); mudM.roughness = 0.25; mudM.envMapIntensity = 0.6; mudM.depthWrite = true; const mud = disc(1, mudM, 56); mud.position.copy(BC); g.add(mud); it.level = 0.035;
  const setMud = () => { mud.position.y = BC.y + it.level; mud.scale.setScalar(rIn(it.level)); };
  // the katori in the middle (its rim above the water) and the clean water that collects in it
  const KR = 0.05, KH = 0.05; const kat = bowlMesh(KR, KH); kat.position.copy(BC).add(V(0, 0.006, 0)); g.add(kat);
  const clean = disc(1, waterM(0xbfdbe6, 0.55)); clean.visible = false; g.add(clean); it.cup = 0;
  const setCup = () => { clean.visible = it.cup > 0.0005; const y = 0.006 + 0.006 + it.cup; clean.position.copy(BC).add(V(0, y, 0)); clean.scale.setScalar(rOfBowl(KR, KH, y - 0.006) * 0.97); };
  // the clear sheet over the basin: it dips in the middle when the stone is on it
  const SG = new THREE.CircleGeometry(BR * 1.12, 48, 0, TAU); SG.rotateX(-Math.PI / 2); const sp0 = SG.attributes.position.array.slice();
  const sheet = new THREE.Mesh(SG, polyM()); sheet.material.opacity = 0.3; sheet.renderOrder = 10; sheet.visible = false; g.add(sheet);
  const mist = new THREE.Mesh(SG, mistM()); mist.renderOrder = 11; mist.visible = false; g.add(mist);
  const stone = new THREE.Mesh(new THREE.DodecahedronGeometry(0.022, 1).scale(1.3, 0.7, 1), new THREE.MeshStandardMaterial({ color: 0x7a7468, roughness: 0.9 })); stone.visible = false; stone.castShadow = true; g.add(stone);
  it.sag = 0; const setSheet = () => { const p = SG.attributes.position; for (let i = 0; i < p.count; i++) { const x = sp0[i * 3], z = sp0[i * 3 + 2], q = Math.min(1, Math.hypot(x, z) / BR); p.setY(i, -it.sag * Math.max(0, 1 - q * q) + (q > 1 ? -(q - 1) * 0.25 : 0)); } p.needsUpdate = true; SG.computeVertexNormals();
    sheet.position.copy(BC).add(V(0, BH + 0.009, 0)); mist.position.copy(sheet.position).add(V(0, -0.001, 0)); stone.position.copy(sheet.position).add(V(0, -it.sag + 0.012, 0)); };
  // a potted plant and the bag that goes over its leaves; a steel glass of water and a bowl of ice
  const PP = V(0.3, Y, -0.85); const plant = ecoModel('potted_plant_02', { h: 0.45, face: [0.2, 1] }); plant.position.copy(PP); g.add(plant);
  const bag = polyBag(0.18, 0.36); bag.position.copy(PP).add(V(0, 0.09, 0)); bag.visible = false; g.add(bag);
  const GL = V(0.85, Y, -0.85); const glassG = lathe([[0, 0], [0.03, 0], [0.031, 0.004], [0.036, 0.11], [0.0345, 0.11], [0.0295, 0.006], [0, 0.006]], steel(), 32); glassG.position.copy(GL); g.add(glassG);
  const gw = disc(0.033, waterM(0xbad3dc, 0.6)); gw.position.copy(GL).add(V(0, 0.08, 0)); g.add(gw);
  const sweat = lathe([[0.0305, 0.006], [0.0365, 0.11]], mistM(), 32); sweat.position.copy(GL); sweat.renderOrder = 10; g.add(sweat);
  const iceM = new THREE.MeshStandardMaterial({ color: 0xeef6fa, roughness: 0.08, transparent: true, opacity: 0.75 }); const cubes = []; for (let i = 0; i < 4; i++) { const c = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.016, 0.018), iceM); c.visible = false; c.rotation.set(i, i * 2, 0); g.add(c); cubes.push(c); }
  const sign = liveSign(0.1, 4.6); sign.position.set(0, Y + 0.68, -1.0); g.add(sign); it.say = (l, c) => sign.set(l, c);
  const rings = [[spot(0.27), () => it.open === 'sheet'], [spot(0.04), () => it.open === 'stone'], [spot(0.18), () => it.open === 'bag'], [spot(0.05), () => it.open === 'ice']];
  rings[0][0].position.copy(BC).add(V(0, BH + 0.02, 0)); rings[1][0].position.copy(BC).add(V(0, BH + 0.02, 0)); rings[2][0].position.copy(PP).add(V(0, 0.1, 0)); rings[3][0].position.copy(GL).add(V(0, 0.12, 0)); rings.forEach(([m]) => g.add(m)); ticks.push(zoneRings(rings));
  it.at = { basin: () => BC.clone(), plant: () => PP.clone(), glass: () => GL.clone() };
  animator(it); const up0 = it.update; it.covered = false; it.stoned = false; it.bagged = false; it.iced = false;
  it.cover = (th, cb) => { th.flying = true; flyTo(th, BC.clone().add(V(0, BH + 0.05, 0)), 0, 0.7, () => { th.g.visible = false; th.used = true; sheet.visible = mist.visible = true; it.covered = true; setSheet(); it.update0 = null; if (cb) cb(); }); };
  it.putStone = (th, cb) => { th.flying = true; flyTo(th, BC.clone().add(V(0, BH + 0.06, 0)), 0, 0.6, () => { th.g.visible = false; th.used = true; stone.visible = true; it.stoned = true; it.play(0.8, (k) => { it.sag = 0.038 * ease(k); setSheet(); }, () => { if (cb) cb(); }); }); };
  it.bagIt = (th, cb) => { th.flying = true; flyTo(th, PP.clone().add(V(0, 0.45, 0)), 0, 0.7, () => { th.g.visible = false; th.used = true; bag.visible = true; it.bagged = true; bag.scale.set(1, 0.2, 1); it.play(0.8, (k) => bag.scale.set(1, 0.2 + 0.8 * ease(k), 1), () => { if (cb) cb(); }); }); };
  // ice into the glass: water vapour in the air condenses on its cold outside within a minute or so
  it.ice = (th, cb) => { th.flying = true; flyTo(th, GL.clone().add(V(0.05, 0.16, 0)), 0, 0.7, () => { cubes.forEach((c, i) => { c.visible = true; c.position.copy(GL).add(V(Math.cos(i * 1.7) * 0.012, 0.15, Math.sin(i * 1.7) * 0.012)); });
    it.play(5, (k) => { cubes.forEach((c, i) => { c.position.y = lerp(GL.y + 0.15, GL.y + 0.076 + (i % 2) * 0.006, ease(clamp01(k * 4 - i * 0.2))); }); sweat.material.opacity = 0.85 * ease(clamp01((k - 0.2) / 0.8)); th.g.position.copy(th.home.p); th.g.quaternion.copy(th.home.q); },
      () => { th.flying = false; it.iced = true; th.placed = false; if (cb) cb(); }); }); };
  // the clock: 10 in the morning to 3 in the afternoon (t = 0 … 5 hours in the sun)
  it.t = 0; it.tMax = 5; const drips = []; for (let i = 0; i < 6; i++) { const d = new THREE.Mesh(new THREE.SphereGeometry(0.003, 8, 6), dropM()); d.visible = false; g.add(d); drips.push({ d, k: i / 6 }); }
  it.setT = (t) => { it.t = Math.max(0, Math.min(it.tMax, t)); const m = clamp01(it.t / 1.5); if (it.covered) mist.material.opacity = 0.85 * m;
    it.level = 0.035 - 0.006 * it.t / 5; setMud(); it.cup = it.covered && it.stoned ? 0.014 * clamp01((it.t - 0.8) / 4.2) : 0; setCup(); if (it.bagged) bag.userData.setMist(clamp01(it.t / 2.5));
    const hr = 10 + it.t, h12 = ((Math.floor(hr) - 1) % 12) + 1; it.say([`${h12}:${String(Math.round((hr % 1) * 60)).padStart(2, '0')} ${hr < 12 ? 'am' : 'pm'}`, !it.covered ? w_('The basin is not covered') : it.stoned ? `${w_('Water in the katori')}: ${Math.round(it.cup * 1000) / 10} cm` : w_('Drops run to the edge of the flat sheet')], ['#ffffff', '#ffd23f']); };
  ticks.push((dt, tt) => { const on = it.covered && it.t > 0.8 && it.t < it.tMax + 0.1 && it.dripping; drips.forEach((p, i) => { p.d.visible = on; if (!on) return; p.k = (p.k + dt * 0.7) % 1; const top = BC.y + BH + 0.009 - it.sag;
    if (it.stoned) p.d.position.set(BC.x, lerp(top - 0.004, BC.y + 0.02, p.k * p.k), BC.z); else { const a = i / 6 * TAU; p.d.position.set(BC.x + Math.cos(a) * BR * 0.97, lerp(BC.y + BH, BC.y + it.level + 0.004, p.k * p.k), BC.z + Math.sin(a) * BR * 0.97); } }); });
  it.knobPath = () => [V(-0.45, Y + 0.02, -0.42), V(0.45, Y + 0.02, -0.42)];
  it.update = (dt, t) => { up0(dt); const tt = t ?? performance.now() / 1000; for (const f of ticks) f(dt || 0.016, tt); };
  it.views = { pond: { p: V(0, 2.05, 1.35), t: V(0, 0.35, -2.0) }, basin: { p: V(-0.3, 1.45, -0.25), t: V(-0.32, Y + 0.05, -0.8) }, table: { p: V(0.05, 1.55, 0.25), t: V(0.05, Y + 0.12, -0.8) }, cup: { p: V(-0.35, 1.32, -0.5), t: V(-0.35, Y + 0.02, -0.8) }, glass: { p: V(0.8, 1.22, -0.45), t: V(0.85, Y + 0.06, -0.85) } };
  setMud(); setSheet(); setCup(); it.say([w_('Muddy pond water in the sun')], '#ffffff');
  return done1(it, { height: 0.3, radius: 1.0 });
}
export function bindWaterCycle(wc, th, app, s, done = {}) {
  Object.defineProperty(wc, 'open', { configurable: true, get: () => (stepNow(app, s.sheet) ? 'sheet' : stepNow(app, s.stone) ? 'stone' : stepNow(app, s.bag) ? 'bag' : stepNow(app, s.ice) ? 'ice' : null) });
  Object.defineProperty(wc, 'dripping', { configurable: true, get: () => app.runner.i >= s.clock });
  carry(th.sheet, [{ at: wc.at.basin, r: 0.28, open: () => wc.open === 'sheet', put: (x) => wc.cover(x, done.sheet) }]);
  carry(th.stone, [{ at: wc.at.basin, r: 0.22, open: () => wc.open === 'stone' && wc.covered, put: (x) => wc.putStone(x, done.stone) }]);
  carry(th.bag, [{ at: wc.at.plant, r: 0.2, open: () => wc.open === 'bag', put: (x) => wc.bagIt(x, done.bag) }]);
  carry(th.ice, [{ at: wc.at.glass, r: 0.14, open: () => wc.open === 'ice' && !wc.busy, put: (x) => wc.ice(x, done.ice) }]);
}
// a bowl of ice cubes (what the student picks up)
export function iceBowl() { const g = bowlMesh(0.05, 0.035); const m = new THREE.MeshStandardMaterial({ color: 0xeef6fa, roughness: 0.08, transparent: true, opacity: 0.8 }); for (let i = 0; i < 5; i++) { const c = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.016, 0.018), m); c.position.set(Math.cos(i * 1.3) * 0.018, 0.022 + (i % 2) * 0.008, Math.sin(i * 1.3) * 0.018); c.rotation.set(i, i * 2, 0); g.add(c); } g.traverse((x) => { x.userData.noHit = true; }); return g; }
export function stoneThing() { const g = new THREE.Group(); const s = new THREE.Mesh(new THREE.DodecahedronGeometry(0.022, 1).scale(1.3, 0.7, 1), new THREE.MeshStandardMaterial({ color: 0x7a7468, roughness: 0.9 })); s.position.y = 0.014; s.castShadow = true; s.userData.noHit = true; g.add(s); return g; }

// ------------------------------------------------------------------ Class 7: snails, water plants and the air in balance
// Four boiling tubes of carbon dioxide indicator (red; yellow when carbon dioxide rises, purple when it falls) stand in a
// rack by the pond. The student drops pond snails and sprigs of Hydrilla into them; tube D, with both, is covered with
// black paper. Six hours in the sun: what each tube shows depends on what the student put in it.
function hydrilla(L = 0.085) { const g = new THREE.Group(); const r = rnd(Math.floor(L * 1000)); const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.0009, 0.0011, L, 5), new THREE.MeshStandardMaterial({ color: 0x5f8a2e, roughness: 0.6 })); stem.position.y = L / 2; g.add(stem);
  const lg = new THREE.SphereGeometry(0.0055, 6, 4).scale(0.28, 1, 0.08); lg.translate(0, 0.0052, 0); const n = Math.floor(L / 0.0045) * 4; const lm = new THREE.InstancedMesh(lg, new THREE.MeshStandardMaterial({ color: 0x4f8f2a, roughness: 0.5, side: THREE.DoubleSide }), n); const o = new THREE.Object3D(); let k = 0;
  for (let y = 0.004; y < L - 0.002 && k < n; y += 0.0045) { const s = 1 - 0.45 * Math.max(0, (y - L * 0.7) / (L * 0.3)); for (let j = 0; j < 4 && k < n; j++) { o.position.set(0, y, 0); o.rotation.set(0, j / 4 * TAU + y * 40, 0); o.rotateZ(0.9 - 0.25 * (y / L)); o.scale.setScalar(s * (0.9 + r() * 0.2)); o.updateMatrix(); lm.setMatrixAt(k++, o.matrix); } }
  lm.count = k; g.add(lm); g.traverse((x) => { x.userData.noHit = true; }); return g; }
export function blackSleeve() { const g = new THREE.Group(); const m = new THREE.Mesh(new THREE.CylinderGeometry(0.019, 0.019, 0.15, 20, 1, true), new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.85, side: THREE.DoubleSide })); m.rotation.z = Math.PI / 2; m.position.y = 0.02; m.userData.noHit = true; g.add(m); return g; }
export function sprigThing() { const g = new THREE.Group(); const h = hydrilla(0.085); h.rotation.z = Math.PI / 2 - 0.1; h.position.set(0.042, 0.005, 0); g.add(h); return g; }
const IND = [new THREE.Color(0x7e2f86), new THREE.Color(0xd1462e), new THREE.Color(0xe7c12c)]; // purple · red · yellow
const indCol = (c, out) => (c < 0 ? out.copy(IND[1]).lerp(IND[0], clamp01(-c)) : out.copy(IND[1]).lerp(IND[2], clamp01(c)));
export function gasTubes(o = {}) {
  const it = new Item('bgas', { ...o, name: N3('Tubes of carbon dioxide indicator', 'कार्बन डाइऑक्साइड इंडिकेटर की नलियाँ', 'Carbon dioxide indicator ki tubes') });
  const g = it.g, w_ = o.W || ((k) => k), Y = BENCH_Y, ticks = [];
  const RK = V(0, Y, -0.84), XS = [-0.15, -0.05, 0.05, 0.15], TR = 0.014, TH = 0.16, LV = 0.12;
  // the rack: a wooden block with four holes, and a back rail
  const wood = new THREE.MeshStandardMaterial({ map: woodTex('#a77a4a', 31), roughness: 0.7 }); const base = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.015, 0.08), wood); base.position.copy(RK).add(V(0, 0.0075, 0)); g.add(base);
  const top = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.012, 0.08), wood); top.position.copy(RK).add(V(0, 0.07, 0)); g.add(top); for (const sx of [-1, 1]) { const leg = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.07, 0.08), wood); leg.position.copy(RK).add(V(sx * 0.204, 0.035, 0)); g.add(leg); }
  const tubes = XS.map((x, i) => { const p = RK.clone().add(V(x, 0.008, 0)); const tb = lathe([[0, 0], [TR * 0.6, 0.0], [TR, 0.008], [TR, TH], [TR * 1.15, TH + 0.002], [TR * 0.92, TH + 0.002], [TR * 0.92, 0.008], [0, 0.004]], glass(), 24); tb.position.copy(p); tb.renderOrder = 8; g.add(tb);
    const liq = new THREE.MeshStandardMaterial({ color: IND[1].clone(), roughness: 0.3, transparent: true, opacity: 0.93, depthWrite: false, envMapIntensity: 0.5 }); const lq = lathe([[0, 0.004], [TR * 0.55, 0.004], [TR * 0.9, 0.009], [TR * 0.9, LV], [0, LV]], liq, 20); lq.position.copy(p); lq.renderOrder = 7; g.add(lq);
    const cork = new THREE.Mesh(new THREE.CylinderGeometry(TR * 1.05, TR * 0.85, 0.022, 16), new THREE.MeshStandardMaterial({ color: 0xa8784a, roughness: 0.9 })); cork.position.copy(p).add(V(0, TH + 0.008, 0)); cork.visible = false; g.add(cork);
    const lab = tag('ABCD'[i], '#ffffff', 0.045); lab.position.copy(p).add(V(0, -0.015, 0.06)); g.add(lab);
    return { p, liq, cork, s: 0, pl: 0, dark: false, inside: new THREE.Group(), c: 0 }; });
  tubes.forEach((t) => { t.inside.position.copy(t.p); g.add(t.inside); });
  // the black paper sleeve that is slipped over tube D
  const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(TR * 1.35, TR * 1.35, TH * 0.92, 20, 1, true), new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.85, side: THREE.DoubleSide })); sleeve.visible = false; g.add(sleeve);
  const sign = liveSign(0.1, 4.6); sign.position.set(0, Y + 0.6, -1.0); g.add(sign); it.say = (l, c) => sign.set(l, c);
  const rings = tubes.map((t, i) => { const m = spot(0.03); m.position.copy(t.p).add(V(0, TH + 0.02, 0)); g.add(m); return [m, () => it.open && it.open(i)]; }); ticks.push(zoneRings(rings));
  // oxygen bubbles rising from the Hydrilla in the light
  const bub = new THREE.InstancedMesh(new THREE.SphereGeometry(0.0012, 6, 4), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.05, transparent: true, opacity: 0.8 }), 40); bub.count = 0; bub.frustumCulled = false; g.add(bub); const BB = [];
  it.tubes = tubes; it.tubeAt = (i) => tubes[i].p.clone().add(V(0, TH, 0));
  // put a snail or a sprig in tube i (it sinks to the bottom or stands in the liquid)
  it.put = (th, i, cb) => { const t = tubes[i]; th.flying = true; flyTo(th, t.p.clone().add(V(0, TH + 0.06, 0)), 0, 0.6, () => { th.g.visible = false; th.used = true; th.flying = false;
    const m = th.kind2 === 'snail' ? ecoModel('snail', { len: 0.012, face: [Math.random() - 0.5, 1] }) : hydrilla(0.09); if (th.kind2 === 'snail') { m.position.set((t.s % 2 ? 0.003 : -0.003), 0.006, 0); t.s++; } else { m.position.set(0.002 * t.pl, 0.006, 0); m.rotation.y = t.pl * 1.3; t.pl++; } t.inside.add(m); if (cb) cb(); }); };
  it.preFill = (i, kind) => { const t = tubes[i]; const m = kind === 'snail' ? ecoModel('snail', { len: 0.012, face: [0.4, 1] }) : hydrilla(0.09); if (kind === 'snail') { m.position.set(-0.003, 0.006, 0); t.s++; } else { m.position.set(0.002, 0.006, 0); t.pl++; } t.inside.add(m); };
  // the sleeve slips over tube D (the paper the student holds stays there, to be pulled off again by hand later)
  it.cover = (th, cb) => { th.flying = true; flyTo(th, tubes[3].p.clone().add(V(0, TH + 0.12, 0)), 0, 0.6, () => { th.model.visible = false; th.g.position.copy(tubes[3].p).add(V(0, TH * 0.55, 0)); th.home.p.copy(th.g.position); th.flying = false; th.placed = false; th.onTube = true;
    sleeve.visible = true; tubes[3].dark = true; sleeve.position.copy(tubes[3].p).add(V(0, TH * 0.5, 0)); if (cb) cb(); }); };
  it.uncover = (cb, th) => { if (!tubes[3].dark || it.busy) return false; it.play(1.2, (k) => { sleeve.position.copy(tubes[3].p).add(V(0.05 * ease(k), TH * 0.5 + 0.2 * ease(k), 0)); }, () => { sleeve.visible = false; tubes[3].shown = true; tubes[3].dark = false; if (th) { th.model.visible = true; th.onTube = false; th.used = true; th.placed = true; flyTo(th, tubes[3].p.clone().add(V(0.25, 0, 0.18)), 0, 0.5); } if (cb) cb(); }); return true; };
  // six hours: carbon dioxide from the snails (always) and from the plant in the dark; taken up by the plant in the light
  it.t = 0; it.tMax = 6; const col = new THREE.Color();
  it.setT = (t) => { it.t = Math.max(0, Math.min(it.tMax, t)); const k = it.t / 6; tubes.forEach((tb) => { tb.cork.visible = it.t > 0 || tb.cork.visible; tb.c = (tb.s * 1.0 - tb.pl * (tb.dark ? -0.3 : 1.0)) * k; indCol(tb.c, col); tb.liq.color.copy(col); });
    it.say([`${w_('Hours in the sun')}: ${Math.round(it.t * 10) / 10}`, tubes.map((tb, i) => `${'ABCD'[i]}: ${w_(tb.c > 0.45 ? 'yellow' : tb.c < -0.45 ? 'purple' : 'red')}`).join(' · ')], ['#ffffff', '#ffd23f']); };
  it.result = () => tubes.map((tb) => (tb.c > 0.45 ? 'yellow' : tb.c < -0.45 ? 'purple' : 'red'));
  ticks.push((dt) => { const d = Math.min(0.05, dt || 0.016); if (it.t > 0.2 && it.t < it.tMax + 1 && Math.random() < 0.5) tubes.forEach((tb) => { if (tb.pl && !tb.dark && BB.length < 40 && Math.random() < 0.25) BB.push({ p: tb.p.clone().add(V((Math.random() - 0.5) * 0.012, 0.02 + Math.random() * 0.05, (Math.random() - 0.5) * 0.012)), top: tb.p.y + LV - 0.002 }); });
    const o2 = new THREE.Object3D(); let n = 0; for (let i = BB.length - 1; i >= 0; i--) { const b = BB[i]; b.p.y += d * 0.03; if (b.p.y > b.top) { BB.splice(i, 1); continue; } o2.position.copy(b.p); o2.updateMatrix(); bub.setMatrixAt(n++, o2.matrix); } bub.count = n; bub.instanceMatrix.needsUpdate = true; });
  it.knobPath = () => [V(-0.4, Y + 0.02, -0.45), V(0.4, Y + 0.02, -0.45)];
  animator(it); const up0 = it.update; it.update = (dt, t) => { up0(dt); const tt = t ?? performance.now() / 1000; for (const f of ticks) f(dt || 0.016, tt); };
  it.views = { pond: { p: V(0, 2.05, 1.35), t: V(0, 0.35, -2.0) }, rack: { p: V(0, 1.3, -0.3), t: V(0, Y + 0.08, -0.82) }, table: { p: V(0, 1.42, -0.08), t: V(0, Y + 0.05, -0.76) } };
  it.setT(0); it.say([w_('Carbon dioxide indicator: red')], '#ffffff');
  return done1(it, { height: 0.2, radius: 0.6 });
}
// any snail or sprig may go into any tube A–C while those steps are on (what is in each tube decides its colour);
// done.put(kind, i) after each; the sleeve goes over tube D only
export function bindGas(gt, things, sleeve, app, s, done = {}) {
  const filling = () => app.runner.i >= s.first && app.runner.i <= s.last && app.runner.state === 'todo';
  gt.open = (i) => (i < 3 && filling()) || (i === 3 && stepNow(app, s.sleeve) && !gt.tubes[3].dark);
  for (const th of things) carry(th, [0, 1, 2].map((i) => ({ at: () => gt.tubeAt(i), r: 0.045, open: () => filling() && !th.used, put: (x) => gt.put(x, i, () => done.put && done.put(x.kind2, i)) })));
  carry(sleeve, [{ at: () => gt.tubeAt(3), r: 0.06, open: () => gt.open(3) && !sleeve.onTube, put: (x) => gt.cover(x, done.sleeve) }], { free: (x) => { if (!x.onTube || !stepNow(app, s.uncover)) return false; x.placed = true; return gt.uncover(() => done.uncover && done.uncover(), x) !== false; } });
}
// ---- end of part 2

// ------------------------------------------------------------------ Class 8: microbes set curd
// In the kitchen: three katoris of lukewarm milk (A, B, C), yesterday's curd with a spoon, and a box of ice. Lactobacillus
// in a spoonful of curd turns warm milk into curd overnight; in the cold, or without any curd added, the milk stays milk.
const curdTex = () => T.curd || (T.curd = tex(256, 256, (x) => { x.fillStyle = '#f7f3e8'; x.fillRect(0, 0, 256, 256); const r = rnd(12); for (let i = 0; i < 260; i++) { x.fillStyle = `rgba(${r() < 0.5 ? '255,255,250' : '225,218,195'},0.5)`; x.beginPath(); x.arc(r() * 256, r() * 256, 2 + r() * 9, 0, TAU); x.fill(); }
  x.strokeStyle = 'rgba(205,195,160,0.6)'; x.lineWidth = 1.5; for (let i = 0; i < 6; i++) { x.beginPath(); let px = r() * 256, py = r() * 256; x.moveTo(px, py); for (let k = 0; k < 5; k++) { px += (r() - 0.5) * 40; py += (r() - 0.5) * 40; x.lineTo(px, py); } x.stroke(); } }));
const milkM = () => new THREE.MeshStandardMaterial({ color: 0xfdfbf4, roughness: 0.3 });
// a katori of milk (what is picked up); its state: starter (curd added), cold (in the ice box), set (0 … 1)
export function milkBowl(letter) { const g = bowlMesh(0.065, 0.05); const m = disc(1, milkM()); m.position.y = 0.036; m.scale.setScalar(rOfBowl(0.065, 0.05, 0.036) * 0.98); g.add(m); g.userData.milk = m;
  const lump = new THREE.Mesh(new THREE.SphereGeometry(0.012, 12, 8).scale(1.2, 0.5, 1), new THREE.MeshStandardMaterial({ map: curdTex(), roughness: 0.8 })); lump.position.set(0.012, 0.037, 0.008); lump.visible = false; g.add(lump); g.userData.lump = lump;
  const dent = new THREE.Mesh(new THREE.CircleGeometry(0.016, 20).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xd9d2bd, roughness: 0.5 })); dent.position.set(-0.015, 0.0365, 0.01); dent.scale.set(1, 1, 0.7); dent.visible = false; g.add(dent); g.userData.dent = dent;
  const lab = tag(letter, '#ffffff', 0.028); lab.position.set(0, 0.012, 0.085); g.add(lab); g.traverse((x) => { x.userData.noHit = true; }); return g; }
export function spoon() { const g = new THREE.Group(); const b = new THREE.Mesh(new THREE.SphereGeometry(0.016, 16, 8, 0, TAU, Math.PI / 2, Math.PI / 2).scale(0.8, 0.35, 1.2), steel()); b.position.set(0, 0.006, 0); g.add(b);
  const h = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.002, 0.11), steel()); h.position.set(0, 0.012, 0.07); h.rotation.x = -0.12; g.add(h);
  const load = new THREE.Mesh(new THREE.SphereGeometry(0.011, 12, 8).scale(1, 0.55, 1.3), new THREE.MeshStandardMaterial({ map: curdTex(), roughness: 0.8 })); load.position.set(0, 0.009, 0); load.visible = false; g.add(load); g.userData.load = load;
  g.traverse((x) => { x.userData.noHit = true; if (x.isMesh) x.castShadow = true; }); return g; }
export function curdKit(o = {}) {
  const it = new Item('bcurd', { ...o, name: N3('Curd, an ice box and the clock', 'दही, बर्फ़ का डिब्बा और घड़ी', 'Dahi, barf ka dabba aur ghadi') });
  const g = it.g, w_ = o.W || ((k) => k), Y = BENCH_Y, ticks = [];
  // yesterday's curd in a steel bowl
  const SB = V(0.78, Y, -0.82); const sb = bowlMesh(0.07, 0.055); sb.position.copy(SB); g.add(sb); const cs = disc(rOfBowl(0.07, 0.055, 0.04) * 0.98, new THREE.MeshStandardMaterial({ map: curdTex(), roughness: 0.75 })); cs.position.copy(SB).add(V(0, 0.04, 0)); g.add(cs);
  const st = tag(w_('Curd'), '#ffffff', 0.04); st.position.copy(SB).add(V(0, 0.1, 0.05)); g.add(st);
  // the ice box: an open steel box full of ice
  const IB = V(-0.85, Y, -0.82); const boxM = steel(); const wallG = (w, h, d, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), boxM); m.position.copy(IB).add(V(x, y, z)); m.castShadow = true; g.add(m); };
  wallG(0.26, 0.004, 0.22, 0, 0.002, 0); wallG(0.26, 0.07, 0.004, 0, 0.035, 0.11); wallG(0.26, 0.07, 0.004, 0, 0.035, -0.11); wallG(0.004, 0.07, 0.22, 0.13, 0.035, 0); wallG(0.004, 0.07, 0.22, -0.13, 0.035, 0);
  const iceM = new THREE.MeshStandardMaterial({ color: 0xeaf4fa, roughness: 0.06, transparent: true, opacity: 0.8 }); const ice = new THREE.InstancedMesh(new THREE.BoxGeometry(0.03, 0.025, 0.03), iceM, 36); const o3 = new THREE.Object3D(); const ri = rnd(3);
  for (let i = 0; i < 36; i++) { o3.position.copy(IB).add(V(-0.105 + (i % 6) * 0.042 + (ri() - 0.5) * 0.01, 0.02 + Math.floor(i / 18) * 0.022, -0.085 + (Math.floor(i / 6) % 3) * 0.085 + (ri() - 0.5) * 0.01)); o3.rotation.set(ri(), ri(), ri()); o3.updateMatrix(); ice.setMatrixAt(i, o3.matrix); } g.add(ice);
  const it2 = tag(w_('Ice box'), '#bfe3ff', 0.04); it2.position.copy(IB).add(V(0, 0.13, 0.08)); g.add(it2);
  const sign = liveSign(0.1, 4.6); sign.position.set(0, Y + 0.62, -1.0); g.add(sign); it.say = (l, c) => sign.set(l, c);
  it.bowls = []; it.at = { starter: () => SB.clone(), ice: () => IB.clone() };
  const rings = [[spot(0.15), () => it.open === 'ice']]; rings[0][0].position.copy(IB).add(V(0, 0.08, 0)); rings.forEach(([m]) => g.add(m)); ticks.push(zoneRings(rings));
  animator(it); const up0 = it.update;
  // a spoonful of curd into a bowl: the spoon dips into the curd, then tips its load into the milk and stirs
  it.addStarter = (sp, bw, cb) => { if (it.busy) return false; const p0 = sp.g.position.clone(); sp.flying = true; const into = SB.clone().add(V(0, 0.07, 0)), over = bw.g.position.clone().add(V(0, 0.08, 0)), load = sp.model.userData.load;
    it.play(3, (k) => { if (k < 0.3) { sp.g.position.lerpVectors(p0, into, ease(k / 0.3)); sp.g.position.y -= Math.sin(k / 0.3 * Math.PI) * 0.04; if (k > 0.2) load.visible = true; } else if (k < 0.6) sp.g.position.lerpVectors(into, over, ease((k - 0.3) / 0.3));
      else { const q = (k - 0.6) / 0.4; sp.g.position.copy(over).add(V(Math.cos(q * 18) * 0.025, -0.035 - Math.sin(q * Math.PI) * 0.005, Math.sin(q * 18) * 0.025)); if (q > 0.1) load.visible = false; } },
    () => { sp.g.position.copy(sp.home.p); sp.flying = false; sp.placed = false; bw.st.starter = true; if (cb) cb(); }); return true; };
  // a bowl put in (or taken out of) the ice box
  it.chill = (bw, cb) => { bw.flying = true; const n = it.bowls.filter((b) => b.st.cold).length; flyTo(bw, IB.clone().add(V(-0.05 + n * 0.1, 0.045, 0)), 0, 0.7, () => { bw.flying = false; bw.st.cold = true; bw.home.p.copy(bw.g.position); bw.placed = false; if (cb) cb(); }); };
  // the clock: 9 in the evening to 5 in the morning. Curd sets in warm milk with Lactobacillus in it
  it.t = 0; it.tMax = 8; const cm = new THREE.Color(0xfdfbf4), ccurd = new THREE.Color(0xf3eedf);
  it.setT = (t) => { it.t = Math.max(0, Math.min(it.tMax, t)); for (const bw of it.bowls) { const s = bw.st; s.set = s.starter ? (s.cold ? 0.08 * clamp01((it.t - 4) / 4) : clamp01((it.t - 2.5) / 4.5)) : 0; const m = bw.model.userData.milk.material;
      m.color.copy(cm).lerp(ccurd, s.set); m.roughness = 0.3 + 0.5 * s.set; if (s.set > 0.5 && !m.map) { m.map = curdTex(); m.needsUpdate = true; } if (s.set <= 0.5 && m.map) { m.map = null; m.needsUpdate = true; } }
    const hr = (21 + it.t) % 24, h12 = ((Math.floor(hr) + 11) % 12) + 1; it.say([`${h12}:00 ${hr >= 12 && hr < 24 && hr >= 21 ? 'pm' : hr < 12 ? 'am' : 'pm'}`, it.bowls.map((b) => `${b.letter}: ${w_(b.st.set > 0.8 ? 'set curd' : b.st.set > 0.3 ? 'thickening' : 'still milk')}`).join(' · ')], ['#ffffff', '#ffd23f']); };
  // testing a bowl with the spoon: set curd comes up in a firm lump and leaves a dent; milk just drips off
  it.test = (sp, bw, cb) => { if (it.busy) return false; const p0 = sp.g.position.clone(), over = bw.g.position.clone().add(V(0, 0.07, 0)); sp.flying = true; const set = bw.st.set > 0.6, load = sp.model.userData.load; const drops = [];
    if (!set) for (let i = 0; i < 4; i++) { const d = new THREE.Mesh(new THREE.SphereGeometry(0.0025, 8, 6), milkM()); d.visible = false; g.add(d); drops.push(d); }
    it.play(2.6, (k) => { if (k < 0.3) sp.g.position.lerpVectors(p0, over, ease(k / 0.3)); else if (k < 0.5) sp.g.position.copy(over).add(V(0, -0.035 * Math.sin((k - 0.3) / 0.2 * Math.PI), 0)); else sp.g.position.copy(over).add(V(0, 0.04 * ease((k - 0.5) / 0.2), 0));
      if (k > 0.42) { if (set) { load.visible = true; bw.model.userData.dent.visible = true; } else drops.forEach((d, i) => { const q = ((k - 0.45) * 3 + i * 0.25) % 1; d.visible = k < 0.95; d.position.copy(sp.g.position).add(V(0, -0.005 - q * 0.04, 0)); }); } },
    () => { drops.forEach((d) => g.remove(d)); bw.st.tested = true; if (set) { bw.model.userData.lump.visible = false; } setTimeout(() => { load.visible = false; sp.g.position.copy(sp.home.p); sp.flying = false; sp.placed = false; }, 900); if (cb) cb(set); }); return true; };
  it.knobPath = () => [V(-0.45, Y + 0.02, -0.42), V(0.45, Y + 0.02, -0.42)];
  it.update = (dt, t) => { up0(dt); const tt = t ?? performance.now() / 1000; for (const f of ticks) f(dt || 0.016, tt); };
  it.views = { table: { p: V(0, 1.95, 0.72), t: V(0, Y, -0.78) }, bowls: { p: V(0.19, 1.62, 0.3), t: V(0.19, Y + 0.02, -0.8) }, ice: { p: V(-0.45, 1.5, 0.05), t: V(-0.45, Y + 0.02, -0.82) }, test: { p: V(-0.12, 1.85, 0.55), t: V(-0.12, Y, -0.8) } };
  it.say([w_('Lukewarm milk in three bowls')], '#ffffff');
  return done1(it, { height: 0.15, radius: 1.0 });
}
// the spoon adds curd (steps add1, add2) or tests (step test) whichever bowl it is let go over; bowls go into the ice box
export function bindCurd(ck, sp, bowls, app, s, done = {}) {
  ck.bowls = bowls; bowls.forEach((b) => { b.st = { starter: false, cold: false, set: 0, tested: false }; });
  const adding = () => stepNow(app, s.add1) || stepNow(app, s.add2), testing = () => stepNow(app, s.test);
  carry(sp, bowls.map((b) => ({ at: () => b.g.position.clone(), r: 0.08, open: () => !ck.busy && (adding() && !b.st.starter || testing() && !b.st.tested), put: (x) => (testing() ? ck.test(x, b, (set) => done.tested && done.tested(b, set)) : ck.addStarter(x, b, () => done.added && done.added(b))) })));
  bowls.forEach((b) => carry(b, [{ at: ck.at.ice, r: 0.16, open: () => stepNow(app, s.chill) && !b.st.cold, put: (x) => ck.chill(x, () => done.chilled && done.chilled(b)) }]));
  Object.defineProperty(ck, 'open', { configurable: true, get: () => (stepNow(app, s.chill) ? 'ice' : null) });
}

// ------------------------------------------------------------------ Class 8: yeast makes gas (and dough rise)
// Two bottles of lukewarm sugar water (A, B), dried yeast with a spoon, two balloons, a tube of lime water, and two balls
// of dough that Maa made two hours ago, one with yeast in it and one without.
const doughTex = () => T.dough || (T.dough = tex(256, 256, (x) => { x.fillStyle = '#efe0bf'; x.fillRect(0, 0, 256, 256); const r = rnd(19); for (let i = 0; i < 1200; i++) { x.fillStyle = `rgba(${r() < 0.5 ? '255,250,235' : '205,180,140'},0.25)`; x.fillRect(r() * 256, r() * 256, 1 + r() * 3, 1 + r() * 3); } }));
const yeastTex = () => T.yeast || (T.yeast = tex(128, 128, (x) => { x.fillStyle = '#c7a878'; x.fillRect(0, 0, 128, 128); const r = rnd(6); for (let i = 0; i < 900; i++) { x.fillStyle = `rgba(${r() < 0.5 ? '120,90,55' : '230,210,170'},0.6)`; x.beginPath(); x.arc(r() * 128, r() * 128, 0.8 + r() * 1.6, 0, TAU); x.fill(); } }));
function bottleMesh() { const g = new THREE.Group(); const b = lathe([[0, 0], [0.036, 0], [0.04, 0.008], [0.04, 0.13], [0.032, 0.16], [0.015, 0.185], [0.014, 0.21], [0.016, 0.212], [0.016, 0.218], [0.0125, 0.218], [0.0125, 0.19], [0.029, 0.16], [0.037, 0.13], [0.037, 0.008], [0, 0.004]], glass(), 32); b.renderOrder = 8; g.add(b);
  const lq = lathe([[0, 0.005], [0.034, 0.006], [0.0365, 0.012], [0.0365, 0.11], [0, 0.11]], new THREE.MeshStandardMaterial({ color: 0xe6e2c8, roughness: 0.1, transparent: true, opacity: 0.55, depthWrite: false }), 28); lq.renderOrder = 7; g.add(lq); g.userData.liq = lq;
  const froth = new THREE.Mesh(new THREE.CylinderGeometry(0.0362, 0.0362, 0.012, 28), new THREE.MeshStandardMaterial({ color: 0xf2ead2, roughness: 0.9 })); froth.position.y = 0.114; froth.visible = false; g.add(froth); g.userData.froth = froth; return g; }
// a rubber balloon: lying flat, or stretched over a bottle and blown up (k: 0 … 1)
export function balloon(col) { const g = new THREE.Group(); const m = new THREE.MeshStandardMaterial({ color: col, roughness: 0.35, metalness: 0.05 });
  const body = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), m); g.add(body); const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.0165, 0.025, 16), m); g.add(neck);
  g.userData.set = (k, on) => { if (!on) { body.scale.set(0.04, 0.007, 0.022); body.position.set(0.01, 0.007, 0); neck.rotation.set(0, 0, Math.PI / 2); neck.position.set(-0.03, 0.006, 0); return; }
    neck.rotation.set(0, 0, 0); neck.position.set(0, 0.0125, 0); const r = 0.012 + 0.05 * k; body.scale.set(r * (k < 0.15 ? 0.7 : 1), r * (k < 0.15 ? 1.6 : 1.2), r * (k < 0.15 ? 0.7 : 1)); body.position.set(k < 0.15 ? 0.008 : 0, 0.025 + r * 1.1 - (k < 0.15 ? 0.01 : 0), 0); body.rotation.z = k < 0.15 ? -0.6 : 0; };
  g.userData.set(0, false); g.traverse((x) => { x.userData.noHit = true; if (x.isMesh) x.castShadow = true; }); return g; }
export function yeastKit(o = {}) {
  const it = new Item('byeast', { ...o, name: N3('Sugar water, yeast and lime water', 'चीनी का पानी, यीस्ट और चूने का पानी', 'Cheeni ka paani, yeast aur choone ka paani') });
  const g = it.g, w_ = o.W || ((k) => k), Y = BENCH_Y, ticks = [];
  const BP = [V(-0.5, Y, -0.84), V(-0.2, Y, -0.84)]; it.bottles = BP.map((p, i) => { const b = bottleMesh(); b.position.copy(p); g.add(b); const t = tag('AB'[i], '#ffffff', 0.03); t.position.copy(p).add(V(0, 0.015, 0.06)); g.add(t); return { m: b, p, yeast: false, balloon: null, gas: 0 }; });
  // dried yeast in a small bowl
  const YB = V(0.52, Y, -0.82); const yb = bowlMesh(0.05, 0.035); yb.position.copy(YB); g.add(yb); const yg = disc(rOfBowl(0.05, 0.035, 0.022) * 0.98, new THREE.MeshStandardMaterial({ map: yeastTex(), roughness: 0.9 })); yg.position.copy(YB).add(V(0, 0.022, 0)); g.add(yg);
  const ylab = tag(w_('Yeast'), '#ffffff', 0.035); ylab.position.copy(YB).add(V(0, 0.08, 0.04)); g.add(ylab);
  // lime water in a test tube, in a small wooden stand
  const LW = V(0.9, Y, -0.86); const st = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.04, 0.06), new THREE.MeshStandardMaterial({ map: woodTex('#a77a4a', 31), roughness: 0.7 })); st.position.copy(LW).add(V(0, 0.02, 0)); g.add(st);
  const tube = lathe([[0, 0], [0.008, 0.0], [0.011, 0.006], [0.011, 0.15], [0.0125, 0.152], [0.0095, 0.152], [0.0095, 0.006], [0, 0.003]], glass(), 20); tube.position.copy(LW).add(V(0, 0.01, 0)); tube.renderOrder = 8; g.add(tube);
  const lime = new THREE.MeshStandardMaterial({ color: 0xe9f0f2, roughness: 0.1, transparent: true, opacity: 0.25, depthWrite: false }); const lq = lathe([[0, 0.004], [0.009, 0.006], [0.009, 0.09], [0, 0.09]], lime, 16); lq.position.copy(LW).add(V(0, 0.01, 0)); lq.renderOrder = 7; g.add(lq);
  const llab = tag(w_('Lime water'), '#ffffff', 0.035); llab.position.copy(LW).add(V(0, 0.2, 0.03)); g.add(llab);
  // two balls of dough on a plate
  const DP = V(0.15, Y, -0.86); const plate = lathe([[0, 0], [0.12, 0.002], [0.13, 0.012], [0.128, 0.013], [0.118, 0.004], [0, 0.004]], steel(), 40); plate.position.copy(DP); g.add(plate);
  const dM = new THREE.MeshStandardMaterial({ map: doughTex(), roughness: 0.75 }); const dough = [-0.055, 0.055].map((x, i) => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.038, 24, 14).scale(1, 0.62, 1), dM); m.position.copy(DP).add(V(x, 0.02, 0)); m.castShadow = true; g.add(m); const t = tag(w_(i ? 'no yeast' : 'with yeast'), '#ffffff', 0.024); t.position.copy(DP).add(V(i ? 0.2 : -0.2, 0.03, 0.06)); g.add(t); return m; });
  const sign = liveSign(0.1, 4.6); sign.position.set(0, Y + 0.62, -1.0); g.add(sign); it.say = (l, c) => sign.set(l, c);
  const rings = [[spot(0.03), () => it.open === 'lime']]; rings[0][0].position.copy(LW).add(V(0, 0.18, 0)); rings.forEach(([m]) => g.add(m)); ticks.push(zoneRings(rings));
  it.at = { bottle: (i) => BP[i].clone().add(V(0, 0.218, 0)), lime: () => LW.clone() };
  // bubbles in a bottle with yeast, and in the lime water
  const bub = new THREE.InstancedMesh(new THREE.SphereGeometry(0.0015, 6, 4), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.05, transparent: true, opacity: 0.7 }), 60); bub.count = 0; bub.frustumCulled = false; g.add(bub); const BB = [];
  ticks.push((dt) => { const d = Math.min(0.05, dt || 0.016); it.bottles.forEach((b) => { if (b.yeast && it.t > 0.2 && BB.length < 60 && Math.random() < 0.3) BB.push({ p: b.p.clone().add(V((Math.random() - 0.5) * 0.05, 0.01 + Math.random() * 0.03, (Math.random() - 0.5) * 0.05)), top: b.p.y + 0.11 }); });
    if (it.limeBub > 0 && BB.length < 60) { it.limeBub -= d; BB.push({ p: LW.clone().add(V((Math.random() - 0.5) * 0.008, 0.02, 0)), top: LW.y + 0.098 }); }
    const o2 = new THREE.Object3D(); let n = 0; for (let i = BB.length - 1; i >= 0; i--) { const b = BB[i]; b.p.y += d * 0.04; if (b.p.y > b.top) { BB.splice(i, 1); continue; } o2.position.copy(b.p); o2.updateMatrix(); bub.setMatrixAt(n++, o2.matrix); } bub.count = n; bub.instanceMatrix.needsUpdate = true; });
  animator(it); const up0 = it.update; it.limeBub = 0; it.milky = 0;
  it.addYeast = (sp, i, cb) => { if (it.busy) return false; const p0 = sp.g.position.clone(); sp.flying = true; const into = YB.clone().add(V(0, 0.05, 0)), over = BP[i].clone().add(V(0, 0.26, 0)), load = sp.model.userData.load;
    it.play(2.6, (k) => { if (k < 0.3) { sp.g.position.lerpVectors(p0, into, ease(k / 0.3)); sp.g.position.y -= Math.sin(k / 0.3 * Math.PI) * 0.03; if (k > 0.2) { load.visible = true; load.material.map = yeastTex(); } } else if (k < 0.6) sp.g.position.lerpVectors(into, over, ease((k - 0.3) / 0.3)); else { sp.g.rotation.z = -1.4 * Math.sin((k - 0.6) / 0.4 * Math.PI); if (k > 0.7) load.visible = false; } },
    () => { sp.g.rotation.set(0, 0, 0); sp.g.position.copy(sp.home.p); sp.flying = false; sp.placed = false; it.bottles[i].yeast = true; it.bottles[i].m.userData.liq.material.color.set(0xd9cfa8); if (cb) cb(); }); return true; };
  it.fit = (bl, i, cb) => { bl.flying = true; flyTo(bl, it.at.bottle(i).add(V(0, -0.012, 0)), 0, 0.7, () => { bl.flying = false; bl.on = i; it.bottles[i].balloon = bl; bl.model.userData.set(0, true); bl.home.p.copy(bl.g.position); bl.home.q.copy(bl.g.quaternion); bl.placed = false; bl.dragLift = 0.08; if (cb) cb(); }); };
  // the clock: two hours in the warm kitchen
  it.t = 0; it.tMax = 2;
  it.setT = (t) => { it.t = Math.max(0, Math.min(it.tMax, t)); const k = it.t / 2; it.bottles.forEach((b) => { b.gas = b.yeast ? k : 0; b.m.userData.froth.visible = b.yeast && it.t > 0.3; if (b.balloon) b.balloon.model.userData.set(b.gas, true); });
    dough[0].scale.setScalar(1 + 0.45 * ease(k)); dough[0].position.y = DP.y + 0.02 + 0.012 * ease(k);
    it.say([`${w_('Time')}: ${Math.round(it.t * 60)} ${w_('minutes')}`, it.bottles.map((b, i) => `${'AB'[i]}: ${w_(b.yeast ? (b.gas > 0.5 ? 'frothing, balloon blown up' : 'bubbling') : 'no change')}`).join(' · ')], ['#ffffff', '#ffd23f']); };
  // the gas of a balloon squeezed through the lime water
  it.toLime = (bl, cb) => { if (it.busy) return false; const gas = bl.on != null ? it.bottles[bl.on].gas : 0; bl.flying = true; const p0 = bl.g.position.clone(), over = LW.clone().add(V(0, 0.17, 0));
    it.play(3.6, (k) => { if (k < 0.25) bl.g.position.lerpVectors(p0, over, ease(k / 0.25)); else if (k < 0.85) { const q = (k - 0.25) / 0.6; bl.model.userData.set(gas * (1 - q), true); if (gas > 0.2) { it.limeBub = 0.1; it.milky = Math.max(it.milky, q * gas); lime.color.set(0xe9f0f2).lerp(new THREE.Color(0xfbfbf8), it.milky); lime.opacity = 0.25 + 0.65 * it.milky; } } },
    () => { bl.flying = false; if (bl.on != null) it.bottles[bl.on].balloon = null; bl.used = true; bl.g.visible = false; if (cb) cb(gas > 0.2); }); return true; };
  it.knobPath = () => [V(-0.45, Y + 0.02, -0.42), V(0.45, Y + 0.02, -0.42)];
  it.update = (dt, t) => { up0(dt); const tt = t ?? performance.now() / 1000; for (const f of ticks) f(dt || 0.016, tt); };
  it.views = { table: { p: V(0, 1.85, 0.6), t: V(0, Y + 0.05, -0.8) }, bottles: { p: V(-0.42, 1.55, 0.2), t: V(-0.42, Y + 0.16, -0.8) }, warm: { p: V(-0.15, 1.58, 0.38), t: V(-0.15, Y + 0.17, -0.84) }, lime: { p: V(0.7, 1.32, -0.25), t: V(0.85, Y + 0.1, -0.86) }, dough: { p: V(0.15, 1.35, -0.25), t: V(0.15, Y + 0.03, -0.86) } };
  it.say([w_('Two bottles of lukewarm sugar water')], '#ffffff');
  return done1(it, { height: 0.25, radius: 1.0 });
}
export function bindYeast(yk, sp, balloons, app, s, done = {}) {
  carry(sp, [0, 1].map((i) => ({ at: () => yk.at.bottle(i), r: 0.09, open: () => stepNow(app, s.yeast) && !yk.busy && !yk.bottles[i].yeast, put: (x) => yk.addYeast(x, i, () => done.yeast && done.yeast(i)) })));
  balloons.forEach((bl) => carry(bl, [...[0, 1].map((i) => ({ at: () => yk.at.bottle(i), r: 0.09, open: () => stepNow(app, s.fit) && bl.on == null && !yk.bottles[i].balloon, put: (x) => yk.fit(x, i, () => done.fit && done.fit(i)) })),
    { at: yk.at.lime, r: 0.1, open: () => stepNow(app, s.lime) && bl.on != null && !yk.busy, put: (x) => yk.toLime(x, (milky) => done.lime && done.lime(milky)) }]));
  Object.defineProperty(yk, 'open', { configurable: true, get: () => (stepNow(app, s.lime) ? 'lime' : null) });
}
// ---- end of part 3

// ------------------------------------------------------------------ Class 8: seeds that travel (wind, water, animals)
// In a grassland with a steady breeze from the left: a post to hold seeds up to the wind, pegs every metre downwind, a tub
// of water with a coconut beside it, a gokhru (Xanthium) bush full of hooked burrs and a hare. Each seed is let go by hand,
// from wherever the student holds it, and flies as its shape and weight let it.
const fluffTex = () => T.fluff || (T.fluff = tex(128, 128, (x) => { x.clearRect(0, 0, 128, 128); x.strokeStyle = 'rgba(255,255,255,0.85)'; x.lineWidth = 0.8; const r = rnd(2); for (let i = 0; i < 140; i++) { const a = -Math.PI / 2 + (r() - 0.5) * 2.6; x.beginPath(); x.moveTo(64, 120); x.quadraticCurveTo(64 + Math.cos(a) * 40, 120 + Math.sin(a) * 40, 64 + Math.cos(a) * (70 + r() * 40), 120 + Math.sin(a) * (70 + r() * 40)); x.stroke(); } }));
// an aak (Calotropis) seed: a flat brown seed with a silky white tuft
export function aakSeed() { const g = new THREE.Group(); const s = new THREE.Mesh(new THREE.SphereGeometry(0.004, 10, 6).scale(1, 0.3, 1.5), new THREE.MeshStandardMaterial({ color: 0x6a4a2a, roughness: 0.7 })); g.add(s);
  const fm = new THREE.MeshBasicMaterial({ map: fluffTex(), transparent: true, depthWrite: false, side: THREE.DoubleSide }); for (let i = 0; i < 3; i++) { const p = new THREE.Mesh(new THREE.PlaneGeometry(0.05, 0.05), fm); p.position.y = 0.022; p.rotation.y = i / 3 * Math.PI; g.add(p); } g.position.y = 0; g.traverse((x) => { x.userData.noHit = true; }); return g; }
// a drumstick (Moringa) seed: a round seed with three papery wings
export function wingSeed() { const g = new THREE.Group(); const s = new THREE.Mesh(new THREE.SphereGeometry(0.0045, 12, 8), new THREE.MeshStandardMaterial({ color: 0x4a3a28, roughness: 0.6 })); s.position.y = 0.004; g.add(s);
  const wm = new THREE.MeshStandardMaterial({ color: 0xd9c9a2, roughness: 0.7, transparent: true, opacity: 0.85, side: THREE.DoubleSide }); for (let i = 0; i < 3; i++) { const sh = new THREE.Shape(); sh.moveTo(0, -0.004); sh.quadraticCurveTo(0.014, -0.008, 0.014, 0); sh.quadraticCurveTo(0.014, 0.008, 0, 0.004); const w = new THREE.Mesh(new THREE.ShapeGeometry(sh), wm); w.rotation.set(-Math.PI / 2, 0, i / 3 * TAU); w.position.y = 0.004; g.add(w); }
  g.traverse((x) => { x.userData.noHit = true; }); return g; }
// a mango stone (fibrous)
const stoneTexM = () => T.mstone || (T.mstone = tex(128, 128, (x) => { x.fillStyle = '#c9b48a'; x.fillRect(0, 0, 128, 128); x.strokeStyle = 'rgba(150,120,80,0.6)'; const r = rnd(9); for (let i = 0; i < 80; i++) { x.beginPath(); const y = r() * 128; x.moveTo(0, y); x.bezierCurveTo(40, y + (r() - 0.5) * 20, 80, y + (r() - 0.5) * 20, 128, y + (r() - 0.5) * 10); x.stroke(); } }));
export function mangoStone() { const g = new THREE.Group(); const m = new THREE.Mesh(new THREE.SphereGeometry(0.03, 20, 12).scale(1.4, 0.55, 0.9), new THREE.MeshStandardMaterial({ map: stoneTexM(), roughness: 0.9 })); m.position.y = 0.016; m.castShadow = true; m.userData.noHit = true; g.add(m); return g; }
// a hooked burr of gokhru (Xanthium): an oval covered with hooked spines
function burr() { const g = new THREE.Group(); const m = new THREE.MeshStandardMaterial({ color: 0x7a8a3a, roughness: 0.7 }); const b = new THREE.Mesh(new THREE.SphereGeometry(0.006, 10, 8).scale(1, 1, 1.8), m); g.add(b); const sp = new THREE.ConeGeometry(0.0007, 0.004, 4); sp.translate(0, 0.002, 0);
  const n = 22, im = new THREE.InstancedMesh(sp, m, n); const o = new THREE.Object3D(); for (let i = 0; i < n; i++) { const y = 1 - (i + 0.5) / n * 2, rr = Math.sqrt(1 - y * y), a = i * 2.4; const d = V(Math.cos(a) * rr, y, Math.sin(a) * rr); o.position.set(d.x * 0.006, d.y * 0.006, d.z * 0.0108); o.quaternion.setFromUnitVectors(V(0, 1, 0), d); o.updateMatrix(); im.setMatrixAt(i, o.matrix); } g.add(im); return g; }
export function seedField(o = {}) {
  const it = new Item('bseeds', { ...o, name: N3('Seeds in the wind, a tub of water, a gokhru bush', 'हवा में बीज, पानी का टब, गोखरू की झाड़ी', 'Hawa mein beej, paani ka tub, gokhru ki jhaadi') });
  const g = it.g, w_ = o.W || ((k) => k), r = rnd(37), ticks = []; const WIND = 1.6;
  // the post to hold seeds up, and pegs every metre downwind (to the right)
  const P0 = V(-0.35, 1.0, -0.8); const post = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.035, P0.y, 10), new THREE.MeshStandardMaterial({ map: woodTex('#7a5a3a', 5), roughness: 0.85 })); post.position.set(P0.x, P0.y / 2, P0.z); post.castShadow = true; g.add(post);
  const top = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.02, 0.16), new THREE.MeshStandardMaterial({ map: woodTex('#8a6a42', 9), roughness: 0.8 })); top.position.set(P0.x, P0.y - 0.01, P0.z); top.castShadow = true; g.add(top);
  const pegM = new THREE.MeshStandardMaterial({ map: woodTex('#9a7a4a', 15), roughness: 0.8 }); for (let d = 1; d <= 8; d++) { const pg = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.3, 0.03), pegM); pg.position.set(P0.x + d, 0.15, P0.z - 0.25); pg.castShadow = true; g.add(pg); const tg = tag(`${d} m`, '#ffffff', 0.06); tg.position.set(P0.x + d, 0.42, P0.z - 0.25); g.add(tg); }
  const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 8, 6).rotateZ(Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xe8dcc0, roughness: 0.9 })); rope.position.set(P0.x + 4, 0.02, P0.z - 0.25); g.add(rope);
  // a windsock on a pole, streaming to the right
  const SP = V(-1.2, 0, -1.6); const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.025, 1.9, 8), new THREE.MeshStandardMaterial({ color: 0xb0b4b8, roughness: 0.4, metalness: 0.6 })); pole.position.set(SP.x, 0.95, SP.z); g.add(pole);
  const sockT = tex(256, 64, (x) => { for (let i = 0; i < 5; i++) { x.fillStyle = i % 2 ? '#f2f2ee' : '#e8662a'; x.fillRect(i * 51.2, 0, 51.2, 64); } });
  const sockG = new THREE.CylinderGeometry(0.06, 0.03, 0.45, 16, 8, true); sockG.rotateZ(Math.PI / 2); sockG.translate(0.225, 0, 0); const s0 = sockG.attributes.position.array.slice();
  const sock = new THREE.Mesh(sockG, new THREE.MeshStandardMaterial({ map: sockT, roughness: 0.8, side: THREE.DoubleSide })); sock.position.set(SP.x + 0.02, 1.82, SP.z); g.add(sock);
  ticks.push((dt, t) => { const p = sockG.attributes.position; for (let i = 0; i < p.count; i++) { const x = s0[i * 3]; p.setY(i, s0[i * 3 + 1] + Math.sin(t * 9 + x * 14) * 0.006 * x * 4 - x * x * 0.08); p.setZ(i, s0[i * 3 + 2] + Math.sin(t * 7 + x * 11) * 0.005 * x * 4); } p.needsUpdate = true; });
  // a tub of water
  const TB = V(-1.25, 0, -0.75), TR = 0.3; const tub = lathe([[0, 0], [TR * 0.85, 0], [TR, 0.3], [TR + 0.015, 0.305], [TR + 0.012, 0.31], [TR - 0.006, 0.3], [TR * 0.85 - 0.006, 0.006], [0, 0.006]], steel(), 48); tub.position.copy(TB); g.add(tub);
  const tw = disc(TR * 0.97, waterM(0x8fb6c0, 0.55)); tw.position.copy(TB).add(V(0, 0.25, 0)); tw.renderOrder = 6; g.add(tw);
  // the gokhru bush with burrs, and a hare nearby
  const BP = V(0.75, 0, -0.95); const bush = ecoModel('weed_plant_02', { k: 1.3 }); bush.position.copy(BP); g.add(bush);
  const burrs = []; for (let i = 0; i < 12; i++) { const b = burr(); const a = r() * TAU, h = 0.12 + r() * 0.3; b.userData.home = V(BP.x + Math.cos(a) * (0.06 + r() * 0.12), h, BP.z + Math.sin(a) * (0.06 + r() * 0.12)); b.position.copy(b.userData.home); b.rotation.set(r() * 3, r() * 3, 0); g.add(b); burrs.push(b); }
  const sign = liveSign(0.11, 4.6); sign.position.set(0.6, 1.9, -1.6); g.add(sign); it.say = (l, c) => sign.set(l, c);
  const rings = [[spot(0.3), () => it.open === 'tub'], [spot(0.25), () => it.open === 'bush']]; rings[0][0].position.copy(TB).add(V(0, 0.33, 0)); rings[1][0].position.copy(BP).add(V(0, 0.05, 0)); rings.forEach(([m]) => g.add(m)); ticks.push(zoneRings(rings));
  it.at = { tub: () => TB.clone(), bush: () => BP.clone(), post: () => P0.clone() }; it.dist = {};
  // a seed let go at p (world) drifts with the wind as its terminal speed allows; it lands, and its distance is shown
  const vt = { aak: 0.28, wing: 1.1, stone: 6 };
  // where each seed landed: a small glowing ring on the grass and its distance
  const mark = (p, d) => { const m = spot(0.06, 0xffd23f); m.visible = true; m.position.set(p.x, 0.01, p.z); g.add(m); const tg = tag(`${d.toFixed(1)} m`, '#ffd23f', 0.05); tg.position.set(p.x, 0.16, p.z); g.add(tg); };
  it.fly = (th, kind, cb) => { th.flying = true; const p = th.g.position.clone(), x0 = p.x; let vy = 0, spin = 0; const step = (dt) => { const d = Math.min(0.033, dt);
      const v = vt[kind]; vy = Math.max(-v, vy - 9.8 * d); if (kind === 'stone') vy -= 0; const gust = 1 + 0.25 * Math.sin(performance.now() / 700 + x0);
      const drift = kind === 'stone' ? 0.08 : kind === 'wing' ? 0.85 : 1; p.x += WIND * gust * drift * d; p.y += vy * d; p.z += Math.sin(performance.now() / 500) * 0.03 * d; spin += d * (kind === 'wing' ? 25 : kind === 'aak' ? 0.5 : 0);
      th.g.position.copy(p); th.g.rotation.y = spin; if (kind === 'aak') th.g.rotation.z = Math.sin(spin * 3) * 0.2;
      if (p.y <= 0.004) { p.y = 0.004; th.g.position.copy(p); ticks.splice(ticks.indexOf(step), 1); th.flying = false; th.used = true; const dist = Math.max(0, p.x - x0); it.dist[kind] = dist; mark(p, dist); if (cb) cb(dist); } };
    ticks.push(step); };
  it.float = (th, cb) => { th.flying = true; flyTo(th, TB.clone().add(V(0.02, 0.36, 0.02)), 0, 0.6, () => { const p0 = th.g.position.clone(); let t = 0; th.used = true; const wl = TB.y + 0.25;
    // it plunges in, bobs up and floats with most of it under water (its husk is full of air), drifting a little
    const step = (dt) => { t += Math.min(0.05, dt); const bob = t < 0.35 ? lerp(p0.y, wl - 0.12, t / 0.35) : wl - 0.09 + Math.exp(-(t - 0.35) * 2) * 0.03 * Math.cos((t - 0.35) * 7) + Math.sin(t * 2.1) * 0.003;
      th.g.position.set(p0.x + Math.sin(t * 0.35) * 0.09, bob, p0.z + Math.sin(t * 0.27) * 0.05); th.g.rotation.z = Math.sin(t * 1.3) * 0.12; th.g.rotation.x = Math.sin(t * 0.9) * 0.08; };
    ticks.push(step); setTimeout(() => { if (cb) cb(); }, 1600); }); };
  // the hare carried through the bush: burrs hook into its fur; it hops away and the burrs drop off far from the bush
  it.brush = (hare, cb) => { hare.flying = true; const p0 = hare.g.position.clone(), via = BP.clone().add(V(-0.1, 0, 0.05)), far = V(4.2, 0, -2.6); const fur = burrs.filter((_, i) => i % 3 !== 0);
    it.play(5.5, (k) => { if (k < 0.25) hare.g.position.lerpVectors(p0, via, ease(k / 0.25)); else { const q = (k - 0.25) / 0.75; hare.g.position.lerpVectors(via, far, q); hare.g.position.y = Math.abs(Math.sin(q * 9 * Math.PI)) * 0.12; hare.g.rotation.y = Math.atan2(-(far.z - via.z), far.x - via.x) - Math.PI / 6; }
      fur.forEach((b, i) => { if (k > 0.2) { const off = V(-0.05 + (i % 4) * 0.035, 0.22 + (i % 3) * 0.04, -0.03 + (i % 2) * 0.06); const q = (k - 0.25) / 0.75; const drop = q > 0.55 + i * 0.05; if (!drop) b.position.copy(hare.g.position).add(off); else if (!b.userData.dropped) { b.userData.dropped = true; b.position.y = 0.006; } } }); },
    () => { hare.flying = false; hare.home.p.copy(hare.g.position); hare.used = true; it.dist.burr = far.x - BP.x; if (cb) cb(it.dist.burr); }); };
  animator(it); const up0 = it.update; it.update = (dt, t) => { up0(dt); const tt = t ?? performance.now() / 1000; for (const f of [...ticks]) f(dt || 0.016, tt); };
  it.views = { all: { p: V(0.2, 1.7, 1.1), t: V(0.8, 0.6, -1.4) }, post: { p: V(-0.7, 1.9, 1.3), t: V(2.6, 0.3, -1.2) }, tub: { p: V(-0.95, 1.3, 0.05), t: V(-1.25, 0.25, -0.75) }, bush: { p: V(0.4, 1.45, 0.8), t: V(1.9, 0.25, -1.6) } };
  it.say([w_('A steady breeze blows from the left')], '#ffffff');
  return done1(it, { height: 1.0, radius: 1.5 });
}
// each seed is taken in its own step and let go anywhere (it flies from there); the coconut goes in the tub; the hare
// is carried through the bush
export function bindSeeds(sf, th, app, s, done = {}) {
  for (const [k, item] of [['aak', th.aak], ['wing', th.wing], ['stone', th.stone]]) { carry(item, [], { lift: 0.05, free: (x, p) => { if (!stepNow(app, s[k]) || x.used) return false; x.placed = true; sf.fly(x, k, (d) => done.blown && done.blown(k, d)); return true; } }); }
  carry(th.coconut, [{ at: sf.at.tub, r: 0.32, open: () => stepNow(app, s.coconut) && !th.coconut.used, put: (x) => sf.float(x, done.float) }]);
  carry(th.hare, [{ at: sf.at.bush, r: 0.3, open: () => stepNow(app, s.hare) && !sf.busy && !th.hare.used, put: (x) => sf.brush(x, (d) => done.burr && done.burr(d)) }], { carryY: 0.45 });
  Object.defineProperty(sf, 'open', { configurable: true, get: () => (stepNow(app, s.coconut) ? 'tub' : stepNow(app, s.hare) ? 'bush' : null) });
}

// ------------------------------------------------------------------ Class 8: a bee carries pollen between sunflowers
// Five sunflowers stand in a field, their heads facing the student; one head is tied in a fine net bag. A bumblebee is
// carried by hand from flower to flower: it feeds, gets dusted with pollen, and leaves pollen on the next flower. Three
// weeks later only the flowers that got pollen from another plant are full of seeds.
const seedHeadTex = (fill) => tex(256, 256, (x) => { x.clearRect(0, 0, 256, 256); const r = rnd(Math.floor(fill * 100) + 3); const n = 700; for (let i = 0; i < n; i++) { const rr = Math.sqrt(i / n) * 122, a = i * 2.39996; const px = 128 + Math.cos(a) * rr, py = 128 + Math.sin(a) * rr; const full = r() < fill;
  x.save(); x.translate(px, py); x.rotate(a); x.fillStyle = full ? '#1d1a17' : '#d9cfae'; x.beginPath(); x.ellipse(0, 0, 3.6, 2.4, 0, 0, TAU); x.fill(); if (full) { x.strokeStyle = 'rgba(210,205,190,0.7)'; x.lineWidth = 0.7; x.beginPath(); x.moveTo(-3, -0.8); x.lineTo(3, -0.8); x.moveTo(-3, 0.8); x.lineTo(3, 0.8); x.stroke(); } x.restore(); } });
const netTex = () => T.net || (T.net = tex(128, 128, (x) => { x.clearRect(0, 0, 128, 128); x.strokeStyle = 'rgba(250,250,250,0.85)'; x.lineWidth = 1.2; for (let i = 0; i <= 128; i += 8) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, 128); x.stroke(); x.beginPath(); x.moveTo(0, i); x.lineTo(128, i); x.stroke(); } }, [6, 4]));
// drying, on the scanned flower head's own texture: its colours lose their brightness and turn brown (uDry 0 → 1)
function dryable(m) { const u = m.userData.dry = { value: 0 };
  m.onBeforeCompile = (sh) => { sh.uniforms.uDry = u; sh.fragmentShader = sh.fragmentShader.replace('void main() {', 'uniform float uDry;\nvoid main() {')
    .replace('#include <map_fragment>', '#include <map_fragment>\n{ float dL = dot(diffuseColor.rgb, vec3(0.3, 0.59, 0.11)); diffuseColor.rgb = mix(diffuseColor.rgb, vec3(dL * 1.08, dL * 0.7, dL * 0.38), uDry); }'); };
  m.customProgramCacheKey = () => 'sfdry'; }
export function sunflowerPatch(o = {}) {
  const it = new Item('bsunf', { ...o, name: N3('Sunflowers', 'सूरजमुखी के पौधे', 'Surajmukhi ke paudhe') });
  const g = it.g, w_ = o.W || ((k) => k), r = rnd(43), ticks = [];
  const plants = [[-1.0, -1.45, 1.42], [-0.5, -1.3, 1.55], [0.02, -1.35, 1.48], [0.52, -1.28, 1.6], [1.02, -1.45, 1.4]].map(([x, z, h], i) => {
    const stem = ecoModel('sunflower_stem', { h, face: [0, 1] }); stem.position.set(x, 0, z); g.add(stem);
    const hp = V(x + 0.13 / 14.8 * h, 13.31 / 14.8 * h, z + 2.315 / 14.8 * h + 0.03); const head = new THREE.Group(); head.position.copy(hp); g.add(head);
    const hm = ecoModel('sunflower_head', { len: 0.27, face: [0, 1], onLoad: (hold, m) => { m.traverse((x2) => { if (x2.isMesh) { x2.material = x2.material.clone(); dryable(x2.material); hold.userData.mats = (hold.userData.mats || []).concat(x2.material); } }); } }); hm.position.set(0, -0.125, 0); head.add(hm);
    const seeds = new THREE.Mesh(new THREE.CircleGeometry(0.068, 40), new THREE.MeshStandardMaterial({ transparent: true, opacity: 0, roughness: 0.8, depthWrite: false })); seeds.position.set(0, 0.026, 0.07); seeds.renderOrder = 6; head.add(seeds);
    const lab = tag(String(i + 1), '#ffffff', 0.05); lab.position.copy(hp).add(V(0, 0.2, 0)); g.add(lab);
    return { stem, head, hm, seeds, hp, f: 0, visits: 0, net: i === 2 }; });
  // the net bag over flower 3
  const net = new THREE.Mesh(new THREE.SphereGeometry(0.19, 24, 16), new THREE.MeshStandardMaterial({ map: netTex(), transparent: true, alphaTest: 0.2, side: THREE.DoubleSide, roughness: 0.9 })); net.scale.set(1, 1, 0.75); net.position.copy(plants[2].hp); g.add(net);
  const tie = new THREE.Mesh(new THREE.TorusGeometry(0.025, 0.004, 6, 16), new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.8 })); tie.rotation.x = Math.PI / 2; tie.position.copy(plants[2].hp).add(V(0, -0.17, -0.06)); g.add(tie);
  // pollen dust on the bee (yellow specks), shown with how much it carries
  const sign = liveSign(0.1, 4.6); sign.position.set(0, 2.05, -1.6); g.add(sign); it.say = (l, c) => sign.set(l, c);
  it.plants = plants; it.at = (i) => plants[i].hp.clone(); it.pollen = -1; it.log = [];
  animator(it); const up0 = it.update;
  // the bee lands on flower i, walks round its centre to feed, and flies up again
  it.visit = (bee, i, cb) => { if (it.busy) return false; const pl = plants[i]; it.camView = it.views.close(i); bee.flying = true; const p0 = bee.g.position.clone(), on = pl.hp.clone().add(V(0, 0, 0.035)), q0 = bee.g.quaternion.clone(), qOn = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2 * 0.85, 0, 0));
    if (pl.net) { it.play(1.6, (k) => { const e = ease(clamp01(k / 0.5)); bee.g.position.lerpVectors(p0, pl.hp.clone().add(V(0, 0, 0.22)), e); if (k > 0.5) bee.g.position.lerpVectors(pl.hp.clone().add(V(0, 0, 0.22)), p0, ease((k - 0.5) / 0.5)); }, () => { bee.flying = false; bee.placed = false; if (cb) cb('net'); }); return true; }
    it.play(3.2, (k) => { if (k < 0.3) { bee.g.position.lerpVectors(p0, on, ease(k / 0.3)); bee.g.quaternion.slerpQuaternions(q0, qOn, ease(k / 0.3)); } else if (k < 0.8) { const a = (k - 0.3) / 0.5 * TAU * 1.5; bee.g.position.copy(on).add(V(Math.cos(a) * 0.03, Math.sin(a) * 0.03, 0)); } else bee.g.position.copy(on).add(V(0, 0.04 * ease((k - 0.8) / 0.2), 0.08 * ease((k - 0.8) / 0.2))); },
      () => { const from = it.pollen; let res = 'feed'; if (from >= 0 && from !== i) { pl.f = Math.min(1, pl.f + 0.55); res = 'pollinate'; } else if (from === i) res = 'same'; it.pollen = i; pl.visits++; it.log.push([i, res]);
        bee.g.quaternion.copy(q0); bee.home.p.copy(bee.g.position); bee.home.q.copy(q0); bee.flying = false; bee.placed = false; bee.dust(1); if (cb) cb(res); }); return true; };
  // three weeks: petals dry and droop; a pollinated head fills with dark seeds, others stay pale and empty
  it.t = 0; it.tMax = 3; const dim = new THREE.Color(0x626262);
  // the seed layer lies just in front of the scanned head's disc: found once, by a ray from the front, before the head droops
  const rc = new THREE.Raycaster(); const seat = (pl) => { if (pl.dz != null) return; g.updateMatrixWorld(true); const from = g.localToWorld(pl.hp.clone().add(V(0, 0.026, 0.6))), dir = V(0, 0, -1).transformDirection(g.matrixWorld);
    rc.set(from, dir); const h = rc.intersectObject(pl.hm, true)[0]; pl.dz = h ? g.worldToLocal(h.point.clone()).z - pl.hp.z + 0.004 : 0.075; pl.seeds.position.z = pl.dz; };
  it.setT = (t) => { it.t = Math.max(0, Math.min(it.tMax, t)); const k = it.t / 3; plants.forEach((pl) => { if (!pl.tex) { seat(pl); pl.tex = seedHeadTex(Math.min(1, pl.f * 0.95 + 0.04)); pl.seeds.material.map = pl.tex; pl.seeds.material.needsUpdate = true; }
      pl.seeds.material.opacity = ease(clamp01((k - 0.2) / 0.6)); pl.head.rotation.x = 0.35 * ease(k); (pl.hm.userData.mats || []).forEach((m) => { if (!m.userData.c0) m.userData.c0 = m.color.clone(); m.color.copy(m.userData.c0).lerp(dim, 0.9 * ease(k)); if (m.userData.dry) m.userData.dry.value = 0.9 * ease(k); }); });
    net.position.copy(plants[2].hp); net.rotation.x = 0.35 * ease(k);
    it.say([`${w_('Week')} ${Math.round(it.t * 10) / 10}`, k > 0.6 ? plants.map((pl, i) => `${i + 1}: ${Math.round(Math.min(1, pl.f * 0.95 + 0.04) * 100)}%`).join(' · ') : w_('Petals drying, seeds forming')], ['#ffffff', '#ffd23f']); };
  it.knobPath = () => [V(-0.4, 0.95, -0.55), V(0.4, 0.95, -0.55)];
  it.update = (dt, t) => { up0(dt); const tt = t ?? performance.now() / 1000; for (const f of ticks) f(dt || 0.016, tt); };
  it.views = { all: { p: V(0, 1.45, 0.75), t: V(0, 1.25, -1.35) }, heads: { p: V(0, 1.38, 0.2), t: V(0, 1.32, -1.35) }, close: (i) => ({ p: plants[i].hp.clone().add(V(0.08, 0.06, 0.72)), t: plants[i].hp.clone() }) };
  it.say([w_('Sunflowers in bloom')], '#ffffff');
  return done1(it, { height: 1.6, radius: 1.3 });
}
// a bumblebee that hovers by itself, carried by hand to a flower; dust(k) shows pollen on it
export function beeThing(org) { const m = org.model; const dust = new THREE.InstancedMesh(new THREE.SphereGeometry(0.0009, 5, 4), new THREE.MeshStandardMaterial({ color: 0xf2c230, roughness: 0.8 }), 30); const o = new THREE.Object3D(); const r = rnd(4);
  for (let i = 0; i < 30; i++) { o.position.set((r() - 0.5) * 0.012, 0.004 + r() * 0.006, (r() - 0.5) * 0.016); o.updateMatrix(); dust.setMatrixAt(i, o.matrix); } dust.count = 0; dust.userData.noHit = true; m.add(dust);
  org.dust = (k) => { dust.count = Math.round(30 * clamp01(k)); }; const u0 = org.update; let t = 0; org.update = (dt, tt) => { u0(dt, tt); t += dt || 0.016; if (org.held || org.flying || org.placed) return; m.position.y = Math.sin(t * 6) * 0.004; m.rotation.y = Math.sin(t * 0.8) * 0.4; }; return org; }
export function bindBees(sp, bee, app, s, done = {}) {
  carry(bee, sp.plants.map((pl, i) => ({ at: () => sp.at(i), r: 0.14, open: () => !sp.busy && (stepNow(app, s.v1) || stepNow(app, s.v2) || stepNow(app, s.net) || stepNow(app, s.v3)), put: (x) => sp.visit(x, i, (res) => done.visit && done.visit(i, res)) })), { carryY: 1.35 });
}

// ------------------------------------------------------------------ Class 8: plants hold the soil (a forest slope)
// Two plots of soil on a forest slope, side by side, each with grass, ferns and bushes; two old stumps on the right one.
// The student pulls every plant out of the right plot, as when a forest is cleared. Then an hour of heavy rain: the
// runoff from each plot runs into a bucket at its foot.
const plotTex = () => T.plot || (T.plot = tex(512, 512, (x) => { x.fillStyle = '#5a412a'; x.fillRect(0, 0, 512, 512); const r = rnd(73); for (let i = 0; i < 4000; i++) { const v = r(); x.fillStyle = v < 0.4 ? 'rgba(40,28,16,0.4)' : v < 0.8 ? 'rgba(120,95,65,0.3)' : 'rgba(160,150,130,0.5)'; x.beginPath(); x.arc(r() * 512, r() * 512, 1 + r() * (v > 0.95 ? 5 : 2.4), 0, TAU); x.fill(); }
  x.fillStyle = 'rgba(90,70,40,0.5)'; for (let i = 0; i < 160; i++) { x.save(); x.translate(r() * 512, r() * 512); x.rotate(r() * TAU); x.fillRect(-6, -1, 12, 2); x.restore(); } }, [1.5, 2.5]));
const gullyTex = () => T.gully || (T.gully = tex(256, 512, (x) => { x.clearRect(0, 0, 256, 512); const r = rnd(7); for (let k = 0; k < 7; k++) { let px0 = 20 + r() * 216; const pts = []; let px = px0; for (let y = 0; y <= 512; y += 16) { px += (r() - 0.5) * 14; pts.push([px, y]); }
    for (const [w, a] of [[3.2, 0.18], [2.2, 0.25], [1.4, 0.35], [0.7, 0.5]]) { x.strokeStyle = `rgba(48,30,16,${a})`; x.lineCap = 'round'; x.lineJoin = 'round'; x.beginPath(); pts.forEach(([qx, qy], i) => { x.lineWidth = (2 + qy / 512 * 9) * w; if (i) x.lineTo(qx, qy); else x.moveTo(qx, qy); }); x.stroke(); } }
  x.fillStyle = 'rgba(150,120,80,0.35)'; for (let i = 0; i < 300; i++) x.fillRect(r() * 256, r() * 512, 3, 3); }));
const flowTex = () => T.flow || (T.flow = tex(128, 256, (x) => { x.clearRect(0, 0, 128, 256); const r = rnd(5); for (let i = 0; i < 120; i++) { x.strokeStyle = `rgba(255,255,255,${0.2 + r() * 0.4})`; x.lineWidth = 1 + r() * 2; const px = r() * 128, py = r() * 256; x.beginPath(); x.moveTo(px, py); x.lineTo(px + (r() - 0.5) * 6, py + 10 + r() * 30); x.stroke(); } }, [2, 2]));
export const SLOPE = { z0: -0.95, z1: -2.45, y0: 0.12, y1: 0.85, W: 0.8 };
export function slopePlots(o = {}) {
  const it = new Item('bslope', { ...o, name: N3('Two plots on a slope', 'ढलान पर दो क्यारियाँ', 'Dhalaan par do kyaariyan') });
  const g = it.g, w_ = o.W || ((k) => k), r = rnd(91), ticks = []; const { z0, z1, y0, y1, W } = SLOPE;
  const yAt = (z) => lerp(y0, y1, (z0 - z) / (z0 - z1)); const slopeA = Math.atan2(y1 - y0, z0 - z1), L = Math.hypot(y1 - y0, z0 - z1);
  const plot = (cx) => { const geo = new THREE.PlaneGeometry(W, L, 16, 30); const p = geo.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, (Math.sin(p.getX(i) * 13 + p.getY(i) * 7) * 0.008 + Math.sin(p.getY(i) * 21) * 0.006)); geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: plotTex(), roughness: 1 })); m.rotation.x = -Math.PI / 2 + slopeA; m.position.set(cx, (y0 + y1) / 2, (z0 + z1) / 2); m.receiveShadow = true; g.add(m);
    // the earth bank under the plot (sides and front), and wooden boards along its edges
    const sideM = new THREE.MeshStandardMaterial({ map: plotTex(), color: 0x8a7050, roughness: 1 }); const front = new THREE.Mesh(new THREE.BoxGeometry(W, y0, 0.02), sideM); front.position.set(cx, y0 / 2, z0); g.add(front);
    for (const sx of [-1, 1]) { const sh = new THREE.Shape(); sh.moveTo(z0, 0); sh.lineTo(z1, 0); sh.lineTo(z1, y1); sh.lineTo(z0, y0); sh.closePath(); const sg = new THREE.ExtrudeGeometry(sh, { depth: 0.02, bevelEnabled: false }); sg.rotateY(-Math.PI / 2); const sm = new THREE.Mesh(sg, sideM); sm.position.set(cx + sx * W / 2 + (sx > 0 ? 0.02 : 0), 0, 0); g.add(sm);
      const bd = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.07, L + 0.04), new THREE.MeshStandardMaterial({ map: woodTex('#6a4a2a', 3), roughness: 0.85 })); bd.rotation.x = slopeA; bd.position.set(cx + sx * (W / 2 + 0.012), (y0 + y1) / 2 + 0.025, (z0 + z1) / 2); bd.castShadow = true; g.add(bd); }
    return m; };
  const plots = [plot(-0.5), plot(0.5)];
  const gully = new THREE.Mesh(new THREE.PlaneGeometry(W * 0.96, L * 0.98), new THREE.MeshStandardMaterial({ map: gullyTex(), transparent: true, opacity: 0, depthWrite: false, roughness: 1 })); gully.rotation.x = -Math.PI / 2 + slopeA; gully.position.set(0.5, (y0 + y1) / 2 + 0.012, (z0 + z1) / 2); gully.renderOrder = 3; g.add(gully);
  const flows = [-0.5, 0.5].map((cx) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(W * 0.94, L * 0.98), new THREE.MeshStandardMaterial({ map: flowTex(), color: 0xffffff, transparent: true, opacity: 0, depthWrite: false, roughness: 0.1 })); m.rotation.x = -Math.PI / 2 + slopeA; m.position.set(cx, (y0 + y1) / 2 + 0.02, (z0 + z1) / 2); m.renderOrder = 4; g.add(m); return m; });
  // the plants of the left plot (they stay); the right plot's plants are separate things the student pulls out
  const spotsL = []; for (let i = 0; i < 16; i++) { const z = z0 - 0.12 - (i % 6) * 0.24 - r() * 0.08, x = -0.5 + ((i * 0.37) % 1 - 0.5) * (W - 0.16); spotsL.push([x, z]); const nm = i % 3 === 0 ? 'fern_02' : 'grass_medium_02'; const m = ecoModel(nm, { k: nm === 'fern_02' ? 0.45 : 0.8 + r() * 0.3, face: [r() - 0.5, r() - 0.5] }); m.position.set(x, yAt(z) - 0.01, z); g.add(m); }
  for (const z of [-1.6, -2.15]) { const st = ecoModel('tree_stump_01', { k: 0.22, face: [r() - 0.5, 1] }); st.position.set(0.5 + (z < -2 ? 0.2 : -0.18), yAt(z) - 0.02, z); g.add(st); }
  // two trees still standing on the left plot (behind), a fallen trunk by the right one
  const log = ecoModel('dead_tree_trunk', { k: 0.5 }); log.position.set(1.35, 0, -1.7); log.rotation.y = 1.3; g.add(log);
  // buckets at the foot of each plot
  const BKT = [V(-0.5, 0, -0.76), V(0.5, 0, -0.76)], BH = 0.11; const buckets = BKT.map((p) => { const b = lathe([[0, 0], [0.14, 0], [0.17, BH], [0.176, BH + 0.004], [0.168, BH + 0.004], [0.135, 0.006], [0, 0.006]], new THREE.MeshStandardMaterial({ color: 0x3f6fa8, roughness: 0.45 }), 32); b.position.copy(p); g.add(b);
    const w = disc(1, new THREE.MeshStandardMaterial({ color: 0x8a6a44, roughness: 0.75, transparent: true, opacity: 0.92, envMapIntensity: 0.15 })); w.visible = false; g.add(w); const mudL = disc(1, new THREE.MeshStandardMaterial({ color: 0x4a3420, roughness: 1 })); mudL.visible = false; g.add(mudL); return { p, w, mudL, lvl: 0, mud: 0 }; });
  const setBucket = (b, lvl, mud, muddy) => { b.w.visible = lvl > 0.002; const y = 0.006 + lvl; b.w.position.copy(b.p).add(V(0, y, 0)); b.w.scale.setScalar(0.135 + 0.035 * y / BH); b.w.material.color.set(muddy > 0.5 ? 0x6a4a2a : 0x9a8c6c); b.w.material.opacity = 0.7 + 0.25 * muddy;
    b.mudL.visible = mud > 0.002; b.mudL.position.copy(b.p).add(V(0, 0.006 + mud, 0)); b.mudL.scale.setScalar(0.135 + 0.035 * mud / BH); };
  // rain: falling streaks over both plots
  const NR = 500, rp = new Float32Array(NR * 6); for (let i = 0; i < NR; i++) { const x = (r() - 0.5) * 2.2, y = r() * 2.6, z = -0.8 - r() * 2.0; rp.set([x, y, z, x - 0.01, y - 0.08, z], i * 6); }
  const rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.BufferAttribute(rp, 3)); const rain = new THREE.LineSegments(rg, new THREE.LineBasicMaterial({ color: 0xcfdbe6, transparent: true, opacity: 0.55 })); rain.visible = false; rain.frustumCulled = false; g.add(rain);
  ticks.push((dt) => { if (!rain.visible) return; const p = rg.attributes.position; for (let i = 0; i < NR; i++) { let y = p.getY(i * 2) - dt * 6; if (y < 0) y += 2.6; p.setY(i * 2, y); p.setY(i * 2 + 1, y - 0.08); } p.needsUpdate = true; flows.forEach((f) => { f.material.map.offset.y -= dt * 0.8; }); });
  const sign = liveSign(0.1, 4.6); sign.position.set(0, 1.75, -2.2); g.add(sign); it.say = (l, c) => sign.set(l, c);
  it.cleared = 0; it.nPlants = 1; it.t = 0; it.tMax = 1;
  // one hour of heavy rain: runoff and soil carried depend on how much of the right plot is bare
  it.setT = (t) => { it.t = Math.max(0, Math.min(it.tMax, t)); const k = it.t, bare = clamp01(it.cleared / it.nPlants); rain.visible = k > 0 && k < 1; flows[0].material.opacity = rain.visible ? 0.12 : 0; flows[1].material.opacity = rain.visible ? 0.12 + 0.35 * bare : 0; flows[1].material.color.set(bare > 0.3 ? 0xa07a50 : 0xffffff);
    gully.material.opacity = 0.9 * bare * ease(k); buckets[0].lvl = 0.015 * k; buckets[0].mud = 0.001 * k; buckets[1].lvl = (0.015 + 0.075 * bare) * k; buckets[1].mud = (0.001 + 0.025 * bare) * k; setBucket(buckets[0], buckets[0].lvl, buckets[0].mud, 0.1); setBucket(buckets[1], buckets[1].lvl, buckets[1].mud, bare);
    it.say([`${w_('Rain')}: ${Math.round(k * 60)} ${w_('minutes')}`, `${w_('Left bucket')}: ${Math.round(buckets[0].lvl * 100)} cm · ${w_('Right bucket')}: ${Math.round(buckets[1].lvl * 100)} cm`], ['#ffffff', '#ffd23f']); };
  it.yAt = yAt; it.views = { all: { p: V(0, 1.75, 0.75), t: V(0, 0.45, -1.7) }, right: { p: V(0.55, 1.55, 0.2), t: V(0.5, 0.45, -1.6) }, buckets: { p: V(0, 1.0, -0.05), t: V(0, 0.05, -0.78) } };
  it.knobPath = () => [V(-0.45, 0.95, -0.4), V(0.45, 0.95, -0.4)];
  animator(it); const up0 = it.update; it.update = (dt, t) => { up0(dt); const tt = t ?? performance.now() / 1000; for (const f of ticks) f(dt || 0.016, tt); };
  it.say([w_('Two plots on a slope in the forest')], '#ffffff');
  return done1(it, { height: 0.8, radius: 1.3 });
}
// the right plot's plants: each is pulled out and dropped anywhere off the plot (it goes to a pile by the side)
export function bindSlope(sp, plants, app, s, done = {}) {
  sp.nPlants = plants.length; const pile = V(1.25, 0, -1.15);
  plants.forEach((pl) => carry(pl, [], { carryY: 0.9, free: (x, p) => { if (!stepNow(app, s.clear) || x.used) return false; const onPlot = Math.abs(p.x - 0.5) < 0.45 && p.z < -0.9 && p.z > -2.5; if (onPlot) return false;
    x.used = true; x.placed = true; const n = sp.cleared; flyTo(x, pile.clone().add(V((n % 3) * 0.12 - 0.12, 0.02 + Math.floor(n / 3) * 0.05, (n % 2) * 0.1)), Math.random() * 3, 0.6, () => { x.noGrab = true; }); sp.cleared++; if (done.pulled) done.pulled(sp.cleared, sp.nPlants); return true; } }));
}
// ---- end of part 4
