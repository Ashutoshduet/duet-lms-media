// DUET Science Lab 360, physics batch PW-SX: the human eye and its defects (Class 10), and inertia (Class 9): a coin on a card
// on a glass and a stack of carrom coins at the bench, and a bus that starts and brakes on a village road.
//  - The eye is the "reduced eye" of optics books: one lens L = 23 mm in front of the retina (5 times larger in the model),
//    43.5 D when relaxed, up to 4 D more when the ciliary muscles squeeze it; the eye picks the power that gives the
//    sharpest image (as a real eye does); blur on the retina = pupil (3 mm) × |L − v| / v, in minutes of arc. A myopic eye
//    is 1 mm too long, a hypermetropic one 1 mm too short; spectacle lenses add their power (in contact).
//  - The coin rides on the card while the card's acceleration is under μs·g (static friction), otherwise it slides (μk·g)
//    until the card has left it, then falls 11 cm: into the glass, onto its rim or outside, from what the flick really was.
//  - In the bus, a strap swings to atan(a/g), a bottle 25 cm tall on a 7 cm base topples above 2.9 m/s², a bag slides above
//    μ·g; the bus goes 30 km/h and brakes or starts as hard as the student chose.
import * as THREE from 'three';
import { canvasTex, glassMat } from './mats.js';
import * as P from './pwsx1.js';
const { V, BY, TAU, DEG, OKC, YEL, RED, WHT, BLU, rig, box, rod, lathe, mat, steel, brass, oldBrass, copper, iron, bake, plastic, paint, glow, addGlow, wood, ticker, mergeStatic, liveSign, tag, clamp01, ease, lerp, sfx, rnd, FONT, stepNow, slideKnob, pushKnob, carry, flyT, thing, benchPath, pressPath, fitModel, canvasBoard, beamPool, gloveHand } = P;
const G = 9.8;

// ------------------------------------------------------------------ Class 10 Ch 10: defects of the eye and their correction
export const EYE = { L0: 0.023, P0: 1 / 0.023, A: 4, pupil: 0.003, far: 2.0, near: 0.25, MS: 5 };
// the image distance for an object at u (m, positive) with total power P (D); the eye picks its power in [P0, P0 + A]
export function eyeImage(L, uObj, specD) {
  const need = 1 / L + 1 / uObj - specD; const acc = clamp01((need - EYE.P0) / EYE.A) * EYE.A; const P = EYE.P0 + acc + specD; const v = 1 / (P - 1 / uObj);
  const b = EYE.pupil * Math.abs(L - v) / v; const arcmin = b / L / DEG * 60; return { acc, P, v, arcmin, sharp: Math.exp(-((arcmin / 2.5) ** 2)) };
}
const LETTERS = [['E'], ['F', 'P'], ['T', 'O', 'Z'], ['L', 'P', 'E', 'D'], ['P', 'E', 'C', 'F', 'D'], ['E', 'D', 'F', 'C', 'Z', 'P'], ['F', 'E', 'L', 'O', 'P', 'Z', 'D']];
const LINES = ['6/60', '6/36', '6/24', '6/18', '6/12', '6/9', '6/6'];
// draw the chart (or the reading card) as the eye sees it: upright or upside down, blurred by the blur in minutes of arc
function paintSight(x, w, h, kind, arcmin, flip) {
  x.save(); x.fillStyle = '#f7f6f1'; x.fillRect(0, 0, w, h); if (flip) { x.translate(w, h); x.rotate(Math.PI); }
  x.filter = `blur(${Math.min(16, arcmin * 0.9 * w / 512).toFixed(1)}px)`; x.fillStyle = '#101010'; x.textAlign = 'center'; x.textBaseline = 'middle';
  if (kind === 'far') { let y = h * 0.1; LETTERS.forEach((row, i) => { const s = [0.15, 0.1, 0.075, 0.058, 0.045, 0.036, 0.028][i] * h; x.font = `700 ${s}px Georgia, "Noto Serif", serif`; const gap = s * 1.25; row.forEach((L, j) => x.fillText(L, w / 2 + (j - (row.length - 1) / 2) * gap, y)); y += s * 1.45; }); }
  else { x.font = `600 ${h * 0.065}px ${FONT}`; x.textAlign = 'left'; ['Light enters the eye through', 'the cornea and the pupil.', 'The lens bends it to form', 'an image on the retina.', 'Read this line if you can.'].forEach((l, i) => x.fillText(l, w * 0.08, h * (0.18 + i * 0.15))); }
  x.restore(); x.filter = 'none';
}
export function modelEye(o = {}) {
  const it = rig('pwsxeye', { en: 'Model eye, eye chart and trial lenses', hi: 'आँख का मॉडल, आँखों का चार्ट और ट्रायल लेंस', hg: 'Aankh ka model, eye chart aur trial lenses' }, o); const g = it.g, W = it.W;
  const MS = EYE.MS, E = V(0.42, BY + 0.13, -0.74); it.E = E; // the centre of the model lens; the eye looks along −x
  // the eyeball cut away (top half removed): white sclera shell, the cornea, iris, the lens and the retina screen
  const scl = new THREE.Mesh(new THREE.SphereGeometry(0.075, 48, 24, 0, TAU, Math.PI / 2, Math.PI / 2), mat('sclera', () => new THREE.MeshStandardMaterial({ color: 0xf1ece4, roughness: 0.55, side: THREE.DoubleSide }))); scl.position.copy(E).add(V(0.06, 0, 0)); g.add(scl);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.002, 6, 64), mat('rimRed', () => new THREE.MeshStandardMaterial({ color: 0xb4554a, roughness: 0.6 }))); rim.rotation.x = Math.PI / 2; rim.position.copy(scl.position); g.add(rim);
  const corn = new THREE.Mesh(new THREE.SphereGeometry(0.035, 32, 16, 0, TAU, 0, 0.75), glassMat({ opacity: 0.12, edge: 0.6 })); corn.rotation.z = Math.PI / 2; corn.position.copy(E).add(V(-0.012, 0, 0)); corn.renderOrder = 6; g.add(corn);
  const iris = new THREE.Mesh(new THREE.RingGeometry(0.008, 0.03, 40), mat('iris', () => new THREE.MeshStandardMaterial({ map: canvasTex(256, 256, (x) => { const gr = x.createRadialGradient(128, 128, 20, 128, 128, 128); gr.addColorStop(0, '#2b1a0e'); gr.addColorStop(0.5, '#6b4423'); gr.addColorStop(1, '#3a2614'); x.fillStyle = gr; x.fillRect(0, 0, 256, 256); x.strokeStyle = 'rgba(200,150,90,0.35)'; for (let i = 0; i < 90; i++) { const a = i / 90 * TAU; x.beginPath(); x.moveTo(128 + Math.cos(a) * 30, 128 + Math.sin(a) * 30); x.lineTo(128 + Math.cos(a) * 120, 128 + Math.sin(a) * 120); x.stroke(); } }), roughness: 0.6, side: THREE.DoubleSide })));
  iris.rotation.y = Math.PI / 2; iris.position.copy(E).add(V(-0.004, 0, 0)); g.add(iris);
  const lensM = glassMat({ opacity: 0.32, edge: 0.85, color: 0xfff4d8 }); const lens = new THREE.Mesh(new THREE.SphereGeometry(0.022, 32, 20), lensM); lens.position.copy(E).add(V(0.008, 0, 0)); lens.renderOrder = 7; g.add(lens);
  for (const s of [-1, 1]) g.add(rod(E.clone().add(V(0.008, s * 0.022, 0)), E.clone().add(V(0.012, s * 0.05, 0)), 0.0015, mat('cil', () => new THREE.MeshStandardMaterial({ color: 0xb06a5a, roughness: 0.7 })), 6)); // ciliary muscles
  const retT = canvasTex(256, 256, () => {}); const ret = new THREE.Mesh(new THREE.CircleGeometry(0.045, 40), new THREE.MeshBasicMaterial({ map: retT, toneMapped: false })); ret.rotation.y = -Math.PI / 2; g.add(ret);
  const retRim = new THREE.Mesh(new THREE.RingGeometry(0.045, 0.049, 40), mat('ret', () => new THREE.MeshStandardMaterial({ color: 0xc0504a, roughness: 0.7, side: THREE.DoubleSide }))); retRim.rotation.y = -Math.PI / 2; g.add(retRim);
  box(g, wood('#6e4526'), 0.24, 0.016, 0.12, E.x + 0.05, BY + 0.008, E.z); g.add(rod(V(E.x + 0.05, BY + 0.016, E.z), V(E.x + 0.05, E.y - 0.075, E.z), 0.006, steel()));
  // the far chart on a stand at the far end of the bench, the near card in a holder 25 cm in front, the trial frame
  const CX = -1.1; const chT = canvasTex(512, 720, (x, w, h) => paintSight(x, w, h, 'far', 0, false)); const chart = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 0.45), new THREE.MeshStandardMaterial({ map: chT, roughness: 0.85 })); chart.rotation.y = Math.PI / 2; chart.position.set(CX, BY + 0.32, E.z); g.add(chart);
  box(g, iron(), 0.06, 0.32, 0.02, CX - 0.02, BY + 0.16, E.z); box(g, iron(), 0.14, 0.012, 0.14, CX - 0.02, BY + 0.006, E.z);
  const nearX = E.x - EYE.near; box(g, iron(), 0.07, 0.008, 0.06, nearX, BY + 0.004, E.z); g.add(rod(V(nearX, BY + 0.008, E.z), V(nearX, E.y - 0.05, E.z), 0.003, steel()));
  const ncT = canvasTex(512, 360, (x, w, h) => paintSight(x, w, h, 'near', 0, false)); const ncG = new THREE.Group(); const nc = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.085), new THREE.MeshStandardMaterial({ map: ncT, roughness: 0.9 })); nc.rotation.y = Math.PI / 2; nc.position.y = 0.0425; ncG.add(nc); ncG.traverse((m) => { m.userData.noHit = true; });
  it.card = thing({ en: 'Reading card', hi: 'पढ़ने का कार्ड', hg: 'Padhne ka card' }, ncG, { hitR: 0.05, hitY: 0.04 }); it.nearAt = V(nearX, E.y - 0.045, E.z);
  const FX = E.x - 0.06; const frame = new THREE.Group(); frame.position.set(FX, E.y, E.z); g.add(frame); const fr = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.003, 8, 40), bake()); fr.rotation.y = Math.PI / 2; frame.add(fr); g.add(rod(V(FX, BY + 0.016, E.z + 0.0), V(FX, E.y - 0.03, E.z), 0.003, steel())); box(g, iron(), 0.05, 0.006, 0.05, FX, BY + 0.003, E.z);
  // trial lenses on a tray
  const lensThing = (D) => { const gg = new THREE.Group(); const r = new THREE.Mesh(new THREE.TorusGeometry(0.027, 0.0025, 8, 40), steel()); r.rotation.x = Math.PI / 2; r.position.y = 0.004; gg.add(r);
    const gl = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, D > 0 ? 0.004 : 0.002, 32), glassMat({ opacity: 0.25, edge: 0.7 })); gl.position.y = 0.004; gg.add(gl); gg.add(rod(V(0.028, 0.004, 0), V(0.06, 0.004, 0), 0.0025, steel()));
    const lb = tag(`${D > 0 ? '+' : '−'}${Math.abs(D).toFixed(2)} D`, D > 0 ? '#9fe08a' : '#8ac4ff', 0.016); lb.position.set(0.0, 0.03, 0); gg.add(lb); gg.traverse((m) => { m.userData.noHit = true; });
    const t = thing({ en: `${D > 0 ? 'Convex' : 'Concave'} lens ${D > 0 ? '+' : '−'}${Math.abs(D)} D`, hi: `${D > 0 ? 'उत्तल' : 'अवतल'} लेंस ${D > 0 ? '+' : '−'}${Math.abs(D)} D`, hg: `${D > 0 ? 'Convex' : 'Concave'} lens ${D > 0 ? '+' : '−'}${Math.abs(D)} D` }, gg, { hitR: 0.04, hitY: 0.01 }); t.D = D; return t; };
  it.lenses = [-2, -1, 1, 2].map(lensThing); box(g, paint(0x3a2a1e, 0.6), 0.36, 0.01, 0.08, 0.05, BY + 0.005, -0.55);
  // what the person sees (upright), and the rays inside the eye (top view, in the plane of the eye's axis)
  const view = canvasBoard(0.22, 0.16, 512); view.position.set(E.x - 0.02, BY + 0.36, E.z - 0.05); g.add(view); const rays = beamPool(g, 0xffd23f);
  const rd = liveSign(0.055, 6.5); rd.position.set(E.x - 0.02, BY + 0.25, E.z - 0.05); g.add(rd);
  Object.assign(it, { L: EYE.L0, kL: 0.5, obj: 'far', spec: null, res: null });
  it.setL = (k) => { it.kL = clamp01(k); it.L = Math.round((0.0215 + it.kL * 0.003) * 1e4) / 1e4; if (it.onKL) it.onKL(it.kL); }; it.setL(0.5);
  it.putCard = (cb) => { const c = it.card; c.flying = true; flyT(c, it.nearAt.clone(), 0, 0.6, () => { c.flying = false; c.placed = true; it.obj = 'near'; if (cb) cb(); }); return true; };
  it.takeCard = (cb) => { const c = it.card; c.flying = true; flyT(c, c.home.p.clone(), 0, 0.6, () => { c.flying = false; c.placed = false; it.obj = 'far'; if (cb) cb(); }); return true; };
  it.putLens = (t, cb) => { if (it.spec && it.spec !== t) it.dropLens(it.spec); it.spec = t; t.flying = true; flyT(t, V(FX, E.y - 0.004, E.z), 0, 0.6, () => { t.flying = false; t.placed = true; t.g.rotation.set(0, 0, Math.PI / 2); if (cb) cb(); }); return true; };
  it.dropLens = (t, cb) => { if (!t) { if (cb) cb(); return; } if (it.spec === t) it.spec = null; t.g.rotation.set(0, 0, 0); t.flying = true; flyT(t, t.home.p.clone(), 0, 0.6, () => { t.flying = false; t.placed = false; if (cb) cb(); }); };
  it.say = (l, c) => rd.set(l, c);
  let key = ''; ticker(it, () => { const u = it.obj === 'far' ? EYE.far + 0.06 : EYE.near; const D = it.spec && !it.spec.flying ? it.spec.D : 0; const r = eyeImage(it.L, u, D); it.res = r;
    // the model: retina 5 × L behind the lens, lens bulges with accommodation
    ret.position.copy(E).add(V(MS * it.L * 0.95 + 0.008, 0, 0)); retRim.position.copy(ret.position); lens.scale.set(0.55 + 0.35 * r.acc / EYE.A, 1, 1);
    const k = `${it.obj}|${r.arcmin.toFixed(1)}`; if (k !== key) { key = k; paintSight(retT.image.getContext('2d'), 256, 256, it.obj, r.arcmin, true); retT.needsUpdate = true;
      view.draw((x, w, h) => { x.fillStyle = 'rgba(12,16,24,0.9)'; x.beginPath(); x.roundRect(0, 0, w, h, 22); x.fill(); x.save(); x.beginPath(); x.roundRect(14, 40, w - 28, h - 54, 12); x.clip(); x.translate(14, 40); paintSight(x, w - 28, h - 54, it.obj, r.arcmin, false); x.restore(); x.fillStyle = '#ffffff'; x.font = `700 22px ${FONT}`; x.textAlign = 'left'; x.fillText(W('What this eye sees'), 16, 28); }); }
    // three rays from the middle of the object, through the lens, meeting at v (5 × v in the model), then on to the retina
    rays.begin(); const fy = E.y + 0.012, fv = MS * r.v * 0.95 + 0.008; for (const s of [-1, 0, 1]) { const a = E.clone().add(V(-0.03, 0, s * 0.017)); a.y = fy; const f = E.clone().add(V(fv, 0, 0)); f.y = fy; const lensP = E.clone().add(V(0.008, 0, s * 0.017)); lensP.y = fy;
      rays.seg(a, lensP, 0.0015, 0.9); const d = f.clone().sub(lensP); const end = lensP.clone().addScaledVector(d, (MS * it.L * 0.95) / (fv - 0.008 || 1e-6)); rays.seg(lensP, end, 0.0015, 0.9); } rays.end();
    const type = it.L > 0.0235 ? W('a long eyeball (myopia)') : it.L < 0.0225 ? W('a short eyeball (hypermetropia)') : W('a normal eye');
    it.say([`${type} · ${W('lens')} ${r.P.toFixed(1)} D ${r.acc > 0.1 ? `(${W('squeezed')} +${r.acc.toFixed(1)} D)` : `(${W('relaxed')})`}${D ? ` · ${W('spectacles')} ${D > 0 ? '+' : '−'}${Math.abs(D)} D` : ''}`, `${W('image')} ${(r.v * 1000).toFixed(1)} mm ${W('behind the lens, retina at')} ${(it.L * 1000).toFixed(1)} mm · ${r.sharp > 0.8 ? W('sharp') : W('blurred')}`], [WHT, r.sharp > 0.8 ? OKC : RED]); });
  it.lenPath = benchPath(E.x - 0.06, E.x + 0.12, E.z + 0.2);
  it.views = { all: { p: V(0.05, BY + 0.62, 0.15), t: V(-0.05, BY + 0.14, -0.74) }, eye: { p: V(0.4, BY + 0.5, -0.32), t: V(0.42, BY + 0.14, -0.74) } }; it.camView = it.views.eye;
  mergeStatic(g, [ret, retRim, lens, chart]);
  return it;
}
export function bindEye(ey, lenK, app, s, done = {}) {
  const on = (k) => (Array.isArray(s[k]) ? s[k] : [s[k]]).some((i) => stepNow(app, i));
  const s1 = slideKnob(lenK, { path: () => ey.lenPath(), active: () => on('length'), keepVisible: () => on('length'), k: () => ey.kL, set: (k) => ey.setL(k) }); ey.onKL = () => s1();
  carry(ey.card, [{ at: () => ey.nearAt.clone(), r: 0.07, open: () => true, put: () => ey.putCard() }], { carryY: BY + 0.2 }); { const r0 = ey.card.onRelease; ey.card.onRelease = () => { if (ey.obj === 'near') ey.obj = 'far'; r0(); }; }
  for (const t of ey.lenses) { carry(t, [{ at: () => V(ey.E.x - 0.06, BY, ey.E.z), r: 0.06, open: () => true, put: (x) => ey.putLens(x) }], { carryY: BY + 0.2 }); const r0 = t.onRelease; t.onRelease = () => { if (ey.spec === t) { ey.spec = null; t.g.rotation.set(0, 0, 0); } r0(); }; }
  const u0 = ey.update; ey.update = (dt, t) => { u0(dt, t); const r = ey.res; if (!r) return; const D = ey.spec && !ey.spec.flying ? ey.spec.D : 0;
    if (on('far') && ey.obj === 'far' && r.sharp > 0.8 && Math.abs(ey.L - EYE.L0) < 0.0003 && done.far) done.far();
    if (on('near') && ey.obj === 'near' && r.sharp > 0.8 && done.near) done.near();
    if (on('myopic') && ey.L >= 0.0238 && ey.L <= 0.0242 && ey.obj === 'far' && !D && done.myopic) done.myopic();
    if (on('concave') && ey.L >= 0.0238 && ey.L <= 0.0242 && ey.obj === 'far' && D < 0 && r.sharp > 0.8 && done.concave) done.concave();
    if (on('hyper') && ey.L <= 0.0222 && ey.L >= 0.0218 && ey.obj === 'near' && !D && r.sharp < 0.5 && done.hyper) done.hyper();
    if (on('convex') && ey.L <= 0.0222 && ey.L >= 0.0218 && ey.obj === 'near' && D > 0 && r.sharp > 0.8 && done.convex) done.convex(); };
}

// ------------------------------------------------------------------ Class 9 Ch 6: inertia at the bench (a coin on a card on a glass; a stack of carrom coins)
export function inertiaBench(o = {}) {
  const it = rig('pwsxinert', { en: 'Glass, card and coin; carrom coins and striker', hi: 'गिलास, कार्ड और सिक्का; कैरम की गोटियाँ और स्ट्राइकर', hg: 'Glass, card aur sikka; carrom ki gotiyan aur striker' }, o); const g = it.g, W = it.W;
  // the glass tumbler with a postcard on it and a ₹5 coin on the card
  const GP = V(-0.22, BY, -0.72), GH = 0.11, GR = 0.036; const glassM = glassMat({ opacity: 0.12, edge: 0.7 }); const gl = lathe([[0, 0], [0.03, 0], [0.031, 0.008], [GR, GH], [GR - 0.0025, GH], [0.028, 0.009], [0, 0.009]], glassM, 40); gl.position.copy(GP); gl.renderOrder = 6; g.add(gl);
  const cardT = canvasTex(256, 160, (x, w, h) => { x.fillStyle = '#f1ead8'; x.fillRect(0, 0, w, h); x.strokeStyle = '#b5452b'; x.lineWidth = 6; x.strokeRect(8, 8, w - 16, h - 16); x.fillStyle = '#3a3a3a'; x.font = `700 26px ${FONT}`; x.textAlign = 'center'; x.fillText('POST CARD', w / 2, 48); x.fillRect(w / 2 - 1, 64, 2, 80); });
  const card = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.0008, 0.06), new THREE.MeshStandardMaterial({ map: cardT, roughness: 0.9 })); g.add(card);
  const coinT = canvasTex(128, 128, (x, w, h) => { const gr = x.createRadialGradient(64, 64, 10, 64, 64, 64); gr.addColorStop(0, '#e6c36a'); gr.addColorStop(1, '#a8802e'); x.fillStyle = gr; x.beginPath(); x.arc(64, 64, 62, 0, TAU); x.fill(); x.strokeStyle = 'rgba(80,50,10,0.6)'; x.lineWidth = 3; x.beginPath(); x.arc(64, 64, 54, 0, TAU); x.stroke(); x.fillStyle = 'rgba(80,50,10,0.75)'; x.font = `800 46px ${FONT}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('₹5', 64, 66); });
  const coin = new THREE.Mesh(new THREE.CylinderGeometry(0.0115, 0.0115, 0.002, 32), [new THREE.MeshStandardMaterial({ color: 0xbf9a45, metalness: 1, roughness: 0.3 }), new THREE.MeshStandardMaterial({ map: coinT, metalness: 0.9, roughness: 0.32 }), new THREE.MeshStandardMaterial({ map: coinT, metalness: 0.9, roughness: 0.32 })]); coin.castShadow = true; g.add(coin);
  const fing = gloveHand('right'); fing.ready.then((h) => { if (!h) return; h.model.rotation.set(0, Math.PI / 2, -Math.PI / 2); h.model.scale.setScalar(0.85); }); g.add(fing);
  // the carrom: a corner of the board (polished plywood, a black border), a stack of coins and the striker
  const CP = V(0.2, BY, -0.72); const boardT = canvasTex(512, 512, (x, w, h) => { x.fillStyle = '#e7c99a'; x.fillRect(0, 0, w, h); const r = rnd(4); for (let i = 0; i < 60; i++) { x.strokeStyle = `rgba(150,100,50,${0.05 + r() * 0.08})`; x.lineWidth = 1 + r() * 2; x.beginPath(); const y = r() * h; x.moveTo(0, y); x.bezierCurveTo(w * 0.3, y + 6, w * 0.6, y - 6, w, y + 3); x.stroke(); } x.strokeStyle = '#1b1b1b'; x.lineWidth = 6; x.strokeRect(60, 60, w - 120, h - 120); x.strokeStyle = '#b5281e'; x.beginPath(); x.arc(w * 0.5, h * 0.5, 70, 0, TAU); x.stroke(); });
  box(g, new THREE.MeshStandardMaterial({ map: boardT, roughness: 0.25 }), 0.4, 0.012, 0.3, CP.x, BY + 0.006, CP.z); for (const [w, d, x, z] of [[0.44, 0.02, 0, -0.16], [0.44, 0.02, 0, 0.16], [0.02, 0.3, -0.21, 0], [0.02, 0.3, 0.21, 0]]) box(g, wood('#2a1a12'), w, 0.03, d, CP.x + x, BY + 0.015, CP.z + z);
  const SR = 0.0155, ST = 0.0045; const cm = [mat('cw', () => new THREE.MeshStandardMaterial({ color: 0xe8dcc0, roughness: 0.35 })), mat('cb', () => new THREE.MeshStandardMaterial({ color: 0x1a1817, roughness: 0.35 })), mat('cq', () => new THREE.MeshStandardMaterial({ color: 0xb3201c, roughness: 0.35 }))];
  const coins = []; for (let i = 0; i < 6; i++) { const m = new THREE.Mesh(new THREE.CylinderGeometry(SR, SR, ST, 28), cm[i === 5 ? 2 : i % 2]); m.castShadow = true; g.add(m); coins.push({ m, p: V(0, 0, 0), v: V(0, 0, 0), w: 0, tilt: 0, st: 'stack' }); }
  const striker = new THREE.Mesh(new THREE.CylinderGeometry(0.0205, 0.0205, 0.0055, 32), mat('strk', () => new THREE.MeshStandardMaterial({ color: 0xf2f0ea, roughness: 0.15 }))); striker.castShadow = true; g.add(striker);
  const rd = liveSign(0.055, 6.5); rd.position.set(0, BY + 0.27, -0.78); g.add(rd);
  Object.assign(it, { kc: 0.8, kf: 0.8, coinRes: null, stackRes: null, tries: [], carromTries: [] });
  const resetCoin = () => { card.position.set(GP.x, GP.y + GH + 0.0006, GP.z); card.rotation.set(0, 0, 0); coin.position.set(GP.x, GP.y + GH + 0.0022, GP.z); coin.rotation.set(0, 0, 0); fing.position.set(GP.x - 0.12, GP.y + GH + 0.004, GP.z); };
  const resetStack = () => { coins.forEach((c, i) => { c.st = 'stack'; c.p.set(CP.x, BY + 0.012 + ST / 2 + i * ST, CP.z); c.v.set(0, 0, 0); c.m.position.copy(c.p); c.m.rotation.set(0, 0, 0); }); striker.position.set(CP.x - 0.13, BY + 0.012 + 0.00275, CP.z); };
  resetCoin(); resetStack();
  it.setKc = (k) => { it.kc = clamp01(k); if (it.onKc) it.onKc(it.kc); }; it.setKs = (k) => { it.kf = clamp01(k); if (it.onKs) it.onKs(it.kf); };
  // flick the card: a = 0.5 + 300 k² m/s² up to 0.2 + 3.3 k m/s (a slow pull at k = 0); μs 0.4, μk 0.3
  it.flick = (cb) => { if (it.busy) return false; resetCoin(); const k = it.kc, a = 0.5 + 300 * k * k, vmax = 0.2 + 3.3 * k, ms = 0.4 * G, mk = 0.3 * G; let xc = 0, vc = 0, xo = 0, vo = 0, t = 0, sticks = a <= ms; const dt = 2e-4, out = 0.045 + 0.0115;
    while (t < 2 && xc - xo < out && xc < 0.14) { vc = Math.min(vmax, vc + a * dt); xc += vc * dt; if (sticks) { vo = vc; xo = xc; } else { vo = Math.min(vc, vo + mk * dt); xo += vo * dt; } t += dt; }
    const tf = Math.sqrt(2 * (GH - 0.01) / G); const land = xo + vo * tf; const res = sticks ? 'out' : land < GR - 0.0125 ? 'in' : land < GR + 0.006 ? 'rim' : 'out'; it.coinRes = { k, res, xo, vo, land, sticks, a };
    const T = Math.max(0.25, t * 6), cardEnd = 0.25; const c0 = coin.position.clone(), k0 = card.position.clone();
    it.play(T + 1.3, (u) => { const s = (u * (T + 1.3)); const fx = Math.min(1, s / T);
      fing.position.set(GP.x - 0.12 + 0.07 * Math.min(1, s / 0.2), GP.y + GH + 0.004, GP.z);
      card.position.set(k0.x + lerp(0, cardEnd, ease(fx)), k0.y - (fx > 0.6 ? (fx - 0.6) * 0.25 : 0), k0.z); card.rotation.z = fx > 0.6 ? -(fx - 0.6) * 1.2 : 0;
      if (sticks) { coin.position.set(card.position.x, card.position.y + 0.0016, c0.z); coin.rotation.z = card.rotation.z; }
      else if (s < T) coin.position.set(c0.x + xo * fx, c0.y, c0.z);
      else { const q = clamp01((s - T) / 0.5); if (res === 'in') coin.position.set(c0.x + xo + (land - xo) * q, lerp(c0.y, GP.y + 0.011, q * q), c0.z); else if (res === 'rim') { coin.position.set(c0.x + land + q * 0.04, c0.y - q * q * (GH + 0.002) * (q > 0.4 ? 1 : 0.2), c0.z); coin.rotation.z = -q * 2; } else coin.position.set(c0.x + land + q * 0.02, lerp(c0.y, BY + 0.001, q * q), c0.z); } },
      () => { if (res === 'in') sfx(o.app, 'ding', 1.6); it.tries.push(it.coinRes); if (cb) cb(it.coinRes); if (it.onFlick) it.onFlick(it.coinRes); }); return true; };
  // strike the bottom coin: striker 15 g, coin 5.5 g, e = 0.8 → the coin leaves at 1.32 × the striker's speed; the coins
  // above are dragged by friction (μ 0.3) only while it slides out from under them (t = 3.1 cm ÷ its speed)
  it.strike = (cb) => { if (it.busy) return false; resetStack(); const k = it.kf, vs = 0.3 + 3.2 * k, vb = 1.32 * vs, tOut = 2 * SR / vb, dv = 0.3 * G * tOut, off = 0.5 * 0.3 * G * tOut * tOut + dv * 0.029;
    const res = vb > 0.9 && off < 0.006 ? 'clean' : vb > 0.55 ? 'shift' : 'topple'; it.stackRes = { k, vs, vb, off, res };
    const s0 = striker.position.clone(); const T = 1.8;
    it.play(T, (u) => { const s = u * T, hitT = 0.18 / Math.max(0.6, vs);
      striker.position.set(s0.x + Math.min(s, hitT) / hitT * (0.13 - SR - 0.0205), s0.y, s0.z);
      if (s > hitT) { const ts = s - hitT; const b = coins[0]; const dx = Math.min(0.17, vb * ts * Math.exp(-ts * 1.2)); b.m.position.set(CP.x + dx, BY + 0.012 + ST / 2, CP.z);
        const drop = clamp01(ts / Math.max(0.05, tOut + 0.03)); for (let i = 1; i < 6; i++) { const c = coins[i]; const ox = res === 'topple' ? Math.min(0.06, dx * (0.3 + 0.12 * i)) : res === 'shift' ? off * 1000 * 0.004 * (1 + i * 0.1) * drop : off * drop;
          c.m.position.set(CP.x + ox, BY + 0.012 + ST / 2 + (i - drop) * ST - (res === 'topple' ? clamp01(ts * 3) * i * ST * 0.7 : 0), CP.z); c.m.rotation.z = res === 'topple' ? -clamp01(ts * 2) * (0.4 + i * 0.25) : 0; } } },
      () => { it.carromTries.push(it.stackRes); if (cb) cb(it.stackRes); if (it.onStrike) it.onStrike(it.stackRes); }); return true; };
  it.say = (l, c) => rd.set(l, c);
  ticker(it, () => { const r = it.coinRes, s = it.stackRes; it.say([r ? `${W('Card')}: ${r.sticks ? W('pulled slowly') : `${W('flicked')} (${Math.round(r.a)} m/s²)`} → ${W(r.res === 'in' ? 'the coin dropped into the glass' : r.res === 'rim' ? 'the coin hit the rim and fell out' : 'the coin went with the card')}` : `${W('Card')}: ${it.kc < 0.12 ? W('slow pull') : `${W('flick')} ${Math.round((0.5 + 300 * it.kc ** 2))} m/s²`}`,
    s ? `${W('Carrom')}: ${W('striker')} ${s.vs.toFixed(1)} m/s → ${W(s.res === 'clean' ? 'only the bottom coin flew out; the stack dropped straight down' : s.res === 'shift' ? 'the bottom coin flew out; the stack shifted a little' : 'the stack was dragged along and toppled')}` : `${W('Carrom')}: ${W('striker')} ${(0.3 + 3.2 * it.kf).toFixed(1)} m/s`], [r && r.res === 'in' ? OKC : WHT, s && s.res === 'clean' ? OKC : WHT]); });
  it.coinPath = benchPath(-0.34, -0.1, -0.5); it.flickAt = V(GP.x - 0.16, BY + 0.03, GP.z + 0.06); it.carromPath = benchPath(0.08, 0.32, -0.5); it.strikeAt = V(CP.x - 0.15, BY + 0.05, CP.z + 0.08);
  it.views = { all: { p: V(0.0, BY + 0.5, -0.12), t: V(0.0, BY + 0.06, -0.74) }, coin: { p: V(-0.2, BY + 0.34, -0.42), t: V(-0.2, BY + 0.09, -0.74) }, carrom: { p: V(0.2, BY + 0.3, -0.45), t: V(0.2, BY + 0.03, -0.74) } };
  it.camView = it.views.all; mergeStatic(g, [card, coin, striker, ...coins.map((c) => c.m)]);
  return it;
}
export function bindInertia(ib, coinK, flickK, carK, strikeK, app, s, done = {}) {
  const on = (k) => (Array.isArray(s[k]) ? s[k] : [s[k]]).some((i) => stepNow(app, i));
  const s1 = slideKnob(coinK, { path: () => ib.coinPath(), active: () => on('coin') && !ib.busy, keepVisible: () => on('coin'), k: () => ib.kc, set: (k) => ib.setKc(k) });
  const s2 = slideKnob(carK, { path: () => ib.carromPath(), active: () => on('carrom') && !ib.busy, keepVisible: () => on('carrom'), k: () => ib.kf, set: (k) => ib.setKs(k) });
  ib.onKc = () => s1(); ib.onKs = () => s2();
  pushKnob(flickK, { path: pressPath(ib.flickAt, 0.035), active: () => on('coin') && !ib.busy, keepVisible: () => on('coin'), press: () => ib.flick() });
  pushKnob(strikeK, { path: pressPath(ib.strikeAt, 0.035), active: () => on('carrom') && !ib.busy, keepVisible: () => on('carrom'), press: () => ib.strike() });
  ib.onFlick = (r) => { if (stepNow(app, s.flickIn) && r.res === 'in' && done.flickIn) done.flickIn(); if (stepNow(app, s.slow) && r.sticks && done.slow) done.slow(); };
  ib.onStrike = (r) => { if (stepNow(app, s.clean) && r.res === 'clean' && done.clean) done.clean(); if (stepNow(app, s.soft) && r.res === 'topple' && done.soft) done.soft(); };
}

// ------------------------------------------------------------------ Class 9 Ch 6: inertia in a bus (a real road)
// The student stands in the aisle of a bus on a farm road (Maths Lab place 'farm', the road straight ahead). The road and the
// fields slide past; the bus cruises at 30 km/h (8.3 m/s). Brakes or a start as hard as the student chose: a strap swings to
// atan(a/g), a water bottle (25 cm tall, 7 cm base) topples beyond 2.9 m/s², a school bag slides beyond 0.4 g.
export function busRide(o = {}) {
  const it = rig('pwsxbus', { en: 'Inside a bus', hi: 'बस के अंदर', hg: 'Bus ke andar' }, o); const g = it.g, W = it.W;
  const BW = 2.4, BL = 9, BH = 2.3, Z0 = 1.2; // the bus: from z = Z0 (rear) to Z0 − BL (front); the student stands near the rear
  const floorT = canvasTex(256, 256, (x) => { x.fillStyle = '#3a3c3f'; x.fillRect(0, 0, 256, 256); x.fillStyle = 'rgba(255,255,255,0.06)'; for (let i = 0; i < 256; i += 16) x.fillRect(0, i, 256, 6); }); floorT.wrapS = floorT.wrapT = THREE.RepeatWrapping; floorT.repeat.set(2, 9);
  const lamB = (k, o2) => mat('bus' + k, () => new THREE.MeshLambertMaterial(o2));
  const shell = lamB('shell', { color: 0xd9d4c4 }), floorM = lamB('floor', { map: floorT }), seatM = lamB('seat', { color: 0x2f5c8a }), seatB = lamB('seatb', { color: 0x234567 }), barM = mat('bar', () => new THREE.MeshStandardMaterial({ color: 0xd8dde2, metalness: 1, roughness: 0.25 })), glassB = mat('busGlass', () => new THREE.MeshBasicMaterial({ color: 0x9fb4c2, transparent: true, opacity: 0.12, depthWrite: false }));
  const bus = new THREE.Group(); g.add(bus); box(bus, floorM, BW, 0.1, BL, 0, -0.05 + 0.4, Z0 - BL / 2); box(bus, shell, BW, 0.08, BL, 0, BH + 0.4, Z0 - BL / 2);
  for (const sx of [-1, 1]) { box(bus, shell, 0.06, 0.55, BL, sx * BW / 2, 0.4 + 0.27, Z0 - BL / 2); box(bus, shell, 0.06, 0.45, BL, sx * BW / 2, 0.4 + BH - 0.22, Z0 - BL / 2); for (let i = 0; i <= 6; i++) box(bus, shell, 0.06, BH - 1.0, 0.12, sx * BW / 2, 0.4 + 0.55 + (BH - 1.0) / 2, Z0 - i * BL / 6);
    const gw = new THREE.Mesh(new THREE.PlaneGeometry(BL, BH - 1.0), glassB); gw.rotation.y = sx * Math.PI / 2 * -1; gw.position.set(sx * (BW / 2 - 0.01), 0.4 + 0.55 + (BH - 1.0) / 2, Z0 - BL / 2); gw.userData.noHit = true; bus.add(gw); }
  box(bus, shell, BW, BH, 0.06, 0, 0.4 + BH / 2, Z0 + 0.03); // the rear wall (the windscreen at the front stays open)
  box(bus, shell, BW, 0.9, 0.06, 0, 0.4 + 0.45, Z0 - BL); const ws = new THREE.Mesh(new THREE.PlaneGeometry(BW, BH - 0.9), glassB); ws.position.set(0, 0.4 + 0.9 + (BH - 0.9) / 2, Z0 - BL); bus.add(ws);
  for (let r = 0; r < 7; r++) for (const sx of [-1, 1]) { const z = Z0 - 1.4 - r * 1.05; box(bus, seatM, 0.85, 0.12, 0.45, sx * 0.72, 0.4 + 0.45, z); box(bus, seatB, 0.85, 0.65, 0.08, sx * 0.72, 0.4 + 0.8, z + 0.25); box(bus, barM, 0.03, 0.45, 0.03, sx * 0.3, 0.4 + 0.22, z); }
  for (const sx of [-1, 1]) bus.add(rod(V(sx * 0.42, 0.4 + 1.95, Z0 - 0.4), V(sx * 0.42, 0.4 + 1.95, Z0 - BL + 0.6), 0.016, barM));
  // hanging straps (one instanced mesh: a loop on a strap), a bottle on the floor, a bag on a seat
  const NS = 14; const strapG = new THREE.Group(); bus.add(strapG); const straps = []; for (let i = 0; i < NS; i++) { const sx = i % 2 ? 0.42 : -0.42, z = Z0 - 0.8 - Math.floor(i / 2) * 1.05; const pv = new THREE.Group(); pv.position.set(sx, 0.4 + 1.94, z); strapG.add(pv);
    const st = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.22, 0.006), mat('strap', () => new THREE.MeshLambertMaterial({ color: 0x2b2b2b }))); st.position.y = -0.11; pv.add(st); const lp = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.012, 8, 20), mat('loop', () => new THREE.MeshLambertMaterial({ color: 0xe6e2d6 }))); lp.position.y = -0.27; pv.add(lp); straps.push(pv); }
  const bottle = new THREE.Group(); bottle.position.set(0.25, 0.4, Z0 - 2.2); bus.add(bottle); const bm = lathe([[0, 0], [0.035, 0], [0.036, 0.17], [0.022, 0.21], [0.013, 0.23], [0.013, 0.25], [0, 0.25]], mat('btl', () => new THREE.MeshStandardMaterial({ color: 0x9fd0ef, roughness: 0.15, transparent: true, opacity: 0.7 })), 24); bottle.add(bm); const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.02, 16), plastic(0x1d5fbf)); cap.position.y = 0.255; bottle.add(cap);
  const bag = new THREE.Group(); bag.position.set(-0.72, 0.4 + 0.51, Z0 - 2.45); bus.add(bag); box(bag, mat('bagM', () => new THREE.MeshLambertMaterial({ color: 0x8a2d2d })), 0.32, 0.38, 0.16, 0, 0.19, 0); box(bag, mat('bagF', () => new THREE.MeshLambertMaterial({ color: 0x6e2222 })), 0.26, 0.18, 0.05, 0, 0.12, 0.1);
  const rd = liveSign(0.11, 6.5); rd.position.set(0, 0.4 + 1.62, Z0 - 2.2); bus.add(rd);
  // wooden electricity poles along the road (they pass the windows)
  const poleM = mat('pole', () => new THREE.MeshLambertMaterial({ color: 0x6b5a46 })); const poles = []; for (let i = 0; i < 8; i++) { const p = new THREE.Group(); const sx = i % 2 ? 4.2 : -4.5; p.add(rod(V(sx, 0, 0), V(sx, 7.5, 0), 0.11, poleM, 8)); p.add(rod(V(sx - 0.7, 7.1, 0), V(sx + 0.7, 7.1, 0), 0.05, poleM, 6)); p.userData.z0 = i * 15; g.add(p); poles.push(p); }
  Object.assign(it, { v: 0, a: 0, ka: 0.8, x: 0, mode: 'still', bottleDown: false, bagSlid: false, maxA: 0, events: [], lean: 0 });
  it.setKa = (k) => { it.ka = clamp01(k); if (it.onKa) it.onKa(it.ka); };
  const accOf = () => 1 + it.ka * 6.5; // the chosen brake or start, 1 … 7.5 m/s²
  it.go = (gentle) => { if (it.busy) return false; it.mode = 'start'; it.aSet = gentle ? 1.2 : accOf(); it.busy = true; it.bottleDown = false; it.bagSlid = false; it.resetThings(); return true; };
  it.brake = () => { if (it.v < 1 || it.mode === 'brake') return false; it.mode = 'brake'; it.aSet = accOf(); it.busy = true; it.bottleDown = false; it.bagSlid = false; it.resetThings(); return true; };
  it.resetThings = () => { bottle.rotation.set(0, 0, 0); bottle.position.set(0.25, 0.4, Z0 - 2.2); bag.position.set(-0.72, 0.4 + 0.51, Z0 - 2.45); bag.rotation.set(0, 0, 0); it.bt = 0; it.bg = 0; };
  it.say = (l, c) => rd.set(l, c);
  ticker(it, (dt) => { let a = 0;
    if (it.mode === 'start') { a = it.aSet; it.v = Math.min(8.33, it.v + a * dt); if (it.v >= 8.33) { it.mode = 'cruise'; it.busy = false; it.events.push({ k: 'start', a: it.aSet, bottle: it.bottleDown, bag: it.bagSlid }); } }
    else if (it.mode === 'brake') { a = -it.aSet; it.v = Math.max(0, it.v + a * dt); if (it.v <= 0) { it.mode = 'still'; it.busy = false; it.events.push({ k: 'brake', a: it.aSet, bottle: it.bottleDown, bag: it.bagSlid }); } }
    it.a = a; it.maxA = Math.max(it.maxA, Math.abs(a)); it.x += it.v * dt;
    // the world slides past (the place's photo and ground move backwards)
    if (o.app && o.app.places) o.app.places.root.position.z = (it.x % 60);
    // things in the bus feel a pseudo-force −m·a: forward when braking (−z), backward when starting
    const tilt = Math.atan2(-a, G); for (const s of straps) s.rotation.x = lerp(s.rotation.x, tilt * 0.9, Math.min(1, dt * 6)) + Math.sin(performance.now() * 0.003 + s.position.z) * 0.004;
    if (a) it.lastSign = a < 0 ? -1 : 1;
    if (Math.abs(a) > G * 0.035 / 0.12 && !it.bottleDown) { it.bottleDown = true; } if (it.bottleDown) { it.bt = Math.min(1, it.bt + dt * 2.2); bottle.rotation.x = (it.lastSign ?? -1) * ease(it.bt) * Math.PI / 2; }
    if (Math.abs(a) > 0.4 * G && !it.bagSlid) it.bagSlid = true; if (it.bagSlid && it.bg < 1) { it.bg = Math.min(1, it.bg + dt * 1.5); bag.position.z = Z0 - 2.45 + (it.lastSign ?? -1) * 0.25 * ease(it.bg); bag.rotation.x = (it.lastSign ?? -1) * 0.5 * ease(it.bg); }
    const kmh = it.v * 3.6; it.say([`${W('speed')} ${kmh.toFixed(0)} km/h · ${a < 0 ? W('braking') : a > 0 ? W('speeding up') : it.v > 0 ? W('steady') : W('standing')} ${a ? `${Math.abs(a).toFixed(1)} m/s²` : ''}`, `${W('strap tilts')} ${Math.round(Math.abs(Math.atan2(a, G)) / DEG)}° · ${it.bottleDown ? W('the bottle fell over') : W('the bottle stands')} · ${it.bagSlid ? W('the bag slid') : W('the bag stays')}`], [WHT, it.bottleDown ? RED : OKC]); });
  it.accPath = () => [V(-0.3, 1.0, -0.42), V(0.3, 1.0, -0.42)]; it.goAt = V(0.38, 1.0, -0.3);
  it.views = { all: { p: V(0.15, 1.6, 0.5), t: V(-0.05, 1.0, -3.5) } }; it.camView = it.views.all;
  mergeStatic(bus, [rd, bottle, bag]); return it;
}
export function bindBus(bu, accK, goK, app, s, done = {}) {
  const on = (k) => (Array.isArray(s[k]) ? s[k] : [s[k]]).some((i) => stepNow(app, i));
  const s1 = slideKnob(accK, { path: () => bu.accPath(), active: () => on('acc') && !bu.busy, keepVisible: () => on('acc'), k: () => bu.ka, set: (k) => bu.setKa(k) }); bu.onKa = () => s1();
  pushKnob(goK, { path: pressPath(bu.goAt, 0.04), active: () => on('go') && !bu.busy, keepVisible: () => on('go'), press: () => { if (bu.v < 1) bu.go(!stepNow(app, s.jolt)); else bu.brake(); } });
  const n0 = {}; const u0 = bu.update; bu.update = (dt, t) => { u0(dt, t); const i = app.runner.i; if (n0[i] == null) n0[i] = bu.events.length; const ev = bu.events.slice(n0[i]);
    if (stepNow(app, s.start) && bu.mode === 'cruise' && done.start) done.start();
    if (stepNow(app, s.hard) && ev.some((e) => e.k === 'brake' && e.a >= 4.5) && done.hard) done.hard();
    if (stepNow(app, s.gentle) && ev.some((e) => e.k === 'brake' && e.a <= 2.5) && done.gentle) done.gentle();
    if (stepNow(app, s.jolt) && ev.some((e) => e.k === 'start' && e.a >= 4.5) && done.jolt) done.jolt(); };
}
