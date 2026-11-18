// Makes the printable DUET AR Cards: ar/print/duet-ar-cards-<body|space|science|robotics|maths|all>.pdf (A4, vector, fonts
// embedded, 4 cards a page, a cover page first) and their PNG previews (ar/print/duet-ar-cards-*.png).
//   1. pics: each card's picture is rendered from our own model by the DUET AR viewer itself (?print=1: the model alone on a
//      see-through background, then laid on the card's light panel colour) → <scratch>/cardpics/<id>.jpg
//   2. the QR codes (OpenCV's encoder, in Python) → <scratch>/qr.json
//   3. the PDFs from print.html?sheet=cards&set=…, and 300-dpi renders of every page for the camera tests (<scratch>/sheets/)
// Needs the static server on AR_BASE (default http://127.0.0.1:8817/). Usage: node devtools/ar/make_cards.mjs [pics] [pdf]
import puppeteer from 'puppeteer-core';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, unlinkSync } from 'node:fs';
const sharp = createRequire('/root/tools/node_modules/')('sharp');
const ROOT = new URL('../../', import.meta.url).pathname, OUT = ROOT + 'ar/print/';
const BASE = process.env.AR_BASE || 'http://127.0.0.1:8817/', SCRATCH = process.env.AR_SCRATCH || '/tmp/claude-0/agent-ar2/';
const SITE = 'https://ashutoshduet.github.io/duet-lms-media/ar/';
const PANEL = { r: 0xf4, g: 0xf2, b: 0xee };
const cat = JSON.parse(readFileSync(ROOT + 'ar/catalog.json', 'utf8'));
const cards = cat.items.filter((it) => it.card != null);
const args = process.argv.slice(2), want = (k) => !args.length || args.includes(k);
mkdirSync(SCRATCH + 'cardpics', { recursive: true }); mkdirSync(OUT, { recursive: true });
// how each picture is posed (degrees round, degrees up, nearer/further); the rest: a three-quarter view
const POSE = {
  owl: { az: 18 }, toad: { az: 30, el: 26 }, shark: { az: 60, el: 20 }, dolphin: { az: 55, el: 18 }, seaturtle: { az: 40, el: 32 },
  butterfly: { az: 10, el: 55 }, sunflower: { az: 0, el: 8 }, uno: { az: 20, el: 42 }, l298n: { az: 25, el: 38 }, irsensor: { az: 150, el: 30 },
  car: { az: 35, el: 30 }, linecar: { az: 35, el: 30 }, robotarm: { az: 60, el: 22 }, hcsr04: { az: 20, el: 14 }, iss: { az: 30, el: 35 }, hubble: { az: 40 },
  eye: { az: 50 }, ear: { az: 70 }, skeleton: { az: 15, el: 8 }, body: { az: 15, el: 8 }, digestive: { az: 10, el: 6 }, circulatory: { az: 10, el: 6 }, nervous: { az: 10, el: 6 },
  salt: { az: 35, el: 28 }, methane: { az: 25, el: 18 }, cube: { az: 35, el: 24 }, cuboid: { az: 35, el: 24 }, pyramid: { az: 30, el: 20 }, prism: { az: 50, el: 22 },
  cylinder: { az: 30, el: 24 }, cone: { az: 30, el: 18 }, hemisphere: { az: 30, el: 26 }, saturn: { az: 30, el: 22 }, pragyan: { az: 40, el: 22 }, vikram: { az: 35, el: 16 },
};

const launch = () => puppeteer.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', headless: true, protocolTimeout: 900000,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox', '--font-render-hinting=none'] });

if (want('pics')) {
  let b = await launch(), pg = null;
  const open = async () => {
    pg = await b.newPage(); await pg.setViewport({ width: 800, height: 420, deviceScaleFactor: 1.5 });
    pg.on('pageerror', (e) => console.log('page error', e.message));
    await pg.goto(BASE + 'ar/index.html?print=1&model=' + cards[0].id + '&mode=screen', { waitUntil: 'load', timeout: 120000 });
    await pg.waitForFunction(() => document.title === 'READY', { timeout: 300000 });
  };
  await open();
  const only = args.filter((a) => a !== 'pics' && a !== 'pdf');
  for (const it of cards) {
    if (only.length && !only.includes(it.id)) continue;
    for (let tries = 0; tries < 3; tries++) {
      try {
        await pg.evaluate((id, o) => window.__thumb(id, o), it.id, { zoom: 0.8, noShadow: true, ...(POSE[it.id] || {}) });
        const png = await pg.screenshot({ type: 'png', omitBackground: true });
        // trim to the model, keep its shadow, fit it into the card's 89 × 45 mm panel (at ~300 dpi), lay it on the panel colour
        const { data, info } = await sharp(png).raw().toBuffer({ resolveWithObject: true });
        let x0 = info.width, y0 = info.height, x1 = 0, y1 = 0;   // the model's box: every pixel that is not (nearly) see-through
        for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) if (data[(y * info.width + x) * 4 + 3] > 24) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
        if (x1 <= x0) throw new Error('empty picture');
        const trimmed = await sharp(png).extract({ left: x0, top: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 }).png().toBuffer();
        const meta = { width: x1 - x0 + 1, height: y1 - y0 + 1 }, W = 1040, H = 520, k = Math.min((W * 0.94) / meta.width, (H * 0.92) / meta.height);
        const rw = Math.round(meta.width * k), rh = Math.round(meta.height * k);
        const fitted = await sharp(trimmed).resize(rw, rh).toBuffer();
        // a soft contact shadow under things that stand (not under planets and spacecraft, which float)
        const left = Math.round((W - rw) / 2), top = Math.round((H - rh) / 2), layers = [];
        if (!it.float && !it.planet) {
          const sw = Math.round(rw * 0.78), sh = Math.max(10, Math.round(H * 0.07));
          const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${sw + 80}" height="${sh + 80}"><defs><filter id="b"><feGaussianBlur stdDeviation="${Math.round(sh * 0.35) + 6}"/></filter></defs><ellipse cx="${(sw + 80) / 2}" cy="${(sh + 80) / 2}" rx="${sw / 2}" ry="${sh / 2}" fill="rgba(60,52,44,0.30)" filter="url(#b)"/></svg>`;
          layers.push({ input: Buffer.from(svg), left: Math.round(W / 2 - (sw + 80) / 2), top: Math.min(H - sh - 80, Math.round(top + rh - (sh + 80) / 2 - sh * 0.1)) });
        }
        layers.push({ input: fitted, left, top });
        await sharp({ create: { width: W, height: H, channels: 3, background: PANEL } })
          .composite(layers)
          .jpeg({ quality: 86, mozjpeg: true }).toFile(SCRATCH + 'cardpics/' + it.id + '.jpg');
        console.log('pic', it.id, rw + '×' + rh);
        break;
      } catch (e) {
        console.log(it.id, 'failed (' + e.message.slice(0, 80) + '), retrying');
        try { await b.close(); } catch (e2) { /* gone */ }
        b = await launch(); await open();
      }
    }
  }
  await b.close();
}

if (want('pdf')) {
  // QR codes: one per card (opens DUET AR on that card) and one for the scanner (on the covers)
  const urls = { scan: SITE + '?scan=1' }; for (const it of cards) urls[it.id] = SITE + '?c=' + it.id;
  writeFileSync(SCRATCH + 'qr_in.json', JSON.stringify(urls));
  execFileSync('python3', ['-c', `
import json, cv2, numpy as np
u = json.load(open('${SCRATCH}qr_in.json')); p = cv2.QRCodeEncoder_Params(); p.correction_level = cv2.QRCODE_ENCODER_CORRECT_LEVEL_M
e = cv2.QRCodeEncoder.create(p); d = cv2.QRCodeDetector(); out = {}
for k, v in u.items():
    im = e.encode(v); big = cv2.resize(im, None, fx=8, fy=8, interpolation=cv2.INTER_NEAREST)
    assert d.detectAndDecode(big)[0] == v, k
    out[k] = (im < 128).astype(int).tolist()
json.dump(out, open('${SCRATCH}qr.json', 'w'))`]);
  const qr = JSON.parse(readFileSync(SCRATCH + 'qr.json', 'utf8'));
  const pics = {}; for (const it of cards) { const f = SCRATCH + 'cardpics/' + it.id + '.jpg'; if (existsSync(f)) pics[it.id] = 'data:image/jpeg;base64,' + readFileSync(f).toString('base64'); }
  const data = { items: cat.items, groups: cat.groups, pics, qr, url: SITE + '?scan=1' };
  const b = await launch();
  mkdirSync(SCRATCH + 'sheets', { recursive: true });
  for (const set of ['body', 'space', 'science', 'robotics', 'maths', 'all']) {
    const pg = await b.newPage(); const errs = [];
    pg.on('pageerror', (e) => errs.push(e.message)); pg.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
    await pg.evaluateOnNewDocument((d) => { window.CARDS = d; }, data);
    await pg.goto(BASE + 'devtools/ar/print.html?sheet=cards&set=' + set, { waitUntil: 'networkidle0', timeout: 120000 });
    await pg.waitForFunction(() => window.READY === true, { timeout: 120000 });
    await new Promise((r) => setTimeout(r, 500));
    const info = await pg.evaluate(() => window.SHEET);
    const pdf = OUT + 'duet-ar-cards-' + set + '.pdf';
    await pg.pdf({ path: pdf, width: '210mm', height: '297mm', printBackground: true, preferCSSPageSize: true });
    if (errs.length) console.log(set, 'errors:', errs);
    await pg.close();
    // previews: the cover and the first sheet (60 dpi), side by side
    const pre = SCRATCH + 'pre-' + set;
    execFileSync('pdftoppm', ['-png', '-r', '60', '-f', '1', '-l', '2', pdf, pre]);
    const pp = readdirSync(SCRATCH).filter((x) => x.startsWith('pre-' + set + '-') && x.endsWith('.png')).sort().map((x) => SCRATCH + x);
    const ims = await Promise.all(pp.map((x) => sharp(x).metadata()));
    await sharp({ create: { width: ims.reduce((s, m) => s + m.width, 0) + 12 * (ims.length - 1), height: Math.max(...ims.map((m) => m.height)), channels: 3, background: '#d9dce1' } })
      .composite(pp.map((x, i) => ({ input: x, left: i * (ims[0].width + 12), top: 0 }))).png().toFile(OUT + 'duet-ar-cards-' + set + '.png');
    if (set === 'all') await sharp(pp[0]).png().toFile(OUT + 'duet-ar-cards-cover.png');
    for (const x of pp) unlinkSync(x);
    // the 300-dpi pages for the camera tests (one set is enough: 'all' has every card)
    if (set === 'all') execFileSync('pdftoppm', ['-png', '-r', '300', pdf, SCRATCH + 'sheets/all']);
    console.log('made', 'duet-ar-cards-' + set + '.pdf', info.pages + ' pages');
  }
  await b.close();
}
