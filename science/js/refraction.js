// Physics: refraction on a drawing board. A soft board with a white sheet (what is drawn on it stays), drawing pins,
// a rectangular glass slab and a triangular glass prism, and a protractor. The pencil lines, the pins and the angles follow
// Snell's law (n = 1.5 for glass), so the angles a student measures are the real ones.
import * as THREE from 'three';
import { Item } from './apparatus.js';
import { glassMat, woodTex } from './mats.js';

const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const D = Math.PI / 180;
export const N_GLASS = 1.5;

// ------------------------------------------------------------------ board + paper. Paper coordinates are in metres, origin at the centre, +u to the right, +v away from the student
export function drawingBoard(o = {}) {
  const W = o.w ?? 0.34, H = o.h ?? 0.26; const PX = 3200; // pixels per metre on the sheet
  const it = new Item('board', { ...o, name: o.name || { en: 'Drawing board with a white sheet', hi: 'सफ़ेद कागज़ लगा ड्रॉइंग बोर्ड', hg: 'White sheet laga drawing board' } });
  const base = new THREE.Mesh(new THREE.BoxGeometry(W + 0.04, 0.012, H + 0.04), new THREE.MeshStandardMaterial({ map: woodTex('#b98a55'), roughness: 0.7 })); base.position.y = 0.006; it.g.add(base);
  const c = document.createElement('canvas'); c.width = Math.round(W * PX); c.height = Math.round(H * PX); const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const paper = new THREE.Mesh(new THREE.PlaneGeometry(W, H), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95 })); paper.rotation.x = -Math.PI / 2; paper.position.y = 0.0123; it.g.add(paper);
  const x = c.getContext('2d'); const P = (u, v) => [c.width / 2 + u * PX, c.height / 2 - v * PX];
  const clear = () => { x.fillStyle = '#fbfaf6'; x.fillRect(0, 0, c.width, c.height); tex.needsUpdate = true; }; clear();
  for (const [s, t] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.002, 12), new THREE.MeshStandardMaterial({ color: 0xc9a24a, metalness: 0.8, roughness: 0.3 })); pin.position.set(s * (W / 2 - 0.01), 0.0135, t * (H / 2 - 0.01)); it.g.add(pin); }
  it.W = W; it.H = H; it.surfY = 0.0125;
  it.line = (a, b, o2 = {}) => { x.save(); x.strokeStyle = o2.col || '#3a3a3a'; x.lineWidth = o2.w || 2.2; if (o2.dash) x.setLineDash([14, 10]); x.beginPath(); x.moveTo(...P(a[0], a[1])); x.lineTo(...P(b[0], b[1])); x.stroke(); x.restore(); tex.needsUpdate = true; };
  it.poly = (pts, o2 = {}) => { x.save(); x.strokeStyle = o2.col || '#3a3a3a'; x.lineWidth = o2.w || 2.4; x.beginPath(); pts.forEach((p, i) => (i ? x.lineTo(...P(p[0], p[1])) : x.moveTo(...P(p[0], p[1])))); x.closePath(); x.stroke(); x.restore(); tex.needsUpdate = true; };
  it.dot = (p, txt, o2 = {}) => { x.save(); x.fillStyle = o2.col || '#1d1d1d'; const [px, py] = P(p[0], p[1]); x.beginPath(); x.arc(px, py, 5, 0, 6.29); x.fill(); if (txt) { x.font = '600 34px sans-serif'; x.fillText(txt, px + (o2.dx ?? 10), py + (o2.dy ?? -10)); } x.restore(); tex.needsUpdate = true; };
  it.text = (p, txt, o2 = {}) => { x.save(); x.fillStyle = o2.col || '#1d4f9a'; x.font = `600 ${o2.size || 32}px sans-serif`; const [px, py] = P(p[0], p[1]); x.fillText(txt, px, py); x.restore(); tex.needsUpdate = true; };
  it.arc = (c0, r, a0, a1, txt, o2 = {}) => { x.save(); x.strokeStyle = o2.col || '#1d4f9a'; x.lineWidth = 2; const [px, py] = P(c0[0], c0[1]); x.beginPath(); x.arc(px, py, r * PX, -a0, -a1, a1 > a0); x.stroke(); if (txt) { const am = (a0 + a1) / 2; x.fillStyle = o2.col || '#1d4f9a'; x.font = '600 30px sans-serif'; x.fillText(txt, px + Math.cos(am) * (r * PX + 14) - 10, py - Math.sin(am) * (r * PX + 14) + 10); } x.restore(); tex.needsUpdate = true; };
  it.clear = clear; it.toLocal = (u, v) => V3(u, it.surfY, -v); // paper point → board local
  it.height = 0.014; it.radius = Math.max(W, H) / 2; it.grabY = 0.006; it.noGrab = true; return it;
}
// ------------------------------------------------------------------ a drawing pin with a coloured head
export function pinItem(col = 0xc0392b, o = {}) {
  const it = new Item('pin', { ...o, name: o.name || { en: 'Pin', hi: 'पिन', hg: 'Pin' } });
  const sh = new THREE.Mesh(new THREE.CylinderGeometry(0.0004, 0.0004, 0.03, 6), new THREE.MeshStandardMaterial({ color: 0xc8ccd0, metalness: 0.9, roughness: 0.25 })); sh.position.y = 0.015; it.g.add(sh);
  const hd = new THREE.Mesh(new THREE.SphereGeometry(0.0022, 14, 10), new THREE.MeshStandardMaterial({ color: col, roughness: 0.35 })); hd.position.y = 0.031; it.g.add(hd);
  it.height = 0.034; it.radius = 0.003; it.grabY = 0.03; return it;
}
// ------------------------------------------------------------------ glass slab (7.5 cm × 5 cm × 1.5 cm) and glass prism (60°, sides 5 cm, 2.5 cm high)
export function glassSlab(o = {}) {
  const it = new Item('slab', { ...o, name: o.name || { en: 'Rectangular glass slab', hi: 'काँच का आयताकार स्लैब', hg: 'Rectangular glass slab' } });
  const w = o.w ?? 0.075, d = o.d ?? 0.05, h = 0.015; const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), glassMat({ opacity: 0.28, edge: 0.9 })); m.position.y = h / 2; m.renderOrder = 6; it.g.add(m);
  const e = new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry), new THREE.LineBasicMaterial({ color: 0x9fd8e8, transparent: true, opacity: 0.8 })); e.position.y = h / 2; it.g.add(e);
  it.w = w; it.d = d; it.height = h; it.radius = w / 2; it.grabY = h / 2; return it;
}
export function glassPrism(o = {}) {
  const it = new Item('prism', { ...o, name: o.name || { en: 'Glass prism (60°)', hi: 'काँच का प्रिज़्म (60°)', hg: 'Glass prism (60°)' } });
  const s = o.side ?? 0.05, h = 0.025; const sh = new THREE.Shape(); const r = s / Math.sqrt(3); const pts = [0, 1, 2].map((i) => [Math.cos(Math.PI / 2 + i * 2 * Math.PI / 3) * r, Math.sin(Math.PI / 2 + i * 2 * Math.PI / 3) * r]);
  sh.moveTo(pts[0][0], pts[0][1]); sh.lineTo(pts[1][0], pts[1][1]); sh.lineTo(pts[2][0], pts[2][1]); sh.closePath();
  const g = new THREE.ExtrudeGeometry(sh, { depth: h, bevelEnabled: false }); g.rotateX(-Math.PI / 2); const m = new THREE.Mesh(g, glassMat({ opacity: 0.3, edge: 0.9 })); m.renderOrder = 6; it.g.add(m);
  const e = new THREE.LineSegments(new THREE.EdgesGeometry(g), new THREE.LineBasicMaterial({ color: 0x9fd8e8, transparent: true, opacity: 0.8 })); it.g.add(e);
  it.corners = pts.map(([px, py]) => [px, py]); // in the board's paper coordinates when the prism sits at the paper origin (apex towards +v)
  it.side = s; it.height = h; it.radius = s / 2; it.grabY = h / 2; return it;
}
// ------------------------------------------------------------------ geometry on the sheet (2D, paper coordinates)
const sub = (a, b) => [a[0] - b[0], a[1] - b[1]], add = (a, b) => [a[0] + b[0], a[1] + b[1]], mul = (a, k) => [a[0] * k, a[1] * k], dot = (a, b) => a[0] * b[0] + a[1] * b[1];
const norm = (a) => { const l = Math.hypot(a[0], a[1]); return [a[0] / l, a[1] / l]; };
// refract direction d at a surface with unit normal nrm (pointing towards the incoming side), from index n1 into n2; null = total internal reflection
export function refract(d, nrm, n1, n2) { const c = -dot(nrm, d); const r = n1 / n2; const k = 1 - r * r * (1 - c * c); if (k < 0) return null; return norm(add(mul(d, r), mul(nrm, r * c - Math.sqrt(k)))); }
// a ray from p in direction d hits a segment a–b: returns the point and the distance, or null
export function hit(p, d, a, b) { const e = sub(b, a); const den = d[0] * e[1] - d[1] * e[0]; if (Math.abs(den) < 1e-9) return null; const w = sub(a, p); const t = (w[0] * e[1] - w[1] * e[0]) / den, s = (w[0] * d[1] - w[1] * d[0]) / den; if (t < 1e-6 || s < 0 || s > 1) return null; return { p: add(p, mul(d, t)), t }; }
// trace a ray through a convex glass polygon (corners in order): entry point, inside path, exit point, emergent direction
export function traceThrough(poly, p, d, nG = N_GLASS) {
  let best = null; for (let i = 0; i < poly.length; i++) { const h = hit(p, d, poly[i], poly[(i + 1) % poly.length]); if (h && (!best || h.t < best.t)) best = { ...h, i }; }
  if (!best) return null; const e1 = sub(poly[(best.i + 1) % poly.length], poly[best.i]); let n1 = norm([-e1[1], e1[0]]); if (dot(n1, d) > 0) n1 = mul(n1, -1);
  const din = refract(d, n1, 1, nG); let ex = null; for (let i = 0; i < poly.length; i++) { if (i === best.i) continue; const h = hit(best.p, din, poly[i], poly[(i + 1) % poly.length]); if (h && (!ex || h.t < ex.t)) ex = { ...h, i }; }
  if (!ex) return null;
  const e2 = sub(poly[(ex.i + 1) % poly.length], poly[ex.i]); let n2 = norm([-e2[1], e2[0]]); if (dot(n2, din) > 0) n2 = mul(n2, -1); const dout = refract(din, n2, nG, 1);
  const ang = (a, b) => Math.acos(Math.min(1, Math.abs(dot(a, b)))) / D;
  return { E: best.p, F: ex.p, din, dout, nIn: n1, nOut: n2, i: ang(d, n1), r: ang(din, n1), r2: ang(din, n2), e: dout ? ang(dout, n2) : null };
}
export { sub, add, mul, dot, norm, D };
// ------------------------------------------------------------------ a pencil (its tip is the item's origin) and a protractor lying on the sheet
export function pencil(o = {}) {
  const it = new Item('pencil', { ...o, name: o.name || { en: 'Pencil', hi: 'पेंसिल', hg: 'Pencil' } });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.0035, 0.0035, 0.13, 6), new THREE.MeshStandardMaterial({ color: 0xe0a32a, roughness: 0.6 })); body.position.y = 0.012 + 0.065; it.g.add(body);
  const cone = new THREE.Mesh(new THREE.ConeGeometry(0.0035, 0.012, 6), new THREE.MeshStandardMaterial({ color: 0xe8c9a0, roughness: 0.8 })); cone.rotation.x = Math.PI; cone.position.y = 0.006; it.g.add(cone);
  const lead = new THREE.Mesh(new THREE.ConeGeometry(0.0011, 0.004, 6), new THREE.MeshStandardMaterial({ color: 0x222222 })); lead.rotation.x = Math.PI; lead.position.y = 0.002; it.g.add(lead);
  it.height = 0.145; it.radius = 0.004; it.grabY = 0.08; it.layH = 0.0035; return it;
}
export function protractor(o = {}) {
  const it = new Item('protractor', { ...o, name: o.name || { en: 'Protractor', hi: 'चाँदा', hg: 'Protractor (chanda)' } });
  const R = 0.05; const c = document.createElement('canvas'); c.width = 512; c.height = 256; const x = c.getContext('2d'); x.clearRect(0, 0, 512, 256); x.fillStyle = 'rgba(200,230,255,0.35)'; x.beginPath(); x.arc(256, 250, 250, Math.PI, 0); x.fill();
  x.strokeStyle = '#123'; x.fillStyle = '#123'; x.font = '600 20px sans-serif'; x.textAlign = 'center'; for (let a = 0; a <= 180; a++) { const q = Math.PI + (a * Math.PI) / 180; const L = a % 10 === 0 ? 26 : a % 5 === 0 ? 18 : 10; x.lineWidth = a % 10 ? 1 : 2; x.beginPath(); x.moveTo(256 + Math.cos(q) * 248, 250 + Math.sin(q) * 248); x.lineTo(256 + Math.cos(q) * (248 - L), 250 + Math.sin(q) * (248 - L)); x.stroke(); if (a % 20 === 0) x.fillText(String(a), 256 + Math.cos(q) * 200, 256 + Math.sin(q) * 200); }
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(new THREE.CircleGeometry(R, 48, 0, Math.PI), new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: 0.2, side: THREE.DoubleSide, depthWrite: false })); m.rotation.x = -Math.PI / 2; m.position.y = 0.0008; m.renderOrder = 8;
  const uv = m.geometry.attributes.uv; const pp = m.geometry.attributes.position; for (let i = 0; i < pp.count; i++) uv.setXY(i, 0.5 + pp.getX(i) / (2 * R), pp.getY(i) / R * 0.98); it.g.add(m);
  it.height = 0.002; it.radius = R; it.grabY = 0.001; return it;
}
