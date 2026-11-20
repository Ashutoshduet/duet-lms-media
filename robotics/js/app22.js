// DUET Robotics Lab 360, batch 22: the app's side of the eight digital sensor modules (parts22.js): their live line and the
// button in their callout that does what the sensor senses (a candle, a clap, a magnet, a tip, a knock, rain, closed eyes).
import { tx } from './i18n.js';
import { PARTS22, KINDS22, sense22, blink22, wind22, ANEMO_MAX, sun22 } from './parts22.js';
import { PARTS24 } from './parts24.js'; // (batch 24: the MCP3008's live line)

const t3 = (en, hi, hg) => ({ en, hi, hg });
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
export const T22 = {
  flame: [t3('🔥 Light a candle near it', '🔥 इसके पास मोमबत्ती जलाइए', '🔥 Iske paas mombatti jalaiye'), t3('💨 Blow the candle out', '💨 मोमबत्ती बुझाइए', '💨 Mombatti bujhaiye')],
  sound: [t3('👏 Clap', '👏 ताली बजाइए', '👏 Taali bajaiye')],
  reed: [t3('🧲 Bring the magnet', '🧲 चुंबक पास लाइए', '🧲 Chumbak paas laiye'), t3('🧲 Take the magnet away', '🧲 चुंबक दूर ले जाइए', '🧲 Chumbak door le jaiye')],
  hall: [t3('🧲 Bring the magnet', '🧲 चुंबक पास लाइए', '🧲 Chumbak paas laiye'), t3('🧲 Take the magnet away', '🧲 चुंबक दूर ले जाइए', '🧲 Chumbak door le jaiye')],
  tilt: [t3('↗ Tip it over', '↗ इसे झुकाइए', '↗ Ise jhukaiye'), t3('↑ Stand it up', '↑ इसे सीधा कीजिए', '↑ Ise seedha kijiye')],
  vibe: [t3('✊ Knock on the table', '✊ मेज़ पर खटखटाइए', '✊ Table par khatkhataiye')],
  rain: [t3('💧 Let it rain on the plate', '💧 प्लेट पर बारिश होने दीजिए', '💧 Plate par baarish hone dijiye'), t3('🧽 Wipe the plate dry', '🧽 प्लेट पोंछकर सुखाइए', '🧽 Plate pochh kar sukhaiye')],
  blink: [t3('😑 Close the eyes', '😑 आँखें बंद कीजिए', '😑 Aankhein band kijiye'), t3('👀 Open the eyes', '👀 आँखें खोलिए', '👀 Aankhein kholiye')],
};
const BLINK = t3('😉 Blink', '😉 पलक झपकाइए', '😉 Palak jhapkaiye');
const WIND = t3('🌬 Wind km/h', '🌬 हवा km/h', '🌬 Hawa km/h');
const SUN = t3('☀ Sunlight %', '☀ धूप %', '☀ Dhoop %'), COVER = [t3('✋ Cover it', '✋ इसे ढकिए', '✋ Ise dhakiye'), t3('☀ Uncover it', '☀ इसे खोलिए', '☀ Ise kholiye')];
export function install22(app) {
  const W = (name, f) => { const o = app[name].bind(app); app[name] = (...a) => f(o, ...a); };
  W('partLive', (o, p) => o(p) || (PARTS22[p.type] ? PARTS22[p.type].live(p) : PARTS24[p.type] ? PARTS24[p.type].live(p) : ''));
  W('controlsFor', (o, p) => {
    const r = o(p); if (r) return r;
    if (p.type === 'solar') { const v = Math.round((p.state.sun ?? 1) * 100); return `<div class="row"><label>${esc(tx(SUN))}</label><input type="range" id="co22-sun" min="0" max="100" step="5" value="${v}"><span id="co22-sun-v">${v}</span></div><div class="row"><button class="btn" id="co22-cover">${esc(tx(COVER[v < 1 ? 1 : 0]))}</button></div>`; }
    if (p.type === 'anemo') return `<div class="row"><label>${esc(tx(WIND))}</label><input type="range" id="co22-wind" min="0" max="${ANEMO_MAX}" step="1" value="${Math.round(p.state.wind || 0)}"><span id="co22-wind-v">${Math.round(p.state.wind || 0)}</span></div>`;
    if (!KINDS22[p.type]) return r;
    const L = T22[p.type]; const lab = L[p.state.trig && L[1] ? 1 : 0];
    const bl = p.type === 'blink' && !p.state.trig ? `<button class="btn" id="co22-blink">${esc(tx(BLINK))}</button>` : '';
    return `<div class="row">${bl}<button class="btn" id="co22-sense">${esc(tx(lab))}</button></div>`;
  });
  W('bindControls', (o, el) => {
    o(el); const p = app.sel && app.sel.part; const wi = el.querySelector('#co22-wind');
    if (p && wi) wi.oninput = (e) => { wind22(app.lab, p, e.target.value); const v = el.querySelector('#co22-wind-v'); if (v) v.textContent = e.target.value; app.stage.kick(); };
    const su = el.querySelector('#co22-sun'); if (p && su) su.oninput = (e) => { sun22(app.lab, p, e.target.value / 100); const v = el.querySelector('#co22-sun-v'); if (v) v.textContent = e.target.value; app.stage.kick(); };
    const cv = el.querySelector('#co22-cover'); if (p && cv) cv.onclick = () => { app.sound.click && app.sound.click(); if ((p.state.sun ?? 1) < 0.005) sun22(app.lab, p, p.state.sunWas || 1); else { p.state.sunWas = p.state.sun ?? 1; sun22(app.lab, p, 0); } app.stage.kick(); app.renderCallout(); };
    const b = el.querySelector('#co22-sense'); if (!p || !b) return;
    const bl = el.querySelector('#co22-blink'); if (bl) bl.onclick = () => { app.sound.click && app.sound.click(); blink22(app.lab, p); app.stage.kick(); };
    b.onclick = () => { app.sound.unlock && app.sound.unlock(); app.sound.click && app.sound.click(); sense22(app.lab, p); app.stage.kick(); if (KINDS22[p.type].hold) app.renderCallout(); };
  });
}
