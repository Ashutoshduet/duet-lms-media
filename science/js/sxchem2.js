// DUET Science Lab 360, batch SX-CGM, chemistry at the lab bench, done with your own hands:
//  - crystals: build the simple, body-centred and face-centred cubic unit cells from balls on a wire frame, count the
//    atoms each cell really owns (cut view), stack cells into a crystal of salt, and grow a big alum crystal on a thread
//    from a hot saturated solution (it grows only if the solution really was saturated);
//  - the density of liquids: weigh 4 measured liquids on a digital balance (forget the TARE and the numbers come out
//    wrong), float a hydrometer in each, and an egg in water and in strong salt water;
//  - a molecule kit: build H₂O, CO₂, CH₄, NH₃, C₂H₅OH and glucose atom by atom (each atom has as many holes as its
//    valency, so wrong builds are refused with the reason), see salt form from ions, and view all as space-filling models.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { Item, clamp01, ease, liveSign, tag, tex, rnd, noHit, stepNow, V, carry, thing, clock, done1, slider, button, mat, std, steel, glassM, glowM, woodTex, box, cyl, sph, lathe, rodBetween, TAU, N3, lerp, smooth, BENCH_Y, LITE, zoomBubble } from './sxkit.js';

const Y = BENCH_Y;
const T = {};
function moveT(it, p, q, sec = 0.8, cb) { it.flying = true; const p0 = it.g.position.clone(), q0 = it.g.quaternion.clone(); let k = 0; const dt = clock(); const lift = Math.min(0.1, 0.4 * p0.distanceTo(p));
  const step = () => { k = Math.min(1, k + dt() / sec); const e = ease(k); it.g.position.lerpVectors(p0, p, e); it.g.position.y += Math.sin(e * Math.PI) * lift; if (q) it.g.quaternion.slerpQuaternions(q0, q, e); if (k < 1) requestAnimationFrame(step); else { it.flying = false; it.home = { p: p.clone(), q: it.g.quaternion.clone() }; if (cb) cb(); } };
  step(); }
const moveP = (it, p, q, sec) => new Promise((r) => moveT(it, p, q, sec, r));
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
// shiny painted balls (crystal and molecule models are made of these)
const ballM = (c) => mat('sxball' + c, () => new THREE.MeshStandardMaterial({ color: c, roughness: 0.32, metalness: 0.02 }));
const cutM = (c) => mat('sxcut' + c, () => new THREE.MeshStandardMaterial({ color: new THREE.Color(c).lerp(new THREE.Color(0xffffff), 0.35), roughness: 0.75, side: THREE.DoubleSide }));

// ================================================================== crystals and unit cells
// The wire frame is a cube of edge L on a short stand; ball places in cell units (0…1): 8 corners, the centre, 6 faces.
const CORN = []; for (const x of [0, 1]) for (const y of [0, 1]) for (const z of [0, 1]) CORN.push([x, y, z]);
const FACE = [[0.5, 0.5, 0], [0.5, 0.5, 1], [0, 0.5, 0.5], [1, 0.5, 0.5], [0.5, 0, 0.5], [0.5, 1, 0.5]];
const CENT = [[0.5, 0.5, 0.5]];
export function crystalKit(o = {}) {
  const it = new Item('sxcry', { ...o, name: N3('Crystal model kit', 'क्रिस्टल मॉडल किट', 'Crystal model kit') });
  const g = it.g, W = o.W || ((k) => k), L = 0.12, H0 = 0.07, X0 = -0.36; // frame edge, height of its bottom, its centre x (item-local)
  it.L = L; it.mode = 'scc'; it.on = { c: new Set(), b: new Set(), f: new Set() };
  const wood = std(0x9a6a3e, 0.6, 0, { map: woodTex('#9a6a3e', 21) });
  g.add(box(0.2, 0.02, 0.2, wood, X0, 0.01, 0)); g.add(cyl(0.006, 0.006, H0 - 0.02, steel(), 10, X0, 0.02 + (H0 - 0.02) / 2, 0));
  const frame = new THREE.Group(); frame.position.set(X0 - L / 2, H0, -L / 2); g.add(frame); it.frame = frame;
  const wireM = steel(); for (let a = 0; a < 3; a++) for (const u of [0, 1]) for (const v of [0, 1]) { const p = [0, 0, 0], q = [0, 0, 0]; const i = (a + 1) % 3, j = (a + 2) % 3; p[i] = q[i] = u * L; p[j] = q[j] = v * L; q[a] = L; frame.add(rodBetween(V(...p), V(...q), 0.0012, wireM, 6)); }
  // where each ball goes (world), the glowing rings that show the open places
  it.placeW = (c) => frame.localToWorld(V(c[0] * L, c[1] * L, c[2] * L));
  const rings = new THREE.Group(); frame.add(rings);
  const ringOf = (c) => { const m = new THREE.Mesh(new THREE.TorusGeometry(0.014, 0.0018, 8, 28), glowM(0xffd23f, 0.9)); m.position.set(c[0] * L, c[1] * L, c[2] * L); m.rotation.x = Math.PI / 2; m.userData.c = c; rings.add(m); return m; };
  const RC = CORN.map(ringOf), RB = CENT.map(ringOf), RF = FACE.map(ringOf);
  it.showRings = (on) => { const t = performance.now() / 1000; RC.forEach((m, i) => { m.visible = on && it.mode !== 'none' && !it.on.c.has(i); m.scale.setScalar(1 + 0.12 * Math.sin(t * 5)); });
    RB.forEach((m, i) => { m.visible = on && it.mode === 'bcc' && !it.on.b.has(i); m.scale.setScalar(1 + 0.12 * Math.sin(t * 5)); }); RF.forEach((m, i) => { m.visible = on && it.mode === 'fcc' && !it.on.f.has(i); m.scale.setScalar(1 + 0.12 * Math.sin(t * 5)); }); };
  noHit(frame);
  // the cut view beside it: true-size atoms cut by the six faces of the cell (⅛ at a corner, ½ on a face, all of the centre one)
  const cut = new THREE.Group(); cut.position.set(X0 + 0.22 - L / 2, H0, -L / 2); g.add(cut); it.cut = cut;
  const cutWire = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(L, L, L)), mat('sxcwire', () => new THREE.LineBasicMaterial({ color: 0xc8ccd0 }))); cutWire.position.set(L / 2, L / 2, L / 2); cut.add(cutWire);
  const parts = new THREE.Group(); cut.add(parts); cut.visible = false; noHit(cut);
  // a piece of a sphere of radius R at p, the part inside the cell [0, L]³ (corner: one octant, face: one half)
  const piece = (p, R, col) => { const inside = (d) => [0, 1, 2].map((i) => (p[i] === 0 ? 1 : p[i] === 1 ? -1 : 0)); const s = inside();
    const grp = new THREE.Group(); grp.position.set(p[0] * L, p[1] * L, p[2] * L);
    const nOpen = s.filter((x) => x !== 0).length;
    if (nOpen === 0) { grp.add(sph(R, ballM(col), 0, 0, 0, 28)); return grp; }
    // sphere part: keep the vertices on the inside of each cut (move outside ones onto the plane: a clean flat cut)
    const geo = new THREE.SphereGeometry(R, 32, 22); const P = geo.attributes.position;
    for (let i = 0; i < P.count; i++) for (let a = 0; a < 3; a++) if (s[a] !== 0) { const v = P.getComponent(i, a); if (v * s[a] < 0) P.setComponent(i, a, 0); }
    geo.computeVertexNormals(); const m = new THREE.Mesh(geo, cutM(col)); m.material = ballM(col); grp.add(m);
    // the flat cut faces, a lighter colour
    for (let a = 0; a < 3; a++) if (s[a] !== 0) { const disc = new THREE.Mesh(new THREE.CircleGeometry(R, 32), cutM(col)); const o2 = [0, 1, 2].filter((x) => x !== a);
      // only the part of the disc inside the other cuts
      if (a === 0) disc.rotation.y = Math.PI / 2; if (a === 1) disc.rotation.x = -Math.PI / 2;
      disc.updateMatrix(); disc.geometry.applyMatrix4(disc.matrix); disc.rotation.set(0, 0, 0); const D2 = disc.geometry.attributes.position;
      for (let i = 0; i < D2.count; i++) for (const b of o2) if (s[b] !== 0) { const v = D2.getComponent(i, b); if (v * s[b] < 0) D2.setComponent(i, b, 0); }
      grp.add(disc); }
    return grp; };
  it.showCut = (mode) => { parts.clear(); cut.visible = !!mode; if (!mode) return; const r = mode === 'scc' ? L / 2 : mode === 'bcc' ? Math.sqrt(3) * L / 4 : Math.SQRT2 * L / 4;
    for (const c of CORN) parts.add(piece(c, r, 0x3f78c8)); if (mode === 'bcc') parts.add(piece(CENT[0], r, 0xd04a3a)); if (mode === 'fcc') for (const c of FACE) parts.add(piece(c, r, 0x3fa05a)); noHit(parts); };
  // the salt crystal: Na⁺ and Cl⁻ ions in a rock-salt lattice, n cells along each edge (grows out of the cell)
  const NA = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 14, 10), ballM(0x8a5ac8), 9 * 9 * 9), CL = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 16, 12), ballM(0x4fb04a), 9 * 9 * 9);
  for (const m of [NA, CL]) { m.count = 0; m.castShadow = true; m.userData.noHit = true; g.add(m); }
  it.salt = 0; const SX = 0.24; // the crystal stands at x = SX on the bench
  it.setSalt = (n) => { it.salt = n; const a = 0.024 * Math.min(1, 2.2 / Math.max(1, n)); const N = 2 * n + 1, d = new THREE.Object3D(); let i = 0, j = 0;
    for (let x = 0; x < N && n > 0; x++) for (let y = 0; y < N; y++) for (let z = 0; z < N; z++) { const na = (x + y + z) % 2 === 0; d.position.set(SX + (x - (N - 1) / 2) * a * 0.5, 0.02 + y * a * 0.5 + a * 0.3, (z - (N - 1) / 2) * a * 0.5); d.scale.setScalar(a * (na ? 0.17 : 0.27)); d.updateMatrix(); if (na) NA.setMatrixAt(i++, d.matrix); else CL.setMatrixAt(j++, d.matrix); }
    NA.count = i; CL.count = j; NA.instanceMatrix.needsUpdate = true; CL.instanceMatrix.needsUpdate = true; plinth.visible = n > 0; it.show(); };
  const plinth = box(0.16, 0.02, 0.16, wood, SX, 0.01, 0); plinth.visible = false; g.add(plinth);
  // the count
  const sign = liveSign(0.055, 7); sign.position.set(-0.05, 0.36, -0.22); g.add(sign); it.say = (l, c) => sign.set(l, c);
  it.count = () => it.on.c.size / 8 + it.on.b.size + it.on.f.size / 2;
  it.show = () => { const c = it.on.c.size, b = it.on.b.size, f = it.on.f.size;
    if (it.salt) { const n = it.salt, N = 2 * n + 1; it.say([`${W('Salt crystal')}: ${n} × ${n} × ${n} ${W('cells')} · ${Math.ceil(N ** 3 / 2)} Na⁺ + ${Math.floor(N ** 3 / 2)} Cl⁻`, `${W('Edge')} ≈ ${(n * 0.564).toFixed(2)} nm · ${W('the outside is a cube too')}`], ['#ffffff', '#ffd23f']); return; }
    const parts0 = [`${W('Corners')}: ${c} × ⅛ = ${c / 8}`]; if (it.mode === 'bcc' || b) parts0.push(`${W('Centre')}: ${b} × 1 = ${b}`); if (it.mode === 'fcc' || f) parts0.push(`${W('Faces')}: ${f} × ½ = ${f / 2}`);
    const name = { scc: W('Simple cubic'), bcc: W('Body-centred cubic'), fcc: W('Face-centred cubic') }[it.mode] || '';
    it.say([`${name} · ${parts0.join(' · ')}`, `${W('Atoms that belong to one cell')}: ${+it.count().toFixed(3)}`], ['#ffffff', '#ffd23f']); };
  it.views = { all: { p: V(-0.04, 0.5, 0.56), t: V(-0.04, 0.12, -0.08) }, frame: { p: V(-0.2, 0.42, 0.42), t: V(-0.22, 0.12, -0.04) }, salt: { p: V(0.12, 0.42, 0.48), t: V(0.12, 0.1, -0.04) }, alum: { p: V(0.42, 0.44, 0.5), t: V(0.42, 0.12, -0.08) } };
  it.show();
  return done1(it, { height: 0.25, radius: 0.5 });
}
// the balls (things), the knob for the crystal, the cut-view button: joined to the steps
export function bindCrystals(ck, K, s, done = {}) {
  const app = K.app, fired = new Set(); const once = (k, f) => { if (fired.has(k)) return; fired.add(k); f && f(); };
  const balls = []; const C = { c: 0x3f78c8, b: 0xd04a3a, f: 0x3fa05a };
  // a wooden tray of 16 balls in front of the frame (blue for corners, red for the centre, green for the faces)
  const trayAt = (i) => ck.g.localToWorld(V(-0.52 + (i % 8) * 0.03, 0.012, 0.14 + Math.floor(i / 8) * 0.03));
  K.add(Object.assign(new Item('sxtray', { name: N3('Tray of balls', 'गेंदों की ट्रे', 'Balls ki tray') }), {}), 0, 0); // (an empty item keeps ids in order)
  const trayG = box(0.25, 0.012, 0.075, std(0x8a5a32, 0.6, 0, { map: woodTex('#8a5a32', 5) })); trayG.position.copy(ck.g.localToWorld(V(-0.415, 0.006, 0.155))); trayG.userData.noHit = true; K.app.scene.add(trayG); K.extras.push(trayG);
  const kinds = ['c', 'c', 'c', 'c', 'c', 'c', 'c', 'c', 'b', 'f', 'f', 'f', 'f', 'f', 'f', 'b'];
  kinds.forEach((kd, i) => { const grp = new THREE.Group(); grp.add(sph(0.011, ballM(C[kd]), 0, 0.011, 0, 18));
    const b = K.add(thing(N3('Ball', 'गेंद', 'Ball'), grp, { hitR: 0.02, hitY: 0.011 }), 0, 0, { y: Y }); b.g.position.copy(trayAt(i)); b.home = { p: b.g.position.clone(), q: new THREE.Quaternion() }; b.kd = kd; b.at = null;
    carry(b, [{ open: () => open(b), at: () => nearest(b).w, r: 0.05, put: (t) => put(t) }], { lift: 0.2, free: (t, p) => { if (t.at) { unplace(t); } return false; } }); balls.push(b); });
  // the open places for a ball (by the step): corners in the first, the centre in the second, faces in the third
  const opens = () => { const i = app.runner.i, out = []; const add = (list, key) => list.forEach((c, k) => { if (!ck.on[key].has(k)) out.push({ key, k, c, w: ck.placeW(c) }); });
    if (i === s.scc) add(CORN, 'c'); if (i === s.bcc) add(CENT, 'b'); if (i === s.fcc) add(FACE, 'f'); return out; };
  // which open place the student means: nearest in plan, and of two over each other (top and bottom) the lower one first
  const nearest = (b) => { const p = b.g.getWorldPosition(V(0, 0, 0)); const os = opens(); if (!os.length) return { w: V(0, -9, 0) }; os.sort((a, c) => (Math.hypot(a.w.x - p.x, a.w.z - p.z) - Math.hypot(c.w.x - p.x, c.w.z - p.z)) || a.w.y - c.w.y);
    const best = os[0]; const same = os.filter((o2) => Math.hypot(o2.w.x - best.w.x, o2.w.z - best.w.z) < 0.005).sort((a, c) => a.w.y - c.w.y); return same[0]; };
  const open = (b) => !b.at && [s.scc, s.bcc, s.fcc].includes(app.runner.i) && app.runner.state === 'todo';
  const put = (b) => { const o2 = nearest(b); if (!o2.key) return; b.at = o2; ck.on[o2.key].add(o2.k); ck.show(); moveT(b, o2.w.clone().add(V(0, -0.011, 0)), null, 0.5, () => { check(); }); };
  const unplace = (b) => { ck.on[b.at.key].delete(b.at.k); b.at = null; ck.show(); };
  const check = () => { const i = app.runner.i; if (i === s.scc && ck.on.c.size === 8) once('scc', done.scc); if (i === s.bcc && ck.on.c.size === 8 && ck.on.b.size === 1) once('bcc', done.bcc); if (i === s.fcc && ck.on.c.size === 8 && ck.on.f.size === 6 && ck.on.b.size === 0) once('fcc', done.fcc); };
  // the centre ball has to come out for the face-centred cell: in that step it can be carried away (back to the tray)
  const u0 = ck.update; let lastI = -1;
  ck.update = (dt, t) => { if (u0) u0(dt, t); const i = app.runner.i; ck.showRings(app.runner.state === 'todo');
    if (i !== lastI) { lastI = i; ck.mode = i <= s.scc ? 'scc' : i === s.bcc ? 'bcc' : i === s.fcc ? 'fcc' : ck.mode; ck.show(); }
    for (const b of balls) { if (b.flying) continue; const free = !b.at; b.noGrab = !((free && open(b)) || (b.at && b.at.key === 'b' && i === s.fcc)); }
    // a centre ball taken out in the face-centred step goes back to the tray
    for (const b of balls) if (b.at && b.at.key === 'b' && i === s.fcc && b.held) { unplace(b); }
    const cv = app.runner.i >= s.scc && app.runner.done.has(app.runner.i) ? ck.mode : null; if (cv !== ck._cv && app.runner.i <= s.fcc) { ck._cv = cv; ck.showCut(cv); } };
  // Do it: the balls go to their places
  ck.fill = async (key) => { if (key === 'f') for (const b of balls) if (b.at && b.at.key === 'b') { unplace(b); await moveP(b, b.home ? trayAt(balls.indexOf(b)) : b.g.position, null, 0.4); }
    for (const b of balls) { if (b.at || b.kd !== key) continue; const os = opens().filter((o2) => o2.key === key); if (!os.length) break; const o2 = os.sort((a, c) => a.w.y - c.w.y)[0]; b.at = o2; ck.on[key].add(o2.k); ck.show(); await moveP(b, o2.w.clone().add(V(0, -0.011, 0)), null, 0.35); }
    check(); };
  // the salt crystal: a knob slid from 1 to 4 cells along each edge
  slider(s.knobSalt, { path: () => [ck.g.localToWorld(V(0.12, 0.02, 0.15)), ck.g.localToWorld(V(0.36, 0.02, 0.15))], active: () => stepNow(app, s.salt), keepVisible: () => app.runner.i === s.salt, k: () => (Math.max(1, ck.salt) - 1) / 3,
    set: (k) => { const n = 1 + Math.round(clamp01(k) * 3); if (n !== ck.salt) ck.setSalt(n); if (n === 4) once('salt', done.salt); } });
  ck.balls = balls;
}

// ------------------------------------------------------------------ an alum crystal grown on a thread
// Potash alum (fitkari) dissolves far more in hot water than in cold (g per 100 g of water); common salt hardly changes.
const ALUM = [[0, 3.0], [10, 4.0], [20, 5.9], [30, 8.4], [40, 11.7], [50, 17.0], [60, 24.8], [70, 40.0], [80, 71.0], [90, 109]];
export const alumSol = (T) => { for (let i = 1; i < ALUM.length; i++) if (T <= ALUM[i][0]) { const [a, b] = [ALUM[i - 1], ALUM[i]]; return a[1] + (b[1] - a[1]) * (T - a[0]) / (b[0] - a[0]); } return 109; };
// an octahedron of alum (clear, slightly frosted), size s (m, tip to tip)
const alumGeo = () => T.alumG || (T.alumG = (() => { const g0 = new THREE.OctahedronGeometry(0.5, 0); g0.scale(1, 0.92, 1); g0.computeVertexNormals(); return g0; })());
const alumM = () => mat('sxalum', () => new THREE.MeshStandardMaterial({ color: 0xf4f6f7, roughness: 0.12, metalness: 0, transparent: true, opacity: 0.78, envMapIntensity: 1.8, flatShading: true }));
export function alumSetup(o = {}) {
  const it = new Item('sxalum', { ...o, name: N3('Alum, a pencil and a thread', 'फ़िटकरी, एक पेंसिल और धागा', 'Fitkari, ek pencil aur dhaaga') });
  const g = it.g, W = o.W || ((k) => k);
  // the jar of alum (white lumps), the pencil with a thread and a small seed crystal, a magnifier for the crystal
  const jar = lathe([[0, 0], [0.032, 0], [0.034, 0.004], [0.034, 0.075], [0.03, 0.08], [0.03, 0.088], [0.0285, 0.088], [0.0285, 0.08], [0, 0.08]], glassM(0.3), 28); jar.renderOrder = 6; g.add(jar);
  const lumps = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(0.006, 0), std(0xf0f0ea, 0.35), 40); { const r = rnd(4), d = new THREE.Object3D(); for (let i = 0; i < 40; i++) { const a = r() * TAU, rr = r() * 0.027; d.position.set(Math.cos(a) * rr, 0.006 + r() * 0.035, Math.sin(a) * rr); d.rotation.set(r() * 3, r() * 3, r() * 3); d.scale.setScalar(0.6 + r() * 0.9); d.updateMatrix(); lumps.setMatrixAt(i, d.matrix); } } g.add(lumps);
  const lab = tag(W('Alum (fitkari)'), '#ffffff', 0.022); lab.position.set(0, 0.11, 0); g.add(lab);
  it.left = 40;
  return done1(it, { height: 0.09, radius: 0.04 });
}
// the pencil laid across the beaker, a thread hanging into it with the seed crystal at its end; the crystal grows or
// shrinks with what the solution holds
export function seedThread(o = {}) {
  const it = new Item('sxseed', { ...o, name: N3('Pencil with a thread and a seed crystal', 'धागे और छोटे क्रिस्टल वाली पेंसिल', 'Dhaage aur chhote crystal wali pencil') });
  const g = it.g; const pen = new THREE.Group(); g.add(pen);
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.0038, 0.0038, 0.17, 6), std(0xe7b52c, 0.5)); body.rotation.z = Math.PI / 2; body.position.y = 0.004; pen.add(body);
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.0038, 0.016, 6), std(0xe8cfa2, 0.7)); tip.rotation.z = -Math.PI / 2; tip.position.set(0.093, 0.004, 0); pen.add(tip);
  const thread = new THREE.Mesh(new THREE.CylinderGeometry(0.0005, 0.0005, 1, 5), std(0xf4f0e6, 0.9)); pen.add(thread); it.thread = thread;
  const cr = new THREE.Mesh(alumGeo(), alumM()); cr.castShadow = true; pen.add(cr); it.cr = cr; it.size = 0.004;
  it.hang = (len) => { thread.scale.y = len; thread.position.set(0, 0.004 - len / 2, 0); cr.position.set(0, 0.004 - len - it.size * 0.4, 0); };
  it.setSize = (sz) => { it.size = Math.max(0.0005, sz); cr.scale.setScalar(it.size); cr.visible = sz > 0.0008; it.hang(it.len || 0.012); };
  it.len = 0.012; it.setSize(0.004); g.traverse((m) => { m.castShadow = true; });
  it.height = 0.01; it.radius = 0.06; it.grabY = 0.004; it.base = 0;
  return it;
}

// ================================================================== the density of liquids
// densities (g/mL) of what the bottles hold
export const RHO = { water: 1.0, moil: 0.92, milkfull: 1.03, nacl: 1.12 };
const rhoOf = (v) => { const L = v.mix ? v.mix.liq : {}; let m = 0, ml = 0; for (const k in L) { m += L[k] * (RHO[k] ?? 1); ml += L[k]; } return { m, ml, rho: ml > 0.01 ? m / ml : 0 }; };
export { rhoOf };
// a tall glass jar for the hydrometer (Vessel-like, from the lab's own glass) — made by the experiment with K.add
// the hydrometer: a glass float with lead shot in its bulb and a paper scale in its stem (reads 0.90 at the top … 1.20)
export function hydrometer(o = {}) {
  const it = new Item('sxhydro', { ...o, name: N3('Hydrometer', 'हाइड्रोमीटर', 'Hydrometer') });
  const g = it.g, gl = glassM(0.32);
  const prof = [[0, 0], [0.004, 0.002], [0.0085, 0.012], [0.0105, 0.03], [0.0105, 0.075], [0.0085, 0.085], [0.0042, 0.092], [0.0042, 0.215], [0.0035, 0.22], [0, 0.221]];
  const shell = lathe(prof, gl, 28); shell.renderOrder = 7; g.add(shell);
  const shot = new THREE.Mesh(new THREE.SphereGeometry(0.008, 16, 10, 0, TAU, Math.PI / 2, Math.PI / 2), std(0x5a5e63, 0.5, 0.7)); shot.position.y = 0.011; g.add(shot);
  // the paper scale: density marks; each mark is where the hydrometer floats in a liquid of that density
  const scale = new THREE.Mesh(new THREE.PlaneGeometry(0.0062, 0.11), new THREE.MeshStandardMaterial({ map: tex(64, 1024, (x) => { x.fillStyle = '#fbf6e2'; x.fillRect(0, 0, 64, 1024); x.fillStyle = '#20242a'; x.font = '700 22px sans-serif'; x.textAlign = 'right';
    for (let r = 0.9; r <= 1.2001; r += 0.01) { const y = 1024 * (1 - it.markY(r) / 0.11); const big = Math.round(r * 100) % 5 === 0; x.fillRect(0, y - 1.5, big ? 30 : 18, 3); if (Math.round(r * 100) % 10 === 0) x.fillText(r.toFixed(1), 62, y + 8); } }), roughness: 0.8 }));
  scale.position.set(0, 0.098 + 0.055, 0.0003); g.add(scale); scale.renderOrder = 6;
  // physics: mass 22 g; volume below the stem's bottom 19.4 mL, stem 0.32 mL per cm (radius 3.2 mm inside)
  const M = 22, V0 = 19.4, A = Math.PI * 0.42 * 0.42; // mL, cm²
  it.depthCm = (rho) => 9.2 + Math.max(0, (M / rho - V0) / A); // how deep it sinks (cm from the bottom)
  it.markY = (rho) => (it.depthCm(rho) - 9.8) / 100; // where the scale shows that density (m above the scale's bottom, at 9.8 cm)
  it.rho = null; it.height = 0.22; it.radius = 0.012; it.grabY = 0.15;
  return it;
}
// a raw egg (a little speckled, matt), density 1.08
export function egg() { const g = new THREE.Group(); const pts = []; for (let i = 0; i <= 24; i++) { const t = i / 24, a = t * Math.PI; pts.push(new THREE.Vector2(Math.sin(a) * 0.021 * (1 - 0.18 * Math.cos(a)), 0.028 - Math.cos(a) * 0.028)); }
  const m = new THREE.Mesh(new THREE.LatheGeometry(pts, 28), std(0xead8bd, 0.65, 0, { map: T.egg || (T.egg = tex(128, 64, (x) => { x.fillStyle = '#efdfc6'; x.fillRect(0, 0, 128, 64); const r = rnd(3); for (let i = 0; i < 160; i++) { x.fillStyle = `rgba(150,110,70,${r() * 0.2})`; x.fillRect(r() * 128, r() * 64, 1.4, 1.4); } })) })); m.castShadow = true; g.add(m); return g; }

// ================================================================== the molecule kit
// atoms as in a school molecular model kit: colour, ball radius (ball-and-stick), space-filling radius (Å), valency
export const ATOM = { H: { c: 0xf2f2f2, r: 0.0085, vdw: 1.2, val: 1 }, C: { c: 0x262626, r: 0.0135, vdw: 1.7, val: 4 }, N: { c: 0x2f5fd0, r: 0.013, vdw: 1.55, val: 3 }, O: { c: 0xd23a2e, r: 0.013, vdw: 1.52, val: 2 },
  Na: { c: 0x8e63c9, r: 0.016, vdw: 1.86, val: 1 }, Cl: { c: 0x3fae47, r: 0.016, vdw: 1.75, val: 1 } };
const A2M = 0.032; // metres per ångström in the model
// target molecules: atoms (element, position in Å) and bonds [i, j, order]; pre: atoms already in place
const tet = (s) => [[1, 1, 1], [-1, -1, 1], [-1, 1, -1], [1, -1, -1]].map((v) => v.map((x) => x * s / Math.sqrt(3)));
export const MOLS = {
  water: { f: 'H₂O', atoms: [['O', [0, 0, 0]], ['H', [0.757, 0.586, 0]], ['H', [-0.757, 0.586, 0]]], bonds: [[0, 1, 1], [0, 2, 1]] },
  co2: { f: 'CO₂', atoms: [['C', [0, 0, 0]], ['O', [1.16, 0, 0]], ['O', [-1.16, 0, 0]]], bonds: [[0, 1, 2], [0, 2, 2]] },
  methane: { f: 'CH₄', atoms: [['C', [0, 0, 0]], ...tet(1.09).map((p) => ['H', p])], bonds: [[0, 1, 1], [0, 2, 1], [0, 3, 1], [0, 4, 1]] },
  ammonia: { f: 'NH₃', atoms: [['N', [0, 0, 0]], ['H', [0.94, -0.38, 0]], ['H', [-0.47, -0.38, 0.81]], ['H', [-0.47, -0.38, -0.81]]], bonds: [[0, 1, 1], [0, 2, 1], [0, 3, 1]] },
  ethanol: { f: 'C₂H₅OH', atoms: [['C', [-1.17, -0.4, 0]], ['C', [0.17, 0.33, 0]], ['O', [1.2, -0.62, 0]], ['H', [2.02, -0.12, 0]], ['H', [-1.25, -1.03, 0.89]], ['H', [-1.25, -1.03, -0.89]], ['H', [-2.0, 0.31, 0]], ['H', [0.25, 0.97, 0.89]], ['H', [0.25, 0.97, -0.89]]],
    bonds: [[0, 1, 1], [1, 2, 1], [2, 3, 1], [0, 4, 1], [0, 5, 1], [0, 6, 1], [1, 7, 1], [1, 8, 1]] },
};
// β-glucose (a six-membered ring: five carbons and an oxygen, in a chair): ring, CH₂ and the seven C–H hydrogens are
// built; the student adds the five –OH groups (an O carrying its H)
{ const ring = []; for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; ring.push([Math.cos(a) * 1.45, (i % 2 ? 0.25 : -0.25), Math.sin(a) * 1.45]); }
  const out = (p, k = 1) => { const L = Math.hypot(p[0], p[2]); return [p[0] / L * k, 0, p[2] / L * k]; };
  const add = (a, b) => a.map((x, i) => x + b[i]);
  // ring: 0 = O5, 1 = C1, 2 = C2, 3 = C3, 4 = C4, 5 = C5
  const atoms = [['O', ring[0]], ['C', ring[1]], ['C', ring[2]], ['C', ring[3]], ['C', ring[4]], ['C', ring[5]]]; const bonds = [[0, 1, 1], [1, 2, 1], [2, 3, 1], [3, 4, 1], [4, 5, 1], [5, 0, 1]];
  const pre = [0, 1, 2, 3, 4, 5];
  // C6 (the CH₂ on C5, outward), its O6
  const c6 = add(ring[5], add(out(ring[5], 1.3), [0, 0.5, 0])); atoms.push(['C', c6]); bonds.push([5, 6, 1]); pre.push(6);
  // the axial hydrogens on C1…C5 (up on the upper atoms, down on the lower ones) and two on C6
  for (const i of [1, 2, 3, 4, 5]) { const up = ring[i][1] > 0 ? 1 : -1; atoms.push(['H', add(ring[i], [0, up * 1.09, 0])]); bonds.push([i, atoms.length - 1, 1]); pre.push(atoms.length - 1); }
  atoms.push(['H', add(c6, [0.3, 0.9, 0.5])]); bonds.push([6, atoms.length - 1, 1]); pre.push(atoms.length - 1); atoms.push(['H', add(c6, [0.3, 0.6, -0.8])]); bonds.push([6, atoms.length - 1, 1]); pre.push(atoms.length - 1);
  // the five –OH groups (equatorial on C1…C4, and on C6): the O to add, its H comes with it
  const oh = []; for (const i of [1, 2, 3, 4]) { const ring0 = ring[i]; const po = add(ring0, add(out(ring0, 1.35), [0, -0.1 * (ring0[1] > 0 ? 1 : -1), 0])); atoms.push(['O', po]); bonds.push([i, atoms.length - 1, 1]); const oi = atoms.length - 1; atoms.push(['H', add(po, add(out(po, 0.6), [0, 0.7, 0]))]); bonds.push([oi, atoms.length - 1, 1]); oh.push(oi); }
  { const po = add(c6, [1.1, -0.5, 0.2]); atoms.push(['O', po]); bonds.push([6, atoms.length - 1, 1]); const oi = atoms.length - 1; atoms.push(['H', add(po, [0.6, 0.7, 0.1])]); bonds.push([oi, atoms.length - 1, 1]); oh.push(oi); }
  MOLS.glucose = { f: 'C₆H₁₂O₆', atoms, bonds, pre, groups: oh }; }
// one atom ball (ball-and-stick size)
function atomMesh(el) { const A = ATOM[el]; const m = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), ballM(A.c)); m.scale.setScalar(A.r); m.castShadow = true; m.userData.el = el; return m; }
const stickM = () => mat('sxstick', () => new THREE.MeshStandardMaterial({ color: 0xb8bcc2, roughness: 0.35, metalness: 0.3 }));
const pegM = () => glowM(0xffd23f, 0.9);
export function moleculeKit(o = {}) {
  const it = new Item('sxmol', { ...o, name: N3('Molecular model kit', 'अणु मॉडल किट', 'Molecule model kit') });
  const g = it.g, W = o.W || ((k) => k);
  const wood = std(0x8f6338, 0.6, 0, { map: woodTex('#8f6338', 31) });
  g.add(box(0.2, 0.012, 0.16, wood, 0, 0.006, -0.02)); // the building board
  g.add(box(0.9, 0.03, 0.06, wood, 0, 0.015, -0.33)); // the shelf for finished models (a long wooden step at the back)
  const sign = liveSign(0.05, 7.5); sign.position.set(0, 0.29, -0.4); g.add(sign); it.say = (l, c) => sign.set(l, c);
  const CEN = V(0, 0.13, -0.02); it.cenW = () => g.localToWorld(CEN.clone());
  const mol = new THREE.Group(); mol.position.copy(CEN); g.add(mol); it.mol = mol; noHit(mol);
  it.shelfN = 0; it.done = []; it.space = false;
  // the molecule being built
  it.start = (key) => { mol.clear(); mol.rotation.set(0, 0, 0); const M = MOLS[key]; it.key = key; it.M = M; it.placed = new Map(); it.made = new Map(); // made: "i-j" → order built
    for (const i of M.pre || []) it.placed.set(i, null); if (M.pre) { for (const i of M.pre) addAtomMesh(i); for (const [a, b, o2] of M.bonds) if (it.placed.has(a) && it.placed.has(b)) { it.made.set(a + '-' + b, o2); addStick(a, b, o2); } } drawPegs(); it.show(); };
  const posOf = (i) => { const p = it.M.atoms[i][1]; return V(p[0] * A2M, p[1] * A2M, p[2] * A2M); };
  const addAtomMesh = (i) => { const m = atomMesh(it.M.atoms[i][0]); m.position.copy(posOf(i)); m.userData.i = i; mol.add(m); it.placed.set(i, m); return m; };
  const sticks = new Map();
  const addStick = (a, b, order) => { const k = a + '-' + b; if (sticks.has(k)) { for (const s of sticks.get(k)) mol.remove(s); } const pa = posOf(a), pb = posOf(b); const list = [];
    const side = new THREE.Vector3().crossVectors(pb.clone().sub(pa), V(0, 0, 1)); if (side.lengthSq() < 1e-8) side.set(0, 1, 0); side.normalize().multiplyScalar(0.0042);
    for (let n = 0; n < order; n++) { const off = order > 1 ? side.clone().multiplyScalar(n ? 1 : -1) : V(0, 0, 0); const s = rodBetween(pa.clone().add(off), pb.clone().add(off), 0.0028, stickM(), 10); s.userData.stick = true; s.castShadow = true; mol.add(s); list.push(s); }
    sticks.set(k, list); };
  // free holes: one peg per missing bond, pointing where the next atom will go
  const pegs = new THREE.Group(); mol.add(pegs);
  const drawPegs = () => { pegs.clear(); for (const [a, b, o2] of it.M.bonds) { const k = a + '-' + b; const have = it.made.get(k) || 0; if (have >= o2) continue;
    for (const [x, y] of [[a, b], [b, a]]) { if (!it.placed.has(x)) continue; const p = posOf(x), q = posOf(y); const d = q.clone().sub(p).normalize(); const r = ATOM[it.M.atoms[x][0]].r;
      for (let n = have; n < o2; n++) { const pg = new THREE.Mesh(new THREE.CylinderGeometry(0.0022, 0.0022, 0.009, 8), pegM()); const off = o2 > 1 ? new THREE.Vector3().crossVectors(d, V(0, 0, 1)).normalize().multiplyScalar(n ? 0.004 : -0.004) : V(0, 0, 0);
        pg.position.copy(p).addScaledVector(d, r + 0.004).add(off); pg.quaternion.setFromUnitVectors(V(0, 1, 0), d); pegs.add(pg); } } } };
  // what is still missing: free bonds of the atoms in place
  it.free = () => { let n = 0; for (const [a, b, o2] of it.M.bonds) { const have = it.made.get(a + '-' + b) || 0; n += (o2 - have) * ((it.placed.has(a) ? 1 : 0) + (it.placed.has(b) ? 1 : 0)); } return n; }; // holes still open on the atoms in place
  it.complete = () => it.M && it.M.atoms.every((_, i) => it.placed.has(i)) && it.M.bonds.every(([a, b, o2]) => (it.made.get(a + '-' + b) || 0) >= o2);
  // an atom (el) let go near the model: it joins the open place nearest to where it was let go, if there is one;
  // otherwise the reason is given (returns { ok } or { why })
  it.tryAdd = (el, pW, group) => { const M = it.M; const local = mol.worldToLocal(pW.clone());
    const isGroupO = (i) => M.groups && M.groups.includes(i);
    if (!M.atoms.some(([e]) => e === el)) return { why: 'absent' };
    const cands = M.atoms.map(([e], i) => i).filter((i) => M.atoms[i][0] === el && !it.placed.has(i) && (group ? isGroupO(i) : !isGroupO(i) && !(M.groups && M.groups.some((gi) => M.bonds.some(([a, b]) => (a === gi && b === i) || (b === gi && a === i))))));
    if (!cands.length) return { why: 'full' };
    const nb = (i) => M.bonds.filter(([a, b]) => a === i || b === i).map(([a, b]) => (a === i ? b : a));
    let ok = it.placed.size === 0 ? cands.sort((a, b) => nb(b).length - nb(a).length).slice(0, 1) : cands.filter((i) => nb(i).some((j) => it.placed.has(j)));
    if (!ok.length) return { why: 'nopartner', need: [...new Set(cands.flatMap((i) => nb(i)).map((j) => M.atoms[j][0]))] };
    ok.sort((a, b) => posOf(a).distanceTo(local) - posOf(b).distanceTo(local)); const i = ok[0];
    addAtomMesh(i); for (const [a, b] of M.bonds) if ((a === i && it.placed.has(b)) || (b === i && it.placed.has(a))) { it.made.set(a + '-' + b, 1); addStick(a, b, 1); }
    if (group) for (const [a, b] of M.bonds) { const h = a === i ? b : b === i ? a : -1; if (h >= 0 && M.atoms[h][0] === 'H' && !it.placed.has(h)) { addAtomMesh(h); it.made.set(a + '-' + b, 1); addStick(a, b, 1); } }
    drawPegs(); it.show(); return { ok: true, i }; };
  // a second bond (a bent "spring" in the kit) let go near the model: it doubles the bond nearest to where it went
  it.tryBond = (pW) => { const M = it.M; const local = mol.worldToLocal(pW.clone()); const need = M.bonds.filter(([a, b, o2]) => it.placed.has(a) && it.placed.has(b) && (it.made.get(a + '-' + b) || 0) < o2);
    if (!need.length) { const any = M.bonds.some(([a, b, o2]) => o2 > 1); return { why: any ? 'notyet' : 'nodouble' }; }
    need.sort((x, y) => posOf(x[0]).add(posOf(x[1])).multiplyScalar(0.5).distanceTo(local) - posOf(y[0]).add(posOf(y[1])).multiplyScalar(0.5).distanceTo(local));
    const [a, b] = need[0]; const k = a + '-' + b; it.made.set(k, (it.made.get(k) || 0) + 1); addStick(a, b, it.made.get(k)); drawPegs(); it.show(); return { ok: true }; };
  // counts for the sign: atoms in place and the bonds each kind of atom has made
  it.bondsOf = (i) => it.M.bonds.reduce((n, [a, b]) => n + ((a === i || b === i) ? (it.made.get(a + '-' + b) || 0) : 0), 0);
  it.show = (extra) => { if (!it.M) return; const M = it.M; const cnt = {}; for (const i of it.placed.keys()) { const e = M.atoms[i][0]; cnt[e] = (cnt[e] || 0) + 1; }
    const formula = ['C', 'H', 'N', 'O', 'Na', 'Cl'].filter((e) => cnt[e]).map((e) => e + (cnt[e] > 1 ? String(cnt[e]).split('').map((d) => '₀₁₂₃₄₅₆₇₈₉'[d]).join('') : '')).join('');
    const top = `${W('Building')} ${M.f}: ${formula || '—'} · ${W('free holes')}: ${it.free()}`;
    const ex = extra || (it.complete() ? `${W('Complete')}: ${['C', 'N', 'O', 'H'].filter((e) => cnt[e]).map((e) => `${e} ${W('makes')} ${ATOM[e].val} ${ATOM[e].val > 1 ? W('bonds') : W('bond')}`).join(' · ')}` : W('Put an atom where a yellow peg is'));
    it.say([top, ex], ['#ffffff', extra ? '#ffb46b' : it.complete() ? '#8be07a' : '#ffd23f']); };
  // the finished model goes to the shelf, as one mesh (vertex colours)
  const shelf = new THREE.Group(); g.add(shelf); noHit(shelf);
  it.toShelf = () => { const n = it.shelfN++; const bake = bakeGroup(mol, pegs); bake.position.set(-0.38 + n * 0.13, 0.09, -0.33); bake.userData.key = it.key; shelf.add(bake); it.done.push(bake);
    const t = tag(it.M.f, '#ffffff', 0.022); t.position.set(-0.38 + n * 0.13, 0.17, -0.31); shelf.add(t); mol.clear(); };
  // ball-and-stick ↔ space-filling, for all models on the shelf
  it.setSpace = (on) => { it.space = on; for (const b of it.done) { b.userData.bs.visible = !on; b.userData.sf.visible = on; } };
  it.views = { build: { p: V(0, 0.44, 0.46), t: V(0, 0.1, -0.1) }, shelf: { p: V(0, 0.5, 0.56), t: V(0, 0.1, -0.22) } };
  return done1(it, { height: 0.2, radius: 0.5 });
}
// a model as two meshes: ball-and-stick and space-filling (vdW radii), each one draw call
function bakeGroup(mol, skip) { mol.updateMatrixWorld(true); const bs = [], sf = []; const inv = new THREE.Matrix4().copy(mol.matrixWorld).invert();
  mol.traverse((m) => { if (!m.isMesh || m.parent === skip || m === skip) return; let p = m.parent; while (p && p !== mol) { if (p === skip) return; p = p.parent; }
    const g0 = m.geometry.clone().toNonIndexed(); const M = new THREE.Matrix4().multiplyMatrices(inv, m.matrixWorld); g0.applyMatrix4(M); const c = m.material.color; const n = g0.attributes.position.count; const col = new Float32Array(n * 3); for (let i = 0; i < n; i++) { col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; }
    g0.setAttribute('color', new THREE.BufferAttribute(col, 3)); for (const k of Object.keys(g0.attributes)) if (!['position', 'normal', 'color'].includes(k)) g0.deleteAttribute(k); bs.push(g0);
    if (m.userData.el) { const s = new THREE.SphereGeometry(ATOM[m.userData.el].vdw * A2M * 0.62, 22, 16).toNonIndexed(); const pp = m.getWorldPosition(V(0, 0, 0)).applyMatrix4(inv); s.translate(pp.x, pp.y, pp.z); const n2 = s.attributes.position.count; const c2 = new Float32Array(n2 * 3); for (let i = 0; i < n2; i++) { c2[i * 3] = c.r; c2[i * 3 + 1] = c.g; c2[i * 3 + 2] = c.b; } s.setAttribute('color', new THREE.BufferAttribute(c2, 3)); s.deleteAttribute('uv'); sf.push(s); } });
  const vm = mat('sxvcol', () => new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.35 }));
  const grp = new THREE.Group(); const a = new THREE.Mesh(mergeGeometries(bs), vm); const b = new THREE.Mesh(sf.length ? mergeGeometries(sf) : new THREE.BufferGeometry(), vm); b.visible = false; a.castShadow = b.castShadow = true;
  grp.add(a, b); grp.userData.bs = a; grp.userData.sf = b; grp.scale.setScalar(0.62); return grp; }
