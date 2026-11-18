// Finds the DUET markers in one small camera picture (RGBA, about 320–480 px wide), or in a crop of the camera picture.
// js-aruco2 finds the square outlines; then each square is unwarped and read on two grids:
//   6×6 cells: the pad and cube markers (12 codes, 4×4 inside the border, 1 wrong cell allowed);
//   7×7 cells: the card markers (72 codes, 5×5 inside, up to 3 wrong cells allowed; the caller decides how many it trusts);
// a square that is black all over is a card's corner "dot" (kept apart: the pose fit matches it by position).
// Then every side of each square is moved onto the real black/white edge to a fraction of a pixel and the four lines are
// intersected, which makes the pose much steadier than the whole-pixel corners. Runs in the tracker's worker
// (detect.worker.js) or, if workers are missing, on the page. No DOM needed (also runs in Node for the tests).
import { AR, CV } from './vendor/js-aruco2.js';
import { CODES, IDS, CARD_CODES, CARD_ID0 } from './markers.js';

AR.DICTIONARIES.DUET12 = { nBits: 16, tau: 2, codeList: IDS.map((id) => CODES[id]) };
const WARP = 56;   // px: each square is unwarped to 56×56 (9.3 px per cell on the 6-grid, 8 on the 7-grid)
const L4 = IDS.map((id) => CODES[id]);
const pop = (v) => { v -= (v >>> 1) & 0x55555555; v = (v & 0x33333333) + ((v >>> 2) & 0x33333333); return (((v + (v >>> 4)) & 0x0f0f0f0f) * 0x01010101) >>> 24; };
const rotate = AR.Detector.prototype.rotate;      // 90° clockwise, any square size
const rotate2 = AR.Detector.prototype.rotate2;

/** the cells of an n×n grid of a black/white unwarped square, each from the MIDDLE of its cell only (a blurred edge
 *  between two cells cannot flip it); null if a border cell is not black. Returns the inner (n-2)×(n-2) cells. */
function cells(img, n) {
  const W = img.width, d = img.data, cw = W / n, bits = [];
  for (let r = 0; r < n; r++) {
    const row = [];
    for (let c = 0; c < n; c++) {
      const x0 = Math.round(c * cw + cw * 0.25), x1 = Math.round(c * cw + cw * 0.75), y0 = Math.round(r * cw + cw * 0.25), y1 = Math.round(r * cw + cw * 0.75);
      let on = 0, k = 0;
      for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) { k++; if (d[y * W + x]) on++; }
      const b = on * 2 > k ? 1 : 0;
      if (r === 0 || r === n - 1 || c === 0 || c === n - 1) { if (b) return null; } else row.push(b);
    }
    if (r > 0 && r < n - 1) bits.push(row);
  }
  return bits;
}
/** best code of a list for these cells in any of the 4 turns: {k (index), dist, rot} or null */
function match(bits, list, maxDist) {
  let best = null, m = bits;
  for (let i = 0; i < 4; i++) {
    let v = 0; for (const row of m) for (const b of row) v = (v << 1) | b;
    for (let k = 0; k < list.length; k++) { const dist = pop((v ^ list[k]) >>> 0); if (dist <= maxDist && (!best || dist < best.dist)) best = { k, dist, rot: i }; }
    if (best && best.dist === 0) break;
    m = rotate(m);
  }
  return best;
}

/** RGBA → grey, integer weights (0.30 R + 0.59 G + 0.11 B) */
function grey(src, dst) {
  for (let i = 0, j = 0, n = dst.length; j < n; i += 4, j++) dst[j] = (src[i] * 77 + src[i + 1] * 151 + src[i + 2] * 28) >> 8;
}
/** dst = 255 where a pixel is darker than the mean of its (2r+1)² box by at least c, else 0 (running sums, edges clamped) */
function threshold(g, dst, sum, w, h, r, c) {
  for (let y = 0; y < h; y++) {           // horizontal box sums
    const o = y * w; let s = g[o] * (r + 1);
    for (let x = 1; x <= r; x++) s += g[o + Math.min(x, w - 1)];
    for (let x = 0; x < w; x++) {
      sum[o + x] = s;
      s += g[o + Math.min(x + r + 1, w - 1)] - g[o + Math.max(x - r, 0)];
    }
  }
  const k = (2 * r + 1) * (2 * r + 1), col = new Int32Array(w);
  for (let x = 0; x < w; x++) { let s = sum[x] * (r + 1); for (let y = 1; y <= r; y++) s += sum[Math.min(y, h - 1) * w + x]; col[x] = s; }
  for (let y = 0; y < h; y++) {           // vertical, row by row so the reads stay in order
    const o = y * w, add = Math.min(y + r + 1, h - 1) * w, rem = Math.max(y - r, 0) * w;
    for (let x = 0; x < w; x++) {
      dst[o + x] = g[o + x] * k <= col[x] - c * k ? 255 : 0;
      col[x] += sum[add + x] - sum[rem + x];
    }
  }
}

export class MarkerFinder {
  /** o.refine (default true): sub-pixel edges; o.cardTol: most wrong cells accepted on a card marker (default 3) */
  constructor(o = {}) {
    this.det = new AR.Detector({ dictionaryName: 'DUET12' });
    this.refine = o.refine !== false; this.cardTol = o.cardTol ?? 3;
    this.w = 0; this.h = 0;
  }
  // typed buffers instead of growing JS arrays: about twice as fast on a phone
  size(w, h) {
    if (w === this.w && h === this.h) return;
    const d = this.det; this.w = w; this.h = h;
    d.grey.data = new Uint8Array(w * h); d.thres.data = new Uint8Array(w * h); this.sum = new Int32Array(w * h);
    d.binary = new Int32Array((w + 2) * (h + 2)); d.homography.data = new Uint8Array(WARP * WARP); this.warpGrey = new Uint8Array(WARP * WARP);
    d.homography.width = d.homography.height = WARP;
    d.grey.width = d.thres.width = w; d.grey.height = d.thres.height = h;
  }
  /** img: {width, height, data: RGBA bytes}; map (optional): {sx, sy, s} the crop this picture was cut from and its scale
   *  (so that the corners come back in the full camera picture's pixels: x = sx + (x' + 0.5) / s - 0.5).
   *  → {markers: [{id, c: [[x,y]×4] (TL, TR, BR, BL of the upright marker), ham, card}], dots: [{c}]} */
  findAll(img, map) {
    const w = img.width, h = img.height, d = this.det;
    this.size(w, h);
    grey(img.data, d.grey.data);
    // "darker than the local mean by 7 or more": the window grows with the resolution (a 5×5 window at 480 px across the
    // camera picture; 11×11 for a crop at the full 1280 px), so a blurred edge still gives one solid outline
    const r = this.radius != null ? this.radius : map && map.vw ? Math.max(2, Math.min(6, Math.round(2 * map.s * map.vw / 480))) : 2;
    threshold(d.grey.data, d.thres.data, this.sum, w, h, r, 7);
    d.contours = CV.findContours(d.thres, d.binary);
    let cands = d.findCandidates(d.contours, w * 0.01, 0.05, 7);   // squares from 7 px a side (a card's far corner dot)
    cands = d.notTooNear(d.clockwiseCorners(cands), 10);
    const markers = [], dots = [], H = d.homography, G = this.warpGrey;
    for (const cand of cands) {
      CV.warp(d.grey, H, cand, WARP);
      G.set(H.data);
      const kind = this.read(H, G, cand);
      if (!kind) continue;
      let c = kind.corners.map((p) => [p.x, p.y]);
      if (this.refine) c = refineQuad(d.grey.data, w, h, c) || c;
      if (map) c = c.map(([x, y]) => [map.sx + (x + 0.5) / map.s - 0.5, map.sy + (y + 0.5) / map.s - 0.5]);
      if (kind.dot) dots.push({ c }); else markers.push({ id: kind.id, c, ham: kind.dist, card: kind.card });
    }
    return { markers, dots };
  }
  /** the old interface: the markers only */
  find(img, map) { return this.findAll(img, map).markers; }

  /** reads one unwarped square: a pad/cube marker, a card marker, a solid dot, or nothing */
  read(H, G, cand) {
    // a solid black square (a card's dot): dark all over its middle, much darker than just outside it
    const W = WARP, a = Math.round(W * 0.2), b = Math.round(W * 0.8);
    let sum = 0, n = 0;
    for (let y = a; y < b; y += 2) for (let x = a; x < b; x += 2) { sum += G[y * W + x]; n++; }
    const mean = sum / n, out = this.outside(cand);
    if (out > 0 && mean < out * 0.5) {
      // nearly no pixel of the middle lighter than halfway to the paper round it: solid (noise and JPEG do not matter)
      const half = (mean + out) / 2; let light = 0;
      for (let y = a; y < b; y += 2) for (let x = a; x < b; x += 2) if (G[y * W + x] > half) light++;
      if (light < n * 0.03) return { dot: true, corners: cand };
    }
    CV.threshold(H, H, CV.otsu(H));
    let best = null;
    const b6 = cells(H, 6);
    if (b6) { const m = match(b6, L4, 1); if (m) best = { id: IDS[m.k], dist: m.dist, rot: m.rot, card: false, score: m.dist / 6 }; }
    const b7 = cells(H, 7);
    if (b7) { const m = match(b7, CARD_CODES, this.cardTol); if (m && (!best || m.dist / 8 < best.score)) best = { id: CARD_ID0 + m.k, dist: m.dist, rot: m.rot, card: true, score: m.dist / 8 }; }
    if (!best) return null;
    return { id: best.id, dist: best.dist, card: best.card, corners: rotate2(cand, 4 - best.rot) };
  }
  /** mean grey just outside a square (a quarter of its side out from the middle of each side), or -1 */
  outside(cand) {
    const g = this.det.grey.data, w = this.w, h = this.h;
    const mx = (cand[0].x + cand[1].x + cand[2].x + cand[3].x) / 4, my = (cand[0].y + cand[1].y + cand[2].y + cand[3].y) / 4;
    let s = 0, n = 0;
    for (let k = 0; k < 4; k++) {
      const p = cand[k], q = cand[(k + 1) % 4], ex = (p.x + q.x) / 2, ey = (p.y + q.y) / 2;
      const x = Math.round(ex + (ex - mx) * 0.5), y = Math.round(ey + (ey - my) * 0.5);
      if (x < 0 || y < 0 || x >= w || y >= h) continue;
      s += g[y * w + x]; n++;
    }
    return n >= 2 ? s / n : -1;
  }
}

function sample(g, w, h, x, y) {
  const x0 = Math.floor(x), y0 = Math.floor(y);
  if (x0 < 0 || y0 < 0 || x0 >= w - 1 || y0 >= h - 1) return -1;
  const fx = x - x0, fy = y - y0, i = y0 * w + x0;
  return (g[i] * (1 - fx) + g[i + 1] * fx) * (1 - fy) + (g[i + w] * (1 - fx) + g[i + w + 1] * fx) * fy;
}

/** moves the 4 sides of a found square onto the strongest dark-to-light edge nearby and returns the refined corners */
export function refineQuad(g, w, h, c) {
  // centre of the square: "outside" is away from it
  const mx = (c[0][0] + c[1][0] + c[2][0] + c[3][0]) / 4, my = (c[0][1] + c[1][1] + c[2][1] + c[3][1]) / 4;
  const lines = [];
  for (let k = 0; k < 4; k++) {
    const a = c[k], b = c[(k + 1) % 4], dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy);
    if (len < 6) return null;
    let nx = -dy / len, ny = dx / len;
    const ex = (a[0] + b[0]) / 2 - mx, ey = (a[1] + b[1]) / 2 - my; if (nx * ex + ny * ey < 0) { nx = -nx; ny = -ny; }
    const r = Math.max(1.6, Math.min(3.5, len * 0.08)), pts = [];
    const N = Math.max(5, Math.min(18, Math.round(len / 4)));
    for (let i = 1; i <= N; i++) {
      const s = 0.12 + 0.76 * (i - 0.5) / N, px = a[0] + dx * s, py = a[1] + dy * s;
      // the edge goes dark (inside) → light (outside): the biggest rise of brightness along the outward normal
      const M = Math.round(4 * r), v = [];
      for (let j = 0; j <= M; j++) { const q = -r + 0.5 * j, s2 = sample(g, w, h, px + nx * q, py + ny * q); if (s2 < 0) break; v.push(s2); }
      if (v.length <= M) continue;
      let best = 0, bj = 0;
      for (let j = 1; j < M; j++) { const d = v[j + 1] - v[j - 1]; if (d > best) { best = d; bj = j; } }
      if (best < 12 || bj < 2 || bj > M - 2) continue;
      const y0 = v[bj] - v[bj - 2], y1 = best, y2 = v[bj + 2] - v[bj], den = y0 - 2 * y1 + y2;
      const off = den < 0 ? Math.max(-0.5, Math.min(0.5, 0.5 * (y0 - y2) / den)) : 0;
      const t = -r + 0.5 * (bj + off);              // where the brightness rises fastest = the printed edge
      pts.push([px + nx * t, py + ny * t]);
    }
    if (pts.length < 3) return null;
    lines.push(fitLine(pts));
  }
  const out = [];
  for (let k = 0; k < 4; k++) {
    const p = intersect(lines[(k + 3) % 4], lines[k]);
    if (!p || Math.hypot(p[0] - c[k][0], p[1] - c[k][1]) > 3.5) return null;
    out.push(p);
  }
  return out;
}

function fitLine(p) {   // total least squares: a point on the line and its direction
  let sx = 0, sy = 0; for (const q of p) { sx += q[0]; sy += q[1]; } sx /= p.length; sy /= p.length;
  let xx = 0, xy = 0, yy = 0; for (const q of p) { const a = q[0] - sx, b = q[1] - sy; xx += a * a; xy += a * b; yy += b * b; }
  const th = 0.5 * Math.atan2(2 * xy, xx - yy);
  return [sx, sy, Math.cos(th), Math.sin(th)];
}
function intersect(l1, l2) {
  const den = l1[2] * l2[3] - l1[3] * l2[2]; if (Math.abs(den) < 1e-6) return null;
  const t = ((l2[0] - l1[0]) * l2[3] - (l2[1] - l1[1]) * l2[2]) / den;
  return [l1[0] + l1[2] * t, l1[1] + l1[3] * t];
}

/** tests only: the frame number that make_video.py printed in the top-left corner (10 black/white cells), or -1 */
export function readFrameCode(img, videoW) {
  const k = img.width / videoW, w = img.width, d = img.data;
  const lum = (x, y) => { const i = (Math.round(y * k) * w + Math.round(x * k)) * 4; return d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11; };
  if (lum(12, 12) < 200 || lum(12 + 10 * 24 + 6, 44) < 200) return -1;
  let n = 0; for (let i = 0; i < 10; i++) n = (n << 1) | (lum(16 + i * 24 + 12, 28) < 110 ? 1 : 0);
  return n;
}
