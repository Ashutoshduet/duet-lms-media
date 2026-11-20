// DUET Robotics Lab 360, batch 3: the Arduino libraries that school-lab modules need, for the compiler (cpp.js) and for the
// virtual Uno (mcu.js). Each library object talks to its module only through the real wiring on the bench: the LCD and
// the OLED answer on the I2C bus (SDA = A4, SCL = A5) at their own address, the DHT11 on the pin given to it, the IR
// receiver on the pin given to begin(), the keypad by scanning its rows and columns through the circuit, the stepper by
// writing its four pins (sim.js turns the coils), the RFID reader on the SPI pins (13, 11, 12) plus its SS and RST pins.
// A module that is not wired, not powered or at another address does what a real one does: nothing.
//   LiquidCrystal_I2C, Adafruit_SSD1306 (text and shapes), DHT, IRremote (IrReceiver, and the old IRrecv/decode_results),
//   Keypad, Stepper, MFRC522 (UID read), Wire, SPI.
// Our own code (MIT, DUET). The 5×7 font follows the classic HD44780 / glcdfont pattern (Adafruit GFX glcdfont.c, BSD).
import { RtError } from './mcu.js';
import { HX, TOF_MAX } from './parts30.js'; // (batch 30: the load cell's numbers, the card's reach)

const t3 = (en, hi, hg) => ({ en, hi, hg });
// a near name for a typo (as cpp.js does; kept here so that this file does not import the compiler)
function suggest(name, pool) {
  const lev = (a, b) => { const d = Array.from({ length: a.length + 1 }, (_, i) => [i]); for (let j = 1; j <= b.length; j++) d[0][j] = j; for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); return d[a.length][b.length]; };
  const low = name.toLowerCase(); let best = null, bd = 9;
  for (const p of pool) { if (p.toLowerCase() === low && p !== name) return { s: p, caps: true }; const d = lev(low, p.toLowerCase()); if (name.length >= 3 && d < bd && d <= (name.length > 5 ? 2 : 1)) { bd = d; best = p; } }
  return best ? { s: best, caps: false } : null;
}

// ------------------------------------------------------------------ the 5×7 font (ASCII 32..126): five column bytes, bit 0 at the top
const F57 = '0000000000' + '00005F0000' + '0007000700' + '147F147F14' + '242A7F2A12' + '2313086462' + '3649552250' + '0005030000' + '001C224100' + '0041221C00' +
  '14083E0814' + '08083E0808' + '0050300000' + '0808080808' + '0060600000' + '2010080402' + '3E5149453E' + '00427F4000' + '4261514946' + '2141454B31' +
  '1814127F10' + '2745454539' + '3C4A494930' + '0171090503' + '3649494936' + '064949291E' + '0036360000' + '0056360000' + '0814224100' + '1414141414' +
  '0041221408' + '0201510906' + '324979413E' + '7E1111117E' + '7F49494936' + '3E41414122' + '7F4141221C' + '7F49494941' + '7F09090901' + '3E4149497A' +
  '7F0808087F' + '00417F4100' + '2040413F01' + '7F08142241' + '7F40404040' + '7F020C027F' + '7F0408107F' + '3E4141413E' + '7F09090906' + '3E4151215E' +
  '7F09192946' + '4649494931' + '01017F0101' + '3F4040403F' + '1F2040201F' + '3F4038403F' + '6314081463' + '0708700807' + '6151494543' + '007F414100' +
  '0204081020' + '0041417F00' + '0402010204' + '4040404040' + '0001020400' + '2054545478' + '7F48444438' + '3844444420' + '384444487F' + '3854545418' +
  '087E090102' + '0C5252523E' + '7F08040478' + '00447D4000' + '2040443D00' + '7F10284400' + '00417F4000' + '7C04180478' + '7C08040478' + '3844444438' +
  '7C14141408' + '081414187C' + '7C08040408' + '4854545420' + '043F444020' + '3C4040207C' + '1C2040201C' + '3C4030403C' + '4428102844' + '0C5050503C' +
  '4464544C44' + '0008364100' + '00007F0000' + '0041360800' + '0201020402';
const DEG = [0x00, 0x06, 0x09, 0x09, 0x06]; // ° (the LCD's character 223)
const BLOCK = [0x7f, 0x7f, 0x7f, 0x7f, 0x7f];
// the five columns of a character code (as an LCD or the GFX library draws it)
export function glyph(code) {
  if (code === 223 || code === 176) return DEG;
  if (code === 255) return BLOCK;
  if (code < 32 || code > 126) return [0, 0, 0, 0, 0];
  const k = (code - 32) * 10; const out = [];
  for (let i = 0; i < 5; i++) out.push(parseInt(F57.substr(k + i * 2, 2), 16));
  return out;
}

// ------------------------------------------------------------------ what the compiler knows
// methods: name -> [min args, max args, return type, flags]   flags: p = print-like (any value, formatted like Serial.print),
//   y = takes time (a generator), o = arguments may be objects or arrays (passed as they are)
const PRINT = { print: [0, 2, 'void', 'p'], println: [0, 2, 'void', 'p'] };
const TYPES = {
  LiquidCrystal_I2C: { inc: ['LiquidCrystal_I2C.h'], ctor: [1, 3], methods: { init: [0, 0, 'void'], begin: [0, 3, 'void'], backlight: [0, 0, 'void'], noBacklight: [0, 0, 'void'], clear: [0, 0, 'void'], home: [0, 0, 'void'],
    setCursor: [2, 2, 'void'], ...PRINT, write: [1, 1, 'void'], createChar: [2, 2, 'void', 'o'], cursor: [0, 0, 'void'], noCursor: [0, 0, 'void'], blink: [0, 0, 'void'], noBlink: [0, 0, 'void'],
    display: [0, 0, 'void'], noDisplay: [0, 0, 'void'], scrollDisplayLeft: [0, 0, 'void'], scrollDisplayRight: [0, 0, 'void'], setBacklight: [1, 1, 'void'] } },
  Adafruit_SSD1306: { inc: ['Adafruit_SSD1306.h'], ctor: [0, 4], methods: { begin: [0, 4, 'bool'], clearDisplay: [0, 0, 'void'], display: [0, 0, 'void'], setTextSize: [1, 2, 'void'], setTextColor: [1, 2, 'void'],
    setCursor: [2, 2, 'void'], ...PRINT, write: [1, 1, 'void'], drawPixel: [3, 3, 'void'], drawLine: [5, 5, 'void'], drawFastHLine: [4, 4, 'void'], drawFastVLine: [4, 4, 'void'],
    drawRect: [5, 5, 'void'], fillRect: [5, 5, 'void'], drawRoundRect: [6, 6, 'void'], fillRoundRect: [6, 6, 'void'], drawCircle: [4, 4, 'void'], fillCircle: [4, 4, 'void'],
    drawTriangle: [7, 7, 'void'], fillTriangle: [7, 7, 'void'], fillScreen: [1, 1, 'void'], invertDisplay: [1, 1, 'void'], setTextWrap: [1, 1, 'void'], width: [0, 0, 'int'], height: [0, 0, 'int'],
    getCursorX: [0, 0, 'int'], getCursorY: [0, 0, 'int'], dim: [1, 1, 'void'], setRotation: [1, 1, 'void'], cp437: [0, 1, 'void'] } },
  DHT: { inc: ['DHT.h'], ctor: [2, 3], methods: { begin: [0, 1, 'void'], readTemperature: [0, 2, 'float'], readHumidity: [0, 1, 'float'], computeHeatIndex: [2, 3, 'float'], convertCtoF: [1, 1, 'float'] } },
  IRrecv: { inc: ['IRremote.hpp', 'IRremote.h'], ctor: [0, 2], methods: { begin: [1, 3, 'void'], enableIRIn: [0, 0, 'void'], decode: [0, 1, 'bool', 'o'], resume: [0, 0, 'void'], start: [0, 1, 'void'], stop: [0, 0, 'void'],
    isIdle: [0, 0, 'bool'], available: [0, 0, 'bool'] }, props: { decodedIRData: 'o:IRData' } },
  IRData: { props: { command: 'uint', address: 'uint', decodedRawData: 'ulong', protocol: 'int', flags: 'int', numberOfBits: 'int' }, methods: {} },
  decode_results: { inc: ['IRremote.hpp', 'IRremote.h'], ctor: [0, 0], methods: {}, props: { value: 'ulong', decode_type: 'int', bits: 'int', command: 'uint', address: 'uint' } },
  Keypad: { inc: ['Keypad.h'], ctor: [5, 5], ctorObj: true, methods: { getKey: [0, 0, 'char'], waitForKey: [0, 0, 'char', 'y'], getState: [0, 0, 'int'], isPressed: [1, 1, 'bool'], setDebounceTime: [1, 1, 'void'], setHoldTime: [1, 1, 'void'], keyStateChanged: [0, 0, 'bool'] } },
  Stepper: { inc: ['Stepper.h'], ctor: [3, 5], methods: { setSpeed: [1, 1, 'void'], step: [1, 1, 'void', 'y'], version: [0, 0, 'int'] } },
  MFRC522: { inc: ['MFRC522.h'], ctor: [0, 2], methods: { PCD_Init: [0, 2, 'void'], PICC_IsNewCardPresent: [0, 0, 'bool'], PICC_ReadCardSerial: [0, 0, 'bool'], PICC_HaltA: [0, 0, 'void'], PCD_StopCrypto1: [0, 0, 'void'],
    PCD_DumpVersionToSerial: [0, 0, 'void', 'y'], PICC_DumpToSerial: [0, 1, 'void', 'yo'], PCD_PerformSelfTest: [0, 0, 'bool'], PCD_AntennaOn: [0, 0, 'void'], PCD_AntennaOff: [0, 0, 'void'] }, props: { uid: 'o:MFRC522Uid' } },
  MFRC522Uid: { props: { size: 'byte', sak: 'byte', uidByte: { arr: 'byte', dims: [10] } }, methods: {} },
  TwoWire: { methods: { begin: [0, 1, 'void'], setClock: [1, 1, 'void'], end: [0, 0, 'void'] } },
  SPIClass: { methods: { begin: [0, 0, 'void'], end: [0, 0, 'void'] } },
};
const GLOBALS = { IrReceiver: ['IRrecv', ['IRremote.hpp', 'IRremote.h']], Wire: ['TwoWire', ['Wire.h', 'Adafruit_SSD1306.h', 'LiquidCrystal_I2C.h', 'Adafruit_GFX.h']], SPI: ['SPIClass', ['SPI.h', 'MFRC522.h']] }; // (those libraries include Wire.h / SPI.h themselves)
const CONSTS = {
  DHT11: [11, 'int'], DHT22: [22, 'int'], DHT21: [21, 'int'], AM2302: [22, 'int'],
  SSD1306_SWITCHCAPVCC: [2, 'int'], SSD1306_EXTERNALVCC: [1, 'int'], SSD1306_WHITE: [1, 'int'], SSD1306_BLACK: [0, 'int'], SSD1306_INVERSE: [2, 'int'], WHITE: [1, 'int'], BLACK: [0, 'int'], INVERSE: [2, 'int'],
  NO_KEY: [0, 'char'], IDLE: [0, 'int'], PRESSED: [1, 'int'], HOLD: [2, 'int'], RELEASED: [3, 'int'],
  ENABLE_LED_FEEDBACK: [1, 'bool'], DISABLE_LED_FEEDBACK: [0, 'bool'], USE_DEFAULT_FEEDBACK_LED_PIN: [0, 'int'], NEC: [8, 'int'], UNKNOWN: [0, 'int'], IRDATA_FLAGS_IS_REPEAT: [1, 'int'],
  LCD_5x8DOTS: [0, 'int'],
};
export const LIB_INCLUDES = ['LiquidCrystal_I2C.h', 'Adafruit_SSD1306.h', 'Adafruit_GFX.h', 'DHT.h', 'DHT_U.h', 'IRremote.hpp', 'IRremote.h', 'Keypad.h', 'Stepper.h', 'MFRC522.h', 'SPI.h', 'Wire.h'];
const isObj = (t) => typeof t === 'string' && t.startsWith('o:');

// the hooks cpp.js calls (G is its code generator: G.ex(expr), G.err(code, line, args), G.info)
export const LIB3 = {
  types: TYPES, globals: GLOBALS, consts: CONSTS, includes: LIB_INCLUDES,
  isType: (name) => !!(TYPES[name] && TYPES[name].ctor),
  // `LiquidCrystal_I2C lcd(0x27, 16, 2);` / `Keypad k = Keypad(...)`: the code that makes the object
  decl(G, ty, v) {
    if (v.ctorArgs) return this.ctor(G, ty, v.ctorArgs, v.line);
    if (v.init && v.init.k === 'ctor') { if (v.init.ty !== ty) G.err('E_ASSIGN_TYPE', v.line, { a: v.init.ty, b: ty }); return this.ctor(G, ty, v.init.args, v.line); }
    if (v.init) { const x = G.ex(v.init); if (x.t === 'o:' + ty) return x.c; G.err('E_ASSIGN_TYPE', v.line, { a: 'value', b: ty }); } // (batch 26: DateTime now = rtc.now();)
    return this.ctor(G, ty, [], v.line);
  },
  needInc(G, ty, inc, line) { if (inc && !inc.some((h) => G.info.includes.includes(h))) G.err('E_LIB_INCLUDE', line, { type: ty, lib: inc[0] }); },
  ctor(G, ty, args, line) {
    const T = TYPES[ty]; this.needInc(G, ty, T.inc, line);
    if (args.length < T.ctor[0] || args.length > T.ctor[1]) G.err('E_ARGS', line, { name: ty, min: T.ctor[0], max: T.ctor[1], got: args.length });
    const xs = args.map((a) => { const x = G.ex(a); if (x.t === 'void') G.err('E_VOID_VALUE', line, { name: x.fname || '' }); if (x.t === 'str' && ty !== 'DateTime') G.err('E_ARG_STR', line, { name: ty }); return x; }); // (batch 26: DateTime(F(__DATE__), F(__TIME__)))
    for (const x of ty === 'Adafruit_NeoPixel' ? xs.slice(1, 2) : xs) if (x.k !== undefined && Number.isInteger(x.k) && x.k >= 0 && x.k < 20 && ty !== 'LiquidCrystal_I2C' && ty !== 'Adafruit_SSD1306') G.info.pins.add(x.k); // (batch 28: a NeoPixel's first number is its count)
    (G.info.libs || (G.info.libs = new Set())).add(ty);
    return `rt.lib(${JSON.stringify(ty)},[${xs.map((x) => x.c)}],${line})`;
  },
  global(G, name, line) { const [ty, inc] = GLOBALS[name]; this.needInc(G, name, inc, line); (G.info.libs || (G.info.libs = new Set())).add(ty); return { c: `rt.lib("@${name}",[],${line})`, t: 'o:' + ty }; },
  addr(G, e) { const x = G.ex(e.e); if (isObj(x.t)) return x; G.err('E_UNSUPPORTED', e.line, { what: 'address (&)' }); },
  member(G, e) {
    const o = G.ex(e.o); if (!isObj(o.t)) return null;
    const ty = o.t.slice(2), T = TYPES[ty]; const P = T && T.props && T.props[e.m];
    if (!P) { const sg = suggest(e.m, Object.keys((T && T.props) || {})); G.err('E_LIB_MEMBER', e.line, { name: e.m, type: ty, s: sg && sg.s, caps: sg && sg.caps }); }
    return { c: `${o.c}.${e.m}`, t: P };
  },
  method(G, e, obj, oname) {
    const ty = obj.t.slice(2), T = TYPES[ty], m = e.f.m; const B = T.methods[m];
    if (!B) { const sg = suggest(m, Object.keys(T.methods)); G.err('E_LIB_METHOD', e.line, { name: m, type: ty, s: sg && sg.s, caps: sg && sg.caps }); }
    const [mn, mx, ret, fl = ''] = B;
    if (e.args.length < mn || e.args.length > mx) G.err('E_ARGS', e.line, { name: (oname || ty) + '.' + m, min: mn, max: mx, got: e.args.length });
    if (fl.includes('p')) {
      const nl = m === 'println' ? '+"\\n"' : '';
      if (!e.args.length) return { c: `${obj.c}.print("\\n")`, t: 'void' };
      const a = G.ex(e.args[0]); if (a.t === 'void') G.err('E_VOID_VALUE', e.line, { name: a.fname || '' });
      const f = e.args[1] ? G.ex(e.args[1]).c : 'undefined';
      return { c: `${obj.c}.print(rt.fmt(${a.c},'${typeof a.t === 'string' ? a.t : 'arr'}',${f})${nl})`, t: 'void' };
    }
    const xs = e.args.map((x) => { const a = G.ex(x); if (a.t === 'void') G.err('E_VOID_VALUE', e.line, { name: a.fname || '' }); if (!fl.includes('o') && (a.t === 'str' || (a.t && a.t.arr) || isObj(a.t))) G.err(a.t === 'str' ? 'E_ARG_STR' : 'E_ARRAY_VALUE', e.line, { name: m }); return a.c; });
    if (ty === 'IRrecv' && m === 'begin' && e.args[0]) { const p = G.ex(e.args[0]); if (p.k !== undefined) G.info.pins.add(p.k); }
    let c = `${obj.c}.${m}(${xs})`; if (fl.includes('y')) c = `(yield* ${c})`;
    return { c, t: ret };
  },
  // F("text"), makeKeymap(keys), isnan(x), isinf(x)
  funcs: {
    F(G, e) { if (e.args.length !== 1) G.err('E_ARGS', e.line, { name: 'F', min: 1, max: 1, got: e.args.length }); const a = G.ex(e.args[0]); if (a.t !== 'str') G.err('E_ASSIGN_TYPE', e.line, { a: 'number', b: 'F("text")' }); return a; },
    makeKeymap(G, e) { if (e.args.length !== 1) G.err('E_ARGS', e.line, { name: 'makeKeymap', min: 1, max: 1, got: e.args.length }); const a = G.ex(e.args[0]); if (!a.t || !a.t.arr || a.t.dims.length !== 2) G.err('E_KEYMAP', e.line); return a; },
    isnan(G, e) { if (e.args.length !== 1) G.err('E_ARGS', e.line, { name: 'isnan', min: 1, max: 1, got: e.args.length }); const a = G.ex(e.args[0]); return { c: `(+Number.isNaN(${a.c}))`, t: 'bool' }; },
    isinf(G, e) { if (e.args.length !== 1) G.err('E_ARGS', e.line, { name: 'isinf', min: 1, max: 1, got: e.args.length }); const a = G.ex(e.args[0]); return { c: `(+(${a.c}===Infinity||${a.c}===-Infinity))`, t: 'bool' }; },
  },
};
// compiler messages (i18n.js CPP gets them from app3.js)
export const MSG3 = {
  E_LIB_INCLUDE: t3('To use {type}, put #include <{lib}> at the top of the sketch.', '{type} के लिए स्केच में सबसे ऊपर #include <{lib}> लिखिए।', '{type} ke liye sketch mein sabse upar #include <{lib}> likhiye.'),
  E_LIB_METHOD: t3('A {type} has no "{name}".', '{type} में "{name}" नहीं होता।', '{type} mein "{name}" nahi hota.'),
  E_LIB_MEMBER: t3('A {type} has no part called "{name}".', '{type} में "{name}" नाम का हिस्सा नहीं है।', '{type} mein "{name}" naam ka hissa nahi hai.'),
  E_KEYMAP: t3('makeKeymap() needs the keys as a 2-D char array, like char keys[4][4] = {…};', 'makeKeymap() को बटन 2-D char ऐरे में चाहिए, जैसे char keys[4][4] = {…};', 'makeKeymap() ko keys 2-D char array mein chahiye, jaise char keys[4][4] = {…};'),
};

// ------------------------------------------------------------------ the runtime (the sketch calls rt.lib(type, args, line))
const NAN = Number.NaN;
// the lab, its parts of one type, and the board pin a part's pin is wired to
const labOf = (m) => m.lab || null;
const partsOf = (m, type) => { const L = labOf(m); return L ? L.parts.filter((p) => p.type === type) : []; };
function onPin(m, p, pinId, gpio) { const L = labOf(m); if (!L || !p.N || gpio < 0) return false; return L.used('N:G' + gpio) && L.boardNode('G' + gpio) === p.N[pinId]; }
// the I2C bus: a powered module at this address with SDA on A4 and SCL on A5 (or the SDA / SCL pins by AREF)
function i2c(m, type, addr) {
  const L = labOf(m); if (!L) return null;
  const C = (L.def && L.def.id !== 'uno' && L.def.consts) || {}; // (batch 12) a board with its own I2C pins (the ESP32: SDA = GPIO 21, SCL = GPIO 22)
  const onBus = (p) => (L.conn(p.ep.SDA, 'B:A4') && L.conn(p.ep.SCL, 'B:A5')) || (C.SDA !== undefined && onPin(m, p, 'SDA', C.SDA) && onPin(m, p, 'SCL', C.SCL));
  for (const p of L.parts) if (p.type === type && p.state.powered && (p.props.addr | 0) === (addr | 0) && onBus(p)) return p;
  return null;
}
const busy = (m, us) => { m.t += us; };

class LCDrt { // LiquidCrystal_I2C (HD44780 behind a PCF8574)
  constructor(m, [addr, cols, rows]) { this.m = m; this.addr = addr | 0; this.cols = cols || 16; this.rows = rows || 2; this.blOn = true; }
  dev() { return i2c(this.m, 'lcd16', this.addr); }
  st() { const p = this.dev(); return p ? p.state : null; }
  init() { busy(this.m, 52000); const s = this.st(); if (!s) return; s.ddram = [Array(40).fill(32), Array(40).fill(32)]; s.cur = [0, 0]; s.initd = true; s.on = true; s.shift = 0; s.cg = s.cg || Array.from({ length: 8 }, () => Array(8).fill(0)); s.bl = this.blOn; s.ver = (s.ver || 0) + 1; }
  begin() { this.init(); }
  backlight() { this.blOn = true; busy(this.m, 200); const s = this.st(); if (s) { s.bl = true; s.ver++; } }
  noBacklight() { this.blOn = false; busy(this.m, 200); const s = this.st(); if (s) { s.bl = false; s.ver++; } }
  setBacklight(v) { if (v) this.backlight(); else this.noBacklight(); }
  clear() { busy(this.m, 2200); const s = this.st(); if (!s || !s.initd) return; s.ddram = [Array(40).fill(32), Array(40).fill(32)]; s.cur = [0, 0]; s.shift = 0; s.ver++; }
  home() { busy(this.m, 2200); const s = this.st(); if (!s || !s.initd) return; s.cur = [0, 0]; s.shift = 0; s.ver++; }
  setCursor(c, r) { busy(this.m, 900); const s = this.st(); if (!s || !s.initd) return; r = Math.max(0, Math.min(this.rows - 1, r | 0)); s.cur = [Math.max(0, Math.min(39, c | 0)), r]; }
  put(code) {
    busy(this.m, 950); const s = this.st(); if (!s || !s.initd) return;
    const [c, r] = s.cur; s.ddram[r][c] = code & 255; let nc = c + 1, nr = r; if (nc >= 40) { nc = 0; nr = (r + 1) % 2; } s.cur = [nc, nr]; s.ver++;
  }
  print(str) { for (const ch of String(str)) { if (ch === '\n' || ch === '\r') { continue; } this.put(ch.charCodeAt(0) > 255 ? 63 : ch.charCodeAt(0)); } }
  write(v) { this.put(v | 0); }
  createChar(n, bytes) { busy(this.m, 8000); const s = this.st(); if (!s) return; s.cg = s.cg || Array.from({ length: 8 }, () => Array(8).fill(0)); s.cg[n & 7] = Array.from({ length: 8 }, (_, i) => (bytes && bytes[i]) | 0); s.ver = (s.ver || 0) + 1; }
  cursor() { const s = this.st(); if (s) { s.showCur = true; s.ver++; } } noCursor() { const s = this.st(); if (s) { s.showCur = false; s.ver++; } }
  blink() { const s = this.st(); if (s) { s.blinkCur = true; s.ver++; } } noBlink() { const s = this.st(); if (s) { s.blinkCur = false; s.ver++; } }
  display() { const s = this.st(); if (s) { s.on = true; s.ver++; } } noDisplay() { const s = this.st(); if (s) { s.on = false; s.ver++; } }
  scrollDisplayLeft() { busy(this.m, 900); const s = this.st(); if (s && s.initd) { s.shift = ((s.shift || 0) + 1) % 40; s.ver++; } }
  scrollDisplayRight() { busy(this.m, 900); const s = this.st(); if (s && s.initd) { s.shift = ((s.shift || 0) + 39) % 40; s.ver++; } }
}
// the 16 characters of each row the LCD shows now (for the lesson checks and the robot panel)
export function lcdText(p) { const s = p && p.state; if (!s || !s.powered || !s.initd || !s.on) return ['', '']; return [0, 1].map((r) => { let o = ''; for (let i = 0; i < 16; i++) { const c = s.ddram[r][(i + (s.shift || 0)) % 40]; o += c === 223 ? '°' : c < 8 ? '▣' : c >= 32 && c < 127 ? String.fromCharCode(c) : '?'; } return o; }); }

class OLEDrt { // Adafruit_SSD1306 + Adafruit_GFX: a 128×64 picture in the sketch's RAM, sent to the module by display()
  constructor(m, args) { this.m = m; this.w = (args.length >= 2 ? args[0] : 128) | 0; this.h = (args.length >= 2 ? args[1] : 64) | 0; if (this.w !== 128) this.w = 128; if (this.h !== 32) this.h = 64; this.buf = new Uint8Array(128 * 64); this.log = ''; this.cx = 0; this.cy = 0; this.size = 1; this.fg = 1; this.bg = -1; this.wrap = true; this.addr = 0x3c; }
  begin(vcs, addr) { busy(this.m, 30000); if (addr !== undefined) this.addr = addr | 0; const p = i2c(this.m, 'oled', this.addr); if (p) { p.state.on = true; p.state.inv = false; p.state.fb = new Uint8Array(128 * 64); p.state.ver = (p.state.ver || 0) + 1; p.state.h = this.h; } return 1; }
  dev() { return i2c(this.m, 'oled', this.addr); }
  display() { busy(this.m, 24000); const p = this.dev(); if (!p || !p.state.on) return; p.state.fb = this.buf.slice(); p.state.text = this.log; p.state.ver = (p.state.ver || 0) + 1; p.state.h = this.h; }
  clearDisplay() { this.buf.fill(0); this.log = ''; this.cx = 0; this.cy = 0; busy(this.m, 300); }
  invertDisplay(v) { busy(this.m, 300); const p = this.dev(); if (p) { p.state.inv = !!v; p.state.ver++; } }
  dim() { busy(this.m, 300); } setRotation() {} cp437() {} setTextWrap(v) { this.wrap = !!v; }
  width() { return this.w; } height() { return this.h; } getCursorX() { return this.cx; } getCursorY() { return this.cy; }
  setTextSize(s) { this.size = Math.max(1, Math.min(8, s | 0)); } setTextColor(c, b) { this.fg = c | 0; this.bg = b === undefined ? -1 : b | 0; } setCursor(x, y) { this.cx = x | 0; this.cy = y | 0; }
  px(x, y, c) { x = Math.round(x); y = Math.round(y); if (x < 0 || y < 0 || x >= 128 || y >= this.h) return; const i = y * 128 + x; this.buf[i] = c === 2 ? 1 - this.buf[i] : c ? 1 : 0; }
  drawPixel(x, y, c) { this.px(x, y, c); this.m.t += 2; }
  drawFastHLine(x, y, w, c) { for (let i = 0; i < w; i++) this.px(x + i, y, c); this.m.t += 4 + w * 0.3; }
  drawFastVLine(x, y, h, c) { for (let i = 0; i < h; i++) this.px(x, y + i, c); this.m.t += 4 + h * 0.3; }
  drawLine(x0, y0, x1, y1, c) { x0 |= 0; y0 |= 0; x1 |= 0; y1 |= 0; const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let e = dx + dy, n = 0; for (;;) { this.px(x0, y0, c); if ((x0 === x1 && y0 === y1) || ++n > 600) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; } } this.m.t += 10 + n * 0.5; }
  drawRect(x, y, w, h, c) { this.drawFastHLine(x, y, w, c); this.drawFastHLine(x, y + h - 1, w, c); this.drawFastVLine(x, y, h, c); this.drawFastVLine(x + w - 1, y, h, c); }
  fillRect(x, y, w, h, c) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.px(x + i, y + j, c); this.m.t += 10 + w * h * 0.05; }
  fillScreen(c) { this.fillRect(0, 0, 128, this.h, c); }
  drawCircle(x0, y0, r, c) { let f = 1 - r, dx = 1, dy = -2 * r, x = 0, y = r; this.px(x0, y0 + r, c); this.px(x0, y0 - r, c); this.px(x0 + r, y0, c); this.px(x0 - r, y0, c); while (x < y) { if (f >= 0) { y--; dy += 2; f += dy; } x++; dx += 2; f += dx; for (const [a, b] of [[x, y], [-x, y], [x, -y], [-x, -y], [y, x], [-y, x], [y, -x], [-y, -x]]) this.px(x0 + a, y0 + b, c); } this.m.t += 20 + r; }
  fillCircle(x0, y0, r, c) { for (let y = -r; y <= r; y++) { const w = Math.floor(Math.sqrt(r * r - y * y) + 0.5); for (let x = -w; x <= w; x++) this.px(x0 + x, y0 + y, c); } this.m.t += 20 + r * r * 0.1; }
  drawRoundRect(x, y, w, h, r, c) { this.drawFastHLine(x + r, y, w - 2 * r, c); this.drawFastHLine(x + r, y + h - 1, w - 2 * r, c); this.drawFastVLine(x, y + r, h - 2 * r, c); this.drawFastVLine(x + w - 1, y + r, h - 2 * r, c); for (let a = 0; a <= 90; a += 3) { const s = Math.sin(a * Math.PI / 180) * r, q = Math.cos(a * Math.PI / 180) * r; this.px(x + r - q, y + r - s, c); this.px(x + w - 1 - r + q, y + r - s, c); this.px(x + r - q, y + h - 1 - r + s, c); this.px(x + w - 1 - r + q, y + h - 1 - r + s, c); } }
  fillRoundRect(x, y, w, h, r, c) { this.fillRect(x, y + r, w, h - 2 * r, c); for (let j = 0; j < r; j++) { const d = r - Math.sqrt(r * r - (r - j) * (r - j)); this.drawFastHLine(x + d, y + j, w - 2 * d, c); this.drawFastHLine(x + d, y + h - 1 - j, w - 2 * d, c); } }
  drawTriangle(x0, y0, x1, y1, x2, y2, c) { this.drawLine(x0, y0, x1, y1, c); this.drawLine(x1, y1, x2, y2, c); this.drawLine(x2, y2, x0, y0, c); }
  fillTriangle(x0, y0, x1, y1, x2, y2, c) { const ys = [y0, y1, y2]; const y_0 = Math.min(...ys), y_1 = Math.max(...ys); for (let y = y_0; y <= y_1; y++) { const xs = []; for (const [ax, ay, bx, by] of [[x0, y0, x1, y1], [x1, y1, x2, y2], [x2, y2, x0, y0]]) if ((y >= ay && y <= by) || (y >= by && y <= ay)) { if (ay === by) { xs.push(ax, bx); } else xs.push(ax + (y - ay) * (bx - ax) / (by - ay)); } if (xs.length) this.drawFastHLine(Math.min(...xs), y, Math.max(...xs) - Math.min(...xs) + 1, c); } }
  char(code) {
    const g = glyph(code), s = this.size;
    for (let i = 0; i < 6; i++) { const col = i < 5 ? g[i] : 0; for (let j = 0; j < 8; j++) { const on = (col >> j) & 1; if (on || this.bg >= 0) for (let a = 0; a < s; a++) for (let b = 0; b < s; b++) this.px(this.cx + i * s + a, this.cy + j * s + b, on ? this.fg : this.bg); } }
    this.cx += 6 * s; this.m.t += 25 * s;
  }
  print(str) {
    this.log = (this.log + String(str)).slice(-200); // (the words on the screen, for the lesson checks)
    for (const ch of String(str)) {
      if (ch === '\n') { this.cx = 0; this.cy += 8 * this.size; continue; } if (ch === '\r') continue;
      if (this.wrap && this.cx + 6 * this.size > 128) { this.cx = 0; this.cy += 8 * this.size; }
      this.char(ch.charCodeAt(0) > 255 ? 63 : ch.charCodeAt(0));
    }
  }
  write(v) { this.print(String.fromCharCode(v & 255)); }
}
// how many pixels of the OLED are lit now, and the text it was last asked to show (for checks)
export function oledLit(p) { const s = p && p.state; if (!s || !s.powered || !s.on || !s.fb) return 0; let n = 0; for (const v of s.fb) n += v; return s.inv ? 128 * 64 - n : n; }

class DHTrt { // DHT11 / DHT22: one data pin; a reading takes about 25 ms, and the sensor answers at most every 2 s
  constructor(m, [pin, type]) { this.m = m; this.pin = pin | 0; this.type = type | 0; this.last = -1e12; this.t = NAN; this.h = NAN; }
  begin() { this.m.t += 30; }
  read() {
    const m = this.m; if (m.t - this.last < 2e6 && this.last > -1e11) return; this.last = m.t; busy(m, 24000);
    const p = partsOf(m, 'dht11').find((q) => q.state.powered && onPin(m, q, 'DATA', this.pin));
    if (!p) { this.t = NAN; this.h = NAN; return; }
    const s = p.state; s.reads = (s.reads || 0) + 1;
    this.t = Math.round(s.tS); this.h = Math.max(5, Math.min(95, Math.round(s.hS)));
  }
  readTemperature(f) { this.read(); return f ? this.t * 1.8 + 32 : this.t; }
  readHumidity() { this.read(); return this.h; }
  convertCtoF(c) { return c * 1.8 + 32; }
  computeHeatIndex(t, h, f) { const T = f === 0 ? t * 1.8 + 32 : t; let hi = 0.5 * (T + 61 + (T - 68) * 1.2 + h * 0.094); if (hi > 79) hi = -42.379 + 2.04901523 * T + 10.14333127 * h - 0.22475541 * T * h - 0.00683783 * T * T - 0.05481717 * h * h + 0.00122874 * T * T * h + 0.00085282 * T * h * h - 0.00000199 * T * T * h * h; return f === 0 ? (hi - 32) / 1.8 : hi; }
}

// the remote's buttons (the common 17-key NEC remote in Indian kits): command codes
export const REMOTE = { '1': 0x45, '2': 0x46, '3': 0x47, '4': 0x44, '5': 0x40, '6': 0x43, '7': 0x07, '8': 0x15, '9': 0x09, '*': 0x16, '0': 0x19, '#': 0x0D, UP: 0x18, DOWN: 0x52, LEFT: 0x08, RIGHT: 0x5A, OK: 0x1C };
const rev8 = (b) => { let r = 0; for (let i = 0; i < 8; i++) r = (r << 1) | ((b >> i) & 1); return r; };
export const legacyCode = (cmd) => (0x00ff0000 | (rev8(cmd) << 8) | rev8(~cmd & 255)) >>> 0; // what the old IRremote prints: 1 = FFA25D
class IRrt { // IRremote 4 (IrReceiver) and the old IRrecv / decode_results
  constructor(m, args) { this.m = m; this.pin = args && args.length ? args[0] | 0 : -1; this.on = false; this.hold = false; this.decodedIRData = { command: 0, address: 0, decodedRawData: 0, protocol: 0, flags: 0, numberOfBits: 0 }; }
  begin(pin) { this.pin = pin | 0; this.on = true; this.hold = false; this.m.t += 40; }
  enableIRIn() { this.on = true; this.hold = false; this.m.t += 40; } start() { this.on = true; } stop() { this.on = false; }
  rx() { return partsOf(this.m, 'irrx').find((q) => q.state.powered && onPin(this.m, q, 'OUT', this.pin)) || null; }
  isIdle() { return 1; }
  available() { const p = this.rx(); return p && p.state.q && p.state.q.some((c) => c.at <= this.m.t) ? 1 : 0; }
  decode(res) {
    const m = this.m; m.t += 8; if (!this.on || this.hold) return 0;
    const p = this.rx(); if (!p || !p.state.q) return 0;
    const k = p.state.q.findIndex((c) => c.at <= m.t); if (k < 0) return 0;
    const c = p.state.q.splice(k, 1)[0]; p.state.got = (p.state.got || 0) + 1;
    const D = this.decodedIRData; D.command = c.cmd; D.address = 0; D.protocol = 8; D.flags = c.rep ? 1 : 0; D.numberOfBits = 32;
    D.decodedRawData = (((~c.cmd & 255) << 24) | (c.cmd << 16) | 0xff00) >>> 0;
    if (res) { res.value = c.rep ? 0xffffffff : legacyCode(c.cmd); res.decode_type = 3; res.bits = 32; res.command = c.cmd; res.address = 0; }
    this.hold = true; return 1;
  }
  resume() { this.hold = false; this.m.t += 4; }
}
class ResultsRT { constructor() { this.value = 0; this.decode_type = 0; this.bits = 0; this.command = 0; this.address = 0; } }

class KeypadRT { // Keypad: rows are INPUT_PULLUP; one column at a time is pulled LOW and the rows are read through the circuit
  constructor(m, [map, rows, cols, nr, nc]) { this.m = m; this.map = map; this.rows = Array.from(rows).slice(0, nr); this.cols = Array.from(cols).slice(0, nc); this.nr = nr | 0; this.nc = nc | 0; this.deb = 10000; this.lastScan = -1e9; this.down = new Set(); this.state = 0; this.inited = false; }
  setDebounceTime(ms) { this.deb = Math.max(1, ms | 0) * 1000; } setHoldTime() {}
  scan() {
    const m = this.m; if (m.t - this.lastScan < this.deb) return null; this.lastScan = m.t;
    if (!this.inited) { for (const r of this.rows) m.pinMode(r, 2); for (const c of this.cols) m.pinMode(c, 0); this.inited = true; }
    const now = new Set();
    for (let c = 0; c < this.cols.length; c++) {
      m.pinMode(this.cols[c], 1); m.dw(this.cols[c], 0);
      for (let r = 0; r < this.rows.length; r++) if ((!m.lab || m.lab.used('N:G' + this.rows[r])) && !m.dr(this.rows[r])) now.add(r * 16 + c); // (a row wired to nothing: its pull-up keeps it HIGH)
      m.dw(this.cols[c], 1); m.pinMode(this.cols[c], 0);
    }
    const fresh = [...now].filter((k) => !this.down.has(k)); const gone = [...this.down].filter((k) => !now.has(k));
    this.down = now; this.state = now.size ? 1 : gone.length ? 3 : 0;
    return { fresh, gone };
  }
  keyAt(k) { const r = k >> 4, c = k & 15; const row = this.map[r]; return row ? row[c] | 0 : 0; }
  getKey() { const s = this.scan(); if (!s || !s.fresh.length) return 0; return this.keyAt(s.fresh[0]); }
  *waitForKey() { for (;;) { const k = this.getKey(); if (k) return k; if (this.m.k()) yield 0; yield* this.m.delay(1); } }
  getState() { return this.state; }
  isPressed(ch) { for (const k of this.down) if (this.keyAt(k) === (ch | 0)) return 1; return 0; }
  keyStateChanged() { const s = this.scan(); return s && (s.fresh.length || s.gone.length) ? 1 : 0; }
}

class StepperRT { // Stepper: one step = the next of four coil patterns on its pins (2 wires: 2 patterns); speed in rpm
  constructor(m, [n, p1, p2, p3, p4]) { this.m = m; this.n = Math.max(1, n | 0); this.pins = [p1, p2, p3, p4].filter((x) => x !== undefined).map((x) => x | 0); this.k = 0; this.delay = 60e6 / this.n; this.last = 0; for (const p of this.pins) m.pinMode(p, 1); }
  setSpeed(rpm) { this.delay = rpm > 0 ? 60e6 / this.n / rpm : 1e9; }
  version() { return 5; }
  *step(n) {
    const m = this.m; let left = Math.abs(n | 0); const dir = n > 0 ? 1 : -1;
    while (left > 0) {
      const due = Math.max(m.t, this.last + this.delay);
      while (m.t < due) { if (due <= m.until) { m.t = due; break; } m.t = m.until; yield 0; }
      this.last = m.t; this.k = (this.k + dir + this.n) % this.n; left--; this.out(this.k % 4);
    }
  }
  out(s) {
    const P = this.pins, m = this.m;
    if (P.length === 4) { const pat = [[1, 0, 1, 0], [0, 1, 1, 0], [0, 1, 0, 1], [1, 0, 0, 1]][s]; for (let i = 0; i < 4; i++) m.dw(P[i], pat[i]); }
    else if (P.length === 2) { const pat = [[0, 1], [1, 1], [1, 0], [0, 0]][s]; for (let i = 0; i < 2; i++) m.dw(P[i], pat[i]); }
  }
}

// the cards in the box (MIFARE Classic 1K, 4-byte UID)
export const CARDS = { card: { uid: [0xA3, 0x4F, 0x1C, 0x2D], name: t3('White card', 'सफ़ेद कार्ड', 'Safed card') }, tag: { uid: [0x5B, 0x2E, 0x91, 0xC4], name: t3('Blue key tag', 'नीला की-टैग', 'Neela key tag') } };
export const uidText = (u) => u.map((b) => b.toString(16).toUpperCase().padStart(2, '0')).join(' ');
class RFIDrt { // MFRC522: SPI (SCK 13, MOSI 11, MISO 12), SS and RST pins; it sees a card when one is held on it
  constructor(m, args) { this.m = m; this.ss = args.length ? args[0] | 0 : 10; this.rst = args.length > 1 ? args[1] | 0 : 9; this.uid = { size: 0, sak: 0, uidByte: new Uint8Array(10) }; this.ok = false; }
  dev() {
    const m = this.m; const L = labOf(m); if (!L) return null;
    return partsOf(m, 'rfid').find((p) => p.state.powered && !p.state.over && onPin(m, p, 'SDA', this.ss) && onPin(m, p, 'RST', this.rst) && onPin(m, p, 'SCK', 13) && onPin(m, p, 'MOSI', 11) && onPin(m, p, 'MISO', 12)) || null;
  }
  PCD_Init() { busy(this.m, 52000); const p = this.dev(); this.ok = !!p; if (p) p.state.init = true; }
  PCD_AntennaOn() {} PCD_AntennaOff() {} PCD_PerformSelfTest() { busy(this.m, 30000); return this.dev() ? 1 : 0; } PCD_StopCrypto1() { this.m.t += 50; }
  *PCD_DumpVersionToSerial() { const p = this.dev(); yield* this.m.ser.out(p ? 'Firmware Version: 0x92 = v2.0\r\n' : 'Firmware Version: 0x0 = (unknown)\r\nWARNING: Communication failure, is the MFRC522 properly connected?\r\n'); }
  PICC_IsNewCardPresent() {
    busy(this.m, 1800); const p = this.ok && this.dev(); if (!p || !p.state.card) return 0;
    const c = p.state.card; if (c.halted) return 0; return 1;
  }
  PICC_ReadCardSerial() {
    busy(this.m, 3500); const p = this.ok && this.dev(); if (!p || !p.state.card || p.state.card.halted) return 0;
    const u = CARDS[p.state.card.id].uid; this.uid.size = u.length; this.uid.sak = 0x08; this.uid.uidByte.fill(0); u.forEach((b, i) => { this.uid.uidByte[i] = b; }); p.state.reads = (p.state.reads || 0) + 1; return 1;
  }
  PICC_HaltA() { busy(this.m, 1200); const p = this.dev(); if (p && p.state.card) p.state.card.halted = true; }
  *PICC_DumpToSerial() { yield* this.m.ser.out('Card UID: ' + uidText([...this.uid.uidByte.slice(0, this.uid.size)]) + '\r\nPICC type: MIFARE 1KB\r\n'); }
}
class NoopRT { begin() {} setClock() {} end() {} }

const MAKERS = {
  LiquidCrystal_I2C: (m, a) => new LCDrt(m, a), Adafruit_SSD1306: (m, a) => new OLEDrt(m, a), DHT: (m, a) => new DHTrt(m, a), IRrecv: (m, a) => new IRrt(m, a), decode_results: () => new ResultsRT(),
  Keypad: (m, a) => new KeypadRT(m, a), Stepper: (m, a) => new StepperRT(m, a), MFRC522: (m, a) => new RFIDrt(m, a),
  '@IrReceiver': (m) => new IRrt(m, []), '@Wire': () => new NoopRT(), '@SPI': () => new NoopRT(),
};
const ONE = new WeakMap(); // the global objects (IrReceiver, Wire, SPI): one per run of the sketch

// ------------------------------------------------------------------ batch 26: four I2C sensor modules (parts26.js), library by library
//   MPU6050_light (rfetick): MPU6050 mpu(Wire); begin() -> 0 when it answers (2: no answer, as Wire's endTransmission);
//     calcOffsets() averages 1 s of readings and calls that "flat and still" (tilted or moving, that error stays);
//     update() reads it and runs the complementary filter (0.98 gyro, 0.02 accelerometer); getAngleX/Y/Z, getAcc…, getGyro…
//   RTClib: RTC_DS3231 rtc; begin(); now() -> DateTime (hour(), minute(), …); adjust(DateTime(F(__DATE__), F(__TIME__)));
//     lostPower(): true until it is set (no coin cell time yet). The module keeps time on its coin cell between Runs.
//   BH1750 (claws): BH1750 meter; begin(); readLightLevel() -> lux (-2 before begin(), -1 with no answer)
//   Adafruit_BMP085 (the BMP180 too): begin(); readTemperature() °C, readPressure() Pa, readAltitude(sea level Pa) m
const D2R = Math.PI / 180, R2D = 180 / Math.PI;
const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) * 0.8;
function mpuRaw(p) { // what the chip measures now (g, °/s): gravity turned by the module's roll (X) and pitch (Y), its bias, a little noise
  const s = p.state; const r = (s.roll || 0) * D2R, q = (s.pitch || 0) * D2R; const B = s.bias || (s.bias = { ax: 0.03, ay: -0.02, az: 0.04, gx: 2.3, gy: -1.6, gz: 0.9 });
  const sh = s.shake > 0 ? (Math.random() - 0.5) * 1.6 : 0;
  const ax = -Math.sin(q) + B.ax + 0.004 * gauss() + sh, ay = Math.sin(r) * Math.cos(q) + B.ay + 0.004 * gauss() + sh * 0.7, az = Math.cos(r) * Math.cos(q) + B.az + 0.004 * gauss();
  const rt = s.rate || [0, 0, 0]; return { ax, ay, az, gx: rt[0] + B.gx + 0.05 * gauss() + sh * 40, gy: rt[1] + B.gy + 0.05 * gauss(), gz: rt[2] + B.gz + 0.05 * gauss() };
}
class MPUrt {
  constructor(m) { this.m = m; this.addr = 0x68; this.off = { ax: 0, ay: 0, az: 0, gx: 0, gy: 0, gz: 0 }; this.ang = [0, 0, 0]; this.acc = [0, 0, 0]; this.gyr = [0, 0, 0]; this.accAng = [0, 0]; this.fc = 0.98; this.last = null; this.tmp = NAN; }
  dev() { return i2c(this.m, 'mpu6050', this.addr); }
  begin() { busy(this.m, 1500); const p = this.dev(); if (!p) return 2; this.last = this.m.t; p.state.reads = (p.state.reads || 0) + 1; this.update(); this.ang = [this.accAng[0], this.accAng[1], 0]; return 0; }
  setAddress(a) { this.addr = a | 0; }
  setFilterGyroCoef(c) { this.fc = Math.max(0, Math.min(1, +c)); }
  *calcOffsets(g = 1, a = 1) { // 500 readings, about 1 s
    const p = this.dev(); const t0 = this.m.t; yield* this.m.delay(1000); if (!p) return; const n = 20, S = { ax: 0, ay: 0, az: 0, gx: 0, gy: 0, gz: 0 };
    for (let i = 0; i < n; i++) { const r = mpuRaw(p); for (const k in S) S[k] += r[k] / n; }
    if (a) { this.off.ax = S.ax; this.off.ay = S.ay; this.off.az = S.az - 1; } if (g) { this.off.gx = S.gx; this.off.gy = S.gy; this.off.gz = S.gz; } p.state.cal = { roll: p.state.roll || 0, pitch: p.state.pitch || 0, moving: p.state.shake > 0 || (p.state.rate || [0, 0, 0]).some((v) => Math.abs(v) > 3), at: t0 };
    this.last = this.m.t; this.ang = [0, 0, 0];
  }
  *calcGyroOffsets() { yield* this.calcOffsets(1, 0); }
  *calcAccOffsets() { yield* this.calcOffsets(0, 1); }
  update() {
    busy(this.m, 900); const p = this.dev(); if (!p) return; const r = mpuRaw(p); const o = this.off; const now = this.m.t; const dt = this.last === null ? 0 : Math.min(1, (now - this.last) / 1e6); this.last = now;
    const ax = r.ax - o.ax, ay = r.ay - o.ay, az = r.az - o.az; this.acc = [ax, ay, az]; this.gyr = [r.gx - o.gx, r.gy - o.gy, r.gz - o.gz]; this.tmp = 26 + 0.3 * gauss();
    const sgZ = az < 0 ? -1 : 1; this.accAng = [Math.atan2(ay, sgZ * Math.sqrt(az * az + ax * ax)) * R2D, -Math.atan2(ax, Math.sqrt(az * az + ay * ay)) * R2D];
    const f = this.fc; this.ang[0] = f * (this.ang[0] + this.gyr[0] * dt) + (1 - f) * this.accAng[0]; this.ang[1] = f * (this.ang[1] + this.gyr[1] * dt) + (1 - f) * this.accAng[1]; this.ang[2] += this.gyr[2] * dt;
    p.state.reads = (p.state.reads || 0) + 1; p.state.seen = [...this.ang];
  }
  getAngleX() { return this.ang[0]; } getAngleY() { return this.ang[1]; } getAngleZ() { return this.ang[2]; }
  getAccX() { return this.acc[0]; } getAccY() { return this.acc[1]; } getAccZ() { return this.acc[2]; }
  getGyroX() { return this.gyr[0]; } getGyroY() { return this.gyr[1]; } getGyroZ() { return this.gyr[2]; }
  getAccAngleX() { return this.accAng[0]; } getAccAngleY() { return this.accAng[1]; } getTemp() { return this.tmp; }
}
// DateTime: seconds since 1 Jan 2000 (RTClib's SECONDS_FROM_1970_TO_2000 is 946684800)
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export class DateTimeRT {
  constructor(m, a = []) {
    this.m = m; let t = 0;
    if (a.length === 1 && typeof a[0] === 'number') t = a[0] - 946684800;
    else if (a.length === 2 && typeof a[0] === 'string') { const d = /([A-Z][a-z]{2})\s+(\d+)\s+(\d{4})/.exec(a[0]) || [], h = /(\d+):(\d+):(\d+)/.exec(a[1]) || []; t = Date.UTC(+d[3] || 2000, Math.max(0, MON.indexOf(d[1])), +d[2] || 1, +h[1] || 0, +h[2] || 0, +h[3] || 0) / 1000 - 946684800; }
    else if (a.length >= 3) t = Date.UTC(a[0] | 0, (a[1] | 0) - 1, a[2] | 0, a[3] | 0, a[4] | 0, a[5] | 0) / 1000 - 946684800;
    this.s = Math.max(0, Math.floor(t)); this.d = new Date((this.s + 946684800) * 1000);
  }
  year() { return this.d.getUTCFullYear(); } month() { return this.d.getUTCMonth() + 1; } day() { return this.d.getUTCDate(); }
  hour() { return this.d.getUTCHours(); } minute() { return this.d.getUTCMinutes(); } second() { return this.d.getUTCSeconds(); }
  dayOfTheWeek() { return this.d.getUTCDay(); } unixtime() { return this.s + 946684800; } secondstime() { return this.s; }
}
const labT = (m) => (m && m.lab ? m.lab.clock || 0 : 0); // (the bench's own time, in s: it goes on when the sketch restarts)
export const rtcSecs = (p, m) => { const s = p.state; return (s.epoch || 0) + Math.floor(labT(m) - (s.base || 0)); }; // (the module's own clock: set, then it runs on its crystal)
class RTCrt {
  constructor(m) { this.m = m; this.ok = false; }
  dev() { return i2c(this.m, 'rtc3231', 0x68); }
  begin() { busy(this.m, 500); const p = this.dev(); this.ok = !!p; if (p && p.state.base === undefined) { p.state.base = labT(this.m); } return this.ok ? 1 : 0; }
  now() { busy(this.m, 400); const p = this.dev(); const d = new DateTimeRT(this.m, []); if (!p) { d.s = 165 * 86400 * 365; d.d = new Date((d.s + 946684800) * 1000); return d; } // (no answer: the library reads 0xFF: 2165/165/165)
    if (p.state.lost) { d.s = 0; } else { if (p.state.base === undefined) p.state.base = labT(this.m); d.s = rtcSecs(p, this.m); } d.d = new Date((d.s + 946684800) * 1000); p.state.reads = (p.state.reads || 0) + 1; return d; }
  adjust(dt) { busy(this.m, 400); const p = this.dev(); if (!p || !dt) return; p.state.epoch = dt.s; p.state.base = labT(this.m); p.state.lost = false; p.state.adjusts = (p.state.adjusts || 0) + 1; }
  lostPower() { const p = this.dev(); return p ? (p.state.lost ? 1 : 0) : 1; }
  getTemperature() { const p = this.dev(); return p ? Math.round(((this.m.lab && this.m.lab.env.temp) ?? 25) * 4) / 4 : NAN; }
}
class BH1750rt {
  constructor(m, [addr]) { this.m = m; this.addr = addr || 0x23; this.on = false; }
  dev() { return i2c(this.m, 'bh1750', this.addr); }
  begin(mode, addr) { busy(this.m, 300); if (addr) this.addr = addr | 0; const p = this.dev(); this.on = !!p; if (p) p.state.lastRead = this.m.t; return this.on ? 1 : 0; }
  configure() { return this.begin(); }
  measurementReady() { return 1; }
  readLightLevel() { if (!this.on) return -2; const p = this.dev(); if (!p) return -1; busy(this.m, 1200); p.state.reads = (p.state.reads || 0) + 1; const lx = Math.max(0, p.state.lux || 0); return Math.round(lx * 1.2 * (1 + 0.004 * gauss())) / 1.2; }
}
class BMPrt {
  constructor(m) { this.m = m; this.on = false; }
  dev() { return i2c(this.m, 'bmp180', 0x77); }
  begin() { busy(this.m, 2000); this.on = !!this.dev(); return this.on ? 1 : 0; }
  pa() { const p = this.dev(); if (!p || !this.on) return NAN; const s = p.state; return Math.round(101325 * Math.pow(1 - (s.alt || 0) / 44330, 5.255) + (s.wx || 0) * 100 + 3 * gauss()); }
  readTemperature() { busy(this.m, 4500); const p = this.dev(); if (!p || !this.on) return NAN; return Math.round(((this.m.lab && this.m.lab.env.temp) ?? 25) * 10 + gauss()) / 10; }
  readPressure() { busy(this.m, 26000); const v = this.pa(); return Number.isNaN(v) ? 0 : v; }
  readSealevelPressure(alt = 0) { const v = this.pa(); return Number.isNaN(v) ? 0 : Math.round(v / Math.pow(1 - alt / 44330, 5.255)); }
  readAltitude(sea = 101325) { busy(this.m, 26000); const v = this.pa(); if (Number.isNaN(v)) return NAN; return Math.round(44330 * (1 - Math.pow(v / sea, 1 / 5.255)) * 10) / 10; }
}
Object.assign(TYPES, {
  MPU6050: { inc: ['MPU6050_light.h'], ctor: [1, 1], methods: { begin: [0, 2, 'byte'], calcOffsets: [0, 2, 'void', 'y'], calcGyroOffsets: [0, 0, 'void', 'y'], calcAccOffsets: [0, 0, 'void', 'y'], update: [0, 0, 'void'], setAddress: [1, 1, 'void'], setFilterGyroCoef: [1, 1, 'void'],
    getAngleX: [0, 0, 'float'], getAngleY: [0, 0, 'float'], getAngleZ: [0, 0, 'float'], getAccX: [0, 0, 'float'], getAccY: [0, 0, 'float'], getAccZ: [0, 0, 'float'], getGyroX: [0, 0, 'float'], getGyroY: [0, 0, 'float'], getGyroZ: [0, 0, 'float'],
    getAccAngleX: [0, 0, 'float'], getAccAngleY: [0, 0, 'float'], getTemp: [0, 0, 'float'] } },
  RTC_DS3231: { inc: ['RTClib.h'], ctor: [0, 0], methods: { begin: [0, 1, 'bool'], now: [0, 0, 'o:DateTime'], adjust: [1, 1, 'void', 'o'], lostPower: [0, 0, 'bool'], getTemperature: [0, 0, 'float'] } },
  DateTime: { inc: ['RTClib.h'], ctor: [0, 6], methods: { year: [0, 0, 'int'], month: [0, 0, 'int'], day: [0, 0, 'int'], hour: [0, 0, 'int'], minute: [0, 0, 'int'], second: [0, 0, 'int'], dayOfTheWeek: [0, 0, 'int'], unixtime: [0, 0, 'ulong'], secondstime: [0, 0, 'ulong'] } },
  BH1750: { inc: ['BH1750.h'], ctor: [0, 1], methods: { begin: [0, 3, 'bool'], configure: [1, 1, 'bool'], readLightLevel: [0, 0, 'float'], measurementReady: [0, 1, 'bool'] } },
  Adafruit_BMP085: { inc: ['Adafruit_BMP085.h'], ctor: [0, 0], methods: { begin: [0, 2, 'bool'], readTemperature: [0, 0, 'float'], readPressure: [0, 0, 'long'], readSealevelPressure: [0, 1, 'long'], readAltitude: [0, 1, 'float'] } },
});
Object.assign(MAKERS, { MPU6050: (m) => new MPUrt(m), RTC_DS3231: (m) => new RTCrt(m), DateTime: (m, a) => new DateTimeRT(m, a), BH1750: (m, a) => new BH1750rt(m, a), Adafruit_BMP085: (m) => new BMPrt(m) });
LIB_INCLUDES.push('MPU6050_light.h', 'RTClib.h', 'BH1750.h', 'Adafruit_BMP085.h');
GLOBALS.Wire[1].push('MPU6050_light.h', 'RTClib.h', 'BH1750.h', 'Adafruit_BMP085.h');
{ const d = new Date(); CONSTS.__DATE__ = [JSON.stringify(`${MON[d.getMonth()]} ${String(d.getDate()).padStart(2, ' ')} ${d.getFullYear()}`), 'str']; CONSTS.__TIME__ = [JSON.stringify(d.toTimeString().slice(0, 8)), 'str']; }

// ------------------------------------------------------------------ batch 28: the DS18B20 probe and the WS2812 light stick (parts28.js)
//   OneWire + DallasTemperature: OneWire oneWire(2); DallasTemperature probe(&oneWire); begin(); requestTemperatures() (it
//     waits for the conversion: 750 ms at 12 bits, 94 ms at 9); getTempCByIndex(0) °C in steps of 1/16 (or of 1/2 at 9 bits).
//     As on the bench: a probe answers only with a pull-up (1 to 10 kΩ from DATA to its VCC or another supply); with none,
//     or no probe, or no power, -127 (DEVICE_DISCONNECTED_C). Read before any conversion since power-up: 85 °C.
//   Adafruit_NeoPixel: Adafruit_NeoPixel strip(8, 6, NEO_GRB + NEO_KHZ800); begin(); setPixelColor(i, c) or (i, r, g, b),
//     Color(r, g, b), fill(c, first, count), clear(), setBrightness(0..255), ColorHSV, gamma32, numPixels, getPixelColor;
//     show() sends the bytes in the order the type says. The WS2812B reads G, R, B: NEO_RGB makes red green. Nothing changes
//     on the stick until show(); lights past the count keep their old colour; NEO_KHZ400 is the wrong speed for it.
const pulledUp = (L, p) => L.parts.some((r) => r.type === 'resistor' && (r.props.ohms || 0) >= 1000 && (r.props.ohms || 0) <= 10000 && [['1', '2'], ['2', '1']].some(([a, b]) => L.conn(r.ep[a], p.ep.DATA) && (L.conn(r.ep[b], p.ep.VCC) || (L.voltageAt(r.ep[b]) || 0) > 2.7)));
class OneWireRT { constructor(m, [pin]) { this.m = m; this.pin = pin | 0; } reset_search() {} }
class DallasRT {
  constructor(m, [ow]) { this.m = m; this.ow = ow; this.res = 12; }
  probes() { const m = this.m, L = labOf(m); if (!L || !this.ow) return []; return partsOf(m, 'ds18b20').filter((p) => p.state.powered && onPin(m, p, 'DATA', this.ow.pin) && pulledUp(L, p)); }
  begin() { busy(this.m, 2500); this.n = this.probes().length; }
  getDeviceCount() { busy(this.m, 2500); return this.probes().length; }
  setResolution(a, b) { const v = b === undefined ? a : b; this.res = Math.max(9, Math.min(12, v | 0)); }
  getResolution() { return this.res; }
  setWaitForConversion() {} isConversionComplete() { return 1; }
  *requestTemperatures() {
    const ps = this.probes(); busy(this.m, 1200); if (!ps.length) return; const q = 1 << (this.res - 8); // (steps of 1/q degree)
    for (const p of ps) { p.state.conv = Math.round(p.state.tS * q) / q; p.state.fresh = false; p.state.reads = (p.state.reads || 0) + 1; }
    yield* this.m.delay({ 9: 94, 10: 188, 11: 375, 12: 750 }[this.res]);
  }
  getTempCByIndex(i) { busy(this.m, 13000); const p = this.probes()[i | 0]; if (!p) return -127; return p.state.fresh || p.state.conv === undefined ? 85 : p.state.conv; }
  getTempFByIndex(i) { const c = this.getTempCByIndex(i); return c === -127 ? -196.6 : c * 1.8 + 32; }
}
const NEO_ORDER = (t) => [(t >> 4) & 3, (t >> 2) & 3, t & 3]; // where R, G and B go among the three bytes sent
class NeoRT {
  constructor(m, [n, pin, type]) { this.m = m; this.n = Math.max(0, n | 0); this.pin = pin === undefined ? 6 : pin | 0; this.type = type === undefined ? 0x52 : type | 0; this.buf = Array.from({ length: this.n }, () => [0, 0, 0]); this.bright = 0; this.began = false; }
  begin() { this.began = true; this.m.pinMode(this.pin, 1); }
  updateLength(n) { this.n = Math.max(0, n | 0); this.buf = Array.from({ length: this.n }, () => [0, 0, 0]); }
  setPin(p) { this.pin = p | 0; if (this.began) this.m.pinMode(this.pin, 1); }
  Color(r, g, b) { return (((r & 255) << 16) | ((g & 255) << 8) | (b & 255)) >>> 0; }
  setPixelColor(i, a, b, c) { i |= 0; if (i < 0 || i >= this.n) return; if (b === undefined) { const v = a >>> 0; this.buf[i] = [(v >> 16) & 255, (v >> 8) & 255, v & 255]; } else this.buf[i] = [a & 255, b & 255, c & 255]; }
  fill(c = 0, first = 0, count = 0) { first |= 0; const end = count ? Math.min(this.n, first + (count | 0)) : this.n; for (let i = Math.max(0, first); i < end; i++) this.setPixelColor(i, c); }
  clear() { for (const px of this.buf) px.fill(0); }
  setBrightness(b) { this.bright = ((b | 0) & 255) + 1; }
  getBrightness() { return this.bright ? this.bright - 1 : 255; }
  numPixels() { return this.n; }
  getPixelColor(i) { const px = this.buf[i | 0]; return px ? this.Color(...px) : 0; }
  ColorHSV(h = 0, s = 255, v = 255) { // (Adafruit's: hue 0..65535 round the wheel)
    h = ((h | 0) % 65536 + 65536) % 65536; h = Math.floor((h * 1530 + 32768) / 65536); let r, g, b;
    if (h < 510) { b = 0; if (h < 255) { r = 255; g = h; } else { r = 510 - h; g = 255; } } else if (h < 1020) { r = 0; if (h < 765) { g = 255; b = h - 510; } else { g = 1020 - h; b = 255; } } else if (h < 1530) { g = 0; if (h < 1275) { r = h - 1020; b = 255; } else { r = 255; b = 1530 - h; } } else { r = 255; g = 0; b = 0; }
    const v1 = 1 + (v & 255), s1 = 1 + (s & 255), s2 = 255 - (s & 255); const f = (x) => ((((x * s1) >> 8) + s2) * v1) >> 8; return this.Color(f(r), f(g), f(b));
  }
  gamma32(c) { const v = c >>> 0; const g = (x) => Math.round(Math.pow(x / 255, 2.6) * 255); return this.Color(g((v >> 16) & 255), g((v >> 8) & 255), g(v & 255)); }
  show() {
    const m = this.m; busy(m, 30 * this.n + 60); if (!this.began) return;
    const p = partsOf(m, 'ws2812').find((q) => onPin(m, q, 'DIN', this.pin)); if (!p || !p.state.powered) return;
    const [ro, go, bo] = NEO_ORDER(this.type); const k = this.bright ? this.bright : 256; const old = p.state.px || Array.from({ length: 8 }, () => [0, 0, 0]);
    const px = old.map((c, i) => { if (i >= this.n) return c; // (the chips past the count keep what they had)
      const [r, g, b] = this.buf[i].map((v) => (v * k) >> 8); const by = [0, 0, 0]; by[ro] = r; by[go] = g; by[bo] = b;
      if (this.type & 0x100) return [(by[0] * 7 + i * 53) & 255, (by[1] * 3 + 91) & 255, (by[2] * 5 + i * 17) & 255]; // (400 kHz data to an 800 kHz chip: wrong bits)
      return [by[1], by[0], by[2]]; }); // (the WS2812B reads G, R, B)
    p.state.px = px; p.state.shows = (p.state.shows || 0) + 1; const L = labOf(m); if (L) { L.stateV = (L.stateV || 0) + 1; L.instKey = null; }
  }
}
Object.assign(TYPES, {
  OneWire: { inc: ['OneWire.h'], ctor: [1, 1], methods: { reset_search: [0, 0, 'void'] } },
  DallasTemperature: { inc: ['DallasTemperature.h'], ctor: [1, 1], methods: { begin: [0, 0, 'void'], getDeviceCount: [0, 0, 'int'], setResolution: [1, 2, 'void'], getResolution: [0, 1, 'int'], requestTemperatures: [0, 0, 'void', 'y'],
    getTempCByIndex: [1, 1, 'float'], getTempFByIndex: [1, 1, 'float'], setWaitForConversion: [1, 1, 'void'], isConversionComplete: [0, 0, 'bool'] } },
  Adafruit_NeoPixel: { inc: ['Adafruit_NeoPixel.h'], ctor: [0, 3], methods: { begin: [0, 0, 'void'], show: [0, 0, 'void'], setPixelColor: [2, 5, 'void'], fill: [0, 3, 'void'], clear: [0, 0, 'void'], setBrightness: [1, 1, 'void'], getBrightness: [0, 0, 'int'],
    numPixels: [0, 0, 'int'], getPixelColor: [1, 1, 'ulong'], Color: [3, 4, 'ulong'], ColorHSV: [0, 3, 'ulong'], gamma32: [1, 1, 'ulong'], updateLength: [1, 1, 'void'], setPin: [1, 1, 'void'] } },
});
Object.assign(MAKERS, { OneWire: (m, a) => new OneWireRT(m, a), DallasTemperature: (m, a) => new DallasRT(m, a), Adafruit_NeoPixel: (m, a) => new NeoRT(m, a) });
Object.assign(CONSTS, { DEVICE_DISCONNECTED_C: [-127, 'float'], DEVICE_DISCONNECTED_F: [-196.6, 'float'], NEO_RGB: [0x06, 'int'], NEO_RBG: [0x09, 'int'], NEO_GRB: [0x52, 'int'], NEO_GBR: [0xa1, 'int'], NEO_BRG: [0x58, 'int'], NEO_BGR: [0xa4, 'int'], NEO_KHZ800: [0x0000, 'int'], NEO_KHZ400: [0x0100, 'int'] });
LIB_INCLUDES.push('OneWire.h', 'DallasTemperature.h', 'Adafruit_NeoPixel.h');

// ------------------------------------------------------------------ batch 30: the load cell's HX711 and the VL53L0X (parts30.js)
//   HX711 (bogde): HX711 scale; begin(DT, SCK); read() (raw, about 430 counts a gram + the chip's zero + the platform),
//     read_average(n), get_value(n) (minus the offset), get_units(n) (divided by the scale), tare(n), set_scale(f),
//     get_scale(), set_offset(), get_offset(), is_ready(), wait_ready(), power_down(), power_up(). 10 readings a second, each
//     waited for; with DT not on a powered HX711 the library waits for ever (the sketch stops there), as a real one does.
//   VL53L0X (Pololu): VL53L0X tof; init() (false: nothing at 0x29); setTimeout(ms); readRangeSingleMillimeters() (33 ms),
//     startContinuous(), readRangeContinuousMillimeters(), timeoutOccurred(), setMeasurementTimingBudget(µs: 200000 is
//     slower and steadier), setSignalRateLimit(0.1: long range). 8190 past what it can see, 65535 with no sensor.
const HXZ = 84213; // (this HX711's own zero, in counts)
class HX711rt {
  constructor(m) { this.m = m; this.dt = -1; this.sck = -1; this.scale = 1; this.offset = 0; this.gain = 128; this.down = false; }
  dev() { const m = this.m; return partsOf(m, 'loadcell').find((p) => p.state.powered && onPin(m, p, 'DT', this.dt) && onPin(m, p, 'SCK', this.sck)) || null; }
  begin(dt, sck, gain = 128) { this.dt = dt | 0; this.sck = sck | 0; this.gain = gain | 0; this.m.pinMode(this.sck, 1); this.m.pinMode(this.dt, 0); }
  set_gain(g) { this.gain = g | 0; }
  is_ready() { busy(this.m, 20); return this.dev() && !this.down ? 1 : 0; }
  *wait_ready() { while (!this.dev() || this.down) yield* this.m.delay(100); }
  *read() { // (one conversion: up to 100 ms; for ever with no HX711 answering)
    yield* this.wait_ready(); yield* this.m.delay(100); const p = this.dev(); if (!p) return 0; p.state.reads = (p.state.reads || 0) + 1;
    const k = this.gain === 64 ? 0.5 : this.gain === 32 ? 0.25 : 1; return Math.round((HXZ + ((p.state.grams || 0) + HX.platform) * HX.cal + gauss() * 120) * k);
  }
  *read_average(n = 10) { n = Math.max(1, n | 0); let s = 0; for (let i = 0; i < n; i++) s += yield* this.read(); return Math.round(s / n); }
  *get_value(n = 1) { return (yield* this.read_average(n)) - this.offset; }
  *get_units(n = 1) { return (yield* this.get_value(n)) / (this.scale || 1); }
  *tare(n = 10) { this.offset = yield* this.read_average(n); }
  set_scale(f = 1) { this.scale = +f || 1; } get_scale() { return this.scale; }
  set_offset(o = 0) { this.offset = o | 0; } get_offset() { return this.offset; }
  power_down() { this.down = true; } power_up() { this.down = false; }
}
class ToFrt {
  constructor(m) { this.m = m; this.addr = 0x29; this.to = 0; this.tout = false; this.budget = 33000; this.rate = 0.25; this.cont = false; this.ok = false; }
  dev() { return i2c(this.m, 'vl53l0x', this.addr); }
  init() { busy(this.m, 40000); this.ok = !!this.dev(); return this.ok ? 1 : 0; }
  setTimeout(ms) { this.to = ms | 0; } getTimeout() { return this.to; }
  setAddress(a) { this.addr = a & 127; }
  setMeasurementTimingBudget(us) { this.budget = Math.max(20000, us | 0); return 1; }
  setSignalRateLimit(r) { this.rate = +r; return 1; }
  startContinuous() { this.cont = true; } stopContinuous() { this.cont = false; }
  timeoutOccurred() { const t = this.tout; this.tout = false; return t ? 1 : 0; }
  *range() {
    const p = this.dev(); if (!p || !this.ok) { yield* this.m.delay(Math.max(1, this.to || 500)); this.tout = true; return 65535; }
    yield* this.m.delay(this.budget / 1000); p.state.reads = (p.state.reads || 0) + 1;
    const max = (TOF_MAX[p.state.surface] || 1200) * (this.rate <= 0.15 ? 1.6 : 1) * (this.budget >= 100000 ? 1.15 : 1); const d = p.state.mm || 0;
    if (d > max || d < 20) return 8190;
    const sd = (2 + d * 0.012) * Math.sqrt(33000 / this.budget) * (d > 0.8 * max ? 2.5 : 1); return Math.max(20, Math.round(d + 10 + gauss() * sd)); // (its own offset is about +10 mm until calibrated)
  }
  *readRangeSingleMillimeters() { return yield* this.range(); }
  *readRangeContinuousMillimeters() { return yield* this.range(); }
}
Object.assign(TYPES, {
  HX711: { inc: ['HX711.h'], ctor: [0, 0], methods: { begin: [2, 3, 'void'], set_gain: [1, 1, 'void'], is_ready: [0, 0, 'bool'], wait_ready: [0, 1, 'void', 'y'], read: [0, 0, 'long', 'y'], read_average: [0, 1, 'long', 'y'],
    get_value: [0, 1, 'float', 'y'], get_units: [0, 1, 'float', 'y'], tare: [0, 1, 'void', 'y'], set_scale: [0, 1, 'void'], get_scale: [0, 0, 'float'], set_offset: [0, 1, 'void'], get_offset: [0, 0, 'long'], power_down: [0, 0, 'void'], power_up: [0, 0, 'void'] } },
  VL53L0X: { inc: ['VL53L0X.h'], ctor: [0, 0], methods: { init: [0, 1, 'bool'], setTimeout: [1, 1, 'void'], getTimeout: [0, 0, 'int'], setAddress: [1, 1, 'void'], setMeasurementTimingBudget: [1, 1, 'bool'], setSignalRateLimit: [1, 1, 'bool'],
    startContinuous: [0, 1, 'void'], stopContinuous: [0, 0, 'void'], timeoutOccurred: [0, 0, 'bool'], readRangeSingleMillimeters: [0, 0, 'uint', 'y'], readRangeContinuousMillimeters: [0, 0, 'uint', 'y'] } },
});
Object.assign(MAKERS, { HX711: (m) => new HX711rt(m), VL53L0X: (m) => new ToFrt(m) });
LIB_INCLUDES.push('HX711.h', 'VL53L0X.h');
GLOBALS.Wire[1].push('VL53L0X.h');

export function libRT(m, type, args, line) {
  if (type[0] === '@') { let g = ONE.get(m.ser); if (!g) { g = {}; ONE.set(m.ser, g); } return g[type] || (g[type] = MAKERS[type](m)); }
  const f = MAKERS[type]; if (!f) throw new RtError('R_INTERNAL', { msg: 'no library ' + type }, line);
  return f(m, args || []);
}
