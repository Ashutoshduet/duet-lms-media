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
  S: { a: [['S', 0, 0]], l: 'S' }, H2SO3: { a: [['S', 0, 0], ['O', -s * 1.2, s * 0.5], ['O', s * 1.2, s * 0.5], ['O', 0, -s * 1.2], ['H', -s * 2, s * 1.1], ['H', s * 2, s * 1.1]], l: 'H₂SO₃' },
  wax: { a: [['C', -s * 2, 0], ['C', -s, s * 0.5], ['C', 0, 0], ['C', s, s * 0.5], ['C', s * 2, 0], ['H', -s * 2.6, s * 0.8], ['H', s * 2.6, s * 0.8], ['H', 0, -s * 0.9]], l: 'wax' },
  paper: { a: [['C', -s, 0], ['O', 0, s * 0.7], ['C', s, 0], ['C', 0, -s * 0.7], ['H', -s * 1.8, s * 0.4], ['O', s * 1.9, s * 0.3]], l: 'cellulose' },
  mud: { a: [['X', 0, 0]], l: '', big: 3.6, col: '#7a5a35' }, clay: { a: [['X', 0, 0]], l: '', big: 1.3, col: '#a07f55' }, 'Al3+': { a: [['Al', 0, 0]], l: 'Al³⁺' },
  cit: { a: [['C', -s, 0], ['C', 0, s * 0.6], ['C', s, 0], ['O', -s * 1.8, s * 0.5], ['O', s * 1.8, s * 0.5], ['O', 0, -s * 0.9]], l: 'citrate' },
  'e-': { a: [['X', 0, 0]], l: 'e⁻', big: 0.42, col: '#ffe14a' }, photon: { a: [['X', 0, 0]], l: '', big: 0.75, col: '#ffd23a' },
  glu: { a: [['C', -s, 0], ['C', 0, s * 0.8], ['C', s, 0], ['O', 0, -s * 0.8], ['H', -s * 1.8, s * 0.4], ['O', s * 1.9, s * 0.3]], l: 'C₆H₁₂O₆' },
  alc: { a: [['C', -s * 0.6, 0], ['C', s * 0.6, 0], ['O', s * 1.6, s * 0.6], ['H', s * 2.3, s * 0.2], ['H', -s * 1.4, s * 0.7], ['H', -s * 1.2, -s * 0.8]], l: 'C₂H₅OH' },
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

// ======================================================================================== batch 3 (Class 6–8)
const wall = (V, x, w, h, col, y = 0) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.85 })); m.position.set(x, y, -0.01); V.box.add(m); V.extra.push(m); return m; };
SCRIPTS.evaporation = async (V) => {
  V.walls = { x0: -BX, x1: BX, y0: -BY, y1: -0.04 }; const w = V.spawn('H2O', 18, -BX, BX, -BY, -0.05, { label: true }); wall(V, 0, 2 * BX, 0.002, '#7fb2e0', -0.04);
  V.caption(L3('Water molecules in the liquid keep moving. Some at the surface move fast enough to escape into the air.', 'द्रव में पानी के अणु लगातार गति करते रहते हैं। सतह पर कुछ अणु इतनी तेज़ी से चलते हैं कि हवा में निकल जाते हैं।', 'Liquid mein paani ke molecules hamesha move karte rehte hain. Surface par kuch itni tezi se chalte hain ki hawa mein nikal jaate hain.'));
  for (let k = 0; k < 3; k++) { const p = w[k]; p.mode = 'rise'; p.riseV = 0.04; await W2(V, 1.6); }
  V.caption(L3('In sunlight the molecules get more energy and move faster, so many more escape: the water evaporates faster. A wider surface lets more escape at the same time.', 'धूप में अणुओं को अधिक ऊर्जा मिलती है और वे तेज़ चलते हैं, इसलिए बहुत अधिक अणु निकल जाते हैं: पानी जल्दी वाष्पित होता है। चौड़ी सतह से एक साथ अधिक अणु निकलते हैं।', 'Dhoop mein molecules ko zyada energy milti hai aur woh tez chalte hain, isliye bahut zyada nikal jaate hain: paani jaldi evaporate hota hai. Chaudi surface se ek saath zyada molecules nikalte hain.'));
  V.heat(0.7); V.temp = 2.4; for (let k = 3; k < 12; k++) { const p = w[k]; p.mode = 'rise'; p.riseV = 0.07; await W2(V, 0.6); }
  await W2(V, 5);
};
SCRIPTS.condensation = async (V) => {
  const cold = wall(V, BX - 0.01, 0.02, 2 * BY, '#9fd0ff'); void cold;
  const vap = V.spawn('H2O', 12, -BX, BX - 0.06, -BY, BY, { label: true, tempK: 1.6 });
  V.caption(L3('Air contains water vapour: single water molecules flying about. On the right is the cold glass.', 'हवा में जलवाष्प होती है: पानी के अकेले अणु इधर-उधर उड़ते रहते हैं। दाईं ओर ठंडा गिलास है।', 'Hawa mein water vapour hoti hai: paani ke akele molecules idhar-udhar udte rehte hain. Right side mein thanda glass hai.')); await W2(V, 4.5);
  V.caption(L3('When a molecule hits the cold glass it loses energy and slows down. Slow molecules stick together and form a tiny liquid drop.', 'जब कोई अणु ठंडे गिलास से टकराता है तो उसकी ऊर्जा कम हो जाती है और वह धीमा हो जाता है। धीमे अणु आपस में चिपककर पानी की छोटी बूँद बनाते हैं।', 'Jab koi molecule thande glass se takrata hai to uski energy kam ho jaati hai aur woh slow ho jaata hai. Slow molecules aapas mein chipak kar paani ki chhoti boond banate hain.'));
  for (let k = 0; k < vap.length; k++) { const p = vap[k]; p.mode = 'held'; p.labelIt(null); p.go(BX - 0.035 - (k % 3) * 0.016, -0.06 + Math.floor(k / 3) * 0.022 - (k % 2) * 0.008, 0.1); await W2(V, 0.45); }
  await W2(V, 2); V.caption(L3('This is condensation: water vapour turning back into liquid water on a cold surface.', 'यही संघनन है: ठंडी सतह पर जलवाष्प का फिर से द्रव पानी बन जाना।', 'Yahi condensation hai: thandi surface par water vapour ka phir se liquid paani ban jaana.')); await W2(V, 6);
};
SCRIPTS.sedimentation = async (V) => {
  V.spawn('H2O', 10, -BX, BX, -BY, BY, {}); const mud = V.spawn('mud', 5, -BX, BX, -0.05, BY, {}); const clay = V.spawn('clay', 16, -BX, BX, -BY, BY, {});
  V.caption(L3('Muddy water: big heavy mud and sand grains (brown) and very small clay particles (light brown) among the water molecules.', 'मटमैला पानी: पानी के अणुओं के बीच बड़े भारी मिट्टी और रेत के कण (भूरे) और बहुत छोटे चिकनी मिट्टी के कण (हल्के भूरे)।', 'Muddy paani: paani ke molecules ke beech bade bhaari mitti aur ret ke kan (brown) aur bahut chhote clay particles (light brown).')); await W2(V, 4.5);
  mud.forEach((p, i) => p.go(-0.15 + i * 0.075, -BY + 0.02, 0.08));
  V.caption(L3('The heavy grains sink quickly and settle at the bottom: sedimentation. The tiny clay particles keep floating.', 'भारी कण जल्दी डूबकर तली पर बैठ जाते हैं: यही अवसादन है। बहुत छोटे कण तैरते रहते हैं।', 'Bhaari kan jaldi doob kar neeche baith jaate hain: yahi sedimentation hai. Chhote clay particles tairte rehte hain.')); await W2(V, 5);
  const al = V.spawn('Al3+', 4, -BX, BX, 0.05, BY, { label: true });
  V.caption(L3('Alum gives Al³⁺ ions. They pull the tiny clay particles together into bigger flakes, which are heavy enough to sink.', 'फिटकरी Al³⁺ आयन देती है। ये छोटे कणों को आपस में जोड़कर बड़े गुच्छे बना देते हैं, जो इतने भारी होते हैं कि डूब जाते हैं।', 'Fitkari Al³⁺ ions deti hai. Ye chhote clay particles ko jod kar bade flakes bana dete hain, jo itne bhaari hote hain ki doob jaate hain.'));
  for (let g = 0; g < 4; g++) { const a = al[g]; a.mode = 'held'; const cx = -0.15 + g * 0.1; a.go(cx, 0.02, 0.1); for (let k = 0; k < 4; k++) { const c = clay[g * 4 + k]; if (!c) continue; c.mode = 'held'; c.go(cx + (k % 2 ? 0.012 : -0.012), 0.02 + (k > 1 ? 0.012 : -0.012), 0.1); } }
  await W2(V, 2.5); for (let g = 0; g < 4; g++) { const cx = -0.15 + g * 0.1; [al[g], ...clay.slice(g * 4, g * 4 + 4)].forEach((p, k) => p && p.go(cx + (k % 3 - 1) * 0.012, -BY + 0.045 + (k > 2 ? 0.012 : 0), 0.06)); }
  await W2(V, 5);
};
SCRIPTS.filtration = async (V) => {
  for (let i = 0; i < 9; i++) wall(V, -BX + 0.03 + i * 0.05, 0.034, 0.012, '#d9d6cc', 0); // filter paper with tiny pores between its fibres
  V.walls = { x0: -BX, x1: BX, y0: 0.012, y1: BY }; const w = V.spawn('H2O', 12, -BX, BX, 0.02, BY, { label: true }); const mud = V.spawn('mud', 5, -BX, BX, 0.05, BY, {}); V.spawn('clay', 8, -BX, BX, 0.03, BY, {});
  V.caption(L3('The filter paper is a mat of fibres with tiny holes (pores) between them.', 'फ़िल्टर पेपर रेशों की एक चटाई जैसा है, जिनके बीच बहुत छोटे छेद होते हैं।', 'Filter paper fibres ki ek mat jaisa hai, jinke beech bahut chhote ched (pores) hote hain.')); await W2(V, 4.5);
  V.caption(L3('Water molecules are tiny and pass through the pores into the flask: the clear filtrate. The mud particles are too big and stay on top: the residue.', 'पानी के अणु बहुत छोटे होते हैं और छेदों से निकलकर फ़्लास्क में चले जाते हैं: यही साफ़ निस्यंद है। मिट्टी के कण बहुत बड़े हैं, इसलिए ऊपर रह जाते हैं: यही अवशेष है।', 'Paani ke molecules bahut chhote hote hain aur pores se nikal kar flask mein chale jaate hain: yahi clear filtrate hai. Mud particles bahut bade hain aur upar reh jaate hain: yahi residue hai.'));
  for (let k = 0; k < w.length; k++) { const p = w[k]; p.mode = 'held'; const gx = -BX + 0.055 + (k % 8) * 0.05; p.go(gx, 0.03, 0.12); p.onArrive = () => { p.go(gx, -0.09 - (k % 3) * 0.03, 0.08); p.after = 'fixed'; }; await W2(V, 0.4); }
  mud.forEach((p, i) => p.go(-0.15 + i * 0.075, 0.035, 0.06)); await W2(V, 6);
};
SCRIPTS.magnet_sep = async (V) => {
  const bar = wall(V, 0, 0.3, 0.03, '#c62f2f', BY - 0.005); void bar; const fe = V.spawn('Fe', 10, -BX, BX, -BY, -0.02, { label: true }); V.spawn('sand', 6, -BX, BX, -BY, -0.02, {});
  V.caption(L3('Iron filings are made of iron atoms; sand is silicon dioxide. A magnet is held above them.', 'लोहे का बुरादा लोहे के परमाणुओं से बना है; रेत सिलिकॉन डाइऑक्साइड है। ऊपर चुंबक रखा है।', 'Iron filings iron atoms se bane hain; ret silicon dioxide hai. Upar magnet rakha hai.')); await W2(V, 4.5);
  V.caption(L3('The magnet pulls on iron but not on sand. The iron bits fly up and cling to it; the sand grains stay where they are.', 'चुंबक लोहे को खींचता है, रेत को नहीं। लोहे के टुकड़े उड़कर उससे चिपक जाते हैं; रेत के कण वहीं रहते हैं।', 'Magnet iron ko kheenchta hai, ret ko nahi. Iron ke tukde ud kar usse chipak jaate hain; ret ke kan wahin rehte hain.'));
  fe.forEach((p, i) => { p.mode = 'held'; p.go(-0.13 + i * 0.028, BY - 0.03, 0.14); }); await W2(V, 6);
};
const roseCap = indCap(N('red rose', 'लाल गुलाब', 'lal gulab'), N('red-pink', 'लाल-गुलाबी', 'red-pink'), N('green', 'हरा', 'green'));
SCRIPTS.rose = indicator('#d62d5a', '#4f8a2e', ...roseCap);
SCRIPTS.litmus_home = indicator('#d23a3a', '#3f6fd1', ...indCap(N('litmus', 'लिटमस', 'litmus'), N('red', 'लाल', 'red'), N('blue', 'नीला', 'blue')));
SCRIPTS.lemon_lime = async (V) => {
  const h = V.spawn('H+', 8, -BX, BX, -BY, BY, { label: true }); V.spawn('cit', 3, -BX, BX, -BY, BY, { label: true }); const ind = V.spawn('ind', 4, -BX, BX, -BY, BY, { col: '#d23a3a' });
  V.caption(L3('Lemon juice contains citric acid: it gives H⁺ ions, so the litmus molecules are red.', 'नींबू के रस में सिट्रिक अम्ल होता है: वह H⁺ आयन देता है, इसलिए लिटमस के अणु लाल हैं।', 'Nimbu ke ras mein citric acid hota hai: woh H⁺ ions deta hai, isliye litmus molecules laal hain.')); await W2(V, 4.5);
  V.caption(L3('Each drop of lime water brings Ca²⁺ and OH⁻ ions. An OH⁻ joins an H⁺ to make a water molecule.', 'चूने के पानी की हर बूँद Ca²⁺ और OH⁻ आयन लाती है। एक OH⁻ एक H⁺ से मिलकर पानी का अणु बनाता है।', 'Lime water ki har boond Ca²⁺ aur OH⁻ ions laati hai. Ek OH⁻ ek H⁺ se milkar paani ka molecule banata hai.'));
  for (let k = 0; k < h.length; k++) { const o = V.add('OH-', rnd(-0.1, 0.1), BY, { label: k === 0 }); if (k % 2 === 0) V.add('Ca2+', rnd(-0.1, 0.1), BY, { label: k === 0 }); const t = h[k]; t.mode = 'held'; o.mode = 'held'; o.go(t.g.position.x, t.g.position.y, 0.16); await W2(V, 0.9); const p = t.g.position.clone(); V.remove(o); V.remove(t); V.add('H2O', p.x, p.y, { label: k === 0 }); }
  const extra = V.add('OH-', 0, BY, { label: true }); void extra; ind.forEach((i) => i.recolor('#3f6fd1'));
  V.caption(L3('When all H⁺ is used up the acid is neutralised; the next OH⁻ makes it slightly basic and the litmus turns blue. Acid + base → salt + water.', 'जब सारे H⁺ खत्म हो जाते हैं तो अम्ल उदासीन हो जाता है; अगला OH⁻ इसे थोड़ा क्षारकीय बना देता है और लिटमस नीला हो जाता है। अम्ल + क्षारक → लवण + पानी।', 'Jab saare H⁺ khatam ho jaate hain to acid neutralise ho jaata hai; agla OH⁻ ise thoda basic bana deta hai aur litmus blue ho jaata hai. Acid + base → salt + paani.')); await W2(V, 7);
};
SCRIPTS.sulphur_burn = async (V) => {
  const S = []; for (let i = 0; i < 6; i++) S.push(V.add('S', -0.12 + (i % 3) * 0.05, -BY + 0.02 + Math.floor(i / 3) * 0.03, { mode: 'fixed', label: i === 4 }));
  const o2 = V.spawn('O2', 6, -BX, BX, 0.0, BY, { label: true });
  V.caption(L3('Sulphur atoms (yellow) in the spoon, and oxygen molecules (O₂) in the air.', 'चम्मच में सल्फर के परमाणु (पीले), और हवा में ऑक्सीजन के अणु (O₂)।', 'Spoon mein sulphur atoms (yellow), aur hawa mein oxygen molecules (O₂).')); await W2(V, 4.5);
  V.heat(0.6); V.caption(L3('In the flame each sulphur atom joins one O₂ molecule: sulphur dioxide (SO₂), a gas.', 'ज्वाला में हर सल्फर परमाणु एक O₂ अणु से जुड़ता है: सल्फर डाइऑक्साइड (SO₂) गैस बनती है।', 'Flame mein har sulphur atom ek O₂ molecule se judta hai: sulphur dioxide (SO₂) gas banti hai.'));
  const gas = []; for (let k = 0; k < 6; k++) { const a = S[k], b = o2[k]; b.mode = 'held'; b.labelIt(null); b.go(a.g.position.x, a.g.position.y + 0.02, 0.14); await W2(V, 0.8); const p = a.g.position.clone(); a.labelIt(null); V.remove(a); V.remove(b); const g = V.add('SO2', p.x, p.y + 0.01, { label: k === 0 }); g.vel.set(rnd(-0.02, 0.02), 0.03, 0); gas.push(g); }
  V.heat(0); await W2(V, 1.5); V.spawn('H2O', 6, -BX, BX, -BY, -0.05, { label: true });
  V.caption(L3('With water, SO₂ forms sulphurous acid (H₂SO₃), which gives H⁺ ions: the solution is acidic and turns blue litmus red.', 'पानी के साथ SO₂ सल्फ्यूरस अम्ल (H₂SO₃) बनाती है, जो H⁺ आयन देता है: विलयन अम्लीय है और नीले लिटमस को लाल कर देता है।', 'Paani ke saath SO₂ sulphurous acid (H₂SO₃) banati hai, jo H⁺ ions deta hai: solution acidic hai aur blue litmus ko red kar deta hai.'));
  for (let k = 0; k < 3; k++) { const g = gas[k]; const p = g.g.position.clone(); V.remove(g); const a = V.add('H2SO3', p.x, Math.min(p.y, 0), { label: k === 0 }); void a; V.add('H+', p.x + 0.02, Math.min(p.y, 0) - 0.02, { label: k === 0 }); await W2(V, 0.8); }
  await W2(V, 6);
};
async function burnWax(V, o) {
  const wax = V.spawn('wax', o.nw || 3, -0.12, 0.12, -BY, -0.06, { label: true }); const o2 = V.spawn('O2', o.no || 9, -BX, BX, -0.02, BY, { label: true });
  V.caption(o.c1); await W2(V, 4.5); V.heat(0.9); V.caption(o.c2);
  for (let k = 0; k < Math.min(o.no || 9, 9); k++) { const w = wax[k % wax.length]; const ox = o2[k]; if (!ox) break; ox.mode = 'held'; ox.labelIt(null); ox.go(w.g.position.x + rnd(-0.02, 0.02), w.g.position.y + 0.02, 0.15); await W2(V, 0.6); const p = ox.g.position.clone(); V.remove(ox);
    const c = V.add('CO2', p.x, p.y + 0.01, { label: k === 0 }); c.vel.set(rnd(-0.02, 0.02), 0.03, 0); const h = V.add('H2O', p.x + 0.02, p.y + 0.01, { label: k === 0 }); h.vel.set(rnd(-0.02, 0.02), 0.03, 0); }
  wax.forEach((w) => { w.labelIt(null); V.remove(w); });
}
SCRIPTS.candle_o2 = async (V) => {
  wall(V, 0, 2 * BX + 0.01, 0.004, '#9fb8cc', BY + 0.005);
  await burnWax(V, { no: 6, c1: L3('Inside the tumbler: wax vapour from the candle, and only a few oxygen molecules in the trapped air.', 'गिलास के अंदर: मोमबत्ती की मोम की वाष्प, और फँसी हुई हवा में ऑक्सीजन के थोड़े से अणु।', 'Tumbler ke andar: candle ki wax vapour, aur trapped hawa mein oxygen ke thode se molecules.'),
    c2: L3('Burning: wax joins oxygen to make carbon dioxide and water. Every O₂ that is used up is not replaced.', 'जलना: मोम ऑक्सीजन से मिलकर कार्बन डाइऑक्साइड और पानी बनाती है। जो O₂ खर्च हो जाता है, उसकी जगह नई नहीं आती।', 'Jalna: wax oxygen ke saath milkar carbon dioxide aur paani banati hai. Jo O₂ use ho jaati hai, uski jagah nayi nahi aati.') });
  V.heat(0); await W2(V, 1);
  V.caption(L3('No oxygen is left, so the flame goes out. The water vapour becomes mist on the glass; the CO₂ turns lime water milky.', 'ऑक्सीजन नहीं बची, इसलिए लौ बुझ जाती है। जलवाष्प गिलास पर धुंध बन जाती है; CO₂ चूने के पानी को दूधिया कर देती है।', 'Oxygen nahi bachi, isliye flame bujh jaati hai. Water vapour glass par mist ban jaati hai; CO₂ lime water ko milky kar deti hai.')); await W2(V, 7);
};
SCRIPTS.candle_zones = async (V) => {
  await burnWax(V, { nw: 4, no: 6, c1: L3('Near the wick the wax is only vapour: there is no oxygen there yet, so it cannot burn. This is the dark zone.', 'बत्ती के पास मोम केवल वाष्प है: वहाँ अभी ऑक्सीजन नहीं पहुँची, इसलिए वह जल नहीं सकती। यही काला क्षेत्र है।', 'Wick ke paas wax sirf vapour hai: wahan abhi oxygen nahi pahunchi, isliye woh jal nahi sakti. Yahi dark zone hai.'),
    c2: L3('In the outer zone there is plenty of oxygen: the wax burns completely to carbon dioxide and water. This zone is the hottest.', 'बाहरी क्षेत्र में बहुत ऑक्सीजन है: मोम पूरी तरह जलकर कार्बन डाइऑक्साइड और पानी बनाती है। यह क्षेत्र सबसे गरम है।', 'Outer zone mein bahut oxygen hai: wax poori tarah jal kar carbon dioxide aur paani banati hai. Yeh zone sabse garam hai.') });
  const c = []; for (let i = 0; i < 6; i++) c.push(V.add('C', -0.1 + i * 0.04, 0.02 + (i % 2) * 0.02, { label: i === 2, col: '#ffb43a' }));
  V.caption(L3('In the middle zone there is not enough oxygen: some carbon is left unburnt. These hot carbon particles glow yellow and give light; on cold glass they show up as black soot.', 'बीच के क्षेत्र में ऑक्सीजन पूरी नहीं है: कुछ कार्बन बिना जले बच जाता है। ये गरम कार्बन कण पीले चमकते हैं और प्रकाश देते हैं; ठंडे काँच पर ये काली कालिख बनकर दिखते हैं।', 'Middle zone mein oxygen poori nahi hai: kuch carbon bina jale bach jaata hai. Ye garam carbon particles yellow chamakte hain aur light dete hain; thande glass par ye kaali soot ban kar dikhte hain.'));
  await W2(V, 3); c.forEach((p) => p.recolor('#1a1a1a')); V.heat(0); await W2(V, 5);
};
SCRIPTS.ignition = async (V) => {
  const wl = wall(V, 0, 0.004, 2 * BY + 0.02, '#8892a0'); void wl;
  const pl = []; const pr = []; for (let i = 0; i < 4; i++) { pl.push(V.add('paper', -0.17 + i * 0.045, -BY + 0.02, { mode: 'fixed', label: i === 1 })); pr.push(V.add('paper', 0.05 + i * 0.045, -BY + 0.02, { mode: 'fixed' })); }
  const w = V.spawn('H2O', 10, 0.03, BX, -BY + 0.04, 0.02, { side: 1, label: true }); const o2 = V.spawn('O2', 5, -BX, -0.03, 0, BY, { side: -1, label: true });
  V.caption(L3('Left: the empty paper cup. Right: the cup with water. The flame heats both from below.', 'बाएँ: खाली कागज़ का कप। दाएँ: पानी वाला कप। लौ दोनों को नीचे से गरम करती है।', 'Left: khaali paper cup. Right: paani wala cup. Flame dono ko neeche se garam karti hai.')); await W2(V, 4.5);
  V.caption(L3('In the empty cup the paper soon gets hot enough (its ignition temperature) to react with oxygen: it burns.', 'खाली कप में कागज़ जल्दी इतना गरम हो जाता है (अपने ज्वलन ताप तक) कि ऑक्सीजन से अभिक्रिया करने लगता है: वह जल उठता है।', 'Khaali cup mein paper jaldi itna garam ho jaata hai (apne ignition temperature tak) ki oxygen se react karne lagta hai: woh jal uthta hai.'));
  pl.forEach((p) => p.recolor('#ff8a2a')); for (let k = 0; k < 4; k++) { const ox = o2[k]; ox.mode = 'held'; ox.go(pl[k].g.position.x, pl[k].g.position.y + 0.02, 0.14); await W2(V, 0.7); const p = pl[k].g.position.clone(); V.remove(ox); pl[k].labelIt(null); V.remove(pl[k]); const c = V.add('CO2', p.x, p.y + 0.02, { label: k === 0 }); c.mode = 'rise'; }
  V.caption(L3('In the other cup the heat goes into the water molecules: they move faster and the water boils, but the paper stays below its ignition temperature and does not burn.', 'दूसरे कप में ऊष्मा पानी के अणुओं में चली जाती है: वे तेज़ चलते हैं और पानी उबलता है, पर कागज़ अपने ज्वलन ताप से नीचे रहता है और नहीं जलता।', 'Doosre cup mein heat paani ke molecules mein chali jaati hai: woh tez chalte hain aur paani ubalta hai, par paper apne ignition temperature se neeche rehta hai aur nahi jalta.'));
  w.forEach((p) => { p.tempK = 2.5; }); for (let k = 0; k < 3; k++) { w[k].mode = 'rise'; await W2(V, 1); } await W2(V, 5);
};
SCRIPTS.phys_change = async (V) => {
  const ice = []; for (let i = 0; i < 12; i++) ice.push(V.add('H2O', -0.12 + (i % 4) * 0.08, -0.08 + Math.floor(i / 4) * 0.07, { mode: 'fixed', label: i === 5 }));
  V.caption(L3('In ice the water molecules are held in fixed places in a pattern; they can only shake.', 'बर्फ़ में पानी के अणु एक नमूने में अपनी जगहों पर बँधे रहते हैं; वे केवल काँप सकते हैं।', 'Ice mein paani ke molecules ek pattern mein apni jagah par bandhe rehte hain; woh sirf kaanp sakte hain.')); await W2(V, 4.5);
  V.caption(L3('Heat makes them shake harder until they break free and move about: the ice melts into water. They are still the same H₂O molecules.', 'ऊष्मा से वे ज़ोर से काँपते हैं और छूटकर घूमने लगते हैं: बर्फ़ पिघलकर पानी बन जाती है। अणु फिर भी वही H₂O हैं।', 'Heat se woh zor se kaanpte hain aur chhoot kar ghoomne lagte hain: ice pighal kar paani ban jaati hai. Molecules phir bhi wahi H₂O hain.'));
  ice.forEach((p) => { p.mode = 'free'; }); V.heat(0.4); await W2(V, 4); V.heat(0);
  V.caption(L3('In the freezing mixture they lose energy and lock into place again: water freezes. No new substance is made, so this is a physical change.', 'हिमकारी मिश्रण में उनकी ऊर्जा कम होती है और वे फिर अपनी जगह पर बँध जाते हैं: पानी जम जाता है। कोई नया पदार्थ नहीं बनता, इसलिए यह भौतिक परिवर्तन है।', 'Freezing mixture mein unki energy kam hoti hai aur woh phir apni jagah bandh jaate hain: paani jam jaata hai. Koi naya substance nahi banta, isliye yeh physical change hai.'));
  V.lattice(ice, 0, -0.08, 4, 0.08, 0.07); await W2(V, 6);
};
SCRIPTS.metal_nonmetal = async (V) => {
  const m = []; for (let r = 0; r < 3; r++) for (let i = 0; i < 6; i++) m.push(V.add('Al', -0.19 + i * 0.03 + (r % 2) * 0.015, -0.06 + r * 0.028, { mode: 'fixed', label: r === 1 && i === 2 }));
  const c = []; for (let i = 0; i < 9; i++) c.push(V.add('C', 0.06 + (i % 3) * 0.035, -0.06 + Math.floor(i / 3) * 0.032, { mode: 'fixed', label: i === 4 }));
  V.caption(L3('Left: aluminium atoms in neat layers, held by a sea of free electrons. Right: carbon atoms in coal, locked to each other by strong fixed bonds.', 'बाएँ: एल्युमिनियम के परमाणु सुंदर परतों में, मुक्त इलेक्ट्रॉनों के सागर से बँधे हुए। दाएँ: कोयले में कार्बन परमाणु, मज़बूत स्थिर बंधों से एक-दूसरे से जुड़े।', 'Left: aluminium atoms neat layers mein, free electrons ke samundar se bandhe hue. Right: coal mein carbon atoms, strong fixed bonds se ek-doosre se jude.')); await W2(V, 5);
  V.caption(L3('A hammer blow makes the metal layers slide over each other without breaking: the metal flattens (malleable). The free electrons also carry heat and electricity.', 'हथौड़े की चोट से धातु की परतें बिना टूटे एक-दूसरे पर खिसक जाती हैं: धातु चपटी हो जाती है (आघातवर्ध्य)। मुक्त इलेक्ट्रॉन ऊष्मा और विद्युत भी ले जाते हैं।', 'Hammer ki chot se metal ki layers bina toote ek-doosre par khisak jaati hain: metal flat ho jaata hai (malleable). Free electrons heat aur electricity bhi le jaate hain.'));
  m.forEach((p, i) => p.go(-0.2 + (i % 9) * 0.022, -0.06 + Math.floor(i / 9) * 0.022, 0.05)); await W2(V, 3);
  V.caption(L3('In coal the fixed bonds cannot slide; they snap, and the piece breaks into powder (brittle).', 'कोयले के स्थिर बंध खिसक नहीं सकते; वे टूट जाते हैं, और टुकड़ा चूर-चूर हो जाता है (भंगुर)।', 'Coal ke fixed bonds khisak nahi sakte; woh toot jaate hain, aur tukda powder ban jaata hai (brittle).'));
  c.forEach((p) => { p.mode = 'free'; p.vel.set(rnd(0.01, 0.04), rnd(-0.03, 0.03), 0); }); await W2(V, 6);
};
SCRIPTS.saturated = async (V) => {
  const xtal = []; for (let i = 0; i < 12; i++) xtal.push(V.add(i % 2 ? 'Cl-' : 'Na+', -0.1 + (i % 4) * 0.022, -BY + 0.015 + Math.floor(i / 4) * 0.022, { mode: 'fixed', label: i < 2 }));
  V.spawn('H2O', 12, -BX, BX, -BY, BY, {});
  V.caption(L3('Water molecules pull Na⁺ and Cl⁻ ions out of the salt crystal one by one: the salt dissolves.', 'पानी के अणु नमक के क्रिस्टल से Na⁺ और Cl⁻ आयनों को एक-एक करके बाहर खींच लेते हैं: नमक घुल जाता है।', 'Paani ke molecules salt crystal se Na⁺ aur Cl⁻ ions ko ek-ek karke bahar kheench lete hain: salt ghul jaata hai.'));
  for (let k = 0; k < 6; k++) { xtal[11 - k].mode = 'free'; await W2(V, 0.7); }
  V.caption(L3('When the water is full of ions, some ions go back onto the crystal as fast as others leave: no more dissolves. The solution is saturated.', 'जब पानी आयनों से भर जाता है, तो जितने आयन निकलते हैं उतने ही वापस क्रिस्टल पर लौट आते हैं: और नहीं घुलता। विलयन संतृप्त है।', 'Jab paani ions se bhar jaata hai, to jitne ions nikalte hain utne hi wapas crystal par laut aate hain: aur nahi ghulta. Solution saturated hai.')); await W2(V, 5);
  V.heat(0.6); V.temp = 2.2; V.caption(L3('Heating makes the water molecules move faster and pull harder, so more solid can dissolve.', 'गरम करने पर पानी के अणु तेज़ चलते हैं और ज़ोर से खींचते हैं, इसलिए अधिक ठोस घुल सकता है।', 'Garam karne par paani ke molecules tez chalte hain aur zor se kheenchte hain, isliye zyada solid ghul sakta hai.'));
  for (let k = 6; k < 12; k++) { xtal[11 - k].mode = 'free'; await W2(V, 0.6); } await W2(V, 4); V.heat(0);
};
SCRIPTS.limewater_air = async (V) => {
  const cao = []; for (let i = 0; i < 4; i++) cao.push(V.add('CaO', -0.15 + i * 0.05, -BY + 0.02, { mode: 'fixed', label: i === 1 })); const w = V.spawn('H2O', 8, -BX, BX, -0.06, BY, { label: true });
  V.caption(L3('Quick lime is calcium oxide (CaO). Water molecules attack it.', 'बिना बुझा चूना कैल्शियम ऑक्साइड (CaO) है। पानी के अणु उस पर अभिक्रिया करते हैं।', 'Quick lime calcium oxide (CaO) hai. Paani ke molecules us par react karte hain.')); await W2(V, 4);
  V.heat(0.9); V.caption(L3('CaO + H₂O → Ca²⁺ and two OH⁻ ions (calcium hydroxide). A lot of heat is given out.', 'CaO + H₂O → Ca²⁺ और दो OH⁻ आयन (कैल्शियम हाइड्रॉक्साइड)। बहुत ऊष्मा निकलती है।', 'CaO + H₂O → Ca²⁺ aur do OH⁻ ions (calcium hydroxide). Bahut heat nikalti hai.'));
  for (let k = 0; k < cao.length; k++) { const c = cao[k], h = w[k]; h.mode = 'held'; h.go(c.g.position.x, c.g.position.y + 0.02, 0.15); await W2(V, 0.8); const p = c.g.position.clone(); c.labelIt(null); V.remove(c); V.remove(h); V.add('Ca2+', p.x, p.y + 0.01, { label: k === 0 }); V.add('OH-', p.x - 0.02, p.y + 0.03, { label: k === 0 }); V.add('OH-', p.x + 0.02, p.y + 0.03, {}); }
  V.heat(0); await W2(V, 1);
  V.clear(); await co2Lime(V, { start: 'breath', c1: L3('Left open, the lime water meets carbon dioxide (CO₂) from the air.', 'खुला छोड़ने पर चूने का पानी हवा की कार्बन डाइऑक्साइड (CO₂) से मिलता है।', 'Khula chhodne par lime water hawa ki carbon dioxide (CO₂) se milta hai.'), c2: limeC2, c3: limeC3 });
};

// ======================================================================================== batch 4 (electricity)
const pole = (V, x, plus, col) => { const w = wall(V, x, 0.012, 2 * BY - 0.02, col); const t = V.sprite(plus ? '+' : '−'); t.scale.set(0.07, 0.022, 1); t.position.set(x, BY - 0.005, 0.02); V.box.add(t); V.extra.push(t); return w; };
SCRIPTS.tester_solids = async (V) => {
  wall(V, 0, 2 * BX, 0.003, '#6a7480', -0.005);
  const cu = []; for (let r = 0; r < 2; r++) for (let i = 0; i < 9; i++) cu.push(V.add('Cu', -BX + 0.03 + i * 0.047 + (r % 2) * 0.02, 0.05 + r * 0.055, { mode: 'fixed', label: r === 0 && i === 4 }));
  const el = []; for (let k = 0; k < 10; k++) el.push(V.add('e-', rnd(-BX + 0.02, BX - 0.02), rnd(0.03, BY - 0.02), { mode: 'fixed', label: k === 0 }));
  const S = []; for (let i = 0; i < 7; i++) { const p = V.add('S', -BX + 0.04 + i * 0.058, -0.09, { mode: 'fixed', label: i === 3 }); S.push(p); const e1 = V.add('e-', p.g.position.x + 0.022, -0.09, { mode: 'fixed' }); void e1; }
  V.caption(L3('Top: copper, a metal. Its atoms sit in rows, and some electrons (yellow) are free to wander between them. Bottom: sulphur, a non-metal. Its electrons are held tightly in bonds.', 'ऊपर: ताँबा, एक धातु। इसके परमाणु पंक्तियों में होते हैं, और कुछ इलेक्ट्रॉन (पीले) उनके बीच आज़ादी से घूमते हैं। नीचे: सल्फर, एक अधातु। इसके इलेक्ट्रॉन बंधों में कसकर बँधे रहते हैं।', 'Upar: copper, ek metal. Iske atoms rows mein hote hain, aur kuch electrons (yellow) unke beech free ghoomte hain. Neeche: sulphur, ek non-metal. Iske electrons bonds mein kaske bandhe rehte hain.'));
  for (let k = 0; k < 6; k++) { el.forEach((e) => e.go(rnd(-BX + 0.02, BX - 0.02), rnd(0.03, BY - 0.02), 0.05)); await W2(V, 0.9); }
  V.caption(L3('With the tester joined, the free electrons in the metal all drift one way, towards the + end. This steady flow of electrons is the electric current, so the bulb glows.', 'टेस्टर जोड़ने पर धातु के मुक्त इलेक्ट्रॉन एक ही दिशा में, + सिरे की ओर बहने लगते हैं। इलेक्ट्रॉनों का यही लगातार बहाव विद्युत धारा है, इसलिए बल्ब जलता है।', 'Tester jodne par metal ke free electrons ek hi taraf, + end ki taraf behne lagte hain. Electrons ka yahi lagataar flow electric current hai, isliye bulb jalta hai.'));
  for (let k = 0; k < 14; k++) { el.forEach((e) => { const P = e.g.position; if (P.x < -BX + 0.04) { P.x = BX - 0.02; } e.go(P.x - 0.04, Math.min(BY - 0.02, Math.max(0.03, P.y + rnd(-0.01, 0.01))), 0.09); }); await W2(V, 0.45); }
  V.caption(L3('In sulphur no electron is free to move, so no current flows: the bulb stays dark. Graphite is the exception among non-metals: some of its electrons are free, so it conducts.', 'सल्फर में कोई इलेक्ट्रॉन घूमने के लिए मुक्त नहीं है, इसलिए धारा नहीं बहती: बल्ब नहीं जलता। अधातुओं में ग्रेफ़ाइट अपवाद है: इसके कुछ इलेक्ट्रॉन मुक्त होते हैं, इसलिए यह चालक है।', 'Sulphur mein koi electron ghoomne ke liye free nahi hai, isliye current nahi behta: bulb nahi jalta. Non-metals mein graphite exception hai: iske kuch electrons free hote hain, isliye yeh conduct karta hai.'));
  await W2(V, 6);
};
async function ionsMove(V, o) { // ions drift to the opposite electrodes
  for (let k = 0; k < (o.rounds || 8); k++) {
    for (const p of o.pos) { const P = p.g.position; if (P.x < BX - 0.05) p.go(Math.min(BX - 0.04, P.x + 0.035), P.y + rnd(-0.015, 0.015), 0.06); }
    for (const p of o.neg) { const P = p.g.position; if (P.x > -BX + 0.05) p.go(Math.max(-BX + 0.04, P.x - 0.035), P.y + rnd(-0.015, 0.015), 0.06); }
    await W2(V, 0.6);
  }
}
SCRIPTS.conduct_liquids = async (V) => {
  pole(V, -BX + 0.006, true, '#c0392b'); pole(V, BX - 0.006, false, '#3a3f46');
  const w = V.spawn('H2O', 10, -BX + 0.03, BX - 0.03, -BY, BY, { label: true });
  V.caption(L3('Distilled water between the two ends of the tester: only water molecules, with no charge. Nothing moves towards the ends, so no current flows and the LED stays dark.', 'टेस्टर के दोनों सिरों के बीच आसुत जल: केवल पानी के अणु, जिन पर कोई आवेश नहीं। कुछ भी सिरों की ओर नहीं बढ़ता, इसलिए धारा नहीं बहती और LED नहीं जलती।', 'Tester ke dono ends ke beech distilled water: sirf paani ke molecules, jin par koi charge nahi. Kuch bhi ends ki taraf nahi badhta, isliye current nahi behta aur LED nahi jalti.')); await W2(V, 5);
  const na = V.spawn('Na+', 5, -0.1, 0.1, -BY + 0.02, BY - 0.02, { label: true }); const cl = V.spawn('Cl-', 5, -0.1, 0.1, -BY + 0.02, BY - 0.02, { label: true });
  V.caption(L3('A pinch of salt breaks up into Na⁺ and Cl⁻ ions. The + end pulls the Cl⁻ ions and the − end pulls the Na⁺ ions. These moving ions carry the current through the liquid: the LED glows.', 'एक चुटकी नमक Na⁺ और Cl⁻ आयनों में टूट जाता है। + सिरा Cl⁻ आयनों को और − सिरा Na⁺ आयनों को खींचता है। यही चलते हुए आयन द्रव में धारा ले जाते हैं: LED जलती है।', 'Ek chutki namak Na⁺ aur Cl⁻ ions mein toot jaata hai. + end Cl⁻ ions ko aur − end Na⁺ ions ko kheenchta hai. Yahi chalte hue ions liquid mein current le jaate hain: LED jalti hai.'));
  await ionsMove(V, { pos: na, neg: cl, rounds: 9 });
  V.caption(L3('Acids and bases also give ions, so they conduct. Sugar dissolves as whole molecules without any charge, so sugar solution does not conduct.', 'अम्ल और क्षारक भी आयन देते हैं, इसलिए वे भी चालक हैं। चीनी बिना आवेश वाले पूरे अणुओं के रूप में घुलती है, इसलिए चीनी का घोल चालक नहीं है।', 'Acids aur bases bhi ions dete hain, isliye woh bhi conduct karte hain. Cheeni bina charge wale poore molecules ke roop mein ghulti hai, isliye cheeni ka ghol conduct nahi karta.'));
  void w; await W2(V, 6);
};
SCRIPTS.electroplating = async (V) => {
  const A = [], B = []; for (let i = 0; i < 6; i++) { A.push(V.add('Cu', -BX + 0.015, -0.13 + i * 0.05, { mode: 'fixed', label: i === 2 })); B.push(V.add('Cu', BX - 0.015, -0.13 + i * 0.05, { mode: 'fixed' })); }
  const t1 = V.sprite('+'); t1.position.set(-BX + 0.015, BY + 0.005, 0.02); const t2 = V.sprite('−'); t2.position.set(BX - 0.015, BY + 0.005, 0.02); V.box.add(t1, t2); V.extra.push(t1, t2);
  const cu = V.spawn('Cu2+', 7, -0.12, 0.12, -BY + 0.02, BY - 0.02, { label: true }); V.spawn('SO42-', 6, -0.12, 0.12, -BY + 0.02, BY - 0.02, { label: true });
  V.caption(L3('Left: the copper plate joined to +. Right: the plate joined to −. In between: copper sulphate solution, with blue Cu²⁺ ions and SO₄²⁻ ions.', 'बाएँ: + से जुड़ी ताँबे की प्लेट। दाएँ: − से जुड़ी प्लेट। बीच में: कॉपर सल्फेट विलयन, नीले Cu²⁺ आयन और SO₄²⁻ आयन।', 'Left: + se judi copper plate. Right: − se judi plate. Beech mein: copper sulphate solution, blue Cu²⁺ ions aur SO₄²⁻ ions.')); await W2(V, 5);
  V.caption(L3('Cu²⁺ ions drift to the − plate. There each one takes two electrons and becomes a copper atom stuck to the plate: a new layer of copper grows.', 'Cu²⁺ आयन − प्लेट की ओर बहते हैं। वहाँ हर आयन दो इलेक्ट्रॉन लेकर ताँबे का परमाणु बन जाता है और प्लेट से चिपक जाता है: ताँबे की नई परत बनती है।', 'Cu²⁺ ions − plate ki taraf behte hain. Wahan har ion do electrons lekar copper atom ban jaata hai aur plate se chipak jaata hai: copper ki nayi layer banti hai.'));
  for (let k = 0; k < 6; k++) { const c = cu[k]; c.mode = 'held'; const y = -0.13 + k * 0.05; c.go(BX - 0.04, y, 0.12); await W2(V, 1.1); const P = c.g.position.clone(); V.remove(c); V.add('Cu', P.x, P.y, { mode: 'fixed', col: '#e0874a', label: k === 0 }); }
  V.caption(L3('At the + plate, copper atoms give away two electrons each and go into the solution as Cu²⁺ ions. So copper moves from the + plate to the − plate, and the solution stays blue.', '+ प्लेट पर ताँबे के परमाणु दो-दो इलेक्ट्रॉन देकर Cu²⁺ आयन बनकर विलयन में चले जाते हैं। इस तरह ताँबा + प्लेट से − प्लेट पर पहुँचता है, और विलयन नीला बना रहता है।', '+ plate par copper atoms do-do electrons dekar Cu²⁺ ions bankar solution mein chale jaate hain. Is tarah copper + plate se − plate par pahunchta hai, aur solution blue hi rehta hai.'));
  for (let k = 0; k < 5; k++) { const a = A[5 - k]; const P = a.g.position.clone(); a.labelIt(null); V.remove(a); const ion = V.add('Cu2+', P.x + 0.02, P.y, { label: k === 0 }); ion.vel.set(0.03, rnd(-0.01, 0.01), 0); await W2(V, 0.9); }
  await W2(V, 5);
};
async function waterSplit(V, o) {
  pole(V, -BX + 0.006, true, '#c0392b'); pole(V, BX - 0.006, false, '#3a3f46');
  const w = V.spawn('H2O', 10, -BX + 0.04, BX - 0.04, -BY, BY, { label: true }); const h = V.spawn('H+', 8, -BX + 0.04, BX - 0.04, -BY, BY, { label: true }); V.spawn('SO42-', 3, -BX + 0.04, BX - 0.04, -BY, BY, { label: true });
  V.caption(o.c1); await W2(V, 5);
  V.caption(L3('At the − electrode, H⁺ ions take electrons. Two hydrogen atoms pair up as a molecule of hydrogen gas, H₂, which bubbles up.', '− इलेक्ट्रोड पर H⁺ आयन इलेक्ट्रॉन लेते हैं। दो हाइड्रोजन परमाणु जुड़कर हाइड्रोजन गैस का अणु H₂ बनाते हैं, जो बुलबुले बनकर ऊपर उठता है।', '− electrode par H⁺ ions electrons lete hain. Do hydrogen atoms judkar hydrogen gas ka molecule H₂ banate hain, jo bubble bankar upar uthta hai.'));
  for (let k = 0; k < 4; k++) { const a = h[2 * k], b = h[2 * k + 1]; if (!a || !b) break; a.mode = 'held'; b.mode = 'held'; const y = -0.1 + k * 0.05; a.go(BX - 0.035, y - 0.008, 0.14); b.go(BX - 0.035, y + 0.008, 0.14); await W2(V, 1.2); V.remove(a); V.remove(b); const g = V.add('H2', BX - 0.04, y, { label: k === 0 }); g.mode = 'rise'; g.riseV = 0.05; await W2(V, 0.3); }
  V.caption(L3('At the + electrode, water molecules give away electrons and release oxygen gas, O₂. Only one O₂ is made for every two H₂.', '+ इलेक्ट्रोड पर पानी के अणु इलेक्ट्रॉन देकर ऑक्सीजन गैस O₂ छोड़ते हैं। हर दो H₂ के लिए केवल एक O₂ बनता है।', '+ electrode par paani ke molecules electrons dekar oxygen gas O₂ chhodte hain. Har do H₂ ke liye sirf ek O₂ banta hai.'));
  for (let k = 0; k < 2; k++) { const a = w[2 * k], b = w[2 * k + 1]; a.mode = 'held'; b.mode = 'held'; a.labelIt(null); b.labelIt(null); const y = -0.06 + k * 0.08; a.go(-BX + 0.035, y - 0.01, 0.14); b.go(-BX + 0.035, y + 0.01, 0.14); await W2(V, 1.3); V.remove(a); V.remove(b); const g = V.add('O2', -BX + 0.045, y, { label: k === 0 }); g.mode = 'rise'; g.riseV = 0.05; for (let j = 0; j < 2; j++) V.add('H+', -BX + 0.06, y + rnd(-0.02, 0.02), {}); await W2(V, 0.4); }
  V.caption(L3('So the tube over − collects twice as much gas (hydrogen) as the tube over + (oxygen): 2H₂O → 2H₂ + O₂.', 'इसलिए − के ऊपर की नली में + के ऊपर की नली (ऑक्सीजन) से दोगुनी गैस (हाइड्रोजन) जमा होती है: 2H₂O → 2H₂ + O₂।', 'Isliye − ke upar wali tube mein + ke upar wali tube (oxygen) se double gas (hydrogen) jama hoti hai: 2H₂O → 2H₂ + O₂.'));
  await W2(V, 6);
}
SCRIPTS.electrolysis9v = (V) => waterSplit(V, { c1: L3('Water with a little acid around the two terminals of the battery: water molecules, H⁺ ions and SO₄²⁻ ions. Left: the + terminal. Right: the − terminal.', 'बैटरी के दोनों टर्मिनलों के चारों ओर थोड़े अम्ल वाला पानी: पानी के अणु, H⁺ आयन और SO₄²⁻ आयन। बाएँ: + टर्मिनल। दाएँ: − टर्मिनल।', 'Battery ke dono terminals ke aas-paas thode acid wala paani: paani ke molecules, H⁺ ions aur SO₄²⁻ ions. Left: + terminal. Right: − terminal.') });
SCRIPTS.electrolysis10 = (V) => waterSplit(V, { c1: L3('Acidified water between the two carbon electrodes: water molecules with H⁺ and SO₄²⁻ ions from the acid. Left: the anode (+). Right: the cathode (−).', 'दो कार्बन इलेक्ट्रोडों के बीच अम्लीय पानी: पानी के अणु और अम्ल से आए H⁺ व SO₄²⁻ आयन। बाएँ: ऐनोड (+)। दाएँ: कैथोड (−)।', 'Do carbon electrodes ke beech acidified paani: paani ke molecules aur acid se aaye H⁺ aur SO₄²⁻ ions. Left: anode (+). Right: cathode (−).') });
SCRIPTS.ionic_covalent = async (V) => {
  wall(V, 0, 0.003, 2 * BY, '#6a7480');
  const x = []; for (let i = 0; i < 12; i++) x.push(V.add(i % 2 ? 'Cl-' : 'Na+', -0.17 + (i % 4) * 0.026, -BY + 0.02 + Math.floor(i / 4) * 0.026, { mode: 'fixed', label: i < 2 }));
  const su = []; for (let i = 0; i < 4; i++) su.push(V.add('sugar', 0.07 + (i % 2) * 0.07, -BY + 0.03 + Math.floor(i / 2) * 0.045, { mode: 'fixed', label: i === 0 }));
  V.caption(L3('Left: salt, an ionic compound — a crystal of Na⁺ and Cl⁻ ions. Right: sugar, a covalent compound — made of whole molecules with no charge.', 'बाएँ: नमक, एक आयनिक यौगिक — Na⁺ और Cl⁻ आयनों का क्रिस्टल। दाएँ: चीनी, एक सहसंयोजक यौगिक — बिना आवेश वाले पूरे अणुओं से बनी।', 'Left: namak, ek ionic compound — Na⁺ aur Cl⁻ ions ka crystal. Right: cheeni, ek covalent compound — bina charge wale poore molecules se bani.')); await W2(V, 5);
  V.caption(L3('In water both dissolve. The salt crystal comes apart into free ions; the sugar comes apart into separate molecules, which still have no charge.', 'पानी में दोनों घुल जाते हैं। नमक का क्रिस्टल मुक्त आयनों में बिखर जाता है; चीनी अलग-अलग अणुओं में बिखरती है, जिन पर अब भी कोई आवेश नहीं होता।', 'Paani mein dono ghul jaate hain. Namak ka crystal free ions mein bikhar jaata hai; cheeni alag-alag molecules mein bikharti hai, jin par ab bhi koi charge nahi hota.'));
  for (const p of x) { p.mode = 'free'; p.side = -1; } for (const p of su) { p.mode = 'free'; p.side = 1; } V.temp = 1.6; await W2(V, 4);
  V.caption(L3('With electrodes in the solutions, the ions move towards them and carry the current: the bulb glows. The sugar molecules just wander about, so there is no current. Camphor and naphthalene do not even dissolve in water.', 'विलयनों में इलेक्ट्रोड डालने पर आयन उनकी ओर बढ़ते हैं और धारा ले जाते हैं: बल्ब जलता है। चीनी के अणु बस इधर-उधर घूमते हैं, इसलिए धारा नहीं बहती। कपूर और नैफ़्थलीन तो पानी में घुलते भी नहीं।', 'Solutions mein electrodes daalne par ions unki taraf badhte hain aur current le jaate hain: bulb jalta hai. Cheeni ke molecules bas idhar-udhar ghoomte hain, isliye current nahi behta. Kapoor aur naphthalene to paani mein ghulte bhi nahi.'));
  for (let k = 0; k < 6; k++) { for (const p of x) { if (p.mode !== 'free' && p.mode !== 'go') continue; const P = p.g.position; const left = p.sp === 'Cl-'; p.go(left ? Math.max(-BX + 0.02, P.x - 0.03) : Math.min(-0.03, P.x + 0.03), P.y + rnd(-0.01, 0.01), 0.06); } await W2(V, 0.7); }
  await W2(V, 4);
};
SCRIPTS.acid_conduct = async (V) => {
  pole(V, -BX + 0.006, true, '#8d9196'); pole(V, BX - 0.006, false, '#8d9196');
  const hcl = V.spawn('HCl', 6, -0.15, 0.15, -BY + 0.03, BY - 0.03, { label: true }); V.spawn('H2O', 6, -0.15, 0.15, -BY, BY, {});
  V.caption(L3('Dilute hydrochloric acid: in water each HCl molecule splits into an H⁺ ion and a Cl⁻ ion.', 'तनु हाइड्रोक्लोरिक अम्ल: पानी में हर HCl अणु एक H⁺ आयन और एक Cl⁻ आयन में टूट जाता है।', 'Dilute hydrochloric acid: paani mein har HCl molecule ek H⁺ ion aur ek Cl⁻ ion mein toot jaata hai.')); await W2(V, 3);
  const H = [], Cl = []; for (const [i, m] of hcl.entries()) { const P = m.g.position.clone(); m.labelIt(null); V.remove(m); H.push(V.add('H+', P.x - 0.012, P.y, { label: i === 0 })); Cl.push(V.add('Cl-', P.x + 0.012, P.y, { label: i === 0 })); await W2(V, 0.3); }
  V.caption(L3('Switch on: H⁺ ions move to the − nail and Cl⁻ ions to the + nail. The moving ions carry the current, so the bulb glows. At the − nail H⁺ ions turn into hydrogen gas: the bubbles.', 'स्विच चालू: H⁺ आयन − कील की ओर और Cl⁻ आयन + कील की ओर चलते हैं। चलते हुए आयन धारा ले जाते हैं, इसलिए बल्ब जलता है। − कील पर H⁺ आयन हाइड्रोजन गैस बनते हैं: यही बुलबुले हैं।', 'Switch on: H⁺ ions − keel ki taraf aur Cl⁻ ions + keel ki taraf chalte hain. Chalte hue ions current le jaate hain, isliye bulb jalta hai. − keel par H⁺ ions hydrogen gas bante hain: yahi bubbles hain.'));
  await ionsMove(V, { pos: H, neg: Cl, rounds: 8 });
  V.clear(); pole(V, -BX + 0.006, true, '#8d9196'); pole(V, BX - 0.006, false, '#8d9196'); V.spawn('glu', 5, -0.15, 0.15, -BY + 0.03, BY - 0.03, { label: true }); V.spawn('alc', 4, -0.15, 0.15, -BY + 0.03, BY - 0.03, { label: true });
  V.caption(L3('Glucose (C₆H₁₂O₆) and alcohol (C₂H₅OH) also contain hydrogen, but their molecules stay whole in water: no H⁺ ions, no current, no glow. Only substances that give H⁺ ions in water are acids.', 'ग्लूकोज़ (C₆H₁₂O₆) और ऐल्कोहॉल (C₂H₅OH) में भी हाइड्रोजन है, पर इनके अणु पानी में पूरे ही रहते हैं: न H⁺ आयन, न धारा, न रोशनी। केवल वे पदार्थ अम्ल हैं जो पानी में H⁺ आयन देते हैं।', 'Glucose (C₆H₁₂O₆) aur alcohol (C₂H₅OH) mein bhi hydrogen hai, par inke molecules paani mein poore hi rehte hain: na H⁺ ions, na current, na roshni. Sirf wahi substances acid hain jo paani mein H⁺ ions dete hain.'));
  await W2(V, 8);
};
SCRIPTS.flame_ionic = async (V) => {
  const ring = (r) => { const m = new THREE.Mesh(new THREE.TorusGeometry(r, 0.0012, 6, 64), new THREE.MeshBasicMaterial({ color: 0x5f7387 })); V.box.add(m); V.extra.push(m); return m; };
  ring(0.055); ring(0.1); const ion = V.add('Na+', 0, 0, { mode: 'fixed', label: true, size: 1.4 }); const e = V.add('e-', 0.055, 0, { mode: 'fixed', label: true });
  let ang = 0; const spin = async (sec, r) => { const n = Math.round(sec / 0.1); for (let i = 0; i < n; i++) { ang += 0.35; e.go(Math.cos(ang) * r, Math.sin(ang) * r, 0.6); await W2(V, 0.1); } };
  V.caption(L3('A sodium ion in the flame. Its outer electron moves in a fixed energy level around it.', 'ज्वाला में एक सोडियम आयन। उसका बाहरी इलेक्ट्रॉन उसके चारों ओर एक निश्चित ऊर्जा स्तर में घूमता है।', 'Flame mein ek sodium ion. Uska bahari electron uske chaaron or ek fixed energy level mein ghoomta hai.')); await spin(4, 0.055);
  const flash = async (col) => { V.heat(0.8); await spin(1.2, 0.1); await spin(0.6, 0.055); const ph = V.add('photon', Math.cos(ang) * 0.06, Math.sin(ang) * 0.06, { col, mode: 'fixed' }); ph.go(Math.cos(ang) * 0.28, Math.sin(ang) * 0.28, 0.25); setTimeout(() => V.remove(ph), 1300); V.heat(0.2); };
  V.caption(L3('The heat pushes the electron up to a higher level. It cannot stay there: it falls back and gives out the extra energy as a flash of light.', 'ऊष्मा इलेक्ट्रॉन को ऊँचे स्तर पर धकेल देती है। वह वहाँ टिक नहीं पाता: वापस गिरता है और अतिरिक्त ऊर्जा को प्रकाश की चमक के रूप में छोड़ देता है।', 'Garmi electron ko ooncha level par dhakel deti hai. Woh wahan tik nahi paata: wapas girta hai aur extra energy ko roshni ki chamak ke roop mein chhod deta hai.'));
  for (let k = 0; k < 4; k++) await flash('#ffc21a');
  V.caption(L3('For sodium this light is golden yellow. Potassium gives lilac and barium apple-green, because their energy levels are different. That is why each metal has its own flame colour — and why fireworks have so many colours.', 'सोडियम के लिए यह प्रकाश सुनहरा पीला होता है। पोटैशियम बैंगनी (लाइलैक) और बेरियम सेब-हरा रंग देता है, क्योंकि उनके ऊर्जा स्तर अलग होते हैं। इसीलिए हर धातु की ज्वाला का अपना रंग होता है — और आतिशबाज़ी में इतने रंग होते हैं।', 'Sodium ke liye yeh roshni golden yellow hoti hai. Potassium lilac aur barium apple-green deta hai, kyunki unke energy levels alag hote hain. Isiliye har metal ki flame ka apna rang hota hai — aur fireworks mein itne rang hote hain.'));
  ion.labelIt('K⁺'); ion.recolor('#8a55d4'); for (let k = 0; k < 2; k++) await flash('#b88cff');
  ion.labelIt('Ba²⁺'); ion.recolor('#2db3a4'); for (let k = 0; k < 2; k++) await flash('#8fe85a');
  V.heat(0); await W2(V, 4);
};
export const HAS_PARTICLES = (id) => !!SCRIPTS[id];
