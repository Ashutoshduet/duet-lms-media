// DUET Robotics Lab 360, batch 24 (robotics/js/pi24.js): the Raspberry Pi 4's I2C screens, without a browser.
//   RPLCD    CharLCD('PCF8574', 0x27, cols=16, rows=2): write_string, cursor_pos (row, col), clear, "\r\n", backlight;
//            what goes wrong as on a real Pi: SDA / SCL swapped, no 5 V, the wrong address (0x3F), the library's 20 × 4
//            default, a number to write_string, (col, row) past the edge
//   luma     i2c(port=1, address=0x3C) + ssd1306 + canvas: text, big font, rectangle; an unknown font; port 0
//                                                    node devtools/test/robocore24.mjs
import { compile } from '../../robotics/js/cpp.js';
import { Lab } from '../../robotics/js/sim.js';
import { lcdText, oledLit } from '../../robotics/js/libs3.js';

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

console.log(fails ? `${fails} FAILED` : 'all passed'); process.exit(fails ? 1 : 0);
