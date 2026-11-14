// DUET Maths Lab 360, hands-on in 3D, batch 4: a 5 m ladder against a wall whose angle the student changes by hand
// (sin, cos and tan, then standing inside the triangle), angles made by turning an arm around yourself (right, straight
// and full turns), and odd numbers that build squares of tiles on the ground around the student.
import * as THREE from 'three';
import { Item } from './apparatus.js';
import { canvasTex } from './mats.js';
import { lerp, clamp01 } from './mathlab2.js';
import { glow, rod, setRod, arc, rightMark, handle } from './mathworld.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const FONT = '"Noto Sans Devanagari", "Noto Sans", system-ui, sans-serif';
const stepNow = (app, i) => { const r = app.runner; return !!(r.exp && r.i === i && r.state === 'todo'); };
const M = (c, r = 0.6, m = 0, e = 0) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m, emissive: c, emissiveIntensity: e });
const DEG = Math.PI / 180;
// a label whose text changes (one canvas, redrawn only when the text changes)
export function liveSign(h = 0.2, w = 4) {
  const C = document.createElement('canvas'); C.width = 1024; C.height = Math.round(1024 / w); const t = new THREE.CanvasTexture(C); t.colorSpace = THREE.SRGBColorSpace;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: false, transparent: true, toneMapped: false })); sp.scale.set(h * w, h, 1); sp.renderOrder = 41; sp.userData.noHit = true;
  let last = null;
  sp.set = (lines, col = '#ffffff') => { const key = lines.join('|') + col; if (key === last) return; last = key; const x = C.getContext('2d'); x.clearRect(0, 0, C.width, C.height);
    x.fillStyle = 'rgba(12,16,24,0.82)'; x.beginPath(); x.roundRect(4, 4, C.width - 8, C.height - 8, 40); x.fill();
    const n = lines.length; let fs = Math.min(110, (C.height - 30) / n / 1.25); x.font = `800 ${fs}px ${FONT}`; const wid = () => Math.max(...lines.map((l) => x.measureText(l).width)); while (fs > 20 && wid() > C.width - 70) { fs -= 4; x.font = `800 ${fs}px ${FONT}`; } x.textAlign = 'center'; x.textBaseline = 'middle';
    lines.forEach((l, i) => { x.fillStyle = Array.isArray(col) ? col[i] : col; x.fillText(l, C.width / 2, 15 + (C.height - 30) * (i + 0.5) / n); }); t.needsUpdate = true; };
  return sp;
}
// a knob that is carried round a centre: its angle (clockwise from straight ahead, −z, in degrees) is followed, unwrapped
function turnKnob(knob, o) {
  knob.noGrab = false; knob.noPhys = true; knob.dragLift = 0;
  let last = null;
  const ang = (p) => Math.atan2(p.x - o.centre.x, -(p.z - o.centre.z)) / DEG;
  const u0 = knob.update;
  knob.update = (dt, t) => {
    if (u0) u0(dt, t);
    const on = o.active(); knob.g.visible = on || !!o.keepVisible?.();
    if (knob.pulse) knob.pulse.scale.setScalar(1 + 0.25 * Math.sin((t || performance.now() / 1000) * 5) * (on && !knob.held ? 1 : 0));
    if (!knob.held || !on) { last = null; return; }
    const p = knob.g.position; if (Math.hypot(p.x - o.centre.x, p.z - o.centre.z) < 0.12) return;
    const a = ang(p); if (last == null) { last = a; return; }
    let da = a - last; if (da > 180) da -= 360; if (da < -180) da += 360; last = a;
    if (Math.abs(da) > 1e-4) o.move(da);
    if (knob.held === 'pointer') knob.g.position.copy(o.at());
  };
  knob.onRelease = () => { last = null; const p0 = knob.g.position.clone(); let n = 0; const step = () => { n++; const e = Math.min(1, n / 12); knob.g.position.lerpVectors(p0, o.at(), e); if (e < 1 && !knob.held) requestAnimationFrame(step); }; step(); };
  knob.g.position.copy(o.at());
}

// ------------------------------------------------------------------ Class 10: trigonometry with a ladder against a wall
// A 5 m ladder leans against a wall on the student's left. Its foot is b metres from the wall and its top h metres up;
// the angle at its foot is θ. A lever at the student's hand changes θ; the sides and sin θ, cos θ, tan θ follow live.
export function ladderWall(o = {}) {
  const it = new Item('wladder', { ...o, name: { en: 'Ladder and wall', hi: 'सीढ़ी और दीवार', hg: 'Seedhi aur deewar' } });
  const g = it.g, L = 5, WX = o.wallX ?? -1.2; it.L = L; it.WX = WX; it.Z = o.z ?? -3.2;
  // the wall: plastered brick, along the student's left
  const brickT = canvasTex(512, 512, (x) => { x.fillStyle = '#d9cbb3'; x.fillRect(0, 0, 512, 512); x.strokeStyle = 'rgba(120,95,70,0.55)'; x.lineWidth = 6;
    for (let r = 0; r < 8; r++) { const y = r * 64; x.beginPath(); x.moveTo(0, y); x.lineTo(512, y); x.stroke(); for (let c = 0; c < 4; c++) { const xx = c * 128 + (r % 2) * 64; x.beginPath(); x.moveTo(xx, y); x.lineTo(xx, y + 64); x.stroke(); } } });
  brickT.wrapS = brickT.wrapT = THREE.RepeatWrapping; brickT.repeat.set(8, 3);
  const wall = new THREE.Mesh(new THREE.BoxGeometry(0.3, 5.6, 9), new THREE.MeshStandardMaterial({ map: brickT, roughness: 0.95 })); wall.position.set(WX - 0.15, 2.8, -2.2); wall.receiveShadow = wall.castShadow = true; wall.userData.noHit = true; g.add(wall);
  // the ladder: two rails and rungs every 30 cm, built along +x from its foot
  const lad = new THREE.Group(); g.add(lad);
  { const parts = [], rail = new THREE.BoxGeometry(L, 0.07, 0.045); for (const z of [-0.22, 0.22]) { const r = rail.clone(); r.translate(L / 2, 0, z); parts.push(r); }
    for (let s = 0.25; s < L - 0.1; s += 0.3) { const c = new THREE.CylinderGeometry(0.018, 0.018, 0.44, 10); c.rotateX(Math.PI / 2); c.translate(s, 0, 0); parts.push(c); }
    const m = new THREE.Mesh(mergeGeometries(parts.map((p) => p.index ? p.toNonIndexed() : p)), new THREE.MeshStandardMaterial({ color: 0xc9ced4, metalness: 0.75, roughness: 0.35 })); m.castShadow = true; m.userData.noHit = true; lad.add(m); }
  // the sides drawn on the ground and the wall, the angle at the foot, the right angle at the wall
  const yel = glow(0xffd23f), blu = glow(0x5ec8ff), red = glow(0xff7a5a, 0.9);
  const base = rod(V(0, 0, 0), V(1, 0, 0), 0.025, yel), ht = rod(V(0, 0, 0), V(0, 1, 0), 0.025, blu); g.add(base); g.add(ht);
  let arcG = null, rm = null;
  const rd = liveSign(0.36, 3.2); g.add(rd); it.readout = rd;
  it.theta = o.theta ?? Math.atan2(3, 4) / DEG;
  it.set = (deg) => {
    it.theta = deg; const t = deg * DEG, b = L * Math.cos(t), h = L * Math.sin(t), Z = it.Z; it.b = b; it.h = h;
    lad.position.set(WX + b, 0.04, Z); lad.rotation.set(0, 0, Math.PI - t);
    setRod(base, V(WX, 0.02, Z), V(WX + b, 0.02, Z)); setRod(ht, V(WX + 0.02, 0, Z), V(WX + 0.02, h, Z));
    if (arcG) { g.remove(arcG); arcG.traverse((m) => m.geometry && m.geometry.dispose()); } arcG = arc(V(WX + b, 0.03, Z), V(-1, 0, 0), V(-Math.cos(t), Math.sin(t), 0), 0.7, t, red, 0.06); g.add(arcG);
    if (!rm) { rm = new THREE.Group(); rm.add(rightMark(V(WX + 0.03, 0.03, 0), V(1, 0, 0), V(0, 1, 0), 0.3, glow(0xffffff), 0.012)); g.add(rm); } rm.position.z = Z;
    const f = (v) => v.toFixed(2);
    rd.set([`θ = ${deg.toFixed(1)}°`, `h = ${f(h)} m   b = ${f(b)} m`, `sin θ = ${f(h / L)}  cos θ = ${f(b / L)}  tan θ = ${f(h / b)}`], ['#ff9a7a', '#ffffff', '#8be07a']);
    rd.position.set(WX + 2.5, 3.0, Z + 0.4);
    if (it.onSet) it.onSet(deg);
  };
  it.set(it.theta);
  it.at = (k) => { const Z = it.Z; return ({ foot: V(WX + it.b + 0.2, 0.45, Z + 0.3), mid: V(WX + it.b / 2 + 0.25, it.h / 2 + 0.35, Z + 0.3), wall: V(WX + 0.45, it.h / 2, Z + 0.3), ground: V(WX + it.b / 2, 0.3, Z + 0.3), top: V(WX + 0.5, it.h + 0.35, Z + 0.3) }[k] || V(0, 2, Z)); };
  // the lever: k = 0 stands the ladder up (75°), k = 1 lays it low (15°)
  it.leverPath = () => [V(0.22, 1.0, -0.42), V(0.72, 1.0, -0.42)];
  it.kOf = (deg) => (75 - deg) / 60;
  it.noGrab = true; it.noPhys = true; it.height = 5; it.radius = 3; it.base = 0; return it;
}
export function bindLadderHands(lw, lever, app, steps = { s30: 2, s60: 3 }, done = {}) {
  const target = () => (stepNow(app, steps.s30) ? 30 : stepNow(app, steps.s60) ? 60 : null);
  handle(lever, { path: () => lw.leverPath(), active: () => target() != null && Math.abs(lw.theta - target()) > 0.01, keepVisible: () => app.runner.i >= steps.s30 && app.runner.i <= steps.s60,
    move: (k) => { const T = target(); if (T == null) return; let d = 75 - 60 * k; if (Math.abs(d - T) < 1.5) d = T; lw.set(d); if (d === T) done.set && done.set(T); },
    at: () => { const [A, B] = lw.leverPath(); return A.clone().lerp(B, clamp01(lw.kOf(lw.theta))); } });
  const s0 = lw.set; lw.set = (d) => { s0(d); if (!lever.held) { const [A, B] = lw.leverPath(); lever.g.position.copy(A.clone().lerp(B, clamp01(lw.kOf(d)))); } };
  lw.set(lw.theta);
}

// ------------------------------------------------------------------ Class 6: angles made by turning around yourself
// The student stands at the corner of an angle drawn on the playground: a yellow arm points straight ahead, and a red arm
// turns with the student's hand. The turn is measured clockwise from straight ahead, on a big protractor on the ground.
export function angleTurn(o = {}) {
  const it = new Item('wangle', { ...o, name: { en: 'Angle on the ground', hi: 'ज़मीन पर कोण', hg: 'Zameen par angle' } });
  const g = it.g, R = o.R ?? 2.6;
  // the protractor on the ground: a ring with a mark every 10° and numbers every 30° (0 straight ahead, turning right)
  const T = canvasTex(2048, 2048, (x) => {
    const c = 1024, r1 = 1000, r0 = 860; x.clearRect(0, 0, 2048, 2048);
    x.fillStyle = 'rgba(255,255,255,0.16)'; x.beginPath(); x.arc(c, c, r1, 0, Math.PI * 2); x.arc(c, c, r0 - 40, 0, Math.PI * 2, true); x.fill();
    x.strokeStyle = 'rgba(255,255,255,0.9)'; x.lineWidth = 10; x.beginPath(); x.arc(c, c, r1, 0, Math.PI * 2); x.stroke();
    for (let d = 0; d < 360; d += 5) { const a = d * DEG, s = Math.sin(a), co = -Math.cos(a), l = d % 30 === 0 ? 130 : d % 10 === 0 ? 80 : 40; x.lineWidth = d % 30 === 0 ? 12 : 6; x.beginPath(); x.moveTo(c + s * r1, c + co * r1); x.lineTo(c + s * (r1 - l), c + co * (r1 - l)); x.stroke(); }
    x.fillStyle = '#ffffff'; x.font = `800 84px ${FONT}`; x.textAlign = 'center'; x.textBaseline = 'middle';
    for (let d = 0; d < 360; d += 30) { const a = d * DEG; x.save(); x.translate(c + Math.sin(a) * (r0 - 60), c - Math.cos(a) * (r0 - 60)); x.rotate(a); x.fillText(d + '°', 0, 0); x.restore(); }
  });
  const disc = new THREE.Mesh(new THREE.PlaneGeometry(2 * R * 1.0, 2 * R * 1.0), new THREE.MeshBasicMaterial({ map: T, transparent: true, depthWrite: false, toneMapped: false }));
  disc.rotation.x = -Math.PI / 2; disc.position.y = 0.006; disc.scale.setScalar(1024 / 1000); disc.userData.noHit = true; disc.renderOrder = 2; g.add(disc);
  // the arms: stripes on the ground and a pole with a flag at the end of each
  const yel = glow(0xffd23f), redM = glow(0xff4a3a);
  const armA = rod(V(0, 0.02, 0), V(0, 0.02, -R), 0.035, yel), armB = rod(V(0, 0.02, 0), V(0, 0.02, -R), 0.035, redM); g.add(armA); g.add(armB);
  const pole = (mat) => { const p = new THREE.Group(); const s = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.6, 10), M(0xdddddd, 0.4, 0.6)); s.position.y = 0.8; p.add(s); const f = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.26), mat); f.material.side = THREE.DoubleSide; f.position.set(0.2, 1.45, 0); p.add(f); p.traverse((m) => { m.userData.noHit = true; }); return p; };
  const pA = pole(glow(0xffd23f)), pB = pole(glow(0xff4a3a)); pA.position.set(0, 0, -R); g.add(pA); g.add(pB);
  // the turned part: a filled sector on the ground
  const secM = new THREE.MeshBasicMaterial({ color: 0xff8a3a, transparent: true, opacity: 0.32, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
  const sec = new THREE.Mesh(new THREE.CircleGeometry(R * 0.95, 4, 0, 0.001), secM); sec.rotation.x = -Math.PI / 2; sec.position.y = 0.012; sec.userData.noHit = true; sec.renderOrder = 3; g.add(sec);
  const rd = liveSign(0.32, 2.6); g.add(rd); it.readout = rd;
  it.A = 0; it.max = 360;
  const dir = (a) => V(Math.sin(a * DEG), 0, -Math.cos(a * DEG));
  it.kind = (a) => (a < 0.5 ? '' : a < 89.5 ? 'acute' : a < 90.5 ? 'right' : a < 179.5 ? 'obtuse' : a < 180.5 ? 'straight' : a < 359.5 ? 'reflex' : 'full');
  it.names = o.names || {};
  it.set = (a) => {
    it.A = Math.max(0, Math.min(it.max, a)); const d = dir(it.A);
    setRod(armB, V(0, 0.022, 0), d.clone().multiplyScalar(R).setY(0.022)); pB.position.copy(d.clone().multiplyScalar(R)); pB.rotation.y = -it.A * DEG;
    sec.geometry.dispose(); sec.geometry = new THREE.CircleGeometry(R * 0.95, Math.max(2, Math.ceil(it.A / 4)), (90 - it.A) * DEG, Math.max(0.001, it.A * DEG));
    const k = it.kind(it.A); rd.set([`${Math.round(it.A)}°`, it.names[k] || ''], ['#ffd23f', '#ffffff']);
    rd.position.copy(dir(it.A).multiplyScalar(R * 0.62)).setY(2.05);
    if (it.onSet) it.onSet(it.A);
  };
  it.set(0);
  it.knobAt = () => dir(it.A).multiplyScalar(0.55).setY(1.02);
  it.noGrab = true; it.noPhys = true; it.height = 2; it.radius = R; it.base = 0; return it;
}
// the red arm turns with the knob; each step has its own stopping angle (90, 180, 360)
export function bindAngleHands(at, knob, app, steps = { 1: 90, 2: 180, 3: 360 }, done = {}) {
  const goal = () => { for (const i in steps) if (stepNow(app, +i)) return steps[i]; return null; };
  turnKnob(knob, { centre: V(0, 0, 0), active: () => goal() != null && at.A < goal() - 0.01, keepVisible: () => goal() != null,
    move: (da) => { const G = goal(); if (G == null) return; let a = Math.min(G, Math.max(0, at.A + da)); if (G - a < 4) a = G; at.set(a); if (a >= G) done.reach && done.reach(G); },
    at: () => at.knobAt() });
  const s0 = at.set; at.set = (a) => { s0(a); if (!knob.held) knob.g.position.copy(at.knobAt()); };
}

// ------------------------------------------------------------------ Class 6: odd numbers make squares
// Square tiles (42 cm) on the ground, starting at the student's feet. Each new L-shaped layer around the square has the
// next odd number of tiles: 1, 3, 5, 7 … and the tiles always make a square: 1 + 3 + 5 + … (n numbers) = n × n.
export function oddSquares(o = {}) {
  const it = new Item('wodd', { ...o, name: { en: 'Square of tiles', hi: 'टाइलों का वर्ग', hg: 'Tiles ka square' } });
  const g = it.g, S = o.S ?? 0.42, N = 6;
  const cols = [0xf2c230, 0x3d7be0, 0x2ea36b, 0xd9493a, 0x9b59d0, 0xf08a24];
  const geo = new THREE.BoxGeometry(S * 0.94, 0.04, S * 0.94); geo.translate(0, 0.02, 0);
  const im = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ roughness: 0.55 }), N * N); im.castShadow = false; im.receiveShadow = true; im.frustumCulled = false; im.userData.noHit = true; g.add(im);
  const cells = []; for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) cells.push({ i, j, n: Math.max(i, j) });
  const Mx = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = V(1, 1, 1), p = V(0, 0, 0), col = new THREE.Color();
  // the square grows forward (−z) and to the right (+x) from the corner at the student's feet
  const pos = (i, j) => V(0.08 + (i + 0.5) * S, 0, -0.08 - (j + 0.5) * S);
  it.layers = 1; it.grow = {}; // grow[n]: 0 … 1 while layer n rises
  const draw = () => {
    cells.forEach((c, k) => { const e = c.n < it.layers - 1 ? 1 : c.n === it.layers - 1 ? (it.grow[c.n] ?? 1) : 0; p.copy(pos(c.i, c.j)); p.y = -0.05 * (1 - e); sc.set(e > 0 ? 1 : 0, Math.max(0.001, e), e > 0 ? 1 : 0); Mx.compose(p, q, sc); im.setMatrixAt(k, Mx); im.setColorAt(k, col.set(cols[c.n % cols.length])); });
    im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true;
  };
  draw();
  it.add = () => { if (it.layers >= N) return false; const n = it.layers; it.layers += 1; it.grow[n] = 0; if (it.onLayer) it.onLayer(it.layers); return true; };
  it.update = (dt) => { let ch = false; for (const k in it.grow) if (it.grow[k] < 1) { it.grow[k] = Math.min(1, it.grow[k] + (dt || 0.016) * 2.2); ch = true; } if (ch) draw(); };
  // the outline of a 10 × 10 square (the last question)
  const ghost = new THREE.Group(); ghost.visible = false; g.add(ghost);
  { const m = glow(0xffffff, 0.8), L = 10 * S, a = pos(0, 0).add(V(-S / 2, 0.03, S / 2)); const b = a.clone().add(V(L, 0, 0)), c2 = b.clone().add(V(0, 0, -L)), d = a.clone().add(V(0, 0, -L)); for (const [u, v] of [[a, b], [b, c2], [c2, d], [d, a]]) ghost.add(rod(u, v, 0.02, m)); }
  it.showTen = (on) => { ghost.visible = on; };
  it.layerAt = (n) => pos(n - 1, n - 1).add(V(0, 0.55, 0)); // the corner tile of layer n
  it.sideAt = (n) => pos(n / 2 - 0.5, -0.9).add(V(0, 0.12, 0)); // in front of the square's near edge
  it.leverPath = () => [V(-0.38, 1.0, -0.3), V(-0.38, 1.0, -0.02)];
  it.noGrab = true; it.noPhys = true; it.height = 0.1; it.radius = 2; it.base = 0; return it;
}
// a lever pulled towards the student: each pull adds one layer (in the given steps, up to a number of layers each)
export function bindOddHands(sq, lever, app, upto = { 1: 2, 2: 4, 3: 6 }, done = {}) {
  let k0 = 0, fired = false;
  const lim = () => { for (const i in upto) if (stepNow(app, +i)) return upto[i]; return null; };
  handle(lever, { path: () => sq.leverPath(), active: () => lim() != null && sq.layers < lim(), keepVisible: () => lim() != null,
    move: (k) => { k0 = k; if (k > 0.75 && !fired) { fired = true; if (sq.add()) done.layer && done.layer(sq.layers); } if (k < 0.25) fired = false; },
    at: () => { const [A, B] = sq.leverPath(); return lever.held ? A.clone().lerp(B, k0) : A.clone(); } });
  const r0 = lever.onRelease; lever.onRelease = () => { r0(); k0 = 0; fired = false; };
  lever.g.position.copy(sq.leverPath()[0]);
}
