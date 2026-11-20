// DUET Robotics Lab 360: the parts, as data. One definition per part:
//   pins   where each leg or terminal is (mm, part's own frame: the first pin at 0,0; x along the part, z across)
//   mount  'bb' (its legs go into breadboard holes) or 'free' (it sits on the mat; wires go to its terminals)
//   elec   its electrical model: the circuit elements it adds (solver.js), given the node of each pin
//   specs  label key (i18n SPEC) and value · info: what it is, in English, Hindi and Hinglish
// The 3D model of each kind is made in models.js. New parts (sensors, drivers, displays) are added here.
import { PARTS2, DRAWER2 } from './parts2.js';
import { PARTS4, DRAWER4 } from './parts4.js'; // batch 4: LED bar graph, resistor network, touch plate, magnet (the new boards' lessons)
import { PARTS3, DRAWER3 } from './parts3.js'; // batch 3: LCD, OLED, 7-segment, DHT11, soil, PIR, relay, IR, keypad, stepper, RFID, MQ-2
import { PARTS6, DRAWER6 } from './parts6.js'; // batch 6: the active buzzer (Raspberry Pi lessons)
import { PARTS22, DRAWER22 } from './parts22.js';
import { PARTS24, DRAWER24 } from './parts24.js';
import { PARTS25, DRAWER25 } from './parts25.js'; // batch 25: FSR, flex sensor, NTC thermistor
import { PARTS30, DRAWER30 } from './parts30.js'; // batch 30: the load cell (HX711), the laser distance sensor
import { PARTS29, DRAWER29 } from './parts29.js'; // batch 29: the flex glove and the robot hand
import { PARTS28, DRAWER28 } from './parts28.js'; // batch 28: the DS18B20 probe, the WS2812 light stick
import { PARTS26, DRAWER26 } from './parts26.js'; // batch 26: the I2C modules (MPU-6050, DS3231, BH1750, BMP180) // batch 24: the MCP3008 ADC chip (the Pi's analog inputs) // batch 22: eight digital sensor modules (flame, sound, reed, Hall, tilt, vibration, rain, eye blink)
import { PARTS12, DRAWER12 } from './parts12.js'; // batch 12: the test sample and the buzz wire (Class 1 circuits)
const P = 2.54;
export const PITCH = P;

export const LED_COLORS = {
  red: { vf: 1.75, rs: 12, hex: 0xff2a14, glow: 0xff3a1a, body: 0xd8180c, nm: 625, v20: '2.0 V' },
  yellow: { vf: 1.85, rs: 12, hex: 0xffc414, glow: 0xffb21a, body: 0xf2b20c, nm: 590, v20: '2.1 V' },
  green: { vf: 1.9, rs: 15, hex: 0x30ff3c, glow: 0x46ff40, body: 0x22c82a, nm: 570, v20: '2.2 V' },
  blue: { vf: 2.72, rs: 18, hex: 0x2a64ff, glow: 0x3a72ff, body: 0x1a46e6, nm: 470, v20: '3.1 V' },
  white: { vf: 2.82, rs: 18, hex: 0xf4f7ff, glow: 0xe8f0ff, body: 0xf0f2f4, nm: 0, v20: '3.2 V' },
};
export const RGB_CH = { R: { vf: 1.75, rs: 12, hex: 0xff2a14 }, G: { vf: 2.62, rs: 16, hex: 0x30ff3c }, B: { vf: 2.72, rs: 18, hex: 0x2a64ff } };
export const MOTOR = { r: 8, ke: 0.005, J: 1.2e-6, b: 1e-6, tf: 1.5e-4 };
// a standard resistor value (E12 series) and its colour bands
export const E12 = [10, 12, 15, 18, 22, 27, 33, 39, 47, 56, 68, 82];
export const RES_VALUES = [100, 150, 220, 330, 470, 680, 1000, 2200, 4700, 10000, 22000, 47000, 100000];
export const fmtOhm = (r) => (r >= 1e6 ? +(r / 1e6).toFixed(2) + ' MΩ' : r >= 1000 ? +(r / 1000).toFixed(2) + ' kΩ' : Math.round(r) + ' Ω');
export const BAND = ['#121212', '#7a4a22', '#d42a1c', '#f07a12', '#f2d018', '#2e9e3a', '#2a5ad8', '#8a3ad0', '#8c8c8c', '#f4f4f4'];
export function bands(ohms) { // 4 bands: two digits, multiplier, gold tolerance
  let e = 0, v = ohms; while (v >= 100) { v /= 10; e++; } while (v < 10 && e > -2) { v *= 10; e--; }
  const d = Math.round(v); return [BAND[Math.floor(d / 10)], BAND[d % 10], e >= 0 ? BAND[e] : e === -1 ? '#c9a23a' : '#c0c0c8', '#c9a23a'];
}
const ldrOhms = (lux) => Math.min(1e6, 15000 * Math.pow(Math.max(lux, 0.05) / 10, -0.7));
export const luxOf = (light) => 0.3 * Math.pow(1000 / 0.3, Math.max(0, Math.min(1, light))); // light slider 0..1 -> 0.3 .. 1000 lux

const t3 = (en, hi, hg) => ({ en, hi, hg });

export const PARTS = {
  led: {
    cat: 'out', mount: 'bb', props: { color: 'red' }, color: true,
    name: t3('LED', 'एलईडी (LED)', 'LED'),
    pins: [{ id: 'K', at: [0, 0], name: t3('Cathode (−): short leg, flat side', 'कैथोड (−): छोटा पैर, चपटी तरफ़', 'Cathode (−): chhota pair, flat side') },
      { id: 'A', at: [P, 0], name: t3('Anode (+): long leg', 'एनोड (+): लंबा पैर', 'Anode (+): lamba pair') }],
    elec: (p, N) => (p.state.burnt ? [] : [{ type: 'D', a: N.A, b: N.K, vf: LED_COLORS[p.props.color].vf, rs: LED_COLORS[p.props.color].rs, role: 'led' }]),
    specs: (p) => [['color', p.props.color], ['vf', LED_COLORS[p.props.color].v20 + ' @ 20 mA'], ['imax', '20 mA (max 30 mA)'], ['size', '5 mm']],
    info: t3('A light that works only one way round. Current goes in at the long leg (+) and out at the short leg (−). It always needs a resistor, or too much current burns it.',
      'यह एक बत्ती है जो सिर्फ़ एक तरफ़ से चलती है। करंट लंबे पैर (+) से अंदर जाता है और छोटे पैर (−) से बाहर आता है। इसके साथ रेज़िस्टर हमेशा लगाइए, वरना ज़्यादा करंट से यह जल जाएगी।',
      'Yeh ek light hai jo sirf ek taraf se chalti hai. Current lambe pair (+) se andar jaata hai aur chhote pair (−) se bahar aata hai. Iske saath resistor hamesha lagaiye, warna zyada current se yeh jal jaayegi.'),
  },
  rgb: {
    cat: 'out', mount: 'bb', props: {},
    name: t3('RGB LED (common cathode)', 'RGB एलईडी (कॉमन कैथोड)', 'RGB LED (common cathode)'),
    pins: [{ id: 'R', at: [0, 0], name: t3('Red (+)', 'लाल (+)', 'Red (+)') }, { id: 'K', at: [P, 0], name: t3('Common cathode (−): the longest leg', 'कॉमन कैथोड (−): सबसे लंबा पैर', 'Common cathode (−): sabse lamba pair') },
      { id: 'G', at: [2 * P, 0], name: t3('Green (+)', 'हरा (+)', 'Green (+)') }, { id: 'B', at: [3 * P, 0], name: t3('Blue (+)', 'नीला (+)', 'Blue (+)') }],
    elec: (p, N) => (p.state.burnt ? [] : ['R', 'G', 'B'].map((c) => ({ type: 'D', a: N[c], b: N.K, vf: RGB_CH[c].vf, rs: RGB_CH[c].rs, role: 'rgb', ch: c }))),
    specs: () => [['vf', 'R 2.0 V · G 3.0 V · B 3.1 V'], ['imax', '20 mA each'], ['size', '5 mm, 4 legs']],
    info: t3('Three LEDs (red, green, blue) in one bulb. They share the longest leg (−). Mix them to make any colour: red + green = yellow.',
      'एक ही बल्ब में तीन एलईडी हैं: लाल, हरी और नीली। तीनों का सबसे लंबा पैर (−) एक ही है। इन्हें मिलाकर कोई भी रंग बनाइए: लाल + हरा = पीला।',
      'Ek hi bulb mein teen LED hain: red, green aur blue. Teeno ka sabse lamba pair (−) common hai. Inhe mila kar koi bhi colour banaiye: red + green = yellow.'),
  },
  resistor: {
    cat: 'basic', mount: 'bb', props: { ohms: 220, span: 4 }, axial: true,
    name: t3('Resistor', 'रेज़िस्टर (प्रतिरोधक)', 'Resistor'),
    pins: [{ id: '1', at: [0, 0], name: t3('Leg 1 (either way round)', 'पैर 1 (कोई भी तरफ़)', 'Pair 1 (koi bhi taraf)') }, { id: '2', at: [4 * P, 0], name: t3('Leg 2', 'पैर 2', 'Pair 2') }],
    elec: (p, N) => [{ type: 'R', a: N['1'], b: N['2'], r: p.props.ohms, role: 'res' }],
    specs: (p) => [['ohms', fmtOhm(p.props.ohms) + ' ±5%'], ['power', '0.25 W'], ['bands', '']],
    info: t3('It slows the current down. The coloured bands tell its value in ohms (Ω). More ohms, less current: I = V ÷ R.',
      'यह करंट को धीमा करता है। इसकी रंगीन पट्टियाँ इसका मान ओम (Ω) में बताती हैं। जितने ज़्यादा ओम, उतना कम करंट: I = V ÷ R।',
      'Yeh current ko kam karta hai. Iski coloured bands iski value ohm (Ω) mein batati hain. Jitne zyada ohm, utna kam current: I = V ÷ R.'),
  },
  button: {
    cat: 'in', mount: 'bb', props: {},
    name: t3('Push button', 'पुश बटन', 'Push button'),
    pins: [{ id: 'L1', at: [0, 0], name: t3('Leg 1 (joined to leg 2)', 'पैर 1 (पैर 2 से जुड़ा)', 'Pair 1 (pair 2 se juda)') }, { id: 'L2', at: [0, 3 * P], name: t3('Leg 2 (joined to leg 1)', 'पैर 2 (पैर 1 से जुड़ा)', 'Pair 2 (pair 1 se juda)') },
      { id: 'L3', at: [2 * P, 0], name: t3('Leg 3 (joined to leg 4)', 'पैर 3 (पैर 4 से जुड़ा)', 'Pair 3 (pair 4 se juda)') }, { id: 'L4', at: [2 * P, 3 * P], name: t3('Leg 4 (joined to leg 3)', 'पैर 4 (पैर 3 से जुड़ा)', 'Pair 4 (pair 3 se juda)') }],
    elec: (p, N) => [{ type: 'R', a: N.L1, b: N.L2, r: 0.02 }, { type: 'R', a: N.L3, b: N.L4, r: 0.02 }, { type: 'SW', a: N.L1, b: N.L3, on: !!p.state.pressed, role: 'sw' }],
    specs: () => [['size', '6 × 6 mm'], ['rating', '12 V, 50 mA']],
    info: t3('Pressing it joins the left legs to the right legs. Put it across the middle gap of the breadboard. Press and hold it with the mouse or your finger.',
      'इसे दबाने पर बाएँ पैर दाएँ पैरों से जुड़ जाते हैं। इसे ब्रेडबोर्ड की बीच वाली खाली जगह के आर-पार लगाइए। माउस या उँगली से इसे दबाकर रखिए।',
      'Ise dabane par left pair right pairon se jud jaate hain. Ise breadboard ke beech wale gap ke aar-paar lagaiye. Mouse ya ungli se ise daba kar rakhiye.'),
  },
  pot: {
    cat: 'in', mount: 'bb', props: { ohms: 10000 }, state0: { pos: 0.5 },
    name: t3('Potentiometer (knob) 10 kΩ', 'पोटेंशियोमीटर (नॉब) 10 kΩ', 'Potentiometer (knob) 10 kΩ'),
    pins: [{ id: '1', at: [0, 0], name: t3('End 1 (to 5V or GND)', 'सिरा 1 (5V या GND से)', 'End 1 (5V ya GND se)') }, { id: 'W', at: [2 * P, 0], name: t3('Wiper (middle): the output', 'वाइपर (बीच वाला): आउटपुट', 'Wiper (beech wala): output') },
      { id: '3', at: [4 * P, 0], name: t3('End 2 (to GND or 5V)', 'सिरा 2 (GND या 5V से)', 'End 2 (GND ya 5V se)') }],
    elec: (p, N) => { const r = p.props.ohms, k = p.state.pos; return [{ type: 'R', a: N['1'], b: N.W, r: r * k + 0.5 }, { type: 'R', a: N.W, b: N['3'], r: r * (1 - k) + 0.5 }]; },
    specs: (p) => [['ohms', fmtOhm(p.props.ohms)], ['turn', '300°']],
    info: t3('A resistor with a knob. The middle leg slides along it: turn the knob and its voltage changes smoothly from 0 V to 5 V. Drag the knob to turn it.',
      'यह नॉब वाला रेज़िस्टर है। इसका बीच वाला पैर अंदर खिसकता है: नॉब घुमाइए, तो इसका वोल्टेज 0 V से 5 V तक धीरे-धीरे बदलता है। नॉब को खींचकर घुमाइए।',
      'Yeh knob wala resistor hai. Iska beech wala pair andar khisakta hai: knob ghumaiye, to iska voltage 0 V se 5 V tak dheere-dheere badalta hai. Knob ko kheench kar ghumaiye.'),
  },
  buzzer: {
    cat: 'out', mount: 'bb', props: {},
    name: t3('Piezo buzzer (passive)', 'पीज़ो बज़र', 'Piezo buzzer'),
    pins: [{ id: 'P', at: [0, 0], name: t3('+ (to the Arduino pin)', '+ (Arduino के पिन से)', '+ (Arduino ke pin se)') }, { id: 'N', at: [3 * P, 0], name: t3('− (to GND)', '− (GND से)', '− (GND se)') }],
    elec: (p, N) => [{ type: 'R', a: N.P, b: N.N, r: 1e6, role: 'buzz' }],
    specs: () => [['freq', '20 Hz – 10 kHz (loudest ~2.7 kHz)'], ['volt', '3–5 V'], ['size', '12 mm']],
    info: t3('A thin disc inside bends when the voltage changes. tone(pin, 440) switches the pin 440 times a second, so you hear the note A.',
      'इसके अंदर एक पतली प्लेट है जो वोल्टेज बदलने पर मुड़ती है। tone(pin, 440) पिन को एक सेकंड में 440 बार चालू-बंद करता है, तो आपको "ला" सुर सुनाई देता है।',
      'Iske andar ek patli plate hai jo voltage badalne par mudti hai. tone(pin, 440) pin ko ek second mein 440 baar on-off karta hai, to aapko note A sunai deta hai.'),
  },
  ldr: {
    cat: 'in', mount: 'bb', props: {},
    name: t3('LDR (light sensor)', 'एलडीआर (रोशनी सेंसर)', 'LDR (light sensor)'),
    pins: [{ id: '1', at: [0, 0], name: t3('Leg 1', 'पैर 1', 'Pair 1') }, { id: '2', at: [2 * P, 0], name: t3('Leg 2', 'पैर 2', 'Pair 2') }],
    elec: (p, N, env) => [{ type: 'R', a: N['1'], b: N['2'], r: ldrOhms(p.state.ext && p.state.lux !== undefined ? p.state.lux : luxOf(env.light)), role: 'ldr' }], // (batch 14: an LDR on a robot gets its own light)
    specs: () => [['bright', '≈ 600 Ω (1000 lux)'], ['dim', '≈ 15 kΩ (10 lux)'], ['dark', '≈ 1 MΩ']],
    info: t3('A light dependent resistor. In bright light it lets current through easily (low ohms); in the dark it hardly does (high ohms). Use the room light slider.',
      'यह रोशनी पर चलने वाला रेज़िस्टर है। तेज़ रोशनी में इसका प्रतिरोध कम होता है, अँधेरे में बहुत ज़्यादा। कमरे की रोशनी वाले स्लाइडर से जाँचिए।',
      'Yeh light par chalne wala resistor hai. Tez roshni mein iska resistance kam hota hai, andhere mein bahut zyada. Room light slider se check kijiye.'),
  },
  npn: {
    cat: 'basic', mount: 'bb', props: {},
    name: t3('NPN transistor (2N2222 type)', 'एनपीएन ट्रांज़िस्टर (2N2222)', 'NPN transistor (2N2222)'),
    pins: [{ id: 'E', at: [0, 0], name: t3('Emitter (E): to GND', 'एमिटर (E): GND से', 'Emitter (E): GND se') }, { id: 'B', at: [P, 0], name: t3('Base (B): the control, through 1 kΩ', 'बेस (B): कंट्रोल, 1 kΩ से होकर', 'Base (B): control, 1 kΩ se hokar') },
      { id: 'C', at: [2 * P, 0], name: t3('Collector (C): to the motor', 'कलेक्टर (C): मोटर से', 'Collector (C): motor se') }],
    elec: (p, N) => [{ type: 'Q', c: N.C, b: N.B, e: N.E, beta: 150, vbe: 0.65, vsat: 0.15, role: 'npn' }],
    specs: () => [['icmax', '600 mA'], ['gain', 'hFE ≈ 150'], ['vbe', '0.65 V'], ['pkg', 'TO-92 (E B C, flat side to you)']],
    info: t3('An electronic switch. A small current into the base (B) lets a big current flow from the collector (C) to the emitter (E). The Arduino pin cannot run a motor, but a transistor can.',
      'यह एक इलेक्ट्रॉनिक स्विच है। बेस (B) में थोड़ा-सा करंट जाने पर कलेक्टर (C) से एमिटर (E) तक बड़ा करंट चलने लगता है। Arduino का पिन मोटर नहीं चला सकता, पर ट्रांज़िस्टर चला सकता है।',
      'Yeh ek electronic switch hai. Base (B) mein thoda sa current jaane par collector (C) se emitter (E) tak bada current chalne lagta hai. Arduino ka pin motor nahi chala sakta, par transistor chala sakta hai.'),
  },
  diode: {
    cat: 'basic', mount: 'bb', props: { span: 4 }, axial: true,
    name: t3('Diode 1N4007', 'डायोड 1N4007', 'Diode 1N4007'),
    pins: [{ id: 'A', at: [0, 0], name: t3('Anode', 'एनोड', 'Anode') }, { id: 'K', at: [4 * P, 0], name: t3('Cathode: the end with the grey band', 'कैथोड: स्लेटी पट्टी वाला सिरा', 'Cathode: grey band wala end') }],
    elec: (p, N) => [{ type: 'D', a: N.A, b: N.K, vf: 0.62, rs: 0.25, role: 'diode' }],
    specs: () => [['vf', '0.7 V'], ['imax', '1 A'], ['vr', '1000 V']],
    info: t3('Current passes only from anode to cathode (the band). Across a motor it catches the voltage kick when the motor is switched off, and saves the transistor.',
      'करंट सिर्फ़ एनोड से कैथोड (पट्टी वाली तरफ़) की ओर जाता है। मोटर के साथ लगाने पर, मोटर बंद होते समय आने वाले वोल्टेज के झटके को यह रोक लेता है और ट्रांज़िस्टर बच जाता है।',
      'Current sirf anode se cathode (band wali taraf) ki taraf jaata hai. Motor ke saath lagane par, motor band hote waqt aane wale voltage ke jhatke ko yeh rok leta hai aur transistor bach jaata hai.'),
  },
  lm35: {
    cat: 'in', mount: 'bb', props: {},
    name: t3('Temperature sensor LM35', 'तापमान सेंसर LM35', 'Temperature sensor LM35'),
    pins: [{ id: 'VS', at: [0, 0], name: t3('+Vs: to 5V', '+Vs: 5V से', '+Vs: 5V se') }, { id: 'OUT', at: [P, 0], name: t3('Vout: 10 mV for each °C', 'Vout: हर °C पर 10 mV', 'Vout: har °C par 10 mV') }, { id: 'GND', at: [2 * P, 0], name: t3('GND', 'GND', 'GND') }],
    elec: (p, N, env, V) => {
      const els = [{ type: 'R', a: N.VS, b: N.GND, r: 80000 }];
      if (V && V[N.VS] - V[N.GND] > 3.8) els.push({ type: 'V', a: N.OUT, b: N.GND, v: Math.max(0, env.temp) * 0.01, r: 40, role: 'lm35' });
      return els;
    },
    specs: () => [['out', '10 mV / °C'], ['range', '0 °C – 150 °C'], ['acc', '±0.5 °C'], ['volt', '4–30 V']],
    info: t3('Its middle leg gives 10 millivolts for every degree Celsius: at 25 °C it gives 0.25 V. Change the temperature with the slider.',
      'इसका बीच वाला पैर हर डिग्री सेल्सियस पर 10 मिलीवोल्ट देता है: 25 °C पर 0.25 V। स्लाइडर से तापमान बदलिए।',
      'Iska beech wala pair har degree Celsius par 10 millivolt deta hai: 25 °C par 0.25 V. Slider se temperature badaliye.'),
  },
  hcsr04: {
    cat: 'in', mount: 'bb', props: {}, state0: { dist: 40 },
    name: t3('Ultrasonic sensor HC-SR04', 'अल्ट्रासोनिक सेंसर HC-SR04', 'Ultrasonic sensor HC-SR04'),
    pins: [{ id: 'VCC', at: [0, 0], name: t3('VCC: 5V', 'VCC: 5V', 'VCC: 5V') }, { id: 'TRIG', at: [P, 0], name: t3('Trig: a 10 µs pulse starts a measurement', 'Trig: 10 µs की पल्स से नापना शुरू', 'Trig: 10 µs ki pulse se measurement shuru') },
      { id: 'ECHO', at: [2 * P, 0], name: t3('Echo: HIGH for as long as the sound took', 'Echo: आवाज़ को जितना समय लगा, उतनी देर HIGH', 'Echo: sound ko jitna time laga, utni der HIGH') }, { id: 'GND', at: [3 * P, 0], name: t3('GND', 'GND', 'GND') }],
    elec: (p, N, env, V, t) => {
      const els = [{ type: 'R', a: N.VCC, b: N.GND, r: 330 }];
      if (p.state.powered) { const e = p.state.echo; const hi = e && t >= e.start && t < e.end; els.push({ type: 'V', a: N.ECHO, b: N.GND, v: hi ? 5 : 0, r: 100, role: 'echo' }); }
      return els;
    },
    specs: () => [['range', '2 cm – 400 cm'], ['acc', '±3 mm'], ['freq', '40 kHz'], ['volt', '5 V, 15 mA']],
    info: t3('It sends a short burst of sound too high to hear, and listens for the echo. Sound travels about 0.034 cm in a microsecond, so distance = time × 0.034 ÷ 2.',
      'यह इतनी ऊँची आवाज़ भेजता है कि हमें सुनाई नहीं देती, और उसकी गूँज (इको) सुनता है। आवाज़ एक माइक्रोसेकंड में लगभग 0.034 cm चलती है, इसलिए दूरी = समय × 0.034 ÷ 2।',
      'Yeh itni oonchi awaaz bhejta hai ki humein sunai nahi deti, aur uski echo sunta hai. Sound ek microsecond mein lagbhag 0.034 cm chalti hai, isliye doori = time × 0.034 ÷ 2.'),
  },
  ir: {
    term: { y: 4 }, cat: 'in', mount: 'free', props: {}, state0: { dist: 30, thr: 12 },
    name: t3('IR obstacle sensor', 'आईआर बाधा सेंसर (IR)', 'IR obstacle sensor'),
    pins: [{ id: 'VCC', at: [-P, 0], name: t3('VCC: 5V', 'VCC: 5V', 'VCC: 5V') }, { id: 'GND', at: [0, 0], name: t3('GND', 'GND', 'GND') }, { id: 'OUT', at: [P, 0], name: t3('OUT: LOW when something is in front', 'OUT: सामने कुछ हो तो LOW', 'OUT: saamne kuch ho to LOW') }],
    elec: (p, N, env, V) => {
      const els = [{ type: 'R', a: N.VCC, b: N.GND, r: 250 }];
      if (p.state.powered) { const near = p.state.dist <= p.state.thr; const vcc = V ? Math.max(0, V[N.VCC] - V[N.GND]) : 5; els.push({ type: 'V', a: N.OUT, b: N.GND, v: near ? 0 : vcc, r: near ? 100 : 10000, role: 'irout' }); }
      return els;
    },
    specs: () => [['range', '2 cm – 30 cm (blue screw)'], ['out', 'LOW = obstacle'], ['volt', '3.3–5 V, 20 mA']],
    info: t3('An infrared LED shines forward and a sensor next to it looks for the reflected light. When something is close, OUT goes LOW and its green light comes on.',
      'इसकी इन्फ़्रारेड एलईडी आगे रोशनी डालती है और पास वाला सेंसर लौटकर आई रोशनी देखता है। कोई चीज़ पास हो तो OUT LOW हो जाता है और हरी बत्ती जल जाती है।',
      'Iski infrared LED aage roshni daalti hai aur paas wala sensor laut kar aayi roshni dekhta hai. Koi cheez paas ho to OUT LOW ho jaata hai aur green light jal jaati hai.'),
  },
  servo: {
    term: { y: 1.5 }, cat: 'move', mount: 'free', props: {}, state0: { angle: 90 },
    name: t3('Servo motor SG90', 'सर्वो मोटर SG90', 'Servo motor SG90'),
    pins: [{ id: 'GND', at: [-P, 0], name: t3('Brown: GND', 'भूरा: GND', 'Brown: GND') }, { id: 'VP', at: [0, 0], name: t3('Red: 5V', 'लाल: 5V', 'Red: 5V') }, { id: 'SIG', at: [P, 0], name: t3('Orange: signal (a PWM pin)', 'नारंगी: सिग्नल (PWM पिन)', 'Orange: signal (PWM pin)') }],
    elec: (p, N) => [{ type: 'R', a: N.VP, b: N.GND, r: p.state.moving ? 30 : 500, role: 'servo' }],
    specs: () => [['turn', '0° – 180°'], ['speed', '0.1 s / 60°'], ['torque', '1.8 kg·cm'], ['volt', '4.8–6 V']],
    info: t3('A small motor with gears and its own control board. Send it a pulse every 20 ms: 1 ms means 0°, 2 ms means 180°. The Servo library does this for you: myServo.write(90).',
      'इसमें छोटी मोटर, गियर और अपना कंट्रोल बोर्ड है। इसे हर 20 ms पर एक पल्स भेजी जाती है: 1 ms यानी 0°, 2 ms यानी 180°। Servo लाइब्रेरी यह आपके लिए करती है: myServo.write(90)।',
      'Ismein chhoti motor, gears aur apna control board hai. Ise har 20 ms par ek pulse bheji jaati hai: 1 ms matlab 0°, 2 ms matlab 180°. Servo library yeh aapke liye karti hai: myServo.write(90).'),
  },
  motor: {
    term: { y: 1.5 }, cat: 'move', mount: 'free', props: {}, state0: { w: 0, a: 0 },
    name: t3('DC motor with fan', 'डीसी मोटर (पंखे के साथ)', 'DC motor (fan ke saath)'),
    pins: [{ id: 'P', at: [0, 0], name: t3('Red lead (+)', 'लाल तार (+)', 'Red wire (+)') }, { id: 'N', at: [P * 2, 0], name: t3('Black lead (−)', 'काला तार (−)', 'Black wire (−)') }],
    elec: (p, N) => [{ type: 'M', a: N.P, b: N.N, r: MOTOR.r, emf: MOTOR.ke * p.state.w, role: 'motor' }],
    specs: () => [['volt', '3–6 V'], ['noload', '≈ 6500 rpm, 0.17 A (5 V)'], ['stall', '0.6 A']],
    info: t3('It spins when current flows through it, faster with more voltage. It needs much more current than an Arduino pin can give (40 mA), so a transistor switches it.',
      'करंट जाने पर यह घूमती है; वोल्टेज ज़्यादा तो रफ़्तार ज़्यादा। इसे Arduino के पिन (40 mA) से कहीं ज़्यादा करंट चाहिए, इसलिए इसे ट्रांज़िस्टर से चालू करते हैं।',
      'Current jaane par yeh ghoomti hai; voltage zyada to speed zyada. Ise Arduino ke pin (40 mA) se kahin zyada current chahiye, isliye ise transistor se on karte hain.'),
  },
  battery: {
    term: { y: 1.5 }, cat: 'power', mount: 'free', props: {},
    name: t3('9 V battery', '9 V बैटरी', '9 V battery'),
    pins: [{ id: 'P', at: [0, 0], name: t3('Red wire: + 9 V', 'लाल तार: + 9 V', 'Red wire: + 9 V') }, { id: 'N', at: [P * 2, 0], name: t3('Black wire: −', 'काला तार: −', 'Black wire: −') }],
    elec: (p, N) => [{ type: 'V', a: N.P, b: N.N, v: 9.2, r: 1.6, role: 'battery' }],
    specs: () => [['volt', '9 V'], ['cap', '≈ 500 mAh']],
    info: t3('Power for motors and robots away from the computer. Join its − to the Arduino GND so that both share the same 0 V.',
      'कंप्यूटर से दूर मोटर और रोबोट चलाने के लिए बिजली। इसका − Arduino के GND से जोड़िए, ताकि दोनों का 0 V एक ही रहे।',
      'Computer se door motor aur robot chalane ke liye power. Iska − Arduino ke GND se jodiye, taaki dono ka 0 V ek hi rahe.'),
  },
};
// batch 2 (robots): motor driver, gear motors, Li-ion battery, Bluetooth, joystick, servo supply, MG996R (parts2.js)
Object.assign(PARTS, PARTS2);
Object.assign(PARTS, PARTS3); // batch 3 (parts3.js)
Object.assign(PARTS, PARTS4); // batch 4 (parts4.js)
Object.assign(PARTS, PARTS6); // batch 6 (parts6.js)
Object.assign(PARTS, PARTS22); // batch 22 (parts22.js)
Object.assign(PARTS, PARTS24); // batch 24 (parts24.js)
Object.assign(PARTS, PARTS25); // batch 25 (parts25.js)
Object.assign(PARTS, PARTS26); // batch 26 (parts26.js)
Object.assign(PARTS, PARTS28); // batch 28 (parts28.js)
Object.assign(PARTS, PARTS29); // batch 29 (parts29.js)
Object.assign(PARTS, PARTS30); // batch 30 (parts30.js)
Object.assign(PARTS, PARTS12); // batch 12 (parts12.js)
PARTS.hcsr04.us = true; PARTS.hcsr04f.specs = PARTS.hcsr04.specs; PARTS.hcsr04f.info = PARTS.hcsr04.info; // the same sensor, on a robot
PARTS.servo.servo = true; PARTS.servo.rate = 520;
export const DRAWER = ['led', 'rgb', 'resistor', 'button', 'pot', 'buzzer', 'ldr', 'lm35', 'hcsr04', 'ir', 'servo', 'npn', 'diode', 'motor', 'battery', ...DRAWER2, ...DRAWER3, ...DRAWER4, ...DRAWER6, ...DRAWER12, ...DRAWER22, ...DRAWER24, ...DRAWER25, ...DRAWER26, ...DRAWER28, ...DRAWER29, ...DRAWER30];

// pin position of a placed part (mm, part frame) after its rotation (0..3, quarter turns: +x -> +z -> -x -> -z)
export function rotXZ(x, z, rot) {
  switch (((rot % 4) + 4) % 4) { case 1: return [-z, x]; case 2: return [-x, -z]; case 3: return [z, -x]; default: return [x, z]; }
}
export function pinsOf(part) {
  const def = PARTS[part.type];
  return def.pins.map((p) => {
    let at = p.at;
    if (def.axial && p === def.pins[1]) at = [part.props.span * P, 0];
    const [x, z] = rotXZ(at[0], at[1], part.rot || 0);
    return { id: p.id, x, z, def: p };
  });
}
