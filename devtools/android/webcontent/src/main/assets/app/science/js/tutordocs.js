// What the tutor knows in Science Lab 360 and Maths Lab 360: every activity's viva questions and answers, what is seen
// at each step and why, its conclusion and its safety notes, in English, Hindi and Hinglish.
import { EXPERIMENTS, BY_ID } from './experiments.js';
import { joinT } from './xlang.js';

const X3 = (o) => (o && typeof o === 'object' ? o : { en: String(o || '') });
const join = (parts, sep = ' ') => joinT(parts.filter(Boolean).map((p) => (typeof p === 'string' ? p : X3(p))), sep);
const WHY = { en: 'Why:', hi: 'क्यों:', hg: 'Kyun:' };
const WHYW = { en: 'why', hi: 'क्यों', hg: 'kyun' };
let DOCS = null;
export function scienceDocs() {
  if (DOCS) return DOCS; DOCS = [];
  for (const e of EXPERIMENTS) {
    if (e.id.startsWith('open_') || !e.steps) continue; const T = X3(e.title), R = e.result || {};
    (R.viva || []).forEach((v, i) => DOCS.push({ id: `${e.id}:v${i}`, kind: 'viva', ref: e.id, title: T, q: X3(v.q), text: X3(v.a), ans: X3(v.a) }));
    e.steps.forEach((s, i) => { if (!s.see) return; const why = s.why ? join([WHY, s.why]) : null;
      DOCS.push({ id: `${e.id}:s${i}`, kind: 'step', ref: e.id, step: i, title: T, q: join([s.do, s.why ? WHYW : '']), text: join([s.see, s.why]), ans: join([s.see, why]) }); });
    if (R.concl) DOCS.push({ id: `${e.id}:c`, kind: 'concl', ref: e.id, title: T, q: join([e.aim || '', T]), text: X3(R.concl), ans: X3(R.concl) });
    if (R.safety) DOCS.push({ id: `${e.id}:k`, kind: 'safety', ref: e.id, title: T, q: join([T, { en: 'safety care precaution danger', hi: 'सावधानी सुरक्षा', hg: 'savdhani safety' }]), text: X3(R.safety), ans: X3(R.safety) });
  }
  return DOCS;
}
// questions worth asking about the activity open now (shown as buttons to tap)
export function scienceSuggest(id, stepI) {
  const e = BY_ID[id]; if (!e) return [];
  const out = []; const s = e.steps[stepI] || null;
  if (s && s.why) out.push({ q: { en: 'Why does this happen?', hi: 'ऐसा क्यों होता है?', hg: 'Aisa kyun hota hai?' }, doc: `${e.id}:s${stepI}` });
  ((e.result && e.result.viva) || []).forEach((v, i) => out.push({ q: X3(v.q), doc: `${e.id}:v${i}` }));
  out.push({ q: { en: 'What does this activity show?', hi: 'यह गतिविधि क्या दिखाती है?', hg: 'Ye activity kya dikhati hai?' }, doc: `${e.id}:c` });
  if (e.result && e.result.safety) out.push({ q: { en: 'What care should I take?', hi: 'क्या सावधानी रखनी है?', hg: 'Kya savdhani rakhni hai?' }, doc: `${e.id}:k` });
  return out.slice(0, 6);
}
