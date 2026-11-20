// DUET Robotics Lab 360, batch 22: eight small digital sensor modules from the school kit, as data (same shape as parts.js).
// Each is a little board with a sensing element, an LM393 comparator (or a Hall chip) and a sensitivity knob; its OUT (DO)
// pin is pulled LOW while it senses, and its second LED lights. They run on 3.3 V or 5 V, so the Uno, the ESP32, the Pico
// and the Pi read them the same way. The student "does" the sensing in the part's callout (app22.js):
//   flame   an IR photodiode that sees the flicker of a flame (a candle near it)
//   sound   an electret microphone: a clap makes OUT LOW for a moment
//   reed    a glass reed switch: a magnet closes it (a door or window sensor)
//   hall    a Hall effect chip (A3144): a magnet's pole near it
//   tilt    a ball tilt switch (SW-520D): tipped over, the ball rolls off its contacts
//   vibe    a spring vibration switch (SW-420): a knock shakes it for a moment
//   rain    a rain plate on a lead: drops of water bridge its tracks
//   blink   an IR eye-blink sensor on a pair of spectacles: the closed eyelid reflects its IR
const P = 2.54;
const t3 = (en, hi, hg) => ({ en, hi, hg });
const touch = (lab) => { lab.stateV++; lab.instKey = null; };

export const KINDS22 = {
  flame: { name: t3('Flame sensor module', 'ज्वाला (फ़्लेम) सेंसर मॉड्यूल', 'Flame sensor module'), label: 'FLAME', act: t3('a flame is near', 'पास में लौ है', 'paas mein lau hai'), hold: true,
    info: t3('An infrared photodiode (the black "LED") sees the flicker of a flame up to about 80 cm away; the LM393 compares it with the knob\'s setting and pulls OUT LOW. Sunlight has infrared too, so keep it out of the sun.', 'एक इन्फ़्रारेड फ़ोटोडायोड (काली "LED") लगभग 80 cm दूर तक लौ की टिमटिमाहट देखता है; LM393 उसे नॉब की सेटिंग से मिलाता है और OUT को LOW करता है। धूप में भी इन्फ़्रारेड होता है, तो इसे धूप से दूर रखिए।', 'Ek infrared photodiode (kaali "LED") lagbhag 80 cm door tak lau ki timtimahat dekhta hai; LM393 use knob ki setting se milata hai aur OUT ko LOW karta hai. Dhoop mein bhi infrared hota hai, to ise dhoop se door rakhiye.') },
  sound: { name: t3('Sound sensor module', 'ध्वनि (साउंड) सेंसर मॉड्यूल', 'Sound sensor module'), label: 'SOUND', act: t3('a loud sound (a clap)', 'तेज़ आवाज़ (ताली)', 'tez awaaz (taali)'), hold: false, pulse: 0.25,
    info: t3('An electret microphone turns sound into a tiny voltage; when it is louder than the knob\'s setting, OUT goes LOW, only for as long as the sound lasts: a clap is a short pulse.', 'एक इलेक्ट्रेट माइक्रोफ़ोन आवाज़ को बहुत छोटे वोल्टेज में बदलता है; जब आवाज़ नॉब की सेटिंग से तेज़ हो, OUT LOW हो जाता है, बस आवाज़ रहने तक: ताली एक छोटी पल्स है।', 'Ek electret microphone awaaz ko bahut chhote voltage mein badalta hai; jab awaaz knob ki setting se tez ho, OUT LOW ho jaata hai, bas awaaz rehne tak: taali ek chhoti pulse hai.') },
  reed: { name: t3('Reed switch module', 'रीड स्विच मॉड्यूल', 'Reed switch module'), label: 'REED', act: t3('a magnet is near', 'पास में चुंबक है', 'paas mein chumbak hai'), hold: true,
    info: t3('Two thin iron strips sealed in a glass tube: a magnet makes them touch. Fixed on a door frame with a magnet on the door, it tells whether the door is shut: that is how burglar alarms watch doors and windows.', 'काँच की नली में बंद लोहे की दो पतली पट्टियाँ: चुंबक उन्हें छुआ देता है। दरवाज़े की चौखट पर लगा हो और चुंबक दरवाज़े पर, तो यह बताता है कि दरवाज़ा बंद है: चोर अलार्म ऐसे ही दरवाज़े-खिड़कियाँ देखते हैं।', 'Kaanch ki nali mein band lohe ki do patli pattiyan: chumbak unhe chhua deta hai. Darwaze ki chaukhat par laga ho aur chumbak darwaze par, to yeh batata hai ki darwaza band hai: chor alarm aise hi darwaze-khidkiyan dekhte hain.') },
  hall: { name: t3('Hall effect sensor module', 'हॉल इफ़ेक्ट सेंसर मॉड्यूल', 'Hall effect sensor module'), label: 'HALL', act: t3('a magnet\'s pole is near', 'चुंबक का ध्रुव पास है', 'chumbak ka dhruv paas hai'), hold: true,
    info: t3('A Hall chip (A3144) feels a magnetic field with no moving parts. A magnet on a wheel passes it once a turn: bicycle speedometers, motor speed sensors and phone covers work like this.', 'एक हॉल चिप (A3144) बिना हिलने वाले पुर्ज़ों के चुंबकीय क्षेत्र महसूस करती है। पहिये पर लगा चुंबक हर चक्कर में एक बार इसके पास से गुज़रता है: साइकिल के स्पीडोमीटर, मोटर के स्पीड सेंसर और फ़ोन कवर ऐसे ही काम करते हैं।', 'Ek Hall chip (A3144) bina hilne wale purzon ke magnetic field mehsoos karti hai. Pahiye par laga chumbak har chakkar mein ek baar iske paas se guzarta hai: cycle ke speedometer, motor ke speed sensor aur phone cover aise hi kaam karte hain.') },
  tilt: { name: t3('Tilt sensor module', 'झुकाव (टिल्ट) सेंसर मॉड्यूल', 'Tilt sensor module'), label: 'TILT', act: t3('it is tipped over', 'यह झुका दिया गया है', 'yeh jhuka diya gaya hai'), hold: true,
    info: t3('A tiny metal ball inside a can (SW-520D) rests on two contacts while it stands up; tip it over and the ball rolls off. Cheap, simple, and good enough to know that a box, a bike or a cupboard was moved.', 'एक डिब्बी (SW-520D) के अंदर छोटी सी धातु की गेंद, सीधा खड़ा रहने पर दो संपर्कों पर टिकी रहती है; झुकाइए तो गेंद लुढ़क जाती है। सस्ता, आसान, और यह जानने के लिए काफ़ी कि कोई बक्सा, साइकिल या अलमारी हिलाई गई।', 'Ek dibbi (SW-520D) ke andar chhoti si dhaatu ki gend, seedha khada rehne par do sampark par tiki rehti hai; jhukaiye to gend ludhak jaati hai. Sasta, aasaan, aur yeh jaanne ke liye kaafi ki koi baksa, cycle ya almari hilayi gayi.') },
  vibe: { name: t3('Vibration sensor module', 'कंपन (वाइब्रेशन) सेंसर मॉड्यूल', 'Vibration sensor module'), label: 'SW-420', act: t3('a knock or a shake', 'खटखटाहट या झटका', 'khatkhatahat ya jhatka'), hold: false, pulse: 0.35,
    info: t3('A spring inside a little tube (SW-420) touches a centre pin when it is shaken. A knock makes OUT flicker LOW for a moment: door knock alarms, earthquake toys and machine-fault alarms use it.', 'एक छोटी नली (SW-420) के अंदर का स्प्रिंग हिलने पर बीच वाली पिन को छूता है। खटखटाने पर OUT एक पल के लिए LOW होता है: दरवाज़े पर दस्तक के अलार्म, भूकंप वाले खिलौने और मशीन ख़राबी के अलार्म इसका इस्तेमाल करते हैं।', 'Ek chhoti nali (SW-420) ke andar ka spring hilne par beech wali pin ko chhoota hai. Khatkhatane par OUT ek pal ke liye LOW hota hai: darwaze par dastak ke alarm, bhookamp wale khilone aur machine kharabi ke alarm iska istemaal karte hain.') },
  rain: { name: t3('Rain sensor module', 'बारिश (रेन) सेंसर मॉड्यूल', 'Rain sensor module'), label: 'RAIN', act: t3('rain falls on its plate', 'इसकी प्लेट पर बारिश गिरती है', 'iski plate par baarish girti hai'), hold: true,
    info: t3('The rain plate has two comb-shaped tracks side by side. Water between them lets a little current pass; the LM393 board notices it and pulls OUT LOW. Wipe it dry and it goes HIGH again.', 'रेन प्लेट पर कंघी जैसी दो पटरियाँ साथ-साथ हैं। उनके बीच पानी हो तो थोड़ा करंट बहता है; LM393 बोर्ड इसे पकड़ता है और OUT को LOW करता है। पोंछकर सुखाइए तो यह फिर HIGH हो जाता है।', 'Rain plate par kanghi jaisi do patriyan saath-saath hain. Unke beech paani ho to thoda current behta hai; LM393 board ise pakadta hai aur OUT ko LOW karta hai. Pochh kar sukhaiye to yeh phir HIGH ho jaata hai.') },
  blink: { name: t3('IR eye-blink sensor', 'IR आँख झपकने का सेंसर', 'IR eye blink sensor'), label: 'BLINK', act: t3('the eyes are closed', 'आँखें बंद हैं', 'aankhein band hain'), hold: true,
    info: t3('An IR LED and receiver on a spectacle frame look at the eye. An open eye (the dark pupil) sends little IR back; a closed eyelid sends more, and OUT goes LOW. Long closures mean sleepiness, which is how drowsiness alarms for drivers work.', 'चश्मे के फ़्रेम पर एक IR LED और रिसीवर आँख को देखते हैं। खुली आँख (काली पुतली) थोड़ी IR लौटाती है; बंद पलक ज़्यादा, और OUT LOW हो जाता है। देर तक बंद रहना नींद का संकेत है: ड्राइवरों के नींद अलार्म ऐसे ही काम करते हैं।', 'Chashme ke frame par ek IR LED aur receiver aankh ko dekhte hain. Khuli aankh (kaali putli) thodi IR lautati hai; band palak zyada, aur OUT LOW ho jaata hai. Der tak band rehna neend ka sanket hai: drivers ke neend alarm aise hi kaam karte hain.') },
};
function mk(kind) {
  const K = KINDS22[kind];
  return {
    term: { y: 4 }, cat: 'in', mount: 'free', props: {}, state0: { trig: false, pulse: 0 },
    name: K.name,
    pins: [{ id: 'VCC', at: [-P, 0], name: t3('VCC: 3.3 V or 5 V', 'VCC: 3.3 V या 5 V', 'VCC: 3.3 V ya 5 V') }, { id: 'GND', at: [0, 0], name: t3('GND', 'GND', 'GND') },
      { id: 'OUT', at: [P, 0], name: t3(`OUT (DO): LOW when ${K.act.en}`, `OUT (DO): ${K.act.hi} तो LOW`, `OUT (DO): ${K.act.hg} to LOW`) }],
    elec: (p, N, env, V) => {
      const els = [{ type: 'R', a: N.VCC, b: N.GND, r: 1500, role: 'dmod' }];
      if (p.state.powered) { const on = p.state.trig || p.state.pulse > 0; const vcc = V ? Math.max(0, V[N.VCC] - V[N.GND]) : 5; els.push({ type: 'V', a: N.OUT, b: N.GND, v: on ? 0 : vcc, r: on ? 100 : 10000, role: 'dmodOut' }); }
      return els;
    },
    dyn: (p, els, lab, dt, vAt) => {
      const s = p.state; const on = vAt(p.N.VCC) - vAt(p.N.GND) > 3; if (on !== !!s.powered) { s.powered = on; touch(lab); }
      if (s.pulse > 0) { s.pulse -= dt; if (s.pulse <= 0) { s.pulse = 0; touch(lab); } }
      const act = !!(s.trig || s.pulse > 0); if (act !== !!s.was) { s.was = act; if (act) s.count = (s.count || 0) + 1; }
    },
    live: (p) => (!p.state.powered ? '—' : `OUT ${p.state.trig || p.state.pulse > 0 ? 'LOW · ' + K.act.en : 'HIGH'}`),
    specs: () => [['volt', '3.3–5 V, about 3 mA'], ['out', 'DO: LOW when it senses (the second LED lights)'], ['knob', 'the blue knob sets how much it takes']],
    info: K.info,
  };
}
export const TYPES22 = Object.keys(KINDS22);
export const PARTS22 = Object.fromEntries(TYPES22.map((k) => [k, mk(k)]));
export const DRAWER22 = TYPES22.slice();
// what the student does to it (the callout's button; tests call it too): a held one toggles, a short one is a pulse
export function sense22(lab, p, on) {
  const K = KINDS22[p.type]; if (!K) return;
  if (K.hold) { const v = on === undefined ? !p.state.trig : !!on; if (v !== !!p.state.trig) { p.state.trig = v; touch(lab); } }
  else { p.state.pulse = K.pulse; touch(lab); }
}
// (blink) a normal blink: the eyelid down for a tenth of a second or so
export function blink22(lab, p, secs = 0.15) { p.state.pulse = secs; touch(lab); }
