// Magnified "inside the organ" scenes shown in a glass bubble beside the body.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { RBC_GEOM, haloTexture } from './flows.js';
import { Label, FONT } from './labels.js';
import { bakeMesh, asset } from './body.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const rand = (a, b) => a + Math.random() * (b - a);

export function glass(color = '#f2a7b4', face = 0.12, edge = 0.75, opts = {}) {
  return new THREE.ShaderMaterial({
    uniforms: { uC: { value: new THREE.Color(color) }, uR: { value: new THREE.Color(opts.rim ?? '#ffffff') }, uF: { value: face }, uE: { value: edge }, uO: { value: 1 } },
    vertexShader: `varying vec3 vN; varying vec3 vV; void main(){ vec4 mv = modelViewMatrix*vec4(position,1.); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }`,
    fragmentShader: `uniform vec3 uC; uniform vec3 uR; uniform float uF; uniform float uE; uniform float uO; varying vec3 vN; varying vec3 vV;
      void main(){ float f = pow(1.0-abs(dot(normalize(vN),normalize(vV))),2.0); vec3 c = mix(uC, mix(uC,uR,0.55), f); gl_FragColor = vec4(c, mix(uF,uE,f)*uO); }`,
    transparent: true, depthWrite: false, side: opts.side ?? THREE.DoubleSide,
  });
}

function std(color, rough = 0.5, emissive = '#000000', opts = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: 0, emissive, ...opts });
}

function tube(points, r, mat, seg) {
  const c = new THREE.CatmullRomCurve3(points, false, 'centripetal');
  const g = new THREE.TubeGeometry(c, seg ?? Math.max(16, points.length * 10), r, 10, false);
  const m = new THREE.Mesh(g, mat);
  m.userData.curve = c;
  return m;
}

// tube coloured blue -> red along its length (deoxygenated -> oxygenated)
function gradientTubeMat(c0, c1) {
  return new THREE.ShaderMaterial({
    uniforms: { uA: { value: new THREE.Color(c0) }, uB: { value: new THREE.Color(c1) }, uO: { value: 0.55 } },
    vertexShader: `varying vec2 vUv; varying vec3 vN; varying vec3 vV; void main(){ vUv = uv; vec4 mv = modelViewMatrix*vec4(position,1.); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }`,
    fragmentShader: `uniform vec3 uA; uniform vec3 uB; uniform float uO; varying vec2 vUv; varying vec3 vN; varying vec3 vV;
      void main(){ float f = pow(1.0-abs(dot(normalize(vN),normalize(vV))),1.6); vec3 c = mix(uA,uB,smoothstep(0.25,0.75,vUv.x)); gl_FragColor = vec4(c*(0.75+0.5*f), uO*(0.45+0.55*f)); }`,
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
  });
}

// round icon sprite with short text (O2, CO2, glucose...)
const iconCache = {};
export function icon(text, fill, fg = '#0d1118', shape = 'circle') {
  const key = text + fill + shape;
  if (!iconCache[key]) {
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const x = c.getContext('2d');
    x.fillStyle = fill; x.strokeStyle = 'rgba(255,255,255,0.85)'; x.lineWidth = 6;
    x.beginPath();
    if (shape === 'hex') { for (let i = 0; i < 6; i++) { const a = Math.PI / 3 * i + Math.PI / 6; x.lineTo(64 + 56 * Math.cos(a), 64 + 56 * Math.sin(a)); } x.closePath(); }
    else if (shape === 'star') { for (let i = 0; i < 10; i++) { const a = Math.PI / 5 * i - Math.PI / 2; const r = i % 2 ? 26 : 60; x.lineTo(64 + r * Math.cos(a), 64 + r * Math.sin(a)); } x.closePath(); }
    else if (shape === 'drop') { x.moveTo(64, 8); x.bezierCurveTo(110, 70, 100, 120, 64, 120); x.bezierCurveTo(28, 120, 18, 70, 64, 8); }
    else x.arc(64, 64, 56, 0, Math.PI * 2);
    x.fill(); x.stroke();
    x.fillStyle = fg; x.font = `700 ${text.length > 3 ? 30 : 40}px ${FONT}`; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText(text, 64, shape === 'drop' ? 80 : 68);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; iconCache[key] = t;
  }
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: iconCache[key], transparent: true, depthWrite: false }));
  s.renderOrder = 12;
  return s;
}

// an object that travels along a curve and respawns
class Mover {
  constructor(obj, curveFn, dur, opts = {}) {
    this.obj = obj; this.curveFn = curveFn; this.dur = dur; this.opts = opts;
    this.t = opts.t0 ?? Math.random(); this.curve = curveFn();
  }
  update(dt) {
    this.t += dt / this.dur;
    if (this.t >= 1) { this.t = 0; this.curve = this.curveFn(); this.opts.onRespawn && this.opts.onRespawn(this); }
    const p = this.curve.getPointAt(Math.min(1, this.t));
    this.obj.position.copy(p);
    const a = Math.min(1, this.t / 0.12, (1 - this.t) / 0.12);
    if (this.obj.material) this.obj.material.opacity = (this.opts.alpha ?? 1) * Math.max(0, a);
    this.opts.onUpdate && this.opts.onUpdate(this);
  }
}

function lerpColor(a, b, t) { return new THREE.Color(a).lerp(new THREE.Color(b), t); }

// ------------------------------------------------------------------ scenes
function alveoli() {
  const g = new THREE.Group(); const movers = [];
  const sacs = [];
  const pos = [V(0, 0.05, 0), V(0.38, 0.2, 0.05), V(-0.3, 0.32, 0.1), V(0.1, 0.48, -0.15), V(0.34, -0.22, 0.12), V(-0.18, -0.3, 0.18), V(0.05, -0.12, -0.38), V(-0.42, 0.0, -0.18), V(0.45, 0.25, -0.3), V(-0.05, 0.25, 0.38)];
  const sacMat = glass('#f6a6b6', 0.16, 0.85);
  pos.forEach((p, i) => { const r = rand(0.22, 0.29); const m = new THREE.Mesh(new THREE.SphereGeometry(r, 28, 20), sacMat); m.position.copy(p); m.userData.r = r; g.add(m); sacs.push(m); });
  // inner lining glow
  const lining = new THREE.Mesh(new THREE.SphereGeometry(0.55, 24, 18), glass('#ffd0d8', 0.05, 0.25));
  lining.position.set(0, 0.08, 0); g.add(lining);
  // bronchiole bringing air
  const bron = tube([V(-1.05, 0.95, 0.05), V(-0.75, 0.7, 0.05), V(-0.48, 0.45, 0.05), V(-0.25, 0.25, 0.03)], 0.075, glass('#f0d4c8', 0.25, 0.85));
  g.add(bron);
  // capillary net wrapping the sacs
  const capMat = gradientTubeMat('#4a3bd1', '#e3202c');
  const caps = [];
  for (let k = 0; k < 7; k++) {
    const pts = [];
    const phi = -0.9 + k * 0.3;
    for (let i = 0; i <= 14; i++) {
      const th = -2.4 + i * (4.8 / 14);
      const r = 0.62 + 0.06 * Math.sin(i * 1.7 + k);
      pts.push(V(r * Math.cos(th) * Math.cos(phi), r * Math.sin(phi) + 0.08 + 0.1 * Math.sin(th * 2 + k), r * Math.sin(th) * Math.cos(phi)));
    }
    const t = tube(pts, 0.032, capMat, 90); g.add(t); caps.push(t.userData.curve);
  }
  const art = tube([V(-0.95, -0.85, 0.3), V(-0.75, -0.6, 0.2), caps[0].getPointAt(0)], 0.06, std('#4a3bd1', 0.4, '#140a40')); g.add(art);
  const ven = tube([caps[6].getPointAt(1), V(0.8, 0.75, -0.1), V(0.98, 0.9, -0.15)], 0.06, std('#e3202c', 0.4, '#400000')); g.add(ven);
  // red cells in the capillaries change colour as they pick up oxygen
  const N = 42;
  const rbc = new THREE.InstancedMesh(RBC_GEOM, std('#ffffff', 0.35, '#200000'), N);
  rbc.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  const st = []; for (let i = 0; i < N; i++) st.push({ c: i % caps.length, t: Math.random() });
  g.add(rbc);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s3 = V(0.11, 0.11, 0.11), tmp = V(0, 0, 0);
  const updRBC = (dt) => {
    for (let i = 0; i < N; i++) {
      const s = st[i]; s.t += dt * 0.09; if (s.t > 1) { s.t = 0; s.c = (Math.random() * caps.length) | 0; }
      const p = caps[s.c].getPointAt(s.t); const d = caps[s.c].getTangentAt(s.t);
      q.setFromUnitVectors(V(0, 1, 0), d); m4.compose(p, q, s3); rbc.setMatrixAt(i, m4);
      rbc.setColorAt(i, lerpColor('#5a2a8a', '#e3202c', THREE.MathUtils.smoothstep(s.t, 0.3, 0.7)));
    }
    rbc.instanceMatrix.needsUpdate = true; if (rbc.instanceColor) rbc.instanceColor.needsUpdate = true;
  };
  // O2 into blood, CO2 out to the air
  const sacPoint = () => { const s = sacs[(Math.random() * sacs.length) | 0]; return s.position.clone().add(new THREE.Vector3().randomDirection().multiplyScalar(s.userData.r * 0.5)); };
  for (let i = 0; i < 10; i++) {
    const o = icon('O₂', '#9fe3ff'); o.scale.setScalar(0.12); g.add(o);
    movers.push(new Mover(o, () => { const c = caps[(Math.random() * caps.length) | 0]; return new THREE.CatmullRomCurve3([V(-0.7, 0.62, 0.05), sacPoint(), c.getPointAt(rand(0.35, 0.65))]); }, rand(3.2, 4.5)));
  }
  for (let i = 0; i < 8; i++) {
    const o = icon('CO₂', '#b9bec7'); o.scale.setScalar(0.13); g.add(o);
    movers.push(new Mover(o, () => { const c = caps[(Math.random() * caps.length) | 0]; return new THREE.CatmullRomCurve3([c.getPointAt(rand(0.2, 0.45)), sacPoint(), V(-0.4, 0.38, 0.05), V(-0.95, 0.9, 0.05)]); }, rand(3.5, 5)));
  }
  return { group: g, update: (dt) => { updRBC(dt); movers.forEach((m) => m.update(dt)); },
    labels: [[['Alveoli', 'एल्वियोली (वायु कोष)'], V(0.15, 0.62, 0.3)], [['Capillary', 'केशिका'], V(0.62, -0.45, 0.3)], [['Oxygen → blood', 'ऑक्सीजन → खून'], V(-0.6, -0.15, 0.5), '#9fe3ff'], [['CO₂ → air', 'CO₂ → हवा'], V(-0.75, 0.78, 0.2), '#c9ced6']],
    title: ['Alveoli × 500', 'एल्वियोली × 500'] };
}

function villi() {
  const g = new THREE.Group(); const movers = [];
  const wallG = new THREE.BoxGeometry(2.0, 0.22, 1.2, 30, 2, 12);
  const wp = wallG.attributes.position; for (let i = 0; i < wp.count; i++) { const x = wp.getX(i), z = wp.getZ(i); wp.setY(i, wp.getY(i) + 0.05 * Math.sin(x * 3) * Math.cos(z * 2)); }
  wallG.computeVertexNormals();
  const wall = new THREE.Mesh(wallG, std('#d9858c', 0.6)); wall.position.y = -0.82; g.add(wall);
  const vm = glass('#f2a3a0', 0.22, 0.9);
  const xs = [-0.72, -0.36, 0, 0.36, 0.72];
  const caps = []; const lact = [];
  xs.forEach((x, i) => {
    const z = (i % 2 ? 0.2 : -0.15);
    const h = 1.1 + (i % 2) * 0.12;
    const v = new THREE.Mesh(new THREE.CapsuleGeometry(0.14, h, 8, 20), vm); v.position.set(x, -0.72 + h / 2, z); g.add(v);
    const top = -0.72 + h + 0.05;
    const up = tube([V(x - 0.08, -0.85, z), V(x - 0.08, top - 0.25, z), V(x - 0.03, top - 0.08, z)], 0.022, std('#e3202c', 0.4, '#300000'));
    const dn = tube([V(x + 0.03, top - 0.08, z), V(x + 0.08, top - 0.25, z), V(x + 0.08, -0.85, z)], 0.022, std('#5b3fd0', 0.4, '#100830'));
    const l = tube([V(x, top - 0.18, z - 0.02), V(x, -0.85, z - 0.02)], 0.018, std('#f3efe6', 0.4, '#202020'));
    g.add(up, dn, l);
    caps.push(new THREE.CatmullRomCurve3([V(x + 0.03, top - 0.06, z), V(x + 0.08, top - 0.25, z), V(x + 0.08, -0.9, z)]));
    lact.push(new THREE.CatmullRomCurve3([V(x, top - 0.2, z - 0.02), V(x, -0.9, z - 0.02)]));
  });
  const kinds = [['G', '#ffd34d', 'hex'], ['A', '#8fd96a', 'circle'], ['F', '#fff3d6', 'circle']];
  for (let i = 0; i < 18; i++) {
    const [txt, col, sh] = kinds[i % 3];
    const o = icon(txt, col, '#0d1118', sh); o.scale.setScalar(0.1); g.add(o);
    movers.push(new Mover(o, () => {
      const k = (Math.random() * xs.length) | 0; const x = xs[k];
      const path = txt === 'F' ? lact[k] : caps[k];
      const pts = [V(x + rand(-0.4, 0.4), 0.95, rand(-0.3, 0.3)), V(x + rand(-0.1, 0.1), 0.62, 0)];
      for (let j = 0; j <= 4; j++) pts.push(path.getPointAt(j / 4));
      return new THREE.CatmullRomCurve3(pts);
    }, rand(4, 6)));
  }
  // chyme flowing past in the lumen
  for (let i = 0; i < 10; i++) {
    const o = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTexture(), color: '#e9c08a', transparent: true, depthWrite: false, opacity: 0.7 }));
    o.scale.setScalar(0.12); g.add(o);
    movers.push(new Mover(o, () => { const y = rand(0.55, 0.95), z = rand(-0.4, 0.4); return new THREE.CatmullRomCurve3([V(-1.1, y, z), V(0, y - 0.05, z), V(1.1, y, z)]); }, rand(5, 8), { alpha: 0.7 }));
  }
  return { group: g, update: (dt) => movers.forEach((m) => m.update(dt)),
    labels: [[['Villus', 'रसांकुर (विलस)'], V(-0.36, 0.7, 0.4)], [['Blood capillary', 'रक्त केशिका'], V(0.6, -0.15, 0.4)], [['Glucose', 'ग्लूकोज़'], V(-0.85, 0.85, 0.2), '#ffd34d'], [['Amino acid', 'अमीनो अम्ल'], V(0.75, 0.85, 0.2), '#8fd96a']],
    title: ['Villi × 300', 'रसांकुर × 300'] };
}

function cell() {
  const g = new THREE.Group(); const movers = [];
  const mem = new THREE.Mesh(new THREE.SphereGeometry(0.78, 40, 28), glass('#8fd6c6', 0.1, 0.8)); mem.position.set(0.05, 0.12, 0); g.add(mem);
  const cyto = new THREE.Mesh(new THREE.SphereGeometry(0.74, 32, 24), glass('#d8f1ea', 0.04, 0.12)); cyto.position.copy(mem.position); g.add(cyto);
  const nuc = new THREE.Mesh(new THREE.SphereGeometry(0.24, 32, 24), std('#7d5ac8', 0.45, '#1c0f3a')); nuc.position.set(-0.28, 0.32, -0.1); g.add(nuc);
  const nl = new THREE.Mesh(new THREE.SphereGeometry(0.08, 16, 12), std('#4b2f8f', 0.4)); nl.position.set(-0.24, 0.36, 0.08); g.add(nl);
  // mitochondria: outer capsule + folded inner cristae
  const mitos = [];
  const mp = [[V(0.32, 0.38, 0.12), 0.6], [V(0.3, -0.15, 0.2), -0.4], [V(-0.25, -0.25, 0.25), 1.1], [V(0.1, 0.05, -0.38), 0.2]];
  mp.forEach(([p, rot]) => {
    const mg = new THREE.Group(); mg.position.copy(p); mg.rotation.z = rot; mg.rotation.y = rot * 0.5;
    const outer = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.26, 8, 18), std('#e8743c', 0.45, '#3a1200', { transparent: true, opacity: 0.55, depthWrite: false }));
    outer.rotation.z = Math.PI / 2; mg.add(outer);
    const crG = new THREE.PlaneGeometry(0.34, 0.15, 40, 6);
    const cp = crG.attributes.position; for (let i = 0; i < cp.count; i++) { const x = cp.getX(i), y = cp.getY(i); cp.setZ(i, 0.05 * Math.sin(x * 55) * (1 - Math.abs(y) * 4)); cp.setY(i, y * (1 - (x / 0.2) ** 2 * 0.6)); }
    crG.computeVertexNormals();
    const cr = new THREE.Mesh(crG, std('#ffb36b', 0.4, '#5a2400', { side: THREE.DoubleSide })); cr.rotation.x = Math.PI / 2; mg.add(cr);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTexture(), color: '#ffb347', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 }));
    glow.scale.setScalar(0.45); mg.add(glow);
    mg.userData.glow = glow; mg.userData.flash = 0;
    g.add(mg); mitos.push(mg);
  });
  // capillary below the cell
  const capC = [V(-1.05, -0.78, 0.25), V(-0.3, -0.85, 0.3), V(0.4, -0.8, 0.25), V(1.05, -0.7, 0.2)];
  const capm = tube(capC, 0.09, gradientTubeMat('#e3202c', '#7a2a6e')); g.add(capm);
  const cap = capm.userData.curve;
  const N = 10; const rbc = new THREE.InstancedMesh(RBC_GEOM, std('#c2202a', 0.35, '#300000'), N); g.add(rbc);
  const st = Array.from({ length: N }, () => Math.random());
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = V(0.15, 0.15, 0.15);
  const mitoWorld = (m) => m.position.clone();
  // glucose + O2 go to a mitochondrion, it flashes, ATP sparks fly out, CO2 + H2O leave
  const spawnIn = (txt, col, shape) => {
    const o = icon(txt, col, '#0d1118', shape); o.scale.setScalar(0.11); g.add(o);
    let target;
    movers.push(new Mover(o, () => { target = mitos[(Math.random() * mitos.length) | 0]; const a = cap.getPointAt(rand(0.15, 0.6)); return new THREE.CatmullRomCurve3([a, V(a.x * 0.6, -0.45, 0.3), mitoWorld(target).add(V(0, 0.02, 0.05))]); }, rand(3, 4.2),
      { onRespawn: () => {}, onUpdate: (mv) => { if (mv.t > 0.97 && target) target.userData.flash = 1; } }));
  };
  for (let i = 0; i < 6; i++) spawnIn('G', '#ffd34d', 'hex');
  for (let i = 0; i < 6; i++) spawnIn('O₂', '#9fe3ff', 'circle');
  for (let i = 0; i < 10; i++) {
    const o = icon('ATP', '#ffcf3d', '#3a2400', 'star'); o.scale.setScalar(0.13); g.add(o);
    movers.push(new Mover(o, () => { const m = mitos[(Math.random() * mitos.length) | 0]; const p = m.position.clone(); return new THREE.CatmullRomCurve3([p, p.clone().add(new THREE.Vector3().randomDirection().multiplyScalar(0.35))]); }, rand(1.6, 2.4)));
  }
  for (let i = 0; i < 5; i++) {
    const co = i % 2 === 0;
    const o = co ? icon('CO₂', '#b9bec7') : icon('H₂O', '#5fb6ff', '#06203a', 'drop'); o.scale.setScalar(0.12); g.add(o);
    movers.push(new Mover(o, () => { const m = mitos[(Math.random() * mitos.length) | 0]; return new THREE.CatmullRomCurve3([m.position.clone(), V(0.4, -0.5, 0.3), cap.getPointAt(rand(0.65, 0.95))]); }, rand(3, 4)));
  }
  return { group: g, update: (dt, t) => {
    for (let i = 0; i < N; i++) { st[i] = (st[i] + dt * 0.12) % 1; const p = cap.getPointAt(st[i]); q.setFromUnitVectors(V(0, 1, 0), cap.getTangentAt(st[i])); m4.compose(p, q, sc); rbc.setMatrixAt(i, m4); }
    rbc.instanceMatrix.needsUpdate = true;
    mitos.forEach((m) => { m.userData.flash = Math.max(0, m.userData.flash - dt * 1.4); const f = m.userData.flash; m.userData.glow.material.opacity = 0.25 + 0.75 * f; m.userData.glow.scale.setScalar(0.4 + 0.35 * f); m.children[1].material.emissive.setRGB(0.35 + 0.8 * f, 0.14 + 0.35 * f, 0.0); });
    movers.forEach((m) => m.update(dt));
  },
    labels: [[['Mitochondria (power-house)', 'माइटोकॉन्ड्रिया (पावर-हाउस)'], V(0.45, 0.75, 0.3), '#ffb36b'], [['Nucleus', 'केंद्रक'], V(-0.45, 0.68, 0.1)], [['Capillary', 'केशिका'], V(-0.7, -0.98, 0.3)],
      [['Glucose + O₂ → Energy (ATP) + CO₂ + H₂O', 'ग्लूकोज़ + O₂ → ऊर्जा (ATP) + CO₂ + H₂O'], V(0, -1.22, 0.2), '#ffcf3d', true]],
    title: ['Body cell × 2000', 'शरीर की कोशिका × 2000'] };
}

function capillary() {
  const g = new THREE.Group(); const movers = [];
  const cellsP = [];
  for (let i = 0; i < 10; i++) {
    const x = -0.85 + (i % 5) * 0.42, top = i < 5;
    const geo = new THREE.SphereGeometry(0.2, 20, 14); geo.scale(1.0, 0.75, 0.9);
    const c = new THREE.Mesh(geo, std(top ? '#e7a99a' : '#dc9b8e', 0.6)); c.position.set(x + rand(-0.04, 0.04), top ? 0.42 : -0.42, rand(-0.15, 0.1)); g.add(c);
    const n = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 10), std('#7d5ac8', 0.5)); n.position.copy(c.position).add(V(0, 0, 0.12)); g.add(n);
    cellsP.push(c.position);
  }
  const capPts = [V(-1.15, 0.02, 0), V(-0.4, -0.04, 0.05), V(0.4, 0.05, 0), V(1.15, -0.02, 0)];
  const capm = tube(capPts, 0.13, gradientTubeMat('#e3202c', '#6a2a7a')); g.add(capm);
  const cap = capm.userData.curve;
  const N = 16; const rbc = new THREE.InstancedMesh(RBC_GEOM, std('#ffffff', 0.35, '#200000'), N); g.add(rbc);
  const st = Array.from({ length: N }, (_, i) => i / N);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = V(0.2, 0.2, 0.2);
  for (let i = 0; i < 9; i++) {
    const o = icon('O₂', '#9fe3ff'); o.scale.setScalar(0.11); g.add(o);
    movers.push(new Mover(o, () => { const c = cellsP[(Math.random() * cellsP.length) | 0]; return new THREE.CatmullRomCurve3([cap.getPointAt(rand(0.1, 0.5)), c.clone()]); }, rand(2.2, 3.2)));
  }
  for (let i = 0; i < 7; i++) {
    const o = icon('CO₂', '#b9bec7'); o.scale.setScalar(0.12); g.add(o);
    movers.push(new Mover(o, () => { const c = cellsP[(Math.random() * cellsP.length) | 0]; return new THREE.CatmullRomCurve3([c.clone(), cap.getPointAt(rand(0.5, 0.9))]); }, rand(2.4, 3.4)));
  }
  return { group: g, update: (dt) => {
    for (let i = 0; i < N; i++) { st[i] = (st[i] + dt * 0.1) % 1; const p = cap.getPointAt(st[i]); q.setFromUnitVectors(V(0, 1, 0), cap.getTangentAt(st[i])); m4.compose(p, q, sc); rbc.setMatrixAt(i, m4); rbc.setColorAt(i, lerpColor('#e3202c', '#6a2a7a', THREE.MathUtils.smoothstep(st[i], 0.3, 0.8))); }
    rbc.instanceMatrix.needsUpdate = true; if (rbc.instanceColor) rbc.instanceColor.needsUpdate = true;
    movers.forEach((m) => m.update(dt));
  },
    labels: [[['Capillary', 'केशिका'], V(-0.8, 0.1, 0.35)], [['Body cells', 'शरीर की कोशिकाएँ'], V(0.55, 0.72, 0.2)], [['O₂ to cells', 'O₂ कोशिकाओं को'], V(-0.3, -0.75, 0.3), '#9fe3ff'], [['CO₂ to blood', 'CO₂ खून में'], V(0.6, -0.75, 0.3), '#c9ced6']],
    title: ['Capillary × 1000', 'केशिका × 1000'] };
}

function nephron() {
  const g = new THREE.Group(); const movers = [];
  const glomC = V(-0.5, 0.48, 0);
  // Bowman's capsule
  const capG = new THREE.SphereGeometry(0.27, 30, 20, 0, Math.PI * 2, 0, Math.PI * 0.78);
  const capsule = new THREE.Mesh(capG, glass('#f6e3a6', 0.18, 0.85)); capsule.position.copy(glomC); capsule.rotation.z = -Math.PI * 0.62; g.add(capsule);
  // glomerulus tangle
  const gp = []; for (let i = 0; i < 46; i++) { const a = i * 0.9, b = i * 0.37; gp.push(glomC.clone().add(V(0.15 * Math.sin(a) * Math.cos(b), 0.15 * Math.cos(a * 1.3), 0.15 * Math.sin(b * 1.7)))); }
  const glom = tube(gp, 0.022, std('#d0303a', 0.4, '#400000'), 400); g.add(glom);
  const aff = tube([V(-1.05, 0.95, 0.1), V(-0.8, 0.75, 0.05), gp[0]], 0.045, std('#e3202c', 0.4, '#400000')); g.add(aff);
  const eff = tube([gp[gp.length - 1], V(-0.55, 0.85, -0.05), V(-0.2, 0.95, -0.1), V(0.3, 0.85, -0.25), V(0.95, 0.75, -0.3)], 0.04, std('#a02a5a', 0.4, '#300010')); g.add(eff);
  // tubule: proximal convoluted -> loop of Henle -> distal -> collecting duct
  const tp = [glomC.clone().add(V(0.2, -0.12, 0)), V(-0.15, 0.25, 0.1), V(-0.05, 0.45, 0.15), V(0.12, 0.3, 0.05), V(0.05, 0.12, 0.1), V(0.15, -0.05, 0.08), V(0.15, -0.5, 0.08), V(0.17, -0.92, 0.05), V(0.32, -0.95, 0.05), V(0.35, -0.5, 0.05), V(0.36, 0.05, 0.08), V(0.3, 0.3, 0.12), V(0.5, 0.42, 0.1), V(0.62, 0.3, 0.05), V(0.7, 0.2, 0.0)];
  const tub = tube(tp, 0.05, glass('#f2d27a', 0.35, 0.95)); g.add(tub);
  const cd = tube([V(0.7, 0.2, 0.0), V(0.75, 0.6, 0), V(0.78, 0.95, 0)], 0.06, glass('#f2d27a', 0.35, 0.95));
  const cd2 = tube([V(0.7, 0.2, 0.0), V(0.74, -0.4, 0), V(0.75, -1.0, 0)], 0.065, glass('#f0c85a', 0.4, 0.95)); g.add(cd, cd2);
  const tubC = tub.userData.curve, glomCurve = glom.userData.curve;
  const urine = new THREE.CatmullRomCurve3([V(0.7, 0.2, 0), V(0.74, -0.4, 0), V(0.75, -1.0, 0)]);
  // blood cells through the glomerulus
  for (let i = 0; i < 12; i++) {
    const o = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTexture(), color: '#ff4050', transparent: true, depthWrite: false })); o.scale.setScalar(0.07); g.add(o);
    movers.push(new Mover(o, () => { const pts = [V(-1.05, 0.95, 0.1), V(-0.8, 0.75, 0.05)]; for (let j = 0; j <= 12; j++) pts.push(glomCurve.getPointAt(j / 12)); pts.push(V(-0.2, 0.95, -0.1), V(0.95, 0.75, -0.3)); return new THREE.CatmullRomCurve3(pts); }, rand(4, 5)));
  }
  // filtrate along the tubule, then urine
  const kinds = [['U', '#ffd34d', 'circle'], ['G', '#ffe68a', 'hex'], ['H₂O', '#5fb6ff', 'drop'], ['Na', '#d9e2ea', 'circle']];
  for (let i = 0; i < 16; i++) {
    const [txt, col, sh] = kinds[i % 4];
    const o = icon(txt, col, '#0d1118', sh); o.scale.setScalar(0.085); g.add(o);
    const reabsorb = txt !== 'U' && Math.random() < 0.75;
    movers.push(new Mover(o, () => {
      const pts = [glomC.clone().add(V(rand(-0.05, 0.05), rand(-0.05, 0.05), 0)), glomC.clone().add(V(0.2, -0.12, 0))];
      const stop = reabsorb ? rand(0.15, 0.7) : 1;
      for (let j = 1; j <= 14; j++) { const tt = j / 14 * stop; pts.push(tubC.getPointAt(tt)); }
      if (reabsorb) pts.push(pts[pts.length - 1].clone().add(V(0, 0.15, -0.25)), V(0.3, 0.8, -0.25));
      else { pts.push(V(0.74, -0.4, 0), V(0.75, -1.0, 0)); }
      return new THREE.CatmullRomCurve3(pts);
    }, rand(6, 8)));
  }
  return { group: g, update: (dt) => movers.forEach((m) => m.update(dt)),
    labels: [[['Glomerulus', 'ग्लोमेरुलस (केशिका गुच्छ)'], V(-0.75, 0.15, 0.3)], [['Tubule takes back useful things', 'नलिका काम की चीज़ें वापस लेती है'], V(-0.1, -0.35, 0.35)], [['Loop of Henle', 'हेनले लूप'], V(0.25, -1.08, 0.2)], [['Urine', 'मूत्र'], V(0.95, -0.7, 0.2), '#ffd34d'], [['U = urea (waste)', 'U = यूरिया (अपशिष्ट)'], V(0.5, 1.02, 0.1), '#ffd34d']],
    title: ['Nephron × 200', 'नेफ्रॉन × 200'] };
}

let kidneyGLB = null;
async function loadKidney() {
  if (kidneyGLB) return kidneyGLB;
  const l = new GLTFLoader(); l.setMeshoptDecoder(MeshoptDecoder);
  kidneyGLB = await l.loadAsync(asset('./models/kidney.glb'));
  return kidneyGLB;
}
function kidney() {
  const g = new THREE.Group(); const movers = [];
  const inner = new THREE.Group(); inner.scale.setScalar(13); inner.rotation.y = -0.35; g.add(inner);
  const localPlane = new THREE.Plane(V(0, 0, -1), 0.002);
  const clip = [localPlane.clone()];
  const mats = {
    k_capsule: glass('#f0d6c8', 0.06, 0.4), k_cortex: std('#b4544a', 0.55), k_columns: std('#c7685a', 0.55),
    k_pyramids: std('#7b2630', 0.5, '#200008'), k_papillae: std('#8e3440', 0.5), k_calyces: std('#ecd08a', 0.45), k_pelvis: std('#f0d27c', 0.45),
    k_ureter: std('#f0d27c', 0.45), k_renal_vein: std('#3557c4', 0.4), k_renal_artery: std('#d1232f', 0.4),
  };
  const anchors = {};
  loadKidney().then((gltf) => {
    const list = []; gltf.scene.updateMatrixWorld(true);
    gltf.scene.traverse((o) => { if (o.isMesh) list.push(o); });
    list.forEach((o) => {
      bakeMesh(o);
      const name = o.name.replace(/_\d+$/, '');
      const m = (mats[name] || std('#999999')).clone();
      if (name !== 'k_capsule') { m.clippingPlanes = clip; m.side = THREE.DoubleSide; }
      const mesh = new THREE.Mesh(o.geometry, m); mesh.userData.part = name; inner.add(mesh);
      o.geometry.computeBoundingBox(); anchors[name] = o.geometry.boundingBox.getCenter(V(0, 0, 0));
    });
    // renal artery (drawn, HRA artery does not reach the hilum)
    const art = tube([V(-0.075, 0.006, 0.03), V(-0.045, 0.005, 0.026), V(-0.022, 0.002, 0.02)], 0.0022, mats.k_renal_artery); inner.add(art);
    // urine: papillae -> pelvis -> ureter
    const pel = anchors.k_pelvis || V(-0.008, -0.004, 0.019);
    for (let i = 0; i < 14; i++) {
      const o = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTexture(), color: '#ffe066', transparent: true, depthWrite: false })); o.scale.setScalar(0.06); g.add(o);
      movers.push(new Mover(o, () => {
        const a = V(rand(-0.01, 0.012), rand(-0.025, 0.027), rand(-0.004, 0.0)).multiplyScalar(13).applyAxisAngle(V(0, 1, 0), -0.35);
        const b = pel.clone().multiplyScalar(13).applyAxisAngle(V(0, 1, 0), -0.35);
        const c = V(-0.02, -0.03, 0.035).multiplyScalar(13).applyAxisAngle(V(0, 1, 0), -0.35);
        const d = V(-0.03, -0.085, 0.04).multiplyScalar(13).applyAxisAngle(V(0, 1, 0), -0.35);
        return new THREE.CatmullRomCurve3([a, b, c, d]);
      }, rand(3, 4.5)));
    }
  });
  return { group: g, update: (dt) => { inner.updateMatrixWorld(true); clip[0].copy(localPlane).applyMatrix4(inner.matrixWorld); movers.forEach((m) => m.update(dt)); }, clip: true,
    labels: [[['Cortex', 'कॉर्टेक्स (वल्कुट)'], V(0.45, 0.62, 0.25)], [['Pyramids (medulla)', 'पिरामिड (मेडुला)'], V(0.52, -0.1, 0.3)], [['Renal pelvis', 'वृक्क श्रोणि'], V(-0.5, 0.25, 0.4), '#f0d27c'], [['Ureter', 'मूत्रवाहिनी'], V(-0.55, -0.95, 0.3), '#f0d27c'], [['Renal vein', 'वृक्क शिरा'], V(-0.95, 0.4, 0.2), '#7f9bff']],
    title: ['Kidney cut open × 4', 'गुर्दे का भीतरी भाग × 4'] };
}

function neuron() {
  const g = new THREE.Group(); const movers = [];
  const soma = new THREE.Mesh(new THREE.IcosahedronGeometry(0.17, 3), std('#b49cf0', 0.45, '#2a1a50')); soma.position.set(-0.7, 0.55, 0); g.add(soma);
  const nuc = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 12), std('#5a3a9a', 0.4)); nuc.position.copy(soma.position).add(V(0.02, 0.02, 0.12)); g.add(nuc);
  for (let i = 0; i < 7; i++) {
    const a = i / 7 * Math.PI * 2; const d = V(Math.cos(a), Math.sin(a), rand(-0.4, 0.4)).normalize();
    g.add(tube([soma.position.clone(), soma.position.clone().add(d.clone().multiplyScalar(0.28)), soma.position.clone().add(d.clone().multiplyScalar(0.45)).add(V(rand(-0.1, 0.1), rand(-0.1, 0.1), 0))], 0.022, std('#b49cf0', 0.5, '#1a0f30'), 30));
  }
  const axPts = [V(-0.55, 0.45, 0), V(-0.2, 0.15, 0.05), V(0.2, -0.15, 0.0), V(0.55, -0.45, -0.05), V(0.75, -0.62, -0.05)];
  const ax = tube(axPts, 0.025, std('#d8c8ff', 0.45, '#1a0f30'), 80); g.add(ax);
  const axC = ax.userData.curve;
  for (let i = 0; i < 7; i++) { const t = 0.08 + i * 0.12; const p = axC.getPointAt(t); const m = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.07, 6, 12), std('#f3efe6', 0.5)); m.position.copy(p); m.quaternion.setFromUnitVectors(V(0, 1, 0), axC.getTangentAt(t)); g.add(m); }
  // muscle fibres
  for (let i = 0; i < 5; i++) { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 1.0, 16), std('#c2463e', 0.6)); m.rotation.z = Math.PI / 2 + 0.5; m.position.set(0.55 + i * 0.04, -0.8 + i * 0.06, -0.15 + i * 0.07); g.add(m); }
  for (let i = 0; i < 3; i++) {
    const o = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTexture(), color: '#fff3a0', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); o.scale.setScalar(0.22); g.add(o);
    movers.push(new Mover(o, () => new THREE.CatmullRomCurve3([soma.position.clone(), ...axPts.slice(1)]), 1.6, { t0: i / 3 }));
  }
  return { group: g, update: (dt) => movers.forEach((m) => m.update(dt)),
    labels: [[['Neuron', 'तंत्रिका कोशिका (न्यूरॉन)'], V(-0.75, 0.88, 0.2)], [['Electric signal', 'विद्युत संकेत'], V(0.1, 0.25, 0.3), '#fff3a0'], [['Muscle', 'मांसपेशी'], V(0.8, -0.35, 0.2)]],
    title: ['Nerve cell × 1000', 'तंत्रिका कोशिका × 1000'] };
}

const BUILDERS = { alveoli, villi, cell, capillary, nephron, kidney, neuron };

// The bubble frame that hosts a scene
export class Magnifier {
  constructor() {
    this.group = new THREE.Group();
    this.group.visible = false;
    const shell = new THREE.Mesh(new THREE.SphereGeometry(1.28, 48, 32), glass('#bfe3ff', 0.035, 0.55, { side: THREE.FrontSide }));
    shell.renderOrder = 14;
    this.ring = new THREE.Mesh(new THREE.TorusGeometry(1.29, 0.012, 8, 96), new THREE.MeshBasicMaterial({ color: '#d9ecff', transparent: true, opacity: 0.55 }));
    this.group.add(shell, this.ring);
    this.content = new THREE.Group(); this.group.add(this.content);
    this.labels = new THREE.Group(); this.group.add(this.labels);
    this.cache = {};
    this.scene = null;
    this.lang = 'en';
    this.connector = new THREE.Line(new THREE.BufferGeometry().setFromPoints([V(0, 0, 0), V(0, 0, 0)]), new THREE.LineDashedMaterial({ color: '#d9ecff', dashSize: 0.02, gapSize: 0.015, transparent: true, opacity: 0.7, depthTest: false }));
    this.connector.renderOrder = 20;
    this.fade = 0;
  }
  show(id, lang) {
    this.lang = lang;
    if (this.scene) { this.content.remove(this.scene.group); }
    this.labels.clear();
    if (!id) { this.scene = null; this.group.visible = false; return; }
    if (!this.cache[id]) this.cache[id] = BUILDERS[id]();
    this.scene = this.cache[id];
    this.content.add(this.scene.group);
    this.group.visible = true;
    this.fade = 0;
    this.buildLabels();
  }
  buildLabels() {
    this.labels.clear();
    if (!this.scene) return;
    const L = this.lang;
    const tl = new Label([L === 'hi' ? this.scene.title[1] : this.scene.title[0]], { height: 0.16, leader: false, big: 30, cy: 0, color: '#ffffff', bg: 'rgba(20,32,48,0.9)', border: 'rgba(191,227,255,0.6)' });
    tl.position.set(0, 1.32, 0); tl.layout(); this.labels.add(tl);
    for (const [txt, p, col, wide] of this.scene.labels) {
      const lines = L === 'hi' ? [txt[1]] : [txt[0]];
      const lb = new Label(lines, { height: wide ? 0.12 : 0.11, leader: false, color: col ?? '#f5f1ea', big: 26, cy: 0.5 });
      lb.position.copy(p); lb.layout(); this.labels.add(lb);
    }
  }
  setLang(l) { this.lang = l; this.buildLabels(); }
  update(dt, t, camera) {
    if (!this.scene) return;
    this.fade = Math.min(1, this.fade + dt * 1.5);
    this.scene.update(dt, t);
    this.content.rotation.y = Math.sin(t * 0.15) * 0.25;
    if (camera) { this.ring.quaternion.copy(camera.getWorldQuaternion(new THREE.Quaternion())); const inv = this.group.getWorldQuaternion(new THREE.Quaternion()).invert(); this.ring.quaternion.premultiply(inv); }
    const s = THREE.MathUtils.smoothstep(this.fade, 0, 1);
    this.content.scale.setScalar(0.2 + 0.8 * s);
  }
}
