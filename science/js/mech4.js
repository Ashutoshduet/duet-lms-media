// Physics (Class 8): pressure and measurement. Pipes with a balloon tied at the bottom (the bulge grows with the height of the
// water, not with the amount), a bottle with holes that spurt jets (the speed comes from the depth: v = √(2gh)), a rubber
// sucker, balloons joined by a straw, a notebook to measure, a stone for the density of an irregular solid, and an egg in salt water.
import * as THREE from 'three';
import { Item, Vessel } from './apparatus.js';
import { canvasTex, woodTex, glassMat } from './mats.js';

const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const steel = (c = 0x9aa0a6, r = 0.35) => new THREE.MeshStandardMaterial({ color: c, metalness: 0.85, roughness: r });
export const G = 9.8;

// ------------------------------------------------------------------ a transparent pipe clamped upright with a balloon tied over its lower end (a vessel)
export function balloonPipe(o = {}) {
  const r = o.r ?? 0.012, y0 = 0.07, L = 0.25; const prof = [[0, y0], [r, y0], [r, y0 + L], [r + 0.0012, y0 + L]];
  const v = new Vessel('bpipe', prof, { ...o, wall: 0.0012, name: o.name || { en: `Transparent pipe (${Math.round(r * 200 * 10) / 10} cm wide) with a balloon at the bottom`, hi: `नीचे गुब्बारा बँधा पारदर्शी पाइप (${Math.round(r * 200 * 10) / 10} सेमी चौड़ा)`, hg: `Neeche balloon bandha transparent pipe (${Math.round(r * 200 * 10) / 10} cm chauda)` } });
  const bm = new THREE.MeshPhysicalMaterial({ color: 0xd83a3a, roughness: 0.3, clearcoat: 0.5 });
  const memb = new THREE.Mesh(new THREE.SphereGeometry(1, 28, 14, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), bm); memb.position.y = y0; v.g.add(memb);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(r + 0.0018, r + 0.0018, 0.02, 24, 1, true), bm); neck.position.y = y0 + 0.008; v.g.add(neck);
  const band = new THREE.Mesh(new THREE.TorusGeometry(r + 0.002, 0.0012, 6, 24), new THREE.MeshStandardMaterial({ color: 0x1b1b1b })); band.rotation.x = Math.PI / 2; band.position.y = y0 + 0.012; v.g.add(band);
  const sc = canvasTex(64, 512, (x, w, h) => { x.clearRect(0, 0, w, h); x.fillStyle = 'rgba(255,255,255,0.95)'; for (let cm = 0; cm <= 25; cm++) { const yy = h - (cm / 25) * h; x.fillRect(0, yy - 1.5, cm % 5 === 0 ? 40 : 22, 3); if (cm % 5 === 0) { x.font = '700 22px sans-serif'; x.fillText(String(cm), 42, yy + 8); } } });
  const sm = new THREE.Mesh(new THREE.CylinderGeometry(r + 0.0004, r + 0.0004, L, 16, 1, true, -0.5, 1), new THREE.MeshBasicMaterial({ map: sc, transparent: true, depthWrite: false })); sm.position.y = y0 + L / 2; sm.rotation.y = Math.PI; sm.renderOrder = 7; v.g.add(sm);
  v.bulge = 0; v.y0 = y0;
  const up = v.update.bind(v); v.update = (dt) => { up(dt); const h = v.ml > 0.1 ? v.heightFor(v.ml) - y0 : 0; const want = 0.004 + h * 0.14; v.bulge += (want - v.bulge) * Math.min(1, dt * 3); memb.scale.set(r + 0.0018 + v.bulge * 0.35, v.bulge, r + 0.0018 + v.bulge * 0.35); v.hw = h; };
  v.grabY = y0 + L * 0.6; return v;
}
export function pipeStand(o = {}) {
  const it = new Item('pstand', { ...o, name: o.name || { en: 'Stand with clamps', hi: 'क्लैंप वाला स्टैंड', hg: 'Clamp wala stand' } });
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.012, 0.1), new THREE.MeshStandardMaterial({ color: 0x2b2f35, roughness: 0.6 })); base.position.y = 0.006; it.g.add(base);
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.36, 12), steel()); rod.position.set(0, 0.18, -0.035); it.g.add(rod);
  for (const y of [0.13, 0.3]) { const arm = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.008, 0.008), steel()); arm.position.set(0, y, -0.02); it.g.add(arm); }
  it.height = 0.36; it.radius = 0.15; it.grabY = 0.2; it.noGrab = true; return it;
}
// ------------------------------------------------------------------ a plastic bottle with four holes round it near the bottom, covered with tape; water jets out when the tapes come off
export function holeBottle(o = {}) {
  const R = 0.036, hy = 0.03; const prof = [[0, 0], [R - 0.004, 0], [R, 0.006], [R, 0.2], [R - 0.008, 0.225], [0.015, 0.25], [0.0155, 0.255]];
  const v = new Vessel('hbottle', prof, { ...o, wall: 0.0012, name: o.name || { en: 'Plastic bottle with four holes near the bottom', hi: 'नीचे चार छेद वाली प्लास्टिक की बोतल', hg: 'Neeche chaar chhed wali plastic bottle' }, glass: { opacity: 0.14, edge: 0.6, color: 0xe6f6ff } });
  const tapes = []; const jets = []; const jm = new THREE.MeshStandardMaterial({ color: 0xcfe6ff, transparent: true, opacity: 0.6, roughness: 0.05 });
  for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2 + Math.PI / 4; const t = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.016, 0.002), new THREE.MeshStandardMaterial({ color: 0xe9e2c8, roughness: 0.8 })); t.position.set(Math.cos(a) * (R + 0.001), hy, Math.sin(a) * (R + 0.001)); t.rotation.y = -a + Math.PI / 2; v.g.add(t); tapes.push(t);
    const j = new THREE.Mesh(new THREE.BufferGeometry(), jm); j.visible = false; j.renderOrder = 5; j.userData.noHit = true; v.g.add(j); jets.push({ m: j, a }); }
  v.open = false; v.hy = hy; v.R = R; v.reach = 0;
  // the jets: from each hole with speed √(2 g depth), falling to the tray below
  v.jets = (dt, floorY) => {
    const depth = v.ml > 0.5 ? v.heightFor(v.ml) - hy : 0; const sp = depth > 0.002 ? Math.sqrt(2 * G * depth) : 0; v.reach = 0;
    for (const J of jets) { J.m.visible = v.open && sp > 0.05; if (!J.m.visible) continue; const pts = []; const fall = hy - floorY; const T = Math.sqrt((2 * Math.max(0.005, fall)) / G); for (let i = 0; i <= 16; i++) { const t = (i / 16) * T; const d = R + sp * t; pts.push(V3(Math.cos(J.a) * d, hy - 0.5 * G * t * t, Math.sin(J.a) * d)); } v.reach = sp * T;
      J.m.geometry.dispose(); J.m.geometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.0011 + 0.0006 * Math.min(1, depth / 0.15), 5, false); }
    if (v.open && sp > 0.05) { const q = 4 * 1.2e-6 * sp * 0.62 * 1e6 * dt; const p = v.mix.take(Math.min(q, v.ml)); void p; v.ml = v.mix.ml(); } // four holes of about 1.2 mm²
  };
  v.peel = () => { v.open = true; for (const t of tapes) t.visible = false; };
  v.grabY = 0.12; return v;
}
export function tray(o = {}) {
  const it = new Item('tray', { ...o, name: o.name || { en: 'Tray', hi: 'ट्रे', hg: 'Tray' } }); const W = o.w ?? 0.5, D = o.d ?? 0.36;
  const m = new THREE.MeshStandardMaterial({ color: 0x5f6b78, roughness: 0.5, metalness: 0.3 }); const fl = new THREE.Mesh(new THREE.BoxGeometry(W, 0.004, D), m); fl.position.y = 0.002; it.g.add(fl);
  for (const [w, d, x, z] of [[W, 0.004, 0, D / 2], [W, 0.004, 0, -D / 2], [0.004, D, W / 2, 0], [0.004, D, -W / 2, 0]]) { const s = new THREE.Mesh(new THREE.BoxGeometry(w, 0.02, d), m); s.position.set(x, 0.01, z); it.g.add(s); }
  const wet = new THREE.Mesh(new THREE.CircleGeometry(1, 32), new THREE.MeshStandardMaterial({ color: 0xbfe0ff, transparent: true, opacity: 0, roughness: 0.05 })); wet.rotation.x = -Math.PI / 2; wet.position.y = 0.0045; wet.scale.setScalar(0.001); it.g.add(wet); it.wet = wet;
  it.height = 0.02; it.radius = W / 2; it.grabY = 0.01; it.noGrab = true; return it;
}
// ------------------------------------------------------------------ a rubber sucker (suction cup) on a smooth tile
export function sucker(o = {}) {
  const it = new Item('sucker', { ...o, name: o.name || { en: 'Rubber sucker', hi: 'रबर का सकर', hg: 'Rubber sucker' } });
  const cm = new THREE.MeshPhysicalMaterial({ color: 0x8fd0ff, roughness: 0.3, transparent: true, opacity: 0.75, clearcoat: 0.4 });
  const cup = new THREE.Mesh(new THREE.SphereGeometry(0.022, 32, 12, 0, Math.PI * 2, 0, 1.0), cm); cup.scale.y = 0.45; it.g.add(cup); it.cup = cup;
  const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.006, 0.02, 16), cm); knob.position.y = 0.019; it.g.add(knob);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.006, 0.0015, 8, 16), cm); ring.position.y = 0.031; it.g.add(ring);
  it.flat = (k) => { cup.scale.y = 0.45 - 0.3 * k; cup.position.y = -0.022 * 0.84 * (0.45 - 0.3 * k) + 0.008; }; it.flat(0);
  it.height = 0.035; it.radius = 0.022; it.grabY = 0.02; return it;
}
export function tile(o = {}) {
  const it = new Item('tile', { ...o, name: o.name || { en: 'Smooth glazed tile', hi: 'चिकनी चमकदार टाइल', hg: 'Chikni glazed tile' } });
  const m = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.008, 0.15), new THREE.MeshStandardMaterial({ color: 0xf2efe8, roughness: 0.08 })); m.position.y = 0.004; it.g.add(m);
  it.top = 0.008; it.height = 0.008; it.radius = 0.075; it.grabY = 0.004; return it;
}
// ------------------------------------------------------------------ two balloons joined by a straw: air flows from the full one into the empty one
export function strawBalloons(o = {}) {
  const it = new Item('sballoons', { ...o, name: o.name || { en: 'Two balloons joined by a straw', hi: 'स्ट्रॉ से जुड़े दो गुब्बारे', hg: 'Straw se jude do balloons' } });
  const straw = new THREE.Mesh(new THREE.CylinderGeometry(0.0035, 0.0035, 0.12, 12), new THREE.MeshStandardMaterial({ color: 0xf2f2f2, roughness: 0.4 })); straw.rotation.z = Math.PI / 2; straw.position.y = 0.06; it.g.add(straw);
  const clip = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.016, 0.012), new THREE.MeshStandardMaterial({ color: 0x2e7d4f, roughness: 0.5 })); clip.position.set(0.02, 0.06, 0); it.g.add(clip); it.clip = clip;
  const mk = (s, col) => { const g = new THREE.Group(); g.position.set(s * 0.06, 0.06, 0); it.g.add(g); const m = new THREE.MeshPhysicalMaterial({ color: col, roughness: 0.25, clearcoat: 0.6 }); const b = new THREE.Mesh(new THREE.SphereGeometry(1, 28, 18), m); g.add(b); const n = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.006, 0.012, 10), m); n.rotation.z = Math.PI / 2; n.position.x = -s * 0.004; g.add(n); return { g, b, s }; };
  it.A = mk(-1, 0xe0403a); it.B = mk(1, 0x2f7fd6); it.va = 1; it.vb = 0.05; it.open = false;
  const size = (B, v) => { const R = 0.012 + 0.045 * Math.cbrt(v); B.b.scale.set(R * 1.15, R, R); B.b.position.x = B.s * (R * 1.1); };
  it.update = (dt) => { if (it.open) { const d = (it.va - it.vb) * Math.min(1, dt * 0.9); it.va -= d; it.vb += d; } size(it.A, it.va); size(it.B, it.vb); it.clip.visible = !it.open; };
  it.height = 0.12; it.radius = 0.15; it.grabY = 0.06; return it;
}
// ------------------------------------------------------------------ a notebook (25 cm × 18 cm × 2 cm) to measure with a scale
export function notebook(o = {}) {
  const it = new Item('notebook', { ...o, name: o.name || { en: 'Notebook', hi: 'नोटबुक', hg: 'Notebook' } });
  const L = 0.25, W = 0.18, H = 0.02; const cov = canvasTex(512, 384, (x, w, h) => { x.fillStyle = '#2f6fb3'; x.fillRect(0, 0, w, h); x.fillStyle = '#f2efe6'; x.fillRect(w * 0.18, h * 0.3, w * 0.64, h * 0.26); x.fillStyle = '#1b1b1b'; x.font = '700 40px sans-serif'; x.textAlign = 'center'; x.fillText('SCIENCE', w / 2, h * 0.45); x.font = '500 26px sans-serif'; x.fillText('Class VIII', w / 2, h * 0.52); });
  const pages = new THREE.MeshStandardMaterial({ color: 0xf4f1e8, roughness: 0.9 }); const c = new THREE.MeshStandardMaterial({ map: cov, roughness: 0.6 });
  const m = new THREE.Mesh(new THREE.BoxGeometry(L, H, W), [pages, pages, c, c, pages, pages]); m.position.y = H / 2; it.g.add(m);
  it.dims = [L, W, H]; it.height = H; it.radius = L / 2; it.grabY = H / 2; return it;
}
// ------------------------------------------------------------------ a stone (16.4 g, 5 cm³) on a thread, and a raw egg
export function smallStone(o = {}) {
  const it = new Item('sstone', { ...o, name: o.name || { en: 'Small stone tied to a thread', hi: 'धागे से बँधा छोटा पत्थर', hg: 'Dhaage se bandha chhota patthar' } });
  const g = new THREE.IcosahedronGeometry(0.0115, 1); const p = g.attributes.position; for (let i = 0; i < p.count; i++) p.setXYZ(i, p.getX(i) * 1.15, p.getY(i) * 0.75, p.getZ(i) * 0.95); g.computeVertexNormals();
  const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: 0x7f7a73, roughness: 0.95, flatShading: true })); m.position.y = 0.0086; it.g.add(m);
  const tl = o.thread ?? 0.2; const th = new THREE.Mesh(new THREE.CylinderGeometry(0.0004, 0.0004, tl, 5), new THREE.MeshStandardMaterial({ color: 0xf2efe6 })); th.position.y = 0.017 + tl / 2; it.g.add(th);
  it.gram = 16.4; it.mass = 0.0164; it.vol = 5; it.hBot = 0; it.hTop = 0.017; it.height = 0.017; it.radius = 0.013; it.grabY = 0.01; return it;
}
export function egg(o = {}) {
  const it = new Item('egg', { ...o, name: o.name || { en: 'Raw egg', hi: 'कच्चा अंडा', hg: 'Kachcha anda' } });
  const pts = []; for (let i = 0; i <= 24; i++) { const t = i / 24; const a = t * Math.PI; const r = Math.sin(a) * 0.021 * (1 - 0.12 * Math.cos(a)); pts.push(new THREE.Vector2(Math.max(0.0001, r), -Math.cos(a) * 0.028 + 0.028)); }
  const m = new THREE.Mesh(new THREE.LatheGeometry(pts, 32), new THREE.MeshStandardMaterial({ color: 0xf1e6d2, roughness: 0.6 })); it.g.add(m);
  it.rho = 1.08; it.vol = 55; it.height = 0.056; it.radius = 0.021; it.grabY = 0.028; return it;
}
