// Visual effects shared by all experiments: gas bubbles, falling precipitate flakes, fumes/smoke,
// a pouring stream, drops, flashes and sparks. All pooled so the frame rate stays steady on a headset.
import * as THREE from 'three';
import { LITE, lockOff } from './lite.js';

const tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3(), mtx = new THREE.Matrix4(), qI = new THREE.Quaternion(), sc = new THREE.Vector3();

function softTex() {
  const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
  const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.45, 'rgba(255,255,255,0.45)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, 64, 64); const t = new THREE.CanvasTexture(c); return t;
}

export class FX {
  constructor(scene) {
    this.scene = scene;
    // bubbles: instanced, live in vessel space
    this.bMax = 420;
    this.bub = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 10, 8), new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.55, roughness: 0.05, clearcoat: 1, envMapIntensity: 2, depthWrite: false }), this.bMax);
    this.bub.instanceMatrix.setUsage(THREE.DynamicDrawUsage); this.bub.frustumCulled = false; this.bub.renderOrder = 5; this.bub.count = 0; scene.add(this.bub);
    this.bubbles = [];
    // flakes (precipitate falling)
    this.fMax = 500;
    this.flk = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 }), this.fMax);
    this.flk.instanceMatrix.setUsage(THREE.DynamicDrawUsage); this.flk.frustumCulled = false; this.flk.renderOrder = 5; this.flk.count = 0; scene.add(this.flk);
    this.flakes = [];
    // smoke / fumes: sprites
    this.sMax = 220; const pos = new Float32Array(this.sMax * 3), col = new Float32Array(this.sMax * 3), size = new Float32Array(this.sMax), alpha = new Float32Array(this.sMax);
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    g.setAttribute('size', new THREE.BufferAttribute(size, 1)); g.setAttribute('alpha', new THREE.BufferAttribute(alpha, 1));
    this.smat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: { map: { value: softTex() }, scale: { value: 600 } },
      vertexShader: `attribute float size; attribute float alpha; attribute vec3 color; varying vec3 vC; varying float vA; uniform float scale;
        void main(){ vC = color; vA = alpha; vec4 mv = modelViewMatrix*vec4(position,1.0); gl_PointSize = min(size*scale/(-mv.z), 140.0); gl_Position = projectionMatrix*mv; }`,
      fragmentShader: `uniform sampler2D map; varying vec3 vC; varying float vA; void main(){ vec4 t = texture2D(map, gl_PointCoord); gl_FragColor = vec4(vC, t.a*vA); }` });
    this.smoke = new THREE.Points(g, this.smat); this.smoke.frustumCulled = false; this.smoke.renderOrder = 8; scene.add(this.smoke);
    this.puffs = [];
    // pouring stream: a tube rebuilt each frame while pouring
    this.streamMat = new THREE.MeshStandardMaterial({ color: 0x9fc6ff, transparent: true, opacity: 0.65, roughness: 0.05, envMapIntensity: 1.5 });
    this.streams = new Map();
    // drops
    this.drops = [];
    this.dropGeo = new THREE.SphereGeometry(0.0022, 10, 8);
    // flash light
    this.flash = new THREE.PointLight(0xffffff, 0, 3, 2); scene.add(this.flash); this.flashT = 0; this.flashMax = 0;
    if (LITE) lockOff(this.flash); // headset: the flash shows as the glare sprite only
    this.glare = new THREE.Sprite(new THREE.SpriteMaterial({ map: softTex(), color: 0xffffff, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    this.glare.visible = false; this.glare.renderOrder = 10; scene.add(this.glare);
  }
  // gas bubbles in a vessel: rate = bubbles per second; at = optional local point list (on a solid)
  bubbles_(v, rate, dt, o = {}) {
    if (!(rate > 0) || v.ml < 0.3) return;
    v._bAcc = (v._bAcc || 0) + rate * dt;
    while (v._bAcc >= 1 && this.bubbles.length < this.bMax) {
      v._bAcc -= 1;
      let p;
      if (o.from) p = o.from().clone(); else { const r = v.rInner(0.004) * 0.75 * Math.sqrt(Math.random()); const a = Math.random() * 6.283; p = new THREE.Vector3(Math.cos(a) * r, v.inner[0].y + 0.002, Math.sin(a) * r); }
      this.bubbles.push({ v, p, s: (o.size ?? 0.0008) * (0.6 + Math.random() * 0.8), vy: 0.02 + Math.random() * 0.03, wob: Math.random() * 6 });
    }
  }
  flakes_(v, rate, dt, color) {
    if (!(rate > 0)) return;
    v._fAcc = (v._fAcc || 0) + rate * dt;
    while (v._fAcc >= 1 && this.flakes.length < this.fMax) {
      v._fAcc -= 1; const h = v.heightFor(v.ml); const r = v.rInner(h * 0.8) * 0.8 * Math.sqrt(Math.random()); const a = Math.random() * 6.283;
      this.flakes.push({ v, p: new THREE.Vector3(Math.cos(a) * r, h * (0.4 + Math.random() * 0.55), Math.sin(a) * r), s: 0.0007 + Math.random() * 0.0007, vy: -(0.004 + Math.random() * 0.006), color: new THREE.Color(color), life: 0 });
    }
  }
  puff(worldP, color, o = {}) {
    if (this.puffs.length >= this.sMax) this.puffs.shift();
    this.puffs.push({ p: worldP.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.006, 0, (Math.random() - 0.5) * 0.006)), v: new THREE.Vector3((Math.random() - 0.5) * 0.01, o.up ?? 0.05 + Math.random() * 0.03, (Math.random() - 0.5) * 0.01),
      c: new THREE.Color(color), life: 0, max: o.life ?? 2.6, s0: o.size ?? 0.012, s1: o.grow ?? 0.06, a: o.alpha ?? 0.45 });
  }
  flashAt(p, intensity = 6, dur = 0.25, color = 0xffffff, glare = 0.12) {
    this.flash.position.copy(p); this.flash.color.set(color); this.flashMax = intensity; this.flashT = dur; this.flashDur = dur;
    this.glare.position.copy(p); this.glare.material.color.set(color); this.glare.scale.setScalar(glare); this.glare.visible = glare > 0;
  }
  // continuous glow (burning magnesium etc.)
  glow(p, on, intensity = 5, color = 0xffffff, size = 0.18) {
    if (!on) { if (this.glowOn) { this.flash.intensity = 0; this.glare.visible = false; } this.glowOn = false; return; }
    this.glowOn = true; this.flash.position.copy(p); this.flash.color.set(color); this.flash.intensity = intensity * (0.85 + Math.random() * 0.3);
    this.glare.position.copy(p); this.glare.material.color.set(color); this.glare.scale.setScalar(size * (0.9 + Math.random() * 0.2)); this.glare.visible = true;
  }
  // stream from a pouring lip to where it lands
  stream(key, from, to, color, width = 0.0018) {
    let s = this.streams.get(key);
    if (!s) { s = new THREE.Mesh(new THREE.BufferGeometry(), this.streamMat.clone()); s.renderOrder = 5; this.scene.add(s); this.streams.set(key, s); }
    const mid = from.clone().lerp(to, 0.5); mid.y = from.y - (from.y - to.y) * 0.25;
    const curve = new THREE.QuadraticBezierCurve3(from.clone(), mid, to.clone());
    s.geometry.dispose(); s.geometry = new THREE.TubeGeometry(curve, 10, width, 6, false);
    s.material.color.copy(color); s.visible = true; s.userData.seen = true;
  }
  endStreams() { for (const s of this.streams.values()) { if (!s.userData.seen) s.visible = false; s.userData.seen = false; } }
  drop(from, to, color, onLand) {
    const m = new THREE.Mesh(this.dropGeo, new THREE.MeshStandardMaterial({ color, transparent: true, opacity: 0.8, roughness: 0.05 }));
    m.position.copy(from); m.renderOrder = 5; this.scene.add(m);
    this.drops.push({ m, vy: 0, to: to.clone(), onLand });
  }
  update(dt, t) {
    // bubbles
    let n = 0;
    this.bubbles = this.bubbles.filter((b) => {
      const v = b.v; if (!v.g.parent) return false;
      b.p.y += b.vy * dt; b.vy = Math.min(0.09, b.vy + dt * 0.03); b.wob += dt * 9;
      const top = v.heightFor(v.ml) - 0.0015;
      if (b.p.y > top || v.ml < 0.3) return false;
      const r = Math.max(0, v.rInner(b.p.y) - b.s - 0.0008); const d = Math.hypot(b.p.x, b.p.z); if (d > r) { b.p.x *= r / d; b.p.z *= r / d; }
      tmp.set(b.p.x + Math.sin(b.wob) * 0.0004, b.p.y, b.p.z); v.g.localToWorld(tmp);
      mtx.compose(tmp, qI, sc.setScalar(b.s)); if (n < this.bMax) this.bub.setMatrixAt(n++, mtx); return true;
    });
    this.bub.count = n; this.bub.instanceMatrix.needsUpdate = true;
    // flakes
    n = 0;
    this.flakes = this.flakes.filter((f) => {
      const v = f.v; if (!v.g.parent) return false;
      f.life += dt; f.p.y += f.vy * dt; f.p.x += Math.sin(f.life * 3 + f.s * 1e4) * 0.0004 * dt;
      if (f.p.y < v.inner[0].y + 0.0015 || f.life > 14 || v.ml < 0.3) return false;
      tmp.copy(f.p); v.g.localToWorld(tmp); mtx.compose(tmp, qI, sc.setScalar(f.s)); this.flk.setMatrixAt(n, mtx); this.flk.setColorAt(n, f.color); n++; return n < this.fMax;
    });
    this.flk.count = n; this.flk.instanceMatrix.needsUpdate = true; if (this.flk.instanceColor) this.flk.instanceColor.needsUpdate = true;
    // smoke
    const g = this.smoke.geometry; const P = g.attributes.position.array, C = g.attributes.color.array, S = g.attributes.size.array, A = g.attributes.alpha.array;
    this.puffs = this.puffs.filter((p) => { p.life += dt; p.p.addScaledVector(p.v, dt); p.v.multiplyScalar(Math.exp(-0.6 * dt)); p.v.x += (Math.random() - 0.5) * 0.02 * dt; return p.life < p.max; });
    for (let i = 0; i < this.sMax; i++) {
      const p = this.puffs[i];
      if (!p) { A[i] = 0; S[i] = 0; continue; }
      const k = p.life / p.max; P[i * 3] = p.p.x; P[i * 3 + 1] = p.p.y; P[i * 3 + 2] = p.p.z;
      C[i * 3] = p.c.r; C[i * 3 + 1] = p.c.g; C[i * 3 + 2] = p.c.b; S[i] = p.s0 + (p.s1 - p.s0) * k; A[i] = p.a * Math.sin(Math.PI * Math.min(1, k * 1.2)) * (1 - k * 0.3);
    }
    g.attributes.position.needsUpdate = g.attributes.color.needsUpdate = g.attributes.size.needsUpdate = g.attributes.alpha.needsUpdate = true;
    // drops
    this.drops = this.drops.filter((d) => {
      d.vy -= 9.8 * dt; d.m.position.y += d.vy * dt; d.m.position.x += (d.to.x - d.m.position.x) * Math.min(1, dt * 10); d.m.position.z += (d.to.z - d.m.position.z) * Math.min(1, dt * 10);
      if (d.m.position.y <= d.to.y) { this.scene.remove(d.m); d.m.material.dispose(); d.onLand && d.onLand(); return false; } return true;
    });
    // flash
    if (this.flashT > 0) { this.flashT -= dt; const k = Math.max(0, this.flashT / this.flashDur); this.flash.intensity = this.flashMax * k; this.glare.material.opacity = k; if (k <= 0) this.glare.visible = false; }
    else if (!this.glowOn) this.flash.intensity = 0;
    void t; void tmp2;
  }
}
