// Runs DUET AR's own tracker code (detect.js, pose.js, the worker's solveAll, the tracker's crop and One Euro filter) on the
// synthetic phone photos of the printed cards (card_photos.py) and reports how often each card is found and how well its pose
// matches the truth: by distance, light, tilt and camera size; then the jitter of the still sequences, raw and smoothed.
// Usage: node devtools/ar/card_test.mjs [scratch dir] [--json out.json]
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync } from 'node:fs';
const sharp = createRequire('/root/tools/node_modules/')('sharp');
const ROOT = new URL('../../', import.meta.url).pathname;
const { MarkerFinder } = await import(ROOT + 'ar/js/detect.js');
const { solveAll } = await import(ROOT + 'ar/js/detect.worker.js');
const { Track, TRACKER_DEFAULTS } = await import(ROOT + 'ar/js/tracker.js');
const { CARD } = await import(ROOT + 'ar/js/markers.js');
const S = (process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : '/tmp/claude-0/agent-ar2/').replace(/\/?$/, '/');
const DIR = S + 'photos/', gt = JSON.parse(readFileSync(DIR + 'gt.json', 'utf8'));
const PROC = TRACKER_DEFAULTS.procWidth, ROI_PX = TRACKER_DEFAULTS.roiPixels;
const finder = new MarkerFinder();
const camOf = (g) => ({ fx: g.f, fy: g.f, cx: g.w / 2 - 0.5, cy: g.h / 2 - 0.5 });
const pageOf = (card) => Math.floor(card / 4);

async function load(file) {
  const { data, info } = await sharp(DIR + file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { width: info.width, height: info.height, data: new Uint8ClampedArray(data.buffer, data.byteOffset, data.length) };
}
async function frameImg(full, crop) {   // what createImageBitmap(video, sx, sy, sw, sh, {resize}) hands the worker
  const pw = Math.max(16, Math.round(crop.sw * crop.s)), ph = Math.max(16, Math.round(crop.sh * crop.s));
  const buf = await sharp(Buffer.from(full.data.buffer, full.data.byteOffset, full.data.length), { raw: { width: full.width, height: full.height, channels: 4 } })
    .extract({ left: crop.sx, top: crop.sy, width: crop.sw, height: crop.sh }).resize(pw, ph, { kernel: 'linear' }).raw().toBuffer();
  return { img: { width: pw, height: ph, data: new Uint8ClampedArray(buf.buffer, buf.byteOffset, buf.length) }, map: { sx: crop.sx, sy: crop.sy, s: pw / crop.sw, vw: Math.max(full.width, full.height) } };
}
function run(img, map, g, prev) {
  const t0 = performance.now();
  const found = finder.findAll(img, map);
  const poses = solveAll(found, { boards: ['cards'], cam: camOf(g), prev: prev || {} });
  return { found, poses, ms: performance.now() - t0, px: img.width * img.height };
}
function err(p, g) {
  let tr = 0; for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) tr += p.R[i * 3 + j] * g.R[i * 3 + j];
  const ang = Math.acos(Math.max(-1, Math.min(1, (tr - 1) / 2))) * 180 / Math.PI;
  const dt = Math.hypot(p.t[0] - g.t[0], p.t[1] - g.t[1], p.t[2] - g.t[2]) * 1000;
  return { ang, dt };
}
/** the tracker's crop round a card whose pose is known (Tracker._nextRoi and _crop) */
function cropFor(R, t, g) {
  const cam = camOf(g), w = CARD.w / 2000, h = CARD.h / 2000; let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const X of [[-w, 0, -h], [w, 0, -h], [w, 0, h], [-w, 0, h]]) {
    const z = R[6] * X[0] + R[7] * X[1] + R[8] * X[2] + t[2];
    const u = cam.fx * (R[0] * X[0] + R[1] * X[1] + R[2] * X[2] + t[0]) / z + cam.cx, v = cam.fy * (R[3] * X[0] + R[4] * X[1] + R[5] * X[2] + t[1]) / z + cam.cy;
    x0 = Math.min(x0, u); y0 = Math.min(y0, v); x1 = Math.max(x1, u); y1 = Math.max(y1, v);
  }
  const mw = (x1 - x0) * 0.3 + 24, mh = (y1 - y0) * 0.3 + 24;
  x0 = Math.max(0, Math.floor(x0 - mw)); y0 = Math.max(0, Math.floor(y0 - mh)); x1 = Math.min(g.w, Math.ceil(x1 + mw)); y1 = Math.min(g.h, Math.ceil(y1 + mh));
  const sw = x1 - x0, sh = y1 - y0;
  if (sw * sh > 0.6 * g.w * g.h) return { sx: 0, sy: 0, sw: g.w, sh: g.h, s: Math.min(1, PROC / g.w) };
  return { sx: x0, sy: y0, sw, sh, s: Math.min(1, Math.sqrt(ROI_PX / (sw * sh))) };
}

// ------------------------------------------------------------------------------------------ the random photos
const rows = [];
let tFull = 0, nFull = 0, tRoi = 0, nRoi = 0, pxFull = 0, pxRoi = 0;
for (const g of gt.filter((x) => x.seq == null)) {
  const full = await load(g.file);
  const fr = await frameImg(full, { sx: 0, sy: 0, sw: g.w, sh: g.h, s: Math.min(1, PROC / g.w) });
  const a = run(fr.img, fr.map, g); tFull += a.ms; nFull++; pxFull += a.px;
  const p = a.poses['c' + g.id], wrong = Object.keys(a.poses).filter((k) => k !== 'c' + g.id && a.poses[k].ham <= 2 && !(g.whole && pageOf(+k.slice(1) - 100) === pageOf(g.card)));
  const r = { g, full: p && p.ham <= 2 ? err(p, g) : null, fullTrack: p ? err(p, g) : null, wrong: wrong.length, dots: p ? p.dots : 0 };
  // the next frame, as the tracker would take it: a crop round where the card is
  const c = cropFor(g.R, g.t, g); const cr = await frameImg(full, c); const b = run(cr.img, cr.map, g); tRoi += b.ms; nRoi++; pxRoi += b.px;
  const q = b.poses['c' + g.id]; r.roi = q && q.ham <= 3 ? err(q, g) : null; r.roiDots = q ? q.dots : 0;
  rows.push(r);
}
const pct = (a, b) => (b ? (100 * a / b).toFixed(1) + '%' : '-');
const med = (a) => { if (!a.length) return NaN; const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
const p95 = (a) => { if (!a.length) return NaN; const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length * 0.95)]; };
const good = (e) => e && e.ang < 5 && e.dt < 15;
function table(title, key, bins) {
  console.log(`\n${title}`);
  console.log('  bucket          photos  found(full 480px)  pose ok  found(crop)  pose ok  rot err med/p95   pos err med/p95');
  for (const [name, test] of bins) {
    const rs = rows.filter((r) => test(r.g)); if (!rs.length) continue;
    const f = rs.filter((r) => r.full), ro = rs.filter((r) => r.roi);
    console.log(`  ${name.padEnd(15)} ${String(rs.length).padStart(6)}  ${pct(f.length, rs.length).padStart(17)}  ${pct(rs.filter((r) => good(r.full)).length, rs.length).padStart(7)}  ${pct(ro.length, rs.length).padStart(11)}  ${pct(rs.filter((r) => good(r.roi)).length, rs.length).padStart(7)}` +
      `  ${med(ro.map((r) => r.roi.ang)).toFixed(2)}°/${p95(ro.map((r) => r.roi.ang)).toFixed(2)}°   ${med(ro.map((r) => r.roi.dt)).toFixed(1)}/${p95(ro.map((r) => r.roi.dt)).toFixed(1)} mm`);
  }
}
const D = (a, b) => (g) => g.dist >= a / 100 && g.dist < b / 100;
table('By distance', 'dist', [['20–30 cm', D(20, 30)], ['30–40 cm', D(30, 40)], ['40–50 cm', D(40, 50)], ['50–60 cm', D(50, 60.1)], ['all', () => true]]);
table('By light', 'cond', [['normal', (g) => g.cond === 'normal'], ['dim (×0.3)', (g) => g.cond === 'dim'], ['yellow bulb', (g) => g.cond === 'yellow'], ['glare spot', (g) => g.cond === 'glare']]);
table('By tilt', 'tilt', [['0–20°', (g) => g.tilt < 20], ['20–40°', (g) => g.tilt >= 20 && g.tilt < 40], ['40–60°', (g) => g.tilt >= 40]]);
table('By camera', 'res', [['1280×720', (g) => g.w === 1280], ['640×480', (g) => g.w === 640], ['uncut page', (g) => g.whole], ['cut card', (g) => !g.whole]]);
table('Distance × light (crop)', 'dl', [['50–60 dim', (g) => D(50, 60.1)(g) && g.cond === 'dim'], ['50–60 glare', (g) => D(50, 60.1)(g) && g.cond === 'glare'], ['50–60 640×480', (g) => D(50, 60.1)(g) && g.w === 640], ['20–30 glare', (g) => D(20, 30)(g) && g.cond === 'glare']]);
const wrong = rows.reduce((s, r) => s + r.wrong, 0);
console.log(`\nWrong card ids (another card, not on the photo): ${wrong} in ${rows.length} photos`);
console.log(`Corner dots used in the crop pass: ${pct(rows.filter((r) => r.roiDots > 0).length, rows.length)} of photos (median ${med(rows.filter((r) => r.roiDots > 0).map((r) => r.roiDots))} dots)`);
console.log(`Time per frame (Node, this machine): whole picture ${(tFull / nFull).toFixed(1)} ms at ${Math.round(pxFull / nFull)} px; crop ${(tRoi / nRoi).toFixed(1)} ms at ${Math.round(pxRoi / nRoi)} px`);
const missed = rows.filter((r) => !r.roi && !r.full).map((r) => `${r.g.file}(${r.g.cond},${Math.round(r.g.dist * 100)}cm,${Math.round(r.g.tilt)}°,${r.g.w})`);
if (missed.length) console.log('Missed in both passes:', missed.slice(0, 30).join(' '), missed.length > 30 ? `… ${missed.length}` : '');

// ------------------------------------------------------------------------------------------ held still: jitter
console.log('\nHeld still (30 frames each): spread of the pose; "top" = a point 8 cm above the card (a model\'s head), in screen pixels');
console.log('  seq  camera    dist  tilt  light    found   raw: pos sd  rot sd   top px sd  |  smoothed (One Euro): pos sd  rot sd  top px sd');
const seqs = [...new Set(gt.filter((x) => x.seq != null).map((x) => x.seq))];
const sum = { raw: [], sm: [] };
for (const s of seqs) {
  const fs = gt.filter((x) => x.seq === s); let prev = null, prevR = null; const raw = [], sm = [];
  const tr = new Track(TRACKER_DEFAULTS, 'c'); let k = 0;
  for (const g of fs) {
    const full = await load(g.file);
    const crop = prevR ? cropFor(prevR.R, prevR.t, g) : { sx: 0, sy: 0, sw: g.w, sh: g.h, s: Math.min(1, PROC / g.w) };
    const cr = await frameImg(full, crop); const r = run(cr.img, cr.map, g, prev ? { ['c' + g.id]: prev } : {});
    const p = r.poses['c' + g.id];
    if (p) { prev = { R: p.R, t: p.t }; prevR = p; raw.push(p); tr.add(p, k / 30, true); const q = tr.get(k / 30); sm.push({ R: q.R, t: q.t }); }
    k++;
  }
  const g = fs[0], cam = camOf(g);
  const stats = (list) => {
    if (list.length < 3) return null;
    const mt = [0, 1, 2].map((i) => list.reduce((a, p) => a + p.t[i], 0) / list.length);
    const pos = Math.sqrt(list.reduce((a, p) => a + (p.t[0] - mt[0]) ** 2 + (p.t[1] - mt[1]) ** 2 + (p.t[2] - mt[2]) ** 2, 0) / list.length) * 1000;
    const R0 = list[0].R; const angs = list.map((p) => { let tr2 = 0; for (let i = 0; i < 9; i++) tr2 += p.R[i] * R0[i]; return Math.acos(Math.max(-1, Math.min(1, (tr2 - 1) / 2))) * 180 / Math.PI; });
    const ma = angs.reduce((a, b) => a + b, 0) / angs.length, rot = Math.sqrt(angs.reduce((a, b) => a + (b - ma) ** 2, 0) / angs.length);
    const top = list.map((p) => { const X = [0, 0.08, 0]; const z = p.R[6] * X[0] + p.R[7] * X[1] + p.R[8] * X[2] + p.t[2]; return [cam.fx * (p.R[0] * X[0] + p.R[1] * X[1] + p.R[2] * X[2] + p.t[0]) / z, cam.fy * (p.R[3] * X[0] + p.R[4] * X[1] + p.R[5] * X[2] + p.t[1]) / z]; });
    const mu = [top.reduce((a, q) => a + q[0], 0) / top.length, top.reduce((a, q) => a + q[1], 0) / top.length];
    const topSd = Math.sqrt(top.reduce((a, q) => a + (q[0] - mu[0]) ** 2 + (q[1] - mu[1]) ** 2, 0) / top.length);
    return { pos, rot, top: topSd };
  };
  const a = stats(raw), b = stats(sm.slice(5));   // the filter's first frames settle in
  if (a) sum.raw.push(a); if (b) sum.sm.push(b);
  console.log(`  ${String(s).padStart(3)}  ${g.w}×${g.h} ${String(Math.round(g.dist * 100)).padStart(3)}cm ${String(Math.round(g.tilt)).padStart(4)}°  ${g.cond.padEnd(7)} ${String(raw.length).padStart(3)}/30   ${a ? a.pos.toFixed(2).padStart(6) + ' mm ' + a.rot.toFixed(2).padStart(5) + '°  ' + a.top.toFixed(2).padStart(6) + ' px' : '   -'}  |  ${b ? b.pos.toFixed(2).padStart(10) + ' mm ' + b.rot.toFixed(2).padStart(5) + '°  ' + b.top.toFixed(2).padStart(6) + ' px' : '-'}`);
}
const avg = (l, k) => (l.reduce((a, x) => a + x[k], 0) / l.length);
console.log(`  mean                                       raw ${avg(sum.raw, 'pos').toFixed(2)} mm ${avg(sum.raw, 'rot').toFixed(2)}° ${avg(sum.raw, 'top').toFixed(2)} px  |  smoothed ${avg(sum.sm, 'pos').toFixed(2)} mm ${avg(sum.sm, 'rot').toFixed(2)}° ${avg(sum.sm, 'top').toFixed(2)} px`);
const ji = process.argv.indexOf('--json'); if (ji > 0) writeFileSync(process.argv[ji + 1], JSON.stringify({ rows: rows.map((r) => ({ file: r.g.file, dist: r.g.dist, cond: r.g.cond, tilt: r.g.tilt, w: r.g.w, full: r.full, roi: r.roi, wrong: r.wrong })), jitter: sum }));
