// The tracker's worker: gets a small camera picture (an ImageBitmap, or raw RGBA) cut from the camera frame (the whole
// frame, or a crop round the card or pad being tracked), finds the markers and fits the pad, cube and card poses, and
// sends the result back. Keeps the page's main thread free for drawing at full speed.
import { MarkerFinder, readFrameCode } from './detect.js';
import { solveBoard } from './pose.js';
import { board, isCardId } from './markers.js';

const finder = new MarkerFinder();
const boards = { pad: board('pad'), cube: board('cube') };
let canvas = null, ctx = null;

/** everything one frame gives: the markers, and a pose for each board asked for (cards: each card seen) */
export function solveAll(found, m) {
  const poses = {}, prev = m.prev || {};
  for (const k of m.boards) if (k !== 'cards') poses[k] = solveBoard(boards[k], found.markers, m.cam, prev[k]);
  if (m.boards.includes('cards')) {
    for (const f of found.markers) {
      if (!f.card || !isCardId(f.id) || poses['c' + f.id]) continue;
      const p = solveBoard(board(f.id), found.markers.filter((x) => x.id === f.id), m.cam, prev['c' + f.id], found.dots);
      if (p) { p.ham = f.ham; p.area = quadArea(f.c); poses['c' + f.id] = p; }
    }
  }
  return poses;
}
const quadArea = (c) => Math.abs((c[0][0] * c[1][1] - c[1][0] * c[0][1]) + (c[1][0] * c[2][1] - c[2][0] * c[1][1]) + (c[2][0] * c[3][1] - c[3][0] * c[2][1]) + (c[3][0] * c[0][1] - c[0][0] * c[3][1])) / 2;

if (typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope) {   // (also imported by the page and by Node tests)
  self.onmessage = (e) => {
    const m = e.data;
    if (m.type !== 'frame') return;
    const t0 = performance.now();
    let img;
    if (m.bitmap) {
      const w = m.bitmap.width, h = m.bitmap.height;
      if (!canvas || canvas.width !== w || canvas.height !== h) { canvas = new OffscreenCanvas(w, h); ctx = canvas.getContext('2d', { willReadFrequently: true }); }
      ctx.drawImage(m.bitmap, 0, 0); m.bitmap.close();
      img = ctx.getImageData(0, 0, w, h);
    } else img = { width: m.w, height: m.h, data: new Uint8ClampedArray(m.buf) };
    const t1 = performance.now();
    const found = finder.findAll(img, m.crop);
    const t2 = performance.now();
    const poses = solveAll(found, m);
    const t3 = performance.now();
    postMessage({ type: 'result', id: m.id, stamp: m.stamp, crop: m.crop, found: found.markers, dots: found.dots.length, poses,
      code: m.test && !m.crop.roi ? readFrameCode(img, m.test) : undefined, px: img.width * img.height,
      ms: { read: t1 - t0, detect: t2 - t1, pose: t3 - t2, total: t3 - t0 }, buf: m.buf || null }, m.buf ? [m.buf] : []);
  };
}
