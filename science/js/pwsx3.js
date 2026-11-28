// DUET Science Lab 360, physics batch PW-SX: light at the lab bench. Total internal reflection in a semicircular glass block
// and a bent light pipe (Class 10), why the sky is blue and the setting Sun red (a torch through milky water, then the real
// sky at noon and at sunset; Class 10), Newton's colour disc (Class 7), and regular and diffuse reflection of a laser comb
// (Class 8). The light follows the physics of what the student set up:
//  - at the flat face of the block: Snell's law and Fresnel's equations (how much is reflected), total reflection beyond
//    41.8°; in a bent rod of radius a and bend radius R, a ray at height y escapes when (R + y)/(R + a) < 1/n;
//  - milk particles scatter light ∝ λ⁻⁴ (blue 4.3 times as much as red): the side of the beam is bluish, the light that gets
//    through is exp(−β(λ)·L); in the air the same law with the Sun's path through the atmosphere (air mass, Kasten–Young);
//  - the eye keeps an image for about 1/16 s: the disc looks like the average of the colours it swept through in that time;
//  - each beam of the comb obeys i = r on the surface's own little slopes there (a profile drawn for each material).
import * as THREE from 'three';
import { canvasTex, glassMat } from './mats.js';
import { PLACES } from './places.js';
import * as P from './pwsx1.js';
const { V, BY, TAU, DEG, OKC, YEL, RED, WHT, BLU, rig, box, rod, lathe, post, mat, steel, brass, oldBrass, copper, iron, bake, plastic, paint, glow, addGlow, wood, ticker, mergeStatic, liveSign, tag, clamp01, ease, lerp, sfx, rnd, FONT, zoomBubble, stepNow, slideKnob, pushKnob, carry, flyT, thing, benchPath, pressPath, fitModel, canvasBoard, beamPool } = P;

// the real sky at sunset (Poly Haven dikhololo_sunset, CC0): veld with trees, the Sun 3.5° up; noon is the grassland place
if (!PLACES.sunset) PLACES.sunset = { img: 'dikhololo_sunset', h: 1.6, r: 60, sun: [0.809, 0.061, 0.585], sunI: 1.1, sky: 0.4, env: 0.9, name: { en: 'Countryside at sunset', hi: 'शाम को खेतों का इलाक़ा', hg: 'Shaam ko kheton ka ilaaqa' } };

// a black ray-optics board with a printed angle scale (0° along the normal) around O
function opticsBoard(g, O, w = 0.46, d = 0.34, R = 0.13) {
  const t = canvasTex(1024, Math.round(1024 * d / w), (x, W, H) => { x.fillStyle = '#121417'; x.fillRect(0, 0, W, H); const s = W / w, cx = W / 2, cy = H / 2; x.strokeStyle = 'rgba(235,235,225,0.85)'; x.fillStyle = 'rgba(235,235,225,0.85)'; x.lineWidth = 2;
    x.beginPath(); x.arc(cx, cy, R * s, 0, TAU); x.stroke(); for (let a = 0; a < 360; a += 2) { const r = a * DEG, L = a % 10 === 0 ? 18 : 8; x.beginPath(); x.moveTo(cx + Math.cos(r) * R * s, cy + Math.sin(r) * R * s); x.lineTo(cx + Math.cos(r) * (R * s - L), cy + Math.sin(r) * (R * s - L)); x.stroke();
      if (a % 30 === 0) { const v = Math.abs(((a + 90) % 180) - 90); x.font = `600 20px ${FONT}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(String(90 - v), cx + Math.cos(r) * (R * s - 36), cy + Math.sin(r) * (R * s - 36)); } }
    x.setLineDash([10, 8]); x.beginPath(); x.moveTo(cx, cy - R * s * 1.15); x.lineTo(cx, cy + R * s * 1.15); x.stroke(); x.setLineDash([]); x.font = `700 22px ${FONT}`; x.fillText('N', cx + 16, cy - R * s + 26); x.fillText('N′', cx + 18, cy + R * s - 22); });
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.006, d), [0, 1, 2, 3, 4, 5].map((i) => (i === 2 ? new THREE.MeshStandardMaterial({ map: t, roughness: 0.85 }) : paint(0x23262b, 0.8)))); m.position.set(O.x, O.y - 0.003, O.z); m.receiveShadow = true; g.add(m); return m;
}
// a red laser module on a little block (its beam leaves along local −z)
function laserBox() { const g = new THREE.Group(); box(g, paint(0x2a2d31, 0.35), 0.024, 0.02, 0.06, 0, 0.01, 0); const ap = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.004, 14), steel()); ap.rotation.x = Math.PI / 2; ap.position.set(0, 0.012, -0.031); g.add(ap);
  const led = new THREE.Mesh(new THREE.SphereGeometry(0.002, 8, 6), glow(0xff3020)); led.position.set(0.008, 0.021, 0.02); g.add(led); g.add(rod(V(0, 0.01, 0.03), V(0.0, 0.004, 0.08), 0.0015, plastic(0x111111), 6)); g.traverse((m) => { m.userData.noHit = true; }); return g; }

// ------------------------------------------------------------------ Class 10 Ch 9: total internal reflection, and a light pipe
export const N_GLASS = 1.5, N_ACRYL = 1.49, CRIT = Math.asin(1 / N_GLASS) / DEG;
export const fresnelR = (i, n1, n2) => { const s = n1 / n2 * Math.sin(i); if (s >= 1) return 1; const ci = Math.cos(i), ct = Math.sqrt(1 - s * s); const rs = (n1 * ci - n2 * ct) / (n1 * ci + n2 * ct), rp = (n2 * ci - n1 * ct) / (n2 * ci + n1 * ct); return (rs * rs + rp * rp) / 2; };
// share of the light (rays across a rod of radius a) that escapes in a bend of radius Rb
export const pipeLeak = (Rb, a = 0.004, n = N_ACRYL) => clamp01(((Rb + a) / n - Rb + a) / (2 * a));
export function tirBench(o = {}) {
  const it = rig('pwsxtir', { en: 'Semicircular glass block, laser and light pipe', hi: 'अर्धवृत्ताकार काँच का ब्लॉक, लेज़र और लाइट पाइप', hg: 'Semicircular glass block, laser aur light pipe' }, o); const g = it.g, W = it.W;
  const O = V(-0.12, BY + 0.012, -0.74), R0 = 0.06, RL = 0.17; it.O = O; opticsBoard(g, O);
  // the D-shaped block: flat face along x through O, curved side towards the student
  const sh = new THREE.Shape(); sh.moveTo(-R0, 0); sh.lineTo(R0, 0); sh.absarc(0, 0, R0, 0, Math.PI, false); const bg = new THREE.ExtrudeGeometry(sh, { depth: 0.022, bevelEnabled: false, curveSegments: 48 }); bg.rotateX(Math.PI / 2); bg.translate(0, 0.022, 0);
  const blk = new THREE.Mesh(bg, glassMat({ opacity: 0.16, edge: 0.75 })); blk.position.copy(O).add(V(0, -0.006, 0)); blk.renderOrder = 6; g.add(blk);
  const lz = laserBox(); g.add(lz); const beams = beamPool(g, 0xff2a14); it.on = false; it.i = 20 * DEG; it.mode = 'block';
  // the light pipe: a clear acrylic rod (radius 4 mm) running straight, round a bend of radius Rb, and straight again
  const PO = V(0.17, BY + 0.016, -0.66), a = 0.004; it.Rb = 0.06; let pipe = null, core = null; const pipeM = new THREE.MeshStandardMaterial({ color: 0xf2f8ff, roughness: 0.04, metalness: 0, transparent: true, opacity: 0.4, depthWrite: false });
  const coreM = new THREE.MeshBasicMaterial({ color: 0xff2a14, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
  const pipePath = (Rb) => { const L1 = 0.09, pts = []; for (let i = 0; i <= 8; i++) pts.push(V(PO.x, PO.y, PO.z - i / 8 * L1)); const c = V(PO.x + Rb, PO.y, PO.z - L1); for (let i = 1; i <= 24; i++) { const t = i / 24 * Math.PI / 2; pts.push(V(c.x - Rb * Math.cos(t), PO.y, c.z - Rb * Math.sin(t))); } const e = pts[pts.length - 1]; for (let i = 1; i <= 8; i++) pts.push(V(e.x + i / 8 * 0.09, PO.y, e.z)); return new THREE.CatmullRomCurve3(pts, false, 'centripetal', 0); };
  it.setBend = (k) => { it.kb = clamp01(k); it.Rb = 0.07 - it.kb * 0.064; const c = pipePath(it.Rb); for (const m of [pipe, core]) if (m) { g.remove(m); m.geometry.dispose(); } pipe = new THREE.Mesh(new THREE.TubeGeometry(c, 80, a, 14, false), pipeM); pipe.renderOrder = 6; pipe.userData.noHit = true; core = new THREE.Mesh(new THREE.TubeGeometry(c, 80, a * 0.7, 8, false), coreM); core.renderOrder = 7; core.userData.noHit = true; g.add(pipe, core); it.pipeCurve = c; if (it.onKb) it.onKb(it.kb); };
  it.kb = 0; it.setBend(0);
  const leakM = addGlow(0xff3a20, 0.8); const leaks = []; for (let i = 0; i < 10; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.0018, 6, 4), leakM); m.visible = false; m.userData.noHit = true; g.add(m); leaks.push(m); }
  const card = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 0.05), paint(0xf2f0ea, 0.9)); g.add(card); const spot = new THREE.Mesh(new THREE.CircleGeometry(0.006, 20), new THREE.MeshBasicMaterial({ color: 0xff2a14, transparent: true, toneMapped: false, blending: THREE.AdditiveBlending, depthWrite: false })); g.add(spot);
  const rd = liveSign(0.06, 6.5); rd.position.set(O.x + 0.1, BY + 0.2, O.z - 0.12); g.add(rd);
  const zb = zoomBubble({ at: V(O.x - 0.3, BY + 0.2, O.z + 0.05), r: 0.07, fov: 24 }); zb.visible = false; g.add(zb); it.bubble = zb;
  Object.assign(it, { R: 0, T: 0, r: 0, held: 0, pipeOut: 0, leak: 0, reached: 0 });
  it.setI = (k) => { it.ki = clamp01(k); it.i = (5 + it.ki * 75) * DEG; if (it.onKi) it.onKi(it.ki); };
  it.setOn = (v) => { it.on = v; sfx(o.app, 'click'); };
  it.toPipe = (cb) => { it.mode = 'pipe'; it.on = true; if (cb) cb(); return true; };
  it.say = (l, c) => rd.set(l, c); it.ki = 0; it.setI((20 - 5) / 75);
  ticker(it, (dt) => {
    beams.begin();
    if (it.mode === 'block') { const i = it.i, dIn = V(-Math.sin(i), 0, -Math.cos(i)); const L = O.clone().addScaledVector(dIn, -RL); lz.position.copy(L); lz.rotation.set(0, Math.atan2(-dIn.x, -dIn.z) + Math.PI, 0); lz.position.y = BY + 0.002;
      if (it.on) { const s = N_GLASS * Math.sin(i); it.R = fresnelR(i, N_GLASS, 1); it.T = 1 - it.R; const P0 = L.clone().addScaledVector(dIn, 0.03); P0.y = O.y + 0.009;
        const Oy = O.clone(); Oy.y = O.y + 0.009; beams.seg(P0, Oy, 0.003, 1);
        const dR = V(-Math.sin(i), 0, Math.cos(i)); beams.seg(Oy, Oy.clone().addScaledVector(dR, 0.17), 0.003, 0.25 + 0.75 * it.R);
        if (s < 1) { it.r = Math.asin(s); const dT = V(-Math.sin(it.r), 0, -Math.cos(it.r)); beams.seg(Oy, Oy.clone().addScaledVector(dT, 0.17), 0.003, Math.max(0.05, it.T)); } else { it.r = null; it.T = 0; it.R = 1; }
        const ideg = i / DEG; it.reached = Math.max(it.reached, ideg);
        it.say([`${W('angle of incidence')} i = ${ideg.toFixed(1)}° · ${it.r != null ? `${W('angle of refraction')} r = ${(it.r / DEG).toFixed(1)}°` : W('no refracted ray')}`, `${W('reflected')} ${Math.round(it.R * 100)} % · ${W('out into the air')} ${Math.round(it.T * 100)} % · ${W('critical angle')} ${CRIT.toFixed(1)}°`], [YEL, it.r == null ? OKC : WHT]); }
      else it.say([W('Switch the laser on'), `i = ${(i / DEG).toFixed(1)}°`], [WHT, WHT]);
      core.material.opacity = 0; spot.visible = false; for (const m of leaks) m.visible = false; card.visible = false; }
    else { // the laser aimed into the light pipe
      const c = it.pipeCurve, p0 = c.getPointAt(0), d0 = c.getTangentAt(0); lz.position.copy(p0).addScaledVector(d0, -0.045); lz.position.y = BY + 0.002; lz.rotation.set(0, Math.atan2(d0.x, d0.z) + Math.PI, 0);
      it.leak = pipeLeak(it.Rb, a); it.pipeOut = (1 - it.leak) * 0.92; core.material.opacity = 0.75; beams.seg(lz.position.clone().setY(PO.y).addScaledVector(d0, 0.03), p0, 0.003, 1);
      // leaks: glowing points on the outside of the bend, as many as the light that escapes
      const nL = Math.round(it.leak * 10); leaks.forEach((m, k) => { m.visible = k < nL; if (m.visible) { const u = 0.38 + 0.24 * (k + 0.5) / 10, p = c.getPointAt(u), tn = c.getTangentAt(u); const out = V(tn.z, 0, -tn.x); m.position.copy(p).addScaledVector(out, a * 1.1 + 0.002 * Math.random()); m.scale.setScalar(0.8 + Math.random() * 0.6); } });
      const e = c.getPointAt(1), te = c.getTangentAt(1); card.visible = true; card.position.copy(e).addScaledVector(te, 0.06); card.lookAt(e); spot.visible = true; spot.position.copy(card.position).addScaledVector(te, -0.001); spot.lookAt(e); spot.scale.setScalar(0.6 + it.pipeOut * 1.2); spot.material.opacity = it.pipeOut;
      beams.seg(e, card.position.clone(), 0.0035, 0.4 * it.pipeOut);
      it.say([`${W('bend radius')} ${(it.Rb * 1000).toFixed(0)} mm (${W('rod radius')} 4 mm)`, `${W('light that comes out at the end')} ${Math.round(it.pipeOut * 100)} % · ${W('escapes at the bend')} ${Math.round(it.leak * 100)} %`], [WHT, it.leak > 0.05 ? RED : OKC]); }
    beams.end(); });
  it.anglePath = benchPath(O.x - 0.12, O.x + 0.12, O.z + 0.22); it.bendPath = benchPath(PO.x - 0.02, PO.x + 0.18, PO.z + 0.16); it.swAt = V(O.x - 0.2, BY + 0.03, O.z + 0.14);
  it.views = { all: { p: V(-0.02, BY + 0.62, -0.18), t: V(0.0, BY + 0.02, -0.72) }, block: { p: V(-0.12, BY + 0.52, -0.38), t: V(-0.12, BY + 0.0, -0.75) }, pipe: { p: V(0.2, BY + 0.5, -0.32), t: V(0.2, BY + 0.0, -0.72) } };
  it.camView = it.views.all; mergeStatic(g, [blk]);
  return it;
}
export function bindTir(tb, angK, bendK, swK, app, s, done = {}) {
  const on = (k) => (Array.isArray(s[k]) ? s[k] : [s[k]]).some((i) => stepNow(app, i));
  const s1 = slideKnob(angK, { path: () => tb.anglePath(), active: () => on('angle'), keepVisible: () => on('angle'), k: () => tb.ki, set: (k) => tb.setI(k) });
  const s2 = slideKnob(bendK, { path: () => tb.bendPath(), active: () => on('bend'), keepVisible: () => on('bend'), k: () => tb.kb, set: (k) => tb.setBend(k) });
  tb.onKi = () => s1(); tb.onKb = () => s2();
  pushKnob(swK, { path: pressPath(tb.swAt, 0.03), active: () => on('switch') || on('pipe'), keepVisible: () => on('switch') || on('pipe'), press: () => (on('pipe') ? tb.toPipe() : tb.setOn(!tb.on)) });
  let hold = 0; const u0 = tb.update; tb.update = (dt, t) => { u0(dt, t); const ideg = tb.i / DEG;
    if (on('switch') && tb.on && done.on) done.on();
    if (on('crit')) { hold = Math.abs(ideg - CRIT) < 0.9 ? hold + dt : 0; if (hold > 0.8 && done.crit) done.crit(); }
    if (on('tir') && ideg > 50 && tb.on && done.tir) done.tir();
    if (on('pipe') && tb.mode === 'pipe' && done.pipe) done.pipe();
    if (on('bend') && tb.Rb < 0.013 && tb.leak > 0.2 && done.bend) done.bend();
    if (app.runner.i >= (s.bubble ?? 99) && !tb.bubble.visible) { const Oc = tb.O.clone().add(V(0, 0.01, 0)); tb.bubble.look(Oc, Oc.clone().add(V(0.02, 0.09, 0.06)), tb.W('At the flat face: the ray inside the glass')); } };
}

// ------------------------------------------------------------------ Class 10 Ch 10: why the sky is blue and the Sun red at sunset
// A glass tank (42 cm) of clear water, a torch at one end, a white card at the other, a black cloth behind. Milk is added
// 1 mL at a time. Scattering β(λ) = 0.52 per mL per metre × (550/λ)⁴ (R 650, G 550, B 450 nm). Then outside: the Sun's light
// crosses the air (Rayleigh optical depth 0.224, 0.098, 0.050 at 450, 550, 650 nm, overhead) × air mass.
const LAM = [650, 550, 450]; export const betaMilk = (ml) => LAM.map((l) => 0.52 * ml * Math.pow(550 / l, 4));
export const TAU_AIR = [0.0504, 0.098, 0.224]; export const airMass = (elevDeg) => { const z = 90 - elevDeg; return 1 / (Math.cos(z * DEG) + 0.50572 * Math.pow(96.07995 - z, -1.6364)); };
export function skyTank(o = {}) {
  const it = rig('pwsxsky', { en: 'Glass tank of water, torch, milk and a white card', hi: 'पानी का काँच का टैंक, टॉर्च, दूध और सफ़ेद कार्ड', hg: 'Paani ka glass tank, torch, doodh aur safed card' }, o); const g = it.g, W = it.W;
  const C = V(0.0, BY, -0.74), LX = 0.42, HY = 0.16, DZ = 0.15, WY = 0.13;
  const tank = new THREE.Mesh(new THREE.BoxGeometry(LX, HY, DZ), glassMat({ opacity: 0.1, edge: 0.6 })); tank.position.copy(C).add(V(0, HY / 2 + 0.004, 0)); tank.renderOrder = 6; g.add(tank);
  box(g, paint(0x1d2024, 0.4), LX + 0.02, 0.008, DZ + 0.02, C.x, BY + 0.004, C.z);
  const waterM = new THREE.MeshStandardMaterial({ color: 0xcfe3ee, roughness: 0.1, transparent: true, opacity: 0.12, depthWrite: false }); const water = new THREE.Mesh(new THREE.BoxGeometry(LX - 0.006, WY, DZ - 0.006), waterM); water.position.copy(C).add(V(0, 0.008 + WY / 2, 0)); water.renderOrder = 5; g.add(water);
  const back = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.42), new THREE.MeshStandardMaterial({ color: 0x0b0b0d, roughness: 1 })); back.position.set(C.x, BY + 0.21, C.z - 0.16); g.add(back); box(g, iron(), 0.012, 0.42, 0.012, C.x - 0.45, BY + 0.21, C.z - 0.165); box(g, iron(), 0.012, 0.42, 0.012, C.x + 0.45, BY + 0.21, C.z - 0.165);
  // the torch (Poly Haven, CC0) on a block at the left, the card on a stand at the right
  const TZ = C.z, TY = BY + 0.008 + WY * 0.55; box(g, wood('#6e4526'), 0.12, TY - BY - 0.02, 0.05, C.x - LX / 2 - 0.1, (TY - 0.02 + BY) / 2, TZ);
  fitModel('models/small_plastic_torch.glb', g, { rot: [0, Math.PI / 2, 0], l: 0.045, w: 0.13, at: [C.x - LX / 2 - 0.08, TY, TZ], pin: [0.5, 0.5, 0.5] });
  const lens = new THREE.Mesh(new THREE.CircleGeometry(0.016, 20), glow(0xfff6e0)); lens.rotation.y = Math.PI / 2; lens.position.set(C.x - LX / 2 - 0.013, TY, TZ); lens.visible = false; g.add(lens);
  const cardX = C.x + LX / 2 + 0.07; box(g, iron(), 0.05, 0.006, 0.05, cardX, BY + 0.003, TZ); const cardM = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.12), paint(0xf4f3ee, 0.95)); cardM.rotation.y = -Math.PI / 2; cardM.position.set(cardX, BY + 0.066, TZ); g.add(cardM);
  const spot = new THREE.Mesh(new THREE.CircleGeometry(0.022, 28), new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false })); spot.rotation.y = -Math.PI / 2; spot.position.set(cardX - 0.001, TY, TZ); g.add(spot);
  // the beam in the water: a soft glowing rod; its colour along the tank comes from the scattering (a few segments)
  const NB = 14, segL = (LX - 0.01) / NB; const segs = []; for (let i = 0; i < NB; i++) { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, segL, 12, 1, true), new THREE.MeshBasicMaterial({ color: 0, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })); m.rotation.z = Math.PI / 2; m.position.set(C.x - LX / 2 + 0.005 + (i + 0.5) * segL, TY, TZ); m.renderOrder = 7; g.add(m); segs.push(m); }
  const air1 = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, cardX - (C.x + LX / 2), 10, 1, true), new THREE.MeshBasicMaterial({ color: 0, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })); air1.rotation.z = Math.PI / 2; air1.position.set((C.x + LX / 2 + cardX) / 2, TY, TZ); g.add(air1);
  // a beaker of milk with a dropper
  const bk = lathe([[0, 0], [0.026, 0], [0.027, 0.06], [0.029, 0.062], [0, 0.062]], glassMat({ opacity: 0.12 }), 28); bk.position.set(C.x + 0.3, BY, C.z + 0.14); g.add(bk); const milk = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.04, 24), plastic(0xf6f3ea)); milk.position.set(C.x + 0.3, BY + 0.021, C.z + 0.14); g.add(milk);
  const drp = new THREE.Group(); drp.position.set(C.x + 0.3, BY + 0.05, C.z + 0.14); g.add(drp); drp.add(rod(V(0, 0, 0), V(0, 0.09, 0), 0.0035, glassMat({ opacity: 0.25 }))); const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.008, 14, 10).scale(1, 1.6, 1), plastic(0xc0392b)); bulb.position.y = 0.1; drp.add(bulb);
  // the chart of the light that gets through, and a little diagram of the Sun's path through the air
  const chart = canvasBoard(0.26, 0.17); chart.position.set(C.x + 0.0, BY + 0.38, C.z - 0.1); g.add(chart);
  const rd = liveSign(0.055, 6.5); rd.position.set(C.x, BY + 0.27, C.z - 0.1); g.add(rd);
  Object.assign(it, { on: false, ml: 0, T: [1, 1, 1], side: [0, 0, 0], where: 'lab', hour: 12, elev: 75 });
  it.setOn = (v) => { it.on = v; lens.visible = v; sfx(o.app, 'click'); };
  it.addMilk = (cb) => { if (it.busy) return false; it.play(0.7, (k) => { drp.position.set(lerp(C.x + 0.3, C.x + 0.06, ease(clamp01(k * 2))), BY + 0.05 + Math.sin(Math.PI * k) * 0.12 + (k > 0.5 ? 0.05 : 0), lerp(C.z + 0.14, C.z, ease(clamp01(k * 2)))); bulb.scale.y = k > 0.5 && k < 0.8 ? 0.6 : 1; },
    () => { it.ml += 1; drp.position.set(C.x + 0.3, BY + 0.05, C.z + 0.14); if (it.onMilk) it.onMilk(); if (cb) cb(); }); return true; };
  const toRGB = (v) => new THREE.Color(Math.min(1, v[0]), Math.min(1, v[1]), Math.min(1, v[2]));
  const drawChart = () => chart.draw((x, w, h) => { x.fillStyle = 'rgba(12,16,24,0.88)'; x.beginPath(); x.roundRect(0, 0, w, h, 26); x.fill(); x.fillStyle = '#ffffff'; x.font = `700 22px ${FONT}`; x.textAlign = 'left';
    const outside = it.where !== 'lab'; x.fillText(outside ? W('Sunlight that crosses the air') : W('Light that reaches the card'), 20, 34);
    const cols = ['#ff4d3a', '#4fd36a', '#4f8dff'], names = [W('red'), W('green'), W('blue')]; const T = it.T;
    for (let k = 0; k < 3; k++) { const y = 60 + k * 50; x.fillStyle = '#cfd6de'; x.font = `600 20px ${FONT}`; x.fillText(names[k], 20, y + 22); x.fillStyle = 'rgba(255,255,255,0.12)'; x.fillRect(110, y, w - 220, 30); x.fillStyle = cols[k]; x.fillRect(110, y, (w - 220) * clamp01(T[k]), 30); x.fillStyle = '#ffffff'; x.fillText(`${Math.round(T[k] * 100)} %`, w - 100, y + 22); }
    x.fillStyle = '#ffd23f'; x.font = `700 20px ${FONT}`; x.fillText(outside ? `${W('Sun')} ${it.elev.toFixed(1)}° ${W('up')} · ${W('air crossed')} ${airMass(Math.max(0, it.elev)).toFixed(1)} ×` : `${W('milk')}: ${it.ml} mL`, 20, h - 18);
    if (outside) { const cx = w - 70, cy = h - 18; x.strokeStyle = '#7cc4ff'; x.lineWidth = 3; x.beginPath(); x.arc(cx, cy + 300, 300, -Math.PI / 2 - 0.25, -Math.PI / 2 + 0.25); x.stroke(); } });
  it.say = (l, c) => rd.set(l, c);
  let lastKey = ''; ticker(it, (dt) => {
    if (it.where === 'lab') { const b = betaMilk(it.ml), Lw = LX - 0.01; it.T = b.map((x) => Math.exp(-x * Lw) * 0.98);
      // side view: light scattered towards the eye from each piece of the beam: β·e^(−βx) (with a little from the water itself)
      segs.forEach((m, i) => { const xx = (i + 0.5) * segL; const c = b.map((bb) => (it.on ? (0.012 + bb * 0.09) * Math.exp(-bb * xx) : 0)); m.material.color.setRGB(c[0] * 1.6, c[1] * 1.6, c[2] * 1.6); m.visible = it.on; });
      const side = b.map((bb) => bb * Math.exp(-bb * 0.05)); const mx = Math.max(...side, 1e-6); it.side = side.map((v) => v / mx);
      spot.material.color.copy(toRGB(it.on ? it.T : [0.05, 0.05, 0.05])); air1.material.color.setRGB(it.T[0] * 0.15, it.T[1] * 0.15, it.T[2] * 0.15); air1.visible = it.on;
      // the water itself turns milky (white-bluish from the side)
      waterM.opacity = 0.12 + Math.min(0.5, it.ml * 0.025); waterM.color.setRGB(0.82 + 0.1 * Math.min(1, it.ml / 10), 0.88 + 0.08 * Math.min(1, it.ml / 10), 0.94 + 0.05 * Math.min(1, it.ml / 10));
      const key = `${it.ml}|${it.on}`; if (key !== lastKey) { lastKey = key; drawChart(); }
      const hue = it.T[0] > 0 ? it.T[2] / it.T[0] : 0; const sc = it.side;
      it.say([it.on ? `${W('milk')} ${it.ml} mL · ${W('from the side the beam looks')} ${it.ml === 0 ? W('almost invisible') : sc[2] > 0.8 && sc[0] < 0.5 ? W('bluish') : W('whitish')}` : W('Switch the torch on'), it.on ? `${W('the spot on the card is')} ${hue > 0.75 ? W('white') : hue > 0.35 ? W('yellow') : hue > 0.1 ? W('orange') : W('orange-red')}` : ''], [WHT, hue < 0.35 ? '#ffb46b' : WHT]); }
    else { const am = airMass(Math.max(0, it.elev)); it.T = TAU_AIR.map((t) => Math.exp(-t * am)); const key = `sky|${it.elev.toFixed(1)}`; if (key !== lastKey) { lastKey = key; drawChart(); }
      const hue = it.T[2] / it.T[0]; it.say([`${W('time')} ${Math.floor(it.hour)}:${String(Math.round((it.hour % 1) * 60)).padStart(2, '0')} · ${W('Sun')} ${it.elev.toFixed(1)}° ${W('above the horizon')}`, `${W('the Sun looks')} ${hue > 0.75 ? W('white') : hue > 0.35 ? W('yellow') : hue > 0.1 ? W('orange') : W('red')} · ${W('the sky overhead stays blue')}`], [WHT, hue < 0.35 ? '#ffb46b' : WHT]); } });
  // outside: the same table in a real place; the clock from noon to sunset (23° N in October: noon Sun 64° up, sunset 17:40)
  it.goOut = async (where) => { const app = o.app; if (!app || !app.setWorld) return; app.setWorld(true); await app.places.set(where, { table: true }); it.where = where; lastKey = ''; tank.visible = water.visible = !1; for (const m of [...segs, air1, spot, lens, back]) m.visible = false; drp.visible = bk.visible = milk.visible = false; };
  it.setHour = (k) => { it.kh = clamp01(k); it.hour = 12 + it.kh * 5.75; const H = (it.hour - 12) * 15 * DEG, lat = 23 * DEG, dec = -8 * DEG; it.elev = Math.asin(Math.sin(lat) * Math.sin(dec) + Math.cos(lat) * Math.cos(dec) * Math.cos(H)) / DEG; if (it.onKh) it.onKh(it.kh); };
  it.kh = 0; it.setHour(0); drawChart();
  it.milkAt = V(C.x + 0.06, BY + 0.2, C.z); it.swAt = V(C.x - LX / 2 - 0.1, BY + 0.08, TZ + 0.06); it.hourPath = benchPath(C.x - 0.15, C.x + 0.2, C.z + 0.32);
  it.views = { all: { p: V(0.0, BY + 0.5, -0.06), t: V(0.0, BY + 0.12, -0.74) }, side: { p: V(0.02, BY + 0.28, -0.3), t: V(0.0, BY + 0.08, -0.76) }, card: { p: V(0.06, BY + 0.3, -0.32), t: V(0.2, BY + 0.08, -0.74) },
    noon: { p: V(0.0, BY + 0.5, 0.2), t: V(-0.2, BY + 3.0, -2.2) }, sunset: { p: V(-0.3, BY + 0.6, -0.1), t: V(0.81 * 4, BY + 0.3, 0.59 * 4) } };
  it.camView = it.views.all; mergeStatic(g, [spot, lens, cardM, back]);
  return it;
}
export function bindSky(sk, swK, milkK, hourK, app, s, done = {}) {
  const on = (k) => (Array.isArray(s[k]) ? s[k] : [s[k]]).some((i) => stepNow(app, i));
  pushKnob(swK, { path: pressPath(sk.swAt, 0.03), active: () => on('switch'), keepVisible: () => on('switch'), press: () => sk.setOn(!sk.on) });
  pushKnob(milkK, { path: pressPath(sk.milkAt, 0.04), active: () => on('milk') && !sk.busy, keepVisible: () => on('milk'), press: () => sk.addMilk() });
  const s1 = slideKnob(hourK, { path: () => sk.hourPath(), active: () => on('hour'), keepVisible: () => on('hour'), k: () => sk.kh, set: (k) => { sk.setHour(k); if (sk.elev < 10 && sk.where !== 'sunset' && !sk.going) { sk.going = true; sk.goOut('sunset').then(() => { sk.going = false; }); } } });
  sk.onKh = () => s1();
  const u0 = sk.update; sk.update = (dt, t) => { u0(dt, t);
    if (on('switch') && sk.on && done.on) done.on();
    if (on('blue') && sk.on && sk.ml >= 3 && done.blue) done.blue();
    if (on('red') && sk.on && sk.T[2] / sk.T[0] < 0.12 && done.red) done.red();
    if (on('hour') && sk.where === 'sunset' && sk.elev < 4 && done.sunset) done.sunset(); };
}

// ------------------------------------------------------------------ Class 7 (6, 8): Newton's colour disc
// A disc with the seven colours of the rainbow (sectors in Newton's proportions) on an electric spinner with a speed dial.
// The eye keeps each image for about 1/16 s, so at f turns a second each point of the disc is seen as the average of the
// paint it swept through in that time (angle 2π·f/16): at 16 turns a second or more, all seven at once.
const SECT = [['#d7262b', 60], ['#f07f22', 40], ['#f5d327', 50], ['#2e9f48', 60], ['#2a78c8', 50], ['#3b3c9a', 40], ['#7b3f98', 60]];
export const PERSIST = 1 / 16;
export function colourDisc(o = {}) {
  const it = rig('pwsxdisc', { en: 'Newton\'s colour disc on a spinner', hi: 'स्पिनर पर न्यूटन की रंग डिस्क', hg: 'Spinner par Newton ki colour disc' }, o); const g = it.g, W = it.W;
  const C = V(-0.05, BY + 0.17, -0.75), RD = 0.1;
  // base, pillar and motor housing
  box(g, paint(0x2f3337, 0.35), 0.16, 0.02, 0.12, C.x, BY + 0.01, C.z - 0.03); g.add(rod(V(C.x, BY + 0.02, C.z - 0.06), V(C.x, C.y - 0.03, C.z - 0.06), 0.009, steel()));
  const mot = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.06, 28), paint(0x4a5f7a, 0.35)); mot.rotation.x = Math.PI / 2; mot.position.set(C.x, C.y, C.z - 0.045); g.add(mot);
  const dt0 = canvasTex(1024, 1024, (x, w, h) => { let a = -Math.PI / 2; for (const [c, deg] of SECT) { x.fillStyle = c; x.beginPath(); x.moveTo(w / 2, h / 2); x.arc(w / 2, h / 2, w / 2, a, a + deg * DEG); x.closePath(); x.fill(); a += deg * DEG; } x.fillStyle = '#e8e4da'; x.beginPath(); x.arc(w / 2, h / 2, 34, 0, TAU); x.fill(); });
  const discM = new THREE.MeshStandardMaterial({ map: dt0, roughness: 0.7 }); const U = { uBlur: { value: 0 } };
  discM.onBeforeCompile = (sh) => { sh.uniforms.uBlur = U.uBlur; sh.fragmentShader = 'uniform float uBlur;\n' + sh.fragmentShader.replace('#include <map_fragment>', `
    #ifdef USE_MAP
      vec2 q = vMapUv - 0.5; float rr = length(q), a0 = atan(q.y, q.x); vec4 acc = vec4(0.0);
      for (int k = 0; k < 24; k++) { float a = a0 + uBlur * (float(k) + 0.5) / 24.0; acc += texture2D(map, 0.5 + rr * vec2(cos(a), sin(a))); }
      diffuseColor *= acc / 24.0;
    #endif`); };
  discM.customProgramCacheKey = () => 'pwsx-disc';
  const disc = new THREE.Mesh(new THREE.CircleGeometry(RD, 72), discM); disc.position.copy(C); g.add(disc); const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.012, 16), steel()); hub.rotation.x = Math.PI / 2; hub.position.copy(C).add(V(0, 0, 0.004)); g.add(hub);
  // average paint colour (what a fully blended disc shows) and a white card to compare
  const avg = (() => { const lin = (c) => { const v = parseInt(c.slice(1), 16); return [(v >> 16) & 255, (v >> 8) & 255, v & 255].map((x) => Math.pow(x / 255, 2.2)); }; const s = [0, 0, 0]; for (const [c, d] of SECT) lin(c).forEach((x, i) => { s[i] += x * d / 360; }); return s.map((x) => Math.pow(x, 1 / 2.2)); })(); it.avg = avg;
  const cardG = new THREE.Group(); const cm = new THREE.Mesh(new THREE.PlaneGeometry(0.08, 0.11), paint(0xf6f5f0, 0.9)); cm.position.y = 0.055; cardG.add(cm); cardG.traverse((m) => { m.userData.noHit = true; });
  it.card = thing({ en: 'White card', hi: 'सफ़ेद कार्ड', hg: 'Safed card' }, cardG, { hitR: 0.05, hitY: 0.05 }); it.cardAt = V(C.x + 0.17, BY + 0.11, C.z);
  const rd = liveSign(0.055, 6.5); rd.position.set(C.x + 0.03, C.y + 0.17, C.z); g.add(rd);
  Object.assign(it, { f: 0, kf: 0, ang: 0, maxF: 0, cardOn: false });
  it.setF = (k) => { it.kf = clamp01(k); it.f = it.kf < 0.02 ? 0 : it.kf * 30; it.maxF = Math.max(it.maxF, it.f); if (it.onKf) it.onKf(it.kf); };
  it.putCard = (cb) => { it.card.flying = true; flyT(it.card, it.cardAt.clone(), 0, 0.6, () => { it.card.flying = false; it.cardOn = true; it.card.placed = true; if (cb) cb(); }); return true; };
  it.say = (l, c) => rd.set(l, c);
  ticker(it, (dt) => { it.ang = (it.ang + dt * it.f * TAU) % TAU; disc.rotation.z = -it.ang; U.uBlur.value = Math.min(TAU, TAU * it.f * PERSIST); sfx; const fused = it.f * PERSIST >= 1;
    it.say([`${W('speed')} ${it.f.toFixed(1)} ${W('turns a second')} (${Math.round(it.f * 60)} rpm)`, it.f === 0 ? W('Turn the speed dial') : fused ? W('the colours have merged: the disc looks whitish grey') : it.f < 3 ? W('you can see each colour go round') : W('the colours smear into one another')], [WHT, fused ? OKC : YEL]); });
  it.speedPath = benchPath(C.x - 0.08, C.x + 0.16, C.z + 0.2);
  it.views = { all: { p: V(C.x + 0.03, BY + 0.34, C.z + 0.52), t: V(C.x + 0.03, C.y - 0.01, C.z) } }; it.camView = it.views.all; mergeStatic(g, [disc, hub]);
  return it;
}
export function bindDisc(cd, speedK, app, s, done = {}) {
  const on = (k) => (Array.isArray(s[k]) ? s[k] : [s[k]]).some((i) => stepNow(app, i));
  const s1 = slideKnob(speedK, { path: () => cd.speedPath(), active: () => on('speed'), keepVisible: () => on('speed'), k: () => cd.kf, set: (k) => cd.setF(k) }); cd.onKf = () => s1();
  carry(cd.card, [{ at: () => cd.cardAt.clone(), r: 0.08, open: () => on('card'), put: () => cd.putCard(() => done.card && done.card()) }], { carryY: BY + 0.15 });
  const st = { slow: 0, fast: 0 }; const u0 = cd.update; cd.update = (dt, t) => { u0(dt, t);
    if (on('slow')) { st.slow = cd.f > 0.5 && cd.f < 5 ? st.slow + dt : 0; if (st.slow > 1.5 && done.slow) done.slow(); }
    if (on('fast')) { st.fast = cd.f >= 16 ? st.fast + dt : 0; if (st.fast > 1.5 && done.fast) done.fast(); } };
}

// ------------------------------------------------------------------ Class 8 (7): regular and diffuse reflection
// A laser comb (five parallel beams 1 cm apart) on a black board, aimed at 40° at a holder where the student puts a mirror
// strip, a sheet of white paper, crumpled aluminium foil or a piece of cotton cloth. Each beam reflects by i = r from the
// little slope of the surface where it lands (a profile for each material, seeded), and paper and cloth also send light
// every way (a fan of faint rays); cloth absorbs most of it.
const SURF = { mirror: { amp: 0, ab: 0.05, diff: 0 }, paper: { amp: 34, ab: 0.2, diff: 0.75, len: 0.0006 }, foil: { amp: 26, ab: 0.15, diff: 0.1, len: 0.004 }, cloth: { amp: 50, ab: 0.75, diff: 0.9, len: 0.0008 } };
export const SURF_NAMES = { mirror: { en: 'Mirror strip', hi: 'दर्पण की पट्टी', hg: 'Mirror strip' }, paper: { en: 'White paper', hi: 'सफ़ेद काग़ज़', hg: 'Safed kaagaz' }, foil: { en: 'Crumpled aluminium foil', hi: 'मुड़ी-तुड़ी एल्युमिनियम पन्नी', hg: 'Mudi-tudi aluminium foil' }, cloth: { en: 'Cotton cloth', hi: 'सूती कपड़ा', hg: 'Cotton ka kapda' } };
export function reflectBench(o = {}) {
  const it = rig('pwsxrefl', { en: 'Laser comb, mirror, paper, foil and cloth', hi: 'लेज़र कंघी, दर्पण, काग़ज़, पन्नी और कपड़ा', hg: 'Laser comb, mirror, paper, foil aur kapda' }, o); const g = it.g, W = it.W;
  const O = V(0.0, BY + 0.012, -0.76); opticsBoard(g, O, 0.5, 0.36, 0.14); it.O = O; const beams = beamPool(g, 0xff2a14);
  // the holder: a black block with a slot; the sample stands in it, facing the student (+z), along x
  box(g, paint(0x1a1c1f, 0.5), 0.12, 0.012, 0.018, O.x, BY + 0.012, O.z - 0.012);
  const comb = laserBox(); comb.scale.set(2.4, 1, 1); g.add(comb); const I0 = 40 * DEG, dirIn = V(Math.sin(I0), 0, -Math.cos(I0)); comb.position.copy(O).addScaledVector(dirIn, -0.2).setY(BY + 0.002); comb.rotation.y = Math.atan2(-dirIn.x, -dirIn.z) + Math.PI;
  // the samples (carried things)
  const mk = (k) => { const gg = new THREE.Group(); let m;
    if (k === 'mirror') { m = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.03, 0.004), [steel(), steel(), steel(), steel(), mat('mirr', () => new THREE.MeshStandardMaterial({ color: 0xf2f6f8, metalness: 1, roughness: 0.02 })), paint(0x2a2a2a)]); }
    else if (k === 'paper') m = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.03, 0.001), paint(0xf6f4ee, 0.95));
    else if (k === 'foil') { const gm = new THREE.PlaneGeometry(0.1, 0.03, 30, 10); const p = gm.attributes.position, r = rnd(3); for (let i = 0; i < p.count; i++) p.setZ(i, (r() - 0.5) * 0.004 + Math.sin(p.getX(i) * 260) * 0.0015); gm.computeVertexNormals(); m = new THREE.Mesh(gm, mat('foilc', () => new THREE.MeshStandardMaterial({ color: 0xdfe2e4, metalness: 1, roughness: 0.25, side: THREE.DoubleSide }))); }
    else { m = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.03, 0.002), new THREE.MeshStandardMaterial({ map: canvasTex(128, 64, (x) => { x.fillStyle = '#26406b'; x.fillRect(0, 0, 128, 64); x.strokeStyle = 'rgba(255,255,255,0.08)'; for (let i = 0; i < 128; i += 3) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, 64); x.stroke(); } for (let j = 0; j < 64; j += 3) { x.beginPath(); x.moveTo(0, j); x.lineTo(128, j); x.stroke(); } }), roughness: 1 })); }
    m.position.y = 0.015; gg.add(m); gg.traverse((x) => { x.userData.noHit = true; if (x.isMesh) x.castShadow = true; });
    const t = thing(SURF_NAMES[k], gg, { hitR: 0.045, hitY: 0.015, height: 0.03 }); t.surf = k; return t; };
  it.samples = ['mirror', 'paper', 'foil', 'cloth'].map(mk); it.holderAt = V(O.x, BY + 0.012, O.z - 0.002); it.in = null;
  // a magnified side view of the surface (a profile, and the five beams reflecting from it)
  const mag = canvasBoard(0.24, 0.12); mag.position.set(O.x + 0.0, BY + 0.24, O.z - 0.2); g.add(mag);
  const rd = liveSign(0.05, 6.5); rd.position.set(O.x, BY + 0.34, O.z - 0.2); g.add(rd);
  Object.assign(it, { on: false, spread: 0, out: 0, tried: {} });
  // the profile of a material: slope (degrees) at position u along the strip, seeded so it stays the same
  const slopeAt = (k, u) => { const S = SURF[k]; if (!S.amp) return 0; const r = rnd(k.length * 31); let a = 0; for (let j = 1; j <= 6; j++) { const f = (j * 0.7 + r()) / S.len, ph = r() * TAU; a += Math.sin(u * f * 0.02 + ph) / j; } return S.amp * a / 1.8; };
  it.place = (t, cb) => { if (it.in && it.in !== t) { const old = it.in; old.flying = true; flyT(old, old.home.p.clone(), 0, 0.6, () => { old.flying = false; old.placed = false; }); } it.in = t; t.flying = true; flyT(t, it.holderAt.clone(), 0, 0.6, () => { t.flying = false; t.placed = true; it.tried[t.surf] = true; if (cb) cb(); }); return true; };
  it.setOn = (v) => { it.on = v; sfx(o.app, 'click'); };
  it.say = (l, c) => rd.set(l, c);
  let lastK = ''; ticker(it, () => { beams.begin(); const k = it.in && !it.in.flying ? it.in.surf : null; const outs = [];
    if (it.on) { const nrm = V(0, 0, 1), side = V(1, 0, 0); for (let b = 0; b < 5; b++) { const off = (b - 2) * 0.012; const hit = O.clone().addScaledVector(side, off / Math.cos(I0)); hit.y = BY + 0.0095; const src = hit.clone().addScaledVector(dirIn, -0.2);
        beams.seg(src, k ? hit : hit.clone().addScaledVector(dirIn, 0.12), 0.0026, 1); if (!k) continue;
        const S = SURF[k]; const sl = slopeAt(k, off * 1000) * DEG; const n = nrm.clone().applyAxisAngle(V(0, 1, 0), sl); const d = dirIn.clone().sub(n.clone().multiplyScalar(2 * dirIn.dot(n))); if (d.z < 0.05) d.z = 0.05; d.normalize();
        const op = (1 - S.ab) * (1 - S.diff * 0.8); beams.seg(hit, hit.clone().addScaledVector(d, 0.17), 0.0026, op); outs.push(Math.atan2(d.x, d.z) / DEG);
        if (S.diff > 0) { const r = rnd(b * 7 + 3); for (let j = 0; j < 7; j++) { const a = (r() - 0.5) * 170 * DEG; const dd = V(Math.sin(a), 0, Math.cos(a)); beams.seg(hit, hit.clone().addScaledVector(dd, 0.06 + r() * 0.06), 0.0016, 0.18 * S.diff * (1 - S.ab)); } } } }
    beams.end(); const mean = outs.length ? outs.reduce((a, b) => a + b, 0) / outs.length : 0; it.spread = outs.length ? Math.sqrt(outs.reduce((a, b) => a + (b - mean) ** 2, 0) / outs.length) : 0; it.out = k ? 1 - SURF[k].ab : 0;
    const key = `${k}|${it.on}`; if (key !== lastK) { lastK = key; mag.draw((x, w, h) => { x.fillStyle = 'rgba(12,16,24,0.9)'; x.beginPath(); x.roundRect(0, 0, w, h, 24); x.fill(); x.fillStyle = '#ffffff'; x.font = `700 20px ${FONT}`; x.textAlign = 'left'; x.fillText(k ? `${W('Under a magnifier')}: ${W(SURF_NAMES[k].en)}` : W('Put a surface in the holder'), 16, 30); if (!k) return;
      const y0 = h * 0.72; x.strokeStyle = k === 'cloth' ? '#5b7fc0' : k === 'paper' ? '#f2f0ea' : '#cfd4d8'; x.lineWidth = 4; x.beginPath(); let yy = y0; for (let px = 20; px <= w - 20; px += 2) { yy += Math.tan(slopeAt(k, (px - w / 2) / (w - 40) * 60) * DEG) * 2 * 0.6; yy = y0 + (yy - y0) * 0.96; px === 20 ? x.moveTo(px, yy) : x.lineTo(px, yy); } x.stroke();
      x.fillStyle = '#ffd23f'; x.font = `600 17px ${FONT}`; x.fillText(SURF[k].amp ? W('Rough: every bit faces a different way') : W('Smooth and flat: every bit faces the same way'), 16, h - 14); }); }
    it.say([k ? `${W(SURF_NAMES[k].en)}: ${it.spread < 1 ? W('the reflected beams stay parallel') : `${W('the reflected beams spread over')} ${Math.round(it.spread * 3.4)}°`}` : W('Put a surface in the holder'), it.on ? `${W('light sent back')} ${Math.round(it.out * 100)} %${k && SURF[k].diff > 0.5 ? ` · ${W('scattered in all directions')}` : ''}` : W('Switch the laser comb on')], [k && it.spread < 1 ? OKC : YEL, WHT]); });
  it.swAt = V(O.x - 0.3, BY + 0.03, O.z + 0.14);
  it.views = { all: { p: V(0.0, BY + 0.6, -0.2), t: V(0.0, BY + 0.06, -0.78) } }; it.camView = it.views.all;
  return it;
}
export function bindRefl(rb, swK, app, s, done = {}) {
  const on = (k) => (Array.isArray(s[k]) ? s[k] : [s[k]]).some((i) => stepNow(app, i));
  pushKnob(swK, { path: pressPath(rb.swAt, 0.03), active: () => on('switch'), keepVisible: () => on('switch'), press: () => rb.setOn(!rb.on) });
  for (const t of rb.samples) carry(t, [{ at: () => rb.holderAt.clone(), r: 0.07, open: () => true, put: (x) => rb.place(x) }], { carryY: BY + 0.12 });
  const u0 = rb.update; rb.update = (dt, t) => { u0(dt, t); const k = rb.in && !rb.in.flying ? rb.in.surf : null;
    for (const [step, surf] of Object.entries(s.surf || {})) if (stepNow(app, +step) && k === surf && rb.on && done.surf) done.surf(); };
}
