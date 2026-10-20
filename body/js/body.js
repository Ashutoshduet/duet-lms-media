// Loads the anatomy model and owns materials, layers and picking.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

// lets a host remap asset URLs (used by the preview page, which cannot serve .glb)
export const asset = (p) => (window.HB_ASSETS && window.HB_ASSETS[p]) || p;

// layer membership of every part
export const LAYERS = {
  skin: ['skin'],
  skeleton: ['skull', 'mandible', 'teeth', 'hyoid', 'vertebrae', 'sacrum', 'ribs', 'sternum', 'clavicle', 'scapula',
    'humerus', 'radius', 'ulna', 'hand', 'hip', 'femur', 'patella', 'tibia', 'fibula', 'foot'],
  muscles: ['muscles'],
  circulatory: ['heart_ra', 'heart_rv', 'heart_la', 'heart_lv', 'valve_tricuspid', 'valve_mitral', 'valve_pulmonary',
    'valve_aortic', 'papillary', 'arteries', 'veins', 'pulm_arteries', 'pulm_veins', 'coronary', 'cardiac_veins'],
  respiratory: ['nasal_cavity', 'pharynx', 'larynx', 'trachea', 'bronchi', 'lung_r', 'lung_l', 'diaphragm'],
  digestive: ['mouth', 'tongue', 'teeth', 'salivary', 'esophagus', 'stomach', 'duodenum', 'small_intestine',
    'large_intestine', 'liver', 'gallbladder', 'bile_ducts', 'pancreas', 'spleen'],
  urinary: ['kidney_l', 'kidney_r', 'renal_pelvis', 'adrenal', 'ureters', 'bladder', 'urethra'],
  nervous: ['cerebrum', 'cerebellum', 'brainstem', 'spinal_cord', 'nerves', 'eyes', 'pituitary', 'thyroid'],
};

// base look per part: [color, roughness, opacity]
const LOOK = {
  bone: ['#e9dfc9', 0.62, 1],
  teeth: ['#f4efe2', 0.35, 1],
  cartilage: ['#bfd6dc', 0.45, 1],
  heart_ra: ['#7e2a3a', 0.45, 1], heart_rv: ['#8c2f3d', 0.45, 1],
  heart_la: ['#b8323c', 0.45, 1], heart_lv: ['#c43a3f', 0.45, 1],
  valve: ['#f0d9b5', 0.5, 1], papillary: ['#a93a44', 0.5, 1],
  arteries: ['#d1232f', 0.38, 1], veins: ['#2f56c9', 0.38, 1],
  pulm_arteries: ['#5a4fd8', 0.38, 1], pulm_veins: ['#e0414b', 0.38, 1],
  coronary: ['#e02a34', 0.4, 1], cardiac_veins: ['#3557c4', 0.4, 1],
  lung: ['#e9a0a6', 0.75, 0.55], bronchi: ['#e8e2d4', 0.5, 1], trachea: ['#ddd6c6', 0.5, 1],
  nasal_cavity: ['#e39a9a', 0.6, 0.7], pharynx: ['#e08b8f', 0.6, 0.9], mouth: ['#d77f86', 0.55, 1],
  tongue: ['#d0646f', 0.6, 1], salivary: ['#e7c27a', 0.6, 1], diaphragm: ['#b5524c', 0.6, 0.85],
  esophagus: ['#d9888b', 0.5, 1], stomach: ['#e2959a', 0.55, 1], duodenum: ['#e6a080', 0.55, 1],
  small_intestine: ['#efb49a', 0.55, 1], large_intestine: ['#c9917a', 0.6, 1],
  liver: ['#8e3428', 0.5, 1], gallbladder: ['#4f8a3c', 0.4, 1], bile_ducts: ['#5d9c48', 0.4, 1],
  pancreas: ['#e8bf88', 0.6, 1], spleen: ['#7a2a40', 0.5, 1],
  kidney: ['#9b3b33', 0.45, 1], renal_pelvis: ['#e5c27b', 0.5, 1], adrenal: ['#e3a948', 0.6, 1],
  ureters: ['#e9cf7a', 0.45, 1], bladder: ['#e3c26d', 0.5, 0.9], urethra: ['#e9cf7a', 0.45, 1],
  cerebrum: ['#e7b6ad', 0.62, 1], cerebellum: ['#d7a097', 0.62, 1], brainstem: ['#d9a99d', 0.6, 1],
  spinal_cord: ['#efe1a6', 0.55, 1], nerves: ['#f2d34b', 0.45, 1], eyes: ['#f2f0ea', 0.3, 1],
  pituitary: ['#e7a47a', 0.5, 1], thyroid: ['#b8454d', 0.5, 1],
  muscles: ['#b4483f', 0.62, 1],
};

function lookFor(name) {
  if (LAYERS.skeleton.includes(name)) return name === 'teeth' ? LOOK.teeth : LOOK.bone;
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
  if (src.index) g.setIndex(new THREE.BufferAttribute(src.index.array instanceof Uint32Array || src.index.count > 65535 ? new Uint32Array(src.index.array) : new Uint16Array(src.index.array), 1));
  g.applyMatrix4(mesh.matrixWorld);
  if (!g.attributes.normal) g.computeVertexNormals();
  g.computeBoundingBox(); g.computeBoundingSphere();
  src.dispose();
  mesh.geometry = g;
  mesh.position.set(0, 0, 0); mesh.rotation.set(0, 0, 0); mesh.scale.set(1, 1, 1);
  mesh.updateMatrix();
  return mesh;
}

export function makeSkinMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {
      uBase: { value: new THREE.Color('#f3c9ae') },
      uRim: { value: new THREE.Color('#ffe9d8') },
      uOpacity: { value: 1.0 },
      uFace: { value: 0.035 },
      uEdge: { value: 0.55 },
    },
    vertexShader: `
      varying vec3 vN; varying vec3 vV;
      void main(){
        vec4 mv = modelViewMatrix * vec4(position,1.0);
        vN = normalize(normalMatrix * normal);
        vV = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      uniform vec3 uBase; uniform vec3 uRim; uniform float uOpacity; uniform float uFace; uniform float uEdge;
      varying vec3 vN; varying vec3 vV;
      void main(){
        float ndv = abs(dot(normalize(vN), normalize(vV)));
        float f = pow(1.0 - ndv, 2.4);
        vec3 col = mix(uBase, uRim, f);
        float a = mix(uFace, uEdge, f) * uOpacity;
        gl_FragColor = vec4(col, a);
      }`,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
}

export class Body {
  constructor() {
    this.root = new THREE.Group();
    this.root.name = 'body';
    this.parts = {}; // name -> mesh
    this.baseMat = {};
    this.layerOn = { skin: true, skeleton: true, muscles: false, circulatory: true, respiratory: true, digestive: true, urinary: true, nervous: true };
    this.highlight = new Set();
    this.dimOthers = false;
  }

  async load(url, onProgress) {
    const loader = new GLTFLoader();
    loader.setMeshoptDecoder(MeshoptDecoder);
    const gltf = await loader.loadAsync(url, (e) => onProgress && e.total && onProgress(e.loaded / e.total));
    const list = [];
    gltf.scene.updateMatrixWorld(true);
    gltf.scene.traverse((o) => { if (o.isMesh) list.push(o); });
    for (const o of list) {
      const name = o.name.replace(/_\d+$/, '');
      bakeMesh(o);
      this.addPart(name, o);
      this.root.add(o);
    }
  }

  async loadMuscles(url) {
    const loader = new GLTFLoader();
    loader.setMeshoptDecoder(MeshoptDecoder);
    const gltf = await loader.loadAsync(url);
    const list = [];
    gltf.scene.updateMatrixWorld(true);
    gltf.scene.traverse((o) => { if (o.isMesh) list.push(o); });
    for (const o of list) { bakeMesh(o); this.addPart('muscles', o); this.root.add(o); }
    this.applyVisibility();
  }

  addPart(name, mesh) {
    let mat;
    if (name === 'skin') {
      mat = makeSkinMaterial();
      mesh.renderOrder = 10;
    } else {
      const [c, r, op] = lookFor(name);
      mat = new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: 0.0, envMapIntensity: 0.9 });
      if (op < 1) { mat.transparent = true; mat.opacity = op; mat.depthWrite = false; mesh.renderOrder = 5; }
      if (name === 'muscles') { mat.transparent = true; mat.opacity = 0.55; mat.depthWrite = false; mesh.renderOrder = 6; }
      mat.userData.baseOpacity = mat.opacity;
      mat.userData.baseColor = mat.color.clone();
    }
    mesh.material = mat;
    mesh.userData.part = name;
    mesh.frustumCulled = true;
    this.parts[name] = mesh;
    this.baseMat[name] = mat;
  }

  layerOf(name) {
    for (const [k, v] of Object.entries(LAYERS)) if (v.includes(name)) return k;
    return null;
  }

  setLayer(layer, on) { this.layerOn[layer] = on; this.applyVisibility(); }

  applyVisibility() {
    for (const [name, mesh] of Object.entries(this.parts)) {
      let vis = false;
      for (const [k, list] of Object.entries(LAYERS)) if (list.includes(name) && this.layerOn[k]) vis = true;
      mesh.visible = vis;
    }
  }

  // emphasise a set of parts: others fade
  focus(names, fade = 0.12) {
    this.highlight = new Set(names || []);
    const any = this.highlight.size > 0;
    for (const [name, mesh] of Object.entries(this.parts)) {
      const m = mesh.material;
      if (name === 'skin') continue;
      const hi = this.highlight.has(name);
      const base = m.userData.baseOpacity ?? 1;
      if (!any || hi) {
        m.opacity = base;
        m.transparent = base < 1 || name === 'muscles';
        m.depthWrite = !m.transparent;
        m.emissive && m.emissive.setRGB(0, 0, 0);
        mesh.renderOrder = m.transparent ? 5 : 0;
      } else {
        m.transparent = true;
        m.opacity = Math.min(base, fade);
        m.depthWrite = false;
        mesh.renderOrder = 4;
      }
      m.needsUpdate = true;
    }
  }

  glow(name, amount, color = '#ffffff') {
    const m = this.parts[name] && this.parts[name].material;
    if (!m || !m.emissive) return;
    m.emissive.set(color).multiplyScalar(amount);
  }
}
