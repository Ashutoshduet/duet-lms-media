// The real chemicals, cut out of public-domain / CC0 photographs: only the substance itself (no dish, spoon or background).
// Shown on the chalkboard and in the lab notebook; the same photos give the 3D solids their grain (tex/<name>.jpg).
const N = (en, hi, hg) => ({ en, hi, hg: hg || en });
export const PRODUCT = {
  pbi2: N('Lead iodide (PbI₂)', 'लेड आयोडाइड (PbI₂)'),
  pbno3: N('Lead nitrate, Pb(NO₃)₂', 'लेड नाइट्रेट, Pb(NO₃)₂'),
  ki: N('Potassium iodide (KI)', 'पोटैशियम आयोडाइड (KI)'),
  cuso4: N('Copper sulphate crystals', 'कॉपर सल्फेट के क्रिस्टल', 'Copper sulphate ke crystals'),
  cuso4b: N('Large copper sulphate crystals (CuSO₄·5H₂O)', 'कॉपर सल्फेट के बड़े क्रिस्टल (CuSO₄·5H₂O)', 'Copper sulphate ke bade crystals'),
  feso4: N('Ferrous sulphate crystals (FeSO₄·7H₂O)', 'फेरस सल्फेट के क्रिस्टल (FeSO₄·7H₂O)', 'Ferrous sulphate ke crystals'),
  kmno4: N('Potassium permanganate (KMnO₄)', 'पोटैशियम परमैंगनेट (KMnO₄)'),
  turmeric: N('Turmeric (haldi) powder', 'हल्दी पाउडर', 'Haldi powder'),
  hibiscus: N('China rose (gudhal) flower', 'गुड़हल का फूल', 'Gudhal ka phool'),
  nahco3: N('Baking soda (NaHCO₃)', 'खाने का सोडा (NaHCO₃)', 'Baking soda (NaHCO₃)'),
  caoh2: N('Slaked lime, Ca(OH)₂', 'बुझा चूना, Ca(OH)₂', 'Bujha chuna, Ca(OH)₂'),
  cao: N('Quicklime (CaO)', 'बिना बुझा चूना (CaO)', 'Quicklime (CaO)'),
  zngran: N('Zinc granules (Zn)', 'ज़िंक के दाने (Zn)', 'Zinc ke daane (Zn)'),
  naoh: N('Sodium hydroxide pellets (NaOH)', 'सोडियम हाइड्रॉक्साइड की गोलियाँ (NaOH)', 'NaOH ki goliyan'),
  litmus: N('Litmus paper strips', 'लिटमस पत्र', 'Litmus paper'),
  phpaper: N('Universal indicator (pH) paper', 'सार्वत्रिक सूचक (pH) पत्र', 'Universal indicator (pH) paper'),
  barite: N('Barium sulphate, found in nature as barite', 'बेरियम सल्फेट, प्रकृति में बेराइट खनिज', 'Barium sulphate (barite mineral)'),
  nh4cl: N('Ammonium chloride (NH₄Cl)', 'अमोनियम क्लोराइड (NH₄Cl)'),
  cacl2: N('Anhydrous calcium chloride (CaCl₂)', 'निर्जल कैल्शियम क्लोराइड (CaCl₂)'),
  chalk: N('Calcium carbonate (chalk), CaCO₃', 'कैल्शियम कार्बोनेट (चॉक), CaCO₃', 'Calcium carbonate (chalk)'),
  phenol: N('Phenolphthalein powder', 'फ़ीनॉल्फ़थेलिन पाउडर'),
  na2so4: N('Sodium sulphate (Na₂SO₄)', 'सोडियम सल्फेट (Na₂SO₄)'),
  bacl2: N('Barium chloride (BaCl₂)', 'बेरियम क्लोराइड (BaCl₂)'),
  mgo: N('Magnesium oxide (MgO): the white ash', 'मैग्नीशियम ऑक्साइड (MgO): सफ़ेद राख', 'Magnesium oxide (MgO): white raakh'),
  sugar: N('Sugar (sucrose)', 'चीनी (सुक्रोज़)', 'Cheeni (sucrose)'),
  salt: N('Common salt (NaCl)', 'साधारण नमक (NaCl)', 'Namak (NaCl)'),
  nail: N('Iron nail (Fe)', 'लोहे की कील (Fe)', 'Iron ki keel (Fe)'),
  sand: N('Sand', 'रेत', 'Ret (sand)'),
};
// which real chemicals each experiment uses or makes (reactants first, then products)
const USE = {
  mg_burn: ['mgo'], pb_ki: ['pbno3', 'ki', 'pbi2'], zn_acid: ['zngran'], cao_water: ['cao', 'caoh2'], feso4_heat: ['feso4'],
  pbno3_heat: ['pbno3'], fe_cuso4: ['nail', 'cuso4'], ba_so4: ['na2so4', 'bacl2', 'barite'], litmus: ['litmus'], ph_paper: ['phpaper'],
  neutral: ['naoh', 'phenol'], carb_lime: ['caoh2', 'chalk'], cuso4_heat: ['cuso4b', 'cuso4'], solubility: ['sugar', 'salt', 'chalk', 'sand'],
  evaporate_salt: ['salt'], turmeric: ['turmeric'], chinarose: ['hibiscus'], vinegar_soda: ['nahco3'], breath_lime: ['caoh2', 'chalk'],
  kmno4_diffuse: ['kmno4'], sugar_heat: ['sugar'], tyndall: ['salt', 'chalk'], sublimation: ['nh4cl', 'sand'], metals_hcl: ['zngran'],
  reactivity: ['zngran', 'cuso4'], ph_salts: ['phpaper', 'salt'], zn_naoh: ['zngran', 'naoh'], rusting: ['nail', 'cacl2'],
};
export const PHOTOS = Object.fromEntries(Object.entries(USE).map(([id, ks]) => [id, ks.map((k) => ({ k, f: `products/${k}.webp`, cap: PRODUCT[k] }))]));

const cache = new Map();
export function photoImage(f) { // resolves to a loaded <img> (or null if it fails)
  if (!cache.has(f)) cache.set(f, new Promise((res) => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = f; }));
  return cache.get(f);
}
