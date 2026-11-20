// DUET Robotics Lab 360, batch 28: two parts from the school kit, as data (same shape as parts.js); libs3.js has their
// Arduino libraries (OneWire + DallasTemperature, Adafruit_NeoPixel).
//   ds18b20  the waterproof temperature probe: a DS18B20 sealed in a steel tube on a 1 m cable, its three wires on a
//            header in the breadboard (GND, DATA, VCC, as the chip's own legs). DATA is "open drain": the chip can only
//            pull it down, so it needs a pull-up resistor (4.7 kΩ to VCC) or nothing answers (the library says -127).
//            The probe stands in a beaker of water (the callout sets the water's temperature); steel takes a few seconds
//            to follow it. Fresh from power-up its memory says 85 °C until the first conversion.
//   ws2812   an 8-light WS2812B stick (CJMCU-2812-8): every light has its own little chip, so one wire (DIN) sets all
//            eight colours. The chip reads three bytes a light in the order G, R, B; it needs 5 V (it stays dark below
//            about 3.5 V), and shows nothing new until the sketch sends the data (strip.show()).
const P = 2.54;
const t3 = (en, hi, hg) => ({ en, hi, hg });
const touch = (lab) => { lab.stateV = (lab.stateV || 0) + 1; lab.instKey = null; };
const setPow = (p, lab, on) => { if (on !== !!p.state.powered) { p.state.powered = on; touch(lab); return true; } return false; };
const pin = (id, x, en, hi, hg) => ({ id, at: [x, 0], name: t3(en, hi, hg) });

export const PARTS28 = {
  ds18b20: {
    cat: 'in', mount: 'bb', props: {}, state0: { water: 26, tS: 26, fresh: true },
    name: t3('Waterproof temperature probe DS18B20', 'वॉटरप्रूफ़ तापमान प्रोब DS18B20', 'Waterproof temperature probe DS18B20'),
    pins: [pin('GND', 0, 'Black: GND', 'काला: GND', 'Kaala: GND'), pin('DATA', P, 'Yellow: DATA (one wire; needs a 4.7 kΩ pull-up to VCC)', 'पीला: DATA (एक तार; VCC तक 4.7 kΩ पुल-अप चाहिए)', 'Peela: DATA (ek taar; VCC tak 4.7 kΩ pull-up chahiye)'),
      pin('VCC', 2 * P, 'Red: VCC, 3 to 5.5 V', 'लाल: VCC, 3 से 5.5 V', 'Laal: VCC, 3 se 5.5 V')],
    elec: (p, N) => [{ type: 'R', a: N.VCC, b: N.GND, r: 5000, role: 'ds18' }],
    dyn: (p, els, lab, dt, vAt) => {
      if (setPow(p, lab, vAt(p.N.VCC) - vAt(p.N.GND) > 2.9) && p.state.powered) p.state.fresh = true; // (a power-up: 85 °C in its memory)
      const s = p.state; const k = 1 - Math.exp(-dt / 4); const was = Math.round(s.tS * 16); s.tS += ((s.water ?? 26) - s.tS) * k; if (Math.round(s.tS * 16) !== was) touch(lab); // (the steel tube follows the water in a few seconds)
    },
    specs: () => [['range', '−55 to 125 °C (±0.5 °C from −10 to 85)'], ['res', '0.0625 °C at 12 bits (750 ms a reading)'], ['volt', '3.0–5.5 V'], ['wire', '1-Wire: many probes on one pin, each with its own 64-bit address']],
    info: t3('A DS18B20 chip sealed in a steel tube, so it can go into water, soil, milk or a freezer. It talks on one wire (1-Wire): the chip only pulls DATA down, so a 4.7 kΩ resistor must pull it up to VCC, or the library finds no probe and says -127. A reading takes 0.75 s.',
      'स्टील की नली में बंद एक DS18B20 चिप, ताकि यह पानी, मिट्टी, दूध या फ़्रीज़र में जा सके। यह एक तार (1-Wire) पर बात करता है: चिप DATA को सिर्फ़ नीचे खींचती है, इसलिए एक 4.7 kΩ रेज़िस्टर को उसे VCC तक ऊपर खींचना होता है, वरना लाइब्रेरी को कोई प्रोब नहीं मिलता और वह -127 कहती है। एक रीडिंग में 0.75 s लगते हैं।',
      'Steel ki nali mein band ek DS18B20 chip, taaki yeh paani, mitti, doodh ya freezer mein ja sake. Yeh ek taar (1-Wire) par baat karta hai: chip DATA ko sirf neeche kheenchti hai, isliye ek 4.7 kΩ resistor ko use VCC tak upar kheenchna hota hai, warna library ko koi probe nahi milta aur woh -127 kehti hai. Ek reading mein 0.75 s lagte hain.'),
    live: (p) => (p.state.powered ? `water ${Math.round((p.state.water ?? 26) * 10) / 10} °C · probe ${(p.state.tS ?? 26).toFixed(2)} °C` : 'no power'),
  },
  ws2812: {
    term: { y: 1.5 }, cat: 'out', mount: 'free', props: { n: 8 }, state0: { px: null },
    name: t3('RGB light stick WS2812B (8 NeoPixels)', 'RGB लाइट स्टिक WS2812B (8 नियोपिक्सेल)', 'RGB light stick WS2812B (8 NeoPixels)'),
    pins: [pin('GND', -P, 'GND', 'GND', 'GND'), pin('VCC', 0, 'VCC: 5 V (about 60 mA a light at full white)', 'VCC: 5 V (पूरे सफ़ेद पर एक लाइट लगभग 60 mA)', 'VCC: 5 V (poore safed par ek light lagbhag 60 mA)'),
      pin('DIN', P, 'DIN: the data in, from one pin of the board', 'DIN: डेटा इन, बोर्ड के एक पिन से', 'DIN: data in, board ke ek pin se')],
    elec: (p, N) => [{ type: 'R', a: N.VCC, b: N.GND, r: 600, role: 'ws' }],
    dyn: (p, els, lab, dt, vAt) => { if (setPow(p, lab, vAt(p.N.VCC) - vAt(p.N.GND) > 3.5) && !p.state.powered) p.state.px = null; }, // (no power: dark, and its memory is gone)
    specs: () => [['lights', '8 × WS2812B (5050), 16.7 million colours each'], ['volt', '5 V'], ['current', 'up to 60 mA a light (480 mA all white)'], ['data', '800 kHz, 24 bits a light, in the order G R B']],
    info: t3('Eight RGB LEDs, each with its own tiny chip. The board sends 24 bits a light down one wire; each chip keeps the first 24 and passes the rest on. The Adafruit_NeoPixel library does it: setPixelColor(), then show(). They need 5 V; the colour order is G, R, B (NEO_GRB).',
      'आठ RGB एलईडी, हर एक की अपनी छोटी चिप। बोर्ड एक ही तार पर हर लाइट के 24 बिट भेजता है; हर चिप पहले 24 रख लेती है और बाक़ी आगे भेज देती है। Adafruit_NeoPixel लाइब्रेरी यह करती है: setPixelColor(), फिर show()। इन्हें 5 V चाहिए; रंगों का क्रम G, R, B है (NEO_GRB)।',
      'Aath RGB LED, har ek ki apni chhoti chip. Board ek hi taar par har light ke 24 bit bhejta hai; har chip pehle 24 rakh leti hai aur baaki aage bhej deti hai. Adafruit_NeoPixel library yeh karti hai: setPixelColor(), phir show(). Inhe 5 V chahiye; rangon ka kram G, R, B hai (NEO_GRB).'),
    live: (p) => { if (!p.state.powered) return 'no power (it needs 5 V)'; const px = p.state.px; if (!px) return 'dark'; const lit = px.filter((c) => c[0] + c[1] + c[2] > 0).length; return lit ? `${lit} of 8 lit · first #${px[0].map((v) => v.toString(16).padStart(2, '0')).join('')}` : 'dark'; },
  },
};
export const DRAWER28 = ['ds18b20', 'ws2812'];
// what the callout's control (and the factory, and tests) do: put the probe in water of another temperature
export function set28(lab, p, k, v) { if (p.type === 'ds18b20' && k === 'water' && p.state.water !== v) { p.state.water = v; touch(lab); } }
