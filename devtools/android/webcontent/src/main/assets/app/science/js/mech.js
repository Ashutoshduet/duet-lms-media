// Physics (Class 9): mechanics and sound. A stopwatch, a simple pendulum on an iron stand (it swings by Newton's law, so its
// period depends on length the way the real one does), a spring balance with a pointer, solids hung on a thread that feel the
// buoyant force when they dip into water, an overflow can that spills the displaced water through its spout, a tuning fork
// (heard and seen: ripples and splashes in water), an electric bell in a bell jar with a vacuum pump, and a lever.
import * as THREE from 'three';
import { Item, Vessel } from './apparatus.js';
import { canvasTex, woodTex, glassMat } from './mats.js';
import { dress } from './models.js';

const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const steel = (c = 0x9aa0a6, r = 0.35) => new THREE.MeshStandardMaterial({ color: c, metalness: 0.85, roughness: r });
const iron = () => new THREE.MeshStandardMaterial({ color: 0x2c3036, metalness: 0.5, roughness: 0.55 });
const lapseOf = (it) => (it.lab && it.lab.chem && it.lab.chem.lapse) || 1; // the time-lapse of the lab speeds clocks and swings alike
export const G = 9.8;

// ------------------------------------------------------------------ a digital stopwatch lying face up
export function stopwatch(o = {}) {
  const it = new Item('stopwatch', { ...o, name: o.name || { en: 'Stopwatch', hi: 'स्टॉपवॉच', hg: 'Stopwatch' } });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.031, 0.012, 40), new THREE.MeshStandardMaterial({ color: 0x1f6f8b, roughness: 0.45 })); body.position.y = 0.006; it.g.add(body);
  const c = document.createElement('canvas'); c.width = 256; c.height = 256; const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const face = new THREE.Mesh(new THREE.CircleGeometry(0.026, 40), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.3, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.18 })); face.rotation.x = -Math.PI / 2; face.position.y = 0.0122; it.g.add(face);
  const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.008, 14), steel(0xc0c4c8, 0.3)); crown.rotation.x = Math.PI / 2; crown.position.set(0, 0.006, -0.034); it.g.add(crown);
  const loop = new THREE.Mesh(new THREE.TorusGeometry(0.006, 0.0012, 6, 16), steel(0xc0c4c8, 0.3)); loop.rotation.x = Math.PI / 2; loop.position.set(0, 0.006, -0.043); it.g.add(loop);
  for (const s of [-1, 1]) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.006, 12), steel(0xc0c4c8, 0.3)); b.rotation.x = Math.PI / 2; b.position.set(s * 0.019, 0.006, -0.026); b.rotation.y = s * 0.6; it.g.add(b); }
  const fmt = (t) => { const m = Math.floor(t / 60), s = Math.floor(t % 60), cs = Math.floor((t * 100) % 100); return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`; };
  const draw = (s) => { const x = c.getContext('2d'); x.fillStyle = '#16323d'; x.fillRect(0, 0, 256, 256); x.fillStyle = '#c4d4b6'; x.beginPath(); x.roundRect(22, 92, 212, 76, 10); x.fill();
    x.fillStyle = '#18221a'; x.font = '700 44px monospace'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(s, 128, 132); x.fillStyle = '#d9e6ee'; x.font = '600 18px sans-serif'; x.fillText(it.running ? '● RUN' : 'STOP', 128, 196); x.fillText('START/STOP        RESET', 128, 62); tex.needsUpdate = true; };
  it.t = 0; it.running = false; let shown = ''; draw(fmt(0));
  it.update = (dt) => { if (it.running) it.t += dt * lapseOf(it); const s = fmt(it.t) + (it.running ? 'r' : ''); if (s !== shown) { shown = s; draw(fmt(it.t)); } };
  it.start = () => { it.running = true; }; it.stop = () => { it.running = false; }; it.reset = () => { it.t = 0; it.running = false; };
  it.read = () => Math.round(it.t * 100) / 100;
  it.height = 0.013; it.radius = 0.032; it.grabY = 0.006; return it;
}
// ------------------------------------------------------------------ a simple pendulum: heavy iron stand at the edge of the bench, the arm reaches out over the edge so the bob swings freely in front of it
export function pendulum(o = {}) {
  const it = new Item('pendulum', { ...o, name: o.name || { en: 'Simple pendulum on an iron stand', hi: 'लोहे के स्टैंड पर सरल लोलक (पेंडुलम)', hg: 'Iron stand par simple pendulum' } });
  const H = o.h ?? 0.5, arm = 0.2;
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.014, 0.2), iron()); base.position.set(0, 0.007, -0.02); it.g.add(base);
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, H, 14), steel()); rod.position.set(0, H / 2, -0.08); it.g.add(rod);
  const boss = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.024, 0.024), iron()); boss.position.set(0, H - 0.02, -0.08); it.g.add(boss);
  const am = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, arm, 10), steel()); am.rotation.x = Math.PI / 2; am.position.set(0, H - 0.02, -0.08 + arm / 2); it.g.add(am);
  const corkM = new THREE.MeshStandardMaterial({ color: 0xb98a55, roughness: 0.9 });
  for (const s of [-1, 1]) { const h = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.007, 0.022, 16, 1, false, s > 0 ? 0 : Math.PI, Math.PI), corkM); h.position.set(s * 0.0006, H - 0.034, -0.08 + arm); it.g.add(h); }
  const pivot = new THREE.Group(); pivot.position.set(0, H - 0.045, -0.08 + arm); it.g.add(pivot); it.pivot = pivot;
  const thread = new THREE.Mesh(new THREE.CylinderGeometry(0.00045, 0.00045, 1, 6), new THREE.MeshStandardMaterial({ color: 0xf2efe6, roughness: 0.9 })); pivot.add(thread);
  const bobM = new THREE.MeshStandardMaterial({ color: 0xd8dde2, metalness: 0.95, roughness: 0.14 }); const bob = new THREE.Mesh(new THREE.SphereGeometry(1, 28, 18), bobM); pivot.add(bob);
  const hook = new THREE.Mesh(new THREE.TorusGeometry(0.0022, 0.0006, 6, 12), steel()); pivot.add(hook);
  // a large protractor behind the thread: 0° straight down, marked both ways to 90°
  const pt = canvasTex(512, 512, (x, w, h) => { x.clearRect(0, 0, w, h); x.fillStyle = 'rgba(235,245,255,0.28)'; x.beginPath(); x.arc(256, 256, 252, 0, Math.PI); x.fill(); x.strokeStyle = '#12304a'; x.fillStyle = '#12304a'; x.font = '600 20px sans-serif'; x.textAlign = 'center';
    for (let a = -90; a <= 90; a++) { const r = a * Math.PI / 180; const L = a % 10 === 0 ? 30 : a % 5 === 0 ? 20 : 11; x.lineWidth = a % 10 ? 1 : 2; x.beginPath(); x.moveTo(256 + Math.sin(r) * 250, 256 + Math.cos(r) * 250); x.lineTo(256 + Math.sin(r) * (250 - L), 256 + Math.cos(r) * (250 - L)); x.stroke(); if (a % 10 === 0) x.fillText(String(Math.abs(a)), 256 + Math.sin(r) * 204, 262 + Math.cos(r) * 204); } });
  const prot = new THREE.Mesh(new THREE.CircleGeometry(0.1, 48, Math.PI, Math.PI), new THREE.MeshStandardMaterial({ map: pt, transparent: true, depthWrite: false, side: THREE.DoubleSide, roughness: 0.2 })); prot.position.set(0, H - 0.045, -0.08 + arm - 0.006); prot.renderOrder = 7; it.g.add(prot);
  it.L = 1; it.r = 0.0095; it.mass = 0.1; it.th = 0; it.om = 0; it.free = false; it.osc = 0; it.damp = 0.004;
  it.setL = (L) => { it.L = L; const tl = Math.max(0.01, L - it.r); thread.scale.y = tl; thread.position.y = -tl / 2; bob.position.y = -L; bob.scale.setScalar(it.r); hook.position.y = -L + it.r + 0.0015; };
  it.setBob = (r, mass, col) => { it.r = r; it.mass = mass; if (col != null) bobM.color.setHex(col); it.setL(it.L); };
  it.update = (dt) => {
    if (it.free) { let rem = dt * lapseOf(it); while (rem > 1e-7) { const h = Math.min(rem, 1 / 400); const a = -(G / it.L) * Math.sin(it.th) - it.damp * it.om; const prev = it.th; it.om += a * h; it.th += it.om * h; if (prev < 0 && it.th >= 0) it.osc++; rem -= h; } }
    pivot.rotation.z = it.th;
  };
  it.bobWorld = (out = V3(0, 0, 0)) => bob.getWorldPosition(out);
  it.setL(o.L ?? 1); it.height = H; it.radius = 0.1; it.grabY = H * 0.5; it.noGrab = true; return it;
}
// ------------------------------------------------------------------ a spring balance that hangs from its ring (the item's origin); the scale and the pointer are on the front (+z)
export function springBalance(o = {}) {
  const unit = o.unit ?? 'N', max = o.max ?? 5, lc = o.lc ?? (unit === 'N' ? 0.05 : 5);
  const it = new Item('sbal', { ...o, name: o.name || { en: `Spring balance (0–${max} ${unit === 'N' ? 'N' : 'g'})`, hi: `स्प्रिंग बैलेंस (0–${max} ${unit === 'N' ? 'N' : 'g'})`, hg: `Spring balance (0–${max} ${unit === 'N' ? 'N' : 'g'})` } });
  const S0 = -0.035, SL = 0.1; // the zero mark and the length of the scale
  const face = canvasTex(128, 640, (x, w, h) => { x.fillStyle = '#f3efe2'; x.fillRect(0, 0, w, h); x.fillStyle = '#1b1b1b'; x.strokeStyle = '#1b1b1b'; const py = (v) => ((-S0 + (v / max) * SL) / 0.16) * h; const n = Math.round(max / lc); const maj = unit === 'N' ? (max > 5 ? 1 : 0.5) : (max > 500 ? 100 : 50);
    for (let i = 0; i <= n; i++) { const v = i * lc; const isM = Math.abs(v / maj - Math.round(v / maj)) < 1e-6; const L = isM ? 40 : (Math.abs(v / (maj / 5) - Math.round(v / (maj / 5))) < 1e-6 ? 26 : 16); x.lineWidth = isM ? 3 : 1.5; x.beginPath(); x.moveTo(w - 8 - L, py(v)); x.lineTo(w - 8, py(v)); x.stroke(); if (isM) { x.font = '700 26px sans-serif'; x.textAlign = 'left'; x.textBaseline = 'middle'; x.fillText(String(+v.toFixed(1)), 6, py(v)); } }
    x.font = '800 30px sans-serif'; x.textAlign = 'center'; x.fillText(unit === 'N' ? 'N' : 'g', w / 2, 28); });
  const bodyM = new THREE.MeshStandardMaterial({ color: 0xc9cdd2, metalness: 0.7, roughness: 0.35 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.16, 0.012), [bodyM, bodyM, bodyM, bodyM, new THREE.MeshStandardMaterial({ map: face, roughness: 0.6 }), bodyM]); body.position.set(0, -0.09, 0); it.g.add(body);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.008, 0.0018, 8, 20), steel()); ring.position.y = -0.002; it.g.add(ring);
  const ptr = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.0025, 0.004), new THREE.MeshStandardMaterial({ color: 0xc62828, roughness: 0.4 })); ptr.position.set(0.002, S0, 0.0075); it.g.add(ptr);
  const hookG = new THREE.Group(); it.g.add(hookG); const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.0013, 0.0013, 0.03, 8), steel()); stem.position.y = 0.012; hookG.add(stem);
  const hk = new THREE.Mesh(new THREE.TorusGeometry(0.004, 0.0011, 6, 14, Math.PI * 1.5), steel()); hk.rotation.z = Math.PI * 0.75; hk.position.y = -0.004; hookG.add(hk);
  it.hookG = hookG; it.max = max; it.unit = unit; it.lc = lc; it.load = 0; it.shown = 0; it.vel = 0;
  it.update = (dt) => { const acc = (it.load - it.shown) * 90 - it.vel * 14; it.vel += acc * dt; it.shown += it.vel * dt; const ext = SL * Math.max(-0.02, Math.min(1.03, it.shown / max)); ptr.position.y = S0 - ext; hookG.position.y = -0.17 - ext; };
  it.read = () => Math.round(it.shown / lc) * lc;
  it.height = 0.2; it.radius = 0.02; it.grabY = -0.01; it.noRest = true; return it;
}
// ------------------------------------------------------------------ a solid on a thread (stone or brass); the item's origin is the top of the thread
export function sinker(o = {}) {
  const kind = o.kind ?? 'stone'; const mass = o.mass ?? 153, vol = o.vol ?? 51, tl = o.thread ?? 0.05;
  const it = new Item('sinker', { ...o, name: o.name || (kind === 'stone' ? { en: 'Stone tied to a thread', hi: 'धागे से बँधा पत्थर', hg: 'Dhaage se bandha patthar' } : { en: 'Brass piece tied to a thread', hi: 'धागे से बँधा पीतल का टुकड़ा', hg: 'Dhaage se bandha brass ka tukda' }) });
  const th = new THREE.Mesh(new THREE.CylinderGeometry(0.0004, 0.0004, tl, 6), new THREE.MeshStandardMaterial({ color: 0xf2efe6, roughness: 0.9 })); th.position.y = -tl / 2; it.g.add(th);
  let hb;
  if (kind === 'stone') { const r = Math.cbrt((3 * vol * 1e-6) / (4 * Math.PI)); const g = new THREE.IcosahedronGeometry(r, 2); const p = g.attributes.position; let sd = 7; const rnd = () => ((sd = (sd * 16807) % 2147483647) / 2147483647); const map = new Map();
    for (let i = 0; i < p.count; i++) { const k = `${p.getX(i).toFixed(4)},${p.getY(i).toFixed(4)},${p.getZ(i).toFixed(4)}`; if (!map.has(k)) map.set(k, 0.86 + rnd() * 0.24); const f = map.get(k); p.setXYZ(i, p.getX(i) * f * 1.1, p.getY(i) * f * 0.85, p.getZ(i) * f); }
    g.computeVertexNormals(); const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: 0x8b8680, roughness: 0.95, flatShading: true })); m.position.y = -tl - r * 0.85; it.g.add(m); hb = r * 0.85 * 2; }
  else { const r = o.r ?? 0.0095; const h = (vol * 1e-6) / (Math.PI * r * r); const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 24), new THREE.MeshStandardMaterial({ color: 0xc9a24a, metalness: 0.9, roughness: 0.3 })); m.position.y = -tl - h / 2; it.g.add(m); const e = new THREE.Mesh(new THREE.TorusGeometry(0.002, 0.0006, 6, 12), steel()); e.position.y = -tl + 0.0005; it.g.add(e); hb = h; }
  it.mass = mass; it.vol = vol; it.hTop = -tl; it.hBot = -tl - hb; it.Vsub = 0; it.height = 0.001; it.radius = 0.02; it.grabY = 0; it.noRest = true; return it;
}
// a vessel whose liquid level also counts the volume of what is dipped in it (v.disp, mL)
export function withDisp(v) { if (v._hf) return v; v._hf = v.heightFor.bind(v); v.disp = 0; v.heightFor = (ml) => v._hf(ml + (v.disp || 0)); return v; }
// the volume (mL) that fills a vessel up to local height y
export function mlAt(v, y) { const t = v.tab; for (let i = 1; i < t.length; i++) if (t[i][0] >= y) { const a = t[i - 1], b = t[i]; return a[1] + (b[1] - a[1]) * (y - a[0]) / Math.max(1e-9, b[0] - a[0]); } return v.maxMl; }
// how much of a hung solid is under water: sets s.Vsub (mL) and the vessel's displaced volume
export function immerse(s, vessels) {
  const p = s.g.getWorldPosition(V3(0, 0, 0)); let got = null;
  for (const v of vessels) { const c = v.g.position; if (Math.hypot(p.x - c.x, p.z - c.z) < v.rimR) { got = v; break; } }
  for (const v of vessels) if (v !== got && v.dispBy === s) { v.disp = 0; v.dispBy = null; }
  if (!got || got.ml < 0.5) { s.Vsub = 0; if (got) { got.disp = 0; } return 0; }
  const lvl = got.levelWorld(); const bot = p.y + s.hBot, top = p.y + s.hTop; const f = Math.max(0, Math.min(1, (lvl - bot) / Math.max(1e-6, top - bot)));
  const k = f * f * (3 - 2 * f); s.Vsub += (s.vol * k - s.Vsub) * 0.5; got.disp = s.Vsub; got.dispBy = s; return s.Vsub;
}
// ------------------------------------------------------------------ an overflow can (Eureka can) with a spout; water above the spout runs out into whatever stands under it
export function overflowCan(o = {}) {
  const r = 0.032, h = 0.13, sy = 0.1;
  const v = new Vessel('ocan', [[0, 0], [r - 0.003, 0], [r, 0.003], [r, h], [r + 0.0015, h]], { ...o, wall: 0.0016, name: o.name || { en: 'Overflow can', hi: 'ओवरफ़्लो कैन', hg: 'Overflow can' }, glass: { opacity: 0.16, edge: 0.7 } });
  const spM = glassMat({ opacity: 0.25, edge: 0.8 }); const sp = new THREE.Mesh(new THREE.CylinderGeometry(0.0045, 0.0045, 0.05, 14, 1, true), spM); sp.rotation.z = Math.PI / 2 + 0.3; sp.position.set(r + 0.023, sy - 0.007, 0); sp.renderOrder = 6; v.g.add(sp);
  const sm = new THREE.Mesh(new THREE.CylinderGeometry(0.0018, 0.0012, 1, 8, 1, true), new THREE.MeshStandardMaterial({ color: 0xcfe6ff, transparent: true, opacity: 0.55, roughness: 0.05 })); sm.visible = false; sm.renderOrder = 5; sm.userData.noHit = true; v.g.add(sm);
  v.spoutY = sy; v.tip = V3(r + 0.046, sy - 0.016, 0); v.stream = sm; v.flowT = 0; withDisp(v); v.grabY = h * 0.5; return v;
}
// run every frame: the excess water leaves by the spout into v.spoutTo (or onto the tray)
export function overflowTick(v, dt) {
  const lvl = v.heightFor(v.ml); let flow = 0;
  if (lvl > v.spoutY + 0.0003 && v.ml > 0) { const ex = v.ml + (v.disp || 0) - mlAt(v, v.spoutY); if (ex > 0.005) { flow = Math.min(ex, (1.5 + ex * 3) * dt); const p = v.mix.take(flow); const to = v.spoutTo; if (to && to.mix) { to.mix.put(p, flow); to.ml = to.mix.ml(); } v.ml = v.mix.ml(); } }
  v.flowT = flow > 0 ? 0.12 : Math.max(0, v.flowT - dt); const sm = v.stream; sm.visible = v.flowT > 0;
  if (sm.visible) { const tipW = v.g.localToWorld(v.tip.clone()); const to = v.spoutTo; let y1 = tipW.y - 0.25; if (to) { y1 = to.ml > 0.1 ? to.levelWorld() : to.g.localToWorld(V3(0, to.inner[0].y, 0)).y; } const L = Math.max(0.005, tipW.y - y1); sm.scale.set(1, L, 1); sm.position.set(v.tip.x, v.tip.y - L / 2, v.tip.z); }
  return flow;
}
// ------------------------------------------------------------------ a tuning fork (512 Hz) and a rubber pad to strike it on
export function tuningFork(o = {}) {
  const it = new Item('fork', { ...o, name: o.name || { en: 'Tuning fork (512 Hz)', hi: 'ट्यूनिंग फ़ोर्क (512 Hz)', hg: 'Tuning fork (512 Hz)' } });
  const M = steel(0xc4c9ce, 0.22);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.0035, 0.004, 0.05, 12), M); stem.position.y = 0.025; it.g.add(stem);
  const u = new THREE.Mesh(new THREE.TorusGeometry(0.0085, 0.0028, 10, 20, Math.PI), M); u.rotation.z = Math.PI; u.position.y = 0.058; it.g.add(u);
  const prongs = [-1, 1].map((s) => { const p = new THREE.Mesh(new THREE.BoxGeometry(0.0052, 0.085, 0.006), M); p.position.set(s * 0.0085, 0.1, 0); it.g.add(p); return p; });
  const lab = canvasTex(128, 32, (x, w, h) => { x.fillStyle = '#c4c9ce'; x.fillRect(0, 0, w, h); x.fillStyle = '#3a3f44'; x.font = '700 20px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('512 Hz', w / 2, h / 2); });
  const tag = new THREE.Mesh(new THREE.PlaneGeometry(0.004, 0.016), new THREE.MeshStandardMaterial({ map: lab, roughness: 0.4 })); tag.rotation.z = Math.PI / 2; tag.position.set(0.0085, 0.08, 0.0031); it.g.add(tag);
  it.vib = 0; it.f = 512; it.prongs = prongs;
  it.update = (dt) => { it.vib *= Math.exp(-dt / 2.2); const a = it.vib > 0.02 ? 0.0007 * it.vib * (Math.random() * 2 - 1) : 0; prongs[0].position.x = -0.0085 - a; prongs[1].position.x = 0.0085 + a; };
  it.tipWorld = (i = 1, out = V3(0, 0, 0)) => prongs[i].localToWorld(out.set(0, 0.0425, 0)); // the free end of a prong
  it.height = 0.143; it.radius = 0.012; it.grabY = 0.02; it.layH = 0.004; return it;
}
export function rubberPad(o = {}) {
  const it = new Item('pad', { ...o, name: o.name || { en: 'Rubber pad', hi: 'रबर पैड', hg: 'Rubber pad' } });
  const m = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.022, 0.045), new THREE.MeshStandardMaterial({ color: 0x3b2a26, roughness: 0.95 })); m.position.y = 0.011; it.g.add(m);
  it.height = 0.022; it.radius = 0.04; it.grabY = 0.011; return it;
}
// ------------------------------------------------------------------ splashes and ripples on a water surface
export class Splash {
  constructor(scene) { this.scene = scene; this.drops = []; this.rings = []; this.dm = new THREE.MeshStandardMaterial({ color: 0xe6f3ff, transparent: true, opacity: 0.8, roughness: 0.05 }); this.dg = new THREE.SphereGeometry(1, 8, 6); this.meshes = []; }
  burst(p, n = 10, sp = 0.35) { for (let i = 0; i < n; i++) { const m = new THREE.Mesh(this.dg, this.dm); const s = 0.0008 + Math.random() * 0.0012; m.scale.setScalar(s); m.position.copy(p); m.userData.noHit = true; this.scene.add(m); const a = Math.random() * Math.PI * 2, u = 0.3 + Math.random() * 0.7; this.drops.push({ m, v: V3(Math.cos(a) * sp * 0.4 * u, sp * (0.6 + Math.random() * 0.6), Math.sin(a) * sp * 0.4 * u), y0: p.y, t: 0 }); } }
  ripple(p, rmax = 0.04) { const m = new THREE.Mesh(new THREE.RingGeometry(0.97, 1, 48), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6, depthWrite: false, side: THREE.DoubleSide })); m.rotation.x = -Math.PI / 2; m.position.copy(p); m.position.y += 0.0004; m.scale.setScalar(0.002); m.renderOrder = 8; m.userData.noHit = true; this.scene.add(m); this.rings.push({ m, t: 0, rmax }); }
  update(dt) {
    this.drops = this.drops.filter((d) => { d.t += dt; d.v.y -= G * dt; d.m.position.addScaledVector(d.v, dt); if (d.m.position.y < d.y0 - 0.002 && d.v.y < 0) { this.scene.remove(d.m); return false; } return true; });
    this.rings = this.rings.filter((r) => { r.t += dt; const k = r.t / 1.1; if (k >= 1) { this.scene.remove(r.m); r.m.geometry.dispose(); r.m.material.dispose(); return false; } r.m.scale.setScalar(0.002 + r.rmax * k); r.m.material.opacity = 0.6 * (1 - k); return true; });
  }
  clear() { for (const d of this.drops) this.scene.remove(d.m); for (const r of this.rings) this.scene.remove(r.m); this.drops = []; this.rings = []; }
}
// ------------------------------------------------------------------ an electric bell under a glass bell jar on a pump plate
export function bellJar(o = {}) {
  const it = new Item('belljar', { ...o, name: o.name || { en: 'Electric bell in a bell jar', hi: 'बेल जार में बिजली की घंटी', hg: 'Bell jar mein electric bell' } });
  const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.105, 0.014, 48), steel(0x6d737a, 0.4)); plate.position.y = 0.007; it.g.add(plate);
  const gasket = new THREE.Mesh(new THREE.TorusGeometry(0.083, 0.003, 8, 48), new THREE.MeshStandardMaterial({ color: 0x1b1b1b, roughness: 0.8 })); gasket.rotation.x = Math.PI / 2; gasket.position.y = 0.0145; it.g.add(gasket);
  const prof = []; for (let i = 0; i <= 16; i++) { const a = (i / 16) * Math.PI / 2; prof.push(new THREE.Vector2(Math.max(0.0001, 0.083 * Math.cos(a)), 0.014 + 0.13 + 0.07 * Math.sin(a))); } prof.unshift(new THREE.Vector2(0.083, 0.014));
  const dome = new THREE.Mesh(new THREE.LatheGeometry(prof, 48), glassMat({ opacity: 0.1, edge: 0.6 })); dome.renderOrder = 6; it.g.add(dome);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.012, 16, 12), glassMat({ opacity: 0.3, edge: 0.8 })); knob.position.y = 0.222; knob.renderOrder = 6; it.g.add(knob);
  // the bell: a wooden stand, a gong, a coil box and a hammer on a springy arm
  const wood = new THREE.MeshStandardMaterial({ map: woodTex('#8a5a33'), roughness: 0.7 });
  const stand = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.07, 0.012), wood); stand.position.set(0, 0.05, -0.02); it.g.add(stand);
  const gong = new THREE.Mesh(new THREE.SphereGeometry(0.026, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xc9a24a, metalness: 0.95, roughness: 0.2, side: THREE.DoubleSide })); gong.rotation.x = Math.PI / 2; gong.position.set(0, 0.105, -0.012); it.g.add(gong);
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.002, 0.002, 0.03, 8), steel()); post.position.set(0, 0.09, -0.016); it.g.add(post);
  const coil = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.026, 16), new THREE.MeshStandardMaterial({ color: 0xa8562a, metalness: 0.6, roughness: 0.4 })); coil.position.set(0, 0.035, -0.006); it.g.add(coil);
  const hp = new THREE.Group(); hp.position.set(0, 0.035, 0.0); it.g.add(hp); const armH = new THREE.Mesh(new THREE.BoxGeometry(0.002, 0.06, 0.003), steel()); armH.position.y = 0.03; hp.add(armH);
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.0045, 12, 10), steel(0x7a7f85, 0.3)); ball.position.y = 0.062; hp.add(ball);
  const out = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.03, 10), steel(0x6d737a, 0.4)); out.rotation.z = Math.PI / 2; out.position.set(0.112, 0.007, 0); it.g.add(out);
  it.p = 1; it.on = false; it.audio = null; let ph = 0, last = 0;
  it.update = (dt) => {
    if (it.on) { ph += dt * 13; const s = Math.sin(ph * Math.PI * 2); hp.rotation.x = -0.22 * Math.max(0, s); const k = Math.floor(ph); if (k !== last) { last = k; const a = it.audio; const g = 0.12 * (0.015 + 0.985 * Math.pow(it.p, 1.3)); if (a && a.tone && g > 0.0012) { a.tone(2350, 0.22, g, 'triangle'); a.tone(3520, 0.14, g * 0.5, 'sine'); } } }
    else hp.rotation.x *= Math.exp(-dt * 10);
  };
  it.terms = { a: { item: it, local: V3(-0.07, 0.012, 0.07), dir: V3(-0.3, 1, 0.3) }, b: { item: it, local: V3(-0.05, 0.012, 0.085), dir: V3(-0.3, 1, 0.3) } };
  it.outlet = V3(0.127, 0.007, 0); it.height = 0.234; it.radius = 0.105; it.grabY = 0.1; return it;
}
// ------------------------------------------------------------------ a vacuum pump with a pressure gauge and a hose to the plate of the bell jar
export function vacuumPump(o = {}) {
  const it = new Item('pump', { ...o, name: o.name || { en: 'Vacuum pump', hi: 'वैक्यूम पंप', hg: 'Vacuum pump' } });
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.08, 0.09), new THREE.MeshStandardMaterial({ color: 0x2d5f8a, roughness: 0.45, metalness: 0.3 })); body.position.y = 0.04; it.g.add(body);
  const motor = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.08, 24), new THREE.MeshStandardMaterial({ color: 0x23272d, roughness: 0.5, metalness: 0.4 })); motor.rotation.z = Math.PI / 2; motor.position.set(-0.03, 0.105, 0); it.g.add(motor);
  const fan = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.006, 20), steel(0x9aa0a6, 0.3)); fan.rotation.z = Math.PI / 2; fan.position.set(0.016, 0.105, 0); it.g.add(fan);
  const gc = document.createElement('canvas'); gc.width = 256; gc.height = 256; const gt = new THREE.CanvasTexture(gc); gt.colorSpace = THREE.SRGBColorSpace;
  const gauge = new THREE.Mesh(new THREE.CircleGeometry(0.024, 32), new THREE.MeshStandardMaterial({ map: gt, roughness: 0.35 })); gauge.position.set(0.035, 0.05, 0.0455); it.g.add(gauge);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.025, 0.002, 8, 32), steel(0xc0c4c8, 0.3)); rim.position.copy(gauge.position); it.g.add(rim);
  const drawG = (p) => { const x = gc.getContext('2d'); x.fillStyle = '#f6f2e6'; x.beginPath(); x.arc(128, 128, 126, 0, 6.29); x.fill(); x.strokeStyle = '#1b1b1b'; x.fillStyle = '#1b1b1b'; x.lineWidth = 2; const A0 = Math.PI * 0.75, A1 = Math.PI * 2.25;
    for (let i = 0; i <= 10; i++) { const a = A0 + (A1 - A0) * (i / 10); x.beginPath(); x.moveTo(128 + Math.cos(a) * 112, 128 + Math.sin(a) * 112); x.lineTo(128 + Math.cos(a) * 96, 128 + Math.sin(a) * 96); x.stroke(); if (i % 2 === 0) { x.font = '600 20px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(String(i * 10), 128 + Math.cos(a) * 76, 128 + Math.sin(a) * 76); } }
    x.font = '700 18px sans-serif'; x.fillText('kPa', 128, 182); const a = A0 + (A1 - A0) * Math.max(0, Math.min(1, p)); x.strokeStyle = '#c62828'; x.lineWidth = 4; x.beginPath(); x.moveTo(128, 128); x.lineTo(128 + Math.cos(a) * 100, 128 + Math.sin(a) * 100); x.stroke(); x.fillStyle = '#c62828'; x.beginPath(); x.arc(128, 128, 8, 0, 6.29); x.fill(); gt.needsUpdate = true; };
  it.on = false; it.jar = null; it.audio = null; let shown = -1, hum = 0;
  it.update = (dt) => {
    const j = it.jar; if (j) { if (it.on) j.p += (0.01 - j.p) * Math.min(1, dt / 2.8); if (it.venting) j.p += (1 - j.p) * Math.min(1, dt / 0.9); const k = Math.round(j.p * 200); if (k !== shown) { shown = k; drawG(j.p); } }
    if (it.on) { fan.rotation.x += dt * 40; hum -= dt; if (hum <= 0 && it.audio && it.audio.burst) { hum = 0.18; it.audio.burst(0.22, 180, 0.08, 'lowpass'); } }
  };
  drawG(1); it.port = V3(0.065, 0.02, 0); it.height = 0.135; it.radius = 0.07; it.grabY = 0.04; return it;
}
// ------------------------------------------------------------------ a lever: a 30 cm scale balanced on a round pencil; things placed on it tip it one way or the other
export function scale30(o = {}) {
  const it = new Item('scale30', { ...o, name: o.name || { en: '30 cm scale', hi: '30 सेमी स्केल', hg: '30 cm scale' } });
  const L = 0.31; const tex = canvasTex(2048, 128, (x, w, h) => { x.fillStyle = '#f1ead2'; x.fillRect(0, 0, w, h); x.fillStyle = '#1b1b1b'; const px = (mm) => 32 + (mm / 300) * (w - 64);
    for (let mm = 0; mm <= 300; mm++) { const Lh = mm % 10 === 0 ? 46 : mm % 5 === 0 ? 32 : 18; x.fillRect(px(mm) - (mm % 10 ? 0.8 : 1.5), 0, mm % 10 ? 1.6 : 3, Lh); if (mm % 10 === 0) { x.font = '600 34px sans-serif'; x.textAlign = 'center'; x.fillText(String(mm / 10), px(mm), 92); } } });
  const plankM = new THREE.MeshStandardMaterial({ color: 0xe8e0c4, roughness: 0.5 }); const top = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5 });
  const pivot = new THREE.Group(); it.g.add(pivot); const pl = new THREE.Mesh(new THREE.BoxGeometry(L, 0.003, 0.03), [plankM, plankM, top, plankM, plankM, plankM]); pivot.add(pl);
  it.pivot = pivot; it.L = L; it.xAt = (cm) => -L / 2 + 0.005 + (cm / 30) * (L - 0.01); // local x of a scale mark (on the plank)
  it.fulcrumCm = 7; it.tilt = 0; it.target = 0; it.loads = []; it.selfG = 15; it.r0 = 0.0038;
  it.place = (fcm) => { it.fulcrumCm = fcm; const fx = it.xAt(fcm); pivot.position.set(fx, 2 * it.r0 + 0.0015, 0); pl.position.set(-fx, 0, 0); };
  it.torque = () => { let t = it.selfG * (15 - it.fulcrumCm); for (const l of it.loads) t += l.grams * (l.cm - it.fulcrumCm); return t; }; // gram-centimetres; + means the far (long) side goes down
  it.update = (dt) => {
    const t = it.torque(); const aL = Math.asin(Math.min(1, (2 * it.r0 + 0.0015) / Math.max(0.01, (30 - it.fulcrumCm) / 100 * (L - 0.01) / 0.3))), aS = Math.asin(Math.min(1, (2 * it.r0 + 0.0015) / Math.max(0.01, it.fulcrumCm / 100 * (L - 0.01) / 0.3)));
    it.target = Math.abs(t) < 1 ? it.target : t > 0 ? -aL : aS; it.tilt += (it.target - it.tilt) * Math.min(1, dt * 5); pivot.rotation.z = it.tilt;
  };
  it.place(7); it.height = 0.012; it.radius = L / 2; it.grabY = 0.006; return it;
}
export function roundPencil(o = {}) {
  const it = new Item('rpencil', { ...o, name: o.name || { en: 'Round pencil', hi: 'गोल पेंसिल', hg: 'Gol pencil' } });
  const b = new THREE.Mesh(new THREE.CylinderGeometry(0.0038, 0.0038, 0.15, 16), new THREE.MeshStandardMaterial({ color: 0x2e7d4f, roughness: 0.5 })); b.rotation.x = Math.PI / 2; b.position.y = 0.0038; it.g.add(b);
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.0038, 0.014, 16), new THREE.MeshStandardMaterial({ color: 0xe8c9a0, roughness: 0.8 })); tip.rotation.x = Math.PI / 2; tip.position.set(0, 0.0038, 0.082); it.g.add(tip);
  it.height = 0.0076; it.radius = 0.08; it.grabY = 0.004; return it;
}
export function stapler(o = {}) {
  const it = new Item('stapler', { ...o, name: o.name || { en: 'Stapler (150 g)', hi: 'स्टेपलर (150 ग्राम)', hg: 'Stapler (150 g)' } });
  const dark = new THREE.MeshStandardMaterial({ color: 0x23272d, roughness: 0.45 }), red = new THREE.MeshStandardMaterial({ color: 0xb3262b, roughness: 0.4 });
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.008, 0.11), dark); base.position.y = 0.004; it.g.add(base);
  const top = new THREE.Mesh(new THREE.BoxGeometry(0.026, 0.016, 0.1), red); top.position.set(0, 0.018, -0.004); top.rotation.x = 0.06; it.g.add(top); dress(it, 'vintage_stapler', { rot: [0, Math.PI / 2, 0], l: 0.12, hide: [base, top] });
  it.grams = 150; it.height = 0.027; it.radius = 0.055; it.grabY = 0.015; return it;
}
export function eraser(o = {}) {
  const it = new Item('eraser', { ...o, name: o.name || { en: 'Eraser (20 g)', hi: 'रबड़ (20 ग्राम)', hg: 'Rubber/eraser (20 g)' } });
  const m = new THREE.Mesh(new THREE.BoxGeometry(0.026, 0.011, 0.018), [0, 1, 2, 3, 4, 5].map((i) => new THREE.MeshStandardMaterial({ color: i === 2 ? 0xf3f0ea : 0xe9a0a8, roughness: 0.9 }))); m.position.y = 0.0055; it.g.add(m);
  it.grams = 20; it.height = 0.011; it.radius = 0.015; it.grabY = 0.005; return it;
}
// ------------------------------------------------------------------ a plain wooden block (to raise the overflow can)
export function woodBlock(w = 0.1, h = 0.1, d = 0.1, o = {}) {
  const it = new Item('wblock', { ...o, name: o.name || { en: 'Wooden block', hi: 'लकड़ी का गुटका', hg: 'Lakdi ka block' } });
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial({ map: woodTex('#a77445'), roughness: 0.75 })); m.position.y = h / 2; it.g.add(m);
  it.top = h; it.height = h; it.radius = Math.max(w, d) / 2; it.grabY = h / 2; return it;
}
// ------------------------------------------------------------------ a 100 mL measuring cylinder, marked every 1 mL (numbered every 10 mL)
export function cylinder100(o = {}) {
  const r = 0.0145, h = 0.215; const prof = [[0, 0.006], [r, 0.006], [r, h - 0.002], [r + 0.002, h]];
  const v = new Vessel('cylinder', prof, { ...o, name: o.name || { en: 'Measuring cylinder (100 mL)', hi: 'मेज़रिंग सिलिंडर (100 mL)', hg: 'Measuring cylinder (100 mL)' }, cap: 100 });
  const base = new THREE.Mesh(new THREE.CylinderGeometry(r * 2.4, r * 2.6, 0.006, 6), glassMat({ opacity: 0.25 })); base.position.y = 0.003; base.renderOrder = 6; v.g.add(base);
  const y0 = v.heightFor(0.0001), y1 = v.heightFor(100); const H = h * 0.98; const tex = canvasTex(256, 2048, (x, w, hh) => { x.clearRect(0, 0, w, hh); x.strokeStyle = 'rgba(255,255,255,0.95)'; x.fillStyle = 'rgba(255,255,255,0.97)'; x.textBaseline = 'middle';
    const py = (ml) => hh - ((y0 + (y1 - y0) * (ml / 100) - (h - H) / 2 - 0.001) / H) * hh;
    for (let i = 1; i <= 100; i++) { const yy = py(i); const L = i % 10 === 0 ? 120 : i % 5 === 0 ? 86 : 54; x.lineWidth = i % 10 === 0 ? 5 : 3; x.beginPath(); x.moveTo(16, yy); x.lineTo(16 + L, yy); x.stroke(); if (i % 10 === 0) { x.font = '700 44px sans-serif'; x.fillText(String(i), 146, yy); } }
    x.font = '600 32px sans-serif'; x.fillText('mL', 150, py(100) - 60); });
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r + 0.0003, r + 0.0003, H, 24, 1, true, -0.55, 1.1), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, opacity: 0.92 })); m.position.y = h / 2 + 0.001; m.rotation.y = Math.PI; m.renderOrder = 7; m.userData.noHit = true; v.g.add(m);
  v.grabY = h * 0.6; return v;
}
// ------------------------------------------------------------------ the hum of a tuning fork: a pure tone that dies away, or stops when the prongs are touched
export function forkSound(audio, f = 512, gain = 0.22, dur = 6) {
  if (!audio || !audio.ctx || !audio.sfx) return { stop() {} };
  const c = audio.ctx, t = c.currentTime; const o = c.createOscillator(); o.type = 'sine'; o.frequency.value = f; const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(audio.master); o.start(t); o.stop(t + dur + 0.05);
  return { stop() { const n = c.currentTime; try { g.gain.cancelScheduledValues(n); g.gain.setValueAtTime(Math.max(0.0001, g.gain.value), n); g.gain.exponentialRampToValueAtTime(0.0001, n + 0.08); o.stop(n + 0.1); } catch (e) { void e; } } };
}
