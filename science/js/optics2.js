// Physics: more light. A plane mirror strip that really reflects (a live mirror image of the pins and the room), a sheet of
// black paper with a ray box whose narrow beam is seen as a streak on the paper, a glass prism that splits it into a fan of
// colours (each colour bent by its own refractive index) onto a white card, and a steel bowl with a coin that seems to rise
// when water is poured in (the coin is drawn where refraction makes it appear from wherever the eye is).
import * as THREE from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { Item, Vessel } from './apparatus.js';
import { canvasTex, woodTex } from './mats.js';
import * as RF from './refraction.js';

const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const yawOf = (g) => { const e = V3(1, 0, 0).applyQuaternion(g.quaternion); return Math.atan2(-e.z, e.x); }; // turn about the vertical, as an angle on the paper
const steel = (c = 0xc8ccd0, r = 0.25) => new THREE.MeshStandardMaterial({ color: c, metalness: 0.9, roughness: r });

// ------------------------------------------------------------------ a plane mirror strip (8 cm × 3 cm) standing upright in a wooden holder
// its silvered face is at local z = 0, facing +z; the item's origin is the bottom of the silvered face (put it on the mirror line)
export function planeMirror(o = {}) {
  const it = new Item('pmirror', { ...o, name: o.name || { en: 'Plane mirror strip in a holder', hi: 'होल्डर में समतल दर्पण की पट्टी', hg: 'Holder mein plane mirror strip' } });
  const W = 0.08, H = 0.03;
  const back = new THREE.Mesh(new THREE.BoxGeometry(W, H, 0.0025), new THREE.MeshStandardMaterial({ color: 0x5b6168, roughness: 0.6, metalness: 0.3 })); back.position.set(0, H / 2, -0.0013); it.g.add(back);
  const glass = new Reflector(new THREE.PlaneGeometry(W - 0.001, H - 0.001), { textureWidth: 512, textureHeight: 192, color: 0xc9d1d6, clipBias: 0.002 }); glass.position.set(0, H / 2, 0.0001); glass.userData.noHit = true; it.g.add(glass);
  const edge = new THREE.Mesh(new THREE.BoxGeometry(W, H, 0.0006), new THREE.MeshStandardMaterial({ color: 0x9fd8e8, transparent: true, opacity: 0.25, roughness: 0.1 })); edge.position.set(0, H / 2, 0.0004); edge.renderOrder = 6; it.g.add(edge);
  for (const s of [-1, 1]) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.012, 0.022), new THREE.MeshStandardMaterial({ map: woodTex('#9a6a3c'), roughness: 0.7 })); b.position.set(s * (W / 2 - 0.012), 0.006, -0.008); it.g.add(b); }
  it.mirror = glass; it.W = W; it.height = H; it.radius = W / 2; it.grabY = H * 0.6; return it;
}
// ------------------------------------------------------------------ a sheet of black chart paper on the table (paper coordinates as on the drawing board)
export function blackSheet(o = {}) {
  const W = o.w ?? 0.6, H = o.h ?? 0.36;
  const it = new Item('sheet', { ...o, name: o.name || { en: 'Black chart paper', hi: 'काला चार्ट पेपर', hg: 'Black chart paper' } });
  const m = new THREE.Mesh(new THREE.BoxGeometry(W, 0.0008, H), new THREE.MeshStandardMaterial({ color: 0x15171b, roughness: 0.92 })); m.position.y = 0.0004; it.g.add(m);
  it.W = W; it.H = H; it.surfY = 0.0009; it.toLocal = (u, v) => V3(u, it.surfY, -v); it.noGrab = true; it.height = 0.001; it.radius = Math.max(W, H) / 2; it.grabY = 0.0005; return it;
}
// ------------------------------------------------------------------ a ray box: a lamp in a metal box with a narrow vertical slit; the beam leaves along local +x
export function rayBox(o = {}) {
  const it = new Item('raybox', { ...o, name: o.name || { en: 'Ray box (lamp with a narrow slit)', hi: 'किरण बॉक्स (पतली झिरी वाला लैंप)', hg: 'Ray box (patli slit wala lamp)' } });
  const lab = canvasTex(256, 128, (x, w, h) => { x.fillStyle = '#26334a'; x.fillRect(0, 0, w, h); x.fillStyle = '#e8eef6'; x.font = '700 34px sans-serif'; x.textAlign = 'center'; x.fillText('RAY BOX', w / 2, h * 0.45); x.font = '500 22px sans-serif'; x.fillText('12 V · 24 W', w / 2, h * 0.78); });
  const bodyM = new THREE.MeshStandardMaterial({ color: 0x26334a, roughness: 0.45, metalness: 0.5 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.045, 0.05), [bodyM, bodyM, bodyM, bodyM, new THREE.MeshStandardMaterial({ map: lab, roughness: 0.45, metalness: 0.4 }), bodyM]); body.position.y = 0.0225; it.g.add(body);
  const plate = new THREE.Mesh(new THREE.BoxGeometry(0.002, 0.044, 0.048), new THREE.MeshStandardMaterial({ color: 0x111316, roughness: 0.5 })); plate.position.set(0.036, 0.0225, 0); it.g.add(plate);
  const slitM = new THREE.MeshBasicMaterial({ color: 0x3a3a3a }); const slit = new THREE.Mesh(new THREE.PlaneGeometry(0.0012, 0.03), slitM); slit.rotation.y = Math.PI / 2; slit.position.set(0.0372, 0.017, 0); it.g.add(slit);
  const vent = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.004, 0.03), new THREE.MeshStandardMaterial({ color: 0x0f1216, roughness: 0.6 })); vent.position.set(-0.005, 0.047, 0); it.g.add(vent);
  const cable = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V3(-0.035, 0.01, 0), V3(-0.06, 0.004, 0.01), V3(-0.1, 0.002, 0.05), V3(-0.14, 0.002, 0.06)]), 20, 0.0016, 6), new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.6 })); it.g.add(cable);
  const L = new THREE.PointLight(0xfff4d8, 0, 0.25, 2); L.position.set(0.045, 0.02, 0); it.g.add(L);
  it.on = false; it.setOn = (on) => { it.on = on; slitM.color.setHex(on ? 0xfffbea : 0x3a3a3a); L.intensity = on ? 0.05 : 0; };
  it.slitLocal = V3(0.0375, 0.002, 0); it.height = 0.047; it.radius = 0.04; it.grabY = 0.03; return it;
}
// ------------------------------------------------------------------ a white card standing on a foot; it faces local +z; the band of colours is painted on it
export function cardScreen(o = {}) {
  const it = new Item('card', { ...o, name: o.name || { en: 'White screen (card)', hi: 'सफ़ेद पर्दा (कार्ड)', hg: 'White screen (card)' } });
  const W = 0.12, H = 0.075; const c = document.createElement('canvas'); c.width = 384; c.height = 240; const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const front = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.35 }); const side = new THREE.MeshStandardMaterial({ color: 0xe9e6de, roughness: 0.9 });
  const card = new THREE.Mesh(new THREE.BoxGeometry(W, H, 0.0016), [side, side, side, side, front, side]); card.position.y = H / 2 + 0.0004; it.g.add(card);
  const foot = new THREE.Mesh(new THREE.BoxGeometry(W * 0.7, 0.008, 0.03), new THREE.MeshStandardMaterial({ map: woodTex('#8a5a33'), roughness: 0.7 })); foot.position.set(0, 0.004, -0.016); it.g.add(foot);
  it.canvas = c; it.tex = tex; it.W = W; it.H = H;
  it.paint = (fn) => { const x = c.getContext('2d'); x.filter = 'none'; x.fillStyle = '#f2efe8'; x.fillRect(0, 0, c.width, c.height); if (fn) fn(x, c.width, c.height); tex.needsUpdate = true; }; it.paint(null);
  it.height = H; it.radius = W / 2; it.grabY = H * 0.6; return it;
}
// the colours of the spectrum and the refractive index of the prism glass for each (dense glass: the band is easy to see)
export const SPECTRUM = [['#e8231f', 1.613], ['#ff7a12', 1.617], ['#ffe01a', 1.621], ['#33c246', 1.627], ['#1f8cf0', 1.635], ['#3b2fc9', 1.641], ['#8b2fd6', 1.65]];
const rainbowTex = (() => { let t = null; return () => { if (t) return t; t = canvasTex(256, 8, (x, w, h) => { const g = x.createLinearGradient(0, 0, w, 0); SPECTRUM.forEach(([c], i) => g.addColorStop(0.04 + (i / 6) * 0.92, c)); x.fillStyle = g; x.fillRect(0, 0, w, h); }); return t; }; })();
const whiteTex = (() => { let t = null; return () => { if (t) return t; t = canvasTex(64, 8, (x, w, h) => { const g = x.createLinearGradient(0, 0, w, 0); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.3, 'rgba(255,252,240,1)'); g.addColorStop(0.7, 'rgba(255,252,240,1)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h); }); return t; }; })();
// a flat quad on the sheet: corners a0, a1 (start, across the width) and b1, b0 (end); u runs across, v along
function quad(tex, opacity) {
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(12), 3)); g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]), 2)); g.setIndex([0, 1, 2, 0, 2, 3]);
  const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })); m.renderOrder = 9; m.userData.noHit = true; m.frustumCulled = false; m.visible = false;
  m.set = (pts) => { const p = g.attributes.position; pts.forEach((v, i) => p.setXYZ(i, v.x, v.y, v.z)); p.needsUpdate = true; g.computeBoundingSphere(); m.visible = true; };
  return m;
}
// ------------------------------------------------------------------ the solver: every frame, the beam from the slit through the prism (if it is there) to the card
export class Spectrum {
  constructor(scene, sheet, box, prism, card) {
    this.sheet = sheet; this.box = box; this.prism = prism; this.card = card; this.w = 0.004;
    this.inBeam = quad(whiteTex(), 0.85); this.glassFan = quad(rainbowTex(), 0.35); this.fan = quad(rainbowTex(), 0.95); scene.add(this.inBeam, this.glassFan, this.fan); this.meshes = [this.inBeam, this.glassFan, this.fan];
    this._key = '';
  }
  P(u, v, lift = 0.0006) { const w = this.sheet.g.localToWorld(this.sheet.toLocal(u, v)); w.y += lift; return w; }
  uv(world) { const l = this.sheet.g.worldToLocal(world.clone()); return [l.x, -l.z]; }
  update() {
    const S = this.sheet, B = this.box; for (const m of this.meshes) m.visible = false;
    if (!B.on) { this.paint(null); return; }
    const p0 = this.uv(B.g.localToWorld(B.slitLocal.clone())); const yaw = yawOf(B.g); const d0 = [Math.cos(yaw), Math.sin(yaw)]; const n0 = [-d0[1], d0[0]]; const w = this.w;
    const edge = (p, d) => { let t = 2; for (const [a, b] of [[[-S.W / 2, -S.H / 2], [S.W / 2, -S.H / 2]], [[S.W / 2, -S.H / 2], [S.W / 2, S.H / 2]], [[S.W / 2, S.H / 2], [-S.W / 2, S.H / 2]], [[-S.W / 2, S.H / 2], [-S.W / 2, -S.H / 2]]]) { const h = RF.hit(p, d, a, b); if (h && h.t < t) t = h.t; } return RF.add(p, RF.mul(d, t)); };
    const strip = (m, a, b, n, wa, wb) => m.set([this.P(...RF.add(a, RF.mul(n, -wa / 2))), this.P(...RF.add(a, RF.mul(n, wa / 2))), this.P(...RF.add(b, RF.mul(n, wb / 2))), this.P(...RF.add(b, RF.mul(n, -wb / 2)))]);
    // the prism, if it lies on the paper
    const pr = this.prism; let poly = null;
    if (pr && pr.g.parent && Math.abs(pr.g.position.y - (S.g.position.y + S.surfY)) < 0.004) { const c = this.uv(pr.g.position); const a = yawOf(pr.g); poly = pr.corners.map(([x, y]) => RF.add(c, [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)])); }
    const ts = poly ? SPECTRUM.map(([, n]) => RF.traceThrough(poly, p0, d0, n)) : null;
    if (!ts || !ts[0]) { const e = edge(p0, d0); strip(this.inBeam, p0, e, n0, w, w * 1.3); this.paint(null); this.out = null; return; }
    const E = ts[0].E; strip(this.inBeam, p0, E, n0, w, w);
    const ok = ts.filter((t) => t && t.dout); if (!ok.length) { this.paint(null); this.out = null; return; } // total internal reflection: nothing comes out
    const r = ok[0], v = ok[ok.length - 1];
    this.glassFan.set([this.P(...RF.add(E, RF.mul(n0, -w / 2))), this.P(...RF.add(E, RF.mul(n0, w / 2))), this.P(...v.F), this.P(...r.F)]);
    // out of the prism: to the card if the fan reaches it, else to the edge of the paper
    const C = this.card; let hits = null, s0 = null;
    if (C && C.g.parent) { const cc = this.uv(C.g.position); const a = yawOf(C.g); const tx = [Math.cos(a), Math.sin(a)]; s0 = [RF.add(cc, RF.mul(tx, -C.W / 2)), RF.add(cc, RF.mul(tx, C.W / 2))]; hits = ok.map((t) => RF.hit(t.F, t.dout, s0[0], s0[1])); if (hits.some((h) => !h)) hits = null; }
    const endOf = (t, i) => (hits ? hits[i].p : edge(t.F, t.dout)); const Rr = endOf(r, 0), Vv = endOf(v, ok.length - 1);
    const nr = [-r.dout[1], r.dout[0]]; const side = RF.dot(RF.sub(v.F, r.F), nr) + RF.dot(RF.sub(Vv, Rr), nr) >= 0 ? 1 : -1; const nn = RF.mul(nr, side);
    this.fan.set([this.P(...RF.add(r.F, RF.mul(nn, -w / 2))), this.P(...RF.add(v.F, RF.mul(nn, w / 2))), this.P(...RF.add(Vv, RF.mul(nn, w / 2))), this.P(...RF.add(Rr, RF.mul(nn, -w / 2)))]);
    this.out = { dev: ok.map((t) => Math.acos(Math.max(-1, Math.min(1, RF.dot(t.dout, d0)))) * 180 / Math.PI), i: ts[0].i, onCard: !!hits };
    if (hits) { const L = RF.norm(RF.sub(s0[1], s0[0])); const sAt = (p) => RF.dot(RF.sub(p, s0[0]), L) / C.W; this.paint(ok.map((t, i) => sAt(hits[i].p)), w / C.W); } else this.paint(null);
  }
  // the band on the card: one stripe per colour, from s (0..1 across the card), w (width as a fraction)
  paint(ss, wf = 0) {
    const C = this.card; if (!C) return; const key = ss ? ss.map((s) => s.toFixed(3)).join(',') : 'none'; if (key === this._key) return; this._key = key;
    C.paint(ss ? (x, W, H) => { const a = Math.min(...ss), b = Math.max(...ss); const pad = wf * 0.6 * W; const x0 = a * W - pad, x1 = b * W + pad; const top = H * 0.48;
      const g = x.createLinearGradient(ss[0] * W, 0, ss[ss.length - 1] * W, 0); SPECTRUM.forEach(([c], i) => g.addColorStop(i / 6, c));
      x.filter = 'blur(3px)'; x.fillStyle = g; x.fillRect(x0, top, x1 - x0, H - top - 6); x.filter = 'none';
      const fade = x.createLinearGradient(0, top - 10, 0, top + 26); fade.addColorStop(0, 'rgba(242,239,232,1)'); fade.addColorStop(1, 'rgba(242,239,232,0)'); x.fillStyle = fade; x.fillRect(x0 - 10, top - 10, x1 - x0 + 20, 36); } : null);
  }
  dispose() { for (const m of this.meshes) m.parent && m.parent.remove(m); }
}
// ------------------------------------------------------------------ a shallow steel bowl (a vessel: water can be poured into it)
export function steelBowl(o = {}) {
  const prof = [[0, 0], [0.036, 0], [0.048, 0.006], [0.06, 0.017], [0.068, 0.03], [0.073, 0.042], [0.075, 0.05]];
  const v = new Vessel('bowl', prof, { ...o, wall: 0.0014, noRim: true, name: o.name || { en: 'Steel bowl', hi: 'स्टील का कटोरा', hg: 'Steel ka katora' }, glassMat: new THREE.MeshStandardMaterial({ color: 0xc9cdd2, metalness: 0.92, roughness: 0.22, side: THREE.DoubleSide }) });
  v.glass.renderOrder = 0; const rim = new THREE.Mesh(new THREE.TorusGeometry(0.0752, 0.0016, 8, 64), steel(0xd2d6da, 0.2)); rim.rotation.x = Math.PI / 2; rim.position.y = 0.05; v.g.add(rim);
  v.grabY = 0.03; return v;
}
// ------------------------------------------------------------------ a coin; when it lies under water it is drawn where it appears to be from the eye (Snell's law at the surface)
export function coin(o = {}) {
  const it = new Item('coin', { ...o, name: o.name || { en: 'Coin', hi: 'सिक्का', hg: 'Sikka' } });
  const face = canvasTex(256, 256, (x, w, h) => { const g = x.createRadialGradient(w * 0.42, h * 0.38, 10, w / 2, h / 2, w / 2); g.addColorStop(0, '#f1d58a'); g.addColorStop(1, '#a8812f'); x.fillStyle = g; x.beginPath(); x.arc(w / 2, h / 2, w / 2, 0, 6.29); x.fill();
    x.strokeStyle = 'rgba(90,64,20,0.7)'; x.lineWidth = 6; x.beginPath(); x.arc(w / 2, h / 2, w / 2 - 14, 0, 6.29); x.stroke(); x.fillStyle = 'rgba(92,66,22,0.85)'; x.font = '800 120px serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('5', w / 2, h / 2 + 6); });
  const edgeM = new THREE.MeshStandardMaterial({ color: 0xc19a45, metalness: 0.85, roughness: 0.35 }); const faceM = new THREE.MeshStandardMaterial({ map: face, metalness: 0.7, roughness: 0.35 });
  const m = new THREE.Mesh(new THREE.CylinderGeometry(0.0115, 0.0115, 0.0017, 40), [edgeM, faceM, faceM]); m.position.y = 0.00085; it.g.add(m); it.disc = m;
  const N = 1.33; const E = new THREE.Vector3(), C = new THREE.Vector3();
  it.raise = 0;
  it.update = () => {
    const b = it.bowl; const cam = it.cam; it.raise = 0;
    if (b && cam && b.ml > 1 && Math.hypot(it.g.position.x - b.g.position.x, it.g.position.z - b.g.position.z) < b.rimR * 0.8) {
      const ys = b.levelWorld(); it.g.getWorldPosition(C); C.y += 0.0017; const d = ys - C.y;
      if (d > 0.001) { cam.getWorldPosition(E); const h = E.y - ys; const D = Math.hypot(E.x - C.x, E.z - C.z);
        let dp = d / N; if (h > 0.002 && D > 1e-4) { let lo = 0, hi = D; for (let i = 0; i < 40; i++) { const x = (lo + hi) / 2; const f = (N * x) / Math.hypot(x, d) - (D - x) / Math.hypot(D - x, h); if (f > 0) hi = x; else lo = x; } const x = (lo + hi) / 2; if (D - x > 1e-5) dp = (x * h) / (D - x); }
        it.raise = Math.max(0, Math.min(d * 0.92, d - dp)); }
    }
    m.position.y = 0.00085 + it.raise;
  };
  it.height = 0.0017; it.radius = 0.0115; it.grabY = 0.001; return it;
}
