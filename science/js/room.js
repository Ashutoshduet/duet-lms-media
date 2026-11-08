// A school chemistry lab: tiled walls, windows with daylight, black-top work bench with wooden cabinets,
// a reagent shelf, sink with tap, a green chalkboard that shows the current reaction, posters and side benches.
import * as THREE from 'three';
import { woodTex, tileTex, speckTex, canvasTex, labelTex } from './mats.js';

export const BENCH_Y = 0.9; // working surface height
export const BENCH = { x0: -1.25, x1: 1.25, z0: -1.12, z1: -0.36 };

function box(parent, sx, sy, sz, x, y, z, mat, o = {}) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), mat); m.position.set(x, y, z);
  if (o.cast) m.castShadow = true; if (o.recv !== false) m.receiveShadow = true; parent.add(m); return m;
}

export function buildRoom(scene) {
  const room = new THREE.Group(); scene.add(room);
  const W = 7.6, D = 7.2, H = 3.3, zf = -3.6, zb = 3.6;
  // materials
  const floorM = new THREE.MeshStandardMaterial({ map: speckTex('#b9b4aa', '#8f8a80', [6, 6], 9000), roughness: 0.55 });
  const wallM = new THREE.MeshStandardMaterial({ color: 0xece7dc, roughness: 0.92 });
  const tileM = new THREE.MeshStandardMaterial({ map: tileTex('#f2f4f1', '#cfd4cf', 4, [10, 2]), roughness: 0.25 });
  const ceilM = new THREE.MeshStandardMaterial({ color: 0xf4f2ee, roughness: 0.95 });
  const epoxy = new THREE.MeshStandardMaterial({ map: speckTex('#1b1e21', '#2c3135', [3, 1]), roughness: 0.32, metalness: 0.05 });
  const cab = new THREE.MeshStandardMaterial({ map: woodTex('#9b6a3c', [1, 1]), roughness: 0.6 });
  const cabLight = new THREE.MeshStandardMaterial({ color: 0xd9d4c8, roughness: 0.7 });
  const steel = new THREE.MeshStandardMaterial({ color: 0xc6cacd, metalness: 0.9, roughness: 0.28 });

  // floor / ceiling
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(W, D), floorM); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; room.add(floor);
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(W, D), ceilM); ceil.rotation.x = Math.PI / 2; ceil.position.y = H; room.add(ceil);
  // walls: plain paint above, white tiles to 1.4 m
  const wall = (w, x, z, ry) => {
    const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; room.add(g);
    const up = new THREE.Mesh(new THREE.PlaneGeometry(w, H - 1.4), wallM); up.position.y = 1.4 + (H - 1.4) / 2; g.add(up);
    const lo = new THREE.Mesh(new THREE.PlaneGeometry(w, 1.4), tileM); lo.position.y = 0.7; lo.receiveShadow = true; g.add(lo);
    const trim = new THREE.Mesh(new THREE.BoxGeometry(w, 0.04, 0.02), new THREE.MeshStandardMaterial({ color: 0x5b7a8c, roughness: 0.6 })); trim.position.set(0, 1.41, 0.01); g.add(trim);
    return g;
  };
  wall(W, 0, zf, 0); wall(W, 0, zb, Math.PI);
  const wl = wall(D, -W / 2, 0, Math.PI / 2); wall(D, W / 2, 0, -Math.PI / 2);
  // windows on the left wall (daylight)
  const winM = new THREE.MeshBasicMaterial({ color: 0xeaf4ff });
  const frameM = new THREE.MeshStandardMaterial({ color: 0x3f5a6a, roughness: 0.5 });
  for (const z of [-2.2, -0.4, 1.4]) {
    const w = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 1.25), winM); w.position.set(-W / 2 + 0.012, 2.1, z); w.rotation.y = Math.PI / 2; room.add(w);
    for (const dz of [-0.65, 0, 0.65]) box(room, 0.05, 1.3, 0.05, -W / 2 + 0.03, 2.1, z + dz, frameM, { recv: false });
    for (const dy of [-0.62, 0, 0.62]) box(room, 0.05, 0.05, 1.32, -W / 2 + 0.03, 2.1 + dy, z, frameM, { recv: false });
    for (let k = -4; k <= 4; k++) box(room, 0.02, 1.25, 0.012, -W / 2 + 0.04, 2.1, z + k * 0.14, new THREE.MeshStandardMaterial({ color: 0x2b3a44, roughness: 0.6 }), { recv: false });
  }
  // ceiling tube lights
  const tubeM = new THREE.MeshBasicMaterial({ color: 0xffffff });
  for (const x of [-1.6, 1.6]) for (const z of [-2, 0, 2]) {
    box(room, 1.25, 0.05, 0.16, x, H - 0.03, z, new THREE.MeshStandardMaterial({ color: 0xdedede, roughness: 0.5 }), { recv: false });
    box(room, 1.2, 0.03, 0.06, x, H - 0.065, z, tubeM, { recv: false });
  }

  // ---------------- main work bench (in front of the student)
  const B = BENCH; const bw = B.x1 - B.x0, bd = B.z1 - B.z0, cx = (B.x0 + B.x1) / 2, cz = (B.z0 + B.z1) / 2;
  const top = box(room, bw, 0.03, bd, cx, BENCH_Y - 0.015, cz, epoxy); top.name = 'benchTop';
  box(room, bw - 0.04, BENCH_Y - 0.13, bd - 0.06, cx, (BENCH_Y - 0.13) / 2 + 0.1, cz - 0.01, cab);
  box(room, bw - 0.04, 0.1, bd - 0.12, cx, 0.05, cz - 0.04, new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.9 })); // plinth
  // drawers / doors with handles
  const doorM = new THREE.MeshStandardMaterial({ map: woodTex('#a77444'), roughness: 0.55 });
  for (let i = 0; i < 6; i++) {
    const x = B.x0 + 0.04 + (bw - 0.08) * (i + 0.5) / 6;
    box(room, (bw - 0.08) / 6 - 0.012, 0.16, 0.012, x, BENCH_Y - 0.12, B.z1 - 0.026, doorM);
    box(room, (bw - 0.08) / 6 - 0.012, 0.5, 0.012, x, 0.38, B.z1 - 0.026, doorM);
    box(room, 0.08, 0.012, 0.02, x, BENCH_Y - 0.12, B.z1 - 0.012, steel, { recv: false });
    box(room, 0.012, 0.09, 0.02, x + 0.06, 0.48, B.z1 - 0.012, steel, { recv: false });
  }
  // reagent shelf at the back of the bench
  const shelfM = new THREE.MeshStandardMaterial({ map: woodTex('#b07d4a'), roughness: 0.55 });
  const sz = B.z0 + 0.09;
  // an open two-tier rack on thin steel posts, so the room and the chalkboard stay visible behind it
  const sw = 1.5;
  for (const y of [BENCH_Y + 0.23, BENCH_Y + 0.46]) { box(room, sw, 0.016, 0.15, cx - 0.2, y, sz, shelfM); box(room, sw, 0.03, 0.008, cx - 0.2, y + 0.022, sz - 0.071, steel, { recv: false }); }
  for (const x of [cx - 0.2 - sw / 2 + 0.02, cx - 0.2 + sw / 2 - 0.02]) for (const dz of [-0.06, 0.06]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.48, 10), steel); post.position.set(x, BENCH_Y + 0.24, sz + dz); room.add(post);
  }
  // sink and tap at the right end
  const sinkX = B.x1 - 0.2;
  const sink = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.012, 0.32), new THREE.MeshStandardMaterial({ color: 0x9fa4a8, metalness: 0.8, roughness: 0.25 }));
  sink.position.set(sinkX, BENCH_Y + 0.001, cz + 0.05); room.add(sink);
  const tap = new THREE.Group(); tap.position.set(sinkX, BENCH_Y, B.z0 + 0.21); room.add(tap);
  const tp = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.011, 0.3, 16), steel); tp.position.y = 0.15; tap.add(tp);
  const arc = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.009, 10, 20, Math.PI), steel); arc.position.set(0, 0.3, 0.07); arc.rotation.y = Math.PI / 2; tap.add(arc);
  // gas cock
  const gas = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.06, 12), new THREE.MeshStandardMaterial({ color: 0xc9a227, metalness: 0.8, roughness: 0.3 }));
  gas.position.set(B.x0 + 0.2, BENCH_Y + 0.03, B.z0 + 0.2); room.add(gas);

  // ---------------- chalkboard (shows the reaction) and posters
  const board = new THREE.Group(); board.position.set(0, 1.85, zf + 0.03); room.add(board);
  box(board, 3.3, 1.35, 0.05, 0, 0, 0, new THREE.MeshStandardMaterial({ map: woodTex('#6b4526'), roughness: 0.6 }), { recv: false });
  const bc = document.createElement('canvas'); bc.width = 2048; bc.height = 820;
  const btex = new THREE.CanvasTexture(bc); btex.colorSpace = THREE.SRGBColorSpace; btex.anisotropy = 8;
  const boardFace = new THREE.Mesh(new THREE.PlaneGeometry(3.15, 1.26), new THREE.MeshStandardMaterial({ map: btex, roughness: 0.9 }));
  boardFace.position.z = 0.03; board.add(boardFace);
  box(board, 3.2, 0.03, 0.08, 0, -0.66, 0.04, new THREE.MeshStandardMaterial({ color: 0x7a5a3a, roughness: 0.7 }), { recv: false });
  const drawBoard = (title, lines = []) => {
    const x = bc.getContext('2d'); const w = bc.width, h = bc.height;
    x.fillStyle = '#20402f'; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 2500; i++) { x.fillStyle = `rgba(255,255,255,${Math.random() * 0.035})`; x.fillRect(Math.random() * w, Math.random() * h, 3 + Math.random() * 40, 2 + Math.random() * 10); }
    x.fillStyle = 'rgba(244,240,226,0.95)'; x.textBaseline = 'top';
    x.font = '700 78px "Noto Sans Devanagari", sans-serif'; x.fillText(title, 70, 46, w - 140);
    x.fillRect(70, 150, Math.min(w - 140, x.measureText(title).width), 4);
    let y = 200;
    for (const ln of lines) {
      const sz = ln.size ?? 60; x.font = `${ln.w ?? 600} ${sz}px "Noto Sans Devanagari", sans-serif`; x.fillStyle = ln.c ?? 'rgba(244,240,226,0.92)';
      x.fillText(ln.t, 80, y, w - 160); y += sz * 1.35;
    }
    btex.needsUpdate = true;
  };
  drawBoard('DUET STEM · Chemistry Lab', [{ t: 'Science Lab 360', size: 54, c: 'rgba(240,166,90,0.95)' }]);
  // periodic table poster (stylised grid, not a copy of any chart)
  const ptex = canvasTex(1024, 640, (x, w, h) => {
    x.fillStyle = '#f7f4ec'; x.fillRect(0, 0, w, h); x.fillStyle = '#1d2a36'; x.font = '700 40px sans-serif'; x.fillText('Periodic Table of Elements', 40, 58);
    const cols = { 1: '#f6a5a5', 2: '#f7c98b', 3: '#bfe3a5', 4: '#a9d4f0', 5: '#d9c4f0', 6: '#f0e19a' };
    const layout = [[1, 18], [2, 3, 4, 5, 6, 7, 8, 9, 10], [11, 12, 13, 14, 15, 16, 17, 18]];
    const sym = 'H He Li Be B C N O F Ne Na Mg Al Si P S Cl Ar K Ca Sc Ti V Cr Mn Fe Co Ni Cu Zn Ga Ge As Se Br Kr Rb Sr Y Zr Nb Mo Tc Ru Rh Pd Ag Cd In Sn Sb Te I Xe Cs Ba La Hf Ta W Re Os Ir Pt Au Hg Tl Pb Bi Po At Rn'.split(' ');
    const groupsRow = [[1, 18], [1, 2, 13, 14, 15, 16, 17, 18], [1, 2, 13, 14, 15, 16, 17, 18], Array.from({ length: 18 }, (_, i) => i + 1), Array.from({ length: 18 }, (_, i) => i + 1), Array.from({ length: 18 }, (_, i) => i + 1)];
    let n = 0; const cw = 52, ch = 72;
    groupsRow.forEach((gs, r) => gs.forEach((g) => {
      if (n >= sym.length) return; const s = sym[n++]; const px = 30 + (g - 1) * 54, py = 90 + r * 88;
      x.fillStyle = cols[g <= 2 ? 1 : g <= 12 ? 4 : g === 18 ? 5 : g === 17 ? 6 : 3]; x.fillRect(px, py, cw, ch);
      x.fillStyle = '#1d2a36'; x.font = '600 14px sans-serif'; x.fillText(String(n), px + 4, py + 16); x.font = '700 24px sans-serif'; x.fillText(s, px + 8, py + 50);
    }));
    void layout;
  });
  const poster = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.75), new THREE.MeshStandardMaterial({ map: ptex, roughness: 0.8 }));
  poster.position.set(2.65, 2.0, zf + 0.02); room.add(poster);
  const rules = labelTex([{ t: 'LAB SAFETY · प्रयोगशाला नियम', size: 44 }, { t: 'Wear goggles and lab coat · चश्मा और कोट पहनें', size: 30, w: 600 },
    { t: 'Never taste or smell directly · कभी चखें नहीं', size: 30, w: 600 }, { t: 'Add acid to water, not water to acid', size: 30, w: 600 },
    { t: 'Point test tubes away when heating', size: 30, w: 600 }], { w: 900, h: 600, band: '#c0392b' });
  const rp = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 0.63), new THREE.MeshStandardMaterial({ map: rules, roughness: 0.8 }));
  rp.position.set(-2.65, 2.0, zf + 0.02); room.add(rp);
  // clock
  const clock = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.03, 32), new THREE.MeshStandardMaterial({ map: canvasTex(256, 256, (x, w) => {
    x.fillStyle = '#fbfaf6'; x.beginPath(); x.arc(128, 128, 126, 0, 7); x.fill(); x.strokeStyle = '#222'; x.lineWidth = 8; x.stroke();
    for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283; x.fillStyle = '#222'; x.fillRect(128 + Math.sin(a) * 100 - 3, 128 - Math.cos(a) * 100 - 8, 6, 16); }
    x.lineWidth = 7; x.beginPath(); x.moveTo(128, 128); x.lineTo(128 + 50, 128 - 30); x.stroke(); x.lineWidth = 4; x.beginPath(); x.moveTo(128, 128); x.lineTo(128 - 10, 128 - 90); x.stroke(); void w;
  }), roughness: 0.6 }));
  clock.rotation.x = Math.PI / 2; clock.position.set(0, 2.85, zf + 0.03); room.add(clock);

  // ---------------- other benches in the room (context)
  const sideBench = (x, z, w, rot = 0) => {
    const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rot; room.add(g);
    box(g, w, 0.03, 0.75, 0, BENCH_Y - 0.015, 0, epoxy); box(g, w - 0.04, BENCH_Y - 0.13, 0.7, 0, (BENCH_Y - 0.13) / 2 + 0.1, 0, cab);
    box(g, w - 0.1, 0.018, 0.14, 0, BENCH_Y + 0.25, -0.3, shelfM);
    for (let i = 0; i < Math.floor(w / 0.25); i++) {
      const b = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.028, 0.1, 14), new THREE.MeshStandardMaterial({ color: i % 3 ? 0x8a5a2a : 0xe8eef2, transparent: true, opacity: 0.75, roughness: 0.1 }));
      b.position.set(-w / 2 + 0.15 + i * 0.25, BENCH_Y + 0.31, -0.3); g.add(b);
    }
    return g;
  };
  sideBench(-2.2, 1.0, 2.2); sideBench(2.2, 1.0, 2.2); sideBench(-2.2, 2.6, 2.2); sideBench(2.2, 2.6, 2.2);
  // fume hood on the right wall
  const hood = new THREE.Group(); hood.position.set(W / 2 - 0.45, 0, -1.6); hood.rotation.y = -Math.PI / 2; room.add(hood);
  box(hood, 1.4, 0.95, 0.8, 0, 0.475, 0, cabLight); box(hood, 1.4, 1.2, 0.8, 0, 1.55, -0.02, new THREE.MeshStandardMaterial({ color: 0xe9e6de, roughness: 0.6 }));
  const sash = new THREE.Mesh(new THREE.PlaneGeometry(1.25, 0.7), new THREE.MeshStandardMaterial({ color: 0xcfe6ef, transparent: true, opacity: 0.3, roughness: 0.05, metalness: 0.2 }));
  sash.position.set(0, 1.45, 0.41); hood.add(sash);
  box(hood, 1.4, 0.3, 0.8, 0, 2.3, 0, new THREE.MeshStandardMaterial({ color: 0xd3d0c8, roughness: 0.7 }));
  // glass-door cupboard on the back wall
  const cup = new THREE.Group(); cup.position.set(-2.4, 0, zb - 0.25); cup.rotation.y = Math.PI; room.add(cup);
  box(cup, 1.6, 2.1, 0.45, 0, 1.05, 0, cab);
  for (let r = 0; r < 4; r++) for (let i = 0; i < 9; i++) {
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.037, 0.16, 12), new THREE.MeshStandardMaterial({ color: [0x8a5a2a, 0xe6eef2, 0x3d6b8a][(i + r) % 3], transparent: true, opacity: 0.8, roughness: 0.15 }));
    b.position.set(-0.68 + i * 0.17, 0.42 + r * 0.45, 0.24); cup.add(b);
  }
  // fire extinguisher + first aid
  const ext = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.5, 20), new THREE.MeshStandardMaterial({ color: 0xc0181f, roughness: 0.35, metalness: 0.2 }));
  ext.position.set(W / 2 - 0.15, 0.95, 1.2); room.add(ext);
  const fa = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.3, 0.1), new THREE.MeshStandardMaterial({ map: labelTex([{ t: '✚', size: 120, c: '#c0181f' }, { t: 'FIRST AID', size: 40 }], { bg: '#ffffff', border: '#c0181f' }), roughness: 0.6 }));
  fa.position.set(W / 2 - 0.06, 1.7, 0.5); fa.rotation.y = -Math.PI / 2; room.add(fa);
  void wl;

  // ---------------- lights
  const hemi = new THREE.HemisphereLight(0xfffcf4, 0x8f8676, 0.75); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff3e0, 1.6); sun.position.set(-3.2, 4.2, 0.6); sun.target.position.set(0, BENCH_Y, -0.75);
  sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024); const sc = sun.shadow.camera; sc.left = -1.5; sc.right = 1.5; sc.top = 1.1; sc.bottom = -1.1; sc.near = 1; sc.far = 9;
  sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.02; sun.shadow.radius = 3;
  scene.add(sun, sun.target);
  const fill = new THREE.DirectionalLight(0xe8f0ff, 0.45); fill.position.set(2, 3, 2); scene.add(fill);

  return { room, drawBoard, sinkPos: new THREE.Vector3(sinkX, BENCH_Y, cz + 0.05), tapPos: new THREE.Vector3(sinkX, BENCH_Y + 0.24, B.z0 + 0.28), shelfY: [BENCH_Y + 0.239, BENCH_Y + 0.469], shelfZ: sz, sun };
}
