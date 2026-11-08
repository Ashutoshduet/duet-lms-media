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
