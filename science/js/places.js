// DUET Maths Lab 360: every activity happens in a real place, a 360° photo all around (Poly Haven, CC0) with its ground
// projected under the student's feet, lit by the same photo (HDR). Table activities sit on a real wooden table in it.
import * as THREE from 'three';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { GroundedSkybox } from 'three/addons/objects/GroundedSkybox.js';
import { BENCH, BENCH_Y } from './room.js';

const DIR = '../maths/'; // the Maths Lab's own files, next to science/ (this code runs with science/ as its base)
// img: 4096 × 2048 photo (places/<img>.jpg) + 1k HDR for the light (places/<img>_1k.hdr)
// h: height of the camera that took the photo (m), r: radius of the photo sphere (m), sun: direction of the sun in the photo
// (measured from the HDR) and its strength here, sky/fill: the soft light around, yaw: turn the photo (radians) so the
// place faces the right way
export const PLACES = {
  room: { img: 'church_meeting_room', h: 1.45, r: 12, sun: [0.865, 0.305, 0.399], sunI: 0.9, sky: 0.35, env: 0.9, table: true, name: { en: 'Meeting room', hi: 'मीटिंग रूम', hg: 'Meeting room' } },
  kitchen: { img: 'kiara_interior', h: 1.45, r: 9, sun: [0.702, 0.184, -0.688], sunI: 0.8, sky: 0.35, env: 1.0, table: true, name: { en: 'Kitchen', hi: 'रसोई', hg: 'Kitchen' } },
  quad: { img: 'quadrangle_sunny', h: 1.7, r: 60, sun: [0.42, 0.855, 0.305], sunI: 2.4, sky: 0.25, env: 1.0, name: { en: 'School courtyard', hi: 'स्कूल का आँगन', hg: 'School courtyard' } },
  rail: { img: 'bloem_train_track_clear', h: 1.6, r: 60, yaw: 2.119, sun: [0.796, 0.156, 0.585], sunI: 2.0, sky: 0.3, env: 1.0, name: { en: 'Railway line', hi: 'रेल की पटरी', hg: 'Railway line' } }, // turned so the track runs straight ahead (rails at x = −0.48 and +0.61, gauge 1.067 m)
  farm: { img: 'citrus_orchard_road', h: 1.6, r: 60, yaw: 1.492, sun: [0.712, 0.603, 0.359], sunI: 1.1, sky: 0.45, env: 1.0, name: { en: 'Farm', hi: 'फ़ार्म', hg: 'Farm' } }, // turned so the farm road runs straight ahead,
  khet: { img: 'farm_field', h: 1.6, r: 60, sun: [0.505, 0.779, 0.372], sunI: 1.3, sky: 0.45, env: 1.0, name: { en: 'Field', hi: 'खेत', hg: 'Khet' } },
  field: { img: 'suburban_football_field', h: 1.7, r: 60, yaw: -0.094, sun: [0.069, 0.767, 0.638], sunI: 0.9, sky: 0.5, env: 1.1, name: { en: 'Playground', hi: 'खेल का मैदान', hg: 'Khel ka maidan' } }, // turned so the pitch line runs straight ahead (it is the y-axis)
};

const sunDir = (P) => new THREE.Vector3(...P.sun).normalize().applyAxisAngle(new THREE.Vector3(0, 1, 0), P.yaw || 0);

export class Places {
  constructor(app) {
    this.app = app; this.cur = null; this.tok = 0; this.cache = new Map();
    this.root = new THREE.Group(); this.root.name = 'place'; app.world.add(this.root);
    this.table = makeTable(); this.table.visible = false; app.world.add(this.table);
    // soft shadows of the things standing on the ground (the photo's own ground cannot receive them)
    this.shadow = new THREE.Mesh(new THREE.CircleGeometry(30, 48).rotateX(-Math.PI / 2), new THREE.ShadowMaterial({ opacity: 0.32, depthWrite: false }));
    this.shadow.position.y = 0.002; this.shadow.receiveShadow = true; this.shadow.renderOrder = -1; this.root.add(this.shadow);
    this.lights = app.world.children.filter((o) => o.isLight);
    this.pm = new THREE.PMREMGenerator(app.renderer);
  }
  async load(name) {
    if (this.cache.has(name)) return this.cache.get(name);
    const P = PLACES[name];
    const p = (async () => {
      const [tex, hdr] = await Promise.all([
        new THREE.TextureLoader().loadAsync(DIR + 'places/' + P.img + '.jpg'),
        new RGBELoader().loadAsync(DIR + 'places/' + P.img + '_1k.hdr').catch(() => null),
      ]);
      tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 2;
      const sky = new GroundedSkybox(tex, P.h, P.r, 64); sky.position.y = P.h - 0.002; sky.rotation.y = P.yaw || 0; sky.material.toneMapped = false; sky.renderOrder = -10; sky.material.depthTest = true;
      let env = null; if (hdr) { hdr.mapping = THREE.EquirectangularReflectionMapping; env = this.pm.fromEquirectangular(hdr).texture; hdr.dispose(); }
      return { sky, env };
    })();
    this.cache.set(name, p);
    // keep at most three places in memory (a 4K photo is about 40 MB on the GPU)
    if (this.cache.size > 3) { const [k, v] = this.cache.entries().next().value; if (k !== this.cur) { this.cache.delete(k); v.then((o) => { o.sky.geometry.dispose(); o.sky.material.map.dispose(); o.sky.material.dispose(); if (o.env) o.env.dispose(); }); } }
    return p;
  }
  // put the student in a place; table: show the wooden table (defaults to the place's own choice)
  async set(name = 'room', o = {}) {
    if (!PLACES[name]) name = 'room';
    const P = PLACES[name], t = ++this.tok, app = this.app;
    this.table.visible = o.table ?? !!P.table;
    if (this.cur === name) return;
    let got; try { got = await this.load(name); } catch (e) { console.warn('place', name, e); return; }
    if (t !== this.tok) return;
    for (const c of [...this.root.children]) if (c !== this.shadow) this.root.remove(c);
    this.root.add(got.sky); this.cur = name;
    const sc = app.scene; sc.background = new THREE.Color(0x888888); if (got.env) { sc.environment = got.env; sc.environmentIntensity = P.env; if (sc.environmentRotation) sc.environmentRotation.set(0, P.yaw || 0, 0); }
    // light: the sun of the photo (casting the shadows), and a soft light from all around
    const sun = this.lights.find((l) => l.isDirectionalLight && l.castShadow), others = this.lights.filter((l) => l !== sun);
    if (sun) { const d = sunDir(P); const c = new THREE.Vector3(0, BENCH_Y, -0.75); sun.position.copy(c).addScaledVector(d, 6); sun.target.position.copy(c); sun.target.updateMatrixWorld(); sun.intensity = P.sunI; }
    for (const l of others) l.intensity = l.isHemisphereLight ? P.sky : P.sky * 0.4;
    if (app.renderer.shadowMap) app.renderer.shadowMap.needsUpdate = true;
    app.placeName = name;
  }
  // shadows over a larger area (things at real size out on the ground) or back to the table
  shadowBox(half = 0, centre = null) {
    const sun = this.lights.find((l) => l.isDirectionalLight && l.castShadow); if (!sun) return;
    const c = sun.shadow.camera;
    if (half) { c.left = -half; c.right = half; c.top = half; c.bottom = -half; c.far = half * 6; const P = PLACES[this.cur] || PLACES.room; const d = sunDir(P); const ctr = centre || new THREE.Vector3(0, 0, -half * 0.6); sun.position.copy(ctr).addScaledVector(d, half * 3); sun.target.position.copy(ctr); sun.target.updateMatrixWorld(); }
    else { c.left = -1.5; c.right = 1.5; c.top = 1.1; c.bottom = -1.1; c.far = 9; }
    c.updateProjectionMatrix(); if (this.app.renderer.shadowMap) this.app.renderer.shadowMap.needsUpdate = true;
  }
}

// a solid wooden table where the lab bench stands (same size, so everything put on the bench sits on it)
function makeTable() {
  const g = new THREE.Group(); g.name = 'mathsTable'; const L = new THREE.TextureLoader();
  const tx = (f, srgb) => { const t = L.load(DIR + 'tex/' + f); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(2.4, 0.8); t.anisotropy = 4; if (srgb) t.colorSpace = THREE.SRGBColorSpace; return t; };
  const top = new THREE.MeshStandardMaterial({ map: tx('wood_table_diff.jpg', true), normalMap: tx('wood_table_nor_gl.jpg'), roughnessMap: tx('wood_table_rough.jpg'), roughness: 1, color: 0xf2e2cc });
  const dark = new THREE.MeshStandardMaterial({ map: tx('wood_table_diff.jpg', true), roughness: 0.75, color: 0x7a5a3e });
  const w = BENCH.x1 - BENCH.x0, d = BENCH.z1 - BENCH.z0, cz = (BENCH.z0 + BENCH.z1) / 2, th = 0.045;
  const box = (sx, sy, sz, x, y, z, m) => { const b = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), m); b.position.set(x, y, z); b.castShadow = b.receiveShadow = true; g.add(b); return b; };
  const t = box(w, th, d, 0, BENCH_Y - th / 2, cz, top); t.name = 'tableTop';
  const lh = BENCH_Y - th, inset = 0.08;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(0.07, lh, 0.07, sx * (w / 2 - inset), lh / 2, cz + sz * (d / 2 - inset), dark);
  box(w - 2 * inset, 0.09, 0.03, 0, BENCH_Y - th - 0.045, cz + d / 2 - inset, dark); box(w - 2 * inset, 0.09, 0.03, 0, BENCH_Y - th - 0.045, cz - d / 2 + inset, dark);
  return g;
}
