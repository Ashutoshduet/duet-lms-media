// Physics (Class 6): magnets, measuring length and temperature, and things that sink or float.
// A bar magnet hanging from a stand turns to north–south (and is pushed or pulled by another magnet's poles), iron filings
// gather at a magnet's ends, a sewing needle on a cork floats in a bowl and points north once it has been made a magnet,
// a plank to measure with a pencil and a stick, a card with a curved line and a thread, and a tub of water.
import * as THREE from 'three';
import { Item } from './apparatus.js';
import { canvasTex, woodTex, glassMat, cardTex } from './mats.js';
import { fieldAt } from './magnet.js';
import { dress } from './models.js';

const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const steel = (c = 0x9aa0a6, r = 0.35) => new THREE.MeshStandardMaterial({ color: c, metalness: 0.85, roughness: r });
const tmp = new THREE.Vector3(), tmpQ = new THREE.Quaternion();
const poleTex = (t, bg) => canvasTex(128, 64, (x, W, H) => { x.fillStyle = bg; x.fillRect(0, 0, W, H); x.fillStyle = 'rgba(255,255,255,0.08)'; x.fillRect(0, 0, W, H * 0.35); x.fillStyle = '#fff'; x.font = '800 44px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(t, W / 2, H / 2 + 2); });
// a bar magnet mesh (N half red at +x, S half blue), centred on the origin
function magnetMesh(L = 0.075, w = 0.016, h = 0.008) {
  const g = new THREE.Group(); const mN = new THREE.MeshStandardMaterial({ map: poleTex('N', '#c62828'), roughness: 0.4, metalness: 0.3 }), mS = new THREE.MeshStandardMaterial({ map: poleTex('S', '#2d4f9a'), roughness: 0.4, metalness: 0.3 });
  const n = new THREE.Mesh(new THREE.BoxGeometry(L / 2, h, w), mN); n.position.x = L / 4; const s = new THREE.Mesh(new THREE.BoxGeometry(L / 2, h, w), mS); s.position.x = -L / 4; n.castShadow = s.castShadow = true; g.add(n, s); return g;
}
// turn towards the horizontal field (like a compass needle, but heavier: it swings slowly a few times before it settles)
function yawTo(it, rot, center, k0, damp, dt, others) {
  const B = fieldAt(others, center); const want = Math.atan2(-B.z, B.x);
  const yaw = new THREE.Euler().setFromQuaternion(it.g.getWorldQuaternion(tmpQ)).y; let d = want - (it.ang + yaw); d = Math.atan2(Math.sin(d), Math.cos(d));
  const k = Math.min(80, k0 * Math.hypot(B.x, B.z) / 0.035); it.w += (d * k - it.w * damp) * dt; it.w += (it.kick || 0); it.kick = 0; it.ang += it.w * dt; rot.rotation.y = it.ang; it.pointing = it.ang + yaw;
}

// ------------------------------------------------------------------ a bar magnet hanging by a thread in a paper stirrup from a wooden stand
export function hangMagnet(o = {}) {
  const it = new Item('hmag', { ...o, name: o.name || { en: 'Bar magnet hanging from a stand', hi: 'स्टैंड से लटका छड़ चुंबक', hg: 'Stand se latka bar magnet' } });
  const H = 0.3, L = 0.075, hy = o.hangY ?? 0.12; const wood = new THREE.MeshStandardMaterial({ map: woodTex('#8a5a33'), roughness: 0.7 });
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.014, 0.12), wood); base.position.set(0, 0.007, -0.06); it.g.add(base);
  const post = new THREE.Mesh(new THREE.BoxGeometry(0.018, H, 0.018), wood); post.position.set(0, H / 2, -0.1); it.g.add(post);
  const arm = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.014, 0.12), wood); arm.position.set(0, H - 0.007, -0.04); it.g.add(arm);
  const thread = new THREE.Mesh(new THREE.CylinderGeometry(0.0004, 0.0004, H - 0.014 - hy - 0.012, 5), new THREE.MeshStandardMaterial({ color: 0xf2efe6, roughness: 0.9 })); thread.position.set(0, (H - 0.014 + hy + 0.012) / 2, 0.012); it.g.add(thread);
  const rot = new THREE.Group(); rot.position.set(0, hy, 0.012); it.g.add(rot); rot.add(magnetMesh(L));
  const stir = new THREE.Mesh(new THREE.TorusGeometry(0.0125, 0.0012, 4, 24), new THREE.MeshStandardMaterial({ map: cardTex(), color: 0xf4f0e6, roughness: 0.9 })); stir.rotation.y = Math.PI / 2; stir.scale.set(1, 1, 0.6); stir.position.y = 0.002; rot.add(stir);
  it.rot = rot; it.ang = o.ang ?? 1.2; it.w = 0; it.kick = 0; it.len = L; it.magnet = true;
  it.poles = () => { rot.updateWorldMatrix(true, false); return [{ p: rot.localToWorld(V3(L / 2 - 0.006, 0, 0)), q: 1 }, { p: rot.localToWorld(V3(-L / 2 + 0.006, 0, 0)), q: -1 }]; };
  it.update = (dt) => { if (!it.lab) return; const others = it.lab.items.filter((i) => i !== it && (i.poles || i.segs)); yawTo(it, rot, rot.getWorldPosition(tmp), 9, 0.9, Math.min(dt, 0.05), others); };
  it.nWorld = () => rot.localToWorld(V3(L / 2, 0, 0)); it.sWorld = () => rot.localToWorld(V3(-L / 2, 0, 0)); it.center = () => rot.getWorldPosition(V3(0, 0, 0));
  it.height = H; it.radius = 0.08; it.grabY = H * 0.5; it.noGrab = true; return it;
}
// ------------------------------------------------------------------ iron filings in a dish; a magnet dipped in comes out with tufts at its two ends
export function filingsDish(o = {}) {
  const it = new Item('fdish', { ...o, name: o.name || { en: 'Iron filings in a dish', hi: 'डिश में लोहे का बुरादा', hg: 'Dish mein iron filings' } });
  const R = 0.05; const dish = new THREE.Mesh(new THREE.LatheGeometry([new THREE.Vector2(0, 0), new THREE.Vector2(R, 0), new THREE.Vector2(R + 0.002, 0.012), new THREE.Vector2(R + 0.003, 0.0125)], 40), glassMat({ opacity: 0.22, edge: 0.7 })); dish.renderOrder = 6; it.g.add(dish);
  const N = 1400; const gm = new THREE.InstancedMesh(new THREE.BoxGeometry(0.0016, 0.0005, 0.0005), new THREE.MeshStandardMaterial({ color: 0x3b3d40, roughness: 0.7, metalness: 0.5 }), N); gm.frustumCulled = false; it.g.add(gm);
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), S = V3(1, 1, 1);
  for (let i = 0; i < N; i++) { const a = Math.random() * 6.283, r = Math.sqrt(Math.random()) * R * 0.8; const y = 0.0012 + Math.max(0, 0.004 * (1 - (r / (R * 0.8)) ** 2)) * Math.random(); E.set(Math.random() * 3, Math.random() * 3, Math.random() * 3); Q.setFromEuler(E); M.compose(V3(Math.cos(a) * r, y, Math.sin(a) * r), Q, S); gm.setMatrixAt(i, M); }
  it.take = (k) => { gm.count = Math.round(N * (1 - 0.35 * k)); }; // some filings leave the dish with the magnet
  it.height = 0.0125; it.radius = R + 0.003; it.grabY = 0.006; return it;
}
// the tufts that stick to a magnet (added to the magnet item; show(k) grows them from 0 to 1)
export function tufts(mag, L = 0.075) {
  const N = 900; const gm = new THREE.InstancedMesh(new THREE.BoxGeometry(0.0016, 0.0005, 0.0005), new THREE.MeshStandardMaterial({ color: 0x3b3d40, roughness: 0.7, metalness: 0.5 }), N); gm.frustumCulled = false; gm.position.y = 0.004; mag.g.add(gm);
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), S = V3(1, 1, 1);
  for (let i = 0; i < N; i++) { const end = i < N * 0.47 ? 1 : i < N * 0.94 ? -1 : 0; const x = end ? end * (L / 2 - Math.pow(Math.random(), 2.2) * L * 0.22) : (Math.random() - 0.5) * L * 0.5; const spread = end ? 0.006 + Math.random() * 0.006 : 0.004; const a = Math.random() * 6.283;
    const p = V3(x + (end ? end * Math.random() * 0.006 : 0), Math.sin(a) * spread * (end ? 1 : 0.7), Math.cos(a) * (0.0085 + Math.random() * spread * 0.6) * (Math.random() < 0.5 ? -1 : 1)); E.set(Math.random() * 3, Math.random() * 3, Math.random() * 3); Q.setFromEuler(E); M.compose(p, Q, S); gm.setMatrixAt(i, M); }
  gm.count = 0; return { mesh: gm, show: (k) => { gm.count = Math.round(N * Math.min(1, k)); } };
}
// ------------------------------------------------------------------ a sewing needle pushed through a small cork, floating in a glass bowl of water
export function needleCork(o = {}) {
  const it = new Item('ncork', { ...o, name: o.name || { en: 'Bowl of water with a needle on a cork', hi: 'कॉर्क पर सुई रखा पानी का कटोरा', hg: 'Cork par sui wala paani ka katora' } });
  const R = 0.075, H = 0.05; const bowl = new THREE.Mesh(new THREE.LatheGeometry([new THREE.Vector2(0, 0), new THREE.Vector2(R * 0.7, 0), new THREE.Vector2(R * 0.95, H * 0.5), new THREE.Vector2(R, H), new THREE.Vector2(R + 0.002, H)], 48), glassMat({ opacity: 0.18, edge: 0.7 })); bowl.renderOrder = 6; it.g.add(bowl);
  const water = new THREE.Mesh(new THREE.CircleGeometry(R * 0.93, 48), new THREE.MeshStandardMaterial({ color: 0x9fc6e8, transparent: true, opacity: 0.45, roughness: 0.05 })); water.rotation.x = -Math.PI / 2; water.position.y = H * 0.75; water.renderOrder = 5; it.g.add(water);
  const rot = new THREE.Group(); rot.position.set(0, H * 0.75, 0); it.g.add(rot);
  const cork = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.012, 0.012, 24), new THREE.MeshStandardMaterial({ color: 0xb98a55, roughness: 0.95 })); cork.position.y = 0.001; rot.add(cork);
  const nd = new THREE.Mesh(new THREE.CylinderGeometry(0.0005, 0.0005, 0.05, 6), steel(0xd0d4d8, 0.2)); nd.rotation.z = Math.PI / 2; nd.position.y = 0.004; rot.add(nd);
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.0005, 0.004, 6), steel(0xd0d4d8, 0.2)); tip.rotation.z = -Math.PI / 2; tip.position.set(0.027, 0.004, 0); rot.add(tip);
  const eye = new THREE.Mesh(new THREE.TorusGeometry(0.0009, 0.0003, 4, 10), steel(0xd0d4d8, 0.2)); eye.position.set(-0.0255, 0.004, 0); rot.add(eye);
  it.magnetised = false; it.ang = o.ang ?? 2.2; it.w = 0; it.t = 0;
  it.update = (dt) => { it.t += dt; rot.position.y = H * 0.75 + Math.sin(it.t * 2.1) * 0.0006; if (it.magnetised && it.lab) yawTo(it, rot, rot.getWorldPosition(tmp), 3.2, 1.1, Math.min(dt, 0.05), it.lab.items.filter((i) => i !== it && (i.poles || i.segs))); else { it.w *= Math.exp(-dt); it.ang += it.w * dt; rot.rotation.y = it.ang; } };
  it.spin = (w) => { it.w += w; };
  it.height = H; it.radius = R; it.grabY = H * 0.5; it.noGrab = true; return it;
}
// ------------------------------------------------------------------ an iron nail (it becomes a magnet when stroked many times in one direction with a magnet)
export function ironNail(o = {}) {
  const it = new Item('inail', { ...o, name: o.name || { en: 'Iron nail', hi: 'लोहे की कील', hg: 'Iron ki keel' } });
  const M = steel(0x8c9096, 0.42); const L = 0.075; const sh = new THREE.Mesh(new THREE.CylinderGeometry(0.0018, 0.0018, L, 12), M); sh.rotation.z = Math.PI / 2; sh.position.y = 0.0045; it.g.add(sh);
  const hd = new THREE.Mesh(new THREE.CylinderGeometry(0.0042, 0.0042, 0.0016, 18), M); hd.rotation.z = Math.PI / 2; hd.position.set(-L / 2, 0.0045, 0); it.g.add(hd);
  const tp = new THREE.Mesh(new THREE.ConeGeometry(0.0018, 0.007, 12), M); tp.rotation.z = -Math.PI / 2; tp.position.set(L / 2 + 0.0035, 0.0045, 0); it.g.add(tp);
  it.magnetic = true; it.strength = 0; it.len = L; it.tipWorld = () => it.g.localToWorld(V3(L / 2 + 0.006, 0.0045, 0));
  it.height = 0.009; it.radius = L / 2; it.grabY = 0.0045; it.layH = 0.0045; return it;
}
// ------------------------------------------------------------------ a wooden plank on the table to measure, and things to measure it with
export function plank(o = {}) {
  const L = o.len ?? 0.9; const it = new Item('plank2', { ...o, name: o.name || { en: 'Wooden plank', hi: 'लकड़ी का तख़्ता', hg: 'Lakdi ka takhta' } });
  const m = new THREE.Mesh(new THREE.BoxGeometry(L, 0.018, 0.12), new THREE.MeshStandardMaterial({ map: woodTex('#a8784a', [3, 1]), roughness: 0.65 })); m.position.y = 0.009; m.castShadow = m.receiveShadow = true; it.g.add(m);
  const marks = new THREE.Group(); it.g.add(marks); const markM = new THREE.MeshBasicMaterial({ color: 0x222222 });
  it.mark = (x) => { const k = new THREE.Mesh(new THREE.BoxGeometry(0.0012, 0.0004, 0.02), markM); k.position.set(x, 0.0182, 0.045); marks.add(k); return k; };
  it.clear = () => { while (marks.children.length) marks.remove(marks.children[0]); };
  it.len = L; it.top = 0.018; it.height = 0.018; it.radius = L / 2; it.grabY = 0.009; it.noGrab = true; return it;
}
export function measStick(kind = 'pencil', o = {}) {
  const P = { pencil: [0.175, 'Pencil', 'पेंसिल', 'Pencil'], stick: [0.115, 'Ice-cream stick', 'आइसक्रीम की डंडी', 'Ice-cream stick'] }[kind];
  const it = new Item('mstick', { ...o, name: o.name || { en: P[1], hi: P[2], hg: P[3] } }); const L = P[0];
  if (kind === 'pencil') { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.0038, 0.0038, L - 0.018, 6), new THREE.MeshStandardMaterial({ color: 0xd9a21b, roughness: 0.5 })); b.rotation.z = Math.PI / 2; b.position.set(-0.009, 0.0038, 0); it.g.add(b); const tp = new THREE.Mesh(new THREE.ConeGeometry(0.0038, 0.018, 6), new THREE.MeshStandardMaterial({ map: woodTex('#e3c08f'), roughness: 0.7 })); tp.rotation.z = -Math.PI / 2; tp.position.set(L / 2 - 0.009, 0.0038, 0); it.g.add(tp); const lead = new THREE.Mesh(new THREE.ConeGeometry(0.0011, 0.005, 8), new THREE.MeshStandardMaterial({ color: 0x222222 })); lead.rotation.z = -Math.PI / 2; lead.position.set(L / 2 - 0.0025, 0.0038, 0); it.g.add(lead); const er = new THREE.Mesh(new THREE.CylinderGeometry(0.0038, 0.0038, 0.008, 12), new THREE.MeshStandardMaterial({ color: 0xe58f9a, roughness: 0.8 })); er.rotation.z = Math.PI / 2; er.position.set(-L / 2 + 0.004, 0.0038, 0); it.g.add(er); }
  else { const s = new THREE.Shape(); const r = 0.005; s.absarc(L / 2 - r, 0, r, -Math.PI / 2, Math.PI / 2, false); s.absarc(-L / 2 + r, 0, r, Math.PI / 2, Math.PI * 1.5, false); const g = new THREE.ExtrudeGeometry(s, { depth: 0.002, bevelEnabled: false }); g.rotateX(-Math.PI / 2); const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ map: woodTex('#dcb47e'), roughness: 0.7 })); it.g.add(m); }
  it.len = L; it.height = kind === 'pencil' ? 0.0076 : 0.002; it.radius = L / 2; it.grabY = it.height / 2; return it;
}
// ------------------------------------------------------------------ a card with a curved line drawn on it and a thread that can be laid along the line, then straightened
export function curveCard(o = {}) {
  const it = new Item('ccard', { ...o, name: o.name || { en: 'Card with a curved line, and a thread', hi: 'वक्र रेखा वाला कार्ड और धागा', hg: 'Curved line wala card aur dhaaga' } });
  const W = 0.2, D = 0.14; const pts = []; for (let i = 0; i <= 60; i++) { const t = i / 60; pts.push(V3(-0.085 + t * 0.17, 0, 0.035 * Math.sin(t * Math.PI * 2.2) - 0.01 + 0.02 * t)); }
  let len = 0; for (let i = 1; i < pts.length; i++) len += pts[i].distanceTo(pts[i - 1]);
  const tex = canvasTex(512, 358, (x, w, h) => { x.fillStyle = '#fbf8ef'; x.fillRect(0, 0, w, h); x.strokeStyle = '#1d4f9a'; x.lineWidth = 4; x.beginPath(); pts.forEach((p, i) => { const px = (p.x / W + 0.5) * w, py = (p.z / D + 0.5) * h; i ? x.lineTo(px, py) : x.moveTo(px, py); }); x.stroke(); x.fillStyle = '#1d4f9a'; for (const p of [pts[0], pts[60]]) { x.beginPath(); x.arc((p.x / W + 0.5) * w, (p.z / D + 0.5) * h, 6, 0, 6.29); x.fill(); } x.font = '600 26px sans-serif'; x.fillText('A', (pts[0].x / W + 0.5) * w - 26, (pts[0].z / D + 0.5) * h + 8); x.fillText('B', (pts[60].x / W + 0.5) * w + 10, (pts[60].z / D + 0.5) * h + 8); });
  const card = new THREE.Mesh(new THREE.BoxGeometry(W, 0.0012, D), [0, 1, 2, 3, 4, 5].map((i) => new THREE.MeshStandardMaterial(i === 2 ? { map: tex, roughness: 0.9 } : { color: 0xf2eee2, roughness: 0.9 }))); card.position.y = 0.0006; it.g.add(card);
  const thM = new THREE.MeshStandardMaterial({ color: 0xc0392b, roughness: 0.8 }); let th = null;
  // morph 0: the thread lies along the curve; 1: it is pulled straight along +x starting at A (offset to sit on a scale beside the card)
  it.straight = o.straight ?? V3(-0.085, 0.004, D / 2 + 0.03);
  it.setThread = (k, show = true) => { if (th) { th.geometry.dispose(); it.g.remove(th); th = null; } if (!show) return; const q = []; let acc = 0; for (let i = 0; i < pts.length; i++) { if (i) acc += pts[i].distanceTo(pts[i - 1]); const a = pts[i].clone().setY(0.0016); const b = it.straight.clone().add(V3(acc, 0, 0)); q.push(a.lerp(b, k)); } th = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(q), 120, 0.0007, 5), thM); it.g.add(th); };
  it.curveLen = len; it.height = 0.0012; it.radius = W / 2; it.grabY = 0.001; it.noGrab = true; return it;
}
// ------------------------------------------------------------------ a glass tub of water: things dropped in sink to the bottom or float with part of them under water
export function waterTub(o = {}) {
  const it = new Item('tub', { ...o, name: o.name || { en: 'Glass tub of water', hi: 'पानी से भरा काँच का टब', hg: 'Paani se bhara glass tub' } });
  const W = 0.34, D = 0.2, H = 0.14, wl = 0.11; const gm = glassMat({ opacity: 0.16, edge: 0.7 });
  for (const [sx, sy, sz, px, py, pz] of [[W, 0.004, D, 0, 0.002, 0], [W, H, 0.004, 0, H / 2, -D / 2], [W, H, 0.004, 0, H / 2, D / 2], [0.004, H, D, -W / 2, H / 2, 0], [0.004, H, D, W / 2, H / 2, 0]]) { const m = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), gm); m.position.set(px, py, pz); m.renderOrder = 6; it.g.add(m); }
  const wM = new THREE.MeshStandardMaterial({ color: 0x8fbfe6, transparent: true, opacity: 0.32, roughness: 0.05, depthWrite: false }); const w = new THREE.Mesh(new THREE.BoxGeometry(W - 0.008, wl - 0.004, D - 0.008), wM); w.position.y = 0.004 + (wl - 0.004) / 2; w.renderOrder = 5; it.g.add(w);
  const top = new THREE.Mesh(new THREE.PlaneGeometry(W - 0.008, D - 0.008), new THREE.MeshStandardMaterial({ color: 0xbfdcf2, transparent: true, opacity: 0.35, roughness: 0.02, metalness: 0.1, depthWrite: false })); top.rotation.x = -Math.PI / 2; top.position.y = wl; top.renderOrder = 5; it.g.add(top);
  it.waterY = wl; it.floorY = 0.004; it.W = W; it.D = D; it.height = H; it.radius = W / 2; it.grabY = H / 2; it.noGrab = true; return it;
}
// a thing that can float or sink: density in kg/m³ and its height (the part under water when floating = density / 1000)
export function floatThing(kind, o = {}) {
  const S = { stone: [2600, 'Stone', 'पत्थर', 'Patthar'], wood: [600, 'Wooden block', 'लकड़ी का गुटका', 'Lakdi ka block'], cork: [240, 'Cork', 'कॉर्क', 'Cork'], nail: [7800, 'Iron nail', 'लोहे की कील', 'Iron ki keel'], cap: [920, 'Plastic bottle cap', 'प्लास्टिक की बोतल का ढक्कन', 'Plastic bottle ka dhakkan'], key: [8500, 'Brass key', 'पीतल की चाबी', 'Peetal ki chaabi'], leaf: [500, 'Dry leaf', 'सूखी पत्ती', 'Sookhi patti'] }[kind];
  const it = new Item('fthing', { ...o, name: { en: S[1], hi: S[2], hg: S[3] } }); let h = 0.02, m;
  if (kind === 'stone') { const g = new THREE.IcosahedronGeometry(0.016, 1); const p = g.attributes.position; for (let i = 0; i < p.count; i++) p.setXYZ(i, p.getX(i) * (1.2 + Math.sin(i) * 0.08), p.getY(i) * 0.7, p.getZ(i) * (0.95 + Math.cos(i * 1.7) * 0.08)); g.computeVertexNormals(); m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: 0x7f7a73, roughness: 0.95 })); m.position.y = 0.011; h = 0.022; }
  else if (kind === 'wood') { m = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.03, 0.035), new THREE.MeshStandardMaterial({ map: woodTex('#b98a55'), roughness: 0.7 })); m.position.y = 0.015; h = 0.03; }
  else if (kind === 'cork') { m = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.013, 0.03, 24), new THREE.MeshStandardMaterial({ color: 0xb98a55, roughness: 0.95 })); m.rotation.z = Math.PI / 2; m.position.y = 0.012; h = 0.024; }
  else if (kind === 'nail') { m = new THREE.Mesh(new THREE.CylinderGeometry(0.0018, 0.0018, 0.06, 10), steel(0x8c9096, 0.42)); m.rotation.z = Math.PI / 2; m.position.y = 0.002; h = 0.004; }
  else if (kind === 'cap') { m = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.012, 28, 1, true), new THREE.MeshStandardMaterial({ color: 0x2f7fc1, roughness: 0.45, side: THREE.DoubleSide })); m.position.y = 0.006; const t = new THREE.Mesh(new THREE.CircleGeometry(0.015, 28), m.material); t.rotation.x = -Math.PI / 2; t.position.y = 0.006; m.add(t); h = 0.012; }
  else if (kind === 'key') { m = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.002, 0.012), steel(0xc9a24a, 0.3)); m.position.y = 0.001; h = 0.002; }
  else { m = new THREE.Mesh(new THREE.PlaneGeometry(0.05, 0.03), new THREE.MeshStandardMaterial({ color: 0x8a6a2e, roughness: 0.9, side: THREE.DoubleSide })); m.rotation.x = -Math.PI / 2; m.position.y = 0.001; h = 0.002; }
  m.castShadow = true; it.g.add(m); if (kind === 'stone') dress(it, 'stone_01', { w: 0.036, hide: [m] });
  it.rho = S[0]; it.floats = S[0] < 1000; it.h = h; it.height = h; it.radius = 0.03; it.grabY = h / 2; return it;
}
// ------------------------------------------------------------------ a wooden metre scale (100 cm, marked in cm and mm)
export function metreRule(o = {}) {
  const it = new Item('mrule', { ...o, name: o.name || { en: 'Metre scale', hi: 'मीटर पैमाना', hg: 'Metre scale' } }); const L = 1.02;
  const tex = canvasTex(4096, 96, (x, w, h) => { x.drawImage(woodTex('#e2c48e').image, 0, 0, w, h); x.fillStyle = '#1b1b1b'; const px = (mm) => 40 + (mm / 1000) * (w - 80); for (let mm = 0; mm <= 1000; mm++) { const Lh = mm % 10 === 0 ? 40 : mm % 5 === 0 ? 28 : 16; x.fillRect(px(mm) - 0.8, 0, mm % 10 ? 1.4 : 2.4, Lh); if (mm % 50 === 0) { x.font = '600 30px sans-serif'; x.textAlign = 'center'; x.fillText(String(mm / 10), px(mm), 78); } } });
  const m = new THREE.Mesh(new THREE.BoxGeometry(L, 0.006, 0.03), [0, 1, 2, 3, 4, 5].map((i) => new THREE.MeshStandardMaterial(i === 2 ? { map: tex, roughness: 0.6 } : { map: woodTex('#d8b67e'), roughness: 0.6 }))); m.position.y = 0.003; m.castShadow = true; it.g.add(m);
  it.xAt = (cm) => -L / 2 + 0.01 + (cm / 100) * (L - 0.02); it.height = 0.006; it.radius = L / 2; it.grabY = 0.003; return it;
}
