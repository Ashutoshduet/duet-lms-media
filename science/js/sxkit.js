// DUET Science Lab 360, batch SX-CGM (chemistry, earth and weather, maths): the small pieces every scene of the batch
// shares. Most of them come from the earlier batches (hands-on knobs, carrying, the zoom bubble, signs); a few are new
// (painted-wood and glass materials, a lathe, a turning dial, a "press" button, a smooth time knob).
import * as THREE from 'three';
import { Item } from './apparatus.js';
import { clamp01, ease } from './mathlab2.js';
import { pushKnob } from './mathworld3.js';
import { liveSign } from './mathworld4.js';
import { slideKnob } from './mathworld5.js';
import { tag, animator, rnd, tex, noHit, stepNow, V, FONT } from './mathworld_j1.js';
import { mergeGeoms } from './bioworld1.js';
import { carry, zoneRings } from './bioworld4.js';
import { thing, zoomBubble, flyT, clock, spot, done1 } from './oceanworld1.js';
import { pullTab } from './mathworld.js';
import { BENCH_Y } from './room.js';
import { LITE } from './lite.js';
export { THREE, Item, clamp01, ease, pushKnob, liveSign, slideKnob, tag, animator, rnd, tex, noHit, stepNow, V, FONT, mergeGeoms, carry, zoneRings, thing, zoomBubble, flyT, clock, spot, done1, pullTab, BENCH_Y, LITE };

export const TAU = Math.PI * 2;
export const N3 = (en, hi, hg) => ({ en, hi, hg: hg || en });
export const lerp = (a, b, k) => a + (b - a) * k;
export const smooth = (a, b, x) => { const k = clamp01((x - a) / (b - a)); return k * k * (3 - 2 * k); };
const MATS = {};
// one material per look, made once (phones: every distinct material is a draw-state change, every new kind a shader)
export function mat(key, make) { return MATS[key] || (MATS[key] = make()); }
export const std = (c, r = 0.6, m = 0, o = {}) => mat(`s${c}|${r}|${m}|${o.map ? o.map.uuid : ''}|${o.op ?? ''}`, () => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m, ...(o.map ? { map: o.map } : {}), ...(o.op != null ? { transparent: true, opacity: o.op, depthWrite: false } : {}) }));
export const lam = (c, o = {}) => mat(`l${c}|${o.map ? o.map.uuid : ''}|${o.op ?? ''}|${o.side ?? ''}`, () => new THREE.MeshLambertMaterial({ color: c, ...(o.map ? { map: o.map } : {}), ...(o.op != null ? { transparent: true, opacity: o.op, depthWrite: false } : {}), side: o.side ?? THREE.FrontSide }));
export const steel = () => std(0xd2d6da, 0.25, 0.85);
export const brass = () => std(0xc9a050, 0.3, 0.85);
export const glassM = (op = 0.18) => mat('glass' + op, () => new THREE.MeshStandardMaterial({ color: 0xeef6fa, roughness: 0.05, metalness: 0, transparent: true, opacity: op, depthWrite: false, side: THREE.DoubleSide, envMapIntensity: 1.5 }));
export const glowM = (c, op = 1) => mat('glow' + c + op, () => new THREE.MeshBasicMaterial({ color: c, toneMapped: false, transparent: op < 1, opacity: op, depthWrite: op >= 1 }));
// wood: long grain lines on a base colour (seed: a different plank)
export const woodTex = (base = '#b5834f', seed = 3, rep) => tex(256, 256, (x) => { const r = rnd(seed); x.fillStyle = base; x.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 80; i++) { const y = r() * 256; x.strokeStyle = `rgba(70,40,15,${0.06 + r() * 0.16})`; x.lineWidth = 0.8 + r() * 2.6; x.beginPath(); x.moveTo(0, y); for (let k = 0; k <= 8; k++) x.lineTo(k * 32, y + Math.sin(k * 0.8 + i) * (1.5 + r() * 4)); x.stroke(); }
  for (let i = 0; i < 4; i++) { const cx = r() * 256, cy = r() * 256; x.strokeStyle = 'rgba(80,45,15,0.25)'; for (let k = 1; k < 5; k++) { x.beginPath(); x.ellipse(cx, cy, k * 4, k * 1.6, 0, 0, TAU); x.stroke(); } } }, rep);
export const lathe = (pts, m, seg = 32) => { const o = new THREE.Mesh(new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg), m); o.castShadow = true; o.receiveShadow = true; return o; };
export const box = (w, h, d, m, x = 0, y = 0, z = 0) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); o.castShadow = true; o.receiveShadow = true; return o; };
export const cyl = (r0, r1, h, m, seg = 24, x = 0, y = 0, z = 0) => { const o = new THREE.Mesh(new THREE.CylinderGeometry(r0, r1, h, seg), m); o.position.set(x, y, z); o.castShadow = true; o.receiveShadow = true; return o; };
export const sph = (r, m, x = 0, y = 0, z = 0, seg = 20) => { const o = new THREE.Mesh(new THREE.SphereGeometry(r, seg, Math.max(8, seg * 0.7 | 0)), m); o.position.set(x, y, z); o.castShadow = true; return o; };
// a rod between two points (a wire, a stick, a bond)
export function rodBetween(a, b, r, m, seg = 10) { const d = b.clone().sub(a), L = d.length(); const o = new THREE.Mesh(new THREE.CylinderGeometry(r, r, L, seg), m); o.position.copy(a).addScaledVector(d, 0.5); o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); return o; }
// a label that stays readable (a sprite): set(text, colour)
export function label(text, h = 0.03, col = '#ffffff') { const s = tag(text, col, h); return s; }
// a "Do it" for a knob that only works in its step: done() fires once per step it is used in
export function onceEach() { const f = new Set(); return (k, fn) => { if (f.has(k)) return false; f.add(k); fn && fn(); return true; }; }
// the camera per step (as in BW4): views[i] is used while step i is on
export const camBy = (it, app, views) => { const u0 = it.update; let last = -1; it.update = (dt, t) => { const i = app.runner.i; if (i !== last) { last = i; const v = views[Math.min(i, views.length - 1)]; if (v) it.camView = typeof v === 'function' ? v() : v; } if (u0) u0.call(it, dt, t); }; it.camView = views[0] || it.camView; };
// a button the student pushes (a knob on a short path; Do it presses it too)
export function button(knob, o) { pushKnob(knob, o); return knob; }
// a knob slid along a path that sets a value 0…1 (k), while active() — returns sync()
export function slider(knob, o) { return slideKnob(knob, o); }
// texture from a file in models/sx (WebP), sRGB, cached
const TL = new THREE.TextureLoader(); const FT = {};
export function fileTex(name, o = {}) { const k = name + (o.rep ? o.rep.join('x') : ''); if (FT[k]) return FT[k]; const t = TL.load('models/sx/' + name); t.colorSpace = o.linear ? THREE.NoColorSpace : THREE.SRGBColorSpace; t.anisotropy = 4; if (o.rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(o.rep[0], o.rep[1]); } return (FT[k] = t); }
// a GLB from models/sx (meshopt), cached; returns a group that fills in when it has loaded
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
const GL = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder); const GC = {};
export function sxModel(name) { return GC[name] || (GC[name] = GL.loadAsync('models/sx/' + name + '.glb')); }
// a loaded scan scaled to a real size (longest side, metres), sitting on y = 0, centred; cb(group) when ready
export function scan(name, size, o = {}) {
  const g = new THREE.Group(); g.userData.ready = false;
  sxModel(name).then((gl) => { const m = gl.scene.clone(true); const b = new THREE.Box3().setFromObject(m); const s = b.getSize(new THREE.Vector3()); const k = size / Math.max(s.x, s.y, s.z);
    m.scale.setScalar(k); const c = b.getCenter(new THREE.Vector3()); m.position.set(-c.x * k, -b.min.y * k, -c.z * k);
    m.traverse((x) => { if (x.isMesh) { x.castShadow = !LITE; x.receiveShadow = true; if (o.noHit !== false) x.userData.noHit = true; if (o.rough != null) { x.material = x.material.clone(); x.material.roughness = o.rough; x.material.metalness = 0; } } });
    g.add(m); g.userData.ready = true; g.userData.dims = s.multiplyScalar(k); if (o.onLoad) o.onLoad(g, m); }).catch((e) => console.warn('sx model', name, e));
  return g;
}
// the lab stocks its shelf with six reagent bottles when nothing stands above the bench; these activities do not need
// them (fewer draw calls on phones): an empty, invisible item up high tells the lab the shelf is in use
export function noShelf(K) { const it = new Item('sxnoshelf', { name: N3('', '', '') }); it.noGrab = true; it.noPhys = true; it.g.visible = false; return K.add(it, 1.5, -1.3, { y: BENCH_Y + 0.4 }); }
