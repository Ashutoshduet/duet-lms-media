// DUET Little Learners dev check: render models from three sides into one picture (early/test/view.html).
// usage: node devtools/early/sheet.mjs out.png id1,id2,... [tile=200]   (needs the static server on port 8806)
import puppeteer from '/root/tools/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';
const [out, ids, t = '200'] = process.argv.slice(2);
const b = await puppeteer.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await b.newPage(); p.on('pageerror', (e) => console.log('PAGEERROR', e.message)); p.on('console', (m) => { if (m.type() === 'error') console.log('CONSOLE', m.text()); });
await p.setViewport({ width: 800, height: 600 });
await p.goto(`http://127.0.0.1:8806/early/test/view.html?ids=${ids}&t=${t}`); await p.waitForFunction('window.__done', { timeout: 300000 });
console.log((await p.evaluate('window.__done')).join('\n')); const el = await p.$('#out'); await el.screenshot({ path: out }); await b.close();
