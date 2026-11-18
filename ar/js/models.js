// Loads one catalog item for DUET AR: a GLB from another DUET app (by relative path, nothing is copied), a model made
// in code (js/procedural.js: maths solids, molecules, the Sun), or a planet made from its surface map.
// Returns { root, clips } where root is ready for startMode() (modes.js sizes it).
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { clone as skClone } from 'three/addons/utils/SkeletonUtils.js';
import { tintAnatomy } from './anatomy.js';
import { buildSolid, buildMolecule, buildSun } from './procedural.js';

let loader = null;
function gltfLoader() {
  if (!loader) { loader = new GLTFLoader(); loader.setMeshoptDecoder(MeshoptDecoder); }
  return loader;
}
// the same GLB for several items (the whole body and its systems): fetched once
const glbCache = new Map();
function loadGLB(url, onProgress) {
  if (!glbCache.has(url)) {
    const p = gltfLoader().loadAsync(url, (e) => { if (onProgress && e.total) onProgress(e.loaded / e.total); });
    glbCache.set(url, p); p.catch(() => glbCache.delete(url));
    if (glbCache.size > 3) glbCache.delete(glbCache.keys().next().value);
  }
  return glbCache.get(url);
}
const baseName = (n) => (n || '').replace(/_\d+$/, '');

/** item: a catalog.json item (or {src} for any GLB path). onProgress(0..1). base: URL the paths are relative to. */
export async function loadItem(item, { onProgress, base = location.href, renderer } = {}) {
  const holder = new THREE.Group(); holder.name = 'duet-model:' + (item.id || 'model');
  if (item.rx) holder.rotation.x = THREE.MathUtils.degToRad(item.rx);
  let clips = [];
  if (item.planet) {
    holder.add(await planet(item.planet, base, renderer));
    onProgress && onProgress(1);
  } else if (item.proc) {
    const [kind, arg] = item.proc.split(':');
    let g;
    if (kind === 'solid') g = buildSolid(arg);
    else if (kind === 'molecule') g = buildMolecule(arg);
    else if (kind === 'sun') g = await buildSun(await new THREE.TextureLoader().loadAsync(new URL(item.map, base).href));
    holder.add(g); holder.userData.explode = g.userData.explode; holder.userData.spinTarget = g.userData.spinTarget;
    onProgress && onProgress(1);
  } else {
    const url = new URL(item.src, base).href;
    const g = await loadGLB(url, onProgress);
    // a fresh copy each time (the cached GLB may be shown again as another item with other parts)
    const sc = cloneScene(g.scene);
    if (item.show || item.hide) {
      const keep = item.show ? new Set([...item.show, ...(item.ghost ? [item.ghost] : [])]) : null, drop = new Set(item.hide || []);
      const gone = []; sc.traverse((o) => { if (o.isMesh) { const n = baseName(o.name); if ((keep && !keep.has(n)) || drop.has(n)) gone.push(o); } });
      for (const o of gone) o.parent.remove(o);
    }
    sc.traverse((o) => {
      if (o.isMesh) {
        o.frustumCulled = !o.isSkinnedMesh;               // skinned meshes move outside their bind box
        const ms = Array.isArray(o.material) ? o.material : [o.material];
        for (const m of ms) if (m && m.map && renderer) m.map.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
      }
    });
    if (item.tint === 'anatomy') tintAnatomy(sc, { ghost: item.ghost });
    holder.add(sc); clips = g.animations || [];
    let meshes = 0; sc.traverse((o) => { if (o.isMesh) meshes++; });
    if (meshes >= 3) holder.userData.explode = 'parts';
  }
  return { root: holder, clips };
}
/** a copy that shares geometry but has its own materials (they are painted and faded per item) */
function cloneScene(s) {
  const c = skClone(s);
  c.traverse((o) => { if (o.isMesh) o.material = Array.isArray(o.material) ? o.material.map((m) => m.clone()) : o.material.clone(); });
  return c;
}

async function planet(p, base, renderer) {
  const tl = new THREE.TextureLoader(), load = (u) => tl.loadAsync(new URL(u, base).href);
  const g = new THREE.Group(), tilt = new THREE.Group(); g.add(tilt);
  const map = await load(p.map); map.colorSpace = THREE.SRGBColorSpace; if (renderer) map.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.5, 96, 64), new THREE.MeshStandardMaterial({ map, roughness: 0.92, metalness: 0 }));
  ball.name = 'planet'; tilt.add(ball);
  if (p.ring) {
    const rt = await load(p.ring); rt.colorSpace = THREE.SRGBColorSpace;
    const inner = 0.62, outer = 1.18, geo = new THREE.RingGeometry(inner, outer, 128, 1);
    const pos = geo.attributes.position, uv = geo.attributes.uv, v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) { v.fromBufferAttribute(pos, i); uv.setXY(i, (v.length() - inner) / (outer - inner), 0.5); }  // the strip runs from the inside out
    const ring = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: rt, transparent: true, side: THREE.DoubleSide, roughness: 1, depthWrite: false }));
    ring.rotation.x = -Math.PI / 2; ring.name = 'ring'; tilt.add(ring);
  }
  tilt.rotation.z = THREE.MathUtils.degToRad(p.tilt || 0);
  g.userData.spinTarget = ball;
  return g;
}
