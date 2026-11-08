// Materials for the lab: clear glass with a Fresnel edge, liquids that stay level when the glass tilts,
// and small canvas textures (wood, tiles, epoxy, labels) so nothing needs downloading.
import * as THREE from 'three';

export const SHARED = { env: null };

// ------------------------------------------------------------------ glass
export function glassMat(o = {}) {
  const m = new THREE.MeshPhysicalMaterial({
    color: o.color ?? 0xffffff, roughness: o.rough ?? 0.035, metalness: 0, transparent: true, opacity: o.opacity ?? 0.1,
    clearcoat: 1, clearcoatRoughness: 0.03, envMapIntensity: o.env ?? 1.6, side: THREE.DoubleSide, depthWrite: false, ior: 1.5,
  });
  const edge = o.edge ?? 0.5;
  m.onBeforeCompile = (s) => {
    s.fragmentShader = s.fragmentShader.replace('#include <opaque_fragment>', `
      float frs = pow(1.0 - abs(dot(normalize(vViewPosition), normal)), 3.4);
      diffuseColor.a = clamp(mix(diffuseColor.a, ${edge.toFixed(2)}, frs), 0.0, 1.0);
      outgoingLight += vec3(0.07, 0.08, 0.09) * frs;
      #include <opaque_fragment>`);
  };
  m.customProgramCacheKey = () => 'glass' + edge;
  return m;
}

// ------------------------------------------------------------------ liquid
// Draw the inside volume of a vessel; fragments above the (world) level are dropped and the back faces
// that remain look like the flat surface. Sediment sits at the bottom in object space.
export function liquidMat() {
  const u = {
    uLevel: { value: 0 }, uWob: { value: new THREE.Vector2() }, uCen: { value: new THREE.Vector3() },
    uSurf: { value: new THREE.Color(0xffffff) }, uCloud: { value: 0 }, uCloudCol: { value: new THREE.Color(0xffffff) },
    uSed: { value: -1 }, uSedCol: { value: new THREE.Color(0xffffff) }, uAlpha: { value: 0.55 },
  };
  const m = new THREE.MeshStandardMaterial({ color: 0x88aaff, roughness: 0.08, metalness: 0, transparent: true, side: THREE.DoubleSide, envMapIntensity: 1.2 });
  m.userData.u = u;
  m.onBeforeCompile = (s) => {
    Object.assign(s.uniforms, u);
    s.vertexShader = s.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWP; varying float vLY;')
      .replace('#include <project_vertex>', '#include <project_vertex>\nvWP = (modelMatrix * vec4(transformed,1.0)).xyz; vLY = transformed.y;');
    s.fragmentShader = s.fragmentShader.replace('#include <common>', `#include <common>
      varying vec3 vWP; varying float vLY; uniform float uLevel; uniform vec2 uWob; uniform vec3 uCen; uniform vec3 uSurf;
      uniform float uCloud; uniform vec3 uCloudCol; uniform float uSed; uniform vec3 uSedCol; uniform float uAlpha;`)
      .replace('#include <clipping_planes_fragment>', `#include <clipping_planes_fragment>
      float lvl = uLevel + dot(vWP.xz - uCen.xz, uWob);
      if (vWP.y > lvl) discard;
      bool isSed = vLY < uSed;`)
      .replace('#include <color_fragment>', `#include <color_fragment>
      diffuseColor.rgb = mix(diffuseColor.rgb, uCloudCol, uCloud);
      diffuseColor.a = mix(uAlpha, 0.96, uCloud);
      if (!gl_FrontFacing) { diffuseColor.rgb = mix(diffuseColor.rgb, uSurf, 0.35); }
      if (isSed) { diffuseColor.rgb = uSedCol; diffuseColor.a = 1.0; }`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
      roughnessFactor = mix(roughnessFactor, 0.8, uCloud); if (isSed) roughnessFactor = 0.95; // powders and precipitates are matte`)
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
      if (!gl_FrontFacing && !isSed) normal = normalize((viewMatrix * vec4(0.0, 1.0, 0.0, 0.0)).xyz);`);
  };
  m.customProgramCacheKey = () => 'liquid2';
  return m;
}

// ------------------------------------------------------------------ canvas textures
function canvasTex(w, h, draw, o = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = o.data ? THREE.NoColorSpace : THREE.SRGBColorSpace;
  t.anisotropy = 8; if (o.repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(o.repeat[0], o.repeat[1]); }
  return t;
}
const rnd = (() => { let s = 1234567; return () => ((s = (s * 16807) % 2147483647) / 2147483647); })();

export function woodTex(base = '#8a5a34', rep = [1, 1]) {
  return canvasTex(512, 512, (x, w, h) => {
    x.fillStyle = base; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 160; i++) {
      const y = rnd() * h, a = 0.03 + rnd() * 0.08;
      x.strokeStyle = `rgba(${rnd() < 0.5 ? '40,20,8' : '255,220,170'},${a})`; x.lineWidth = 1 + rnd() * 3;
      x.beginPath(); x.moveTo(0, y);
      for (let px = 0; px <= w; px += 32) x.lineTo(px, y + Math.sin(px * 0.01 + i) * 6 + (rnd() - 0.5) * 2);
      x.stroke();
    }
  }, { repeat: rep });
}
export function tileTex(col = '#e9ece8', grout = '#c9cdc8', n = 4, rep = [1, 1]) {
  return canvasTex(512, 512, (x, w, h) => {
    x.fillStyle = grout; x.fillRect(0, 0, w, h);
    const s = w / n;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      const g = x.createLinearGradient(i * s, j * s, i * s + s, j * s + s);
      g.addColorStop(0, col); g.addColorStop(1, shade(col, -6 + rnd() * 4));
      x.fillStyle = g; x.fillRect(i * s + 3, j * s + 3, s - 6, s - 6);
    }
  }, { repeat: rep });
}
export function speckTex(base = '#1d2023', dots = '#3a3f44', rep = [1, 1], n = 6000) {
  return canvasTex(512, 512, (x, w, h) => {
    x.fillStyle = base; x.fillRect(0, 0, w, h);
    for (let i = 0; i < n; i++) { x.fillStyle = rnd() < 0.5 ? dots : shade(base, 6); x.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 2, 1 + rnd() * 2); }
  }, { repeat: rep });
}
export function shade(hex, pct) {
  const n = parseInt(hex.slice(1), 16); const f = (v) => Math.max(0, Math.min(255, Math.round(v * (1 + pct / 100))));
  return '#' + ((f(n >> 16) << 16) | (f((n >> 8) & 255) << 8) | f(n & 255)).toString(16).padStart(6, '0');
}
// bottle / poster labels
export function labelTex(lines, o = {}) {
  const W = o.w ?? 512, H = o.h ?? 256;
  return canvasTex(W, H, (x, w, h) => {
    x.fillStyle = o.bg ?? '#f6f1e3'; x.fillRect(0, 0, w, h);
    x.strokeStyle = o.border ?? '#7a6a52'; x.lineWidth = 8; x.strokeRect(10, 10, w - 20, h - 20);
    if (o.band) { x.fillStyle = o.band; x.fillRect(10, 10, w - 20, 34); }
    x.textAlign = 'center'; x.textBaseline = 'middle';
    const L = lines.length; const lh = (h - 50) / Math.max(L, 1);
    lines.forEach((ln, i) => {
      const sz = ln.size ?? (i === 0 ? 74 : 40);
      x.font = `${ln.w ?? 700} ${sz}px "Noto Sans Devanagari", sans-serif`; x.fillStyle = ln.c ?? '#1d1a15';
      x.fillText(ln.t, w / 2, 40 + lh * (i + 0.55), w - 40);
    });
    if (o.hazard) { // small orange hazard diamond
      x.save(); x.translate(w - 58, h - 58); x.rotate(Math.PI / 4); x.fillStyle = '#f28c28'; x.fillRect(-22, -22, 44, 44); x.restore();
      x.fillStyle = '#1d1a15'; x.font = '700 30px sans-serif'; x.fillText('!', w - 58, h - 56);
    }
  });
}
export { canvasTex };
