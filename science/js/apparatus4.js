// Batch 4 apparatus (electricity in chemistry): dry cells and a 9 V battery, a torch bulb and an LED in holders, a switch,
// flexible wires that follow whatever they are clipped to, tester leads, electrodes (iron nails in a cork, carbon rods in a card
// or in the base of a mug), copper plates, upside-down gas-collecting tubes, a spatula for flame tests — and the circuit itself:
// it finds out every frame what closes the gap (the two ends touching, a liquid, a solid) and how much current flows.
import * as THREE from 'three';
import { Item, Vessel, flame, realTex } from './apparatus.js';
import { glassMat, canvasTex, woodTex } from './mats.js';
import { conductance, SOLIDS } from './chem.js';
import { BENCH_Y } from './room.js';

const V2 = (r, y) => new THREE.Vector2(r, y);
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3(), tmpQ = new THREE.Quaternion();
const metal = (c = 0xc4c8cc, r = 0.3) => new THREE.MeshStandardMaterial({ color: c, metalness: 0.9, roughness: r });
const brass = () => new THREE.MeshStandardMaterial({ color: 0xc9a24a, metalness: 0.9, roughness: 0.35 });
let HALO = null;
function haloTex() {
  if (HALO) return HALO;
  const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'); const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.25, 'rgba(255,255,255,0.55)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128);
  HALO = new THREE.CanvasTexture(c); return HALO;
}
const halo = (color, s) => { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTex(), color, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })); sp.scale.setScalar(s); sp.renderOrder = 12; sp.userData.noHit = true; return sp; };
const term = (it, key, local, dir = V3(0, 1, 0)) => { it.terms = it.terms || {}; it.terms[key] = { item: it, local, dir }; };

// ------------------------------------------------------------------ sources
// a holder of n dry cells (1.5 V each), leads at the two ends
export function cellPack(n = 4, o = {}) {
  const V = n * 1.5; const it = new Item('cells', { ...o, name: { en: `Battery: ${n} cells of 1.5 V (${V} V)`, hi: `बैटरी: 1.5 V के ${n} सेल (${V} V)`, hg: `Battery: 1.5 V ke ${n} cells (${V} V)` } });
  const W = n * 0.0152 + 0.004, L = 0.058;
  const box = new THREE.Mesh(new THREE.BoxGeometry(W, 0.009, L), new THREE.MeshStandardMaterial({ color: 0x1b1d20, roughness: 0.6 })); box.position.y = 0.0045; it.g.add(box);
  const lab = canvasTex(256, 128, (x, w, h) => { x.fillStyle = '#1e7a3c'; x.fillRect(0, 0, w, h); x.fillStyle = '#111'; x.fillRect(0, 0, w, h * 0.22); x.fillRect(0, h * 0.78, w, h * 0.22); x.fillStyle = '#f4f4f0'; x.font = '700 44px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('1.5 V', w / 2, h / 2); });
  const bodyM = new THREE.MeshStandardMaterial({ map: lab, roughness: 0.45, metalness: 0.2 });
  for (let i = 0; i < n; i++) {
    const c = new THREE.Mesh(new THREE.CylinderGeometry(0.0072, 0.0072, 0.05, 20), bodyM); c.rotation.x = Math.PI / 2; c.rotation.y = 0; c.position.set(-W / 2 + 0.002 + 0.0076 + i * 0.0152, 0.0095, 0); it.g.add(c);
    const nub = new THREE.Mesh(new THREE.CylinderGeometry(0.0026, 0.0026, 0.0018, 12), metal()); nub.rotation.x = Math.PI / 2; nub.position.set(c.position.x, 0.0095, (i % 2 ? -1 : 1) * 0.0259); it.g.add(nub);
  }
  const red = new THREE.Mesh(new THREE.SphereGeometry(0.0022, 10, 8), new THREE.MeshStandardMaterial({ color: 0xc62828 })); red.position.set(W / 2 + 0.001, 0.006, 0.02); it.g.add(red);
  const blk = new THREE.Mesh(new THREE.SphereGeometry(0.0022, 10, 8), new THREE.MeshStandardMaterial({ color: 0x222222 })); blk.position.set(-W / 2 - 0.001, 0.006, 0.02); it.g.add(blk);
  term(it, '+', V3(W / 2 + 0.002, 0.006, 0.02), V3(1, 0.2, 0)); term(it, '-', V3(-W / 2 - 0.002, 0.006, 0.02), V3(-1, 0.2, 0));
  it.volts = V; it.height = 0.017; it.radius = Math.max(W, L) / 2; it.grabY = 0.008; return it;
}
// a 9 V battery standing up, its two snap terminals on top (they work as electrodes when it stands in water)
export function battery9V(o = {}) {
  const it = new Item('bat9', { ...o, name: { en: '9 V battery', hi: '9 V बैटरी', hg: '9 V battery' } });
  const W = 0.0265, D = 0.0175, H = 0.0485;
  const face = canvasTex(256, 512, (x, w, h) => { x.fillStyle = '#1d2a44'; x.fillRect(0, 0, w, h); x.fillStyle = '#c9a43a'; x.fillRect(0, 0, w, h * 0.28); x.fillStyle = '#ffffff'; x.font = '800 150px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('9V', w / 2, h * 0.6); x.font = '600 34px sans-serif'; x.fillStyle = '#1d2a44'; x.fillText('+       −', w / 2, h * 0.14); x.fillStyle = '#9fb0d0'; x.font = '500 30px sans-serif'; x.fillText('ALKALINE', w / 2, h * 0.86); });
  const side = new THREE.MeshStandardMaterial({ color: 0x1d2a44, roughness: 0.5, metalness: 0.3 }); const top = metal(0xb8bcc2, 0.35); const f = new THREE.MeshStandardMaterial({ map: face, roughness: 0.45, metalness: 0.25 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(W, H, D), [side, side, top, top, f, f]); body.position.y = H / 2; it.g.add(body);
  const pM = metal(0xd2d6da, 0.25); const plus = new THREE.Mesh(new THREE.CylinderGeometry(0.0029, 0.0029, 0.0035, 16), pM); plus.position.set(0.0064, H + 0.00175, 0); it.g.add(plus);
  const minus = new THREE.Mesh(new THREE.CylinderGeometry(0.0042, 0.0042, 0.0035, 6, 1, true), metal(0xd2d6da, 0.25)); minus.position.set(-0.0064, H + 0.00175, 0); it.g.add(minus);
  it.tipsP = [V3(0.0064, H + 0.003, 0), V3(0.0064, H + 0.0015, 0.002)]; it.tipsN = [V3(-0.0064, H + 0.003, 0), V3(-0.0064, H + 0.0015, 0.003)];
  term(it, '+', V3(0.0064, H + 0.0035, 0)); term(it, '-', V3(-0.0064, H + 0.0035, 0));
  it.selfEnds = true; it.volts = 9; it.plusMat = pM; it.corr = 0;
  it.setCorr = (k) => { it.corr = k; pM.color.setHex(0xd2d6da).lerp(new THREE.Color(0x6f6a4a), Math.min(1, k)); pM.roughness = 0.25 + 0.6 * k; };
  it.height = H + 0.0035; it.radius = 0.016; it.grabY = H * 0.5; return it;
}

// ------------------------------------------------------------------ lamps and a switch
export function bulb(o = {}) {
  const it = new Item('bulb', { ...o, name: { en: 'Torch bulb in a holder', hi: 'होल्डर में टॉर्च का बल्ब', hg: 'Holder mein torch bulb' } });
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.01, 0.03), new THREE.MeshStandardMaterial({ map: woodTex('#8a5a33'), roughness: 0.7 })); base.position.y = 0.005; it.g.add(base);
  const sock = new THREE.Mesh(new THREE.CylinderGeometry(0.0058, 0.0058, 0.012, 20), metal(0xb0b4b8, 0.4)); sock.position.y = 0.016; it.g.add(sock);
  const glass = new THREE.Mesh(new THREE.SphereGeometry(0.0088, 24, 16), glassMat({ opacity: 0.28 })); glass.position.y = 0.0305; glass.renderOrder = 7; it.g.add(glass);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.0045, 0.0055, 0.004, 16), glassMat({ opacity: 0.28 })); neck.position.y = 0.023; neck.renderOrder = 7; it.g.add(neck);
  const fM = new THREE.MeshStandardMaterial({ color: 0x3a2a20, emissive: 0xffd9a0, emissiveIntensity: 0, roughness: 0.5 });
  const fil = new THREE.Mesh(new THREE.TorusGeometry(0.0022, 0.00035, 6, 18, Math.PI), fM); fil.position.y = 0.031; it.g.add(fil);
  for (const s of [-1, 1]) { const post = new THREE.Mesh(new THREE.CylinderGeometry(0.00025, 0.00025, 0.009, 4), metal(0x888888)); post.position.set(s * 0.0022, 0.0265, 0); it.g.add(post); }
  for (const s of [-1, 1]) { const sc = new THREE.Mesh(new THREE.CylinderGeometry(0.0022, 0.0022, 0.002, 12), brass()); sc.position.set(s * 0.015, 0.011, 0.006); it.g.add(sc); }
  const glow = new THREE.Mesh(new THREE.SphereGeometry(0.0083, 20, 14), new THREE.MeshBasicMaterial({ color: 0xffe2a8, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })); glow.position.y = 0.0305; glow.renderOrder = 8; glow.userData.noHit = true; it.g.add(glow);
  const h = halo(0xffd890, 0.09); h.position.y = 0.031; it.g.add(h);
  const L = new THREE.PointLight(0xffd18a, 0, 0.9, 2); L.position.y = 0.032; it.g.add(L);
  term(it, 'a', V3(-0.015, 0.012, 0.006)); term(it, 'b', V3(0.015, 0.012, 0.006));
  it.glowK = 0; it.setGlow = (b) => { it.glowK = b; fM.emissiveIntensity = b * 5; fM.emissive.setHex(0xff7a20).lerp(new THREE.Color(0xfff2d0), Math.min(1, b * 1.3)); glow.material.opacity = Math.min(0.75, b * 0.9); h.material.opacity = Math.min(0.9, b); h.scale.setScalar(0.04 + 0.08 * b); L.intensity = b * 0.09; };
  it.height = 0.04; it.radius = 0.025; it.grabY = 0.02; return it;
}
export function led(o = {}) {
  const it = new Item('led', { ...o, name: { en: 'LED in a holder', hi: 'होल्डर में LED', hg: 'Holder mein LED' } });
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.034, 0.008, 0.024), new THREE.MeshStandardMaterial({ map: woodTex('#8a5a33'), roughness: 0.7 })); base.position.y = 0.004; it.g.add(base);
  const eM = new THREE.MeshPhysicalMaterial({ color: 0xd8262a, roughness: 0.15, transmission: 0.2, transparent: true, opacity: 0.85, emissive: 0xff2020, emissiveIntensity: 0 });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.0026, 0.0028, 0.0045, 20), eM); body.position.y = 0.0225; it.g.add(body);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.0026, 20, 10, 0, 6.29, 0, Math.PI / 2), eM); dome.position.y = 0.02475; it.g.add(dome);
  const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.0031, 0.0031, 0.0008, 20), eM); rim.position.y = 0.0202; it.g.add(rim);
  for (const s of [-1, 1]) { const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.0003, 0.0003, 0.012 + (s > 0 ? 0.002 : 0), 4), metal(0xb8bcc0)); leg.position.set(s * 0.0013, 0.014, 0); it.g.add(leg); }
  for (const s of [-1, 1]) { const sc = new THREE.Mesh(new THREE.CylinderGeometry(0.0022, 0.0022, 0.002, 12), brass()); sc.position.set(s * 0.012, 0.009, 0.005); it.g.add(sc); }
  const h = halo(0xff3030, 0.05); h.position.y = 0.024; it.g.add(h);
  const L = new THREE.PointLight(0xff3030, 0, 0.5, 2); L.position.y = 0.026; it.g.add(L);
  term(it, 'a', V3(-0.012, 0.01, 0.005)); term(it, 'b', V3(0.012, 0.01, 0.005));
  it.glowK = 0; it.setGlow = (b) => { it.glowK = b; eM.emissiveIntensity = b * 3; h.material.opacity = Math.min(0.95, b * 1.1); h.scale.setScalar(0.02 + 0.05 * b); L.intensity = b * 0.04; };
  it.height = 0.028; it.radius = 0.02; it.grabY = 0.012; return it;
}
export function plugKey(o = {}) {
  const it = new Item('key', { ...o, name: { en: 'Switch (key)', hi: 'स्विच (कुंजी)', hg: 'Switch (key)' } });
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.052, 0.007, 0.026), new THREE.MeshStandardMaterial({ color: 0x2b2f35, roughness: 0.6 })); base.position.y = 0.0035; it.g.add(base);
  for (const s of [-1, 1]) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.008, 0.012), brass()); b.position.set(s * 0.013, 0.011, 0); it.g.add(b); }
  const piv = new THREE.Group(); piv.position.set(-0.013, 0.0155, 0); it.g.add(piv);
  const lever = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.0025, 0.005), brass()); lever.position.x = 0.015; piv.add(lever);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.0035, 12, 8), new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.4 })); knob.position.set(0.031, 0.002, 0); piv.add(knob);
  term(it, 'a', V3(-0.022, 0.009, 0.006), V3(-1, 0.3, 0)); term(it, 'b', V3(0.022, 0.009, 0.006), V3(1, 0.3, 0));
  it.on = false; it.ang = 0.75; piv.rotation.z = 0.75;
  it.setOn = (on) => { it.on = on; };
  it.update = (dt) => { const target = it.on ? 0 : 0.75; it.ang += (target - it.ang) * Math.min(1, dt * 14); piv.rotation.z = it.ang; };
  it.height = 0.02; it.radius = 0.03; it.grabY = 0.01; return it;
}

// ------------------------------------------------------------------ wires: a soft cable from one terminal to another that follows both ends
export class Wire {
  constructor(scene, color, a, b, o = {}) {
    this.a = a; this.b = b; this.r = o.r ?? 0.0011; this.sag = o.sag ?? 0.35;
    this.mesh = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshStandardMaterial({ color, roughness: 0.5 })); this.mesh.castShadow = true; this.mesh.userData.noHit = true; scene.add(this.mesh);
    this.clips = [a, b].map(() => { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.0016, 0.0012, 0.006, 8), metal(0xb8bcc0, 0.35)); c.userData.noHit = true; scene.add(c); return c; });
    this.last = [new THREE.Vector3(1e9, 0, 0), new THREE.Vector3(1e9, 0, 0)];
  }
  end(e) { const p = e.item.g.localToWorld(e.local.clone()); const q = e.item.g.getWorldQuaternion(tmpQ); const d = e.dir.clone().applyQuaternion(q).normalize(); return [p, d]; }
  update() {
    const [pa, da] = this.end(this.a), [pb, db] = this.end(this.b);
    if (pa.distanceTo(this.last[0]) < 2e-4 && pb.distanceTo(this.last[1]) < 2e-4) return;
    this.last[0].copy(pa); this.last[1].copy(pb);
    const L = pa.distanceTo(pb); const out = Math.min(0.03, 0.012 + L * 0.05);
    const a1 = pa.clone().addScaledVector(da, out), b1 = pb.clone().addScaledVector(db, out);
    const mid = a1.clone().lerp(b1, 0.5); mid.y = Math.min(a1.y, b1.y) - L * this.sag * 0.35;
    const floor = BENCH_Y + this.r + 0.0004; const pts = [pa, a1, mid, b1, pb].map((p, i) => (i === 0 || i === 4 ? p : p.setY(Math.max(floor, p.y))));
    const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
    this.mesh.geometry.dispose(); this.mesh.geometry = new THREE.TubeGeometry(curve, 40, this.r, 6, false);
    this.clips[0].position.copy(pa).addScaledVector(da, 0.002); this.clips[0].quaternion.setFromUnitVectors(V3(0, 1, 0), da);
    this.clips[1].position.copy(pb).addScaledVector(db, 0.002); this.clips[1].quaternion.setFromUnitVectors(V3(0, 1, 0), db);
  }
  remove() { for (const m of [this.mesh, ...this.clips]) m.parent && m.parent.remove(m); }
}

// ------------------------------------------------------------------ the free ends and electrodes
export function probe(color, o = {}) { // the bare end of a tester wire
  const it = new Item('probe', { ...o, name: o.name || { en: 'Free end of the tester wire', hi: 'टेस्टर के तार का खुला सिरा', hg: 'Tester ke taar ka khula sira' } });
  const ins = new THREE.Mesh(new THREE.CylinderGeometry(0.0014, 0.0014, 0.06, 10), new THREE.MeshStandardMaterial({ color, roughness: 0.5 })); ins.position.y = 0.042; it.g.add(ins);
  const cu = new THREE.Mesh(new THREE.CylinderGeometry(0.0008, 0.0008, 0.0125, 8), metal(0xd08a5a, 0.3)); cu.position.y = 0.006; it.g.add(cu);
  it.tips = [V3(0, 0.0006, 0), V3(0, 0.004, 0)]; term(it, 'w', V3(0, 0.072, 0)); it.tipLocal = V3(0, 0.0006, 0);
  it.height = 0.072; it.radius = 0.004; it.grabY = 0.05; return it;
}
// two electrodes held together: iron nails standing up from a cork (put inside a beaker), or carbon rods hanging from a card
export function electrodePair(kind = 'nail', o = {}) {
  const up = kind === 'nail'; const it = new Item('epair', { ...o, name: o.name || (up ? { en: 'Cork with two iron nails', hi: 'दो लोहे की कीलों वाला कॉर्क', hg: 'Do iron keelon wala cork' } : { en: 'Two carbon electrodes fixed in a card', hi: 'कार्ड में लगे दो कार्बन इलेक्ट्रोड', hg: 'Card mein lage do carbon electrodes' }) });
  const dx = o.dx ?? (up ? 0.0075 : 0.008); it.tipsA = []; it.tipsB = [];
  if (up) {
    const cork = new THREE.Mesh(new THREE.CylinderGeometry(0.0165, 0.0175, 0.012, 24), new THREE.MeshStandardMaterial({ color: 0xb08850, roughness: 0.95 })); cork.position.y = 0.006; it.g.add(cork);
    const nm = metal(0x8d9196, 0.4); it.nailMat = nm;
    for (const s of [-1, 1]) {
      const sh = new THREE.Mesh(new THREE.CylinderGeometry(0.0016, 0.0016, 0.052, 10), nm); sh.position.set(s * dx, 0.034, 0); it.g.add(sh);
      const hd = new THREE.Mesh(new THREE.CylinderGeometry(0.0038, 0.0038, 0.0015, 14), nm); hd.position.set(s * dx, 0.0605, 0); it.g.add(hd);
      for (let y = 0.016; y <= 0.056; y += 0.008) (s < 0 ? it.tipsA : it.tipsB).push(V3(s * dx, y, 0));
    }
    term(it, 'a', V3(-dx, 0.061, 0)); term(it, 'b', V3(dx, 0.061, 0)); it.height = 0.062; it.radius = 0.018; it.grabY = 0.03;
  } else {
    const card = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.002, 0.034), new THREE.MeshStandardMaterial({ color: 0xb59468, roughness: 1 })); card.position.y = 0.046; it.g.add(card);
    const cm = new THREE.MeshStandardMaterial({ color: 0x2d2e31, roughness: 0.55, metalness: 0.35 });
    for (const s of [-1, 1]) {
      const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.0022, 0.0022, 0.058, 12), cm); rod.position.set(s * dx, 0.029, 0); it.g.add(rod);
      for (let y = 0.001; y <= 0.022; y += 0.007) (s < 0 ? it.tipsA : it.tipsB).push(V3(s * dx, y, 0));
    }
    term(it, 'a', V3(-dx, 0.058, 0)); term(it, 'b', V3(dx, 0.058, 0)); it.cardY = 0.046; it.height = 0.058; it.radius = 0.026; it.grabY = 0.046;
  }
  it.kindE = kind; return it;
}
export function copperPlate(o = {}) {
  const it = new Item('cuplate', { ...o, name: o.name || { en: 'Copper plate', hi: 'ताँबे की प्लेट', hg: 'Copper (taambe) ki plate' } });
  const W = 0.024, H = 0.085, T = 0.0012;
  const mat = new THREE.MeshStandardMaterial({ color: 0x7d5038, metalness: 0.7, roughness: 0.6 }); const m = new THREE.Mesh(new THREE.BoxGeometry(W, H, T), mat); m.position.y = H / 2; it.g.add(m);
  const dep = new THREE.Mesh(new THREE.BoxGeometry(W + 0.0006, 0.042, T + 0.0008), new THREE.MeshStandardMaterial({ color: 0xb0533a, metalness: 0.25, roughness: 0.92, transparent: true, opacity: 0, depthWrite: false })); dep.position.y = 0.021; dep.renderOrder = 3; dep.userData.noHit = true; it.g.add(dep);
  const pit = canvasTex(128, 256, (x, w, h) => { x.clearRect(0, 0, w, h); for (let i = 0; i < 700; i++) { x.fillStyle = `rgba(${40 + Math.random() * 30},${22 + Math.random() * 15},${12},${0.25 + Math.random() * 0.5})`; const r = 1 + Math.random() * 3; x.beginPath(); x.arc(Math.random() * w, Math.random() * h, r, 0, 7); x.fill(); } });
  const etch = new THREE.Mesh(new THREE.BoxGeometry(W + 0.0004, 0.042, T + 0.0006), new THREE.MeshStandardMaterial({ map: pit, color: 0x6a4030, metalness: 0.5, roughness: 0.85, transparent: true, opacity: 0, depthWrite: false })); etch.position.y = 0.021; etch.renderOrder = 3; etch.userData.noHit = true; it.g.add(etch);
  const clip = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.008, 0.004), metal(0x9aa0a6, 0.35)); clip.position.y = H + 0.002; it.g.add(clip);
  term(it, 'w', V3(0, H + 0.006, 0));
  it.tips = []; for (const y of [0.008, 0.022, 0.036, 0.05]) for (const x of [-0.008, 0, 0.008]) it.tips.push(V3(x, y, 0));
  it.metal = true; it.S = { shine: 0xd99066 }; it.mat = mat; it.coat = 0; it.etch = 0;
  it.setCoat = (k) => { it.coat = k; dep.material.opacity = Math.min(0.97, k * 1.1); };
  it.setEtch = (k) => { it.etch = k; etch.material.opacity = Math.min(0.85, k * 0.95); m.scale.z = 1 - 0.3 * k; };
  it.layH = 0.0006; it.height = H; it.radius = 0.014; it.grabY = H - 0.01; return it;
}
export function cardLid(o = {}) { // a strip of cardboard across a beaker, with two slits for the plates
  const it = new Item('cardlid', { ...o, name: { en: 'Cardboard lid with two slits', hi: 'दो झिरियों वाला गत्ते का ढक्कन', hg: 'Do slits wala gatte ka dhakkan' } });
  const t = canvasTex(256, 96, (x, w, h) => { x.fillStyle = '#b8946a'; x.fillRect(0, 0, w, h); for (let i = 0; i < 1500; i++) { x.fillStyle = `rgba(90,60,30,${Math.random() * 0.12})`; x.fillRect(Math.random() * w, Math.random() * h, 2, 1); } x.fillStyle = '#3a2a1a'; x.fillRect(w * 0.27, h * 0.25, 4, h * 0.5); x.fillRect(w * 0.73 - 4, h * 0.25, 4, h * 0.5); });
  const m = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.002, 0.034), new THREE.MeshStandardMaterial({ map: t, roughness: 1 })); m.position.y = 0.001; it.g.add(m);
  it.slitX = 0.0205; it.height = 0.002; it.radius = 0.045; it.grabY = 0.001; return it;
}
// a plastic mug with two carbon electrodes fitted through rubber stoppers in its base, standing on a little stand
export function mug(o = {}) {
  const prof = [[0, 0], [0.037, 0], [0.039, 0.003], [0.044, 0.09], [0.046, 0.092]];
  const pm = new THREE.MeshPhysicalMaterial({ color: 0xeef3f6, roughness: 0.35, transparent: true, opacity: 0.32, side: THREE.DoubleSide, depthWrite: false });
  const v = new Vessel('mug', prof, { ...o, wall: 0.002, glassMat: pm, name: o.name || { en: 'Plastic mug with carbon electrodes', hi: 'कार्बन इलेक्ट्रोड वाला प्लास्टिक का मग', hg: 'Carbon electrodes wala plastic mug' }, cap: 500 });
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.018, 0.004, 8, 20, Math.PI), pm); handle.rotation.z = -Math.PI / 2; handle.position.set(0.046, 0.05, 0); v.g.add(handle);
  const cm = new THREE.MeshStandardMaterial({ color: 0x2b2c30, roughness: 0.55, metalness: 0.35 }); const rub = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9 });
  v.tipsA = []; v.tipsB = []; const dx = 0.016;
  for (const s of [-1, 1]) {
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.0032, 0.0032, 0.052, 14), cm); rod.position.set(s * dx, 0.026, 0); v.g.add(rod);
    const st = new THREE.Mesh(new THREE.CylinderGeometry(0.0055, 0.0045, 0.01, 14), rub); st.position.set(s * dx, 0.001, 0); v.g.add(st);
    for (let y = 0.01; y <= 0.05; y += 0.008) (s < 0 ? v.tipsA : v.tipsB).push(V3(s * dx, y, 0));
  }
  term(v, 'a', V3(-dx, -0.004, 0), V3(-0.4, -1, 0)); term(v, 'b', V3(dx, -0.004, 0), V3(0.4, -1, 0));
  v.elX = dx; v.grabY = 0.05; return v;
}
export function stand(h = 0.032, o = {}) { // two wooden blocks that lift the mug so the wires can come out below
  const it = new Item('stand', { ...o, name: { en: 'Wooden stand', hi: 'लकड़ी का स्टैंड', hg: 'Lakdi ka stand' } });
  const m = new THREE.MeshStandardMaterial({ map: woodTex('#7a5232'), roughness: 0.7 });
  for (const s of [-1, 1]) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.02, h, 0.08), m); b.position.set(s * 0.034, h / 2, 0); it.g.add(b); }
  it.top = h; it.height = h; it.radius = 0.05; it.grabY = h * 0.5; return it;
}

// ------------------------------------------------------------------ test tube that collects gas upside down (closed end at the top)
export function gasTube(o = {}) {
  const r = o.r ?? 0.0055, h = o.h ?? 0.075, w = 0.0007, ri = r - w;
  const it = new Item('gtube', { ...o, name: o.name || { en: 'Test tube', hi: 'परखनली', hg: 'Test tube' } });
  const pts = [V2(r + 0.0006, 0), V2(r, 0.0012), V2(r, h - r)]; for (let i = 1; i <= 10; i++) { const a = (i / 10) * Math.PI / 2; pts.push(V2(Math.max(0.0001, Math.cos(a) * r), h - r + Math.sin(a) * r)); }
  const glass = new THREE.Mesh(new THREE.LatheGeometry(pts, 28), glassMat({ opacity: 0.22 })); glass.renderOrder = 6; it.g.add(glass);
  const wM = new THREE.MeshPhysicalMaterial({ color: 0xcfe6fb, roughness: 0.05, transparent: true, opacity: 0.38, depthWrite: false });
  const col = new THREE.Mesh(new THREE.CylinderGeometry(ri, ri, 1, 20, 1, true), wM); col.renderOrder = 5; col.userData.noHit = true; it.g.add(col);
  const top = new THREE.Mesh(new THREE.CircleGeometry(ri, 20), new THREE.MeshPhysicalMaterial({ color: 0xd4ecff, roughness: 0.05, transparent: true, opacity: 0.85, depthWrite: false, side: THREE.DoubleSide })); top.rotation.x = -Math.PI / 2; top.renderOrder = 5; top.userData.noHit = true; it.g.add(top);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(ri, 16, 8, 0, 6.29, 0, Math.PI / 2), wM); dome.position.y = h - r; dome.renderOrder = 5; dome.userData.noHit = true; it.g.add(dome);
  // little bubbles rising inside the tube
  const NB = 24; const bub = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 8, 6), new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.05, transparent: true, opacity: 0.55, depthWrite: false }), NB); bub.count = 0; bub.userData.noHit = true; bub.renderOrder = 6; it.g.add(bub);
  const B = []; const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), S = new THREE.Vector3();
  it.r = r; it.ri = ri; it.h = h; it.full = false; it.gas = {}; it.water = 0; it.feed = 0; it.cylMl = Math.PI * ri * ri * (h - r) * 1e6;
  it.gasMl = () => Object.values(it.gas).reduce((a, b) => a + b, 0);
  it.mainGas = () => { let k = null, m = 0; for (const g in it.gas) if (it.gas[g] > m) { m = it.gas[g]; k = g; } return k; };
  it.addGas = (g, ml) => { it.gas[g] = (it.gas[g] || 0) + ml; it.feed = 0.25; };
  it.fill = () => { it.full = true; it.water = 1; it.gas = {}; it.drained = false; };
  it.mouthWorld = (out = new THREE.Vector3()) => it.g.localToWorld(out.set(0, 0, 0));
  it.update = (dt) => {
    // water level: the gas pushes the water down from the closed end
    const gasLen = Math.min(h - 0.003, (it.gasMl() * 1e-6) / (Math.PI * ri * ri));
    const down = it.worldUp().y > 0.7; let inLiq = false;
    if (it.lab && it.full) { const m = it.mouthWorld(tmp); for (const v of it.lab.vessels) { if (v.ml < 0.3) continue; const q = v.g.worldToLocal(tmp2.copy(m)); if (q.y > v.inner[0].y - 0.003 && q.y < v.heightFor(v.ml) && Math.hypot(q.x, q.z) < v.rInner(Math.max(q.y, v.inner[0].y))) { inLiq = true; break; } } }
    if (it.full && down && !inLiq && it.lifted) { it.water = Math.max(0, it.water - dt * 2.5); if (it.water <= 0) { it.full = false; it.drained = true; } } // out of the water, mouth down: the water runs out, the gas stays
    const wTop = it.full || it.water > 0 ? (h - 0.0012 - gasLen) * (it.full ? 1 : it.water) : 0;
    col.visible = wTop > 0.001; col.scale.set(1, Math.max(0.001, Math.min(wTop, h - r)), 1); col.position.y = Math.min(wTop, h - r) / 2;
    dome.visible = it.full && wTop > h - r + 0.0005 && gasLen < 0.0008; top.visible = col.visible && !dome.visible; top.position.y = Math.min(wTop, h - 0.0015);
    if (!down && it.full) { col.visible = true; } // carried mouth up while being filled
    // bubbles
    if (it.feed > 0) { it.feed -= dt; if (B.length < NB && Math.random() < dt * 30) B.push({ x: (Math.random() - 0.5) * ri * 1.2, z: (Math.random() - 0.5) * ri * 1.2, y: 0.002, s: 0.0005 + Math.random() * 0.0005, v: 0.03 + Math.random() * 0.03 }); }
    let n = 0; for (let i = B.length - 1; i >= 0; i--) { const b = B[i]; b.y += b.v * dt; if (b.y > wTop - 0.001) { B.splice(i, 1); continue; } M.compose(S.set(b.x, b.y, b.z), Q, tmp.setScalar(b.s)); bub.setMatrixAt(n++, M); }
    bub.count = n; bub.instanceMatrix.needsUpdate = true;
  };
  it.layH = r; it.height = h; it.radius = r; it.grabY = h * 0.6; return it;
}

// ------------------------------------------------------------------ spatula for flame tests: the salt colours the flame
const FLAME_COL = { salt: [0xffa000, 0xffd640, 1.0], kis: [0x9b6dff, 0xd9b8ff, 0.55], bacl2s: [0x7fe04a, 0xc6ff8a, 0.75], cuso4d: [0x2fd6b0, 0x8affea, 0.8], cacl2: [0xff4a1a, 0xff9a5a, 0.85] };
export function flameSpatula(o = {}) {
  const it = new Item('fspat', { ...o, name: { en: 'Metal spatula', hi: 'धातु का स्पैचुला', hg: 'Metal spatula' } });
  const m = metal(0xbfc3c7, 0.28);
  const s = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.13, 0.0012), m); s.position.y = 0.075; it.g.add(s);
  const bl = new THREE.Mesh(new THREE.BoxGeometry(0.009, 0.02, 0.0012), m); bl.position.y = 0.01; it.g.add(bl);
  const hdl = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.05, 10), new THREE.MeshStandardMaterial({ map: woodTex('#7a4f2a'), roughness: 0.6 })); hdl.position.y = 0.15; it.g.add(hdl);
  const sM = new THREE.MeshStandardMaterial({ color: 0xf6f6f2, roughness: 0.9 });
  const heapM = new THREE.Mesh(new THREE.SphereGeometry(0.0035, 12, 8, 0, 6.29, 0, Math.PI / 2), sM); heapM.scale.set(1, 0.6, 0.5); heapM.position.set(0, 0.006, 0.0008); heapM.rotation.x = Math.PI / 2; heapM.visible = false; it.g.add(heapM);
  const fl = flame('spirit'); fl.scale.set(1.15, 1.6, 1.15); fl.position.set(0, -0.004, 0); fl.visible = false; it.g.add(fl);
  const hl = halo(0xffc040, 0.1); hl.position.y = 0.03; it.g.add(hl);
  it.tipLocal = V3(0, 0.006, 0); it.heat = 0; it.salt = null; it.melt = 0;
  it.load = (chem) => { it.salt = chem; it.melt = 0; heapM.visible = true; sM.color.setHex(SOLIDS[chem]?.color ?? 0xf6f6f2); sM.roughness = 0.9; heapM.scale.set(1, 0.6, 0.5); const c = FLAME_COL[chem] || [0xff9a30, 0xffd080, 0.6]; fl.traverse((q) => { if (q.material?.uniforms) { q.material.uniforms.c1.value.setHex(c[0]); q.material.uniforms.c2.value.setHex(c[1]); } }); hl.material.color.setHex(c[0]); it.fk = c[2]; it.reported = false; };
  it.clean = () => { it.salt = null; heapM.visible = false; it.heat = 0; };
  it.flameTest = (dt, f, hp) => { if (f.kind !== 'bunsen' && f.kind !== 'lamp') return; const tip = it.g.localToWorld(tmp.copy(it.tipLocal)); if (tip.distanceTo(hp) < 0.03) it.inFlame = 0.2; };
  it.update = (dt, t) => {
    if (it.inFlame > 0) { it.inFlame -= dt; it.heat = Math.min(1, it.heat + dt * 0.9); } else it.heat = Math.max(0, it.heat - dt * 0.6);
    const on = it.salt && it.heat > 0.25; fl.visible = on; hl.material.opacity = on ? 0.55 * it.fk * it.heat : 0;
    if (on) { fl.userData.tick(t); fl.scale.set(1.5, 2.1 * (0.7 + 0.3 * it.heat), 1.5); it.g.updateWorldMatrix(true, false); const tw = it.g.localToWorld(tmp.copy(it.tipLocal)); tw.y -= 0.03; fl.position.copy(it.g.worldToLocal(tw)); fl.quaternion.copy(it.g.getWorldQuaternion(tmpQ).invert()); hl.position.copy(it.g.worldToLocal(tw.add(V3(0, 0.05, 0)))); fl.traverse((q) => { if (q.material?.uniforms) q.material.uniforms.op.value = 0.9 * it.fk; }); // the coloured flame rises straight up through the spatula tip
      if (Math.random() < dt * 3 && it.heat < 0.9) it.lab?.audio?.crackle?.();
      if (it.salt === 'kis') { it.melt = Math.min(1, it.melt + dt * 0.25); sM.roughness = 0.9 - 0.8 * it.melt; heapM.scale.set(1 - 0.2 * it.melt, 0.6 - 0.3 * it.melt, 0.5); }
      if (it.heat > 0.7 && !it.reported) { it.reported = true; it.lab && it.lab.emit('flame_colour', { obj: it.id, salt: it.salt }); } }
  };
  it.height = 0.175; it.radius = 0.006; it.grabY = 0.15; return it;
}

// ------------------------------------------------------------------ extra samples for the tester (pencil lead etc.)
export function graphite(o = {}) {
  const it = new Item('sample', { ...o, name: { en: 'Pencil lead (graphite)', hi: 'पेंसिल का लेड (ग्रेफ़ाइट)', hg: 'Pencil ka lead (graphite)' } });
  const m = new THREE.Mesh(new THREE.CylinderGeometry(0.0011, 0.0011, 0.05, 10), new THREE.MeshStandardMaterial({ color: 0x3c3d42, metalness: 0.55, roughness: 0.35 })); m.rotation.z = Math.PI / 2; m.position.y = 0.0011; it.g.add(m);
  it.sample = 'graphite'; it.metal = false; it.touchAt = V3(0, 0.0011, 0); it.touchDx = 0.012; it.height = 0.0015; it.radius = 0.026; it.touchR = 0.026; it.cond = 0.15; return it;
}
export function whiteTile(w = 0.4, d = 0.09, o = {}) {
  const it = new Item('tile', { ...o, name: { en: 'White tile', hi: 'सफ़ेद टाइल', hg: 'White tile' } });
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.006, d), new THREE.MeshStandardMaterial({ color: 0xf4f3ee, roughness: 0.3 })); m.position.y = 0.003; it.g.add(m);
  it.top = 0.006; it.height = 0.006; it.radius = w / 2; it.grabY = 0.003; return it;
}

// ------------------------------------------------------------------ the circuit
// ends[0] is joined (through the lamp) to the + terminal, ends[1] to the − terminal. Each end: { item, tips: [local points] }.
export class Circuit extends Item {
  constructor(spec) {
    super('circuit', { name: { en: 'Circuit', hi: 'परिपथ', hg: 'Circuit' } });
    Object.assign(this, { src: spec.source, lamp: spec.lamp || null, sw: spec.key || null, ends: spec.ends, wires: [] });
    this.G = 0; this.I = 0; this.bright = 0; this.cKey = null; this.stable = 0; this.rep = false; this.height = 0.001; this.radius = 0.001;
  }
  world(end) { return end.tips.map((p) => end.item.g.localToWorld(p.clone())); }
  inVessel(pts) {
    for (const v of this.lab.vessels) { if (v.ml < 0.3) continue; let n = 0; for (const p of pts) { const q = v.g.worldToLocal(tmp.copy(p)); if (q.y > v.inner[0].y && q.y < v.heightFor(v.ml) && Math.hypot(q.x, q.z) < v.rInner(q.y)) n++; } if (n > 0) return [v, n / pts.length]; }
    return [null, 0];
  }
  update(dt) {
    const lab = this.lab; if (!lab) return; for (const w of this.wires) w.update();
    const closed = !this.sw || this.sw.on; if (closed !== this.lastClosed) { this.keyN = (this.keyN || 0) + 1; this.lastClosed = closed; } const [A, B] = this.ends; const ta = this.world(A), tb = this.world(B);
    let G = 0, contact = null, v = null;
    let dmin = 1; if (A.item !== B.item) for (const p of ta) for (const q of tb) dmin = Math.min(dmin, p.distanceTo(q));
    if (dmin < 0.004) { G = 100; contact = this; }
    else {
      const [va, wa] = this.inVessel(ta), [vb, wb] = this.inVessel(tb);
      if (va && va === vb) { v = va; G = conductance(va.mix) * (0.6 + 0.4 * (wa + wb) / 2); contact = va; }
      else {
        for (const it of lab.items) {
          const cond = it.cond ?? (it.chem && SOLIDS[it.chem] ? (SOLIDS[it.chem].cond ?? 0) : null); if (cond == null || it.inVessel) continue;
          const c = it.touchAt ? it.g.localToWorld(tmp2.copy(it.touchAt)) : it.g.getWorldPosition(tmp2); const r = (it.touchR ?? it.radius ?? 0.01) + 0.003;
          const near = (pts) => pts.some((p) => Math.hypot(p.x - c.x, p.z - c.z) < r && p.y - c.y < (it.height ?? 0.01) + 0.006 && p.y > c.y - 0.004);
          if (near(ta) && near(tb)) { G = cond; contact = it; break; }
        }
      }
    }
    const Ge = closed ? G : 0; const vf = (this.src?.volts ?? 6) / 6; const isLed = this.lamp?.kind === 'led';
    const lampK = this.lamp ? (isLed ? 0.004 : 0.08) : 0.004; const k = Ge / (Ge + lampK);
    this.G = Ge; this.I = k * vf * (isLed ? 0.06 : 1);
    const target = !this.lamp ? 0 : isLed ? Math.min(1, k * 1.1) * Math.min(1, vf * 1.3) : Math.max(0, Math.min(1, (k - 0.1) / 0.8)) * Math.min(1, vf * 1.1);
    this.bright += (target - this.bright) * Math.min(1, dt * 10); this.lamp && this.lamp.setGlow(this.bright);
    if (v && Ge > 0) this.electro(v, dt, ta, tb);
    if (this.src?.selfEnds && v && this.ends[0].item === this.src) this.src.setCorr(Math.min(0.8, this.src.corr + dt * lab.chem.lapse * 0.0006));
    // tell the lesson once the contact has stayed the same for a moment
    const key = contact && closed ? contact.id + ':' + (this.sw ? this.keyN || 0 : 0) : null;
    if (key !== this.cKey) { this.cKey = key; this.stable = 0; this.rep = false; }
    else if (key && !this.rep) { this.stable += dt; if (this.stable > 0.9) { this.rep = true; lab.emit('tested', { v: contact.id, glow: this.bright > 0.06, level: this.bright, G }); } }
  }
  electro(v, dt, ta, tb) {
    const lab = this.lab, lapse = lab.chem.lapse, I = this.I, mix = v.mix; const [A, B] = this.ends;
    if (A.item.kind === 'cuplate' && B.item.kind === 'cuplate' && mix.has('cuso4', 0.05)) { // copper is carried from the + plate to the − plate
      const d = I * dt * lapse * 0.0032; B.item.setCoat(Math.min(1, B.item.coat + d)); A.item.setEtch(Math.min(1, A.item.etch + d * 0.8)); lab.chem.note(v, 'plating', { coat: B.item.coat });
      return;
    }
    if (mix.ml() < 0.3) return;
    const chloride = mix.has('nacl', 0.02) || mix.has('hcl', 0.02);
    const rH = 0.006 * I * lapse, rA = (chloride ? 0.002 : 0.003) * I * lapse;
    this.gasAt(v, tb, 'H2', rH, dt, I); this.gasAt(v, ta, chloride ? 'Cl2' : 'O2', rA, dt, I * 0.5);
    lab.chem.note(v, 'electrolysis', { I });
  }
  gasAt(v, pts, gas, rate, dt, I) {
    const lab = this.lab; const wet = pts.filter((p) => { const q = v.g.worldToLocal(tmp.copy(p)); return q.y < v.heightFor(v.ml) && q.y > v.inner[0].y; }); if (!wet.length) return;
    for (const t of lab.items) {
      if (t.kind !== 'gtube' || !t.full) continue; if (t.worldUp().y < 0.9) continue;
      const m = t.mouthWorld(tmp2); const inside = wet.filter((p) => Math.hypot(p.x - m.x, p.z - m.z) < t.ri && p.y > m.y - 0.006 && p.y < m.y + t.h);
      if (inside.length) { t.addGas(gas, rate * dt * inside.length / wet.length); if (inside.length === wet.length) return; }
    }
    const vis = Math.min(70, 6 + 220 * I);
    lab.fx.bubbles_(v, vis, dt, { from: () => v.g.worldToLocal(wet[Math.floor(Math.random() * wet.length)].clone().add(V3((Math.random() - 0.5) * 0.002, 0, (Math.random() - 0.5) * 0.002))), size: 0.0005 });
  }
}
