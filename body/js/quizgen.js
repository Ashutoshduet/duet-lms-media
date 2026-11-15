// Human Body 360 quizzes, in English, Hindi and Hinglish, made from the body model and its own part descriptions:
// - "What is the glowing part called?": the part glows on the body (the rest fades), with names of other parts of the
//   same organ or system to choose from;
// - "What does the … do?": the part's job, with the jobs of other parts of the same organ or system.
// Quiz ids: sys:<system> (a body system), split:<organ> (an organ's parts), lab:<organ> (the Organ Lab's organ), all.
import { C, partInfo } from './content.js';
import { SYSTEMS } from './data.js';
import { UNITS, unitParts } from './split.js';
import { makeQ, shuffled } from './classroom.js';

const NAMEQ = { en: 'What is the glowing part called?', hi: 'चमकते हुए हिस्से का नाम क्या है?', hg: 'Chamakte hue part ka naam kya hai?' };
const jobQ = (n) => ({ en: `What does the ${n.en} do?`, hi: `${n.hi || n.en} का क्या काम है?`, hg: `${n.hg || n.en} ka kya kaam hai?` });
const LAB_UNIT = { heart: 'heart', eye: 'eye', ear: 'ear', brain: 'brain', lungs: 'lungs', kidney: 'kidney', tooth: 'teeth' };
const LAB_SYS = { heart: 'circulatory', eye: 'senses', ear: 'senses', brain: 'nervous', lungs: 'respiratory', kidney: 'urinary', tooth: 'digestive', skin: 'skin' };
const SYS_EXTRA = { senses: { en: 'Sense organs', hi: 'ज्ञानेंद्रियाँ', hg: 'Sense organs' }, lymphatic: { en: 'Lymph and immunity', hi: 'लसीका और प्रतिरक्षा', hg: 'Lymph aur immunity' }, endocrine: { en: 'Glands and hormones', hi: 'ग्रंथियाँ और हार्मोन', hg: 'Glands aur hormones' } };
let seed = Date.now() % 1e6; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
const norm = (s) => String(s || '').toLowerCase().replace(/\s*\(.*?\)\s*/g, '').replace(/[^a-z0-9ऀ-ॿ]/g, '');

// one entry per distinct part (several model parts can share one description)
function entries(pids, app) {
  const out = [], seen = new Set();
  for (const pid of pids) {
    const info = partInfo(pid, 'en'); if (!info || !info.job) continue; const key = info.id; const p = C.parts[key]; if (!p || !p.name || !p.job) continue;
    const nk = norm(p.name.en); if (seen.has(nk)) continue; seen.add(nk);
    out.push({ pid, key, name: p.name, job: p.job, sys: p.sys, show: !!(app.body.partObjs[pid] && app.body.partObjs[pid].length) });
  }
  return out;
}
const sysPids = (s, app) => Object.keys(app.body.partObjs).filter((pid) => { const i = partInfo(pid, 'en'); return i && C.parts[i.id] && C.parts[i.id].sys === s; });
function build(pool, wider, n) {
  const qs = []; const all = pool.length >= 4 ? pool : [...pool, ...wider.filter((w) => !pool.some((p) => norm(p.name.en) === norm(w.name.en)))];
  const order = shuffled(pool, rnd() * 1e9);
  order.forEach((e, k) => {
    if (qs.length >= n) return;
    const others = shuffled(all.filter((o) => o !== e && norm(o.name.en) !== norm(e.name.en)), rnd() * 1e9);
    if (others.length < 2) return;
    if (e.show && (k % 2 === 0 || !e.job)) qs.push(makeQ(NAMEQ, e.name, others.slice(0, 3).map((o) => o.name), { kind: 'name', part: e.pid }, rnd() * 1e9));
    else { const wrong = others.filter((o) => norm(o.job.en) !== norm(e.job.en)).slice(0, 3).map((o) => o.job); if (wrong.length >= 2) qs.push(makeQ(jobQ(e.name), e.job, wrong, { kind: 'job' }, rnd() * 1e9)); }
  });
  return qs;
}
const sysTitle = (s) => { const b = SYSTEMS[s] || SYS_EXTRA[s]; if (!b) return { en: s }; return { en: b.en, hi: (C.systems && C.systems[s] && C.systems[s].hi) || b.hi || b.en, hg: (C.systems && C.systems[s] && C.systems[s].hg) || b.hg || b.en }; };
const QZ = { en: 'Name the parts', hi: 'हिस्सों के नाम', hg: 'Parts ke naam' };
const withQ = (t) => ({ en: `${QZ.en}: ${t.en}`, hi: `${QZ.hi}: ${t.hi || t.en}`, hg: `${QZ.hg}: ${t.hg || t.en}` });

export function bodyQuiz(id, app, n = 8) {
  id = String(id || 'all');
  if (id.startsWith('lab:')) { const l = id.slice(4); if (LAB_UNIT[l]) id = 'split:' + LAB_UNIT[l]; else if (LAB_SYS[l]) id = 'sys:' + LAB_SYS[l]; }
  if (id.startsWith('journey:')) { const s = app.journeySys && app.journeySys(id.slice(8)); id = s ? 'sys:' + s : 'all'; }
  let qs = [], title;
  if (id.startsWith('split:')) {
    const u = id.slice(6); if (!UNITS[u]) return null; const pool = entries(unitParts(u, app.partMeta), app);
    const sys = pool[0] && pool[0].sys; const wider = sys ? entries(sysPids(sys, app), app) : [];
    qs = build(pool, wider, n); title = withQ(UNITS[u].name);
  } else if (id.startsWith('sys:')) {
    const s = id.slice(4); const pool = entries(sysPids(s, app), app); qs = build(pool, [], n); title = withQ(sysTitle(s));
  } else { // every system: a few from each
    const ss = shuffled(Object.keys(SYSTEMS), rnd() * 1e9); for (const s of ss) { if (qs.length >= n) break; qs = qs.concat(build(entries(sysPids(s, app), app), [], 2)); }
    title = { en: 'The human body', hi: 'मानव शरीर', hg: 'Human body' }; id = 'all';
  }
  if (qs.length < 2) return null;
  return { meta: { id, title, kind: 'parts' }, qs: qs.slice(0, n) };
}
