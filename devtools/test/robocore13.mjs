// DUET Robotics Lab 360, batch 13 (dimmer, hot or cold by RSSI, exercise coach), copied from robocore8.mjs; batches 8 and 9 (robotics/js/lessons8.js, lessons9.js): the Class 3 and Class 4 micro:bit projects,
// end to end, without a browser.
// Each lesson runs on a real MBCore with the real lesson runtime (LessonRT, its tick() and memory): the program compiles,
// every step's own condition comes true with what a student does on the panel (press, shake, tilt, light, noise, clap,
// touch pins 0 and 1, a friend's board by radio, crocodile clips), "Check my circuit" passes, the edit is what the step
// asks and compiles, and the lesson counts as complete. Also: each program goes to blocks and back (reported), and
// mistakes are caught: a divide by zero, an LED clipped the wrong way round, a servo with no power, a short circuit.          node devtools/test/robocore8.mjs [id,...]
import { Lab } from '../../robotics/js/sim.js';
import { MBCore } from '../../robotics/js/microbit.js';
import { LESSONS, BY_ID } from '../../robotics/js/lessons.js';
import { LessonRT } from '../../robotics/js/lessonrt.js';
import { batch8 } from '../../robotics/js/lessons8.js';
import { batch9 } from '../../robotics/js/lessons9.js';
import { batch10 } from '../../robotics/js/lessons10.js';
import { batch11 } from '../../robotics/js/lessons11.js';
import { batch13 } from '../../robotics/js/lessons13.js';
import { fromPython, toPython } from '../../robotics/js/blocks5.js';
import { msg } from '../../robotics/js/i18n.js';

const only = process.argv[2] ? process.argv[2].split(',') : null;
let fails = 0, passes = 0; const ok = (c, m) => { if (!c) { fails++; console.log('FAIL ' + m); } else { passes++; console.log('ok   ' + m); } };
const t3 = (en, hi, hg) => ({ en, hi, hg });
let L8 = LESSONS.filter((l) => l.batch === 13);
if (!L8.length) { L8 = [...batch13({ t3 }, LESSONS.length)]; for (const l of L8) BY_ID[l.id] = l; }
ok(L8.length >= 3, `${L8.length} micro:bit lessons in batch 13`);

const DT = 1 / 60;
function desk(l) {
  const lab = new Lab(); const app = { lab, tapRegion: () => {}, setLight: (v) => { lab.env.light = v; }, code: () => app.src, onStepDone() {}, onLessonComplete() {} };
  const rt = new LessonRT(app); rt.open(l.id); const core = new MBCore(app, l.world); app.world = core; app.src = l.code;
  const D = { lab, app, rt, core, B: core.boards[0], t: 0, timers: [], buf: '' };
  return D;
}
function frame(D) {
  D.t += DT; for (const tm of D.timers.filter((x) => x[0] <= D.t)) { tm[1](); D.timers.splice(D.timers.indexOf(tm), 1); }
  D.lab.step(1000 * DT); D.core.update(DT); D.rt.update(DT);
  for (const o of D.lab.mcu.ser.take()) { D.buf += String.fromCharCode(...o.bytes).replace(/\r/g, ''); const ls = D.buf.split('\n'); D.buf = ls.pop(); for (const x of ls) D.rt.onSerialLine(x); }
}
function start(D, src) { const r = D.core.compile(src); if (!r.ok) throw new Error('compile: ' + msg(r.errors[0]) + ' @' + r.errors[0].line); D.app.src = src; D.lab.run(r); D.rt.onRun(src); }
// what a student does on the panel
const press = (D, k, hold = 0.15) => { const B = /^f[AB]$/.test(k) ? D.core.boards[1] : D.B; const kk = /^f[AB]$/.test(k) ? k[1].toLowerCase() : k; B.press(kk, true); D.timers.push([D.t + hold, () => B.press(kk, false)]); };
const img = (D) => D.core.val('shownImg');
const px = (D) => [...D.core.val('shown')];
// each fires once per step (a step's clock starts again at 0)
const at = (...ts) => { let last = Infinity, fired = new Set(); return (t) => { if (t < last) fired = new Set(); last = t; for (const x of ts) if (t >= x && !fired.has(x)) { fired.add(x); return true; } return false; }; };
const every = (p, from = 0.3) => { let last = Infinity, k = -1; return (t) => { if (t < last) k = -1; last = t; if (t < from) return false; const i = Math.floor((t - from) / p); if (i > k) { k = i; return true; } return false; }; };
const A_ = (k, when, hold) => (t, D) => { if (when(t)) press(D, k, hold); };
const shakeAt = (when) => (t, D) => { if (when(t)) D.B.shake(); };
const set = (f) => { const w = at(0); return (t, D) => { if (w(t)) f(D); }; };
const seq = (...fs) => (t, D) => fs.forEach((f) => f(t, D));
// the reaction game: press A a quarter of a second after the heart appears
const onHeart = (t, D) => { if (img(D) === 'HEART') { if (D.hAt === undefined) D.hAt = t; if (!D.hit && t - D.hAt > 0.25) { press(D, 'a'); D.hit = true; } } else { D.hAt = undefined; D.hit = false; } };
const cheat = (t, D) => { if (img(D) === 'ASLEEP') { if (D.zAt === undefined) D.zAt = t; if (!D.cheated && t - D.zAt > 0.5) { press(D, 'a'); D.cheated = true; } } else D.zAt = undefined; };
// the seven-second game: A when it is ready (the arrow), B `secs` later
const timed = (secs) => (t, D) => { if (D.go === undefined && img(D) === 'ARROW_W') { press(D, 'a'); D.go = t; } else if (D.go !== undefined && t - D.go >= secs && !D.bDone) { press(D, 'b'); D.bDone = true; } };
// snap the dot: press when it is in the middle (or at an edge)
const snap = (where) => (t, D) => { const p = px(D); const n = p.filter((v) => v).length; if (n !== 1 || D.snapT > t - 0.6) return; const x = p.findIndex((v) => v) - 10; if ((where === 'mid' && x === 2) || (where === 'edge' && (x === 0 || x === 4))) { press(D, 'a', 0.05); D.snapT = t; } };
const cnt = (ks, gap = 0.4, from = 0.3) => { const w = at(...ks.map((k, i) => from + i * gap)); let i = 0, last = Infinity; return (t, D) => { if (t < last) i = 0; last = t; if (w(t)) press(D, ks[i++], 0.2); }; };
const ACT = {
  mbdimmer: [null, null, null, null, null, set((D) => D.core.control('knob', 100)), set((D) => D.core.control('knob', 33)), set((D) => D.core.control('knob', 100))],
  mbhotcold: [set((D) => D.core.control('gap', 25)), set((D) => D.core.control('gap', 1)), set((D) => D.core.control('gap', 3))],
  mbinchworm: [null, null, null, A_('a', at(0.5)), A_('a', at(0.5))],
  mbcoach: [seq(A_('a', at(0.3)), shakeAt(every(0.8, 1.2))), seq(A_('a', at(0.5)), (t, D) => { if (t > 1.3 && t < 4) shakeAt(every(0.8, 1.3))(t, D); }), A_('a', at(0.5))],
};
const LONG = { mbcoach: 90, mbinchworm: 60,  mbfireflies: 120, mbpoem: 300, mbthirst: 120, mbpicker: 200, mblove: 300, mbhilo: 120, mb8ball: 200, mbflappy: 120, mbbinary: 60 };
for (const l of L8) {
  if (only && !only.includes(l.id)) continue;
  const t0 = Date.now(); const D = desk(l); const acts = (ACT[l.id] || []).slice(); let src = l.code; let okAll = true; const log = [];
  try {
    for (const [i, s] of l.steps.entries()) {
      for (const k of ['do', 'see']) if (s[k]) for (const lg of ['en', 'hi', 'hg']) if (typeof s[k][lg] !== 'string' || (k === 'do' && !s[k][lg])) ok(false, `${l.id}: step ${i} has ${k}.${lg}`);
      if (s.k === 'run') start(D, src);
      if (s.k === 'check') { const r = D.rt.runCheck(); if (r) { okAll = false; log.push(`step ${i}: the circuit check says ${JSON.stringify(r[0].en)}`); break; } }
      if (s.k === 'edit') { const e = s.set.reduce((x, [re, v]) => x.replace(re, v), src); if (!(s.test(e) && !s.test(src))) { okAll = false; log.push(`step ${i}: the edit is not what it asks`); break; } src = e; start(D, src); }
      if (s.k === 'act' || s.k === 'watch') {
        const f = acts.shift(); for (const k of ['hAt', 'hit', 'zAt', 'cheated', 'go', 'bDone', 'snapT']) delete D[k];
        if (s.clip) D.core.addClip(s.clip[0], s.clip[1]);
        const T0 = D.t; let done = false; const lim = (LONG[l.id] || 45) * 60;
        for (let n = 0; n < lim; n++) { if (f) f(D.t - T0, D); frame(D); if (globalThis.__trace && i === globalThis.__traceStep) globalThis.__trace(D, D.t - T0); let d = false; try { d = !!s.until(D.rt); } catch (e) { d = false; } if (d) { done = true; break; } if (D.lab.mcu.state === 'error') break; }
        if (!done) { okAll = false; log.push(`step ${i} (${s.k}: ${s.do.en.slice(0, 40)}) not done · img ${img(D)} texts ${JSON.stringify(D.core.val('texts').slice(-3))} nums ${D.core.val('nums').slice(-3)} memRun ${JSON.stringify(D.rt.memRun)} mcu ${D.lab.mcu.state} ${D.lab.mcu.err ? JSON.stringify(D.lab.mcu.err) : ''}`); break; }
        for (let n = 0; n < 15; n++) frame(D);
      }
    }
  } catch (e) { okAll = false; log.push(String(e.message || e)); }
  const fin = (() => { try { return !!l.done(D.rt); } catch (e) { return false; } })();
  ok(okAll && fin, `${l.id}: all ${l.steps.length} steps done, complete in ${D.t.toFixed(0)} s of board time, ${Date.now() - t0} ms` + (log.length ? ' · ' + log.join(' · ') : '') + (okAll && !fin ? ' · done() is false: mem ' + JSON.stringify(D.rt.mem) : ''));
  for (const k of ['title', 'goal']) for (const lg of ['en', 'hi', 'hg']) if (!l[k][lg]) ok(false, `${l.id}: ${k}.${lg}`);
  // the program as blocks and back (class 3 works in blocks)
  let blk = 'no'; try { const p = fromPython(l.code); blk = p && toPython(p).trim() === l.code.trim() ? 'same' : p ? 'changes' : 'no'; } catch (e) { blk = 'no: ' + String(e.message || e).slice(0, 60); }
  console.log(`     blocks: ${blk}`);
}

// mistakes: the knob's ends left off (its middle leg floats) and an LED clipped backwards
if (!only || only.includes('mbdimmer')) {
  const l = L8.find((x) => x.id === 'mbdimmer'); const D = desk(l); D.core.addClip('P0', 'led1.A'); D.core.addClip('GND', 'led1.K'); D.core.addClip('P1', 'pot1.W'); const r = D.rt.runCheck();
  ok(r && /ends/.test(r[0].en), 'dimmer: the knob without its two ends: "' + (r && r[0].en.slice(0, 60)) + '"');
  const D2 = desk(l); D2.core.addClip('P0', 'led1.K'); D2.core.addClip('GND', 'led1.A'); const r2 = D2.rt.runCheck(); ok(r2 && /wrong way round/.test(r2[0].en), 'dimmer: an LED clipped backwards is named');
}
if (!only || only.includes('mbhotcold')) { // the signal fades with distance and with lower power (the numbers the program prints)
  const l = L8.find((x) => x.id === 'mbhotcold'); const D = desk(l); start(D, l.code); const avg = (g, n = 90) => { D.core.control('gap', g); const a = []; for (let k = 0; k < n; k++) { frame(D); } const xs = D.rt.serLines.slice(-8).map(Number); return xs.reduce((p, x) => p + x, 0) / xs.length; };
  const near = avg(1), mid = avg(10), far = avg(25); ok(near > mid && mid > far && near > -50 && far < -75, `RSSI falls with distance: 1 m ${near.toFixed(0)}, 10 m ${mid.toFixed(0)}, 25 m ${far.toFixed(0)} dBm`);
  const D2 = desk(l); start(D2, l.code.replace('power=7', 'power=1')); D2.core.control('gap', 10); for (let k = 0; k < 90; k++) frame(D2); const w = D2.rt.serLines.slice(-8).map(Number); const wa = w.reduce((p, x) => p + x, 0) / w.length; ok(wa < mid - 12, `and with power=1 it is weaker at 10 m: ${wa.toFixed(0)} dBm`);
}
console.log(`batch 13: ${passes} ok, ${fails} failed`);
process.exit(fails ? 1 : 0);
