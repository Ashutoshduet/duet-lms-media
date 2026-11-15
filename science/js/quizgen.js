// Quizzes made from the activities themselves (Science Lab 360 and Maths Lab 360), in English, Hindi and Hinglish.
// - the activity's viva questions, with wrong choices taken from the answers to the most similar questions of other
//   activities of the same subject (a "which gas" question gets other gases), or, for an answer with a number, the same
//   answer with a nearby wrong number (48 cm² → 24 cm², 96 cm², 52 cm²);
// - "what do you see?" for steps the student did, with what is seen in similar steps of other activities;
// - "what does this activity show?" with the conclusions of other activities of the same chapter or class.
// A chapter quiz mixes the questions of every activity of one chapter.
import { EXPERIMENTS, BY_ID, subjOf } from './experiments.js';
import { makeQ, shuffled } from './classroom.js';
import { joinT } from './xlang.js';

const STOP = new Set('the a an of to in on is are was were what which why how does do did you your it its this that with for and or by from at as be when where who name give can will there their they into than then get gets got about after before each one two three four five'.split(' '));
const words = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w));
const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9ऀ-ॿ]/g, '');
const first = (s) => (String(s || '').trim().split(/\s+/)[0] || '').toLowerCase();
const jac = (a, b) => { if (!a.size || !b.size) return 0; let n = 0; for (const x of a) if (b.has(x)) n++; return n / (a.size + b.size - n); };
const hasNum = (s) => /\d/.test(String(s || ''));
const X3 = (o) => (o && typeof o === 'object' ? o : { en: String(o || '') });
let seedN = Date.now() % 100000;
const rnd = () => { seedN = (seedN * 16807) % 2147483647; return seedN / 2147483647; };

let BANK = null, SEES = null, CONCL = null;
const usable = (e) => !e.id.startsWith('open_') && e.steps && e.steps.length;
function bank() {
  if (BANK) return BANK; BANK = []; SEES = []; CONCL = [];
  for (const e of EXPERIMENTS) {
    if (!usable(e)) continue; const s = subjOf(e);
    ((e.result && e.result.viva) || []).forEach((v) => { if (v && v.q && v.a && v.a.en) BANK.push({ e, s, q: X3(v.q), a: X3(v.a), w: new Set(words(v.q.en)), aw: new Set(words(v.a.en)), f: first(v.q.en), n: hasNum(v.a.en), len: v.a.en.length }); });
    e.steps.forEach((st, i) => { if (st.see && st.see.en && st.see.en.length < 220) SEES.push({ e, s, i, do: X3(st.do), see: X3(st.see), w: new Set(words(st.see.en)), len: st.see.en.length }); });
    if (e.result && e.result.concl && e.result.concl.en) CONCL.push({ e, s, c: X3(e.result.concl), w: new Set(words(e.result.concl.en)), len: e.result.concl.en.length });
  }
  return BANK;
}

// pick k wrong choices from a pool, the best-scoring first, a little at random, never the same text twice
function pickWrong(pool, right, k, score, avoid = []) {
  const seen = new Set([norm(right.en), ...avoid.map((x) => norm(x.en))]); const sc = [];
  for (const c of pool) { const v = score(c); if (v > -1e8) sc.push([v + rnd() * 0.35, c]); }
  sc.sort((a, b) => b[0] - a[0]); const out = [];
  for (const [, c] of sc) { const t = c.__ans; const n = norm(t.en); if (!n || seen.has(n)) continue; if (n.length > 4 && (norm(right.en).includes(n) || n.includes(norm(right.en)))) continue; seen.add(n); out.push(t); if (out.length >= k) break; }
  return out;
}

const rep = (s, tok, x, last) => { const i = last ? s.lastIndexOf(tok) : s.indexOf(tok); return i < 0 ? s : s.slice(0, i) + x + s.slice(i + tok.length); };
// numbers changed: the same answer with a wrong number in it, in every language it is written in
function numberVariants(a, k) {
  // a worked answer ("6² + 8² = 100, so the hypotenuse is 10 cm") gets a wrong result; a short one ("48 cm²") a wrong number
  const all = [...String(a.en).matchAll(/-?\d+(?:[.,]\d+)?(?:\/\d+)?/g)]; if (!all.length) return [];
  const worked = /=|→|\bso\b/.test(a.en); const tok = (worked ? all[all.length - 1] : all[0])[0];
  const langs = Object.keys(a).filter((l) => String(a[l]).includes(tok)); if (!langs.includes('en')) return [];
  let vals = [];
  if (tok.includes('/')) { const [p, q] = tok.split('/').map(Number); vals = [`${q}/${p}`, `${p + 1}/${q}`, `${p}/${q * 2}`, `${Math.max(1, p - 1)}/${q}`].filter((x) => x !== tok); }
  else {
    const v = parseFloat(tok.replace(',', '.')); const dec = (tok.split(/[.,]/)[1] || '').length; const f = (x) => (dec ? x.toFixed(dec) : String(Math.round(x)));
    const cand = v === 0 ? [1, 2, -1, 10] : [v * 2, v / 2, v + Math.max(1, Math.abs(v) * 0.1), v - Math.max(1, Math.abs(v) * 0.1), v * 10, v + Math.max(2, Math.abs(v) * 0.25), v * 3];
    vals = [...new Set(cand.map(f))].filter((x) => x !== tok && !(v > 0 && parseFloat(x) <= 0 && !/^-/.test(tok)));
  }
  return shuffled(vals, rnd() * 1e9).slice(0, k).map((x) => { const o = {}; for (const l of Object.keys(a)) o[l] = langs.includes(l) ? rep(String(a[l]), tok, x, worked) : rep(a.en, tok, x, worked); return o; });
}

function vivaQ(b) {
  const pool = BANK.filter((c) => c.s === b.s && c !== b).map((c) => { c.__ans = c.a; return c; });
  const score = (c) => { if (c.e === b.e && jac(c.w, b.w) < 0.15) return -2; const jq = jac(c.w, b.w); if (jq > 0.75 && c.e !== b.e) return -1e9; // the same question elsewhere: its answer may be right too
    if (jac(c.aw, b.aw) > 0.45) return -1e9; // says nearly the same as the right answer
    return jq * 4 + jac(c.aw, b.w) * 2.5 + (c.f === b.f ? 1 : 0) + (c.n === b.n ? 0.8 : -0.8) + (1 - Math.abs(c.len - b.len) / Math.max(c.len, b.len)) + (c.e.cls === b.e.cls ? 0.3 : 0) + (c.e.ch && b.e.ch && c.e.ch.en === b.e.ch.en ? 0.4 : 0); };
  let wrong = [];
  if (b.n) wrong = numberVariants(b.a, 2);
  wrong = wrong.concat(pickWrong(pool, b.a, 3 - wrong.length, score, wrong));
  if (wrong.length < 2) return null;
  return makeQ(b.q, b.a, wrong, { kind: 'viva', from: b.e.id }, rnd() * 1e9);
}
const SEE_Q = { en: 'What do you see?', hi: 'आपको क्या दिखता है?', hg: 'Aapko kya dikhta hai?' };
function stepQ(st) {
  const pool = SEES.filter((c) => c.s === st.s && c.e !== st.e).map((c) => { c.__ans = c.see; return c; });
  const score = (c) => { const j = jac(c.w, st.w); if (j > 0.4) return -1e9; return j * 3 + (1 - Math.abs(c.len - st.len) / Math.max(c.len, st.len)) * 1.2 + (c.e.cls === st.e.cls ? 0.2 : 0); };
  const wrong = pickWrong(pool, st.see, 3, score); if (wrong.length < 2) return null;
  const d = st.do, cut = (s) => (String(s || '').length > 240 ? String(s).slice(0, 237) + '…' : String(s || ''));
  const dc = { en: cut(d.en) }; for (const l of ['hi', 'hg']) dc[l] = cut(d[l] || d.en); Object.setPrototypeOf(dc, { get bn() { return d.bn && cut(d.bn); }, get mr() { return d.mr && cut(d.mr); }, get ta() { return d.ta && cut(d.ta); }, get te() { return d.te && cut(d.te); }, get gu() { return d.gu && cut(d.gu); }, get kn() { return d.kn && cut(d.kn); }, get ml() { return d.ml && cut(d.ml); }, get or() { return d.or && cut(d.or); } });
  const q = joinT([dc, SEE_Q], '\n');
  return makeQ(q, st.see, wrong, { kind: 'see', from: st.e.id }, rnd() * 1e9);
}
const CON_Q = { en: 'What does this activity show?', hi: 'यह गतिविधि क्या दिखाती है?', hg: 'Ye activity kya dikhati hai?' };
function conclQ(e) {
  const me = CONCL.find((c) => c.e === e); if (!me) return null;
  const pool = CONCL.filter((c) => c.s === me.s && c !== me).map((c) => { c.__ans = c.c; return c; });
  // other chapters of the same class: what they show is clearly not what this activity shows (a sibling's conclusion can be true here too)
  const score = (c) => (c.e.ch && e.ch && c.e.ch.en === e.ch.en ? -3 : 0) + (c.e.cls === e.cls ? 1.5 : 0) + (1 - Math.abs(c.len - me.len) / Math.max(c.len, me.len)) - (jac(c.w, me.w) > 0.3 ? 1e9 : 0);
  const wrong = pickWrong(pool, me.c, 3, score); if (wrong.length < 2) return null;
  const q = joinT([X3(e.title), CON_Q], '\n');
  return makeQ(q, me.c, wrong, { kind: 'concl', from: e.id }, rnd() * 1e9);
}

// the quiz of one activity: its viva questions, two "what do you see" steps and its conclusion (about 6 questions)
export function activityQuiz(id, n = 6) {
  const e = BY_ID[id]; if (!e || !usable(e)) return null; bank();
  const qs = [];
  for (const b of BANK.filter((x) => x.e === e)) { const q = vivaQ(b); if (q) qs.push(q); }
  const steps = shuffled(SEES.filter((x) => x.e === e && x.i > 0), rnd() * 1e9).sort((a, b) => (b.e.steps[b.i].why ? 1 : 0) - (a.e.steps[a.i].why ? 1 : 0)); // the steps that explain something first
  for (const st of steps) { if (qs.length >= n - 1) break; const q = stepQ(st); if (q) qs.push(q); }
  const c = conclQ(e); if (c) qs.push(c);
  if (qs.length < 2) return null;
  return { meta: { id: e.id, title: X3(e.title), kind: 'activity' }, qs: qs.slice(0, Math.max(n, 3)) };
}
// a chapter quiz: questions from every activity of the chapter (or of the class, for activities without a chapter)
export function chapterQuiz(id, n = 10) {
  const e = BY_ID[id]; if (!e) return null; bank();
  const same = (x) => subjOf(x) === subjOf(e) && x.cls === e.cls && (e.ch ? x.ch && x.ch.en === e.ch.en : true) && usable(x);
  const exps = EXPERIMENTS.filter(same); const qs = [];
  const vivas = shuffled(BANK.filter((b) => exps.includes(b.e)), rnd() * 1e9);
  for (const b of vivas) { if (qs.length >= n - 2) break; const q = vivaQ(b); if (q) qs.push(q); }
  for (const st of shuffled(SEES.filter((x) => exps.includes(x.e) && x.i > 0), rnd() * 1e9)) { if (qs.length >= n) break; const q = stepQ(st); if (q) qs.push(q); }
  if (qs.length < 3) return null;
  const ch = e.ch ? X3(e.ch) : { en: `Class ${e.cls}` };
  return { meta: { id: 'ch:' + e.id, title: ch, kind: 'chapter' }, qs: shuffled(qs, rnd() * 1e9) };
}
export function quizFor(id) { if (!id) return null; if (String(id).startsWith('ch:')) return chapterQuiz(id.slice(3)); return activityQuiz(id); }
