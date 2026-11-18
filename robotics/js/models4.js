// DUET Robotics Lab 360, batch 4: the new boards and parts in 3D, made in code from their datasheet sizes (our own work:
// no downloaded models, no brand artwork). Units mm. A board is built around its own centre (the middle of its pin field
// for the breadboard boards, the board's middle for the Mega); the PCB's printed side is a canvas texture drawn here.
//   Nano 43.2 × 18 mm, ATmega328P TQFP-32 at 45°, mini-USB · Mega 2560 101.6 × 53.3 mm, ATmega2560 TQFP-100, USB-B, jack
//   ESP32 DevKit V1 51.5 × 28.3 mm, ESP32-WROOM-32 (18 × 25.5 mm, shield can, PCB antenna), micro-USB, CP2102, EN / BOOT
// Static pieces are merged by material (a board is about 15 draw calls); the LEDs and the reset button stay their own.
import * as THREE from 'three';
import { materials, mergeStatic, box, cyl, shadows } from './models.js';
import * as TX from './tex.js';
import { BB } from './boards.js';

let LITE = false; export function setLite4(v) { LITE = v; }
const M = () => materials();
function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function tex(c, srgb = true) { const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.needsUpdate = true; return t; }
const FONT = TX.FONT;

// ------------------------------------------------------------------ a board's printed side: solder mask, pads, print
// draw(p) gets helpers in board mm (x from the left, y from the bottom): silk(text, x, y, size, opts), pad, ring, line, rect
function pcbTextures(W, H, mask, draw) {
  const s = LITE ? 10 : 20; const w = Math.round(W * s), h = Math.round(H * s);
  const C = canvas(w, h), R = canvas(w, h); const c = C.getContext('2d'), r = R.getContext('2d');
  const X = (mm) => mm * s, Y = (mm) => (H - mm) * s;
  c.fillStyle = mask; c.fillRect(0, 0, w, h);
  const g = c.createLinearGradient(0, 0, w, h); g.addColorStop(0, 'rgba(255,255,255,0.04)'); g.addColorStop(1, 'rgba(0,0,0,0.08)'); c.fillStyle = g; c.fillRect(0, 0, w, h);
  r.fillStyle = 'rgb(0,100,0)'; r.fillRect(0, 0, w, h); // roughness ~0.4, not metal
  const lighten = mask === '#18191c' ? 'rgba(90,90,96,0.35)' : 'rgba(90,150,230,0.30)';
  const P = {
    s, X, Y,
    trace(pts, wd = 0.25) { c.strokeStyle = lighten; c.lineWidth = wd * s; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(X(x), Y(y)) : c.moveTo(X(x), Y(y)))); c.stroke(); },
    pad(x, y, ww, hh, round) { c.fillStyle = '#d8b765'; r.fillStyle = 'rgb(0,60,255)'; for (const ctx of [c, r]) { ctx.beginPath(); if (round) ctx.arc(X(x), Y(y), ww * s, 0, 7); else ctx.rect(X(x - ww / 2), Y(y + hh / 2), ww * s, hh * s); ctx.fill(); } },
    ring(x, y, ro, ri) { this.pad(x, y, ro, 0, true); c.fillStyle = '#121212'; c.beginPath(); c.arc(X(x), Y(y), ri * s, 0, 7); c.fill(); },
    silk(txt, x, y, px, o = {}) { c.save(); c.translate(X(x), Y(y)); if (o.rot) c.rotate(o.rot); c.font = `${o.w || 700} ${px * s}px ${FONT}`; c.fillStyle = o.col || '#f1f1ec'; c.textAlign = o.align || 'center'; c.textBaseline = 'middle'; c.fillText(txt, 0, 0); c.restore(); },
    line(x1, y1, x2, y2, lw = 0.2) { c.strokeStyle = '#f1f1ec'; c.lineWidth = lw * s; c.beginPath(); c.moveTo(X(x1), Y(y1)); c.lineTo(X(x2), Y(y2)); c.stroke(); },
    rect(x, y, ww, hh, lw = 0.18) { c.strokeStyle = '#f1f1ec'; c.lineWidth = lw * s; c.strokeRect(X(x), Y(y + hh), ww * s, hh * s); },
    fill(x, y, ww, hh, col) { c.fillStyle = col; c.fillRect(X(x), Y(y + hh), ww * s, hh * s); },
    ctx: c,
  };
  // a few traces and vias, so the board does not look empty
  for (let i = 0; i < 26; i++) { const x = 3 + Math.random() * (W - 6), y = 3 + Math.random() * (H - 6); P.trace([[x, y], [x + (Math.random() - 0.5) * 12, y], [x + (Math.random() - 0.5) * 12, y + (Math.random() - 0.5) * 8]], 0.18); }
  for (let i = 0; i < 18; i++) { const x = 3 + Math.random() * (W - 6), y = 3 + Math.random() * (H - 6); P.pad(x, y, 0.3, 0, true); c.fillStyle = '#151515'; c.beginPath(); c.arc(X(x), Y(y), 0.13 * s, 0, 7); c.fill(); }
  draw(P);
  c.strokeStyle = 'rgba(5,10,20,0.6)'; c.lineWidth = 0.35 * s; c.strokeRect(0, 0, w, h);
  return { map: tex(C), rough: tex(R, false) };
}
// the board itself: an outline (mm from its lower-left corner) with holes, printed on top
function pcbMesh(W, H, outline, holes, T, cx, cz, y, t = 1.6) {
  const sh = new THREE.Shape(); outline.forEach(([x, yy], i) => (i ? sh.lineTo(x - W / 2, yy - H / 2) : sh.moveTo(x - W / 2, yy - H / 2)));
  for (const [x, yy, rr] of holes) { const p = new THREE.Path(); p.absarc(x - W / 2, yy - H / 2, rr || 1.6, 0, Math.PI * 2, true); sh.holes.push(p); }
  const eg = new THREE.ExtrudeGeometry(sh, { depth: t, bevelEnabled: false, curveSegments: 12 });
  const pos = eg.attributes.position, uv = eg.attributes.uv, nrm = eg.attributes.normal;
  for (let i = 0; i < pos.count; i++) if (Math.abs(nrm.getZ(i)) > 0.9) uv.setXY(i, (pos.getX(i) + W / 2) / W, (pos.getY(i) + H / 2) / H);
  const top = new THREE.MeshStandardMaterial({ map: T.map, roughnessMap: T.rough, metalnessMap: T.rough, roughness: 1, metalness: 1 });
  const m = new THREE.Mesh(eg, [top, M().fr4]); m.rotation.x = -Math.PI / 2; m.position.set(cx, y, cz); m.userData.keep = true; m.name = 'pcb'; m.castShadow = true; m.receiveShadow = true;
  return m;
}
const rr = (w, h, r) => { const s = new THREE.Shape(); s.moveTo(-w / 2 + r, -h / 2); s.lineTo(w / 2 - r, -h / 2); s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r); s.lineTo(w / 2, h / 2 - r); s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2); s.lineTo(-w / 2 + r, h / 2); s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r); s.lineTo(-w / 2, -h / 2 + r); s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2); return s; };

// ------------------------------------------------------------------ small parts on a board
function tqfp(g, n, body, x, z, y, lines, rot = 0) { // a square flat chip with gull-wing legs on all four sides
  const grp = new THREE.Group(); grp.position.set(x, y, z); grp.rotation.y = rot;
  const lab = new THREE.MeshStandardMaterial({ map: TX.labelTexture(lines, { w: 256, h: 256, size: 26, dot: [0.15, 0.15] }), roughness: 0.6 });
  grp.add(box(body, 1.1, body, [M().epoxy, M().epoxy, lab, M().epoxy, M().epoxy, M().epoxy], 0, 0.75, 0));
  const per = n / 4, pitch = (body - 1.2) / (per - 1);
  for (let k = 0; k < 4; k++) for (let i = 0; i < per; i++) {
    const t = -body / 2 + 0.6 + i * pitch; const L = box(0.22, 0.18, 1.1, M().tin, 0, 0.2, 0);
    if (k === 0) L.position.set(t, 0.25, body / 2 + 0.45); if (k === 1) L.position.set(t, 0.25, -body / 2 - 0.45);
    if (k === 2) { L.rotation.y = Math.PI / 2; L.position.set(body / 2 + 0.45, 0.25, t); } if (k === 3) { L.rotation.y = Math.PI / 2; L.position.set(-body / 2 - 0.45, 0.25, t); }
    grp.add(L);
  }
  g.add(grp); return grp;
}
function soic(g, n, w, l, x, z, y, lines, rot = 0) { // a small-outline chip: legs on two sides
  const grp = new THREE.Group(); grp.position.set(x, y, z); grp.rotation.y = rot;
  const lab = new THREE.MeshStandardMaterial({ map: TX.labelTexture(lines, { w: 256, h: 128, size: 24, dot: [0.1, 0.25] }), roughness: 0.6 });
  grp.add(box(l, 1.5, w, [M().epoxy, M().epoxy, lab, M().epoxy, M().epoxy, M().epoxy], 0, 0.85, 0));
  const per = n / 2, pitch = 1.27;
  for (let i = 0; i < per; i++) for (const s of [-1, 1]) grp.add(box(0.4, 0.2, 1.2, M().tin, -((per - 1) * pitch) / 2 + i * pitch, 0.3, s * (w / 2 + 0.5)));
  g.add(grp); return grp;
}
function smd(g, x, z, y, rot, kind) { // an 0603 resistor or capacitor
  const w = rot ? 0.8 : 1.6, d = rot ? 1.6 : 0.8;
  g.add(box(w, 0.45, d, kind ? M().ceramic : M().smdR, x, y + 0.22, z));
  g.add(box(rot ? 0.82 : 0.3, 0.47, rot ? 0.3 : 0.82, M().tin, x - (rot ? 0 : 0.7), y + 0.23, z - (rot ? 0.7 : 0))); g.add(box(rot ? 0.82 : 0.3, 0.47, rot ? 0.3 : 0.82, M().tin, x + (rot ? 0 : 0.7), y + 0.23, z + (rot ? 0.7 : 0)));
}
function ledMat(col) { return new THREE.MeshStandardMaterial({ color: 0xf2efe0, roughness: 0.3, emissive: col, emissiveIntensity: 0, transparent: true, opacity: 0.92 }); }
function smdLed(g, leds, id, x, z, y, col, rot) { const m = ledMat(col); const b = box(rot ? 0.8 : 1.6, 0.6, rot ? 1.6 : 0.8, m, x, y + 0.3, z); b.userData.keep = true; g.add(b); leds[id] = m; }
function tact(g, x, z, y, w, d, capCol, name) { // an SMD push button: metal body, coloured cap
  g.add(box(w, 1.2, d, M().steel, x, y + 0.6, z)); g.add(box(w + 0.6, 0.3, 0.6, M().tin, x, y + 0.15, z - d / 2 - 0.2)); g.add(box(w + 0.6, 0.3, 0.6, M().tin, x, y + 0.15, z + d / 2 + 0.2));
  const cap = cyl(Math.min(w, d) * 0.32, 1.2, new THREE.MeshStandardMaterial({ color: capCol, roughness: 0.45 }), x, y + 1.8, z, 18); cap.userData.keep = true; if (name) cap.name = name; g.add(cap); return cap;
}
// male pins into the breadboard: the plastic spacer on the breadboard, the pin from the PCB down into the hole
function malePins(g, pins, pcbY, top) {
  const rows = {}; for (const p of pins) (rows[p.at[1]] || (rows[p.at[1]] = [])).push(p.at[0]);
  for (const [z, xs] of Object.entries(rows)) { const x0 = Math.min(...xs), x1 = Math.max(...xs); g.add(box(x1 - x0 + 2.54, 2.5, 2.5, M().black, (x0 + x1) / 2, pcbY - 1.25, +z)); }
  for (const p of pins) { g.add(box(0.64, pcbY - top + 6.2, 0.64, M().gold, p.at[0], (pcbY + top - 6.2) / 2 + 0.9 - 0.4, p.at[1])); g.add(cyl(0.75, 0.45, M().tin, p.at[0], pcbY + 1.6 + 0.22, p.at[1], 10, 0.45)); }
}
function pickGroup(def, top) {
  const pick = new THREE.Group(); pick.name = 'pick'; const pm = new THREE.MeshBasicMaterial({ visible: false });
  for (const r of def.regions) { const b = box(r.hw * 2, r.h, r.hd * 2, pm, r.at[0], top + r.h / 2, r.at[1]); b.userData.region = r.id; pick.add(b); }
  return pick;
}
function usbMicro(g, x, z, y, dir) { // micro-USB B, its mouth towards -x (dir -1) or +x
  const sh = rr(7.5, 2.7, 0.9); const eg = new THREE.ExtrudeGeometry(sh, { depth: 5.6, bevelEnabled: false, curveSegments: 6 });
  const m = new THREE.Mesh(eg, M().steel); m.rotation.y = dir < 0 ? Math.PI / 2 : -Math.PI / 2; m.position.set(x + dir * 2.8, y + 1.45, z); m.rotation.z = 0; g.add(m);
  g.add(box(0.3, 1.6, 6.2, M().darkIn, x + dir * 2.85, y + 1.45, z)); g.add(box(0.6, 0.4, 4.2, M().black, x + dir * 2.5, y + 1.2, z));
}

// ------------------------------------------------------------------ Nano
export function buildNano(def) {
  materials(); const g = new THREE.Group(); g.name = 'nano';
  const W = def.size[0], H = def.size[1], y = def.pcbY, top = y + def.pcbT; const parts = new THREE.Group(); g.add(parts);
  const T = pcbTextures(W, H, '#1d4f9e', (p) => {
    const ox = W / 2, oz = H / 2; // board mm = local + (ox, oz) with z flipped
    for (const q of def.pins) { const bx = q.at[0] + ox, by = oz - q.at[1]; p.ring(bx, by, 0.95, 0.5); p.silk(q.label, bx, by + (q.at[1] < 0 ? -1.75 : 1.75), 0.72, { rot: -Math.PI / 2, w: 600 }); }
    p.silk('NANO V3.0', ox + 12.4, oz + 0.2, 1.5, { w: 800 }); p.silk('DUET STEM', ox + 12.4, oz - 1.8, 0.9);
    p.silk('L', ox - 13.2, oz - 0.6, 0.85); p.silk('TX', ox - 13.4, oz + 3.8, 0.75); p.silk('RX', ox - 13.4, oz + 2.0, 0.75); p.silk('PWR', ox - 13.4, oz - 2.4, 0.7); p.silk('RST', ox - 6.4, oz - 1.0, 0.8);
    p.rect(ox - 1.6, oz - 5.6, 10.4, 10.4); p.silk('16MHz', ox - 6.6, oz + 5.5, 0.7);
    for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) p.ring(ox + 16.6 + j * 2.54, oz - 2.54 + i * 2.54, 0.8, 0.45); p.silk('ICSP', ox + 20.3, oz, 0.7, { rot: -Math.PI / 2 });
  });
  g.add(pcbMesh(W, H, [[0, 0], [W, 0], [W, H], [0, H]], [[1.27, 1.27, 0.85], [W - 1.27, 1.27, 0.85], [1.27, H - 1.27, 0.85], [W - 1.27, H - 1.27, 0.85]], T, 0, 0, y));
  malePins(parts, def.pins, y, BB.top);
  // mini-USB at the left end
  const us = new THREE.Group(); us.position.set(-20.6, top, 0);
  us.add(box(9.2, 3.9, 7.7, M().steel, 0, 1.95, 0)); us.add(box(0.3, 2.7, 6.4, M().darkIn, -4.62, 2.0, 0)); us.add(box(1.0, 1.0, 3.8, M().black, -4.2, 2.2, 0));
  parts.add(us);
  tqfp(parts, 32, 7, 3.5, -0.3, top, ['ATMEGA328P', 'AU 2431'], Math.PI / 4);
  const xs = new THREE.Shape(); xs.absarc(-2.6, 0, 1.6, Math.PI / 2, Math.PI * 1.5); xs.absarc(2.6, 0, 1.6, -Math.PI / 2, Math.PI / 2);
  const xm = new THREE.Mesh(new THREE.ExtrudeGeometry(xs, { depth: 1.3, bevelEnabled: true, bevelThickness: 0.2, bevelSize: 0.2, bevelSegments: 1, curveSegments: 10 }), M().steel); xm.rotation.x = -Math.PI / 2; xm.position.set(-6.6, top, -3.6); parts.add(xm);
  const rc = tact(parts, -6.4, 2.6, top, 4.2, 3.2, 0xe8e6de, 'resetCap'); g.add(rc); // (the cap moves when pressed: its own mesh)
  const leds = {}; smdLed(g, leds, 'TX', -11.6, 3.8, top, 0xffb020); smdLed(g, leds, 'RX', -11.6, 2.0, top, 0xffb020); smdLed(g, leds, 'L', -11.6, 0.4, top, 0xffa020); smdLed(g, leds, 'ON', -11.6, -2.4, top, 0x33ff55);
  for (const [x, z, r] of [[-8.8, 4.6, 0], [-1.8, 5.8, 1], [9.6, 4.2, 0], [9.6, -4.6, 0], [-2.2, -6.0, 1], [13.6, 0.2, 1], [-15.6, -4.4, 0]]) smd(parts, x, z, top, r, (x + z) % 2 > 0);
  shadows(parts); mergeStatic(parts); g.userData.leds = leds; g.userData.resetCap = rc;
  g.add(pickGroup(def, top));
  return g;
}

// ------------------------------------------------------------------ Mega 2560
export function buildMega(def) {
  materials(); const g = new THREE.Group(); g.name = 'mega';
  const W = def.size[0], H = def.size[1], top = def.pcbY + def.pcbT; const parts = new THREE.Group(); g.add(parts);
  const IN = 25.4;
  const T = pcbTextures(W, H, '#0d3a74', (p) => {
    const bx = (q) => q.at[0] + W / 2, by = (q) => H / 2 - q.at[1];
    for (const q of def.pins) p.ring(bx(q), by(q), 1.0, 0.5);
    for (const q of def.pins) {
      const x = bx(q), y = by(q); const lab = q.gpio !== undefined ? (q.gpio >= 54 ? 'A' + (q.gpio - 54) : (def.pwm.includes(q.gpio) ? '~' : '') + q.gpio) : q.label;
      if (q.hdr === 'dl' || q.hdr === 'dh' || q.hdr === 'cm') p.silk(lab, x, y - 3.7, q.gpio !== undefined ? 1.15 : 0.9, { rot: -Math.PI / 2, align: 'right' });
      else if (q.hdr === 'dd') p.silk(lab, x + (q.at[0] > 47 ? 2.3 : -2.3), y, 0.85, { align: q.at[0] > 47 ? 'left' : 'right', w: 600 });
      else if (q.label) p.silk(lab, x, y + 3.6, q.hdr === 'an' || q.hdr === 'ah' ? 1.15 : 0.9, { rot: -Math.PI / 2, align: 'left' });
    }
    p.silk('PWM', 1.6 * IN, 1.62 * IN - 0.6, 1.4); p.silk('COMMUNICATION', 3.09 * IN, 1.62 * IN - 0.6, 1.2); p.line(2.7 * IN, 1.62 * IN - 1.9, 3.48 * IN, 1.62 * IN - 1.9);
    p.silk('TX3 RX3 TX2 RX2 TX1 RX1 SDA SCL', 3.09 * IN, 1.62 * IN - 2.8, 0.62, { w: 600 });
    p.silk('POWER', 1.35 * IN, 0.44 * IN + 2.4, 1.4); p.silk('ANALOG IN', 2.7 * IN, 0.44 * IN + 2.4, 1.4);
    p.silk('MEGA 2560', 2.35 * IN, 1.28 * IN, 4.0, { w: 800 }); p.silk('DUET STEM · R3', 2.35 * IN, 1.28 * IN - 4.0, 1.6);
    p.silk('DIGITAL', 3.62 * IN, 1.05 * IN, 1.2, { rot: -Math.PI / 2 }); p.silk('RESET', 0.34 * IN, 1.9 * IN - 4.6, 0.95); p.silk('L', 1.2 * IN - 2.7, 1.78 * IN, 1.05);
    p.silk('ON', 3.25 * IN, 1.5 * IN, 1.0); p.silk('MADE IN INDIA', 0.75 * IN, 0.98 * IN, 0.9, { w: 600 }); p.silk('16MHz', 1.9 * IN, 1.62 * IN - 7.4, 0.9);
    p.rect(2.47 * IN - 8.6, 1.2 * IN - 9.6, 17.2, 17.2);
  });
  g.add(pcbMesh(W, H, def.outline, def.holes.map(([x, y]) => [x, y, 1.6]), T, 0, 0, def.pcbY));
  // female headers, like the Uno's: one top texture repeated per opening, so they merge
  const hdrs = {}; for (const q of def.pins) (hdrs[q.hdr] || (hdrs[q.hdr] = [])).push(q);
  const topM = new THREE.MeshStandardMaterial({ map: M().socket, roughness: 0.6 });
  for (const k in hdrs) {
    const L = hdrs[k];
    if (k === 'dd') { // the double row: two columns along z
      for (const cx of [...new Set(L.map((q) => q.at[0]))]) { const zs = L.filter((q) => q.at[0] === cx).map((q) => q.at[1]); const z0 = Math.min(...zs), z1 = Math.max(...zs); const b = box(2.54, def.hdrH, z1 - z0 + 2.54, [M().black, M().black, topM, M().black, M().black, M().black], cx, top + def.hdrH / 2, (z0 + z1) / 2); const uv = b.geometry.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setY(i, uv.getY(i) * zs.length); parts.add(b); }
      continue;
    }
    const xs = L.map((q) => q.at[0]); const x0 = Math.min(...xs), x1 = Math.max(...xs);
    const b = box(x1 - x0 + 2.54, def.hdrH, 2.54, [M().black, M().black, topM, M().black, M().black, M().black], (x0 + x1) / 2, top + def.hdrH / 2, L[0].at[1]);
    const uv = b.geometry.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setX(i, uv.getX(i) * L.length); parts.add(b);
  }
  const reg = (id) => def.regions.find((r) => r.id === id).at;
  tqfp(parts, 100, 14, ...reg('m_mcu'), top, ['ATMEGA2560', '16AU 2432']);
  const q = reg('m_usbchip'); parts.add(box(5, 0.9, 5, [M().epoxy, M().epoxy, new THREE.MeshStandardMaterial({ map: TX.labelTexture(['16U2', 'MU'], { w: 128, h: 128, size: 30, dot: [0.15, 0.15] }), roughness: 0.6 }), M().epoxy, M().epoxy, M().epoxy], q[0], top + 0.45, q[1]));
  const xt = reg('m_xtal'); const xs = new THREE.Shape(); xs.absarc(-3.4, 0, 2.3, Math.PI / 2, Math.PI * 1.5); xs.absarc(3.4, 0, 2.3, -Math.PI / 2, Math.PI / 2);
  const xm = new THREE.Mesh(new THREE.ExtrudeGeometry(xs, { depth: 3.5, bevelEnabled: true, bevelThickness: 0.3, bevelSize: 0.25, bevelSegments: 2, curveSegments: 12 }), M().steel); xm.rotation.x = -Math.PI / 2; xm.position.set(xt[0], top + 0.3, xt[1]); parts.add(xm);
  // ICSP headers (male 2 × 3)
  for (const [cx, cz] of [[45.2, 3.8], [-26.2, -20.3]]) { parts.add(box(5.08, 2.5, 7.62, M().black, cx, top + 1.25, cz)); for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) parts.add(box(0.64, 8.4, 0.64, M().gold, cx - 1.27 + j * 2.54, top + 3.4, cz - 2.54 + i * 2.54)); }
  // USB-B, jack, regulator, capacitors, reset
  const us = reg('m_usb'); parts.add(box(16, 10.9, 12, M().steel, us[0], top + 5.45, us[1])); parts.add(box(0.4, 7.6, 8.4, M().darkIn, us[0] - 8.0, top + 5.6, us[1])); parts.add(box(1.0, 3.0, 5.2, M().white, us[0] - 7.8, top + 5.0, us[1]));
  const jk = reg('m_jack'); parts.add(box(14.2, 11, 9, M().black, jk[0], top + 5.5, jk[1])); const hole = cyl(3.15, 0.5, M().darkIn, jk[0] - 7.1, top + 6.5, jk[1], 24); hole.rotation.z = Math.PI / 2; parts.add(hole);
  parts.add(box(6.5, 1.7, 3.5, M().epoxy, -36.3, top + 0.85, 14.7)); parts.add(box(3.0, 0.3, 2.2, M().tin, -36.3, top + 0.15, 11.3));
  const capTopM = new THREE.MeshStandardMaterial({ color: 0xbfc2c6, metalness: 1, roughness: 0.3 });
  for (const [cx, cz] of [[-31.5, 18.5], [-25.0, 18.5]]) { parts.add(box(6.6, 1.0, 6.6, M().black, cx, top + 0.5, cz)); parts.add(cyl(3.1, 5.0, M().alu, cx, top + 3.5, cz, 24)); parts.add(cyl(3.0, 0.08, capTopM, cx, top + 6.02, cz, 24)); }
  const rs = reg('m_reset'); parts.add(box(6.0, 3.0, 6.0, M().black, rs[0], top + 1.5, rs[1])); parts.add(box(6.2, 0.3, 6.2, M().steel, rs[0], top + 3.15, rs[1]));
  const rcap = cyl(1.75, 1.6, new THREE.MeshStandardMaterial({ color: 0x1c1c1e, roughness: 0.45 }), rs[0], top + 4.1, rs[1], 20); rcap.userData.keep = true; rcap.name = 'resetCap'; g.add(rcap);
  for (let i = 0; i < 22; i++) smd(parts, -20 + (i * 7.3) % 64, -14 + (i * 5.1) % 26, top, i % 2, i % 3 === 0);
  const leds = {}; smdLed(g, leds, 'L', -20.3, -18.5, top, 0xffa020); smdLed(g, leds, 'TX', -20.3, -12.7, top, 0xffb020); smdLed(g, leds, 'RX', -20.3, -10.2, top, 0xffb020); smdLed(g, leds, 'ON', 31.8, -12.7, top, 0x33ff55);
  shadows(parts); mergeStatic(parts); g.userData.leds = leds; g.userData.resetCap = rcap;
  g.add(pickGroup(def, top));
  return g;
}

// ------------------------------------------------------------------ ESP32 DevKit V1
function wroomTexture() { // the shield can's laser marking
  const C = canvas(512, 512), c = C.getContext('2d');
  const gr = c.createLinearGradient(0, 0, 512, 512); gr.addColorStop(0, '#d9dbde'); gr.addColorStop(0.5, '#c8cbcf'); gr.addColorStop(1, '#d4d6d9'); c.fillStyle = gr; c.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 1600; i++) { c.fillStyle = `rgba(${Math.random() > 0.5 ? 255 : 120},${Math.random() > 0.5 ? 255 : 120},${Math.random() > 0.5 ? 255 : 120},0.04)`; c.fillRect(Math.random() * 512, Math.random() * 512, 3, 1); }
  c.fillStyle = 'rgba(70,72,78,0.85)'; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.font = `700 46px ${FONT}`; c.fillText('ESP32-WROOM-32', 256, 150); c.font = `500 30px ${FONT}`; c.fillText('Wi-Fi · Bluetooth', 256, 215); c.fillText('4 MB FLASH · 240 MHz', 256, 262);
  c.font = `500 24px ${FONT}`; c.fillText('ESP32-D0WD  ·  2 CORES', 256, 330); c.fillText('MODULE  ·  DUET STEM', 256, 372);
  c.strokeStyle = 'rgba(70,72,78,0.5)'; c.lineWidth = 3; c.strokeRect(60, 100, 392, 310);
  return tex(C);
}
function antennaTexture() { // the PCB antenna: a gold meander on dark blue
  const C = canvas(256, 512), c = C.getContext('2d'); c.fillStyle = '#16233a'; c.fillRect(0, 0, 256, 512);
  c.strokeStyle = '#d8b765'; c.lineWidth = 14; c.lineCap = 'square'; c.beginPath(); c.moveTo(40, 470); c.lineTo(40, 80);
  for (let i = 0; i < 5; i++) { const y = 80 + i * 72; c.lineTo(210, y); c.lineTo(210, y + 36); c.lineTo(70, y + 36); c.lineTo(70, y + 72); }
  c.stroke(); c.fillStyle = 'rgba(255,255,255,0.75)'; c.font = `600 22px ${FONT}`; c.textAlign = 'center'; return tex(C);
}
export function buildESP32(def) {
  materials(); const g = new THREE.Group(); g.name = 'esp32';
  const W = def.size[0], H = def.size[1], y = def.pcbY, top = y + def.pcbT; const parts = new THREE.Group(); g.add(parts);
  const [x0, x1] = def.bb.pcb; const ox = -x0; // board mm x = local x + ox ; y = H/2 - local z
  const T = pcbTextures(W, H, '#18191c', (p) => {
    for (const q of def.pins) { const bx = q.at[0] + ox, by = H / 2 - q.at[1]; p.ring(bx, by, 0.95, 0.5); p.silk(q.label, bx, by + (q.at[1] < 0 ? -2.9 : 2.9), 0.82, { rot: -Math.PI / 2, w: 700 }); }
    p.silk('ESP32 DEVKIT V1', ox - 7.5, H / 2 - 4.6, 1.25, { w: 800 }); p.silk('DUET STEM', ox - 7.5, H / 2 + 4.0, 0.95);
    p.silk('EN', ox - 17.2, H / 2 + 5.4, 0.9); p.silk('BOOT', ox - 17.2, H / 2 - 5.4, 0.85);
    p.fill(ox + 4.0, H / 2 - 9.4, 25.5, 18.8, '#0b0c0e');
  });
  g.add(pcbMesh(W, H, [[0, 0], [W, 0], [W, H], [0, H]], [[2.4, 2.4, 1.5], [2.4, H - 2.4, 1.5], [W - 2.4, 2.4, 1.5], [W - 2.4, H - 2.4, 1.5]], T, (x0 + x1) / 2, 0, y));
  malePins(parts, def.pins, y, BB.top);
  // the WROOM module: its own little PCB, the shield can, the antenna end
  const mx0 = 4.0, mx1 = 29.5; parts.add(box(mx1 - mx0, 0.8, 18, M().fr4, (mx0 + mx1) / 2, top + 0.4, 0));
  for (let i = 0; i < 14; i++) for (const s of [-1, 1]) parts.add(box(0.9, 0.82, 0.5, M().gold, mx0 + 1.4 + i * 1.27, top + 0.41, s * 8.85));
  const canM = new THREE.MeshStandardMaterial({ map: wroomTexture(), metalness: 0.9, roughness: 0.33 });
  parts.add(box(18.0, 2.4, 17.2, [M().alu, M().alu, canM, M().alu, M().alu, M().alu], 13.6, top + 0.8 + 1.2, 0));
  const ant = new THREE.Mesh(new THREE.PlaneGeometry(6.0, 17.6), new THREE.MeshStandardMaterial({ map: antennaTexture(), roughness: 0.4, metalness: 0.3 })); ant.rotation.x = -Math.PI / 2; ant.rotation.z = Math.PI / 2; ant.position.set(26.45, top + 0.82, 0); parts.add(ant);
  usbMicro(parts, -21.2, 0, top, -1);
  soic(parts, 28, 5, 5, -11.4, 4.4, top, ['CP2102', 'USB-UART'], 0);
  parts.add(box(6.5, 1.6, 3.5, M().epoxy, -10.8, top + 0.8, -5.0)); parts.add(box(3.0, 0.3, 2.0, M().tin, -10.8, top + 0.15, -7.4)); for (let i = -1; i <= 1; i++) parts.add(box(0.7, 0.3, 1.6, M().tin, -10.8 + i * 2.3, top + 0.15, -2.6));
  const en = tact(parts, -17.2, -8.0, top, 3.6, 3.0, 0x1b1b1d, 'resetCap'); tact(parts, -17.2, 8.0, top, 3.6, 3.0, 0x1b1b1d);
  for (const [x, z, r] of [[-5.2, -3.0, 0], [-5.2, -0.8, 0], [-3.0, 8.4, 1], [-7.6, 8.0, 0], [0.8, -6.8, 1], [1.6, 6.2, 0], [-14.2, 0.2, 1], [-1.0, 1.8, 0]]) smd(parts, x, z, top, r, (x * z) % 2 > 0);
  const leds = {}; smdLed(g, leds, 'ON', -3.6, 3.6, top, 0xff2a10); smdLed(g, leds, 'L', -3.6, 5.6, top, 0x2a64ff); leds.TX = ledMat(0); leds.RX = ledMat(0);
  parts.remove(en); en.userData.keep = true; g.add(en);
  shadows(parts); mergeStatic(parts); g.userData.leds = leds; g.userData.resetCap = en;
  g.add(pickGroup(def, top));
  return g;
}
export function buildBoard4(def) { return def.id === 'nano' ? buildNano(def) : def.id === 'mega' ? buildMega(def) : def.id === 'esp32' ? buildESP32(def) : null; }

// ------------------------------------------------------------------ parts (parts4.js)
const P = 2.54;
function leg(x, y0, y1, z = 0, w = 0.5) { return box(w, y1 - y0, w, M().tin, x, (y0 + y1) / 2, z); }
export function buildBar10() { // the 10-segment bar graph: a black block with ten red windows
  materials(); const g = new THREE.Group(); const cx = 4.5 * P, cz = 1.5 * P;
  for (let i = 0; i < 10; i++) for (const z of [0, 3 * P]) g.add(leg(i * P, -6, 1.0, z, 0.5));
  const lab = TX.labelTexture(['LED BAR 10 · R'], { w: 256, h: 64, size: 18, bg: '#141414' });
  g.add(box(25.2, 7.5, 10.1, [M().black, M().black, M().black, M().black, new THREE.MeshStandardMaterial({ map: lab, roughness: 0.6 }), M().black], cx, 1.0 + 3.75, cz));
  const segs = [];
  for (let i = 0; i < 10; i++) {
    const m = new THREE.MeshStandardMaterial({ color: 0x5a0e08, roughness: 0.25, emissive: 0xff2a14, emissiveIntensity: 0 });
    const s = box(1.6, 0.12, 7.2, m, i * P, 8.56, cz); s.userData.keep = true; g.add(s); segs.push(m);
  }
  g.add(box(0.5, 0.1, 0.5, M().white, -0.8, 8.58, 0.6)); // the anode side's mark
  g.userData.segs = segs;
  g.userData.update = (p) => { const b = p.state.segB || []; let ch = false; segs.forEach((m, i) => { const v = Math.min(5, (b[i] || 0) * 4.2); if (Math.abs(m.emissiveIntensity - v) > 0.01) { m.emissiveIntensity = v; ch = true; } }); return ch; };
  shadows(g, true, false); return g;
}
export function buildSip10() { // the resistor network: a thin flat strip on eleven legs
  materials(); const g = new THREE.Group();
  for (let i = 0; i < 11; i++) { g.add(leg(i * P, -6, 1.2, 0, 0.5)); }
  const lab = TX.labelTexture(['A221J  10 × 220 Ω'], { w: 512, h: 64, size: 30, bg: '#1d1d1f', ink: 'rgba(235,235,230,0.9)' });
  const lm = new THREE.MeshStandardMaterial({ map: lab, roughness: 0.55 });
  g.add(box(28.4, 5.0, 2.4, [M().epoxy, M().epoxy, M().epoxy, M().epoxy, lm, lm], 5 * P, 1.2 + 2.5, 0));
  const dot = cyl(0.45, 0.1, M().white, -0.2, 5.0, 1.21, 10); dot.rotation.x = Math.PI / 2; g.add(dot); // the dot for pin 1
  shadows(g, true, false); return g;
}
export function buildTouch4() { // the touch plate: copper on a small stand, one header pin at the front
  materials(); const g = new THREE.Group();
  g.add(box(36, 3.2, 40, new THREE.MeshStandardMaterial({ color: 0xc8a070, roughness: 0.75 }), 0, 1.6, -22));
  g.add(box(34, 1.6, 34, M().fr4, 0, 3.2 + 0.8, -24));
  const cu = new THREE.MeshStandardMaterial({ color: 0xd48a5a, metalness: 1, roughness: 0.34 });
  const pad = box(30, 0.2, 30, cu, 0, 4.9, -24); pad.userData.keep = true; pad.userData.role = 'cap'; pad.name = 'pad'; g.add(pad);
  g.add(box(2.6, 2.6, 2.6, M().black, 0, 4.0 + 1.3, -3.5)); g.add(box(0.64, 8, 0.64, M().gold, 0, 6.5, 0)); g.add(box(4, 0.1, 4, M().tin, 0, 4.9, -6));
  g.userData.pad = pad;
  g.userData.update = (p) => { const y = p.state.pressed ? 4.75 : 4.9; if (pad.position.y !== y) { pad.position.y = y; pad.material.emissive = new THREE.Color(p.state.pressed ? 0x2a1608 : 0); return true; } return false; };
  shadows(g); return g;
}
export function buildMagnet4() { // a bar magnet held over the ESP32's module, pole down; it moves with the distance
  materials(); const g = new THREE.Group();
  const hold = new THREE.Group(); hold.userData.keep = true; g.add(hold);
  const red = new THREE.MeshStandardMaterial({ color: 0xc62a20, roughness: 0.45 }), blue = new THREE.MeshStandardMaterial({ color: 0x2452b8, roughness: 0.45 });
  const lo = box(10, 20, 6, red, 0, 10, 0), hi = box(10, 20, 6, blue, 0, 30, 0); hold.add(lo); hold.add(hi);
  lo.userData.role = 'knob'; hi.userData.role = 'cap'; // drag the lower half to move it, press the top to turn it over (main.js, xrui.js)
  const mk = (txt) => new THREE.MeshBasicMaterial({ map: TX.labelTexture([txt], { w: 64, h: 64, size: 40, bg: 'rgba(0,0,0,0)', ink: '#ffffff' }), transparent: true });
  const nL = new THREE.Mesh(new THREE.PlaneGeometry(6, 6), mk('N')), sL = new THREE.Mesh(new THREE.PlaneGeometry(6, 6), mk('S')); nL.position.set(0, 10, 3.02); sL.position.set(0, 30, 3.02); hold.add(nL); hold.add(sL); nL.userData.role = 'knob'; sL.userData.role = 'cap'; // (a letter is its half: a tap on the N is a tap on the lower half)
  const line = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 1, 6), new THREE.MeshBasicMaterial({ color: 0x40e8ff, transparent: true, opacity: 0.7 })); g.add(line); line.userData.keep = true;
  // a lab clamp stand behind the breadboard holds it: base, rod, and an arm that slides up and down the rod
  const steel = M().steel, wood = new THREE.MeshStandardMaterial({ color: 0x6b4a2e, roughness: 0.7 });
  g.add(box(46, 5, 34, wood, 0, 2.5, -52)); g.add(cyl(2.6, 150, steel, 0, 75, -52, 16));
  const arm = new THREE.Group(); arm.userData.keep = true; g.add(arm);
  arm.add(box(9, 9, 9, M().black, 0, 0, -52)); const rod = cyl(1.8, 50, steel, 0, 0, -26, 12); rod.rotation.x = Math.PI / 2; arm.add(rod); arm.add(box(14, 6, 10, M().black, 0, 0, -1));
  const base = 12 + 1.6 + 3.2; // the top of the module's can, over the breadboard
  const place = (p) => { const d = Math.max(0, p.state.dist); const flip = p.state.pole === 'S'; hold.position.y = base + d + (flip ? 40 : 0); hold.rotation.z = flip ? Math.PI : 0; line.scale.y = Math.max(0.01, d); line.position.y = base + d / 2; line.visible = d > 0.5; arm.position.y = base + d + 44; lo.userData.role = flip ? 'cap' : 'knob'; hi.userData.role = flip ? 'knob' : 'cap'; };
  g.userData.update = (p) => { const k = p.state.dist + p.state.pole; if (k === g.userData.k) return false; g.userData.k = k; place(p); return true; };
  shadows(g); return g;
}
export function buildPart4(part) {
  switch (part.type) {
    case 'bar10': return buildBar10();
    case 'sip10': return buildSip10();
    case 'touch4': return buildTouch4();
    case 'magnet4': { const g = buildMagnet4(); g.userData.update(part); return g; }
  }
  return null;
}
