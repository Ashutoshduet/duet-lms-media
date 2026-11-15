// Eight more Indian languages for the DUET apps: Bengali, Marathi, Tamil, Telugu, Gujarati, Kannada, Malayalam, Odia.
// (science/js/xlang.js is the master copy; body/js/xlang.js is a copy kept in step by the pre-commit hook.)
// Their texts are in i18n/<code>.json next to js/ (English text → translation; machine translated with IndicTrans2 by
// devtools/i18n/indic/translate.py), loaded only when the language is chosen. Every text object of the apps has the
// shape { en, hi, hg }; a getter on Object.prototype answers o.bn, o.ta … from the loaded file (the English text when a
// text has no translation, or before the file has loaded), and a setter makes a normal property if code ever assigns
// one. So none of the code that shows text has to change.
export const XLANGS = ['bn', 'mr', 'ta', 'te', 'gu', 'kn', 'ml', 'or'];
export const XLABEL = { bn: 'বাংলা', mr: 'मराठी', ta: 'தமிழ்', te: 'తెలుగు', gu: 'ગુજરાતી', kn: 'ಕನ್ನಡ', ml: 'മലയാളം', or: 'ଓଡ଼ିଆ' };
export const XNAME = { bn: 'Bengali', mr: 'Marathi', ta: 'Tamil', te: 'Telugu', gu: 'Gujarati', kn: 'Kannada', ml: 'Malayalam', or: 'Odia' };
export const BCP = { en: 'en-IN', hi: 'hi-IN', hg: 'hi-IN', bn: 'bn-IN', mr: 'mr-IN', ta: 'ta-IN', te: 'te-IN', gu: 'gu-IN', kn: 'kn-IN', ml: 'ml-IN', or: 'or-IN' };
const SAMPLE = { bn: 'বাংলা', mr: 'मराठी', ta: 'தமிழ்', te: 'తెలుగు', gu: 'ગુજરાતી', kn: 'ಕನ್ನಡ', ml: 'മലയാളം', or: 'ଓଡ଼ିଆ' };
export const XDICT = Object.create(null); // no prototype: looking a language up here must not reach the getters below
if (typeof globalThis !== 'undefined' && !globalThis.__duetXlang) {
  globalThis.__duetXlang = XDICT;
  for (const L of XLANGS) {
    if (Object.getOwnPropertyDescriptor(Object.prototype, L)) continue;
    Object.defineProperty(Object.prototype, L, {
      configurable: true, enumerable: false,
      get() { const e = this == null ? null : this.en; if (typeof e !== 'string') return undefined; const d = globalThis.__duetXlang[L]; return (d && d[e]) || e; }, // not translated yet: the English
      set(v) { Object.defineProperty(this, L, { value: v, writable: true, enumerable: true, configurable: true }); },
    });
  }
}
const DICTS = (typeof globalThis !== 'undefined' && globalThis.__duetXlang) || XDICT;
const pending = Object.create(null);
export const isX = (L) => XLANGS.includes(L);
export const ready = (L) => !isX(L) || !!DICTS[L];
// load a language's texts (and the letters of its script, for the headset panels drawn on a canvas)
export function loadLang(L) {
  if (!isX(L)) return Promise.resolve(true);
  if (DICTS[L]) return Promise.resolve(true);
  return (pending[L] ||= fetch(new URL(`../i18n/${L}.json`, import.meta.url)).then((r) => (r.ok ? r.json() : null)).then(async (d) => {
    if (!d) { delete pending[L]; return false; }
    DICTS[L] = d;
    try { if (document.fonts) await Promise.all([400, 600, 700].map((w) => document.fonts.load(`${w} 24px "Noto Sans Devanagari"`, SAMPLE[L]))); } catch (e) {}
    return true;
  }).catch(() => { delete pending[L]; return false; }));
}
// a spoken voice of the device for a language, if it has one (most phones do for Indian languages; headsets often not)
export function deviceVoice(L) { try { const b = BCP[L] || 'en-IN'; return speechSynthesis.getVoices().find((v) => v.lang && v.lang.replace('_', '-').toLowerCase().startsWith(b.slice(0, 2).toLowerCase())) || null; } catch (e) { return null; } }

// ---------------------------------------------------------------- the language menu on a screen (all languages)
export const NAME_EN = { en: 'English', hi: 'Hindi', hg: 'Hindi in English letters', ...XNAME };
const MENU_CSS = `.dl-menu{position:fixed;z-index:9600;background:#141922;border:1px solid rgba(255,255,255,.16);border-radius:14px;padding:8px;display:grid;grid-template-columns:1fr 1fr;gap:6px;box-shadow:0 18px 50px rgba(0,0,0,.5);width:min(340px,calc(100vw - 16px))}
.dl-menu button{border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.05);color:#f3eee6;border-radius:10px;padding:8px 10px;font:600 15px/1.25 "Noto Sans Devanagari",system-ui,sans-serif;text-align:left;cursor:pointer}
.dl-menu button:hover{border-color:#7fd1ff}.dl-menu button small{display:block;color:#8f97a5;font-weight:500;font-size:11.5px}.dl-menu button.on{background:#f3eee6;color:#12100c}.dl-menu button.on small{color:#4a4a4a}
.dl-menu p{grid-column:1/-1;margin:2px 4px 4px;color:#8f97a5;font:500 12px/1.4 system-ui,sans-serif}`;
export function langMenu(anchor, cur, labels, onPick, note) {
  const old = document.querySelector('.dl-menu'); if (old) { old.remove(); if (old._anchor === anchor) return; }
  if (!document.getElementById('dl-css')) { const st = document.createElement('style'); st.id = 'dl-css'; st.textContent = MENU_CSS; document.head.appendChild(st); }
  const m = document.createElement('div'); m.className = 'dl-menu'; m._anchor = anchor; m.setAttribute('role', 'menu');
  m.innerHTML = Object.keys(labels).map((l) => `<button data-l="${l}" class="${l === cur ? 'on' : ''}" role="menuitemradio" aria-checked="${l === cur}">${labels[l]}<small>${NAME_EN[l] || ''}</small></button>`).join('') + (note ? `<p>${note}</p>` : '');
  document.body.appendChild(m);
  const r = anchor.getBoundingClientRect(); const w = m.offsetWidth; m.style.left = Math.max(8, Math.min(innerWidth - w - 8, r.right - w)) + 'px'; m.style.top = Math.min(innerHeight - m.offsetHeight - 8, r.bottom + 6) + 'px';
  m.onclick = (e) => { const b = e.target.closest('button'); if (!b) return; m.remove(); onPick(b.dataset.l); };
  setTimeout(() => { const off = (e) => { if (!m.contains(e.target) && e.target !== anchor && !anchor.contains(e.target)) { m.remove(); document.removeEventListener('pointerdown', off, true); } }; document.addEventListener('pointerdown', off, true); }, 0);
}

// a text made of other texts (each { en, hi, … }): English, Hindi and Hinglish now, the other languages when read
export function joinT(parts, sep = ' ') {
  const P = (p, l) => (typeof p === 'string' ? p : p ? p[l] || p.en || '' : '');
  const o = {}; for (const l of ['en', 'hi', 'hg']) o[l] = parts.map((p) => P(p, l)).filter(Boolean).join(sep);
  for (const l of XLANGS) Object.defineProperty(o, l, { enumerable: false, configurable: true, get: () => (DICTS[l] ? parts.map((p) => P(p, l)).filter(Boolean).join(sep) : undefined) });
  return o;
}
// a pattern with {x} in it, filled with a text, in every language
export function fillT(tpl, vars) {
  const f = (l) => { let s = tpl[l] || tpl.en || ''; for (const [k, v] of Object.entries(vars)) s = s.split('{' + k + '}').join(typeof v === 'string' ? v : v ? v[l] || v.en || '' : ''); return s; };
  const o = { en: f('en'), hi: f('hi'), hg: f('hg') };
  for (const l of XLANGS) Object.defineProperty(o, l, { enumerable: false, configurable: true, get: () => (DICTS[l] ? f(l) : undefined) });
  return o;
}
