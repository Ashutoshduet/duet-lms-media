// Pictures of a story at chosen times: node devtools/theatre/shot.mjs <story> <out-prefix> <t1,t2,...> [lang] [w] [h] [mode]
// Times are seconds, or b<i>[.<f>] for beat i at fraction f (b3.5 = halfway through beat 3).
import puppeteer from 'puppeteer-core';
const [,, id, out, times, lang = 'en', w = '1280', h = '720', mode = 'screen'] = process.argv;
const PORT = process.env.PORT || 8805;
const b = await puppeteer.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', headless: true, protocolTimeout: 600000, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox', '--autoplay-policy=no-user-gesture-required', '--disable-background-networking', '--disable-component-update', '--no-first-run', '--disable-sync', '--disable-default-apps'] });
const pg = await b.newPage(); await pg.setViewport({ width: +w, height: +h });
const errs = []; pg.on('pageerror', (e) => { errs.push('ERR ' + e.message); if (process.env.V) console.log('ERR', e.message); }); pg.on('console', (m) => { if (process.env.V) console.log(m.type(), m.text().slice(0, 300)); if (m.type() === 'error' || m.type() === 'warning') errs.push(m.type() + ' ' + m.text()); });
await pg.goto(`http://127.0.0.1:${PORT}/theatre/index.html?s=${id}&lang=${lang}&shot`, { waitUntil: 'load', timeout: 120000 });
for (let i = 0; ; i++) { const st = await pg.evaluate(() => window.THEATRE ? window.THEATRE.state : 'none'); if (st === 'ready') break; if (process.env.V && i % 10 === 0) console.log('state', st, i); if (i > 600) { console.log('TIMEOUT', st, errs.join('\n')); process.exit(1); } await new Promise((r) => setTimeout(r, 500)); }
if (mode !== 'screen') await pg.evaluate((m) => window.THEATRE.setMode(m), mode);
const beats = await pg.evaluate(() => window.THEATRE.beats.map((b) => [b.t0, b.dur]));
let n = 0;
for (const t of times.split(',')) {
  let T = +t; const m = /^b(\d+)(?:\.(\d+))?$/.exec(t); if (m) { const [t0, d] = beats[+m[1]]; T = t0 + d * (m[2] ? +('0.' + m[2]) : 0.9); }
  await pg.evaluate((T) => { const P = window.THEATRE; P.seek(T); P.state = 'pause'; }, T);
  await new Promise((r) => setTimeout(r, 900));
  await pg.screenshot({ path: `${out}_${String(++n).padStart(2, '0')}.png` });
}
console.log(JSON.stringify(await pg.evaluate(() => { const i = window.THEATRE.info(); delete i.loaded; return i; })));
if (errs.length) console.log(errs.slice(0, 12).join('\n'));
await b.close();
