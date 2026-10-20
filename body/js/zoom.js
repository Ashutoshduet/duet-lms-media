// VR close-up window: a magnified 3D copy of the focus area, shown beside the body.
// The body itself never moves or changes size; this stand shows the close-up instead.
import * as THREE from 'three';
import { partify } from './body.js';
import { Label } from './labels.js';

const VS = `
  attribute float aSize; attribute float aAlpha; attribute vec3 aColor;
  uniform float uScale; uniform float uModel; uniform vec3 uClipC; uniform float uClipR;
  varying vec3 vColor; varying float vAlpha;
  void main(){
    vec4 mv = modelViewMatrix * vec4(position,1.0);
    gl_Position = projectionMatrix * mv;
    float inside = 1.0 - step(uClipR, distance(position, uClipC));
    gl_PointSize = inside * clamp(aSize * uModel * uScale / max(-mv.z, 0.02), 1.0, 96.0);
    vColor = aColor; vAlpha = aAlpha * inside;
  }`;
const FS = `
  varying vec3 vColor; varying float vAlpha;
  void main(){
    vec2 c = gl_PointCoord - 0.5; float d = length(c) * 2.0;
    if (d > 1.0 || vAlpha < 0.01) discard;
    float core = 1.0 - smoothstep(0.0, 1.0, d);
    gl_FragColor = vec4(vColor * (0.75 + 0.5 * core), vAlpha * (0.35 + 0.65 * core));
  }`;

export class ZoomStand {
  constructor(app) {
    this.app = app;
    this.group = new THREE.Group(); this.group.visible = false; this.group.name = 'zoom-stand';
    // frame: soft disc backdrop + ring
    const disc = new THREE.Mesh(new THREE.CircleGeometry(1, 64), new THREE.MeshBasicMaterial({ color: '#0d1420', transparent: true, opacity: 0.55, depthWrite: false }));
    disc.position.z = -0.9; disc.renderOrder = -1;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1, 0.012, 8, 96), new THREE.MeshBasicMaterial({ color: '#cfe6ff', transparent: true, opacity: 0.5 }));
    this.frame = new THREE.Group(); this.frame.add(disc, ring);
    this.group.add(this.frame);
    this.holder = new THREE.Group(); this.group.add(this.holder); // scaled copy lives here (body space)
    this.labels = new THREE.Group(); this.holder.add(this.labels);
    this.clones = [];
    this.planes = [0, 1, 2, 3, 4, 5].map(() => new THREE.Plane());
    this.active = false;
  }

  // focus: list of group names; center (body space Vector3); radius (body metres); size: stand radius in metres
  show(groups, center, radius, size = 0.26) {
    this.clear();
    const app = this.app, body = app.body;
    this.center = center.clone(); this.radius = radius; this.size = size;
    const k = size / radius;
    this.holder.scale.setScalar(k);
    this.holder.position.copy(center).multiplyScalar(-k);
    this.frame.scale.setScalar(size * 1.08);
    for (const g of groups) {
      const orig = body.parts[g]; if (!orig) continue;
      const m = orig.material.clone();
      if (orig.material.isShaderMaterial) { for (const key of Object.keys(body.state.u)) m.uniforms[key] = body.state.u[key]; }
      else if (orig.material.userData.partified) partify(m, body.state);
      m.clippingPlanes = this.planes;
      const c = new THREE.Mesh(orig.geometry, m); c.renderOrder = orig.renderOrder; c.frustumCulled = false;
      c.userData.orig = orig; this.holder.add(c); this.clones.push(c);
    }
    // particles and the hero tracer, clipped to the same sphere
    const F = app.flows;
    this.pmat = new THREE.ShaderMaterial({ uniforms: { uScale: { value: 600 }, uModel: { value: 1 }, uClipC: { value: this.center }, uClipR: { value: radius } },
      vertexShader: VS, fragmentShader: FS, transparent: true, depthWrite: false });
    this.points = new THREE.Points(F.geom, this.pmat); this.points.frustumCulled = false; this.points.renderOrder = 8;
    this.holder.add(this.points);
    const tr = app.tracer;
    this.tracerView = new THREE.Group();
    for (const src of [tr.rbc, tr.bolus]) { const p = new THREE.Mesh(src.geometry, src.material); p.userData.src = src; this.tracerView.add(p); }
    this.holder.add(this.tracerView);
    this.group.visible = true; this.active = true;
  }

  setLabels(list, lang, infoFn, anchorFn) {
    this.labels.clear();
    if (!this.active) return;
    const k = this.holder.scale.x;
    list.forEach((p, i) => {
      const info = infoFn(p, lang); if (!info) return;
      const a = anchorFn(p);
      if (a.distanceTo(this.center) > this.radius * 1.05) return;
      const side = a.x >= this.center.x ? 1 : -1;
      const lb = new Label([info.name, info.alt], { height: 0.028, offset: new THREE.Vector3(side * 0.05, 0.03 + (i % 2) * 0.016, 0.02), cx: side > 0 ? 0 : 1, cy: 0.5, small: 22 });
      lb.position.copy(a); lb.setScale(1 / k); this.labels.add(lb);
    });
  }

  clear() {
    for (const c of this.clones) { c.material.dispose(); this.holder.remove(c); }
    this.clones = [];
    if (this.points) { this.holder.remove(this.points); this.pmat.dispose(); this.points = null; }
    if (this.tracerView) { this.holder.remove(this.tracerView); this.tracerView = null; }
    this.labels.clear();
  }
  hide() { this.clear(); this.group.visible = false; this.active = false; }

  update(camera, pointScale) {
    if (!this.active) return;
    this.group.updateMatrixWorld(true);
    // sphere-ish clip: six planes of a box around the focus, in world space
    const k = this.holder.scale.x, r = this.radius * k;
    const c = new THREE.Vector3().copy(this.center).applyMatrix4(this.holder.matrixWorld);
    const q = this.group.getWorldQuaternion(new THREE.Quaternion());
    const axes = [new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 1)].map((v) => v.applyQuaternion(q));
    axes.forEach((ax, i) => {
      this.planes[i * 2].setFromNormalAndCoplanarPoint(ax.clone().negate(), c.clone().addScaledVector(ax, r));
      this.planes[i * 2 + 1].setFromNormalAndCoplanarPoint(ax, c.clone().addScaledVector(ax, -r));
    });
    for (const cl of this.clones) {
      const o = cl.userData.orig, m = cl.material, om = o.material;
      cl.position.copy(o.position); cl.quaternion.copy(o.quaternion); cl.scale.copy(o.scale); cl.visible = o.visible;
      if (om.isShaderMaterial) { if (m.uniforms.uOpacity) m.uniforms.uOpacity.value = om.uniforms.uOpacity.value; }
      else {
        if (m.transparent !== om.transparent) { m.transparent = om.transparent; m.needsUpdate = true; }
        m.opacity = om.opacity; m.depthWrite = om.depthWrite; if (om.emissive) m.emissive.copy(om.emissive);
      }
    }
    for (const p of (this.tracerView ? this.tracerView.children : [])) { p.position.copy(p.userData.src.position); p.quaternion.copy(p.userData.src.quaternion); p.scale.copy(p.userData.src.scale).multiplyScalar(0.55); p.visible = p.userData.src.visible && this.app.tracer.group.visible; }
    this.pmat.uniforms.uScale.value = pointScale; this.pmat.uniforms.uModel.value = k * 0.5;
    if (camera) { const cq = camera.getWorldQuaternion(new THREE.Quaternion()); this.frame.quaternion.copy(cq).premultiply(q.clone().invert()); }
  }
}
