// DUET Science Lab 360, biology in real places, batch BW1: ecosystems. A village pond, a grassland at noon and a forest
// floor, each a real 360° photo (Poly Haven, CC0) with real 3D plants and animals in front of the student: scans of real
// specimens (fish, frog, snail, insects, birds; CC BY / CC BY-SA, credited in models/eco/credits.json) reduced, repainted
// where needed, posed, placed and animated here. Everything else (water, reeds, lilies, algae, leaves, worms, the boards)
// is drawn here. This file: the model library, the pond, the food-chain table and the pesticide test.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { clone as skClone } from 'three/addons/utils/SkeletonUtils.js';
import { Item } from './apparatus.js';
import { clamp01, ease } from './mathlab2.js';
import { pushKnob } from './mathworld3.js';
import { liveSign } from './mathworld4.js';
import { slideKnob } from './mathworld5.js';
import { tag, animator, woodTex, M, rnd, tex, noHit, stepNow, V, FONT } from './mathworld_j1.js';
import { BENCH_Y } from './room.js';
import { LITE } from './lite.js';

const TAU = Math.PI * 2;
const done1 = (it, o) => { noHit(it.g); it.noGrab = true; it.noPhys = true; it.base = 0; Object.assign(it, o); return it; };
const ang = (x, z) => Math.atan2(-z, x); // heading of (x, z) as a turn about y (0 = +x, the student's right)

// ------------------------------------------------------------------ the model library
// len: real length (longest side) in metres, or h: real height; head: where the head points in the file [x, z];
// clip: the scan comes with its own animation (fish swimming, turtle paddling)
export const ECO = {
  bluegill: { len: 0.16, head: [0, 1], clip: 1 }, bass: { len: 0.34, head: [0, 1], clip: 1 }, turtle: { len: 0.2, head: [0, 1], clip: 1 },
  frog: { len: 0.11, head: [-1, 0] }, kingfisher: { h: 0.24, head: [-1, 0] }, strider: { len: 0.05, head: [-1, 0] }, dragonfly: { len: 0.1, head: [-1, 0] },
  snail: { len: 0.045, head: [0, 1] }, locust: { len: 0.08, head: [1, 0] }, ratsnake: { len: 0.42, head: [0.7, 0.7] }, hawk: { h: 0.78, head: [0, 1] }, hawk_low: { h: 0.52, head: [0, 1] },
  hare: { h: 0.4, head: [-0.86, 0.5] }, owl: { h: 0.42, head: [1, 0] }, crow: { len: 0.5, head: [-0.7, -0.7] }, parasol: { h: 0.2, head: [0, 1] },
  birchfungus: { len: 0.32, head: [0, 1] }, beetle: { len: 0.05, head: [-1, 0] },
  // plants and wood (Poly Haven, CC0): already real size
  grass_medium_02: { raw: 1 }, grass_dry_01: { raw: 1 }, grass_dry_02: { raw: 1 }, fern_02: { raw: 1 }, dead_tree_trunk: { raw: 1 }, tree_stump_01: { raw: 1 },
  bark_debris_01: { raw: 1 }, dandelion_01: { raw: 1 }, weed_plant_02: { raw: 1 },
};
let GL = null; const CACHE = {};
const LO = new Set(['frog', 'snail', 'locust']); // models/eco/<name>_lo.glb exists
// Phones and headsets: grass and leaves (alpha-cut cards, many layers deep on screen) are drawn with plain Lambert shading
// and cast no shadow. Measured on a Snapdragon 680 in the grassland food web: 17 fps with the scans' PBR leaves,
// 42 with Lambert leaves, 60 without grass at all.
const LEAF = new Map();
function liteLeaf(o) {
  const m = o.material; if (!m || Array.isArray(m) || !m.isMeshStandardMaterial || !(m.alphaTest > 0)) return;
  let L = LEAF.get(m); if (!L) { L = new THREE.MeshLambertMaterial({ map: m.map, color: m.color, alphaTest: m.alphaTest, side: m.side, vertexColors: m.vertexColors }); L.name = m.name; LEAF.set(m, L); }
  o.material = L; o.castShadow = false;
}
export function ecoLoad(name) {
  if (!CACHE[name]) { GL ||= new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
    // phones and headsets: the scans that have a light copy load it (frog 171k → 25k triangles, snail 111k → 12k)
    CACHE[name] = GL.loadAsync('models/eco/' + (LITE && LO.has(name) ? name + '_lo' : name) + '.glb').then((g) => { g.scene.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; o.userData.noHit = true; if (o.material && o.material.map) o.material.map.anisotropy = 4; if (LITE) liteLeaf(o); } }); return g; }); }
  return CACHE[name];
}
export const ecoPreload = (names) => Promise.all(names.map((n) => ecoLoad(n).catch(() => null)));
// a holder that fills with the real model when it has loaded. o: { len | h (override), face: [x, z] direction to face,
// k: extra scale, play: run the scan's own animation, hit: the model can be picked (grab), onLoad(holder, model) }
const BOX0 = new Map(), UPY = new THREE.Vector3(0, 1, 0); // each model's exact box in its own frame (ecoModel)
export function ecoModel(name, o = {}) {
  const hold = new THREE.Group(); hold.name = 'eco-' + name; const S = ECO[name] || { raw: 1 };
  hold.userData.mixer = null; hold.tick = (dt) => { if (hold.userData.mixer) hold.userData.mixer.update(dt * (o.speed ?? 1)); };
  ecoLoad(name).then((g) => {
    let skinned = false; g.scene.traverse((m) => { if (m.isSkinnedMesh) skinned = true; });
    const m = skinned ? skClone(g.scene) : g.scene.clone(true);
    if (o.hit) m.traverse((x) => { if (x.isMesh) x.userData.noHit = false; });
    const turn = new THREE.Group(); turn.add(m); // sized and centred on its own (no parent yet), then put in the holder
    if (S.clip && o.play !== false && g.animations.length) { const mx = new THREE.AnimationMixer(m); const a = mx.clipAction(g.animations[0]); a.play(); a.time = Math.random() * a.getClip().duration; hold.userData.mixer = mx; mx.update(0); }
    if (!S.raw) {
      // The model's exact box is measured once per model, in its own frame (every vertex of a 12k–50k triangle scan, and
      // of a skinned one through its bones: on a phone that was 4–5 s for the grassland's frogs, snakes and grasshoppers).
      // The size comes from that unturned box (its true length / height); the turn and the centring follow from it.
      const head = S.head || [1, 0], face = o.face || [1, 0], th = ang(face[0], face[1]) - ang(head[0], head[1]);
      let b0 = BOX0.get(name); if (!b0) { turn.updateMatrixWorld(true); b0 = new THREE.Box3().setFromObject(turn, true); BOX0.set(name, b0); }
      const s = b0.getSize(new THREE.Vector3()), want = o.h ?? S.h, len = o.len ?? S.len;
      const k = (want ? want / Math.max(1e-6, s.y) : len / Math.max(1e-6, s.x, s.z)) * (o.k ?? 1);
      const c = b0.getCenter(new THREE.Vector3()).applyAxisAngle(UPY, th).multiplyScalar(k);
      turn.rotation.y = th; turn.scale.setScalar(k); turn.position.set(-c.x, -b0.min.y * k, -c.z);
    } else { if (o.k) turn.scale.setScalar(o.k); if (o.face) turn.rotation.y = ang(o.face[0], o.face[1]); }
    hold.add(turn); hold.userData.model = m; if (o.onLoad) o.onLoad(hold, m);
  }).catch((e) => console.warn('eco model', name, e));
  return hold;
}
const bbox = (o) => { o.updateMatrixWorld(true); return new THREE.Box3().setFromObject(o, true); };

// ------------------------------------------------------------------ textures drawn here
const T = {};
const waterNormal = () => T.wn || (T.wn = (() => { const t = new THREE.CanvasTexture((() => { const C = document.createElement('canvas'); C.width = C.height = 256; const x = C.getContext('2d'); const im = x.createImageData(256, 256); const r = rnd(11);
  const waves = Array.from({ length: 14 }, () => [r() * TAU, 2 + Math.floor(r() * 6), 2 + Math.floor(r() * 6), 0.5 + r()]);
  for (let j = 0; j < 256; j++) for (let i = 0; i < 256; i++) { let dx = 0, dy = 0; for (const [p, a, b, s] of waves) { const ph = (a * i + b * j) / 256 * TAU + p; dx += Math.cos(ph) * a * s; dy += Math.cos(ph) * b * s; }
    const k = (j * 256 + i) * 4; im.data[k] = 128 + dx * 2.2; im.data[k + 1] = 128 + dy * 2.2; im.data[k + 2] = 255; im.data[k + 3] = 255; }
  x.putImageData(im, 0, 0); return C; })()); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(5, 5); return t; })());
const mudTex = () => T.mud || (T.mud = tex(256, 256, (x) => { const r = rnd(5); x.fillStyle = '#4a3d2a'; x.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 2600; i++) { const v = r(); x.fillStyle = v < 0.4 ? 'rgba(30,24,16,0.35)' : v < 0.8 ? 'rgba(110,95,70,0.3)' : 'rgba(150,140,120,0.45)'; const s = 1 + r() * (v > 0.95 ? 6 : 2.5); x.beginPath(); x.arc(r() * 256, r() * 256, s, 0, TAU); x.fill(); } }, [4, 4]));
// a muddy, grassy bank that fades into the photo's ground
const bankTex = () => T.bank || (T.bank = tex(512, 512, (x) => { const g = x.createRadialGradient(256, 256, 150, 256, 256, 256); g.addColorStop(0, 'rgba(58,48,32,1)'); g.addColorStop(0.55, 'rgba(78,70,44,0.95)'); g.addColorStop(0.8, 'rgba(88,92,52,0.55)'); g.addColorStop(1, 'rgba(90,100,60,0)'); x.fillStyle = g; x.fillRect(0, 0, 512, 512);
  const r = rnd(9); for (let i = 0; i < 2600; i++) { const a = r() * TAU, d = 170 + r() * 86; x.strokeStyle = `rgba(${60 + r() * 40},${80 + r() * 50},${30 + r() * 20},${0.5 * (1 - (d - 170) / 86)})`; x.lineWidth = 1 + r(); const px = 256 + Math.cos(a) * d, py = 256 + Math.sin(a) * d; x.beginPath(); x.moveTo(px, py); x.lineTo(px + (r() - 0.5) * 6, py - 4 - r() * 8); x.stroke(); } }));
const lilyTex = () => T.lily || (T.lily = tex(256, 256, (x) => { x.clearRect(0, 0, 256, 256); const g = x.createRadialGradient(128, 128, 10, 128, 128, 124); g.addColorStop(0, '#5d8f3a'); g.addColorStop(0.7, '#3f7a2e'); g.addColorStop(1, '#2f5f24'); x.fillStyle = g;
  x.beginPath(); x.moveTo(128, 128); x.arc(128, 128, 122, 0.12, TAU - 0.12); x.closePath(); x.fill(); x.strokeStyle = 'rgba(190,220,140,0.35)'; x.lineWidth = 2; for (let i = 0; i < 18; i++) { const a = 0.3 + i / 18 * (TAU - 0.6); x.beginPath(); x.moveTo(128, 128); x.lineTo(128 + Math.cos(a) * 118, 128 + Math.sin(a) * 118); x.stroke(); }
  x.strokeStyle = 'rgba(120,60,40,0.5)'; x.lineWidth = 4; x.beginPath(); x.arc(128, 128, 121, 0.12, TAU - 0.12); x.stroke(); }));
const scumTex = () => T.scum || (T.scum = tex(256, 256, (x) => { x.clearRect(0, 0, 256, 256); const r = rnd(21); for (let i = 0; i < 1800; i++) { const a = r() * TAU, d = Math.pow(r(), 0.7) * 118; x.fillStyle = `rgba(${70 + r() * 60},${130 + r() * 70},${30 + r() * 30},${0.35 + r() * 0.4})`; x.beginPath(); x.arc(128 + Math.cos(a) * d, 128 + Math.sin(a) * d, 2 + r() * 6, 0, TAU); x.fill(); } }));
// what the algae look like through a hand lens: Spirogyra, green threads with spiral bands
const spiroTex = () => T.spiro || (T.spiro = tex(512, 512, (x) => { const g = x.createRadialGradient(256, 256, 60, 256, 256, 256); g.addColorStop(0, '#f2f7e6'); g.addColorStop(0.92, '#dfe9c8'); g.addColorStop(1, 'rgba(40,40,40,1)'); x.fillStyle = g; x.beginPath(); x.arc(256, 256, 252, 0, TAU); x.fill(); x.save(); x.beginPath(); x.arc(256, 256, 244, 0, TAU); x.clip();
  const r = rnd(4); for (let f = 0; f < 5; f++) { const y0 = 70 + f * 92 + r() * 30, a = (r() - 0.5) * 0.5; x.save(); x.translate(256, y0); x.rotate(a); x.fillStyle = 'rgba(190,220,150,0.55)'; x.fillRect(-300, -20, 600, 40); x.strokeStyle = 'rgba(80,120,50,0.6)'; x.lineWidth = 2; x.strokeRect(-300, -20, 600, 40);
    for (let c = -300; c < 300; c += 64) { x.beginPath(); x.moveTo(c, -20); x.lineTo(c, 20); x.stroke(); } x.strokeStyle = '#2f8a2a'; x.lineWidth = 5; x.beginPath(); for (let s = -300; s < 300; s += 2) { const yy = Math.sin(s / 14) * 15; s === -300 ? x.moveTo(s, yy) : x.lineTo(s, yy); } x.stroke(); x.restore(); } x.restore();
  x.strokeStyle = '#2a2a2a'; x.lineWidth = 10; x.beginPath(); x.arc(256, 256, 250, 0, TAU); x.stroke(); }));
const signMat = (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.7 });

// ------------------------------------------------------------------ a village pond, real size
// A pond 3.8 m across lies just beyond the table: muddy bank, clear green water with ripples, reeds, lily pads and two
// water lilies. In it live algae, snails, small fish and a big fish, a pond turtle on a log, a water strider on the
// surface, a dragonfly over the reeds, a toad on the bank and a kingfisher on its perch.
export const POND = { c: V(0, 0, -3.3), R: 1.9, wy: -0.05 };
export function pondScene(o = {}) {
  const it = new Item('bpond', { ...o, name: { en: 'Village pond', hi: 'गाँव का तालाब', hg: 'Gaon ka talaab' } });
  const g = it.g, { c, R, wy } = POND, r = rnd(17), ticks = [];
  // bank and bowl (the place's ground does not hide what is below it here)
  const bank = new THREE.Mesh(new THREE.CircleGeometry(R * 1.35, 64).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: bankTex(), transparent: true, roughness: 1, depthWrite: false }));
  bank.position.set(c.x, 0.004, c.z); bank.renderOrder = -2; bank.receiveShadow = true; g.add(bank);
  const prof = []; for (let i = 0; i <= 14; i++) { const k = i / 14; prof.push(new THREE.Vector2(R * (0.15 + 0.85 * Math.sin(k * Math.PI / 2)), -0.55 * (1 - k) + 0.0)); }
  const bowl = new THREE.Mesh(new THREE.LatheGeometry(prof, 64), new THREE.MeshStandardMaterial({ map: mudTex(), roughness: 1, side: THREE.BackSide })); bowl.position.copy(c); bowl.receiveShadow = true; g.add(bowl);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(R * 0.16, 24).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: mudTex(), roughness: 1 })); floor.position.set(c.x, -0.549, c.z); g.add(floor);
  // stones on the bottom and the bank
  const stoneM = new THREE.MeshStandardMaterial({ color: 0x77705f, roughness: 0.9 });
  for (let i = 0; i < 22; i++) { const a = r() * TAU, d = R * (0.3 + r() * 0.75), s = 0.04 + r() * 0.09; const st = new THREE.Mesh(new THREE.DodecahedronGeometry(s, 0), stoneM); st.scale.set(1, 0.5 + r() * 0.3, 1 + r() * 0.4); const dd = Math.min(1, d / R); st.position.set(c.x + Math.cos(a) * d, -0.55 * (1 - Math.sin(Math.acos(1 - dd) || 0)) * 0.9 + s * 0.2, c.z + Math.sin(a) * d); st.rotation.y = r() * TAU; st.castShadow = st.receiveShadow = true; g.add(st); }
  // water: a clear green surface with moving ripples
  const wn = waterNormal();
  const water = new THREE.Mesh(new THREE.CircleGeometry(R * 0.99, 64).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x3f6b55, roughness: 0.06, metalness: 0.1, transparent: true, opacity: 0.62, normalMap: wn, normalScale: new THREE.Vector2(0.35, 0.35), envMapIntensity: 1.3, depthWrite: false }));
  water.position.set(c.x, wy, c.z); water.renderOrder = 5; g.add(water); it.water = water;
  const tint = new THREE.Mesh(new THREE.CircleGeometry(R * 0.985, 64).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x2c4a2a, transparent: true, opacity: 0.18, depthWrite: false })); tint.position.set(c.x, wy - 0.08, c.z); tint.renderOrder = 4; g.add(tint);
  ticks.push((dt, t) => { wn.offset.set(t * 0.012, t * 0.007); });
  // reeds along the far side and the edges (one merged mesh)
  const blades = []; for (let i = 0; i < 260; i++) { const a = Math.PI * (1.05 + r() * 0.9), d = R * (0.92 + r() * 0.16), h = 0.6 + r() * 0.9, w = 0.008 + r() * 0.006;
    const bg = new THREE.ConeGeometry(w, h, 4, 1, true); bg.translate(0, h / 2, 0); const m4 = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler((r() - 0.5) * 0.3, r() * TAU, (r() - 0.5) * 0.3)); m4.setPosition(c.x + Math.cos(a) * d, wy, c.z + Math.sin(a) * d); bg.applyMatrix4(m4); blades.push(bg); }
  const reedG = mergeGeoms(blades); const reedCol = []; { const n = reedG.attributes.position.count, cols = new Float32Array(n * 3); for (let i = 0; i < n; i++) { const y = reedG.attributes.position.getY(i) - wy, k = clamp01(y / 1.4); cols[i * 3] = 0.25 + 0.35 * k; cols[i * 3 + 1] = 0.38 + 0.18 * k; cols[i * 3 + 2] = 0.12 + 0.05 * k; } reedG.setAttribute('color', new THREE.BufferAttribute(cols, 3)); void reedCol; }
  const reeds = new THREE.Mesh(reedG, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8, side: THREE.DoubleSide })); reeds.castShadow = true; g.add(reeds);
  // lily pads and water lilies
  const lilyM = new THREE.MeshStandardMaterial({ map: lilyTex(), transparent: true, alphaTest: 0.5, roughness: 0.45, side: THREE.DoubleSide });
  const pads = []; for (let i = 0; i < 11; i++) { const a = r() * TAU, d = R * (0.25 + r() * 0.6), s = 0.11 + r() * 0.1; const p = new THREE.Mesh(new THREE.PlaneGeometry(s * 2, s * 2).rotateX(-Math.PI / 2), lilyM); p.position.set(c.x + Math.cos(a) * d, wy + 0.004, c.z + Math.sin(a) * d * 0.9); p.rotation.y = r() * TAU; p.receiveShadow = true; g.add(p); pads.push(p); }
  const snailPad = pads[0]; snailPad.position.set(0.32, wy + 0.004, POND.c.z + R * 0.78); snailPad.scale.setScalar(1.25);
  const petal = new THREE.MeshStandardMaterial({ color: 0xf4c6d8, roughness: 0.5, side: THREE.DoubleSide }), heart = new THREE.MeshStandardMaterial({ color: 0xf2c230, roughness: 0.5, emissive: 0x3a2a00 });
  [[0.75, -2.7], [-0.55, -3.9]].forEach(([x, z]) => { const fl = new THREE.Group(); for (let i = 0; i < 14; i++) { const pg = new THREE.SphereGeometry(0.045, 8, 6); pg.scale(0.45, 0.18, 1); pg.translate(0, 0, 0.04); const pm = new THREE.Mesh(pg, petal); pm.rotation.y = i / 14 * TAU * (i < 7 ? 1 : 1) + (i >= 7 ? 0.22 : 0); pm.rotation.x = i < 7 ? -0.45 : -0.9; pm.position.y = i < 7 ? 0.015 : 0.03; fl.add(pm); }
    const hh = new THREE.Mesh(new THREE.SphereGeometry(0.018, 10, 8), heart); hh.position.y = 0.035; fl.add(hh); fl.position.set(x, wy, z); g.add(fl); const pad = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.4).rotateX(-Math.PI / 2), lilyM); pad.position.set(x + 0.08, wy + 0.003, z + 0.05); g.add(pad); });
  // green algae on the water near the bank
  const scumM = new THREE.MeshStandardMaterial({ map: scumTex(), transparent: true, roughness: 0.8, depthWrite: false });
  [[-0.9, -1.75, 0.35], [-1.25, -2.5, 0.45], [1.1, -2.1, 0.3], [0.4, -4.1, 0.5]].forEach(([x, z, s]) => { const sc = new THREE.Mesh(new THREE.PlaneGeometry(s * 2, s * 1.4).rotateX(-Math.PI / 2), scumM); sc.position.set(x, wy + 0.002, z); sc.rotation.y = r() * TAU; sc.renderOrder = 6; g.add(sc); });
  // green grass along the bank (real scanned clumps)
  for (let i = 0; i < 14; i++) { const a = Math.PI * (0.05 + r() * 0.9) * (i % 2 ? 1 : -1) + Math.PI, d = R * (1.06 + r() * 0.2); const gm = ecoModel('grass_medium_02', { k: 1 + r() * 0.6, face: [r() - 0.5, r() - 0.5] }); gm.position.set(c.x + Math.cos(a) * d, 0, c.z + Math.sin(a) * d); g.add(gm); }
  // life in and around the pond (looks only; the ones to pick up are separate items)
  const life = (name, x, y, z, face, o2 = {}) => { const m = ecoModel(name, { face, ...o2 }); m.position.set(x, y, z); g.add(m); ticks.push((dt) => m.tick(dt)); return m; };
  const log = life('dead_tree_trunk', -1.25, wy - 0.06, -2.8, null, { k: 0.75 }); log.rotation.set(0, 0.6, 0.05);
  life('turtle', -1.05, wy + 0.12, -2.95, [1, 0.3], { speed: 0.3 });
  { const st = noHit(new THREE.Mesh(new THREE.DodecahedronGeometry(0.09, 0), stoneM)); st.scale.set(1.3, 0.45, 1); st.position.set(-1.55, 0.015, -1.55); st.castShadow = st.receiveShadow = true; g.add(st); life('frog', -1.55, 0.05, -1.55, [0.6, 0.8]); }
  const strider = life('strider', -0.25, wy + 0.004, -2.45, [1, 0.2]);
  const fly = life('dragonfly', 0.9, 0.55, -2.2, [-1, 0.2]);
  // fish deeper in the pond: two small fish and one big fish swimming round
  const swimmers = [['bluegill', 0.3, -3.5, 0.75, 0.45, -0.28, 0.5], ['bluegill', -0.2, -3.0, 0.5, 0.4, -0.22, -0.65], ['bass', 0.1, -3.4, 1.05, 0.6, -0.36, 0.32]].map(([n, x, z, rx, rz, y, w]) => { const m = ecoModel(n, { face: [1, 0] }); g.add(m); return { m, x, z, rx, rz, y, w, p: r() * TAU }; });
  ticks.push((dt, t) => { for (const s of swimmers) { s.p += dt * s.w; const px = s.x + Math.cos(s.p) * s.rx, pz = s.z + Math.sin(s.p) * s.rz; const tx = -Math.sin(s.p) * s.rx * Math.sign(s.w), tz = Math.cos(s.p) * s.rz * Math.sign(s.w); s.m.position.set(px, s.y + Math.sin(t * 1.3 + s.p) * 0.02, pz); s.m.rotation.y = ang(tx, tz); s.m.tick(dt); } });
  ticks.push((dt, t) => { strider.position.x = -0.25 + Math.sin(t * 0.4) * 0.25; strider.position.z = -2.45 + Math.sin(t * 0.27) * 0.15; strider.rotation.y = Math.sin(t * 0.4) > 0 ? 0 : Math.PI;
    fly.position.set(0.9 + Math.sin(t * 0.7) * 0.5, 0.5 + Math.sin(t * 2.3) * 0.06 + Math.sin(t * 0.5) * 0.1, -2.3 + Math.sin(t * 0.9) * 0.35); fly.rotation.y = Math.cos(t * 0.7) > 0 ? 0 : Math.PI; });
  // the kingfisher's perch: a bamboo post on the right bank
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.95, 10), new THREE.MeshStandardMaterial({ color: 0x8a7a52, roughness: 0.8 })); post.position.set(1.55, 0.475, -1.55); post.castShadow = true; g.add(post);
  for (let k = 1; k < 4; k++) { const ring = new THREE.Mesh(new THREE.TorusGeometry(0.027, 0.004, 6, 16), new THREE.MeshStandardMaterial({ color: 0x6a5a3a, roughness: 0.8 })); ring.rotation.x = Math.PI / 2; ring.position.set(1.55, k * 0.24, -1.55); g.add(ring); }
  it.snailPad = snailPad; it.perch = V(1.55, 0.95, -1.55);
  it.update = (dt, t) => { const tt = t ?? performance.now() / 1000; for (const f of ticks) f(dt || 0.016, tt); };
  return done1(it, { height: 0.5, radius: 2.5, deep: true });
}
function mergeGeoms(list) { // non-indexed merge of position + normal (enough for reeds and leaves)
  let n = 0; const flat = list.map((gm) => { const x = gm.index ? gm.toNonIndexed() : gm; n += x.attributes.position.count; return x; });
  const P = new Float32Array(n * 3), Nn = new Float32Array(n * 3); let o = 0; for (const x of flat) { x.computeVertexNormals(); P.set(x.attributes.position.array, o * 3); Nn.set(x.attributes.normal.array, o * 3); o += x.attributes.position.count; }
  const gm = new THREE.BufferGeometry(); gm.setAttribute('position', new THREE.BufferAttribute(P, 3)); gm.setAttribute('normal', new THREE.BufferAttribute(Nn, 3)); return gm;
}
export { mergeGeoms };

// ------------------------------------------------------------------ living things the student picks up
// An organism is an item with its real model. It can live somewhere (swim round a path, sit on a lily pad, perch) until
// a hand (or the mouse) picks it up; let go near its place on the board it stays there, anywhere else it goes back home.
export function organism(name, label, o = {}) {
  const it = new Item('org_' + name, { ...o, name: label });
  const m = name ? ecoModel(name, { face: o.face || [1, 0], len: o.len, h: o.h, k: o.k, hit: true }) : (o.group || new THREE.Group()); if (!m.tick) m.tick = () => {}; it.model = m; it.g.add(m);
  // an easy-to-hit invisible handle around it (small animals are hard to point at)
  const r0 = o.hitR ?? 0.07; const hb = new THREE.Mesh(new THREE.SphereGeometry(r0, 10, 8), new THREE.MeshBasicMaterial({ visible: false })); hb.position.y = o.hitY ?? r0 * 0.6; it.g.add(hb);
  it.noGrab = false; it.noPhys = true; it.grabY = o.hitY ?? r0 * 0.6; it.base = 0; it.height = o.height ?? 0.1; it.radius = r0;
  it.placed = false; it.swim = o.swim || null; it.t = Math.random() * 10;
  it.update = (dt, t) => { m.tick(dt || 0.016); it.t += dt || 0.016; if (it.held || it.placed || it.flying) return;
    const S = it.swim; if (S) { const p = it.t * S.w; it.g.position.set(S.x + Math.cos(p) * S.rx, S.y, S.z + Math.sin(p) * S.rz); it.g.rotation.y = ang(-Math.sin(p) * S.rx, Math.cos(p) * S.rz); }
    else if (o.bob) it.g.position.y = it.home.p.y + Math.sin(it.t * 2) * o.bob; };
  return it;
}
// fly an item to a place (world), turning to a heading; sec seconds
export function flyTo(it, to, yaw = 0, sec = 0.9, cb) {
  it.flying = true; const p0 = it.g.position.clone(), q0 = it.g.quaternion.clone(), q1 = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, yaw, 0)); let k = 0;
  const lift = Math.max(0.15, (to.y - p0.y) * 0.3 + 0.15);
  const step = () => { k = Math.min(1, k + 1 / (60 * sec)); const e = ease(k); it.g.position.lerpVectors(p0, to, e); it.g.position.y += Math.sin(e * Math.PI) * lift; it.g.quaternion.slerpQuaternions(q0, q1, e); if (k < 1) requestAnimationFrame(step); else { it.flying = false; if (cb) cb(); } };
  step();
}

// ------------------------------------------------------------------ the food-chain board on the table
// Four (or five) round mats in a row along the table with arrows between them, "who is eaten by whom". Each mat has a sign
// that shows the level and the energy that reaches it once something is put there. Then energy flows along the chain.
export function chainBoard(o = {}) {
  const it = new Item('bchain', { ...o, name: { en: 'Food-chain board', hi: 'आहार श्रृंखला बोर्ड', hg: 'Food chain board' } });
  const g = it.g, w_ = o.W || ((k) => k), n = o.n || 4, W = o.width || 2.1, xs = Array.from({ length: n }, (_, i) => -W / 2 + W * (i + 0.5) / n), Z = 0.0;
  const plank = new THREE.Mesh(new THREE.BoxGeometry(W + 0.12, 0.012, 0.3), new THREE.MeshStandardMaterial({ map: woodTex('#8a5a32', 23), roughness: 0.7 })); plank.position.set(0, 0.006, Z); plank.receiveShadow = true; g.add(plank);
  const arrowT = tex(256, 64, (x) => { x.clearRect(0, 0, 256, 64); x.fillStyle = '#f5e7c8'; x.fillRect(10, 26, 180, 12); x.beginPath(); x.moveTo(246, 32); x.lineTo(186, 6); x.lineTo(186, 58); x.closePath(); x.fill(); });
  const arrM = new THREE.MeshBasicMaterial({ map: arrowT, transparent: true, toneMapped: false });
  for (let i = 0; i < n - 1; i++) { const a = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.04).rotateX(-Math.PI / 2), arrM); a.position.set((xs[i] + xs[i + 1]) / 2, 0.0125, Z); g.add(a); }
  const matM = new THREE.MeshStandardMaterial({ color: 0xc8b48a, roughness: 0.95 });
  const mats = xs.map((x) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.105, 0.105, 0.008, 40), matM); m.position.set(x, 0.016, Z); m.receiveShadow = true; g.add(m); return m; });
  // a glass bowl of water on the mat where a fish goes
  for (const i of o.bowls || []) { const bw = new THREE.Mesh(new THREE.SphereGeometry(0.1, 32, 16, 0, TAU, Math.PI * 0.32, Math.PI * 0.68), new THREE.MeshStandardMaterial({ color: 0xdff2ff, roughness: 0.05, transparent: true, opacity: 0.25, depthWrite: false, side: THREE.DoubleSide })); bw.position.set(xs[i], 0.1, Z); bw.renderOrder = 8; g.add(bw);
    const wt = new THREE.Mesh(new THREE.CircleGeometry(0.083, 32).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x9fd0e0, roughness: 0.05, transparent: true, opacity: 0.35, depthWrite: false })); wt.position.set(xs[i], 0.15, Z); wt.renderOrder = 9; g.add(wt); }
  const glowM = (c) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.85, toneMapped: false });
  const rings = xs.map((x) => { const r = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.006, 8, 48), glowM(0xffd23f)); r.rotation.x = Math.PI / 2; r.position.set(x, 0.022, Z); r.visible = false; g.add(r); return r; });
  const signs = xs.map((x) => { const s = liveSign(0.11, 2.2); s.position.set(x, 0.42, Z - 0.05); s.visible = false; g.add(s); return s; });
  // energy flow: a warm glow moving along the chain, and heat leaving at each step
  const orb = new THREE.Mesh(new THREE.SphereGeometry(0.03, 16, 12), new THREE.MeshBasicMaterial({ color: 0xffc94a, transparent: true, opacity: 0.9, toneMapped: false })); orb.visible = false; g.add(orb);
  const heat = []; for (let i = 0; i < 18; i++) { const h = new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 6), new THREE.MeshBasicMaterial({ color: 0xff6a3a, transparent: true, opacity: 0, toneMapped: false })); g.add(h); heat.push({ h, t: 1, x: 0 }); }
  const rd = liveSign(0.13, 3.8); rd.position.set(0, 0.62, Z - 0.1); g.add(rd); it.say = (l, c) => rd.set(l, c);
  animator(it); const up0 = it.update; it.n = n; it.filled = 0;
  it.slot = (i) => g.localToWorld(V(xs[i], 0.024, Z));
  it.next = () => it.filled; // the mat waiting for the next one
  it.mark = (i) => rings.forEach((r, j) => { r.visible = j === i; });
  it.show = (i, lines, col) => { signs[i].visible = true; signs[i].set(lines, col); };
  it.fill = (i) => { it.filled = Math.max(it.filled, i + 1); it.mark(it.filled < n ? it.filled : -1); };
  // energy flowing from mat a to mat b (heat puffs rise from the eater: most of the energy is used up and lost)
  it.flow = (a, b, cb) => { orb.visible = true; const A = V(xs[a], 0.16, Z), B = V(xs[b], 0.16, Z);
    it.play(1.6, (k) => { const e = ease(clamp01(k / 0.7)); orb.position.lerpVectors(A, B, e); orb.position.y += Math.sin(e * Math.PI) * 0.12; orb.scale.setScalar(1 - 0.55 * e);
      if (k > 0.7) heat.forEach((h, i) => { const q = clamp01((k - 0.7) / 0.3 - (i % 6) * 0.04); h.h.material.opacity = 0.75 * Math.sin(q * Math.PI); h.h.position.set(xs[b] + Math.sin(i * 2.4) * 0.07, 0.12 + q * 0.35 + (i % 3) * 0.03, Z + Math.cos(i * 1.7) * 0.06); }); },
    () => { orb.visible = false; heat.forEach((h) => { h.h.material.opacity = 0; }); if (cb) cb(); }); };
  it.update = (dt, t) => { up0(dt); const tt = t ?? performance.now() / 1000; rings.forEach((r) => { if (r.visible) r.scale.setScalar(1 + 0.06 * Math.sin(tt * 5)); }); };
  it.mark(0); it.say([w_(o.first || 'Who makes the food?')], '#ffffff');
  return done1(it, { height: 0.05, radius: 1.1 });
}
// picking up the living things and putting them on the board, in the order of who eats whom.
// orgs: [{ it, at: slot }], order: slot by slot; done.link(i): the i-th one is on its mat; wrong(it): told why not
export function bindChain(board, orgs, app, steps, o = {}) {
  const W = o.W || ((k) => k);
  const placeOn = (org, i, cb) => { org.placed = true; org.held = null; const p = board.slot(i); p.y += org.seat ?? 0; flyTo(org, p, org.seatYaw ?? 0, 0.8, () => { board.fill(i); if (cb) cb(); }); };
  for (const org of orgs) {
    // the mouse carries it at the height of the table, so it can be put on the board
    org.dragLift = Math.max(0.06, BENCH_Y + 0.12 - org.g.position.y);
    org.onRelease = () => {
      if (org.placed) return; const i = board.next(), want = orgs.find((x) => x.at === i);
      const p = org.g.getWorldPosition(V(0, 0, 0)), s = board.slot(want ? want.at : 0), dxz = Math.hypot(p.x - s.x, p.z - s.z);
      const onBoard = dxz < 0.22 || (Math.abs(p.z - s.z) < 0.3 && Math.abs(p.x - s.x) < 0.3);
      const ok = want === org && onBoard && stepNow(app, steps[i]);
      if (ok) { placeOn(org, i, () => o.link && o.link(i)); return; }
      if (onBoard && want !== org && o.wrong) o.wrong(org, want);
      flyTo(org, org.home.p.clone(), new THREE.Euler().setFromQuaternion(org.home.q).y, 0.8);
    };
  }
  return { placeOn };
}

// ------------------------------------------------------------------ pesticide in the pond (biological magnification)
// A drain from the fields runs into the pond. A tester with a long probe measures how much pesticide (DDT) is in the
// water and in each living thing; a bar chart (each line ten times the one below) shows the result.
export function pesticideKit(o = {}) {
  const it = new Item('bddt', { ...o, name: { en: 'Pesticide tester and chart', hi: 'कीटनाशक परीक्षक और चार्ट', hg: 'Pesticide tester aur chart' } });
  const g = it.g, w_ = o.W || ((k) => k);
  // the drain: a concrete pipe from the field on the right, its mouth over the water
  const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.6, 20, 1, true), new THREE.MeshStandardMaterial({ color: 0x8d8a82, roughness: 0.95, side: THREE.DoubleSide })); pipe.rotation.z = Math.PI / 2; pipe.position.set(2.35, 0.05, -2.2); pipe.castShadow = true; g.add(pipe);
  const flow = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.1, 0.25, 12, 1, true), new THREE.MeshStandardMaterial({ color: 0x9b8a5a, transparent: true, opacity: 0.0, roughness: 0.2 })); flow.position.set(1.52, -0.04, -2.2); g.add(flow);
  const red = new THREE.Mesh(new THREE.CircleGeometry(1, 48).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xb04a2a, transparent: true, opacity: 0, depthWrite: false })); red.position.set(1.3, POND.wy + 0.006, -2.3); red.renderOrder = 7; g.add(red);
  // the chart: five bars on a board on the table, log scale (every grid line is ten times the one below)
  const ch = new THREE.Group(); ch.position.set(o.chartX ?? 0, BENCH_Y, -0.9); ch.scale.setScalar(0.72); ch.rotation.y = 0.25; g.add(ch);
  const board = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.62, 0.02), new THREE.MeshStandardMaterial({ map: tex(512, 256, (x) => { x.fillStyle = '#fbf8f0'; x.fillRect(0, 0, 512, 256); x.strokeStyle = 'rgba(40,60,90,0.25)'; x.lineWidth = 2; for (let i = 0; i <= 8; i++) { const y = 230 - i * 26; x.beginPath(); x.moveTo(60, y); x.lineTo(500, y); x.stroke(); } x.fillStyle = '#334'; x.font = `700 15px ${FONT}`; ['0.000001', '0.00001', '0.0001', '0.001', '0.01', '0.1', '1', '10', '100'].forEach((t, i) => x.fillText(t, 2, 234 - i * 26)); }), roughness: 0.8 }));
  board.position.set(0, 0.36, 0); board.castShadow = true; ch.add(board);
  const legs = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.06, 0.12), M(0x6b4a2a, 0.8)); legs.position.set(0, 0.03, 0.03); ch.add(legs);
  const LV = [0.000003, 0.04, 0.5, 2, 25]; const cols = [0x5aa9e6, 0x8fd16a, 0xf2c230, 0xf08a2c, 0xd9302a]; const bars = LV.map((v, i) => { const b = new THREE.Mesh(new THREE.BoxGeometry(0.11, 1, 0.012), new THREE.MeshStandardMaterial({ color: cols[i], roughness: 0.5, emissive: cols[i], emissiveIntensity: 0.15 })); b.position.set(-0.4 + i * 0.2, 0.1, 0.013); b.scale.y = 0.0001; b.visible = false; ch.add(b); return b; });
  const yOf = (v) => clamp01((Math.log10(v) + 6.5) / 9) * 0.53; // board units: 0.000001 ppm at the bottom line … 100 ppm at the top
  const tags = LV.map((_, i) => { const s = tag('', '#ffffff', 0.045); s.position.set(-0.4 + i * 0.2, 0.12, 0.03); s.visible = false; ch.add(s); return s; });
  const names = (o.names || ['water', 'algae', 'small fish', 'big fish', 'kingfisher']).map((t, i) => { const s = tag(w_(t), '#ffffff', 0.04, 'rgba(30,40,60,0.85)'); s.position.set(-0.4 + i * 0.2, 0.025, 0.03); ch.add(s); return s; });
  void names;
  // the tester: a yellow box with a screen and a probe on a cable, it goes to each one in turn
  const meter = new THREE.Group(); const box = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.07, 0.04), new THREE.MeshStandardMaterial({ color: 0xf2c230, roughness: 0.5 })); meter.add(box);
  const scr = liveSign(0.045, 2.3); scr.position.set(0, 0.0, 0.03); meter.add(scr); const probe = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.22, 8), new THREE.MeshStandardMaterial({ color: 0xcfd4da, metalness: 0.8, roughness: 0.3 })); probe.position.set(0, -0.14, 0); meter.add(probe);
  meter.position.set(0.85, BENCH_Y + 0.25, -0.62); g.add(meter); const meterHome = meter.position.clone();
  const rd = liveSign(0.13, 3.8); rd.position.set(0, 1.62, -1.2); g.add(rd); it.say = (l, c) => rd.set(l, c);
  animator(it); const up0 = it.update; it.pour = 0; it.tested = 0; it.targets = o.targets || [];
  it.setPour = (k) => { it.pour = clamp01(k); flow.material.opacity = it.pour > 0.02 && it.pour < 0.995 ? 0.75 : 0; red.scale.setScalar(0.2 + it.pour * 1.2); red.material.opacity = 0.18 * it.pour; if (it.onPour) it.onPour(it.pour); };
  // test the i-th: the tester flies over (to a point given by targets[i]()), reads, and its bar rises on the chart
  it.test = (i, cb) => { if (it.busy) return false; const at = (it.targets[i] && it.targets[i]()) || meterHome.clone(); const p0 = meter.position.clone(), to = at.clone().add(V(0, 0.16, 0));
    it.play(2.4, (k) => { const e = ease(clamp01(k / 0.35)), b = ease(clamp01((k - 0.65) / 0.35)); meter.position.lerpVectors(p0, to, e).lerp(meterHome, b); if (k > 0.35 && k < 0.7) scr.set([`${fmt(LV[i] * clamp01((k - 0.35) / 0.25))} ppm`], '#d9302a');
      bars[i].visible = true; bars[i].scale.y = Math.max(0.0001, yOf(LV[i]) * clamp01((k - 0.55) / 0.3)); bars[i].position.y = 0.075 + bars[i].scale.y / 2; },
    () => { it.tested = Math.max(it.tested, i + 1); scr.set([`${fmt(LV[i])} ppm`], '#d9302a'); tags[i].visible = true; tags[i].setText(fmt(LV[i]), '#ffd23f'); tags[i].position.y = 0.09 + yOf(LV[i]) + 0.03; if (cb) cb(); }); return true; };
  it.update = (dt, t) => { up0(dt); };
  scr.set(['0 ppm'], '#333333'); it.say([w_('Pesticide tester ready')], '#ffffff'); it.knobPath = o.knobPath || null;
  return done1(it, { height: 0.6, radius: 1.2 });
}
const fmt = (v) => (v >= 1 ? String(Math.round(v)) : v >= 0.01 ? v.toFixed(2).replace(/0+$/, '') : v >= 0.001 ? v.toFixed(3) : v.toFixed(6).replace(/0+$/, ''));
export function bindPesticideHands(kit, slide, push, app, s = { pour: 1, t1: 2 }, done = {}) {
  const sync = slideKnob(slide, { path: () => kit.knobPath(), active: () => stepNow(app, s.pour) && kit.pour < 0.99, keepVisible: () => app.runner.i === s.pour, k: () => kit.pour,
    set: (k) => { kit.setPour(k > 0.97 ? 1 : k); if (kit.pour >= 1 && done.poured) done.poured(); } });
  const s0 = kit.setPour; kit.setPour = (k) => { s0(k); sync(); };
  pushKnob(push, { path: () => kit.pushPath(), active: () => app.runner.i >= s.t1 && app.runner.i < s.t1 + 4 && stepNow(app, app.runner.i) && !kit.busy && kit.tested === app.runner.i - s.t1 + 1, keepVisible: () => app.runner.i >= s.t1 && app.runner.i < s.t1 + 4,
    press: () => { const i = kit.tested; if (i >= 1 && i <= 4) kit.test(i, () => done.tested && done.tested(i)); } });
}
export { fmt as ppm };

// ------------------------------------------------------------------ a clump of green algae from the pond
// Fine green threads floating on the water. On the board a hand lens shows what they are: Spirogyra, threads of cells
// with spiral green bands (their chloroplasts) that make food from sunlight.
export function algaeClump(label, o = {}) {
  const r = rnd(o.seed || 77), grp = new THREE.Group(); const tubes = [];
  for (let i = 0; i < 26; i++) { const pts = []; const a = r() * TAU, L = 0.08 + r() * 0.1; for (let k = 0; k <= 6; k++) { const u = k / 6; pts.push(V(Math.cos(a) * L * u + Math.sin(u * 5 + i) * 0.012, 0.008 + Math.sin(u * 3 + i) * 0.006, Math.sin(a) * L * u + Math.cos(u * 4 + i) * 0.012)); } tubes.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 10, 0.0022, 4, false)); }
  const algM = new THREE.MeshStandardMaterial({ color: 0x5f9a2c, roughness: 0.55, emissive: 0x0d2a05 }); const mg = mergeGeoms(tubes); grp.add(new THREE.Mesh(mg, algM));
  const mat = new THREE.Mesh(new THREE.CircleGeometry(0.11, 24).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: scumTex(), transparent: true, depthWrite: false, roughness: 0.8 })); mat.position.y = 0.004; grp.add(mat);
  const it = organism(null, label, { ...o, group: grp, hitR: 0.1, hitY: 0.03 });
  const lens = new THREE.Sprite(new THREE.SpriteMaterial({ map: spiroTex(), transparent: true, toneMapped: false, depthWrite: false })); lens.scale.set(0.2, 0.2, 1); lens.position.set(0, 0.22, 0); lens.visible = false; lens.renderOrder = 30; it.g.add(lens); it.lens = lens;
  const u0 = it.update; it.update = (dt, t) => { u0(dt, t); lens.visible = it.placed && !it.flying; };
  return it;
}
