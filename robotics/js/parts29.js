// DUET Robotics Lab 360, batch 29: the bionic hand's two parts, as data (same shape as parts.js).
//   flexglove  a glove with a flex sensor on each finger (2.2", 25 kΩ straight, about 100 kΩ bent 90°) and, on its wrist
//              board, a 10 kΩ resistor from each finger's output to GND: F = VCC × 10k / (10k + flex). So a straight
//              finger gives about 1.4 V (290 of 1023) and a bent one about 0.45 V (93): only a fifth of the range, and
//              falling as it bends. Pins: VCC, GND, F1 (thumb) … F5 (little finger). The callout makes gestures.
//   robohand   a 3D-printed robot hand lying palm up on its forearm; five SG90 servos inside pull its fingers closed by
//              fishing line (0° open, 180° closed). The thumb's servo is mounted the other way round (as in the
//              InMoov-style hands), so for the thumb 180° means open. Pins: GND, V (the servos' own 5–6 V), S1 … S5. Its
//              GND must be joined to the board's GND (common ground), or the servos see no signal and only twitch.
const P = 2.54;
const t3 = (en, hi, hg) => ({ en, hi, hg });
const touch = (lab) => { lab.stateV = (lab.stateV || 0) + 1; lab.instKey = null; };
const pin = (id, x, en, hi, hg) => ({ id, at: [x, 0], name: t3(en, hi, hg) });
const FING = [t3('thumb', 'अँगूठा', 'angootha'), t3('index finger', 'तर्जनी', 'tarjani'), t3('middle finger', 'मध्यमा', 'madhyama'), t3('ring finger', 'अनामिका', 'anaamika'), t3('little finger', 'छोटी उँगली', 'chhoti ungli')];
export const flexOhms = (deg) => 25000 + 75000 * Math.max(0, Math.min(90, deg)) / 90;
// the glove's gestures: how far each finger bends (°), thumb first
export const GESTURES = { open: [0, 0, 0, 0, 0], fist: [80, 90, 90, 90, 90], peace: [80, 0, 0, 90, 90], thumbsup: [0, 90, 90, 90, 90], point: [80, 0, 90, 90, 90] };

export const PARTS29 = {
  flexglove: {
    term: { y: 4.5 }, cat: 'in', mount: 'free', props: {}, state0: { bend: [0, 0, 0, 0, 0], gesture: 'open' },
    name: t3('Flex sensor glove (5 fingers)', 'फ़्लेक्स सेंसर दस्ताना (5 उँगलियाँ)', 'Flex sensor dastaana (5 ungliyaan)'),
    pins: [pin('VCC', -3 * P, 'VCC: 5 V', 'VCC: 5 V', 'VCC: 5 V'), pin('GND', -2 * P, 'GND', 'GND', 'GND'),
      ...FING.map((f, i) => pin('F' + (i + 1), (i - 1) * P, `F${i + 1}: the ${f.en}'s sensor (to an analog pin)`, `F${i + 1}: ${f.hi} का सेंसर (किसी एनालॉग पिन पर)`, `F${i + 1}: ${f.hg} ka sensor (kisi analog pin par)`))],
    elec: (p, N) => { const b = p.state.bend || [0, 0, 0, 0, 0]; const E = []; for (let i = 0; i < 5; i++) { const F = N['F' + (i + 1)]; E.push({ type: 'R', a: N.VCC, b: F, r: flexOhms(b[i] || 0), role: 'flex' }, { type: 'R', a: F, b: N.GND, r: 10000 }); } return E; },
    specs: () => [['flex', '25 kΩ straight, about 100 kΩ bent 90° (each finger)'], ['divider', '10 kΩ to GND on the wrist board'], ['out', 'about 1.4 V straight, 0.45 V bent (with 5 V)']],
    info: t3('A flex sensor on each finger: its resistance grows as the finger bends. With a 10 kΩ resistor to GND it makes a voltage divider, so each finger gives a voltage the board can read. Only a small part of 0–1023 is used, and the number falls as the finger bends: read it on the Serial Monitor before you map it.',
      'हर उँगली पर एक फ़्लेक्स सेंसर: उँगली मुड़ने पर इसका प्रतिरोध बढ़ता है। GND तक 10 kΩ रेज़िस्टर के साथ यह वोल्टेज डिवाइडर बनाता है, इसलिए हर उँगली एक वोल्टेज देती है जिसे बोर्ड पढ़ सकता है। 0–1023 का बस छोटा हिस्सा काम आता है, और उँगली मुड़ने पर संख्या घटती है: map करने से पहले इसे सीरियल मॉनिटर पर पढ़िए।',
      'Har ungli par ek flex sensor: ungli mudne par iska resistance badhta hai. GND tak 10 kΩ resistor ke saath yeh voltage divider banata hai, isliye har ungli ek voltage deti hai jise board padh sakta hai. 0–1023 ka bas chhota hissa kaam aata hai, aur ungli mudne par number ghatta hai: map karne se pehle ise Serial Monitor par padhiye.'),
    live: (p) => `${p.state.gesture || 'hand'} · bends ${(p.state.bend || []).map((b) => Math.round(b)).join(' / ')}°`,
  },
  robohand: {
    term: { y: 4.5 }, cat: 'move', mount: 'free', props: {}, state0: { ang: [90, 90, 90, 90, 90], target: [null, null, null, null, null] },
    name: t3('Robot hand (5 servos, thumb mounted reversed)', 'रोबोट हाथ (5 सर्वो, अँगूठा उल्टा लगा)', 'Robot haath (5 servo, angootha ulta laga)'),
    pins: [pin('GND', -3 * P, 'GND: the servos\' ground (join it to the board\'s GND too)', 'GND: सर्वो का ग्राउंड (इसे बोर्ड के GND से भी जोड़िए)', 'GND: servo ka ground (ise board ke GND se bhi jodiye)'), pin('V', -2 * P, 'V: the servos\' power, 5–6 V from their own battery', 'V: सर्वो की बिजली, उनकी अपनी बैटरी से 5–6 V', 'V: servo ki bijli, unki apni battery se 5–6 V'),
      ...FING.map((f, i) => pin('S' + (i + 1), (i - 1) * P, `S${i + 1}: the ${f.en}'s servo signal`, `S${i + 1}: ${f.hi} के सर्वो का सिग्नल`, `S${i + 1}: ${f.hg} ke servo ka signal`))],
    elec: (p, N) => [{ type: 'R', a: N.V, b: N.GND, r: p.state.moving ? 12 : 120, role: 'hand' }],
    dyn: (p, els, lab, dt, vAt) => {
      const s = p.state; const was = !!s.powered; s.powered = vAt(p.N.V) - vAt(p.N.GND) > 4.2; if (was !== s.powered) touch(lab);
      const G = ['GND1', 'GND2', 'GND3', 'GND'].some((g) => lab.def.pins.some((q) => q.id === g) && lab.conn(p.ep.GND, 'B:' + g)); if (G === !!s.noRef) { s.noRef = !G; touch(lab); }
      const M = lab.mcu; let moving = false;
      for (let i = 0; i < 5; i++) {
        let tg = null; if (s.powered && M && M.state === 'running' && M.servos) for (const sv of M.servos) if (sv.pin >= 0 && lab.used('N:G' + sv.pin) && lab.boardNode('G' + sv.pin) === p.N['S' + (i + 1)]) tg = sv.angle();
        if (tg !== null && s.noRef) tg = (s.ang[i] ?? 90) + (Math.random() - 0.5) * 14; // (no common ground: the signal has no reference, the servo twitches)
        s.target[i] = tg; if (tg === null) continue; const d = tg - s.ang[i], step = 600 * dt; if (Math.abs(d) > 0.5) moving = true; s.ang[i] = Math.abs(d) <= step ? tg : s.ang[i] + Math.sign(d) * step; s.ang[i] = Math.max(0, Math.min(180, s.ang[i]));
      }
      if (moving !== !!s.moving) { s.moving = moving; touch(lab); } if (moving) { lab.stateV++; lab.sounds.push({ id: p.uid, kind: 'servo', f: 120, amp: 0.6 }); }
    },
    specs: () => [['servos', '5 × SG90 (0.1 s / 60°)'], ['power', '5–6 V, up to 3 A when all five pull: never from the board\'s 5V pin'], ['thumb', 'servo mounted reversed: 0° closed, 180° open']],
    info: t3('Each finger is pulled closed by a fishing line wound on a servo horn inside the forearm, and opened by an elastic. Five servos pulling together can take 3 A, far more than an Arduino can give, so they have their own battery; only their GND is shared with the board, so the signals have a reference.',
      'हर उँगली को बाँह के अंदर सर्वो हॉर्न पर लिपटी मछली पकड़ने की डोरी बंद करती है, और एक इलास्टिक खोलता है। पाँच सर्वो एक साथ खींचें तो 3 A ले सकते हैं, जो Arduino दे नहीं सकता, इसलिए उनकी अपनी बैटरी है; बोर्ड के साथ सिर्फ़ उनका GND साझा है, ताकि सिग्नल का कोई संदर्भ हो।',
      'Har ungli ko baanh ke andar servo horn par lipti machhli pakadne ki dori band karti hai, aur ek elastic kholta hai. Paanch servo ek saath kheenchen to 3 A le sakte hain, jo Arduino de nahi sakta, isliye unki apni battery hai; board ke saath sirf unka GND saajha hai, taaki signal ka koi reference ho.'),
    live: (p) => (p.state.powered ? `${p.state.noRef ? 'no common GND: twitching · ' : ''}servos ${(p.state.ang || []).map((a) => Math.round(a)).join(' / ')}°` : 'no servo power'),
  },
};
export const DRAWER29 = ['flexglove', 'robohand'];
// how far each finger is really closed (0 open .. 180 closed): the thumb's servo is mounted the other way round
export const curlOf = (p) => (p.state.ang || []).map((a, i) => (i === 0 ? 180 - a : a));
// the callout's controls (and the tests): a gesture, or one finger's bend
export function set29(lab, p, k, v) {
  if (p.type !== 'flexglove') return; const s = p.state;
  if (k === 'gesture' && GESTURES[v]) { s.bend = [...GESTURES[v]]; s.gesture = v; touch(lab); return; }
  const m = /^f([1-5])$/.exec(k); if (m) { const b = [...(s.bend || [0, 0, 0, 0, 0])]; b[+m[1] - 1] = Math.max(0, Math.min(90, +v)); s.bend = b; s.gesture = 'custom'; touch(lab); }
}
