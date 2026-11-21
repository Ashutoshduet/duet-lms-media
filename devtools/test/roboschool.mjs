// DUET Robotics Lab 360: the school layer end to end in a browser, with the class register (devtools/school-server/Code.gs)
// played by an in-memory copy of its actions: a teacher makes a class and an assignment, a student joins it in the lab
// with the 6-letter code, finishes lessons (scored: mistakes and hints), the teacher sees them live, the parents'
// portfolio shows them, the principal sees the school; and without the internet: the class QR text and a hand-in code.
//   PORT=8791 node devtools/test/roboschool.mjs        (a static server on the repo root: python3 -m http.server 8791)
import { createRequire } from 'module'; import { webcrypto as crypto } from 'crypto';
const require = createRequire(import.meta.url); const { chromium } = require('playwright');
const PORT = process.env.PORT || 8791, BASE = `http://127.0.0.1:${PORT}/robotics/`, SYNC = 'https://sync.test/exec';
let fails = 0; const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fails++; };
const sha = async (s) => Buffer.from(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s))).toString('hex');
const SCHOOL_CODE = 'DUET-TEST-SCHL-0001';
const norm = (s) => { const A = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'; let t = String(s).toUpperCase().replace(/[^0-9A-Z]/g, '').replace(/O/g, '0').replace(/[IL]/g, '1'); if (t.startsWith('DUET')) t = t.slice(4); return [...t].filter((c) => A.includes(c)).join(''); };
const SCHOOL_H = await sha('duet-lic|' + norm(SCHOOL_CODE));
// ------------------------------------------------------------ the register (as Code.gs)
const DB = { classes: {}, students: [], results: [] }; const calls = [];
async function api(p) {
  calls.push(p.a);
  const pub = (c) => ({ code: c.code, name: c.name, cls: c.cls, sec: c.sec, teacher: c.teacher, school: c.school, asg: c.asg });
  const results = (code) => { const st = DB.students.filter((s) => s.code === code).map((s) => ({ id: s.sid, name: s.name, roll: s.roll, last: s.last })); const best = {};
    for (const r of DB.results.filter((x) => x.code === code)) { const k = r.sid + '|' + r.l; const o = best[k]; if (!o || r.sc > o[3]) best[k] = [r.sid, r.l, r.s, r.sc, r.t, r.m, r.h, r.ch || 0, r.d]; }
    return { students: st, res: Object.values(best) }; };
  switch (p.a) {
    case 'mkclass': { const c = DB.classes[p.code]; if (c && c.tk !== await sha('t|' + p.tk)) return { ok: false, err: 'taken' }; DB.classes[p.code] = { code: p.code, tk: await sha('t|' + p.tk), name: p.name, cls: p.cls, sec: p.sec, teacher: p.teacher, school: p.school, sh: p.sh || '', asg: p.asg || [] }; return { ok: true, made: true }; }
    case 'setclass': { const c = DB.classes[p.code]; if (!c) return { ok: false, err: 'none' }; if (c.tk !== await sha('t|' + p.tk)) return { ok: false, err: 'key' }; if (p.asg) c.asg = p.asg; return { ok: true }; }
    case 'join': { const c = DB.classes[p.code]; return c ? { ok: true, cls: pub(c) } : { ok: false, err: 'none' }; }
    case 'post': { if (!DB.classes[p.code]) return { ok: false, err: 'none' }; let s = DB.students.find((x) => x.code === p.code && x.sid === p.sid); if (!s) DB.students.push(s = { code: p.code, sid: p.sid }); Object.assign(s, { name: p.name, roll: p.roll, pk: p.pk, last: Date.now() });
      for (const r of p.res) DB.results.push(Object.assign({ code: p.code, sid: p.sid }, r)); return { ok: true, n: p.res.length }; }
    case 'class': { const c = DB.classes[p.code]; if (!c) return { ok: false, err: 'none' }; if (c.tk !== await sha('t|' + p.tk)) return { ok: false, err: 'key' }; return Object.assign({ ok: true, cls: pub(c) }, results(p.code)); }
    case 'school': { const h = await sha('duet-lic|' + norm(p.k)); if (h !== SCHOOL_H) return { ok: false, err: 'code' }; return { ok: true, classes: Object.values(DB.classes).filter((c) => c.sh === h).map((c) => Object.assign({ cls: pub(c) }, results(c.code))) }; }
    case 'student': { const me = DB.students.filter((s) => s.pk === p.pk); if (!me.length) return { ok: false, err: 'none' }; return { ok: true, sid: me[0].sid, name: me[0].name, roll: me[0].roll, classes: me.map((m) => ({ cls: pub(DB.classes[m.code]), res: results(m.code).res.filter((x) => x[0] === m.sid) })) }; }
  }
  return { ok: false, err: 'action' };
}
const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
async function context(online = true) {
  const ctx = await b.newContext({ viewport: { width: 1280, height: 760 } });
  await ctx.addInitScript(([h]) => { try { localStorage.setItem('duet.lic.v1', JSON.stringify({ h, u: '2027-12-31', a: ['*'], n: 'Test School, Solan', k: '0001', t: Date.now() })); } catch (e) { /* */ } }, [SCHOOL_H]);
  await ctx.route('**/licences.json*', async (r) => { const res = await r.fetch(); const j = await res.json(); if (online) j.sync = SYNC; j.codes[SCHOOL_H] = { u: '2027-12-31', a: ['*'], n: 0 }; await r.fulfill({ response: res, body: JSON.stringify(j) }); });
  await ctx.route(SYNC + '*', async (r) => { if (!online) return r.abort(); const q = r.request(); const p = q.method() === 'POST' ? JSON.parse(q.postData()) : Object.fromEntries(new URL(q.url()).searchParams); await r.fulfill({ contentType: 'application/json', body: JSON.stringify(await api(p)) }); });
  await ctx.route(/^https?:\/\/(?!127\.0\.0\.1|localhost|sync\.test)/, (r) => r.abort());
  return ctx;
}
const errs = []; const watch = (page, n) => { page.on('pageerror', (e) => errs.push(n + ': ' + e.message)); page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|ERR_FAILED|net::/.test(m.text())) errs.push(n + ' console: ' + m.text()); }); };
// ------------------------------------------------------------ 1. the teacher makes a class and an assignment
const tctx = await context(); const tp = await tctx.newPage(); watch(tp, 'teacher');
await tp.goto(BASE + 'teacher.html'); await tp.waitForSelector('#t-new');
await tp.click('#t-new'); await tp.fill('#n-n', 'Robotics 8-B'); await tp.selectOption('#n-c', '8'); await tp.fill('#n-s', 'B'); await tp.fill('#n-t', 'Mr Kumar'); await tp.click('#n-go');
await tp.waitForSelector('.code-big'); const code = (await tp.locator('.code-big').innerText()).trim();
ok(/^[0-9A-Z]{6}$/.test(code) && DB.classes[code] && DB.classes[code].sh === SCHOOL_H, `class made live with code ${code}, tied to the school`);
await tp.click('#t-asg'); await tp.fill('#a-t', 'Week 1: LEDs'); await tp.selectOption('#a-c', '6');
for (const id of ['blink', 'ledres']) await tp.check(`[data-id="${id}"]`);
await tp.click('#a-go'); await tp.waitForTimeout(500);
ok(DB.classes[code].asg.length === 1 && DB.classes[code].asg[0].ls.join() === 'blink,ledres', 'assignment saved to the register: ' + JSON.stringify(DB.classes[code].asg));
await tp.click('#t-jq'); ok(await tp.locator('.sk .qr svg').count() === 1, 'the join QR is shown'); await tp.keyboard.press('Escape');
await tp.click('#t-oq'); const offTxt = await tp.evaluate(() => document.querySelector('.sk .qr svg') ? 1 : 0); ok(offTxt === 1, 'the offline class QR is shown'); await tp.keyboard.press('Escape');
// ------------------------------------------------------------ 2. a student joins in the lab and finishes two lessons
const sctx = await context(); const sp = await sctx.newPage(); watch(sp, 'lab');
await sp.goto(BASE + 'index.html?test&mute&join=' + code, { waitUntil: 'commit' }); await sp.waitForFunction(() => document.title === 'READY', null, { timeout: 180000 });
await sp.waitForSelector('#sk-n', { timeout: 15000 }); await sp.fill('#sk-n', 'Riya Sharma'); await sp.fill('#sk-r', '12'); await sp.click('#sk-go');
await sp.waitForTimeout(800); const joined = await sp.evaluate(() => { const s = window.app.school.state; const p = s.profiles[s.me]; return p && p.joined; });
ok(joined && joined.includes(code), 'the ?join= link joined the class after the name was written: ' + JSON.stringify(joined));
const sheetTxt = await sp.locator('.sk').innerText(); ok(/Week 1: LEDs/.test(sheetTxt) && /0\/2/.test(sheetTxt), 'the assignment shows in the student\'s sheet (0/2)');
await sp.keyboard.press('Escape');
await sp.evaluate(() => { const a = window.app; a.openLesson('blink'); a.school.attempt.t = 130; a.onLessonComplete(a.rt.lesson); a.openLesson('ledres'); a.school.attempt.t = 200; a.school.attempt.m = 2; a.school.hint(); a.onLessonComplete(a.rt.lesson); });
const until = async (f, ms = 30000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await f()) return true; await sp.waitForTimeout(300); } return false; }; // (software GL on a busy machine: timers run late)
await until(() => DB.results.length >= 2);
ok(DB.results.filter((r) => r.l === 'blink' || r.l === 'ledres').length === 2, 'both results reached the register: ' + JSON.stringify(DB.results.map((r) => [r.l, r.s, r.sc, r.m, r.h])));
const r2 = DB.results.find((r) => r.l === 'ledres'); ok(r2 && r2.sc === 100 - 14 - 10 && r2.s === 2, 'ledres scored 76 (2 mistakes, 1 hint) = ★★');
// offline: a result waits, then goes
await sctx.setOffline(true); await sp.evaluate(() => { const a = window.app; a.openLesson('traffic'); a.school.attempt.t = 60; a.onLessonComplete(a.rt.lesson); });
await sp.waitForTimeout(800); const waiting = await sp.evaluate(() => (window.app.school.state.out || []).length);
ok(waiting >= 1 && !DB.results.some((r) => r.l === 'traffic'), `offline: ${waiting} result waits on the device`);
await sctx.setOffline(false); await sp.evaluate(() => window.dispatchEvent(new Event('online'))); await until(async () => DB.results.some((r) => r.l === 'traffic') && (await sp.evaluate(() => (window.app.school.state.out || []).length)) === 0);
ok(DB.results.some((r) => r.l === 'traffic') && (await sp.evaluate(() => (window.app.school.state.out || []).length)) === 0, 'back online: it was sent');
// ------------------------------------------------------------ 2b. the project card (self-learning: parts, wiring, code, ideas, quiz)
await sp.evaluate(() => window.app.openLesson('button')); await sp.waitForTimeout(500); await sp.click('#b-card'); await sp.waitForSelector('.sk table');
const need = await sp.locator('.sk').innerText(); ok(/Push button/.test(need) && /Resistor 220/.test(need) && /Jumper wires/.test(need), 'card: what you need (button, 220 Ω, wires)');
await sp.click('.sk [data-tab=conn]'); const conn = await sp.locator('#pc-b').innerText(); ok(/Arduino Uno pin 13/.test(conn) && /rail/.test(conn), 'card: how to connect');
await sp.click('.sk [data-tab=code]'); const codeT = await sp.locator('#pc-b').innerText(); ok(/digitalRead|INPUT/.test(codeT) && /setup\(\) runs once/.test(codeT), 'card: the code explained line by line');
await sp.click('.sk [data-tab=learn]'); const nq = await sp.locator('[data-q]').count(); ok(nq >= 2, `card: ideas and a ${nq}-question quiz`);
for (let k = 0; k < nq; k++) await sp.locator(`[data-q="${k}"] [data-a="0"]`).click();
ok(/\d\/\d right/.test(await sp.locator('#pc-sc').innerText()), 'quiz scored: ' + await sp.locator('#pc-sc').innerText());
await sp.keyboard.press('Escape');
// ------------------------------------------------------------ 2c. the helper: a burnt LED is named; three hints, the last places the part
await sp.evaluate(() => { const a = window.app; a.openLesson('ledres'); const s = a.rt.lesson.steps; a.rt.go(s.findIndex((x) => x.k === 'place')); a.afterStep(); });
await sp.click('#b-help'); await sp.waitForSelector('.sk'); ok(/Hint 1/.test(await sp.locator('.sk').innerText()), 'help: hint 1 for the place step');
const h0 = await sp.evaluate(() => window.app.school.attempt.h);
await sp.click('#hp-more'); ok(/hole 22e|row 22/.test(await sp.locator('.sk').innerText()), 'help: hint 2 names the hole');
await sp.click('#hp-more'); await sp.waitForTimeout(400);
ok(await sp.evaluate(() => !!window.app.lab.byTag('led1')), 'help: hint 3 placed the LED');
ok((await sp.evaluate(() => window.app.school.attempt.h)) === h0 + 2, 'help: two hints counted in the score');
await sp.keyboard.press('Escape');
await sp.evaluate(() => { const a = window.app; const p = a.lab.byTag('led1'); p.state.burnt = true; }); await sp.click('#b-help'); await sp.waitForSelector('.sk');
ok(/burnt out/.test(await sp.locator('.sk').innerText()), 'help: names the burnt LED and why'); await sp.keyboard.press('Escape');
// ------------------------------------------------------------ 3. the teacher sees the student live
await tp.click('#t-rf'); await tp.waitForTimeout(800);
const row = await tp.locator('tr[data-st]').first().innerText(); ok(/Riya Sharma/.test(row) && /2\/2/.test(row), 'teacher\'s table: Riya, Week 1 2/2: ' + row.replace(/\s+/g, ' '));
await tp.click('tr[data-st]'); await tp.waitForTimeout(300); ok(/Coding|Electronics/.test(await tp.locator('.sk').innerText()), 'the student\'s sheet: skills');
await tp.click('#t-ce'); await tp.waitForTimeout(2500); ok(await tp.evaluate(() => { const c = document.querySelector('canvas.cert'); return !!c && c.width === 2000; }), 'a certificate is drawn'); await tp.keyboard.press('Escape');
// ------------------------------------------------------------ 4. the parents' portfolio
const pk = await sp.evaluate(() => { const s = window.app.school.state; return s.profiles[s.me].pk; });
const pctx = await context(); const pp = await pctx.newPage(); watch(pp, 'portfolio');
await pp.goto(BASE + 'portfolio.html?p=' + pk); await pp.waitForSelector('h2'); await pp.waitForTimeout(800);
const ptxt = await pp.locator('#main').innerText(); ok(/Riya Sharma/.test(ptxt) && /Robotics 8-B/.test(ptxt) && /3\s*\n?\s*Projects done/i.test(ptxt), 'portfolio on another device: ' + ptxt.slice(0, 120).replace(/\s+/g, ' '));
// ------------------------------------------------------------ 5. the principal
await tp.click('#tabs [data-tab=principal]'); await tp.fill('#p-k', SCHOOL_CODE); await tp.click('#p-go'); await tp.waitForTimeout(800);
const ktxt = await tp.locator('#pane').innerText(); ok(/Robotics 8-B/.test(ktxt) && /Riya Sharma/.test(ktxt), 'principal: the class and the top student');
await tp.fill('#p-k', 'DUET-XXXX-YYYY-ZZZZ'); await tp.click('#p-go'); await tp.waitForTimeout(500); ok(/not a valid/.test(await tp.locator('#toast').innerText()), 'a wrong school code is refused');
// ------------------------------------------------------------ 6. no internet at all: the class QR text and a hand-in code
const octx = await context(false); const op = await octx.newPage(); watch(op, 'offline lab');
await op.goto(BASE + 'index.html?test&mute', { waitUntil: 'commit' }); await op.waitForFunction(() => document.title === 'READY', null, { timeout: 180000 }); await op.waitForTimeout(600);
const ccode = await op.evaluate(async () => { const S = await import('./js/school.js'); return S.classCode({ code: 'K7Q2MX', name: 'Robotics 6-A', cls: '6', sec: 'A', teacher: 'Ms Rao', school: 'GSSS', asg: [{ id: 'a1', due: '', title: 'LEDs', ls: ['blink', 'ledres'] }] }); });
await op.click('#b-me'); await op.fill('#sk-n', 'Aman'); await op.fill('#sk-r', '7'); await op.click('#sk-go'); await op.waitForTimeout(300);
await op.evaluate((c) => { document.querySelector('#sk-jc').value = c; }, ccode); await op.click('#sk-j'); await op.waitForTimeout(500);
ok(/Robotics 6-A/.test(await op.locator('.sk').innerText()), 'offline: joined from the class QR text');
await op.keyboard.press('Escape'); await op.evaluate(() => { const x = document.querySelector('.sk .x'); if (x) x.click(); const a = window.app; a.openLesson('blink'); a.school.attempt.t = 90; a.onLessonComplete(a.rt.lesson); });
await op.waitForTimeout(500); await op.click('#b-me', { timeout: 90000 }); await op.click('[data-hand]'); const hand = (await op.locator('.sk .code').innerText()).trim();
ok(/^RLH1\|K7Q2MX\|7\|Aman\|/.test(hand), 'hand-in code: ' + hand.slice(0, 40));
// the teacher (no internet) has that class and collects the hand-in
await tp.evaluate(() => { const st = window.teacher.state; st.tclasses.K7Q2MX = { tk: 'x', name: 'Robotics 6-A', cls: '6', sec: 'A', asg: [{ id: 'a1', title: 'LEDs', ls: ['blink', 'ledres'] }], offline: true }; });
await tp.click('#tabs [data-tab=classes]'); await tp.evaluate(() => window.teacher.render()); await tp.click('[data-cl="K7Q2MX"]'); await tp.evaluate((h) => window.teacher.addHandIns('K7Q2MX', h), hand); await tp.waitForTimeout(300);
ok(/Aman/.test(await tp.locator('tr[data-st]').first().innerText()), 'the teacher collected the hand-in offline');
ok(!errs.length, 'no page errors' + (errs.length ? ': ' + errs.slice(0, 5).join(' | ') : ''));
await b.close();
console.log(fails ? `${fails} FAILED` : 'all passed'); process.exit(fails ? 1 : 0);
