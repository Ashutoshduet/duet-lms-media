// DUET Robotics Lab 360, batch 24: the two I2C screens on the Raspberry Pi 4, driven the way Pi projects on the internet
// drive them (pi6.js gives these modules to the Pi's Python):
//   RPLCD      from RPLCD.i2c import CharLCD; lcd = CharLCD('PCF8574', 0x27, cols=16, rows=2): write_string ("\r" back to
//              the start of the row, "\n" down a row), clear, home, cursor_pos = (row, col), backlight_enabled,
//              display_enabled, cursor_mode, shift_display, create_char, crlf / cr / lf, close(clear=…). The 16×2 LCD
//              (parts3.js lcd16) behind its PCF8574 backpack. As the real library, it starts as a 20 × 4 LCD unless told
//              cols=16, rows=2 (rows 3 and 4 then land off the 16 × 2 glass, and a long line runs past the 16th letter).
//   luma.oled  from luma.core.interface.serial import i2c; from luma.core.render import canvas; from luma.oled.device
//              import ssd1306; serial = i2c(port=1, address=0x3C); device = ssd1306(serial); with canvas(device) as draw:
//              draw.text((x, y), "…", fill="white", font=…), rectangle, line, point, ellipse; device.clear(), hide(),
//              show(), contrast(), bounding_box, width, height. The picture goes to the OLED when the with block ends.
//   PIL        ImageFont.load_default() and ImageFont.truetype("DejaVuSans.ttf", size): the Pi's fonts (the size picks how
//              big the 5 × 7 letters are drawn); a font file the Pi does not have is an OSError, as Pillow says.
// The Pi's I2C bus 1 is SDA on GPIO 2 (physical pin 3) and SCL on GPIO 3 (physical pin 5), each with a 1.8 kΩ pull-up on the
// board (pi6.js). A module that is not powered, not on those two pins, or at another address does not answer: OSError
// [Errno 121] Remote I/O error, as smbus says on a real Pi (CharLCD() and ssd1306() talk to the screen at once).
import { Nat, Mod, Flt, tup, str, typeName, Tup } from './py.js';
import { glyph } from './libs3.js';

const t3 = (en, hi, hg) => ({ en, hi, hg });
const absent = (v) => typeof v === 'symbol';
const isNone = (v) => v === null || v === undefined || absent(v);
const truthy = (v) => !(v === false || v === null || v === 0 || v === undefined || v === '' || absent(v) || (v instanceof Flt && v.v === 0));
const nat = (name, sig, fn, o) => new Nat(name, sig, fn, o);
const num = (R, v, fn) => { if (typeof v === 'number') return v; if (typeof v === 'boolean') return +v; if (v instanceof Flt) return v.v; throw R.err('TypeError', 'P_NEED_NUM', { fn: fn || '?', t: typeName(v) }); };
const int = (R, v, fn) => Math.trunc(num(R, v, fn));
const seq = (v) => v instanceof Tup || Array.isArray(v);

class Obj { // a Python object made in JavaScript: getters, setters, methods
  constructor(type) { this._type = type; this.pyName = type; this._m = null; }
  get pyType() { return this._type; }
  pyNames() { return [...Object.keys(this.methods()), ...Object.keys(this.props())]; }
  pyGet(n, R) { const pr = this.props(); if (n in pr) return pr[n](R); const ms = this._m || (this._m = this.methods()); return ms[n]; }
  pySet(n, v, R) { const s = this.setters(); if (!s[n]) return false; s[n](v, R); return true; }
  methods() { return {}; } props() { return {}; } setters() { return {}; }
  pyStr() { return `<${this._type} object>`; }
}
const klass = (name, make, consts) => ({ pyType: 'type', pyName: name, pyCall: (R, a, kw) => make(R, a, kw || {}), pyGet: (n) => (consts && n in consts ? consts[n] : undefined), pyNames: () => Object.keys(consts || {}), pyStr: () => `<class '${name}'>` });
const arg = (a, kw, i, name, def) => (kw && name in kw ? kw[name] : a.length > i ? a[i] : def);

// ------------------------------------------------------------------ the Pi's I2C bus 1 (GPIO 2 / GPIO 3)
export const PI_I2C = { SDA: 2, SCL: 3 };
const DEF_ADDR = { lcd16: 0x27, oled: 0x3c };
function onBus(m, type, addr) {
  const L = m.lab; if (!L) return null;
  return L.parts.find((p) => p.type === type && p.N && p.state.powered && ((p.props.addr === undefined ? DEF_ADDR[type] : p.props.addr) | 0) === (addr | 0)
    && L.boardNode('G' + PI_I2C.SDA) === p.N.SDA && L.boardNode('G' + PI_I2C.SCL) === p.N.SCL) || null;
}
const hex = (a) => '0x' + (a & 255).toString(16);
const nodev = (R, addr, what) => R.err('OSError', 'N24_I2C_NODEV', { addr: hex(addr), what });
const tick = (m, R, us) => { m.sync(R); m.t += us; m.back(R); };

// ------------------------------------------------------------------ RPLCD: CharLCD on a PCF8574 backpack
const ROW_AT = { 1: [0x00], 2: [0x00, 0x40], 4: [0x00, 0x40, 0x14, 0x54] }; // the HD44780's DDRAM address of each row
function rplcdMod(m) {
  class CharLCD extends Obj {
    constructor(addr, cols, rows, charmap, autolb, bl) { super('CharLCD'); Object.assign(this, { addr, cols, rows, charmap, autolb }); this.pos = [0, 0]; this.bl = bl; this.disp = true; this.cur = 'hide'; }
    part(R) { const p = onBus(m, 'lcd16', this.addr); if (!p) throw nodev(R, this.addr, 'LCD'); return p; }
    st(R) { const s = this.part(R).state; if (!s.initd) this.init(s); return s; } // (unplugged and plugged back: the module forgot its set-up)
    init(s) { s.ddram = [Array(40).fill(32), Array(40).fill(32)]; s.cur = [0, 0]; s.initd = true; s.on = this.disp; s.shift = 0; s.cg = s.cg || Array.from({ length: 8 }, () => Array(8).fill(0)); s.bl = this.bl; s.showCur = this.cur !== 'hide'; s.blinkCur = this.cur === 'blink'; s.ver = (s.ver || 0) + 1; }
    addr0(row, col) { const base = (ROW_AT[this.rows] || ROW_AT[4])[row] || 0; return base + col; } // a DDRAM address
    put(R, code) { // one character where the cursor is, then the cursor moves on as RPLCD moves it
      const s = this.st(R); const [row, col] = this.pos; const a = this.addr0(row, col); const r = a >= 0x40 ? 1 : 0, c = (a & 0x3f) % 40;
      s.ddram[r][c] = code & 255; s.ver++; tick(m, R, 450);
      let nr = row, nc = col + 1; if (nc >= this.cols && this.autolb) { nr = (row + 1) % this.rows; nc = 0; }
      this.pos = [nr, nc];
    }
    code(ch) { const k = ch.codePointAt(0); if (ch === '°') return 223; return k >= 32 && k < 127 ? k : k < 8 ? k : 63; }
    write(R, v) {
      const s = String(v);
      for (const ch of s) {
        if (ch === '\r') { this.pos = [this.pos[0], 0]; continue; }
        if (ch === '\n') { this.pos = [(this.pos[0] + 1) % this.rows, this.pos[1]]; continue; }
        this.put(R, this.code(ch));
      }
    }
    methods() { const me = this;
      return {
        write_string: nat('write_string', ['value'], (R, v) => { if (typeof v !== 'string') throw R.err('TypeError', 'N24_LCD_STR', { t: typeName(v) }); me.write(R, v); return null; }),
        clear: nat('clear', [], (R) => { const s = me.st(R); s.ddram = [Array(40).fill(32), Array(40).fill(32)]; s.shift = 0; s.ver++; me.pos = [0, 0]; tick(m, R, 2200); return null; }),
        home: nat('home', [], (R) => { const s = me.st(R); s.shift = 0; s.ver++; me.pos = [0, 0]; tick(m, R, 2200); return null; }),
        crlf: nat('crlf', [], (R) => { me.write(R, '\r\n'); return null; }),
        cr: nat('cr', [], (R) => { me.write(R, '\r'); return null; }),
        lf: nat('lf', [], (R) => { me.write(R, '\n'); return null; }),
        shift_display: nat('shift_display', ['amount'], (R, n) => { const s = me.st(R); s.shift = (((s.shift || 0) + int(R, n)) % 40 + 40) % 40; s.ver++; tick(m, R, 600); return null; }),
        create_char: nat('create_char', ['location', 'bitmap'], (R, loc, bm) => {
          const k = int(R, loc); if (k < 0 || k > 7) throw R.err('ValueError', 'N24_LCD_CHAR', { k }); if (!seq(bm) || bm.length !== 8) throw R.err('ValueError', 'N24_LCD_BITMAP', {});
          const s = me.st(R); s.cg[k] = [...bm].map((b) => int(R, b) & 31); s.ver++; tick(m, R, 4000); return null; }),
        close: nat('close', ['clear=False'], (R, c) => { if (truthy(c)) { const s = me.st(R); s.ddram = [Array(40).fill(32), Array(40).fill(32)]; s.ver++; me.pos = [0, 0]; } return null; }),
      }; }
    props() { const me = this; return { cursor_pos: () => tup([...me.pos]), backlight_enabled: () => me.bl, display_enabled: () => me.disp, cursor_mode: () => me.cur }; }
    setters() { const me = this; return {
      cursor_pos: (v, R) => {
        if (!seq(v) || v.length !== 2) throw R.err('TypeError', 'N24_LCD_POS', {});
        const row = int(R, v[0]), col = int(R, v[1]);
        if (row < 0 || row >= me.rows || col < 0 || col >= me.cols) throw R.err('ValueError', 'N24_LCD_POS_BAD', { pos: `(${row}, ${col})`, rows: me.rows, cols: me.cols });
        me.st(R); me.pos = [row, col]; tick(m, R, 450);
      },
      backlight_enabled: (v, R) => { me.bl = !!truthy(v); const s = me.st(R); s.bl = me.bl; s.ver++; tick(m, R, 200); },
      display_enabled: (v, R) => { me.disp = !!truthy(v); const s = me.st(R); s.on = me.disp; s.ver++; tick(m, R, 450); },
      cursor_mode: (v, R) => { if (!['hide', 'line', 'blink'].includes(v)) throw R.err('ValueError', 'N24_LCD_CURSOR', { v: str(v) }); me.cur = v; const s = me.st(R); s.showCur = v !== 'hide'; s.blinkCur = v === 'blink'; s.ver++; },
    }; }
  }
  const mk = klass('CharLCD', (R, a, kw) => {
    const exp = arg(a, kw, 0, 'i2c_expander', null);
    if (exp !== 'PCF8574' && exp !== 'MCP23008' && exp !== 'MCP23017') throw R.err('ValueError', 'N24_LCD_EXP', { v: isNone(exp) ? 'None' : str(exp) });
    const ad = arg(a, kw, 1, 'address', null); if (isNone(ad)) throw R.err('TypeError', 'N24_LCD_ADDR', {});
    const addr = int(R, ad, 'CharLCD');
    const port = int(R, arg(a, kw, 3, 'port', 1)); if (port !== 1) throw R.err('FileNotFoundError', 'N24_I2C_PORT', { port });
    const cols = int(R, arg(a, kw, 4, 'cols', 20)), rows = int(R, arg(a, kw, 5, 'rows', 4));
    const charmap = str(arg(a, kw, 7, 'charmap', 'A02')), autolb = truthy(arg(a, kw, 8, 'auto_linebreaks', true)), bl = truthy(arg(a, kw, 9, 'backlight_enabled', true));
    if (!ROW_AT[rows]) throw R.err('ValueError', 'N24_LCD_ROWS', { rows });
    const o = new CharLCD(addr, cols, rows, charmap, autolb, bl);
    m.sync(R); m.t += 52000; m.back(R); // the set-up commands (and a clear)
    const p = onBus(m, 'lcd16', addr); if (!p) throw nodev(R, addr, 'LCD');
    o.init(p.state); m.lcd24 = (m.lcd24 || 0) + 1; return o;
  });
  return mk;
}

// ------------------------------------------------------------------ PIL.ImageFont: the fonts on the Pi's card
const PI_FONTS = ['DejaVuSans.ttf', 'DejaVuSans-Bold.ttf', 'DejaVuSansMono.ttf', 'DejaVuSansMono-Bold.ttf', 'DejaVuSerif.ttf', 'FreeSans.ttf', 'FreeSansBold.ttf', 'FreeMono.ttf', 'FreeMonoBold.ttf'];
class Font extends Obj { constructor(scale, name, size) { super('FreeTypeFont'); this.scale = scale; this.fname = name; this.size = size; } pyStr() { return `<PIL.ImageFont.FreeTypeFont object (${this.fname}, ${this.size})>`; } }
function imageFontMod() {
  return new Mod('PIL.ImageFont', {
    load_default: nat('load_default', ['size=None'], (R, size) => new Font(isNone(size) ? 1 : Math.max(1, Math.round(num(R, size) / 10)), 'default', isNone(size) ? 10 : num(R, size))),
    truetype: nat('truetype', ['font', 'size=10', 'index=0', 'encoding=""', 'layout_engine=None'], (R, f, size) => {
      const name = str(f); const base = name.split('/').pop(); const sz = num(R, size);
      const ok = PI_FONTS.includes(base) && (!name.includes('/') || /^\/usr\/share\/fonts\/truetype\/(dejavu|freefont)\//.test(name));
      if (!ok) throw R.err('OSError', 'N24_FONT', { name, ok: PI_FONTS.slice(0, 3).join(', ') });
      return new Font(Math.max(1, Math.round(sz / 10)), base, sz);
    }),
  });
}

// ------------------------------------------------------------------ luma.oled: ssd1306 on luma.core's i2c serial
function lumaMods(m) {
  class Serial extends Obj { constructor(addr) { super('i2c'); this.addr = addr; } pyStr() { return `<luma.core.interface.serial.i2c object at 0x${this.addr.toString(16)}>`; } }
  class Device extends Obj {
    constructor(serial, w, h) { super('ssd1306'); this.serial = serial; this.w = w; this.h = h; this.on = true; }
    part(R) { const p = onBus(m, 'oled', this.serial.addr); if (!p) throw nodev(R, this.serial.addr, 'OLED'); return p; }
    send(R, buf, text) { const p = this.part(R); tick(m, R, 23000); p.state.on = this.on; p.state.inv = false; p.state.fb = buf.slice(); p.state.text = text; p.state.h = this.h; p.state.ver = (p.state.ver || 0) + 1; m.oled24 = (m.oled24 || 0) + 1; }
    methods() { const me = this; return {
      clear: nat('clear', [], (R) => { me.send(R, new Uint8Array(128 * 64), ''); return null; }),
      hide: nat('hide', [], (R) => { const p = me.part(R); me.on = false; p.state.on = false; p.state.ver = (p.state.ver || 0) + 1; return null; }),
      show: nat('show', [], (R) => { const p = me.part(R); me.on = true; p.state.on = true; p.state.ver = (p.state.ver || 0) + 1; return null; }),
      contrast: nat('contrast', ['level'], (R, v) => { const k = int(R, v); if (k < 0 || k > 255) throw R.err('AssertionError', 'P_ASSERT', { m: '' }); me.part(R); return null; }),
      cleanup: nat('cleanup', [], () => null),
    }; }
    props() { const me = this; return { width: () => me.w, height: () => me.h, mode: () => '1', bounding_box: () => tup([0, 0, me.w - 1, me.h - 1]), size: () => tup([me.w, me.h]) }; }
  }
  class Draw extends Obj { // PIL.ImageDraw on the canvas's 1-bit picture
    constructor(dev) { super('ImageDraw'); this.dev = dev; this.buf = new Uint8Array(128 * 64); this.log = ''; }
    px(x, y, c) { x = Math.round(x); y = Math.round(y); if (x < 0 || y < 0 || x >= this.dev.w || y >= this.dev.h) return; this.buf[y * 128 + x] = c ? 1 : 0; }
    methods() { const me = this;
      const col = (R, c, def) => { if (isNone(c)) return def; if (typeof c === 'number') return c ? 1 : 0; if (seq(c)) return [...c].some((v) => num(R, v) > 0) ? 1 : 0; const s = str(c).toLowerCase(); if (s === 'white' || s === '#fff' || s === '#ffffff') return 1; if (s === 'black' || s === '#000' || s === '#000000') return 0; throw R.err('ValueError', 'N24_COLOR', { c: s }); };
      const xy = (R, v) => { const f = [...(seq(v) ? v : [])].flatMap((p) => (seq(p) ? [...p] : [p])).map((k) => num(R, k)); if (f.length < 2 || f.length % 2) throw R.err('TypeError', 'N24_XY', {}); return f; };
      const line = (x0, y0, x1, y1, c) => { x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1); const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let e = dx + dy; for (let n = 0; n < 400; n++) { me.px(x0, y0, c); if (x0 === x1 && y0 === y1) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; } } };
      return {
        text: nat('text', ['xy', 'text', 'fill=None', 'font=None', 'anchor=None', 'spacing=4', 'align="left"'], (R, p, s, fill, font) => {
          const [x, y] = xy(R, p); const k = font instanceof Font ? font.scale : 1; const c = col(R, fill, 1); const t = str(s);
          let cx = x, cy = y; for (const ch of t) { if (ch === '\n') { cx = x; cy += 10 * k; continue; } const g = glyph(ch.codePointAt(0) === 176 ? 223 : ch.codePointAt(0)); for (let i = 0; i < 5; i++) for (let j = 0; j < 8; j++) if ((g[i] >> j) & 1) for (let a = 0; a < k; a++) for (let b = 0; b < k; b++) me.px(cx + i * k + a, cy + j * k + b, c); cx += 6 * k; }
          if (c) me.log += (me.log ? '\n' : '') + t; return null; }),
        rectangle: nat('rectangle', ['xy', 'fill=None', 'outline=None', 'width=1'], (R, p, fill, outline) => {
          const [x0, y0, x1, y1] = xy(R, p); const f = isNone(fill) ? null : col(R, fill, 1), o = isNone(outline) ? null : col(R, outline, 1);
          if (f !== null) for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++) for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) me.px(x, y, f);
          if (o !== null) { line(x0, y0, x1, y0, o); line(x1, y0, x1, y1, o); line(x1, y1, x0, y1, o); line(x0, y1, x0, y0, o); } return null; }),
        line: nat('line', ['xy', 'fill=None', 'width=0'], (R, p, fill) => { const f = xy(R, p); const c = col(R, fill, 1); for (let i = 0; i + 3 < f.length; i += 2) line(f[i], f[i + 1], f[i + 2], f[i + 3], c); return null; }),
        point: nat('point', ['xy', 'fill=None'], (R, p, fill) => { const f = xy(R, p); const c = col(R, fill, 1); for (let i = 0; i < f.length; i += 2) me.px(f[i], f[i + 1], c); return null; }),
        ellipse: nat('ellipse', ['xy', 'fill=None', 'outline=None', 'width=1'], (R, p, fill, outline) => {
          const [x0, y0, x1, y1] = xy(R, p); const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, rx = Math.abs(x1 - x0) / 2, ry = Math.abs(y1 - y0) / 2; const f = isNone(fill) ? null : col(R, fill, 1), o = isNone(outline) ? null : col(R, outline, 1);
          for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) { const d = ((x - cx) / (rx || 1)) ** 2 + ((y - cy) / (ry || 1)) ** 2; if (f !== null && d <= 1) me.px(x, y, f); else if (o !== null && Math.abs(d - 1) < 0.18) me.px(x, y, o); }
          return null; }),
        textlength: nat('textlength', ['text', 'font=None'], (R, s, font) => new Flt(str(s).length * 6 * (font instanceof Font ? font.scale : 1))),
      }; }
  }
  class Canvas extends Obj { // with canvas(device) as draw: … — a fresh black picture, sent to the screen when the block ends
    constructor(dev) { super('canvas'); this.dev = dev; this.draw = null; }
    pyEnter(R) { this.dev.part(R); this.draw = new Draw(this.dev); this.R = R; return this.draw; }
    pyExit(R) { if (this.draw) this.dev.send(R || this.R, this.draw.buf, this.draw.log); }
  }
  const serial = klass('i2c', (R, a, kw) => {
    const port = int(R, arg(a, kw, 1, 'port', 1)); if (port !== 1) throw R.err('FileNotFoundError', 'N24_I2C_PORT', { port });
    return new Serial(int(R, arg(a, kw, 2, 'address', 0x3c)));
  });
  const ssd1306 = klass('ssd1306', (R, a, kw) => {
    const s = arg(a, kw, 0, 'serial_interface', null); if (!(s instanceof Serial)) throw R.err('TypeError', 'N24_LUMA_SERIAL', {});
    const w = int(R, arg(a, kw, 1, 'width', 128)), h = int(R, arg(a, kw, 2, 'height', 64)); if (w !== 128 || (h !== 64 && h !== 32)) throw R.err('ValueError', 'N24_LUMA_SIZE', { w, h });
    const d = new Device(s, w, h); m.sync(R); m.t += 30000; m.back(R);
    d.send(R, new Uint8Array(128 * 64), ''); return d; // (luma clears the screen when it starts)
  });
  const canvas = klass('canvas', (R, a, kw) => { const d = arg(a, kw, 0, 'device', null); if (!(d instanceof Device)) throw R.err('TypeError', 'N24_LUMA_CANVAS', { t: typeName(d) }); return new Canvas(d); });
  return {
    'luma.core.interface.serial': () => new Mod('luma.core.interface.serial', { i2c: serial }),
    'luma.core.render': () => new Mod('luma.core.render', { canvas }),
    'luma.oled.device': () => new Mod('luma.oled.device', { ssd1306, sh1106: ssd1306 }),
  };
}

// ------------------------------------------------------------------ the Pico's LCD: pico_i2c_lcd.py + lcd_api.py
// (the two files every Pico LCD tutorial copies to the board, after Dave Hylands' python_lcd): I2cLcd(i2c, addr, lines,
// columns); putstr ("\n" to the next line), putchar, move_to(col, row) — column FIRST, and no check: move_to(1, 0) meant as
// "line 1" writes on line 0 at column 1 —, clear, home, backlight_on / off, display_on / off, show_cursor / hide_cursor,
// blink_cursor_on / off, custom_char. A full line wraps to the next (the last back to the first). The I2C object is the
// Pico's own (pi6.js I2CObj: machine.I2C(0, sda=Pin(4), scl=Pin(5))); nothing at the address is OSError: [Errno 5] EIO.
export function picoLcdMods(m) {
  class LcdApi extends Obj {
    constructor(bus, addr, lines, cols) { super('I2cLcd'); Object.assign(this, { bus, addr, lines, cols }); this.x = 0; this.y = 0; this.implied = false; this.bl = true; }
    part(R) { const p = this.bus.dev(this.addr); if (!p || p.type !== 'lcd16') throw R.err('OSError', 'N6_I2C_NODEV', { addr: hex(this.addr), sda: this.bus.sda, scl: this.bus.scl }); return p; }
    st(R) { const s = this.part(R).state; if (!s.initd) this.init(s); return s; }
    init(s) { s.ddram = [Array(40).fill(32), Array(40).fill(32)]; s.cur = [0, 0]; s.initd = true; s.on = true; s.shift = 0; s.cg = s.cg || Array.from({ length: 8 }, () => Array(8).fill(0)); s.bl = this.bl; s.showCur = false; s.blinkCur = false; s.ver = (s.ver || 0) + 1; }
    data(R, code) { // hal_write_data at the DDRAM address of (x, y), as move_to() set it
      const s = this.st(R); let a = this.x & 0x3f; if (this.y & 1) a += 0x40; if (this.y & 2) a += this.cols;
      s.ddram[a >= 0x40 ? 1 : 0][(a & 0x3f) % 40] = code & 255; s.ver++; tick(m, R, 300);
    }
    putchar(R, ch) {
      if (ch === '\n') { if (this.implied) this.implied = false; else this.x = this.cols; }
      else { const k = ch.codePointAt(0); this.data(R, ch === '°' ? 223 : k >= 32 && k < 127 ? k : k < 8 ? k : 63); this.x += 1; }
      if (this.x >= this.cols) { this.x = 0; this.y += 1; this.implied = ch !== '\n'; }
      if (this.y >= this.lines) this.y = 0;
    }
    methods() { const me = this; const cmd = (R, f) => { const s = me.st(R); f(s); s.ver++; tick(m, R, 300); return null; };
      return {
        putstr: nat('putstr', ['string'], (R, v) => { if (typeof v !== 'string') throw R.err('TypeError', 'N24_PICO_STR', { t: typeName(v) }); for (const ch of v) me.putchar(R, ch); return null; }),
        putchar: nat('putchar', ['char'], (R, v) => { me.putchar(R, String(v)[0] || ' '); return null; }),
        move_to: nat('move_to', ['cursor_x', 'cursor_y'], (R, x, y) => { me.x = int(R, x); me.y = int(R, y); me.st(R); tick(m, R, 300); return null; }),
        clear: nat('clear', [], (R) => { me.x = 0; me.y = 0; return cmd(R, (s) => { s.ddram = [Array(40).fill(32), Array(40).fill(32)]; s.shift = 0; }); }),
        home: nat('home', [], (R) => { me.x = 0; me.y = 0; return cmd(R, (s) => { s.shift = 0; }); }),
        backlight_on: nat('backlight_on', [], (R) => { me.bl = true; return cmd(R, (s) => { s.bl = true; }); }),
        backlight_off: nat('backlight_off', [], (R) => { me.bl = false; return cmd(R, (s) => { s.bl = false; }); }),
        display_on: nat('display_on', [], (R) => cmd(R, (s) => { s.on = true; })),
        display_off: nat('display_off', [], (R) => cmd(R, (s) => { s.on = false; })),
        show_cursor: nat('show_cursor', [], (R) => cmd(R, (s) => { s.showCur = true; })),
        hide_cursor: nat('hide_cursor', [], (R) => cmd(R, (s) => { s.showCur = false; s.blinkCur = false; })),
        blink_cursor_on: nat('blink_cursor_on', [], (R) => cmd(R, (s) => { s.showCur = true; s.blinkCur = true; })),
        blink_cursor_off: nat('blink_cursor_off', [], (R) => cmd(R, (s) => { s.blinkCur = false; })),
        custom_char: nat('custom_char', ['location', 'charmap'], (R, loc, bm) => { const k = int(R, loc) & 7; if (!seq(bm) && !(bm instanceof Uint8Array)) throw R.err('ValueError', 'N24_LCD_BITMAP', {}); const b = [...bm]; if (b.length !== 8) throw R.err('ValueError', 'N24_LCD_BITMAP', {}); return cmd(R, (s) => { s.cg[k] = b.map((x) => int(R, x) & 31); }); }),
      }; }
    props() { const me = this; return { num_lines: () => me.lines, num_columns: () => me.cols, cursor_x: () => me.x, cursor_y: () => me.y }; }
  }
  const mk = klass('I2cLcd', (R, a, kw) => {
    const bus = arg(a, kw, 0, 'i2c', null); if (!bus || typeof bus.dev !== 'function') throw R.err('TypeError', 'N24_PICO_BUS', {});
    const addr = int(R, arg(a, kw, 1, 'i2c_addr', 0x27)), lines = int(R, arg(a, kw, 2, 'num_lines', 2)), cols = int(R, arg(a, kw, 3, 'num_columns', 16));
    const o = new LcdApi(bus, addr, Math.min(4, Math.max(1, lines)), Math.min(40, Math.max(1, cols)));
    m.sync(R); m.t += 52000; m.back(R); o.init(o.part(R).state); m.lcd24 = (m.lcd24 || 0) + 1; return o;
  });
  return { pico_i2c_lcd: () => new Mod('pico_i2c_lcd', { I2cLcd: mk }), lcd_api: () => new Mod('lcd_api', { LcdApi: klass('LcdApi', (R) => { throw R.err('TypeError', 'N24_PICO_BUS', {}); }) }) };
}

// ------------------------------------------------------------------ gpiozero.MCP3008: the Pi's analog inputs through the chip
// MCP3008(channel=0, differential=False, max_voltage=3.3, port=0, device=0): value (0.0–1.0), raw_value (0–1023), voltage,
// channel, close(). Hardware SPI0: SCLK GPIO 11, MOSI GPIO 10, MISO GPIO 9, CE0 GPIO 8 (device=1: CE1 GPIO 7). Each reading
// is the chip's own: (CH − AGND) / (VREF − AGND) × 1024, ±1 count of noise. What goes wrong as on a real Pi: no chip or its
// SPI wires elsewhere (reads 0), no power (0), VREF not joined (1023), an input joined to nothing (the numbers wander),
// the chip run from 5 V (its DOUT puts 5 V on GPIO 9), a channel past 7.
export const PI_SPI0 = { SCLK: 11, MOSI: 10, MISO: 9, CE: [8, 7] };
const PHYS = { 7: 26, 8: 24, 9: 21, 10: 19, 11: 23 };
export function adcClasses(m) {
  const chip = (dev) => { const L = m.lab; if (!L) return null; const on = (p, pin, g) => L.boardNode('G' + g) === p.N[pin];
    return L.parts.find((p) => p.type === 'mcp3008' && p.N && on(p, 'CLK', PI_SPI0.SCLK) && on(p, 'DOUT', PI_SPI0.MISO) && on(p, 'DIN', PI_SPI0.MOSI) && on(p, 'CS', PI_SPI0.CE[dev])) || null; };
  class ADC extends Obj {
    constructor(ch, dev, vmax) { super('MCP3008'); this.ch = ch; this.dev = dev; this.vmax = vmax; this.closed = false; }
    pyStr() { return this.closed ? '<gpiozero.MCP3008 object closed>' : `<gpiozero.MCP3008 object on channel ${this.ch}>`; }
    raw(R) {
      if (this.closed) throw R.err('DeviceClosed', 'N24_ADC_CLOSED', {});
      tick(m, R, 120); const L = m.lab; if (!L) return 0;
      const p = chip(this.dev); const ce = PI_SPI0.CE[this.dev];
      if (!p) { const any = L.parts.some((q) => q.type === 'mcp3008'); m.noteOnce('adcspi', any ? 'N24_ADC_SPI' : 'N24_ADC_NONE', { ce, phys: PHYS[ce] }); return 0; }
      if (!p.state.powered) { m.noteOnce('adcpow', 'N24_ADC_POWER', {}); return 0; }
      if ((p.state.vdd || 0) > 3.6) m.noteOnce('adc5v', 'N24_ADC_5V', { v: (p.state.vdd || 0).toFixed(1) });
      const t = m.t, ch = this.ch; const g = L.readNode(p.N.AGND, t), r = L.readNode(p.N.VREF, t), v = L.readNode(p.N['CH' + ch], t);
      let x;
      if (Number.isNaN(g)) { m.noteOnce('adcag', 'N24_ADC_AGND', {}); x = Math.random(); }
      else if (Number.isNaN(r) || r - g < 0.25) { m.noteOnce('adcref', 'N24_ADC_VREF', {}); x = 1; }
      else if (Number.isNaN(v)) { m.noteOnce('adcfl' + ch, 'N24_ADC_FLOAT', { ch }); x = 0.45 + 0.3 * Math.sin(t / 2.1e5 + ch) + (Math.random() - 0.5) * 0.2; }
      else { x = (v - g) / (r - g); if (v - g > (p.state.vdd || 3.3) + 0.6) m.noteOnce('adcov' + ch, 'N24_ADC_OVER', { ch, v: (v - g).toFixed(1) }); }
      const raw = Math.max(0, Math.min(1023, Math.round(x * 1024 + (Math.random() - 0.5) * 1.2)));
      p.state.last = { ch, raw }; return raw;
    }
    methods() { const me = this; return { close: nat('close', [], () => { me.closed = true; return null; }) }; }
    props() { const me = this; return {
      raw_value: (R) => me.raw(R), value: (R) => new Flt(me.raw(R) / 1023), voltage: (R) => new Flt(me.raw(R) / 1023 * me.vmax),
      channel: () => me.ch, differential: () => false, max_voltage: () => new Flt(me.vmax), bits: () => 10, closed: () => me.closed,
    }; }
  }
  const make = (name, nch) => klass(name, (R, a, kw) => {
    const ch = int(R, arg(a, kw, 0, 'channel', 0)); if (ch < 0 || ch >= nch) throw R.err('SPIBadChannel', 'N24_ADC_CH', { n: nch - 1 });
    if (truthy(arg(a, kw, 1, 'differential', false))) throw R.err('ValueError', 'N24_ADC_DIFF', {});
    const vmax = num(R, arg(a, kw, 2, 'max_voltage', 3.3)); const port = int(R, kw.port ?? 0), dev = int(R, kw.device ?? 0);
    if (port !== 0 || (dev !== 0 && dev !== 1)) throw R.err('SPIBadArgs', 'N24_ADC_PORT', { port, dev });
    return new ADC(ch, dev, vmax);
  });
  return { MCP3008: make('MCP3008', 8), MCP3004: make('MCP3004', 4) };
}

export function displayModules(m) {
  const L = lumaMods(m); const lcd = () => rplcdMod(m);
  return {
    'RPLCD.i2c': () => new Mod('RPLCD.i2c', { CharLCD: lcd() }),
    RPLCD: (R) => new Mod('RPLCD', { i2c: R.imp('RPLCD.i2c'), __version__: '1.3.1' }),
    ...L,
    luma: (R) => new Mod('luma', {}), 'luma.core': () => new Mod('luma.core', {}), 'luma.oled': () => new Mod('luma.oled', {}), 'luma.core.interface': () => new Mod('luma.core.interface', {}),
    'PIL.ImageFont': () => imageFontMod(), PIL: (R) => new Mod('PIL', { ImageFont: R.imp('PIL.ImageFont'), __version__: '9.4.0' }),
  };
}

export const MSG24 = {
  N24_I2C_NODEV: t3('OSError: [Errno 121] Remote I/O error: the {what} does not answer at {addr} on the Pi\'s I2C (SDA = GPIO 2, physical pin 3; SCL = GPIO 3, pin 5). Check its power (VCC and GND), that SDA and SCL are not swapped, and its address (an LCD backpack is 0x27 or 0x3F; on a real Pi, i2cdetect -y 1 lists what answers).',
    'OSError: [Errno 121] Remote I/O error: {what} Pi के I2C (SDA = GPIO 2, फ़िज़िकल पिन 3; SCL = GPIO 3, पिन 5) पर {addr} पते पर जवाब नहीं देता। इसकी पावर (VCC और GND) देखिए, कि SDA और SCL उल्टे तो नहीं लगे, और इसका पता (एलसीडी बैकपैक 0x27 या 0x3F होता है; असली Pi पर i2cdetect -y 1 जवाब देने वालों की सूची देता है)।',
    'OSError: [Errno 121] Remote I/O error: {what} Pi ke I2C (SDA = GPIO 2, physical pin 3; SCL = GPIO 3, pin 5) par {addr} address par jawab nahi deta. Iski power (VCC aur GND) dekhiye, ki SDA aur SCL ulte to nahi lage, aur iska address (LCD backpack 0x27 ya 0x3F hota hai; asli Pi par i2cdetect -y 1 jawab dene walon ki list deta hai).'),
  N24_I2C_PORT: t3('FileNotFoundError: [Errno 2] No such file or directory: \'/dev/i2c-{port}\'. The Pi 4\'s header pins 3 and 5 are I2C bus 1: use port=1.', 'FileNotFoundError: [Errno 2] \'/dev/i2c-{port}\' नहीं है। Pi 4 के हेडर पिन 3 और 5, I2C बस 1 हैं: port=1 लिखिए।', 'FileNotFoundError: [Errno 2] \'/dev/i2c-{port}\' nahi hai. Pi 4 ke header pin 3 aur 5, I2C bus 1 hain: port=1 likhiye.'),
  N24_LCD_EXP: t3('ValueError: Invalid i2c_expander {v}: the 16×2 LCD\'s backpack is a PCF8574, so CharLCD(\'PCF8574\', 0x27).', 'ValueError: i2c_expander {v} ग़लत है: 16×2 एलसीडी का बैकपैक PCF8574 है, इसलिए CharLCD(\'PCF8574\', 0x27)।', 'ValueError: i2c_expander {v} galat hai: 16×2 LCD ka backpack PCF8574 hai, isliye CharLCD(\'PCF8574\', 0x27).'),
  N24_LCD_ADDR: t3('TypeError: CharLCD() missing 1 required positional argument: \'address\'. The backpack\'s address: CharLCD(\'PCF8574\', 0x27).', 'TypeError: CharLCD() में \'address\' नहीं दिया: बैकपैक का पता दीजिए, CharLCD(\'PCF8574\', 0x27)।', 'TypeError: CharLCD() mein \'address\' nahi diya: backpack ka address dijiye, CharLCD(\'PCF8574\', 0x27).'),
  N24_LCD_ROWS: t3('ValueError: rows={rows}: an HD44780 LCD has 1, 2 or 4 rows (this one: rows=2).', 'ValueError: rows={rows}: HD44780 एलसीडी में 1, 2 या 4 पंक्तियाँ होती हैं (इसमें: rows=2)।', 'ValueError: rows={rows}: HD44780 LCD mein 1, 2 ya 4 rows hoti hain (ismein: rows=2).'),
  N24_LCD_STR: t3('TypeError: write_string() takes a str, not {t}: turn a number into text first, e.g. write_string(str(temp)) or an f-string.', 'TypeError: write_string() को str चाहिए, {t} नहीं: नंबर को पहले टेक्स्ट बनाइए, जैसे write_string(str(temp)) या f-string।', 'TypeError: write_string() ko str chahiye, {t} nahi: number ko pehle text banaiye, jaise write_string(str(temp)) ya f-string.'),
  N24_LCD_POS: t3('TypeError: cursor_pos is a pair (row, col), e.g. lcd.cursor_pos = (1, 0) for the start of the second row.', 'TypeError: cursor_pos एक जोड़ी (row, col) है, जैसे दूसरी पंक्ति की शुरुआत के लिए lcd.cursor_pos = (1, 0)।', 'TypeError: cursor_pos ek jodi (row, col) hai, jaise doosri row ki shuruaat ke liye lcd.cursor_pos = (1, 0).'),
  N24_LCD_POS_BAD: t3('ValueError: Cursor position {pos} invalid on a {rows}x{cols} LCD. It is (row, col), row first, counted from 0.', 'ValueError: {rows}x{cols} एलसीडी पर कर्सर की जगह {pos} ग़लत है। यह (row, col) है, पहले row, 0 से गिनती।', 'ValueError: {rows}x{cols} LCD par cursor ki jagah {pos} galat hai. Yeh (row, col) hai, pehle row, 0 se ginti.'),
  N24_LCD_CURSOR: t3('ValueError: cursor_mode must be \'hide\', \'line\' or \'blink\', not {v}.', 'ValueError: cursor_mode \'hide\', \'line\' या \'blink\' होना चाहिए, {v} नहीं।', 'ValueError: cursor_mode \'hide\', \'line\' ya \'blink\' hona chahiye, {v} nahi.'),
  N24_LCD_CHAR: t3('ValueError: Location {k}: an LCD keeps 8 own characters, locations 0 to 7.', 'ValueError: जगह {k}: एलसीडी 8 अपने अक्षर रखती है, जगह 0 से 7।', 'ValueError: jagah {k}: LCD 8 apne characters rakhti hai, jagah 0 se 7.'),
  N24_LCD_BITMAP: t3('ValueError: a character is 8 rows of 5 dots: give 8 numbers, e.g. (0b00100, 0b01110, …).', 'ValueError: एक अक्षर 5 बिंदुओं की 8 पंक्तियाँ है: 8 नंबर दीजिए, जैसे (0b00100, 0b01110, …)।', 'ValueError: ek character 5 dots ki 8 rows hai: 8 numbers dijiye, jaise (0b00100, 0b01110, …).'),
  N24_PICO_STR: t3('TypeError: putstr() writes text: turn the number into text first, lcd.putstr(str(temp)).', 'TypeError: putstr() टेक्स्ट लिखता है: नंबर को पहले टेक्स्ट बनाइए, lcd.putstr(str(temp))।', 'TypeError: putstr() text likhta hai: number ko pehle text banaiye, lcd.putstr(str(temp)).'),
  N24_PICO_BUS: t3('TypeError: I2cLcd needs the I2C bus first: i2c = I2C(0, sda=Pin(4), scl=Pin(5)), then lcd = I2cLcd(i2c, 0x27, 2, 16).', 'TypeError: I2cLcd को पहले I2C बस चाहिए: i2c = I2C(0, sda=Pin(4), scl=Pin(5)), फिर lcd = I2cLcd(i2c, 0x27, 2, 16)।', 'TypeError: I2cLcd ko pehle I2C bus chahiye: i2c = I2C(0, sda=Pin(4), scl=Pin(5)), phir lcd = I2cLcd(i2c, 0x27, 2, 16).'),
  N24_ADC_NONE: t3('MCP3008 reads 0: there is no MCP3008 chip on the bench. The Pi has no analog pins of its own; the chip measures for it.', 'MCP3008 0 पढ़ता है: बेंच पर कोई MCP3008 चिप नहीं है। Pi के अपने कोई एनालॉग पिन नहीं; यह चिप उसके लिए नापती है।', 'MCP3008 0 padhta hai: bench par koi MCP3008 chip nahi hai. Pi ke apne koi analog pin nahi; yeh chip uske liye naapti hai.'),
  N24_ADC_SPI: t3('The MCP3008 does not answer, so every reading is 0. Its SPI wires: CLK to GPIO 11 (SCLK, pin 23), DOUT to GPIO 9 (MISO, pin 21), DIN to GPIO 10 (MOSI, pin 19), CS to GPIO {ce} (pin {phys}).', 'MCP3008 जवाब नहीं देती, इसलिए हर रीडिंग 0 है। इसके SPI तार: CLK, GPIO 11 (SCLK, पिन 23) पर; DOUT, GPIO 9 (MISO, पिन 21) पर; DIN, GPIO 10 (MOSI, पिन 19) पर; CS, GPIO {ce} (पिन {phys}) पर।', 'MCP3008 jawab nahi deti, isliye har reading 0 hai. Iske SPI wire: CLK GPIO 11 (SCLK, pin 23) par, DOUT GPIO 9 (MISO, pin 21) par, DIN GPIO 10 (MOSI, pin 19) par, CS GPIO {ce} (pin {phys}) par.'),
  N24_ADC_POWER: t3('The MCP3008 has no power, so it reads 0: VDD (pin 16) to 3.3 V and DGND (pin 9) to GND.', 'MCP3008 को पावर नहीं मिली, इसलिए यह 0 पढ़ती है: VDD (पिन 16) 3.3 V से और DGND (पिन 9) GND से।', 'MCP3008 ko power nahi mili, isliye yeh 0 padhti hai: VDD (pin 16) 3.3 V se aur DGND (pin 9) GND se.'),
  N24_ADC_5V: t3('The MCP3008 runs at {v} V, so its DOUT puts {v} V on GPIO 9, and a Pi pin takes only 3.3 V. Supply VDD and VREF from 3.3 V.', 'MCP3008 {v} V पर चल रही है, तो इसका DOUT GPIO 9 पर {v} V डालता है, जबकि Pi का पिन सिर्फ़ 3.3 V सहता है। VDD और VREF को 3.3 V दीजिए।', 'MCP3008 {v} V par chal rahi hai, to iska DOUT GPIO 9 par {v} V daalta hai, jabki Pi ka pin sirf 3.3 V sehta hai. VDD aur VREF ko 3.3 V dijiye.'),
  N24_ADC_VREF: t3('VREF (pin 15) is not at 3.3 V, so every reading says 1023. Join VREF to VDD.', 'VREF (पिन 15) 3.3 V पर नहीं है, इसलिए हर रीडिंग 1023 कहती है। VREF को VDD से जोड़िए।', 'VREF (pin 15) 3.3 V par nahi hai, isliye har reading 1023 kehti hai. VREF ko VDD se jodiye.'),
  N24_ADC_AGND: t3('AGND (pin 14) is not joined to GND: the readings are nonsense. Join it to the − rail.', 'AGND (पिन 14) GND से नहीं जुड़ा: रीडिंग बेमतलब हैं। इसे − रेल से जोड़िए।', 'AGND (pin 14) GND se nahi juda: readings bematlab hain. Ise − rail se jodiye.'),
  N24_ADC_FLOAT: t3('CH{ch} measures a voltage, but nothing is joined to it: the numbers wander. Wire the sensor\'s output to CH{ch}.', 'CH{ch} वोल्टेज नापता है, पर उससे कुछ नहीं जुड़ा: संख्याएँ भटकती हैं। सेंसर का आउटपुट CH{ch} से जोड़िए।', 'CH{ch} voltage naapta hai, par usse kuch nahi juda: numbers bhatakte hain. Sensor ka output CH{ch} se jodiye.'),
  N24_ADC_OVER: t3('CH{ch} gets {v} V, more than the chip\'s own supply: it reads 1023 and the chip can be damaged. Power the sensor from 3.3 V.', 'CH{ch} को {v} V मिल रहे हैं, चिप की अपनी सप्लाई से ज़्यादा: यह 1023 पढ़ता है और चिप ख़राब हो सकती है। सेंसर को 3.3 V दीजिए।', 'CH{ch} ko {v} V mil rahe hain, chip ki apni supply se zyada: yeh 1023 padhta hai aur chip kharab ho sakti hai. Sensor ko 3.3 V dijiye.'),
  N24_ADC_CH: t3('SPIBadChannel: channel must be between 0 and {n}.', 'SPIBadChannel: channel 0 से {n} के बीच होना चाहिए।', 'SPIBadChannel: channel 0 se {n} ke beech hona chahiye.'),
  N24_ADC_DIFF: t3('ValueError: differential=True compares two inputs (CH0 − CH1); here each sensor has its own channel: leave it out.', 'ValueError: differential=True दो इनपुट की तुलना करता है (CH0 − CH1); यहाँ हर सेंसर का अपना चैनल है: इसे हटाइए।', 'ValueError: differential=True do input ki tulna karta hai (CH0 − CH1); yahan har sensor ka apna channel hai: ise hataiye.'),
  N24_ADC_PORT: t3('SPIBadArgs: port={port}, device={dev}: the MCP3008 is on SPI0 (port=0), its CS on CE0 (device=0) or CE1 (device=1).', 'SPIBadArgs: port={port}, device={dev}: MCP3008 SPI0 (port=0) पर है, इसका CS CE0 (device=0) या CE1 (device=1) पर।', 'SPIBadArgs: port={port}, device={dev}: MCP3008 SPI0 (port=0) par hai, iska CS CE0 (device=0) ya CE1 (device=1) par.'),
  N24_ADC_CLOSED: t3('DeviceClosed: this MCP3008 was closed with close(): make it again to read it.', 'DeviceClosed: यह MCP3008 close() से बंद हो चुकी है: पढ़ने के लिए फिर से बनाइए।', 'DeviceClosed: yeh MCP3008 close() se band ho chuki hai: padhne ke liye phir se banaiye.'),
  N24_FONT: t3('OSError: cannot open resource "{name}": the Pi has no such font. It has {ok}, … in /usr/share/fonts/truetype.', 'OSError: "{name}" नहीं खुल सकता: Pi में ऐसा फ़ॉन्ट नहीं है। इसमें {ok}, … /usr/share/fonts/truetype में हैं।', 'OSError: "{name}" nahi khul sakta: Pi mein aisa font nahi hai. Ismein {ok}, … /usr/share/fonts/truetype mein hain.'),
  N24_COLOR: t3('ValueError: unknown color specifier: "{c}". The OLED has only "white" (lit) and "black" (dark).', 'ValueError: अनजाना रंग "{c}"। ओएलईडी में सिर्फ़ "white" (चमकता) और "black" (अँधेरा) हैं।', 'ValueError: anjaana rang "{c}". OLED mein sirf "white" (chamakta) aur "black" (andhera) hain.'),
  N24_XY: t3('TypeError: coordinates are (x, y) pairs, e.g. draw.text((0, 0), "Hi") or draw.rectangle((0, 0, 127, 63)).', 'TypeError: निर्देशांक (x, y) जोड़ियाँ हैं, जैसे draw.text((0, 0), "Hi") या draw.rectangle((0, 0, 127, 63))।', 'TypeError: coordinates (x, y) jodiyan hain, jaise draw.text((0, 0), "Hi") ya draw.rectangle((0, 0, 127, 63)).'),
  N24_LUMA_SERIAL: t3('TypeError: ssd1306() needs the I2C link first: serial = i2c(port=1, address=0x3C), then device = ssd1306(serial).', 'TypeError: ssd1306() को पहले I2C लिंक चाहिए: serial = i2c(port=1, address=0x3C), फिर device = ssd1306(serial)।', 'TypeError: ssd1306() ko pehle I2C link chahiye: serial = i2c(port=1, address=0x3C), phir device = ssd1306(serial).'),
  N24_LUMA_SIZE: t3('ValueError: Unsupported display mode: {w} x {h}. This 0.96" OLED is 128 x 64.', 'ValueError: {w} x {h} मोड नहीं चलता। यह 0.96" ओएलईडी 128 x 64 है।', 'ValueError: {w} x {h} mode nahi chalta. Yeh 0.96" OLED 128 x 64 hai.'),
  N24_LUMA_CANVAS: t3('TypeError: canvas() draws on a device, not {t}: with canvas(device) as draw:', 'TypeError: canvas() डिवाइस पर बनाता है, {t} पर नहीं: with canvas(device) as draw:', 'TypeError: canvas() device par banata hai, {t} par nahi: with canvas(device) as draw:'),
};
