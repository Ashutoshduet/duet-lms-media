// DUET AR models made in code (our own work): the maths solids, ball-and-stick molecules and the Sun.
// Each mesh has a name that js/info.js can explain when it is tapped (face, edge, vertex, an atom, a bond).
// Units: metres-ish; modes.js sizes every model to the mode anyway.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// --------------------------------------------------------------------------------------------- materials
const M = {};
function mats() {
  if (M.face) return M;
  // frosted acrylic teaching solids: tinted faces you can see into, graphite edges, brass corners
  M.face = (hex) => new THREE.MeshStandardMaterial({ color: hex, roughness: 0.32, metalness: 0, transparent: true, opacity: 0.62, side: THREE.DoubleSide, depthWrite: false });
  M.curved = (hex) => new THREE.MeshStandardMaterial({ color: hex, roughness: 0.3, metalness: 0, transparent: true, opacity: 0.58, side: THREE.DoubleSide, depthWrite: false });
  M.edge = new THREE.MeshStandardMaterial({ color: 0x2a2f38, roughness: 0.45, metalness: 0.55 });
  M.vertex = new THREE.MeshStandardMaterial({ color: 0xc9a24a, roughness: 0.28, metalness: 0.85 });
  M.bond = new THREE.MeshStandardMaterial({ color: 0xb9bec7, roughness: 0.32, metalness: 0.35 });
  return M;
}
const FACE_COLORS = [0x4f8fd9, 0xe0794a, 0x58b07a, 0xd9b24a, 0x9a72d6, 0x4fb8c4, 0xd7607c, 0x7f9a4a];

function edgeMesh(a, b, r, name) {
  const d = new THREE.Vector3().subVectors(b, a), len = d.length();
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 10, 1), mats().edge);
  m.position.copy(a).addScaledVector(d, 0.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); m.name = name; return m;
}
function vertexMesh(p, r, name) { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), mats().vertex); m.position.copy(p); m.name = name; return m; }

/** a polyhedron from its corners and faces (lists of corner indices, counter-clockwise seen from outside) */
function polyhedron(V, F, faceName) {
  const g = new THREE.Group(), M = mats(), er = 0.012, vr = 0.024, edges = new Map();
  F.forEach((f, i) => {
    const pos = [], c = new THREE.Vector3();
    for (const k of f) c.add(V[k]); c.multiplyScalar(1 / f.length);
    for (let j = 1; j < f.length - 1; j++) pos.push(...V[f[0]].toArray(), ...V[f[j]].toArray(), ...V[f[j + 1]].toArray());
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.computeVertexNormals();
    // a slightly smaller face, so the edges show as rods
    geo.translate(-c.x, -c.y, -c.z); geo.scale(0.985, 0.985, 0.985); geo.translate(c.x, c.y, c.z);
    const m = new THREE.Mesh(geo, M.face(FACE_COLORS[i % FACE_COLORS.length])); m.name = 'face:' + faceName(f, i); m.renderOrder = 2; g.add(m);
    for (let j = 0; j < f.length; j++) { const a = f[j], b = f[(j + 1) % f.length], k = a < b ? a + ',' + b : b + ',' + a; if (!edges.has(k)) edges.set(k, [a, b]); }
  });
  for (const [a, b] of edges.values()) g.add(edgeMesh(V[a], V[b], er, 'edge'));
  V.forEach((p) => g.add(vertexMesh(p, vr, 'vertex')));
  g.userData.fev = [F.length, edges.size, V.length];
  return g;
}
const v3 = (x, y, z) => new THREE.Vector3(x, y, z);
const polyName = (n) => (n === 3 ? 'triangle' : n === 4 ? 'rectangle' : n === 5 ? 'pentagon' : n === 6 ? 'hexagon' : 'polygon');

/** a round solid: flat faces (circles) and one curved surface, with the rim edges as rods */
function roundSolid(kind) {
  const g = new THREE.Group(), M = mats(), r = 0.5, h = 1.0, er = 0.012;
  const curved = (geo, hex) => { const m = new THREE.Mesh(geo, M.curved(hex)); m.name = 'face:curved'; m.renderOrder = 2; return m; };
  const disc = (y, flip, hex) => { const geo = new THREE.CircleGeometry(r * 0.99, 64); geo.rotateX(flip ? Math.PI / 2 : -Math.PI / 2); geo.translate(0, y, 0); const m = new THREE.Mesh(geo, M.face(hex)); m.name = 'face:circle'; m.renderOrder = 2; return m; };
  const rim = (y, rad) => { const t = new THREE.Mesh(new THREE.TorusGeometry(rad, er, 8, 72), M.edge); t.rotation.x = Math.PI / 2; t.position.y = y; t.name = 'edge:curved'; return t; };
  if (kind === 'cylinder') { g.add(curved(new THREE.CylinderGeometry(r, r, h, 64, 1, true).translate(0, h / 2, 0), 0x4f8fd9), disc(0, true, 0xe0794a), disc(h, false, 0xe0794a), rim(0, r), rim(h, r)); g.userData.fev = [3, 2, 0]; }
  if (kind === 'cone') { g.add(curved(new THREE.ConeGeometry(r, h, 64, 1, true).translate(0, h / 2, 0), 0x58b07a), disc(0, true, 0xd9b24a), rim(0, r), vertexMesh(v3(0, h, 0), 0.024, 'vertex:apex')); g.userData.fev = [2, 1, 1]; }
  if (kind === 'sphere') { g.add(curved(new THREE.SphereGeometry(r, 64, 40).translate(0, r, 0), 0x9a72d6)); g.userData.fev = [1, 0, 0]; }
  if (kind === 'hemisphere') { g.add(curved(new THREE.SphereGeometry(r, 64, 24, 0, Math.PI * 2, 0, Math.PI / 2), 0x4fb8c4), disc(0, true, 0xd7607c), rim(0, r)); g.userData.fev = [2, 1, 0]; }
  return g;
}

export function buildSolid(kind) {
  let g;
  if (kind === 'cube' || kind === 'cuboid') {
    const [x, y, z] = kind === 'cube' ? [0.4, 0.8, 0.4] : [0.6, 0.6, 0.35];
    const y0 = 0, y1 = kind === 'cube' ? 0.8 : 0.6;
    const V = [v3(-x, y0, -z), v3(x, y0, -z), v3(x, y0, z), v3(-x, y0, z), v3(-x, y1, -z), v3(x, y1, -z), v3(x, y1, z), v3(-x, y1, z)];
    void y;
    const F = [[0, 1, 2, 3], [4, 7, 6, 5], [0, 4, 5, 1], [2, 6, 7, 3], [1, 5, 6, 2], [0, 3, 7, 4]];
    g = polyhedron(V, F, () => (kind === 'cube' ? 'square' : 'rectangle'));
  } else if (kind === 'pyramid') {
    const s = 0.45, h = 0.8, V = [v3(-s, 0, -s), v3(s, 0, -s), v3(s, 0, s), v3(-s, 0, s), v3(0, h, 0)];
    g = polyhedron(V, [[0, 1, 2, 3], [0, 4, 1], [1, 4, 2], [2, 4, 3], [3, 4, 0]], (f) => (f.length === 4 ? 'square' : 'triangle'));
  } else if (kind === 'prism') {
    const s = 0.42, L = 0.45, h = s * Math.sqrt(3);
    const V = [v3(-s, 0, -L), v3(s, 0, -L), v3(0, h, -L), v3(-s, 0, L), v3(s, 0, L), v3(0, h, L)];
    g = polyhedron(V, [[0, 2, 1], [3, 4, 5], [0, 1, 4, 3], [1, 2, 5, 4], [2, 0, 3, 5]], (f) => (f.length === 3 ? 'triangle' : 'rectangle'));
  } else if (kind === 'hexprism') {
    const r = 0.42, hh = 0.75, V = [];
    for (let i = 0; i < 6; i++) V.push(v3(r * Math.cos(i * Math.PI / 3), 0, r * Math.sin(i * Math.PI / 3)));
    for (let i = 0; i < 6; i++) V.push(v3(r * Math.cos(i * Math.PI / 3), hh, r * Math.sin(i * Math.PI / 3)));
    const F = [[5, 4, 3, 2, 1, 0], [6, 7, 8, 9, 10, 11]]; for (let i = 0; i < 6; i++) { const j = (i + 1) % 6; F.push([i, j, j + 6, i + 6]); }
    g = polyhedron(V, F, (f) => polyName(f.length));
  } else g = roundSolid(kind);
  g.name = 'solid:' + kind;
  g.userData.explode = 'faces';
  return g;
}

// --------------------------------------------------------------------------------------------- molecules
// colours as in the Science Lab's particle view (close to the usual CPK colours); sizes: a share of the covalent radius
const EL = { H: ['#f2f2f2', 0.25], C: ['#40444b', 0.38], N: ['#3b6fe0', 0.36], O: ['#e0392f', 0.35], Na: ['#9d6ae0', 0.42], Cl: ['#3cc26f', 0.48] };
const atomMat = {};
function atom(el, p, scale = 1) {
  const [c, r] = EL[el];
  const mat = atomMat[el] || (atomMat[el] = new THREE.MeshStandardMaterial({ color: c, roughness: 0.22, metalness: 0.05 }));
  const m = new THREE.Mesh(new THREE.SphereGeometry(r * scale, 32, 24), mat); m.position.copy(p); m.name = 'atom:' + el; return m;
}
function bond(a, b, order = 1, r = 0.07) {
  const g = new THREE.Group(); g.name = 'bond:' + order;
  const d = new THREE.Vector3().subVectors(b, a), side = new THREE.Vector3(0, 0, 1).cross(d).normalize();
  if (side.lengthSq() < 1e-6) side.set(1, 0, 0);
  const offs = order === 1 ? [0] : order === 2 ? [-1, 1] : [-1.4, 0, 1.4];
  for (const o of offs) { const s = side.clone().multiplyScalar(o * r * 1.6); const m = edgeMesh(a.clone().add(s), b.clone().add(s), order === 1 ? r : r * 0.75, 'bond:' + order); m.material = mats().bond; g.add(m); }
  return g;
}
export function buildMolecule(kind) {
  const g = new THREE.Group(); g.name = 'molecule:' + kind; g.userData.explode = 'atoms';
  const add = (el, p, s) => { const m = atom(el, p, s); g.add(m); return p; };
  if (kind === 'water') {      // H–O–H 104.5°, O–H 0.96 Å
    const L = 0.96, a = THREE.MathUtils.degToRad(104.5 / 2), O = add('O', v3(0, 0.6, 0));
    for (const s of [-1, 1]) { const H = add('H', v3(s * L * Math.sin(a), 0.6 - L * Math.cos(a), 0)); g.add(bond(O, H)); }
  } else if (kind === 'co2') {  // O=C=O, linear, 1.16 Å
    const C = add('C', v3(0, 0.5, 0));
    for (const s of [-1, 1]) { const O = add('O', v3(s * 1.16, 0.5, 0)); g.add(bond(C, O, 2)); }
  } else if (kind === 'methane') {  // tetrahedral, C–H 1.09 Å
    const C = add('C', v3(0, 0.7, 0)), L = 1.09;
    const dirs = [v3(1, 1, 1), v3(1, -1, -1), v3(-1, 1, -1), v3(-1, -1, 1)].map((d) => d.normalize());
    const q = new THREE.Quaternion().setFromUnitVectors(dirs[0], v3(0, 1, 0)); // one C–H straight up
    for (const d of dirs) { const H = add('H', C.clone().addScaledVector(d.applyQuaternion(q), L)); g.add(bond(C, H)); }
  } else if (kind === 'ammonia') {  // trigonal pyramid, H–N–H 107°, N–H 1.01 Å
    const N = add('N', v3(0, 0.75, 0)), L = 1.01, tilt = THREE.MathUtils.degToRad(112);
    for (let i = 0; i < 3; i++) { const az = i * 2 * Math.PI / 3; const H = add('H', N.clone().add(v3(L * Math.sin(tilt) * Math.cos(az), L * Math.cos(tilt), L * Math.sin(tilt) * Math.sin(az)))); g.add(bond(N, H)); }
  } else if (kind === 'nacl') {  // rock-salt crystal, 3×3×3 ions
    const a = 0.56; g.userData.explode = 'atoms';
    for (let i = -1; i <= 1; i++) for (let j = 0; j <= 2; j++) for (let k = -1; k <= 1; k++) {
      const el = (i + j + k) % 2 === 0 ? 'Cl' : 'Na'; add(el, v3(i * a, j * a + 0.3, k * a), el === 'Cl' ? 0.62 : 0.55);
    }
    for (let i = -1; i <= 1; i++) for (let j = 0; j <= 2; j++) for (let k = -1; k <= 1; k++) {
      const p = v3(i * a, j * a + 0.3, k * a);
      if (i < 1) g.add(bond(p, v3((i + 1) * a, j * a + 0.3, k * a), 1, 0.035));
      if (j < 2) g.add(bond(p, v3(i * a, (j + 1) * a + 0.3, k * a), 1, 0.035));
      if (k < 1) g.add(bond(p, v3(i * a, j * a + 0.3, (k + 1) * a), 1, 0.035));
    }
    // the 54 bonds as one mesh (one draw call on a phone instead of 54)
    const geos = []; g.updateMatrixWorld(true);
    g.traverse((o) => { if (o.isMesh && o.name === 'bond:1') geos.push(o.geometry.clone().applyMatrix4(o.matrixWorld)); });
    for (const b of g.children.filter((o) => o.name === 'bond:1')) g.remove(b);
    const all = new THREE.Mesh(mergeGeometries(geos), mats().bond); all.name = 'bond:ionic'; g.add(all);
  }
  return g;
}

// --------------------------------------------------------------------------------------------- the Sun
export async function buildSun(map) {
  const g = new THREE.Group(), tilt = new THREE.Group(); g.add(tilt);
  map.colorSpace = THREE.SRGBColorSpace;
  // the photosphere glows by itself (no light needed) with darker edges (limb darkening)
  const mat = new THREE.MeshBasicMaterial({ map, color: 0xffffff });
  mat.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying float vRim;').replace('#include <project_vertex>', '#include <project_vertex>\nvec3 nV = normalize(normalMatrix * normal); vec3 vV = normalize(-mvPosition.xyz); vRim = clamp(dot(nV, vV), 0.0, 1.0);');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vRim;').replace('#include <map_fragment>', '#include <map_fragment>\ndiffuseColor.rgb *= vec3(1.25, 1.05, 0.8) * (0.55 + 0.45 * pow(vRim, 0.5));');
  };
  mat.customProgramCacheKey = () => 'duet-sun';
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.5, 64, 48), mat); ball.name = 'sun'; tilt.add(ball);
  // a soft corona: a sprite that always faces you
  const cv = document.createElement('canvas'); cv.width = cv.height = 256; const c = cv.getContext('2d'), gr = c.createRadialGradient(128, 128, 60, 128, 128, 128);
  gr.addColorStop(0, 'rgba(255,210,120,0.75)'); gr.addColorStop(0.35, 'rgba(255,150,40,0.28)'); gr.addColorStop(1, 'rgba(255,120,20,0)');
  c.fillStyle = gr; c.fillRect(0, 0, 256, 256);
  const tx = new THREE.CanvasTexture(cv); tx.colorSpace = THREE.SRGBColorSpace;
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: tx, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); glow.scale.setScalar(1.75); glow.name = 'corona'; glow.raycast = () => {};
  tilt.add(glow);
  tilt.rotation.z = THREE.MathUtils.degToRad(7.25);
  g.userData.spinTarget = ball;
  return g;
}
