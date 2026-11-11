// Chemistry: what the student actually got. After a step, each vessel used in it is compared with the same vessel when the
// step is done exactly as in the method (recorded once in chem_expect.json by running every experiment as written).
// What a student put in (inputs, never the products the reactions make), the solids, any precipitate, gas or metal coat and
// the pH are compared; if they really differ, "You see" describes the vessel as it is now and "Why" says what was different.
import { Vector3 } from 'three';
import { SUBS, SOLIDS, PPT, RULES } from './chem.js';

let EXP = null, loading = null;
export function loadExpect() {
  if (EXP || loading) return loading;
  loading = fetch(new URL('./chem_expect.json', import.meta.url)).then((r) => (r.ok ? r.json() : {})).then((j) => { EXP = j; }).catch(() => { EXP = {}; });
  return loading;
}
export const expectFor = (id) => (EXP ? EXP[id] : undefined);

const r2 = (x) => Math.round(x * 100) / 100;
const GAS = ['metal_acid', 'carb_acid', 'carbsol_acid', 'carbppt_acid', 'mg_water', 'metal_base', 'fes_acid', 'alkali', 'hcl_gas'];
const COAT = ['fe_cuso4', 'zn_feso4'];
const liquidMl = (m) => { let s = 0; for (const k in m.liq) if (!SUBS[k]?.ind) s += m.liq[k]; return s; };

export function snapV(v) {
  const m = v.mix; const i = {}; for (const k in m.inp || {}) if (m.inp[k] > 0.005) i[k] = r2(m.inp[k]);
  const out = { i, ml: r2(m.ml()), T: Math.round(m.temp) };
  const s = [...new Set((v.solids || []).map((x) => x.chem0 ?? x.chem).filter(Boolean))].sort(); if (s.length) out.s = s;
  const p = {}; for (const k in m.ppt) if (m.ppt[k] > 0.01) p[k] = r2(m.ppt[k]); if (Object.keys(p).length) out.p = p;
  const r = RULES.filter((x) => { try { return x.test(v); } catch (e) { return false; } }).map((x) => x.id); if (r.length) out.r = r;
  if (liquidMl(m) > 0.3) out.pH = Math.round(m.pH() * 10) / 10;
  return out;
}
export function snapAll(o) {
  const out = {}; const seen = new Set();
  for (const k in o) { const it = o[k]; if (!it || !it.mix || !it.g || seen.has(it)) continue; seen.add(it); out[k] = snapV(it); }
  return out;
}
// did the inputs or solids of a vessel change between two snapshots?
function touched(a, b) {
  if (!a || !b) return !!(a || b);
  const ks = new Set([...Object.keys(a.i), ...Object.keys(b.i)]);
  for (const k of ks) if (Math.abs((a.i[k] || 0) - (b.i[k] || 0)) > 0.04) return true;
  return (a.s || []).join() !== (b.s || []).join();
}

// ------------------------------------------------------------------ words
const T3 = (en, hi, hg) => ({ en, hi, hg });
const COL = {
  colourless: T3('colourless', 'रंगहीन', 'rangheen'), white: T3('white', 'सफ़ेद', 'safed'), milky: T3('milky', 'दूधिया', 'doodhiya'),
  grey: T3('grey', 'स्लेटी', 'grey'), black: T3('black', 'काला', 'kaala'), red: T3('red', 'लाल', 'laal'), pink: T3('pink', 'गुलाबी', 'gulaabi'),
  orange: T3('orange', 'नारंगी', 'naarangi'), yellow: T3('yellow', 'पीला', 'peela'), green: T3('green', 'हरा', 'hara'), teal: T3('blue-green', 'नीला-हरा', 'neela-hara'),
  blue: T3('blue', 'नीला', 'neela'), purple: T3('purple', 'बैंगनी', 'baingani'), brown: T3('brown', 'भूरा', 'bhoora'),
};
// judge colours as they look on screen (sRGB), not in the linear working space; chroma (max − min) tells grey from coloured
const hsl = (c) => { const o = {}; c.getHSL(o, 'srgb'); const q = {}; c.getRGB(q, 'srgb'); o.ch = Math.max(q.r, q.g, q.b) - Math.min(q.r, q.g, q.b); return o; };
function hueName(c) {
  const { h, l, ch } = hsl(c);
  if (l < 0.13) return 'black'; if (ch < 0.1) return l > 0.78 ? 'white' : 'grey';
  if ((h < 0.11 || h > 0.97) && l < 0.42) return 'brown';
  if (h >= 0.95 || h < 0.03) return l > 0.68 ? 'pink' : 'red';
  if (h < 0.105) return 'orange'; if (h < 0.19) return 'yellow'; if (h < 0.45) return 'green'; if (h < 0.52) return 'teal';
  if (h < 0.71) return 'blue'; if (h < 0.83) return 'purple'; return l > 0.42 ? 'pink' : 'purple';
}
function colourOf(v) {
  const L = v.mix.look();
  if (L.cloud > 0.35) { const { ch, l } = hsl(L.cloudC); if (ch < 0.12 && l > 0.72) return COL.milky; const n = COL[hueName(L.cloudC)]; return T3(`cloudy ${n.en}`, `धुंधला ${n.hi}`, `dhundhla ${n.hg}`); }
  const { ch } = hsl(L.color); if (L.alpha < 0.3 && ch < 0.2) return COL.colourless;
  const n = COL[hueName(L.color)]; if (L.alpha < 0.42) return T3(`light ${n.en}`, `हल्का ${n.hi}`, `halka ${n.hg}`); return n;
}
const lc = (t) => (t && t.length > 1 && t[1] === t[1].toLowerCase() ? t[0].toLowerCase() + t.slice(1) : t);
const nameOf = (tab, k) => { const n = tab[k]?.n; return n ? T3(lc(n.en), n.hi, lc(n.hg || n.en)) : T3(k, k, k); };
const sub = (k) => nameOf(SUBS, k), solid = (k) => nameOf(SOLIDS, k), ppt = (k) => nameOf(PPT, k);
const join3 = (arr) => { const j = (L, a, last) => (arr.length < 2 ? arr[0][L] : arr.slice(0, -1).map((x) => x[L]).join(', ') + a + arr[arr.length - 1][L]); return T3(j('en', ' and '), j('hi', ' और '), j('hg', ' aur ')); };
const cap = (t) => (t ? t[0].toUpperCase() + t.slice(1) : t);
function vname(v, all) {
  const n0 = (w) => { const n = w.name || {}; return (L) => { let t = (n[L] || n.en || w.kind || '').split(' — ')[0].replace(/\s*\([^)]*mL\)\s*$/, ''); if (w.stickerText && !t.endsWith(' ' + w.stickerText)) t += ' ' + w.stickerText; return t; }; };
  const f = n0(v); const out = T3(f('en'), f('hi'), f('hg'));
  const same = (all || []).filter((w) => n0(w)('en') === out.en); // two alike (two plain test tubes): say which one, counted from the left
  if (same.length > 1) { const x = (w) => w.g.getWorldPosition(new Vector3()).x; const k = same.sort((a, b) => x(a) - x(b)).indexOf(v) + 1;
    out.en += ` (${k} from the left)`; out.hi += ` (बाएँ से ${k})`; out.hg += ` (left se ${k})`; }
  return out;
}
const ml1 = (x) => (x >= 10 ? Math.round(x) : Math.round(x * 10) / 10);
const pHclass = (p) => (p < 6.5 ? T3('acidic', 'एसिडिक', 'acidic') : p > 7.5 ? T3('basic', 'बेसिक', 'basic') : T3('neutral', 'न्यूट्रल', 'neutral'));

// what the student sees in a vessel right now
function describe(v, A, E) {
  const m = v.mix; const parts = [];
  const solidsNow = (v.solids || []).filter((s) => (s.amount ?? 1) > 0.02);
  if (m.ml() < 0.1 && !solidsNow.length) return T3('it is empty', 'यह खाली है', 'yeh khaali hai');
  if (m.ml() >= 0.1) { const c = colourOf(v); parts.push(T3(`the liquid is ${c.en}`, `अंदर का द्रव ${c.hi} है`, `liquid ${c.hg} hai`)); }
  const pk = Object.keys(A.p || {}).sort((a, b) => A.p[b] - A.p[a])[0];
  if (pk && PPT[pk] && A.p[pk] >= 0.03) { const n = ppt(pk); parts.push(T3(`with ${n.en}`, `इसमें ${n.hi} है`, `isme ${n.hg} hai`)); }
  if (solidsNow.length) { const n = join3([...new Set(solidsNow.map((s) => s.chem))].map(solid)); parts.push(T3(`in it: ${n.en}`, `इसमें रखा है: ${n.hi}`, `isme rakha hai: ${n.hg}`)); }
  const gA = (A.r || []).some((r) => GAS.includes(r)), gE = (E.r || []).some((r) => GAS.includes(r));
  if (gA) parts.push(T3('gas bubbles rise', 'गैस के बुलबुले उठते हैं', 'gas ke bulbule uthte hain')); else if (gE) parts.push(T3('no gas bubbles', 'गैस के बुलबुले नहीं उठते', 'gas ke bulbule nahi uthte'));
  const cA = (A.r || []).some((r) => COAT.includes(r)), cE = (E.r || []).some((r) => COAT.includes(r));
  if (cA && !cE) parts.push(T3('a reddish-brown coat forms on the metal', 'धातु पर लाल-भूरी परत जमती है', 'metal par laal-bhoori layer jamti hai'));
  else if (cE && !cA) parts.push(T3('no coat forms on the metal', 'धातु पर कोई परत नहीं जमती', 'metal par koi layer nahi jamti'));
  const T = Math.round(m.temp); if (T >= 45) parts.push(T3(`it is hot (about ${T} °C)`, `यह गरम है (लगभग ${T} °C)`, `yeh garam hai (lagbhag ${T} °C)`)); else if (T <= 18) parts.push(T3(`it is cold (about ${T} °C)`, `यह ठंडा है (लगभग ${T} °C)`, `yeh thanda hai (lagbhag ${T} °C)`));
  return T3(parts.map((p) => p.en).join(', '), parts.map((p) => p.hi).join(', '), parts.map((p) => p.hg).join(', '));
}

// compare one vessel; returns null when it matches the method closely enough
function compare(A, E, P, partial, B) {
  const d = { extra: [], missing: [], more: [], less: [], sx: [], sm: [], px: [], pm: [], pH: null, gas: null, coat: null };
  const sum = (o) => Object.values(o).reduce((a, b) => a + b, 0);
  const thr = Math.max(0.15, 0.04 * Math.max(sum(A.i), sum(E.i)));
  for (const k of new Set([...Object.keys(A.i), ...Object.keys(E.i)])) {
    const a = A.i[k] || 0, e = E.i[k] || 0; const ind = !!SUBS[k]?.ind; const t = ind ? 0.03 : thr; // an indicator is only a drop or two, but it decides the colour
    if (a >= t && e < (ind ? 0.01 : 0.02)) d.extra.push(k);
    else if (e >= t && a < (ind ? 0.01 : 0.02)) d.missing.push(k);
    else if (!ind && a > 2.5 * e && a - e > 1) d.more.push([k, a, e]);
    else if (!ind && a < 0.4 * e && e - a > 1) d.less.push([k, a, e]);
  }
  const sA = A.s || [], sE = E.s || []; d.sx = sA.filter((x) => !sE.includes(x)); d.sm = sE.filter((x) => !sA.includes(x));
  // a step done by hand may still be going on: what this very step adds may simply not be there yet — unless something else
  // was put in instead (then it is a swap, not an unfinished step)
  const swapped = Object.keys(A.i).some((k) => A.i[k] - ((B && B.i[k]) || 0) > 0.02 && (E.i[k] || 0) - ((P && P.i[k]) || 0) < 0.01) || sA.some((x) => !(B && (B.s || []).includes(x)) && !sE.includes(x));
  if (partial && !swapped) {
    d.missing = d.missing.filter((k) => ((P && P.i[k]) || 0) > 0.01); d.sm = d.sm.filter((x) => P && (P.s || []).includes(x)); }
  for (const k of new Set([...Object.keys(A.p || {}), ...Object.keys(E.p || {})])) { const a = A.p?.[k] || 0, e = E.p?.[k] || 0; if (a >= 0.03 && e < 0.005) d.px.push(k); else if (e >= 0.03 && a < 0.005) d.pm.push(k); }
  const indA = Object.keys(A.i).some((k) => SUBS[k]?.ind && A.i[k] > 0.02); // with an indicator in it the pH shows as a colour
  if (A.pH != null && E.pH != null && ((indA && Math.abs(A.pH - E.pH) > 2) || Math.abs(A.pH - E.pH) > 3 || (A.pH < 6 && E.pH > 8) || (A.pH > 8 && E.pH < 6))) {
    d.pH = [A.pH, E.pH];
    // name the acid or base that was added in a different amount (more acid than needed, too little alkali …)
    const listed = new Set([...d.more, ...d.less].map((x) => x[0]));
    for (const k in A.i) { const h = SUBS[k]?.h; if (!h || listed.has(k) || d.extra.includes(k)) continue; const a = A.i[k] || 0, e = E.i[k] || 0; if (e <= 0) continue;
      const toAcid = A.pH < E.pH; if (Math.abs(a - e) > 0.2 && ((a > e * 1.15 && (h > 0) === toAcid) || (a < e * 0.85 && (h > 0) !== toAcid))) (a > e ? d.more : d.less).push([k, a, e]); }
  }
  const g = (S, L) => (S.r || []).some((r) => L.includes(r)); if (g(A, GAS) !== g(E, GAS)) d.gas = g(A, GAS); if (g(A, COAT) !== g(E, COAT)) d.coat = g(A, COAT);
  const did = d.extra.length + d.missing.length + d.more.length + d.less.length + d.sx.length + d.sm.length;
  // with exactly the same things put in, a different look is only a matter of timing (milkiness a moment later, a reaction just
  // starting): that is not the student's doing, so it is not reported
  if (!did) { d.px = []; d.pm = []; d.pH = null; d.gas = null; d.coat = null; }
  const got = d.px.length + d.pm.length + (d.pH ? 1 : 0) + (d.gas != null ? 1 : 0) + (d.coat != null ? 1 : 0);
  return did || got ? { d, did, got } : null;
}

function reasons(d) {
  const out = [];
  if (d.extra.length === 1 && d.missing.length === 1) { const x = sub(d.extra[0]), y = sub(d.missing[0]); out.push(T3(`You put ${x.en} in it instead of ${y.en}.`, `आपने इसमें ${y.hi} की जगह ${x.hi} डाल दिया।`, `Aapne isme ${y.hg} ki jagah ${x.hg} daal diya.`)); }
  else {
    if (d.extra.length) { const x = join3(d.extra.map(sub)); out.push(T3(`You also put ${x.en} in it — the method does not use it here.`, `आपने इसमें ${x.hi} भी डाल दिया — विधि में यहाँ इसका इस्तेमाल नहीं होता।`, `Aapne isme ${x.hg} bhi daal diya — method mein yahan iska use nahi hota.`)); }
    if (d.missing.length) { const x = join3(d.missing.map(sub)); out.push(T3(`${cap(x.en)} has not been put in it.`, `इसमें ${x.hi} नहीं डाला गया है।`, `Isme ${x.hg} nahi daala gaya hai.`)); }
  }
  for (const [k, a, e] of [...d.more, ...d.less]) { const x = sub(k); out.push(T3(`You put in about ${ml1(a)} mL of ${x.en}; the method uses about ${ml1(e)} mL.`, `आपने लगभग ${ml1(a)} mL ${x.hi} डाला है, जबकि विधि में लगभग ${ml1(e)} mL लगता है।`, `Aapne lagbhag ${ml1(a)} mL ${x.hg} daala hai, jabki method mein lagbhag ${ml1(e)} mL lagta hai.`)); }
  if (d.sx.length === 1 && d.sm.length === 1) { const x = solid(d.sx[0]), y = solid(d.sm[0]); out.push(T3(`You put ${x.en} in it instead of ${y.en}.`, `आपने इसमें ${y.hi} की जगह ${x.hi} डाल दिया।`, `Aapne isme ${y.hg} ki jagah ${x.hg} daal diya.`)); }
  else {
    if (d.sx.length) { const x = join3(d.sx.map(solid)); out.push(T3(`You also put ${x.en} in it.`, `आपने इसमें ${x.hi} भी डाल दिया।`, `Aapne isme ${x.hg} bhi daal diya.`)); }
    if (d.sm.length) { const x = join3(d.sm.map(solid)); out.push(T3(`${cap(x.en)} is not in it.`, `इसमें ${x.hi} नहीं है।`, `Isme ${x.hg} nahi hai.`)); }
  }
  for (const k of d.px) { const x = ppt(k); out.push(T3(`So now there is ${x.en} in it.`, `इसलिए अब इसमें ${x.hi} है।`, `Isliye ab isme ${x.hg} hai.`)); }
  for (const k of d.pm) { const x = ppt(k); out.push(T3(`So no ${x.en} forms.`, `इसलिए यहाँ ${x.hi} नहीं बनता।`, `Isliye yahan ${x.hg} nahi banta.`)); }
  if (d.pH) { const [a, e] = d.pH; const ca = pHclass(a), ce = pHclass(e);
    if (ca.en === ce.en && ca.en !== 'neutral') { const more = (a < e) === (ca.en === 'acidic'); const w = more ? T3('much more', 'काफ़ी ज़्यादा', 'kaafi zyada') : T3('much less', 'काफ़ी कम', 'kaafi kam');
      out.push(T3(`Your mixture is ${w.en} ${ca.en} (pH about ${a.toFixed(1)}) than it would be done as in the method (pH about ${e.toFixed(1)}).`, `विधि के हिसाब से करने पर pH लगभग ${e.toFixed(1)} होता, पर आपका मिश्रण उससे ${w.hi} ${ca.hi} है (pH लगभग ${a.toFixed(1)})।`, `Method ke hisaab se karne par pH lagbhag ${e.toFixed(1)} hota, par aapka mixture usse ${w.hg} ${ca.hg} hai (pH lagbhag ${a.toFixed(1)}).`)); }
    else out.push(T3(`Your mixture is ${ca.en} (pH about ${a.toFixed(1)}); done as in the method it would be ${ce.en} (pH about ${e.toFixed(1)}).`, `आपका मिश्रण ${ca.hi} है (pH लगभग ${a.toFixed(1)})। विधि के हिसाब से करते, तो यह ${ce.hi} होता (pH लगभग ${e.toFixed(1)})।`, `Aapka mixture ${ca.hg} hai (pH lagbhag ${a.toFixed(1)}). Method ke hisaab se karte, to yeh ${ce.hg} hota (pH lagbhag ${e.toFixed(1)}).`)); }
  if (d.gas === false) out.push(T3('So the reaction that gives off gas does not take place.', 'इसलिए वह रिएक्शन नहीं होता जिसमें गैस निकलती है।', 'Isliye woh reaction nahi hota jisme gas nikalti hai.'));
  if (d.gas === true) out.push(T3('So a reaction gives off gas here.', 'इसलिए यहाँ रिएक्शन से गैस निकलती है।', 'Isliye yahan reaction se gas nikalti hai.'));
  if (d.coat === false) out.push(T3('So the more reactive metal does not displace copper here.', 'इसलिए यहाँ ज़्यादा रिएक्टिव धातु कॉपर को हटाकर उसकी जगह नहीं लेती।', 'Isliye yahan zyada reactive metal copper ko displace nahi karti.'));
  return out;
}

// run after a step: { ok:false, see, why } when the student's bench differs from the method, else null
export function chemCheck(runner, i, partial) {
  const e = runner.exp; const X = EXP && EXP[e.id]; if (!X || !X.s || !X.s[i]) return null;
  const s = e.steps[i]; const now = snapAll(runner.o); const E = X.s[i]; const Eprev = i > 0 ? X.s[i - 1] : X.b; const base = runner.base || {};
  const keys = new Set();
  for (const k in now) if (touched(now[k], base[k])) keys.add(k);
  for (const k in E) if (touched(E[k], Eprev && Eprev[k])) keys.add(k);
  for (const k of [s.target, s.ev?.to, s.ev?.v, s.ev?.in]) if (k && now[k]) keys.add(k);
  const flagged = [];
  const empty = (S) => S.ml < 0.1 && !(S.s && S.s.length);
  for (const k of keys) { if (!now[k] || !E[k] || (empty(now[k]) && empty(E[k]))) continue; const c = compare(now[k], E[k], Eprev && Eprev[k], partial, base[k]); if (c) flagged.push({ k, v: runner.o[k], c }); } // an emptied vessel shows nothing
  if (!flagged.length) return null;
  flagged.sort((a, b) => b.c.did - a.c.did || b.c.got - a.c.got);
  const top = flagged.slice(0, 2); const many = top.length > 1; const vessels = [...new Set(Object.values(runner.o).filter((it) => it && it.mix && it.g))];
  const see = { en: [], hi: [], hg: [] }, why = { en: [], hi: [], hg: [] };
  for (const f of top) {
    const n = vname(f.v, vessels); const ds = describe(f.v, now[f.k], E[f.k]);
    for (const L of ['en', 'hi', 'hg']) see[L].push(`${n[L]}: ${ds[L]}${L === 'hi' ? '।' : '.'}`);
    const rs = reasons(f.c.d); if (!rs.length) continue;
    for (const L of ['en', 'hi', 'hg']) why[L].push((many ? `${n[L]}: ` : '') + rs.map((r) => r[L]).join(' '));
  }
  for (const L of ['en', 'hi', 'hg']) { const b = runner.baseText ? runner.baseText(`steps.${i}.see`, L) : ''; if (b) why[L].push(L === 'hi' ? `तुलना के लिए, किताब के हिसाब से नतीजा: “${b}”` : L === 'hg' ? `Comparison ke liye, kitaab ke hisaab se result: “${b}”` : `The book's result, for comparison: “${b}”`); }
  return { ok: false, see: T3(see.en.join(' '), see.hi.join(' '), see.hg.join(' ')), why: T3(why.en.join(' '), why.hi.join(' '), why.hg.join(' ')), flagged: top.map((f) => f.k) };
}
