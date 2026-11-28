// DUET Science Lab 360, physics batch PW-SX: static charges. A Van de Graaff generator and a gold-leaf electroscope at the lab
// bench (Class 8), and lightning over a village with and without a lightning conductor (Class 8), in a real place under a
// storm sky (Poly Haven farm_road, CC0, darkened in code). The charges follow what the student does:
//  - the dome's charge Q grows with the belt's speed and leaks away (V = Q/C, C = 4πε₀R = 12 pF), corona keeps it under
//    300 kV, a spark jumps when V passes 30 kV per cm of the gap the student has left; the paper strips and foil cups move
//    with the charge;
//  - the electroscope's leaves carry αQ + γq (Q its own charge, q a rod held near it); touching shares charge, a finger
//    earths it (the leaves' charge goes to zero); rubbing gives a rod a charge from where the rod and cloth stand in the
//    triboelectric series (glass, wool, silk, ebonite);
//  - lightning goes to the highest point under the cloud: the rod if one is fitted, else the school's water tank.
import * as THREE from 'three';
import { canvasTex, glassMat } from './mats.js';
import { PLACES } from './places.js';
import * as P from './pwsx1.js';
const { V, BY, TAU, DEG, OKC, YEL, RED, WHT, BLU, rig, box, rod, lathe, post, mat, steel, brass, oldBrass, copper, iron, bake, plastic, paint, glow, addGlow, wood, ticker, mergeStatic, liveSign, tag, clamp01, ease, lerp, sfx, rnd, FONT, zoomBubble, stepNow, slideKnob, pushKnob, carry, flyT, thing, benchPath, pressPath, gloveHand } = P;

// ------------------------------------------------------------------ the village under a storm (a real place)
// farm_road (Poly Haven, CC0): a dirt road between fields under heavy overcast; turned so the road runs straight ahead
if (!PLACES.storm) PLACES.storm = { img: 'farm_road', h: 1.6, r: 60, yaw: 1.571, sun: [0.276, 0.961, 0.016], sunI: 0.9, sky: 0.55, env: 0.6, name: { en: 'Village in a storm', hi: 'तूफ़ान में गाँव', hg: 'Toofan mein gaon' } };

const alu = () => mat('alu', () => new THREE.MeshStandardMaterial({ color: 0xdfe3e6, metalness: 1, roughness: 0.14 }));
const acrylic = () => mat('acryl', () => new THREE.MeshStandardMaterial({ color: 0xe8f2f6, metalness: 0, roughness: 0.05, transparent: true, opacity: 0.22, depthWrite: false, side: THREE.DoubleSide }));
const foil = () => mat('foil', () => new THREE.MeshStandardMaterial({ color: 0xd9dcde, metalness: 1, roughness: 0.32, side: THREE.DoubleSide }));
const gold = () => mat('goldleaf', () => new THREE.MeshStandardMaterial({ color: 0xffc94d, metalness: 1, roughness: 0.22, side: THREE.DoubleSide }));
// a jagged spark between two points (a few kinks and a side branch), as one line strip of additive glow
function sparkGeo(a, b, seed, kinks = 9, jit = 0.08) { const r = rnd(seed), pts = [], d = b.clone().sub(a), L = d.length(); const n1 = V(0, 1, 0).cross(d).normalize(); if (n1.lengthSq() < 0.1) n1.set(1, 0, 0); const n2 = d.clone().cross(n1).normalize();
  for (let i = 0; i <= kinks; i++) { const k = i / kinks, w = Math.sin(Math.PI * k) * L * jit; pts.push(a.clone().addScaledVector(d, k).addScaledVector(n1, (r() - 0.5) * 2 * w).addScaledVector(n2, (r() - 0.5) * 2 * w)); } return pts; }
function boltMesh(pts, r, m) { const c = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.1); const me = new THREE.Mesh(new THREE.TubeGeometry(c, pts.length * 3, r, 5, false), m); me.renderOrder = 15; me.userData.noHit = true; me.frustumCulled = false; return me; }
// + and − charge marks (sprites), shown in numbers that follow a charge
const CHT = {}; const chargeTex = (s) => CHT[s] || (CHT[s] = canvasTex(64, 64, (x) => { x.clearRect(0, 0, 64, 64); x.fillStyle = s > 0 ? 'rgba(255,90,70,0.95)' : 'rgba(80,160,255,0.95)'; x.beginPath(); x.arc(32, 32, 28, 0, TAU); x.fill(); x.fillStyle = '#ffffff'; x.fillRect(14, 28, 36, 8); if (s > 0) x.fillRect(28, 14, 8, 36); }));
function chargeMarks(g, n, size) { const sp = []; for (const s of [1, -1]) for (let i = 0; i < n; i++) { const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: chargeTex(s), depthTest: false, transparent: true, toneMapped: false })); m.scale.setScalar(size); m.renderOrder = 30; m.visible = false; m.userData.noHit = true; m.sign = s; g.add(m); sp.push(m); } return sp; }

// ------------------------------------------------------------------ Class 8 Ch 5: a Van de Graaff generator
export const VDG = { R: 0.11, C: 4 * Math.PI * 8.854e-12 * 0.11, iBelt: 2.6e-6, Rleak: 1.15e11, Vmax: 300e3, Ebd: 30e3 / 0.01, V0: 6e3 };
export function vanDeGraaff(o = {}) {
  const it = P.rig('pwsxvdg', { en: 'Van de Graaff generator', hi: 'वान डी ग्राफ़ जनित्र', hg: 'Van de Graaff generator' }, o); const g = it.g, W = it.W;
  const X0 = -0.08, Z0 = -0.8, R = VDG.R, H0 = BY + 0.075, H1 = BY + 0.39, DC = V(X0, H1 + R * 0.82, Z0); it.dome = DC;
  // the base: a grey steel housing with its motor, a speed dial and a name plate
  const hs = paint(0x5d646b, 0.42); box(g, hs, 0.24, 0.07, 0.2, X0, BY + 0.035, Z0); box(g, plastic(0x1b1c1e), 0.25, 0.006, 0.21, X0, BY + 0.003, Z0);
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(0.11, 0.028), new THREE.MeshStandardMaterial({ map: canvasTex(512, 128, (x, w, h) => { x.fillStyle = '#c9ccce'; x.fillRect(0, 0, w, h); x.fillStyle = '#1d2a3c'; x.font = `800 44px ${FONT}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('VAN DE GRAAFF', w / 2, h * 0.38); x.font = `600 28px ${FONT}`; x.fillText('ELECTROSTATIC GENERATOR', w / 2, h * 0.76); }), metalness: 0.6, roughness: 0.35 })); plate.position.set(X0 - 0.04, BY + 0.04, Z0 + 0.1006); g.add(plate);
  const dial = new THREE.Group(); dial.position.set(X0 + 0.07, BY + 0.04, Z0 + 0.1); g.add(dial); const kn = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.013, 0.012, 24), bake()); kn.rotation.x = Math.PI / 2; kn.position.z = 0.006; dial.add(kn); const mk = new THREE.Mesh(new THREE.BoxGeometry(0.002, 0.009, 0.002), glow(0xffffff)); mk.position.set(0, 0.006, 0.013); dial.add(mk);
  // the acrylic column with the rubber belt running inside on two rollers
  const col = new THREE.Mesh(new THREE.CylinderGeometry(0.034, 0.034, H1 - H0, 32, 1, true), acrylic()); col.position.set(X0, (H0 + H1) / 2, Z0); col.renderOrder = 4; g.add(col);
  const beltT = canvasTex(64, 512, (x, w, h) => { x.fillStyle = '#3b3532'; x.fillRect(0, 0, w, h); const r = rnd(5); for (let i = 0; i < 90; i++) { x.fillStyle = `rgba(${r() < 0.5 ? '255,255,255' : '0,0,0'},${0.05 + r() * 0.12})`; x.fillRect(0, r() * h, w, 1 + r() * 3); } x.fillStyle = 'rgba(220,200,170,0.5)'; x.fillRect(0, h * 0.3, w, 6); }); beltT.wrapT = THREE.RepeatWrapping;
  const beltM = new THREE.MeshStandardMaterial({ map: beltT, roughness: 0.85 }); const bl = H1 - H0 - 0.02;
  for (const dz of [-0.008, 0.008]) { const b = new THREE.Mesh(new THREE.PlaneGeometry(0.03, bl), beltM); b.position.set(X0, (H0 + H1) / 2, Z0 + dz); if (dz < 0) b.rotation.y = Math.PI; g.add(b); }
  for (const y of [H0 + 0.012, H1 - 0.01]) { const rl = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.036, 16), plastic(y < BY + 0.2 ? 0xe9e5dc : 0x9fb5c2)); rl.rotation.z = Math.PI / 2; rl.position.set(X0, y, Z0); g.add(rl); }
  const comb = new THREE.Group(); comb.position.set(X0, H0 + 0.012, Z0 + 0.016); g.add(comb); box(comb, brass(), 0.03, 0.006, 0.002, 0, 0, 0.002); for (let i = 0; i < 9; i++) comb.add(rod(V(-0.013 + i * 0.00325, 0, 0), V(-0.013 + i * 0.00325, 0, -0.006), 0.0004, brass(), 4));
  // the dome: polished aluminium, open at the bottom over the column
  const dome = new THREE.Mesh(new THREE.SphereGeometry(R, 48, 32, 0, TAU, 0, Math.PI * 0.82), alu()); dome.position.copy(DC); dome.castShadow = true; g.add(dome);
  const collar = new THREE.Mesh(new THREE.TorusGeometry(R * 0.57, 0.006, 10, 40), alu()); collar.rotation.x = Math.PI / 2; collar.position.set(X0, DC.y - R * 0.82, Z0); g.add(collar);
  // paper strips taped on the top, in one geometry: each one lies on the dome (draped) or sticks out (charged)
  const NS = 12, SEG = 6, SL = 0.085; const sg = new THREE.BufferGeometry(); const sp = new Float32Array(NS * (SEG + 1) * 2 * 3); sg.setAttribute('position', new THREE.BufferAttribute(sp, 3)); const idx = [];
  for (let s = 0; s < NS; s++) for (let i = 0; i < SEG; i++) { const a = (s * (SEG + 1) + i) * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } sg.setIndex(idx);
  const strips = new THREE.Mesh(sg, mat('tissue', () => new THREE.MeshStandardMaterial({ color: 0xf3e6ea, roughness: 0.9, side: THREE.DoubleSide }))); strips.userData.keep = true; strips.castShadow = true; g.add(strips);
  const tape = new THREE.Mesh(new THREE.CircleGeometry(0.018, 24), plastic(0xd8cfa0)); tape.rotation.x = -Math.PI / 2; tape.position.copy(DC).add(V(0, R + 0.0008, 0)); g.add(tape);
  let lastA = -1; const setStrips = (al) => { if (Math.abs(al - lastA) < 0.004) return; lastA = al; let k = 0;
    for (let s = 0; s < NS; s++) { const az = s / NS * TAU + 0.2, th0 = 0.13; const ax = V(Math.cos(az), 0, Math.sin(az)); const side = V(-Math.sin(az), 0, Math.cos(az));
      for (let i = 0; i <= SEG; i++) { const u = i / SEG; // draped: along the dome surface from θ0 downwards; charged: straight out along the radius at θ0 (a little lifted)
        const th = th0 + u * SL / R, dr = DC.clone().add(V(Math.sin(th) * ax.x, Math.cos(th), Math.sin(th) * ax.z).multiplyScalar(R + 0.0012));
        const n0 = V(Math.sin(th0) * ax.x, Math.cos(th0), Math.sin(th0) * ax.z); const thR = th0 + (0.55 + 0.35 * (s % 3) / 2) * (1 - 0.15); const rdir = V(Math.sin(thR) * ax.x, Math.cos(thR), Math.sin(thR) * ax.z);
        const st = DC.clone().addScaledVector(n0, R + 0.0012).addScaledVector(rdir, u * SL); const p = dr.lerp(st, al);
        for (const w of [-1, 1]) { const q = p.clone().addScaledVector(side, w * 0.004); sp[k++] = q.x; sp[k++] = q.y; sp[k++] = q.z; } } }
    sg.attributes.position.needsUpdate = true; sg.computeVertexNormals(); sg.computeBoundingSphere(); };
  setStrips(0);
  // the earthed discharge sphere on its stand, slid towards the dome; its earth lead goes to the base
  const WS = new THREE.Group(); g.add(WS); const wr = 0.032; const wsph = new THREE.Mesh(new THREE.SphereGeometry(wr, 32, 20), alu()); WS.add(wsph);
  WS.add(rod(V(0.0, -wr, 0), V(0.0, -(DC.y - BY) + 0.012, 0), 0.006, plastic(0xc6402e))); const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 0.012, 24), paint(0x2c2f33)); foot.position.y = -(DC.y - BY) + 0.006; WS.add(foot);
  const earth = P.cable(g, 0x2e7d32, () => [WS.position.clone().add(V(0.012, -0.01, 0)), V(X0 + 0.12, BY + 0.03, Z0 + 0.06), V(1, 0.3, 0), V(1, 0, 0)], { sag: 0.25 });
  const gapAt = () => WS.position.distanceTo(DC) - R - wr;
  it.setGap = (k) => { it.kg = clamp01(k); const gap = 0.002 + (1 - it.kg) * 0.17; WS.position.set(X0 + R + wr + gap, DC.y, Z0); earth.update(); if (it.onKg) it.onKg(it.kg); };
  // the stack of five foil cups (carried to the dome; they fly off one by one)
  const cupG = () => { const m = lathe([[0, 0], [0.022, 0], [0.026, 0.003], [0.033, 0.016], [0.034, 0.017], [0, 0.017]], foil(), 28); m.userData.noHit = true; return m; };
  const cups = []; for (let i = 0; i < 5; i++) { const c = cupG(); c.visible = false; g.add(c); cups.push({ m: c, st: 'off', v: V(0, 0, 0) }); }
  const stackG = new THREE.Group(); for (let i = 0; i < 5; i++) { const c = cupG(); c.position.y = i * 0.005; stackG.add(c); } stackG.traverse((m) => { m.userData.noHit = true; });
  it.cupStack = thing({ en: 'Five foil cups, stacked', hi: 'पन्नी के पाँच कप, एक के ऊपर एक', hg: 'Foil ke paanch cups, ek ke upar ek' }, stackG, { hitR: 0.045, hitY: 0.02 });
  // spark and its glow
  const sparkM = addGlow(0xd6e8ff), sparkM2 = addGlow(0x7a9cff, 0.5); let sparkMesh = null, sparkT = 0;
  const rd = liveSign(0.065, 6.5); rd.position.set(X0 + 0.02, DC.y + R + 0.12, Z0); g.add(rd);
  const zb = zoomBubble({ at: V(X0 - 0.27, BY + 0.28, Z0 + 0.1), r: 0.075, fov: 26 }); zb.visible = false; g.add(zb); it.bubble = zb;
  const marks = chargeMarks(g, 6, 0.008); // on the belt: − from the comb at the bottom, carried up
  Object.assign(it, { Q: 0, speed: 0, ks: 0, kg: 0, sparks: 0, gapSpark: null, maxGap: 0, cupsOn: 0, cupsGone: 0, cupT: 0, Vmax: 0, beltY: 0, simT: 0 });
  it.V = () => it.Q / VDG.C; it.gap = gapAt;
  it.setSpeed = (k) => { it.ks = clamp01(k); it.speed = it.ks < 0.04 ? 0 : it.ks; dial.rotation.z = -it.ks * 4.5; if (it.onKs) it.onKs(it.ks); };
  it.putCups = (cb) => { it.cupStack.g.visible = false; it.cupStack.used = true; it.cupsOn = 5; cups.forEach((c, i) => { c.st = 'on'; c.m.visible = true; c.m.position.copy(DC).add(V(0, R - 0.002 + i * 0.005, 0)); c.m.rotation.set(0, 0, 0); }); if (cb) cb(); };
  it.say = (l, c) => rd.set(l, c);
  ticker(it, (dt) => { it.simT += dt;
    // charge: carried up by the belt, leaking into the air; corona above 300 kV; a spark when the gap breaks down
    const iB = VDG.iBelt * it.speed, Vd = it.V(); let dQ = (iB - Vd / VDG.Rleak) * dt; if (Vd > VDG.Vmax) dQ -= (Vd - VDG.Vmax) * VDG.C * Math.min(1, dt * 8);
    it.Q = Math.max(0, it.Q + dQ); const gp = gapAt();
    if (gp < 0.004) it.Q *= Math.exp(-dt / 0.01); // touching: the charge runs to earth at once
    else if (it.V() > VDG.Ebd * gp + VDG.V0 * 0.0 && it.V() > 4e3) { // breakdown: a spark carries most of the charge away
      const a = DC.clone().add(WS.position.clone().sub(DC).normalize().multiplyScalar(R)), b = WS.position.clone().add(DC.clone().sub(WS.position).normalize().multiplyScalar(wr));
      if (sparkMesh) { g.remove(sparkMesh); sparkMesh.geometry.dispose(); } sparkMesh = boltMesh(sparkGeo(a, b, 7 + it.sparks * 13, 10, 0.12), 0.0016, sparkM); sparkMesh.add(boltMesh(sparkGeo(a, b, 9 + it.sparks * 5, 8, 0.1), 0.004, sparkM2)); g.add(sparkMesh); sparkT = 0.09;
      it.sparks++; it.maxGap = Math.max(it.maxGap, gp); it.lastSparkV = it.V(); if (it.gapSpark == null) it.gapSpark = gp; it.Q *= 0.04; sfx(o.app, 'spark'); if (it.onSpark) it.onSpark(); }
    if (sparkT > 0) { sparkT -= dt; if (sparkT <= 0 && sparkMesh) { g.remove(sparkMesh); sparkMesh.geometry.dispose(); sparkMesh = null; } }
    // the cups: the top one is charged like the dome and pushed off once the dome is well charged
    const Vn = it.V(); it.Vmax = Math.max(it.Vmax, Vn);
    if (it.cupsOn > 0 && Vn > 50e3) { it.cupT += dt; if (it.cupT > 0.45) { it.cupT = 0; const c = cups[it.cupsOn - 1]; it.cupsOn--; c.st = 'fly'; const az = it.cupsOn * 2.1 + 0.5; c.v.set(Math.cos(az) * 0.6, 1.4 + Vn / 300e3, Math.sin(az) * 0.6); it.Q *= 0.93; } }
    for (const c of cups) if (c.st === 'fly') { c.v.y -= 9.8 * dt * 0.55; c.m.position.addScaledVector(c.v, dt * 0.7); c.m.rotation.x += dt * 5; c.m.rotation.z += dt * 3; if (c.m.position.y < BY + 0.005) { c.m.position.y = BY + 0.003; c.m.rotation.set(Math.PI * (it.cupsGone % 2), 0, 0); c.st = 'down'; it.cupsGone++; } }
    for (const c of cups) if (c.st === 'on') { const i = cups.indexOf(c); c.m.position.copy(DC).add(V(0, R - 0.002 + i * 0.005, 0)); }
    // belt, strips, read-out
    it.beltY = (it.beltY + dt * it.speed * 1.4) % 1; beltM.map.offset.y = it.beltY; const al = clamp01(Math.pow(Vn / 140e3, 0.8)); setStrips(lerp(lastA < 0 ? 0 : lastA, al, Math.min(1, dt * 6)));
    marks.forEach((m, i) => { m.visible = it.speed > 0 && m.sign < 0; const u = ((i / 6 + it.beltY * 2) % 1); m.position.set(X0, H0 + 0.02 + u * (H1 - H0 - 0.04), Z0 + 0.012); });
    it.say([`${W('Belt')}: ${it.speed ? `${Math.round(it.speed * 100)} %` : W('off')} · ${W('dome')} ≈ ${Math.round(Vn / 1000)} kV · ${(it.Q * 1e6).toFixed(2)} µC`, `${W('gap')} ${(gp * 100).toFixed(1)} cm · ${W('sparks')}: ${it.sparks}${it.gapSpark != null ? ` · ${W('longest')} ${(it.maxGap * 100).toFixed(1)} cm` : ''}`],
      [Vn > 100e3 ? OKC : WHT, it.sparks ? YEL : WHT]);
  });
  it.setGap(0); it.setSpeed(0);
  it.speedPath = benchPath(X0 - 0.06, X0 + 0.14, Z0 + 0.2); it.gapPath = benchPath(X0 + 0.16, X0 + 0.36, Z0 + 0.2);
  it.views = { all: { p: V(X0 + 0.12, BY + 0.8, Z0 + 1.25), t: V(X0 + 0.08, BY + 0.27, Z0) }, dome: { p: V(X0 + 0.2, BY + 0.72, Z0 + 0.95), t: V(X0 + 0.12, BY + 0.36, Z0) } };
  it.camView = it.views.all; mergeStatic(g, [dome, kn, mk]);
  return it;
}
export function bindVdg(vg, speedK, gapK, app, s, done = {}) {
  const on = (k) => (Array.isArray(s[k]) ? s[k] : [s[k]]).some((i) => stepNow(app, i));
  const s1 = slideKnob(speedK, { path: () => vg.speedPath(), active: () => on('speed'), keepVisible: () => on('speed'), k: () => vg.ks, set: (k) => vg.setSpeed(k) });
  const s2 = slideKnob(gapK, { path: () => vg.gapPath(), active: () => on('gap'), keepVisible: () => on('gap'), k: () => vg.kg, set: (k) => vg.setGap(k) });
  vg.onKs = () => s1(); vg.onKg = () => s2();
  carry(vg.cupStack, [{ at: () => vg.dome.clone(), r: 0.12, open: () => on('cups'), put: () => vg.putCups(() => done.cupsOn && done.cupsOn()) }], { carryY: BY + 0.25 });
  let n0 = -1; const u0 = vg.update; vg.update = (dt, t) => { u0(dt, t); const i = app.runner.i;
    if (on('charge') && vg.V() > 150e3 && done.charged) done.charged();
    if (on('spark')) { if (n0 < 0) n0 = vg.sparks; if (vg.sparks - n0 >= 3 && done.spark) done.spark(); } else n0 = -1;
    if (on('cups') && vg.cupsGone >= 5 && done.cups) done.cups();
    if (on('earth') && vg.speed === 0 && vg.gap() < 0.004 && vg.V() < 3e3 && done.earth) done.earth();
    if (i >= (s.spark ?? 99) && !vg.bubble.visible) vg.bubble.look(vg.dome.clone().add(V(0, 0.0, 0)), vg.dome.clone().add(V(0.32, 0.08, 0.32)), vg.W('The dome and the earthed sphere: a spark jumps the gap')); };
}

// ------------------------------------------------------------------ Class 8 Ch 5: a gold-leaf electroscope
// A glass jar with a brass rod through an ebonite stopper: a brass disc (the cap) on top, two gold leaves hanging from a
// brass plate inside. Beside it an ebonite rod and a woollen cloth, a glass rod and a silk cloth, a clamp stand that holds a
// rod 3 cm from the cap, and your hand. Leaf angle = 52°·tanh(|q|/0.35), q = the charge on the leaves.
export const TRIBO = { glass: 1.0, wool: 0.72, silk: 0.52, ebonite: 0.0 }; // the triboelectric series: the one higher up gets +
export function electroscope(o = {}) {
  const it = P.rig('pwsxscope', { en: 'Gold-leaf electroscope', hi: 'स्वर्ण-पत्र विद्युतदर्शी', hg: 'Gold-leaf electroscope' }, o); const g = it.g, W = it.W;
  const CX = 0.02, CZ = -0.74; const JH = 0.15, CAPY = BY + JH + 0.06; it.capAt = V(CX, CAPY, CZ);
  // the jar on a wooden base
  box(g, wood('#6e4526'), 0.16, 0.018, 0.16, CX, BY + 0.009, CZ); const jar = lathe([[0.0, 0], [0.058, 0], [0.06, 0.004], [0.06, JH - 0.03], [0.05, JH - 0.012], [0.024, JH], [0.022, JH + 0.004], [0, JH + 0.004]], glassMat({ opacity: 0.08, edge: 0.55 }), 48); jar.position.set(CX, BY + 0.018, CZ); jar.renderOrder = 6; jar.castShadow = false; g.add(jar);
  const stop = new THREE.Mesh(new THREE.CylinderGeometry(0.019, 0.017, 0.022, 24), bake()); stop.position.set(CX, BY + 0.018 + JH + 0.004, CZ); g.add(stop);
  g.add(rod(V(CX, BY + 0.06, CZ), V(CX, CAPY, CZ), 0.0032, brass())); const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.004, 40), brass()); cap.position.copy(it.capAt); g.add(cap);
  const plateY = BY + 0.065; box(g, brass(), 0.012, 0.02, 0.002, CX, plateY, CZ);
  const leaves = [-1, 1].map((s) => { const pv = new THREE.Group(); pv.position.set(CX + s * 0.002, plateY - 0.009, CZ); g.add(pv); const lf = new THREE.Mesh(new THREE.PlaneGeometry(0.009, 0.05, 1, 4), gold()); lf.position.y = -0.025; const pz = lf.geometry.attributes.position; for (let i = 0; i < pz.count; i++) pz.setZ(i, Math.sin(pz.getY(i) * 60) * 0.0006); lf.geometry.computeVertexNormals(); pv.add(lf); pv.s = s; return pv; });
  // a scale behind the leaves (degrees), as on a school electroscope
  const sc = new THREE.Mesh(new THREE.CircleGeometry(0.05, 40, Math.PI, Math.PI), new THREE.MeshBasicMaterial({ map: canvasTex(256, 128, (x, w, h) => { x.clearRect(0, 0, w, h); x.strokeStyle = 'rgba(30,30,30,0.7)'; x.fillStyle = 'rgba(30,30,30,0.8)'; x.lineWidth = 2; x.font = `600 14px ${FONT}`; x.textAlign = 'center'; for (let a = -60; a <= 60; a += 10) { const r = (a - 90) * DEG; x.beginPath(); x.moveTo(w / 2 + Math.cos(r) * 100, h * 0.98 + Math.sin(r) * 100 * 0 + Math.sin(r) * 100); x.lineTo(w / 2 + Math.cos(r) * 116, h * 0.98 + Math.sin(r) * 116); x.stroke(); } }), transparent: true, opacity: 0.6, depthWrite: false })); sc.position.set(CX, plateY - 0.009, CZ - 0.02); sc.rotation.z = 0; sc.visible = false; g.add(sc);
  // the clamp stand that holds a rod near the cap
  const SX = CX - 0.17; box(g, iron(), 0.1, 0.008, 0.07, SX, BY + 0.004, CZ); g.add(rod(V(SX, BY + 0.008, CZ), V(SX, CAPY + 0.06, CZ), 0.004, steel())); box(g, oldBrass(), 0.02, 0.016, 0.016, SX, CAPY + 0.03, CZ);
  // the cloths
  const clothM = (c, sheen) => new THREE.MeshStandardMaterial({ map: canvasTex(128, 128, (x) => { x.fillStyle = c; x.fillRect(0, 0, 128, 128); const r = rnd(sheen ? 9 : 4); for (let i = 0; i < 1800; i++) { x.fillStyle = `rgba(${r() < 0.5 ? '255,255,255' : '0,0,0'},${sheen ? 0.05 : 0.12})`; x.fillRect(r() * 128, r() * 128, sheen ? 6 : 1.5, 1); } }), roughness: sheen ? 0.35 : 1 });
  const wool = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.012, 0.08, 4, 1, 3), clothM('#8a2632', false)); wool.position.set(0.22, BY + 0.006, -0.6); g.add(wool);
  const silk = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.004, 0.08), clothM('#efe7d6', true)); silk.position.set(0.22, BY + 0.002, -0.76); g.add(silk);
  it.cloths = { wool: wool.position.clone(), silk: silk.position.clone() };
  // the rods and your hand (carried things)
  const mkRod = (kind) => { const gg = new THREE.Group(); const m = new THREE.Mesh(new THREE.CylinderGeometry(0.0065, 0.0065, 0.22, 20), kind === 'glass' ? glassMat({ opacity: 0.35, edge: 0.85 }) : bake()); m.rotation.z = Math.PI / 2; m.position.y = 0.007; m.castShadow = kind !== 'glass'; gg.add(m); gg.traverse((x) => { x.userData.noHit = true; });
    const r = thing(kind === 'glass' ? { en: 'Glass rod', hi: 'काँच की छड़', hg: 'Glass rod' } : { en: 'Ebonite rod', hi: 'एबोनाइट की छड़', hg: 'Ebonite rod' }, gg, { hitR: 0.05, hitY: 0.01, height: 0.015 }); r.rodKind = kind; r.q = 0; r.where = 'home'; return r; };
  const eb = mkRod('ebonite'), gl = mkRod('glass'); it.rods = [eb, gl];
  const hg = gloveHand('right'); hg.ready.then((h) => { if (!h) return; h.model.rotation.set(-Math.PI / 2, 0, Math.PI); h.model.scale.setScalar(0.9); }); const hand = thing({ en: 'Your finger', hi: 'आपकी उँगली', hg: 'Aapki ungli' }, hg, { hitR: 0.05, hitY: 0.02 }); hand.on = false; it.hand = hand;
  const marks = chargeMarks(g, 6, 0.0075);
  const rd = liveSign(0.06, 6.5); rd.position.set(CX - 0.05, CAPY + 0.13, CZ); g.add(rd);
  Object.assign(it, { Q: 0, th: 0, thMax: 0, events: [] });
  // the charge on the leaves: α of the electroscope's own charge, plus what a nearby rod pushes down (γ q)
  const AL = 0.55, GAM = 0.45; const near = () => it.rods.filter((r) => r.where === 'near' || r.where === 'touch');
  it.qLeaves = () => (hand.on ? 0 : AL * it.Q + GAM * near().reduce((s, r) => s + r.q, 0));
  it.earth = () => { if (hand.on) it.Q = -GAM * near().reduce((s, r) => s + r.q, 0) / AL; };
  it.rub = (r, cloth) => { const q = (TRIBO[r.rodKind] - TRIBO[cloth]) * 1.6; r.q = Math.abs(q) < 0.05 ? 0 : q; r.rubbedOn = cloth; it.events.push('rub:' + r.rodKind + ':' + cloth); };
  it.touch = (r) => { const dq = 0.5 * r.q; it.Q += dq; r.q -= dq; it.events.push('touch'); };
  it.say = (l, c) => rd.set(l, c);
  const angle = (q) => 52 * Math.tanh(Math.abs(q) / 0.35);
  ticker(it, (dt) => { it.earth(); const q = it.qLeaves(); const th = angle(q); it.th = lerp(it.th, th, Math.min(1, dt * 5)); it.thMax = Math.max(it.thMax, it.th);
    for (const lf of leaves) lf.rotation.z = lf.s * it.th * DEG + Math.sin(performance.now() * 0.004 + lf.s) * 0.003;
    // charge marks: on the cap (the opposite of the leaves, when a rod is near) and on the leaves
    const qc = hand.on ? it.Q : it.Q * (1 - AL) - GAM * near().reduce((s, r) => s + r.q, 0); let k = 0; const nl = Math.min(6, Math.round(Math.abs(q) * 5)), nc = Math.min(6, Math.round(Math.abs(qc) * 5));
    for (const m of marks) m.visible = false; const put = (n, sgn, f) => { for (let i = 0; i < n; i++) { const m = marks.find((x) => !x.visible && x.sign === sgn); if (!m) return; m.visible = true; m.position.copy(f(i, n)); } };
    put(nl, Math.sign(q), (i) => { const lf = leaves[i % 2]; return lf.localToWorld(V(0, -0.012 - Math.floor(i / 2) * 0.012, 0.002)); }); put(nc, Math.sign(qc), (i, n) => V(CX - 0.022 + (i / Math.max(1, n - 1)) * 0.044, CAPY + 0.008, CZ + 0.002)); void k;
    const rl = it.rods.map((r) => `${tl(r)} ${r.q > 0.05 ? '+' : r.q < -0.05 ? '−' : '0'}`).join(' · ');
    it.say([`${W('Leaves apart')}: ${Math.round(it.th * 2)}° · ${W('electroscope')} ${it.Q > 0.04 ? W('charged +') : it.Q < -0.04 ? W('charged −') : W('not charged')}${hand.on ? ` · ${W('earthed by your finger')}` : ''}`, rl], [it.th > 8 ? OKC : WHT, WHT]); });
  const tl = (r) => W(r.rodKind === 'glass' ? 'Glass rod' : 'Ebonite rod');
  it.nearAt = V(SX + 0.06, CAPY + 0.03, CZ); it.touchAt = V(CX - 0.05, CAPY, CZ + 0.02); it.fingerAt = V(CX + 0.045, CAPY, CZ + 0.02);
  it.views = { all: { p: V(CX, BY + 0.6, CZ + 0.8), t: V(CX - 0.02, BY + 0.1, CZ) }, near: { p: V(CX - 0.04, BY + 0.46, CZ + 0.56), t: V(CX - 0.05, BY + 0.13, CZ) } };
  it.camView = it.views.all; mergeStatic(g, [cap]);
  return it;
}
export function bindScope(es, app, s, done = {}) {
  const on = (k) => (Array.isArray(s[k]) ? s[k] : [s[k]]).some((i) => stepNow(app, i));
  const busy = () => es.busy;
  // a rod: on its cloth it is rubbed; at the clamp it is held near the cap; on the cap it touches it; anywhere else it goes back
  for (const r of es.rods) {
    carry(r, [
      ...['wool', 'silk'].map((c) => ({ at: () => es.cloths[c].clone(), r: 0.08, open: () => !busy(), put: (x) => es.rubAnim(x, c) })),
      { at: () => es.nearAt.clone(), r: 0.06, open: () => !busy(), put: (x) => es.hold(x, 'near') },
      { at: () => es.touchAt.clone(), r: 0.035, open: () => !busy(), put: (x) => es.hold(x, 'touch') },
    ], { carryY: BY + 0.3 });
    const r0 = r.onRelease; r.onRelease = () => { if (r.where !== 'home') { r.where = 'home'; es.events.push('away'); } r0(); };
  }
  carry(es.hand, [{ at: () => es.fingerAt.clone(), r: 0.05, open: () => !busy(), put: (x) => es.finger(true) }], { carryY: BY + 0.3 });
  { const r0 = es.hand.onRelease; es.hand.onRelease = () => { if (es.hand.on) es.finger(false); r0(); }; }
  // what each step looks for
  const st = { near: 0 }; const u0 = es.update; es.update = (dt, t) => { u0(dt, t); const eb = es.rods[0], gl = es.rods[1];
    if (on('rub') && eb.q < -0.3 && !busy() && done.rub) done.rub();
    if (on('near')) { if (eb.where === 'near' && es.th > 12) st.near = 1; if (st.near && eb.where === 'home' && es.th < 4 && done.near) done.near(); } else st.near = 0;
    if (on('touch') && es.events.includes('touch') && eb.where === 'home' && es.th > 12 && Math.abs(es.Q) > 0.1 && done.touch) done.touch();
    if (on('earth') && !es.hand.on && es.th < 3 && Math.abs(es.Q) < 0.03 && es.events.includes('finger') && done.earth) done.earth();
    if (on('induce') && eb.where === 'home' && !es.hand.on && es.Q > 0.15 && es.th > 10 && es.events.includes('finger') && done.induce) done.induce();
    if (on('test') && gl.q > 0.3 && gl.where === 'near' && es.th > (st.th0 ?? 0) + 4 && done.test) done.test(); if (!on('test')) st.th0 = es.th; };
  es.mark = (k) => { es.events.length = 0; void k; };
}
export function scopeActions(es) {
  // rubbing: the rod slides to and fro on the cloth six times
  es.rubAnim = (r, cloth, cb) => { if (es.busy) return false; r.flying = true; const p = es.cloths[cloth].clone().add(V(0, 0.012, 0)); es.busy = true;
    flyT(r, p, 0, 0.45, () => { const p0 = r.g.position.clone(); es.play(1.4, (k) => { r.g.position.copy(p0).add(V(Math.sin(k * TAU * 6) * 0.04, 0, 0)); }, () => { es.rub(r, cloth); es.busy = false; r.flying = false; flyT(r, r.home.p.clone(), 0, 0.5, () => { r.where = 'home'; if (cb) cb(); }); }); }); return true; };
  es.hold = (r, where, cb) => { r.flying = true; const to = where === 'near' ? es.nearAt.clone().add(V(0.035, 0, 0)) : es.touchAt.clone().add(V(-0.06, 0.006, -0.02));
    flyT(r, to, 0, 0.6, () => { r.flying = false; r.placed = false; r.where = where; if (where === 'touch') es.touch(r); if (cb) cb(); }); return true; };
  es.away = (r, cb) => { flyT(r, r.home.p.clone(), 0, 0.6, () => { r.where = 'home'; es.events.push('away'); if (cb) cb(); }); };
  es.finger = (v, cb) => { const h = es.hand; if (v) { h.flying = true; flyT(h, es.fingerAt.clone().add(V(0.03, 0.01, 0.01)), 0, 0.5, () => { h.flying = false; h.on = true; es.events.push('finger'); if (cb) cb(); }); } else { h.on = false; flyT(h, h.home.p.clone(), 0, 0.5, () => { if (cb) cb(); }); } };
}

// ------------------------------------------------------------------ Class 8 Ch 6: lightning and the lightning conductor
// A village on a dirt road under a storm; the school (two storeys, a water tank on its flat roof) 26 m ahead on the right,
// three houses on the left. The student slides the clock: the cloud charges (ice crystals carried up get +, hail falling
// through gets −), the field at the ground climbs from 0.1 to 10 kV/m. The first flash is 1.7 km away: the student marks
// the thunder (340 m/s). Then the cloud comes over the school: a stepped leader comes down and the stroke goes to the
// highest point within reach: the school's water tank (bricks blown off), or, once the student has fitted a lightning
// conductor, its copper rod: the current goes down the copper strip into an earth plate, the school is untouched.
const brickT = (rep) => P.mat('bt' + rep, () => { const t = new THREE.TextureLoader().load('tex/pw3_brick.jpg'); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...rep); t.anisotropy = 4; return t; });
const plasterT = (rep) => P.mat('ps' + rep, () => { const t = new THREE.TextureLoader().load('tex/pw3_plaster.jpg'); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...rep); t.anisotropy = 4; return t; });
const lam = (k, o) => P.mat('lam' + k, () => new THREE.MeshLambertMaterial(o));
export function lightningVillage(o = {}) {
  const it = P.rig('pwsxstorm', { en: 'A village in a thunderstorm', hi: 'आँधी-तूफ़ान में एक गाँव', hg: 'Aandhi-toofan mein ek gaon' }, o); const g = it.g, W = it.W;
  // the school: 12 × 8 m, two storeys (7.2 m) with a parapet, a water tank on the roof (top 9.4 m)
  const S = { x: 11, z: -26, w: 12, d: 8, h: 7.2 }; it.S = S;
  const pl = lam('pl', { map: plasterT([3, 2]), color: 0xfff6e6 }), pl2 = lam('pl2', { map: plasterT([1, 1]), color: 0xf0e6d6 }), br = lam('br', { map: brickT([4, 1.5]), color: 0xffffff }), dark = lam('win', { color: 0x262a2e }), roofM = lam('roof', { color: 0x8d8a84 }), tankM = lam('tank', { color: 0x2b2d30 });
  const B = new THREE.Group(); g.add(B);
  box(B, pl, S.w, S.h, S.d, S.x, S.h / 2, S.z); box(B, br, S.w + 0.3, 0.6, S.d + 0.3, S.x, 0.3, S.z); box(B, roofM, S.w, 0.15, S.d, S.x, S.h + 0.075, S.z);
  for (const [w, d, x, z] of [[S.w + 0.2, 0.2, 0, -S.d / 2], [S.w + 0.2, 0.2, 0, S.d / 2], [0.2, S.d, -S.w / 2, 0], [0.2, S.d, S.w / 2, 0]]) box(B, pl2, w, 0.9, d, S.x + x, S.h + 0.45, S.z + z);
  for (let f = 0; f < 2; f++) for (let i = 0; i < 5; i++) { box(B, dark, 1.2, 1.3, 0.06, S.x - 4.8 + i * 2.4, 1.9 + f * 3.4, S.z + S.d / 2 + 0.02); box(B, pl2, 1.4, 0.12, 0.2, S.x - 4.8 + i * 2.4, 1.2 + f * 3.4, S.z + S.d / 2 + 0.08); }
  box(B, pl2, 2.4, 0.2, 1.0, S.x, 3.4, S.z + S.d / 2 + 0.5); box(B, dark, 1.6, 2.4, 0.05, S.x, 1.2, S.z + S.d / 2 + 0.02); // porch roof and the door
  const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 1.3, 24), tankM); tank.position.set(S.x + 3, S.h + 0.9, S.z - 1.5); B.add(tank); box(B, pl2, 1.8, 0.25, 1.8, S.x + 3, S.h + 0.27, S.z - 1.5);
  const TANK_TOP = V(S.x + 3, S.h + 1.55, S.z - 1.5); it.tankTop = TANK_TOP;
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 0.6), new THREE.MeshLambertMaterial({ map: canvasTex(1024, 146, (x, w, h) => { x.fillStyle = '#1f4e8c'; x.fillRect(0, 0, w, h); x.fillStyle = '#ffffff'; x.font = `800 74px ${FONT}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('GOVT. MIDDLE SCHOOL', w / 2, h / 2 + 4); }) })); sign.position.set(S.x, S.h - 0.6, S.z + S.d / 2 + 0.04); B.add(sign);
  // three village houses on the left (plastered brick, sloping tiled roofs)
  const tileT = P.mat('tileT', () => { const t = canvasTex(256, 256, (x) => { x.fillStyle = '#7a3b22'; x.fillRect(0, 0, 256, 256); for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) { const gr = x.createLinearGradient(0, r * 32, 0, r * 32 + 32); gr.addColorStop(0, '#9a4e2c'); gr.addColorStop(1, '#5e2a17'); x.fillStyle = gr; x.fillRect(c * 32 + (r % 2) * 16, r * 32, 30, 31); } }); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(4, 2); t.colorSpace = THREE.SRGBColorSpace; return t; });
  const tileM = lam('tile', { map: tileT, side: THREE.DoubleSide });
  for (const [x, z, w, d, ry] of [[-10, -16, 6, 5, 0.1], [-11, -29, 7, 5, -0.05], [-9.5, -42, 6, 5, 0.15]]) { const h = new THREE.Group(); h.position.set(x, 0, z); h.rotation.y = ry; g.add(h); box(h, pl, w, 3, d, 0, 1.5, 0); box(h, dark, 1, 1.9, 0.05, 0.6, 0.95, d / 2 + 0.01); box(h, dark, 0.9, 0.9, 0.05, -1.6, 1.6, d / 2 + 0.01);
    const rh = Math.tan(0.45) * d / 2; for (const s of [-1, 1]) { const r = new THREE.Mesh(new THREE.PlaneGeometry(w + 0.6, d / 2 / Math.cos(0.45) + 0.4), tileM); r.position.set(0, 3 + rh / 2, s * d / 4); r.rotation.x = -Math.PI / 2 + s * 0.45; h.add(r); }
    const gs = new THREE.Shape(); gs.moveTo(-d / 2, 0); gs.lineTo(d / 2, 0); gs.lineTo(0, rh); gs.closePath(); const gg = new THREE.ExtrudeGeometry(gs, { depth: 0.15, bevelEnabled: false }); gg.rotateY(Math.PI / 2);
    for (const sx of [-1, 1]) { const m = new THREE.Mesh(gg, pl2); m.position.set(sx * w / 2 - 0.075, 3, 0); m.castShadow = true; h.add(m); } }
  // the storm: darker sky (the photo dimmed), the cloud's charges, rain streaks
  const rainN = P.LITE ? 500 : 1400; const rg = new THREE.BufferGeometry(); const rp = new Float32Array(rainN * 6); rg.setAttribute('position', new THREE.BufferAttribute(rp, 3)); const rr = rnd(21);
  const drops = []; for (let i = 0; i < rainN; i++) drops.push([(rr() - 0.5) * 40, rr() * 22, -2 - rr() * 40]); const rain = new THREE.LineSegments(rg, new THREE.LineBasicMaterial({ color: 0xaab4c0, transparent: true, opacity: 0.35, depthWrite: false })); rain.frustumCulled = false; rain.userData.noHit = true; g.add(rain);
  const CLD = { x: 9, y: 34, z: -70 }; // the charged part of the cloud we show (a scaled view: the real base is 1–2 km up)
  const cm = chargeMarks(g, 14, 2.4); const gm = chargeMarks(g, 10, 0.8);
  // the field meter on a pole by the road (kV/m at the ground) and the clock
  const rd = liveSign(0.2, 6.5); rd.position.set(-0.9, 2.15, -4.2); g.add(rd);
  const zb = zoomBubble({ at: V(-2.6, 2.2, -6), r: 0.75, fov: 30 }); zb.visible = false; g.add(zb); it.bubble = zb;
  // inside the cloud (seen only in the bubble, far below the ground): ice crystals rising, hail falling, colliding
  const IC = V(0, -300, -20); const inner = new THREE.Group(); inner.position.copy(IC); g.add(inner);
  const bg = new THREE.Mesh(new THREE.SphereGeometry(30, 24, 16), new THREE.MeshBasicMaterial({ color: 0x3c434c, side: THREE.BackSide })); inner.add(bg);
  const iceM = mat('ice', () => new THREE.MeshStandardMaterial({ color: 0xe8f4ff, roughness: 0.2, metalness: 0.1 })), hailM = mat('hail', () => new THREE.MeshStandardMaterial({ color: 0xbfc8d0, roughness: 0.7 }));
  const parts = []; const pr = rnd(4); for (let i = 0; i < 26; i++) { const ice = i % 2 === 0; const m = new THREE.Mesh(ice ? new THREE.OctahedronGeometry(0.18, 0) : new THREE.SphereGeometry(0.42, 12, 8), ice ? iceM : hailM); m.position.set((pr() - 0.5) * 8, (pr() - 0.5) * 8, (pr() - 0.5) * 3); inner.add(m); const c = chargeMarks(inner, 1, ice ? 0.35 : 0.45).filter((x) => x.sign === (ice ? 1 : -1))[0]; parts.push({ m, c, ice, ph: pr() * 10 }); }
  const innerL = new THREE.DirectionalLight(0xffffff, 0); void innerL; // (no extra light: the inner scene is lit by the place's own light)
  // the lightning conductor: a copper rod with points on the roof, a copper strip down the wall, an earth plate
  const LC = new THREE.Group(); g.add(LC); const cuM = lam('cu', { color: 0xb8692e, emissive: 0x2a1205 }); const RODX = S.x - S.w / 2 + 0.5, RODZ = S.z + S.d / 2 - 0.4;
  LC.add(rod(V(RODX, S.h + 0.9, RODZ), V(RODX, S.h + 3.4, RODZ), 0.025, cuM)); for (let i = 0; i < 4; i++) { const a = i / 4 * TAU; LC.add(rod(V(RODX, S.h + 3.3, RODZ), V(RODX + Math.cos(a) * 0.18, S.h + 3.55, RODZ + Math.sin(a) * 0.18), 0.01, cuM)); }
  const strip = [V(RODX, S.h + 0.95, RODZ), V(RODX - 0.25, S.h + 0.95, RODZ + 0.35), V(RODX - 0.25, S.h + 0.3, S.z + S.d / 2 + 0.05), V(RODX - 0.25, 0.1, S.z + S.d / 2 + 0.05), V(RODX - 0.25, -0.02, S.z + S.d / 2 + 0.6)];
  for (let i = 0; i < strip.length - 1; i++) LC.add(rod(strip[i], strip[i + 1], 0.02, cuM, 6)); const pit = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.05, 24), lam('pit', { color: 0x6e6a62 })); pit.position.set(RODX - 0.25, 0.02, S.z + S.d / 2 + 0.7); LC.add(pit);
  it.rodTop = V(RODX, S.h + 3.55, RODZ); it.fit = 0; LC.visible = false;
  it.setFit = (k) => { it.fit = clamp01(k); LC.visible = it.fit > 0.02; LC.position.y = -(1 - it.fit) * (S.h + 3.6); LC.scale.y = 1; if (it.onFit) it.onFit(it.fit); };
  // the bolt
  const boltM = addGlow(0xe8eeff), haloM = addGlow(0x8aa8ff, 0.35); const bolts = new THREE.Group(); g.add(bolts); let flashT = 0, flashes = [];
  const debris = []; const dbM = lam('db', { color: 0xc9b8a0 }); for (let i = 0; i < 14; i++) { const d = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.1, 0.12), dbM); d.visible = false; g.add(d); debris.push({ m: d, v: V(0, 0, 0) }); }
  const scorch = new THREE.Mesh(new THREE.CircleGeometry(0.9, 24), new THREE.MeshBasicMaterial({ color: 0x111111, transparent: true, opacity: 0.0, depthWrite: false })); scorch.rotation.y = 0; scorch.position.copy(TANK_TOP).add(V(0, -0.75, 0.78)); g.add(scorch);
  Object.assign(it, { t: 0, q: 0, kt: 0, phase: 'charge', strikes: [], thunderAt: -1, flashAt: -1, marked: null, dist: 1700, damaged: false, safe: false, simT: 0, distant: false });
  it.say = (l, c) => rd.set(l, c);
  // the clock: 0 … 10 minutes; the cloud's charge builds over 8 minutes (it charges again after each stroke)
  it.setT = (k) => { const t1 = clamp01(k) * 10; if (t1 < it.t) return; it.q = clamp01(it.q + (t1 - it.t) / 8); it.t = t1; it.kt = clamp01(k); if (it.onKt) it.onKt(it.kt); };
  it.resetClock = () => { it.t = 0; it.kt = 0; if (it.onKt) it.onKt(0); };
  // a stroke: from the cloud above `from` down to the highest point it can reach
  it.target = () => (it.fit > 0.98 ? { p: it.rodTop.clone(), what: 'rod' } : { p: TANK_TOP.clone(), what: 'tank' });
  it.strike = (far, cb) => { if (it.busy) return false; const T = far ? { p: V(-120, 0, -1680), what: 'far' } : it.target();
    const top = far ? V(-160, 260, -1600) : V(T.p.x + 4, 60, T.p.z - 18); const pts = sparkGeo(top, T.p, far ? 3 : 11 + it.strikes.length * 7, 14, 0.12); pts[pts.length - 1] = T.p.clone();
    for (const c of [...bolts.children]) { bolts.remove(c); c.geometry.dispose(); } const main = boltMesh(pts, far ? 4 : 0.16, boltM); const halo = boltMesh(pts, far ? 12 : 0.6, haloM); bolts.add(main, halo);
    const br = rnd(5 + it.strikes.length); for (let b = 0; b < 3; b++) { const j = 3 + Math.floor(br() * 6), a = pts[j], e = a.clone().add(V((br() - 0.5) * (far ? 140 : 14), -(far ? 60 : 9) * (0.5 + br()), (br() - 0.5) * (far ? 60 : 8))); bolts.add(boltMesh(sparkGeo(a, e, 30 + b, 6, 0.15), far ? 2 : 0.06, boltM)); }
    // grow the leader down (0.25 s), then the return stroke flashes (three times)
    bolts.visible = true; let k = 0; bolts.children.forEach((m) => { m.geometry.setDrawRange(0, 0); });
    it.busy = true; const cam = o.app && o.app.camera; const d = cam ? cam.position.distanceTo(T.p) : 30; it.dist = far ? 1700 : d;
    it.play(far ? 1.4 : 1.6, (kk) => { k = kk; const grow = clamp01(k / 0.18); bolts.children.forEach((m) => { const n = m.geometry.index ? m.geometry.index.count : m.geometry.attributes.position.count; m.geometry.setDrawRange(0, Math.floor(n * grow)); });
      const fl = k < 0.18 ? 0.15 : [0.2, 0.3, 0.42].some((x) => Math.abs(k - x) < 0.035) ? 1 : Math.max(0, 1 - (k - 0.2) * 3); it.flash(fl * (far ? 0.5 : 1));
      if (k > 0.2 && !it._hit) { it._hit = true; it.onHit(T, far); } }, () => { it._hit = false; bolts.visible = false; it.flash(0); it.busy = false; it.q = 0; it.strikes.push(T.what); if (cb) cb(T); }); return true; };
  it.flash = (v) => { flashT = v; const pl = o.app && o.app.places && o.app.places.root.children.find((c) => c.isMesh && c.material && c.material.map); if (pl) pl.material.color.setScalar(0.45 + 1.6 * v); };
  it.onHit = (T, far) => { it.flashAt = it.simT; it.thunderAt = it.simT + it.dist / 340; if (far) return; sfx(o.app, 'spark');
    if (T.what === 'tank') { it.damaged = true; scorch.material.opacity = 0.75; debris.forEach((d, i) => { d.m.visible = true; d.m.position.copy(TANK_TOP).add(V((i % 4 - 1.5) * 0.4, -0.6, 0.8)); d.v.set((Math.random() - 0.5) * 6, 3 + Math.random() * 5, 2 + Math.random() * 4); }); }
    else it.safe = true; };
  ticker(it, (dt) => { it.simT += dt;
    // rain
    const pos = rg.attributes.position.array; for (let i = 0; i < rainN; i++) { const d = drops[i]; d[1] -= dt * 14; if (d[1] < 0) d[1] += 22; pos[i * 6] = d[0]; pos[i * 6 + 1] = d[1]; pos[i * 6 + 2] = d[2]; pos[i * 6 + 3] = d[0] - 0.05; pos[i * 6 + 4] = d[1] + 0.5; pos[i * 6 + 5] = d[2]; } rg.attributes.position.needsUpdate = true;
    // the cloud's charges (+ on top, − at the base) and the + they draw up on the ground below
    let a = 0, b = 0; for (const m of cm) { const top = m.sign > 0; const n = Math.round(it.q * 14); const i = top ? a++ : b++; m.visible = i < n; if (m.visible) m.position.set(CLD.x + (i - 7) * 4.2 + Math.sin(i * 7) * 1.5, CLD.y + (top ? 14 : 0) + Math.sin(i * 3) * 1.2, CLD.z + Math.cos(i * 5) * 3); }
    let c = 0; for (const m of gm) { if (m.sign < 0) { m.visible = false; continue; } const n = Math.round(it.q * 10); m.visible = c < n; if (m.visible) m.position.set(CLD.x + (c - 5) * 2.2, 0.5, CLD.z + 30 + Math.sin(c) * 2); c++; }
    for (const p of parts) { p.ph += dt; const y = p.ice ? ((p.ph * 1.2) % 8) - 4 : 4 - ((p.ph * 0.9) % 8); p.m.position.y = y; p.c.position.copy(p.m.position).add(V(0.3, 0.4, 0.5)); p.c.visible = it.q > 0.05; p.m.rotation.y += dt; }
    for (const d of debris) if (d.m.visible) { d.v.y -= 9.8 * dt; d.m.position.addScaledVector(d.v, dt); d.m.rotation.x += dt * 4; if (d.m.position.y < 0.05) { d.m.position.y = 0.05; d.v.set(0, 0, 0); } }
    if (it.thunderAt > 0 && it.simT >= it.thunderAt) { it.thunderAt = -1; it.heardAt = it.simT; sfx(o.app, 'thunder'); if (it.onThunder) it.onThunder(); }
    if (!it.busy && o.app && o.app.places) { const pl = o.app.places.root.children.find((x) => x.isMesh && x.material && x.material.map); if (pl && Math.abs(pl.material.color.r - 0.45) > 0.01 && flashT <= 0) pl.material.color.setScalar(0.45); }
    const E = 0.1 + 9.9 * it.q; const heard = it.heardAt && it.simT - it.heardAt < 2.5;
    it.say([`${W('Clock')}: +${it.t.toFixed(1)} ${W('min')} · ${W('field at the ground')} ${E.toFixed(1)} kV/m`, heard ? `🔊 ${W('Thunder!')}` : it.fit > 0.98 ? W('Lightning conductor fitted') : it.q > 0.95 ? W('The cloud is fully charged') : W('Charges are separating in the cloud')], [it.q > 0.8 ? YEL : WHT, heard ? RED : it.fit > 0.98 ? OKC : WHT]); });
  it.clockPath = () => [V(-0.35, 1.0, -0.42), V(0.35, 1.0, -0.42)]; it.fitPath = () => [V(-0.45, 1.0, -0.3), V(-0.45, 1.0, -0.05)]; it.markAt = V(0.45, 1.0, -0.36);
  it.views = { all: { p: V(0, 1.6, 0.6), t: V(3, 6, -26) }, cloud: { p: V(0, 1.6, 0.6), t: V(4, 14, -40) }, far: { p: V(0, 1.6, 0.6), t: V(-12, 6, -60) }, school: { p: V(0, 1.6, 0.6), t: V(9, 5, -26) } };
  it.camView = it.views.all; it.innerAt = IC;
  mergeStatic(B, [tank, sign]);
  return it;
}
export function bindStorm(sv, clockK, fitK, markK, app, s, done = {}) {
  const on = (k) => (Array.isArray(s[k]) ? s[k] : [s[k]]).some((i) => stepNow(app, i));
  const sync = slideKnob(clockK, { path: () => sv.clockPath(), active: () => on('clock') && !sv.busy, keepVisible: () => on('clock'), k: () => sv.kt, set: (k) => sv.setT(k) });
  const sync2 = slideKnob(fitK, { path: () => sv.fitPath(), active: () => on('fit'), keepVisible: () => on('fit'), k: () => sv.fit, set: (k) => sv.setFit(k) });
  sv.onKt = () => sync(); sv.onFit = () => sync2();
  pushKnob(markK, { path: pressPath(sv.markAt, 0.04), active: () => on('mark') && sv.flashAt > 0, keepVisible: () => on('mark'), press: () => sv.mark() });
  sv.mark = () => { sv.marked = sv.simT - sv.flashAt; if (done.mark) done.mark(); return true; };
  let firedFar = 0, lastI = -1; const u0 = sv.update; sv.update = (dt, t) => { u0(dt, t); const i = app.runner.i;
    if (i !== lastI) { lastI = i; if (on('clock')) sv.resetClock(); }
    if (on('charge') && sv.q >= 0.99 && done.charged) done.charged();
    if (on('mark') && firedFar >= 0 && !sv.busy) { firedFar += dt; if (firedFar > 1.2) { firedFar = -1; sv.strike(true); } }
    if (on('strike') && sv.q >= 0.99 && !sv.busy && sv.strikes.length === (s.strikeN?.[i] ?? sv.strikes.length)) sv.strike(false, () => done.struck && done.struck());
    if (on('fit') && sv.fit > 0.98 && done.fitted) done.fitted();
    if (i >= (s.bubble ?? 99) && !sv.bubble.visible) sv.bubble.look(sv.innerAt.clone(), sv.innerAt.clone().add(V(0, 0, 12)), sv.W('Inside the cloud: ice crystals (+) rise, hail (−) falls')); };
}
