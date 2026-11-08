// Real photographs of the chemicals and apparatus (public-domain / CC0, so no credit line is needed).
// Shown pinned on the chalkboard and in the lab notebook.
const P = (f, en, hi, hg) => ({ f: `photos/${f}.jpg`, cap: { en, hi, hg } });

const CUSO4 = P('fe_cuso4_2', 'Blue copper sulphate crystals', 'कॉपर सल्फेट के नीले क्रिस्टल', 'Copper sulphate ke neele crystals');
const ZN_HCL = P('zn_acid_0', 'Zinc reacting with hydrochloric acid in a test tube', 'परखनली में ज़िंक और हाइड्रोक्लोरिक अम्ल की अभिक्रिया', 'Test tube mein zinc aur hydrochloric acid ka reaction');
const ZN_CU = P('zn_acid_3', 'Zinc in copper sulphate solution: copper forms on the zinc', 'कॉपर सल्फेट के घोल में ज़िंक: ज़िंक पर कॉपर जमता है', 'Copper sulphate solution mein zinc: zinc par copper jamta hai');
const LIME = P('breath_lime_0', 'Slaked lime (calcium hydroxide); dissolved in water it gives lime water', 'बुझा चूना (कैल्शियम हाइड्रॉक्साइड); पानी में घोलने पर चूने का पानी बनता है', 'Bujha chuna (calcium hydroxide); paani mein gholne par lime water banta hai');
const PH = P('ph_paper_0', 'Universal indicator paper with its colour chart', 'रंग चार्ट के साथ सार्वत्रिक सूचक पत्र', 'Universal indicator paper, colour chart ke saath');

const SUGAR = P('sugar_0', 'Sugar: white crystals of sucrose, a compound of carbon, hydrogen and oxygen', 'चीनी: सुक्रोज़ के सफ़ेद क्रिस्टल, जो कार्बन, हाइड्रोजन और ऑक्सीजन का यौगिक है', 'Cheeni: sucrose ke white crystals, jo carbon, hydrogen aur oxygen ka compound hai');
const SALT = P('salt_0', 'Common salt (sodium chloride)', 'साधारण नमक (सोडियम क्लोराइड)', 'Common salt (sodium chloride)');

export const PHOTOS = {
  solubility: [SALT, SUGAR],
  sugar_heat: [SUGAR],
  mg_burn: [P('mg_burn_0', 'Magnesium oxide: the white ash left after magnesium burns', 'मैग्नीशियम ऑक्साइड: मैग्नीशियम जलने के बाद बची सफ़ेद राख', 'Magnesium oxide: magnesium jalne ke baad bachi white raakh')],
  pbno3_heat: [P('pbno3_heat_0', 'Lead nitrate: a white crystalline solid', 'लेड नाइट्रेट: एक सफ़ेद क्रिस्टलीय ठोस', 'Lead nitrate: ek white crystalline solid')],
  evaporate_salt: [P('evaporate_salt_2', 'Porcelain evaporating dishes, like the one used here', 'चीनी मिट्टी की वाष्पन प्यालियाँ, जैसी यहाँ इस्तेमाल हुई', 'Porcelain evaporating dish, jaisi yahan use hui'), SALT],
  turmeric: [P('turmeric_0', 'Turmeric (haldi) powder', 'हल्दी पाउडर', 'Haldi powder')],
  chinarose: [P('chinarose_0', 'China rose (hibiscus): its petals make the indicator', 'गुड़हल का फूल: इसकी पंखुड़ियों से सूचक बनता है', 'Gudhal ka phool: iski pankhudiyon se indicator banta hai')],
  vinegar_soda: [P('vinegar_soda_3', 'Baking soda (sodium hydrogen carbonate)', 'खाने का सोडा (सोडियम हाइड्रोजन कार्बोनेट)', 'Baking soda (sodium hydrogen carbonate)')],
  breath_lime: [LIME],
  carb_lime: [LIME],
  kmno4_diffuse: [P('kmno4_diffuse_1', 'Potassium permanganate crystals', 'पोटैशियम परमैंगनेट के क्रिस्टल', 'Potassium permanganate ke crystals')],
  tyndall: [P('tyndall_2', 'Tyndall effect in nature: sunbeams show up in misty air', 'प्रकृति में टिंडल प्रभाव: धुंधली हवा में सूरज की किरणें दिखती हैं', 'Nature mein Tyndall effect: dhundhli hawa mein dhoop ki kiranein dikhti hain')],
  sublimation: [P('sublimation_2', 'Iodine sublimes too: its vapour turns back to solid on a cold surface', 'आयोडीन भी ऊर्ध्वपातित होती है: इसकी वाष्प ठंडी सतह पर फिर ठोस बन जाती है', 'Iodine bhi sublime hoti hai: iski vapour thandi surface par phir solid ban jaati hai')],
  chromatography: [
    P('chromatography_3', 'Chromatography separating the colours of spinach leaves', 'क्रोमैटोग्राफी से पालक के पत्तों के रंग अलग होते हुए', 'Chromatography se palak ke patton ke rang alag hote hue'),
    P('chromatography_1', 'Separated spots on a chromatography plate', 'क्रोमैटोग्राफी प्लेट पर अलग हुए धब्बे', 'Chromatography plate par alag hue dhabbe'),
  ],
  pb_ki: [P('pb_ki_0', 'Lead iodide: the bright yellow solid that forms', 'लेड आयोडाइड: बनने वाला चमकीला पीला ठोस', 'Lead iodide: banne wala chamkeela peela solid')],
  zn_acid: [ZN_HCL],
  metals_hcl: [ZN_HCL],
  reactivity: [ZN_CU, ZN_HCL],
  fe_cuso4: [CUSO4, ZN_CU],
  cuso4_heat: [P('cuso4_heat_0', 'Blue copper sulphate crystals hold water of crystallisation', 'कॉपर सल्फेट के नीले क्रिस्टलों में क्रिस्टलन जल होता है', 'Copper sulphate ke neele crystals mein water of crystallisation hota hai')],
  cao_water: [P('cao_water_2', 'Quicklime (calcium oxide)', 'बिना बुझा चूना (कैल्शियम ऑक्साइड)', 'Quicklime (calcium oxide)'), LIME],
  feso4_heat: [P('feso4_heat_0', 'Green crystals of ferrous sulphate', 'फेरस सल्फेट के हरे क्रिस्टल', 'Ferrous sulphate ke hare crystals')],
  ba_so4: [P('ba_so4_1', 'Barite: barium sulphate found in nature as a mineral', 'बेराइट: प्रकृति में खनिज के रूप में मिलने वाला बेरियम सल्फेट', 'Barite: nature mein mineral ke roop mein milne wala barium sulphate')],
  litmus: [P('litmus_0', 'Litmus paper: red in acid, blue in base', 'लिटमस पत्र: अम्ल में लाल, क्षार में नीला', 'Litmus paper: acid mein laal, base mein neela')],
  ph_paper: [PH],
  ph_salts: [P('ph_salts_0', 'Indicator solutions and a pH colour chart', 'सूचक घोल और pH रंग चार्ट', 'Indicator solutions aur pH colour chart'), PH],
  neutral: [P('neutral_0', 'Phenolphthalein turns pink in a basic solution', 'फ़ीनॉल्फ़थेलिन क्षारीय घोल में गुलाबी हो जाता है', 'Phenolphthalein basic solution mein pink ho jaata hai')],
  zn_naoh: [P('zn_naoh_1', 'Zinc granules', 'ज़िंक के दाने', 'Zinc ke daane'), P('zn_naoh_2', 'Sodium hydroxide pellets', 'सोडियम हाइड्रॉक्साइड की गोलियाँ', 'Sodium hydroxide ki goliyan')],
  rusting: [P('rusting_0', 'Rust: reddish-brown iron oxide from a rusty water pipe', 'जंग: जंग लगे पानी के पाइप से निकला लाल-भूरा आयरन ऑक्साइड', 'Jung: zang lage paani ke pipe se nikla laal-bhura iron oxide')],
};

const cache = new Map();
export function photoImage(f) { // resolves to a loaded <img> (or null if it fails)
  if (!cache.has(f)) cache.set(f, new Promise((res) => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = f; }));
  return cache.get(f);
}
