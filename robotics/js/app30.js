// DUET Robotics Lab 360, batch 30: the app's side of the load cell and the VL53L0X (parts30.js): their live lines and the
// callouts' controls (the weight on the platform; the card's distance and colour).
import { tx } from './i18n.js';
import { PARTS30, set30 } from './parts30.js';

const t3 = (en, hi, hg) => ({ en, hi, hg });
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const L = { grams: t3('⚖ Weight on the platform (g)', '⚖ प्लेटफ़ॉर्म पर वज़न (g)', '⚖ Platform par wazan (g)'), mm: t3('↔ The card\'s distance (mm)', '↔ कार्ड की दूरी (mm)', '↔ Card ki doori (mm)'),
  white: t3('White card', 'सफ़ेद कार्ड', 'Safed card'), grey: t3('Grey', 'स्लेटी', 'Grey'), black: t3('Black', 'काला', 'Kaala') };
const row = (id, lab, mn, mx, st, v) => `<div class="row"><label>${esc(tx(lab))}</label><input type="range" id="co30-${id}" min="${mn}" max="${mx}" step="${st}" value="${v}"><span id="co30-${id}-v">${v}</span></div>`;
export function install30(app) {
  const W = (name, f) => { const o = app[name].bind(app); app[name] = (...a) => f(o, ...a); };
  W('partLive', (o, p) => o(p) || (PARTS30[p.type] ? PARTS30[p.type].live(p, app.lab) : ''));
  W('controlsFor', (o, p) => {
    const r = o(p); if (r) return r; const s = p.state;
    if (p.type === 'loadcell') return row('grams', L.grams, 0, 5000, 10, Math.round(s.grams || 0));
    if (p.type === 'vl53l0x') return row('mm', L.mm, 20, 2000, 10, Math.round(s.mm || 0)) + `<div class="row">${['white', 'grey', 'black'].map((k) => `<button class="btn${s.surface === k ? ' on' : ''}" data-s30="${k}">${esc(tx(L[k]))}</button>`).join('')}</div>`;
    return r;
  });
  W('bindControls', (o, el) => {
    o(el); const p = app.sel && app.sel.part; if (!p || !PARTS30[p.type]) return; const lab = app.lab; const kick = () => app.stage.kick();
    for (const k of ['grams', 'mm']) { const i = el.querySelector('#co30-' + k); if (i) i.oninput = (e) => { set30(lab, p, k, +e.target.value); const v = el.querySelector('#co30-' + k + '-v'); if (v) v.textContent = e.target.value; kick(); }; }
    for (const b of el.querySelectorAll('[data-s30]')) b.onclick = () => { app.sound.click && app.sound.click(); set30(lab, p, 'surface', b.dataset.s30); for (const q of el.querySelectorAll('[data-s30]')) q.classList.toggle('on', q === b); kick(); };
  });
}
