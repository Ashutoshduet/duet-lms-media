// DUET Robotics Lab 360: boards and the breadboard, as data. A board lists its pins (where they are, what they do, which
// net they belong to), its microcontroller and the parts a student can tap to learn about. Positions are in mm on the
// board, x to the right, z towards the student, origin at the board's centre. New boards (ESP32, Pico, …) are added here.
import { BOARDS4 } from './boards4.js'; // batch 4: Nano, Mega 2560, ESP32 DevKit V1
import { BOARDS6 } from './boards6.js'; // batch 6: Raspberry Pi Pico, Raspberry Pi 4 Model B
const IN = 25.4;

// UNO R3 header holes, in inches from the board's lower-left corner (USB on the left), as on the open UNO R3 layout
function unoPins() {
  const pins = [];
  const at = (X, Y) => [+(X * IN - 34.29).toFixed(3), +(26.67 - Y * IN).toFixed(3)];
  for (let i = 0; i <= 7; i++) pins.push({ id: 'D' + i, gpio: i, label: String(i), x: 2.6 - i * 0.1, y: 2.0, hdr: 'dl' });
  for (let i = 8; i <= 13; i++) pins.push({ id: 'D' + i, gpio: i, label: String(i), x: 1.74 - (i - 8) * 0.1, y: 2.0, hdr: 'dh' });
  pins.push({ id: 'GND3', net: 'GND', label: 'GND', x: 1.14, y: 2.0, hdr: 'dh' }, { id: 'AREF', net: 'AREF', label: 'AREF', x: 1.04, y: 2.0, hdr: 'dh' },
    { id: 'SDA', net: 'G18', label: 'SDA', x: 0.94, y: 2.0, hdr: 'dh' }, { id: 'SCL', net: 'G19', label: 'SCL', x: 0.84, y: 2.0, hdr: 'dh' });
  const pw = [['NC', 'NC', ''], ['IOREF', '5V', 'IOREF'], ['RESET', 'RESET', 'RESET'], ['3V3', '3V3', '3.3V'], ['5V', '5V', '5V'], ['GND1', 'GND', 'GND'], ['GND2', 'GND', 'GND'], ['VIN', 'VIN', 'Vin']];
  pw.forEach(([id, net, label], i) => pins.push({ id, net, label, x: 1.0 + i * 0.1, y: 0.1, hdr: 'pw' }));
  for (let i = 0; i <= 5; i++) pins.push({ id: 'A' + i, gpio: 14 + i, label: 'A' + i, x: 1.9 + i * 0.1, y: 0.1, hdr: 'an' });
  for (const p of pins) { const [x, z] = at(p.x, p.y); p.at = [x, z]; if (p.gpio !== undefined) p.net = 'G' + p.gpio; delete p.x; delete p.y; }
  return pins;
}

export const BOARDS = {
  uno: {
    id: 'uno', short: 'Uno', gpio: 20, adc: 6, pwm: [3, 5, 6, 9, 10, 11], led: 13, vcc: 5,
    name: { en: 'UNO R3 board (Arduino Uno compatible)', hi: 'UNO R3 बोर्ड (Arduino Uno जैसा)', hg: 'UNO R3 board (Arduino Uno jaisa)' },
    size: [68.58, 53.34], pcbY: 3, pcbT: 1.6, hdrH: 8.5,
    // outline in mm from the lower-left corner
    outline: [[0, 0], [66.04, 0], [68.58, 2.54], [68.58, 35.56], [66.04, 38.1], [66.04, 50.8], [63.5, 53.34], [0, 53.34]],
    holes: [[14.0, 2.54], [15.24, 50.8], [66.04, 7.62], [66.04, 35.56]],
    pins: unoPins(),
    specs: [['mcu', 'ATmega328P'], ['clock', '16 MHz'], ['volt', '5 V'], ['vin', '7–12 V'], ['dio', '14 (6 PWM ~)'], ['ain', '6 (A0–A5), 10-bit'], ['pinmax', '20 mA (max 40 mA)'], ['flash', '32 KB'], ['sram', '2 KB'], ['eeprom', '1 KB'], ['size', '68.6 × 53.4 mm']],
    // parts of the board a student can tap (centre x, z in mm, half-size w, d), for the labels and lesson 1
    regions: [
      { id: 'usb', at: [-32.7, -10.2], hw: 8, hd: 6, h: 11 },
      { id: 'jack', at: [-29.2, 18.3], hw: 7.1, hd: 4.5, h: 11 },
      { id: 'mcu', at: [15.2, 10.9], hw: 17.8, hd: 3.8, h: 8 },
      { id: 'usbchip', at: [-15.2, -7.6], hw: 3.5, hd: 3.5, h: 3 },
      { id: 'xtal', at: [-8.9, -1.3], hw: 5.6, hd: 2.4, h: 5 },
      { id: 'reset', at: [-25.7, -21.6], hw: 3.2, hd: 3.2, h: 6 },
      { id: 'reg', at: [-20.3, 13.5], hw: 3.4, hd: 3.8, h: 3 },
      { id: 'digital', at: [9.4, -24.13], hw: 23.6, hd: 2.4, h: 9, pins: true },
      { id: 'analog', at: [20.3, 24.13], hw: 7.6, hd: 2.4, h: 9, pins: true },
      { id: 'power', at: [0, 24.13], hw: 10.2, hd: 2.4, h: 9, pins: true },
      { id: 'ledL', at: [-3.8, -18.5], hw: 1.6, hd: 1.2, h: 2 },
      { id: 'ledTX', at: [-3.8, -11.4], hw: 1.6, hd: 2.6, h: 2 },
      { id: 'ledON', at: [25.4, -12.7], hw: 1.6, hd: 1.2, h: 2 },
      { id: 'icsp', at: [29.2, 0], hw: 3.4, hd: 4.4, h: 9 },
      { id: 'caps', at: [-12.5, 18.5], hw: 6, hd: 3.4, h: 6 },
    ],
  },
  nano: {
    id: 'nano', short: 'Nano', gpio: 22, adc: 8, pwm: [3, 5, 6, 9, 10, 11], led: 13, vcc: 5, analogOnly: [20, 21],
    name: { en: 'Nano board (Arduino Nano compatible)', hi: 'Nano बोर्ड (Arduino Nano जैसा)', hg: 'Nano board (Arduino Nano jaisa)' },
    later: true, // phase 2: a Nano that plugs into the breadboard
  },
};

Object.assign(BOARDS, BOARDS4); // batch 4: the Nano (in the breadboard) replaces the phase-2 placeholder above
Object.assign(BOARDS, BOARDS6); // batch 6: the Raspberry Pi boards (their MCU and Python: pi6.js)

// the breadboard: 830 tie points. 63 columns × rows a–j (two halves of five, joined down each column) and four power rails
// (+ and − at the back and at the front; each runs the whole length, 50 holes in groups of five). Pitch 2.54 mm.
export const BB = (() => {
  const P = 2.54, rows = 'abcdefghij';
  const rowZ = { a: -5.5, b: -4.5, c: -3.5, d: -2.5, e: -1.5, f: 1.5, g: 2.5, h: 3.5, i: 4.5, j: 5.5 };
  const rails = { tp: -9.5, tn: -8.5, bp: 8.5, bn: 9.5 }; // back: + outside, − inside · front: + inside, − outside
  const holes = new Map(); // id -> { id, x, z, strip }
  for (let c = 1; c <= 63; c++) for (const r of rows) {
    const id = r + c; holes.set(id, { id, x: (c - 32) * P, z: rowZ[r] * P, strip: 'S' + c + (r <= 'e' ? 't' : 'b'), col: c, row: r });
  }
  for (const [k, z] of Object.entries(rails)) for (let i = 0; i < 50; i++) {
    const col = 3 + i + Math.floor(i / 5); const id = k + (i + 1);
    holes.set(id, { id, x: (col - 32) * P, z: z * P, strip: 'R' + k, col, rail: k });
  }
  return { P, size: [165.1, 54.6, 8.5], rows, rowZ, rails, holes, top: 8.5 };
})();
export const holeAt = (id) => BB.holes.get(id);
// the holes that are joined to this one inside the breadboard
export function stripOf(id) { const h = BB.holes.get(id); if (!h) return []; const out = []; for (const x of BB.holes.values()) if (x.strip === h.strip) out.push(x.id); return out; }
// the nearest hole to a point on the breadboard (x, z in breadboard mm), within r
export function nearestHole(x, z, r = 1.6) {
  let best = null, bd = r * r;
  for (const h of BB.holes.values()) { const d = (h.x - x) ** 2 + (h.z - z) ** 2; if (d < bd) { bd = d; best = h; } }
  return best;
}
