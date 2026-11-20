// DUET Robotics Lab 360, batch 25: the app's side of the three resistive sensors (parts25.js): their live line and the
// slider in their callout (a press on the FSR, a bend of the flex strip, the room's temperature at the thermistor, the water,
// the UV, the gas), or the radar's button (someone moves in front of it).
import { tx } from './i18n.js';
import { PARTS25, set25 } from './parts25.js';

const t3 = (en, hi, hg) => ({ en, hi, hg });
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const SL = { fsr: [t3('✋ Press (g)', '✋ दबाव (g)', '✋ Dabaav (g)'), 0, 1500, 10, (p) => p.state.grams || 0],
  flex: [t3('↪ Bend (°)', '↪ मोड़ (°)', '↪ Mod (°)'), 0, 120, 1, (p) => p.state.bend || 0],
  ntc: [t3('🌡 Temperature °C', '🌡 तापमान °C', '🌡 Taapmaan °C'), 0, 60, 0.5, (p, lab) => lab.env.temp ?? 25],
  wlevel: [t3('💧 Under water (mm)', '💧 पानी में (mm)', '💧 Paani mein (mm)'), 0, 40, 1, (p) => p.state.depth || 0],
  uvs: [t3('☀ UV index', '☀ यूवी इंडेक्स', '☀ UV index'), 0, 12, 0.5, (p) => p.state.uvi || 0],
  mq135: [t3('💨 CO2 and smoke (ppm)', '💨 CO2 और धुआँ (ppm)', '💨 CO2 aur dhuaan (ppm)'), 300, 3000, 10, (p) => Math.round(p.state.ppm || 400)],
  mq3: [t3('🍺 Alcohol in the breath (ppm)', '🍺 साँस में अल्कोहल (ppm)', '🍺 Saans mein alcohol (ppm)'), 0, 1000, 5, (p) => Math.round(p.state.ppm || 0)] };
const WAVE = t3('✋ Move in front of it', '✋ इसके सामने हिलिए', '✋ Iske saamne hiliye');
export function install25(app) {
  const W = (name, f) => { const o = app[name].bind(app); app[name] = (...a) => f(o, ...a); };
  W('partLive', (o, p) => o(p) || (PARTS25[p.type] ? PARTS25[p.type].live(p, app.lab) : ''));
  W('controlsFor', (o, p) => {
    const r = o(p); if (r) return r; if (p.type === 'rcwl') return `<div class="row"><button class="btn" id="co25-wave">${esc(tx(WAVE))}</button></div>`; if (!SL[p.type]) return r; const [lab, mn, mx, st, val] = SL[p.type]; const v = val(p, app.lab);
    return `<div class="row"><label>${esc(tx(lab))}</label><input type="range" id="co25" min="${mn}" max="${mx}" step="${st}" value="${v}"><span id="co25-v">${v}</span></div>`;
  });
  W('bindControls', (o, el) => {
    o(el); const p = app.sel && app.sel.part; const wv = el.querySelector('#co25-wave'); if (p && wv) wv.onclick = () => { app.sound.click && app.sound.click(); set25(app.lab, p, true); setTimeout(() => { set25(app.lab, p, false); app.stage.kick(); }, 1200); app.stage.kick(); };
    const i = el.querySelector('#co25'); if (!p || !i || !SL[p.type]) return;
    i.oninput = (e) => { set25(app.lab, p, +e.target.value); const s = el.querySelector('#co25-v'); if (s) s.textContent = e.target.value; app.stage.kick(); };
  });
}
