// DUET STEM subscription: the app opens only with a valid code that DUET STEM gives to a school.
// Codes are checked once online against licences.json (it holds only SHA-256 hashes of the codes, the end date, the
// apps a code opens and the school's name encrypted with the code itself), then the app works offline until the end
// date. Whenever it is online it checks again, so a renewed, changed or withdrawn code takes effect.
const KEY = 'duet.lic.v1';
const LIST = new URL('../../licences.json', import.meta.url);
const ALPHA = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'; // Crockford base32: no I, L, O, U
export function normCode(s) {
  let t = String(s || '').toUpperCase().replace(/[^0-9A-Z]/g, '').replace(/O/g, '0').replace(/[IL]/g, '1');
  if (t.startsWith('DUET')) t = t.slice(4);
  return [...t].filter((c) => ALPHA.includes(c)).join('');
}
const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
const sha = async (s) => crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
export const codeHash = async (code) => hex(await sha('duet-lic|' + normCode(code)));
async function openName(code, e) { // the school's name, readable only with the code
  try {
    const raw = Uint8Array.from(atob(e), (c) => c.charCodeAt(0)); const key = await crypto.subtle.importKey('raw', await sha('duet-lic-name|' + normCode(code)), 'AES-GCM', false, ['decrypt']);
    return new TextDecoder().decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: raw.slice(0, 12) }, key, raw.slice(12)));
  } catch (err) { return ''; }
}
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const covers = (a, app) => Array.isArray(a) && (a.includes('*') || a.includes(app));
const load = () => { try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { return null; } };
const save = (v) => { try { if (v) localStorage.setItem(KEY, JSON.stringify(v)); else localStorage.removeItem(KEY); } catch (e) {} };
// never wait more than 10 s for the list: on a slow school network the screen says so instead of hanging
async function fetchList() {
  const ac = typeof AbortController !== 'undefined' ? new AbortController() : null; const tm = ac && setTimeout(() => ac.abort(), 10000);
  try { const r = await fetch(LIST.href + '?t=' + Date.now(), { cache: 'no-store', signal: ac ? ac.signal : undefined }); if (!r.ok) throw new Error('list ' + r.status); return (await r.json()).codes || {}; }
  finally { if (tm) clearTimeout(tm); }
}

const S = {
  title: { en: 'Enter your DUET STEM subscription code', hi: 'अपना DUET STEM सदस्यता कोड डालिए', hg: 'Apna DUET STEM subscription code daaliye' },
  sub: { en: 'Your school receives this code from DUET STEM. You need the internet only once, to activate it.', hi: 'यह कोड आपके विद्यालय को DUET STEM से मिलता है। इसे चालू करने के लिए केवल एक बार इंटरनेट चाहिए।', hg: 'Yeh code aapke school ko DUET STEM se milta hai. Ise chalu karne ke liye sirf ek baar internet chahiye.' },
  btn: { en: 'Activate', hi: 'चालू करें', hg: 'Activate karein' },
  wait: { en: 'Checking the code…', hi: 'कोड जाँचा जा रहा है…', hg: 'Code check ho raha hai…' },
  bad: { en: 'This code is not valid. Please check it and try again.', hi: 'यह कोड मान्य नहीं है। कृपया जाँचकर फिर से डालिए।', hg: 'Yeh code valid nahi hai. Check karke dobara daaliye.' },
  app: { en: 'This code does not include this app.', hi: 'यह कोड इस ऐप के लिए नहीं है।', hg: 'Yeh code is app ke liye nahi hai.' },
  exp: { en: 'This subscription ended on {d}. Please renew it with DUET STEM.', hi: 'यह सदस्यता {d} को समाप्त हो गई। कृपया DUET STEM से इसका नवीनीकरण कराइए।', hg: 'Yeh subscription {d} ko khatam ho gaya. DUET STEM se renew karaiye.' },
  net: { en: 'No internet. Connect to Wi-Fi once to activate the code.', hi: 'इंटरनेट नहीं है। कोड चालू करने के लिए एक बार Wi-Fi से जुड़िए।', hg: 'Internet nahi hai. Code chalu karne ke liye ek baar Wi-Fi se judiye.' },
  gone: { en: 'This code is no longer active. Please contact DUET STEM.', hi: 'यह कोड अब सक्रिय नहीं है। कृपया DUET STEM से संपर्क कीजिए।', hg: 'Yeh code ab active nahi hai. DUET STEM se contact kijiye.' },
  ok: { en: 'Activated{n} · valid until {d}', hi: 'चालू हो गया{n} · {d} तक मान्य', hg: 'Activate ho gaya{n} · {d} tak valid' },
  demo: { en: 'Try the free demo', hi: 'मुफ़्त डेमो आज़माइए', hg: 'Free demo try kijiye' },
  demoSub: { en: 'Free without a code: the Open Labs and the first experiment of every class.', hi: 'बिना कोड के मुफ़्त: खुली प्रयोगशालाएँ और हर कक्षा का पहला प्रयोग।', hg: 'Bina code ke free: Open Labs aur har class ka pehla experiment.' },
  locked: { en: 'This experiment is part of the DUET STEM subscription. Enter your school\'s code to open it.', hi: 'यह प्रयोग DUET STEM सदस्यता का हिस्सा है। इसे खोलने के लिए अपने विद्यालय का कोड डालिए।', hg: 'Yeh experiment DUET STEM subscription ka hissa hai. Ise kholne ke liye apne school ka code daaliye.' },
  back: { en: 'Back', hi: 'वापस', hg: 'Wapas' },
  key: { en: 'Point at the letters to type the code', hi: 'कोड लिखने के लिए अक्षरों पर पॉइंट कीजिए', hg: 'Code likhne ke liye letters par point kijiye' },
  enter: { en: 'Enter your DUET STEM code', hi: 'अपना DUET STEM कोड डालिए', hg: 'Apna DUET STEM code daaliye' },
  soon: { en: 'Your DUET STEM subscription ends on {d}. Please renew it in time.', hi: 'आपकी DUET STEM सदस्यता {d} को समाप्त होगी। कृपया समय पर नवीनीकरण कराइए।', hg: 'Aapka DUET STEM subscription {d} ko khatam hoga. Time par renew karaiye.' },
};
const fmt = (d, L) => { const [y, m, dd] = d.split('-').map(Number); return new Date(y, m - 1, dd).toLocaleDateString(L === 'hi' ? 'hi-IN' : 'en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); };

// the same check without the code screen (the headset draws its own): { ok, info } or { ok: false, key: 'bad' | 'app' | 'exp' | 'net', d }
export async function checkCode(app, code) {
  if (normCode(code).length < 8) return { ok: false, key: 'bad' };
  let list; try { list = await fetchList(); } catch (err) { return { ok: false, key: 'net' }; }
  const h = await codeHash(code); const e = list[h];
  if (!e || e.r) return { ok: false, key: 'bad' };
  if (!covers(e.a, app)) return { ok: false, key: 'app' };
  if (e.u < today()) return { ok: false, key: 'exp', d: e.u };
  const name = e.e ? await openName(code, e.e) : '';
  save({ h, u: e.u, a: e.a, n: name, t: Date.now() }); return { ok: true, info: licenceInfo(app) };
}
// a code-screen text in the chosen language ({d} = a date, {n} = the school's name)
export function licText(key, L, d = {}) { const o = S[key]; if (!o) return ''; return (o[L] || o.en).replace('{d}', d.d ? fmt(d.d, L) : '').replace('{n}', d.n || ''); }
export function licenceExpired(app) { const v = load(); return v && covers(v.a, app) && v.u < today() ? v.u : null; }
// online, a saved licence is looked at again (renewed, changed or withdrawn); offline the app carries on
export function recheckLicence(app) {
  const have = load(); if (!have) return;
  fetchList().then((list) => { const e = list[have.h]; if (!e || e.r) { save(null); location.reload(); return; } if (e.u !== have.u || JSON.stringify(e.a) !== JSON.stringify(have.a)) { save({ ...have, u: e.u, a: e.a, t: Date.now() }); if (e.u < today() || !covers(e.a, app)) location.reload(); } }).catch(() => {});
}

// the licence now: { ok, until, name } or null
export function licenceInfo(app) { const v = load(); return v && covers(v.a, app) && v.u >= today() ? { ok: true, until: v.u, name: v.n || '' } : null; }

// resolves once this device has a valid code for the app; until then a full-screen code screen blocks the app
export function licenceGate(app, getLang, onMsg, opt = {}) { // opt.demo: offer the free demo; opt.locked: opened from a locked experiment (with a Back button)
  const L = () => (getLang && getLang()) || 'en'; const tx = (o, d = {}) => (o[L()] || o.en).replace('{d}', d.d || '').replace('{n}', d.n || '');
  return new Promise((resolve) => {
    const have = load();
    const fresh = have && covers(have.a, app) && have.u >= today();
    if (fresh) {
      resolve(licenceInfo(app));
      const days = (new Date(have.u) - new Date(today())) / 864e5; if (days <= 15 && onMsg) setTimeout(() => onMsg(tx(S.soon, { d: fmt(have.u, L()) })), 4000);
      // online: look again (renewed, changed or withdrawn); offline: carry on
      recheckLicence(app);
      return;
    }
    // the code screen
    const el = document.createElement('div'); el.id = 'lic';
    el.innerHTML = `<style>
#lic{position:fixed;inset:0;z-index:99999;background:radial-gradient(ellipse at 50% 20%,#1b2436,#0c111b 70%);display:flex;align-items:center;justify-content:center;font-family:inherit;color:#f3eee6;padding:16px}
#lic .bx{width:min(560px,100%);background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:22px;padding:30px 28px;text-align:center;box-shadow:0 30px 80px rgba(0,0,0,.5)}
#lic img{height:44px;margin-bottom:10px}#lic h1{font-size:23px;margin:8px 0 6px;font-weight:800}#lic p{color:#b9c1cf;font-size:14.5px;line-height:1.5;margin:0 0 18px}
#lic input{width:100%;box-sizing:border-box;font-size:24px;letter-spacing:.08em;text-align:center;padding:14px 12px;border-radius:14px;border:2px solid rgba(255,255,255,.18);background:#0b0f17;color:#fff;text-transform:uppercase;outline:none}
#lic input:focus{border-color:#f0a65a}#lic .go{margin-top:14px;width:100%;padding:14px;border-radius:14px;border:0;background:#f0a65a;color:#14100a;font-size:18px;font-weight:800;cursor:pointer}
#lic .go:disabled{opacity:.6}#lic .m{min-height:22px;margin-top:14px;font-size:14.5px;font-weight:600}#lic .m.e{color:#ff9b8a}#lic .m.k{color:#9fd17a}
#lic .alt{margin-top:10px;width:100%;padding:12px;border-radius:14px;border:1px solid rgba(255,255,255,.18);background:transparent;color:#e6ecf5;font-size:15.5px;font-weight:700;cursor:pointer}#lic .alt small{display:block;font-weight:500;color:#9aa6b8;font-size:12.5px;margin-top:3px}
#lic .lg{margin-top:16px;display:flex;gap:6px;justify-content:center}#lic .lg button{background:rgba(255,255,255,.07);border:0;color:#cfd7e4;padding:6px 12px;border-radius:9px;cursor:pointer;font-size:13px}
</style><div class="bx"><img src="brand/duet-stem-logo-light.png" alt="DUET STEM"><h1></h1><p></p>
<input id="lic-in" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="DUET-XXXX-XXXX-XXXX" maxlength="24"><button class="go"></button><div class="m"></div>${opt.demo || opt.locked ? '<button class="alt"></button>' : ''}
<div class="lg"><button data-l="en">English</button><button data-l="hi">हिंदी</button><button data-l="hg">Hinglish</button></div></div>`;
    document.body.appendChild(el);
    const $ = (s) => el.querySelector(s); const msg = (t, c) => { $('.m').textContent = t; $('.m').className = 'm ' + (c || ''); };
    let lang = L(); const paint = () => { const o = (x) => x[lang] || x.en; $('h1').textContent = o(S.title); $('p').textContent = opt.locked ? o(S.locked) : o(S.sub); $('.go').textContent = o(S.btn);
      const alt = $('.alt'); if (alt) alt.innerHTML = opt.locked ? '‹ ' + o(S.back) : `${o(S.demo)}<small>${o(S.demoSub)}</small>`; };
    const tl = (o, d = {}) => (o[lang] || o.en).replace('{d}', d.d || '').replace('{n}', d.n || '');
    paint(); $('.lg').onclick = (e) => { const b = e.target.closest('button'); if (b) { lang = b.dataset.l; paint(); } };
    if (have && have.u < today()) msg(tl(S.exp, { d: fmt(have.u, lang) }), 'e');
    const go = async () => {
      const code = $('#lic-in').value; if (normCode(code).length < 8) { msg(tl(S.bad), 'e'); return; }
      $('.go').disabled = true; msg(tl(S.wait));
      let list; try { list = await fetchList(); } catch (err) { $('.go').disabled = false; msg(tl(S.net), 'e'); return; }
      const h = await codeHash(code); const e = list[h]; $('.go').disabled = false;
      if (!e || e.r) { msg(tl(S.bad), 'e'); return; }
      if (!covers(e.a, app)) { msg(tl(S.app), 'e'); return; }
      if (e.u < today()) { msg(tl(S.exp, { d: fmt(e.u, lang) }), 'e'); return; }
      const name = e.e ? await openName(code, e.e) : '';
      save({ h, u: e.u, a: e.a, n: name, t: Date.now() }); msg(tl(S.ok, { n: name ? ' · ' + name : '', d: fmt(e.u, lang) }), 'k');
      setTimeout(() => { el.remove(); resolve(licenceInfo(app)); }, 1400);
    };
    const alt = $('.alt'); if (alt) alt.onclick = () => { el.remove(); resolve(opt.locked ? null : { ok: false, demo: true }); };
    $('.go').onclick = go; $('#lic-in').addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); });
    setTimeout(() => $('#lic-in').focus(), 300);
  });
}
