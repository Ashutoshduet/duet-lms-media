// DUET Robotics Lab 360, batch 30: two sensors from the school kit, as data (same shape as parts.js); libs3.js has their
// Arduino libraries (HX711 by bogde, VL53L0X by Pololu).
//   loadcell  a 5 kg bar load cell under a small acrylic platform, wired (red E+, black E−, white A−, green A+) to its
//             green HX711 board: VCC, GND, DT, SCK. The HX711 is a 24-bit ADC: about 430 counts a gram, plus the
//             chip's own zero (some tens of thousands of counts) and the platform's 120 g, so a sketch must tare() the
//             empty platform and set_scale() before it reads grams. 10 readings a second. Nothing wired to DT: the
//             library waits for a reading that never comes.
//   vl53l0x   the GY-VL53L0XV2 laser distance sensor (time of flight, 940 nm), I2C address 0x29: VIN, GND, SCL, SDA
//             (GPIO1, XSHUT left free). A card slides in front of it on a ruler; a white card is seen to about 1.2 m, a
//             grey one 0.9 m, a black one only 0.55 m; past that the reading is 8190 (nothing in range).
const P = 2.54;
const t3 = (en, hi, hg) => ({ en, hi, hg });
const touch = (lab) => { lab.stateV = (lab.stateV || 0) + 1; lab.instKey = null; };
const setPow = (p, lab, on) => { if (on !== !!p.state.powered) { p.state.powered = on; touch(lab); return true; } return false; };
const pin = (id, x, en, hi, hg) => ({ id, at: [x, 0], name: t3(en, hi, hg) });
export const HX = { cal: 430, platform: 120 }; // (counts a gram; the platform's own weight, g)
export const TOF_MAX = { white: 1200, grey: 900, black: 550 };

export const PARTS30 = {
  loadcell: {
    term: { y: 4.5 }, cat: 'in', mount: 'free', props: {}, state0: { grams: 0 },
    name: t3('Load cell 5 kg with HX711 (weighing)', 'लोड सेल 5 kg, HX711 के साथ (तौल)', 'Load cell 5 kg, HX711 ke saath (taul)'),
    pins: [pin('VCC', -1.5 * P, 'VCC: 2.6 to 5.5 V', 'VCC: 2.6 से 5.5 V', 'VCC: 2.6 se 5.5 V'), pin('GND', -0.5 * P, 'GND', 'GND', 'GND'), pin('DT', 0.5 * P, 'DT (DOUT): the data out, to a digital pin', 'DT (DOUT): डेटा आउट, किसी डिजिटल पिन पर', 'DT (DOUT): data out, kisi digital pin par'),
      pin('SCK', 1.5 * P, 'SCK: the clock in, from a digital pin', 'SCK: क्लॉक इन, किसी डिजिटल पिन से', 'SCK: clock in, kisi digital pin se')],
    elec: (p, N) => [{ type: 'R', a: N.VCC, b: N.GND, r: 3500, role: 'hx' }],
    dyn: (p, els, lab, dt, vAt) => { setPow(p, lab, vAt(p.N.VCC) - vAt(p.N.GND) > 2.6); },
    specs: () => [['cell', '5 kg bar, 1 mV/V, 4 wires (E+ red, E− black, A− white, A+ green)'], ['adc', 'HX711: 24 bits, gain 128, 10 readings a second'], ['scale', 'about 430 counts a gram here (find yours with a known weight)']],
    info: t3('A metal bar with strain gauges glued on: weight bends it a hair, and their resistance changes by a millionth. The HX711 amplifies that 128 times and measures it with 24 bits. A new scale must be told its zero (tare, with the platform empty) and its scale (counts a gram, from a known weight).',
      'धातु की एक छड़ जिस पर स्ट्रेन गेज चिपके हैं: वज़न उसे बाल भर मोड़ता है, और उनका प्रतिरोध दस लाखवाँ हिस्सा बदलता है। HX711 उसे 128 गुना बढ़ाकर 24 बिट से नापता है। नए तराज़ू को उसका शून्य (tare, ख़ाली प्लेटफ़ॉर्म के साथ) और उसका पैमाना (एक ग्राम में कितनी गिनती, किसी ज्ञात वज़न से) बताना होता है।',
      'Dhaatu ki ek chhad jis par strain gauge chipke hain: wazan use baal bhar modta hai, aur unka resistance das laakhvaan hissa badalta hai. HX711 use 128 guna badhaakar 24 bit se naapta hai. Naye taraazu ko uska zero (tare, khaali platform ke saath) aur uska scale (ek gram mein kitni ginti, kisi jaane hue wazan se) batana hota hai.'),
    live: (p) => (p.state.powered ? `${Math.round(p.state.grams || 0)} g on the platform` : 'no power'),
  },
  vl53l0x: {
    term: { y: 4.5 }, cat: 'in', mount: 'free', props: { addr: 0x29 }, state0: { mm: 600, surface: 'white' },
    name: t3('Laser distance sensor VL53L0X (time of flight)', 'लेज़र दूरी सेंसर VL53L0X (टाइम ऑफ़ फ़्लाइट)', 'Laser doori sensor VL53L0X (time of flight)'),
    pins: [pin('VIN', -1.5 * P, 'VIN: 3.3 or 5 V (its own regulator)', 'VIN: 3.3 या 5 V (इसका अपना रेगुलेटर)', 'VIN: 3.3 ya 5 V (iska apna regulator)'), pin('GND', -0.5 * P, 'GND', 'GND', 'GND'),
      pin('SCL', 0.5 * P, 'SCL: the I2C clock (A5 on an Uno, GPIO 22 on an ESP32)', 'SCL: I2C क्लॉक (Uno पर A5, ESP32 पर GPIO 22)', 'SCL: I2C clock (Uno par A5, ESP32 par GPIO 22)'), pin('SDA', 1.5 * P, 'SDA: the I2C data (A4 on an Uno, GPIO 21 on an ESP32)', 'SDA: I2C डेटा (Uno पर A4, ESP32 पर GPIO 21)', 'SDA: I2C data (Uno par A4, ESP32 par GPIO 21)')],
    elec: (p, N) => [{ type: 'R', a: N.VIN, b: N.GND, r: 20000, role: 'tof' }],
    dyn: (p, els, lab, dt, vAt) => { setPow(p, lab, vAt(p.N.VIN) - vAt(p.N.GND) > 2.6); },
    specs: () => [['range', '30 mm to 1.2 m (white card), 0.55 m (black); 2 m in long-range mode'], ['accuracy', '±3 % (default timing, 33 ms a reading)'], ['light', '940 nm laser, eye-safe (Class 1)'], ['i2c', 'address 0x29']],
    info: t3('A tiny laser flashes and a light sensor times the echo: light takes about 3 nanoseconds to go 50 cm and back. It sees a narrow 25° cone, works in the dark, and does not care about soft cloth that swallows ultrasound. Dark things send back less light, so it sees them less far.',
      'एक छोटा लेज़र चमकता है और एक प्रकाश सेंसर उसकी गूँज का समय नापता है: रोशनी को 50 cm जाकर लौटने में लगभग 3 नैनोसेकंड लगते हैं। यह 25° का पतला शंकु देखता है, अँधेरे में काम करता है, और उस मुलायम कपड़े की परवाह नहीं करता जो अल्ट्रासाउंड को निगल जाता है। गहरे रंग की चीज़ें कम रोशनी लौटाती हैं, इसलिए यह उन्हें कम दूर तक देखता है।',
      'Ek chhota laser chamakta hai aur ek light sensor uski goonj ka samay naapta hai: roshni ko 50 cm jaakar lautne mein lagbhag 3 nanosecond lagte hain. Yeh 25° ka patla shanku dekhta hai, andhere mein kaam karta hai, aur us mulaayam kapde ki parwaah nahi karta jo ultrasound ko nigal jaata hai. Gehre rang ki cheezein kam roshni lautaati hain, isliye yeh unhe kam door tak dekhta hai.'),
    live: (p) => (p.state.powered ? `${p.state.surface || 'white'} card at ${Math.round(p.state.mm || 0)} mm · 0x29` : 'no power'),
  },
};
export const DRAWER30 = ['loadcell', 'vl53l0x'];
// what the callouts (and the factory, and tests) do: put weight on the platform; move the card, or change it
export function set30(lab, p, k, v) {
  const s = p.state;
  if (p.type === 'loadcell' && k === 'grams' && s.grams !== v) { s.grams = Math.max(0, Math.min(6000, +v)); touch(lab); }
  if (p.type === 'vl53l0x') { if (k === 'mm' && s.mm !== v) { s.mm = Math.max(10, Math.min(2500, +v)); touch(lab); } if (k === 'surface' && TOF_MAX[v] && s.surface !== v) { s.surface = v; touch(lab); } }
}
