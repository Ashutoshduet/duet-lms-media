// Chemistry engine: what is in each vessel, its pH and colour, and the reactions that happen when
// substances meet (gas, precipitate, colour change, heat). Colours and behaviour follow school lab results.
import * as THREE from 'three';

const C = (h) => new THREE.Color(h);
// liquids / solutions. h = equivalents of acid (+) or base (-) per litre; pH = pH of the pure solution
export const SUBS = {
  water: { f: 'H₂O', n: { en: 'Water', hi: 'पानी', hg: 'Paani' }, c: '#dceeff', a: 0.16, pH: 7 },
  hcl: { f: 'HCl', n: { en: 'Dilute hydrochloric acid', hi: 'तनु हाइड्रोक्लोरिक अम्ल', hg: 'Dilute hydrochloric acid' }, c: '#e8f2ff', a: 0.18, h: 1, pH: 0.3 },
  h2so4: { f: 'H₂SO₄', n: { en: 'Dilute sulphuric acid', hi: 'तनु सल्फ्यूरिक अम्ल', hg: 'Dilute sulphuric acid' }, c: '#eef3ff', a: 0.18, h: 2, pH: 0.2 },
  naoh: { f: 'NaOH', n: { en: 'Sodium hydroxide solution', hi: 'सोडियम हाइड्रॉक्साइड विलयन', hg: 'Sodium hydroxide solution' }, c: '#eef6ff', a: 0.18, h: -1, pH: 13.5 },
  vinegar: { f: 'CH₃COOH', n: { en: 'Vinegar (acetic acid)', hi: 'सिरका (एसीटिक अम्ल)', hg: 'Sirka (acetic acid)' }, c: '#f6f1df', a: 0.2, h: 0.8, pH: 2.8, weak: true },
  lemon: { f: 'Lemon juice', n: { en: 'Lemon juice', hi: 'नींबू का रस', hg: 'Nimbu ka ras' }, c: '#f1ea9e', a: 0.42, h: 0.3, pH: 2.3, weak: true, cloud: 0.18, cloudC: '#f7f1c8' },
  soap: { f: 'Soap solution', n: { en: 'Soap solution', hi: 'साबुन का घोल', hg: 'Sabun ka ghol' }, c: '#eef0ee', a: 0.45, h: -0.02, pH: 10, weak: true, cloud: 0.32, cloudC: '#f4f5f2' },
  bakingsoda: { f: 'NaHCO₃', n: { en: 'Baking soda solution', hi: 'खाने के सोडे का घोल', hg: 'Baking soda solution' }, c: '#f2f6fa', a: 0.2, h: -0.05, pH: 8.3, weak: true },
  washingsoda: { f: 'Na₂CO₃', n: { en: 'Washing soda solution', hi: 'धोने के सोडे का घोल', hg: 'Washing soda solution' }, c: '#f2f6fa', a: 0.2, h: -0.3, pH: 11.5, weak: true },
  milkmag: { f: 'Mg(OH)₂', n: { en: 'Milk of magnesia', hi: 'मिल्क ऑफ़ मैग्नेशिया', hg: 'Milk of magnesia' }, c: '#f7f7f4', a: 0.6, h: -0.2, pH: 10.5, weak: true, cloud: 0.85, cloudC: '#f8f8f5' },
  limewater: { f: 'Ca(OH)₂', n: { en: 'Lime water', hi: 'चूने का पानी', hg: 'Lime water' }, c: '#f2f6fa', a: 0.18, h: -0.04, pH: 12.4, weak: true },
  cuso4: { f: 'CuSO₄', n: { en: 'Copper sulphate solution', hi: 'कॉपर सल्फेट विलयन', hg: 'Copper sulphate solution' }, c: '#1f7fe0', a: 0.62, pH: 4.2, weak: true, h: 0.002 },
  feso4: { f: 'FeSO₄', n: { en: 'Ferrous sulphate solution', hi: 'फेरस सल्फेट विलयन', hg: 'Ferrous sulphate solution' }, c: '#a8d29a', a: 0.38, pH: 4, weak: true, h: 0.002 },
  znso4: { f: 'ZnSO₄', n: { en: 'Zinc sulphate solution', hi: 'जिंक सल्फेट विलयन', hg: 'Zinc sulphate solution' }, c: '#eef4fa', a: 0.18, pH: 5, weak: true, h: 0.001 },
  zncl2: { f: 'ZnCl₂', n: { en: 'Zinc chloride solution', hi: 'जिंक क्लोराइड विलयन', hg: 'Zinc chloride solution' }, c: '#eef4fa', a: 0.18, pH: 5, weak: true },
  fecl2: { f: 'FeCl₂', n: { en: 'Iron(II) chloride solution', hi: 'फेरस क्लोराइड विलयन', hg: 'Ferrous chloride solution' }, c: '#cfe5bf', a: 0.3, pH: 4, weak: true },
  mgcl2: { f: 'MgCl₂', n: { en: 'Magnesium chloride solution', hi: 'मैग्नीशियम क्लोराइड विलयन', hg: 'Magnesium chloride solution' }, c: '#eef4fa', a: 0.18, pH: 6.5, weak: true },
  nacl: { f: 'NaCl', n: { en: 'Salt solution', hi: 'नमक का घोल', hg: 'Namak ka ghol' }, c: '#e6f1fb', a: 0.17, pH: 7 },
  pbno3: { f: 'Pb(NO₃)₂', n: { en: 'Lead nitrate solution', hi: 'लेड नाइट्रेट विलयन', hg: 'Lead nitrate solution' }, c: '#eef4fa', a: 0.18, pH: 4.5, weak: true },
  ki: { f: 'KI', n: { en: 'Potassium iodide solution', hi: 'पोटैशियम आयोडाइड विलयन', hg: 'Potassium iodide solution' }, c: '#f2f6f8', a: 0.18, pH: 7 },
  kno3: { f: 'KNO₃', n: { en: 'Potassium nitrate solution', hi: 'पोटैशियम नाइट्रेट विलयन', hg: 'Potassium nitrate solution' }, c: '#eef4fa', a: 0.17, pH: 7 },
  bacl2: { f: 'BaCl₂', n: { en: 'Barium chloride solution', hi: 'बेरियम क्लोराइड विलयन', hg: 'Barium chloride solution' }, c: '#eef4fa', a: 0.18, pH: 7 },
  na2so4: { f: 'Na₂SO₄', n: { en: 'Sodium sulphate solution', hi: 'सोडियम सल्फेट विलयन', hg: 'Sodium sulphate solution' }, c: '#eef4fa', a: 0.18, pH: 7 },
  agno3: { f: 'AgNO₃', n: { en: 'Silver nitrate solution', hi: 'सिल्वर नाइट्रेट विलयन', hg: 'Silver nitrate solution' }, c: '#f2f5f8', a: 0.18, pH: 6 },
  oil: { f: 'Oil', n: { en: 'Oil layer', hi: 'तेल की परत', hg: 'Tel ki layer' }, c: '#e9c86a', a: 0.4, pH: 7, float: true },
  sugar: { f: 'C₁₂H₂₂O₁₁', n: { en: 'Sugar solution', hi: 'चीनी का घोल', hg: 'Cheeni ka ghol' }, c: '#f2f6f8', a: 0.17, pH: 7 },
  milk: { f: 'Milk + water', n: { en: 'Dilute milk (colloid)', hi: 'पतला दूध (कोलॉइड)', hg: 'Patla doodh (colloid)' }, c: '#eef2f7', a: 0.5, pH: 6.7, cloud: 0.42, cloudC: '#eef2f8', colloid: true },
  kmno4: { f: 'KMnO₄', n: { en: 'Potassium permanganate (dissolved)', hi: 'पोटैशियम परमैंगनेट (घुला हुआ)', hg: 'Potassium permanganate (ghula hua)' }, c: '#9b2fae', a: 0.8, pH: 7, dye: 900 },
  h2so4c: { f: 'H₂SO₄ (conc.)', n: { en: 'Concentrated sulphuric acid', hi: 'सांद्र सल्फ्यूरिक अम्ल', hg: 'Concentrated sulphuric acid' }, c: '#f4f1e6', a: 0.22, h: 6, pH: 0 },
  // indicators (strong colour, small amounts)
  phenol: { f: 'Phenolphthalein', n: { en: 'Phenolphthalein', hi: 'फीनॉलफ्थेलिन', hg: 'Phenolphthalein' }, c: '#f8f8f8', a: 0.12, ind: 'phenol' },
  methylorange: { f: 'Methyl orange', n: { en: 'Methyl orange', hi: 'मेथिल ऑरेंज', hg: 'Methyl orange' }, c: '#f08a24', a: 0.8, ind: 'mo' },
  litmus: { f: 'Litmus', n: { en: 'Litmus solution', hi: 'लिटमस विलयन', hg: 'Litmus solution' }, c: '#7a4f9a', a: 0.8, ind: 'litmus' },
  universal: { f: 'Universal indicator', n: { en: 'Universal indicator', hi: 'सार्वत्रिक सूचक', hg: 'Universal indicator' }, c: '#3e9d4a', a: 0.8, ind: 'ui' },
  turmeric: { f: 'Turmeric', n: { en: 'Turmeric solution', hi: 'हल्दी का घोल', hg: 'Haldi ka ghol' }, c: '#e8b422', a: 0.75, ind: 'turmeric' },
  chinarose: { f: 'China rose', n: { en: 'China rose indicator', hi: 'गुड़हल सूचक', hg: 'China rose (gudhal) indicator' }, c: '#c8507a', a: 0.7, ind: 'chinarose' },
};
// precipitates
export const PPT = {
  baso4: { f: 'BaSO₄', c: '#f6f6f2', n: { en: 'white precipitate of barium sulphate', hi: 'बेरियम सल्फेट का सफ़ेद अवक्षेप', hg: 'barium sulphate ka white precipitate' } },
  pbi2: { f: 'PbI₂', c: '#f3cf24', n: { en: 'yellow precipitate of lead iodide', hi: 'लेड आयोडाइड का पीला अवक्षेप', hg: 'lead iodide ka yellow precipitate' } },
  caco3: { f: 'CaCO₃', c: '#f7f7f4', n: { en: 'white calcium carbonate (milkiness)', hi: 'कैल्शियम कार्बोनेट (दूधियापन)', hg: 'calcium carbonate (milkiness)' } },
  agcl: { f: 'AgCl', c: '#f2f2ee', n: { en: 'white curdy precipitate of silver chloride', hi: 'सिल्वर क्लोराइड का सफ़ेद दही जैसा अवक्षेप', hg: 'silver chloride ka white curdy precipitate' } },
  cuoh2: { f: 'Cu(OH)₂', c: '#79b4ea', n: { en: 'pale blue precipitate of copper hydroxide', hi: 'कॉपर हाइड्रॉक्साइड का हल्का नीला अवक्षेप', hg: 'copper hydroxide ka light blue precipitate' } },
  chalk: { f: 'CaCO₃', c: '#eeece6', settle: 0.035, n: { en: 'chalk powder (not dissolved)', hi: 'चॉक पाउडर (घुला नहीं)', hg: 'chalk powder (ghula nahi)' } },
  sand: { f: 'SiO₂', c: '#c2a878', settle: 1.4, n: { en: 'sand (settled at the bottom)', hi: 'रेत (नीचे बैठ गई)', hg: 'ret (neeche baith gayi)' } },
  caoh2: { f: 'Ca(OH)₂', c: '#f6f5f0', n: { en: 'slaked lime (milky)', hi: 'बुझा हुआ चूना (दूधिया)', hg: 'slaked lime (milky)' } },
};
// solids that can be put into vessels
export const SOLIDS = {
  zn: { f: 'Zn', n: { en: 'Zinc granules', hi: 'ज़िंक के दाने', hg: 'Zinc granules' }, color: 0x9ea3a8, metal: 0.75, react: 1 },
  mg: { f: 'Mg', n: { en: 'Magnesium ribbon', hi: 'मैग्नीशियम रिबन', hg: 'Magnesium ribbon' }, color: 0xc9ccd0, react: 3 },
  fe: { f: 'Fe', n: { en: 'Iron', hi: 'लोहा', hg: 'Iron (loha)' }, color: 0x8d9196, react: 0.35 },
  al: { f: 'Al', n: { en: 'Aluminium', hi: 'एल्युमिनियम', hg: 'Aluminium' }, color: 0xd5d8dc, react: 1.4 },
  cu: { f: 'Cu', n: { en: 'Copper turnings', hi: 'ताँबे के टुकड़े', hg: 'Copper turnings' }, color: 0xb86a3c, react: 0 },
  na2co3: { f: 'Na₂CO₃', n: { en: 'Sodium carbonate', hi: 'सोडियम कार्बोनेट', hg: 'Sodium carbonate' }, color: 0xf7f7f3, carb: 2.4 },
  nahco3: { f: 'NaHCO₃', n: { en: 'Sodium hydrogencarbonate (baking soda)', hi: 'सोडियम हाइड्रोजन कार्बोनेट (खाने का सोडा)', hg: 'Baking soda (NaHCO₃)' }, color: 0xfafaf7, carb: 3 },
  caco3: { f: 'CaCO₃', n: { en: 'Marble chips', hi: 'संगमरमर के टुकड़े', hg: 'Marble chips' }, color: 0xeeebe4, carb: 0.8 },
  cao: { f: 'CaO', n: { en: 'Quick lime', hi: 'बिना बुझा चूना', hg: 'Quick lime (chuna)' }, color: 0xf2f0ea },
  cuso4x: { f: 'CuSO₄·5H₂O', n: { en: 'Copper sulphate crystals', hi: 'कॉपर सल्फेट के क्रिस्टल', hg: 'Copper sulphate crystals' }, color: 0x2a7ad8 },
  feso4x: { f: 'FeSO₄·7H₂O', n: { en: 'Ferrous sulphate crystals', hi: 'फेरस सल्फेट के क्रिस्टल', hg: 'Ferrous sulphate crystals' }, color: 0x9fcf8a },
  sugar: { f: 'C₁₂H₂₂O₁₁', n: { en: 'Sugar', hi: 'चीनी', hg: 'Cheeni' }, color: 0xfbfbf8, dis: 'sugar', disK: 1.6, stages: ['#fbfbf8', '#f1d58a', '#8b5a2b', '#1a1a1a'] },
  salt: { f: 'NaCl', n: { en: 'Common salt', hi: 'नमक', hg: 'Namak' }, color: 0xfafafa, dis: 'nacl', disK: 1.8 },
  chalk: { f: 'CaCO₃', n: { en: 'Chalk powder', hi: 'चॉक पाउडर', hg: 'Chalk powder' }, color: 0xf3f1ea, insol: 'chalk' },
  sand: { f: 'SiO₂', n: { en: 'Sand', hi: 'रेत', hg: 'Ret (sand)' }, color: 0xc2a878, insol: 'sand' },
  kmno4: { f: 'KMnO₄', n: { en: 'Potassium permanganate crystal', hi: 'पोटैशियम परमैंगनेट का क्रिस्टल', hg: 'Potassium permanganate crystal' }, color: 0x3a0f3e, dis: 'kmno4', disK: 0.3, still: true },
  nh4cl: { f: 'NH₄Cl', n: { en: 'Ammonium chloride', hi: 'अमोनियम क्लोराइड', hg: 'Ammonium chloride' }, color: 0xf7f7f4, sub: true },
  cacl2: { f: 'CaCl₂', n: { en: 'Anhydrous calcium chloride', hi: 'निर्जल कैल्शियम क्लोराइड', hg: 'Anhydrous calcium chloride' }, color: 0xf6f5f0 },
  pbno3s: { f: 'Pb(NO₃)₂', n: { en: 'Lead nitrate powder', hi: 'लेड नाइट्रेट पाउडर', hg: 'Lead nitrate powder' }, color: 0xf5f5f2 },
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
    default: return null;
  }
}
// strip colour after dipping (litmus papers, pH paper, turmeric paper)
export function stripColor(kind, pH) {
  if (kind === 'blue') return pH < 5 ? C('#d0424a') : C('#4e6fbf');
  if (kind === 'red') return pH > 8 ? C('#4e6fbf') : C('#d0424a');
  if (kind === 'ph') return uiColor(pH);
  if (kind === 'turmeric') return pH > 8 ? C('#b5361f') : C('#e8b422');
  return C('#ffffff');
}

// ------------------------------------------------------------------ mixture in a vessel
export class Mix {
  constructor() { this.liq = {}; this.ppt = {}; this.temp = 27; this.gas = {}; this.sed = 0; this.cloud = 0; this.events = []; }
  ml() { let s = 0; for (const k in this.liq) s += this.liq[k]; return s; }
  add(sub, ml) { this.liq[sub] = (this.liq[sub] || 0) + ml; }
  take(ml) { // remove a well-mixed portion
    const tot = this.ml(); if (tot <= 0) return null; const f = Math.min(1, ml / tot); const out = { liq: {}, ppt: {}, cloud: this.cloud };
    for (const k in this.liq) { const d = this.liq[k] * f; out.liq[k] = d; this.liq[k] -= d; if (this.liq[k] < 1e-6) delete this.liq[k]; }
    for (const k in this.ppt) { const d = this.ppt[k] * f * Math.min(1, this.cloud + 0.15); out.ppt[k] = d; this.ppt[k] -= d; }
    return out;
  }
  put(p, ml) { if (!p) return; for (const k in p.liq) this.add(k, p.liq[k]); for (const k in p.ppt) { this.ppt[k] = (this.ppt[k] || 0) + p.ppt[k]; this.cloud = Math.max(this.cloud, p.cloud * 0.9); } void ml; }
  has(sub, min = 0.05) { return (this.liq[sub] || 0) > min; }
  pH() {
    const tot = this.ml(); if (tot <= 0) return 7;
    let net = 0, strong = 0, wAcid = 0, wBase = 0, wNeut = 0, pHw = 0;
    for (const k in this.liq) {
      const s = SUBS[k]; if (!s || s.ind) continue; const v = this.liq[k];
      if (s.h) { const eq = s.h * v / 1000; net += eq; if (!s.weak) strong += Math.abs(eq); }
      if (s.pH != null) { if (s.pH < 6.5) wAcid += v; else if (s.pH > 7.5) wBase += v; else wNeut += v; pHw += s.pH * v; }
    }
    const L = tot / 1000;
    if (strong > 1e-6 || Math.abs(net) > 1e-4) {
      // strong acid / base dominates: use the excess
      const c = Math.abs(net) / L;
      if (c < 1e-7) return 7;
      if (strong < 1e-6) { // only weak species: log-mix pH of the components
        return pHw / Math.max(1e-6, wAcid + wBase + wNeut);
      }
      const p = -Math.log10(Math.max(c, 1e-7)); return net > 0 ? Math.max(0, p) : Math.min(14, 14 - p);
    }
    return pHw / Math.max(1e-6, wAcid + wBase + wNeut);
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
      const strength = v * (0.25 + s.a * 2.5); const c = C(s.c); r += c.r * strength; g += c.g * strength; b += c.b * strength; w += strength; a += s.a * v;
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
        const salt = { zn: acid === 'hcl' ? 'zncl2' : 'znso4', fe: acid === 'hcl' ? 'fecl2' : 'feso4', mg: 'mgcl2', al: 'zncl2' }[s.chem];
        if (salt) v.mix.add(salt, used * 0.6);
        v.mix.temp += rate * dt * (s.chem === 'mg' ? 0.5 : 0.25);
        E.note(v, 'h2', { metal: s.chem });
        s.onAmount && s.onAmount();
      }
    } },
  // carbonate + acid -> CO2 (fizzing)
  { id: 'carb_acid', test: (v) => v.solids.some((s) => s.chem && SOLIDS[s.chem].carb && s.amount > 0) && (v.mix.has('hcl') || v.mix.has('h2so4') || v.mix.has('vinegar') || v.mix.has('lemon')),
    run(v, dt, E) {
      const acid = ['hcl', 'h2so4', 'vinegar', 'lemon'].find((a) => v.mix.has(a));
      for (const s of v.solids) {
        const S = SOLIDS[s.chem]; if (!S?.carb || s.amount <= 0 || !s.under) continue;
        const rate = S.carb * Math.min(1, v.mix.liq[acid] / 2) * (SUBS[acid].weak ? 0.6 : 1);
        E.fx.bubbles_(v, 30 + rate * 60, dt, { size: 0.0009 });
        if (rate > 1.5) for (let i = 0; i < 2; i++) E.fx.bubbles_(v, 40, dt, { size: 0.0012 });
        v.gasOut('CO2', rate * dt);
        const used = rate * dt * 0.006; s.amount = Math.max(0, s.amount - used); v.mix.liq[acid] = Math.max(0, v.mix.liq[acid] - used * 0.5);
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
  { id: 'ppt', test: (v) => (v.mix.has('bacl2', 0.01) && v.mix.has('na2so4', 0.01)) || (v.mix.has('pbno3', 0.01) && v.mix.has('ki', 0.01)) || (v.mix.has('agno3', 0.01) && (v.mix.has('nacl', 0.01) || v.mix.has('hcl', 0.01))) || (v.mix.has('cuso4', 0.01) && v.mix.has('naoh', 0.01)),
    run(v, dt, E) {
      const pairs = [['bacl2', 'na2so4', 'baso4', 'nacl'], ['pbno3', 'ki', 'pbi2', 'kno3'], ['agno3', 'nacl', 'agcl', 'kno3'], ['agno3', 'hcl', 'agcl', 'kno3'], ['cuso4', 'naoh', 'cuoh2', 'na2so4']];
      for (const [a, b, p, s] of pairs) {
        if (!v.mix.has(a, 0.01) || !v.mix.has(b, 0.01)) continue;
        const d = Math.min(v.mix.liq[a], v.mix.liq[b], dt * 6);
        v.mix.liq[a] -= d; v.mix.liq[b] -= d; v.mix.ppt[p] = (v.mix.ppt[p] || 0) + d; v.mix.add(s, d * 1.6);
        v.mix.cloud = Math.min(0.92, v.mix.cloud + d * 0.35); E.fx.flakes_(v, 25, dt, PPT[p].c); E.note(v, 'ppt', { ppt: p });
      }
    } },
  // quick lime + water: hissing, hot, milky slaked lime
  { id: 'cao_water', test: (v) => v.solids.some((s) => s.chem === 'cao' && s.amount > 0 && s.under) && v.mix.has('water', 0.5),
    run(v, dt, E) {
      for (const s of v.solids) { if (s.chem !== 'cao' || s.amount <= 0 || !s.under) continue;
        const d = Math.min(s.amount, dt * 0.08); s.amount -= d; s.onAmount && s.onAmount();
        v.mix.temp = Math.min(82, v.mix.temp + d * 260); v.mix.ppt.caoh2 = (v.mix.ppt.caoh2 || 0) + d * 3; v.mix.cloud = Math.min(0.85, v.mix.cloud + d * 2.5);
        v.mix.liq.water -= d * 0.3; v.mix.add('limewater', d * 0.3);
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
        const d = Math.min(s.amount, k * dt); s.amount -= d; s.onAmount && s.onAmount();
        v.mix.add(S.dis, d * (S.dye ? 0.15 : 0.8));
        if (s.chem === 'kmno4') { E.fx.flakes_(v, 10 * Math.min(4, E.lapse), dt, '#b02fbf'); }
        E.note(v, 'dissolve', { chem: s.chem, left: s.amount });
      }
    } },
  { id: 'insoluble', test: (v) => v.solids.some((s) => s.under && s.amount > 0 && SOLIDS[s.chem]?.insol) && v.mix.ml() > 0.5,
    run(v, dt, E) {
      for (const s of v.solids) {
        const S = SOLIDS[s.chem]; if (!S?.insol || !s.under || s.amount <= 0) continue;
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
];

// heating rules: called when a vessel is above a flame
export function heatTick(v, dt, E) {
  const m = v.mix;
  // liquids warm up and boil
  if (m.ml() > 0.2) {
    m.temp = Math.min(100, m.temp + dt * 9 * (8 / Math.max(4, m.ml())));
    if (m.temp >= 99) { const d = Math.min(m.liq.water || 0, dt * 0.15 * (v.evapK ?? 1)); if (d > 0) m.liq.water -= d; E.fx.bubbles_(v, 50, dt, { size: 0.0013 }); if (Math.random() < dt * 6) E.fx.puff(v.mouthWorld(), '#ffffff', { alpha: 0.3, size: 0.01, grow: 0.06 }); E.note(v, 'boil', {}); }
    else if (m.temp > 70) E.fx.bubbles_(v, 8, dt, { size: 0.0006 });
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
      for (const r of RULES) if (r.test(v)) r.run(v, dt, this);
      // cool down towards room temperature; settle precipitate
      v.mix.temp += (27 - v.mix.temp) * dt * 0.02;
      if (v.stirT > 0) v.stirT -= dt;
      if (v.mix.cloud > 0 && !v.shaking && !(v.stirT > 0)) { let sw = 0, sk = 0; for (const p in v.mix.ppt) { const m = v.mix.ppt[p]; sw += m; sk += m * (PPT[p]?.settle ?? 0.02); } const k = v.settle ?? (sw > 0 ? sk / sw : 0.02); const d = Math.min(v.mix.cloud, v.mix.cloud * dt * k * this.lapse); v.mix.cloud -= d; v.mix.sed = Math.min(0.012, v.mix.sed + d * 0.004 * Object.values(v.mix.ppt).reduce((a, b) => a + b, 0)); }
      v.ml = v.mix.ml();
      const L = v.mix.look(); v.color.copy(L.color); v.alpha = L.alpha;
      const u = v.liqMat.userData.u; u.uCloud.value = Math.min(0.95, L.cloud); u.uCloudCol.value.copy(L.cloudC);
      u.uSed.value = v.mix.sed > 0.0003 ? v.inner[0].y + v.mix.sed : -1; // no sediment: never match the bottom (avoids a flickering star) if (L.pptCol) u.uSedCol.value.copy(L.pptCol);
      // gas collects at the mouth and slowly escapes
      for (const g in v.gas) { v.gas[g] *= Math.exp(-dt * 0.12); if (v.gas[g] < 1e-4) delete v.gas[g]; }
    }
  }
}
