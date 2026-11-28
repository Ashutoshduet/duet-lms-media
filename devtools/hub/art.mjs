// DUET STEM 360: the hub's icons, drawn in headless Chrome from the DUET STEM logo and our own artwork.
//   node devtools/hub/art.mjs   -> hub/icons/icon-192.png, icon-512.png, maskable-512.png
import fs from 'fs';
import path from 'path';
import { REPO, ORIGIN, launch, closePage, newPage } from './lib.mjs';

const html = (scale) => `<!doctype html><html><head><style>
@font-face{font-family:N;font-weight:700;src:url(${ORIGIN}science/fonts/nsd-latin-700.woff2)}
html,body{margin:0;width:512px;height:512px;overflow:hidden;background:#0b0e14}
.bg{position:absolute;inset:0;background:radial-gradient(420px 380px at 28% 22%,#1d2635 0%,#121822 55%,#0b0e14 100%)}
.in{position:absolute;inset:0;transform:scale(${scale});transform-origin:50% 50%}
svg{position:absolute;inset:0}
.logo{position:absolute;left:50%;top:118px;width:300px;transform:translateX(-50%)}
.n{position:absolute;left:0;right:0;top:186px;text-align:center;font:700 176px/1 N,sans-serif;color:#f6f1e8;letter-spacing:-4px;text-shadow:0 6px 24px rgba(0,0,0,.45)}
</style></head><body><div class="bg"></div><div class="in">
<svg viewBox="0 0 512 512" width="512" height="512"><defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="#ffbe72"/><stop offset="1" stop-color="#f08a24"/></linearGradient></defs>
 <g transform="rotate(-10 256 272)"><path d="M56 272 A200 62 0 0 1 456 272" fill="none" stroke="url(#g)" stroke-width="13" stroke-linecap="round" opacity=".55"/></g></svg>
<img class="logo" src="${ORIGIN}science/brand/duet-stem-logo-light.png">
<div class="n">360</div>
<svg viewBox="0 0 512 512" width="512" height="512"><defs><linearGradient id="h" x1="0" x2="1"><stop offset="0" stop-color="#ffbe72"/><stop offset="1" stop-color="#f08a24"/></linearGradient></defs>
 <g transform="rotate(-10 256 272)"><path d="M456 272 A200 62 0 0 1 83 303" fill="none" stroke="url(#h)" stroke-width="13" stroke-linecap="round"/><path d="M94 331 L83 303 L112 297" fill="none" stroke="url(#h)" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"/></g></svg>
</div></body></html>`;

const out = path.join(REPO, 'hub/icons'); fs.mkdirSync(out, { recursive: true });
const b = await launch(); const p = await newPage(b, { native: false, licence: false, width: 512, height: 512 });
for (const [name, scale, size] of [['icon-512.png', 1, 512], ['maskable-512.png', 0.78, 512], ['icon-192.png', 1, 192]]) {
  await p.setContent(html(scale), { waitUntil: 'load', timeout: 60000 });
  await p.waitForFunction(() => [...document.images].every((i) => i.complete && i.naturalWidth), { timeout: 30000 });
  await p.evaluate(() => document.fonts.ready);
  const buf = await p.screenshot({ type: 'png', clip: { x: 0, y: 0, width: 512, height: 512 } });
  fs.writeFileSync(path.join(out, name + '.tmp.png'), buf);
  const { execFileSync } = await import('child_process');
  execFileSync('python3', ['-c', `from PIL import Image\nim=Image.open('${path.join(out, name + '.tmp.png')}').convert('RGB').resize((${size},${size}),Image.LANCZOS)\nim.save('${path.join(out, name)}',optimize=True)`]);
  fs.unlinkSync(path.join(out, name + '.tmp.png'));
}
await closePage(p); await b.close();
console.log('hub/icons: icon-192.png, icon-512.png, maskable-512.png');
