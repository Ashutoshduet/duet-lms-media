// Maths lab, batch 10: sharbat mixed with a small cup into three glasses (Class 8, Proportional Reasoning-1: the same
// ratio gives the same taste, adding the same amount to both does not), and a straight wire turned about a point P of a
// circular wire until the secant becomes a tangent (Class 10, Circles: the tangent is perpendicular to the radius).
// Flat pieces are drawn in (u, v) on the table: u to the right, v away from the student (world x = u, z = -v).
import * as THREE from 'three';
import { Item } from './apparatus.js';
import { ink, outline, dashed, ease, lerp, clamp01, board, topLabel } from './mathlab2.js';

const at3 = (it, Y) => (u, v, up = 0.02) => it.g.localToWorld(new THREE.Vector3(u, Y + up, -v));
const letter = (t, s = 0.03, color = '#1d2630') => { const m = topLabel(t, s, s, color, 0); m.renderOrder = 4; return m; };
const arc = (k, h) => Math.sin(Math.PI * clamp01(k)) * h; // up and down again while k goes 0 → 1
const glassMat = () => new THREE.MeshPhysicalMaterial({ color: 0xe8f4ff, roughness: 0.08, transparent: true, opacity: 0.28, side: THREE.DoubleSide, depthWrite: false });

// ------------------------------------------------------------------ a bottle of syrup, a jug of water, a small cup and three glasses A, B, C
export function sharbatGlasses(o = {}) {
  const it = new Item('msharbat', { ...o, name: o.name || { en: 'Sharbat syrup, water, a cup and three glasses', hi: 'शरबत का सिरप, पानी, एक कप और तीन गिलास', hg: 'Sharbat ka syrup, paani, ek cup aur teen glass' } });
  const Y = 0.003;
  it.g.add(board(-0.25, -0.1, 0.22, 0.11, '#b98a5a'));
  const SYR = new THREE.Color(0xb0123a), WAT = new THREE.Color(0xdcecf8);
  const tint = (f) => WAT.clone().lerp(SYR, clamp01(f * 2.7)); // f: the part of the drink that is syrup
  // a straight glass with its drink inside (the drink is a cylinder scaled to its level)
  const R = 0.026, H = 0.112, UNIT = 0.0118; // UNIT: rise of the drink for one cup
  const vessel = (u, v, r, h, cLiq) => {
    const g = new THREE.Group(); g.position.set(u, Y, -v); it.g.add(g);
    const wall = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 0.9, h, 32, 1, true), glassMat()); wall.position.y = h / 2; wall.renderOrder = 3; g.add(wall);
    const bot = new THREE.Mesh(new THREE.CircleGeometry(r * 0.9, 32), glassMat()); bot.rotation.x = -Math.PI / 2; bot.position.y = 0.002; g.add(bot);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(r, 0.0012, 6, 40), new THREE.MeshStandardMaterial({ color: 0xcfe3f2, roughness: 0.2 })); rim.rotation.x = Math.PI / 2; rim.position.y = h; g.add(rim);
    const liq = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.94, r * 0.86, 1, 32), new THREE.MeshStandardMaterial({ color: cLiq, roughness: 0.45 }));
    liq.position.y = 0.003; liq.scale.y = 0.0001; liq.visible = false; g.add(liq);
    const level = (h2) => { liq.visible = h2 > 0.0005; liq.scale.y = Math.max(0.0001, h2); liq.position.y = 0.003 + h2 / 2; };
    return { g, liq, level, h, r };
  };
  // the syrup bottle and the water jug stay full; the three glasses start empty
  const bottle = vessel(-0.125, 0.06, 0.022, 0.1, SYR); bottle.level(0.082);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.02, 0.03, 24, 1, true), glassMat()); neck.position.y = 0.112; bottle.g.add(neck);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.01, 20), new THREE.MeshStandardMaterial({ color: 0xd8b32a, roughness: 0.4 })); cap.position.y = 0.13; bottle.g.add(cap);
  const jug = vessel(-0.195, -0.005, 0.03, 0.1, WAT); jug.level(0.08);
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.02, 0.003, 8, 24, Math.PI), glassMat()); handle.rotation.z = -Math.PI / 2; handle.position.set(-0.03, 0.055, 0); jug.g.add(handle);
  const G = { A: vessel(-0.04, 0, R, H, WAT), B: vessel(0.06, 0, R, H, WAT), C: vessel(0.16, 0, R, H, WAT) };
  ['A', 'B', 'C'].forEach((n) => { const m = letter(n, 0.045); m.position.set(G[n].g.position.x, Y + 0.001, G[n].g.position.z + 0.05); it.g.add(m); });
  // the small measuring cup, carried from the bottle or the jug to a glass and tipped
  const cup = new THREE.Group(); it.g.add(cup);
  const cw = new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.011, 0.024, 24, 1, true), new THREE.MeshStandardMaterial({ color: 0xf2f2f2, roughness: 0.3, transparent: true, opacity: 0.55, side: THREE.DoubleSide }));
  cw.position.y = 0.012; cup.add(cw);
  const cupLiq = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.0105, 0.02, 24), new THREE.MeshStandardMaterial({ color: SYR, roughness: 0.3 })); cupLiq.position.y = 0.011; cup.add(cupLiq);
  const HOMEC = new THREE.Vector3(-0.1, Y, 0.06);
  const above = (vs) => new THREE.Vector3(vs.g.position.x, Y + vs.h + 0.03, vs.g.position.z);
  const setCup = (p, tilt, full, isS) => { cup.position.copy(p); cup.rotation.set(0, 0, tilt); cupLiq.visible = full > 0.05; cupLiq.scale.y = Math.max(0.05, full); cupLiq.position.y = 0.001 + 0.01 * full; cupLiq.material.color.copy(isS ? SYR : WAT); };
  // fill glass n with a list of cups ('s' syrup, 'w' water); k goes 0 → 1 over all the trips
  const state = { A: [0, 0], B: [0, 0], C: [0, 0] };
  const show = (n, s, w) => { state[n] = [s, w]; const vs = G[n]; vs.level((s + w) * UNIT); if (s + w > 0) vs.liq.material.color.copy(tint(s / (s + w))); };
  it.pour = (n, list, k) => {
    const N = list.length, q = Math.min(N - 1, Math.floor(clamp01(k) * N)), f = clamp01(k) * N - q, isS = list[q] === 's';
    const src = above(isS ? bottle : jug), dst = above(G[n]);
    let s = 0, w = 0; for (let i = 0; i < q; i++) { if (list[i] === 's') s += 1; else w += 1; }
    const fa = clamp01(f / 0.35), fb = clamp01((f - 0.35) / 0.4), fc = clamp01((f - 0.75) / 0.25);
    const part = k >= 1 ? 1 : fb; // the part of this cup already in the glass
    if (k >= 1) { s = list.filter((c) => c === 's').length; w = N - s; show(n, s, w); setCup(HOMEC, 0, 0, true); return; }
    show(n, s + (isS ? part : 0), w + (isS ? 0 : part));
    const p = new THREE.Vector3().lerpVectors(src, dst, ease(fa)); p.y += arc(fa, 0.04);
    p.x -= 0.022 * Math.sin(Math.PI * Math.min(fb, 1 - fc) * 0.5) * (fb > 0 ? 1 : 0); // the cup moves to the side of the rim to tip
    const nextS = list[q + 1] === 's'; const back = above(q + 1 < N ? (nextS ? bottle : jug) : { g: { position: HOMEC }, h: -0.03 });
    if (fc > 0) { p.lerpVectors(dst, back, ease(fc)); p.y += arc(fc, 0.04); }
    setCup(p, fb > 0 && fc === 0 ? -1.9 * Math.sin(Math.PI * Math.min(1, fb * 1.25) * 0.5) : 0, fc > 0 ? (list[q + 1] ? 1 : 0) : 1 - fb, fc > 0 ? nextS : isS);
  };
  it.reset = () => { ['A', 'B', 'C'].forEach((n) => show(n, 0, 0)); setCup(HOMEC, 0, 0, true); };
  const W = at3(it, Y);
  it.at = (q) => {
    if (G[q]) return W(G[q].g.position.x, 0, H + 0.03);
    if (q === 'Afoot' || q === 'Bfoot' || q === 'Cfoot') { const v = G[q[0]]; return W(v.g.position.x, -0.07, 0.01); }
    if (q === 'bottle') return W(-0.125, 0.06, 0.14); if (q === 'jug') return W(-0.195, -0.005, 0.11);
    if (q === 'front') return W(0.06, -0.09, 0.0); return W(0, 0);
  };
  it.state = state;
  it.reset();
  it.noGrab = true; it.height = 0.12; it.radius = 0.22; it.grabY = 0.01; return it;
}

// ------------------------------------------------------------------ a circular wire with a straight wire that turns about a point P on it
export function tangentWire(o = {}) {
  const it = new Item('mtangent', { ...o, name: o.name || { en: 'A circular wire and a straight wire', hi: 'एक गोल तार और एक सीधा तार', hg: 'Ek gol taar aur ek seedha taar' } });
  const Y = 0.003, r = 0.085, O = [-0.04, 0.0], P = [O[0] + r, O[1]], HALF = 0.16, WY = Y + 0.004;
  it.g.add(board(-0.2, -0.15, 0.2, 0.15, '#b98a5a'));
  const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.0022, 10, 96), new THREE.MeshStandardMaterial({ color: 0xb8733a, metalness: 0.6, roughness: 0.35 }));
  ring.rotation.x = Math.PI / 2; ring.position.set(O[0], WY, -O[1]); it.g.add(ring);
  const dot = (c, rad = 0.0045) => new THREE.Mesh(new THREE.SphereGeometry(rad, 16, 12), new THREE.MeshStandardMaterial({ color: c, roughness: 0.4 }));
  const pO = dot(0x26303a, 0.003); pO.position.set(O[0], Y + 0.002, -O[1]); it.g.add(pO);
  const pin = dot(0xd23a2a); pin.position.set(P[0], WY + 0.002, -P[1]); it.g.add(pin);
  const bead = dot(0x2f74d8); it.g.add(bead);
  // the straight wire: a thin rod through P, turned by rot.y = phi (its direction is (cos phi, sin phi) in u, v)
  const rod = new THREE.Group(); rod.position.set(P[0], WY + 0.003, -P[1]); it.g.add(rod);
  const steel = new THREE.Mesh(new THREE.CylinderGeometry(0.0017, 0.0017, 2 * HALF, 10), new THREE.MeshStandardMaterial({ color: 0x9aa3ad, metalness: 0.7, roughness: 0.3 }));
  steel.rotation.z = Math.PI / 2; rod.add(steel);
  // the chord PR, drawn in orange on the paper
  const chordGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
  const chord = new THREE.Line(chordGeo, new THREE.LineBasicMaterial({ color: 0xe8701a })); it.g.add(chord);
  // the radius OP and a right-angle mark at P, shown at the end
  const radius = dashed([O, P], 0x26303a, Y + 0.001, 0.005); radius.visible = false; it.g.add(radius);
  const m = 0.012, sq = outline([[P[0], P[1]], [P[0] - m, P[1]], [P[0] - m, P[1] + m], [P[0], P[1] + m]], ink(0x0b5a1f), Y + 0.0012, false); sq.visible = false; it.g.add(sq);
  const L = { T: letter('T', 0.05, '#0b5a1f'), O: letter('O', 0.05), P: letter('P', 0.05, '#a3221a'), R: letter('R', 0.05, '#1f4f9a') };
  L.O.position.set(O[0] - 0.012, Y + 0.001, -(O[1] - 0.014)); L.P.position.set(P[0] + 0.018, Y + 0.001, -(P[1] - 0.016)); L.T.position.set(P[0] + 0.018, Y + 0.001, -(P[1] + 0.1)); L.T.visible = false; Object.values(L).forEach((x) => it.g.add(x));
  let phi = 0;
  const rOf = (a) => { const t = -2 * r * Math.cos(a); return { t, u: P[0] + t * Math.cos(a), v: P[1] + t * Math.sin(a) }; };
  it.set = (a) => {
    phi = a; rod.rotation.y = a; const R = rOf(a), meet = Math.abs(R.t) > 0.003;
    bead.visible = meet; L.R.visible = Math.abs(R.t) > 0.02; bead.position.set(R.u, WY + 0.002, -R.v);
    const cu = O[0] + (r + 0.02) * (R.u - O[0]) / r, cv = O[1] + (r + 0.02) * (R.v - O[1]) / r; L.R.position.set(cu, Y + 0.001, -cv);
    chord.visible = meet; chordGeo.setFromPoints([new THREE.Vector3(P[0], Y + 0.001, -P[1]), new THREE.Vector3(R.u, Y + 0.001, -R.v)]);
  };
  it.chord = () => Math.abs(rOf(phi).t); // in metres
  it.turn = (a0, a1, k) => it.set(lerp(a0, a1, ease(clamp01(k))));
  it.showRadius = (k) => { radius.visible = k > 0.1; sq.visible = k > 0.6; L.T.visible = k > 0.6; };
  it.reset = () => { it.set((150 * Math.PI) / 180); it.showRadius(0); };
  const W = at3(it, Y);
  it.at = (q) => {
    if (q === 'O') return W(O[0], O[1] + 0.02); if (q === 'P') return W(P[0] + 0.01, P[1]);
    if (q === 'R') { const R = rOf(phi); return W(R.u, R.v); }
    if (q === 'top') return W(P[0] + 0.02, P[1] + 0.11, 0.02); if (q === 'below') return W(O[0], O[1] - 0.12, 0.01);
    if (q === 'mid') { const R = rOf(phi); return W((P[0] + R.u) / 2, (P[1] + R.v) / 2); }
    return W(0, 0);
  };
  it.reset();
  it.noGrab = true; it.height = 0.01; it.radius = 0.2; it.grabY = 0.005; return it;
}

