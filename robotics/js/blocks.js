// DUET Robotics Lab 360, batch 3: block coding for the Arduino (Class 6–8 and beginners), our own design (MIT).
// Blocks sit beside the C++ they make: every change to the blocks writes the C++ at once (the same compiler and simulator
// run it), and C++ typed by hand is read back into blocks (cpp.js parse()) — what the blocks do not know becomes a grey
// "C++" block, so nothing is ever lost. Comments in the sketch stay with their blocks.
//   the program: the "devices and variables" stack (globals), setup, loop and the sketch's own functions
//   a statement block holds fields (choices, names), slots (round values: a number, a word, or another round block) and
//   C-shaped blocks hold their own list of statements (if, else, loops)
// Touch, mouse, a panel's touch screen, a Quest controller's or hand's ray in the browser: big blocks, drag from the
// palette, drop where the blue line shows (it snaps), drag back to the palette to delete, tap a number or word to change it.
// Words in English, Hindi and Hinglish. The model (toBlocks / toCpp) runs without a page too (devtools/test/robocore3.mjs).
import { parse, typeName } from './cpp.js';
import { tx, L } from './i18n.js';
const ARITHP = (b) => (['*', '/', '%'].includes(b.f.op) ? 13 : 12); // (batch 7) the C++ precedence of an arithmetic block

const t3 = (en, hi, hg) => ({ en, hi, hg });
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
let ID = 0; const nid = () => 'k' + (++ID);

// ------------------------------------------------------------------ words, colours, choices
export const UI3 = {
  globals: t3('Devices and variables', 'डिवाइस और वेरिएबल', 'Devices aur variables'), setup: t3('setup: once, at the start', 'setup: एक बार, शुरू में', 'setup: ek baar, shuru mein'),
  loop: t3('loop: again and again', 'loop: बार-बार', 'loop: baar-baar'), func: t3('function', 'फ़ंक्शन', 'function'), drop: t3('Drop blocks here', 'ब्लॉक यहाँ छोड़िए', 'Blocks yahan chhodiye'),
  trash: t3('Drop here to delete', 'मिटाने के लिए यहाँ छोड़िए', 'Mitane ke liye yahan chhodiye'), cpp: t3('C++ made by your blocks', 'आपके ब्लॉक से बना C++', 'Aapke blocks se bana C++'),
  parseErr: t3('The C++ has a mistake on line {n}: fix it there and the blocks come back.', 'C++ की लाइन {n} में ग़लती है: वहाँ ठीक कीजिए, ब्लॉक वापस आ जाएँगे।', 'C++ ki line {n} mein galti hai: wahan theek kijiye, blocks wapas aa jayenge.'),
  undo: t3('Undo', 'वापस', 'Undo'), newVar: t3('new variable…', 'नया वेरिएबल…', 'naya variable…'), varName: t3('Name of the new variable', 'नए वेरिएबल का नाम', 'Naye variable ka naam'),
  bigger: t3('Bigger blocks', 'बड़े ब्लॉक', 'Bade blocks'), smaller: t3('Smaller blocks', 'छोटे ब्लॉक', 'Chhote blocks'), help: t3('Drag blocks in; drag them back here to delete.', 'ब्लॉक खींचकर लाइए; मिटाने के लिए यहीं वापस खींचिए।', 'Blocks kheench kar laaiye; mitane ke liye yahin wapas kheenchiye.'),
};
const CAT = {
  pins: [t3('Pins', 'पिन', 'Pins'), '#2e9e48'], control: [t3('Control', 'कंट्रोल', 'Control'), '#d08a1e'], math: [t3('Maths', 'गणित', 'Maths'), '#2f9e94'],
  vars: [t3('Variables', 'वेरिएबल', 'Variables'), '#d8632a'], serial: [t3('Serial', 'सीरियल', 'Serial'), '#3a7fe0'], sound: [t3('Sound', 'आवाज़', 'Awaaz'), '#c24ab8'],
  servo: [t3('Servo', 'सर्वो', 'Servo'), '#7a5ae0'], display: [t3('Displays', 'डिस्प्ले', 'Displays'), '#1e9fc0'], sensors: [t3('Sensors', 'सेंसर', 'Sensors'), '#b8941a'],
  motors: [t3('Motors', 'मोटर', 'Motors'), '#cf4a3a'], cpp: [t3('C++', 'C++', 'C++'), '#6a7280'],
};
const PINS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', 'A0', 'A1', 'A2', 'A3', 'A4', 'A5', '0', '1', 'LED_BUILTIN'];
const LISTS = {
  MODE: [['OUTPUT', t3('OUTPUT', 'आउटपुट (OUTPUT)', 'OUTPUT')], ['INPUT', t3('INPUT', 'इनपुट (INPUT)', 'INPUT')], ['INPUT_PULLUP', t3('INPUT_PULLUP', 'INPUT_PULLUP', 'INPUT_PULLUP')]],
  LEVEL: ['HIGH', 'LOW'], BOOL: ['true', 'false'], TYPE: ['int', 'long', 'float', 'bool', 'byte', 'char', 'String', 'unsigned long'], KIND: [['', t3('variable', 'वेरिएबल', 'variable')], ['const', t3('constant', 'स्थिर (const)', 'constant')]],
  ARITH: ['+', '-', '*', '/', '%'], CMP: ['==', '!=', '<', '>', '<=', '>='], LOGIC: [['&&', t3('and', 'और', 'aur')], ['||', t3('or', 'या', 'ya')]], CHANGE: ['+=', '-=', '*=', '/='], INC: [['++', '+1'], ['--', '−1']],
  FOROP: ['<=', '<', '>=', '>'], DIR: [['+', '+'], ['-', '−']], BAUD: ['9600', '115200', '57600', '4800'], LN: [['println', t3('and a new line', 'और नई लाइन', 'aur nayi line')], ['print', t3('on the same line', 'उसी लाइन पर', 'usi line par')]],
  ONOFF: [['backlight', t3('on', 'चालू', 'on')], ['noBacklight', t3('off', 'बंद', 'off')]], LCDADDR: ['0x27', '0x3F'], OLEDADDR: ['0x3C', '0x3D'], COLOR: ['SSD1306_WHITE', 'SSD1306_BLACK', 'SSD1306_INVERSE'],
  RECT: [['drawRect', t3('outline', 'रेखा', 'outline')], ['fillRect', t3('filled', 'भरा', 'filled')]], CIRC: [['drawCircle', t3('outline', 'रेखा', 'outline')], ['fillCircle', t3('filled', 'भरा', 'filled')]],
  DHTT: ['DHT11', 'DHT22'], UNIT: [['', '°C'], ['true', '°F']], FMT: ['HEX', 'DEC', 'BIN'],
};
const listOf = (k) => LISTS[k].map((o) => (Array.isArray(o) ? o : [o, o]));

// ------------------------------------------------------------------ the blocks
// k: 's' statement, 'v' value (b: true if it is a yes/no value); c: colour group; txt: words with {slot} (a value),
// {f:LIST} a choice, {f:VAR} a variable, {f:DEV.type} a device of that type, {f:NAME} a name to type, {f:NUM} a number to type
// d: what a new block has; C: holds statements (E: and an "else" list); g(b, G): its C++ (G.v(b, slot), G.f(b, field))
const LIT = (t, v) => ({ id: nid(), t, f: { v: String(v) }, i: {} }), VAL = (v) => LIT('num', v);
const BK = {
  // pins
  pinmode: { k: 's', c: 'pins', txt: t3('set pin {pin} as {mode:MODE}', 'पिन {pin} को {mode:MODE} बनाओ', 'pin {pin} ko {mode:MODE} banao'), d: { pin: ['pin', '13'], mode: 'OUTPUT' }, g: (b, G) => `pinMode(${G.v(b, 'pin')}, ${b.f.mode});` },
  dwrite: { k: 's', c: 'pins', txt: t3('digital write pin {pin} to {v}', 'डिजिटल पिन {pin} को {v} करो', 'digital pin {pin} ko {v} karo'), d: { pin: ['pin', '13'], v: ['level', 'HIGH'] }, g: (b, G) => `digitalWrite(${G.v(b, 'pin')}, ${G.v(b, 'v')});` },
  awrite: { k: 's', c: 'pins', txt: t3('PWM write pin {pin} value {v}', 'PWM पिन {pin} पर मान {v}', 'PWM pin {pin} par value {v}'), d: { pin: ['pin', '9'], v: ['num', '128'] }, g: (b, G) => `analogWrite(${G.v(b, 'pin')}, ${G.v(b, 'v')});` },
  dread: { k: 'v', b: true, c: 'pins', txt: t3('digital read pin {pin}', 'डिजिटल पिन {pin} पढ़ो', 'digital pin {pin} padho'), d: { pin: ['pin', '2'] }, g: (b, G) => `digitalRead(${G.v(b, 'pin')})` },
  aread: { k: 'v', c: 'pins', txt: t3('analog read pin {pin}', 'एनालॉग पिन {pin} पढ़ो', 'analog pin {pin} padho'), d: { pin: ['pin', 'A0'] }, g: (b, G) => `analogRead(${G.v(b, 'pin')})` },
  // control
  delay: { k: 's', c: 'control', txt: t3('wait {ms} ms', '{ms} ms रुको', '{ms} ms ruko'), d: { ms: ['num', '1000'] }, g: (b, G) => `delay(${G.v(b, 'ms')});` },
  delayus: { k: 's', c: 'control', txt: t3('wait {us} µs', '{us} µs रुको', '{us} µs ruko'), d: { us: ['num', '10'] }, g: (b, G) => `delayMicroseconds(${G.v(b, 'us')});` },
  if: { k: 's', c: 'control', C: true, txt: t3('if {c} then', 'अगर {c} तो', 'agar {c} to'), d: { c: ['bool', 'true'] }, g: (b, G) => `if (${G.v(b, 'c')}) {` },
  ifelse: { k: 's', c: 'control', C: true, E: true, txt: t3('if {c} then', 'अगर {c} तो', 'agar {c} to'), etxt: t3('else', 'वरना', 'warna'), d: { c: ['bool', 'true'] }, g: (b, G) => `if (${G.v(b, 'c')}) {` },
  repeat: { k: 's', c: 'control', C: true, txt: t3('repeat {n} times', '{n} बार दोहराओ', '{n} baar dohrao'), d: { n: ['num', '10'] }, g: (b, G) => `for (int ${b.f.v || 'i'} = 0; ${b.f.v || 'i'} < ${G.v(b, 'n')}; ${b.f.v || 'i'}++) {` },
  count: { k: 's', c: 'control', C: true, txt: t3('count {v:NAME} from {a} while it is {op:FOROP} {b} step {dir:DIR}{k}', '{v:NAME} गिनो {a} से, जब तक {op:FOROP} {b}, क़दम {dir:DIR}{k}', '{v:NAME} gino {a} se, jab tak {op:FOROP} {b}, step {dir:DIR}{k}'),
    d: { v: 'i', a: ['num', '0'], op: '<=', b: ['num', '10'], dir: '+', k: ['num', '1'], st: '++', ty: 'int' }, g: (b, G) => { const v = b.f.v, k = G.v(b, 'k'), up = b.f.dir !== '-'; const inc = (b.f.st === '++' || b.f.st === 'pre') && k === '1' ? (b.f.st === 'pre' ? `${up ? '++' : '--'}${v}` : `${v}${up ? '++' : '--'}`) : b.f.st === '=' ? `${v} = ${v} ${up ? '+' : '-'} ${k}` : `${v} ${up ? '+=' : '-='} ${k}`; return `for (${b.f.ty || 'int'} ${v} = ${G.v(b, 'a')}; ${v} ${b.f.op} ${G.v(b, 'b')}; ${inc}) {`; } },
  while: { k: 's', c: 'control', C: true, txt: t3('while {c} repeat', 'जब तक {c} दोहराओ', 'jab tak {c} dohrao'), d: { c: ['bool', 'true'] }, g: (b, G) => `while (${G.v(b, 'c')}) {` },
  break: { k: 's', c: 'control', txt: t3('stop the loop (break)', 'लूप रोको (break)', 'loop roko (break)'), g: () => 'break;' },
  return: { k: 's', c: 'control', txt: t3('leave here (return)', 'यहीं से लौटो (return)', 'yahin se lauto (return)'), g: () => 'return;' },
  call: { k: 's', c: 'control', txt: t3('do {n:NAME}', '{n:NAME} करो', '{n:NAME} karo'), d: { n: 'myFunction', a: '' }, g: (b) => `${b.f.n}(${b.f.a || ''});` },
  millis: { k: 'v', c: 'control', txt: t3('milliseconds since start', 'शुरू से मिलीसेकंड', 'shuru se milliseconds'), g: () => 'millis()' },
  // maths and logic
  arith: { k: 'v', c: 'math', txt: t3('{a} {op:ARITH} {b}', '{a} {op:ARITH} {b}', '{a} {op:ARITH} {b}'), d: { a: ['num', '1'], op: '+', b: ['num', '1'] }, g: (b, G) => { const q = ARITHP(b); return `${G.v(b, 'a', q)} ${b.f.op} ${G.v(b, 'b', q + 1)}`; }, p: (b) => ARITHP(b) }, // (batch 7: × ÷ % bind tighter than + −, so (t2 - t1) / 1000.0 keeps its brackets)
  cmp: { k: 'v', b: true, c: 'math', txt: t3('{a} {op:CMP} {b}', '{a} {op:CMP} {b}', '{a} {op:CMP} {b}'), d: { a: ['num', '1'], op: '<', b: ['num', '10'] }, g: (b, G) => `${G.v(b, 'a', 10)} ${b.f.op} ${G.v(b, 'b', 11)}`, p: 9 },
  logic: { k: 'v', b: true, c: 'math', txt: t3('{a} {op:LOGIC} {b}', '{a} {op:LOGIC} {b}', '{a} {op:LOGIC} {b}'), d: { a: ['bool', 'true'], op: '&&', b: ['bool', 'true'] }, g: (b, G) => `${G.v(b, 'a', 5)} ${b.f.op} ${G.v(b, 'b', 6)}`, p: 4 },
  not: { k: 'v', b: true, c: 'math', txt: t3('not {a}', 'नहीं {a}', 'nahi {a}'), d: { a: ['bool', 'true'] }, g: (b, G) => `!${G.v(b, 'a', 14)}`, p: 14 },
  map: { k: 'v', c: 'math', txt: t3('map {v} from {a}–{b} to {c}–{d}', '{v} को {a}–{b} से {c}–{d} में बदलो', '{v} ko {a}–{b} se {c}–{d} mein badlo'), d: { v: ['num', '512'], a: ['num', '0'], b: ['num', '1023'], c: ['num', '0'], d: ['num', '180'] }, g: (b, G) => `map(${['v', 'a', 'b', 'c', 'd'].map((k) => G.v(b, k)).join(', ')})` },
  constrain: { k: 'v', c: 'math', txt: t3('keep {v} between {a} and {b}', '{v} को {a} और {b} के बीच रखो', '{v} ko {a} aur {b} ke beech rakho'), d: { v: ['num', '0'], a: ['num', '0'], b: ['num', '180'] }, g: (b, G) => `constrain(${G.v(b, 'v')}, ${G.v(b, 'a')}, ${G.v(b, 'b')})` },
  random: { k: 'v', c: 'math', txt: t3('random number from {a} to below {b}', '{a} से {b} के नीचे तक कोई भी संख्या', '{a} se {b} ke neeche tak koi bhi number'), d: { a: ['num', '1'], b: ['num', '7'] }, g: (b, G) => `random(${G.v(b, 'a')}, ${G.v(b, 'b')})` },
  abs: { k: 'v', c: 'math', txt: t3('size of {v} (abs)', '{v} का आकार (abs)', '{v} ka size (abs)'), d: { v: ['num', '-5'] }, g: (b, G) => `abs(${G.v(b, 'v')})` },
  // variables
  decl: { k: 's', c: 'vars', txt: t3('{kind:KIND} {ty:TYPE} {n:NAME} = {v}', '{kind:KIND} {ty:TYPE} {n:NAME} = {v}', '{kind:KIND} {ty:TYPE} {n:NAME} = {v}'), d: { kind: '', ty: 'int', n: 'count', v: ['num', '0'] }, g: (b, G) => `${b.f.kind ? b.f.kind + ' ' : ''}${b.f.ty} ${b.f.n} = ${G.v(b, 'v')};` },
  set: { k: 's', c: 'vars', txt: t3('set {n:VAR} to {v}', '{n:VAR} को {v} रखो', '{n:VAR} ko {v} rakho'), d: { n: 'count', v: ['num', '0'] }, g: (b, G) => `${b.f.n} = ${G.v(b, 'v')};` },
  change: { k: 's', c: 'vars', txt: t3('change {n:VAR} {op:CHANGE} {v}', '{n:VAR} बदलो {op:CHANGE} {v}', '{n:VAR} badlo {op:CHANGE} {v}'), d: { n: 'count', op: '+=', v: ['num', '1'] }, g: (b, G) => `${b.f.n} ${b.f.op} ${G.v(b, 'v')};` },
  inc: { k: 's', c: 'vars', txt: t3('change {n:VAR} by {op:INC}', '{n:VAR} में {op:INC} करो', '{n:VAR} mein {op:INC} karo'), d: { n: 'count', op: '++' }, g: (b) => `${b.f.n}${b.f.op};` },
  var: { k: 'v', c: 'vars', txt: t3('{n:VAR}', '{n:VAR}', '{n:VAR}'), d: { n: 'count' }, g: (b) => b.f.n, p: 16 },
  // serial
  ser_begin: { k: 's', c: 'serial', txt: t3('start Serial at {baud:BAUD} baud', 'Serial {baud:BAUD} बॉड पर शुरू करो', 'Serial {baud:BAUD} baud par shuru karo'), d: { baud: '9600' }, g: (b) => `Serial.begin(${b.f.baud});` },
  ser_print: { k: 's', c: 'serial', txt: t3('Serial print {v} {ln:LN}', 'Serial पर लिखो {v} {ln:LN}', 'Serial par likho {v} {ln:LN}'), d: { v: ['text', 'Hello'], ln: 'println' }, g: (b, G) => `Serial.${b.f.ln}(${G.v(b, 'v')}${b.i.fmt ? ', ' + G.v(b, 'fmt') : ''});` },
  ser_nl: { k: 's', c: 'serial', txt: t3('Serial new line', 'Serial पर नई लाइन', 'Serial par nayi line'), g: () => 'Serial.println();' },
  ser_avail: { k: 'v', c: 'serial', txt: t3('letters waiting on Serial', 'Serial पर रुके अक्षर', 'Serial par ruke letters'), g: () => 'Serial.available()' },
  ser_read: { k: 'v', c: 'serial', txt: t3('read a letter from Serial', 'Serial से एक अक्षर पढ़ो', 'Serial se ek letter padho'), g: () => 'Serial.read()' },
  // sound
  tone: { k: 's', c: 'sound', txt: t3('play note on pin {pin} at {f} Hz', 'पिन {pin} पर {f} Hz का सुर बजाओ', 'pin {pin} par {f} Hz ka sur bajao'), d: { pin: ['pin', '8'], f: ['num', '440'] }, g: (b, G) => `tone(${G.v(b, 'pin')}, ${G.v(b, 'f')});` },
  toned: { k: 's', c: 'sound', txt: t3('play note on pin {pin} at {f} Hz for {d} ms', 'पिन {pin} पर {f} Hz, {d} ms तक', 'pin {pin} par {f} Hz, {d} ms tak'), d: { pin: ['pin', '8'], f: ['num', '1000'], d: ['num', '200'] }, g: (b, G) => `tone(${G.v(b, 'pin')}, ${G.v(b, 'f')}, ${G.v(b, 'd')});` },
  notone: { k: 's', c: 'sound', txt: t3('stop the sound on pin {pin}', 'पिन {pin} की आवाज़ बंद करो', 'pin {pin} ki awaaz band karo'), d: { pin: ['pin', '8'] }, g: (b, G) => `noTone(${G.v(b, 'pin')});` },
  // servo
  servo_decl: { k: 's', c: 'servo', dev: 'servo', txt: t3('a servo called {n:NAME}', '{n:NAME} नाम का सर्वो', '{n:NAME} naam ka servo'), d: { n: 'myServo' }, g: (b) => `Servo ${b.f.n};`, inc: ['Servo.h'] },
  servo_attach: { k: 's', c: 'servo', txt: t3('servo {n:DEV.servo} on pin {pin}', 'सर्वो {n:DEV.servo} को पिन {pin} पर लगाओ', 'servo {n:DEV.servo} ko pin {pin} par lagao'), d: { n: 'myServo', pin: ['pin', '9'] }, g: (b, G) => `${b.f.n}.attach(${G.v(b, 'pin')});` },
  servo_write: { k: 's', c: 'servo', txt: t3('turn servo {n:DEV.servo} to {a} °', 'सर्वो {n:DEV.servo} को {a}° घुमाओ', 'servo {n:DEV.servo} ko {a}° ghumao'), d: { n: 'myServo', a: ['num', '90'] }, g: (b, G) => `${b.f.n}.write(${G.v(b, 'a')});` },
  servo_read: { k: 'v', c: 'servo', txt: t3('angle of servo {n:DEV.servo}', 'सर्वो {n:DEV.servo} का कोण', 'servo {n:DEV.servo} ka angle'), d: { n: 'myServo' }, g: (b) => `${b.f.n}.read()` },
  // displays: the 16×2 LCD (I2C) and the OLED
  lcd_decl: { k: 's', c: 'display', dev: 'LiquidCrystal_I2C', txt: t3('LCD {n:NAME} at {addr:LCDADDR}, {cols:NUM} × {rows:NUM}', 'एलसीडी {n:NAME} पते {addr:LCDADDR} पर, {cols:NUM} × {rows:NUM}', 'LCD {n:NAME} address {addr:LCDADDR} par, {cols:NUM} × {rows:NUM}'), d: { n: 'lcd', addr: '0x27', cols: '16', rows: '2' }, g: (b) => `LiquidCrystal_I2C ${b.f.n}(${b.f.addr}, ${b.f.cols}, ${b.f.rows});`, inc: ['Wire.h', 'LiquidCrystal_I2C.h'] },
  lcd_init: { k: 's', c: 'display', txt: t3('start LCD {n:DEV.LiquidCrystal_I2C}', 'एलसीडी {n:DEV.LiquidCrystal_I2C} शुरू करो', 'LCD {n:DEV.LiquidCrystal_I2C} shuru karo'), d: { n: 'lcd' }, g: (b) => `${b.f.n}.init();` },
  lcd_bl: { k: 's', c: 'display', txt: t3('LCD {n:DEV.LiquidCrystal_I2C} backlight {m:ONOFF}', 'एलसीडी {n:DEV.LiquidCrystal_I2C} की बैकलाइट {m:ONOFF}', 'LCD {n:DEV.LiquidCrystal_I2C} ki backlight {m:ONOFF}'), d: { n: 'lcd', m: 'backlight' }, g: (b) => `${b.f.n}.${b.f.m}();` },
  lcd_clear: { k: 's', c: 'display', txt: t3('clear LCD {n:DEV.LiquidCrystal_I2C}', 'एलसीडी {n:DEV.LiquidCrystal_I2C} साफ़ करो', 'LCD {n:DEV.LiquidCrystal_I2C} saaf karo'), d: { n: 'lcd' }, g: (b) => `${b.f.n}.clear();` },
  lcd_cursor: { k: 's', c: 'display', txt: t3('LCD {n:DEV.LiquidCrystal_I2C} go to column {col} row {row}', 'एलसीडी {n:DEV.LiquidCrystal_I2C} कॉलम {col} पंक्ति {row} पर जाओ', 'LCD {n:DEV.LiquidCrystal_I2C} column {col} row {row} par jao'), d: { n: 'lcd', col: ['num', '0'], row: ['num', '0'] }, g: (b, G) => `${b.f.n}.setCursor(${G.v(b, 'col')}, ${G.v(b, 'row')});` },
  lcd_print: { k: 's', c: 'display', txt: t3('LCD {n:DEV.LiquidCrystal_I2C} print {v}', 'एलसीडी {n:DEV.LiquidCrystal_I2C} पर लिखो {v}', 'LCD {n:DEV.LiquidCrystal_I2C} par likho {v}'), d: { n: 'lcd', v: ['text', 'Hello!'] }, g: (b, G) => `${b.f.n}.print(${G.v(b, 'v')}${b.i.fmt ? ', ' + G.v(b, 'fmt') : ''});` },
  oled_decl: { k: 's', c: 'display', dev: 'Adafruit_SSD1306', txt: t3('OLED {n:NAME} 128 × 64', 'ओएलईडी {n:NAME} 128 × 64', 'OLED {n:NAME} 128 × 64'), d: { n: 'display' }, g: (b) => `Adafruit_SSD1306 ${b.f.n}(128, 64, &Wire, -1);`, inc: ['Wire.h', 'Adafruit_GFX.h', 'Adafruit_SSD1306.h'] },
  oled_begin: { k: 's', c: 'display', txt: t3('start OLED {n:DEV.Adafruit_SSD1306} at {addr:OLEDADDR}', 'ओएलईडी {n:DEV.Adafruit_SSD1306} पते {addr:OLEDADDR} पर शुरू करो', 'OLED {n:DEV.Adafruit_SSD1306} address {addr:OLEDADDR} par shuru karo'), d: { n: 'display', addr: '0x3C' }, g: (b) => `${b.f.n}.begin(SSD1306_SWITCHCAPVCC, ${b.f.addr});` },
  oled_clear: { k: 's', c: 'display', txt: t3('clear OLED {n:DEV.Adafruit_SSD1306} picture', 'ओएलईडी {n:DEV.Adafruit_SSD1306} की तस्वीर साफ़ करो', 'OLED {n:DEV.Adafruit_SSD1306} ki picture saaf karo'), d: { n: 'display' }, g: (b) => `${b.f.n}.clearDisplay();` },
  oled_size: { k: 's', c: 'display', txt: t3('OLED {n:DEV.Adafruit_SSD1306} text size {s}', 'ओएलईडी {n:DEV.Adafruit_SSD1306} अक्षर का आकार {s}', 'OLED {n:DEV.Adafruit_SSD1306} text size {s}'), d: { n: 'display', s: ['num', '2'] }, g: (b, G) => `${b.f.n}.setTextSize(${G.v(b, 's')});` },
  oled_color: { k: 's', c: 'display', txt: t3('OLED {n:DEV.Adafruit_SSD1306} text colour {col:COLOR}', 'ओएलईडी {n:DEV.Adafruit_SSD1306} अक्षर का रंग {col:COLOR}', 'OLED {n:DEV.Adafruit_SSD1306} text colour {col:COLOR}'), d: { n: 'display', col: 'SSD1306_WHITE' }, g: (b) => `${b.f.n}.setTextColor(${b.f.col});` },
  oled_cursor: { k: 's', c: 'display', txt: t3('OLED {n:DEV.Adafruit_SSD1306} go to x {x} y {y}', 'ओएलईडी {n:DEV.Adafruit_SSD1306} x {x} y {y} पर जाओ', 'OLED {n:DEV.Adafruit_SSD1306} x {x} y {y} par jao'), d: { n: 'display', x: ['num', '0'], y: ['num', '0'] }, g: (b, G) => `${b.f.n}.setCursor(${G.v(b, 'x')}, ${G.v(b, 'y')});` },
  oled_print: { k: 's', c: 'display', txt: t3('OLED {n:DEV.Adafruit_SSD1306} print {v} {ln:LN}', 'ओएलईडी {n:DEV.Adafruit_SSD1306} पर लिखो {v} {ln:LN}', 'OLED {n:DEV.Adafruit_SSD1306} par likho {v} {ln:LN}'), d: { n: 'display', v: ['text', 'Hello'], ln: 'println' }, g: (b, G) => `${b.f.n}.${b.f.ln}(${G.v(b, 'v')}${b.i.fmt ? ', ' + G.v(b, 'fmt') : ''});` },
  oled_rect: { k: 's', c: 'display', txt: t3('OLED {n:DEV.Adafruit_SSD1306} {m:RECT} box x {x} y {y} w {w} h {h}', 'ओएलईडी {n:DEV.Adafruit_SSD1306} {m:RECT} डिब्बा x {x} y {y} w {w} h {h}', 'OLED {n:DEV.Adafruit_SSD1306} {m:RECT} box x {x} y {y} w {w} h {h}'), d: { n: 'display', m: 'drawRect', x: ['num', '0'], y: ['num', '0'], w: ['num', '20'], h: ['num', '10'], col: 'SSD1306_WHITE' }, g: (b, G) => `${b.f.n}.${b.f.m}(${['x', 'y', 'w', 'h'].map((k) => G.v(b, k)).join(', ')}, ${b.f.col || 'SSD1306_WHITE'});` },
  oled_circle: { k: 's', c: 'display', txt: t3('OLED {n:DEV.Adafruit_SSD1306} {m:CIRC} circle x {x} y {y} radius {r}', 'ओएलईडी {n:DEV.Adafruit_SSD1306} {m:CIRC} गोला x {x} y {y} त्रिज्या {r}', 'OLED {n:DEV.Adafruit_SSD1306} {m:CIRC} circle x {x} y {y} radius {r}'), d: { n: 'display', m: 'fillCircle', x: ['num', '64'], y: ['num', '32'], r: ['num', '10'], col: 'SSD1306_WHITE' }, g: (b, G) => `${b.f.n}.${b.f.m}(${['x', 'y', 'r'].map((k) => G.v(b, k)).join(', ')}, ${b.f.col || 'SSD1306_WHITE'});` },
  oled_show: { k: 's', c: 'display', txt: t3('show the picture on OLED {n:DEV.Adafruit_SSD1306}', 'तस्वीर ओएलईडी {n:DEV.Adafruit_SSD1306} पर दिखाओ', 'picture OLED {n:DEV.Adafruit_SSD1306} par dikhao'), d: { n: 'display' }, g: (b) => `${b.f.n}.display();` },
  // sensors: DHT11, IR remote, keypad, RFID
  dht_decl: { k: 's', c: 'sensors', dev: 'DHT', txt: t3('{ty:DHTT} sensor {n:NAME} on pin {pin:NUM}', '{ty:DHTT} सेंसर {n:NAME} पिन {pin:NUM} पर', '{ty:DHTT} sensor {n:NAME} pin {pin:NUM} par'), d: { n: 'dht', pin: '2', ty: 'DHT11' }, g: (b) => `DHT ${b.f.n}(${b.f.pin}, ${b.f.ty});`, inc: ['DHT.h'] },
  dht_begin: { k: 's', c: 'sensors', txt: t3('start sensor {n:DEV.DHT}', 'सेंसर {n:DEV.DHT} शुरू करो', 'sensor {n:DEV.DHT} shuru karo'), d: { n: 'dht' }, g: (b) => `${b.f.n}.begin();` },
  dht_t: { k: 'v', c: 'sensors', txt: t3('temperature from {n:DEV.DHT} in {u:UNIT}', '{n:DEV.DHT} से तापमान {u:UNIT} में', '{n:DEV.DHT} se temperature {u:UNIT} mein'), d: { n: 'dht', u: '' }, g: (b) => `${b.f.n}.readTemperature(${b.f.u})`, p: 16 },
  dht_h: { k: 'v', c: 'sensors', txt: t3('humidity % from {n:DEV.DHT}', '{n:DEV.DHT} से नमी %', '{n:DEV.DHT} se nami %'), d: { n: 'dht' }, g: (b) => `${b.f.n}.readHumidity()`, p: 16 },
  ir_begin: { k: 's', c: 'sensors', txt: t3('start the IR receiver on pin {pin}', 'आईआर रिसीवर पिन {pin} पर शुरू करो', 'IR receiver pin {pin} par shuru karo'), d: { pin: ['pin', '11'] }, g: (b, G) => `IrReceiver.begin(${G.v(b, 'pin')}${b.f.fb ? ', ' + b.f.fb : ''});`, inc: ['IRremote.hpp'] },
  ir_decode: { k: 'v', b: true, c: 'sensors', txt: t3('a remote button came in?', 'रिमोट का बटन आया?', 'remote ka button aaya?'), g: () => 'IrReceiver.decode()', inc: ['IRremote.hpp'], p: 16 },
  ir_cmd: { k: 'v', c: 'sensors', txt: t3('its button code', 'उसके बटन का कोड', 'uske button ka code'), g: () => 'IrReceiver.decodedIRData.command', p: 16 },
  ir_resume: { k: 's', c: 'sensors', txt: t3('get ready for the next button', 'अगले बटन के लिए तैयार हो', 'agle button ke liye taiyaar ho'), g: () => 'IrReceiver.resume();' },
  kp_get: { k: 'v', c: 'sensors', txt: t3('key pressed on {n:DEV.Keypad}', '{n:DEV.Keypad} पर दबाया बटन', '{n:DEV.Keypad} par dabaya button'), d: { n: 'keypad' }, g: (b) => `${b.f.n}.getKey()`, p: 16 },
  rfid_decl: { k: 's', c: 'sensors', dev: 'MFRC522', txt: t3('RFID reader {n:NAME}, SDA pin {ss:NUM}, RST pin {rst:NUM}', 'आरएफ़आईडी रीडर {n:NAME}, SDA पिन {ss:NUM}, RST पिन {rst:NUM}', 'RFID reader {n:NAME}, SDA pin {ss:NUM}, RST pin {rst:NUM}'), d: { n: 'rfid', ss: '10', rst: '9' }, g: (b) => `MFRC522 ${b.f.n}(${b.f.ss}, ${b.f.rst});`, inc: ['SPI.h', 'MFRC522.h'] },
  rfid_init: { k: 's', c: 'sensors', txt: t3('start RFID reader {n:DEV.MFRC522}', 'आरएफ़आईडी रीडर {n:DEV.MFRC522} शुरू करो', 'RFID reader {n:DEV.MFRC522} shuru karo'), d: { n: 'rfid' }, g: (b) => `${b.f.n}.PCD_Init();` },
  rfid_new: { k: 'v', b: true, c: 'sensors', txt: t3('a new card on {n:DEV.MFRC522}?', '{n:DEV.MFRC522} पर नया कार्ड?', '{n:DEV.MFRC522} par naya card?'), d: { n: 'rfid' }, g: (b) => `${b.f.n}.PICC_IsNewCardPresent()`, p: 16 },
  rfid_read: { k: 'v', b: true, c: 'sensors', txt: t3('its number read from {n:DEV.MFRC522}?', '{n:DEV.MFRC522} ने नंबर पढ़ा?', '{n:DEV.MFRC522} ne number padha?'), d: { n: 'rfid' }, g: (b) => `${b.f.n}.PICC_ReadCardSerial()`, p: 16 },
  spi_begin: { k: 's', c: 'sensors', txt: t3('start SPI', 'SPI शुरू करो', 'SPI shuru karo'), g: () => 'SPI.begin();', inc: ['SPI.h'] },
  // motors: stepper
  stp_decl: { k: 's', c: 'motors', dev: 'Stepper', txt: t3('stepper {n:NAME}, {steps:NUM} steps a turn, pins {p1:NUM} {p2:NUM} {p3:NUM} {p4:NUM}', 'स्टेपर {n:NAME}, एक चक्कर में {steps:NUM} क़दम, पिन {p1:NUM} {p2:NUM} {p3:NUM} {p4:NUM}', 'stepper {n:NAME}, ek chakkar mein {steps:NUM} steps, pins {p1:NUM} {p2:NUM} {p3:NUM} {p4:NUM}'), d: { n: 'motor', steps: '2048', p1: '8', p2: '10', p3: '9', p4: '11' }, g: (b) => `Stepper ${b.f.n}(${b.f.steps}, ${b.f.p1}, ${b.f.p2}, ${b.f.p3}, ${b.f.p4});`, inc: ['Stepper.h'] },
  stp_speed: { k: 's', c: 'motors', txt: t3('stepper {n:DEV.Stepper} speed {rpm} turns a minute', 'स्टेपर {n:DEV.Stepper} की रफ़्तार {rpm} चक्कर/मिनट', 'stepper {n:DEV.Stepper} ki speed {rpm} chakkar/minute'), d: { n: 'motor', rpm: ['num', '10'] }, g: (b, G) => `${b.f.n}.setSpeed(${G.v(b, 'rpm')});` },
  stp_step: { k: 's', c: 'motors', txt: t3('stepper {n:DEV.Stepper} move {s} steps', 'स्टेपर {n:DEV.Stepper} {s} क़दम चलाओ', 'stepper {n:DEV.Stepper} {s} steps chalao'), d: { n: 'motor', s: ['num', '512'] }, g: (b, G) => `${b.f.n}.step(${G.v(b, 's')});` },
  // the C++ that the blocks do not know (it stays as it is)
  raw: { k: 's', c: 'cpp', raw: true, txt: t3('C++', 'C++', 'C++'), d: { code: '// your C++' }, g: (b) => b.f.code },
  rawv: { k: 'v', c: 'cpp', raw: true, txt: t3('C++', 'C++', 'C++'), d: { code: '0' }, g: (b) => b.f.code, p: 0 },
  // literals (they sit in a slot; the slot decides how they are edited)
  num: { k: 'v', lit: true, c: 'math', g: (b) => b.f.v, p: 16 }, text: { k: 'v', lit: true, c: 'math', g: (b) => cstr(b.f.v), p: 16 }, char: { k: 'v', lit: true, c: 'math', g: (b) => cchar(b.f.v), p: 16 },
  const: { k: 'v', lit: true, c: 'math', g: (b) => b.f.v, p: 16 }, pin: { k: 'v', lit: true, c: 'pins', g: (b) => b.f.v, p: 16 }, level: { k: 'v', lit: true, c: 'pins', g: (b) => b.f.v, p: 16 }, bool: { k: 'v', lit: true, c: 'math', g: (b) => b.f.v, p: 16 },
};
// the palette of each colour group (the order a child meets them)
const PALETTE = {
  pins: ['pinmode', 'dwrite', 'awrite', 'dread', 'aread'], control: ['delay', 'if', 'ifelse', 'repeat', 'count', 'while', 'break', 'millis', 'delayus', 'return'],
  math: ['cmp', 'arith', 'logic', 'not', 'map', 'constrain', 'random', 'abs'], vars: ['decl', 'set', 'change', 'inc', 'var'], serial: ['ser_begin', 'ser_print', 'ser_nl', 'ser_avail', 'ser_read'],
  sound: ['toned', 'tone', 'notone'], servo: ['servo_decl', 'servo_attach', 'servo_write', 'servo_read'],
  display: ['lcd_decl', 'lcd_init', 'lcd_bl', 'lcd_clear', 'lcd_cursor', 'lcd_print', 'oled_decl', 'oled_begin', 'oled_clear', 'oled_size', 'oled_color', 'oled_cursor', 'oled_print', 'oled_rect', 'oled_circle', 'oled_show'],
  sensors: ['dht_decl', 'dht_begin', 'dht_t', 'dht_h', 'ir_begin', 'ir_decode', 'ir_cmd', 'ir_resume', 'kp_get', 'rfid_decl', 'spi_begin', 'rfid_init', 'rfid_new', 'rfid_read'],
  motors: ['stp_decl', 'stp_speed', 'stp_step'], cpp: ['raw', 'rawv'],
};
const cstr = (s) => '"' + String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\t/g, '\\t').replace(/\r/g, '\\r') + '"';
const cchar = (s) => { const c = String(s)[0] ?? ' '; return "'" + (c === "'" ? "\\'" : c === '\\' ? '\\\\' : c === '\n' ? '\\n' : c === '\0' ? '\\0' : c) + "'"; };

// a new block of a type (its defaults filled in)
export function mk(t, f, i) {
  const def = BK[t]; const b = { id: nid(), t, f: {}, i: {} }; if (def.C) b.s = []; if (def.E) b.e = [];
  for (const [k, v] of Object.entries(def.d || {})) { if (Array.isArray(v)) b.i[k] = LIT(v[0], v[1]); else b.f[k] = v; }
  Object.assign(b.f, f || {}); Object.assign(b.i, i || {}); return b;
}

// ------------------------------------------------------------------ the C++ printer (a parsed sketch back to text)
const PREC = { comma: 1, assign: 2, tern: 3, '||': 4, '&&': 5, '|': 6, '^': 7, '&': 8, '==': 9, '!=': 9, '<': 10, '>': 10, '<=': 10, '>=': 10, '<<': 11, '>>': 11, '+': 12, '-': 12, '*': 13, '/': 13, '%': 13 };
const precOf = (e) => (e.k === 'bin' ? PREC[e.op] : e.k === 'assign' ? 2 : e.k === 'tern' ? 3 : e.k === 'comma' ? 1 : ['un', 'pre', 'cast', 'addr', 'sizeof'].includes(e.k) ? 14 : ['post', 'call', 'index', 'member'].includes(e.k) ? 15 : 16);
const CTYPE = (t) => (t === 'o:' ? '' : typeName(t));
export function pexpr(e, min = 0) {
  const p = precOf(e); let s;
  switch (e.k) {
    case 'num': s = e.text !== undefined ? e.text : String(e.v); break;
    case 'str': s = cstr(e.v); break;
    case 'id': s = e.name; break;
    case 'comma': s = `${pexpr(e.a, 1)}, ${pexpr(e.b, 2)}`; break;
    case 'tern': s = `${pexpr(e.c, 4)} ? ${pexpr(e.a, 0)} : ${pexpr(e.b, 3)}`; break;
    case 'un': s = e.op + pexpr(e.e, 14); break;
    case 'pre': s = e.op + pexpr(e.e, 14); break;
    case 'post': s = pexpr(e.e, 15) + e.op; break;
    case 'cast': s = `(${CTYPE(e.to)})${pexpr(e.e, 14)}`; break;
    case 'addr': s = '&' + pexpr(e.e, 14); break;
    case 'sizeof': s = `sizeof(${pexpr(e.e)})`; break;
    case 'bin': s = `${pexpr(e.a, p)} ${e.op} ${pexpr(e.b, p + 1)}`; break;
    case 'assign': s = `${pexpr(e.a, 15)} ${e.op} ${pexpr(e.b, 2)}`; break;
    case 'index': s = `${pexpr(e.a, 15)}[${pexpr(e.i)}]`; break;
    case 'call': s = `${pexpr(e.f, 15)}(${e.args.map((a) => pexpr(a, 2)).join(', ')})`; break;
    case 'member': s = `${pexpr(e.o, 15)}.${e.m}`; break;
    case 'ctor': s = `${e.ty}(${e.args.map((a) => pexpr(a, 2)).join(', ')})`; break;
    case 'list': s = `{${e.items.map((a) => pexpr(a, 2)).join(', ')}}`; break;
    default: s = '/*?*/';
  }
  return p < min ? `(${s})` : s;
}
// the type as the student wrote it (`unsigned long`, `const byte`, `static int`, `double`), else as the compiler knows it
let SRC = null; // the sketch being read into blocks (its lines)
const TYPEWORDS = /^(?:(?:const|static|volatile|unsigned|signed|short|long|int|char|byte|bool|boolean|float|double|word|String|size_t|u?int(?:8|16|32)_t|Servo|[A-Z]\w*)\s+)*(?:const|static|volatile|unsigned|signed|short|long|int|char|byte|bool|boolean|float|double|word|String|size_t|u?int(?:8|16|32)_t|Servo|[A-Z]\w*)$/;
function srcType(d) {
  if (!SRC || !d.vars.length) return null; const ln = SRC[d.line - 1]; if (!ln) return null;
  const m = new RegExp('^\\s*(?:for\\s*\\(\\s*)?([A-Za-z_][\\w ]*?)\\s+' + d.vars[0].name + '\\b').exec(ln); if (!m || !TYPEWORDS.test(m[1].trim())) return null;
  return m[1].trim().replace(/\s+/g, ' ');
}
function tyText(d) { return srcType(d) || (d.isConst ? 'const ' : '') + (String(d.ty).startsWith('o') ? String(d.ty).replace(/^o\d?:/, '') : d.ty === 'servo' ? 'Servo' : typeName(d.ty)); }
function pdecl(d) {
  return `${tyText(d)} ${d.vars.map((v) => v.name + v.dims.map((x) => `[${x ? pexpr(x) : ''}]`).join('') + (v.ctorArgs ? (v.ctorArgs.length ? `(${v.ctorArgs.map((a) => pexpr(a, 2)).join(', ')})` : '') : v.init ? ' = ' + pexpr(v.init, 2) : '')).join(', ')};`;
}
// a statement as lines of text (indented by two spaces for each level inside it)
export function pstmt(s, ind = '') {
  const sub = (x) => (x.k === 'block' ? x.body.flatMap((y) => pstmt(y, ind + '  ')) : pstmt(x, ind + '  '));
  switch (s.k) {
    case 'block': return [ind + '{', ...s.body.flatMap((y) => pstmt(y, ind + '  ')), ind + '}'];
    case 'empty': return [ind + ';'];
    case 'decl': return [ind + pdecl(s)];
    case 'expr': return [ind + pexpr(s.e) + ';'];
    case 'if': {
      if (s.a.k !== 'block' && !s.b) { const a = pstmt(s.a, ''); if (a.length === 1) return [`${ind}if (${pexpr(s.c)}) ${a[0]}`]; }
      const out = [`${ind}if (${pexpr(s.c)}) {`, ...sub(s.a)];
      if (s.b) { if (s.b.k === 'if') { const r = pstmt(s.b, ind); out.push(`${ind}} else ${r[0].trim()}`, ...r.slice(1)); return out; } out.push(`${ind}} else {`, ...sub(s.b)); }
      out.push(ind + '}'); return out;
    }
    case 'while': return [`${ind}while (${pexpr(s.c)}) {`, ...sub(s.body), ind + '}'];
    case 'do': return [`${ind}do {`, ...sub(s.body), `${ind}} while (${pexpr(s.c)});`];
    case 'for': { const init = s.init ? (s.init.k === 'decl' ? pdecl(s.init).slice(0, -1) : pexpr(s.init.e)) : ''; return [`${ind}for (${init}; ${s.c ? pexpr(s.c) : ''}; ${s.inc ? pexpr(s.inc) : ''}) {`, ...sub(s.body), ind + '}']; }
    case 'switch': return [`${ind}switch (${pexpr(s.e)}) {`, ...s.cases.flatMap((c) => [`${ind}  ${c.v ? 'case ' + pexpr(c.v) : 'default'}:`, ...c.body.flatMap((y) => pstmt(y, ind + '    '))]), ind + '}'];
    case 'break': return [ind + 'break;']; case 'continue': return [ind + 'continue;'];
    case 'return': return [ind + 'return' + (s.e ? ' ' + pexpr(s.e) : '') + ';'];
  }
  return [ind + '/* ? */'];
}

// ------------------------------------------------------------------ C++ -> blocks
const CONSTNAMES = /^(HIGH|LOW|INPUT|OUTPUT|INPUT_PULLUP|true|false|LED_BUILTIN|A[0-7]|DEC|HEX|OCT|BIN|DHT11|DHT22|SSD1306_\w+|WHITE|BLACK|NO_KEY|ENABLE_LED_FEEDBACK|DISABLE_LED_FEEDBACK|PI)$/;
// the comments of a sketch: { line: trailing comment } and { line: comment that fills the line } (a /* … */ block counts line by line)
function comments(src) {
  const tail = {}, full = {}; const lines = String(src).split('\n'); let inBlock = false;
  lines.forEach((ln, i) => {
    const t = ln.trim();
    if (inBlock) { const e = t.indexOf('*/'); full[i + 1] = (e < 0 ? t : t.slice(0, e)).replace(/^\*\s?/, '').trim(); if (e >= 0) inBlock = false; if (!full[i + 1]) delete full[i + 1]; return; }
    if (t.startsWith('/*')) { const e = t.indexOf('*/'); const body = (e < 0 ? t.slice(2) : t.slice(2, e)).replace(/^\*+\s?/, '').trim(); if (e < 0) inBlock = true; if (body) full[i + 1] = body; else if (e >= 0) full[i + 1] = ''; return; }
    if (t.startsWith('//')) { full[i + 1] = t.replace(/^\/\/\s?/, ''); return; }
    let q = null, k = 0; for (; k < ln.length - 1; k++) { const c = ln[k]; if (q) { if (c === '\\') { k++; continue; } if (c === q) q = null; continue; } if (c === '"' || c === "'") { q = c; continue; } if (c === '/' && (ln[k + 1] === '/' || ln[k + 1] === '*')) break; }
    if (k < ln.length - 1 && ln[k] === '/' && ln[k + 1] === '/') tail[i + 1] = ln.slice(k + 2).trim();
    else if (k < ln.length - 1 && ln[k] === '/' && ln[k + 1] === '*') tail[i + 1] = ln.slice(k + 2).replace(/\*\/\s*$/, '').trim();
  });
  return { tail, full, lines };
}
export const B3ERR = { define: t3('Blocks cannot show #define yet: write `const int NAME = value;` instead and the blocks come back.', 'ब्लॉक अभी #define नहीं दिखा सकते: उसकी जगह `const int NAME = value;` लिखिए, ब्लॉक वापस आ जाएँगे।', 'Blocks abhi #define nahi dikha sakte: uski jagah `const int NAME = value;` likhiye, blocks wapas aa jayenge.') };
// C++ -> { ok, prog, at } (at: source line -> block id, for the running line) or { ok: false, error }
export function toBlocks(src) {
  src = String(src || ''); const r = parse(src); if (!r.ok) return { ok: false, error: r.error };
  const C = comments(src); const pre = C.lines.findIndex((l) => /^\s*#\s*(?!include\b)\w/.test(l));
  if (pre >= 0) return { ok: false, error: { code: 'B3_DEFINE', line: pre + 1, args: {} } };
  SRC = C.lines; const used = new Set(); const at = new Map(); const seen = []; // [line, block or stack]
  const take = (line, b) => { // a block's comments: the one at the end of its line, and the comment lines (and blank lines) just above it
    if (b.id) { if (!at.has(line)) at.set(line, b.id); } seen.push([line, b]);
    if (C.tail[line] !== undefined && !used.has('t' + line)) { b.c = C.tail[line]; used.add('t' + line); }
    const note = []; let l = line - 1, gap = false;
    while (l > 0 && !used.has('f' + l) && (C.full[l] !== undefined || C.lines[l - 1].trim() === '')) { if (C.full[l] !== undefined) { note.unshift(C.full[l]); used.add('f' + l); } else gap = true; l--; }
    if (note.length) b.note = note; if (gap && l > 0) b.gap = true;
    return b;
  };
  const prog = { includes: r.includes.slice(), head: [], tail: [], stacks: [] }; const devs = {};
  for (let i = 1; i <= C.lines.length; i++) { if (C.full[i] !== undefined) { prog.head.push(C.full[i]); used.add('f' + i); continue; } if (C.lines[i - 1].trim() === '') continue; break; }
  const globals = { hat: 'globals', body: [] }; prog.stacks.push(globals);
  const CX = { devs, take };
  try {
    for (const it of r.items) {
      if (it.k === 'decl') { for (const b of declBlocks(it, CX)) globals.body.push(take(it.line, b)); continue; }
      if (it.k === 'proto') { globals.body.push(take(it.line, rawProto(it))); continue; }
      if (it.k === 'func') {
        const hat = it.name === 'setup' || it.name === 'loop' ? it.name : 'func'; const st = { hat, body: [] }; take(it.line, st);
        if (hat === 'func') { st.name = it.name; st.ret = it.ret; st.params = it.params.map((p) => `${typeName(p.t && p.t.arr ? p.t.arr : p.t)} ${p.name}${p.t && p.t.arr ? '[]' : ''}`).join(', '); const m = new RegExp('^\\s*([A-Za-z_][\\w ]*?)\\s+' + it.name + '\\s*\\((.*)\\)\\s*\\{?').exec(C.lines[it.line - 1] || ''); if (m && TYPEWORDS.test(m[1].trim())) { st.retText = m[1].trim(); st.params = m[2].trim(); } }
        st.body = stmts(it.body.body, CX); prog.stacks.push(st);
      }
    }
  } finally { SRC = null; }
  if (!prog.stacks.some((s) => s.hat === 'setup')) prog.stacks.push({ hat: 'setup', body: [] });
  if (!prog.stacks.some((s) => s.hat === 'loop')) prog.stacks.push({ hat: 'loop', body: [] });
  // comments nobody took (the last line inside a { }, the end of a `} else {` line, the end of the sketch): kept just after the block before them
  const lastCode = C.lines.reduce((m, l, i) => (l.trim() && C.full[i + 1] === undefined ? i + 1 : m), 0);
  seen.sort((x, y) => x[0] - y[0]);
  const left = [...Object.keys(C.full).filter((l) => !used.has('f' + l)).map((l) => [+l, C.full[l]]), ...Object.keys(C.tail).filter((l) => !used.has('t' + l)).map((l) => [+l, C.tail[l]])].sort((x, y) => x[0] - y[0]);
  for (const [l, text] of left) {
    if (l > lastCode) { prog.tail.push(text); continue; }
    let owner = null; for (const [sl, b] of seen) { if (sl <= l) owner = b; else break; }
    if (!owner) { prog.head.push(text); continue; }
    if (owner.hat) (owner.first = owner.first || []).push(text); else (owner.after = owner.after || []).push(text);
  }
  return { ok: true, prog, at };
}
const rawS = (s) => ({ id: nid(), t: 'raw', f: { code: pstmt(s, '').join('\n') }, i: {} });
const rawV = (e) => ({ id: nid(), t: 'rawv', f: { code: pexpr(e) }, i: {} });
function rawProto(it) { const m = SRC && new RegExp('^\\s*(.*\\b' + it.name + '\\s*\\(.*\\)\\s*;)').exec(SRC[it.line - 1] || ''); return { id: nid(), t: 'raw', f: { code: m ? m[1].replace(/\s*\/\/.*$/, '') : `${typeName(it.ret)} ${it.name}(${it.params.map((p) => typeName(p.t) + ' ' + p.name).join(', ')});` }, i: {} }; }
function declBlocks(d, CX) {
  const out = []; const devs = CX.devs;
  for (const v of d.vars) {
    const one = Object.assign({}, d, { vars: [v] }); const ty = String(d.ty); const A = v.ctorArgs || []; const lit = (k) => (A[k] && A[k].k === 'num' ? A[k].text || String(A[k].v) : null);
    const plain = d.vars.length === 1 || v === d.vars[0];
    if (ty === 'servo' && !v.dims.length && !v.init) { devs[v.name] = 'servo'; out.push(mk('servo_decl', { n: v.name })); continue; }
    if (ty.startsWith('o:') && !v.dims.length) {
      const T = ty.slice(2); devs[v.name] = T;
      if (T === 'LiquidCrystal_I2C' && A.length === 3 && A.every((a) => a.k === 'num')) { out.push(mk('lcd_decl', { n: v.name, addr: lit(0), cols: lit(1), rows: lit(2) })); continue; }
      if (T === 'Adafruit_SSD1306' && pdecl(one) === `Adafruit_SSD1306 ${v.name}(128, 64, &Wire, -1);`) { out.push(mk('oled_decl', { n: v.name })); continue; }
      if (T === 'DHT' && A.length === 2 && A[0].k === 'num' && isId(A[1]) && /^DHT(11|22)$/.test(A[1].name)) { out.push(mk('dht_decl', { n: v.name, pin: lit(0), ty: A[1].name })); continue; }
      if (T === 'Stepper' && A.length === 5 && (A[0].k === 'num' || isId(A[0])) && A.slice(1).every((a) => a.k === 'num')) { out.push(mk('stp_decl', { n: v.name, steps: lit(0) || A[0].name, p1: lit(1), p2: lit(2), p3: lit(3), p4: lit(4) })); continue; }
      if (T === 'MFRC522' && A.length === 2 && A.every((a) => a.k === 'num')) { out.push(mk('rfid_decl', { n: v.name, ss: lit(0), rst: lit(1) })); continue; }
      out.push(rawS(one)); continue;
    }
    const st = srcType(d); const want = st ? st.replace(/^(const |static |volatile )+/, '') : ty === 'str' ? 'String' : typeName(ty); const kind = st ? (st.match(/^((?:const |static |volatile )+)/) || ['', ''])[1].trim() : d.isConst ? 'const' : '';
    if (plain && !v.dims.length && v.init && v.init.k !== 'list' && !v.ctorArgs && ['int', 'long', 'float', 'bool', 'byte', 'char', 'str', 'ulong', 'uint'].includes(ty)) {
      out.push(mk('decl', { kind, ty: want, n: v.name }, { v: val(v.init) })); continue;
    }
    out.push(rawS(one));
  }
  return out;
}
function stmts(list, CX) { return list.map((s) => { const b = stmt(s, CX); CX.take(s.line, b); return b; }); }
function body(s, CX) { return s.k === 'block' ? stmts(s.body, CX) : stmts([s], CX); }
const isId = (e, n) => e && e.k === 'id' && (n === undefined || e.name === n);
function stmt(s, CX) {
  switch (s.k) {
    case 'decl': { if (s.vars.length !== 1) return rawS(s); const bs = declBlocks(s, CX); return bs[0]; }
    case 'if': { if (s.semi) break; const b = mk(s.b ? 'ifelse' : 'if', {}, { c: val(s.c) }); b.s = body(s.a, CX); if (s.b) b.e = body(s.b, CX); return b; }
    case 'while': { const b = mk('while', {}, { c: val(s.c) }); b.s = body(s.body, CX); return b; }
    case 'for': { const b = forBlock(s); if (b) { b.s = body(s.body, CX); return b; } break; }
    case 'break': return mk('break');
    case 'return': if (!s.e) return mk('return'); break;
    case 'expr': { const b = exprStmt(s.e, CX.devs); if (b) return b; break; }
  }
  return rawS(s);
}
function forBlock(s) { // for (int i = A; i OP B; INC)
  const d = s.init; if (!d || d.k !== 'decl' || d.vars.length !== 1 || d.vars[0].dims.length || !d.vars[0].init || !['int', 'long', 'byte', 'uint', 'ulong'].includes(d.ty)) return null;
  const v = d.vars[0].name, c = s.c, n = s.inc; if (!c || c.k !== 'bin' || !['<', '<=', '>', '>='].includes(c.op) || !isId(c.a, v) || !n) return null;
  let dir, k, st;
  if ((n.k === 'post' || n.k === 'pre') && isId(n.e, v)) { dir = n.op === '++' ? '+' : '-'; k = VAL(1); st = n.k === 'pre' ? 'pre' : '++'; }
  else if (n.k === 'assign' && isId(n.a, v) && (n.op === '+=' || n.op === '-=')) { dir = n.op[0]; k = val(n.b); st = '+='; }
  else if (n.k === 'assign' && n.op === '=' && isId(n.a, v) && n.b.k === 'bin' && (n.b.op === '+' || n.b.op === '-') && isId(n.b.a, v)) { dir = n.b.op; k = val(n.b.b); st = '='; }
  else return null;
  const ty = srcType(d) || typeName(d.ty); const i0 = d.vars[0].init;
  if (st === '++' && dir === '+' && c.op === '<' && i0.k === 'num' && i0.v === 0 && i0.text === '0' && ty === 'int') return mk('repeat', { v }, { n: val(c.b) });
  return mk('count', { v, op: c.op, dir, st, ty }, { a: val(i0), b: val(c.b), k });
}
function exprStmt(e, devs) {
  if (e.k === 'post' || e.k === 'pre') { if (isId(e.e) && e.k === 'post') return mk('inc', { n: e.e.name, op: e.op }); return null; }
  if (e.k === 'assign' && isId(e.a)) { if (e.op === '=') return mk('set', { n: e.a.name }, { v: val(e.b) }); if (['+=', '-=', '*=', '/='].includes(e.op)) return mk('change', { n: e.a.name, op: e.op }, { v: val(e.b) }); return null; }
  if (e.k !== 'call') return null;
  const A = e.args;
  if (isId(e.f)) {
    const n = e.f.name;
    if (n === 'pinMode' && A.length === 2 && isId(A[1]) && /^(INPUT|OUTPUT|INPUT_PULLUP)$/.test(A[1].name)) return mk('pinmode', { mode: A[1].name }, { pin: pinV(A[0]) });
    if (n === 'digitalWrite' && A.length === 2) return mk('dwrite', {}, { pin: pinV(A[0]), v: levelV(A[1]) });
    if (n === 'analogWrite' && A.length === 2) return mk('awrite', {}, { pin: pinV(A[0]), v: val(A[1]) });
    if (n === 'delay' && A.length === 1) return mk('delay', {}, { ms: val(A[0]) });
    if (n === 'delayMicroseconds' && A.length === 1) return mk('delayus', {}, { us: val(A[0]) });
    if (n === 'tone' && A.length === 2) return mk('tone', {}, { pin: pinV(A[0]), f: val(A[1]) });
    if (n === 'tone' && A.length === 3) return mk('toned', {}, { pin: pinV(A[0]), f: val(A[1]), d: val(A[2]) });
    if (n === 'noTone' && A.length === 1) return mk('notone', {}, { pin: pinV(A[0]) });
    if (!/^[A-Z]/.test(n) && !['map', 'random', 'constrain'].includes(n)) return mk('call', { n, a: A.map((a) => pexpr(a, 2)).join(', ') });
    return null;
  }
  if (e.f.k !== 'member' || !isId(e.f.o)) return null;
  const o = e.f.o.name, m = e.f.m; const T = o === 'Serial' ? 'Serial' : o === 'IrReceiver' ? 'IR' : o === 'SPI' ? 'SPI' : devs[o];
  if (T === 'Serial') {
    if (m === 'begin' && A.length === 1 && A[0].k === 'num') return mk('ser_begin', { baud: A[0].text || String(A[0].v) });
    if ((m === 'print' || m === 'println') && A.length >= 1 && A.length <= 2) { const b = mk('ser_print', { ln: m }, { v: val(A[0]) }); if (A[1]) b.i.fmt = val(A[1]); return b; }
    if (m === 'println' && !A.length) return mk('ser_nl');
  }
  if (T === 'servo') { if (m === 'attach' && A.length === 1) return mk('servo_attach', { n: o }, { pin: pinV(A[0]) }); if (m === 'write' && A.length === 1) return mk('servo_write', { n: o }, { a: val(A[0]) }); }
  if (T === 'LiquidCrystal_I2C') {
    if (m === 'init' && !A.length) return mk('lcd_init', { n: o }); if ((m === 'backlight' || m === 'noBacklight') && !A.length) return mk('lcd_bl', { n: o, m }); if (m === 'clear' && !A.length) return mk('lcd_clear', { n: o });
    if (m === 'setCursor' && A.length === 2) return mk('lcd_cursor', { n: o }, { col: val(A[0]), row: val(A[1]) });
    if (m === 'print' && A.length >= 1 && A.length <= 2) { const b = mk('lcd_print', { n: o }, { v: val(A[0]) }); if (A[1]) b.i.fmt = val(A[1]); return b; }
  }
  if (T === 'Adafruit_SSD1306') {
    if (m === 'begin' && A.length === 2 && isId(A[0], 'SSD1306_SWITCHCAPVCC') && A[1].k === 'num') return mk('oled_begin', { n: o, addr: A[1].text || String(A[1].v) });
    if (m === 'clearDisplay' && !A.length) return mk('oled_clear', { n: o }); if (m === 'display' && !A.length) return mk('oled_show', { n: o });
    if (m === 'setTextSize' && A.length === 1) return mk('oled_size', { n: o }, { s: val(A[0]) }); if (m === 'setTextColor' && A.length === 1 && isId(A[0]) && /^SSD1306_/.test(A[0].name)) return mk('oled_color', { n: o, col: A[0].name });
    if (m === 'setCursor' && A.length === 2) return mk('oled_cursor', { n: o }, { x: val(A[0]), y: val(A[1]) });
    if ((m === 'print' || m === 'println') && A.length >= 1 && A.length <= 2) { const b = mk('oled_print', { n: o, ln: m }, { v: val(A[0]) }); if (A[1]) b.i.fmt = val(A[1]); return b; }
    if ((m === 'drawRect' || m === 'fillRect') && A.length === 5 && isId(A[4])) return mk('oled_rect', { n: o, m, col: A[4].name }, { x: val(A[0]), y: val(A[1]), w: val(A[2]), h: val(A[3]) });
    if ((m === 'drawCircle' || m === 'fillCircle') && A.length === 4 && isId(A[3])) return mk('oled_circle', { n: o, m, col: A[3].name }, { x: val(A[0]), y: val(A[1]), r: val(A[2]) });
  }
  if (T === 'DHT' && m === 'begin' && !A.length) return mk('dht_begin', { n: o });
  if (T === 'IR') { if (m === 'begin' && A.length >= 1 && A.length <= 2 && (A.length === 1 || isId(A[1]))) return mk('ir_begin', A[1] ? { fb: A[1].name } : {}, { pin: pinV(A[0]) }); if (m === 'resume' && !A.length) return mk('ir_resume'); }
  if (T === 'Stepper') { if (m === 'setSpeed' && A.length === 1) return mk('stp_speed', { n: o }, { rpm: val(A[0]) }); if (m === 'step' && A.length === 1) return mk('stp_step', { n: o }, { s: val(A[0]) }); }
  if (T === 'MFRC522' && m === 'PCD_Init' && !A.length) return mk('rfid_init', { n: o });
  if (T === 'SPI' && m === 'begin' && !A.length) return mk('spi_begin');
  return null;
}
const pinV = (e) => (e.k === 'num' && e.ty !== 'char' && e.text === undefined ? LIT('pin', e.v) : e.k === 'num' && /^\d+$/.test(e.text || '') ? LIT('pin', e.text) : isId(e) && /^(A[0-7]|LED_BUILTIN)$/.test(e.name) ? LIT('pin', e.name) : val(e));
const levelV = (e) => (isId(e) && (e.name === 'HIGH' || e.name === 'LOW') ? LIT('level', e.name) : val(e));
function val(e) { // an expression as a value block
  switch (e.k) {
    case 'num': if (e.ty === 'char' && /^'/.test(e.text || '')) return LIT('char', String.fromCharCode(e.v)); return LIT('num', e.text !== undefined ? e.text : e.v);
    case 'str': return LIT('text', e.v);
    case 'un': if (e.op === '-' && e.e.k === 'num' && e.e.ty !== 'char') return LIT('num', '-' + (e.e.text || e.e.v)); if (e.op === '!') return mk('not', {}, { a: val(e.e) }); break;
    case 'id': if (e.name === 'true' || e.name === 'false') return LIT('bool', e.name); if (CONSTNAMES.test(e.name)) return LIT('const', e.name); return mk('var', { n: e.name });
    case 'bin': { const op = e.op; if (['+', '-', '*', '/', '%'].includes(op)) return mk('arith', { op }, { a: val(e.a), b: val(e.b) }); if (['==', '!=', '<', '>', '<=', '>='].includes(op)) return mk('cmp', { op }, { a: val(e.a), b: val(e.b) }); if (op === '&&' || op === '||') return mk('logic', { op }, { a: val(e.a), b: val(e.b) }); break; }
    case 'call': {
      const A = e.args;
      if (isId(e.f)) { const n = e.f.name;
        if (n === 'digitalRead' && A.length === 1) return mk('dread', {}, { pin: pinV(A[0]) }); if (n === 'analogRead' && A.length === 1) return mk('aread', {}, { pin: pinV(A[0]) });
        if (n === 'millis' && !A.length) return mk('millis'); if (n === 'map' && A.length === 5) { const b = mk('map'); ['v', 'a', 'b', 'c', 'd'].forEach((k, i) => { b.i[k] = val(A[i]); }); return b; }
        if (n === 'constrain' && A.length === 3) return mk('constrain', {}, { v: val(A[0]), a: val(A[1]), b: val(A[2]) }); if (n === 'random' && A.length === 2) return mk('random', {}, { a: val(A[0]), b: val(A[1]) }); if (n === 'abs' && A.length === 1) return mk('abs', {}, { v: val(A[0]) });
        break; }
      if (e.f.k === 'member' && isId(e.f.o)) { const o = e.f.o.name, m = e.f.m;
        if (o === 'IrReceiver' && m === 'decode' && !A.length) return mk('ir_decode'); if (o === 'Serial' && m === 'available' && !A.length) return mk('ser_avail'); if (o === 'Serial' && m === 'read' && !A.length) return mk('ser_read');
        if (m === 'readTemperature' && (!A.length || (A.length === 1 && isId(A[0], 'true')))) return mk('dht_t', { n: o, u: A.length ? 'true' : '' }); if (m === 'readHumidity' && !A.length) return mk('dht_h', { n: o });
        if (m === 'getKey' && !A.length) return mk('kp_get', { n: o }); if (m === 'PICC_IsNewCardPresent' && !A.length) return mk('rfid_new', { n: o }); if (m === 'PICC_ReadCardSerial' && !A.length) return mk('rfid_read', { n: o });
        if (m === 'read' && !A.length && o !== 'Serial') return mk('servo_read', { n: o });
      }
      break;
    }
    case 'member': if (e.m === 'command' && e.o.k === 'member' && e.o.m === 'decodedIRData' && isId(e.o.o, 'IrReceiver')) return mk('ir_cmd'); break;
  }
  return rawV(e);
}

// ------------------------------------------------------------------ blocks -> C++
const cm = (n) => (n ? '// ' + n : '//');
// a block's slot as C++ (in brackets when the block inside binds less tightly than the place it sits in)
const G = { v(b, k, min = 0) { const x = b.i[k]; if (!x) return '0'; const d = BK[x.t]; const s = d.g(x, G); const p = typeof d.p === 'function' ? d.p(x) : d.p; return (p ?? 16) < min ? `(${s})` : s; } };
const INC_ORDER = ['Wire.h', 'SPI.h', 'Adafruit_GFX.h', 'Adafruit_SSD1306.h', 'LiquidCrystal_I2C.h', 'DHT.h', 'IRremote.hpp', 'Keypad.h', 'Servo.h', 'Stepper.h', 'MFRC522.h'];
export function toCpp(prog) {
  const lines = []; const at = new Map(); // line -> block id
  const incs = prog.includes.slice(); const need = new Set();
  const walk = (list) => { for (const b of list || []) { const d = BK[b.t]; if (d && d.inc) d.inc.forEach((h) => need.add(h)); for (const k in b.i) if (b.i[k]) walk([b.i[k]]); walk(b.s); walk(b.e); } };
  for (const s of prog.stacks) walk(s.body);
  for (const h of INC_ORDER) if (need.has(h) && !incs.includes(h) && !(h === 'IRremote.hpp' && incs.includes('IRremote.h'))) incs.push(h);
  for (const h of prog.head) lines.push(cm(h));
  if (incs.length) { for (const h of incs) lines.push(`#include <${h}>`); }

  const emit = (b, ind) => {
    if (b.gap && lines.length && lines[lines.length - 1] !== '') lines.push('');
    for (const n of b.note || []) lines.push(ind + cm(n));
    const d = BK[b.t]; const first = lines.length + 1;
    if (d.raw) { const ls = String(b.f.code).split('\n'); ls.forEach((l, i) => lines.push(ind + l + (i === ls.length - 1 && b.c ? '\u0001' + b.c : ''))); }
    else if (d.C) {
      lines.push(ind + d.g(b, G) + (b.c ? '\u0001' + b.c : '')); for (const x of b.s) emit(x, ind + '  ');
      if (d.E) { const only = b.e.length === 1 && (b.e[0].t === 'if' || b.e[0].t === 'ifelse') && !b.e[0].note && !b.e[0].gap; if (only) { const L0 = lines.length; emit(b.e[0], ind); lines[L0] = ind + '} else ' + lines[L0].trim(); for (const n of b.after || []) lines.push(ind + cm(n)); return mark(b, first); } lines.push(ind + '} else {'); for (const x of b.e) emit(x, ind + '  '); }
      lines.push(ind + '}');
    } else lines.push(ind + d.g(b, G) + (b.c ? '\u0001' + b.c : ''));
    for (const n of b.after || []) lines.push(ind + cm(n));
    mark(b, first);
  };
  const mark = (b, first) => { for (let l = first; l <= lines.length; l++) if (!at.has(l)) at.set(l, b.id); };
  for (const st of prog.stacks) {
    if (st.hat === 'globals') { if (st.body.length && lines.length) lines.push(''); for (const b of st.body) emit(b, ''); continue; }
    if (lines.length) lines.push('');
    for (const n of st.note || []) lines.push(cm(n));
    const head = st.hat === 'func' ? `${st.retText || typeName(st.ret || 'void')} ${st.name}(${st.params || ''}) {` : `void ${st.hat}() {`; lines.push(head + (st.c ? '\u0001' + st.c : ''));
    for (const n of st.first || []) lines.push('  ' + cm(n));
    for (const b of st.body) emit(b, '  '); lines.push('}');
  }
  if (prog.tail && prog.tail.length) { lines.push(''); for (const n of prog.tail) lines.push(cm(n)); }
  // the comments at the ends of lines: lined up in each run of lines that have one
  const out = []; let i = 0;
  while (i < lines.length) {
    if (!lines[i].includes('\u0001')) { out.push(lines[i]); i++; continue; }
    let j = i; while (j < lines.length && lines[j].includes('\u0001')) j++;
    const w = Math.max(...lines.slice(i, j).map((l) => l.indexOf('\u0001'))); for (let k = i; k < j; k++) { const [c, m] = lines[k].split('\u0001'); out.push(c.padEnd(Math.min(w, c.length + 18)) + '   // ' + m); } i = j;
  }
  return { code: out.join('\n') + '\n', at };
}

// what changed between two programs made of the same blocks: values typed, choices made, value blocks dragged into slots
// -> [{ kind: 'lit' | 'field' | 'slot', block, key, v }], or null when blocks were added, removed or swapped
export const LIT_TYPES = ['num', 'text', 'char', 'pin', 'level', 'bool', 'const'];
export function blockDiff(A, B) {
  const ch = []; const fail = () => { throw new Error('structure'); };
  const grey = (b) => { let n = 0; const w = (x) => { if (!x) return; if (x.t === 'raw' || x.t === 'rawv') n++; Object.values(x.i || {}).forEach(w); (x.s || []).forEach(w); (x.e || []).forEach(w); }; w(b); return n; };
  const walk = (a, b) => {
    if (Array.isArray(a)) { if (!Array.isArray(b) || a.length !== b.length) fail(); a.forEach((x, i) => walk(x, b[i])); return; }
    if (!a || !b || a.t !== b.t) fail();
    if (LIT_TYPES.includes(a.t)) { if (a.f.v !== b.f.v) ch.push({ kind: 'lit', block: a, v: b.f.v }); return; }
    for (const k of new Set([...Object.keys(a.f || {}), ...Object.keys(b.f || {})])) if (a.f[k] !== b.f[k]) ch.push({ kind: 'field', block: a, key: k, v: b.f[k] });
    for (const k of new Set([...Object.keys(a.i || {}), ...Object.keys(b.i || {})])) { const x = a.i[k], y = b.i[k]; if (x && y && x.t !== y.t && !grey(y)) ch.push({ kind: 'slot', block: a, key: k, v: y }); else walk(x, y); }
    if (a.s) walk(a.s, b.s); if (a.e) walk(a.e, b.e);
  };
  try { walk(A.stacks.map((x) => x.body), B.stacks.map((x) => x.body)); } catch (e) { return null; }
  return ch;
}
export const blockCat = (t) => BK[t] && BK[t].c;

// ------------------------------------------------------------------ the editor (DOM): palette, workspace, drag and drop
const CSS = `
#b3{display:none;min-height:0;min-width:0;background:#0d1117;border-right:1px solid var(--line);position:relative;overflow:hidden;font-family:"Noto Sans Devanagari",system-ui,sans-serif}
#codepane.b3-on{display:grid!important;grid-template-columns:minmax(0,1fr);grid-template-rows:minmax(0,1.65fr) minmax(0,1fr) auto auto;grid-template-areas:"bk" "ed" "er" "rb"}
#codepane.b3-on #b3{border-right:0;border-bottom:1px solid var(--line)}
body.b3-wide #codepane.b3-on{grid-template-columns:minmax(0,1.5fr) minmax(0,1fr);grid-template-rows:minmax(0,1fr) auto auto;grid-template-areas:"bk ed" "er er" "rb rb"}
body.b3-wide #codepane.b3-on #b3{border-right:1px solid var(--line);border-bottom:0}
#codepane.b3-on #b3{display:flex;grid-area:bk}#codepane.b3-on #editor{grid-area:ed;font-size:12px;line-height:18px}#codepane.b3-on #errs{grid-area:er}#codepane.b3-on #runbar{grid-area:rb}
#codepane.b3-on .ed-g div{height:18px}
body.b3-wide{--side:min(900px,56vw)}
#b3-mode{display:flex;margin-left:6px}#b3-mode button{padding:5px 11px;font-size:13px}
:is(#b3,#b3g) .b3-pal{width:150px;flex:none;display:flex;flex-direction:column;border-right:1px solid var(--line);background:#10151c;transition:background .15s}
:is(#b3,#b3g) .b3-pal.trash{background:rgba(255,90,70,.22)}
:is(#b3,#b3g) .b3-cats{display:flex;flex-wrap:wrap;gap:3px;padding:6px 5px;border-bottom:1px solid var(--line)}
:is(#b3,#b3g) .b3-cats button{font-size:11px;font-weight:700;padding:4px 6px;border-radius:7px;color:#dfe6ee;background:rgba(255,255,255,.05);display:flex;align-items:center;gap:4px;min-height:28px}
:is(#b3,#b3g) .b3-cats button i{width:10px;height:10px;border-radius:50%;flex:none}:is(#b3,#b3g) .b3-cats button.on{background:rgba(255,255,255,.16);color:#fff}
:is(#b3,#b3g) .b3-list{flex:1;overflow:auto;padding:8px 6px 40px;display:flex;flex-direction:column;align-items:flex-start;gap:8px;touch-action:pan-y}
:is(#b3,#b3g) .b3-list .b3-b{max-width:138px;font-size:12.5px}#b3 .b3-list :is(input,select,textarea){pointer-events:none}:is(#b3,#b3g) .b3-list .b3-row{padding:3px 7px;gap:4px}:is(#b3,#b3g) .b3-list select.b3-sel,:is(#b3,#b3g) .b3-list input.b3-lit{font-size:12px;max-width:96px}:is(#b3,#b3g) .b3-list .b3-b.b3-c>.b3-in{min-height:12px}
:is(#b3,#b3g) .b3-ws{flex:1;overflow:auto;padding:10px 12px 120px;position:relative;touch-action:pan-x pan-y}
:is(#b3,#b3g) .b3-zoom{position:absolute;right:8px;bottom:8px;display:flex;gap:4px;z-index:3}:is(#b3,#b3g) .b3-zoom button{width:34px;height:34px;border-radius:9px;background:rgba(255,255,255,.1);font-size:18px;font-weight:700}
:is(#b3,#b3g) .b3-stack{margin:0 0 18px;display:inline-flex;flex-direction:column;align-items:flex-start;min-width:240px}
:is(#b3,#b3g) .b3-hat{background:var(--bc);color:#fff;font-weight:800;font-size:13.5px;padding:9px 14px 9px 12px;border-radius:16px 16px 4px 4px;box-shadow:0 2px 0 rgba(0,0,0,.25);min-width:200px}
:is(#b3,#b3g) .b3-hat small{display:block;font-weight:600;opacity:.85;font-size:11px}
:is(#b3,#b3g) .b3-list-in{display:flex;flex-direction:column;align-items:flex-start;padding-left:0}
:is(#b3,#b3g) .b3-gap{height:8px;min-width:120px;align-self:stretch;border-radius:4px;position:relative}
:is(#b3,#b3g) .b3-gap.hot::after{content:"";position:absolute;left:0;right:0;top:2px;height:5px;border-radius:3px;background:#5ad8ff;box-shadow:0 0 0 2px rgba(90,216,255,.35)}
:is(#b3,#b3g) .b3-empty{font-size:11.5px;color:#7d8794;padding:6px 10px;border:1.5px dashed rgba(255,255,255,.18);border-radius:8px;margin:2px 0;min-width:160px}
:is(#b3,#b3g) .b3-b{--bc:#888;background:var(--bc);color:#fff;border-radius:7px;font-size:13.5px;font-weight:600;box-shadow:0 2px 0 rgba(0,0,0,.28),inset 0 1px 0 rgba(255,255,255,.18);touch-action:none;user-select:none;-webkit-user-select:none;cursor:grab;position:relative;max-width:100%}
:is(#b3,#b3g) .b3-s{min-height:38px;padding:3px 0}
:is(#b3,#b3g) .b3-s::before{content:"";position:absolute;left:14px;top:-4px;width:18px;height:5px;background:var(--bc);border-radius:2px 2px 0 0}
:is(#b3,#b3g) .b3-row{display:flex;align-items:center;flex-wrap:wrap;gap:5px;padding:4px 9px;min-height:32px}
:is(#b3,#b3g) .b3-v{border-radius:18px;display:inline-flex}:is(#b3,#b3g) .b3-v .b3-row{padding:2px 7px;min-height:28px}
:is(#b3,#b3g) .b3-v.b3-bool{border-radius:6px;clip-path:polygon(9px 0,calc(100% - 9px) 0,100% 50%,calc(100% - 9px) 100%,9px 100%,0 50%)}:is(#b3,#b3g) .b3-v.b3-bool .b3-row{padding:2px 14px}
:is(#b3,#b3g) .b3-c>.b3-in{margin-left:16px;border-left:12px solid var(--bc);min-height:22px;padding:2px 0 2px 4px;display:flex;flex-direction:column;align-items:flex-start;background:rgba(0,0,0,.18)}
:is(#b3,#b3g) .b3-c>.b3-foot{height:14px;border-radius:0 0 7px 7px}:is(#b3,#b3g) .b3-c .b3-mid{padding:4px 9px;font-weight:700}
:is(#b3,#b3g) .b3-slot{display:inline-flex;align-items:center;min-height:26px;min-width:30px;border-radius:14px;background:rgba(0,0,0,.18)}
:is(#b3,#b3g) .b3-slot.hot{outline:3px solid #5ad8ff;outline-offset:1px}
:is(#b3,#b3g) input.b3-lit,:is(#b3,#b3g) select.b3-sel{background:#fff;color:#1b1e24;border:0;border-radius:13px;padding:3px 8px;font:600 13.5px "Noto Sans Devanagari",system-ui,sans-serif;min-width:30px;max-width:160px;height:26px}
:is(#b3,#b3g) input.b3-lit.num{text-align:center}:is(#b3,#b3g) select.b3-pin{max-width:74px}:is(#b3,#b3g) input.b3-lit.txt::before{content:'"'}
:is(#b3,#b3g) select.b3-sel{padding:3px 4px;border-radius:7px;background:rgba(255,255,255,.92)}:is(#b3,#b3g) select.b3-dev{background:rgba(0,0,0,.25);color:#fff}
:is(#b3,#b3g) .b3-raw{font:500 12.5px var(--mono);background:#20252d;color:#e6e9ee;border:1px solid #3a414c;border-radius:6px;padding:4px 6px;min-width:180px;max-width:460px;resize:none;white-space:pre;overflow:hidden}
:is(#b3,#b3g) .b3-note{font:italic 500 11.5px "Noto Sans Devanagari",system-ui,sans-serif;color:#9aa6b4;padding:0 4px 1px;max-width:360px}
:is(#b3,#b3g) .b3-cm{font:italic 500 11.5px "Noto Sans Devanagari",system-ui,sans-serif;color:rgba(255,255,255,.82);background:rgba(0,0,0,.2);border-radius:6px;padding:1px 6px;max-width:220px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
:is(#b3,#b3g) .b3-b.run{box-shadow:0 0 0 3px #ffd76a,0 0 14px rgba(255,215,106,.7)}:is(#b3,#b3g) .b3-b.err{box-shadow:0 0 0 3px #ff6b5a}
:is(#b3,#b3g) .b3-msg{position:absolute;left:140px;right:10px;top:8px;z-index:4;background:rgba(255,90,70,.92);color:#fff;border-radius:9px;padding:7px 10px;font-size:13px;display:none}:is(#b3,#b3g) .b3-msg.on{display:block}
.b3-ghost{position:fixed;left:0;top:0;z-index:60;pointer-events:none;opacity:.9;transform-origin:0 0}
#b3g{position:fixed;left:0;top:0;width:100vw;height:0;z-index:60;pointer-events:none;font-family:"Noto Sans Devanagari",system-ui,sans-serif}#b3g .b3-ghost{position:absolute!important;left:0;top:0;max-width:min(560px,90vw);box-shadow:0 10px 26px rgba(0,0,0,.5)!important}
@media (max-width:980px){body.b3-wide{--side:0px}body.b3-blocks #side{width:min(900px,98vw)}}
@media (max-width:980px) and (min-width:640px){body.b3-blocks #codepane.b3-on{grid-template-columns:minmax(0,1.5fr) minmax(0,1fr);grid-template-rows:minmax(0,1fr) auto auto;grid-template-areas:"bk ed" "er er" "rb rb"}body.b3-blocks #codepane.b3-on #b3{border-right:1px solid var(--line);border-bottom:0}}
@media (max-height:520px){body.b3-blocks #side.both #serpane{flex:0 0 26%}:is(#b3,#b3g) .b3-pal{width:128px}:is(#b3,#b3g) .b3-list .b3-b{max-width:118px}:is(#b3,#b3g) .b3-cats button{font-size:10px;padding:3px 4px;min-height:24px}}
`;
const HATS = { globals: ['vars', UI3.globals], setup: ['control', UI3.setup], loop: ['control', UI3.loop], func: ['control', UI3.func] };
const store3 = { get(k) { try { return localStorage.getItem('rl360.b3.' + k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem('rl360.b3.' + k, v); } catch (e) { /* private */ } } };

export class BlockEditor {
  constructor(app) {
    this.app = app; this.mode = 'cpp'; this.prog = null; this.cat = 'pins'; this.zoom = +(store3.get('zoom') || 1); this.hist = []; this.lineMap = new Map();
    if (!document.getElementById('b3-css')) { const st = document.createElement('style'); st.id = 'b3-css'; st.textContent = CSS; document.head.appendChild(st); }
    const pane = document.getElementById('codepane'); this.pane = pane;
    this.box = document.createElement('div'); this.box.id = 'b3'; pane.insertBefore(this.box, pane.firstChild);
    this.box.innerHTML = '<div class="b3-pal"><div class="b3-cats"></div><div class="b3-list"></div></div><div class="b3-ws"></div><div class="b3-zoom"><button data-z="-1" aria-label="smaller">−</button><button data-z="1" aria-label="bigger">+</button></div><div class="b3-msg"></div>';
    this.cats = this.box.querySelector('.b3-cats'); this.list = this.box.querySelector('.b3-list'); this.ws = this.box.querySelector('.b3-ws'); this.pal = this.box.querySelector('.b3-pal'); this.msgEl = this.box.querySelector('.b3-msg');
    for (const b of this.box.querySelectorAll('[data-z]')) b.onclick = () => { this.zoom = Math.max(0.75, Math.min(1.6, +(this.zoom + 0.15 * b.dataset.z).toFixed(2))); store3.set('zoom', this.zoom); this.applyZoom(); };
    const tabs = document.getElementById('s-tabs'); this.sw = document.createElement('div'); this.sw.id = 'b3-mode'; this.sw.className = 'seg'; this.sw.innerHTML = '<button data-m="blocks"></button><button data-m="cpp"></button>';
    tabs.insertBefore(this.sw, tabs.querySelector('.sp')); for (const b of this.sw.querySelectorAll('button')) b.onclick = () => this.setMode(b.dataset.m, true);
    this.onMove = (e) => this.dragMove(e); this.onUp = (e) => this.dragEnd(e);
    addEventListener('keydown', (e) => { if (this.mode === 'blocks' && (e.ctrlKey || e.metaKey) && e.key === 'z' && !/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement && document.activeElement.tagName)) { e.preventDefault(); this.undo(); } });
    this.renderSwitch();
  }
  // does this board / lesson take Arduino blocks? (the micro:bit has its own blocks and Python)
  usable() { const a = this.app; const w = a.world; return !(w && w.blocks) && (!a.lab.def || a.lab.def.id !== 'microbit') && !(a.rt.lesson && a.rt.lesson.lang === 'py') && !(a.lab.def && a.lab.def.py); } // (batch 6: a Python board)
  renderSwitch() {
    const ok = this.usable(); this.sw.style.display = ok ? '' : 'none';
    for (const b of this.sw.querySelectorAll('button')) { b.textContent = b.dataset.m === 'blocks' ? '🧩 ' + tx(T3W.blocks) : '{ } C++'; b.classList.toggle('on', b.dataset.m === this.mode); }
  }
  onLesson(Ls) { if (!Ls) return; const saved = store3.get('mode.' + Ls.id); const want = saved || (Ls.blocks ? 'blocks' : 'cpp'); this.setMode(this.usable() ? want : 'cpp', false); }
  onFree() { this.setMode(this.usable() ? store3.get('mode.free') || 'cpp' : 'cpp', false); }
  setMode(m, user) {
    if (m === 'blocks') { const r = toBlocks(this.app.code()); if (!r.ok) { if (user) this.app.toast(this.why(r.error), 'bad', 6000); m = 'cpp'; } else { this.prog = r.prog; this.hist = []; this.lineMap = r.at; this.src = this.app.code(); } }
    this.mode = m; this.pane.classList.toggle('b3-on', m === 'blocks'); document.body.classList.toggle('b3-blocks', m === 'blocks'); this.fit(true);
    const key = this.app.mode === 'lesson' && this.app.rt.lesson ? this.app.rt.lesson.id : 'free'; if (user) store3.set('mode.' + key, m);
    this.renderSwitch(); if (m === 'blocks') { this.renderPalette(); this.render(); } else this.app.editor.paint && this.app.editor.paint(); this.msg('');
  }
  // wide (blocks and C++ side by side, the bench smaller) while the work is coding: a lesson's edit and run steps, the free
  // build; narrow (blocks above the C++) while the student builds on the bench, watches or acts in the scene
  fit(force) {
    const a = this.app; const s = a.mode === 'lesson' && a.rt.lesson ? a.rt.lesson.steps[a.rt.i] : null;
    const wide = this.mode === 'blocks' && (a.mode !== 'lesson' || !s || s.k === 'edit' || s.k === 'run');
    if (!force && wide === this.wide) return; this.wide = wide; document.body.classList.toggle('b3-wide', wide);
    a.layout(); clearTimeout(this._lt); this._lt = setTimeout(() => a.layout(), 340);
  }
  msg(s) { this.msgEl.textContent = s || ''; this.msgEl.classList.toggle('on', !!s); }
  why(e) { return e.code === 'B3_DEFINE' ? tx(B3ERR.define) : tx(UI3.parseErr, { n: e.line }); }
  // the C++ changed: typed by hand (read it back into blocks), or made by the blocks (nothing to do)
  onCode(v) {
    if (this.mode === 'blocks' && !this.usable()) { this.setMode('cpp'); return; }
    if (this.mode !== 'blocks' || this.writing || v === this.src) return;
    clearTimeout(this._ct); this._ct = setTimeout(() => { if (this.mode !== 'blocks') return; if (v !== this.app.code()) return; const r = toBlocks(v); if (!r.ok) { this.msg(this.why(r.error)); return; } this.msg(''); this.src = v; this.prog = r.prog; this.lineMap = r.at; this.render(); }, 420);
  }
  // the blocks changed: write the C++ (the editor shows it, Run runs it)
  regen() {
    const { code, at } = toCpp(this.prog); this.lineMap = at; this.src = code; if (code === this.app.code()) return;
    this.writing = true; try { this.app.editor.value = code; this.app.onEdit(code); } finally { this.writing = false; }
  }
  snapshot() { this.hist.push(JSON.stringify(this.prog)); if (this.hist.length > 40) this.hist.shift(); }
  undo() { const s = this.hist.pop(); if (!s) return; this.prog = JSON.parse(s); this.render(); this.regen(); }
  changed() { this.render(); this.regen(); }
  applyZoom() { this.ws.style.zoom = this.zoom; }
  // ---------------------------------------------------------------- drawing
  renderPalette() {
    this.cats.innerHTML = Object.entries(PALETTE).map(([k]) => `<button data-c="${k}" class="${k === this.cat ? 'on' : ''}"><i style="background:${CAT[k][1]}"></i>${esc(tx(CAT[k][0]))}</button>`).join('');
    for (const b of this.cats.querySelectorAll('button')) b.onclick = () => { this.cat = b.dataset.c; this.renderPalette(); };
    this.list.innerHTML = '';
    for (const t of PALETTE[this.cat]) { const b = mk(t); this.fitNames(b); const el = this.blockEl(b, true); el.dataset.pal = t; el.addEventListener('pointerdown', (e) => this.dragStart(e, { t, proto: b })); this.list.appendChild(el); }
  }
  // a new block from the palette takes the names already in the program (the LCD is called lcd, the variable count…)
  fitNames(b) {
    const def = BK[b.t]; const devs = this.devices(); const vars = this.variables();
    for (const [, k, kind] of slots(def)) { if (kind && kind.startsWith('DEV.')) { const ty = kind.slice(4); const have = Object.keys(devs).filter((n) => devs[n] === ty); if (have.length) b.f[k] = have[0]; } if (kind === 'VAR' && vars.length) b.f[k] = vars[0]; }
  }
  devices() { const d = {}; const walk = (l) => { for (const b of l || []) { const def = BK[b.t]; if (def && def.dev) d[b.f.n] = def.dev; if (b.t === 'raw') { const m = /^\s*(?:Keypad|IRrecv)\s+(\w+)/.exec(b.f.code); if (m) d[m[1]] = /Keypad/.test(b.f.code) ? 'Keypad' : 'IRrecv'; } walk(b.s); walk(b.e); } }; if (this.prog) for (const s of this.prog.stacks) walk(s.body); return d; }
  variables() { const v = []; const walk = (l) => { for (const b of l || []) { if (b.t === 'decl' && !b.f.kind) v.push(b.f.n); if (b.t === 'count') v.push(b.f.v); walk(b.s); walk(b.e); } }; if (this.prog) for (const s of this.prog.stacks) walk(s.body); return [...new Set(v)]; }
  render() {
    this.renderSwitch(); if (this.mode !== 'blocks' || !this.prog) return; const ws = this.ws; const top = ws.scrollTop; ws.innerHTML = '';
    this.renderPalette();
    for (const st of this.prog.stacks) {
      const d = document.createElement('div'); d.className = 'b3-stack'; const [c, lab] = HATS[st.hat];
      const h = document.createElement('div'); h.className = 'b3-hat'; h.style.setProperty('--bc', CAT[c][1]);
      h.innerHTML = st.hat === 'func' ? `${esc(tx(lab))} <b>${esc(st.name)}</b>(${esc(st.params || '')})` : esc(tx(lab)); if (st.note && st.note.length) h.innerHTML += `<small>// ${esc(st.note.join(' '))}</small>`; d.appendChild(h);
      d.appendChild(this.listEl(st.body)); ws.appendChild(d);
    }
    this.applyZoom(); ws.scrollTop = top; this.showRun(this.runLine, true);
  }
  listEl(list) {
    const d = document.createElement('div'); d.className = 'b3-list-in'; d.appendChild(this.gap(list, 0));
    if (!list.length) { const e = document.createElement('div'); e.className = 'b3-empty'; e.textContent = tx(UI3.drop); d.appendChild(e); }
    list.forEach((b, i) => { if (b.note && b.note.length) { const n = document.createElement('div'); n.className = 'b3-note'; n.textContent = '// ' + b.note.join(' '); d.appendChild(n); } d.appendChild(this.blockEl(b)); d.appendChild(this.gap(list, i + 1)); });
    return d;
  }
  gap(list, i) { const g = document.createElement('div'); g.className = 'b3-gap'; g._at = [list, i]; return g; }
  blockEl(b, src) {
    const def = BK[b.t]; const el = document.createElement('div'); el.className = `b3-b ${def.k === 's' ? 'b3-s' : 'b3-v'}${def.C ? ' b3-c' : ''}${def.b ? ' b3-bool' : ''}`; el.style.setProperty('--bc', CAT[def.c][1]); el._b = b; el.dataset.id = b.id;
    const row = document.createElement('div'); row.className = 'b3-row'; el.appendChild(row);
    if (def.raw) {
      const ta = document.createElement(def.k === 's' ? 'textarea' : 'input'); ta.className = 'b3-raw'; ta.value = b.f.code; ta.spellcheck = false; if (def.k === 's') { ta.rows = String(b.f.code).split('\n').length; ta.cols = Math.min(56, Math.max(14, ...String(b.f.code).split('\n').map((l) => l.length))); } else ta.size = Math.max(4, String(b.f.code).length);
      if (src) ta.readOnly = true; else { ta.onchange = () => { this.snapshot(); b.f.code = ta.value; this.regen(); }; ta.oninput = () => { if (def.k === 's') ta.rows = ta.value.split('\n').length; }; }
      ta.addEventListener('pointerdown', (e) => e.stopPropagation()); const tag = document.createElement('span'); tag.textContent = 'C++'; tag.style.cssText = 'font-size:11px;opacity:.8'; row.appendChild(tag); row.appendChild(ta);
    } else this.words(row, b, def, def.txt, src);
    if (b.c && !src) { const c = document.createElement('span'); c.className = 'b3-cm'; c.textContent = '// ' + b.c; c.title = b.c; row.appendChild(c); }
    if (def.C) {
      el.appendChild(src ? emptyIn() : Object.assign(this.listEl(b.s), { className: 'b3-list-in b3-in' }));
      if (def.E) { const m = document.createElement('div'); m.className = 'b3-mid'; m.textContent = tx(def.etxt); el.appendChild(m); el.appendChild(src ? emptyIn() : Object.assign(this.listEl(b.e), { className: 'b3-list-in b3-in' })); }
      const f = document.createElement('div'); f.className = 'b3-foot'; el.appendChild(f);
    }
    if (!src) el.addEventListener('pointerdown', (e) => this.dragStart(e, { b }));
    return el;
  }
  // the words of a block, with its choices, names and slots
  words(row, b, def, txt, src) {
    const parts = String(txt[L.lang] || txt.en).split(/(\{\w+(?::[\w.]+)?\})/);
    for (const p of parts) {
      const m = /^\{(\w+)(?::([\w.]+))?\}$/.exec(p);
      if (!m) { if (p.trim()) { const s = document.createElement('span'); s.textContent = p.trim(); row.appendChild(s); } continue; }
      const [, k, kind] = m;
      if (!kind) { const slot = document.createElement('span'); slot.className = 'b3-slot'; slot._slot = [b, k, def.d && def.d[k] ? def.d[k][0] : 'num']; if (!src) slot.dataset.slot = b.id + ':' + k; const v = b.i[k]; if (v) slot.appendChild(BK[v.t].lit ? this.litEl(b, k, v, slot._slot[2], src) : this.blockEl(v, src)); row.appendChild(slot); continue; }
      row.appendChild(this.fieldEl(b, k, kind, src));
    }
  }
  fieldEl(b, k, kind, src) {
    const set = (v) => { this.snapshot(); b.f[k] = v; this.changed(); };
    if (kind === 'NAME' || kind === 'NUM') {
      const inp = document.createElement('input'); inp.className = 'b3-lit' + (kind === 'NUM' ? ' num' : ''); inp.value = b.f[k] ?? ''; if (!src) inp.dataset.f = b.id + ':' + k; inp.size = Math.max(2, String(inp.value).length); inp.spellcheck = false; if (kind === 'NUM') inp.inputMode = 'decimal';
      if (src) inp.readOnly = true; else { inp.oninput = () => { inp.size = Math.max(2, inp.value.length); }; inp.onchange = () => { const v = inp.value.trim(); if (kind === 'NAME' && !/^[A-Za-z_]\w*$/.test(v)) { inp.value = b.f[k]; return; } set(v); }; }
      inp.addEventListener('pointerdown', (e) => e.stopPropagation()); return inp;
    }
    const sel = document.createElement('select'); sel.className = 'b3-sel' + (kind.startsWith('DEV.') ? ' b3-dev' : ''); if (!src) sel.dataset.f = b.id + ':' + k;
    let opts;
    if (kind === 'VAR') { opts = [...new Set([...this.variables(), b.f[k]])].map((n) => [n, n]); opts.push(['__new', tx(UI3.newVar)]); }
    else if (kind.startsWith('DEV.')) { const ty = kind.slice(4); const devs = this.devices(); opts = [...new Set([...Object.keys(devs).filter((n) => devs[n] === ty), b.f[k]])].map((n) => [n, n]); }
    else opts = listOf(kind);
    for (const [v, l] of opts) { const o = document.createElement('option'); o.value = v; o.textContent = typeof l === 'string' ? l : tx(l); if (v === b.f[k]) o.selected = true; sel.appendChild(o); }
    if (!opts.some(([v]) => v === b.f[k])) { const o = document.createElement('option'); o.value = b.f[k]; o.textContent = b.f[k]; o.selected = true; sel.insertBefore(o, sel.firstChild); }
    if (src) sel.disabled = true; else sel.onchange = () => { if (sel.value === '__new') { const n = prompt(tx(UI3.varName), 'value'); if (n && /^[A-Za-z_]\w*$/.test(n)) set(n); else this.render(); return; } set(sel.value); };
    sel.addEventListener('pointerdown', (e) => e.stopPropagation()); return sel;
  }
  // a literal in a slot: a number, a word, a pin, HIGH / LOW, true / false
  litEl(b, k, v, kind, src) {
    const put = (t, val) => { this.snapshot(); b.i[k] = LIT(t, val); this.changed(); };
    if (kind === 'pin' || kind === 'level' || kind === 'bool' || v.t === 'const' || v.t === 'bool') {
      const list = kind === 'pin' ? PINS : kind === 'level' ? LISTS.LEVEL : kind === 'bool' || v.t === 'bool' ? LISTS.BOOL : null;
      if (list) { const sel = document.createElement('select'); sel.className = 'b3-sel' + (kind === 'pin' ? ' b3-pin' : ''); if (!src) sel.dataset.lit = v.id; const all = list.includes(v.f.v) ? list : [v.f.v, ...list]; for (const o of all) { const op = document.createElement('option'); op.value = o; op.textContent = o; if (o === v.f.v) op.selected = true; sel.appendChild(op); } if (src) sel.disabled = true; else sel.onchange = () => put(v.t === 'num' ? 'num' : v.t, sel.value); sel.addEventListener('pointerdown', (e) => e.stopPropagation()); return sel; }
    }
    const inp = document.createElement('input'); const isNum = v.t === 'num'; inp.className = 'b3-lit ' + (isNum ? 'num' : 'txt'); if (!src) inp.dataset.lit = v.id; inp.value = v.t === 'text' ? v.f.v : v.t === 'char' ? v.f.v : v.f.v; inp.size = Math.max(isNum ? 2 : 3, String(inp.value).length + (isNum ? 0 : 1)); inp.spellcheck = false;
    if (isNum) inp.inputMode = 'decimal'; inp.title = v.t === 'text' ? 'text' : '';
    if (src) inp.readOnly = true; else { inp.oninput = () => { inp.size = Math.max(2, inp.value.length + 1); }; inp.onchange = () => { let val = inp.value; if (isNum && !/^-?(0x[0-9a-fA-F]+|\d*\.?\d+(e-?\d+)?[fFuUlL]*)$/.test(val.trim())) { if (/^[A-Za-z_]\w*$/.test(val.trim())) { this.snapshot(); b.i[k] = mk('var', { n: val.trim() }); this.changed(); return; } inp.value = v.f.v; return; } put(v.t, isNum ? val.trim() : val); }; }
    inp.addEventListener('pointerdown', (e) => e.stopPropagation()); const wrap = document.createElement('span'); wrap.style.display = 'inline-flex'; wrap.style.alignItems = 'center'; if (v.t === 'text') { wrap.append('“', inp, '”'); return wrap; } if (v.t === 'char') { wrap.append('‘', inp, '’'); return wrap; } return inp;
  }
  // ---------------------------------------------------------------- the running line, the error line
  showRun(line, force) {
    if (this.mode !== 'blocks' || (!force && line === this.runLine)) return; this.runLine = line;
    for (const x of this.ws.querySelectorAll('.b3-b.run')) x.classList.remove('run'); if (!line) return;
    const id = this.lineMap.get(line); if (!id) return; const el = this.ws.querySelector(`[data-id="${id}"]`); if (el) el.classList.add('run');
  }
  showError(line) { for (const x of this.ws.querySelectorAll('.b3-b.err')) x.classList.remove('err'); if (!line || this.mode !== 'blocks') return; const id = this.lineMap.get(line); const el = id && this.ws.querySelector(`[data-id="${id}"]`); if (el) { el.classList.add('err'); el.scrollIntoView({ block: 'nearest' }); } }
  // ---------------------------------------------------------------- drag and drop
  dragStart(e, what) {
    if (e.button && e.button !== 0) return; if (/^(INPUT|SELECT|TEXTAREA|OPTION)$/.test(e.target.tagName)) return;
    e.stopPropagation(); e.preventDefault(); this.app.sound && this.app.sound.unlock();
    const b = what.b || (() => { const n = JSON.parse(JSON.stringify(what.proto)); renew(n); return n; })(); const def = BK[b.t];
    const el = e.currentTarget; const r = el.getBoundingClientRect(); const z = what.b ? this.zoom : 1;
    this.drag = { b, fromPal: !what.b, def, x0: e.clientX, y0: e.clientY, dx: e.clientX - r.left, dy: e.clientY - r.top, moved: false, z, src: what.b ? this.findOwner(b) : null, pointer: e.pointerId };
    addEventListener('pointermove', this.onMove); addEventListener('pointerup', this.onUp); addEventListener('pointercancel', this.onUp);
  }
  dragMove(e) {
    const D = this.drag; if (!D) return; if (!D.moved) { if (Math.hypot(e.clientX - D.x0, e.clientY - D.y0) < (e.pointerType === 'mouse' ? 4 : 8)) return; D.moved = true; this.lift(); }
    e.preventDefault(); D.ghost.style.transform = `translate(${e.clientX - D.dx}px,${e.clientY - D.dy}px) scale(${D.z})`;
    for (const x of this.ws.querySelectorAll('.hot')) x.classList.remove('hot');
    const t = this.target(e.clientX - D.dx * D.z + 10, e.clientY - D.dy * D.z + 10, e.clientX, e.clientY); if (t) t.classList.add('hot'); D.t = t;
    const pr = this.pal.getBoundingClientRect(); this.pal.classList.toggle('trash', !D.fromPal && e.clientX < pr.right && e.clientX > pr.left);
    const wr = this.ws.getBoundingClientRect(); if (e.clientY > wr.bottom - 40) this.ws.scrollTop += 12; else if (e.clientY < wr.top + 40) this.ws.scrollTop -= 12;
  }
  // take the block out of the program (it is in the hand now), and draw it under the pointer
  lift() {
    const D = this.drag; if (D.src) { this.snapshot(); const [list, i, slotOf] = D.src; if (list) list.splice(i, 1); else if (slotOf) { const [blk, key, kind] = slotOf; const d = BK[blk.t].d && BK[blk.t].d[key]; blk.i[key] = d ? LIT(d[0], d[1]) : undefined; void kind; } this.render(); }
    const g = this.blockEl(D.b, true); g.classList.add('b3-ghost'); g.style.transform = `translate(${D.x0 - D.dx}px,${D.y0 - D.dy}px) scale(${D.z})`; let box = document.getElementById('b3g'); if (!box) { box = document.createElement('div'); box.id = 'b3g'; document.body.appendChild(box); } box.appendChild(g); D.ghost = g;
  }
  target(x, y, px, py) {
    const D = this.drag; let best = null, bd = 1e9;
    if (D.def.k === 'v') { // a value: the innermost slot under the pointer (t * 1.8 inside + 32), else the nearest slot to the block's left edge
      let inside = null, ia = Infinity;
      for (const s of this.ws.querySelectorAll('.b3-slot')) { if (contains(D.b, s._slot[0])) continue; const r = s.getBoundingClientRect(); const d = Math.hypot(r.left - x + 10, (r.top + r.bottom) / 2 - y); if (d < bd && d < 46 * this.zoom) { bd = d; best = s; } if (px >= r.left - 4 && px <= r.right + 4 && py >= r.top - 4 && py <= r.bottom + 4 && r.width * r.height < ia) { ia = r.width * r.height; inside = s; } }
      return inside || best; }
    for (const g of this.ws.querySelectorAll('.b3-gap')) { if (insideOf(D.b, g._at[0])) continue; const r = g.getBoundingClientRect(); if (px < r.left - 40 || px > r.left + 520) continue; const d = Math.abs((r.top + r.bottom) / 2 - y) + Math.abs(r.left - x) * 0.25; if (d < bd && d < 60 * this.zoom) { bd = d; best = g; } }
    return best;
  }
  dragEnd(e) {
    const D = this.drag; this.drag = null; removeEventListener('pointermove', this.onMove); removeEventListener('pointerup', this.onUp); removeEventListener('pointercancel', this.onUp);
    if (!D) return; this.pal.classList.remove('trash'); for (const x of this.ws.querySelectorAll('.hot')) x.classList.remove('hot'); if (D.ghost) D.ghost.remove();
    if (!D.moved) { if (D.fromPal) this.tapAdd(D.b); return; } // a tap on a palette block adds it at the end of loop (or of the globals for a device)
    const pr = this.pal.getBoundingClientRect(); const overPal = e.clientX < pr.right && e.clientX > pr.left && e.clientY > pr.top && e.clientY < pr.bottom;
    const t = D.t && !overPal ? D.t : null;
    if (!t) { if (D.fromPal) return; this.changed(); this.app.sound && this.app.sound.click && this.app.sound.click(); return; } // dropped on the palette (or nowhere): deleted
    if (D.fromPal) this.snapshot();
    if (t._slot) { const [blk, key] = t._slot; const old = blk.i[key]; blk.i[key] = D.b; if (old && !BK[old.t].lit) this.parkValue(old); }
    else { const [list, i] = t._at; list.splice(i, 0, D.b); }
    this.changed(); if (this.app.sound && this.app.sound.click) this.app.sound.click();
  }
  // a value pushed out of its slot: it waits as a grey block at the end of loop (so nothing is lost)
  parkValue(v) { const loop = this.prog.stacks.find((s) => s.hat === 'loop'); loop.body.push({ id: nid(), t: 'raw', f: { code: '// ' + BK[v.t].g(v, G) }, i: {} }); }
  tapAdd(b) {
    this.snapshot(); const def = BK[b.t]; if (def.k === 'v') return;
    const st = this.prog.stacks.find((s) => s.hat === (def.dev || b.t === 'decl' ? 'globals' : /_(init|begin|attach)$|^(pinmode|ser_begin|spi_begin|ir_begin|dht_begin|lcd_bl)$/.test(b.t) ? 'setup' : 'loop')); st.body.push(b); this.changed();
    requestAnimationFrame(() => { const el = this.ws.querySelector(`[data-id="${b.id}"]`); if (el) { el.scrollIntoView({ block: 'nearest' }); el.classList.add('run'); setTimeout(() => el.classList.remove('run'), 600); } });
  }
  findOwner(b) { // [list, index] or [null, null, [block, slot]]
    let found = null; const walk = (list) => { for (let i = 0; i < (list || []).length && !found; i++) { const x = list[i]; if (x === b) { found = [list, i]; return; } scan(x); } };
    const scan = (x) => { for (const k in x.i) { if (x.i[k] === b) { found = [null, null, [x, k]]; return; } if (x.i[k]) scan(x.i[k]); } walk(x.s); walk(x.e); };
    for (const s of this.prog.stacks) { walk(s.body); if (found) break; } return found;
  }
}
const T3W = { blocks: t3('Blocks', 'ब्लॉक', 'Blocks') };
function emptyIn() { const d = document.createElement('div'); d.className = 'b3-in'; return d; }
function renew(b) { b.id = nid(); for (const k in b.i) if (b.i[k]) renew(b.i[k]); for (const x of b.s || []) renew(x); for (const x of b.e || []) renew(x); }
function contains(b, x) { if (b === x) return true; for (const k in b.i) if (b.i[k] && contains(b.i[k], x)) return true; for (const y of b.s || []) if (contains(y, x)) return true; for (const y of b.e || []) if (contains(y, x)) return true; return false; }
function insideOf(b, list) { return (b.s && (b.s === list || b.s.some((x) => insideOf(x, list)))) || (b.e && (b.e === list || b.e.some((x) => insideOf(x, list)))) || false; }
function slots(def) { const out = []; const re = /\{(\w+)(?::([\w.]+))?\}/g; let m; const s = def.txt ? def.txt.en : ''; while ((m = re.exec(s))) out.push([m[0], m[1], m[2]]); return out; }

