// Builds the narration job list (every sentence the app can speak) for English and Hindi.
import fs from 'fs';
const ROOT = new URL('../../science/', import.meta.url);
const { EXPERIMENTS } = await import(new URL('js/experiments.js', ROOT));
const { T, tx } = await import(new URL('js/strings.js', ROOT));
const vkey = (s) => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0; return h.toString(36); };
const jobs = new Map();
const add = (lang, text) => { if (!text) return; const k = vkey(text); jobs.set(lang + '/' + k, { lang, key: k, text }); };
const t = (o, L) => (o ? (o[L] || o.en || '') : '');
for (const L of ['en', 'hi']) {
  add(L, tx(T.finished, L) + '.');
  for (const e of EXPERIMENTS) {
    add(L, t(e.title, L) + '.'); add(L, t(e.aim, L)); add(L, t(e.result.concl, L));
    for (const s of e.steps) { add(L, t(s.do, L)); add(L, t(s.see, L)); add(L, t(s.why, L)); }
  }
}
// particle-view captions: L3('en', 'hi', 'hg') calls in particles.js (read as text, so captions made inside scripts are found too)
const src = fs.readFileSync(new URL('js/particles.js', ROOT), 'utf8');
const q = "'((?:[^'\\\\]|\\\\.)*)'"; const re = new RegExp(`L3\\(\\s*${q}\\s*,\\s*${q}\\s*,\\s*${q}\\s*\\)`, 'g');
const un = (x) => x.replace(/\\'/g, "'");
let nc = 0; for (const m of src.matchAll(re)) { nc++; add('en', un(m[1])); add('hi', un(m[2])); }
console.log('particle captions:', nc, 'of', (src.match(/L3\(/g) || []).length - 1, 'L3 calls');
const list = [...jobs.values()];
fs.writeFileSync(new URL('./jobs.json', import.meta.url), JSON.stringify(list));
console.log(list.length, 'jobs;', list.filter((j) => j.lang === 'hi').length, 'hindi;', list.filter((j) => j.lang === 'hi' && !/[ऀ-ॿ]/.test(j.text)).length, 'hindi jobs without Devanagari');
