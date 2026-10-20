// Language layer: English / Hindi / Hinglish text for UI, journeys, steps and every body part.
import { JOURNEYS, PARTS as BASE, SYSTEMS, T } from './data.js';

export const LANGS = ['en', 'hi', 'hg'];
export const LANG_LABEL = { en: 'English', hi: 'हिंदी', hg: 'Hinglish' };
export const LANG_SHORT = { en: 'EN', hi: 'हिं', hg: 'HG' };

// fallbacks for UI words before the content file loads (and for new keys)
Object.assign(T, {
  organs: { en: 'Organs', hi: 'अंग', hg: 'Organs' },
  recenter: { en: 'Recenter', hi: 'सामने लाएँ', hg: 'Saamne laao' },
  sfx: { en: 'Sounds', hi: 'ध्वनियाँ', hg: 'Sounds' },
  menuBack: { en: 'Menu', hi: 'मेन्यू', hg: 'Menu' },
  teacher: { en: 'DUET STEM Teacher', hi: 'DUET STEM शिक्षक', hg: 'DUET STEM Teacher' },
  on: { en: 'on', hi: 'चालू', hg: 'on' },
  off: { en: 'off', hi: 'बंद', hg: 'off' },
  howItWorks: { en: 'How it works', hi: 'कैसे काम करता है', hg: 'Kaise kaam karta hai' },
  pickOrgan: { en: 'Pick an organ to see how it works.', hi: 'कोई अंग चुनें और देखें वह कैसे काम करता है।', hg: 'Koi organ choose karo aur dekho woh kaise kaam karta hai.' },
});

// organs offered in the library, grouped by system
export const ORGANS = {
  circulatory: ['heart_ra', 'heart_rv', 'heart_la', 'heart_lv', 'valve_tricuspid', 'valve_mitral', 'valve_pulmonary', 'valve_aortic', 'coronary', 'arteries', 'veins', 'pulm_arteries', 'pulm_veins', 'spleen'],
  respiratory: ['nasal_cavity', 'pharynx', 'larynx', 'trachea', 'bronchi', 'lung_r', 'lung_l', 'diaphragm'],
  digestive: ['mouth', 'teeth', 'tongue', 'salivary', 'esophagus', 'stomach', 'duodenum', 'small_intestine', 'large_intestine', 'rectum', 'liver', 'gallbladder', 'bile_ducts', 'pancreas'],
  urinary: ['kidney_l', 'kidney_r', 'renal_pelvis', 'adrenal', 'ureters', 'bladder', 'urethra'],
  nervous: ['cerebrum', 'cerebellum', 'brainstem', 'spinal_cord', 'nerves', 'eyes', 'pituitary', 'thyroid'],
  skeleton: ['skull', 'mandible', 'vertebrae', 'ribs', 'sternum', 'clavicle', 'scapula', 'humerus', 'radius', 'ulna', 'hand', 'hip', 'femur', 'patella', 'tibia', 'fibula', 'foot'],
  muscles: ['muscles', 'diaphragm', 'skin'],
};

export const C = { parts: {}, audio: {}, loaded: false };

const pick = (o, l) => (o ? o[l] || o.en || '' : '');
export const tx = (o, l) => pick(o, l);

function baseParts() {
  for (const [id, v] of Object.entries(BASE)) {
    C.parts[id] = { name: { en: v[0], hi: v[1] }, job: { en: v[2], hi: v[3] }, detail: { en: v[2], hi: v[3] }, speak: {} };
  }
  C.parts.rectum = { name: { en: 'Rectum & anus', hi: 'मलाशय और गुदा' }, job: { en: 'Stores solid waste until we go to the toilet, then it leaves through the anus.', hi: 'शौच जाने तक ठोस अपशिष्ट को रोककर रखता है।' }, detail: { en: 'Stores solid waste until we go to the toilet, then it leaves through the anus.' }, speak: {} };
}
baseParts();

export async function loadContent(url) {
  let c;
  try { c = await fetch(url).then((r) => (r.ok ? r.json() : null)); } catch (e) { c = null; }
  if (!c) return false;
  const steps = new Map(JOURNEYS.flatMap((j) => j.steps.map((s) => [s.id, s])));
  for (const [id, v] of Object.entries(c.steps || {})) {
    const s = steps.get(id); if (!s) continue;
    Object.assign(s.title, v.title); Object.assign(s.text, v.text);
    s.speak = v.speak || {};
  }
  for (const j of JOURNEYS) if (c.journeys && c.journeys[j.id]) Object.assign(j.title, c.journeys[j.id]);
  for (const [id, v] of Object.entries(c.parts || {})) C.parts[id] = { name: v.name, job: v.job, detail: v.detail, speak: v.speak || {} };
  for (const [k, v] of Object.entries(c.ui || {})) if (T[k]) Object.assign(T[k], v);
  for (const [k, v] of Object.entries(c.systems || {})) if (SYSTEMS[k]) Object.assign(SYSTEMS[k], v);
  C.audio = c.audio || {};
  C.loaded = true;
  return true;
}

// name / second name / job / detail of a part in the current language
export function partInfo(id, l) {
  const p = C.parts[id]; if (!p) return null;
  const alt = l === 'en' ? pick(p.name, 'hi') : l === 'hi' ? pick(p.name, 'en') : pick(p.name, 'hi');
  return { id, name: pick(p.name, l), alt, job: pick(p.job, l), detail: pick(p.detail, l) };
}

// is there a recorded narration file for this id in this language?
export function hasAudio(id, l) { const a = C.audio[id]; return !!(a && a.includes(l)); }
