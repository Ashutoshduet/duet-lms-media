// usage: node exptest.mjs outdir id1,id2,... [query]
import puppeteer from 'puppeteer-core';
const [,, out, ids, q = 'mute&speed=4&fast'] = process.argv;
const browser = await puppeteer.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', headless: true,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage(); await page.setViewport({ width: 1280, height: 800 });
const logs = []; page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning' || (m.type() === 'warn' && /step failed/.test(m.text()))) logs.push(m.type() + ': ' + m.text()); });
page.on('pageerror', (e) => logs.push('PAGEERR: ' + e.message));
await page.goto(`http://localhost:${process.env.PORT||8766}${process.env.APPDIR||""}/index.html?test&${q}`, { waitUntil: 'load', timeout: 120000 });
await page.waitForFunction(() => document.title === 'READY', { timeout: 120000 });
await page.evaluate(() => { window.__ev = []; app.lab.listeners.push((e) => { if (!['pouring','heating','mg_burning','drop'].includes(e.type)) window.__ev.push(e.type); }); });
for (const id of ids.split(',')) {
  await page.evaluate((id) => { app.openExp(id); setTimeout(() => app.runner.play(), 2500); }, id);
  const t0 = Date.now(); let lastDone = -1; let st;
  while (Date.now() - t0 < (+process.env.TMAX || 240000)) {
    await new Promise((r) => setTimeout(r, 700));
    st = await page.evaluate(() => ({ s: app.runner.state, i: app.runner.i, d: [...(app.runner.done || [])].length }));
    if (st.d - 1 > lastDone) { lastDone = st.d - 1; await page.evaluate(() => app.renderer.render(app.scene, app.camera)); await page.screenshot({ path: `${out}/${id}-${lastDone}.png` }); }
    if (st.s === 'finished') break;
  }
  const ev = await page.evaluate(() => (window.__ev || []).splice(0).join(" "));
  const info = await page.evaluate(() => app.lab.vessels.filter(v => v.ml > 0.05).map(v => `${v.kind}:${v.ml.toFixed(1)}mL ${Object.entries(v.mix.liq).filter(([,m])=>m>0.05).map(([k,m])=>k+'='+m.toFixed(1)).join(',')} ppt[${Object.entries(v.mix.ppt).map(([k,m])=>k+'='+m.toFixed(2)).join(',')}] T=${v.mix.temp.toFixed(0)} pH=${v.mix.pH().toFixed(1)}`));
  logs.push(`${id}: EV[${ev}] ${JSON.stringify(st)} ${((Date.now() - t0) / 1000).toFixed(0)}s\n   ${info.join('\n   ')}`);
}
console.log(logs.join('\n')); await browser.close();
