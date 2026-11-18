// What DUET AR says and shows about a model and about a tapped part, in English (en), Hindi (hi) and Hinglish (hg).
// Human Body parts: the Human Body app's own names, jobs and recorded clips (info.json, made by devtools/ar/make_info.mjs).
// Space: the Solar System app's recorded clips. Maths solids and molecules: the names below. Everything else: the item.
// Narration: a recorded clip when there is one in that language; otherwise the device's own voice reads the text.
import { pick } from './i18n.js';

let INFO = null;
export async function loadInfo(base = location.href) {
  if (INFO) return INFO;
  try { INFO = await (await fetch(new URL('info.json', base))).json(); } catch (e) { INFO = { mesh: {}, parts: {}, steps: {} }; }
  return INFO;
}

const T = (en, hi, hg) => ({ en, hi, hg: hg || en });
// parts of the models made in code (js/procedural.js names its meshes like this)
const PROC = {
  'face:square': [T('Face: a square', 'फलक: एक वर्ग', 'Face: ek square'), T('A flat surface of the solid. All its sides are equal.', 'ठोस की समतल सतह। इसकी सभी भुजाएँ बराबर हैं।', 'Solid ki flat surface. Iski saari sides barabar hain.')],
  'face:rectangle': [T('Face: a rectangle', 'फलक: एक आयत', 'Face: ek rectangle'), T('A flat surface of the solid, with four right angles.', 'ठोस की समतल सतह, चार समकोणों वाली।', 'Solid ki flat surface, chaar right angles wali.')],
  'face:triangle': [T('Face: a triangle', 'फलक: एक त्रिभुज', 'Face: ek triangle'), T('A flat surface with three sides.', 'तीन भुजाओं वाली समतल सतह।', 'Teen sides wali flat surface.')],
  'face:hexagon': [T('Face: a hexagon', 'फलक: एक षट्भुज', 'Face: ek hexagon'), T('A flat surface with six sides.', 'छह भुजाओं वाली समतल सतह।', 'Chhe sides wali flat surface.')],
  'face:circle': [T('Flat face: a circle', 'समतल फलक: एक वृत्त', 'Flat face: ek circle'), T('A flat, round surface.', 'एक समतल, गोल सतह।', 'Ek flat, gol surface.')],
  'face:curved': [T('Curved surface', 'वक्र पृष्ठ', 'Curved surface'), T('A surface that bends; it is not flat anywhere.', 'मुड़ी हुई सतह; यह कहीं भी समतल नहीं है।', 'Mudi hui surface; yeh kahin bhi flat nahi hai.')],
  edge: [T('Edge', 'किनारा', 'Edge (kinaara)'), T('A line where two faces meet.', 'वह रेखा जहाँ दो फलक मिलते हैं।', 'Woh line jahan do faces milte hain.')],
  'edge:curved': [T('Curved edge', 'वक्र किनारा', 'Curved edge'), T('A round edge where a flat face meets the curved surface.', 'गोल किनारा, जहाँ समतल फलक वक्र पृष्ठ से मिलता है।', 'Gol edge, jahan flat face curved surface se milta hai.')],
  vertex: [T('Vertex (corner)', 'शीर्ष (कोना)', 'Vertex (kona)'), T('A corner where edges meet.', 'वह कोना जहाँ किनारे मिलते हैं।', 'Woh kona jahan edges milte hain.')],
  'vertex:apex': [T('Vertex: the apex', 'शीर्ष: सबसे ऊपर का बिंदु', 'Vertex: apex'), T('The pointed top of the cone.', 'शंकु का नुकीला ऊपरी सिरा।', 'Cone ka nukeela upar wala sira.')],
  'atom:H': [T('Hydrogen atom (H)', 'हाइड्रोजन परमाणु (H)', 'Hydrogen atom (H)'), T('The smallest and lightest atom. It makes one bond.', 'सबसे छोटा और हल्का परमाणु। यह एक आबंध बनाता है।', 'Sabse chhota aur halka atom. Yeh ek bond banata hai.')],
  'atom:C': [T('Carbon atom (C)', 'कार्बन परमाणु (C)', 'Carbon atom (C)'), T('Carbon makes four bonds; it is in every living thing.', 'कार्बन चार आबंध बनाता है; यह हर जीव में है।', 'Carbon chaar bond banata hai; yeh har living thing mein hai.')],
  'atom:N': [T('Nitrogen atom (N)', 'नाइट्रोजन परमाणु (N)', 'Nitrogen atom (N)'), T('Nitrogen makes three bonds. Most of the air is nitrogen.', 'नाइट्रोजन तीन आबंध बनाता है। हवा का अधिकांश भाग नाइट्रोजन है।', 'Nitrogen teen bond banata hai. Hawa ka zyadatar hissa nitrogen hai.')],
  'atom:O': [T('Oxygen atom (O)', 'ऑक्सीजन परमाणु (O)', 'Oxygen atom (O)'), T('Oxygen makes two bonds. We breathe it in.', 'ऑक्सीजन दो आबंध बनाता है। हम इसे साँस में लेते हैं।', 'Oxygen do bond banata hai. Hum ise saans mein lete hain.')],
  'atom:Na': [T('Sodium ion (Na⁺)', 'सोडियम आयन (Na⁺)', 'Sodium ion (Na⁺)'), T('A sodium atom that has given away one electron.', 'एक सोडियम परमाणु जिसने एक इलेक्ट्रॉन दे दिया है।', 'Ek sodium atom jisne ek electron de diya hai.')],
  'atom:Cl': [T('Chloride ion (Cl⁻)', 'क्लोराइड आयन (Cl⁻)', 'Chloride ion (Cl⁻)'), T('A chlorine atom that has taken one extra electron.', 'एक क्लोरीन परमाणु जिसने एक अतिरिक्त इलेक्ट्रॉन ले लिया है।', 'Ek chlorine atom jisne ek extra electron le liya hai.')],
  'bond:1': [T('Single bond', 'एकल आबंध', 'Single bond'), T('Two atoms share one pair of electrons.', 'दो परमाणु इलेक्ट्रॉनों का एक जोड़ा साझा करते हैं।', 'Do atoms electrons ka ek joda share karte hain.')],
  'bond:2': [T('Double bond', 'द्वि-आबंध', 'Double bond'), T('Two atoms share two pairs of electrons.', 'दो परमाणु इलेक्ट्रॉनों के दो जोड़े साझा करते हैं।', 'Do atoms electrons ke do jode share karte hain.')],
  'bond:ionic': [T('Ionic bond', 'आयनिक आबंध', 'Ionic bond'), T('Opposite charges hold the ions together.', 'विपरीत आवेश आयनों को आपस में बाँधे रखते हैं।', 'Opposite charges ions ko aapas mein baandhe rakhte hain.')],
};

const baseName = (n) => (n || '').replace(/_\d+$/, '');
/** the part a tapped mesh belongs to: {key, name, text (in lang), clip: url or null} or null (then say the item) */
export function partFor(item, mesh, lang) {
  if (!item || !mesh) return null;
  let o = mesh; while (o && !o.name) o = o.parent;
  if (item.parts === 'proc') {
    for (let x = mesh; x; x = x.parent) if (PROC[x.name]) { const [n, t] = PROC[x.name]; return { key: x.name, name: pick(n, lang), text: pick(t, lang), clip: null }; }
    return null;
  }
  if (!item.parts || !INFO) return null;
  for (let x = mesh; x; x = x.parent) {
    const b = baseName(x.name), id = INFO.mesh[b] || b, p = INFO.parts[id];
    if (!p) continue;
    if (item.ghost && b === item.ghost) return null;
    const L = p.clip.includes(lang) ? lang : lang === 'hg' && p.clip.includes('hi') ? 'hi' : null;   // Hinglish: the Hindi clip if there is no Hinglish one
    return { key: id, name: pick(p.name, lang), text: pick(p.job, lang), clip: L ? `../body/audio/${L}/part-${id}.mp3` : null };
  }
  return null;
}
/** the item's own narration: {clip: url or null, title, text} */
export function itemSay(item, lang) {
  const say = item.say || '', [src, id] = say.split(':');
  if (src === 'body') {
    const s = INFO && INFO.steps[id];
    return { clip: s && s.clip.includes(lang) ? `../body/audio/${lang}/${id}.mp3` : null, title: s ? pick(s.title, lang) : pick(item.name, lang), text: s ? pick(s.text, lang) : pick(item.about, lang) };
  }
  if (src === 'space') return { clip: `../space/audio/${lang}/${id}.mp3`, title: pick(item.name, lang), text: pick(item.about, lang) };
  if (src === 'ar') return { clip: lang === 'en' && item.voice !== false ? `voice/en/${id}.mp3` : null, title: pick(item.name, lang), text: pick(item.about, lang) };
  return { clip: null, title: pick(item.name, lang), text: pick(item.about, lang) };
}

// ---------------------------------------------------------------------------------------------- the voice
/** plays a clip; if there is none (or it fails), the device's voice reads the text in that language */
export class Narrator {
  constructor() { this.a = new Audio(); this.a.preload = 'auto'; this.tok = 0; this.onstate = null; this.playing = false; }
  stop() { this.tok++; try { this.a.pause(); } catch (e) { /* none */ } try { speechSynthesis.cancel(); } catch (e) { /* none */ } this._set(false); }
  _set(v) { this.playing = v; if (this.onstate) this.onstate(v); }
  async say(clip, text, lang) {
    this.stop(); const tok = this.tok; this._set(true);
    if (clip) {
      const ok = await new Promise((res) => {
        const a = this.a; a.onended = () => res(true); a.onerror = () => res(false);
        a.src = clip; a.currentTime = 0; const p = a.play(); if (p && p.catch) p.catch(() => res(false));
      });
      if (tok !== this.tok) return;
      if (ok) { this._set(false); return; }
    }
    if (tok !== this.tok) return;
    await this.speak(text, lang);
    if (tok === this.tok) this._set(false);
  }
  speak(text, lang) {
    return new Promise((res) => {
      try {
        if (!('speechSynthesis' in window) || !text) { res(); return; }
        const u = new SpeechSynthesisUtterance(text.replace(/[₀-₉]/g, (c) => String('₀₁₂₃₄₅₆₇₈₉'.indexOf(c))).replace(/[⁺⁻]/g, ''));
        const want = lang === 'en' ? 'en' : 'hi', vs = speechSynthesis.getVoices();
        const v = vs.find((x) => x.lang && x.lang.toLowerCase().startsWith(want === 'en' ? 'en-in' : 'hi')) || vs.find((x) => x.lang && x.lang.toLowerCase().startsWith(want));
        if (v) u.voice = v; u.lang = want === 'en' ? 'en-IN' : 'hi-IN'; u.rate = 0.95;
        u.onend = u.onerror = () => res(); speechSynthesis.speak(u);
        setTimeout(res, 30000);
      } catch (e) { res(); }
    });
  }
}
