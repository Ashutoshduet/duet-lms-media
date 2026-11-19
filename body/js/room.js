// Human Body 360: a bright, real-looking anatomy room around the body (the look of the best anatomy VR apps): light oak
// floor, wood panelling below off-white walls, LED panels in the ceiling, a wide window with half-open blinds and a sky
// behind it, a working wall clock, a whiteboard, a bookcase, a plant and a door. Everything is drawn here (no outside
// images) and merged into a few meshes so the headset keeps 72 fps.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { FONT } from './labels.js';

const rnd = (s) => () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
function tex(w, h, f, rep) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; f(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]); }
  return t;
}
const oakTex = () => tex(1024, 1024, (x) => { const r = rnd(7); const rows = 8;
  for (let i = 0; i < rows; i++) { let px = -r() * 400; while (px < 1024) { const len = 300 + r() * 380, v = 0.9 + r() * 0.16; const base = [Math.round(176 * v), Math.round(128 * v), Math.round(82 * v)];
    x.fillStyle = `rgb(${base})`; x.fillRect(px, i * 128, len, 128);
    for (let k = 0; k < 26; k++) { const y = i * 128 + 6 + r() * 116; x.strokeStyle = `rgba(120,80,40,${0.05 + r() * 0.12})`; x.lineWidth = 1 + r() * 2; x.beginPath(); x.moveTo(px, y); for (let s = 0; s <= 8; s++) x.lineTo(px + s * len / 8, y + Math.sin(s * 0.8 + k) * (1 + r() * 2.5)); x.stroke(); }
    x.fillStyle = 'rgba(70,45,20,0.55)'; x.fillRect(px, i * 128, 2, 128); px += len; }
    x.fillStyle = 'rgba(70,45,20,0.6)'; x.fillRect(0, i * 128, 1024, 2); } }, [5, 5]);
const paintTex = () => tex(256, 256, (x) => { const r = rnd(3); x.fillStyle = '#ece8df'; x.fillRect(0, 0, 256, 256); for (let i = 0; i < 2500; i++) { x.fillStyle = `rgba(${r() < 0.5 ? '255,255,255' : '160,150,130'},${r() * 0.05})`; x.fillRect(r() * 256, r() * 256, 2, 2); } }, [1, 1]);
const panelTex = () => tex(512, 256, (x) => { const r = rnd(11); x.fillStyle = '#7a5134'; x.fillRect(0, 0, 512, 256);
  for (let i = 0; i < 160; i++) { const y = r() * 256; x.strokeStyle = `rgba(40,22,10,${0.06 + r() * 0.12})`; x.lineWidth = 1 + r() * 2; x.beginPath(); x.moveTo(0, y); x.bezierCurveTo(170, y + r() * 6 - 3, 340, y + r() * 6 - 3, 512, y); x.stroke(); }
  [[16, 16, 224, 224], [272, 16, 224, 224]].forEach(([a, b, w, h]) => { x.strokeStyle = 'rgba(30,16,6,0.55)'; x.lineWidth = 6; x.strokeRect(a, b, w, h); x.strokeStyle = 'rgba(255,220,180,0.12)'; x.lineWidth = 2; x.strokeRect(a + 5, b + 5, w - 10, h - 10); }); }, [1, 1]);
const skyTex = () => tex(1024, 512, (x) => { const g = x.createLinearGradient(0, 0, 0, 512); g.addColorStop(0, '#7fb6ea'); g.addColorStop(0.65, '#cfe5f6'); g.addColorStop(1, '#e8f0e4'); x.fillStyle = g; x.fillRect(0, 0, 1024, 512);
  const r = rnd(5); for (let i = 0; i < 9; i++) { const cx = r() * 1024, cy = 60 + r() * 160; x.fillStyle = 'rgba(255,255,255,0.75)'; for (let k = 0; k < 6; k++) { x.beginPath(); x.ellipse(cx + k * 22 - 50, cy + Math.sin(k) * 8, 40 + r() * 20, 16 + r() * 8, 0, 0, 7); x.fill(); } }
  for (let i = 0; i < 40; i++) { const cx = i * 27 + r() * 12, h = 120 + r() * 90; x.fillStyle = `rgb(${50 + r() * 30},${100 + r() * 40},${55 + r() * 25})`; x.beginPath(); x.ellipse(cx, 512 - h * 0.45, 30 + r() * 20, h * 0.55, 0, 0, 7); x.fill(); } });

export function buildAnatomyRoom() {
  const g = new THREE.Group(); g.name = 'anatomy-room';
  const X0 = -4.6, X1 = 4.6, Z0 = -4.2, Z1 = 5.2, H = 3.1, WAIN = 1.0;
  const mats = {
    floor: new THREE.MeshStandardMaterial({ map: oakTex(), roughness: 0.42, metalness: 0, envMapIntensity: 0.6 }),
    paint: new THREE.MeshStandardMaterial({ map: paintTex(), roughness: 0.9 }),
    panel: new THREE.MeshStandardMaterial({ map: panelTex(), roughness: 0.55, envMapIntensity: 0.5 }),
    trim: new THREE.MeshStandardMaterial({ color: '#f4f1ea', roughness: 0.5 }),
    ceil: new THREE.MeshStandardMaterial({ color: '#f6f5f2', roughness: 0.95 }),
    led: new THREE.MeshBasicMaterial({ color: '#fbfdff' }),
    frame: new THREE.MeshStandardMaterial({ color: '#d9dde2', roughness: 0.35, metalness: 0.6 }),
    slat: new THREE.MeshStandardMaterial({ color: '#f2f0ea', roughness: 0.6 }),
    dark: new THREE.MeshStandardMaterial({ color: '#3a2a20', roughness: 0.6 }),
    shelf: new THREE.MeshStandardMaterial({ color: '#8b5e3c', roughness: 0.55 }),
  };
  const parts = {}; Object.keys(mats).forEach((k) => { parts[k] = []; });
  const box = (m, w, h, d, x, y, z, ry = 0) => { const geo = new THREE.BoxGeometry(w, h, d); if (ry) geo.rotateY(ry); geo.translate(x, y, z); parts[m].push(geo); };
  const plane = (m, w, h, x, y, z, ry, rx = 0, uvScale = null) => { const geo = new THREE.PlaneGeometry(w, h); if (uvScale) { const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * uvScale[0], uv.getY(i) * uvScale[1]); } if (rx) geo.rotateX(rx); if (ry) geo.rotateY(ry); geo.translate(x, y, z); parts[m].push(geo); };
  const W = X1 - X0, D = Z1 - Z0, cx = (X0 + X1) / 2, cz = (Z0 + Z1) / 2;
  plane('floor', W, D, cx, 0, cz, 0, -Math.PI / 2);
  plane('ceil', W, D, cx, H, cz, 0, Math.PI / 2);
  // walls: [length, centre x, centre z, rotation so the face looks into the room]
  const walls = [[W, cx, Z0, 0], [W, cx, Z1, Math.PI], [D, X0, cz, Math.PI / 2], [D, X1, cz, -Math.PI / 2]];
  walls.forEach(([L, x, z, ry]) => {
    plane('paint', L, H - WAIN, x, WAIN + (H - WAIN) / 2, z, ry, 0, [L / 1.6, 1]);
    plane('panel', L, WAIN, x, WAIN / 2, z, ry, 0, [L / 1.2, 1]);
    const n = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), ry);
    box('trim', L, 0.05, 0.03, x + n.x * 0.015, WAIN, z + n.z * 0.015, ry); // chair rail
    box('trim', L, 0.12, 0.02, x + n.x * 0.01, 0.06, z + n.z * 0.01, ry); // skirting
    box('trim', L, 0.06, 0.06, x + n.x * 0.03, H - 0.03, z + n.z * 0.03, ry); // cornice
  });
  // ceiling LED panels
  for (let i = -1; i <= 1; i++) for (let j = 0; j < 3; j++) { const px = i * 2.4, pz = -2.2 + j * 2.6; box('frame', 0.66, 0.02, 0.66, px, H - 0.01, pz); plane('led', 0.6, 0.6, px, H - 0.022, pz, 0, Math.PI / 2); }
  // a wide window on the left wall, with a sky and trees outside and half-open blinds (built facing +z, then turned)
  { const WZ = -0.4, WY = 1.95, WW = 3.4, WH = 1.6, win = []; const wb2 = (w, h, d, x, y, z) => { const geo = new THREE.BoxGeometry(w, h, d); geo.translate(x, y, z); win.push(geo); };
    const sky = new THREE.Mesh(new THREE.PlaneGeometry(WW, WH), new THREE.MeshBasicMaterial({ map: skyTex() })); sky.position.set(X0 + 0.005, WY, WZ); sky.rotation.y = Math.PI / 2; g.add(sky);
    [WY + WH / 2, WY - WH / 2].forEach((y) => wb2(WW + 0.12, 0.08, 0.08, 0, y, 0.04)); [-WW / 2, 0, WW / 2].forEach((x) => wb2(0.07, WH, 0.08, x, WY, 0.04));
    const sill = []; const sl = new THREE.BoxGeometry(WW + 0.3, 0.05, 0.22); sl.translate(0, WY - WH / 2 - 0.06, 0.11); sill.push(sl);
    const slats = []; for (let k = 0; k < 18; k++) { const y = WY + WH / 2 - 0.12 - k * 0.055; if (y < WY - 0.1) break; const sg = new THREE.BoxGeometry(WW - 0.1, 0.004, 0.045); sg.rotateX(0.9); sg.translate(0, y, 0.1); slats.push(sg); }
    wb2(WW, 0.06, 0.06, 0, WY + WH / 2 - 0.05, 0.1);
    const place = (list, key) => list.forEach((geo) => { geo.rotateY(Math.PI / 2); geo.translate(X0, 0, WZ); parts[key].push(geo); });
    place(win, 'frame'); place(sill, 'trim'); place(slats, 'slat'); }
  // a whiteboard on the left wall
  const wbT = tex(1024, 512, (x) => { x.fillStyle = '#fbfbf9'; x.fillRect(0, 0, 1024, 512); x.strokeStyle = 'rgba(0,0,0,0.04)'; for (let i = 0; i < 40; i++) { x.beginPath(); x.moveTo(Math.random() * 1024, Math.random() * 512); x.lineTo(Math.random() * 1024, Math.random() * 512); x.stroke(); }
    x.fillStyle = '#1d4fa0'; x.font = `600 64px ${FONT}`; x.fillText('Human Body 360', 60, 110); x.font = `500 40px ${FONT}`; x.fillStyle = '#2b2b2b';
    ['Skeleton · 206 bones', 'Heart · 4 chambers', 'Lungs · ~300 million alveoli', 'Brain · ~86 billion neurons'].forEach((t, i) => x.fillText('• ' + t, 70, 200 + i * 66));
    x.strokeStyle = '#c0392b'; x.lineWidth = 6; x.beginPath(); const hx = 820, hy = 300; x.moveTo(hx, hy + 60); x.bezierCurveTo(hx - 120, hy - 20, hx - 40, hy - 100, hx, hy - 30); x.bezierCurveTo(hx + 40, hy - 100, hx + 120, hy - 20, hx, hy + 60); x.stroke(); });
  const wb = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.1), new THREE.MeshStandardMaterial({ map: wbT, roughness: 0.25 })); wb.rotation.y = -Math.PI / 2; wb.position.set(X1 - 0.025, 1.75, 1.2); g.add(wb);
  box('frame', 0.04, 1.16, 2.26, X1 - 0.02, 1.75, 1.2); box('frame', 0.08, 0.03, 2.2, X1 - 0.05, 1.18, 1.2);
  // a wall clock on the left wall that shows the real time
  const clock = new THREE.Group(); clock.position.set(1.6, 2.45, Z0 + 0.04); g.add(clock);
  const faceT = tex(256, 256, (x) => { x.fillStyle = '#fcfcfa'; x.beginPath(); x.arc(128, 128, 126, 0, 7); x.fill(); x.fillStyle = '#222'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = `700 30px ${FONT}`;
    for (let h = 1; h <= 12; h++) { const a = h * Math.PI / 6; x.fillText(String(h), 128 + Math.sin(a) * 96, 130 - Math.cos(a) * 96); } for (let m = 0; m < 60; m++) { const a = m * Math.PI / 30; x.lineWidth = m % 5 ? 2 : 4; x.beginPath(); x.moveTo(128 + Math.sin(a) * 114, 128 - Math.cos(a) * 114); x.lineTo(128 + Math.sin(a) * 122, 128 - Math.cos(a) * 122); x.stroke(); } });
  const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.05, 40), mats.frame); rim.rotation.x = Math.PI / 2; clock.add(rim);
  const face = new THREE.Mesh(new THREE.CircleGeometry(0.18, 40), new THREE.MeshStandardMaterial({ map: faceT, roughness: 0.4 })); face.position.z = 0.026; clock.add(face);
  const hand = (len, w, c) => { const p = new THREE.Group(); const m = new THREE.Mesh(new THREE.BoxGeometry(w, len, 0.004), new THREE.MeshStandardMaterial({ color: c, roughness: 0.4 })); m.position.y = len / 2 - 0.015; p.add(m); p.position.z = 0.03; clock.add(p); return p; };
  const hh = hand(0.1, 0.012, '#222'), mh = hand(0.15, 0.008, '#222'), sh = hand(0.16, 0.003, '#c0392b');
  // the DUET STEM sign on the far wall, on a dark board
  { const logo = new THREE.TextureLoader().load('./brand/duet-stem-logo-light.png'); logo.colorSpace = THREE.SRGBColorSpace; logo.anisotropy = 8;
    const board = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.42, 0.04), new THREE.MeshStandardMaterial({ color: '#1d2530', roughness: 0.4 })); board.position.set(-1.7, 2.35, Z0 + 0.03); g.add(board);
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 1.3 * 165 / 1024), new THREE.MeshBasicMaterial({ map: logo, transparent: true })); sign.position.set(-1.7, 2.35, Z0 + 0.052); g.add(sign); }
  // a bookcase on the right wall
  const bc = new THREE.Group(); bc.position.set(X1 - 0.2, 0, -1.6); bc.rotation.y = -Math.PI / 2; g.add(bc);
  const bcParts = []; const sb = (w, h, d, x, y, z) => { const geo = new THREE.BoxGeometry(w, h, d); geo.translate(x, y, z); bcParts.push(geo); };
  sb(1.8, 2.0, 0.03, 0, 1.0, -0.17); [-0.9, 0.9].forEach((x) => sb(0.03, 2.0, 0.36, x, 1.0, 0)); for (let k = 0; k <= 5; k++) sb(1.8, 0.03, 0.36, 0, 0.05 + k * 0.38, 0);
  bc.add(new THREE.Mesh(mergeGeometries(bcParts), mats.shelf));
  const books = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ roughness: 0.7 }), 120); const r = rnd(21), M4 = new THREE.Matrix4(), C = new THREE.Color(); let n = 0;
  const COLS = ['#8e2b2b', '#1f4e79', '#2f6b3a', '#c8a24a', '#5b3f75', '#d9d3c4', '#2b2b2b', '#a65d2a'];
  for (let k = 0; k < 5; k++) { let x = -0.86; while (x < 0.84 && n < 120) { const w = 0.025 + r() * 0.035, h = 0.24 + r() * 0.1; if (r() < 0.08) { x += 0.08; continue; } M4.makeScale(w, h, 0.22 + r() * 0.06).setPosition(x + w / 2, 0.065 + k * 0.38 + h / 2, -0.02); books.setMatrixAt(n, M4); books.setColorAt(n, C.set(COLS[Math.floor(r() * COLS.length)])); n++; x += w + 0.003; } }
  books.count = n; bc.add(books);
  // a potted plant in the corner
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.15, 0.36, 24), new THREE.MeshStandardMaterial({ color: '#d6cfc2', roughness: 0.6 })); pot.position.set(X1 - 0.45, 0.18, Z0 + 0.45); g.add(pot);
  const leafM = new THREE.MeshStandardMaterial({ color: '#3e7a3a', roughness: 0.6, side: THREE.DoubleSide }); const leafG = new THREE.SphereGeometry(0.12, 10, 8); leafG.scale(0.35, 1, 0.08);
  for (let k = 0; k < 18; k++) { const l = new THREE.Mesh(leafG, leafM); const a = k * 2.4, t = 0.25 + (k % 6) * 0.12; l.position.set(X1 - 0.45 + Math.cos(a) * 0.12, 0.36 + t + 0.1, Z0 + 0.45 + Math.sin(a) * 0.12); l.rotation.set(Math.cos(a) * 0.6, a, Math.sin(a) * 0.6); g.add(l); }
  // a door on the right wall, near you
  box('dark', 0.06, 2.15, 1.0, X1 - 0.03, 1.075, 3.6); box('trim', 0.08, 2.25, 1.12, X1 - 0.02, 1.1, 3.6);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.03, 12, 10), mats.frame); knob.position.set(X1 - 0.1, 1.0, 3.25); g.add(knob);
  // a soft contact shadow and a round grey mat where the body stands
  const shT = tex(256, 256, (x) => { const gr = x.createRadialGradient(128, 128, 10, 128, 128, 128); gr.addColorStop(0, 'rgba(0,0,0,0.45)'); gr.addColorStop(0.5, 'rgba(0,0,0,0.18)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = gr; x.fillRect(0, 0, 256, 256); });
  const mat = new THREE.Mesh(new THREE.CircleGeometry(0.85, 64), new THREE.MeshStandardMaterial({ color: '#2a323d', roughness: 0.55, envMapIntensity: 0.6 })); mat.rotation.x = -Math.PI / 2; mat.position.y = 0.003; g.add(mat);
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.85, 0.88, 96), new THREE.MeshBasicMaterial({ color: '#3d8fe0' })); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.004; g.add(ring);
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.9), new THREE.MeshBasicMaterial({ map: shT, transparent: true, depthWrite: false })); shadow.rotation.x = -Math.PI / 2; shadow.position.y = 0.005; g.add(shadow);
  // one mesh per material
  for (const [k, list] of Object.entries(parts)) if (list.length) { const m = new THREE.Mesh(mergeGeometries(list), mats[k]); m.name = 'room-' + k; g.add(m); }
  g.traverse((o) => { o.userData.noPick = true; });
  let last = -1;
  g.userData.tick = () => { const d = new Date(), s = d.getSeconds(); if (s === last) return; last = s; const m = d.getMinutes() + s / 60, h = (d.getHours() % 12) + m / 60;
    sh.rotation.z = -s * Math.PI / 30; mh.rotation.z = -m * Math.PI / 30; hh.rotation.z = -h * Math.PI / 6; };
  g.userData.tick();
  g.userData.inside = { X0, X1, Z0, Z1, H };
  return g;
}

// Meta Quest: the room in plain (Lambert) shading instead of the physically based one. The room fills most of the view, so
// its shading cost counts on every pixel (measured on a Quest 3S: about a quarter of the frame). The light the walls got from
// the reflection map comes back as a soft glow of their own texture (emissive = texture x k), tuned so walls, floor and
// ceiling keep their brightness; set k to 0 when the scene has no reflection map (the plain lights then carry the room).
// Returns the new materials, so their glow can follow the reflection map.
export function lightenRoom(g, k = 0.5) {
  const done = new Map();
  g.traverse((o) => {
    const m = o.material; if (!m || !m.isMeshStandardMaterial) return;
    let n = done.get(m);
    if (!n) {
      n = new THREE.MeshLambertMaterial({ color: m.color, map: m.map, side: m.side, transparent: m.transparent, opacity: m.opacity, depthWrite: m.depthWrite });
      n.emissive.copy(m.color); n.emissiveIntensity = k; if (m.map) n.emissiveMap = m.map;
      if (m.map) m.map.anisotropy = Math.min(m.map.anisotropy || 1, 4);
      done.set(m, n);
    }
    o.material = n;
  });
  done.forEach((n, m) => m.dispose());
  return [...done.values()];
}
