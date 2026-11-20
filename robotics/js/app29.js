// DUET Robotics Lab 360, batch 29: the app's side of the flex glove and the robot hand (parts29.js): their live lines, and
// the glove's callout: five gestures (open, fist, peace, thumbs up, point) and a bend slider a finger.
import { tx } from './i18n.js';
import { PARTS29, set29 } from './parts29.js';

const t3 = (en, hi, hg) => ({ en, hi, hg });
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const G = [['open', '✋', t3('Open', 'खुला', 'Khula')], ['fist', '✊', t3('Fist', 'मुट्ठी', 'Mutthi')], ['peace', '✌', t3('Peace', 'शांति', 'Peace')], ['thumbsup', '👍', t3('Thumbs up', 'अँगूठा ऊपर', 'Angootha upar')], ['point', '☝', t3('Point', 'इशारा', 'Ishaara')]];
const F = [t3('Thumb', 'अँगूठा', 'Angootha'), t3('Index', 'तर्जनी', 'Tarjani'), t3('Middle', 'मध्यमा', 'Madhyama'), t3('Ring', 'अनामिका', 'Anaamika'), t3('Little', 'छोटी', 'Chhoti')];
export function install29(app) {
  const W = (name, f) => { const o = app[name].bind(app); app[name] = (...a) => f(o, ...a); };
  W('partLive', (o, p) => o(p) || (PARTS29[p.type] ? PARTS29[p.type].live(p, app.lab) : ''));
  W('controlsFor', (o, p) => {
    const r = o(p); if (r) return r; if (p.type !== 'flexglove') return r; const b = p.state.bend || [0, 0, 0, 0, 0];
    return `<div class="row">${G.map(([k, ic, l]) => `<button class="btn" data-g29="${k}" title="${esc(tx(l))}">${ic} ${esc(tx(l))}</button>`).join('')}</div>` +
      F.map((l, i) => `<div class="row"><label>${esc(tx(l))} °</label><input type="range" id="co29-f${i + 1}" min="0" max="90" step="1" value="${Math.round(b[i] || 0)}"><span id="co29-f${i + 1}-v">${Math.round(b[i] || 0)}</span></div>`).join('');
  });
  W('bindControls', (o, el) => {
    o(el); const p = app.sel && app.sel.part; if (!p || p.type !== 'flexglove') return; const lab = app.lab; const kick = () => app.stage.kick();
    const sync = () => { const b = p.state.bend || []; for (let i = 0; i < 5; i++) { const s = el.querySelector('#co29-f' + (i + 1)); if (s) s.value = Math.round(b[i] || 0); const v = el.querySelector('#co29-f' + (i + 1) + '-v'); if (v) v.textContent = Math.round(b[i] || 0); } };
    for (const b of el.querySelectorAll('[data-g29]')) b.onclick = () => { app.sound.click && app.sound.click(); set29(lab, p, 'gesture', b.dataset.g29); sync(); kick(); };
    for (let i = 1; i <= 5; i++) { const s = el.querySelector('#co29-f' + i); if (s) s.oninput = (e) => { set29(lab, p, 'f' + i, +e.target.value); const v = el.querySelector('#co29-f' + i + '-v'); if (v) v.textContent = e.target.value; kick(); }; }
  });
}
