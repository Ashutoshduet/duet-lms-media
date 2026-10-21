// Language layer: English / Hindi / Hinglish text for UI, journeys, labs and every body part.
import { JOURNEYS, PARTS as BASE, SYSTEMS, T } from './data.js';

export const LANGS = ['en', 'hi', 'hg'];
export const LANG_LABEL = { en: 'English', hi: 'हिंदी', hg: 'Hinglish' };
export const LANG_SHORT = { en: 'EN', hi: 'हिं', hg: 'HG' };

// UI words (merged with content.json "ui")
Object.assign(T, {
  title: { en: 'Human Body 360', hi: 'मानव शरीर 360', hg: 'Human Body 360' },
  organs: { en: 'Body parts', hi: 'शरीर के अंग', hg: 'Body parts' },
  labs: { en: 'Organ Lab', hi: 'अंग प्रयोगशाला', hg: 'Organ Lab' },
  labHint: { en: 'A big, detailed model. Take the guided tour or point at any part.', hi: 'बड़ा, विस्तृत मॉडल। गाइडेड टूर लें या किसी भी हिस्से पर इशारा करें।', hg: 'Bada, detailed model. Guided tour lo ya kisi bhi part par point karo.' },
  tour: { en: 'Guided tour', hi: 'गाइडेड टूर', hg: 'Guided tour' },
  dismantle: { en: 'Take apart', hi: 'अलग करें', hg: 'Alag karo' },
  assemble: { en: 'Put back game', hi: 'जोड़ो खेल', hg: 'Jodo game' },
  organsSet: { en: 'Organs', hi: 'अंग', hg: 'Organs' },
  bonesSet: { en: 'Bones', hi: 'हड्डियाँ', hg: 'Bones' },
  dismantleHint: { en: 'The body comes apart. Point at any piece to see its name, function and process.', hi: 'शरीर के हिस्से अलग हो गए। किसी भी हिस्से पर इशारा करने से उसका नाम, काम और प्रक्रिया दिखती है।', hg: 'Body ke parts alag ho gaye. Kisi bhi piece par point karne se uska naam, kaam aur process dikhta hai.' },
  assembleHint: { en: 'Pick up each piece and put it in its right place in the body.', hi: 'हर हिस्से को उठाओ और शरीर में उसकी सही जगह पर रखो।', hg: 'Har piece uthao aur body mein uski sahi jagah par rakho.' },
  assembleVR: { en: 'Hold the grip (or trigger) on a piece, carry it to the glowing body, let go.', hi: 'किसी हिस्से पर ग्रिप (या ट्रिगर) दबाकर पकड़ो, शरीर तक ले जाओ और छोड़ दो।', hg: 'Kisi piece par grip (ya trigger) dabake pakdo, body tak le jao aur chhod do.' },
  assembleDesk: { en: 'Drag a piece with the mouse or finger and drop it in the body.', hi: 'माउस या उँगली से हिस्से को खींचकर शरीर में छोड़ो।', hg: 'Mouse ya finger se piece ko drag karke body mein drop karo.' },
  placed: { en: 'placed', hi: 'सही जगह', hg: 'placed' },
  wellDone: { en: 'Complete. Every piece is in its right place.', hi: 'पूरा हुआ। हर हिस्सा अपनी सही जगह पर है।', hg: 'Complete. Har piece apni sahi jagah par hai.' },
  tryAgain: { en: 'Not here — try another place', hi: 'यहाँ नहीं — कहीं और कोशिश करो', hg: 'Yahan nahi — kahin aur try karo' },
  hint: { en: 'Hint', hi: 'संकेत', hg: 'Hint' },
  restart: { en: 'Restart', hi: 'फिर से', hg: 'Restart' },
  listen: { en: 'Listen', hi: 'सुनें', hg: 'Suno' },
  isolate: { en: 'Show alone', hi: 'अकेले दिखाएँ', hg: 'Akela dikhao' },
  showAll: { en: 'Show all', hi: 'सब दिखाएँ', hg: 'Sab dikhao' },
  openLab: { en: 'Open in Organ Lab', hi: 'अंग प्रयोगशाला में खोलें', hg: 'Organ Lab mein kholo' },
  zoomIn: { en: 'Close-up', hi: 'पास से देखें', hg: 'Close-up' },
  left: { en: 'left', hi: 'बायाँ', hg: 'left' },
  right: { en: 'right', hi: 'दायाँ', hg: 'right' },
  recenter: { en: 'Recenter', hi: 'सामने लाएँ', hg: 'Saamne laao' },
  sfx: { en: 'Sounds', hi: 'ध्वनियाँ', hg: 'Sounds' },
  voice: { en: 'Voice', hi: 'आवाज़', hg: 'Voice' },
  fnLabel: { en: 'Function', hi: 'काम', hg: 'Kaam' },
  howLabel: { en: 'How it works', hi: 'प्रक्रिया', hg: 'Process' },
  speed: { en: 'Speed', hi: 'गति', hg: 'Speed' },
  menuBack: { en: 'Back', hi: 'वापस', hg: 'Back' },
  home: { en: 'Home', hi: 'होम', hg: 'Home' },
  on: { en: 'on', hi: 'चालू', hg: 'on' },
  off: { en: 'off', hi: 'बंद', hg: 'off' },
  offline: { en: 'Saved for offline', hi: 'ऑफ़लाइन के लिए सेव', hg: 'Offline ke liye saved' },
  saving: { en: 'Saving for offline', hi: 'ऑफ़लाइन के लिए सेव हो रहा है', hg: 'Offline ke liye save ho raha hai' },
  saveAll: { en: 'Save all languages', hi: 'सभी भाषाएँ सेव करें', hg: 'Saari languages save karo' },
  pickOrgan: { en: 'Select a part to see its name, function and process.', hi: 'कोई भी अंग चुनें: नाम, काम और प्रक्रिया।', hg: 'Koi bhi part select karo: naam, kaam aur process.' },
  settings: { en: 'Settings', hi: 'सेटिंग्स', hg: 'Settings' },
  explode: { en: 'Explode', hi: 'फैलाएँ', hg: 'Explode' },
  labApartHint: { en: 'The organ is separated into its parts. Point at any part to see its name, function and process.', hi: 'अंग अपने हिस्सों में अलग है। किसी भी हिस्से पर इशारा करने से उसका नाम, काम और प्रक्रिया दिखती है।', hg: 'Organ apne parts mein alag hai. Kisi bhi part par point karne se uska naam, kaam aur process dikhta hai.' },
  together: { en: 'Put together', hi: 'वापस जोड़ें', hg: 'Wapas jodo' },
  allOrgans: { en: 'All organs together', hi: 'सारे अंग एक साथ', hg: 'Saare organs ek saath' },
  togetherHint: { en: 'All the organs in their places inside the body. Point at any organ to see its name, function and process.', hi: 'शरीर के अंदर सारे अंग अपनी जगह पर। किसी भी अंग पर इशारा करने से उसका नाम, काम और प्रक्रिया दिखती है।', hg: 'Body ke andar saare organs apni jagah par. Kisi bhi organ par point karne se uska naam, kaam aur process dikhta hai.' },
  museum: { en: 'Walk around (museum)', hi: 'चारों ओर घूमें (संग्रहालय)', hg: 'Chaaron taraf ghumo (museum)' },
  museumHint: { en: 'Museum view. The model stands in the middle of the room. Walk around it, or push the thumbstick left or right to move around it.', hi: 'संग्रहालय दृश्य। मॉडल कमरे के बीच में है। इसके चारों ओर चलें, या थंबस्टिक को बाएँ या दाएँ करके इसके चारों ओर घूमें।', hg: 'Museum view. Model room ke beech mein hai. Iske chaaron taraf chalo, ya thumbstick left ya right karke iske chaaron taraf ghumo.' },
  spin: { en: '360° turn', hi: '360° घुमाएँ', hg: '360° ghumao' },
});
for (const [k, v] of Object.entries({
  senses: { en: 'Eyes & ears', hi: 'आँखें और कान', hg: 'Eyes & ears', color: '#7fd1c7' },
  endocrine: { en: 'Glands', hi: 'ग्रंथियाँ', hg: 'Glands', color: '#f08bc0' },
  lymphatic: { en: 'Immune system', hi: 'प्रतिरक्षा तंत्र', hg: 'Immune system', color: '#9fd17a' },
})) SYSTEMS[k] = v;

// groups (mesh level) that map onto a single content part
export const GROUP_ALIAS = {
  heart_ra: 'right_atrium', heart_rv: 'right_ventricle', heart_la: 'left_atrium', heart_lv: 'left_ventricle',
  valve_tricuspid: 'tricuspid_valve', valve_mitral: 'mitral_valve', valve_pulmonary: 'pulmonary_valve', valve_aortic: 'aortic_valve',
  papillary: 'papillary_muscles', kidney_l: 'kidneys', kidney_r: 'kidneys', pulm_arteries: 'pulmonary_arteries', pulm_veins: 'pulmonary_veins',
  coronary: 'coronary_arteries', adrenal: 'adrenal_glands', thyroid: 'thyroid_gland', bile_ducts: 'bile_duct', eyes: 'eye',
};

export const C = { parts: {}, steps: {}, audio: {}, loaded: false };
const pick = (o, l) => (o ? o[l] || o.en || '' : '');
export const tx = (o, l) => pick(o, l);

function baseParts() {
  for (const [id, v] of Object.entries(BASE)) C.parts[id] = { name: { en: v[0], hi: v[1] }, job: { en: v[2], hi: v[3] }, detail: { en: v[2], hi: v[3] } };
  C.parts.rectum = { name: { en: 'Rectum & anus', hi: 'मलाशय और गुदा', hg: 'Rectum aur anus' }, job: { en: 'Stores solid waste until we go to the toilet, then it leaves through the anus.', hi: 'शौच जाने तक ठोस अपशिष्ट को रोककर रखता है।', hg: 'Toilet jaane tak solid waste ko store karta hai.' } };
}
baseParts();

export async function loadContent(url) {
  let c;
  try { c = await fetch(url).then((r) => (r.ok ? r.json() : null)); } catch (e) { c = null; }
  if (!c) return false;
  const steps = new Map(JOURNEYS.flatMap((j) => j.steps.map((s) => [s.id, s])));
  for (const [id, v] of Object.entries(c.steps || {})) {
    C.steps[id] = v;
    const s = steps.get(id); if (!s) continue;
    Object.assign(s.title, v.title); Object.assign(s.text, v.text);
  }
  for (const j of JOURNEYS) if (c.journeys && c.journeys[j.id]) Object.assign(j.title, c.journeys[j.id]);
  for (const [id, v] of Object.entries(c.parts || {})) C.parts[id] = { ...(C.parts[id] || {}), ...v };
  for (const [k, v] of Object.entries(c.ui || {})) if (T[k]) Object.assign(T[k], v); else T[k] = v;
  for (const [k, v] of Object.entries(c.systems || {})) if (SYSTEMS[k]) Object.assign(SYSTEMS[k], v);
  C.audio = c.audio || {};
  C.loaded = true;
  return true;
}

export function partKey(id) { return C.parts[id] ? id : GROUP_ALIAS[id] && C.parts[GROUP_ALIAS[id]] ? GROUP_ALIAS[id] : id; }

// name / second name / job / detail of a part in the current language
export function partInfo(id, l) {
  const key = partKey(id); const p = C.parts[key]; if (!p) return null;
  // second name: Hindi under English and Hinglish, English under Hindi
  const alt = l === 'hi' ? pick(p.name, 'en') : pick(p.name, 'hi');
  return { id: key, name: pick(p.name, l), alt, job: pick(p.job, l), detail: pick(p.detail || p.job, l), process: pick(p.process || p.detail || p.job, l), hasProcess: !!p.process };
}

// is there a recorded narration file for this id in this language?
export function hasAudio(id, l) { const a = C.audio[id]; return !!(a && a.includes(l)); }
