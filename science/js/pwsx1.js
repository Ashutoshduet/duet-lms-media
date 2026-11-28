// DUET Science Lab 360, physics batch PW-SX (the topics still missing next to the SenseXR catalogue, done hands-on): shared
// pieces for the whole batch, and the two machines of the magnetic effect of a current at the lab bench: an electric bell
// (Class 8) and a DC motor (Class 10). Everything is built in code at real size with real materials (brass, copper, soft
// iron, carbon, varnished wood); what happens is worked out from what the student does: the bell's armature, hammer and
// contact screw move by their own dynamics (spring, electromagnet force ∝ I²/gap², the coil's L/R), the motor's coil turns
// by the torque N·B·I·L·w on its sides through a split ring, with back e.m.f. and friction. See devtools/PHYSICS_WORLD.md.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { clone as skClone } from 'three/addons/utils/SkeletonUtils.js';
import { Item } from './apparatus.js';
import { canvasTex, woodTex } from './mats.js';
import { clamp01, ease } from './mathlab2.js';
import { pushKnob } from './mathworld3.js';
import { liveSign } from './mathworld4.js';
import { slideKnob } from './mathworld5.js';
import { tag, animator, rnd, noHit, stepNow, V, FONT } from './mathworld_j1.js';
import { carry } from './bioworld4.js';
import { thing, flyT, zoomBubble } from './oceanworld1.js';
import { BENCH_Y } from './room.js';
import { LITE } from './lite.js';

export { tag, animator, rnd, noHit, stepNow, V, FONT, clamp01, ease, pushKnob, slideKnob, liveSign, carry, thing, flyT, zoomBubble, BENCH_Y, LITE };
export const BY = BENCH_Y, TAU = Math.PI * 2, DEG = Math.PI / 180;
export const OKC = '#8be07a', YEL = '#ffd23f', RED = '#ff8a5a', WHT = '#ffffff', BLU = '#7cc4ff';
export const lerp = (a, b, k) => a + (b - a) * k;

// ------------------------------------------------------------------ materials (shared, so few programs: all MeshStandard or MeshBasic)
const MC = {};
export const mat = (k, f) => MC[k] || (MC[k] = f());
const std = (k, o) => mat(k, () => new THREE.MeshStandardMaterial(o));
export const brass = () => std('brass', { color: 0xd2a94e, metalness: 1, roughness: 0.26 });
export const oldBrass = () => std('obrass', { color: 0xb08a45, metalness: 1, roughness: 0.42 });
export const copper = () => std('copper', { color: 0xc06e3c, metalness: 1, roughness: 0.3 });
export const steel = () => std('steel', { color: 0xc9cdd2, metalness: 1, roughness: 0.22 });
export const iron = () => std('iron', { color: 0x55595e, metalness: 0.85, roughness: 0.48 });
export const bake = () => std('bake', { color: 0x1a1a1c, metalness: 0.1, roughness: 0.38 }); // bakelite / ebonite
export const carbon = () => std('carbon', { color: 0x2b2b2d, metalness: 0.2, roughness: 0.75 });
export const plastic = (c) => std('pl' + c, { color: c, metalness: 0, roughness: 0.45 });
export const paint = (c, r = 0.55) => std('pt' + c + r, { color: c, metalness: 0.2, roughness: r });
export const glow = (c, o = 1) => mat('gl' + c + o, () => new THREE.MeshBasicMaterial({ color: c, transparent: o < 1, opacity: o, toneMapped: false, depthWrite: o >= 1 }));
export const addGlow = (c, o = 1) => mat('ag' + c + o, () => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: o, toneMapped: false, depthWrite: false, blending: THREE.AdditiveBlending }));
const WOOD = {}; export const wood = (base = '#7d522e', rep = [1, 1]) => WOOD[base + rep] || (WOOD[base + rep] = new THREE.MeshStandardMaterial({ map: woodTex(base, rep), roughness: 0.62, metalness: 0 }));
// an enamelled copper winding: turns side by side, each one a little round wire catching the light
const CT = {}; export function coilMat(turns = 40, col = '#b5582c') {
  const k = turns + col; if (CT[k]) return CT[k];
  const t = canvasTex(64, 512, (x, w, h) => { x.fillStyle = col; x.fillRect(0, 0, w, h); const n = Math.min(128, turns); const p = h / n;
    for (let i = 0; i < n; i++) { const g = x.createLinearGradient(0, i * p, 0, (i + 1) * p); g.addColorStop(0, 'rgba(40,12,0,0.85)'); g.addColorStop(0.35, 'rgba(255,190,140,0.55)'); g.addColorStop(0.55, 'rgba(255,220,180,0.25)'); g.addColorStop(1, 'rgba(40,12,0,0.85)'); x.fillStyle = g; x.fillRect(0, i * p, w, p); } });
  t.wrapS = t.wrapT = THREE.RepeatWrapping; return (CT[k] = new THREE.MeshStandardMaterial({ map: t, metalness: 0.75, roughness: 0.3 }));
}
export const rod = (a, b, r, m, seg = 12) => { const d = b.clone().sub(a), me = new THREE.Mesh(new THREE.CylinderGeometry(r, r, d.length(), seg), m); me.position.copy(a).add(b).multiplyScalar(0.5); me.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize()); me.castShadow = true; return me; };
export const box = (g, m, sx, sy, sz, x, y, z) => { const me = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), m); me.position.set(x, y, z); me.castShadow = true; me.receiveShadow = true; g.add(me); return me; };
export const lathe = (pts, m, seg = 40) => { const me = new THREE.Mesh(new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg), m); me.castShadow = true; return me; };
// a terminal post: a brass screw with a knurled brass nut on a bakelite washer
export function post(g, p, h = 0.014) { const t = new THREE.Group(); t.position.copy(p); g.add(t); const w = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.002, 16), bake()); w.position.y = 0.001; t.add(w);
  const s = new THREE.Mesh(new THREE.CylinderGeometry(0.0022, 0.0022, h, 10), brass()); s.position.y = h / 2; t.add(s); const n = new THREE.Mesh(new THREE.CylinderGeometry(0.0055, 0.0055, 0.004, 14), brass()); n.position.y = h * 0.55; t.add(n); return t; }
// fewer draw calls (phones): still meshes of a group that share a material become one mesh per material
export function mergeStatic(parent, keep = []) {
  const by = new Map();
  for (const m of [...parent.children]) { if (!m.isMesh || m.isSkinnedMesh || m.isInstancedMesh || !m.visible || keep.includes(m) || m.children.length || Array.isArray(m.material) || m.userData.keep) continue;
    if (!by.has(m.material)) by.set(m.material, []); by.get(m.material).push(m); }
  for (const [mt, list] of by) { if (list.length < 2) continue;
    const geos = list.map((m) => { m.updateMatrix(); const q = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone(); for (const a of Object.keys(q.attributes)) if (!['position', 'normal', 'uv'].includes(a)) q.deleteAttribute(a); if (!q.attributes.uv) q.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(q.attributes.position.count * 2), 2)); q.morphAttributes = {}; return q.applyMatrix4(m.matrix); });
    const merged = mergeGeometries(geos, false); geos.forEach((q) => q.dispose()); if (!merged) continue;
    const mm = new THREE.Mesh(merged, mt); mm.castShadow = list.some((x) => x.castShadow); mm.receiveShadow = true; mm.userData.noHit = true; parent.add(mm); for (const x of list) { parent.remove(x); x.geometry.dispose(); } }
}
// a rig: one Item that holds a whole set-up (the student works it through knobs, levers and things carried to it)
export function rig(kind, name, o = {}) { const it = new Item(kind, { name }); animator(it); it.noGrab = true; it.noPhys = true; it.base = 0; it.height = o.height ?? 0.4; it.radius = o.radius ?? 0.4; it.W = o.W || ((k) => k); return it; }
export const done1 = (it) => { noHit(it.g); return it; };
// the rig's sim runs every frame: it.tick(dt) (sim time, already scaled by the app's speed)
export function ticker(it, f) { const u0 = it.update; it.update = (dt, t) => { if (u0) u0.call(it, dt, t); f(Math.min(dt || 0.016, 0.05), t); }; }
// the camera view changes with the step (views[i] for step i; the last one given goes on)
export function camBy(it, app, views) { const u0 = it.update; let last = -1, first = true; it.update = (dt, t) => { const i = app.runner.i;
    // a bench activity starts in its own view too (the app frames the whole bench otherwise)
    if (first && it.camView) { first = false; if (!app.userCam && !app.runner.exp?.world && !app.renderer.xr.isPresenting) { const sc = Math.max(1, 1 / Math.max(0.3, innerWidth / innerHeight)); app.camGoal = { p: it.g.position.clone().add(it.camView.p.clone().multiplyScalar(sc)), t: it.g.position.clone().add(it.camView.t) }; } }
    if (i !== last) { last = i; let v = null; for (let j = Math.min(i, views.length - 1); j >= 0 && !v; j--) v = views[j]; if (v) it.camView = typeof v === 'function' ? v() : v; } if (u0) u0.call(it, dt, t); }; it.camView = views[0] || it.camView; }
// a knob (the yellow ball of the app) on the bench
export { pullTab } from './mathworld.js';
export const benchPath = (x0, x1, z, y = BY + 0.012) => () => [V(x0, y, z), V(x1, y, z)];
export const pressPath = (p, d = 0.035) => () => [p.clone().add(V(0, d, 0)), p.clone()];
// a flexible cable between two points (rig-local): ends() → [a, b, da, db]; rebuilt only when an end has moved
export function cable(g, color, ends, o = {}) {
  const r = o.r ?? 0.0016; const me = new THREE.Mesh(new THREE.BufferGeometry(), plastic(color)); me.castShadow = true; me.userData.noHit = true; me.userData.keep = true; g.add(me); let key = ''; const C = { mesh: me, curve: null };
  C.update = () => { const [a, b, da, db] = ends(); const k = [a, b].map((p) => p.toArray().map((x) => x.toFixed(4)).join(',')).join('|'); if (k === key) return; key = k;
    const L = a.distanceTo(b), out = Math.min(0.05, 0.015 + L * 0.12); const a1 = a.clone().addScaledVector(da || V(0, 1, 0), out), b1 = b.clone().addScaledVector(db || V(0, 1, 0), out);
    const mid = a1.clone().lerp(b1, 0.5); mid.y = Math.max(o.floor ?? BY + r, Math.min(a1.y, b1.y) - L * (o.sag ?? 0.18)); const pts = [a, a1, mid, b1, b];
    C.curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal'); me.geometry.dispose(); me.geometry = new THREE.TubeGeometry(C.curve, o.seg ?? 28, r, 6, false); };
  C.update(); return C;
}
// moving dots that show the current along cables (one instanced mesh for the whole circuit): set(curves, amps, dir)
export function currentDots(g, n = 48) {
  const im = new THREE.InstancedMesh(new THREE.SphereGeometry(0.0018, 6, 4), glow(0xffe066), n); im.frustumCulled = false; im.userData.noHit = true; im.renderOrder = 5; g.add(im); const M4 = new THREE.Matrix4(), P = V(0, 0, 0); let ph = 0;
  const D = { im, set: () => {} };
  D.tick = (dt, paths, amps) => { ph += dt * Math.min(1.2, Math.abs(amps)) * 0.6 * Math.sign(amps || 1); const on = Math.abs(amps) > 0.02 && paths.length; let k = 0;
    if (on) { const tot = paths.reduce((s, c) => s + c.getLength(), 0); let acc = 0; for (const c of paths) { const L = c.getLength(); const m = Math.max(1, Math.round(n * L / tot)); for (let i = 0; i < m && k < n; i++) { let u = ((i / m + ph * 0.25 / Math.max(0.05, L)) % 1 + 1) % 1; c.getPointAt(u, P); M4.makeTranslation(P.x, P.y, P.z); im.setMatrixAt(k++, M4); } acc += L; } }
    for (; k < n; k++) { M4.makeScale(0, 0, 0); im.setMatrixAt(k, M4); } im.instanceMatrix.needsUpdate = true; im.visible = !!on; };
  return D;
}
// a crocodile clip on the end of a lead: a carried thing
export function clipThing(label, col) {
  const g = new THREE.Group(); const jaw = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.008, 0.008), steel()); jaw.position.set(0.0, 0.006, 0); g.add(jaw);
  const boot = new THREE.Mesh(new THREE.CylinderGeometry(0.0055, 0.0045, 0.03, 10), plastic(col)); boot.rotation.z = Math.PI / 2; boot.position.set(0.026, 0.006, 0); g.add(boot);
  g.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.userData.noHit = true; } });
  const it = thing(label, g, { hitR: 0.03, hitY: 0.01, height: 0.02, kind: 'pwsxclip' }); it.tip = V(-0.015, 0.006, 0); return it;
}
// ------------------------------------------------------------------ the app's own glove hands (WebXR Input Profiles, MIT), posed in code
let GL = null; const GC = {};
export const loadGlb = (url) => GC[url] || (GC[url] = (GL ||= new GLTFLoader().setMeshoptDecoder(MeshoptDecoder)).loadAsync(url).then((g) => g.scene).catch((e) => { console.warn('pwsx model', url, e && e.message); return null; }));
export const HAND_MAT = new THREE.MeshStandardMaterial({ color: 0xeef1f6, roughness: 0.45, metalness: 0, emissive: 0x1a1d22 });
export function gloveHand(side = 'left', m = HAND_MAT) {
  const g = new THREE.Group(); g.joints = {};
  g.ready = loadGlb(`lib/xr/hand-${side}.glb`).then((src) => { if (!src) return null; const h = skClone(src);
    h.traverse((x) => { if (x.isMesh || x.isSkinnedMesh) { x.material = m; x.frustumCulled = false; x.castShadow = true; x.userData.noHit = true; } if (x.isBone || /finger|thumb|wrist/.test(x.name)) g.joints[x.name] = x; });
    g.add(h); g.model = h; return g; });
  return g;
}
const jpos = (hh, n) => { const b = hh.joints[n]; if (!b) return V(0, 0, 0); hh.model.updateMatrixWorld(true); return hh.model.worldToLocal(b.getWorldPosition(V(0, 0, 0))); };
function handAxes(hh, side) { const f = jpos(hh, 'middle-finger-tip').sub(jpos(hh, 'wrist')).normalize(); const t = jpos(hh, 'index-finger-metacarpal').sub(jpos(hh, 'pinky-finger-metacarpal')); t.addScaledVector(f, -t.dot(f)).normalize(); const n = side === 'right' ? t.clone().cross(f) : f.clone().cross(t); return { f, t, n }; }
// turn a finger so its tip points along dir (model frame): its joints swing about the first joint named
function aimFinger(hh, names, dir) { const J = hh.joints; const p0 = J[names[0]] && J[names[0]].position.clone(), tip = J[names[names.length - 1]]; if (!p0 || !tip) return;
  const q = new THREE.Quaternion().setFromUnitVectors(tip.position.clone().sub(p0).normalize(), dir.clone().normalize()); for (const k of names.slice(1)) { const b = J[k]; if (!b) continue; b.position.sub(p0).applyQuaternion(q).add(p0); b.quaternion.premultiply(q); } J[names[0]].quaternion.premultiply(q); }
// Fleming's left-hand rule: first finger along the field, second finger along the current, thumb along the force.
// F, B, I are directions in the parent frame (mutually perpendicular, F = I × B).
export function flemingHand(Bd, Id, Fd) {
  const g = gloveHand('left'); g.ready.then((hh) => { if (!hh) return; const a = handAxes(hh, 'left');
    const fing = ['index', 'middle', 'ring', 'pinky']; const ch = (f) => [`${f}-finger-phalanx-proximal`, `${f}-finger-phalanx-intermediate`, `${f}-finger-phalanx-distal`, `${f}-finger-tip`];
    aimFinger(hh, ch('index'), a.f); aimFinger(hh, ch('middle'), a.n); aimFinger(hh, ch('ring'), a.n.clone().multiplyScalar(0.8).addScaledVector(a.f, -0.6)); aimFinger(hh, ch('pinky'), a.n.clone().multiplyScalar(0.8).addScaledVector(a.f, -0.6));
    aimFinger(hh, ['thumb-metacarpal', 'thumb-phalanx-proximal', 'thumb-phalanx-distal', 'thumb-tip'], a.t.clone().addScaledVector(a.f, 0.15)); void fing;
    // turn the hand: its f (index) → B, n (middle, out of the palm) → I, t (thumb) → F
    const A = new THREE.Matrix4().makeBasis(a.f, a.t, a.n), Bm = new THREE.Matrix4().makeBasis(Bd.clone().normalize(), Fd.clone().normalize(), Id.clone().normalize()); hh.model.quaternion.setFromRotationMatrix(Bm.multiply(A.invert()));
    hh.model.updateMatrixWorld(true); const c = jpos(hh, 'index-finger-metacarpal').applyQuaternion(hh.model.quaternion); hh.model.position.copy(c.negate()); });
  return g;
}
// an arrow with a label, drawn on top (field, current, force)
export function arrow3(col, len = 0.05, r = 0.0025) { const g = new THREE.Group(); const m = glow(col); const s = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len * 0.72, 8), m); s.position.y = len * 0.36; g.add(s); const h = new THREE.Mesh(new THREE.ConeGeometry(r * 2.6, len * 0.28, 12), m); h.position.y = len * 0.86; g.add(h); g.traverse((x) => { x.renderOrder = 20; x.userData.noHit = true; }); return g; }
export const pointArrow = (a, from, dir, len) => { a.position.copy(from); a.quaternion.setFromUnitVectors(V(0, 1, 0), dir.clone().normalize()); a.scale.setScalar(len / 0.05); };
// a little "ding" for the bell and a crack for sparks (WebAudio, see audio.js)
export const sfx = (app, k, x = 1) => { const a = app && app.audio; if (!a || !a.ctx || app.muted) return;
  if (k === 'ding') { a.tone(1480 * x, 0.6, 0.09, 'sine'); a.tone(3900 * x, 0.25, 0.03, 'sine'); a.tone(2210 * x, 0.4, 0.04, 'triangle'); }
  else if (k === 'thud') a.tone(170, 0.12, 0.25, 'sine', 70); else if (k === 'spark') { a.burst(0.05, 5200, 0.5, 'highpass'); a.burst(0.09, 900, 0.3, 'bandpass'); }
  else if (k === 'click') a.tone(2400, 0.03, 0.06, 'square'); else if (k === 'thunder') { a.burst(1.6, 160, 0.9, 'lowpass'); setTimeout(() => a.burst(2.4, 90, 0.7, 'lowpass'), 250); } else if (k === 'hum') a.tone(120 * x, 0.3, 0.03, 'sawtooth'); };

// ------------------------------------------------------------------ Class 8 Ch 4: an electric bell
// A real school bell on an upright varnished board: a U-shaped soft-iron electromagnet (two coils of enamelled copper
// wire), a soft-iron armature on a flat steel spring with the hammer on top, a brass gong, and the contact screw that
// touches the spring at rest. The circuit: two D cells (3 V), a bell push and two loose leads the student clips to the
// bell's terminals. The armature moves by its own dynamics (x = how far it has moved at the poles):
//   m x'' = A·I²/(gap + 0.5 mm)² − k x − b x', the current follows V/R with the coil's L/R = 3 ms while the contact is
//   made (x < c, c set by the contact screw), the hammer bounces off the gong at x = 1.82 mm.
// c > 0 and small: it rings 25–50 times a second; c < 0: the circuit is open and nothing happens; c ≥ 1.8 mm: the
// contact never breaks, the hammer is pulled once and stays pressed on the gong. Slow motion: the same equations, run slower.
export const BELL = { m: 0.014, k: 28, b: 0.06, A: 9e-5, g0: 0.006, ge: 0.0005, xh: 0.00182, e: 0.35, V: 3, R: 6, tau: 0.003, cMin: -0.001, cMax: 0.0025 };
export function electricBell(o = {}) {
  const it = rig('pwsxbell', { en: 'Electric bell, two cells and a bell push', hi: 'बिजली की घंटी, दो सेल और घंटी का बटन', hg: 'Electric bell, do cells aur bell push' }, o); const g = it.g, W = it.W;
  const ZB = -0.8, BX = 0.0; const P = (u, v, w = 0) => V(BX + u, BY + v, ZB + 0.009 + w); // u right, v up the board, w out of it
  // the board (varnished teak) on its foot
  const wd = wood('#8a5530', [1, 1.2]); box(g, wd, 0.26, 0.3, 0.018, BX, BY + 0.15 + 0.004, ZB); box(g, wd, 0.28, 0.02, 0.12, BX, BY + 0.01, ZB + 0.04);
  // the electromagnet: a soft-iron yoke and two limbs, a coil on each
  const ir = iron(); box(g, ir, 0.012, 0.1, 0.014, BX - 0.091, BY + 0.14, ZB + 0.031); const coilM = coilMat(48);
  for (const v of [0.11, 0.17]) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.06, 28, 1), coilM); c.rotation.z = Math.PI / 2; c.position.copy(P(-0.045, v, 0.022)); c.castShadow = true; g.add(c);
    for (const e of [-0.077, -0.013]) { const f = new THREE.Mesh(new THREE.CylinderGeometry(0.019, 0.019, 0.003, 28), bake()); f.rotation.z = Math.PI / 2; f.position.copy(P(e, v, 0.022)); g.add(f); }
    g.add(rod(P(-0.09, v, 0.022), P(-0.005, v, 0.022), 0.0058, ir)); }
  // the armature on its spring (pivot near the bottom), with the hammer
  const PIV = P(0.006, 0.07, 0.022); const arm = new THREE.Group(); arm.position.copy(PIV); g.add(arm);
  box(arm, ir, 0.006, 0.112, 0.022, 0, 0.014 + 0.056, 0); box(arm, steel(), 0.0012, 0.03, 0.016, 0.0034, 0.005, 0); // soft iron plate, its spring strip
  const hamR = rod(V(0, 0.124, 0), V(0.003, 0.192, 0.008), 0.0016, steel()); arm.add(hamR); const ball = new THREE.Mesh(new THREE.SphereGeometry(0.0072, 18, 12), steel()); ball.position.set(0.004, 0.192, 0.008); ball.castShadow = true; arm.add(ball);
  const cspr = box(arm, brass(), 0.0012, 0.02, 0.01, 0.0036, 0.07, 0); // the contact spring with its platinum point
  box(g, steel(), 0.016, 0.02, 0.026, BX + 0.006, BY + 0.06, ZB + 0.022); // the clamp the spring is screwed to
  // the gong: a brass dome on its pillar
  const GC = P(-0.04, 0.262, 0.03); const gong = new THREE.Group(); gong.position.copy(GC); g.add(gong);
  const dome = lathe([[0.0, 0.0], [0.012, 0.0005], [0.026, 0.004], [0.036, 0.011], [0.0405, 0.019], [0.0412, 0.024], [0.0398, 0.0245], [0.0388, 0.02], [0.035, 0.0125], [0.025, 0.006], [0.011, 0.0035], [0, 0.003]], brass(), 48); dome.rotation.x = Math.PI / 2; dome.position.z = -0.024; gong.add(dome);
  g.add(rod(P(-0.04, 0.262, 0), P(-0.04, 0.262, 0.012), 0.0035, steel()));
  // the contact screw in its brass pillar
  box(g, brass(), 0.012, 0.022, 0.016, BX + 0.044, BY + 0.14, ZB + 0.031); const scr = new THREE.Group(); g.add(scr); scr.add(rod(V(0, 0, 0), V(-0.03, 0, 0), 0.0024, steel())); const sh = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.004, 16), brass()); sh.rotation.z = Math.PI / 2; sh.position.x = 0.002; scr.add(sh);
  const tipX = () => BX + 0.0105 - it.c; // its tip moves in as c grows (the contact spring on the armature is at u = 0.0105 at rest)
  const setScrew = () => scr.position.set(tipX() + 0.03, BY + 0.14, ZB + 0.031);
  // terminals at the foot and the wiring on the board (T1 → coil → coil → spring clamp; contact screw → T2)
  const T = [P(-0.075, 0.03, 0.02), P(0.075, 0.03, 0.02)]; for (const p of T) post(g, p.clone().add(V(0, -0.0, 0)).setY(BY + 0.02)).rotation.set(0, 0, 0);
  const wTop = [T[0].clone().setY(BY + 0.034), T[1].clone().setY(BY + 0.034)];
  const boardWire = (pts) => { const c = new THREE.CatmullRomCurve3(pts); const m = new THREE.Mesh(new THREE.TubeGeometry(c, 30, 0.0009, 5), copper()); m.userData.noHit = true; g.add(m); return c; };
  const iw1 = boardWire([wTop[0], P(-0.085, 0.06, 0.012), P(-0.08, 0.11, 0.04)]), iw2 = boardWire([P(-0.012, 0.17, 0.04), P(0.0, 0.2, 0.016), P(0.02, 0.11, 0.012), P(0.006, 0.06, 0.035)]), iw3 = boardWire([P(0.05, 0.14, 0.04), P(0.07, 0.1, 0.014), wTop[1]]);
  // two D cells in a holder, the bell push, and the leads
  const cellG = new THREE.Group(); cellG.position.set(-0.24, BY, -0.6); g.add(cellG); box(cellG, plastic(0x222326), 0.075, 0.012, 0.075, 0, 0.006, 0);
  const lab = canvasTex(256, 128, (x, w, h) => { x.fillStyle = '#16181b'; x.fillRect(0, 0, w, h); x.fillStyle = '#d8a21a'; x.fillRect(0, h * 0.18, w, h * 0.64); x.fillStyle = '#16181b'; x.font = `800 40px ${FONT}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('1.5 V  D', w / 2, h / 2); });
  for (const s of [-1, 1]) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.0168, 0.0168, 0.061, 28), new THREE.MeshStandardMaterial({ map: lab, metalness: 0.4, roughness: 0.35 })); c.rotation.x = Math.PI / 2; c.position.set(s * 0.018, 0.029, 0); cellG.add(c); const nub = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.003, 12), steel()); nub.rotation.x = Math.PI / 2; nub.position.set(s * 0.018, 0.029, s * 0.032); cellG.add(nub); }
  const bpX = 0.2, bpZ = -0.6; const push = new THREE.Group(); push.position.set(bpX, BY, bpZ); g.add(push); push.add(lathe([[0, 0], [0.03, 0], [0.03, 0.004], [0.027, 0.02], [0.016, 0.026], [0, 0.026]], plastic(0xe9e6df), 32));
  const btn = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.0095, 0.008, 24), plastic(0xc8b892)); btn.position.y = 0.029; push.add(btn);
  const plus = V(-0.24 + 0.018, BY + 0.03, -0.6 - 0.04), minus = V(-0.24 - 0.018, BY + 0.03, -0.6 + 0.04);
  const pushIn = V(bpX - 0.028, BY + 0.006, bpZ), pushOut = V(bpX + 0.0, BY + 0.006, bpZ + 0.028);
  const fixed = cable(g, 0xc62828, () => [plus, pushIn, V(0, 0, -1), V(-1, 0, 0)], { sag: 0.05 });
  const leadA = clipThing({ en: 'Red lead from the bell push', hi: 'घंटी के बटन से आती लाल तार', hg: 'Bell push se aati laal taar' }, 0xc62828), leadB = clipThing({ en: 'Black lead from the cells', hi: 'सेलों से आती काली तार', hg: 'Cells se aati kaali taar' }, 0x202020);
  it.leads = [leadA, leadB]; it.leadHome = [V(0.12, BY, -0.55), V(-0.12, BY, -0.54)]; it.T = T; it.on = [-1, -1]; // which terminal each lead is on
  const clipAt = (L) => L.g.getWorldPosition(V(0, 0, 0)).add(V(-0.015, 0.006, 0).applyQuaternion(L.g.quaternion));
  const cA = cable(g, 0xc62828, () => [pushOut, clipAt(leadA), V(0, 0, 1), V(1, 0, 0)], { sag: 0.1 }), cB = cable(g, 0x202020, () => [minus, clipAt(leadB), V(0, 0, 1), V(1, 0, 0)], { sag: 0.1 });
  const dots = currentDots(g, 60);
  // the slow-motion dial and the read-out
  const rd = liveSign(0.06, 6.5); rd.position.set(BX + 0.0, BY + 0.345, ZB + 0.03); g.add(rd);
  const zb = zoomBubble({ at: V(BX + 0.27, BY + 0.24, ZB + 0.12), r: 0.075, fov: 16 }); zb.visible = false; g.add(zb); it.bubble = zb;
  const spark = new THREE.Mesh(new THREE.SphereGeometry(0.0022, 10, 8), addGlow(0xbfe4ff)); spark.visible = false; g.add(spark); const sparkL = new THREE.Mesh(new THREE.SphereGeometry(0.006, 10, 8), addGlow(0x6aa8ff, 0.5)); spark.add(sparkL);
  // state
  let gongT = 0;
  Object.assign(it, { c: 0.0008, x: 0, v: 0, I: 0, slow: 1, pressT: 0, strikes: 0, strikesSlow: 0, sparkT: 0, wired: false, rev: false, rang: 0, stuck: false, lastHit: -1, simT: 0, everClosed: false });
  setScrew();
  it.connected = () => it.on[0] >= 0 && it.on[1] >= 0;
  it.closed = () => it.pressT > 0 && it.connected() && it.x < it.c;
  it.status = () => { const L = []; L.push(it.connected() ? `${W('Leads on the bell')} ✓` : W('Clip both leads to the bell\'s terminals')); return L; };
  it.press = (sec = 2.5) => { if (!it.connected()) { it.say([W('Nothing happens: the leads are not connected'), W('Clip both leads to the bell\'s terminals')], [RED, WHT]); it.pressT = 0.8; it.rang = 0; return true; }
    it.pressT = sec * (it.slow < 0.5 ? 1 / it.slow * 0.1 : 1); it.rang = 0; it.pressStep = o.app ? o.app.runner.i : -1; it.stuck = false; it.everClosed = false; btn.position.y = 0.025; sfx(o.app, 'click'); return true; };
  it.setSlow = (k) => { it.k = clamp01(k); it.slow = it.k < 0.05 ? 1 : 1 / Math.round(1 + 49 * it.k); if (it.onK) it.onK(it.k); };
  it.setC = (k) => { it.kc = clamp01(k); it.c = BELL.cMin + (BELL.cMax - BELL.cMin) * it.kc; setScrew(); if (it.onKc) it.onKc(it.kc); };
  it.kc = (it.c - BELL.cMin) / (BELL.cMax - BELL.cMin); it.k = 0;
  it.say = (l, c) => rd.set(l, c);
  // the leads: carried to a terminal, they clip on (each terminal takes one); anywhere else they go back
  it.clipOn = (L, ti) => { const i = it.leads.indexOf(L); if (it.on[1 - i] === ti) return false; it.on[i] = ti; L.placed = true; flyT(L, T[ti].clone().add(V(ti ? 0.017 : -0.017, 0.012, 0)).setY(BY + 0.012), ti ? Math.PI : 0, 0.5, () => { L.placed = false; sfx(o.app, 'click'); if (it.onClip) it.onClip(L, ti); }); return true; };
  it.unclip = (L) => { const i = it.leads.indexOf(L); it.on[i] = -1; };
  it.rev = false;
  // the physics, in small fixed steps of simulated time (slow motion runs fewer of them per frame)
  const B = BELL, h = 2e-5;
  ticker(it, (dt) => {
    let tt = dt * it.slow; if (it.pressT > 0) { it.pressT -= dt; if (it.pressT <= 0) { it.pressT = 0; btn.position.y = 0.029; } }
    let n = 0; while (tt > 1e-9 && n++ < 3000) { const s = Math.min(h, tt); tt -= s; it.simT += s; const cl = it.closed(); if (cl) it.everClosed = true;
      const It = cl ? B.V / B.R : 0; const wasOn = it.I > 0.15; it.I += (It - it.I) * Math.min(1, s / B.tau); const g0 = B.g0 - it.x; const F = B.A * it.I * it.I / ((g0 + B.ge) ** 2);
      it.v += (F - B.k * it.x - B.b * it.v) / B.m * s; it.x += it.v * s; if (it.x < 0) { it.x = 0; if (it.v < 0) it.v = -it.v * 0.2; }
      if (it.x >= B.xh) { it.x = B.xh; if (it.v > 0.05) { it.strikes++; it.rang++; it.stuck = false; if (it.slow < 0.5) it.strikesSlow++; if (it.simT - it.lastHit > 0.03 || it.slow < 0.5) sfx(o.app, 'ding', 1); it.lastHit = it.simT; gongT = 1; } else if (it.v > 0 && it.pressT > 0 && cl) it.stuck = true; if (it.v > 0) it.v = -it.v * B.e; }
      if (wasOn && !cl && it.x > 0 && it.pressT > 0) it.sparkT = 0.04 / Math.max(it.slow, 0.02) * 0.02 + 0.012; }
    // pose
    arm.rotation.z = it.x / 0.07; gongT = Math.max(0, gongT - dt * 6); dome.position.x = Math.sin(performance.now() * 0.09) * 0.0004 * gongT;
    const cp = V(BX + 0.0105, BY + 0.14, ZB + 0.031).sub(PIV).applyAxisAngle(V(0, 0, 1), it.x / 0.07).add(PIV);
    if (it.sparkT > 0) { it.sparkT -= dt; spark.visible = true; spark.position.copy(cp).add(V(0.0008, 0, 0)); spark.scale.setScalar(0.6 + Math.random() * 0.8); } else spark.visible = false;
    cA.update(); cB.update(); const paths = it.I > 0.02 ? [fixed.curve, cA.curve, iw1, iw2, iw3, cB.curve] : []; dots.tick(dt * Math.max(0.05, it.slow), paths, it.I * (it.on[0] === 1 ? -1 : 1));
    if (it.connected() || it.pressT > 0) { const ring = it.pressT > 0 && it.rang > 0 && !it.stuck;
      it.say([`${it.pressT > 0 ? W('Switch pressed') : W('Switch not pressed')} · ${it.closed() ? W('contact closed') : W('contact open')} · ${(it.I).toFixed(2)} A`, `${it.slow < 1 ? `${W('slow motion')} 1/${Math.round(1 / it.slow)} · ` : ''}${W('screw')} ${it.c >= 0 ? '+' : ''}${(it.c * 1000).toFixed(1)} mm · ${W('strikes')}: ${it.strikes}`],
        [it.closed() ? OKC : WHT, ring ? OKC : it.stuck ? RED : YEL]); }
    else it.say([W('Clip both leads to the bell\'s terminals'), `${W('screw')} ${it.c >= 0 ? '+' : ''}${(it.c * 1000).toFixed(1)} mm`], [YEL, WHT]);
    if (it.stuck && it.pressT > 0) it.say([W('The hammer is stuck on the gong: the contact never opens'), W('Turn the screw back a little')], [RED, YEL]);
  });
  it.contactPoint = () => V(BX + 0.0105, BY + 0.14, ZB + 0.031);
  it.knobPath = benchPath(-0.06, 0.12, -0.46); it.screwPath = benchPath(-0.06, 0.12, -0.42); it.pushAt = V(bpX, BY + 0.03, bpZ);
  it.views = { all: { p: V(0.0, BY + 0.58, 0.02), t: V(0.0, BY + 0.15, -0.72) }, board: { p: V(0.05, BY + 0.36, -0.24), t: V(0.03, BY + 0.2, -0.78) }, contact: { p: V(0.14, BY + 0.32, -0.3), t: V(0.1, BY + 0.2, -0.76) } };
  it.camView = it.views.all;
  mergeStatic(g, [btn, dome]); mergeStatic(cellG); mergeStatic(push, [btn]);
  return it;
}
export function bindBell(bl, knob, screw, pushK, app, s, done = {}) {
  const on = (k) => (Array.isArray(s[k]) ? s[k] : [s[k]]).some((i) => stepNow(app, i));
  // the leads go to the terminals whenever the student carries them there (also to swap them round)
  for (const L of bl.leads) carry(L, bl.T.map((p, ti) => ({ at: () => p.clone(), r: 0.035, open: () => !bl.busy, put: (x) => { bl.unclip(x); if (!bl.clipOn(x, ti)) flyT(x, x.home.p.clone(), 0, 0.6); } })), { carryY: BY + 0.08 });
  for (const L of bl.leads) { const r0 = L.onRelease; L.onRelease = () => { bl.unclip(L); r0(); }; }
  bl.onClip = () => { if (on('wire') && bl.connected()) done.wire && done.wire(); if (on('rev') && bl.connected() && bl.on[0] === 1) bl.rev = true; };
  pushKnob(pushK, { path: pressPath(bl.pushAt), active: () => on('press') && bl.pressT <= 0, keepVisible: () => on('press'), press: () => bl.press() });
  const sync = slideKnob(knob, { path: () => bl.knobPath(), active: () => on('slow'), keepVisible: () => on('slow'), k: () => bl.k, set: (k) => bl.setSlow(k) });
  const sync2 = slideKnob(screw, { path: () => bl.screwPath(), active: () => on('screw'), keepVisible: () => on('screw'), k: () => bl.kc, set: (k) => bl.setC(k) });
  bl.onK = () => sync(); bl.onKc = () => sync2();
  const cap = () => bl.W('Contact screw: the circuit opens and closes here');
  // a step is done when what it asks has really happened
  let lastS = 0; const u0 = bl.update; bl.update = (dt, t) => { u0(dt, t);
    if (app.runner.i >= (Array.isArray(s.watch) ? s.watch[0] : s.watch) && !bl.bubble.visible) { const c = bl.contactPoint(); bl.bubble.look(c.clone().add(V(-0.002, 0, 0)), c.clone().add(V(0.032, 0.014, 0.05)), cap()); }
    if (app.runner.i > s.slow && bl.slow < 1 && !on('slow')) bl.setSlow(0);
    if (on('ring') && bl.rang >= 6 && !bl.stuck && bl.pressStep === app.runner.i && done.ring) done.ring(app.runner.i);
    if (on('watch') && bl.slow <= 1 / 15 && bl.strikesSlow - lastS >= 3 && done.watch) done.watch(); if (!on('watch')) lastS = bl.strikesSlow;
    if (on('silent') && bl.pressT > 0 && bl.c < 0 && bl.connected() && bl.pressT < 0.6 && done.silent) done.silent();
    if (on('rev') && bl.on[0] === 1 && bl.on[1] === 0 && bl.rang >= 6 && done.rev) done.rev(); };
}

// ------------------------------------------------------------------ Class 10 Ch 12: a DC motor
// A school demonstration motor: two ceramic magnets on a steel yoke (N on the left, S on the right, B = 0.25 T across a
// 11 cm gap), a rectangular coil ABCD of enamelled copper wire (8 cm along the axle, 6 cm across) on a steel axle in brass
// bearings, a split-ring commutator and two carbon brushes. Three D cells in a holder with a sliding tap (1, 2 or 3 cells),
// a reversing switch, and a coil with taps of 10, 20 and 50 turns. The coil turns by its own dynamics:
//   torque = N·B·I·L·w·|cos φ| (the split ring reverses the current every half turn; at the gaps, ±6°, no current),
//   I = (V − back e.m.f.)/R with R = 0.4 Ω per cell + 0.03 Ω per turn + 0.3 Ω, friction b·ω + 0.0015 N m.
// Slip rings in place of the split ring: torque ∝ cos φ, the coil rocks and stops with its plane upright.
export const MOTOR = { B: 0.25, L: 0.08, w: 0.06, rc: 0.4, rt: 0.03, rb: 0.3, b: 9.4e-4, tc: 0.0015, gap: 6 * DEG };
export function dcMotor(o = {}) {
  const it = rig('pwsxmotor', { en: 'DC motor: magnets, coil, split ring and brushes', hi: 'DC मोटर: चुंबक, कुंडली, विभक्त वलय और ब्रश', hg: 'DC motor: magnets, coil, split ring aur brushes' }, o); const g = it.g, W = it.W;
  const C = V(0.04, BY + 0.115, -0.74), Lz = MOTOR.L, Wc = MOTOR.w;
  // base board, the steel yoke and the two magnets with curved pole faces
  box(g, wood('#6e4526', [1.4, 1]), 0.4, 0.018, 0.24, C.x, BY + 0.009, C.z + 0.02);
  const yk = paint(0x3a3f45, 0.4); box(g, yk, 0.22, 0.012, 0.11, C.x, BY + 0.024, C.z); for (const s of [-1, 1]) box(g, yk, 0.012, 0.115, 0.11, C.x + s * 0.104, BY + 0.08, C.z);
  const magT = (lt, col) => canvasTex(256, 256, (x, w, h) => { x.fillStyle = col; x.fillRect(0, 0, w, h); const r = rnd(lt === 'N' ? 3 : 4); for (let i = 0; i < 1400; i++) { x.fillStyle = `rgba(0,0,0,${r() * 0.12})`; x.fillRect(r() * w, r() * h, 2, 2); } x.fillStyle = '#ffffff'; x.font = `800 150px ${FONT}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(lt, w / 2, h / 2 + 8); });
  const mN = new THREE.MeshStandardMaterial({ map: magT('N', '#b8282a'), roughness: 0.6 }), mS = new THREE.MeshStandardMaterial({ map: magT('S', '#2a4f8f'), roughness: 0.6 });
  for (const [s, m] of [[-1, mN], [1, mS]]) { const mg = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.1, 0.1), [m, m, paint(s < 0 ? 0xb8282a : 0x2a4f8f), paint(s < 0 ? 0xb8282a : 0x2a4f8f), m, m]); mg.position.set(C.x + s * 0.082, C.y, C.z); mg.castShadow = true; g.add(mg); }
  // the axle in brass bearings, the coil, the commutator and the brushes
  for (const z of [C.z - 0.07, C.z + 0.072]) { box(g, oldBrass(), 0.012, C.y - BY - 0.02, 0.012, C.x, (C.y + BY + 0.02) / 2, z); }
  const rot = new THREE.Group(); rot.position.copy(C); g.add(rot); rot.add(rod(V(0, 0, -0.085), V(0, 0, 0.11), 0.0028, steel()));
  const frame = new THREE.Group(); rot.add(frame); let coilN = 20;
  const buildCoil = (N) => { for (const m of [...frame.children]) { frame.remove(m); m.geometry.dispose(); } const th = 0.003 + Math.sqrt(N) * 0.0009, cm = coilMat(N);
    for (const s of [-1, 1]) { const side = new THREE.Mesh(new THREE.BoxGeometry(th, th, Lz), cm); side.position.set(s * Wc / 2, 0, 0); side.castShadow = true; frame.add(side); const end = new THREE.Mesh(new THREE.BoxGeometry(Wc + th, th, th), cm); end.position.set(0, 0, s * Lz / 2); end.castShadow = true; frame.add(end); }
    const sp = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.004, Lz), paint(0x6d4b2f)); frame.add(sp); };
  buildCoil(coilN);
  const lbl = (t, x, z) => { const s = tag(t, '#ffffff', 0.009, 'rgba(12,16,24,0.6)'); s.position.set(x, 0.008, z); frame.add(s); return s; };
  lbl('A', Wc / 2, -Lz / 2); lbl('B', Wc / 2, Lz / 2); lbl('C', -Wc / 2, Lz / 2); lbl('D', -Wc / 2, -Lz / 2);
  const comm = new THREE.Group(); comm.position.z = 0.085; rot.add(comm);
  const half = (a0) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.0095, 0.0095, 0.022, 20, 1, false, a0, Math.PI - 0.22), copper()); m.rotation.x = Math.PI / 2; m.castShadow = true; return m; };
  const split = new THREE.Group(); split.add(half(0.11), half(Math.PI + 0.11)); comm.add(split);
  const slip = new THREE.Group(); for (const z of [-0.006, 0.006]) { const r = new THREE.Mesh(new THREE.CylinderGeometry(0.0095, 0.0095, 0.008, 24), copper()); r.rotation.x = Math.PI / 2; r.position.z = z; slip.add(r); } slip.visible = false; comm.add(slip);
  const brushes = []; for (const s of [-1, 1]) { const b = new THREE.Group(); b.position.set(C.x + s * 0.0125, C.y, C.z + 0.085); g.add(b); const cb = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.008, 0.008), carbon()); b.add(cb);
    b.add(rod(V(s * 0.003, 0, 0), V(s * 0.02, -0.06, 0.012), 0.0012, brass())); post(g, V(C.x + s * 0.02, BY + 0.018, C.z + 0.097)); brushes.push(b); }
  // three D cells with a sliding tap, the reversing switch, wiring
  const CB = V(-0.27, BY + 0.018, -0.66); const cellG = new THREE.Group(); cellG.position.copy(CB); g.add(cellG); box(cellG, plastic(0x222326), 0.075, 0.01, 0.2, 0, 0.005, 0);
  const lab = canvasTex(256, 128, (x, w, h) => { x.fillStyle = '#16181b'; x.fillRect(0, 0, w, h); x.fillStyle = '#d8a21a'; x.fillRect(0, h * 0.18, w, h * 0.64); x.fillStyle = '#16181b'; x.font = `800 40px ${FONT}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('1.5 V  D', w / 2, h / 2); });
  const cm2 = new THREE.MeshStandardMaterial({ map: lab, metalness: 0.4, roughness: 0.35 }); for (let i = 0; i < 3; i++) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.0168, 0.0168, 0.061, 28), cm2); c.rotation.x = Math.PI / 2; c.position.set(0, 0.027, -0.066 + i * 0.066); c.castShadow = true; cellG.add(c); }
  const tap = new THREE.Group(); cellG.add(tap); box(tap, brass(), 0.05, 0.004, 0.008, 0.0, 0.048, 0); tap.add(rod(V(0.025, 0.048, 0), V(0.025, 0.03, 0), 0.0015, brass()));
  const tapZ = (n) => -0.099 + n * 0.066; tap.position.z = tapZ(3);
  const RV = V(-0.13, BY, -0.58); const rv = new THREE.Group(); rv.position.copy(RV); g.add(rv); box(rv, bake(), 0.07, 0.01, 0.05, 0, 0.005, 0); for (const x of [-0.02, 0, 0.02]) post(rv, V(x, 0.01, 0.0));
  const lever = new THREE.Group(); lever.position.set(0, 0.016, 0); rv.add(lever); lever.add(rod(V(0, 0, 0), V(0, 0.045, 0), 0.0018, steel())); const kb = new THREE.Mesh(new THREE.SphereGeometry(0.006, 14, 10), bake()); kb.position.y = 0.047; lever.add(kb);
  const on0 = V(-0.27, BY + 0.03, -0.75), tapP = () => V(CB.x + 0.025, BY + 0.048, CB.z + tap.position.z);
  const wA = cable(g, 0xc62828, () => [tapP(), RV.clone().add(V(-0.02, 0.02, 0)), V(0, 1, 0), V(0, 1, 0)], { sag: 0.1 }), wB = cable(g, 0x202020, () => [on0, RV.clone().add(V(0.02, 0.02, 0)), V(0, 0, -1), V(0, 1, 0)], { sag: 0.1 });
  const bL = V(C.x - 0.02, BY + 0.03, C.z + 0.097), bR = V(C.x + 0.02, BY + 0.03, C.z + 0.097);
  const w1 = cable(g, 0xc62828, () => [RV.clone().add(V(0, 0.02, 0)), bL, V(0, 1, 0), V(0, 1, 0)], { sag: 0.1 }), w2 = cable(g, 0x202020, () => [RV.clone().add(V(0.02, 0.025, -0.01)), bR, V(0, 1, 0), V(0, 1, 0)], { sag: 0.12 });
  const dots = currentDots(g, 50);
  // field lines (on when the student looks with the left hand), current and force arrows on the sides
  const fl = new THREE.Group(); g.add(fl); for (let i = 0; i < 6; i++) { const a = arrow3(0x7cc4ff, 0.05, 0.0007); pointArrow(a, V(C.x - 0.062, C.y - 0.03 + (i % 2) * 0.06, C.z - 0.04 + Math.floor(i / 2) * 0.04), V(1, 0, 0), 0.12); fl.add(a); } fl.visible = false;
  const aI = [arrow3(0xffd23f, 0.05, 0.0018), arrow3(0xffd23f, 0.05, 0.0018)], aF = [arrow3(0x6bdc5a, 0.05, 0.0024), arrow3(0x6bdc5a, 0.05, 0.0024)]; for (const a of [...aI, ...aF]) { a.visible = false; g.add(a); }
  const hand = flemingHand(V(1, 0, 0), V(0, 0, -1), V(0, -1, 0)); hand.visible = false; hand.scale.setScalar(0.62); g.add(hand);
  const labs = ['Field B (first finger)', 'Current I (second finger)', 'Force F (thumb)'].map((t, i) => { const s = tag(W(t), ['#7cc4ff', '#ffd23f', '#6bdc5a'][i], 0.011); s.visible = false; g.add(s); return s; });
  const rd = liveSign(0.08, 6.5); rd.position.set(C.x - 0.02, BY + 0.3, C.z - 0.05); g.add(rd);
  // state
  Object.assign(it, { phi: 35 * DEG, om: 0, I: 0, cells: 1, N: 20, dir: 1, on: false, slipRings: false, held: false, revs: [], turnsLog: {}, cellsLog: {}, hist: [], stopT: 0, maxRev: 0 });
  it.R = () => MOTOR.rc * it.cells + MOTOR.rt * it.N + MOTOR.rb; it.k = () => it.N * MOTOR.B * MOTOR.L * MOTOR.w; it.V = () => 1.5 * it.cells;
  it.revS = () => it.om / TAU; // + clockwise as the student sees it
  it.setOn = (v) => { it.on = v; lever.rotation.z = v ? -0.5 * it.dir : 0; sfx(o.app, 'click'); };
  it.reverse = () => { it.dir = -it.dir; lever.rotation.z = it.on ? -0.5 * it.dir : 0; it.revs.push(it.revS()); sfx(o.app, 'click'); if (it.onRev) it.onRev(); return true; };
  it.setCells = (k) => { it.kc = clamp01(k); const n = 1 + Math.round(it.kc * 2); if (n !== it.cells) { it.cells = n; sfx(o.app, 'click'); } tap.position.z = tapZ(it.cells); if (it.onKc) it.onKc(it.kc); };
  it.setTurns = (k) => { it.kt = clamp01(k); const n = [10, 20, 50][Math.round(it.kt * 2)]; if (n !== it.N) { it.N = n; buildCoil(n); sfx(o.app, 'click'); } if (it.onKt) it.onKt(it.kt); };
  it.kc = 0; it.kt = 0.5;
  it.setSlip = (v) => { it.slipRings = v; split.visible = !v; slip.visible = v; sfx(o.app, 'click'); };
  // hold the coil level with your other hand and look along side AB with your left hand
  it.showHand = (v) => { it.held = v; hand.visible = v; fl.visible = v; for (const a of [...aI, ...aF]) a.visible = v; for (const s of labs) s.visible = v; if (v) { it.phi = 0; it.om = 0; } };
  it.say = (l, c) => rd.set(l, c);
  const steady = { t: 0, v: 0 };
  ticker(it, (dt) => {
    // it.om: turning speed, clockwise as the student sees it (rad/s); it.phi: angle of side AB from the +x side, anticlockwise
    const M = MOTOR, k = it.k(), R = it.R(), Vb = it.on ? it.V() * it.dir : 0; const sub = 8; const h = dt / sub, J = 1.6e-4 + it.N * 6e-7;
    for (let i = 0; i < sub; i++) { const c = Math.cos(it.phi);
      // the split ring keeps the current down the side on the right (|cos φ|), none at its gaps; slip rings do not (cos φ)
      const gf = it.slipRings ? c : Math.abs(c) < Math.sin(M.gap) ? 0 : Math.abs(c);
      it.I = it.on && (it.slipRings || gf !== 0) ? (Vb - k * it.om * gf) / R : 0; const tq = k * it.I * gf;
      if (it.held) { it.om = 0; it.phi = 0; continue; }
      if (Math.abs(it.om) < 0.02 && Math.abs(tq) < M.tc) { it.om = 0; continue; }
      const tf = M.b * it.om + M.tc * Math.sign(it.om || tq); it.om += (tq - tf) / J * h; it.phi -= it.om * h; }
    rot.rotation.z = it.phi; const rs = it.revS(); it.maxRev = Math.max(it.maxRev, Math.abs(rs));
    // steady speed (for the tables)
    steady.t = Math.abs(rs - steady.v) < 0.05 ? steady.t + dt : 0; steady.v = lerp(steady.v, rs, Math.min(1, dt * 3)); it.steady = steady.t > 1.2 ? steady.v : null;
    if (it.steady != null) { it.cellsLog[it.cells] = Math.abs(it.steady); if (it.cells === 3) it.turnsLog[it.N] = Math.abs(it.steady); }
    it.stopT = Math.abs(it.om) < 0.05 ? it.stopT + dt : 0;
    // arrows on the coil sides (field across, current along the sides, force up / down)
    if (it.held) { const sAB = V(C.x + Wc / 2, C.y, C.z), sCD = V(C.x - Wc / 2, C.y, C.z); const id = V(0, 0, -it.dir);
      pointArrow(aI[0], sAB.clone().addScaledVector(id, -0.03), id, 0.06); pointArrow(aI[1], sCD.clone().addScaledVector(id, 0.03), id.clone().negate(), 0.06);
      pointArrow(aF[0], sAB.clone().add(V(0, 0.004 * -it.dir, 0)), V(0, -it.dir, 0), 0.045); pointArrow(aF[1], sCD.clone().add(V(0, 0.004 * it.dir, 0)), V(0, it.dir, 0), 0.045);
      hand.position.copy(sAB).add(V(0.018, 0.0, 0.02)); hand.rotation.set(0, 0, 0); hand.scale.set(0.62, 0.62 * (it.dir > 0 ? 1 : 1), 0.62);
      labs[0].position.set(C.x - 0.03, C.y + 0.075, C.z - 0.05); labs[1].position.set(C.x + Wc / 2 + 0.01, C.y + 0.035, C.z + 0.05); labs[2].position.set(C.x + Wc / 2 + 0.03, C.y - 0.06, C.z + 0.02); }
    // brushes press on the commutator; wires and current dots
    wA.update(); wB.update(); w1.update(); w2.update(); dots.tick(dt, it.on && Math.abs(it.I) > 0.02 ? [wA.curve, w1.curve, w2.curve, wB.curve] : [], it.I);
    const deg = Math.round(((it.phi / DEG) % 360 + 360) % 360);
    it.say([`${it.cells} ${W(it.cells > 1 ? 'cells' : 'cell')} · ${it.V().toFixed(1)} V${it.dir < 0 ? ` · ${W('reversed')}` : ''} · ${it.on ? `${Math.abs(it.I).toFixed(2)} A` : W('switch off')} · ${it.N} ${W('turns')}${it.slipRings ? ` · ${W('slip rings')}` : ''}`,
      `${W('speed')} ${Math.abs(rs).toFixed(1)} ${W('rev/s')} ${Math.abs(rs) > 0.1 ? (rs > 0 ? W('clockwise') : W('anticlockwise')) : ''} · ${W('coil at')} ${deg}°`], [WHT, Math.abs(rs) > 0.3 ? OKC : YEL]);
  });
  it.switchAt = RV.clone().add(V(0, 0.06, 0)); it.cellsPath = () => [V(CB.x + 0.06, BY + 0.06, CB.z + 0.09), V(CB.x + 0.06, BY + 0.06, CB.z - 0.09)];
  it.turnsPath = benchPath(0.0, 0.18, -0.5); it.handAt = () => V(C.x + Wc / 2, C.y, C.z);
  it.views = { all: { p: V(-0.05, BY + 0.6, 0.02), t: V(-0.06, BY + 0.08, -0.7) }, coil: { p: V(0.2, BY + 0.36, -0.36), t: V(0.05, BY + 0.12, -0.74) }, front: { p: V(0.06, BY + 0.3, -0.32), t: V(0.04, BY + 0.12, -0.72) } };
  it.camView = it.views.all;
  mergeStatic(g, [lever]); mergeStatic(cellG, [tap]);
  return it;
}
export function bindMotor(mo, swK, cellK, turnK, handT, app, s, done = {}) {
  const on = (k) => (Array.isArray(s[k]) ? s[k] : [s[k]]).some((i) => stepNow(app, i));
  pushKnob(swK, { path: pressPath(mo.switchAt, 0.03), active: () => on('switch'), keepVisible: () => on('switch'), press: () => { if (on('rev')) mo.reverse(); else if (on('slip')) mo.setSlip(!mo.slipRings); else mo.setOn(!mo.on); } });
  const s1 = slideKnob(cellK, { path: () => mo.cellsPath(), active: () => on('cells'), keepVisible: () => on('cells'), k: () => mo.kc, set: (k) => mo.setCells(k) });
  const s2 = slideKnob(turnK, { path: () => mo.turnsPath(), active: () => on('turns'), keepVisible: () => on('turns'), k: () => mo.kt, set: (k) => mo.setTurns(k) });
  mo.onKc = () => s1(); mo.onKt = () => s2();
  carry(handT, [{ at: () => mo.handAt(), r: 0.06, open: () => on('hand'), put: (x) => { x.g.visible = false; x.used = true; mo.showHand(true); if (done.hand) done.hand(); } }], { carryY: BY + 0.12 });
  let t0 = 0; const u0 = mo.update; mo.update = (dt, t) => { u0(dt, t); const rs = mo.revS();
    if (on('switch') && mo.on && Math.abs(rs) > 1 && done.spin) { t0 += dt; if (t0 > 1) { t0 = 0; done.spin(); } }
    if (on('rev') && mo.dir < 0 && rs < -1 && done.rev) done.rev();
    if (on('cells') && mo.cells === 3 && mo.cellsLog[1] && mo.cellsLog[3] && mo.steady != null && done.cells) done.cells();
    if (on('turns') && mo.N === 50 && mo.turnsLog[50] && Object.keys(mo.turnsLog).length >= 2 && mo.steady != null && done.turns) done.turns();
    if (on('slip') && mo.slipRings && mo.stopT > 1.5 && done.slip) done.slip(); };
}
// fit a model into a group: o.h / o.w / o.l (height / x / z size in metres), o.rot, o.pin (point of its box, as fractions) put at o.at
export function fitModel(url, parent, o = {}) {
  return loadGlb(url).then((src) => { if (!src) return null; const m = src.clone(true); const w = new THREE.Group(); w.add(m); if (o.rot) m.rotation.set(...o.rot);
    m.updateMatrixWorld(true); let b = new THREE.Box3().setFromObject(m); const s = b.getSize(V(0, 0, 0));
    const k = o.h ? o.h / s.y : o.w ? o.w / s.x : o.l ? o.l / s.z : (o.scale || 1); m.scale.multiplyScalar(k); m.updateMatrixWorld(true); b = new THREE.Box3().setFromObject(m);
    const pin = o.pin || [0.5, 0, 0.5], at = o.at || [0, 0, 0]; const c = V(...pin.map((f, i) => b.min.getComponent(i) + (b.max.getComponent(i) - b.min.getComponent(i)) * f));
    m.position.add(V(at[0] - c.x, at[1] - c.y, at[2] - c.z)); m.traverse((x) => { if (x.isMesh) { x.castShadow = o.shadow !== false; x.receiveShadow = true; x.userData.noHit = true; for (const mm of [].concat(x.material)) if (mm && mm.transmission > 0) { mm.transmission = 0; mm.transparent = true; mm.opacity = 0.25; } } });
    parent.add(w); if (o.done) o.done(w, m); return w; });
}
// a board drawn on a canvas (charts, magnified views): returns the mesh with .draw(f(ctx, w, h))
export function canvasBoard(w, h, px = 512) { const H = Math.round(px * h / w); const t = canvasTex(px, H, () => {}); const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t, toneMapped: false, transparent: true }));
  m.userData.noHit = true; m.renderOrder = 8; m.draw = (f) => { const x = t.image.getContext('2d'); x.clearRect(0, 0, px, H); f(x, px, H); t.needsUpdate = true; }; return m; }
// a glowing beam (laser or light) as a flat strip lying on a surface (normal up), from a to b
const BT = {}; const beamTex = () => BT.t || (BT.t = canvasTex(8, 64, (x, w, h) => { const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.35, 'rgba(255,255,255,0.9)'); g.addColorStop(0.5, 'rgba(255,255,255,1)'); g.addColorStop(0.65, 'rgba(255,255,255,0.9)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h); }));
export function beamPool(g, col = 0xff2a1a) { const pool = []; let used = 0; const P0 = { begin: () => { used = 0; }, end: () => { for (let i = used; i < pool.length; i++) pool[i].visible = false; },
  seg: (a, b, w = 0.0028, op = 1, c = null) => { let m = pool[used]; if (!m) { const gm = new THREE.BufferGeometry(); gm.setAttribute('position', new THREE.BufferAttribute(new Float32Array(12), 3)); gm.setAttribute('uv', new THREE.BufferAttribute(new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]), 2)); gm.setIndex([0, 1, 2, 0, 2, 3]);
      m = new THREE.Mesh(gm, new THREE.MeshBasicMaterial({ map: beamTex(), color: col, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, side: THREE.DoubleSide })); m.renderOrder = 9; m.frustumCulled = false; m.userData.noHit = true; g.add(m); pool.push(m); }
    used++; m.visible = op > 0.01; m.material.opacity = Math.min(1, op); if (c != null) m.material.color.setHex(c); else m.material.color.setHex(col); const d = b.clone().sub(a); const n = V(-d.z, 0, d.x).normalize().multiplyScalar(w / 2); const p = m.geometry.attributes.position;
    [a.clone().sub(n), b.clone().sub(n), b.clone().add(n), a.clone().add(n)].forEach((q, i) => p.setXYZ(i, q.x, q.y, q.z)); p.needsUpdate = true; m.geometry.computeBoundingSphere(); return m; } }; return P0; }
