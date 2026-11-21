// DUET Science Lab 360, physics in real places, batch PW3 (Classes 6 to 10): measuring a table and a classroom with hand
// spans, footsteps and a tape; finding a magnet's poles with a compass; a full-length plane mirror in the classroom; sea and
// land breezes on a real beach; a periscope over a courtyard wall; a charged balloon bending a stream from a school tap;
// catching a cricket ball; a see-saw as a lever; a rainbow in a garden sprinkler; a wiring board with bulbs in parallel;
// timing a ball dropped from a school building. Everything is real size; what the student does decides what happens.
// Models: Poly Haven (CC0) measuring tape and garden sprinkler (models/phys3/), the app's own glove hands (lib/xr/, MIT);
// textures: Poly Haven red_bricks_04 and painted_plaster_wall (CC0); the beach is Poly Haven's spiaggia_di_mondello (CC0).
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { clone as skClone } from 'three/addons/utils/SkeletonUtils.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { Item } from './apparatus.js';
import { canvasTex, photoTex, woodTex as woodP } from './mats.js';
import { clamp01, ease } from './mathlab2.js';
import { pushKnob } from './mathworld3.js';
import { liveSign } from './mathworld4.js';
import { slideKnob } from './mathworld5.js';
import { handle } from './mathworld.js';
import { tag, animator, M, rnd, tex, noHit, stepNow, V, FONT } from './mathworld_j1.js';
import { PLACES } from './places.js';
import { BENCH_Y } from './room.js';
import { LITE } from './lite.js';

const DEG = Math.PI / 180;
const done1 = (it, o) => { noHit(it.g); it.noGrab = true; it.noPhys = true; it.base = 0; Object.assign(it, o); return it; };
const rod = (a, b, r, mat, seg = 10) => { const d = b.clone().sub(a), m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, d.length(), seg), mat); m.position.copy(a).add(b).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize()); m.castShadow = true; return m; };
const box = (g, mat, sx, sy, sz, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; g.add(m); return m; };
const floorKnob = () => [V(-0.45, 1.0, -0.42), V(0.45, 1.0, -0.42)];
const floorLever = () => [V(-0.45, 1.0, -0.3), V(-0.45, 1.0, -0.05)];
const tableKnob = () => [V(-0.32, BENCH_Y + 0.1, -0.46), V(0.32, BENCH_Y + 0.1, -0.46)];
const tableLever = () => [V(-0.42, BENCH_Y + 0.1, -0.5), V(-0.42, BENCH_Y + 0.1, -0.4)];
const OKC = '#8be07a', YEL = '#ffd23f', RED = '#ff8a5a';
const brickT = (rep) => photoTex('tex/pw3_brick.jpg', { repeat: rep });
// fewer draw calls (phones, the headset): the still parts of a group that look the same are merged into one mesh each
const matKey = (m) => [m.type, m.color && m.color.getHexString(), m.map && m.map.uuid, m.roughness, m.metalness, m.side, m.emissive && m.emissive.getHexString()].join('|');
function mergeStatic(parent, keep = []) {
  const by = new Map();
  for (const m of [...parent.children]) { if (!m.isMesh || m.isSkinnedMesh || !m.visible || keep.includes(m) || m.children.length || Array.isArray(m.material) || m.material.transparent || !m.material.isMeshStandardMaterial) continue;
    const k = matKey(m.material); if (!by.has(k)) by.set(k, []); by.get(k).push(m); }
  for (const [, list] of by) { if (list.length < 2) continue;
    const geos = list.map((m) => { m.updateMatrix(); let q = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone(); for (const a of Object.keys(q.attributes)) if (!['position', 'normal', 'uv'].includes(a)) q.deleteAttribute(a); q.morphAttributes = {}; return q.applyMatrix4(m.matrix); });
    const merged = mergeGeometries(geos, false); geos.forEach((q) => q.dispose()); if (!merged) continue;
    const mm = new THREE.Mesh(merged, list[0].material); mm.castShadow = list.some((x) => x.castShadow); mm.receiveShadow = true; parent.add(mm); for (const x of list) { parent.remove(x); x.geometry.dispose(); } }
}
const plasterT = (rep) => photoTex('tex/pw3_plaster.jpg', { repeat: rep });

// ------------------------------------------------------------------ the beach (a real place, registered here: Poly Haven spiaggia_di_mondello, CC0)
// the sea lies to the left (−x), the land with its trees to the right (+x); the Sun (measured from the HDR) is 25° up over the land
if (!PLACES.beach) PLACES.beach = { img: 'spiaggia_di_mondello', h: 1.6, r: 60, sun: [0.728, 0.427, 0.536], sunI: 2.2, sky: 0.3, env: 1.0, name: { en: 'Beach', hi: 'समुद्र तट', hg: 'Samudra tat (beach)' } };

// ------------------------------------------------------------------ models
let GL = null; const CACHE = {};
const loadGlb = (url) => CACHE[url] || (CACHE[url] = (GL ||= new GLTFLoader().setMeshoptDecoder(MeshoptDecoder)).loadAsync(url).then((g) => g.scene).catch((e) => { console.warn('pw3 model', url, e && e.message); return null; }));
// fit a model into a group: o.h / o.w / o.l (height / x / z size in metres), o.rot, o.pin (point of its box, as fractions) put at o.at
function model(url, parent, o = {}) {
  return loadGlb(url).then((src) => { if (!src) return null; const m = src.clone(true); const w = new THREE.Group(); w.add(m); if (o.rot) m.rotation.set(...o.rot);
    m.updateMatrixWorld(true); let b = new THREE.Box3().setFromObject(m); const s = b.getSize(V(0, 0, 0));
    const k = o.h ? o.h / s.y : o.w ? o.w / s.x : o.l ? o.l / s.z : (o.scale || 1); m.scale.multiplyScalar(k); m.updateMatrixWorld(true); b = new THREE.Box3().setFromObject(m);
    const pin = o.pin || [0.5, 0, 0.5], at = o.at || [0, 0, 0]; const c = V(...pin.map((f, i) => b.min.getComponent(i) + (b.max.getComponent(i) - b.min.getComponent(i)) * f));
    m.position.add(V(at[0] - c.x, at[1] - c.y, at[2] - c.z)); m.traverse((x) => { if (x.isMesh) { x.castShadow = o.shadow !== false; x.receiveShadow = true; x.userData.noHit = true; } });
    parent.add(w); if (o.done) o.done(w, m); return w; });
}
// the app's own soft white glove hands (the same as in the headset; WebXR Input Profiles, MIT). The joints are separate
// bones placed absolutely; a returned group fills in when the model has loaded (g.ready)
const HAND_MAT = new THREE.MeshStandardMaterial({ color: 0xeef1f6, roughness: 0.45, metalness: 0, transparent: true, opacity: 0.94, emissive: 0x1a1d22 });
function gloveHand(side = 'right', mat = HAND_MAT) {
  const g = new THREE.Group(); g.joints = {};
  g.ready = loadGlb(`lib/xr/hand-${side}.glb`).then((src) => { if (!src) return null; const h = skClone(src);
    h.traverse((m) => { if (m.isMesh || m.isSkinnedMesh) { m.material = mat; m.frustumCulled = false; m.castShadow = true; m.receiveShadow = false; m.userData.noHit = true; } if (m.isBone || /finger|thumb|wrist/.test(m.name)) g.joints[m.name] = m; });
    g.add(h); g.model = h; return g; });
  return g;
}
// joint positions in the hand model's own frame (the joints are separate bones placed absolutely)
const jpos = (hh, n) => { const b = hh.joints[n]; if (!b) return V(0, 0, 0); hh.model.updateMatrixWorld(true); const p = b.getWorldPosition(V(0, 0, 0)); return hh.model.worldToLocal(p); };
// the hand's own directions: f along the fingers, t across towards the thumb, n out of the palm
function handAxes(hh, side) { const f = jpos(hh, 'middle-finger-tip').sub(jpos(hh, 'wrist')).normalize(); const t = jpos(hh, 'index-finger-metacarpal').sub(jpos(hh, 'pinky-finger-metacarpal')); t.addScaledVector(f, -t.dot(f)).normalize();
  const n = side === 'right' ? t.clone().cross(f) : f.clone().cross(t); return { f, t, n }; }
// turn the hand model so that its fingers, thumb side and palm point along the given directions (in its parent's frame)
function orientHand(hh, side, F, T, Nn) { const a = handAxes(hh, side); const A = new THREE.Matrix4().makeBasis(a.f, a.t, a.n), B = new THREE.Matrix4().makeBasis(F, T, Nn); hh.model.quaternion.setFromRotationMatrix(B.multiply(A.invert())); hh.model.updateMatrixWorld(true); }
// spread the thumb and the little finger out in the plane of the palm (degrees), as when measuring a hand span
function spreadHand(hh, side, thumb, pinky) {
  const J = hh.joints, { n } = handAxes(hh, side); const P = (k) => J[k] && J[k].position;
  const swing = (names, pivot, away, a) => { if (!J[pivot] || !J[names[names.length - 1]]) return; const p0 = J[pivot].position.clone(), tip = J[names[names.length - 1]].position, ref = P(away);
    const test = (sg) => tip.clone().sub(p0).applyAxisAngle(n, sg * a * DEG).add(p0).distanceTo(ref); const sg = test(1) > test(-1) ? 1 : -1; const q = new THREE.Quaternion().setFromAxisAngle(n, sg * a * DEG);
    for (const k of names) { const b = J[k]; if (!b) continue; b.position.sub(p0).applyQuaternion(q).add(p0); b.quaternion.premultiply(q); } };
  // the thumb lies flat on the table too: turn it about the line of the fingers until its tip is level with the fingertips
  { const f = handAxes(hh, side).f, names = ['thumb-phalanx-proximal', 'thumb-phalanx-distal', 'thumb-tip'], p0 = J['thumb-metacarpal'] && J['thumb-metacarpal'].position.clone(); if (p0 && J['thumb-tip'] && J['index-finger-tip']) {
    const tip = J['thumb-tip'].position, ref = J['index-finger-tip'].position; let best = 0, bd = 9; for (let a = -90; a <= 90; a += 2) { const q = tip.clone().sub(p0).applyAxisAngle(f, a * DEG).add(p0); const d = Math.abs(q.clone().sub(ref).dot(n)) - 0.002 * q.distanceTo(ref); if (d < bd) { bd = d; best = a; } }
    const q = new THREE.Quaternion().setFromAxisAngle(f, best * DEG); for (const k of names) { const b = J[k]; b.position.sub(p0).applyQuaternion(q).add(p0); b.quaternion.premultiply(q); } } }
  swing(['thumb-phalanx-proximal', 'thumb-phalanx-distal', 'thumb-tip'], 'thumb-metacarpal', 'index-finger-tip', thumb);
  swing(['pinky-finger-phalanx-proximal', 'pinky-finger-phalanx-intermediate', 'pinky-finger-phalanx-distal', 'pinky-finger-tip'], 'pinky-finger-metacarpal', 'ring-finger-tip', pinky);
  swing(['ring-finger-phalanx-proximal', 'ring-finger-phalanx-intermediate', 'ring-finger-phalanx-distal', 'ring-finger-tip'], 'ring-finger-metacarpal', 'middle-finger-tip', pinky * 0.35);
}
// an item the student slides about on a flat surface (mouse drag, or a hand in the headset): o.clamp(p) keeps a world point
// on the surface where it may go; o.move(p) is told where it is
function surfaceDrag(it, o) {
  it.noGrab = false; it.noPhys = true; it.dragLift = 0; it.isKnob = true; const v = V(0, 0, 0); // the headset's ray can slide it too
  const u0 = it.update; it.update = (dt, t) => { if (u0) u0(dt, t); if (it.pulse) it.pulse.visible = !!(o.active && o.active()) && !it.held; if (!it.held) return; const p = o.clamp(it.g.getWorldPosition(v).clone());
    if (it.held === 'pointer') it.g.position.copy(p); o.move(p); };
  it.onRelease = () => { const p = o.clamp(it.g.getWorldPosition(v).clone()); const p0 = it.g.position.clone(); let n = 0; const q0 = it.g.quaternion.clone(), q1 = new THREE.Quaternion();
    const step = () => { n++; const e = Math.min(1, n / 10); it.g.position.lerpVectors(p0, p, e); it.g.quaternion.slerpQuaternions(q0, q1, e); o.move(it.g.position.clone()); if (e < 1 && !it.held) requestAnimationFrame(step); }; step(); };
}
// a tape measure's blade: a printed strip, its zero at u = 0 (cm marks, a number every 10 cm), `len` metres long in all
function tapeTex(len, o = {}) {
  const W = Math.min(4096, Math.round(len * (o.ppm || 800))), H = 48, ppm = W / len;
  return canvasTex(W, H, (x) => { x.fillStyle = o.bg || '#f4c51f'; x.fillRect(0, 0, W, H); x.fillStyle = '#16181c'; x.strokeStyle = '#16181c'; x.textBaseline = 'middle';
    for (let c = 0; c <= len * 100; c++) { const px = c * ppm / 100, big = c % 10 === 0, mid = c % 5 === 0; x.fillRect(px - (big ? 1.5 : 0.75), 0, big ? 3 : 1.5, big ? H * 0.55 : mid ? H * 0.38 : H * 0.24);
      if (big && c > 0 && ppm > 120) { x.font = `800 ${Math.round(H * 0.42)}px ${FONT}`; x.fillStyle = c % 100 === 0 ? '#c0251c' : '#16181c'; const t = c % 100 === 0 ? `${c / 100} m` : String(c % 100); x.textAlign = 'right'; x.fillText(t, px - 3, H * 0.74); x.fillStyle = '#16181c'; } }
    if (o.edge) { x.fillStyle = 'rgba(0,0,0,0.25)'; x.fillRect(0, 0, W, 2); x.fillRect(0, H - 2, W, 2); } });
}

// ------------------------------------------------------------------ Class 6 Ch 5 Measurement of Length and Motion: hand spans, footsteps and a tape
// In the classroom. The teacher's table is 2.50 m long. A hand (span 16 cm) walks along it span by span as the handle slides;
// then the teacher's hand (20 cm) does the same; then a 3 m tape is hooked on the left end and pulled to the right end. Last,
// footsteps heel to toe along the front wall (8.40 m): your foot 22 cm, the teacher's 27 cm.
export function measureClass(o = {}) {
  const it = new Item('pmeasure6', { ...o, name: { en: 'Hand spans, footsteps and a tape', hi: 'बित्ते, क़दम और फ़ीता', hg: 'Bitte, kadam aur feeta' } });
  const g = it.g, w_ = o.W || ((k) => k), TY = BENCH_Y + 0.0012, X0 = -1.25, L = 2.5, ZL = -0.74, FX0 = -4.2, FL = 8.4, FZ = -5.42;
  const chalk = (col) => new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.85, depthWrite: false, toneMapped: false });
  const markG = new THREE.PlaneGeometry(0.004, 0.07); const mk = (x, mat, z = ZL - 0.02, y = TY) => { const m = new THREE.Mesh(markG, mat); m.rotation.x = -Math.PI / 2; m.position.set(x, y, z); g.add(m); return m; };
  const meW = chalk(0xffffff), meT = chalk(0xffa64a); const marks = { me: [], t: [] };
  // the hands
  const SP = { me: 0.16, t: 0.20 }; const hands = { me: gloveHand('right'), t: gloveHand('right') };
  for (const k of ['me', 't']) { const h = hands[k]; h.visible = false; g.add(h); h.ready.then((hh) => { if (!hh) return; spreadHand(hh, 'right', 30, 16); orientHand(hh, 'right', V(0, 0, -1), V(-1, 0, 0), V(0, -1, 0)); hh.updateMatrixWorld(true);
    const J = hh.joints, a = J['thumb-tip'].getWorldPosition(V(0, 0, 0)), b = J['pinky-finger-tip'].getWorldPosition(V(0, 0, 0)); hh.worldToLocal(a); hh.worldToLocal(b);
    const d = b.clone().sub(a); const yaw = Math.atan2(-d.z, d.x); const s = SP[k] / Math.hypot(d.x, d.z); hh.model.scale.setScalar(s); const piv = new THREE.Group(); hh.remove(hh.model); piv.add(hh.model); hh.add(piv); piv.rotation.y = -yaw;
    hh.updateMatrixWorld(true); const a2 = J['thumb-tip'].getWorldPosition(V(0, 0, 0)); hh.worldToLocal(a2); let low = 9; for (const n of ['wrist', 'index-finger-metacarpal', 'middle-finger-metacarpal', 'pinky-finger-metacarpal', 'index-finger-tip', 'middle-finger-tip', 'ring-finger-tip', 'thumb-tip', 'pinky-finger-tip']) { if (!J[n]) continue; const q = J[n].getWorldPosition(V(0, 0, 0)); hh.worldToLocal(q); low = Math.min(low, q.y); } piv.position.set(-a2.x, -low + 0.009 * s, -a2.z); hh.span = SP[k]; }); }
  // the tape: its case (a real 3 m tape, Poly Haven CC0) is held in the hand; the hook is caught on the table's left end
  const tape = new THREE.Group(); g.add(tape); tape.visible = false;
  const bladeT = tapeTex(3, { ppm: 1100 }); bladeT.wrapS = THREE.ClampToEdgeWrapping;
  const blade = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.019), new THREE.MeshStandardMaterial({ map: bladeT, roughness: 0.35, metalness: 0.2 })); blade.rotation.x = -Math.PI / 2; tape.add(blade);
  const hook = new THREE.Group(); tape.add(hook); box(hook, M(0xb8bdc2, 0.3, 0.9), 0.012, 0.0006, 0.019, X0 + 0.006, TY + 0.0004, ZL); box(hook, M(0xb8bdc2, 0.3, 0.9), 0.0012, 0.016, 0.02, X0 - 0.0006, TY - 0.008, ZL);
  const caseG = new THREE.Group(); tape.add(caseG); model('models/phys3/measuring_tape_01.glb', caseG, { h: 0.075, rot: [0, -Math.PI / 2, 0], pin: [0, 0, 0.5], at: [0, 0, 0] });
  const holdH = gloveHand('right'); caseG.add(holdH); holdH.ready.then((hh) => { if (!hh) return; orientHand(hh, 'right', V(0.35, 0, -0.94).normalize(), V(-0.94, 0, -0.35).normalize(), V(0, -1, 0)); const c = jpos(hh, 'middle-finger-metacarpal').applyQuaternion(hh.model.quaternion); hh.model.position.set(-c.x + 0.045, -c.y + 0.074, -c.z + 0.01); }); // your hand holds the case
  // footprints along the front wall (a dusty shoe print, 22 cm or 27 cm long)
  const soleT = tex(128, 256, (x) => { x.clearRect(0, 0, 128, 256); x.fillStyle = 'rgba(70,60,48,0.55)'; x.beginPath(); x.ellipse(64, 80, 44, 72, 0, 0, Math.PI * 2); x.fill(); x.beginPath(); x.ellipse(64, 200, 34, 46, 0, 0, Math.PI * 2); x.fill(); x.fillRect(36, 120, 56, 70);
    x.globalCompositeOperation = 'destination-out'; const r = rnd(9); for (let i = 0; i < 26; i++) { x.fillRect(20, 20 + i * 9, 88, 3); } for (let i = 0; i < 300; i++) x.fillRect(r() * 128, r() * 256, 2, 2); x.globalCompositeOperation = 'source-over'; });
  const soleM = new THREE.MeshBasicMaterial({ map: soleT, transparent: true, depthWrite: false }), soleM2 = new THREE.MeshBasicMaterial({ map: soleT, transparent: true, depthWrite: false, color: 0xd88a4a });
  const prints = []; const printG = new THREE.PlaneGeometry(0.09, 0.22);
  const rd = liveSign(0.14, 5); rd.position.set(0.1, BENCH_Y + 0.24, -1.12); g.add(rd);
  animator(it); it.mode = 'span'; it.k = 0; it.n = 0; it.res = {}; it.views = { table: { p: V(0.1, 2.15, 1.4), t: V(0.1, 0.92, -0.8) }, wall: { p: V(0.3, 2.4, -1.9), t: V(0.1, 0.3, -5.35) } }; it.camView = it.views.table;
  const put = (k, n, lift = 0) => { const h = hands[k]; h.visible = true; const s = SP[k]; h.position.set(X0 + n * s, TY + lift, ZL); };
  // hand spans: the hand is put down span after span as the handle slides
  it.setSpan = (k) => { if (it.mode !== 'span') return; it.k = clamp01(k); const d = it.k * L, s = SP.me, n = Math.min(Math.floor(d / s + 1e-6), Math.floor(L / s));
    while (marks.me.length < n) marks.me.push(mk(X0 + (marks.me.length + 1) * s, meW)); put('me', n);
    const left = L - n * s; const end = n === Math.floor(L / s) && it.k >= 0.999;
    if (end) { it.res.me = n + left / s; rd.set([`${w_('Your hand')}: ${n} ${w_('spans')} + ${w_('a little more')} (≈ ${Math.round(it.res.me * 2) / 2})`], OKC); if (it.onSpan) it.onSpan(); }
    else rd.set([`${w_('Your hand span')} 16 cm · ${n} ${w_('spans')}`], YEL); if (it.onK) it.onK(it.k); };
  it.teacher = (cb) => { if (it.busy) return false; hands.me.visible = false; const s = SP.t, N = Math.floor(L / s); let last = -1;
    it.play(N * 0.32 + 0.6, (kk) => { const n = Math.min(N, Math.floor(kk * (N + 1))); const f = kk * (N + 1) - Math.floor(kk * (N + 1)); put('t', n, Math.sin(Math.min(1, f * 2) * Math.PI) * 0.025 * (n < N ? 1 : 0));
      if (n !== last) { last = n; while (marks.t.length < n) marks.t.push(mk(X0 + (marks.t.length + 1) * s, meT, ZL + 0.05)); rd.set([`${w_('Teacher’s hand span')} 20 cm · ${n} ${w_('spans')}`], YEL); } },
    () => { put('t', N); it.res.t = L / s; rd.set([`${w_('Your hand')} ≈ ${Math.round(it.res.me * 2) / 2} ${w_('spans')} · ${w_('teacher’s hand')} ≈ ${Math.round(it.res.t * 2) / 2} ${w_('spans')}`], OKC); if (cb) cb(); }); return true; };
  // the tape: k slides the case from the left end to beyond the right end; the reading is where the blade crosses the right edge
  it.toTape = () => { it.mode = 'tape'; it.k = 0; hands.t.visible = false; tape.visible = true; it.setTape(0); };
  it.setTape = (k) => { if (it.mode !== 'tape') return; it.k = clamp01(k); const d = 0.12 + it.k * (L + 0.12 - 0.12); const xe = X0 + d;
    blade.scale.x = d; blade.position.set(X0 + d / 2, TY + 0.0006, ZL); bladeT.repeat.x = d / 3; bladeT.offset.x = 0; caseG.position.set(xe, TY, ZL);
    if (xe >= 1.25 + 0.06) { rd.set([`${w_('Reading at the right end')}: 2.50 m = 250 cm`], OKC); it.res.tape = 2.5; if (it.onTape) it.onTape(); }
    else rd.set([`${w_('Tape out')}: ${d.toFixed(2)} m · ${w_('the table goes on')}`], YEL); if (it.onK) it.onK(it.k); };
  // footsteps heel to toe along the front wall
  it.toFeet = () => { it.mode = 'feet'; it.k = 0; tape.visible = false; it.camView = it.views.wall; rd.position.set(0.1, 0.75, -5.2); rd.scale.multiplyScalar(1.8); it.setFeet(0); };
  const addPrint = (x, mat, dz) => { const p = new THREE.Mesh(printG, mat); p.rotation.set(-Math.PI / 2, 0, -Math.PI / 2); p.position.set(x, 0.004, FZ + dz); p.renderOrder = 2; g.add(p); prints.push(p); return p; };
  it.setFeet = (k) => { if (it.mode !== 'feet') return; it.k = clamp01(k); const f = 0.22, d = it.k * FL, N = Math.floor(FL / f), n = Math.min(N, Math.floor(d / f + 1e-6));
    while (prints.length < n) { const i = prints.length; addPrint(FX0 + i * f + f / 2, soleM, (i % 2 ? 0.06 : -0.06)); }
    if (n >= N && it.k >= 0.999) { if (!it.res.feet) { it.res.feet = FL / f; const ft = 0.27; for (let i = 0; i < Math.floor(FL / ft); i++) { const p = new THREE.Mesh(new THREE.PlaneGeometry(0.11, 0.27), soleM2); p.rotation.set(-Math.PI / 2, 0, -Math.PI / 2); p.position.set(FX0 + i * ft + ft / 2, 0.005, FZ + 0.3); g.add(p); } }
      rd.set([`${w_('Your feet')}: 38 + ${w_('a little more')} · ${w_('teacher’s feet')}: 31 + ${w_('a little more')}`], OKC); if (it.onFeet) it.onFeet(); }
    else rd.set([`${w_('Your foot')} 22 cm · ${n} ${w_('foot lengths')}`], YEL); if (it.onK) it.onK(it.k); };
  it.say = (l, c) => rd.set(l, c);
  it.say([w_('The teacher’s table: how long is it?')], '#ffffff'); put('me', 0); hands.me.visible = true;
  it.knobPath = tableKnob; it.leverPath = tableLever;
  return done1(it, { height: 1, radius: 1.3 });
}
export function bindMeasureHands(ms, knob, lever, app, s = { span: 1, teacher: 2, tape: 3, feet: 4 }, done = {}) {
  const sync = slideKnob(knob, { path: () => ms.knobPath(), active: () => (stepNow(app, s.span) && ms.mode === 'span') || (stepNow(app, s.tape) && ms.mode === 'tape') || (stepNow(app, s.feet) && ms.mode === 'feet'),
    keepVisible: () => [s.span, s.tape, s.feet].includes(app.runner.i), k: () => ms.k,
    set: (k) => { const kk = k > 0.985 ? 1 : k; if (ms.mode === 'span' && kk >= ms.k) ms.setSpan(kk); else if (ms.mode === 'tape') ms.setTape(kk); else if (ms.mode === 'feet' && kk >= ms.k) ms.setFeet(kk); } });
  ['setSpan', 'setTape', 'setFeet'].forEach((f) => { const f0 = ms[f]; ms[f] = (k) => { f0(k); sync(); }; });
  ms.onSpan = () => done.span && done.span(); ms.onTape = () => done.tape && done.tape(); ms.onFeet = () => done.feet && done.feet();
  pushKnob(lever, { path: () => ms.leverPath(), active: () => stepNow(app, s.teacher) && !ms.busy && ms.res.t == null, keepVisible: () => app.runner.i === s.teacher, press: () => ms.teacher(() => done.teacher && done.teacher()) });
}

// ------------------------------------------------------------------ Class 6 Ch 4 Exploring Magnets: a magnet's poles found with a compass
// On a table in the courtyard (north is straight ahead) lies an old bar magnet whose colours have worn off: its ends carry
// paper labels A and B. Which end is which pole is chosen afresh each time. The student slides a pocket compass about the
// table; its needle follows the real field: the Earth's (35 µT, northward) plus the magnet's two poles.
export function compassPoles(o = {}) {
  const it = new Item('pcompass6', { ...o, name: { en: 'Bar magnet and a pocket compass', hi: 'छड़ चुंबक और जेबी कम्पास', hg: 'Bar magnet aur pocket compass' } });
  const g = it.g, w_ = o.W || ((k) => k), MZ = -0.1, HL = 0.05;
  it.aIsN = o.aIsN ?? Math.random() < 0.5;
  // the magnet: grey steel with rust spots and two paper labels
  const steelT = tex(256, 64, (x) => { x.fillStyle = '#7d8288'; x.fillRect(0, 0, 256, 64); const r = rnd(11); for (let i = 0; i < 500; i++) { x.fillStyle = `rgba(${r() < 0.3 ? '120,70,40' : r() < 0.6 ? '40,40,40' : '200,200,200'},${r() * 0.25})`; x.fillRect(r() * 256, r() * 64, 2 + r() * 4, 1 + r() * 2); } });
  const mag = new THREE.Mesh(new THREE.BoxGeometry(2 * HL, 0.012, 0.02), new THREE.MeshStandardMaterial({ map: steelT, roughness: 0.45, metalness: 0.75 })); mag.position.set(0, 0.006, MZ); mag.castShadow = true; g.add(mag);
  const lab = (t) => new THREE.MeshStandardMaterial({ map: tex(64, 64, (x) => { x.fillStyle = '#f3efe2'; x.fillRect(0, 0, 64, 64); x.fillStyle = '#1d2733'; x.font = `800 46px ${FONT}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(t, 32, 36); }), roughness: 0.9 });
  [['A', -1], ['B', 1]].forEach(([t, s]) => { const p = new THREE.Mesh(new THREE.PlaneGeometry(0.016, 0.016), lab(t)); p.rotation.x = -Math.PI / 2; p.position.set(s * (HL - 0.012), 0.0122, MZ); g.add(p); });
  const ends = { A: V(-HL, 0.006, MZ), B: V(HL, 0.006, MZ) };
  // north arrow drawn in chalk on the table, and room for the chalk letters
  const arT = tex(128, 256, (x) => { x.clearRect(0, 0, 128, 256); x.strokeStyle = 'rgba(255,255,255,0.9)'; x.fillStyle = 'rgba(255,255,255,0.9)'; x.lineWidth = 8; x.lineCap = 'round'; x.beginPath(); x.moveTo(64, 240); x.lineTo(64, 70); x.stroke(); x.beginPath(); x.moveTo(64, 40); x.lineTo(30, 100); x.lineTo(98, 100); x.closePath(); x.fill(); x.font = `900 44px ${FONT}`; x.textAlign = 'center'; x.fillText(w_('N'), 64, 34); });
  const ar = new THREE.Mesh(new THREE.PlaneGeometry(0.05, 0.1), new THREE.MeshBasicMaterial({ map: arT, transparent: true, depthWrite: false, toneMapped: false })); ar.rotation.x = -Math.PI / 2; ar.position.set(-0.3, 0.0015, -0.2); g.add(ar);
  const chalkT = (t, col) => tex(128, 128, (x) => { x.clearRect(0, 0, 128, 128); x.fillStyle = col; x.font = `900 100px ${FONT}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(t, 64, 70); x.globalCompositeOperation = 'destination-out'; const r = rnd(7); for (let i = 0; i < 900; i++) x.fillRect(r() * 128, r() * 128, 1.5, 1.5); });
  const letters = {}; ['A', 'B'].forEach((k) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(0.045, 0.045), new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, toneMapped: false })); m.rotation.x = -Math.PI / 2; m.position.copy(ends[k]).add(V(k === 'A' ? -0.04 : 0.04, -0.0045, 0.035)); m.visible = false; g.add(m); letters[k] = m; });
  const rd = liveSign(0.06, 5); rd.position.set(0.05, 0.13, -0.3); g.add(rd);
  // the field at a point (table coordinates), in microtesla, horizontal part only
  const poleAt = (k) => V(ends[k].x * 0.82, 0, MZ); const BE = 35, C = 1.5;
  it.field = (p) => { const b = V(0, 0, -BE); for (const k of ['A', 'B']) { const sN = (k === 'A') === it.aIsN ? 1 : -1; const d = V(p.x, 0, p.z).sub(poleAt(k)); const r = Math.max(0.012, d.length()); b.addScaledVector(d, sN * C / (r * r * r)); } return b; };
  it.say = (l, c) => rd.set(l, c);
  it.mark = () => { for (const k of ['A', 'B']) { const n = (k === 'A') === it.aIsN; letters[k].material.map = chalkT(n ? w_('N') : w_('S'), n ? 'rgba(255,190,180,0.95)' : 'rgba(205,225,255,0.95)'); letters[k].material.needsUpdate = true; letters[k].visible = true; } };
  it.ends = ends; it.mz = MZ; it.hl = HL; it.W = w_;
  return done1(it, { height: 0.3, radius: 0.6 });
}
// the pocket compass the student moves (an item of its own, so it can be picked up)
export function pocketCompass(o = {}) {
  const it = new Item('pcompass', { ...o, name: { en: 'Pocket compass', hi: 'जेबी कम्पास', hg: 'Pocket compass' } });
  const g = it.g, R = 0.032, w_ = o.W || ((k) => k);
  const ring = new THREE.Mesh(new THREE.CylinderGeometry(R + 0.004, R + 0.005, 0.012, 40), M(0xb08d3c, 0.3, 0.9)); ring.position.y = 0.006; g.add(ring);
  const dialT = tex(256, 256, (x) => { x.fillStyle = '#f4f1e8'; x.beginPath(); x.arc(128, 128, 128, 0, 7); x.fill(); x.strokeStyle = '#26303a'; x.fillStyle = '#26303a';
    for (let a = 0; a < 360; a += 5) { const t = a * DEG, big = a % 30 === 0; x.lineWidth = big ? 3 : 1.5; x.beginPath(); x.moveTo(128 + Math.sin(t) * (big ? 100 : 108), 128 - Math.cos(t) * (big ? 100 : 108)); x.lineTo(128 + Math.sin(t) * 120, 128 - Math.cos(t) * 120); x.stroke(); }
    x.font = `800 30px ${FONT}`; x.textAlign = 'center'; x.textBaseline = 'middle'; [['N', 0, '#c62828'], ['E', 90], ['S', 180], ['W', 270]].forEach(([t, a, c]) => { x.fillStyle = c || '#26303a'; x.fillText(w_(t), 128 + Math.sin(a * DEG) * 80, 128 - Math.cos(a * DEG) * 80); }); });
  const dial = new THREE.Mesh(new THREE.CircleGeometry(R, 40), new THREE.MeshStandardMaterial({ map: dialT, roughness: 0.7 })); dial.rotation.x = -Math.PI / 2; dial.position.y = 0.0105; g.add(dial);
  const nd = new THREE.Group(); nd.position.y = 0.0125; g.add(nd);
  const half = (col, s) => { const sh = new THREE.Shape(); sh.moveTo(0, 0.0032); sh.lineTo(s * 0.026, 0); sh.lineTo(0, -0.0032); sh.closePath(); const m = new THREE.Mesh(new THREE.ShapeGeometry(sh), M(col, 0.35, 0.4)); m.rotation.x = -Math.PI / 2; m.castShadow = false; return m; };
  const nN = half(0xd0281e, 1), nS = half(0xe8ecef, -1); nN.rotation.z = Math.PI / 2; nS.rotation.z = Math.PI / 2; nd.add(nN); nd.add(nS); // local −z is the N end
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.0035, 0.0035, 0.002, 12), M(0xb08d3c, 0.3, 0.9)); cap.position.y = 0.001; nd.add(cap);
  const glass = new THREE.Mesh(new THREE.CircleGeometry(R + 0.001, 40), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.03, transparent: true, opacity: 0.16, depthWrite: false })); glass.rotation.x = -Math.PI / 2; glass.position.y = 0.0122; glass.userData.noHit = true; g.add(glass);
  const pulse = new THREE.Mesh(new THREE.TorusGeometry(R + 0.012, 0.0025, 8, 40), new THREE.MeshBasicMaterial({ color: 0xffd23f, transparent: true, opacity: 0.85, toneMapped: false })); pulse.rotation.x = Math.PI / 2; pulse.position.y = 0.004; pulse.userData.noHit = true; g.add(pulse); it.pulse = pulse;
  it.th = 0; it.w = 0; // needle angle (yaw of its N end, 0 = north) and its turning speed
  it.setNeedle = (a) => { nd.rotation.y = a; };
  it.height = 0.014; it.radius = R + 0.005; it.grabY = 0.008; it.base = 0; return it;
}
export function bindCompassHands(cp, cmp, lever, app, s = { a: 1, b: 2, mark: 3, far: 4 }, done = {}) {
  const w_ = cp.w_ || ((k) => k); const tmp = V(0, 0, 0);
  const local = (p) => cp.g.worldToLocal(p.clone());
  surfaceDrag(cmp, { active: () => [s.a, s.b, s.far].some((i) => stepNow(app, i)),
    clamp: (p) => { const q = local(p); q.x = Math.max(-1.18, Math.min(1.18, q.x)); q.z = Math.max(-0.34, Math.min(0.3, q.z)); // on the table, and not on top of the magnet
      const dx = Math.max(0, Math.abs(q.x) - cp.hl), dz = Math.max(0, Math.abs(q.z - cp.mz) - 0.01), rr = cmp.radius + 0.004; if (Math.hypot(dx, dz) < rr) { if (Math.abs(q.x) - cp.hl > Math.abs(q.z - cp.mz) - 0.01) q.x = Math.sign(q.x || 1) * (cp.hl + rr); else q.z = cp.mz + Math.sign(q.z - cp.mz || 1) * (0.01 + rr); }
      q.y = 0.0008; return cp.g.localToWorld(q); }, move: () => {} });
  let still = 0, fired = {};
  const u0 = cmp.update; cmp.update = (dt, t) => { u0(dt, t); dt = Math.min(dt || 0.016, 0.05);
    const q = local(cmp.g.getWorldPosition(tmp)); const B = cp.field(q); const tgt = Math.atan2(-B.x, -B.z); // yaw of the field (0 = −z, north)
    let da = tgt - cmp.th; da = Math.atan2(Math.sin(da), Math.cos(da)); const k = Math.min(400, 6 * Math.sqrt(B.length())); cmp.w += (k * Math.sin(da) - 2.2 * cmp.w) * dt; cmp.th += cmp.w * dt; cmp.setNeedle(-cmp.th);
    still = Math.abs(cmp.w) < 0.25 && Math.abs(da) < 0.12 ? still + dt : 0;
    const w = cp.W || ((x) => x); const dA = q.distanceTo(cp.ends.A), dB = q.distanceTo(cp.ends.B), far = Math.hypot(q.x, q.z - cp.mz) > 0.42;
    const toward = (end) => { const v = V(cp.ends[end].x - q.x, 0, cp.ends[end].z - q.z).normalize(); const n = V(Math.sin(cmp.th), 0, -Math.cos(cmp.th)); return n.dot(v); };
    const near = dA < 0.075 ? 'A' : dB < 0.075 ? 'B' : null;
    if (near) { const c = toward(near); cp.say([`${w('end')} ${near}: ${c > 0.5 ? w('the red N end of the needle points to it') : c < -0.5 ? w('the red N end of the needle points away from it') : w('the needle turns')}`], c > 0.5 ? '#ff8a8a' : c < -0.5 ? '#9fd3ff' : '#ffffff'); }
    else if (far) cp.say([`${w('far from the magnet')}: ${w('the needle points north')}`], Math.abs(Math.atan2(Math.sin(cmp.th), Math.cos(cmp.th))) < 0.1 ? OKC : '#ffffff');
    else cp.say([w('Slide the compass close to one end of the magnet')], '#ffffff');
    if (still > 0.6) { if (near === 'A' && stepNow(app, s.a) && !fired.a) { fired.a = 1; done.a && done.a(); } if (near === 'B' && stepNow(app, s.b) && !fired.b) { fired.b = 1; done.b && done.b(); } if (far && stepNow(app, s.far) && !fired.far) { fired.far = 1; done.far && done.far(); } } };
  pushKnob(lever, { path: () => tableLever(), active: () => stepNow(app, s.mark), keepVisible: () => app.runner.i === s.mark, press: () => { cp.mark(); done.mark && done.mark(); } });
  // the Do it button slides the compass for the student
  cmp.slideTo = (lp, sec, K) => { const p0 = cmp.g.position.clone(), p1 = cp.g.localToWorld(lp.clone()); return K.tween(sec, (k) => { cmp.g.position.lerpVectors(p0, p1, ease(k)); }); };
}

// ------------------------------------------------------------------ Class 7 Ch 11 Light: Shadows and Reflections: a full-length mirror in the classroom
// A 1.6 m mirror on a wooden stand (a real, live reflection) faces the class. A measuring tape lies on the floor from the
// mirror towards you. A slate on a stool, with SCIENCE → written on it, faces the mirror; slide it along the tape and read
// how far it is from the mirror, and how far behind the mirror its image is (the reflected tape shows it).
export function classMirror(o = {}) {
  const it = new Item('pmirror7', { ...o, name: { en: 'Full-length mirror and a slate', hi: 'बड़ा दर्पण और स्लेट', hg: 'Bada mirror aur slate' } });
  const g = it.g, w_ = o.W || ((k) => k), MX = -0.3, MZ = -2.9, MW = 0.9, MH = 1.6, MB = 0.12, LX = -0.55;
  const wood = new THREE.MeshStandardMaterial({ map: woodP('#6b4226', [1, 2]), roughness: 0.55 });
  const glass = new Reflector(new THREE.PlaneGeometry(MW - 0.04, MH - 0.04), { textureWidth: LITE ? 384 : 512, textureHeight: LITE ? 704 : 960, color: 0xdfe4e6, clipBias: 0.003 });
  glass.position.set(MX, MB + MH / 2, MZ); g.add(glass);
  box(g, wood, MW + 0.06, 0.05, 0.04, MX, MB + MH + 0.005, MZ - 0.012); box(g, wood, MW + 0.06, 0.05, 0.04, MX, MB - 0.005, MZ - 0.012); box(g, wood, 0.05, MH + 0.06, 0.04, MX - MW / 2 - 0.005, MB + MH / 2, MZ - 0.012); box(g, wood, 0.05, MH + 0.06, 0.04, MX + MW / 2 + 0.005, MB + MH / 2, MZ - 0.012);
  box(g, M(0x3a3d42, 0.7), MW, MH, 0.01, MX, MB + MH / 2, MZ - 0.02);
  [-1, 1].forEach((s) => { box(g, wood, 0.06, 0.04, 0.5, MX + s * (MW / 2 - 0.05), 0.02, MZ - 0.05); box(g, wood, 0.04, 0.5, 0.04, MX + s * (MW / 2 - 0.05), 0.25, MZ - 0.17).rotation.x = -0.35; });
  // the tape on the floor: zero at the mirror's glass
  const TL = 2.4, tT = tapeTex(TL, { ppm: 700 }); const tp = new THREE.Mesh(new THREE.PlaneGeometry(TL, 0.026), new THREE.MeshStandardMaterial({ map: tT, roughness: 0.6 })); tp.rotation.set(-Math.PI / 2, 0, -Math.PI / 2); tp.position.set(LX, 0.003, MZ + TL / 2); tp.receiveShadow = true; g.add(tp);
  // a stool with a slate standing on it; its writing faces the mirror
  const obj = new THREE.Group(); g.add(obj);
  const seat = box(obj, wood, 0.3, 0.03, 0.3, 0, 0.42, 0); for (const [x, z] of [[-0.12, -0.12], [0.12, -0.12], [-0.12, 0.12], [0.12, 0.12]]) box(obj, wood, 0.03, 0.41, 0.03, x, 0.205, z); void seat;
  const slateT = (txt, rev) => canvasTex(512, 320, (x) => { x.fillStyle = '#7a4a26'; x.fillRect(0, 0, 512, 320); x.fillStyle = '#20262a'; x.fillRect(18, 18, 476, 284); const r = rnd(4); for (let i = 0; i < 400; i++) { x.fillStyle = `rgba(255,255,255,${r() * 0.05})`; x.fillRect(r() * 512, r() * 320, 3, 1); }
    x.save(); if (rev) { x.translate(512, 0); x.scale(-1, 1); } x.fillStyle = 'rgba(245,245,240,0.92)'; x.font = `800 ${txt.length > 8 ? 70 : 92}px ${FONT}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(txt, 256, rev ? 160 : 130);
    if (!rev) { x.lineWidth = 12; x.strokeStyle = 'rgba(245,245,240,0.92)'; x.beginPath(); x.moveTo(150, 235); x.lineTo(350, 235); x.stroke(); x.beginPath(); x.moveTo(370, 235); x.lineTo(330, 210); x.lineTo(330, 260); x.closePath(); x.fill(); } x.restore(); });
  const sT = [slateT('SCIENCE', false), slateT('AMBULANCE', true)];
  const slateM = new THREE.MeshStandardMaterial({ map: sT[0], roughness: 0.85 }), backM = new THREE.MeshStandardMaterial({ map: woodP('#7a4a26'), roughness: 0.7 });
  const slate = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.27, 0.015), [backM, backM, backM, backM, backM, slateM]); slate.position.set(0, 0.58, 0); slate.rotation.x = 0.12; slate.castShadow = true; obj.add(slate); // face −z: towards the mirror
  const prop = rod(V(0, 0.44, 0.06), V(0, 0.62, 0.02), 0.008, wood); obj.add(prop);
  const ptr = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.008), new THREE.MeshBasicMaterial({ color: 0xd0281e, toneMapped: false })); ptr.rotation.x = -Math.PI / 2; // a red chalk line across the tape at the slate's face
  const rd = liveSign(0.13, 4.4); rd.position.set(0.75, 1.55, MZ + 0.45); g.add(rd);
  // signs are not part of the room: keep them out of the reflection
  const ob0 = glass.onBeforeRender; glass.onBeforeRender = (...a) => { const r = a[0]; const now = performance.now(); if (LITE && !r.xr.isPresenting && now - (glass._t || 0) < 60) return; glass._t = now; const v = rd.visible; rd.visible = false; ob0.apply(glass, a); rd.visible = v; }; // phones: the reflection is redrawn every other frame
  it.k = 0; it.card = 0; animator(it); const D0 = 0.3, D1 = 2.0;
  it.d = 1.0;
  const place = () => { obj.position.set(LX, 0, MZ + it.d); ptr.position.set(0, 0.005, 0); };
  obj.add(ptr);
  it.setK = (k) => { it.k = clamp01(k); it.d = D0 + (D1 - D0) * it.k; place(); const d = it.d.toFixed(2);
    rd.set([`${w_('Slate')}: ${d} m ${w_('in front of the mirror')}`, `${w_('Its image')}: ${d} m ${w_('behind the mirror')}`], [YEL, OKC]); if (it.onK) it.onK(it.k); };
  it.setD = (d) => it.setK((d - D0) / (D1 - D0));
  it.swap = (cb) => { if (it.busy) return false; it.play(1.4, (k) => { slate.rotation.y = Math.sin(k * Math.PI) * 1.4; if (k > 0.5 && it.card === 0) { it.card = 1; slateM.map = sT[1]; slateM.needsUpdate = true; } }, () => { slate.rotation.y = 0; rd.set([w_('In the mirror it reads AMBULANCE')], OKC); if (cb) cb(); }); return true; };
  it.say = (l, c) => rd.set(l, c);
  it.setD(1.0);
  it.knobPath = () => { const P = floorKnob(); return [P[0], P[1]]; }; it.leverPath = floorLever;
  it.camView = { p: V(0.45, 1.45, 0.6), t: V(-0.35, 0.8, -2.9) };
  mergeStatic(g, [glass]); mergeStatic(obj, [slate]);
  return done1(it, { height: MH, radius: 1.5 });
}
export function bindMirrorHands(cm, knob, lever, app, s = { back: 1, near: 2, card: 3 }, done = {}) {
  const sync = slideKnob(knob, { path: () => cm.knobPath(), active: () => stepNow(app, s.back) || stepNow(app, s.near), keepVisible: () => app.runner.i === s.back || app.runner.i === s.near, k: () => cm.k,
    set: (k) => { cm.setK(clamp01(k)); if (stepNow(app, s.back) && cm.d >= 1.5 && done.back) done.back(); if (stepNow(app, s.near) && cm.d <= 0.5 && done.near) done.near(); } });
  const s0 = cm.setK; cm.setK = (k) => { s0(k); sync(); };
  pushKnob(lever, { path: () => cm.leverPath(), active: () => stepNow(app, s.card) && !cm.busy && cm.card === 0, keepVisible: () => app.runner.i === s.card, press: () => cm.swap(() => done.card && done.card()) });
}

// ------------------------------------------------------------------ a weather thermometer on a stake (10 … 50 °C), for the beach
function stakeThermo(w_) {
  const t = new THREE.Group(), L = 0.42, Y0 = 0.52;
  const board = box(t, M(0xf7f5ee, 0.6), 0.075, L + 0.12, 0.01, 0, Y0 + L / 2, -0.006);
  const scT = tex(128, 768, (x) => { x.fillStyle = '#f7f5ee'; x.fillRect(0, 0, 128, 768); const yOf = (c) => 768 - (0.06 + ((c - 10) / 40) * L) / (L + 0.12) * 768; x.fillStyle = '#1d2733'; x.textAlign = 'right'; x.textBaseline = 'middle';
    for (let c = 10; c <= 50; c++) { const y = yOf(c), big = c % 10 === 0; x.fillRect(big ? 66 : 80, y - (big ? 2 : 1), big ? 34 : 18, big ? 4 : 2); if (big || c % 5 === 0) { x.font = `800 ${big ? 30 : 20}px ${FONT}`; x.fillText(String(c), 62, y); } } x.font = `800 28px ${FONT}`; x.textAlign = 'center'; x.fillText('°C', 64, 30); });
  const face = new THREE.Mesh(new THREE.PlaneGeometry(0.075, L + 0.12), new THREE.MeshStandardMaterial({ map: scT, roughness: 0.6 })); face.position.set(0, Y0 + L / 2, -0.0005); t.add(face); void board;
  const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.0045, 0.0045, L + 0.04, 10), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.05, transparent: true, opacity: 0.35 })); glass.position.set(0.012, Y0 + L / 2 + 0.01, 0.004); t.add(glass);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.008, 14, 10), M(0xd0141e, 0.25)); bulb.position.set(0.012, Y0 + 0.03, 0.004); t.add(bulb);
  const col = new THREE.Mesh(new THREE.CylinderGeometry(0.002, 0.002, 1, 8), new THREE.MeshStandardMaterial({ color: 0xd0141e, roughness: 0.3, emissive: 0x300004 })); t.add(col);
  const stake = box(t, new THREE.MeshStandardMaterial({ map: woodP('#8a5a2b'), roughness: 0.7 }), 0.03, Y0 + 0.1, 0.03, 0, (Y0 + 0.1) / 2 - 0.1, -0.03); void stake;
  t.setC = (c) => { const h = Math.max(0.004, 0.06 + ((c - 10) / 40) * L - 0.03); col.scale.y = h; col.position.set(0.012, Y0 + 0.03 + h / 2, 0.004); }; t.setC(25); void w_; return t;
}
// a soft round puff (smoke, steam)
let PUFF = null; const puffTex = () => PUFF || (PUFF = tex(64, 64, (x) => { const g = x.createRadialGradient(32, 32, 2, 32, 32, 31); g.addColorStop(0, 'rgba(235,235,235,0.9)'); g.addColorStop(0.5, 'rgba(220,220,220,0.4)'); g.addColorStop(1, 'rgba(210,210,210,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); }));
// a flowing arrow along a curve (for the moving air), drawn as a tube with moving stripes
function flowTube(pts, col, r = 0.12) {
  const T = tex(128, 16, (x) => { x.clearRect(0, 0, 128, 16); const g = x.createLinearGradient(0, 0, 128, 0); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.75, 'rgba(255,255,255,0.95)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 16); });
  T.wrapS = THREE.RepeatWrapping; const curve = new THREE.CatmullRomCurve3(pts); const len = curve.getLength(); T.repeat.set(len / 2.5, 1);
  const m = new THREE.Mesh(new THREE.TubeGeometry(curve, 48, r, 8, false), new THREE.MeshBasicMaterial({ map: T, color: col, transparent: true, opacity: 0.75, depthWrite: false, toneMapped: false, side: THREE.DoubleSide }));
  const head = new THREE.Mesh(new THREE.ConeGeometry(r * 2.6, r * 5, 12), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.85, depthWrite: false, toneMapped: false })); const e = curve.getPoint(1), d = curve.getTangent(1); head.position.copy(e); head.quaternion.setFromUnitVectors(V(0, 1, 0), d); m.add(head);
  m.flow = (dt, s = 1) => { T.offset.x -= dt * s * 0.6; }; m.renderOrder = 5; return m;
}

// ------------------------------------------------------------------ Class 7 Ch 7 Heat Transfer in Nature: sea breeze and land breeze on a beach
// On a real beach (the sea to the left, the land to the right). One thermometer is pushed into the dry sand, one stands in
// the shallow sea; an incense stick burns in the sand and a small flag flies. The handle moves the clock: the sand heats up
// and cools down much faster than the sea, and the breeze (the smoke and the flag show it) blows from the cooler to the warmer.
export function seaBreeze(o = {}) {
  const it = new Item('pbreeze7', { ...o, name: { en: 'Thermometers, an incense stick and a flag on the beach', hi: 'समुद्र तट पर थर्मामीटर, अगरबत्ती और झंडी', hg: 'Beach par thermometer, agarbatti aur jhandi' } });
  const g = it.g, w_ = o.W || ((k) => k), app = o.app, SX = -2.6; // the water's edge
  // the shallow sea comes up to the student's left: water that mirrors the sky, with ripples and a line of foam
  const ripT = tex(256, 256, (x) => { x.fillStyle = 'rgb(128,128,255)'; x.fillRect(0, 0, 256, 256); const r = rnd(21); for (let i = 0; i < 1400; i++) { const v = r(); x.fillStyle = `rgba(${v < 0.5 ? '110,110,255' : '150,150,255'},0.5)`; x.beginPath(); x.ellipse(r() * 256, r() * 256, 6 + r() * 14, 2 + r() * 3, 0, 0, 7); x.fill(); } }, [30, 30]); ripT.colorSpace = THREE.NoColorSpace;
  const seaM = new THREE.MeshStandardMaterial({ color: 0x1f6f86, roughness: 0.08, metalness: 0.1, normalMap: ripT, normalScale: new THREE.Vector2(0.35, 0.35), transparent: true, opacity: 0.93 });
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(90, 180), seaM); sea.rotation.x = -Math.PI / 2; sea.position.set(SX - 45, 0.012, 0); sea.receiveShadow = true; g.add(sea);
  const wetT = tex(64, 256, (x) => { const gr = x.createLinearGradient(0, 0, 64, 0); gr.addColorStop(0, 'rgba(90,75,55,0.55)'); gr.addColorStop(1, 'rgba(90,75,55,0)'); x.fillStyle = gr; x.fillRect(0, 0, 64, 256); }, [1, 1]);
  const wet = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 110), new THREE.MeshBasicMaterial({ map: wetT, transparent: true, depthWrite: false })); wet.rotation.x = -Math.PI / 2; wet.position.set(SX + 1.0, 0.006, 0); g.add(wet);
  const foamT = tex(64, 512, (x) => { x.clearRect(0, 0, 64, 512); const r = rnd(5); for (let i = 0; i < 260; i++) { x.fillStyle = `rgba(255,255,255,${0.25 + r() * 0.5})`; x.beginPath(); x.ellipse(20 + r() * 30, r() * 512, 3 + r() * 8, 2 + r() * 10, 0, 0, 7); x.fill(); } }, [1, 14]);
  const foam = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 110), new THREE.MeshBasicMaterial({ map: foamT, transparent: true, depthWrite: false, opacity: 0.8 })); foam.rotation.x = -Math.PI / 2; foam.position.set(SX + 0.05, 0.016, 0); g.add(foam);
  // thermometers: in the sand (land) and in the sea
  const thL = stakeThermo(w_), thS = stakeThermo(w_); thL.position.set(1.0, -0.1, -1.6); thS.position.set(SX - 0.5, -0.1, -1.4); thS.rotation.y = 0.5; thL.rotation.y = -0.25; g.add(thL); g.add(thS);
  const tgL = tag('—', '#ffd23f', 0.13), tgS = tag('—', '#9fd3ff', 0.13); tgL.position.set(1.0, 1.15, -1.6); tgS.position.set(SX - 0.5, 1.15, -1.4); g.add(tgL); g.add(tgS);
  const nmL = tag(w_('sand'), '#ffffff', 0.09), nmS = tag(w_('sea water'), '#ffffff', 0.09); nmL.position.set(1.0, 1.32, -1.6); nmS.position.set(SX - 0.5, 1.32, -1.4); g.add(nmL); g.add(nmS);
  // an incense stick in a small heap of sand, and its smoke
  const IX = -0.45, IZ = -1.25; const heap = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.05, 16), new THREE.MeshStandardMaterial({ color: 0xcdb48a, roughness: 1 })); heap.position.set(IX, 0.025, IZ); g.add(heap);
  g.add(rod(V(IX, 0.03, IZ), V(IX + 0.01, 0.3, IZ), 0.0015, M(0x5a2a14, 0.9))); const ember = new THREE.Mesh(new THREE.SphereGeometry(0.0028, 8, 6), new THREE.MeshBasicMaterial({ color: 0xff5a1a, toneMapped: false })); ember.position.set(IX + 0.01, 0.3, IZ); g.add(ember);
  const NP = LITE ? 28 : 44, puffs = []; const pm = new THREE.SpriteMaterial({ map: puffTex(), transparent: true, depthWrite: false, opacity: 0.6, color: 0x8f8f94 });
  for (let i = 0; i < NP; i++) { const s = new THREE.Sprite(pm.clone()); s.userData.age = i / NP * 4; s.userData.p = V(IX + 0.01, 0.3, IZ); s.renderOrder = 6; g.add(s); puffs.push(s); }
  // a small flag on a bamboo pole
  const FX = 0.5, FZ = -2.6; g.add(rod(V(FX, 0, FZ), V(FX, 1.9, FZ), 0.012, new THREE.MeshStandardMaterial({ map: woodP('#c9a46a'), roughness: 0.7 })));
  const flagT = tex(128, 64, (x) => { x.fillStyle = '#d42a1e'; x.fillRect(0, 0, 128, 32); x.fillStyle = '#f2c21a'; x.fillRect(0, 32, 128, 32); });
  const flagG = new THREE.PlaneGeometry(0.45, 0.28, 12, 4); flagG.translate(0.225, 0, 0); const flagP0 = flagG.attributes.position.array.slice();
  const flag = new THREE.Mesh(flagG, new THREE.MeshStandardMaterial({ map: flagT, roughness: 0.8, side: THREE.DoubleSide })); flag.position.set(FX, 1.74, FZ); flag.castShadow = true; g.add(flag);
  // air moving: low over the ground from the cool side to the warm side, rising over the warm side, back high up, sinking
  const loop = (dir) => { const s = dir, a = s > 0 ? -4.2 : 2.8, b = s > 0 ? 2.8 : -4.2, gr = new THREE.Group(), Z = -4;
    gr.add(flowTube([V(a, 0.6, Z), V((a + b) / 2, 0.7, Z), V(b, 0.6, Z)], 0x7ad0ff, 0.1)); gr.add(flowTube([V(b + s * 0.8, 0.9, Z), V(b + s * 1.3, 2.5, Z), V(b + s * 0.8, 4.0, Z)], 0xffa64a, 0.1));
    gr.add(flowTube([V(b, 4.6, Z), V((a + b) / 2, 4.8, Z), V(a, 4.6, Z)], 0xffc27a, 0.1)); gr.add(flowTube([V(a - s * 0.8, 4.0, Z), V(a - s * 1.3, 2.5, Z), V(a - s * 0.8, 0.9, Z)], 0x7ad0ff, 0.1));
    const lab = (t, x, y, c) => { const tg = tag(t, c, 0.36); tg.position.set(x, y, Z); gr.add(tg); }; lab(w_(s > 0 ? 'warm air rises' : 'cool air sinks'), 3.3 * s + (s > 0 ? 0.5 : -0.4), 2.5, s > 0 ? '#ffc27a' : '#9fd3ff'); lab(w_(s > 0 ? 'cool air sinks' : 'warm air rises'), -3.3 * s - (s > 0 ? 1.4 : -1.0), 2.5, s > 0 ? '#9fd3ff' : '#ffc27a');
    gr.visible = false; g.add(gr); return gr; };
  const loops = { day: loop(1), night: loop(-1) };
  const rd = liveSign(0.17, 5.2); rd.position.set(-0.3, 1.72, -3.2); g.add(rd);
  const clock = tag('6:00 a.m.', '#ffffff', 0.14); clock.position.set(-0.3, 1.99, -3.2); g.add(clock);
  it.h = 6; it.k = 0; it.phase = 'day'; it.wind = 0;
  const Tl = (h) => 28.5 + 8.5 * Math.cos(2 * Math.PI * (h - 14) / 24), Ts = (h) => 27.4 + 0.7 * Math.cos(2 * Math.PI * (h - 15) / 24);
  const fmt = (h) => { const H = Math.floor(h) % 24, mi = Math.round((h - Math.floor(h)) * 60) % 60; const hh = H % 12 === 0 ? 12 : H % 12; return `${hh}:${String(mi).padStart(2, '0')} ${H < 12 ? 'a.m.' : 'p.m.'}`; };
  // night: the place grows dark (its photo, the Sun and the sky light), and comes back to day at dawn
  const P = PLACES.beach; let nightNow = -1;
  const night = (n) => { if (!app || !app.places) return; if (Math.abs(n - nightNow) < 0.004) return; const sky = app.places.cur === 'beach' && app.places.root.children.find((c) => c.material && c.material.map && c !== app.places.shadow); if (!sky) return; nightNow = n;
    sky.material.color.setRGB(1 - 0.9 * n, 1 - 0.88 * n, 1 - 0.8 * n); const L = app.places.lights || []; for (const l of L) { if (l.isDirectionalLight && l.castShadow) l.intensity = P.sunI * (1 - 0.93 * n); else l.intensity = (l.isHemisphereLight ? P.sky : P.sky * 0.4) * (1 - 0.75 * n); }
    app.scene.environmentIntensity = P.env * (1 - 0.8 * n); ember.material.color.setHex(n > 0.5 ? 0xff7a2a : 0xff5a1a); };
  it.nightK = (h) => { const hh = ((h % 24) + 24) % 24; return hh >= 18 ? clamp01((hh - 18) / 1.6) : hh < 6 ? clamp01((6 - hh) / 0.8) : 0; };
  it.setH = (h) => { it.h = h; const tl = Tl(h), ts = Ts(h); thL.setC(tl); thS.setC(ts); tgL.setText(`${tl.toFixed(0)} °C`); tgS.setText(`${ts.toFixed(0)} °C`); clock.setText(fmt(h)); it.wind = (tl - ts) * 0.45; night(it.nightK(h));
    const wd = Math.abs(it.wind) < 0.4 ? w_('hardly any breeze') : it.wind > 0 ? `${w_('breeze from the sea to the land')} (${w_('sea breeze')})` : `${w_('breeze from the land to the sea')} (${w_('land breeze')})`;
    rd.set([`${w_('sand')} ${tl.toFixed(0)} °C · ${w_('sea')} ${ts.toFixed(0)} °C`, wd], [YEL, Math.abs(it.wind) < 0.4 ? '#ffffff' : it.wind > 0 ? '#9fd3ff' : '#ffc27a']); if (it.onK) it.onK(it.k); };
  it.setK = (k) => { it.k = clamp01(k); it.setH(it.phase === 'day' ? 6 + 8 * it.k : 18 + 8 * it.k); };
  it.toNight = () => { it.phase = 'night'; it.k = 0; loops.day.visible = false; it.setK(0); };
  it.showLoop = (on = true) => { loops.day.visible = on && it.phase === 'day'; loops.night.visible = on && it.phase === 'night'; };
  let T = 0; const u0 = it.update; it.update = (dt) => { if (u0) u0(dt); dt = Math.min(dt || 0.016, 0.05); T += dt; night(it.nightK(it.h)); ripT.offset.x += dt * 0.004; ripT.offset.y += dt * 0.002; foam.position.x = SX + 0.05 + Math.sin(T * 0.7) * 0.18; foam.material.opacity = 0.55 + 0.3 * Math.sin(T * 0.7 + 1);
    const w = it.wind; for (const s of puffs) { const u = s.userData; u.age += dt; if (u.age > 4) { u.age -= 4; u.p.set(IX + 0.01, 0.3, IZ); } const a = u.age; u.p.x += w * 0.35 * dt * Math.min(1, a * 0.8) + Math.sin(T * 2 + a * 3) * 0.004; u.p.y += (0.09 + 0.02 * Math.sin(a * 5)) * dt; u.p.z += Math.sin(T + a) * 0.003 * dt;
      s.position.copy(u.p); s.scale.setScalar(0.025 + a * 0.08); s.material.opacity = 0.7 * Math.min(1, a * 3) * Math.max(0, 1 - a / 4); }
    const P0 = flagP0, pa = flagG.attributes.position.array, str = Math.min(1, Math.abs(w) / 3); for (let i = 0; i < pa.length; i += 3) { const x = P0[i], y = P0[i + 1]; const droop = (1 - str) * x * 1.4; pa[i] = x * (0.55 + 0.45 * str) ; pa[i + 1] = y - droop * 0.35 * (0.4 + x * 2); pa[i + 2] = Math.sin(x * 14 - T * (4 + 6 * str)) * 0.03 * x * (0.3 + str); }
    flagG.attributes.position.needsUpdate = true; flagG.computeVertexNormals(); flag.rotation.y = w >= 0 ? 0 : Math.PI;
    for (const L of [loops.day, loops.night]) if (L.visible) L.children.forEach((c) => c.flow && c.flow(dt, 1 + Math.abs(w) * 0.3)); };
  it.say = (l, c) => rd.set(l, c);
  night(0); it.setH(6); it.say([w_('6 a.m. on the beach: feel the air')], '#ffffff');
  it.knobPath = floorKnob; it.leverPath = floorLever;
  it.camView = { p: V(1.3, 2.0, 2.2), t: V(-0.6, 0.9, -2.2) };
  it.views = { near: it.camView, loop: { p: V(-0.5, 2.5, 6.0), t: V(-0.6, 2.3, -4) } };
  return done1(it, { height: 2, radius: 3 });
}
export function bindBreezeHands(sb, knob, lever, app, s = { day: 1, loop: 2, night: 3 }, done = {}) {
  const sync = slideKnob(knob, { path: () => sb.knobPath(), active: () => (stepNow(app, s.day) && sb.phase === 'day') || stepNow(app, s.night), keepVisible: () => app.runner.i === s.day || app.runner.i === s.night, k: () => sb.k,
    set: (k) => { if (stepNow(app, s.night) && sb.phase !== 'night') sb.toNight(); const kk = clamp01(k > 0.985 ? 1 : k); if (kk > sb.k) sb.setK(kk); if (sb.k >= 1 - 1e-6) { if (sb.phase === 'day' && done.day) done.day(); if (sb.phase === 'night' && done.night) done.night(); } } });
  const s0 = sb.setK; sb.setK = (k) => { s0(k); sync(); };
  pushKnob(lever, { path: () => sb.leverPath(), active: () => stepNow(app, s.loop), keepVisible: () => app.runner.i === s.loop, press: () => { sb.showLoop(true); sb.camView = sb.views.loop; done.loop && done.loop(); } });
}

// ------------------------------------------------------------------ Class 8 Ch 10 Light: Mirrors and Lenses: a periscope over the courtyard wall
// A 2.2 m brick wall stands in front of you; your eye (1.4 m) cannot see over it. A cardboard periscope, 1.5 m tall, stands
// against the wall with a mirror at each end. The handle tilts one mirror at a time. What you see through the eyepiece is
// drawn live from where the light really comes from: each mirror reflects the line of sight (law of reflection), so only
// with both mirrors at 45° (parallel) do you see straight ahead over the wall.
export function periscope(o = {}) {
  const it = new Item('pperiscope8', { ...o, name: { en: 'Periscope at the courtyard wall', hi: 'आँगन की दीवार पर पेरिस्कोप', hg: 'Courtyard ki deewaar par periscope' } });
  const g = it.g, w_ = o.W || ((k) => k), WZ = -1.55, WH = 2.2, PX = 0, PZ = -1.32, YB = 1.36, YT = 2.62, S = 0.1;
  // the wall (real bricks), its cement coping, and what is on the other side: a flagpole with the tricolour and a football
  const wall = new THREE.Mesh(new THREE.BoxGeometry(9, WH, 0.23), [0, 1, 2, 3, 4, 5].map((i) => (i === 2 ? M(0xb9b3a8, 0.9) : new THREE.MeshStandardMaterial({ map: brickT([9 / 1.2, WH / 1.2]), roughness: 0.9 })))); wall.position.set(0, WH / 2, WZ - 0.115); wall.castShadow = true; wall.receiveShadow = true; g.add(wall);
  box(g, M(0xb9b3a8, 0.9), 9.1, 0.07, 0.3, 0, WH + 0.035, WZ - 0.115);
  const FPX = 0.45, FPZ = -12; g.add(rod(V(FPX, 0, FPZ), V(FPX, 5.4, FPZ), 0.04, M(0xd8dde2, 0.3, 0.8))); box(g, M(0xc9c2b4, 0.9), 0.9, 0.3, 0.9, FPX, 0.15, FPZ);
  const triT = tex(256, 168, (x) => { x.fillStyle = '#ff9933'; x.fillRect(0, 0, 256, 56); x.fillStyle = '#ffffff'; x.fillRect(0, 56, 256, 56); x.fillStyle = '#138808'; x.fillRect(0, 112, 256, 56); x.strokeStyle = '#000080'; x.lineWidth = 2.5; x.beginPath(); x.arc(128, 84, 24, 0, 7); x.stroke(); for (let i = 0; i < 24; i++) { const a = i * Math.PI / 12; x.beginPath(); x.moveTo(128, 84); x.lineTo(128 + Math.cos(a) * 24, 84 + Math.sin(a) * 24); x.stroke(); } });
  const flG = new THREE.PlaneGeometry(1.2, 0.8, 14, 4); flG.translate(0.6, 0, 0); const fl0 = flG.attributes.position.array.slice(); const flag = new THREE.Mesh(flG, new THREE.MeshStandardMaterial({ map: triT, roughness: 0.8, side: THREE.DoubleSide })); flag.position.set(FPX + 0.04, 5.0, FPZ); g.add(flag);
  const ballT = tex(256, 128, (x) => { x.fillStyle = '#f8f8f6'; x.fillRect(0, 0, 256, 128); x.fillStyle = '#111'; for (let i = 0; i < 6; i++) for (let j = 0; j < 3; j++) { const cx = 20 + i * 44 + (j % 2) * 22, cy = 20 + j * 44; x.beginPath(); for (let k = 0; k < 5; k++) { const a = k * 1.2566 - Math.PI / 2; x.lineTo(cx + Math.cos(a) * 12, cy + Math.sin(a) * 12); } x.closePath(); x.fill(); } });
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.11, 24, 16), new THREE.MeshStandardMaterial({ map: ballT, roughness: 0.5 })); ball.position.set(-0.35, 0.11, -8.5); ball.castShadow = true; g.add(ball);
  // the periscope: a square cardboard tube with openings at the bottom (towards you) and at the top (over the wall)
  const card = new THREE.MeshStandardMaterial({ map: photoTex('tex/cardboard.jpg', { repeat: [1, 6] }), roughness: 0.9, side: THREE.DoubleSide }), inside = M(0x1c1814, 0.95);
  const tube = new THREE.Group(); g.add(tube); const H = YT - YB + 0.24, cy = (YB + YT) / 2;
  box(tube, card, 0.006, H, S, PX - S / 2, cy, PZ); box(tube, card, 0.006, H, S, PX + S / 2, cy, PZ); // sides
  box(tube, card, S, H - 0.2, 0.006, PX, cy + 0.1 - 0.02, PZ + S / 2).position.y = cy + 0.1; // front, open at the bottom
  box(tube, card, S, H - 0.2, 0.006, PX, cy - 0.1, PZ - S / 2); // back, open at the top
  box(tube, card, S, 0.006, S, PX, YB - 0.12, PZ); box(tube, card, S, 0.006, S, PX, YT + 0.12, PZ);
  const mirror = (y) => { const m = new THREE.Group(); m.position.set(PX, y, PZ); g.add(m); const back = new THREE.Mesh(new THREE.BoxGeometry(S - 0.008, 0.004, S * 1.42), M(0x2b2f35, 0.6)); m.add(back); const face = new THREE.Mesh(new THREE.PlaneGeometry(S - 0.01, S * 1.4), new THREE.MeshStandardMaterial({ color: 0xc9d4da, metalness: 1, roughness: 0.06 })); face.rotation.x = -Math.PI / 2; face.position.y = 0.0025; m.add(face); return m; };
  const mB = mirror(YB), mT = mirror(YT);
  // the view through the eyepiece: rendered from the top mirror along the twice-reflected line of sight
  const RT = new THREE.WebGLRenderTarget(LITE ? 192 : 256, LITE ? 192 : 256, { colorSpace: THREE.SRGBColorSpace }); const cam = new THREE.PerspectiveCamera(40, 1, 0.05, 200);
  const maskT = tex(128, 128, (x) => { x.fillStyle = '#000'; x.fillRect(0, 0, 128, 128); const gr = x.createRadialGradient(64, 64, 40, 64, 64, 62); gr.addColorStop(0, '#fff'); gr.addColorStop(1, '#000'); x.fillStyle = gr; x.beginPath(); x.arc(64, 64, 63, 0, 7); x.fill(); }); maskT.colorSpace = THREE.NoColorSpace;
  const viewM = new THREE.MeshBasicMaterial({ map: RT.texture, alphaMap: maskT, transparent: true, toneMapped: false, depthWrite: false });
  const view = new THREE.Mesh(new THREE.CircleGeometry(0.27, 40), viewM); view.position.set(0.62, 1.55, -0.95); view.rotation.y = -0.35; view.renderOrder = 30; g.add(view);
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.27, 0.295, 48), new THREE.MeshBasicMaterial({ color: 0x1d2229, toneMapped: false })); ring.position.copy(view.position); ring.rotation.copy(view.rotation); g.add(ring);
  const vTag = tag(w_('what your eye sees'), '#ffffff', 0.07); vTag.position.set(0.62, 1.88, -0.95); g.add(vTag);
  const eyeM = new THREE.MeshBasicMaterial({ map: RT.texture, toneMapped: false }); const eye = new THREE.Mesh(new THREE.PlaneGeometry(S - 0.012, 0.09), eyeM); eye.position.set(PX, YB, PZ + S / 2 + 0.004); g.add(eye); // the bottom opening shows the same
  const dark = new THREE.Mesh(new THREE.CircleGeometry(0.27, 40), new THREE.MeshBasicMaterial({ color: 0x15110d, transparent: true, opacity: 0, depthWrite: false, toneMapped: false })); dark.position.copy(view.position).add(V(0.0005, 0, 0.002)); dark.rotation.copy(view.rotation); dark.renderOrder = 31; g.add(dark);
  const rd = liveSign(0.12, 5); rd.position.set(-0.55, 2.0, -1.0); g.add(rd);
  it.aB = 30; it.aT = 30; it.k = 0; it.which = 'bottom'; it.vis = 0;
  const refl = (d, n) => d.clone().addScaledVector(n, -2 * d.dot(n));
  it.solve = () => { const b = it.aB * DEG, t = it.aT * DEG; const nB = V(0, Math.cos(b), Math.sin(b)), nT = V(0, -Math.cos(t), -Math.sin(t)); // normals of the mirrors (angle from the floor)
    const d0 = V(0, 0, -1), u0 = V(0, 1, 0), r0 = V(1, 0, 0); const d1 = refl(d0, nB), d2 = refl(d1, nT), u2 = refl(refl(u0, nB), nT), r2 = refl(refl(r0, nB), nT);
    const dev1 = Math.acos(clamp01(d1.y)) / DEG, dev2 = Math.acos(Math.max(-1, Math.min(1, -d2.z))) / DEG; const f1 = clamp01(1 - (dev1 - 4) / 10), f2 = d1.y > 0 ? clamp01(1 - (dev2 - 32) / 12) : 0;
    it.vis = f1 * f2; it.d2 = d2; it.dev1 = dev1; it.tilt = Math.asin(Math.max(-1, Math.min(1, d2.y))) / DEG;
    cam.position.set(PX, YT, PZ - 0.02); cam.matrix.makeBasis(r2, u2, d2.clone().negate()); cam.matrix.setPosition(cam.position); cam.matrix.decompose(cam.position, cam.quaternion, cam.scale); cam.updateMatrixWorld(true);
    mB.rotation.x = b; mT.rotation.x = Math.PI + t; dark.material.opacity = 1 - it.vis; };
  // draw the view once a frame, just before the round view is drawn (as three.js's own Reflector does)
  let busy = false, lastF = -1; const hideList = [rd, vTag, view, ring, dark, eye, tube, mB, mT];
  view.onBeforeRender = (renderer, scene) => { const f = renderer.info.render.frame; if (busy || f === lastF || it.vis <= 0.01) return; lastF = f; busy = true;
    const xr = renderer.xr.enabled, sh = renderer.shadowMap.autoUpdate, rt0 = renderer.getRenderTarget(); const vis = hideList.map((m) => m.visible); hideList.forEach((m) => { m.visible = false; });
    renderer.xr.enabled = false; renderer.shadowMap.autoUpdate = false; renderer.setRenderTarget(RT); renderer.state.buffers.depth.setMask(true); if (renderer.autoClear === false) renderer.clear(); renderer.render(scene, cam);
    renderer.xr.enabled = xr; renderer.shadowMap.autoUpdate = sh; renderer.setRenderTarget(rt0); hideList.forEach((m, i) => { m.visible = vis[i]; }); busy = false; };
  const say = () => { const a = it.which === 'bottom' ? it.aB : it.aT; const what = it.vis < 0.05 ? w_('only the dark inside of the tube') : it.tilt > 8 ? w_('the sky') : it.tilt < -8 ? w_('the ground beyond the wall') : w_('straight ahead, over the wall');
    rd.set([`${w_(it.which === 'bottom' ? 'bottom mirror' : 'top mirror')}: ${a.toFixed(0)}°`, `${w_('you see')}: ${what}`], [YEL, it.vis > 0.9 && Math.abs(it.tilt) < 4 ? OKC : '#ffffff']); };
  it.setK = (k) => { it.k = clamp01(k); const a = 20 + 50 * it.k; if (it.which === 'bottom') it.aB = a; else it.aT = a; it.solve(); say(); if (it.onK) it.onK(it.k); };
  it.toTop = () => { it.which = 'top'; it.k = (it.aT - 20) / 50; it.solve(); say(); };
  it.setAngle = (a) => it.setK((a - 20) / 50);
  let T = 0; const u0 = it.update; it.update = (dt) => { if (u0) u0(dt); T += Math.min(dt || 0.016, 0.05); const pa = flG.attributes.position.array; for (let i = 0; i < pa.length; i += 3) { const x = fl0[i]; pa[i + 2] = Math.sin(x * 5 - T * 5) * 0.06 * x; } flG.attributes.position.needsUpdate = true; };
  it.say = (l, c) => rd.set(l, c);
  it.solve(); say();
  it.knobPath = floorKnob;
  it.camView = { p: V(0.55, 1.6, 0.9), t: V(0.15, 1.75, -1.6) };
  mergeStatic(tube);
  return done1(it, { height: 2.8, radius: 2 });
}
export function bindPeriscopeHands(ps, knob, app, s = { bottom: 1, top: 2 }, done = {}) {
  let held = 0;
  const sync = slideKnob(knob, { path: () => ps.knobPath(), active: () => stepNow(app, s.bottom) || stepNow(app, s.top), keepVisible: () => app.runner.i === s.bottom || app.runner.i === s.top, k: () => ps.k,
    set: (k) => { if (stepNow(app, s.top) && ps.which !== 'top') ps.toTop(); ps.setK(k); } });
  const s0 = ps.setK; ps.setK = (k) => { s0(k); sync(); };
  const u0 = ps.update; ps.update = (dt) => { u0(dt); const ok = stepNow(app, s.bottom) ? Math.abs(ps.aB - 45) <= 3 : stepNow(app, s.top) ? ps.which === 'top' && Math.abs(ps.aT - 45) <= 3 && ps.vis > 0.9 : false; held = ok && !knob.held ? held + (dt || 0.016) : 0;
    if (held > 0.5) { held = 0; if (stepNow(app, s.bottom) && done.bottom) done.bottom(); else if (stepNow(app, s.top) && done.top) done.top(); } };
}

// ------------------------------------------------------------------ Class 8 Ch 5 Exploring Forces: a charged balloon bends a stream of water
// At the school's drinking-water taps in the courtyard: one tap is open just a little, so a thin stream falls into the
// trough. Rub a balloon on a woollen shawl (each stroke adds charge), then bring it close to the stream: the stream bends
// towards it, more when it is closer and more charged. If the balloon touches the water it gets wet and loses its charge.
export function balloonStream(o = {}) {
  const it = new Item('pballoon8', { ...o, name: { en: 'Balloon, woollen shawl and a water tap', hi: 'गुब्बारा, ऊनी शॉल और पानी का नल', hg: 'Gubbara, woollen shawl aur paani ka nal' } });
  const g = it.g, w_ = o.W || ((k) => k), ZW = -1.05, TX = 0.0, TY = 1.02, TZ = -0.86, BY = 0.78;
  // a tiled wall with a steel pipe and three taps, over a long tiled trough
  const tileT = tex(256, 256, (x) => { x.fillStyle = '#bfc5c4'; x.fillRect(0, 0, 256, 256); for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { const v = 228 + ((i * 7 + j * 3) % 5) * 4; x.fillStyle = `rgb(${v},${v + 2},${v})`; x.fillRect(i * 64 + 2, j * 64 + 2, 60, 60); } }, [6, 3]);
  const tileM = new THREE.MeshStandardMaterial({ map: tileT, roughness: 0.25 }), concM = new THREE.MeshStandardMaterial({ map: plasterT([3, 1]), color: 0xc4bdb0, roughness: 0.9 });
  box(g, tileM, 3.0, 1.6, 0.12, 0, 0.8, ZW - 0.06); box(g, concM, 3.1, 0.12, 0.14, 0, 1.66, ZW - 0.06);
  const trough = new THREE.Group(); g.add(trough); box(trough, tileM, 3.0, 0.08, 0.45, 0, BY - 0.04, ZW + 0.225 - 0.0); box(trough, tileM, 3.0, 0.14, 0.05, 0, BY + 0.03, ZW + 0.45); for (const x of [-1.2, 0, 1.2]) box(trough, concM, 0.2, BY - 0.08, 0.35, x, (BY - 0.08) / 2, ZW + 0.2);
  const waterIn = new THREE.Mesh(new THREE.PlaneGeometry(2.9, 0.38), new THREE.MeshStandardMaterial({ color: 0x8fb8c4, roughness: 0.05, metalness: 0.2, transparent: true, opacity: 0.55 })); waterIn.rotation.x = -Math.PI / 2; waterIn.position.set(0, BY + 0.005, ZW + 0.22); g.add(waterIn);
  const steel = M(0xc9ced2, 0.25, 0.9); g.add(rod(V(-1.45, 1.18, ZW + 0.04), V(1.45, 1.18, ZW + 0.04), 0.016, steel));
  for (const x of [-0.8, 0, 0.8]) { g.add(rod(V(x, 1.18, ZW + 0.04), V(x, 1.18, TZ - 0.03), 0.012, steel)); const body = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.016, 0.05, 16), steel); body.position.set(x, 1.15, TZ); g.add(body);
    g.add(rod(V(x, 1.13, TZ), V(x, TY + 0.005, TZ + 0.02), 0.008, steel)); const hd = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.008, 0.012), steel); hd.position.set(x, 1.185, TZ); hd.rotation.y = x === 0 ? 0.6 : 0; g.add(hd); }
  // the stream: a thin tube of water following the path worked out below
  const NS = 26, sm = new THREE.MeshStandardMaterial({ color: 0x9fcfe6, roughness: 0.02, metalness: 0.35, transparent: true, opacity: 0.92, emissive: 0x1e3f52 });
  let stream = new THREE.Mesh(new THREE.BufferGeometry(), sm); stream.renderOrder = 3; g.add(stream); const splash = new THREE.Mesh(new THREE.RingGeometry(0.004, 0.02, 16), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6, depthWrite: false })); splash.rotation.x = -Math.PI / 2; g.add(splash);
  // the woollen shawl folded on the trough's edge, and the balloon on its string
  const woolT = tex(128, 128, (x) => { x.fillStyle = '#7a1f2b'; x.fillRect(0, 0, 128, 128); const r = rnd(3); for (let i = 0; i < 2600; i++) { x.fillStyle = `rgba(${r() < 0.5 ? '160,60,70' : '60,10,20'},0.5)`; x.fillRect(r() * 128, r() * 128, 1 + r() * 2, 1); } x.fillStyle = 'rgba(230,190,90,0.6)'; for (let y = 10; y < 128; y += 30) x.fillRect(0, y, 128, 4); }, [2, 1]);
  const shawl = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.035, 0.24, 8, 1, 4), new THREE.MeshStandardMaterial({ map: woolT, roughness: 1 })); shawl.position.set(0.72, BY + 0.118, ZW + 0.45); g.add(shawl);
  const flap = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.16, 0.02), shawl.material); flap.position.set(0.72, BY + 0.03, ZW + 0.575); g.add(flap);
  const shawlP = shawl.position.clone();
  const R = 0.11; const bal = new THREE.Group(); g.add(bal); const bm = new THREE.MeshStandardMaterial({ color: 0xc8161d, roughness: 0.28, metalness: 0.05, emissive: 0x2a0204 });
  const bg = new THREE.SphereGeometry(R, 32, 24); bg.scale(1, 1.18, 1); const bmesh = new THREE.Mesh(bg, bm); bmesh.castShadow = true; bal.add(bmesh); const knot = new THREE.Mesh(new THREE.ConeGeometry(0.012, 0.025, 10), bm); knot.position.y = -R * 1.18 - 0.008; knot.rotation.x = Math.PI; bal.add(knot);
  const str = rod(V(0, -R * 1.18 - 0.02, 0), V(0.0, -R * 1.18 - 0.32, 0.05), 0.0012, M(0xf2efe6, 0.9), 4); bal.add(str);
  const rd = liveSign(0.09, 5); rd.position.set(0.32, 1.2, -1.04); g.add(rd);
  animator(it); it.q = 0; it.strokes = 0; it._side = 'L'; it.gap = 0.3; it.wet = false; it.mode = 'rub'; it.k = 0; it.bend = 0;
  const QMAX = 10;
  const home = () => V(shawlP.x - 0.15 + 0.3 * it.k, shawlP.y + 0.02 + R * 1.18, shawlP.z);
  const nearPos = () => V(TX + R + it.gap, 0.92, TZ + 0.0);
  // the path of the stream: it falls under gravity and is pulled sideways by the charged balloon (stronger close up)
  const path = () => { const pts = []; let p = V(TX, TY, TZ + 0.02), v = V(0, -0.45, 0); const B = bal.position, q = it.wet ? 0 : it.q / QMAX, near = it.mode === 'near'; const dt = 0.006; let n = 0;
    while (p.y > BY + 0.005 && n < 400) { if (n % 3 === 0) pts.push(p.clone()); const d = B.clone().sub(p); const r = Math.max(R + 0.004, d.length()); const a = near ? 7.5 * q * q * Math.pow((R + 0.02) / r, 3) : 0; d.normalize(); v.x += d.x * a * dt; v.z += d.z * a * dt * 0.4; v.y += (-9.8 + d.y * a * 0.3) * dt; p.addScaledVector(v, dt); n++;
      if (near && p.distanceTo(B) < R * 1.05 && !it.wet) { it.touch(); } }
    pts.push(p.clone()); return pts; };
  let lastKey = ''; const draw = () => { const key = `${bal.position.x.toFixed(4)}|${it.q}|${it.wet}|${it.mode}`; if (key === lastKey) return; lastKey = key; const pts = path(); const c = new THREE.CatmullRomCurve3(pts); stream.geometry.dispose(); stream.geometry = new THREE.TubeGeometry(c, NS, 0.003, 8, false); const e = pts[pts.length - 1]; splash.position.set(e.x, BY + 0.007, e.z); it.bend = Math.abs(e.x - TX); };
  it.touch = () => { it.wet = true; it.q = 0; bm.roughness = 0.12; rd.set([w_('The balloon touched the water: it is wet and has lost its charge'), w_('Push the lever to dry it and rub it again')], [RED, '#ffffff']); if (it.onWet) it.onWet(); };
  it.rub = (k) => { if (it.mode !== 'rub') return; const prev = it.k; it.k = clamp01(k); bal.position.copy(home()); bal.rotation.z = (it.k - 0.5) * 0.4; shawl.rotation.y = (it.k - 0.5) * 0.06;
    void prev; const side = it.k < 0.2 ? 'L' : it.k > 0.8 ? 'R' : null; if (side && it._side && side !== it._side) { it.strokes++; it.q = Math.min(QMAX, it.q + 1.5); } if (side) it._side = side; // one stroke = across the shawl
    rd.set([`${w_('Rubs')}: ${it.strokes} · ${w_('charge')} ${'▮'.repeat(Math.round(it.q))}${'▯'.repeat(QMAX - Math.round(it.q))}`], it.strokes >= 6 ? OKC : YEL); if (it.onRub) it.onRub(); if (it.onK) it.onK(it.k); };
  it.toNear = () => { it.mode = 'near'; it.k = 0; it.setK(0); };
  it.setK = (k) => { if (it.mode !== 'near') return; it.k = clamp01(k); it.gap = 0.3 * (1 - it.k) + 0.0; const p = nearPos(); bal.position.copy(p); bal.rotation.z = 0; draw();
    if (!it.wet) rd.set([`${w_('Balloon')} ${(it.gap * 100).toFixed(0)} cm ${w_('from the stream')}`, `${w_('the stream bends')} ${(it.bend * 100).toFixed(1)} cm ${w_('towards it')}`], [YEL, it.bend > 0.02 ? OKC : '#ffffff']); if (it.onK) it.onK(it.k); };
  it.dry = (cb) => { if (it.busy) return false; it.play(1.2, (k) => { bal.position.lerp(home(), 0.15); bal.rotation.z = Math.sin(k * 20) * 0.2; }, () => { it.wet = false; bm.roughness = 0.28; it.q = 9; it.strokes += 6; it.setK(0); rd.set([w_('Dry and rubbed again: charged')], OKC); if (cb) cb(); }); return true; };
  it.say = (l, c) => rd.set(l, c);
  bal.position.copy(home()); draw(); it.say([w_('A thin stream from the tap')], '#ffffff');
  it.knobPath = floorKnob; it.leverPath = floorLever;
  it.camView = { p: V(0.5, 1.5, 0.5), t: V(0.32, 0.92, -0.75) };
  mergeStatic(g, [shawl]); mergeStatic(trough);
  return done1(it, { height: 1.7, radius: 1.5 });
}
export function bindBalloonHands(bs, knob, lever, app, s = { rub: 1, near: 2 }, done = {}) {
  const sync = slideKnob(knob, { path: () => bs.knobPath(), active: () => stepNow(app, s.rub) || stepNow(app, s.near), keepVisible: () => app.runner.i === s.rub || app.runner.i === s.near, k: () => bs.k,
    set: (k) => { if (stepNow(app, s.rub)) bs.rub(k); else { if (bs.mode !== 'near') bs.toNear(); bs.setK(k); } } });
  ['rub', 'setK'].forEach((f) => { const f0 = bs[f]; bs[f] = (k) => { f0(k); sync(); }; });
  bs.onRub = () => { if (bs.strokes >= 6 && stepNow(app, s.rub) && done.rub) done.rub(); };
  const u0 = bs.update; let held = 0; bs.update = (dt) => { u0(dt); const ok = stepNow(app, s.near) && bs.mode === 'near' && !bs.wet && bs.bend > 0.02 && bs.gap <= 0.04; held = ok ? held + (dt || 0.016) : 0; if (held > 0.6 && done.near) { held = 0; done.near(); } };
  pushKnob(lever, { path: () => bs.leverPath(), active: () => stepNow(app, s.near) && bs.wet && !bs.busy, keepVisible: () => stepNow(app, s.near) && bs.wet, press: () => bs.dry() });
}

// a red leather cricket ball (with its seam)
let CB = null; const cricketTex = () => CB || (CB = tex(256, 128, (x) => { const g = x.createLinearGradient(0, 0, 0, 128); g.addColorStop(0, '#8e1414'); g.addColorStop(0.5, '#b31b1b'); g.addColorStop(1, '#7c1010'); x.fillStyle = g; x.fillRect(0, 0, 256, 128); const r = rnd(17); for (let i = 0; i < 500; i++) { x.fillStyle = `rgba(${r() < 0.5 ? '60,0,0' : '230,120,110'},${r() * 0.12})`; x.fillRect(r() * 256, r() * 128, 2, 2); }
  x.fillStyle = '#efe6d2'; x.fillRect(0, 60, 256, 8); x.strokeStyle = '#efe6d2'; x.lineWidth = 1.5; for (let i = 0; i < 256; i += 6) { x.beginPath(); x.moveTo(i, 56); x.lineTo(i + 3, 58); x.stroke(); x.beginPath(); x.moveTo(i, 72); x.lineTo(i + 3, 70); x.stroke(); } }));
const cricketBall = () => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.036, 24, 16), new THREE.MeshStandardMaterial({ map: cricketTex(), roughness: 0.38, metalness: 0.05 })); m.castShadow = true; return m; };

// ------------------------------------------------------------------ Class 9 Ch 6 How Forces Affect Motion: catching a cricket ball
// On the playground a friend throws a 160 g cricket ball to you at 14 m/s. Before each throw, slide the handle to choose how
// far you will pull your hands back while catching; push the lever to call for the ball. The ball's momentum (2.24 kg m/s)
// is lost either way; the force on your hands depends on how long that takes: F = Δp ÷ t. Stiff hands: over 1000 N, it
// stings and the ball may bounce out. The impact is shown 12 times slower; a graph of force against time keeps each catch.
export function catchBall(o = {}) {
  const it = new Item('pcatch9', { ...o, name: { en: 'Your hands and a cricket ball', hi: 'आपके हाथ और क्रिकेट की गेंद', hg: 'Aapke haath aur cricket ball' } });
  const g = it.g, w_ = o.W || ((k) => k), HC = V(0, 1.12, -0.42), m = 0.16, v = 14;
  // the hands, palms towards the ball, fingers up, thumbs together (the same glove hands as in the headset)
  const hands = new THREE.Group(); hands.position.copy(HC); hands.rotation.x = -0.35; g.add(hands);
  const handM = HAND_MAT.clone(); for (const side of ['left', 'right']) { const h = gloveHand(side, handM); hands.add(h); h.ready.then((hh) => { if (!hh) return; orientHand(hh, side, V(0, 1, 0), V(side === 'right' ? -1 : 1, 0, 0), V(0, 0, -1)); hh.updateMatrixWorld(true);
    const c = jpos(hh, 'middle-finger-metacarpal').lerp(jpos(hh, 'wrist'), 0.3).applyQuaternion(hh.model.quaternion); hh.model.position.set(-c.x + (side === 'right' ? 0.045 : -0.045), -c.y - 0.02, -c.z); hh.rotation.y = side === 'right' ? 0.35 : -0.35; }); }
  const tint = (k) => { handM.color.setRGB(0.93 + 0.07 * k, 0.945 - 0.35 * k, 0.965 - 0.4 * k); };
  // stumps where your friend throws from, and the ball
  const stumpM = new THREE.MeshStandardMaterial({ map: woodP('#d9c08a'), roughness: 0.6 }); for (const dx of [-0.11, 0, 0.11]) g.add(rod(V(dx, 0, -13), V(dx, 0.71, -13), 0.018, stumpM)); for (const dx of [-0.055, 0.055]) g.add(rod(V(dx - 0.05, 0.725, -13), V(dx + 0.05, 0.725, -13), 0.008, stumpM));
  const ball = cricketBall(); g.add(ball); const P0 = V(0.15, 1.85, -11.5);
  // the force–time graph of every catch
  const GW = 512, GH = 256; const gc = canvasTex(GW, GH, () => {}); const graph = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.31), new THREE.MeshBasicMaterial({ map: gc, toneMapped: false, transparent: true })); graph.position.set(0.72, 1.35, -0.95); graph.rotation.y = -0.45; g.add(graph);
  const catches = []; const drawGraph = () => { const x = gc.image.getContext('2d'); x.clearRect(0, 0, GW, GH); x.fillStyle = 'rgba(12,16,24,0.88)'; x.beginPath(); x.roundRect(0, 0, GW, GH, 26); x.fill();
    const X0 = 70, Y0 = GH - 46, XW = GW - 100, YH = GH - 86, tMax = 0.08, fMax = 1600; x.strokeStyle = '#cfd6de'; x.lineWidth = 2; x.beginPath(); x.moveTo(X0, 30); x.lineTo(X0, Y0); x.lineTo(X0 + XW, Y0); x.stroke();
    x.fillStyle = '#cfd6de'; x.font = `700 18px ${FONT}`; x.textAlign = 'right'; x.textBaseline = 'middle'; for (const f of [0, 400, 800, 1200, 1600]) { const y = Y0 - f / fMax * YH; x.fillText(String(f), X0 - 6, y); }
    x.textAlign = 'center'; x.textBaseline = 'top'; for (const t of [0, 20, 40, 60, 80]) x.fillText(String(t), X0 + t / 1000 / tMax * XW, Y0 + 6); x.fillText(`${w_('time')} (ms)`, X0 + XW / 2, Y0 + 24); x.save(); x.translate(18, (30 + Y0) / 2); x.rotate(-Math.PI / 2); x.fillText(`${w_('force')} (N)`, 0, -8); x.restore();
    catches.forEach((c) => { x.strokeStyle = c.col; x.lineWidth = 4; x.beginPath(); for (let i = 0; i <= 60; i++) { const t = c.tau * i / 60, f = c.fpk * Math.sin(Math.PI * i / 60); x.lineTo(X0 + Math.min(1, t / tMax) * XW, Y0 - Math.min(1, f / fMax) * YH); } x.stroke(); x.fillStyle = c.col; x.textAlign = 'left'; x.fillText(`${c.s} cm: ${Math.round(c.F)} N`, X0 + Math.min(c.tau / tMax, 0.7) * XW + 12, Math.max(34, Y0 - Math.min(1, c.fpk / fMax) * YH)); });
    gc.needsUpdate = true; };
  drawGraph();
  const slow = tag(w_('12 times slower'), '#ffffff', 0.06); slow.position.set(0, 1.42, -0.5); slow.visible = false; g.add(slow);
  const rd = liveSign(0.11, 5); rd.position.set(-0.05, 1.62, -1.1); g.add(rd);
  animator(it); it.k = 0; it.s = 0; it.n = 0; it.last = null; it.W = w_;
  ball.position.copy(P0);
  it.setK = (k) => { if (it.busy) return; it.k = clamp01(k); it.s = Math.round(50 * it.k) / 100; rd.set([`${w_('You will pull your hands back')} ${Math.round(it.s * 100)} cm`, w_('Push the lever to call for the ball')], [YEL, '#ffffff']); if (it.onK) it.onK(it.k); };
  it.throw = (cb) => { if (it.busy) return false; const s = it.s, dist = s + 0.012, F = m * v * v / (2 * dist), tau = 2 * dist / v, out = F > 650; const C = HC.clone().add(V(0, 0.02, -0.06)); const T = C.distanceTo(P0) / v;
    const v0 = C.clone().sub(P0).divideScalar(T).add(V(0, 4.9 * T, 0)); const SL = 12, tc = Math.max(0.12, tau * SL); slow.visible = false; tint(0); ball.position.copy(P0); ball.visible = true; let rb = null;
    const total = T + tc + (out ? 1.6 : 0.7); let tp = 0;
    it.play(total, (k) => { const t = k * total, dtt = Math.max(0, t - tp); tp = t;
      if (t < T) { ball.position.copy(P0).addScaledVector(v0, t).add(V(0, -4.9 * t * t, 0)); ball.rotation.x -= 0.4; hands.position.copy(HC); }
      else if (t < T + tc) { const u = (t - T) / tc; slow.visible = true; const e = 1 - (1 - u) * (1 - u); hands.position.copy(HC).add(V(0, 0, s * e)); ball.position.copy(C).add(V(0, 0, dist * e)); tint(Math.min(1, F / 1100) * Math.sin(Math.PI * Math.min(1, u * 1.2))); }
      else { slow.visible = false; const u = t - T - tc; tint(Math.min(1, F / 1100) * Math.max(0, 1 - u * 1.5)); if (out) { if (!rb) rb = { p: ball.position.clone(), v: V(0.6, 2.2, -2.6) }; const dt = Math.min(dtt, 0.05); rb.v.y -= 9.8 * dt; rb.p.addScaledVector(rb.v, dt); if (rb.p.y < 0.036) { rb.p.y = 0.036; rb.v.y = Math.abs(rb.v.y) * 0.3; rb.v.x *= 0.7; rb.v.z *= 0.7; } ball.position.copy(rb.p); } } },
    () => { it.n++; slow.visible = false; tint(0); hands.position.copy(HC); const c = { s: Math.round(s * 100), F, tau, fpk: Math.PI * m * v / (2 * tau), col: s <= 0.05 ? '#ff6b5a' : s >= 0.3 ? '#8be07a' : '#ffd23f' }; catches.push(c); if (catches.length > 4) catches.shift(); drawGraph(); it.last = c;
      rd.set([`${w_('Hands pulled back')} ${c.s} cm · ${w_('stopped in')} ${(tau * 1000).toFixed(1)} ms`, `${w_('average force')} ${Math.round(F)} N · ${out ? w_('ouch! the ball bounced out') : F > 150 ? w_('caught, but it stings') : w_('caught softly')}`], [YEL, out ? RED : F > 150 ? YEL : OKC]);
      if (!out) ball.position.copy(HC).add(V(0, 0.02, -0.06)); if (it.onCatch) it.onCatch(c); if (cb) cb(c); }); return true; };
  it.say = (l, c) => rd.set(l, c);
  it.setK(0); it.say([w_('Cricket ball: 160 g, thrown at 14 m/s'), w_('Slide to choose how far to pull your hands back')], ['#ffffff', YEL]);
  it.knobPath = floorKnob; it.leverPath = floorLever;
  it.camView = { p: V(0.35, 1.5, 0.45), t: V(0.05, 1.1, -2.2) };
  mergeStatic(g, [ball]);
  return done1(it, { height: 2, radius: 1 });
}
export function bindCatchHands(cb, knob, lever, app, s = { stiff: 1, soft: 2 }, done = {}) {
  const on = () => stepNow(app, s.stiff) || stepNow(app, s.soft);
  const sync = slideKnob(knob, { path: () => cb.knobPath(), active: () => on() && !cb.busy, keepVisible: () => app.runner.i === s.stiff || app.runner.i === s.soft, k: () => cb.k, set: (k) => cb.setK(k) });
  const s0 = cb.setK; cb.setK = (k) => { s0(k); sync(); };
  cb.onCatch = (c) => { if (stepNow(app, s.stiff)) { if (c.s <= 5) done.stiff && done.stiff(); else cb.say([cb.W('That was a soft catch: this time keep your hands stiff (0 cm)')], RED); }
    else if (stepNow(app, s.soft)) { if (c.s >= 30) done.soft && done.soft(); else cb.say([cb.W('Pull your hands back further: 30 cm or more')], RED); } };
  pushKnob(lever, { path: () => cb.leverPath(), active: () => on() && !cb.busy, keepVisible: () => on(), press: () => cb.throw() });
}

// ------------------------------------------------------------------ Class 9 Ch 7 Work, Energy and Simple Machines: a see-saw as a lever
// A painted steel see-saw on the playground, 3.6 m long, its pivot 0.55 m high. A 30 kg sack sits 1.0 m from the pivot on
// the left. Slide a 20 kg sack along the right arm: the see-saw turns the way the larger moment (mass × distance) pulls it,
// and rests level only when the two moments are equal. Then a 10 kg bag cannot balance it anywhere on that arm.
export function seesaw(o = {}) {
  const it = new Item('pseesaw9', { ...o, name: { en: 'See-saw and two sacks', hi: 'सी-सॉ और दो बोरियाँ', hg: 'See-saw aur do boriyaan' } });
  const g = it.g, w_ = o.W || ((k) => k), PZ = -2.4, PH = 0.55, LH = 1.8;
  const blue = M(0x1f5fa8, 0.45, 0.4), yellow = M(0xf2b632, 0.45, 0.3), steel = M(0x9aa1a8, 0.35, 0.8);
  // the stand: two A-frames and the pivot pipe
  for (const dz of [-0.28, 0.28]) { g.add(rod(V(-0.35, 0, PZ + dz), V(0, PH, PZ + dz), 0.03, blue)); g.add(rod(V(0.35, 0, PZ + dz), V(0, PH, PZ + dz), 0.03, blue)); } g.add(rod(V(0, PH, PZ - 0.32), V(0, PH, PZ + 0.32), 0.035, steel));
  for (const x of [-0.35, 0.35]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.08, 16), M(0x9b958a, 0.9)); p.position.set(x, 0.0, PZ); g.add(p); }
  // the beam that turns: a yellow box section with seats, handles and a painted scale (distance from the pivot)
  const beam = new THREE.Group(); beam.position.set(0, PH + 0.06, PZ); g.add(beam);
  box(beam, yellow, 2 * LH, 0.07, 0.12, 0, 0, 0);
  const seatM = new THREE.MeshStandardMaterial({ map: woodP('#8a5a2b'), roughness: 0.6 }); for (const s of [-1, 1]) { box(beam, seatM, 0.36, 0.03, 0.3, s * (LH - 0.2), 0.05, 0); const hx = s * (LH - 0.5); beam.add(rod(V(hx, 0.03, -0.12), V(hx, 0.4, -0.12), 0.014, blue)); beam.add(rod(V(hx, 0.03, 0.12), V(hx, 0.4, 0.12), 0.014, blue)); beam.add(rod(V(hx, 0.4, -0.13), V(hx, 0.4, 0.13), 0.014, blue)); }
  const scT = tapeTex(1.8, { ppm: 600, bg: '#f7f3e6' }); for (const s of [-1, 1]) { const sc = new THREE.Mesh(new THREE.PlaneGeometry(LH - 0.05, 0.03), new THREE.MeshStandardMaterial({ map: scT, roughness: 0.6 })); sc.rotation.x = -Math.PI / 2; sc.position.set(s * (LH - 0.05) / 2, 0.0355, 0.045); if (s < 0) sc.rotation.z = Math.PI; beam.add(sc); }
  // sacks: jute, with their mass printed on them
  const sack = (kg, col) => { const sg = new THREE.Group(); const T = tex(256, 256, (x) => { x.fillStyle = '#c9b383'; x.fillRect(0, 0, 256, 256); x.strokeStyle = 'rgba(110,90,50,0.45)'; for (let i = 0; i < 256; i += 5) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, 256); x.stroke(); x.beginPath(); x.moveTo(0, i); x.lineTo(256, i); x.stroke(); } x.fillStyle = col; x.font = `900 92px ${FONT}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(`${kg}`, 128, 110); x.font = `900 56px ${FONT}`; x.fillText('kg', 128, 190); });
    const geo = new THREE.BoxGeometry(0.34, 0.24, 0.26, 8, 6, 6); const pa = geo.attributes.position, q = V(0, 0, 0); for (let i = 0; i < pa.count; i++) { q.set(pa.getX(i), pa.getY(i), pa.getZ(i)); const n = q.clone().normalize(); const b = 0.35; q.lerp(n.multiplyScalar(q.length() * 0.85), b); if (q.y < -0.1) q.y = -0.1 - (q.y + 0.1) * 0.2; pa.setXYZ(i, q.x, q.y, q.z); } geo.computeVertexNormals();
    const plain = new THREE.MeshStandardMaterial({ map: T, roughness: 1 }); plain.map = T; const side = new THREE.MeshStandardMaterial({ map: tex(64, 64, (x) => { x.fillStyle = '#c9b383'; x.fillRect(0, 0, 64, 64); x.strokeStyle = 'rgba(110,90,50,0.45)'; for (let i = 0; i < 64; i += 5) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, 64); x.stroke(); x.beginPath(); x.moveTo(0, i); x.lineTo(64, i); x.stroke(); } }), roughness: 1 });
    const mesh = new THREE.Mesh(geo, [side, side, side, side, plain, side]); mesh.position.y = 0.1; mesh.castShadow = true; sg.add(mesh); const s2 = Math.cbrt(kg / 30); sg.scale.setScalar(s2); sg.kg = kg; return sg; };
  const sL = sack(30, '#8a1f1f'), s20 = sack(20, '#1f4f8a'), s10 = sack(10, '#2a6a2a'); beam.add(sL); beam.add(s20); beam.add(s10); s10.visible = false;
  const rd = liveSign(0.12, 5.2); rd.position.set(0, 1.42, PZ - 0.35); g.add(rd);
  animator(it); it.th = 0; it.w = 0; it.k = 0; it.mR = 20; it.dL = 1.0; it.dR = 0.6; it.sR = s20; it.bal = 0; it.tried = 0;
  const TMAX = Math.asin((PH + 0.02) / LH);
  const place = () => { sL.position.set(-it.dL, 0.035, 0); it.sR.position.set(it.dR, 0.035, 0); };
  it.moments = () => [30 * it.dL, it.mR * it.dR];
  it.setK = (k) => { it.k = clamp01(k); it.dR = 0.35 + (LH - 0.15 - 0.35) * it.k; place(); if (it.onK) it.onK(it.k); };
  it.swap10 = () => { s20.visible = false; s10.visible = true; it.sR = s10; it.mR = 10; it.k = 0; it.setK(0); };
  it.moveLeft = (d) => { it.dL = d; place(); };
  const u0 = it.update; it.update = (dt) => { if (u0) u0(dt); dt = Math.min(dt || 0.016, 0.05);
    const [mL, mR] = it.moments(), net = mR - mL, I = 30 * it.dL * it.dL + it.mR * it.dR * it.dR + 21.6; // kg m and kg m²
    if (Math.abs(net) < 0.45) { it.w *= 0.85; it.th += (0 - it.th) * Math.min(1, dt * 1.6); it.bal += dt; } // balanced: it is steadied level and stays there
    else { it.bal = 0; it.w += (9.8 * net * Math.cos(it.th) / I - 0.8 * it.w) * dt; it.th += it.w * dt; } // the heavier moment turns it (θ > 0: the right side goes down)
    if (it.th > TMAX) { it.th = TMAX; it.w = -it.w * 0.15; } if (it.th < -TMAX) { it.th = -TMAX; it.w = -it.w * 0.15; }
    beam.rotation.z = -it.th;
    const st = Math.abs(net) < 0.45 ? w_('balanced: it rests level') : net > 0 ? w_('the right side goes down') : w_('the left side goes down');
    rd.set([`30 kg × ${it.dL.toFixed(2)} m = ${mL.toFixed(1)} kg m   ·   ${it.mR} kg × ${it.dR.toFixed(2)} m = ${mR.toFixed(1)} kg m`, st], ['#ffffff', Math.abs(net) < 0.45 ? OKC : YEL]); };
  it.say = (l, c) => rd.set(l, c);
  place(); it.setK(0.2);
  it.knobPath = floorKnob; it.leverPath = floorLever;
  it.camView = { p: V(0.3, 1.75, 1.2), t: V(0, 0.6, -2.4) };
  mergeStatic(g); mergeStatic(beam);
  return done1(it, { height: 1.2, radius: 2 });
}
export function bindSeesawHands(ss, knob, lever, app, s = { balance: 1, swap: 3 }, done = {}) {
  const sync = slideKnob(knob, { path: () => ss.knobPath(), active: () => stepNow(app, s.balance) || (stepNow(app, s.swap) && ss.mR === 10), keepVisible: () => app.runner.i === s.balance || app.runner.i === s.swap, k: () => ss.k, set: (k) => ss.setK(k) });
  const s0 = ss.setK; ss.setK = (k) => { s0(k); sync(); };
  pushKnob(lever, { path: () => ss.leverPath(), active: () => stepNow(app, s.swap) && ss.mR !== 10, keepVisible: () => stepNow(app, s.swap) && ss.mR !== 10, press: () => ss.swap10() });
  const u0 = ss.update; ss.update = (dt) => { u0(dt); if (stepNow(app, s.balance) && ss.bal > 1.0 && Math.abs(ss.th) < 0.03 && !knob.held) done.balance && done.balance();
    if (stepNow(app, s.swap) && ss.mR === 10 && ss.k > 0.97 && Math.abs(ss.th) > 0.25 && !knob.held) done.swap && done.swap(); };
}

// ------------------------------------------------------------------ Class 10 Ch 10 The Human Eye and the Colourful World: a rainbow in a sprinkler
// The playground at midday: the Sun is high behind you (50° up), far too high for a rainbow in the sky. A garden sprinkler on
// the grass is joined by a hose to a tap. Open the tap: every drop is coloured by where it is seen from — a drop sends you
// red light when the line from your eye to it makes 42.3° with the line to your head's shadow, violet at 40.7° (light
// refracted, reflected once inside the drop and refracted out; water bends violet more). So the bow is an arc of a circle
// round the shadow of your head, below your eyes. Pull the sprinkler to your side and the bow is gone: it is always
// opposite the Sun.
export function sprinklerRainbow(o = {}) {
  const it = new Item('prainbow10', { ...o, name: { en: 'Garden sprinkler, hose and tap', hi: 'स्प्रिंकलर, पाइप और नल', hg: 'Sprinkler, pipe aur nal' } });
  const g = it.g, w_ = o.W || ((k) => k), place = PLACES[o.place || 'field'], R0 = 3.4;
  const sd = V(...place.sun).normalize().applyAxisAngle(V(0, 1, 0), place.yaw || 0); const anti = sd.clone().negate();
  const spr = new THREE.Group(); g.add(spr); model('models/phys3/garden_sprinkler_01.glb', spr, { l: 0.32, pin: [0.5, 0, 0.5] });
  const arm = new THREE.Group(); arm.position.y = 0.2; spr.add(arm); // where the water leaves (the model's own arms do not turn; the jets do)
  // the tap on a standpipe and the green hose lying on the grass
  const TP = V(2.6, 0, -0.6); g.add(rod(TP.clone(), TP.clone().add(V(0, 0.75, 0)), 0.025, M(0x8a9097, 0.4, 0.7))); const tapB = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.06, 14), M(0xb08d3c, 0.3, 0.9)); tapB.position.copy(TP).add(V(0, 0.75, 0)); g.add(tapB);
  const knobT = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.012, 8), M(0xc0392b, 0.5)); knobT.position.copy(TP).add(V(0, 0.8, 0)); g.add(knobT);
  const hoseM = new THREE.MeshStandardMaterial({ color: 0x1f6b3a, roughness: 0.45 }); let hose = null;
  const drawHose = () => { if (hose) { g.remove(hose); hose.geometry.dispose(); } const a = TP.clone().add(V(-0.03, 0.72, 0)), b = spr.position.clone().add(V(0.12, 0.05, 0)); const mid = a.clone().lerp(b, 0.5); const c = new THREE.CatmullRomCurve3([a, TP.clone().add(V(-0.15, 0.03, 0.1)), mid.setY(0.02).add(V(0.3, 0, 0.5)), b.clone().add(V(0.4, -0.03, 0.1)), b]); hose = new THREE.Mesh(new THREE.TubeGeometry(c, 40, 0.012, 6, false), hoseM); hose.castShadow = true; g.add(hose); };
  // the spray: drops thrown from two turning jets; their colour is worked out for each eye in the shader
  const NP = LITE ? 6000 : 14000, ph = new Float32Array(NP), sp = new Float32Array(NP * 3); const r = rnd(29);
  for (let i = 0; i < NP; i++) { ph[i] = r(); sp[i * 3] = 0.6 + r() * 0.42; sp[i * 3 + 1] = (r() - 0.5) * 0.5; sp[i * 3 + 2] = r() < 0.5 ? 0 : Math.PI; }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(NP * 3), 3)); geo.setAttribute('ph', new THREE.BufferAttribute(ph, 1)); geo.setAttribute('sp', new THREE.BufferAttribute(sp, 3));
  const U = { uT: { value: 0 }, uK: { value: 0 }, uO: { value: V(0, 0.2, 0) }, uA: { value: anti }, uPx: { value: 400 } };
  const mat = new THREE.ShaderMaterial({ uniforms: U, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false,
    vertexShader: `attribute float ph; attribute vec3 sp; uniform float uT, uK, uPx; uniform vec3 uO; varying vec3 vW; varying float vA;
      void main() { float life = 1.3; float age = mod(uT * 0.9 + ph * life, life); float te = uT - age; float phi = te * 9.0 + sp.z + sp.y * 2.0;
        vec3 dir = vec3(cos(phi), 0.0, sin(phi)); float sp0 = (2.4 + 3.4 * uK) * sp.x; vec3 vel = dir * sp0 * 0.72 + vec3(0.0, sp0 * 0.7, 0.0) + vec3(-dir.z, 0.0, dir.x) * sp.y;
        vec3 p = uO + dir * 0.16 + vel * age + vec3(0.0, -4.9 * age * age, 0.0); vA = (p.y > 0.01 ? 1.0 : 0.0) * smoothstep(0.05, 0.3, uK) * smoothstep(0.0, 0.08, age);
        vW = p; vec4 mv = viewMatrix * vec4(p, 1.0); gl_Position = projectionMatrix * mv; gl_PointSize = clamp(uPx / -mv.z, 1.5, 4.5); }`,
    fragmentShader: `uniform vec3 uA; varying vec3 vW; varying float vA;
      vec3 spec(float x) { x = clamp(x, 0.0, 1.0); return clamp(vec3(abs(x * 6.0 - 3.0) - 1.0, 2.0 - abs(x * 6.0 - 2.0), 2.0 - abs(x * 6.0 - 4.0)), 0.0, 1.0); }
      void main() { vec2 c = gl_PointCoord - 0.5; float r2 = dot(c, c); if (r2 > 0.25 || vA <= 0.0) discard; float soft = exp(-r2 * 20.0); float a = degrees(acos(clamp(dot(normalize(vW - cameraPosition), uA), -1.0, 1.0)));
        vec3 col = vec3(0.6, 0.65, 0.7) * 0.075; // a drop seen elsewhere: faint mist
        float b1 = smoothstep(40.2, 40.8, a) * (1.0 - smoothstep(42.3, 42.9, a)); if (b1 > 0.0) col = mix(col, spec(0.78 - 0.78 * (a - 40.6) / 1.8) * 0.5, b1); // primary bow: violet inside, red outside
        float b2 = smoothstep(50.2, 50.7, a) * (1.0 - smoothstep(53.3, 53.8, a)); if (b2 > 0.0) col = mix(col, spec(0.78 * (a - 50.4) / 3.1) * 0.14, b2); // the faint second bow, colours reversed
        if (a < 40.3) col += vec3(0.02); if (a > 150.0) col += vec3(0.25) * smoothstep(150.0, 175.0, a); // inside the bow is a little brighter; towards the Sun, a white glare
        gl_FragColor = vec4(col * vA * soft * smoothstep(0.8, 2.2, distance(vW, cameraPosition)), 1.0);
        #include <colorspace_fragment>
      }` });
  const spray = new THREE.Points(geo, mat); spray.frustumCulled = false; spray.renderOrder = 8; g.add(spray);
  spray.onBeforeRender = (renderer, scene, camera) => { const h = renderer.getDrawingBufferSize(new THREE.Vector2()).y; U.uPx.value = 0.02 * camera.projectionMatrix.elements[5] * h * 0.5; };
  const rd = liveSign(0.12, 5); rd.position.set(-0.6, 1.22, -2.4); g.add(rd);
  it.k = 0; it.tap = 0; it.az = 0;
  const posAt = (az) => V(Math.sin(az) * R0, 0, -Math.cos(az) * R0);
  it.inBow = () => { const eye = V(0, 1.45, 0.1), c = spr.position.clone().add(V(0, 0.7, 0)); const a = Math.acos(c.clone().sub(eye).normalize().dot(anti)) / DEG; return a; };
  it.setTap = (k) => { it.tap = clamp01(k); U.uK.value = it.tap; knobT.rotation.y = it.tap * 4; rd.set([`${w_('Tap')}: ${Math.round(it.tap * 100)} % ${w_('open')}`, it.tap > 0.5 ? w_('Look at the spray, with the Sun behind you') : ''], [YEL, '#ffffff']); if (it.onK) it.onK(it.tap); };
  it.setAz = (k) => { it.k = clamp01(k); it.az = it.k * 80 * DEG; spr.position.copy(posAt(it.az)); spr.rotation.y = -it.az; U.uO.value.copy(spr.position).add(V(0, 0.2, 0)); drawHose(); it.camView.t.copy(spr.position).add(V(-0.3, 0.6, 0));
    const off = it.az / DEG; rd.set([`${w_('Sprinkler')} ${off.toFixed(0)}° ${w_('to your right')}`, off < 25 ? w_('the rainbow is in the spray') : off > 55 ? w_('no rainbow in the spray now') : w_('only a bit of the rainbow is left')], [YEL, off < 25 ? OKC : '#ffffff']); if (it.onK) it.onK(it.k); };
  let T = 0; const u0 = it.update; it.update = (dt) => { if (u0) u0(dt); T += Math.min(dt || 0.016, 0.05); U.uT.value = T; };
  it.say = (l, c) => rd.set(l, c);
  it.camView = { p: V(0.0, 1.58, 0.2), t: V(-0.2, 0.55, -3.2) };
  spr.position.copy(posAt(0)); U.uO.value.copy(spr.position).add(V(0, 0.2, 0)); drawHose(); it.setTap(0); it.say([w_('Midday: the Sun is high behind you')], '#ffffff');
  it.knobPath = floorKnob;
  return done1(it, { height: 1.5, radius: 3.5 });
}
export function bindRainbowHands(sr, knob, app, s = { tap: 1, side: 2, back: 3 }, done = {}) {
  const sync = slideKnob(knob, { path: () => sr.knobPath(), active: () => [s.tap, s.side, s.back].some((i) => stepNow(app, i)), keepVisible: () => [s.tap, s.side, s.back].includes(app.runner.i), k: () => (stepNow(app, s.tap) ? sr.tap : sr.k),
    set: (k) => { if (stepNow(app, s.tap)) { if (k > sr.tap) sr.setTap(k > 0.97 ? 1 : k); if (sr.tap >= 0.97 && done.tap) done.tap(); } else { sr.setAz(k); if (stepNow(app, s.side) && sr.k > 0.95 && done.side) done.side(); if (stepNow(app, s.back) && sr.k < 0.05 && done.back) done.back(); } } });
  ['setTap', 'setAz'].forEach((f) => { const f0 = sr[f]; sr[f] = (k) => { f0(k); sync(); }; });
}

// glass that uses transmission is drawn as plain see-through glass (one render pass, as everywhere else in the lab)
const plainGlass = (root) => root.traverse((o) => { if (!o.isMesh) return; for (const m of [].concat(o.material)) if (m && (m.transmission > 0 || /glass/i.test(m.name))) { m.transmission = 0; m.transparent = true; m.opacity = 0.28; m.roughness = 0.05; m.metalness = 0; m.depthWrite = false; m.map = null; if (m.color) m.color.setHex(0xf2f6f8); } });
// a round panel meter (0 … max) with a needle: set(v)
function panelMeter(max, unit, step) {
  const g = new THREE.Group(); const T = tex(256, 256, (x) => { x.fillStyle = '#f6f4ec'; x.fillRect(0, 0, 256, 256); x.strokeStyle = '#1d2733'; x.fillStyle = '#1d2733'; x.textAlign = 'center'; x.textBaseline = 'middle';
    for (let v = 0; v <= max + 1e-6; v += step / 5) { const a = (-50 + v / max * 100) * DEG, big = Math.abs(v / step - Math.round(v / step)) < 1e-6; x.lineWidth = big ? 3 : 1.5; x.beginPath(); x.moveTo(128 + Math.sin(a) * (big ? 150 : 158), 220 - Math.cos(a) * (big ? 150 : 158)); x.lineTo(128 + Math.sin(a) * 170, 220 - Math.cos(a) * 170); x.stroke(); if (big) { x.font = `800 22px ${FONT}`; x.fillText(String(Math.round(v)), 128 + Math.sin(a) * 128, 222 - Math.cos(a) * 128); } }
    x.font = `900 40px ${FONT}`; x.fillText(unit, 128, 150); });
  box(g, M(0x2b2f35, 0.5, 0.3), 0.11, 0.11, 0.03, 0, 0, 0.015); const face = new THREE.Mesh(new THREE.PlaneGeometry(0.095, 0.095), new THREE.MeshBasicMaterial({ map: T, toneMapped: false })); face.position.z = 0.0305; g.add(face);
  const nd = new THREE.Group(); nd.position.set(0, -0.0365, 0.032); g.add(nd); const nm = new THREE.Mesh(new THREE.BoxGeometry(0.0015, 0.066, 0.001), new THREE.MeshBasicMaterial({ color: 0xc0251c })); nm.position.y = 0.033; nd.add(nm);
  g.v = 0; g.set = (v) => { g.v = v; nd.rotation.z = -(-50 + clamp01(v / max) * 100) * DEG; }; g.set(0); return g;
}

// ------------------------------------------------------------------ Class 10 Ch 11 Electricity: the wiring of a room, bulbs in parallel
// A house-wiring board stands on the classroom table, fed from the 230 V mains through a 10 A MCB and an ammeter. Three bulbs
// (100 W, 60 W, 40 W) each have their own switch between the live (red) and neutral (black) wires: they are in parallel.
// Each bulb gets the full 230 V and draws its own current (I = P ÷ V); the ammeter shows the total. Plug in a 2000 W heater
// and then a 1000 W iron: the total passes 10 A and the MCB trips, cutting off everything.
export function wiringBoard(o = {}) {
  const it = new Item('pwiring10', { ...o, name: { en: 'House-wiring board', hi: 'घर की वायरिंग का बोर्ड', hg: 'Ghar ki wiring ka board' } });
  const g = it.g, w_ = o.W || ((k) => k), V0 = 230, BZ = -0.98, BY = BENCH_Y;
  const bd = new THREE.Group(); bd.position.set(0, BY, BZ); bd.rotation.x = -0.12; g.add(bd);
  box(bd, new THREE.MeshStandardMaterial({ map: woodP('#a87b4f', [1, 1]), roughness: 0.65 }), 0.96, 0.64, 0.018, 0, 0.33, 0); for (const x of [-0.4, 0.4]) { const f = box(bd, new THREE.MeshStandardMaterial({ map: woodP('#6b4226'), roughness: 0.6 }), 0.035, 0.22, 0.2, x, 0.11, -0.12); f.rotation.x = 0.12; }
  const F = 0.0095; const wireM = { L: M(0xc0251c, 0.45), N: M(0x1b1b1b, 0.5) }; const wire = (pts, k) => { const c = new THREE.CatmullRomCurve3(pts.map((p) => V(p[0], p[1], F + 0.003)), false, 'catmullrom', 0.01); const m = new THREE.Mesh(new THREE.TubeGeometry(c, Math.max(4, pts.length * 6), 0.0028, 6, false), wireM[k]); bd.add(m); return m; };
  const lab = (t, x, y, s = 0.022) => { const T = tex(256, 64, (c) => { c.clearRect(0, 0, 256, 64); c.fillStyle = '#1d2733'; c.font = `800 40px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(t, 128, 34); }); const m = new THREE.Mesh(new THREE.PlaneGeometry(s * 4, s), new THREE.MeshBasicMaterial({ map: T, transparent: true, toneMapped: false })); m.position.set(x, y, F + 0.001); bd.add(m); return m; };
  // MCB, ammeter, the live and neutral wires, and the mains cable coming in
  const mcb = new THREE.Group(); mcb.position.set(-0.36, 0.5, F); bd.add(mcb); box(mcb, M(0xf2f2ee, 0.5), 0.05, 0.09, 0.05, 0, 0, 0.025); const lever = box(mcb, M(0x1f5fa8, 0.4), 0.018, 0.024, 0.02, 0, 0.012, 0.055); lab('MCB 10 A', -0.36, 0.43, 0.016);
  const am = panelMeter(15, 'A', 5); am.position.set(-0.17, 0.5, F); bd.add(am); lab(w_('ammeter'), -0.17, 0.425, 0.016);
  wire([[-0.47, 0.5], [-0.39, 0.5]], 'L'); wire([[-0.33, 0.5], [-0.225, 0.5]], 'L'); wire([[-0.115, 0.5], [-0.06, 0.5], [-0.05, 0.4], [0.42, 0.4]], 'L'); wire([[-0.47, 0.06], [0.42, 0.06]], 'N');
  const cab = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V(-0.47, 0.5, F), V(-0.53, 0.45, 0.02), V(-0.6, 0.2, 0.08), V(-0.65, 0.0, 0.15)]), 20, 0.005, 6), M(0xe8e8e2, 0.6)); bd.add(cab);
  lab(w_('live'), 0.36, 0.42, 0.016); lab(w_('neutral'), 0.36, 0.035, 0.016);
  // three bulbs, each with its own switch
  const loads = [{ P: 100, x: -0.24 }, { P: 60, x: -0.04 }, { P: 40, x: 0.16 }].map((L, i) => { const holder = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.034, 0.03, 20), M(0xf2f2ee, 0.5)); holder.rotation.x = Math.PI / 2; holder.position.set(L.x, 0.2, F + 0.015); bd.add(holder);
    const bulbG = new THREE.Group(); bulbG.position.set(L.x, 0.2, F + 0.03); bd.add(bulbG); model('models/lightbulb_01.glb', bulbG, { l: 0.105, rot: [Math.PI / 2, 0, 0], pin: [0.5, 0.5, 0], at: [0, 0, 0], shadow: false, done: (w) => plainGlass(w) });
    const glowM = new THREE.MeshBasicMaterial({ color: 0x3a3226, toneMapped: false }); const fil = new THREE.Mesh(new THREE.SphereGeometry(0.014, 12, 10), glowM); fil.position.set(0, 0, 0.065); bulbG.add(fil);
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: puffTex(), color: 0xffe2a0, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false })); halo.position.set(0, 0, 0.065); halo.scale.setScalar(0.2); bulbG.add(halo);
    wire([[L.x, 0.4], [L.x, 0.33]], 'L'); wire([[L.x, 0.27], [L.x, 0.235]], 'L'); wire([[L.x + 0.012, 0.17], [L.x + 0.012, 0.06]], 'N'); lab(`${L.P} W`, L.x, 0.135, 0.02);
    const cur = tag('', '#ffd23f', 0.035); cur.position.set(L.x + 0.075, BY + 0.27, BZ + 0.08); cur.visible = false; g.add(cur);
    return { ...L, I: L.P / V0, on: false, fil, glowM, halo, cur, i }; });
  // two sockets for appliances (a heater and an iron on the table)
  const sock = (y) => { const s2 = new THREE.Group(); s2.position.set(0.36, y, F); bd.add(s2); box(s2, M(0xf2f2ee, 0.5), 0.08, 0.08, 0.012, 0, 0, 0.006); for (const [dx, dy, r] of [[0, 0.018, 0.006], [-0.016, -0.012, 0.004], [0.016, -0.012, 0.004]]) { const h = new THREE.Mesh(new THREE.CircleGeometry(r, 10), M(0x222222, 0.7)); h.position.set(dx, dy, 0.0125); s2.add(h); } return s2; };
  const sk = [sock(0.27), sock(0.15)]; wire([[0.36, 0.4], [0.36, 0.31]], 'L'); wire([[0.395, 0.27], [0.395, 0.06]], 'N');
  const heater = new THREE.Group(); heater.position.set(0.78, BY, -0.66); heater.rotation.y = -0.5; g.add(heater); box(heater, M(0x9aa1a8, 0.35, 0.8), 0.32, 0.03, 0.14, 0, 0.015, 0); box(heater, M(0xc9ced2, 0.25, 0.9), 0.3, 0.2, 0.012, 0, 0.13, -0.06);
  const rodM = new THREE.MeshBasicMaterial({ color: 0x5a4a3a, toneMapped: false }); for (const y of [0.09, 0.16]) { const r2 = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.26, 10), rodM); r2.rotation.z = Math.PI / 2; r2.position.set(0, y, -0.035); heater.add(r2); } for (let i = 0; i < 7; i++) heater.add(rod(V(-0.13 + i * 0.043, 0.04, 0.0), V(-0.13 + i * 0.043, 0.22, -0.02), 0.002, M(0xc9ced2, 0.3, 0.9), 4));
  const iron = new THREE.Group(); iron.position.set(0.55, BY, -0.5); iron.rotation.y = 0.4; g.add(iron); const sole = new THREE.Shape(); sole.moveTo(-0.1, -0.05); sole.lineTo(0.06, -0.05); sole.quadraticCurveTo(0.12, 0, 0.06, 0.05); sole.lineTo(-0.1, 0.05); sole.closePath();
  const sg = new THREE.ExtrudeGeometry(sole, { depth: 0.012, bevelEnabled: false }); sg.rotateX(-Math.PI / 2); const so = new THREE.Mesh(sg, M(0xd6dade, 0.25, 0.9)); iron.add(so); const top = new THREE.Mesh(new THREE.ExtrudeGeometry(sole, { depth: 0.035, bevelEnabled: true, bevelSize: 0.008, bevelThickness: 0.008 }).rotateX(-Math.PI / 2), M(0x2a6fd1, 0.4)); top.scale.set(0.92, 1, 0.9); top.position.y = 0.014; iron.add(top);
  iron.add(rod(V(-0.08, 0.06, 0), V(0.0, 0.1, 0), 0.012, M(0x1d1f22, 0.5))); iron.add(rod(V(0.0, 0.1, 0), V(0.04, 0.06, 0), 0.012, M(0x1d1f22, 0.5)));
  const cord = (from, to) => { const m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([from, from.clone().add(V(0, -0.02, 0.05)), to.clone().lerp(from, 0.5).setY(BY + 0.005), to.clone().add(V(0, -0.05, 0.05)), to]), 30, 0.004, 6), M(0x1d1f22, 0.6)); m.visible = false; g.add(m); return m; };
  bd.updateMatrixWorld(true); const skW = sk.map((s2) => s2.localToWorld(V(0, 0, 0.02))); const cH = cord(heater.localToWorld(V(0.16, 0.03, 0)), skW[0]), cI = cord(iron.localToWorld(V(-0.1, 0.05, 0)), skW[1]);
  const app = { heater: { P: 2000, on: false, cord: cH }, iron: { P: 1000, on: false, cord: cI } };
  const rd = liveSign(0.085, 5.4); rd.position.set(0.0, BY + 0.74, BZ - 0.08); g.add(rd);
  it.tripped = false; it.loads = loads; it.app = app; it.I = 0; let tripT = 0, needle = 0;
  const total = () => it.tripped ? 0 : loads.reduce((a, L) => a + (L.on ? L.I : 0), 0) + (app.heater.on ? app.heater.P / V0 : 0) + (app.iron.on ? app.iron.P / V0 : 0);
  const show = () => { const I = total(); it.I = I; const on = loads.filter((L) => L.on).length;
    loads.forEach((L) => { const lit = L.on && !it.tripped, b = L.P / 100; L.glowM.color.setHex(lit ? 0xfff2c8 : 0x3a3226); L.halo.material.opacity = lit ? 0.35 + 0.5 * b : 0; L.halo.scale.setScalar(lit ? 0.12 + 0.12 * b : 0.1); L.cur.visible = lit; if (lit) L.cur.setText(`${L.I.toFixed(2)} A`); });
    rodM.color.setHex(app.heater.on && !it.tripped ? 0xff6a1a : 0x5a4a3a); lever.position.y = it.tripped ? -0.012 : 0.012;
    if (it.tripped) rd.set([w_('The MCB has tripped: everything is off'), `${w_('the current went above')} 10 A`], [RED, '#ffffff']);
    else rd.set([`230 V · ${on} ${w_(on === 1 ? 'bulb on' : 'bulbs on')}${app.heater.on ? ` + ${w_('heater')}` : ''}${app.iron.on ? ` + ${w_('iron')}` : ''}`, `${w_('total current')} = ${I.toFixed(2)} A`], ['#ffffff', I > 10 ? RED : I > 0 ? YEL : '#ffffff']); };
  it.toggle = (i) => { if (it.tripped) return; loads[i].on = !loads[i].on; show(); if (it.onChange) it.onChange(); };
  it.plug = (k) => { if (it.tripped || app[k].on) return false; app[k].on = true; app[k].cord.visible = true; show(); if (it.onChange) it.onChange(); return true; };
  const u0 = it.update; it.update = (dt) => { if (u0) u0(dt); dt = Math.min(dt || 0.016, 0.05); const I = total(); needle += (I - needle) * Math.min(1, dt * 4); am.set(needle);
    if (!it.tripped && I > 10) { tripT += dt; if (tripT > 2.5) { it.tripped = true; show(); if (it.onTrip) it.onTrip(); } } else tripT = 0; };
  it.say = (l, c) => rd.set(l, c);
  show();
  it.leverPath = tableLever;
  it.switchAt = (i) => { bd.updateMatrixWorld(true); return bd.localToWorld(V(loads[i].x, 0.3, F + 0.02)); };
  it.camView = { p: V(0.2, 1.62, 0.75), t: V(0.05, 1.26, -0.95) };
  mergeStatic(bd); mergeStatic(heater, [rodM]); mergeStatic(iron);
  return done1(it, { height: 0.7, radius: 0.6 });
}
// a wall switch the student presses (an item of its own, so it can be clicked or pressed with a hand)
export function wallSwitch(o = {}) {
  const it = new Item('pswitch', { ...o, name: { en: 'Switch', hi: 'स्विच', hg: 'Switch' } });
  box(it.g, M(0xf4f4f0, 0.45), 0.045, 0.06, 0.012, 0, 0, 0); const rk = box(it.g, M(0xe8e8e2, 0.4), 0.022, 0.036, 0.01, 0, 0, 0.011); it.rocker = rk;
  const pulse = new THREE.Mesh(new THREE.TorusGeometry(0.036, 0.0025, 8, 32), new THREE.MeshBasicMaterial({ color: 0xffd23f, transparent: true, opacity: 0.85, toneMapped: false })); pulse.userData.noHit = true; it.g.add(pulse); it.pulse = pulse;
  it.set = (on) => { rk.rotation.x = on ? 0.3 : -0.3; }; it.set(false);
  it.height = 0.06; it.radius = 0.03; it.grabY = 0; it.base = 0; return it;
}
export function bindWiringHands(wb, switches, lever, app, s = { on: 1, off: 2, heater: 3, iron: 4 }, done = {}) {
  switches.forEach((sw, i) => { const p = wb.switchAt(i); sw.g.position.copy(p); sw.g.rotation.x = -0.12;
    pushKnob(sw, { path: () => [p.clone(), p.clone().add(V(0, 0, -0.004))], active: () => (stepNow(app, s.on) || stepNow(app, s.off)) && !wb.tripped, keepVisible: () => true, press: () => { wb.toggle(i); sw.set(wb.loads[i].on); } }); sw.set(false); });
  wb.onChange = () => { const n = wb.loads.filter((L) => L.on).length; if (stepNow(app, s.on) && n === 3) done.on && done.on(); if (stepNow(app, s.off) && n === 2) done.off && done.off(); if (stepNow(app, s.heater) && wb.app.heater.on) done.heater && done.heater(); };
  wb.onTrip = () => { switches.forEach((sw) => { sw.pulse.visible = false; }); if (stepNow(app, s.iron)) done.iron && done.iron(); };
  pushKnob(lever, { path: () => wb.leverPath(), active: () => (stepNow(app, s.heater) && !wb.app.heater.on) || (stepNow(app, s.iron) && !wb.app.iron.on), keepVisible: () => app.runner.i === s.heater || app.runner.i === s.iron, press: () => { if (stepNow(app, s.heater)) wb.plug('heater'); else wb.plug('iron'); } });
  wb.press = (i) => { wb.toggle(i); switches[i].set(wb.loads[i].on); };
}

// ------------------------------------------------------------------ Class 9 Ch 4 Describing Motion Around Us: timing a ball dropped from the school building
// A friend on the roof of the two-storey school block holds a cricket ball out over the parapet, 7.5 m above the courtyard
// (a tape hangs down the wall to show it). Push the lever: the ball is let go and your stopwatch starts; push it again the
// moment the ball hits the ground. Your own time (with your reaction time in it) gives your value of g = 2h ÷ t².
// Then from the first-floor window, 3.75 m; then a flat sheet of paper and a crumpled one let go together.
export function freeFall(o = {}) {
  const it = new Item('pfall9', { ...o, name: { en: 'School building, cricket ball and stopwatch', hi: 'स्कूल की इमारत, क्रिकेट गेंद और स्टॉपवॉच', hg: 'School building, cricket ball aur stopwatch' } });
  const g = it.g, w_ = o.W || ((k) => k), ZF = -6.2, BW = 11, H1 = 3.5, H2 = 6.9, HP = 7.7, BX = 0.0, BZ = ZF + 0.55;
  // the building: painted plaster with maroon bands, windows with grills, a parapet on the roof
  const wallM = new THREE.MeshStandardMaterial({ map: plasterT([4, 3]), color: 0xeedcb0, roughness: 0.9 }), bandM = M(0x8a2b2b, 0.8), glassM = new THREE.MeshStandardMaterial({ color: 0x2b3640, roughness: 0.15, metalness: 0.4 }), grillM = M(0x3a3f45, 0.5, 0.6);
  const front = new THREE.Mesh(new THREE.BoxGeometry(BW, HP, 0.3), wallM); front.position.set(0, HP / 2, ZF - 0.15); front.castShadow = true; front.receiveShadow = true; g.add(front);
  box(g, wallM, BW, HP, 6, 0, HP / 2, ZF - 3.3).visible = true;
  for (const y of [0.45, H1, H2]) box(g, bandM, BW + 0.04, 0.22, 0.34, 0, y, ZF - 0.13); box(g, M(0xb9b3a8, 0.9), BW + 0.1, 0.08, 0.4, 0, HP + 0.04, ZF - 0.12);
  for (const fy of [1.1, H1 + 0.9]) for (const x of [-4.2, -2.4, 2.4, 4.2]) { box(g, glassM, 1.1, 1.3, 0.02, x, fy + 0.65, ZF + 0.005); box(g, M(0x6e4a2a, 0.6), 1.2, 0.08, 0.12, x, fy - 0.02, ZF + 0.04); for (let i = 0; i < 6; i++) box(g, grillM, 0.012, 1.3, 0.012, x - 0.45 + i * 0.18, fy + 0.65, ZF + 0.03); }
  box(g, new THREE.MeshStandardMaterial({ map: woodP('#5a3a22', [1, 2]), roughness: 0.6 }), 1.2, 2.3, 0.05, 0, 1.15 + 0.45, ZF + 0.01); box(g, M(0xb9b3a8, 0.9), 3, 0.45, 1.2, 0, 0.225, ZF + 0.6);
  // the first-floor window your friend leans from (open), above the door
  box(g, M(0x1a1d22, 0.9), 1.0, 1.1, 0.02, 0, H1 + 1.3, ZF + 0.006);
  // a cloth tape hanging from the parapet to the ground, numbered every metre
  const tT = tapeTex(7.5, { ppm: 300, bg: '#f4f1e6' }); const tp = new THREE.Mesh(new THREE.PlaneGeometry(7.5, 0.04), new THREE.MeshStandardMaterial({ map: tT, roughness: 0.8 })); tp.rotation.z = -Math.PI / 2; tp.position.set(0.75, 7.5 / 2, ZF + 0.02); g.add(tp);
  const hT = tag('h = 7.5 m', '#ffd23f', 0.28), hT2 = tag('h = 3.75 m', '#ffd23f', 0.28); hT.position.set(1.4, 7.6, ZF + 0.3); hT2.position.set(1.4, 3.85, ZF + 0.3); hT2.visible = false; g.add(hT); g.add(hT2);
  // your friend's hand holding the ball out
  const hand = gloveHand('right'); g.add(hand); hand.ready.then((hh) => { if (!hh) return; orientHand(hh, 'right', V(0, 0, 1), V(-1, 0, 0), V(0, 1, 0)); hh.updateMatrixWorld(true); const c = jpos(hh, 'middle-finger-metacarpal').applyQuaternion(hh.model.quaternion); hh.model.position.set(-c.x, -c.y - 0.012, -c.z); });
  const ball = cricketBall(); g.add(ball);
  // paper: a flat A4 sheet and a crumpled ball of paper
  const papT = tex(128, 128, (x) => { x.fillStyle = '#f7f6f0'; x.fillRect(0, 0, 128, 128); x.strokeStyle = 'rgba(80,110,170,0.35)'; for (let y = 16; y < 128; y += 10) { x.beginPath(); x.moveTo(0, y); x.lineTo(128, y); x.stroke(); } });
  const sheet = new THREE.Mesh(new THREE.PlaneGeometry(0.21, 0.297), new THREE.MeshStandardMaterial({ map: papT, roughness: 0.9, side: THREE.DoubleSide })); sheet.rotation.x = -Math.PI / 2; sheet.visible = false; sheet.castShadow = true; g.add(sheet);
  const crG = new THREE.IcosahedronGeometry(0.035, 2); { const pa = crG.attributes.position, rr = rnd(13); for (let i = 0; i < pa.count; i++) { const s2 = 0.8 + rr() * 0.35; pa.setXYZ(i, pa.getX(i) * s2, pa.getY(i) * s2, pa.getZ(i) * s2); } crG.computeVertexNormals(); }
  const crumple = new THREE.Mesh(crG, new THREE.MeshStandardMaterial({ map: papT, roughness: 0.95, flatShading: true })); crumple.visible = false; crumple.castShadow = true; g.add(crumple);
  // your stopwatch
  const sw = new THREE.Group(); sw.position.set(0.36, 1.1, -0.48); sw.rotation.x = -0.5; g.add(sw); box(sw, M(0x1d2229, 0.5), 0.09, 0.12, 0.022, 0, 0, 0); const lcdT = canvasTex(256, 128, () => {}); const lcd = new THREE.Mesh(new THREE.PlaneGeometry(0.072, 0.036), new THREE.MeshBasicMaterial({ map: lcdT, toneMapped: false })); lcd.position.set(0, 0.018, 0.0112); sw.add(lcd);
  const btn = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.012, 14), M(0xc0392b, 0.5)); btn.position.set(0, 0.066, 0); sw.add(btn);
  let lastS = -1; const showT = (t) => { const c = Math.round(t * 100); if (c === lastS) return; lastS = c; const x = lcdT.image.getContext('2d'); x.fillStyle = '#9cb08a'; x.fillRect(0, 0, 256, 128); x.fillStyle = '#111'; x.font = '800 78px monospace'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText((c / 100).toFixed(2), 128, 70); lcdT.needsUpdate = true; };
  const rd = liveSign(0.42, 5.4); rd.position.set(-2.4, 4.7, -4.6); g.add(rd);
  // where the ball was every 0.1 s (like a photo taken with a flashing light): the gaps grow as it speeds up
  const ghostM = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.45, depthWrite: false }); const ghosts = []; for (let i = 0; i < 16; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 8), ghostM); m.visible = false; g.add(m); ghosts.push(m); } let nGhost = 0;
  it.h = 7.5; it.state = 'ready'; it.t = 0; it.runs = []; it.paper = 'none'; let T = 0, t0 = 0, landT = 0, by = 0, bv = 0;
  const holdAt = (h) => { hand.position.set(BX, h + 0.02, BZ - 0.18); ball.position.set(BX, h + 0.055, BZ); ball.visible = true; hand.rotation.z = 0; hand.visible = true; };
  it.setH = (h) => { it.h = h; it.state = 'ready'; holdAt(h); hT.visible = h > 5; hT2.visible = h < 5; showT(0); };
  it.press = () => { // the lever: let go and start the watch, then stop it
    if (it.state === 'ready') { it.state = 'falling'; t0 = T; by = it.h + 0.055; bv = 0; landT = 0; it.t = 0; ghosts.forEach((m) => { m.visible = false; }); nGhost = 0; return 'drop'; }
    if (it.state === 'falling' || it.state === 'landed') { const t = T - t0; it.t = t; it.state = 'stopped'; showT(t); const tTrue = Math.sqrt(2 * it.h / 9.8), gm = 2 * it.h / (t * t); it.runs.push({ h: it.h, t, tTrue, g: gm });
      const dlt = t - tTrue; rd.set([`h = ${it.h} m · ${w_('your time')} ${t.toFixed(2)} s → g = 2h ÷ t² = ${gm.toFixed(1)} m/s²`, `${w_('true fall time')} ${tTrue.toFixed(2)} s · ${Math.abs(dlt) < 0.03 ? w_('right on time!') : dlt > 0 ? `${w_('you stopped')} ${dlt.toFixed(2)} s ${w_('late')}` : `${w_('you stopped')} ${(-dlt).toFixed(2)} s ${w_('early')}`}`], [OKC, Math.abs(dlt) < 0.06 ? OKC : YEL]); if (it.onStop) it.onStop(it.runs[it.runs.length - 1]); return 'stop'; }
    return null; };
  it.dropPaper = () => { if (it.paper !== 'none') return false; it.paper = 'falling'; hand.visible = false; ball.visible = false; sheet.visible = true; crumple.visible = true; it.pT = 0; sheet.position.set(BX - 0.25, H1 + 1.0, BZ); crumple.position.set(BX + 0.25, H1 + 1.0, BZ); it.cv = 0; return true; };
  const u0 = it.update; it.update = (dt) => { if (u0) u0(dt); dt = Math.min(dt || 0.016, 0.05); T += dt;
    if (it.state === 'falling' || it.state === 'landed') { const t = T - t0; showT(t); hand.rotation.z = Math.min(0.9, t * 6);
      if (it.state === 'falling') { bv -= 9.8 * dt; by += bv * dt; if (t >= nGhost * 0.1 && nGhost < ghosts.length) { ghosts[nGhost].position.set(BX, Math.max(0.05, by), BZ); ghosts[nGhost].visible = true; nGhost++; } if (by <= 0.036) { by = 0.036; it.state = 'landed'; landT = T; bv = -bv * 0.25; if (o.app && o.app.audio) o.app.audio.tone(140, 0.12, 0.25, 'sine', 70); } ball.position.y = by; }
      else { if (T - landT > 4 && it.state === 'landed') rd.set([w_('Push the lever to stop the watch!')], RED); } }
    if (it.state === 'stopped' && ball.position.y > 0.037) { bv -= 9.8 * dt; ball.position.y = Math.max(0.036, ball.position.y + bv * dt); }
    if (it.paper === 'falling') { it.pT += dt; it.cv = Math.min(it.cv + 9.8 * dt, 14); crumple.position.y = Math.max(0.03, crumple.position.y - it.cv * dt * (1 - it.cv / 30)); crumple.rotation.x += dt * 3;
      if (sheet.position.y > 0.004) { const ph = it.pT * 2.6; sheet.position.y = Math.max(0.003, sheet.position.y - (0.55 + 0.35 * Math.abs(Math.sin(ph))) * dt); sheet.position.x = BX - 0.25 + Math.sin(ph) * 0.35; sheet.rotation.set(-Math.PI / 2 + Math.cos(ph) * 0.35, 0, Math.sin(ph) * 0.4); }
      else { sheet.rotation.set(-Math.PI / 2, 0, 0.3); it.paper = 'down'; rd.set([`${w_('crumpled paper')}: ${w_('about')} 0.9 s · ${w_('flat sheet')}: ${it.pT.toFixed(1)} s`], OKC); if (it.onPaper) it.onPaper(); }
      if (crumple.position.y <= 0.031 && !it._crDone) { it._crDone = 1; rd.set([`${w_('crumpled paper')}: ${it.pT.toFixed(2)} s · ${w_('the flat sheet is still falling')}`], YEL); } } };
  it.say = (l, c) => rd.set(l, c);
  it.setH(7.5); it.say([w_('A friend holds the ball over the parapet: 7.5 m up')], '#ffffff');
  it.leverPath = floorLever;
  it.camView = { p: V(2.2, 1.6, 6.0), t: V(0, 3.8, -6) };
  mergeStatic(g, [ball, crumple, sheet]); mergeStatic(sw);
  return done1(it, { height: 8, radius: 6 });
}
export function bindFallHands(ff, lever, app, s = { high: 1, low: 2, paper: 3 }, done = {}) {
  ff.onStop = () => { if (stepNow(app, s.high) && ff.h > 5) done.high && done.high(); else if (stepNow(app, s.low) && ff.h < 5) done.low && done.low(); };
  ff.onPaper = () => { if (stepNow(app, s.paper)) done.paper && done.paper(); };
  const u0 = ff.update; ff.update = (dt) => { u0(dt); if (stepNow(app, s.low) && ff.h > 5) ff.setH(3.75); }; // the friend goes down to the first-floor window
  pushKnob(lever, { path: () => ff.leverPath(), active: () => (stepNow(app, s.high) || stepNow(app, s.low)) && ff.state !== 'stopped' || (stepNow(app, s.paper) && ff.paper === 'none'), keepVisible: () => [s.high, s.low, s.paper].includes(app.runner.i),
    press: () => { if (stepNow(app, s.paper)) ff.dropPaper(); else { if (stepNow(app, s.low) && ff.h > 5) ff.setH(3.75); ff.press(); } } });
}
