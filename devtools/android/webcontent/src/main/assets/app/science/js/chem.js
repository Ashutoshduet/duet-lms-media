// Chemistry engine: what is in each vessel, its pH and colour, and the reactions that happen when
// substances meet (gas, precipitate, colour change, heat). Colours and behaviour follow school lab results.
import * as THREE from 'three';

const C = (h) => new THREE.Color(h);
// liquids / solutions. h = equivalents of acid (+) or base (-) per litre; pH = pH of the pure solution
export const SUBS = {
  water: { f: 'H₂O', n: { en: 'Water', hi: 'पानी', hg: 'Paani' }, c: '#dceeff', a: 0.16, pH: 7 },
  hcl: { f: 'HCl', n: { en: 'Dilute hydrochloric acid', hi: 'डाइल्यूट हाइड्रोक्लोरिक एसिड', hg: 'Dilute hydrochloric acid' }, c: '#e8f2ff', a: 0.18, h: 1, pH: 0.3 },
  h2so4: { f: 'H₂SO₄', n: { en: 'Dilute sulphuric acid', hi: 'डाइल्यूट सल्फ़्यूरिक एसिड', hg: 'Dilute sulphuric acid' }, c: '#eef3ff', a: 0.18, h: 2, pH: 0.2 },
  naoh: { f: 'NaOH', n: { en: 'Sodium hydroxide solution', hi: 'सोडियम हाइड्रॉक्साइड का घोल', hg: 'Sodium hydroxide solution' }, c: '#eef6ff', a: 0.18, h: -1, pH: 13.5 },
  vinegar: { f: 'CH₃COOH', n: { en: 'Vinegar (acetic acid)', hi: 'सिरका (एसीटिक एसिड)', hg: 'Sirka (acetic acid)' }, c: '#f6f1df', a: 0.2, h: 0.8, pH: 2.8, weak: true },
  lemon: { f: 'Lemon juice', n: { en: 'Lemon juice', hi: 'नींबू का रस', hg: 'Nimbu ka ras' }, c: '#f1ea9e', a: 0.42, h: 0.9, pH: 2.3, weak: true, cloud: 0.18, cloudC: '#f7f1c8' },
  soap: { f: 'Soap solution', n: { en: 'Soap solution', hi: 'साबुन का घोल', hg: 'Saabun ka ghol' }, c: '#eef0ee', a: 0.45, h: -0.02, pH: 10, weak: true, cloud: 0.32, cloudC: '#f4f5f2' },
  bakingsoda: { f: 'NaHCO₃', n: { en: 'Baking soda solution', hi: 'खाने के सोडे का घोल', hg: 'Baking soda solution' }, c: '#f2f6fa', a: 0.2, h: -0.05, pH: 8.3, weak: true },
  washingsoda: { f: 'Na₂CO₃', n: { en: 'Washing soda solution', hi: 'वॉशिंग सोडा का घोल', hg: 'Washing soda solution' }, c: '#f2f6fa', a: 0.2, h: -0.3, pH: 11.5, weak: true },
  milkmag: { f: 'Mg(OH)₂', n: { en: 'Milk of magnesia', hi: 'मिल्क ऑफ़ मैग्नेशिया', hg: 'Milk of magnesia' }, c: '#f7f7f4', a: 0.6, h: -0.2, pH: 10.5, weak: true, cloud: 0.85, cloudC: '#f8f8f5' },
  limewater: { f: 'Ca(OH)₂', n: { en: 'Lime water', hi: 'चूने का पानी (लाइम वॉटर)', hg: 'Lime water' }, c: '#f2f6fa', a: 0.18, h: -0.04, pH: 12.4, weak: true },
  cuso4: { f: 'CuSO₄', n: { en: 'Copper sulphate solution', hi: 'कॉपर सल्फ़ेट का घोल', hg: 'Copper sulphate solution' }, c: '#1f7fe0', a: 0.62, pH: 4.2, weak: true, h: 0.002, tint: 4 },
  feso4: { f: 'FeSO₄', n: { en: 'Ferrous sulphate solution', hi: 'फ़ेरस सल्फ़ेट का घोल', hg: 'Ferrous sulphate solution' }, c: '#a8d29a', a: 0.38, pH: 4, weak: true, h: 0.002 },
  znso4: { f: 'ZnSO₄', n: { en: 'Zinc sulphate solution', hi: 'ज़िंक सल्फ़ेट का घोल', hg: 'Zinc sulphate solution' }, c: '#eef4fa', a: 0.18, pH: 5, weak: true, h: 0.001 },
  zncl2: { f: 'ZnCl₂', n: { en: 'Zinc chloride solution', hi: 'ज़िंक क्लोराइड का घोल', hg: 'Zinc chloride solution' }, c: '#eef4fa', a: 0.18, pH: 5, weak: true },
  fecl2: { f: 'FeCl₂', n: { en: 'Iron(II) chloride solution', hi: 'फ़ेरस क्लोराइड का घोल', hg: 'Ferrous chloride solution' }, c: '#cfe5bf', a: 0.3, pH: 4, weak: true },
  mgcl2: { f: 'MgCl₂', n: { en: 'Magnesium chloride solution', hi: 'मैग्नीशियम क्लोराइड का घोल', hg: 'Magnesium chloride solution' }, c: '#eef4fa', a: 0.18, pH: 6.5, weak: true },
  nacl: { f: 'NaCl', n: { en: 'Salt solution', hi: 'नमक का घोल', hg: 'Namak ka ghol' }, c: '#e6f1fb', a: 0.17, pH: 7 },
  pbno3: { f: 'Pb(NO₃)₂', n: { en: 'Lead nitrate solution', hi: 'लेड नाइट्रेट का घोल', hg: 'Lead nitrate solution' }, c: '#eef4fa', a: 0.18, pH: 4.5, weak: true },
  ki: { f: 'KI', n: { en: 'Potassium iodide solution', hi: 'पोटैशियम आयोडाइड का घोल', hg: 'Potassium iodide solution' }, c: '#f2f6f8', a: 0.18, pH: 7 },
  kno3: { f: 'KNO₃', n: { en: 'Potassium nitrate solution', hi: 'पोटैशियम नाइट्रेट का घोल', hg: 'Potassium nitrate solution' }, c: '#eef4fa', a: 0.17, pH: 7 },
  bacl2: { f: 'BaCl₂', n: { en: 'Barium chloride solution', hi: 'बेरियम क्लोराइड का घोल', hg: 'Barium chloride solution' }, c: '#eef4fa', a: 0.18, pH: 7 },
  na2so4: { f: 'Na₂SO₄', n: { en: 'Sodium sulphate solution', hi: 'सोडियम सल्फ़ेट का घोल', hg: 'Sodium sulphate solution' }, c: '#eef4fa', a: 0.18, pH: 7 },
  agno3: { f: 'AgNO₃', n: { en: 'Silver nitrate solution', hi: 'सिल्वर नाइट्रेट का घोल', hg: 'Silver nitrate solution' }, c: '#f2f5f8', a: 0.18, pH: 6 },
  oil: { f: 'Oil', n: { en: 'Oil layer', hi: 'तेल की परत', hg: 'Tel ki layer' }, c: '#e9c86a', a: 0.4, pH: 7, float: true },
  sugar: { f: 'C₁₂H₂₂O₁₁', n: { en: 'Sugar solution', hi: 'चीनी का घोल', hg: 'Cheeni ka ghol' }, c: '#f2f6f8', a: 0.17, pH: 7 },
  milk: { f: 'Milk + water', n: { en: 'Dilute milk (colloid)', hi: 'पतला दूध (कोलॉइड)', hg: 'Patla doodh (colloid)' }, c: '#eef2f7', a: 0.5, pH: 6.7, cloud: 0.42, cloudC: '#eef2f8', colloid: true },
  kmno4: { f: 'KMnO₄', n: { en: 'Potassium permanganate (dissolved)', hi: 'पोटैशियम परमैंगनेट (घुला हुआ)', hg: 'Potassium permanganate (ghula hua)' }, c: '#9b2fae', a: 0.8, pH: 7, dye: 900 },
  h2so4c: { f: 'H₂SO₄ (conc.)', n: { en: 'Concentrated sulphuric acid', hi: 'कंसन्ट्रेटेड सल्फ़्यूरिक एसिड', hg: 'Concentrated sulphuric acid' }, c: '#f4f1e6', a: 0.22, h: 6, pH: 0 },
  // batch 3: household samples, spirit, sulphurous acid
  amla: { f: 'Amla juice', n: { en: 'Amla juice', hi: 'आँवले का रस', hg: 'Amla ka ras' }, c: '#e9eec8', a: 0.35, h: 0.25, pH: 2.8, weak: true, cloud: 0.2, cloudC: '#eef2d2' },
  tamarind: { f: 'Tamarind water', n: { en: 'Tamarind water', hi: 'इमली का पानी', hg: 'Imli ka paani' }, c: '#8a5a2a', a: 0.55, h: 0.2, pH: 3, weak: true, cloud: 0.22, cloudC: '#9a6a3a' },
  washpowder: { f: 'Washing powder solution', n: { en: 'Washing powder solution', hi: 'वॉशिंग पाउडर का घोल', hg: 'Washing powder ka ghol' }, c: '#eef2f6', a: 0.4, h: -0.08, pH: 10.5, weak: true, cloud: 0.3, cloudC: '#f2f4f6' },
  tapwater: { f: 'Tap water', n: { en: 'Tap water', hi: 'नल का पानी', hg: 'Nal ka paani' }, c: '#dceeff', a: 0.16, pH: 7.1 },
  spirit: { f: 'C₂H₅OH', n: { en: 'Spirit (alcohol)', hi: 'स्पिरिट (अल्कोहल)', hg: 'Spirit (alcohol)' }, c: '#e8f4ff', a: 0.14, pH: 7, volatile: 8 },
  so2aq: { f: 'H₂SO₃', n: { en: 'Sulphurous acid (sulphur dioxide in water)', hi: 'सल्फ़्यूरस एसिड (पानी में घुली सल्फ़र डाइऑक्साइड)', hg: 'Sulphurous acid (paani mein SO₂)' }, c: '#eef3f8', a: 0.17, h: 0.2, pH: 2.2, weak: true },
  // batch 4: non-electrolytes and a non-polar solvent
  glucose: { f: 'C₆H₁₂O₆', n: { en: 'Glucose solution', hi: 'ग्लूकोज़ का घोल', hg: 'Glucose solution' }, c: '#f2f6f8', a: 0.17, pH: 7 },
  alcohol: { f: 'C₂H₅OH', n: { en: 'Alcohol solution', hi: 'अल्कोहल का घोल', hg: 'Alcohol solution' }, c: '#eef6ff', a: 0.15, pH: 7 },
  kerosene: { f: 'Kerosene', n: { en: 'Kerosene', hi: 'मिट्टी का तेल (केरोसिन)', hg: 'Kerosene (mitti ka tel)' }, c: '#efe3b8', a: 0.22, pH: 7 },
  // batch 5
  thio: { f: 'Na₂S₂O₃', n: { en: 'Sodium thiosulphate solution', hi: 'सोडियम थायोसल्फ़ेट का घोल', hg: 'Sodium thiosulphate solution' }, c: '#eef4fa', a: 0.17, pH: 7 },
  ink: { f: 'Ink', n: { en: 'Blue ink', hi: 'नीली स्याही', hg: 'Blue ink' }, c: '#1d3d9a', a: 0.85, pH: 7, dye: 60 },
  acetone: { f: 'CH₃COCH₃', n: { en: 'Acetone', hi: 'एसीटोन', hg: 'Acetone' }, c: '#eef6ff', a: 0.14, pH: 7, volatile: 6 },
  milkfull: { f: 'Milk', n: { en: 'Full-cream milk', hi: 'फ़ुल क्रीम दूध', hg: 'Full-cream doodh' }, c: '#f7f4ec', a: 0.9, pH: 6.7, cloud: 0.95, cloudC: '#fbf8ef' },
  skim: { f: 'Skimmed milk', n: { en: 'Skimmed milk', hi: 'मलाई निकला दूध', hg: 'Skimmed milk' }, c: '#dfe8f0', a: 0.6, pH: 6.7, cloud: 0.6, cloudC: '#dbe6f0' },
  moil: { f: 'Mustard oil', n: { en: 'Mustard oil', hi: 'सरसों का तेल', hg: 'Sarson ka tel' }, c: '#d9b23a', a: 0.6, pH: 7, float: true },
  // batch 6 (Class 10)
  cucl2: { f: 'CuCl₂', n: { en: 'Copper(II) chloride solution', hi: 'कॉपर(II) क्लोराइड का घोल', hg: 'Copper(II) chloride solution' }, c: '#1f9c86', a: 1.4, pH: 4, weak: true, h: 0.002, tint: 3 },
  ethanol: { f: 'C₂H₅OH', n: { en: 'Ethanol', hi: 'एथेनॉल', hg: 'Ethanol' }, c: '#eef6ff', a: 0.14, pH: 7, volatile: 5 },
  ethanoic: { f: 'CH₃COOH', n: { en: 'Dilute ethanoic acid', hi: 'डाइल्यूट एथेनॉइक एसिड', hg: 'Dilute ethanoic acid' }, c: '#f2f5f2', a: 0.16, h: 0.1, pH: 2.9, weak: true },
  glacial: { f: 'CH₃COOH (glacial)', n: { en: 'Glacial ethanoic acid', hi: 'ग्लेशियल एथेनॉइक एसिड', hg: 'Glacial ethanoic acid' }, c: '#f4f6f2', a: 0.16, h: 0.5, pH: 2.4, weak: true },
  ester: { f: 'CH₃COOC₂H₅', n: { en: 'Ethyl ethanoate (an ester)', hi: 'एथिल एथेनोएट (एक एस्टर)', hg: 'Ethyl ethanoate (ester)' }, c: '#f2f6f8', a: 0.15, pH: 7, float: true },
  kmno4alk: { f: 'KMnO₄ + NaOH', n: { en: 'Alkaline potassium permanganate', hi: 'एल्कलाइन पोटैशियम परमैंगनेट', hg: 'Alkaline potassium permanganate' }, c: '#7a1f8f', a: 0.8, pH: 12, weak: true, h: -0.05, dye: 250 },
  vanilla: { f: 'Vanilla essence', n: { en: 'Vanilla essence', hi: 'वनीला एसेंस', hg: 'Vanilla essence' }, c: '#5a3418', a: 0.7, pH: 7, dye: 6 },
  clove: { f: 'Clove oil', n: { en: 'Clove oil', hi: 'लौंग का तेल', hg: 'Laung ka tel (clove oil)' }, c: '#c9a24a', a: 0.5, pH: 7, dye: 5 },
  hardwater: { f: 'Hard water (Ca²⁺, Mg²⁺)', n: { en: 'Hard water', hi: 'हार्ड वॉटर (कठोर जल)', hg: 'Hard water' }, c: '#dceeff', a: 0.16, pH: 7.3 },
  detergent: { f: 'Detergent solution', n: { en: 'Detergent solution', hi: 'डिटर्जेंट का घोल', hg: 'Detergent ka ghol' }, c: '#e9f0f5', a: 0.3, h: -0.005, pH: 8, weak: true, cloud: 0.12, cloudC: '#f2f5f7' },
  castor: { f: 'Castor oil', n: { en: 'Castor oil', hi: 'अरंडी का तेल', hg: 'Arandi ka tel (castor oil)' }, c: '#efe2a8', a: 0.55, pH: 7, float: true },
  naoh20: { f: 'NaOH (20%)', n: { en: '20% sodium hydroxide solution', hi: '20% सोडियम हाइड्रॉक्साइड का घोल', hg: '20% sodium hydroxide solution' }, c: '#eef6ff', a: 0.2, h: -5, pH: 14 },
  soapmix: { f: 'Soap + glycerol', n: { en: 'Soap mixture (soap and glycerol)', hi: 'साबुन का मिश्रण (साबुन और ग्लिसरॉल)', hg: 'Saabun ka mixture (saabun aur glycerol)' }, c: '#f3ead0', a: 0.9, pH: 10, weak: true, h: -0.02, cloud: 0.92, cloudC: '#f5edd4' },
  lye: { f: 'Glycerol + salt + NaOH', n: { en: 'Liquid left below the soap (glycerol, salt, alkali)', hi: 'साबुन के नीचे बचा द्रव (ग्लिसरॉल, नमक, क्षार)', hg: 'Saabun ke neeche bacha liquid' }, c: '#efe8cc', a: 0.3, h: -1, pH: 13, cloud: 0.18, cloudC: '#f2ecd6' },
  // salts that form when an acid and a base neutralise each other, or a precipitate dissolves in an acid
  cacl2aq: { f: 'CaCl₂', n: { en: 'Calcium chloride solution', hi: 'कैल्शियम क्लोराइड का घोल', hg: 'Calcium chloride solution' }, c: '#eef4fa', a: 0.17, pH: 7 },
  caso4aq: { f: 'CaSO₄', n: { en: 'Calcium sulphate solution', hi: 'कैल्शियम सल्फ़ेट का घोल', hg: 'Calcium sulphate solution' }, c: '#eef4fa', a: 0.17, pH: 7 },
  mgso4aq: { f: 'MgSO₄', n: { en: 'Magnesium sulphate solution', hi: 'मैग्नीशियम सल्फ़ेट का घोल', hg: 'Magnesium sulphate solution' }, c: '#eef4fa', a: 0.17, pH: 7 },
  naac: { f: 'CH₃COONa', n: { en: 'Sodium ethanoate solution', hi: 'सोडियम एथेनोएट का घोल', hg: 'Sodium ethanoate solution' }, c: '#eef4fa', a: 0.17, pH: 8.4, weak: true },
  nano3: { f: 'NaNO₃', n: { en: 'Sodium nitrate solution', hi: 'सोडियम नाइट्रेट का घोल', hg: 'Sodium nitrate solution' }, c: '#eef4fa', a: 0.17, pH: 7 },
  fecl3: { f: 'FeCl₃', n: { en: 'Iron(III) chloride solution', hi: 'फ़ेरिक क्लोराइड का घोल', hg: 'Ferric chloride solution' }, c: '#c99a3a', a: 0.5, pH: 2.5, weak: true, h: 0.002, tint: 2 },
  fe2so43: { f: 'Fe₂(SO₄)₃', n: { en: 'Iron(III) sulphate solution', hi: 'फ़ेरिक सल्फ़ेट का घोल', hg: 'Ferric sulphate solution' }, c: '#d0a84e', a: 0.45, pH: 2.5, weak: true, h: 0.002, tint: 2 },
  zincate: { f: 'Na₂ZnO₂', n: { en: 'Sodium zincate solution', hi: 'सोडियम ज़िंकेट का घोल', hg: 'Sodium zincate solution' }, c: '#eef4fa', a: 0.17, pH: 12, weak: true },
  saltaq: { f: 'Salt solution', n: { en: 'Salt solution (made by neutralisation)', hi: 'लवण का घोल (न्यूट्रलाइज़ेशन से बना)', hg: 'Salt ka solution (neutralisation se bana)' }, c: '#eef4fa', a: 0.17, pH: 7 },
  // indicators (strong colour, small amounts)
  phenol: { f: 'Phenolphthalein', n: { en: 'Phenolphthalein', hi: 'फ़ीनॉलफ़्थेलिन', hg: 'Phenolphthalein' }, c: '#f8f8f8', a: 0.12, ind: 'phenol' },
  methylorange: { f: 'Methyl orange', n: { en: 'Methyl orange', hi: 'मेथिल ऑरेंज', hg: 'Methyl orange' }, c: '#f08a24', a: 0.8, ind: 'mo' },
  litmus: { f: 'Litmus', n: { en: 'Litmus solution', hi: 'लिटमस का घोल', hg: 'Litmus solution' }, c: '#7a4f9a', a: 0.8, ind: 'litmus' },
  redlitmus: { f: 'Red litmus', n: { en: 'Red litmus solution', hi: 'लाल लिटमस का घोल', hg: 'Red litmus solution' }, c: '#c8404a', a: 0.8, ind: 'litmus', pHself: 3 },
  bluelitmus: { f: 'Blue litmus', n: { en: 'Blue litmus solution', hi: 'नीले लिटमस का घोल', hg: 'Blue litmus solution' }, c: '#3a5fc6', a: 0.8, ind: 'litmus', pHself: 9 },
  universal: { f: 'Universal indicator', n: { en: 'Universal indicator', hi: 'यूनिवर्सल इंडिकेटर', hg: 'Universal indicator' }, c: '#3e9d4a', a: 0.8, ind: 'ui' },
  turmeric: { f: 'Turmeric', n: { en: 'Turmeric solution', hi: 'हल्दी का घोल', hg: 'Haldi ka ghol' }, c: '#e8b422', a: 0.75, ind: 'turmeric' },
  chinarose: { f: 'China rose', n: { en: 'China rose indicator', hi: 'गुड़हल का इंडिकेटर', hg: 'China rose (gudhal) indicator' }, c: '#c8507a', a: 0.7, ind: 'chinarose' },
  rose: { f: 'Red rose extract', n: { en: 'Red rose extract (indicator)', hi: 'लाल गुलाब का अर्क (इंडिकेटर)', hg: 'Laal gulaab ka ark (indicator)' }, c: '#b3446c', a: 0.72, ind: 'rose' },
};
// how well each liquid carries an electric current (ions per volume, relative): pure water, sugar, glucose, alcohol and kerosene have
// no ions; weak acids (lemon, vinegar) only a few; strong acids, bases and salts many. Tap water has a few dissolved salts.
const ION = { hcl: 2.5, h2so4: 3, h2so4c: 0.6, naoh: 2.2, nacl: 3, kno3: 1.8, ki: 1.8, bacl2: 1.8, na2so4: 1.8, agno3: 1.5, pbno3: 1.5, cuso4: 1.6, feso4: 1.2, znso4: 1.2,
  zncl2: 1.4, fecl2: 1.2, mgcl2: 1.5, washingsoda: 1.2, bakingsoda: 0.5, limewater: 0.35, soap: 0.15, milkmag: 0.05, vinegar: 0.05, lemon: 0.07, amla: 0.04, tamarind: 0.05,
  so2aq: 0.08, tapwater: 0.012, milk: 0.04, cucl2: 1.6, ethanoic: 0.05, glacial: 0.01, kmno4alk: 1, hardwater: 0.05, detergent: 0.3, naoh20: 3, lye: 2.5,
  cacl2aq: 2.5, caso4aq: 1, mgso4aq: 1.6, naac: 1.4, nano3: 1.8, fecl3: 2, fe2so43: 2, zincate: 1.6, saltaq: 1.5 };
export function conductance(mix) { const tot = mix.ml(); if (tot <= 0.05) return 0; let g = 0; for (const k in mix.liq) g += (ION[k] || 0) * mix.liq[k]; return g / tot; }
// precipitates
export const PPT = {
  baso4: { f: 'BaSO₄', c: '#f6f6f2', n: { en: 'white precipitate of barium sulphate', hi: 'बेरियम सल्फ़ेट का सफ़ेद ठोस (अवक्षेप)', hg: 'barium sulphate ka safed precipitate' } },
  pbi2: { f: 'PbI₂', c: '#f2cd20', n: { en: 'yellow precipitate of lead iodide', hi: 'लेड आयोडाइड का पीला ठोस (अवक्षेप)', hg: 'lead iodide ka peela precipitate' } },
  caco3: { f: 'CaCO₃', c: '#f7f7f4', n: { en: 'white calcium carbonate (milkiness)', hi: 'सफ़ेद कैल्शियम कार्बोनेट (दूधियापन)', hg: 'safed calcium carbonate (doodhiyapan)' } },
  agcl: { f: 'AgCl', c: '#f2f2ee', n: { en: 'white curdy precipitate of silver chloride', hi: 'सिल्वर क्लोराइड का सफ़ेद, दही जैसा ठोस (अवक्षेप)', hg: 'silver chloride ka safed, dahi jaisa precipitate' } },
  cuoh2: { f: 'Cu(OH)₂', c: '#79b4ea', n: { en: 'pale blue precipitate of copper hydroxide', hi: 'कॉपर हाइड्रॉक्साइड का हल्का नीला ठोस (अवक्षेप)', hg: 'copper hydroxide ka halka neela precipitate' } },
  chalk: { f: 'CaCO₃', c: '#eeece6', settle: 0.035, n: { en: 'chalk powder (not dissolved)', hi: 'चॉक पाउडर (घुला नहीं)', hg: 'chalk powder (ghula nahi)' } },
  sand: { f: 'SiO₂', c: '#c2a878', settle: 1.4, n: { en: 'sand (settled at the bottom)', hi: 'रेत (नीचे बैठ गई)', hg: 'ret (neeche baith gayi)' } },
  caoh2: { f: 'Ca(OH)₂', c: '#f6f5f0', n: { en: 'slaked lime (milky)', hi: 'बुझा हुआ चूना (दूधिया)', hg: 'slaked lime (doodhiya)' } },
  mud: { f: 'Mud', c: '#7a5a35', n: { en: 'mud (sand and soil particles)', hi: 'कीचड़ (रेत और मिट्टी के कण)', hg: 'keechad (ret aur mitti ke kan)' } },
  scol: { f: 'S', c: '#f3ecbf', colloid: true, settle: 0.00002, n: { en: 'colloidal sulphur (it does not settle)', hi: 'कोलॉइडल सल्फ़र (नीचे नहीं बैठता)', hg: 'colloidal sulphur (neeche nahi baithta)' } },
  mno2: { f: 'MnO₂', c: '#5b3a1e', settle: 0.012, n: { en: 'brown precipitate of manganese dioxide', hi: 'मैंगनीज़ डाइऑक्साइड का भूरा ठोस (अवक्षेप)', hg: 'manganese dioxide ka bhoora precipitate' } },
  scum: { f: '(C₁₇H₃₅COO)₂Ca', c: '#efece4', settle: 0.004, n: { en: 'white curdy scum (calcium and magnesium soap)', hi: 'सफ़ेद, दही जैसा मैल (कैल्शियम और मैग्नीशियम वाला साबुन)', hg: 'safed, dahi jaisa scum (calcium/magnesium saabun)' } },
  slush: { f: 'Ba(OH)₂ + NH₄Cl', c: '#f2f2ee', settle: 0, n: { en: 'wet white slush of crystals', hi: 'गीले सफ़ेद क्रिस्टलों का गाढ़ा मिश्रण', hg: 'crystals ka geela safed slush' } },
  clay: { f: 'Clay', c: '#9a7b52', n: { en: 'fine clay particles', hi: 'मिट्टी के बारीक कण', hg: 'mitti ke baareek kan' } },
  // precipitates of free mixing (whatever a student pours together)
  cuo: { f: 'CuO', c: '#1f1d1c', settle: 0.03, n: { en: 'black copper oxide (the copper hydroxide turned black when hot)', hi: 'काला कॉपर ऑक्साइड (गरम होने पर कॉपर हाइड्रॉक्साइड काला हो गया)', hg: 'kaala copper oxide (garam hone par copper hydroxide kaala ho gaya)' } },
  feoh2: { f: 'Fe(OH)₂', c: '#6f8a5a', n: { en: 'dirty green precipitate of iron(II) hydroxide', hi: 'आयरन(II) हाइड्रॉक्साइड का मटमैला हरा ठोस (अवक्षेप)', hg: 'iron(II) hydroxide ka matmaila hara precipitate' } },
  feoh3: { f: 'Fe(OH)₃', c: '#8a4a1e', n: { en: 'reddish-brown precipitate of iron(III) hydroxide', hi: 'आयरन(III) हाइड्रॉक्साइड का लाल-भूरा ठोस (अवक्षेप)', hg: 'iron(III) hydroxide ka laal-bhoora precipitate' } },
  znoh2: { f: 'Zn(OH)₂', c: '#f4f4f0', n: { en: 'white jelly-like precipitate of zinc hydroxide', hi: 'ज़िंक हाइड्रॉक्साइड का सफ़ेद, जेली जैसा ठोस (अवक्षेप)', hg: 'zinc hydroxide ka safed, jelly jaisa precipitate' } },
  mgoh2: { f: 'Mg(OH)₂', c: '#f6f6f3', n: { en: 'white precipitate of magnesium hydroxide', hi: 'मैग्नीशियम हाइड्रॉक्साइड का सफ़ेद ठोस (अवक्षेप)', hg: 'magnesium hydroxide ka safed precipitate' } },
  pbcl2: { f: 'PbCl₂', c: '#f6f6f2', n: { en: 'white precipitate of lead chloride', hi: 'लेड क्लोराइड का सफ़ेद ठोस (अवक्षेप)', hg: 'lead chloride ka safed precipitate' } },
  pbso4: { f: 'PbSO₄', c: '#f7f7f4', n: { en: 'white precipitate of lead sulphate', hi: 'लेड सल्फ़ेट का सफ़ेद ठोस (अवक्षेप)', hg: 'lead sulphate ka safed precipitate' } },
  pboh2: { f: 'Pb(OH)₂', c: '#f4f4f0', n: { en: 'white precipitate of lead hydroxide', hi: 'लेड हाइड्रॉक्साइड का सफ़ेद ठोस (अवक्षेप)', hg: 'lead hydroxide ka safed precipitate' } },
  agoh: { f: 'Ag₂O', c: '#5a4532', n: { en: 'brown precipitate of silver oxide', hi: 'सिल्वर ऑक्साइड का भूरा ठोस (अवक्षेप)', hg: 'silver oxide ka bhoora precipitate' } },
  cuco3: { f: 'CuCO₃', c: '#5fae9c', n: { en: 'blue-green precipitate of copper carbonate', hi: 'कॉपर कार्बोनेट का नीला-हरा ठोस (अवक्षेप)', hg: 'copper carbonate ka neela-hara precipitate' } },
  baco3: { f: 'BaCO₃', c: '#f6f6f2', n: { en: 'white precipitate of barium carbonate', hi: 'बेरियम कार्बोनेट का सफ़ेद ठोस (अवक्षेप)', hg: 'barium carbonate ka safed precipitate' } },
};
// ------------------------------------------------------------------ free mixing: what really happens when solutions meet
// double displacement: [a, b, precipitate, salt, a used, b used, precipitate made, salt made, extra water] per unit of reaction.
// The first five are the book reactions (kept exactly as they were); lime water is dilute, so much of it gives a little precipitate.
export const PAIRS = [
  ['bacl2', 'na2so4', 'baso4', 'nacl'], ['pbno3', 'ki', 'pbi2', 'kno3'], ['agno3', 'nacl', 'agcl', 'kno3'], ['agno3', 'hcl', 'agcl', 'kno3'], ['cuso4', 'naoh', 'cuoh2', 'na2so4'],
  ['cucl2', 'naoh', 'cuoh2', 'nacl'], ['feso4', 'naoh', 'feoh2', 'na2so4'], ['fecl2', 'naoh', 'feoh2', 'nacl'], ['fecl3', 'naoh', 'feoh3', 'nacl'], ['fe2so43', 'naoh', 'feoh3', 'na2so4'],
  ['znso4', 'naoh', 'znoh2', 'na2so4'], ['zncl2', 'naoh', 'znoh2', 'nacl'], ['mgcl2', 'naoh', 'mgoh2', 'nacl'], ['mgso4aq', 'naoh', 'mgoh2', 'na2so4'], ['agno3', 'naoh', 'agoh', 'nano3'], ['pbno3', 'naoh', 'pboh2', 'nano3'],
  ['cuso4', 'limewater', 'cuoh2', 'caso4aq', 0.04, 1, 0.1, 1], ['cucl2', 'limewater', 'cuoh2', 'cacl2aq', 0.04, 1, 0.1, 1], ['feso4', 'limewater', 'feoh2', 'caso4aq', 0.04, 1, 0.1, 1],
  ['znso4', 'limewater', 'znoh2', 'caso4aq', 0.04, 1, 0.1, 1], ['mgcl2', 'limewater', 'mgoh2', 'cacl2aq', 0.04, 1, 0.1, 1], ['washingsoda', 'limewater', 'caco3', 'naoh', 0.13, 1, 0.1, 1],
  ['bacl2', 'h2so4', 'baso4', 'hcl', 1, 0.5, 1, 1, 0.5], ['bacl2', 'cuso4', 'baso4', 'cucl2', 1, 1, 1, 1.6], ['bacl2', 'znso4', 'baso4', 'zncl2', 1, 1, 1, 1.6], ['bacl2', 'feso4', 'baso4', 'fecl2', 1, 1, 1, 1.6],
  ['bacl2', 'mgso4aq', 'baso4', 'mgcl2', 1, 1, 1, 1.6], ['bacl2', 'caso4aq', 'baso4', 'cacl2aq', 1, 1, 1, 1.6], ['bacl2', 'washingsoda', 'baco3', 'nacl', 1, 1, 1, 1.6],
  ['agno3', 'bacl2', 'agcl', 'saltaq', 1, 1, 1, 1.6], ['agno3', 'cacl2aq', 'agcl', 'saltaq', 1, 1, 1, 1.6], ['agno3', 'mgcl2', 'agcl', 'saltaq', 1, 1, 1, 1.6], ['agno3', 'zncl2', 'agcl', 'saltaq', 1, 1, 1, 1.6], ['agno3', 'fecl2', 'agcl', 'saltaq', 1, 1, 1, 1.6],
  ['pbno3', 'nacl', 'pbcl2', 'nano3', 1, 1, 1, 1.6], ['pbno3', 'na2so4', 'pbso4', 'nano3', 1, 1, 1, 1.6],
  ['washingsoda', 'cacl2aq', 'caco3', 'nacl', 1, 1, 1, 1.6], ['washingsoda', 'hardwater', 'caco3', 'saltaq', 0.02, 1, 0.05, 0.02, 1], ['washingsoda', 'cuso4', 'cuco3', 'na2so4', 1, 1, 1, 1.6],
];
// an acid and a base: which salt they make (the base's metal + the acid's part)
export const NEUT_A = { hcl: 'Cl', h2so4: 'SO4', h2so4c: 'SO4', vinegar: 'Ac', ethanoic: 'Ac', glacial: 'Ac', lemon: 'Org', amla: 'Org', tamarind: 'Org', so2aq: 'SO3' };
export const NEUT_B = { naoh: 'Na', naoh20: 'Na', limewater: 'Ca', milkmag: 'Mg' };
const NEUT_S = { NaCl: 'nacl', NaSO4: 'na2so4', NaAc: 'naac', CaCl: 'cacl2aq', CaSO4: 'caso4aq', MgCl: 'mgcl2', MgSO4: 'mgso4aq' };
// precipitates an acid dissolves (hydroxides and oxides give a salt; carbonates also fizz with carbon dioxide)
const PPT_ACID = {
  cuoh2: { Cl: 'cucl2', SO4: 'cuso4' }, cuo: { Cl: 'cucl2', SO4: 'cuso4', slow: 0.3 }, caoh2: { Cl: 'cacl2aq', SO4: 'caso4aq' }, mgoh2: { Cl: 'mgcl2', SO4: 'mgso4aq' },
  znoh2: { Cl: 'zncl2', SO4: 'znso4' }, feoh2: { Cl: 'fecl2', SO4: 'feso4' }, feoh3: { Cl: 'fecl3', SO4: 'fe2so43' }, pboh2: { Cl: 'pbcl2!', SO4: 'pbso4!' }, agoh: { Cl: 'agcl!' },
  caco3: { Cl: 'cacl2aq', SO4: 'caso4aq', Ac: 'saltaq', Org: 'saltaq', co2: 1 }, chalk: { Cl: 'cacl2aq', SO4: 'caso4aq', Ac: 'saltaq', Org: 'saltaq', co2: 1, slow: 0.5 },
  cuco3: { Cl: 'cucl2', SO4: 'cuso4', co2: 1 }, baco3: { Cl: 'bacl2', SO4: 'baso4!', co2: 1 },
};
const PPT_ACIDS = ['hcl', 'h2so4', 'vinegar', 'ethanoic', 'lemon'];
// solids that can be put into vessels
export const SOLIDS = {
  zn: { f: 'Zn', n: { en: 'Zinc granules', hi: 'ज़िंक के दाने', hg: 'Zinc granules' }, color: 0xb4b6b2, tex: 'zngran', metal: 0.75, react: 1 },
  mg: { f: 'Mg', n: { en: 'Magnesium ribbon', hi: 'मैग्नीशियम रिबन', hg: 'Magnesium ribbon' }, color: 0xc9ccd0, react: 3 },
  fe: { f: 'Fe', n: { en: 'Iron', hi: 'लोहा', hg: 'Iron (loha)' }, color: 0x8d9196, react: 0.35 },
  al: { f: 'Al', n: { en: 'Aluminium', hi: 'एल्युमिनियम', hg: 'Aluminium' }, color: 0xd5d8dc, react: 1.4 },
  cu: { f: 'Cu', n: { en: 'Copper turnings', hi: 'ताँबे की छीलन', hg: 'Copper turnings' }, color: 0xb86a3c, react: 0 },
  na2co3: { f: 'Na₂CO₃', n: { en: 'Sodium carbonate', hi: 'सोडियम कार्बोनेट', hg: 'Sodium carbonate' }, color: 0xf7f7f3, carb: 2.4, tex: 'nahco3', dis: 'washingsoda', disK: 1.6 },
  nahco3: { f: 'NaHCO₃', n: { en: 'Sodium hydrogencarbonate (baking soda)', hi: 'सोडियम हाइड्रोजन कार्बोनेट (खाने का सोडा)', hg: 'Baking soda (NaHCO₃)' }, tex: 'nahco3', color: 0xfafaf7, carb: 3, dis: 'bakingsoda', disK: 1.6, spoonG: 2, solub: (T) => 9.6 + 0.165 * (T - 20) },
  caco3: { f: 'CaCO₃', n: { en: 'Marble chips', hi: 'संगमरमर के टुकड़े', hg: 'Marble chips' }, color: 0xeeebe4, carb: 0.8, tex: 'marble' },
  cao: { f: 'CaO', n: { en: 'Quick lime', hi: 'बिना बुझा चूना', hg: 'Quick lime (chuna)' }, color: 0xf2efe6, tex: 'cao' },
  cuso4x: { f: 'CuSO₄·5H₂O', n: { en: 'Copper sulphate crystals', hi: 'कॉपर सल्फ़ेट के क्रिस्टल', hg: 'Copper sulphate crystals' }, color: 0x1f8fd0, tex: 'cuso4' },
  feso4x: { f: 'FeSO₄·7H₂O', n: { en: 'Ferrous sulphate crystals', hi: 'फ़ेरस सल्फ़ेट के क्रिस्टल', hg: 'Ferrous sulphate crystals' }, color: 0x78bfa4, tex: 'feso4' },
  sugar: { f: 'C₁₂H₂₂O₁₁', n: { en: 'Sugar', hi: 'चीनी', hg: 'Cheeni' }, color: 0xfbfbf8, tex: 'sugar', dis: 'sugar', disK: 1.6, stages: ['#fbfbf8', '#f1d58a', '#8b5a2b', '#1a1a1a'] },
  salt: { f: 'NaCl', n: { en: 'Common salt', hi: 'नमक', hg: 'Namak' }, color: 0xfafafa, tex: 'salt', dis: 'nacl', disK: 1.8, spoonG: 5, solub: (T) => 35.7 + 0.04 * (T - 20) },
  chalk: { f: 'CaCO₃', n: { en: 'Chalk powder', hi: 'चॉक पाउडर', hg: 'Chalk powder' }, color: 0xf3f1ea, tex: 'chalk', insol: 'chalk' },
  sand: { f: 'SiO₂', n: { en: 'Sand', hi: 'रेत', hg: 'Ret (sand)' }, color: 0xd2b080, tex: 'sand', insol: 'sand' },
  kmno4: { f: 'KMnO₄', n: { en: 'Potassium permanganate crystal', hi: 'पोटैशियम परमैंगनेट का क्रिस्टल', hg: 'Potassium permanganate crystal' }, color: 0x2a1f3a, tex: 'kmno4', dis: 'kmno4', disK: 0.3, still: true },
  nh4cl: { f: 'NH₄Cl', n: { en: 'Ammonium chloride', hi: 'अमोनियम क्लोराइड', hg: 'Ammonium chloride' }, color: 0xf7f7f4, tex: 'nh4cl', sub: true },
  cacl2: { f: 'CaCl₂', n: { en: 'Anhydrous calcium chloride', hi: 'एनहाइड्रस कैल्शियम क्लोराइड', hg: 'Anhydrous calcium chloride' }, color: 0xf6f5f0, tex: 'cacl2' },
  soil: { f: 'Soil', n: { en: 'Soil', hi: 'मिट्टी', hg: 'Mitti' }, color: 0x6b4a2a, tex: 'soil', insol: 'soil' },
  alum: { f: 'KAl(SO₄)₂·12H₂O', n: { en: 'Potash alum (fitkari)', hi: 'फ़िटकरी (पोटाश एलम)', hg: 'Fitkari (alum)' }, color: 0xf2f1ec, tex: 'salt', alum: true },
  // batch 6
  agcl: { f: 'AgCl', n: { en: 'Silver chloride', hi: 'सिल्वर क्लोराइड', hg: 'Silver chloride' }, color: 0xf7f7f2, tex: 'chalk', light: true },
  baoh2: { f: 'Ba(OH)₂·8H₂O', n: { en: 'Barium hydroxide crystals', hi: 'बेरियम हाइड्रॉक्साइड के क्रिस्टल', hg: 'Barium hydroxide crystals' }, color: 0xf5f5f1, tex: 'nh4cl' },
  cupow: { f: 'Cu', n: { en: 'Copper powder', hi: 'ताँबे का पाउडर', hg: 'Copper powder' }, color: 0xb87333, cuOx: true },
  cuo: { f: 'CuO', n: { en: 'Copper(II) oxide (black)', hi: 'कॉपर(II) ऑक्साइड (काला)', hg: 'Copper(II) oxide (kaala)' }, color: 0x232120 },
  naohs: { f: 'NaOH', n: { en: 'Sodium hydroxide pellets', hi: 'सोडियम हाइड्रॉक्साइड की गोलियाँ', hg: 'NaOH ki goliyan' }, color: 0xf7f7f4, tex: 'naoh', dis: 'naoh', disK: 0.9, disMl: 2, heatDis: 7 },
  na: { f: 'Na', n: { en: 'Sodium (a small piece)', hi: 'सोडियम (एक छोटा टुकड़ा)', hg: 'Sodium (chhota tukda)' }, color: 0xcfcfc8, alkali: 1 },
  ca: { f: 'Ca', n: { en: 'Calcium granules', hi: 'कैल्शियम के दाने', hg: 'Calcium ke daane' }, color: 0xd6d4cc, alkali: 0.3 },
  // batch 5
  femix: { f: 'Fe + S', n: { en: 'Mixture of iron filings and sulphur', hi: 'लोहे के बुरादे और सल्फ़र का मिश्रण', hg: 'Lohe ke buraade aur sulphur ka mixture' }, color: 0xffffff, tex: 'femix', react: 0.4, rough: 1, heatFeS: true },
  fes: { f: 'FeS', n: { en: 'Iron sulphide (black)', hi: 'आयरन सल्फ़ाइड (काला)', hg: 'Iron sulphide (kaala)' }, color: 0x2c2926, tex: 'fes' },
  filings: { f: 'Fe', n: { en: 'Iron filings', hi: 'लोहे का बुरादा', hg: 'Lohe ka buraada' }, color: 0x55585c, tex: 'filings' },
  spow: { f: 'S', n: { en: 'Sulphur powder', hi: 'सल्फ़र पाउडर', hg: 'Sulphur powder' }, color: 0xf0d02a, tex: 'sulphur' },
  cuso4i: { f: 'CuSO₄·5H₂O', n: { en: 'Impure copper sulphate', hi: 'अशुद्ध कॉपर सल्फ़ेट', hg: 'Impure copper sulphate' }, color: 0x2f86c8, tex: 'cuso4', dis: 'cuso4', disK: 1.4, disMl: 1.5, spoonG: 3, imp: 0.04, solub: (T) => 32 + 0.75 * (T - 20) },
  // batch 4
  cuso4d: { f: 'CuSO₄·5H₂O', n: { en: 'Copper sulphate crystals', hi: 'कॉपर सल्फ़ेट के क्रिस्टल', hg: 'Copper sulphate crystals' }, color: 0x1f8fd0, tex: 'cuso4', dis: 'cuso4', disK: 2.2, disMl: 4 },
  kis: { f: 'KI', n: { en: 'Potassium iodide', hi: 'पोटैशियम आयोडाइड', hg: 'Potassium iodide' }, color: 0xf8f8f4, tex: 'ki', dis: 'ki', disK: 2 },
  bacl2s: { f: 'BaCl₂', n: { en: 'Barium chloride', hi: 'बेरियम क्लोराइड', hg: 'Barium chloride' }, color: 0xf6f6f2, tex: 'bacl2', dis: 'bacl2', disK: 1.6 },
  camphor: { f: 'C₁₀H₁₆O', n: { en: 'Camphor', hi: 'कपूर', hg: 'Kapoor (camphor)' }, color: 0xf7f7f2, tex: 'nh4cl', kero: 'kerosene', floats: true },
  naph: { f: 'C₁₀H₈', n: { en: 'Naphthalene', hi: 'नैफ़्थलीन', hg: 'Naphthalene (goli)' }, color: 0xf6f6f4, tex: 'naph', kero: 'kerosene' },
  pbno3s: { f: 'Pb(NO₃)₂', n: { en: 'Lead nitrate powder', hi: 'लेड नाइट्रेट पाउडर', hg: 'Lead nitrate powder' }, color: 0xf5f5f2, tex: 'pbno3' },
};

// ------------------------------------------------------------------ indicator colours by pH
const UI = ['#c62828', '#d84315', '#ef6c00', '#f9a825', '#fdd835', '#c0ca33', '#7cb342', '#43a047', '#26a69a', '#1e88e5', '#3949ab', '#5e35b1', '#6a1b9a', '#6a1b9a', '#5b1385'];
export function uiColor(pH) { const i = Math.max(0, Math.min(13.99, pH)); const a = Math.floor(i), t = i - a; return C(UI[a]).lerp(C(UI[a + 1]), t); }
export function indColor(ind, pH) {
  switch (ind) {
    case 'phenol': { if (pH < 8.2) return null; const k = Math.min(1, (pH - 8.2) / 1.6); return C('#f8d6ea').lerp(C('#e0168f'), k); }
    case 'mo': return pH < 3.1 ? C('#d6282a') : pH < 4.4 ? C('#d6282a').lerp(C('#f5c12e'), (pH - 3.1) / 1.3) : C('#f5c12e');
    case 'litmus': return pH < 4.5 ? C('#d6363a') : pH > 8.3 ? C('#3a5fc6') : C('#d6363a').lerp(C('#3a5fc6'), (pH - 4.5) / 3.8);
    case 'ui': return uiColor(pH);
    case 'turmeric': return pH > 8 ? C('#b5361f') : C('#e8b422');
    case 'chinarose': return pH < 6.5 ? C('#c2185b') : pH > 7.6 ? C('#3c8d3c') : C('#8a5a6a');
    case 'rose': return pH < 6.3 ? C('#d62d5a') : pH > 7.8 ? C('#4f8a2e') : C('#b3446c');
    default: return null;
  }
}
// strip colour after dipping (litmus papers, pH paper, turmeric paper)
export function stripColor(kind, pH) {
  if (kind === 'blue') return pH < 5 ? C('#d0424a') : C('#4e6fbf');
  if (kind === 'red') return pH > 7.8 ? C('#4e6fbf') : C('#d0424a');
  if (kind === 'ph') return uiColor(pH);
  if (kind === 'turmeric') return pH > 8 ? C('#b5361f') : C('#e8b422');
  return C('#ffffff');
}

// ------------------------------------------------------------------ mixture in a vessel
// CTX.rule > 0 while the reaction engine itself is changing a mix: what it adds is a product, not something a person put in
export const CTX = { rule: 0 };
export class Mix {
  constructor() { this.liq = {}; this.ppt = {}; this.temp = 27; this.gas = {}; this.sed = 0; this.cloud = 0; this.events = []; this.inp = {}; }
  ml() { let s = 0; for (const k in this.liq) s += this.liq[k]; return s; }
  add(sub, ml) { this.liq[sub] = (this.liq[sub] || 0) + ml; if (!CTX.rule && ml > 0) this.inp[sub] = (this.inp[sub] || 0) + ml; } // inp: everything ever put in (poured, dropped, filled), for comparing what a student did with the method
  take(ml) { // remove a well-mixed portion
    const tot = this.ml(); if (tot <= 0) return null; const f = Math.min(1, ml / tot); const out = { liq: {}, ppt: {}, cloud: this.cloud, temp: this.temp };
    for (const k in this.liq) { const d = this.liq[k] * f; out.liq[k] = d; this.liq[k] -= d; if (this.liq[k] < 1e-6) delete this.liq[k]; }
    for (const k in this.ppt) { const d = this.ppt[k] * f * Math.min(1, this.cloud + 0.15); out.ppt[k] = d; this.ppt[k] -= d; }
    return out;
  }
  put(p, ml) { if (!p) return; if (p.temp != null) { const m0 = this.ml(), m1 = Object.values(p.liq).reduce((a, b) => a + b, 0); if (m0 + m1 > 1e-6) this.temp = (this.temp * m0 + p.temp * m1) / (m0 + m1); } for (const k in p.liq) this.add(k, p.liq[k]); for (const k in p.ppt) { this.ppt[k] = (this.ppt[k] || 0) + p.ppt[k]; this.cloud = Math.max(this.cloud, p.cloud * 0.9); } void ml; }
  has(sub, min = 0.05) { return (this.liq[sub] || 0) > min; }
  pH() {
    const self = this; const tot = this.ml(); if (tot <= 0) return 7;
    let net = 0, strong = 0, wAcid = 0, wBase = 0, wNeut = 0, pHw = 0, pHnn = 0;
    for (const k in this.liq) {
      const s = SUBS[k]; if (!s || s.ind) continue; const v = this.liq[k];
      if (s.h) { const eq = s.h * v / 1000; net += eq; if (!s.weak) strong += Math.abs(eq); }
      if (s.pH != null) { if (s.pH < 6.5) wAcid += v; else if (s.pH > 7.5) wBase += v; else wNeut += v; pHw += s.pH * v; if (s.pH < 6.5 || s.pH > 7.5) pHnn += s.pH * v; }
    }
    if (wAcid + wBase + wNeut <= 0) { for (const k in this.liq) { const s = SUBS[k]; if (s && s.ind) return s.pHself ?? 7; } return 7; } // only an indicator (its own bottle)
    const L = tot / 1000;
    if (strong > 1e-6 || Math.abs(net) > 1e-4) {
      // strong acid / base dominates: use the excess
      const c = Math.abs(net) / L;
      if (c < 1e-7) return 7;
      if (strong < 1e-6) return weakMix();
      const p = -Math.log10(Math.max(c, 1e-7)); return net > 0 ? Math.max(0, p) : Math.min(14, 14 - p);
    }
    return weakMix();
    // only weak acids/bases and neutral water: dilution moves the pH towards 7, but a base stays basic
    function weakMix() {
      if (wAcid > 0 && wBase > 0) { // a weak acid and a weak base together (lemon juice + lime water): the one with more equivalents wins
        let aEq = 0, bEq = 0, pa = 0, pb = 0, va = 0, vb = 0;
        for (const k in self.liq) { const s = SUBS[k]; if (!s || s.ind || !s.h) continue; const v = self.liq[k]; const eq = s.h * v / 1000; if (eq > 0) { aEq += eq; pa += s.pH * v; va += v; } else { bEq -= eq; pb += s.pH * v; vb += v; } }
        if (aEq > 0 && bEq > 0) { const n = aEq - bEq, r = Math.abs(n) / (aEq + bEq), f = 0.6 + 0.4 * (wAcid + wBase) / (wAcid + wBase + wNeut); if (r < 1e-6) return 7;
          return n > 0 ? 7 - (7 - pa / va) * Math.pow(r, 0.25) * f : 7 + (pb / vb - 7) * Math.pow(r, 0.25) * f; }
      }
      const nn = wAcid + wBase; if (nn <= 0) return pHw / Math.max(1e-6, wNeut);
      const avg = pHnn / nn; const f = 0.6 + 0.4 * nn / (nn + wNeut); return 7 + (avg - 7) * f;
    }
  }
  // visual colour of the liquid
  look() {
    const tot = this.ml(); const out = { color: C('#dceeff'), alpha: 0.16, cloud: this.cloud, cloudC: C('#ffffff') };
    if (tot <= 0) return out;
    let r = 0, g = 0, b = 0, w = 0, a = 0, cl = 0, clC = C('#ffffff'), ind = null, indMl = 0, dye = null;
    for (const k in this.liq) {
      const s = SUBS[k]; if (!s) continue; const v = this.liq[k];
      if (s.ind) { ind = s.ind; indMl += v; continue; }
      if (s.dye) { dye = dye || []; dye.push([s, v]); continue; }
      const strength = v * (0.25 + s.a * 2.5) * (s.tint || 1); const c = C(s.c); r += c.r * strength; g += c.g * strength; b += c.b * strength; w += strength; a += s.a * v; // tint: strongly coloured salts (copper sulphate) colour more water
      if (s.cloud) { cl += s.cloud * v; clC = C(s.cloudC); }
    }
    if (w > 0) { out.color.setRGB(r / w, g / w, b / w); out.alpha = a / tot; }
    if (cl > 0) { out.cloud = Math.max(out.cloud, cl / tot); out.cloudC = clC; }
    if (dye) for (const [s, v] of dye) { const k = Math.min(1, (v / tot) * s.dye); out.color.lerp(C(s.c), Math.min(0.95, k)); out.alpha = Math.max(out.alpha, 0.2 + 0.65 * k); }
    if (ind) {
      const ic = indColor(ind, this.pH());
      const k = Math.min(1, indMl / Math.max(0.2, tot) * 40); // a few drops colour a test tube
      if (ic) { out.color.lerp(ic, Math.min(0.92, k)); out.alpha = Math.max(out.alpha, 0.5 + 0.3 * k); }
    }
    // precipitate colour
    let pw = 0; const pc = new THREE.Color(0, 0, 0);
    for (const k in this.ppt) { const m = this.ppt[k]; if (m <= 0) continue; const c = C(PPT[k].c); pc.r += c.r * m; pc.g += c.g * m; pc.b += c.b * m; pw += m; }
    if (pw > 0) { out.cloudC = pc.multiplyScalar(1 / pw); out.pptCol = out.cloudC.clone(); }
    return out;
  }
}

// ------------------------------------------------------------------ reactions
const pptSum = (m) => { let s = 0; for (const k in m.ppt) s += m.ppt[k]; return s; };
// the precipitate got less: the cloudiness and the layer at the bottom go down with it
function clearBy(m, before) { if (before <= 1e-9) return; const f = Math.max(0, Math.min(1, pptSum(m) / before)); m.cloud *= f; m.sed *= f; }
// an acid meets a precipitate it dissolves. Without dt: is there such a pair? With dt: let it react.
function pptAcid(v, carb, dt, E) {
  const m = v.mix; let any = false;
  for (const p in PPT_ACID) {
    const R = PPT_ACID[p]; if (!!R.co2 !== carb || !((m.ppt[p] || 0) > 0.01)) continue;
    for (const a of PPT_ACIDS) {
      const salt = R[NEUT_A[a]]; if (!salt || !m.has(a, 0.02)) continue;
      if (!dt) return true;
      any = true; const h = SUBS[a].h; const before = pptSum(m);
      const k = (1 + Math.max(0, m.temp - 27) / 20) * (v.stirT > 0 || v.shaking ? 1.6 : 1) * (SUBS[a].weak ? 0.4 : 1) * (R.slow ?? 1);
      const d = Math.min(m.ppt[p], m.liq[a] * h, dt * E.lapse * 4 * k); m.ppt[p] -= d; m.liq[a] -= d / h;
      if (salt.endsWith('!')) { const q = salt.slice(0, -1); m.ppt[q] = (m.ppt[q] || 0) + d; } else { m.add(salt, d * 1.2); clearBy(m, before); }
      if (R.co2) { E.fx.bubbles_(v, 40, dt, { size: 0.001 }); v.gasOut && v.gasOut('CO2', d * 1.5); E.note(v, 'co2', {}); }
      E.note(v, 'ppt_dissolve', { ppt: p });
      break;
    }
  }
  return any;
}
// Each rule looks at one vessel; dt is real time, k is the time-lapse factor for slow reactions.
export const RULES = [
  // metal + acid -> salt + hydrogen
  { id: 'metal_acid', test: (v) => v.solids.some((s) => s.chem && SOLIDS[s.chem].react > 0 && s.amount > 0) && (v.mix.has('hcl') || v.mix.has('h2so4')),
    run(v, dt, E) {
      const acid = v.mix.has('hcl') ? 'hcl' : 'h2so4';
      for (const s of v.solids) {
        const S = SOLIDS[s.chem]; if (!S || !(S.react > 0) || s.amount <= 0) continue;
        if (!s.under) continue; // must be in the liquid
        let rate = S.react * Math.min(1, v.mix.liq[acid] / 2);
        if (s.chem === 'al') { s.age = (s.age || 0) + dt * E.lapse; rate *= Math.min(1, s.age / 25); } // oxide layer delays it
        E.fx.bubbles_(v, 6 + rate * 30, dt, { from: () => s.surfacePoint(), size: s.chem === 'mg' ? 0.0011 : 0.0008 });
        v.gasOut('H2', rate * dt);
        const used = rate * dt * 0.004; s.amount = Math.max(0, s.amount - used * (s.chem === 'mg' ? 6 : 0.4));
        v.mix.liq[acid] = Math.max(0, v.mix.liq[acid] - used * 0.6);
        const salt = { zn: acid === 'hcl' ? 'zncl2' : 'znso4', fe: acid === 'hcl' ? 'fecl2' : 'feso4', femix: 'fecl2', mg: 'mgcl2', al: 'zncl2' }[s.chem];
        if (salt) v.mix.add(salt, used * 0.6);
        v.mix.temp += rate * dt * (s.chem === 'mg' ? 0.5 : 0.25);
        E.note(v, 'h2', { metal: s.chem });
        s.onAmount && s.onAmount();
      }
    } },
  // carbonate + acid -> CO2 (fizzing)
  { id: 'carb_acid', test: (v) => v.solids.some((s) => s.chem && SOLIDS[s.chem].carb && s.amount > 0) && ['hcl', 'h2so4', 'vinegar', 'lemon', 'ethanoic', 'glacial'].some((a) => v.mix.has(a)),
    run(v, dt, E) {
      const acid = ['hcl', 'h2so4', 'vinegar', 'lemon', 'ethanoic', 'glacial'].find((a) => v.mix.has(a));
      for (const s of v.solids) {
        const S = SOLIDS[s.chem]; if (!S?.carb || s.amount <= 0 || !s.under) continue;
        const rate = S.carb * Math.min(1, v.mix.liq[acid] / 2) * (SUBS[acid].weak ? 0.6 : 1);
        E.fx.bubbles_(v, 30 + rate * 60, dt, { size: 0.0009 });
        if (rate > 1.5) for (let i = 0; i < 2; i++) E.fx.bubbles_(v, 40, dt, { size: 0.0012 });
        v.gasOut('CO2', rate * dt * E.lapse);
        const used = rate * dt * E.lapse * 0.006; s.amount = Math.max(0, s.amount - used); v.mix.liq[acid] = Math.max(0, v.mix.liq[acid] - used * 0.5); // time-lapse speeds the reaction up too
        v.mix.add(s.chem === 'caco3' ? 'water' : 'nacl', used * 0.4);
        E.note(v, 'co2', {}); s.onAmount && s.onAmount();
      }
    } },
  // lime water + CO2 -> milky; more CO2 -> clear again
  { id: 'limewater_co2', test: (v) => v.mix.has('limewater') && (v.gasIn?.CO2 || 0) > 0,
    run(v, dt, E) {
      const g = v.gasIn.CO2; v.gasIn.CO2 = 0; v.co2Tot = (v.co2Tot || 0) + g;
      E.fx.bubbles_(v, 40, dt, { from: v.pipeEnd ? () => v.pipeEnd.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.002, 0, 0)) : null, size: 0.0011 });
      const milky = Math.min(1, v.co2Tot / 1.2) * (1 - Math.min(1, Math.max(0, (v.co2Tot - 6) / 6)));
      v.mix.ppt.caco3 = 1; v.mix.cloud = 0.75 * milky; E.note(v, 'milky', { level: milky });
    } },
  // iron + copper sulphate -> iron sulphate + copper (slow: minutes)
  { id: 'fe_cuso4', test: (v) => v.solids.some((s) => (s.chem === 'fe' || s.chem === 'zn' || s.chem === 'al') && s.under) && v.mix.has('cuso4', 0.01),
    run(v, dt, E) {
      for (const s of v.solids) {
        if (!s.under || !['fe', 'zn', 'al'].includes(s.chem)) continue;
        const k = E.lapse * dt * (s.chem === 'zn' ? 0.0045 : s.chem === 'al' ? 0.003 : 0.0022);
        const d = Math.min(v.mix.liq.cuso4, k * Math.max(0.5, v.mix.ml()));
        v.mix.liq.cuso4 -= d; v.mix.add(s.chem === 'fe' ? 'feso4' : 'znso4', d);
        s.coat = Math.min(1, (s.coat || 0) + k * 1.8); s.onCoat && s.onCoat(s.coat, 0xa3542a);
        E.note(v, 'displace', { metal: s.chem, coat: s.coat });
      }
    } },
  // zinc + ferrous sulphate (pale green -> colourless, dark grey coat)
  { id: 'zn_feso4', test: (v) => v.solids.some((s) => s.chem === 'zn' && s.under) && v.mix.has('feso4', 0.01) && !v.mix.has('cuso4', 0.01),
    run(v, dt, E) {
      for (const s of v.solids) { if (s.chem !== 'zn' || !s.under) continue; const k = E.lapse * dt * 0.003; const d = Math.min(v.mix.liq.feso4, k * v.mix.ml()); v.mix.liq.feso4 -= d; v.mix.add('znso4', d); s.coat = Math.min(1, (s.coat || 0) + k * 1.5); s.onCoat && s.onCoat(s.coat, 0x3a3c40); }
    } },
  // double displacement precipitates (fast)
  { id: 'ppt', test: (v) => PAIRS.some(([a, b]) => v.mix.has(a, 0.01) && v.mix.has(b, 0.01)),
    run(v, dt, E) {
      for (const [a, b, p, s, ka = 1, kb = 1, kp = 1, ks = 1.6, kw = 0] of PAIRS) {
        if (!v.mix.has(a, 0.01) || !v.mix.has(b, 0.01)) continue;
        const d = Math.min(v.mix.liq[a] / ka, v.mix.liq[b] / kb, dt * 6);
        v.mix.liq[a] -= d * ka; v.mix.liq[b] -= d * kb; v.mix.ppt[p] = (v.mix.ppt[p] || 0) + d * kp; v.mix.add(s, d * ks); if (kw) v.mix.add('water', d * kw);
        v.mix.cloud = Math.min(0.92, v.mix.cloud + d * kp * 0.35); E.fx.flakes_(v, 25, dt, PPT[p].c); E.note(v, 'ppt', { ppt: p });
      }
    } },
  // an acid dissolves a hydroxide, oxide or carbonate precipitate: the cloudiness clears and the salt colours the liquid
  // (copper hydroxide in hydrochloric acid: blue-green copper chloride); carbonates fizz with carbon dioxide
  { id: 'ppt_acid', test: (v) => pptAcid(v, false), run(v, dt, E) { pptAcid(v, false, dt, E); } },
  { id: 'carbppt_acid', test: (v) => pptAcid(v, true), run(v, dt, E) { pptAcid(v, true, dt, E); } },
  // copper hydroxide in hot liquid (about 70 °C and above) loses water: the pale blue precipitate turns black (copper oxide)
  { id: 'cuoh2_heat', test: (v) => (v.mix.ppt.cuoh2 || 0) > 0.01 && v.mix.temp > 70 && v.mix.ml() > 0.2,
    run(v, dt, E) { const m = v.mix; const d = Math.min(m.ppt.cuoh2, dt * E.lapse * (0.02 * m.ppt.cuoh2 + 0.02) * (m.temp - 60) / 30); m.ppt.cuoh2 -= d; m.ppt.cuo = (m.ppt.cuo || 0) + d * 0.8; E.note(v, 'cuoh2_black', {}); } },
  // iron(II) hydroxide takes up oxygen from the air: dirty green slowly turns reddish brown
  { id: 'feoh2_air', test: (v) => (v.mix.ppt.feoh2 || 0) > 0.01 && !v.noAir,
    run(v, dt, E) { const m = v.mix; const d = Math.min(m.ppt.feoh2, dt * E.lapse * 0.004 * m.ppt.feoh2 + dt * 0.0005); m.ppt.feoh2 -= d; m.ppt.feoh3 = (m.ppt.feoh3 || 0) + d; E.note(v, 'feoh2_air', {}); } },
  // zinc hydroxide dissolves again in more sodium hydroxide (it is amphoteric): the white precipitate disappears
  { id: 'znoh2_base', test: (v) => (v.mix.ppt.znoh2 || 0) > 0.01 && v.mix.has('naoh', 0.05) && !v.mix.has('znso4', 0.01) && !v.mix.has('zncl2', 0.01),
    run(v, dt, E) { const m = v.mix; const before = pptSum(m); const d = Math.min(m.ppt.znoh2, m.liq.naoh / 2, dt * 2); m.ppt.znoh2 -= d; m.liq.naoh -= d * 2; m.add('zincate', d * 2); clearBy(m, before); E.note(v, 'znoh2_dissolve', {}); } },
  // quick lime + water: hissing, hot, milky slaked lime
  { id: 'cao_water', test: (v) => v.solids.some((s) => s.chem === 'cao' && s.amount > 0 && s.under) && v.mix.has('water', 0.5),
    run(v, dt, E) {
      for (const s of v.solids) { if (s.chem !== 'cao' || s.amount <= 0 || !s.under) continue;
        const d = Math.min(s.amount, dt * 0.08); s.amount -= d; s.onAmount && s.onAmount();
        v.mix.temp = Math.min(82, v.mix.temp + d * 260); v.mix.ppt.caoh2 = (v.mix.ppt.caoh2 || 0) + d * 3; v.mix.cloud = Math.min(0.85, v.mix.cloud + d * 2.5);
        const conv = Math.min(v.mix.liq.water || 0, d * 300); v.mix.liq.water -= conv; v.mix.add('limewater', conv);
        if (Math.random() < dt * 8) E.fx.puff(v.mouthWorld(), '#ffffff', { size: 0.01, grow: 0.05, alpha: 0.25, life: 1.6 });
        E.fx.bubbles_(v, 30, dt, { from: () => s.surfacePoint() }); E.note(v, 'hot', { t: v.mix.temp });
      }
    } },
  // soluble solids (sugar, salt) disappear — fast when stirred; a permanganate crystal sends purple streaks down
  { id: 'dissolve', test: (v) => v.solids.some((s) => s.under && s.amount > 0 && SOLIDS[s.chem]?.dis) && v.mix.has('water', 0.5),
    run(v, dt, E) {
      for (const s of v.solids) {
        const S = SOLIDS[s.chem]; if (!S?.dis || !s.under || s.amount <= 0) continue;
        const k = (v.stirT > 0 ? 0.16 : S.still ? 0.004 : 0.012) * (S.disK ?? 1) * E.lapse * (1 + Math.max(0, v.mix.temp - 27) / 25);
        let d = Math.min(s.amount, k * dt);
        if (S.solub) { // saturated: no more can dissolve at this temperature
          v.disG = v.disG || {}; const cap = S.solub(v.mix.temp) * (v.mix.liq.water || 0) / 100; const room = Math.max(0, cap - (v.disG[s.chem] || 0)) / (S.spoonG || 5);
          if (room < 1e-4) { if (!v.saturated) { v.saturated = s.chem; E.note(v, 'saturated', { chem: s.chem }); } (v.solLog = v.solLog || {})[s.chem] = { dis: true, left: s.amount / Math.max(1e-6, s.amount0 || s.amount), sat: true }; continue; }
          d = Math.min(d, room); v.disG[s.chem] = (v.disG[s.chem] || 0) + d * (S.spoonG || 5); v.saturated = null;
        }
        s.amount -= d; s.onAmount && s.onAmount(); if (S.imp) { v.mix.ppt.mud = (v.mix.ppt.mud || 0) + d * S.imp; v.mix.cloud = Math.min(0.25, v.mix.cloud + d * S.imp * 2); }
        v.mix.add(S.dis, d * (S.dye ? 0.15 : S.disMl ?? 0.8)); if (S.heatDis) v.mix.temp += d * S.heatDis * 10 / Math.max(5, v.mix.ml()); // NaOH pellets warm the water as they dissolve // disMl: how much of the stock solution one spoonful makes (copper sulphate colours water strongly)
        if (s.chem === 'kmno4') { E.fx.flakes_(v, 10 * Math.min(4, E.lapse), dt, '#b02fbf'); }
        else if (v.stirT > 0 && !S.dye && s.amount > 0.05) E.fx.flakes_(v, 9 * Math.min(1, s.amount), dt, '#f6f6f2'); // stirred: a few crystals swirl round and get smaller
        if (d > 0) v._disT = 0.6; s.amount0 = Math.max(s.amount0 || 0, s.amount + d);
        (v.solLog = v.solLog || {})[s.chem] = { dis: true, left: s.amount / Math.max(1e-6, s.amount0), sat: v.saturated === s.chem }; // what the student is told: dissolving, how much is left
        E.note(v, 'dissolve', { chem: s.chem, left: s.amount });
      }
    } },
  { id: 'insoluble', test: (v) => v.solids.some((s) => s.under && s.amount > 0 && SOLIDS[s.chem]?.insol) && v.mix.ml() > 0.5,
    run(v, dt, E) {
      for (const s of v.solids) {
        const S = SOLIDS[s.chem]; if (!S?.insol || !s.under || s.amount <= 0) continue;
        (v.solLog = v.solLog || {})[s.chem] = { dis: false };
        if (S.insol === 'soil') { if (v.stirT > 0) { const d = Math.min(s.amount, dt * 0.9); s.amount -= d; s.onAmount && s.onAmount(); v.mix.ppt.mud = (v.mix.ppt.mud || 0) + d * 0.7; v.mix.ppt.clay = (v.mix.ppt.clay || 0) + d * 0.5; } continue; }
        if (S.insol === 'sand' || v.stirT > 0) { // stirred up: it spreads through the water but does not disappear
          const d = Math.min(s.amount, dt * (v.stirT > 0 ? 1.2 : 0.6)); s.amount -= d; s.onAmount && s.onAmount();
          v.mix.ppt[S.insol] = (v.mix.ppt[S.insol] || 0) + d; v.mix.cloud = Math.min(S.insol === 'sand' ? 0.35 : 0.85, v.mix.cloud + d * (S.insol === 'sand' ? 0.4 : 1.4));
          E.fx.flakes_(v, 30, dt, PPT[S.insol].c);
        }
      }
    } },
  // zinc or aluminium + sodium hydroxide (warm) -> hydrogen
  { id: 'metal_base', test: (v) => v.solids.some((s) => (s.chem === 'zn' || s.chem === 'al') && s.under && s.amount > 0) && v.mix.has('naoh', 0.3),
    run(v, dt, E) {
      for (const s of v.solids) {
        if ((s.chem !== 'zn' && s.chem !== 'al') || !s.under || s.amount <= 0) continue;
        const rate = (s.chem === 'al' ? 0.8 : 0.3) * Math.min(2.5, Math.max(0.15, (v.mix.temp - 20) / 25));
        E.fx.bubbles_(v, 4 + rate * 30, dt, { from: () => s.surfacePoint(), size: 0.0008 }); v.gasOut('H2', rate * dt);
        s.amount = Math.max(0, s.amount - rate * dt * 0.0015); E.note(v, 'h2', { metal: s.chem });
      }
    } },
  // iron rusts only with both air and water (time-lapse: days)
  { id: 'rust', test: (v) => v.solids.some((s) => s.chem === 'fe') && v.mix.has('water', 0.5) && !v.noAir,
    run(v, dt, E) { for (const s of v.solids) if (s.chem === 'fe') { s.rust = Math.min(1, (s.rust || 0) + dt * E.lapse / 200000); s.onCoat && s.onCoat(s.rust, 0x8a3f1c); if (s.rust > 0.3) E.note(v, 'rust', {}); } } },
  // water added to white (anhydrous) copper sulphate turns it blue and warm
  { id: 'cuso4_rehydrate', test: (v) => v.solids.some((s) => s.chem === 'cuso4x' && s.white > 0.5) && v.mix.has('water', 0.05),
    run(v, dt, E) { for (const s of v.solids) if (s.chem === 'cuso4x' && s.white > 0) { s.white = Math.max(0, s.white - dt * 0.8); s.onWhite && s.onWhite(s.white); v.mix.temp += dt * 6; E.note(v, 'blue_again', {}); } } },
  // ---------------------------------------------------------- batch 3
  // muddy water: sand and soil settle fast, fine clay stays for hours (alum makes it clump and settle quickly)
  { id: 'mud', test: (v) => (v.mix.ppt.mud || 0) + (v.mix.ppt.clay || 0) + (v.mix.settled ? (v.mix.settled.mud || 0) + (v.mix.settled.clay || 0) : 0) > 0.001,
    run(v, dt, E) {
      const m = v.mix; v.settle = 0; m.settled = m.settled || {};
      if (v.stirT > 0 || v.shaking) { for (const k of ['mud', 'clay']) if (m.settled[k] > 0) { const d = m.settled[k] * Math.min(1, dt * 2); m.settled[k] -= d; m.ppt[k] = (m.ppt[k] || 0) + d; } }
      else for (const [k, r] of [['mud', 0.3], ['clay', v.alum ? 0.006 : 0.0004]]) { const a = m.ppt[k] || 0; if (a <= 0) continue; const d = a * (1 - Math.exp(-dt * r * E.lapse)); m.ppt[k] = a - d; m.settled[k] = (m.settled[k] || 0) + d; }
      const sus = (m.ppt.mud || 0) + (m.ppt.clay || 0) * 1.8; m.cloud = Math.min(0.94, sus * 1.1);
      m.sed = Math.min(0.012, ((m.settled.mud || 0) + (m.settled.clay || 0)) * 0.007);
      if (v.alum && (m.ppt.clay || 0) > 0.03) E.fx.flakes_(v, 25, dt, '#7d5e3a');
      E.note(v, 'mud', { cloud: m.cloud });
    } },
  // alum dissolving in muddy water
  { id: 'alum', test: (v) => v.solids.some((s) => s.under && s.amount > 0 && SOLIDS[s.chem]?.alum),
    run(v, dt) { for (const s of v.solids) if (SOLIDS[s.chem]?.alum && s.under && s.amount > 0) { s.amount = Math.max(0, s.amount - dt * (v.stirT > 0 ? 0.6 : 0.05)); s.onAmount && s.onAmount(); v.alum = true; } } },
  // filtration: the liquid runs through the paper into the vessel below; the insoluble part stays on the paper
  { id: 'filter', test: (v) => v.filter && v.drainTo && v.ml > 0.01,
    run(v, dt, E) {
      const m = v.mix; const tot = m.ml(); if (!v.drain0 || tot > v.drain0) v.drain0 = tot;
      let pw = 0; const pc = new THREE.Color(0, 0, 0); const all = {}; for (const k in m.ppt) if (!PPT[k]?.colloid) all[k] = m.ppt[k]; for (const k in (m.settled || {})) all[k] = (all[k] || 0) + m.settled[k];
      for (const k in all) { const a = all[k]; if (a <= 0 || !PPT[k]) continue; pc.add(C(PPT[k].c).multiplyScalar(a)); pw += a; }
      const rate = Math.min(tot, dt * 0.7 * E.lapse / (1 + v.residue * 0.6)); const f = rate / tot; const out = { liq: {}, ppt: {}, cloud: 0, temp: m.temp };
      for (const k in m.liq) { const d = m.liq[k] * f; out.liq[k] = d; m.liq[k] -= d; if (m.liq[k] < 1e-6) delete m.liq[k]; }
      for (const k in m.ppt) if (PPT[k]?.colloid) { const d = m.ppt[k] * f; out.ppt[k] = d; m.ppt[k] -= d; out.cloud = m.cloud; } // colloid particles are small enough to pass through the paper
      if (pw > 0) { v.res0 = Math.max(v.res0 || 0, pw); v.resCol = pc.multiplyScalar(1 / pw); }
      v.residue = (v.res0 || 0) * (1 - m.ml() / Math.max(0.01, v.drain0)); v.setResidue && v.setResidue(v.residue, v.resCol);
      if (m.ml() < 0.05) { m.ppt = {}; m.settled = {}; m.cloud = 0; m.sed = 0; v.setResidue && v.setResidue(v.res0 || 0, v.resCol); }
      const t = v.drainTo; t.mix.put(out, rate); t.ml = t.mix.ml();
      const tip = v.g.localToWorld(new THREE.Vector3(0, 0.0005, 0)); const land = new THREE.Vector3(tip.x, Math.max(t.levelWorld(), t.g.localToWorld(new THREE.Vector3(0, t.inner[0].y, 0)).y), tip.z);
      E.fx.stream('flt' + v.id, tip, land, t.color, 0.0005);
      E.note(v, 'filter', { left: m.ml() });
    } },
  // evaporation from an open surface: faster with a bigger surface, heat (sunlight) and for spirit
  { id: 'evap', test: (v) => v.evapOpen && v.ml > 0.001,
    run(v, dt, E) {
      const m = v.mix; const lvl = v.heightFor(v.ml); const r = v.rInner(Math.max(lvl * 0.8, v.inner[0].y + 0.0004)); const area = Math.PI * r * r;
      const sun = v.sunBy && v.sunBy.on ? 2.4 : 0; const heat = 1 + sun + Math.max(0, m.temp - 27) / 8;
      const rate = area * 0.6 * heat * E.lapse * dt;
      for (const k of ['water', 'spirit', 'tapwater', 'ink', 'acetone']) if (m.liq[k] > 0) { const d = Math.min(m.liq[k], rate * (SUBS[k].volatile ?? 1)); m.liq[k] -= d; if (m.liq[k] < 1e-4) delete m.liq[k]; if (k === 'ink') { v.dyeG = (v.dyeG || 0) + d; v.setResidue && v.setResidue(Math.min(1, v.dyeG / Math.max(0.05, v.ink0 || 0.3)), '#1b2a6b'); } }
      if (m.ml() < 0.02 && !v.evDry) { v.evDry = true; for (const k in m.liq) delete m.liq[k]; E.note(v, 'evap_dry', {}); }
      E.note(v, 'evap', { ml: m.ml() });
    } },
  // ice keeps the water near 0 °C and slowly melts; with salt (freezing mixture) it gets far colder
  { id: 'ice', test: (v) => (v.ice || 0) > 0,
    run(v, dt, E) {
      const m = v.mix; const salty = m.has('nacl', 0.3) || v.saltIce; const target = salty ? -9 : 0.2; const hot = v.heatNow > 0; if (hot) v.heatNow -= dt;
      if (hot) m.temp = Math.min(m.temp, target + 0.3); else m.temp += (target - m.temp) * Math.min(1, dt * 0.6); // while ice is melting, the heat goes into melting it: the temperature stays at 0 °C
      const d = Math.min(v.ice, dt * E.lapse * (salty ? 0.03 : 0.012) * (hot ? 10 : 1)); v.ice -= d; m.add('water', d); v.ledger = (v.ledger || 0); v.placeIce && v.placeIce();
      E.note(v, 'ice', { ice: v.ice, t: m.temp });
    } },
  // a cold glass: water vapour from the air condenses on the outside
  { id: 'mist', test: (v) => v.setMist && v.ml > 1 && (v.mix.temp < 16 || v.mist > 0),
    run(v, dt, E) { const k = v.mix.temp < 16 ? dt * E.lapse * 0.004 * (16 - v.mix.temp) / 16 : -dt * E.lapse * 0.002; v.setMist(Math.max(0, Math.min(1, v.mist + k))); if (v.mist > 0.5) E.note(v, 'mist', {}); } },
  // a tube standing in a bath (freezing mixture, hot water): heat flows until both are at the same temperature
  { id: 'bath', test: (v) => v.bath && v.bath.mix,
    run(v, dt, E) { v.mix.temp += (v.bath.mix.temp - v.mix.temp) * Math.min(1, dt * 0.05 * E.lapse); } },
  // water below 0 °C freezes; ice above 0 °C melts (the liquid looks white and solid while frozen)
  { id: 'freeze', test: (v) => !v.noFreeze && v.mix.has('water', 0.3) && (v.mix.temp < -0.5 || (v.frozenK || 0) > 0),
    run(v, dt, E) {
      const was = v.frozenK || 0;
      if (v.mix.temp < -0.5) v.frozenK = Math.min(1, was + dt * E.lapse * 0.02 * Math.min(1, -v.mix.temp / 4)); else if (v.mix.temp > 0.5) v.frozenK = Math.max(0, was - dt * E.lapse * 0.012 * Math.min(1, v.mix.temp / 10));
      if (v.frozenK >= 1 && was < 1) E.note(v, 'frozen', {}); if (v.frozenK <= 0 && was > 0) E.note(v, 'melted', {});
      v.closed = v.frozenK > 0.5 ? true : (v.closedByUser ?? false);
      if (v.frozenK > 0.2 && v.mix.temp > 0.5) v.mix.temp = Math.max(0.5, v.mix.temp - dt * 0.4); // melting ice soaks up heat
    } },
  // sulphur dioxide dissolves in the water in the jar when it is shaken: sulphurous acid
  { id: 'so2_water', test: (v) => (v.gas.SO2 || 0) > 0.005 && v.mix.has('water', 0.3) && (v.shaking || v.stirT > 0 || v.closed),
    run(v, dt) { const d = Math.min(v.gas.SO2, dt * (v.shaking ? 0.6 : 0.08)); v.gas.SO2 -= d; v.mix.add('so2aq', d * 3); v.setFume && v.setFume(Math.min(0.3, v.gas.SO2 * 0.6)); } },
  // lime water left open to the air takes up carbon dioxide slowly and turns milky
  { id: 'air_co2', test: (v) => v.airOpen && v.mix.has('limewater', 0.3),
    run(v, dt, E) { v.gasIn.CO2 = (v.gasIn.CO2 || 0) + dt * E.lapse * 0.0016; } },
  // carbon dioxide trapped in a jar or tumbler meets lime water when it is swirled
  { id: 'jar_co2', test: (v) => (v.gas.CO2 || 0) > 0.01 && v.mix.has('limewater', 0.3) && (v.shaking || v.stirT > 0),
    run(v) { v.gasIn.CO2 = (v.gasIn.CO2 || 0) + Math.min(v.gas.CO2 * 3, Math.max(0, 4 - (v.co2Tot || 0))); v.gas.CO2 = 0; } }, // a jar of the gas shaken with lime water turns it milky (not so much that it clears again)
  // ---------------------------------------------------------- batch 5
  // sodium thiosulphate + hydrochloric acid: sulphur forms slowly as tiny particles (a colloid) — the liquid turns milky pale yellow
  { id: 'thio_acid', test: (v) => v.mix.has('thio', 0.05) && v.mix.has('hcl', 0.02),
    run(v, dt, E) { const d = Math.min(v.mix.liq.thio, v.mix.liq.hcl, dt * E.lapse * 0.004); v.mix.liq.thio -= d; v.mix.liq.hcl -= d; v.mix.ppt.scol = (v.mix.ppt.scol || 0) + d; v.mix.add('nacl', d * 0.5); v.mix.cloud = Math.min(0.55, v.mix.ppt.scol * 0.4); if (Math.random() < dt * 0.6) E.fx.puff(v.mouthWorld(), '#e8e6dc', { alpha: 0.12, size: 0.006, grow: 0.03, life: 1.5 }); E.note(v, 'colloid', { k: v.mix.ppt.scol }); } },
  // iron sulphide + acid: hydrogen sulphide gas (rotten-egg smell)
  { id: 'fes_acid', test: (v) => v.solids.some((s) => s.chem === 'fes' && s.under && s.amount > 0) && (v.mix.has('hcl', 0.2) || v.mix.has('h2so4', 0.2)),
    run(v, dt, E) { for (const s of v.solids) { if (s.chem !== 'fes' || !s.under || s.amount <= 0) continue; E.fx.bubbles_(v, 30, dt, { from: () => s.surfacePoint(), size: 0.0009 }); v.gasOut('H2S', dt * 0.4); s.amount = Math.max(0, s.amount - dt * 0.002); E.note(v, 'h2s', {}); } } },
  // a hot saturated solution of copper sulphate cools: the extra salt comes out as crystals
  { id: 'crystallise', test: (v) => v.xtalBed && v.mix.has('cuso4', 0.05) && v.mix.has('water', 1),
    run(v, dt, E) {
      const S = SOLIDS.cuso4i; const gPerMl = S.spoonG / S.disMl; const cap = S.solub(v.mix.temp) * v.mix.liq.water / 100; const g = v.mix.liq.cuso4 * gPerMl;
      if (g > cap) { const d = Math.min(g - cap, dt * E.lapse * 0.004 * (g - cap + 0.5)); v.mix.liq.cuso4 -= d / gPerMl; v.xtalG = (v.xtalG || 0) + d; v.xtalBed(v.xtalG); E.note(v, 'crystals', { g: v.xtalG }); }
    } },
  // distillation: while acetone is boiling off, the flask stays at about 56 °C; its vapour condenses into the receiver
  { id: 'distil', test: (v) => v.distTo && v.mix.has('acetone', 0.05) && v.mix.temp >= 56,
    run(v, dt, E) {
      const heat = v.bath ? Math.min(1, Math.max(0, v.bath.mix.temp - 56) / 25) : 1; const d = Math.min(v.mix.liq.acetone, dt * E.lapse * 0.15 * heat); v.mix.liq.acetone -= d; v.mix.temp = Math.min(v.mix.temp, 56.5 + Math.random() * 0.4);
      const t = v.distTo; t.mix.add('acetone', d); t.ml = t.mix.ml(); v.distilled = (v.distilled || 0) + d; v.dripT = (v.dripT || 0) + d;
      if (v.dripT > 0.15 && v.dripFrom) { v.dripT = 0; const a = v.dripFrom(); E.fx.drop(a, new THREE.Vector3(a.x, Math.max(t.levelWorld(), t.g.localToWorld(new THREE.Vector3(0, t.inner[0].y, 0)).y), a.z), new THREE.Color('#eef6ff'), () => {}); }
      if (Math.random() < dt * 4) E.fx.bubbles_(v, 20, dt, { size: 0.0009 });
      E.note(v, 'distil', { ml: v.distilled });
    } },
  // ---------------------------------------------------------- batch 4
  // camphor and naphthalene (covalent) dissolve in kerosene, not in water; camphor floats on water
  { id: 'kero', test: (v) => v.solids.some((s) => SOLIDS[s.chem]?.kero && s.amount > 0) && v.ml > 0.3,
    run(v, dt, E) {
      for (const s of v.solids) {
        const S = SOLIDS[s.chem]; if (!S?.kero || s.amount <= 0) continue;
        if (v.mix.has('kerosene', 0.5) && s.under) { const d = Math.min(s.amount, dt * (v.shaking || v.stirT > 0 ? 0.9 : 0.02)); s.amount -= d; s.onAmount && s.onAmount(); v.mix.add('kerosene', d * 0.05); E.note(v, 'dissolve', { chem: s.chem, left: s.amount }); }
        else if (S.floats && v.mix.has('water', 0.5) && s.g.parent === v.g) { const top = v.heightFor(v.ml) - 0.0025; s.g.position.y += (top - s.g.position.y) * Math.min(1, dt * 2); s.localY = 0; }
      }
    } },
  // ---------------------------------------------------------- batch 6 (Class 10)
  // silver chloride in sunlight: grey silver forms on the surface; a covered sample stays white
  { id: 'agcl_light', test: (v) => v.sunBy && v.sunBy.on && !v.dark && v.solids.some((s) => s.chem === 'agcl'),
    run(v, dt, E) { for (const s of v.solids) if (s.chem === 'agcl') { s.grey = Math.min(1, (s.grey || 0) + dt * E.lapse * 0.0009); if (s.mat) s.mat.color.setHex(0xf7f7f2).lerp(new THREE.Color(0x6f6a7a), s.grey); E.note(v, 'agcl_grey', { k: s.grey }); } } },
  // an acid and a base neutralise each other and give out heat (about 7 °C for 20 mL + 20 mL of the dilute acid and alkali):
  // any acid with sodium hydroxide, lime water or milk of magnesia, in proportion to their strength; the salt stays in the water
  { id: 'neut_heat', test: (v) => Object.keys(NEUT_A).some((a) => v.mix.has(a, 0.02)) && Object.keys(NEUT_B).some((b) => v.mix.has(b, 0.02)),
    run(v, dt, E) {
      const m = v.mix; let budget = dt * 0.04; // equivalents per second: mixing alone is enough, it is fast
      for (const b in NEUT_B) for (const a in NEUT_A) {
        if (budget <= 1e-9 || !((m.liq[a] || 0) > 1e-6) || !((m.liq[b] || 0) > 1e-6) || !m.has(a, 0.02) && !m.has(b, 0.02)) continue;
        const ha = SUBS[a].h, hb = -SUBS[b].h; const eq = Math.min(m.liq[a] * ha / 1000, m.liq[b] * hb / 1000, budget); if (eq <= 0) continue; budget -= eq;
        const va = Math.min(m.liq[a], eq * 1000 / ha), vb = Math.min(m.liq[b], eq * 1000 / hb); m.liq[a] -= va; m.liq[b] -= vb;
        m.add(NEUT_S[NEUT_B[b] + NEUT_A[a]] || 'saltaq', va + vb);
        m.temp += eq * 1000 * (SUBS[a].weak ? 11.5 : 13.6) / Math.max(1, m.ml()); E.note(v, 'neutral_heat', { t: m.temp });
      }
    } },
  // barium hydroxide + ammonium chloride (two solids, stirred): they turn slushy, ammonia is given off and it gets very cold
  { id: 'endo', test: (v) => v.solids.some((s) => s.chem === 'baoh2' && s.amount > 0.02) && v.solids.some((s) => s.chem === 'nh4cl' && s.amount > 0.02) && (v.stirT > 0 || v.endoK > 0),
    run(v, dt, E) {
      const a = v.solids.find((s) => s.chem === 'baoh2' && s.amount > 0.02), b = v.solids.find((s) => s.chem === 'nh4cl' && s.amount > 0.02); v.endoK = Math.min(1, (v.endoK || 0) + dt * 0.1);
      const d = Math.min(a.amount, b.amount, dt * E.lapse * 0.05 * (v.stirT > 0 ? 1 : 0.3)); if (v.setMist && v.mix.temp < 0) v.setMist(Math.min(1, (v.mist || 0) + dt * E.lapse * 0.05)); a.amount -= d; b.amount -= d; a.onAmount && a.onAmount(); b.onAmount && b.onAmount(); // frost forms on the outside
      v.mix.add('water', d * 7); v.mix.add('bacl2', d * 1.5); v.mix.ppt.slush = (v.mix.ppt.slush || 0) + d; v.mix.cloud = Math.min(0.88, v.mix.cloud + d * 2); v.mix.temp = Math.max(-20, v.mix.temp - d * 80); v.gas.NH3 = (v.gas.NH3 || 0) + d * 3; // a wet white slush of crystals
      if (Math.random() < dt * 2) E.fx.puff(v.mouthWorld(), '#f4f6f8', { alpha: 0.12, size: 0.008, grow: 0.03, life: 1.6 }); E.note(v, 'cold', { t: v.mix.temp });
    } },
  // copper oxide dissolves in dilute hydrochloric acid: copper chloride, blue-green
  { id: 'cuo_acid', test: (v) => v.solids.some((s) => s.chem === 'cuo' && s.under && s.amount > 0.01) && v.mix.has('hcl', 0.1),
    run(v, dt, E) {
      for (const s of v.solids) { if (s.chem !== 'cuo' || !s.under || s.amount <= 0.01) continue; const k = (v.stirT > 0 ? 1 : 0.25) * (1 + Math.max(0, v.mix.temp - 27) / 12);
        const d = Math.min(s.amount, dt * E.lapse * 0.009 * k); s.amount -= d; if (s.amount < 0.03) { s.amount = 0; s.g.visible = false; } s.onAmount && s.onAmount(); v.mix.liq.hcl = Math.max(0, v.mix.liq.hcl - d * 4); v.mix.add('cucl2', d * 4);
        if (v.stirT > 0) E.fx.flakes_(v, 10, dt, '#262321'); E.note(v, 'cuo_dissolve', { left: s.amount }); }
    } },
  // solid salt + concentrated sulphuric acid: hydrogen chloride gas comes out of the delivery tube (white misty fumes in moist air)
  { id: 'hcl_gas', test: (v) => v.solids.some((s) => s.chem === 'salt' && s.amount > 0.02) && v.mix.has('h2so4c', 0.05),
    run(v, dt, E) {
      const s = v.solids.find((q) => q.chem === 'salt' && q.amount > 0.02); const rate = 0.5 * (1 + Math.max(0, v.mix.temp - 27) / 20);
      E.fx.bubbles_(v, 25 * rate, dt, { from: () => s.surfacePoint(), size: 0.0007 }); s.amount = Math.max(0, s.amount - dt * 0.003 * rate); s.onAmount && s.onAmount();
      v.gasOut('HCl', dt * rate); const at = v.outletWorld ? v.outletWorld() : v.mouthWorld();
      if (Math.random() < dt * 5 * rate) E.fx.puff(at, '#f3f3ef', { alpha: 0.28, size: 0.004, grow: 0.03, life: 1.8, up: 0.03 }); E.note(v, 'hcl_gas', {});
    } },
  // concentrated sulphuric acid added to water: it mixes in swirls and the water gets hot
  { id: 'dil_heat', test: (v) => v.mix.has('h2so4c', 0.005) && (v.mix.liq.water || 0) > 3 * (v.mix.liq.h2so4c || 0),
    run(v, dt, E) { const d = Math.min(v.mix.liq.h2so4c, dt * 0.4); v.mix.liq.h2so4c -= d; v.mix.add('h2so4', d); v.mix.temp += d * 360 / Math.max(1, v.mix.ml()); E.fx.flakes_(v, 40, dt, '#e6eef6'); E.note(v, 'dil_heat', { t: v.mix.temp }); } },
  // sodium / calcium with water (and sodium with ethanol): hydrogen, an alkaline solution, heat
  { id: 'alkali', test: (v) => v.solids.some((s) => SOLIDS[s.chem]?.alkali && s.amount > 0.01) && v.ml > 0.5,
    run(v, dt, E) {
      const m = v.mix; const inW = m.has('water', 0.5) || m.has('tapwater', 0.5); const inE = !inW && m.has('ethanol', 0.5); if (!inW && !inE) return;
      for (const s of v.solids) {
        const S = SOLIDS[s.chem]; if (!S?.alkali || s.amount <= 0.01) continue;
        const k = inW ? 1 : 0.1; const d = Math.min(s.amount, dt * E.lapse * S.alkali * k * 0.04); s.amount -= d; s.onAmount && s.onAmount(); v.gasOut('H2', d * 30);
        const top = v.heightFor(v.ml), bot = v.inner[0].y + 0.003; const p = s.g.position; s.age = (s.age || 0) + dt;
        if (s.chem === 'na' && inW) { // floats, melts into a shiny ball and darts about the surface, hissing
          p.y += (top - 0.0012 - p.y) * Math.min(1, dt * 6); s.vx = (s.vx || 0) + (Math.random() - 0.5) * dt * 0.6; s.vz = (s.vz || 0) + (Math.random() - 0.5) * dt * 0.6; s.vx *= Math.exp(-dt); s.vz *= Math.exp(-dt);
          p.x += s.vx * dt; p.z += s.vz * dt; const R = v.rInner(top) * 0.7; const r = Math.hypot(p.x, p.z); if (r > R) { p.x *= R / r; p.z *= R / r; s.vx *= -0.8; s.vz *= -0.8; }
          m.add('naoh', d * 3); m.temp += d * 30; if (Math.random() < dt * 1.2) E.audio && E.audio.hiss && E.audio.hiss();
          const w = v.g.localToWorld(p.clone()); if (Math.random() < dt * 0.8) E.fx.flashAt(w, 1.2, 0.18, 0xffb000, 0.04); if (Math.random() < dt * 4) E.fx.puff(w, '#f2f2ee', { alpha: 0.2, size: 0.004, grow: 0.02, life: 1.2, up: 0.03 });
          E.fx.bubbles_(v, 30, dt, { from: () => p.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.004, -0.001, (Math.random() - 0.5) * 0.004)), size: 0.0007 });
        } else if (s.chem === 'na') { // in ethanol it sinks and gives a steady stream of small bubbles; no fire
          p.y += (bot - p.y) * Math.min(1, dt * 3); m.temp += d * 25; E.fx.bubbles_(v, 18, dt, { from: () => p.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.003, 0.002, (Math.random() - 0.5) * 0.003)), size: 0.0006 });
        } else { // calcium sinks, then floats up as bubbles of hydrogen stick to it; the water turns milky (slaked lime)
          const yT = s.age > 4 ? top - 0.003 : bot; p.y += (yT - p.y) * Math.min(1, dt * 0.8); m.add('limewater', d * 4); m.ppt.caoh2 = (m.ppt.caoh2 || 0) + d * 0.6; m.cloud = Math.min(0.7, m.cloud + d * 1.6); m.temp += d * 8;
          E.fx.bubbles_(v, 40, dt, { from: () => p.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.006, 0.002, (Math.random() - 0.5) * 0.006)), size: 0.0008 });
        }
        E.note(v, 'alkali', { metal: s.chem, left: s.amount });
      }
    } },
  // magnesium hardly reacts with cold water; with hot water it gives bubbles of hydrogen and starts to float
  { id: 'mg_water', test: (v) => v.solids.some((s) => s.chem === 'mg' && s.under && s.amount > 0) && v.mix.has('water', 0.5) && !v.mix.has('hcl') && !v.mix.has('h2so4'),
    run(v, dt, E) {
      const hot = Math.max(0, Math.min(1, (v.mix.temp - 45) / 40));
      for (const s of v.solids) { if (s.chem !== 'mg' || !s.under) continue; E.fx.bubbles_(v, 0.6 + hot * 22, dt, { from: () => s.surfacePoint(), size: 0.0006 + hot * 0.0003 }); v.gasOut('H2', dt * hot * 0.3);
        v.mix.add('milkmag', dt * hot * 0.004); if (hot > 0.4) { s.g.position.y = Math.min(v.heightFor(v.ml) * 0.5, s.g.position.y + dt * 0.002); s.g.rotation.z = Math.min(1.2, s.g.rotation.z + dt * 0.05); } E.note(v, 'mg_water', { hot }); }
    } },
  // ethanol is oxidised by warm alkaline potassium permanganate: the purple colour disappears until all the ethanol it can oxidise is used up
  { id: 'etoh_ox', test: (v) => v.mix.has('ethanol', 0.1) && v.mix.has('kmno4alk', 0.002),
    run(v, dt, E) { const m = v.mix; const cap = m.liq.ethanol * 0.18 - (v.oxUsed || 0); if (cap <= 0) { E.note(v, 'purple_stays', {}); return; } const warm = Math.max(0.04, Math.min(1.4, (m.temp - 25) / 30));
      const d = Math.min(m.liq.kmno4alk, cap, dt * 0.03 * warm); m.liq.kmno4alk -= d; v.oxUsed = (v.oxUsed || 0) + d; m.ppt.mno2 = (m.ppt.mno2 || 0) + d * 3; m.cloud = Math.min(0.45, m.cloud + d * 2.2); E.note(v, 'decolour', { used: v.oxUsed }); } },
  // ethanol + glacial ethanoic acid with a few drops of concentrated sulphuric acid, warmed: a sweet-smelling ester
  { id: 'ester', test: (v) => v.mix.has('ethanol', 0.05) && v.mix.has('glacial', 0.05) && v.mix.has('h2so4c', 0.005) && v.mix.temp > 45,
    run(v, dt, E) { const m = v.mix; const lim = Math.max(0, 1 - (m.liq.ester || 0) / 1.3); const d = Math.min(m.liq.ethanol, m.liq.glacial, dt * E.lapse * 0.0012 * Math.min(1.5, (m.temp - 40) / 20) * lim); m.liq.ethanol -= d; m.liq.glacial -= d; m.add('ester', d * 1.6); m.add('water', d * 0.3); E.note(v, 'ester', { ml: m.liq.ester }); } },
  // oil and water: shaking breaks the oil into tiny drops (milky); without soap they join again within a minute, with soap they stay (micelles)
  { id: 'emulsion', test: (v) => ['oil', 'moil'].some((k) => v.mix.has(k, 0.02)) && v.mix.has('water', 1),
    run(v, dt, E) { const soap = v.mix.has('soap', 0.03) || v.mix.has('detergent', 0.03); const e0 = v.emul || 0;
      if (v.shaking) v.emul = Math.min(1, e0 + dt * 2); else if (e0 > 0) v.emul = Math.max(0, e0 - dt * E.lapse * (soap ? 0.0015 : 0.045));
      if (v.emul > 0) { v.mix.cloud = Math.max(v.mix.cloud, v.emul * (soap ? 0.72 : 0.5)); if (!soap && !v.shaking) v.mix.cloud = Math.min(v.mix.cloud, v.emul * 0.5); } E.note(v, 'emulsion', { k: v.emul, soap }); } },
  // soap in hard water: calcium and magnesium ions use it up as a curdy scum first, so there is little lather; a detergent still lathers
  { id: 'lather', test: (v) => (v.mix.has('soap', 0.0005) || v.mix.has('detergent', 0.02) || (v.foam || 0) > 0) && v.ml > 2 && v.setFoam,
    run(v, dt, E) { const m = v.mix; const hard = m.has('hardwater', 0.5);
      if (hard && m.has('soap', 0.0005)) { const cap = m.liq.hardwater * 0.02 - (v.scumUsed || 0); if (cap > 0) { const d = Math.min(cap, m.liq.soap, dt * 0.2); m.liq.soap -= d; v.scumUsed = (v.scumUsed || 0) + d; m.ppt.scum = (m.ppt.scum || 0) + d * 3; m.cloud = Math.min(0.55, m.cloud + d * 3); E.fx.flakes_(v, 25, dt, '#efece4'); E.note(v, 'scum', {}); } }
      const sv = (m.liq.soap || 0) + (m.liq.detergent || 0) * 1.1; const f0 = v.foam || 0;
      if (v.shaking) v.setFoam(Math.min(Math.min(0.05, sv * 0.12), f0 + dt * 0.02)); else if (f0 > 0) v.setFoam(Math.max(0, f0 - dt * E.lapse * (hard && !m.has('detergent', 0.02) ? 0.0003 : 0.00004)));
      E.note(v, 'lather', { h: v.foam }); } },
  // castor oil + 20 % sodium hydroxide, stirred (and warmed): saponification — a thick creamy mixture of soap and glycerol
  { id: 'sapon', test: (v) => v.mix.has('castor', 0.2) && v.mix.has('naoh20', 0.2),
    run(v, dt, E) { const m = v.mix; const k = (v.stirT > 0 ? 1 : 0.12) * (1 + Math.max(0, m.temp - 27) / 20); const d = Math.min(m.liq.castor, m.liq.naoh20 * 0.7, dt * E.lapse * 0.006 * k);
      m.liq.castor -= d; m.liq.naoh20 -= d * 0.6; m.add('soapmix', d * 1.6); m.temp = Math.min(48, m.temp + d * 0.5); E.note(v, 'sapon', { left: m.liq.castor }); } },
  // salting out: common salt makes the soap separate and float as a solid curd
  { id: 'saltout', test: (v) => v.mix.has('soapmix', 1) && ((v.saltG || 0) > 0.2 || v.solids.some((s) => s.chem === 'salt' && s.amount > 0.01)),
    run(v, dt, E) { const m = v.mix; for (const s of v.solids) if (s.chem === 'salt' && s.amount > 0) { const d = Math.min(s.amount, dt * (v.stirT > 0 ? 0.25 : 0.03)); s.amount -= d; s.onAmount && s.onAmount(); v.saltG = (v.saltG || 0) + d; }
      const k = Math.min(1, (v.saltG || 0) / 1.5); const d = Math.min(m.liq.soapmix, dt * E.lapse * 0.02 * k); m.liq.soapmix -= d; m.add('lye', d * 0.6); v.curdG = (v.curdG || 0) + d;
      v.setCurd && v.setCurd(Math.min(1, v.curdG / 30)); E.note(v, 'curd', { k: v.curdG }); } },
  // sodium carbonate / hydrogencarbonate solution + acid: fizzing carbon dioxide
  { id: 'carbsol_acid', test: (v) => (v.mix.has('washingsoda', 0.05) || v.mix.has('bakingsoda', 0.05)) && ['hcl', 'h2so4', 'ethanoic', 'vinegar', 'lemon'].some((a) => v.mix.has(a, 0.05)),
    run(v, dt, E) { const m = v.mix; const c = m.has('washingsoda', 0.05) ? 'washingsoda' : 'bakingsoda'; const a = ['hcl', 'h2so4', 'ethanoic', 'vinegar', 'lemon'].find((x) => m.has(x, 0.05));
      const d = Math.min(m.liq[c], m.liq[a], dt * 1.5); m.liq[c] -= d; m.liq[a] -= d * 0.5; m.add('nacl', d * 0.8); E.fx.bubbles_(v, 60, dt, { size: 0.001 }); v.gasOut('CO2', d * 2.5); E.note(v, 'co2', {}); } },
  // a thistle funnel: what is poured in runs down at once into the flask
  { id: 'drain_fast', test: (v) => v.drainFast && v.drainTo && v.ml > 0.01,
    run(v, dt) { const t = v.drainTo; const p = v.mix.take(Math.min(v.ml, dt * 8)); t.mix.put(p); t.ml = t.mix.ml(); } },
  // an upright gas jar fed by a delivery tube collects the gas (carbon dioxide is heavier than air and stays in)
  { id: 'collect', test: (v) => v.collects && Object.keys(v.gasIn).some((g) => g !== 'air' && v.gasIn[g] > 0) && !v.mix.has('limewater', 0.3),
    run(v) { for (const g in v.gasIn) { if (g === 'air') continue; v.gas[g] = Math.min(v.gasCap ?? 30, (v.gas[g] || 0) + v.gasIn[g]); v.gasIn[g] = 0; } } },
];

// heating rules: called when a vessel is above a flame
export function heatTick(v, dt, E) { CTX.rule++; try { heatTick0(v, dt, E); } finally { CTX.rule--; } }
function heatTick0(v, dt, E) {
  const m = v.mix;
  // liquids warm up and boil
  if (m.ml() > 0.2) {
    const ml = m.ml(); m.temp = Math.min(v.maxT ?? 100, m.temp + dt * Math.max(9 * (8 / Math.max(4, ml)), ml > 40 ? 110 / ml : 0)); // maxT: a water bath kept at about 60 °C by turning the flame down; a big beaker takes minutes, as on a real burner
    const T = m.temp;
    if (T >= 99) { const d = Math.min(m.liq.water || 0, dt * 0.15 * (v.evapK ?? 1)); if (d > 0) m.liq.water -= d; E.fx.bubbles_(v, 50, dt, { size: 0.0013 }); if (Math.random() < dt * 6) E.fx.puff(v.mouthWorld(), '#ffffff', { alpha: 0.3, size: 0.01, grow: 0.06 }); E.note(v, 'boil', {}); }
    else {
      // as it warms you can see it: tiny bubbles of air form on the bottom (from about 40 °C), more and bigger near boiling,
      // and wisps of steam rise from the surface (from about 55 °C)
      if (T > 40) E.fx.bubbles_(v, 2 + (T - 40) * (T > 70 ? 0.35 : 0.12), dt, { size: T > 80 ? 0.0008 : 0.0005 });
      if (T > 55 && Math.random() < dt * (T - 55) / 14) E.fx.puff(v.mouthWorld(), '#ffffff', { alpha: 0.08 + (T - 55) / 240, size: 0.008, grow: 0.05, life: 2.2 });
      if (T > 45) E.note(v, 'warming', { t: T });
    }
  }
  // the last of the water boils away: dissolved salt is left behind as a white crust
  if (m.temp >= 99 && (m.liq.water || 0) < 0.25 && (m.liq.nacl || 0) > 0.01 && !v.dry) {
    v.dry = true; m.liq.water = 0; const salt = m.liq.nacl; m.liq.nacl = 0; v.ml = m.ml(); E.audio && E.audio.crackle && E.audio.crackle();
    E.note(v, 'dry', { salt }); v.onDry && v.onDry(salt);
  }
  for (const s of v.solids) {
    const S = SOLIDS[s.chem] || {};
    if (S.stages && m.ml() < 0.3) { // sugar: melts, browns (caramel), then chars black; water drops form at the mouth
      s.stage = Math.min(S.stages.length - 1, (s.stage || 0) + dt * 0.045); s.onStage && s.onStage(s.stage);
      if (s.stage > 1) { v.condense = Math.min(1, (v.condense || 0) + dt * 0.05); if (Math.random() < dt * 6) E.fx.puff(v.mouthWorld(), s.stage > 2 ? '#6a6a66' : '#e8e4da', { alpha: 0.35, size: 0.01, grow: 0.07, life: 2.6 }); }
      E.note(v, 'sugar_heat', { stage: s.stage });
    }
    if (S.sub && s.amount > 0) { // sublimation: solid turns straight into white vapour, which turns solid again on the cool funnel
      const d = Math.min(s.amount, dt * 0.03); s.amount -= d; s.onAmount && s.onAmount();
      if (Math.random() < dt * 10) E.fx.puff(v.mouthWorld(), '#f6f6f2', { alpha: 0.45, size: 0.012, grow: 0.06, life: 2.2, up: v.funnel ? 0.05 : 0.12 });
      if (v.funnel) { v.funnel.deposit = Math.min(1, (v.funnel.deposit || 0) + d * 1.6); v.funnel.onDeposit && v.funnel.onDeposit(v.funnel.deposit); }
      E.note(v, 'sublime', { left: s.amount });
    }
    if (s.chem === 'cuso4x') { // blue crystals -> white powder + water drops near the mouth
      s.white = Math.min(1, (s.white || 0) + dt * 0.06); s.onWhite && s.onWhite(s.white);
      if (s.white < 0.9) { v.condense = Math.min(1, (v.condense || 0) + dt * 0.08); if (Math.random() < dt * 2) E.fx.puff(v.mouthWorld(), '#ffffff', { alpha: 0.12, size: 0.008, grow: 0.03 }); }
      E.note(v, 'cuso4_white', { w: s.white });
    }
    if (s.chem === 'feso4x') { // green -> white (water lost) -> brown Fe2O3, gases with burning-sulphur smell
      s.stage = Math.min(2, (s.stage || 0) + dt * 0.05); s.onStage && s.onStage(s.stage);
      if (s.stage < 1) { v.condense = Math.min(1, (v.condense || 0) + dt * 0.06); }
      else if (Math.random() < dt * 9) E.fx.puff(v.mouthWorld(), '#f2f2ee', { alpha: 0.4, size: 0.012, grow: 0.08, life: 3 });
      E.note(v, 'feso4_heat', { stage: s.stage });
    }
    if (S.heatFeS && m.ml() < 0.3) { // iron + sulphur: a red glow starts at one spot and spreads through the mass by itself; it becomes black iron sulphide
      s.stage = Math.min(2, (s.stage || 0) + dt * (s.stage > 0.5 ? 0.09 : 0.05)); const st = s.stage; const glow = st < 0.5 ? 0 : st < 1.4 ? Math.min(1, (st - 0.5) * 2) : Math.max(0, (2 - st) * 1.6);
      if (s.mat) { s.mat.emissive = s.mat.emissive || new THREE.Color(); s.mat.emissive.setHex(0xff4a12); s.mat.emissiveIntensity = glow * 1.8; s.mat.color.setHex(0xffffff).lerp(new THREE.Color(0x3a3430), Math.min(1, Math.max(0, st - 0.6) / 1.2)); }
      if (glow > 0.2 && Math.random() < dt * 8) E.fx.puff(v.mouthWorld(), Math.random() < 0.3 ? '#8fb0ff' : '#ece8de', { alpha: 0.3, size: 0.01, grow: 0.05, life: 2.2 });
      if (st >= 2 && s.chem !== 'fes') { s.chem = 'fes'; s.name = SOLIDS.fes.n; E.note(v, 'fes_made', {}); }
      E.note(v, 'fes_heat', { stage: st });
    }
    if (S.cuOx && m.ml() < 0.3 && !s.done) { // copper powder heated in air: a black coat of copper(II) oxide forms
      s.ox = Math.min(1, (s.ox || 0) + dt * 0.02); if (s.mat) s.mat.color.setHex(0xb87333).lerp(new THREE.Color(0x232120), s.ox);
      if (s.ox >= 1 && s.chem !== 'cuo') { s.chem = 'cuo'; s.name = SOLIDS.cuo.n; } E.note(v, 'cu_black', { k: s.ox });
    }
    if (s.chem === 'cuo' && (v.gasIn?.H2 || 0) > 0) { // hot copper oxide + hydrogen: back to reddish-brown copper, and water drops form higher up
      v.gasIn.H2 = 0; s.red = Math.min(1, (s.red || 0) + dt * 0.035); if (s.mat) s.mat.color.setHex(0x232120).lerp(new THREE.Color(0xb05f32), s.red); v.condense = Math.min(1, (v.condense || 0) + dt * 0.03);
      if (s.red >= 1) { s.chem = 'cupow'; s.ox = 0; s.name = SOLIDS.cupow.n; s.done = true; } E.note(v, 'cuo_h2', { k: s.red });
    }
    if (s.chem === 'nahco3' && m.ml() < 0.3) { // dry baking soda on heating: carbon dioxide and water vapour (washing soda gives no gas)
      s.dec = Math.min(1, (s.dec || 0) + dt * 0.03); if (s.dec < 1) { v.gasOut('CO2', dt * 0.5); v.condense = Math.min(1, (v.condense || 0) + dt * 0.04); } E.note(v, 'nahco3_heat', { k: s.dec });
    }
    if (s.chem === 'pbno3s') { // crackling, brown NO2 fumes, yellow PbO left
      s.stage = Math.min(1, (s.stage || 0) + dt * 0.06); s.onStage && s.onStage(s.stage);
      if (s.stage > 0.15 && Math.random() < dt * 12) E.fx.puff(v.mouthWorld(), '#8a3b12', { alpha: 0.55, size: 0.014, grow: 0.09, life: 3.2 });
      if (Math.random() < dt * 4 && s.stage < 0.6) E.audio && E.audio.crackle && E.audio.crackle();
      E.note(v, 'pbno3_heat', { stage: s.stage });
    }
  }
}

export class Chem {
  constructor(fx, audio) { this.fx = fx; this.audio = audio; this.lapse = 1; this.listeners = []; }
  note(v, type, d) { for (const f of this.listeners) f(v, type, d); }
  tick(vessels, dt) {
    for (const v of vessels) {
      if (!v.mix) continue;
      // solids are "under" the liquid if the liquid covers them
      const h = v.heightFor(v.ml);
      for (const s of v.solids) s.under = v.ml > 0.3 && (s.localY ?? 0.005) < h;
      CTX.rule++; try { for (const r of RULES) if (r.test(v)) r.run(v, dt, this); } finally { CTX.rule--; }
      // cool down towards room temperature; settle precipitate
      if (!v.bath) v.mix.temp += (27 - v.mix.temp) * Math.min(1, dt * 0.02 * (v.coolLapse ? this.lapse : 1)); // a tube standing in a bath follows the bath instead
      if (v.stirT > 0) v.stirT -= dt;
      if (v.mix.cloud > 0 && !v.shaking && !(v.stirT > 0)) { let sw = 0, sk = 0; for (const p in v.mix.ppt) { const m = v.mix.ppt[p]; sw += m; sk += m * (PPT[p]?.settle ?? 0.02); } const k = v.settle ?? (sw > 0 ? sk / sw : 0.02); const d = Math.min(v.mix.cloud, v.mix.cloud * dt * k * this.lapse); v.mix.cloud -= d; v.mix.sed = Math.min(0.012, v.mix.sed + d * 0.004 * Object.values(v.mix.ppt).reduce((a, b) => a + b, 0)); }
      v.ml = v.mix.ml();
      const L = v.mix.look(); v.color.copy(L.color); v.alpha = L.alpha;
      if (v.frozenK > 0) { v.color.lerp(C('#f4f9ff'), 0.75 * v.frozenK); v.alpha = Math.max(v.alpha, 0.3 + 0.55 * v.frozenK); L.cloud = Math.max(L.cloud, 0.55 * v.frozenK); L.cloudC = C('#f6fbff'); }
      const u = v.liqMat.userData.u; u.uCloud.value = Math.min(0.95, L.cloud); u.uCloudCol.value.copy(L.cloudC);
      u.uSed.value = v.mix.sed > 0.0003 ? v.inner[0].y + v.mix.sed : -1; if (L.pptCol) u.uSedCol.value.copy(L.pptCol); // no sediment: -1 never matches the bottom (avoids a flickering star)
      // gas collects at the mouth and slowly escapes
      if (!v.holdGas) for (const g in v.gas) { v.gas[g] *= Math.exp(-dt * 0.12); if (v.gas[g] < 1e-4) delete v.gas[g]; }
    }
  }
}
