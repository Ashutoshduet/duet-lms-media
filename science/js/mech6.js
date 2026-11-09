// Physics (Class 7): time and light. A water clock (a bottle that drips into a marked jar), matchboxes with holes in a line,
// a straight and a bent pipe to look through, a torch beam through glass, butter paper and cardboard, a lamp that casts real
// shadows of a ball on a screen, a card with a letter for a mirror, and a globe lit by a torch (day and night).
import * as THREE from 'three';
import { Item } from './apparatus.js';
import { canvasTex, woodTex, glassMat, cardTex } from './mats.js';
import { dress } from './models.js';

const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const steel = (c = 0x9aa0a6, r = 0.35) => new THREE.MeshStandardMaterial({ color: c, metalness: 0.85, roughness: r });
const lapseOf = (it) => (it.lab && it.lab.chem && it.lab.chem.lapse) || 1;

// ------------------------------------------------------------------ a water clock: an upside-down bottle with a tiny hole drips into a glass jar with a paper strip on it
export function waterClock(o = {}) {
  const it = new Item('wclock', { ...o, name: o.name || { en: 'Water clock (dripping bottle and a marked jar)', hi: 'जल घड़ी (टपकती बोतल और निशान लगा जार)', hg: 'Water clock (tapakti bottle aur marked jar)' } });
  const stand = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.012, 0.12), new THREE.MeshStandardMaterial({ map: woodTex('#8a5a33'), roughness: 0.7 })); stand.position.y = 0.006; it.g.add(stand);
  for (const s of [-1, 1]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.36, 8), new THREE.MeshStandardMaterial({ map: woodTex('#8a5a33'), roughness: 0.7 })); p.position.set(s * 0.07, 0.18, -0.03); it.g.add(p); }
  const shelf = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.008, 0.07), new THREE.MeshStandardMaterial({ map: woodTex('#8a5a33'), roughness: 0.7 })); shelf.position.set(0, 0.24, -0.005); it.g.add(shelf);
  const jar = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.2, 32, 1, true), glassMat({ opacity: 0.18, edge: 0.7 })); jar.position.y = 0.112; jar.renderOrder = 6; it.g.add(jar);
  const jw = new THREE.Mesh(new THREE.CylinderGeometry(0.029, 0.029, 1, 32), new THREE.MeshStandardMaterial({ color: 0x9fc6e8, transparent: true, opacity: 0.55, roughness: 0.05 })); jw.renderOrder = 5; it.g.add(jw);
  const bot = new THREE.Mesh(new THREE.CylinderGeometry(0.034, 0.034, 0.16, 32, 1, true), glassMat({ opacity: 0.18, edge: 0.7 })); bot.position.y = 0.33; bot.renderOrder = 6; it.g.add(bot); const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.034, 0.012, 0.04, 24, 1, true), glassMat({ opacity: 0.18, edge: 0.7 })); neck.position.y = 0.23; it.g.add(neck);
  const bw = new THREE.Mesh(new THREE.CylinderGeometry(0.033, 0.033, 1, 32), new THREE.MeshStandardMaterial({ color: 0x9fc6e8, transparent: true, opacity: 0.55, roughness: 0.05 })); bw.renderOrder = 5; it.g.add(bw);
  const drop = new THREE.Mesh(new THREE.SphereGeometry(0.002, 8, 6), new THREE.MeshStandardMaterial({ color: 0xcfe6ff, transparent: true, opacity: 0.8 })); it.g.add(drop);
  const c = document.createElement('canvas'); c.width = 64; c.height = 512; const sx = c.getContext('2d'); const st = new THREE.CanvasTexture(c); st.colorSpace = THREE.SRGBColorSpace; sx.fillStyle = '#f3efe2'; sx.fillRect(0, 0, 64, 512);
  const strip = new THREE.Mesh(new THREE.PlaneGeometry(0.014, 0.19), new THREE.MeshStandardMaterial({ map: st, roughness: 0.9 })); strip.position.set(0, 0.112, 0.0305); it.g.add(strip);
  it.top = 600; it.bot = 0; it.t = 0; it.running = false; // mL in the bottle and in the jar
  it.update = (dt) => { const h = dt * lapseOf(it); if (it.running && it.top > 0) { const q = Math.min(it.top, 0.0014 * Math.sqrt(it.top) * h * 60); it.top -= q; it.bot += q; it.t += h; } // the flow slows as the bottle empties
    const hb = Math.max(0.0001, (it.top / 600) * 0.15); bw.scale.y = hb; bw.position.y = 0.255 + hb / 2; const hj = Math.max(0.0001, (it.bot / 560) * 0.19); jw.scale.y = hj; jw.position.y = 0.013 + hj / 2; jw.visible = it.bot > 0.5; drop.visible = it.running && it.top > 0.5; if (drop.visible) { const k = (performance.now() / 300) % 1; drop.position.set(0, 0.208 - k * (0.208 - 0.013 - hj), 0); } };
  it.mark = (label) => { const y = 512 - ((it.bot / 560) * 0.19) / 0.19 * 512; sx.fillStyle = '#c0392b'; sx.fillRect(0, y - 1.5, 40, 3); sx.fillStyle = '#1b1b1b'; sx.font = '600 20px sans-serif'; sx.fillText(label, 42, y + 7); st.needsUpdate = true; };
  it.height = 0.42; it.radius = 0.08; it.grabY = 0.15; return it;
}
// ------------------------------------------------------------------ an inner tray of a matchbox standing on its end, with a hole in the middle (light passes only through the hole)
export function holeBox(o = {}) {
  const it = new Item('hbox', { ...o, name: o.name || { en: 'Matchbox tray with a hole', hi: 'छेद वाली माचिस की डिबिया', hg: 'Chhed wali maachis ki dibbi' } });
  const W = 0.05, H = 0.07, hr = 0.0035, hy = 0.05; const sh = new THREE.Shape(); sh.moveTo(-W / 2, 0); sh.lineTo(W / 2, 0); sh.lineTo(W / 2, H); sh.lineTo(-W / 2, H); sh.closePath(); const hole = new THREE.Path(); hole.absarc(0, hy, hr, 0, Math.PI * 2, true); sh.holes.push(hole);
  const g = new THREE.ExtrudeGeometry(sh, { depth: 0.015, bevelEnabled: false }); g.translate(0, 0, -0.0075); const ct = cardTex([0.6, 0.8]); const m = new THREE.Mesh(g, [new THREE.MeshStandardMaterial({ map: ct, roughness: 0.9 }), new THREE.MeshStandardMaterial({ map: ct, color: 0xd8d0c0, roughness: 0.9 })]); it.g.add(m); // the inner tray of a matchbox: plain cardboard
  it.hy = hy; it.height = H; it.radius = 0.03; it.grabY = H / 2; return it; // the hole looks along local z
}
// ------------------------------------------------------------------ a rubber pipe, straight or bent, to look through
export function lookPipe(bent = false, o = {}) {
  const it = new Item('lpipe', { ...o, name: o.name || (bent ? { en: 'Bent rubber pipe', hi: 'मुड़ा हुआ रबर का पाइप', hg: 'Muda hua rubber pipe' } : { en: 'Straight rubber pipe', hi: 'सीधा रबर का पाइप', hg: 'Seedha rubber pipe' }) });
  const L = 0.3; const pts = []; for (let i = 0; i <= 20; i++) { const t = i / 20; pts.push(bent ? V3(Math.sin(t * Math.PI * 0.5) * L * 0.62, 0.05, -Math.cos(t * Math.PI * 0.5) * L * 0.62 + L * 0.62) : V3(0, 0.05, t * L)); }
  const g = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 60, 0.009, 16, false); const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: 0x2c2f33, roughness: 0.7, side: THREE.DoubleSide })); it.g.add(m);
  it.ends = [pts[0], pts[20]]; it.height = 0.06; it.radius = 0.16; it.grabY = 0.05; return it;
}
// ------------------------------------------------------------------ a torch on a stand pointing at a white screen; whatever stands in between lets through some, a little or none of the light
export function beamRig(o = {}) {
  const it = new Item('brig', { ...o, name: o.name || { en: 'Torch and white screen', hi: 'टॉर्च और सफ़ेद पर्दा', hg: 'Torch aur white screen' } });
  const L = o.len ?? 0.5; const tb = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.012, 0.11, 20), new THREE.MeshStandardMaterial({ color: 0x1f2a36, roughness: 0.4, metalness: 0.4 })); tb.rotation.x = Math.PI / 2; tb.position.set(0, 0.06, 0.05); it.g.add(tb);
  const st = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.045, 0.04), new THREE.MeshStandardMaterial({ map: woodTex('#8a5a33'), roughness: 0.7 })); st.position.set(0, 0.0225, 0.05); it.g.add(st);
  const lens = new THREE.Mesh(new THREE.CircleGeometry(0.013, 20), new THREE.MeshBasicMaterial({ color: 0x55515a })); lens.position.set(0, 0.06, -0.0055); lens.rotation.y = Math.PI; it.g.add(lens);
  dress(it, 'small_plastic_torch', { rot: [0, Math.PI, 0], l: 0.13, at: [0, 0.045, 0.05], hide: [tb], done: (w) => { const b = new THREE.Box3().setFromObject(w); lens.position.set(0, (b.min.y + b.max.y) / 2 - it.g.position.y, b.min.z - it.g.position.z - 0.0005); } });
  const scr = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.15, 0.004), new THREE.MeshStandardMaterial({ color: 0xf2efe8, roughness: 0.9 })); scr.position.set(0, 0.085, -L); scr.receiveShadow = true; it.g.add(scr); const ft = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.01, 0.05), new THREE.MeshStandardMaterial({ map: woodTex('#8a5a33'), roughness: 0.7 })); ft.position.set(0, 0.005, -L); it.g.add(ft);
  const sc = document.createElement('canvas'); sc.width = sc.height = 64; const x = sc.getContext('2d'); const gr = x.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,250,225,1)'); gr.addColorStop(0.55, 'rgba(255,245,210,0.7)'); gr.addColorStop(1, 'rgba(255,240,200,0)'); x.fillStyle = gr; x.fillRect(0, 0, 64, 64);
  const spot = new THREE.Mesh(new THREE.PlaneGeometry(0.11, 0.11), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(sc), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })); spot.position.set(0, 0.06, -L + 0.0025); spot.renderOrder = 8; it.g.add(spot);
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.05, L, 24, 1, true), new THREE.MeshBasicMaterial({ color: 0xfff6dc, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide })); beam.rotation.x = Math.PI / 2; beam.position.set(0, 0.06, -L / 2); beam.renderOrder = 8; it.g.add(beam);
  it.on = false; it.pass = 1; it.diffuse = 0; it.L = L;
  it.update = (dt) => { const t = it.on ? it.pass : 0; spot.material.opacity += (t - spot.material.opacity) * Math.min(1, dt * 8); spot.scale.setScalar(1 + it.diffuse * 0.8); beam.material.opacity = it.on ? 0.05 : 0; lens.material.color.setHex(it.on ? 0xfff6d8 : 0x55515a); };
  it.mid = () => it.g.localToWorld(V3(0, 0.0, -L / 2)); it.height = 0.16; it.radius = L / 2; it.grabY = 0.06; it.noGrab = true; return it;
}
// a sheet standing on a little foot: clear glass, butter paper (translucent) or cardboard (opaque)
export function sheetOnFoot(kind = 'glass', o = {}) {
  const S = { glass: [1, 0, 'Glass sheet', 'काँच की शीट', 'Glass sheet'], butter: [0.35, 1, 'Butter paper', 'बटर पेपर', 'Butter paper'], card: [0, 0, 'Cardboard', 'गत्ता', 'Cardboard (gatta)'] }[kind];
  const it = new Item('sheet2', { ...o, name: { en: S[2], hi: S[3], hg: S[4] } });
  const mat = kind === 'glass' ? glassMat({ opacity: 0.18, edge: 0.7 }) : kind === 'butter' ? new THREE.MeshStandardMaterial({ color: 0xf6f1df, roughness: 0.9, transparent: true, opacity: 0.7, side: THREE.DoubleSide }) : new THREE.MeshStandardMaterial({ map: cardTex([1, 1]), roughness: 0.95 });
  const m = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.11, 0.002), mat); m.position.y = 0.065; if (kind === 'glass') m.renderOrder = 6; m.castShadow = kind === 'card'; it.g.add(m);
  const ft = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.012, 0.03), new THREE.MeshStandardMaterial({ map: woodTex('#8a5a33'), roughness: 0.7 })); ft.position.y = 0.006; it.g.add(ft);
  it.pass = S[0]; it.diffuse = S[1]; it.height = 0.12; it.radius = 0.06; it.grabY = 0.06; return it;
}
// ------------------------------------------------------------------ real shadows: a small lamp that casts shadows, an object on a stand and a screen
export function shadowLamp(o = {}) {
  const it = new Item('slamp', { ...o, name: o.name || { en: 'Small bright lamp', hi: 'छोटा तेज़ लैंप', hg: 'Chhota tez lamp' } });
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.035, 0.01, 24), new THREE.MeshStandardMaterial({ color: 0x23272d })); base.position.y = 0.005; it.g.add(base);
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.1, 8), steel()); post.position.y = 0.055; it.g.add(post);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(o.size ?? 0.006, 16, 12), new THREE.MeshBasicMaterial({ color: 0xfff6dc })); bulb.position.y = 0.105; it.g.add(bulb); it.bulb = bulb;
  const L = new THREE.SpotLight(0xfff1d8, 0, 3, 1.0, 0.3, 1.2); L.position.set(0, 0.105, 0); L.castShadow = true; L.shadow.mapSize.set(1024, 1024); L.shadow.radius = 2; L.shadow.bias = -0.0005; L.shadow.camera.near = 0.01; L.shadow.camera.far = 3; it.g.add(L); const tg = new THREE.Object3D(); tg.position.set(0, 0.1, -1); it.g.add(tg); L.target = tg; it.light = L; // near = 1 cm: objects a few cm from the bulb must still cast shadows
  if (o.torch) { L.position.set(0, 0.05, -0.075); tg.position.set(0, 0.05, -1); bulb.position.set(0, 0.05, -0.068); dress(it, 'pastic_torch_6v', { rot: [0, Math.PI, 0], h: 0.1, hide: [base, post], shadow: false }); }
  else dress(it, 'lightbulb_01', { h: 0.05, at: [0, 0.08, 0], shadow: false });
  it.setOn = (on, size) => { L.intensity = on ? 2.4 : 0; bulb.material.color.setHex(on ? 0xffffff : 0x8a8a80); if (size != null) { bulb.scale.setScalar(size / (o.size ?? 0.006)); L.shadow.radius = 1 + size * 900; } };
  it.height = 0.11; it.radius = 0.035; it.grabY = 0.05; return it;
}
export function ballOnStand(o = {}) {
  const it = new Item('bstand', { ...o, name: o.name || { en: 'Ball on a stand', hi: 'स्टैंड पर गेंद', hg: 'Stand par ball' } });
  const b = new THREE.Mesh(new THREE.SphereGeometry(0.018, 24, 16), new THREE.MeshStandardMaterial({ color: 0xd8462b, roughness: 0.5 })); b.position.y = 0.105; b.castShadow = true; it.g.add(b);
  const p = new THREE.Mesh(new THREE.CylinderGeometry(0.002, 0.002, 0.09, 6), steel()); p.position.y = 0.045; p.castShadow = true; it.g.add(p); const base = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.022, 0.006, 20), new THREE.MeshStandardMaterial({ color: 0x23272d })); base.position.y = 0.003; it.g.add(base);
  it.height = 0.125; it.radius = 0.022; it.grabY = 0.06; return it;
}
export function bigScreen(o = {}) {
  const it = new Item('bscreen', { ...o, name: o.name || { en: 'White screen', hi: 'सफ़ेद पर्दा', hg: 'White screen' } });
  const m = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.22, 0.006), new THREE.MeshStandardMaterial({ color: 0xf4f1ea, roughness: 0.95 })); m.position.y = 0.12; m.receiveShadow = true; it.g.add(m);
  const ft = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.012, 0.06), new THREE.MeshStandardMaterial({ map: woodTex('#8a5a33'), roughness: 0.7 })); ft.position.y = 0.006; it.g.add(ft);
  it.height = 0.23; it.radius = 0.16; it.grabY = 0.1; return it;
}
// ------------------------------------------------------------------ a card with a big letter on it (to see lateral inversion in a mirror)
export function letterCard(txt = 'R', o = {}) {
  const it = new Item('lcard', { ...o, name: o.name || { en: `Card with the letter ${txt}`, hi: `${txt} अक्षर वाला कार्ड`, hg: `${txt} letter wala card` } });
  const t = canvasTex(256, 256, (x, w, h) => { x.fillStyle = '#fbf8ef'; x.fillRect(0, 0, w, h); x.fillStyle = '#1d4f9a'; x.font = '900 200px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(txt, w / 2, h / 2 + 10); });
  const m = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.07, 0.002), [0, 1, 2, 3, 4, 5].map((i) => (i === 4 || i === 5 ? new THREE.MeshStandardMaterial({ map: t, roughness: 0.8 }) : new THREE.MeshStandardMaterial({ color: 0xfbf8ef })))); m.position.y = 0.045; it.g.add(m);
  const ft = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.01, 0.025), new THREE.MeshStandardMaterial({ map: woodTex('#8a5a33'), roughness: 0.7 })); ft.position.y = 0.005; it.g.add(ft);
  it.height = 0.08; it.radius = 0.035; it.grabY = 0.04; return it;
}
// ------------------------------------------------------------------ a globe on a tilted axis (a drawn world map) and a spot marking India; it turns west to east
export function globe(o = {}) {
  const it = new Item('globe', { ...o, name: o.name || { en: 'Globe', hi: 'ग्लोब', hg: 'Globe' } });
  const tex = canvasTex(1536, 768, (x, w, h) => { x.fillStyle = '#1d3f6e'; x.fillRect(0, 0, w, h); const sticker = () => { x.fillStyle = '#e8b422'; const ix = ((78 + 180) / 360) * w, iy = ((90 - 22) / 180) * h; x.beginPath(); x.arc(ix, iy, 10, 0, 6.29); x.fill(); x.strokeStyle = '#1b1b1b'; x.lineWidth = 2; x.stroke(); };
    const img = new Image(); img.onload = () => { x.drawImage(img, 0, 0, w, h); sticker(); tex.needsUpdate = true; }; img.src = 'tex/earth.jpg'; sticker(); }); // NASA Blue Marble (public domain)
  const _old = (x, w, h) => { x.fillStyle = '#5c9a4a';
    const blob = (pts) => { x.beginPath(); pts.forEach(([lo, la], i) => { const px = ((lo + 180) / 360) * w, py = ((90 - la) / 180) * h; i ? x.lineTo(px, py) : x.moveTo(px, py); }); x.closePath(); x.fill(); };
    blob([[-168, 66], [-140, 70], [-95, 72], [-60, 60], [-55, 50], [-80, 30], [-97, 18], [-83, 9], [-105, 20], [-117, 32], [-125, 48], [-165, 60]]); // North America
    blob([[-80, 10], [-50, 0], [-35, -8], [-40, -22], [-58, -38], [-72, -52], [-75, -40], [-71, -18], [-80, -2]]); // South America
    blob([[-10, 36], [10, 37], [32, 31], [43, 12], [51, 11], [40, -15], [32, -28], [20, -35], [12, -18], [9, 4], [-8, 5], [-17, 15], [-17, 21]]); // Africa
    blob([[-10, 36], [-9, 43], [0, 50], [10, 55], [25, 60], [30, 70], [60, 68], [100, 75], [140, 72], [170, 66], [150, 60], [135, 45], [122, 30], [108, 20], [100, 10], [92, 22], [88, 22], [80, 15], [77, 8], [72, 20], [66, 25], [57, 26], [50, 30], [36, 36], [27, 41], [20, 40], [12, 44], [3, 43]]); // Eurasia
    blob([[113, -22], [130, -12], [143, -12], [153, -28], [146, -38], [132, -32], [115, -34]]); // Australia
    x.fillStyle = '#eef3f6'; x.fillRect(0, h * 0.94, w, h * 0.06); x.fillRect(0, 0, w, h * 0.03); x.fillStyle = '#e8b422'; const ix = ((78 + 180) / 360) * w, iy = ((90 - 22) / 180) * h; x.beginPath(); x.arc(ix, iy, 9, 0, 6.29); x.fill(); x.strokeStyle = '#1b1b1b'; x.lineWidth = 2; x.stroke(); }; void _old;
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.015, 32), new THREE.MeshStandardMaterial({ map: woodTex('#6b4a2e'), roughness: 0.6 })); base.position.y = 0.0075; it.g.add(base);
  const tilt = new THREE.Group(); tilt.position.y = 0.16; tilt.rotation.z = -23.5 * Math.PI / 180; it.g.add(tilt);
  const ax = new THREE.Mesh(new THREE.CylinderGeometry(0.002, 0.002, 0.26, 8), steel(0xc9a24a, 0.3)); tilt.add(ax); const arc = new THREE.Mesh(new THREE.TorusGeometry(0.115, 0.003, 6, 40, Math.PI), steel(0xc9a24a, 0.3)); arc.rotation.z = Math.PI / 2; tilt.add(arc);
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.05, 8), steel(0xc9a24a, 0.3)); post.position.y = 0.035; it.g.add(post);
  const spin = new THREE.Group(); tilt.add(spin); const ball = new THREE.Mesh(new THREE.SphereGeometry(0.1, 48, 32), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.55, metalness: 0 })); spin.add(ball);
  it.spin = spin; it.rot = 0; it.setRot = (a) => { it.rot = a; spin.rotation.y = a; };
  it.indiaWorld = () => { const la = 22 * Math.PI / 180, lo = 78 * Math.PI / 180; return ball.localToWorld(V3(Math.cos(la) * Math.cos(lo) * 0.1, Math.sin(la) * 0.1, -Math.cos(la) * Math.sin(lo) * 0.1)); };
  it.height = 0.28; it.radius = 0.12; it.grabY = 0.1; return it;
}
