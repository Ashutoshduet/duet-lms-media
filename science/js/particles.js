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
  'e-': { a: [['X', 0, 0]], l: 'e⁻', big: 0.42, col: '#ffe14a' },
  FeS: { a: [['Fe', -s * 0.6, 0], ['S', s * 0.6, 0]], l: 'FeS' }, H2S: { a: [['S', 0, 0], ['H', -s, s * 0.6], ['H', s, s * 0.6]], l: 'H₂S' },
  acet: { a: [['C', 0, 0], ['O', 0, s * 1.1], ['C', -s * 1.1, -s * 0.5], ['C', s * 1.1, -s * 0.5]], l: 'acetone' }, fat: { a: [['X', 0, 0]], l: '', big: 1.9, col: '#f6e7a8' },
  oil: { a: [['X', 0, 0]], l: '', big: 1.6, col: '#d9b23a' }, chalk: { a: [['X', 0, 0]], l: '', big: 3.2, col: '#f1efe8' }, Sc: { a: [['S', -s * 0.5, 0], ['S', s * 0.5, 0], ['S', 0, s * 0.8], ['S', 0, -s * 0.6]], l: 'S' }, photon: { a: [['X', 0, 0]], l: '', big: 0.75, col: '#ffd23a' },
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
    this.title(tx({ en: 'Inside the reaction', hi: 'रिएक्शन के अंदर', hg: 'Reaction ke andar' }, this.L()));
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
    c1: L3('Left: lead nitrate solution (Pb²⁺ and NO₃⁻ ions). Right: potassium iodide solution (K⁺ and I⁻ ions). The ions move freely in water.', 'बाएँ: लेड नाइट्रेट का घोल (Pb²⁺ और NO₃⁻ आयन)। दाएँ: पोटैशियम आयोडाइड का घोल (K⁺ और I⁻ आयन)। पानी में आयन आज़ादी से घूमते रहते हैं।', 'Left: lead nitrate solution (Pb²⁺ aur NO₃⁻ ions). Right: potassium iodide solution (K⁺ aur I⁻ ions). Paani mein ions aazaadi se ghoomte rehte hain.'),
    c2: L3('When we mix them, each Pb²⁺ ion meets I⁻ ions.', 'मिलाते ही हर Pb²⁺ आयन को I⁻ आयन मिल जाते हैं।', 'Milaate hi har Pb²⁺ ion ko I⁻ ions mil jaate hain.'),
    c3: L3('One Pb²⁺ joins two I⁻ to form lead iodide, PbI₂. It does not dissolve, so it sinks as a yellow solid — the precipitate. K⁺ and NO₃⁻ stay in the water.', 'एक Pb²⁺ दो I⁻ से जुड़कर लेड आयोडाइड PbI₂ बनाता है। यह पानी में घुलता नहीं, इसलिए पीला ठोस (अवक्षेप) बनकर नीचे बैठ जाता है। K⁺ और NO₃⁻ पानी में ही रहते हैं।', 'Ek Pb²⁺ do I⁻ se judkar lead iodide PbI₂ banata hai. Ye paani mein ghulta nahi, isliye peela precipitate bankar neeche baith jaata hai. K⁺ aur NO₃⁻ paani mein hi rehte hain.'),
  }),
  ba_so4: (V) => precipitate(V, {
    cat: 'Ba2+', catPartner: 'Cl-', an: 'SO42-', anPartner: 'Na+', nc: 6, ratio: 1, solidCol: '#f4f4f0', prodLabel: 'BaSO₄',
    c1: L3('Left: barium chloride solution (Ba²⁺, Cl⁻). Right: sodium sulphate solution (Na⁺, SO₄²⁻).', 'बाएँ: बेरियम क्लोराइड का घोल (Ba²⁺, Cl⁻)। दाएँ: सोडियम सल्फ़ेट का घोल (Na⁺, SO₄²⁻)।', 'Left: barium chloride solution (Ba²⁺, Cl⁻). Right: sodium sulphate solution (Na⁺, SO₄²⁻).'),
    c2: L3('On mixing, Ba²⁺ and SO₄²⁻ ions find each other.', 'मिलाते ही Ba²⁺ और SO₄²⁻ आयन एक-दूसरे को ढूँढ लेते हैं।', 'Milaate hi Ba²⁺ aur SO₄²⁻ ions ek-doosre ko dhoondh lete hain.'),
    c3: L3('They join as barium sulphate, BaSO₄ — a white solid that does not dissolve. Na⁺ and Cl⁻ stay dissolved. The ions swapped partners: a double displacement reaction.', 'ये जुड़कर बेरियम सल्फ़ेट BaSO₄ बनाते हैं — एक सफ़ेद ठोस जो घुलता नहीं। Na⁺ और Cl⁻ घुले ही रहते हैं। यानी आयनों ने अपने साथी बदल लिए — यही डबल डिस्प्लेसमेंट रिएक्शन है।', 'Ye judkar barium sulphate BaSO₄ banate hain — ek safed solid jo ghulta nahi. Na⁺ aur Cl⁻ ghule hi rehte hain. Yaani ions ne apne partner badal liye — yahi double displacement reaction hai.'),
  }),
  zn_acid: (V) => metalGas(V, {
    metal: 'Zn', ion: 'Zn2+', spect: 'SO42-',
    c1: L3('At the bottom: zinc atoms of the granule. In the water: H⁺ ions and SO₄²⁻ ions from dilute sulphuric acid.', 'नीचे: ज़िंक के दाने के एटम। पानी में: डाइल्यूट सल्फ़्यूरिक एसिड से आए H⁺ और SO₄²⁻ आयन।', 'Neeche: zinc ke daane ke atoms. Paani mein: dilute sulphuric acid se aaye H⁺ aur SO₄²⁻ ions.'),
    c2: L3('A zinc atom gives two electrons to two H⁺ ions.', 'ज़िंक का एक एटम दो H⁺ आयनों को अपने दो इलेक्ट्रॉन दे देता है।', 'Zinc ka ek atom do H⁺ ions ko apne do electrons de deta hai.'),
    c3: L3('The two H atoms join as H₂ gas and bubble up. The zinc goes into the water as Zn²⁺ — zinc sulphate. That is why the granule slowly gets smaller.', 'दो H एटम जुड़कर H₂ गैस बनाते हैं और बुलबुले बनकर ऊपर उठते हैं। ज़िंक Zn²⁺ बनकर पानी में चला जाता है — यानी ज़िंक सल्फ़ेट बनता है। इसीलिए दाना धीरे-धीरे छोटा होता जाता है।', 'Do H atoms judkar H₂ gas banate hain aur bulbule bankar upar uthte hain. Zinc Zn²⁺ bankar paani mein chala jaata hai — yaani zinc sulphate banta hai. Isiliye daana dheere-dheere chhota hota jaata hai.'),
  }),
  metals_hcl: (V) => metalGas(V, {
    metal: 'Mg', ion: 'Mg2+', spect: 'Cl-', rounds: 5, heat: true,
    c1: L3('Magnesium atoms (bottom) in dilute hydrochloric acid (H⁺ and Cl⁻ ions).', 'डाइल्यूट हाइड्रोक्लोरिक एसिड (H⁺ और Cl⁻ आयन) में मैग्नीशियम के एटम (नीचे)।', 'Dilute hydrochloric acid (H⁺ aur Cl⁻ ions) mein magnesium ke atoms (neeche).'),
    c2: L3('Magnesium gives away its electrons very easily, so H⁺ ions turn into H₂ very fast.', 'मैग्नीशियम अपने इलेक्ट्रॉन बहुत आसानी से दे देता है, इसलिए H⁺ आयन बहुत जल्दी H₂ बन जाते हैं।', 'Magnesium apne electrons bahut aasaani se de deta hai, isliye H⁺ ions bahut jaldi H₂ ban jaate hain.'),
    c3: L3('More reactive metals do this faster: Mg > Al > Zn > Fe. Copper cannot give its electrons to H⁺, so nothing happens with copper. The reaction also gives out heat.', 'जो धातु ज़्यादा रिएक्टिव होती है, वह यह काम और तेज़ी से करती है: Mg > Al > Zn > Fe। कॉपर अपने इलेक्ट्रॉन H⁺ को नहीं दे पाता, इसलिए कॉपर के साथ कुछ नहीं होता। इस रिएक्शन में गर्मी भी निकलती है।', 'Jo metal zyada reactive hoti hai, woh ye kaam aur tezi se karti hai: Mg > Al > Zn > Fe. Copper apne electrons H⁺ ko nahi de paata, isliye copper ke saath kuch nahi hota. Is reaction mein garmi bhi nikalti hai.'),
  }),
  zn_naoh: (V) => metalGas(V, {
    metal: 'Zn', ion: 'Zn2+', spect: 'Na+', hion: 'H2O', nh: 12, rounds: 3, heat: true,
    c1: L3('Zinc atoms in warm sodium hydroxide solution (Na⁺, OH⁻ and water).', 'गरम सोडियम हाइड्रॉक्साइड के घोल (Na⁺, OH⁻ और पानी) में ज़िंक के एटम।', 'Garam sodium hydroxide solution (Na⁺, OH⁻ aur paani) mein zinc ke atoms.'),
    c2: L3('On warming, zinc reacts with the hydroxide and water.', 'गरम करने पर ज़िंक, हाइड्रॉक्साइड और पानी के साथ रिएक्शन करता है।', 'Garam karne par zinc, hydroxide aur paani ke saath react karta hai.'),
    c3: L3('Hydrogen gas (H₂) is released and zinc goes into the solution as sodium zincate, Na₂ZnO₂.', 'हाइड्रोजन गैस (H₂) निकलती है, और ज़िंक सोडियम ज़िंकेट Na₂ZnO₂ बनकर घोल में चला जाता है।', 'Hydrogen gas (H₂) nikalti hai, aur zinc sodium zincate Na₂ZnO₂ bankar solution mein chala jaata hai.'),
  }),
  fe_cuso4: (V) => displacement(V, {
    metal: 'Fe', ionIn: 'Cu2+', ionOut: 'Fe2+', deposit: 'Cu',
    c1: L3('Iron atoms of the nail (bottom). Blue copper sulphate solution: Cu²⁺ and SO₄²⁻ ions.', 'कील के आयरन एटम (नीचे)। नीला कॉपर सल्फ़ेट का घोल: Cu²⁺ और SO₄²⁻ आयन।', 'Keel ke iron atoms (neeche). Neela copper sulphate solution: Cu²⁺ aur SO₄²⁻ ions.'),
    c2: L3('Iron is more reactive than copper. An iron atom gives two electrons to a Cu²⁺ ion.', 'आयरन, कॉपर से ज़्यादा रिएक्टिव है। आयरन का एक एटम एक Cu²⁺ आयन को दो इलेक्ट्रॉन दे देता है।', 'Iron, copper se zyada reactive hai. Iron ka ek atom ek Cu²⁺ ion ko do electrons de deta hai.'),
    c3: L3('Cu²⁺ becomes copper metal and sticks on the nail (brown coat). Iron goes into the water as Fe²⁺ (pale green). Fewer Cu²⁺ ions means less blue colour.', 'Cu²⁺ कॉपर धातु बनकर कील पर जम जाता है (भूरी परत)। आयरन Fe²⁺ बनकर पानी में चला जाता है (हल्का हरा)। Cu²⁺ जितने कम, नीला रंग उतना हल्का।', 'Cu²⁺ copper metal bankar keel par jam jaata hai (brown layer). Iron Fe²⁺ bankar paani mein chala jaata hai (halka hara). Cu²⁺ jitne kam, neela rang utna halka.'),
  }),
  reactivity: (V) => displacement(V, {
    metal: 'Zn', ionIn: 'Cu2+', ionOut: 'Zn2+', deposit: 'Cu',
    c1: L3('Tube A: zinc atoms in copper sulphate (Cu²⁺ ions).', 'टेस्ट ट्यूब A: कॉपर सल्फ़ेट (Cu²⁺ आयन) में ज़िंक के एटम।', 'Test tube A: copper sulphate (Cu²⁺ ions) mein zinc ke atoms.'),
    c2: L3('Zinc holds its electrons less tightly than copper, so it hands them to Cu²⁺.', 'ज़िंक अपने इलेक्ट्रॉन कॉपर जितनी मज़बूती से नहीं पकड़ता, इसलिए उन्हें Cu²⁺ को दे देता है।', 'Zinc apne electrons copper jitni mazbooti se nahi pakadta, isliye unhe Cu²⁺ ko de deta hai.'),
    c3: L3('Copper deposits, zinc dissolves as Zn²⁺. The reverse never happens: copper cannot push zinc or iron out of their salts. Order: Zn > Fe > Cu.', 'कॉपर जम जाता है और ज़िंक Zn²⁺ बनकर घुल जाता है। उल्टा कभी नहीं होता: कॉपर, ज़िंक या आयरन को उनके लवण से बाहर नहीं निकाल सकता। क्रम: Zn > Fe > Cu।', 'Copper jam jaata hai aur zinc Zn²⁺ bankar ghul jaata hai. Ulta kabhi nahi hota: copper, zinc ya iron ko unke salt se bahar nahi nikaal sakta. Order: Zn > Fe > Cu.'),
  }),
  mg_burn: async (V) => {
    const mg = V.metalSurface('Mg', 8, -0.03);
    const o2 = V.spawn('O2', 6, -BX, BX, 0.04, BY, { label: true });
    V.caption(L3('Magnesium atoms in the ribbon, and oxygen molecules (O₂) in the air.', 'रिबन में मैग्नीशियम के एटम, और हवा में ऑक्सीजन के मॉलिक्यूल (O₂)।', 'Ribbon mein magnesium ke atoms, aur hawa mein oxygen ke molecules (O₂).')); await W2(V, 4.5);
    V.caption(L3('In the flame, magnesium burns: each O₂ breaks into two O atoms and each joins one Mg atom. Lots of energy comes out as a dazzling white light.', 'लौ में मैग्नीशियम जलता है: हर O₂ टूटकर दो O एटम बनता है और हर O एक Mg एटम से जुड़ जाता है। बहुत सारी एनर्जी तेज़ चमकदार सफ़ेद रोशनी बनकर निकलती है।', 'Flame mein magnesium jalta hai: har O₂ tootkar do O atoms banta hai aur har O ek Mg atom se jud jaata hai. Bahut saari energy tez chamakdaar safed roshni bankar nikalti hai.'));
    V.heat(1);
    const top = mg.slice(8);
    for (let k = 0; k < Math.min(6, o2.length); k++) {
      const m1 = top[k], m2 = top[k + 1] || mg[k]; const o = o2[k]; o.mode = 'held'; o.labelIt(null); o.go(m1.g.position.x + 0.012, m1.g.position.y + 0.03, 0.14); await W2(V, 0.8);
      V.remove(o); for (const m of [m1]) { const p = m.g.position.clone(); V.remove(m); const mo = V.add('MgO', p.x, p.y + 0.01, { col: '#f6f6f2', label: k === 0 }); mo.vel.set(rnd(-0.01, 0.01), 0.02, 0); } void m2;
    }
    await W2(V, 2); V.heat(0);
    V.caption(L3('The product is magnesium oxide (MgO), a white powder. Dissolved in water it forms magnesium hydroxide, a base — so red litmus turns blue.', 'जो बनता है वह मैग्नीशियम ऑक्साइड (MgO) है — एक सफ़ेद पाउडर। पानी में घोलने पर यह मैग्नीशियम हाइड्रॉक्साइड बनाता है, जो एक बेस (क्षार) है — इसलिए लाल लिटमस नीला हो जाता है।', 'Jo banta hai woh magnesium oxide (MgO) hai — ek safed powder. Paani mein gholne par ye magnesium hydroxide banata hai, jo ek base hai — isliye laal litmus neela ho jaata hai.')); await W2(V, 7);
  },
  neutral: async (V) => {
    const oh = V.spawn('OH-', 8, -BX, BX, -BY, BY, { label: true }); V.spawn('Na+', 8, -BX, BX, -BY, BY, { label: true }); const ind = V.spawn('ind', 5, -BX, BX, -BY, BY, { col: '#e83e8c' });
    V.caption(L3('Sodium hydroxide solution: Na⁺ and OH⁻ ions. Phenolphthalein molecules are pink because there is extra OH⁻.', 'सोडियम हाइड्रॉक्साइड का घोल: Na⁺ और OH⁻ आयन। OH⁻ ज़्यादा होने की वजह से फ़िनॉल्फ़्थेलिन के मॉलिक्यूल गुलाबी हैं।', 'Sodium hydroxide solution: Na⁺ aur OH⁻ ions. OH⁻ zyada hone ki wajah se phenolphthalein ke molecules pink hain.')); await W2(V, 5);
    V.caption(L3('Each drop of acid brings H⁺ (and Cl⁻). An H⁺ and an OH⁻ join to make one water molecule.', 'एसिड की हर बूँद H⁺ (और Cl⁻) लाती है। एक H⁺ और एक OH⁻ मिलकर पानी का एक मॉलिक्यूल बनाते हैं।', 'Acid ki har boond H⁺ (aur Cl⁻) laati hai. Ek H⁺ aur ek OH⁻ milkar paani ka ek molecule banate hain.'));
    for (let k = 0; k < oh.length; k++) {
      const h = V.add('H+', rnd(-0.05, 0.05), BY, { label: k === 0 }); V.add('Cl-', rnd(-0.1, 0.1), BY, {}); const o = V.nearestFree(oh, h.g.position); if (!o) break; o.mode = 'held';
      h.go(o.g.position.x, o.g.position.y, 0.16); await W2(V, 1.1); const p = o.g.position.clone(); V.remove(o); V.remove(h); V.add('H2O', p.x, p.y, { label: k === 0 });
      if (k === oh.length - 1) ind.forEach((i) => i.recolor('#f3eff0'));
    }
    V.caption(L3('When all OH⁻ is used up, the solution is neutral (only Na⁺, Cl⁻ and water — salt solution) and phenolphthalein becomes colourless. One more drop of base brings the pink back.', 'जब सारा OH⁻ ख़त्म हो जाता है, तो घोल न्यूट्रल हो जाता है (बस Na⁺, Cl⁻ और पानी — यानी नमक का घोल) और फ़िनॉल्फ़्थेलिन बेरंग हो जाता है। बेस की एक बूँद और डालते ही गुलाबी रंग लौट आता है।', 'Jab saara OH⁻ khatam ho jaata hai, to solution neutral ho jaata hai (bas Na⁺, Cl⁻ aur paani — yaani namak ka ghol) aur phenolphthalein colourless ho jaata hai. Base ki ek boond aur daalte hi pink rang laut aata hai.')); await W2(V, 8);
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
  L3(`Left: an acid has extra H⁺ ions. Right: a base has extra OH⁻ ions. Grey shapes are ${name.en} dye molecules.`, `बाईं तरफ़ एसिड है, जिसमें H⁺ आयन ज़्यादा होते हैं। दाईं तरफ़ बेस है, जिसमें OH⁻ आयन ज़्यादा होते हैं। स्लेटी आकृतियाँ ${name.hi} के डाई मॉलिक्यूल (अणु) हैं।`, `Left side par acid hai, jisme H⁺ ions zyada hote hain. Right side par base hai, jisme OH⁻ ions zyada hote hain. Grey shapes ${name.hg} ke dye molecules hain.`),
  L3(`The dye molecule changes its shape a little when it meets many H⁺ or many OH⁻, and with it its colour: ${acid.en} in acid, ${base.en} in base.`, `जब डाई मॉलिक्यूल को बहुत सारे H⁺ या बहुत सारे OH⁻ मिलते हैं, तो उसका आकार थोड़ा बदल जाता है — और उसके साथ रंग भी: एसिड में ${acid.hi}, बेस में ${base.hi}।`, `Jab dye molecule ko bahut saare H⁺ ya bahut saare OH⁻ milte hain, to uska shape thoda badal jaata hai — aur saath mein rang bhi: acid mein ${acid.hg}, base mein ${base.hg}.`),
];
const N = (en, hi, hg) => ({ en, hi, hg });
SCRIPTS.litmus = indicator('#d23a3a', '#3f6fd1', ...indCap(N('litmus', 'लिटमस', 'litmus'), N('red', 'लाल', 'red'), N('blue', 'नीला', 'blue')));
SCRIPTS.turmeric = indicator('#e8b422', '#b5361f', ...indCap(N('turmeric', 'हल्दी', 'haldi'), N('yellow (no change)', 'पीला (कोई बदलाव नहीं)', 'yellow (koi change nahi)'), N('red', 'लाल', 'red')));
SCRIPTS.chinarose = indicator('#c2185b', '#2e9d4a', ...indCap(N('china rose', 'गुड़हल', 'gudhal'), N('dark pink', 'गहरा गुलाबी', 'dark pink'), N('green', 'हरा', 'green')));
SCRIPTS.ph_paper = indicator('#e53935', '#5e35b1', ...indCap(N('universal indicator', 'यूनिवर्सल इंडिकेटर', 'universal indicator'), N('red to yellow (pH below 7)', 'लाल से पीला (pH 7 से कम)', 'red se yellow (pH 7 se kam)'), N('blue to violet (pH above 7)', 'नीले से बैंगनी (pH 7 से ज़्यादा)', 'blue se violet (pH 7 se zyada)')));
SCRIPTS.ph_salts = indicator('#fb8c00', '#3949ab', ...indCap(N('universal indicator', 'यूनिवर्सल इंडिकेटर', 'universal indicator'), N('orange (salts like CuSO₄, ZnSO₄ make a few H⁺)', 'नारंगी (CuSO₄, ZnSO₄ जैसे लवण थोड़े H⁺ बनाते हैं)', 'orange (CuSO₄, ZnSO₄ jaise salts thode H⁺ banate hain)'), N('blue (Na₂CO₃, NaHCO₃ make a few OH⁻ with water)', 'नीला (Na₂CO₃, NaHCO₃ पानी के साथ थोड़े OH⁻ बनाते हैं)', 'blue (Na₂CO₃, NaHCO₃ paani ke saath thode OH⁻ banate hain)')));

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
const limeC3 = L3('CO₂ reacts with lime water, Ca(OH)₂, to form calcium carbonate, CaCO₃ — tiny white solid particles that make the liquid milky and slowly settle.', 'CO₂ चूने के पानी Ca(OH)₂ से रिएक्शन करके कैल्शियम कार्बोनेट CaCO₃ बनाती है — सफ़ेद ठोस के बहुत छोटे कण, जिनसे घोल दूधिया हो जाता है और जो धीरे-धीरे नीचे बैठ जाते हैं।', 'CO₂ lime water Ca(OH)₂ se react karke calcium carbonate CaCO₃ banati hai — safed solid ke bahut chhote kan, jinse ghol milky ho jaata hai aur jo dheere-dheere neeche baith jaate hain.');
const limeC2 = L3('The CO₂ gas reaches the lime water on the right (Ca²⁺ and OH⁻ ions).', 'CO₂ गैस दाईं ओर रखे चूने के पानी (Ca²⁺ और OH⁻ आयन) तक पहुँचती है।', 'CO₂ gas right side rakhe lime water (Ca²⁺ aur OH⁻ ions) tak pahunchti hai.');
SCRIPTS.carb_lime = (V) => co2Lime(V, { carb: 'CO32-', c1: L3('Sodium carbonate gives CO₃²⁻ ions; the acid gives H⁺ ions. H⁺ ions attack the carbonate.', 'सोडियम कार्बोनेट से CO₃²⁻ आयन मिलते हैं; एसिड से H⁺ आयन। H⁺ आयन कार्बोनेट पर टूट पड़ते हैं।', 'Sodium carbonate se CO₃²⁻ ions milte hain; acid se H⁺ ions. H⁺ ions carbonate par toot padte hain.'), c2: limeC2, c3: limeC3 });
SCRIPTS.vinegar_soda = (V) => co2Lime(V, { carb: 'HCO3-', c1: L3('Baking soda gives HCO₃⁻ ions; vinegar (acetic acid) gives H⁺ ions. They react to make water and carbon dioxide gas — the fizz.', 'बेकिंग सोडा से HCO₃⁻ आयन मिलते हैं; सिरके (एसीटिक एसिड) से H⁺ आयन। दोनों रिएक्शन करके पानी और कार्बन डाइऑक्साइड गैस बनाते हैं — यही झाग वाले बुलबुले हैं।', 'Baking soda se HCO₃⁻ ions milte hain; sirke (acetic acid) se H⁺ ions. Dono react karke paani aur carbon dioxide gas banate hain — yahi fizz hai.'), c2: limeC2, c3: limeC3 });
SCRIPTS.breath_lime = (V) => co2Lime(V, { start: 'breath', c1: L3('The air we breathe out has carbon dioxide (CO₂) made by our body cells.', 'हम साँस में जो हवा बाहर छोड़ते हैं, उसमें कार्बन डाइऑक्साइड (CO₂) होती है। इसे हमारे शरीर की कोशिकाएँ बनाती हैं।', 'Hum saans mein jo hawa bahar chhodte hain, usmein carbon dioxide (CO₂) hoti hai. Ise hamare body cells banate hain.'), c2: limeC2, c3: limeC3 });

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
  c1: L3('Green crystals of ferrous sulphate (FeSO₄) — each unit also holds water molecules.', 'फ़ेरस सल्फ़ेट (FeSO₄) के हरे क्रिस्टल — हर यूनिट में पानी के मॉलिक्यूल भी बँधे होते हैं।', 'Ferrous sulphate (FeSO₄) ke hare crystals — har unit mein paani ke molecules bhi bandhe hote hain.'),
  c2: L3('Heat first drives out the water, then breaks FeSO₄ apart. Sulphur dioxide and sulphur trioxide gases escape (burning-sulphur smell).', 'गरम करने पर पहले पानी निकल जाता है, फिर FeSO₄ टूट जाता है। सल्फ़र डाइऑक्साइड और सल्फ़र ट्राइऑक्साइड गैसें निकलती हैं (जलते सल्फ़र जैसी गंध आती है)।', 'Garam karne par pehle paani nikal jaata hai, phir FeSO₄ toot jaata hai. Sulphur dioxide aur sulphur trioxide gases nikalti hain (jalte sulphur jaisi smell aati hai).'),
  c3: L3('What is left is ferric oxide, Fe₂O₃ — the reddish-brown solid. One substance breaking into several is a decomposition reaction.', 'जो बचता है वह फ़ेरिक ऑक्साइड Fe₂O₃ है — लाल-भूरा ठोस। एक पदार्थ का टूटकर कई पदार्थ बन जाना डीकम्पोज़िशन (अपघटन) रिएक्शन कहलाता है।', 'Jo bachta hai woh ferric oxide Fe₂O₃ hai — laal-bhoora solid. Ek substance ka tootkar kai substances ban jaana decomposition reaction kehlata hai.') });
SCRIPTS.pbno3_heat = decompose({ unit: 'NO3-', unitCol: '#f4f4f0', solidCol: '#e6c43a', solidLabel: 'PbO', gases: [['NO2', 2], ['O2', 1]],
  c1: L3('White lead nitrate, Pb(NO₃)₂, is made of Pb²⁺ and NO₃⁻ ions.', 'सफ़ेद लेड नाइट्रेट Pb(NO₃)₂, Pb²⁺ और NO₃⁻ आयनों से बना होता है।', 'Safed lead nitrate Pb(NO₃)₂, Pb²⁺ aur NO₃⁻ ions se bana hota hai.'),
  c2: L3('Strong heat breaks the nitrate apart: brown nitrogen dioxide (NO₂) and oxygen (O₂) gases come out.', 'तेज़ गरम करने पर नाइट्रेट टूट जाता है: भूरी नाइट्रोजन डाइऑक्साइड (NO₂) और ऑक्सीजन (O₂) गैसें निकलती हैं।', 'Tez garam karne par nitrate toot jaata hai: brown nitrogen dioxide (NO₂) aur oxygen (O₂) gases nikalti hain.'),
  c3: L3('Yellowish lead oxide (PbO) is left. The brown fumes are NO₂. This is thermal decomposition.', 'पीला-सा लेड ऑक्साइड (PbO) बचता है। भूरा धुआँ NO₂ है। यह थर्मल डीकम्पोज़िशन है।', 'Peela-sa lead oxide (PbO) bachta hai. Bhoora dhuaan NO₂ hai. Ye thermal decomposition hai.') });
SCRIPTS.sugar_heat = decompose({ unit: 'sugar', unitCol: null, solidCol: '#1c1c1c', solidLabel: 'C', gases: [['H2O', 2]],
  c1: L3('Sugar molecules are made of carbon (grey), hydrogen (white) and oxygen (red) atoms.', 'चीनी के मॉलिक्यूल कार्बन (स्लेटी), हाइड्रोजन (सफ़ेद) और ऑक्सीजन (लाल) एटम से बने होते हैं।', 'Cheeni ke molecules carbon (grey), hydrogen (white) aur oxygen (red) atoms se bane hote hain.'),
  c2: L3('Strong heat breaks the molecules: hydrogen and oxygen leave together as water vapour.', 'तेज़ गरम करने पर मॉलिक्यूल टूट जाते हैं: हाइड्रोजन और ऑक्सीजन साथ मिलकर पानी की भाप बनकर निकल जाते हैं।', 'Tez garam karne par molecules toot jaate hain: hydrogen aur oxygen saath milkar paani ki bhaap bankar nikal jaate hain.'),
  c3: L3('Only carbon is left — the black solid (charcoal). So sugar is a compound of carbon, hydrogen and oxygen.', 'बस कार्बन बचता है — काला ठोस (चारकोल)। यानी चीनी कार्बन, हाइड्रोजन और ऑक्सीजन से बना कंपाउंड (यौगिक) है।', 'Bas carbon bachta hai — kaala solid (charcoal). Yaani cheeni carbon, hydrogen aur oxygen se bana compound hai.') });
SCRIPTS.cuso4_heat = async (V) => {
  const u = []; for (let i = 0; i < 6; i++) u.push(V.add('SO42-', -0.1 + (i % 3) * 0.1, -0.08 + Math.floor(i / 3) * 0.07, { mode: 'fixed', halo: '#2f86e8', label: i === 4 }));
  const w = u.map((p) => { const out = []; for (let k = 0; k < 2; k++) { const m = V.add('H2O', p.g.position.x + (k ? 0.026 : -0.026), p.g.position.y + 0.02, { mode: 'fixed' }); out.push(m); } return out; });
  V.caption(L3('Blue copper sulphate crystals: each CuSO₄ holds five water molecules (water of crystallisation). This water gives the blue colour.', 'नीले कॉपर सल्फ़ेट क्रिस्टल: हर CuSO₄ के साथ पानी के पाँच मॉलिक्यूल बँधे रहते हैं (क्रिस्टलन का जल)। इसी पानी से नीला रंग आता है।', 'Neele copper sulphate crystals: har CuSO₄ ke saath paani ke paanch molecules bandhe rehte hain (water of crystallisation). Isi paani se neela rang aata hai.')); await W2(V, 5);
  V.heat(0.8); V.caption(L3('On heating, the water molecules leave as steam. Without them the solid is white (anhydrous CuSO₄).', 'गरम करने पर पानी के मॉलिक्यूल भाप बनकर निकल जाते हैं। उनके बिना ठोस सफ़ेद हो जाता है (बिना पानी वाला, यानी निर्जल CuSO₄)।', 'Garam karne par paani ke molecules bhaap bankar nikal jaate hain. Unke bina solid safed ho jaata hai (anhydrous CuSO₄).'));
  for (let i = 0; i < u.length; i++) { for (const m of w[i]) { m.mode = 'rise'; m.riseV = 0.06; } u[i].halo.visible = false; await W2(V, 0.9); }
  V.heat(0); await W2(V, 2);
  V.caption(L3('Add water back: the molecules take their places again and the blue colour returns. The change can be reversed.', 'फिर से पानी डालिए: मॉलिक्यूल अपनी जगह लौट आते हैं और नीला रंग वापस आ जाता है। यानी यह बदलाव उलटा भी हो सकता है।', 'Phir se paani daaliye: molecules apni jagah laut aate hain aur neela rang wapas aa jaata hai. Yaani ye badlaav ulta bhi ho sakta hai.'));
  for (let i = 0; i < u.length; i++) { const p = u[i].g.position; const m = V.add('H2O', p.x + rnd(-0.1, 0.1), BY, {}); m.go(p.x - 0.026, p.y + 0.02, 0.12); await W2(V, 0.5); u[i].halo.visible = true; }
  await W2(V, 6);
};
SCRIPTS.cao_water = async (V) => {
  const cs = []; for (let i = 0; i < 8; i++) cs.push(V.add('CaO', -0.12 + (i % 4) * 0.08, -BY + 0.02 + Math.floor(i / 4) * 0.035, { mode: 'fixed', label: i === 5 }));
  const ws = V.spawn('H2O', 12, -BX, BX, -0.02, BY, { label: true });
  V.caption(L3('Quick lime is calcium oxide, CaO. Water molecules are all around it.', 'बिना बुझा चूना (क्विक लाइम) कैल्शियम ऑक्साइड CaO है। इसके चारों ओर पानी के मॉलिक्यूल हैं।', 'Quick lime (bina bujha choona) calcium oxide CaO hai. Iske chaaron taraf paani ke molecules hain.')); await W2(V, 4.5);
  V.caption(L3('Each CaO combines with one H₂O to form calcium hydroxide, Ca(OH)₂ (slaked lime), and a lot of heat is given out.', 'हर CaO एक H₂O से जुड़कर कैल्शियम हाइड्रॉक्साइड Ca(OH)₂ (बुझा चूना) बनाता है, और बहुत गर्मी निकलती है।', 'Har CaO ek H₂O se judkar calcium hydroxide Ca(OH)₂ (slaked lime) banata hai, aur bahut garmi nikalti hai.'));
  for (let i = 0; i < cs.length; i++) { const c = cs[i]; const w = V.nearestFree(ws, c.g.position); if (!w) break; w.mode = 'held'; w.go(c.g.position.x + 0.02, c.g.position.y + 0.012, 0.14); await W2(V, 0.8); V.remove(w); c.recolor('#f4f4ee'); if (i === 2) c.labelIt('Ca(OH)₂'); V.heat(Math.min(1, (i + 1) / 5)); V.temp = 1 + i * 0.25; }
  await W2(V, 2);
  V.caption(L3('Two substances join to make one: a combination reaction. Because it gives out heat, it is also exothermic — the beaker becomes hot.', 'दो पदार्थ मिलकर एक बन गए: यह कॉम्बिनेशन (संयोजन) रिएक्शन है। इसमें गर्मी निकलती है, इसलिए यह एक्सोथर्मिक (ऊष्माक्षेपी) भी है — बीकर गरम हो जाता है।', 'Do substances milkar ek ban gaye: ye combination reaction hai. Ismein garmi nikalti hai, isliye ye exothermic bhi hai — beaker garam ho jaata hai.')); await W2(V, 7); V.heat(0);
};

// dissolving, diffusion, evaporation, colloids, sublimation, chromatography, rusting
SCRIPTS.solubility = async (V) => {
  const cr = []; for (let i = 0; i < 9; i++) cr.push(V.add('sugar', -0.12 + (i % 3) * 0.035, -BY + 0.02 + Math.floor(i / 3) * 0.03, { mode: 'fixed', label: i === 7 }));
  const sand = V.add('sand', 0.13, -BY + 0.04, { mode: 'fixed' }); const sl = V.sprite(tx(N('sand grain', 'रेत का कण', 'ret ka kan'), V.L())); sl.position.set(0.13, -BY + 0.1, 0.03); V.box.add(sl); V.extra.push(sl);
  V.spawn('H2O', 16, -BX, BX, -0.06, BY, { label: true });
  V.caption(L3('Left: a sugar crystal — sugar molecules packed together. Right: a grain of sand. Water molecules move all around.', 'बाएँ: चीनी का क्रिस्टल — पास-पास जमे चीनी के मॉलिक्यूल। दाएँ: रेत का एक कण। चारों ओर पानी के मॉलिक्यूल घूम रहे हैं।', 'Left: cheeni ka crystal — paas-paas jame cheeni ke molecules. Right: ret ka ek kan. Chaaron taraf paani ke molecules ghoom rahe hain.')); await W2(V, 5);
  V.caption(L3('Water molecules pull sugar molecules away one by one, and they spread into the spaces between water molecules. Stirring helps.', 'पानी के मॉलिक्यूल चीनी के मॉलिक्यूल को एक-एक करके खींच लेते हैं, और वे पानी के मॉलिक्यूल के बीच की खाली जगह में फैल जाते हैं। हिलाने से यह जल्दी होता है।', 'Paani ke molecules cheeni ke molecules ko ek-ek karke kheench lete hain, aur woh paani ke molecules ke beech ki khaali jagah mein fail jaate hain. Hilaane se ye jaldi hota hai.'));
  for (let i = cr.length - 1; i >= 0; i--) { cr[i].mode = 'free'; cr[i].vel.set(rnd(-0.03, 0.03), 0.03, 0); await W2(V, 0.7); }
  await W2(V, 3);
  V.caption(L3('Sugar has dissolved: its molecules are too small to see, so the water looks clear. Sand does not break up into particles in water — it is insoluble and settles.', 'चीनी घुल गई: इसके मॉलिक्यूल इतने छोटे हैं कि दिखते नहीं, इसलिए पानी साफ़ दिखता है। रेत पानी में छोटे कणों में नहीं टूटती — यह न घुलने वाली है और नीचे बैठ जाती है।', 'Cheeni ghul gayi: iske molecules itne chhote hain ki dikhte nahi, isliye paani saaf dikhta hai. Ret paani mein chhote kanon mein nahi toot-ti — ye insoluble hai aur neeche baith jaati hai.')); await W2(V, 7);
};
SCRIPTS.evaporate_salt = async (V) => {
  const na = V.spawn('Na+', 6, -BX, BX, -BY, BY, { label: true }); const cl = V.spawn('Cl-', 6, -BX, BX, -BY, BY, { label: true }); const ws = V.spawn('H2O', 16, -BX, BX, -BY, BY, { label: true });
  V.caption(L3('Salt water: Na⁺ and Cl⁻ ions spread among water molecules.', 'नमक का पानी: Na⁺ और Cl⁻ आयन पानी के मॉलिक्यूल के बीच फैले हुए हैं।', 'Namak ka paani: Na⁺ aur Cl⁻ ions paani ke molecules ke beech faile hue hain.')); await W2(V, 4.5);
  V.heat(0.7); V.temp = 2; V.caption(L3('Heating gives water molecules enough energy to escape into the air as vapour. Salt ions cannot escape.', 'गरम करने पर पानी के मॉलिक्यूल को इतनी एनर्जी मिल जाती है कि वे भाप बनकर हवा में उड़ जाते हैं। नमक के आयन नहीं उड़ पाते।', 'Garam karne par paani ke molecules ko itni energy mil jaati hai ki woh bhaap bankar hawa mein ud jaate hain. Namak ke ions nahi ud paate.'));
  for (const w of ws) { w.mode = 'rise'; w.riseV = rnd(0.05, 0.09); await W2(V, 0.35); }
  const all = []; na.forEach((p, i) => { all.push(p, cl[i]); }); all.forEach((p) => p.labelIt(null)); V.lattice(all, 0, -BY + 0.015, 6, 0.026, 0.07);
  await W2(V, 3.5); V.heat(0);
  V.caption(L3('With the water gone, Na⁺ and Cl⁻ pack together in a neat pattern: crystals of common salt, NaCl.', 'पानी उड़ जाने पर Na⁺ और Cl⁻ एक सुंदर, तरतीब वाले पैटर्न में जम जाते हैं: नमक (NaCl) के क्रिस्टल बन जाते हैं।', 'Paani ud jaane par Na⁺ aur Cl⁻ ek neat pattern mein jam jaate hain: namak (NaCl) ke crystals ban jaate hain.')); await W2(V, 7);
};
SCRIPTS.kmno4_diffuse = async (V) => {
  const wl = new THREE.Mesh(new THREE.PlaneGeometry(0.004, 2 * BY + 0.02), new THREE.MeshBasicMaterial({ color: 0x8892a0 })); V.box.add(wl); V.extra.push(wl);
  const lc = V.sprite(tx(N('cold', 'ठंडा', 'thanda'), V.L())); lc.position.set(-0.1, BY + 0.01, 0.03); const lh = V.sprite(tx(N('hot', 'गरम', 'garam'), V.L())); lh.position.set(0.1, BY + 0.01, 0.03); V.box.add(lc, lh); V.extra.push(lc, lh);
  const a = [], b = []; for (let i = 0; i < 10; i++) { a.push(V.add('MnO4-', -0.12 + (i % 5) * 0.012, -BY + 0.01 + Math.floor(i / 5) * 0.014, { mode: 'fixed', label: i === 0, side: -1, tempK: 0.45 })); b.push(V.add('MnO4-', 0.08 + (i % 5) * 0.012, -BY + 0.01 + Math.floor(i / 5) * 0.014, { mode: 'fixed', side: 1, tempK: 2.2 })); }
  V.spawn('H2O', 8, -BX, -0.02, -BY, BY, { side: -1, tempK: 0.45 }); V.spawn('H2O', 8, 0.02, BX, -BY, BY, { side: 1, tempK: 2.2 });
  V.caption(L3('A crystal of potassium permanganate at the bottom of cold water (left) and hot water (right).', 'ठंडे पानी (बाएँ) और गरम पानी (दाएँ) की तली में पोटैशियम परमैंगनेट का एक क्रिस्टल।', 'Thande paani (left) aur garam paani (right) ki tali mein potassium permanganate ka ek crystal.')); await W2(V, 4.5);
  V.caption(L3('Without any stirring, purple MnO₄⁻ ions leave the crystal and wander between the water molecules: diffusion. In hot water the particles move faster, so they spread faster.', 'बिना हिलाए ही बैंगनी MnO₄⁻ आयन क्रिस्टल से निकलकर पानी के मॉलिक्यूल के बीच घूमने लगते हैं: इसे डिफ़्यूज़न (विसरण) कहते हैं। गरम पानी में कण तेज़ चलते हैं, इसलिए जल्दी फैलते हैं।', 'Bina hilaaye hi purple MnO₄⁻ ions crystal se nikalkar paani ke molecules ke beech ghoomne lagte hain: ise diffusion kehte hain. Garam paani mein particles tez chalte hain, isliye jaldi failte hain.'));
  for (let k = 0; k < 10; k++) { b[k].mode = 'free'; b[k].vel.set(rnd(-0.03, 0.03), 0.05, 0); if (k % 3 === 0) { a[k].mode = 'free'; a[k].vel.set(0, 0.01, 0); } await W2(V, 0.5); }
  await W2(V, 4); for (const p of a) p.mode = 'free';
  await W2(V, 3);
  V.caption(L3('Particles of matter are always moving — that is why smells and colours spread by themselves.', 'पदार्थ के कण हमेशा चलते-फिरते रहते हैं — इसीलिए गंध और रंग अपने-आप फैल जाते हैं।', 'Matter ke particles hamesha chalte-phirte rehte hain — isiliye smell aur rang apne-aap fail jaate hain.')); await W2(V, 6);
};
SCRIPTS.tyndall = async (V) => {
  const ions = [...V.spawn('Na+', 7, -BX, -0.02, -BY, BY, { label: true, side: -1 }), ...V.spawn('Cl-', 7, -BX, -0.02, -BY, BY, { label: true, side: -1 })];
  const milk = V.spawn('milk', 7, 0.03, BX, -BY, BY, { side: 1 }); const lab = V.sprite(tx(N('colloid particle', 'कोलॉइड कण', 'colloid particle'), V.L())); lab.position.set(0.12, BY + 0.01, 0.03); V.box.add(lab); V.extra.push(lab);
  const wl = new THREE.Mesh(new THREE.PlaneGeometry(0.004, 2 * BY + 0.02), new THREE.MeshBasicMaterial({ color: 0x8892a0 })); V.box.add(wl); V.extra.push(wl); void ions;
  V.caption(L3('Left: salt solution — tiny ions. Right: dilute milk — much bigger particles (fat and protein) floating in water.', 'बाएँ: नमक का घोल — बहुत छोटे आयन। दाएँ: पतला दूध — पानी में तैरते काफ़ी बड़े कण (फ़ैट और प्रोटीन)।', 'Left: namak ka ghol — bahut chhote ions. Right: patla doodh — paani mein tairte kaafi bade particles (fat aur protein).')); await W2(V, 4.5);
  V.beam(0.25, 0.02); V.caption(L3('A beam of light passes through. Tiny ions are too small to send light sideways, so the beam is invisible on the left.', 'रोशनी की किरण आर-पार जाती है। छोटे आयन रोशनी को इधर-उधर नहीं बिखेर पाते, इसलिए बाईं ओर किरण दिखाई नहीं देती।', 'Light ki beam aar-paar jaati hai. Chhote ions light ko idhar-udhar nahi bikher paate, isliye left side beam dikhti nahi.'));
  for (let i = 0; i < 40; i++) { for (const m of milk) { const near = Math.abs(m.g.position.y - 0.02) < 0.03; m.g.children[0].material = near ? mat('#fff3b0') : mat('#f4f1e8'); } await W2(V, 0.15); }
  V.caption(L3('Big colloid particles scatter the light in all directions, so the path of the beam shines — the Tyndall effect. A suspension like chalk water scatters too, but its particles are so big that they settle.', 'कोलॉइड के बड़े कण रोशनी को हर दिशा में बिखेर देते हैं, इसलिए किरण का रास्ता चमकने लगता है — इसे टिंडल इफ़ेक्ट कहते हैं। चॉक वाले पानी जैसा सस्पेंशन (निलंबन) भी रोशनी बिखेरता है, पर उसके कण इतने बड़े हैं कि नीचे बैठ जाते हैं।', 'Colloid ke bade particles light ko har direction mein scatter karte hain, isliye beam ka raasta chamakne lagta hai — ise Tyndall effect kehte hain. Chalk waale paani jaisa suspension bhi scatter karta hai, par uske particles itne bade hain ki neeche baith jaate hain.'));
  for (let i = 0; i < 40; i++) { for (const m of milk) { const near = Math.abs(m.g.position.y - 0.02) < 0.03; m.g.children[0].material = near ? mat('#fff3b0') : mat('#f4f1e8'); } await W2(V, 0.15); }
  V.beam(0);
};
SCRIPTS.sublimation = async (V) => {
  const s = []; for (let i = 0; i < 10; i++) s.push(V.add('NH4Cl', -0.13 + (i % 5) * 0.04, -BY + 0.015 + Math.floor(i / 5) * 0.028, { mode: 'fixed', label: i === 7 }));
  for (let i = 0; i < 3; i++) V.add('sand', 0.1 + i * 0.04, -BY + 0.03, { mode: 'fixed', size: 0.55 });
  const top = new THREE.Mesh(new THREE.PlaneGeometry(2 * BX, 0.006), new THREE.MeshBasicMaterial({ color: 0x9fd4ff })); top.position.y = BY + 0.012; V.box.add(top); V.extra.push(top);
  V.caption(L3('A mixture of ammonium chloride (white) and sand at the bottom of the hot dish. The cool funnel is on top.', 'गरम डिश की तली में अमोनियम क्लोराइड (सफ़ेद) और रेत का मिश्रण। ऊपर ठंडी कीप रखी है।', 'Garam dish ki tali mein ammonium chloride (white) aur ret ka mixture. Upar thandi funnel rakhi hai.')); await W2(V, 4.5);
  V.heat(0.8); V.temp = 2; V.caption(L3('On heating, ammonium chloride goes straight from solid to gas (it does not melt). Sand stays behind.', 'गरम करने पर अमोनियम क्लोराइड ठोस से सीधे गैस बन जाता है (पिघलता नहीं)। रेत वहीं पड़ी रहती है।', 'Garam karne par ammonium chloride solid se seedha gas ban jaata hai (pighalta nahi). Ret wahin padi rehti hai.'));
  const up = [];
  for (let i = 0; i < s.length; i++) { const p = s[i]; p.labelIt(null); p.go(-0.18 + i * 0.04, BY - 0.002, 0.07); up.push(p); await W2(V, 0.7); }
  await W2(V, 3); V.heat(0);
  up[3] && up[3].labelIt('NH₄Cl');
  V.caption(L3('On the cool funnel, the vapour turns straight back into solid (deposition). This is sublimation, and it separates ammonium chloride from sand.', 'ठंडी कीप पर यह भाप सीधे वापस ठोस बन जाती है (डिपोज़िशन)। इसे सब्लिमेशन (ऊर्ध्वपातन) कहते हैं, और इसी से अमोनियम क्लोराइड रेत से अलग हो जाता है।', 'Thandi funnel par vapour seedha wapas solid ban jaati hai (deposition). Ise sublimation kehte hain, aur isi se ammonium chloride ret se alag ho jaata hai.')); await W2(V, 7);
};
SCRIPTS.chromatography = async (V) => {
  const paper = new THREE.Mesh(new THREE.PlaneGeometry(0.14, 2 * BY), new THREE.MeshBasicMaterial({ color: 0xf2efe6 })); paper.position.z = -0.01; V.box.add(paper); V.extra.push(paper);
  const water = new THREE.Mesh(new THREE.PlaneGeometry(0.14, 1), new THREE.MeshBasicMaterial({ color: 0x9cc8e8, transparent: true, opacity: 0.45 })); water.position.z = -0.008; V.box.add(water); V.extra.push(water);
  const setW = (h) => { water.scale.y = Math.max(0.001, h); water.position.y = -BY + h / 2; }; setW(0.03);
  const cols = ['#2b4fd8', '#7a2fb0', '#e0347a', '#f2c21a'], rf = [0.42, 0.55, 0.72, 0.9]; const ds = [];
  for (let c = 0; c < 4; c++) for (let k = 0; k < 3; k++) { const p = V.add('dye', rnd(-0.015, 0.015), -BY + 0.06 + rnd(-0.006, 0.006), { mode: 'fixed', col: cols[c], size: 0.6 }); p.rf = rf[c]; ds.push(p); }
  V.caption(L3('The black ink spot on the paper is really a mixture of different coloured dye particles.', 'कागज़ पर काली स्याही का धब्बा असल में अलग-अलग रंगों की डाई के कणों का मिश्रण है।', 'Paper par kaali ink ka dhabba asal mein alag-alag rangon ki dye ke particles ka mixture hai.')); await W2(V, 4.5);
  V.caption(L3('Water climbs up the paper. Dyes that dissolve well and stick weakly to paper are carried higher; the others lag behind.', 'पानी कागज़ पर ऊपर चढ़ता है। जो डाई अच्छे से घुलती है और कागज़ से कम चिपकती है, वह ऊपर तक चली जाती है; बाकी पीछे रह जाती हैं।', 'Paani paper par upar chadhta hai. Jo dye achhe se ghulti hai aur paper se kam chipakti hai, woh upar tak chali jaati hai; baaki peeche reh jaati hain.'));
  for (let t = 0; t <= 1.0001; t += 0.025) { const front = 0.03 + t * (2 * BY - 0.05); setW(front); for (const p of ds) p.g.position.y = -BY + 0.06 + Math.max(0, front - 0.06) * p.rf + (p.g.id % 3 - 1) * 0.004; await W2(V, 0.18); }
  V.caption(L3('Each dye travels its own distance, so the spot separates into coloured bands. This is paper chromatography.', 'हर डाई अपनी-अपनी दूरी तय करती है, इसलिए धब्बा अलग-अलग रंग की पट्टियों में बँट जाता है। यही पेपर क्रोमैटोग्राफ़ी है।', 'Har dye apni-apni doori tay karti hai, isliye dhabba alag-alag rang ki pattiyon mein bant jaata hai. Yahi paper chromatography hai.')); await W2(V, 7);
};
SCRIPTS.rusting = async (V) => {
  const fe = V.metalSurface('Fe', 9); const o2 = V.spawn('O2', 6, -BX, BX, 0.02, BY, { label: true }); const ws = V.spawn('H2O', 8, -BX, BX, -0.1, 0.05, { label: true });
  V.caption(L3('Iron atoms of the nail, with water molecules and oxygen (O₂) from the air.', 'कील के आयरन एटम, साथ में पानी के मॉलिक्यूल और हवा की ऑक्सीजन (O₂)।', 'Keel ke iron atoms, saath mein paani ke molecules aur hawa ki oxygen (O₂).')); await W2(V, 4.5);
  V.caption(L3('Slowly, iron atoms react with oxygen and water together. Each step needs both of them.', 'आयरन के एटम धीरे-धीरे ऑक्सीजन और पानी, दोनों के साथ मिलकर रिएक्शन करते हैं। हर स्टेप में दोनों की ज़रूरत होती है।', 'Iron ke atoms dheere-dheere oxygen aur paani, dono ke saath milkar react karte hain. Har step mein dono ki zaroorat hoti hai.'));
  const top = fe.slice(9);
  for (let k = 0; k < 6; k++) { const m = top[k + 1]; const o = V.nearestFree(o2, m.g.position), w = V.nearestFree(ws, m.g.position); if (!o || !w) break; o.mode = 'held'; w.mode = 'held'; o.go(m.g.position.x - 0.01, m.g.position.y + 0.022, 0.1); w.go(m.g.position.x + 0.012, m.g.position.y + 0.024, 0.1); await W2(V, 1.3); V.remove(o); V.remove(w); m.recolor('#8a3f1c'); if (k === 2) m.labelIt(tx(N('rust', 'ज़ंग', 'rust'), V.L())); }
  V.caption(L3('The brown, flaky product is rust (hydrated iron oxide, Fe₂O₃·xH₂O). Without air (boiled water + oil) or without water (dry air), it cannot form.', 'जो भूरी, पपड़ीदार चीज़ बनती है, वह ज़ंग है (पानी वाला आयरन ऑक्साइड, Fe₂O₃·xH₂O)। हवा न हो (उबला पानी + तेल) या पानी न हो (सूखी हवा), तो ज़ंग नहीं लगती।', 'Jo brown, papdidaar cheez banti hai, woh rust hai (hydrated iron oxide, Fe₂O₃·xH₂O). Hawa na ho (boiled water + oil) ya paani na ho (dry air), to rust nahi lagta.')); await W2(V, 7);
};

// ======================================================================================== batch 3 (Class 6–8)
const wall = (V, x, w, h, col, y = 0) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.85 })); m.position.set(x, y, -0.01); V.box.add(m); V.extra.push(m); return m; };
SCRIPTS.evaporation = async (V) => {
  V.walls = { x0: -BX, x1: BX, y0: -BY, y1: -0.04 }; const w = V.spawn('H2O', 18, -BX, BX, -BY, -0.05, { label: true }); wall(V, 0, 2 * BX, 0.002, '#7fb2e0', -0.04);
  V.caption(L3('Water molecules in the liquid keep moving. Some at the surface move fast enough to escape into the air.', 'पानी के मॉलिक्यूल लगातार हिलते-घूमते रहते हैं। ऊपर सतह वाले कुछ मॉलिक्यूल इतनी तेज़ी से चलते हैं कि हवा में निकल जाते हैं।', 'Paani ke molecules lagaataar hilte-ghoomte rehte hain. Upar surface wale kuch molecules itni tezi se chalte hain ki hawa mein nikal jaate hain.'));
  for (let k = 0; k < 3; k++) { const p = w[k]; p.mode = 'rise'; p.riseV = 0.04; await W2(V, 1.6); }
  V.caption(L3('In sunlight the molecules get more energy and move faster, so many more escape: the water evaporates faster. A wider surface lets more escape at the same time.', 'धूप में मॉलिक्यूल को ज़्यादा एनर्जी मिलती है और वे तेज़ चलते हैं, इसलिए बहुत ज़्यादा मॉलिक्यूल निकल जाते हैं: पानी जल्दी भाप बनकर उड़ता है। सतह चौड़ी हो तो एक साथ ज़्यादा मॉलिक्यूल निकलते हैं।', 'Dhoop mein molecules ko zyada energy milti hai aur woh tez chalte hain, isliye bahut zyada nikal jaate hain: paani jaldi evaporate hota hai. Surface chaudi ho to ek saath zyada molecules nikalte hain.'));
  V.heat(0.7); V.temp = 2.4; for (let k = 3; k < 12; k++) { const p = w[k]; p.mode = 'rise'; p.riseV = 0.07; await W2(V, 0.6); }
  await W2(V, 5);
};
SCRIPTS.condensation = async (V) => {
  const cold = wall(V, BX - 0.01, 0.02, 2 * BY, '#9fd0ff'); void cold;
  const vap = V.spawn('H2O', 12, -BX, BX - 0.06, -BY, BY, { label: true, tempK: 1.6 });
  V.caption(L3('Air contains water vapour: single water molecules flying about. On the right is the cold glass.', 'हवा में पानी की भाप होती है: पानी के अकेले-अकेले मॉलिक्यूल इधर-उधर उड़ते रहते हैं। दाईं ओर ठंडा गिलास है।', 'Hawa mein paani ki bhaap hoti hai: paani ke akele-akele molecules idhar-udhar udte rehte hain. Right side thanda glass hai.')); await W2(V, 4.5);
  V.caption(L3('When a molecule hits the cold glass it loses energy and slows down. Slow molecules stick together and form a tiny liquid drop.', 'जब कोई मॉलिक्यूल ठंडे गिलास से टकराता है, तो उसकी एनर्जी कम हो जाती है और वह धीमा पड़ जाता है। धीमे मॉलिक्यूल आपस में चिपककर पानी की छोटी-सी बूँद बना लेते हैं।', 'Jab koi molecule thande glass se takrata hai, to uski energy kam ho jaati hai aur woh dheema pad jaata hai. Dheeme molecules aapas mein chipakkar paani ki chhoti-si boond bana lete hain.'));
  for (let k = 0; k < vap.length; k++) { const p = vap[k]; p.mode = 'held'; p.labelIt(null); p.go(BX - 0.035 - (k % 3) * 0.016, -0.06 + Math.floor(k / 3) * 0.022 - (k % 2) * 0.008, 0.1); await W2(V, 0.45); }
  await W2(V, 2); V.caption(L3('This is condensation: water vapour turning back into liquid water on a cold surface.', 'इसे कंडेन्सेशन (संघनन) कहते हैं: ठंडी सतह पर भाप का फिर से पानी बन जाना।', 'Ise condensation kehte hain: thandi surface par bhaap ka phir se paani ban jaana.')); await W2(V, 6);
};
SCRIPTS.sedimentation = async (V) => {
  V.spawn('H2O', 10, -BX, BX, -BY, BY, {}); const mud = V.spawn('mud', 5, -BX, BX, -0.05, BY, {}); const clay = V.spawn('clay', 16, -BX, BX, -BY, BY, {});
  V.caption(L3('Muddy water: big heavy mud and sand grains (brown) and very small clay particles (light brown) among the water molecules.', 'मटमैला पानी: पानी के मॉलिक्यूल के बीच मिट्टी और रेत के बड़े, भारी कण (भूरे) और चिकनी मिट्टी के बहुत छोटे कण (हल्के भूरे)।', 'Matmaila paani: paani ke molecules ke beech mitti aur ret ke bade, bhaari kan (brown) aur clay ke bahut chhote kan (light brown).')); await W2(V, 4.5);
  mud.forEach((p, i) => p.go(-0.15 + i * 0.075, -BY + 0.02, 0.08));
  V.caption(L3('The heavy grains sink quickly and settle at the bottom: sedimentation. The tiny clay particles keep floating.', 'भारी कण जल्दी डूबकर तली में बैठ जाते हैं: इसे सेडिमेंटेशन (अवसादन) कहते हैं। बहुत छोटे कण तैरते रहते हैं।', 'Bhaari kan jaldi doobkar tali mein baith jaate hain: ise sedimentation kehte hain. Clay ke chhote kan tairte rehte hain.')); await W2(V, 5);
  const al = V.spawn('Al3+', 4, -BX, BX, 0.05, BY, { label: true });
  V.caption(L3('Alum gives Al³⁺ ions. They pull the tiny clay particles together into bigger flakes, which are heavy enough to sink.', 'फिटकरी से Al³⁺ आयन मिलते हैं। ये चिकनी मिट्टी के छोटे कणों को आपस में जोड़कर बड़े गुच्छे बना देते हैं, जो इतने भारी होते हैं कि डूब जाते हैं।', 'Fitkari se Al³⁺ ions milte hain. Ye clay ke chhote kanon ko aapas mein jodkar bade gucchhe bana dete hain, jo itne bhaari hote hain ki doob jaate hain.'));
  for (let g = 0; g < 4; g++) { const a = al[g]; a.mode = 'held'; const cx = -0.15 + g * 0.1; a.go(cx, 0.02, 0.1); for (let k = 0; k < 4; k++) { const c = clay[g * 4 + k]; if (!c) continue; c.mode = 'held'; c.go(cx + (k % 2 ? 0.012 : -0.012), 0.02 + (k > 1 ? 0.012 : -0.012), 0.1); } }
  await W2(V, 2.5); for (let g = 0; g < 4; g++) { const cx = -0.15 + g * 0.1; [al[g], ...clay.slice(g * 4, g * 4 + 4)].forEach((p, k) => p && p.go(cx + (k % 3 - 1) * 0.012, -BY + 0.045 + (k > 2 ? 0.012 : 0), 0.06)); }
  await W2(V, 5);
};
SCRIPTS.filtration = async (V) => {
  for (let i = 0; i < 9; i++) wall(V, -BX + 0.03 + i * 0.05, 0.034, 0.012, '#d9d6cc', 0); // filter paper with tiny pores between its fibres
  V.walls = { x0: -BX, x1: BX, y0: 0.012, y1: BY }; const w = V.spawn('H2O', 12, -BX, BX, 0.02, BY, { label: true }); const mud = V.spawn('mud', 5, -BX, BX, 0.05, BY, {}); V.spawn('clay', 8, -BX, BX, 0.03, BY, {});
  V.caption(L3('The filter paper is a mat of fibres with tiny holes (pores) between them.', 'फ़िल्टर पेपर रेशों की एक चटाई जैसा होता है, जिसमें रेशों के बीच बहुत छोटे छेद होते हैं।', 'Filter paper reshon ki ek chatai jaisa hota hai, jismein reshon ke beech bahut chhote ched (pores) hote hain.')); await W2(V, 4.5);
  V.caption(L3('Water molecules are tiny and pass through the pores into the flask: the clear filtrate. The mud particles are too big and stay on top: the residue.', 'पानी के मॉलिक्यूल बहुत छोटे हैं, इसलिए छेदों से निकलकर फ़्लास्क में चले जाते हैं: यही साफ़, छना हुआ पानी है। मिट्टी के कण बहुत बड़े हैं, इसलिए ऊपर ही रह जाते हैं: यह फ़िल्टर पेपर पर बचा ठोस है।', 'Paani ke molecules bahut chhote hain, isliye pores se nikalkar flask mein chale jaate hain: yahi saaf filtrate hai. Mitti ke kan bahut bade hain, isliye upar hi reh jaate hain: yahi residue hai.'));
  for (let k = 0; k < w.length; k++) { const p = w[k]; p.mode = 'held'; const gx = -BX + 0.055 + (k % 8) * 0.05; p.go(gx, 0.03, 0.12); p.onArrive = () => { p.go(gx, -0.09 - (k % 3) * 0.03, 0.08); p.after = 'fixed'; }; await W2(V, 0.4); }
  mud.forEach((p, i) => p.go(-0.15 + i * 0.075, 0.035, 0.06)); await W2(V, 6);
};
SCRIPTS.magnet_sep = async (V) => {
  const bar = wall(V, 0, 0.3, 0.03, '#c62f2f', BY - 0.005); void bar; const fe = V.spawn('Fe', 10, -BX, BX, -BY, -0.02, { label: true }); V.spawn('sand', 6, -BX, BX, -BY, -0.02, {});
  V.caption(L3('Iron filings are made of iron atoms; sand is silicon dioxide. A magnet is held above them.', 'लोहे का बुरादा आयरन के एटम से बना है; रेत सिलिकॉन डाइऑक्साइड है। इनके ऊपर चुंबक पकड़ा हुआ है।', 'Lohe ka buraada iron atoms se bana hai; ret silicon dioxide hai. Inke upar magnet pakda hua hai.')); await W2(V, 4.5);
  V.caption(L3('The magnet pulls on iron but not on sand. The iron bits fly up and cling to it; the sand grains stay where they are.', 'चुंबक लोहे को खींचता है, रेत को नहीं। लोहे के टुकड़े उछलकर उससे चिपक जाते हैं; रेत के कण अपनी जगह पड़े रहते हैं।', 'Magnet lohe ko kheenchta hai, ret ko nahi. Lohe ke tukde uchhalkar usse chipak jaate hain; ret ke kan apni jagah pade rehte hain.'));
  fe.forEach((p, i) => { p.mode = 'held'; p.go(-0.13 + i * 0.028, BY - 0.03, 0.14); }); await W2(V, 6);
};
const roseCap = indCap(N('red rose', 'लाल गुलाब', 'laal gulaab'), N('red-pink', 'लाल-गुलाबी', 'red-pink'), N('green', 'हरा', 'green'));
SCRIPTS.rose = indicator('#d62d5a', '#4f8a2e', ...roseCap);
SCRIPTS.litmus_home = indicator('#d23a3a', '#3f6fd1', ...indCap(N('litmus', 'लिटमस', 'litmus'), N('red', 'लाल', 'red'), N('blue', 'नीला', 'blue')));
SCRIPTS.lemon_lime = async (V) => {
  const h = V.spawn('H+', 8, -BX, BX, -BY, BY, { label: true }); V.spawn('cit', 3, -BX, BX, -BY, BY, { label: true }); const ind = V.spawn('ind', 4, -BX, BX, -BY, BY, { col: '#d23a3a' });
  V.caption(L3('Lemon juice contains citric acid: it gives H⁺ ions, so the litmus molecules are red.', 'नींबू के रस में सिट्रिक एसिड होता है: यह H⁺ आयन देता है, इसलिए लिटमस के मॉलिक्यूल लाल हैं।', 'Nimbu ke ras mein citric acid hota hai: ye H⁺ ions deta hai, isliye litmus ke molecules laal hain.')); await W2(V, 4.5);
  V.caption(L3('Each drop of lime water brings Ca²⁺ and OH⁻ ions. An OH⁻ joins an H⁺ to make a water molecule.', 'चूने के पानी की हर बूँद Ca²⁺ और OH⁻ आयन लाती है। एक OH⁻ एक H⁺ से मिलकर पानी का मॉलिक्यूल बनाता है।', 'Lime water ki har boond Ca²⁺ aur OH⁻ ions laati hai. Ek OH⁻ ek H⁺ se milkar paani ka molecule banata hai.'));
  for (let k = 0; k < h.length; k++) { const o = V.add('OH-', rnd(-0.1, 0.1), BY, { label: k === 0 }); if (k % 2 === 0) V.add('Ca2+', rnd(-0.1, 0.1), BY, { label: k === 0 }); const t = h[k]; t.mode = 'held'; o.mode = 'held'; o.go(t.g.position.x, t.g.position.y, 0.16); await W2(V, 0.9); const p = t.g.position.clone(); V.remove(o); V.remove(t); V.add('H2O', p.x, p.y, { label: k === 0 }); }
  const extra = V.add('OH-', 0, BY, { label: true }); void extra; ind.forEach((i) => i.recolor('#3f6fd1'));
  V.caption(L3('When all H⁺ is used up the acid is neutralised; the next OH⁻ makes it slightly basic and the litmus turns blue. Acid + base → salt + water.', 'जब सारे H⁺ ख़त्म हो जाते हैं, तो एसिड न्यूट्रल हो जाता है; अगला OH⁻ इसे थोड़ा बेसिक बना देता है और लिटमस नीला हो जाता है। एसिड + बेस → लवण + पानी।', 'Jab saare H⁺ khatam ho jaate hain, to acid neutralise ho jaata hai; agla OH⁻ ise thoda basic bana deta hai aur litmus blue ho jaata hai. Acid + base → salt + paani.')); await W2(V, 7);
};
SCRIPTS.sulphur_burn = async (V) => {
  const S = []; for (let i = 0; i < 6; i++) S.push(V.add('S', -0.12 + (i % 3) * 0.05, -BY + 0.02 + Math.floor(i / 3) * 0.03, { mode: 'fixed', label: i === 4 }));
  const o2 = V.spawn('O2', 6, -BX, BX, 0.0, BY, { label: true });
  V.caption(L3('Sulphur atoms (yellow) in the spoon, and oxygen molecules (O₂) in the air.', 'चम्मच में सल्फ़र के एटम (पीले), और हवा में ऑक्सीजन के मॉलिक्यूल (O₂)।', 'Chammach mein sulphur ke atoms (yellow), aur hawa mein oxygen ke molecules (O₂).')); await W2(V, 4.5);
  V.heat(0.6); V.caption(L3('In the flame each sulphur atom joins one O₂ molecule: sulphur dioxide (SO₂), a gas.', 'लौ में सल्फ़र का हर एटम एक O₂ मॉलिक्यूल से जुड़ता है: सल्फ़र डाइऑक्साइड (SO₂) गैस बनती है।', 'Flame mein sulphur ka har atom ek O₂ molecule se judta hai: sulphur dioxide (SO₂) gas banti hai.'));
  const gas = []; for (let k = 0; k < 6; k++) { const a = S[k], b = o2[k]; b.mode = 'held'; b.labelIt(null); b.go(a.g.position.x, a.g.position.y + 0.02, 0.14); await W2(V, 0.8); const p = a.g.position.clone(); a.labelIt(null); V.remove(a); V.remove(b); const g = V.add('SO2', p.x, p.y + 0.01, { label: k === 0 }); g.vel.set(rnd(-0.02, 0.02), 0.03, 0); gas.push(g); }
  V.heat(0); await W2(V, 1.5); V.spawn('H2O', 6, -BX, BX, -BY, -0.05, { label: true });
  V.caption(L3('With water, SO₂ forms sulphurous acid (H₂SO₃), which gives H⁺ ions: the solution is acidic and turns blue litmus red.', 'पानी के साथ SO₂ सल्फ़्यूरस एसिड (H₂SO₃) बनाती है, जो H⁺ आयन देता है: घोल एसिडिक है और नीले लिटमस को लाल कर देता है।', 'Paani ke saath SO₂ sulphurous acid (H₂SO₃) banati hai, jo H⁺ ions deta hai: solution acidic hai aur blue litmus ko red kar deta hai.'));
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
  await burnWax(V, { no: 6, c1: L3('Inside the tumbler: wax vapour from the candle, and only a few oxygen molecules in the trapped air.', 'गिलास के अंदर: मोमबत्ती से निकली मोम की भाप, और अंदर बंद हवा में ऑक्सीजन के बस थोड़े-से मॉलिक्यूल।', 'Tumbler ke andar: candle se nikli wax ki bhaap, aur andar band hawa mein oxygen ke bas thode-se molecules.'),
    c2: L3('Burning: wax joins oxygen to make carbon dioxide and water. Every O₂ that is used up is not replaced.', 'जलना: मोम ऑक्सीजन से मिलकर कार्बन डाइऑक्साइड और पानी बनाती है। जो O₂ ख़र्च हो जाती है, उसकी जगह नई ऑक्सीजन नहीं आती।', 'Jalna: wax oxygen se milkar carbon dioxide aur paani banati hai. Jo O₂ kharch ho jaati hai, uski jagah nayi oxygen nahi aati.') });
  V.heat(0); await W2(V, 1);
  V.caption(L3('No oxygen is left, so the flame goes out. The water vapour becomes mist on the glass; the CO₂ turns lime water milky.', 'ऑक्सीजन बची ही नहीं, इसलिए लौ बुझ जाती है। पानी की भाप गिलास पर धुंध बनकर जम जाती है; CO₂ चूने के पानी को दूधिया कर देती है।', 'Oxygen bachi hi nahi, isliye flame bujh jaati hai. Paani ki bhaap glass par dhundh bankar jam jaati hai; CO₂ lime water ko milky kar deti hai.')); await W2(V, 7);
};
SCRIPTS.candle_zones = async (V) => {
  await burnWax(V, { nw: 4, no: 6, c1: L3('Near the wick the wax is only vapour: there is no oxygen there yet, so it cannot burn. This is the dark zone.', 'बत्ती के पास मोम सिर्फ़ भाप के रूप में है: वहाँ अभी ऑक्सीजन नहीं पहुँची, इसलिए वह जल नहीं पाती। यही काला हिस्सा (डार्क ज़ोन) है।', 'Wick ke paas wax sirf bhaap ke roop mein hai: wahan abhi oxygen nahi pahunchi, isliye woh jal nahi paati. Yahi dark zone hai.'),
    c2: L3('In the outer zone there is plenty of oxygen: the wax burns completely to carbon dioxide and water. This zone is the hottest.', 'बाहरी हिस्से में ऑक्सीजन भरपूर है: मोम पूरी तरह जलकर कार्बन डाइऑक्साइड और पानी बन जाती है। यह हिस्सा सबसे गरम होता है।', 'Outer zone mein oxygen bharpoor hai: wax poori tarah jalkar carbon dioxide aur paani ban jaati hai. Ye zone sabse garam hota hai.') });
  const c = []; for (let i = 0; i < 6; i++) c.push(V.add('C', -0.1 + i * 0.04, 0.02 + (i % 2) * 0.02, { label: i === 2, col: '#ffb43a' }));
  V.caption(L3('In the middle zone there is not enough oxygen: some carbon is left unburnt. These hot carbon particles glow yellow and give light; on cold glass they show up as black soot.', 'बीच वाले हिस्से में ऑक्सीजन पूरी नहीं मिलती: कुछ कार्बन बिना जले बच जाता है। ये गरम कार्बन कण पीले चमकते हैं और रोशनी देते हैं; ठंडे काँच पर ये काली कालिख बनकर दिखते हैं।', 'Middle zone mein oxygen poori nahi milti: kuch carbon bina jale bach jaata hai. Ye garam carbon ke kan peele chamakte hain aur roshni dete hain; thande glass par ye kaali kaalikh (soot) bankar dikhte hain.'));
  await W2(V, 3); c.forEach((p) => p.recolor('#1a1a1a')); V.heat(0); await W2(V, 5);
};
SCRIPTS.ignition = async (V) => {
  const wl = wall(V, 0, 0.004, 2 * BY + 0.02, '#8892a0'); void wl;
  const pl = []; const pr = []; for (let i = 0; i < 4; i++) { pl.push(V.add('paper', -0.17 + i * 0.045, -BY + 0.02, { mode: 'fixed', label: i === 1 })); pr.push(V.add('paper', 0.05 + i * 0.045, -BY + 0.02, { mode: 'fixed' })); }
  const w = V.spawn('H2O', 10, 0.03, BX, -BY + 0.04, 0.02, { side: 1, label: true }); const o2 = V.spawn('O2', 5, -BX, -0.03, 0, BY, { side: -1, label: true });
  V.caption(L3('Left: the empty paper cup. Right: the cup with water. The flame heats both from below.', 'बाएँ: खाली कागज़ का कप। दाएँ: पानी भरा कप। लौ दोनों को नीचे से गरम कर रही है।', 'Left: khaali paper cup. Right: paani bhara cup. Flame dono ko neeche se garam kar rahi hai.')); await W2(V, 4.5);
  V.caption(L3('In the empty cup the paper soon gets hot enough (its ignition temperature) to react with oxygen: it burns.', 'खाली कप में कागज़ जल्दी अपने इग्निशन टेम्परेचर (ज्वलन ताप) तक गरम हो जाता है और ऑक्सीजन से रिएक्शन करने लगता है: वह जल उठता है।', 'Khaali cup mein paper jaldi apne ignition temperature tak garam ho jaata hai aur oxygen se react karne lagta hai: woh jal uthta hai.'));
  pl.forEach((p) => p.recolor('#ff8a2a')); for (let k = 0; k < 4; k++) { const ox = o2[k]; ox.mode = 'held'; ox.go(pl[k].g.position.x, pl[k].g.position.y + 0.02, 0.14); await W2(V, 0.7); const p = pl[k].g.position.clone(); V.remove(ox); pl[k].labelIt(null); V.remove(pl[k]); const c = V.add('CO2', p.x, p.y + 0.02, { label: k === 0 }); c.mode = 'rise'; }
  V.caption(L3('In the other cup the heat goes into the water molecules: they move faster and the water boils, but the paper stays below its ignition temperature and does not burn.', 'दूसरे कप में गर्मी पानी के मॉलिक्यूल में चली जाती है: वे तेज़ चलने लगते हैं और पानी उबलने लगता है, पर कागज़ अपने इग्निशन टेम्परेचर तक नहीं पहुँचता, इसलिए नहीं जलता।', 'Doosre cup mein garmi paani ke molecules mein chali jaati hai: woh tez chalne lagte hain aur paani ubalne lagta hai, par paper apne ignition temperature tak nahi pahunchta, isliye nahi jalta.'));
  w.forEach((p) => { p.tempK = 2.5; }); for (let k = 0; k < 3; k++) { w[k].mode = 'rise'; await W2(V, 1); } await W2(V, 5);
};
SCRIPTS.phys_change = async (V) => {
  const ice = []; for (let i = 0; i < 12; i++) ice.push(V.add('H2O', -0.12 + (i % 4) * 0.08, -0.08 + Math.floor(i / 4) * 0.07, { mode: 'fixed', label: i === 5 }));
  V.caption(L3('In ice the water molecules are held in fixed places in a pattern; they can only shake.', 'बर्फ़ में पानी के मॉलिक्यूल एक पैटर्न में अपनी-अपनी जगह बँधे रहते हैं; वे बस वहीं काँप सकते हैं।', 'Barf mein paani ke molecules ek pattern mein apni-apni jagah bandhe rehte hain; woh bas wahin kaanp sakte hain.')); await W2(V, 4.5);
  V.caption(L3('Heat makes them shake harder until they break free and move about: the ice melts into water. They are still the same H₂O molecules.', 'गर्मी से वे और ज़ोर से काँपते हैं, फिर छूटकर घूमने लगते हैं: बर्फ़ पिघलकर पानी बन जाती है। मॉलिक्यूल फिर भी वही H₂O हैं।', 'Garmi se woh aur zor se kaanpte hain, phir chhootkar ghoomne lagte hain: barf pighalkar paani ban jaati hai. Molecules phir bhi wahi H₂O hain.'));
  ice.forEach((p) => { p.mode = 'free'; }); V.heat(0.4); await W2(V, 4); V.heat(0);
  V.caption(L3('In the freezing mixture they lose energy and lock into place again: water freezes. No new substance is made, so this is a physical change.', 'फ़्रीज़िंग मिक्सचर (हिमकारी मिश्रण) में उनकी एनर्जी कम हो जाती है और वे फिर अपनी जगह बँध जाते हैं: पानी जम जाता है। कोई नया पदार्थ नहीं बनता, इसलिए यह फ़िज़िकल चेंज (भौतिक परिवर्तन) है।', 'Freezing mixture mein unki energy kam ho jaati hai aur woh phir apni jagah bandh jaate hain: paani jam jaata hai. Koi naya substance nahi banta, isliye ye physical change hai.'));
  V.lattice(ice, 0, -0.08, 4, 0.08, 0.07); await W2(V, 6);
};
SCRIPTS.metal_nonmetal = async (V) => {
  const m = []; for (let r = 0; r < 3; r++) for (let i = 0; i < 6; i++) m.push(V.add('Al', -0.19 + i * 0.03 + (r % 2) * 0.015, -0.06 + r * 0.028, { mode: 'fixed', label: r === 1 && i === 2 }));
  const c = []; for (let i = 0; i < 9; i++) c.push(V.add('C', 0.06 + (i % 3) * 0.035, -0.06 + Math.floor(i / 3) * 0.032, { mode: 'fixed', label: i === 4 }));
  V.caption(L3('Left: aluminium atoms in neat layers, held by a sea of free electrons. Right: carbon atoms in coal, locked to each other by strong fixed bonds.', 'बाएँ: एल्युमिनियम के एटम सुंदर परतों में, जिन्हें फ़्री इलेक्ट्रॉनों का समुद्र जोड़े रखता है। दाएँ: कोयले में कार्बन के एटम, जो मज़बूत, पक्के बॉन्ड से एक-दूसरे से जकड़े हैं।', 'Left: aluminium ke atoms neat layers mein, jinhe free electrons ka samundar jode rakhta hai. Right: coal mein carbon ke atoms, jo strong fixed bonds se ek-doosre se jakde hain.')); await W2(V, 5);
  V.caption(L3('A hammer blow makes the metal layers slide over each other without breaking: the metal flattens (malleable). The free electrons also carry heat and electricity.', 'हथौड़े की चोट से धातु की परतें बिना टूटे एक-दूसरे पर खिसक जाती हैं: धातु चपटी हो जाती है (यानी आघातवर्ध्य है)। फ़्री इलेक्ट्रॉन गर्मी और बिजली भी आगे ले जाते हैं।', 'Hathode ki chot se metal ki layers bina toote ek-doosre par khisak jaati hain: metal chapta ho jaata hai (malleable). Free electrons garmi aur bijli bhi aage le jaate hain.'));
  m.forEach((p, i) => p.go(-0.2 + (i % 9) * 0.022, -0.06 + Math.floor(i / 9) * 0.022, 0.05)); await W2(V, 3);
  V.caption(L3('In coal the fixed bonds cannot slide; they snap, and the piece breaks into powder (brittle).', 'कोयले के पक्के बॉन्ड खिसक नहीं सकते; वे टूट जाते हैं, और टुकड़ा चूर-चूर होकर पाउडर बन जाता है (भंगुर)।', 'Coal ke fixed bonds khisak nahi sakte; woh toot jaate hain, aur tukda choor-choor hokar powder ban jaata hai (brittle).'));
  c.forEach((p) => { p.mode = 'free'; p.vel.set(rnd(0.01, 0.04), rnd(-0.03, 0.03), 0); }); await W2(V, 6);
};
SCRIPTS.saturated = async (V) => {
  const xtal = []; for (let i = 0; i < 12; i++) xtal.push(V.add(i % 2 ? 'Cl-' : 'Na+', -0.1 + (i % 4) * 0.022, -BY + 0.015 + Math.floor(i / 4) * 0.022, { mode: 'fixed', label: i < 2 }));
  V.spawn('H2O', 12, -BX, BX, -BY, BY, {});
  V.caption(L3('Water molecules pull Na⁺ and Cl⁻ ions out of the salt crystal one by one: the salt dissolves.', 'पानी के मॉलिक्यूल नमक के क्रिस्टल से Na⁺ और Cl⁻ आयनों को एक-एक करके बाहर खींच लेते हैं: यानी नमक घुल जाता है।', 'Paani ke molecules namak ke crystal se Na⁺ aur Cl⁻ ions ko ek-ek karke bahar kheench lete hain: yaani namak ghul jaata hai.'));
  for (let k = 0; k < 6; k++) { xtal[11 - k].mode = 'free'; await W2(V, 0.7); }
  V.caption(L3('When the water is full of ions, some ions go back onto the crystal as fast as others leave: no more dissolves. The solution is saturated.', 'जब पानी आयनों से भर जाता है, तो जितने आयन निकलते हैं, उतने ही वापस क्रिस्टल पर बैठ जाते हैं: अब और नहीं घुलता। ऐसे घोल को सैचुरेटेड (संतृप्त) घोल कहते हैं।', 'Jab paani ions se bhar jaata hai, to jitne ions nikalte hain, utne hi wapas crystal par baith jaate hain: ab aur nahi ghulta. Aise solution ko saturated solution kehte hain.')); await W2(V, 5);
  V.heat(0.6); V.temp = 2.2; V.caption(L3('Heating makes the water molecules move faster and pull harder, so more solid can dissolve.', 'गरम करने पर पानी के मॉलिक्यूल तेज़ चलते हैं और ज़ोर से खींचते हैं, इसलिए ज़्यादा ठोस घुल पाता है।', 'Garam karne par paani ke molecules tez chalte hain aur zor se kheenchte hain, isliye zyada solid ghul paata hai.'));
  for (let k = 6; k < 12; k++) { xtal[11 - k].mode = 'free'; await W2(V, 0.6); } await W2(V, 4); V.heat(0);
};
SCRIPTS.limewater_air = async (V) => {
  const cao = []; for (let i = 0; i < 4; i++) cao.push(V.add('CaO', -0.15 + i * 0.05, -BY + 0.02, { mode: 'fixed', label: i === 1 })); const w = V.spawn('H2O', 8, -BX, BX, -0.06, BY, { label: true });
  V.caption(L3('Quick lime is calcium oxide (CaO). Water molecules attack it.', 'बिना बुझा चूना कैल्शियम ऑक्साइड (CaO) है। पानी के मॉलिक्यूल उस पर टूट पड़ते हैं।', 'Quick lime calcium oxide (CaO) hai. Paani ke molecules us par toot padte hain.')); await W2(V, 4);
  V.heat(0.9); V.caption(L3('CaO + H₂O → Ca²⁺ and two OH⁻ ions (calcium hydroxide). A lot of heat is given out.', 'CaO + H₂O → Ca²⁺ और दो OH⁻ आयन (कैल्शियम हाइड्रॉक्साइड)। बहुत गर्मी निकलती है।', 'CaO + H₂O → Ca²⁺ aur do OH⁻ ions (calcium hydroxide). Bahut garmi nikalti hai.'));
  for (let k = 0; k < cao.length; k++) { const c = cao[k], h = w[k]; h.mode = 'held'; h.go(c.g.position.x, c.g.position.y + 0.02, 0.15); await W2(V, 0.8); const p = c.g.position.clone(); c.labelIt(null); V.remove(c); V.remove(h); V.add('Ca2+', p.x, p.y + 0.01, { label: k === 0 }); V.add('OH-', p.x - 0.02, p.y + 0.03, { label: k === 0 }); V.add('OH-', p.x + 0.02, p.y + 0.03, {}); }
  V.heat(0); await W2(V, 1);
  V.clear(); await co2Lime(V, { start: 'breath', c1: L3('Left open, the lime water meets carbon dioxide (CO₂) from the air.', 'खुला छोड़ देने पर चूने का पानी हवा की कार्बन डाइऑक्साइड (CO₂) से मिलता है।', 'Khula chhod dene par lime water hawa ki carbon dioxide (CO₂) se milta hai.'), c2: limeC2, c3: limeC3 });
};

// ======================================================================================== batch 4 (electricity)
const pole = (V, x, plus, col) => { const w = wall(V, x, 0.012, 2 * BY - 0.02, col); const t = V.sprite(plus ? '+' : '−'); t.scale.set(0.07, 0.022, 1); t.position.set(x, BY - 0.005, 0.02); V.box.add(t); V.extra.push(t); return w; };
SCRIPTS.tester_solids = async (V) => {
  wall(V, 0, 2 * BX, 0.003, '#6a7480', -0.005);
  const cu = []; for (let r = 0; r < 2; r++) for (let i = 0; i < 9; i++) cu.push(V.add('Cu', -BX + 0.03 + i * 0.047 + (r % 2) * 0.02, 0.05 + r * 0.055, { mode: 'fixed', label: r === 0 && i === 4 }));
  const el = []; for (let k = 0; k < 10; k++) el.push(V.add('e-', rnd(-BX + 0.02, BX - 0.02), rnd(0.03, BY - 0.02), { mode: 'fixed', label: k === 0 }));
  const S = []; for (let i = 0; i < 7; i++) { const p = V.add('S', -BX + 0.04 + i * 0.058, -0.09, { mode: 'fixed', label: i === 3 }); S.push(p); const e1 = V.add('e-', p.g.position.x + 0.022, -0.09, { mode: 'fixed' }); void e1; }
  V.caption(L3('Top: copper, a metal. Its atoms sit in rows, and some electrons (yellow) are free to wander between them. Bottom: sulphur, a non-metal. Its electrons are held tightly in bonds.', 'ऊपर: कॉपर, एक धातु। इसके एटम लाइनों में बैठे हैं, और कुछ इलेक्ट्रॉन (पीले) उनके बीच आज़ादी से घूमते हैं। नीचे: सल्फ़र, एक अधातु। इसके इलेक्ट्रॉन बॉन्ड में कसकर बँधे रहते हैं।', 'Upar: copper, ek metal. Iske atoms lines mein baithe hain, aur kuch electrons (yellow) unke beech free ghoomte hain. Neeche: sulphur, ek non-metal. Iske electrons bonds mein kaskar bandhe rehte hain.'));
  for (let k = 0; k < 6; k++) { el.forEach((e) => e.go(rnd(-BX + 0.02, BX - 0.02), rnd(0.03, BY - 0.02), 0.05)); await W2(V, 0.9); }
  V.caption(L3('With the tester joined, the free electrons in the metal all drift one way, towards the + end. This steady flow of electrons is the electric current, so the bulb glows.', 'टेस्टर जोड़ते ही धातु के फ़्री इलेक्ट्रॉन एक ही दिशा में, + सिरे की ओर खिसकने लगते हैं। इलेक्ट्रॉनों का यही लगातार बहाव करंट (विद्युत धारा) है, इसलिए बल्ब जल उठता है।', 'Tester jodte hi metal ke free electrons ek hi taraf, + end ki taraf khisakne lagte hain. Electrons ka yahi lagaataar flow electric current hai, isliye bulb jal uthta hai.'));
  for (let k = 0; k < 14; k++) { el.forEach((e) => { const P = e.g.position; if (P.x < -BX + 0.04) { P.x = BX - 0.02; } e.go(P.x - 0.04, Math.min(BY - 0.02, Math.max(0.03, P.y + rnd(-0.01, 0.01))), 0.09); }); await W2(V, 0.45); }
  V.caption(L3('In sulphur no electron is free to move, so no current flows: the bulb stays dark. Graphite is the exception among non-metals: some of its electrons are free, so it conducts.', 'सल्फ़र में कोई इलेक्ट्रॉन घूमने के लिए फ़्री नहीं है, इसलिए करंट नहीं बहता: बल्ब नहीं जलता। अधातुओं में ग्रेफ़ाइट अलग है: इसके कुछ इलेक्ट्रॉन फ़्री होते हैं, इसलिए इसमें से करंट बहता है।', 'Sulphur mein koi electron ghoomne ke liye free nahi hai, isliye current nahi behta: bulb nahi jalta. Non-metals mein graphite alag hai: iske kuch electrons free hote hain, isliye ye current conduct karta hai.'));
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
  V.caption(L3('Distilled water between the two ends of the tester: only water molecules, with no charge. Nothing moves towards the ends, so no current flows and the LED stays dark.', 'टेस्टर के दोनों सिरों के बीच डिस्टिल्ड वॉटर (आसुत जल): सिर्फ़ पानी के मॉलिक्यूल, जिन पर कोई चार्ज नहीं। कुछ भी सिरों की ओर नहीं जाता, इसलिए करंट नहीं बहता और LED नहीं जलती।', 'Tester ke dono ends ke beech distilled water: sirf paani ke molecules, jin par koi charge nahi. Kuch bhi ends ki taraf nahi jaata, isliye current nahi behta aur LED nahi jalti.')); await W2(V, 5);
  const na = V.spawn('Na+', 5, -0.1, 0.1, -BY + 0.02, BY - 0.02, { label: true }); const cl = V.spawn('Cl-', 5, -0.1, 0.1, -BY + 0.02, BY - 0.02, { label: true });
  V.caption(L3('A pinch of salt breaks up into Na⁺ and Cl⁻ ions. The + end pulls the Cl⁻ ions and the − end pulls the Na⁺ ions. These moving ions carry the current through the liquid: the LED glows.', 'एक चुटकी नमक Na⁺ और Cl⁻ आयनों में टूट जाता है। + सिरा Cl⁻ आयनों को और − सिरा Na⁺ आयनों को खींचता है। यही चलते हुए आयन घोल में करंट ले जाते हैं: LED जल उठती है।', 'Ek chutki namak Na⁺ aur Cl⁻ ions mein toot jaata hai. + end Cl⁻ ions ko aur − end Na⁺ ions ko kheenchta hai. Yahi chalte hue ions ghol mein current le jaate hain: LED jal uthti hai.'));
  await ionsMove(V, { pos: na, neg: cl, rounds: 9 });
  V.caption(L3('Acids and bases also give ions, so they conduct. Sugar dissolves as whole molecules without any charge, so sugar solution does not conduct.', 'एसिड और बेस भी आयन देते हैं, इसलिए इनमें से भी करंट बहता है। चीनी बिना चार्ज वाले पूरे मॉलिक्यूल के रूप में घुलती है, इसलिए चीनी के घोल में करंट नहीं बहता।', 'Acids aur bases bhi ions dete hain, isliye inmein se bhi current behta hai. Cheeni bina charge wale poore molecules ke roop mein ghulti hai, isliye cheeni ke ghol mein current nahi behta.'));
  void w; await W2(V, 6);
};
SCRIPTS.electroplating = async (V) => {
  const A = [], B = []; for (let i = 0; i < 6; i++) { A.push(V.add('Cu', -BX + 0.015, -0.13 + i * 0.05, { mode: 'fixed', label: i === 2 })); B.push(V.add('Cu', BX - 0.015, -0.13 + i * 0.05, { mode: 'fixed' })); }
  const t1 = V.sprite('+'); t1.position.set(-BX + 0.015, BY + 0.005, 0.02); const t2 = V.sprite('−'); t2.position.set(BX - 0.015, BY + 0.005, 0.02); V.box.add(t1, t2); V.extra.push(t1, t2);
  const cu = V.spawn('Cu2+', 7, -0.12, 0.12, -BY + 0.02, BY - 0.02, { label: true }); V.spawn('SO42-', 6, -0.12, 0.12, -BY + 0.02, BY - 0.02, { label: true });
  V.caption(L3('Left: the copper plate joined to +. Right: the plate joined to −. In between: copper sulphate solution, with blue Cu²⁺ ions and SO₄²⁻ ions.', 'बाएँ: + से जुड़ी कॉपर की प्लेट। दाएँ: − से जुड़ी प्लेट। बीच में: कॉपर सल्फ़ेट का घोल, जिसमें नीले Cu²⁺ आयन और SO₄²⁻ आयन हैं।', 'Left: + se judi copper plate. Right: − se judi plate. Beech mein: copper sulphate solution, jismein blue Cu²⁺ ions aur SO₄²⁻ ions hain.')); await W2(V, 5);
  V.caption(L3('Cu²⁺ ions drift to the − plate. There each one takes two electrons and becomes a copper atom stuck to the plate: a new layer of copper grows.', 'Cu²⁺ आयन − प्लेट की ओर खिसकते हैं। वहाँ हर आयन दो इलेक्ट्रॉन लेकर कॉपर का एटम बन जाता है और प्लेट पर चिपक जाता है: कॉपर की एक नई परत चढ़ती जाती है।', 'Cu²⁺ ions − plate ki taraf khisakte hain. Wahan har ion do electrons lekar copper atom ban jaata hai aur plate par chipak jaata hai: copper ki nayi layer chadhti jaati hai.'));
  for (let k = 0; k < 6; k++) { const c = cu[k]; c.mode = 'held'; const y = -0.13 + k * 0.05; c.go(BX - 0.04, y, 0.12); await W2(V, 1.1); const P = c.g.position.clone(); V.remove(c); V.add('Cu', P.x, P.y, { mode: 'fixed', col: '#e0874a', label: k === 0 }); }
  V.caption(L3('At the + plate, copper atoms give away two electrons each and go into the solution as Cu²⁺ ions. So copper moves from the + plate to the − plate, and the solution stays blue.', '+ प्लेट पर कॉपर के एटम दो-दो इलेक्ट्रॉन छोड़कर Cu²⁺ आयन बनते हैं और घोल में चले जाते हैं। इस तरह कॉपर + प्लेट से − प्लेट पर पहुँचता है, और घोल नीला ही बना रहता है।', '+ plate par copper atoms do-do electrons chhodkar Cu²⁺ ions bante hain aur solution mein chale jaate hain. Is tarah copper + plate se − plate par pahunchta hai, aur solution blue hi bana rehta hai.'));
  for (let k = 0; k < 5; k++) { const a = A[5 - k]; const P = a.g.position.clone(); a.labelIt(null); V.remove(a); const ion = V.add('Cu2+', P.x + 0.02, P.y, { label: k === 0 }); ion.vel.set(0.03, rnd(-0.01, 0.01), 0); await W2(V, 0.9); }
  await W2(V, 5);
};
async function waterSplit(V, o) {
  pole(V, -BX + 0.006, true, '#c0392b'); pole(V, BX - 0.006, false, '#3a3f46');
  const w = V.spawn('H2O', 10, -BX + 0.04, BX - 0.04, -BY, BY, { label: true }); const h = V.spawn('H+', 8, -BX + 0.04, BX - 0.04, -BY, BY, { label: true }); V.spawn('SO42-', 3, -BX + 0.04, BX - 0.04, -BY, BY, { label: true });
  V.caption(o.c1); await W2(V, 5);
  V.caption(L3('At the − electrode, H⁺ ions take electrons. Two hydrogen atoms pair up as a molecule of hydrogen gas, H₂, which bubbles up.', '− इलेक्ट्रोड पर H⁺ आयन इलेक्ट्रॉन लेते हैं। दो हाइड्रोजन एटम जोड़ी बनाकर हाइड्रोजन गैस का मॉलिक्यूल H₂ बनाते हैं, जो बुलबुला बनकर ऊपर उठता है।', '− electrode par H⁺ ions electrons lete hain. Do hydrogen atoms jodi banakar hydrogen gas ka molecule H₂ banate hain, jo bulbula bankar upar uthta hai.'));
  for (let k = 0; k < 4; k++) { const a = h[2 * k], b = h[2 * k + 1]; if (!a || !b) break; a.mode = 'held'; b.mode = 'held'; const y = -0.1 + k * 0.05; a.go(BX - 0.035, y - 0.008, 0.14); b.go(BX - 0.035, y + 0.008, 0.14); await W2(V, 1.2); V.remove(a); V.remove(b); const g = V.add('H2', BX - 0.04, y, { label: k === 0 }); g.mode = 'rise'; g.riseV = 0.05; await W2(V, 0.3); }
  V.caption(L3('At the + electrode, water molecules give away electrons and release oxygen gas, O₂. Only one O₂ is made for every two H₂.', '+ इलेक्ट्रोड पर पानी के मॉलिक्यूल इलेक्ट्रॉन छोड़ते हैं और ऑक्सीजन गैस O₂ निकलती है। हर दो H₂ पर सिर्फ़ एक O₂ बनता है।', '+ electrode par paani ke molecules electrons chhodte hain aur oxygen gas O₂ nikalti hai. Har do H₂ par sirf ek O₂ banta hai.'));
  for (let k = 0; k < 2; k++) { const a = w[2 * k], b = w[2 * k + 1]; a.mode = 'held'; b.mode = 'held'; a.labelIt(null); b.labelIt(null); const y = -0.06 + k * 0.08; a.go(-BX + 0.035, y - 0.01, 0.14); b.go(-BX + 0.035, y + 0.01, 0.14); await W2(V, 1.3); V.remove(a); V.remove(b); const g = V.add('O2', -BX + 0.045, y, { label: k === 0 }); g.mode = 'rise'; g.riseV = 0.05; for (let j = 0; j < 2; j++) V.add('H+', -BX + 0.06, y + rnd(-0.02, 0.02), {}); await W2(V, 0.4); }
  V.caption(L3('So the tube over − collects twice as much gas (hydrogen) as the tube over + (oxygen): 2H₂O → 2H₂ + O₂.', 'इसीलिए − के ऊपर वाली ट्यूब में + के ऊपर वाली ट्यूब (ऑक्सीजन) से दोगुनी गैस (हाइड्रोजन) जमा होती है: 2H₂O → 2H₂ + O₂।', 'Isiliye − ke upar wali tube mein + ke upar wali tube (oxygen) se double gas (hydrogen) jama hoti hai: 2H₂O → 2H₂ + O₂.'));
  await W2(V, 6);
}
SCRIPTS.electrolysis9v = (V) => waterSplit(V, { c1: L3('Water with a little acid around the two terminals of the battery: water molecules, H⁺ ions and SO₄²⁻ ions. Left: the + terminal. Right: the − terminal.', 'बैटरी के दोनों टर्मिनलों के आसपास थोड़ा एसिड मिला पानी: पानी के मॉलिक्यूल, H⁺ आयन और SO₄²⁻ आयन। बाएँ: + टर्मिनल। दाएँ: − टर्मिनल।', 'Battery ke dono terminals ke aas-paas thoda acid mila paani: paani ke molecules, H⁺ ions aur SO₄²⁻ ions. Left: + terminal. Right: − terminal.') });
SCRIPTS.electrolysis10 = (V) => waterSplit(V, { c1: L3('Acidified water between the two carbon electrodes: water molecules with H⁺ and SO₄²⁻ ions from the acid. Left: the anode (+). Right: the cathode (−).', 'दो कार्बन इलेक्ट्रोड के बीच एसिड मिला पानी: पानी के मॉलिक्यूल, और एसिड से आए H⁺ व SO₄²⁻ आयन। बाएँ: ऐनोड (+)। दाएँ: कैथोड (−)।', 'Do carbon electrodes ke beech acid mila paani: paani ke molecules, aur acid se aaye H⁺ aur SO₄²⁻ ions. Left: anode (+). Right: cathode (−).') });
SCRIPTS.ionic_covalent = async (V) => {
  wall(V, 0, 0.003, 2 * BY, '#6a7480');
  const x = []; for (let i = 0; i < 12; i++) x.push(V.add(i % 2 ? 'Cl-' : 'Na+', -0.17 + (i % 4) * 0.026, -BY + 0.02 + Math.floor(i / 4) * 0.026, { mode: 'fixed', label: i < 2 }));
  const su = []; for (let i = 0; i < 4; i++) su.push(V.add('sugar', 0.07 + (i % 2) * 0.07, -BY + 0.03 + Math.floor(i / 2) * 0.045, { mode: 'fixed', label: i === 0 }));
  V.caption(L3('Left: salt, an ionic compound — a crystal of Na⁺ and Cl⁻ ions. Right: sugar, a covalent compound — made of whole molecules with no charge.', 'बाएँ: नमक, एक आयनिक कंपाउंड — Na⁺ और Cl⁻ आयनों का क्रिस्टल। दाएँ: चीनी, एक कोवैलेंट (सहसंयोजक) कंपाउंड — बिना चार्ज वाले पूरे मॉलिक्यूल से बनी।', 'Left: namak, ek ionic compound — Na⁺ aur Cl⁻ ions ka crystal. Right: cheeni, ek covalent compound — bina charge wale poore molecules se bani.')); await W2(V, 5);
  V.caption(L3('In water both dissolve. The salt crystal comes apart into free ions; the sugar comes apart into separate molecules, which still have no charge.', 'पानी में दोनों घुल जाते हैं। नमक का क्रिस्टल खुलकर फ़्री आयनों में बिखर जाता है; चीनी अलग-अलग मॉलिक्यूल में बिखरती है, जिन पर अब भी कोई चार्ज नहीं होता।', 'Paani mein dono ghul jaate hain. Namak ka crystal khulkar free ions mein bikhar jaata hai; cheeni alag-alag molecules mein bikharti hai, jin par ab bhi koi charge nahi hota.'));
  for (const p of x) { p.mode = 'free'; p.side = -1; } for (const p of su) { p.mode = 'free'; p.side = 1; } V.temp = 1.6; await W2(V, 4);
  V.caption(L3('With electrodes in the solutions, the ions move towards them and carry the current: the bulb glows. The sugar molecules just wander about, so there is no current. Camphor and naphthalene do not even dissolve in water.', 'घोलों में इलेक्ट्रोड डालने पर आयन उनकी ओर चलते हैं और करंट ले जाते हैं: बल्ब जलता है। चीनी के मॉलिक्यूल बस इधर-उधर घूमते रहते हैं, इसलिए करंट नहीं बहता। कपूर और नैफ़्थलीन तो पानी में घुलते भी नहीं।', 'Solutions mein electrodes daalne par ions unki taraf chalte hain aur current le jaate hain: bulb jalta hai. Cheeni ke molecules bas idhar-udhar ghoomte rehte hain, isliye current nahi behta. Kapoor aur naphthalene to paani mein ghulte bhi nahi.'));
  for (let k = 0; k < 6; k++) { for (const p of x) { if (p.mode !== 'free' && p.mode !== 'go') continue; const P = p.g.position; const left = p.sp === 'Cl-'; p.go(left ? Math.max(-BX + 0.02, P.x - 0.03) : Math.min(-0.03, P.x + 0.03), P.y + rnd(-0.01, 0.01), 0.06); } await W2(V, 0.7); }
  await W2(V, 4);
};
SCRIPTS.acid_conduct = async (V) => {
  pole(V, -BX + 0.006, true, '#8d9196'); pole(V, BX - 0.006, false, '#8d9196');
  const hcl = V.spawn('HCl', 6, -0.15, 0.15, -BY + 0.03, BY - 0.03, { label: true }); V.spawn('H2O', 6, -0.15, 0.15, -BY, BY, {});
  V.caption(L3('Dilute hydrochloric acid: in water each HCl molecule splits into an H⁺ ion and a Cl⁻ ion.', 'डाइल्यूट हाइड्रोक्लोरिक एसिड: पानी में हर HCl मॉलिक्यूल टूटकर एक H⁺ आयन और एक Cl⁻ आयन बन जाता है।', 'Dilute hydrochloric acid: paani mein har HCl molecule tootkar ek H⁺ ion aur ek Cl⁻ ion ban jaata hai.')); await W2(V, 3);
  const H = [], Cl = []; for (const [i, m] of hcl.entries()) { const P = m.g.position.clone(); m.labelIt(null); V.remove(m); H.push(V.add('H+', P.x - 0.012, P.y, { label: i === 0 })); Cl.push(V.add('Cl-', P.x + 0.012, P.y, { label: i === 0 })); await W2(V, 0.3); }
  V.caption(L3('Switch on: H⁺ ions move to the − nail and Cl⁻ ions to the + nail. The moving ions carry the current, so the bulb glows. At the − nail H⁺ ions turn into hydrogen gas: the bubbles.', 'स्विच ऑन करते ही H⁺ आयन − कील की ओर और Cl⁻ आयन + कील की ओर चलते हैं। चलते हुए आयन करंट ले जाते हैं, इसलिए बल्ब जलता है। − कील पर H⁺ आयन हाइड्रोजन गैस बन जाते हैं: यही बुलबुले हैं।', 'Switch on karte hi H⁺ ions − keel ki taraf aur Cl⁻ ions + keel ki taraf chalte hain. Chalte hue ions current le jaate hain, isliye bulb jalta hai. − keel par H⁺ ions hydrogen gas ban jaate hain: yahi bulbule hain.'));
  await ionsMove(V, { pos: H, neg: Cl, rounds: 8 });
  V.clear(); pole(V, -BX + 0.006, true, '#8d9196'); pole(V, BX - 0.006, false, '#8d9196'); V.spawn('glu', 5, -0.15, 0.15, -BY + 0.03, BY - 0.03, { label: true }); V.spawn('alc', 4, -0.15, 0.15, -BY + 0.03, BY - 0.03, { label: true });
  V.caption(L3('Glucose (C₆H₁₂O₆) and alcohol (C₂H₅OH) also contain hydrogen, but their molecules stay whole in water: no H⁺ ions, no current, no glow. Only substances that give H⁺ ions in water are acids.', 'ग्लूकोज़ (C₆H₁₂O₆) और अल्कोहल (C₂H₅OH) में भी हाइड्रोजन है, पर इनके मॉलिक्यूल पानी में पूरे के पूरे रहते हैं: न H⁺ आयन, न करंट, न रोशनी। सिर्फ़ वही पदार्थ एसिड हैं जो पानी में H⁺ आयन देते हैं।', 'Glucose (C₆H₁₂O₆) aur alcohol (C₂H₅OH) mein bhi hydrogen hai, par inke molecules paani mein poore ke poore rehte hain: na H⁺ ions, na current, na roshni. Sirf wahi substances acid hain jo paani mein H⁺ ions dete hain.'));
  await W2(V, 8);
};
SCRIPTS.flame_ionic = async (V) => {
  const ring = (r) => { const m = new THREE.Mesh(new THREE.TorusGeometry(r, 0.0012, 6, 64), new THREE.MeshBasicMaterial({ color: 0x5f7387 })); V.box.add(m); V.extra.push(m); return m; };
  ring(0.055); ring(0.1); const ion = V.add('Na+', 0, 0, { mode: 'fixed', label: true, size: 1.4 }); const e = V.add('e-', 0.055, 0, { mode: 'fixed', label: true });
  let ang = 0; const spin = async (sec, r) => { const n = Math.round(sec / 0.1); for (let i = 0; i < n; i++) { ang += 0.35; e.go(Math.cos(ang) * r, Math.sin(ang) * r, 0.6); await W2(V, 0.1); } };
  V.caption(L3('A sodium ion in the flame. Its outer electron moves in a fixed energy level around it.', 'लौ में एक सोडियम आयन। इसका बाहरी इलेक्ट्रॉन इसके चारों ओर एक तय एनर्जी लेवल में घूमता है।', 'Flame mein ek sodium ion. Iska bahari electron iske chaaron taraf ek fixed energy level mein ghoomta hai.')); await spin(4, 0.055);
  const flash = async (col) => { V.heat(0.8); await spin(1.2, 0.1); await spin(0.6, 0.055); const ph = V.add('photon', Math.cos(ang) * 0.06, Math.sin(ang) * 0.06, { col, mode: 'fixed' }); ph.go(Math.cos(ang) * 0.28, Math.sin(ang) * 0.28, 0.25); setTimeout(() => V.remove(ph), 1300); V.heat(0.2); };
  V.caption(L3('The heat pushes the electron up to a higher level. It cannot stay there: it falls back and gives out the extra energy as a flash of light.', 'गर्मी इलेक्ट्रॉन को ऊँचे लेवल पर धकेल देती है। वह वहाँ टिक नहीं पाता: वापस गिरता है और फ़ालतू एनर्जी को रोशनी की चमक के रूप में छोड़ देता है।', 'Garmi electron ko oonche level par dhakel deti hai. Woh wahan tik nahi paata: wapas girta hai aur extra energy ko roshni ki chamak ke roop mein chhod deta hai.'));
  for (let k = 0; k < 4; k++) await flash('#ffc21a');
  V.caption(L3('For sodium this light is golden yellow. Potassium gives lilac and barium apple-green, because their energy levels are different. That is why each metal has its own flame colour — and why fireworks have so many colours.', 'सोडियम में यह रोशनी सुनहरी पीली होती है। पोटैशियम हल्का बैंगनी (लाइलैक) और बेरियम सेब जैसा हरा रंग देता है, क्योंकि उनके एनर्जी लेवल अलग होते हैं। इसीलिए हर धातु की लौ का अपना रंग होता है — और इसीलिए आतिशबाज़ी में इतने रंग होते हैं।', 'Sodium mein ye roshni sunehri peeli hoti hai. Potassium lilac aur barium apple-green rang deta hai, kyunki unke energy levels alag hote hain. Isiliye har metal ki flame ka apna rang hota hai — aur isiliye fireworks mein itne rang hote hain.'));
  ion.labelIt('K⁺'); ion.recolor('#8a55d4'); for (let k = 0; k < 2; k++) await flash('#b88cff');
  ion.labelIt('Ba²⁺'); ion.recolor('#2db3a4'); for (let k = 0; k < 2; k++) await flash('#8fe85a');
  V.heat(0); await W2(V, 4);
};

// ======================================================================================== batch 5 (Class 9)
SCRIPTS.iron_sulphur = async (V) => {
  const fe = [], su = []; for (let i = 0; i < 8; i++) { fe.push(V.add('Fe', -0.16 + (i % 4) * 0.026, -0.05 + Math.floor(i / 4) * 0.026, { mode: 'fixed', label: i === 0 })); su.push(V.add('S', 0.06 + (i % 4) * 0.026, 0.03 + Math.floor(i / 4) * 0.026, { mode: 'fixed', label: i === 0 })); }
  V.caption(L3('In the mixture, bits of iron (orange atoms) and bits of sulphur (yellow atoms) just lie side by side. They are not joined, so a magnet can still pull the iron away.', 'मिश्रण में लोहे के टुकड़े (नारंगी एटम) और सल्फ़र के टुकड़े (पीले एटम) बस पास-पास पड़े हैं। ये आपस में जुड़े नहीं हैं, इसलिए चुंबक अब भी लोहे को खींचकर अलग कर सकता है।', 'Mixture mein lohe ke tukde (orange atoms) aur sulphur ke tukde (yellow atoms) bas paas-paas pade hain. Ye aapas mein jude nahi hain, isliye magnet ab bhi lohe ko kheenchkar alag kar sakta hai.')); await W2(V, 5.5);
  V.heat(0.9); V.caption(L3('On heating, each iron atom joins one sulphur atom. The new units, FeS, are a new substance: iron sulphide, a compound.', 'गरम करने पर लोहे का हर एटम सल्फ़र के एक एटम से जुड़ जाता है। ये नई यूनिट FeS एक नया पदार्थ हैं: आयरन सल्फ़ाइड, यानी एक कंपाउंड (यौगिक)।', 'Garam karne par lohe ka har atom sulphur ke ek atom se jud jaata hai. Ye nayi units FeS ek naya substance hain: iron sulphide, yaani ek compound.'));
  for (let k = 0; k < 8; k++) { const a = fe[k], b = su[k]; b.mode = 'held'; b.labelIt(null); a.labelIt(null); const x = -0.12 + (k % 4) * 0.08, y = -0.06 + Math.floor(k / 4) * 0.06; a.go(x - 0.007, y, 0.14); b.go(x + 0.007, y, 0.14); await W2(V, 0.5); }
  await W2(V, 1.5); for (let k = 0; k < 8; k++) { const P = fe[k].g.position.clone(); V.remove(fe[k]); V.remove(su[k]); V.add('FeS', P.x + 0.007, P.y, { mode: 'fixed', label: k === 0, col: '#3a3532' }); }
  V.heat(0); V.caption(L3('In the compound the iron is locked to sulphur, so it is no longer magnetic, and with acid it gives hydrogen sulphide (H₂S) instead of hydrogen.', 'कंपाउंड में लोहा सल्फ़र से बँध चुका है, इसलिए अब यह चुंबकीय नहीं रहता, और एसिड के साथ हाइड्रोजन की जगह हाइड्रोजन सल्फ़ाइड (H₂S) देता है।', 'Compound mein iron sulphur se bandh chuka hai, isliye ab ye magnetic nahi rehta, aur acid ke saath hydrogen ki jagah hydrogen sulphide (H₂S) deta hai.')); await W2(V, 6);
};
SCRIPTS.colloid_s = async (V) => {
  V.beam(0.0, 0); V.spawn('Na+', 6, -BX, BX, -BY, BY, { label: true }); V.spawn('Cl-', 6, -BX, BX, -BY, BY, { label: true });
  V.caption(L3('Salt solution: the Na⁺ and Cl⁻ ions are far too small to scatter light, so the beam passes through unseen and nothing is caught by the filter paper.', 'नमक का घोल: Na⁺ और Cl⁻ आयन इतने छोटे हैं कि रोशनी को बिखेर ही नहीं सकते, इसलिए किरण बिना दिखे निकल जाती है और फ़िल्टर पेपर पर कुछ नहीं रुकता।', 'Namak ka solution: Na⁺ aur Cl⁻ ions itne chhote hain ki light ko scatter hi nahi kar sakte, isliye beam bina dikhe nikal jaati hai aur filter paper par kuch nahi rukta.')); V.beam(0.05, 0); await W2(V, 6);
  V.clear(); V.spawn('Sc', 8, -BX, BX, -BY, BY, { label: true }); V.spawn('H2O', 8, -BX, BX, -BY, BY, {});
  V.caption(L3('Colloid: the sulphur forms clusters of many atoms. They are big enough to scatter the beam (it glows), but small enough to pass through filter paper, and they keep moving, so they never settle.', 'कोलॉइड: सल्फ़र के बहुत-से एटम मिलकर गुच्छे बनाते हैं। ये इतने बड़े हैं कि किरण को बिखेर दें (किरण चमकती है), पर इतने छोटे हैं कि फ़िल्टर पेपर से निकल जाएँ, और लगातार हिलते रहते हैं, इसलिए कभी नीचे नहीं बैठते।', 'Colloid: sulphur ke bahut-se atoms milkar gucchhe banate hain. Ye itne bade hain ki beam ko scatter kar dein (beam chamakti hai), par itne chhote hain ki filter paper se nikal jaayein, aur hilte rehte hain, isliye kabhi neeche nahi baithte.')); V.beam(0.55, 0); await W2(V, 7);
  V.clear(); const ch = V.spawn('chalk', 5, -BX, BX, -0.05, BY, {}); V.spawn('H2O', 8, -BX, BX, -BY, BY, {});
  V.caption(L3('Suspension: chalk particles are much bigger. They scatter light, are stopped by the filter paper, and slowly sink to the bottom.', 'सस्पेंशन: चॉक के कण इससे कहीं बड़े होते हैं। ये रोशनी बिखेरते हैं, फ़िल्टर पेपर पर रुक जाते हैं, और धीरे-धीरे नीचे बैठ जाते हैं।', 'Suspension: chalk ke particles isse kahin bade hote hain. Ye light scatter karte hain, filter paper par ruk jaate hain, aur dheere-dheere neeche baith jaate hain.')); V.beam(0.4, 0);
  await W2(V, 2); ch.forEach((p, i) => p.go(-0.15 + i * 0.075, -BY + 0.04, 0.03)); await W2(V, 6); V.beam(0, 0);
};
SCRIPTS.crystallise = async (V) => {
  const cu = V.spawn('Cu2+', 8, -BX, BX, -0.06, BY, { label: true }); const so = V.spawn('SO42-', 8, -BX, BX, -0.06, BY, { label: true }); V.spawn('H2O', 8, -BX, BX, -BY, BY, {}); V.temp = 2.2; V.heat(0.7);
  V.caption(L3('In the hot saturated solution the Cu²⁺ and SO₄²⁻ ions move fast and the water can hold a lot of them.', 'गरम सैचुरेटेड घोल में Cu²⁺ और SO₄²⁻ आयन तेज़ी से घूमते हैं, और पानी इन्हें बहुत ज़्यादा मात्रा में घोले रख सकता है।', 'Garam saturated solution mein Cu²⁺ aur SO₄²⁻ ions tezi se ghoomte hain, aur paani inhe bahut zyada maatra mein ghole rakh sakta hai.')); await W2(V, 5);
  V.heat(0); V.temp = 0.8; V.caption(L3('As it cools, the ions slow down. The water cannot hold so many, so they settle into a neat, repeating pattern: a crystal grows. Dust and other impurities do not fit into the pattern and stay in the liquid.', 'ठंडा होने पर आयन धीमे पड़ जाते हैं। पानी इतने आयन नहीं सँभाल पाता, इसलिए वे एक साफ़, बार-बार दोहराए जाने वाले पैटर्न में बैठते जाते हैं: क्रिस्टल बढ़ता है। धूल और दूसरी अशुद्धियाँ इस पैटर्न में फ़िट नहीं होतीं और घोल में ही रह जाती हैं।', 'Thanda hone par ions dheeme pad jaate hain. Paani itne ions nahi sambhaal paata, isliye woh ek neat, baar-baar repeat hone wale pattern mein baithte jaate hain: crystal badhta hai. Dhool aur doosri impurities is pattern mein fit nahi hotin aur ghol mein hi reh jaati hain.'));
  const all = []; for (let i = 0; i < 6; i++) { all.push(cu[i], so[i]); } all.forEach((p) => { p.mode = 'held'; p.labelIt(null); }); V.lattice(all, 0, -BY + 0.02, 6, 0.03, 0.06); all.forEach((p, i) => p.recolor(i % 2 ? '#f0c419' : '#2f86e8')); await W2(V, 7);
};
SCRIPTS.sep_funnel = async (V) => {
  V.spawn('H2O', 14, -BX, BX, -BY, BY, {}); const oil = V.spawn('oil', 8, -BX, BX, -BY, BY, {});
  V.caption(L3('Just after pouring, oil drops are spread through the water. Oil and water molecules do not attract each other enough to mix.', 'डालने के तुरंत बाद तेल की बूँदें पानी में फैली रहती हैं। तेल और पानी के मॉलिक्यूल एक-दूसरे को इतना नहीं खींचते कि आपस में मिल जाएँ।', 'Daalne ke turant baad tel ki boondein paani mein faili rehti hain. Tel aur paani ke molecules ek-doosre ko itna nahi kheenchte ki aapas mein mil jaayein.')); await W2(V, 5);
  V.caption(L3('Oil is lighter (less dense), so the drops rise and join into a layer on top. The heavier water stays below and runs out first through the stopcock.', 'तेल हल्का है (इसका घनत्व कम है), इसलिए बूँदें ऊपर उठकर एक परत बना लेती हैं। भारी पानी नीचे रहता है और स्टॉपकॉक से पहले वही निकलता है।', 'Tel halka hai (iski density kam hai), isliye boondein upar uthkar ek layer bana leti hain. Bhaari paani neeche rehta hai aur stopcock se pehle wahi nikalta hai.'));
  oil.forEach((p, i) => { p.mode = 'held'; p.go(-0.18 + i * 0.05, BY - 0.02 - (i % 2) * 0.02, 0.05); }); V.walls = { x0: -BX, x1: BX, y0: -BY, y1: BY - 0.07 }; await W2(V, 7);
};
SCRIPTS.sand_salt_nh4cl = async (V) => {
  const ac = []; for (let i = 0; i < 5; i++) ac.push(V.add('NH4Cl', -0.16 + i * 0.08, -BY + 0.02, { mode: 'fixed', label: i === 0 })); V.spawn('sand', 3, -BX, BX, -BY, -0.1, {}); const na = V.add('Na+', -0.05, -BY + 0.05, { mode: 'fixed', label: true }); const cl = V.add('Cl-', 0.03, -BY + 0.05, { mode: 'fixed', label: true });
  V.heat(0.8); V.caption(L3('Heat breaks ammonium chloride into two gases, ammonia (NH₃) and hydrogen chloride (HCl). They rise to the cool funnel and join again as solid NH₄Cl. Sand and salt stay behind.', 'गर्मी से अमोनियम क्लोराइड टूटकर दो गैसें बनाता है — अमोनिया (NH₃) और हाइड्रोजन क्लोराइड (HCl)। ये ऊपर ठंडी कीप तक जाती हैं और फिर से जुड़कर ठोस NH₄Cl बन जाती हैं। रेत और नमक नीचे ही रह जाते हैं।', 'Garmi se ammonium chloride tootkar do gases banata hai — ammonia (NH₃) aur hydrogen chloride (HCl). Ye upar thandi funnel tak jaati hain aur phir se judkar solid NH₄Cl ban jaati hain. Ret aur namak neeche hi reh jaate hain.'));
  for (let k = 0; k < 5; k++) { const P = ac[k].g.position.clone(); ac[k].labelIt(null); V.remove(ac[k]); const a = V.add('NH3', P.x - 0.01, P.y + 0.02, { label: k === 0 }), b = V.add('HCl', P.x + 0.01, P.y + 0.02, { label: k === 0 }); a.go(-0.14 + k * 0.07, BY - 0.02, 0.12); b.go(-0.12 + k * 0.07, BY - 0.02, 0.12); await W2(V, 0.8); }
  await W2(V, 2.5); V.heat(0); V.spawn('H2O', 8, -BX, BX, -BY, 0, {});
  V.caption(L3('Then water pulls the salt apart into Na⁺ and Cl⁻ ions (it dissolves), while the big sand grains do not dissolve and are caught by the filter paper.', 'फिर पानी नमक को Na⁺ और Cl⁻ आयनों में अलग कर देता है (यानी नमक घुल जाता है), जबकि रेत के बड़े कण नहीं घुलते और फ़िल्टर पेपर पर रुक जाते हैं।', 'Phir paani namak ko Na⁺ aur Cl⁻ ions mein alag kar deta hai (yaani namak ghul jaata hai), jabki ret ke bade kan nahi ghulte aur filter paper par ruk jaate hain.')); na.mode = 'free'; cl.mode = 'free'; await W2(V, 6);
};
SCRIPTS.distillation = async (V) => {
  const ac = V.spawn('acet', 8, -BX, 0, -BY, -0.02, { label: true }); V.spawn('H2O', 10, -BX, 0, -BY, -0.02, { label: true }); V.walls = { x0: -BX, x1: BX, y0: -BY, y1: BY };
  V.caption(L3('In the flask, acetone and water molecules are mixed. Acetone molecules hold each other weakly, so they escape as vapour at only 56 °C.', 'फ़्लास्क में एसीटोन और पानी के मॉलिक्यूल मिले हुए हैं। एसीटोन के मॉलिक्यूल एक-दूसरे को कमज़ोर पकड़ से थामे रहते हैं, इसलिए सिर्फ़ 56 °C पर ही भाप बनकर निकल जाते हैं।', 'Flask mein acetone aur paani ke molecules mile hue hain. Acetone ke molecules ek-doosre ko kamzor pakad se thaame rehte hain, isliye sirf 56 °C par hi bhaap bankar nikal jaate hain.')); V.heat(0.5); await W2(V, 5);
  V.caption(L3('Their vapour goes up the side arm into the cold condenser, loses its heat and turns back into liquid acetone. Water needs 100 °C, so it stays in the flask.', 'इनकी भाप साइड आर्म से होकर ठंडे कंडेंसर में जाती है, और ठंडी होकर फिर से तरल एसीटोन बन जाती है। पानी को 100 °C चाहिए, इसलिए वह फ़्लास्क में ही रह जाता है।', 'Inki bhaap side arm se hokar thande condenser mein jaati hai, aur thandi hokar phir se liquid acetone ban jaati hai. Paani ko 100 °C chahiye, isliye woh flask mein hi reh jaata hai.'));
  for (let k = 0; k < ac.length; k++) { const p = ac[k]; p.mode = 'held'; p.go(0.02, BY - 0.02, 0.16); p.onArrive = () => { p.go(0.12 + (k % 4) * 0.025, -BY + 0.02 + Math.floor(k / 4) * 0.025, 0.12); }; await W2(V, 0.7); }
  await W2(V, 5); V.heat(0);
};
SCRIPTS.centrifuge_milk = async (V) => {
  const fat = V.spawn('fat', 8, -BX, BX, -BY, BY, {}); V.spawn('H2O', 10, -BX, BX, -BY, BY, {}); const pr = V.spawn('milk', 6, -BX, BX, -BY, BY, {});
  V.caption(L3('Milk is water with tiny droplets of fat (cream, yellowish) and other heavier particles spread through it.', 'दूध असल में पानी है, जिसमें फ़ैट (मलाई, हल्की पीली) की छोटी-छोटी बूँदें और दूसरे भारी कण फैले रहते हैं।', 'Doodh asal mein paani hai, jismein fat (malai, halki peeli) ki chhoti-chhoti boondein aur doosre bhaari particles faile rehte hain.')); await W2(V, 5);
  V.caption(L3('Spinning fast pushes the heavier parts outward, to the bottom of the tube. The lighter fat droplets are left nearer the centre: at the top. So the cream separates.', 'तेज़ी से घुमाने पर भारी हिस्से बाहर की ओर, यानी ट्यूब की तली में चले जाते हैं। फ़ैट की हल्की बूँदें बीच के पास, यानी ऊपर रह जाती हैं। इस तरह मलाई अलग हो जाती है।', 'Tezi se ghumaane par bhaari hisse bahar ki taraf, yaani tube ki tali mein chale jaate hain. Fat ki halki boondein centre ke paas, yaani upar reh jaati hain. Is tarah malai alag ho jaati hai.'));
  fat.forEach((p, i) => { p.mode = 'held'; p.go(-0.18 + i * 0.05, BY - 0.02, 0.08); }); pr.forEach((p, i) => { p.mode = 'held'; p.go(-0.15 + i * 0.06, -BY + 0.03, 0.08); }); await W2(V, 7);
};
SCRIPTS.ink_dye = async (V) => {
  const w = V.spawn('H2O', 14, -BX, BX, -BY, -0.02, { label: true, tempK: 1.6 }); const d = V.spawn('dye', 6, -BX, BX, -BY, -0.02, { col: '#2a3f9a' }); wall(V, 0, 2 * BX, 0.003, '#8892a0', -0.02); V.walls = { x0: -BX, x1: BX, y0: -BY, y1: -0.025 };
  V.caption(L3('Ink is dye particles (blue) dissolved in water. The steam heats it gently.', 'स्याही यानी पानी में घुले डाई के कण (नीले)। भाप इसे धीरे-धीरे गरम करती है।', 'Ink yaani paani mein ghule dye ke particles (blue). Bhaap ise dheere-dheere garam karti hai.')); V.heat(0.5); await W2(V, 4);
  V.caption(L3('The water molecules gain energy and escape as vapour. The dye particles cannot evaporate, so they are left behind as a dry solid.', 'पानी के मॉलिक्यूल एनर्जी पाकर भाप बनकर उड़ जाते हैं। डाई के कण भाप नहीं बन सकते, इसलिए सूखे ठोस के रूप में पीछे रह जाते हैं।', 'Paani ke molecules energy paakar bhaap bankar ud jaate hain. Dye ke particles evaporate nahi ho sakte, isliye sookhe solid ke roop mein peeche reh jaate hain.'));
  V.walls = null; for (const p of w) { p.mode = 'rise'; p.riseV = 0.05; await W2(V, 0.35); } d.forEach((p, i) => { p.mode = 'held'; p.go(-0.08 + i * 0.03, -BY + 0.02, 0.06); }); V.heat(0); await W2(V, 5);
};
SCRIPTS.mass_closed = async (V) => {
  const box = wall(V, 0, 2 * BX - 0.02, 2 * BY - 0.02, '#16202c'); box.material.opacity = 0.6;
  const h = V.spawn('CH3COO', 4, -BX, 0, -BY, 0, { label: true }); const hp = V.spawn('H+', 4, -BX, 0, -BY, 0, { label: true }); const b = V.spawn('HCO3-', 4, 0, BX, -BY, 0, { label: true }); V.spawn('Na+', 4, 0, BX, -BY, 0, { label: true });
  V.caption(L3('Inside the closed flask: vinegar (acetic acid) and baking soda. Count the atoms: every one of them stays inside the flask and balloon.', 'बंद फ़्लास्क के अंदर: सिरका (एसीटिक एसिड) और बेकिंग सोडा। एटम गिनिए: हर एक एटम फ़्लास्क और गुब्बारे के अंदर ही रहता है।', 'Band flask ke andar: sirka (acetic acid) aur baking soda. Atoms giniye: har ek atom flask aur gubbare ke andar hi rehta hai.')); await W2(V, 5);
  V.caption(L3('H⁺ from the acid reacts with HCO₃⁻: water and carbon dioxide gas form. The gas goes up into the balloon, but it is still part of the system.', 'एसिड का H⁺, HCO₃⁻ से रिएक्शन करता है: पानी और कार्बन डाइऑक्साइड गैस बनती है। गैस ऊपर गुब्बारे में चली जाती है, पर वह अब भी इसी सिस्टम का हिस्सा है।', 'Acid ka H⁺, HCO₃⁻ se react karta hai: paani aur carbon dioxide gas banti hai. Gas upar gubbare mein chali jaati hai, par woh ab bhi isi system ka hissa hai.'));
  for (let k = 0; k < 4; k++) { const x = hp[k], y = b[k]; x.mode = 'held'; x.go(y.g.position.x, y.g.position.y + 0.02, 0.14); await W2(V, 1); const P = y.g.position.clone(); V.remove(x); V.remove(y); V.add('H2O', P.x, P.y, { label: k === 0 }); const c = V.add('CO2', P.x, P.y + 0.02, { label: k === 0 }); c.go(-0.15 + k * 0.1, BY - 0.03, 0.08); }
  void h; V.caption(L3('The atoms have only changed partners. None were made and none were lost, so the total mass stays the same — as long as no gas escapes.', 'एटमों ने सिर्फ़ अपने साथी बदले हैं। न कोई नया बना, न कोई खोया, इसलिए कुल द्रव्यमान (मास) वही रहता है — बशर्ते कोई गैस बाहर न निकले।', 'Atoms ne sirf apne partner badle hain. Na koi naya bana, na koi khoya, isliye total mass wahi rehta hai — basharte koi gas bahar na nikle.')); await W2(V, 6);
};
SCRIPTS.mass_baso4 = (V) => precipitate(V, {
  cat: 'Ba2+', catPartner: 'Cl-', an: 'SO42-', anPartner: 'Na+', nc: 5, ratio: 1, solidCol: '#f4f4f0', prodLabel: 'BaSO₄',
  c1: L3('Beaker B: Ba²⁺ and Cl⁻ ions. Beaker A: Na⁺ and SO₄²⁻ ions. Count them: 5 of each kind.', 'बीकर B: Ba²⁺ और Cl⁻ आयन। बीकर A: Na⁺ और SO₄²⁻ आयन। गिनिए: हर तरह के 5।', 'Beaker B: Ba²⁺ aur Cl⁻ ions. Beaker A: Na⁺ aur SO₄²⁻ ions. Giniye: har tarah ke 5.'),
  c2: L3('When they are mixed, Ba²⁺ and SO₄²⁻ meet.', 'मिलाने पर Ba²⁺ और SO₄²⁻ आपस में मिल जाते हैं।', 'Milaane par Ba²⁺ aur SO₄²⁻ aapas mein mil jaate hain.'),
  c3: L3('They form solid barium sulphate, but no ion has disappeared and none came in: the same atoms, the same total mass.', 'ये मिलकर ठोस बेरियम सल्फ़ेट बनाते हैं, पर न कोई आयन गायब हुआ, न कोई नया आया: वही एटम, वही कुल द्रव्यमान।', 'Ye milkar solid barium sulphate banate hain, par na koi ion gaayab hua, na koi naya aaya: wahi atoms, wahi total mass.'),
});
SCRIPTS.mp_bp = async (V) => {
  const ice = []; for (let i = 0; i < 12; i++) ice.push(V.add('H2O', -0.12 + (i % 4) * 0.08, -0.08 + Math.floor(i / 4) * 0.07, { mode: 'fixed', label: i === 5 }));
  V.caption(L3('In ice the water molecules are held in a fixed pattern. At 0 °C the heat goes into breaking this pattern, so the temperature does not rise until all the ice has melted.', 'बर्फ़ में पानी के मॉलिक्यूल एक तय पैटर्न में बँधे रहते हैं। 0 °C पर सारी गर्मी इस पैटर्न को तोड़ने में लगती है, इसलिए जब तक पूरी बर्फ़ पिघल न जाए, तापमान नहीं बढ़ता।', 'Barf mein paani ke molecules ek fixed pattern mein bandhe rehte hain. 0 °C par saari garmi is pattern ko todne mein lagti hai, isliye jab tak poori barf pighal na jaaye, temperature nahi badhta.')); V.heat(0.4); await W2(V, 4);
  ice.forEach((p) => { p.mode = 'free'; }); await W2(V, 3); V.temp = 2.2; V.heat(0.8);
  V.caption(L3('In water they move freely and faster as it gets hotter. At 100 °C the heat goes into tearing molecules away as steam, so the temperature again stays the same while it boils.', 'पानी में मॉलिक्यूल आज़ादी से घूमते हैं, और जितना गरम करें उतना तेज़ घूमते हैं। 100 °C पर गर्मी मॉलिक्यूल को भाप बनाकर अलग करने में लगती है, इसलिए उबलते समय तापमान फिर से वही बना रहता है।', 'Paani mein molecules aazaadi se ghoomte hain, aur jitna garam karein utna tez ghoomte hain. 100 °C par garmi molecules ko bhaap banakar alag karne mein lagti hai, isliye ubalte samay temperature phir se wahi bana rehta hai.'));
  for (let k = 0; k < 6; k++) { ice[k].mode = 'rise'; ice[k].riseV = 0.07; await W2(V, 0.8); } await W2(V, 4); V.heat(0);
};
// ---------------------------------------------------------------- batch 6 (Class 10)
EL.Ag = ['#c3c7cc', 0.015];
Object.assign(SP, {
  Ag: { a: [['Ag', 0, 0]], l: 'Ag' }, AgCl: { a: [['Ag', -s * 0.6, 0], ['Cl', s * 0.7, 0]], l: 'AgCl' }, Cl2: { a: [['Cl', -s * 0.6, 0], ['Cl', s * 0.6, 0]], l: 'Cl₂' },
  'H3O+': { a: [['O', 0, 0], ['H', -s, s * 0.6], ['H', s, s * 0.6], ['H', 0, -s]], l: 'H₃O⁺' }, CuO: { a: [['Cu', -s * 0.6, 0], ['O', s * 0.6, 0]], l: 'CuO' },
  MnO2: { a: [['Mn', 0, 0], ['O', -s, 0], ['O', s, 0]], l: 'MnO₂', tint: '#6b4423' },
  AcOH: { a: [['C', -s * 0.6, 0], ['C', s * 0.6, 0], ['O', s * 1.4, s * 0.8], ['O', s * 1.4, -s * 0.8], ['H', s * 2.2, -s * 1.1]], l: 'CH₃COOH' },
  ester: { a: [['C', -s * 1.8, 0], ['C', -s * 0.7, s * 0.4], ['O', s * 0.3, 0], ['C', s * 1.3, s * 0.4], ['O', s * 1.3, s * 1.4], ['C', s * 2.4, 0]], l: 'CH₃COOC₂H₅' },
  EtO: { a: [['C', -s * 0.6, 0], ['C', s * 0.6, 0], ['O', s * 1.6, s * 0.6]], l: 'C₂H₅O⁻' }, Na: { a: [['Na', 0, 0]], l: 'Na' }, Ca: { a: [['Ca', 0, 0]], l: 'Ca' },
  soapA: { a: [['O', s * 3.2, 0], ['C', s * 2.2, 0], ['C', s * 1.2, s * 0.5], ['C', s * 0.2, 0], ['C', -s * 0.8, s * 0.5], ['C', -s * 1.8, 0], ['C', -s * 2.8, s * 0.5]], l: 'C₁₇H₃₅COO⁻' },
  glyc: { a: [['C', -s, 0], ['C', 0, s * 0.5], ['C', s, 0], ['O', -s * 1.4, s * 1], ['O', 0, s * 1.6], ['O', s * 1.4, s * 1]], l: 'glycerol' },
  NaHCO3: { a: [['Na', -s * 1.4, 0], ['C', 0, 0], ['O', 0, s * 1.2], ['O', -s * 0.4, -s * 1.1], ['O', s, -s * 0.7], ['H', s * 1.8, -s * 0.9]], l: 'NaHCO₃' },
  naph: { a: [['C', -s * 1.4, 0], ['C', -s * 0.7, s * 0.9], ['C', s * 0.7, s * 0.9], ['C', s * 1.4, 0], ['C', s * 0.7, -s * 0.9], ['C', -s * 0.7, -s * 0.9], ['C', 0, 0]], l: 'C₁₀H₈' },
});
SCRIPTS.agcl_sun = decompose({ unit: 'AgCl', unitCol: '#f4f4f0', gases: [['Cl2', 1]], solidCol: '#8a8794', solidLabel: 'Ag',
  c1: L3('Silver chloride is made of silver (Ag⁺) and chloride (Cl⁻) ions packed together: a white solid.', 'सिल्वर क्लोराइड, सिल्वर (Ag⁺) और क्लोराइड (Cl⁻) आयनों से बना है, जो पास-पास जुड़े हैं: एक सफ़ेद ठोस।', 'Silver chloride, silver (Ag⁺) aur chloride (Cl⁻) ions se bana hai, jo paas-paas jude hain: ek safed solid.'),
  c2: L3('Light gives the energy to break it up: chlorine atoms pair up as chlorine gas (Cl₂) and escape.', 'रोशनी इसे तोड़ने की एनर्जी देती है: क्लोरीन के एटम जोड़ी बनाकर क्लोरीन गैस (Cl₂) बनते हैं और निकल जाते हैं।', 'Roshni ise todne ki energy deti hai: chlorine ke atoms jodi banakar chlorine gas (Cl₂) bante hain aur nikal jaate hain.'),
  c3: L3('Tiny grains of silver metal are left, and they look grey. 2AgCl → 2Ag + Cl₂: a decomposition caused by light.', 'सिल्वर धातु के बहुत छोटे कण बच जाते हैं, जो स्लेटी दिखते हैं। 2AgCl → 2Ag + Cl₂: रोशनी से होने वाला डीकम्पोज़िशन (अपघटन)।', 'Silver metal ke bahut chhote kan bach jaate hain, jo grey dikhte hain. 2AgCl → 2Ag + Cl₂: roshni se hone wala decomposition.') });
SCRIPTS.exo_endo = async (V) => {
  const oh = V.spawn('OH-', 7, -BX, BX, -BY, BY, { label: true }); V.spawn('Na+', 7, -BX, BX, -BY, BY, { label: true }); V.spawn('Cl-', 7, -BX, BX, -BY, BY, { label: true }); const hs = V.spawn('H+', 7, -BX, BX, -BY, BY, { label: true });
  V.caption(L3('Hydrochloric acid gives H⁺ and Cl⁻ ions; sodium hydroxide gives Na⁺ and OH⁻ ions.', 'हाइड्रोक्लोरिक एसिड से H⁺ और Cl⁻ आयन मिलते हैं; सोडियम हाइड्रॉक्साइड से Na⁺ और OH⁻ आयन।', 'Hydrochloric acid se H⁺ aur Cl⁻ ions milte hain; sodium hydroxide se Na⁺ aur OH⁻ ions.')); await W2(V, 4.5);
  V.caption(L3('Each H⁺ joins an OH⁻ to make a water molecule. Forming these new bonds releases energy, so the liquid gets warmer: exothermic.', 'हर H⁺ एक OH⁻ से जुड़कर पानी का एक मॉलिक्यूल बनाता है। ये नए बॉन्ड बनने पर एनर्जी निकलती है, इसलिए घोल गरम हो जाता है: यह एक्सोथर्मिक (ऊष्माक्षेपी) है।', 'Har H⁺ ek OH⁻ se judkar paani ka ek molecule banata hai. Ye naye bonds banne par energy nikalti hai, isliye solution garam ho jaata hai: ye exothermic hai.'));
  for (let k = 0; k < hs.length; k++) { const h = hs[k]; const o = V.nearestFree(oh, h.g.position); if (!o) break; h.mode = 'held'; o.mode = 'held'; h.go(o.g.position.x, o.g.position.y, 0.16); await W2(V, 0.9); const P = o.g.position.clone(); V.remove(o); V.remove(h); V.add('H2O', P.x, P.y, { label: k === 0 }); V.heat(Math.min(1, (k + 1) / 6)); V.temp = 1 + k * 0.15; }
  await W2(V, 2); V.heat(0);
  V.caption(L3('In the barium hydroxide and ammonium chloride reaction the opposite happens: breaking up the crystals needs more energy than is given back, so heat is taken from the surroundings and it gets very cold: endothermic.', 'बेरियम हाइड्रॉक्साइड और अमोनियम क्लोराइड के रिएक्शन में उल्टा होता है: क्रिस्टल तोड़ने में जितनी एनर्जी लगती है, उतनी वापस नहीं मिलती, इसलिए आसपास से गर्मी खिंच जाती है और सब बहुत ठंडा हो जाता है: यह एंडोथर्मिक (ऊष्माशोषी) है।', 'Barium hydroxide aur ammonium chloride ke reaction mein ulta hota hai: crystals todne mein jitni energy lagti hai, utni wapas nahi milti, isliye aas-paas se garmi khinch jaati hai aur sab bahut thanda ho jaata hai: ye endothermic hai.')); V.temp = 0.4; await W2(V, 8);
};
SCRIPTS.cu_oxid = async (V) => {
  const cu = V.metalSurface('Cu', 8, -0.03); const o2 = V.spawn('O2', 5, -BX, BX, 0.05, BY, { label: true });
  V.caption(L3('Copper atoms on the surface of the powder, and oxygen molecules (O₂) from the air.', 'पाउडर की सतह पर कॉपर के एटम, और हवा के ऑक्सीजन मॉलिक्यूल (O₂)।', 'Powder ki surface par copper ke atoms, aur hawa ke oxygen molecules (O₂).')); await W2(V, 4); V.heat(0.8);
  V.caption(L3('On heating, oxygen joins copper: black copper(II) oxide (CuO) forms on the surface. Copper is oxidised (it gains oxygen).', 'गरम करने पर ऑक्सीजन कॉपर से जुड़ जाती है: सतह पर काला कॉपर(II) ऑक्साइड (CuO) बनता है। कॉपर का ऑक्सीकरण होता है (उसे ऑक्सीजन मिलती है)।', 'Garam karne par oxygen copper se jud jaati hai: surface par kaala copper(II) oxide (CuO) banta hai. Copper oxidise hota hai (use oxygen milti hai).'));
  const top = cu.slice(8); const oxs = [];
  for (let k = 0; k < Math.min(5, o2.length); k++) { const m = top[k + 1]; const o = o2[k]; o.mode = 'held'; o.labelIt(null); o.go(m.g.position.x, m.g.position.y + 0.025, 0.14); await W2(V, 0.9); V.remove(o); const P = m.g.position.clone(); V.remove(m); oxs.push(V.add('CuO', P.x, P.y, { mode: 'fixed', col: '#2a2726', label: k === 0 })); }
  await W2(V, 1.5); const h2 = V.spawn('H2', 6, -BX, BX, 0.05, BY, { label: true });
  V.caption(L3('Now hot copper oxide meets hydrogen (H₂). Hydrogen takes the oxygen away to make water: copper oxide is reduced back to copper, and hydrogen is oxidised.', 'अब गरम कॉपर ऑक्साइड हाइड्रोजन (H₂) से मिलता है। हाइड्रोजन उसकी ऑक्सीजन छीनकर पानी बना लेती है: कॉपर ऑक्साइड का अपचयन होकर वापस कॉपर बन जाता है, और हाइड्रोजन का ऑक्सीकरण होता है।', 'Ab garam copper oxide hydrogen (H₂) se milta hai. Hydrogen uski oxygen chheenkar paani bana leti hai: copper oxide reduce hokar wapas copper ban jaata hai, aur hydrogen oxidise hoti hai.'));
  for (let k = 0; k < oxs.length; k++) { const c = oxs[k]; const h = V.nearestFree(h2, c.g.position); if (!h) break; h.mode = 'held'; h.go(c.g.position.x, c.g.position.y + 0.02, 0.14); await W2(V, 0.9); const P = c.g.position.clone(); V.remove(h); V.remove(c); V.add('Cu', P.x, P.y, { mode: 'fixed', label: k === 0 }); const w = V.add('H2O', P.x, P.y + 0.025, { label: k === 0 }); w.mode = 'rise'; w.riseV = 0.04; }
  await W2(V, 2); V.heat(0); await W2(V, 4);
};
SCRIPTS.cuo_hcl = async (V) => {
  const ox = []; for (let i = 0; i < 6; i++) ox.push(V.add('CuO', -0.12 + (i % 3) * 0.06, -BY + 0.02 + Math.floor(i / 3) * 0.03, { mode: 'fixed', col: '#2a2726', label: i === 4 })); const hs = V.spawn('H+', 12, -BX, BX, -0.02, BY, { label: true }); V.spawn('Cl-', 12, -BX, BX, -0.02, BY, { label: true });
  V.caption(L3('Black copper oxide (CuO) at the bottom; the acid brings H⁺ and Cl⁻ ions.', 'नीचे काला कॉपर ऑक्साइड (CuO); एसिड H⁺ और Cl⁻ आयन लाता है।', 'Neeche kaala copper oxide (CuO); acid H⁺ aur Cl⁻ ions laata hai.')); await W2(V, 4.5);
  V.caption(L3('Two H⁺ ions take the oxygen of CuO to form water, and the copper goes into the solution as blue Cu²⁺ ions — just as a base would react.', 'दो H⁺ आयन CuO की ऑक्सीजन लेकर पानी बनाते हैं, और कॉपर नीले Cu²⁺ आयन बनकर घोल में चला जाता है — ठीक वैसे ही, जैसे कोई बेस रिएक्शन करता।', 'Do H⁺ ions CuO ki oxygen lekar paani banate hain, aur copper blue Cu²⁺ ions bankar solution mein chala jaata hai — bilkul waise hi, jaise koi base react karta.'));
  for (let k = 0; k < ox.length; k++) { const c = ox[k]; const a = V.nearestFree(hs, c.g.position); if (!a) break; a.mode = 'held'; const b = V.nearestFree(hs, c.g.position); if (b) b.mode = 'held'; a.go(c.g.position.x - 0.01, c.g.position.y + 0.02, 0.14); b && b.go(c.g.position.x + 0.01, c.g.position.y + 0.02, 0.14); await W2(V, 1); const P = c.g.position.clone(); V.remove(a); b && V.remove(b); V.remove(c); const cu = V.add('Cu2+', P.x, P.y + 0.01, { label: k === 0 }); cu.vel.set(rnd(-0.02, 0.02), 0.03, 0); V.add('H2O', P.x + 0.02, P.y + 0.02, { label: k === 0 }); }
  V.caption(L3('Cu²⁺ and Cl⁻ ions in water: copper(II) chloride solution, blue-green. A metal oxide + an acid → a salt + water.', 'पानी में Cu²⁺ और Cl⁻ आयन: यानी कॉपर(II) क्लोराइड का घोल, नीला-हरा। धातु ऑक्साइड + एसिड → लवण + पानी।', 'Paani mein Cu²⁺ aur Cl⁻ ions: yaani copper(II) chloride solution, blue-green. Metal oxide + acid → salt + paani.')); await W2(V, 7);
};
SCRIPTS.dry_hcl = async (V) => {
  const hcl = V.spawn('HCl', 8, -BX, -0.02, -BY, BY, { label: true, side: -1 }); const wl = wall(V, 0, 0.004, 2 * BY, '#8892a0'); void wl;
  V.caption(L3('Left: dry hydrogen chloride gas. HCl molecules stay whole; there are no H⁺ ions, so dry litmus does not change.', 'बाएँ: सूखी हाइड्रोजन क्लोराइड गैस। HCl मॉलिक्यूल पूरे के पूरे रहते हैं; कोई H⁺ आयन नहीं बनता, इसलिए सूखा लिटमस नहीं बदलता।', 'Left: sookhi hydrogen chloride gas. HCl molecules poore ke poore rehte hain; koi H⁺ ion nahi banta, isliye sookha litmus nahi badalta.')); await W2(V, 5);
  const w = V.spawn('H2O', 8, 0.02, BX, -BY, BY, { label: true, side: 1 }); const g2 = []; for (let k = 0; k < 5; k++) { const h = V.add('HCl', 0.1, BY - 0.02, { side: 1, label: k === 0 }); g2.push(h); }
  V.caption(L3('Right: HCl meets water (moist paper). Each HCl gives its H⁺ to a water molecule: H₃O⁺ and Cl⁻ ions form. Now it behaves as an acid and turns blue litmus red.', 'दाएँ: HCl पानी (गीले कागज़) से मिलती है। हर HCl अपना H⁺ पानी के एक मॉलिक्यूल को दे देता है: H₃O⁺ और Cl⁻ आयन बनते हैं। अब यह एसिड की तरह काम करती है और नीले लिटमस को लाल कर देती है।', 'Right: HCl paani (geele kaagaz) se milti hai. Har HCl apna H⁺ paani ke ek molecule ko de deta hai: H₃O⁺ aur Cl⁻ ions bante hain. Ab ye acid ki tarah kaam karti hai aur blue litmus ko red kar deti hai.'));
  await W2(V, 1.5);
  for (let k = 0; k < g2.length; k++) { const h = g2[k]; const m = V.nearestFree(w, h.g.position); if (!m) break; m.mode = 'held'; h.mode = 'held'; h.go(m.g.position.x, m.g.position.y, 0.14); await W2(V, 1); const P = m.g.position.clone(); V.remove(m); V.remove(h); V.add('H3O+', P.x, P.y, { label: k === 0, side: 1 }); V.add('Cl-', P.x + 0.02, P.y, { label: k === 0, side: 1 }); }
  void hcl; await W2(V, 6);
};
SCRIPTS.metals_air = SCRIPTS.mg_burn;
SCRIPTS.cbse_hcl_naoh = SCRIPTS.zn_acid;
async function metalWater(V, o) { // a reactive metal gives electrons to water: H₂ forms and the solution becomes basic (OH⁻)
  const surf = V.metalSurface(o.metal, 7); const w = V.spawn(o.liquid, 16, -BX, BX, -0.06, BY, { label: true });
  V.caption(o.c1); await W2(V, 4.5); V.caption(o.c2); const top = surf.slice(7);
  for (let k = 0; k < (o.rounds || 4); k++) {
    const m = top[(k * 2 + 1) % top.length]; if (!m || m.mode !== 'fixed') continue; const a = V.nearestFree(w, m.g.position); if (!a) break; a.mode = 'held'; const b = V.nearestFree(w, m.g.position); if (!b) break; b.mode = 'held';
    const mp = m.g.position.clone(); a.go(mp.x - 0.014, mp.y + 0.024, 0.1); b.go(mp.x + 0.014, mp.y + 0.024, 0.1); await W2(V, o.slow ? 2.2 : 1.2);
    const h2 = V.add('H2', mp.x, mp.y + 0.03, { label: k === 0 }); h2.mode = 'rise'; h2.riseV = o.slow ? 0.03 : 0.06; V.remove(a); V.remove(b);
    for (const dx of [-0.014, 0.014]) { const q = V.add(o.anion, mp.x + dx, mp.y + 0.02, { label: k === 0 && dx < 0 }); q.vel.set(rnd(-0.02, 0.02), 0.02, 0); }
    m.labelIt(null); V.remove(m); const ion = V.add(o.ion, mp.x, mp.y + 0.006, { label: k === 0 }); ion.vel.set(rnd(-0.02, 0.02), 0.03, 0); if (o.heat) V.heat(Math.min(1, (k + 1) * 0.25)); await W2(V, 0.8);
  }
  await W2(V, 1.5); V.heat(0); V.caption(o.c3); await W2(V, 7);
}
SCRIPTS.metals_water = (V) => metalWater(V, { metal: 'Na', liquid: 'H2O', anion: 'OH-', ion: 'Na+', heat: true, rounds: 5,
  c1: L3('Sodium atoms and water molecules.', 'सोडियम के एटम और पानी के मॉलिक्यूल।', 'Sodium ke atoms aur paani ke molecules.'),
  c2: L3('Each sodium atom gives an electron to water: water splits into hydrogen (H₂ gas) and OH⁻ ions, and sodium becomes Na⁺. A lot of heat is released.', 'सोडियम का हर एटम पानी को एक इलेक्ट्रॉन देता है: पानी टूटकर हाइड्रोजन (H₂ गैस) और OH⁻ आयन बनाता है, और सोडियम Na⁺ बन जाता है। बहुत गर्मी निकलती है।', 'Sodium ka har atom paani ko ek electron deta hai: paani tootkar hydrogen (H₂ gas) aur OH⁻ ions banata hai, aur sodium Na⁺ ban jaata hai. Bahut garmi nikalti hai.'),
  c3: L3('Na⁺ and OH⁻ ions make sodium hydroxide, a base: that is why phenolphthalein turns pink. Calcium and magnesium do the same, but more slowly; aluminium, zinc and iron need steam.', 'Na⁺ और OH⁻ आयन मिलकर सोडियम हाइड्रॉक्साइड बनाते हैं, जो एक बेस है: इसीलिए फ़िनॉल्फ़्थेलिन गुलाबी हो जाता है। कैल्शियम और मैग्नीशियम भी यही करते हैं, पर धीरे; एल्युमिनियम, ज़िंक और आयरन को भाप चाहिए।', 'Na⁺ aur OH⁻ ions milkar sodium hydroxide banate hain, jo ek base hai: isiliye phenolphthalein pink ho jaata hai. Calcium aur magnesium bhi yahi karte hain, par dheere; aluminium, zinc aur iron ko steam chahiye.') });
SCRIPTS.na_ethanol = (V) => metalWater(V, { metal: 'Na', liquid: 'alc', anion: 'EtO', ion: 'Na+', slow: true, rounds: 3,
  c1: L3('Sodium atoms and ethanol molecules (C₂H₅OH).', 'सोडियम के एटम और एथेनॉल के मॉलिक्यूल (C₂H₅OH)।', 'Sodium ke atoms aur ethanol ke molecules (C₂H₅OH).'),
  c2: L3('Sodium takes the place of the hydrogen of the –OH group. The hydrogen atoms pair up as H₂ gas, but more slowly and gently than with water.', 'सोडियम –OH ग्रुप के हाइड्रोजन की जगह ले लेता है। हाइड्रोजन एटम जोड़ी बनाकर H₂ गैस बनते हैं, पर पानी के मुकाबले धीरे और आराम से।', 'Sodium –OH group ke hydrogen ki jagah le leta hai. Hydrogen atoms jodi banakar H₂ gas bante hain, par paani ke muqaable dheere aur aaraam se.'),
  c3: L3('The product is sodium ethoxide (C₂H₅O⁻ Na⁺) and hydrogen: 2Na + 2C₂H₅OH → 2C₂H₅ONa + H₂.', 'जो बनता है वह सोडियम एथॉक्साइड (C₂H₅O⁻ Na⁺) और हाइड्रोजन है: 2Na + 2C₂H₅OH → 2C₂H₅ONa + H₂।', 'Jo banta hai woh sodium ethoxide (C₂H₅O⁻ Na⁺) aur hydrogen hai: 2Na + 2C₂H₅OH → 2C₂H₅ONa + H₂.') });
SCRIPTS.carbon_burn = async (V) => {
  const al = V.spawn('alc', 3, -BX, -0.03, -BY, 0, { label: true, side: -1 }); const o2a = V.spawn('O2', 9, -BX, -0.03, -BY, BY, { label: true, side: -1 }); wall(V, 0, 0.004, 2 * BY, '#8892a0');
  const np = V.spawn('naph', 2, 0.03, BX, -BY, 0, { label: true, side: 1 }); const o2b = V.spawn('O2', 4, 0.03, BX, -BY, BY, { label: true, side: 1 });
  V.caption(L3('Left: alcohol with plenty of oxygen. Right: naphthalene, which has many carbon atoms, with only a little oxygen.', 'बाएँ: भरपूर ऑक्सीजन के साथ अल्कोहल। दाएँ: नैफ़्थलीन, जिसमें बहुत सारे कार्बन एटम हैं, और ऑक्सीजन थोड़ी-सी।', 'Left: bharpoor oxygen ke saath alcohol. Right: naphthalene, jismein bahut saare carbon atoms hain, aur oxygen thodi-si.')); await W2(V, 5); V.heat(0.8);
  V.caption(L3('With enough oxygen, every carbon becomes CO₂ and every hydrogen becomes H₂O: complete burning, a clean blue flame. With too little oxygen, some carbon is left as soot and glows yellow.', 'ऑक्सीजन पूरी हो तो हर कार्बन CO₂ और हर हाइड्रोजन H₂O बन जाता है: यानी पूरा जलना, साफ़ नीली लौ। ऑक्सीजन कम हो तो कुछ कार्बन कालिख बनकर बच जाता है और पीला चमकता है।', 'Oxygen poori ho to har carbon CO₂ aur har hydrogen H₂O ban jaata hai: yaani poora jalna, saaf blue flame. Oxygen kam ho to kuch carbon kaalikh (soot) bankar bach jaata hai aur yellow chamakta hai.'));
  for (let k = 0; k < al.length; k++) { const a = al[k]; const P = a.g.position.clone(); a.labelIt(null); V.remove(a); for (let n = 0; n < 3; n++) { const o = V.nearestFree(o2a, P); if (o) V.remove(o); } for (let n = 0; n < 2; n++) { const c = V.add('CO2', P.x + rnd(-0.02, 0.02), P.y + 0.02, { label: k === 0 && n === 0, side: -1 }); c.mode = 'rise'; c.riseV = 0.05; } const w = V.add('H2O', P.x, P.y + 0.03, { label: k === 0, side: -1 }); w.mode = 'rise'; w.riseV = 0.05; await W2(V, 0.9); }
  for (let k = 0; k < np.length; k++) { const a = np[k]; const P = a.g.position.clone(); a.labelIt(null); V.remove(a); for (let n = 0; n < 2; n++) { const o = V.nearestFree(o2b, P); if (o) V.remove(o); } const c = V.add('CO2', P.x, P.y + 0.02, { side: 1 }); c.mode = 'rise'; c.riseV = 0.05; for (let n = 0; n < 4; n++) { const sc = V.add('C', P.x + rnd(-0.02, 0.02), P.y + rnd(0, 0.02), { side: 1, label: k === 0 && n === 0, col: '#141414' }); sc.mode = 'rise'; sc.riseV = 0.03; } await W2(V, 0.9); }
  await W2(V, 2); V.heat(0); V.caption(L3('The black specks of unburnt carbon are the soot on the plate. The same happens in a Bunsen burner when its air hole is closed.', 'बिना जले कार्बन के काले कण ही प्लेट पर जमी कालिख हैं। बुनसेन बर्नर का हवा वाला छेद बंद हो, तो उसमें भी यही होता है।', 'Bina jale carbon ke kaale kan hi plate par jami kaalikh hain. Bunsen burner ka air hole band ho, to usmein bhi yahi hota hai.')); await W2(V, 7);
};
SCRIPTS.ethanol_kmno4 = async (V) => {
  const al = V.spawn('alc', 5, -BX, BX, -BY, BY, { label: true }); V.spawn('OH-', 5, -BX, BX, -BY, BY, { label: true });
  V.caption(L3('Warm ethanol molecules. Each drop of alkaline permanganate brings purple MnO₄⁻ ions.', 'गरम एथेनॉल के मॉलिक्यूल। एल्कलाइन (क्षारीय) परमैंगनेट की हर बूँद बैंगनी MnO₄⁻ आयन लाती है।', 'Garam ethanol ke molecules. Alkaline permanganate ki har boond purple MnO₄⁻ ions laati hai.')); await W2(V, 4.5);
  V.caption(L3('MnO₄⁻ gives oxygen to ethanol, which becomes ethanoic acid. The permanganate turns into brown MnO₂, so its purple colour disappears.', 'MnO₄⁻ एथेनॉल को ऑक्सीजन देता है, और एथेनॉल एथेनॉइक एसिड बन जाता है। परमैंगनेट भूरे MnO₂ में बदल जाता है, इसलिए बैंगनी रंग गायब हो जाता है।', 'MnO₄⁻ ethanol ko oxygen deta hai, aur ethanol ethanoic acid ban jaata hai. Permanganate brown MnO₂ mein badal jaata hai, isliye purple rang gaayab ho jaata hai.'));
  for (let k = 0; k < al.length + 2; k++) {
    const m = V.add('MnO4-', rnd(-0.1, 0.1), BY - 0.01, { label: k === 0 }); await W2(V, 0.6); const a = al[k];
    if (!a || a.mode !== 'free') { await W2(V, 1); continue; }
    a.mode = 'held'; m.mode = 'held'; m.go(a.g.position.x, a.g.position.y + 0.015, 0.16); await W2(V, 1); const P = a.g.position.clone(); V.remove(a); V.remove(m); V.add('AcOH', P.x, P.y, { label: k === 0 }); const d = V.add('MnO2', P.x + 0.02, P.y, { label: k === 0 }); d.mode = 'held'; d.go(P.x + 0.02, -BY + 0.012, 0.05);
  }
  V.caption(L3('When no ethanol is left, the next MnO₄⁻ ions stay unchanged and the liquid stays purple.', 'जब एथेनॉल बचता ही नहीं, तो आगे आने वाले MnO₄⁻ आयन वैसे ही रहते हैं और घोल बैंगनी बना रहता है।', 'Jab ethanol bachta hi nahi, to aage aane wale MnO₄⁻ ions waise hi rehte hain aur solution purple bana rehta hai.')); await W2(V, 7);
};
SCRIPTS.ethanoic_props = async (V) => {
  const wl = wall(V, 0, 0.004, 2 * BY, '#8892a0'); void wl; V.spawn('AcOH', 8, -BX, -0.03, -BY, BY, { label: true, side: -1 }); for (let i = 0; i < 2; i++) { V.add('CH3COO', rnd(-0.18, -0.06), rnd(-0.1, 0.1), { label: i === 0, side: -1 }); V.add('H+', rnd(-0.18, -0.06), rnd(-0.1, 0.1), { label: i === 0, side: -1 }); }
  V.spawn('H+', 8, 0.03, BX, -BY, BY, { label: true, side: 1 }); V.spawn('Cl-', 8, 0.03, BX, -BY, BY, { label: true, side: 1 });
  V.caption(L3('Left: ethanoic acid in water. Most molecules stay whole; only a few give an H⁺ ion. Right: hydrochloric acid of the same strength — every HCl has given its H⁺.', 'बाएँ: पानी में एथेनॉइक एसिड। ज़्यादातर मॉलिक्यूल पूरे रहते हैं; बस कुछ ही H⁺ आयन देते हैं। दाएँ: उतनी ही ताक़त का हाइड्रोक्लोरिक एसिड — हर HCl ने अपना H⁺ दे दिया है।', 'Left: paani mein ethanoic acid. Zyaadatar molecules poore rehte hain; bas kuch hi H⁺ ion dete hain. Right: utni hi strength ka hydrochloric acid — har HCl ne apna H⁺ de diya hai.')); await W2(V, 8);
  V.caption(L3('Fewer H⁺ ions means a higher pH (about 3 instead of 1): ethanoic acid is a weak acid, HCl is a strong acid. Both still react with carbonates to give carbon dioxide.', 'H⁺ आयन कम, तो pH ज़्यादा (1 की जगह लगभग 3): एथेनॉइक एसिड वीक एसिड है, HCl स्ट्रॉन्ग एसिड है। फिर भी दोनों कार्बोनेट से रिएक्शन करके कार्बन डाइऑक्साइड देते हैं।', 'H⁺ ions kam, to pH zyada (1 ki jagah lagbhag 3): ethanoic acid weak acid hai, HCl strong acid hai. Phir bhi dono carbonates se react karke carbon dioxide dete hain.')); await W2(V, 8);
};
SCRIPTS.esterification = async (V) => {
  const al = V.spawn('alc', 5, -BX, BX, -BY, BY, { label: true }); const ac = V.spawn('AcOH', 5, -BX, BX, -BY, BY, { label: true }); V.spawn('H+', 2, -BX, BX, -BY, BY, { label: true });
  V.caption(L3('Ethanol and ethanoic acid molecules, with a little sulphuric acid (H⁺) as a catalyst.', 'एथेनॉल और एथेनॉइक एसिड के मॉलिक्यूल, साथ में कैटलिस्ट (उत्प्रेरक) के रूप में थोड़ा सल्फ़्यूरिक एसिड (H⁺)।', 'Ethanol aur ethanoic acid ke molecules, saath mein catalyst ke roop mein thoda sulphuric acid (H⁺).')); await W2(V, 4.5); V.heat(0.5);
  V.caption(L3('On warming, the –OH of the acid and the H of the alcohol leave together as water, and the two pieces join: an ester, ethyl ethanoate, which smells sweet.', 'गरम करने पर एसिड का –OH और अल्कोहल का H मिलकर पानी बनकर निकल जाते हैं, और बचे दोनों टुकड़े जुड़ जाते हैं: एक एस्टर बनता है, एथिल एथेनोएट, जिसकी गंध मीठी होती है।', 'Garam karne par acid ka –OH aur alcohol ka H milkar paani bankar nikal jaate hain, aur bache dono tukde jud jaate hain: ek ester banta hai, ethyl ethanoate, jiski gandh meethi hoti hai.'));
  for (let k = 0; k < 4; k++) { const a = al[k], b = V.nearestFree(ac, a.g.position); if (!b) break; a.mode = 'held'; b.mode = 'held'; b.go(a.g.position.x + 0.02, a.g.position.y, 0.14); await W2(V, 1.1); const P = a.g.position.clone(); V.remove(a); V.remove(b); V.add('ester', P.x, P.y, { label: k === 0 }); V.add('H2O', P.x + 0.03, P.y + 0.02, { label: k === 0 }); }
  await W2(V, 2); V.heat(0); V.caption(L3('The reaction does not go to completion: some acid and alcohol remain. The H⁺ catalyst is not used up.', 'रिएक्शन पूरा नहीं होता: कुछ एसिड और अल्कोहल बचे रहते हैं। कैटलिस्ट H⁺ ख़र्च नहीं होता।', 'Reaction poora nahi hota: kuch acid aur alcohol bache rehte hain. Catalyst H⁺ kharch nahi hota.')); await W2(V, 6);
};
SCRIPTS.soap_micelle = async (V) => {
  V.spawn('H2O', 12, -BX, BX, -BY, BY, {}); const oil = V.add('oil', 0, 0, { mode: 'held' }); oil.g.scale.multiplyScalar(2.2); const so = V.spawn('soapA', 10, -BX, BX, -BY, BY, { label: true });
  V.caption(L3('A soap molecule has a long hydrocarbon tail that likes oil and an ionic head (–COO⁻) that likes water. In the middle is a drop of oil.', 'साबुन के मॉलिक्यूल की एक लंबी हाइड्रोकार्बन पूँछ होती है, जिसे तेल पसंद है, और एक आयनिक सिर (–COO⁻), जिसे पानी पसंद है। बीच में तेल की एक बूँद है।', 'Saabun ke molecule ki ek lambi hydrocarbon poonch hoti hai, jise tel pasand hai, aur ek ionic sir (–COO⁻), jise paani pasand hai. Beech mein tel ki ek boond hai.')); await W2(V, 5);
  V.caption(L3('The tails dig into the oil and the heads stay outside in the water: a micelle. The oil drop is now held in the water and can be washed away.', 'पूँछें तेल में घुस जाती हैं और सिर बाहर पानी में रहते हैं: इसे मिसेल कहते हैं। अब तेल की बूँद पानी में पकड़ी रहती है और धुलकर निकल सकती है।', 'Poonchein tel mein ghus jaati hain aur sir bahar paani mein rehte hain: ise micelle kehte hain. Ab tel ki boond paani mein pakdi rehti hai aur dhulkar nikal sakti hai.'));
  so.forEach((p, i) => { const a = (i / so.length) * Math.PI * 2; p.mode = 'held'; p.go(Math.cos(a) * 0.05, Math.sin(a) * 0.05, 0.08); p.onArrive = () => { p.g.rotation.z = a; }; }); await W2(V, 8);
};
SCRIPTS.soap_hard = (V) => precipitate(V, {
  cat: 'Ca2+', catPartner: 'Cl-', an: 'soapA', anPartner: 'Na+', nc: 4, ratio: 2, solidCol: '#efece4', prodLabel: '(C₁₇H₃₅COO)₂Ca',
  c1: L3('Hard water has Ca²⁺ (and Mg²⁺) ions. Soap gives long stearate ions (C₁₇H₃₅COO⁻) and Na⁺.', 'हार्ड वॉटर (कठोर जल) में Ca²⁺ (और Mg²⁺) आयन होते हैं। साबुन से लंबे स्टीयरेट आयन (C₁₇H₃₅COO⁻) और Na⁺ मिलते हैं।', 'Hard water mein Ca²⁺ (aur Mg²⁺) ions hote hain. Saabun se lambe stearate ions (C₁₇H₃₅COO⁻) aur Na⁺ milte hain.'),
  c2: L3('Each Ca²⁺ grabs two stearate ions.', 'हर Ca²⁺ दो स्टीयरेट आयनों को पकड़ लेता है।', 'Har Ca²⁺ do stearate ions ko pakad leta hai.'),
  c3: L3('They form an insoluble calcium soap: the white, curdy scum. The soap used up this way cannot make lather. Detergent ions do not form such a solid.', 'ये मिलकर न घुलने वाला कैल्शियम साबुन बनाते हैं: सफ़ेद, दही जैसा मैल। इस तरह ख़र्च हुआ साबुन झाग नहीं बना पाता। डिटर्जेंट के आयन ऐसा ठोस नहीं बनाते।', 'Ye milkar insoluble calcium saabun banate hain: safed, dahi jaisa mail (scum). Is tarah kharch hua saabun jhaag nahi bana paata. Detergent ke ions aisa solid nahi banate.') });
SCRIPTS.co2_prep = (V) => co2Lime(V, { carb: 'CO32-', c1: L3('Marble is calcium carbonate: CO₃²⁻ ions (with Ca²⁺). The acid gives H⁺ ions, which attack the carbonate.', 'संगमरमर कैल्शियम कार्बोनेट है: CO₃²⁻ आयन (Ca²⁺ के साथ)। एसिड से H⁺ आयन मिलते हैं, जो कार्बोनेट पर टूट पड़ते हैं।', 'Marble calcium carbonate hai: CO₃²⁻ ions (Ca²⁺ ke saath). Acid se H⁺ ions milte hain, jo carbonate par toot padte hain.'), c2: limeC2, c3: limeC3 });
SCRIPTS.saponification = async (V) => {
  const fats = []; for (let i = 0; i < 3; i++) { const g = V.add('glyc', -0.12 + i * 0.12, 0, { mode: 'fixed', col: '#f1e3a0', label: i === 1 }); const t = []; for (let j = 0; j < 3; j++) { const q = V.add('soapA', g.g.position.x + 0.03, g.g.position.y - 0.02 + j * 0.02, { col: '#f1e3a0' }); q.mode = 'held'; V.bond(g, q, 0.035, -0.02 + j * 0.02); t.push(q); } fats.push({ g, t }); }
  const ohs = V.spawn('OH-', 9, -BX, BX, -BY, -0.06, { label: true }); V.spawn('Na+', 9, -BX, BX, -BY, -0.06, { label: true });
  V.caption(L3('A fat (oil) molecule: three long fatty-acid chains joined to glycerol. The alkali gives Na⁺ and OH⁻ ions.', 'फ़ैट (तेल) का मॉलिक्यूल: ग्लिसरॉल से जुड़ी तीन लंबी फ़ैटी-एसिड चेन। एल्कली (क्षार) से Na⁺ और OH⁻ आयन मिलते हैं।', 'Fat (tel) ka molecule: glycerol se judi teen lambi fatty-acid chains. Alkali se Na⁺ aur OH⁻ ions milte hain.')); await W2(V, 5); V.heat(0.5);
  V.caption(L3('OH⁻ ions cut each chain off the glycerol. The chains become soap ions (they pair with Na⁺); the glycerol is set free.', 'OH⁻ आयन हर चेन को ग्लिसरॉल से काट देते हैं। चेनें साबुन के आयन बन जाती हैं (Na⁺ के साथ जोड़ी बनाकर); ग्लिसरॉल अलग होकर आज़ाद हो जाता है।', 'OH⁻ ions har chain ko glycerol se kaat dete hain. Chains saabun ke ions ban jaati hain (Na⁺ ke saath jodi banakar); glycerol alag hokar free ho jaata hai.'));
  for (const f of fats) { for (const q of f.t) { const o = V.nearestFree(ohs, q.g.position); if (o) { o.mode = 'held'; o.go(q.g.position.x, q.g.position.y, 0.16); await W2(V, 0.5); V.remove(o); } q.follow = null; q.mode = 'free'; q.recolor('#f4ead2'); } f.g.mode = 'free'; f.g.recolor('#cfe6f5'); await W2(V, 0.6); }
  await W2(V, 2); V.heat(0); V.caption(L3('Soap (sodium salts of fatty acids) + glycerol. Adding common salt makes the soap come out as a solid.', 'साबुन (फ़ैटी एसिड के सोडियम लवण) + ग्लिसरॉल। साधारण नमक डालने पर साबुन ठोस बनकर अलग हो जाता है।', 'Saabun (fatty acids ke sodium salts) + glycerol. Namak daalne par saabun solid bankar alag ho jaata hai.')); await W2(V, 7);
};
SCRIPTS.soda_id = decompose({ unit: 'NaHCO3', unitCol: '#f6f6f2', gases: [['CO2', 1], ['H2O', 1]], solidCol: '#ffffff', solidLabel: 'Na₂CO₃',
  c1: L3('Baking soda is sodium hydrogencarbonate, NaHCO₃.', 'बेकिंग सोडा (खाने का सोडा) सोडियम हाइड्रोजनकार्बोनेट, NaHCO₃ है।', 'Baking soda sodium hydrogencarbonate, NaHCO₃ hai.'),
  c2: L3('On heating it breaks up: carbon dioxide and water vapour come out (that is why it makes cakes rise).', 'गरम करने पर यह टूट जाता है: कार्बन डाइऑक्साइड और पानी की भाप निकलती है (इसीलिए केक फूलता है)।', 'Garam karne par ye toot jaata hai: carbon dioxide aur paani ki bhaap nikalti hai (isiliye cake phoolta hai).'),
  c3: L3('Sodium carbonate is left. Washing soda (Na₂CO₃) itself does not break up on a burner flame, so it gives no CO₂: that is how the two are told apart.', 'सोडियम कार्बोनेट बच जाता है। वॉशिंग सोडा (Na₂CO₃) ख़ुद बर्नर की लौ पर नहीं टूटता, इसलिए CO₂ नहीं देता: इसी से दोनों की पहचान होती है।', 'Sodium carbonate bach jaata hai. Washing soda (Na₂CO₃) khud burner ki flame par nahi toot-ta, isliye CO₂ nahi deta: isi se dono ki pehchaan hoti hai.') });

export const HAS_PARTICLES = (id) => !!SCRIPTS[id];
