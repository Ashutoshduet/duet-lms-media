// Runs the DUET tracker core (detect.js + pose.js) in Node on the frames of the fake videos and compares the poses with
// the true poses that make_video.py saved. Quick check of detection rate, accuracy, jitter and time per frame.
// Usage: node devtools/ar/node_track.mjs [pad|cube] [width=480] [--norefine]
import { createRequire } from 'node:module';
const sharp = createRequire('/root/tools/node_modules/')('sharp');
import { readFileSync, readdirSync } from 'node:fs';
import { MarkerFinder, readFrameCode } from '../../ar/js/detect.js';
import { solveBoard } from '../../ar/js/pose.js';
import { board } from '../../ar/js/markers.js';

const kind = process.argv[2] || 'pad', PW = +(process.argv[3] || 480), DIR = (process.env.AR_SCRATCH || '/tmp/claude-0/agent-ar/') + 'video/';
const gt = JSON.parse(readFileSync(DIR + kind + '.json', 'utf8'));
const PH = Math.round(PW * gt.h / gt.w), f = (PW / 2) / Math.tan(gt.hfov * Math.PI / 360), cam = { fx: f, fy: f, cx: PW / 2, cy: PH / 2 };
const finder = new MarkerFinder({ refine: !process.argv.includes('--norefine') }), B = board(kind);
const files = readdirSync(DIR + kind + '_frames').filter((x) => x.endsWith('.jpg')).sort();
let found = 0, prev = null; const rows = []; let tDet = 0, tPose = 0;
for (const fn of files) {
  const { data } = await sharp(DIR + kind + '_frames/' + fn).resize(PW, PH).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const img = { width: PW, height: PH, data: new Uint8ClampedArray(data.buffer, data.byteOffset, data.length) };
  const t0 = performance.now(); const ms = finder.find(img); const t1 = performance.now();
  const p = solveBoard(B, ms, cam, prev); const t2 = performance.now(); tDet += t1 - t0; tPose += t2 - t1;
  const i = readFrameCode(img, gt.w), g = gt.frames[i];
  if (p) {
    found++; prev = p;
    const Rg = g.R, M = [0, 1, 2].map((r) => [0, 1, 2].map((c) => p.R[r * 3] * Rg[c * 3] + p.R[r * 3 + 1] * Rg[c * 3 + 1] + p.R[r * 3 + 2] * Rg[c * 3 + 2]));
    const ang = Math.acos(Math.min(1, (M[0][0] + M[1][1] + M[2][2] - 1) / 2)) * 180 / Math.PI;
    const dt = Math.hypot(p.t[0] - g.t3[0], p.t[1] - g.t3[1], p.t[2] - g.t3[2]) * 1000;
    rows.push({ i, ang, dt, rms: p.rms, n: p.n, t: p.t, hand: g.hand });
  } else { prev = null; rows.push({ i, miss: true, hand: g.hand, n: 0, m: ms.length }); }
}
const ok = rows.filter((r) => !r.miss), med = (a) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
console.log(`${kind} @${PW}px: pose in ${found}/${files.length} frames (${(100 * found / files.length).toFixed(1)}%)`);
console.log(`  rotation error  median ${med(ok.map((r) => r.ang)).toFixed(2)}°  max ${Math.max(...ok.map((r) => r.ang)).toFixed(2)}°`);
console.log(`  position error  median ${med(ok.map((r) => r.dt)).toFixed(1)} mm  max ${Math.max(...ok.map((r) => r.dt)).toFixed(1)} mm`);
console.log(`  reprojection    median ${med(ok.map((r) => r.rms)).toFixed(2)} px;  markers per frame median ${med(ok.map((r) => r.n))}`);
console.log(`  time per frame  detect ${(tDet / files.length).toFixed(2)} ms, pose ${(tPose / files.length).toFixed(2)} ms (Node, no throttling)`);
// jitter in the first second, where the phone is held still: spread of the position after removing the true motion
const still = ok.filter((r) => r.i < gt.fps);
if (still.length > 3) {
  const err = still.map((r) => r.dt);
  const m = err.reduce((a, b) => a + b, 0) / err.length, sd = Math.sqrt(err.reduce((a, b) => a + (b - m) * (b - m), 0) / err.length);
  console.log(`  held still (${still.length} frames): position error ${m.toFixed(1)} ± ${sd.toFixed(2)} mm, rotation ${med(still.map((r) => r.ang)).toFixed(2)}°`);
}
const miss = rows.filter((r) => r.miss); if (miss.length) console.log('  missed frames:', miss.map((r) => r.i + (r.hand ? 'h' : '') + '(' + r.m + ')').join(' '));
const bad = ok.filter((r) => r.ang > 5); if (bad.length) console.log('  >5° frames:', bad.map((r) => `${r.i}:${r.ang.toFixed(1)}°/n${r.n}`).join(' '));
