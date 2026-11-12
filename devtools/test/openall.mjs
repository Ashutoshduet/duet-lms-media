import puppeteer from 'puppeteer-core';
const browser = await puppeteer.launch({ protocolTimeout: 900000, executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox', '--mute-audio'] });
const page = await browser.newPage(); await page.setViewport({ width: 640, height: 400 });
const errs = []; page.on('pageerror', (e) => errs.push(e.message));
await page.goto(`http://127.0.0.1:${process.env.PORT||8766}${process.env.APPDIR||''}/index.html?test&mute&fast`, { waitUntil: 'load', timeout: 180000 });
await page.waitForFunction(() => document.title === 'READY', { timeout: 180000 });
const r = await page.evaluate(async () => { app.demo = false; const { BY_ID } = await import('./js/experiments.js'); const ids = Object.keys(BY_ID); const bad = []; let n = 0, grads = 0;
  for (const id of ids) { try { app.openExp(id); await new Promise((r) => setTimeout(r, 250)); n++; grads += app.lab.vessels.filter((v) => v.grad).length; } catch (e) { bad.push(id + ': ' + e.message); } }
  return { n, total: ids.length, grads, bad }; });
console.log(JSON.stringify(r), 'pageerrors', JSON.stringify(errs.slice(0, 5))); await browser.close();
