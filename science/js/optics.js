// Physics: light. An optical bench (metre scale on stands) with a candle, convex / concave lenses, concave / convex mirrors
// and a white screen. The screen shows the real image the way it really looks: inverted, the right size for the lens or
// mirror formula, sharp only at the image distance and blurred elsewhere, dimmer when it is larger.
import * as THREE from 'three';
import { Item } from './apparatus.js';
import { glassMat, canvasTex, woodTex } from './mats.js';

const V2 = (r, y) => new THREE.Vector2(r, y);
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const tmp = new THREE.Vector3();
const steel = (c = 0x9aa0a6, r = 0.35) => new THREE.MeshStandardMaterial({ color: c, metalness: 0.85, roughness: r });
const AXIS_Y = 0.16; // height of the optical axis above the bench

// ------------------------------------------------------------------ the bench: a 1 m wooden scale (in cm) on two feet
export function opticalBench(len = 1.0, o = {}) {
  const it = new Item('obench', { ...o, name: o.name || { en: 'Optical bench (metre scale)', hi: 'प्रकाशीय बेंच (मीटर पैमाना)', hg: 'Optical bench (metre scale)' } });
  const tex = canvasTex(4096, 128, (x, w, h) => { x.fillStyle = '#e9dcb4'; x.fillRect(0, 0, w, h); x.fillStyle = '#1d1d1d'; x.font = '600 44px sans-serif';
    const n = Math.round(len * 1000); for (let mm = 0; mm <= n; mm++) { const px = 8 + (mm / n) * (w - 16); const L = mm % 100 === 0 ? 90 : mm % 10 === 0 ? 64 : mm % 5 === 0 ? 44 : 26; x.fillRect(px - (mm % 10 === 0 ? 1.5 : 0.8), 0, mm % 10 === 0 ? 3 : 1.6, L); if (mm % 50 === 0) { const t = String(mm / 10); x.fillText(t, px - x.measureText(t).width / 2, 124); } } });
  const top = new THREE.Mesh(new THREE.BoxGeometry(len + 0.02, 0.012, 0.05), [woodM(), woodM(), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6 }), woodM(), woodM(), woodM()]);
  top.position.y = 0.032; it.g.add(top);
  for (const sx of [-1, 1]) { const f = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.026, 0.12), steel(0x2c3036, 0.5)); f.position.set(sx * (len / 2 - 0.04), 0.013, 0); it.g.add(f); }
  const W = len + 0.02, x0 = -W / 2 + (8 / 4096) * W, k = (W * (1 - 16 / 4096)) / (len * 100); // the scale marks: 0 cm at x0, k metres per cm
  it.len = len; it.top = 0.038; it.xAt = (cm) => x0 + cm * k; it.cmAt = (lx) => (lx - x0) / k; // local x of a scale reading, and back
  it.height = 0.04; it.radius = len / 2; it.grabY = 0.03; it.noGrab = true; return it;
}
function woodM() { return new THREE.MeshStandardMaterial({ map: woodTex('#8a5a33'), roughness: 0.7 }); }
// an upright holder that slides on the bench: a metal rod in a block with a pointer at the scale
function rider(it, h) {
  const blk = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.02, 0.06), steel(0x3a3f46, 0.5)); blk.position.y = 0.01; it.g.add(blk);
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, h, 10), steel()); rod.position.y = 0.02 + h / 2; it.g.add(rod);
  const ptr = new THREE.Mesh(new THREE.ConeGeometry(0.003, 0.008, 3), new THREE.MeshBasicMaterial({ color: 0xc0392b })); ptr.rotation.x = Math.PI; ptr.position.set(0, 0.004, 0.03); it.g.add(ptr);
}
// ------------------------------------------------------------------ a thin lens in a ring holder (convex: f > 0, concave: f < 0)
export function lensOnStand(f = 0.15, o = {}) {
  const conv = f > 0; const R = 0.03; const t = conv ? 0.006 : 0.0015;
  const it = new Item('lens', { ...o, name: o.name || (conv ? { en: `Convex lens (f ≈ ${Math.round(f * 100)} cm)`, hi: `उत्तल लेंस (f ≈ ${Math.round(f * 100)} सेमी)`, hg: `Convex lens (f ≈ ${Math.round(f * 100)} cm)` } : { en: 'Concave lens', hi: 'अवतल लेंस', hg: 'Concave lens' }) });
  rider(it, AXIS_Y - 0.02 - R + 0.004);
  const pts = []; for (let i = 0; i <= 16; i++) { const r = (i / 16) * R; const sag = conv ? (t / 2) * (1 - (r / R) ** 2) + 0.0006 : 0.0006 + t * (r / R) ** 2; pts.push(V2(r, sag)); } for (let i = 16; i >= 0; i--) { const p = pts[i]; pts.push(V2(p.x, -p.y)); }
  const lens = new THREE.Mesh(new THREE.LatheGeometry(pts.map((p) => V2(p.x, p.y)).reverse(), 48), glassMat({ opacity: 0.32, edge: 0.6 })); lens.rotation.z = Math.PI / 2; lens.position.y = AXIS_Y; lens.renderOrder = 6; it.g.add(lens);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(R + 0.001, 0.0022, 8, 40), steel(0x2c3036, 0.4)); ring.rotation.y = Math.PI / 2; ring.position.y = AXIS_Y; it.g.add(ring);
  it.f = f; it.optic = 'lens'; it.aperture = R * 0.9; it.height = AXIS_Y + R; it.radius = 0.03; it.grabY = AXIS_Y; return it;
}
// ------------------------------------------------------------------ a spherical mirror in a holder; it faces -x (towards the candle on its left)
export function mirrorOnStand(f = -0.15, o = {}) {
  const conc = f < 0; const R = 0.03; const Rc = Math.abs(2 * f);
  const it = new Item('mirror', { ...o, name: o.name || (conc ? { en: `Concave mirror (f ≈ ${Math.round(-f * 100)} cm)`, hi: `अवतल दर्पण (f ≈ ${Math.round(-f * 100)} सेमी)`, hg: `Concave mirror (f ≈ ${Math.round(-f * 100)} cm)` } : { en: 'Convex mirror', hi: 'उत्तल दर्पण', hg: 'Convex mirror' }) });
  rider(it, AXIS_Y - 0.02 - R + 0.004);
  const a = Math.asin(R / Rc); const g = new THREE.SphereGeometry(Rc, 48, 12, 0, Math.PI * 2, 0, a); // a cap of a sphere
  const front = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: 0xe8eef2, metalness: 1, roughness: 0.06, side: conc ? THREE.BackSide : THREE.FrontSide }));
  const back = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: 0x3a3f46, metalness: 0.3, roughness: 0.6, side: conc ? THREE.FrontSide : THREE.BackSide }));
  const cap = new THREE.Group(); cap.add(front, back); cap.rotation.z = conc ? -Math.PI / 2 : Math.PI / 2; cap.position.set(conc ? -Rc : Rc, AXIS_Y, 0); it.g.add(cap); // the centre of curvature: in front of a concave mirror, behind a convex one
  it.f = f; it.optic = 'mirror'; it.aperture = R * 0.9; it.height = AXIS_Y + R; it.radius = 0.03; it.grabY = AXIS_Y; return it;
}
// ------------------------------------------------------------------ a white screen on a holder: the image is painted on it every frame
export function screenOnStand(o = {}) {
  const it = new Item('screen', { ...o, name: o.name || { en: 'White screen', hi: 'सफ़ेद पर्दा', hg: 'White screen' } });
  rider(it, AXIS_Y - 0.06);
  const W = 0.1, H = 0.08; const c = document.createElement('canvas'); c.width = 256; c.height = 205; const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const card = new THREE.Mesh(new THREE.BoxGeometry(0.002, H, W), [new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.25 }), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.25 }), ...[0, 0, 0, 0].map(() => new THREE.MeshStandardMaterial({ color: 0xe6e3da, roughness: 0.9 }))]);
  card.position.y = AXIS_Y; it.g.add(card); it.canvas = c; it.tex = tex; it.W = W; it.H = H; it.facing = -1; // the image is seen on the side facing -x
  it.paint = (img) => { const x = c.getContext('2d'); x.filter = 'none'; x.fillStyle = '#efece4'; x.fillRect(0, 0, c.width, c.height); if (img) img(x, c.width, c.height); tex.needsUpdate = true; };
  it.paint(null); it.height = AXIS_Y + H / 2; it.radius = 0.05; it.grabY = AXIS_Y;
  if (o.lift) { for (const ch of it.g.children) ch.position.y += o.lift; const st = new THREE.Mesh(new THREE.BoxGeometry(0.05, o.lift, 0.08), steel(0x3a3f46, 0.5)); st.position.y = o.lift / 2; it.g.add(st); it.height += o.lift; it.grabY += o.lift; } // stands on the table beside the bench, as high as the bench
  return it;
}
// ------------------------------------------------------------------ the image calculation (Cartesian sign convention, light goes along +x)
// object: { x (world), h (height of the flame, m), kind: 'flame' | 'window' (very far) }
export function lensImage(f, u) { if (!isFinite(u)) return { v: f, m: 0 }; const v = 1 / (1 / f + 1 / u); return { v, m: v / u }; } // 1/v - 1/u = 1/f
export function mirrorImage(f, u) { if (!isFinite(u)) return { v: f, m: 0 }; const v = 1 / (1 / f - 1 / u); return { v, m: -v / u }; } // 1/v + 1/u = 1/f
// paint the image on a screen: d = |screen distance - image distance|, how blurred; m: magnification (negative: inverted)
export function drawImage(x, w, h, o) {
  const px = w / o.W; const blur = Math.min(40, o.blurM * px); const cy = h / 2; const cx = w / 2;
  x.save(); x.filter = blur > 0.6 ? `blur(${blur.toFixed(1)}px)` : 'none';
  if (o.kind === 'window') { // a bright window with a dark cross bar, seen upside down
    const sw = Math.max(6, o.size * px), sh = sw * 1.3; x.globalAlpha = Math.min(1, o.bright); x.fillStyle = '#fffbe8'; x.fillRect(cx - sw / 2, cy - sh / 2, sw, sh); x.fillStyle = '#6b6252'; x.fillRect(cx - sw / 2, cy - sh * 0.05, sw, sh * 0.1); x.fillRect(cx - sw * 0.05, cy - sh / 2, sw * 0.1, sh);
    x.fillStyle = '#7a9a5a'; x.fillRect(cx - sw / 2, cy - sh / 2, sw, sh * 0.18); // trees outside appear at the bottom … of the inverted image they are at the top
  } else { // the candle flame: a bright teardrop, inverted for a real image
    const H0 = Math.abs(o.hi) * px; if (H0 < 0.5) { x.restore(); return; } const inv = o.hi < 0 ? -1 : 1; const base = cy - o.y0 * px; const top = cy - (o.y0 + o.hi) * px; // heights above the axis (o.y0: image of the flame's base, o.hi: image height; both negative when inverted)
    x.globalAlpha = Math.min(1, o.bright); const g = x.createLinearGradient(0, base, 0, top); g.addColorStop(0, '#ff8a1c'); g.addColorStop(0.35, '#ffd34d'); g.addColorStop(1, '#fff3c2');
    x.fillStyle = g; x.beginPath(); const wv = H0 * 0.32; x.moveTo(cx, top); x.bezierCurveTo(cx + wv, base - inv * H0 * 0.5, cx + wv * 0.8, base, cx, base); x.bezierCurveTo(cx - wv * 0.8, base, cx - wv, base - inv * H0 * 0.5, cx, top); x.fill();
    x.fillStyle = 'rgba(240,236,220,0.9)'; x.fillRect(cx - wv * 0.35, base, wv * 0.7, inv * Math.min(h, H0 * 1.6)); // the candle itself below the flame (above it when inverted)
  }
  x.restore();
}
// ------------------------------------------------------------------ solver: run every frame; paints each screen with what the optics put there
export class Optics {
  constructor(lab) { this.lab = lab; }
  update() {
    const items = this.lab.items; const screens = items.filter((i) => i.kind === 'screen'); if (!screens.length) return;
    const obj = items.find((i) => i.lightSource && (i.lit === undefined || i.lit)); const optics = items.filter((i) => i.optic);
    for (const s of screens) {
      const sx = s.g.position.x; let out = null;
      for (const L of optics) {
        const lx = L.g.position.x; if (Math.abs(L.g.position.z - s.g.position.z) > 0.08) continue;
        const ox = obj ? obj.g.position.x : -Infinity; const far = !obj || obj.far; const u = far ? -Infinity : ox - lx; // object on the left of the optic: u < 0
        let v, m, dist;
        if (L.optic === 'lens') { if (sx <= lx) continue; ({ v, m } = lensImage(L.f, u)); dist = sx - lx; if (v <= 0) continue; }
        else { if (sx >= lx) continue; ({ v, m } = mirrorImage(L.f, u)); dist = -(sx - lx); v = -v; if (v <= 0) continue; } // a real image of a mirror is in front of it (on the left)
        if (!isFinite(v) || v > 3) continue; // object at the focus: the rays come out parallel, no image anywhere
        const blurM = L.aperture * Math.abs(dist - v) / Math.max(0.01, v); const sharp = Math.max(0, 1 - Math.abs(dist - v) / Math.max(0.01, v) * 6);
        const hO = far ? 0 : obj.objH ?? 0.025; const y0 = far ? 0 : (obj.objY ?? 0) ; const size = far ? Math.abs(v) * 0.11 : 0; // the window across the room is seen at about 6°
        const bright = far ? 1 : Math.max(0.25, Math.min(1, 1.6 / Math.max(0.3, Math.abs(m)))) * Math.min(1, 0.6 + 0.4 * sharp);
        out = { kind: far ? 'window' : 'flame', blurM, hi: m * hO, y0: m * y0, size, bright, W: s.W, sharp, v, m };
      }
      s.img = out; s.sharp = out ? out.sharp : 0; const key = out ? `${out.kind}|${out.blurM.toFixed(4)}|${out.hi.toFixed(4)}|${out.bright.toFixed(2)}` : 'none';
      if (key !== s._key) { s._key = key; s.paint(out ? (x, w, h) => drawImage(x, w, h, out) : null); }
    }
  }
}
export { AXIS_Y };
void tmp; void V3;
