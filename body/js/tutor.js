// The tutor's search: answers to a student's question, found in the app's own content, in English, Hindi or Hinglish.
// (science/js/tutor.js is the master copy; body/js/tutor.js is a copy kept in step by the pre-commit hook.)
// Each app gives its content as documents: { id, kind, title, q (a question it answers, optional), text, ans, ref }
// with every text field as { en, hi, hg }. The search is BM25 over the student's language (and English as a fallback),
// with the activity the student is doing now counted a little higher. When a school has set up the online tutor, the
// best passages also go to it as the context of its answer.

const STOP = {
  en: new Set('a an the of to in on is are was were be been being am what which why how does do did doing done you your it its this that these those with for and or by from at as when where who whom whose can will would should could there their they them into than then i me my we our us please tell explain about happen happens happened happening get gets got make makes made some any very much many more most also just like so if not no yes one'.split(' ')),
  hi: new Set('कितना कितनी कितने है हैं था थे थी थीं हो होता होती होते होगा होगी क्या क्यों कैसे कैसा कैसी कौन कौनसा कब कहाँ कहां के की का को में से पर और या यह ये वह वे इस उस इसे उसे इन उन एक भी तो ही न नहीं जब तब कि जो मुझे हमें बताइए बताओ बताएं समझाइए समझाओ करता करती करते किया कर रहा रही रहे गया गई गए जाता जाती जाते लिए वाला वाली वाले'.split(' ')),
  hg: new Set('kitna kitni kitne hai hain tha the thi ho hota hoti hote hoga hogi kya kyun kyon kyu kaise kaisa kaisi kaun kab kahan ke ki ka ko mein me se par aur ya ye yeh woh wo is us ise use in un ek bhi to hi na nahi jab tab jo mujhe hume humein batao bataiye samjhao samjhaiye karta karti karte kiya kar raha rahi rahe gaya gayi gaye jata jati jate liye wala wali wale the a an of to in on is are what why how does do you it this with for and or'.split(' ')),
};
const stem = (w) => (w.length > 5 && w.endsWith('ing') ? w.slice(0, -3) : w.length > 4 && w.endsWith('ies') ? w.slice(0, -3) + 'y' : w.length > 4 && w.endsWith('es') && /(sh|ch|x|ss)es$/.test(w) ? w.slice(0, -2) : w.length > 4 && w.endsWith('ed') ? w.slice(0, -2) : w.length > 3 && w.endsWith('s') && !w.endsWith('ss') ? w.slice(0, -1) : w);
export function tokens(s, L = 'en') {
  const out = []; const st = STOP[L] || STOP.en;
  for (const m of String(s || '').toLowerCase().normalize('NFC').matchAll(/[\p{L}\p{M}\p{N}]+/gu)) { let w = m[0]; if (st.has(w) || STOP.en.has(w)) continue; if (/^[a-z]+$/.test(w)) w = stem(w); if (w.length < 2 && !/\d/.test(w)) continue; out.push(w); }
  return out;
}
const pick = (o, L) => (o && (o[L] || o.en)) || '';
// the kind of question: a "why" question is better answered by a "why" answer than by a "what is" one
const QW = [['why', /^(why|kyun|kyon|kyu)\b|क्यों/i], ['how', /^(how|kaise)\b|कैसे/i], ['what', /^(what|define|kya|which|name)\b|क्या|कौन/i], ['much', /how (much|many)|kitn[aie]|कितन/i]];
export const qKind = (s) => { const t = String(s || '').trim(); for (const [k, re] of QW) if (re.test(t)) return k; return ''; };

export class TutorIndex {
  constructor(docs) { this.docs = docs; this.idx = {}; }
  build(L) {
    if (this.idx[L]) return this.idx[L];
    const D = this.docs.map((d) => { const qt = tokens(pick(d.q, L), L), tt = tokens(`${pick(d.title, L)} ${pick(d.text, L)}`, L); const tf = new Map(); for (const w of qt) tf.set(w, (tf.get(w) || 0) + 2); for (const w of tt) tf.set(w, (tf.get(w) || 0) + 1); return { tf, len: qt.length * 2 + tt.length, qt: new Set(qt) }; });
    const df = new Map(); for (const d of D) for (const w of d.tf.keys()) df.set(w, (df.get(w) || 0) + 1);
    const avg = D.reduce((a, d) => a + d.len, 0) / Math.max(1, D.length);
    return (this.idx[L] = { D, df, avg, N: D.length });
  }
  // best documents for a question: [{ doc, score }]
  search(q, L = 'en', o = {}) {
    const run = (lang) => {
      const I = this.build(lang); const qt = [...new Set(tokens(q, lang))]; if (!qt.length) return [];
      const k1 = 1.2, b = 0.75; const res = []; const qk = qKind(q);
      I.D.forEach((d, i) => { let s = 0, hit = 0; for (const w of qt) { const f = d.tf.get(w); if (!f) continue; hit++; const idf = Math.log(1 + (I.N - I.df.get(w) + 0.5) / (I.df.get(w) + 0.5)); s += idf * (f * (k1 + 1)) / (f + k1 * (1 - b + b * d.len / I.avg)); if (d.qt.has(w)) s += idf * 0.8; }
        if (!s) return; s *= 0.6 + 0.4 * (hit / qt.length); // most of the question's words found
        const doc = this.docs[i]; if (o.here && doc.ref && o.here.includes(doc.ref)) s *= 1.6; if (o.kind && doc.kind === o.kind) s *= 1.2;
        if (qk && doc.q) { const dk = doc.qk ?? (doc.qk = qKind(pick(doc.q, 'en'))); if (dk && dk !== qk && !(qk === 'what' && dk === 'much')) s *= 0.7; }
        res.push({ doc, score: s, cover: hit / qt.length }); });
      return res.sort((a, b2) => b2.score - a.score).slice(0, o.n || 5);
    };
    // the question's own script decides first (a Hindi question in the English app is answered in Hindi), then the
    // other languages are tried: a Hinglish question is often half English
    const deva = /[\u0900-\u097f]/.test(q); const order = deva ? ['hi', L === 'hi' ? 'hg' : L] : L === 'hi' ? ['hg', 'en'] : [L, L === 'en' ? 'hg' : 'en'];
    let best = []; for (const lang of [...new Set(order)]) { const r = run(lang).map((x) => ({ ...x, lang })); if (r.length && (!best.length || r[0].cover > best[0].cover + 0.01 || (r[0].cover >= best[0].cover - 0.01 && r[0].score > best[0].score * 1.15))) best = r; if (best.length && best[0].cover >= 0.8) break; }
    return best;
  }
}
export { pick };
