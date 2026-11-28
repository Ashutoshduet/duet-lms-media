// Real 3D models (Poly Haven, CC0) and a real 360° lab photo (HDRI) for lighting and glass reflections.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { BENCH_Y } from './room.js';

export const MODELS = {};
export const MODEL_FILES = ['bunsen_burner', 'chemistry_set', 'metal_stool_02', 'mounted_fluorescent_lights', 'korean_fire_extinguisher_01', 'medical_box', 'vintage_microscope', 'plastic_bottle_gallon'];

export async function loadModels(onProgress) {
  const loader = new GLTFLoader(); loader.setMeshoptDecoder(MeshoptDecoder);
  let done = 0;
  await Promise.all(MODEL_FILES.map((n) => loader.loadAsync(`models/${n}.glb`).then((g) => {
    g.scene.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    MODELS[n] = g.scene; onProgress && onProgress(++done / MODEL_FILES.length);
  }).catch((e) => console.warn('model', n, e))));
  return MODELS;
}
export function model(name) { const m = MODELS[name]; return m ? m.clone(true) : null; }

export async function loadLabHDR(renderer, scene) {
  try {
    const tex = await new RGBELoader().loadAsync('env/lab_1k.hdr'); tex.mapping = THREE.EquirectangularReflectionMapping;
    const pm = new THREE.PMREMGenerator(renderer); const env = pm.fromEquirectangular(tex).texture; tex.dispose(); pm.dispose();
    scene.environment = env; scene.environmentIntensity = 0.62; return env;
  } catch (e) { console.warn('hdr', e); return null; }
}

// furnish the room with the real models (decor: not part of the experiments)
export function furnish(room, info) {
  const add = (name, x, y, z, ry = 0, s = 1) => { const m = model(name); if (!m) return null; m.position.set(x, y, z); m.rotation.y = ry; m.scale.setScalar(s); m.traverse((o) => { if (o.isMesh) o.userData.noHit = true; }); room.add(m); return m; };
  // ceiling tube-light fittings replace the plain boxes
  if (MODELS.mounted_fluorescent_lights) {
    room.traverse((o) => { if (o.userData.tubeLight) o.visible = false; });
    for (const x of [-1.6, 1.6]) for (const z of [-2, 0, 2]) add('mounted_fluorescent_lights', x, info.H, z, Math.PI / 2);
  }
  if (MODELS.korean_fire_extinguisher_01) { room.traverse((o) => { if (o.userData.extinguisher) o.visible = false; }); add('korean_fire_extinguisher_01', info.W / 2 - 0.3, 0, 1.2, -Math.PI / 2); }
  add('chemistry_set', -2.2, BENCH_Y, 1.05, Math.PI);       // retort stand, clamp, cylinder and beakers on the left side bench
  add('vintage_microscope', 2.0, BENCH_Y, 0.95, Math.PI + 0.4); // microscope on the right side bench
  add('medical_box', 2.6, BENCH_Y, 2.55, Math.PI);
  add('plastic_bottle_gallon', 1.12, BENCH_Y, -0.62, -0.5);   // distilled water can at the end of our bench
  for (const [x, z, r] of [[-0.95, -0.12, 0.3], [0.95, -0.12, -0.2], [-2.0, 1.75, 0.8], [2.3, 1.75, 1.6]]) add('metal_stool_02', x, 0, z, r);
}

// ------------------------------------------------------------------ real models for physics apparatus (Poly Haven, CC0), loaded in the background
export const PHYS_FILES = ['lemon', 'alarm_clock_01', 'magnifying_glass_01', 'stone_01', 'small_plastic_torch', 'pastic_torch_6v', 'vintage_stapler', 'cross_pein_hammer', 'rubber_duck_toy', 'lightbulb_01'];
let physP = null;
// glass that uses transmission renders black on some phones/headsets: make it a light transparent glass instead
function plainGlass(root) { root.traverse((o) => { if (!o.isMesh) return; o.castShadow = true; o.receiveShadow = true; for (const m of [].concat(o.material)) if (m && (m.transmission > 0 || /_(glass|lense?)$/i.test(m.name))) { m.map = null; m.transmission = 0; m.transparent = true; m.opacity = 0.22; m.roughness = 0.05; m.metalness = 0; m.depthWrite = false; m.color && m.color.setHex(0xe8f2f6); } }); }
export function loadPhysModels() {
  if (physP) return physP; const loader = new GLTFLoader(); loader.setMeshoptDecoder(MeshoptDecoder);
  physP = Promise.all(PHYS_FILES.map((n) => loader.loadAsync(`models/${n}.glb`).then((g) => { plainGlass(g.scene); MODELS[n] = g.scene; }).catch((e) => console.warn('model', n, e))));
  return physP;
}
// put a real model inside an item in place of its drawn parts. o: { h | w | l (fit height / width (x) / length (z), metres), rot: [x, y, z] (+ order),
// pin: a point of the model's box as fractions [fx, fy, fz] (default bottom centre [0.5, 0, 0.5]) that goes to at: [x, y, z], hide: [meshes], done(group, model) }
export function dress(it, name, o = {}) {
  const apply = () => { const src = MODELS[name]; if (!src || it.disposed) return; const m = src.clone(true); const w = new THREE.Group(); w.add(m); if (o.rot) { m.rotation.order = o.order || 'XYZ'; m.rotation.set(...o.rot); }
    m.updateMatrixWorld(true); let b = new THREE.Box3().setFromObject(m); const s = b.getSize(new THREE.Vector3());
    const k = o.h ? o.h / s.y : o.w ? o.w / s.x : o.l ? o.l / s.z : 1; m.scale.multiplyScalar(k); m.updateMatrixWorld(true); b = new THREE.Box3().setFromObject(m); const pin = o.pin || [0.5, 0, 0.5]; const c = new THREE.Vector3(...pin.map((f, i) => b.min.getComponent(i) + (b.max.getComponent(i) - b.min.getComponent(i)) * f));
    const at = o.at || [0, 0, 0]; m.position.add(new THREE.Vector3(at[0] - c.x, at[1] - c.y, at[2] - c.z)); m.traverse((x) => { if (x.isMesh) { x.userData.real = true; if (o.shadow === false) x.castShadow = false; } });
    (o.parent || it.g).add(w); for (const h of o.hide || []) h.visible = false; it.real = w; o.done && o.done(w, m); };
  if (MODELS[name]) apply(); else loadPhysModels().then(apply);
}
