// DUET Robotics Lab 360: what the lab (schoolui.js) and the teacher's dashboard (teacher.js) both draw: a sheet (modal),
// QR codes (lib/qr: qrcode-generator, MIT), the QR scanner (the browser's BarcodeDetector, else jsQR, Apache-2.0, loaded
// only when needed; a pasted code always works too), and the certificate, drawn on a canvas so it can be saved as a
// picture or printed on any device (the Android app and the headset have no print dialog).
import qrcode from '../lib/qr/qrgen.js';
import { tx } from './i18n.js';

export const t3 = (en, hi, hg) => ({ en, hi, hg });
export const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const KIT = new URL('.', import.meta.url).href;

// ------------------------------------------------------------ styles (the lab's own colours and fonts)
let styled = false;
export function kitStyle() {
  if (styled) return; styled = true; const s = document.createElement('style');
  s.textContent = `
.sk-back{position:fixed;inset:0;z-index:45;background:rgba(5,7,10,.62);display:grid;place-items:center;padding:14px;backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px)}
.sk{position:relative;width:min(640px,100%);max-height:calc(100% - 8px);overflow:auto;background:rgba(16,20,28,.98);border:1px solid rgba(255,255,255,.12);border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,.5);padding:18px 18px 16px;color:#f2ede4;-webkit-user-select:text;user-select:text}
.sk.wide{width:min(980px,100%)}
.sk h2{margin:0 34px 4px 0;font-size:20px;line-height:1.25}.sk h3{margin:16px 0 6px;font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#a39c90}html[lang=hi] .sk h3{letter-spacing:0}
.sk p{margin:0 0 8px;font-size:14px;line-height:1.5;color:#e0dacd}.sk .mute{color:#a39c90;font-size:13px}
.sk .x{position:absolute;top:10px;right:10px;width:34px;height:34px;border-radius:9px;font-size:20px;color:#a39c90;background:none;border:0;cursor:pointer}
.sk .x:hover{background:rgba(255,255,255,.08)}
.sk .row{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:6px 0}
.sk .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:8px}
.sk label.f{display:flex;flex-direction:column;gap:4px;font-size:12.5px;color:#a39c90;font-weight:600}
.sk input,.sk select,.sk textarea{background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);border-radius:9px;padding:9px 10px;font-size:15px;color:#f2ede4;font-family:inherit;min-width:0}
.sk textarea{width:100%;min-height:74px;font-family:"Plex Mono",ui-monospace,monospace;font-size:12.5px}
.sk .btn{padding:9px 14px;border-radius:10px;font-weight:700;font-size:14px;background:rgba(255,255,255,.09);border:0;color:#f2ede4;cursor:pointer;white-space:nowrap}
.sk .btn:hover{background:rgba(255,255,255,.15)}.sk .btn.pri{background:#f0a65a;color:#14100a}.sk .btn.go{background:#3fae5a;color:#06140a}.sk .btn.sm{padding:6px 10px;font-size:12.5px}.sk .btn:disabled{opacity:.45;cursor:default}
.sk .card{background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:10px 12px;margin:6px 0}
.sk .card b{font-size:15px}.sk .stars{color:#ffd76a;letter-spacing:1px;white-space:nowrap}
.sk .tile{background:rgba(255,255,255,.05);border-radius:12px;padding:10px;text-align:center}.sk .tile b{display:block;font-size:22px}.sk .tile span{font-size:12px;color:#a39c90}
.sk .bar{height:8px;border-radius:5px;background:rgba(255,255,255,.1);overflow:hidden}.sk .bar i{display:block;height:100%;background:linear-gradient(90deg,#7fd1ff,#9fd17a)}
.sk .sk-skill{display:grid;grid-template-columns:minmax(120px,1.2fr) 2fr auto;gap:8px;align-items:center;font-size:13px;padding:3px 0}
.sk .lv{font-size:11.5px;font-weight:700;color:#9fd17a;white-space:nowrap}
.sk .qr{background:#fff;border-radius:12px;padding:10px;display:grid;place-items:center;margin:6px auto;max-width:330px}.sk .qr svg{width:100%;height:auto;display:block}
.sk .code{font-family:"Plex Mono",ui-monospace,monospace;font-size:12px;word-break:break-all;background:#06080b;border-radius:9px;padding:8px 10px;color:#9ff0b0}
.sk video{width:100%;max-height:52vh;border-radius:12px;background:#000;object-fit:cover}
.sk table{width:100%;border-collapse:collapse;font-size:13px}.sk th,.sk td{padding:6px 6px;border-top:1px solid rgba(255,255,255,.08);text-align:left;vertical-align:top}.sk th{color:#a39c90;font-weight:700;font-size:12px}
.sk .ok{color:#9fd17a}.sk .bad{color:#ff8a7a}.sk .tag{display:inline-block;font-size:11px;font-weight:700;padding:2px 7px;border-radius:6px;background:rgba(127,209,255,.15);color:#7fd1ff}
.sk canvas.cert{width:100%;height:auto;border-radius:8px;display:block;box-shadow:0 6px 24px rgba(0,0,0,.4)}
@media (max-height:520px){.sk{padding:12px}.sk h2{font-size:17px}.sk .qr{max-width:220px}}
`; document.head.appendChild(s);
}

// ------------------------------------------------------------ the sheet
let cur = null;
if (typeof addEventListener === 'function') addEventListener('keydown', (e) => { if (cur && e.key === 'Escape') { e.stopPropagation(); closeSheet(); } }, true);
export function sheet(html, opt = {}) {
  kitStyle(); closeSheet();
  const back = document.createElement('div'); back.className = 'sk-back'; back.innerHTML = `<div class="sk${opt.wide ? ' wide' : ''}" role="dialog" aria-modal="true"><button class="x" aria-label="Close">×</button>${html}</div>`;
  const box = back.firstChild; box.querySelector('.x').onclick = () => closeSheet();
  back.addEventListener('pointerdown', (e) => { if (e.target === back && !opt.sticky) closeSheet(); });
  for (const k of ['pointerdown', 'pointermove', 'pointerup', 'wheel', 'keydown']) box.addEventListener(k, (e) => e.stopPropagation()); // (the bench below never gets them)
  document.body.appendChild(back); cur = { back, box, onClose: opt.onClose }; return box;
}
export function closeSheet() { if (!cur) return; const c = cur; cur = null; c.back.remove(); if (c.onClose) try { c.onClose(); } catch (e) { /* */ } }
export const sheetOpen = () => !!cur;

// ------------------------------------------------------------ QR codes
export function qrSvg(text) {
  const q = qrcode(0, text.length > 600 ? 'L' : 'M'); q.addData(text, 'Byte'); q.make();
  return q.createSvgTag({ cellSize: 4, margin: 2, scalable: true });
}
const SK = {
  scan: t3('Scan a QR code', 'QR कोड स्कैन कीजिए', 'QR code scan kijiye'),
  scanHow: t3('Hold the QR code in front of the camera.', 'QR कोड को कैमरे के सामने रखिए।', 'QR code ko camera ke saamne rakhiye.'),
  noCam: t3('No camera here (or it was not allowed). Paste the code instead.', 'यहाँ कैमरा नहीं है (या अनुमति नहीं मिली)। इसके बजाय कोड चिपकाइए।', 'Yahan camera nahi hai (ya permission nahi mili). Iski jagah code paste kijiye.'),
  paste: t3('…or paste the code here', '…या कोड यहाँ चिपकाइए', '…ya code yahan paste kijiye'),
  use: t3('Use this code', 'यह कोड लीजिए', 'Ye code lijiye'),
};
// the scanner sheet: the camera (and a paste box); onText(text) returns true when it took the code (the sheet then closes)
export function scanSheet(title, onText, extraHtml = '') {
  const box = sheet(`<h2>📷 ${esc(tx(title || SK.scan))}</h2><p class="mute" id="sk-how">${esc(tx(SK.scanHow))}</p><video id="sk-v" playsinline muted></video>
    <h3>${esc(tx(SK.paste))}</h3><textarea id="sk-t" spellcheck="false"></textarea><div class="row"><button class="btn pri" id="sk-u">${esc(tx(SK.use))}</button></div>${extraHtml}`, { onClose: () => stop() });
  let stream = null, live = true, det = null, raf = 0; const v = box.querySelector('#sk-v');
  const stop = () => { live = false; cancelAnimationFrame(raf); if (stream) stream.getTracks().forEach((k) => k.stop()); };
  const take = (t) => { if (!t) return false; if (onText(t)) { stop(); closeSheet(); return true; } return false; };
  box.querySelector('#sk-u').onclick = () => take(box.querySelector('#sk-t').value.trim());
  (async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw new Error('no camera');
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
      if (!live) { stop(); return; } v.srcObject = stream; await v.play();
      if ('BarcodeDetector' in window) { try { const f = await window.BarcodeDetector.getSupportedFormats(); if (f.includes('qr_code')) det = new window.BarcodeDetector({ formats: ['qr_code'] }); } catch (e) { det = null; } }
      if (!det) await loadJsQR();
      const cv = document.createElement('canvas'); const cx = cv.getContext('2d', { willReadFrequently: true }); let last = 0;
      const tick = async (now) => {
        if (!live) return; raf = requestAnimationFrame(tick); if (now - last < 180 || v.readyState < 2) return; last = now;
        try {
          if (det) { const r = await det.detect(v); if (r && r[0] && take(r[0].rawValue)) return; }
          else if (window.jsQR) { const w = Math.min(960, v.videoWidth), h = Math.round(w * v.videoHeight / v.videoWidth); cv.width = w; cv.height = h; cx.drawImage(v, 0, 0, w, h); const r = window.jsQR(cx.getImageData(0, 0, w, h).data, w, h, { inversionAttempts: 'dontInvert' }); if (r && take(r.data)) return; }
        } catch (e) { /* the next frame */ }
      };
      raf = requestAnimationFrame(tick);
    } catch (e) { v.style.display = 'none'; const h = box.querySelector('#sk-how'); if (h) h.textContent = tx(SK.noCam); }
  })();
  return box;
}
let jsqrP = null;
function loadJsQR() { if (window.jsQR) return Promise.resolve(); if (jsqrP) return jsqrP; jsqrP = new Promise((res) => { const s = document.createElement('script'); s.src = new URL('../lib/qr/jsQR.js', KIT).href; s.onload = () => res(); s.onerror = () => res(); document.head.appendChild(s); }); return jsqrP; }

// ------------------------------------------------------------ share / copy / save
export async function copyText(text) { try { await navigator.clipboard.writeText(text); return true; } catch (e) { const ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select(); let ok = false; try { ok = document.execCommand('copy'); } catch (e2) { ok = false; } ta.remove(); return ok; } }
export async function shareText(text, title) { if (navigator.share) { try { await navigator.share({ title, text }); return true; } catch (e) { return false; } } return copyText(text); }
export function saveBlob(blob, name) { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500); }
export function saveCanvas(cv, name) { cv.toBlob((b) => { if (b) saveBlob(b, name); }, 'image/png'); }
export function printCanvas(cv, title) { // a window with just the picture, printed on A4 landscape (else: the picture is saved)
  const url = cv.toDataURL('image/png'); let w = null; try { w = window.open('', '_blank'); } catch (e) { w = null; }
  if (!w) { saveCanvas(cv, (title || 'certificate') + '.png'); return; }
  w.document.write(`<!doctype html><title>${esc(title || 'Certificate')}</title><style>@page{size:A4 landscape;margin:0}html,body{margin:0;background:#fff}img{width:100vw;height:100vh;object-fit:contain;display:block}</style><img src="${url}" onload="setTimeout(function(){print()},300)">`); w.document.close();
}

// ------------------------------------------------------------ the certificate (A4 landscape, 2000 × 1414 px)
const LOGO = new URL('../brand/duet-stem-logo-light.png', KIT).href;
let logoImg = null;
function logo() { return new Promise((res) => { if (logoImg) return res(logoImg); const i = new Image(); i.onload = () => { logoImg = i; res(i); }; i.onerror = () => res(null); i.src = LOGO; }); }
const CERT = {
  en: { head: 'CERTIFICATE OF ACHIEVEMENT', certify: 'This is to certify that', of: (c, s) => [c && `Class ${c}`, s].filter(Boolean).join(' · '), has: 'has successfully completed', teacher: 'Teacher', principal: 'Principal', check: 'Check code', date: 'Date' },
  hi: { head: 'उपलब्धि प्रमाण-पत्र', certify: 'प्रमाणित किया जाता है कि', of: (c, s) => [c && `कक्षा ${c}`, s].filter(Boolean).join(' · '), has: 'ने सफलतापूर्वक पूरा किया', teacher: 'शिक्षक', principal: 'प्रधानाचार्य', check: 'जाँच कोड', date: 'दिनांक' },
};
const FONT = '"Noto Sans Devanagari",system-ui,sans-serif';
function fit(cx, text, max, size, weight) { let s = size; do { cx.font = `${weight} ${s}px ${FONT}`; s -= 2; } while (cx.measureText(text).width > max && s > 14); return s + 2; }
// d: { lang, name, cls, school, what (the course or project), stats (one line), day (YYYYMMDD), code }
export async function drawCert(cv, d) {
  const W = 2000, H = 1414; cv.width = W; cv.height = H; const cx = cv.getContext('2d'); const C = CERT[d.lang === 'hi' ? 'hi' : 'en'];
  if (document.fonts && document.fonts.load) { try { await Promise.all(['400', '600', '700'].map((w) => document.fonts.load(`${w} 40px "Noto Sans Devanagari"`, 'अA'))); } catch (e) { /* system font */ } }
  // paper, frame and the circuit traces in the corners
  const g = cx.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#fffaf0'); g.addColorStop(1, '#f6efe2'); cx.fillStyle = g; cx.fillRect(0, 0, W, H);
  cx.strokeStyle = '#1b2433'; cx.lineWidth = 10; cx.strokeRect(40, 40, W - 80, H - 80); cx.strokeStyle = '#f0a65a'; cx.lineWidth = 4; cx.strokeRect(62, 62, W - 124, H - 124);
  cx.strokeStyle = 'rgba(27,36,51,.16)'; cx.lineWidth = 5; cx.fillStyle = 'rgba(27,36,51,.18)';
  const trace = (pts) => { cx.beginPath(); cx.moveTo(pts[0][0], pts[0][1]); for (const p of pts.slice(1)) cx.lineTo(p[0], p[1]); cx.stroke(); const e = pts[pts.length - 1]; cx.beginPath(); cx.arc(e[0], e[1], 11, 0, Math.PI * 2); cx.fill(); };
  for (const [sx, sy] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) { // (the bottom ones stay low, under the signatures)
    const ox = sx > 0 ? 62 : W - 62, oy = sy > 0 ? 62 : H - 62, n = sy > 0 ? 4 : 2;
    for (let k = 0; k < n; k++) trace([[ox, oy + sy * (sy > 0 ? 210 + k * 42 : 40 + k * 34)], [ox + sx * (90 + k * 30), oy + sy * (sy > 0 ? 210 + k * 42 : 40 + k * 34)], [ox + sx * (150 + k * 30), oy + sy * (sy > 0 ? 270 + k * 42 : 70 + k * 34)], [ox + sx * (240 + k * 55), oy + sy * (sy > 0 ? 270 + k * 42 : 70 + k * 34)]]);
  }
  // the band with the logo
  cx.fillStyle = '#121a26'; cx.fillRect(62, 62, W - 124, 190); const lg = await logo();
  if (lg) { const lh = 64, lw = lg.width * lh / lg.height; cx.drawImage(lg, (W - lw) / 2, 92, lw, lh); }
  cx.fillStyle = '#f0a65a'; cx.font = `700 34px ${FONT}`; cx.textAlign = 'center'; cx.fillText('ROBOTICS LAB 360', W / 2, 212);
  // the words
  cx.fillStyle = '#1b2433'; cx.font = `700 ${d.lang === 'hi' ? 70 : 64}px ${FONT}`; cx.fillText(C.head, W / 2, 360);
  cx.fillStyle = '#f0a65a'; cx.fillRect(W / 2 - 170, 388, 340, 6);
  cx.fillStyle = '#4d5566'; cx.font = `400 38px ${FONT}`; cx.fillText(C.certify, W / 2, 480);
  const ns = fit(cx, d.name, W - 500, 104, 700); cx.fillStyle = '#121a26'; cx.font = `700 ${ns}px ${FONT}`; cx.fillText(d.name, W / 2, 610);
  cx.strokeStyle = '#c9b48f'; cx.lineWidth = 3; cx.beginPath(); cx.moveTo(W / 2 - 520, 640); cx.lineTo(W / 2 + 520, 640); cx.stroke();
  const of = C.of(d.cls, d.school); if (of) { fit(cx, of, W - 400, 40, 600); cx.fillStyle = '#4d5566'; cx.fillText(of, W / 2, 700); }
  cx.fillStyle = '#4d5566'; cx.font = `400 38px ${FONT}`; cx.fillText(C.has, W / 2, 790);
  const ws = fit(cx, d.what, W - 360, 66, 700); cx.fillStyle = '#b8632a'; cx.font = `700 ${ws}px ${FONT}`; cx.fillText(d.what, W / 2, 880);
  if (d.stats) { fit(cx, d.stats, W - 400, 34, 400); cx.fillStyle = '#4d5566'; cx.fillText(d.stats, W / 2, 950); }
  // the seal
  const sx = W / 2, sy = 1120; cx.fillStyle = '#f0a65a'; cx.beginPath(); for (let k = 0; k < 24; k++) { const a = k / 24 * Math.PI * 2, r = k % 2 ? 92 : 104; cx.lineTo(sx + Math.cos(a) * r, sy + Math.sin(a) * r); } cx.closePath(); cx.fill();
  cx.fillStyle = '#121a26'; cx.beginPath(); cx.arc(sx, sy, 78, 0, Math.PI * 2); cx.fill(); cx.fillStyle = '#ffd76a'; cx.font = `700 44px ${FONT}`; cx.fillText(d.stars ? '★'.repeat(Math.min(3, d.stars)) : '★', sx, sy + 8); cx.font = `700 20px ${FONT}`; cx.fillStyle = '#f2ede4'; cx.fillText('DUET STEM', sx, sy + 42);
  // signatures, date and the check code
  cx.strokeStyle = '#1b2433'; cx.lineWidth = 2; for (const x of [520, W - 520]) { cx.beginPath(); cx.moveTo(x - 200, 1150); cx.lineTo(x + 200, 1150); cx.stroke(); }
  cx.fillStyle = '#4d5566'; cx.font = `600 32px ${FONT}`; cx.fillText(C.teacher, 520, 1196); cx.fillText(C.principal, W - 520, 1196);
  const day = d.day ? `${d.day.slice(6, 8)}-${d.day.slice(4, 6)}-${d.day.slice(0, 4)}` : '';
  cx.font = `400 26px ${FONT}`; cx.fillStyle = '#6b7282'; cx.fillText(`${C.date}: ${day}   ·   ${C.check}: ${d.code || ''}`, W / 2, 1290);
  cx.font = `400 22px ${FONT}`; cx.fillText('DUET STEM · Robotics Lab 360', W / 2, 1326);
  return cv;
}
