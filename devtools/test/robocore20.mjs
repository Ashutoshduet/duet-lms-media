// DUET Robotics Lab 360, batch 20 (robotics/js/lessons20.js): data on the Raspberry Pi 4, end to end, without a browser.
// The Python runs on the virtual Pi (pi6.js) with its SD card, csv, statistics and matplotlib (pi20.js); every step's own
// condition must come true, as in the app:
//   pi_csvlog   10 readings into weather.csv (warmed to 36 °C on the way); a second run adds to it; "w" wipes it and
//               loses the header; "a" again grows it
//   pi_plot     72 hours as numbers; without float() the figure's y values are text (categories); with humidity, two lines
//   pi_predict  day 15 ≈ 31 °C from the straight line; 90 days ahead it says over 60 °C; 2 days ahead is sensible again
// Also the engine: with / open / csv / next / statistics / FileNotFoundError / write() of a float.
//                                                    node devtools/test/robocore20.mjs [id,...]
import { compile } from '../../robotics/js/cpp.js';
import { Lab } from '../../robotics/js/sim.js';
import { LESSONS } from '../../robotics/js/lessons.js';
import { LessonRT } from '../../robotics/js/lessonrt.js';
import { drawFigure } from '../../robotics/js/pi20.js';

const only = process.argv[2] ? process.argv[2].split(',') : null;
let fails = 0; const ok = (c, m) => { if (!c) { fails++; console.log('FAIL ' + m); } else console.log('ok   ' + m); };
const L20 = LESSONS.filter((l) => l.batch === 20);
ok(L20.length === 3 && new Set(LESSONS.map((l) => l.id)).size === LESSONS.length, `${L20.length} lessons in batch 20, ids unique`);

// ------------------------------------------------------------ the engine
if (!only) {
  const lab = new Lab(); lab.setBoard('pi4'); lab.fs6 = new Map();
  const run = (src, secs = 3) => { const c = compile(src, lab.def); if (!c.ok) return { out: '', err: c.errors[0] }; lab.run(c); let out = ''; for (let f = 0; f < secs * 60; f++) { lab.step(1000 / 60); for (const o of lab.mcu.ser.take()) out += String.fromCharCode(...o.bytes); if (lab.mcu.state !== 'running') break; } return { out: out.replace(/\r/g, ''), err: lab.mcu.err }; };
  let r = run('import csv\nwith open("a.csv", "w") as f:\n    w = csv.writer(f)\n    w.writerow(["x", "y"])\n    w.writerows([[1, 2.5], [2, "a,b"]])\nprint(f.closed)\nwith open("a.csv") as f:\n    r = csv.reader(f)\n    print(next(r))\n    for row in r:\n        print(row)\n');
  ok(!r.err && lab.fs6.get('a.csv') === 'x,y\r\n1,2.5\r\n2,"a,b"\r\n' && /True\n\['x', 'y'\]\n\['1', '2.5'\]\n\['2', 'a,b'\]/.test(r.out), 'csv writer / reader with "\\r\\n", quoting a comma, next() skips the header, with closes the file: ' + JSON.stringify(r.out.split('\n').slice(1, 5)));
  r = run('f = open("a.csv", "a")\nf.write(23.4)\n'); ok(r.err && r.err.code === 'N20_WRITE_STR', 'write(23.4): TypeError, as in Python');
  r = run('print(open("nope.txt").read())\n'); ok(r.err && r.err.code === 'N20_NOFILE', 'open() of a missing file: FileNotFoundError');
  r = run('try:\n    open("nope.txt")\nexcept FileNotFoundError:\n    print("caught")\nimport os\nprint(os.listdir("."), os.path.exists("a.csv"))\n'); ok(!r.err && /caught\n\['a\.csv'\] True/.test(r.out), 'except FileNotFoundError, os.listdir, os.path.exists');
  r = run('import statistics as st\nprint(st.mean([1, 2, 3, 4]), st.median([3, 1, 2]))\nf = st.linear_regression([1, 2, 3], [2, 4, 6])\nprint(f.slope, f.intercept)\n'); ok(!r.err && /2\.5 2\n2\.0 0\.0/.test(r.out), 'statistics: mean, median, linear_regression: ' + JSON.stringify(r.out.split('\n').slice(1, 3)));
  r = run('def deco(f):\n    print("decorated", f.__name__ if False else "")\n    return f\n@deco\ndef hi():\n    print("hi")\nhi()\n'); ok(!r.err && /decorated\s*\nhi/.test(r.out), 'a decorator runs and keeps the function');
  r = run('import matplotlib.pyplot as plt\nplt.plot([1, 2, 3], [4, 5, 6], "o-", label="a")\nplt.title("T")\nplt.show()\n'); const fg = lab.mcu.fig6;
  ok(!r.err && fg && fg.series[0].marker === 'o' && fg.series[0].ls === '-' && fg.title === 'T', 'matplotlib: plot with a format, title, show');
  const calls = []; const ctx = new Proxy({}, { get: (t, k) => (k === 'measureText' ? () => ({ width: 10 }) : typeof k === 'string' && /^(fill|stroke|move|line|arc|begin|save|restore|translate|rotate|setLineDash|closePath)/.test(k) ? (...a) => calls.push(k) : undefined), set: () => true });
  drawFigure(ctx, fg, 800, 500); ok(calls.filter((k) => k === 'lineTo').length >= 2 && calls.includes('fillText'), `drawFigure paints it (${calls.length} canvas calls)`);
}

// ------------------------------------------------------------ the lessons, played
function build(l) {
  const lab = new Lab(); const app = { lab, code: () => app.src, world: null, onStepDone() {}, onLessonComplete() {} }; app.src = l.code;
  const rt = new LessonRT(app); rt.open(l.id);
  for (const s of l.steps) { if (s.k === 'place') { const q = s.place; if (!lab.byTag(q.tag)) lab.addPart(q.type, q.props, q.at, q.rot, q.tag); } if (s.k === 'wire') { const g = rt.ghostWire(s.wire); if (g) lab.addWire(g[0], g[1]); } }
  return { lab, app, rt, l };
}
function start(B, src) { const c = compile(src, B.lab.def); if (!c.ok) throw new Error('compile ' + JSON.stringify(c.errors).slice(0, 300)); B.app.src = src; B.lab.run(c); B.rt.onRun(src); B.buf = ''; B.t = 0; }
function frames(B, secs, until, each) {
  const dt = 1 / 60; const { lab, rt } = B;
  for (let f = 0; f < secs * 60; f++) {
    if (each) each(B.t, B); B.t += dt; lab.step(1000 * dt); rt.update(dt);
    for (const o of lab.mcu.ser.take()) { const s = String.fromCharCode(...o.bytes); B.buf = (B.buf || '') + s.replace(/\r/g, ''); const ls = B.buf.split('\n'); B.buf = ls.pop(); for (const x of ls) rt.onSerialLine(x); }
    if (lab.mcu.state === 'error') throw new Error('runtime ' + JSON.stringify(lab.mcu.err) + ' ' + JSON.stringify(rt.serLines.slice(-3)));
    if (until && until(B)) return true;
  }
  return false;
}
function play(l, acts = {}) {
  const B = build(l); let src = l.code; const log = [];
  for (const [i, s] of l.steps.entries()) {
    for (const k of ['do', 'see']) if (s[k]) for (const lg of ['en', 'hi', 'hg']) if (typeof s[k][lg] !== 'string') ok(false, `${l.id}: step ${i} has ${k}.${lg}`);
    if (s.k === 'check') { const r = B.rt.runCheck(); if (r) { log.push(`step ${i}: check says ${JSON.stringify(r[0].en)}`); break; } }
    if (s.k === 'run') start(B, src);
    if (s.k === 'edit') { const e = s.set.reduce((x, [re, v]) => x.replace(re, v), src); if (!(s.test(e) && !s.test(src))) { log.push(`step ${i}: the edit is not what it asks`); break; } src = e; start(B, src); }
    if (s.k === 'watch' || s.k === 'act') {
      const done = frames(B, 90, () => { try { return !!s.until(B.rt); } catch (e) { return false; } }, acts[i]);
      log.push(`step ${i} ${done ? 'done' : 'NOT DONE'} at ${B.t.toFixed(1)} s`);
      if (!done) { log.push(`  serial ${JSON.stringify(B.rt.serLines.slice(-3))} files ${JSON.stringify([...(B.lab.fs6 || new Map()).keys()])}`); break; }
    }
  }
  return { B, log, done: !!l.done(B.rt) && !log.some((x) => /NOT DONE|check says|not what it asks/.test(x)) };
}
const T = {
  pi_csvlog(l) {
    const ai = l.steps.findIndex((s) => s.k === 'act'); const r = play(l, { [ai]: (t, B) => { const th = B.lab.byTag('th1'); if (t > 6) th.state.tS = 36; } });
    const rows = (r.B.lab.fs6.get('weather.csv') || '').split('\r\n').filter(Boolean);
    ok(r.done, `pi_csvlog: plays end to end — ${r.log.join(' | ')} · ${rows.length} lines now, first ${JSON.stringify(rows[0])}`);
  },
  pi_plot(l) { const r = play(l); const f = r.B.lab.mcu.fig6; ok(r.done && r.B.lab.fs6.has('temps.png'), `pi_plot: plays end to end — ${r.log.join(' | ')} · ${f && f.series.length} lines, temps ${f && Math.min(...f.series[0].y)}–${f && Math.max(...f.series[0].y)} °C`); },
  pi_predict(l) { const r = play(l); ok(r.done, `pi_predict: plays end to end — ${r.log.join(' | ')} · ${JSON.stringify(r.B.rt.serLines.filter((x) => /Day/.test(x)))}`); },
};
for (const l of L20) { if (only && !only.includes(l.id)) continue; try { T[l.id](l); } catch (e) { ok(false, `${l.id}: threw ${e.stack.split('\n').slice(0, 3).join(' ')}`); } }
console.log(fails ? `batch 20: ${fails} failed` : 'batch 20: all passed');
process.exit(fails ? 1 : 0);
