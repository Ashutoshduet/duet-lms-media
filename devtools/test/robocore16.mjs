// DUET Robotics Lab 360, batch 16 (robotics/js/lessons16.js): the two Class 8 sessions end to end, without a browser.
// The bench is built as a student builds it (setup, then each place / wire step at its ghost); the sketch runs on the
// virtual board; every step's own condition must come true, as in the app:
//   smarthome4  the phone opens the page, switches the Light and the Fan, taps "All off"; the edit renames the Pump to
//               Geyser, and the phone switches it on (each Switch answers 303 → "/", as a real browser would follow)
//   attendance  Asha's card marks her present, Ravi's tag is unknown until its number is in ids[], then both are
//               counted, and a second tap says "Already marked" without counting again
// Mistakes: a GPIO wire on the wrong pin (the check names the appliance); the RC522 on 5 V (the check says so).
//   node devtools/test/robocore16.mjs [id,...]
import { compile } from '../../robotics/js/cpp.js';
import { Lab } from '../../robotics/js/sim.js';
import { LESSONS } from '../../robotics/js/lessons.js';
import { LessonRT } from '../../robotics/js/lessonrt.js';
import { makeScene } from '../../robotics/js/scenes3.js';
import { lcdText } from '../../robotics/js/libs3.js';
import { netOf } from '../../robotics/js/esp32.js';
import { MBCore } from '../../robotics/js/microbit.js';
import { batch16mb } from '../../robotics/js/lessons16.js';
import { BY_ID } from '../../robotics/js/lessons.js';
import { msg } from '../../robotics/js/i18n.js';

const only = process.argv[2] ? process.argv[2].split(',') : null;
let fails = 0; const ok = (c, m) => { if (!c) { fails++; console.log('FAIL ' + m); } else console.log('ok   ' + m); };
const L16 = LESSONS.filter((l) => l.batch === 16);
ok(L16.length === 3 && new Set(LESSONS.map((l) => l.id)).size === LESSONS.length, `${L16.length} lessons in batch 16, ids unique`);

function build(l, skip, extra) {
  const lab = new Lab(); const app = { lab, code: () => app.src, world: null, onStepDone() {}, onLessonComplete() {} }; app.src = l.code;
  const rt = new LessonRT(app); rt.open(l.id);
  const sim = l.scene ? makeScene(l.scene) : null; app.world = sim ? { flag: (n) => sim.flag(n), val: (n) => sim.val(n), onRun: () => sim.onRun(lab) } : null;
  for (const s of l.steps) {
    if (skip && skip(s)) continue;
    if (s.k === 'place') { const q = s.place; if (!lab.byTag(q.tag)) { const p = lab.addPart(q.type, q.props, q.at, q.rot, q.tag); if (!p) ok(false, `${l.id}: place ${q.tag} fits`); } }
    if (s.k === 'wire') { const w = (extra && extra(s)) || s.wire; const g = rt.ghostWire(w); if (!g) { ok(false, `${l.id}: a ghost wire for ${w}`); continue; } lab.addWire(g[0], g[1]); if (!rt.conn(w[0], w[1])) ok(false, `${l.id}: wire ${w} joins`); }
  }
  return { lab, app, rt, sim, l, ser: '', buf: '', t: 0 };
}
function start(B, src) { const c = compile(src, B.lab.def); if (!c.ok) throw new Error('compile ' + JSON.stringify(c.errors).slice(0, 300)); B.app.src = src; B.lab.run(c); B.rt.onRun(src); }
function frames(B, secs, until, each) {
  const dt = 1 / 60; const { lab, rt, sim } = B;
  for (let f = 0; f < secs * 60; f++) {
    if (each) each(f * dt, B); lab.step(1000 * dt); if (sim) sim.update(dt, lab); rt.update(dt); B.t += dt;
    for (const o of lab.mcu.ser.take()) { const s = String.fromCharCode(...o.bytes); B.ser += s; B.buf += s.replace(/\r/g, ''); const ls = B.buf.split('\n'); B.buf = ls.pop(); for (const x of ls) rt.onSerialLine(x); }
    if (lab.mcu.state === 'error') throw new Error('runtime ' + JSON.stringify(lab.mcu.err));
    if (until && until(B)) return true;
  }
  return false;
}
// the phone's browser: open a page, follow a 303 back to "/" as a real browser does
function phone(B) {
  const N = netOf(B.lab); const P = { last: null, open(path) { const ip = N.staIP(); if (!ip) return; N.request(ip + path, (r) => { P.last = r; const loc = r && r.headers && r.headers.Location; if (r && r.code === 303 && loc) N.request(ip + loc, (r2) => { P.last = r2; }); }); } };
  return P;
}
const once = (at, f) => { let did = false; return (t, B) => { if (!did && t >= at) { did = true; f(B); } }; };
const taps = (list) => (t, B) => { for (const [at, f] of list) if (Math.abs(t - at) < 0.009) f(B); };
// plays the lesson as the app does: each step's condition must come true; `acts` are what the student does in act steps
function play(l, acts = {}) {
  const B = build(l); let src = l.code; const log = []; B.phone = phone(B);
  for (const [i, s] of l.steps.entries()) {
    for (const k of ['do', 'see']) if (s[k]) for (const lg of ['en', 'hi', 'hg']) if (typeof s[k][lg] !== 'string') ok(false, `${l.id}: step ${i} has ${k}.${lg}`);
    if (s.k === 'check') { const r = B.rt.runCheck(); if (r) { log.push(`step ${i}: check says ${JSON.stringify(r[0].en)}`); break; } }
    if (s.k === 'run') start(B, src);
    if (s.k === 'edit') { const e = s.set.reduce((x, [re, v]) => x.replace(re, v), src); if (!(s.test(e) && !s.test(src))) { log.push(`step ${i}: the edit is not what it asks`); break; } src = e; start(B, src); }
    if (s.k === 'watch' || s.k === 'act') {
      const t0 = B.t; const done = frames(B, 40, () => { try { return !!s.until(B.rt); } catch (e) { return false; } }, acts[i]);
      log.push(`step ${i} ${done ? 'done' : 'NOT DONE'} in ${(B.t - t0).toFixed(1)} s`);
      if (!done) { log.push(`  flags ${B.sim ? [...B.sim.flags].join(',') : ''} lcd ${B.lab.byTag('lcd') ? JSON.stringify(lcdText(B.lab.byTag('lcd'))) : ''} serial ${JSON.stringify(B.rt.serLines.slice(-3))}`); break; }
    }
  }
  return { B, log, done: !!l.done(B.rt) };
}
const T = {
  smarthome4(l) {
    const ix = (re) => l.steps.findIndex((s) => s.k === 'act' && re.test(s.do.en));
    const acts = {
      [ix(/open that address/)]: once(0.2, (B) => B.phone.open('/')),
      [ix(/Light and the Fan/)]: taps([[0.2, (B) => B.phone.open('/switch?n=0')], [1.5, (B) => B.phone.open('/switch?n=1')]]),
      [ix(/All off/)]: once(0.2, (B) => B.phone.open('/alloff')),
      [ix(/Geyser/)]: taps([[3, (B) => B.phone.open('/')], [4.5, (B) => B.phone.open('/switch?n=3')]]), // (after Run it joins the WiFi again first)
    };
    const r = play(l, acts); ok(r.done, `smarthome4: plays end to end — ${r.log.join(' | ')}`);
    const N = netOf(r.B.lab); const body = (N.seen.last || {}).body || '';
    ok(/Light is <b>OFF/.test(body) && /Geyser is <b>ON/.test(body) && (body.match(/<button>Switch<\/button>/g) || []).length === 4, 'smarthome4: the page lists four appliances with a Switch each, the Geyser ON');
    ok(r.B.rt.ledLit('led4') && !r.B.rt.ledLit('led1') && /Geyser ON/.test(r.B.ser), 'smarthome4: the Geyser LED is lit, and the Serial Monitor says so');
    // the mistake: the TV's wire on GPIO 32 instead of 27 -> the check names the TV
    const M = build(l, null, (s) => (s.wire[0] === 'led3.A' ? ['led3.A', 'D32'] : null)); const c = M.rt.runCheck();
    ok(!!c && c[1] && c[1].p === 27, `smarthome4: the TV on the wrong GPIO -> the check says ${JSON.stringify(c && c[0].en).slice(0, 80)} (${JSON.stringify(c && c[1])})`);
  },
  pong(l) {
    // the player: finds the ball on the OLED (a 3 × 3 block below the text line) and turns the knob to put the paddle's middle under it
    const W0 = 24; let pw = W0;
    const player = (miss) => (t, B) => {
      const o = B.lab.byTag('oled'); const fb = o && o.state.fb; const k = B.lab.byTag('pot1'); if (!fb || !k) return; let bx = -1;
      for (let y = 10; y < 60 && bx < 0; y++) for (let x = 0; x < 128; x++) if (fb[y * 128 + x]) { bx = x; break; }
      if (bx < 0) return; const want = miss ? (bx > 64 ? 0 : 1) : Math.max(0, Math.min(1, (bx + 1 - pw / 2) / (128 - pw)));
      if (Math.abs(k.state.pos - want) > 0.004) { k.state.pos = want; B.lab.stateV++; B.lab.instKey = null; }
    };
    const ix = (re) => l.steps.findIndex((s) => (s.k === 'act' || s.k === 'watch') && re.test(s.do.en));
    const acts = { [ix(/Score 3 points/)]: player(false), [ix(/narrow paddle/)]: (t, B) => { pw = 14; player(false)(t, B); } };
    const r = play(l, acts); ok(r.done, `pong: plays end to end — ${r.log.join(' | ')}`);
    const R = r.B.rt.memRun; ok(R.hits >= 2 && /Hit! Score 2/.test(r.B.ser), `pong: the narrow paddle scored (${R.hits} hits, ${R.misses || 0} misses)`);
    const last = l.steps[l.steps.length - 1].see.en; ok(/Your results with the narrow paddle: \d+ hits/.test(last), 'pong: the last step reads the results: ' + last.slice(0, 70));
    // nobody plays: three misses, GAME OVER on the screen, and a new game
    const G = build(l); start(G, l.code); let over = false; frames(G, 30, (b) => { const o = b.lab.byTag('oled'); if (/GAME OVER/.test((o && o.state.text) || '')) over = true; return over && /Lives 3/.test((o && o.state.text) || ''); });
    ok(over && (G.ser.match(/Missed!/g) || []).length === 3 && /Game over/.test(G.ser), `pong: left alone, three misses, GAME OVER, and a new game (${JSON.stringify(G.ser.split(/\r?\n/).filter(Boolean).slice(0, 5))})`);
    // the mistakes: both knob ends on the − rail (the paddle never moves), the wiper on A1
    const E1 = build(l, null, (s) => (s.wire[0] === 'pot1.3' ? ['pot1.3', 'rail:bn'] : null)); const c1 = E1.rt.runCheck();
    ok(!!c1 && /opposite rails/.test(c1[0].en), `pong: both knob ends on − -> the check says ${JSON.stringify(c1 && c1[0].en).slice(0, 70)}`);
    start(E1, l.code); const pos = []; frames(E1, 3, null, (t, B) => { const k = B.lab.byTag('pot1'); k.state.pos = t / 3; B.lab.stateV++; B.lab.instKey = null; const o = B.lab.byTag('oled'); const fb = o && o.state.fb; if (fb) { let x0 = -1; for (let x = 0; x < 128; x++) if (fb[62 * 128 + x]) { x0 = x; break; } pos.push(x0); } });
    ok(new Set(pos.filter((x) => x >= 0)).size === 1, `pong: … and turning that knob does not move the paddle (left edge at ${[...new Set(pos)].join(', ')})`);
    const E2 = build(l, null, (s) => (s.wire[0] === 'pot1.W' ? ['pot1.W', 'A1'] : null)); const c2 = E2.rt.runCheck();
    ok(!!c2 && /A0/.test(c2[0].en), `pong: the wiper on A1 -> the check says ${JSON.stringify(c2 && c2[0].en).slice(0, 70)}`);
  },
  attendance(l) {
    const ix = (re) => l.steps.findIndex((s) => s.k === 'act' && re.test(s.do.en));
    const ctl = (id) => (B) => B.sim.control(id, null, B.lab);
    const acts = {
      [ix(/white card on the reader/)]: once(0.6, ctl('card')),
      [ix(/blue tag\.$/)]: once(0.6, ctl('tag')),
      [ix(/A new morning/)]: taps([[0.6, ctl('card')], [3.4, ctl('tag')]]),
      [ix(/once more/)]: once(0.6, ctl('card')),
    };
    const r = play(l, acts); ok(r.done, `attendance: plays end to end — ${r.log.join(' | ')}`);
    const R = r.B.sim.res; ok(JSON.stringify(R.names) === '["Asha","Ravi"]' && R.count === 2 && R.unknown === "5B 2E 91 C4", `attendance: results ${JSON.stringify(R)}`);
    ok(/Card: 5B 2E 91 C4/.test(r.B.ser) && /Asha present/.test(r.B.ser) && /Ravi present/.test(r.B.ser), 'attendance: the Serial Monitor shows the numbers and who is present');
    const last = l.steps[l.steps.length - 1].see.en; ok(/Asha and Ravi marked present, the count stopped at 2/.test(last), 'attendance: the last step reads the results: ' + last.slice(0, 90));
    // the mistake: the RC522 on 5 V
    const M = build(l, null, (s) => (s.wire[0] === 'rf.V33' ? ['rf.V33', 'rail:bp'] : null)); const c = M.rt.runCheck();
    ok(!!c && /3\.3/.test(c[0].en), `attendance: the reader on 5 V -> the check says ${JSON.stringify(c && c[0].en).slice(0, 80)}`);
    // the LCD's SDA and SCL swapped -> the check says so, and the screen stays blank
    const S2 = build(l, null, (s) => (s.wire[0] === 'lcd.SDA' ? ['lcd.SDA', 'A5'] : s.wire[0] === 'lcd.SCL' ? ['lcd.SCL', 'A4'] : null)); const c2 = S2.rt.runCheck();
    start(S2, l.code); frames(S2, 2); ok(!!c2 && /swapped/.test(c2[0].en) && lcdText(S2.lab.byTag('lcd')).join('').trim() === '', 'attendance: SDA and SCL swapped -> the check says so, and the LCD stays blank');
  },
};
// ------------------------------------------------------------------ the micro:bit lesson (page only: made here, as robocore13 does)
const LM = batch16mb({ t3: (en, hi, hg) => ({ en, hi, hg }) }, LESSONS.length); for (const l of LM) BY_ID[l.id] = l;
function desk(l) {
  const lab = new Lab(); const app = { lab, tapRegion: () => {}, setLight: (v) => { lab.env.light = v; }, code: () => app.src, onStepDone() {}, onLessonComplete() {} };
  const rt = new LessonRT(app); rt.open(l.id); const core = new MBCore(app, l.world); app.world = core; app.src = l.code;
  return { lab, app, rt, core, B: core.boards[0], t: 0, timers: [], buf: '', ser: '' };
}
function mbFrame(D) {
  D.t += 1 / 60; for (const tm of D.timers.filter((x) => x[0] <= D.t)) { tm[1](); D.timers.splice(D.timers.indexOf(tm), 1); }
  D.lab.step(1000 / 60); D.core.update(1 / 60); D.rt.update(1 / 60);
  for (const o of D.lab.mcu.ser.take()) { const s = String.fromCharCode(...o.bytes).replace(/\r/g, ''); D.ser += s; D.buf += s; const ls = D.buf.split('\n'); D.buf = ls.pop(); for (const x of ls) D.rt.onSerialLine(x); }
}
function mbStart(D, src) { const r = D.core.compile(src); if (!r.ok) throw new Error('compile: ' + msg(r.errors[0]) + ' @' + r.errors[0].line); D.app.src = src; D.lab.run(r); D.rt.onRun(src); }
const tap = (D, k) => { D.B.press(k, true); D.timers.push([D.t + 0.2, () => D.B.press(k, false)]); };
const script = (list) => { const done = new Set(); return (t, D) => list.forEach(([at, f], i) => { if (t >= at && !done.has(i)) { done.add(i); f(D); } }); };
const tilt = (v) => (D) => D.core.control('tilt', v);
function playMb(l, acts) {
  const D = desk(l); let src = l.code; const log = [];
  for (const [i, s] of l.steps.entries()) {
    for (const k of ['do', 'see']) if (s[k]) for (const lg of ['en', 'hi', 'hg']) if (typeof s[k][lg] !== 'string') ok(false, `${l.id}: step ${i} has ${k}.${lg}`);
    if (s.k === 'run') mbStart(D, src);
    if (s.k === 'edit') { const e = s.set.reduce((x, [re, v]) => x.replace(re, v), src); if (!(s.test(e) && !s.test(src))) { log.push(`step ${i}: the edit is not what it asks`); break; } src = e; mbStart(D, src); }
    if (s.k === 'act' || s.k === 'watch') {
      const f = acts[i]; const T0 = D.t; let done = false;
      for (let k = 0; k < 40 * 60; k++) { if (f) f(D.t - T0, D); mbFrame(D); let d = false; try { d = !!s.until(D.rt); } catch (e) { d = false; } if (d) { done = true; break; } if (D.lab.mcu.state === 'error') break; }
      log.push(`step ${i} ${done ? 'done' : 'NOT DONE'} in ${(D.t - T0).toFixed(1)} s`);
      if (!done) { log.push(`  memRun ${JSON.stringify(D.rt.memRun)} mcu ${D.lab.mcu.state} ${D.lab.mcu.err ? JSON.stringify(D.lab.mcu.err).slice(0, 200) : ''} serial ${JSON.stringify(D.rt.serLines.slice(-4))}`); break; }
    }
  }
  return { D, log, done: !!l.done(D.rt) };
}
T.mbgestureai = (l) => {
  const ix = (re) => l.steps.findIndex((s) => s.k === 'act' && re.test(s.do.en));
  const acts = {
    [ix(/Teach "L"/)]: script([[0.1, tilt('left')], [0.5, (D) => tap(D, 'a')], [1.6, (D) => tap(D, 'a')]]),
    [ix(/Teach "R"/)]: script([[0.1, tilt('right')], [0.5, (D) => tap(D, 'b')], [1.6, (D) => tap(D, 'b')]]),
    [ix(/Test it/)]: script([[0.1, tilt('left')], [1.2, tilt('right')]]),
    [ix(/lay it flat/)]: script([[0.1, tilt('flat')]]),
    [ix(/Teach "F"/)]: script([[0.3, (D) => tap(D, 'logo')]]),
    [ix(/Teach it again/)]: script([[0.2, tilt('left')], [0.6, (D) => tap(D, 'a')], [1.6, tilt('right')], [2.0, (D) => tap(D, 'b')], [3.0, tilt('flat')], [3.4, (D) => tap(D, 'logo')], [4.6, tilt('up')]]),
  };
  const r = playMb(l, acts); ok(r.done && !/NOT DONE/.test(r.log.join(' ')), `mbgestureai: plays end to end — ${r.log.join(' | ')}`);
  const Mm = r.D.rt.mem.dists || {}; ok(Mm.leftL < 100 && Mm.rightR < 100 && Mm.flatL > 500 && Mm.up_ === undefined, `mbgestureai: distances: taught ones small (L ${Mm.leftL}, R ${Mm.rightR}), flat before F was taught ${Mm.flatL || Mm.flatR}`);
  const lastSee = l.steps[l.steps.length - 1].see.en; ok(/"\?" with a distance of \d+/.test(lastSee), 'mbgestureai: the last step reads the results: ' + lastSee.slice(0, 60));
  // blocks: not offered (lists of lists, functions with two results); the program still compiles after the edit
};
for (const l of [...L16, ...LM]) { if (only && !only.includes(l.id)) continue; try { T[l.id](l); } catch (e) { ok(false, `${l.id}: threw ${e.stack.split('\n').slice(0, 3).join(' ')}`); } }
console.log(fails ? `batch 16: ${fails} failed` : 'batch 16: all passed');
process.exit(fails ? 1 : 0);
