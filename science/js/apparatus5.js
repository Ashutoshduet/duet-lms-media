// Batch 5 apparatus (Class 9 book experiments): a digital balance, a balloon for a closed flask, a separating funnel on a stand,
// a distillation set (round-bottom flask, condenser, clamp stand), a centrifuge, a live temperature read-out, crystals that grow
// in a cooling solution, and the dye stain left on a watch glass.
import * as THREE from 'three';
import { Item, Vessel } from './apparatus.js';
import { glassMat, canvasTex, woodTex } from './mats.js';

const V2 = (r, y) => new THREE.Vector2(r, y);
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const SEG = 40;
const tmp = new THREE.Vector3();
const steel = (c = 0xc4c8cc, r = 0.3) => new THREE.MeshStandardMaterial({ color: c, metalness: 0.85, roughness: r });

// ------------------------------------------------------------------ text that floats in the air and updates (temperature, mass)
function textSprite(w = 256, h = 96) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true })); sp.renderOrder = 30; sp.userData.noHit = true;
  sp.draw = (t, fg = '#ffffff', bg = 'rgba(14,20,28,0.88)') => { const x = c.getContext('2d'); x.clearRect(0, 0, w, h); x.fillStyle = bg; x.beginPath(); x.roundRect(4, 4, w - 8, h - 8, 22); x.fill(); x.fillStyle = fg; x.font = `700 ${Math.round(h * 0.5)}px "Noto Sans", sans-serif`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(t, w / 2, h / 2 + 2); tex.needsUpdate = true; };
  return sp;
}
// a read-out that follows a value: readout(() => vessel.mix.temp, '°C', () => position)
export function readout(get, unit, at, o = {}) {
  const it = new Item('readout', { name: { en: 'Reading', hi: 'पाठ्यांक', hg: 'Reading' } }); const sp = textSprite(); sp.scale.set(o.w ?? 0.06, (o.w ?? 0.06) * 0.375, 1); it.g.add(sp);
  let last = null; it.height = 0.001; it.radius = 0.001; it.noGrab = true;
  it.update = () => { const p = at(); if (p) it.g.position.copy(p); const v = get(); const t = v == null ? '—' : `${v.toFixed(o.dec ?? 0)} ${unit}`; if (t !== last) { last = t; sp.draw(t, o.fg || '#ffd27a'); } };
  return it;
}

// ------------------------------------------------------------------ digital balance (0.01 g); things put on its pan are weighed
export function balance(o = {}) {
  const it = new Item('balance', { ...o, name: { en: 'Digital balance', hi: 'डिजिटल तुला', hg: 'Digital balance' } });
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.03, 0.16), new THREE.MeshStandardMaterial({ color: 0xe6e8ea, roughness: 0.45 })); body.position.y = 0.015; it.g.add(body);
  const front = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.022, 0.03), new THREE.MeshStandardMaterial({ color: 0x2a3038, roughness: 0.5 })); front.position.set(0, 0.011, 0.082); front.rotation.x = -0.35; it.g.add(front);
  const pan = new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.058, 0.004, 40), steel(0xd0d4d8, 0.25)); pan.position.set(0, 0.032, -0.008); it.g.add(pan);
  const c = document.createElement('canvas'); c.width = 320; c.height = 80; const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const lcd = new THREE.Mesh(new THREE.PlaneGeometry(0.075, 0.019), new THREE.MeshBasicMaterial({ map: tex })); lcd.position.set(-0.02, 0.0125, 0.0975); lcd.rotation.x = -0.35; it.g.add(lcd);
  for (const [i, t] of ['ON', 'TARE'].entries()) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.004, 0.008), new THREE.MeshStandardMaterial({ color: i ? 0x2f7fd0 : 0x3a9a4a, roughness: 0.4 })); b.position.set(0.035 + i * 0.022, 0.017, 0.093); b.rotation.x = -0.35; it.g.add(b); void t; }
  it.panTop = 0.034; it.on = []; it.tareG = 0; it.shown = null; it.settle = 0;
  it.mass = () => it.on.reduce((a, x) => a + (x.glassG ?? 0) + (x.ledger ?? 0) + (x.gram ?? 0), 0);
  it.tare = () => { it.tareG = it.mass(); it.settle = 0.5; };
  const draw = (t) => { const x = c.getContext('2d'); x.fillStyle = '#b9d7a8'; x.fillRect(0, 0, 320, 80); x.fillStyle = '#18240f'; x.font = '700 54px "Courier New", monospace'; x.textAlign = 'right'; x.textBaseline = 'middle'; x.fillText(t, 300, 44); x.font = '700 26px sans-serif'; x.textAlign = 'left'; x.fillText('g', 6, 22); tex.needsUpdate = true; };
  it.update = (dt) => { const m = it.mass() - it.tareG; if (it.settle > 0) it.settle -= dt; const v = it.settle > 0 ? m + (Math.random() - 0.5) * 0.06 : m; const t = (Math.abs(v) < 0.005 ? 0 : v).toFixed(2); if (t !== it.shown) { it.shown = t; draw(t); } };
  it.reading = () => +(it.mass() - it.tareG).toFixed(2);
  draw('0.00'); it.height = 0.034; it.radius = 0.08; it.grabY = 0.02; return it;
}

// ------------------------------------------------------------------ a balloon with baking soda inside; stretched over a flask it fills with the gas
export function balloon(o = {}) {
  const it = new Item('balloon', { ...o, name: { en: 'Balloon with baking soda', hi: 'खाने का सोडा भरा गुब्बारा', hg: 'Baking soda wala gubbara' } });
  const mat = new THREE.MeshPhysicalMaterial({ color: o.color ?? 0xd8323a, roughness: 0.35, clearcoat: 0.6, transparent: true, opacity: 0.92 });
  const pts = [V2(0.0001, 0)]; for (let i = 1; i <= 16; i++) { const t = i / 16; pts.push(V2(Math.max(0.0001, Math.sin(t * Math.PI) * (0.5 + 0.5 * t) * 0.02), t * 0.05)); }
  const body = new THREE.Mesh(new THREE.LatheGeometry(pts, 28), mat); body.rotation.x = Math.PI; body.position.y = 0.06; it.g.add(body); // the neck at the bottom (origin), round end up
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.0065, 0.0065, 0.012, 20, 1, true), mat); neck.position.y = 0.006; it.g.add(neck);
  it.body = body; it.gram = 2; it.k = 0;
  it.setFill = (k) => { it.k = k; const s = 0.55 + 1.5 * Math.min(1.4, k); body.scale.set(s, 0.7 + 1.3 * Math.min(1.4, k), s); body.position.y = 0.012 + 0.048 * (0.7 + 1.3 * Math.min(1.4, k)); };
  it.setFill(0); it.height = 0.06; it.radius = 0.02; it.grabY = 0.03; return it;
}

// ------------------------------------------------------------------ separating funnel with a stopcock; the lower layer runs out first
export function sepFunnel(o = {}) {
  const prof = [[0.0028, 0], [0.0028, 0.05], [0.0045, 0.058], [0.018, 0.075], [0.029, 0.105], [0.026, 0.135], [0.012, 0.155], [0.0095, 0.165], [0.0095, 0.178], [0.0108, 0.18]];
  const v = new Vessel('sepfunnel', prof, { ...o, wall: 0.0012, name: o.name || { en: 'Separating funnel', hi: 'पृथक्कारी कीप', hg: 'Separating funnel' }, cap: 100 });
  const cock = new THREE.Group(); cock.position.y = 0.04; v.g.add(cock);
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.0042, 0.0042, 0.018, 14), glassMat({ opacity: 0.4 })); barrel.rotation.z = Math.PI / 2; barrel.renderOrder = 6; cock.add(barrel);
  const key = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.016, 0.003), new THREE.MeshStandardMaterial({ color: 0x2b6cc4, roughness: 0.4 })); key.position.x = 0.012; cock.add(key);
  const stop = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.0075, 0.012, 16), new THREE.MeshStandardMaterial({ color: 0x2b6cc4, roughness: 0.5 })); stop.position.y = 0.184; v.g.add(stop); v.stopper2 = stop;
  // two layers drawn as their own meshes (water below, oil above)
  const wM = new THREE.MeshPhysicalMaterial({ color: 0xcfe6fb, roughness: 0.05, transparent: true, opacity: 0.42, side: THREE.DoubleSide, depthWrite: false });
  const oM = new THREE.MeshPhysicalMaterial({ color: 0xd9b23a, roughness: 0.08, transparent: true, opacity: 0.78, side: THREE.DoubleSide, depthWrite: false });
  const wMesh = new THREE.Mesh(new THREE.BufferGeometry(), wM), oMesh = new THREE.Mesh(new THREE.BufferGeometry(), oM); for (const m of [wMesh, oMesh]) { m.renderOrder = 5; m.userData.noHit = true; v.g.add(m); }
  const seg = (y0, y1) => { const pts = [V2(0.0001, y0), V2(v.rInner(y0), y0)]; for (const p of v.inner) if (p.y > y0 && p.y < y1) pts.push(V2(p.x, p.y)); pts.push(V2(v.rInner(y1), y1), V2(0.0001, y1)); return new THREE.LatheGeometry(pts, 32); };
  let last = ''; v.open = false; v.sepK = 1; v.drainTo = null;
  v.setOpen = (on) => { v.open = on; key.rotation.z = on ? Math.PI / 2 : 0; };
  v.update0 = v.update.bind(v);
  v.update = (dt) => {
    v.update0(dt); v.liq.visible = false; const m = v.mix; if (!m) return;
    const oil = m.liq.moil || 0, tot = m.ml(); const water = tot - oil; const hw = v.heightFor(water), ht = v.heightFor(tot);
    const mixK = 1 - v.sepK; // just poured: oil drops are spread through the water (cloudy), then they rise
    const key2 = `${hw.toFixed(4)}|${ht.toFixed(4)}|${mixK.toFixed(2)}`;
    if (key2 !== last) { last = key2; wMesh.geometry.dispose(); oMesh.geometry.dispose(); const hs = mixK > 0.02 ? v.heightFor(water + oil * mixK) : hw;
      wMesh.geometry = hs > v.inner[0].y + 0.0003 ? seg(v.inner[0].y, hs) : new THREE.BufferGeometry(); oMesh.geometry = ht > hs + 0.0003 ? seg(hs, ht) : new THREE.BufferGeometry();
      wM.color.setHex(0xcfe6fb).lerp(new THREE.Color(0xe8cf7a), mixK * (oil / Math.max(0.1, tot)) * 2); wM.opacity = 0.42 + 0.35 * mixK; }
    if (v.sepK < 1 && !v.shaking) v.sepK = Math.min(1, v.sepK + dt * (v.lab?.chem?.lapse ?? 1) * 0.06);
    // draining from the stopcock
    if (v.open && tot > 0.01) {
      const lapse = v.lab?.chem?.lapse ?? 1; const wNow = tot - (m.liq.moil || 0); let rate = Math.min(tot, dt * 1.6 * lapse); if (!v.waterOut && wNow > 0.01 && wNow <= rate) { rate = wNow; v.setOpen(false); } const out = { liq: {}, ppt: {}, cloud: 0 }; let left = rate; // the student closes the tap just as the last water runs out
      for (const k of Object.keys(m.liq).sort((a, b) => (a === 'moil' ? 1 : 0) - (b === 'moil' ? 1 : 0))) { if (left <= 0) break; const d = Math.min(m.liq[k], left); m.liq[k] -= d; left -= d; out.liq[k] = d; if (m.liq[k] < 1e-6) delete m.liq[k]; }
      v.ml = m.ml(); const t = v.drainTo; const tip = v.g.localToWorld(tmp.set(0, 0.001, 0)).clone();
      if (t) { t.mix.put(out, rate); t.ml = t.mix.ml(); const land = V3(tip.x, Math.max(t.levelWorld(), t.g.localToWorld(V3(0, t.inner[0].y, 0)).y), tip.z); v.lab && v.lab.fx.stream('sep' + v.id, tip, land, out.liq.moil ? new THREE.Color(0xd9b23a) : new THREE.Color(0xcfe6fb), 0.0008); }
      const wLeft = Object.entries(m.liq).filter(([k]) => k !== 'moil').reduce((a, [, x]) => a + x, 0);
      if (wLeft < 0.4 && !v.waterOut) { v.waterOut = true; v.lab && v.lab.emit('water_out', { v: v.id }); }
    }
  };
  stop.visible = false; v.grabY = 0.1; return v;
}
// laboratory stand with a ring (for the separating funnel) or a clamp (for a flask)
export function labStand(h = 0.3, o = {}) {
  const it = new Item('stand', { ...o, name: { en: 'Laboratory stand', hi: 'प्रयोगशाला स्टैंड', hg: 'Lab stand' } });
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.01, 0.16), new THREE.MeshStandardMaterial({ color: 0x2b2f35, roughness: 0.6 })); base.position.y = 0.005; it.g.add(base);
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.0045, 0.0045, h, 12), steel()); rod.position.set(-0.03, h / 2, -0.05); it.g.add(rod);
  it.ring = (y, r, x = 0.0, z = 0) => { const arm = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.004, 0.05 + z), steel()); arm.position.set(-0.03, y, -0.025 + z / 2); it.g.add(arm); const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.0022, 8, 32), steel()); ring.rotation.x = Math.PI / 2; ring.position.set(x, y, z); it.g.add(ring); return ring; };
  it.clamp = (y, len = 0.06) => { const arm = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.006, len), steel(0x9aa0a6)); arm.position.set(-0.03, y, -0.05 + len / 2); it.g.add(arm); const jaw = new THREE.Mesh(new THREE.TorusGeometry(0.011, 0.0025, 8, 20), new THREE.MeshStandardMaterial({ color: 0x8a5a33, roughness: 0.7 })); jaw.rotation.x = Math.PI / 2; jaw.position.set(-0.03, y, -0.05 + len); it.g.add(jaw); return jaw; };
  it.height = h; it.radius = 0.06; it.grabY = h * 0.5; return it;
}

// ------------------------------------------------------------------ distillation: round-bottom flask (with side arm) and a Liebig condenser
export function rbFlask(o = {}) {
  const R = 0.034; const prof = [];
  for (let i = 0; i <= 14; i++) { const a = -Math.PI / 2 + (i / 14) * (Math.PI / 2 + 1.25); prof.push([Math.max(0.0001, Math.cos(a) * R), R + Math.sin(a) * R]); }
  prof.push([0.0105, 0.084], [0.0105, 0.14], [0.0115, 0.142]);
  const v = new Vessel('rbflask', prof, { ...o, wall: 0.0014, name: o.name || { en: 'Distillation flask', hi: 'आसवन फ्लास्क', hg: 'Distillation flask' }, cap: 150 });
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.0035, 0.0035, 0.05, 12), glassMat({ opacity: 0.28 })); arm.position.set(0.024, 0.122, 0); arm.rotation.z = -1.89; arm.renderOrder = 6; v.g.add(arm);
  const cork = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.0095, 0.014, 16), new THREE.MeshStandardMaterial({ color: 0xb08850, roughness: 0.9 })); cork.position.y = 0.138; v.g.add(cork);
  v.armEnd = V3(0.047, 0.113, 0); v.cork = cork; cork.visible = false; v.grabY = 0.1; return v;
}
export function condenser(from, to, o = {}) { // a straight glass tube in a water jacket, from one world point to another
  const it = new Item('condenser', { ...o, name: { en: 'Liebig condenser (cold water flows in the jacket)', hi: 'लीबिग संघनित्र (बाहरी नली में ठंडा पानी बहता है)', hg: 'Liebig condenser (jacket mein thanda paani)' } });
  const d = to.clone().sub(from); const L = d.length(); const mid = from.clone().add(to).multiplyScalar(0.5); const q = new THREE.Quaternion().setFromUnitVectors(V3(0, 1, 0), d.clone().normalize());
  const inner = new THREE.Mesh(new THREE.CylinderGeometry(0.0034, 0.0034, L, 12, 1, true), glassMat({ opacity: 0.3 })); inner.renderOrder = 7; it.g.add(inner);
  const jacket = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, L * 0.72, 20, 1, true), glassMat({ opacity: 0.18 })); jacket.renderOrder = 6; it.g.add(jacket);
  const water = new THREE.Mesh(new THREE.CylinderGeometry(0.0103, 0.0103, L * 0.72, 20, 1, true), new THREE.MeshBasicMaterial({ color: 0x9fd0ff, transparent: true, opacity: 0.16, depthWrite: false, side: THREE.DoubleSide })); water.renderOrder = 5; it.g.add(water);
  for (const s of [-1, 1]) { const nub = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.016, 10), glassMat({ opacity: 0.3 })); nub.position.set(0.013, s * L * 0.3, 0); nub.rotation.z = Math.PI / 2; it.g.add(nub); const hose = new THREE.Mesh(new THREE.CylinderGeometry(0.0035, 0.0035, 0.05, 10), new THREE.MeshStandardMaterial({ color: 0xb04a3a, roughness: 0.6 })); hose.position.set(0.024, s * L * 0.3 + (s < 0 ? -0.025 : 0.025), 0); it.g.add(hose); }
  it.g.position.copy(mid); it.g.quaternion.copy(q); it.p0 = mid.clone(); it.q0 = q.clone(); it.placed = true; it.endWorld = to.clone();
  it.height = 0.01; it.radius = 0.02; it.grabY = 0; it.noGrab = true; return it;
}

// ------------------------------------------------------------------ centrifuge: tubes spin fast and the heavier part is pushed to the bottom
export function centrifuge(o = {}) {
  const it = new Item('centrifuge', { ...o, name: { en: 'Centrifuge machine', hi: 'अपकेंद्रण मशीन (सेंट्रीफ्यूज)', hg: 'Centrifuge machine' } });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.08, 0.07, 40), new THREE.MeshStandardMaterial({ color: 0xe8ebee, roughness: 0.4 })); body.position.y = 0.035; it.g.add(body);
  const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.064, 0.064, 0.004, 40), new THREE.MeshStandardMaterial({ color: 0x3a4048, roughness: 0.5 })); bowl.position.y = 0.0705; it.g.add(bowl);
  const panel = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.03, 0.01), new THREE.MeshStandardMaterial({ color: 0x2a3038, roughness: 0.5 })); panel.position.set(0, 0.03, 0.079); it.g.add(panel);
  const led = new THREE.Mesh(new THREE.SphereGeometry(0.003, 8, 6), new THREE.MeshStandardMaterial({ color: 0x40ff60, emissive: 0x40ff60, emissiveIntensity: 0 })); led.position.set(-0.015, 0.035, 0.085); it.g.add(led);
  const rotor = new THREE.Group(); rotor.position.y = 0.072; it.g.add(rotor);
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.052, 0.012, 32), steel(0xaeb4ba, 0.35)); hub.position.y = 0.006; rotor.add(hub);
  it.slots = [0, 1, 2, 3].map((i) => { const a = (i / 4) * Math.PI * 2; const g = new THREE.Group(); g.position.set(Math.cos(a) * 0.034, 0.008, Math.sin(a) * 0.034); g.rotation.set(0, -a, 0); const hole = new THREE.Mesh(new THREE.CircleGeometry(0.0085, 16), new THREE.MeshBasicMaterial({ color: 0x111111 })); hole.rotation.x = -Math.PI / 2; hole.position.y = 0.0042; g.add(hole); rotor.add(g); return g; });
  const lid = new THREE.Group(); lid.position.set(0, 0.07, -0.075); it.g.add(lid);
  const lidM = new THREE.Mesh(new THREE.SphereGeometry(0.075, 36, 14, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshPhysicalMaterial({ color: 0x3a6a9a, roughness: 0.2, transparent: true, opacity: 0.4, side: THREE.DoubleSide, depthWrite: false })); lidM.scale.y = 0.62; lidM.position.set(0, 0, 0.075); lidM.renderOrder = 7; lid.add(lidM);
  it.rotor = rotor; it.lid = lid; it.spin = 0; it.target = 0; it.lidOpen = true; lid.rotation.x = -1.6;
  it.setLid = (open) => { it.lidOpen = open; };
  it.update = (dt) => { lid.rotation.x += ((it.lidOpen ? -1.6 : 0) - lid.rotation.x) * Math.min(1, dt * 5); it.spin += (it.target - it.spin) * Math.min(1, dt * 0.8); rotor.rotation.y += it.spin * dt; led.material.emissiveIntensity = it.target > 0 ? 1.5 : 0; if (it.spin > 5 && it.lab) it.lab.audio && it.lab.audio.tone && Math.random() < dt * 2 && it.lab.audio.tone(90 + it.spin * 2, 0.4, 0.015, 'sawtooth'); };
  it.height = 0.075; it.radius = 0.08; it.grabY = 0.04; return it;
}
// a cream layer that collects at the top of a tube of milk after spinning
export function creamLayer(t) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 20), new THREE.MeshStandardMaterial({ color: 0xf2dc96, roughness: 0.85 })); m.visible = false; m.userData.noHit = true; t.g.add(m);
  t.setCream = (k) => { t.cream = k; if (k <= 0) { m.visible = false; return; } const top = t.heightFor(t.ml); const bot = t.heightFor(t.ml * (1 - 0.22 * k)); const r = t.rInner(top) - 0.0004; m.visible = true; m.scale.set(r, Math.max(0.0005, top - bot), r); m.position.y = (top + bot) / 2; };
  return m;
}

// ------------------------------------------------------------------ copper sulphate crystals growing on the bottom of a beaker
export function crystalBed(v, o = {}) {
  const N = o.n ?? 26; const mat = new THREE.MeshPhysicalMaterial({ color: 0x1f8fd8, roughness: 0.15, clearcoat: 1, transparent: true, opacity: 0.92, flatShading: true });
  const geo = new THREE.OctahedronGeometry(1, 0); geo.scale(1, 0.55, 0.75);
  const im = new THREE.InstancedMesh(geo, mat, N); im.count = 0; im.userData.noHit = true; v.g.add(im);
  const R = v.rInner(v.inner[0].y + 0.004) * 0.85; const seeds = [];
  for (let i = 0; i < N; i++) { const a = Math.random() * 6.283, r = R * Math.sqrt(Math.random()); seeds.push({ p: V3(Math.cos(a) * r, v.inner[0].y + 0.0015, Math.sin(a) * r), q: new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.random() * 0.6, Math.random() * 6, Math.random() * 0.6)), k: 0.5 + Math.random() }); }
  const M = new THREE.Matrix4(), S = V3(1, 1, 1);
  v.xtalBed = (g) => { const n = Math.min(N, Math.ceil(g * 4)); im.count = n; for (let i = 0; i < n; i++) { const s = seeds[i]; const sz = Math.min(0.0055, 0.0012 + 0.0011 * Math.sqrt(Math.max(0, g)) * s.k); M.compose(V3(s.p.x, s.p.y + sz * 0.3, s.p.z), s.q, S.set(sz, sz, sz)); im.setMatrixAt(i, M); } im.instanceMatrix.needsUpdate = true; };
  return im;
}
// the stain that stays on a watch glass when ink dries
export function residueSpot(v, r = 0.02) {
  const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'); const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(new THREE.CircleGeometry(r, 32), new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: 0.6, depthWrite: false })); m.rotation.x = -Math.PI / 2; m.position.y = v.inner[0].y + 0.0006; m.renderOrder = 5; m.userData.noHit = true; v.g.add(m);
  v.setResidue = (k, col) => { x.clearRect(0, 0, 128, 128); const g = x.createRadialGradient(64, 64, 6, 64, 64, 62); const cc = new THREE.Color(col || '#1b2a6b'); const rgb = `${Math.round(cc.r * 255)},${Math.round(cc.g * 255)},${Math.round(cc.b * 255)}`; g.addColorStop(0, `rgba(${rgb},${0.55 * k})`); g.addColorStop(0.75, `rgba(${rgb},${0.8 * k})`); g.addColorStop(0.9, `rgba(${rgb},${0.95 * k})`); g.addColorStop(1, `rgba(${rgb},0)`); x.fillStyle = g; x.beginPath(); x.arc(64, 64, 62, 0, 7); x.fill(); tex.needsUpdate = true; };
  v.setResidue(0); return m;
}
export function block(w = 0.06, h = 0.08, d = 0.06, o = {}) { // a wooden block to stand something higher
  const it = new Item('block', { ...o, name: o.name || { en: 'Wooden block', hi: 'लकड़ी का गुटका', hg: 'Lakdi ka block' } });
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial({ map: woodTex('#8a5a33'), roughness: 0.7 })); m.position.y = h / 2; it.g.add(m);
  it.top = h; it.height = h; it.radius = Math.max(w, d) / 2; it.grabY = h / 2; return it;
}
void canvasTex;
