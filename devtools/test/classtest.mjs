// End-to-end test of the classroom over the real public PeerJS server: the teacher's page and students in the apps.
// usage: (repo root served on PORT, default 8790) node devtools/test/classtest.mjs <outdir> [science|body ...]
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
const [,, out = '/tmp/classtest', ...apps0] = process.argv; const apps = apps0.length ? apps0 : ['science', 'maths'];
fs.mkdirSync(out, { recursive: true });
const PORT = process.env.PORT || 8790, base = `http://localhost:${PORT}`;
const proxy = process.env.HTTPS_PROXY || process.env.https_proxy;
const browser = await puppeteer.launch({ protocolTimeout: 600000, executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', headless: true,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox', '--autoplay-policy=no-user-gesture-required', '--disable-features=WebRtcHideLocalIpsWithMdns,IntensiveWakeUpThrottling', '--disable-background-timer-throttling', '--disable-backgrounding-occluded-windows', '--disable-renderer-backgrounding',
    ...(proxy ? [`--proxy-server=${proxy}`, '--proxy-bypass-list=localhost;127.0.0.1'] : [])] });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const tap = async (p, sel) => { for (let i = 0; i < 60; i++) { try { if (await p.$eval(sel, (el) => { if (el.disabled) return false; el.click(); return true; })) return; } catch (e) {} await sleep(250); } throw new Error('no ' + sel); };
const logs = [];
const ok = (c, m) => { logs.push((c ? 'PASS ' : 'FAIL ') + m); console.log((c ? 'PASS ' : 'FAIL ') + m); };
async function page(url, tag, vw = { width: 1280, height: 800 }) {
  const ctx = await browser.createBrowserContext(); const p = await ctx.newPage(); await p.setViewport(vw);
  p.on('console', (m) => { if (m.type() === 'error') logs.push(`[${tag}] ${m.text()}`); }); p.on('pageerror', (e) => logs.push(`[${tag}] PAGEERR ${e.message}`));
  await p.goto(url, { waitUntil: 'load', timeout: 120000 }); return p;
}
const waitFor = async (p, fn, arg, ms = 30000) => { // polled from here: a page in the background has its own timers slowed down
  const t0 = Date.now(); while (Date.now() - t0 < ms) { try { if (await p.evaluate(fn, arg)) return true; } catch (e) {} await sleep(300); } return false; };

// teacher
const T = await page(`${base}/class/`, 'teacher', { width: 1366, height: 900 });
await T.evaluate(() => localStorage.clear()); await T.reload({ waitUntil: 'load' });
await T.type('#c-name', '8 B · Science'); await tap(T, '[data-a="create"]');
ok(await waitFor(T, () => document.querySelector('#net.ok') || document.querySelector('.net.ok'), null, 40000), 'teacher page connected to the PeerJS server');
const code = await T.evaluate(() => document.querySelector('#code').textContent); ok(/^\d{4}$/.test(code), `class code ${code}`);

// students
const S = [];
for (const [i, a] of apps.entries()) {
  const url = a === 'body' ? `${base}/body/index.html?shot=20` : `${base}/${a}/index.html?test&mute&fast`;
  const p = await page(url, a + (i + 1)); let ready = false; try { await p.waitForFunction(() => document.title === 'READY' && window.app && window.app.cls, { timeout: 180000 }); ready = true; } catch (e) {} ok(ready, `${a} app loaded`);
  // three 3D apps drawn in software on a small machine: each draws a frame only every 0.7 s, so the pages stay responsive
  await p.evaluate(() => { app.renderer.setAnimationLoop(null); setInterval(() => { try { app.frame(); } catch (e) {} }, 700); });
  await p.evaluate((code, roll, name) => app.cls.link.join(code, roll, name), code, String(i + 1), ['Asha', 'Ravi', 'Meena'][i] || 'S');
  S.push({ p, a, roll: String(i + 1) });
}
for (const s of S) ok(await waitFor(s.p, () => app.cls.link.state === 'on', null, 40000), `${s.a} student ${s.roll} connected (state ${await s.p.evaluate(() => app.cls.link.state + ' ' + app.cls.link.err)})`);
ok(await waitFor(T, (n) => document.querySelectorAll('.card:not(.off)').length >= n, S.length, 20000), `teacher sees ${S.length} students`);

// what each student is doing, and their screens
const s1 = S[0];
if (s1.a !== 'body') await s1.p.evaluate(() => app.openExp('bw10_pond_chain')); else await s1.p.evaluate(() => app.cls.ad.open('lab:heart'));
ok(await waitFor(T, () => /pond|Heart|हृदय|तालाब/i.test(document.querySelector('.card[data-roll="1"] .act')?.textContent || ''), null, 45000), 'teacher sees the activity of student 1: ' + await T.evaluate(() => document.querySelector('.card .act')?.textContent));
ok(await waitFor(T, () => document.querySelectorAll('.card .thumb img').length >= 1, null, 30000), 'live screen thumbnails arrive');
await T.screenshot({ path: `${out}/teacher-live.png` });

// raise hand
await s1.p.evaluate(() => app.cls.link.raiseHand(true));
ok(await waitFor(T, () => !!document.querySelector('.card.help'), null, 10000), 'raised hand shows on the teacher page');
await tap(T, '.card.help [data-a="lower"]');
ok(await waitFor(s1.p, () => !app.cls.link.help, null, 10000), 'teacher lowers the hand');

// eyes on me
await tap(T, '[data-a="eyes"]'); await T.waitForSelector('#etxt'); await T.type('#etxt', 'Look at the board'); await tap(T, '#dlg-b [data-x="go"]');
{ const t0 = Date.now(); const r = await waitFor(s1.p, () => !!document.querySelector('.dc-freeze') && app.cls.link.frozen && app.cls.link.frozen.msg === 'Look at the board', null, 20000);
  ok(r, `eyes-on-me freezes the student screen (${Date.now() - t0} ms; ${await s1.p.evaluate(() => JSON.stringify(app.cls.link.frozen))}; teacher frozen ${await T.evaluate(() => JSON.stringify(DUETCLASS.S.frozen))})`); }
await s1.p.screenshot({ path: `${out}/student-frozen.png` });
await tap(T, '[data-a="eyes"]');
ok(await waitFor(s1.p, () => !document.querySelector('.dc-freeze'), null, 10000), 'resume unfreezes');

// message
await tap(T, '[data-a="msg"]'); await T.waitForSelector('#mtxt'); await T.type('#mtxt', 'Well done'); await tap(T, '#dlg-b [data-x="go"]');
ok(await waitFor(s1.p, () => (document.querySelector('.dc-msg')?.textContent || '').includes('Well done') || (app.cls.link.msg && app.cls.link.msg.text === 'Well done'), null, 25000), 'message reaches the student');

// send everyone to an activity (science-side students)
if (S.length > 1 && S[1].a !== 'body') {
  await tap(T, '[data-a="send"]'); await T.waitForSelector('#q'); if (await T.$('#dlg-b [data-x="app"][data-v="maths"]')) { await tap(T, '#dlg-b [data-x="app"][data-v="maths"]'); await sleep(300); } await T.type('#q', 'flagpole'); await sleep(300);
  await sleep(500); await tap(T, '#dlg-b [data-x="o1"]');
  ok(await waitFor(S[1].p, () => app.runner.exp && /flagpole/.test(app.runner.exp.id), null, 15000), 'send-to-activity opens it on student 2: ' + await S[1].p.evaluate(() => app.runner.exp && app.runner.exp.id));
}

// a quiz started by the teacher, answered by student 1
await tap(T, '[data-a="quiz"]'); await T.waitForSelector('#dlg-b [data-x="cur"]'); await tap(T, '#dlg-b [data-x="cur"]');
ok(await waitFor(s1.p, () => !!app.cls.quiz, null, 10000), 'teacher starts a quiz on the student');
await sleep(500); await s1.p.screenshot({ path: `${out}/student-quiz.png` });
const n = await s1.p.evaluate(async () => { const z = app.cls.quiz; if (!z) return 0; let n = 0; while (z.state !== 'done' && n < 20) { const k = n % 2 ? z.cur.right : (z.cur.right + 1) % z.cur.opts.length; app.cls.pick(k); await new Promise((r) => setTimeout(r, 150)); app.cls.qNext(); n++; } return z.qs.length; });
await s1.p.screenshot({ path: `${out}/student-quiz-done.png` });
ok(await waitFor(T, () => DUETCLASS.cls().results.some((r) => r.kind === 'quiz'), null, 15000), `quiz result (${n} questions) reaches the teacher`);
ok(await waitFor(s1.p, () => app.cls.link.results.filter((r) => r.kind === 'quiz').every((r) => r.sent), null, 10000), 'teacher confirms the result to the student');

// an activity finished
if (s1.a !== 'body') {
  await s1.p.evaluate(() => { app.openExp('bw6_living_sort'); setTimeout(() => app.runner.play(), 1500); });
  ok(await waitFor(s1.p, () => app.runner.state === 'finished', null, 240000), 'student 1 finishes an activity');
  ok(await waitFor(T, () => DUETCLASS.cls().results.some((r) => r.kind === 'activity' && r.id === 'bw6_living_sort'), null, 15000), 'activity result reaches the teacher');
}

// results tab, attendance, watch
await tap(T, '.tabs [data-tab="results"]'); await sleep(500); await T.screenshot({ path: `${out}/teacher-results.png`, fullPage: true });
ok(await T.evaluate(() => document.querySelectorAll('.sc').length >= 1), 'results table has scores');
await tap(T, '.tabs [data-tab="att"]'); await sleep(300); await T.screenshot({ path: `${out}/teacher-att.png` });
await tap(T, '.tabs [data-tab="live"]'); await sleep(300);
await tap(T, `.card[data-roll="1"] [data-a="watch"]`); await s1.p.bringToFront(); await sleep(4000); await T.bringToFront();
ok(await waitFor(T, () => (document.querySelector('#bigimg')?.naturalWidth || 0) >= 400, null, 45000), 'watch shows a big live picture');
await T.screenshot({ path: `${out}/teacher-watch.png` }); await T.keyboard.press('Escape');

// the student's network drops and comes back: an unsent result is sent again
await s1.p.evaluate(() => { app.cls.link.conn.close(); });
ok(await waitFor(s1.p, () => app.cls.link.state === 'on', null, 40000), 'student reconnects by itself');

// Human Body: the teacher sends the student to the heart lab, then a "name the glowing part" quiz
const B = S.find((x) => x.a === 'body');
if (B) {
  await tap(T, '.tabs [data-tab="live"]'); await sleep(300);
  await tap(T, `.card[data-roll="${B.roll}"] [data-a="send1"]`); await T.waitForSelector('#q'); await T.type('#q', 'heart'); await sleep(300);
  await sleep(500); await tap(T, '#dlg-b [data-x="o1"]');
  ok(await waitFor(B.p, () => app.mode === 'lab' || !!app.journey || !!app.splitter.set, null, 30000), 'body student opened what the teacher sent: ' + await B.p.evaluate(() => app.mode + ' ' + (app.labId || (app.journey && app.journey.id) || '')));
  await tap(T, `.card[data-roll="${B.roll}"] [data-a="quiz1"]`); await T.waitForSelector('#dlg-b [data-x="q1"]');
  const sysb = await T.$('#dlg-b [data-x="q1"][data-id^="sys:"]'); await (sysb || await T.$('#dlg-b [data-x="q1"]')).click();
  ok(await waitFor(B.p, () => !!app.cls.quiz, null, 15000), 'body quiz started: ' + await B.p.evaluate(() => app.cls.quiz && app.cls.quiz.meta.id));
  await B.p.bringToFront(); await sleep(2500); await B.p.screenshot({ path: `${out}/body-quiz.png` });
  ok(await B.p.evaluate(() => !app.cls.quiz.cur.part || app._quizPart === app.cls.quiz.cur.part), 'the asked part glows on the body');
  await B.p.evaluate(async () => { const z = app.cls.quiz; while (z.state !== 'done') { app.cls.pick(z.cur.right); await new Promise((r) => setTimeout(r, 120)); app.cls.qNext(); } });
  ok(await waitFor(T, (r) => DUETCLASS.cls().results.some((x) => x.roll === r && x.kind === 'quiz'), B.roll, 15000), 'body quiz result reaches the teacher');
}

// end class
T.on('dialog', (d) => d.accept()); await tap(T, '[data-a="end"]');
ok(await waitFor(s1.p, () => app.cls.link.state === 'off', null, 10000), 'end class disconnects the students');

await T.evaluate(() => { DUETCLASS.D.cur = Object.keys(DUETCLASS.D.classes)[0]; });
console.log('\n' + logs.filter((l) => !/^(PASS|FAIL)/.test(l)).slice(0, 30).join('\n'));
const fails = logs.filter((l) => l.startsWith('FAIL')).length; console.log(`\n${fails ? fails + ' FAILED' : 'ALL PASSED'}`);
await browser.close(); process.exit(fails ? 1 : 0);
