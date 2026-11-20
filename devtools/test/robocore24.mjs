// DUET Robotics Lab 360, batch 24 (robotics/js/pi24.js): the Raspberry Pi 4's I2C screens, without a browser.
//   RPLCD    CharLCD('PCF8574', 0x27, cols=16, rows=2): write_string, cursor_pos (row, col), clear, "\r\n", backlight;
//            what goes wrong as on a real Pi: SDA / SCL swapped, no 5 V, the wrong address (0x3F), the library's 20 × 4
//            default, a number to write_string, (col, row) past the edge
//   MCP3008  gpiozero's MCP3008(channel=0) on SPI0 through the chip: raw_value / value / voltage; DOUT or CS elsewhere
//            or no VDD reads 0, VREF loose reads 1023, a loose input wanders, the chip or the knob on 5 V is warned about
//   HC-05    the Uno's Serial on TX (pin 1) through the divider to the phone's BT Terminal; 115200 baud is rubbish, no
//            wire is silence, Run again keeps the link
//   Pico     pico_i2c_lcd: I2cLcd(i2c, 0x27, 2, 16), putstr, move_to(col, row) (no check: the wrong order writes in the wrong
//            place), wrap; OSError EIO when swapped, at another address or on the other bus
//   luma     i2c(port=1, address=0x3C) + ssd1306 + canvas: text, big font, rectangle; an unknown font; port 0
//                                                    node devtools/test/robocore24.mjs
import { compile } from '../../robotics/js/cpp.js';
import { Lab } from '../../robotics/js/sim.js';
import { lcdText, oledLit } from '../../robotics/js/libs3.js';
import { netOf } from '../../robotics/js/esp32.js';

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

console.log(fails ? `${fails} FAILED` : 'all passed'); process.exit(fails ? 1 : 0);
