// DUET Maths Lab 360: real 3D rooms built from geometry (no photo), so walls, windows and furniture have true depth in the
// headset. A maths classroom (chalkboard, windows, shelves of solids, desks, posters) and a home kitchen (counter, stove,
// sink, cabinets, fridge, window). Static parts are merged per material to keep draw calls low on the Quest.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { woodTex, tileTex, speckTex, canvasTex } from './mats.js';

const FONT = '"Noto Sans Devanagari", "Noto Sans", system-ui, sans-serif';
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const S = (c, r = 0.8, m = 0) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m });

// collects boxes / meshes per material and merges them into one mesh each
function Builder() {
  const parts = new Map();
  const add = (mat, geo) => { if (!parts.has(mat)) parts.set(mat, []); parts.get(mat).push(geo.index ? geo.toNonIndexed() : geo); };
  const box = (mat, sx, sy, sz, x, y, z, ry = 0) => { const g = new THREE.BoxGeometry(sx, sy, sz); if (ry) g.rotateY(ry); g.translate(x, y, z); add(mat, g); };
  const cyl = (mat, rt, rb, h, x, y, z, seg = 16) => { const g = new THREE.CylinderGeometry(rt, rb, h, seg); g.translate(x, y, z); add(mat, g); };
  const plane = (mat, w, h, x, y, z, ry = 0, rx = 0) => { const g = new THREE.PlaneGeometry(w, h); if (ry) g.rotateY(ry); if (rx) g.rotateX(rx); g.translate(x, y, z); add(mat, g); };
  const done = () => { const g = new THREE.Group(); for (const [m, list] of parts) { const mesh = new THREE.Mesh(mergeGeometries(list), m); mesh.receiveShadow = true; g.add(mesh); } g.traverse((o) => { o.userData.noHit = true; }); return g; };
  return { add, box, cyl, plane, done };
}
function paintTex(base, rep = [1, 1], n = 2500) {
  const t = canvasTex(512, 512, (x, w, h) => { x.fillStyle = base; x.fillRect(0, 0, w, h); for (let i = 0; i < n; i++) { const a = Math.random() * 0.05; x.fillStyle = Math.random() < 0.5 ? `rgba(0,0,0,${a})` : `rgba(255,255,255,${a})`; x.fillRect(Math.random() * w, Math.random() * h, 2 + Math.random() * 5, 2 + Math.random() * 5); } });
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...rep); return t;
}
// the view out of a window: sky, far hills, trees and a building, painted once
function outsideTex(seed = 1) {
  return canvasTex(1024, 512, (x, w, h) => {
    const sky = x.createLinearGradient(0, 0, 0, h * 0.7); sky.addColorStop(0, '#7fb4e8'); sky.addColorStop(1, '#d9ecfb'); x.fillStyle = sky; x.fillRect(0, 0, w, h);
    x.fillStyle = 'rgba(255,255,255,0.85)'; for (let i = 0; i < 7; i++) { const cx = (i * 173 + seed * 97) % w, cy = 60 + (i * 37) % 90; for (let k = 0; k < 5; k++) { x.beginPath(); x.ellipse(cx + k * 26, cy + Math.sin(k) * 8, 40, 18, 0, 0, 7); x.fill(); } }
    x.fillStyle = '#8fae9a'; x.beginPath(); x.moveTo(0, h * 0.62); for (let i = 0; i <= 20; i++) x.lineTo(i * w / 20, h * 0.55 + Math.sin(i * 1.3 + seed) * 18); x.lineTo(w, h); x.lineTo(0, h); x.fill();
    x.fillStyle = '#e8dcc4'; x.fillRect(w * 0.62, h * 0.42, 220, 160); x.fillStyle = '#b8574a'; x.fillRect(w * 0.6, h * 0.38, 250, 22); x.fillStyle = '#6a8fb0'; for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) x.fillRect(w * 0.62 + 20 + i * 52, h * 0.42 + 30 + j * 60, 30, 36);
    x.fillStyle = '#6f9a4e'; x.fillRect(0, h * 0.72, w, h * 0.28);
    for (let i = 0; i < 9; i++) { const tx = (i * 131 + seed * 53) % w, ty = h * (0.62 + (i % 3) * 0.05), r = 40 + (i * 17) % 40; x.fillStyle = '#5a3d27'; x.fillRect(tx - 6, ty, 12, r * 1.4); x.fillStyle = ['#3f7a35', '#4f8c3a', '#356b2c'][i % 3]; x.beginPath(); x.arc(tx, ty, r, 0, 7); x.arc(tx - r * 0.6, ty + r * 0.3, r * 0.7, 0, 7); x.arc(tx + r * 0.6, ty + r * 0.3, r * 0.7, 0, 7); x.fill(); }
  });
}
function chalkTex() {
  return canvasTex(2048, 640, (x, w, h) => {
    x.fillStyle = '#25483a'; x.fillRect(0, 0, w, h); for (let i = 0; i < 4000; i++) { x.fillStyle = `rgba(255,255,255,${Math.random() * 0.035})`; x.fillRect(Math.random() * w, Math.random() * h, 3 + Math.random() * 20, 1 + Math.random() * 3); }
    x.fillStyle = 'rgba(245,245,235,0.92)'; x.strokeStyle = 'rgba(245,245,235,0.85)'; x.lineWidth = 6; x.textBaseline = 'middle'; x.font = `600 64px ${FONT}`;
    x.fillText('a² + b² = c²', 90, 120); x.fillText('A = πr²', 90, 240); x.fillText('(a + b)² = a² + 2ab + b²', 90, 360); x.fillText('sin²θ + cos²θ = 1', 90, 480);
    x.beginPath(); x.moveTo(1150, 520); x.lineTo(1450, 520); x.lineTo(1450, 300); x.closePath(); x.stroke(); x.strokeRect(1420, 490, 30, 30); x.font = `600 46px ${FONT}`; x.fillText('a', 1290, 565); x.fillText('b', 1470, 410); x.fillText('c', 1260, 390);
    x.beginPath(); x.arc(1760, 330, 150, 0, 7); x.stroke(); x.beginPath(); x.moveTo(1760, 330); x.lineTo(1910, 330); x.stroke(); x.fillText('r', 1830, 300); x.beginPath(); x.arc(1760, 330, 6, 0, 7); x.fill();
    x.font = `700 54px ${FONT}`; x.fillStyle = 'rgba(255,214,110,0.9)'; x.fillText('π ≈ 3.14159…', 1160, 110);
  });
}
function posterTex(kind) {
  return canvasTex(512, 640, (x, w, h) => {
    x.fillStyle = '#fbf6ea'; x.fillRect(0, 0, w, h); x.fillStyle = '#e8762a'; x.fillRect(0, 0, w, 70); x.fillStyle = '#fff'; x.font = `800 40px ${FONT}`; x.textAlign = 'center'; x.textBaseline = 'middle';
    if (kind === 'table') { x.fillText('× 1 – 10', w / 2, 36); x.font = `600 26px ${FONT}`; for (let i = 1; i <= 10; i++) for (let j = 1; j <= 10; j++) { x.fillStyle = i === 1 || j === 1 ? '#c2562a' : (i === j ? '#2f6fd0' : '#2a2a2a'); x.fillText(String(i * j), 30 + (j - 1) * 50, 110 + (i - 1) * 52); } }
    else if (kind === 'shapes') { x.fillText('SHAPES', w / 2, 36); const c = ['#2f6fd0', '#e8762a', '#3a9a4a', '#c23a6a']; x.fillStyle = c[0]; x.fillRect(60, 120, 150, 150); x.fillStyle = c[1]; x.beginPath(); x.arc(380, 195, 80, 0, 7); x.fill(); x.fillStyle = c[2]; x.beginPath(); x.moveTo(135, 330); x.lineTo(220, 500); x.lineTo(50, 500); x.fill(); x.fillStyle = c[3]; x.beginPath(); for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3; x.lineTo(380 + Math.cos(a) * 90, 420 + Math.sin(a) * 90); } x.fill(); x.fillStyle = '#333'; x.font = `600 26px ${FONT}`; x.fillText('square', 135, 290); x.fillText('circle', 380, 295); x.fillText('triangle', 135, 530); x.fillText('hexagon', 380, 530); }
    else { x.fillText('DUET STEM', w / 2, 36); x.fillStyle = '#2a2a2a'; x.font = `700 44px ${FONT}`; x.fillText('Maths is', w / 2, 200); x.fillText('everywhere', w / 2, 260); x.font = `600 120px ${FONT}`; x.fillStyle = '#2f6fd0'; x.fillText('∞ π √', w / 2, 430); }
  });
}
const tex = (t, rep) => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...rep); return t; };

// ---------------------------------------------------------------- a maths classroom
export function buildClassroom() {
  const b = Builder(), W = 8.4, X0 = -4.2, X1 = 4.2, ZF = -5.6, ZB = 3.2, H = 3.25;
  const floorM = new THREE.MeshStandardMaterial({ map: tex(tileTex('#bdb3a3', '#8c8475', 4, [1, 1]), [W / 2.4, (ZB - ZF) / 2.4]), roughness: 0.38 });
  const wallM = new THREE.MeshStandardMaterial({ map: paintTex('#e6dcc6', [3, 1]), roughness: 0.95 });
  const dadoM = new THREE.MeshStandardMaterial({ map: paintTex('#5f86a0', [3, 1], 1500), roughness: 0.75 });
  const trimM = S(0xe8762a, 0.6), ceilM = S(0xe9e6df, 0.95), woodM = new THREE.MeshStandardMaterial({ map: woodTex('#9a6a3e', [2, 1]), roughness: 0.6 }), darkM = S(0x2c3238, 0.6), steelM = S(0xbfc4c8, 0.35, 0.8);
  // floor, ceiling and walls (walls: paint above, a blue dado to 1 m, an orange band)
  b.plane(floorM, W, ZB - ZF, 0, 0, (ZF + ZB) / 2, 0, -Math.PI / 2);
  b.plane(ceilM, W, ZB - ZF, 0, H, (ZF + ZB) / 2, 0, Math.PI / 2);
  const wall = (len, cx, cz, ry) => { b.plane(wallM, len, H - 1.0, cx, 1.0 + (H - 1.0) / 2, cz, ry); b.plane(dadoM, len, 1.0, cx, 0.5, cz, ry); const n = V(Math.sin(ry), 0, Math.cos(ry)).multiplyScalar(0.012); b.box(trimM, Math.abs(Math.cos(ry)) > 0.5 ? len : 0.03, 0.06, Math.abs(Math.cos(ry)) > 0.5 ? 0.03 : len, cx + n.x, 1.02, cz + n.z); b.box(darkM, Math.abs(Math.cos(ry)) > 0.5 ? len : 0.025, 0.1, Math.abs(Math.cos(ry)) > 0.5 ? 0.025 : len, cx + n.x, 0.05, cz + n.z); };
  wall(W, 0, ZF, 0); wall(W, 0, ZB, Math.PI); wall(ZB - ZF, X1, (ZF + ZB) / 2, -Math.PI / 2);
  // left wall with three deep windows: the wall is built around the openings, the view sits 0.8 m outside
  const wy0 = 1.0, wy1 = 2.55, wins = [-3.6, -1.2, 1.2], ww = 1.7;
  const lw = (z0, z1, y0, y1, m) => b.plane(m, z1 - z0, y1 - y0, X0, (y0 + y1) / 2, (z0 + z1) / 2, Math.PI / 2);
  let z = ZF; for (const wz of wins) { lw(z, wz - ww / 2, 1.0, H, wallM); z = wz + ww / 2; } lw(z, ZB, 1.0, H, wallM);
  for (const wz of wins) { lw(wz - ww / 2, wz + ww / 2, wy1, H, wallM); }
  lw(ZF, ZB, 0, 1.0, dadoM); b.box(trimM, 0.03, 0.06, ZB - ZF, X0 + 0.012, 1.02, (ZF + ZB) / 2); b.box(darkM, 0.025, 0.1, ZB - ZF, X0 + 0.012, 0.05, (ZF + ZB) / 2);
  const frameM = S(0xf2f2f2, 0.5);
  wins.forEach((wz, i) => { b.plane(new THREE.MeshBasicMaterial({ map: outsideTex(3 + i), toneMapped: false }), 3.4, 2.2, X0 - 0.8, 1.75, wz, Math.PI / 2);
    b.box(wallM, 0.24, 0.02, ww, X0 - 0.12, wy0, wz); b.box(wallM, 0.24, 0.02, ww, X0 - 0.12, wy1, wz); b.box(wallM, 0.24, wy1 - wy0, 0.02, X0 - 0.12, (wy0 + wy1) / 2, wz - ww / 2); b.box(wallM, 0.24, wy1 - wy0, 0.02, X0 - 0.12, (wy0 + wy1) / 2, wz + ww / 2); // reveals
    b.box(frameM, 0.06, 0.06, ww, X0 - 0.03, wy0 + 0.03, wz); b.box(frameM, 0.06, 0.06, ww, X0 - 0.03, wy1 - 0.03, wz); b.box(frameM, 0.06, wy1 - wy0, 0.06, X0 - 0.03, (wy0 + wy1) / 2, wz); b.box(frameM, 0.05, 0.04, ww, X0 - 0.03, (wy0 + wy1) / 2 + 0.25, wz);
    b.box(woodM, 0.3, 0.04, ww + 0.1, X0 + 0.1, wy0 - 0.02, wz); }); // window sills
  // the chalkboard on the front wall, with a wooden frame and a chalk ledge, and the lab's name above it
  const board = new THREE.MeshStandardMaterial({ map: chalkTex(), roughness: 0.85 });
  b.plane(board, 4.4, 1.38, 0, 1.72, ZF + 0.03); b.box(woodM, 4.56, 0.08, 0.05, 0, 2.45, ZF + 0.03); b.box(woodM, 4.56, 0.08, 0.05, 0, 0.99, ZF + 0.03); b.box(woodM, 0.08, 1.54, 0.05, -2.24, 1.72, ZF + 0.03); b.box(woodM, 0.08, 1.54, 0.05, 2.24, 1.72, ZF + 0.03);
  b.box(woodM, 4.4, 0.03, 0.1, 0, 1.0, ZF + 0.08); for (let i = 0; i < 4; i++) b.box(S(0xf4f4ee, 0.9), 0.07, 0.014, 0.014, -1.5 + i * 0.12, 1.024, ZF + 0.08);
  const sign = canvasTex(1024, 160, (x, w, h) => { x.fillStyle = '#1d2a3a'; x.fillRect(0, 0, w, h); x.fillStyle = '#e8762a'; x.fillRect(0, h - 14, w, 14); x.fillStyle = '#ffffff'; x.font = `800 84px ${FONT}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('DUET STEM · MATHS LAB', w / 2, h / 2 - 4); });
  b.plane(new THREE.MeshBasicMaterial({ map: sign, toneMapped: false }), 2.6, 0.4, 0, 2.8, ZF + 0.03);
  // posters and a clock
  const poster = (kind, x, y, zz, ry) => b.plane(new THREE.MeshStandardMaterial({ map: posterTex(kind), roughness: 0.9 }), 0.8, 1.0, x, y, zz, ry);
  poster('table', -3.1, 1.75, ZF + 0.02, 0); poster('shapes', 3.1, 1.75, ZF + 0.02, 0); poster('duet', 2.2, 1.85, ZB - 0.02, Math.PI);
  const clockT = canvasTex(256, 256, (x) => { x.fillStyle = '#fff'; x.beginPath(); x.arc(128, 128, 124, 0, 7); x.fill(); x.lineWidth = 10; x.strokeStyle = '#333'; x.stroke(); x.fillStyle = '#222'; x.font = `700 30px ${FONT}`; x.textAlign = 'center'; x.textBaseline = 'middle'; for (let k = 1; k <= 12; k++) { const a = k * Math.PI / 6; x.fillText(String(k), 128 + Math.sin(a) * 95, 128 - Math.cos(a) * 95); } x.lineWidth = 8; x.beginPath(); x.moveTo(128, 128); x.lineTo(128 + 50, 128 - 30); x.stroke(); x.lineWidth = 5; x.beginPath(); x.moveTo(128, 128); x.lineTo(128 - 10, 128 - 85); x.stroke(); });
  b.plane(new THREE.MeshBasicMaterial({ map: clockT, transparent: true, toneMapped: false }), 0.42, 0.42, X1 - 0.02, 2.6, -2.0, -Math.PI / 2);
  // number line along the right wall
  const nlT = canvasTex(2048, 128, (x, w, h) => { x.fillStyle = '#fffaf0'; x.fillRect(0, 0, w, h); x.strokeStyle = '#333'; x.lineWidth = 5; x.beginPath(); x.moveTo(30, 50); x.lineTo(w - 30, 50); x.stroke(); x.fillStyle = '#222'; x.font = `700 34px ${FONT}`; x.textAlign = 'center'; for (let i = -10; i <= 10; i++) { const px = w / 2 + i * 95; x.beginPath(); x.moveTo(px, 35); x.lineTo(px, 65); x.stroke(); x.fillStyle = i < 0 ? '#c23a3a' : i > 0 ? '#2f6fd0' : '#222'; x.fillText(String(i).replace('-', '−'), px, 100); } });
  b.plane(new THREE.MeshBasicMaterial({ map: nlT, toneMapped: false }), 5.6, 0.35, X1 - 0.02, 2.75, 0.3, -Math.PI / 2);
  // a low cabinet on the right wall with 3D solids on top
  b.box(woodM, 0.5, 0.85, 4.2, X1 - 0.26, 0.425, -1.6); b.box(S(0xd9cbb0, 0.6), 0.52, 0.03, 4.24, X1 - 0.26, 0.865, -1.6);
  for (let i = 0; i < 6; i++) { b.box(S(0x7a5232, 0.6), 0.012, 0.7, 0.66, X1 - 0.515, 0.42, -3.3 + i * 0.68); b.box(steelM, 0.02, 0.1, 0.02, X1 - 0.525, 0.62, -3.05 + i * 0.68); }
  const solid = (geo, c, x, y, zz) => b.add(S(c, 0.4), geo.translate(x, y, zz));
  const sx = X1 - 0.26; solid(new THREE.BoxGeometry(0.22, 0.22, 0.22), 0xe8762a, sx, 0.99, -3.3); solid(new THREE.CylinderGeometry(0.11, 0.11, 0.28, 24), 0x2f6fd0, sx, 1.02, -2.7); solid(new THREE.ConeGeometry(0.13, 0.3, 24), 0x3a9a4a, sx, 1.03, -2.1);
  solid(new THREE.SphereGeometry(0.13, 24, 16), 0xc23a6a, sx, 1.01, -1.5); solid(new THREE.ConeGeometry(0.16, 0.28, 4), 0xffc83a, sx, 1.02, -0.9); solid(new THREE.BoxGeometry(0.16, 0.16, 0.34), 0x7a5ad0, sx, 0.96, -0.3);
  { const g = new THREE.CylinderGeometry(0.13, 0.13, 0.26, 3); g.rotateZ(Math.PI / 2); solid(g, 0x29a6a6, sx, 1.0, 0.2); }
  // back wall: a door and a notice board with papers
  b.box(woodM, 1.0, 2.15, 0.06, -2.8, 1.075, ZB - 0.03); b.box(S(0x5a3a22, 0.6), 1.12, 0.06, 0.08, -2.8, 2.18, ZB - 0.03); b.cyl(steelM, 0.025, 0.025, 0.12, -2.4, 1.0, ZB - 0.09, 12);
  const corkT = canvasTex(512, 256, (x, w, h) => { x.fillStyle = '#c49a64'; x.fillRect(0, 0, w, h); for (let i = 0; i < 3000; i++) { x.fillStyle = `rgba(90,50,20,${Math.random() * 0.2})`; x.fillRect(Math.random() * w, Math.random() * h, 3, 3); } const cs = ['#fff7a8', '#bfe3ff', '#ffd1dc', '#d4f7c5', '#ffffff']; for (let i = 0; i < 8; i++) { x.save(); x.translate(40 + (i % 4) * 120, 40 + Math.floor(i / 4) * 110); x.rotate((Math.random() - 0.5) * 0.15); x.fillStyle = cs[i % 5]; x.fillRect(0, 0, 90, 80); x.fillStyle = 'rgba(0,0,0,0.35)'; for (let l = 0; l < 4; l++) x.fillRect(10, 16 + l * 14, 60 - (l % 2) * 20, 4); x.fillStyle = '#d33'; x.beginPath(); x.arc(45, 6, 5, 0, 7); x.fill(); x.restore(); } });
  b.plane(new THREE.MeshStandardMaterial({ map: corkT, roughness: 0.95 }), 2.0, 1.0, 0.2, 1.7, ZB - 0.03, Math.PI); b.box(woodM, 2.08, 1.08, 0.02, 0.2, 1.7, ZB - 0.015);
  // two rows of student desks behind the student
  for (const dz of [1.2, 2.35]) for (const dx of [-2.6, -0.9, 0.9, 2.6]) { b.box(woodM, 1.1, 0.04, 0.5, dx, 0.74, dz); for (const [a, c] of [[-0.5, -0.2], [0.5, -0.2], [-0.5, 0.2], [0.5, 0.2]]) b.box(darkM, 0.035, 0.72, 0.035, dx + a, 0.36, dz + c); b.box(S(0x2f6fd0, 0.6), 0.9, 0.03, 0.32, dx, 0.44, dz + 0.42); b.box(S(0x2f6fd0, 0.6), 0.9, 0.36, 0.03, dx, 0.66, dz + 0.6); for (const a of [-0.4, 0.4]) b.box(darkM, 0.03, 0.44, 0.03, dx + a, 0.22, dz + 0.42); }
  // ceiling: LED panels and two fans; a plant in the corner
  const ledM = new THREE.MeshBasicMaterial({ color: 0xfffdf4, toneMapped: false });
  for (const lx of [-2.2, 0, 2.2]) for (const lz of [-3.6, -1.0, 1.6]) { b.box(S(0xdddddd, 0.5), 0.64, 0.03, 0.64, lx, H - 0.015, lz); b.box(ledM, 0.58, 0.02, 0.58, lx, H - 0.032, lz); }
  for (const fz of [-2.3, 0.9]) { b.cyl(darkM, 0.015, 0.015, 0.45, 0, H - 0.22, fz, 8); b.cyl(S(0xf0f0f0, 0.5), 0.12, 0.14, 0.1, 0, H - 0.47, fz, 20); for (let k = 0; k < 3; k++) { const a = k * 2 * Math.PI / 3; b.box(S(0xf0f0f0, 0.5), 0.6, 0.012, 0.11, Math.cos(a) * 0.38, H - 0.5, fz + Math.sin(a) * 0.38, -a); } }
  b.cyl(S(0xb5623a, 0.8), 0.22, 0.16, 0.45, X1 - 0.45, 0.225, ZF + 0.5, 20);
  const leafM = S(0x3f8a3a, 0.8); for (let k = 0; k < 9; k++) { const a = k * 0.7, r = 0.18 + (k % 3) * 0.06; const g = new THREE.SphereGeometry(0.2 - (k % 3) * 0.03, 12, 8); g.translate(X1 - 0.45 + Math.cos(a) * r, 0.7 + (k % 4) * 0.18, ZF + 0.5 + Math.sin(a) * r); b.add(leafM, g); }
  const room = b.done(); room.name = 'classroom3d';
  return { group: room, light: { dir: V(-0.75, 0.55, 0.25), sunI: 1.25, sky: 0.3, env: 0.42 } };
}

// ---------------------------------------------------------------- a home kitchen
export function buildKitchen() {
  const b = Builder(), W = 6.2, X0 = -3.1, X1 = 3.1, ZF = -3.4, ZB = 2.6, H = 3.0;
  const floorM = new THREE.MeshStandardMaterial({ map: tex(tileTex('#b98d62', '#7d5d40', 4, [1, 1]), [W / 2.0, (ZB - ZF) / 2.0]), roughness: 0.45 });
  const wallM = new THREE.MeshStandardMaterial({ map: paintTex('#e9d9b0', [3, 1]), roughness: 0.95 });
  const tileM = new THREE.MeshStandardMaterial({ map: tex(tileTex('#f5f7f4', '#c7cdc6', 8, [1, 1]), [4, 0.6]), roughness: 0.2 });
  const graniteM = new THREE.MeshStandardMaterial({ map: speckTex('#2a2a2c', '#55555a', [3, 1], 9000), roughness: 0.3 });
  const cabM = new THREE.MeshStandardMaterial({ map: woodTex('#b98a5a', [1, 1]), roughness: 0.55 }), doorM = S(0xe9e1d2, 0.5), steelM = S(0xc9ced2, 0.3, 0.85), darkM = S(0x26292c, 0.6);
  b.plane(floorM, W, ZB - ZF, 0, 0, (ZF + ZB) / 2, 0, -Math.PI / 2); b.plane(S(0xf8f6f0, 0.95), W, ZB - ZF, 0, H, (ZF + ZB) / 2, 0, Math.PI / 2);
  // front wall with a window over the sink; tiles behind the counter
  const wx0 = 0.4, wx1 = 1.8, wy0 = 1.45, wy1 = 2.45;
  b.plane(wallM, wx0 - X0, H, (X0 + wx0) / 2, H / 2, ZF); b.plane(wallM, X1 - wx1, H, (wx1 + X1) / 2, H / 2, ZF); b.plane(wallM, wx1 - wx0, wy0, (wx0 + wx1) / 2, wy0 / 2, ZF); b.plane(wallM, wx1 - wx0, H - wy1, (wx0 + wx1) / 2, (wy1 + H) / 2, ZF);
  b.plane(tileM, W, 0.6, 0, 1.2, ZF + 0.005);
  b.plane(new THREE.MeshBasicMaterial({ map: outsideTex(7), toneMapped: false }), 3.0, 2.0, (wx0 + wx1) / 2, 1.95, ZF - 0.8);
  for (const [sx, sy, x, y] of [[wx1 - wx0, 0.06, (wx0 + wx1) / 2, wy0], [wx1 - wx0, 0.06, (wx0 + wx1) / 2, wy1], [0.06, wy1 - wy0, wx0, (wy0 + wy1) / 2], [0.06, wy1 - wy0, wx1, (wy0 + wy1) / 2], [0.05, wy1 - wy0, (wx0 + wx1) / 2, (wy0 + wy1) / 2]]) b.box(S(0xf4f4f4, 0.5), sx, sy, 0.08, x, y, ZF - 0.02);
  b.box(wallM, wx1 - wx0, 0.02, 0.2, (wx0 + wx1) / 2, wy0, ZF - 0.1); b.box(wallM, wx1 - wx0, 0.02, 0.2, (wx0 + wx1) / 2, wy1, ZF - 0.1); b.box(wallM, 0.02, wy1 - wy0, 0.2, wx0, (wy0 + wy1) / 2, ZF - 0.1); b.box(wallM, 0.02, wy1 - wy0, 0.2, wx1, (wy0 + wy1) / 2, ZF - 0.1);
  for (const [len, cx, cz, ry] of [[W, 0, ZB, Math.PI], [ZB - ZF, X0, (ZF + ZB) / 2, Math.PI / 2], [ZB - ZF, X1, (ZF + ZB) / 2, -Math.PI / 2]]) b.plane(wallM, len, H, cx, H / 2, cz, ry);
  // the counter along the front wall: cabinets, granite top, sink, gas stove; wall cabinets above
  const cz = ZF + 0.32; b.box(cabM, W - 0.1, 0.82, 0.6, 0, 0.45, cz); b.box(darkM, W - 0.14, 0.1, 0.55, 0, 0.05, cz - 0.02); b.box(graniteM, W - 0.06, 0.04, 0.64, 0, 0.88, cz + 0.01);
  for (let i = 0; i < 8; i++) { const x = X0 + 0.42 + i * 0.76; b.box(doorM, 0.72, 0.68, 0.02, x, 0.46, cz + 0.31); b.box(steelM, 0.12, 0.016, 0.02, x, 0.74, cz + 0.33); }
  b.box(steelM, 0.7, 0.02, 0.44, 1.1, 0.885, cz); b.box(S(0x9aa0a4, 0.25, 0.9), 0.62, 0.02, 0.36, 1.1, 0.8, cz); b.cyl(steelM, 0.015, 0.015, 0.3, 1.1, 1.03, cz - 0.17, 10); b.box(steelM, 0.03, 0.03, 0.18, 1.1, 1.17, cz - 0.08);
  b.box(S(0x1d1f22, 0.4, 0.3), 0.75, 0.08, 0.45, -1.3, 0.94, cz); for (const dx of [-0.17, 0.17]) { b.cyl(darkM, 0.1, 0.1, 0.012, -1.3 + dx, 0.985, cz, 20); b.cyl(S(0x3a3a3a, 0.4, 0.6), 0.05, 0.05, 0.02, -1.3 + dx, 0.99, cz, 16); }
  b.cyl(steelM, 0.13, 0.12, 0.14, -1.47, 1.06, cz, 24); b.cyl(S(0x9a5a2a, 0.5, 0.4), 0.12, 0.11, 0.08, -1.13, 1.03, cz, 24); // a pressure-cooker-like pot and a kadhai
  b.box(cabM, 2.6, 0.7, 0.34, -1.5, 2.15, ZF + 0.17); for (let i = 0; i < 4; i++) b.box(doorM, 0.62, 0.66, 0.02, -2.47 + i * 0.65, 2.15, ZF + 0.35);
  b.box(cabM, 1.2, 0.7, 0.34, 2.4, 2.15, ZF + 0.17); for (let i = 0; i < 2; i++) b.box(doorM, 0.58, 0.66, 0.02, 2.1 + i * 0.6, 2.15, ZF + 0.35);
  // a tall fridge on the right, a shelf of steel jars on the left wall
  b.box(S(0xdfe3e6, 0.3, 0.4), 0.75, 1.85, 0.7, X1 - 0.42, 0.925, -1.8); b.box(steelM, 0.03, 0.4, 0.03, X1 - 0.75, 1.3, -1.43); b.box(S(0xc8cdd1, 0.3, 0.4), 0.74, 0.01, 0.01, X1 - 0.42, 1.2, -1.445);
  b.box(cabM, 0.3, 0.03, 1.6, X0 + 0.15, 1.6, -1.2); for (let i = 0; i < 6; i++) b.cyl(steelM, 0.07, 0.07, 0.2 + (i % 2) * 0.06, X0 + 0.15, 1.72 + (i % 2) * 0.03, -1.85 + i * 0.26, 20);
  // a ceiling light and a calendar
  b.cyl(new THREE.MeshBasicMaterial({ color: 0xfffbea, toneMapped: false }), 0.25, 0.25, 0.04, 0, H - 0.03, -0.6, 24);
  const cal = canvasTex(256, 360, (x, w, h) => { x.fillStyle = '#fff'; x.fillRect(0, 0, w, h); x.fillStyle = '#d23b2a'; x.fillRect(0, 0, w, 80); x.fillStyle = '#fff'; x.font = `800 40px ${FONT}`; x.textAlign = 'center'; x.fillText('2026', w / 2, 55); x.fillStyle = '#333'; x.font = `600 22px ${FONT}`; for (let d = 1; d <= 30; d++) x.fillText(String(d), 26 + ((d - 1) % 7) * 34, 120 + Math.floor((d - 1) / 7) * 44); });
  b.plane(new THREE.MeshStandardMaterial({ map: cal, roughness: 0.9 }), 0.36, 0.5, X0 + 0.02, 1.7, 0.6, Math.PI / 2);
  const room = b.done(); room.name = 'kitchen3d';
  return { group: room, light: { dir: V(0.2, 0.7, -0.7), sunI: 1.0, sky: 0.32, env: 0.45 } };
}
