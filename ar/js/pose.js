// Where is the pad (or the cube) relative to the phone camera? Our own small solver, no libraries:
// 1. a first guess from the plane's homography (all corners of all markers that lie in one plane, least squares);
// 2. then Gauss–Newton on all visible corners together (every marker of the pad, or every visible face of the cube),
//    with Huber weights so one badly found corner cannot pull the pose away;
// 3. the mirror-image solution that a flat target always has is tried too, and the previous frame's pose; the one
//    that fits the corners best wins.
// Camera: pinhole {fx, fy, cx, cy} in pixels of the processed picture. Pose: X_cam = R · X_board + t (OpenCV axes:
// x right, y down, z forward), R as 9 numbers row by row, t in metres.

const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const crs = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const nrm = (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const mv = (R, v) => [R[0] * v[0] + R[1] * v[1] + R[2] * v[2], R[3] * v[0] + R[4] * v[1] + R[5] * v[2], R[6] * v[0] + R[7] * v[1] + R[8] * v[2]];
const mm = (A, B) => { const C = new Array(9); for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) C[i * 3 + j] = A[i * 3] * B[j] + A[i * 3 + 1] * B[3 + j] + A[i * 3 + 2] * B[6 + j]; return C; };
const tr = (A) => [A[0], A[3], A[6], A[1], A[4], A[7], A[2], A[5], A[8]];

/** rotation matrix of the rotation vector w (Rodrigues) */
export function expRot(w) {
  const th = Math.hypot(w[0], w[1], w[2]);
  if (th < 1e-12) return [1, -w[2], w[1], w[2], 1, -w[0], -w[1], w[0], 1];
  const k = [w[0] / th, w[1] / th, w[2] / th], c = Math.cos(th), s = Math.sin(th), v = 1 - c;
  return [c + k[0] * k[0] * v, k[0] * k[1] * v - k[2] * s, k[0] * k[2] * v + k[1] * s,
    k[1] * k[0] * v + k[2] * s, c + k[1] * k[1] * v, k[1] * k[2] * v - k[0] * s,
    k[2] * k[0] * v - k[1] * s, k[2] * k[1] * v + k[0] * s, c + k[2] * k[2] * v];
}
/** the rotation nearest to M (polar decomposition by Newton steps) */
function orthonormalize(M) {
  let R = M.slice();
  for (let it = 0; it < 8; it++) {
    const a = R, det = a[0] * (a[4] * a[8] - a[5] * a[7]) - a[1] * (a[3] * a[8] - a[5] * a[6]) + a[2] * (a[3] * a[7] - a[4] * a[6]);
    if (Math.abs(det) < 1e-12) return null;
    // inverse-transpose = cofactor / det
    const it_ = [(a[4] * a[8] - a[5] * a[7]) / det, -(a[3] * a[8] - a[5] * a[6]) / det, (a[3] * a[7] - a[4] * a[6]) / det,
      -(a[1] * a[8] - a[2] * a[7]) / det, (a[0] * a[8] - a[2] * a[6]) / det, -(a[0] * a[7] - a[1] * a[6]) / det,
      (a[1] * a[5] - a[2] * a[4]) / det, -(a[0] * a[5] - a[2] * a[3]) / det, (a[0] * a[4] - a[1] * a[3]) / det];
    R = R.map((v, i) => 0.5 * (v + it_[i]));
  }
  return R;
}
/** solves A x = b (n×n, A row-major), partial pivoting; null if singular */
function solve(A, b, n) {
  const M = A.slice(), x = b.slice();
  for (let c = 0; c < n; c++) {
    let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(M[r * n + c]) > Math.abs(M[p * n + c])) p = r;
    if (Math.abs(M[p * n + c]) < 1e-14) return null;
    if (p !== c) { for (let k = 0; k < n; k++) { const t = M[c * n + k]; M[c * n + k] = M[p * n + k]; M[p * n + k] = t; } const t = x[c]; x[c] = x[p]; x[p] = t; }
    for (let r = c + 1; r < n; r++) { const f = M[r * n + c] / M[c * n + c]; if (!f) continue; for (let k = c; k < n; k++) M[r * n + k] -= f * M[c * n + k]; x[r] -= f * x[c]; }
  }
  for (let c = n - 1; c >= 0; c--) { let s = x[c]; for (let k = c + 1; k < n; k++) s -= M[c * n + k] * x[k]; x[c] = s / M[c * n + c]; }
  return x;
}

/** homography (h33 = 1) from plane points [a,b] to normalised image points [x,y], with Hartley scaling */
function homography(P, Q) {
  const norm = (pts) => {
    let mx = 0, my = 0; for (const p of pts) { mx += p[0]; my += p[1]; } mx /= pts.length; my /= pts.length;
    let d = 0; for (const p of pts) d += Math.hypot(p[0] - mx, p[1] - my); d = (d / pts.length) || 1;
    const s = Math.SQRT2 / d; return { s, mx, my, pts: pts.map((p) => [(p[0] - mx) * s, (p[1] - my) * s]) };
  };
  const a = norm(P), q = norm(Q), A = new Array(64).fill(0), r = new Array(8).fill(0);
  for (let i = 0; i < P.length; i++) {
    const [x, y] = a.pts[i], [u, v] = q.pts[i];
    const rows = [[x, y, 1, 0, 0, 0, -u * x, -u * y, u], [0, 0, 0, x, y, 1, -v * x, -v * y, v]];
    for (const row of rows) for (let j = 0; j < 8; j++) { r[j] += row[j] * row[8]; for (let k = 0; k < 8; k++) A[j * 8 + k] += row[j] * row[k]; }
  }
  const h = solve(A, r, 8); if (!h) return null;
  const Hn = [h[0], h[1], h[2], h[3], h[4], h[5], h[6], h[7], 1];
  const Ta = [a.s, 0, -a.s * a.mx, 0, a.s, -a.s * a.my, 0, 0, 1];
  const Tqi = [1 / q.s, 0, q.mx, 0, 1 / q.s, q.my, 0, 0, 1];
  return mm(Tqi, mm(Hn, Ta));
}

/** a pose from the homography of points lying in one plane: origin o, in-plane axes u, v (board coordinates) */
function poseFromPlane(obj, img, cam, o, u, v) {
  const P = obj.map((X) => { const d = [X[0] - o[0], X[1] - o[1], X[2] - o[2]]; return [dot(d, u), dot(d, v)]; });
  const Q = img.map((p) => [(p[0] - cam.cx) / cam.fx, (p[1] - cam.cy) / cam.fy]);
  const H = homography(P, Q); if (!H) return null;
  const h1 = [H[0], H[3], H[6]], h2 = [H[1], H[4], H[7]], h3 = [H[2], H[5], H[8]];
  let l = 2 / (Math.hypot(...h1) + Math.hypot(...h2)); if (h3[2] * l < 0) l = -l;
  const r1 = h1.map((x) => x * l), r2 = h2.map((x) => x * l), r3 = crs(r1, r2), tt = h3.map((x) => x * l);
  const Rp = orthonormalize([r1[0], r2[0], r3[0], r1[1], r2[1], r3[1], r1[2], r2[2], r3[2]]); if (!Rp) return null;
  const n = crs(u, v), B = [u[0], v[0], n[0], u[1], v[1], n[1], u[2], v[2], n[2]];   // plane axes as columns
  const R = mm(Rp, tr(B)), Ro = mv(R, o);
  return { R, t: [tt[0] - Ro[0], tt[1] - Ro[1], tt[2] - Ro[2]] };
}

/** reprojection: squared error per point and the rms in pixels */
function residuals(R, t, obj, img, cam) {
  const e = []; let s = 0;
  for (let i = 0; i < obj.length; i++) {
    const p = mv(R, obj[i]); p[0] += t[0]; p[1] += t[1]; p[2] += t[2];
    if (p[2] <= 1e-6) { e.push(1e6); s += 1e6; continue; }
    const du = cam.fx * p[0] / p[2] + cam.cx - img[i][0], dv = cam.fy * p[1] / p[2] + cam.cy - img[i][1];
    const q = du * du + dv * dv; e.push(q); s += q;
  }
  return { e, rms: Math.sqrt(s / obj.length) };
}

/** Gauss–Newton (lightly damped) on all points; Huber weights beyond `huber` px */
export function refinePose(R0, t0, obj, img, cam, iters = 8, huber = 2.0) {
  let R = R0.slice(), t = t0.slice();
  for (let it = 0; it < iters; it++) {
    const A = new Array(36).fill(0), g = new Array(6).fill(0);
    for (let i = 0; i < obj.length; i++) {
      const X = mv(R, obj[i]), P = [X[0] + t[0], X[1] + t[1], X[2] + t[2]];
      if (P[2] <= 1e-6) continue;
      const iz = 1 / P[2], u = cam.fx * P[0] * iz + cam.cx, v = cam.fy * P[1] * iz + cam.cy;
      const ru = u - img[i][0], rv = v - img[i][1], rr = Math.hypot(ru, rv), w = rr > huber ? huber / rr : 1;
      // d(u,v)/dP and dP/d(w, t): dP/dw = -[X]x (so du/dw = X × du), dP/dt = I
      const du = [cam.fx * iz, 0, -cam.fx * P[0] * iz * iz], dv = [0, cam.fy * iz, -cam.fy * P[1] * iz * iz];
      const Ju = [X[1] * du[2] - X[2] * du[1], X[2] * du[0] - X[0] * du[2], X[0] * du[1] - X[1] * du[0], du[0], du[1], du[2]];   // X × du
      const Jv = [X[1] * dv[2] - X[2] * dv[1], X[2] * dv[0] - X[0] * dv[2], X[0] * dv[1] - X[1] * dv[0], dv[0], dv[1], dv[2]];
      for (let a = 0; a < 6; a++) { g[a] += w * (Ju[a] * ru + Jv[a] * rv); for (let b = 0; b < 6; b++) A[a * 6 + b] += w * (Ju[a] * Ju[b] + Jv[a] * Jv[b]); }
    }
    for (let a = 0; a < 6; a++) A[a * 7] *= 1.0001;
    const d = solve(A, g.map((x) => -x), 6); if (!d) break;
    R = mm(expRot([d[0], d[1], d[2]]), R); t = [t[0] + d[3], t[1] + d[4], t[2] + d[5]];
    if (Math.abs(d[0]) + Math.abs(d[1]) + Math.abs(d[2]) < 1e-7 && Math.abs(d[3]) + Math.abs(d[4]) + Math.abs(d[5]) < 1e-7) break;
  }
  return { R: orthonormalize(R) || R, t };
}

/** the other solution of a flat target seen from one side: its normal mirrored about the line of sight */
function mirrored(pose, centre, normal) {
  const c = mv(pose.R, centre); c[0] += pose.t[0]; c[1] += pose.t[1]; c[2] += pose.t[2];
  const d = nrm(c), n = mv(pose.R, normal), k = 2 * dot(n, d), n2 = [k * d[0] - n[0], k * d[1] - n[1], k * d[2] - n[2]];
  const ax = crs(n, n2), s = Math.hypot(...ax), co = dot(n, n2); if (s < 1e-9) return null;
  const ang = Math.atan2(s, co), Q = expRot(ax.map((x) => x / s * ang)), R = mm(Q, pose.R), Rc = mv(R, centre);
  return { R, t: [c[0] - Rc[0], c[1] - Rc[1], c[2] - Rc[2]] };
}

const angleBetween = (A, B) => { const M = mm(A, tr(B)); return Math.acos(Math.max(-1, Math.min(1, (M[0] + M[4] + M[8] - 1) / 2))); };

/**
 * The pose of a whole board (markers.js board('pad') or board('cube')) from the markers found in one picture.
 * found: [{id, c: [[x,y]×4]}]; prev: last pose {R, t} or null; dots: [{c}] solid squares (cards only).
 * Returns {R, t, rms, ids, n, dots} or null.
 */
export function solveBoard(board, found, cam, prev, dots) {
  const byId = new Map(board.markers.map((m) => [m.id, m]));
  let use = found.filter((f) => byId.has(f.id));
  // the same id twice (a reflection, a second print): keep the bigger one
  const seen = new Map(); for (const f of use) { const a = area(f.c); if (!seen.has(f.id) || area(seen.get(f.id).c) < a) seen.set(f.id, f); }
  use = [...seen.values()];
  if (!use.length) return null;
  for (let pass = 0; pass < 2; pass++) {
    const obj = [], img = [];
    for (const f of use) { const m = byId.get(f.id); for (let k = 0; k < 4; k++) { obj.push(m.corners[k]); img.push(f.c[k]); } }
    // the first guesses: one per plane (the pad is one plane; each cube face is its own)
    const planes = new Map();
    for (const f of use) { const m = byId.get(f.id), key = m.n ? m.n.join(',') : 'pad'; if (!planes.has(key)) planes.set(key, []); planes.get(key).push(f); }
    const cands = [];
    for (const [, fs] of planes) {
      const m0 = byId.get(fs[0].id), o = cornerMean(m0.corners);
      const u = nrm(sub(m0.corners[1], m0.corners[0])), v = nrm(sub(m0.corners[0], m0.corners[3]));
      const po = [], pi = []; for (const f of fs) { const m = byId.get(f.id); for (let k = 0; k < 4; k++) { po.push(m.corners[k]); pi.push(f.c[k]); } }
      const p = poseFromPlane(po, pi, cam, o, u, v); if (!p) continue;
      cands.push(p);
      if (planes.size === 1) { const nn = crs(u, v), cen = cornerMean(po), mp = mirrored(p, cen, nn); if (mp) cands.push(mp); }
    }
    if (prev) cands.push({ R: prev.R.slice(), t: prev.t.slice() });
    let best = null, minRms = Infinity; const dotFits = [];
    const useDots = board.dots && dots && dots.length;
    for (const c of cands) {
      const p = refinePose(c.R, c.t, obj, img, cam, 10);
      const r = residuals(p.R, p.t, obj, img, cam);
      if (!(p.t[2] > 0) || !isFinite(r.rms)) continue;
      const near = prev ? angleBetween(p.R, prev.R) : 0;
      const score = r.rms * (1 + 0.6 * Math.min(near, 1));     // nearly equal fits: keep the one closer to the last frame
      if (!best || score < best.score) best = { ...p, rms: r.rms, e: r.e, score };
      minRms = Math.min(minRms, r.rms);
      // a card: the corner dots where this pose puts them settle which of the two mirror-image fits is right
      if (useDots) { const d = fitDots(board, p, dots, cam, obj, img, r.rms); if (d && d.nd >= 2) dotFits.push({ ...d, e: r.e }); }
    }
    // two or more dots fitting about as well as the marker alone does: the closest such fit wins (a mirror-image pose
    // that catches two dots fits them badly, so it is never taken)
    let bestDots = null;
    for (const d of dotFits) if (d.rms < 3 * minRms + 1.2 && (!bestDots || d.rms < bestDots.rms * 0.8 || (d.rms < bestDots.rms * 1.25 && d.nd > bestDots.nd))) bestDots = d;
    if (bestDots) best = { ...bestDots, score: bestDots.rms };
    if (!best) return null;
    // one marker much worse than the rest (a wrong find): drop it and fit again
    if (pass === 0 && use.length > 1) {
      const per = use.map((f, i) => Math.sqrt((best.e[i * 4] + best.e[i * 4 + 1] + best.e[i * 4 + 2] + best.e[i * 4 + 3]) / 4));
      const worst = per.indexOf(Math.max(...per));
      if (per[worst] > 3 && per[worst] > 4 * best.rms) { use = use.filter((_, i) => i !== worst); continue; }
    }
    return { R: best.R, t: best.t, rms: best.rms, ids: use.map((f) => f.id), n: use.length, dots: best.nd || 0 };
  }
  return null;
}

/** the marker's pose refined with the dots it finds where it expects them; a dot that does not fit is dropped */
function fitDots(board, p, dots, cam, obj, img, rms0) {
  const extra = matchDots(board, p, dots, cam); if (!extra.obj.length) return null;
  let eo = extra.obj, ei = extra.img;
  for (let round = 0; round < 2; round++) {
    const o2 = obj.concat(eo), i2 = img.concat(ei), q = refinePose(p.R, p.t, o2, i2, cam, 8), r2 = residuals(q.R, q.t, o2, i2, cam);
    if (!(q.t[2] > 0) || !isFinite(r2.rms)) return null;
    // each dot's own error (its 4 corners)
    const per = []; for (let k = 0; k < eo.length / 4; k++) { const b = obj.length + k * 4; per.push(Math.sqrt((r2.e[b] + r2.e[b + 1] + r2.e[b + 2] + r2.e[b + 3]) / 4)); }
    const lim = Math.max(1.5, 3 * rms0), bad = per.map((x, k) => (x > lim ? k : -1)).filter((k) => k >= 0);
    if (!bad.length) return { R: q.R, t: q.t, rms: r2.rms, nd: eo.length / 4 };
    const keep = (a) => a.filter((_, i) => !bad.includes(Math.floor(i / 4)));
    eo = keep(eo); ei = keep(ei); if (!eo.length) return null;
  }
  return null;
}
const project = (R, t, X, cam) => { const p = mv(R, X); const z = p[2] + t[2]; return [cam.fx * (p[0] + t[0]) / z + cam.cx, cam.fy * (p[1] + t[1]) / z + cam.cy]; };
/** the found dots that sit where the board's dots should be: their corners, matched to the model's corners */
function matchDots(board, pose, dots, cam) {
  const obj = [], img = [], used = new Set();
  for (const bd of board.dots) {
    const pc = bd.corners.map((X) => project(pose.R, pose.t, X, cam));
    const cx = (pc[0][0] + pc[1][0] + pc[2][0] + pc[3][0]) / 4, cy = (pc[0][1] + pc[1][1] + pc[2][1] + pc[3][1]) / 4;
    const side = (Math.hypot(pc[1][0] - pc[0][0], pc[1][1] - pc[0][1]) + Math.hypot(pc[2][0] - pc[1][0], pc[2][1] - pc[1][1])) / 2;
    let bestD = null, bestDist = Math.max(6, side * 1.2);
    dots.forEach((d, i) => {
      if (used.has(i)) return;
      const dx = (d.c[0][0] + d.c[1][0] + d.c[2][0] + d.c[3][0]) / 4 - cx, dy = (d.c[0][1] + d.c[1][1] + d.c[2][1] + d.c[3][1]) / 4 - cy;
      const dist = Math.hypot(dx, dy), s2 = Math.sqrt(area(d.c));
      if (dist < bestDist && s2 > side * 0.6 && s2 < side * 1.6) { bestDist = dist; bestD = i; }
    });
    if (bestD == null) continue;
    used.add(bestD);
    const dc = dots[bestD].c;
    let bk = 0, bs = Infinity;   // the turn of the found square that lines its corners up with the model's
    for (let k = 0; k < 4; k++) { let s = 0; for (let j = 0; j < 4; j++) s += Math.hypot(dc[(j + k) % 4][0] - pc[j][0], dc[(j + k) % 4][1] - pc[j][1]); if (s < bs) { bs = s; bk = k; } }
    if (bs / 4 > Math.max(4, side * 1.2)) continue;
    for (let j = 0; j < 4; j++) { obj.push(bd.corners[j]); img.push(dc[(j + bk) % 4]); }
  }
  return { obj, img };
}

const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cornerMean = (cs) => { const s = [0, 0, 0]; for (const c of cs) { s[0] += c[0]; s[1] += c[1]; s[2] += c[2]; } return s.map((x) => x / cs.length); };
const area = (c) => Math.abs((c[0][0] * c[1][1] - c[1][0] * c[0][1]) + (c[1][0] * c[2][1] - c[2][0] * c[1][1]) + (c[2][0] * c[3][1] - c[3][0] * c[2][1]) + (c[3][0] * c[0][1] - c[0][0] * c[3][1])) / 2;

/** pose → a column-major 4×4 for three.js (camera at the origin looking down -z, y up) */
export function toThreeMatrix(R, t, out = new Float32Array(16)) {
  // three axes = OpenCV axes with y and z flipped
  out[0] = R[0]; out[1] = -R[3]; out[2] = -R[6]; out[3] = 0;
  out[4] = R[1]; out[5] = -R[4]; out[6] = -R[7]; out[7] = 0;
  out[8] = R[2]; out[9] = -R[5]; out[10] = -R[8]; out[11] = 0;
  out[12] = t[0]; out[13] = -t[1]; out[14] = -t[2]; out[15] = 1;
  return out;
}
