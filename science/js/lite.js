// Light mode for headsets (Meta Quest and other standalone headsets) and for phones and tablets: the same lab with less
// GPU work, for a steady 72 fps on a Quest (Meta VRC.Quest.Performance.1) and no freezes on a phone when a burner is lit.
// Turn it on or off for a test with ?lite=1 / ?lite=0.
//  - small "glow" lights of burners, bulbs and flames are left out: every extra light makes every lit surface in the
//    room more expensive, and adding one while the lab runs recompiles every material (a visible freeze)
//  - glass that uses transmission (an extra full render of the scene per eye) becomes plain see-through glass
//  - shadows use a cheaper filter and are redrawn every third frame
//  - the room's fixed furniture is merged into a few meshes (fewer draw calls per eye)
//  - see-through two-sided glass is drawn in a single pass
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
export const HEADSET = /OculusBrowser|Quest|Pico|Vive|Wolvic/i.test(navigator.userAgent || '');
export const LITE = (() => {
  try { const q = new URLSearchParams(location.search).get('lite'); if (q != null) return q !== '0'; } catch (e) { /* no URL */ }
  const ua = navigator.userAgent || '';
  return /OculusBrowser|Quest|Pico|Vive|Wolvic/i.test(ua) || (typeof window !== 'undefined' && !!window.DuetNative) || /Android|iPhone|iPad|iPod|Mobi/i.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
})();
// a light that is never drawn: visible stays false whatever the experiment code sets
export function lockOff(L) {
  if (!L || L.userData.liteOff) return; L.userData.liteOff = true; L.castShadow = false;
  try { Object.defineProperty(L, 'visible', { get: () => false, set: () => {}, configurable: true }); } catch (e) { L.visible = false; }
}
// called for every piece of apparatus put on the bench (and, in headset mode, for anything added to the scene later,
// such as the flame of a burner when it is lit)
export function liteItem(root) {
  if (!LITE || !root) return;
  root.traverse((o) => {
    if ((o.isPointLight || o.isSpotLight) && !o.castShadow && o.distance > 0 && o.distance <= 1.5) lockOff(o);
    if (o.isMesh) for (const m of [].concat(o.material)) {
      if (!m) continue;
      if (m.transmission > 0) { m.transmission = 0; m.transparent = true; m.opacity = Math.min(m.opacity == null ? 1 : m.opacity, 0.5); m.depthWrite = false; m.needsUpdate = true; }
      // see-through two-sided glass is drawn in one pass, not back faces then front faces: half the draw calls, and three.js
      // no longer re-selects the shader twice per object per eye every frame (the largest CPU cost measured on a Quest 3S)
      if (m.transparent && m.side === THREE.DoubleSide && !m.forceSinglePass) m.forceSinglePass = true;
    }
  });
}

// headset mode: whatever is added later (a flame lit in the middle of an experiment, a glow) follows the same rules, so
// the number of lights never changes while the lab runs (a change recompiles every material: a freeze of about a second)
if (LITE) {
  const add0 = THREE.Object3D.prototype.add;
  // only for what joins the scene itself: a model being put together piece by piece is looked at once, when it is added to the scene
  THREE.Object3D.prototype.add = function (...objs) {
    const r = add0.apply(this, objs);
    let top = this; while (top.parent) top = top.parent;
    if (top.isScene) for (const o of objs) if (o && o.isObject3D && o !== this) liteItem(o);
    return r;
  };
}

// headset mode: merge the room's fixed furniture into one mesh per look (material, shadows, AR group): about 45 draw calls
// per eye become about 15. Only plain static meshes are merged; anything named or flagged keeps its own mesh.
export function liteMerge(room) {
  if (!LITE || !room) return 0;
  room.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(room.matrixWorld).invert();
  const mkey = (m) => { const c = (x) => (x && x.isColor ? x.getHexString() : ''); const t = (x) => (x ? x.uuid : '');
    return [m.type, c(m.color), c(m.emissive), m.emissiveIntensity, t(m.map), t(m.normalMap), t(m.roughnessMap), t(m.metalnessMap), t(m.aoMap), t(m.emissiveMap), t(m.alphaMap),
      m.roughness, m.metalness, m.opacity, m.transparent, m.side, m.depthWrite, m.alphaTest, m.vertexColors, m.envMapIntensity, m.toneMapped, m.flatShading].join('|'); };
  const groups = new Map(); let n0 = 0;
  const topOf = (o) => { let p = o; while (p.parent && p.parent !== room) p = p.parent; return p; };
  const visible = (o) => { for (let p = o; p && p !== room; p = p.parent) if (!p.visible) return false; return true; };
  room.traverse((o) => {
    if (!o.isMesh || o.isInstancedMesh || o.isSkinnedMesh || Array.isArray(o.material) || !o.geometry || o.name === 'benchTop' || o.onBeforeRender !== THREE.Object3D.prototype.onBeforeRender) return;
    if (!visible(o) || o.morphTargetInfluences || o.renderOrder) return;
    const g = o.geometry; const attrs = Object.keys(g.attributes).filter((a) => ['position', 'normal', 'uv', 'uv1', 'color', 'tangent'].includes(a)).sort();
    if (!attrs.includes('position') || !attrs.includes('normal') || Object.keys(g.morphAttributes || {}).length) return;
    const ar = !!topOf(o).userData.ar;
    const key = [mkey(o.material), o.castShadow, o.receiveShadow, ar, !!o.userData.noHit, attrs.join(','), g.index ? 1 : 0].join('#');
    if (!groups.has(key)) groups.set(key, { list: [], mat: o.material, cast: o.castShadow, recv: o.receiveShadow, ar, noHit: !!o.userData.noHit, attrs });
    groups.get(key).list.push(o); n0++;
  });
  let made = 0;
  for (const G of groups.values()) {
    if (G.list.length < 2) continue;
    // every attribute as plain 32-bit floats first: a compressed model (KHR_mesh_quantization) keeps its positions as
    // 16-bit numbers between −1 and 1, and moving it to its place in the room would clip everything beyond 1 m
    // (the stools at the side benches were squashed into a long board across the front of the bench)
    const toF = (at) => { const n = at.count, s = at.itemSize, out = new Float32Array(n * s), get = ['getX', 'getY', 'getZ', 'getW'];
      for (let i = 0; i < n; i++) for (let k = 0; k < s; k++) out[i * s + k] = at[get[k]](i); return new THREE.BufferAttribute(out, s); };
    const geos = G.list.map((o) => { const src = o.geometry; const g = new THREE.BufferGeometry(); for (const a of G.attrs) g.setAttribute(a, toF(src.attributes[a])); if (src.index) g.setIndex(src.index.clone());
      g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld)); return g; });
    let merged = null; try { merged = mergeGeometries(geos, false); } catch (e) { merged = null; }
    geos.forEach((g) => g.dispose()); if (!merged) continue;
    const m = new THREE.Mesh(merged, G.mat); m.castShadow = G.cast; m.receiveShadow = G.recv; m.userData.ar = G.ar; if (G.noHit) m.userData.noHit = true; m.userData.liteMerged = G.list.length;
    room.add(m); for (const o of G.list) o.removeFromParent(); made++;
  }
  return { meshes: n0, merged: made };
}
