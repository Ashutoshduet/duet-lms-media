// DUET Science Lab 360, biology in real places, batch BW1 (part 2): the grassland energy pyramid, the forest floor
// over eight weeks (decomposers at work) and two baskets to sort living and non-living things. Plants, wood and animals
// are real scans (see bioworld1.js); leaves, worms, soil, the stand, the bottle and the bag are drawn here.
import * as THREE from 'three';
import { Item } from './apparatus.js';
import { clamp01, ease } from './mathlab2.js';
import { pushKnob } from './mathworld3.js';
import { liveSign } from './mathworld4.js';
import { slideKnob } from './mathworld5.js';
import { tag, animator, woodTex, M, rnd, tex, noHit, stepNow, V, FONT } from './mathworld_j1.js';
import { ecoModel, flyTo, mergeGeoms } from './bioworld1.js';
import { BENCH_Y } from './room.js';

const TAU = Math.PI * 2;
const done1 = (it, o) => { noHit(it.g); it.noGrab = true; it.noPhys = true; it.base = 0; Object.assign(it, o); return it; };
const T = {};

// ------------------------------------------------------------------ Class 10: energy in a grassland, the 10 per cent law
// A five-step stand stands in the grass. On each step lives one link of the food chain: grass, a grasshopper, a frog, a
// snake and a hawk. Each push of the lever passes energy one step up: a glow climbs, heat leaves, the number shrinks ten
// times. The steps are not to scale (the top one would be 10,000 times smaller than the bottom one).
// steps like a staircase: each one starts 0.26 m further back, all end at the same back line, so every step has a ledge
export const PYR = { z: -2.1, H: 0.24, W: [2.3, 1.8, 1.35, 0.95, 0.6], F: 0.6, B: -0.75, S: 0.26 };
PYR.D = PYR.W.map((_, i) => PYR.F - i * PYR.S - PYR.B);
export function energyPyramid(o = {}) {
  const it = new Item('bpyr', { ...o, name: { en: 'Energy pyramid in a grassland', hi: 'घास के मैदान में ऊर्जा पिरामिड', hg: 'Grassland mein energy pyramid' } });
  const g = it.g, w_ = o.W || ((k) => k), r = rnd(31), ticks = [];
  // grass all around (real scanned clumps, turned and scattered)
  for (let i = 0; i < 26; i++) { const a = r() * TAU, d = 1.3 + r() * 4.5; const m = ecoModel(i % 3 ? 'grass_dry_01' : 'grass_dry_02', { k: 1.2 + r() * 0.8, face: [Math.cos(r() * TAU), Math.sin(r() * TAU)] }); m.position.set(Math.cos(a) * d, 0, -1.2 + Math.sin(a) * d * 0.8); g.add(m); }
  for (let i = 0; i < 6; i++) { const m = ecoModel(i % 2 ? 'dandelion_01' : 'weed_plant_02', { k: 1, face: [r() - 0.5, r() - 0.5] }); m.position.set((r() - 0.5) * 5, 0, -0.8 - r() * 3.5); g.add(m); }
  // the stand: five wooden steps, each with its name on the front
  const cols = ['#4f8a3a', '#8fae3a', '#c49a3a', '#b46a32', '#8a4a36'], { z: Z, H, W, D } = PYR;
  const names = o.names || ['Producers: grass', 'Herbivore: grasshopper', 'Carnivore: frog', 'Carnivore: snake', 'Top carnivore: hawk'];
  const front = (i) => tex(512, 64, (x) => { x.fillStyle = cols[i]; x.fillRect(0, 0, 512, 64); x.fillStyle = 'rgba(0,0,0,0.12)'; for (let k = 0; k < 512; k += 9) x.fillRect(k, 0, 1, 64); x.fillStyle = '#fffaf0'; x.font = `800 ${i > 2 ? 26 : 30}px ${FONT}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(w_(names[i]), 256, 34); });
  const levels = W.map((w, i) => { const top = M(new THREE.Color(cols[i]).multiplyScalar(0.9), 0.85); const fm = new THREE.MeshStandardMaterial({ map: front(i), roughness: 0.8 }); const side = M(new THREE.Color(cols[i]).multiplyScalar(0.75), 0.9);
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, H, D[i]), [side, side, top, top, fm, side]); b.position.set(0, H * (i + 0.5), Z + (PYR.F - i * PYR.S + PYR.B) / 2); b.castShadow = b.receiveShadow = true; g.add(b); return b; });
  // a point on the open ledge at the front of step i (the top step: its middle)
  const topY = (i) => H * (i + 1), at = (i, dx = 0, dz = 0) => V(dx, topY(i), (i === 4 ? levels[4].position.z : Z + PYR.F - i * PYR.S - PYR.S / 2) + dz);
  // who lives on each step
  const grass = ecoModel('grass_medium_02', { k: 1.4 }); grass.position.copy(at(0, -0.55, 0)); g.add(grass);
  const grass2 = ecoModel('grass_medium_02', { k: 1.2, face: [-1, 0.3] }); grass2.position.copy(at(0, 0.6, 0)); g.add(grass2);
  const hopper = ecoModel('locust', { face: [1, 0.4], k: 1.8 }); hopper.position.copy(at(1, 0.25, 0)); g.add(hopper);
  const frog = ecoModel('frog', { face: [0.4, 1], k: 1.3 }); frog.position.copy(at(2, -0.22, 0)); g.add(frog);
  const snake = ecoModel('ratsnake', { face: [0.5, 1], len: 0.3 }); snake.position.copy(at(3, 0, 0)); g.add(snake);
  const hawk = ecoModel('hawk', { face: [0, 1], h: 0.62 }); hawk.position.copy(at(4, 0, 0)); g.add(hawk);
  it.who = [grass, hopper, frog, snake, hawk];
  // others that live in the grassland: a hare in the grass, a crow looking for insects
  const hare = ecoModel('hare', { face: [0.6, 1] }); hare.position.set(-1.75, 0, -1.45); g.add(hare);
  const crow = ecoModel('crow', { face: [-1, 0.5], len: 0.45 }); crow.position.set(1.8, 0, -2.7); g.add(crow);
  // tags: "×1.8" for the insect and the frog (shown bigger than life so they can be seen)
  const big = tag('×1.8', '#ffffff', 0.05); big.position.copy(at(1, 0.25, 0)).add(V(0, 0.16, 0)); g.add(big);
  // the sun, its light falling on the grass
  const sun = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex(128, 128, (x) => { const gr = x.createRadialGradient(64, 64, 4, 64, 64, 64); gr.addColorStop(0, 'rgba(255,250,220,1)'); gr.addColorStop(0.35, 'rgba(255,220,120,0.9)'); gr.addColorStop(1, 'rgba(255,200,80,0)'); x.fillStyle = gr; x.fillRect(0, 0, 128, 128); }), transparent: true, depthWrite: false, toneMapped: false }));
  sun.scale.set(0.7, 0.7, 1); sun.position.set(-1.9, 2.6, Z - 0.3); g.add(sun);
  const rays = []; for (let i = 0; i < 7; i++) { const ry = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 1, 6), new THREE.MeshBasicMaterial({ color: 0xffe08a, transparent: true, opacity: 0, toneMapped: false })); g.add(ry); rays.push(ry); }
  const setRays = (k) => rays.forEach((ry, i) => { const a = sun.position.clone(), b = at(0, -0.9 + i * 0.3, (i % 2) * 0.2 - 0.1); const d = b.clone().sub(a); ry.position.copy(a).addScaledVector(d, 0.5); ry.scale.y = d.length(); ry.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize()); ry.material.opacity = 0.55 * k; });
  // energy signs above each step, a glow that climbs and heat that leaves
  const E = [10000, 1000, 100, 10, 1]; const signs = E.map((_, i) => { const s = liveSign(0.12, 2.4); s.position.copy(at(i, W[i] / 2 + 0.25, 0)).add(V(0, 0.12, 0)); if (i === 4) s.position.set(0.75, topY(4) + 0.55, levels[4].position.z); s.visible = false; g.add(s); return s; });
  const orb = new THREE.Mesh(new THREE.SphereGeometry(0.06, 16, 12), new THREE.MeshBasicMaterial({ color: 0xffc94a, transparent: true, opacity: 0.9, toneMapped: false })); orb.visible = false; g.add(orb);
  const heat = []; for (let i = 0; i < 26; i++) { const h = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 6), new THREE.MeshBasicMaterial({ color: 0xff6a3a, transparent: true, opacity: 0, toneMapped: false })); g.add(h); heat.push(h); }
  const rd = liveSign(0.16, 4); rd.position.set(0, 2.35, Z - 0.4); g.add(rd); it.say = (l, c) => rd.set(l, c);
  animator(it); const up0 = it.update; it.lvl = -1;
  const kj = (v) => `${v.toLocaleString('en-IN')} kJ`;
  // pass the energy up to level i (i = 0: sunlight to grass)
  it.pass = (i, cb) => { if (it.busy || i !== it.lvl + 1) return false;
    const A = i === 0 ? sun.position.clone() : at(i - 1, 0, 0).add(V(0, 0.15, 0)), B = at(i, 0, 0).add(V(0, 0.15, 0)); orb.visible = true;
    it.play(2.2, (k) => { if (i === 0) setRays(clamp01(k * 2)); const e = ease(clamp01(k / 0.6)); orb.position.lerpVectors(A, B, e); orb.position.y += Math.sin(e * Math.PI) * 0.3; orb.scale.setScalar(i === 0 ? 1.6 - e * 0.6 : 1 - 0.12 * i * e);
      const who = it.who[i]; if (who && k > 0.5) who.position.y = topY(i) + Math.max(0, Math.sin((k - 0.5) * 2 * Math.PI * 2)) * (i === 4 ? 0 : 0.03);
      if (k > 0.55 && i > 0) heat.forEach((h, j) => { const q = clamp01((k - 0.55) / 0.45 - (j % 8) * 0.03); h.material.opacity = 0.7 * Math.sin(q * Math.PI); h.position.copy(B).add(V(Math.sin(j * 2.4) * W[i] * 0.3, q * 0.9 + (j % 3) * 0.05, Math.cos(j * 1.7) * D[i] * 0.3)); }); },
    () => { orb.visible = false; heat.forEach((h) => { h.material.opacity = 0; }); it.lvl = i; signs[i].visible = true; signs[i].set([kj(E[i])], '#ffd23f'); if (i === 0) setRays(1); if (cb) cb(); }); return true; };
  it.update = (dt, t) => { up0(dt); const tt = t ?? performance.now() / 1000; for (const f of ticks) f(dt, tt); hopper.rotation.y = Math.sin(tt * 0.5) * 0.15; };
  it.say([w_('Push the lever to pass energy up')], '#ffffff');
  it.knobPath = () => [V(-0.45, 1.0, -0.42), V(0.45, 1.0, -0.42)];
  return done1(it, { height: 1.3, radius: 1.5 });
}
export function bindPyramidHands(py, lever, app, s = { first: 1 }, done = {}) {
  pushKnob(lever, { path: () => [V(-0.45, 1.0, -0.3), V(-0.45, 1.0, -0.05)], active: () => stepNow(app, app.runner.i) && app.runner.i >= s.first && app.runner.i < s.first + 5 && !py.busy && py.lvl === app.runner.i - s.first - 1, keepVisible: () => app.runner.i >= s.first && app.runner.i < s.first + 5,
    press: () => { const i = py.lvl + 1; py.pass(i, () => done.passed && done.passed(i)); } });
}

// ------------------------------------------------------------------ Class 10: who cleans up the forest floor?
// A patch of forest floor in front of the student: fallen leaves of four kinds, a fallen log, a dead beetle, a plastic
// bottle and a polythene bag. Slide the calendar from week 0 to week 8: bacteria and fungi break the leaves and the
// beetle down, mushrooms come up and wither, a bracket fungus grows on the log, earthworms pull leaves into the soil,
// and the ground darkens with humus. The bottle and the bag stay exactly as they were.
const leafAtlas = () => T.leaf || (T.leaf = tex(512, 512, (x) => { x.clearRect(0, 0, 512, 512);
  const draw = (cx, cy, kind) => { x.save(); x.translate(cx, cy); const L = 105, Wd = kind === 1 ? 70 : kind === 3 ? 55 : 42;
    const col = ['#7a8a32', '#b0742c', '#8a5a2a', '#c9a24a'][kind]; const g = x.createLinearGradient(0, -L, 0, L); g.addColorStop(0, col); g.addColorStop(1, '#5a4a24'); x.fillStyle = g;
    x.beginPath(); x.moveTo(0, L); if (kind === 1) { x.bezierCurveTo(Wd, L * 0.4, Wd * 1.1, -L * 0.5, 0, -L * 1.05); x.bezierCurveTo(-Wd * 1.1, -L * 0.5, -Wd, L * 0.4, 0, L); } else { x.quadraticCurveTo(Wd * 1.2, 0, 0, -L); x.quadraticCurveTo(-Wd * 1.2, 0, 0, L); } x.fill();
    x.strokeStyle = 'rgba(60,40,15,0.55)'; x.lineWidth = 3; x.beginPath(); x.moveTo(0, L); x.lineTo(0, -L * 0.95); x.stroke(); x.lineWidth = 1.5; for (let i = -6; i <= 6; i++) { if (!i) continue; const y = i * 13; x.beginPath(); x.moveTo(0, y); x.lineTo(Math.sign(i) * Wd * 0.8 * (1 - Math.abs(i) / 9), y - 22); x.stroke(); x.beginPath(); x.moveTo(0, y); x.lineTo(-Math.sign(i) * Wd * 0.8 * (1 - Math.abs(i) / 9), y - 22); x.stroke(); }
    const r = rnd(kind + 3); for (let i = 0; i < 18; i++) { x.fillStyle = `rgba(50,30,10,${r() * 0.25})`; x.beginPath(); x.arc((r() - 0.5) * Wd, (r() - 0.5) * L * 1.4, 2 + r() * 6, 0, TAU); x.fill(); } x.restore(); };
  draw(128, 128, 0); draw(384, 128, 1); draw(128, 384, 2); draw(384, 384, 3); }));
const soilTex = () => T.soil || (T.soil = tex(512, 512, (x) => { const g = x.createRadialGradient(256, 256, 120, 256, 256, 256); g.addColorStop(0, 'rgba(46,32,20,1)'); g.addColorStop(0.75, 'rgba(52,38,24,0.85)'); g.addColorStop(1, 'rgba(60,45,30,0)'); x.fillStyle = g; x.fillRect(0, 0, 512, 512);
  const r = rnd(41); for (let i = 0; i < 3000; i++) { const a = r() * TAU, d = r() * 230; x.fillStyle = `rgba(${20 + r() * 30},${14 + r() * 20},${8 + r() * 12},${0.5 * (1 - d / 256)})`; x.fillRect(256 + Math.cos(a) * d, 256 + Math.sin(a) * d, 2 + r() * 3, 2 + r() * 3); } }));
export function forestFloor(o = {}) {
  const it = new Item('bfloor', { ...o, name: { en: 'Forest floor', hi: 'जंगल की ज़मीन', hg: 'Jungle ki zameen' } });
  const g = it.g, w_ = o.W || ((k) => k), r = rnd(53), Z = -1.35, ticks = [];
  // humus: dark soil that shows more and more as the litter breaks down
  const humus = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.7).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: soilTex(), transparent: true, opacity: 0.35, roughness: 1, depthWrite: false })); humus.position.set(0, 0.004, Z); humus.renderOrder = -1; humus.receiveShadow = true; g.add(humus);
  // fallen leaves (one instanced mesh, four kinds from one picture)
  const N = 260, lg = new THREE.PlaneGeometry(0.11, 0.11).rotateX(-Math.PI / 2); const uv = lg.attributes.uv;
  const leafM = new THREE.MeshStandardMaterial({ map: leafAtlas(), alphaTest: 0.45, side: THREE.DoubleSide, roughness: 0.9 });
  leafM.onBeforeCompile = (sh) => { sh.vertexShader = sh.vertexShader.replace('#include <uv_pars_vertex>', '#include <uv_pars_vertex>\nattribute vec2 aOff;').replace('#include <uv_vertex>', '#include <uv_vertex>\nvMapUv = uv * 0.5 + aOff;'); };
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i), uv.getY(i));
  const off = new Float32Array(N * 2); const leaves = new THREE.InstancedMesh(lg, leafM, N); const L0 = [];
  for (let i = 0; i < N; i++) { const kind = i % 4; off[i * 2] = kind % 2 ? 0.5 : 0; off[i * 2 + 1] = kind < 2 ? 0.5 : 0; const a = r() * TAU, d = Math.sqrt(r()); L0.push({ x: Math.cos(a) * d * 1.05, z: Z + Math.sin(a) * d * 0.72, y: 0.006 + r() * 0.03, ry: r() * TAU, rx: (r() - 0.5) * 0.5, s: 0.8 + r() * 0.7, life: 0.35 + r() * 0.55 }); }
  lg.setAttribute('aOff', new THREE.InstancedBufferAttribute(off, 2)); leaves.castShadow = false; leaves.receiveShadow = true; g.add(leaves);
  const dm = new THREE.Object3D(), col = new THREE.Color();
  const setLeaves = (k) => { L0.forEach((l, i) => { const q = clamp01(k / l.life); const s = l.s * (1 - 0.95 * ease(q)); dm.position.set(l.x, l.y * (1 - q), l.z); dm.rotation.set(l.rx * (1 - q), l.ry, 0); dm.scale.setScalar(Math.max(0.001, s)); dm.updateMatrix(); leaves.setMatrixAt(i, dm.matrix); col.setRGB(1 - 0.6 * q, 1 - 0.65 * q, 1 - 0.7 * q); leaves.setColorAt(i, col); }); leaves.instanceMatrix.needsUpdate = true; if (leaves.instanceColor) leaves.instanceColor.needsUpdate = true; };
  // the fallen log, a bracket fungus that grows on it, mushrooms that come up and wither, a dead beetle
  const log = ecoModel('dead_tree_trunk', { k: 0.6 }); log.position.set(-0.15, 0, Z - 0.35); log.rotation.y = 0.25; g.add(log);
  // an old stump at the back with a barn owl on it, and ferns
  const stump = ecoModel('tree_stump_01', { k: 0.55 }); stump.position.set(1.25, 0, Z - 1.1); g.add(stump);
  const owl = ecoModel('owl', { face: [-0.5, 1], h: 0.36 }); owl.position.set(1.22, 0.3, Z - 1.08); g.add(owl);
  for (const [x, z, k] of [[-1.3, -0.9, 0.5], [-0.95, -1.35, 0.4], [1.6, -0.4, 0.45]]) { const f = ecoModel('fern_02', { k }); f.position.set(x, 0, Z + z); g.add(f); }
  const brk = ecoModel('birchfungus', { face: [0, 1], len: 0.24 }); brk.position.set(0.25, 0.04, Z - 0.28); g.add(brk);
  const shrooms = [[-0.5, 0.05, 0.13], [-0.36, 0.2, 0.1], [0.55, 0.12, 0.12], [0.4, -0.12, 0.085]].map(([x, z, h]) => { const m = ecoModel('parasol', { h, face: [r() - 0.5, 1] }); m.position.set(x, 0, Z + z); g.add(m); return m; });
  const beetle = ecoModel('beetle', { face: [1, 0.2], len: 0.05 }); beetle.rotation.z = Math.PI; beetle.position.set(0.15, 0.022, Z + 0.25); g.add(beetle);
  const bTag = tag(w_('dead beetle'), '#ffffff', 0.04); bTag.position.set(0.15, 0.12, Z + 0.25); g.add(bTag);
  // earthworms: pink-brown tubes that wriggle on the surface for a while
  const wormM = new THREE.MeshStandardMaterial({ color: 0xb06a5a, roughness: 0.35 }); const worms = [[-0.3, 0.3, 0.4], [0.35, 0.28, 2.2], [0.05, -0.05, 4.1], [-0.65, -0.1, 1.2]].map(([x, z, a]) => { const w = new THREE.Group(); w.position.set(x, 0.006, Z + z); w.rotation.y = a; g.add(w); w.userData.mesh = null; w.userData.ph = r() * 9; return w; });
  // six shapes per worm, shown in turn (no new geometry while it wriggles)
  worms.forEach((w) => { w.userData.f = []; for (let f = 0; f < 6; f++) { const pts = []; for (let i = 0; i <= 12; i++) { const u = i / 12; pts.push(V((u - 0.5) * 0.16, 0.004 + Math.sin(u * Math.PI) * 0.003, Math.sin(u * 7 + f / 6 * TAU + w.userData.ph) * 0.012)); }
    const m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.0045, 6, false), wormM); m.visible = f === 0; m.castShadow = true; w.add(m); w.userData.f.push(m); } });
  // a plastic bottle and a polythene bag: they do not change at all
  const bottle = new THREE.Group(); { const pts = [[0, 0], [0.034, 0.002], [0.036, 0.02], [0.034, 0.16], [0.03, 0.18], [0.013, 0.215], [0.012, 0.235]].map(([a, b]) => new THREE.Vector2(a, b));
    const b = new THREE.Mesh(new THREE.LatheGeometry(pts, 24), new THREE.MeshStandardMaterial({ color: 0xcfe8f2, roughness: 0.08, transparent: true, opacity: 0.55, depthWrite: false })); bottle.add(b);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.016, 16), M(0x2a6fd6, 0.4)); cap.position.y = 0.243; bottle.add(cap);
    const lab = new THREE.Mesh(new THREE.CylinderGeometry(0.0355, 0.0355, 0.06, 24, 1, true), new THREE.MeshStandardMaterial({ map: tex(256, 64, (x) => { x.fillStyle = '#1d5fb8'; x.fillRect(0, 0, 256, 64); x.fillStyle = '#fff'; x.font = `800 30px ${FONT}`; x.fillText('AQUA', 70, 42); }), roughness: 0.5 })); lab.position.y = 0.1; bottle.add(lab); }
  bottle.rotation.z = Math.PI / 2; bottle.rotation.y = 0.5; bottle.position.set(0.68, 0.036, Z + 0.18); g.add(bottle);
  const bagG = new THREE.IcosahedronGeometry(0.09, 3); { const p = bagG.attributes.position; for (let i = 0; i < p.count; i++) { const v = V(p.getX(i), p.getY(i), p.getZ(i)); const n = 1 + 0.18 * Math.sin(v.x * 60) * Math.cos(v.z * 55) + 0.1 * Math.sin(v.y * 80); v.multiplyScalar(n); v.y *= 0.45; p.setXYZ(i, v.x, v.y, v.z); } bagG.computeVertexNormals(); }
  const bag = new THREE.Mesh(bagG, new THREE.MeshStandardMaterial({ color: 0xf2f0ea, roughness: 0.35, transparent: true, opacity: 0.86 })); bag.position.set(-0.78, 0.035, Z + 0.2); g.add(bag);
  [bottle, bag, log].forEach((m) => m.traverse((x) => { if (x.isMesh) { x.castShadow = true; x.receiveShadow = true; } }));
  // the calendar sign
  const rd = liveSign(0.15, 3.6); rd.position.set(0, 1.55, Z - 0.6); g.add(rd); it.say = (l, c) => rd.set(l, c);
  it.wk = 0;
  const apply = () => { const k = it.wk / 8; setLeaves(k); humus.material.opacity = 0.3 + 0.6 * k;
    shrooms.forEach((m, i) => { const up = clamp01((it.wk - 1.5 - i * 0.4) / 1.5), down = clamp01((it.wk - 6 - i * 0.3) / 1.5); m.scale.setScalar(Math.max(0.001, ease(up) * (1 - 0.7 * down))); m.visible = up > 0.01; });
    brk.scale.setScalar(Math.max(0.001, ease(clamp01((it.wk - 2) / 4)))); brk.visible = it.wk > 2.05;
    const bq = clamp01((it.wk - 0.5) / 5); beetle.scale.setScalar(Math.max(0.001, 1 - 0.95 * ease(bq))); beetle.visible = bq < 0.98; bTag.visible = bq < 0.9; };
  it.setWeek = (w) => { it.wk = Math.max(0, Math.min(8, w)); apply(); if (it.onWeek) it.onWeek(it.wk); };
  it.update = (dt, t) => { const tt = t ?? performance.now() / 1000; const on = clamp01(Math.min((it.wk - 1) / 1.5, (7.5 - it.wk) / 1.5)); worms.forEach((w, i) => { w.visible = on > 0.01; if (!w.visible) return; w.scale.setScalar(on); const f = Math.floor(tt * 5 + i) % 6; w.userData.f.forEach((m, j) => { m.visible = j === f; }); }); for (const fn of ticks) fn(dt, tt); };
  it.knobPath = () => [V(-0.45, 1.0, -0.42), V(0.45, 1.0, -0.42)];
  it.at = { bottle: () => g.localToWorld(bottle.position.clone()), bag: () => g.localToWorld(bag.position.clone()), log: () => g.localToWorld(V(-0.15, 0.2, Z - 0.35)) };
  apply(); it.say([`${w_('Week')} 0`], '#ffffff');
  return done1(it, { height: 0.4, radius: 1.2 });
}
export function bindFloorHands(ff, knob, app, s = { w4: 1, w8: 2 }, done = {}) {
  const sync = slideKnob(knob, { path: () => ff.knobPath(), active: () => (stepNow(app, s.w4) || stepNow(app, s.w8)), keepVisible: () => app.runner.i === s.w4 || app.runner.i === s.w8, k: () => ff.wk / 8,
    set: (k) => { const lim = app.runner.i === s.w4 ? 4 : 8; ff.setWeek(Math.min(lim, Math.round(k * 80) / 10)); if (ff.wk >= 4 && app.runner.i === s.w4 && done.w4) done.w4(); if (ff.wk >= 8 && done.w8) done.w8(); } });
  const s0 = ff.setWeek; ff.setWeek = (w) => { s0(w); sync(); };
}

// ------------------------------------------------------------------ Class 6: living or non-living? two baskets on the table
const weave = () => T.weave || (T.weave = tex(256, 128, (x) => { x.fillStyle = '#8a5a2b'; x.fillRect(0, 0, 256, 128); for (let i = 0; i < 16; i++) for (let j = 0; j < 8; j++) { x.fillStyle = (i + j) % 2 ? '#c9965a' : '#a8743f'; x.fillRect(i * 16 + 1, j * 16 + 1, 14, 14); } }, [3, 1]));
export function sortBaskets(o = {}) {
  const it = new Item('bsort', { ...o, name: { en: 'Two baskets', hi: 'दो टोकरियाँ', hg: 'Do tokriyan' } });
  const g = it.g, w_ = o.W || ((k) => k);
  const mk = (x, label, c) => { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.16, 0.14, 32, 1, true), new THREE.MeshStandardMaterial({ map: weave(), roughness: 0.9, side: THREE.DoubleSide })); b.position.set(x, 0.07, 0); b.castShadow = true; g.add(b);
    const bot = new THREE.Mesh(new THREE.CircleGeometry(0.16, 32).rotateX(-Math.PI / 2), M(0x7a4f25, 0.9)); bot.position.set(x, 0.003, 0); g.add(bot);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.01, 8, 40), M(0x6b4320, 0.8)); rim.rotation.x = Math.PI / 2; rim.position.set(x, 0.14, 0); g.add(rim);
    const s = tag(w_(label), c, 0.07, 'rgba(12,16,24,0.85)'); s.position.set(x, 0.3, 0); g.add(s); return b; };
  mk(-0.5, 'Living', '#8be07a'); mk(0.5, 'Non-living', '#9ec9ff');
  it.basket = (i) => g.localToWorld(V(i ? 0.5 : -0.5, 0.05, 0)); it.count = [0, 0];
  const rd = liveSign(0.13, 3.8); rd.position.set(0, 0.62, -0.15); g.add(rd); it.say = (l, c) => rd.set(l, c);
  it.say([w_('Living or non-living?')], '#ffffff');
  return done1(it, { height: 0.15, radius: 0.7 });
}
// each thing: { it, living: true|false, why }. done.sorted(thing) when it is put in the right basket.
export function bindSortHands(bk, things, app, steps, o = {}) {
  const put = (t, cb) => { t.placed = true; const i = t.living ? 0 : 1, n = bk.count[i]++; const p = bk.basket(i).add(V(((n % 3) - 1) * 0.09, 0.02 + Math.floor(n / 3) * 0.04, ((n * 7) % 3 - 1) * 0.06)); flyTo(t, p, 0, 0.8, cb); };
  for (const t of things) {
    t.dragLift = Math.max(0.06, BENCH_Y + 0.12 - t.g.position.y);
    t.onRelease = () => { if (t.placed) return; const p = t.g.getWorldPosition(V(0, 0, 0)); const d = [0, 1].map((i) => { const b = bk.basket(i); return Math.hypot(p.x - b.x, p.z - b.z); }); const near = d[0] < 0.3 ? 0 : d[1] < 0.3 ? 1 : -1;
      const now = steps.findIndex((s) => s === app.runner.i), mine = things.indexOf(t) === now && stepNow(app, app.runner.i);
      if (near >= 0 && (near === 0) === t.living && mine) { put(t, () => o.sorted && o.sorted(t)); return; }
      if (near >= 0 && o.wrong) o.wrong(t, near === 0);
      flyTo(t, t.home.p.clone(), new THREE.Euler().setFromQuaternion(t.home.q).y, 0.8); };
  }
  return { put };
}

// ------------------------------------------------------------------ small things to sort (drawn here, or real scans)
const stoneTex = () => T.stone || (T.stone = tex(128, 128, (x) => { const r = rnd(61); x.fillStyle = '#857d70'; x.fillRect(0, 0, 128, 128); for (let i = 0; i < 900; i++) { const v = r(); x.fillStyle = v < 0.5 ? 'rgba(60,55,48,0.35)' : 'rgba(190,180,165,0.35)'; x.fillRect(r() * 128, r() * 128, 1 + r() * 2, 1 + r() * 2); } x.fillStyle = 'rgba(90,120,60,0.45)'; for (let i = 0; i < 60; i++) { x.beginPath(); x.arc(r() * 128, r() * 40, 2 + r() * 5, 0, TAU); x.fill(); } }));
export function stoneGroup() { const g = new THREE.Group(); const sg = new THREE.DodecahedronGeometry(0.06, 1); const p = sg.attributes.position; const r = rnd(7); for (let i = 0; i < p.count; i++) { const k = 0.85 + r() * 0.25; p.setXYZ(i, p.getX(i) * k * 1.3, p.getY(i) * k * 0.75, p.getZ(i) * k); } sg.computeVertexNormals();
  const m = new THREE.Mesh(sg, new THREE.MeshStandardMaterial({ map: stoneTex(), roughness: 0.9 })); m.position.y = 0.04; m.castShadow = m.receiveShadow = true; m.userData.noHit = true; g.add(m); return g; }
export function bottleGroup() { const g = new THREE.Group(); const pts = [[0, 0], [0.034, 0.002], [0.036, 0.02], [0.034, 0.16], [0.03, 0.18], [0.013, 0.215], [0.012, 0.235]].map(([a, b]) => new THREE.Vector2(a, b));
  const b = new THREE.Mesh(new THREE.LatheGeometry(pts, 24), new THREE.MeshStandardMaterial({ color: 0xcfe8f2, roughness: 0.08, transparent: true, opacity: 0.55, depthWrite: false })); b.userData.noHit = true; g.add(b);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.016, 16), M(0x2a6fd6, 0.4)); cap.position.y = 0.243; cap.userData.noHit = true; g.add(cap);
  const lab = new THREE.Mesh(new THREE.CylinderGeometry(0.0355, 0.0355, 0.06, 24, 1, true), new THREE.MeshStandardMaterial({ map: tex(256, 64, (x) => { x.fillStyle = '#1d5fb8'; x.fillRect(0, 0, 256, 64); x.fillStyle = '#fff'; x.font = `800 30px ${FONT}`; x.fillText('AQUA', 70, 42); }), roughness: 0.5 })); lab.position.y = 0.1; lab.userData.noHit = true; g.add(lab); return g; }
export function potFern() { const g = new THREE.Group(); const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.055, 0.1, 24), new THREE.MeshStandardMaterial({ color: 0xa8552e, roughness: 0.85 })); pot.position.y = 0.05; pot.castShadow = true; pot.userData.noHit = true; g.add(pot);
  const soil = new THREE.Mesh(new THREE.CircleGeometry(0.07, 20).rotateX(-Math.PI / 2), M(0x3a2a1a, 1)); soil.position.y = 0.098; g.add(soil); const f = ecoModel('fern_02', { k: 0.17 }); f.position.set(0.03, 0.098, 0.02); g.add(f); return g; }
