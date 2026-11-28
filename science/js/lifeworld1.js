// DUET Science Lab 360, biology in real places, batch BW5: life cycles, heredity, health, plants, cells, fossils and
// birds. The student works by a young lemon tree in a citrus orchard, at a poultry table on a farm, in a pea field, a
// grassland, a classroom, a school courtyard, a kitchen, inside a giant cell, at a fossil dig and at a wetland bird
// sanctuary. The animals, fossils and the flower are real specimens scanned by museums and scientists (CC0 / CC BY;
// credited in models/eco/credits.json), re-meshed and re-baked for phones (devtools/BIOLOGY_WORLD.md).
// This file: the batch's models and places, the shared pieces (calendar knob, finding things with a hand lens, a
// steel ruler, the chick and the egg), and the two life cycles: a swallowtail on a lemon tree, a hen's eggs.
//
// Everything is drawn with BW4's one Lambert material family (lm / oModel in oceanworld1.js): one shader program,
// switched by uniforms, so opening an activity compiles almost nothing on a phone. No light is added.
import * as THREE from 'three';
import { Item } from './apparatus.js';
import { clamp01, ease } from './mathlab2.js';
import { liveSign } from './mathworld4.js';
import { slideKnob } from './mathworld5.js';
import { tag, animator, rnd, tex, noHit, stepNow, V, FONT } from './mathworld_j1.js';
import { ECO, ecoLoad, mergeGeoms } from './bioworld1.js';
import { carry } from './bioworld4.js';
import { btex } from './biobench2.js';
import { lm, oModel, zoomBubble, thing, spot, done1, dryLand, clock, flyT } from './oceanworld1.js';
import { PLACES } from './places.js';
import { BENCH_Y } from './room.js';
import { LITE } from './lite.js';

export const TAU = Math.PI * 2;
export const N3 = (en, hi, hg) => ({ en, hi, hg: hg || en });
export const lerp = (a, b, k) => a + (b - a) * k;
export const smooth = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
export const ang = (x, z) => Math.atan2(-z, x);
const Y = BENCH_Y;

// ------------------------------------------------------------------ the batch's scans (real size; where the head points)
// _lo: a lighter copy for phones and headsets (models/eco/<name>_lo.glb); sc(name) picks it in light mode
Object.assign(ECO, {
  swallowtail: { len: 0.1 }, cater_young: { len: 0.02 }, cater_old: { h: 0.05 }, hen: { h: 0.42, head: [1, 0] }, onion: { h: 0.07 }, ear: { h: 0.062 },
  ammonite: { len: 0.16 }, trilobite: { len: 0.065 }, knightia: { len: 0.2 }, triceratops: { len: 7.9, head: [0, 1], clip: 1 },
  wtkingfisher: { h: 0.62, head: [1, 0] }, cormorant: { h: 0.78, head: [1, 0] }, greylag: { h: 0.72, head: [1, 0] }, shoveler: { h: 0.36, head: [-1, 0] },
  shelduck: { len: 1.05, head: [1, 0] }, peacock: { len: 2.1, head: [0, 1] }, pelicans: { len: 5.2 },
});
const LOW = new Set(['swallowtail', 'ammonite', 'trilobite', 'wtkingfisher', 'greylag', 'shoveler', 'shelduck', 'peacock', 'pelicans', 'cormorant', 'onion']);
for (const n of LOW) ECO[n + '_lo'] = { ...ECO[n] };
export const sc = (n) => (LITE && LOW.has(n) ? n + '_lo' : n);
export const scan = (n, o = {}) => oModel(sc(n), o);

// ------------------------------------------------------------------ places of this batch
// a wetland at sunrise in winter (a lake with mist, bare trees; Poly Haven golf_course_sunrise, CC0), turned so the
// open water lies straight ahead; a fossil dig in a dry valley (the Goegap photo of BW3, dug into: deep)
if (!PLACES.wetland) PLACES.wetland = { img: 'golf_course_sunrise', h: 1.6, r: 60, yaw: 1.383, sun: [0.857, 0.107, 0.503], sunI: 1.25, sky: 0.5, env: 1.1, deep: true, name: N3('Wetland bird sanctuary', 'आर्द्रभूमि पक्षी अभयारण्य', 'Wetland bird sanctuary') };
if (!PLACES.dig) PLACES.dig = { img: 'goegap', h: 1.6, r: 60, yaw: 0.314, sun: [0.535, 0.726, 0.433], sunI: 2.4, sky: 0.32, env: 1.0, deep: true, name: N3('Fossil dig', 'जीवाश्म की खुदाई', 'Fossil ki khudai') };

// ------------------------------------------------------------------ shared pieces
const T = {};
export const matCache = (k, f) => T['m_' + k] || (T['m_' + k] = f());
export const lath = (pts, mat, seg = 24) => { const m = new THREE.Mesh(new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg), mat); m.castShadow = !LITE; m.receiveShadow = true; return m; };
export const box = (sx, sy, sz, mat, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), mat); m.position.set(x, y, z); m.castShadow = !LITE; m.receiveShadow = true; return m; };
export const holder = (...ch) => { const g = new THREE.Group(); for (const c of ch) if (c) g.add(c); return g; };
export const cardTex = (lines, w = 256, h = 128, bg = '#f4efe2', fg = '#222', sz = 34) => tex(w, h, (x) => { x.fillStyle = bg; x.fillRect(0, 0, w, h); x.strokeStyle = 'rgba(0,0,0,0.25)'; x.lineWidth = 4; x.strokeRect(2, 2, w - 4, h - 4); x.fillStyle = fg; x.textAlign = 'center'; x.textBaseline = 'middle';
  lines.forEach((l, i) => { x.font = `${i ? 600 : 800} ${i ? sz * 0.7 : sz}px ${FONT}`; let f = i ? sz * 0.7 : sz; while (f > 10 && x.measureText(l).width > w - 16) { f -= 2; x.font = `${i ? 600 : 800} ${f}px ${FONT}`; } x.fillText(l, w / 2, h / 2 + (i - (lines.length - 1) / 2) * sz * 1.1); }); });
// a card lying on the table with a word or two on it (something to carry and put somewhere)
export function labelCard(lines, o = {}) { const w = o.w || 0.13, d = o.d || 0.06; const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.004, d), lm({ map: cardTex(lines, 320, Math.round(320 * d / w), o.bg || '#fbf6e6', o.fg || '#1d2b3a', o.sz || 46) })); m.position.y = 0.002; return holder(m); }
// a calendar or clock: a knob slid along a path in the steps that move time on; lims: { step: furthest time }
export function bindCalendar(sc_, knob, app, lims, done = {}) {
  const steps = Object.keys(lims).map(Number); sc_.lims = lims;
  const sync = slideKnob(knob, { path: () => sc_.knobPath(), active: () => steps.some((i) => stepNow(app, i)) && !sc_.busy && (!sc_.canTime || sc_.canTime()), keepVisible: () => steps.includes(app.runner.i), k: () => sc_.t / sc_.tMax,
    set: (k) => { const L = lims[app.runner.i] ?? sc_.tMax; sc_.setT(Math.min(L, Math.max(sc_.t, Math.round(k * sc_.tMax * 4) / 4))); if (sc_.t >= L - 1e-6 && done.end) done.end(app.runner.i); } });
  const s0 = sc_.setT; sc_.setT = (t) => { s0(t); sync(); };
}
// a knob that sets a value (a thermostat, a tap): slid along a path, any value between lo and hi
export function bindDial(it, knob, app, step, o = {}) {
  const sync = slideKnob(knob, { path: () => it.dialPath(), active: () => stepNow(app, step) || (o.also && o.also()), keepVisible: () => app.runner.i === step || (o.also && o.also()), k: () => (it.dial - o.lo) / (o.hi - o.lo),
    set: (k) => { it.setDial(lerp(o.lo, o.hi, k)); } });
  const s0 = it.setDial; it.setDial = (v) => { s0(v); sync(); };
  const r0 = knob.onRelease; knob.onRelease = () => { if (r0) r0(); if (stepNow(app, step) && o.released) o.released(it.dial); };
}
// a plain steel scale, 15 cm, lying along x; readout tag shows what it measures
export function steelRule(L = 0.15) { const g = new THREE.Group(); const t = tex(1024, 64, (x) => { x.fillStyle = '#c9cdd2'; x.fillRect(0, 0, 1024, 64); x.fillStyle = '#20242a'; x.font = `600 22px ${FONT}`; x.textAlign = 'center';
    for (let mm = 0; mm <= 150; mm++) { const px = 20 + mm / 150 * 984; const h = mm % 10 === 0 ? 30 : mm % 5 === 0 ? 20 : 12; x.fillRect(px - 0.8, 0, 1.6, h); if (mm % 10 === 0) x.fillText(String(mm / 10), px, 56); } });
  const m = new THREE.Mesh(new THREE.BoxGeometry(L * 1.06, 0.0012, 0.018), lm({ map: t })); m.position.y = 0.0006; g.add(m); noHit(g); return g; }

// ------------------------------------------------------------------ finding things: a hand lens taken to places
// spots: [{ at: () => V, view: () => [target, from], text: () => caption, hit: () => bool }]; each spot looked at is
// remembered (seen); found(): the spots looked at where hit() is true
export function bindLens(owner, lensIt, spots, app, step, done = {}, o = {}) {
  owner.lensSeen = new Set();
  owner.lookSpot = (i, cb) => { const S = spots[i]; if (owner.busy) return false; owner.busy = true; lensIt.flying = true; const p0 = lensIt.g.position.clone(), at = S.at().add(V(0, 0.06, 0.02)); let k = 0; const dt = clock();
    const step_ = () => { k = Math.min(1, k + dt() / 1.6); lensIt.g.position.lerpVectors(p0, at, ease(clamp01(k / 0.3))); if (k > 0.8) lensIt.g.position.lerpVectors(at, lensIt.home.p, ease((k - 0.8) / 0.2));
      if (k > 0.3 && !owner.lensSeen.has(i)) { owner.lensSeen.add(i); const [t, f] = S.view(); owner.bubble.look(t, f, S.text()); if (done.seen) done.seen(i); }
      if (k < 1) requestAnimationFrame(step_); else { lensIt.flying = false; lensIt.placed = false; owner.busy = false; if (cb) cb(i); } }; step_(); return true; };
  const st = Array.isArray(step) ? step : [step];
  carry(lensIt, spots.map((S, i) => ({ at: S.at, r: S.r ?? 0.12, open: () => st.some((s) => stepNow(app, s)) && !owner.busy, put: () => { owner.lensSeen.delete(i); owner.lookSpot(i, () => done.looked && done.looked(i)); } })), { carryY: o.carryY ?? 1.2 });
}

// ------------------------------------------------------------------ a hen's egg (brown, speckled) and a chick
const eggTex = (white) => T['egg' + white] || (T['egg' + white] = tex(256, 128, (x) => { x.fillStyle = white ? '#f1ece2' : '#c48a5c'; x.fillRect(0, 0, 256, 128); const r = rnd(white ? 5 : 9);
  for (let i = 0; i < 900; i++) { x.fillStyle = white ? `rgba(200,190,170,${0.1 + r() * 0.15})` : `rgba(${r() < 0.5 ? '120,70,40' : '220,170,130'},${0.12 + r() * 0.2})`; x.beginPath(); x.arc(r() * 256, r() * 128, 0.5 + r() * 1.8, 0, TAU); x.fill(); } }));
// an egg's outline: 5.6 cm long, 4.3 cm wide, the blunt end at y = 0 … no: the blunt end up (air cell), the pointed end down
export const EGG_L = 0.056;
const eggProfile = (L = EGG_L, n = 18) => { const pts = []; for (let i = 0; i <= n; i++) { const t = i / n, y = t * L; const u = t * 2 - 1; const w = 0.43 * L * Math.sqrt(Math.max(0, 1 - u * u)) * (1 + 0.12 * u); pts.push([Math.max(0.0004, w), y]); } pts[0][0] = 0.0002; pts[n][0] = 0.0002; return pts; };
// the shell in two parts (the cap comes off at hatching): cut at h of the length (blunt end up)
export function eggMesh(white = false, o = {}) {
  const g = new THREE.Group(); const m = lm({ map: eggTex(white), color: 0xffffff }); const P = eggProfile(); const cut = o.cut ?? 0.72, n = P.length - 1, ci = Math.round(cut * n);
  const zig = (geo, top) => { const p = geo.attributes.position; for (let i = 0; i < p.count; i++) { const y = p.getY(i); if (Math.abs(y - P[ci][1]) < 1e-5) { const a = Math.atan2(p.getZ(i), p.getX(i)); p.setY(i, y + (top ? 1 : 1) * 0.0018 * Math.sin(a * 9) * (top ? 1 : 1)); } } geo.computeVertexNormals(); return geo; };
  const lower = new THREE.Mesh(zig(new THREE.LatheGeometry(P.slice(0, ci + 1).map(([r, y]) => new THREE.Vector2(r, y)), 28), false), m);
  const capG = new THREE.LatheGeometry(P.slice(ci).map(([r, y]) => new THREE.Vector2(r, y)), 28); zig(capG, true);
  const cap = new THREE.Mesh(capG, m); const capH = new THREE.Group(); capH.add(cap); g.add(lower, capH);
  const inner = new THREE.Mesh(new THREE.CircleGeometry(P[ci][0] * 0.97, 24).rotateX(-Math.PI / 2), lm({ color: 0xece4d4, side: THREE.DoubleSide })); inner.position.y = P[ci][1] - 0.001; inner.visible = false; g.add(inner);
  g.userData = { lower, cap: capH, inner, top: P[ci][1] }; for (const x of [lower, cap]) { x.castShadow = !LITE; x.receiveShadow = true; }
  return g;
}
// a newly hatched chick (procedural: there is no open-licence scan of one): a body and head of soft down, drawn as a few
// shells of fur cards (alpha-cut, Lambert), a small horn-coloured beak, black eyes, pink-orange legs. ~5 cm tall.
const downTex = () => T.down || (T.down = (() => { const C = document.createElement('canvas'); C.width = C.height = 256; const x = C.getContext('2d'); x.clearRect(0, 0, 256, 256); const r = rnd(31);
  for (let i = 0; i < 2600; i++) { const px = r() * 256, py = r() * 256, l = 4 + r() * 10, a = r() * TAU; x.strokeStyle = `rgba(255,255,255,${0.55 + r() * 0.45})`; x.lineWidth = 1 + r(); x.beginPath(); x.moveTo(px, py); x.lineTo(px + Math.cos(a) * l, py + Math.sin(a) * l); x.stroke(); }
  const t = new THREE.CanvasTexture(C); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 3); t.colorSpace = THREE.SRGBColorSpace; return t; })());
const chickSkin = () => T.chickSkin || (T.chickSkin = tex(256, 128, (x) => { const g = x.createLinearGradient(0, 0, 0, 128); g.addColorStop(0, '#c9a35a'); g.addColorStop(0.45, '#e8cf86'); g.addColorStop(1, '#f6e7b5'); x.fillStyle = g; x.fillRect(0, 0, 256, 128);
  x.fillStyle = 'rgba(120,80,40,0.45)'; for (const s of [-1, 1]) { x.beginPath(); x.ellipse(128 + s * 36, 30, 10, 60, 0, 0, TAU); x.fill(); } x.fillStyle = 'rgba(90,60,30,0.5)'; x.beginPath(); x.ellipse(128, 25, 8, 70, 0, 0, TAU); x.fill(); }));
export function chick(o = {}) {
  const g = new THREE.Group(); const L = 0.06; const wet = { k: 0 };
  const body = new THREE.SphereGeometry(L * 0.42, 18, 12).scale(1.15, 1, 1).translate(0, L * 0.5, 0), head = new THREE.SphereGeometry(L * 0.26, 16, 10).translate(L * 0.36, L * 0.95, 0);
  const core = mergeGeoms([body, head]); const uv = new Float32Array(core.attributes.position.count * 2); for (let i = 0; i < uv.length / 2; i++) { const x = core.attributes.position.getX(i), y = core.attributes.position.getY(i), z = core.attributes.position.getZ(i); uv[i * 2] = 0.5 + Math.atan2(z, -x) / TAU; uv[i * 2 + 1] = clamp01(y / (L * 1.25)); } core.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  const skinM = lm({ map: chickSkin() }); const coreM = new THREE.Mesh(core, skinM); g.add(coreM);
  const shells = []; const NS = LITE ? 4 : 7; for (let s = 1; s <= NS; s++) { const k = 1 + s * 0.035; const sg = core.clone(); sg.scale(k, k, k); const off = (L * 0.5) * (k - 1); sg.translate(-0.0, -off, 0);
    const m = lm({ map: chickSkin(), transparent: false }); m.alphaMap = downTex(); m.alphaTest = 0.3 + s * 0.06; m.transparent = false; m.needsUpdate = true; m.customProgramCacheKey = () => 'bw5-down'; const sh = new THREE.Mesh(sg, m); sh.userData.noHit = true; g.add(sh); shells.push(sh); }
  const beakM = lm({ color: 0xd9a35c }), eyeM = lm({ color: 0x0b0b0b, emissive: 0x050505 }), legM = lm({ color: 0xe0a060 });
  const beak = new THREE.Mesh(new THREE.ConeGeometry(L * 0.055, L * 0.13, 8).rotateZ(-Math.PI / 2), beakM); beak.position.set(L * 0.64, L * 0.93, 0); g.add(beak);
  for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(L * 0.04, 8, 6), eyeM); e.position.set(L * 0.5, L * 1.02, s * L * 0.15); g.add(e);
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(L * 0.025, L * 0.03, L * 0.22, 6), legM); leg.position.set(L * 0.02, L * 0.1, s * L * 0.11); g.add(leg);
    for (const a of [-0.5, 0, 0.5]) { const toe = new THREE.Mesh(new THREE.CylinderGeometry(L * 0.012, L * 0.015, L * 0.13, 5).rotateZ(Math.PI / 2), legM); toe.position.set(L * 0.07, L * 0.01, s * L * 0.11); toe.rotation.y = a; g.add(toe); } }
  // wet (just hatched): the down lies flat and dark; it fluffs up as it dries
  g.userData.setWet = (k) => { wet.k = k; shells.forEach((sh, i) => { sh.visible = k < 0.5 || i < 2; sh.scale.setScalar(1 - 0.03 * k * (i + 1) / NS); }); skinM.color.setScalar(1 - 0.35 * k); };
  g.userData.setWet(0); noHit(g); g.traverse((m) => { if (m.isMesh) { m.castShadow = !LITE; } }); return g;
}

// ------------------------------------------------------------------ a lemon tree (procedural trunk and branches, real leaf photo)
// The leaves are ambientCG's Leaf001 photo (CC0), darkened to a lemon's glossy dark green; young leaves are lighter and
// tinged copper. Most leaves are one merged mesh; the leaves the caterpillar eats are their own meshes.
const barkTex = () => T.bark || (T.bark = tex(64, 256, (x) => { x.fillStyle = '#6b6a52'; x.fillRect(0, 0, 64, 256); const r = rnd(4); for (let i = 0; i < 260; i++) { x.fillStyle = `rgba(${r() < 0.5 ? '50,48,36' : '140,136,110'},${0.15 + r() * 0.2})`; x.fillRect(r() * 64, r() * 256, 1 + r() * 3, 2 + r() * 10); } }, [1, 3]));
function tubeAlong(pts, r0, r1, seg = 8) { const c = new THREE.CatmullRomCurve3(pts); const n = Math.max(4, pts.length * 3); const g = new THREE.TubeGeometry(c, n, 1, seg, false); const p = g.attributes.position, nn = g.attributes.normal;
  // taper: each ring of the tube scaled from r0 to r1 about the curve
  for (let i = 0; i <= n; i++) { const t = i / n, R = lerp(r0, r1, t), P = c.getPointAt(t); for (let j = 0; j <= seg; j++) { const k = i * (seg + 1) + j; const v = V(p.getX(k), p.getY(k), p.getZ(k)).sub(P).normalize().multiplyScalar(R).add(P); p.setXYZ(k, v.x, v.y, v.z); } } void nn; g.computeVertexNormals(); return g; }
export function leafQuad(len, wid, o = {}) { // a leaf card: the photo on a gently folded quad, base at the origin, along +y
  const nx = 2, ny = 4; const g = new THREE.PlaneGeometry(wid, len, nx, ny).translate(0, len / 2, 0); const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i) / len; p.setZ(i, Math.abs(x) / wid * wid * (o.fold ?? 0.35) - y * y * len * (o.arch ?? 0.15)); } g.computeVertexNormals(); return g; }
export function lemonTree(o = {}) {
  const g = new THREE.Group(); const r = rnd(o.seed || 3); const H = o.h || 1.45; const leafT = btex('leaf_ovate');
  const parts = [], leafG = [], youngG = [], tips = [], stems = [];
  const CR = 0.58, CY = H * 0.68; // the canopy: a rounded crown, radius CR, centre at height CY
  const trunkTop = V(0.01, H * 0.32, 0); parts.push(tubeAlong([V(0, 0, 0), V(0.015, H * 0.16, 0.01), trunkTop], 0.028, 0.02, 8));
  // four main branches spread from the top of the trunk; each carries side twigs to the edge of the crown
  for (let b = 0; b < 5; b++) { const a = b / 5 * TAU + 0.3 + r() * 0.4, el = 0.55 + r() * 0.35; const dir = V(Math.cos(a) * Math.cos(el), Math.sin(el), Math.sin(a) * Math.cos(el));
    const end = V(0, CY, 0).addScaledVector(dir, CR * (0.8 + r() * 0.15)); const mid = trunkTop.clone().lerp(end, 0.5).add(V(0, 0.05, 0)); const st = [trunkTop.clone(), mid, end];
    parts.push(tubeAlong(st, 0.014, 0.005, 6)); stems.push(st); const curve = new THREE.CatmullRomCurve3(st);
    for (let s = 0; s < 9; s++) { const q = curve.getPointAt(0.3 + s * 0.075); const out = q.clone().sub(V(0, CY, 0)); out.y *= 0.6; out.normalize().add(V((r() - 0.5) * 0.8, 0.25 + r() * 0.4, (r() - 0.5) * 0.8)).normalize();
      let L = 0.1 + r() * 0.16; const q2 = q.clone().addScaledVector(out, L); const dc = q2.clone().sub(V(0, CY, 0)); if (dc.length() > CR * 1.05) { q2.copy(V(0, CY, 0).addScaledVector(dc.normalize(), CR * 1.02)); L = q2.distanceTo(q); }
      parts.push(tubeAlong([q, q.clone().lerp(q2, 0.5).add(V(0, 0.015, 0)), q2], 0.0042, 0.0018, 5)); tips.push({ p: q2, d: q2.clone().sub(q).normalize(), young: s % 3 === 2, twig: [q, q2] });
      const tp = q.clone().lerp(q2, 0.5); const th = new THREE.ConeGeometry(0.0011, 0.011, 4).translate(0, 0.0055, 0); th.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), V(r() - 0.5, 0.3, r() - 0.5).normalize())); th.translate(tp.x, tp.y, tp.z); parts.push(th); }
    tips.push({ p: end, d: end.clone().sub(mid).normalize(), young: true, twig: [mid, end] }); }
  const wood = new THREE.Mesh(mergeGeoms(parts), lm({ map: barkTex() })); wood.castShadow = !LITE; wood.receiveShadow = true; wood.userData.noHit = true; g.add(wood);
  const addLeaf = (list, p, d, len) => { const q = leafQuad(len, len * 0.55, { fold: 0.3, arch: 0.16 }); const up = d.clone().add(V((r() - 0.5) * 0.9, -0.1 + r() * 0.5, (r() - 0.5) * 0.9)).normalize();
    const quat = new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), up); const tw = new THREE.Quaternion().setFromAxisAngle(up, r() * TAU); q.applyQuaternion(tw.multiply(quat)); q.translate(p.x, p.y, p.z); list.push(q); };
  // leaves alternate along every twig, a young cluster at its tip; then the crown is filled out to look as dense as a real one
  for (const tp of tips) { const [a0, a1] = tp.twig; const n = 7; for (let i = 0; i < n; i++) { const k = 0.15 + i / n * 0.85; const p = a0.clone().lerp(a1, k); const side = V(r() - 0.5, r() * 0.4, r() - 0.5).normalize(); addLeaf(leafG, p.addScaledVector(side, 0.01), tp.d.clone().add(side.multiplyScalar(1.2)).normalize(), 0.075 + r() * 0.035); }
    for (let i = 0; i < (tp.young ? 4 : 2); i++) addLeaf(tp.young ? youngG : leafG, tp.p.clone().add(V((r() - 0.5) * 0.02, (r() - 0.5) * 0.02, (r() - 0.5) * 0.02)), tp.d, tp.young ? 0.04 + r() * 0.02 : 0.07 + r() * 0.02); }
  for (let i = 0; i < (LITE ? 170 : 300); i++) { const u = r() * 2 - 1, a = r() * TAU, rr = CR * (0.7 + 0.3 * Math.sqrt(r())); const n = V(Math.sqrt(1 - u * u) * Math.cos(a), u * 0.8, Math.sqrt(1 - u * u) * Math.sin(a)); if (n.y < -0.55) continue;
    addLeaf(leafG, V(0, CY, 0).addScaledVector(n, rr), n, 0.07 + r() * 0.035); }
  const leafM = lm({ map: leafT, color: 0x86b066, emissive: 0x1d3012, side: THREE.DoubleSide }); leafM.alphaTest = 0.45;
  const youngM = lm({ map: leafT, color: 0xd2e09a, emissive: 0x2c3414, side: THREE.DoubleSide }); youngM.alphaTest = 0.45;
  const lv = new THREE.Mesh(mergeGeomsUV(leafG), leafM); lv.castShadow = !LITE; lv.receiveShadow = true; lv.userData.noHit = true; g.add(lv);
  const yv = new THREE.Mesh(mergeGeomsUV(youngG), youngM); yv.castShadow = !LITE; yv.userData.noHit = true; g.add(yv);
  // lemons, green and ripening, hanging inside the crown
  const lemT = T.lemon || (T.lemon = tex(128, 64, (x) => { x.fillStyle = '#c9c23a'; x.fillRect(0, 0, 128, 64); const rr = rnd(2); for (let i = 0; i < 600; i++) { x.fillStyle = `rgba(${rr() < 0.5 ? '120,120,20' : '240,230,120'},0.25)`; x.beginPath(); x.arc(rr() * 128, rr() * 64, 0.6 + rr(), 0, TAU); x.fill(); } }));
  const lem = []; for (let i = 0; i < 9; i++) { const tp = tips[(i * 7 + 3) % tips.length]; const c = tp.twig[0].clone().lerp(tp.twig[1], 0.6); lem.push(new THREE.SphereGeometry(0.025, 12, 8).scale(1, 1.22, 1).translate(c.x, c.y - 0.04, c.z)); }
  const lm_ = new THREE.Mesh(mergeGeomsUV(lem), lm({ map: lemT, color: 0xd0e070 })); lm_.userData.noHit = true; g.add(lm_);
  g.userData = { tips, stems, leafM, youngM, CY, CR };
  return g;
}
// merge geometries that have uv (position, normal, uv)
export function mergeGeomsUV(list) { let n = 0; const flat = list.map((gm) => { const x = gm.index ? gm.toNonIndexed() : gm; n += x.attributes.position.count; return x; });
  const P = new Float32Array(n * 3), Nn = new Float32Array(n * 3), U = new Float32Array(n * 2); let o = 0;
  for (const x of flat) { if (!x.attributes.normal) x.computeVertexNormals(); P.set(x.attributes.position.array, o * 3); Nn.set(x.attributes.normal.array, o * 3); if (x.attributes.uv) U.set(x.attributes.uv.array, o * 2); o += x.attributes.position.count; }
  const gm = new THREE.BufferGeometry(); gm.setAttribute('position', new THREE.BufferAttribute(P, 3)); gm.setAttribute('normal', new THREE.BufferAttribute(Nn, 3)); gm.setAttribute('uv', new THREE.BufferAttribute(U, 2)); return gm; }

// ------------------------------------------------------------------ the swallowtail (a real museum specimen), flapping
// The scan lies with its wings flat in the file's x-y plane, the head at +y. Its triangles are split into the left and
// right wing (by which side of the body they lie), each hinged on the body; the body is the middle strip.
export function swallowtail(o = {}) {
  const g = new THREE.Group(); const span = o.span || 0.1; const pivot = new THREE.Group(); g.add(pivot); pivot.rotation.x = -Math.PI / 2; // wings flat, head towards -z
  const W = { L: new THREE.Group(), R: new THREE.Group(), body: new THREE.Group() }; pivot.add(W.L, W.R, W.body); g.userData.flap = 0; g.userData.fold = 0;
  ecoLoad(sc('swallowtail')).then((gl) => { let mesh = null; gl.scene.traverse((x) => { if (x.isMesh && !mesh) mesh = x; }); if (!mesh) return; mesh.updateWorldMatrix(true, false);
    const geo = mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry.clone(); for (const k of ['position', 'normal']) { const a = geo.attributes[k]; if (!a || a.array instanceof Float32Array) continue; const f = new Float32Array(a.count * 3); for (let i = 0; i < a.count; i++) { f[i * 3] = a.getX(i); f[i * 3 + 1] = a.getY(i); f[i * 3 + 2] = a.getZ(i); } geo.setAttribute(k, new THREE.BufferAttribute(f, 3)); }
    geo.applyMatrix4(mesh.matrixWorld); geo.computeBoundingBox(); const b = geo.boundingBox, c = b.getCenter(V()), s = b.getSize(V()); geo.translate(-c.x, -c.y, -c.z); const k = span / s.x; geo.scale(k, k, k);
    const half = s.x * k * 0.04; const P = geo.attributes.position; const sets = { L: [], R: [], body: [] };
    for (let t = 0; t < P.count; t += 3) { const cx = (P.getX(t) + P.getX(t + 1) + P.getX(t + 2)) / 3; sets[cx < -half ? 'L' : cx > half ? 'R' : 'body'].push(t); }
    const mat = lm({ map: mesh.material.map, side: THREE.DoubleSide });
    for (const key of ['L', 'R', 'body']) { const idx = sets[key]; const ng = new THREE.BufferGeometry(); for (const nm of ['position', 'normal', 'uv']) { const a = geo.attributes[nm]; if (!a) continue; const d = a.itemSize, arr = new Float32Array(idx.length * 3 * d); idx.forEach((t, i) => { for (let v = 0; v < 3; v++) for (let q = 0; q < d; q++) arr[(i * 3 + v) * d + q] = a.array[(t + v) * d + q]; }); ng.setAttribute(nm, new THREE.BufferAttribute(arr, d)); }
      const m = new THREE.Mesh(ng, mat); m.castShadow = !LITE; m.userData.noHit = !o.hit; W[key].add(m); }
    g.userData.ready = true; });
  // flap: 0 = wings flat, 1 = wings up together (closed over the back); fold: the resting butterfly closes its wings
  g.userData.setWings = (a) => { W.L.rotation.y = -a; W.R.rotation.y = a; };
  g.userData.crumple = (k) => { for (const w of [W.L, W.R]) w.scale.set(1 - 0.75 * k, 1 - 0.55 * k, 1); }; // a butterfly just out of its pupa: small, crumpled wings
  return g;
}

// ------------------------------------------------------------------ Class 6–8: a swallowtail's life on a lemon tree
// A young lemon tree in a citrus orchard. A lime swallowtail lays single eggs on the soft new leaves; the student finds
// them with a hand lens, runs the calendar, measures the caterpillar with a steel scale, finds the pupa on a stem and
// watches the butterfly come out. Day by day (summer, about 28 °C): egg 4 days, caterpillar 14 days (it moults four
// times; for 3 moults it looks like a bird dropping, then it turns green), pupa 9 days, adult on day 28.
export const BF = { hatch: 4, green: 13, prepupa: 18, pupa: 19.5, dark: 26.5, emerge: 28, tMax: 30 };
export function butterflyTree(o = {}) {
  const it = new Item('bwbfly', { ...o, name: N3('A lemon tree in an orchard', 'बाग़ में नींबू का पेड़', 'Baag mein nimbu ka ped') });
  const g = it.g, w_ = o.W || ((k) => k), ticks = []; dryLand(); const r = rnd(12);
  const TC = V(0, 0, -1.05); const tree = lemonTree({ h: 1.45, seed: 5 }); tree.position.copy(TC); g.add(tree); it.tree = tree;
  // a ring of dug soil round the trunk
  const soil = new THREE.Mesh(new THREE.CircleGeometry(0.42, 28).rotateX(-Math.PI / 2), lm({ map: T.soilB || (T.soilB = tex(128, 128, (x) => { x.fillStyle = '#5a4430'; x.fillRect(0, 0, 128, 128); const q = rnd(6); for (let i = 0; i < 500; i++) { x.fillStyle = `rgba(${q() < 0.5 ? '30,20,10' : '120,100,70'},0.45)`; x.beginPath(); x.arc(q() * 128, q() * 128, 1 + q() * 2, 0, TAU); x.fill(); } })) }));
  soil.position.set(TC.x, 0.004, TC.z); soil.receiveShadow = true; g.add(soil);
  const tips = tree.userData.tips.map((t) => t.p.clone().add(TC)); it.tips = tips;
  // the egg leaves: three soft young leaves at shoot tips the student can reach (between 1.0 and 1.45 m high)
  const reach = tips.map((p, i) => ({ p, i, y: tree.userData.tips[i].young })).filter((x) => x.y && x.p.y > 0.85 && x.p.y < 1.55 && x.p.z > TC.z + 0.05).sort((a, b) => a.p.x - b.p.x);
  const pickN = (n, from) => { const out = []; const step = Math.max(1, Math.floor(from.length / n)); for (let i = 0; i < n && i * step < from.length; i++) out.push(from[i * step].p); return out; };
  const spotsP = pickN(6, reach.length >= 6 ? reach : tips.map((p) => ({ p })));
  it.eggAt = [spotsP[0], spotsP[2], spotsP[4]]; it.emptyAt = [spotsP[1], spotsP[3], spotsP[5]];
  // food leaves near the first egg: their own meshes, eaten one by one
  const foodM = tree.userData.youngM; const bitten = lm({ map: biteTex(), color: 0x6e9a50, side: THREE.DoubleSide }); bitten.alphaTest = 0.45;
  const E0 = it.eggAt[0]; it.food = []; for (let i = 0; i < 9; i++) { const a = i / 9 * TAU, h = (i % 3) * 0.04; const q = leafQuad(0.07 + r() * 0.02, 0.04, { fold: 0.3, arch: 0.15 }); const m = new THREE.Mesh(q, i < 2 ? foodM : tree.userData.leafM); m.position.copy(E0).add(V(Math.cos(a) * 0.05, -0.04 - h, Math.sin(a) * 0.05)); m.lookAt(m.position.clone().add(V(Math.cos(a), 0.4, Math.sin(a)))); m.rotateX(Math.PI / 2); m.userData.noHit = true; g.add(m); it.food.push({ m, k: 0, len: m.scale.y }); }
  it.eaten = 0;
  // eggs: pale yellow-green spheres 1.1 mm across, one on each egg leaf
  const eggM = lm({ color: 0xf2e7a0, emissive: 0x1a1608 }); it.eggs = it.eggAt.map((p) => { const e = new THREE.Mesh(new THREE.SphereGeometry(0.00055, 10, 8), eggM); e.position.copy(p).add(V(0, 0.004, 0)); e.visible = false; e.userData.noHit = true; g.add(e); return e; });
  // the caterpillar we follow (young: bird-dropping look; old: green), and two others that hatched from the other eggs
  const cy = oModel('cater_young', { face: [1, 0], len: 0.004 }), co = oModel('cater_old', { h: 0.05 }); cy.visible = false; co.visible = false; g.add(cy, co); it.cy = cy; it.co = co;
  // the pupa: hanging head-up on a stem 25 cm below, held by a silk girdle; green like the stem
  const pupa = chrysalis(); pupa.visible = false; g.add(pupa); it.pupa = pupa;
  const stemP = tree.userData.stems[2]; const pP = stemP[1].clone().lerp(stemP[0], 0.35).add(TC); pupa.position.copy(pP).add(V(0.012, 0, 0.012)); it.pupaAt = pupa.position.clone();
  it.stemSpots = [pP, stemP[1].clone().lerp(stemP[2], 0.5).add(TC), tree.userData.stems[4][1].clone().add(TC), tree.userData.stems[0][1].clone().lerp(tree.userData.stems[0][0], 0.5).add(TC)];
  // the butterfly: flies round the tree, lays, and in the end comes out of the pupa
  const bf = swallowtail(); g.add(bf); it.bf = bf; const bf2 = swallowtail(); bf2.visible = false; g.add(bf2); it.bf2 = bf2;
  // the bubble and the sign
  const sign = liveSign(0.085, 4.8); sign.position.set(0.0, 2.1, -1.5); g.add(sign); it.say = (l, c) => sign.set(l, c);
  const bub = zoomBubble({ at: V(-0.48, 1.52, -0.5), r: 0.15, hide: [sign] }); g.add(bub); it.bubble = bub;
  it.t = 0; it.tMax = BF.tMax; it.laid = false; it.len = 0; it.measures = [];
  it.knobPath = () => [V(0.45, 0.95, -0.55), V(1.05, 0.95, -0.55)];
  const post = box(0.66, 0.035, 0.12, lm({ color: 0x8a6a45 }), 0.75, 0.92, -0.55); g.add(post); const leg = box(0.05, 0.92, 0.05, lm({ color: 0x6b5236 }), 0.75, 0.46, -0.55); g.add(leg);
  const lensPost = box(0.3, 0.035, 0.16, lm({ color: 0x8a6a45 }), -0.65, 0.92, -0.5); g.add(lensPost); const leg2 = box(0.05, 0.92, 0.05, lm({ color: 0x6b5236 }), -0.65, 0.46, -0.5); g.add(leg2);
  // caterpillar length (m) on day d: 3 mm at hatching, about 45 mm when full grown (it grows in steps between moults)
  it.lenOn = (d) => (d < BF.hatch ? 0 : d >= BF.pupa ? 0.032 : 0.003 * Math.pow(15, clamp01((d - BF.hatch) / (BF.prepupa - BF.hatch - 1))) * (d > BF.prepupa ? 0.85 : 1));
  it.stage = (d) => (!it.laid ? 'none' : d < BF.hatch ? 'egg' : d < BF.green ? 'young' : d < BF.prepupa ? 'green' : d < BF.pupa ? 'prepupa' : d < BF.emerge ? 'pupa' : 'adult');
  const SN = { none: 'No eggs yet', egg: 'Eggs', young: 'Caterpillar (looks like a bird dropping)', green: 'Caterpillar (green)', prepupa: 'Caterpillar spinning silk', pupa: 'Pupa (chrysalis)', adult: 'Butterfly' };
  const moults = (d) => (d < BF.hatch ? 0 : Math.min(4, Math.floor((d - BF.hatch) / 3.2)));
  it.setT = (t) => { it.t = Math.max(0, Math.min(it.tMax, t)); const d = it.t, st = it.stage(d); it.eggs.forEach((e) => { e.visible = it.laid && d < BF.hatch + 0.3; });
    // eaten leaves: the caterpillar eats about 9 leaves in all, most of them in its last 5 days
    const eat = d < BF.hatch ? 0 : 9 * Math.pow(clamp01((d - BF.hatch) / (BF.prepupa - BF.hatch)), 2.2); it.eaten = eat;
    it.food.forEach((f, i) => { const k = clamp01(eat - i); f.m.visible = k < 0.98; f.m.material = k > 0.15 ? bitten : (i < 2 ? foodM : tree.userData.leafM); f.m.scale.set(1, Math.max(0.05, 1 - 0.85 * k), 1); });
    const L = it.lenOn(d); it.len = L; const leaf = it.food[Math.min(8, Math.floor(eat))].m; const at = st === 'egg' || st === 'none' ? E0 : leaf.getWorldPosition(V()).add(V(0, 0.006, 0));
    cy.visible = st === 'young'; co.visible = st === 'green' || st === 'prepupa'; if (cy.visible) { cy.position.copy(at); cy.scale.setScalar(L / 0.004); }
    if (co.visible) { co.scale.setScalar(L / 0.045); co.position.copy(st === 'prepupa' ? it.pupaAt.clone().add(V(-0.006, -0.02, -0.006)) : at.clone().add(V(0, -0.02, 0))); }
    pupa.visible = st === 'pupa' || (st === 'adult' && d < BF.emerge + 1.2); pupa.userData.dark(smooth(BF.dark, BF.emerge, d)); pupa.userData.split(st === 'adult' ? 1 : 0);
    it.say([`${w_('Day')} ${Math.floor(d)}`, `${w_(SN[st])}${st === 'young' || st === 'green' ? ` · ${(L * 1000).toFixed(0)} mm · ${w_('moults')}: ${moults(d)} · ${w_('leaves eaten')}: ${eat.toFixed(1)}` : ''}`], ['#ffffff', '#ffd23f']); };
  // laying: the butterfly visits the three young leaves and leaves one egg on each
  it.lay = (cb) => { if (it.busy) return false; const path = [V(0.6, 1.5, -0.3), ...it.eggAt.map((p) => p.clone().add(V(0, 0.03, 0))), V(-0.8, 1.8, -1.6)]; let i = 0; it.layBusy = true;
    const next = () => { if (i >= path.length) { it.laid = true; it.layBusy = false; bfFree = true; it.setT(it.t); if (cb) cb(); return; } const to = path[i]; const from = bf.position.clone(); let k = 0; const dt = clock();
      const go = () => { k = Math.min(1, k + dt() / 1.4); bf.position.lerpVectors(from, to, ease(k)); bf.position.y += Math.sin(k * Math.PI) * 0.08; bf.rotation.y = ang(to.x - from.x, to.z - from.z) + Math.PI / 2; if (k < 1) requestAnimationFrame(go); else { if (i >= 1 && i <= 3) it.eggs[i - 1].visible = true; i++; setTimeout(next, i >= 2 && i <= 4 ? 700 : 50); } }; go(); };
    bfFree = false; next(); return true; };
  let bfFree = true, fa = 0, T0 = 0;
  it.adult = () => it.laid && it.t >= BF.emerge;
  animator(it); const up0 = it.update;
  it.update = (dt, tt) => { up0(dt); const d = Math.min(dt || 0.016, 0.05); T0 += d;
    // wing beats: flying fast, resting slowly opening and closing
    const flying = !bfFree || it.layBusy; bf.userData.setWings(flying ? 0.15 + 0.9 * (0.5 + 0.5 * Math.sin(T0 * 22)) : 0.6 + 0.5 * Math.sin(T0 * 1.6));
    if (bfFree && !it.laid) { fa += d * 0.5; bf.position.set(TC.x + Math.cos(fa) * 0.85, 1.3 + Math.sin(fa * 2.3) * 0.15, TC.z + Math.sin(fa) * 0.75); bf.rotation.y = -fa + Math.PI; }
    else if (bfFree && it.laid) bf.visible = false;
    // the new adult: out of the pupa, wings crumpled, then spread and dry, then away
    if (it.laid && it.t >= BF.emerge) { const e = clamp01((it.t - BF.emerge) / 1.6); bf2.visible = true; bf2.position.copy(it.pupaAt).add(V(0.0, 0.02 + e * (e > 0.85 ? (e - 0.85) * 6 : 0), 0.01)); bf2.rotation.set(e < 0.85 ? -1.2 : 0, 0, 0);
      bf2.userData.crumple(1 - smooth(0.1, 0.7, e)); bf2.userData.setWings(e < 0.85 ? 1.4 : 0.2 + 0.9 * (0.5 + 0.5 * Math.sin(T0 * 20))); } else bf2.visible = false;
    cy.tick && cy.tick(d); co.tick && co.tick(d); for (const f of ticks) f(d, tt); };
  it.views = { tree: { p: V(0, 1.6, 1.0), t: V(0, 1.05, -1.0) }, eggs: { p: V(0, 1.55, 0.55), t: V(0, 1.15, -0.95) }, low: { p: V(0.15, 1.4, 0.45), t: V(0, 0.85, -1.0) } };
  it.bf.position.set(0.6, 1.5, -0.3); it.setT(0); it.say([w_('A young lemon tree')], '#ffffff');
  return done1(it, { height: 1.4, radius: 1.0 });
}
// a leaf with bites taken out of its edge (alpha), from the same photo
const biteTex = () => T.bite || (T.bite = (() => { const C = document.createElement('canvas'); C.width = 256; C.height = 512; const x = C.getContext('2d'); const t = new THREE.CanvasTexture(C); t.colorSpace = THREE.SRGBColorSpace;
  const im = new Image(); im.onload = () => { x.drawImage(im, 0, 0, 256, 512); x.globalCompositeOperation = 'destination-out'; const q = rnd(13); for (let i = 0; i < 14; i++) { const y = 120 + q() * 330, side = q() < 0.5 ? 40 + q() * 40 : 216 - q() * 40; x.beginPath(); x.arc(side, y, 18 + q() * 26, 0, TAU); x.fill(); } t.needsUpdate = true; }; im.src = 'bio2/leaf_ovate.webp'; return t; })());
// a swallowtail's pupa: angular, two short horns at the head, a hump, green with pale lines; it turns dark before the
// butterfly comes out, then splits open at the head
const pupaTex = () => T.pupa || (T.pupa = tex(128, 256, (x) => { const g = x.createLinearGradient(0, 0, 128, 0); g.addColorStop(0, '#7f9a3e'); g.addColorStop(0.5, '#a9bd5c'); g.addColorStop(1, '#7f9a3e'); x.fillStyle = g; x.fillRect(0, 0, 128, 256);
  x.strokeStyle = 'rgba(235,235,170,0.55)'; x.lineWidth = 2; for (const px of [30, 64, 98]) { x.beginPath(); x.moveTo(px, 0); x.lineTo(px + 4, 256); x.stroke(); } x.fillStyle = 'rgba(220,210,120,0.4)'; x.beginPath(); x.ellipse(64, 90, 30, 40, 0, 0, TAU); x.fill(); }));
export function chrysalis() {
  const g = new THREE.Group(); const L = 0.03; const pts = []; for (let i = 0; i <= 14; i++) { const t = i / 14; const w = L * (0.06 + 0.24 * Math.sin(Math.PI * Math.pow(t, 0.8)) + (t > 0.55 && t < 0.75 ? 0.05 : 0)); pts.push([w, t * L]); }
  const geo = new THREE.LatheGeometry(pts.map(([a, b]) => new THREE.Vector2(a, b)), 6); geo.scale(1, 1, 0.75); const p = geo.attributes.position; for (let i = 0; i < p.count; i++) { const y = p.getY(i) / L; p.setZ(i, p.getZ(i) + Math.sin(y * Math.PI) * L * 0.12); } geo.computeVertexNormals();
  const m = lm({ map: pupaTex() }); const body = new THREE.Mesh(geo, m); body.rotation.x = Math.PI; body.position.y = L; g.add(body); // head up (the lathe's top is its tail end, attached below)
  const horns = []; for (const s of [-1, 1]) { const h = new THREE.Mesh(new THREE.ConeGeometry(0.0012, 0.004, 4), m); h.position.set(s * 0.002, L + 0.0005, 0.001); h.rotation.z = -s * 0.4; g.add(h); horns.push(h); }
  const silk = new THREE.Mesh(new THREE.TorusGeometry(0.0055, 0.0003, 4, 16, Math.PI), lm({ color: 0xe9e5d6 })); silk.position.set(0, L * 0.62, -0.002); silk.rotation.y = Math.PI / 2; g.add(silk);
  const pad = new THREE.Mesh(new THREE.SphereGeometry(0.0012, 6, 4), lm({ color: 0xe9e5d6 })); pad.position.set(0, 0, -0.001); g.add(pad);
  g.userData.dark = (k) => { m.color.setRGB(1 - 0.75 * k, 1 - 0.78 * k, 1 - 0.8 * k); };
  g.userData.split = (k) => { body.scale.set(1 + 0.08 * k, 1, 1 + 0.08 * k); horns.forEach((h, i) => { h.rotation.z = (i ? -1 : 1) * (0.4 + 0.9 * k); }); };
  noHit(g); return g;
}
export function bindButterfly(bt, th, app, s, done = {}) {
  // the lens: three egg leaves and three empty ones; then the caterpillar, then the stems for the pupa
  const egg = (i) => ({ at: () => bt.eggAt[i].clone(), view: () => [bt.eggs[i].position.clone(), bt.eggs[i].position.clone().add(V(0.004, 0.012, 0.008))], text: () => bt.W(bt.t < BF.hatch ? 'Egg: round, pale yellow, about 1 mm, alone on a young leaf' : 'Empty eggshell: the caterpillar has hatched and eaten most of it'), hit: () => true, r: 0.1 });
  const none = (i) => ({ at: () => bt.emptyAt[i].clone(), view: () => [bt.emptyAt[i].clone(), bt.emptyAt[i].clone().add(V(0.02, 0.05, 0.05))], text: () => bt.W('No eggs on this leaf'), hit: () => false, r: 0.1 });
  const SP = [egg(0), none(0), egg(1), none(1), egg(2), none(2)];
  const stems = bt.stemSpots.map((p, i) => ({ at: () => p.clone(), view: () => (i === 0 ? [bt.pupaAt.clone().add(V(0, 0.015, 0)), bt.pupaAt.clone().add(V(0.05, 0.03, 0.07))] : [p.clone(), p.clone().add(V(0.05, 0.03, 0.08))]), text: () => bt.W(i === 0 ? (bt.t < BF.dark ? 'Pupa: green like the stem, held by a silk girdle' : 'Pupa: dark now; the wings show through its skin') : 'Only the stem here'), hit: () => i === 0, r: 0.1 }));
  bt.spots = { eggs: SP, stems };
  const all = [...SP, ...stems];
  const step1 = s.find, step3 = s.pupa;
  bindLens(bt, th.lens, all.map((S, i) => ({ ...S, at: () => (i < 6 ? (stepNow(app, step1) ? S.at() : V(99, 0, 99)) : stepNow(app, step3) ? S.at() : V(99, 0, 99)) })), app, [step1, step3], {
    seen: (i) => { if (i < 6 && SP[i].hit()) { bt.found = (bt.found || 0) + 1; } if (i >= 6 && stems[i - 6].hit()) bt.foundPupa = true; },
    looked: () => { if (stepNow(app, step1) && [0, 2, 4].every((k) => bt.lensSeen.has(k)) && done.eggs) done.eggs(); if (stepNow(app, step3) && bt.foundPupa && done.pupa) done.pupa(); } }, { carryY: 1.3 });
  // the steel scale: to the caterpillar (in the two measuring steps)
  bt.measure = (ruler, cb) => { if (bt.busy) return false; bt.busy = true; ruler.flying = true; const L = bt.len; const tgt = (bt.cy.visible ? bt.cy : bt.co).getWorldPosition(V()); const p0 = ruler.g.position.clone(), at = tgt.clone().add(V(0.0, 0.004, 0.012)); let k = 0; const dt = clock();
    if (!bt.rTag) { bt.rTag = tag('', '#ffd23f', 0.05); bt.g.add(bt.rTag); }
    const go = () => { k = Math.min(1, k + dt() / 2.6); ruler.g.position.lerpVectors(p0, at, ease(clamp01(k / 0.3))); if (k > 0.85) ruler.g.position.lerpVectors(at, ruler.home.p, ease((k - 0.85) / 0.15));
      if (k > 0.3) { bt.rTag.visible = true; bt.rTag.position.copy(tgt).add(V(0, 0.06, 0)); bt.rTag.setText(`${(L * 1000).toFixed(0)} mm`); if (k < 0.33) bt.bubble.look(tgt.clone(), tgt.clone().add(V(0.01, 0.03 + L * 0.8, 0.03 + L)), bt.W(bt.cy.visible ? 'Young caterpillar: brown and white, like a bird dropping' : 'Full-grown caterpillar: green, with eye spots')); }
      if (k < 1) requestAnimationFrame(go); else { ruler.flying = false; ruler.placed = false; bt.busy = false; bt.measures.push({ day: bt.t, mm: L * 1000 }); if (cb) cb(L); } }; go(); return true; };
  carry(th.ruler, [{ at: () => (bt.cy.visible ? bt.cy : bt.co).getWorldPosition(V()), r: 0.14, open: () => (stepNow(app, s.m1) || stepNow(app, s.m2)) && !bt.busy && (bt.cy.visible || bt.co.visible), put: (x) => bt.measure(x, () => done.measured && done.measured()) }], { carryY: 1.25 });
  bindCalendar(bt, th.knob, app, { [s.d4]: 4, [s.d18]: 17.5, [s.d20]: 21, [s.d28]: BF.tMax }, { end: () => done.day && done.day() });
  bt.canTime = () => bt.laid;
  const u0 = bt.update; bt.update = (dt, t) => { u0(dt, t); const i = app.runner.i;
    if ((i === s.d4 || i === s.d18) && (bt.cy.visible || bt.co.visible)) { const c = (bt.cy.visible ? bt.cy : bt.co).getWorldPosition(V()); bt.bubble.look(c, c.clone().add(V(0.01, 0.025 + bt.len, 0.03 + bt.len)), bt.W(bt.cy.visible ? (bt.t < BF.hatch + 0.6 ? 'Hatching: the tiny caterpillar eats its eggshell first' : 'Eating the leaf from the edge') : bt.t >= BF.prepupa ? 'It stops eating and spins a silk pad' : 'Green now: it eats a whole leaf a day')); }
    else if (i === s.d28 && bt.t >= BF.emerge - 1.5) { const p = bt.pupaAt.clone().add(V(0, 0.02, 0)); bt.bubble.look(p, p.clone().add(V(0.06, 0.02, 0.1)), bt.W(bt.t < BF.emerge ? 'The pupa turns dark: the wings are ready inside' : 'Out! It pumps blood into its wings to spread them')); }
    else if (i === s.d20 && !bt.foundPupa) bt.bubble.hideBubble(); };
}

// ------------------------------------------------------------------ Class 8 (10): a hen's eggs, from egg to hen
// A wooden table on a farm. A desi hen sits on her straw nest beside it. On the table: a basket with two brown eggs from
// her nest (she lives with a cock: these are fertilised) and two white eggs from a shop (laid by hens kept without a
// cock: not fertilised), an incubator with a thermostat, and a candler (a bright lamp in a dark tube). The student
// chooses the temperature; what grows inside each egg follows that temperature and whether the egg was fertilised.
export const EGGS = [{ id: 'A', white: false, fert: true }, { id: 'B', white: false, fert: true }, { id: 'C', white: true, fert: false }, { id: 'D', white: true, fert: false }];
// growth per day at temperature T (°C): 37.5 is right; below 32 the embryo does not grow; above 40 it dies
export const devRate = (T) => (T < 32 ? 0 : T < 37 ? (T - 32) / 5 * 0.85 : T <= 38.5 ? 1 : T < 40 ? 1.05 : 1.1);
export const deadAt = (T) => (T >= 40 ? 2.5 : T >= 39.3 ? 9 : T < 30 ? 6 : Infinity);
export function henTable(o = {}) {
  const it = new Item('bwhen', { ...o, name: N3('Eggs, an incubator and a candler', 'अंडे, इनक्यूबेटर और कैंडलर', 'Ande, incubator aur candler') });
  const g = it.g, w_ = o.W || ((k) => k), ticks = []; dryLand();
  // the hen on her nest, to the left of the table
  const nest = new THREE.Group(); const straw = []; const r = rnd(8); for (let i = 0; i < 160; i++) { const a = r() * TAU, d = 0.12 + r() * 0.12, L = 0.06 + r() * 0.09; straw.push(new THREE.CylinderGeometry(0.0012, 0.0012, L, 3).rotateZ(Math.PI / 2 + (r() - 0.5) * 0.6).rotateY(a + Math.PI / 2 + (r() - 0.5)).translate(Math.cos(a) * d, 0.01 + r() * 0.05, Math.sin(a) * d)); }
  nest.add(new THREE.Mesh(mergeGeoms(straw), lm({ color: 0xc9a75a }))); const nb = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.24, 0.05, 20), lm({ color: 0xa88545 })); nb.position.y = 0.02; nest.add(nb); nest.position.set(-1.45, 0, -0.75); g.add(nest);
  const hen = oModel('hen', { face: [0.6, 1] }); hen.position.set(-1.45, 0.04, -0.75); g.add(hen); it.hen = hen;
  // the incubator: a wooden box with a glass top, a bulb, a tray with four egg cups, a thermostat dial and a thermometer
  const IC = V(0.15, Y, -0.72); const wood = lm({ map: T.ply || (T.ply = tex(128, 64, (x) => { x.fillStyle = '#b08458'; x.fillRect(0, 0, 128, 64); const q = rnd(3); for (let i = 0; i < 40; i++) { x.strokeStyle = `rgba(90,60,30,${0.15 + q() * 0.2})`; x.beginPath(); const yy = q() * 64; x.moveTo(0, yy); x.bezierCurveTo(40, yy + 3, 80, yy - 3, 128, yy + 1); x.stroke(); } })) });
  const ib = new THREE.Group(); ib.position.copy(IC); g.add(ib);
  ib.add(box(0.42, 0.012, 0.26, wood, 0, 0.006, 0)); for (const [sx, sz, x, z] of [[0.42, 0.012, 0, 0.125], [0.42, 0.012, 0, -0.125], [0.012, 0.26, 0.205, 0], [0.012, 0.26, -0.205, 0]]) ib.add(box(sx, 0.12, sz, wood, x, 0.066, z));
  const lid = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.006, 0.26), new THREE.MeshBasicMaterial({ color: 0xdfeff2, transparent: true, opacity: 0.18, depthWrite: false })); lid.position.y = 0.13; lid.userData.noHit = true; ib.add(lid);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.018, 12, 8), new THREE.MeshBasicMaterial({ color: 0x5a5040, toneMapped: false })); bulb.position.set(-0.15, 0.1, 0); ib.add(bulb); it.bulb = bulb;
  const tray = box(0.3, 0.01, 0.16, lm({ color: 0xd8d2c4 }), 0.03, 0.03, 0); ib.add(tray);
  it.cups = [0, 1, 2, 3].map((i) => V(IC.x - 0.06 + i * 0.065, IC.y + 0.036, IC.z));
  it.cupAt = (i) => it.cups[i].clone(); it.inCup = [null, null, null, null];
  const scr = liveSign(0.04, 2.6); scr.position.set(IC.x + 0.15, IC.y + 0.2, IC.z + 0.13); g.add(scr); it.scr = scr;
  it.dial = 25; it.dialPath = () => [V(IC.x + 0.08, Y + 0.02, -0.42), V(IC.x + 0.42, Y + 0.02, -0.42)];
  const dl = box(0.36, 0.006, 0.03, lm({ map: tex(256, 32, (x) => { x.fillStyle = '#2b2f33'; x.fillRect(0, 0, 256, 32); x.fillStyle = '#e8e8e8'; x.font = `700 16px ${FONT}`; for (let t = 25; t <= 45; t += 5) { const px = 8 + (t - 25) / 20 * 240; x.fillRect(px, 0, 2, 10); x.fillText(t + '°', px - 8, 28); } }) }), IC.x + 0.25, Y + 0.003, -0.42); g.add(dl);
  it.setDial = (v) => { it.dial = Math.round(v * 2) / 2; scr.set([`${it.dial.toFixed(1)} °C`], it.dial >= 37 && it.dial <= 38.5 ? '#8be07a' : '#ffb46b'); bulb.material.color.set(it.dial > 30 ? 0xffd27a : 0x5a5040); };
  // the candler: a dark tube with a bright lamp; an egg held over its mouth glows and shows what is inside
  const CA = V(-0.5, Y, -0.66); const tube = lath([[0.035, 0], [0.04, 0.0], [0.04, 0.16], [0.03, 0.17], [0.022, 0.18], [0.02, 0.18]], lm({ color: 0x1c1d20 }), 20); tube.position.copy(CA); g.add(tube);
  it.candleAt = () => CA.clone().add(V(0, 0.2, 0));
  // the glowing egg on the candler (its inside is drawn on a canvas, from the egg's real state)
  const gC = document.createElement('canvas'); gC.width = 256; gC.height = 320; const gT = new THREE.CanvasTexture(gC); gT.colorSpace = THREE.SRGBColorSpace;
  const glowEgg = new THREE.Mesh(new THREE.LatheGeometry(eggProfile(EGG_L * 1.01).map(([a, b]) => new THREE.Vector2(a, b)), 28), new THREE.MeshBasicMaterial({ map: gT, toneMapped: false })); glowEgg.position.copy(CA).add(V(0, 0.181, 0)); glowEgg.visible = false; glowEgg.userData.noHit = true; g.add(glowEgg); it.glowEgg = glowEgg;
  // the eggs' own story, day by day, from the temperature they really had
  it.T = (EGGS.map(() => 0)); it.t = 0; it.tMax = 24 + 140; it.hist = [];
  it.state = (e) => { const ix = EGGS.indexOf(e.data); const inc = it.inCup.includes(e); if (!inc || !e.data.fert) return { dev: 0, alive: false, fert: e.data.fert, inc };
    const dev = e.dev || 0, dead = e.dead || false; return { dev, alive: !dead, fert: true, inc, dead, ix }; };
  it.drawCandled = (e) => { const x = gC.getContext('2d'), W = 256, H = 320; const S = it.state(e); x.clearRect(0, 0, W, H);
    // the glow of the shell
    const gr = x.createRadialGradient(W / 2, H * 0.55, 10, W / 2, H * 0.55, W * 0.7); gr.addColorStop(0, e.data.white ? '#fff3c8' : '#ffd08a'); gr.addColorStop(1, e.data.white ? '#e8a050' : '#c86a28'); x.fillStyle = gr; x.fillRect(0, 0, W, H);
    // the air cell at the blunt end (it grows as water leaves the egg)
    const air = 0.12 + 0.12 * clamp01(it.t / 20); x.fillStyle = 'rgba(255,250,230,0.85)'; x.fillRect(0, 0, W, H * air); x.strokeStyle = 'rgba(150,80,30,0.6)'; x.lineWidth = 2; x.beginPath(); x.moveTo(0, H * air); x.quadraticCurveTo(W / 2, H * air + 10, W, H * air); x.stroke();
    if (!S.fert || !S.inc) { x.fillStyle = 'rgba(200,110,30,0.35)'; x.beginPath(); x.arc(W / 2, H * 0.6, 60, 0, TAU); x.fill(); gT.needsUpdate = true; return 'clear'; } // yolk shadow only: a clear egg
    const d = S.dev; if (d < 0.8 && !S.dead) { x.fillStyle = 'rgba(200,110,30,0.35)'; x.beginPath(); x.arc(W / 2, H * 0.6, 60, 0, TAU); x.fill(); gT.needsUpdate = true; return 'none'; }
    if (S.dead) { x.strokeStyle = 'rgba(150,20,10,0.85)'; x.lineWidth = 6; x.beginPath(); x.arc(W / 2, H * 0.6, 55, 0, TAU); x.stroke(); x.fillStyle = 'rgba(90,20,10,0.6)'; x.beginPath(); x.arc(W / 2 + 10, H * 0.62, 7, 0, TAU); x.fill(); gT.needsUpdate = true; return 'dead'; } // a blood ring
    // veins spreading from the embryo, the embryo growing and moving
    const R = Math.min(1, d / 10); const cx = W / 2 + 6, cy = H * 0.58; const q = rnd(e.data.id.charCodeAt(0));
    x.strokeStyle = 'rgba(160,20,15,0.85)'; const branch = (px, py, a, len, w, n) => { if (n <= 0 || len < 4) return; const ex = px + Math.cos(a) * len, ey = py + Math.sin(a) * len; x.lineWidth = w; x.beginPath(); x.moveTo(px, py); x.quadraticCurveTo(px + Math.cos(a + 0.3) * len * 0.5, py + Math.sin(a + 0.3) * len * 0.5, ex, ey); x.stroke(); branch(ex, ey, a + 0.45 + (q() - 0.5) * 0.4, len * 0.68, w * 0.7, n - 1); branch(ex, ey, a - 0.45 + (q() - 0.5) * 0.4, len * 0.68, w * 0.7, n - 1); };
    for (let i = 0; i < 7; i++) branch(cx, cy, i / 7 * TAU + q() * 0.4, 30 + 70 * R, 3.5, 4);
    const es = 6 + 40 * clamp01(d / 14) + 40 * clamp01((d - 14) / 6); x.fillStyle = `rgba(60,15,8,${0.7 + 0.25 * clamp01(d / 18)})`; x.beginPath(); x.ellipse(cx, cy, es, es * 0.8, 0.4, 0, TAU); x.fill();
    if (d > 3 && d < 15) { x.fillStyle = 'rgba(10,5,5,0.95)'; x.beginPath(); x.arc(cx - es * 0.4, cy - es * 0.3, 3 + d * 0.4, 0, TAU); x.fill(); } // the dark eye
    if (d >= 17) { x.fillStyle = 'rgba(40,12,6,0.9)'; x.fillRect(0, H * (air + 0.02), W, H); }
    gT.needsUpdate = true; return d >= 17 ? 'full' : 'veins'; };
  // the two chicks that hatch (one per fertile egg that lived), and the hen they grow into
  it.chicks = [chick(), chick()]; it.chicks.forEach((c) => { c.visible = false; g.add(c); }); const pullet = oModel('hen', { face: [-0.3, 1] }); pullet.visible = false; g.add(pullet); it.pullet = pullet;
  const sign = liveSign(0.085, 4.8); sign.position.set(0, Y + 0.85, -1.25); g.add(sign); it.say = (l, c) => sign.set(l, c);
  const bub = zoomBubble({ at: V(-0.62, Y + 0.36, -0.85), r: 0.13, hide: [sign] }); g.add(bub); it.bubble = bub;
  it.knobPath = () => [V(0.5, Y + 0.02, -0.5), V(1.1, Y + 0.02, -0.5)];
  it.eggs = []; // filled by the activity
  // the days pass: each egg in the incubator grows at the rate its temperature allows
  it.setT = (t) => { const t0 = it.t; it.t = Math.max(0, Math.min(it.tMax, t)); const dd = it.t - t0;
    for (const e of it.eggs) { if (!it.inCup.includes(e) || !e.data.fert || e.dead) continue; const steps = Math.max(1, Math.ceil(dd * 4)); for (let k = 0; k < steps; k++) { e.dev = (e.dev || 0) + devRate(it.dial) * dd / steps; e.hot = (e.hot || 0) + dd / steps; } if ((e.hot || 0) >= deadAt(it.dial)) e.dead = true; }
    // hatching on day 21 for a healthy egg (a day later if it was kept a little cool)
    let n = 0; for (const e of it.eggs) { const ok = e.data.fert && !e.dead && it.inCup.includes(e) && (e.dev || 0) >= 20.5; if (ok && n < 2) { e.hatchK = clamp01(((e.dev || 0) - 20.5) / 0.6); hatchEgg(e, it.chicks[n], e.hatchK, it.t); n++; } }
    it.hatched = n; const wk = Math.max(0, it.t - 22) / 7;
    it.chicks.forEach((c, i) => { if (!c.visible) return; if (wk > 0) { const k = clamp01(wk / 20); c.scale.setScalar(1 + 3.5 * k); c.position.set(-0.85 + i * 0.3, 0, 0.12 + i * 0.06); c.visible = wk < 18; } });
    pullet.visible = n > 0 && wk >= 18; pullet.position.set(-0.75, 0, 0.12); pullet.scale.setScalar(clamp01(0.75 + (wk - 18) * 0.1));
    it.say([`${w_('Day')} ${Math.floor(it.t)}${wk > 0 ? ` (${w_('week')} ${Math.floor(wk)} ${w_('after hatching')})` : ''}`, `${w_('Incubator')}: ${it.dial.toFixed(1)} °C · ${w_('chicks hatched')}: ${n}`], ['#ffffff', '#ffd23f']); };
  const hatchEgg = (e, c, k, t) => { const U = e.model.userData; if (!U.cap) return; U.cap.rotation.z = -1.4 * smooth(0.4, 1, k); U.cap.position.set(0.01 * smooth(0.4, 1, k), 0.012 * smooth(0.4, 1, k), 0); U.inner.visible = k > 0.4;
    c.visible = k > 0.5; if (c.visible) { const p = e.g.getWorldPosition(V()); if (t < 22) c.position.copy(p).add(V(0.035 * smooth(0.5, 1, k), 0.0, 0)); c.scale.setScalar(t < 22 ? 0.7 : 1); c.rotation.y = 0.8; c.userData.setWet(clamp01(1 - (t - 21) / 0.5)); } };
  it.limFor = (i) => (it.lims ? it.lims[i] ?? it.tMax : it.tMax);
  animator(it); const up0 = it.update; let TT = 0;
  it.update = (dt, tt) => { up0(dt); const d = Math.min(dt || 0.016, 0.05); TT += d; hen.rotation.y = Math.sin(TT * 0.7) * 0.06; hen.position.y = 0.04 + Math.max(0, Math.sin(TT * 2.1)) * 0.002; it.chicks.forEach((c, i) => { if (c.visible && it.t > 21.6) c.rotation.y = 0.8 + Math.sin(TT * 1.3 + i) * 0.6; }); for (const f of ticks) f(d, tt); };
  it.views = { all: { p: V(-0.45, 1.65, 0.85), t: V(-0.6, Y - 0.2, -0.8) }, table: { p: V(-0.15, 1.45, 0.3), t: V(-0.2, Y + 0.1, -0.75) }, incub: { p: V(0.1, 1.3, 0.05), t: V(0.12, Y + 0.05, -0.72) }, chicks: { p: V(-0.45, 1.25, 1.0), t: V(-0.75, 0.15, 0.0) } };
  it.setDial(25); it.setT(0); it.say([w_('A hen on her nest')], '#ffffff');
  return done1(it, { height: 0.6, radius: 1.6 });
}
export function eggThing(data, label) { const m = eggMesh(data.white); const it = thing(label, m, { hitR: 0.045, hitY: 0.028, kind: 'egg_' + data.id }); it.data = data; it.dev = 0; it.dead = false; it.candled = {}; return it; }
export function bindHen(ht, eggs, th, app, s, done = {}) {
  ht.eggs = eggs;
  const put = (e, i, cb) => { ht.inCup[ht.inCup.indexOf(e)] = null; ht.inCup[i] = e; e.flying = true; flyT(e, ht.cupAt(i), 0, 0.7, () => { e.flying = false; e.placed = false; e.home = { p: e.g.position.clone(), q: e.g.quaternion.clone() }; if (cb) cb(); }); };
  ht.put = put;
  ht.candle = (e, cb) => { if (ht.busy) return false; ht.busy = true; e.flying = true; const p0 = e.g.position.clone(), at = ht.candleAt(); let k = 0; const dt = clock(); let res = null;
    const go = () => { k = Math.min(1, k + dt() / 2.4); e.g.position.lerpVectors(p0, at, ease(clamp01(k / 0.25))); if (k > 0.8) e.g.position.lerpVectors(at, p0, ease((k - 0.8) / 0.2));
      const on = k > 0.25 && k < 0.8; ht.glowEgg.visible = on; e.g.visible = !on; if (on && !res) { res = ht.drawCandled(e); e.candled[app.runner.i] = res; const c = ht.candleAt().add(V(0, 0.028, 0)); ht.bubble.look(c, c.clone().add(V(0.0, 0.01, 0.13)), ht.W(CANDLE[res])); }
      if (k < 1) requestAnimationFrame(go); else { e.flying = false; e.placed = false; e.g.visible = true; ht.glowEgg.visible = false; ht.busy = false; if (cb) cb(res); } }; go(); return true; };
  const CANDLE = { clear: 'Clear: only the yolk\'s shadow. Nothing is growing.', none: 'No veins yet: nothing has started to grow', dead: 'A ring of blood: the embryo has died', veins: 'Blood vessels spread from a dark spot: an embryo, its heart beating', full: 'Dark and full: the chick fills the egg, the air cell is big' };
  for (const e of eggs) carry(e, [...[0, 1, 2, 3].map((i) => ({ at: () => ht.cupAt(i), r: 0.035, open: () => stepNow(app, s.put) && !ht.inCup[i], put: (x) => put(x, i, () => done.put && done.put()) })),
    { at: () => ht.candleAt(), r: 0.09, open: () => [s.cA, s.cB].some((k) => stepNow(app, k)) && !ht.busy, put: (x) => { x.g.position.copy(x.home.p); ht.candle(x, () => done.candled && done.candled(x)); } }], { carryY: Y + 0.16 });
  bindDial(ht, th.dial, app, s.temp, { lo: 25, hi: 45, released: () => done.temp && done.temp() });
  ht.lims = { [s.d4]: 4, [s.d18]: 18, [s.hatch]: 21.6, [s.grow]: 22 + 140 };
  bindCalendar(ht, th.knob, app, ht.lims, { end: (i) => done.day && done.day(i) });
  const u0 = ht.update; ht.update = (dt, t) => { u0(dt, t); if (app.runner.i === s.hatch && ht.t > 20.6) { const e = eggs.find((x) => x.data.fert && !x.dead && ht.inCup.includes(x)); if (e) { const p = e.g.getWorldPosition(V()).add(V(0.02, 0.03, 0)); ht.bubble.look(p, p.clone().add(V(0.04, 0.05, 0.13)), ht.W(ht.t < 21 ? 'Pipping: the chick breaks a small hole with its egg tooth' : 'Out! Wet at first, fluffy in a few hours')); } } };
}
