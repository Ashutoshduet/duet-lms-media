// DUET Science Lab 360, batch BW5, part 2: heredity and evolution. Mendel's pea crosses in a field (the student removes
// the anthers, carries the pollen, sows and counts; every seed and plant of F1 and F2 comes from a real random draw of
// the gametes), beetles and crows on a green and a brown plot (natural selection over generations), and the variation in
// a class (heights read off a wall chart, ear lobes sorted). Shared pieces are in lifeworld1.js.
import * as THREE from 'three';
import { Item } from './apparatus.js';
import { clamp01, ease } from './mathlab2.js';
import { pushKnob } from './mathworld3.js';
import { liveSign } from './mathworld4.js';
import { tag, animator, rnd, tex, noHit, stepNow, V, FONT } from './mathworld_j1.js';
import { ECO, ecoLoad, mergeGeoms } from './bioworld1.js';
import { carry } from './bioworld4.js';
import { btex } from './biobench2.js';
import { lm, oModel, zoomBubble, thing, spot, done1, dryLand, clock, flyT } from './oceanworld1.js';
import { BENCH_Y } from './room.js';
import { LITE } from './lite.js';
import { TAU, N3, lerp, smooth, ang, box, lath, holder, cardTex, labelCard, bindCalendar, leafQuad, mergeGeomsUV, matCache } from './lifeworld1.js';

const Y = BENCH_Y;
const T = {};
const rand = () => { try { const a = new Uint32Array(1); crypto.getRandomValues(a); return a[0] / 4294967296; } catch (e) { return Math.random(); } };

// ------------------------------------------------------------------ a pea plant (procedural; the leaflets are a real leaf photo)
// Pisum sativum: a weak stem that climbs with tendrils, compound leaves (two or three pairs of leaflets, the end ones
// turned into tendrils, two big leafy stipules where the leaf joins the stem), white flowers, green pods. Tall plants
// (gene T) are about 1.5 m; dwarf plants (tt) about 0.4 m. Built as four merged meshes: stem and tendrils, leaflets,
// flowers, pods.
const peaLeafM = () => matCache('pealeaf', () => { const m = lm({ map: btex('leaf_ovate'), color: 0xa9c79a, emissive: 0x1a2a18, side: THREE.DoubleSide }); m.alphaTest = 0.45; return m; });
const peaStemM = () => matCache('peastem', () => lm({ color: 0x8fb06a }));
const peaFlowerM = () => matCache('peaflower', () => lm({ color: 0xf6f3ea, emissive: 0x2a2a26, side: THREE.DoubleSide }));
const podM = () => matCache('peapod', () => lm({ map: T.pod || (T.pod = tex(64, 128, (x) => { const g = x.createLinearGradient(0, 0, 64, 0); g.addColorStop(0, '#5f8f3a'); g.addColorStop(0.5, '#8fbf5a'); g.addColorStop(1, '#5f8f3a'); x.fillStyle = g; x.fillRect(0, 0, 64, 128); })) }));
export function peaGeoms(tall, seed = 1, o = {}) {
  const r = rnd(seed); const H = tall ? 1.45 : 0.38; const nodes = tall ? 14 : 7; const stem = [], tend = [], leaves = [], flowers = [], pods = [], fl = [];
  let p = V(0, 0, 0); const pts = [p.clone()];
  for (let i = 1; i <= nodes; i++) { const q = V(Math.sin(i * 1.7) * 0.012, H * i / nodes, Math.cos(i * 1.3) * 0.012); pts.push(q); }
  const curve = new THREE.CatmullRomCurve3(pts); stem.push(new THREE.TubeGeometry(curve, nodes * 3, tall ? 0.0035 : 0.004, 5, false));
  for (let i = 1; i <= nodes; i++) { const at = pts[i]; const a = i * 2.4 + r() * 0.4; const dir = V(Math.cos(a), 0.35, Math.sin(a)).normalize(); const L = (tall ? 0.16 : 0.13) * (0.7 + 0.3 * Math.sin(Math.PI * i / nodes));
    // stipules: two big leafy ears hugging the stem
    for (const sd of [-1, 1]) { const q = leafQuad(0.045, 0.035, { fold: 0.2, arch: 0.05 }); q.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), V(Math.cos(a + sd * 1.2), 0.5, Math.sin(a + sd * 1.2)).normalize())); q.translate(at.x, at.y - 0.01, at.z); leaves.push(q); }
    // the leaf stalk with two pairs of leaflets and tendrils at the end
    const end = at.clone().addScaledVector(dir, L); stem.push(new THREE.TubeGeometry(new THREE.LineCurve3(at, end), 2, 0.0012, 4, false));
    for (let k = 0; k < 2; k++) { const c = at.clone().lerp(end, 0.35 + k * 0.35); for (const sd of [-1, 1]) { const side = V(Math.cos(a + sd * Math.PI / 2), 0.15, Math.sin(a + sd * Math.PI / 2)).normalize(); const q = leafQuad(0.04, 0.026, { fold: 0.25, arch: 0.1 }); q.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), side)); q.translate(c.x, c.y, c.z); leaves.push(q); } }
    for (let k = 0; k < 3; k++) { const tp = []; for (let j = 0; j <= 8; j++) { const t = j / 8; tp.push(end.clone().addScaledVector(dir, t * 0.06).add(V(Math.cos(t * 9 + k * 2) * 0.008 * t, Math.sin(t * 9 + k) * 0.008 * t + t * 0.01, Math.sin(t * 7 + k) * 0.008 * t))); } tend.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(tp), 10, 0.0005, 3, false)); }
    // flowers (and later pods) from the upper nodes
    if (i > nodes * (tall ? 0.55 : 0.4) && i % 2 === 0) { const fp = at.clone().addScaledVector(V(Math.cos(a + 2), 0.2, Math.sin(a + 2)).normalize(), 0.05); fl.push({ p: fp, a: a + 2 });
      const fg = peaFlowerGeo(); fg.applyAxisAngle(V(0, 1, 0), -(a + 2)); fg.translate(fp.x, fp.y, fp.z); flowers.push(fg);
      const pg = new THREE.CylinderGeometry(0.007, 0.0045, 0.075, 7, 1).rotateZ(Math.PI / 2 - 0.4).scale(1, 1, 0.6); pg.applyAxisAngle(V(0, 1, 0), -(a + 2)); pg.translate(fp.x, fp.y - 0.03, fp.z); pods.push(pg); } }
  return { stem: mergeGeoms([...stem, ...tend]), leaves: mergeGeomsUV(leaves), flowers: flowers.length ? mergeGeoms(flowers) : null, pods: pods.length ? mergeGeomsUV(pods) : null, fl, H };
}
// a pea flower: a big upright standard petal, two wings, a keel (a butterfly-like flower, about 2 cm)
function peaFlowerGeo(sz = 1) { const s = 0.018 * sz; const parts = [];
  const std = new THREE.SphereGeometry(s * 0.6, 8, 6, 0, Math.PI, 0, Math.PI).scale(1, 1.05, 0.25).rotateY(Math.PI / 2).translate(-s * 0.1, s * 0.35, 0); parts.push(std);
  for (const sd of [-1, 1]) parts.push(new THREE.SphereGeometry(s * 0.32, 6, 5).scale(1, 0.7, 0.45).translate(s * 0.15, s * 0.05, sd * s * 0.18));
  parts.push(new THREE.SphereGeometry(s * 0.25, 6, 5).scale(1.4, 0.6, 0.6).translate(s * 0.3, 0, 0));
  parts.push(new THREE.CylinderGeometry(s * 0.04, s * 0.04, s * 0.6, 4).rotateZ(Math.PI / 2).translate(-s * 0.4, -s * 0.1, 0)); return mergeGeoms(parts); }
export function peaMesh(tall, seed = 1) { const G = peaGeoms(tall, seed); const g = new THREE.Group(); const add = (geo, m) => { if (!geo) return null; const x = new THREE.Mesh(geo, m); x.castShadow = !LITE; x.receiveShadow = true; x.userData.noHit = true; g.add(x); return x; };
  add(G.stem, peaStemM()); add(G.leaves, peaLeafM()); g.userData.flowers = add(G.flowers, peaFlowerM()); g.userData.pods = add(G.pods, podM()); if (g.userData.pods) g.userData.pods.visible = false; g.userData.fl = G.fl; g.userData.H = G.H; return g; }
// many plants of two kinds (tall, dwarf) as instanced meshes: four draw calls for each kind, however many plants
export function peaBed(n, o = {}) {
  const g = new THREE.Group(); const kinds = {}; for (const tall of [true, false]) { const G = peaGeoms(tall, tall ? 7 : 9); kinds[tall] = ['stem', 'leaves', 'flowers', 'pods'].map((k, j) => { if (!G[k]) return null; const im = new THREE.InstancedMesh(G[k], [peaStemM(), peaLeafM(), peaFlowerM(), podM()][j], n); im.count = 0; im.frustumCulled = false; im.userData.noHit = true; im.castShadow = false; im.receiveShadow = true; g.add(im); return im; }); }
  const dm = new THREE.Object3D();
  g.userData.set = (list, grow = 1) => { const c = { true: 0, false: 0 }; for (const it of list) { const k = kinds[it.tall]; dm.position.copy(it.p); dm.rotation.set(0, it.rot || 0, 0); dm.scale.set(1, Math.max(0.02, grow), 1); dm.updateMatrix(); const i = c[it.tall]++; for (const im of k) if (im) im.setMatrixAt(i, dm.matrix); }
    for (const tall of [true, false]) for (const im of kinds[tall]) if (im) { im.count = c[tall]; im.instanceMatrix.needsUpdate = true; } };
  g.userData.showPods = (on) => { for (const tall of [true, false]) { const k = kinds[tall]; if (k[3]) k[3].visible = on; if (k[2]) k[2].visible = !on; } };
  return g; }
// a pea seed: round (R) smooth, or wrinkled (rr): its starch is low, so it loses water and wrinkles as it dries
const seedGeo = (wr) => { const k = 'seed' + wr; if (T[k]) return T[k]; const g = new THREE.SphereGeometry(0.0042, 14, 10); if (wr) { const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const v = V(p.getX(i), p.getY(i), p.getZ(i)); const n = 1 - 0.12 * Math.abs(Math.sin(v.x * 2100) * Math.sin(v.y * 1800 + v.z * 900)) - 0.08 * Math.abs(Math.sin(v.z * 2500)); v.multiplyScalar(n); v.y *= 0.85; p.setXYZ(i, v.x, v.y, v.z); } } g.computeVertexNormals(); T[k] = g; return g; };
const seedM = (wr) => matCache('seed' + wr, () => lm({ color: wr ? 0xb5b46a : 0xc9c77a }));
export function seedHeap(list, o = {}) { const g = new THREE.Group(); const r = rnd(o.seed || 3); for (const wr of [false, true]) { const L = list.filter((s) => s.wr === wr); if (!L.length) continue; const im = new THREE.InstancedMesh(seedGeo(wr), seedM(wr), L.length); const dm = new THREE.Object3D();
    L.forEach((s, i) => { const a = r() * TAU, d = Math.sqrt(r()) * (o.R || 0.03); dm.position.set((wr ? 1 : -1) * (o.split || 0) + Math.cos(a) * d, 0.004, Math.sin(a) * d); dm.rotation.set(r() * 3, r() * 3, r() * 3); dm.updateMatrix(); im.setMatrixAt(i, dm.matrix); }); im.userData.noHit = true; g.add(im); } return g; }

// ------------------------------------------------------------------ Class 10: Mendel's crosses in a pea field
// A wooden table in a field. On the ground at the left, a tall pea plant with round seeds (TT RR) in a big clay pot,
// staked; on the table, a dwarf plant with wrinkled seeds (tt rr). On the table: forceps, a fine brush, four small pots,
// a seed tray; on the ground in front, a bed for the second generation. A calendar knob moves the weeks on.
export function mendelField(o = {}) {
  const it = new Item('bwmendel', { ...o, name: N3('Pea plants for a cross', 'संकरण के लिए मटर के पौधे', 'Cross ke liye matar ke paudhe') });
  const g = it.g, w_ = o.W || ((k) => k), ticks = []; dryLand();
  const clay = lm({ color: 0xa65a34 }), soilM = lm({ color: 0x4a3524 });
  const pot = (r, h) => { const p = holder(lath([[0, 0], [r * 0.75, 0], [r, h], [r * 1.04, h], [r * 0.98, h * 0.98], [r * 0.73, 0.01], [0, 0.01]], clay, 20)); const s = new THREE.Mesh(new THREE.CircleGeometry(r * 0.96, 20).rotateX(-Math.PI / 2), soilM); s.position.y = h * 0.9; p.add(s); return p; };
  // the parents
  const PT = V(-1.55, 0, -0.75), PS = V(-0.55, Y, -0.8); const potT = pot(0.16, 0.24); potT.position.copy(PT); g.add(potT); const potS = pot(0.1, 0.14); potS.position.copy(PS); g.add(potS);
  const tall = peaMesh(true, 3); tall.position.copy(PT).add(V(0, 0.22, 0)); g.add(tall); const dwarf = peaMesh(false, 5); dwarf.position.copy(PS).add(V(0, 0.13, 0)); g.add(dwarf);
  const stake = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.009, 1.6, 6), lm({ color: 0xb79d6a })); stake.position.copy(PT).add(V(0.03, 0.8, 0)); g.add(stake);
  it.tall = tall; it.dwarf = dwarf;
  // the two flowers worked on: big enough to see in the bubble, with ten anthers and a stigma
  const focus = (plant, base, k) => { const f = plant.userData.fl[Math.min(plant.userData.fl.length - 1, k)]; const p = f.p.clone().add(base); const grp = new THREE.Group(); grp.position.copy(p); g.add(grp);
    const anthers = new THREE.Group(); for (let i = 0; i < 10; i++) { const a = new THREE.Mesh(new THREE.SphereGeometry(0.0011, 6, 4).scale(1, 1.5, 1), lm({ color: 0xf0c020, emissive: 0x302000 })); a.position.set(0.006 + (i % 5) * 0.0012, 0.003 + Math.floor(i / 5) * 0.0018, ((i % 5) - 2) * 0.0012); anthers.add(a); } grp.add(anthers);
    const stig = new THREE.Mesh(new THREE.SphereGeometry(0.0013, 6, 4), lm({ color: 0xc8d8a0 })); stig.position.set(0.009, 0.005, 0); grp.add(stig);
    const bag = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.035, 0.09, 12, 1, true), lm({ color: 0xd9c9a3, side: THREE.DoubleSide })); bag.position.set(0.0, 0.0, 0); bag.visible = false; grp.add(bag);
    grp.userData = { anthers, stig, bag, p }; noHit(grp); return grp; };
  it.fT = focus(tall, tall.position, 3); it.fS = focus(dwarf, dwarf.position, 1);
  // the F1 pots and the F2 bed
  it.f1Pots = [0, 1, 2, 3].map((i) => { const p = pot(0.07, 0.11); p.position.set(0.25 + i * 0.2, Y, -0.85); g.add(p); return p.position.clone().add(V(0, 0.1, 0)); });
  const f1 = [0, 1, 2, 3].map((i) => { const gt = new THREE.Group(); gt.position.copy(it.f1Pots[i]); g.add(gt); return gt; }); it.f1 = f1;
  const bedC = V(0.55, 0, 0.1), bedW = 1.6, bedD = 0.8; const bed = new THREE.Mesh(new THREE.BoxGeometry(bedW, 0.08, bedD), lm({ map: T.bed || (T.bed = tex(256, 128, (x) => { x.fillStyle = '#4f3a26'; x.fillRect(0, 0, 256, 128); const q = rnd(4); for (let i = 0; i < 900; i++) { x.fillStyle = `rgba(${q() < 0.5 ? '30,20,10' : '110,90,60'},0.45)`; x.beginPath(); x.arc(q() * 256, q() * 128, 1 + q() * 2, 0, TAU); x.fill(); } })) }));
  bed.position.copy(bedC).add(V(0, 0.04, 0)); bed.receiveShadow = true; g.add(bed); it.bedAt = () => bedC.clone().add(V(0, 0.09, 0));
  const f2 = peaBed(64); g.add(f2); it.f2bed = f2;
  // the seed tray (counts)
  it.trayAt = () => V(-0.1, Y + 0.01, -0.55); const tray = box(0.24, 0.012, 0.14, lm({ color: 0xe6e2d6 }), -0.1, Y + 0.006, -0.55); g.add(tray);
  const sign = liveSign(0.085, 5.2); sign.position.set(0.1, Y + 0.95, -1.3); g.add(sign); it.say = (l, c) => sign.set(l, c);
  const bub = zoomBubble({ at: V(-0.9, Y + 0.62, -0.55), r: 0.14, hide: [sign] }); g.add(bub); it.bubble = bub;
  // the Punnett square board (filled in at the end)
  const pb = new THREE.Group(); pb.position.set(1.0, Y + 0.45, -1.1); pb.rotation.y = -0.35; g.add(pb); const pC = document.createElement('canvas'); pC.width = 512; pC.height = 512; const pT = new THREE.CanvasTexture(pC); pT.colorSpace = THREE.SRGBColorSpace;
  const pm = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.5), new THREE.MeshBasicMaterial({ map: pT, toneMapped: false })); pb.add(pm); pb.visible = false; it.pBoard = pb; it.pC = pC; it.pT = pT;
  it.slots = { top: [V(0.98, Y + 0.68, -1.03), V(1.1, Y + 0.68, -1.08)], side: [V(0.78, Y + 0.48, -0.98), V(0.78, Y + 0.38, -0.98)] };
  // ---- genetics, worked out from what the student did
  it.emasc = false; it.pollen = null; it.brush = null; it.bagged = false; it.t = 0; it.tMax = 30; it.phase = 'cross';
  // the cross: if the anthers were left in, the bud has pollinated itself before it opened (peas do this)
  it.crossKind = () => (!it.emasc ? 'self' : it.pollen === 'tall' ? 'hybrid' : 'none');
  const gam = (g1) => g1[Math.floor(rand() * 2)];
  it.f1Seeds = []; it.f2Seeds = []; it.f2Plants = [];
  it.makeF1 = () => { const k = it.crossKind(); it.f1Seeds = k === 'none' ? [] : Array.from({ length: 6 }, () => (k === 'hybrid' ? { T: 'Tt', R: 'Rr' } : { T: 'tt', R: 'rr' })).map((s) => ({ ...s, wr: s.R === 'rr', tall: s.T !== 'tt' })); return it.f1Seeds; };
  it.makeF2 = () => { // each F1 plant pollinates itself: each seed gets one gene from the egg and one from the pollen, at random
    const par = it.f1Seeds.slice(0, 4); it.f2Seeds = []; for (const P of par) for (let k = 0; k < 10; k++) { const t = gam(P.T) + gam(P.T), rr = gam(P.R) + gam(P.R); it.f2Seeds.push({ T: t, R: rr, wr: rr === 'rr', tall: t !== 'tt' }); } return it.f2Seeds; };
  it.counts = () => { const s = it.f2Seeds; const c = { round: s.filter((x) => !x.wr).length, wr: s.filter((x) => x.wr).length, tall: s.filter((x) => x.tall).length, short: s.filter((x) => !x.tall).length };
    c.TR = s.filter((x) => x.tall && !x.wr).length; c.Tr = s.filter((x) => x.tall && x.wr).length; c.tR = s.filter((x) => !x.tall && !x.wr).length; c.tr = s.filter((x) => !x.tall && x.wr).length; return c; };
  it.knobPath = () => [V(0.35, Y + 0.02, -0.45), V(0.95, Y + 0.02, -0.45)];
  it.pod = null; it.heaps = [];
  it.setT = (t) => { it.t = Math.max(0, Math.min(it.tMax, t)); const k = it.t;
    if (it.phase === 'cross') { const pods = it.dwarf.userData.pods; const ok = it.crossKind() !== 'none'; it.fS.visible = k < 1; if (pods) { pods.visible = k > 1; } if (it.podG) { it.podG.visible = ok && k > 1; it.podG.scale.setScalar(clamp01(k / 3)); } }
    else if (it.phase === 'f1') { f1.forEach((gt, i) => { const s = it.f1Seeds[i]; if (!s) return; if (!gt.userData.p) { const pm = peaMesh(s.tall, 11 + i); gt.add(pm); gt.userData.p = pm; } gt.userData.p.scale.set(1, Math.max(0.02, clamp01(k / 9)), 1); gt.userData.p.visible = k > 0.3; }); }
    else if (it.phase === 'f1pods') { f1.forEach((gt) => { const p = gt.userData.p; if (p && p.userData.pods) { p.userData.pods.visible = k > 1; if (p.userData.flowers) p.userData.flowers.visible = k < 1; } }); }
    else if (it.phase === 'f2') { f2.userData.set(it.f2Plants, clamp01(k / 9)); }
    const wk = Math.floor(it.t); it.say([`${w_(PH[it.phase])} · ${w_('week')} ${wk}`, it.statusLine ? it.statusLine() : ''], ['#ffffff', '#ffd23f']); };
  const PH = { cross: 'The cross', f1: 'First generation (F1)', f1pods: 'F1 plants set seed', f2: 'Second generation (F2)' };
  it.limFor = (i) => (it.lims ? it.lims[i] ?? it.tMax : it.tMax);
  animator(it); const up0 = it.update;
  it.update = (dt, tt) => { up0(dt); for (const f of ticks) f(dt || 0.016, tt); };
  it.views = { all: { p: V(-0.4, 1.7, 0.9), t: V(-0.5, 0.9, -0.8) }, flowers: { p: V(-0.95, 1.55, 0.25), t: V(-1.0, 1.15, -0.8) }, table: { p: V(0.2, 1.55, 0.4), t: V(0.3, Y, -0.75) }, bed: { p: V(0.4, 1.8, 1.3), t: V(0.55, 0.2, 0.0) }, board: { p: V(0.6, 1.55, 0.5), t: V(0.95, Y + 0.45, -1.1) } };
  it.say([w_('Pure-breeding parents: tall with round seeds, dwarf with wrinkled seeds')], '#ffffff');
  return done1(it, { height: 1.5, radius: 1.8 });
}
// the pod on the dwarf plant (the cross) and its seeds
export function podThing(label) { const g = new THREE.Group(); const m = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.006, 0.085, 10, 1).rotateZ(Math.PI / 2).scale(1, 1, 0.65), podM()); m.position.y = 0.008; g.add(m); const it = thing(label, g, { hitR: 0.06, hitY: 0.01, kind: 'peapod' }); it.podMesh = m; return it; }
export function bindMendel(mf, th, app, s, done = {}) {
  const busy = () => mf.busy;
  const touch = (tool, at, sec, mid, cb) => { mf.busy = true; tool.flying = true; const p0 = tool.g.position.clone(); let k = 0, fired = false; const dt = clock(); const go = () => { k = Math.min(1, k + dt() / sec); tool.g.position.lerpVectors(p0, at, ease(clamp01(k / 0.35))); if (k > 0.75) tool.g.position.lerpVectors(at, tool.home.p, ease((k - 0.75) / 0.25)); if (k > 0.45 && !fired) { fired = true; mid(); }
      if (k < 1) requestAnimationFrame(go); else { tool.flying = false; tool.placed = false; mf.busy = false; if (cb) cb(); } }; go(); };
  // forceps: the anthers of whichever flower they are taken to come out
  mf.emasculate = (which, cb) => { if (busy()) return false; const F = which === 'tall' ? mf.fT : mf.fS; touch(th.forceps, F.userData.p.clone().add(V(0.01, 0.01, 0.02)), 2.4, () => { F.userData.anthers.visible = false; if (which === 'dwarf') mf.emasc = true; else mf.tallEmasc = true; mf.bubble.look(F.userData.p.clone().add(V(0.006, 0.004, 0)), F.userData.p.clone().add(V(0.03, 0.03, 0.05)), mf.W('Anthers removed: the flower can no longer pollinate itself')); }, () => { if (done.emasc) done.emasc(which); if (cb) cb(); }); return true; };
  // the brush: it picks up pollen from a flower that still has anthers, and leaves it on the next stigma it touches
  mf.brushTo = (which, cb) => { if (busy()) return false; const F = which === 'tall' ? mf.fT : mf.fS; touch(th.brush, F.userData.p.clone().add(V(0.012, 0.008, 0.02)), 2.2, () => {
      if (F.userData.anthers.visible) { mf.brush = which; th.brush.tipM.color.set(0xf0c020); mf.bubble.look(F.userData.p.clone().add(V(0.006, 0.004, 0)), F.userData.p.clone().add(V(0.03, 0.03, 0.05)), mf.W(which === 'tall' ? 'Yellow pollen from the tall plant\'s anthers on the brush' : 'Pollen from the dwarf plant\'s own anthers')); }
      else if (mf.brush) { if (which === 'dwarf') { mf.pollen = mf.brush; F.userData.stig.material = lm({ color: 0xf0c020 }); F.userData.bag.visible = true; mf.bagged = true; } mf.bubble.look(F.userData.p.clone().add(V(0.009, 0.005, 0)), F.userData.p.clone().add(V(0.025, 0.03, 0.04)), mf.W('Pollen dusted on the stigma; the flower is bagged so no other pollen can reach it')); }
      else mf.bubble.look(F.userData.p.clone(), F.userData.p.clone().add(V(0.03, 0.03, 0.05)), mf.W('The brush has no pollen on it yet')); }, () => { if (done.brush) done.brush(which); if (cb) cb(); }); return true; };
  carry(th.forceps, [['tall', mf.fT], ['dwarf', mf.fS]].map(([w, F]) => ({ at: () => F.userData.p.clone(), r: 0.12, open: () => stepNow(app, s.emasc) && !busy(), put: () => mf.emasculate(w) })), { carryY: 1.25 });
  carry(th.brush, [['tall', mf.fT], ['dwarf', mf.fS]].map(([w, F]) => ({ at: () => F.userData.p.clone(), r: 0.12, open: () => stepNow(app, s.pollinate) && !busy(), put: () => mf.brushTo(w) })), { carryY: 1.25 });
  // the pod of the cross: it grows on the dwarf plant; when ripe it is picked and opened in the tray
  const pg = new THREE.Group(); const pm = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.005, 0.07, 10).rotateZ(Math.PI / 2 - 0.3).scale(1, 1, 0.65), podM()); pg.add(pm); pg.position.copy(mf.fS.userData.p).add(V(0.01, -0.03, 0)); pg.visible = false; mf.g.add(pg); mf.podG = pg;
  mf.openPod = (cb) => { const seeds = mf.makeF1(); mf.bubble.look(mf.trayAt().add(V(0, 0.01, 0)), mf.trayAt().add(V(0.03, 0.12, 0.12)), mf.W(!seeds.length ? 'No pod: the flower was never pollinated' : seeds[0].wr ? 'All the seeds are wrinkled' : 'All the seeds are round'));
    if (seeds.length) { const h = seedHeap(seeds, { R: 0.025 }); h.position.copy(mf.trayAt()); mf.g.add(h); mf.heaps.push(h); mf.f1Heap = h; } pg.visible = false; if (cb) cb(); };
  // sowing: the F1 seeds go into the four pots; the F2 seeds into the bed
  mf.sowF1 = (cb) => { if (mf.f1Heap) mf.f1Heap.visible = false; mf.phase = 'f1'; mf.t = 0; mf.sownF1 = true; mf.setT(0); if (cb) cb(); };
  mf.shell = (cb) => { const s2 = mf.makeF2(); const c = mf.counts(); if (mf.f2Heap) mf.g.remove(mf.f2Heap); const h = seedHeap(s2, { R: 0.03, split: 0.05 }); h.position.copy(mf.trayAt()); mf.g.add(h); mf.f2Heap = h;
    const tg = mf.tagR || (mf.tagR = tag('', '#ffd23f', 0.04)); tg.position.copy(mf.trayAt()).add(V(0, 0.08, 0)); mf.g.add(tg); tg.setText(`${c.round} : ${c.wr}`);
    mf.f1.forEach((gt) => { const p = gt.userData.p; if (p && p.userData.pods) p.userData.pods.visible = false; });
    mf.bubble.look(mf.trayAt().add(V(0, 0.01, 0)), mf.trayAt().add(V(0.0, 0.14, 0.13)), `${mf.W('Round')}: ${c.round} · ${mf.W('Wrinkled')}: ${c.wr}`); if (cb) cb(); };
  mf.sowF2 = (cb) => { if (mf.f2Heap) mf.f2Heap.visible = false; if (mf.tagR) mf.tagR.visible = false; const c0 = mf.bedAt(); const n = mf.f2Seeds.length, cols = 10; mf.f2Plants = mf.f2Seeds.map((sd, i) => ({ ...sd, p: c0.clone().add(V(-0.7 + (i % cols) * 0.155, -0.01, -0.3 + Math.floor(i / cols) * 0.2)), rot: (i * 2.3) % TAU })); void n; mf.phase = 'f2'; mf.t = 0; mf.setT(0); if (cb) cb(); };
  carry(th.pod, [{ at: () => mf.trayAt(), r: 0.14, open: () => stepNow(app, s.open), put: (x) => { x.g.visible = false; mf.openPod(() => done.opened && done.opened()); } }], { carryY: Y + 0.15 });
  carry(th.seedsF1, mf.f1Pots.map((p) => ({ at: () => p.clone(), r: 0.2, open: () => stepNow(app, s.sow1) && !mf.sownF1, put: () => mf.sowF1(() => done.sown && done.sown()) })), { carryY: Y + 0.15 });
  carry(th.seedsF2, [{ at: () => mf.bedAt(), r: 0.6, open: () => stepNow(app, s.sow2), put: () => mf.sowF2(() => done.sown && done.sown()) }], { carryY: Y + 0.15 });
  pushKnob(th.shellBtn, { path: () => [th.shellBtn.home.p.clone(), th.shellBtn.home.p.clone().add(V(0, 0, -0.05))], active: () => stepNow(app, s.shell) && !mf.f2Seeds.length, keepVisible: () => app.runner.i === s.shell, press: () => mf.shell(() => done.shelled && done.shelled()) });
  // the calendar: the cross's pod (4 weeks), the F1 plants (9 weeks, then 4 more for their pods), the F2 plants (9 weeks)
  mf.lims = { [s.w4]: 4, [s.grow1]: 9, [s.grow2]: 9 };
  bindCalendar(mf, th.knob, app, mf.lims, { end: (i) => done.day && done.day(i) });
  // a new stage starts its own calendar
  const u0 = mf.update; let last = -1; mf.update = (dt, t) => { u0(dt, t); const i = app.runner.i; if (i !== last) { last = i; if (i === s.shell && mf.phase === 'f1') { mf.phase = 'f1pods'; mf.setT(4); } } };
  // the Punnett square: gamete cards
  mf.drawPunnett = () => { const x = mf.pC.getContext('2d'), W = 512; const c = mf.counts(); x.fillStyle = '#fbf8f0'; x.fillRect(0, 0, W, W); x.strokeStyle = '#334'; x.lineWidth = 4;
    const cell = 150, o0 = 110; for (let i = 0; i <= 2; i++) { x.beginPath(); x.moveTo(o0 + i * cell, o0); x.lineTo(o0 + i * cell, o0 + 2 * cell); x.stroke(); x.beginPath(); x.moveTo(o0, o0 + i * cell); x.lineTo(o0 + 2 * cell, o0 + i * cell); x.stroke(); }
    x.fillStyle = '#1d4f9a'; x.font = `800 54px ${FONT}`; x.textAlign = 'center'; x.textBaseline = 'middle'; const gm = mf.f1Seeds[0] ? [mf.f1Seeds[0].T[0], mf.f1Seeds[0].T[1]] : ['t', 't'];
    gm.forEach((a, i) => { x.fillText(a, o0 + cell * (i + 0.5), o0 - 45); x.fillText(a, o0 - 45, o0 + cell * (i + 0.5)); });
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) { const gg = [gm[j], gm[i]].sort((p, q) => (p === 'T' ? -1 : q === 'T' ? 1 : 0)).join(''); x.fillStyle = gg.includes('T') ? '#2f7a2a' : '#9a3a1a'; x.font = `800 48px ${FONT}`; x.fillText(gg, o0 + cell * (j + 0.5), o0 + cell * (i + 0.5) - 14); x.font = `600 24px ${FONT}`; x.fillText(gg.includes('T') ? mf.W('tall') : mf.W('dwarf'), o0 + cell * (j + 0.5), o0 + cell * (i + 0.5) + 30); }
    x.fillStyle = '#222'; x.font = `700 28px ${FONT}`; x.fillText(`${mf.W('Expected')} 3 : 1  ·  ${mf.W('You got')} ${c.tall} : ${c.short}`, W / 2, 470); mf.pT.needsUpdate = true; mf.pBoard.visible = true; };
  for (const [k, card] of th.cards.entries()) carry(card, [...mf.slots.top, ...mf.slots.side].map((p, j) => ({ at: () => p.clone(), r: 0.09, open: () => stepNow(app, s.punnett), put: (x) => { x.flying = true; flyT(x, p.clone(), 0, 0.6, () => { x.flying = false; x.slotJ = j; x.home = { p: x.g.position.clone(), q: x.g.quaternion.clone() }; x.placed = false;
    if (th.cards.every((c2) => c2.slotJ != null)) { mf.drawPunnett(); if (done.punnett) done.punnett(); } }); } })), { carryY: Y + 0.6 }); void k;
  mf.statusLine = () => { if (mf.phase === 'cross') return `${mf.W('Anthers removed')}: ${mf.emasc ? mf.W('yes') : mf.W('no')} · ${mf.W('Pollen on the stigma')}: ${mf.pollen ? mf.W(mf.pollen === 'tall' ? 'from the tall plant' : 'from the dwarf plant') : mf.W('none')}`;
    if (mf.phase === 'f2') { const c = mf.counts(); return `${mf.W('Tall')} ${c.tall} · ${mf.W('Dwarf')} ${c.short} · ${mf.W('Round')} ${c.round} · ${mf.W('Wrinkled')} ${c.wr}`; } if (mf.f1Seeds.length) return `${mf.W('F1 seeds')}: ${mf.f1Seeds.length} · ${mf.f1Seeds[0].wr ? mf.W('wrinkled') : mf.W('round')}`; return ''; };
}
// a pair of steel forceps and a fine brush (its tip turns yellow with pollen)
export function forceps() { const g = new THREE.Group(); const st = lm({ color: 0xc9ced3 }); for (const s of [-1, 1]) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.0015, 0.004), st); m.position.set(0, 0.002, s * 0.003); m.rotation.y = s * 0.04; g.add(m); } noHit(g); return g; }
export function fineBrush() { const g = new THREE.Group(); const h = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.004, 0.13, 8).rotateZ(Math.PI / 2), lm({ color: 0x9a3a1a })); h.position.y = 0.004; g.add(h); const tipM = lm({ color: 0xe8e2d0 }); const t = new THREE.Mesh(new THREE.ConeGeometry(0.0035, 0.014, 8).rotateZ(-Math.PI / 2), tipM); t.position.set(0.072, 0.004, 0); g.add(t); g.userData.tipM = tipM; noHit(g); return g; }
export function seedPacket(lines) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.006, 0.09), lm({ map: cardTex(lines, 160, 200, '#efe6cf', '#2b2b2b', 30) })); m.position.y = 0.003; return holder(m); }

// ------------------------------------------------------------------ Class 10: beetles, crows and natural selection
// A dry grassland at noon. In front of the student, two plots: one of fresh green grass, one of bare brown soil with dead
// leaves. A box holds 20 beetles of one species, 10 green and 10 brown (variation). The student lets them go on either
// plot. Each season two crows hunt: a beetle that stands out against the ground is far more likely to be seen and eaten.
// The survivors breed back to 20 beetles; young ones take their parents' colour (now and then a different one appears).
export const SEL = { n: 20, pSeen: 0.55, pHidden: 0.12, mut: 0.03 };
export function beetlePlots(o = {}) {
  const it = new Item('bwsel', { ...o, name: N3('A green plot and a brown plot', 'हरी और भूरी क्यारी', 'Hari aur bhoori kyaari') });
  const g = it.g, w_ = o.W || ((k) => k), ticks = []; dryLand(); const r = rnd(5);
  const P = { green: V(-0.7, 0, -1.25), brown: V(0.7, 0, -1.25) }; it.P = P; const S = 1.1;
  const grT = T.gplot || (T.gplot = tex(256, 256, (x) => { x.fillStyle = '#3f6a26'; x.fillRect(0, 0, 256, 256); const q = rnd(2); for (let i = 0; i < 3000; i++) { x.strokeStyle = `rgba(${60 + q() * 60},${110 + q() * 80},${30 + q() * 30},0.8)`; x.lineWidth = 1; const px = q() * 256, py = q() * 256; x.beginPath(); x.moveTo(px, py); x.lineTo(px + (q() - 0.5) * 4, py - 4 - q() * 6); x.stroke(); } }));
  const brT = T.bplot || (T.bplot = tex(256, 256, (x) => { x.fillStyle = '#6a4c32'; x.fillRect(0, 0, 256, 256); const q = rnd(3); for (let i = 0; i < 1600; i++) { x.fillStyle = `rgba(${q() < 0.5 ? '50,34,20' : '140,105,70'},0.5)`; x.beginPath(); x.arc(q() * 256, q() * 256, 1 + q() * 3, 0, TAU); x.fill(); } for (let i = 0; i < 70; i++) { x.fillStyle = `rgba(${120 + q() * 50},${80 + q() * 30},${40},0.8)`; x.beginPath(); x.ellipse(q() * 256, q() * 256, 6 + q() * 6, 3 + q() * 2, q() * 3, 0, TAU); x.fill(); } }));
  it.plotM = { green: lm({ map: grT }), brown: lm({ map: brT }) };
  const plots = {}; for (const k of ['green', 'brown']) { const m = new THREE.Mesh(new THREE.PlaneGeometry(S, S).rotateX(-Math.PI / 2), it.plotM[k]); m.position.copy(P[k]).add(V(0, 0.006, 0)); m.receiveShadow = true; g.add(m); plots[k] = m;
    const edge = new THREE.Mesh(new THREE.BoxGeometry(S + 0.06, 0.05, S + 0.06), lm({ color: 0x8a6a45 })); edge.position.copy(P[k]).add(V(0, 0.0, 0)); edge.scale.set(1, 1, 1); g.add(edge); }
  for (let i = 0; i < 6; i++) { const m = oModel('grass_medium_02', { k: 0.45 + r() * 0.2, face: [r() - 0.5, r() - 0.5] }); m.position.copy(P.green).add(V((r() - 0.5) * S * 0.85, 0, (r() - 0.5) * S * 0.85)); g.add(m); }
  it.plots = plots; it.ground = { green: 'green', brown: 'brown' }; // what each plot looks like now (a drought turns the green one brown)
  // the beetles: one scan, drawn instanced, tinted green or brown per beetle
  const NB = 40; let im = null; it.bugs = []; const dm = new THREE.Object3D(); const cG = new THREE.Color(0.75, 2.1, 0.55), cB = new THREE.Color(1.7, 1.15, 0.7); // the scan's dark shell, tinted green or brown
  ecoLoad('beetle').then((gl) => { let mesh = null; gl.scene.traverse((x) => { if (x.isMesh && !mesh) mesh = x; }); if (!mesh) return; const geo = mesh.geometry.clone(); for (const k of ['position', 'normal']) { const a = geo.attributes[k]; if (!a || a.array instanceof Float32Array) continue; const f = new Float32Array(a.count * 3); for (let i = 0; i < a.count; i++) { f[i * 3] = a.getX(i); f[i * 3 + 1] = a.getY(i); f[i * 3 + 2] = a.getZ(i); } geo.setAttribute(k, new THREE.BufferAttribute(f, 3)); }
    mesh.updateWorldMatrix(true, false); geo.applyMatrix4(mesh.matrixWorld); geo.computeBoundingBox(); const b = geo.boundingBox, c = b.getCenter(V()), s = b.getSize(V()); geo.translate(-c.x, -b.min.y, -c.z); const k = 0.022 / Math.max(s.x, s.z); geo.scale(k, k, k);
    const m = lm({ map: mesh.material.map, color: 0xffffff }); im = new THREE.InstancedMesh(geo, m, NB); im.count = 0; im.frustumCulled = false; im.userData.noHit = true; im.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(NB * 3), 3); g.add(im); it.draw(); });
  it.draw = () => { if (!im) return; let n = 0; for (const b of it.bugs) { if (!b.alive) continue; dm.position.copy(b.p); dm.rotation.set(0, b.rot, 0); dm.scale.setScalar(b.s); dm.updateMatrix(); im.setMatrixAt(n, dm.matrix); im.setColorAt(n, b.col === 'green' ? cG : cB); n++; } im.count = n; im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true; };
  // two crows on a fence post, hunting
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 1.2, 8), lm({ color: 0x7a6248 })); post.position.set(0, 0.6, -2.2); g.add(post);
  const crows = [0, 1].map((i) => { const c = oModel('crow', { face: [0, 1] }); const h = new THREE.Group(); h.add(c); h.position.set(-0.12 + i * 0.24, 1.2, -2.2); g.add(h); return { h, home: h.position.clone() }; }); it.crows = crows;
  // the chart: share of green beetles, generation by generation
  const cb = new THREE.Group(); cb.position.set(0, 1.5, -2.0); g.add(cb); const cC = document.createElement('canvas'); cC.width = 768; cC.height = 384; const cT = new THREE.CanvasTexture(cC); cT.colorSpace = THREE.SRGBColorSpace;
  cb.add(new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.6), new THREE.MeshBasicMaterial({ map: cT, toneMapped: false }))); it.hist = [];
  it.chart = () => { const x = cC.getContext('2d'), W = 768, H = 384; x.fillStyle = 'rgba(251,248,240,0.95)'; x.fillRect(0, 0, W, H); x.strokeStyle = 'rgba(40,60,90,0.3)'; x.lineWidth = 2; for (let i = 0; i <= 4; i++) { const y = 40 + i * 70; x.beginPath(); x.moveTo(70, y); x.lineTo(740, y); x.stroke(); x.fillStyle = '#333'; x.font = `600 20px ${FONT}`; x.fillText(`${100 - i * 25}%`, 8, y + 6); }
    const nG = it.hist.length; const bw = Math.min(60, 660 / Math.max(1, nG)); it.hist.forEach((h, i) => { const gx = 80 + i * (bw + 4); const tot = h.g + h.b || 1; const hg = 280 * h.g / tot; x.fillStyle = '#4f9a3a'; x.fillRect(gx, 320 - hg, bw, hg); x.fillStyle = '#7a5532'; x.fillRect(gx, 40, bw, 280 - hg); x.fillStyle = '#222'; x.font = `600 16px ${FONT}`; x.fillText(String(i), gx + bw / 2 - 5, 345); });
    x.fillStyle = '#222'; x.font = `700 22px ${FONT}`; x.fillText(`${w_('Generation')} → · ${w_('green')} / ${w_('brown')}`, 80, 372); cT.needsUpdate = true; };
  it.chart();
  const sign = liveSign(0.09, 5); sign.position.set(0, 2.0, -2.0); g.add(sign); it.say = (l, c) => sign.set(l, c);
  const bub = zoomBubble({ at: V(-0.75, 1.45, -0.7), r: 0.15, hide: [sign] }); g.add(bub); it.bubble = bub;
  it.where = null; it.gen = 0;
  it.release = (plot) => { it.where = plot; const c = P[plot]; it.bugs = Array.from({ length: SEL.n }, (_, i) => ({ col: i < SEL.n / 2 ? 'green' : 'brown', alive: true, p: c.clone().add(V((rand() - 0.5) * S * 0.85, 0.008, (rand() - 0.5) * S * 0.85)), rot: rand() * TAU, s: 0.85 + rand() * 0.3 }));
    it.hist = [{ g: SEL.n / 2, b: SEL.n / 2 }]; it.chart(); it.draw(); };
  it.count = () => ({ g: it.bugs.filter((b) => b.alive && b.col === 'green').length, b: it.bugs.filter((b) => b.alive && b.col === 'brown').length });
  // one season: each beetle is seen (and eaten) with a chance set by how well it matches the ground
  it.season = (cb) => { if (it.busy) return false; it.busy = true; const ground = it.ground[it.where]; const victims = [];
    for (const b of it.bugs) { if (!b.alive) continue; const p = b.col === ground ? SEL.pHidden : SEL.pSeen; if (rand() < p) victims.push(b); }
    // the crows fly down to each victim in turn
    let i = 0; const next = () => { if (i >= victims.length) { breed(); it.busy = false; it.gen++; const c = it.count(); it.hist.push(c); it.chart(); it.say([`${w_('Generation')} ${it.gen}`, `${w_('Green')} ${c.g} · ${w_('Brown')} ${c.b}`], ['#ffffff', '#ffd23f']); if (cb) cb(); return; }
      const v = victims[i]; const cr = it.crows[i % 2]; const p0 = cr.home.clone(); let k = 0; const dt = clock(); const go = () => { k = Math.min(1, k + dt() / (it.fast ? 0.25 : 0.8)); const e = k < 0.5 ? ease(k * 2) : ease((1 - k) * 2); cr.h.position.lerpVectors(p0, v.p.clone().add(V(0, 0.05, 0)), e); if (k >= 0.5 && v.alive) { v.alive = false; it.draw(); } if (k < 1) requestAnimationFrame(go); else { cr.h.position.copy(p0); i++; next(); } }; go(); };
    next(); return true; };
  const breed = () => { const alive = it.bugs.filter((b) => b.alive); const c = P[it.where]; const kids = []; while (alive.length + kids.length < SEL.n && alive.length) { const par = alive[Math.floor(rand() * alive.length)]; let col = par.col; if (rand() < SEL.mut) col = col === 'green' ? 'brown' : 'green'; kids.push({ col, alive: true, p: c.clone().add(V((rand() - 0.5) * S * 0.85, 0.008, (rand() - 0.5) * S * 0.85)), rot: rand() * TAU, s: 0.85 + rand() * 0.3 }); }
    it.bugs = [...alive, ...kids]; it.draw(); };
  it.drought = () => { const k = it.where; const other = k === 'green' ? 'brown' : 'green'; it.ground[k] = other; it.plots[k].material = it.plotM[other]; };
  animator(it); const up0 = it.update; let TT = 0;
  it.update = (dt, tt) => { up0(dt); const d = Math.min(dt || 0.016, 0.05); TT += d; for (const c of it.crows) if (!it.busy) c.h.rotation.y = Math.sin(TT * 0.6 + c.home.x * 9) * 0.5; for (const f of ticks) f(d, tt); };
  it.views = { all: { p: V(0, 1.75, 0.7), t: V(0, 0.4, -1.4) }, chart: { p: V(0, 1.7, 0.4), t: V(0, 1.1, -1.9) } };
  it.say([w_('20 beetles of one kind: 10 green, 10 brown')], '#ffffff');
  return done1(it, { height: 1.2, radius: 2 });
}
export function beetleBox(label) { const g = new THREE.Group(); const b = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.06, 0.1), lm({ color: 0xcaa774 })); b.position.y = 0.03; g.add(b); const mesh = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.08).rotateX(-Math.PI / 2), lm({ color: 0x3a3a3a, transparent: true, opacity: 0.6 })); mesh.position.y = 0.061; g.add(mesh); return thing(label, g, { hitR: 0.08, hitY: 0.04, kind: 'beetlebox' }); }
export function bindSelection(bp, th, app, s, done = {}) {
  carry(th.box, ['green', 'brown'].map((k) => ({ at: () => bp.P[k].clone(), r: 0.6, open: () => stepNow(app, s.release) && !bp.where, put: (x) => { x.g.visible = false; bp.release(k); const p = bp.P[k].clone(); bp.bubble.look(p.clone().add(V(0.1, 0.01, 0.1)), p.clone().add(V(0.15, 0.15, 0.3)), bp.W('Green and brown beetles of the same kind')); if (done.released) done.released(k); } })), { carryY: 0.5 });
  const run = (n, cb) => { let k = 0; const one = () => { if (k >= n) { bp.fast = false; if (cb) cb(); return; } k++; bp.season(one); }; bp.fast = n > 1; one(); };
  bp.runSeasons = run;
  const bpp = th.button.g.position.clone();
  pushKnob(th.button, { path: () => [bpp.clone(), bpp.clone().add(V(0, 0, -0.05))], active: () => [s.g1, s.g5, s.g10].some((i) => stepNow(app, i)) && !bp.busy && !!bp.where, keepVisible: () => [s.g1, s.g5, s.g10].includes(app.runner.i),
    press: () => { const i = app.runner.i; if (i === s.g1 && bp.gen < 1) run(1, () => done.gen && done.gen()); else if (i === s.g5 && bp.gen < 6) run(6 - bp.gen, () => done.gen && done.gen()); else if (i === s.g10 && bp.gen < 11) { if (!bp.dry) { bp.dry = true; bp.drought(); } run(11 - bp.gen, () => done.gen && done.gen()); } } });
}

// ------------------------------------------------------------------ Class 10 (9): variation in a class
// In the classroom: the heights of the class marked in pencil on a height chart on the wall, each with a name (as is
// done every year), and a set square to read them; eight cards with a classmate's ear (two kinds of ear lobe); a board
// that builds a bar chart of the class's heights from the readings.
export const CLASS_H = (() => { const r = rnd(29); const a = []; for (let i = 0; i < 30; i++) { let s = 0; for (let k = 0; k < 6; k++) s += r(); a.push(Math.round(156 + (s - 3) * 7.5 * 1.4)); } return a; })();
export const NAMES10 = ['Aarav', 'Diya', 'Kabir', 'Meera', 'Rohan', 'Sana', 'Ishaan', 'Priya', 'Arjun', 'Neha'];
export const EARS = [true, false, true, true, false, true, true, false]; // free lobe?
export function classChart(o = {}) {
  const it = new Item('bwvar', { ...o, name: N3('Height chart and class board', 'ऊँचाई का चार्ट और कक्षा का बोर्ड', 'Height chart aur class board') });
  const g = it.g, w_ = o.W || ((k) => k); dryLand();
  // the chart: a tall strip on a wall panel, 120 … 190 cm, ten pencil marks with names
  const WC = V(-0.9, 0, -1.6); const pan = box(0.9, 2.2, 0.03, lm({ color: 0xe8e2d2 }), WC.x, 1.1, WC.z); g.add(pan);
  const strip = tex(128, 1024, (x) => { x.fillStyle = '#fdfbf3'; x.fillRect(0, 0, 128, 1024); x.fillStyle = '#222'; x.font = `600 22px ${FONT}`; for (let cm = 120; cm <= 190; cm++) { const y = 1024 - (cm - 115) / 80 * 1024; const L = cm % 10 === 0 ? 60 : cm % 5 === 0 ? 40 : 20; x.fillRect(0, y, L, 2); if (cm % 10 === 0) x.fillText(String(cm), 66, y + 8); } });
  const sm = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.8), lm({ map: strip })); sm.position.set(WC.x - 0.3, 1.15 + 0.4 - 0.05 * 0, WC.z + 0.017); g.add(sm);
  const yOf = (cm) => 1.15 + (cm - 115) / 80 * 0.8; it.yOf = yOf;
  // pencil marks with names, spread across the panel
  const nm = tex(512, 1024, (x) => { x.clearRect(0, 0, 512, 1024); x.strokeStyle = 'rgba(60,60,70,0.85)'; x.lineWidth = 3; x.fillStyle = 'rgba(50,50,60,0.9)'; x.font = `600 26px ${FONT}`;
    NAMES10.forEach((n, i) => { const cm = CLASS_H[i]; const y = 1024 - (cm - 115) / 80 * 1024; const x0 = 20 + (i % 2) * 220; x.beginPath(); x.moveTo(x0, y); x.lineTo(x0 + 160, y); x.stroke(); x.fillText(n, x0 + 10, y - 8); }); });
  const mk = new THREE.Mesh(new THREE.PlaneGeometry(0.64, 0.8), new THREE.MeshBasicMaterial({ map: nm, transparent: true, depthWrite: false })); mk.position.set(WC.x + 0.1, 1.55, WC.z + 0.018); mk.userData.noHit = true; g.add(mk);
  it.markAt = (i) => V(WC.x + 0.1 - 0.32 + (20 + (i % 2) * 220 + 80) / 512 * 0.64, yOf(CLASS_H[i]), WC.z + 0.04);
  // the ear cards' mats
  it.mats = { free: V(0.35, Y + 0.004, -0.75), att: V(0.85, Y + 0.004, -0.75) };
  for (const [k, p] of Object.entries(it.mats)) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.004, 0.3), lm({ map: cardTex([w_(k === 'free' ? 'Free ear lobe' : 'Attached ear lobe')], 320, 240, k === 'free' ? '#e3ecd8' : '#ecdcd6', '#222', 34) })); m.position.copy(p); g.add(m); }
  // the class board: a bar chart of heights (5 cm groups) and the ear lobe count
  const cb = new THREE.Group(); cb.position.set(0.6, 1.55, -1.55); g.add(cb); const cC = document.createElement('canvas'); cC.width = 768; cC.height = 512; const cT = new THREE.CanvasTexture(cC); cT.colorSpace = THREE.SRGBColorSpace;
  cb.add(new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.73), new THREE.MeshBasicMaterial({ map: cT, toneMapped: false }))); it.read = {}; it.ears = {}; it.all = false;
  it.board = () => { const x = cC.getContext('2d'), W = 768, H = 512; x.fillStyle = '#1f3a2e'; x.fillRect(0, 0, W, H); x.strokeStyle = '#e8f0e0'; x.fillStyle = '#e8f0e0'; x.font = `700 24px ${FONT}`; x.fillText(w_('Heights of our class (cm)'), 20, 34);
    const hs = it.all ? CLASS_H : Object.values(it.read); const bins = {}; for (let b = 135; b <= 180; b += 5) bins[b] = 0; for (const h of hs) { const b = Math.max(135, Math.min(180, Math.floor(h / 5) * 5)); bins[b]++; }
    const keys = Object.keys(bins).map(Number); const mx = Math.max(4, ...Object.values(bins)); keys.forEach((b, i) => { const bx = 40 + i * 48, bh = 280 * bins[b] / mx; x.fillStyle = '#f2c230'; x.fillRect(bx, 340 - bh, 38, bh); x.fillStyle = '#e8f0e0'; x.font = `600 16px ${FONT}`; x.fillText(String(b), bx, 362); if (bins[b]) x.fillText(String(bins[b]), bx + 12, 334 - bh); });
    const ef = Object.values(it.ears).filter((v) => v === 'free').length + (it.all ? 15 : 0), ea = Object.values(it.ears).filter((v) => v === 'att').length + (it.all ? 7 : 0);
    x.font = `700 24px ${FONT}`; x.fillText(`${w_('Ear lobes')}: ${w_('free')} ${ef} · ${w_('attached')} ${ea}`, 20, 420); x.font = `600 20px ${FONT}`; x.fillText(`${w_('Measured')}: ${hs.length}`, 20, 460); cT.needsUpdate = true; };
  it.board();
  const sign = liveSign(0.08, 5); sign.position.set(0.0, 2.15, -1.5); g.add(sign); it.say = (l, c) => sign.set(l, c);
  const bub = zoomBubble({ at: V(-0.15, 1.6, -0.9), r: 0.14, hide: [sign] }); g.add(bub); it.bubble = bub;
  animator(it);
  it.views = { wall: { p: V(-0.6, 1.6, 0.3), t: V(-0.9, 1.4, -1.6) }, table: { p: V(0.4, 1.5, 0.3), t: V(0.5, Y, -0.8) }, board: { p: V(0.2, 1.6, 0.6), t: V(0.5, 1.4, -1.5) } };
  it.say([w_('Our class, Class 10')], '#ffffff');
  return done1(it, { height: 2, radius: 1.5 });
}
// a classmate's ear on a card: the scan of a real ear; an attached lobe is made by joining the lowest part of the ear to
// the cheek (the scan itself has a free lobe)
export function earCard(free, label) { const g = new THREE.Group(); const card = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.004, 0.11), lm({ color: 0xd9b8a0 })); card.position.y = 0.002; g.add(card);
  const ear = oModel('ear', { h: 0.075, onLoad: (h, m) => { if (free) return; m.traverse((x) => { if (!x.isMesh) return; const geo = x.geometry = x.geometry.clone(); const p = geo.attributes.position; geo.computeBoundingBox(); const b = geo.boundingBox; const H = b.max.y - b.min.y, y0 = b.min.y + H * 0.24;
      for (let i = 0; i < p.count; i++) { const y = p.getY(i); if (y < y0) { const k = (y0 - y) / (H * 0.24); p.setY(i, y0 - (y0 - y) * 0.35); p.setX(i, lerp(p.getX(i), b.min.x + (b.max.x - b.min.x) * 0.15, k * 0.6)); p.setZ(i, p.getZ(i) * (1 - 0.6 * k)); } } p.needsUpdate = true; geo.computeVertexNormals(); }); } });
  const hold = new THREE.Group(); hold.add(ear); hold.rotation.x = -Math.PI / 2; hold.position.set(0, 0.006, 0.035); g.add(hold);
  const it = thing(label, g, { hitR: 0.07, hitY: 0.01, kind: 'earcard' }); it.free = free; it.on = null; return it; }
export function setSquare() { const g = new THREE.Group(); const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.lineTo(0.16, 0); sh.lineTo(0, 0.1); sh.closePath(); const m = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.003, bevelEnabled: false }), lm({ color: 0x3a8ad0, transparent: true, opacity: 0.75 })); m.rotation.x = -Math.PI / 2; m.position.y = 0.003; g.add(m); noHit(g); return g; }
export function bindVariation(vc, th, app, s, done = {}) {
  vc.measure = (i, sq, cb) => { if (vc.busy) return false; vc.busy = true; sq.flying = true; const p0 = sq.g.position.clone(), at = vc.markAt(i); let k = 0; const dt = clock(); const cm = CLASS_H[i];
    if (!vc.tags) vc.tags = {}; const tg = vc.tags[i] || (vc.tags[i] = tag('', '#ffd23f', 0.04)); vc.g.add(tg);
    const go = () => { k = Math.min(1, k + dt() / 1.6); sq.g.position.lerpVectors(p0, at, ease(clamp01(k / 0.35))); sq.g.rotation.set(Math.PI / 2 * clamp01(k / 0.35), 0, 0); if (k > 0.75) { sq.g.position.lerpVectors(at, sq.home.p, ease((k - 0.75) / 0.25)); sq.g.rotation.set(Math.PI / 2 * (1 - ease((k - 0.75) / 0.25)), 0, 0); }
      if (k > 0.4 && vc.read[i] == null) { vc.read[i] = cm; tg.position.copy(at).add(V(0.14, 0, 0.02)); tg.setText(`${cm} cm`); vc.board(); vc.bubble.look(at.clone().add(V(-0.05, 0, -0.02)), at.clone().add(V(0.0, 0.03, 0.3)), `${NAMES10[i]}: ${cm} cm`); }
      if (k < 1) requestAnimationFrame(go); else { sq.flying = false; sq.placed = false; sq.g.rotation.set(0, 0, 0); vc.busy = false; if (cb) cb(); } }; go(); return true; };
  carry(th.square, NAMES10.map((_, i) => ({ at: () => vc.markAt(i), r: 0.09, open: () => stepNow(app, s.measure) && !vc.busy && vc.read[i] == null, put: (x) => vc.measure(i, x, () => { if (Object.keys(vc.read).length >= 10 && done.measured) done.measured(); }) })), { carryY: 1.4 });
  vc.putEar = (c, k, cb) => { c.on = k; vc.ears[c.id] = k; c.flying = true; const n = Object.values(vc.ears).filter((v) => v === k).length - 1; flyT(c, vc.mats[k].clone().add(V(-0.12 + (n % 3) * 0.12, 0.004, -0.06 + Math.floor(n / 3) * 0.13)), 0, 0.6, () => { c.flying = false; c.placed = false; c.home = { p: c.g.position.clone(), q: c.g.quaternion.clone() }; vc.board(); const p = c.g.getWorldPosition(V()); vc.bubble.look(p.clone().add(V(0, 0.01, 0.03)), p.clone().add(V(0, 0.12, 0.1)), vc.W(c.free ? 'Free lobe: it hangs below where the ear joins the cheek' : 'Attached lobe: it joins the cheek directly')); if (cb) cb(); }); };
  for (const c of th.ears) carry(c, ['free', 'att'].map((k) => ({ at: () => vc.mats[k].clone(), r: 0.22, open: () => stepNow(app, s.ears), put: (x) => vc.putEar(x, k, () => { if (th.ears.every((e) => e.on) && done.sorted) done.sorted(); }) })), { carryY: Y + 0.12 });
  const bp = th.button.g.position.clone();
  pushKnob(th.button, { path: () => [bp.clone(), bp.clone().add(V(0, 0, -0.05))], active: () => stepNow(app, s.all) && !vc.all, keepVisible: () => app.runner.i === s.all, press: () => { vc.all = true; vc.board(); if (done.all) done.all(); } });
}
