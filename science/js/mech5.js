// Physics (Class 7): electric circuits and heat. A torch that opens (two cells inside, lamp, switch), a torch lamp with a visible
// filament, cell and lamp holders, a home-made switch (drawing pins + safety pin), everyday objects to test with a tester,
// a metal strip with pins stuck on by wax (conduction), two paper cups balanced on a stick (hot air rises), convection streams
// in water, soil and water warming in sunlight, and funnels of clay, sand and gravel (seepage).
import * as THREE from 'three';
import { Item, Vessel } from './apparatus.js';
import { canvasTex, woodTex, glassMat } from './mats.js';

const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const steel = (c = 0x9aa0a6, r = 0.35) => new THREE.MeshStandardMaterial({ color: c, metalness: 0.85, roughness: r });
const term = (it, key, local, dir = V3(0, 1, 0)) => { it.terms = it.terms || {}; it.terms[key] = { item: it, local, dir }; };
const halo = (col, s) => { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'); const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), color: col, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })); sp.scale.setScalar(s); return sp; };

// ------------------------------------------------------------------ a single 1.5 V cell lying down (+ cap at local +x)
export function cell(o = {}) {
  const it = new Item('cell', { ...o, name: o.name || { en: 'Electric cell (1.5 V)', hi: 'विद्युत सेल (1.5 V)', hg: 'Electric cell (1.5 V)' } });
  const lab = canvasTex(256, 128, (x, w, h) => { const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#1d2733'); g.addColorStop(0.5, '#33465c'); g.addColorStop(1, '#141b24'); x.fillStyle = g; x.fillRect(0, 0, w, h); x.fillStyle = '#c9ced4'; x.fillRect(w * 0.82, 0, w * 0.18, h); x.fillStyle = '#e8b422'; x.fillRect(w * 0.78, 0, w * 0.04, h); x.fillStyle = '#f2f2f2'; x.font = '700 30px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('1.5 V   AA', w * 0.42, h / 2); x.font = '800 34px sans-serif'; x.fillText('+', w * 0.91, h / 2); x.fillText('−', w * 0.06, h / 2); });
  const b = new THREE.Mesh(new THREE.CylinderGeometry(0.0072, 0.0072, 0.05, 24), new THREE.MeshStandardMaterial({ map: lab, roughness: 0.45, metalness: 0.2 })); b.rotation.z = Math.PI / 2; b.position.y = 0.0072; it.g.add(b);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.0026, 0.0026, 0.0018, 14), steel(0xc8ccd0, 0.3)); cap.rotation.z = Math.PI / 2; cap.position.set(0.0259, 0.0072, 0); it.g.add(cap);
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.0068, 0.0068, 0.0008, 20), steel(0xc8ccd0, 0.3)); disc.rotation.z = Math.PI / 2; disc.position.set(-0.0252, 0.0072, 0); it.g.add(disc);
  it.height = 0.0144; it.radius = 0.026; it.grabY = 0.0072; it.layH = 0.0072; return it;
}
// ------------------------------------------------------------------ a torch: the barrel can be opened to show two cells, the lamp behind the glass and the slide switch
export function torchKit(o = {}) {
  const it = new Item('torch2', { ...o, name: o.name || { en: 'Torch (opened up)', hi: 'टॉर्च (खोली हुई)', hg: 'Torch (khuli hui)' } });
  const body = new THREE.MeshStandardMaterial({ color: 0xe2c330, roughness: 0.5, metalness: 0 }); // yellow plastic
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.12, 24, 1, true), new THREE.MeshStandardMaterial({ color: 0xf0e6b0, roughness: 0.2, metalness: 0, side: THREE.DoubleSide, transparent: true, opacity: 0.28, depthWrite: false })); barrel.renderOrder = 6; barrel.rotation.z = Math.PI / 2; barrel.position.set(0, 0.012, 0); it.g.add(barrel);
  const head = new THREE.Mesh(new THREE.CylinderGeometry(0.017, 0.012, 0.035, 24), body); head.rotation.z = Math.PI / 2; head.position.set(0.077, 0.017, 0); it.g.add(head);
  const lens = new THREE.Mesh(new THREE.CircleGeometry(0.015, 24), new THREE.MeshBasicMaterial({ color: 0x55515a })); lens.rotation.y = Math.PI / 2; lens.position.set(0.0952, 0.017, 0); it.g.add(lens);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.0165, 0.0028, 10, 32), new THREE.MeshStandardMaterial({ color: 0x1b1b1b, roughness: 0.8 })); ring.rotation.y = Math.PI / 2; ring.position.set(0.0945, 0.017, 0); it.g.add(ring); // black rubber ring round the glass
  const refl = new THREE.Mesh(new THREE.ConeGeometry(0.0145, 0.014, 28, 1, true), new THREE.MeshStandardMaterial({ color: 0xe8ecef, metalness: 1, roughness: 0.12, side: THREE.DoubleSide })); refl.rotation.z = Math.PI / 2; refl.position.set(0.087, 0.017, 0); it.g.add(refl);
  const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.0115, 0.0115, 0.015, 24), body); tail.rotation.z = Math.PI / 2; tail.position.set(-0.07, 0.012, 0); it.g.add(tail); it.tail = tail;
  const sw = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.004, 0.006), new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.6 })); sw.position.set(0.03, 0.024, 0); it.g.add(sw); it.sw = sw;
  const L = new THREE.PointLight(0xfff1c8, 0, 1.4, 2); L.position.set(0.1, 0.017, 0); it.g.add(L); const h = halo(0xfff1c8, 0.06); h.position.set(0.097, 0.017, 0); it.g.add(h);
  it.cells = []; it.on = false; it.slot = (i) => V3(-0.032 + i * 0.051, 0.012, 0); // where the two cells sit inside (the + caps point towards the lamp)
  it.works = () => it.cells.length === 2 && it.cells.every((c) => c.inTorch && c.dirOK);
  it.setOn = (on) => { it.on = on; sw.position.x = on ? 0.038 : 0.03; const lit = on && it.works(); lens.material.color.setHex(lit ? 0xfff6d8 : 0x55515a); L.intensity = lit ? 0.12 : 0; h.material.opacity = lit ? 0.9 : 0; return lit; };
  it.height = 0.034; it.radius = 0.1; it.grabY = 0.012; return it;
}
// ------------------------------------------------------------------ a cell in a holder (two terminals) and a torch lamp in a holder; the lamp's filament glows (kind 'bulb' for the circuit solver)
export function cellHolder(o = {}) {
  const it = new Item('cellh', { ...o, name: o.name || { en: 'Cell in a cell holder', hi: 'सेल होल्डर में सेल', hg: 'Cell holder mein cell' } });
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.006, 0.022), new THREE.MeshStandardMaterial({ color: 0x23272d, roughness: 0.6 })); base.position.y = 0.003; it.g.add(base);
  const c = cell(); c.g.position.set(0, 0.004, 0); it.g.add(c.g);
  for (const s of [-1, 1]) { const clip = new THREE.Mesh(new THREE.BoxGeometry(0.002, 0.016, 0.012), steel(0xc8ccd0, 0.3)); clip.position.set(s * 0.028, 0.012, 0); it.g.add(clip); }
  term(it, '+', V3(0.031, 0.016, 0.006), V3(1, 0.5, 0.3)); term(it, '-', V3(-0.031, 0.016, 0.006), V3(-1, 0.5, 0.3));
  it.volts = 1.5; it.rInt = 0.3; it.height = 0.02; it.radius = 0.036; it.grabY = 0.01; return it;
}
export function lampHolder(o = {}) {
  const it = new Item('bulb', { ...o, name: o.name || { en: 'Torch lamp in a lamp holder', hi: 'लैंप होल्डर में टॉर्च बल्ब', hg: 'Lamp holder mein torch bulb' } });
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.01, 0.03), new THREE.MeshStandardMaterial({ map: woodTex('#8a5a33'), roughness: 0.7 })); base.position.y = 0.005; it.g.add(base);
  const sock = new THREE.Mesh(new THREE.CylinderGeometry(0.0058, 0.0058, 0.012, 20), steel(0xb0b4b8, 0.4)); sock.position.y = 0.016; it.g.add(sock);
  const glass = new THREE.Mesh(new THREE.SphereGeometry(0.0088, 24, 16), glassMat({ opacity: 0.22 })); glass.position.y = 0.0305; glass.renderOrder = 7; it.g.add(glass);
  const fM = new THREE.MeshStandardMaterial({ color: 0x3a2a20, emissive: 0xff7a20, emissiveIntensity: 0, roughness: 0.5 });
  const fil = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(Array.from({ length: 30 }, (_, i) => V3(-0.0025 + (i / 29) * 0.005, 0.032 + Math.sin(i * 1.7) * 0.0005, Math.cos(i * 1.7) * 0.0005))), 60, 0.00018, 4), fM); it.g.add(fil);
  for (const s of [-1, 1]) { const post = new THREE.Mesh(new THREE.CylinderGeometry(0.00025, 0.00025, 0.01, 4), steel(0x888888)); post.position.set(s * 0.0025, 0.027, 0); it.g.add(post); }
  const h = halo(0xffd890, 0.08); h.position.y = 0.031; it.g.add(h); const L = new THREE.PointLight(0xffd18a, 0, 0.9, 2); L.position.y = 0.032; it.g.add(L);
  for (const s of [-1, 1]) { const sc = new THREE.Mesh(new THREE.CylinderGeometry(0.0022, 0.0022, 0.002, 12), new THREE.MeshStandardMaterial({ color: 0xc9a24a, metalness: 0.9, roughness: 0.35 })); sc.position.set(s * 0.015, 0.011, 0.006); it.g.add(sc); }
  term(it, 'a', V3(-0.015, 0.012, 0.006)); term(it, 'b', V3(0.015, 0.012, 0.006));
  it.Rb = 5; it.Prated = 0.45; it.glowK = 0; it.fused = false;
  it.setGlow = (b) => { if (it.fused) b = 0; it.glowK = b; fM.emissiveIntensity = b * 5; fM.emissive.setHex(0xff7a20).lerp(new THREE.Color(0xfff2d0), Math.min(1, b * 1.3)); h.material.opacity = Math.min(0.9, b); h.scale.setScalar(0.03 + 0.07 * b); L.intensity = b * 0.08; };
  it.height = 0.04; it.radius = 0.025; it.grabY = 0.02; return it;
}
// ------------------------------------------------------------------ a home-made switch: two drawing pins on a cardboard, a safety pin that can be turned to touch both
export function pinSwitch(o = {}) {
  const it = new Item('key', { ...o, name: o.name || { en: 'Home-made switch (drawing pins and a safety pin)', hi: 'घर का बना स्विच (ड्राइंग पिन और सेफ़्टी पिन)', hg: 'Ghar ka bana switch (drawing pins aur safety pin)' } });
  const card = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.004, 0.04), new THREE.MeshStandardMaterial({ color: 0xb79a6c, roughness: 0.95 })); card.position.y = 0.002; it.g.add(card);
  for (const s of [-1, 1]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.0045, 0.0045, 0.0015, 18), new THREE.MeshStandardMaterial({ color: 0xc9a24a, metalness: 0.9, roughness: 0.3 })); p.position.set(s * 0.016, 0.0048, 0); it.g.add(p); }
  const piv = new THREE.Group(); piv.position.set(-0.016, 0.0062, 0); it.g.add(piv); const sp = new THREE.Mesh(new THREE.TorusGeometry(0.0034, 0.0006, 6, 16), steel(0xd0d4d8, 0.25)); sp.scale.set(5.2, 1, 1); sp.rotation.x = Math.PI / 2; sp.position.x = 0.017; piv.add(sp);
  term(it, 'a', V3(-0.016, 0.006, 0.008), V3(-0.4, 1, 0.3)); term(it, 'b', V3(0.016, 0.006, 0.008), V3(0.4, 1, 0.3));
  it.on = false; it.ang = 0.9; piv.rotation.y = 0.9; it.setOn = (on) => { it.on = on; }; it.update = (dt) => { const t = it.on ? 0 : 0.9; it.ang += (t - it.ang) * Math.min(1, dt * 10); piv.rotation.y = it.ang; };
  it.height = 0.008; it.radius = 0.03; it.grabY = 0.004; return it;
}
// ------------------------------------------------------------------ everyday things to test with a tester (cond: how well they conduct, 0 … 100)
const clipGeo = () => { const pts = []; const w = 0.0045, l = 0.016; for (let i = 0; i <= 70; i++) { const t = i / 70; const a = t * Math.PI * 2 * 1.75; const r = t < 0.57 ? w : w * 0.62; const y = Math.cos(a) > 0 ? l / 2 - r : -l / 2 + r; pts.push(V3(Math.sin(a) * r, 0, -(y + Math.cos(a) * r * 0.9 * (Math.abs(Math.cos(a)) > 0.3 ? 1 : 0)))); } return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 90, 0.0005, 6); };
const keyGeo = () => { const s = new THREE.Shape(); s.absarc(-0.017, 0, 0.009, 0.35, Math.PI * 2 - 0.35, false); s.lineTo(0.026, -0.0028); s.lineTo(0.026, 0.0012); for (const x of [0.022, 0.017, 0.012, 0.007]) { s.lineTo(x, 0.0012); s.lineTo(x - 0.0018, 0.0042); s.lineTo(x - 0.0036, 0.0012); } s.lineTo(-0.0085, 0.0028); const hole = new THREE.Path(); hole.absarc(-0.019, 0, 0.003, 0, Math.PI * 2, true); s.holes.push(hole); const g = new THREE.ExtrudeGeometry(s, { depth: 0.0018, bevelEnabled: true, bevelSize: 0.0003, bevelThickness: 0.0002, bevelSegments: 1 }); g.rotateX(-Math.PI / 2); g.translate(0, -0.0009, 0); return g; };
const stickGeo = () => { const s = new THREE.Shape(); const L = 0.04, r = 0.005; s.absarc(L - r, 0, r, -Math.PI / 2, Math.PI / 2, false); s.absarc(-L + r, 0, r, Math.PI / 2, Math.PI * 1.5, false); const g = new THREE.ExtrudeGeometry(s, { depth: 0.0018, bevelEnabled: false }); g.rotateX(-Math.PI / 2); g.translate(0, -0.0009, 0); return g; };
let _coin = null; const coinTex = () => _coin || (_coin = canvasTex(128, 128, (x, w, h) => { const g = x.createRadialGradient(54, 50, 6, 64, 64, 64); g.addColorStop(0, '#e9eef1'); g.addColorStop(1, '#9ea6ad'); x.fillStyle = g; x.fillRect(0, 0, w, h); x.strokeStyle = 'rgba(60,66,72,0.6)'; x.lineWidth = 3; x.beginPath(); x.arc(64, 64, 56, 0, 6.29); x.stroke(); x.fillStyle = 'rgba(70,76,82,0.75)'; x.font = '700 54px serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('1', 64, 70); }));
let _ruler = null; const rulerTex = () => _ruler || (_ruler = canvasTex(512, 160, (x, w, h) => { x.fillStyle = '#cfe8f7'; x.fillRect(0, 0, w, h); x.fillStyle = '#1b2a3a'; for (let mm = 0; mm <= 75; mm++) { const X = 12 + mm * 6.5; const L = mm % 10 === 0 ? 50 : mm % 5 === 0 ? 34 : 20; x.fillRect(X, 0, 1.6, L); if (mm % 10 === 0) { x.font = '600 26px sans-serif'; x.fillText(String(mm / 10), X - 7, 84); } } }));
export function thing(kind, o = {}) {
  const S = { clip: [0x9aa0a6, 60, 'Paper clip', 'पेपर क्लिप', 'Paper clip'], key: [0xc9a24a, 70, 'Key', 'चाबी', 'Chaabi'], coin: [0xd8dcdf, 70, 'Coin', 'सिक्का', 'Sikka'], eraser: [0xe9a0a8, null, 'Eraser', 'रबड़', 'Rubber (eraser)'], scale: [0x5aa9e6, null, 'Plastic scale', 'प्लास्टिक का स्केल', 'Plastic scale'], wood: [0xb98a55, null, 'Wooden ice-cream stick', 'लकड़ी की आइसक्रीम स्टिक', 'Lakdi ki ice-cream stick'], lead: [0x2a2a2a, 0.15, 'Pencil lead (graphite)', 'पेंसिल की लेड (ग्रेफ़ाइट)', 'Pencil lead (graphite)'], glass: [0xcfeff0, null, 'Glass slide', 'काँच की स्लाइड', 'Glass slide'], foil: [0xd8dcdf, 60, 'Aluminium foil', 'ऐलुमिनियम पन्नी', 'Aluminium foil'] }[kind];
  const it = new Item('thing', { ...o, name: { en: S[2], hi: S[3], hg: S[4] } }); let h = 0.004;
  const met = [0x9aa0a6, 0xc9a24a, 0xd8dcdf].includes(S[0]); const M = met ? steel(S[0], 0.3) : kind === 'glass' ? glassMat({ opacity: 0.4, edge: 0.8 }) : new THREE.MeshStandardMaterial({ color: S[0], roughness: 0.6 });
  let g; if (kind === 'coin') { g = new THREE.CylinderGeometry(0.012, 0.012, 0.0018, 40); h = 0.0018; } else if (kind === 'clip') { g = clipGeo(); h = 0.0012; } else if (kind === 'key') { g = keyGeo(); h = 0.002; } else if (kind === 'eraser') { g = new THREE.BoxGeometry(0.03, 0.01, 0.02); h = 0.01; } else if (kind === 'scale') { g = new THREE.BoxGeometry(0.08, 0.002, 0.025); h = 0.002; } else if (kind === 'wood') { g = stickGeo(); h = 0.002; } else if (kind === 'lead') { g = new THREE.CylinderGeometry(0.001, 0.001, 0.05, 8); g.rotateZ(Math.PI / 2); h = 0.002; } else if (kind === 'glass') { g = new THREE.BoxGeometry(0.075, 0.0012, 0.025); h = 0.0012; } else { g = new THREE.BoxGeometry(0.05, 0.0005, 0.03); h = 0.0006; }
  if (kind === 'coin') M.map = coinTex(); if (kind === 'scale') { M.map = rulerTex(); M.color.setHex(0xffffff); M.transparent = true; M.opacity = 0.9; } if (kind === 'wood') { M.map = woodTex('#d8b07a'); M.color.setHex(0xffffff); }
  const m = new THREE.Mesh(g, M); m.position.y = h / 2; it.g.add(m);
  it.cond = S[1] ?? 0; it.height = h; it.radius = 0.02; it.touchR = 0.03; it.grabY = h / 2; return it;
}
// ------------------------------------------------------------------ a metal strip held in a stand, with pins stuck under it by drops of wax; heat travels along it and the pins drop one by one
export function waxStrip(o = {}) {
  const it = new Item('waxstrip', { ...o, name: o.name || { en: 'Metal strip with pins stuck on by wax', hi: 'मोम से चिपकी पिनों वाली धातु की पट्टी', hg: 'Mom se chipki pins wali metal strip' } });
  const L = 0.25, n = 5; const stand = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.12, 0.04), new THREE.MeshStandardMaterial({ map: woodTex('#8a5a33'), roughness: 0.7 })); stand.position.set(-L / 2 - 0.02, 0.06, 0); it.g.add(stand);
  const sM = new THREE.MeshStandardMaterial({ color: 0xb87333, metalness: 0.85, roughness: 0.35, emissive: 0xff3a10, emissiveIntensity: 0 }); const st = new THREE.Mesh(new THREE.BoxGeometry(L, 0.002, 0.02), sM); st.position.set(0, 0.11, 0); it.g.add(st);
  it.pins = []; for (let i = 0; i < n; i++) { const x = -L / 2 + 0.05 + i * 0.042; const g = new THREE.Group(); g.position.set(x, 0.109, 0); it.g.add(g); const w = new THREE.Mesh(new THREE.SphereGeometry(0.004, 12, 8), new THREE.MeshStandardMaterial({ color: 0xf2e9c9, roughness: 0.5 })); w.scale.y = 0.6; w.position.y = -0.002; g.add(w); const p = new THREE.Mesh(new THREE.CylinderGeometry(0.0005, 0.0005, 0.03, 6), steel(0xc8ccd0, 0.25)); p.position.y = -0.018; g.add(p); const hd = new THREE.Mesh(new THREE.SphereGeometry(0.0018, 10, 8), new THREE.MeshStandardMaterial({ color: 0x1d4f9a })); hd.position.y = -0.034; g.add(hd); it.pins.push({ g, x, wax: w, t: 0, down: false, v: 0, y0: 0.109 }); }
  // heat flows along the strip from the hot end (x = +L/2): a simple 1D conduction model
  const N = 40; const T = new Float32Array(N).fill(30); it.T = T; it.heatEnd = 0; it.k = o.k ?? 1;
  it.update = (dt) => { const l = (it.lab && it.lab.chem && it.lab.chem.lapse) || 1; let rem = Math.min(0.2, dt * l); while (rem > 1e-6) { const h = Math.min(rem, 0.02); if (it.heatEnd) T[N - 1] += (450 - T[N - 1]) * h * 0.8; const nt = T.slice(); for (let i = 1; i < N - 1; i++) nt[i] = T[i] + h * it.k * 6 * (T[i - 1] - 2 * T[i] + T[i + 1]) - h * 0.02 * (T[i] - 30); nt[0] = nt[1]; T.set(nt); rem -= h; }
    sM.emissiveIntensity = Math.max(0, (T[N - 1] - 300) / 300) * 0.6;
    for (const p of it.pins) { const i = Math.round(((p.x + L / 2) / L) * (N - 1)); const tt = T[Math.max(0, Math.min(N - 1, i))]; if (!p.down && tt > 62) { p.down = true; } if (p.down) { p.v -= 9.8 * dt; p.g.position.y = Math.max(0.0, p.g.position.y + p.v * dt); if (p.g.position.y <= 0.035) { p.g.position.y = 0.035; p.g.rotation.z = 1.4; } p.wax.scale.setScalar(Math.max(0.3, p.wax.scale.x - dt)); } } };
  it.hotEnd = () => it.g.localToWorld(V3(L / 2 - 0.005, 0.11, 0)); it.dropped = () => it.pins.filter((p) => p.down).length;
  it.height = 0.12; it.radius = 0.15; it.grabY = 0.06; it.noGrab = true; return it;
}
// ------------------------------------------------------------------ two paper cups hung upside down from the ends of a stick balanced on a stand; warm air under one pushes it up
export function cupBalance(o = {}) {
  const it = new Item('cupbal', { ...o, name: o.name || { en: 'Two paper cups balanced on a stick', hi: 'छड़ी पर संतुलित दो कागज़ के कप', hg: 'Stick par balanced do paper cups' } });
  const st = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.3, 10), steel()); st.position.y = 0.15; it.g.add(st); const base = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.012, 0.08), new THREE.MeshStandardMaterial({ color: 0x2b2f35 })); base.position.y = 0.006; it.g.add(base);
  const beam = new THREE.Group(); beam.position.y = 0.3; it.g.add(beam); const stick = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.006, 0.01), new THREE.MeshStandardMaterial({ map: woodTex('#b98a55'), roughness: 0.7 })); beam.add(stick);
  const cups = [-1, 1].map((s) => { const g = new THREE.Group(); g.position.set(s * 0.18, 0, 0); beam.add(g); const th = new THREE.Mesh(new THREE.CylinderGeometry(0.0004, 0.0004, 0.06, 4), new THREE.MeshStandardMaterial({ color: 0xf2efe6 })); th.position.y = -0.03; g.add(th); const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.022, 0.07, 24, 1, true), new THREE.MeshStandardMaterial({ color: 0xf4f1e8, roughness: 0.8, side: THREE.DoubleSide })); cup.position.y = -0.095; g.add(cup); const top = new THREE.Mesh(new THREE.CircleGeometry(0.022, 24), new THREE.MeshStandardMaterial({ color: 0xf4f1e8, side: THREE.DoubleSide })); top.rotation.x = Math.PI / 2; top.position.y = -0.06; g.add(top); return g; });
  it.tilt = 0; it.lift = 0; // lift > 0: the right cup is pushed up by warm air
  it.update = (dt) => { const want = Math.max(-0.35, Math.min(0.35, it.lift * 0.35)); it.tilt += (want - it.tilt) * Math.min(1, dt * 1.5); beam.rotation.z = it.tilt; for (const c of cups) c.rotation.z = -it.tilt; };
  it.cupWorld = (i) => cups[i].localToWorld(V3(0, -0.13, 0)); it.height = 0.31; it.radius = 0.2; it.grabY = 0.15; it.noGrab = true; return it;
}
// ------------------------------------------------------------------ convection: purple streams from a crystal rise above the flame, spread at the top and sink at the far side
export class Convection {
  constructor(v, scene) { this.v = v; this.n = 260; const g = new THREE.BufferGeometry(); this.P = new Float32Array(this.n * 3); g.setAttribute('position', new THREE.BufferAttribute(this.P, 3)); this.pts = new THREE.Points(g, new THREE.PointsMaterial({ color: 0x7a1f8f, size: 0.0035, transparent: true, opacity: 0.75, depthWrite: false })); this.pts.frustumCulled = false; this.pts.renderOrder = 5; v.g.add(this.pts); this.p = []; this.on = false; this.heat = 0; this.src = V3(0.012, 0, 0); void scene; }
  update(dt) {
    const v = this.v; const H = v.heightFor(v.ml) - v.inner[0].y, R = v.rInner(v.inner[0].y + 0.01) * 0.85, y0 = v.inner[0].y + 0.002; if (this.on && this.p.length < this.n) for (let i = 0; i < 2; i++) this.p.push(V3(this.src.x + (Math.random() - 0.5) * 0.004, y0, this.src.z + (Math.random() - 0.5) * 0.004));
    for (let i = 0; i < this.p.length; i++) { const p = this.p[i]; const h = (p.y - y0) / Math.max(0.01, H); const x = p.x / R; // a loop: up over the flame (x ≈ +0.3), across the top, down the far side, back along the bottom
      const vx = this.heat * (h > 0.85 ? -0.02 : h < 0.12 ? 0.02 : 0) + (Math.random() - 0.5) * 0.002; const vy = this.heat * (x > 0.1 ? 0.03 : x < -0.4 ? -0.025 : (h > 0.85 ? 0 : -0.006)) + (this.heat ? 0 : 0.0006);
      p.x = Math.max(-R, Math.min(R, p.x + vx * dt)); p.y = Math.max(y0, Math.min(y0 + H * 0.97, p.y + vy * dt)); p.z += (Math.random() - 0.5) * 0.0015 * dt * 10; p.z = Math.max(-R * 0.4, Math.min(R * 0.4, p.z)); this.P.set([p.x, p.y, p.z], i * 3); }
    this.pts.geometry.setDrawRange(0, this.p.length); this.pts.geometry.attributes.position.needsUpdate = true;
  }
}
// ------------------------------------------------------------------ a small container of soil (or water) with a thermometer stuck in it; it warms in the Sun and cools in the shade
export function sunBox(kind = 'soil', o = {}) {
  const it = new Item('sunbox', { ...o, name: o.name || (kind === 'soil' ? { en: 'Container of dry soil with a thermometer', hi: 'थर्मामीटर लगा सूखी मिट्टी का बर्तन', hg: 'Thermometer laga sookhi mitti ka bartan' } : { en: 'Container of water with a thermometer', hi: 'थर्मामीटर लगा पानी का बर्तन', hg: 'Thermometer laga paani ka bartan' }) });
  const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.04, 0.06, 32, 1, true), new THREE.MeshStandardMaterial({ color: 0xd8dcdf, metalness: 0.6, roughness: 0.4, side: THREE.DoubleSide })); cup.position.y = 0.03; it.g.add(cup);
  const top = new THREE.Mesh(new THREE.CircleGeometry(0.044, 32), kind === 'soil' ? new THREE.MeshStandardMaterial({ color: 0x6b4a2e, roughness: 1 }) : new THREE.MeshStandardMaterial({ color: 0x9fc6e8, roughness: 0.05, transparent: true, opacity: 0.85 })); top.rotation.x = -Math.PI / 2; top.position.y = 0.052; it.g.add(top);
  const th = new THREE.Group(); th.position.set(0.01, 0.03, 0.01); it.g.add(th); const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.0025, 0.0025, 0.14, 10), glassMat({ opacity: 0.35, edge: 0.8 })); stem.position.y = 0.07; stem.renderOrder = 6; th.add(stem); const col = new THREE.Mesh(new THREE.CylinderGeometry(0.0008, 0.0008, 1, 6), new THREE.MeshBasicMaterial({ color: 0xc0281e })); th.add(col);
  it.T = 30; it.sun = false; it.kind2 = kind; it.c = kind === 'soil' ? 0.03 : 0.0075; // how fast it warms / cools (soil fast, water slow)
  it.update = (dt) => { const l = (it.lab && it.lab.chem && it.lab.chem.lapse) || 1; const Teq = it.sun ? (kind === 'soil' ? 52 : 40) : 30; it.T += (Teq - it.T) * Math.min(1, it.c * dt * l / 6); const top2 = 0.012 + ((it.T - 10) / 90) * 0.13; col.scale.y = top2; col.position.y = top2 / 2; };
  it.read = () => Math.round(it.T); it.height = 0.17; it.radius = 0.045; it.grabY = 0.03; return it;
}
// ------------------------------------------------------------------ a funnel packed with clay, sand or gravel over a measuring cylinder; water seeps through at very different rates
export function seepFunnel(kind = 'sand', o = {}) {
  const k = { clay: [0x8a5a3c, 0.18], sand: [0xd8bf8c, 1.5], gravel: [0x8b8680, 6] }[kind]; const it = new Item('seep', { ...o, name: o.name || { clay: { en: 'Funnel packed with clay', hi: 'चिकनी मिट्टी भरी कीप', hg: 'Clay se bhari funnel' }, sand: { en: 'Funnel packed with sand', hi: 'रेत भरी कीप', hg: 'Ret se bhari funnel' }, gravel: { en: 'Funnel packed with gravel', hi: 'बजरी भरी कीप', hg: 'Bajri se bhari funnel' } }[kind] });
  const cone = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.006, 0.06, 32, 1, true), glassMat({ opacity: 0.25, edge: 0.7 })); cone.position.y = 0.27; cone.renderOrder = 6; it.g.add(cone); const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.05, 12, 1, true), glassMat({ opacity: 0.25, edge: 0.7 })); stem.position.y = 0.215; it.g.add(stem);
  const fill = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.008, 0.045, 28), new THREE.MeshStandardMaterial({ color: k[0], roughness: 1 })); fill.position.y = 0.265; it.g.add(fill);
  const water = new THREE.Mesh(new THREE.CylinderGeometry(0.044, 0.04, 1, 28), new THREE.MeshStandardMaterial({ color: 0xa8c6dc, transparent: true, opacity: 0.6, roughness: 0.05 })); water.position.y = 0.29; water.scale.y = 0.0001; water.visible = false; it.g.add(water);
  const drip = new THREE.Mesh(new THREE.CylinderGeometry(0.0012, 0.0012, 1, 6), new THREE.MeshStandardMaterial({ color: 0xcfe6ff, transparent: true, opacity: 0.6 })); drip.visible = false; it.g.add(drip);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.047, 0.003, 8, 32), steel()); ring.rotation.x = Math.PI / 2; ring.position.y = 0.3; it.g.add(ring); const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.32, 10), steel()); rod.position.set(-0.075, 0.16, 0); it.g.add(rod); const arm = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.004, 0.004), steel()); arm.position.set(-0.06, 0.3, 0); it.g.add(arm); const base = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.01, 0.1), new THREE.MeshStandardMaterial({ color: 0x2b2f35 })); base.position.set(-0.04, 0.005, 0); it.g.add(base);
  it.rate = k[1]; it.top = 0; it.to = null; // top: mL of water standing on the soil; to: the cylinder below
  it.update = (dt) => { const l = (it.lab && it.lab.chem && it.lab.chem.lapse) || 1; if (it.top > 0.01) { const f = Math.min(it.top, it.rate * dt * l); it.top -= f; if (it.to) { it.to.mix.add('water', f); it.to.ml = it.to.mix.ml(); } } water.visible = it.top > 0.2; water.scale.y = Math.max(0.0001, it.top / 1800); water.position.y = 0.288 + water.scale.y / 2; drip.visible = it.top > 0.05; if (drip.visible && it.to) { const y1 = it.to.levelWorld ? it.g.worldToLocal(V3(0, it.to.ml > 0.2 ? it.to.levelWorld() : it.to.g.position.y + 0.01, 0)).y : 0.05; const L = Math.max(0.005, 0.19 - y1); drip.scale.y = L; drip.position.y = 0.19 - L / 2; drip.material.opacity = Math.min(0.7, 0.15 + it.rate / 30); } };
  it.height = 0.32; it.radius = 0.05; it.grabY = 0.16; return it;
}
