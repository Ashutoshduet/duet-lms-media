// DUET Robotics Lab 360, batch 28: the app's side of the DS18B20 probe and the WS2812 stick (parts28.js): their live line
// and, for the probe, the water it stands in (its callout's slider).
import { tx } from './i18n.js';
import { PARTS28, set28 } from './parts28.js';

const t3 = (en, hi, hg) => ({ en, hi, hg });
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const WATER = t3('🌡 The water in the beaker (°C)', '🌡 बीकर का पानी (°C)', '🌡 Beaker ka paani (°C)');
export function install28(app) {
  const W = (name, f) => { const o = app[name].bind(app); app[name] = (...a) => f(o, ...a); };
  W('partLive', (o, p) => o(p) || (PARTS28[p.type] ? PARTS28[p.type].live(p, app.lab) : ''));
  W('controlsFor', (o, p) => {
    const r = o(p); if (r) return r;
    if (p.type === 'ds18b20') { const v = Math.round(p.state.water ?? 26); return `<div class="row"><label>${esc(tx(WATER))}</label><input type="range" id="co28-water" min="-10" max="95" step="1" value="${v}"><span id="co28-water-v">${v}</span></div>`; }
    return r;
  });
  W('bindControls', (o, el) => {
    o(el); const p = app.sel && app.sel.part; if (!p || p.type !== 'ds18b20') return;
    const i = el.querySelector('#co28-water'); if (i) i.oninput = (e) => { set28(app.lab, p, 'water', +e.target.value); const v = el.querySelector('#co28-water-v'); if (v) v.textContent = e.target.value; app.stage.kick(); };
  });
}
