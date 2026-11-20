// DUET Robotics Lab 360, batch 24 (robotics/js/pi24.js): the Raspberry Pi 4's I2C screens, without a browser.
//   RPLCD    CharLCD('PCF8574', 0x27, cols=16, rows=2): write_string, cursor_pos (row, col), clear, "\r\n", backlight;
//            what goes wrong as on a real Pi: SDA / SCL swapped, no 5 V, the wrong address (0x3F), the library's 20 × 4
//            default, a number to write_string, (col, row) past the edge
//   MCP3008  gpiozero's MCP3008(channel=0) on SPI0 through the chip: raw_value / value / voltage; DOUT or CS elsewhere
//            or no VDD reads 0, VREF loose reads 1023, a loose input wanders, the chip or the knob on 5 V is warned about
//   HC-05    the Uno's Serial on TX (pin 1) through the divider to the phone's BT Terminal; 115200 baud is rubbish, no
//            wire is silence, Run again keeps the link
//   wateratm the Class 11 water ATM (lessons24.js), played with its scene (scenes3.js AtmScene): half a glass, the
//            calibration, the refused card; the relay on the wrong pin is named
//   Pico     pico_i2c_lcd: I2cLcd(i2c, 0x27, 2, 16), putstr, move_to(col, row) (no check: the wrong order writes in the wrong
//            place), wrap; OSError EIO when swapped, at another address or on the other bus
//   luma     i2c(port=1, address=0x3C) + ssd1306 + canvas: text, big font, rectangle; an unknown font; port 0
//                                                    node devtools/test/robocore24.mjs
import { compile } from '../../robotics/js/cpp.js';
import { Lab } from '../../robotics/js/sim.js';
import { lcdText, oledLit } from '../../robotics/js/libs3.js';
import { netOf } from '../../robotics/js/esp32.js';
import { LESSONS } from '../../robotics/js/lessons.js';
import { LessonRT } from '../../robotics/js/lessonrt.js';
import { makeScene } from '../../robotics/js/scenes3.js';
import { ArmSim, CarSim, carFeed, wifiCheck, CARG } from '../../robotics/js/robots.js';
import { BO } from '../../robotics/js/parts2.js';
import { set26 } from '../../robotics/js/parts26.js';
import { set29, curlOf } from '../../robotics/js/parts29.js';

const B = (e) => (/^(H|T|B):/.test(e) ? e : 'B:' + e); // a board pin
let fails = 0; const ok = (c, m) => { if (!c) { fails++; console.log('FAIL ' + m); } else console.log('ok   ' + m); };

function bench({ lcd = true, oled = true, swap = false, noVcc = false, addr } = {}) {
  const lab = new Lab(); lab.setBoard('pi4');
  for (const [a, b] of [['5V', 'H:tp30'], ['GND1', 'H:tn28'], ['3V3', 'H:bp30'], ['GND2', 'H:bn28']]) lab.addWire(B(a), B(b)); // the rails, as every Pi lesson has them
  if (lcd) {
    const T = 'T:' + lab.addPart('lcd16', addr ? { addr } : {}, { x: -128, z: 66 }, 0, 'lcd').uid + ':'; // (a terminal is named by the part's uid)
    lab.addWire(T + 'GND', 'H:tn10'); if (!noVcc) lab.addWire(T + 'VCC', 'H:tp10');
    lab.addWire(T + 'SDA', swap ? 'B:GPIO3' : 'B:GPIO2'); lab.addWire(T + 'SCL', swap ? 'B:GPIO2' : 'B:GPIO3');
  }
  if (oled) { lab.addPart('oled', {}, { hole: 'e30' }, 0, 'oled'); lab.addWire('H:a30', 'H:tn30'); lab.addWire('H:a31', 'H:bp31'); lab.addWire('H:a32', 'B:GPIO3'); lab.addWire('H:a33', 'B:GPIO2'); }
  for (let f = 0; f < 6; f++) lab.step(1000 / 60); // the bench is on before Run (the Pi is powered by its USB-C)
  return lab;
}
function run(lab, src, secs = 2) {
  const c = compile(src, lab.def); if (!c.ok) return { out: '', err: c.errors[0] };
  lab.run(c); let out = '';
  for (let f = 0; f < secs * 60; f++) { lab.step(1000 / 60); for (const o of lab.mcu.ser.take()) out += String.fromCharCode(...o.bytes); if (lab.mcu.state === 'error') break; }
  return { out, err: lab.mcu.state === 'error' ? lab.mcu.err : null };
}
const code = (r) => r.err && (r.err.code || (r.err.msg && r.err.msg.code) || JSON.stringify(r.err).slice(0, 120));
const HEAD = 'from RPLCD.i2c import CharLCD\n';

// ------------------------------------------------------------ RPLCD
let lab = bench(); let r = run(lab, HEAD + 'lcd = CharLCD("PCF8574", 0x27, cols=16, rows=2)\nlcd.write_string("Hello, Pi!")\nlcd.cursor_pos = (1, 0)\nlcd.write_string("Row two")\nprint(lcd.cursor_pos)\n');
let t = lcdText(lab.byTag('lcd')); ok(!r.err && t[0] === 'Hello, Pi!      ' && t[1] === 'Row two         ' && /\(1, 7\)/.test(r.out), `write_string, cursor_pos = (row, col): ${JSON.stringify(t)} ${JSON.stringify(r.out)} ${code(r) || ''}`);
r = run(lab, HEAD + 'lcd = CharLCD("PCF8574", 0x27, cols=16, rows=2)\nlcd.write_string("Line one\\r\\nLine two")\n'); t = lcdText(lab.byTag('lcd'));
ok(!r.err && t[0].startsWith('Line one') && t[1].startsWith('Line two'), `"\\r\\n" goes to the start of the next row: ${JSON.stringify(t)}`);
r = run(lab, HEAD + 'lcd = CharLCD("PCF8574", 0x27, cols=16, rows=2)\nlcd.write_string("ABCDEFGHIJKLMNOPQRS")\n'); t = lcdText(lab.byTag('lcd'));
ok(!r.err && t[0] === 'ABCDEFGHIJKLMNOP' && t[1].startsWith('QRS'), `a long line breaks onto row 2 at the 16th letter: ${JSON.stringify(t)}`);
r = run(lab, HEAD + 'lcd = CharLCD("PCF8574", 0x27)\nlcd.write_string("ABCDEFGHIJKLMNOPQRS")\n'); t = lcdText(lab.byTag('lcd'));
ok(!r.err && t[0] === 'ABCDEFGHIJKLMNOP' && t[1].trim() === '', `without cols=16 (RPLCD's 20 × 4 default) letters 17–19 vanish past the glass: ${JSON.stringify(t)}`);
r = run(lab, HEAD + 'lcd = CharLCD("PCF8574", 0x27, cols=16, rows=2)\nlcd.write_string("x")\nlcd.clear()\nlcd.write_string("Temp 31\\u00b0C")\nlcd.backlight_enabled = False\n'); t = lcdText(lab.byTag('lcd'));
ok(!r.err && t[0].startsWith('Temp 31°C') && lab.byTag('lcd').state.bl === false, `clear, "°", backlight off: ${JSON.stringify(t)}`);
r = run(lab, HEAD + 'lcd = CharLCD("PCF8574", 0x27, cols=16, rows=2)\nlcd.write_string(31)\n'); ok(code(r) === 'N24_LCD_STR', `write_string(31): TypeError (${code(r)})`);
r = run(lab, HEAD + 'lcd = CharLCD("PCF8574", 0x27, cols=16, rows=2)\nlcd.cursor_pos = (0, 16)\n'); ok(code(r) === 'N24_LCD_POS_BAD', `cursor_pos = (0, 16): ValueError on a 2x16 LCD (${code(r)})`);
r = run(lab, HEAD + 'lcd = CharLCD("PCF8574", 0x27, cols=16, rows=2)\nlcd.cursor_pos = (5, 1)\n'); ok(code(r) === 'N24_LCD_POS_BAD', `cursor_pos = (col, row) the wrong way round: ValueError (${code(r)})`);
r = run(lab, HEAD + 'lcd = CharLCD(0x27)\n'); ok(code(r) === 'N24_LCD_EXP', `CharLCD(0x27) without the expander: ValueError (${code(r)})`);
r = run(bench({ swap: true }), HEAD + 'lcd = CharLCD("PCF8574", 0x27, cols=16, rows=2)\n'); ok(code(r) === 'N24_I2C_NODEV', `SDA and SCL swapped: OSError 121 (${code(r)})`);
r = run(bench({ noVcc: true }), HEAD + 'lcd = CharLCD("PCF8574", 0x27, cols=16, rows=2)\n'); ok(code(r) === 'N24_I2C_NODEV', `VCC not wired: OSError 121 (${code(r)})`);
r = run(bench({ addr: 0x3f }), HEAD + 'lcd = CharLCD("PCF8574", 0x27, cols=16, rows=2)\n'); ok(code(r) === 'N24_I2C_NODEV', `a 0x3F backpack asked at 0x27: OSError 121 (${code(r)})`);
r = run(bench({ addr: 0x3f }), HEAD + 'lcd = CharLCD("PCF8574", 0x3F, cols=16, rows=2)\nlcd.write_string("ok")\n'); ok(!r.err, 'at its own address 0x3F it answers');
r = run(bench(), HEAD + 'lcd = CharLCD("PCF8574", 0x27, port=0, cols=16, rows=2)\n'); ok(code(r) === 'N24_I2C_PORT', `port=0: no /dev/i2c-0 on a Pi 4 (${code(r)})`);
r = run(bench(), 'import RPLCD\nprint(RPLCD.__version__)\nfrom RPLCD.i2c import CharLCD\nlcd = CharLCD(i2c_expander="PCF8574", address=0x27, port=1, cols=16, rows=2, charmap="A00", auto_linebreaks=True)\nlcd.write_string("kw")\n');
ok(!r.err && /1\.3\.1/.test(r.out), `import RPLCD, keyword arguments as the RPLCD docs write them (${code(r) || 'ok'})`);
const v5 = (() => { const L = bench({ oled: false }); run(L, HEAD + 'lcd = CharLCD("PCF8574", 0x27, cols=16, rows=2)\n', 0.5); const n = L.byTag('lcd').N; return [n.SDA, n.SCL].map((k) => +(L.V ? L.V[k] : NaN).toFixed(2)); })();
ok(v5.every((v) => !(v > 3.9)), `SDA / SCL with the 5 V backpack on: ${JSON.stringify(v5)} V (the Pi's 1.8 kΩ pull-ups hold them near 3.3 V)`);

// ------------------------------------------------------------ luma.oled
const LH = 'from luma.core.interface.serial import i2c\nfrom luma.core.render import canvas\nfrom luma.oled.device import ssd1306\nfrom PIL import ImageFont\n';
lab = bench({ lcd: false });
r = run(lab, LH + 'serial = i2c(port=1, address=0x3C)\noled = ssd1306(serial)\nbig = ImageFont.truetype("DejaVuSans.ttf", 20)\nwith canvas(oled) as draw:\n    draw.rectangle(oled.bounding_box, outline="white", fill="black")\n    draw.text((4, 4), "Pi OLED", fill="white")\n    draw.text((4, 24), "BIG", font=big, fill="white")\nprint(oled.width, oled.height)\n');
let o = lab.byTag('oled'); const lit1 = oledLit(o);
ok(!r.err && o.state.text === 'Pi OLED\nBIG' && lit1 > 300 && /128 64/.test(r.out), `canvas: a frame, small and big text reach the OLED when the with block ends (${lit1} dots lit) ${code(r) || ''}`);
r = run(lab, LH + 'serial = i2c(port=1, address=0x3C)\noled = ssd1306(serial)\ndraw_later = canvas(oled)\nprint("made")\n'); o = lab.byTag('oled');
ok(!r.err && oledLit(o) === 0, 'canvas() alone sends nothing (luma clears the screen at start)');
r = run(lab, LH + 'serial = i2c(port=1, address=0x3C)\noled = ssd1306(serial)\nbig = ImageFont.truetype("arial.ttf", 20)\n'); ok(code(r) === 'N24_FONT', `arial.ttf: OSError, the Pi has no Windows fonts (${code(r)})`);
r = run(lab, LH + 'serial = i2c(port=1, address=0x3D)\noled = ssd1306(serial)\n'); ok(code(r) === 'N24_I2C_NODEV', `address 0x3D: OSError 121 (${code(r)})`);
r = run(lab, LH + 'oled = ssd1306()\n'); ok(code(r) === 'N24_LUMA_SERIAL' || /TypeError|P_ARGS/.test(JSON.stringify(r.err)), `ssd1306() without the serial: TypeError (${code(r)})`);
r = run(lab, LH + 'serial = i2c(port=1, address=0x3C)\noled = ssd1306(serial)\nwith canvas(oled) as draw:\n    draw.text((0, 0), "x", fill="red")\n'); ok(code(r) === 'N24_COLOR', `fill="red" on a one-colour OLED: ValueError (${code(r)})`);
r = run(bench({ lcd: false, oled: false }), LH + 'serial = i2c(port=1, address=0x3C)\noled = ssd1306(serial)\n'); ok(code(r) === 'N24_I2C_NODEV', `no OLED on the bus: OSError 121 (${code(r)})`);

// ------------------------------------------------------------ the Pico: pico_i2c_lcd (move_to is column first)
function pico({ swap = false } = {}) {
  const lab = new Lab(); lab.setBoard('pico');
  for (const [a, b] of [['H:a2', 'H:tp1'], ['H:a4', 'H:tn3'], ['H:j19', 'H:bn15']]) lab.addWire(a, b); // VBUS and GND to the rails, as every Pico lesson
  const T = 'T:' + lab.addPart('lcd16', {}, { x: -128, z: 66 }, 0, 'lcd').uid + ':';
  lab.addWire(T + 'GND', 'H:tn10'); lab.addWire(T + 'VCC', 'H:tp10'); lab.addWire(T + 'SDA', swap ? 'H:j8' : 'H:j7'); lab.addWire(T + 'SCL', swap ? 'H:j7' : 'H:j8');
  for (let f = 0; f < 6; f++) lab.step(1000 / 60); return lab;
}
const PH = 'from machine import Pin, I2C\nfrom pico_i2c_lcd import I2cLcd\ni2c = I2C(0, sda=Pin(4), scl=Pin(5), freq=400000)\n';
lab = pico(); r = run(lab, PH + 'print(hex(i2c.scan()[0]))\nlcd = I2cLcd(i2c, i2c.scan()[0], 2, 16)\nlcd.putstr("Hello Pico")\nlcd.move_to(0, 1)\nlcd.putstr("Line two")\n'); t = lcdText(lab.byTag('lcd'));
ok(!r.err && t[0].startsWith('Hello Pico') && t[1].startsWith('Line two') && /0x27/.test(r.out), `Pico: scan() finds 0x27, putstr, move_to(0, 1): ${JSON.stringify(t)} ${code(r) || ''}`);
r = run(lab, PH + 'lcd = I2cLcd(i2c, 0x27, 2, 16)\nlcd.move_to(1, 0)\nlcd.putstr("oops")\n'); t = lcdText(lab.byTag('lcd'));
ok(!r.err && t[0] === ' oops           ' && t[1].trim() === '', `move_to(1, 0) meant as "line 1" writes on line 0 at column 1, no error: ${JSON.stringify(t)}`);
r = run(lab, PH + 'lcd = I2cLcd(i2c, 0x27, 2, 16)\nlcd.putstr("0123456789ABCDEFxyz\\nnext")\n'); t = lcdText(lab.byTag('lcd'));
ok(!r.err && t[0] === '0123456789ABCDEF' && t[1].startsWith('xyznext'), `a full line wraps; as in lcd_api.py, a "\\n" after a wrap (even 3 letters later) is swallowed: ${JSON.stringify(t)}`);
r = run(lab, PH + 'lcd = I2cLcd(i2c, 0x27, 2, 16)\nlcd.putstr(25)\n'); ok(code(r) === 'N24_PICO_STR', `putstr(25): TypeError (${code(r)})`);
r = run(pico({ swap: true }), PH + 'lcd = I2cLcd(i2c, 0x27, 2, 16)\n'); ok(code(r) === 'N6_I2C_NODEV', `Pico, SDA and SCL swapped: OSError EIO (${code(r)})`);
r = run(pico(), PH + 'lcd = I2cLcd(i2c, 0x3F, 2, 16)\n'); ok(code(r) === 'N6_I2C_NODEV', `Pico, the wrong address 0x3F: OSError EIO (${code(r)})`);
r = run(pico(), 'from machine import Pin, I2C\nfrom pico_i2c_lcd import I2cLcd\ni2c = I2C(1, sda=Pin(6), scl=Pin(7))\nlcd = I2cLcd(i2c, 0x27, 2, 16)\n'); ok(code(r) === 'N6_I2C_NODEV', `Pico, I2C1 on GP6/GP7 while the LCD is on GP4/GP5: OSError EIO (${code(r)})`);
r = run(pico(), PH + 'lcd = I2cLcd(i2c, 0x27, 2, 16)\nlcd.putstr("x")\nlcd.clear()\nlcd.backlight_off()\n'); t = lcdText(lab.byTag('lcd'));
ok(!r.err, `clear, backlight_off (${code(r) || 'ok'})`);

// ------------------------------------------------------------ gpiozero.MCP3008 (parts24.js): the Pi's analog inputs
function adcBench({ skip = [], vdd = '3V3b', pot = true, potTop = 'H:bp49' } = {}) {
  const lab = new Lab(); lab.setBoard('pi4');
  for (const [a, b] of [['5V', 'H:tp30'], ['GND1', 'H:tn28'], ['3V3', 'H:bp30'], ['GND2', 'H:bn28']]) lab.addWire(B(a), B(b));
  lab.addPart('mcp3008', {}, { hole: 'f5' }, 0, 'adc');
  const W = { vdd: [B(vdd), 'H:a5'], vref: ['H:b5', 'H:b6'], agnd: ['H:a7', 'H:tn7'], dgnd: ['H:a12', 'H:tn12'], clk: ['B:GPIO11', 'H:a8'], dout: ['B:GPIO9', 'H:a9'], din: ['B:GPIO10', 'H:a10'], cs: ['B:GPIO8', 'H:a11'] };
  for (const [k, [a, b]] of Object.entries(W)) if (!skip.includes(k)) lab.addWire(a, b);
  if (pot) { lab.addPart('pot', {}, { hole: 'e45' }, 0, 'pot1'); lab.addWire('H:a45', 'H:tn45'); lab.addWire('H:a49', potTop); lab.addWire('H:a47', 'H:j5'); } // (a knob's legs are 2 columns apart: 45, 47, 49)
  for (let f = 0; f < 6; f++) lab.step(1000 / 60); return lab;
}
const notes = (lab) => (lab.mcu.notes || []).map((n) => n.code || n.k || JSON.stringify(n).slice(0, 40));
const AH = 'from gpiozero import MCP3008\nimport time\nadc = MCP3008(channel=0)\n';
lab = adcBench(); lab.byTag('pot1').state.pos = 0.25; lab.stateV++;
r = run(lab, AH + 'print(adc.raw_value, round(adc.value, 2), round(adc.voltage, 2), adc.channel)\n');
let m = /(\d+) ([\d.]+) ([\d.]+) 0/.exec(r.out); ok(!r.err && m && Math.abs(+m[1] - 256) <= 3 && Math.abs(+m[3] - 0.83) < 0.03, `the knob at 1/4: raw_value ${m && m[1]}, value ${m && m[2]}, voltage ${m && m[3]} V (${code(r) || 'ok'})`);
lab.byTag('pot1').state.pos = 1; lab.stateV++; r = run(lab, AH + 'print(adc.raw_value)\n'); ok(/\b102[2-3]\b/.test(r.out), `the knob full: ${JSON.stringify(r.out.slice(-40))} ${code(r) || ''}`);
r = run(adcBench({ skip: ['dout'] }), AH + 'print(adc.raw_value)\n'); ok(/\n0\r?\n/.test(r.out) || / 0\s*$/.test(r.out) || /^\s*0\s*$/m.test(r.out), `DOUT not on GPIO 9: reads 0 ${JSON.stringify(r.out.slice(-20))}`);
lab = adcBench({ skip: ['cs'] }); r = run(lab, AH + 'print(adc.raw_value)\n'); ok(/^0\r?$/m.test(r.out.split('\n').slice(-2).join('\n')) || /\b0\s*\r?\n/.test(r.out), `CS not on CE0: reads 0`);
lab = adcBench({ skip: ['vdd'] }); r = run(lab, AH + 'print(adc.raw_value)\n'); ok(/\b0\s*\r?\n/.test(r.out), `no VDD: reads 0`);
lab = adcBench({ skip: ['vref'] }); r = run(lab, AH + 'print(adc.raw_value)\n'); ok(/\b1023\b/.test(r.out), `VREF not joined: every reading 1023 ${JSON.stringify(r.out.slice(-12))}`);
lab = adcBench({ pot: false }); r = run(lab, AH + 'a = [adc.raw_value for i in range(30)]\nprint(max(a) - min(a) > 20)\n'); ok(!r.err && /True/.test(r.out), `CH0 joined to nothing: the numbers wander (${code(r) || 'ok'})`);
lab = adcBench({ vdd: '5Vb' }); r = run(lab, AH + 'print(adc.raw_value)\n'); ok(!r.err && (lab.mcu.warned && lab.mcu.warned.has('adc5v')), `the chip on 5 V: a warning that DOUT puts 5 V on GPIO 9 (${[...(lab.mcu.warned || [])].join(',')})`);
r = run(adcBench(), 'from gpiozero import MCP3008\nadc = MCP3008(channel=8)\n'); ok(code(r) === 'N24_ADC_CH', `channel=8: SPIBadChannel (${code(r)})`);
r = run(adcBench(), 'from gpiozero import MCP3008\nadc = MCP3008(channel=0, device=1)\nprint(adc.raw_value)\n'); ok(!r.err && /\b0\s*\r?\n/.test(r.out), 'device=1 asks CE1 (GPIO 7), where the chip is not: 0');
lab = adcBench({ potTop: 'H:tp49' }); lab.byTag('pot1').state.pos = 0.9; lab.stateV++; r = run(lab, AH + 'print(adc.raw_value)\n'); ok(/\b1023\b/.test(r.out) && lab.mcu.warned.has('adcov0'), `the knob on 5 V turned up: 1023 and an over-voltage warning (${JSON.stringify(r.out.slice(-30))} ${[...lab.mcu.warned].join(',')})`);

// ------------------------------------------------------------ the Uno's HC-05 and the phone's BT Terminal (esp32.js Net)
function unoBT({ tx = true } = {}) {
  const lab = new Lab(); lab.setBoard('uno');
  for (const [a, b] of [['B:5V', 'H:tp30'], ['B:GND3', 'H:tn18'], ['H:tp2', 'H:bp2'], ['H:tn3', 'H:bn3']]) lab.addWire(a, b);
  lab.addPart('hc05', {}, { hole: 'j10' }, 0, 'bt'); lab.addPart('resistor', { ohms: 1000 }, { hole: 'f16' }, 0, 'rbt1'); lab.addPart('resistor', { ohms: 2200 }, { hole: 'h16' }, 2, 'rbt2');
  for (const [a, b] of [['H:i11', 'H:bp11'], ['H:i12', 'H:bn12'], ['H:i14', 'H:i16'], ...(tx ? [['B:D1', 'H:j20']] : [])]) lab.addWire(a, b);
  for (let f = 0; f < 6; f++) lab.step(1000 / 60); return lab;
}
const btLines = (lab) => netOf(lab).bt.log.filter((e) => !e.sys && !e.me).map((e) => e.text);
lab = unoBT(); let N = netOf(lab); ok(JSON.stringify(N.btDevices()) === '["HC-05"]', `the phone sees the HC-05 when it has power: ${JSON.stringify(N.btDevices())}`);
N.btConnect('HC-05'); r = run(lab, 'void setup() {\n  Serial.begin(9600);\n}\nvoid loop() {\n  Serial.println("Hello phone");\n  delay(500);\n}\n', 1.2);
ok(btLines(lab).includes('Hello phone') && lab.byTag('bt').state.paired, `Serial.println at 9600 reaches the phone through the divider: ${JSON.stringify(btLines(lab).slice(-2))}`);
r = run(lab, 'void setup() {\n  Serial.begin(9600);\n}\nvoid loop() {\n  Serial.println("Again");\n  delay(500);\n}\n', 1.2);
ok(N.bt.conn === 'HC-05' && btLines(lab).includes('Again'), 'Run again: the HC-05 keeps its link while the Uno restarts');
lab = unoBT(); N = netOf(lab); N.btConnect('HC-05'); r = run(lab, 'void setup() {\n  Serial.begin(115200);\n}\nvoid loop() {\n  Serial.println("Hello phone");\n  delay(500);\n}\n', 1.2);
ok(btLines(lab).length && !btLines(lab).includes('Hello phone'), `Serial.begin(115200): the HC-05 (9600) gives the phone rubbish: ${JSON.stringify(btLines(lab).slice(-1))}`);
lab = unoBT({ tx: false }); N = netOf(lab); N.btConnect('HC-05'); r = run(lab, 'void setup() {\n  Serial.begin(9600);\n}\nvoid loop() {\n  Serial.println("Hello phone");\n  delay(500);\n}\n', 1.2);
ok(!btLines(lab).length, 'pin 1 not wired to the divider: the phone hears nothing');

// ------------------------------------------------------------ the Class 11 machine sessions (lessons24.js), played as a student plays them
function build3(l) {
  const lab = new Lab(); const app = { lab, code: () => app.src, world: null, onStepDone() {}, onLessonComplete() {} }; app.src = l.code;
  const rt = new LessonRT(app); rt.open(l.id);
  const sim = makeScene(l.scene); app.world = { flag: (n) => sim.flag(n), val: (n) => sim.val(n), onRun: () => sim.onRun(lab) };
  for (const s of l.steps) {
    if (s.k === 'place') { const q = s.place; if (!lab.byTag(q.tag)) lab.addPart(q.type, q.props, q.at, q.rot, q.tag); }
    if (s.k === 'wire') { const g = rt.ghostWire(s.wire); if (!g) { ok(false, `${l.id}: a ghost wire for ${s.wire}`); continue; } lab.addWire(g[0], g[1]); if (!rt.conn(s.wire[0], s.wire[1])) ok(false, `${l.id}: wire ${s.wire} joins`); }
  }
  for (let f = 0; f < 60; f++) { lab.step(1000 / 60); sim.update(1 / 60, lab); }
  return { lab, app, rt, sim };
}
function play3(l, B, acts) {
  const { lab, app, rt, sim } = B; let src = l.code; let ser = ''; const dt = 1 / 60; let ai = 0;
  const start = (code) => { const c = compile(code, lab.def); if (!c.ok) throw new Error(JSON.stringify(c.errors)); app.src = code; lab.run(c); rt.onRun(code); };
  for (const s of l.steps) {
    if (s.k === 'check') { const r = rt.runCheck(); ok(!r, `${l.id}: the circuit check passes` + (r ? ': ' + JSON.stringify(r[0].en) : '')); }
    if (s.k === 'run') start(src);
    if (s.k === 'edit') { const e = s.set.reduce((x, [re, v]) => x.replace(re, v), src); ok(s.test(e) && !s.test(src), `${l.id}: the edit is what the step asks`); src = e; start(src); }
    if (s.k === 'act' || s.k === 'watch') {
      const act = acts[ai++]; let t = -1;
      for (let f = 0; f < 60 * 60; f++) { if (act) act(f * dt, sim, lab); lab.step(1000 * dt); sim.update(dt, lab); rt.update(dt); for (const o of lab.mcu.ser.take()) ser += String.fromCharCode(...o.bytes); if (lab.mcu.state === 'error') break; if (s.until(rt)) { t = f * dt; break; } }
      ok(t >= 0, `${l.id}: ${s.k} "${s.do.en.slice(0, 60)}" comes true` + (t >= 0 ? ` (${t.toFixed(1)} s)` : ` — timed out · ${JSON.stringify(sim.res)} flags ${[...sim.flags]} ${lab.mcu.err ? JSON.stringify(lab.mcu.err) : ''}`) + (t >= 0 && s.see && s.see.en ? ' · ' + s.see.en.slice(0, 120) : ''));
    }
  }
  ok(!!l.done(rt), `${l.id}: the lesson is complete (done)`);
  return ser;
}
const at = (...times) => { const done = new Set(); return (key) => (t, sim, lab) => { for (const T of times) if (!done.has(T) && t >= T) { done.add(T); sim.control(key, null, lab); } }; };
const L24 = LESSONS.filter((l) => ['wateratm', 'vending', 'tracker', 'lift', 'conveyor', 'slider', 'plotter', 'pickplace'].includes(l.id));
ok(L24.length === 8, `${L24.length} Class 11 machine lessons`);
for (const l of L24) {
  const c = compile(l.code); ok(c.ok, `${l.id}: the sketch compiles` + (c.ok ? '' : ' ' + JSON.stringify(c.errors).slice(0, 200)));
  for (const s of l.steps) for (const k of ['do', 'see']) if (s[k]) for (const lg of ['en', 'hi', 'hg']) if (typeof s[k][lg] !== 'string') ok(false, `${l.id}: step ${s.k} has ${k}.${lg}`);
}
{ const l = L24.find((x) => x.id === 'wateratm'); const B = build3(l);
  const ser = play3(l, B, [at(1)('card'), at(1)('card'), at(1, 14)('tag')]);
  ok(B.sim.res.glasses[0] > 100 && B.sim.res.glasses[0] < 160 && /Balance: 8/.test(ser), `wateratm: 4 s gives about 130 mL (${B.sim.res.glasses.join(', ')} mL) and the white card goes 10 → 8`);
  // the mistakes: the relay's S on pin 5 -> the check names it, and no glass is ever poured
  const lab = new Lab(); const app = { lab, code: () => l.code, world: null, onStepDone() {}, onLessonComplete() {} }; const rt = new LessonRT(app); rt.open(l.id);
  for (const s of l.steps) if (s.k === 'wire') { const w = s.wire[1] === 'D4' ? [s.wire[0], 'D5'] : s.wire; const g = rt.ghostWire(w); if (g) lab.addWire(g[0], g[1]); }
  const r = rt.runCheck(); ok(!!r && /pin/.test(r[0].en), `wateratm: the relay on pin 5 is named by the check: "${r && r[0].en.slice(0, 60)}"`);
}
{ const l = L24.find((x) => x.id === 'vending'); const B = build3(l);
  const keys = (...ks) => { const T = ks.map((k, i) => [2.5 + i * 0.4 + (ks.slice(0, i).filter((x) => x === '#').length) * 9, k]); const done = new Set(); return (t, sim, lab) => { for (const [at, k] of T) if (!done.has(at) && t >= at) { done.add(at); sim.press(lab, k); } }; };
  play3(l, B, [keys('3', '#'), keys('3', '#'), keys('6', '#', '1', '#'), keys('6', '#', '1', '#')]);
  ok(B.sim.res.jamAt > 100 && B.sim.res.jamAt < 110, `vending: 300 steps a compartment stop item 3 at ${B.sim.res.jamAt}° (between doors); moves ${B.sim.res.moves.map((d) => Math.round(d)).join(', ')}`);
}
{ const l = L24.find((x) => x.id === 'lift'); const B = build3(l);
  const calls = (...fs) => { const done = new Set(); return (t, sim) => fs.forEach(([at, f]) => { if (!done.has(at) && t >= at) { done.add(at); sim.control('call', String(f)); } }); };
  play3(l, B, [calls([0.5, 1]), null, calls([0.5, 2], [9, 1])]);
  ok(Math.abs(B.sim.res.between - 85) < 3, `lift: without homing, floor 1 stops at ${B.sim.res.between} mm; with it, the stops are ${B.sim.res.stops.join(', ')} mm`);
}
{ const l = L24.find((x) => x.id === 'tracker'); const B = build3(l);
  play3(l, B, [null, null, null, null, (t, sim) => { if (t < 0.05) sim.control('day', '1'); }]);
  ok(B.sim.res.gain > 10 && B.sim.res.maxErr < 12, `tracker: the day followed (never more than ${B.sim.res.maxErr}° off), ${B.sim.res.gain} % more energy than the fixed panel; it ran away to pan ${B.sim.res.runawayAt}° first`);
}
{ const l = L24.find((x) => x.id === 'conveyor'); const B = build3(l);
  const ser = play3(l, B, [null, null, null]); const R = B.sim.res;
  ok(R.passed.slice(-3).every((n) => n === 1) && R.offs.slice(-3).every((o) => Math.abs(o) <= 4), `conveyor: once each, in the middle (${R.offs.slice(-3).join(', ')} mm), ${R.rate} boxes a minute; the first fix-less box had ${JSON.stringify(R.multi)} · serial ${JSON.stringify(ser.slice(-60))}`);
}
{ const l = L24.find((x) => x.id === 'slider'); const B = build3(l);
  const ser = play3(l, B, [null, null, null]); const R = B.sim.res;
  ok(R.sharpN === 12 && Math.abs(R.end - 180) < 2 && /Photo 11 at 165 mm/.test(ser), `slider: 12 sharp photos to ${R.end} mm (${R.photos.map((p) => p.blur).join(', ')} mm of blur) · ${JSON.stringify(ser.slice(-40))}`);
}
{ const l = L24.find((x) => x.id === 'plotter'); const B = build3(l);
  play3(l, B, [null, null, null]); const R = B.sim.res;
  ok(R.roofDev <= 2 && R.stray <= 5 && R.cover >= 95, `plotter: the house drawn clean (${JSON.stringify(R)})`);
}
{ const l = L24.find((x) => x.id === 'pickplace'); const B = build3(l);
  const ser = play3(l, B, [null, null, null]); const R = B.sim.res;
  ok(R.placed >= 3 && !R.dropped && !R.dents, `pickplace: ${R.placed} boxes in the crate, none dropped or dented · ${JSON.stringify(ser.slice(-30))}`);
}
// the arm draws a square (lessons24.js armsquare, robots.js ArmSim level 6): played with the arm fed the servos' angles
{ const l = LESSONS.find((x) => x.id === 'armsquare'); ok(!!l && compile(l.code).ok, 'armsquare: the sketch compiles');
  const lab = new Lab(); const app = { lab, code: () => app.src, world: null, onStepDone() {}, onLessonComplete() {} }; app.src = l.code; const rt = new LessonRT(app); rt.open(l.id);
  const sim = new ArmSim(6); app.world = { flag: (n) => sim.flags.has(n), val: (n) => sim[n], onRun: () => sim.reset() }; const tags = ['svB', 'svS', 'svE', 'svG'];
  const tick = () => { const a = {}; ['b', 's', 'e', 'g'].forEach((k, i) => { const p = lab.byTag(tags[i]); a[k] = p ? p.state.angle : 90; }); sim.update(1 / 60, a); const g = lab.byTag('svG'); if (g) g.state.limit = sim.limit; };
  for (let f = 0; f < 30; f++) { lab.step(1000 / 60); tick(); }
  let src = l.code; const start = (code) => { const c = compile(code, lab.def); app.src = code; lab.run(c); rt.onRun(code); }; const seen = [];
  for (const s of l.steps) {
    if (s.k === 'run') start(src);
    if (s.k === 'edit') { const e = s.set.reduce((x, [re, v]) => x.replace(re, v), src); ok(s.test(e) && !s.test(src), `armsquare: the edit is what the step asks`); src = e; start(src); }
    if (s.k === 'act') { let t = -1; for (let f = 0; f < 60 * 30; f++) { lab.step(1000 / 60); tick(); rt.update(1 / 60); if (lab.mcu.state === 'error') break; if (s.until(rt)) { t = f / 60; break; } }
      ok(t >= 0, `armsquare: act "${s.do.en.slice(0, 50)}" comes true` + (t >= 0 ? ` (${t.toFixed(1)} s) · ${s.see.en.slice(0, 110)}` : ` — timed out ${JSON.stringify(sim.res)} ${[...sim.flags]}`)); seen.push(JSON.stringify(sim.res)); }
  }
  ok(!!l.done(rt) && sim.res.dev <= 3 && sim.res.cover >= 95, `armsquare: complete; radians drew at ${seen[0]}, the joint moves ${seen[1]}, the linear moves ${seen[2]}`);
}
// the PID line follower (lessons24.js pidline, robots.js CarSim 'pid'): the car on the line track, its five sensors fed
{ const l = LESSONS.find((x) => x.id === 'pidline'); ok(!!l && compile(l.code).ok, 'pidline: the sketch compiles');
  const lab = new Lab(); const app = { lab, code: () => app.src, world: null, onStepDone() {}, onLessonComplete() {} }; app.src = l.code; const rt = new LessonRT(app); rt.open(l.id);
  const sim = new CarSim('pid'); app.world = { flag: (n) => sim.flags.has(n), val: (n) => sim[n], onRun: () => { sim.reset(); carFeed(sim, lab); } };
  for (const s of l.steps) { if (s.k === 'place') { const q = s.place; lab.addPart(q.type, q.props, q.at, q.rot, q.tag); } if (s.k === 'wire') { const g = rt.ghostWire(s.wire); if (!g) { ok(false, `pidline: a ghost wire for ${s.wire}`); continue; } lab.addWire(g[0], g[1]); } }
  const w = (t) => { const p = lab.byTag(t); return p ? p.state.w / BO.gear * BO.rw : 0; };
  for (let f = 0; f < 20; f++) lab.step(1000 / 60);
  let src = l.code; const start = (code) => { const c = compile(code, lab.def); app.src = code; lab.run(c); rt.onRun(code); }; const seen = [];
  for (const s of l.steps) {
    if (s.k === 'check') { const r = rt.runCheck(); ok(!r, 'pidline: the circuit check passes' + (r ? ': ' + JSON.stringify(r[0].en) : '')); }
    if (s.k === 'run') start(src);
    if (s.k === 'edit') { const e = s.set.reduce((x, [re, v]) => x.replace(re, v), src); ok(s.test(e) && !s.test(src), 'pidline: the edit is what the step asks'); src = e; start(src); }
    if (s.k === 'act') { let t = -1; for (let f = 0; f < 60 * 40; f++) { lab.step(1000 / 60); sim.update(1 / 60, w('mL'), w('mR')); carFeed(sim, lab); rt.update(1 / 60); if (lab.mcu.state === 'error') break; if (s.until(rt)) { t = f / 60; break; } }
      ok(t >= 0, `pidline: act "${s.do.en.slice(0, 50)}" comes true` + (t >= 0 ? ` (${t.toFixed(1)} s) · ${s.see.en.slice(0, 130)}` : ` — timed out ${JSON.stringify(sim.lap)} ${[...sim.flags]}`)); seen.push(JSON.stringify(sim.lap)); }
  }
  ok(!!l.done(rt) && sim.lap.last < 7, `pidline: complete; laps ${seen.join(' | ')}`);
}
// the sumo robot (lessons24.js sumo, robots.js CarSim 'sumo'): the car in the ring against the practice dummy
{ const l = LESSONS.find((x) => x.id === 'sumo'); ok(!!l && compile(l.code).ok, 'sumo: the sketch compiles');
  const lab = new Lab(); const app = { lab, code: () => app.src, world: null, onStepDone() {}, onLessonComplete() {} }; app.src = l.code; const rt = new LessonRT(app); rt.open(l.id);
  const sim = new CarSim('sumo'); app.world = { flag: (n) => sim.flags.has(n), val: (n) => sim[n], onRun: () => { sim.reset(); for (const t of ['mL', 'mR']) lab.byTag(t).state.w = 0; carFeed(sim, lab); } }; // (as worlds.js: back on the start, wheels still)
  for (const s of l.steps) { if (s.k === 'place') { const q = s.place; if (!lab.addPart(q.type, q.props, q.at, q.rot, q.tag)) ok(false, 'sumo: place ' + q.tag); } if (s.k === 'wire') { const g = rt.ghostWire(s.wire); if (!g) { ok(false, `sumo: a ghost wire for ${s.wire}`); continue; } lab.addWire(g[0], g[1]); } }
  const w = (t) => { const p = lab.byTag(t); return p ? p.state.w / BO.gear * BO.rw : 0; };
  for (let f = 0; f < 20; f++) lab.step(1000 / 60);
  let src = l.code; const start = (code) => { const c = compile(code, lab.def); app.src = code; lab.run(c); rt.onRun(code); }; const seen = [];
  for (const s of l.steps) {
    if (s.k === 'check') { const r = rt.runCheck(); ok(!r, 'sumo: the circuit check passes' + (r ? ': ' + JSON.stringify(r[0].en) : '')); }
    if (s.k === 'run') start(src);
    if (s.k === 'edit') { const e = s.set.reduce((x, [re, v]) => x.replace(re, v), src); ok(s.test(e) && !s.test(src) && compile(e).ok, 'sumo: the edit is what the step asks'); src = e; start(src); }
    if (s.k === 'act') { let t = -1; for (let f = 0; f < 60 * 40; f++) { lab.step(1000 / 60); sim.update(1 / 60, w('mL'), w('mR')); carFeed(sim, lab); rt.update(1 / 60); if (lab.mcu.state === 'error') break; if (s.until(rt)) { t = f / 60; break; } }
      ok(t >= 0, `sumo: act "${s.do.en.slice(0, 40)}" comes true` + (t >= 0 ? ` (${t.toFixed(1)} s)` : ` — timed out ${JSON.stringify({ x: Math.round(sim.x), z: Math.round(sim.z), foe: sim.foe })} ${[...sim.flags]} ${lab.mcu.err ? JSON.stringify(lab.mcu.err) : ''}`)); seen.push([...sim.flags].join(',')); }
  }
  ok(!!l.done(rt) && !sim.flags.has('out') && !sim.flags.has('early'), `sumo: complete; flags ${seen.join(' | ')}`);
}

// the wall-following robot (lessons24.js wallp, robots.js CarSim 'wallp'): the car in the room with the steel almirah
{ const l = LESSONS.find((x) => x.id === 'wallp'); ok(!!l && compile(l.code).ok, 'wallp: the sketch compiles');
  const lab = new Lab(); const app = { lab, code: () => app.src, world: null, onStepDone() {}, onLessonComplete() {} }; app.src = l.code; const rt = new LessonRT(app); rt.open(l.id);
  const sim = new CarSim('wallp'); app.world = { flag: (n) => sim.flags.has(n), val: (n) => sim[n], onRun: () => { sim.reset(); for (const t of ['mL', 'mR']) lab.byTag(t).state.w = 0; carFeed(sim, lab); } };
  for (const s of l.steps) { if (s.k === 'place') { const q = s.place; if (!lab.addPart(q.type, q.props, q.at, q.rot, q.tag)) ok(false, 'wallp: place ' + q.tag); } if (s.k === 'wire') { const g = rt.ghostWire(s.wire); if (!g) { ok(false, `wallp: a ghost wire for ${s.wire}`); continue; } lab.addWire(g[0], g[1]); } }
  const w = (t) => { const p = lab.byTag(t); return p ? p.state.w / BO.gear * BO.rw : 0; };
  for (let f = 0; f < 20; f++) lab.step(1000 / 60);
  let src = l.code; const start = (code) => { const c = compile(code, lab.def); app.src = code; lab.run(c); rt.onRun(code); }; const seen = [];
  for (const s of l.steps) {
    if (s.k === 'check') { const r = rt.runCheck(); ok(!r, 'wallp: the circuit check passes' + (r ? ': ' + JSON.stringify(r[0].en) : '')); }
    if (s.k === 'run') start(src);
    if (s.k === 'edit') { const e = s.set.reduce((x, [re, v]) => x.replace(re, v), src); ok(s.test(e) && !s.test(src) && compile(e).ok, 'wallp: the edit is what the step asks'); src = e; start(src); }
    if (s.k === 'act') { let t = -1; for (let f = 0; f < 60 * 45; f++) { lab.step(1000 / 60); sim.update(1 / 60, w('mL'), w('mR')); carFeed(sim, lab); rt.update(1 / 60); if (lab.mcu.state === 'error') break; if (s.until(rt)) { t = f / 60; break; } }
      ok(t >= 0, `wallp: act "${s.do.en.slice(0, 40)}" comes true` + (t >= 0 ? ` (${t.toFixed(1)} s) · ${String(s.see.en).slice(0, 90)}` : ` — timed out ${JSON.stringify({ x: Math.round(sim.x), z: Math.round(sim.z) })} ${[...sim.flags]} ${lab.mcu.err ? JSON.stringify(lab.mcu.err) : ''}`)); seen.push(`swing ${sim.swingRate} whip ${sim.whip} lap ${sim.lapT} bumps ${sim.bumps}`); }
  }
  ok(!!l.done(rt) && sim.lapBumps === 0 && sim.whip < 100, `wallp: complete; ${seen.join(' | ')}`);
}

// the WiFi car (lessons24.js wificar; robots.js CAR_CFG.wifi, wifiCheck; esp32.js Net.switchBack): the ESP32's own WiFi,
// the phone's web joystick (requests as the page's ontouchstart / ontouchend send them), Android leaving a WiFi with no internet
{ const l = LESSONS.find((x) => x.id === 'wificar');
  const lab = new Lab(); const app = { lab, code: () => app.src, world: null, onStepDone() {}, onLessonComplete() {} }; app.src = l.code; const rt = new LessonRT(app); rt.open(l.id);
  ok(lab.def.id === 'esp32' && compile(l.code, lab.def).ok, 'wificar: an ESP32 lesson, the sketch compiles');
  const sim = new CarSim('wifi'); app.world = { flag: (n) => sim.flags.has(n), val: (n) => sim[n], onRun: () => { sim.reset(); for (const t of ['mL', 'mR']) lab.byTag(t).state.w = 0; } };
  for (const s of l.steps) if (s.k === 'wire') { const g = rt.ghostWire(s.wire); if (!g) { ok(false, `wificar: a ghost wire for ${s.wire}`); continue; } lab.addWire(g[0], g[1]); }
  const N = netOf(lab); const w = (t) => { const p = lab.byTag(t); return p ? p.state.w / BO.gear * BO.rw : 0; };
  const go = (d) => N.request('http://192.168.4.1/go?d=' + d, () => {}); const join = () => N.join('DUET-Car', 'robocar123'); const page = () => N.request('http://192.168.4.1/', () => {});
  const park = sim.cfg.park; let cmd = 'S', nextT = 0;
  const steer = (t, X, Z, stopIn) => { if (t < nextT) return; nextT = t + 0.15; const dx = X - sim.x, dz = Z - sim.z; const inside = stopIn && Math.abs(dx) < park[2] / 2 - 60 && Math.abs(dz) < park[3] / 2 - 60; // (a student driving)
    let want = 'S'; if (!inside) { let e = Math.atan2(dx, dz) - sim.h; e = Math.atan2(Math.sin(e), Math.cos(e)); want = Math.abs(e) > 0.25 ? (e > 0 ? 'L' : 'R') : stopIn ? 'F' : 'S'; } if (want !== cmd) { cmd = want; go(want); } return want === 'S'; };
  const toP = (t) => steer(t, park[0], park[1], true);
  let aimed = false; const aim = (t) => { if (!aimed) { const far = sim.x < 0 ? [700, 0] : [-700, 0]; if (steer(t, far[0], far[1], false)) { aimed = true; cmd = 'F'; go('F'); } } }; // (turn to face the far side, then hold ▲)
  const ACT = [ // per act, a timed list of the student's taps
    [[0.5, join]], [[0.3, page]], [[0.2, () => go('F')], [1.0, () => go('S')], [1.4, () => go('L')], [1.8, () => go('S')]],
    [[0.05, () => go('S')], [0.2, 'aim'], [6, () => go('S')]],
    [[0.3, join], [0.6, page], [5.6, 'aim'], [12.0, () => go('S')]],
    [[0.3, join], [0.5, () => { N.noNet.stay = true; }], [0.8, page], [1.0, null]] ];
  for (let f = 0; f < 20; f++) lab.step(1000 / 60);
  let src = l.code, ai = 0; const start = (code) => { const c = compile(code, lab.def); app.src = code; lab.run(c); rt.onRun(code); }; const seen = [];
  for (const s of l.steps) {
    if (s.k === 'check') { const r = rt.runCheck(); ok(!r, 'wificar: the circuit check passes' + (r ? ': ' + JSON.stringify(r[0].en) : '')); }
    if (s.k === 'run') start(src);
    if (s.k === 'edit') { const e = s.set.reduce((x, [re, v]) => x.replace(re, v), src); ok(s.test(e) && !s.test(src) && compile(e, lab.def).ok, 'wificar: the edit is what the step asks'); src = e; start(src); }
    if (s.k === 'act') { const list = ACT[ai++] || []; const done = new Set(); let t = -1; const last = ai === ACT.length; cmd = 'S'; nextT = 0;
      aimed = false; let aiming = false; for (let f = 0; f < 60 * 40; f++) { const tt = f / 60; list.forEach(([at, fn], i) => { if (tt >= at && !done.has(i)) { done.add(i); if (fn === 'aim') aiming = true; else if (fn) fn(); } }); if (aiming) aim(tt); if (last && tt > 1.2) toP(tt);
        lab.step(1000 / 60); sim.update(1 / 60, w('mL'), w('mR')); wifiCheck(sim, N, 1 / 60); rt.update(1 / 60); if (lab.mcu.state === 'error') break; if (s.until(rt)) { t = tt; break; } }
      ok(t >= 0, `wificar: act "${s.do.en.slice(0, 44)}" comes true` + (t >= 0 ? ` (${t.toFixed(1)} s)` : ` — timed out ${JSON.stringify({ x: Math.round(sim.x), z: Math.round(sim.z), wifi: N.phone.wifi })} ${[...sim.flags]} ${lab.mcu.err ? JSON.stringify(lab.mcu.err) : ''}`)); seen.push([...sim.flags].filter((k) => /switch|runaway|safe|park|bump/.test(k)).join(',') + (sim.stopMm !== null ? ` stop ${sim.stopMm} mm` : '')); }
  }
  ok(!!l.done(rt), `wificar: complete; ${seen.join(' | ')}`);
}

// robot soccer (lessons24.js soccer, robots.js CarSim.soccer): the Bluetooth car with a V-scoop and a tennis ball on the pitch
{ const l = LESSONS.find((x) => x.id === 'soccer');
  const lab = new Lab(); const app = { lab, code: () => app.src, world: null, onStepDone() {}, onLessonComplete() {} }; app.src = l.code; const rt = new LessonRT(app); rt.open(l.id);
  ok(compile(l.code, lab.def).ok, 'soccer: the sketch compiles');
  const sim = new CarSim('soccer'); app.world = { flag: (n) => sim.flags.has(n), val: (n) => sim[n], onRun: () => { sim.reset(); for (const t of ['mL', 'mR']) lab.byTag(t).state.w = 0; } };
  const w = (t) => { const p = lab.byTag(t); return p ? p.state.w / BO.gear * BO.rw : 0; };
  const ang = (X, Z) => { const e = Math.atan2(X - sim.x, Z - sim.z) - sim.h; return Math.atan2(Math.sin(e), Math.cos(e)); };
  const toBall = () => { const B = sim.ball; const e = ang(B.x, B.z); return Math.abs(e) > 0.3 ? (e > 0 ? 'L' : 'R') : 'F'; };
  const DRV = [() => 'S', () => 'F', () => (sim.ball.held ? (sim.t - sim.ball.heldT > 0.5 ? 'R' : 'F') : toBall()), () => { if (sim.flags.has('goal')) return 'S'; if (!sim.ball.held) return toBall(); const e = ang(1200, 0); return Math.abs(e) > 0.15 ? (e > 0 ? 'L' : 'R') : 'F'; }];
  for (let f = 0; f < 20; f++) lab.step(1000 / 60);
  let src = l.code, ai = 0; const start = (code) => { const c = compile(code, lab.def); app.src = code; lab.run(c); rt.onRun(code); }; const seen = [];
  for (const s of l.steps) {
    if (s.k === 'check') { const r = rt.runCheck(); ok(!r, 'soccer: the circuit check passes' + (r ? ': ' + JSON.stringify(r[0].en) : '')); }
    if (s.k === 'run') start(src);
    if (s.k === 'edit') { const e = s.set.reduce((x, [re, v]) => x.replace(re, v), src); ok(s.test(e) && !s.test(src) && compile(e).ok, 'soccer: the edit is what the step asks'); src = e; start(src); }
    if (s.k === 'act') { const drv = DRV[ai++]; let cmd = 'S', t = -1;
      for (let f = 0; f < 60 * 40; f++) { const tt = f / 60; if (ai === 1 && tt > 0.3) { const b = lab.byTag('bt'); if (!b.state.paired) { b.state.paired = true; lab.stateV++; } } // (the panel's Connect)
        if (ai > 1 && tt > 0.3) { const k = drv(); if (k !== cmd) { cmd = k; const r = lab.btSend(k); if (r !== 'ok') { ok(false, `soccer: send ${k}: ${r}`); break; } } }
        lab.step(1000 / 60); sim.update(1 / 60, w('mL'), w('mR')); rt.update(1 / 60); if (lab.mcu.state === 'error') break; if (s.until(rt)) { t = tt; break; } }
      if (cmd !== 'S') lab.btSend('S');
      ok(t >= 0, `soccer: act "${s.do.en.slice(0, 44)}" comes true` + (t >= 0 ? ` (${t.toFixed(1)} s)` : ` — timed out ${JSON.stringify({ x: Math.round(sim.x), z: Math.round(sim.z), ball: [Math.round(sim.ball.x), Math.round(sim.ball.z)] })} ${[...sim.flags]}`)); seen.push(`${[...sim.flags].filter((k) => /kick|held|lost|goal/.test(k)).join(',')} shot ${sim.shotV}`); }
  }
  ok(!!l.done(rt) && sim.lostN === 0 && sim.own === 0, `soccer: complete; ${seen.join(' | ')}`);
}

// the gesture car (lessons24.js gesturecar, robots.js handPose / gestureCheck): the MPU-6050 on a glove; v0 compares with 0 and
// the hand's sway makes it shudder (jitter), the dead zone stops it (handStop), then the hand parks it in P
{ const l = LESSONS.find((x) => x.id === 'gesturecar');
  const lab = new Lab(); const app = { lab, code: () => app.src, world: null, onStepDone() {}, onLessonComplete() {} }; app.src = l.code; const rt = new LessonRT(app); rt.open(l.id);
  ok(compile(l.code, lab.def).ok, 'gesture: the sketch compiles');
  const sim = new CarSim('gesture'); app.world = { flag: (n) => sim.flags.has(n), val: (n) => sim[n], onRun: () => { sim.reset(); for (const t of ['mL', 'mR']) lab.byTag(t).state.w = 0; carFeed(sim, lab); } };
  const w = (t) => { const p = lab.byTag(t); return p ? p.state.w / BO.gear * BO.rw : 0; };
  const ang = (X, Z) => { const e = Math.atan2(X - sim.x, Z - sim.z) - sim.h; return Math.atan2(Math.sin(e), Math.cos(e)); };
  const inBox = () => { const [x, z] = sim.world(0, CARG.bodyZ * 0.6); return Math.abs(x - 380) < 50 && Math.abs(z - 20) < 60; };
  // a person parking: turns while far off, then lets go and taps (0.2 s) until the nose points at the box, then drives
  let leg = 0, tap = 0; const park = () => { if (inBox()) return 'S'; const T = leg === 0 ? [380, 330] : [380, 20]; if (leg === 0 && Math.hypot(sim.x - 380, sim.z - 330) < 60) leg = 1; const e = ang(...T); const k = e > 0 ? 'L' : 'R';
    if (Math.abs(e) > 0.6) return k; if (Math.abs(e) > 0.12) { tap = (tap + 1) % 40; return tap < 12 ? k : 'S'; } tap = 0; return 'F'; };
  const DRV = [() => 'F', () => 'S', () => (sim.handD < 450 ? 'F' : 'S'), park];
  for (let f = 0; f < 20; f++) lab.step(1000 / 60);
  let src = l.code, ai = 0; const start = (code) => { const c = compile(code, lab.def); app.src = code; lab.run(c); rt.onRun(code); }; const seen = [];
  for (const s of l.steps) {
    if (s.k === 'wire') { const g = rt.ghostWire(s.wire); if (!g) { ok(false, `gesture: a ghost wire for ${s.wire}`); continue; } lab.addWire(g[0], g[1]); if (!rt.conn(s.wire[0], s.wire[1])) ok(false, `gesture: wire ${s.wire} joins`); }
    if (s.k === 'check') { const r = rt.runCheck(); ok(!r, 'gesture: the circuit check passes' + (r ? ': ' + JSON.stringify(r[0].en) : '')); }
    if (s.k === 'run') start(src);
    if (s.k === 'edit') { const e = s.set.reduce((x, [re, v]) => x.replace(re, v), src); ok(s.test(e) && !s.test(src) && compile(e).ok, 'gesture: the edit is what the step asks'); src = e; start(src); }
    if (s.k === 'act') { const drv = DRV[ai++]; let t = -1; const t0 = sim.t;
      for (let f = 0; f < 60 * 40; f++) { const tt = f / 60; sim.handKey = sim.t > 3 ? drv() : 'S';
        lab.step(1000 / 60); sim.update(1 / 60, w('mL'), w('mR')); carFeed(sim, lab); rt.update(1 / 60); if (lab.mcu.state === 'error') break; if (s.until(rt)) { t = tt; break; } }
      sim.handKey = 'S';
      ok(t >= 0, `gesture: act "${s.do.en.slice(0, 44)}" comes true` + (t >= 0 ? ` (${t.toFixed(1)} s)` : ` — timed out ${JSON.stringify({ x: Math.round(sim.x), z: Math.round(sim.z), h: Math.round(sim.h * 57.3), t: +(sim.t - t0).toFixed(1) })} ${[...sim.flags]}`)); seen.push([...sim.flags].filter((k) => /jitter|nostop|handStop|parked/.test(k)).join(',')); }
  }
  ok(!!l.done(rt), `gesture: complete; ${seen.join(' | ')}`);
}

// the weather station on the cloud (lessons24.js wxcloud; esp32.js HTTPRT, Net.cloudCall, the phone's thingspeak.com page):
// every 2 s is mostly answered 0 (15 s rule), the rain gauge on GPIO 26 (ADC2) reads 0 with WiFi on, GPIO 34 reads it
{ const l = LESSONS.find((x) => x.id === 'wxcloud');
  const lab = new Lab(); const app = { lab, code: () => app.src, world: null, onStepDone() {}, onLessonComplete() {} }; app.src = l.code; const rt = new LessonRT(app); rt.open(l.id);
  ok(lab.def.id === 'esp32' && compile(l.code, lab.def).ok, 'wxcloud: an ESP32 lesson, the sketch compiles');
  const N = netOf(lab); let page = null; const view = () => N.request('http://thingspeak.com/channels/2468013', (r) => { page = r; });
  const ACT = [[[0.5, view]], [[0.3, () => { lab.byTag('wl').state.depth = 25; lab.stateV++; }]], [], [[0.3, () => { set26(lab, lab.byTag('bmp'), 'wx', -25); }]]];
  for (let f = 0; f < 20; f++) lab.step(1000 / 60);
  let src = l.code, ai = 0; const start = (code) => { const c = compile(code, lab.def); app.src = code; lab.run(c); rt.onRun(code); }; const seen = [];
  for (const s of l.steps) {
    if (s.k === 'wire') { const w0 = lab.wires.find((w) => [w.a, w.b].includes('H:a10')); if (w0) lab.removeWire(w0); else ok(false, 'wxcloud: the wire to GPIO 26 is there'); const g = rt.ghostWire(s.wire); lab.addWire(g[0], g[1]); ok(rt.conn('wl.S', 'D34') && !rt.conn('wl.S', 'D26'), 'wxcloud: S moved to GPIO 34'); }
    if (s.k === 'check') { const r = rt.runCheck(); ok(!r, 'wxcloud: the circuit check passes' + (r ? ': ' + JSON.stringify(r[0].en) : '')); }
    if (s.k === 'run') start(src);
    if (s.k === 'edit') { const e = s.set.reduce((x, [re, v]) => x.replace(re, v), src); ok(s.test(e) && !s.test(src) && compile(e, lab.def).ok, 'wxcloud: the edit is what the step asks'); src = e; start(src); }
    if (s.k === 'act') { const list = ACT[ai++] || []; const done = new Set(); let t = -1;
      for (let f = 0; f < 60 * 80; f++) { const tt = f / 60; list.forEach(([at, fn], i) => { if (tt >= at && !done.has(i)) { done.add(i); fn(); } }); if (ai === 1 && page && tt > 1 && f % 900 === 0) view();
        lab.step(1000 / 60); rt.update(1 / 60); if (lab.mcu.state === 'error') break; if (s.until(rt)) { t = tt; break; } }
      const C = N.cloud || { entries: [], log: [] }; const e = C.entries[C.entries.length - 1];
      ok(t >= 0, `wxcloud: act "${s.do.en.slice(0, 44)}" comes true` + (t >= 0 ? ` (${t.toFixed(1)} s)` : ` — timed out ${JSON.stringify({ entries: C.entries.length, last: e && e.f, calls: (C.log || []).length, err: lab.mcu.err })}`)); seen.push(e ? `#${C.entries.length} ${JSON.stringify(e.f)}` : '-'); }
  }
  const C = N.cloud; ok(!!l.done(rt) && page && page.code === 200 && /DUET School Weather/.test(page.body) && /<svg/.test(page.body), `wxcloud: complete, the channel page shows charts; ${seen.join(' | ')}`);
  const zeros = C.log.filter((c) => !c.ok).length; ok(zeros >= 3, `wxcloud: early updates answered 0 (${zeros} of ${C.log.length})`);
}

// the bionic hand (lessons24.js bionichand; parts29.js flexglove, robohand; cpp.js Servo arrays): map(0, 1023) hardly moves
// it (the glove gives 290 straight, 95 bent), calibrated it closes but the reversed thumb opens, mirrored it makes a fist
{ const l = LESSONS.find((x) => x.id === 'bionichand');
  const lab = new Lab(); const app = { lab, code: () => app.src, world: null, onStepDone() {}, onLessonComplete() {} }; app.src = l.code; const rt = new LessonRT(app); rt.open(l.id);
  ok(compile(l.code, lab.def).ok, 'hand: the sketch (a Servo array) compiles');
  const G = ['fist', 'fist', 'fist', 'peace']; let ai = 0, src = l.code; const seen = [];
  for (let f = 0; f < 20; f++) lab.step(1000 / 60);
  const start = (code) => { const c = compile(code, lab.def); app.src = code; lab.run(c); rt.onRun(code); };
  for (const s of l.steps) {
    if (s.k === 'wire') { const g = rt.ghostWire(s.wire); if (!g) { ok(false, `hand: a ghost wire for ${s.wire}`); continue; } lab.addWire(g[0], g[1]); if (!rt.conn(s.wire[0], s.wire[1])) ok(false, `hand: wire ${s.wire} joins`); }
    if (s.k === 'check') { const r = rt.runCheck(); ok(!r, 'hand: the circuit check passes' + (r ? ': ' + JSON.stringify(r[0].en) : '')); }
    if (s.k === 'run') start(src);
    if (s.k === 'edit') { const e = s.set.reduce((x, [re, v]) => x.replace(re, v), src); ok(s.test(e) && !s.test(src) && compile(e, lab.def).ok, 'hand: the edit is what the step asks'); src = e; start(src); }
    if (s.k === 'act') { const g = G[ai++]; let t = -1; const glove = lab.byTag('glove'); if (ai === 1) set29(lab, glove, 'gesture', 'open');
      for (let f = 0; f < 60 * 10; f++) { if (f === 30) set29(lab, glove, 'gesture', g); lab.step(1000 / 60); rt.update(1 / 60); if (lab.mcu.state === 'error') break; if (f > 30 && s.until(rt)) { t = f / 60; break; } }
      const h = lab.byTag('hand'); seen.push(`${g}: ${curlOf(h).map((a) => Math.round(a)).join('/')}`);
      ok(t >= 0, `hand: act "${s.do.en.slice(0, 40)}" comes true` + (t >= 0 ? ` (${t.toFixed(1)} s)` : ` — timed out ${seen[seen.length - 1]} ${JSON.stringify(h.state.target)} ${lab.mcu.err ? JSON.stringify(lab.mcu.err) : ''}`)); }
  }
  ok(!!l.done(rt), `hand: complete; ${seen.join(' | ')}`);
  // no common ground: the servos only twitch
  const w = lab.wires.find((x) => [x.a, x.b].some((e) => /^H:[a-e]55$/.test(e)) && [x.a, x.b].some((e) => e.startsWith('H:tn')));
  if (w) { lab.removeWire(w); for (let f = 0; f < 30; f++) lab.step(1000 / 60); ok(lab.byTag('hand').state.noRef === true, 'hand: without the common ground the hand knows it has no reference'); } else ok(false, 'hand: the common-ground wire is found');
}

// the self-balancing robot (lessons24.js balancebot, robots.js balanceStep): Kp 10 falls; Kp 40 wobbles and falls; Kd 1.5
// stands but runs away; setpoint −2 stays
{ const l = LESSONS.find((x) => x.id === 'balancebot');
  const lab = new Lab(); const app = { lab, code: () => app.src, world: null, onStepDone() {}, onLessonComplete() {} }; app.src = l.code; const rt = new LessonRT(app); rt.open(l.id);
  ok(compile(l.code, lab.def).ok, 'balance: the sketch compiles');
  const sim = new CarSim('balance'); app.world = { flag: (n) => sim.flags.has(n), val: (n) => sim[n], onRun: () => { sim.reset(); for (const t of ['mL', 'mR']) lab.byTag(t).state.w = 0; carFeed(sim, lab); } };
  const w = (t) => { const p = lab.byTag(t); return p ? p.state.w / BO.gear * BO.rw : 0; };
  for (let f = 0; f < 20; f++) lab.step(1000 / 60);
  let src = l.code; const start = (code) => { const c = compile(code, lab.def); app.src = code; lab.run(c); rt.onRun(code); }; const seen = [];
  for (const s of l.steps) {
    if (s.k === 'check') { const r = rt.runCheck(); ok(!r, 'balance: the circuit check passes' + (r ? ': ' + JSON.stringify(r[0].en) : '')); }
    if (s.k === 'run') start(src);
    if (s.k === 'edit') { const e = s.set.reduce((x, [re, v]) => x.replace(re, v), src); ok(s.test(e) && !s.test(src) && compile(e).ok, 'balance: the edit is what the step asks'); src = e; start(src); }
    if (s.k === 'act') { let t = -1; const t0 = sim.t;
      for (let f = 0; f < 60 * 25; f++) { lab.step(1000 / 60); sim.update(1 / 60, w('mL'), w('mR')); carFeed(sim, lab); rt.update(1 / 60); if (lab.mcu.state === 'error') break; if (s.until(rt)) { t = f / 60; break; } }
      const B = sim.bal || {}; const d = { maxTh: +(B.maxTh || 0).toFixed(1), sw: B.sw, upT: +(B.upT || 0).toFixed(1), balD: sim.balD, th: +((B.th || 0) * 57.3).toFixed(1), t: +(sim.t - t0).toFixed(1) };
      ok(t >= 0, `balance: act "${s.do.en.slice(0, 30)}" comes true` + (t >= 0 ? ` (${t.toFixed(1)} s) ${JSON.stringify(d)}` : ` — timed out ${JSON.stringify(d)} ${[...sim.flags]}`)); seen.push([...sim.flags].join(',')); }
  }
  ok(!!l.done(rt), `balance: complete; ${seen.join(' | ')}`);
}

// the self-stabilising gimbal (lessons24.js gimbal, scenes3.js GimbalScene): + Kp runs a servo to its end by itself; Kp 2
// shakes at about 10 Hz; Kp 0.25 keeps the phone level while the hand walks
{ const l = LESSONS.find((x) => x.id === 'gimbal'); const B = build3(l);
  play3(l, B, [null, (t, sim) => { if (t > 1.5 && sim.mode !== 'right') sim.control('hand', 'right'); }, (t, sim) => { if (t < 0.1) sim.control('hand', 'level'); else if (t > 2 && sim.mode !== 'walk') sim.control('hand', 'walk'); }]);
  ok(B.sim.res.worst > 0 && B.sim.res.worst <= 5, `gimbal: walking (±10°), the phone stays within ${B.sim.res.worst}°`);
}

console.log(fails ? `${fails} FAILED` : 'all passed'); process.exit(fails ? 1 : 0);
