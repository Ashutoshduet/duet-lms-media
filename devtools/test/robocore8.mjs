// DUET Robotics Lab 360, batches 8 and 9 (robotics/js/lessons8.js, lessons9.js): the Class 3 and Class 4 micro:bit projects,
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
import { fromPython, toPython } from '../../robotics/js/blocks5.js';
import { msg } from '../../robotics/js/i18n.js';

const only = process.argv[2] ? process.argv[2].split(',') : null;
let fails = 0, passes = 0; const ok = (c, m) => { if (!c) { fails++; console.log('FAIL ' + m); } else { passes++; console.log('ok   ' + m); } };
const t3 = (en, hi, hg) => ({ en, hi, hg });
let L8 = LESSONS.filter((l) => [8, 9, 10, 11].includes(l.batch));
if (!L8.length) { L8 = [...batch8({ t3 }, LESSONS.length)]; L8.push(...batch9({ t3 }, LESSONS.length + L8.length)); L8.push(...batch10({ t3 }, LESSONS.length + L8.length)); L8.push(...batch11({ t3 }, LESSONS.length + L8.length)); for (const l of L8) BY_ID[l.id] = l; }
ok(L8.length >= 65 && new Set([...LESSONS, ...L8].map((l) => l.id)).size === new Set([...LESSONS, ...L8]).size, `${L8.length} micro:bit lessons in batches 8–11 (class 2: ${L8.filter((l) => l.cls === '2').length}, class 3: ${L8.filter((l) => l.cls === '3').length}, class 4: ${L8.filter((l) => l.cls === '4').length}, class 5: ${L8.filter((l) => l.cls === '5').length}), ids unique`);

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
  mbrps1: [shakeAt(at(0.3)), shakeAt(every(0.8)), shakeAt(at(0.3))],
  mbreact: [onHeart, cheat, onHeart],
  mblight: [set((D) => { D.lab.env.light = 0.1; }), set((D) => { D.lab.env.light = 1; }), A_('a', at(0.5))],
  mbdice: [shakeAt(at(0.3)), shakeAt(every(2.2)), shakeAt(at(0.3))],
  mbstop: [cnt(['a', 'b'], 5), cnt(['a', 'b'], 5.2)],
  mbtug: [A_('a', every(0.4)), A_('b', every(0.4)), A_('a', every(0.4))],
  mbseven: [timed(7.0), timed(3.0), timed(7.0)],
  mbcoin: [A_('a', at(0.3)), cnt([...Array(10).fill('a'), 'b'], 1.3), A_('a', at(0.3))],
  mblevel: [set((D) => D.core.control('tilt', 'flat')), set((D) => D.core.control('tilt', 'right')), set((D) => D.core.control('tilt', 'left')), set((D) => D.core.control('tilt', 'right'))],
  mbclap: [(() => { const w = at(0.3); return (t, D) => { if (w(t)) D.core.control('clap'); }; })(), (() => { const w = at(0.3); return (t, D) => { if (w(t)) D.core.control('clap'); }; })(), (() => { const w = at(1); return (t, D) => { if (w(t)) D.core.control('sound', 150); }; })(), seq(set((D) => D.core.control('sound', 150)), (() => { const w = at(2.5); return (t, D) => { if (w(t)) D.core.control('clap'); }; })())],
  mbnoise: [null, set((D) => D.core.control('sound', 120)), set((D) => D.core.control('sound', 220)), set((D) => D.core.control('sound', 120))],
  mbhamster: [shakeAt(at(0.3)), A_('logo', at(0.3), 1.2), null, A_('logo', at(0.3), 1.2)],
  mbblow: [set((D) => D.core.control('sound', 220)), (() => { const a = at(0), b = at(2); return (t, D) => { if (a(t)) D.core.control('sound', 150); if (b(t)) D.core.control('sound', 220); }; })()],
  mbpoem: [A_('a', at(0.3)), A_('a', every(3))],
  mbsteady: [A_('P0', at(0.3)), A_('P0', at(0.4, 1.2)), A_('a', at(0.3)), A_('P0', at(0.3, 1.0, 1.7))],
  mbtraits: [cnt(['a', 'a', 'a', 'a', 'a', 'b', 'b', 'b', 'logo']), cnt(['a', 'a', 'a', 'b', 'logo'])],
  mbsnap: [snap('mid'), snap('edge'), snap('mid')],
};
const fshake = (when) => (t, D) => { if (when(t)) D.core.boards[1].shake(); };
const ctl = (id, v) => set((D) => D.core.control(id, v));
const ctlAt = (pairs) => { const ws = pairs.map(([x]) => at(x)); return (t, D) => pairs.forEach(([, id, v], i) => { if (ws[i](t)) D.core.control(id, v); }); };
const lightTo = (v) => set((D) => { D.lab.env.light = v; });
const lightAt = (x, v) => { const w = at(x); return (t, D) => { if (w(t)) D.lab.env.light = v; }; };
// timing gates: pin 0 when the screen is clear (not scrolling), pin 1 `gap` seconds later
const gate = (gap) => (t, D) => { if (D.go === undefined && px(D).every((v) => !v)) { press(D, 'P0'); D.go = t; } else if (D.go !== undefined && !D.bDone && t - D.go >= gap) { press(D, 'P1'); D.bDone = true; } };
Object.assign(ACT, {
  mbchat: [A_('a', at(0.3)), A_('fB', at(0.3)), shakeAt(at(0.3)), A_('logo', at(0.3), 0.2)],
  mbmood: [A_('a', at(0.3, 0.8)), A_('b', at(0.3)), cnt(['fA', 'fB'], 0.5), cnt(['a', 'a', 'a', 'a', 'b'])],
  mbredgreen: [A_('a', at(0.3)), fshake(at(0.3)), A_('b', at(0.3)), fshake(at(0.3)), A_('a', at(0.3))],
  mbmdice: [shakeAt(at(0.3)), fshake(at(0.3)), shakeAt(every(1.5))],
  mbduck: [A_('logo', at(0.3), 0.2), A_('a', at(0.3)), A_('fA', at(0.3)), seq(A_('logo', at(0.3), 0.2), shakeAt(at(1.0)))],
  mbvote: [A_('a', at(0.3)), A_('fB', at(0.3)), A_('logo', at(0.3), 0.2), A_('a', at(0.3, 0.8, 1.3))],
  mbwave: [null, null, null, A_('a', at(0.3)), A_('a', at(0.3))],
  mbmilk: [null, null, null, lightTo(0.1), lightTo(0.75), lightTo(0.45)],
  mbcurtain: [null, null, null, lightTo(1), lightTo(0.1), lightTo(0.45), lightTo(0.45)],
  mbbell: [A_('a', at(0.3)), cnt(['a', 'a', 'b'], 2.2), A_('a', at(0.3))],
  mblamp: [null, null, lightTo(0.1), lightTo(0.75), lightTo(0.1)],
  mbthirst: [null, null, null, (() => { const w = at(0.3); return (t, D) => { if (w(t)) D.core.control('water'); }; })(), null],
  mbguitar: [seq(ctl('tilt', 'flat'), A_('a', at(0.3), 0.5)), seq(ctl('tilt', 'right'), A_('a', at(0.3), 0.5)), seq(ctl('tilt', 'left'), A_('a', at(0.3), 0.5)), seq(ctl('tilt', 'right'), A_('a', at(0.3), 0.5))],
  mbstride: [seq(shakeAt(at(0.3, 1.0, 1.7, 2.4, 3.1)), A_('a', at(4))), seq(shakeAt(at(0.3, 1.0, 1.7, 2.4)), A_('a', at(3.3)))],
  mbkick: [shakeAt(at(0.3)), seq(shakeAt(at(0.3, 1.5)), A_('a', at(2.7))), seq(shakeAt(at(0.3)), A_('a', at(1.5)))],
  mbtraffic: [seq(cnt(['a', 'a', 'a', 'b', 'b', 'logo']), shakeAt(at(3))), seq(A_('a', at(0.3)), shakeAt(at(1.0)))],
  mbtreasure: [ctl('calib'), ctl('heading', 40), ctl('heading', 135), ctl('heading', 270)],
  mbgates: [gate(1.0), gate(0.5), gate(1.0)],
  mbbalance: [ctl('tilt', 'right'), ctl('tilt', 'left'), ctl('tilt', 'flat'), seq(ctl('tilt', 'left'), (() => { const w = at(1); return (t, D) => { if (w(t)) D.core.control('tilt', 'flat'); }; })())],
  mbfireflies: [null, null],
  mbburglar: [null, null, A_('a', at(0.3)), shakeAt(at(1.6)), A_('a', at(0.5)), seq(A_('a', at(0.3)), shakeAt(at(2.0)))],
});
Object.assign(ACT, {
  mbsmiley: [A_('a', at(0.3)), A_('b', at(0.3)), A_('logo', at(0.3), 0.2)],
  mbemotion: [A_('a', at(0.3)), A_('b', at(0.3)), seq(A_('a', at(0.3), 0.4), A_('b', at(0.3), 0.4)), A_('a', at(0.3))],
  mbdance: [null, null],
  mbmusicbox: [A_('a', at(0.3)), A_('b', at(0.3)), A_('a', at(0.3))],
  mbcountdown: [A_('a', at(0.3)), A_('a', at(0.3))],
  mbbreathe: [null, null],
  mbpicker: [shakeAt(at(0.3)), shakeAt(every(3))],
  mblove: [A_('P0', at(0.3)), A_('P0', every(5))],
  mbhandwash: [A_('a', at(0.3)), A_('a', at(0.3))],
  mbbanana: [A_('P0', at(0.3)), A_('P1', at(0.3)), A_('P2', at(0.3)), A_('logo', at(0.3), 0.2)],
  mbpotato: [A_('a', at(0.3)), A_('a', at(0.3))],
});
// guess my number: walk up 1, 2, 3 … checking each (A moves on, B checks)
const walk = (t, D) => { if (D.go === undefined || t < D.go - 5) { D.go = 0.3; D.bDone = false; } if (t >= D.go) { press(D, D.bDone ? 'a' : 'b'); D.go = t + (D.bDone ? 0.6 : 1.4); D.bDone = !D.bDone; } };
// catch the dot: move the basket (dim, bottom row) under the falling dot (bright)
const catcher = (miss) => (t, D) => { if (D.snapT > t - 0.12) return; const p = px(D); const bx = [0, 1, 2, 3, 4].find((x) => p[20 + x] > 0 && p[20 + x] < 9); const dot = p.findIndex((v, i) => v === 9 && i < 20); if (bx === undefined || dot < 0) return;
  const want = miss ? ((dot % 5) + 2) % 5 : dot % 5; if (want < bx) { press(D, 'a', 0.05); D.snapT = t; } else if (want > bx) { press(D, 'b', 0.05); D.snapT = t; } };
Object.assign(ACT, {
  mb8ball: [shakeAt(at(0.3)), shakeAt(every(4))],
  mbhilo: [walk, walk],
  mbbike: [A_('a', at(0.3)), A_('a', at(0.3)), cnt(['a', 'a'], 0.5)],
  mbmorse: [cnt(['a', 'a', 'a', 'logo']), cnt(['b', 'b', 'b', 'logo'], 0.4, 1.5), cnt(['a', 'a', 'a', 'a', 'logo'])],
  mbcatch: [catcher(false), catcher(true), catcher(false)],
  mbtrundle: [cnt(['P0', 'P0', 'P0', 'P0', 'a']), cnt(['P0', 'P0', 'P0', 'a'])],
});
// flappy bird: flap when the bird is at or below the bottom of the next pipe's gap
// (after 12 s it stops flapping: the crash shows the score)
const flapper = (t, D) => { if (D.snapT > t - 0.16 || t > 12) return; const p = px(D); const bird = [0, 1, 2, 3, 4].find((y) => p[y * 5] === 9); if (bird === undefined) return;
  let col = -1; for (let x = 0; x < 5 && col < 0; x++) if ([0, 1, 2, 3, 4].some((y) => p[y * 5 + x] === 4)) col = x;
  const open = col < 0 ? [1, 2] : [0, 1, 2, 3, 4].filter((y) => p[y * 5 + col] !== 4); const low = Math.max(...open);
  if (bird >= low) { press(D, 'a', 0.05); D.snapT = t; } };
Object.assign(ACT, {
  mbenvlog: [null, set((D) => D.core.control('temp', 35)), null],
  mbsolar: [seq(lightAt(0.2, 0.3), A_('a', at(0.6)), lightAt(1.6, 0.9), A_('a', at(2.0)), lightAt(3.0, 0.6), A_('a', at(3.4))), A_('b', at(0.5)), seq(A_('a', at(0.3, 1.5)), A_('logo', at(3.0), 0.2))],
  mbeggdrop: [seq(shakeAt(at(0.3)), A_('a', at(1.2))), A_('b', at(4)), seq(shakeAt(at(0.3)), A_('a', at(1.2)))],
  mbrocket: [shakeAt(at(0.3)), A_('a', at(0.5)), shakeAt(at(0.3))],
  mbflappy: [flapper, flapper],
  mbinfect: [A_('b', at(0.3)), null, seq(A_('a', at(0.3)), A_('fB', at(1.0)))],
  mbbinary: [null, A_('a', at(0.3)), null],
  mblock: [cnt(['a', 'b', 'a', 'a', 'logo']), cnt(['b', 'logo', 'a', 'logo', 'b', 'b', 'logo'], 1.5), cnt(['b', 'b', 'a', 'b', 'logo'])],
  mbrail: [null, null, null, A_('P1', at(0.3)), A_('P1', at(0.3))],
  mblearn: [seq(ctl('tilt', 'right'), cnt(['a', 'a', 'a'], 0.8)), seq(ctl('tilt', 'flat'), cnt(['b', 'b', 'b'], 0.8)), ctlAt([[0, 'tilt', 'right'], [1.5, 'tilt', 'flat']]),
    seq(ctlAt([[0, 'tilt', 'right'], [4.2, 'tilt', 'flat'], [8.5, 'tilt', 'right'], [10, 'tilt', 'flat']]), cnt(['a', 'a', 'a', 'a', 'a'], 0.7, 0.3), cnt(['b', 'b', 'b', 'b', 'b'], 0.7, 4.5))],
});
const LONG = { mbfireflies: 120, mbpoem: 300, mbthirst: 120, mbpicker: 200, mblove: 300, mbhilo: 120, mb8ball: 200, mbflappy: 120, mbbinary: 60 };
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
// a wrong edit is caught: the survey's percentage before anyone votes divides by zero, as on a real micro:bit
if (!only || only.includes('mbtraits')) {
  const l = L8.find((x) => x.id === 'mbtraits'); const D = desk(l); const e = l.steps.find((s) => s.k === 'edit'); const src = e.set.reduce((x, [re, v]) => x.replace(re, v), l.code);
  start(D, src); for (let n = 0; n < 30; n++) frame(D); press(D, 'logo'); for (let n = 0; n < 60; n++) frame(D);
  ok(D.lab.mcu.state === 'error' && /P_DIV0/.test(JSON.stringify(D.lab.mcu.err || {})), 'survey: the percentage with no votes stops with ZeroDivisionError: ' + JSON.stringify(D.lab.mcu.err || D.lab.mcu.state).slice(0, 120));
}
// wiring mistakes give their own message (as on the bench: the LED stays dark, the servo doesn't move)
if (!only || only.includes('mblamp')) {
  const l = L8.find((x) => x.id === 'mblamp'); const D = desk(l); D.core.addClip('P1', 'led1.K'); D.core.addClip('GND', 'led1.A'); const r = D.rt.runCheck();
  ok(r && /wrong way round/.test(r[0].en), 'night lamp: an LED clipped the wrong way round: "' + (r && r[0].en) + '"');
  start(D, 'from microbit import *\npin1.write_digital(1)\n'); for (let n = 0; n < 30; n++) frame(D); ok(!D.core.ledLit('led1'), 'and it stays dark when pin 1 is on');
}
if (!only || only.includes('mbwave')) {
  const l = L8.find((x) => x.id === 'mbwave'); const D = desk(l); D.core.addClip('P0', 'sv1.SIG'); D.core.addClip('GND', 'sv1.GND'); const r = D.rt.runCheck();
  ok(r && /no power/.test(r[0].en), 'waving arm: a servo with no + wire: "' + (r && r[0].en) + '"');
  start(D, l.code); for (let n = 0; n < 20; n++) frame(D); press(D, 'a'); for (let n = 0; n < 120; n++) frame(D); ok(Math.abs(D.core.parts.sv1.state.angle - 90) < 1, 'and its arm does not move: ' + D.core.parts.sv1.state.angle.toFixed(0) + '°');
  const D2 = desk(l); D2.core.addClip('3V', 'GND'); const r2 = D2.rt.runCheck(); ok(r2 && /short circuit/.test(r2[0].en), '3V clipped straight to GND: "' + (r2 && r2[0].en) + '"');
}
console.log(`batches 8–11: ${passes} ok, ${fails} failed`);
process.exit(fails ? 1 : 0);
