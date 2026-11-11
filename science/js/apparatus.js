// Lab apparatus built from real dimensions (metres). Vessels know their inside shape, so a volume of liquid
// gives the right height, the surface stays level when tilted, and liquid pours out over the lowest point of the rim.
import * as THREE from 'three';
import { model } from './models.js';
import { glassMat, liquidMat, labelTex, woodTex, canvasTex, shade, crispText } from './mats.js';

const V2 = (r, y) => new THREE.Vector2(r, y);
const SEG = 40;
const tmpV = new THREE.Vector3(), tmpQ = new THREE.Quaternion();
const UP = new THREE.Vector3(0, 1, 0);

let NEXT = 1;
export class Item {
  constructor(kind, o = {}) {
    this.id = o.id || kind + (NEXT++);
    this.kind = kind; this.g = new THREE.Group(); this.g.userData.item = this;
    this.name = o.name || { en: kind, hi: kind, hg: kind };
    this.grabY = o.grabY ?? 0.05; // where a hand holds it (local y)
    this.base = 0; // local y of the bottom (rests on surfaces)
    this.height = o.height ?? 0.1;
    this.radius = o.radius ?? 0.03;
    this.held = null; this.slot = null;
  }
  get pos() { return this.g.position; }
  worldUp() { return UP.clone().applyQuaternion(this.g.getWorldQuaternion(tmpQ)); }
  update() {}
  hitMeshes() { const a = []; this.g.traverse((o) => { if (o.isMesh && !o.userData.noHit) a.push(o); }); return a; }
}

// ------------------------------------------------------------------ vessels
export class Vessel extends Item {
  // outer: array of [r, y] from the bottom centre up to the rim; wall: glass thickness
  constructor(kind, outer, o = {}) {
    super(kind, o);
    this.wall = o.wall ?? 0.0012;
    this.outer = outer.map(([r, y]) => V2(r, y));
    const inner = outer.map(([r, y], i) => V2(Math.max(0, r - this.wall), i === 0 ? y + this.wall : Math.max(y, this.wall)));
    this.inner = inner;
    this.rimY = outer[outer.length - 1][1]; this.rimR = outer[outer.length - 1][0];
    this.height = this.rimY; this.radius = Math.max(...outer.map((p) => p[0]));
    this.cap = o.cap ?? null; // ml
    // volume table: local height -> ml
    this.tab = []; let v = 0; const N = 240;
    for (let i = 0; i <= N; i++) {
      const y = (this.rimY * i) / N; const r = this.rInner(y);
      if (i > 0) v += Math.PI * r * r * (this.rimY / N) * 1e6;
      this.tab.push([y, v]);
    }
    this.maxMl = v;
    // glass
    const gm = o.glassMat || glassMat(o.glass);
    this.glass = new THREE.Mesh(new THREE.LatheGeometry(this.outer, SEG), gm);
    this.glass.renderOrder = 6; this.g.add(this.glass);
    if (!o.noRim) {
      const rim = new THREE.Mesh(new THREE.TorusGeometry(this.rimR - this.wall * 0.3, this.wall * 0.9, 8, SEG), glassMat({ opacity: 0.45, edge: 0.9 }));
      rim.rotation.x = Math.PI / 2; rim.position.y = this.rimY; rim.renderOrder = 6; this.g.add(rim);
    }
    // liquid
    const lg = new THREE.LatheGeometry([V2(0, inner[0].y), ...inner], SEG);
    this.liqMat = liquidMat(); this.liq = new THREE.Mesh(lg, this.liqMat); this.liq.renderOrder = 4; this.liq.visible = false;
    this.liq.userData.noHit = true; this.g.add(this.liq);
    this.ml = 0; this.color = new THREE.Color(0x9fc6ff); this.alpha = 0.5;
    this.wob = new THREE.Vector2(); this.wobV = new THREE.Vector2(); this.lastP = new THREE.Vector3(); this.lastV = new THREE.Vector3();
    this.mix = null; // set by the chemistry engine
    this.solids = []; // items lying inside
  }
  rInner(y) { const p = this.inner; for (let i = 1; i < p.length; i++) if (y <= p[i].y) { const a = p[i - 1], b = p[i]; const t = (y - a.y) / Math.max(1e-6, b.y - a.y); return a.x + (b.x - a.x) * Math.min(1, Math.max(0, t)); } return p[p.length - 1].x; }
  heightFor(ml) { const t = this.tab; if (ml <= 0) return 0; for (let i = 1; i < t.length; i++) if (t[i][1] >= ml) { const a = t[i - 1], b = t[i]; return a[0] + (b[0] - a[0]) * (ml - a[1]) / Math.max(1e-9, b[1] - a[1]); } return this.rimY; }
  mouthWorld(out = new THREE.Vector3()) { return this.g.localToWorld(out.set(0, this.rimY, 0)); }
  // lowest point of the rim in world space (where liquid leaves when tilted)
  lipLow(out = new THREE.Vector3()) {
    let best = null;
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2; tmpV.set(Math.cos(a) * this.rimR, this.rimY, Math.sin(a) * this.rimR); this.g.localToWorld(tmpV);
      if (!best || tmpV.y < best.y) { best = tmpV.clone(); }
    }
    return out.copy(best);
  }
  levelWorld() { return this.g.localToWorld(tmpV.set(0, this.heightFor(this.ml), 0)).y; }
  update(dt) {
    const L = this.liq;
    L.visible = this.ml > 0.02;
    if (!L.visible) return;
    const u = this.liqMat.userData.u;
    this.g.updateWorldMatrix(true, false);
    const p = this.g.getWorldPosition(tmpV);
    // simple slosh: acceleration in the floor plane tips the surface, then it rings down
    const v = p.clone().sub(this.lastP).divideScalar(Math.max(dt, 1e-3)); const acc = v.clone().sub(this.lastV);
    this.lastP.copy(p); this.lastV.copy(v);
    this.wobV.x += (-acc.x * 0.012 - this.wob.x * 60 * dt) ; this.wobV.y += (-acc.z * 0.012 - this.wob.y * 60 * dt);
    this.wobV.multiplyScalar(Math.exp(-3.2 * dt)); this.wob.addScaledVector(this.wobV, dt * 6);
    this.wob.clampLength(0, 0.35);
    u.uLevel.value = this.levelWorld(); u.uWob.value.copy(this.wob); u.uCen.value.copy(p);
    this.liqMat.color.copy(this.color); u.uSurf.value.copy(this.color).lerp(new THREE.Color(1, 1, 1), 0.25); u.uAlpha.value = this.alpha;
    // ripples while liquid pours in, while stirring or when the vessel is moved; streaks while something dissolves
    this._ripT = Math.max(0, (this._ripT || 0) - dt); this._disT = Math.max(0, (this._disT || 0) - dt);
    u.uRip.value = Math.min(1, this.wob.length() * 4 + (this.stirT > 0 ? 0.7 : 0) + this._ripT * 1.6); u.uBot.value = this.inner[0].y;
    u.uSwirl.value += ((this._disT > 0 ? 1 : 0) - u.uSwirl.value) * Math.min(1, dt * 1.2);
  }
}

// profiles ----------------------------------------------------------
function roundBottom(r, h, lip = 0.0009) {
  const p = [];
  for (let i = 0; i <= 8; i++) { const a = (i / 8) * Math.PI / 2; p.push([Math.sin(a) * r, r - Math.cos(a) * r]); }
  p.push([r, h - 0.004], [r + lip, h]);
  return p;
}
export function testTube(o = {}) { // 18 x 150 mm
  const r = o.r ?? 0.009, h = o.h ?? 0.15;
  const v = new Vessel('testtube', roundBottom(r, h), { ...o, name: o.name || { en: 'Test tube', hi: 'टेस्ट ट्यूब', hg: 'Test tube' }, cap: 25 });
  v.grabY = h * 0.78; return v;
}
export function boilingTube(o = {}) { return testTube({ r: 0.0125, h: 0.15, name: { en: 'Boiling tube', hi: 'बॉयलिंग ट्यूब', hg: 'Boiling tube' }, ...o }); }

// printed volume scale on the glass: white enamel marks with a thin dark edge, so they read against clear liquid,
// the white wall tiles and the dark bench alike. Marks sit at the real height of each volume (heightFor), face the
// student, and are sized in millimetres so the numbers stay readable in the headset.
//   o.right: the scale ends at this angle (rad, 0 = straight at the student) · o.start: or begins here · o.center: or is centred here
//   o.every: a number on every n-th mark · o.textMm / o.tickMm: sizes · o.r: radius of the glass surface
function addGrad(v, maxMl, step, label, o = {}) {
  const n = Math.round(maxMl / step); const every = o.every ?? (n <= 6 ? 1 : 2);
  const ys = []; for (let i = 1; i <= n; i++) ys.push(v.heightFor(i * step));
  const textMm = o.textMm ?? 4, tickMm = o.tickMm ?? 5, mm = 0.001;
  const y0 = Math.max(0.0008, ys[0] - 0.004), y1 = Math.min(v.rimY - 0.0015, ys[n - 1] + (label ? textMm * 2.6 : textMm * 0.9) * mm);
  const Hm = y1 - y0, Hc = 1024, pxm = Hc / Hm, px = (d) => d * mm * pxm; // millimetres -> canvas pixels
  const font = (k = 1) => `700 ${Math.round(px(textMm) * k)}px "Noto Sans", sans-serif`;
  const meas = document.createElement('canvas').getContext('2d'); meas.font = font();
  let tw = 0; for (let i = every; i <= n; i += every) tw = Math.max(tw, meas.measureText(String(+(i * step).toFixed(2))).width);
  if (label) { meas.font = font(0.8); tw = Math.max(tw, meas.measureText(label).width - px(tickMm + 1)); }
  const W = Math.ceil(px(1) + px(tickMm) + px(1) + tw + px(1.2));
  const r = o.r ?? (v.rInner((y0 + y1) / 2) + v.wall + 0.00035);
  const len = W / pxm / r;
  const a0 = o.start ?? (o.center != null ? o.center - len / 2 : (o.right ?? -0.1) - len);
  const tex = canvasTex(W, Hc, (x, w, h) => {
    x.clearRect(0, 0, w, h); x.lineJoin = 'round'; x.textBaseline = 'middle';
    const dark = 'rgba(16,24,32,0.78)', white = '#ffffff', ow = px(0.32), lw = px(0.42), xl = px(1);
    const Y = (y) => h - (y - y0) * pxm;
    const marks = ys.map((y, k) => ({ y: Y(y), major: (k + 1) % every === 0, t: String(+((k + 1) * step).toFixed(2)) }));
    for (const pass of [0, 1]) { // dark outline first, then the white marks on top
      x.strokeStyle = pass ? white : dark; x.fillStyle = white;
      for (const m of marks) {
        x.lineWidth = pass ? lw : lw + ow * 2; x.beginPath(); x.moveTo(xl, m.y); x.lineTo(xl + px(m.major ? tickMm : tickMm * 0.55), m.y); x.stroke();
        if (!m.major) continue; x.font = font();
        if (pass) x.fillText(m.t, xl + px(tickMm + 1), m.y); else { x.lineWidth = ow * 2; x.strokeText(m.t, xl + px(tickMm + 1), m.y); }
      }
      if (label) { x.font = font(0.8); const ly = marks[n - 1].y - px(textMm * 1.6); if (pass) x.fillText(label, xl, ly); else { x.lineWidth = ow * 2; x.strokeText(label, xl, ly); } }
    }
  });
  tex.anisotropy = 16;
  const mat = crispText(new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }), -0.6);
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, Hm, 32, 1, true, a0, len), mat);
  m.position.y = (y0 + y1) / 2; m.renderOrder = 7; m.userData.noHit = true; v.g.add(m);
  v.grad = { a0, a1: a0 + len, mesh: m }; return m;
}
export function beaker(ml = 100, o = {}) {
  const S = { 50: [0.021, 0.06], 100: [0.025, 0.07], 250: [0.0345, 0.095], 500: [0.043, 0.12] }[ml];
  const [r, h] = S;
  const prof = [[0, 0], [r - 0.003, 0], [r, 0.003], [r, h - 0.003], [r + 0.0018, h]];
  const v = new Vessel('beaker', prof, { ...o, name: o.name || { en: `Beaker (${ml} mL)`, hi: `बीकर (${ml} mL)`, hg: `Beaker (${ml} mL)` }, cap: ml });
  addGrad(v, ml * 0.9, ml / 10, `${ml} mL`); v.grabY = h * 0.5; return v;
}
export function conicalFlask(ml = 100, o = {}) {
  const k = ml === 250 ? 1.32 : 1;
  const prof = [[0, 0], [0.03 * k, 0], [0.032 * k, 0.004 * k], [0.0125 * k, 0.07 * k], [0.011 * k, 0.074 * k], [0.011 * k, 0.1 * k], [0.0128 * k, 0.103 * k]];
  const v = new Vessel('flask', prof, { ...o, name: o.name || { en: 'Conical flask', hi: 'कोनिकल फ़्लास्क', hg: 'Conical flask' }, cap: ml });
  v.grabY = 0.085 * k; return v;
}
export function measuringCylinder(ml = 10, o = {}) {
  const [r, h] = ml === 10 ? [0.0072, 0.115] : [0.012, 0.17];
  const prof = [[0, 0.006], [r, 0.006], [r, h - 0.002], [r + 0.002, h]];
  const v = new Vessel('cylinder', prof, { ...o, name: o.name || { en: `Measuring cylinder (${ml} mL)`, hi: `मेज़रिंग सिलिंडर (${ml} mL)`, hg: `Measuring cylinder (${ml} mL)` }, cap: ml });
  const base = new THREE.Mesh(new THREE.CylinderGeometry(r * 2.4, r * 2.6, 0.006, 6), glassMat({ opacity: 0.25 })); base.position.y = 0.003; base.renderOrder = 6; v.g.add(base);
  addGrad(v, ml, ml / 10, null, { center: 0, textMm: 2.6, tickMm: 3, every: ml === 10 ? 1 : 2 }); v.grabY = h * 0.6; return v;
}
export function chinaDish(o = {}) {
  const prof = []; for (let i = 0; i <= 10; i++) { const a = (i / 10) * 1.2; prof.push([Math.sin(a) * 0.05, 0.05 - Math.cos(a) * 0.05 + 0.002]); }
  const v = new Vessel('dish', prof, { ...o, wall: 0.002, noRim: true, name: o.name || { en: 'China dish', hi: 'चाइना डिश', hg: 'China dish' },
    glassMat: new THREE.MeshStandardMaterial({ color: 0xf4f2ec, roughness: 0.35, side: THREE.DoubleSide }) });
  v.glass.renderOrder = 0; v.grabY = 0.02; return v;
}
export function watchGlass(o = {}) {
  const prof = []; for (let i = 0; i <= 8; i++) { const a = (i / 8) * 0.5; prof.push([Math.sin(a) * 0.08, 0.08 - Math.cos(a) * 0.08 + 0.001]); }
  const v = new Vessel('watchglass', prof, { ...o, wall: 0.0012, noRim: true, name: o.name || { en: 'Watch glass', hi: 'वॉच ग्लास', hg: 'Watch glass' } });
  v.grabY = 0.008; return v;
}

// reagent bottle with label (and a liquid inside that matches the reagent)
export function reagentBottle(label, o = {}) {
  const amber = !!o.amber;
  const prof = [[0, 0], [0.026, 0], [0.028, 0.004], [0.028, 0.07], [0.022, 0.082], [0.012, 0.09], [0.0105, 0.092], [0.0105, 0.104], [0.012, 0.106]];
  const v = new Vessel('bottle', prof, { ...o, wall: 0.0018, name: o.name || { en: label.name, hi: label.name, hg: label.name },
    glass: { color: amber ? 0x9a5a1e : 0xffffff, opacity: amber ? 0.45 : 0.12, edge: amber ? 0.92 : 0.8 }, cap: 125 });
  // the label covers only part of the round bottle (turned a little to the left), so the liquid shows beside it,
  // with a printed mL scale on the glass to its right: the student can read how much is left
  const tex = labelTex([{ t: label.formula, size: 96 }, { t: label.name, size: 48, w: 600 }, ...(label.extra ? [{ t: label.extra, size: 36, w: 400, c: '#6b5a40' }] : [])], { band: label.band ?? '#2c5d8a', hazard: label.hazard, h: 456, wrap: true });
  const lab = new THREE.Mesh(new THREE.CylinderGeometry(0.0284, 0.0284, 0.038, 32, 1, true, -1.16, 1.5), crispText(new THREE.MeshStandardMaterial({ map: tex, roughness: 0.7 })));
  lab.position.y = 0.038; v.g.add(lab); // label faces the student (+z)
  addGrad(v, 120, 10, null, { start: 0.4, r: 0.02835, every: 2, textMm: 4.6, tickMm: 4 });
  // ground-glass stopper
  const st = new THREE.Group();
  const s1 = new THREE.Mesh(new THREE.CylinderGeometry(0.0108, 0.0095, 0.016, 24), glassMat({ opacity: 0.35, color: amber ? 0x9a5a1e : 0xffffff }));
  const s2 = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.008, 24), glassMat({ opacity: 0.35, color: amber ? 0x9a5a1e : 0xffffff }));
  s1.position.y = 0.002; s2.position.y = 0.013; s1.renderOrder = s2.renderOrder = 7; st.add(s1, s2); st.position.y = 0.104;
  v.stopper = st; v.g.add(st); v.grabY = 0.05; return v;
}
// dropper bottle (indicators)
export function dropperBottle(label, o = {}) {
  const prof = [[0, 0], [0.017, 0], [0.018, 0.003], [0.018, 0.05], [0.009, 0.058], [0.0075, 0.06], [0.0075, 0.068]];
  const v = new Vessel('dropbottle', prof, { ...o, wall: 0.0015, name: o.name || { en: label.name, hi: label.name, hg: label.name }, glass: { color: 0x7a4a1c, opacity: 0.5, edge: 0.95 }, cap: 30 });
  const tex = labelTex([{ t: label.formula, size: 70 }, { t: label.name, size: 40, w: 600 }], { band: label.band ?? '#7a3a8a' });
  const lab = new THREE.Mesh(new THREE.CylinderGeometry(0.0183, 0.0183, 0.028, 32, 1, true, -1.2, 2.4), crispText(new THREE.MeshStandardMaterial({ map: tex, roughness: 0.7 })));
  lab.position.y = 0.025; v.g.add(lab);
  const drop = new THREE.Group();
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.0085, 16, 12), new THREE.MeshStandardMaterial({ color: 0x1b1b1b, roughness: 0.6 })); bulb.scale.y = 1.6; bulb.position.y = 0.022;
  const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.0095, 0.0095, 0.008, 20), new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.5 })); collar.position.y = 0.004;
  drop.add(bulb, collar); drop.position.y = 0.068; v.g.add(drop); v.dropper = drop; v.grabY = 0.03; return v;
}

// ------------------------------------------------------------------ holders and heaters
export function rack(n = 6, o = {}) {
  const it = new Item('rack', { ...o, name: { en: 'Test tube rack', hi: 'टेस्ट ट्यूब स्टैंड', hg: 'Test tube stand' } });
  const w = 0.04 * n + 0.03, d = 0.075, mat = new THREE.MeshStandardMaterial({ map: woodTex('#a0703f'), roughness: 0.65 });
  const box = (sx, sy, sz, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; it.g.add(m); return m; };
  box(w, 0.012, d, 0, 0.006, 0); box(0.012, 0.11, d, -w / 2 + 0.006, 0.055, 0); box(0.012, 0.11, d, w / 2 - 0.006, 0.055, 0);
  box(w, 0.006, 0.012, 0, 0.03, -0.03); // back rail only: the tube bottoms stay in view
  // top shelf: a wooden plank with real round holes cut through it; each tube passes through a hole and stands on the base
  const HR = 0.0128; const xs = []; for (let i = 0; i < n; i++) xs.push(-w / 2 + 0.03 + i * 0.04);
  const sh = new THREE.Shape(); sh.moveTo(-w / 2, -d / 2); sh.lineTo(w / 2, -d / 2); sh.lineTo(w / 2, d / 2); sh.lineTo(-w / 2, d / 2); sh.lineTo(-w / 2, -d / 2);
  for (const x of xs) { const h = new THREE.Path(); h.absarc(x, 0, HR, 0, Math.PI * 2, true); sh.holes.push(h); }
  const T = 0.01, bev = 0.0008; const geo = new THREE.ExtrudeGeometry(sh, { depth: T - 2 * bev, bevelEnabled: true, bevelThickness: bev, bevelSize: bev * 0.8, bevelSegments: 2, curveSegments: 40 });
  geo.rotateX(-Math.PI / 2); // the shape lies flat (x, z); the thickness goes up
  const pa = geo.attributes.position, uv = geo.attributes.uv; for (let i = 0; i < pa.count; i++) uv.setXY(i, (pa.getX(i) + w / 2) / w, (pa.getZ(i) + d / 2) / d + pa.getY(i) * 6); // wood grain spread over the whole plank
  const top = new THREE.Mesh(geo, mat); top.position.y = 0.095 + bev; top.castShadow = top.receiveShadow = true; it.g.add(top);
  it.slots = xs.map((x) => new THREE.Vector3(x, 0.012, 0));
  it.height = 0.11; it.radius = w / 2; return it;
}
export function flame(kind = 'spirit') {
  // two nested cones with a soft shader: blue base, yellow tip for a spirit lamp; blue cone for a Bunsen burner
  const g = new THREE.Group();
  const mk = (h, r, c1, c2, op) => {
    const geo = new THREE.ConeGeometry(r, h, 24, 12, true); geo.translate(0, h / 2, 0);
    const m = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      uniforms: { t: { value: 0 }, c1: { value: new THREE.Color(c1) }, c2: { value: new THREE.Color(c2) }, op: { value: op }, h: { value: h } },
      vertexShader: `uniform float t; uniform float h; varying float vy; varying vec3 vn; varying vec3 vv;
        void main(){ vec3 p = position; vy = p.y / h; float s = sin(t*17.0 + p.y*90.0)*0.0012 + sin(t*9.0)*0.0008; p.x += s*vy*vy*3.0; p.z += cos(t*13.0+p.y*70.0)*0.0009*vy*vy*3.0;
        vec4 mv = modelViewMatrix*vec4(p,1.0); vn = normalize(normalMatrix*normal); vv = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }`,
      fragmentShader: `uniform vec3 c1; uniform vec3 c2; uniform float op; varying float vy; varying vec3 vn; varying vec3 vv;
        void main(){ float rim = abs(dot(vn, vv)); float a = op * smoothstep(0.0,0.12,vy) * (1.0 - smoothstep(0.65,1.0,vy)) * (0.35 + 0.65*rim);
        gl_FragColor = vec4(mix(c1, c2, smoothstep(0.15,0.75,vy)), a); }` });
    const mesh = new THREE.Mesh(geo, m); mesh.userData.noHit = true; mesh.renderOrder = 9; g.add(mesh); return m;
  };
  const mats = kind === 'bunsen'
    ? [mk(0.07, 0.011, 0x2a52ff, 0x5a7cff, 0.55), mk(0.028, 0.006, 0x5fc8ff, 0x9fe4ff, 0.9)]
    : [mk(0.05, 0.0075, 0x3a5cff, 0xffb347, 0.75), mk(0.022, 0.004, 0x7fb8ff, 0xffe9a8, 0.8)];
  const light = new THREE.PointLight(kind === 'bunsen' ? 0x8aa8ff : 0xffb060, 0.016, 0.5, 2); light.position.y = 0.03; g.add(light);
  g.userData.tick = (t) => { mats.forEach((m) => { m.uniforms.t.value = t; }); light.intensity = 0.015 + Math.sin(t * 23) * 0.002; };
  g.userData.light = light;
  return g;
}
export function spiritLamp(o = {}) {
  const it = new Item('lamp', { ...o, name: { en: 'Spirit lamp', hi: 'स्पिरिट लैंप', hg: 'Spirit lamp' } });
  const body = new THREE.Mesh(new THREE.LatheGeometry([V2(0, 0), V2(0.036, 0), V2(0.04, 0.012), V2(0.038, 0.035), V2(0.016, 0.055), V2(0.012, 0.06)], 32), glassMat({ opacity: 0.18 }));
  body.renderOrder = 6; it.g.add(body);
  const spirit = new THREE.Mesh(new THREE.CylinderGeometry(0.034, 0.037, 0.022, 32), new THREE.MeshStandardMaterial({ color: 0xa8d8ff, transparent: true, opacity: 0.35, roughness: 0.1 }));
  spirit.position.y = 0.013; spirit.renderOrder = 5; it.g.add(spirit);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.012, 0.014, 20), new THREE.MeshStandardMaterial({ color: 0xb8b8b8, metalness: 0.9, roughness: 0.3 }));
  cap.position.y = 0.066; it.g.add(cap);
  const wick = new THREE.Mesh(new THREE.CylinderGeometry(0.0028, 0.0028, 0.01, 10), new THREE.MeshStandardMaterial({ color: 0x2b2420, roughness: 1 }));
  wick.position.y = 0.077; it.g.add(wick);
  const f = flame('spirit'); f.position.y = 0.08; f.visible = false; it.g.add(f); it.flame = f; it.flameTop = 0.08 + 0.045;
  it.heatPoint = new THREE.Vector3(0, 0.08 + 0.03, 0); it.height = 0.08; it.radius = 0.04; it.grabY = 0.03;
  it.lit = false; it.setLit = (on) => { it.lit = on; f.visible = on; };
  it.update = (dt, t) => { if (f.visible) f.userData.tick(t); };
  return it;
}
export function bunsen(o = {}) {
  const it = new Item('bunsen', { ...o, name: { en: 'Bunsen burner', hi: 'बुन्सन बर्नर', hg: 'Bunsen burner' } });
  let top = 0.132; const real = model('bunsen_burner'); // the real scanned-style model when it has loaded
  if (real) { real.traverse((o) => { if (o.name === 'burner_stand') o.visible = false; }); it.g.add(real); top = 0.172; } // our own tripod is used instead of the model's ring stand
  else {
    const metal = new THREE.MeshStandardMaterial({ color: 0x9aa0a6, metalness: 0.85, roughness: 0.32 });
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.045, 0.012, 32), new THREE.MeshStandardMaterial({ color: 0x1f2a36, metalness: 0.3, roughness: 0.6 }));
    base.position.y = 0.006; it.g.add(base);
    const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.0062, 0.0062, 0.12, 20), metal); tube.position.y = 0.072; it.g.add(tube);
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.0082, 0.0082, 0.018, 20), metal); col.position.y = 0.03; it.g.add(col);
    const inlet = new THREE.Mesh(new THREE.CylinderGeometry(0.0035, 0.0035, 0.04, 12), metal); inlet.rotation.z = Math.PI / 2; inlet.position.set(0.026, 0.02, 0); it.g.add(inlet);
  }
  const f = flame('bunsen'); f.position.y = top; f.visible = false; it.g.add(f); it.flame = f;
  it.heatPoint = new THREE.Vector3(0, top + 0.045, 0); it.height = top; it.radius = real ? 0.07 : 0.045; it.grabY = 0.08;
  it.lit = false; it.setLit = (on) => { it.lit = on; f.visible = on; };
  it.update = (dt, t) => { if (f.visible) f.userData.tick(t); };
  return it;
}
export function tripod(o = {}) {
  const it = new Item('tripod', { ...o, name: { en: 'Tripod stand with wire gauze', hi: 'ट्राइपॉड स्टैंड और जाली', hg: 'Tripod stand + wire gauze' } });
  const metal = new THREE.MeshStandardMaterial({ color: 0x2c2f33, metalness: 0.7, roughness: 0.45 });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.0035, 8, 32), metal); ring.rotation.x = Math.PI / 2; ring.position.y = 0.2; it.g.add(ring);
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.205, 8), metal);
    leg.position.set(Math.cos(a) * 0.055, 0.1, Math.sin(a) * 0.055); leg.rotation.set(Math.sin(a) * 0.06, 0, -Math.cos(a) * 0.06); it.g.add(leg);
  }
  const gtex = canvasTex(256, 256, (x, w, h) => {
    x.clearRect(0, 0, w, h); x.strokeStyle = '#8b8f94'; x.lineWidth = 2;
    for (let i = 0; i < w; i += 8) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, h); x.stroke(); x.beginPath(); x.moveTo(0, i); x.lineTo(w, i); x.stroke(); }
    const g = x.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, 70); g.addColorStop(0, 'rgba(235,235,230,1)'); g.addColorStop(1, 'rgba(235,235,230,0)');
    x.fillStyle = g; x.fillRect(0, 0, w, h);
  });
  const gauze = new THREE.Mesh(new THREE.PlaneGeometry(0.13, 0.13), new THREE.MeshStandardMaterial({ map: gtex, transparent: true, alphaTest: 0.2, side: THREE.DoubleSide, metalness: 0.5, roughness: 0.6 }));
  gauze.rotation.x = -Math.PI / 2; gauze.position.y = 0.2045; it.g.add(gauze);
  it.top = 0.205; it.height = 0.205; it.radius = 0.07; it.grabY = 0.1; return it;
}
export function holder(o = {}) { // wooden test-tube holder
  const it = new Item('holder', { ...o, name: { en: 'Test tube holder', hi: 'टेस्ट ट्यूब होल्डर', hg: 'Test tube holder' } });
  const wood = new THREE.MeshStandardMaterial({ map: woodTex('#b98a55'), roughness: 0.6 });
  const metal = new THREE.MeshStandardMaterial({ color: 0xb0b4b8, metalness: 0.9, roughness: 0.3 });
  const handle = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.012, 0.13), wood); handle.position.z = 0.09; it.g.add(handle);
  const wire = new THREE.Mesh(new THREE.TorusGeometry(0.012, 0.0016, 6, 20, Math.PI * 1.6), metal); wire.rotation.x = Math.PI / 2; it.g.add(wire);
  const arm = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.004, 0.03), metal); arm.position.z = 0.02; it.g.add(arm);
  it.height = 0.012; it.radius = 0.08; it.grabY = 0; return it;
}

// ------------------------------------------------------------------ small things
export function strip(color, o = {}) { // litmus / pH paper
  const it = new Item('strip', o);
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.95, side: THREE.DoubleSide });
  const m = new THREE.Mesh(new THREE.BoxGeometry(0.009, 0.06, 0.0006), mat); m.position.y = 0.03; it.g.add(m);
  it.mat = mat; it.base = 0; it.height = 0.06; it.radius = 0.006; it.grabY = 0.055;
  // the wet part changes colour: a second mesh on the lower 40 %
  const wet = new THREE.Mesh(new THREE.BoxGeometry(0.0092, 0.024, 0.0007), new THREE.MeshStandardMaterial({ color, roughness: 0.8, side: THREE.DoubleSide }));
  wet.position.y = 0.012; wet.visible = false; it.g.add(wet); it.wet = wet;
  return it;
}
// safety matches: take a match from the box, strike it on the brown side of the box, light the lamp with it
export function matchbox(o = {}) {
  const it = new Item('matchbox', { ...o, name: { en: 'Matchbox', hi: 'माचिस', hg: 'Maachis' } });
  const W = 0.052, H = 0.016, D = 0.036;
  const top = canvasTex(256, 180, (x, w, h) => { x.fillStyle = '#d23b2a'; x.fillRect(0, 0, w, h); x.fillStyle = '#f6e7c8'; x.fillRect(10, 10, w - 20, h - 20); x.fillStyle = '#d23b2a'; x.font = 'bold 34px sans-serif'; x.textAlign = 'center'; x.fillText('SAFETY', w / 2, 72); x.fillText('MATCHES', w / 2, 116); x.font = '18px sans-serif'; x.fillStyle = '#5a3a2a'; x.fillText('strike on box', w / 2, 152); });
  const side = new THREE.MeshStandardMaterial({ color: 0x5a3322, roughness: 0.95 }); const end = new THREE.MeshStandardMaterial({ color: 0xd23b2a, roughness: 0.7 }); const lid = new THREE.MeshStandardMaterial({ map: top, roughness: 0.7 });
  const box = new THREE.Mesh(new THREE.BoxGeometry(W, H, D), [side, side, lid, end, side, side]); // brown striking strips on every narrow side box.position.y = H / 2; box.castShadow = true; it.g.add(box);
  it.height = H; it.radius = 0.03; it.grabY = H * 0.5; it.strikeY = H * 0.5; it.strikeZ = D / 2; return it;
}
export function matchstick(o = {}) {
  const it = new Item('match', { ...o, name: { en: 'Matchstick', hi: 'माचिस की तीली', hg: 'Maachis ki teeli' } });
  const m = new THREE.Mesh(new THREE.BoxGeometry(0.0022, 0.045, 0.0022), new THREE.MeshStandardMaterial({ map: woodTex('#e2c48e'), roughness: 0.8 })); m.position.y = 0.0225; it.g.add(m);
  const headM = new THREE.MeshStandardMaterial({ color: 0xb3261e, roughness: 0.7 }); const head = new THREE.Mesh(new THREE.SphereGeometry(0.0023, 8, 6), headM); head.scale.y = 1.5; head.position.y = 0.046; it.g.add(head);
  const f = flame('spirit'); f.scale.setScalar(0.3); f.position.y = 0.047; f.visible = false; it.g.add(f); it.flame = f;
  it.height = 0.047; it.radius = 0.003; it.grabY = 0.012; it.tipLocal = new THREE.Vector3(0, 0.048, 0); it.burnT = 0;
  it.setFlame = (on) => { it.burning = on; f.visible = on; if (on) headM.color.setHex(0x2a1a12); };
  it.update = (dt, t) => { if (!f.visible) return; f.userData.tick(t); it.burnT += dt; if (it.burnT > 25) { it.setFlame(false); it.spent = true; m.material.color.setHex(0x3a2a20); } }; // a match burns for about 25 seconds
  return it;
}
export function splint(o = {}) {
  const it = new Item('splint', { ...o, name: { en: 'Wooden splint', hi: 'लकड़ी की तीली', hg: 'Wooden splint' } });
  const m = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.15, 0.004), new THREE.MeshStandardMaterial({ map: woodTex('#d9b98a'), roughness: 0.8 }));
  m.position.y = 0.075; it.g.add(m);
  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.003, 8, 6), new THREE.MeshStandardMaterial({ color: 0x2a1a10, emissive: 0xff5a10, emissiveIntensity: 0 }));
  tip.position.y = 0.151; it.g.add(tip); it.tip = tip;
  const f = flame('spirit'); f.scale.setScalar(0.45); f.position.y = 0.152; f.visible = false; it.g.add(f); it.flame = f;
  it.height = 0.15; it.radius = 0.004; it.grabY = 0.03; it.tipLocal = new THREE.Vector3(0, 0.152, 0);
  it.setFlame = (on) => { it.burning = on; f.visible = on; tip.material.emissiveIntensity = on ? 0 : 0; };
  it.setGlow = (on) => { it.glowing = on; tip.material.emissiveIntensity = on ? 1.6 : 0; };
  it.update = (dt, t) => { if (f.visible) f.userData.tick(t); };
  return it;
}
export function nail(o = {}) {
  const it = new Item('nail', { ...o, name: { en: 'Iron nail', hi: 'लोहे की कील', hg: 'Lohe ki keel' } });
  const mat = new THREE.MeshStandardMaterial({ color: 0x8d9196, metalness: 0.9, roughness: 0.35 });
  const s = new THREE.Mesh(new THREE.CylinderGeometry(0.0017, 0.0017, 0.05, 12), mat); s.position.y = 0.025; it.g.add(s);
  const pt = new THREE.Mesh(new THREE.ConeGeometry(0.0017, 0.006, 12), mat); pt.rotation.x = Math.PI; pt.position.y = -0.003; it.g.add(pt);
  const hd = new THREE.Mesh(new THREE.CylinderGeometry(0.0042, 0.0042, 0.0015, 16), mat); hd.position.y = 0.0505; it.g.add(hd);
  it.mat = mat; it.height = 0.05; it.radius = 0.004; it.grabY = 0.045; return it;
}
// real surface detail taken from photographs of each chemical (tex/<name>.jpg, a grey detail map; the colour comes from mat.color)
const TEXL = new THREE.TextureLoader(); const TEXC = new Map();
export function realTex(name) {
  if (!name) return null;
  if (!TEXC.has(name)) { const t = TEXL.load(`tex/${name}.jpg`); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; TEXC.set(name, t); }
  return TEXC.get(name);
}
// an irregular lump: an icosphere pushed in and out by smooth noise (same noise for shared corners, so no cracks)
const LUMPS = [];
function lumpGeo(k, shape) {
  const key = shape + k; if (LUMPS[key]) return LUMPS[key];
  let g;
  if (shape === 'pellet') { g = new THREE.SphereGeometry(0.0032, 14, 10); g.scale(1, 0.62, 1); }
  else {
    g = new THREE.IcosahedronGeometry(0.0032, shape === 'chip' ? 1 : 2); const p = g.attributes.position; const v = new THREE.Vector3();
    const a = 1.7 + k * 0.37, b = 2.3 + k * 0.53, c = 1.3 + k * 0.71;
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i); const n = Math.sin(v.x * 900 * a + k) * Math.cos(v.y * 800 * b) + Math.sin(v.z * 1000 * c + v.x * 400);
      const f = 1 + (shape === 'chip' ? 0.32 : 0.2) * n; v.multiplyScalar(f); if (shape === 'chip') v.y *= 0.6; p.setXYZ(i, v.x, v.y, v.z);
    }
    g.computeVertexNormals();
  }
  LUMPS[key] = g; return g;
}
export function granules(color = 0x9ea3a8, o = {}) { // a few lumps of metal or solid (o.tex: real photo detail; o.shape: lump / pellet / chip)
  const it = new Item('granules', o);
  const map = realTex(o.tex);
  const mat = new THREE.MeshStandardMaterial({ color, metalness: o.metal ?? 0.7, roughness: o.rough ?? 0.45, map, bumpMap: map, bumpScale: map ? 0.6 : 0 });
  for (let i = 0; i < (o.n ?? 6); i++) {
    const m = new THREE.Mesh(lumpGeo(i % 5, o.shape || 'lump'), mat); m.position.set((Math.random() - 0.5) * 0.008, 0.003 + Math.random() * 0.004, (Math.random() - 0.5) * 0.008);
    m.rotation.set(o.shape === 'pellet' ? 0 : Math.random() * 3, Math.random() * 3, 0); m.scale.setScalar(0.7 + Math.random() * 0.6); m.castShadow = true; it.g.add(m);
  }
  it.mat = mat; it.height = 0.01; it.radius = 0.008; it.grabY = 0.005; return it;
}
// a small heap of powder (salt, sugar, baking soda …) with the grain of the real powder, plus a few loose grains
export function heap(color, o = {}) {
  const it = new Item('heap', o);
  const map = realTex(o.tex);
  const mat = new THREE.MeshStandardMaterial({ color, roughness: o.rough ?? 0.92, metalness: 0, map, bumpMap: map, bumpScale: map ? 0.8 : 0 });
  const R = o.r ?? 0.011, Hh = o.h ?? 0.0068; const pts = [];
  for (let i = 0; i <= 12; i++) { const t = i / 12; pts.push(V2(Math.max(0.00001, R * (1 - t)), Hh * Math.pow(1 - (1 - t) * (1 - t), 0.75))); } // dome: from the rim up to the top
  const g = new THREE.LatheGeometry(pts, 36); const p = g.attributes.position; const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); const ang = Math.atan2(v.z, v.x); const k = 1 + 0.12 * Math.sin(ang * 3 + 1) + 0.07 * Math.sin(ang * 7); v.x *= k; v.z *= k; v.y *= 1 + 0.15 * Math.sin(ang * 2 + 2); p.setXYZ(i, v.x, v.y, v.z); }
  g.computeVertexNormals();
  const uv = g.attributes.uv; for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); uv.setXY(i, 0.5 + v.x / (R * 2.4), 0.5 + v.z / (R * 2.4)); } // photo seen from above
  const m = new THREE.Mesh(g, mat); m.position.y = 0.0006; m.castShadow = true; m.receiveShadow = true; it.g.add(m);
  const gg = new THREE.IcosahedronGeometry(0.0007, 0);
  for (let i = 0; i < (o.loose ?? 10); i++) { const a = Math.random() * 6.28, r = R * (0.9 + Math.random() * 0.45); const q = new THREE.Mesh(gg, mat); q.position.set(Math.cos(a) * r, 0.0007, Math.sin(a) * r); q.rotation.set(Math.random() * 3, Math.random() * 3, 0); it.g.add(q); }
  it.mat = mat; it.height = Hh + 0.001; it.radius = R; it.grabY = 0.003; return it;
}
export function powderHeap(color, o = {}) { // powder in a petri dish with a spatula
  const it = new Item('powder', o);
  const dish = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.012, 32, 1, true), glassMat({ opacity: 0.14 })); dish.position.y = 0.006; dish.renderOrder = 6; it.g.add(dish);
  const base = new THREE.Mesh(new THREE.CircleGeometry(0.035, 32), glassMat({ opacity: 0.18 })); base.rotation.x = -Math.PI / 2; base.position.y = 0.0006; base.renderOrder = 6; it.g.add(base);
  const heap = new THREE.Mesh(new THREE.SphereGeometry(0.02, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color, roughness: 0.95 }));
  heap.scale.y = 0.35; heap.position.y = 0.001; it.g.add(heap); it.heap = heap;
  it.height = 0.012; it.radius = 0.036; it.grabY = 0.006; return it;
}
export function crystals(color, o = {}) { // crystals (e.g. blue copper sulphate) on a watch glass
  const it = new Item('crystals', o);
  const map = realTex(o.tex);
  const mat = new THREE.MeshPhysicalMaterial({ color, roughness: 0.22, transmission: 0, transparent: true, opacity: 0.95, clearcoat: 1, clearcoatRoughness: 0.15, flatShading: true, map, bumpMap: map, bumpScale: map ? 0.5 : 0 });
  for (let i = 0; i < (o.n ?? 14); i++) { // broken crystal pieces with flat faces, like the real crystals
    const m = new THREE.Mesh(lumpGeo(i % 5, 'chip'), mat); m.castShadow = true; const a = Math.random() * 6.28, r = Math.random() * 0.012;
    m.position.set(Math.cos(a) * r, 0.003 + Math.random() * 0.004, Math.sin(a) * r); m.rotation.set(Math.random() * 3, Math.random() * 3, 0);
    m.scale.set(0.8 + Math.random() * 0.6, 0.5 + Math.random() * 0.5, 0.8 + Math.random() * 0.5); it.g.add(m);
  }
  it.mat = mat; it.height = 0.01; it.radius = 0.016; it.grabY = 0.005; return it;
}
export function ribbon(o = {}) { // magnesium ribbon
  const it = new Item('ribbon', { ...o, name: { en: 'Magnesium ribbon', hi: 'मैग्नीशियम रिबन', hg: 'Magnesium ribbon' } });
  const mt = realTex('mg'); const m = new THREE.Mesh(new THREE.BoxGeometry(0.003, 0.07, 0.0004), new THREE.MeshStandardMaterial({ color: 0xc9ccd0, metalness: 0.9, roughness: 0.25, map: mt, bumpMap: mt, bumpScale: mt ? 0.3 : 0 }));
  m.position.y = 0.035; it.g.add(m); it.mat = m.material; it.height = 0.07; it.radius = 0.003; it.grabY = 0.005; return it;
}
export function thermometer(o = {}) {
  const it = new Item('thermo', { ...o, name: { en: 'Thermometer', hi: 'थर्मामीटर', hg: 'Thermometer' } });
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.0035, 0.0035, 0.26, 12), glassMat({ opacity: 0.22 })); tube.position.y = 0.13; tube.renderOrder = 6; it.g.add(tube);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.0042, 12, 10), new THREE.MeshStandardMaterial({ color: 0xc8202a, roughness: 0.3 })); bulb.scale.y = 1.8; bulb.position.y = 0.006; it.g.add(bulb);
  const col = new THREE.Mesh(new THREE.CylinderGeometry(0.0011, 0.0011, 1, 6), new THREE.MeshBasicMaterial({ color: 0xd8242e })); col.position.y = 0.01; it.g.add(col);
  const scale = new THREE.Mesh(new THREE.PlaneGeometry(0.008, 0.22), new THREE.MeshBasicMaterial({ transparent: true, map: canvasTex(64, 1024, (x, w, h) => {
    x.clearRect(0, 0, w, h); x.fillStyle = '#fff'; x.font = '600 22px sans-serif';
    for (let c = 0; c <= 110; c += 2) { const y = h - (c / 110) * h; x.fillRect(0, y, c % 10 === 0 ? 30 : 16, 2); if (c % 20 === 0) x.fillText(String(c), 32, Math.max(14, y + 8)); }
  }) }));
  scale.position.set(0.0045, 0.14, 0); scale.rotation.y = Math.PI / 2; it.g.add(scale);
  it.temp = 27; it.setTemp = (c) => { it.temp = c; const h = 0.012 + (Math.min(110, Math.max(0, c)) / 110) * 0.22; col.scale.y = h; col.position.y = 0.01 + h / 2; };
  it.setTemp(27); it.height = 0.26; it.radius = 0.005; it.grabY = 0.22; return it;
}
export function glassRod(o = {}) {
  const it = new Item('rod', { ...o, name: { en: 'Glass rod', hi: 'काँच की छड़', hg: 'Glass rod' } });
  const m = new THREE.Mesh(new THREE.CylinderGeometry(0.0028, 0.0028, 0.2, 10), glassMat({ opacity: 0.3 })); m.position.y = 0.1; m.renderOrder = 6; it.g.add(m);
  it.height = 0.2; it.radius = 0.003; it.grabY = 0.17; return it;
}
export function spatula(o = {}) {
  const it = new Item('spatula', { ...o, name: { en: 'Spatula', hi: 'स्पैचुला', hg: 'Spatula' } });
  const metal = new THREE.MeshStandardMaterial({ color: 0xc0c4c8, metalness: 0.95, roughness: 0.25 });
  const s = new THREE.Mesh(new THREE.BoxGeometry(0.005, 0.15, 0.0012), metal); s.position.y = 0.075; it.g.add(s);
  const b = new THREE.Mesh(new THREE.BoxGeometry(0.009, 0.022, 0.0012), metal); b.position.y = 0.005; it.g.add(b);
  it.height = 0.15; it.radius = 0.005; it.grabY = 0.13; return it;
}
export function tongs(o = {}) {
  const it = new Item('tongs', { ...o, name: { en: 'Tongs', hi: 'चिमटा', hg: 'Chimta (tongs)' } });
  const metal = new THREE.MeshStandardMaterial({ color: 0xb5b9bd, metalness: 0.9, roughness: 0.3 });
  for (const s of [-1, 1]) { const a = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.2, 0.0025), metal); a.position.set(s * 0.006, 0.1, 0); a.rotation.z = s * 0.04; it.g.add(a); }
  it.height = 0.2; it.radius = 0.01; it.grabY = 0.16; it.tipLocal = new THREE.Vector3(0, 0.002, 0); return it;
}
export function makeColor(c) { return new THREE.Color(c); }
export { shade };

// ------------------------------------------------------------------ batch 2: funnel, torch, straw, chromatography paper, beaker label
export function funnel(o = {}) { // glass funnel (stands upside down over a dish for sublimation); a white deposit can grow inside
  const prof = [[0.004, 0], [0.004, 0.05], [0.006, 0.055], [0.04, 0.095], [0.0412, 0.097]];
  const it = new Item('funnel', { ...o, name: { en: 'Glass funnel', hi: 'काँच की कीप (फ़नल)', hg: 'Glass funnel' } });
  const glass = new THREE.Mesh(new THREE.LatheGeometry(prof.map(([r, y]) => V2(r, y)), SEG), glassMat({ opacity: 0.12 })); glass.renderOrder = 6; it.g.add(glass);
  const dep = new THREE.Mesh(new THREE.LatheGeometry(prof.slice(1).map(([r, y]) => V2(Math.max(0.001, r - 0.0012), y)), SEG), new THREE.MeshStandardMaterial({ color: 0xf8f8f4, roughness: 0.9, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false }));
  dep.renderOrder = 5; dep.userData.noHit = true; it.g.add(dep);
  const cotton = new THREE.Mesh(new THREE.SphereGeometry(0.006, 12, 8), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1 })); cotton.position.y = 0.002; cotton.visible = false; it.g.add(cotton);
  it.cotton = cotton; it.deposit = 0; it.onDeposit = (k) => { dep.material.opacity = Math.min(0.92, k * 1.1); };
  it.height = 0.097; it.radius = 0.041; it.grabY = 0.05; return it;
}
export function torch(o = {}) { // pocket torch / laser: the beam only shows where something scatters the light
  const it = new Item('torch', { ...o, name: { en: 'Torch', hi: 'टॉर्च', hg: 'Torch' } });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.1, 20), new THREE.MeshStandardMaterial({ color: 0x1f2a36, roughness: 0.4, metalness: 0.4 }));
  body.rotation.z = Math.PI / 2; body.position.set(-0.05, 0.012, 0); it.g.add(body);
  const head = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.012, 0.025, 20), new THREE.MeshStandardMaterial({ color: 0x2f3c4a, roughness: 0.35, metalness: 0.5 }));
  head.rotation.z = Math.PI / 2; head.position.set(0.012, 0.012, 0); it.g.add(head);
  const lens = new THREE.Mesh(new THREE.CircleGeometry(0.013, 20), new THREE.MeshBasicMaterial({ color: 0x55515a })); lens.rotation.y = Math.PI / 2; lens.position.set(0.0252, 0.012, 0); it.g.add(lens);
  it.lens = lens; it.on = false;
  it.setOn = (on) => { it.on = on; lens.material.color.setHex(on ? 0xfff6d8 : 0x55515a); };
  it.height = 0.026; it.radius = 0.06; it.grabY = 0.012; it.base = 0; return it;
}
// a beam of light as a soft additive cylinder (one per vessel being lit)
export function beam(len, r, color = 0xffe9b0) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 1.25, len, 20, 1, true), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
  m.rotation.z = Math.PI / 2; m.renderOrder = 9; m.userData.noHit = true; return m;
}
export function straw(o = {}) {
  const it = new Item('straw', { ...o, name: { en: 'Drinking straw', hi: 'स्ट्रॉ', hg: 'Straw' } });
  const m = new THREE.Mesh(new THREE.CylinderGeometry(0.0028, 0.0028, 0.19, 12, 1, true), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5, side: THREE.DoubleSide }));
  m.position.y = 0.095; it.g.add(m);
  const stripe = new THREE.Mesh(new THREE.CylinderGeometry(0.00285, 0.00285, 0.19, 12, 1, true, 0, 0.8), new THREE.MeshStandardMaterial({ color: 0xd8443a, roughness: 0.5 })); stripe.position.y = 0.095; it.g.add(stripe);
  it.height = 0.19; it.radius = 0.003; it.grabY = 0.17; it.tipLocal = new THREE.Vector3(0, 0.002, 0); return it;
}
// filter-paper strip for chromatography: water climbs, and the black ink spot splits into coloured bands
export function chromaStrip(o = {}) {
  const it = new Item('chroma', { ...o, name: { en: 'Filter paper strip with ink spot', hi: 'स्याही के धब्बे वाली फ़िल्टर पेपर की पट्टी', hg: 'Filter paper strip (ink spot)' } });
  const W = 64, H = 384; const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d');
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(0.02, 0.12), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95, side: THREE.DoubleSide })); m.position.y = 0.06; it.g.add(m);
  const clip = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.006, 0.004), new THREE.MeshStandardMaterial({ color: 0x8a8f96, metalness: 0.7, roughness: 0.35 })); clip.position.y = 0.121; it.g.add(clip);
  const dyes = [['#2b4fd8', 0.42], ['#7a2fb0', 0.55], ['#e0347a', 0.72], ['#f2c21a', 0.9]]; // how far each dye travels relative to the water front
  it.progress = 0;
  it.draw = () => {
    const p = it.progress; x.fillStyle = '#f6f4ee'; x.fillRect(0, 0, W, H);
    const spotY = H - 70; const front = H - (30 + p * (H - 60)); // water front climbs from the bottom
    if (p > 0) { const g = x.createLinearGradient(0, H, 0, front); g.addColorStop(0, 'rgba(170,190,205,0.55)'); g.addColorStop(1, 'rgba(190,205,215,0.35)'); x.fillStyle = g; x.fillRect(0, front, W, H - front); }
    x.strokeStyle = 'rgba(120,120,120,0.6)'; x.lineWidth = 1; x.beginPath(); x.moveTo(6, spotY + 14); x.lineTo(W - 6, spotY + 14); x.stroke(); // pencil line
    const climbed = Math.max(0, (spotY - front)); // how far the water has gone past the spot
    if (climbed <= 2) { x.fillStyle = '#1b1b22'; x.beginPath(); x.ellipse(W / 2, spotY, 9, 7, 0, 0, 7); x.fill(); }
    else for (const [col, rf] of dyes) { const y = spotY - climbed * rf; const spread = 6 + climbed * 0.05; x.fillStyle = col; x.globalAlpha = 0.75; x.beginPath(); x.ellipse(W / 2, y, 11, spread, 0, 0, 7); x.fill(); x.globalAlpha = 1; }
    tex.needsUpdate = true;
  };
  it.draw(); it.height = 0.124; it.radius = 0.012; it.grabY = 0.12; return it;
}

// paper sticker texture for vessels (white label, hand-written look)
const STK = new Map();
export function labelSticker(text) {
  if (STK.has(text)) return STK.get(text);
  const t = canvasTex(256, 160, (x, w, h) => {
    x.clearRect(0, 0, w, h); x.fillStyle = '#fbf8ef'; x.beginPath(); x.roundRect(6, 6, w - 12, h - 12, 14); x.fill();
    x.strokeStyle = 'rgba(40,60,120,0.35)'; x.lineWidth = 3; x.stroke();
    x.fillStyle = '#1f3b8a'; x.textAlign = 'center'; x.textBaseline = 'middle';
    const sz = text.length <= 2 ? 104 : text.length <= 6 ? 64 : 40; x.font = `700 ${sz}px "Noto Sans Devanagari", sans-serif`;
    x.fillText(text, w / 2, h / 2 + 4, w - 24);
  });
  STK.set(text, t); return t;
}
