// Writes class/catalog.json: every activity the teacher's class page can send students to, or start a quiz on.
// Usage: node devtools/class/catalog.mjs <repo>      (run by the pre-commit hook)
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const repo = path.resolve(process.argv[2] || '.');
const part = process.argv[3];
globalThis.localStorage = { getItem() { return null; }, setItem() {}, removeItem() {} };
globalThis.location = { search: '', pathname: '/' };
const two = (o) => (o ? { en: o.en || '', hi: o.hi || o.en || '' } : undefined);

if (part === 'science' || part === 'maths') {
  if (part === 'maths') globalThis.window = { DUET_APP: 'maths' };
  const m = await import(pathToFileURL(path.join(repo, 'science/js/experiments.js')).href);
  const out = m.EXPERIMENTS.filter((e) => !e.id.startsWith('open_') && e.steps && e.steps.length && (part !== 'maths' || m.subjOf(e) === 'maths'))
    .map((e) => ({ id: e.id, s: m.subjOf(e), c: e.cls, ch: two(e.ch), t: two(e.title), v: ((e.result && e.result.viva) || []).length }));
  process.stdout.write(JSON.stringify(out));
} else if (part === 'body') {
  const d = await import(pathToFileURL(path.join(repo, 'body/js/data.js')).href);
  const c = JSON.parse(fs.readFileSync(path.join(repo, 'body/models/content.json'), 'utf8'));
  const lab = fs.readFileSync(path.join(repo, 'body/js/lab.js'), 'utf8');
  const labIds = JSON.parse(lab.match(/LAB_IDS = (\[[^\]]*\])/)[1].replace(/'/g, '"'));
  const labT = (id) => { const m = lab.match(new RegExp(`\\b${id}: \\{[^\\n]*?title: \\{ en: '([^']*)', hi: '([^']*)'`)); return m ? { en: m[1], hi: m[2] } : { en: id, hi: id }; };
  const sysN = {}; for (const p of Object.values(c.parts)) if (p.sys) sysN[p.sys] = (sysN[p.sys] || 0) + 1;
  const SN = { ...d.SYSTEMS, senses: { en: 'Sense organs', hi: 'ज्ञानेंद्रियाँ' }, lymphatic: { en: 'Lymph and immunity', hi: 'लसीका और प्रतिरक्षा' }, endocrine: { en: 'Glands and hormones', hi: 'ग्रंथियाँ और हार्मोन' } };
  const out = [];
  for (const j of d.JOURNEYS) out.push({ id: 'journey:' + j.id, k: 'journey', t: two({ ...j.title, ...((c.journeys || {})[j.id] || {}), en: j.title.en }) });
  for (const id of labIds) out.push({ id: 'lab:' + id, k: 'lab', t: labT(id) });
  for (const [s, n] of Object.entries(sysN)) if (n >= 4 && SN[s]) out.push({ id: 'sys:' + s, k: 'sys', t: two(SN[s]), n });
  const split = fs.readFileSync(path.join(repo, 'body/js/split.js'), 'utf8');
  for (const m of split.matchAll(/^  (\w+): \{ groups:.*?name: \{ en: '([^']*)', hi: '([^']*)'/gm)) out.push({ id: 'split:' + m[1], k: 'split', t: { en: m[2], hi: m[3] } });
  process.stdout.write(JSON.stringify(out));
} else {
  const run = (p) => { const r = spawnSync(process.execPath, [new URL(import.meta.url).pathname, repo, p], { encoding: 'utf8', maxBuffer: 64e6 }); if (r.status !== 0) { process.stderr.write(r.stderr); process.exit(1); } return JSON.parse(r.stdout); };
  const cat = { v: 1, science: run('science'), maths: run('maths'), body: run('body') };
  const file = path.join(repo, 'class/catalog.json'); const txt = JSON.stringify(cat);
  if (!fs.existsSync(file) || fs.readFileSync(file, 'utf8') !== txt) fs.writeFileSync(file, txt);
  console.log(`catalog: science ${cat.science.length}, maths ${cat.maths.length}, body ${cat.body.length}`);
}
