// DUET Robotics Lab 360, batch 25: three resistive sensors from the school kit, as data (same shape as parts.js). Each is
// a resistor whose value the world changes; with a fixed resistor it makes a divider, read on an analog pin, as the LDR is.
//   fsr   FSR 402 force sensing resistor: a round pad 18 mm across. No touch: over 10 MΩ; a finger's press (100 g): about
//         7 kΩ; a firm 1 kg press: about 1 kΩ (Interlink's guide: R falls roughly as 1 / force).
//   flex  a 2.2" flex sensor (Spectra Symbol): 25 kΩ flat, about 100 kΩ bent to 90° (it only reads one way: bent with its
//         printed side out), more past that.
//   ntc   a 10 kΩ NTC thermistor (B = 3950): 10 kΩ at 25 °C, fewer ohms when hotter (5.3 kΩ at 40 °C, 33 kΩ at 0 °C).
// And five modules (the second half of batch 25):
//   rcwl     RCWL-0516 microwave radar: a 3.2 GHz Doppler sensor; OUT goes HIGH (3.3 V) for about 2 s after it sees movement
//            (each new movement starts the 2 s again). It sees through plastic, wood and thin walls: a box hides it, but it
//            also sees people moving behind a wall. VIN 4–28 V.
//   wlevel   the red water level sensor: ten bare tracks; the deeper they are in water, the more they conduct: S rises from
//            0 V dry to about 0.6 × VCC when 40 mm are under water (the "S + −" module).
//   uvs      GUVA-S12SD UV sensor module: OUT = UV index × 0.1 V (an index of 10, strong summer sun, is about 1 V).
//   mq135    MQ-135 air quality sensor (CO2, ammonia, smoke): the MQ-2's heater and module, a different sensing layer.
//   mq3      MQ-3 alcohol sensor (a breath analyser's sensor): the same module again.
// The student sets the press, the bend, the temperature, the water, the sun or the gas in the part's callout (app25.js).
const P = 2.54;
const t3 = (en, hi, hg) => ({ en, hi, hg });
const touch = (lab) => { lab.stateV = (lab.stateV || 0) + 1; lab.instKey = null; };
const kohm = (r) => (r >= 1e6 ? (r / 1e6).toFixed(1) + ' MΩ' : r >= 1000 ? (r / 1000).toFixed(r < 10000 ? 1 : 0) + ' kΩ' : Math.round(r) + ' Ω');

export const fsrOhms = (g) => (g < 1 ? 1.2e7 : Math.min(1.2e7, 1000 * Math.pow(1000 / g, 0.85)));
export const flexOhms = (deg) => 25000 + 75000 * Math.max(0, Math.min(180, deg)) / 90;
export const ntcOhms = (t) => 10000 * Math.exp(3950 * (1 / (t + 273.15) - 1 / 298.15));
export const tempOf = (p, env) => (p.state.ext && p.state.temp !== undefined ? p.state.temp : env && env.temp !== undefined ? env.temp : 25);

const legs = (a, b) => [{ id: '1', at: [0, 0], name: a }, { id: '2', at: [2 * P, 0], name: b }];
const LEG1 = t3('Leg 1', 'पैर 1', 'Pair 1'), LEG2 = t3('Leg 2', 'पैर 2', 'Pair 2');

export const PARTS25 = {
  fsr: {
    cat: 'in', mount: 'bb', props: {}, state0: { grams: 0 },
    name: t3('Force sensor FSR 402 (pressure pad)', 'फ़ोर्स सेंसर FSR 402 (प्रेशर पैड)', 'Force sensor FSR 402 (pressure pad)'),
    pins: legs(LEG1, LEG2),
    elec: (p, N) => [{ type: 'R', a: N['1'], b: N['2'], r: fsrOhms(p.state.grams || 0), role: 'fsr' }],
    specs: () => [['no press', '> 10 MΩ'], ['100 g', '≈ 7 kΩ'], ['1 kg', '≈ 1 kΩ']],
    info: t3('A force sensing resistor: two thin layers with ink between them. The harder you press the round pad, the more the ink touches and the fewer ohms it has. It tells a light touch from a firm press, but it is no weighing scale: the same press can read 10 % different.',
      'फ़ोर्स सेंसिंग रेज़िस्टर: दो पतली परतें, बीच में स्याही। गोल पैड को जितना ज़ोर से दबाइए, स्याही उतनी ज़्यादा छूती है और प्रतिरोध उतना कम होता है। यह हल्के छूने और ज़ोर से दबाने में फ़र्क़ बताता है, पर यह तराज़ू नहीं है: वही दबाव 10 % अलग पढ़ सकता है।',
      'Force sensing resistor: do patli parten, beech mein syaahi. Gol pad ko jitna zor se dabaiye, syaahi utni zyada chhooti hai aur resistance utna kam hota hai. Yeh halke chhoone aur zor se dabaane mein farq batata hai, par yeh taraazu nahi hai: wahi dabaav 10 % alag padh sakta hai.'),
    live: (p) => `${Math.round(p.state.grams || 0)} g · ${kohm(fsrOhms(p.state.grams || 0))}`,
  },
  flex: {
    cat: 'in', mount: 'bb', props: {}, state0: { bend: 0 },
    name: t3('Flex sensor 2.2" (bend sensor)', 'फ़्लेक्स सेंसर 2.2" (मोड़ सेंसर)', 'Flex sensor 2.2" (bend sensor)'),
    pins: legs(LEG1, LEG2),
    elec: (p, N) => [{ type: 'R', a: N['1'], b: N['2'], r: flexOhms(p.state.bend || 0), role: 'flex' }],
    specs: () => [['flat', '25 kΩ'], ['bent 45°', '≈ 62 kΩ'], ['bent 90°', '≈ 100 kΩ']],
    info: t3('A plastic strip printed with carbon ink. Bend it (printed side out) and the ink cracks open a little: its resistance goes up, from 25 kΩ flat to about 100 kΩ at a right angle. Data gloves, robot hands and posture straps use it. Do not bend it at its pins: that is where they break.',
      'कार्बन स्याही छपी एक प्लास्टिक पट्टी। इसे मोड़िए (छपी तरफ़ बाहर) तो स्याही थोड़ी खुल जाती है: इसका प्रतिरोध बढ़ता है, सीधे पर 25 kΩ से समकोण पर लगभग 100 kΩ। डेटा दस्ताने, रोबोट हाथ और पोश्चर बेल्ट इसका इस्तेमाल करते हैं। इसे पिनों के पास मत मोड़िए: वहीं यह टूटता है।',
      'Carbon syaahi chhapi ek plastic patti. Ise modiye (chhapi taraf bahar) to syaahi thodi khul jaati hai: iska resistance badhta hai, seedhe par 25 kΩ se samkon par lagbhag 100 kΩ. Data dastaane, robot haath aur posture belt iska istemaal karte hain. Ise pinon ke paas mat modiye: wahin yeh toot-ta hai.'),
    live: (p) => `${Math.round(p.state.bend || 0)}° · ${kohm(flexOhms(p.state.bend || 0))}`,
  },
  ntc: {
    cat: 'in', mount: 'bb', props: {}, state0: {},
    name: t3('Thermistor NTC 10 kΩ (temperature)', 'थर्मिस्टर NTC 10 kΩ (तापमान)', 'Thermistor NTC 10 kΩ (temperature)'),
    pins: legs(LEG1, LEG2),
    elec: (p, N, env) => [{ type: 'R', a: N['1'], b: N['2'], r: ntcOhms(tempOf(p, env)), role: 'ntc' }],
    specs: () => [['0 °C', '≈ 33 kΩ'], ['25 °C', '10 kΩ'], ['40 °C', '≈ 5.3 kΩ'], ['B', '3950 K']],
    info: t3('A tiny bead of metal oxide: Negative Temperature Coefficient, so the hotter it gets, the fewer ohms it has (10 kΩ at 25 °C, about 5.3 kΩ at 40 °C). Cheap and quick to react: kettles, fridges, battery packs and 3D printers all have one. Its curve is not a straight line.',
      'धातु ऑक्साइड का एक छोटा मनका: नेगेटिव टेम्परेचर कोएफ़िशिएंट, यानी जितना गर्म, उतना कम प्रतिरोध (25 °C पर 10 kΩ, 40 °C पर लगभग 5.3 kΩ)। सस्ता और जल्दी असर दिखाने वाला: केतली, फ़्रिज, बैटरी पैक और 3D प्रिंटर सबमें एक होता है। इसका ग्राफ़ सीधी रेखा नहीं है।',
      'Dhaatu oxide ka ek chhota manka: Negative Temperature Coefficient, yaani jitna garam, utna kam resistance (25 °C par 10 kΩ, 40 °C par lagbhag 5.3 kΩ). Sasta aur jaldi asar dikhaane wala: kettle, fridge, battery pack aur 3D printer sabmein ek hota hai. Iska graph seedhi rekha nahi hai.'),
    live: (p, lab) => { const t = tempOf(p, lab && lab.env); return `${t.toFixed(1)} °C · ${kohm(ntcOhms(t))}`; },
  },
};
const vOf = (V, n) => (V && n < V.length ? V[n] : 0);
const setPow = (p, lab, on) => { if (on !== !!p.state.powered) { p.state.powered = on; touch(lab); return true; } return false; };
// the MQ modules: a heater (33 Ω, 150 mA at 5 V), the sensing layer Rs in series with a 4.7 kΩ load (AO), an LM393 for DO
export const mq135Ratio = (ppm) => Math.min(9, 2.5 * Math.pow(Math.max(ppm, 50) / 400, -0.4)); // CO2-equivalent ppm (clean outdoor air: 400)
export const mq3Ratio = (ppm) => Math.min(9, 2.4 * Math.pow(Math.max(ppm, 5) / 60, -0.62)); // alcohol in the breath, ppm
const mqPart = (ratio, name, gasName, ppm0) => ({
  term: { y: 4.5 }, cat: 'in', mount: 'free', props: { thr: 0.45 }, state0: { ppm: ppm0, warm: 0 }, name,
  pins: [{ id: 'VCC', at: [-1.5 * P, 0], name: t3('VCC: 5V (its heater takes 150 mA)', 'VCC: 5V (इसका हीटर 150 mA लेता है)', 'VCC: 5V (iska heater 150 mA leta hai)') }, { id: 'GND', at: [-0.5 * P, 0], name: t3('GND', 'GND', 'GND') },
    { id: 'DO', at: [0.5 * P, 0], name: t3(`DO: LOW when there is ${gasName.en}`, `DO: ${gasName.hi} हो तो LOW`, `DO: ${gasName.hg} ho to LOW`) }, { id: 'AO', at: [1.5 * P, 0], name: t3(`AO: more ${gasName.en} = more volts`, `AO: ज़्यादा ${gasName.hi} = ज़्यादा वोल्ट`, `AO: zyada ${gasName.hg} = zyada volt`) }],
  elec: (p, N, env, V) => {
    const els = [{ type: 'R', a: N.VCC, b: N.GND, r: 33, role: 'heater' }];
    if (p.state.powered) { const vcc = Math.max(0, vOf(V, N.VCC) - vOf(V, N.GND)); const rs = 6000 * ratio(p.state.ppm) * (0.25 + 0.75 * p.state.warm); const ao = vcc * 4700 / (rs + 4700);
      els.push({ type: 'V', a: N.AO, b: N.GND, v: ao, r: 1000, role: 'mqAO' }); const g = ao > p.props.thr * vcc; els.push({ type: 'V', a: N.DO, b: N.GND, v: g ? 0 : vcc, r: g ? 100 : 10000 }); }
    return els;
  },
  dyn: (p, els, lab, dt, vAt) => { const s = p.state; const on = vAt(p.N.VCC) - vAt(p.N.GND) > 4.0; setPow(p, lab, on);
    s.warm = on ? s.warm + (1 - s.warm) * (1 - Math.exp(-dt / 3)) : Math.max(0, s.warm - dt / 20);
    const ao = vAt(p.N.AO) - vAt(p.N.GND); if (Math.abs(ao - (s.ao || 0)) > 0.002) { s.ao = ao; touch(lab); } s.gas = on && vAt(p.N.DO) - vAt(p.N.GND) < 1; },
  live: (p) => (p.state.powered ? `${Math.round(p.state.ppm)} ppm · AO ${(p.state.ao || 0).toFixed(2)} V${p.state.warm < 0.9 ? ' · warming up' : ''}${p.state.gas ? ' · DO LOW' : ''}` : 'no power'),
});
Object.assign(PARTS25, {
  rcwl: {
    term: { y: 4.5 }, cat: 'in', mount: 'free', props: { hold: 2 }, state0: { motion: false, out: false },
    name: t3('Microwave radar motion sensor RCWL-0516', 'माइक्रोवेव रडार मोशन सेंसर RCWL-0516', 'Microwave radar motion sensor RCWL-0516'),
    pins: [{ id: '3V3', at: [-2 * P, 0], name: t3('3V3: an output (its own 3.3 V), leave it free', '3V3: एक आउटपुट (इसका अपना 3.3 V), इसे ख़ाली छोड़िए', '3V3: ek output (iska apna 3.3 V), ise khaali chhodiye') }, { id: 'GND', at: [-P, 0], name: t3('GND', 'GND', 'GND') },
      { id: 'OUT', at: [0, 0], name: t3('OUT: HIGH (3.3 V) for 2 s after movement', 'OUT: हलचल के बाद 2 s तक HIGH (3.3 V)', 'OUT: halchal ke baad 2 s tak HIGH (3.3 V)') }, { id: 'VIN', at: [P, 0], name: t3('VIN: 4 to 28 V', 'VIN: 4 से 28 V', 'VIN: 4 se 28 V') },
      { id: 'CDS', at: [2 * P, 0], name: t3('CDS: for a light sensor that stops it by day; leave it free', 'CDS: दिन में इसे रोकने वाले लाइट सेंसर के लिए; ख़ाली छोड़िए', 'CDS: din mein ise rokne wale light sensor ke liye; khaali chhodiye') }],
    elec: (p, N) => { const els = [{ type: 'R', a: N.VIN, b: N.GND, r: 1700, role: 'rcwl' }]; if (p.state.powered) els.push({ type: 'V', a: N.OUT, b: N.GND, v: p.state.out ? 3.3 : 0, r: 1000, role: 'rcwlOut' }); return els; },
    dyn: (p, els, lab, dt, vAt) => { const s = p.state; const on = vAt(p.N.VIN) - vAt(p.N.GND) > 3.8; if (setPow(p, lab, on)) s.left = 0;
      if (!on) { if (s.out) { s.out = false; touch(lab); } return; } if (s.motion) { s.left = p.props.hold; s.seen = (s.seen || 0) + 1; } s.left = Math.max(0, (s.left || 0) - dt); const out = s.left > 0 || s.motion; if (out !== s.out) { s.out = out; touch(lab); } },
    info: t3('A tiny radar: it sends out microwaves (3.2 GHz) and listens for the echo from anything that moves, as a police speed gun does. Unlike a PIR it needs no warm body and sees through plastic, wood and thin walls, so it can sit hidden inside a box, but it also notices people moving next door. OUT stays HIGH for about 2 s after the last movement.',
      'एक छोटा रडार: यह माइक्रोवेव (3.2 GHz) भेजता है और हिलती हुई चीज़ से लौटी गूँज सुनता है, जैसे पुलिस की स्पीड गन। पीआईआर की तरह इसे गर्म शरीर नहीं चाहिए और यह प्लास्टिक, लकड़ी और पतली दीवारों के पार देखता है, इसलिए डिब्बे के अंदर छिपा रह सकता है, पर यह बगल के कमरे में हिलते लोगों को भी देख लेता है। आख़िरी हलचल के बाद OUT लगभग 2 s तक HIGH रहता है।',
      'Ek chhota radar: yeh microwave (3.2 GHz) bhejta hai aur hilti hui cheez se lauti goonj sunta hai, jaise police ki speed gun. PIR ki tarah ise garam shareer nahi chahiye aur yeh plastic, lakdi aur patli deewaron ke paar dekhta hai, isliye dibbe ke andar chhipa reh sakta hai, par yeh bagal ke kamre mein hilte logon ko bhi dekh leta hai. Aakhri halchal ke baad OUT lagbhag 2 s tak HIGH rehta hai.'),
    live: (p) => (p.state.powered ? (p.state.out ? 'OUT HIGH: movement' : 'OUT LOW: still') : 'no power'),
  },
  wlevel: {
    term: { y: 74 }, cat: 'in', mount: 'free', props: {}, state0: { depth: 0 }, // (its header is at the top: the board stands in a cup of water)
    name: t3('Water level sensor (S + −)', 'पानी स्तर सेंसर (S + −)', 'Water level sensor (S + −)'),
    pins: [{ id: 'S', at: [-P, 0], name: t3('S: the signal, deeper water = more volts', 'S: सिग्नल, ज़्यादा गहरा पानी = ज़्यादा वोल्ट', 'S: signal, zyada gehra paani = zyada volt') }, { id: 'VCC', at: [0, 0], name: t3('+: 3.3 V or 5 V', '+: 3.3 V या 5 V', '+: 3.3 V ya 5 V') }, { id: 'GND', at: [P, 0], name: t3('−: GND', '−: GND', '−: GND') }],
    elec: (p, N, env, V) => { const els = [{ type: 'R', a: N.VCC, b: N.GND, r: 20000, role: 'wl' }]; if (p.state.powered) { const vcc = Math.max(0, vOf(V, N.VCC) - vOf(V, N.GND)); els.push({ type: 'V', a: N.S, b: N.GND, v: vcc * wlFrac(p.state.depth || 0), r: 2000, role: 'wlS' }); } return els; },
    dyn: (p, els, lab, dt, vAt) => { const on = vAt(p.N.VCC) - vAt(p.N.GND) > 2.5; setPow(p, lab, on); const s = vAt(p.N.S) - vAt(p.N.GND); if (Math.abs(s - (p.state.sv || 0)) > 0.002) { p.state.sv = s; touch(lab); } },
    info: t3('Ten bare copper tracks, every other one joined to +: water between them conducts, and the deeper the board is in water, the more tracks are wet and the higher S goes. Left powered all the time, the tracks corrode in a few weeks: real projects switch its + from a pin only while they read it.',
      'दस नंगी ताँबे की पटरियाँ, हर दूसरी + से जुड़ी: उनके बीच का पानी बिजली चलाता है, और बोर्ड पानी में जितना गहरा, उतनी ज़्यादा पटरियाँ गीली और S उतना ऊँचा। हमेशा चालू छोड़ने पर पटरियाँ कुछ हफ़्तों में गल जाती हैं: असली प्रोजेक्ट इसका + किसी पिन से सिर्फ़ पढ़ते समय चालू करते हैं।',
      'Das nangi taambe ki patriyaan, har doosri + se judi: unke beech ka paani bijli chalaata hai, aur board paani mein jitna gehra, utni zyada patriyaan geeli aur S utna ooncha. Hamesha chaalu chhodne par patriyaan kuch hafton mein gal jaati hain: asli project iska + kisi pin se sirf padhte samay chaalu karte hain.'),
    live: (p) => (p.state.powered ? `${Math.round(p.state.depth || 0)} mm under water · S ${(p.state.sv || 0).toFixed(2)} V` : 'no power'),
  },
  uvs: {
    term: { y: 4.5 }, cat: 'in', mount: 'free', props: {}, state0: { uvi: 0 },
    name: t3('UV sensor GUVA-S12SD', 'यूवी सेंसर GUVA-S12SD', 'UV sensor GUVA-S12SD'),
    pins: [{ id: 'GND', at: [-P, 0], name: t3('−: GND', '−: GND', '−: GND') }, { id: 'VCC', at: [0, 0], name: t3('+: 3.3 V or 5 V', '+: 3.3 V या 5 V', '+: 3.3 V ya 5 V') }, { id: 'OUT', at: [P, 0], name: t3('OUT: UV index × 0.1 V', 'OUT: यूवी इंडेक्स × 0.1 V', 'OUT: UV index × 0.1 V') }],
    elec: (p, N) => { const els = [{ type: 'R', a: N.VCC, b: N.GND, r: 33000, role: 'uv' }]; if (p.state.powered) els.push({ type: 'V', a: N.OUT, b: N.GND, v: Math.min(1.2, 0.1 * (p.state.uvi || 0)), r: 1000, role: 'uvOut' }); return els; },
    dyn: (p, els, lab, dt, vAt) => { setPow(p, lab, vAt(p.N.VCC) - vAt(p.N.GND) > 2.6); },
    info: t3('A tiny gallium nitride photodiode that sees only ultraviolet (240–370 nm), the light that burns skin, with an amplifier: OUT is the UV index divided by 10, in volts. India\'s summer noon sun reaches index 10 to 12: "very high". Glass and shade cut it a lot; clouds much less than you would think.',
      'गैलियम नाइट्राइड का छोटा फ़ोटोडायोड जो सिर्फ़ अल्ट्रावायलेट (240–370 nm) देखता है, वही रोशनी जो त्वचा जलाती है, साथ में एक एम्प्लिफ़ायर: OUT यूवी इंडेक्स का दसवाँ हिस्सा है, वोल्ट में। भारत की गर्मी की दोपहर की धूप इंडेक्स 10 से 12 तक पहुँचती है: "बहुत ज़्यादा"। काँच और छाँव इसे बहुत घटाते हैं; बादल सोच से बहुत कम।',
      'Gallium nitride ka chhota photodiode jo sirf ultraviolet (240–370 nm) dekhta hai, wahi roshni jo twacha jalaati hai, saath mein ek amplifier: OUT UV index ka dasvaan hissa hai, volt mein. Bharat ki garmi ki dopahar ki dhoop index 10 se 12 tak pahunchti hai: "bahut zyada". Kaanch aur chhaanv ise bahut ghataate hain; baadal soch se bahut kam.'),
    live: (p) => (p.state.powered ? `UV index ${(p.state.uvi || 0).toFixed(1)} · OUT ${Math.min(1.2, 0.1 * (p.state.uvi || 0)).toFixed(2)} V` : 'no power'),
  },
  mq135: Object.assign(mqPart(mq135Ratio, t3('Air quality sensor MQ-135 (CO2, smoke)', 'वायु गुणवत्ता सेंसर MQ-135 (CO2, धुआँ)', 'Air quality sensor MQ-135 (CO2, smoke)'), t3('bad air', 'ख़राब हवा', 'kharaab hawa'), 400), {
    info: t3('The MQ-2\'s heater and module with a tin oxide layer that reacts to carbon dioxide, ammonia, benzene and smoke. It tells clean air from stale air (a closed classroom after an hour, a kitchen with smoke); it is not a lab meter, and it needs 24 hours of burn-in when new and a minute of warming up each time.',
      'MQ-2 वाला हीटर और मॉड्यूल, टिन ऑक्साइड की ऐसी परत के साथ जो कार्बन डाइऑक्साइड, अमोनिया, बेंज़ीन और धुएँ पर असर दिखाती है। यह साफ़ और बासी हवा में फ़र्क़ बताता है (घंटे भर बंद रहा क्लासरूम, धुएँ वाली रसोई); यह लैब का मीटर नहीं है, नए पर इसे 24 घंटे चलाना पड़ता है और हर बार एक मिनट गर्म होना पड़ता है।',
      'MQ-2 wala heater aur module, tin oxide ki aisi parat ke saath jo carbon dioxide, ammonia, benzene aur dhuen par asar dikhaati hai. Yeh saaf aur baasi hawa mein farq batata hai (ghante bhar band raha classroom, dhuen wali rasoi); yeh lab ka meter nahi hai, naye par ise 24 ghante chalaana padta hai aur har baar ek minute garam hona padta hai.') }),
  mq3: Object.assign(mqPart(mq3Ratio, t3('Alcohol sensor MQ-3 (breath)', 'अल्कोहल सेंसर MQ-3 (साँस)', 'Alcohol sensor MQ-3 (saans)'), t3('alcohol', 'अल्कोहल', 'alcohol'), 5), {
    info: t3('The sensor inside cheap breath analysers: its layer reacts strongly to alcohol vapour and hardly to petrol fumes or smoke. Breathe on it from 2–3 cm. Police breathalysers use a fuel cell instead, which is far more exact: this one only tells "some alcohol" from "none".',
      'सस्ते ब्रीथ एनालाइज़र के अंदर का सेंसर: इसकी परत अल्कोहल की भाप पर तेज़ असर दिखाती है और पेट्रोल की गंध या धुएँ पर मुश्किल से। इस पर 2–3 cm से साँस छोड़िए। पुलिस के ब्रीथ एनालाइज़र इसकी जगह फ़्यूल सेल लगाते हैं, जो कहीं ज़्यादा सटीक है: यह सिर्फ़ "कुछ अल्कोहल" और "बिल्कुल नहीं" में फ़र्क़ बताता है।',
      'Saste breath analyser ke andar ka sensor: iski parat alcohol ki bhaap par tez asar dikhaati hai aur petrol ki gandh ya dhuen par mushkil se. Is par 2–3 cm se saans chhodiye. Police ke breath analyser iski jagah fuel cell lagaate hain, jo kahin zyada sateek hai: yeh sirf "kuch alcohol" aur "bilkul nahi" mein farq batata hai.') }),
});
// the water level sensor's S as a share of VCC: 0 dry, rising towards 0.62 as more of its 40 mm of tracks is under water
export const wlFrac = (mm) => 0.62 * (1 - Math.exp(-Math.max(0, Math.min(40, mm)) / 12));
export const DRAWER25 = ['fsr', 'flex', 'ntc', 'rcwl', 'wlevel', 'uvs', 'mq135', 'mq3'];
// the callout's slider, for a test or a scene: a press (g), a bend (°), the room's temperature (°C)
export function set25(lab, p, v) {
  if (p.type === 'fsr' && p.state.grams !== v) { p.state.grams = v; touch(lab); }
  if (p.type === 'flex' && p.state.bend !== v) { p.state.bend = v; touch(lab); }
  if (p.type === 'ntc' && lab.env.temp !== v) { lab.env.temp = v; touch(lab); }
  if (p.type === 'wlevel' && p.state.depth !== v) { p.state.depth = v; touch(lab); }
  if (p.type === 'uvs' && p.state.uvi !== v) { p.state.uvi = v; touch(lab); }
  if ((p.type === 'mq135' || p.type === 'mq3') && p.state.ppm !== v) { p.state.ppm = v; touch(lab); }
  if (p.type === 'rcwl' && p.state.motion !== !!v) { p.state.motion = !!v; touch(lab); }
}
