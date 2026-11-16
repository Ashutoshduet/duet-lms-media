// DUET STEM subscription: the app opens only with a valid code that DUET STEM gives to a school.
// Codes are checked once online against licences.json (it holds only SHA-256 hashes of the codes, the end date, the
// apps a code opens and the school's name encrypted with the code itself), then the app works offline until the end
// date. Whenever it is online it checks again, so a renewed, changed or withdrawn code takes effect.
// A pen-drive code (o: 1 in the list) also activates without the internet: the first device it is used on keeps it,
// and that device takes the code's place in the DUET STEM register the first time it is online (another device that
// already holds the place makes the code stop here). On a DUET STEM pen drive the drive's launcher hands the code to
// the apps (school.json, only on the computer the drive belongs to), so the teacher never types it.
const KEY = 'duet.lic.v1';
const LIST = new URL('../../licences.json', import.meta.url);
const SCHOOL = new URL('../../school.json', import.meta.url); // served by a DUET STEM pen drive's launcher
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
let CLAIM = ''; // the DUET STEM register's address, from the list
async function fetchList(live) { // live: a code being typed in now needs the newest list (the Android app otherwise answers at once from its saved copy)
  const ac = typeof AbortController !== 'undefined' ? new AbortController() : null; const tm = ac && setTimeout(() => ac.abort(), 10000);
  try { const r = await fetch(LIST.href + '?t=' + Date.now() + (live ? '&live=1' : ''), { cache: 'no-store', signal: ac ? ac.signal : undefined }); if (!r.ok) throw new Error('list ' + r.status); const j = await r.json(); CLAIM = j.claim || ''; return j.codes || {}; }
  finally { if (tm) clearTimeout(tm); }
}
// this device, the same every time inside this app (Android: from the system, so a reinstall keeps it)
function deviceId() {
  try { if (window.DuetNative && DuetNative.deviceId) { const v = String(DuetNative.deviceId() || '').toLowerCase().replace(/[^0-9a-z]/g, ''); if (v.length >= 8) return 'a' + v.slice(0, 40); } } catch (e) {}
  let v = null; try { v = localStorage.getItem('duet.dev.v1'); } catch (e) {}
  if (!v) { v = hex(crypto.getRandomValues(new Uint8Array(12))); try { localStorage.setItem('duet.dev.v1', v); } catch (e) {} }
  return 'w' + v;
}
const model = () => { try { if (window.DuetNative && DuetNative.deviceName) return String(DuetNative.deviceName()); } catch (e) {} const u = navigator.userAgent || ''; if (/OculusBrowser|Quest/i.test(u)) return 'Meta Quest'; const m = u.match(/Android[^;)]*;\s*([^;)]+)/); return m ? m[1].trim() : /iPhone|iPad/.test(u) ? 'iPhone/iPad' : 'Computer'; };
// a code sold for a number of devices: ask the register for a place for this device ({ ok } or { ok: false, err: 'used', max })
async function claim(h, app, k, name, dev) { // dev: the pen drive's computer (from its launcher), else this browser or app
  const q = new URLSearchParams({ h, a: app, d: dev || deviceId(), m: model().slice(0, 60), k: k || '', s: (name || '').slice(0, 80) });
  const ac = typeof AbortController !== 'undefined' ? new AbortController() : null; const tm = ac && setTimeout(() => ac.abort(), 20000);
  try { const r = await fetch(CLAIM + '?' + q, { cache: 'no-store', signal: ac ? ac.signal : undefined }); if (!r.ok) throw new Error('claim ' + r.status); return await r.json(); }
  finally { if (tm) clearTimeout(tm); }
}
// a valid code from the list: take a place for this device when the code is for a number of devices
// (null: the device may use it; { pending: true }: a pen-drive code offline, the place is taken when online)
async function takePlace(app, code, h, e, name, dev) {
  if (!(+e.n > 0 && CLAIM)) return null;
  // a pen-drive code never waits for the register: it works at once and takes its place in the background
  // (unless this device was already told that another device holds it)
  if (e.o) return usedHere().includes(h) ? { ok: false, key: 'used', m: e.n } : { pending: true };
  let c; try { c = await claim(h, app, normCode(code).slice(-4), name, dev); } catch (err) { return e.o ? { pending: true } : { ok: false, key: 'net' }; }
  if (!c || !c.ok) return c && c.err === 'used' ? { ok: false, key: 'used', m: c.max || e.n } : { ok: false, key: c && c.err === 'app' ? 'app' : 'bad' };
  return null;
}
// pen-drive codes this device was told are in use on another device (so typing one again is refused at once)
const USED = 'duet.lic.used';
function usedHere() { try { return JSON.parse(localStorage.getItem(USED) || '[]'); } catch (e) { return []; } }
function markUsed(h) { try { const l = usedHere(); if (!l.includes(h)) l.push(h); localStorage.setItem(USED, JSON.stringify(l.slice(-20))); } catch (e) { /* no storage */ } }
// a DUET STEM pen drive: its own code from the drive's launcher (a computer's own address only; elsewhere there is none)
async function schoolCode() { // (no time limit: the drive's own server answers at once, but a panel can be busy for seconds while the 3D starts)
  if (!/^(127\.0\.0\.1|localhost|\[::1\])$/.test(location.hostname)) return null;
  try { const r = await fetch(SCHOOL.href + '?t=' + Date.now(), { cache: 'no-store' }); if (!r.ok) return null; const j = await r.json(); return j && j.code ? j : null; } catch (err) { return null; }
}
const devOf = (s) => { const d = String((s && s.dev) || '').toLowerCase().replace(/[^0-9a-z]/g, ''); return d.length >= 8 ? 'p' + d.slice(0, 40) : ''; };

const S = {
  title: { en: 'Enter your DUET STEM subscription code', hi: 'अपना DUET STEM सब्सक्रिप्शन कोड डालिए', hg: 'Apna DUET STEM subscription code daaliye' },
  sub: { en: 'Your school receives this code from DUET STEM. You need the internet only once, to activate it.', hi: 'यह कोड आपके स्कूल को DUET STEM से मिलता है। इसे चालू करने के लिए सिर्फ़ एक बार इंटरनेट चाहिए।', hg: 'Yeh code aapke school ko DUET STEM se milta hai. Ise chalu karne ke liye sirf ek baar internet chahiye.' },
  btn: { en: 'Activate', hi: 'चालू कीजिए', hg: 'Activate kijiye' },
  wait: { en: 'Checking the code…', hi: 'कोड चेक हो रहा है…', hg: 'Code check ho raha hai…' },
  bad: { en: 'This code is not valid. Please check it and try again.', hi: 'यह कोड सही नहीं है। कृपया देखकर दोबारा डालिए।', hg: 'Yeh code sahi nahi hai. Check karke dobara daaliye.' },
  app: { en: 'This code does not include this app.', hi: 'यह कोड इस ऐप के लिए नहीं है।', hg: 'Yeh code is app ke liye nahi hai.' },
  exp: { en: 'This subscription ended on {d}. Please renew it with DUET STEM.', hi: 'यह सब्सक्रिप्शन {d} को ख़त्म हो गया। कृपया DUET STEM से इसे रिन्यू करवाइए।', hg: 'Yeh subscription {d} ko khatam ho gaya. DUET STEM se renew karwaiye.' },
  used: { en: 'This code is already in use on another device. Each code works on {m} device(s) only. For this device, ask DUET STEM for its own code: info@duetpower.in', hi: 'यह कोड पहले से किसी दूसरे डिवाइस पर चल रहा है। हर कोड सिर्फ़ {m} डिवाइस पर चलता है। इस डिवाइस के लिए DUET STEM से अलग कोड लीजिए: info@duetpower.in', hg: 'Yeh code pehle se kisi doosre device par chal raha hai. Har code sirf {m} device par chalta hai. Is device ke liye DUET STEM se alag code lijiye: info@duetpower.in' },
  net: { en: 'No internet. Connect to Wi-Fi once to activate the code.', hi: 'इंटरनेट नहीं है। कोड चालू करने के लिए एक बार वाई-फ़ाई से जुड़िए।', hg: 'Internet nahi hai. Code chalu karne ke liye ek baar Wi-Fi se judiye.' },
  gone: { en: 'This code is no longer active. Please contact DUET STEM.', hi: 'यह कोड अब चालू नहीं है। कृपया DUET STEM से संपर्क कीजिए।', hg: 'Yeh code ab active nahi hai. DUET STEM se contact kijiye.' },
  ok: { en: 'Activated{n} · valid until {d}', hi: 'चालू हो गया{n} · {d} तक चलेगा', hg: 'Activate ho gaya{n} · {d} tak valid' },
  demo: { en: 'Try the free demo', hi: 'मुफ़्त डेमो चलाकर देखिए', hg: 'Free demo try kijiye' },
  demoSub: { en: 'Free without a code: the Open Labs and the first experiment of every class.', hi: 'बिना कोड के मुफ़्त: ओपन लैब और हर कक्षा का पहला प्रयोग।', hg: 'Bina code ke free: Open Labs aur har class ka pehla experiment.' },
  locked: { en: 'This experiment is part of the DUET STEM subscription. Enter your school\'s code to open it.', hi: 'यह प्रयोग DUET STEM सब्सक्रिप्शन का हिस्सा है। इसे खोलने के लिए अपने स्कूल का कोड डालिए।', hg: 'Yeh experiment DUET STEM subscription ka hissa hai. Ise kholne ke liye apne school ka code daaliye.' },
  back: { en: 'Back', hi: 'वापस', hg: 'Wapas' },
  key: { en: 'Point at the letters to type the code', hi: 'कोड लिखने के लिए अक्षरों पर पॉइंट कीजिए', hg: 'Code likhne ke liye letters par point kijiye' },
  enter: { en: 'Enter your DUET STEM code', hi: 'अपना DUET STEM कोड डालिए', hg: 'Apna DUET STEM code daaliye' },
  soon: { en: 'Your DUET STEM subscription ends on {d}. Please renew it in time.', hi: 'आपका DUET STEM सब्सक्रिप्शन {d} को ख़त्म होगा। कृपया समय पर रिन्यू करवा लीजिए।', hg: 'Aapka DUET STEM subscription {d} ko khatam hoga. Time par renew karwa lijiye.' },
};
const fmt = (d, L) => { const [y, m, dd] = d.split('-').map(Number); return new Date(y, m - 1, dd).toLocaleDateString(L === 'hi' ? 'hi-IN' : 'en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); };

// the same check without the code screen (the headset draws its own): { ok, info } or { ok: false, key: 'bad' | 'app' | 'exp' | 'net', d }
export async function checkCode(app, code, dev) { // dev: the pen drive's computer, when the code comes from its launcher
  if (normCode(code).length < 8) return { ok: false, key: 'bad' };
  let list; try { list = await fetchList(true); } catch (err) { return { ok: false, key: 'net' }; }
  const h = await codeHash(code); const e = list[h];
  if (!e || e.r) return { ok: false, key: 'bad' };
  if (!covers(e.a, app)) return { ok: false, key: 'app' };
  if (e.u < today()) return { ok: false, key: 'exp', d: e.u };
  const name = e.e ? await openName(code, e.e) : '';
  const no = await takePlace(app, code, h, e, name, dev); if (no && !no.pending) return no;
  save({ h, u: e.u, a: e.a, n: name, k: normCode(code).slice(-4), t: Date.now(), ...(dev ? { d: dev } : {}), ...(no ? { p: 1 } : {}) }); if (no) setTimeout(() => recheckLicence(app), 1500); return { ok: true, info: licenceInfo(app) };
}
// a code-screen text in the chosen language ({d} = a date, {n} = the school's name)
export function licText(key, L, d = {}) { const o = S[key]; if (!o) return ''; return (o[L] || o.en).replace('{d}', d.d ? fmt(d.d, L) : '').replace('{n}', d.n || '').replace('{m}', d.m ?? ''); }
export function licenceExpired(app) { const v = load(); return v && covers(v.a, app) && v.u < today() ? v.u : null; }
// online, a saved licence is looked at again (renewed, changed or withdrawn); offline the app carries on
export function recheckLicence(app) {
  const have = load(); if (!have) return;
  fetchList().then(async (list) => {
    const e = list[have.h]; if (!e || e.r) { save(null); location.reload(); return; }
    if (e.u !== have.u || JSON.stringify(e.a) !== JSON.stringify(have.a)) { save({ ...have, u: e.u, a: e.a, t: Date.now() }); if (e.u < today() || !covers(e.a, app)) { location.reload(); return; } }
    // a code for a number of devices: this device must still hold one of its places (a code passed on stops here;
    // a pen-drive code activated offline takes its place now)
    if (+e.n > 0 && CLAIM) { const c = await claim(have.h, app, have.k, have.n, have.d).catch(() => null); if (c && c.ok === false && (c.err === 'used' || c.err === 'bad')) { if (c.err === 'used' && e.o) markUsed(have.h); save(null); location.reload(); return; } if (c && c.ok && have.p) { const v = load(); if (v && v.h === have.h) { delete v.p; save(v); } } }
  }).catch(() => {});
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
    // a DUET STEM pen drive gives its own code: no code screen
    schoolCode().then(async (s) => { if (s) { const r = await checkCode(app, s.code, devOf(s)).catch(() => null); if (r && r.ok) { resolve(r.info); return; } } screen(); });
    function screen() {
    const el = document.createElement('div'); el.id = 'lic';
    el.innerHTML = `<style>
#lic{position:fixed;inset:0;z-index:99999;background:radial-gradient(ellipse at 50% 20%,#1b2436,#0c111b 70%);display:flex;align-items:flex-start;justify-content:center;overflow-y:auto;-webkit-overflow-scrolling:touch;font-family:inherit;color:#f3eee6;padding:16px;box-sizing:border-box}
#lic .bx{margin:auto 0;width:min(560px,100%);background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:22px;padding:30px 28px;text-align:center;box-shadow:0 30px 80px rgba(0,0,0,.5)}
#lic img{height:44px;margin-bottom:10px}#lic h1{font-size:23px;margin:8px 0 6px;font-weight:800}#lic p{color:#b9c1cf;font-size:14.5px;line-height:1.5;margin:0 0 18px}
#lic input{width:100%;box-sizing:border-box;font-size:24px;letter-spacing:.08em;text-align:center;padding:14px 12px;border-radius:14px;border:2px solid rgba(255,255,255,.18);background:#0b0f17;color:#fff;text-transform:uppercase;outline:none}
#lic input:focus{border-color:#f0a65a}#lic .go{margin-top:14px;width:100%;padding:14px;border-radius:14px;border:0;background:#f0a65a;color:#14100a;font-size:18px;font-weight:800;cursor:pointer}
#lic .go:disabled{opacity:.6}#lic .m{min-height:22px;margin-top:14px;font-size:14.5px;font-weight:600}#lic .m.e{color:#ff9b8a}#lic .m.k{color:#9fd17a}
#lic .alt{margin-top:10px;width:100%;padding:12px;border-radius:14px;border:1px solid rgba(255,255,255,.18);background:transparent;color:#e6ecf5;font-size:15.5px;font-weight:700;cursor:pointer}#lic .alt small{display:block;font-weight:500;color:#9aa6b8;font-size:12.5px;margin-top:3px}
#lic .lg{margin-top:16px;display:flex;gap:6px;justify-content:center}#lic .lg button{background:rgba(255,255,255,.07);border:0;color:#cfd7e4;padding:6px 12px;border-radius:9px;cursor:pointer;font-size:13px}
@media (max-height:540px) and (min-width:600px){#lic{padding:10px 16px}#lic .bx{width:min(820px,100%);display:grid;grid-template-columns:1fr 1fr;grid-auto-flow:dense;column-gap:24px;align-items:center;text-align:left;padding:16px 22px;border-radius:18px}#lic .bx>img,#lic h1,#lic .bx>p,#lic .lg{grid-column:1}#lic input,#lic .go,#lic .m,#lic .alt{grid-column:2}#lic .lg{justify-content:flex-start;margin-top:8px}#lic img{height:28px;margin-bottom:2px}#lic h1{font-size:19px;margin:4px 0}#lic .bx>p{font-size:13px;margin:0}#lic input{font-size:19px;padding:10px}#lic .go{margin-top:8px;padding:10px;font-size:16px}#lic .m{min-height:0;margin-top:4px}#lic .alt{margin-top:6px;padding:9px}}
@media (max-height:540px) and (max-width:599px){#lic .bx{padding:16px}#lic h1{font-size:19px}#lic input{font-size:19px;padding:10px}}
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
      const r = await checkCode(app, code); $('.go').disabled = false;
      if (!r.ok) { msg(tl(S[r.key] || S.bad, { d: r.d ? fmt(r.d, lang) : '' }).replace('{m}', r.m ?? ''), 'e'); return; }
      msg(tl(S.ok, { n: r.info.name ? ' · ' + r.info.name : '', d: fmt(r.info.until, lang) }), 'k');
      setTimeout(() => { el.remove(); resolve(licenceInfo(app)); }, 1400);
    };
    const alt = $('.alt'); if (alt) alt.onclick = () => { el.remove(); resolve(opt.locked ? null : { ok: false, demo: true }); };
    $('.go').onclick = go; $('#lic-in').addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); });
    setTimeout(() => $('#lic-in').focus(), 300);
    }
  });
}
