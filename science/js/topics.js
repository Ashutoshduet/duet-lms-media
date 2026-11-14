// Topic-wise view: the same experiments grouped by what they are about (acids, metals, light …), across all classes.
// A topic comes from the chapter name; a few experiments (lab-manual and CBSE practicals, older-book activities) are placed by id.
import { EXPERIMENTS, subjOf, classOrder } from './experiments.js';

const N = (en, hi, hg) => ({ en, hi, hg });
export const TOPICS = {
  chemistry: [
    ['matter', N('Matter, water and solutions', 'पदार्थ, पानी और घोल', 'Matter, paani aur solutions'), /States of Water|Particulate|Solutes|Materials Around Us/],
    ['separate', N('Mixtures and their separation', 'मिश्रण और उन्हें अलग करना', 'Mixtures aur unko alag karna'), /Separation|Mixtures|Pure\?|Nature of Matter/],
    ['acid', N('Acids, bases and salts', 'एसिड, बेस और लवण', 'Acid, base aur salt'), /Acid/],
    ['metal', N('Metals and non-metals', 'धातु और अधातु', 'Metals aur non-metals'), /Metals/],
    ['react', N('Chemical reactions and changes', 'केमिकल रिएक्शन और बदलाव', 'Chemical reactions aur changes'), /Chemical Reactions|Changes|Atomic Foundations/],
    ['fire', N('Combustion and flame', 'दहन और लौ', 'Combustion aur flame'), /Combustion/],
    ['elec', N('Electricity and chemicals', 'बिजली और केमिकल', 'Bijli aur chemicals'), /Electric Current/],
    ['carbon', N('Carbon and its compounds', 'कार्बन और उसके यौगिक', 'Carbon aur uske compounds'), /Carbon/],
  ],
  physics: [
    ['measure', N('Measurement and motion', 'मापन और गति', 'Measurement aur motion'), /Measurement of (Length|Time)|Moving Things/],
    ['force', N('Force, pressure and energy', 'बल, दाब और ऊर्जा', 'Force, pressure aur energy'), /Forces|Pressure|Work, Energy/],
    ['magnet', N('Magnets and magnetism', 'चुंबक और चुंबकत्व', 'Magnets aur magnetism'), /Magnets|Magnetic Effects of Electric/],
    ['elec', N('Electricity and circuits', 'बिजली और सर्किट', 'Bijli aur circuits'), /Electric/],
    ['light', N('Light', 'प्रकाश', 'Light (prakash)'), /Light|Human Eye/],
    ['heat', N('Heat and temperature', 'गर्मी और तापमान', 'Heat aur temperature'), /Temperature|Heat/],
    ['sound', N('Sound', 'ध्वनि', 'Sound (dhwani)'), /Sound/],
    ['sky', N('Earth and sky', 'पृथ्वी और आकाश', 'Earth aur aasmaan'), /Earth, Moon|Skies/],
    ['matter', N('Materials and floating', 'पदार्थ और तैरना', 'Materials aur tairna'), /Materials|Solutes/],
  ],
  maths: [
    ['numbers', N('Numbers and patterns', 'संख्याएँ और पैटर्न', 'Numbers aur patterns'), /Square and A Cube|Number|Patterns|Power|Zero|Point|Fraction|Proportional|Integer|Decimal|Progression/],
    ['algebra', N('Algebra and identities', 'बीजगणित और सर्वसमिकाएँ', 'Algebra aur identities'), /Distribute|Algebraic|Identit|Polynomial|Equation/],
    ['geometry', N('Geometry: shapes, angles, symmetry', 'ज्यामिति: आकृतियाँ, कोण, सममिति', 'Geometry: shapes, angles, symmetry'), /Lines|Triangle|Pythagoras|Quadrilateral|Angles|Symmetry|Trigonometry|Coordinate|· Circles$/],
    ['mensuration', N('Area and volume', 'क्षेत्रफल और आयतन', 'Area aur volume'), /Area|Volume|Perimeter/],
    ['data', N('Data and probability', 'आँकड़े और प्रायिकता', 'Data aur probability'), /Probability|Data|Statistics/],
  ],
};
const OPEN = ['open', N('Open lab: try anything', 'ओपन लैब: कुछ भी करके देखिए', 'Open lab: kuch bhi try kijiye')];
const OTHER = ['other', N('More experiments', 'और प्रयोग', 'Aur experiments')];
// experiments whose chapter name does not say the topic (lab manual, CBSE practicals, older books) or that belong better elsewhere
const BY_ID = {
  electrolysis9v: 'elec', electrolysis10: 'elec', acid_conduct: 'elec', ionic_covalent: 'elec',
  candle_o2: 'fire', ignition: 'fire', mass_closed: 'react', mass_baso4: 'react', mp_bp: 'matter', five_changes: 'react',
  sand_salt_nh4cl: 'separate', colloid_s: 'separate', cbse_hcl_naoh: 'acid', co2_prep: 'acid', soda_id: 'acid', saponification: 'carbon',
  sugar_heat: 'react', limewater_air: 'react', tester_solids: 'elec',
  p9_archimedes: 'matter', p9_cooling: 'heat', p9_sound_reflection: 'sound', p8_ring_magnets: 'magnet',
};
export function topicOf(e) {
  if (e.id.startsWith('open_')) return 'open';
  if (e.topic) return e.topic; if (BY_ID[e.id]) return BY_ID[e.id];
  const ch = e.ch?.en || ''; for (const [k, , re] of TOPICS[subjOf(e)] || []) if (re.test(ch)) return k;
  return 'other';
}
// the free demo (no code): every open lab and the first experiment of each class, chemistry and physics
export function demoIds() {
  const s = new Set(EXPERIMENTS.filter((e) => e.id.startsWith('open_')).map((e) => e.id));
  for (const sub of ['chemistry', 'physics', 'maths']) for (const c of [6, 7, 8, 9, 10]) { const e = classOrder(c, sub).find((x) => !x.id.startsWith('open_') && x.cls === c); if (e) s.add(e.id); }
  return s;
}
// [{ k, n, items }] in a fixed topic order; inside a topic, experiments go by class and book order
export function topicGroups(sub) {
  const all = EXPERIMENTS.filter((e) => subjOf(e) === sub); const order = classOrder(0, sub);
  const defs = [...(TOPICS[sub] || []), OTHER, OPEN];
  return defs.map(([k, n]) => ({ k, n, items: order.filter((e) => all.includes(e) && topicOf(e) === k).sort((a, b) => a.cls - b.cls || order.indexOf(a) - order.indexOf(b)) })).filter((g) => g.items.length);
}
