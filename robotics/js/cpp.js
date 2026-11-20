// DUET Robotics Lab 360: the Arduino C/C++ subset, compiled in the browser (no internet, no cloud compiler).
// compile(source) -> { ok, errors, warnings, make, info }. make(rt) builds the sketch: every C function becomes a JavaScript
// generator, so delay() only pauses the sketch (the page keeps running) and the lab runs it on a virtual clock.
// The numbers behave as on an Arduino Uno (ATmega328P): int is 16 bits (32767 + 1 = -32768), long 32 bits, float 32 bits,
// 7 / 2 = 3 with whole numbers. Errors are given in plain words, with the line number (texts: i18n.js, CPP_MSG).
import { LIB4 } from './lib4.js'; // batch 4: the ESP32's and the Mega's libraries (WiFi, WebServer, BluetoothSerial, Serial1–3, touchRead …); hooks marked "batch 4"
import { LIB3 } from './libs3.js'; // batch 3: the module libraries (LCD, OLED, DHT, IRremote, Keypad, Stepper, MFRC522); hooks marked "batch 3"

// ------------------------------------------------------------------ types
// scalar types: bool char byte int uint long ulong float str servo void; arrays: { arr: elemType, dims: [n, ...] }
const INTS = { bool: 0, char: 1, byte: 1, int: 2, uint: 3, long: 4, ulong: 5 };
const isInt = (t) => typeof t === 'string' && t in INTS;
const isNum = (t) => isInt(t) || t === 'float';
const SIZE = { bool: 1, char: 1, byte: 1, int: 2, uint: 2, long: 4, ulong: 4, float: 4, str: 6, servo: 3 };
function promote(a, b) {
  if (a === 'float' || b === 'float') return 'float';
  const r = (t) => (t === 'ulong' ? 5 : t === 'long' ? 4 : t === 'uint' ? 3 : 2);
  const m = Math.max(r(a), r(b));
  return m === 5 ? 'ulong' : m === 4 ? 'long' : m === 3 ? 'uint' : 'int';
}
// keep a JavaScript number inside the range of a C type (as the Uno would)
function wrapCode(code, t) {
  switch (t) {
    case 'int': return `((${code})<<16>>16)`;
    case 'uint': return `((${code})&65535)`;
    case 'long': return `((${code})|0)`;
    case 'ulong': return `((${code})>>>0)`;
    case 'byte': return `((${code})&255)`;
    case 'char': return `((${code})<<24>>24)`;
    case 'bool': return `((${code})?1:0)`;
    default: return code;
  }
}
function wrapVal(v, t) {
  switch (t) {
    case 'int': return (v << 16) >> 16;
    case 'uint': return v & 65535;
    case 'long': return v | 0;
    case 'ulong': return v >>> 0;
    case 'byte': return v & 255;
    case 'char': return (v << 24) >> 24;
    case 'bool': return v ? 1 : 0;
    default: return v;
  }
}
const RANGE = { bool: [0, 1], char: [-128, 127], byte: [0, 255], int: [-32768, 32767], uint: [0, 65535], long: [-2147483648, 2147483647], ulong: [0, 4294967295] };
const ARRAY_CTOR = { bool: 'Uint8Array', char: 'Int8Array', byte: 'Uint8Array', int: 'Int16Array', uint: 'Uint16Array', long: 'Int32Array', ulong: 'Uint32Array', float: 'Float32Array' };
const TYPE_NAME = { bool: 'bool', char: 'char', byte: 'byte', int: 'int', uint: 'unsigned int', long: 'long', ulong: 'unsigned long', float: 'float', str: 'String', servo: 'Servo', void: 'void' };
export const typeName = (t) => (t && t.arr ? TYPE_NAME[t.arr] + '[]' : TYPE_NAME[t] || String(t).replace(/^o:/, '')); // (batch 3: o:DHT -> DHT)

// ------------------------------------------------------------------ the Arduino names the lab knows
export const CONSTS = {
  HIGH: [1, 'int'], LOW: [0, 'int'], INPUT: [0, 'int'], OUTPUT: [1, 'int'], INPUT_PULLUP: [2, 'int'], LED_BUILTIN: [13, 'int'],
  true: [1, 'bool'], false: [0, 'bool'], A0: [14, 'int'], A1: [15, 'int'], A2: [16, 'int'], A3: [17, 'int'], A4: [18, 'int'], A5: [19, 'int'], A6: [20, 'int'], A7: [21, 'int'],
  PI: [Math.PI, 'float'], HALF_PI: [Math.PI / 2, 'float'], TWO_PI: [Math.PI * 2, 'float'], DEG_TO_RAD: [Math.PI / 180, 'float'], RAD_TO_DEG: [180 / Math.PI, 'float'],
  DEC: [10, 'int'], HEX: [16, 'int'], OCT: [8, 'int'], BIN: [2, 'int'], NULL: [0, 'int'], LSBFIRST: [0, 'int'], MSBFIRST: [1, 'int'],
  CHANGE: [1, 'int'], FALLING: [2, 'int'], RISING: [3, 'int'], DEFAULT: [1, 'int'], EXTERNAL: [0, 'int'], INTERNAL: [3, 'int'],
};
Object.assign(CONSTS, LIB3.consts); // batch 3
Object.assign(CONSTS, LIB4.consts); // batch 4: WL_CONNECTED, HTTP_GET, T0–T9 …
// name: [min args, max args, return type, emit(args) -> js, timed (needs yield*)]
const A = (a) => a.map((x) => x.c);
export const FUNCS = {
  pinMode: [2, 2, 'void', (a) => `rt.pinMode(${A(a)})`],
  digitalWrite: [2, 2, 'void', (a) => `rt.dw(${A(a)})`],
  digitalRead: [1, 1, 'int', (a) => `rt.dr(${A(a)})`],
  analogRead: [1, 1, 'int', (a) => `rt.ar(${A(a)})`],
  analogWrite: [2, 2, 'void', (a) => `rt.aw(${A(a)})`],
  analogReference: [1, 1, 'void', () => '0'],
  delay: [1, 1, 'void', (a) => `(yield* rt.delay(${A(a)}))`, true],
  delayMicroseconds: [1, 1, 'void', (a) => `(yield* rt.delayUs(${A(a)}))`, true],
  millis: [0, 0, 'ulong', () => 'rt.millis()'],
  micros: [0, 0, 'ulong', () => 'rt.micros()'],
  tone: [2, 3, 'void', (a) => `rt.tone(${A(a)})`],
  noTone: [1, 1, 'void', (a) => `rt.noTone(${A(a)})`],
  pulseIn: [2, 3, 'ulong', (a) => `(yield* rt.pulseIn(${A(a)}))`, true],
  pulseInLong: [2, 3, 'ulong', (a) => `(yield* rt.pulseIn(${A(a)}))`, true],
  map: [5, 5, 'long', (a) => `rt.map(${A(a)})`],
  constrain: [3, 3, null, (a) => `rt.constrain(${A(a)})`],
  min: [2, 2, null, (a) => `Math.min(${A(a)})`],
  max: [2, 2, null, (a) => `Math.max(${A(a)})`],
  abs: [1, 1, null, (a) => `Math.abs(${A(a)})`],
  sq: [1, 1, null, (a) => `((${a[0].c})*(${a[0].c}))`],
  sqrt: [1, 1, 'float', (a) => `Math.sqrt(${A(a)})`],
  pow: [2, 2, 'float', (a) => `Math.pow(${A(a)})`],
  sin: [1, 1, 'float', (a) => `Math.sin(${A(a)})`],
  cos: [1, 1, 'float', (a) => `Math.cos(${A(a)})`],
  tan: [1, 1, 'float', (a) => `Math.tan(${A(a)})`],
  atan2: [2, 2, 'float', (a) => `Math.atan2(${A(a)})`],
  floor: [1, 1, 'float', (a) => `Math.floor(${A(a)})`],
  ceil: [1, 1, 'float', (a) => `Math.ceil(${A(a)})`],
  round: [1, 1, 'long', (a) => `Math.round(${A(a)})`],
  fabs: [1, 1, 'float', (a) => `Math.abs(${A(a)})`],
  log: [1, 1, 'float', (a) => `Math.log(${A(a)})`],
  exp: [1, 1, 'float', (a) => `Math.exp(${A(a)})`],
  random: [1, 2, 'long', (a) => `rt.random(${A(a)})`],
  randomSeed: [1, 1, 'void', (a) => `rt.randomSeed(${A(a)})`],
  bitRead: [2, 2, 'int', (a) => `(((${a[0].c})>>(${a[1].c}))&1)`],
  bitSet: [2, 2, 'void', null], bitClear: [2, 2, 'void', null], bitWrite: [3, 3, 'void', null], // assignments: see call()
  bit: [1, 1, 'ulong', (a) => `((1<<(${a[0].c}))>>>0)`],
  highByte: [1, 1, 'byte', (a) => `(((${a[0].c})>>8)&255)`],
  lowByte: [1, 1, 'byte', (a) => `((${a[0].c})&255)`],
  isDigit: [1, 1, 'bool', (a) => `(+((${a[0].c})>=48&&(${a[0].c})<=57))`],
  shiftOut: [4, 4, 'void', (a) => `rt.shiftOut(${A(a)})`],
  interrupts: [0, 0, 'void', () => '0'], noInterrupts: [0, 0, 'void', () => '0'],
  yield: [0, 0, 'void', () => '0'],
  String: [1, 2, 'str', null], // String(x), String(x, HEX): see call()
};
const SERIAL = {
  begin: [1, 2, 'void', (a) => `rt.ser.begin(${a[0].c})`],
  end: [0, 0, 'void', () => 'rt.ser.end()'],
  print: [1, 2, 'void', null, true], println: [0, 2, 'void', null, true], write: [1, 1, 'int', null, true],
  available: [0, 0, 'int', () => 'rt.ser.available()'],
  read: [0, 0, 'int', () => 'rt.ser.read()'],
  peek: [0, 0, 'int', () => 'rt.ser.peek()'],
  parseInt: [0, 0, 'long', () => '(yield* rt.ser.parseInt())', true],
  parseFloat: [0, 0, 'float', () => '(yield* rt.ser.parseFloat())', true],
  readString: [0, 0, 'str', () => '(yield* rt.ser.readString())', true],
  readStringUntil: [1, 1, 'str', (a) => `(yield* rt.ser.readStringUntil(${a[0].c}))`, true],
  setTimeout: [1, 1, 'void', (a) => `rt.ser.setTimeout(${a[0].c})`],
  flush: [0, 0, 'void', () => '(yield* rt.ser.flush())', true],
};
const SERVO = {
  attach: [1, 3, 'int', (o, a) => `${o}.attach(${A(a)})`],
  detach: [0, 0, 'void', (o) => `${o}.detach()`],
  write: [1, 1, 'void', (o, a) => `${o}.write(${A(a)})`],
  writeMicroseconds: [1, 1, 'void', (o, a) => `${o}.writeMicroseconds(${A(a)})`],
  read: [0, 0, 'int', (o) => `${o}.read()`],
  attached: [0, 0, 'bool', (o) => `${o}.attached()`],
};
const STRM = {
  length: [0, 0, 'uint', (o) => `${o}.length`],
  toInt: [0, 0, 'long', (o) => `rt.toInt(${o})`],
  toFloat: [0, 0, 'float', (o) => `rt.toFloat(${o})`],
  charAt: [1, 1, 'char', (o, a) => `rt.charAt(${o},${a[0].c})`],
  indexOf: [1, 2, 'int', (o, a) => `${o}.indexOf(rt.S(${a[0].c},'${a[0].t}')${a[1] ? ',' + a[1].c : ''})`],
  substring: [1, 2, 'str', (o, a) => `${o}.substring(${A(a)})`],
  equals: [1, 1, 'bool', (o, a) => `(+(${o}===${a[0].c}))`],
  startsWith: [1, 1, 'bool', (o, a) => `(+${o}.startsWith(${a[0].c}))`],
  endsWith: [1, 1, 'bool', (o, a) => `(+${o}.endsWith(${a[0].c}))`],
  trim: [0, 0, 'void', null], toUpperCase: [0, 0, 'void', null], toLowerCase: [0, 0, 'void', null], // change the String itself
};
Object.assign(FUNCS, LIB4.funcs); // batch 4: touchRead, ledcWrite, analogReadMilliVolts … (the 6th item: the board must be an ESP32)
export const KNOWN_NAMES = [...Object.keys(CONSTS), ...Object.keys(FUNCS), 'Serial', 'Servo', 'setup', 'loop', 'void', 'int', 'long', 'float', 'double', 'bool', 'boolean', 'byte', 'char', 'unsigned', 'const', 'String',
  'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'break', 'continue', 'return', 'default', 'sizeof', 'include', 'define'];
KNOWN_NAMES.push(...Object.keys(LIB3.types).filter(LIB3.isType), ...Object.keys(LIB3.globals), ...Object.keys(LIB3.funcs)); // batch 3

// ------------------------------------------------------------------ errors
class CErr extends Error { constructor(code, line, args) { super(code); this.code = code; this.line = line; this.args = args || {}; } }
function lev(a, b) {
  const m = a.length, n = b.length; if (Math.abs(m - n) > 3) return 9; const d = Array.from({ length: m + 1 }, (_, i) => [i]);
  for (let j = 1; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[m][n];
}
export function suggest(name, pool) {
  const low = name.toLowerCase(); let best = null, bd = 9;
  for (const p of pool) {
    if (p === name) continue;
    if (p.toLowerCase() === low) return { s: p, caps: true };
    const d = lev(low, p.toLowerCase());
    if (name.length >= 3 && d < bd && d <= (name.length > 5 ? 2 : 1)) { bd = d; best = p; }
  }
  return best ? { s: best, caps: false } : null;
}

// ------------------------------------------------------------------ tokens
const OPS = ['<<=', '>>=', '...', '->', '++', '--', '<<', '>>', '<=', '>=', '==', '!=', '&&', '||', '+=', '-=', '*=', '/=', '%=', '&=', '|=', '^=', '::',
  '+', '-', '*', '/', '%', '<', '>', '=', '!', '~', '&', '|', '^', '?', ':', ';', ',', '.', '(', ')', '[', ']', '{', '}'];
function lex(src, info) {
  const toks = []; const macros = info.macros; let i = 0, line = 1, lineStart = true;
  const n = src.length;
  const push = (t, v, extra) => { toks.push(Object.assign({ t, v, line }, extra)); lineStart = false; };
  while (i < n) {
    const c = src[i];
    if (c === '\n') { line++; i++; lineStart = true; continue; }
    if (c === ' ' || c === '\t' || c === '\r' || c === '\f' || c === '\v' || c === '\u00a0') { i++; continue; }
    if (c === '/' && src[i + 1] === '/') { while (i < n && src[i] !== '\n') i++; continue; }
    if (c === '/' && src[i + 1] === '*') { const l0 = line; i += 2; while (i < n && !(src[i] === '*' && src[i + 1] === '/')) { if (src[i] === '\n') line++; i++; } if (i >= n) throw new CErr('E_COMMENT', l0); i += 2; continue; }
    if (c === '#' && lineStart) { // a preprocessor line
      let j = i + 1, text = '';
      while (j < n && src[j] !== '\n') { if (src[j] === '\\' && src[j + 1] === '\n') { j += 2; line++; continue; } text += src[j]; j++; }
      text = text.replace(/\/\/.*$/, '').replace(/\/\*.*?\*\//g, '').trim();
      const m = /^(\w+)\s*(.*)$/.exec(text) || [];
      const dir = m[1] || '', rest = (m[2] || '').trim();
      if (dir === 'include') {
        const h = /^[<"]\s*([\w./]+)\s*[>"]$/.exec(rest); if (!h) throw new CErr('E_INCLUDE', line, { text: rest });
        info.includes.push(h[1]);
        // (batch 12) the Arduino Servo library has no ESP32 version: the real IDE stops with an #error; ESP32Servo.h is the ESP32's
        if (h[1] === 'Servo.h' && info.board && info.board.id === 'esp32') throw new CErr('E_SERVO_ESP', line);
        if (h[1] === 'ESP32Servo.h' && !(info.board && info.board.id === 'esp32')) throw new CErr('E_ESPSERVO_ONLY', line);
        if (!/^(Arduino\.h|Servo\.h|ESP32Servo\.h|math\.h|stdlib\.h|SoftwareSerial\.h|Wire\.h)$/.test(h[1]) && !LIB3.includes.includes(h[1]) && !LIB4.includes.includes(h[1])) info.warnings.push({ code: 'W_LIBRARY', line, args: { lib: h[1] } });
      } else if (dir === 'define') {
        const d = /^([A-Za-z_]\w*)(\()?\s*(.*)$/.exec(rest); if (!d) throw new CErr('E_DEFINE', line);
        if (d[2]) throw new CErr('E_UNSUPPORTED', line, { what: '#define ' + d[1] + '(…)' });
        const sub = lex(d[3], { macros: {}, includes: [], warnings: [] }).filter((t) => t.t !== 'eof');
        sub.forEach((t) => { t.line = line; });
        macros[d[1]] = sub;
      } else if (dir === 'pragma' || dir === 'ifndef' || dir === 'ifdef' || dir === 'endif' || dir === 'undef' || dir === 'if' || dir === 'else') {
        if (dir === 'undef') delete macros[rest];
      } else throw new CErr('E_PREPROC', line, { text: '#' + dir });
      i = j; continue;
    }
    lineStart = false;
    if (/[A-Za-z_]/.test(c)) {
      let j = i + 1; while (j < n && /\w/.test(src[j])) j++;
      const w = src.slice(i, j); i = j;
      if (macros[w]) { for (const t of macros[w]) toks.push(Object.assign({}, t, { line, macro: w })); continue; }
      if (w === 'R' && src[i] === '"') { const r = /^"([^()\\\s"]{0,16})\(/.exec(src.slice(i, i + 20)); const end = r ? src.indexOf(')' + r[1] + '"', i) : -1; if (end < 0) throw new CErr('E_STRING', line); const str = src.slice(i + r[0].length, end); push('str', str); line += (str.match(/\n/g) || []).length; i = end + r[1].length + 2; continue; } // batch 4: a raw string R"(…)"
      if (/^B[01]{1,8}$/.test(w)) { push('num', parseInt(w.slice(1), 2), { ty: 'int' }); continue; } // Arduino's B1010
      push('id', w); continue;
    }
    if (/[0-9]/.test(c) || (c === '.' && /[0-9]/.test(src[i + 1] || ''))) {
      const m = /^(0[xX][0-9a-fA-F]+|0[bB][01]+|(?:\d+\.\d*|\.\d+)(?:[eE][+-]?\d+)?|\d+[eE][+-]?\d+|\d+)([uUlLfF]*)/.exec(src.slice(i, i + 40));
      let txt = m[1], suf = m[2].toLowerCase(), v, ty;
      if (/^0[xX]/.test(txt)) v = parseInt(txt.slice(2), 16);
      else if (/^0[bB]/.test(txt)) v = parseInt(txt.slice(2), 2);
      else if (/[.eE]/.test(txt) || suf.includes('f')) { v = parseFloat(txt); ty = 'float'; }
      else if (/^0\d/.test(txt)) { if (/[89]/.test(txt)) throw new CErr('E_OCTAL', line, { text: txt }); v = parseInt(txt, 8); }
      else v = parseInt(txt, 10);
      if (!ty) {
        const u = suf.includes('u'), l = suf.includes('l');
        if (l) ty = u || v > 2147483647 ? 'ulong' : 'long';
        else if (u) ty = v > 65535 ? 'ulong' : 'uint';
        else ty = v <= 32767 ? 'int' : v <= 2147483647 ? 'long' : 'ulong';
      }
      if (/[a-zA-Z_]/.test(src[i + m[0].length] || '')) throw new CErr('E_NUMBER', line, { text: src.slice(i, i + m[0].length + 4).split(/[^\w.]/)[0] });
      i += m[0].length; push('num', v, { ty, text: txt + m[2] }); continue;
    }
    if (c === '"') {
      let j = i + 1, s = '';
      while (j < n && src[j] !== '"') { if (src[j] === '\n') throw new CErr('E_STRING', line); if (src[j] === '\\') { s += esc(src[j + 1]); j += 2; continue; } s += src[j]; j++; }
      if (j >= n) throw new CErr('E_STRING', line);
      i = j + 1;
      const prev = toks[toks.length - 1]; if (prev && prev.t === 'str') { prev.v += s; continue; } // "a" "b" -> "ab"
      push('str', s); continue;
    }
    if (c === "'") {
      let j = i + 1, s = '';
      if (src[j] === '\\') { s = esc(src[j + 1]); j += 2; } else { s = src[j]; j++; }
      if (src[j] !== "'") throw new CErr('E_CHAR', line);
      i = j + 1; push('num', s.charCodeAt(0), { ty: 'char', text: "'" + s + "'" }); continue;
    }
    const op = OPS.find((o) => src.startsWith(o, i));
    if (!op) throw new CErr('E_CHARACTER', line, { ch: c });
    i += op.length; push('op', op);
  }
  toks.push({ t: 'eof', v: '', line });
  return toks;
}
function esc(c) { return { n: '\n', t: '\t', r: '\r', '0': '\0', '\\': '\\', "'": "'", '"': '"' }[c] ?? c; }

// ------------------------------------------------------------------ parser
const TYPE_WORDS = new Set(['void', 'bool', 'boolean', 'char', 'byte', 'int', 'short', 'long', 'float', 'double', 'unsigned', 'signed', 'word', 'String', 'size_t',
  'uint8_t', 'int8_t', 'uint16_t', 'int16_t', 'uint32_t', 'int32_t', 'const', 'static', 'volatile', 'Servo', 'unsigned', 'auto']);
for (const k of Object.keys(LIB3.types)) if (LIB3.isType(k)) TYPE_WORDS.add(k); // batch 3: LiquidCrystal_I2C, DHT, Keypad, …
for (const k of Object.keys(LIB4.types)) if (LIB4.isType(k)) TYPE_WORDS.add(k); // batch 4: WebServer, BluetoothSerial, …
class Parser {
  constructor(toks) { this.toks = toks; this.p = 0; }
  get tok() { return this.toks[this.p]; }
  peek(k = 1) { return this.toks[Math.min(this.p + k, this.toks.length - 1)]; }
  is(v) { const t = this.tok; return t.t === 'op' && t.v === v; }
  isId(v) { const t = this.tok; return t.t === 'id' && t.v === v; }
  next() { const t = this.tok; if (this.p < this.toks.length - 1) this.p++; return t; }
  eat(v) { if (this.is(v)) { this.next(); return true; } return false; }
  expect(v, what) {
    if (this.is(v)) return this.next();
    const prev = this.toks[this.p - 1] || this.tok, t = this.tok;
    if (v === ';' && prev && t.line > prev.line) throw new CErr('E_SEMI', prev.line);
    if (v === ';') throw new CErr('E_SEMI_HERE', t.line, { got: show(t) });
    if (t.t === 'eof') throw new CErr(v === '}' ? 'E_EOF_BRACE' : 'E_EOF', prev.line, { want: v });
    throw new CErr('E_EXPECTED', t.line, { want: v, got: show(t), what: what || '' });
  }
  ident(what) { const t = this.tok; if (t.t !== 'id') throw new CErr('E_NAME', t.line, { got: show(t), what: what || '' }); this.next(); return t; }
  startsType() {
    const t = this.tok; if (t.t !== 'id') return false;
    if (!TYPE_WORDS.has(t.v)) return false;
    return true;
  }
  // a type: specifiers in any order (const unsigned long ...) -> 'int' | 'ulong' | ... ; ptr: char* / const char*
  type() {
    const line = this.tok.line; let words = [], isConst = false;
    while (this.tok.t === 'id' && TYPE_WORDS.has(this.tok.v)) {
      const w = this.next().v;
      if (w === 'const') isConst = true; else if (w !== 'static' && w !== 'volatile') words.push(w);
    }
    let ptr = 0; while (this.is('*') || this.is('&')) { if (this.next().v === '*') ptr++; }
    const s = words.join(' ');
    const map = {
      'void': 'void', 'bool': 'bool', 'boolean': 'bool', 'char': 'char', 'signed char': 'char', 'unsigned char': 'byte', 'byte': 'byte', 'uint8_t': 'byte', 'int8_t': 'char',
      'int': 'int', 'short': 'int', 'short int': 'int', 'signed': 'int', 'signed int': 'int', 'int16_t': 'int', 'unsigned': 'uint', 'unsigned int': 'uint', 'unsigned short': 'uint', 'word': 'uint', 'uint16_t': 'uint', 'size_t': 'uint',
      'long': 'long', 'long int': 'long', 'signed long': 'long', 'long long': 'long', 'int32_t': 'long', 'unsigned long': 'ulong', 'unsigned long int': 'ulong', 'uint32_t': 'ulong', 'unsigned long long': 'ulong',
      'float': 'float', 'double': 'float', 'long double': 'float', 'String': 'str', 'Servo': 'servo', 'auto': 'auto',
    };
    let t = map[s] || (LIB3.isType(s) ? 'o:' + s : undefined); // batch 3: a library object
    if (!t && LIB4.isType(s)) t = 'o4:' + s; // batch 4
    if (!t) throw new CErr('E_TYPE', line, { text: s });
    if (ptr && !String(t).startsWith('o4:')) { if (t === 'char' || t === 'byte') t = 'str'; else throw new CErr('E_UNSUPPORTED', line, { what: 'pointer (*)' }); }
    return { t, isConst, line };
  }
  program() {
    const items = [];
    while (this.tok.t !== 'eof') {
      const t = this.tok;
      if (t.t === 'op' && t.v === ';') { this.next(); continue; }
      if (t.t === 'id' && (t.v === 'struct' || t.v === 'class' || t.v === 'enum' || t.v === 'typedef' || t.v === 'union')) throw new CErr('E_UNSUPPORTED', t.line, { what: t.v });
      if (t.t === 'id' && (t.v === 'setup' || t.v === 'loop') && this.peek().t === 'op' && this.peek().v === '(') throw new CErr('E_VOID_SETUP', t.line, { name: t.v });
      if (!this.startsType()) {
        if (t.t === 'id') { const sg = suggest(t.v, [...TYPE_WORDS]); throw new CErr(sg ? 'E_TYPE_SUGGEST' : 'E_TOP', t.line, { got: t.v, s: sg && sg.s, caps: sg && sg.caps }); }
        if (t.t === 'op' && t.v === '}') throw new CErr('E_EXTRA_BRACE', t.line);
        throw new CErr('E_TOP', t.line, { got: show(t) });
      }
      const ty = this.type();
      const name = this.ident('name');
      if (this.is('(') && !String(ty.t).startsWith('o:') && !String(ty.t).startsWith('o4:')) items.push(this.func(ty, name)); // (batch 3: `LiquidCrystal_I2C lcd(0x27, 16, 2);` is an object; batch 4: `WebServer server(80);`)
      else { items.push(this.decl(ty, name, true)); }
    }
    return items;
  }
  func(ty, name) {
    this.expect('(');
    const params = [];
    if (!this.is(')')) {
      if (this.isId('void') && this.peek().t === 'op' && this.peek().v === ')') this.next();
      else do {
        const pt = this.type(); const pn = this.ident('parameter');
        let arr = null; if (this.eat('[')) { if (!this.is(']')) this.expr(); this.expect(']'); arr = true; }
        params.push({ name: pn.v, t: arr ? { arr: pt.t, dims: [0] } : pt.t, line: pn.line });
      } while (this.eat(','));
    }
    this.expect(')', 'function');
    if (this.eat(';')) return { k: 'proto', name: name.v, ret: ty.t, params, line: name.line };
    if (!this.is('{')) throw new CErr('E_FUNC_BRACE', this.tok.line, { name: name.v });
    const body = this.block();
    return { k: 'func', name: name.v, ret: ty.t, params, body, line: name.line };
  }
  // int a = 1, b[3] = {1, 2, 3};
  decl(ty, first, top) {
    const vars = []; let name = first;
    for (;;) {
      const dims = []; while (this.eat('[')) { dims.push(this.is(']') ? null : this.expr()); this.expect(']'); }
      let init = null, ctorArgs = null;
      if (this.eat('=')) init = this.is('{') ? this.initList() : this.assign();
      else if (this.is('(') && ty.t === 'servo') { this.next(); this.expect(')'); }
      else if (this.is('(')) { this.next(); ctorArgs = this.is(')') ? [] : this.args(); this.expect(')'); if (ctorArgs.length === 1) init = ctorArgs[0]; }
      vars.push({ name: name.v, line: name.line, dims, init, ctorArgs }); // (batch 3: ctorArgs make library objects)
      if (!this.eat(',')) break;
      name = this.ident('name');
    }
    this.expect(';');
    return { k: 'decl', ty: ty.t, isConst: ty.isConst, vars, line: first.line, top };
  }
  initList() {
    const line = this.expect('{').line; const items = [];
    if (!this.is('}')) do { if (this.is('}')) break; items.push(this.is('{') ? this.initList() : this.assign()); } while (this.eat(','));
    this.expect('}');
    return { k: 'list', items, line };
  }
  block() {
    const open = this.expect('{'); const body = [];
    while (!this.is('}')) {
      if (this.tok.t === 'eof') throw new CErr('E_EOF_BRACE', open.line);
      body.push(this.stmt());
    }
    this.next();
    return { k: 'block', body, line: open.line };
  }
  stmt() {
    const t = this.tok, line = t.line;
    if (t.t === 'op' && t.v === '{') return this.block();
    if (t.t === 'op' && t.v === ';') { this.next(); return { k: 'empty', line }; }
    if (t.t === 'id') {
      switch (t.v) {
        case 'if': {
          this.next(); this.expect('(', 'if'); const c = this.expr(); this.expect(')', 'if');
          const semi = this.is(';') && this.peek().t === 'op' && this.peek().v === '{';
          const a = this.stmt(); let b = null;
          if (this.isId('else')) { this.next(); b = this.stmt(); }
          return { k: 'if', c, a, b, line, semi };
        }
        case 'while': { this.next(); this.expect('(', 'while'); const c = this.expr(); this.expect(')', 'while'); return { k: 'while', c, body: this.stmt(), line }; }
        case 'do': { this.next(); const body = this.stmt(); if (!this.isId('while')) throw new CErr('E_EXPECTED', this.tok.line, { want: 'while', got: show(this.tok) }); this.next(); this.expect('('); const c = this.expr(); this.expect(')'); this.expect(';'); return { k: 'do', c, body, line }; }
        case 'for': {
          this.next(); this.expect('(', 'for');
          let init = null; if (!this.is(';')) { if (this.startsType()) { const ty = this.type(); init = this.decl(ty, this.ident('name'), false); } else { init = { k: 'expr', e: this.expr(), line }; this.expect(';'); } } else this.next();
          const c = this.is(';') ? null : this.expr(); this.expect(';');
          const inc = this.is(')') ? null : this.expr(); this.expect(')', 'for');
          return { k: 'for', init, c, inc, body: this.stmt(), line };
        }
        case 'switch': {
          this.next(); this.expect('('); const e = this.expr(); this.expect(')'); this.expect('{'); const cases = [];
          while (!this.is('}')) {
            if (this.tok.t === 'eof') throw new CErr('E_EOF_BRACE', line);
            if (this.isId('case')) { const cl = this.next().line; const v = this.cond(); this.expect(':'); cases.push({ v, body: [], line: cl }); continue; }
            if (this.isId('default')) { const cl = this.next().line; this.expect(':'); cases.push({ v: null, body: [], line: cl }); continue; }
            if (!cases.length) throw new CErr('E_CASE', this.tok.line);
            cases[cases.length - 1].body.push(this.stmt());
          }
          this.next(); return { k: 'switch', e, cases, line };
        }
        case 'break': this.next(); this.expect(';'); return { k: 'break', line };
        case 'continue': this.next(); this.expect(';'); return { k: 'continue', line };
        case 'return': { this.next(); const e = this.is(';') ? null : this.expr(); this.expect(';'); return { k: 'return', e, line }; }
        case 'else': throw new CErr('E_ELSE', line);
        case 'case': case 'default': throw new CErr('E_CASE', line);
        case 'goto': throw new CErr('E_UNSUPPORTED', line, { what: 'goto' });
      }
      if (this.startsType() && this.peek().t === 'id' && this.peek(2).t === 'op' && this.peek(2).v === '(' && /^(void|int|float|long|bool|boolean|byte)$/.test(t.v) && (this.peek().v === 'loop' || this.peek().v === 'setup' || (this.peek(3).t === 'op' && this.peek(3).v === ')' && this.peek(4).t === 'op' && this.peek(4).v === '{'))) throw new CErr('E_NESTED_FUNC', t.line, { name: this.peek().v });
      if (this.startsType() && !(this.peek().t === 'op' && (this.peek().v === '(' || this.peek().v === '.'))) {
        const ty = this.type(); return this.decl(ty, this.ident('name'), false);
      }
    }
    const e = this.expr(); this.expect(';');
    return { k: 'expr', e, line };
  }
  // expressions, by C precedence
  expr() { let e = this.assign(); while (this.is(',')) { const line = this.next().line; e = { k: 'comma', a: e, b: this.assign(), line }; } return e; }
  assign() {
    const a = this.cond();
    const t = this.tok;
    if (t.t === 'op' && ['=', '+=', '-=', '*=', '/=', '%=', '&=', '|=', '^=', '<<=', '>>='].includes(t.v)) { this.next(); return { k: 'assign', op: t.v, a, b: this.assign(), line: t.line }; }
    return a;
  }
  cond() {
    const c = this.bin(0);
    if (this.is('?')) { const line = this.next().line; const a = this.assign(); this.expect(':'); const b = this.cond(); return { k: 'tern', c, a, b, line }; }
    return c;
  }
  bin(lv) {
    const LV = [['||'], ['&&'], ['|'], ['^'], ['&'], ['==', '!='], ['<', '>', '<=', '>='], ['<<', '>>'], ['+', '-'], ['*', '/', '%']];
    if (lv >= LV.length) return this.unary();
    let a = this.bin(lv + 1);
    while (this.tok.t === 'op' && LV[lv].includes(this.tok.v)) { const t = this.next(); a = { k: 'bin', op: t.v, a, b: this.bin(lv + 1), line: t.line }; }
    return a;
  }
  unary() {
    const t = this.tok;
    if (t.t === 'op' && ['-', '+', '!', '~', '++', '--'].includes(t.v)) { this.next(); const e = this.unary(); return t.v === '++' || t.v === '--' ? { k: 'pre', op: t.v, e, line: t.line } : { k: 'un', op: t.v, e, line: t.line }; }
    if (t.t === 'op' && t.v === '&' && this.peek().t === 'id') { this.next(); return { k: 'addr', e: this.unary(), line: t.line }; } // batch 3: &Wire, &results (other & are refused by Gen)
    if (t.t === 'op' && (t.v === '&' || t.v === '*')) throw new CErr('E_UNSUPPORTED', t.line, { what: t.v === '&' ? 'address (&)' : 'pointer (*)' });
    if (t.t === 'op' && t.v === '(' && this.peek().t === 'id' && TYPE_WORDS.has(this.peek().v) && this.peek().v !== 'String') { // (int) x
      this.next(); const ty = this.type(); this.expect(')'); return { k: 'cast', to: ty.t, e: this.unary(), line: t.line };
    }
    if (t.t === 'id' && t.v === 'sizeof') {
      this.next(); this.expect('(');
      if (this.startsType()) { const ty = this.type(); this.expect(')'); return { k: 'num', v: SIZE[ty.t] || 2, ty: 'uint', line: t.line }; }
      const e = this.expr(); this.expect(')'); return { k: 'sizeof', e, line: t.line };
    }
    return this.postfix();
  }
  postfix() {
    let e = this.primary();
    for (;;) {
      const t = this.tok;
      if (t.t !== 'op') break;
      if (t.v === '(') { this.next(); const args = this.is(')') ? [] : this.args(); this.expect(')', 'call'); e = { k: 'call', f: e, args, line: t.line }; continue; }
      if (t.v === '[') { this.next(); const i = this.expr(); this.expect(']'); e = { k: 'index', a: e, i, line: t.line }; continue; }
      if (t.v === '.' || t.v === '->') { this.next(); const m = this.ident('member'); e = { k: 'member', o: e, m: m.v, line: t.line }; continue; }
      if (t.v === '++' || t.v === '--') { this.next(); e = { k: 'post', op: t.v, e, line: t.line }; continue; }
      break;
    }
    return e;
  }
  args() { const a = []; do a.push(this.assign()); while (this.eat(',')); return a; }
  primary() {
    const t = this.tok;
    if (t.t === 'num') { this.next(); return { k: 'num', v: t.v, ty: t.ty, line: t.line, text: t.text }; }
    if (t.t === 'str') { this.next(); return { k: 'str', v: t.v, line: t.line }; }
    if (t.t === 'id') {
      this.next();
      if (TYPE_WORDS.has(t.v) && this.is('(')) { // int(x), float(x), String(x)
        if (t.v === 'String') return { k: 'id', name: 'String', line: t.line };
        if (LIB3.isType(t.v)) { this.next(); const args = this.is(')') ? [] : this.args(); this.expect(')'); return { k: 'ctor', ty: t.v, args, line: t.line }; } // batch 3: Keypad(…)
        const ty = new Parser([t, { t: 'eof', line: t.line }]).type(); this.expect('('); const e = this.expr(); this.expect(')'); return { k: 'cast', to: ty.t, e, line: t.line };
      }
      return { k: 'id', name: t.v, line: t.line };
    }
    if (t.t === 'op' && t.v === '(') { this.next(); const e = this.expr(); this.expect(')'); return e; }
    if (t.t === 'op' && t.v === '[') return LIB4.lambda(this); // batch 4: [](){ … } for a web route
    if (t.t === 'eof') throw new CErr('E_EOF', (this.toks[this.p - 1] || t).line, { want: '' });
    throw new CErr('E_EXPR', t.line, { got: show(t) });
  }
  // a case label: a constant
}
function show(t) { return t.t === 'eof' ? '(end)' : t.t === 'str' ? '"' + t.v + '"' : t.text || String(t.v); }

// ------------------------------------------------------------------ code generation (with the types checked)
class Gen {
  constructor(info) { this.info = info; this.scopes = [new Map()]; this.funcs = new Map(); this.tmp = 0; this.fn = null; this.loops = 0; this.sw = 0; this.uid = 0; }
  err(code, line, args) { throw new CErr(code, line, args); }
  warn(code, line, args) { this.info.warnings.push({ code, line, args: args || {} }); }
  push() { this.scopes.push(new Map()); }
  pop() { this.scopes.pop(); }
  declare(name, v, line) {
    const s = this.scopes[this.scopes.length - 1];
    if (s.has(name)) this.err('E_REDECLARED', line, { name, first: s.get(name).line });
    if (this.scopes.length === 1 && this.funcs.has(name)) this.err('E_REDECLARED', line, { name, first: this.funcs.get(name).line });
    v.js = 'v_' + name + (this.scopes.length > 1 && this.lookup(name) ? '_' + (++this.uid) : ''); v.line = line; s.set(name, v); return v;
  }
  lookup(name) { for (let i = this.scopes.length - 1; i >= 0; i--) { const v = this.scopes[i].get(name); if (v) return v; } return null; }
  pool() { const names = []; for (const s of this.scopes) names.push(...s.keys()); return [...names, ...this.funcs.keys(), ...KNOWN_NAMES]; }
  unknown(name, line, isCall) {
    const sg = suggest(name, this.pool());
    if (name === 'Serial' || name === 'Servo') this.err('E_NAME_USE', line, { name });
    this.err(isCall ? 'E_UNKNOWN_FUNC' : 'E_UNKNOWN', line, { name, s: sg && sg.s, caps: sg && sg.caps });
  }
  t() { const n = '$t' + (++this.tmp); this.fn.tmps.push(n); return n; }
  program(items) {
    // functions first (the Arduino IDE lets a sketch call a function written further down)
    for (const it of items) if (it.k === 'func' || it.k === 'proto') {
      const f = this.funcs.get(it.name);
      if (f && f.body && it.k === 'func') this.err('E_REDECLARED', it.line, { name: it.name, first: f.line });
      if (FUNCS[it.name] && it.k === 'func') this.err('E_BUILTIN_NAME', it.line, { name: it.name });
      if (!f || it.k === 'func') this.funcs.set(it.name, { ret: it.ret, params: it.params, line: it.line, body: it.k === 'func' ? it.body : null, js: 'f_' + it.name });
    }
    for (const [name, f] of this.funcs) if (!f.body) this.err('E_NO_BODY', f.line, { name });
    if (!this.funcs.has('setup')) this.err('E_NO_SETUP', 1);
    if (!this.funcs.has('loop')) this.err('E_NO_LOOP', 1);
    for (const nm of ['setup', 'loop']) { const f = this.funcs.get(nm); if (f.ret !== 'void') this.err('E_SETUP_TYPE', f.line, { name: nm }); if (f.params.length) this.err('E_SETUP_PARAMS', f.line, { name: nm }); }
    const out = ['"use strict";'];
    const ginit = [];
    this.fn = { tmps: [], ret: 'void', name: '$init' };
    for (const it of items) if (it.k === 'decl') { const code = this.decl(it, true); out.push(code.decl); if (code.init) ginit.push(code.init); }
    const gt = this.fn.tmps;
    out.push(`function* $init(){${gt.length ? 'let ' + gt.join(',') + ';' : ''}${ginit.join('\n')}}`);
    for (const it of items) if (it.k === 'func') out.push(this.func(it));
    const vars = [...this.scopes[0].values()].filter((v) => !v.k).map((v) => `${JSON.stringify(v.name)}:[${v.js},${JSON.stringify(typeName(v.t))}]`);
    out.push(`return {init:$init, setup:f_setup, loop:f_loop, vars:()=>({${vars.join(',')}})};`);
    return out.join('\n');
  }
  func(it) {
    const f = this.funcs.get(it.name);
    this.fn = { tmps: [], ret: it.ret, name: it.name }; this.tmp = 0;
    this.push();
    const ps = it.params.map((p) => this.declare(p.name, { name: p.name, t: p.t, isParam: true }, p.line));
    const body = this.stmts(it.body.body);
    this.pop();
    const pre = (this.fn.tmps.length ? 'let ' + this.fn.tmps.join(',') + ';' : '') + ps.filter((p) => isInt(p.t)).map((p) => `${p.js}=${wrapCode(p.js, p.t)};`).join('');
    return `function* ${f.js}(${ps.map((p) => p.js).join(',')}){if(rt.enter(${it.line}))yield 0;try{${pre}\n${body}\n}finally{rt.depth--;}}`;
  }
  stmts(list) { this.push(); const s = list.map((x) => this.stmt(x)).join('\n'); this.pop(); return s; }
  stmt(s) {
    const L = `rt.L=${s.line};`;
    switch (s.k) {
      case 'block': return '{' + this.stmts(s.body) + '}';
      case 'empty': return ';';
      case 'decl': { const d = this.decl(s, false); return L + d.decl + (d.init || ''); }
      case 'expr': {
        const e = this.ex(s.e);
        if (s.e.k === 'bin' && (s.e.op === '==' || s.e.op === '<' || s.e.op === '>') && s.e.a.k !== 'call') this.warn('W_NO_EFFECT', s.line, { op: s.e.op });
        return L + e.c + ';';
      }
      case 'if': {
        if (s.semi) this.warn('W_IF_SEMI', s.line);
        if (s.c.k === 'assign' && s.c.op === '=') this.warn('W_ASSIGN_IF', s.line);
        const c = this.cond(s.c);
        return `${L}if(${c}){${this.stmts([s.a])}}` + (s.b ? `else{${this.stmts([s.b])}}` : '');
      }
      case 'while': { if (s.c.k === 'assign' && s.c.op === '=') this.warn('W_ASSIGN_IF', s.line); this.loops++; const b = this.stmts([s.body]); this.loops--; return `${L}while(${this.cond(s.c)}){if(rt.k())yield 0;${b}}`; }
      case 'do': { this.loops++; const b = this.stmts([s.body]); this.loops--; return `${L}do{if(rt.k())yield 0;${b}}while(${this.cond(s.c)});`; }
      case 'for': {
        this.push();
        const init = s.init ? (s.init.k === 'decl' ? (() => { const d = this.decl(s.init, false); return d.decl + (d.init || ''); })() : this.ex(s.init.e).c + ';') : '';
        const c = s.c ? this.cond(s.c) : 'true'; const inc = s.inc ? this.ex(s.inc).c : '';
        this.loops++; const b = this.stmts([s.body]); this.loops--;
        this.pop();
        return `${L}{${init}for(;${c};${inc}){if(rt.k())yield 0;${b}}}`;
      }
      case 'switch': {
        const e = this.ex(s.e); if (!isInt(e.t)) this.err('E_SWITCH', s.line);
        this.sw++;
        const cs = s.cases.map((c) => {
          let lab = 'default:';
          if (c.v) { const v = this.ex(c.v); if (v.k === undefined) this.err('E_CASE_CONST', c.line); lab = `case ${v.k}:`; }
          return lab + '{' + this.stmts(c.body) + '}';
        });
        this.sw--;
        return `${L}switch(${e.c}){${cs.join('\n')}}`;
      }
      case 'break': if (!this.loops && !this.sw) this.err('E_BREAK', s.line); return L + 'break;';
      case 'continue': if (!this.loops) this.err('E_CONTINUE', s.line); return L + 'continue;';
      case 'return': {
        const r = this.fn.ret;
        if (!s.e) { if (r !== 'void') this.err('E_RETURN_VALUE', s.line, { name: this.fn.name, t: typeName(r) }); return L + 'return;'; }
        if (r === 'void') this.err('E_RETURN_VOID', s.line, { name: this.fn.name });
        const e = this.ex(s.e); return L + 'return ' + this.conv(e, r, s.line) + ';';
      }
    }
    this.err('E_UNSUPPORTED', s.line, { what: s.k });
  }
  // a declaration: let v_x = ...;   (globals: the value is given in $init, in order)
  decl(d, top) {
    if (d.ty === 'void') this.err('E_VOID_VAR', d.line);
    const parts = [], inits = [];
    for (const v of d.vars) {
      let t = d.ty, dims = null;
      if (v.dims.length) {
        if (t === 'servo') this.err('E_UNSUPPORTED', v.line, { what: 'Servo[]' });
        dims = v.dims.map((x, i) => {
          if (x === null) { if (i === 0 && v.init && v.init.k === 'list') return v.init.items.length; if (i === 0 && v.init && v.init.k === 'str') return -1; this.err('E_ARRAY_SIZE', v.line, { name: v.name }); }
          const e = this.ex(x); if (e.k === undefined || !isInt(e.t)) this.err('E_ARRAY_CONST', v.line, { name: v.name }); if (e.k <= 0 || e.k > 2000) this.err('E_ARRAY_RANGE', v.line, { name: v.name, n: e.k });
          return e.k;
        });
        if (t === 'char' && v.init && v.init.k === 'str') { t = 'str'; dims = null; } // char msg[] = "Hi"  -> a String
        else t = { arr: t, dims };
      }
      if (t === 'auto') { if (!v.init || v.init.k === 'list') this.err('E_TYPE', v.line, { text: 'auto' }); }
      let initCode = null, k;
      if (t && t.arr) initCode = this.arrInit(t, v.init, v.line);
      else if (t === 'servo') { if (!hasServoInc(this.info)) this.err('E_SERVO_INCLUDE', v.line); initCode = 'rt.servo()'; }
      else if (String(t).startsWith('o:')) initCode = LIB3.decl(this, t.slice(2), v); // batch 3: a library object
      else if (String(t).startsWith('o4:')) initCode = LIB4.decl(this, t.slice(3), v); // batch 4: WebServer server(80);
      else if (v.init) {
        if (v.init.k === 'list') this.err('E_LIST', v.line, { name: v.name });
        const e = this.ex(v.init); if (t === 'auto') t = e.t;
        initCode = this.conv(e, t, v.line);
        // a constant known while compiling (const int led = 13;)
        if (d.isConst && e.k !== undefined) k = isNum(t) ? wrapVal(t === 'float' ? e.k : Math.trunc(e.k), t) : e.k;
      } else initCode = t === 'str' ? '""' : '0';
      const sym = this.declare(v.name, { name: v.name, t, isConst: d.isConst, k }, v.line);
      if (top) { parts.push(`let ${sym.js};`); inits.push(`rt.L=${v.line};${sym.js}=${initCode};`); }
      else parts.push(`let ${sym.js}=${initCode};`);
    }
    return { decl: parts.join(''), init: inits.join('') };
  }
  arrInit(t, init, line) {
    const el = t.arr, dims = t.dims;
    const ctor = (n) => (ARRAY_CTOR[el] ? `new ${ARRAY_CTOR[el]}(${n})` : `Array(${n}).fill(${el === 'str' ? '""' : '0'})`);
    const build = (level, list) => {
      const n = dims[level];
      if (level === dims.length - 1) {
        if (!list) return ctor(n);
        if (list.k !== 'list') this.err('E_LIST_NEEDED', line);
        if (list.items.length > n) this.err('E_LIST_LONG', line, { n, got: list.items.length });
        const vals = list.items.map((x) => this.conv(this.ex(x), el, line));
        while (vals.length < n) vals.push(el === 'str' ? '""' : '0');
        return ARRAY_CTOR[el] ? `${ARRAY_CTOR[el]}.from([${vals}])` : `[${vals}]`;
      }
      const items = list ? list.items : []; if (list && list.k !== 'list') this.err('E_LIST_NEEDED', line);
      const out = []; for (let i = 0; i < n; i++) out.push(build(level + 1, items[i] || null));
      return `[${out}]`;
    };
    return build(0, init);
  }
  // convert a value to the type of a variable (as the C compiler does on =)
  conv(e, t, line) {
    if (t === 'void') return e.c;
    if (e.t === 'void') this.err('E_VOID_VALUE', line, { name: e.fname || '' });
    if (t === 'str') return e.t === 'str' ? e.c : `rt.S(${e.c},'${e.t}')`;
    if (t === 'servo' || (t && t.arr) || String(t).startsWith('o:')) { if (JSON.stringify(e.t) !== JSON.stringify(t)) this.err('E_ASSIGN_TYPE', line, { a: typeName(e.t), b: typeName(t) }); return e.c; }
    if (String(e.t).startsWith('o:')) this.err('E_ASSIGN_TYPE', line, { a: typeName(e.t), b: typeName(t) }); // batch 3
    if (e.t === 'str') this.err('E_STR_TO_NUM', line, { t: typeName(t) });
    if (e.t && e.t.arr) this.err('E_ARRAY_VALUE', line);
    if (e.t === 'servo') this.err('E_ASSIGN_TYPE', line, { a: 'Servo', b: typeName(t) });
    if (e.k !== undefined && isNum(t)) { // a known number: put it in directly (and say when it does not fit)
      const w = wrapVal(t === 'float' ? e.k : Math.trunc(e.k), t);
      if (isInt(t) && t !== 'bool' && Number.isFinite(e.k) && Math.trunc(e.k) !== w && !(e.t === 'char')) this.warn('W_FIT', line, { v: Math.trunc(e.k), t: typeName(t), w });
      return String(w);
    }
    if (t === 'float') return e.c;
    if (t === 'bool') return e.t === 'bool' ? e.c : wrapCode(e.c, 'bool');
    if (isInt(e.t) && RANGE[e.t][0] >= RANGE[t][0] && RANGE[e.t][1] <= RANGE[t][1]) return e.c;
    return wrapCode(e.c, t);
  }
  cond(e) { const c = this.ex(e); if (c.t === 'void') this.err('E_VOID_VALUE', e.line, { name: c.fname || '' }); if (c.t === 'str' || (c.t && c.t.arr)) this.err('E_COND', e.line); return c.c; }
  // an expression -> { c: js, t: type, k: value when known }
  ex(e) {
    switch (e.k) {
      case 'num': return { c: String(e.v), t: e.ty, k: e.v };
      case 'str': return { c: JSON.stringify(e.v), t: 'str', k: e.v };
      case 'id': {
        const v = this.lookup(e.name);
        if (v) { if (v.k !== undefined) return { c: typeof v.k === 'string' ? JSON.stringify(v.k) : String(v.k), t: v.t, k: v.k, sym: v }; return { c: v.js, t: v.t, sym: v }; } // (batch 4: a const text, like const char* ssid = "…", stays in quotes)
        { const bc = this.info.board && this.info.board.consts; if (bc && bc[e.name] !== undefined) return { c: String(bc[e.name]), t: 'int', k: bc[e.name] }; } // batch 4: A0 on a Mega is 54, LED_BUILTIN on an ESP32 is 2
        if (e.name in CONSTS) { const [val, ty] = CONSTS[e.name]; return { c: String(val), t: ty, k: val }; }
        if (e.name === 'Serial') return { c: '1', t: 'bool', k: 1 };
        if (LIB3.globals[e.name]) return LIB3.global(this, e.name, e.line); // batch 3: IrReceiver, Wire, SPI
        if (LIB4.globals[e.name]) return LIB4.global(this, e.name, e.line); // batch 4: WiFi, Serial1–3
        if (this.funcs.has(e.name) || FUNCS[e.name]) this.err('E_CALL_PARENS', e.line, { name: e.name });
        this.unknown(e.name, e.line, false);
      }
      // falls through (never)
      case 'comma': { const a = this.ex(e.a), b = this.ex(e.b); return { c: `(${a.c},${b.c})`, t: b.t }; }
      case 'tern': {
        const c = this.cond(e.c), a = this.ex(e.a), b = this.ex(e.b);
        let t = a.t === 'str' || b.t === 'str' ? 'str' : isNum(a.t) && isNum(b.t) ? promote(a.t, b.t) : a.t;
        if (a.t === 'bool' && b.t === 'bool') t = 'bool';
        const ac = t === 'str' ? this.conv(a, 'str', e.line) : a.c, bc = t === 'str' ? this.conv(b, 'str', e.line) : b.c;
        return { c: `((${c})?(${ac}):(${bc}))`, t };
      }
      case 'un': {
        const a = this.ex(e.e);
        if (!isNum(a.t)) this.err('E_OPERAND', e.line, { op: e.op, t: typeName(a.t) });
        if (e.op === '!') return a.k !== undefined ? { c: String(+!a.k), t: 'bool', k: +!a.k } : { c: `(+!(${a.c}))`, t: 'bool' };
        if (e.op === '+') return { c: a.c, t: a.t === 'float' ? 'float' : promote(a.t, 'int'), k: a.k };
        const t = a.t === 'float' ? 'float' : promote(a.t, 'int');
        if (e.op === '~' && t === 'float') this.err('E_OPERAND', e.line, { op: '~', t: 'float' });
        if (a.k !== undefined) { const v = wrapVal(e.op === '-' ? -a.k : ~a.k, t); return { c: v < 0 ? `(${v})` : String(v), t, k: v }; }
        return { c: wrapCode(`${e.op}(${a.c})`, t), t };
      }
      case 'cast': {
        const a = this.ex(e.e); const t = e.to;
        if (t === 'str') return { c: this.conv(a, 'str', e.line), t: 'str' };
        if (!isNum(a.t)) this.err('E_OPERAND', e.line, { op: '(' + typeName(t) + ')', t: typeName(a.t) });
        if (a.k !== undefined) { const v = wrapVal(t === 'float' ? a.k : Math.trunc(a.k), t); return { c: v < 0 ? `(${v})` : String(v), t, k: v }; }
        return { c: t === 'float' ? `(+(${a.c}))` : wrapCode(a.c, t), t };
      }
      case 'sizeof': {
        const a = this.ex(e.e); const t = a.t;
        if (t && t.arr) { const n = t.dims.reduce((x, y) => x * y, 1); if (!n) this.err('E_SIZEOF_PARAM', e.line); return { c: String(n * (SIZE[t.arr] || 2)), t: 'uint', k: n * (SIZE[t.arr] || 2) }; }
        if (t === 'str') return { c: `(${a.c}.length+1)`, t: 'uint' };
        return { c: String(SIZE[t] || 2), t: 'uint', k: SIZE[t] || 2 };
      }
      case 'bin': return this.bin(e);
      case 'assign': return this.assign(e);
      case 'pre': case 'post': return this.incdec(e);
      case 'index': {
        const a = this.ex(e.a);
        if (a.t === 'str') { const i = this.ex(e.i); return { c: `rt.charAt(${a.c},${i.c})`, t: 'char' }; }
        if (!a.t || !a.t.arr) this.err('E_NOT_ARRAY', e.line, { name: exprName(e.a) });
        const i = this.ex(e.i); if (!isInt(i.t)) this.err('E_INDEX_TYPE', e.line);
        const rest = a.t.dims.slice(1);
        return { c: `${a.c}[rt.ix(${a.c},${i.c},${JSON.stringify(exprName(e.a))})]`, t: rest.length ? { arr: a.t.arr, dims: rest } : a.t.arr, lv: { arr: a.c, idx: i.c, name: exprName(e.a) } };
      }
      case 'call': return this.call(e);
      case 'addr': return LIB3.addr(this, e); // batch 3
      case 'lambda': return LIB4.genLambda(this, e); // batch 4
      case 'ctor': return { c: LIB3.ctor(this, e.ty, e.args, e.line), t: 'o:' + e.ty }; // batch 3
      case 'member': {
        { const r = LIB3.member(this, e); if (r) return r; } // batch 3: rfid.uid.uidByte, IrReceiver.decodedIRData.command
        if (e.o.k === 'id' && e.o.name === 'Serial') this.err('E_CALL_PARENS', e.line, { name: 'Serial.' + e.m });
        this.err('E_MEMBER', e.line, { name: e.m });
      }
    }
    this.err('E_EXPR', e.line, { got: e.k });
  }
  bin(e) {
    const op = e.op;
    if (op === '&&' || op === '||') {
      const a = this.cond(e.a), b = this.cond(e.b);
      return { c: `((${a})${op}(${b})?1:0)`, t: 'bool' };
    }
    const a = this.ex(e.a), b = this.ex(e.b);
    if (a.t === 'void' || b.t === 'void') this.err('E_VOID_VALUE', e.line, { name: (a.t === 'void' ? a : b).fname || '' });
    if (op === '+' && (a.t === 'str' || b.t === 'str')) {
      if (a.t === 'str' && b.t === 'str' && a.k !== undefined && b.k !== undefined && e.a.k === 'str' && e.b.k === 'str') this.err('E_STR_ADD', e.line);
      return { c: `(${this.conv(a, 'str', e.line)}+${this.conv(b, 'str', e.line)})`, t: 'str' };
    }
    if ((op === '==' || op === '!=') && a.t === 'str' && b.t === 'str') return { c: `(+(${a.c}${op}=${b.c}))`, t: 'bool' };
    for (const x of [a, b]) if (!isNum(x.t)) this.err('E_OPERAND', e.line, { op, t: typeName(x.t) });
    const T = promote(a.t, b.t);
    const known = a.k !== undefined && b.k !== undefined;
    if (['<', '>', '<=', '>=', '==', '!='].includes(op)) {
      const js = op === '==' ? '===' : op === '!=' ? '!==' : op;
      if (known) { const v = +eval1(a.k, js, b.k); return { c: String(v), t: 'bool', k: v }; }
      return { c: `(+(${a.c}${js}${b.c}))`, t: 'bool' };
    }
    if (T === 'float' && ['%', '<<', '>>', '&', '|', '^'].includes(op)) this.err(op === '%' ? 'E_MOD_FLOAT' : 'E_OPERAND', e.line, { op, t: 'float' });
    let c, k;
    if (known) {
      const x = a.k, y = b.k; let v;
      switch (op) {
        case '+': v = x + y; break; case '-': v = x - y; break; case '*': v = T === 'float' ? x * y : x * y; break;
        case '/': if (y === 0) this.err('E_DIV0_CONST', e.line); v = T === 'float' ? x / y : Math.trunc(x / y); break;
        case '%': if (y === 0) this.err('E_DIV0_CONST', e.line); v = x % y; break;
        case '<<': v = x << y; break; case '>>': v = T === 'ulong' || T === 'uint' ? x >>> y : x >> y; break;
        case '&': v = x & y; break; case '|': v = x | y; break; case '^': v = x ^ y; break;
      }
      k = T === 'float' ? v : wrapVal(v, T);
      if (T !== 'float' && v !== k && Number.isFinite(v) && (op === '*' || op === '+' || op === '-' || op === '<<')) this.warn('W_OVERFLOW', e.line, { expr: `${a.k} ${op} ${b.k}`, v, t: typeName(T), w: k });
      return { c: k < 0 ? `(${k})` : String(k), t: T, k };
    }
    switch (op) {
      case '+': case '-': c = `(${a.c}${op}${b.c})`; break;
      case '*': c = T === 'float' ? `(${a.c}*${b.c})` : `Math.imul(${a.c},${b.c})`; break;
      case '/': c = T === 'float' ? `(${a.c}/${b.c})` : `rt.idiv(${a.c},${b.c})`; break;
      case '%': c = `rt.imod(${a.c},${b.c})`; break;
      case '<<': c = `(${a.c}<<${b.c})`; break;
      case '>>': c = T === 'ulong' || T === 'uint' ? `(${a.c}>>>${b.c})` : `(${a.c}>>${b.c})`; break;
      default: c = `(${a.c}${op}${b.c})`;
    }
    return { c: T === 'float' ? c : wrapCode(c, T), t: T };
  }
  lvalue(e) {
    const x = this.ex(e);
    if (e.k === 'id') {
      if (!x.sym) this.err('E_NOT_ASSIGNABLE', e.line, { name: e.name });
      if (x.sym.isConst) this.err('E_CONST', e.line, { name: e.name });
      if (x.t && x.t.arr) this.err('E_ARRAY_ASSIGN', e.line, { name: e.name });
      return { get: x.sym.js, t: x.t, set: (v) => `${x.sym.js}=${v}`, simple: true };
    }
    if (e.k === 'index' && x.lv) {
      if (x.t && x.t.arr) this.err('E_ARRAY_ASSIGN', e.line, { name: x.lv.name });
      const sym = this.ex(e.a).sym; if (sym && sym.isConst) this.err('E_CONST', e.line, { name: x.lv.name });
      return { index: x.lv, t: x.t };
    }
    this.err('E_NOT_ASSIGNABLE', e.line, { name: exprName(e) });
  }
  assign(e) {
    const L = this.lvalue(e.a), t = L.t, b = this.ex(e.b);
    let val;
    if (e.op === '=') val = this.conv(b, t, e.line);
    else {
      const op = e.op.slice(0, -1);
      if (L.simple) {
        const cur = { c: L.get, t };
        val = this.conv(this.bin2(op, cur, b, e.line), t, e.line);
        return { c: `(${L.set(val)})`, t };
      }
      const ti = this.t();
      const cur = { c: `${L.index.arr}[${ti}]`, t };
      val = this.conv(this.bin2(op, cur, b, e.line), t, e.line);
      return { c: `(${ti}=rt.ix(${L.index.arr},${L.index.idx},${JSON.stringify(L.index.name)}),${L.index.arr}[${ti}]=${val})`, t };
    }
    if (L.simple) return { c: `(${L.set(val)})`, t };
    return { c: `(${L.index.arr}[rt.ix(${L.index.arr},${L.index.idx},${JSON.stringify(L.index.name)})]=${val})`, t };
  }
  bin2(op, a, b, line) {
    if (op === '+' && (a.t === 'str' || b.t === 'str')) return { c: `(${this.conv(a, 'str', line)}+${this.conv(b, 'str', line)})`, t: 'str' };
    // reuse bin() with already generated operands
    const save = this.ex; const self = this; let i = 0;
    this.ex = function (n) { if (n === '$A' || n === '$B') { return n === '$A' ? a : b; } return save.call(self, n); };
    try { return this.bin({ k: 'bin', op, a: '$A', b: '$B', line }); } finally { this.ex = save; }
  }
  incdec(e) {
    const L = this.lvalue(e.e), t = L.t; const d = e.op === '++' ? '+' : '-';
    if (!isNum(t)) this.err('E_OPERAND', e.line, { op: e.op, t: typeName(t) });
    if (L.simple) {
      if (e.k === 'pre') return { c: `(${L.set(t === 'float' ? `${L.get}${d}1` : wrapCode(`${L.get}${d}1`, t))})`, t };
      const tt = this.t();
      return { c: `(${tt}=${L.get},${L.set(t === 'float' ? `${tt}${d}1` : wrapCode(`${tt}${d}1`, t))},${tt})`, t };
    }
    const ti = this.t(), tv = this.t(); const arr = L.index.arr;
    const head = `${ti}=rt.ix(${arr},${L.index.idx},${JSON.stringify(L.index.name)}),${tv}=${arr}[${ti}],${arr}[${ti}]=${tv}${d}1`;
    return { c: e.k === 'pre' ? `(${head},${arr}[${ti}])` : `(${head},${tv})`, t };
  }
  call(e) {
    const f = e.f;
    if (f.k === 'member') return this.method(e);
    if (f.k !== 'id') this.err('E_CALL', e.line);
    const name = f.name;
    const user = this.funcs.get(name);
    if (user && !this.lookup(name)) {
      if (e.args.length !== user.params.length) this.err('E_ARGS_USER', e.line, { name, need: user.params.length, got: e.args.length });
      const args = e.args.map((x, i) => {
        const p = user.params[i], a = this.ex(x);
        if (p.t && p.t.arr) { if (!a.t || !a.t.arr) this.err('E_ARG_ARRAY', e.line, { name, n: i + 1 }); return a.c; }
        return this.conv(a, p.t, e.line);
      });
      return { c: `(yield* ${user.js}(${args}))`, t: user.ret, fname: name };
    }
    if (this.lookup(name)) this.err('E_NOT_FUNC', e.line, { name });
    if (LIB3.funcs[name]) return LIB3.funcs[name](this, e); // batch 3: F(), makeKeymap(), isnan()
    const B = FUNCS[name];
    if (!B) this.unknown(name, e.line, true);
    const [mn, mx, ret] = B;
    if (B[5] && this.info.board && !this.info.board[B[5]]) this.err('E_BOARD_FUNC', e.line, { name, board: this.info.board.short }); // batch 4: touchRead() on an Uno
    if (e.args.length < mn || e.args.length > mx) this.err('E_ARGS', e.line, { name, min: mn, max: mx, got: e.args.length });
    if (name === 'String') {
      const a = this.ex(e.args[0]);
      if (e.args[1]) { const b = this.ex(e.args[1]); return { c: a.t === 'float' ? `rt.S(${a.c},'float',${b.c})` : `rt.S(${a.c},'${a.t}',${b.c})`, t: 'str' }; }
      return { c: this.conv(a, 'str', e.line), t: 'str' };
    }
    if (name === 'bitSet' || name === 'bitClear' || name === 'bitWrite') {
      const L = this.lvalue(e.args[0]); if (!L.simple) this.err('E_UNSUPPORTED', e.line, { what: name + '(array[i], …)' });
      const n = this.ex(e.args[1]).c;
      const v = name === 'bitSet' ? `${L.get}|(1<<${n})` : name === 'bitClear' ? `${L.get}&~(1<<${n})` : `((${this.ex(e.args[2]).c})?(${L.get}|(1<<${n})):(${L.get}&~(1<<${n})))`;
      return { c: `(${L.set(wrapCode(v, L.t))})`, t: 'void' };
    }
    const args = e.args.map((x) => { const a = this.ex(x); if (a.t === 'void') this.err('E_VOID_VALUE', x.line, { name: a.fname || '' }); if (a.t === 'str') this.err('E_ARG_STR', e.line, { name }); if (a.t && a.t.arr) this.err('E_ARRAY_VALUE', e.line); return a; });
    let t = ret;
    if (!t) t = args.reduce((acc, a) => (acc ? promote(acc, a.t) : a.t === 'float' ? 'float' : promote(a.t, 'int')), null);
    if (name === 'pinMode' || name === 'digitalWrite' || name === 'analogWrite' || name === 'digitalRead' || name === 'analogRead' || name === 'tone' || name === 'noTone' || name === 'pulseIn') {
      const p = args[0]; if (p.k !== undefined) this.info.pins.add(p.k);
      if (name === 'pinMode' && args[1].k !== undefined && ![0, 1, 2].includes(args[1].k)) this.warn('W_PINMODE', e.line);
    }
    return { c: B[3](args), t, fname: name };
  }
  method(e) {
    const o = e.f.o, m = e.f.m;
    if (o.k === 'id' && o.name === 'Serial' && !this.lookup('Serial')) {
      const B = SERIAL[m]; if (!B) { const sg = suggest(m, Object.keys(SERIAL)); this.err('E_SERIAL', e.line, { name: m, s: sg && sg.s, caps: sg && sg.caps }); }
      if (e.args.length < B[0] || e.args.length > B[1]) this.err('E_ARGS', e.line, { name: 'Serial.' + m, min: B[0], max: B[1], got: e.args.length });
      this.info.serial = true;
      const args = e.args.map((x) => this.ex(x));
      if (m === 'print' || m === 'println') {
        const nl = m === 'println' ? '+"\\r\\n"' : '';
        if (!args.length) return { c: `(yield* rt.ser.out("\\r\\n"))`, t: 'void' };
        const a = args[0]; if (a.t === 'void') this.err('E_VOID_VALUE', e.line, { name: a.fname || '' });
        const fmt = args[1] ? args[1].c : 'undefined';
        return { c: `(yield* rt.ser.out(rt.fmt(${a.c},'${typeof a.t === 'string' ? a.t : 'arr'}',${fmt})${nl}))`, t: 'void' };
      }
      if (m === 'write') { const a = args[0]; return { c: `(yield* rt.ser.out(${a.t === 'str' ? a.c : `String.fromCharCode((${a.c})&255)`}))`, t: 'int' }; }
      return { c: B[3](args), t: B[2] };
    }
    const obj = this.ex(o);
    if (obj.t === 'servo') {
      const B = SERVO[m]; if (!B) { const sg = suggest(m, Object.keys(SERVO)); this.err('E_SERVO', e.line, { name: m, s: sg && sg.s, caps: sg && sg.caps }); }
      if (e.args.length < B[0] || e.args.length > B[1]) this.err('E_ARGS', e.line, { name: exprName(o) + '.' + m, min: B[0], max: B[1], got: e.args.length });
      if (!hasServoInc(this.info)) this.err('E_SERVO_INCLUDE', e.line);
      const args = e.args.map((x) => this.ex(x)); if (m === 'attach' && args[0].k !== undefined) this.info.pins.add(args[0].k);
      this.info.servo = true;
      return { c: B[3](obj.c, args), t: B[2] };
    }
    if (String(obj.t).startsWith('o:')) return LIB3.method(this, e, obj, exprName(o)); // batch 3
    if (String(obj.t).startsWith('o4:')) return LIB4.method(this, e, obj, exprName(o)); // batch 4
    if (obj.t === 'str') {
      const B = STRM[m]; if (!B) this.err('E_MEMBER', e.line, { name: m });
      if (e.args.length < B[0] || e.args.length > B[1]) this.err('E_ARGS', e.line, { name: m, min: B[0], max: B[1], got: e.args.length });
      const args = e.args.map((x) => this.ex(x));
      if (m === 'trim' || m === 'toUpperCase' || m === 'toLowerCase') {
        const L = this.lvalue(o); const f = m === 'trim' ? 'trim' : m;
        return { c: L.simple ? `(${L.set(`${L.get}.${f}()`)},0)` : '0', t: 'void' };
      }
      return { c: B[3](obj.c, args), t: B[2] };
    }
    this.err('E_MEMBER', e.line, { name: m });
  }
}
function eval1(x, op, y) { switch (op) { case '<': return x < y; case '>': return x > y; case '<=': return x <= y; case '>=': return x >= y; case '===': return x === y; case '!==': return x !== y; } return false; }
function exprName(e) { if (!e || typeof e === 'string') return ''; if (e.k === 'id') return e.name; if (e.k === 'index') return exprName(e.a); if (e.k === 'member') return exprName(e.o) + '.' + e.m; return ''; }

// ------------------------------------------------------------------ compile
const hasServoInc = (i) => i.includes.includes('Servo.h') || i.includes.includes('ESP32Servo.h'); // (batch 12: the ESP32's servo library)
export function compile(src, board) { // board (batch 4): the board's def, so that its pin names and libraries are checked
  if (board && board.compile) return board.compile(src); // batch 6: a board with its own language (the Raspberry Pi boards: Python, pi6.js)
  const info = { macros: Object.assign({}, LIB4.macros), includes: [], warnings: [], pins: new Set(), servo: false, serial: false, board: board || null };
  try {
    const toks = lex(String(src || ''), info);
    const items = new Parser(toks).program();
    const gen = new Gen(info);
    const js = gen.program(items);
    let factory;
    try { factory = new Function('rt', js); } catch (err) { return { ok: false, errors: [{ code: 'E_INTERNAL', line: 1, args: { msg: String(err.message || err) } }], warnings: info.warnings, js }; }
    return { ok: true, errors: [], warnings: info.warnings, make: (rt) => factory(rt), info, js };
  } catch (err) {
    if (err instanceof CErr) return { ok: false, errors: [{ code: err.code, line: err.line, args: err.args }], warnings: info.warnings };
    return { ok: false, errors: [{ code: 'E_INTERNAL', line: 1, args: { msg: String((err && err.message) || err) } }], warnings: info.warnings };
  }
}
// batch 3: the sketch as a tree (for the block editor, blocks.js) -> { ok, items, includes, macros } or { ok: false, error }
export function parse(src) {
  const info = { macros: {}, includes: [], warnings: [], pins: new Set() };
  try { const items = new Parser(lex(String(src || ''), info)).program(); return { ok: true, items, includes: info.includes, macros: info.macros }; } catch (err) { return { ok: false, error: err instanceof CErr ? { code: err.code, line: err.line, args: err.args } : { code: 'E_INTERNAL', line: 1, args: {} } }; }
}
// syntax colours for the editor: [kind, text] pieces of one line (kinds: kw type fn num str com pre const)
const HL_KW = new Set(['if', 'else', 'for', 'while', 'do', 'switch', 'case', 'default', 'break', 'continue', 'return', 'sizeof', 'const', 'static', 'volatile']);
const HL_TYPE = new Set(['void', 'bool', 'boolean', 'char', 'byte', 'int', 'short', 'long', 'float', 'double', 'unsigned', 'signed', 'word', 'String', 'size_t', 'uint8_t', 'int8_t', 'uint16_t', 'int16_t', 'uint32_t', 'int32_t', 'Servo']);
export function highlight(code) {
  const out = []; const re = /(\/\/.*$|\/\*[\s\S]*?(?:\*\/|$))|(^\s*#.*$)|("(?:\\.|[^"\\])*"?|'(?:\\.|[^'\\])*'?)|(\b0[xX][0-9a-fA-F]+\b|\b\d+\.?\d*(?:[eE][+-]?\d+)?[uUlLfF]*\b)|([A-Za-z_]\w*)|(\s+)|([^\sA-Za-z_0-9"'\/]+|\/)/gm;
  let m;
  while ((m = re.exec(code))) {
    if (m[1]) out.push(['com', m[1]]);
    else if (m[2]) out.push(['pre', m[2]]);
    else if (m[3]) out.push(['str', m[3]]);
    else if (m[4]) out.push(['num', m[4]]);
    else if (m[5]) { const w = m[5]; out.push([HL_KW.has(w) ? 'kw' : HL_TYPE.has(w) || LIB3.isType(w) ? 'type' : w in CONSTS ? 'const' : FUNCS[w] || w === 'Serial' || w === 'setup' || w === 'loop' ? 'fn' : 'id', w]); }
    else out.push(['', m[0]]);
  }
  return out;
}
