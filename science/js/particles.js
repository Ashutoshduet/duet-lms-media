// "See it inside": an original particle-level animation shown after an experiment — what the atoms, ions and
// molecules are doing that we cannot see with our eyes. Lives in the lab scene (works the same on screen and in VR).
import * as THREE from 'three';
import { FONT, tx } from './strings.js';

// element colours (close to the usual CPK colours) and sizes (metres, scene is magnified)
const EL = {
  H: ['#f2f2f2', 0.0075], O: ['#e0392f', 0.011], C: ['#40444b', 0.011], N: ['#3b6fe0', 0.011], S: ['#f0c419', 0.013], Cl: ['#3cc26f', 0.013],
  Na: ['#9d6ae0', 0.014], K: ['#8a55d4', 0.015], Ca: ['#86b494', 0.014], Mg: ['#5db86b', 0.013], Fe: ['#cf7a3a', 0.013], Cu: ['#c8733a', 0.013],
  Zn: ['#8193ad', 0.013], Pb: ['#596378', 0.015], I: ['#7a2f95', 0.015], Ba: ['#2db3a4', 0.015], Al: ['#c9a3b0', 0.013], Mn: ['#9c27b0', 0.012],
  X: ['#ffffff', 0.012],
};
const s = 0.011; // bond length in the drawings
// species: atoms [element, x, y, z] and a label
const SP = {
  'H+': { a: [['H', 0, 0]], l: 'H⁺' }, 'OH-': { a: [['O', 0, 0], ['H', s, s * 0.5]], l: 'OH⁻' }, H2O: { a: [['O', 0, 0], ['H', -s, s * 0.7], ['H', s, s * 0.7]], l: 'H₂O' },
  H2: { a: [['H', -s * 0.5, 0], ['H', s * 0.5, 0]], l: 'H₂' }, O2: { a: [['O', -s * 0.6, 0], ['O', s * 0.6, 0]], l: 'O₂' }, CO2: { a: [['C', 0, 0], ['O', -s * 1.2, 0], ['O', s * 1.2, 0]], l: 'CO₂' },
  SO2: { a: [['S', 0, 0], ['O', -s * 1.2, s * 0.6], ['O', s * 1.2, s * 0.6]], l: 'SO₂' }, SO3: { a: [['S', 0, 0], ['O', -s * 1.2, s * 0.5], ['O', s * 1.2, s * 0.5], ['O', 0, -s * 1.3]], l: 'SO₃' },
  NO2: { a: [['N', 0, 0], ['O', -s * 1.1, s * 0.6], ['O', s * 1.1, s * 0.6]], l: 'NO₂', tint: '#a0522d' },
  'Pb2+': { a: [['Pb', 0, 0]], l: 'Pb²⁺' }, 'I-': { a: [['I', 0, 0]], l: 'I⁻' }, 'K+': { a: [['K', 0, 0]], l: 'K⁺' }, 'Na+': { a: [['Na', 0, 0]], l: 'Na⁺' }, 'Cl-': { a: [['Cl', 0, 0]], l: 'Cl⁻' },
  'NO3-': { a: [['N', 0, 0], ['O', 0, s * 1.2], ['O', -s, -s * 0.7], ['O', s, -s * 0.7]], l: 'NO₃⁻' },
  'SO42-': { a: [['S', 0, 0], ['O', 0, s * 1.3], ['O', 0, -s * 1.3], ['O', -s * 1.3, 0], ['O', s * 1.3, 0]], l: 'SO₄²⁻' },
  'CO32-': { a: [['C', 0, 0], ['O', 0, s * 1.2], ['O', -s, -s * 0.7], ['O', s, -s * 0.7]], l: 'CO₃²⁻' },
  'Ba2+': { a: [['Ba', 0, 0]], l: 'Ba²⁺' }, 'Ca2+': { a: [['Ca', 0, 0]], l: 'Ca²⁺' }, 'Mg2+': { a: [['Mg', 0, 0]], l: 'Mg²⁺' }, 'Zn2+': { a: [['Zn', 0, 0]], l: 'Zn²⁺' },
  'Fe2+': { a: [['Fe', 0, 0]], l: 'Fe²⁺', halo: '#9ccf7a' }, 'Cu2+': { a: [['Cu', 0, 0]], l: 'Cu²⁺', halo: '#2f86e8' },
  Zn: { a: [['Zn', 0, 0]], l: 'Zn' }, Fe: { a: [['Fe', 0, 0]], l: 'Fe' }, Cu: { a: [['Cu', 0, 0]], l: 'Cu' }, Mg: { a: [['Mg', 0, 0]], l: 'Mg' }, Al: { a: [['Al', 0, 0]], l: 'Al' },
  MgO: { a: [['Mg', -s * 0.6, 0], ['O', s * 0.6, 0]], l: 'MgO' }, CaO: { a: [['Ca', -s * 0.6, 0], ['O', s * 0.6, 0]], l: 'CaO' },
  'MnO4-': { a: [['Mn', 0, 0], ['O', 0, s], ['O', 0, -s], ['O', -s, 0], ['O', s, 0]], l: 'MnO₄⁻', halo: '#b03ac8' },
  sugar: { a: [['C', -s, 0], ['C', 0, s * 0.8], ['C', s, 0], ['O', 0, -s * 0.8], ['H', -s * 1.8, s * 0.4], ['O', s * 1.9, s * 0.3]], l: 'C₁₂H₂₂O₁₁' },
  C: { a: [['C', 0, 0]], l: 'C' }, NH3: { a: [['N', 0, 0], ['H', -s, s * 0.5], ['H', s, s * 0.5], ['H', 0, -s]], l: 'NH₃' }, HCl: { a: [['H', -s * 0.5, 0], ['Cl', s * 0.5, 0]], l: 'HCl' },
  NH4Cl: { a: [['N', -s * 0.7, 0], ['Cl', s * 0.8, 0], ['H', -s * 1.5, s * 0.6]], l: 'NH₄Cl' }, sand: { a: [['X', 0, 0]], l: '', big: 3.2, col: '#c2a878' },
  milk: { a: [['X', 0, 0]], l: '', big: 2.2, col: '#f4f1e8' }, dye: { a: [['X', 0, 0]], l: '' }, ind: { a: [['X', 0, 0]], l: '', big: 1.3 },
  CH3COO: { a: [['C', -s * 0.6, 0], ['C', s * 0.6, 0], ['O', s * 1.4, s * 0.8], ['O', s * 1.4, -s * 0.8]], l: 'CH₃COO⁻' }, 'HCO3-': { a: [['C', 0, 0], ['O', 0, s * 1.2], ['O', -s, -s * 0.7], ['O', s, -s * 0.7], ['H', s * 1.8, -s * 1.1]], l: 'HCO₃⁻' },
};
const C3 = (h) => new THREE.Color(h);
const MATS = {}; const mat = (hex) => MATS[hex] || (MATS[hex] = new THREE.MeshStandardMaterial({ color: hex, roughness: 0.35, metalness: 0.05 }));
const BALL = new THREE.SphereGeometry(1, 16, 12);
const BX = 0.21, BY = 0.165; // the box the particles move in (half sizes)
const rnd = (a, b) => a + Math.random() * (b - a);
export const CAPS = []; // every caption (the voice generator reads this list)
const L3 = (en, hi, hg) => { const o = { en, hi, hg }; CAPS.push(o); return o; };

class Part {
  constructor(V, sp, x, y, o = {}) {
    const S = SP[sp] || SP.X; this.sp = sp; this.V = V; this.g = new THREE.Group(); this.g.position.set(x, y, rnd(-0.02, 0.02));
    for (const [e, ax, ay, az = 0] of S.a) {
      const [c, r] = EL[e] || EL.X; const m = new THREE.Mesh(BALL, mat(o.col || S.col || c)); m.scale.setScalar(r * (S.big || 1) * (o.size || 1)); m.position.set(ax, ay, az); this.g.add(m);
    }
    if (S.halo || o.halo) { const h = new THREE.Mesh(BALL, new THREE.MeshBasicMaterial({ color: o.halo || S.halo, transparent: true, opacity: 0.22, depthWrite: false })); h.scale.setScalar(0.024); this.g.add(h); this.halo = h; }
    this.vel = new THREE.Vector3(rnd(-1, 1), rnd(-1, 1), 0).multiplyScalar(0.03); this.mode = o.mode || 'free'; this.side = o.side || 0; this.tempK = o.tempK || 1; this.target = null; this.speed = 0.12; this.follow = null; this.alpha = 1;
    this.g.rotation.z = rnd(0, 6.28); V.box.add(this.g);
    if (o.label) this.labelIt(o.label === true ? S.l : o.label);
  }
  labelIt(t) { if (this.lab) this.g.remove(this.lab); if (!t) return; this.lab = this.V.sprite(t); this.lab.position.set(0, 0.026, 0.02); this.g.add(this.lab); }
  recolor(hex) { this.g.children.forEach((m) => { if (m.isMesh && m !== this.halo && m.material !== undefined && !m.isSprite) m.material = mat(hex); }); }
  go(x, y, speed = 0.12) { this.target = new THREE.Vector3(x, y, 0); this.mode = 'go'; this.speed = speed; this.follow = null; }
}

export class ParticleView {
  constructor(app) {
    this.app = app; this.g = new THREE.Group(); this.g.visible = false; app.scene.add(this.g);
    this.g.position.set(0, 1.36, -0.68); this.tok = 0; this.parts = []; this.temp = 1; this.playing = false;
    const back = new THREE.Mesh(new THREE.CircleGeometry(0.3, 64), new THREE.MeshBasicMaterial({ color: 0x0b1018, transparent: true, opacity: 0.94 })); back.position.z = -0.05; this.g.add(back); this.back = back;
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.008, 12, 96), new THREE.MeshStandardMaterial({ color: 0xf0a65a, metalness: 0.5, roughness: 0.3 })); rim.position.z = -0.045; this.g.add(rim);
    const glow = new THREE.Mesh(new THREE.CircleGeometry(0.29, 64), new THREE.MeshBasicMaterial({ color: 0xff8a3a, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })); glow.position.z = -0.044; this.g.add(glow); this.glow = glow;
    this.box = new THREE.Group(); this.g.add(this.box);
    const lc = document.createElement('canvas'); lc.width = 1024; lc.height = 300; this.capC = lc; this.capT = new THREE.CanvasTexture(lc); this.capT.colorSpace = THREE.SRGBColorSpace;
    const cap = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.18), new THREE.MeshBasicMaterial({ map: this.capT, transparent: true, depthWrite: false, depthTest: false })); cap.position.set(0, -0.385, -0.03); cap.renderOrder = 25; this.g.add(cap); // always readable, even with apparatus in front
    const tc = document.createElement('canvas'); tc.width = 1024; tc.height = 90; this.titC = tc; this.titT = new THREE.CanvasTexture(tc); this.titT.colorSpace = THREE.SRGBColorSpace;
    const tit = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.055), new THREE.MeshBasicMaterial({ map: this.titT, transparent: true, depthWrite: false, depthTest: false })); tit.position.set(0, 0.345, -0.03); tit.renderOrder = 25; this.g.add(tit);
    const amb = new THREE.PointLight(0xffffff, 0.35, 1.2, 2); amb.position.set(0.1, 0.2, 0.4); this.g.add(amb);
    // the light beam (Tyndall) and the paper strip (chromatography) are made when needed
  }
  L() { return this.app.lang; }
  sprite(t) {
    const c = document.createElement('canvas'); c.width = 256; c.height = 80; const x = c.getContext('2d');
    x.font = `700 46px ${FONT}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.lineWidth = 8; x.strokeStyle = 'rgba(0,0,0,0.75)'; x.strokeText(t, 128, 42); x.fillStyle = '#ffffff'; x.fillText(t, 128, 42);
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true })); sp.scale.set(0.05, 0.0156, 1); sp.renderOrder = 30; return sp;
  }
  title(t) { const x = this.titC.getContext('2d'); x.clearRect(0, 0, 1024, 90); x.font = `700 46px ${FONT}`; const tw = Math.min(1000, x.measureText('🔬 ' + t).width) + 60; x.fillStyle = 'rgba(11,16,24,0.85)'; x.beginPath(); x.roundRect(512 - tw / 2, 6, tw, 80, 40); x.fill(); x.fillStyle = '#f0a65a'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('🔬 ' + t, 512, 46, 1000); this.titT.needsUpdate = true; }
  caption(o) {
    const t = tx(o, this.L()); const x = this.capC.getContext('2d'); x.clearRect(0, 0, 1024, 300);
    x.fillStyle = 'rgba(11,16,24,0.88)'; x.beginPath(); x.roundRect(4, 4, 1016, 292, 26); x.fill();
    x.font = `500 40px ${FONT}`; x.fillStyle = '#f2ede4'; x.textAlign = 'center'; x.textBaseline = 'top';
    const words = t.split(' '); const lines = []; let cur = '';
    for (const w of words) { const n = cur ? cur + ' ' + w : w; if (x.measureText(n).width > 960 && cur) { lines.push(cur); cur = w; } else cur = n; } if (cur) lines.push(cur);
    lines.slice(0, 5).forEach((l, i) => x.fillText(l, 512, 30 + i * 52 + (5 - Math.min(5, lines.length)) * 26)); this.capT.needsUpdate = true;
    this.app.narrate && this.app.narrate([tx(o, this.app.voiceLang())]); this.capP = this.app.audio.voice ? this.app._narr : null; this.lastCap = o; this.app.ui.dirty = true;
  }
  add(sp, x, y, o) { const p = new Part(this, sp, x, y, o); this.parts.push(p); return p; }
  spawn(sp, n, x0, x1, y0, y1, o = {}) { const out = []; for (let i = 0; i < n; i++) out.push(this.add(sp, rnd(x0, x1), rnd(y0, y1), { ...o, label: o.label && i === 0 })); return out; }
  remove(p) { const i = this.parts.indexOf(p); if (i >= 0) this.parts.splice(i, 1); p.fading = 1; this.box.add(p.g); this.dying.push(p); }
  bond(a, b, dx, dy) { b.follow = { p: a, off: new THREE.Vector3(dx, dy, 0) }; b.mode = 'follow'; }
  async wait(sec) {
    const tok = this.tok; const end = this.t + sec; const talk = this.capP; this.capP = null; let said = !talk; if (talk) talk.then(() => { said = true; });
    while (this.t < end || !said) { await new Promise((r) => setTimeout(r, 50)); if (tok !== this.tok) throw new Error('stop'); }
  }
  heat(k) { this.glowTarget = k; }
  clear() { for (const p of [...this.parts, ...(this.dying || [])]) this.box.remove(p.g); this.parts = []; this.dying = []; this.temp = 1; this.glowTarget = 0; this.extra && this.extra.forEach((m) => this.box.remove(m)); this.extra = []; this.walls = null; }
  async play(e) {
    const tpl = SCRIPTS[e.id]; if (!tpl) return false;
    this.tok++; const tok = this.tok; this.clear(); this.t = 0; this.g.visible = true; this.playing = true; this.app.ui.dirty = true;
    this.title(tx({ en: 'Inside the reaction', hi: 'अभिक्रिया के अंदर', hg: 'Reaction ke andar' }, this.L()));
    this.place(); this.app.onParticles && this.app.onParticles(true);
    try { await tpl(this); await this.wait(1.2); } catch (err) { if (tok !== this.tok) return false; console.warn(err); }
    if (tok === this.tok) { this.playing = false; this.app.onParticles && this.app.onParticles(false, true); }
    return true;
  }
  close() { this.tok++; this.playing = false; this.g.visible = false; this.clear(); this.app.audio.stop(); this.app.onParticles && this.app.onParticles(false); }
  place() { // above the bench, facing the student (in VR: in front of the head)
    const xr = this.app.renderer.xr.isPresenting;
    if (xr) { const cam = this.app.renderer.xr.getCamera(); const p = new THREE.Vector3(); cam.getWorldPosition(p); this.g.position.set(p.x * 0.3, Math.max(1.25, p.y - 0.05), -0.62); this.g.lookAt(p.x, p.y, p.z); }
    else { this.g.position.set(0, 1.36, -0.68); this.g.rotation.set(0, 0, 0); }
  }
  update(dt) {
    if (!this.g.visible) return; dt *= this.app.speed || 1; this.t += dt;
    this.glow.material.opacity += ((this.glowTarget || 0) * 0.35 - this.glow.material.opacity) * Math.min(1, dt * 2);
    const T = this.temp;
    for (const p of this.parts) {
      const P = p.g.position;
      if (p.mode === 'free') {
        const TK = T * p.tempK; p.vel.x += rnd(-1, 1) * dt * 0.25 * TK; p.vel.y += rnd(-1, 1) * dt * 0.25 * TK; p.vel.multiplyScalar(1 - dt * 0.8);
        const vmax = 0.035 * TK; if (p.vel.length() > vmax) p.vel.setLength(vmax);
        P.addScaledVector(p.vel, dt); const w = this.walls || { x0: -BX, x1: BX, y0: -BY, y1: BY };
        if (P.x < w.x0) { P.x = w.x0; p.vel.x = Math.abs(p.vel.x); } if (P.x > w.x1) { P.x = w.x1; p.vel.x = -Math.abs(p.vel.x); }
        if (P.y < w.y0) { P.y = w.y0; p.vel.y = Math.abs(p.vel.y); } if (P.y > w.y1) { P.y = w.y1; p.vel.y = -Math.abs(p.vel.y); }
        if (p.side < 0 && P.x > -0.012) { P.x = -0.012; p.vel.x = -Math.abs(p.vel.x); } if (p.side > 0 && P.x < 0.012) { P.x = 0.012; p.vel.x = Math.abs(p.vel.x); }
        p.g.rotation.z += dt * p.vel.x * 8;
      } else if (p.mode === 'go') {
        const d = p.target.clone().sub(P); const L = d.length(); const st = p.speed * dt;
        if (L <= st) { P.copy(p.target); p.mode = p.after || 'fixed'; p.onArrive && p.onArrive(); p.onArrive = null; } else P.addScaledVector(d, st / L);
      } else if (p.mode === 'follow' && p.follow) { P.copy(p.follow.p.g.position).add(p.follow.off); }
      else if (p.mode === 'rise') { P.y += dt * (p.riseV || 0.06); P.x += Math.sin(this.t * 3 + p.g.id) * dt * 0.01; if (P.y > BY + 0.03) this.remove(p); }
    }
    for (const p of this.dying || []) { p.fading -= dt * 1.5; const k = Math.max(0, p.fading); p.g.scale.setScalar(Math.max(0.001, k)); if (k <= 0) this.box.remove(p.g); }
    this.dying = (this.dying || []).filter((p) => p.fading > 0);
  }
  // helpers used by several scripts
  metalSurface(el, n = 9, y = -BY + 0.012) { const out = []; for (let r = 0; r < 2; r++) for (let i = 0; i < n; i++) out.push(this.add(el, -BX + 0.02 + i * (2 * BX - 0.04) / (n - 1) + (r % 2) * 0.012, y + r * 0.024, { mode: 'fixed', label: r === 1 && i === Math.floor(n / 2) })); return out; }
  lattice(list, cx, cy, cols, sp = 0.028, speed = 0.12) { list.forEach((p, i) => { const x = cx + ((i % cols) - (cols - 1) / 2) * sp; const y = cy + Math.floor(i / cols) * sp * 0.9; p.go(x, y, speed); }); }
  nearestFree(list, P) { let best = null, bd = 1e9; for (const q of list) { if (q.mode !== 'free') continue; const d = q.g.position.distanceTo(P); if (d < bd) { bd = d; best = q; } } return best; }
  beam(on, y = 0) { if (!this.beamM) { this.beamM = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 2 * BX + 0.08, 16, 1, true), new THREE.MeshBasicMaterial({ color: 0xfff1b8, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })); this.beamM.rotation.z = Math.PI / 2; this.box.add(this.beamM); } this.beamM.position.y = y; this.beamM.material.opacity = on; }
}

// ======================================================================================== scripts
// Each script tells the story in 2–4 short scenes with a caption (English / Hindi / Hinglish).
const W2 = (V, s) => V.wait(s);

async function precipitate(V, o) { // A⁺ + B⁻ → solid (stays) + spectator ions (keep moving)
  const cats = V.spawn(o.cat, o.nc, -BX, -0.03, -0.1, BY, { label: true, side: -1 }); const sa = V.spawn(o.catPartner, o.nc * o.ratio, -BX, -0.03, -0.1, BY, { label: true, side: -1 });
  const ans = V.spawn(o.an, o.nc * o.ratio, 0.03, BX, -0.1, BY, { label: true, side: 1 }); const sb = V.spawn(o.anPartner, o.nc * o.ratio, 0.03, BX, -0.1, BY, { label: true, side: 1 });
  V.caption(o.c1); await W2(V, 5);
  for (const p of [...cats, ...sa, ...ans, ...sb]) p.side = 0; // the two solutions are mixed
  V.caption(o.c2); await W2(V, 3.5);
  const solid = [];
  for (const c of cats) { // each cation catches its anions, and the group sinks to the bottom
    const grab = []; for (let k = 0; k < o.ratio; k++) { const a = V.nearestFree(ans, c.g.position); if (a) { a.mode = 'held'; grab.push(a); } }
    c.mode = 'held'; c.labelIt(null); grab.forEach((a) => a.labelIt(null));
    grab.forEach((a, k) => { a.go(c.g.position.x + (k ? -0.016 : 0.016), c.g.position.y + 0.006, 0.08); a.onArrive = () => V.bond(c, a, k ? -0.016 : 0.016, 0.006); });
    solid.push(c); await W2(V, 0.35);
  }
  await W2(V, 1);
  V.lattice(solid, 0, -BY + 0.016, Math.min(6, solid.length), 0.05, 0.06);
  for (const c of solid) { c.recolor(o.solidCol); }
  for (const a of ans) if (a.follow) a.recolor(o.solidCol);
  await W2(V, 3.5); solid[Math.floor(solid.length / 2)].labelIt(o.prodLabel);
  V.caption(o.c3); await W2(V, 7);
}
async function metalGas(V, o) { // metal atoms give electrons to H⁺ ions: H₂ bubbles up, metal ions go into the water
  const surf = V.metalSurface(o.metal, 9);
  const hs = V.spawn(o.hion || 'H+', o.nh || 14, -BX, BX, -0.06, BY, { label: true }); V.spawn(o.spect, o.ns || 6, -BX, BX, -0.04, BY, { label: true });
  V.caption(o.c1); await W2(V, 5); V.caption(o.c2);
  const top = surf.filter((p, i) => i >= 9);
  for (let k = 0; k < (o.rounds || 4); k++) {
    const m = top[(k * 3 + 1) % top.length]; if (!m || m.mode !== 'fixed') continue;
    const a = V.nearestFree(hs, m.g.position), b = a && (a.mode = 'held', V.nearestFree(hs, m.g.position));
    if (!a || !b) break; b.mode = 'held';
    const mp = m.g.position; a.go(mp.x - 0.012, mp.y + 0.022, 0.1); b.go(mp.x + 0.012, mp.y + 0.022, 0.1);
    await W2(V, 1.6);
    const h2 = V.add('H2', mp.x, mp.y + 0.024, { label: k === 0 }); V.remove(a); V.remove(b); h2.mode = 'rise'; h2.riseV = 0.05;
    m.labelIt(null); V.remove(m); const ion = V.add(o.ion, mp.x, mp.y + 0.005, { label: k === 0 }); ion.vel.set(rnd(-0.02, 0.02), 0.03, 0);
    if (o.heat) V.heat(Math.min(1, (k + 1) * 0.25));
    await W2(V, 1.2);
  }
  V.caption(o.c3); await W2(V, 7);
}
async function displacement(V, o) { // a more reactive metal pushes a less reactive metal out of its salt
  const surf = V.metalSurface(o.metal, 9);
  const ions = V.spawn(o.ionIn, 8, -BX, BX, -0.05, BY, { label: true }); V.spawn('SO42-', 8, -BX, BX, -0.05, BY, { label: true });
  V.caption(o.c1); await W2(V, 5); V.caption(o.c2);
  const top = surf.slice(9); const out = [];
  for (let k = 0; k < 6; k++) {
    const m = top[k + 1]; const c = V.nearestFree(ions, m.g.position); if (!c) break; c.mode = 'held';
    const mp = m.g.position.clone(); c.go(mp.x, mp.y + 0.024, 0.1); await W2(V, 1.4);
    m.labelIt(null); V.remove(m); const ion = V.add(o.ionOut, mp.x, mp.y + 0.004, { label: k === 0 }); ion.vel.set(rnd(-0.02, 0.02), 0.03, 0); out.push(ion);
    c.labelIt(null); V.remove(c); const dep = V.add(o.deposit, mp.x, mp.y + 0.024, { mode: 'fixed', label: k === 0 }); void dep;
    await W2(V, 0.5);
  }
  V.caption(o.c3); await W2(V, 7);
}

const SCRIPTS = {
  pb_ki: (V) => precipitate(V, {
    cat: 'Pb2+', catPartner: 'NO3-', an: 'I-', anPartner: 'K+', nc: 5, ratio: 2, solidCol: '#f2c824', prodLabel: 'PbI₂',
    c1: L3('Left: lead nitrate solution (Pb²⁺ and NO₃⁻ ions). Right: potassium iodide solution (K⁺ and I⁻ ions). The ions move freely in water.', 'बाएँ: लेड नाइट्रेट विलयन (Pb²⁺ और NO₃⁻ आयन)। दाएँ: पोटैशियम आयोडाइड विलयन (K⁺ और I⁻ आयन)। आयन पानी में स्वतंत्र रूप से घूमते हैं।', 'Left: lead nitrate solution (Pb²⁺ aur NO₃⁻ ions). Right: potassium iodide solution (K⁺ aur I⁻ ions). Ions paani mein free ghoomte hain.'),
    c2: L3('When we mix them, each Pb²⁺ ion meets I⁻ ions.', 'मिलाने पर हर Pb²⁺ आयन I⁻ आयनों से मिलता है।', 'Mix karne par har Pb²⁺ ion, I⁻ ions se milta hai.'),
    c3: L3('One Pb²⁺ joins two I⁻ to form lead iodide, PbI₂. It does not dissolve, so it sinks as a yellow solid — the precipitate. K⁺ and NO₃⁻ stay in the water.', 'एक Pb²⁺ दो I⁻ से जुड़कर लेड आयोडाइड PbI₂ बनाता है। यह घुलता नहीं, इसलिए पीले ठोस (अवक्षेप) के रूप में नीचे बैठ जाता है। K⁺ और NO₃⁻ पानी में ही रहते हैं।', 'Ek Pb²⁺ do I⁻ se judkar lead iodide PbI₂ banata hai. Ye ghulta nahi, isliye yellow solid (precipitate) ban ke neeche baith jaata hai. K⁺ aur NO₃⁻ paani mein hi rehte hain.'),
  }),
  ba_so4: (V) => precipitate(V, {
    cat: 'Ba2+', catPartner: 'Cl-', an: 'SO42-', anPartner: 'Na+', nc: 6, ratio: 1, solidCol: '#f4f4f0', prodLabel: 'BaSO₄',
    c1: L3('Left: barium chloride solution (Ba²⁺, Cl⁻). Right: sodium sulphate solution (Na⁺, SO₄²⁻).', 'बाएँ: बेरियम क्लोराइड विलयन (Ba²⁺, Cl⁻)। दाएँ: सोडियम सल्फेट विलयन (Na⁺, SO₄²⁻)।', 'Left: barium chloride solution (Ba²⁺, Cl⁻). Right: sodium sulphate solution (Na⁺, SO₄²⁻).'),
    c2: L3('On mixing, Ba²⁺ and SO₄²⁻ ions find each other.', 'मिलाने पर Ba²⁺ और SO₄²⁻ आयन एक-दूसरे से मिलते हैं।', 'Mix karne par Ba²⁺ aur SO₄²⁻ ions ek-doosre se milte hain.'),
    c3: L3('They join as barium sulphate, BaSO₄ — a white solid that does not dissolve. Na⁺ and Cl⁻ stay dissolved. The ions swapped partners: a double displacement reaction.', 'ये जुड़कर बेरियम सल्फेट BaSO₄ बनाते हैं — एक सफ़ेद ठोस जो घुलता नहीं। Na⁺ और Cl⁻ घुले रहते हैं। आयनों ने साथी बदल लिए: यह द्विविस्थापन अभिक्रिया है।', 'Ye judkar barium sulphate BaSO₄ banate hain — white solid jo ghulta nahi. Na⁺ aur Cl⁻ ghule rehte hain. Ions ne partner badal liye: double displacement reaction.'),
  }),
  zn_acid: (V) => metalGas(V, {
    metal: 'Zn', ion: 'Zn2+', spect: 'SO42-',
    c1: L3('At the bottom: zinc atoms of the granule. In the water: H⁺ ions and SO₄²⁻ ions from dilute sulphuric acid.', 'नीचे: दाने के जिंक परमाणु। पानी में: तनु सल्फ्यूरिक अम्ल के H⁺ और SO₄²⁻ आयन।', 'Neeche: zinc granule ke atoms. Paani mein: dilute sulphuric acid ke H⁺ aur SO₄²⁻ ions.'),
    c2: L3('A zinc atom gives two electrons to two H⁺ ions.', 'एक जिंक परमाणु दो H⁺ आयनों को दो इलेक्ट्रॉन देता है।', 'Ek zinc atom do H⁺ ions ko do electrons deta hai.'),
    c3: L3('The two H atoms join as H₂ gas and bubble up. The zinc goes into the water as Zn²⁺ — zinc sulphate. That is why the granule slowly gets smaller.', 'दो H परमाणु जुड़कर H₂ गैस बनते हैं और बुलबुले बनकर ऊपर जाते हैं। जिंक Zn²⁺ बनकर पानी में चला जाता है — जिंक सल्फेट। इसी से दाना धीरे-धीरे छोटा होता है।', 'Do H atoms judkar H₂ gas bante hain aur bubbles ban ke upar jaate hain. Zinc, Zn²⁺ ban ke paani mein chala jaata hai — zinc sulphate. Isliye granule dheere-dheere chhota hota hai.'),
  }),
  metals_hcl: (V) => metalGas(V, {
    metal: 'Mg', ion: 'Mg2+', spect: 'Cl-', rounds: 5, heat: true,
    c1: L3('Magnesium atoms (bottom) in dilute hydrochloric acid (H⁺ and Cl⁻ ions).', 'तनु हाइड्रोक्लोरिक अम्ल (H⁺ और Cl⁻ आयन) में मैग्नीशियम परमाणु (नीचे)।', 'Dilute hydrochloric acid (H⁺ aur Cl⁻ ions) mein magnesium atoms (neeche).'),
    c2: L3('Magnesium gives away its electrons very easily, so H⁺ ions turn into H₂ very fast.', 'मैग्नीशियम बहुत आसानी से इलेक्ट्रॉन दे देता है, इसलिए H⁺ आयन बहुत तेज़ी से H₂ बनते हैं।', 'Magnesium bahut aasaani se electrons de deta hai, isliye H⁺ ions bahut tezi se H₂ bante hain.'),
    c3: L3('More reactive metals do this faster: Mg > Al > Zn > Fe. Copper cannot give its electrons to H⁺, so nothing happens with copper. The reaction also gives out heat.', 'अधिक अभिक्रियाशील धातुएँ यह तेज़ी से करती हैं: Mg > Al > Zn > Fe। कॉपर H⁺ को इलेक्ट्रॉन नहीं दे पाता, इसलिए कॉपर के साथ कुछ नहीं होता। इस अभिक्रिया में ऊष्मा भी निकलती है।', 'Zyada reactive metals ye tezi se karte hain: Mg > Al > Zn > Fe. Copper H⁺ ko electrons nahi de paata, isliye copper ke saath kuch nahi hota. Is reaction mein heat bhi nikalti hai.'),
  }),
  zn_naoh: (V) => metalGas(V, {
    metal: 'Zn', ion: 'Zn2+', spect: 'Na+', hion: 'H2O', nh: 12, rounds: 3, heat: true,
    c1: L3('Zinc atoms in warm sodium hydroxide solution (Na⁺, OH⁻ and water).', 'गरम सोडियम हाइड्रॉक्साइड विलयन (Na⁺, OH⁻ और पानी) में जिंक परमाणु।', 'Garam sodium hydroxide solution (Na⁺, OH⁻ aur paani) mein zinc atoms.'),
    c2: L3('On warming, zinc reacts with the hydroxide and water.', 'गरम करने पर जिंक, हाइड्रॉक्साइड और पानी से अभिक्रिया करता है।', 'Garam karne par zinc, hydroxide aur paani se react karta hai.'),
    c3: L3('Hydrogen gas (H₂) is released and zinc goes into the solution as sodium zincate, Na₂ZnO₂.', 'हाइड्रोजन गैस (H₂) निकलती है और जिंक सोडियम ज़िंकेट Na₂ZnO₂ बनकर विलयन में चला जाता है।', 'Hydrogen gas (H₂) nikalti hai aur zinc, sodium zincate Na₂ZnO₂ ban ke solution mein chala jaata hai.'),
  }),
  fe_cuso4: (V) => displacement(V, {
    metal: 'Fe', ionIn: 'Cu2+', ionOut: 'Fe2+', deposit: 'Cu',
    c1: L3('Iron atoms of the nail (bottom). Blue copper sulphate solution: Cu²⁺ and SO₄²⁻ ions.', 'कील के आयरन परमाणु (नीचे)। नीला कॉपर सल्फेट विलयन: Cu²⁺ और SO₄²⁻ आयन।', 'Nail ke iron atoms (neeche). Blue copper sulphate solution: Cu²⁺ aur SO₄²⁻ ions.'),
    c2: L3('Iron is more reactive than copper. An iron atom gives two electrons to a Cu²⁺ ion.', 'आयरन, कॉपर से अधिक अभिक्रियाशील है। एक आयरन परमाणु एक Cu²⁺ आयन को दो इलेक्ट्रॉन देता है।', 'Iron, copper se zyada reactive hai. Ek iron atom ek Cu²⁺ ion ko do electrons deta hai.'),
    c3: L3('Cu²⁺ becomes copper metal and sticks on the nail (brown coat). Iron goes into the water as Fe²⁺ (pale green). Fewer Cu²⁺ ions means less blue colour.', 'Cu²⁺ कॉपर धातु बनकर कील पर जम जाता है (भूरी परत)। आयरन Fe²⁺ बनकर पानी में चला जाता है (हल्का हरा)। Cu²⁺ कम होने से नीला रंग हल्का हो जाता है।', 'Cu²⁺ copper metal ban ke nail par jam jaata hai (brown layer). Iron Fe²⁺ ban ke paani mein chala jaata hai (light green). Cu²⁺ kam hone se blue rang halka ho jaata hai.'),
  }),
  reactivity: (V) => displacement(V, {
    metal: 'Zn', ionIn: 'Cu2+', ionOut: 'Zn2+', deposit: 'Cu',
    c1: L3('Tube A: zinc atoms in copper sulphate (Cu²⁺ ions).', 'परखनली A: कॉपर सल्फेट (Cu²⁺ आयन) में जिंक परमाणु।', 'Tube A: copper sulphate (Cu²⁺ ions) mein zinc atoms.'),
    c2: L3('Zinc holds its electrons less tightly than copper, so it hands them to Cu²⁺.', 'जिंक अपने इलेक्ट्रॉन कॉपर से कम मज़बूती से पकड़ता है, इसलिए उन्हें Cu²⁺ को दे देता है।', 'Zinc apne electrons copper se kam mazbooti se pakadta hai, isliye unhe Cu²⁺ ko de deta hai.'),
    c3: L3('Copper deposits, zinc dissolves as Zn²⁺. The reverse never happens: copper cannot push zinc or iron out of their salts. Order: Zn > Fe > Cu.', 'कॉपर जमता है, जिंक Zn²⁺ बनकर घुल जाता है। उल्टा कभी नहीं होता: कॉपर, जिंक या आयरन को उनके लवण से नहीं हटा सकता। क्रम: Zn > Fe > Cu।', 'Copper jamta hai, zinc Zn²⁺ ban ke ghul jaata hai. Ulta kabhi nahi hota: copper, zinc ya iron ko unke salt se nahi hata sakta. Order: Zn > Fe > Cu.'),
  }),
  mg_burn: async (V) => {
    const mg = V.metalSurface('Mg', 8, -0.03);
    const o2 = V.spawn('O2', 6, -BX, BX, 0.04, BY, { label: true });
    V.caption(L3('Magnesium atoms in the ribbon, and oxygen molecules (O₂) in the air.', 'रिबन में मैग्नीशियम परमाणु, और हवा में ऑक्सीजन अणु (O₂)।', 'Ribbon mein magnesium atoms, aur hawa mein oxygen molecules (O₂).')); await W2(V, 4.5);
    V.caption(L3('In the flame, magnesium burns: each O₂ breaks into two O atoms and each joins one Mg atom. Lots of energy comes out as a dazzling white light.', 'ज्वाला में मैग्नीशियम जलता है: हर O₂ दो O परमाणुओं में टूटता है और हर O एक Mg परमाणु से जुड़ता है। बहुत ऊर्जा चमकदार सफ़ेद प्रकाश के रूप में निकलती है।', 'Flame mein magnesium jalta hai: har O₂ do O atoms mein toot-ta hai aur har O ek Mg atom se judta hai. Bahut energy chamakdaar white light ban ke nikalti hai.'));
    V.heat(1);
    const top = mg.slice(8);
    for (let k = 0; k < Math.min(6, o2.length); k++) {
      const m1 = top[k], m2 = top[k + 1] || mg[k]; const o = o2[k]; o.mode = 'held'; o.labelIt(null); o.go(m1.g.position.x + 0.012, m1.g.position.y + 0.03, 0.14); await W2(V, 0.8);
      V.remove(o); for (const m of [m1]) { const p = m.g.position.clone(); V.remove(m); const mo = V.add('MgO', p.x, p.y + 0.01, { col: '#f6f6f2', label: k === 0 }); mo.vel.set(rnd(-0.01, 0.01), 0.02, 0); } void m2;
    }
    await W2(V, 2); V.heat(0);
    V.caption(L3('The product is magnesium oxide (MgO), a white powder. Dissolved in water it forms magnesium hydroxide, a base — so red litmus turns blue.', 'उत्पाद मैग्नीशियम ऑक्साइड (MgO) है, एक सफ़ेद पाउडर। पानी में घोलने पर यह मैग्नीशियम हाइड्रॉक्साइड बनाता है, जो एक क्षार है — इसलिए लाल लिटमस नीला होता है।', 'Product magnesium oxide (MgO) hai, ek white powder. Paani mein ghol ne par ye magnesium hydroxide banata hai, jo base hai — isliye red litmus blue ho jaata hai.')); await W2(V, 7);
  },
  neutral: async (V) => {
    const oh = V.spawn('OH-', 8, -BX, BX, -BY, BY, { label: true }); V.spawn('Na+', 8, -BX, BX, -BY, BY, { label: true }); const ind = V.spawn('ind', 5, -BX, BX, -BY, BY, { col: '#e83e8c' });
    V.caption(L3('Sodium hydroxide solution: Na⁺ and OH⁻ ions. Phenolphthalein molecules are pink because there is extra OH⁻.', 'सोडियम हाइड्रॉक्साइड विलयन: Na⁺ और OH⁻ आयन। अधिक OH⁻ होने के कारण फ़िनॉल्फ़्थेलिन अणु गुलाबी हैं।', 'Sodium hydroxide solution: Na⁺ aur OH⁻ ions. Extra OH⁻ hone ki wajah se phenolphthalein molecules pink hain.')); await W2(V, 5);
    V.caption(L3('Each drop of acid brings H⁺ (and Cl⁻). An H⁺ and an OH⁻ join to make one water molecule.', 'अम्ल की हर बूँद H⁺ (और Cl⁻) लाती है। एक H⁺ और एक OH⁻ मिलकर पानी का एक अणु बनाते हैं।', 'Acid ki har boond H⁺ (aur Cl⁻) laati hai. Ek H⁺ aur ek OH⁻ milkar paani ka ek molecule banate hain.'));
    for (let k = 0; k < oh.length; k++) {
      const h = V.add('H+', rnd(-0.05, 0.05), BY, { label: k === 0 }); V.add('Cl-', rnd(-0.1, 0.1), BY, {}); const o = V.nearestFree(oh, h.g.position); if (!o) break; o.mode = 'held';
      h.go(o.g.position.x, o.g.position.y, 0.16); await W2(V, 1.1); const p = o.g.position.clone(); V.remove(o); V.remove(h); V.add('H2O', p.x, p.y, { label: k === 0 });
      if (k === oh.length - 1) ind.forEach((i) => i.recolor('#f3eff0'));
    }
    V.caption(L3('When all OH⁻ is used up, the solution is neutral (only Na⁺, Cl⁻ and water — salt solution) and phenolphthalein becomes colourless. One more drop of base brings the pink back.', 'जब सारा OH⁻ खत्म हो जाता है, विलयन उदासीन हो जाता है (केवल Na⁺, Cl⁻ और पानी — नमक का विलयन) और फ़िनॉल्फ़्थेलिन रंगहीन हो जाता है। क्षार की एक और बूँद से गुलाबी रंग लौट आता है।', 'Jab saara OH⁻ khatam ho jaata hai, solution neutral ho jaata hai (sirf Na⁺, Cl⁻ aur paani — salt solution) aur phenolphthalein colourless ho jaata hai. Base ki ek aur boond se pink wapas aa jaata hai.')); await W2(V, 8);
  },
};

// indicator scripts: acid half (H⁺) and base half (OH⁻), indicator molecules take a different colour in each
function indicator(acidCol, baseCol, c1, c2) {
  return async (V) => {
    V.spawn('H+', 10, -BX, -0.03, -BY, BY, { label: true, side: -1 }); const ia = V.spawn('ind', 5, -BX, -0.03, -BY, BY, { col: '#bbbbbb', side: -1 });
    V.spawn('OH-', 10, 0.03, BX, -BY, BY, { label: true, side: 1 }); const ib = V.spawn('ind', 5, 0.03, BX, -BY, BY, { col: '#bbbbbb', side: 1 });
    const wl = new THREE.Mesh(new THREE.PlaneGeometry(0.004, 2 * BY + 0.02), new THREE.MeshBasicMaterial({ color: 0x8892a0 })); V.box.add(wl); V.extra.push(wl);
    V.caption(c1); await W2(V, 5);
    ia.forEach((p) => p.recolor(acidCol)); await W2(V, 1); ib.forEach((p) => p.recolor(baseCol));
    V.caption(c2); await W2(V, 8);
  };
}
const indCap = (name, acid, base) => [
  L3(`Left: an acid has extra H⁺ ions. Right: a base has extra OH⁻ ions. Grey shapes are ${name.en} dye molecules.`, `बाएँ: अम्ल में अधिक H⁺ आयन होते हैं। दाएँ: क्षार में अधिक OH⁻ आयन होते हैं। धूसर आकृतियाँ ${name.hi} के रंजक अणु हैं।`, `Left: acid mein extra H⁺ ions hote hain. Right: base mein extra OH⁻ ions hote hain. Grey shapes ${name.hg} ke dye molecules hain.`),
  L3(`The dye molecule changes its shape a little when it meets many H⁺ or many OH⁻, and with it its colour: ${acid.en} in acid, ${base.en} in base.`, `बहुत सारे H⁺ या OH⁻ मिलने पर रंजक अणु का आकार थोड़ा बदल जाता है, और उसके साथ रंग भी: अम्ल में ${acid.hi}, क्षार में ${base.hi}।`, `Bahut saare H⁺ ya OH⁻ milne par dye molecule ka shape thoda badal jaata hai, aur saath mein rang bhi: acid mein ${acid.hg}, base mein ${base.hg}.`),
];
const N = (en, hi, hg) => ({ en, hi, hg });
SCRIPTS.litmus = indicator('#d23a3a', '#3f6fd1', ...indCap(N('litmus', 'लिटमस', 'litmus'), N('red', 'लाल', 'red'), N('blue', 'नीला', 'blue')));
SCRIPTS.turmeric = indicator('#e8b422', '#b5361f', ...indCap(N('turmeric', 'हल्दी', 'haldi'), N('yellow (no change)', 'पीला (कोई बदलाव नहीं)', 'yellow (koi change nahi)'), N('red', 'लाल', 'red')));
SCRIPTS.chinarose = indicator('#c2185b', '#2e9d4a', ...indCap(N('china rose', 'गुड़हल', 'gudhal'), N('dark pink', 'गहरा गुलाबी', 'dark pink'), N('green', 'हरा', 'green')));
SCRIPTS.ph_paper = indicator('#e53935', '#5e35b1', ...indCap(N('universal indicator', 'सार्वत्रिक सूचक', 'universal indicator'), N('red to yellow (pH below 7)', 'लाल से पीला (pH 7 से कम)', 'red se yellow (pH 7 se kam)'), N('blue to violet (pH above 7)', 'नीला से बैंगनी (pH 7 से अधिक)', 'blue se violet (pH 7 se zyada)')));
SCRIPTS.ph_salts = indicator('#fb8c00', '#3949ab', ...indCap(N('universal indicator', 'सार्वत्रिक सूचक', 'universal indicator'), N('orange (salts like CuSO₄, ZnSO₄ make a few H⁺)', 'नारंगी (CuSO₄, ZnSO₄ जैसे लवण कुछ H⁺ बनाते हैं)', 'orange (CuSO₄, ZnSO₄ jaise salts thode H⁺ banate hain)'), N('blue (Na₂CO₃, NaHCO₃ make a few OH⁻ with water)', 'नीला (Na₂CO₃, NaHCO₃ पानी से कुछ OH⁻ बनाते हैं)', 'blue (Na₂CO₃, NaHCO₃ paani se thode OH⁻ banate hain)')));

// carbonate + acid → CO₂, and CO₂ + lime water → CaCO₃
async function co2Lime(V, o) {
  if (o.start !== 'breath') {
    const cs = V.spawn(o.carb, 4, -BX, -0.04, -BY, -0.02, { label: true }); const hs = V.spawn('H+', 8, -BX, -0.02, -0.05, BY, { label: true });
    V.caption(o.c1); await W2(V, 4.5);
    for (let k = 0; k < cs.length; k++) {
      const c = cs[k]; const h = V.nearestFree(hs, c.g.position); if (!h) break; h.mode = 'held'; c.mode = 'held'; h.go(c.g.position.x, c.g.position.y + 0.02, 0.14); await W2(V, 1);
      const p = c.g.position.clone(); V.remove(c); V.remove(h); V.add('H2O', p.x - 0.02, p.y, {}); const g = V.add('CO2', p.x, p.y + 0.02, { label: k === 0 }); g.go(0.05 + k * 0.03, BY - 0.02, 0.1); g.after = 'free';
    }
  } else { const g = V.spawn('CO2', 4, -BX, -0.05, -BY, BY, { label: true }); void g; V.caption(o.c1); await W2(V, 4); }
  V.caption(o.c2);
  const ca = V.spawn('Ca2+', 4, 0.02, BX, -BY, 0.06, { label: true }); const ohs = V.spawn('OH-', 8, 0.02, BX, -BY, 0.06, { label: true });
  await W2(V, 3);
  const gases = V.parts.filter((p) => p.sp === 'CO2'); const solid = [];
  for (let k = 0; k < Math.min(ca.length, gases.length); k++) {
    const g = gases[k], c = ca[k]; g.mode = 'held'; c.mode = 'held'; g.go(c.g.position.x, c.g.position.y + 0.02, 0.14); await W2(V, 1.2);
    const p = c.g.position.clone(); V.remove(g); V.remove(c); const o1 = V.nearestFree(ohs, p); const o2 = V.nearestFree(ohs.filter((q) => q !== o1), p); if (o1) V.remove(o1); if (o2) V.remove(o2);
    const s1 = V.add('CO32-', p.x, p.y, { col: '#f4f4f0' }); const s2 = V.add('Ca2+', p.x + 0.016, p.y, { col: '#f4f4f0' }); V.bond(s1, s2, 0.016, 0); solid.push(s1); V.add('H2O', p.x, p.y + 0.02, {});
  }
  V.lattice(solid, 0.1, -BY + 0.014, 4, 0.04, 0.06); await W2(V, 3); solid[0] && solid[0].labelIt('CaCO₃');
  V.caption(o.c3); await W2(V, 7);
}
const limeC3 = L3('CO₂ reacts with lime water, Ca(OH)₂, to form calcium carbonate, CaCO₃ — tiny white solid particles that make the liquid milky and slowly settle.', 'CO₂ चूने के पानी Ca(OH)₂ से अभिक्रिया करके कैल्शियम कार्बोनेट CaCO₃ बनाती है — छोटे सफ़ेद ठोस कण, जो द्रव को दूधिया बनाते हैं और धीरे-धीरे नीचे बैठते हैं।', 'CO₂ lime water Ca(OH)₂ se react karke calcium carbonate CaCO₃ banati hai — chhote white solid particles jo liquid ko milky banate hain aur dheere-dheere neeche baithte hain.');
const limeC2 = L3('The CO₂ gas reaches the lime water on the right (Ca²⁺ and OH⁻ ions).', 'CO₂ गैस दाईं ओर चूने के पानी (Ca²⁺ और OH⁻ आयन) तक पहुँचती है।', 'CO₂ gas right side wale lime water (Ca²⁺ aur OH⁻ ions) tak pahunchti hai.');
SCRIPTS.carb_lime = (V) => co2Lime(V, { carb: 'CO32-', c1: L3('Sodium carbonate gives CO₃²⁻ ions; the acid gives H⁺ ions. H⁺ ions attack the carbonate.', 'सोडियम कार्बोनेट CO₃²⁻ आयन देता है; अम्ल H⁺ आयन देता है। H⁺ आयन कार्बोनेट पर टूट पड़ते हैं।', 'Sodium carbonate CO₃²⁻ ions deta hai; acid H⁺ ions deta hai. H⁺ ions carbonate se react karte hain.'), c2: limeC2, c3: limeC3 });
SCRIPTS.vinegar_soda = (V) => co2Lime(V, { carb: 'HCO3-', c1: L3('Baking soda gives HCO₃⁻ ions; vinegar (acetic acid) gives H⁺ ions. They react to make water and carbon dioxide gas — the fizz.', 'बेकिंग सोडा HCO₃⁻ आयन देता है; सिरका (एसीटिक अम्ल) H⁺ आयन देता है। ये मिलकर पानी और कार्बन डाइऑक्साइड गैस बनाते हैं — यही बुदबुदाहट है।', 'Baking soda HCO₃⁻ ions deta hai; vinegar (acetic acid) H⁺ ions deta hai. Ye milkar paani aur carbon dioxide gas banate hain — yahi fizz hai.'), c2: limeC2, c3: limeC3 });
SCRIPTS.breath_lime = (V) => co2Lime(V, { start: 'breath', c1: L3('The air we breathe out has carbon dioxide (CO₂) made by our body cells.', 'हमारी साँस से निकली हवा में कार्बन डाइऑक्साइड (CO₂) होती है, जो हमारे शरीर की कोशिकाएँ बनाती हैं।', 'Hamari saans se nikli hawa mein carbon dioxide (CO₂) hoti hai, jo hamare body cells banate hain.'), c2: limeC2, c3: limeC3 });

// heating breaks a compound into simpler substances; gases leave
function decompose(o) {
  return async (V) => {
    const units = []; for (let i = 0; i < 6; i++) { const p = V.add(o.unit, -0.1 + (i % 3) * 0.1, -0.08 + Math.floor(i / 3) * 0.06, { mode: 'fixed', col: o.unitCol, label: i === 4 }); units.push(p); }
    V.caption(o.c1); await W2(V, 4.5); V.heat(1); V.temp = 2.5; V.caption(o.c2);
    for (let i = 0; i < units.length; i++) {
      const u = units[i]; const p = u.g.position.clone(); u.labelIt(null); u.recolor(o.solidCol); if (o.solidLabel && i === 4) u.labelIt(o.solidLabel);
      for (const [g, k] of o.gases) for (let n = 0; n < k; n++) { const m = V.add(g, p.x + rnd(-0.015, 0.015), p.y + 0.02, { label: i === 0 && n === 0 }); m.mode = 'rise'; m.riseV = rnd(0.04, 0.07); }
      await W2(V, 1.1);
    }
    await W2(V, 2); V.heat(0.2);
    V.caption(o.c3); await W2(V, 7);
  };
}
SCRIPTS.feso4_heat = decompose({ unit: 'SO42-', unitCol: '#9ccf7a', solidCol: '#8b3a1a', solidLabel: 'Fe₂O₃', gases: [['SO2', 1], ['SO3', 1]],
  c1: L3('Green crystals of ferrous sulphate (FeSO₄) — each unit also holds water molecules.', 'फ़ेरस सल्फ़ेट (FeSO₄) के हरे क्रिस्टल — हर इकाई में पानी के अणु भी होते हैं।', 'Ferrous sulphate (FeSO₄) ke green crystals — har unit mein paani ke molecules bhi hote hain.'),
  c2: L3('Heat first drives out the water, then breaks FeSO₄ apart. Sulphur dioxide and sulphur trioxide gases escape (burning-sulphur smell).', 'ऊष्मा पहले पानी निकालती है, फिर FeSO₄ को तोड़ देती है। सल्फ़र डाइऑक्साइड और सल्फ़र ट्राइऑक्साइड गैसें निकलती हैं (जलते सल्फ़र जैसी गंध)।', 'Heat pehle paani nikaalti hai, phir FeSO₄ ko tod deti hai. Sulphur dioxide aur sulphur trioxide gases nikalti hain (jalte sulphur jaisi smell).'),
  c3: L3('What is left is ferric oxide, Fe₂O₃ — the reddish-brown solid. One substance breaking into several is a decomposition reaction.', 'बचा हुआ पदार्थ फ़ेरिक ऑक्साइड Fe₂O₃ है — लाल-भूरा ठोस। एक पदार्थ का कई पदार्थों में टूटना वियोजन अभिक्रिया है।', 'Bacha hua padarth ferric oxide Fe₂O₃ hai — reddish-brown solid. Ek substance ka kai substances mein tootna decomposition reaction hai.') });
SCRIPTS.pbno3_heat = decompose({ unit: 'NO3-', unitCol: '#f4f4f0', solidCol: '#e6c43a', solidLabel: 'PbO', gases: [['NO2', 2], ['O2', 1]],
  c1: L3('White lead nitrate, Pb(NO₃)₂, is made of Pb²⁺ and NO₃⁻ ions.', 'सफ़ेद लेड नाइट्रेट Pb(NO₃)₂, Pb²⁺ और NO₃⁻ आयनों से बना है।', 'White lead nitrate Pb(NO₃)₂, Pb²⁺ aur NO₃⁻ ions se bana hai.'),
  c2: L3('Strong heat breaks the nitrate apart: brown nitrogen dioxide (NO₂) and oxygen (O₂) gases come out.', 'तेज़ ऊष्मा नाइट्रेट को तोड़ देती है: भूरी नाइट्रोजन डाइऑक्साइड (NO₂) और ऑक्सीजन (O₂) गैसें निकलती हैं।', 'Tez heat nitrate ko tod deti hai: brown nitrogen dioxide (NO₂) aur oxygen (O₂) gases nikalti hain.'),
  c3: L3('Yellowish lead oxide (PbO) is left. The brown fumes are NO₂. This is thermal decomposition.', 'पीला लेड ऑक्साइड (PbO) बचता है। भूरा धुआँ NO₂ है। यह ऊष्मीय वियोजन है।', 'Yellowish lead oxide (PbO) bachta hai. Brown fumes NO₂ hain. Ye thermal decomposition hai.') });
SCRIPTS.sugar_heat = decompose({ unit: 'sugar', unitCol: null, solidCol: '#1c1c1c', solidLabel: 'C', gases: [['H2O', 2]],
  c1: L3('Sugar molecules are made of carbon (grey), hydrogen (white) and oxygen (red) atoms.', 'चीनी के अणु कार्बन (धूसर), हाइड्रोजन (सफ़ेद) और ऑक्सीजन (लाल) परमाणुओं से बने हैं।', 'Sugar molecules carbon (grey), hydrogen (white) aur oxygen (red) atoms se bane hain.'),
  c2: L3('Strong heat breaks the molecules: hydrogen and oxygen leave together as water vapour.', 'तेज़ ऊष्मा अणुओं को तोड़ देती है: हाइड्रोजन और ऑक्सीजन साथ में पानी की भाप बनकर निकलते हैं।', 'Tez heat molecules ko tod deti hai: hydrogen aur oxygen saath mein paani ki bhaap ban ke nikalte hain.'),
  c3: L3('Only carbon is left — the black solid (charcoal). So sugar is a compound of carbon, hydrogen and oxygen.', 'केवल कार्बन बचता है — काला ठोस (चारकोल)। अतः चीनी कार्बन, हाइड्रोजन और ऑक्सीजन का यौगिक है।', 'Sirf carbon bachta hai — black solid (charcoal). To sugar carbon, hydrogen aur oxygen ka compound hai.') });
SCRIPTS.cuso4_heat = async (V) => {
  const u = []; for (let i = 0; i < 6; i++) u.push(V.add('SO42-', -0.1 + (i % 3) * 0.1, -0.08 + Math.floor(i / 3) * 0.07, { mode: 'fixed', halo: '#2f86e8', label: i === 4 }));
  const w = u.map((p) => { const out = []; for (let k = 0; k < 2; k++) { const m = V.add('H2O', p.g.position.x + (k ? 0.026 : -0.026), p.g.position.y + 0.02, { mode: 'fixed' }); out.push(m); } return out; });
  V.caption(L3('Blue copper sulphate crystals: each CuSO₄ holds five water molecules (water of crystallisation). This water gives the blue colour.', 'नीले कॉपर सल्फेट क्रिस्टल: हर CuSO₄ पाँच पानी के अणु पकड़े रहता है (क्रिस्टलन का जल)। यही पानी नीला रंग देता है।', 'Blue copper sulphate crystals: har CuSO₄ paanch paani ke molecules pakde rehta hai (water of crystallisation). Yahi paani blue colour deta hai.')); await W2(V, 5);
  V.heat(0.8); V.caption(L3('On heating, the water molecules leave as steam. Without them the solid is white (anhydrous CuSO₄).', 'गरम करने पर पानी के अणु भाप बनकर निकल जाते हैं। उनके बिना ठोस सफ़ेद होता है (निर्जल CuSO₄)।', 'Garam karne par paani ke molecules bhaap ban ke nikal jaate hain. Unke bina solid white hota hai (anhydrous CuSO₄).'));
  for (let i = 0; i < u.length; i++) { for (const m of w[i]) { m.mode = 'rise'; m.riseV = 0.06; } u[i].halo.visible = false; await W2(V, 0.9); }
  V.heat(0); await W2(V, 2);
  V.caption(L3('Add water back: the molecules take their places again and the blue colour returns. The change can be reversed.', 'पानी फिर डालने पर अणु अपनी जगह लौट आते हैं और नीला रंग वापस आ जाता है। यह परिवर्तन उत्क्रमणीय है।', 'Paani wapas daalne par molecules apni jagah laut aate hain aur blue colour wapas aa jaata hai. Ye change reversible hai.'));
  for (let i = 0; i < u.length; i++) { const p = u[i].g.position; const m = V.add('H2O', p.x + rnd(-0.1, 0.1), BY, {}); m.go(p.x - 0.026, p.y + 0.02, 0.12); await W2(V, 0.5); u[i].halo.visible = true; }
  await W2(V, 6);
};
SCRIPTS.cao_water = async (V) => {
  const cs = []; for (let i = 0; i < 8; i++) cs.push(V.add('CaO', -0.12 + (i % 4) * 0.08, -BY + 0.02 + Math.floor(i / 4) * 0.035, { mode: 'fixed', label: i === 5 }));
  const ws = V.spawn('H2O', 12, -BX, BX, -0.02, BY, { label: true });
  V.caption(L3('Quick lime is calcium oxide, CaO. Water molecules are all around it.', 'बिना बुझा चूना कैल्शियम ऑक्साइड CaO है। इसके चारों ओर पानी के अणु हैं।', 'Quick lime calcium oxide CaO hai. Iske chaaron taraf paani ke molecules hain.')); await W2(V, 4.5);
  V.caption(L3('Each CaO combines with one H₂O to form calcium hydroxide, Ca(OH)₂ (slaked lime), and a lot of heat is given out.', 'हर CaO एक H₂O से संयोग करके कैल्शियम हाइड्रॉक्साइड Ca(OH)₂ (बुझा चूना) बनाता है, और बहुत ऊष्मा निकलती है।', 'Har CaO ek H₂O se combine hokar calcium hydroxide Ca(OH)₂ (slaked lime) banata hai, aur bahut heat nikalti hai.'));
  for (let i = 0; i < cs.length; i++) { const c = cs[i]; const w = V.nearestFree(ws, c.g.position); if (!w) break; w.mode = 'held'; w.go(c.g.position.x + 0.02, c.g.position.y + 0.012, 0.14); await W2(V, 0.8); V.remove(w); c.recolor('#f4f4ee'); if (i === 2) c.labelIt('Ca(OH)₂'); V.heat(Math.min(1, (i + 1) / 5)); V.temp = 1 + i * 0.25; }
  await W2(V, 2);
  V.caption(L3('Two substances join to make one: a combination reaction. Because it gives out heat, it is also exothermic — the beaker becomes hot.', 'दो पदार्थ मिलकर एक बनाते हैं: संयोजन अभिक्रिया। ऊष्मा निकलने के कारण यह ऊष्माक्षेपी भी है — बीकर गरम हो जाता है।', 'Do substances milkar ek banate hain: combination reaction. Heat nikalne ki wajah se ye exothermic bhi hai — beaker garam ho jaata hai.')); await W2(V, 7); V.heat(0);
};

// dissolving, diffusion, evaporation, colloids, sublimation, chromatography, rusting
SCRIPTS.solubility = async (V) => {
  const cr = []; for (let i = 0; i < 9; i++) cr.push(V.add('sugar', -0.12 + (i % 3) * 0.035, -BY + 0.02 + Math.floor(i / 3) * 0.03, { mode: 'fixed', label: i === 7 }));
  const sand = V.add('sand', 0.13, -BY + 0.04, { mode: 'fixed' }); const sl = V.sprite(tx(N('sand grain', 'रेत का कण', 'ret ka kan'), V.L())); sl.position.set(0.13, -BY + 0.1, 0.03); V.box.add(sl); V.extra.push(sl);
  V.spawn('H2O', 16, -BX, BX, -0.06, BY, { label: true });
  V.caption(L3('Left: a sugar crystal — sugar molecules packed together. Right: a grain of sand. Water molecules move all around.', 'बाएँ: चीनी का क्रिस्टल — पास-पास जमे चीनी के अणु। दाएँ: रेत का कण। पानी के अणु चारों ओर घूमते हैं।', 'Left: sugar crystal — paas-paas jame sugar molecules. Right: ret ka kan. Paani ke molecules chaaron taraf ghoomte hain.')); await W2(V, 5);
  V.caption(L3('Water molecules pull sugar molecules away one by one, and they spread into the spaces between water molecules. Stirring helps.', 'पानी के अणु चीनी के अणुओं को एक-एक करके खींच लेते हैं, और वे पानी के अणुओं के बीच की जगहों में फैल जाते हैं। हिलाने से यह जल्दी होता है।', 'Paani ke molecules sugar molecules ko ek-ek karke kheench lete hain, aur wo paani ke molecules ke beech ki jagah mein fail jaate hain. Hilaane se ye jaldi hota hai.'));
  for (let i = cr.length - 1; i >= 0; i--) { cr[i].mode = 'free'; cr[i].vel.set(rnd(-0.03, 0.03), 0.03, 0); await W2(V, 0.7); }
  await W2(V, 3);
  V.caption(L3('Sugar has dissolved: its molecules are too small to see, so the water looks clear. Sand does not break up into particles in water — it is insoluble and settles.', 'चीनी घुल गई: इसके अणु दिखने के लिए बहुत छोटे हैं, इसलिए पानी साफ़ दिखता है। रेत पानी में कणों में नहीं टूटती — यह अघुलनशील है और नीचे बैठ जाती है।', 'Sugar ghul gayi: iske molecules dikhne ke liye bahut chhote hain, isliye paani saaf dikhta hai. Ret paani mein particles mein nahi toot-ti — ye insoluble hai aur neeche baith jaati hai.')); await W2(V, 7);
};
SCRIPTS.evaporate_salt = async (V) => {
  const na = V.spawn('Na+', 6, -BX, BX, -BY, BY, { label: true }); const cl = V.spawn('Cl-', 6, -BX, BX, -BY, BY, { label: true }); const ws = V.spawn('H2O', 16, -BX, BX, -BY, BY, { label: true });
  V.caption(L3('Salt water: Na⁺ and Cl⁻ ions spread among water molecules.', 'नमक का पानी: Na⁺ और Cl⁻ आयन पानी के अणुओं के बीच फैले हैं।', 'Namak ka paani: Na⁺ aur Cl⁻ ions paani ke molecules ke beech faile hain.')); await W2(V, 4.5);
  V.heat(0.7); V.temp = 2; V.caption(L3('Heating gives water molecules enough energy to escape into the air as vapour. Salt ions cannot escape.', 'गरम करने से पानी के अणुओं को इतनी ऊर्जा मिलती है कि वे भाप बनकर हवा में चले जाते हैं। नमक के आयन नहीं निकल पाते।', 'Garam karne se paani ke molecules ko itni energy milti hai ki wo bhaap ban ke hawa mein chale jaate hain. Namak ke ions nahi nikal paate.'));
  for (const w of ws) { w.mode = 'rise'; w.riseV = rnd(0.05, 0.09); await W2(V, 0.35); }
  const all = []; na.forEach((p, i) => { all.push(p, cl[i]); }); all.forEach((p) => p.labelIt(null)); V.lattice(all, 0, -BY + 0.015, 6, 0.026, 0.07);
  await W2(V, 3.5); V.heat(0);
  V.caption(L3('With the water gone, Na⁺ and Cl⁻ pack together in a neat pattern: crystals of common salt, NaCl.', 'पानी चले जाने पर Na⁺ और Cl⁻ एक सुंदर क्रम में जम जाते हैं: नमक (NaCl) के क्रिस्टल।', 'Paani jaane ke baad Na⁺ aur Cl⁻ ek neat pattern mein jam jaate hain: namak (NaCl) ke crystals.')); await W2(V, 7);
};
SCRIPTS.kmno4_diffuse = async (V) => {
  const wl = new THREE.Mesh(new THREE.PlaneGeometry(0.004, 2 * BY + 0.02), new THREE.MeshBasicMaterial({ color: 0x8892a0 })); V.box.add(wl); V.extra.push(wl);
  const lc = V.sprite(tx(N('cold', 'ठंडा', 'thanda'), V.L())); lc.position.set(-0.1, BY + 0.01, 0.03); const lh = V.sprite(tx(N('hot', 'गरम', 'garam'), V.L())); lh.position.set(0.1, BY + 0.01, 0.03); V.box.add(lc, lh); V.extra.push(lc, lh);
  const a = [], b = []; for (let i = 0; i < 10; i++) { a.push(V.add('MnO4-', -0.12 + (i % 5) * 0.012, -BY + 0.01 + Math.floor(i / 5) * 0.014, { mode: 'fixed', label: i === 0, side: -1, tempK: 0.45 })); b.push(V.add('MnO4-', 0.08 + (i % 5) * 0.012, -BY + 0.01 + Math.floor(i / 5) * 0.014, { mode: 'fixed', side: 1, tempK: 2.2 })); }
  V.spawn('H2O', 8, -BX, -0.02, -BY, BY, { side: -1, tempK: 0.45 }); V.spawn('H2O', 8, 0.02, BX, -BY, BY, { side: 1, tempK: 2.2 });
  V.caption(L3('A crystal of potassium permanganate at the bottom of cold water (left) and hot water (right).', 'ठंडे पानी (बाएँ) और गरम पानी (दाएँ) की तली में पोटैशियम परमैंगनेट का क्रिस्टल।', 'Thande paani (left) aur garam paani (right) ki tali mein potassium permanganate ka crystal.')); await W2(V, 4.5);
  V.caption(L3('Without any stirring, purple MnO₄⁻ ions leave the crystal and wander between the water molecules: diffusion. In hot water the particles move faster, so they spread faster.', 'बिना हिलाए बैंगनी MnO₄⁻ आयन क्रिस्टल छोड़कर पानी के अणुओं के बीच घूमने लगते हैं: विसरण। गरम पानी में कण तेज़ चलते हैं, इसलिए जल्दी फैलते हैं।', 'Bina hilaaye purple MnO₄⁻ ions crystal chhod kar paani ke molecules ke beech ghoomne lagte hain: diffusion. Garam paani mein particles tez chalte hain, isliye jaldi failte hain.'));
  for (let k = 0; k < 10; k++) { b[k].mode = 'free'; b[k].vel.set(rnd(-0.03, 0.03), 0.05, 0); if (k % 3 === 0) { a[k].mode = 'free'; a[k].vel.set(0, 0.01, 0); } await W2(V, 0.5); }
  await W2(V, 4); for (const p of a) p.mode = 'free';
  await W2(V, 3);
  V.caption(L3('Particles of matter are always moving — that is why smells and colours spread by themselves.', 'पदार्थ के कण हमेशा गतिशील रहते हैं — इसी कारण गंध और रंग अपने-आप फैल जाते हैं।', 'Matter ke particles hamesha move karte rehte hain — isliye smell aur rang apne-aap fail jaate hain.')); await W2(V, 6);
};
SCRIPTS.tyndall = async (V) => {
  const ions = [...V.spawn('Na+', 7, -BX, -0.02, -BY, BY, { label: true, side: -1 }), ...V.spawn('Cl-', 7, -BX, -0.02, -BY, BY, { label: true, side: -1 })];
  const milk = V.spawn('milk', 7, 0.03, BX, -BY, BY, { side: 1 }); const lab = V.sprite(tx(N('colloid particle', 'कोलॉइड कण', 'colloid particle'), V.L())); lab.position.set(0.12, BY + 0.01, 0.03); V.box.add(lab); V.extra.push(lab);
  const wl = new THREE.Mesh(new THREE.PlaneGeometry(0.004, 2 * BY + 0.02), new THREE.MeshBasicMaterial({ color: 0x8892a0 })); V.box.add(wl); V.extra.push(wl); void ions;
  V.caption(L3('Left: salt solution — tiny ions. Right: dilute milk — much bigger particles (fat and protein) floating in water.', 'बाएँ: नमक का विलयन — बहुत छोटे आयन। दाएँ: पतला दूध — पानी में तैरते काफ़ी बड़े कण (वसा और प्रोटीन)।', 'Left: salt solution — bahut chhote ions. Right: patla doodh — paani mein tairte kaafi bade particles (fat aur protein).')); await W2(V, 4.5);
  V.beam(0.25, 0.02); V.caption(L3('A beam of light passes through. Tiny ions are too small to send light sideways, so the beam is invisible on the left.', 'प्रकाश की किरण गुज़रती है। छोटे आयन प्रकाश को किनारे नहीं भेज पाते, इसलिए बाईं ओर किरण दिखाई नहीं देती।', 'Light ki beam guzarti hai. Chhote ions light ko side mein nahi bhej paate, isliye left side beam dikhti nahi.'));
  for (let i = 0; i < 40; i++) { for (const m of milk) { const near = Math.abs(m.g.position.y - 0.02) < 0.03; m.g.children[0].material = near ? mat('#fff3b0') : mat('#f4f1e8'); } await W2(V, 0.15); }
  V.caption(L3('Big colloid particles scatter the light in all directions, so the path of the beam shines — the Tyndall effect. A suspension like chalk water scatters too, but its particles are so big that they settle.', 'बड़े कोलॉइड कण प्रकाश को सब दिशाओं में बिखेर देते हैं, इसलिए किरण का रास्ता चमकता है — टिंडल प्रभाव। चॉक के पानी जैसा निलंबन भी प्रकाश बिखेरता है, पर उसके कण इतने बड़े हैं कि नीचे बैठ जाते हैं।', 'Bade colloid particles light ko har direction mein scatter karte hain, isliye beam ka raasta chamakta hai — Tyndall effect. Chalk water jaisa suspension bhi scatter karta hai, par uske particles itne bade hain ki neeche baith jaate hain.'));
  for (let i = 0; i < 40; i++) { for (const m of milk) { const near = Math.abs(m.g.position.y - 0.02) < 0.03; m.g.children[0].material = near ? mat('#fff3b0') : mat('#f4f1e8'); } await W2(V, 0.15); }
  V.beam(0);
};
SCRIPTS.sublimation = async (V) => {
  const s = []; for (let i = 0; i < 10; i++) s.push(V.add('NH4Cl', -0.13 + (i % 5) * 0.04, -BY + 0.015 + Math.floor(i / 5) * 0.028, { mode: 'fixed', label: i === 7 }));
  for (let i = 0; i < 3; i++) V.add('sand', 0.1 + i * 0.04, -BY + 0.03, { mode: 'fixed', size: 0.55 });
  const top = new THREE.Mesh(new THREE.PlaneGeometry(2 * BX, 0.006), new THREE.MeshBasicMaterial({ color: 0x9fd4ff })); top.position.y = BY + 0.012; V.box.add(top); V.extra.push(top);
  V.caption(L3('A mixture of ammonium chloride (white) and sand at the bottom of the hot dish. The cool funnel is on top.', 'गरम प्याली की तली में अमोनियम क्लोराइड (सफ़ेद) और रेत का मिश्रण। ऊपर ठंडी कीप है।', 'Garam dish ki tali mein ammonium chloride (white) aur ret ka mixture. Upar thandi funnel hai.')); await W2(V, 4.5);
  V.heat(0.8); V.temp = 2; V.caption(L3('On heating, ammonium chloride goes straight from solid to gas (it does not melt). Sand stays behind.', 'गरम करने पर अमोनियम क्लोराइड सीधे ठोस से गैस बन जाता है (पिघलता नहीं)। रेत वहीं रह जाती है।', 'Garam karne par ammonium chloride seedha solid se gas ban jaata hai (pighalta nahi). Ret wahin reh jaati hai.'));
  const up = [];
  for (let i = 0; i < s.length; i++) { const p = s[i]; p.labelIt(null); p.go(-0.18 + i * 0.04, BY - 0.002, 0.07); up.push(p); await W2(V, 0.7); }
  await W2(V, 3); V.heat(0);
  up[3] && up[3].labelIt('NH₄Cl');
  V.caption(L3('On the cool funnel, the vapour turns straight back into solid (deposition). This is sublimation, and it separates ammonium chloride from sand.', 'ठंडी कीप पर वाष्प सीधे फिर ठोस बन जाती है। यह ऊर्ध्वपातन है, और इससे अमोनियम क्लोराइड रेत से अलग हो जाता है।', 'Thandi funnel par vapour seedha wapas solid ban jaati hai. Ye sublimation hai, aur isse ammonium chloride ret se alag ho jaata hai.')); await W2(V, 7);
};
SCRIPTS.chromatography = async (V) => {
  const paper = new THREE.Mesh(new THREE.PlaneGeometry(0.14, 2 * BY), new THREE.MeshBasicMaterial({ color: 0xf2efe6 })); paper.position.z = -0.01; V.box.add(paper); V.extra.push(paper);
  const water = new THREE.Mesh(new THREE.PlaneGeometry(0.14, 1), new THREE.MeshBasicMaterial({ color: 0x9cc8e8, transparent: true, opacity: 0.45 })); water.position.z = -0.008; V.box.add(water); V.extra.push(water);
  const setW = (h) => { water.scale.y = Math.max(0.001, h); water.position.y = -BY + h / 2; }; setW(0.03);
  const cols = ['#2b4fd8', '#7a2fb0', '#e0347a', '#f2c21a'], rf = [0.42, 0.55, 0.72, 0.9]; const ds = [];
  for (let c = 0; c < 4; c++) for (let k = 0; k < 3; k++) { const p = V.add('dye', rnd(-0.015, 0.015), -BY + 0.06 + rnd(-0.006, 0.006), { mode: 'fixed', col: cols[c], size: 0.6 }); p.rf = rf[c]; ds.push(p); }
  V.caption(L3('The black ink spot on the paper is really a mixture of different coloured dye particles.', 'कागज़ पर काली स्याही का धब्बा वास्तव में अलग-अलग रंग के रंजक कणों का मिश्रण है।', 'Paper par kaali ink ka dhabba asal mein alag-alag rang ke dye particles ka mixture hai.')); await W2(V, 4.5);
  V.caption(L3('Water climbs up the paper. Dyes that dissolve well and stick weakly to paper are carried higher; the others lag behind.', 'पानी कागज़ पर ऊपर चढ़ता है। जो रंजक अच्छे से घुलते हैं और कागज़ से कम चिपकते हैं, वे ऊपर तक जाते हैं; बाकी पीछे रह जाते हैं।', 'Paani paper par upar chadhta hai. Jo dyes achhe se ghulte hain aur paper se kam chipakte hain, wo upar tak jaate hain; baaki peeche reh jaate hain.'));
  for (let t = 0; t <= 1.0001; t += 0.025) { const front = 0.03 + t * (2 * BY - 0.05); setW(front); for (const p of ds) p.g.position.y = -BY + 0.06 + Math.max(0, front - 0.06) * p.rf + (p.g.id % 3 - 1) * 0.004; await W2(V, 0.18); }
  V.caption(L3('Each dye travels its own distance, so the spot separates into coloured bands. This is paper chromatography.', 'हर रंजक अपनी दूरी तय करता है, इसलिए धब्बा रंगीन पट्टियों में बँट जाता है। यह पेपर क्रोमैटोग्राफी है।', 'Har dye apni doori tay karta hai, isliye dhabba rangeen bands mein bant jaata hai. Ye paper chromatography hai.')); await W2(V, 7);
};
SCRIPTS.rusting = async (V) => {
  const fe = V.metalSurface('Fe', 9); const o2 = V.spawn('O2', 6, -BX, BX, 0.02, BY, { label: true }); const ws = V.spawn('H2O', 8, -BX, BX, -0.1, 0.05, { label: true });
  V.caption(L3('Iron atoms of the nail, with water molecules and oxygen (O₂) from the air.', 'कील के आयरन परमाणु, पानी के अणु और हवा की ऑक्सीजन (O₂)।', 'Nail ke iron atoms, paani ke molecules aur hawa ki oxygen (O₂).')); await W2(V, 4.5);
  V.caption(L3('Slowly, iron atoms react with oxygen and water together. Each step needs both of them.', 'धीरे-धीरे आयरन परमाणु ऑक्सीजन और पानी दोनों के साथ अभिक्रिया करते हैं। हर चरण में दोनों की ज़रूरत होती है।', 'Dheere-dheere iron atoms oxygen aur paani dono ke saath react karte hain. Har step mein dono chahiye.'));
  const top = fe.slice(9);
  for (let k = 0; k < 6; k++) { const m = top[k + 1]; const o = V.nearestFree(o2, m.g.position), w = V.nearestFree(ws, m.g.position); if (!o || !w) break; o.mode = 'held'; w.mode = 'held'; o.go(m.g.position.x - 0.01, m.g.position.y + 0.022, 0.1); w.go(m.g.position.x + 0.012, m.g.position.y + 0.024, 0.1); await W2(V, 1.3); V.remove(o); V.remove(w); m.recolor('#8a3f1c'); if (k === 2) m.labelIt(tx(N('rust', 'जंग', 'rust'), V.L())); }
  V.caption(L3('The brown, flaky product is rust (hydrated iron oxide, Fe₂O₃·xH₂O). Without air (boiled water + oil) or without water (dry air), it cannot form.', 'भूरा, परतदार उत्पाद जंग है (जलयुक्त आयरन ऑक्साइड Fe₂O₃·xH₂O)। हवा के बिना (उबला पानी + तेल) या पानी के बिना (सूखी हवा) यह नहीं बन सकता।', 'Brown, flaky product rust hai (hydrated iron oxide Fe₂O₃·xH₂O). Hawa ke bina (boiled water + oil) ya paani ke bina (dry air) ye nahi ban sakta.')); await W2(V, 7);
};
export const HAS_PARTICLES = (id) => !!SCRIPTS[id];
