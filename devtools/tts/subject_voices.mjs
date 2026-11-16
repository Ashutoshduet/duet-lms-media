// The one-subject apps (DUET Physics Lab 360, Chemistry Lab 360, Biology Lab 360) run the Science Lab's code but carry
// only their own subject. For each one this writes:
//   <subject>/voices.json  the narration clips its activities use (the Science Lab's full set is about 200 MB)
//   <subject>/places.json  the 360° photos of the real places its activities happen in (../maths/places/<img>.jpg + _1k.hdr)
// so that its offline worker and its Android app save only those.
// Usage: node devtools/tts/subject_voices.mjs [physics chemistry biology]
import fs from 'fs';
const ROOT = new URL('../../science/', import.meta.url);
const { ALL_EXPERIMENTS: EXPERIMENTS, subjOf } = await import(new URL('js/experiments.js', ROOT));
const { T, tx } = await import(new URL('js/strings.js', ROOT));
const vkey = (s) => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0; return h.toString(36); };
const t = (o, L) => (o ? (o[L] || o.en || '') : '');

// place name -> photo, read from the code (places.js and the files that add places of their own)
const IMG = {}, BUILT = new Set();
for (const f of fs.readdirSync(new URL('js/', ROOT))) {
  if (!f.endsWith('.js')) continue;
  const src = fs.readFileSync(new URL('js/' + f, ROOT), 'utf8');
  for (const m of src.matchAll(/(?:^|[\s{,])(?:PLACES\.)?([a-z_][a-z0-9_]*)\s*[:=]\s*\{\s*(build:\s*\w+,\s*)?img:\s*'([^']+)'/gm)) { IMG[m[1]] = m[3]; if (m[2]) BUILT.add(m[1]); }
}

const subjects = process.argv.slice(2).length ? process.argv.slice(2) : ['physics', 'chemistry', 'biology'];
for (const S of subjects) {
  const voices = new Set(), places = new Set(); let n = 0;
  const add = (L, s) => { if (s) voices.add(L + '/' + vkey(s)); };
  for (const L of ['en', 'hi']) {
    add(L, tx(T.finished, L) + '.');
    for (const e of EXPERIMENTS) {
      if (subjOf(e) !== S) continue;
      if (L === 'en') { n++; if (e.place && !BUILT.has(e.place)) { if (!IMG[e.place]) throw new Error(`${e.id}: place "${e.place}" has no photo in the code`); places.add(IMG[e.place]); } }
      add(L, t(e.title, L) + '.'); add(L, t(e.aim, L)); add(L, t(e.result && e.result.concl, L));
      for (const s of e.steps || []) { add(L, t(s.do, L)); add(L, t(s.see, L)); add(L, t(s.why, L)); }
    }
  }
  fs.mkdirSync(new URL(`../../${S}/`, import.meta.url), { recursive: true });
  fs.writeFileSync(new URL(`../../${S}/voices.json`, import.meta.url), JSON.stringify([...voices].sort()));
  fs.writeFileSync(new URL(`../../${S}/places.json`, import.meta.url), JSON.stringify([...places].sort()));
  console.log(`${S}: ${n} activities, ${voices.size} narration clips, places: ${[...places].sort().join(' ') || 'none'}`);
}
