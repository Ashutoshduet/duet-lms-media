// DUET Science Lab 360, biology in real places, batch BW4: the ocean and animals. The student stands on the sand of a
// shallow coral reef, hangs in the open ocean in a submersible, or works by a village pond, in a forest, on a beach.
// The animals are real specimens scanned by museums and scientists (CC0 / CC BY; credited in models/eco/credits.json),
// reduced and re-textured for phones (devtools/BIOLOGY_WORLD.md). This file: the new models, the two underwater places
// (built in code: there is no open-licence underwater 360° photo), the one shared material that every BW4 mesh uses,
// the round zoom bubble, and three activities of the reef and the open sea.
//
// Phones (Snapdragon 680 / Adreno 610) have no parallel shader compiling and slow image-based light, so everything here
// is drawn with ONE material family: MeshLambertMaterial with a colour map and the same injected water code (water
// colour, light lost with depth, distance haze, sunlight caustics, a lamp, swimming and swaying), all switched by
// uniforms. Only skinned (the dolphin, shark, whale, turtle, gecko), instanced (fish shoals) and see-through (jellyfish)
// meshes need a variant. No light is added; the water's colour comes from the shader.
import * as THREE from 'three';
import { Item } from './apparatus.js';
import { clamp01, ease } from './mathlab2.js';
import { pushKnob } from './mathworld3.js';
import { liveSign } from './mathworld4.js';
import { slideKnob } from './mathworld5.js';
import { tag, animator, rnd, tex, noHit, stepNow, V, FONT } from './mathworld_j1.js';
import { ECO, ecoModel, ecoLoad, mergeGeoms } from './bioworld1.js';
import { carry, zoneRings } from './bioworld4.js';
import { PLACES } from './places.js';
import { LITE } from './lite.js';

const TAU = Math.PI * 2;
const N3 = (en, hi, hg) => ({ en, hi, hg: hg || en });
// a real-time step for the little animations (frame rates differ: 6 fps in a test browser, 90 in a headset)
export const clock = () => { let last = performance.now(); return () => { const t = performance.now(), d = Math.min(0.25, (t - last) / 1000); last = t; return d; }; };
// fly an item to a place in real time (as bioworld1's flyTo, but by the clock, not by frames)
export function flyT(it, to, yaw = 0, sec = 0.9, cb) {
  it.flying = true; const p0 = it.g.position.clone(), q0 = it.g.quaternion.clone(), q1 = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, yaw, 0)); let k = 0; const dt = clock();
  const lift = Math.max(0.15, (to.y - p0.y) * 0.3 + 0.15);
  const step = () => { k = Math.min(1, k + dt() / sec); const e = ease(k); it.g.position.lerpVectors(p0, to, e); it.g.position.y += Math.sin(e * Math.PI) * lift; it.g.quaternion.slerpQuaternions(q0, q1, e); if (k < 1) requestAnimationFrame(step); else { it.flying = false; if (cb) cb(); } };
  step();
}
export const done1 = (it, o) => { noHit(it.g); it.noGrab = true; it.noPhys = true; it.base = 0; Object.assign(it, o); return it; };
const lerp = (a, b, k) => a + (b - a) * k;
const ang = (x, z) => Math.atan2(-z, x);

// ------------------------------------------------------------------ the new models (real size, where the head points)
Object.assign(ECO, {
  sponge: { h: 0.3 }, braincoral: { len: 0.75 }, jellyfish: { h: 0.6 }, octopus: { len: 0.55, head: [1, 0] }, turban: { len: 0.1 },
  crab: { len: 0.32, head: [0, -1] }, starfish: { len: 0.22 }, brittlestar: { len: 0.3 },
  parrotfish: { len: 0.45, head: [-1, 0] }, puffer: { len: 0.2, head: [-1, 0] }, squid: { len: 0.45, head: [-1, 0] },
  lanternfish: { len: 0.12, head: [-1, 0] }, anglerfish: { len: 0.3, head: [-1, 0] }, halibut: { len: 0.45, head: [-1, 0] },
  dolphin: { len: 2.5, head: [0, 1], clip: 1 }, shark: { len: 1.6, head: [-1, 0], clip: 1 }, whale: { len: 14, head: [0, 1], clip: 1 },
  seaturtle: { len: 0.8, head: [0, 1], clip: 1 }, gecko: { len: 0.13, head: [0, 1], clip: 1 },
  tadpole: { len: 0.045, head: [-1, 0] }, stickinsect: { len: 0.14, head: [-1, 0] }, chameleon: { len: 0.6, head: [-1, 0] },
  braincoral_lo: { len: 0.75 }, pinkcoral_lo: { h: 0.42 }, redcoral_lo: { h: 0.5 }, fingercoral_lo: { h: 0.32 }, sardine_lo: { len: 0.2, head: [-1, 0] },
  frog_lo: { len: 0.11, head: [-1, 0] }, snail_lo: { len: 0.045, head: [0, 1] },
  duck: { h: 0.4, head: [1, 0.3] }, woodpecker: { h: 0.42, head: [1, 0] }, sparrow: { h: 0.19, head: [-1, 0] },
});

// ------------------------------------------------------------------ the water (shared uniforms)
// Light under water: each colour fades with the depth it has come down through (red first, blue last: k per metre),
// and things far away fade into the water's own colour. uBase: depth of the place's surface level below the real
// surface (0 on the reef; the submersible's depth in the open sea). uLamp: a white lamp at the eye.
export const UW = {
  uUwOn: { value: 0 }, uUwT: { value: 0 }, uUwCol: { value: new THREE.Color(0x0e5a74) }, uUwDens: { value: 0.07 },
  uUwAbs: { value: new THREE.Vector3(0.22, 0.05, 0.03) }, uUwBase: { value: 0 }, uUwSurf: { value: 3.2 }, uUwLight: { value: 1 }, uUwLamp: { value: 0 },
};
export function setWater(o = {}) {
  UW.uUwOn.value = o.on === false ? 0 : 1;
  if (o.col != null) UW.uUwCol.value.set(o.col); if (o.dens != null) UW.uUwDens.value = o.dens; if (o.abs) UW.uUwAbs.value.set(...o.abs);
  if (o.base != null) UW.uUwBase.value = o.base; if (o.surf != null) UW.uUwSurf.value = o.surf; if (o.light != null) UW.uUwLight.value = o.light; if (o.lamp != null) UW.uUwLamp.value = o.lamp;
}
export const dryLand = () => setWater({ on: false, lamp: 0, base: 0 });
const CAUS = `float uwCaustic(vec2 p, float t) { p *= 1.6; float c = 0.0;
  for (int i = 0; i < 2; i++) { vec2 q = p * (1.0 + float(i) * 0.7) + vec2(t * 0.3, -t * 0.25) * (1.0 + float(i));
    float a = sin(q.x + sin(q.y * 1.3 + t) * 1.1), b = sin(q.y + sin(q.x * 1.2 - t * 0.8) * 1.1); c += pow(max(0.0, 1.0 - abs(a + b) * 0.9), 5.0); }
  return c * 0.6; }`;
const UWDECL = 'uniform float uUwOn, uUwT, uUwDens, uUwBase, uUwSurf, uUwLight, uUwLamp; uniform vec3 uUwCol, uUwAbs;';
// the one material: Lambert + colour map + the water. sw: per-material motion (amp, k, mode 0 swim / 1 sway / 2 jelly),
// caus: sunlight caustics on what faces up (the sand, rocks)
const WHITE = (() => { const t = new THREE.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1); t.colorSpace = THREE.SRGBColorSpace; t.needsUpdate = true; return t; })();
export function lm(o = {}) {
  const m = new THREE.MeshLambertMaterial({ map: o.map || WHITE, color: o.color ?? 0xffffff, transparent: !!o.transparent, opacity: o.opacity ?? 1,
    side: o.side ?? THREE.FrontSide, depthWrite: o.depthWrite ?? !o.transparent, emissive: o.emissive ?? 0x000000 });
  const sw = m.userData.sw = { uSwAmp: { value: o.amp || 0 }, uSwT: { value: Math.random() * 10 }, uSwK: { value: o.k ?? 3 }, uSwMode: { value: o.mode || 0 },
    uSwAx: { value: new THREE.Vector2(1, 0) }, uSwC: { value: new THREE.Vector2() }, uSwHalf: { value: 1 }, uCaus: { value: o.caus || 0 }, uDry: { value: o.dry ? 1 : 0 } };
  m.userData.p = o;
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, UW, sw);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', `#include <common>\n${UWDECL}\nuniform float uSwAmp, uSwT, uSwK, uSwMode, uSwHalf; uniform vec2 uSwAx, uSwC; varying float vUwView; varying vec3 vUwW;`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        if (uSwAmp > 0.0) {
          #ifdef USE_INSTANCING
          float ph = dot(instanceMatrix[3].xyz, vec3(1.7, 2.3, 3.1));
          #else
          float ph = 0.0;
          #endif
          if (uSwMode < 0.5) { float s = dot(transformed.xz - uSwC, uSwAx) / uSwHalf; float tk = clamp((1.0 - s) * 0.5, 0.0, 1.2); transformed.xz += vec2(-uSwAx.y, uSwAx.x) * sin(s * uSwK - uSwT - ph) * uSwAmp * uSwHalf * tk * tk; }
          else if (uSwMode < 1.5) { float h = clamp(transformed.y / uSwHalf, 0.0, 1.0); transformed.xz += vec2(sin(uSwT + ph + transformed.x * 3.0 + transformed.z * 2.0), cos(uSwT * 0.8 + transformed.z * 3.0)) * uSwAmp * uSwHalf * h * h; }
          else { float h = clamp((transformed.y - uSwC.x) / uSwHalf, 0.0, 1.0); float bell = smoothstep(0.55, 1.0, h); transformed.xz *= 1.0 + uSwAmp * sin(uSwT) * bell;
            transformed.xz += vec2(sin(uSwT * 0.6 + transformed.y * 6.0), cos(uSwT * 0.5 + transformed.y * 5.0)) * uSwAmp * 0.25 * uSwHalf * (1.0 - bell); }
        }`)
      .replace('#include <project_vertex>', `#include <project_vertex>
        vUwView = -mvPosition.z;
        #ifdef USE_INSTANCING
        vUwW = (modelMatrix * instanceMatrix * vec4(transformed, 1.0)).xyz;
        #else
        vUwW = (modelMatrix * vec4(transformed, 1.0)).xyz;
        #endif`);
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>\n${UWDECL}\nuniform float uCaus, uDry; varying float vUwView; varying vec3 vUwW;\n${CAUS}`)
      .replace('#include <opaque_fragment>', `if (uUwOn > 0.5 && uDry < 0.5) {
          vec3 uwAtt = exp(-uUwAbs * max(0.0, uUwBase + uUwSurf - vUwW.y)) * uUwLight;
          vec3 uwUp = normalize((viewMatrix * vec4(0.0, 1.0, 0.0, 0.0)).xyz);
          float ca = uCaus > 0.0 ? uCaus * max(0.0, dot(normal, uwUp)) * uwCaustic(vUwW.xz, uUwT) : 0.0;
          outgoingLight = outgoingLight * uwAtt * (1.0 + ca) + diffuseColor.rgb * uUwLamp * exp(-0.3 * vUwView);
          vec3 wc = uUwCol * exp(-uUwAbs * max(0.0, uUwBase + uUwSurf - cameraPosition.y)) * uUwLight;
          outgoingLight = mix(outgoingLight, wc, 1.0 - exp(-uUwDens * vUwView));
        }
        #include <opaque_fragment>`);
  };
  m.customProgramCacheKey = () => 'bw4-uw-2';
  return m;
}
// a fresh copy (its own motion uniforms)
export const lmCopy = (m, o = {}) => lm({ ...(m.userData.p || {}), map: m.map, color: m.color.getHex(), ...o });
// put every mesh of a loaded scan on the shared material (one copy per original material, kept for all its clones)
const CONV = new Map();
function convOne(old, o) {
  if (!old) return old; if (old.userData.sw) return old;
  const see = old.transparent || (old.opacity ?? 1) < 1;
  const p = { map: old.map || null, color: old.color ? old.color.getHex() : 0xffffff, transparent: see, opacity: see ? Math.min(old.opacity ?? 1, o.opacity ?? 0.75) : 1, side: see ? THREE.DoubleSide : THREE.FrontSide, emissive: o.emissive ?? 0x000000 };
  if (o.tint != null) p.color = new THREE.Color(p.color).multiply(new THREE.Color(o.tint)).getHex();
  if (o.own) return lm({ ...p, ...(o.sw || {}) });
  const key = old.uuid + (o.tint ?? '') + (o.opacity ?? '') + (o.emissive ?? '');
  if (!CONV.has(key)) CONV.set(key, lm(p)); return CONV.get(key);
}
export function bw4ize(root, o = {}) {
  root.traverse((x) => { if (!x.isMesh) return; x.castShadow = !!o.shadow && !x.isSkinnedMesh && !x.isInstancedMesh; x.receiveShadow = true; if (o.hit) x.userData.noHit = false;
    x.material = Array.isArray(x.material) ? x.material.map((mt) => convOne(mt, o)) : convOne(x.material, o);
    if (o.sw) { // a swimmer: its body axis and length in its own file (where the head points: ECO.head)
      const gm = x.geometry; if (!gm.boundingBox) gm.computeBoundingBox(); const b = gm.boundingBox, hd = o.head || [1, 0], ax = new THREE.Vector2(hd[0], hd[1]).normalize();
      const c = new THREE.Vector3(); b.getCenter(c); const s = new THREE.Vector3(); b.getSize(s);
      for (const mt of [].concat(x.material)) { const u = mt.userData.sw; u.uSwAx.value.copy(ax); u.uSwC.value.set(c.x, c.z); u.uSwHalf.value = Math.max(1e-6, Math.abs(ax.x) * s.x + Math.abs(ax.y) * s.z) / 2;
        if (o.sw.mode === 2) { u.uSwC.value.set(b.min.y, 0); u.uSwHalf.value = s.y; } if (o.sw.mode === 1) u.uSwHalf.value = s.y; } } });
  return root;
}
// a scan on the shared material. o: ecoModel's options + shadow, tint, sw: { amp, k, mode } (swims: its own material),
// speed (swim beats per second)
export function oModel(name, o = {}) {
  const S = ECO[name] || {}; const sw = o.sw ? { amp: o.sw.amp ?? 0.12, k: o.sw.k ?? 3, mode: o.sw.mode || 0 } : null;
  const h = ecoModel(name, { ...o, onLoad: (hold, m) => { bw4ize(m, { ...o, own: !!sw, sw, head: S.head });
    hold.userData.mats = []; m.traverse((x) => { if (x.isMesh) for (const mt of [].concat(x.material)) hold.userData.mats.push(mt); }); if (o.onLoad) o.onLoad(hold, m); } });
  const t0 = h.tick; let ph = 0; h.swimRate = o.rate ?? 1.4;
  h.tick = (dt) => { t0(dt); if (sw && h.userData.mats) { ph += (dt || 0.016) * TAU * h.swimRate; for (const mt of h.userData.mats) mt.userData.sw.uSwT.value = ph; } };
  return h;
}

// ------------------------------------------------------------------ the underwater places (built in code)
let SAND = null;
const sandTex = () => SAND || (SAND = (() => { const t = new THREE.TextureLoader().load('models/eco/seabed_sand.webp'); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(14, 14); t.anisotropy = 4; return t; })());
// the water all round: deep blue below, the surface seen from underneath above (bright inside Snell's window,
// ~48.6° from straight up, a dim mirror of the water outside it), rippling, the sun's glare through it
function domeMat() {
  return new THREE.ShaderMaterial({ uniforms: UW, side: THREE.BackSide, depthWrite: false, toneMapped: true,
    vertexShader: 'varying vec3 vW; void main() { vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: `${UWDECL}\nvarying vec3 vW;\n${CAUS}
      void main() { vec3 d = normalize(vW - cameraPosition); float camd = max(0.0, uUwBase + uUwSurf - cameraPosition.y);
        vec3 wc = uUwCol * exp(-uUwAbs * camd) * uUwLight; vec3 col = wc * (0.45 + 0.55 * smoothstep(-0.7, 0.35, d.y));
        if (d.y > 0.01 && camd < 80.0) { float t = max(0.05, (uUwSurf - cameraPosition.y) / d.y); vec2 p = cameraPosition.xz + d.xz * t;
          float an = acos(clamp(d.y, 0.0, 1.0)), win = 1.0 - smoothstep(0.80, 0.86, an), rip = 0.6 + 0.4 * uwCaustic(p * 0.5, uUwT * 0.7);
          vec3 s = mix(wc * 1.3 * (0.8 + 0.25 * rip), vec3(0.72, 0.9, 1.0) * 1.7 * rip, win) * exp(-uUwAbs * camd);
          s += vec3(1.0, 0.97, 0.88) * pow(max(0.0, dot(d, normalize(vec3(0.25, 1.0, 0.18)))), 30.0) * 2.5 * exp(-uUwAbs * camd);
          col = mix(s, col, (1.0 - exp(-uUwDens * t)) * 0.8 + 0.2 * smoothstep(0.86, 1.4, an)); }
        gl_FragColor = vec4(col, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }` });
}
// marine snow: specks drifting in a box that travels with the eye (uDrift: the water moving past a descending diver)
export const SNOW = { uDrift: { value: 0 } };
function snowPoints(n) {
  const P = new Float32Array(n * 3), r = rnd(31); for (let i = 0; i < n; i++) { P[i * 3] = r() * 16; P[i * 3 + 1] = r() * 10; P[i * 3 + 2] = r() * 16; }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(P, 3));
  const m = new THREE.ShaderMaterial({ uniforms: { ...UW, ...SNOW }, transparent: true, depthWrite: false,
    vertexShader: `${UWDECL}\nuniform float uDrift; varying float vA; void main() { vec3 p = position + vec3(sin(uUwT * 0.3 + position.z) * 0.3, uUwT * 0.04 + uDrift, cos(uUwT * 0.2 + position.x) * 0.3);
      p = mod(p - cameraPosition + vec3(8.0, 5.0, 8.0), vec3(16.0, 10.0, 16.0)) - vec3(8.0, 5.0, 8.0) + cameraPosition;
      vec4 mv = viewMatrix * vec4(p, 1.0); gl_Position = projectionMatrix * mv; float dd = -mv.z; gl_PointSize = clamp(2.2 * 300.0 / max(dd, 0.3) * 0.02, 1.0, 5.0); vA = exp(-0.12 * dd) * (0.35 + 0.65 * uUwLight * exp(-uUwAbs.z * (uUwBase + uUwSurf - p.y))) + uUwLamp * exp(-0.6 * dd); }`,
    fragmentShader: 'varying float vA; void main() { vec2 c = gl_PointCoord - 0.5; float a = smoothstep(0.5, 0.15, length(c)) * vA * 0.7; gl_FragColor = vec4(vec3(0.85, 0.92, 0.95), a); }' });
  const pts = new THREE.Points(g, m); pts.frustumCulled = false; pts.renderOrder = 20; return pts;
}
// beams of sunlight slanting down through the water (not on phones)
function sunBeams() {
  const g = new THREE.Group(); const t = tex(32, 256, (x) => { const gr = x.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, 'rgba(255,255,255,0.5)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gr; x.fillRect(0, 0, 32, 256);
    const gr2 = x.createLinearGradient(0, 0, 32, 0); gr2.addColorStop(0, 'rgba(0,0,0,1)'); gr2.addColorStop(0.5, 'rgba(0,0,0,0)'); gr2.addColorStop(1, 'rgba(0,0,0,1)'); x.globalCompositeOperation = 'destination-out'; x.fillStyle = gr2; x.fillRect(0, 0, 32, 256); });
  const m = new THREE.MeshBasicMaterial({ map: t, color: 0xbfe6ff, transparent: true, opacity: 0.16, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, toneMapped: false }); const r = rnd(12);
  for (let i = 0; i < 6; i++) { const b = new THREE.Mesh(new THREE.PlaneGeometry(0.5 + r() * 0.8, 9), m); const a = r() * TAU, d = 2.5 + r() * 6; b.position.set(Math.cos(a) * d, -1.3, Math.sin(a) * d - 2); b.rotation.set(0.25, r() * TAU, 0.18); b.userData.noHit = true; g.add(b); }
  g.renderOrder = 21; return g;
}
// sea grass in clumps on the sand (one mesh; it sways in the shader)
function seaGrass(n, R0, R1, seed) {
  const r = rnd(seed), blades = []; for (let i = 0; i < n; i++) { const a = r() * TAU, d = R0 + r() * (R1 - R0), cx = Math.cos(a) * d, cz = Math.sin(a) * d - 1;
    for (let k = 0; k < 7; k++) { const h = 0.25 + r() * 0.45, w = 0.012 + r() * 0.01; const b = new THREE.PlaneGeometry(w, h, 1, 4); b.translate(0, h / 2, 0); b.rotateY(r() * TAU); b.translate(cx + (r() - 0.5) * 0.25, 0, cz + (r() - 0.5) * 0.25); blades.push(b); } }
  const gm = mergeGeoms(blades); const uv = new Float32Array(gm.attributes.position.count * 2); for (let i = 0; i < uv.length / 2; i++) { uv[i * 2] = 0.5; uv[i * 2 + 1] = clamp01(gm.attributes.position.getY(i) / 0.7); } gm.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  const t = tex(4, 64, (x) => { const g = x.createLinearGradient(0, 64, 0, 0); g.addColorStop(0, '#2e4a1c'); g.addColorStop(1, '#8aa64a'); x.fillStyle = g; x.fillRect(0, 0, 4, 64); });
  const m = lm({ map: t, side: THREE.DoubleSide, amp: 0.12, mode: 1 }); m.userData.sw.uSwHalf.value = 0.7; const mesh = new THREE.Mesh(gm, m); mesh.receiveShadow = true; mesh.userData.noHit = true; return mesh;
}
// the place's group; kind 'reef' (sand, rocks, coral, sea grass) or 'ocean' (open water: nothing below)
export const WATER = {};
function buildWater(kind) {
  const g = new THREE.Group(); g.name = 'bw4-' + kind; WATER[kind] = g;
  const dome = new THREE.Mesh(new THREE.SphereGeometry(90, 32, 18), domeMat()); dome.renderOrder = -10; dome.frustumCulled = false; dome.userData.noHit = true; g.add(dome);
  dome.onBeforeRender = () => { UW.uUwT.value = performance.now() / 1000; };
  g.add(snowPoints(LITE ? 260 : 700)); if (!LITE && kind === 'reef') g.add(sunBeams());
  if (kind === 'reef') {
    const geo = new THREE.PlaneGeometry(70, 70, 70, 70).rotateX(-Math.PI / 2); const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), d = Math.hypot(x, z + 1); p.setY(i, d < 2.4 ? 0 : (Math.sin(x * 0.35 + z * 0.2) * 0.12 + Math.sin(z * 0.5 - x * 0.15) * 0.08) * clamp01((d - 2.4) / 3) - clamp01((d - 14) / 20) * 2.5); }
    geo.computeVertexNormals();
    const floor = new THREE.Mesh(geo, lm({ map: sandTex(), color: 0xe8dcc4, caus: 1.1 })); floor.receiveShadow = true; floor.userData.noHit = true; floor.name = 'seabed'; g.add(floor);
    g.add(seaGrass(LITE ? 10 : 18, 3.2, 9, 5));
    // reef rocks with coral growing on them, around the sandy clearing
    const r = rnd(8); const put = (name, x, z, o = {}) => { const m = oModel(name, { face: [r() - 0.5, r() - 0.5], shadow: !LITE, ...o }); m.position.set(x, o.y ?? 0, z); m.rotation.y = r() * TAU; g.add(m); return m; };
    const CO = ['braincoral_lo', 'pinkcoral_lo', 'fingercoral_lo', 'redcoral_lo'];
    for (const [x, z, k] of [[-3.9, -4.2, 0.7], [3.6, -4.6, 0.8], [-6.2, -1.6, 1.0], [6.0, -1.2, 0.8], [0.8, -7.2, 1.2], [-2.6, -8.0, 1.1], [4.9, -7.6, 1.0], [-7.0, -6.0, 1.3]]) {
      put('boulder_04', x, z, { k, tint: 0x8a9a86, y: -0.12 });
      put(CO[Math.floor(r() * 4)], x + (r() - 0.5) * 0.5, z + (r() - 0.5) * 0.4, { y: 1.55 * k, k: 0.9 + r() * 0.5, tint: [0xffffff, 0xffd9c8, 0xffe7a8][Math.floor(r() * 3)] }); }
    for (const [x, z, n] of [[-2.0, -2.9, 'braincoral_lo'], [2.2, -2.7, 'pinkcoral_lo'], [-2.9, -1.6, 'redcoral_lo'], [3.0, -1.5, 'fingercoral_lo'], [1.0, -3.6, 'braincoral_lo'], [-1.1, -3.7, 'pinkcoral_lo'], [3.9, -2.7, 'pinkcoral_lo'], [-4.0, -2.6, 'braincoral_lo'], [0.0, -4.4, 'redcoral_lo']]) put(n, x, z, { k: 1.0 + r() * 0.6, tint: n === 'fingercoral_lo' ? 0xd6b48c : n === 'redcoral_lo' ? 0xff9a7a : 0xffffff });
  }
  return { group: g, light: { dir: V(0.25, 1, 0.18), sunI: kind === 'reef' ? 1.7 : 1.3, sky: 0.7, env: 0.3 } };
}
// A shallow coral reef (a lagoon 3 m deep, as off the Lakshadweep islands) and the open Indian Ocean. They are built in
// code, so the narration tool lists no photo for them (img is only a name here; devtools/tts/subject_voices.mjs knows a
// built place by the form `build: name, img: '…'`).
const buildReef = () => buildWater('reef'), buildOcean = () => buildWater('ocean');
if (!PLACES.reef) PLACES.reef = { build: buildReef, img: 'bw4_reef', h: 1.6, r: 60, name: N3('Coral reef (under water)', 'मूँगे की चट्टान (पानी के नीचे)', 'Coral reef (paani ke neeche)') };
if (!PLACES.ocean) PLACES.ocean = { build: buildOcean, img: 'bw4_ocean', h: 1.6, r: 60, name: N3('Open ocean', 'खुला समुद्र', 'Khula samudra') };
if (!PLACES.beach) PLACES.beach = { img: 'spiaggia_di_mondello', h: 1.6, r: 60, sun: [0.728, 0.427, 0.536], sunI: 2.2, sky: 0.3, env: 1.0, name: N3('Beach', 'समुद्र तट', 'Samudra tat (beach)') };

// ------------------------------------------------------------------ the zoom bubble
// A round window floating beside the student that shows something up close (gill slits, tube feet, pores), rendered
// live from a second camera. o: { at: V (where it floats), r, label }. look(point, from): what it looks at and from where.
export function zoomBubble(o = {}) {
  const g = new THREE.Group(); g.position.copy(o.at || V(-0.7, 1.5, -1.1)); const R = o.r || 0.17, S = LITE ? 192 : 256;
  const RT = new THREE.WebGLRenderTarget(S, S, { colorSpace: THREE.SRGBColorSpace }); const cam = new THREE.PerspectiveCamera(o.fov || 28, 1, 0.005, 200); // far enough for the water dome (90 m) and the whale at sea
  const disc = new THREE.Mesh(new THREE.CircleGeometry(R, 48), new THREE.MeshBasicMaterial({ map: RT.texture, toneMapped: false })); disc.renderOrder = 30; g.add(disc);
  const ring = new THREE.Mesh(new THREE.RingGeometry(R, R + 0.014, 48), new THREE.MeshBasicMaterial({ color: 0xffd23f, toneMapped: false })); ring.position.z = 0.001; g.add(ring);
  const cap = liveSign(0.08, 5); cap.position.set(0, -R - 0.065, 0.01); g.add(cap); // the caption: "Name: what to see" on two lines noHit(g); g.visible = false;
  const tgt = V(0, 1, -1), from = V(0, 1.2, -0.6); let lastF = -1, busy = false, n = 0; const hide = o.hide || [];
  disc.onBeforeRender = (renderer, scene) => { const f = renderer.info.render.frame; if (busy || f === lastF) return; lastF = f; if (LITE && (n++ % 2)) return; busy = true;
    cam.position.copy(from); cam.lookAt(tgt); cam.updateMatrixWorld(true);
    const xr = renderer.xr.enabled, sh = renderer.shadowMap.autoUpdate, rt0 = renderer.getRenderTarget(), vis = hide.map((m) => m.visible); hide.forEach((m) => { m.visible = false; }); g.visible = false;
    renderer.xr.enabled = false; renderer.shadowMap.autoUpdate = false; renderer.setRenderTarget(RT); renderer.clear(); renderer.render(scene, cam);
    renderer.xr.enabled = xr; renderer.shadowMap.autoUpdate = sh; renderer.setRenderTarget(rt0); hide.forEach((m, i) => { m.visible = vis[i]; }); g.visible = true; busy = false; };
  g.look = (p, fr, text, col) => { tgt.copy(p); from.copy(fr); g.visible = true; if (text != null) { const i = String(text).indexOf(': '); cap.set(i > 0 ? [text.slice(0, i + 1), text.slice(i + 2)] : [String(text)], col ? [col, col] : ['#ffd23f', '#ffffff']); } };
  g.hideBubble = () => { g.visible = false; };
  g.face = (eye) => { g.lookAt(eye); };
  return g;
}

// ------------------------------------------------------------------ fish shoals (one instanced mesh)
export function shoal(name, n, o = {}) {
  const g = new THREE.Group(); g.userData.fish = []; const r = rnd(o.seed || 9); let im = null; const len = o.len || ECO[name].len;
  for (let i = 0; i < n; i++) g.userData.fish.push({ off: V((r() - 0.5) * 1.2, (r() - 0.5) * 0.6, (r() - 0.5) * 1.2), ph: r() * TAU, s: 0.85 + r() * 0.3 });
  ecoLoad(name).then((gl) => { let mesh = null; gl.scene.traverse((x) => { if (x.isMesh && !mesh) mesh = x; }); if (!mesh) return;
    // positions and normals as plain floats first: the files are quantized (normalized int16), and moving such an
    // attribute clamps it to -1…1, which squashes every fish into a little cube
    const geo = mesh.geometry.clone(); for (const k of ['position', 'normal']) { const a = geo.attributes[k]; if (!a || a.array instanceof Float32Array) continue; const f = new Float32Array(a.count * 3);
      for (let i = 0; i < a.count; i++) { f[i * 3] = a.getX(i); f[i * 3 + 1] = a.getY(i); f[i * 3 + 2] = a.getZ(i); } geo.setAttribute(k, new THREE.BufferAttribute(f, 3)); }
    mesh.updateWorldMatrix(true, false); geo.applyMatrix4(mesh.matrixWorld); geo.computeBoundingBox(); const b = geo.boundingBox, c = b.getCenter(V()), s = b.getSize(V());
    const hd = ECO[name].head || [1, 0]; geo.translate(-c.x, -c.y, -c.z); const k = len / Math.max(s.x, s.z); geo.scale(k, k, k); geo.rotateY(-ang(hd[0], hd[1])); // head along +x
    const m = lm({ map: mesh.material.map, amp: 0.14, k: 3 }); const u = m.userData.sw; u.uSwAx.value.set(1, 0); u.uSwC.value.set(0, 0); u.uSwHalf.value = len / 2;
    im = new THREE.InstancedMesh(geo, m, n); im.frustumCulled = false; im.userData.noHit = true; g.add(im); g.userData.mat = m; });
  const dm = new THREE.Object3D(); let T = 0;
  g.tick = (dt, path) => { T += dt || 0.016; if (!im) return; const P = path(T), P2 = path(T + 0.05), dir = P2.clone().sub(P); const yaw = Math.atan2(-dir.z, dir.x);
    g.userData.mat.userData.sw.uSwT.value = T * TAU * 2.2;
    g.userData.fish.forEach((f, i) => { const w = Math.sin(T * 0.7 + f.ph); dm.position.copy(P).add(f.off.clone().multiplyScalar(1 + 0.15 * w)).add(V(0, Math.sin(T * 1.3 + f.ph) * 0.05, 0)); dm.rotation.set(0, yaw + Math.sin(T * 0.9 + f.ph) * 0.15, 0); dm.scale.setScalar(f.s); dm.updateMatrix(); im.setMatrixAt(i, dm.matrix); });
    im.instanceMatrix.needsUpdate = true; };
  return g;
}

// ------------------------------------------------------------------ shared pieces
const TRAYT = {};
// a plastic sorting tray (the kind marine biologists sort a catch in), w × d, as one geometry (walls and floor)
function trayGeo(w, d, h = 0.07, t = 0.008) { const parts = [new THREE.BoxGeometry(w, t, d).translate(0, t / 2, 0), new THREE.BoxGeometry(w, h, t).translate(0, h / 2, d / 2), new THREE.BoxGeometry(w, h, t).translate(0, h / 2, -d / 2), new THREE.BoxGeometry(t, h, d).translate(w / 2, h / 2, 0), new THREE.BoxGeometry(t, h, d).translate(-w / 2, h / 2, 0)];
  const gm = mergeGeoms(parts); const uv = new Float32Array(gm.attributes.position.count * 2); gm.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); return gm; }
export function spot(r = 0.08, col = 0xffd23f) { const m = new THREE.Mesh(new THREE.TorusGeometry(r, 0.005, 8, 48), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.85, toneMapped: false, depthWrite: false })); m.rotation.x = Math.PI / 2; m.visible = false; m.renderOrder = 12; m.userData.noHit = true; return m; }
// a thing to pick up and carry: its real model (or a group) with an easy-to-hit handle
export function thing(label, grp, o = {}) {
  const it = new Item(o.kind || 'bw4thing', { name: label }); it.g.add(grp); it.model = grp; if (!grp.tick) grp.tick = () => {};
  const r0 = o.hitR ?? 0.08; const hb = new THREE.Mesh(new THREE.SphereGeometry(r0, 10, 8), new THREE.MeshBasicMaterial({ visible: false })); hb.position.y = o.hitY ?? r0 * 0.6; it.g.add(hb);
  it.noGrab = false; it.noPhys = true; it.grabY = o.hitY ?? r0 * 0.6; it.base = 0; it.height = o.height ?? 0.1; it.radius = r0; it.placed = false;
  it.update = (dt, t) => { grp.tick(dt || 0.016); if (it.tick) it.tick(dt || 0.016, t); };
  return it;
}
export const say3 = (W, l) => l.map((s) => (typeof s === 'string' ? W(s) : s));

// ------------------------------------------------------------------ Class 9 (6): sort the animals of a coral reef into their groups
// The student stands on the sand of a shallow reef (3 m deep). Six sorting trays stand in an arc in front, one for each
// group (phylum) with its main feature written over it. Around them live a sponge, a brain coral, a jellyfish, an
// octopus, a turban snail, a crab, a starfish, a brittle star and a parrotfish; a flatfish lies hidden on the sand.
// Each animal goes into whichever tray the student puts it in; the bubble shows its body up close.
export const PHYLA = ['porifera', 'cnidaria', 'mollusca', 'arthropoda', 'echino', 'chordata'];
export const REEF_ANIMALS = {
  sponge: { p: 'porifera', at: [-0.95, 0.5, -0.12], face: [1, -1] }, braincoral: { p: 'cnidaria', at: [-0.72, 0.5, -0.4], k: 0.42 }, jellyfish: { p: 'cnidaria', at: [-0.5, 1.2, -0.05], drift: 1 },
  starfish: { p: 'echino', at: [-0.78, 0.54, -0.02] }, octopus: { p: 'mollusca', at: [0.8, 0.52, -0.1], face: [-1, 0.6] }, turban: { p: 'mollusca', at: [0.66, 0.53, -0.38] },
  crab: { p: 'arthropoda', at: [1.0, 0.5, -0.32], face: [-1, 1] }, brittlestar: { p: 'echino', at: [0.95, 0.53, 0.02] },
  parrotfish: { p: 'chordata', at: [0, 1.05, -0.4], swim: 1 }, halibut: { p: 'chordata', at: [0.3, 0.005, -0.3], face: [1, 0.3] },
};
export function reefSort(o = {}) {
  const it = new Item('breef', { ...o, name: N3('Coral reef: sorting trays', 'मूँगे की चट्टान: छाँटने की ट्रे', 'Coral reef: sort karne ki trays') });
  const g = it.g, w_ = o.W || ((k) => k), ticks = []; it.W = w_;
  setWater({ on: true, col: 0x0f6a80, dens: 0.075, abs: [0.2, 0.045, 0.03], base: 0, surf: 3.2, light: 1, lamp: 0 });
  // trays on a stainless rack in an arc in front of the student
  const NT = 6, TR = 0.98, trays = []; const rackM = lm({ color: 0x9aa4ad }), trayM = lm({ color: 0xe9eef0 }), tg = trayGeo(0.3, 0.24); const legs = [];
  for (let i = 0; i < NT; i++) { const a = (-62.5 + i * 25) * Math.PI / 180, p = V(Math.sin(a) * TR, 0.78, -Math.cos(a) * TR); const t = new THREE.Mesh(tg, trayM); t.position.copy(p); t.rotation.y = -a; t.receiveShadow = true; g.add(t);
    legs.push(new THREE.CylinderGeometry(0.012, 0.012, 0.78, 6).translate(p.x, 0.39, p.z)); trays.push({ p, a, n: 0 }); }
  const rack = new THREE.Mesh(mergeGeoms(legs), rackM); g.add(rack);
  const signs = trays.map((t, i) => { const s = liveSign(0.075, 3.4); s.position.copy(t.p).add(V(0, 0.3 + (i % 2) * 0.11, 0)).multiplyScalar(1.03).setY(0.78 + 0.3 + (i % 2) * 0.11); g.add(s); return s; });
  const LBL = { porifera: ['Porifera (sponges)', 'body full of pores'], cnidaria: ['Cnidaria', 'stinging tentacles, hollow body'], mollusca: ['Mollusca', 'soft body, often a shell'],
    arthropoda: ['Arthropoda', 'jointed legs, hard outer skin'], echino: ['Echinodermata', 'spiny skin, body in five parts'], chordata: ['Chordata: fish', 'backbone, fins and gills'] };
  it.label = (i, extra) => { const k = PHYLA[i]; signs[i].set([w_(LBL[k][0]), w_(LBL[k][1]), ...(extra ? [extra] : [])], ['#ffd23f', '#ffffff', '#8be07a']); };
  PHYLA.forEach((_, i) => it.label(i));
  const rings = trays.map((t) => { const m = spot(0.17); m.position.copy(t.p).add(V(0, 0.09, 0)); g.add(m); return m; });
  it.trayAt = (i) => trays[i].p.clone(); it.trays = trays;
  // the reef close by: low rocks with the animals on them (one rock each side), sand, the student's own patch
  const r = rnd(4);
  for (const [x, z] of [[-0.85, -0.25], [0.85, -0.25]]) { const b = oModel('boulder_04', { k: 0.3, face: [x, 1], tint: 0x9aa58f, shadow: !LITE }); b.position.set(x, -0.02, z); g.add(b); }
  // swimming by: a shoal of sardines, a puffer, a green sea turtle (it comes back in the last step)
  const sh = shoal('sardine_lo', LITE ? 14 : 24, { seed: 3 }); g.add(sh); ticks.push((dt) => sh.tick(dt, (t) => V(Math.cos(t * 0.12) * 4.5, 1.8 + Math.sin(t * 0.3) * 0.3, -3.5 + Math.sin(t * 0.12) * 2.5)));
  const puf = oModel('puffer', { face: [1, 0], sw: { amp: 0.1 } }); g.add(puf); let pa = 0; ticks.push((dt) => { pa += dt * 0.25; puf.position.set(-1.6 + Math.cos(pa) * 0.8, 0.9 + Math.sin(pa * 2) * 0.1, -2.2 + Math.sin(pa) * 0.6); puf.rotation.y = ang(-Math.sin(pa), Math.cos(pa)); puf.tick(dt); });
  const turtle = oModel('seaturtle', { face: [1, 0], speed: 0.8 }); turtle.visible = false; g.add(turtle); it.turtle = turtle; let ta = 0;
  ticks.push((dt) => { if (!turtle.visible) return; ta += dt * 0.12; turtle.position.set(-3 + ta * 2.2, 1.7 + Math.sin(ta * 2) * 0.15, -2.0 - Math.sin(ta * 1.4) * 0.6); if (ta > 2.8) ta = 0; turtle.tick(dt); });
  // the bubble: what was last put in a tray, up close
  const bub = zoomBubble({ at: V(0, 1.72, -1.15), r: 0.17, hide: signs }); g.add(bub); it.bubble = bub;
  animator(it); const up0 = it.update;
  it.update = (dt, t) => { up0(dt); const tt = t ?? performance.now() / 1000; for (const f of ticks) f(dt || 0.016, tt); for (const [i, m] of rings.entries()) { m.visible = !!it.open && it.open(i); if (m.visible) m.scale.setScalar(1 + 0.06 * Math.sin(tt * 5)); } };
  it.views = { all: { p: V(0, 1.55, 0.75), t: V(0, 0.75, -0.8) }, reef: { p: V(0, 1.7, 1.2), t: V(0, 1.2, -3) }, left: { p: V(0.05, 1.65, 0.95), t: V(-0.4, 0.85, -0.5) }, right: { p: V(-0.05, 1.65, 0.95), t: V(0.4, 0.85, -0.5) }, sand: { p: V(0.15, 1.55, 0.8), t: V(0.2, 0.5, -0.6) }, turtle: { p: V(0, 1.5, 0.8), t: V(0, 1.5, -2.2) } };
  return done1(it, { height: 0.9, radius: 1.3 });
}
// the animals of the reef, as things the student picks up (made in the activity's setup: each is its own item)
export function reefAnimal(name, label) {
  const A = REEF_ANIMALS[name]; const swim = name === 'parrotfish' || name === 'halibut' || name === 'octopus';
  const m = oModel(name, { face: A.face || [1, 0], k: A.k, hit: true, ...(name === 'jellyfish' ? { opacity: 0.6, emissive: 0x29404e } : {}), shadow: !A.swim && !LITE, sw: name === 'jellyfish' ? { amp: 0.06, mode: 2 } : swim ? { amp: name === 'parrotfish' ? 0.13 : 0.04, k: name === 'octopus' ? 6 : 3 } : null, rate: name === 'jellyfish' ? 0.35 : name === 'parrotfish' ? 1.6 : 0.4 });
  const R = { jellyfish: 0.16, parrotfish: 0.14, halibut: 0.16, octopus: 0.16, crab: 0.12, sponge: 0.13, braincoral: 0.14 }[name] || 0.09;
  const it = thing(label, m, { hitR: R, hitY: R * 0.6, kind: 'reef_' + name }); it.animal = name; it.phylum = A.p; it.tray = -1; it.slotY = 0.012;
  if (A.drift) { let a = 0; it.tick = (dt) => { if (it.held || it.placed || it.flying || it.tray >= 0) return; a += dt * 0.4; it.g.position.y = A.at[1] + Math.sin(a) * 0.06; it.g.position.x = A.at[0] + Math.sin(a * 0.7) * 0.05; }; }
  if (A.swim) { let a = 0; it.tick = (dt) => { if (it.held || it.placed || it.flying || it.tray >= 0) return; a += dt * 0.3; const px = Math.cos(a) * 0.75, pz = -1.25 + Math.sin(a) * 0.45; it.g.position.set(px, A.at[1] + Math.sin(a * 2) * 0.06, pz); it.g.rotation.y = ang(-Math.sin(a), Math.cos(a) * 0.55 / 0.7); }; }
  return it;
}
// binds the animals to the trays: anything let go over a tray stays in it (right or wrong); the step's animals are open
// steps: [[names…], …] by step index (s0: index of the first sorting step)
export function bindReef(rs, animals, app, s0, steps, done = {}) {
  const stepOf = (n) => steps.findIndex((l) => l.includes(n));
  const openAnimal = (n) => { const i = app.runner.i - s0; return i >= stepOf(n) && i < steps.length + 2; };
  rs.open = (ti) => { const i = app.runner.i - s0; return i >= 0 && i < steps.length && !rs.busy && animals.some((a) => a.held && steps[i].includes(a.animal)); };
  const feature = { sponge: 'pores all over its body', braincoral: 'a colony of tiny polyps with tentacles', jellyfish: 'a bell with stinging tentacles', octopus: 'soft body, eight arms with suckers',
    turban: 'a soft body inside a coiled shell', crab: 'jointed legs and a hard shell', starfish: 'five arms, tube feet underneath', brittlestar: 'five thin arms round a central disc',
    parrotfish: 'fins, scales and gills', halibut: 'a flat fish: both eyes on one side' };
  rs.feature = feature;
  const place = (a, ti, cb) => { const T = rs.trays[ti]; if (a.tray >= 0 && a.tray !== ti) rs.trays[a.tray].n--; if (a.tray !== ti) T.n++; a.tray = ti; a.placed = true;
    const k = T.n - 1, off = V(((k % 2) - 0.5) * 0.12, 0, (Math.floor(k / 2) - 0.5) * 0.09).applyAxisAngle(V(0, 1, 0), -T.a); const to = T.p.clone().add(off).add(V(0, a.slotY, 0));
    flyT(a, to, -T.a + (a.animal === 'parrotfish' || a.animal === 'halibut' ? Math.PI / 2 : 0), 0.7, () => { a.home = { p: a.g.position.clone(), q: a.g.quaternion.clone() }; a.placed = false;
      const wp = a.g.getWorldPosition(V()); rs.bubble.look(wp.clone().add(V(0, 0.04, 0)), wp.clone().add(V(0, 0.26, 0.22)), rs.W ? rs.W(feature[a.animal]) : feature[a.animal]);
      if (done.put) done.put(a, ti); if (cb) cb(); }); };
  rs.place = place;
  for (const a of animals) {
    carry(a, PHYLA.map((_, ti) => ({ at: () => rs.trays[ti].p.clone(), r: 0.17, open: () => openAnimal(a.animal) && !rs.busy, put: (x) => place(x, ti) })), { carryY: 1.0 });
    const n0 = a.noGrab; Object.defineProperty(a, 'noGrab', { configurable: true, get: () => !openAnimal(a.animal), set: () => {} }); void n0;
  }
  // a step is done when all its animals are in trays (right or wrong: what is wrong shows in the step's check)
  return { stepOf, inAll: (i) => steps[i].every((n) => animals.find((a) => a.animal === n).tray >= 0) };
}

// ------------------------------------------------------------------ Class 9: a shark and a dolphin (fish and mammal)
// Open water over sand. A blacktip shark and a bottlenose dolphin swim slow loops in front of the student, each
// beating its tail the way it really does (their scans' own swimming). The student sticks a glowing tag on a tail (the
// tag leaves a trail: side to side, or up and down), holds a thermometer to each, and runs a clock: the dolphin must go
// up to the surface to breathe through its blowhole; the shark never does (its gill slits take oxygen from the water).
export function sharkDolphin(o = {}) {
  const it = new Item('bsharkdol', { ...o, name: N3('A shark and a dolphin', 'शार्क और डॉल्फ़िन', 'Shark aur dolphin') });
  const g = it.g, w_ = o.W || ((k) => k), ticks = []; it.W = w_;
  setWater({ on: true, col: 0x10708a, dens: 0.06, abs: [0.2, 0.045, 0.03], base: 0, surf: 3.2, light: 1, lamp: 0 });
  const sharkM = oModel('shark', { face: [1, 0], speed: 1.0 }), dolM = oModel('dolphin', { face: [1, 0], speed: 0.9 });
  const shark = new THREE.Group(), dol = new THREE.Group(); shark.add(sharkM); dol.add(dolM); g.add(shark, dol); it.shark = shark; it.dolphin = dol;
  // their loops: the shark low over the sand in front, the dolphin a little higher and further out
  const S = { c: V(0, 0.95, -1.75), rx: 1.5, rz: 0.8, w: 0.17, a: 0.6 }, D = { c: V(0, 1.2, -2.5), rx: 2.1, rz: 1.1, w: -0.12, a: 2.2 };
  it.t = 0; it.tMax = 6; it.breaths = 0; it.surfacing = 0; let lastB = -1;
  // the dolphin goes up to breathe at 2, 4 and 6 minutes of the clock (the clock runs 1 minute in 4 seconds of play)
  const loopPos = (L, a, y = 0) => V(L.c.x + Math.cos(a) * L.rx, L.c.y + y, L.c.z + Math.sin(a) * L.rz);
  const spray = new THREE.Group(); spray.visible = false; g.add(spray); const dropM = new THREE.MeshBasicMaterial({ color: 0xeaf6ff, transparent: true, opacity: 0.85, toneMapped: false, depthWrite: false }), dropG = new THREE.SphereGeometry(0.03, 6, 4);
  const sp = Array.from({ length: 18 }, () => { const m = new THREE.Mesh(dropG, dropM); m.userData.noHit = true; spray.add(m); return { v: V(), p: m.position, life: 0, m }; });
  const bub = zoomBubble({ at: V(-0.62, 1.55, -1.0), r: 0.16 }); g.add(bub); it.bubble = bub;
  // tags and their trails
  const trailM = new THREE.LineBasicMaterial({ color: 0x7cf7ff, transparent: true, opacity: 0.9, toneMapped: false });
  const mkTrail = () => { const n = 90, gm = new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3)); const l = new THREE.Line(gm, trailM); l.frustumCulled = false; l.visible = false; g.add(l); return { l, n, pts: [] }; };
  it.trails = { shark: mkTrail(), dolphin: mkTrail() }; it.tags = { shark: null, dolphin: null };
  // bones: where a tag sticks; the tail tip is the bone furthest back
  const bones = (m) => { const b = []; m.traverse((x) => { if (x.isBone) b.push(x); }); return b; };
  it.boneNear = (who, p) => { const m = (who === 'shark' ? sharkM : dolM).userData.model; if (!m) return null; let best = null, bd = 1e9; for (const b of bones(m)) { const w = b.getWorldPosition(V()); const d = w.distanceTo(p); if (d < bd) { bd = d; best = b; } } return best; };
  it.tailBone = (who) => { const grp = who === 'shark' ? shark : dol; const m = (who === 'shark' ? sharkM : dolM).userData.model; if (!m) return null; const head = V(1, 0, 0).applyQuaternion(grp.quaternion); let best = null, bd = 1e9;
    for (const b of bones(m)) { const w = b.getWorldPosition(V()).sub(grp.position); const d = w.dot(head); if (d < bd) { bd = d; best = b; } } return best; };
  it.stick = (who, tagIt, bone) => { it.tags[who] = { it: tagIt, bone }; tagIt.flying = false; tagIt.placed = true; it.trails[who].pts = []; it.trails[who].l.visible = true;
    // how far the tag swings across the line of swimming (sideways and up-down), measured over the next loop
    it.trails[who].sw = { side: [1e9, -1e9], up: [1e9, -1e9], n: 0 }; };
  const tmpQ = new THREE.Quaternion();
  let fr = 0; ticks.push((dt) => { fr++; for (const who of ['shark', 'dolphin']) { const tg = it.tags[who]; if (!tg) continue; const p = tg.bone.getWorldPosition(V()); tg.it.g.position.copy(p);
      const tr = it.trails[who]; if (fr % 3 === 0) tr.pts.push(p.clone()); if (tr.pts.length > tr.n) tr.pts.shift(); const a = tr.l.geometry.attributes.position; for (let i = 0; i < tr.n; i++) { const q = tr.pts[Math.min(i, tr.pts.length - 1)] || p; a.setXYZ(i, q.x, q.y, q.z); } a.needsUpdate = true;
      const grp = who === 'shark' ? shark : dol; const rel = p.clone().sub(grp.position).applyQuaternion(tmpQ.copy(grp.quaternion).invert()); const sw = tr.sw; sw.side[0] = Math.min(sw.side[0], rel.z); sw.side[1] = Math.max(sw.side[1], rel.z); sw.up[0] = Math.min(sw.up[0], rel.y); sw.up[1] = Math.max(sw.up[1], rel.y); sw.n++; } });
  it.swing = (who) => { const sw = it.trails[who].sw; if (!sw || sw.n < 20) return null; return { side: sw.side[1] - sw.side[0], up: sw.up[1] - sw.up[0] }; };
  // body temperatures (the water is 26 °C)
  it.tempOf = { shark: 26, dolphin: 36.5 };
  const sign = liveSign(0.1, 4.4); sign.position.set(0.25, 2.05, -1.3); g.add(sign); it.say = (l, c) => sign.set(l, c);
  const tSign = liveSign(0.07, 2.4); tSign.visible = false; g.add(tSign); it.tSign = tSign;
  animator(it); const up0 = it.update; let T = 0;
  it.update = (dt, tt) => { up0(dt); const d = Math.min(dt || 0.016, 0.05); T += d;
    // shark: steady loop; dolphin: its loop, rising to the surface when it is time to breathe
    S.a += d * S.w; shark.position.copy(loopPos(S, S.a, Math.sin(T * 0.5) * 0.08)); shark.rotation.y = ang(-Math.sin(S.a) * S.rx * Math.sign(S.w), Math.cos(S.a) * S.rz * Math.sign(S.w)); sharkM.tick(d);
    D.a += d * D.w; let y = Math.sin(T * 0.4) * 0.1; const want = it.surfacing; it.sur = (it.sur || 0) + (want - (it.sur || 0)) * Math.min(1, d * 1.2); y += it.sur * 1.85;
    dol.position.copy(loopPos(D, D.a, y)); dol.rotation.set(0, ang(-Math.sin(D.a) * D.rx * Math.sign(D.w), Math.cos(D.a) * D.rz * Math.sign(D.w)), 0); dol.rotateZ(it.sur > 0.05 && it.sur < 0.95 ? (want > 0.5 ? 0.35 : -0.3) : 0); dolM.tick(d);
    // a breath at the surface: a puff of spray from the blowhole
    if (spray.visible) { let alive = 0; sp.forEach((s) => { if (s.life > 0) { s.life -= d; s.v.y -= 9.8 * d * 0.5; s.p.addScaledVector(s.v, d); alive++; } s.m.visible = s.life > 0; }); if (!alive) spray.visible = false; }
    if (it.bubbleMode) { const who = it.surfacing || it.sur > 0.3 ? 'dolphin' : 'shark'; const hb = headBone(who); if (hb) { const p = hb.getWorldPosition(V()); const grp = who === 'shark' ? shark : dol;
        const side = V(0, 0, 1).applyQuaternion(grp.quaternion), fwd = V(1, 0, 0).applyQuaternion(grp.quaternion);
        if (who === 'shark') bub.look(p.clone().addScaledVector(fwd, -0.18), p.clone().addScaledVector(fwd, -0.18).addScaledVector(side, 0.55).add(V(0, 0.08, 0)), w_('Shark: gill slits behind the head'));
        else bub.look(p.clone().add(V(0, 0.12, 0)), p.clone().add(V(0, 0.75, 0)).addScaledVector(fwd, -0.2), w_('Dolphin: the blowhole on top of the head')); } }
    for (const f of ticks) f(d, tt); };
  const headBone = (who) => { const m = (who === 'shark' ? sharkM : dolM).userData.model; if (!m) return null; let h = null; m.traverse((x) => { if (!h && x.isBone && /^head/i.test(x.name)) h = x; }); return h; };
  it.blow = () => { const p = dol.position.clone().add(V(0, 0.25, 0)); spray.visible = true; sp.forEach((s) => { s.p.copy(p); s.v.set((Math.random() - 0.5) * 0.6, 1.5 + Math.random() * 1.6, (Math.random() - 0.5) * 0.6); s.life = 0.6 + Math.random() * 0.5; }); it.breaths++; };
  // the clock: 0 … 6 minutes; the dolphin breathes at 2, 4, 6
  it.setT = (t) => { it.t = Math.max(0, Math.min(it.tMax, t)); const ph = it.t % 2; it.surfacing = it.t > 0.2 && (ph > 1.55 || (it.t >= it.tMax - 0.01)) ? 1 : 0; const b = Math.floor((it.t + 0.45) / 2);
    if (b > lastB && b > 0 && it.t >= b * 2 - 0.45) { lastB = b; setTimeout(() => it.blow(), 900); }
    it.say([`${w_('Clock')}: ${it.t.toFixed(1)} ${w_('min')}`, `${w_('Dolphin breaths')}: ${it.breaths} · ${w_('Shark breaths at the surface')}: 0`], ['#ffffff', '#ffd23f']); };
  it.knobPath = () => [V(-0.4, 0.9, -0.45), V(0.4, 0.9, -0.45)];
  // a post at waist height with the knob's track, and the student's things on it
  const post = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.04, 0.24), lm({ color: 0x8c8f8a })); post.position.set(0, 0.86, -0.5); g.add(post);
  const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.86, 8), lm({ color: 0x6f7470 })); leg.position.set(0, 0.43, -0.5); g.add(leg);
  it.views = { all: { p: V(0, 1.55, 1.0), t: V(0, 1.1, -2.6) }, shark: { p: V(0.2, 1.4, 0.4), t: V(0, 0.95, -2.3) }, dolphin: { p: V(0, 1.7, 1.2), t: V(0, 1.6, -3.4) }, up: { p: V(0, 1.4, 1.6), t: V(0, 2.4, -3.4) } };
  it.say([w_('A shark and a dolphin')], '#ffffff');
  return done1(it, { height: 1, radius: 2 });
}
// a glowing tag (a small float with a light stick, as tagged fish carry)
export function glowTag() { const g = new THREE.Group(); const b = new THREE.Mesh(new THREE.SphereGeometry(0.018, 14, 10), new THREE.MeshBasicMaterial({ color: 0x7cf7ff, toneMapped: false })); b.position.y = 0.02; g.add(b);
  const h = new THREE.Mesh(new THREE.SphereGeometry(0.03, 12, 8), new THREE.MeshBasicMaterial({ color: 0x7cf7ff, transparent: true, opacity: 0.3, depthWrite: false, toneMapped: false })); h.position.y = 0.02; g.add(h); noHit(g); return g; }

// ------------------------------------------------------------------ Class 6 (8): down through the ocean's zones in a submersible
// The student sits in a small research submersible in the open Indian Ocean. A lever on the panel sends it down. Gauges
// show depth, light (as % of the light at the surface), water temperature and pressure; colour cards outside show which
// colours of sunlight are lost first; the animals of each zone come past; a foam cup rides along (outside in the
// manipulator's basket, or inside the cabin, wherever the student puts it).
const CUPT = {};
export function subDive(o = {}) {
  const it = new Item('bdive', { ...o, name: N3('Research submersible', 'शोध पनडुब्बी', 'Research submersible') });
  const g = it.g, w_ = o.W || ((k) => k), ticks = [];
  setWater({ on: true, col: 0x0b5f86, dens: 0.05, abs: [0.35, 0.065, 0.023], base: 0, surf: 3.0, light: 1, lamp: 0 });
  // the cabin: a steel frame round a big window, a panel in front, a shelf inside; the manipulator basket outside
  const steel = lm({ color: 0x8d969c, dry: true }), dark = lm({ color: 0x4a5560, dry: true }), yellow = lm({ color: 0xe0b02a }), steelWet = lm({ color: 0x8d969c });
  const parts = [], add = (gm, x, y, z) => { gm.translate(x, y, z); parts.push(gm); };
  const win = new THREE.TorusGeometry(0.85, 0.05, 10, 48); add(win, 0, 1.45, -1.05);
  for (const s of [-1, 1]) { add(new THREE.BoxGeometry(0.1, 2.3, 0.1), s * 1.0, 1.15, -1.05); add(new THREE.BoxGeometry(0.1, 0.1, 1.6), s * 1.0, 2.3, -0.3); add(new THREE.BoxGeometry(0.1, 2.3, 0.1), s * 1.0, 1.15, 0.5); }
  add(new THREE.BoxGeometry(2.1, 0.1, 0.1), 0, 2.3, -1.05); add(new THREE.BoxGeometry(2.1, 0.06, 1.7), 0, 0.03, -0.3);
  const frame = new THREE.Mesh(mergeGeoms(parts), steel); g.add(frame);
  const hull = new THREE.Mesh(new THREE.CylinderGeometry(1.35, 1.35, 2.5, 32, 1, true, Math.PI * 1.36, Math.PI * 1.28), lm({ color: 0xd8dde0, side: THREE.DoubleSide, dry: true })); hull.position.set(0, 1.2, -0.25); g.add(hull);
  const panel = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.06, 0.32), dark); panel.position.set(0, 0.86, -0.62); panel.rotation.x = -0.25; g.add(panel);
  const shelf = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.03, 0.22), steel); shelf.position.set(-0.78, 0.98, -0.5); g.add(shelf);
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.9, 8), yellow); arm.rotation.z = Math.PI / 2; arm.position.set(0.45, 0.55, -1.45); g.add(arm);
  const basket = new THREE.Mesh(trayGeo(0.26, 0.22, 0.08), steelWet); basket.position.set(0.85, 0.5, -1.45); g.add(basket);
  it.at = { out: () => V(0.85, 0.52, -1.45), in: () => V(-0.78, 1.0, -0.5) };
  // colour cards on a rod outside the window: red, orange, yellow, green, blue
  // (tilted up to the light above, so each shows its own colour as long as that colour still reaches this depth)
  const cards = new THREE.Group(); cards.position.set(-0.6, 0.78, -1.5); cards.rotation.x = -0.6; g.add(cards); [0xd8262a, 0xf07b1e, 0xf2d22c, 0x3aa84a, 0x2a5fd0].forEach((c, i) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.16), lm({ color: c, side: THREE.DoubleSide })); m.position.set(i * 0.14, 0, 0); cards.add(m); });
  // the lamp (it lights what is close, in true colours)
  const lampB = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.12, 16), steel); lampB.rotation.x = Math.PI / 2; lampB.position.set(0, 2.15, -1.12); g.add(lampB);
  const lampG = new THREE.Mesh(new THREE.CircleGeometry(0.058, 20), new THREE.MeshBasicMaterial({ color: 0x7d8a92, toneMapped: false })); lampG.position.set(0, 2.15, -1.185); lampG.rotation.y = Math.PI; g.add(lampG);
  it.lamp = false; it.setLamp = (on) => { it.lamp = on; lampG.material.color.set(on ? 0xfff6dd : 0x7d8a92); setWater({ lamp: on ? 1.3 : 0 }); };
  // gauges
  const gauge = liveSign(0.11, 3.2); gauge.position.set(0.3, 1.12, -0.7); g.add(gauge); const sign = liveSign(0.09, 4.6); sign.position.set(0, 2.55, -1.2); g.add(sign); it.say = (l, c) => sign.set(l, c);
  // the animals of each zone (y: their depth band, they come past the window as the submersible goes through it)
  const zoo = [];
  const life = (name, o2, band, path) => { const m = oModel(name, { face: [1, 0], sw: o2.sw, speed: o2.speed, rate: o2.rate, tint: o2.tint, opacity: o2.opacity, emissive: o2.emissive }); m.visible = false; g.add(m); zoo.push({ m, band, path, a: Math.random() * TAU, glow: o2.glow }); return m; };
  const sh = shoal('sardine_lo', LITE ? 16 : 28, { seed: 7 }); g.add(sh); zoo.push({ m: sh, band: [0, 60], shoal: 1 });
  life('seaturtle', {}, [0, 40], (a) => V(Math.cos(a) * 2.5, 1.6 + Math.sin(a * 2) * 0.2, -3.8 + Math.sin(a) * 0.8));
  life('dolphin', { speed: 0.9 }, [0, 80], (a) => V(Math.cos(a) * 4, 2.0, -5.5 + Math.sin(a) * 1.4));
  life('jellyfish', { sw: { amp: 0.06, mode: 2 }, rate: 0.35, opacity: 0.6, emissive: 0x29404e }, [10, 600], (a) => V(1.2 + Math.sin(a) * 0.2, 1.3 + Math.sin(a * 0.7) * 0.15, -2.2));
  life('squid', { sw: { amp: 0.05, k: 4 }, rate: 0.9 }, [150, 900], (a) => V(Math.cos(a) * 1.6, 1.4 + Math.sin(a * 1.5) * 0.15, -2.6 + Math.sin(a) * 0.5));
  const lf = life('lanternfish', { sw: { amp: 0.12 }, rate: 1.8 }, [300, 1400], (a) => V(Math.cos(a * 1.3) * 1.1 - 0.3, 1.1 + Math.sin(a) * 0.1, -2.0 + Math.sin(a * 1.3) * 0.4));
  const lf2 = life('lanternfish', { sw: { amp: 0.12 }, rate: 1.6 }, [300, 1400], (a) => V(Math.cos(a * 1.1 + 2) * 1.4, 1.6 + Math.sin(a + 1) * 0.1, -2.5 + Math.sin(a * 1.1 + 2) * 0.5));
  const an = life('anglerfish', { sw: { amp: 0.05 }, rate: 0.5 }, [1200, 4000], (a) => V(0.4 + Math.sin(a * 0.5) * 0.3, 1.0, -1.9));
  // their own light: photophores along the lanternfish, the anglerfish's lure (bioluminescence: not lost with depth)
  const glowM = new THREE.MeshBasicMaterial({ color: 0x8ff7ff, toneMapped: false }), lureM = new THREE.MeshBasicMaterial({ color: 0xbfffd8, toneMapped: false }), haloM = new THREE.MeshBasicMaterial({ color: 0x8ff7ff, transparent: true, opacity: 0.35, depthWrite: false, toneMapped: false });
  for (const L of [lf, lf2]) { for (let i = 0; i < 7; i++) { const d = new THREE.Mesh(new THREE.SphereGeometry(0.0035, 6, 4), glowM); d.position.set(-0.04 + i * 0.013, 0.008, 0.012); L.add(d); } }
  const lure = new THREE.Mesh(new THREE.SphereGeometry(0.012, 10, 8), lureM); lure.position.set(-0.17, 0.11, 0); an.add(lure); const halo = new THREE.Mesh(new THREE.SphereGeometry(0.04, 12, 8), haloM); halo.position.copy(lure.position); an.add(halo);
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.002, 0.002, 0.11, 4), lm({ color: 0xcc8a77 })); rod.position.set(-0.15, 0.06, 0); rod.rotation.z = 0.5; an.add(rod);
  // the bubble: the deep animals up close
  const bub = zoomBubble({ at: V(0.72, 1.55, -0.85), r: 0.15, hide: [gauge, sign] }); g.add(bub); it.bubble = bub;
  // the descent
  it.depth = 0; it.maxDepth = 0; it.dMax = 3000; it.cupWhere = null; it.cup = null;
  it.light = (d) => 100 * Math.exp(-0.023 * d) * (d < 1 ? 1 : 1); // % of surface light (blue-green): 1 % at about 200 m
  it.temp = (d) => (d < 80 ? 28 - d * 0.02 : d < 1000 ? 26.4 - (26.4 - 5) * Math.pow((d - 80) / 920, 0.6) : 5 - 3 * clamp01((d - 1000) / 3000));
  it.press = (d) => 1 + d / 10;
  it.zone = (d) => (d <= 200.5 ? 'Sunlit zone' : d <= 1000.5 ? 'Twilight zone' : 'Midnight zone');
  it.setDepth = (d) => { it.depth = Math.max(0, Math.min(it.dMax, d)); it.maxDepth = Math.max(it.maxDepth, it.depth); setWater({ base: it.depth, dens: 0.05 + 0.02 * clamp01(it.depth / 300), light: Math.min(12, Math.exp(0.0115 * it.depth)) }); // light: the eye getting used to the dark (up to 12×), so 1 % of the light at 200 m is still a dim blue
    SNOW.uDrift.value = it.depth * 0.15;
    gauge.set([`${w_('Depth')}: ${Math.round(it.depth)} m · ${w_(it.zone(it.depth))}`, `${w_('Light')}: ${fmtPct(it.light(it.depth))} · ${it.temp(it.depth).toFixed(1)} °C · ${Math.round(it.press(it.depth))} ${w_('atm')}`], ['#ffd23f', '#ffffff']);
    if (it.cup) { const out = it.cupWhere === 'out'; const k = out ? Math.max(0.42, 1 - 0.58 * (1 - Math.exp(-it.maxDepth / 900))) : 1; it.cup.model.scale.set(k, k * 1.02, k); it.cupK = k; } };
  it.knobPath = () => [V(-0.32, 0.93, -0.56), V(0.32, 0.93, -0.56)];
  animator(it); const up0 = it.update; let T = 0;
  it.update = (dt, tt) => { up0(dt); const d = Math.min(dt || 0.016, 0.05); T += d;
    for (const z of zoo) { const on = it.depth >= z.band[0] && it.depth <= z.band[1]; if (z.shoal) { z.m.visible = on; if (on) z.m.tick(d, (t) => V(Math.cos(t * 0.15) * 3.5, 1.9, -4 + Math.sin(t * 0.15) * 1.5)); continue; }
      z.m.visible = on; if (!on) continue; z.a += d * 0.25; const p = z.path(z.a), p2 = z.path(z.a + 0.02); z.m.position.copy(p); z.m.rotation.y = ang(p2.x - p.x, p2.z - p.z); z.m.tick(d); }
    halo.scale.setScalar(1 + 0.2 * Math.sin(T * 3));
    const show = it.depth > 1500 ? an : it.depth > 320 && it.depth < 1300 ? lf : null;
    if (show && show.visible) { const p = show.position.clone().add(V(0, 0.03, 0)); bub.look(p, p.clone().add(V(0.05, 0.12, 0.42)), w_(show === an ? (it.lamp ? 'Anglerfish: red, so it is invisible in the dark' : 'Anglerfish: its glowing lure') : 'Lanternfish: rows of light organs')); } else bub.hideBubble();
    for (const f of ticks) f(d, tt); };
  it.views = { all: { p: V(0, 1.5, 0.55), t: V(0, 1.35, -2.5) }, panel: { p: V(0, 1.45, 0.1), t: V(0, 0.95, -0.7) }, cards: { p: V(-0.2, 1.35, 0.1), t: V(-0.3, 0.8, -1.5) }, up: { p: V(0, 1.4, 0.4), t: V(0, 2.6, -2.5) } };
  it.setDepth(0); it.say([w_('At the surface of the Indian Ocean')], '#ffffff');
  return done1(it, { height: 1.2, radius: 1.6 });
}
const fmtPct = (v) => (v >= 10 ? Math.round(v) + ' %' : v >= 0.01 ? v.toFixed(v >= 1 ? 1 : 2) + ' %' : v > 1e-6 ? v.toExponential(0).replace('e', '×10^') + ' %' : '0 %');
// a white foam (thermocol) cup
export function foamCup() { const g = new THREE.Group(); const t = CUPT.t || (CUPT.t = tex(128, 64, (x) => { x.fillStyle = '#f4f2ec'; x.fillRect(0, 0, 128, 64); const r = rnd(3); for (let i = 0; i < 300; i++) { x.fillStyle = `rgba(${r() < 0.5 ? '255,255,255' : '215,212,205'},0.6)`; x.beginPath(); x.arc(r() * 128, r() * 64, 1 + r() * 2, 0, TAU); x.fill(); } x.fillStyle = '#1f5fbf'; x.font = `700 16px ${FONT}`; x.fillText('DUET', 40, 38); }));
  const pts = [[0, 0], [0.026, 0], [0.04, 0.09], [0.042, 0.092], [0.038, 0.09], [0.024, 0.004], [0, 0.004]].map(([a, b]) => new THREE.Vector2(a, b));
  const m = new THREE.Mesh(new THREE.LatheGeometry(pts, 28), lm({ map: t, side: THREE.DoubleSide, dry: true })); m.castShadow = true; g.add(m); noHit(g); return g; }

// a tag let go near an animal sticks to the nearest bone (Do it: the tail tip); the trail grows for 4 s
export function bindSharkDolphin(sd, th, app, s, done = {}) {
  sd.tagNow = (who, tg, cb, p) => { const bone = p ? sd.boneNear(who, p) : sd.tailBone(who); if (!bone) { if (cb) cb(); return; } tg.flying = true; tg.noGrab = true; const p0 = tg.g.position.clone(); let k = 0;
    const __dt1 = clock(); const step = () => { k = Math.min(1, k + __dt1() * 60 / 40); tg.g.position.lerpVectors(p0, bone.getWorldPosition(V()), ease(k)); if (k < 1) requestAnimationFrame(step); else { sd.stick(who, tg, bone); setTimeout(() => { if (cb) cb(); }, 4000); } }; step(); };
  sd.measure = (who, thm, cb) => { if (sd.busy) return false; sd.busy = true; const grp = who === 'shark' ? sd.shark : sd.dolphin; thm.flying = true; const p0 = thm.g.position.clone(), home = thm.home.p.clone(); let k = 0, T0 = 22;
    const tgt = () => grp.position.clone().add(V(0, 0.18, 0)); const temp = sd.tempOf[who];
    const __dt2 = clock(); const step = () => { k = Math.min(1, k + __dt2() * 60 / 240); const a = clamp01(k / 0.2), b = clamp01((k - 0.8) / 0.2); thm.g.position.lerpVectors(p0, tgt(), ease(a)); if (k > 0.8) thm.g.position.lerpVectors(tgt(), home, ease(b));
      const now = T0 + (temp - T0) * clamp01((k - 0.2) / 0.45); sd.tSign.visible = k > 0.2; sd.tSign.position.copy(thm.g.position).add(V(0, 0.16, 0)); sd.tSign.set([`${now.toFixed(1)} °C`], temp > 30 ? '#ff8a6a' : '#7cd3ff');
      if (k < 1) requestAnimationFrame(step); else { thm.flying = false; thm.placed = false; sd.busy = false; sd.lastTemp = who; sd.temps = { ...(sd.temps || {}), [who]: temp };
        sd.say([`${sd.W(who === 'shark' ? 'Shark' : 'Dolphin')}: ${temp.toFixed(1)} °C`], temp > 30 ? '#ff8a6a' : '#7cd3ff'); if (cb) cb(); } }; step(); };
  for (const tg of th.tags) carry(tg, ['shark', 'dolphin'].map((who) => ({ at: () => (who === 'shark' ? sd.shark : sd.dolphin).position.clone(), r: 1.3, open: () => stepNow(app, who === 'shark' ? s.tag1 : s.tag2) && !sd.tags[who],
    put: (x) => { const p = x.g.position.clone(); sd.tagNow(who, x, () => done.tagged && done.tagged(), p); } })), { carryY: 1.0 });
  // the thermometer goes to whichever animal it is let go nearest to (their loops overlap, so not simply the first in reach)
  const nearest = () => { const p = th.thermo.g.getWorldPosition(V()); let best = null, bd = 1.3; for (const who of ['shark', 'dolphin']) { const q = (who === 'shark' ? sd.shark : sd.dolphin).position; const d = Math.hypot(p.x - q.x, p.z - q.z); if (d < bd) { bd = d; best = who; } } return best; };
  carry(th.thermo, [{ at: () => th.thermo.g.getWorldPosition(V()), r: 0.5, open: () => (stepNow(app, s.t1) || stepNow(app, s.t2)) && !sd.busy && !!nearest(),
    put: (x) => sd.measure(nearest(), x, () => done.temp && done.temp()) }], { carryY: 1.0 });
  const sync = slideKnob(th.knob, { path: () => sd.knobPath(), active: () => stepNow(app, s.clock), keepVisible: () => app.runner.i === s.clock, k: () => sd.t / sd.tMax,
    set: (k) => { sd.tTo = Math.max(sd.tTo || 0, k * sd.tMax); } });
  const s0 = sd.setT; sd.setT = (t) => { s0(t); sync(); };
  // the clock runs on to where the knob is (about a minute a second), so every breath on the way is seen
  const tick = clock(); let rang = false;
  const u0 = sd.update; sd.update = (dt, t) => { const d = tick(); sd.bubbleMode = app.runner.i === s.clock; if (!sd.bubbleMode) sd.bubble.hideBubble(); u0(dt, t);
    if (sd.tTo > sd.t + 1e-4) { sd.setT(Math.min(sd.tTo, sd.t + d * 0.9)); if (sd.t >= sd.tMax - 0.02 && !rang && done.clock) { rang = true; setTimeout(() => done.clock(), 1800); } } };
}
export function tagCheck(sd, who) {
  const s = sd.swing(who); if (!s) return null; const main = who === 'shark' ? s.side : s.up;
  if (main >= 0.05) return null;
  return who === 'shark' ? { ok: false, see: { en: 'Your tag hardly swings: it is stuck near the shark\'s head, not its tail.', hi: 'आपका टैग मुश्किल से हिल रहा है: वह शार्क की पूँछ पर नहीं, सिर के पास चिपका है।', hg: 'Aapka tag mushkil se hil raha hai: woh shark ki poonchh par nahi, sir ke paas chipka hai.' },
    why: { en: 'A fish swims by beating its tail; its head stays almost still. Put the tag on the tail fin to see how it moves.', hi: 'मछली अपनी पूँछ मारकर तैरती है; उसका सिर लगभग स्थिर रहता है। पूँछ कैसे चलती है, यह देखने के लिए टैग पूँछ के पंख पर लगाइए।', hg: 'Machhli apni poonchh maarkar tairti hai; uska sir lagbhag sthir rehta hai. Poonchh kaise chalti hai, yeh dekhne ke liye tag poonchh ke fin par lagaiye.' } }
    : { ok: false, see: { en: 'Your tag hardly moves up and down: it is stuck near the dolphin\'s head, not its tail.', hi: 'आपका टैग मुश्किल से ऊपर-नीचे हो रहा है: वह डॉल्फ़िन की पूँछ पर नहीं, सिर के पास चिपका है।', hg: 'Aapka tag mushkil se upar-neeche ho raha hai: woh dolphin ki poonchh par nahi, sir ke paas chipka hai.' },
      why: { en: 'The dolphin\'s power comes from its tail flukes. Put the tag on the flukes to see how they move.', hi: 'डॉल्फ़िन की ताक़त उसकी पूँछ के फ़्लूक से आती है। वे कैसे चलते हैं, यह देखने के लिए टैग फ़्लूक पर लगाइए।', hg: 'Dolphin ki taakat uski poonchh ke flukes se aati hai. Woh kaise chalte hain, yeh dekhne ke liye tag flukes par lagaiye.' } };
}
export function tempCheck(sd, who) {
  if (!sd.lastTemp || sd.lastTemp === who) return null; const other = sd.lastTemp;
  const nm = { shark: { en: 'the shark', hi: 'शार्क', hg: 'shark' }, dolphin: { en: 'the dolphin', hi: 'डॉल्फ़िन', hg: 'dolphin' } };
  return { ok: false, see: { en: `You held the thermometer against ${nm[other].en}: ${sd.tempOf[other]} °C.`, hi: `आपने थर्मामीटर ${nm[other].hi} से लगाया: ${sd.tempOf[other]} °C।`, hg: `Aapne thermometer ${nm[other].hg} se lagaya: ${sd.tempOf[other]} °C.` },
    why: { en: `This step asks for ${nm[who].en}. Hold the thermometer against it.`, hi: `इस स्टेप में ${nm[who].hi} का तापमान लेना है। थर्मामीटर उससे लगाइए।`, hg: `Is step mein ${nm[who].hg} ka temperature lena hai. Thermometer usse lagaiye.` } };
}
// the cup goes where it is let go (the basket outside, the shelf inside); the lever sets the depth (only down to the
// step's depth; in the last step only back up); the button switches the lamp
export function bindDive(sd, th, app, s, done = {}) {
  sd.putCup = (cup, where, cb) => { cup.flying = true; cup.g.traverse((x) => { if (x.material && x.material.userData.sw) x.material.userData.sw.uDry.value = where === 'out' ? 0 : 1; }); flyT(cup, (where === 'out' ? sd.at.out() : sd.at.in()).add(V(0, 0.002, 0)), 0, 0.8, () => { sd.cup = cup; sd.cupWhere = where; cup.flying = false; cup.noGrab = true; sd.setDepth(sd.depth); if (cb) cb(); }); };
  carry(th.cup, [['out', sd.at.out], ['in', sd.at.in]].map(([w, at]) => ({ at, r: 0.22, open: () => stepNow(app, s.cup) && !sd.cup, put: (x) => sd.putCup(x, w, () => done.cup && done.cup()) })), { carryY: 1.0 });
  const lim = { [s.d1]: 200, [s.d2]: 1000, [s.d3]: 3000 }; let fired = -1;
  const sync = slideKnob(th.lever, { path: () => sd.knobPath(), active: () => [s.d1, s.d2, s.d3, s.up].some((i) => stepNow(app, i)), keepVisible: () => [s.d1, s.d2, s.d3, s.up].includes(app.runner.i), k: () => sd.depth / sd.dMax,
    set: (k) => { const i = app.runner.i, d = k * sd.dMax; if (i === s.up) { sd.setDepth(Math.min(sd.depth, d)); if (sd.depth <= 2 && fired !== i) { fired = i; sd.setDepth(0); done.depth && done.depth(); } return; }
      const L = lim[i]; if (L == null) return; sd.setDepth(Math.min(L, Math.max(sd.depth, d))); if (sd.depth >= L - 1 && fired !== i) { fired = i; sd.setDepth(L); done.depth && done.depth(); } } });
  const s0 = sd.setDepth; sd.setDepth = (d) => { s0(d); sync(); };
  const lp = th.lamp.g.position.clone(); pushKnob(th.lamp, { path: () => [lp.clone(), lp.clone().add(V(0, 0, -0.06))], active: () => stepNow(app, s.lamp), keepVisible: () => true, press: () => { sd.setLamp(!sd.lamp); if (sd.lamp && done.lamp) done.lamp(); } });
}
