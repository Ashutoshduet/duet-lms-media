// Physics: magnets and the magnetic effect of current. Bar magnets (N painted red), a magnetic compass whose needle turns to
// the real field, iron filings on a sheet that line up along the field lines when the sheet is tapped, and current-carrying
// conductors (a straight wire, a coil, a solenoid) whose field comes from the Biot–Savart law. The Earth's weak field points north (−z).
import * as THREE from 'three';
import { Item } from './apparatus.js';
import { canvasTex } from './mats.js';

const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const term = (it, key, local, dir = V3(0, 1, 0)) => { it.terms = it.terms || {}; it.terms[key] = { item: it, local, dir }; };
const tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3(), tmp3 = new THREE.Vector3(), tmpQ = new THREE.Quaternion();
export const EARTH = V3(0, 0, -1).multiplyScalar(0.035); // relative units: a bar magnet's pole strength is 1

// ------------------------------------------------------------------ a bar magnet: N end at local +x
export function barMagnet(o = {}) {
  const L = o.len ?? 0.075, w = 0.016, h = 0.008;
  const it = new Item('magnet', { ...o, name: o.name || { en: 'Bar magnet', hi: 'छड़ चुंबक', hg: 'Bar magnet' } });
  const lab = (t, bg) => canvasTex(128, 64, (x, W, H) => { x.fillStyle = bg; x.fillRect(0, 0, W, H); x.fillStyle = '#fff'; x.font = '800 44px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(t, W / 2, H / 2 + 2); });
  const mN = new THREE.MeshStandardMaterial({ map: lab('N', '#c62828'), roughness: 0.4, metalness: 0.3 }), mS = new THREE.MeshStandardMaterial({ map: lab('S', '#2d4f9a'), roughness: 0.4, metalness: 0.3 });
  const n = new THREE.Mesh(new THREE.BoxGeometry(L / 2, h, w), mN); n.position.set(L / 4, h / 2, 0); const s = new THREE.Mesh(new THREE.BoxGeometry(L / 2, h, w), mS); s.position.set(-L / 4, h / 2, 0); it.g.add(n, s);
  it.poles = () => { it.g.updateWorldMatrix(true, false); return [{ p: it.g.localToWorld(V3(L / 2 - 0.006, h / 2, 0)), q: o.strength ?? 1 }, { p: it.g.localToWorld(V3(-L / 2 + 0.006, h / 2, 0)), q: -(o.strength ?? 1) }]; };
  it.len = L; it.magnet = true; it.height = h; it.radius = L / 2; it.grabY = h / 2; return it;
}
// ------------------------------------------------------------------ the field at a point: poles (1/r² like charges), current segments (Biot–Savart), Earth
const fA = new THREE.Vector3(), fB = new THREE.Vector3(), fC = new THREE.Vector3(), fD = new THREE.Vector3(); // scratch vectors of fieldAt only (callers may pass tmp vectors as p)
export function fieldAt(items, p0, o = {}) {
  const p = fC.copy(p0); const B = o.noEarth ? V3(0, 0, 0) : EARTH.clone();
  for (const it of items) {
    if (it.poles) for (const pl of it.poles()) { const r = fA.copy(p).sub(pl.p); const d = Math.max(0.004, r.length()); B.addScaledVector(r, (pl.q * 1e-4) / (d * d * d)); }
    const Ii = it.Is ?? it.I; if (it.segs && Ii) for (const [a, b, nT = 1] of it.segs()) { const dl = fA.copy(b).sub(a); const mid = fB.copy(a).add(b).multiplyScalar(0.5); const r = fD.copy(p).sub(mid); const d = Math.max(0.003, r.length()); B.addScaledVector(dl.cross(r), (Ii * nT * 7e-5) / (d * d * d)); } // 2 A at 2 cm gives about 0.4 of the Earth's field, as in the real activity
  }
  return B;
}
// ------------------------------------------------------------------ a magnetic compass: the needle turns (with a little swing) to the horizontal field
export function compass(o = {}) {
  const r = o.r ?? 0.02; const it = new Item('compass', { ...o, name: o.name || { en: 'Magnetic compass', hi: 'चुंबकीय दिक्सूचक', hg: 'Magnetic compass' } });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 1.05, 0.008, 32), new THREE.MeshStandardMaterial({ color: 0x9a7b3c, metalness: 0.7, roughness: 0.35 })); body.position.y = 0.004; it.g.add(body);
  const dial = new THREE.Mesh(new THREE.CircleGeometry(r * 0.9, 32), new THREE.MeshStandardMaterial({ map: canvasTex(256, 256, (x, w, h) => { x.fillStyle = '#f6f2e6'; x.fillRect(0, 0, w, h); x.fillStyle = '#222'; x.font = '700 30px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; [['N', 0], ['E', 90], ['S', 180], ['W', 270]].forEach(([t, a]) => { const q = (a - 90) * Math.PI / 180; x.fillText(t, w / 2 + Math.cos(q) * 96, h / 2 + Math.sin(q) * 96); }); x.strokeStyle = '#555'; for (let a = 0; a < 360; a += 10) { const q = a * Math.PI / 180; x.beginPath(); x.moveTo(w / 2 + Math.cos(q) * 118, h / 2 + Math.sin(q) * 118); x.lineTo(w / 2 + Math.cos(q) * (a % 30 ? 112 : 106), h / 2 + Math.sin(q) * (a % 30 ? 112 : 106)); x.stroke(); } }), roughness: 0.6 }));
  dial.rotation.x = -Math.PI / 2; dial.position.y = 0.0082; it.g.add(dial);
  const nd = new THREE.Group(); nd.position.y = 0.0095; it.g.add(nd); const half = (col, s) => { const g = new THREE.ConeGeometry(0.0026, r * 0.8, 4); g.rotateZ(-s * Math.PI / 2); g.translate(s * r * 0.4, 0, 0); const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: col, roughness: 0.4, metalness: 0.2 })); m.scale.y = 0.35; nd.add(m); }; half(0xc62828, 1); half(0x2d4f9a, -1); // needle: red half points to the north
  const glass = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.92, r * 0.92, 0.0008, 32), new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.18, roughness: 0.02, clearcoat: 1, depthWrite: false })); glass.position.y = 0.0115; glass.renderOrder = 7; it.g.add(glass);
  it.ang = o.ang ?? -Math.PI / 2; it.w = 0; it.needle = nd;
  it.update = (dt) => {
    if (!it.lab) return; const p = it.g.getWorldPosition(tmp.set(0, 0, 0)); const B = fieldAt(it.lab.items.filter((i) => i !== it && (i.poles || i.segs)), p); const want = Math.atan2(-B.z, B.x); // angle of the field in the bench plane (x right, −z north)
    const yaw = new THREE.Euler().setFromQuaternion(it.g.getWorldQuaternion(tmpQ)).y; let d = want - (it.ang + yaw); d = Math.atan2(Math.sin(d), Math.cos(d)); const k = Math.min(60, 25 * Math.hypot(B.x, B.z) / 0.035);
    it.w += (d * k - it.w * 3.2) * dt; it.ang += it.w * dt; nd.rotation.y = it.ang; it.pointing = it.ang + yaw;
  };
  it.height = 0.012; it.radius = r; it.grabY = 0.006; return it;
}
// ------------------------------------------------------------------ iron filings on a sheet (glass plate or card); tapping lines them up along the field
export function filingsSheet(o = {}) {
  const W = o.w ?? 0.24, H = o.h ?? 0.18, N = o.n ?? 2600;
  const it = new Item('filings', { ...o, name: o.name || { en: 'Sheet with iron filings sprinkled on it', hi: 'लोहे का बुरादा छिड़की हुई शीट', hg: 'Iron filings chhidki hui sheet' } });
  const sheet = new THREE.Mesh(new THREE.BoxGeometry(W, 0.0015, H), new THREE.MeshStandardMaterial({ color: 0xf5f3ec, roughness: 0.9 })); sheet.position.y = (o.lift ?? 0) + 0.00075; it.g.add(sheet);
  if ((o.lift ?? 0) > 0.008) for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const lg = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, o.lift, 8), new THREE.MeshStandardMaterial({ color: 0x8a5a33, roughness: 0.7 })); lg.position.set(sx * (W / 2 - 0.01), o.lift / 2, sz * (H / 2 - 0.01)); it.g.add(lg); }
  const im = new THREE.InstancedMesh(new THREE.BoxGeometry(0.0022, 0.0004, 0.0005), new THREE.MeshStandardMaterial({ color: 0x3b3d40, roughness: 0.7, metalness: 0.4 }), N); im.position.y = (o.lift ?? 0) + 0.0018; im.frustumCulled = false; it.g.add(im);
  const P = []; for (let i = 0; i < N; i++) P.push({ x: (Math.random() - 0.5) * W * 0.96, z: (Math.random() - 0.5) * H * 0.96, a: Math.random() * Math.PI, s: 0.6 + Math.random() * 0.8 });
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), S = new THREE.Vector3(), E = new THREE.Euler();
  it.shown = o.hidden ? 0 : N; im.count = it.shown; it.sprinkle = (k) => { it.shown = Math.round(N * Math.min(1, k)); im.count = it.shown; };
  const draw = () => { for (let i = 0; i < N; i++) { const f = P[i]; E.set(0, f.a, 0); Q.setFromEuler(E); M.compose(tmp.set(f.x, 0, f.z), Q, S.set(f.s, 1, 1)); im.setMatrixAt(i, M); } im.instanceMatrix.needsUpdate = true; }; draw();
  // one tap: each filing turns along the field there; filings in a weak field drift a little towards stronger field (they gather along the lines and near the poles)
  it.tap = (others) => {
    it.g.updateWorldMatrix(true, false); const src = others.filter((q) => q !== it && (q.poles || (q.segs && (q.Is ?? q.I)))); if (!src.length) return;
    for (const f of P) {
      const w = it.g.localToWorld(tmp2.set(f.x, (o.lift ?? 0) + 0.002, f.z)); const B = fieldAt(src, w, { noEarth: true }); const bh = Math.hypot(B.x, B.z); if (bh < 1e-6) continue;
      f.a = -Math.atan2(B.z, B.x) + (Math.random() - 0.5) * 0.25 * Math.max(0.2, 0.02 / bh); // well aligned where the field is strong
      const kk = Math.min(1, bh * 4); f.x += (Math.random() - 0.5) * 0.002 * (1 - kk); f.z += (Math.random() - 0.5) * 0.002 * (1 - kk); // a weak field leaves them a little scattered
    }
    // the filings collect into chains: snap each to the nearest field line through a few seed points (cheap: shift towards the grid of lines perpendicular to the field)
    for (const f of P) { const c = Math.cos(f.a), s = Math.sin(f.a); const across = -f.x * s - f.z * c; const k = Math.round(across / 0.0045) * 0.0045 - across; f.x -= s * k * 0.55; f.z -= c * k * 0.55; }
    draw(); it.tapped = (it.tapped || 0) + 1;
  };
  it.height = 0.003 + (o.lift ?? 0); it.radius = Math.max(W, H) / 2; it.grabY = 0.002; it.noGrab = true; return it;
}
// ------------------------------------------------------------------ conductors: a straight vertical wire through a card, a circular coil and a solenoid (all carry it.I amperes)
export function straightWire(o = {}) {
  const h = o.h ?? 0.2; const it = new Item('wire', { ...o, name: o.name || { en: 'Thick copper wire (vertical, through a card)', hi: 'मोटा ताँबे का तार (कार्ड से होकर, खड़ा)', hg: 'Mota copper wire (card se hokar, khada)' } });
  const m = new THREE.Mesh(new THREE.CylinderGeometry(0.0015, 0.0015, h, 10), new THREE.MeshStandardMaterial({ color: 0xc8733a, metalness: 0.85, roughness: 0.3 })); m.position.y = h / 2; it.g.add(m);
  it.I = 0; it.segs = () => { it.g.updateWorldMatrix(true, false); const out = []; for (let i = 0; i < 8; i++) out.push([it.g.localToWorld(V3(0, (i / 8) * h, 0)), it.g.localToWorld(V3(0, ((i + 1) / 8) * h, 0))]); return out; }; // current flows upwards (from a at the bottom to b at the top)
  term(it, 'a', V3(0, 0.004, 0), V3(1, 0, 0)); term(it, 'b', V3(0, h, 0), V3(0, 1, 0)); it.dc = () => [{ a: 'a', b: 'b', R: 0.05 }];
  it.height = h; it.radius = 0.004; it.grabY = h * 0.7; return it;
}
export function solenoid(o = {}) {
  const turns = o.turns ?? 14, R = o.r ?? 0.018, L = o.len ?? 0.11; const it = new Item('solenoid', { ...o, name: o.name || { en: 'Solenoid (a long coil of insulated copper wire)', hi: 'परिनालिका (विद्युतरोधी ताँबे के तार की लंबी कुंडली)', hg: 'Solenoid (insulated copper wire ki lambi coil)' } });
  const pts = []; for (let i = 0; i <= turns * 40; i++) { const t = i / (turns * 40); const a = t * turns * Math.PI * 2; pts.push(V3(-L / 2 + t * L, R + 0.003 + Math.sin(a) * R, Math.cos(a) * R)); }
  const m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), turns * 40, 0.0012, 6), new THREE.MeshStandardMaterial({ color: 0xb5562a, metalness: 0.7, roughness: 0.35 })); it.g.add(m);
  it.I = 0; it.segs = () => { it.g.updateWorldMatrix(true, false); const out = []; for (let i = 0; i < turns * 8; i++) { const t0 = i / (turns * 8), t1 = (i + 1) / (turns * 8); const p = (t) => it.g.localToWorld(V3(-L / 2 + t * L, R + 0.003 + Math.sin(t * turns * Math.PI * 2) * R, Math.cos(t * turns * Math.PI * 2) * R)); out.push([p(t0), p(t1)]); } return out; };
  term(it, 'a', V3(-L / 2, 0.004, R), V3(-1, 0.3, 0)); term(it, 'b', V3(L / 2, 0.004, R), V3(1, 0.3, 0)); it.dc = () => [{ a: 'a', b: 'b', R: 0.3 }];
  it.height = 2 * R + 0.006; it.radius = L / 2; it.grabY = R; return it;
}

// ------------------------------------------------------------------ a straight copper wire stretched between two stands (current from end a to end b along local +x)
export function wireXY(o = {}) {
  const L = o.len ?? 0.24, h = o.h ?? 0.03; const it = new Item('wirexy', { ...o, name: o.name || { en: 'Thick copper wire XY on two stands', hi: 'दो स्टैंड पर लगा मोटा ताँबे का तार XY', hg: 'Do stands par laga mota copper wire XY' } });
  const cu = new THREE.MeshStandardMaterial({ color: 0xc8733a, metalness: 0.85, roughness: 0.3 }); const w = new THREE.Mesh(new THREE.CylinderGeometry(0.0013, 0.0013, L, 10), cu); w.rotation.z = Math.PI / 2; w.position.y = h; it.g.add(w);
  for (const sx of [-1, 1]) { const st = new THREE.Mesh(new THREE.BoxGeometry(0.012, h + 0.004, 0.02), new THREE.MeshStandardMaterial({ color: 0x8a5a33, roughness: 0.7 })); st.position.set(sx * (L / 2 + 0.004), (h + 0.004) / 2, 0); it.g.add(st); }
  term(it, 'a', V3(-L / 2 - 0.004, h + 0.003, 0), V3(-1, 0.4, 0)); term(it, 'b', V3(L / 2 + 0.004, h + 0.003, 0), V3(1, 0.4, 0));
  it.I = 0; it.dc = () => [{ a: 'a', b: 'b', R: 0.05 }]; it.wireY = h;
  it.segs = () => { it.g.updateWorldMatrix(true, false); const out = []; for (let i = 0; i < 12; i++) out.push([it.g.localToWorld(V3(-L / 2 + (i / 12) * L, h, 0)), it.g.localToWorld(V3(-L / 2 + ((i + 1) / 12) * L, h, 0))]); return out; };
  it.height = h + 0.004; it.radius = L / 2; it.grabY = h; return it;
}
// ------------------------------------------------------------------ a circular coil standing upright through a horizontal card (its plane is x–y, the card is at y = cardY)
export function coilCard(o = {}) {
  const R = o.r ?? 0.03, turns = o.turns ?? 8, cardY = o.cardY ?? 0.045; const it = new Item('coil', { ...o, name: o.name || { en: 'Circular coil through a cardboard sheet', hi: 'गत्ते से होकर गुज़रती वृत्ताकार कुंडली', hg: 'Gatte se hokar guzarti circular coil' } });
  const pts = []; for (let i = 0; i <= turns * 48; i++) { const t = i / (turns * 48); const a = t * turns * Math.PI * 2; pts.push(V3(Math.sin(a) * R, cardY + Math.cos(a) * R, (t - 0.5) * 0.006)); }
  const m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), turns * 48, 0.0011, 6), new THREE.MeshStandardMaterial({ color: 0xb5562a, metalness: 0.7, roughness: 0.35 })); it.g.add(m);
  term(it, 'a', V3(-0.005, 0.004, 0), V3(-1, 0, 0)); term(it, 'b', V3(0.005, 0.004, 0), V3(1, 0, 0)); it.I = 0; it.dc = () => [{ a: 'a', b: 'b', R: 0.2 }];
  it.segs = () => { it.g.updateWorldMatrix(true, false); const out = []; const n = 40; for (let i = 0; i < n; i++) { const a0 = (i / n) * Math.PI * 2, a1 = ((i + 1) / n) * Math.PI * 2; out.push([it.g.localToWorld(V3(Math.sin(a0) * R, cardY + Math.cos(a0) * R, 0)), it.g.localToWorld(V3(Math.sin(a1) * R, cardY + Math.cos(a1) * R, 0))]); } return out.map(([a, b]) => [a, b, turns]); };
  it.turns = turns; it.cardY = cardY; it.height = cardY + R; it.radius = R; it.grabY = cardY; return it;
}
// ------------------------------------------------------------------ a horseshoe magnet lying so that its two poles face each other one above the other (N below, S above): the field between them points up
export function horseshoe(o = {}) {
  const it = new Item('horseshoe', { ...o, name: o.name || { en: 'Strong horseshoe magnet', hi: 'शक्तिशाली नाल चुंबक', hg: 'Strong horseshoe magnet' } });
  const gap = o.gap ?? 0.03, th = 0.012, w = 0.04, back = 0.05; const red = new THREE.MeshStandardMaterial({ color: 0xc62828, roughness: 0.45, metalness: 0.3 }), steelM = new THREE.MeshStandardMaterial({ color: 0xb8bcc0, roughness: 0.3, metalness: 0.9 });
  const lo = new THREE.Mesh(new THREE.BoxGeometry(back, th, w), red); lo.position.set(back / 2, th / 2, 0); const hi = new THREE.Mesh(new THREE.BoxGeometry(back, th, w), red); hi.position.set(back / 2, th * 1.5 + gap, 0);
  const bk = new THREE.Mesh(new THREE.BoxGeometry(th, gap + 2 * th, w), red); bk.position.set(back + th / 2, th + gap / 2, 0); it.g.add(lo, hi, bk);
  const pN = new THREE.Mesh(new THREE.BoxGeometry(0.008, th + 0.0004, w + 0.0004), steelM); pN.position.set(0.004, th / 2, 0); const pS = pN.clone(); pS.position.y = th * 1.5 + gap; it.g.add(pN, pS);
  const lab = (t) => { const c = document.createElement('canvas'); c.width = 64; c.height = 64; const x = c.getContext('2d'); x.fillStyle = '#fff'; x.font = '800 48px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(t, 32, 34); const tx = new THREE.CanvasTexture(c); const sp = new THREE.Mesh(new THREE.PlaneGeometry(0.01, 0.01), new THREE.MeshBasicMaterial({ map: tx, transparent: true })); return sp; };
  const ln = lab('N'); ln.position.set(0.025, th / 2, w / 2 + 0.0008); const ls = lab('S'); ls.position.set(0.025, th * 1.5 + gap, w / 2 + 0.0008); it.g.add(ln, ls);
  it.flip = false; // turned over: S below, N above (the field points down)
  it.poles = () => { it.g.updateWorldMatrix(true, false); const out = []; for (const dz of [-0.012, 0, 0.012]) { out.push({ p: it.g.localToWorld(V3(0.004, th, dz)), q: 1.6 }); out.push({ p: it.g.localToWorld(V3(0.004, th + gap, dz)), q: -1.6 }); } return out; }; // turning the magnet over moves the poles themselves
  it.gapY = th + gap / 2; it.gap = gap; it.height = gap + 2 * th; it.radius = back; it.grabY = th; return it;
}
// ------------------------------------------------------------------ a light aluminium rod hanging from two connecting wires (it swings sideways when a force acts on it)
export function hangingRod(o = {}) {
  const L = o.len ?? 0.07, hang = o.hang ?? 0.1, y0 = o.rodY ?? 0.02; const it = new Item('rod', { ...o, name: o.name || { en: 'Aluminium rod hung by two wires', hi: 'दो तारों से लटकी एल्युमिनियम की छड़', hg: 'Do taaron se latki aluminium rod' } });
  const top = new THREE.Mesh(new THREE.BoxGeometry(L + 0.04, 0.006, 0.006), new THREE.MeshStandardMaterial({ color: 0x2b2f35, roughness: 0.5 })); top.position.y = y0 + hang; it.g.add(top); for (const sx of [-1, 1]) { const post = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, y0 + hang, 8), new THREE.MeshStandardMaterial({ color: 0x2b2f35, roughness: 0.5 })); post.position.set(sx * (L / 2 + 0.02), (y0 + hang) / 2, 0); it.g.add(post); }
  const sw = new THREE.Group(); sw.position.y = y0 + hang; it.g.add(sw); const al = new THREE.Mesh(new THREE.CylinderGeometry(0.0022, 0.0022, L, 12), new THREE.MeshStandardMaterial({ color: 0xd5d8dc, metalness: 0.9, roughness: 0.25 })); al.rotation.z = Math.PI / 2; al.position.y = -hang; sw.add(al);
  for (const sx of [-1, 1]) { const wre = new THREE.Mesh(new THREE.CylinderGeometry(0.0005, 0.0005, hang, 6), new THREE.MeshStandardMaterial({ color: 0x8a1c1c, roughness: 0.6 })); wre.position.set(sx * L / 2, -hang / 2, 0); sw.add(wre); }
  term(it, 'a', V3(-L / 2 - 0.02, y0 + hang + 0.003, 0), V3(-1, 0.3, 0)); term(it, 'b', V3(L / 2 + 0.02, y0 + hang + 0.003, 0), V3(1, 0.3, 0)); it.I = 0; it.dc = () => [{ a: 'a', b: 'b', R: 0.1 }];
  it.segs = () => { it.g.updateWorldMatrix(true, false); const out = []; for (let i = 0; i < 6; i++) out.push([sw.localToWorld(V3(-L / 2 + (i / 6) * L, -hang, 0)), sw.localToWorld(V3(-L / 2 + ((i + 1) / 6) * L, -hang, 0))]); return out; };
  it.ang = 0; it.w = 0;
  it.update = (dt) => { // the force on the rod: F = I L × B (Fleming's left-hand rule); it swings until gravity balances it
    let F = 0; const Ii = it.Is ?? 0; if (it.lab && Math.abs(Ii) > 1e-3) { const mid = sw.localToWorld(V3(0, -hang, 0)); const B = fieldAt(it.lab.items.filter((q) => q.poles), mid, { noEarth: true }); const dir = it.g.localToWorld(V3(1, 0, 0)).sub(it.g.localToWorld(V3(0, 0, 0))).normalize(); const f = dir.multiplyScalar(Ii).cross(B); const side = it.g.localToWorld(V3(0, 0, 1)).sub(it.g.localToWorld(V3(0, 0, 0))).normalize(); F = f.dot(side) * 0.04; }
    const target = Math.atan(F); it.w += ((target - it.ang) * 60 - it.w * 4) * dt; it.ang += it.w * dt; sw.rotation.x = -it.ang; it.swing = it.ang; // positive: the rod moves towards local +z
  };
  it.height = y0 + hang + 0.006; it.radius = L / 2 + 0.02; it.grabY = y0 + hang; it.rodY = y0; return it;
}
