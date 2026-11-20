// DUET Robotics Lab 360, batch 4: more boards, as data (the same shape as the UNO R3 in boards.js). Each board lists its
// pins (where they are on the board, mm from the board's centre, x along the board, z towards the student), what each pin
// can do (the pin-info popup), its specs, the parts a student can tap (regions) and the names the compiler knows (consts).
//   nano   Nano (Arduino Nano compatible, ATmega328P, CH340): plugs into the breadboard, pins in rows d and h
//   mega   Mega 2560 (Arduino Mega compatible): on the mat like the Uno, 54 digital pins, 16 analog inputs, 4 serial ports
//   esp32  ESP32 DevKit V1 (ESP32-WROOM-32, 30 pins): 3.3 V logic, WiFi and Bluetooth; plugs into the breadboard, rows b and i
// A board that plugs into the breadboard has `bb` (its first pin's column and its two rows); its pins are then joined to
// the breadboard's strips, and the holes under the board are covered (sim.js).
const IN = 25.4, P = 2.54;
// extensions of the bench (sim.js calls them): { elements(lab, els, G, pinState), dynamics(lab, dt) } (esp32.js adds its own)
export const LAB_HOOKS = [];
const t3 = (en, hi, hg) => ({ en, hi, hg });

// ------------------------------------------------------------------ what a pin can do (the pin-info popup)
// a pin's `does` is a list of these keys; the popup shows them after its name
export const PIN_DOES = {
  pwm: t3('PWM ~ (analogWrite)', 'PWM ~ (analogWrite)', 'PWM ~ (analogWrite)'),
  adc1: t3('analog in, ADC1 (works with WiFi on)', 'एनालॉग इनपुट, ADC1 (WiFi चालू होने पर भी चलता है)', 'analog input, ADC1 (WiFi on hone par bhi chalta hai)'),
  adc2: t3('analog in, ADC2 (not while WiFi is on)', 'एनालॉग इनपुट, ADC2 (WiFi चालू हो तो नहीं)', 'analog input, ADC2 (WiFi on ho to nahi)'),
  touch: t3('touch sensor {x}', 'टच सेंसर {x}', 'touch sensor {x}'),
  dac: t3('true analog out, DAC {x}', 'असली एनालॉग आउटपुट, DAC {x}', 'asli analog output, DAC {x}'),
  inonly: t3('INPUT only: no OUTPUT, no pull-up', 'सिर्फ़ INPUT: OUTPUT और pull-up नहीं', 'sirf INPUT: OUTPUT aur pull-up nahi'),
  strap: t3('boot pin: keep it free while the board starts', 'बूट पिन: बोर्ड शुरू होते समय इसे खाली रखिए', 'boot pin: board start hote waqt ise khaali rakhiye'),
  led2: t3('the blue LED on the board', 'बोर्ड की नीली एलईडी', 'board ki neeli LED'),
  led13: t3('the L LED on the board', 'बोर्ड की L एलईडी', 'board ki L LED'),
  usbser: t3('USB Serial {x}: keep it free', 'USB सीरियल {x}: इसे खाली रखिए', 'USB Serial {x}: ise khaali rakhiye'),
  ser: t3('Serial{n} {x}', 'सीरियल{n} {x}', 'Serial{n} {x}'),
  sda: t3('I2C SDA', 'I2C SDA', 'I2C SDA'), scl: t3('I2C SCL', 'I2C SCL', 'I2C SCL'),
  spi: t3('SPI {x}', 'SPI {x}', 'SPI {x}'),
  int: t3('interrupt {x}', 'इंटरप्ट {x}', 'interrupt {x}'),
  aonly: t3('analog input only (analogRead)', 'सिर्फ़ एनालॉग इनपुट (analogRead)', 'sirf analog input (analogRead)'),
};
export const PIN_NAMES = {
  dig: t3('Digital pin {n}', 'डिजिटल पिन {n}', 'Digital pin {n}'),
  ana: t3('Analog input {n}', 'एनालॉग इनपुट {n}', 'Analog input {n}'),
  gpio: t3('GPIO {n} (label {l})', 'GPIO {n} (लेबल {l})', 'GPIO {n} (label {l})'),
  GND: t3('GND: 0 V (ground)', 'GND: 0 V (ग्राउंड)', 'GND: 0 V (ground)'),
  '5V': t3('5V: power out', '5V: बिजली बाहर', '5V: power out'),
  '3V3': t3('3.3V: power out', '3.3V: बिजली बाहर', '3.3V: power out'),
  '3V3e': t3('3V3: the ESP32\'s own 3.3 V, power out (up to about 500 mA)', '3V3: ESP32 का अपना 3.3 V, बिजली बाहर (लगभग 500 mA तक)', '3V3: ESP32 ka apna 3.3 V, power out (lagbhag 500 mA tak)'),
  VINe: t3('VIN: 5 V from the USB cable (power for 5 V modules)', 'VIN: USB केबल से 5 V (5 V वाले मॉड्यूल के लिए बिजली)', 'VIN: USB cable se 5 V (5 V wale modules ke liye power)'),
  VIN: t3('Vin: the power jack\'s voltage', 'Vin: पावर जैक का वोल्टेज', 'Vin: power jack ka voltage'),
  VINn: t3('VIN: 7–12 V in (a battery)', 'VIN: 7–12 V अंदर (बैटरी)', 'VIN: 7–12 V andar (battery)'),
  RESET: t3('RESET: LOW restarts the board', 'RESET: LOW करने पर बोर्ड फिर शुरू', 'RESET: LOW karne par board phir shuru'),
  EN: t3('EN: LOW restarts the ESP32 (the EN button)', 'EN: LOW करने पर ESP32 फिर शुरू (EN बटन)', 'EN: LOW karne par ESP32 phir shuru (EN button)'),
  AREF: t3('AREF: reference for analogRead', 'AREF: analogRead का रेफ़रेंस', 'AREF: analogRead ka reference'),
  IOREF: t3('IOREF: tells shields the board works at 5 V', 'IOREF: शील्ड को बताता है कि बोर्ड 5 V पर चलता है', 'IOREF: shield ko batata hai ki board 5 V par chalta hai'),
};

// ------------------------------------------------------------------ Nano (ATmega328P, CH340), on the breadboard
// USB to the left. Back row (row d) left to right: D12 … D2, GND, RST, RX0, TX1. Front row (row h): D13, 3V3, REF, A0–A7,
// 5V, RST, GND, VIN (as on the Nano's pinout, turned so that its USB points left). 0.6 inch between the rows.
function nanoPins() {
  const back = ['D12', 'D11', 'D10', 'D9', 'D8', 'D7', 'D6', 'D5', 'D4', 'D3', 'D2', 'GND1', 'RST1', 'D0', 'D1'];
  const front = ['D13', '3V3', 'AREF', 'A0', 'A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', '5V', 'RST2', 'GND2', 'VIN'];
  const pins = [];
  const mk = (id, i, row) => {
    const x = (i - 7) * P, z = row ? 3 * P : -3 * P; const p = { id, at: [x, z], hdr: row ? 'f' : 'b', col: i, row: row ? 'h' : 'd' };
    let m;
    if ((m = /^D(\d+)$/.exec(id))) { p.gpio = +m[1]; p.label = m[1] === '0' ? 'RX0' : m[1] === '1' ? 'TX1' : 'D' + m[1]; }
    else if ((m = /^A(\d)$/.exec(id))) { p.gpio = 14 + +m[1]; p.label = id; }
    else { p.net = { GND1: 'GND', GND2: 'GND', RST1: 'RESET', RST2: 'RESET', AREF: 'AREF', '3V3': '3V3', '5V': '5V', VIN: 'VIN' }[id]; p.label = { GND1: 'GND', GND2: 'GND', RST1: 'RST', RST2: 'RST', AREF: 'REF', '3V3': '3V3', '5V': '5V', VIN: 'VIN' }[id]; }
    if (p.gpio !== undefined) p.net = 'G' + p.gpio;
    p.does = []; const g = p.gpio;
    if ([3, 5, 6, 9, 10, 11].includes(g)) p.does.push(['pwm']);
    if (g === 0 || g === 1) p.does.push(['usbser', { x: g ? 'TX' : 'RX' }]);
    if (g === 13) p.does.push(['led13']);
    if (g === 18) p.does.push(['sda']); if (g === 19) p.does.push(['scl']);
    if (g === 2 || g === 3) p.does.push(['int', { x: g - 2 }]);
    if (g === 20 || g === 21) p.does.push(['aonly']);
    pins.push(p);
  };
  back.forEach((id, i) => mk(id, i, 0)); front.forEach((id, i) => mk(id, i, 1));
  return pins;
}

// ------------------------------------------------------------------ Mega 2560: the Uno's headers, and more
// header holes in inches from the board's lower-left corner (USB on the left), as on the open Mega 2560 R3 layout
function megaPins() {
  const pins = [];
  const at = (X, Y) => [+(X * IN - 50.8).toFixed(3), +(26.67 - Y * IN).toFixed(3)];
  for (let i = 0; i <= 7; i++) pins.push({ id: 'D' + i, gpio: i, x: 2.6 - i * 0.1, y: 2.0, hdr: 'dl' });
  for (let i = 8; i <= 13; i++) pins.push({ id: 'D' + i, gpio: i, x: 1.74 - (i - 8) * 0.1, y: 2.0, hdr: 'dh' });
  pins.push({ id: 'GND3', net: 'GND', label: 'GND', x: 1.14, y: 2.0, hdr: 'dh' }, { id: 'AREF', net: 'AREF', label: 'AREF', x: 1.04, y: 2.0, hdr: 'dh' },
    { id: 'SDA', net: 'G20', label: 'SDA', x: 0.94, y: 2.0, hdr: 'dh' }, { id: 'SCL', net: 'G21', label: 'SCL', x: 0.84, y: 2.0, hdr: 'dh' });
  for (let i = 14; i <= 21; i++) pins.push({ id: 'D' + i, gpio: i, x: 2.74 + (i - 14) * 0.1, y: 2.0, hdr: 'cm' });
  const pw = [['NC', 'NC', ''], ['IOREF', '5V', 'IOREF'], ['RESET', 'RESET', 'RESET'], ['3V3', '3V3', '3.3V'], ['5V', '5V', '5V'], ['GND1', 'GND', 'GND'], ['GND2', 'GND', 'GND'], ['VIN', 'VIN', 'Vin']];
  pw.forEach(([id, net, label], i) => pins.push({ id, net, label, x: 1.0 + i * 0.1, y: 0.1, hdr: 'pw' }));
  for (let i = 0; i <= 7; i++) pins.push({ id: 'A' + i, gpio: 54 + i, label: 'A' + i, x: 1.9 + i * 0.1, y: 0.1, hdr: 'an' });
  for (let i = 8; i <= 15; i++) pins.push({ id: 'A' + i, gpio: 54 + i, label: 'A' + i, x: 2.8 + (i - 8) * 0.1, y: 0.1, hdr: 'ah' });
  // the double header at the right end: 5V 5V, 22 23, 24 25, … 52 53, GND GND (even pins on the inner column)
  pins.push({ id: '5Va', net: '5V', label: '5V', x: 3.8, y: 1.95, hdr: 'dd' }, { id: '5Vb', net: '5V', label: '5V', x: 3.9, y: 1.95, hdr: 'dd' });
  for (let r = 0; r < 16; r++) { const e = 22 + r * 2; pins.push({ id: 'D' + e, gpio: e, x: 3.8, y: 1.85 - r * 0.1, hdr: 'dd' }, { id: 'D' + (e + 1), gpio: e + 1, x: 3.9, y: 1.85 - r * 0.1, hdr: 'dd' }); }
  pins.push({ id: 'GND4', net: 'GND', label: 'GND', x: 3.8, y: 0.25, hdr: 'dd' }, { id: 'GND5', net: 'GND', label: 'GND', x: 3.9, y: 0.25, hdr: 'dd' });
  const SER = { 0: ['usbser', { x: 'RX' }], 1: ['usbser', { x: 'TX' }], 14: ['ser', { n: 3, x: 'TX3' }], 15: ['ser', { n: 3, x: 'RX3' }], 16: ['ser', { n: 2, x: 'TX2' }], 17: ['ser', { n: 2, x: 'RX2' }], 18: ['ser', { n: 1, x: 'TX1' }], 19: ['ser', { n: 1, x: 'RX1' }] };
  const INT = { 2: 0, 3: 1, 18: 5, 19: 4, 20: 3, 21: 2 };
  for (const p of pins) {
    const [x, z] = at(p.x, p.y); p.at = [x, z]; delete p.x; delete p.y;
    if (p.gpio === undefined) continue;
    const g = p.gpio; p.net = 'G' + g; if (!p.label) p.label = String(g);
    p.does = [];
    if ((g >= 2 && g <= 13) || (g >= 44 && g <= 46)) p.does.push(['pwm']);
    if (SER[g]) p.does.push(SER[g]);
    if (g === 13) p.does.push(['led13']);
    if (g === 20) p.does.push(['sda']); if (g === 21) p.does.push(['scl']);
    if (INT[g] !== undefined) p.does.push(['int', { x: INT[g] }]);
    if (g >= 50 && g <= 53) p.does.push(['spi', { x: { 50: 'MISO', 51: 'MOSI', 52: 'SCK', 53: 'SS' }[g] }]);
  }
  return pins;
}

// ------------------------------------------------------------------ ESP32 DevKit V1 (30 pins), on the breadboard
// USB to the left, the WROOM module's antenna to the right. Back row (row b) left to right: VIN, GND, D13, D12, D14, D27,
// D26, D25, D33, D32, D35, D34, VN (GPIO39), VP (GPIO36), EN. Front row (row i): 3V3, GND, D15, D2, D4, RX2 (16), TX2 (17),
// D5, D18, D19, D21, RX0 (3), TX0 (1), D22, D23. (The DOIT DevKit V1 pinout, turned so that its USB points left.)
const ESP_TOUCH = { 4: 'T0', 0: 'T1', 2: 'T2', 15: 'T3', 13: 'T4', 12: 'T5', 14: 'T6', 27: 'T7', 33: 'T8', 32: 'T9' };
const ESP_ADC1 = { 36: 0, 39: 3, 32: 4, 33: 5, 34: 6, 35: 7 };
const ESP_ADC2 = { 4: 0, 0: 1, 2: 2, 15: 3, 13: 4, 12: 5, 14: 6, 27: 7, 25: 8, 26: 9 };
export const ESP = { touch: ESP_TOUCH, adc1: ESP_ADC1, adc2: ESP_ADC2, inOnly: [34, 35, 36, 39], strap: [0, 2, 5, 12, 15], flash: [6, 7, 8, 9, 10, 11], none: [20, 24, 28, 29, 30, 31, 37, 38] };
function espPins() {
  const back = ['VIN', 'GND1', 'D13', 'D12', 'D14', 'D27', 'D26', 'D25', 'D33', 'D32', 'D35', 'D34', 'VN', 'VP', 'EN'];
  const front = ['3V3', 'GND2', 'D15', 'D2', 'D4', 'RX2', 'TX2', 'D5', 'D18', 'D19', 'D21', 'RX0', 'TX0', 'D22', 'D23'];
  const G = { VN: 39, VP: 36, RX2: 16, TX2: 17, RX0: 3, TX0: 1 };
  const pins = [];
  const mk = (id, i, row) => {
    const p = { id, at: [(i - 7) * P, row ? 4.5 * P : -4.5 * P], hdr: row ? 'f' : 'b', col: i, row: row ? 'i' : 'b', label: id };
    const m = /^D(\d+)$/.exec(id); const g = m ? +m[1] : G[id];
    if (g !== undefined) { p.gpio = g; p.net = 'G' + g; }
    else { p.net = { VIN: '5V', GND1: 'GND', GND2: 'GND', EN: 'RESET', '3V3': '3V3' }[id]; if (id.startsWith('GND')) p.label = 'GND'; }
    p.does = [];
    if (g !== undefined) {
      if (ESP.inOnly.includes(g)) p.does.push(['inonly']); else p.does.push(['pwm']);
      if (ESP_ADC1[g] !== undefined) p.does.push(['adc1']);
      if (ESP_ADC2[g] !== undefined) p.does.push(['adc2']);
      if (ESP_TOUCH[g]) p.does.push(['touch', { x: ESP_TOUCH[g] }]);
      if (g === 25 || g === 26) p.does.push(['dac', { x: g - 24 }]);
      if (ESP.strap.includes(g)) p.does.push(['strap']);
      if (g === 2) p.does.push(['led2']);
      if (g === 1 || g === 3) p.does.push(['usbser', { x: g === 1 ? 'TX' : 'RX' }]);
      if (g === 16 || g === 17) p.does.push(['ser', { n: 2, x: g === 16 ? 'RX2' : 'TX2' }]);
      if (g === 21) p.does.push(['sda']); if (g === 22) p.does.push(['scl']);
      if ([23, 19, 18, 5].includes(g)) p.does.push(['spi', { x: { 23: 'MOSI', 19: 'MISO', 18: 'SCK', 5: 'SS' }[g] }]);
    }
    pins.push(p);
  };
  back.forEach((id, i) => mk(id, i, 0)); front.forEach((id, i) => mk(id, i, 1));
  return pins;
}

// a board in the breadboard: which hole each pin is in, and which holes the board covers (no part or wire fits there)
function bbMapOf(def, BB) {
  const pin = new Map(), at = new Map(), cover = new Set();
  for (const p of def.pins) { const id = p.row + (def.bb.col + p.col); pin.set(p.id, id); at.set(id, p.id); }
  const h0 = BB.holes.get(def.pins[0].row + (def.bb.col + def.pins[0].col)); const ox = h0.x - def.pins[0].at[0], oz = h0.z - def.pins[0].at[1];
  const [x0, x1, z0, z1] = def.bb.pcb;
  for (const h of BB.holes.values()) if (!at.has(h.id) && h.x > ox + x0 + 0.6 && h.x < ox + x1 - 0.6 && h.z > oz + z0 + 0.6 && h.z < oz + z1 - 0.6) cover.add(h.id);
  return { pin, at, cover, ox, oz, all: new Set([...at.keys(), ...cover]) };
}

// ------------------------------------------------------------------ the boards
export const BOARDS4 = {
  nano: {
    id: 'nano', short: 'Nano', gpio: 22, adc: 8, pwm: [3, 5, 6, 9, 10, 11], led: 13, vcc: 5, analogOnly: [20, 21],
    name: t3('Nano board (Arduino Nano compatible)', 'Nano बोर्ड (Arduino Nano जैसा)', 'Nano board (Arduino Nano jaisa)'),
    size: [43.2, 18], pcbY: 8.5 + 2.5, pcbT: 1.6, hdrH: 0, color: '#1d4f9e',
    bb: { col: 3, pcb: [-21.6, 21.6, -9, 9] }, bbMapOf,
    pins: nanoPins(),
    specs: [['mcu', 'ATmega328P'], ['clock', '16 MHz'], ['volt', '5 V'], ['vin', '7–12 V (VIN pin)'], ['dio', '14 (6 PWM ~)'], ['ain', '8 (A0–A7), 10-bit'], ['pinmax', '20 mA (max 40 mA)'], ['flash', '32 KB'], ['sram', '2 KB'], ['eeprom', '1 KB'], ['usb', 'Mini-USB · CH340'], ['size', '43 × 18 mm']],
    regions: [
      { id: 'n_usb', at: [-20.4, 0], hw: 4.8, hd: 4.1, h: 5 },
      { id: 'n_mcu', at: [3.5, -0.3], hw: 5.2, hd: 5.2, h: 3, specs: true },
      { id: 'n_reset', at: [-6.4, 2.6], hw: 3.2, hd: 2.0, h: 4, reset: true },
      { id: 'n_leds', at: [-11.6, 2.2], hw: 1.6, hd: 3.6, h: 2 },
      { id: 'n_xtal', at: [-6.6, -3.6], hw: 3.0, hd: 1.4, h: 2.6 },
      { id: 'n_back', at: [0, -7.62], hw: 19.6, hd: 1.5, h: 1.2, pins: true, hdrs: ['b'] },
      { id: 'n_front', at: [0, 7.62], hw: 19.6, hd: 1.5, h: 1.2, pins: true, hdrs: ['f'] },
      { id: 'n_icsp', at: [17.8, 0], hw: 3.0, hd: 4.0, h: 2 },
    ],
    view: { hw: 27, hd: 15 },
  },
  mega: {
    id: 'mega', short: 'Mega', gpio: 70, adc: 16, pwm: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 44, 45, 46], led: 13, vcc: 5,
    name: t3('Mega 2560 board (Arduino Mega compatible)', 'Mega 2560 बोर्ड (Arduino Mega जैसा)', 'Mega 2560 board (Arduino Mega jaisa)'),
    size: [101.6, 53.34], pcbY: 3, pcbT: 1.6, hdrH: 8.5, place: { x: -112, z: -2 },
    outline: [[0, 0], [99.06, 0], [101.6, 2.54], [101.6, 50.8], [99.06, 53.34], [0, 53.34]],
    holes: [[14.0, 2.54], [15.24, 50.8], [66.04, 7.62], [66.04, 35.56], [90.17, 50.8], [96.52, 2.54]],
    pins: megaPins(),
    specs: [['mcu', 'ATmega2560'], ['clock', '16 MHz'], ['volt', '5 V'], ['vin', '7–12 V'], ['dio', '54 (15 PWM ~)'], ['ain', '16 (A0–A15), 10-bit'], ['serial', '4 (Serial, Serial1–3)'], ['pinmax', '20 mA (max 40 mA)'], ['flash', '256 KB'], ['sram', '8 KB'], ['eeprom', '4 KB'], ['size', '101.6 × 53.3 mm']],
    regions: [
      { id: 'm_usb', at: [-48.8, -10.2], hw: 8, hd: 6, h: 11, usb: true },
      { id: 'm_jack', at: [-45.3, 18.3], hw: 7.1, hd: 4.5, h: 11 },
      { id: 'm_mcu', at: [14.5, 3.8], hw: 8.6, hd: 8.6, h: 3, specs: true },
      { id: 'm_usbchip', at: [-31.3, -7.6], hw: 3.5, hd: 3.5, h: 3 },
      { id: 'm_xtal', at: [-4.5, 9.8], hw: 5.6, hd: 2.4, h: 5 },
      { id: 'm_reset', at: [-41.8, -21.6], hw: 3.2, hd: 3.2, h: 6, reset: true },
      { id: 'm_pwm', at: [-7.11, -24.13], hw: 23.6, hd: 2.4, h: 9, pins: true, hdrs: ['dl', 'dh'] },
      { id: 'm_comm', at: [27.69, -24.13], hw: 10.2, hd: 2.4, h: 9, pins: true, hdrs: ['cm'] },
      { id: 'm_dbl', at: [46.99, -1.27], hw: 3.0, hd: 22.9, h: 9, pins: true, hdrs: ['dd'] },
      { id: 'm_analog', at: [17.78, 24.13], hw: 21.6, hd: 2.4, h: 9, pins: true, hdrs: ['an', 'ah'] },
      { id: 'm_power', at: [-16.51, 24.13], hw: 10.2, hd: 2.4, h: 9, pins: true, hdrs: ['pw'] },
      { id: 'm_ledL', at: [-20.3, -18.5], hw: 1.6, hd: 1.2, h: 2 },
    ],
    view: { hw: 58, hd: 32 },
  },
  esp32: {
    id: 'esp32', short: 'ESP32', gpio: 40, adc: 18, led: 2, vcc: 3.3, v5: 4.7, vih: 2.48, vil: 0.83,
    pwm: [0, 1, 2, 3, 4, 5, 12, 13, 14, 15, 16, 17, 18, 19, 21, 22, 23, 25, 26, 27, 32, 33],
    name: t3('ESP32 DevKit V1 (ESP32-WROOM-32)', 'ESP32 DevKit V1 (ESP32-WROOM-32)', 'ESP32 DevKit V1 (ESP32-WROOM-32)'),
    size: [51.45, 28.33], pcbY: 8.5 + 2.5, pcbT: 1.6, hdrH: 0, color: '#18191c', wifi: true, bt: true, esp32: true,
    bb: { col: 4, pcb: [-23.0, 28.45, -14.17, 14.17] }, bbMapOf,
    pins: espPins(),
    specs: [['mcu', 'ESP32-D0WD (2 cores, Xtensa LX6)'], ['clock', '240 MHz'], ['volt', '3.3 V (5 V on a pin can damage it)'], ['vin', '5 V (USB or VIN pin)'], ['dio', '25 GPIO on the pins (all PWM, except 34–39)'], ['ain', '15 inputs, 12-bit (0–4095)'], ['wifi', '2.4 GHz WiFi (802.11 b/g/n)'], ['bt', 'Bluetooth 4.2 + BLE'], ['touch', '9 touch pins (T0, T2–T9)'], ['pinmax', '20 mA (max 40 mA)'], ['flash', '4 MB'], ['sram', '520 KB'], ['size', '51.5 × 28.3 mm']],
    regions: [
      { id: 'e_wroom', at: [13.6, 0], hw: 9.0, hd: 8.6, h: 3.4, specs: true },
      { id: 'e_ant', at: [26.4, 0], hw: 3.1, hd: 8.6, h: 2 },
      { id: 'e_usb', at: [-21.0, 0], hw: 3.4, hd: 4.0, h: 4.2, usb: true },
      { id: 'e_uart', at: [-11.4, 4.4], hw: 2.9, hd: 2.9, h: 1.6 },
      { id: 'e_reg', at: [-10.8, -5.6], hw: 3.6, hd: 3.4, h: 2.2 },
      { id: 'e_en', at: [-17.2, -8.0], hw: 2.3, hd: 2.0, h: 2.6, reset: true },
      { id: 'e_boot', at: [-17.2, 8.0], hw: 2.3, hd: 2.0, h: 2.6 },
      { id: 'e_led', at: [-3.6, 5.6], hw: 1.4, hd: 1.2, h: 1.6 },
      { id: 'e_back', at: [0, -11.43], hw: 19.6, hd: 1.5, h: 1.2, pins: true, hdrs: ['b'] },
      { id: 'e_front', at: [0, 11.43], hw: 19.6, hd: 1.5, h: 1.2, pins: true, hdrs: ['f'] },
    ],
    view: { hw: 33, hd: 20 },
  },
};

// the names the compiler knows for each board (analogRead(A0) on a Mega is pin 54, LED_BUILTIN on an ESP32 is GPIO 2)
BOARDS4.mega.consts = Object.fromEntries([...Array(16)].map((_, i) => ['A' + i, 54 + i]));
BOARDS4.esp32.consts = Object.assign({ LED_BUILTIN: 2, A0: 36, A3: 39, A4: 32, A5: 33, A6: 34, A7: 35, A10: 4, A11: 0, A12: 2, A13: 15, A14: 13, A15: 12, A16: 14, A17: 27, A18: 25, A19: 26, DAC1: 25, DAC2: 26, TX: 1, RX: 3, SDA: 21, SCL: 22 },
  Object.fromEntries(Object.entries(ESP_TOUCH).map(([g, n]) => [n, +g])));
BOARDS4.nano.consts = {};

// where the board sits on the bench (mm): in the breadboard, or on the mat
export function boardPlace(def, BB, bb) {
  if (!def.bb) return def.place || { x: -92, z: -2 };
  const m = def.bbMap || (def.bbMap = def.bbMapOf(def, BB));
  return { x: bb.x + m.ox, z: bb.z + m.oz };
}

// one line for a board pin in the popup: its name and what it can do
export function pinTitle(def, pin, tx) {
  if (def.pinTitle) return def.pinTitle(pin, tx); // batch 6: the Raspberry Pi boards name their own pins (boards6.js)
  let s;
  if (def.id === 'esp32') s = pin.gpio !== undefined ? tx(PIN_NAMES.gpio, { n: pin.gpio, l: pin.label }) : tx(PIN_NAMES[{ '3V3': '3V3e', VIN: 'VINe', EN: 'EN' }[pin.id] || pin.net] || { en: pin.label });
  else if (pin.gpio !== undefined) s = def.id === 'mega' && pin.gpio >= 54 ? tx(PIN_NAMES.ana, { n: 'A' + (pin.gpio - 54) }) : def.id === 'nano' && pin.gpio >= 14 ? tx(PIN_NAMES.ana, { n: 'A' + (pin.gpio - 14) }) : tx(PIN_NAMES.dig, { n: pin.gpio });
  else s = tx(PIN_NAMES[pin.id === 'VIN' && def.id === 'nano' ? 'VINn' : pin.id] || PIN_NAMES[pin.net] || { en: pin.label });
  const does = (pin.does || []).map(([k, a]) => tx(PIN_DOES[k], a));
  return does.length ? s + ' · ' + does.join(' · ') : s;
}
// a short name for a pin end (the wire toast): D5, A0, GPIO 23, GND …
export function pinShort(def, pin) {
  if (def.pinShort) return def.pinShort(pin); // batch 6
  if (pin.gpio === undefined) return pin.label;
  if (def.id === 'esp32') return 'GPIO ' + pin.gpio;
  if (def.id === 'mega') return pin.gpio >= 54 ? 'A' + (pin.gpio - 54) : (def.pwm.includes(pin.gpio) ? '~' : '') + pin.gpio;
  return pin.gpio >= 14 ? 'A' + (pin.gpio - 14) : (def.pwm.includes(pin.gpio) ? '~' : '') + pin.gpio;
}
export { IN, P };
