// The narration clips the Maths Lab app uses (its activities and the shared lines), written to maths/voices.json so the
// Maths Lab's offline worker saves only those (the Science Lab's full set is over 100 MB).
import fs from 'fs';
const ROOT = new URL('../../science/', import.meta.url);
const { ALL_EXPERIMENTS: EXPERIMENTS, subjOf } = await import(new URL('js/experiments.js', ROOT));
const { T, tx } = await import(new URL('js/strings.js', ROOT));
const vkey = (s) => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0; return h.toString(36); };
const t = (o, L) => (o ? (o[L] || o.en || '') : '');
const out = new Set();
const add = (L, s) => { if (s) out.add(L + '/' + vkey(s)); };
for (const L of ['en', 'hi']) {
  add(L, tx(T.finished, L) + '.');
  for (const e of EXPERIMENTS) {
    if (subjOf(e) !== 'maths') continue;
    add(L, t(e.title, L) + '.'); add(L, t(e.aim, L)); add(L, t(e.result.concl, L));
    for (const s of e.steps) { add(L, t(s.do, L)); add(L, t(s.see, L)); add(L, t(s.why, L)); }
  }
}
fs.writeFileSync(new URL('../../maths/voices.json', import.meta.url), JSON.stringify([...out].sort()));
console.log(out.size, 'maths narration clips');
