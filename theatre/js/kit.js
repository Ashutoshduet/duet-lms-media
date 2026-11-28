// "Kyun?" theatre: the building blocks a story uses (real places, models, materials, labels, particles) and the
// timeline actions. A story never imports three.js itself: it gets everything through this kit (K), so its file stays a
// few KB of script and Node can read its text for the narration generator.
//
// Timeline rule: the picture is a pure function of the story time T. Every frame the tracked properties go back to
// their starting values, then every action that has started is applied in order, then the "ticks" run. So the story
// can be paused, scrubbed backwards or forwards and resumed at any point.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';

export { THREE };
export const FONT = '"Noto Sans Devanagari", "Noto Sans", system-ui, sans-serif';

// ------------------------------------------------------------------ real places (Poly Haven 360° photos, CC0)
// The photos live in the Maths Lab's folder (../maths/places/); the numbers (camera height h, photo radius r, turn yaw,
// sun direction and light) are the Science Lab's own measurements (science/js/places.js and its worlds).
export const PLACES = {
  courtyard: { img: 'quadrangle_sunny', h: 1.7, r: 60, sun: [0.42, 0.855, 0.305], sunI: 2.4, sky: 0.25, env: 1.0 },
  farm: { img: 'citrus_orchard_road', h: 1.6, r: 60, yaw: 1.492, sun: [0.712, 0.603, 0.359], sunI: 1.1, sky: 0.45, env: 1.0 },
  field: { img: 'farm_field', h: 1.6, r: 60, sun: [0.505, 0.779, 0.372], sunI: 1.3, sky: 0.45, env: 1.0 },
  playground: { img: 'suburban_football_field', h: 1.7, r: 60, yaw: -0.094, sun: [0.069, 0.767, 0.638], sunI: 0.9, sky: 0.5, env: 1.1 },
  pond: { img: 'limpopo_golf_course', h: 1.6, r: 60, yaw: 1.32, sun: [0.716, 0.461, 0.524], sunI: 2.0, sky: 0.32, env: 1.0 },
  grass: { img: 'countrytrax_midday', h: 1.6, r: 60, yaw: 0.4, sun: [0.229, 0.959, 0.166], sunI: 2.2, sky: 0.3, env: 1.0 },
  forest: { img: 'river_walk_1', h: 1.6, r: 30, yaw: 1.571, sun: [0.691, 0.323, 0.647], sunI: 0.7, sky: 0.55, env: 1.15 },
  beach: { img: 'spiaggia_di_mondello', h: 1.6, r: 60, sun: [0.728, 0.427, 0.536], sunI: 2.2, sky: 0.3, env: 1.0 },
  rail: { img: 'bloem_train_track_clear', h: 1.6, r: 60, yaw: 2.119, sun: [0.796, 0.156, 0.585], sunI: 2.0, sky: 0.3, env: 1.0 },
  home: { img: 'kiara_interior', h: 1.45, r: 9, sun: [0.702, 0.184, -0.688], sunI: 0.8, sky: 0.4, env: 1.0 },
  hall: { img: 'church_meeting_room', h: 1.45, r: 12, sun: [0.865, 0.305, 0.399], sunI: 0.9, sky: 0.35, env: 0.9 },
};
export const PLACE_DIR = '../maths/places/';

// the photo sky: the photo all around, its ground projected under your feet. "night" darkens the photo and puts the
// real star map (NASA SVS Deep Star Maps, in the Solar System app) in place of its sky; "storm" greys it; "flash" lights
// it up (lightning); "warm" turns it towards autumn.
const SKY_VS = `varying vec2 vUv; varying vec3 vDir;
void main(){ vUv = uv; vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const SKY_FS = `uniform sampler2D map; uniform sampler2D stars; uniform float night, storm, flash, warm, starsOn; uniform vec3 tint;
varying vec2 vUv; varying vec3 vDir;
#include <common>
void main(){
  vec3 c = texture2D(map, vUv).rgb;
  float l = dot(c, vec3(0.299, 0.587, 0.114));
  // the photo's own sky: bright and bluish (or white cloud) above the horizon
  float up = smoothstep(-0.02, 0.10, vDir.y);
  float skyish = up * smoothstep(0.22, 0.45, l) * smoothstep(-0.03, 0.06, c.b - c.r + 0.04);
  vec3 grey = vec3(l);
  // storm: grey-blue, darker, heavy clouds
  vec3 s = mix(c, grey * vec3(0.78, 0.84, 0.95), 0.75) * mix(0.55, 0.38, skyish);
  c = mix(c, s, storm);
  // autumn: greens towards gold
  float green = clamp((c.g - max(c.r, c.b)) * 4.0, 0.0, 1.0);
  c = mix(c, c * vec3(1.35, 1.0, 0.55) + vec3(0.06, 0.02, 0.0) * green, warm * green);
  // night: moonlit land, a star sky where the photo had sky
  vec3 n = grey * vec3(0.10, 0.13, 0.22) * 0.55;
  vec3 d = normalize(vDir); vec2 su = vec2(atan(d.z, d.x) / 6.2831853 + 0.5, asin(clamp(d.y, -1.0, 1.0)) / 3.14159265 + 0.5);
  vec3 st = texture2D(stars, su).rgb * 1.6 * starsOn + vec3(0.004, 0.007, 0.018);
  n = mix(n, st, skyish * starsOn);
  c = mix(c, n, night);
  c *= tint;
  c += flash * vec3(0.55, 0.6, 0.85) * (0.35 + 0.65 * up);
  gl_FragColor = vec4(c, 1.0);
  #include <colorspace_fragment>
}`;

function skyGeometry(height, radius, res = 48) {
  // the same ground-projected sphere as three's GroundedSkybox (MIT), built here so it can carry its own shader
  const g = new THREE.SphereGeometry(radius, 2 * res, res); g.scale(1, 1, -1);
  const pos = g.getAttribute('position'), v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    if (v.y < 0) { const y1 = -height * 3 / 2; const f = v.y < y1 ? -height / v.y : (1 - v.y * v.y / (3 * y1 * y1)); v.multiplyScalar(f); v.toArray(pos.array, 3 * i); }
  }
  return g;
}

// ------------------------------------------------------------------ loading (one cache for the whole theatre)
const gltf = new GLTFLoader(); gltf.setMeshoptDecoder(MeshoptDecoder);
const texL = new THREE.TextureLoader();
const CACHE = new Map();
export const LOADED = []; // every file a story loaded (the tests check them)
function once(key, make) { if (!CACHE.has(key)) CACHE.set(key, make().then((v) => { LOADED.push(key); return v; })); return CACHE.get(key); }
export const loadGLB = (url) => once(url, () => gltf.loadAsync(url));
export const loadTex = (url, srgb = true) => once(url, () => texL.loadAsync(url).then((t) => { if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }));
export const loadHDR = (url) => once(url, () => new RGBELoader().loadAsync(url));

// ------------------------------------------------------------------ small canvas textures
export function canvasTex(w, h, draw, srgb = true) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
let BLOB = null; // a soft contact shadow
export function blobTex() { return BLOB || (BLOB = canvasTex(128, 128, (x, w) => { const g = x.createRadialGradient(64, 64, 4, 64, 64, 62); g.addColorStop(0, 'rgba(0,0,0,0.62)'); g.addColorStop(0.45, 'rgba(0,0,0,0.32)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, w, w); })); }
let GLOW = null; // a soft round glow (sprites, sun, sparks)
export function glowTex() { return GLOW || (GLOW = canvasTex(128, 128, (x, w) => { const g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.2, 'rgba(255,255,255,0.8)'); g.addColorStop(0.5, 'rgba(255,255,255,0.18)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, w, w); })); }
// sunlight focused by a glass of water on a table (the bright wavy net): drawn once, scrolled in the shader
let CAUS = null;
export function causticTex() {
  return CAUS || (CAUS = canvasTex(256, 256, (x, w, h) => {
    x.fillStyle = '#000'; x.fillRect(0, 0, w, h); x.globalCompositeOperation = 'lighter';
    let s = 7; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
    const pts = Array.from({ length: 26 }, () => [rnd() * w, rnd() * h]);
    const img = x.getImageData(0, 0, w, h), d = img.data;
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      let a = 1e9, b = 1e9;
      for (const [px, py] of pts) for (const ox of [-w, 0, w]) for (const oy of [-h, 0, h]) { const dd = Math.hypot(i - px - ox, j - py - oy); if (dd < a) { b = a; a = dd; } else if (dd < b) b = dd; }
      const e = Math.max(0, 1 - (b - a) / 7); const v = Math.pow(e, 2.2) * 255; const k = (j * w + i) * 4; d[k] = v; d[k + 1] = v; d[k + 2] = v; d[k + 3] = 255;
    }
    x.putImageData(img, 0, 0);
  }, false));
}

// ------------------------------------------------------------------ materials
// glass: clear, a little reflection of the real place, brighter at the edges (Fresnel). Standard, not Physical: no
// transmission pass on a phone.
export function glassMat(o = {}) {
  const m = new THREE.MeshStandardMaterial({ color: o.color ?? 0xffffff, roughness: o.rough ?? 0.04, metalness: 0, transparent: true, opacity: o.opacity ?? 0.12, envMapIntensity: o.env ?? 1.8, side: o.side ?? THREE.FrontSide, depthWrite: false });
  const edge = (o.edge ?? 0.55).toFixed(2);
  m.onBeforeCompile = (s) => { s.fragmentShader = s.fragmentShader.replace('#include <opaque_fragment>', `float frs = pow(1.0 - abs(dot(normalize(vViewPosition), normal)), 3.0);
      diffuseColor.a = clamp(mix(diffuseColor.a, ${edge}, frs), 0.0, 1.0); outgoingLight += vec3(0.08, 0.09, 0.1) * frs;
      #include <opaque_fragment>`); };
  m.customProgramCacheKey = () => 'tglass' + edge;
  return m;
}
export function waterMat(o = {}) {
  const m = new THREE.MeshStandardMaterial({ color: o.color ?? 0x8fc8dc, roughness: o.rough ?? 0.06, metalness: 0, transparent: true, opacity: o.opacity ?? 0.38, envMapIntensity: o.env ?? 1.4, depthWrite: false, side: o.side ?? THREE.FrontSide });
  m.onBeforeCompile = (s) => { s.fragmentShader = s.fragmentShader.replace('#include <opaque_fragment>', `float frs = pow(1.0 - abs(dot(normalize(vViewPosition), normal)), 2.5);
      diffuseColor.a = clamp(diffuseColor.a + 0.45 * frs, 0.0, 1.0);
      #include <opaque_fragment>`); };
  m.customProgramCacheKey = () => 'twater';
  return m;
}
export const std = (color, rough = 0.6, metal = 0, o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color, roughness: rough, metalness: metal }, o));
export const lambert = (color, o = {}) => new THREE.MeshLambertMaterial(Object.assign({ color }, o));
export const basic = (color, o = {}) => new THREE.MeshBasicMaterial(Object.assign({ color }, o));

// ------------------------------------------------------------------ text labels (redrawn when the language changes)
export class Label {
  constructor(text, o = {}) {
    this.text = text; this.o = Object.assign({ size: 0.06, color: '#ffffff', bg: 'rgba(12,16,24,0.78)', weight: 700, px: 56, pad: 22, border: null }, o);
    this.tex = null; this.mat = new THREE.SpriteMaterial({ transparent: true, depthTest: o.depthTest ?? true, depthWrite: false, toneMapped: false, sizeAttenuation: true });
    this.obj = new THREE.Sprite(this.mat); this.obj.renderOrder = 20; this.obj.userData.label = this;
    if (o.center) this.obj.center.set(...o.center);
  }
  draw(lang) {
    const t = typeof this.text === 'string' ? this.text : (this.text[lang] || this.text.en), o = this.o;
    const c = document.createElement('canvas'), x = c.getContext('2d'); x.font = `${o.weight} ${o.px}px ${FONT}`;
    const lines = t.split('\n'); const tw = Math.max(...lines.map((l) => x.measureText(l).width));
    c.width = Math.ceil(tw + o.pad * 2); c.height = Math.ceil(lines.length * o.px * 1.25 + o.pad * 1.4);
    x.font = `${o.weight} ${o.px}px ${FONT}`;
    if (o.bg) { x.fillStyle = o.bg; const r = Math.min(c.height / 2, 26); x.beginPath(); x.roundRect(0, 0, c.width, c.height, r); x.fill(); if (o.border) { x.lineWidth = 4; x.strokeStyle = o.border; x.stroke(); } }
    x.fillStyle = o.color; x.textBaseline = 'middle'; x.textAlign = 'center';
    lines.forEach((l, i) => x.fillText(l, c.width / 2, o.pad * 0.7 + o.px * 1.25 * (i + 0.5)));
    if (this.tex) this.tex.dispose();
    this.tex = new THREE.CanvasTexture(c); this.tex.colorSpace = THREE.SRGBColorSpace; this.tex.anisotropy = 4; this.mat.map = this.tex; this.mat.needsUpdate = true;
    this.obj.scale.set(o.size * c.width / c.height, o.size, 1);
  }
}

// ------------------------------------------------------------------ easing
export const ease = {
  linear: (u) => u, in: (u) => u * u, out: (u) => 1 - (1 - u) * (1 - u),
  io: (u) => u * u * (3 - 2 * u), io5: (u) => u * u * u * (u * (u * 6 - 15) + 10),
  back: (u) => { const c = 1.6; return 1 + (c + 1) * Math.pow(u - 1, 3) + c * Math.pow(u - 1, 2); },
};
const clamp01 = (u) => (u < 0 ? 0 : u > 1 ? 1 : u);

// ------------------------------------------------------------------ the kit a story builds with
export class Kit {
  constructor(player) {
    this.P = player; this.THREE = THREE; this.ease = ease;
    this.world = player.world; this.micro = player.micro.scene; this.mcam = player.micro.camera;
    this.channels = new Map(); this.actions = []; this.ticks = []; this.labels = []; this.disposables = []; this.place = null;
    this.V = (x, y, z) => new THREE.Vector3(x, y, z);
    this.lang = player.lang;
  }
  // ---------------------------------------------------------------- places and light
  async setPlace(name, o = {}) {
    const P = this.P; const p = PLACES[name]; if (!p) throw new Error('no place ' + name);
    const [tex, hdr, stars] = await Promise.all([loadTex(PLACE_DIR + p.img + '.jpg'), o.noEnv ? null : loadHDR(PLACE_DIR + p.img + '_1k.hdr').catch(() => null), o.stars ? loadTex('../space/sky/milkyway_4k.jpg') : null]);
    const u = { map: { value: tex }, stars: { value: stars || tex }, night: { value: o.night || 0 }, storm: { value: o.storm || 0 }, flash: { value: 0 }, warm: { value: 0 }, starsOn: { value: stars ? 1 : 0 }, tint: { value: new THREE.Color(o.tint ?? 0xffffff) } };
    const mat = new THREE.ShaderMaterial({ uniforms: u, vertexShader: SKY_VS, fragmentShader: SKY_FS, depthWrite: false, toneMapped: false });
    const sky = new THREE.Mesh(skyGeometry(p.h, p.r, P.lite ? 40 : 56), mat); sky.position.y = p.h - 0.002; sky.rotation.y = p.yaw || 0; sky.renderOrder = -10; sky.frustumCulled = false; sky.name = 'sky';
    this.world.add(sky); this.sky = sky; this.skyU = u; this.place = name;
    if (hdr) { hdr.mapping = THREE.EquirectangularReflectionMapping; const env = P.pmrem.fromEquirectangular(hdr).texture; this.disposables.push(env); P.scene.environment = env; P.scene.environmentIntensity = (p.env ?? 1) * (o.envI ?? 1); P.scene.environmentRotation.set(0, p.yaw || 0, 0); }
    const d = new THREE.Vector3(...p.sun).normalize().applyAxisAngle(new THREE.Vector3(0, 1, 0), p.yaw || 0);
    P.sun.position.copy(d).multiplyScalar(10); P.sun.intensity = p.sunI * (o.sunI ?? 1); P.sun.color.set(o.sunColor ?? 0xfff4e4);
    P.hemi.intensity = p.sky * (o.skyI ?? 1); P.hemi.color.set(o.skyColor ?? 0xdfeaff); P.hemi.groundColor.set(o.groundColor ?? 0x6b5a44);
    P.scene.background = null;
    this.sunDir = d; return sky;
  }
  // outer space: the real Milky Way all around, the Sun's light from one side
  async setSpace(o = {}) {
    const P = this.P; const tex = await loadTex('../space/sky/milkyway_4k.jpg');
    const sky = new THREE.Mesh(new THREE.SphereGeometry(400, 48, 24), new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide, depthWrite: false, toneMapped: false, color: new THREE.Color(o.skyTint ?? 0x8a8f9a) }));
    sky.renderOrder = -10; sky.frustumCulled = false; this.world.add(sky); this.sky = sky; this.place = 'space';
    P.scene.environment = null; P.sun.position.set(...(o.sun || [-1, 0.15, 0.25])).normalize().multiplyScalar(10); P.sun.intensity = o.sunI ?? 3.2; P.sun.color.set(0xfff6ea);
    P.hemi.intensity = o.fill ?? 0.05; P.hemi.color.set(0x8fa3c8); P.hemi.groundColor.set(0x101418);
    this.sunDir = P.sun.position.clone().normalize(); return sky;
  }
  // ---------------------------------------------------------------- models
  // a model the repo already has (or one of the theatre's few own models); cloned so a story may change its materials
  async model(url, o = {}) {
    const g = await loadGLB(url); const m = (o.clone === false ? g.scene : g.scene.clone(true));
    m.traverse((n) => {
      if (!n.isMesh) return; n.castShadow = n.receiveShadow = false;
      if (o.mats !== false) { n.material = Array.isArray(n.material) ? n.material.map((x) => x.clone()) : n.material.clone(); }
      const mats = Array.isArray(n.material) ? n.material : [n.material];
      for (const mt of mats) { if (o.lambert && mt.isMeshStandardMaterial) { const l = new THREE.MeshLambertMaterial({ map: mt.map, color: mt.color, transparent: mt.transparent, alphaTest: mt.alphaTest, side: mt.side, normalMap: mt.normalMap }); if (mt.map) mt.map.anisotropy = 4; n.material = l; } else if (mt.map) mt.map.anisotropy = 4; if (o.fade) { mt.transparent = true; } if (o.envI != null && 'envMapIntensity' in mt) mt.envMapIntensity = o.envI; }
    });
    if (o.size) { const b = new THREE.Box3().setFromObject(m), s = b.getSize(new THREE.Vector3()); const k = o.size / Math.max(s.x, s.y, s.z); m.scale.multiplyScalar(k); }
    if (o.ground) { m.updateMatrixWorld(true); const b = new THREE.Box3().setFromObject(m); const c = b.getCenter(new THREE.Vector3()); m.position.x -= c.x; m.position.z -= c.z; m.position.y -= b.min.y; const w = new THREE.Group(); w.add(m); return w; }
    return m;
  }
  // the height of a model's top surface at (x, z) (a table top, a floor), found with a ray from above
  surfaceY(obj, x, z, from = 5) { obj.updateMatrixWorld(true); const rc = new THREE.Raycaster(new THREE.Vector3(x, from, z), new THREE.Vector3(0, -1, 0)); const h = rc.intersectObject(obj, true)[0]; return h ? h.point.y : 0; }
  // ---------------------------------------------------------------- simple pieces
  add(o, parent) { (parent || this.world).add(o); return o; }
  group(parent) { const g = new THREE.Group(); (parent || this.world).add(g); return g; }
  mesh(geo, mat, parent) { const m = new THREE.Mesh(geo, mat); (parent || this.world).add(m); return m; }
  blob(r = 0.1, parent, opacity = 1) { const m = new THREE.Mesh(new THREE.PlaneGeometry(r * 2, r * 2).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: blobTex(), transparent: true, depthWrite: false, opacity, toneMapped: false })); m.renderOrder = 1; (parent || this.world).add(m); return m; }
  label(text, o = {}, parent) { const l = new Label(text, o); l.draw(this.P.lang); this.labels.push(l); (parent || this.world).add(l.obj); return l.obj; }
  glow(color = 0xffffff, size = 0.2, parent, o = {}) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, opacity: o.opacity ?? 1, depthTest: o.depthTest ?? true })); s.scale.setScalar(size); s.renderOrder = 15; (parent || this.world).add(s); return s; }
  // a straight tube between two points (a light ray, a rod); dashed: false
  rod(a, b, r = 0.004, mat, parent) { const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b); const len = A.distanceTo(B); const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 10, 1, true), mat); m.position.copy(A).add(B).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize()); (parent || this.world).add(m); return m; }
  // a light ray: bright core plus a soft glow, as one tube along a polyline; "grow" (0..1) draws it from its start
  ray(points, o = {}, parent) {
    const pts = points.map((p) => new THREE.Vector3(...p)); const curve = new THREE.CurvePath(); for (let i = 1; i < pts.length; i++) curve.add(new THREE.LineCurve3(pts[i - 1], pts[i]));
    const segs = Math.max(8, (pts.length - 1) * 24);
    const geo = new THREE.TubeGeometry(curve, segs, o.r ?? 0.006, 8, false);
    const mat = new THREE.MeshBasicMaterial({ color: o.color ?? 0xffe36a, transparent: true, opacity: o.opacity ?? 0.95, toneMapped: false, depthWrite: false, blending: o.add === false ? THREE.NormalBlending : THREE.AdditiveBlending });
    const m = new THREE.Mesh(geo, mat); m.renderOrder = 12; (parent || this.world).add(m);
    const total = geo.index.count; m.userData.grow = 1; m.onBeforeRender = () => { geo.setDrawRange(0, Math.max(0, Math.floor(total * m.userData.grow / 6) * 6)); };
    if (o.glow !== false) { const g2 = new THREE.Mesh(new THREE.TubeGeometry(curve, segs, (o.r ?? 0.006) * 3.2, 8, false), new THREE.MeshBasicMaterial({ color: o.color ?? 0xffe36a, transparent: true, opacity: 0.22, toneMapped: false, depthWrite: false, blending: THREE.AdditiveBlending })); g2.renderOrder = 11; m.add(g2); const t2 = g2.geometry.index.count; g2.onBeforeRender = () => { g2.geometry.setDrawRange(0, Math.max(0, Math.floor(t2 * m.userData.grow / 6) * 6)); }; }
    return m;
  }
  // a dashed line (where the eye thinks the light came from, the normal at a surface)
  dashed(a, b, o = {}, parent) {
    const g = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(...a), new THREE.Vector3(...b)]);
    const l = new THREE.Line(g, new THREE.LineDashedMaterial({ color: o.color ?? 0xffffff, dashSize: o.dash ?? 0.02, gapSize: o.gap ?? 0.014, transparent: true, opacity: o.opacity ?? 0.9, toneMapped: false, depthWrite: false })); l.computeLineDistances(); l.renderOrder = 13; (parent || this.world).add(l); return l;
  }
  // an arrow (force, direction): shaft + head, one material
  arrow(from, dir, len, o = {}, parent) {
    const g = new THREE.Group(); const mat = o.mat || new THREE.MeshStandardMaterial({ color: o.color ?? 0xff5a3a, roughness: 0.4, emissive: o.color ?? 0xff5a3a, emissiveIntensity: 0.35, transparent: !!o.fade });
    const r = o.r ?? 0.012, hl = r * 4.5; const sh = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 1, 12), mat); const hd = new THREE.Mesh(new THREE.ConeGeometry(r * 2.4, hl, 16), mat);
    g.add(sh, hd); g.position.set(...from); g.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(...dir).normalize());
    g.userData.len = len; g.userData.setLen = (L) => { L = Math.max(L, 0.0001); sh.scale.y = Math.max(0.0001, L - hl); sh.position.y = (L - hl) / 2; hd.position.y = L - hl / 2; g.visible = L > 0.002; };
    g.userData.setLen(len); (parent || this.world).add(g); return g;
  }
  // many small things (molecules, drops, sparks) as one draw: pos(i, T, out) sets each one's place at story time T
  swarm(n, geo, mat, pos, parent, o = {}) {
    const m = new THREE.InstancedMesh(geo, mat, n); m.frustumCulled = false; const d = new THREE.Object3D(), v = new THREE.Vector3(), s = new THREE.Vector3();
    m.userData.amount = o.amount ?? 1; (parent || this.world).add(m);
    if (o.colors) { for (let i = 0; i < n; i++) m.setColorAt(i, new THREE.Color(o.colors(i))); }
    const upd = (T) => {
      const k = Math.round(n * clamp01(m.userData.amount)); m.count = k;
      for (let i = 0; i < k; i++) { s.set(1, 1, 1); d.quaternion.identity(); const r = pos(i, T, v, s, d.quaternion); d.position.copy(v); d.scale.copy(s); if (r === false) d.scale.setScalar(0); d.updateMatrix(); m.setMatrixAt(i, d.matrix); }
      m.instanceMatrix.needsUpdate = true;
    };
    this.tick(upd); upd(0); return m;
  }
  // ---------------------------------------------------------------- the zoom bubble's own little world
  // (a separate scene seen through the round inset; it has its own two lights, set once)
  microBg(c) { this.micro.background = new THREE.Color(c); }
  // ---------------------------------------------------------------- timeline: channels and actions
  // remember a property's starting value, so every frame can start from it
  ch(obj, key) {
    let m = this.channels.get(obj); if (!m) this.channels.set(obj, (m = new Map()));
    if (m.has(key)) return;
    const get = CH[key.split(':')[0]].get, set = CH[key.split(':')[0]].set, arg = key.split(':')[1];
    m.set(key, { base: null, get: () => get(obj, arg), set: (v) => set(obj, v, arg) });
  }
  captureBase() { for (const m of this.channels.values()) for (const c of m.values()) c.base = copyVal(c.get()); }
  resetChannels() { for (const m of this.channels.values()) for (const c of m.values()) c.set(c.base); }
  // the actions a beat returns; "at" and "len" are fractions of the beat (its length follows the narration)
  _act(at, len, apply, ez) { return { at: at ?? 0, len: len ?? 0, apply, ease: ez || ease.io }; }
  set(obj, key, value, at = 0) { this.ch(obj, key); const C = CH[key.split(':')[0]], arg = key.split(':')[1]; return this._act(at, 0, () => C.set(obj, value, arg)); }
  show(obj, at = 0) { return this.set(obj, 'vis', true, at); }
  hide(obj, at = 0) { return this.set(obj, 'vis', false, at); }
  tween(obj, key, to, at = 0, len = 0.3, ez, from) {
    this.ch(obj, key); const C = CH[key.split(':')[0]], arg = key.split(':')[1]; const T = to; const F = from;
    return this._act(at, len, (u) => { const f = F !== undefined ? F : C.get(obj, arg); C.set(obj, lerpVal(f, T, u), arg); }, ez);
  }
  move(obj, to, at, len, ez, from) { return this.tween(obj, 'pos', new THREE.Vector3(...to), at, len, ez, from && new THREE.Vector3(...from)); }
  turn(obj, euler, at, len, ez) { return this.tween(obj, 'rot', new THREE.Quaternion().setFromEuler(new THREE.Euler(...euler)), at, len, ez); }
  scale(obj, s, at, len, ez) { return this.tween(obj, 'scl', typeof s === 'number' ? new THREE.Vector3(s, s, s) : new THREE.Vector3(...s), at, len, ez); }
  fade(obj, to, at, len, ez) { this.ch(obj, 'vis'); const mats = matsOf(obj); for (const m of mats) { m.transparent = true; this.ch(m, 'op'); } return this._act(at, len, (u) => { let any = false; for (const m of mats) { m.opacity = lerpN(m.opacity, to * (m.userData.op0 ?? 1), u); if (m.opacity > 0.003) any = true; } obj.visible = any; }, ez); }
  // pop: grow from nothing with a little overshoot
  pop(obj, at = 0, len = 0.12) { this.ch(obj, 'vis'); this.ch(obj, 'scl'); const s0 = obj.scale.clone(); return this._act(at, len, (u) => { obj.visible = u > 0; obj.scale.copy(s0).multiplyScalar(Math.max(0.0001, u)); }, ease.back); }
  color(mat, to, at, len, ez) { return this.tween(mat, 'col', new THREE.Color(to), at, len, ez); }
  uni(mat, name, to, at, len, ez) { return this.tween(mat, 'u:' + name, to, at, len, ez); }
  val(obj, key, to, at, len, ez) { return this.tween(obj, 'val:' + key, to, at, len, ez); }
  // anything else: f(u, T) runs while the action is active and after it ends (with u = 1); declare what it changes
  fn(f, at = 0, len = 0, track = []) { for (const [o, k] of track) this.ch(o, k); return this._act(at, len, f, ease.linear); }
  // the zoom bubble: on (with where it looks and what it is called) or off
  bubble(o, at = 0, len = 0.12) { const B = this.P.bubble; this.ch(B, 'val:on'); this.ch(B, 'val:cfg'); return this._act(at, len, (u) => { if (o === false) { B.on = Math.min(B.on, 1 - u); return; } B.cfg = o; B.on = u; }, ease.out); }
  // a function run every frame with the story time (water ripples, a turning Earth, twinkling)
  tick(f) { this.ticks.push(f); }
  // labels and the like follow the language
  relabel(lang) { this.lang = lang; for (const l of this.labels) l.draw(lang); }
  dispose() {
    for (const d of this.disposables) d.dispose && d.dispose();
    const kill = (root) => root.traverse((n) => { if (n.geometry && !n.userData.shared) n.geometry.dispose(); const ms = n.material ? (Array.isArray(n.material) ? n.material : [n.material]) : []; for (const m of ms) { for (const k of ['map', 'normalMap']) if (m[k] && m[k].isCanvasTexture) m[k].dispose(); m.dispose(); } });
    kill(this.world); kill(this.micro); for (const l of this.labels) l.tex && l.tex.dispose();
  }
}

function matsOf(obj) { const out = new Set(); obj.traverse((n) => { if (n.material) (Array.isArray(n.material) ? n.material : [n.material]).forEach((m) => { if (m.userData.op0 == null) m.userData.op0 = m.opacity; out.add(m); }); }); return [...out]; }
const lerpN = (a, b, u) => a + (b - a) * u;
function lerpVal(a, b, u) {
  if (typeof a === 'number') return lerpN(a, b, u);
  if (typeof a === 'boolean') return u >= 1 ? b : a;
  if (a && a.isQuaternion) return a.clone().slerp(b, u);
  if (a && (a.isVector3 || a.isColor || a.isVector2)) return a.clone().lerp(b, u);
  return u >= 1 ? b : a;
}
function copyVal(v) { return v && v.clone ? v.clone() : v; }
// how each kind of property is read and written
const CH = {
  vis: { get: (o) => o.visible, set: (o, v) => { o.visible = v; } },
  pos: { get: (o) => o.position, set: (o, v) => o.position.copy(v) },
  rot: { get: (o) => o.quaternion, set: (o, v) => o.quaternion.copy(v) },
  scl: { get: (o) => o.scale, set: (o, v) => o.scale.copy(v) },
  op: { get: (m) => m.opacity, set: (m, v) => { m.opacity = v; } },
  col: { get: (m) => m.color, set: (m, v) => m.color.copy(v) },
  emi: { get: (m) => m.emissiveIntensity, set: (m, v) => { m.emissiveIntensity = v; } },
  u: { get: (m, k) => m.uniforms[k].value, set: (m, v, k) => { const U = m.uniforms[k]; if (U.value && U.value.copy) U.value.copy(v); else U.value = v; } },
  val: { get: (o, k) => o[k], set: (o, v, k) => { if (o[k] && o[k].copy && v && v.isVector3) o[k].copy(v); else o[k] = v; } },
};
