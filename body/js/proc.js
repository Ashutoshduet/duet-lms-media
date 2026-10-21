// Procedural Organ Lab models: a molar tooth cut in half, and a block of skin cut open.
// Units are model units (the lab scales them to the pedestal). The cut face looks at +z.
import * as THREE from 'three';
import { PathCurve } from './flows.js';
import { Label } from './labels.js';

const v2 = (x, y) => new THREE.Vector2(x, y);
const V = (x, y, z = 0) => new THREE.Vector3(x, y, z);

function mat(color, o = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: o.r ?? 0.55, metalness: 0, transparent: true, opacity: o.op ?? 1, depthWrite: (o.op ?? 1) > 0.98, side: THREE.DoubleSide, map: o.map || null });
}
function mesh(geo, m, pid) { const x = new THREE.Mesh(geo, m); x.userData.pid = pid; return x; }

// smooth open curve through points, sampled evenly
function spline(pts, n = 80, closed = false) {
  const c = new THREE.SplineCurve(pts);
  if (closed) { const cc = new THREE.CatmullRomCurve3(pts.map((p) => V(p.x, p.y)), true, 'centripetal'); return cc.getSpacedPoints(n).slice(0, n).map((p) => v2(p.x, p.y)); }
  return c.getSpacedPoints(n);
}
// offset an open polyline sideways (towards `toward`), thickness may vary along it
function offset(pts, th, toward) {
  const out = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    const t = v2(b.x - a.x, b.y - a.y).normalize();
    let n = v2(-t.y, t.x);
    const f = i / (pts.length - 1);
    const d = typeof th === 'function' ? th(f) : th;
    if (toward) { const w = v2(toward.x - pts[i].x, toward.y - pts[i].y); if (n.dot(w) < 0) n.negate(); } else n.negate();
    out.push(v2(pts[i].x + n.x * d, pts[i].y + n.y * d));
  }
  return out;
}
function shapeOf(pts, holes = []) {
  const s = new THREE.Shape(pts);
  for (const h of holes) s.holes.push(new THREE.Path(h));
  return s;
}
// extrude a section backwards (-z) and round the back so it looks like the other half of a solid object
function extrude(shape, depth, round = 0, axisX = 0) {
  const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 6, steps: round ? 6 : 1 });
  g.translate(0, 0, -depth);
  if (round) {
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const z = p.getZ(i), f = Math.min(1, -z / depth);
      const k = Math.sqrt(Math.max(0.05, 1 - f * f * round));
      p.setX(i, axisX + (p.getX(i) - axisX) * k);
    }
    g.computeVertexNormals();
  }
  return g;
}
function tubeMesh(pts, r, color, pid, seg) {
  const c = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
  return mesh(new THREE.TubeGeometry(c, seg || pts.length * 10, r, 8, false), mat(color, { r: 0.4 }), pid);
}
function dotsTexture(bg, dot, n = 260, rmax = 8) {
  const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d');
  x.fillStyle = bg; x.fillRect(0, 0, 256, 256);
  for (let i = 0; i < n; i++) { x.fillStyle = dot; x.globalAlpha = 0.35 + Math.random() * 0.4; x.beginPath(); x.ellipse(Math.random() * 256, Math.random() * 256, 2 + Math.random() * rmax, 2 + Math.random() * rmax * 0.7, Math.random() * 3, 0, 7); x.fill(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}
function tagSprite(lines, color) {
  const lb = new Label(lines, { height: 0.026, leader: false, cy: 0, big: 26, small: 20, color: color || '#f5f1ea' });
  return lb;
}

// ================================================================ tooth
export function buildTooth() {
  const G = new THREE.Group();
  // crown (enamel outer) from left neck over the cusps to right neck
  const crownOut = spline([v2(-0.4, 0), v2(-0.47, 0.18), v2(-0.47, 0.4), v2(-0.4, 0.56), v2(-0.27, 0.65), v2(-0.14, 0.58), v2(0, 0.52), v2(0.14, 0.58), v2(0.27, 0.65), v2(0.4, 0.56), v2(0.47, 0.4), v2(0.47, 0.18), v2(0.4, 0)], 90);
  const dej = offset(crownOut, (f) => 0.1 * Math.pow(Math.sin(Math.PI * f), 0.55), v2(0, 0.25));
  // root surface, right neck → around both roots → left neck
  const rootOut = spline([v2(0.4, 0), v2(0.385, -0.3), v2(0.34, -0.66), v2(0.28, -0.97), v2(0.2, -1.13), v2(0.13, -0.97), v2(0.095, -0.6), v2(0.055, -0.4), v2(0, -0.35), v2(-0.055, -0.4), v2(-0.095, -0.6), v2(-0.13, -0.97), v2(-0.2, -1.13), v2(-0.28, -0.97), v2(-0.34, -0.66), v2(-0.385, -0.3), v2(-0.4, 0)], 160);
  const pulp = spline([v2(-0.2, 0.06), v2(-0.23, 0.24), v2(-0.18, 0.38), v2(-0.1, 0.3), v2(0, 0.27), v2(0.1, 0.3), v2(0.18, 0.38), v2(0.23, 0.24), v2(0.22, 0.02),
    v2(0.24, -0.35), v2(0.235, -0.72), v2(0.21, -1.04), v2(0.195, -1.08), v2(0.185, -1.03), v2(0.185, -0.72), v2(0.165, -0.4), v2(0.11, -0.13), v2(0, -0.09),
    v2(-0.11, -0.13), v2(-0.165, -0.4), v2(-0.185, -0.72), v2(-0.185, -1.03), v2(-0.195, -1.08), v2(-0.21, -1.04), v2(-0.235, -0.72), v2(-0.24, -0.35), v2(-0.22, 0.02)], 140, true);
  const cemOut = offset(rootOut, (f) => 0.028 * Math.min(1, Math.sin(Math.PI * f) * 3), v2(0, 3));
  const toothBack = (p) => p; // placeholder for clarity
  const outward = (pts, d) => pts.map((p, i) => p); // eslint quiet
  // periodontal ligament from the bone crest down
  const crest = -0.13;
  const pdlIn = cemOut.filter((p) => p.y <= crest + 0.001);
  const pdlOut = offset(pdlIn, 0.04, v2(0, 3));
  const D = 0.47;
  const parts = {};
  const add = (pid, geo, m) => { const x = mesh(geo, m, pid); G.add(x); (parts[pid] ||= []).push(x); return x; };
  add('enamel', extrude(shapeOf([...crownOut, ...dej.slice().reverse()]), D, 1), mat('#f8f6ef', { r: 0.25 }));
  add('dentin', extrude(shapeOf([...dej, ...rootOut.slice(1, -1)], [pulp]), D, 1), mat('#f3d27f', { r: 0.5 }));
  add('pulp', extrude(shapeOf(pulp), D * 0.9, 1), mat('#e8697a', { r: 0.6 }));
  add('cementum', extrude(shapeOf([...rootOut, ...cemOut.slice().reverse()]), D, 1), mat('#d8be86', { r: 0.6 }));
  add('periodontal_ligament', extrude(shapeOf([...pdlIn, ...pdlOut.slice().reverse()]), D, 1), mat('#ee9aa2', { r: 0.6 }));
  // jaw bone around the roots, open at the top
  const bonePts = [v2(0.9, crest), v2(0.9, -1.38), v2(-0.9, -1.38), v2(-0.9, crest), ...pdlOut.slice().reverse()];
  const boneTex = dotsTexture('#cdbb98', '#a88f66', 420, 9); boneTex.repeat.set(1.8, 1.8);
  const bone = add('tooth_socket', extrude(shapeOf(bonePts), 0.95), mat('#ffffff', { r: 0.8, map: boneTex }));
  bone.geometry.attributes.uv && (() => { const uv = bone.geometry.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 0.6, uv.getY(i) * 0.6); })();
  // gums
  const gumL = [v2(-0.9, crest - 0.01), v2(-0.9, 0.03), v2(-0.66, 0.07), v2(-0.52, 0.11), v2(-0.455, 0.08), v2(-0.425, 0.0), v2(-0.41, -0.06), pdlOut[pdlOut.length - 1]];
  const gumR = gumL.map((p) => v2(-p.x, p.y)).reverse();
  gumR[0] = pdlOut[0];
  const gm = mat('#e5848f', { r: 0.6 });
  add('gums', extrude(shapeOf(gumL), 0.95), gm); add('gums', extrude(shapeOf(gumR), 0.95), gm);
  // nerves and blood vessels up each root canal into the pulp
  const NV = new THREE.Group(); G.add(NV);
  const z = 0.012;
  const ves = (dx, col, pid) => {
    for (const s of [1, -1]) {
      const pts = [V(s * 0.38 + dx, -1.38, z), V(s * 0.27 + dx, -1.25, z), V(s * 0.205 + dx * 0.4, -1.12, z), V(s * 0.208 + dx * 0.4, -0.75, z), V(s * 0.19 + dx * 0.5, -0.35, z), V(s * 0.14 + dx, 0.05, z), V(s * 0.16 + dx * 0.5, 0.28, z)];
      const t = tubeMesh(pts, 0.0085, col, 'tooth_nerves_vessels'); NV.add(t); (parts.tooth_nerves_vessels ||= []).push(t);
    }
  };
  ves(-0.014, '#d1232f'); ves(0.014, '#3557c4'); ves(0, '#f2d34b');
  const paths = {
    nerve_l: [V(-0.16, 0.28, z + 0.01), V(-0.14, 0.05, z + 0.01), V(-0.19, -0.35, z + 0.01), V(-0.208, -0.75, z + 0.01), V(-0.205, -1.12, z + 0.01), V(-0.27, -1.25, z + 0.01), V(-0.38, -1.38, z + 0.01)],
    nerve_r: [V(0.16, 0.28, z + 0.01), V(0.14, 0.05, z + 0.01), V(0.19, -0.35, z + 0.01), V(0.208, -0.75, z + 0.01), V(0.205, -1.12, z + 0.01), V(0.27, -1.25, z + 0.01), V(0.38, -1.38, z + 0.01)],
  };
  paths.art_l = paths.nerve_l.map((p) => p.clone().add(V(-0.014, 0, 0))).reverse(); paths.art_r = paths.nerve_r.map((p) => p.clone().add(V(-0.014, 0, 0))).reverse();
  paths.vein_l = paths.nerve_l.map((p) => p.clone().add(V(0.014, 0, 0))); paths.vein_r = paths.nerve_r.map((p) => p.clone().add(V(0.014, 0, 0)));
  // the tooth part that moves when we bite
  const toothParts = ['enamel', 'dentin', 'pulp', 'cementum'].flatMap((k) => parts[k]).concat(parts.tooth_nerves_vessels);
  // cavity: a dark spot that grows through enamel into dentin
  const cav = new THREE.Mesh(new THREE.CircleGeometry(1, 40), new THREE.MeshBasicMaterial({ color: '#3a2412', transparent: true, opacity: 0.88 }));
  cav.position.set(0.0, 0.53, 0.004); cav.scale.setScalar(0.001); cav.visible = false; G.add(cav);
  // plaque bacteria
  const bact = new THREE.InstancedMesh(new THREE.CapsuleGeometry(0.012, 0.03, 4, 8), new THREE.MeshStandardMaterial({ color: '#7bd36b', emissive: '#2c6b20', roughness: 0.5 }), 26);
  bact.visible = false; G.add(bact);
  // four kinds of teeth (step 5)
  const kinds = new THREE.Group(); kinds.visible = false; G.add(kinds);
  const KIND = [
    ['incisor', [v2(-0.09, 0), v2(-0.11, 0.3), v2(-0.1, 0.55), v2(0.1, 0.55), v2(0.11, 0.3), v2(0.09, 0), v2(0.05, -0.6), v2(0, -0.66), v2(-0.05, -0.6)], { en: 'Incisor — cuts', hi: 'कृंतक — काटता है', hg: 'Incisor — cut karta hai' }],
    ['canine', [v2(-0.1, 0), v2(-0.13, 0.3), v2(0, 0.62), v2(0.13, 0.3), v2(0.1, 0), v2(0.05, -0.75), v2(0, -0.8), v2(-0.05, -0.75)], { en: 'Canine — tears', hi: 'रदनक — फाड़ता है', hg: 'Canine — faadta hai' }],
    ['premolar', [v2(-0.13, 0), v2(-0.16, 0.3), v2(-0.09, 0.5), v2(0, 0.42), v2(0.09, 0.5), v2(0.16, 0.3), v2(0.13, 0), v2(0.06, -0.6), v2(0, -0.66), v2(-0.06, -0.6)], { en: 'Premolar — crushes', hi: 'अग्रचर्वणक — कुचलता है', hg: 'Premolar — crush karta hai' }],
    ['molar', [v2(-0.2, 0), v2(-0.23, 0.3), v2(-0.15, 0.48), v2(-0.06, 0.42), v2(0, 0.46), v2(0.06, 0.42), v2(0.15, 0.48), v2(0.23, 0.3), v2(0.2, 0), v2(0.15, -0.55), v2(0.1, -0.6), v2(0.05, -0.3), v2(0, -0.25), v2(-0.05, -0.3), v2(-0.1, -0.6), v2(-0.15, -0.55)], { en: 'Molar — grinds', hi: 'चर्वणक — पीसता है', hg: 'Molar — peesta hai' }],
  ];
  KIND.forEach(([id, pts, name], i) => {
    const sh = shapeOf(spline(pts, 60, true));
    const m = mesh(extrude(sh, 0.12, 1), mat('#f6f2e8', { r: 0.35 }), null);
    m.position.set(1.15 + (i % 2) * 0.52, 0.1 - Math.floor(i / 2) * 1.05, 0.1); m.scale.setScalar(0.62);
    kinds.add(m);
    const tg = tagSprite([name.en]); tg.userData.names = name; tg.position.set(m.position.x, m.position.y + 0.42, 0.15); kinds.add(tg);
  });
  const anchors = { crown: V(-0.28, 0.42, 0), root: V(0.3, -0.8, 0), enamel: V(-0.3, 0.6, 0), dentin: V(-0.32, 0.12, 0), pulp: V(0.05, 0.25, 0), root_canal: V(-0.21, -0.7, 0), cementum: V(0.37, -0.45, 0),
    periodontal_ligament: V(-0.35, -0.85, 0), tooth_socket: V(0.65, -0.9, 0), tooth_nerves_vessels: V(0.3, -1.25, 0.01), gums: V(-0.65, 0.06, 0) };
  const steps = [
    { yaw: 0.3, labels: ['crown', 'root', 'gums', 'tooth_socket'] },
    { yaw: 0.15, dim: true, focus: ['enamel'], labels: ['enamel'] },
    { yaw: 0.15, dim: true, focus: ['dentin', 'pulp', 'tooth_nerves_vessels'], flows: ['pain', 'blood'], labels: ['dentin', 'pulp', 'tooth_nerves_vessels'] },
    { yaw: 0.15, dim: true, focus: ['cementum', 'periodontal_ligament', 'tooth_socket'], extras: ['bite'], labels: ['root_canal', 'cementum', 'periodontal_ligament', 'tooth_socket'] },
    { yaw: 0, extras: ['kinds'], labels: ['crown'] },
    { yaw: 0.15, focus: ['enamel', 'dentin'], extras: ['cavity'], flows: ['pain'], labels: ['enamel', 'dentin', 'pulp'] },
  ];
  const flows = {
    pain: (cur, ps, sp) => ({ curves: [cur(paths.nerve_l, 0.004), cur(paths.nerve_r, 0.004)], color: '#fff3a0', size: ps * 0.9, speed: sp * 0.5, density: 30, spread: 0.4 }),
    blood: (cur, ps, sp) => [{ curves: [cur(paths.art_l, 0.004), cur(paths.art_r, 0.004)], color: '#ff3040', size: ps * 0.8, speed: sp * 0.3, density: 30, spread: 0.4 }, { curves: [cur(paths.vein_l, 0.004), cur(paths.vein_r, 0.004)], color: '#5a78ff', size: ps * 0.8, speed: sp * 0.25, density: 30, spread: 0.4 }],
  };
  const bpos = Array.from({ length: 26 }, (_, i) => ({ a: Math.random() * Math.PI * 2, r: 0.5 + Math.random() * 0.12, h: 0.45 + Math.random() * 0.25, s: 0.4 + Math.random() * 0.6 }));
  const mtx = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(1, 1, 1);
  return {
    group: G, paths, steps, anchors, flows, size: 2.05, mid: [0, -0.37, -0.2],
    step(i, lab) {
      const on = lab.extrasOn; kinds.visible = on.has('kinds'); cav.visible = on.has('cavity'); bact.visible = on.has('cavity'); this.cavT = 0;
      for (const c of kinds.children) if (c.userData.names) { const lb = new Label([c.userData.names[lab.app.lang] || c.userData.names.en], { height: 0.026, leader: false, cy: 0, big: 26 }); lb.position.copy(c.position); lb.setScale(1 / lab.k); kinds.remove(c); kinds.add(lb); lb.userData.names = c.userData.names; }
      for (const m of toothParts) { m.position.set(0, 0, 0); if (m.userData.exA) m.position.add(m.userData.exA); }
    },
    update(dt, t, lab) {
      const on = lab.extrasOn;
      if (on.has('bite')) { const b = Math.max(0, Math.sin(t * 2.2)) ** 3; for (const m of toothParts) m.position.y = -0.018 * b; for (const m of parts.periodontal_ligament) m.material.emissive.setRGB(0.5 * b, 0.15 * b, 0.2 * b); }
      if (on.has('cavity')) {
        this.cavT = (this.cavT || 0) + dt; const f = Math.min(1, this.cavT / 14);
        cav.scale.set(0.02 + 0.09 * f, 0.015 + 0.17 * f, 1); cav.position.y = 0.53 - 0.085 * f;
        for (let i = 0; i < 26; i++) { const b = bpos[i]; const a = b.a + t * b.s * 0.6; mtx.compose(V(Math.cos(a) * b.r * 0.55, b.h + 0.06 * Math.sin(t * 2 + i), 0.05 + Math.sin(a) * 0.08), q.setFromEuler(new THREE.Euler(0, 0, a * 2)), sc); bact.setMatrixAt(i, mtx); }
        bact.instanceMatrix.needsUpdate = true;
      }
    },
  };
}

// ================================================================ skin
export function buildSkin() {
  const G = new THREE.Group();
  const W = 1.6, Dz = 1.0, F = Dz / 2; // front face z
  const parts = {};
  const add = (pid, m) => { G.add(m); (parts[pid] ||= []).push(m); m.userData.pid = pid; return m; };
  const box = (pid, y0, y1, color, o = {}) => { const g = new THREE.BoxGeometry(W, y0 - y1, Dz); const m = add(pid, new THREE.Mesh(g, mat(color, o))); m.position.y = (y0 + y1) / 2; return m; };
  const epiTex = dotsTexture('#ecc09c', '#c98f6a', 160, 5);
  box('epidermis', 0, -0.11, '#ffffff', { map: epiTex, r: 0.7 });
  const derTex = dotsTexture('#f2aaa2', '#e58e86', 120, 10);
  box('dermis', -0.11, -0.62, '#ffffff', { map: derTex, r: 0.75 });
  box('hypodermis', -0.62, -1.12, '#f7e0a6', { r: 0.8 });
  // fat lobules on the cut face
  const fat = mat('#fde9ad', { r: 0.6 });
  for (let i = 0; i < 16; i++) { const r = 0.07 + Math.random() * 0.04; const m = add('hypodermis', new THREE.Mesh(new THREE.SphereGeometry(r, 18, 12), fat)); m.position.set(-0.72 + (i % 8) * 0.205 + (Math.random() - 0.5) * 0.04, -0.74 - Math.floor(i / 8) * 0.22 + (Math.random() - 0.5) * 0.04, F - r * 0.35); m.scale.z = 0.5; }
  // hair, follicle, oil gland, arrector muscle
  const hair = new THREE.Group(); G.add(hair);
  const bulb = V(-0.42, -0.74, F), exitP = V(-0.24, 0.0, F), tip = V(-0.1, 0.48, F);
  hair.position.copy(bulb);
  const rel = (p) => p.clone().sub(bulb);
  const shaft = tubeMesh([rel(bulb).add(V(0, 0.04, 0)), rel(bulb.clone().lerp(exitP, 0.5)), rel(exitP), rel(exitP.clone().lerp(tip, 0.5)).add(V(0.02, 0, 0)), rel(tip)], 0.022, '#3b2a1f', 'hair_shaft');
  hair.add(shaft); (parts.hair_shaft ||= []).push(shaft);
  const fol = tubeMesh([rel(bulb), rel(bulb.clone().lerp(exitP, 0.5)), rel(exitP.clone().lerp(bulb, 0.12))], 0.055, '#d98a6a', 'hair_follicle', 30);
  fol.material.opacity = 0.75; fol.material.depthWrite = false; hair.add(fol); (parts.hair_follicle ||= []).push(fol);
  const bulbM = new THREE.Mesh(new THREE.SphereGeometry(0.075, 20, 14), mat('#c46a4a')); bulbM.userData.pid = 'hair_follicle'; hair.add(bulbM); parts.hair_follicle.push(bulbM);
  const seb = mat('#f5cf55', { r: 0.5 });
  for (const [dx, dy] of [[0.1, 0.38], [0.15, 0.44], [0.08, 0.47]]) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.05, 14, 10), seb); m.position.set(dx, dy, -0.01); m.userData.pid = 'sebaceous_gland'; hair.add(m); (parts.sebaceous_gland ||= []).push(m); }
  const ap = tubeMesh([V(-0.02, 0.3, 0), V(-0.12, 0.45, 0.01), V(-0.2, 0.63, 0)], 0.016, '#c0504d', 'arrector_pili', 20); hair.add(ap); (parts.arrector_pili ||= []).push(ap);
  // second, smaller hair
  const hair2 = tubeMesh([V(0.62, -0.52, F), V(0.66, -0.25, F), V(0.7, 0, F), V(0.76, 0.3, F)], 0.016, '#3b2a1f', 'hair_shaft'); add('hair_shaft', hair2);
  // sweat gland coil + duct + pore
  const coil = []; const cc = V(0.18, -0.52, F - 0.02);
  for (let i = 0; i <= 90; i++) { const a = i / 90 * Math.PI * 9; coil.push(V(cc.x + Math.cos(a) * 0.06 + (i / 90) * 0.02, cc.y + Math.sin(a) * 0.035 + (i / 90 - 0.5) * 0.06, cc.z + Math.sin(a * 0.5) * 0.02)); }
  add('sweat_gland', tubeMesh(coil, 0.016, '#7fc8ff', 'sweat_gland', 300));
  const duct = [coil[coil.length - 1], V(0.22, -0.4, F), V(0.19, -0.25, F), V(0.24, -0.12, F), V(0.2, -0.06, F), V(0.25, 0.0, F)];
  add('sweat_gland', tubeMesh(duct, 0.013, '#7fc8ff', 'sweat_gland', 60));
  const pore = add('sweat_pore', new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.01, 8, 24), mat('#3d7fb8'))); pore.position.set(0.25, 0.002, F - 0.01); pore.rotation.x = Math.PI / 2;
  // touch receptors
  const rec = mat('#b18cff', { r: 0.45 });
  const meis = add('touch_receptors', new THREE.Mesh(new THREE.SphereGeometry(0.04, 16, 12), rec)); meis.scale.set(0.7, 1.25, 0.7); meis.position.set(0.5, -0.17, F);
  const pac = add('touch_receptors', new THREE.Mesh(new THREE.SphereGeometry(0.08, 24, 16), rec)); pac.scale.set(0.8, 1.3, 0.8); pac.position.set(0.52, -0.86, F);
  for (let k = 1; k < 4; k++) { const ring = add('touch_receptors', new THREE.Mesh(new THREE.TorusGeometry(0.08 * k / 4 + 0.012, 0.004, 6, 30), mat('#e4d4ff'))); ring.position.copy(pac.position).add(V(0, 0, 0.02)); ring.scale.set(0.8, 1.3, 1); }
  // melanocytes at the bottom of the epidermis
  const mel = mat('#5a3a22', { r: 0.5 });
  for (let i = 0; i < 6; i++) { const m = add('melanocytes', new THREE.Mesh(new THREE.IcosahedronGeometry(0.022, 0), mel)); m.position.set(-0.7 + i * 0.27, -0.1, F); m.scale.set(1.6, 0.8, 1); }
  // blood vessels and nerve fibres
  const art = [V(-0.8, -0.72, F), V(-0.55, -0.55, F), V(-0.25, -0.42, F), V(-0.06, -0.26, F), V(0.02, -0.15, F), V(0.08, -0.13, F)];
  const vein = [V(0.08, -0.13, F), V(0.14, -0.17, F), V(0.3, -0.36, F), V(0.55, -0.55, F), V(0.8, -0.74, F)];
  add('skin_blood_vessels', tubeMesh(art, 0.022, '#d1232f', 'skin_blood_vessels'));
  add('skin_blood_vessels', tubeMesh(vein, 0.024, '#3557c4', 'skin_blood_vessels'));
  const nerveA = [V(-0.8, -1.02, F), V(-0.2, -0.98, F), V(0.3, -0.93, F), V(0.5, -0.96, F)];
  const nerveB = [V(-0.8, -1.0, F), V(-0.1, -0.7, F), V(0.3, -0.42, F), V(0.48, -0.22, F)];
  add('skin_nerve_fibres', tubeMesh(nerveA, 0.013, '#f2d34b', 'skin_nerve_fibres'));
  add('skin_nerve_fibres', tubeMesh(nerveB, 0.013, '#f2d34b', 'skin_nerve_fibres'));
  // feather that touches the skin (step 5)
  const feather = new THREE.Group(); feather.visible = false; G.add(feather);
  const fq = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.5, 6), new THREE.MeshStandardMaterial({ color: '#e8e2d4' }));
  const vane = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 12), new THREE.MeshStandardMaterial({ color: '#d7f0ff', transparent: true, opacity: 0.85 })); vane.scale.set(0.45, 1.7, 0.12); vane.position.y = 0.08;
  feather.add(fq, vane); feather.rotation.z = 0.5;
  // sweat beads + goosebump
  const bump = new THREE.Mesh(new THREE.SphereGeometry(0.06, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), mat('#ecc09c')); bump.position.copy(exitP); bump.scale.setScalar(0.001); G.add(bump);
  const paths = {
    cells: Array.from({ length: 9 }, (_, i) => [V(-0.72 + i * 0.18, -0.105, F + 0.004), V(-0.72 + i * 0.18 + 0.01, -0.05, F + 0.004), V(-0.72 + i * 0.18, 0.02, F + 0.004)]),
    sweat: [...coil.slice(-25), ...duct.slice(1)].map((p) => p.clone().add(V(0, 0, 0.012))),
    art, vein,
    touchA: [pac.position.clone(), V(0.3, -0.93, F + 0.012), V(-0.2, -0.98, F + 0.012), V(-0.8, -1.02, F + 0.012)],
    touchB: [meis.position.clone(), V(0.3, -0.42, F + 0.012), V(-0.1, -0.7, F + 0.012), V(-0.8, -1.0, F + 0.012)],
    heat: Array.from({ length: 6 }, (_, i) => { const x = -0.3 + i * 0.16; return [V(x, 0.01, F - 0.2), V(x + 0.03, 0.12, F - 0.2), V(x - 0.02, 0.24, F - 0.2), V(x + 0.02, 0.36, F - 0.2)]; }),
  };
  const steps = [
    { yaw: 0.35, pitch: 0.18, labels: ['epidermis', 'dermis', 'hypodermis', 'hair_shaft', 'sweat_gland'] },
    { yaw: 0.25, pitch: 0.15, dim: true, focus: ['epidermis', 'melanocytes'], flows: ['cells'], labels: ['epidermis', 'melanocytes'] },
    { yaw: 0.25, pitch: 0.15, dim: true, focus: ['dermis', 'skin_blood_vessels', 'sebaceous_gland', 'hair_follicle', 'sweat_gland'], flows: ['blood'], labels: ['dermis', 'skin_blood_vessels', 'sebaceous_gland', 'hair_follicle'] },
    { yaw: 0.25, pitch: 0.15, dim: true, focus: ['sweat_gland', 'sweat_pore'], flows: ['sweat', 'heat'], labels: ['sweat_gland', 'sweat_pore'] },
    { yaw: 0.25, pitch: 0.15, dim: true, focus: ['touch_receptors', 'skin_nerve_fibres'], extras: ['feather'], flows: ['touch'], labels: ['touch_receptors', 'skin_nerve_fibres'] },
    { yaw: 0.35, pitch: 0.15, dim: true, focus: ['hypodermis', 'arrector_pili', 'hair_shaft'], extras: ['goose'], labels: ['hypodermis', 'arrector_pili', 'hair_shaft'] },
  ];
  const flows = {
    cells: (cur, ps, sp) => ({ curves: paths.cells.map((p) => cur(p, 0.01)), color: '#ffe2c8', size: ps * 0.8, speed: sp * 0.04, density: 25, spread: 0.6 }),
    blood: (cur, ps, sp) => [{ curves: [cur(art, 0.018)], color: '#ff3040', size: ps * 0.7, speed: sp * 0.25, density: 40, spread: 0.6 }, { curves: [cur(vein, 0.018)], color: '#5a78ff', size: ps * 0.7, speed: sp * 0.2, density: 40, spread: 0.6 }],
    sweat: (cur, ps, sp) => ({ curves: [cur(paths.sweat, 0.008)], color: '#9fe0ff', size: ps * 0.8, speed: sp * 0.18, density: 30, spread: 0.4 }),
    heat: (cur, ps, sp) => ({ curves: paths.heat.map((p) => cur(p, 0.01)), color: '#e9f6ff', size: ps * 0.7, speed: sp * 0.12, density: 18, spread: 0.6, fade: 0.4 }),
    touch: (cur, ps, sp) => ({ curves: [cur(paths.touchA, 0.008), cur(paths.touchB, 0.008)], color: '#fff3a0', size: ps * 0.9, speed: sp * 0.5, density: 18, spread: 0.4, drive: 'touch' }),
  };
  const anchors = { epidermis: V(-0.55, -0.05, F), dermis: V(-0.6, -0.35, F), hypodermis: V(-0.62, -0.95, F), hair_shaft: V(-0.14, 0.36, F), sweat_gland: V(0.18, -0.52, F),
    hair_follicle: V(-0.4, -0.6, F), sebaceous_gland: V(-0.3, -0.3, F), arrector_pili: V(-0.55, -0.2, F), sweat_pore: V(0.25, 0.0, F - 0.01), touch_receptors: V(0.5, -0.86, F),
    melanocytes: V(-0.43, -0.1, F), skin_blood_vessels: V(-0.25, -0.42, F), skin_nerve_fibres: V(-0.2, -0.98, F) };
  return {
    group: G, paths, steps, anchors, flows, size: 1.7, mid: [0, -0.45, 0],
    step(i, lab) { feather.visible = lab.extrasOn.has('feather'); hair.rotation.z = 0; bump.scale.setScalar(0.001); },
    update(dt, t, lab) {
      const on = lab.extrasOn;
      if (on.has('feather')) {
        const c = (t % 3) / 3, press = Math.sin(Math.min(1, c / 0.5) * Math.PI);
        feather.position.set(0.5 + 0.06 * Math.sin(t), 0.27 - 0.12 * press, F - 0.05);
        lab.flows.drivers.touch = press > 0.3 ? 2 : 0.15;
        for (const m of parts.touch_receptors) m.material.emissive.setRGB(0.5 * press, 0.3 * press, 0.8 * press);
      }
      if (on.has('goose')) {
        const c = 0.5 - 0.5 * Math.cos(t * 1.2);
        hair.rotation.z = 0.28 * c; bump.scale.set(1, 0.6 + 0.6 * c, 1).multiplyScalar(c + 0.001);
        for (const m of parts.arrector_pili) m.scale.setScalar(1);
      }
    },
  };
}
