// DUET STEM · Science Lab 360 (also Chemistry, Physics, Biology and Maths, which run this code) — on Meta Quest, a black
// full-screen fade while an experiment is being set up.
//
// Meta's store check VRC.Quest.Performance.1 needs a steady 60+ fps, except while a loading screen or a full-screen
// fade is shown. Opening an experiment builds its apparatus or a 360° place, compiles shaders and sends textures to the
// GPU, which stalls the headset for a moment. So in VR on a Quest the view goes black at once, the action runs as before (nothing in
// the app waits for the fade), and the view stays black until the new files have arrived, every shader of the scene is
// compiled (in parallel where the browser can), the textures are on the GPU (a few per frame) and frames are quick
// again; then it fades in (at most 8 s black). Phones, VR boxes and computers are unchanged.
import * as THREE from 'three';

export function installQuestFade(app) {
  if (!/OculusBrowser|Quest|Pico/i.test(navigator.userAgent)) return null;
  const R = app.renderer, S = app.scene, cam = app.camera;
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 8), new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.BackSide, transparent: true, opacity: 0, depthTest: false, depthWrite: false, fog: false }));
  mesh.renderOrder = 1e9; mesh.frustumCulled = false; mesh.visible = false; mesh.name = 'questFade';
  if (!cam.parent) S.add(cam);
  cam.add(mesh);

  // files still loading (every three.js loader reports to the default manager)
  const M = THREE.DefaultLoadingManager; const files = M.__duetN || (M.__duetN = { n: 0 });
  if (!M.__duetWrapped) { M.__duetWrapped = 1; const s0 = M.itemStart.bind(M), e0 = M.itemEnd.bind(M); M.itemStart = (u) => { files.n++; s0(u); }; M.itemEnd = (u) => { files.n = Math.max(0, files.n - 1); e0(u); }; }

  const F = { a: 0, to: 0, on: false, t0: 0, step: 0, tex: null, good: 0, wait: null, compiling: false, last: 0, depth: 0 };
  const TEXK = ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'aoMap', 'emissiveMap', 'alphaMap', 'bumpMap', 'lightMap', 'specularMap', 'displacementMap', 'clearcoatNormalMap', 'sheenColorMap', 'transmissionMap'];
  const textures = () => { const seen = new Set(), out = []; const add = (t) => { if (t && t.isTexture && !t.isCubeTexture && !t.isVideoTexture && !t.isRenderTargetTexture && t.image && !seen.has(t)) { seen.add(t); out.push(t); } };
    S.traverse((o) => { const ms = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : []; for (const m of ms) { if (!m) continue; for (const k of TEXK) add(m[k]); if (m.uniforms) for (const k in m.uniforms) { const v = m.uniforms[k] && m.uniforms[k].value; if (v && v.isTexture) add(v); } } }); return out; };

  function black() { F.a = F.to = 1; mesh.material.opacity = 1; mesh.visible = true; F.on = true; F.t0 = performance.now(); F.step = 0; F.tex = null; F.good = 0; F.compiling = false; }
  function done() { F.on = false; F.to = 0; F.wait = null; }

  // per frame, before the app's own frame
  function tick() {
    const now = performance.now(), ms = F.last ? now - F.last : 16; F.last = now;
    if (!R.xr.isPresenting) { if (F.a || F.on) { F.a = F.to = 0; F.on = false; mesh.visible = false; } return; }
    if (F.on) {
      const el = now - F.t0;
      if (el > 8000) done();
      else if (F.step === 0) { if (el > 200 && !files.n && !F.wait) F.step = 1; }
      else if (F.step === 1) { if (!F.compiling) { F.compiling = true; const p = R.compileAsync ? R.compileAsync(S, cam) : (R.compile(S, cam), Promise.resolve()); Promise.resolve(p).catch(() => {}).then(() => { F.tex = textures(); F.step = 2; }); } }
      else if (F.step === 2) { const t0 = performance.now(); while (F.tex.length && performance.now() - t0 < 6) { try { R.initTexture(F.tex.pop()); } catch (e) {} } if (!F.tex.length) F.step = 3; }
      else { F.good = ms < 20 ? F.good + 1 : 0; if (F.good >= 8) done(); }
    } else if (F.a > 0) { F.a = Math.max(0, F.a - Math.min(ms, 50) / 250); mesh.material.opacity = F.a; mesh.visible = F.a > 0.001; }
  }
  const f0 = app.frame; app.frame = function () { tick(); return f0.apply(this, arguments); };

  // the actions that build a scene: black at once, run as before, settle
  const wrap = (name) => { const f = app[name]; if (typeof f !== 'function') return; app[name] = function (...args) {
    if (!R.xr.isPresenting || F.depth || (name === 'openExp' && app.isLocked && app.isLocked(args[0]))) return f.apply(this, args); // a locked one only asks for the school code: nothing to load
    black(); F.depth++; let r; try { r = f.apply(this, args); } finally { F.depth--; F.t0 = performance.now(); } // the 8 s limit counts from when the action has run (in VR an experiment is built at once)
    if (r && typeof r.then === 'function') { const w = F.wait = Promise.resolve(r).catch(() => {}).then(() => { if (F.wait === w) F.wait = null; }); }
    return r;
  }; };
  ['openExp'].forEach(wrap);
  // entering VR while the lab is still loading: black until its files, shaders and textures are ready
  R.xr.addEventListener('sessionstart', () => { black(); });
  return { state: () => ({ a: +F.a.toFixed(2), on: F.on, step: F.step, files: files.n }) };
}
