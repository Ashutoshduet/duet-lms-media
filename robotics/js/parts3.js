// DUET Robotics Lab 360, batch 3: the modules school labs use, as data (the same shape as parts.js / parts2.js):
//   pins (mm, the part's own frame), mount, elec (the circuit elements it adds), specs, info (English, Hindi, Hinglish),
// and, new here: dyn(p, els, lab, dt, vAt) — what the module does each frame (sim.js calls it instead of its own switch),
// and onWrite(p, pin, level, t, lab) — the stepper driver follows every write of the sketch, not only the frame's average.
// The modules talk to the sketch through the libraries in libs3.js; their 3D models are in models3.js.
//   lcd16 16×2 LCD with I2C backpack · oled 0.96" SSD1306 · seg7 1-digit 7-segment · dht11 · soil moisture · pir HC-SR501
//   relay 1-channel (KY-019) · irrx VS1838B IR receiver · keypad 4×4 · stepper 28BYJ-48 + ULN2003 · rfid RC522 · mq2 gas
//   and their helpers: aa4 (4 × AA battery box), pump (mini water pump), load230 (a 230 V lamp or fan, wired by an adult)
import { REMOTE } from './libs3.js';
const P = 2.54;
const t3 = (en, hi, hg) => ({ en, hi, hg });
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const vOf = (V, n) => (V && n < V.length ? V[n] : 0);
// a module's state changed in a way the circuit sees (an output pin): the next digitalRead must solve again
const touch = (lab) => { lab.stateV++; lab.instKey = null; };
const setPow = (p, lab, on) => { if (on !== !!p.state.powered) { p.state.powered = on; touch(lab); return true; } return false; };

// the soil probe: its resistance in soil of moisture m (0 dry … 1 soaked); the module's AO is Vcc·R / (R + 10 kΩ)
export const soilOhms = (m) => 1500 * Math.pow(200, 1 - clamp(m, 0, 1));
// MQ-2: Rs / R0 for LPG / smoke at ppm (datasheet curve, fitted), R0 = 6 kΩ, load resistor 4.7 kΩ
export const mq2Ratio = (ppm) => Math.min(9.8, 2.0 * Math.pow(Math.max(ppm, 1) / 200, -0.47));
export const KEYMAP = [['1', '2', '3', 'A'], ['4', '5', '6', 'B'], ['7', '8', '9', 'C'], ['*', '0', '#', 'D']];
// the 28BYJ-48: 2048 full steps for one turn of its output shaft (32 steps × the 1:64 gearbox); about 15 rpm at the most
export const STEP28 = { steps: 2048, minUs: 1700 };
// a 230 V load seen from its two wires (the mains is inside its box): 9 W LED bulb, 75 W ceiling fan
export const LOAD230 = { lamp: { r: 5878, w: 9 }, fan: { r: 705, w: 75 } };

export const PARTS3 = {
  lcd16: {
    term: { y: 7 }, cat: 'out', mount: 'free', props: { addr: 0x27 }, state0: { contrast: 0.55, ver: 0 },
    name: t3('LCD 16×2 with I2C backpack', 'LCD 16×2 (I2C बैकपैक के साथ)', 'LCD 16×2 (I2C backpack ke saath)'),
    pins: [{ id: 'GND', at: [0, 0], dir: [-1, 0], name: t3('GND', 'GND', 'GND') }, { id: 'VCC', at: [0, P], dir: [-1, 0], name: t3('VCC: 5V', 'VCC: 5V', 'VCC: 5V') },
      { id: 'SDA', at: [0, 2 * P], dir: [-1, 0], name: t3('SDA: data, to A4', 'SDA: डेटा, A4 पर', 'SDA: data, A4 par') }, { id: 'SCL', at: [0, 3 * P], dir: [-1, 0], name: t3('SCL: clock, to A5', 'SCL: क्लॉक, A5 पर', 'SCL: clock, A5 par') }],
    elec: (p, N) => [{ type: 'R', a: N.VCC, b: N.GND, r: p.state.powered && p.state.bl ? 210 : 2400, role: 'lcd' }, { type: 'R', a: N.SDA, b: N.VCC, r: 4700 }, { type: 'R', a: N.SCL, b: N.VCC, r: 4700 }],
    dyn: (p, els, lab, dt, vAt) => { const v = vAt(p.N.VCC) - vAt(p.N.GND); if (setPow(p, lab, v > 4.0) && !p.state.powered) { p.state.initd = false; p.state.bl = false; p.state.ver++; } p.state.vcc = v; },
    specs: (p) => [['disp', '16 × 2 characters, 5 × 8 dots'], ['addr', '0x' + p.props.addr.toString(16).toUpperCase() + ' (PCF8574)'], ['volt', '5 V, ≈ 25 mA with the backlight'], ['size', '80 × 36 mm']],
    info: t3('A screen for two lines of 16 letters. The small board on its back (the I2C backpack) needs only four wires: power, and SDA / SCL, which carry the letters one bit at a time. Turn its blue knob if the letters cannot be seen.',
      'दो लाइनों में 16-16 अक्षर दिखाने वाली स्क्रीन। इसके पीछे लगा छोटा बोर्ड (I2C बैकपैक) सिर्फ़ चार तार लेता है: बिजली, और SDA / SCL, जो अक्षरों को एक-एक बिट करके भेजते हैं। अक्षर न दिखें तो इसका नीला नॉब घुमाइए।',
      'Do lines mein 16-16 letters dikhane wali screen. Iske peeche laga chhota board (I2C backpack) sirf chaar wire leta hai: power, aur SDA / SCL, jo letters ko ek-ek bit karke bhejte hain. Letters na dikhein to iska blue knob ghumaiye.'),
  },
  oled: {
    cat: 'out', mount: 'bb', props: { addr: 0x3c }, state0: { ver: 0 },
    name: t3('OLED display 0.96" (SSD1306)', 'OLED डिस्प्ले 0.96" (SSD1306)', 'OLED display 0.96" (SSD1306)'),
    pins: [{ id: 'GND', at: [0, 0], name: t3('GND', 'GND', 'GND') }, { id: 'VCC', at: [P, 0], name: t3('VCC: 3.3–5 V', 'VCC: 3.3–5 V', 'VCC: 3.3–5 V') },
      { id: 'SCL', at: [2 * P, 0], name: t3('SCL: clock, to A5', 'SCL: क्लॉक, A5 पर', 'SCL: clock, A5 par') }, { id: 'SDA', at: [3 * P, 0], name: t3('SDA: data, to A4', 'SDA: डेटा, A4 पर', 'SDA: data, A4 par') }],
    elec: (p, N) => [{ type: 'R', a: N.VCC, b: N.GND, r: p.state.powered && p.state.on ? 330 : 20000, role: 'oled' }, { type: 'R', a: N.SDA, b: N.VCC, r: 10000 }, { type: 'R', a: N.SCL, b: N.VCC, r: 10000 }],
    dyn: (p, els, lab, dt, vAt) => { const v = vAt(p.N.VCC) - vAt(p.N.GND); if (setPow(p, lab, v > 2.9) && !p.state.powered) { p.state.on = false; p.state.fb = null; p.state.ver++; } },
    specs: (p) => [['disp', '128 × 64 dots, white'], ['addr', '0x' + p.props.addr.toString(16).toUpperCase()], ['volt', '3.3–5 V, ≈ 15 mA'], ['size', '27 × 27 mm, 0.96"']],
    info: t3('A tiny screen of 128 × 64 dots that make their own light (no backlight). The sketch draws letters and shapes in the Arduino\'s memory, then display() sends the whole picture over I2C (SDA, SCL).',
      '128 × 64 बिंदुओं की छोटी स्क्रीन, जिसके बिंदु ख़ुद चमकते हैं (बैकलाइट नहीं)। स्केच अक्षर और आकृतियाँ Arduino की मेमोरी में बनाता है, फिर display() पूरी तस्वीर I2C (SDA, SCL) से भेज देता है।',
      '128 × 64 dots ki chhoti screen, jiske dots khud chamakte hain (backlight nahi). Sketch letters aur shapes Arduino ki memory mein banata hai, phir display() poori picture I2C (SDA, SCL) se bhej deta hai.'),
  },
  seg7: {
    cat: 'out', mount: 'bb', props: {},
    name: t3('7-segment display (1 digit, common cathode)', '7-सेगमेंट डिस्प्ले (1 अंक, कॉमन कैथोड)', '7-segment display (1 digit, common cathode)'),
    pins: [['E', 0, 0], ['D', P, 0], ['COM1', 2 * P, 0], ['C', 3 * P, 0], ['DP', 4 * P, 0], ['G', 0, -6 * P], ['F', P, -6 * P], ['COM2', 2 * P, -6 * P], ['A', 3 * P, -6 * P], ['B', 4 * P, -6 * P]]
      .map(([id, x, z]) => ({ id, at: [x, z], name: id.startsWith('COM') ? t3('Common cathode (−): to GND', 'कॉमन कैथोड (−): GND से', 'Common cathode (−): GND se') : id === 'DP' ? t3('Decimal point (+)', 'दशमलव बिंदु (+)', 'Decimal point (+)') : t3(`Segment ${id.toLowerCase()} (+), through a resistor`, `सेगमेंट ${id.toLowerCase()} (+), रेज़िस्टर से होकर`, `Segment ${id.toLowerCase()} (+), resistor se hokar`) })),
    elec: (p, N) => (p.state.burnt ? [] : [{ type: 'R', a: N.COM1, b: N.COM2, r: 0.05 }, ...['A', 'B', 'C', 'D', 'E', 'F', 'G', 'DP'].map((s) => ({ type: 'D', a: N[s], b: N.COM1, vf: 1.8, rs: 14, role: 'seg', ch: s }))]),
    dyn: (p, els, lab, dt) => {
      const s = p.state; s.seg = s.seg || {}; let maxI = 0;
      for (const e of els) if (e.role === 'seg') { const I = Math.max(0, e.iAvg || 0); s.seg[e.ch] = I; maxI = Math.max(maxI, I); }
      if (maxI > 0.04) { s.hot = (s.hot || 0) + dt; if (s.hot > 0.2) { s.burnt = true; lab.rebuildSoon = true; lab.obs.burnt++; lab.emit('burn', { part: p, mA: Math.round(maxI * 1000) }); } } else s.hot = 0;
    },
    specs: () => [['vf', '1.8 V per segment @ 10 mA'], ['imax', '20 mA per segment'], ['size', '12.6 × 19 mm, 0.56"']],
    info: t3('Eight LEDs in one package: segments a to g make a digit, dp is the dot. All their − legs meet at COM, which goes to GND. Each segment needs its own resistor, like any LED.',
      'एक ही पैकेट में आठ एलईडी: a से g सेगमेंट मिलकर अंक बनाते हैं, dp बिंदु है। सबके − पैर COM पर मिलते हैं, जो GND पर जाता है। हर सेगमेंट को किसी भी एलईडी की तरह अपना रेज़िस्टर चाहिए।',
      'Ek hi package mein aath LED: a se g segments milkar digit banate hain, dp dot hai. Sabke − pair COM par milte hain, jo GND par jaata hai. Har segment ko kisi bhi LED ki tarah apna resistor chahiye.'),
  },
  dht11: {
    cat: 'in', mount: 'bb', props: {}, state0: { tS: 26, hS: 55 },
    name: t3('Temperature & humidity sensor DHT11', 'तापमान और नमी सेंसर DHT11', 'Temperature & humidity sensor DHT11'),
    pins: [{ id: 'DATA', at: [0, 0], name: t3('DATA (S): to a digital pin', 'DATA (S): किसी डिजिटल पिन पर', 'DATA (S): kisi digital pin par') }, { id: 'VCC', at: [P, 0], name: t3('VCC (+): 5V', 'VCC (+): 5V', 'VCC (+): 5V') },
      { id: 'GND', at: [2 * P, 0], name: t3('GND (−)', 'GND (−)', 'GND (−)') }],
    elec: (p, N) => [{ type: 'R', a: N.VCC, b: N.GND, r: 5000, role: 'dht' }, { type: 'R', a: N.DATA, b: N.VCC, r: 10000 }],
    dyn: (p, els, lab, dt, vAt) => {
      setPow(p, lab, vAt(p.N.VCC) - vAt(p.N.GND) > 3.0);
      const env = lab.env; if (env.hum === undefined) env.hum = 55; const k = 1 - Math.exp(-dt / 2.5); // it follows the air in a few seconds
      p.state.tS += ((env.temp) - p.state.tS) * k; p.state.hS += (env.hum - p.state.hS) * k;
    },
    specs: () => [['range', '0–50 °C (±2 °C) · 20–90 % RH (±5 %)'], ['res', '1 °C, 1 %'], ['rate', '1 reading a second'], ['volt', '3.3–5 V']],
    info: t3('Inside the blue box: a thermistor for the temperature and a plate that soaks up moisture for the humidity. A small chip turns both into numbers and sends them on one wire (DATA). The DHT library reads them: dht.readTemperature().',
      'नीले डिब्बे के अंदर: तापमान के लिए एक थर्मिस्टर और नमी सोखने वाली एक प्लेट। एक छोटी चिप दोनों को संख्याओं में बदलकर एक ही तार (DATA) से भेजती है। DHT लाइब्रेरी इन्हें पढ़ती है: dht.readTemperature()।',
      'Neele dabbe ke andar: temperature ke liye ek thermistor aur nami sokhne wali ek plate. Ek chhoti chip dono ko numbers mein badal kar ek hi wire (DATA) se bhejti hai. DHT library inhe padhti hai: dht.readTemperature().'),
  },
  soil: {
    term: { y: 4.5 }, cat: 'in', mount: 'free', props: { thr: 0.55 }, state0: { moist: 0.35 },
    name: t3('Soil moisture sensor (with probe)', 'मिट्टी की नमी सेंसर (प्रोब के साथ)', 'Soil moisture sensor (probe ke saath)'),
    pins: [{ id: 'VCC', at: [-1.5 * P, 0], name: t3('VCC: 5V', 'VCC: 5V', 'VCC: 5V') }, { id: 'GND', at: [-0.5 * P, 0], name: t3('GND', 'GND', 'GND') },
      { id: 'DO', at: [0.5 * P, 0], name: t3('DO: LOW when the soil is wet', 'DO: मिट्टी गीली हो तो LOW', 'DO: mitti geeli ho to LOW') }, { id: 'AO', at: [1.5 * P, 0], name: t3('AO: dry = high, wet = low (to A0)', 'AO: सूखी = ज़्यादा, गीली = कम (A0 पर)', 'AO: sookhi = zyada, geeli = kam (A0 par)') }],
    elec: (p, N, env, V) => {
      const els = [{ type: 'R', a: N.VCC, b: N.GND, r: 1200, role: 'soil' }];
      if (p.state.powered) {
        const vcc = Math.max(0, vOf(V, N.VCC) - vOf(V, N.GND)); const R = soilOhms(p.state.moist); const ao = vcc * R / (R + 10000);
        els.push({ type: 'V', a: N.AO, b: N.GND, v: ao, r: 1000 * 10000 / (R + 10000) + 100, role: 'soilAO' });
        const wet = ao < p.props.thr * vcc; els.push({ type: 'V', a: N.DO, b: N.GND, v: wet ? 0 : vcc, r: wet ? 100 : 10000 });
      }
      return els;
    },
    dyn: (p, els, lab, dt, vAt) => {
      setPow(p, lab, vAt(p.N.VCC) - vAt(p.N.GND) > 3.0);
      const ao = vAt(p.N.AO) - vAt(p.N.GND); if (Math.abs(ao - (p.state.ao || 0)) > 0.002) { p.state.ao = ao; touch(lab); }
      p.state.wet = p.state.powered && vAt(p.N.DO) - vAt(p.N.GND) < 1;
    },
    specs: () => [['out', 'AO 0–5 V (dry: high) · DO LOW = wet'], ['volt', '3.3–5 V'], ['probe', '60 mm fork, nickel-plated']],
    info: t3('Two metal legs go into the soil. Wet soil lets current through easily, dry soil hardly does, so the voltage on AO goes up as the soil dries. Read it with analogRead(A0): dry soil gives a big number, wet soil a small one.',
      'दो धातु के पैर मिट्टी में जाते हैं। गीली मिट्टी से करंट आसानी से जाता है, सूखी से मुश्किल से, इसलिए मिट्टी सूखने पर AO का वोल्टेज बढ़ता है। इसे analogRead(A0) से पढ़िए: सूखी मिट्टी पर बड़ी संख्या, गीली पर छोटी।',
      'Do metal ke pair mitti mein jaate hain. Geeli mitti se current aasani se jaata hai, sookhi se mushkil se, isliye mitti sookhne par AO ka voltage badhta hai. Ise analogRead(A0) se padhiye: sookhi mitti par bada number, geeli par chhota.'),
  },
  pir: {
    term: { y: 9 }, cat: 'in', mount: 'free', props: { hold: 3 }, state0: { motion: false, out: false },
    name: t3('PIR motion sensor HC-SR501', 'पीआईआर मोशन सेंसर HC-SR501', 'PIR motion sensor HC-SR501'),
    pins: [{ id: 'VCC', at: [-P, 0], name: t3('VCC: 5V', 'VCC: 5V', 'VCC: 5V') }, { id: 'OUT', at: [0, 0], name: t3('OUT: HIGH (3.3 V) when something warm moves', 'OUT: कोई गर्म चीज़ हिले तो HIGH (3.3 V)', 'OUT: koi garam cheez hile to HIGH (3.3 V)') },
      { id: 'GND', at: [P, 0], name: t3('GND', 'GND', 'GND') }],
    elec: (p, N) => { const els = [{ type: 'R', a: N.VCC, b: N.GND, r: 75000, role: 'pir' }]; if (p.state.powered) els.push({ type: 'V', a: N.OUT, b: N.GND, v: p.state.out ? 3.3 : 0, r: 1000, role: 'pirOut' }); return els; },
    dyn: (p, els, lab, dt, vAt) => {
      const s = p.state; const on = vAt(p.N.VCC) - vAt(p.N.GND) > 4.2;
      if (setPow(p, lab, on)) { s.age = 0; s.left = 0; s.lock = 0; }
      if (!on) { if (s.out) { s.out = false; touch(lab); } return; }
      s.age = (s.age || 0) + dt; let out;
      if (s.age < 2.5) out = true; // power-up: it learns the room and its output is HIGH for a moment
      else {
        s.lock = Math.max(0, (s.lock || 0) - dt);
        if (s.motion && s.lock <= 0) { s.left = p.props.hold; s.seen = (s.seen || 0) + 1; }
        if (s.left > 0) { s.left -= dt; out = true; if (s.left <= 0 && !s.motion) { out = false; s.lock = 2.5; } } else out = false;
      }
      if (out !== s.out) { s.out = out; touch(lab); }
    },
    specs: (p) => [['range', 'up to 7 m, 110° cone'], ['delay', p.props.hold + ' s (Tx knob: 3 s – 5 min)'], ['out', 'HIGH 3.3 V'], ['volt', '5–20 V, 65 µA']],
    info: t3('Everything warm gives off infrared light. Behind the white dome are two sensors that see slightly different spots; when something warm (a person, a cat) moves, one sees it before the other and OUT goes HIGH for a few seconds. When it is first powered it needs a moment to learn the room.',
      'हर गर्म चीज़ इन्फ़्रारेड रोशनी छोड़ती है। सफ़ेद गुंबद के पीछे दो सेंसर हैं जो थोड़ी अलग जगहें देखते हैं; कोई गर्म चीज़ (इंसान, बिल्ली) हिलती है तो एक उसे दूसरे से पहले देखता है और OUT कुछ सेकंड के लिए HIGH हो जाता है। पहली बार बिजली मिलने पर इसे कमरा समझने में थोड़ा समय लगता है।',
      'Har garam cheez infrared roshni chhodti hai. Safed dome ke peeche do sensor hain jo thodi alag jagah dekhte hain; koi garam cheez (insaan, billi) hilti hai to ek use doosre se pehle dekhta hai aur OUT kuch second ke liye HIGH ho jaata hai. Pehli baar power milne par ise room samajhne mein thoda time lagta hai.'),
  },
  relay: {
    term: { y: 4 }, cat: 'move', mount: 'free', props: {}, state0: { on: false, clicks: 0 },
    name: t3('Relay module 5 V (1 channel)', 'रिले मॉड्यूल 5 V (1 चैनल)', 'Relay module 5 V (1 channel)'),
    pins: [{ id: 'S', at: [-P, 0], name: t3('S: the signal from the Arduino (HIGH = on)', 'S: Arduino का सिग्नल (HIGH = चालू)', 'S: Arduino ka signal (HIGH = on)') }, { id: 'VCC', at: [0, 0], name: t3('+ : 5V', '+ : 5V', '+ : 5V') },
      { id: 'GND', at: [P, 0], name: t3('− : GND', '− : GND', '− : GND') },
      { id: 'NO', at: [-5, -31], dir: [0, -1], y: 9, name: t3('NO: joined to COM only when the relay is on', 'NO: रिले चालू हो तभी COM से जुड़ता है', 'NO: relay on ho tabhi COM se judta hai') },
      { id: 'COM', at: [0, -31], dir: [0, -1], y: 9, name: t3('COM: the common contact', 'COM: कॉमन कॉन्टैक्ट', 'COM: common contact') },
      { id: 'NC', at: [5, -31], dir: [0, -1], y: 9, name: t3('NC: joined to COM when the relay is off', 'NC: रिले बंद हो तो COM से जुड़ा', 'NC: relay band ho to COM se juda') }],
    elec: (p, N) => [{ type: 'R', a: N.VCC, b: N.GND, r: p.state.on ? 70 : 60000, role: 'coil' }, { type: 'R', a: N.S, b: N.GND, r: 2200 },
      { type: 'SW', a: N.COM, b: N.NO, on: !!p.state.on, role: 'contactNO' }, { type: 'SW', a: N.COM, b: N.NC, on: !p.state.on, role: 'contactNC' }],
    dyn: (p, els, lab, dt, vAt) => {
      const s = p.state; const vcc = vAt(p.N.VCC) - vAt(p.N.GND); setPow(p, lab, vcc > 3.5);
      const want = s.powered && vAt(p.N.S) - vAt(p.N.GND) > 1.4; // its transistor switches the coil
      if (want !== s.on) { s.wait = (s.wait || 0) + dt; if (s.wait >= 0.008) { s.on = want; s.wait = 0; s.clicks++; touch(lab); } } else s.wait = 0;
      if (s.on) s.onT = (s.onT || 0) + dt;
    },
    specs: () => [['coil', '5 V, 71 mA (SRD-05VDC)'], ['contacts', '10 A 250 V AC · 10 A 30 V DC'], ['trig', 'HIGH = on (red LED)']],
    info: t3('A switch moved by a small electromagnet. The Arduino\'s 5 V signal on S switches the coil on (click!), and the coil pulls a metal contact from NC to NO. The two sides never touch, so a tiny signal can safely switch a pump, a lamp or a fan with its own power. Mains (230 V) wiring is done only by an adult electrician, inside a closed box.',
      'एक स्विच जिसे छोटा विद्युत-चुंबक हिलाता है। S पर Arduino का 5 V सिग्नल कॉइल चालू करता है (क्लिक!), और कॉइल धातु के कॉन्टैक्ट को NC से NO पर खींच लेती है। दोनों तरफ़ आपस में कभी नहीं छूतीं, इसलिए छोटा सिग्नल अपनी अलग बिजली वाले पंप, बल्ब या पंखे को सुरक्षित चालू कर सकता है। मेन्स (230 V) की वायरिंग सिर्फ़ कोई बड़ा इलेक्ट्रीशियन, बंद डिब्बे के अंदर करता है।',
      'Ek switch jise chhota electromagnet hilata hai. S par Arduino ka 5 V signal coil on karta hai (click!), aur coil metal contact ko NC se NO par kheench leti hai. Dono taraf aapas mein kabhi nahi chhooti, isliye chhota signal apni alag power wale pump, bulb ya fan ko safely on kar sakta hai. Mains (230 V) ki wiring sirf koi bada electrician, band dabbe ke andar karta hai.'),
  },
  irrx: {
    cat: 'in', mount: 'bb', props: {}, state0: {},
    name: t3('IR receiver VS1838B (with remote)', 'आईआर रिसीवर VS1838B (रिमोट के साथ)', 'IR receiver VS1838B (remote ke saath)'),
    pins: [{ id: 'OUT', at: [0, 0], name: t3('OUT: the code from the remote (to a digital pin)', 'OUT: रिमोट का कोड (किसी डिजिटल पिन पर)', 'OUT: remote ka code (kisi digital pin par)') }, { id: 'GND', at: [P, 0], name: t3('GND', 'GND', 'GND') },
      { id: 'VCC', at: [2 * P, 0], name: t3('VCC: 5V', 'VCC: 5V', 'VCC: 5V') }],
    elec: (p, N, env, V, t) => { const els = [{ type: 'R', a: N.VCC, b: N.GND, r: 3300, role: 'irrx' }]; if (p.state.powered) { const vcc = Math.max(0, vOf(V, N.VCC) - vOf(V, N.GND)); const low = p.state.burstEnd && t < p.state.burstEnd; els.push({ type: 'V', a: N.OUT, b: N.GND, v: low ? 0 : vcc, r: low ? 200 : 30000 }); } return els; },
    dyn: (p, els, lab, dt, vAt) => { setPow(p, lab, vAt(p.N.VCC) - vAt(p.N.GND) > 2.6); const q = p.state.q; if (q && q.length > 8) q.splice(0, q.length - 8); },
    specs: () => [['freq', '38 kHz'], ['range', '≈ 8 m, 45°'], ['volt', '2.7–5.5 V']],
    info: t3('The remote flashes an infrared LED 38 000 times a second in short bursts; the pattern of bursts is the button\'s code. This receiver listens only for 38 kHz light (sunlight and lamps are ignored) and passes the pattern to OUT. The IRremote library turns it into a number.',
      'रिमोट एक इन्फ़्रारेड एलईडी को एक सेकंड में 38 000 बार छोटे-छोटे झटकों में जलाता है; इन झटकों का पैटर्न ही बटन का कोड है। यह रिसीवर सिर्फ़ 38 kHz की रोशनी सुनता है (धूप और बल्ब नहीं) और पैटर्न OUT पर भेजता है। IRremote लाइब्रेरी इसे एक संख्या बना देती है।',
      'Remote ek infrared LED ko ek second mein 38 000 baar chhote-chhote jhatkon mein jalata hai; in jhatkon ka pattern hi button ka code hai. Yeh receiver sirf 38 kHz ki roshni sunta hai (dhoop aur bulb nahi) aur pattern OUT par bhejta hai. IRremote library ise ek number bana deti hai.'),
  },
  keypad: {
    term: { y: 2.6 }, cat: 'in', mount: 'free', props: {}, state0: { keys: {} },
    name: t3('Keypad 4×4 (membrane)', 'कीपैड 4×4 (मेम्ब्रेन)', 'Keypad 4×4 (membrane)'),
    pins: ['R1', 'R2', 'R3', 'R4', 'C1', 'C2', 'C3', 'C4'].map((id, i) => ({ id, at: [(i - 3.5) * P, 0], name: id[0] === 'R' ? t3(`Row ${id[1]} (pin ${i + 1})`, `पंक्ति ${id[1]} (पिन ${i + 1})`, `Row ${id[1]} (pin ${i + 1})`) : t3(`Column ${id[1]} (pin ${i + 1})`, `कॉलम ${id[1]} (पिन ${i + 1})`, `Column ${id[1]} (pin ${i + 1})`) })),
    elec: (p, N) => { const els = []; const k = p.state.keys || {}; for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) if (k[r * 4 + c]) els.push({ type: 'SW', a: N['R' + (r + 1)], b: N['C' + (c + 1)], on: true, role: 'key' }); return els; },
    dyn: (p, els, lab, dt) => { const k = p.state.keys || {}; for (const i in k) { if (k[i] > 0 && k[i] < 99) { k[i] -= dt; if (k[i] <= 0) { delete k[i]; touch(lab); } } } },
    specs: () => [['keys', '16 (0–9, A–D, *, #)'], ['out', '4 rows × 4 columns, 8 wires'], ['size', '69 × 77 mm']],
    info: t3('Under each key, two crossing tracks: a row and a column. Pressing a key joins its row to its column. The Keypad library pulls one column LOW at a time and looks which row goes LOW with it: that row and column tell it the key.',
      'हर बटन के नीचे दो पटरियाँ एक-दूसरे को काटती हैं: एक पंक्ति और एक कॉलम। बटन दबाने पर उसकी पंक्ति उसके कॉलम से जुड़ जाती है। Keypad लाइब्रेरी एक बार में एक कॉलम को LOW करती है और देखती है कि कौन-सी पंक्ति उसके साथ LOW होती है: पंक्ति और कॉलम से बटन पता चलता है।',
      'Har key ke neeche do tracks ek doosre ko kaatti hain: ek row aur ek column. Key dabane par uski row uske column se jud jaati hai. Keypad library ek baar mein ek column ko LOW karti hai aur dekhti hai ki kaunsi row uske saath LOW hoti hai: row aur column se key pata chalti hai.'),
  },
  stepper: {
    term: { y: 7 }, cat: 'move', mount: 'free', props: {}, state0: { inp: [0, 0, 0, 0], th: 0, angle: 0 },
    name: t3('Stepper motor 28BYJ-48 with ULN2003 driver', 'स्टेपर मोटर 28BYJ-48 (ULN2003 ड्राइवर के साथ)', 'Stepper motor 28BYJ-48 (ULN2003 driver ke saath)'),
    pins: [['IN1', 0], ['IN2', 1], ['IN3', 2], ['IN4', 3]].map(([id, i]) => ({ id, at: [i * P, 0], name: t3(`${id}: coil ${'ABCD'[i]} (LED ${'ABCD'[i]})`, `${id}: कॉइल ${'ABCD'[i]} (एलईडी ${'ABCD'[i]})`, `${id}: coil ${'ABCD'[i]} (LED ${'ABCD'[i]})`) }))
      .concat([{ id: 'GND', at: [5.5 * P, 0], name: t3('− : GND', '− : GND', '− : GND') }, { id: 'VCC', at: [6.5 * P, 0], name: t3('+ : 5 V (the coils\' power)', '+ : 5 V (कॉइल की बिजली)', '+ : 5 V (coil ki power)') }]),
    elec: (p, N, env, V) => {
      const els = []; for (let i = 1; i <= 4; i++) els.push({ type: 'R', a: N['IN' + i], b: N.GND, r: 3300, role: 'uln' });
      let n = 0; if (V) for (let i = 1; i <= 4; i++) if (vOf(V, N['IN' + i]) - vOf(V, N.GND) > 2.2) n++;
      els.push({ type: 'R', a: N.VCC, b: N.GND, r: n ? 52 / n : 20000, role: 'coils' }); return els;
    },
    onWrite: (p, pin, lv, t, lab) => {
      const nd = lab.boardNode('G' + pin); if (!lab.used('N:G' + pin)) return; let k = -1; for (let i = 0; i < 4; i++) if (p.N['IN' + (i + 1)] === nd) k = i; if (k < 0) return;
      const s = p.state; if (s.pendT !== undefined && t < s.pendT) s.pendT = t; // (a new run: its clock starts again)
      if (s.pendT !== undefined && t - s.pendT > 50) stepCommit(p, s.pendT);
      s.inp[k] = lv ? 1 : 0; s.pendT = t;
    },
    dyn: (p, els, lab, dt, vAt) => {
      const s = p.state; setPow(p, lab, vAt(p.N.VCC) - vAt(p.N.GND) > 4);
      if (lab.mcu.state !== 'running') { if (s.inp.some((x) => x)) { s.inp = [0, 0, 0, 0]; s.pendT = lab.mcu.t; } }
      if (s.pendT !== undefined && lab.mcu.t < s.pendT) s.pendT = lab.mcu.t;
      if (s.pendT !== undefined && lab.mcu.t - s.pendT > 50) stepCommit(p, s.pendT);
      s.led = [0, 1, 2, 3].map((i) => (s.powered ? clamp((vAt(p.N['IN' + (i + 1)]) - vAt(p.N.GND) - 1.0) / 3.2, 0, 1) : 0));
      const a = s.th / 90 * 360 / STEP28.steps; const w = (a - (s.angle || 0)) / Math.max(dt, 1e-3); s.rpm = w / 6; s.angle = a;
      if (Math.abs(s.rpm) > 0.2 || (s.missT && lab.mcu.t - s.missT < 2e5)) lab.sounds.push({ id: p.uid, kind: 'motor', f: 40 + Math.abs(s.rpm) * 18, amp: 0.45 });
    },
    specs: () => [['steps', '2048 steps per turn (32 × 1:64 gears)'], ['speed', 'up to ≈ 15 rpm'], ['coil', '5 V, 4 coils, ≈ 100 mA each'], ['torque', '≈ 0.3 kg·cm']],
    info: t3('Inside are four coils around a magnet. Switching the coils on in turn (A, B, C, D) pulls the magnet one small step each time, and gears make the steps tinier: 2048 steps make one full turn. The ULN2003 board gives the coils the current the Arduino pins cannot; its four LEDs show which coils are on.',
      'अंदर एक चुंबक के चारों ओर चार कॉइल हैं। कॉइलों को बारी-बारी (A, B, C, D) चालू करने पर चुंबक हर बार एक छोटा क़दम खिंचता है, और गियर इन क़दमों को और छोटा कर देते हैं: 2048 क़दम में एक पूरा चक्कर। ULN2003 बोर्ड कॉइलों को वह करंट देता है जो Arduino के पिन नहीं दे सकते; इसकी चार एलईडी दिखाती हैं कि कौन-सी कॉइल चालू है।',
      'Andar ek magnet ke chaaron taraf chaar coil hain. Coils ko baari-baari (A, B, C, D) on karne par magnet har baar ek chhota step khinchta hai, aur gears in steps ko aur chhota kar dete hain: 2048 steps mein ek poora chakkar. ULN2003 board coils ko woh current deta hai jo Arduino ke pins nahi de sakte; iski chaar LED dikhati hain ki kaunsi coil on hai.'),
  },
  rfid: {
    term: { y: 4.5 }, cat: 'in', mount: 'free', props: {}, state0: { card: null },
    name: t3('RFID reader RC522 (with card and tag)', 'आरएफ़आईडी रीडर RC522 (कार्ड और टैग के साथ)', 'RFID reader RC522 (card aur tag ke saath)'),
    pins: [['SDA', t3('SDA (SS): chip select, to pin 10', 'SDA (SS): चिप सेलेक्ट, पिन 10 पर', 'SDA (SS): chip select, pin 10 par')], ['SCK', t3('SCK: SPI clock, to pin 13', 'SCK: SPI क्लॉक, पिन 13 पर', 'SCK: SPI clock, pin 13 par')],
      ['MOSI', t3('MOSI: data in, to pin 11', 'MOSI: डेटा अंदर, पिन 11 पर', 'MOSI: data andar, pin 11 par')], ['MISO', t3('MISO: data out, to pin 12', 'MISO: डेटा बाहर, पिन 12 पर', 'MISO: data bahar, pin 12 par')],
      ['IRQ', t3('IRQ: not used', 'IRQ: इस्तेमाल नहीं', 'IRQ: use nahi')], ['GND', t3('GND', 'GND', 'GND')], ['RST', t3('RST: reset, to pin 9', 'RST: रीसेट, पिन 9 पर', 'RST: reset, pin 9 par')],
      ['V33', t3('3.3V: only 3.3 V, never 5 V!', '3.3V: सिर्फ़ 3.3 V, कभी 5 V नहीं!', '3.3V: sirf 3.3 V, kabhi 5 V nahi!')]].map(([id, name], i) => ({ id, at: [(i - 3.5) * P, 0], name })),
    elec: (p, N) => { const els = [{ type: 'R', a: N.V33, b: N.GND, r: 127, role: 'rfid' }]; for (const k of ['SDA', 'SCK', 'MOSI', 'RST']) els.push({ type: 'R', a: N[k], b: N.GND, r: 100000 }); els.push({ type: 'R', a: N.MISO, b: N.GND, r: 100000 }); return els; },
    dyn: (p, els, lab, dt, vAt) => { const v = vAt(p.N.V33) - vAt(p.N.GND); p.state.over = v > 3.9; p.state.vcc = v; setPow(p, lab, v > 2.9); const c = p.state.card; if (c && c.hold !== undefined) { c.hold -= dt; if (c.hold <= 0) p.state.card = null; } },
    specs: () => [['freq', '13.56 MHz'], ['range', '≈ 3 cm'], ['volt', '3.3 V only (≈ 26 mA)'], ['bus', 'SPI'], ['uid', '4 bytes (MIFARE 1K)']],
    info: t3('The printed coil on the board makes a 13.56 MHz radio field. A card has a coil and a chip but no battery: the field powers it, and it answers with its unique number, the UID. Each card\'s UID is different, so a door lock can open for your card only. The RC522 must get 3.3 V, never 5 V.',
      'बोर्ड पर छपी कॉइल 13.56 MHz का रेडियो फ़ील्ड बनाती है। कार्ड में एक कॉइल और चिप है पर बैटरी नहीं: फ़ील्ड ही उसे बिजली देता है, और वह अपनी अलग पहचान संख्या, UID, बताता है। हर कार्ड का UID अलग होता है, इसलिए दरवाज़े का ताला सिर्फ़ आपके कार्ड से खुल सकता है। RC522 को सिर्फ़ 3.3 V दीजिए, कभी 5 V नहीं।',
      'Board par chhapi coil 13.56 MHz ka radio field banati hai. Card mein ek coil aur chip hai par battery nahi: field hi use power deta hai, aur woh apni alag pehchaan number, UID, batata hai. Har card ka UID alag hota hai, isliye darwaze ka lock sirf aapke card se khul sakta hai. RC522 ko sirf 3.3 V dijiye, kabhi 5 V nahi.'),
  },
  mq2: {
    term: { y: 4.5 }, cat: 'in', mount: 'free', props: { thr: 0.45 }, state0: { ppm: 5, warm: 0 },
    name: t3('Gas sensor MQ-2 (LPG, smoke)', 'गैस सेंसर MQ-2 (एलपीजी, धुआँ)', 'Gas sensor MQ-2 (LPG, smoke)'),
    pins: [{ id: 'VCC', at: [-1.5 * P, 0], name: t3('VCC: 5V (its heater takes 150 mA)', 'VCC: 5V (इसका हीटर 150 mA लेता है)', 'VCC: 5V (iska heater 150 mA leta hai)') }, { id: 'GND', at: [-0.5 * P, 0], name: t3('GND', 'GND', 'GND') },
      { id: 'DO', at: [0.5 * P, 0], name: t3('DO: LOW when there is gas', 'DO: गैस हो तो LOW', 'DO: gas ho to LOW') }, { id: 'AO', at: [1.5 * P, 0], name: t3('AO: more gas = more volts (to A0)', 'AO: ज़्यादा गैस = ज़्यादा वोल्ट (A0 पर)', 'AO: zyada gas = zyada volt (A0 par)') }],
    elec: (p, N, env, V) => {
      const els = [{ type: 'R', a: N.VCC, b: N.GND, r: 33, role: 'heater' }];
      if (p.state.powered) {
        const vcc = Math.max(0, vOf(V, N.VCC) - vOf(V, N.GND)); const rs = 6000 * mq2Ratio(p.state.ppm) * (0.25 + 0.75 * p.state.warm); const ao = vcc * 4700 / (rs + 4700);
        els.push({ type: 'V', a: N.AO, b: N.GND, v: ao, r: 1000, role: 'mqAO' });
        const gas = ao > p.props.thr * vcc; els.push({ type: 'V', a: N.DO, b: N.GND, v: gas ? 0 : vcc, r: gas ? 100 : 10000 });
      }
      return els;
    },
    dyn: (p, els, lab, dt, vAt) => {
      const s = p.state; const on = vAt(p.N.VCC) - vAt(p.N.GND) > 4.0; setPow(p, lab, on);
      s.warm = on ? s.warm + (1 - s.warm) * (1 - Math.exp(-dt / 3)) : Math.max(0, s.warm - dt / 20); // the heater warms the sensing bead
      const ao = vAt(p.N.AO) - vAt(p.N.GND); if (Math.abs(ao - (s.ao || 0)) > 0.002) { s.ao = ao; touch(lab); }
      s.gas = on && vAt(p.N.DO) - vAt(p.N.GND) < 1;
    },
    specs: (p) => [['gas', 'LPG, propane, smoke, methane'], ['range', '300–10 000 ppm'], ['heat', '5 V, 150 mA (warm-up 20 s +)'], ['out', 'AO 0–5 V · DO LOW = gas (knob: ' + Math.round(p.props.thr * 100) + '%)']],
    info: t3('A tiny heater keeps a bead of tin oxide hot. Clean air takes electrons from the bead (high resistance); LPG or smoke gives them back, so its resistance falls and the voltage on AO rises. It needs a few seconds to warm up after power-on (a new sensor: a day).',
      'एक छोटा हीटर टिन ऑक्साइड के दाने को गर्म रखता है। साफ़ हवा दाने से इलेक्ट्रॉन ले लेती है (ज़्यादा प्रतिरोध); एलपीजी या धुआँ उन्हें लौटा देता है, तो प्रतिरोध घटता है और AO का वोल्टेज बढ़ता है। चालू होने के बाद इसे गर्म होने में कुछ सेकंड लगते हैं (नए सेंसर को: एक दिन)।',
      'Ek chhota heater tin oxide ke daane ko garam rakhta hai. Saaf hawa daane se electrons le leti hai (zyada resistance); LPG ya dhuaan unhe lauta deta hai, to resistance ghatta hai aur AO ka voltage badhta hai. On hone ke baad ise garam hone mein kuch second lagte hain (naye sensor ko: ek din).'),
  },
  aa4: {
    term: { y: 3 }, cat: 'power', mount: 'free', props: {},
    name: t3('Battery box: 4 × AA (6 V)', 'बैटरी बॉक्स: 4 × AA (6 V)', 'Battery box: 4 × AA (6 V)'),
    pins: [{ id: 'P', at: [0, 0], dir: [0, 1], name: t3('Red wire: + 6 V', 'लाल तार: + 6 V', 'Red wire: + 6 V') }, { id: 'N', at: [P * 2, 0], dir: [0, 1], name: t3('Black wire: −', 'काला तार: −', 'Black wire: −') }],
    elec: (p, N) => [{ type: 'V', a: N.P, b: N.N, v: 6.2, r: 0.6, role: 'battery' }],
    specs: () => [['volt', '6 V (4 × 1.5 V)'], ['cap', '≈ 2000 mAh (alkaline)']],
    info: t3('Four 1.5 V cells in a row: 1.5 + 1.5 + 1.5 + 1.5 = 6 V. Here it runs the water pump, through the relay, so the pump\'s current never goes through the Arduino.',
      'एक कतार में चार 1.5 V के सेल: 1.5 + 1.5 + 1.5 + 1.5 = 6 V। यहाँ यह रिले से होकर पानी का पंप चलाता है, ताकि पंप का करंट कभी Arduino से होकर न जाए।',
      'Ek line mein chaar 1.5 V ke cell: 1.5 + 1.5 + 1.5 + 1.5 = 6 V. Yahan yeh relay se hokar paani ka pump chalata hai, taaki pump ka current kabhi Arduino se hokar na jaaye.'),
  },
  pump: {
    term: { y: 1.5 }, cat: 'move', mount: 'free', props: { mount: 'tank' }, state0: { flow: 0 },
    name: t3('Mini water pump 3–6 V', 'छोटा पानी का पंप 3–6 V', 'Mini water pump 3–6 V'),
    pins: [{ id: 'P', at: [-1.5 * P, 0], name: t3('Red wire (+)', 'लाल तार (+)', 'Red wire (+)') }, { id: 'N', at: [-0.5 * P, 0], name: t3('Black wire (−)', 'काला तार (−)', 'Black wire (−)') }], // (its plug: the pump is in the tank)
    elec: (p, N) => [{ type: 'R', a: N.P, b: N.N, r: 30, role: 'pump' }],
    dyn: (p, els, lab, dt, vAt) => {
      const s = p.state; const v = Math.abs(vAt(p.N.P) - vAt(p.N.N)); const e = els[0]; s.i = e ? Math.abs(e.iAvg || 0) : 0;
      const want = clamp((v - 2.2) / 3.8, 0, 1.2) * 33; s.flow += (want - s.flow) * (1 - Math.exp(-dt / 0.25)); if (s.flow < 0.2 && want === 0) s.flow = 0; // mL/s
      if (s.flow > 1) lab.sounds.push({ id: p.uid, kind: 'motor', f: 140 + s.flow * 3, amp: 0.35 });
    },
    specs: () => [['volt', '3–6 V DC, 130–220 mA'], ['flow', '80–120 L/h (≈ 30 mL a second)'], ['lift', '40–110 cm']],
    info: t3('A tiny motor spins a fan-wheel (impeller) that pushes water up the tube. It sits under water in the tank. It takes about 200 mA, far too much for an Arduino pin, so a relay switches its battery.',
      'एक छोटी मोटर एक पंखी (इम्पेलर) घुमाती है जो पानी को नली में ऊपर धकेलती है। यह टंकी में पानी के नीचे रहता है। यह लगभग 200 mA लेता है, Arduino के पिन से कहीं ज़्यादा, इसलिए रिले इसकी बैटरी को चालू-बंद करता है।',
      'Ek chhoti motor ek pankhi (impeller) ghumati hai jo paani ko nali mein upar dhakelti hai. Yeh tanki mein paani ke neeche rehta hai. Yeh lagbhag 200 mA leta hai, Arduino ke pin se kahin zyada, isliye relay iski battery ko on-off karta hai.'),
  },
  load230: {
    term: { y: 6 }, cat: 'power', mount: 'free', props: { kind: 'lamp' }, state0: { b: 0, w: 0 },
    name: t3('230 V box (lamp or fan, wired by an electrician)', '230 V डिब्बा (बल्ब या पंखा, इलेक्ट्रीशियन ने जोड़ा)', '230 V dabba (bulb ya fan, electrician ne joda)'),
    pins: [{ id: 'A', at: [0, 0], dir: [0, 1], name: t3('Live in (to the relay\'s COM)', 'लाइव अंदर (रिले के COM पर)', 'Live andar (relay ke COM par)') }, { id: 'B', at: [2 * P, 0], dir: [0, 1], name: t3('To the lamp / fan (from the relay\'s NO)', 'बल्ब / पंखे की ओर (रिले के NO से)', 'Bulb / fan ki taraf (relay ke NO se)') }],
    elec: (p, N) => [{ type: 'V', a: N.A, b: N.B, v: 230, r: LOAD230[p.props.kind].r, role: 'mains' }],
    dyn: (p, els, lab, dt) => {
      const s = p.state; const e = els[0]; const I = e ? Math.abs(e.iAvg || 0) : 0; const on = I > 0.5 * 230 / LOAD230[p.props.kind].r; s.on = on; s.i = I;
      if (p.props.kind === 'lamp') s.b += ((on ? 1 : 0) - s.b) * (1 - Math.exp(-dt / 0.06));
      else { s.w += ((on ? 1 : 0) - s.w) * (1 - Math.exp(-dt / (on ? 1.4 : 3.5))); if (s.w > 0.05) lab.sounds.push({ id: p.uid, kind: 'motor', f: 30 + s.w * 60, amp: 0.25 * s.w }); }
      s.a = ((s.a || 0) + s.w * 22 * dt) % (Math.PI * 2);
    },
    specs: (p) => [['volt', '230 V AC, 50 Hz'], ['power', LOAD230[p.props.kind].w + ' W'], ['safe', 'Closed box: never open it']],
    info: t3('Mains electricity (230 V) can kill. In this lab its wiring is already done by an electrician and closed inside the box: only its two ends go to the relay\'s COM and NO. You wire only the 5 V side (S, +, −). Never touch or open a mains wire.',
      'मेन्स बिजली (230 V) जान ले सकती है। इस लैब में इसकी वायरिंग पहले से इलेक्ट्रीशियन ने करके डिब्बे में बंद कर दी है: सिर्फ़ इसके दो सिरे रिले के COM और NO पर जाते हैं। आप सिर्फ़ 5 V वाली तरफ़ (S, +, −) जोड़िए। मेन्स का तार कभी मत छूइए, न खोलिए।',
      'Mains bijli (230 V) jaan le sakti hai. Is lab mein iski wiring pehle se electrician ne karke dabbe mein band kar di hai: sirf iske do sire relay ke COM aur NO par jaate hain. Aap sirf 5 V wali taraf (S, +, −) jodiye. Mains ka wire kabhi mat chhooiye, na kholiye.'),
  },
};
// the stepper: the coils that are on now (a settled pattern) pull the rotor; one step at a time, and not faster than it can follow
function stepCommit(p, t) {
  const s = p.state; s.pendT = undefined;
  if (!s.powered) return;
  if (s.patT !== undefined && t < s.patT) s.patT = undefined; // (a new run of the sketch: its clock starts again)
  let x = 0, y = 0; for (let i = 0; i < 4; i++) if (s.inp[i]) { x += Math.cos(i * Math.PI / 2); y += Math.sin(i * Math.PI / 2); }
  if (Math.hypot(x, y) < 0.3) return; // no coil, or two opposite coils: no pull
  const tgt = Math.atan2(y, x) * 180 / Math.PI; if (s.lastTgt === tgt) return;
  const prev = s.patT; s.patT = t; s.lastTgt = tgt; // a new pattern of coils
  const d = ((tgt - s.th) % 360 + 540) % 360 - 180;
  if (Math.abs(d) < 1) return;
  if (Math.abs(d) > 136) { s.miss = (s.miss || 0) + 1; s.missT = t; return; } // pulled from the far side: it only shakes
  if (prev !== undefined && t - prev < STEP28.minUs * Math.abs(d) / 90) { s.miss = (s.miss || 0) + 1; s.missT = t; return; } // the coils change faster than the rotor can follow: it hums and stays
  s.th += d; s.steps = (s.steps || 0) + d / 90;
}
export const DRAWER3 = ['lcd16', 'oled', 'seg7', 'dht11', 'soil', 'pir', 'relay', 'irrx', 'keypad', 'stepper', 'rfid', 'mq2', 'aa4'];
// what each new spec key is called
export const SPEC3 = {
  disp: t3('Display', 'डिस्प्ले', 'Display'), addr: t3('I2C address', 'I2C पता', 'I2C address'), res: t3('Resolution', 'रिज़ॉल्यूशन', 'Resolution'), rate: t3('Readings', 'रीडिंग', 'Readings'),
  probe: t3('Probe', 'प्रोब', 'Probe'), delay: t3('Stays on for', 'इतनी देर चालू', 'Itni der on'), coil: t3('Coil', 'कॉइल', 'Coil'), contacts: t3('Contacts', 'कॉन्टैक्ट', 'Contacts'),
  trig: t3('Turns on with', 'चालू होता है', 'On hota hai'), keys: t3('Keys', 'बटन', 'Keys'), steps: t3('Steps', 'क़दम', 'Steps'), bus: t3('Bus', 'बस', 'Bus'), uid: t3('Card number', 'कार्ड नंबर', 'Card number'),
  gas: t3('Senses', 'पहचानता है', 'Pehchanta hai'), heat: t3('Heater', 'हीटर', 'Heater'), flow: t3('Flow', 'बहाव', 'Flow'), lift: t3('Lifts water', 'पानी उठाता है', 'Paani uthata hai'), safe: t3('Safety', 'सुरक्षा', 'Safety'),
};

// ------------------------------------------------------------------ things a student does to the modules (the panel, the 3D, the tests)
// a remote button: every powered IR receiver gets its code ~70 ms later (one NEC frame)
export function irSend(lab, key) {
  const cmd = REMOTE[key]; if (cmd === undefined) return 0; let n = 0;
  for (const p of lab.parts) if (p.type === 'irrx' && p.state.powered) { (p.state.q || (p.state.q = [])).push({ cmd, at: lab.mcu.t + 68000 }); p.state.burstEnd = lab.mcu.t + 68000; n++; }
  touch(lab); return n;
}
// hold a card or tag on the reader for a while (s)
export function rfidShow(lab, id, secs = 1.6) { for (const p of lab.parts) if (p.type === 'rfid') p.state.card = { id, halted: false, hold: secs }; }
// press a key of the keypad (index 0..15) for a while (s), or hold it (secs: 99) until release
export function keyPress(lab, part, idx, secs = 0.25) { part.state.keys = part.state.keys || {}; part.state.keys[idx] = secs; touch(lab); }
export function keyRelease(lab, part, idx) { if (part.state.keys) delete part.state.keys[idx]; touch(lab); }
