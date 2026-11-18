// Makes the printable DUET Pad (A4, A3) and DUET Cube PDFs and their PNG previews from print.html (vector, fonts embedded).
// Needs the static server: python3 -m http.server 8804 --bind 127.0.0.1 (from the repo root).
// Usage: node devtools/ar/make_print.mjs   → ar/print/duet-pad-a4.pdf, duet-pad-a3.pdf, duet-cube.pdf, *.png
// Also writes markers.json (for make_video.py) and big PNG renders for the test videos into the scratch folder.
import puppeteer from 'puppeteer-core';
import { execFileSync } from 'node:child_process';
import { writeFileSync, mkdirSync, renameSync } from 'node:fs';
import { asJSON } from '../../ar/js/markers.js';

const ROOT = new URL('../../', import.meta.url).pathname;
const OUT = ROOT + 'ar/print/';
const SCRATCH = process.env.AR_SCRATCH || '/tmp/claude-0/agent-ar/';
const BASE = process.env.AR_BASE || 'http://127.0.0.1:8804/';
mkdirSync(OUT, { recursive: true }); mkdirSync(SCRATCH, { recursive: true });
writeFileSync(SCRATCH + 'markers.json', JSON.stringify(asJSON(), null, 1));

const b = await puppeteer.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', headless: true, args: ['--no-sandbox', '--font-render-hinting=none'] });
for (const [sheet, name] of [['pad-a4', 'duet-pad-a4'], ['pad-a3', 'duet-pad-a3'], ['cube', 'duet-cube']]) {
  const pg = await b.newPage();
  const errs = []; pg.on('pageerror', (e) => errs.push(e.message)); pg.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
  await pg.goto(BASE + 'devtools/ar/print.html?sheet=' + sheet, { waitUntil: 'networkidle0' });
  await pg.waitForFunction(() => window.READY === true);
  const { w, h } = await pg.evaluate(() => window.SHEET);
  await pg.pdf({ path: OUT + name + '.pdf', width: w + 'mm', height: h + 'mm', printBackground: true, preferCSSPageSize: true });
  if (errs.length) console.log(sheet, 'errors:', errs);
  await pg.close();
  // previews: a small PNG next to the PDF; a sharp 300 dpi render (A4) for the test videos in the scratch folder
  execFileSync('pdftoppm', ['-png', '-r', '60', '-singlefile', OUT + name + '.pdf', OUT + name]);
  if (sheet !== 'pad-a3') execFileSync('pdftoppm', ['-png', '-r', '300', '-singlefile', OUT + name + '.pdf', SCRATCH + name + '-300dpi']);
  console.log('made', name, w + '×' + h + ' mm');
}
await b.close();
