// DUET Robotics Lab 360, batch 26: four I2C sensor modules from the school kit, as data (same shape as parts.js). Each
// answers on the I2C bus (SDA, SCL) at its own address; libs3.js has the Arduino libraries that read them.
//   mpu6050  GY-521: the MPU-6050 accelerometer and gyroscope, address 0x68. The student tilts it (X: roll, Y: pitch) and
//            turns it (Z); the module follows the hand at up to 200°/s (so its gyro sees the turn), and can be shaken.
//            Every chip has a small bias of its own (the gyro reads about 2 °/s standing still), which calcOffsets() removes.
//   rtc3231  ZS-042: the DS3231 real-time clock with its coin cell, address 0x68. A new module has lost its time
//            (lostPower()) until a sketch sets it; after that it runs, on the coin cell between Runs.
//   bh1750   GY-302: the BH1750 light meter, in lux (1 to 65535), address 0x23.
//   bmp180   GY-68: the BMP180 pressure and temperature sensor, address 0x77: the air's pressure falls 12 Pa a metre up,
//            and falls before a storm.
const P = 2.54;
const t3 = (en, hi, hg) => ({ en, hi, hg });
const touch = (lab) => { lab.stateV = (lab.stateV || 0) + 1; lab.instKey = null; };
const setPow = (p, lab, on) => { if (on !== !!p.state.powered) { p.state.powered = on; touch(lab); return true; } return false; };
const pin = (id, x, en, hi, hg) => ({ id, at: [x, 0], name: t3(en, hi, hg) });
const I2C = (x) => [pin('SCL', x, 'SCL: the I2C clock (A5 on an Uno, GPIO 22 on an ESP32)', 'SCL: I2C क्लॉक (Uno पर A5, ESP32 पर GPIO 22)', 'SCL: I2C clock (Uno par A5, ESP32 par GPIO 22)'), pin('SDA', x + P, 'SDA: the I2C data (A4 on an Uno, GPIO 21 on an ESP32)', 'SDA: I2C डेटा (Uno पर A4, ESP32 पर GPIO 21)', 'SDA: I2C data (Uno par A4, ESP32 par GPIO 21)')];
const VG = (x, vn = 'VCC') => [pin(vn, x, `${vn}: 3.3 V or 5 V (it has its own regulator)`, `${vn}: 3.3 V या 5 V (इसका अपना रेगुलेटर है)`, `${vn}: 3.3 V ya 5 V (iska apna regulator hai)`), pin('GND', x + P, 'GND', 'GND', 'GND')];
const powerDyn = (vn = 'VCC') => (p, els, lab, dt, vAt) => setPow(p, lab, vAt(p.N[vn]) - vAt(p.N.GND) > 2.4);
const fmtT = (s) => { const d = new Date((s + 946684800) * 1000); const z = (n) => String(n).padStart(2, '0'); return `${d.getUTCFullYear()}-${z(d.getUTCMonth() + 1)}-${z(d.getUTCDate())} ${z(d.getUTCHours())}:${z(d.getUTCMinutes())}:${z(d.getUTCSeconds())}`; };

export const PARTS26 = {
  mpu6050: {
    term: { y: 4.5 }, cat: 'in', mount: 'free', props: { addr: 0x68 }, state0: { roll: 0, pitch: 0, yaw: 0, to: [0, 0, 0], rate: [0, 0, 0], shake: 0 },
    name: t3('Motion sensor MPU-6050 (GY-521: tilt and turn)', 'मोशन सेंसर MPU-6050 (GY-521: झुकाव और घुमाव)', 'Motion sensor MPU-6050 (GY-521: jhukaav aur ghumaav)'),
    pins: [...VG(-3.5 * P), ...I2C(-1.5 * P), pin('XDA', 0.5 * P, 'XDA: for a second sensor (leave free)', 'XDA: दूसरे सेंसर के लिए (ख़ाली छोड़िए)', 'XDA: doosre sensor ke liye (khaali chhodiye)'), pin('XCL', 1.5 * P, 'XCL: for a second sensor (leave free)', 'XCL: दूसरे सेंसर के लिए (ख़ाली छोड़िए)', 'XCL: doosre sensor ke liye (khaali chhodiye)'),
      pin('AD0', 2.5 * P, 'AD0: free or LOW = address 0x68, HIGH = 0x69', 'AD0: ख़ाली या LOW = पता 0x68, HIGH = 0x69', 'AD0: khaali ya LOW = address 0x68, HIGH = 0x69'), pin('INT', 3.5 * P, 'INT: interrupt out (not needed)', 'INT: इंटरप्ट आउट (ज़रूरी नहीं)', 'INT: interrupt out (zaroori nahi)')],
    elec: (p, N) => [{ type: 'R', a: N.VCC, b: N.GND, r: 1400, role: 'mpu' }],
    dyn: (p, els, lab, dt, vAt) => { // the hand moves the module towards where it was asked (200°/s at most): that turning is what its gyro feels
      setPow(p, lab, vAt(p.N.VCC) - vAt(p.N.GND) > 2.4); const s = p.state; const to = s.to || [0, 0, 0]; const cur = [s.roll || 0, s.pitch || 0, s.yaw || 0]; const rate = [0, 0, 0]; let moved = false;
      for (let i = 0; i < 3; i++) { const d = to[i] - cur[i]; const step = Math.sign(d) * Math.min(Math.abs(d), 200 * dt); if (Math.abs(d) > 1e-3) { cur[i] += step; rate[i] = dt > 0 ? step / dt : 0; moved = true; } }
      [s.roll, s.pitch, s.yaw] = cur; s.rate = rate; if (s.shake > 0) { s.shake = Math.max(0, s.shake - dt); moved = true; } if (moved) touch(lab);
    },
    info: t3('A chip with a 3-axis accelerometer (it feels gravity, so it knows which way is down) and a 3-axis gyroscope (it feels turning). Phones, drones, gimbals and self-balancing robots use it. The accelerometer is right but jumpy; the gyro is smooth but drifts: the library mixes them (a complementary filter). Keep it flat and still while calcOffsets() runs.',
      'एक चिप जिसमें 3-अक्ष एक्सेलेरोमीटर (यह गुरुत्व महसूस करता है, इसलिए जानता है कि नीचे किधर है) और 3-अक्ष जाइरोस्कोप (यह घूमना महसूस करता है) है। फ़ोन, ड्रोन, गिम्बल और ख़ुद संतुलन बनाने वाले रोबोट इसका इस्तेमाल करते हैं। एक्सेलेरोमीटर सही पर उछलता है; जाइरो स्मूद पर भटकता है: लाइब्रेरी दोनों को मिलाती है (कॉम्प्लिमेंटरी फ़िल्टर)। calcOffsets() चलते समय इसे सपाट और स्थिर रखिए।',
      'Ek chip jismein 3-axis accelerometer (yeh gravity mehsoos karta hai, isliye jaanta hai ki neeche kidhar hai) aur 3-axis gyroscope (yeh ghoomna mehsoos karta hai) hai. Phone, drone, gimbal aur khud santulan banaane wale robot iska istemaal karte hain. Accelerometer sahi par uchhalta hai; gyro smooth par bhatakta hai: library dono ko milaati hai (complementary filter). calcOffsets() chalte samay ise sapaat aur sthir rakhiye.'),
    live: (p) => (p.state.powered ? `X ${Math.round(p.state.roll || 0)}° · Y ${Math.round(p.state.pitch || 0)}° · Z ${Math.round(p.state.yaw || 0)}°${p.state.shake > 0 ? ' · shaking' : ''} · 0x68` : 'no power'),
  },
  rtc3231: {
    term: { y: 4.5 }, cat: 'in', mount: 'free', props: { addr: 0x68 }, state0: { lost: true, epoch: 0 },
    name: t3('Real-time clock DS3231 (with coin cell)', 'रियल-टाइम क्लॉक DS3231 (सिक्का सेल के साथ)', 'Real-time clock DS3231 (sikka cell ke saath)'),
    pins: [pin('32K', -2.5 * P, '32K: a 32 kHz square wave out (not needed)', '32K: 32 kHz वर्ग तरंग आउट (ज़रूरी नहीं)', '32K: 32 kHz square wave out (zaroori nahi)'), pin('SQW', -1.5 * P, 'SQW: alarm or 1 Hz out (not needed)', 'SQW: अलार्म या 1 Hz आउट (ज़रूरी नहीं)', 'SQW: alarm ya 1 Hz out (zaroori nahi)'), ...I2C(-0.5 * P), ...VG(1.5 * P)],
    elec: (p, N) => [{ type: 'R', a: N.VCC, b: N.GND, r: 25000, role: 'rtc' }],
    dyn: powerDyn(),
    info: t3('A clock chip with its own crystal, kept warm-or-cold-proof (it corrects for temperature: about 1 minute a year), and a coin cell that keeps it ticking when the board is off. Set it once (rtc.adjust) and it remembers. Leaving rtc.adjust(compile time) in setup() is a classic bug: every reset puts the clock back.',
      'अपने क्रिस्टल वाली घड़ी-चिप, जो तापमान के हिसाब से ख़ुद को सुधारती है (साल में लगभग 1 मिनट), और एक सिक्का सेल जो बोर्ड बंद होने पर भी इसे चलाए रखता है। इसे एक बार सेट कीजिए (rtc.adjust) और यह याद रखती है। setup() में rtc.adjust(कम्पाइल का समय) छोड़ देना एक मशहूर ग़लती है: हर रीसेट घड़ी को पीछे कर देता है।',
      'Apne crystal wali ghadi-chip, jo taapmaan ke hisaab se khud ko sudhaarti hai (saal mein lagbhag 1 minute), aur ek sikka cell jo board band hone par bhi ise chalaaye rakhta hai. Ise ek baar set kijiye (rtc.adjust) aur yeh yaad rakhti hai. setup() mein rtc.adjust(compile ka samay) chhod dena ek mashhoor galti hai: har reset ghadi ko peeche kar deta hai.'),
    live: (p, lab) => { if (!p.state.powered) return 'no power'; if (p.state.lost) return 'time lost: set it with rtc.adjust()'; const t = lab ? lab.clock || 0 : 0; return fmtT((p.state.epoch || 0) + Math.floor(t - (p.state.base || 0))); },
  },
  bh1750: {
    term: { y: 4.5 }, cat: 'in', mount: 'free', props: { addr: 0x23 }, state0: { lux: 300 },
    name: t3('Light meter BH1750 (GY-302, lux)', 'लाइट मीटर BH1750 (GY-302, लक्स)', 'Light meter BH1750 (GY-302, lux)'),
    pins: [...VG(-2 * P), ...I2C(0), pin('ADDR', 2 * P, 'ADDR: free or LOW = address 0x23, HIGH = 0x5C', 'ADDR: ख़ाली या LOW = पता 0x23, HIGH = 0x5C', 'ADDR: khaali ya LOW = address 0x23, HIGH = 0x5C')],
    elec: (p, N) => [{ type: 'R', a: N.VCC, b: N.GND, r: 25000, role: 'bh' }],
    dyn: powerDyn(),
    info: t3('A light meter on a chip: it measures light as the human eye sees it, straight in lux (an LDR only gives a number you must calibrate). A classroom needs about 300 lux on the desk, a reading lamp 500, sunlight is 30,000 to 100,000.',
      'चिप पर एक लाइट मीटर: यह रोशनी को वैसे नापता है जैसे इंसानी आँख देखती है, सीधे लक्स में (एलडीआर सिर्फ़ एक संख्या देता है जिसे कैलिब्रेट करना पड़ता है)। क्लासरूम में डेस्क पर लगभग 300 लक्स चाहिए, पढ़ने के लैंप पर 500, धूप 30,000 से 1,00,000 होती है।',
      'Chip par ek light meter: yeh roshni ko waise naapta hai jaise insaani aankh dekhti hai, seedhe lux mein (LDR sirf ek sankhya deta hai jise calibrate karna padta hai). Classroom mein desk par lagbhag 300 lux chahiye, padhne ke lamp par 500, dhoop 30,000 se 1,00,000 hoti hai.'),
    live: (p) => (p.state.powered ? `${Math.round(p.state.lux || 0)} lux · 0x23` : 'no power'),
  },
  bmp180: {
    term: { y: 4.5 }, cat: 'in', mount: 'free', props: { addr: 0x77 }, state0: { alt: 0, wx: 0 },
    name: t3('Pressure sensor BMP180 (GY-68: air pressure, altitude)', 'दबाव सेंसर BMP180 (GY-68: वायुदाब, ऊँचाई)', 'Pressure sensor BMP180 (GY-68: vaayudaab, oonchaai)'),
    pins: [...VG(-1.5 * P, 'VIN'), ...I2C(0.5 * P)],
    elec: (p, N) => [{ type: 'R', a: N.VIN, b: N.GND, r: 25000, role: 'bmp' }],
    dyn: powerDyn('VIN'),
    info: t3('It weighs the air above it: about 1013 hPa at sea level, 12 Pa less for every metre you climb, so it can tell your altitude to about a metre. The weather moves it too: a fast fall of a few hPa means a storm is coming. Weather stations, drones and fitness bands use it.',
      'यह अपने ऊपर की हवा को तौलता है: समुद्र तल पर लगभग 1013 hPa, हर मीटर ऊपर चढ़ने पर 12 Pa कम, इसलिए यह आपकी ऊँचाई लगभग एक मीटर तक बता सकता है। मौसम भी इसे बदलता है: कुछ hPa की तेज़ गिरावट का मतलब है तूफ़ान आ रहा है। मौसम स्टेशन, ड्रोन और फ़िटनेस बैंड इसका इस्तेमाल करते हैं।',
      'Yeh apne upar ki hawa ko taulta hai: samudra tal par lagbhag 1013 hPa, har meter upar chadhne par 12 Pa kam, isliye yeh aapki oonchaai lagbhag ek meter tak bata sakta hai. Mausam bhi ise badalta hai: kuch hPa ki tez giraavat ka matlab hai toofaan aa raha hai. Mausam station, drone aur fitness band iska istemaal karte hain.'),
    live: (p) => { if (!p.state.powered) return 'no power'; const pa = 101325 * Math.pow(1 - (p.state.alt || 0) / 44330, 5.255) + (p.state.wx || 0) * 100; return `${(pa / 100).toFixed(1)} hPa · ${Math.round(p.state.alt || 0)} m · 0x77`; },
  },
};
export const DRAWER26 = ['mpu6050', 'rtc3231', 'bh1750', 'bmp180'];
// what the callout's controls (and the factory, and tests) do: tilt or turn the MPU, shake it; set or move the clock;
// change the light, the altitude or the weather
export function set26(lab, p, k, v) {
  const s = p.state;
  if (p.type === 'mpu6050') { if (k === 'shake') { s.shake = 1.2; touch(lab); return; } const i = { x: 0, y: 1, z: 2 }[k]; if (i === undefined) return; const to = [...(s.to || [0, 0, 0])]; to[i] = v; s.to = to; if (k === 'jump') return; touch(lab); }
  if (p.type === 'rtc3231') { const t = lab.clock || 0; if (k === 'hour') { const base = Date.UTC(2026, 10, 21, 0, 0, 0) / 1000 - 946684800; s.epoch = base + Math.round(v * 3600); s.base = t; s.lost = false; } if (k === 'plus') { if (s.lost) { s.lost = false; s.epoch = 0; s.base = t; } s.epoch = (s.epoch || 0) + v; } touch(lab); }
  if (p.type === 'bh1750' && s.lux !== v) { s.lux = v; touch(lab); }
  if (p.type === 'bmp180') { if (k === 'alt' && s.alt !== v) { s.alt = v; touch(lab); } if (k === 'wx' && s.wx !== v) { s.wx = v; touch(lab); } }
}
