// Particle flows along anatomical centrelines, plus a "hero" tracer that follows a route.
import * as THREE from 'three';

export class PathCurve {
  constructor(flat, radius = 0.002) {
    const n = flat.length / 3;
    this.p = flat instanceof Float32Array ? flat : new Float32Array(flat);
    this.n = n;
    this.s = new Float32Array(n);
    let L = 0;
    for (let i = 1; i < n; i++) {
      const dx = this.p[i * 3] - this.p[i * 3 - 3], dy = this.p[i * 3 + 1] - this.p[i * 3 - 2], dz = this.p[i * 3 + 2] - this.p[i * 3 - 1];
      L += Math.hypot(dx, dy, dz);
      this.s[i] = L;
    }
    this.length = Math.max(L, 1e-6);
    this.radius = radius;
  }
  static fromPoints(arr, radius) {
    const f = [];
    for (const v of arr) f.push(v.x ?? v[0], v.y ?? v[1], v.z ?? v[2]);
    return new PathCurve(f, radius);
  }
  // position at arc length d (metres); hint = segment index to start searching
  at(d, out, hint = 0) {
    const s = this.s, n = this.n;
    if (d <= 0) { out.set(this.p[0], this.p[1], this.p[2]); return 0; }
    if (d >= this.length) { const k = (n - 1) * 3; out.set(this.p[k], this.p[k + 1], this.p[k + 2]); return n - 2; }
    let i = Math.min(Math.max(hint, 0), n - 2);
    if (s[i] > d) i = 0;
    while (i < n - 2 && s[i + 1] < d) i++;
    const t = (d - s[i]) / Math.max(s[i + 1] - s[i], 1e-9);
    const a = i * 3, b = a + 3, p = this.p;
    out.set(p[a] + (p[b] - p[a]) * t, p[a + 1] + (p[b + 1] - p[a + 1]) * t, p[a + 2] + (p[b + 2] - p[a + 2]) * t);
    return i;
  }
  dir(d, out) {
    const a = new THREE.Vector3(), b = new THREE.Vector3();
    this.at(Math.max(0, d - 0.002), a); this.at(Math.min(this.length, d + 0.002), b);
    return out.subVectors(b, a).normalize();
  }
  reversed() {
    const f = new Float32Array(this.p.length);
    for (let i = 0; i < this.n; i++) { const j = this.n - 1 - i; f[i * 3] = this.p[j * 3]; f[i * 3 + 1] = this.p[j * 3 + 1]; f[i * 3 + 2] = this.p[j * 3 + 2]; }
    return new PathCurve(f, this.radius);
  }
  slice(f0, f1) {
    const pts = []; const v = new THREE.Vector3();
    const steps = Math.max(2, Math.ceil(this.length * (f1 - f0) / 0.003));
    for (let i = 0; i <= steps; i++) { this.at(this.length * (f0 + (f1 - f0) * i / steps), v); pts.push(v.x, v.y, v.z); }
    return new PathCurve(pts, this.radius);
  }
  static join(list, radius) {
    // concatenates curves, bridging small gaps with a straight segment
    const f = [];
    for (const c of list) for (let i = 0; i < c.p.length; i++) f.push(c.p[i]);
    return new PathCurve(f, radius ?? list[0].radius);
  }
  static smoothJoin(list, radius) {
    // joins curves with a Catmull-Rom blend around each join so motion stays smooth
    const pts = [];
    list.forEach((c, k) => {
      for (let i = 0; i < c.n; i++) pts.push(new THREE.Vector3(c.p[i * 3], c.p[i * 3 + 1], c.p[i * 3 + 2]));
    });
    const out = [];
    for (let i = 0; i < pts.length; i++) {
      if (i > 0 && pts[i].distanceTo(out[out.length - 1]) < 0.0008) continue;
      out.push(pts[i]);
    }
    const curve = new THREE.CatmullRomCurve3(out, false, 'centripetal');
    let L = 0; for (let i = 1; i < out.length; i++) L += out[i].distanceTo(out[i - 1]);
    const n = Math.max(8, Math.ceil(L / 0.003));
    return PathCurve.fromPoints(curve.getSpacedPoints(n), radius ?? list[0].radius);
  }
}

const VS = `
  attribute float aSize; attribute float aAlpha; attribute vec3 aColor;
  uniform float uScale; uniform float uModel;
  varying vec3 vColor; varying float vAlpha;
  void main(){
    vec4 mv = modelViewMatrix * vec4(position,1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = clamp(aSize * uModel * uScale / max(-mv.z, 0.02), 1.0, 96.0);
    vColor = aColor; vAlpha = aAlpha;
  }`;
const FS = `
  varying vec3 vColor; varying float vAlpha;
  void main(){
    vec2 c = gl_PointCoord - 0.5; float d = length(c) * 2.0;
    if (d > 1.0) discard;
    float core = 1.0 - smoothstep(0.0, 1.0, d);
    float rim = smoothstep(0.55, 0.85, d) * (1.0 - smoothstep(0.85, 1.0, d));
    vec3 col = vColor * (0.75 + 0.5 * core) + rim * 0.15;
    gl_FragColor = vec4(col, vAlpha * (0.35 + 0.65 * core));
  }`;

// One stream = particles travelling along a set of curves.
class Stream {
  constructor(sys, def) {
    this.def = def;
    this.curves = def.curves;
    const total = this.curves.reduce((a, c) => a + c.length, 0);
    this.count = def.count ?? Math.min(def.max ?? 900, Math.max(8, Math.round(total * (def.density ?? 60))));
    this.speed = def.speed ?? 0.08;
    this.c1 = new THREE.Color(def.color ?? '#ff3040');
    this.c2 = new THREE.Color(def.color2 ?? def.color ?? '#ff3040');
    this.switchAt = def.switchAt ?? 2; // fraction along curve where colour changes
    this.size = def.size ?? 0.0035;
    this.spread = def.spread ?? 0.55;
    this.fade = def.fade ?? 0.08;
    this.pulse = def.pulse ?? 0;
    // allocate particles on curves proportionally to length
    this.items = [];
    for (let i = 0; i < this.count; i++) {
      let r = Math.random() * total, ci = 0;
      while (ci < this.curves.length - 1 && r > this.curves[ci].length) { r -= this.curves[ci].length; ci++; }
      const ang = Math.random() * Math.PI * 2, rad = Math.sqrt(Math.random()) * this.spread;
      this.items.push({ c: ci, d: Math.random() * this.curves[ci].length, h: 0, ox: Math.cos(ang) * rad, oy: Math.sin(ang) * rad, v: 0.75 + Math.random() * 0.5, sz: 0.8 + Math.random() * 0.4 });
    }
    this.offset = sys.reserve(this.count);
    this.sys = sys;
    this.alpha = 0; // fades in/out
    this.target = 1;
  }
  update(dt, mult) {
    const sys = this.sys, pos = sys.pos, col = sys.col, size = sys.size, alpha = sys.alpha;
    const v = new THREE.Vector3(), t = new THREE.Vector3(), n1 = new THREE.Vector3(), n2 = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
    this.alpha += (this.target - this.alpha) * Math.min(1, dt * 2.5);
    const drv = this.def.drive && sys.drivers ? (sys.drivers[this.def.drive] ?? 1) : 1;
    const sp = this.speed * mult * drv;
    for (let i = 0; i < this.count; i++) {
      const it = this.items[i];
      const c = this.curves[it.c];
      it.d += sp * it.v * dt;
      if (it.d > c.length) {
        // respawn on another curve, weighted by length
        it.c = (Math.random() * this.curves.length) | 0;
        if (this.curves.length > 1) {
          let r = Math.random() * sys.totalLen(this), ci = 0;
          while (ci < this.curves.length - 1 && r > this.curves[ci].length) { r -= this.curves[ci].length; ci++; }
          it.c = ci;
        }
        it.d = 0; it.h = 0;
      }
      const cc = this.curves[it.c];
      it.h = cc.at(it.d, v, it.h);
      // lateral offset inside the tube
      const a = it.h * 3, p = cc.p;
      const b = Math.min(a + 3, (cc.n - 1) * 3);
      t.set(p[b] - p[a], p[b + 1] - p[a + 1], p[b + 2] - p[a + 2]).normalize();
      n1.crossVectors(t, Math.abs(t.y) > 0.9 ? n2.set(1, 0, 0) : up).normalize();
      n2.crossVectors(t, n1);
      const R = cc.radius;
      v.addScaledVector(n1, it.ox * R).addScaledVector(n2, it.oy * R);
      const k = (this.offset + i) * 3;
      pos[k] = v.x; pos[k + 1] = v.y; pos[k + 2] = v.z;
      const f = it.d / cc.length;
      const cA = f < this.switchAt ? this.c1 : this.c2;
      col[k] = cA.r; col[k + 1] = cA.g; col[k + 2] = cA.b;
      const edge = Math.min(1, Math.min(f, 1 - f) / this.fade);
      alpha[this.offset + i] = this.alpha * Math.max(0, edge) * (this.def.opacity ?? 0.95);
      size[this.offset + i] = this.size * it.sz * (1 + this.pulse * sys.beat);
    }
  }
  clear() {
    for (let i = 0; i < this.count; i++) this.sys.alpha[this.offset + i] = 0;
  }
}

export class FlowSystem {
  constructor(max = 9000) {
    this.max = max;
    this.used = 0;
    this.pos = new Float32Array(max * 3);
    this.col = new Float32Array(max * 3);
    this.size = new Float32Array(max);
    this.alpha = new Float32Array(max);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('aColor', new THREE.BufferAttribute(this.col, 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('aSize', new THREE.BufferAttribute(this.size, 1).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('aAlpha', new THREE.BufferAttribute(this.alpha, 1).setUsage(THREE.DynamicDrawUsage));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0.9, 0), 3);
    this.mat = new THREE.ShaderMaterial({
      uniforms: { uScale: { value: 600 }, uModel: { value: 1 } },
      vertexShader: VS, fragmentShader: FS, transparent: true, depthWrite: false,
    });
    this.points = new THREE.Points(g, this.mat);
    this.points.renderOrder = 8;
    this.points.frustumCulled = false;
    this.geom = g;
    this.defs = {};
    this.active = new Map();
    this.beat = 0;
    this.mult = 1;
    this.free = [];
  }
  totalLen(s) { return s._total ?? (s._total = s.curves.reduce((a, c) => a + c.length, 0)); }
  reserve(n) {
    // reuse a freed block if one is large enough
    const i = this.free.findIndex((b) => b.n >= n);
    if (i >= 0) { const b = this.free.splice(i, 1)[0]; if (b.n > n) this.free.push({ o: b.o + n, n: b.n - n }); return b.o; }
    if (this.used + n > this.max) { console.warn('flow pool full'); n = Math.max(0, this.max - this.used); }
    const o = this.used; this.used += n; return o;
  }
  define(id, fn) { this.defs[id] = fn; }
  set(ids) {
    const want = new Set(ids || []);
    for (const [id, s] of this.active) if (!want.has(id)) s.target = 0;
    for (const id of want) {
      if (this.active.has(id)) { this.active.get(id).target = 1; continue; }
      const fn = this.defs[id];
      if (!fn) { console.warn('no flow', id); continue; }
      const defs = [].concat(fn());
      const group = defs.map((d) => new Stream(this, d));
      const s = { target: 1, streams: group, id };
      this.active.set(id, s);
    }
  }
  update(dt) {
    for (const [id, s] of this.active) {
      for (const st of s.streams) { st.target = s.target; st.update(dt, this.mult); }
      if (s.target === 0 && s.streams.every((st) => st.alpha < 0.02)) {
        for (const st of s.streams) { st.clear(); this.free.push({ o: st.offset, n: st.count }); }
        this.active.delete(id);
      }
    }
    this.geom.setDrawRange(0, this.used);
    for (const k of ['position', 'aColor', 'aSize', 'aAlpha']) this.geom.attributes[k].needsUpdate = true;
  }
}

// ---------------------------------------------------------------- hero tracer
function rbcGeometry() {
  // biconcave red blood cell profile
  const pts = [];
  for (let i = 0; i <= 16; i++) {
    const r = i / 16;
    const h = 0.18 * Math.sqrt(Math.max(0, 1 - r * r)) * (0.35 + 1.2 * r * r);
    pts.push(new THREE.Vector2(r * 0.5 + 0.001, h * 0.5));
  }
  for (let i = 16; i >= 0; i--) { const p = pts[i]; pts.push(new THREE.Vector2(p.x, -p.y)); }
  const g = new THREE.LatheGeometry(pts, 24);
  g.computeVertexNormals();
  return g;
}
export const RBC_GEOM = rbcGeometry();

function bolusTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const x = c.getContext('2d');
  x.fillStyle = '#c98b4c'; x.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 260; i++) {
    x.fillStyle = ['#e0b36c', '#a8693a', '#d99a52', '#7a9a3a', '#f0d39a'][i % 5];
    x.globalAlpha = 0.5; x.beginPath(); x.arc(Math.random() * 128, Math.random() * 128, 2 + Math.random() * 6, 0, 7); x.fill();
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export class Tracer {
  constructor() {
    this.group = new THREE.Group();
    this.group.visible = false;
    this.rbc = new THREE.Mesh(RBC_GEOM, new THREE.MeshStandardMaterial({ color: '#d0202c', roughness: 0.35, emissive: '#400000' }));
    this.rbc.scale.setScalar(0.012);
    const bg = new THREE.IcosahedronGeometry(0.0075, 3);
    const pa = bg.attributes.position; const v = new THREE.Vector3();
    for (let i = 0; i < pa.count; i++) { v.fromBufferAttribute(pa, i); v.multiplyScalar(1 + 0.12 * Math.sin(v.x * 900) * Math.cos(v.y * 700 + v.z * 500)); pa.setXYZ(i, v.x, v.y, v.z); }
    bg.computeVertexNormals();
    this.bolus = new THREE.Mesh(bg, new THREE.MeshStandardMaterial({ map: bolusTexture(), roughness: 0.7, emissive: '#2a1500' }));
    this.halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTexture(), color: '#ffffff', transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending, opacity: 0.55 }));
    this.halo.scale.setScalar(0.05);
    this.halo.renderOrder = 9;
    this.group.add(this.rbc, this.bolus, this.halo);
    this.trailN = 40;
    this.trail = new FlowSystem(this.trailN);
    this.trailIdx = this.trail.reserve(this.trailN);
    this.trailPts = [];
    this.group.add(this.trail.points);
    this.curve = null;
    this.d = 0;
    this.pause = 0;
    this.v = new THREE.Vector3();
    this.dirv = new THREE.Vector3();
  }
  start(curve, opts = {}) {
    this.curve = curve; this.opts = opts;
    this.d = (opts.from ?? 0) * curve.length;
    this.end = (opts.until ?? 1) * curve.length;
    this.speed = opts.speed ?? 0.06;
    this.pause = 0;
    this.group.visible = true;
    const food = !!opts.food;
    this.rbc.visible = !food; this.bolus.visible = food;
    this.bolus.material.color.set(opts.waste ? '#6b4a2b' : '#ffffff');
    this.bolus.scale.setScalar(1);
    this.trailPts = [];
    this.oxyD = opts.oxyAtD ?? null;
  }
  stop() { this.group.visible = false; this.curve = null; }
  setBoost(b) { this.boost = b; this.rbc.scale.setScalar(0.012 * b); this.bolus.scale.setScalar((this.opts && this.opts.dissolve ? this._dis ?? 1 : 1) * b); this.halo.scale.setScalar(0.03 * b); }
  update(dt, t, mult = 1) {
    if (!this.curve) return;
    if (this.pause > 0) { this.pause -= dt; if (this.pause <= 0) { this.d = (this.opts.from ?? 0) * this.curve.length; this.trailPts = []; this.bolus.scale.setScalar(1); } return; }
    // blood moves in pulses with the heartbeat, food moves steadily
    const sp = this.speed * (this.opts.food ? 1 : mult);
    this.d += sp * dt;
    if (this.d >= this.end) { this.d = this.end; this.pause = 1.6; }
    this.curve.at(this.d, this.v);
    this.group.position.set(0, 0, 0);
    const obj = this.opts.food ? this.bolus : this.rbc;
    obj.position.copy(this.v);
    this.halo.position.copy(this.v);
    this.curve.dir(this.d, this.dirv);
    if (!this.opts.food) {
      obj.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), this.dirv);
      obj.rotateY(t * 2.0);
      let oxy = !!this.opts.oxy;
      if (this.oxyD != null) oxy = this.d > this.oxyD;
      obj.material.color.set(oxy ? '#e3202c' : '#5a1f63');
      obj.material.emissive.set(oxy ? '#5a0000' : '#1a0a40');
      this.halo.material.color.set(oxy ? '#ff6060' : '#8f7dff');
    } else {
      obj.rotation.x += dt * 1.5; obj.rotation.z += dt;
      this.halo.material.color.set(this.opts.waste ? '#c08a50' : '#ffd890');
      if (this.opts.dissolve) { this._dis = Math.max(0.25, 1 - this.d / this.curve.length * 0.8); obj.scale.setScalar(this._dis * (this.boost || 1)); }
    }
    // trail
    this.trailPts.unshift(this.v.clone());
    if (this.trailPts.length > this.trailN) this.trailPts.pop();
    const tr = this.trail;
    const c = new THREE.Color(this.halo.material.color);
    for (let i = 0; i < this.trailN; i++) {
      const p = this.trailPts[i];
      const k = (this.trailIdx + i) * 3;
      if (p) { tr.pos[k] = p.x; tr.pos[k + 1] = p.y; tr.pos[k + 2] = p.z; }
      tr.col[k] = c.r; tr.col[k + 1] = c.g; tr.col[k + 2] = c.b;
      tr.alpha[this.trailIdx + i] = p ? 0.5 * (1 - i / this.trailN) : 0;
      tr.size[this.trailIdx + i] = 0.006 * (1 - i / this.trailN * 0.7);
    }
    tr.geom.setDrawRange(0, tr.used);
    for (const k of ['position', 'aColor', 'aSize', 'aAlpha']) tr.geom.attributes[k].needsUpdate = true;
  }
  position() { return this.v; }
}

let _halo;
export function haloTexture() {
  if (_halo) return _halo;
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const x = c.getContext('2d');
  const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.25, 'rgba(255,255,255,0.55)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, 64, 64);
  _halo = new THREE.CanvasTexture(c);
  return _halo;
}
