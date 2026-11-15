// What the tutor knows in Human Body 360: every body part's name, job and how it works, and every step of the guided
// journeys and organ labs, in English, Hindi and Hinglish.
import { C } from './content.js';

const LS = ['en', 'hi', 'hg'];
const X3 = (o) => (o && typeof o === 'object' ? o : { en: String(o || '') });
const join = (parts, sep = ' ') => { const o = {}; for (const l of LS) o[l] = parts.filter(Boolean).map((p) => (typeof p === 'string' ? p : X3(p)[l] || X3(p).en)).filter(Boolean).join(sep); return o; };
const JOB = { en: 'what does it do job function work', hi: 'काम कार्य', hg: 'kaam kya karta' };
let DOCS = null;
export function bodyDocs() {
  if (DOCS) return DOCS; DOCS = [];
  for (const [k, p] of Object.entries(C.parts)) { if (!p.name || !p.job) continue;
    DOCS.push({ id: 'part:' + k, kind: 'part', ref: 'part:' + k, sys: p.sys, title: X3(p.name), q: join([p.name, JOB]), text: join([p.job, p.process || '']), ans: join([p.job, p.process && p.process.en !== p.job.en ? p.process : '']) }); }
  for (const [k, s] of Object.entries(C.steps)) { if (!s.title || !s.text) continue; const m = k.match(/^(?:lab-)?([a-z]+)-\d+$/); const ref = k.startsWith('lab-') ? 'lab:' + (m && m[1]) : 'journey:' + (m && m[1]);
    DOCS.push({ id: 'step:' + k, kind: 'step', ref, title: X3(s.title), q: X3(s.title), text: X3(s.text), ans: X3(s.text) }); }
  return DOCS;
}
export function bodySuggest(app) {
  const out = []; const L = (o) => o;
  if (app.sel) { const p = C.parts[(app.partInfo(app.sel.pid) || {}).id]; if (p) { out.push({ q: { en: `What does the ${p.name.en} do?`, hi: `${p.name.hi || p.name.en} का क्या काम है?`, hg: `${p.name.hg || p.name.en} ka kya kaam hai?` }, doc: 'part:' + (app.partInfo(app.sel.pid) || {}).id }); } }
  const base = [
    { en: 'How does the heart pump blood?', hi: 'हृदय रक्त कैसे पंप करता है?', hg: 'Heart blood kaise pump karta hai?' },
    { en: 'What do the lungs do?', hi: 'फेफड़े क्या करते हैं?', hg: 'Lungs kya karte hain?' },
    { en: 'What do the kidneys do?', hi: 'गुर्दे क्या करते हैं?', hg: 'Kidneys kya karti hain?' },
    { en: 'How is food digested?', hi: 'भोजन कैसे पचता है?', hg: 'Khana kaise pachta hai?' },
    { en: 'What does the brain do?', hi: 'मस्तिष्क क्या करता है?', hg: 'Brain kya karta hai?' },
    { en: 'Why do we need bones?', hi: 'हमें हड्डियों की ज़रूरत क्यों है?', hg: 'Humein bones ki zaroorat kyun hai?' },
  ];
  void L; return out.concat(base.map((q) => ({ q }))).slice(0, 6);
}
