// DUET Robotics Lab 360, batch 26: the app's side of the four I2C modules (parts26.js): their live line and the controls
// in their callout (tilt, turn and shake the MPU-6050; move the clock on; the light; the altitude and the weather).
import { tx } from './i18n.js';
import { PARTS26, set26 } from './parts26.js';

const t3 = (en, hi, hg) => ({ en, hi, hg });
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const L = { x: t3('↻ Tilt X (roll) °', '↻ झुकाव X (रोल) °', '↻ Jhukaav X (roll) °'), y: t3('↻ Tilt Y (pitch) °', '↻ झुकाव Y (पिच) °', '↻ Jhukaav Y (pitch) °'), z: t3('⟳ Turn Z (yaw) °', '⟳ घुमाव Z (यॉ) °', '⟳ Ghumaav Z (yaw) °'),
  shake: t3('👋 Shake it', '👋 इसे हिलाइए', '👋 Ise hilaiye'), hour: t3('⏩ +1 hour', '⏩ +1 घंटा', '⏩ +1 ghanta'), min: t3('⏩ +10 minutes', '⏩ +10 मिनट', '⏩ +10 minute'),
  lux: t3('💡 Light (lux)', '💡 रोशनी (लक्स)', '💡 Roshni (lux)'), alt: t3('⛰ Altitude (m)', '⛰ ऊँचाई (m)', '⛰ Oonchaai (m)'), wx: t3('🌧 Weather (hPa from normal)', '🌧 मौसम (सामान्य से hPa)', '🌧 Mausam (saamaanya se hPa)') };
const row = (id, lab, mn, mx, st, v) => `<div class="row"><label>${esc(tx(lab))}</label><input type="range" id="co26-${id}" min="${mn}" max="${mx}" step="${st}" value="${v}"><span id="co26-${id}-v">${v}</span></div>`;
export function install26(app) {
  const W = (name, f) => { const o = app[name].bind(app); app[name] = (...a) => f(o, ...a); };
  W('partLive', (o, p) => o(p) || (PARTS26[p.type] ? PARTS26[p.type].live(p, app.lab) : ''));
  W('controlsFor', (o, p) => {
    const r = o(p); if (r) return r; const s = p.state; const to = s.to || [0, 0, 0];
    if (p.type === 'mpu6050') return row('x', L.x, -90, 90, 1, Math.round(to[0])) + row('y', L.y, -90, 90, 1, Math.round(to[1])) + row('z', L.z, -180, 180, 5, Math.round(to[2])) + `<div class="row"><button class="btn" id="co26-shake">${esc(tx(L.shake))}</button></div>`;
    if (p.type === 'rtc3231') return row('hour', t3('🕑 Set the hour', '🕑 घंटा सेट कीजिए', '🕑 Ghanta set kijiye'), 0, 23, 1, 12) + `<div class="row"><button class="btn" id="co26-plus" data-s="3600">${esc(tx(L.hour))}</button><button class="btn" id="co26-plus2" data-s="600">${esc(tx(L.min))}</button></div>`;
    if (p.type === 'bh1750') return row('lux', L.lux, 0, 2000, 10, Math.round(s.lux || 0));
    if (p.type === 'bmp180') return row('alt', L.alt, 0, 3000, 10, Math.round(s.alt || 0)) + row('wx', L.wx, -40, 20, 1, Math.round(s.wx || 0));
    return r;
  });
  W('bindControls', (o, el) => {
    o(el); const p = app.sel && app.sel.part; if (!p || !PARTS26[p.type]) return; const lab = app.lab; const kick = () => app.stage.kick();
    for (const k of ['x', 'y', 'z', 'lux', 'alt', 'wx', 'hour']) { const i = el.querySelector('#co26-' + k); if (!i) continue; i.oninput = (e) => { set26(lab, p, k, +e.target.value); const v = el.querySelector('#co26-' + k + '-v'); if (v) v.textContent = e.target.value; kick(); }; }
    const sh = el.querySelector('#co26-shake'); if (sh) sh.onclick = () => { app.sound.click && app.sound.click(); set26(lab, p, 'shake'); kick(); };
    for (const id of ['#co26-plus', '#co26-plus2']) { const b = el.querySelector(id); if (b) b.onclick = () => { app.sound.click && app.sound.click(); set26(lab, p, 'plus', +b.dataset.s); kick(); }; }
  });
}
