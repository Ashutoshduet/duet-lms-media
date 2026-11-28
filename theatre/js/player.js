// "Kyun?" theatre player: plays one story (a few KB of script) as a real-time 3D film.
// - Screen: drag to turn the scene, pinch or wheel to come closer; pause, scrub, resume.
// - VR box: side-by-side picture for a phone in a VR box; turn your head to look around.
// - Quest: WebXR. Trigger = pause / play, thumbstick = scrub, B = leave.
// The narration (Hindi / English) sets the length of every beat; captions in English, Hindi or Hinglish.
import * as THREE from 'three';
import { Kit, LOADED, FONT, Label } from './kit.js';
import { Panel } from './ui3d.js';
import * as PARTS from './parts.js';

const Q = new URLSearchParams(location.search);
const UA = navigator.userAgent;
export const QUEST = /OculusBrowser|Quest|Pico/i.test(UA);
export const PHONE = !QUEST && (/Android|iPhone|iPad|iPod|Mobi/i.test(UA) || !!window.DuetNative);
const store = { get(k) { try { return localStorage.getItem('kt.' + k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem('kt.' + k, v); } catch (e) { /* private mode */ } } };
export { store };
// narration file key: djb2 over UTF-16 code units (the same function as the Science Lab's voice files)
export function vkey(s) { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0; return h.toString(36); }
export const LANGS = ['en', 'hi', 'hg'];
export const voiceLang = (l) => (l === 'en' ? 'en' : 'hi'); // Hinglish: Hindi voice, Roman captions
const GAP = 0.55, MIN_BEAT = 2.6;
const clamp01 = (u) => (u < 0 ? 0 : u > 1 ? 1 : u);
const io = (u) => u * u * (3 - 2 * u);
const V3 = (a) => new THREE.Vector3(...a);

export class Player {
  constructor(dom) {
    this.dom = dom; this.lang = 'en'; this.mode = 'screen'; this.state = 'idle'; this.t = 0; this.rate = 1; this.muted = false;
    this.lite = PHONE || QUEST || Q.has('lite');
    const r = this.renderer = new THREE.WebGLRenderer({ antialias: !PHONE, powerPreference: 'high-performance', preserveDrawingBuffer: Q.has('shot') });
    if (window.DuetPerf) DuetPerf.watch(r); else r.setPixelRatio(Math.min(devicePixelRatio, 2));
    r.setSize(innerWidth, innerHeight); r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.0; r.outputColorSpace = THREE.SRGBColorSpace;
    r.xr.enabled = true; r.xr.setReferenceSpaceType('local'); r.xr.setFoveation(1);
    r.info.autoReset = false; // draw calls are counted over the whole frame (the bubble's own scene too)
    dom.stage.appendChild(r.domElement);
    this.parallel = !!r.getContext().getExtension('KHR_parallel_shader_compile');
    this.scene = new THREE.Scene(); this.pmrem = new THREE.PMREMGenerator(r);
    // the same two lights in every story (their count never changes, so no shader is rebuilt mid-story); no shadows
    this.hemi = new THREE.HemisphereLight(0xdfeaff, 0x6b5a44, 0.4); this.sun = new THREE.DirectionalLight(0xfff4e4, 2); this.sun.target.position.set(0, 0, 0);
    this.scene.add(this.hemi, this.sun, this.sun.target);
    this.world = new THREE.Group(); this.scene.add(this.world);
    this.camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.02, 900);
    this.dolly = new THREE.Group(); this.dolly.add(this.camera); this.scene.add(this.dolly);
    this.stereo = new THREE.StereoCamera(); this.stereo.eyeSep = 0.064;
    // the zoom bubble: its own little scene, drawn into a texture and shown in a round window beside the real thing
    const ms = new THREE.Scene(); ms.background = new THREE.Color(0x0b1424);
    ms.add(new THREE.HemisphereLight(0xe8f0ff, 0x223044, 1.1)); const md = new THREE.DirectionalLight(0xffffff, 2.2); md.position.set(1, 2, 3); ms.add(md);
    const rtS = this.lite ? 384 : 512;
    this.micro = { scene: ms, camera: new THREE.PerspectiveCamera(40, 1, 0.01, 50), rt: new THREE.WebGLRenderTarget(rtS, rtS, { samples: this.lite ? 0 : 4 }) };
    this.micro.camera.position.set(0, 0, 3);
    this.bubble = this.makeBubble();
    // headset / VR box panels: captions and a middle card (countdown, pause, the end)
    this.hud = new THREE.Group(); this.scene.add(this.hud); this.hud.visible = false;
    this.capP = new Panel(1.5, 0.3, 1400, 280); this.capP.mesh.position.set(0, -0.42, -1.25); this.hud.add(this.capP.mesh);
    this.midP = new Panel(1.0, 0.56, 1000, 560); this.midP.mesh.position.set(0, 0.02, -1.4); this.hud.add(this.midP.mesh); this.midP.mesh.visible = false;
    this.user = { yaw: 0, pitch: 0, zoom: 1, back: 0, drag: false, last: 0 };
    this.head = { q: new THREE.Quaternion(), yaw0: null, ori: null, mouse: { yaw: 0, pitch: 0 } };
    this.frames = []; this.maxFrame = 0; this.lastNow = 0; this.ff = +(Q.get('ff') || 0);
    this.audio = null; this.buffers = {}; this.src = null; this.srcBeat = -1;
    this.lengths = null;
    this.bindInput();
    addEventListener('resize', () => this.resize());
    r.setAnimationLoop((now, frame) => this.frame(now, frame));
    window.THEATRE = this; // tests and the home page read the state through this
  }
  // ---------------------------------------------------------------- the round zoom window
  makeBubble() {
    const g = new THREE.Group(); g.visible = false; g.renderOrder = 30;
    const disc = new THREE.Mesh(new THREE.CircleGeometry(1, 64), new THREE.MeshBasicMaterial({ map: this.micro.rt.texture, depthTest: false, depthWrite: false, transparent: true }));
    const ring = new THREE.Mesh(new THREE.RingGeometry(1, 1.055, 64), new THREE.MeshBasicMaterial({ color: 0xfff3dc, depthTest: false, depthWrite: false, transparent: true, toneMapped: false }));
    const halo = new THREE.Mesh(new THREE.RingGeometry(1.055, 1.16, 64), new THREE.MeshBasicMaterial({ color: 0x000000, depthTest: false, depthWrite: false, transparent: true, opacity: 0.28 }));
    disc.renderOrder = 31; ring.renderOrder = 32; halo.renderOrder = 30;
    g.add(halo, disc, ring);
    const lineG = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(1, 0, 0)]);
    const line = new THREE.Line(lineG, new THREE.LineDashedMaterial({ color: 0xfff3dc, dashSize: 0.02, gapSize: 0.012, depthTest: false, transparent: true, toneMapped: false })); line.renderOrder = 32; line.frustumCulled = false;
    const dot = new THREE.Mesh(new THREE.RingGeometry(0.55, 1, 32), new THREE.MeshBasicMaterial({ color: 0xfff3dc, depthTest: false, transparent: true, toneMapped: false, side: THREE.DoubleSide })); dot.renderOrder = 32;
    this.scene.add(g, line, dot); line.visible = dot.visible = false;
    const tag = { label: null };
    return { g, disc, ring, line, dot, tag, on: 0, cfg: null };
  }
  placeBubble(camPos, camQuat, fovDeg) {
    const B = this.bubble, c = B.cfg, on = B.on;
    const vis = on > 0.001 && c; B.g.visible = B.line.visible = B.dot.visible = !!vis; if (B.tag.label) B.tag.label.obj.visible = !!vis;
    if (!vis) return false;
    const f = V3(c.focus), dist = Math.max(0.05, f.distanceTo(camPos));
    const h = 2 * dist * Math.tan(THREE.MathUtils.degToRad(fovDeg) / 2); // height of the view at the focus
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camQuat), up = new THREE.Vector3(0, 1, 0).applyQuaternion(camQuat);
    const size = (c.size ?? 0.2) * h, side = c.side || 'right';
    const off = (c.off ?? 0.28) * h; const s = side === 'left' ? -1 : 1;
    const centre = f.clone().addScaledVector(right, side === 'up' ? 0 : s * (off + size * 0.35)).addScaledVector(up, side === 'up' ? off + size * 0.4 : (c.dy ?? 0.12) * h);
    if (c.at) centre.copy(V3(c.at));
    B.g.position.copy(centre); B.g.quaternion.copy(camQuat); B.g.scale.setScalar(size * Math.max(0.001, on));
    // the dashed line from the real thing to the edge of the window
    const dir = f.clone().sub(centre); const edge = centre.clone().addScaledVector(dir.clone().normalize(), size * on * 1.06);
    const p = B.line.geometry.attributes.position; p.setXYZ(0, f.x, f.y, f.z); p.setXYZ(1, edge.x, edge.y, edge.z); p.needsUpdate = true; B.line.computeLineDistances(); B.line.geometry.computeBoundingSphere();
    B.line.material.dashSize = h * 0.012; B.line.material.gapSize = h * 0.008; B.line.material.opacity = on;
    B.dot.position.copy(f); B.dot.quaternion.copy(camQuat); B.dot.scale.setScalar(h * 0.012 * on);
    this.setBubbleLabel(c.label); if (B.tag.label) { const L = B.tag.label.obj; L.visible = !!c.label; L.position.copy(centre).addScaledVector(up, -size * on * 1.2); L.scale.set((B.tag.aspect || 3) * h * 0.04, h * 0.04, 1); L.material.opacity = on; }
    return true;
  }
  // the name under the window ("inside the water" …), redrawn only when it changes
  setBubbleLabel(text) {
    const T = this.bubble.tag; const key = text ? JSON.stringify(text) + this.lang : '';
    if (T.key === key) return; T.key = key; if (!T.label) return;
    T.label.text = text || ' '; T.label.draw(this.lang); T.aspect = T.label.obj.scale.x / T.label.obj.scale.y;
  }
  // ---------------------------------------------------------------- loading a story
  async open(id, o = {}) {
    this.close(true);
    this.id = id; this.lang = LANGS.includes(o.lang) ? o.lang : 'en'; this.state = 'loading'; this.t = 0; this.errors = [];
    const tok = (this.tok = (this.tok || 0) + 1);
    this.ui('loading');
    const [mod] = await Promise.all([import(`../stories/${id}.js`), this.loadLengths(), document.fonts && document.fonts.load ? Promise.all([document.fonts.load(`700 40px ${FONT}`), document.fonts.load(`700 40px ${FONT}`, 'कखग')]).catch(() => {}) : null]);
    if (tok !== this.tok) return;
    const S = this.story = mod.default;
    const K = this.K = new Kit(this); K.P = this; K.parts = PARTS;
    this.scene.environment = null; this.scene.environmentIntensity = 1;
    this.micro.scene.background = new THREE.Color(0x0b1424);
    this.objs = await S.build(K);
    if (tok !== this.tok) return;
    { const L = new Label(' ', { size: 1, px: 44, bg: 'rgba(12,16,24,0.84)', border: 'rgba(255,243,220,0.7)', depthTest: false }); L.draw(this.lang); L.obj.renderOrder = 33; L.obj.visible = false; this.scene.add(L.obj); K.labels.push(L); this.bubble.tag = { label: L, key: null, aspect: 3 }; }
    this.compile();
    await this.loadAudio();
    if (tok !== this.tok) return;
    await this.warm();
    if (tok !== this.tok) return;
    this.state = 'ready'; this.t = 0; this.evaluate(0, true);
    this.ui('ready');
    if (this.ff || Q.has('auto')) this.start(true);
  }
  close(keep) {
    this.stopAudio(); this.tok = (this.tok || 0) + 1;
    if (this.K) { this.K.dispose(); }
    for (const c of [...this.world.children]) this.world.remove(c);
    for (const c of [...this.micro.scene.children]) if (!c.isLight) this.micro.scene.remove(c);
    if (this.bubble.tag.label) { this.scene.remove(this.bubble.tag.label.obj); this.bubble.tag = { label: null }; }
    this.bubble.on = 0; this.bubble.cfg = null; this.K = null; this.story = null; this.beats = null; this.state = 'idle';
    if (!keep) this.ui('closed');
  }
  async loadLengths() { if (this.lengths) return; try { this.lengths = await (await fetch('voice/lengths.json')).json(); } catch (e) { this.lengths = { en: {}, hi: {} }; } }
  // ---------------------------------------------------------------- timeline
  compile() {
    const S = this.story, K = this.K, vl = voiceLang(this.lang);
    K.resetChannels(); K.actions = []; K.channels = new Map();
    this.beats = []; let t = 0;
    S.beats.forEach((b, i) => {
      const text = b.say ? (b.say[vl] || b.say.en) : '';
      const key = text ? vkey(text) : null; const len = key && this.lengths[vl] && this.lengths[vl][key];
      const est = text ? text.split(/\s+/).length / (vl === 'en' ? 2.5 : 2.3) : 0;
      const clip = len || est; const dur = Math.max(MIN_BEAT, clip + GAP) + (b.hold || 0);
      this.beats.push({ i, t0: t, t1: t + dur, dur, clip, key, has: !!len, b });
      t += dur;
    });
    this.dur = t;
    // camera keys, each from where the previous one ended
    const c0 = typeof S.cam0 === 'function' ? S.cam0(this.objs) : S.cam0;
    this.camKeys = []; let pose = { p: V3(c0.p), at: V3(c0.at), fov: c0.fov || 50 };
    this.cam0 = pose;
    for (const B of this.beats) {
      const c = typeof B.b.cam === 'function' ? B.b.cam(this.objs) : B.b.cam; if (!c) continue;
      const t0 = B.t0 + (c.at0 ?? 0) * B.dur, t1 = c.cut ? t0 : t0 + (c.len ?? 0.85) * B.dur;
      const to = { p: V3(c.p), at: V3(c.at), fov: c.fov || pose.fov };
      const k = { t0, t1, tEnd: B.t1, from: pose, to, orbit: THREE.MathUtils.degToRad(c.orbit || 0), ease: c.ease || io };
      this.camKeys.push(k);
      const endP = to.p.clone().sub(to.at).applyAxisAngle(new THREE.Vector3(0, 1, 0), k.orbit).add(to.at);
      pose = { p: endP, at: to.at.clone(), fov: to.fov };
    }
    // actions: fractions of the beat become story seconds
    const flat = (a) => (Array.isArray(a) ? a.flatMap(flat) : a ? [a] : []);
    for (const B of this.beats) {
      if (!B.b.do) continue;
      for (const a of flat(B.b.do(this.objs, K, B))) { a.t0 = B.t0 + a.at * B.dur; a.t1 = a.t0 + a.len * B.dur; K.actions.push(a); }
    }
    K.actions.sort((a, b) => a.t0 - b.t0);
    K.captureBase();
  }
  // the scene exactly as it is at story time T
  evaluate(T) {
    const K = this.K; if (!K) return;
    K.resetChannels();
    for (const a of K.actions) { if (a.t0 > T) break; const u = a.t1 > a.t0 ? clamp01((T - a.t0) / (a.t1 - a.t0)) : 1; a.apply(a.ease(u), T); }
    for (const f of K.ticks) f(T);
    this.beatAt(T);
  }
  beatAt(T) {
    const bs = this.beats; let i = bs.findIndex((b) => T < b.t1); if (i < 0) i = bs.length - 1;
    if (i !== this.curBeat) { this.curBeat = i; this.caption(); }
    return i;
  }
  pose(T) {
    let k = null; for (const c of this.camKeys) { if (c.t0 <= T) k = c; else break; }
    if (!k) return { p: this.cam0.p.clone(), at: this.cam0.at.clone(), fov: this.cam0.fov };
    const u = k.t1 > k.t0 ? k.ease(clamp01((T - k.t0) / (k.t1 - k.t0))) : 1;
    const p = k.from.p.clone().lerp(k.to.p, u), at = k.from.at.clone().lerp(k.to.at, u), fov = k.from.fov + (k.to.fov - k.from.fov) * u;
    if (k.orbit) { const w = io(clamp01((T - k.t0) / Math.max(0.01, k.tEnd - k.t0))); p.sub(at).applyAxisAngle(new THREE.Vector3(0, 1, 0), k.orbit * w).add(at); }
    return { p, at, fov };
  }
  // ---------------------------------------------------------------- shaders and pictures ready before the 3-2-1
  // (the test phone compiles one shader at a time: every material is compiled now, with everything shown once)
  compileAll() {
    const r = this.renderer, hidden = [];
    const showAll = (root) => root.traverse((n) => { if (!n.visible) { hidden.push(n); n.visible = true; } });
    showAll(this.world); showAll(this.micro.scene); showAll(this.hud);
    const bubbleVis = [this.bubble.g.visible, this.bubble.line.visible, this.bubble.dot.visible]; this.bubble.g.visible = this.bubble.line.visible = this.bubble.dot.visible = true;
    if (this.bubble.tag.label) this.bubble.tag.label.obj.visible = true;
    const tex = new Set(); const grab = (root) => root.traverse((n) => { const ms = n.material ? (Array.isArray(n.material) ? n.material : [n.material]) : []; for (const m of ms) { for (const k of ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'emissiveMap', 'alphaMap', 'aoMap']) if (m[k]) tex.add(m[k]); if (m.uniforms) for (const u of Object.values(m.uniforms)) if (u.value && u.value.isTexture) tex.add(u.value); } });
    grab(this.world); grab(this.micro.scene);
    return { r, hidden, tex, done: () => { for (const n of hidden) n.visible = false; [this.bubble.g.visible, this.bubble.line.visible, this.bubble.dot.visible] = bubbleVis; } };
  }
  async warm() {
    const t0 = performance.now(); const c = this.compileAll(); const r = c.r;
    try {
      for (const t of c.tex) r.initTexture(t);
      if (this.parallel && r.compileAsync) { await r.compileAsync(this.scene, this.camera); await r.compileAsync(this.micro.scene, this.micro.camera); }
      else { r.compile(this.scene, this.camera); r.compile(this.micro.scene, this.micro.camera); }
      // one real frame of each scene too (render states, instancing buffers)
      r.setRenderTarget(this.micro.rt); r.render(this.micro.scene, this.micro.camera); r.setRenderTarget(null);
      this.pose0(); r.render(this.scene, this.camera);
    } catch (e) { console.warn('warm', e); }
    c.done();
    this.warmMs = Math.round(performance.now() - t0); this.programs = r.info.programs.length;
  }
  pose0() { const p = this.pose(this.t); this.camera.position.copy(p.p); this.camera.lookAt(p.at); this.camera.fov = p.fov; this.camera.updateProjectionMatrix(); }
  // ---------------------------------------------------------------- audio (Web Audio: exact starts, pause and seek)
  ctx() { if (!this.audio) { try { this.audio = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { this.audio = null; } } return this.audio; }
  async loadAudio() {
    const vl = voiceLang(this.lang), ctx = this.ctx(); this.buffers = {}; this.audioErr = [];
    if (!ctx) return;
    await Promise.all(this.beats.filter((b) => b.key).map(async (b) => {
      const url = `voice/${vl}/${b.key}.mp3`;
      try { const r = await fetch(url); if (!r.ok) throw new Error(r.status); const buf = await r.arrayBuffer(); this.buffers[b.key] = await new Promise((ok, no) => ctx.decodeAudioData(buf, ok, no)); LOADED.push(url); }
      catch (e) { this.audioErr.push(url); }
    }));
  }
  stopAudio() { if (this.src) { try { this.src.onended = null; this.src.stop(); } catch (e) { /* stopped */ } this.src = null; } this.srcBeat = -1; }
  syncAudio() {
    if (this.state !== 'play' || this.muted || this.rate !== 1 || !this.audio) { if (this.src) this.stopAudio(); return; }
    const B = this.beats[this.curBeat]; if (!B) return;
    const off = this.t - B.t0;
    if (this.srcBeat === B.i) return;
    this.stopAudio(); const buf = B.key && this.buffers[B.key];
    if (!buf || off >= buf.duration - 0.05) { this.srcBeat = B.i; return; }
    const s = this.audio.createBufferSource(); s.buffer = buf; s.connect(this.audio.destination); s.start(0, Math.max(0, off));
    this.src = s; this.srcBeat = B.i; this.srcT0 = this.audio.currentTime - Math.max(0, off); this.srcB = B;
  }
  // ---------------------------------------------------------------- play / pause / seek
  start(skipCount) {
    if (!this.story) return;
    const c = this.ctx(); if (c && c.state === 'suspended') c.resume();
    if (this.state === 'end') this.t = 0;
    if (skipCount || this.ff) { this.go(); return; }
    this.state = 'count'; this.countT = performance.now(); this.ui('count');
  }
  go() { this.state = 'play'; this.ui('play'); this.syncAudio(); }
  pause() { if (this.state === 'play') { this.state = 'pause'; this.stopAudio(); this.ui('pause'); } }
  resume() { if (this.state === 'pause' || this.state === 'ready') { const c = this.ctx(); if (c && c.state === 'suspended') c.resume(); this.state = 'play'; this.user.back = performance.now(); this.ui('play'); this.syncAudio(); } else if (this.state === 'end') { this.t = 0; this.start(); } }
  toggle() { if (this.state === 'play') this.pause(); else if (this.state === 'ready') this.start(); else if (this.state === 'count') { /* wait */ } else this.resume(); }
  seek(T) {
    if (!this.story) return; this.t = Math.max(0, Math.min(this.dur - 0.01, T)); this.stopAudio();
    if (this.state === 'end') this.state = 'pause';
    this.evaluate(this.t); this.syncAudio(); this.ui('time');
  }
  skip(d) { this.seek(this.t + d); }
  setLang(l) {
    if (!LANGS.includes(l) || l === this.lang) return; const old = voiceLang(this.lang); this.lang = l; store.set('lang', l);
    if (!this.story) return;
    const bi = this.curBeat ?? 0, frac = this.beats[bi] ? (this.t - this.beats[bi].t0) / this.beats[bi].dur : 0;
    this.K.relabel(l); this.bubble.tag.key = null;
    const was = this.state; this.stopAudio(); this.compile(); this.curBeat = -1;
    const nb = this.beats[bi]; this.t = nb ? nb.t0 + frac * nb.dur : 0; this.evaluate(this.t);
    if (voiceLang(l) !== old) { this.state = 'loading-voice'; this.loadAudio().then(() => { this.state = was; this.syncAudio(); this.ui('lang'); }); }
    this.ui('lang');
  }
  // ---------------------------------------------------------------- the end: the matching activity
  links() {
    const S = this.story; if (!S) return [];
    return (S.links || []).map((L) => ({ href: linkHref(L, this.lang, this.mode), title: L.title, app: L.app }));
  }
  // ---------------------------------------------------------------- each frame
  frame(now, xrFrame) {
    const dtw = this.lastNow ? Math.min(0.25, (now - this.lastNow) / 1000) : 0; const gap = this.lastNow ? now - this.lastNow : 0; this.lastNow = now;
    if (this.state === 'play' || this.state === 'count') { this.frames.push(gap); if (gap > this.maxFrame && this.frames.length > 3) this.maxFrame = gap; if (this.frames.length > 4000) this.frames.shift(); }
    if (this.state === 'count') { const k = (performance.now() - this.countT) / 1000; this.countK = k; this.ui('countTick'); if (k >= 2.7) this.go(); }
    if (this.state === 'play') {
      const r = this.ff || this.rate;
      // while a narration clip plays, the clock follows the sound exactly; between clips it follows the frame time
      if (this.src && this.srcB && r === 1) { const want = this.srcB.t0 + (this.audio.currentTime - this.srcT0); this.t = Math.abs(want - this.t) < 0.3 ? want : this.t + dtw; }
      else this.t += dtw * r;
      if (this.t >= this.dur) { this.t = this.dur; this.state = 'end'; this.stopAudio(); this.ui('end'); }
    }
    if (this.K && this.beats && this.state !== 'loading') { this.evaluate(Math.min(this.t, this.dur - 0.001)); if (this.state === 'play') this.syncAudio(); }
    if (this.state === 'play' && (now - (this.uiT || 0) > 200)) { this.uiT = now; this.ui('time'); }
    this.render(xrFrame, dtw);
  }
  render(xrFrame, dt) {
    const r = this.renderer, cam = this.camera; r.info.reset();
    if (!this.story || !this.beats) { r.setClearColor(0x0b0e13); r.clear(); return; }
    const P = this.pose(this.t);
    const xr = r.xr.isPresenting;
    // user turn (screen): drag offsets ease back when playing resumes
    const U = this.user;
    if (this.state === 'play' && !U.drag && performance.now() - U.last > 2500) { const k = Math.min(1, dt * 1.6); U.yaw -= U.yaw * k; U.pitch -= U.pitch * k; U.zoom += (1 - U.zoom) * k; }
    const offs = P.p.clone().sub(P.at);
    if (this.mode === 'screen') {
      const sph = new THREE.Spherical().setFromVector3(offs); sph.theta += U.yaw; sph.phi = THREE.MathUtils.clamp(sph.phi - U.pitch, 0.08, Math.PI - 0.08); sph.radius *= U.zoom;
      cam.position.copy(P.at).add(new THREE.Vector3().setFromSpherical(sph)); cam.up.set(0, 1, 0); cam.lookAt(P.at);
      this.dolly.position.set(0, 0, 0); this.dolly.quaternion.identity();
    }
    const yaw = Math.atan2(-(P.at.x - P.p.x), -(P.at.z - P.p.z));
    if (this.mode === 'box') {
      cam.position.copy(P.p); const hq = this.headQuat(); cam.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw).multiply(hq);
    }
    if (xr) { // the dolly carries the headset along the story's camera path; the head turns freely
      this.dolly.position.copy(P.p); this.xrYaw = this.xrYaw == null ? yaw : this.xrYaw + wrapPi(yaw - this.xrYaw) * Math.min(1, dt * 1.2); this.dolly.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.xrYaw);
    }
    cam.fov = this.mode === 'screen' ? P.fov : 75; cam.updateProjectionMatrix();
    this.dolly.updateMatrixWorld(true);
    // the bubble faces the viewer; in the headset modes it is placed from the story's camera, so it does not swim
    let bq, bp;
    if (this.mode === 'screen') { bq = cam.quaternion; bp = cam.position; }
    else { const m = new THREE.Matrix4().lookAt(P.p, P.at, new THREE.Vector3(0, 1, 0)); bq = new THREE.Quaternion().setFromRotationMatrix(m); bp = P.p; }
    const showB = this.placeBubble(bp, bq, this.mode === 'screen' ? P.fov : 62);
    if (showB) { if (xr) r.xr.enabled = false; r.setRenderTarget(this.micro.rt); r.render(this.micro.scene, this.micro.camera); r.setRenderTarget(null); if (xr) r.xr.enabled = true; }
    // headset panels follow the head (lazily, so text does not shake)
    this.hud.visible = this.mode !== 'screen';
    if (this.hud.visible) { const hc = xr ? r.xr.getCamera() : cam; hc.updateMatrixWorld(true); const hp = new THREE.Vector3(), hqq = new THREE.Quaternion(); hc.matrixWorld.decompose(hp, hqq, new THREE.Vector3()); const e = new THREE.Euler().setFromQuaternion(hqq, 'YXZ'); const yq = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), e.y); this.hud.position.copy(hp); this.hud.quaternion.slerp(yq, this.hudInit ? Math.min(1, dt * 3) : 1); this.hudInit = true; }
    if (xr) { r.render(this.scene, cam); return; }
    if (this.mode === 'box') {
      const w = r.domElement.width / r.getPixelRatio(), h = r.domElement.height / r.getPixelRatio();
      cam.aspect = (w / 2) / h; cam.updateProjectionMatrix(); cam.updateMatrixWorld(true); this.stereo.aspect = 1; this.stereo.update(cam);
      r.setScissorTest(true);
      r.setScissor(0, 0, w / 2, h); r.setViewport(0, 0, w / 2, h); r.render(this.scene, this.stereo.cameraL);
      r.setScissor(w / 2, 0, w / 2, h); r.setViewport(w / 2, 0, w / 2, h); r.render(this.scene, this.stereo.cameraR);
      r.setScissorTest(false); r.setViewport(0, 0, w, h);
      return;
    }
    cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix();
    r.render(this.scene, cam);
  }
  headQuat() {
    const H = this.head;
    if (H.ori) {
      const o = H.ori, z = new THREE.Vector3(0, 0, 1), e = new THREE.Euler(THREE.MathUtils.degToRad(o.beta || 0), THREE.MathUtils.degToRad(o.alpha || 0), -THREE.MathUtils.degToRad(o.gamma || 0), 'YXZ');
      const q = new THREE.Quaternion().setFromEuler(e).multiply(new THREE.Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5)));
      const ang = THREE.MathUtils.degToRad((screen.orientation && screen.orientation.angle) || window.orientation || 0); q.multiply(new THREE.Quaternion().setFromAxisAngle(z, -ang));
      const y = new THREE.Euler().setFromQuaternion(q, 'YXZ').y; if (H.yaw0 == null) H.yaw0 = y;
      return new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -H.yaw0).multiply(q);
    }
    return new THREE.Quaternion().setFromEuler(new THREE.Euler(H.mouse.pitch, H.mouse.yaw, 0, 'YXZ'));
  }
  resize() { this.renderer.setSize(innerWidth, innerHeight); this.camera.aspect = innerWidth / innerHeight; this.camera.updateProjectionMatrix(); }
  // ---------------------------------------------------------------- modes
  async setMode(m) {
    if (m === this.mode) return;
    if (this.mode === 'quest' && this.xrSession) { try { await this.xrSession.end(); } catch (e) { /* ended */ } }
    if (this.mode === 'box') { removeEventListener('deviceorientation', this.onOri, true); document.body.classList.remove('kt-box'); }
    if (m === 'box') {
      try { if (typeof DeviceOrientationEvent !== 'undefined' && DeviceOrientationEvent.requestPermission) await DeviceOrientationEvent.requestPermission(); } catch (e) { /* desktop */ }
      this.head.ori = null; this.head.yaw0 = null; this.onOri = (e) => { if (e.alpha != null || e.beta != null) this.head.ori = e; };
      addEventListener('deviceorientation', this.onOri, true); document.body.classList.add('kt-box');
      try { if (screen.orientation && screen.orientation.lock) { await document.documentElement.requestFullscreen?.().catch(() => {}); await screen.orientation.lock('landscape').catch(() => {}); } } catch (e) { /* not allowed */ }
      if (history.state && history.state.kt !== 'box') history.pushState({ kt: 'box' }, '');
    }
    if (m === 'quest') {
      if (!navigator.xr) return false;
      try {
        const s = await navigator.xr.requestSession('immersive-vr', { optionalFeatures: ['local-floor', 'hand-tracking'] });
        this.xrSession = s; this.xrYaw = null; await this.renderer.xr.setSession(s);
        s.addEventListener('end', () => { this.xrSession = null; if (this.mode === 'quest') { this.mode = 'screen'; this.ui('mode'); } });
        this.bindXR();
      } catch (e) { console.warn('xr', e); this.ui('toast', 'VR: ' + e.message); return false; }
    }
    this.mode = m; this.hudInit = false; this.ui('mode'); return true;
  }
  bindXR() {
    if (this._xrBound) return; this._xrBound = true;
    for (let i = 0; i < 2; i++) { const c = this.renderer.xr.getController(i); c.addEventListener('select', () => { if (this.state === 'end') this.ui('golink'); else this.toggle(); }); this.dolly.add(c); }
  }
  pollPads() {
    const now = performance.now(); const pads = [];
    if (this.xrSession) for (const s of this.xrSession.inputSources) if (s.gamepad) pads.push({ g: s.gamepad, xr: true });
    if (navigator.getGamepads) for (const g of navigator.getGamepads()) if (g) pads.push({ g, xr: false });
    this._pad = this._pad || {};
    for (const { g, xr } of pads) {
      const prev = this._pad[g.index + (xr ? 'x' : '')] || []; const btn = (k) => g.buttons[k] && g.buttons[k].pressed; const down = (k) => btn(k) && !prev[k];
      if (!xr) { if (down(0) || down(9)) this.ui('ok'); if (down(1) || down(8)) this.ui('back'); if (down(14)) this.skip(-5); if (down(15)) this.skip(5); }
      else { if (down(5)) this.ui('back'); }
      const ax = g.axes[xr ? 2 : 0] || 0; const key = 'ax' + g.index + xr; if (Math.abs(ax) > 0.7 && now - (this._pad[key] || 0) > 600) { this._pad[key] = now; this.skip(ax > 0 ? 5 : -5); }
      this._pad[g.index + (xr ? 'x' : '')] = g.buttons.map((b) => b.pressed);
    }
  }
  // ---------------------------------------------------------------- touch, mouse, keys
  bindInput() {
    const el = this.renderer.domElement, U = this.user; const pts = new Map(); let pinch0 = 0, z0 = 1, moved = 0;
    el.addEventListener('pointerdown', (e) => { pts.set(e.pointerId, [e.clientX, e.clientY]); el.setPointerCapture(e.pointerId); U.drag = true; moved = 0; if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch0 = Math.hypot(a[0] - b[0], a[1] - b[1]); z0 = U.zoom; } });
    el.addEventListener('pointermove', (e) => {
      if (!pts.has(e.pointerId)) return; const p = pts.get(e.pointerId); const dx = e.clientX - p[0], dy = e.clientY - p[1]; pts.set(e.pointerId, [e.clientX, e.clientY]); moved += Math.abs(dx) + Math.abs(dy);
      if (pts.size === 2) { const [a, b] = [...pts.values()]; const d = Math.hypot(a[0] - b[0], a[1] - b[1]); if (pinch0) U.zoom = THREE.MathUtils.clamp(z0 * pinch0 / d, 0.35, 2.2); }
      else if (this.mode === 'box' && !this.head.ori) { this.head.mouse.yaw -= dx * 0.005; this.head.mouse.pitch = THREE.MathUtils.clamp(this.head.mouse.pitch - dy * 0.005, -1.4, 1.4); }
      else { U.yaw -= dx * 0.006; U.pitch = THREE.MathUtils.clamp(U.pitch + dy * 0.004, -1.2, 1.2); }
      U.last = performance.now();
    });
    const up = (e) => { pts.delete(e.pointerId); if (!pts.size) { U.drag = false; U.last = performance.now(); if (moved < 8 && this.mode === 'box' && e.type === 'pointerup') this.ui('ok'); } pinch0 = 0; };
    el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
    el.addEventListener('wheel', (e) => { e.preventDefault(); U.zoom = THREE.MathUtils.clamp(U.zoom * Math.exp(e.deltaY * 0.001), 0.35, 2.2); U.last = performance.now(); }, { passive: false });
    setInterval(() => this.pollPads(), 50);
  }
  // ---------------------------------------------------------------- captions
  caption() {
    const B = this.beats && this.beats[this.curBeat]; const S = this.story; if (!B || !S) return;
    const text = B.b.say ? (B.b.say[this.lang] || B.b.say.en) : '';
    this.capText = text; this.ui('caption');
    this.capP.draw((g, w, h) => { g.fillStyle = 'rgba(10,13,20,0.82)'; g.beginPath(); g.roundRect(4, 4, w - 8, h - 8, 34); g.fill(); g.fillStyle = '#f7f2e8'; g.textAlign = 'center'; g.textBaseline = 'middle'; wrapText(g, text, w / 2, h / 2, w - 90, 52, `600 46px ${FONT}`); });
  }
  info() {
    const r = this.renderer.info; const sorted = [...this.frames].sort((a, b) => a - b);
    return { state: this.state, t: +this.t.toFixed(2), dur: +(this.dur || 0).toFixed(2), beat: this.curBeat, lang: this.lang, mode: this.mode, calls: r.render.calls, tris: r.render.triangles, programs: r.programs.length, geometries: r.memory.geometries, textures: r.memory.textures, warmMs: this.warmMs, parallel: this.parallel, maxFrame: Math.round(this.maxFrame), medFrame: Math.round(sorted[sorted.length >> 1] || 0), frames: this.frames.length, audioErr: this.audioErr || [], loaded: [...LOADED] };
  }
  ui() { /* replaced by the page (app.js) */ }
}

export function linkHref(L, lang, mode) {
  const q = new URLSearchParams();
  if (L.app === 'science') { q.set('exp', L.exp); q.set('lang', lang); if (mode === 'quest') q.set('app', 'vr'); return `../science/index.html?${q}`; }
  if (L.app === 'body') { if (L.lab) q.set('lab', L.lab); if (L.j) q.set('j', L.j); q.set('lang', lang); return `../body/index.html?${q}`; }
  if (L.app === 'space') { if (mode === 'box' || mode === 'quest') { q.set('app', mode === 'box' ? 'box' : 'vr'); q.set('go', L.go); return `../space/index.html?${q}`; } q.set('go', L.go); return `../space/index.html?${q}${L.hash ? '#' + L.hash : ''}`; }
  return L.href || '#';
}
function wrapPi(a) { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; }
export function wrapText(g, text, cx, cy, maxW, lh, font) {
  let px = parseInt(/(\d+)px/.exec(font)[1], 10), lines;
  for (;;) { g.font = font.replace(/\d+px/, px + 'px'); lines = []; let line = ''; for (const w of text.split(/\s+/)) { const tr = line ? line + ' ' + w : w; if (g.measureText(tr).width > maxW && line) { lines.push(line); line = w; } else line = tr; } if (line) lines.push(line); if (lines.length <= 3 || px < 26) break; px -= 4; lh = px * 1.15; }
  const lh2 = px * 1.18; lines.forEach((l, i) => g.fillText(l, cx, cy + (i - (lines.length - 1) / 2) * lh2));
}
