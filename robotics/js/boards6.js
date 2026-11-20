// DUET Robotics Lab 360, batch 6: the Raspberry Pi boards, as data (the same shape as boards4.js; no three.js here).
//   pico   Raspberry Pi Pico (RP2040, 51 × 21 mm): plugs into the breadboard, pins in rows c and h, columns 2–21, USB to the
//          left. MicroPython: machine.Pin / PWM / ADC, utime. 3.3 V logic, ADC on GP26–28, the green LED on GP25 ("LED").
//   pi4    Raspberry Pi 4 Model B (85 × 56 mm): on the mat left of the breadboard, turned so that its 40-pin header runs along
//          the side next to the breadboard (pin 1 at the back). Python 3 with gpiozero. GPIO numbers are BCM numbers.
// Pin positions are from the official mechanical drawings (Pico datasheet; Raspberry Pi 4 Model B drawing): mm from the
// board's centre, x along the bench, z towards the student. A pin's `phys` is its number on the board (1–40).
const P = 2.54;
const t3 = (en, hi, hg) => ({ en, hi, hg });

// ------------------------------------------------------------------ what a pin can do (the pin popup)
export const DOES6 = {
  adc: t3('analog in ADC{x} (12-bit, read_u16: 0–65535)', 'एनालॉग इनपुट ADC{x} (12-बिट, read_u16: 0–65535)', 'analog input ADC{x} (12-bit, read_u16: 0–65535)'),
  pwm: t3('PWM {x}', 'PWM {x}', 'PWM {x}'),
  led: t3('the green LED on the board ("LED")', 'बोर्ड की हरी एलईडी ("LED")', 'board ki green LED ("LED")'),
  uart: t3('UART {x}', 'UART {x}', 'UART {x}'), i2c: t3('I2C {x}', 'I2C {x}', 'I2C {x}'), spi: t3('SPI {x}', 'SPI {x}', 'SPI {x}'),
  i2cpu: t3('I2C {x}, with a 1.8 kΩ pull-up to 3.3 V on the board', 'I2C {x}, बोर्ड पर 3.3 V की ओर 1.8 kΩ पुल-अप के साथ', 'I2C {x}, board par 3.3 V ki taraf 1.8 kΩ pull-up ke saath'),
  hwpwm: t3('hardware PWM{x}', 'हार्डवेयर PWM{x}', 'hardware PWM{x}'),
  idee: t3('HAT EEPROM: keep it free', 'HAT EEPROM: इसे ख़ाली रखिए', 'HAT EEPROM: ise khaali rakhiye'),
  gpclk: t3('clock out GPCLK{x}', 'क्लॉक आउट GPCLK{x}', 'clock out GPCLK{x}'),
  safe: t3('a good pin for LEDs and buttons', 'एलईडी और बटन के लिए अच्छा पिन', 'LED aur button ke liye achha pin'),
};
export const NAMES6 = {
  gp: t3('GP{n} (pin {phys})', 'GP{n} (पिन {phys})', 'GP{n} (pin {phys})'),
  gpio: t3('GPIO {n} · physical pin {phys}', 'GPIO {n} · फ़िज़िकल पिन {phys}', 'GPIO {n} · physical pin {phys}'),
  GND: t3('GND (pin {phys}): 0 V', 'GND (पिन {phys}): 0 V', 'GND (pin {phys}): 0 V'),
  AGND: t3('AGND (pin {phys}): ground for the ADC', 'AGND (पिन {phys}): ADC का ग्राउंड', 'AGND (pin {phys}): ADC ka ground'),
  VBUS: t3('VBUS (pin {phys}): 5 V from the USB cable, power out for 5 V parts', 'VBUS (पिन {phys}): USB केबल से 5 V, 5 V वाले पुर्ज़ों के लिए', 'VBUS (pin {phys}): USB cable se 5 V, 5 V wale parts ke liye'),
  VSYS: t3('VSYS (pin {phys}): the board\'s main supply, about 4.7 V (or a battery 1.8–5.5 V in)', 'VSYS (पिन {phys}): बोर्ड की मुख्य सप्लाई, लगभग 4.7 V (या बैटरी 1.8–5.5 V अंदर)', 'VSYS (pin {phys}): board ki main supply, lagbhag 4.7 V (ya battery 1.8–5.5 V andar)'),
  '3V3p': t3('3V3(OUT) (pin {phys}): 3.3 V out, up to 300 mA', '3V3(OUT) (पिन {phys}): 3.3 V बाहर, 300 mA तक', '3V3(OUT) (pin {phys}): 3.3 V bahar, 300 mA tak'),
  '3V3_EN': t3('3V3_EN (pin {phys}): joined to GND it switches the 3.3 V off', '3V3_EN (पिन {phys}): GND से जोड़ने पर 3.3 V बंद हो जाता है', '3V3_EN (pin {phys}): GND se jodne par 3.3 V band ho jaata hai'),
  ADC_VREF: t3('ADC_VREF (pin {phys}): the ADC\'s 3.3 V reference', 'ADC_VREF (पिन {phys}): ADC का 3.3 V रेफ़रेंस', 'ADC_VREF (pin {phys}): ADC ka 3.3 V reference'),
  RUN: t3('RUN (pin {phys}): joined to GND it restarts the Pico', 'RUN (पिन {phys}): GND से जोड़ने पर Pico फिर शुरू होता है', 'RUN (pin {phys}): GND se jodne par Pico phir shuru hota hai'),
  '3V3': t3('3.3 V power (pin {phys}): for sensors and the GPIO side', '3.3 V बिजली (पिन {phys}): सेंसर और GPIO के लिए', '3.3 V power (pin {phys}): sensors aur GPIO ke liye'),
  '5V': t3('5 V power (pin {phys}): straight from the USB-C supply. Never into a GPIO pin!', '5 V बिजली (पिन {phys}): सीधे USB-C सप्लाई से। इसे कभी GPIO पिन में मत लगाइए!', '5 V power (pin {phys}): seedhe USB-C supply se. Ise kabhi GPIO pin mein mat lagaiye!'),
};

// ------------------------------------------------------------------ Raspberry Pi Pico, on the breadboard
// The Pico turned so that its USB points left. Front row (row h), left to right: physical pins 1 … 20 (GP0, GP1, GND, GP2 …
// GP15). Back row (row c), left to right: pins 40 … 21 (VBUS, VSYS, GND, 3V3_EN, 3V3(OUT), ADC_VREF, GP28, AGND, GP27, GP26,
// RUN, GP22, GND, GP21 … GP16). 0.7 inch (7 holes) between the rows: two free holes stay beside each pin (a, b and i, j).
const PICO_FRONT = ['GP0', 'GP1', 'GND1', 'GP2', 'GP3', 'GP4', 'GP5', 'GND2', 'GP6', 'GP7', 'GP8', 'GP9', 'GND3', 'GP10', 'GP11', 'GP12', 'GP13', 'GND4', 'GP14', 'GP15'];
const PICO_BACK = ['VBUS', 'VSYS', 'GND8', '3V3_EN', '3V3', 'ADC_VREF', 'GP28', 'AGND', 'GP27', 'GP26', 'RUN', 'GP22', 'GND7', 'GP21', 'GP20', 'GP19', 'GP18', 'GND6', 'GP17', 'GP16'];
const PICO_NET = { VBUS: '5V', VSYS: 'VIN', '3V3': '3V3', '3V3_EN': '3V3', ADC_VREF: 'AREF', AGND: 'GND', RUN: 'RESET' };
function picoPins() {
  const pins = [];
  const mk = (id, i, front) => {
    const phys = front ? i + 1 : 40 - i;
    const p = { id, at: [(i - 9.5) * P, front ? 3.5 * P : -3.5 * P], hdr: front ? 'f' : 'b', col: i, row: front ? 'h' : 'c', phys, label: id.replace(/^GND\d$/, 'GND') };
    const m = /^GP(\d+)$/.exec(id);
    if (m) { p.gpio = +m[1]; p.net = 'G' + p.gpio; } else p.net = id.startsWith('GND') ? 'GND' : PICO_NET[id];
    p.does = []; const g = p.gpio;
    if (g !== undefined) {
      if (g >= 26) p.does.push(['adc', { x: g - 26 }]);
      p.does.push(['pwm', { x: Math.floor(g / 2) % 8 + (g % 2 ? 'B' : 'A') }]);
      if (g === 0 || g === 1) p.does.push(['uart', { x: g ? 'RX0' : 'TX0' }]);
      if (g === 4 || g === 5) p.does.push(['i2c', { x: g === 4 ? 'SDA0' : 'SCL0' }]);
      if (g >= 16 && g <= 19) p.does.push(['spi', { x: ['RX0', 'CS0', 'SCK0', 'TX0'][g - 16] }]);
    }
    pins.push(p);
  };
  PICO_FRONT.forEach((id, i) => mk(id, i, true)); PICO_BACK.forEach((id, i) => mk(id, i, false));
  return pins;
}

// ------------------------------------------------------------------ Raspberry Pi 4 Model B, on the mat
// The 40-pin header (J8): odd pins on the inner row, even pins on the outer row (the board's edge), pin 1 (3.3 V) at the end
// near the mounting hole. Physical pin -> what it is (BCM GPIO number, or a power pin).
export const J8 = { 1: '3V3', 2: '5V', 3: 2, 4: '5V', 5: 3, 6: 'GND', 7: 4, 8: 14, 9: 'GND', 10: 15, 11: 17, 12: 18, 13: 27, 14: 'GND', 15: 22, 16: 23, 17: '3V3', 18: 24, 19: 10, 20: 'GND',
  21: 9, 22: 25, 23: 11, 24: 8, 25: 'GND', 26: 7, 27: 0, 28: 1, 29: 5, 30: 'GND', 31: 6, 32: 12, 33: 13, 34: 'GND', 35: 19, 36: 16, 37: 26, 38: 20, 39: 'GND', 40: 21 };
export const PHYS_OF = {}; for (const [n, v] of Object.entries(J8)) if (typeof v === 'number') PHYS_OF[v] = +n; // BCM -> physical pin
// the board's own drawing (x from the left edge, y from the bottom edge, header at the top, USB / Ethernet on the right),
// turned a quarter (header towards +x, pin 1 at the back): bench x = y − 28, bench z = x − 42.5
export const PI4 = { W: 85, H: 56, hdrX: 32.5 - 9.5 * P, rowIn: 52.5 - P / 2, rowOut: 52.5 + P / 2 };
export const pi4Bench = (x, y) => [+(y - 28).toFixed(3), +(x - 42.5).toFixed(3)];
function pi4Pins() {
  const pins = []; let gnd = 0, v3 = 0, v5 = 0;
  for (let n = 1; n <= 40; n++) {
    const k = Math.floor((n - 1) / 2); const at = pi4Bench(PI4.hdrX + k * P, n % 2 ? PI4.rowIn : PI4.rowOut);
    const v = J8[n]; const p = { at, hdr: 'j8', phys: n };
    if (typeof v === 'number') { p.id = 'GPIO' + v; p.gpio = v; p.net = 'G' + v; p.label = 'GPIO' + v; }
    else if (v === 'GND') { p.id = 'GND' + (++gnd); p.net = 'GND'; p.label = 'GND'; }
    else if (v === '3V3') { p.id = '3V3' + (++v3 === 1 ? '' : 'b'); p.net = '3V3'; p.label = '3V3'; }
    else { p.id = '5V' + (++v5 === 1 ? '' : 'b'); p.net = '5V'; p.label = '5V'; }
    p.does = []; const g = p.gpio;
    if (g !== undefined) {
      if (g === 2 || g === 3) p.does.push(['i2cpu', { x: g === 2 ? 'SDA1' : 'SCL1' }]);
      if ([12, 13, 18, 19].includes(g)) p.does.push(['hwpwm', { x: g === 12 || g === 18 ? 0 : 1 }]);
      if (g === 14 || g === 15) p.does.push(['uart', { x: g === 14 ? 'TXD' : 'RXD' }]);
      if ([7, 8, 9, 10, 11].includes(g)) p.does.push(['spi', { x: { 7: 'CE1', 8: 'CE0', 9: 'MISO', 10: 'MOSI', 11: 'SCLK' }[g] }]);
      if (g === 0 || g === 1) p.does.push(['idee']);
      if (g === 4) p.does.push(['gpclk', { x: 0 }]);
      if ([17, 27, 22, 23, 24, 25, 5, 6, 16, 26, 20, 21].includes(g)) p.does.push(['safe']);
    }
    pins.push(p);
  }
  return pins;
}

// a board in the breadboard: which hole each pin is in, and which holes it covers (as boards4.js)
function bbMapOf(def, BB) {
  const pin = new Map(), at = new Map(), cover = new Set();
  for (const p of def.pins) { const id = p.row + (def.bb.col + p.col); pin.set(p.id, id); at.set(id, p.id); }
  const h0 = BB.holes.get(def.pins[0].row + (def.bb.col + def.pins[0].col)); const ox = h0.x - def.pins[0].at[0], oz = h0.z - def.pins[0].at[1];
  const [x0, x1, z0, z1] = def.bb.pcb;
  for (const h of BB.holes.values()) if (!at.has(h.id) && h.x > ox + x0 + 0.6 && h.x < ox + x1 - 0.6 && h.z > oz + z0 + 0.6 && h.z < oz + z1 - 0.6) cover.add(h.id);
  return { pin, at, cover, ox, oz, all: new Set([...at.keys(), ...cover]) };
}

// ------------------------------------------------------------------ the boards
const PI4_REG = (id, x, y, hw, hd, h, o) => { const [bx, bz] = pi4Bench(x, y); return Object.assign({ id, at: [bx, bz], hw, hd, h }, o || {}); };
export const BOARDS6 = {
  pico: {
    id: 'pico', short: 'Pico', py: true, lang: 'py', gpio: 30, adc: 3, led: 25, vcc: 3.3, v5: 5.0, vih: 2.0, vil: 0.8,
    pwm: [...Array(23).keys(), 26, 27, 28], real: [...Array(23).keys(), 25, 26, 27, 28], // (GP23, GP24, GP29: on the board only)
    name: t3('Raspberry Pi Pico (RP2040)', 'Raspberry Pi Pico (RP2040)', 'Raspberry Pi Pico (RP2040)'),
    size: [51, 21], pcbY: 8.5 + 2.5, pcbT: 1.0, hdrH: 0, color: '#0f6b3a',
    bb: { col: 2, pcb: [-25.5, 25.5, -10.5, 10.5] }, bbMapOf,
    pins: picoPins(),
    specs: [['mcu', 'RP2040: 2 × Arm Cortex-M0+'], ['clock', '133 MHz'], ['volt', '3.3 V (5 V on a pin can damage it)'], ['vin6', '5 V USB (VBUS), or 1.8–5.5 V on VSYS'], ['dio', '26 GPIO: GP0–GP22, GP26–GP28'], ['ain', '3 (GP26–GP28), 12-bit → read_u16() 0–65535'], ['pwm6', 'every GPIO (8 slices × 2 channels)'], ['pinmax', '4 mA (up to 12 mA)'], ['flash', '2 MB'], ['sram', '264 KB'], ['lang6', 'MicroPython, C/C++'], ['size', '51 × 21 mm']],
    regions: [
      { id: 'p_rp2040', at: [1.0, 0], hw: 3.5, hd: 3.5, h: 1.0, specs: true },
      { id: 'p_usb', at: [-23.6, 0], hw: 3.1, hd: 4.0, h: 3.2, usb: true },
      { id: 'p_bootsel', at: [-13.4, -3.2], hw: 2.4, hd: 1.9, h: 3.4 },
      { id: 'p_led', at: [-21.2, 6.2], hw: 1.4, hd: 1.0, h: 1.0 },
      { id: 'p_flash', at: [-6.6, 0.2], hw: 2.9, hd: 3.6, h: 1.6 },
      { id: 'p_xtal', at: [6.2, -3.6], hw: 1.7, hd: 1.4, h: 1.0 },
      { id: 'p_smps', at: [10.2, 5.2], hw: 3.6, hd: 2.0, h: 1.6 },
      { id: 'p_debug', at: [24.1, 0], hw: 1.4, hd: 3.6, h: 1.0 },
      { id: 'p_front', at: [0, 8.89], hw: 25.0, hd: 1.4, h: 1.0, pins: true, hdrs: ['f'] },
      { id: 'p_back', at: [0, -8.89], hw: 25.0, hd: 1.4, h: 1.0, pins: true, hdrs: ['b'] },
    ],
    view: { hw: 32, hd: 18 },
  },
  pi4: {
    id: 'pi4', short: 'Pi 4', py: true, lang: 'py', gpio: 29, led: 28, vcc: 3.3, v5: 5.0, vih: 1.8, vil: 0.8, // (GPIO 28 stands for the ACT LED: not on the header)
    pwm: [...Array(28).keys()], real: [...Array(28).keys()],
    name: t3('Raspberry Pi 4 Model B', 'Raspberry Pi 4 Model B', 'Raspberry Pi 4 Model B'),
    size: [56, 85], pcbY: 5.0, pcbT: 1.4, hdrH: 8.5, place: { x: -98, z: -4 }, color: '#0f5c33',
    pins: pi4Pins(),
    specs: [['cpu6', 'BCM2711: 4 × Arm Cortex-A72, 64-bit'], ['clock', '1.8 GHz'], ['ram6', '1, 2, 4 or 8 GB LPDDR4'], ['volt', '3.3 V on the GPIO pins (5 V on a pin can damage it)'], ['vin6', '5 V 3 A (USB-C)'], ['dio', '28 GPIO (BCM 0–27) on a 40-pin header'], ['ain', 'none: use an ADC chip (MCP3008)'], ['pinmax', '16 mA a pin, 50 mA in all'], ['net6', 'Gigabit Ethernet, WiFi 2.4 / 5 GHz, Bluetooth 5.0'], ['usb', '2 × USB 3.0, 2 × USB 2.0'], ['video6', '2 × micro-HDMI (4K)'], ['os6', 'Raspberry Pi OS (Linux), Python 3'], ['size', '85 × 56 mm']],
    regions: [
      PI4_REG('q_soc', 29, 32, 8.6, 8.6, 2.6, { specs: true }), PI4_REG('q_ram', 45.8, 32, 5.6, 7.6, 1.4), PI4_REG('q_header', PI4.hdrX + 9.5 * P, 52.5, 2.6, 25.4, 8.6, { pins: true, hdrs: ['j8'] }),
      PI4_REG('q_usb3', 78.6, 27, 6.6, 8.8, 16), PI4_REG('q_usb2', 78.6, 9, 6.6, 8.8, 16), PI4_REG('q_eth', 76.3, 45.75, 8.0, 10.8, 13.6),
      PI4_REG('q_usbc', 11.2, 3.6, 3.7, 4.6, 3.3, { usb: true }), PI4_REG('q_hdmi', 32.75, 3.0, 3.0, 10.6, 3.6), PI4_REG('q_audio', 53.5, 6.2, 6.2, 3.6, 6.2),
      PI4_REG('q_csi', 45.0, 11.5, 10.6, 1.8, 5.6), PI4_REG('q_dsi', 2.6, 28, 10.6, 1.8, 5.6), PI4_REG('q_sd', -1.0, 28, 6.4, 2.6, 1.4),
      PI4_REG('q_wifi', 11.4, 41.6, 6.2, 5.6, 1.6), PI4_REG('q_usbctl', 64.0, 24.0, 3.6, 3.6, 1.2), PI4_REG('q_pmic', 19.0, 13.4, 3.4, 3.4, 1.0), PI4_REG('q_leds', 2.2, 11.6, 2.4, 1.2, 1.0),
      PI4_REG('q_poe', 61.6, 48.6, 2.6, 2.6, 8.4),
    ],
    view: { hw: 46, hd: 56 },
  },
};
BOARDS6.pico.consts = {}; BOARDS6.pi4.consts = {};

// one line for a pin in the popup, and a short name (the wire toast): GP15, GPIO 17 (pin 11), GND …
export function pinTitle6(def, pin, tx) {
  let s;
  if (pin.gpio !== undefined) s = tx(def.id === 'pico' ? NAMES6.gp : NAMES6.gpio, { n: pin.gpio, phys: pin.phys });
  else { const k = pin.label === 'GND' ? 'GND' : def.id === 'pico' && pin.id === '3V3' ? '3V3p' : pin.id.replace(/b$/, ''); s = tx(NAMES6[k] || NAMES6[pin.net] || { en: pin.label }, { phys: pin.phys }); }
  const does = (pin.does || []).map(([k, a]) => tx(DOES6[k], a));
  return does.length ? s + ' · ' + does.join(' · ') : s;
}
export function pinShort6(def, pin) {
  if (pin.gpio === undefined) return def.id === 'pi4' ? `${pin.label} (${pin.phys})` : pin.label;
  return def.id === 'pico' ? 'GP' + pin.gpio : `GPIO ${pin.gpio} (${pin.phys})`;
}
for (const d of Object.values(BOARDS6)) { d.pinTitle = (pin, tx) => pinTitle6(d, pin, tx); d.pinShort = (pin) => pinShort6(d, pin); }
export { P };
