// Loads the anatomy model and owns materials, layers, per-object state and picking.
// Every vertex carries an object id (partId). One small data texture holds per-object flags
// (hidden / see-through / tint), so any bone, muscle or vessel can be lit, hidden or coloured instantly.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

// lets a host remap asset URLs (used by the preview page, which cannot serve .glb)
export const asset = (p) => (window.HB_ASSETS && window.HB_ASSETS[p]) || p;

// which mesh groups belong to which system layer (a group may sit in two layers)
export const LAYERS = {
  skin: ['skin'],
  skeleton: ['skull', 'mandible', 'teeth', 'teeth_lower', 'hyoid', 'vertebrae', 'sacrum', 'ribs', 'sternum', 'clavicle', 'scapula',
    'humerus', 'radius', 'ulna', 'hand', 'hip', 'femur', 'patella', 'tibia', 'fibula', 'foot'],
  muscles: ['muscles', 'diaphragm'],
  circulatory: ['heart_ra', 'heart_rv', 'heart_la', 'heart_lv', 'valve_tricuspid', 'valve_mitral', 'valve_pulmonary',
    'valve_aortic', 'papillary', 'arteries', 'veins', 'pulm_arteries', 'pulm_veins', 'coronary', 'cardiac_veins', 'arteries_minor', 'veins_minor'],
  respiratory: ['nasal_cavity', 'pharynx', 'larynx', 'trachea', 'bronchi', 'lung_r', 'lung_l', 'diaphragm'],
  digestive: ['mouth', 'tongue', 'teeth', 'teeth_lower', 'salivary', 'esophagus', 'stomach', 'duodenum', 'small_intestine',
    'large_intestine', 'rectum', 'liver', 'gallbladder', 'bile_ducts', 'pancreas'],
  urinary: ['kidney_l', 'kidney_r', 'renal_pelvis', 'ureters', 'bladder', 'urethra'],
  nervous: ['cerebrum', 'cerebellum', 'brainstem', 'brain_deep', 'spinal_cord', 'nerves', 'nerves_minor'],
  senses: ['eyes', 'ear'],
  endocrine: ['pituitary', 'thyroid', 'adrenal', 'pancreas', 'brain_deep'],
  lymphatic: ['spleen', 'lymphoid'],
};

// base look per group: [color, roughness, opacity]
const LOOK = {
  bone: ['#e9dfc9', 0.62, 1], teeth: ['#f4efe2', 0.35, 1], cartilage: ['#bfd6dc', 0.45, 1],
  heart_ra: ['#7e2a3a', 0.45, 1], heart_rv: ['#8c2f3d', 0.45, 1], heart_la: ['#b8323c', 0.45, 1], heart_lv: ['#c43a3f', 0.45, 1],
  valve: ['#f0d9b5', 0.5, 1], papillary: ['#a93a44', 0.5, 1],
  arteries: ['#d1232f', 0.38, 1], veins: ['#2f56c9', 0.38, 1], arteries_minor: ['#d1232f', 0.4, 1], veins_minor: ['#2f56c9', 0.4, 1],
  pulm_arteries: ['#5a4fd8', 0.38, 1], pulm_veins: ['#e0414b', 0.38, 1], coronary: ['#e02a34', 0.4, 1], cardiac_veins: ['#3557c4', 0.4, 1],
  lung: ['#e9a0a6', 0.75, 0.55], bronchi: ['#e8e2d4', 0.5, 1], trachea: ['#ddd6c6', 0.5, 1],
  nasal_cavity: ['#e39a9a', 0.6, 0.7], pharynx: ['#e08b8f', 0.6, 0.9], mouth: ['#d77f86', 0.55, 1],
  tongue: ['#d0646f', 0.6, 1], salivary: ['#e7c27a', 0.6, 1], diaphragm: ['#b5524c', 0.6, 0.85],
  esophagus: ['#d9888b', 0.5, 1], stomach: ['#e2959a', 0.55, 1], duodenum: ['#e6a080', 0.55, 1],
  small_intestine: ['#efb49a', 0.55, 1], large_intestine: ['#c9917a', 0.6, 1], rectum: ['#c38a74', 0.6, 1],
  liver: ['#8e3428', 0.5, 1], gallbladder: ['#4f8a3c', 0.4, 1], bile_ducts: ['#5d9c48', 0.4, 1],
  pancreas: ['#e8bf88', 0.6, 1], spleen: ['#7a2a40', 0.5, 1], lymphoid: ['#9fd17a', 0.55, 1],
  kidney: ['#9b3b33', 0.45, 1], renal_pelvis: ['#e5c27b', 0.5, 1], adrenal: ['#e3a948', 0.6, 1],
  ureters: ['#e9cf7a', 0.45, 1], bladder: ['#e3c26d', 0.5, 0.9], urethra: ['#e9cf7a', 0.45, 1],
  cerebrum: ['#e7b6ad', 0.62, 1], cerebellum: ['#d7a097', 0.62, 1], brainstem: ['#d9a99d', 0.6, 1], brain_deep: ['#c98fa0', 0.55, 1],
  spinal_cord: ['#efe1a6', 0.55, 1], nerves: ['#f2d34b', 0.45, 1], nerves_minor: ['#f2d34b', 0.45, 1],
  eyes: ['#f2f0ea', 0.3, 1], ear: ['#e8d6b8', 0.45, 1],
  pituitary: ['#e7a47a', 0.5, 1], thyroid: ['#b8454d', 0.5, 1],
  muscles: ['#b4483f', 0.62, 1],
};

export function lookFor(name) {
  if (LAYERS.skeleton.includes(name)) return name.startsWith('teeth') ? LOOK.teeth : LOOK.bone;
  if (name === 'larynx') return LOOK.cartilage;
  if (name.startsWith('valve_')) return LOOK.valve;
  if (name.startsWith('lung_')) return LOOK.lung;
  if (name.startsWith('kidney_')) return LOOK.kidney;
  return LOOK[name] || ['#cccccc', 0.5, 1];
}

// Quantized (meshopt) glTF meshes keep their dequantization in the node transform.
// Bake it into float geometry so the mesh can be freely moved/scaled and read in body space.
export function bakeMesh(mesh) {
  mesh.updateWorldMatrix(true, false);
  const g = new THREE.BufferGeometry();
  const src = mesh.geometry;
  for (const name of ['position', 'normal']) {
    const a = src.attributes[name]; if (!a) continue;
    const f = new Float32Array(a.count * 3);
    for (let i = 0; i < a.count; i++) { f[i * 3] = a.getX(i); f[i * 3 + 1] = a.getY(i); f[i * 3 + 2] = a.getZ(i); }
    g.setAttribute(name, new THREE.BufferAttribute(f, 3));
  }
  const pa = src.attributes._part;
  if (pa) { const p = new Float32Array(pa.count); for (let i = 0; i < pa.count; i++) p[i] = pa.getX(i); g.setAttribute('partId', new THREE.BufferAttribute(p, 1)); }
  if (src.index) g.setIndex(new THREE.BufferAttribute(src.index.count > 65535 || src.index.array instanceof Uint32Array ? new Uint32Array(src.index.array) : new Uint16Array(src.index.array), 1));
  g.applyMatrix4(mesh.matrixWorld);
  if (!g.attributes.normal) g.computeVertexNormals();
  g.computeBoundingBox(); g.computeBoundingSphere();
  src.dispose();
  mesh.geometry = g;
  mesh.position.set(0, 0, 0); mesh.rotation.set(0, 0, 0); mesh.scale.set(1, 1, 1);
  mesh.updateMatrix();
  return mesh;
}

// ---------------------------------------------------------------- per-object state shared by all materials
const TEX = 64; // 64 x 64 = 4096 object slots
export class PartState {
  constructor() {
    this.data = new Uint8Array(TEX * TEX * 4);
    this.tex = new THREE.DataTexture(this.data, TEX, TEX, THREE.RGBAFormat, THREE.UnsignedByteType);
    this.tex.magFilter = this.tex.minFilter = THREE.NearestFilter;
    this.tex.needsUpdate = true;
    this.u = {
      uPartTex: { value: this.tex },
      uHover: { value: -1 }, uSel: { value: -1 }, uPTime: { value: 0 },
      uHiColor: { value: new THREE.Color('#ffd27a') },
    };
    this.dirty = false;
  }
  // flags: 1 hidden, 2 see-through, 4 tinted, 8 selected (pulsing glow), 16 hover
  set(oid, flags, tint) {
    const i = oid * 4, d = this.data;
    if (tint) { d[i] = tint.r * 255; d[i + 1] = tint.g * 255; d[i + 2] = tint.b * 255; }
    d[i + 3] = flags; this.dirty = true;
  }
  bit(oid, b, on) { const i = oid * 4 + 3; const v = on ? this.data[i] | b : this.data[i] & ~b; if (v !== this.data[i]) { this.data[i] = v; this.dirty = true; } }
  clearBit(b) { const d = this.data; for (let i = 3; i < d.length; i += 4) if (d[i] & b) { d[i] &= ~b; this.dirty = true; } }
  flags(oid) { return this.data[oid * 4 + 3]; }
  clear() { this.data.fill(0); this.dirty = true; }
  commit() { if (this.dirty) { this.tex.needsUpdate = true; this.dirty = false; } }
}

const VERT_HEAD = `
attribute float partId;
uniform sampler2D uPartTex;
varying float vPart;
varying vec4 vPInfo;
`;
const VERT_BODY = `
vPart = partId;
vPInfo = texelFetch(uPartTex, ivec2(int(partId) % ${TEX}, int(partId) / ${TEX}), 0);
`;
const FRAG_HEAD = `
uniform float uHover; uniform float uSel; uniform float uPTime; uniform vec3 uHiColor;
varying float vPart;
varying vec4 vPInfo;
`;

// add per-object flags + highlight to a standard material
export function partify(mat, state) {
  const prev = mat.onBeforeCompile;
  mat.onBeforeCompile = (sh, r) => {
    prev && prev(sh, r);
    Object.assign(sh.uniforms, state.u);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>' + VERT_HEAD)
      .replace('#include <begin_vertex>', '#include <begin_vertex>' + VERT_BODY);
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>' + FRAG_HEAD)
      .replace('#include <color_fragment>', `#include <color_fragment>
        float pflag = floor(vPInfo.a * 255.0 + 0.5);
        if (mod(pflag, 2.0) > 0.5) discard;
        if (mod(floor(pflag / 4.0), 2.0) > 0.5) diffuseColor.rgb = mix(diffuseColor.rgb, vPInfo.rgb, 0.85);
        if (mod(floor(pflag / 2.0), 2.0) > 0.5) diffuseColor.a *= 0.1;`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        float hsel = max(1.0 - step(0.5, abs(vPart - uSel)), mod(floor(pflag / 8.0), 2.0));
        float hhov = max(1.0 - step(0.5, abs(vPart - uHover)), mod(floor(pflag / 16.0), 2.0));
        totalEmissiveRadiance += uHiColor * (hsel * (0.3 + 0.2 * sin(uPTime * 4.0)) + hhov * 0.22);`);
  };
  mat.customProgramCacheKey = () => 'part-v3b' + (prev ? '+w' : '');
  mat.userData.partified = true;
  return mat;
}

export function makeSkinMaterial(state) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uBase: { value: new THREE.Color('#f3c9ae') }, uRim: { value: new THREE.Color('#ffe9d8') },
      uOpacity: { value: 1.0 }, uFace: { value: 0.035 }, uEdge: { value: 0.55 }, ...state.u,
    },
    vertexShader: `${VERT_HEAD}
      varying vec3 vN; varying vec3 vV;
      void main(){
        ${VERT_BODY}
        vec4 mv = modelViewMatrix * vec4(position,1.0);
        vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `${FRAG_HEAD}
      uniform vec3 uBase; uniform vec3 uRim; uniform float uOpacity; uniform float uFace; uniform float uEdge;
      varying vec3 vN; varying vec3 vV;
      void main(){
        float pflag = floor(vPInfo.a * 255.0 + 0.5);
        if (mod(pflag, 2.0) > 0.5) discard;
        float ndv = abs(dot(normalize(vN), normalize(vV)));
        float f = pow(1.0 - ndv, 2.4);
        vec3 col = mix(uBase, uRim, f);
        float a = mix(uFace, uEdge, f) * uOpacity;
        float hsel = max(1.0 - step(0.5, abs(vPart - uSel)), mod(floor(pflag / 8.0), 2.0));
        float hhov = max(1.0 - step(0.5, abs(vPart - uHover)), mod(floor(pflag / 16.0), 2.0));
        col = mix(col, uHiColor, hsel * 0.6 + hhov * 0.35); a = max(a, (hsel * 0.45 + hhov * 0.25) * uOpacity);
        gl_FragColor = vec4(col, a);
      }`,
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
  });
}

export class Body {
  constructor() {
    this.root = new THREE.Group(); this.root.name = 'body';
    this.parts = {}; // group name -> mesh
    this.state = new PartState();
    this.layerOn = { skin: true, skeleton: true, muscles: false, circulatory: true, respiratory: true, digestive: true, urinary: true, nervous: true, senses: true, endocrine: true, lymphatic: false };
    this.highlight = new Set();
    this.objects = []; // oid -> {name, side, part, group}
    this.partObjs = {}; // part id -> [oid]
  }

  setObjects(table) {
    this.objects = table.map(([name, side, part, group]) => ({ name, side, part, group }));
    this.partObjs = {};
    this.objects.forEach((o, i) => (this.partObjs[o.part] ||= []).push(i));
  }

  async load(url, onProgress) {
    const loader = new GLTFLoader(); loader.setMeshoptDecoder(MeshoptDecoder);
    const gltf = await loader.loadAsync(url, (e) => onProgress && e.total && onProgress(e.loaded / e.total));
    const list = []; gltf.scene.updateMatrixWorld(true);
    gltf.scene.traverse((o) => { if (o.isMesh) list.push(o); });
    for (const o of list) { const name = o.name.replace(/_\d+$/, ''); bakeMesh(o); this.addPart(name, o); this.root.add(o); }
  }

  async loadMuscles(url) {
    const loader = new GLTFLoader(); loader.setMeshoptDecoder(MeshoptDecoder);
    const gltf = await loader.loadAsync(url);
    const list = []; gltf.scene.updateMatrixWorld(true);
    gltf.scene.traverse((o) => { if (o.isMesh) list.push(o); });
    for (const o of list) { bakeMesh(o); this.addPart('muscles', o); this.root.add(o); }
  }

  addPart(name, mesh) {
    let mat;
    if (name === 'skin') { mat = makeSkinMaterial(this.state); mesh.renderOrder = 10; }
    else {
      const [c, r, op] = lookFor(name);
      mat = new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: 0.0, envMapIntensity: 0.9 });
      if (op < 1) { mat.transparent = true; mat.opacity = op; mat.depthWrite = false; mesh.renderOrder = 5; }
      if (name === 'muscles') { mat.transparent = true; mat.opacity = 0.55; mat.depthWrite = false; mesh.renderOrder = 6; }
      mat.userData.baseOpacity = mat.opacity; mat.userData.baseColor = mat.color.clone();
      if (mesh.geometry.attributes.partId) partify(mat, this.state);
    }
    mesh.material = mat; mesh.userData.part = name; mesh.frustumCulled = true;
    this.parts[name] = mesh;
  }

  layerOf(name) { for (const [k, v] of Object.entries(LAYERS)) if (v.includes(name)) return k; return null; }

  // emphasise a set of groups: others fade
  focus(names, fade = 0.12) {
    this.highlight = new Set(names || []);
    const any = this.highlight.size > 0;
    for (const [name, mesh] of Object.entries(this.parts)) {
      const m = mesh.material; if (name === 'skin') continue;
      const hi = this.highlight.has(name); const base = m.userData.baseOpacity ?? 1;
      if (!any || hi) { m.opacity = base; m.transparent = base < 1 || name === 'muscles'; m.depthWrite = !m.transparent; m.emissive && m.emissive.setRGB(0, 0, 0); mesh.renderOrder = m.transparent ? 5 : 0; }
      else { m.transparent = true; m.opacity = Math.min(base, fade); m.depthWrite = false; mesh.renderOrder = 4; }
      m.needsUpdate = true;
    }
  }

  // ---- per-object helpers
  oidAtHit(hit) {
    const g = hit.object.geometry, a = g.attributes.partId; if (!a || !hit.face) return -1;
    return a.getX(hit.face.a) | 0;
  }
  isHidden(oid) { return oid >= 0 && (this.state.flags(oid) & 1) === 1; }

  // triangles per object for one group (built on demand)
  triIndex(group) {
    const mesh = this.parts[group]; if (!mesh) return null;
    if (mesh.userData.triIdx) return mesh.userData.triIdx;
    const g = mesh.geometry, idx = g.index.array, pa = g.attributes.partId.array;
    const map = new Map();
    for (let t = 0; t < idx.length; t += 3) { const o = pa[idx[t]]; let l = map.get(o); if (!l) map.set(o, (l = [])); l.push(t); }
    mesh.userData.triIdx = map; return map;
  }
  // new geometry with only these objects (positions/normals in body space)
  extract(oids) {
    const set = new Set(oids); const pos = [], nor = [];
    const groups = new Set(oids.map((o) => this.objects[o] && this.objects[o].group));
    for (const gname of groups) {
      const mesh = this.parts[gname]; if (!mesh) continue;
      const tri = this.triIndex(gname); const g = mesh.geometry; const idx = g.index.array; const P = g.attributes.position.array, N = g.attributes.normal.array;
      for (const o of set) {
        const l = tri.get(o); if (!l) continue;
        for (const t of l) for (let k = 0; k < 3; k++) { const v = idx[t + k] * 3; pos.push(P[v], P[v + 1], P[v + 2]); nor.push(N[v], N[v + 1], N[v + 2]); }
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    geo.computeBoundingBox(); geo.computeBoundingSphere();
    return geo;
  }
}
