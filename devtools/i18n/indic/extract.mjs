// Every English text of an app that a student can see: { "<English>": 1 } written to <out>.
// usage: node extract.mjs <repo> science|body <out.json>
// Sources: the "en" of every { en: … } literal in the app's code, the arguments of X('…') (activity texts), the keys of
// the Hindi dictionaries (DICT), and for Human Body every "en" in models/content.json.
import fs from 'node:fs';
import path from 'node:path';
const [,, repo, app, out] = process.argv;
const dir = path.join(repo, app, 'js'); const S = new Set();
const unq = (lit) => { try { return Function('"use strict"; return ' + lit)(); } catch (e) { return null; } };
const LIT = String.raw`'(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"|\x60(?:[^\x60\\$]|\\.|\$(?!\{))*\x60`;
const reEn = new RegExp(String.raw`\ben\s*:\s*(` + LIT + ')', 'g');
const reX = new RegExp(String.raw`\bX\(\s*(` + LIT + String.raw`)\s*\)`, 'g');
const reKey = new RegExp(String.raw`^\s*(` + LIT + String.raw`)\s*:\s*\{\s*hi\s*:`, 'gm');
for (const f of fs.readdirSync(dir)) {
  if (!f.endsWith('.js')) continue; const src = fs.readFileSync(path.join(dir, f), 'utf8');
  for (const re of [reEn, reX, reKey]) for (const m of src.matchAll(re)) { const v = unq(m[1]); if (typeof v === 'string' && /[A-Za-z]/.test(v) && v.trim()) S.add(v); }
}
if (app === 'body') {
  const walk = (o) => { if (Array.isArray(o)) o.forEach(walk); else if (o && typeof o === 'object') { if (typeof o.en === 'string' && o.en.trim()) S.add(o.en); for (const v of Object.values(o)) if (v && typeof v === 'object') walk(v); } };
  walk(JSON.parse(fs.readFileSync(path.join(repo, 'body/models/content.json'), 'utf8')));
}
const o = {}; for (const s of [...S].sort()) o[s] = 1; fs.writeFileSync(out, JSON.stringify(o, null, 0));
let ch = 0; for (const s of S) ch += s.length; console.log(app, S.size, 'texts', ch, 'chars');
