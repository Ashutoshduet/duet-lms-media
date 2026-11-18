// DUET AR tracker: the phone's back camera, the printed DUET Pad, the DUET Cube and the DUET AR Cards.
//
//   const video = document.createElement('video');
//   const stream = await openCamera(video);                    // back camera, 1280×720 if it can
//   const tr = new Tracker({ video, boards: ['pad'] });         // or ['cube'], ['cards'], ['cards', 'pad'] …
//   tr.start();
//   // every frame you draw:  const p = tr.pose('pad');  if (p.alpha > 0) anchor.matrix.fromArray(p.matrix)
//   //                        tr.cards() → the cards in view, best first;  tr.pose('c' + id) → that card's pose
//   // and the 3D camera:     Object.assign(camera, tr.projection(width, height)); camera.updateProjectionMatrix()
//   tr.stop(); closeCamera(stream);
//
// How: each new camera frame is shrunk to about 480 px wide (createImageBitmap) and sent to a worker
// (detect.worker.js), which finds the markers (detect.js) and fits one pose to all markers of each board (pose.js).
// While something is tracked, the worker gets only a crop round it, at up to the camera's full resolution (never more
// than about 480 × 270 pixels of work): the corners are found 2–3× more precisely, so the model shakes far less, and it is
// cheaper. Every 6th frame is the whole picture again, to find new cards. Here the poses are smoothed with a One Euro
// filter (steady when you hold still, quick when you move), kept for a moment when the markers are lost (a hand passes
// over), and then faded out. A sudden jump to a very different pose is believed only when the next frame agrees, so a
// single misread never flips the model. A new card is believed when two frames agree (or one reads it perfectly).
import { toThreeMatrix } from './pose.js';
import { board, isCardId, CARD } from './markers.js';

export const TRACKER_DEFAULTS = {
  procWidth: 480,   // px: the long side of the whole picture when the markers are looked for in it (320 for slow phones)
  roiPixels: 480 * 270, // most pixels of a crop round a tracked target
  fullEvery: 6,     // every n-th frame is the whole picture while tracking
  hfov: 64,         // degrees: a phone's main camera across the long side of a 16:9 picture (most are 62–68)
  hold: 0.6,        // s: keep the last pose this long when the markers are lost
  fade: 0.4,        // s: then fade the model out over this long
  pos: { minCutoff: 0.8, beta: 10, dCutoff: 1.0 },   // One Euro filter for the position (metres)
  rot: { minCutoff: 0.6, beta: 1.6, dCutoff: 1.0 },  // and for the rotation (quaternion; speed in rad/s)
};

/** opens the back camera into a <video> (muted, inline). Throws if there is no camera or no permission. */
export async function openCamera(video, o = {}) {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw new Error('no camera API (needs https or the DUET app)');
  const stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: { ideal: 'environment' }, width: { ideal: o.width || 1280 }, height: { ideal: o.height || 720 }, frameRate: { ideal: 30 } } });
  video.muted = true; video.playsInline = true; video.setAttribute('playsinline', ''); video.autoplay = true;
  video.srcObject = stream;
  await video.play().catch(() => {});
  if (video.readyState < 2) await new Promise((res) => { const on = () => { video.removeEventListener('loadeddata', on); res(); }; video.addEventListener('loadeddata', on); setTimeout(res, 4000); });
  try { const tk = stream.getVideoTracks()[0], c = tk.getCapabilities && tk.getCapabilities(); if (c && c.focusMode && c.focusMode.includes('continuous')) tk.applyConstraints({ advanced: [{ focusMode: 'continuous' }] }).catch(() => {}); } catch (e) { /* not offered */ }
  return stream;
}
export function closeCamera(stream) { if (stream) for (const t of stream.getTracks()) t.stop(); }

// ---------------------------------------------------------------------------------------------- One Euro filter
export class OneEuro {
  constructor(o) { this.o = o; this.x = null; this.dx = null; this.t = 0; }
  reset() { this.x = null; }
  static a(cut, dt) { const tau = 1 / (2 * Math.PI * cut); return 1 / (1 + tau / dt); }
  filter(v, t) {
    if (!this.x) { this.x = v.slice(); this.dx = v.map(() => 0); this.t = t; return this.x; }
    const dt = Math.max(1e-3, t - this.t); this.t = t;
    const raw = v.map((x, i) => (x - this.x[i]) / dt), ad = OneEuro.a(this.o.dCutoff, dt);
    this.dx = this.dx.map((d, i) => d + ad * (raw[i] - d));
    const speed = Math.hypot(...this.dx), a = OneEuro.a(this.o.minCutoff + this.o.beta * speed, dt);
    this.x = this.x.map((x, i) => x + a * (v[i] - x));
    return this.x;
  }
}

export function quatFromR(R) {   // row-major 3×3 → [x, y, z, w]
  const tr = R[0] + R[4] + R[8]; let x, y, z, w;
  if (tr > 0) { const s = 0.5 / Math.sqrt(tr + 1); w = 0.25 / s; x = (R[7] - R[5]) * s; y = (R[2] - R[6]) * s; z = (R[3] - R[1]) * s; }
  else if (R[0] > R[4] && R[0] > R[8]) { const s = 2 * Math.sqrt(1 + R[0] - R[4] - R[8]); w = (R[7] - R[5]) / s; x = 0.25 * s; y = (R[1] + R[3]) / s; z = (R[2] + R[6]) / s; }
  else if (R[4] > R[8]) { const s = 2 * Math.sqrt(1 + R[4] - R[0] - R[8]); w = (R[2] - R[6]) / s; x = (R[1] + R[3]) / s; y = 0.25 * s; z = (R[5] + R[7]) / s; }
  else { const s = 2 * Math.sqrt(1 + R[8] - R[0] - R[4]); w = (R[3] - R[1]) / s; x = (R[2] + R[6]) / s; y = (R[5] + R[7]) / s; z = 0.25 * s; }
  return [x, y, z, w];
}
export function rFromQuat(q) {
  const l = Math.hypot(...q) || 1, [x, y, z, w] = q.map((v) => v / l);
  return [1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w), 2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w), 2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)];
}
const angle = (A, B) => { let s = 0; for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) s += A[i * 3 + j] * B[i * 3 + j]; return Math.acos(Math.max(-1, Math.min(1, (s - 1) / 2))); };

/** keeps the smoothed pose of one board (the pad, the cube or one card) */
export class Track {
  constructor(o, key) { this.o = o; this.key = key; this.fp = new OneEuro(o.pos); this.fr = new OneEuro(o.rot); this.reset(); }
  reset() { this.fp.reset(); this.fr.reset(); this.R = null; this.t = null; this.seen = -1e9; this.q = null; this.pending = null; this.raw = null; this.ids = []; this.rms = 0; this.roiSeen = -1e9; this.hits = 0; }
  add(p, now, fromRoi) {
    if (!p) return false;
    const lostFor = now - this.seen;
    if (this.R && lostFor < this.o.hold + this.o.fade) {
      const turn = angle(p.R, this.R), move = Math.hypot(p.t[0] - this.t[0], p.t[1] - this.t[1], p.t[2] - this.t[2]);
      // a big jump, or a sudden turn of more than 8° while the target stays where it was (the sign of a flat marker read as
      // its mirror image, which looks nearly the same to the camera): believed only when the next frame agrees
      const jump = turn > 0.45 || move > 0.25 * Math.max(0.1, this.t[2]) || (turn > 0.14 && move < 0.03 * Math.max(0.1, this.t[2]) && lostFor < 0.3 && !(p.dots >= 2));
      if (jump) {   // believe a big jump only when the next frame agrees with it
        const pd = this.pending;
        if (!pd || angle(p.R, pd.R) > 0.2) { this.pending = p; return false; }
        this.fp.reset(); this.fr.reset();
      }
    } else { this.fp.reset(); this.fr.reset(); }
    this.pending = null;
    let q = quatFromR(p.R);
    if (this.q && q[0] * this.q[0] + q[1] * this.q[1] + q[2] * this.q[2] + q[3] * this.q[3] < 0) q = q.map((v) => -v);
    this.q = this.fr.filter(q, now);
    this.t = this.fp.filter(p.t, now);
    this.R = rFromQuat(this.q); this.seen = now; this.raw = p; this.rawAt = now; this.ids = p.ids; this.rms = p.rms; this.hits++;
    if (fromRoi) this.roiSeen = now;
    return true;
  }
  /** {matrix, alpha (1 seen … 0 gone), state: 'tracking' | 'holding' | 'fading' | 'lost', R, t} */
  get(now) {
    if (!this.R) return { alpha: 0, state: 'lost', matrix: null };
    const age = now - this.seen, o = this.o;
    const state = age < 0.25 ? 'tracking' : age < o.hold ? 'holding' : age < o.hold + o.fade ? 'fading' : 'lost';
    const alpha = state === 'fading' ? 1 - (age - o.hold) / o.fade : state === 'lost' ? 0 : 1;
    return { alpha, state, matrix: toThreeMatrix(this.R, this.t), R: this.R, t: this.t, ids: this.ids, rms: this.rms, age };
  }
}

/** the corners of a board's outline in its own axes (metres): where to look for it in the next frame */
function outline(key) {
  if (key === 'pad') return [[-0.1485, 0, -0.105], [0.1485, 0, -0.105], [0.1485, 0, 0.105], [-0.1485, 0, 0.105]];
  if (key === 'cube') { const e = 0.03; const o = []; for (const x of [-e, e]) for (const y of [-e, e]) for (const z of [-e, e]) o.push([x, y, z]); return o; }
  const w = CARD.w / 2000, h = CARD.h / 2000; return [[-w, 0, -h], [w, 0, -h], [w, 0, h], [-w, 0, h]];
}

export class Tracker {
  /** o: {video, boards: any of 'pad', 'cube', 'cards', procWidth, hfov, hold, fade, roi (default true), test (video
   *  width: read the test videos' frame numbers), onResult(result)} */
  constructor(o) {
    this.o = { ...TRACKER_DEFAULTS }; for (const [k, v] of Object.entries(o)) if (v !== undefined) this.o[k] = v;   // (an option left undefined keeps its default)
    this.video = o.video; this.boards = o.boards || ['pad'];
    this.tracks = new Map(); for (const b of this.boards) if (b !== 'cards') this.tracks.set(b, new Track(this.o, b));
    this.cand = new Map();   // card id → {n, t}: seen but not yet believed
    this.busy = false; this.on = false; this.n = 0;
    this.stats = { fps: 0, ms: 0, detectMs: 0, frames: 0, found: 0, results: 0, worker: false, roi: 0 };
    this._last = 0; this.roi = null;
  }
  start() {
    if (this.on) return; this.on = true;
    try {
      this.worker = new Worker(new URL('./detect.worker.js', import.meta.url), { type: 'module' });
      this.worker.onmessage = (e) => this._result(e.data);
      this.worker.onerror = (e) => { console.warn('DUET AR: tracker worker failed, tracking on the page instead', e.message); this.stats.err = 'worker: ' + e.message; this.worker = null; this.busy = false; this._inline(); };
      this.worker.onmessageerror = () => { this.stats.err = 'worker message error'; this.busy = false; };
      this.stats.worker = true;
    } catch (e) { this._inline(); }
    // a new camera frame: requestVideoFrameCallback; some web views never call it for a video under the 3D canvas,
    // so a frame-loop watchdog sends frames whenever it has been quiet for 60 ms
    const v = this.video; this._lastVfc = 0;
    if (v.requestVideoFrameCallback) { const vfc = () => { if (!this.on) return; this._lastVfc = performance.now(); this._pump(); this._vfc = v.requestVideoFrameCallback(vfc); }; this._vfc = v.requestVideoFrameCallback(vfc); }
    const raf = () => { if (!this.on) return; if (performance.now() - this._lastVfc > 60) this._pump(); this._raf = requestAnimationFrame(raf); };
    this._raf = requestAnimationFrame(raf);
  }
  stop() {
    this.on = false;
    if (this._vfc && this.video.cancelVideoFrameCallback) this.video.cancelVideoFrameCallback(this._vfc);
    if (this._raf) cancelAnimationFrame(this._raf);
    if (this.worker) this.worker.terminate(); this.worker = null;
  }
  async _inline() {
    // no module workers (very old web view): the same code on the page
    const [{ MarkerFinder, readFrameCode }, { solveAll }] = await Promise.all([import('./detect.js'), import('./detect.worker.js')]);
    const finder = new MarkerFinder();
    this.stats.worker = false;
    this._run = (m) => {
      const t0 = performance.now(), img = { width: m.w, height: m.h, data: new Uint8ClampedArray(m.buf) };
      const found = finder.findAll(img, m.crop), poses = solveAll(found, m);
      const t = performance.now() - t0;
      setTimeout(() => this._result({ type: 'result', id: m.id, stamp: m.stamp, crop: m.crop, found: found.markers, dots: found.dots.length, poses, code: m.test && !m.crop.roi ? readFrameCode(img, m.test) : undefined, px: m.w * m.h, ms: { total: t, detect: t, pose: 0, read: 0 } }), 0);
    };
  }
  /** the camera numbers in the camera picture's own pixels */
  cam(vw, vh) { const f = (Math.max(vw, vh) / 2) / Math.tan(this.o.hfov * Math.PI / 360); return { fx: f, fy: f, cx: vw / 2 - 0.5, cy: vh / 2 - 0.5 }; }   // hfov: across the long side (a phone held upright gives 720 × 1280)
  /** where to look next: the whole picture, or a crop round what is tracked (in camera pixels) */
  _crop(vw, vh) {
    const full = () => { const s = Math.min(1, this.o.procWidth / Math.max(vw, vh)); return { sx: 0, sy: 0, sw: vw, sh: vh, s, roi: false }; };   // 480 px along the long side
    if (this.o.roi === false || !this.roi || this.n % this.o.fullEvery === 0) return full();
    const [x0, y0, x1, y1] = this.roi, sw = x1 - x0, sh = y1 - y0;
    if (sw * sh > 0.6 * vw * vh) return full();
    const s = Math.min(1, Math.sqrt(this.o.roiPixels / (sw * sh)));
    return { sx: x0, sy: y0, sw, sh, s, roi: true };
  }
  async _pump() {
    const v = this.video;
    if (this.busy || !this.on || v.readyState < 2 || !v.videoWidth) return;
    if (!this.worker && !this._run) return;
    this.busy = true;
    const vw = v.videoWidth, vh = v.videoHeight, n = ++this.n, crop = this._crop(vw, vh);
    const pw = Math.max(16, Math.round(crop.sw * crop.s)), ph = Math.max(16, Math.round(crop.sh * crop.s));
    crop.s = pw / crop.sw;   // the exact scale after rounding
    const now = performance.now() / 1000, prev = {};
    for (const [k, t] of this.tracks) if (t.raw && now - t.rawAt < 0.3) prev[k] = { R: t.raw.R, t: t.raw.t };
    const msg = { type: 'frame', id: n, stamp: now, boards: this.boards, cam: this.cam(vw, vh), prev, crop: { sx: crop.sx, sy: crop.sy, s: crop.s, roi: crop.roi, vw: Math.max(vw, vh) }, test: this.o.test || 0 };
    this._t0 = performance.now();
    try {
      if (this.worker && typeof createImageBitmap === 'function' && typeof OffscreenCanvas !== 'undefined' && !this._noBitmap) {
        msg.bitmap = await createImageBitmap(v, crop.sx, crop.sy, crop.sw, crop.sh, { resizeWidth: pw, resizeHeight: ph, resizeQuality: crop.s < 0.75 ? 'low' : 'medium' });
        this.worker.postMessage(msg, [msg.bitmap]);
      } else {
        if (!this._cv || this._cv.width !== pw || this._cv.height !== ph) { this._cv = document.createElement('canvas'); this._cv.width = pw; this._cv.height = ph; this._cx = this._cv.getContext('2d', { willReadFrequently: true }); }
        this._cx.drawImage(v, crop.sx, crop.sy, crop.sw, crop.sh, 0, 0, pw, ph);
        const d = this._cx.getImageData(0, 0, pw, ph);
        Object.assign(msg, { w: pw, h: ph, buf: d.data.buffer });
        if (this.worker) this.worker.postMessage(msg, [msg.buf]); else this._run(msg);
      }
    } catch (e) { this.busy = false; this._noBitmap = true; this.stats.err = e.name + ': ' + e.message; }
  }
  _result(r) {
    this.busy = false;
    const now = performance.now() / 1000, s = this.stats, dt = now - (this._last || now);
    this._last = now; s.results++;
    if (dt > 0) s.fps = s.fps ? s.fps * 0.85 + 0.15 / dt : 1 / dt;
    const lat = performance.now() - this._t0;
    s.ms = s.ms ? s.ms * 0.85 + 0.15 * lat : lat; s.detectMs = s.detectMs ? s.detectMs * 0.85 + 0.15 * r.ms.total : r.ms.total;
    s.last = r.ms; s.markers = r.found.length; s.px = r.px; if (r.crop && r.crop.roi) s.roi++;
    const roi = !!(r.crop && r.crop.roi);
    let any = false;
    for (const [k, p] of Object.entries(r.poses)) {
      if (!p) continue;
      if (k[0] === 'c') {   // a card
        const id = +k.slice(1); if (!isCardId(id)) continue;
        let tr = this.tracks.get(k);
        if (!tr) {   // not believed yet: two frames within half a second, or one perfect read of a big enough marker
          const c = this.cand.get(id), ok = (p.ham === 0 && p.area > 900) || (c && now - c.t < 0.5 && p.ham <= 2);
          if (p.ham <= 2) this.cand.set(id, { n: (c ? c.n : 0) + 1, t: now });
          if (!ok) continue;
          tr = new Track(this.o, k); tr.id = id; this.tracks.set(k, tr); this.cand.delete(id);
        }
        // a full-picture frame while the crop is following this card: the crop's sharper pose wins
        if (!roi && now - tr.roiSeen < 0.2) { tr.seen = now; continue; }
        if (tr.add(p, now, roi)) any = true;
      } else if (this.tracks.has(k)) {
        const tr = this.tracks.get(k);
        if (!roi && now - tr.roiSeen < 0.2) { tr.seen = now; continue; }
        if (tr.add(p, now, roi)) any = true;
      }
    }
    // cards gone for long are forgotten (a new look at them starts fresh)
    for (const [k, tr] of this.tracks) if (k[0] === 'c' && now - tr.seen > this.o.hold + this.o.fade + 3) this.tracks.delete(k);
    if (any) s.found++;
    s.frames++;
    this._nextRoi(now);
    if (this.o.onResult) this.o.onResult(r, this);
  }
  /** the crop for the next frame: round every board tracked in the last moment, with a margin for movement */
  _nextRoi(now) {
    const v = this.video, vw = v.videoWidth, vh = v.videoHeight; if (!vw) { this.roi = null; return; }
    const cam = this.cam(vw, vh); let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const [k, tr] of this.tracks) {
      if (!tr.raw || now - tr.rawAt > 0.25) continue;
      for (const X of outline(k)) {
        const R = tr.raw.R, t = tr.raw.t, z = R[6] * X[0] + R[7] * X[1] + R[8] * X[2] + t[2]; if (z <= 0.02) { this.roi = null; return; }
        const u = cam.fx * (R[0] * X[0] + R[1] * X[1] + R[2] * X[2] + t[0]) / z + cam.cx, w = cam.fy * (R[3] * X[0] + R[4] * X[1] + R[5] * X[2] + t[1]) / z + cam.cy;
        x0 = Math.min(x0, u); y0 = Math.min(y0, w); x1 = Math.max(x1, u); y1 = Math.max(y1, w);
      }
    }
    if (!isFinite(x0)) { this.roi = null; return; }
    const mw = (x1 - x0) * 0.3 + 24, mh = (y1 - y0) * 0.3 + 24;
    x0 = Math.max(0, Math.floor(x0 - mw)); y0 = Math.max(0, Math.floor(y0 - mh)); x1 = Math.min(vw, Math.ceil(x1 + mw)); y1 = Math.min(vh, Math.ceil(y1 + mh));
    this.roi = x1 - x0 > 32 && y1 - y0 > 32 ? [x0, y0, x1, y1] : null;
  }
  /** the smoothed pose of 'pad', 'cube' or a card ('c' + id) now (see Track.get) */
  pose(kind = this.boards[0]) { const t = this.tracks.get(kind); return t ? t.get(performance.now() / 1000) : { alpha: 0, state: 'lost', matrix: null }; }
  /** the cards believed now: [{id, key, pose}], the one seen most recently and biggest first */
  cards() {
    const now = performance.now() / 1000, out = [];
    for (const [k, tr] of this.tracks) if (k[0] === 'c') { const p = tr.get(now); if (p.state !== 'lost') out.push({ id: tr.id, key: k, pose: p, area: tr.raw ? tr.raw.area || 0 : 0 }); }
    return out.sort((a, b) => (a.pose.age - b.pose.age) || (b.area - a.area));
  }
  reset() { for (const [k, t] of this.tracks) { if (k[0] === 'c') this.tracks.delete(k); else t.reset(); } this.cand.clear(); this.roi = null; }
  /** the 3D camera that sees what the <video> shows when it covers a view of w×h CSS px (object-fit: cover) */
  projection(w, h) {
    const v = this.video, vw = v.videoWidth || 1280, vh = v.videoHeight || 720, s = Math.max(w / vw, h / vh);
    const f = (Math.max(vw, vh) / 2) / Math.tan(this.o.hfov * Math.PI / 360) * s;      // focal length in CSS px
    return { fov: 2 * Math.atan(h / 2 / f) * 180 / Math.PI, aspect: w / h };
  }
}
export { board };
