// DUET Robotics Lab 360, batch 5: blocks for the micro:bit (our own design), in the code panel next to Python.
// A block program is a list of statements; a C-shaped block (forever, if, repeat) holds its own list; a round block is a
// value that goes into a slot. Blocks make Python (the editor shows it, Run runs it); Python that the blocks know is turned
// back into blocks (py.js parses it), and any other line becomes a grey "Python" block, so nothing is ever lost.
// Drag a block from the palette into the program, drag it back to the palette to delete it; tap a number or a word to
// change it. Works with a mouse, a finger and a panel's touch screen. Words in English, Hindi and Hinglish.
import { parse } from './py.js';
import { tx, L } from './i18n.js';

const t3 = (en, hi, hg) => ({ en, hi, hg });
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const CAT = {
  basic: [t3('Basic', 'बुनियादी', 'Basic'), '#2f7fe0'], input: [t3('Input', 'इनपुट', 'Input'), '#b03dc8'], music: [t3('Music', 'संगीत', 'Music'), '#e0573c'],
  radio: [t3('Radio', 'रेडियो', 'Radio'), '#c9407a'], pins: [t3('Pins', 'पिन', 'Pins'), '#a8483e'], loops: [t3('Loops', 'लूप', 'Loops'), '#2e9e48'],
  logic: [t3('Logic', 'लॉजिक', 'Logic'), '#178f8f'], vars: [t3('Variables', 'वेरिएबल', 'Variables'), '#d97c22'], maths: [t3('Maths', 'गणित', 'Maths'), '#7055cf'], py: [t3('Python', 'Python', 'Python'), '#5f6875'],
};
const ICONS = ['HEART', 'HEART_SMALL', 'HAPPY', 'SAD', 'SMILE', 'CONFUSED', 'ANGRY', 'ASLEEP', 'SURPRISED', 'SILLY', 'YES', 'NO', 'DIAMOND', 'SQUARE', 'SQUARE_SMALL', 'TRIANGLE', 'CHESSBOARD', 'TARGET', 'SCISSORS', 'GHOST', 'SKULL', 'DUCK', 'HOUSE', 'RABBIT', 'COW', 'TORTOISE', 'BUTTERFLY', 'GIRAFFE', 'SNAKE', 'UMBRELLA', 'PACMAN', 'TSHIRT', 'ARROW_N', 'ARROW_E', 'ARROW_S', 'ARROW_W', 'MUSIC_QUAVER'];
const TUNES = ['BA_DING', 'POWER_UP', 'POWER_DOWN', 'JUMP_UP', 'JUMP_DOWN', 'BIRTHDAY', 'ODE', 'ENTERTAINER', 'DADADADUM', 'PRELUDE', 'WEDDING', 'RINGTONE', 'CHASE', 'WAWAWAWAA'];
const GEST = ['shake', 'face up', 'face down', 'up', 'down', 'left', 'right', 'freefall'];
const PINS = ['0', '1', '2'];
// the blocks: k 's' (a statement) or 'r' (a value); c its colour group; txt its words with {slots} ({name} a value slot,
// {name:list} a choice, {name:var} a variable); C: it holds a list of statements (else: a second list); py: its Python
const BL = {
  forever: { k: 's', c: 'basic', C: true, txt: t3('forever', 'हमेशा', 'hamesha'), py: (b, g) => `while True:\n${g.body(b.s)}` },
  show_icon: { k: 's', c: 'basic', txt: t3('show icon {icon:ICONS}', 'आइकन दिखाइए {icon:ICONS}', 'icon dikhaiye {icon:ICONS}'), d: { icon: 'HEART' }, py: (b) => `display.show(Image.${b.f.icon})` },
  show: { k: 's', c: 'basic', txt: t3('show {x}', 'दिखाइए {x}', 'dikhaiye {x}'), d: { x: ['num', 0] }, py: (b, g) => `display.show(${g.v(b, 'x')})` },
  scroll: { k: 's', c: 'basic', txt: t3('scroll {x}', 'स्क्रॉल कीजिए {x}', 'scroll karo {x}'), d: { x: ['text', 'Hello'] }, py: (b, g) => `display.scroll(${g.v(b, 'x')})` },
  clear: { k: 's', c: 'basic', txt: t3('clear screen', 'स्क्रीन साफ़ कीजिए', 'screen saaf karo'), py: () => 'display.clear()' },
  pause: { k: 's', c: 'basic', txt: t3('pause {ms} ms', '{ms} ms रुकिए', '{ms} ms ruko'), d: { ms: ['num', 100] }, py: (b, g) => `sleep(${g.v(b, 'ms')})` },
  plot: { k: 's', c: 'basic', txt: t3('light x {x} y {y} brightness {v}', 'जलाइए x {x} y {y} चमक {v}', 'jalaiye x {x} y {y} brightness {v}'), d: { x: ['num', 2], y: ['num', 2], v: ['num', 9] }, py: (b, g) => `display.set_pixel(${g.v(b, 'x')}, ${g.v(b, 'y')}, ${g.v(b, 'v')})` },
  print: { k: 's', c: 'basic', txt: t3('print {x}', 'प्रिंट {x}', 'print {x}'), d: { x: ['text', 'Hi'] }, py: (b, g) => `print(${g.v(b, 'x')})` },
  pressed: { k: 'r', c: 'input', txt: t3('button {btn:AB} pressed', 'बटन {btn:AB} दबा है', 'button {btn:AB} daba hai'), d: { btn: 'a' }, py: (b) => (b.f.btn === 'a+b' ? '(button_a.is_pressed() and button_b.is_pressed())' : `button_${b.f.btn}.is_pressed()`) },
  was_pressed: { k: 'r', c: 'input', txt: t3('button {btn:AB1} was pressed', 'बटन {btn:AB1} दबाया गया', 'button {btn:AB1} dabaya gaya'), d: { btn: 'a' }, py: (b) => `button_${b.f.btn}.was_pressed()` },
  logo: { k: 'r', c: 'input', txt: t3('logo touched', 'लोगो छुआ गया', 'logo touch hua'), py: () => 'pin_logo.is_touched()' },
  gesture: { k: 'r', c: 'input', txt: t3('gesture {g:GEST} happened', 'हरकत {g:GEST} हुई', 'gesture {g:GEST} hua'), d: { g: 'shake' }, py: (b) => `accelerometer.was_gesture('${b.f.g}')` },
  accel: { k: 'r', c: 'input', txt: t3('acceleration {ax:XYZ} (mg)', 'एक्सेलेरेशन {ax:XYZ} (mg)', 'acceleration {ax:XYZ} (mg)'), d: { ax: 'x' }, py: (b) => `accelerometer.get_${b.f.ax}()` },
  temp: { k: 'r', c: 'input', txt: t3('temperature (°C)', 'तापमान (°C)', 'temperature (°C)'), py: () => 'temperature()' },
  light: { k: 'r', c: 'input', txt: t3('light level', 'रोशनी का स्तर', 'roshni ka level'), py: () => 'display.read_light_level()' },
  heading: { k: 'r', c: 'input', txt: t3('compass heading (°)', 'कंपास दिशा (°)', 'compass disha (°)'), py: () => 'compass.heading()' },
  sound: { k: 'r', c: 'input', txt: t3('sound level', 'आवाज़ का स्तर', 'awaaz ka level'), py: () => 'microphone.sound_level()' },
  time: { k: 'r', c: 'input', txt: t3('running time (ms)', 'चलने का समय (ms)', 'chalne ka time (ms)'), py: () => 'running_time()' },
  melody: { k: 's', c: 'music', txt: t3('play melody {m:TUNES}', 'धुन बजाइए {m:TUNES}', 'dhun bajaiye {m:TUNES}'), d: { m: 'BA_DING' }, imp: 'music', py: (b) => `music.play(music.${b.f.m})` },
  tone: { k: 's', c: 'music', txt: t3('play tone {f} Hz for {ms} ms', '{f} Hz का सुर {ms} ms बजाइए', '{f} Hz ka sur {ms} ms bajaiye'), d: { f: ['num', 440], ms: ['num', 500] }, imp: 'music', py: (b, g) => `music.pitch(${g.v(b, 'f')}, ${g.v(b, 'ms')})` },
  radio_on: { k: 's', c: 'radio', txt: t3('radio on, group {n}', 'रेडियो चालू, group {n}', 'radio on, group {n}'), d: { n: ['num', 1] }, imp: 'radio', py: (b, g) => `radio.on()\nradio.config(group=${g.v(b, 'n')})` },
  radio_send: { k: 's', c: 'radio', txt: t3('radio send {x}', 'रेडियो से भेजिए {x}', 'radio se bhejiye {x}'), d: { x: ['text', 'hi'] }, imp: 'radio', py: (b, g) => `radio.send(${g.v(b, 'x')})` },
  radio_get: { k: 'r', c: 'radio', txt: t3('radio received message', 'रेडियो से मिला संदेश', 'radio se mila message'), imp: 'radio', py: () => 'radio.receive()' },
  dwrite: { k: 's', c: 'pins', txt: t3('digital write pin {p:PINS} to {v}', 'डिजिटल लिखिए पिन {p:PINS} पर {v}', 'digital write pin {p:PINS} par {v}'), d: { p: '0', v: ['num', 1] }, py: (b, g) => `pin${b.f.p}.write_digital(${g.v(b, 'v')})` },
  awrite: { k: 's', c: 'pins', txt: t3('analog write pin {p:PINS} to {v}', 'एनालॉग लिखिए पिन {p:PINS} पर {v}', 'analog write pin {p:PINS} par {v}'), d: { p: '0', v: ['num', 512] }, py: (b, g) => `pin${b.f.p}.write_analog(${g.v(b, 'v')})` },
  servo: { k: 's', c: 'pins', txt: t3('servo on pin {p:PINS} to {a}°', 'पिन {p:PINS} का सर्वो {a}° पर', 'pin {p:PINS} ka servo {a}° par'), d: { p: '0', a: ['num', 90] }, py: (b, g) => `pin${b.f.p}.write_analog(int(26 + ${g.v(b, 'a', 1)} * 102 / 180))` },
  aread: { k: 'r', c: 'pins', txt: t3('analog read pin {p:PINS}', 'एनालॉग पढ़िए पिन {p:PINS}', 'analog read pin {p:PINS}'), d: { p: '0' }, py: (b) => `pin${b.f.p}.read_analog()` },
  dread: { k: 'r', c: 'pins', txt: t3('digital read pin {p:PINS}', 'डिजिटल पढ़िए पिन {p:PINS}', 'digital read pin {p:PINS}'), d: { p: '0' }, py: (b) => `pin${b.f.p}.read_digital()` },
  repeat: { k: 's', c: 'loops', C: true, txt: t3('repeat {n} times', '{n} बार दोहराइए', '{n} baar dohraiye'), d: { n: ['num', 4] }, py: (b, g) => `for i in range(${g.v(b, 'n')}):\n${g.body(b.s)}` },
  while: { k: 's', c: 'loops', C: true, txt: t3('while {c}', 'जब तक {c}', 'jab tak {c}'), d: { c: ['bool', true] }, py: (b, g) => `while ${g.v(b, 'c')}:\n${g.body(b.s)}` },
  if: { k: 's', c: 'logic', C: true, txt: t3('if {c} then', 'अगर {c} तो', 'agar {c} to'), d: { c: ['bool', true] }, py: (b, g) => `if ${g.v(b, 'c')}:\n${g.body(b.s)}` },
  ifelse: { k: 's', c: 'logic', C: true, E: true, txt: t3('if {c} then', 'अगर {c} तो', 'agar {c} to'), etxt: t3('else', 'वरना', 'warna'), d: { c: ['bool', true] }, py: (b, g) => `if ${g.v(b, 'c')}:\n${g.body(b.s)}\nelse:\n${g.body(b.e)}` },
  cmp: { k: 'r', c: 'logic', txt: t3('{a} {op:CMP} {b}', '{a} {op:CMP} {b}', '{a} {op:CMP} {b}'), d: { a: ['num', 0], op: '<', b: ['num', 0] }, py: (b, g) => `${g.v(b, 'a', 2)} ${b.f.op} ${g.v(b, 'b', 2)}` },
  and: { k: 'r', c: 'logic', txt: t3('{a} {op:ANDOR} {b}', '{a} {op:ANDOR} {b}', '{a} {op:ANDOR} {b}'), d: { a: ['bool', true], op: 'and', b: ['bool', true] }, py: (b, g) => `${g.v(b, 'a', 1)} ${b.f.op} ${g.v(b, 'b', 1)}` },
  not: { k: 'r', c: 'logic', txt: t3('not {a}', 'नहीं {a}', 'not {a}'), d: { a: ['bool', true] }, py: (b, g) => `not ${g.v(b, 'a', 3)}` },
  bool: { k: 'r', c: 'logic', txt: t3('{v:TF}', '{v:TF}', '{v:TF}'), d: { v: 'True' }, py: (b) => b.f.v },
  set: { k: 's', c: 'vars', txt: t3('set {name:var} to {v}', '{name:var} को {v} कीजिए', '{name:var} ko {v} karo'), d: { name: 'count', v: ['num', 0] }, py: (b, g) => `${b.f.name} = ${g.v(b, 'v')}` },
  change: { k: 's', c: 'vars', txt: t3('change {name:var} by {v}', '{name:var} को {v} से बदलिए', '{name:var} ko {v} se badliye'), d: { name: 'count', v: ['num', 1] }, py: (b, g) => `${b.f.name} += ${g.v(b, 'v')}` },
  var: { k: 'r', c: 'vars', txt: t3('{name:var}', '{name:var}', '{name:var}'), d: { name: 'count' }, py: (b) => b.f.name },
  num: { k: 'r', c: 'maths', lit: 'num', py: (b) => String(b.f.v) },
  text: { k: 'r', c: 'maths', lit: 'text', py: (b) => pyStr(b.f.v) },
  arith: { k: 'r', c: 'maths', txt: t3('{a} {op:OPS} {b}', '{a} {op:OPS} {b}', '{a} {op:OPS} {b}'), d: { a: ['num', 0], op: '+', b: ['num', 1] }, py: (b, g) => `${g.v(b, 'a', 4)} ${b.f.op} ${g.v(b, 'b', 5)}` },
  random: { k: 'r', c: 'maths', txt: t3('random {a} to {b}', '{a} से {b} तक कोई भी', '{a} se {b} tak koi bhi'), d: { a: ['num', 1], b: ['num', 6] }, imp: 'random', py: (b, g) => `random.randint(${g.v(b, 'a')}, ${g.v(b, 'b')})` },
  pyline: { k: 's', c: 'py', raw: true, py: (b) => b.f.code },
  pyexpr: { k: 'r', c: 'py', raw: true, py: (b) => b.f.code },
};
const LISTS = { ICONS, TUNES, GEST, PINS, AB: ['a', 'b', 'a+b'], AB1: ['a', 'b'], XYZ: ['x', 'y', 'z'], CMP: ['==', '!=', '<', '<=', '>', '>='], ANDOR: ['and', 'or'], TF: ['True', 'False'], OPS: ['+', '-', '*', '/', '//', '%'] };
const PALETTE = {
  basic: ['forever', 'show_icon', 'show', 'scroll', 'pause', 'clear', 'plot', 'print'],
  input: ['was_pressed', 'pressed', 'logo', 'gesture', 'accel', 'temp', 'light', 'heading', 'sound', 'time'],
  music: ['melody', 'tone'], radio: ['radio_on', 'radio_send', 'radio_get'], pins: ['dwrite', 'awrite', 'servo', 'aread', 'dread'],
  loops: ['repeat', 'while', 'forever'], logic: ['if', 'ifelse', 'cmp', 'and', 'not', 'bool'], vars: ['set', 'change', 'var'], maths: ['num', 'text', 'arith', 'random'],
};
// a raw expression that needs no brackets round it (a name, a call, a number: no operator outside brackets or quotes)
function simple(s) { let d = 0, q = null; for (const c of s) { if (q) { if (c === q) q = null; continue; } if (c === '"' || c === "'") q = c; else if ('([{'.includes(c)) d++; else if (')]}'.includes(c)) d--; else if (!d && /[\s+\-*/%<>=!&|^~]/.test(c)) return false; } return true; }
function pyStr(s) { s = String(s); return s.includes("'") && !s.includes('"') ? `"${s}"` : `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`; }

// ------------------------------------------------------------------ blocks -> Python
let ID = 0;
export function mk(t, f, i) { const def = BL[t]; const b = { id: 'b' + (++ID), t, f: {}, i: {}, s: def.C ? [] : undefined, e: def.E ? [] : undefined };
  for (const [k, v] of Object.entries(def.d || {})) { if (Array.isArray(v)) b.i[k] = v[0] === 'num' ? mk('num', { v: v[1] }) : v[0] === 'text' ? mk('text', { v: v[1] }) : mk('bool', { v: v[1] ? 'True' : 'False' }); else b.f[k] = v; }
  if (def.lit === 'num') b.f.v = 0; if (def.lit === 'text') b.f.v = '';
  Object.assign(b.f, f || {}); Object.assign(b.i, i || {}); return b; }
const PREC = { pyexpr: 0, and: 1, not: 2, cmp: 3, arith: 4 };
export function toPython(prog) {
  const imps = new Set(); const walk = (list) => { for (const b of list) { const d = BL[b.t]; if (d.imp) imps.add(d.imp); if (d.raw) for (const m of String(b.f.code).matchAll(/\b(music|radio|random)\./g)) imps.add(m[1]); for (const v of Object.values(b.i || {})) walk([v]); if (b.s) walk(b.s); if (b.e) walk(b.e); } };
  walk(prog);
  const g = {
    v(b, k, minPrec = 0) { const x = b.i[k]; if (!x) return 'None'; const s = BL[x.t].py(x, g); const p = x.t === 'pyexpr' ? (simple(s) ? 99 : 0) : PREC[x.t]; return p !== undefined && p < minPrec ? `(${s})` : s; },
    body(list) { const s = (list.length ? list.map((x) => BL[x.t].py(x, g)).join('\n') : 'pass'); return s.split('\n').map((l) => '    ' + l).join('\n'); },
  };
  const head = ['from microbit import *', ...['music', 'radio', 'random'].filter((m) => imps.has(m)).map((m) => 'import ' + m)];
  const raw = prog.filter((b) => b.t === 'pyline' && /^\s*(from|import)\s/.test(b.f.code));
  const body = prog.filter((b) => !raw.includes(b)).map((b) => BL[b.t].py(b, g));
  const extra = raw.map((b) => b.f.code).filter((l) => !head.includes(l.trim()));
  return [...head, ...extra, '', ...body].join('\n') + '\n';
}

// ------------------------------------------------------------------ Python -> blocks (what the blocks know; the rest: grey Python blocks)
const OPP = { add: '+', sub: '-', mul: '*', div: '/', fdiv: '//', mod: '%', pow: '**', band: '&', bor: '|', bxor: '^', shl: '<<', shr: '>>' };
const CMPP = { lt: '<', gt: '>', le: '<=', ge: '>=', eq: '==', ne: '!=', in: 'in', notin: 'not in', is: 'is', isnot: 'is not' };
const PR = { ifx: 1, lambda: 0, bool_or: 2, bool_and: 3, not: 4, cmp: 5, bor: 6, bxor: 7, band: 8, shl: 9, shr: 9, add: 10, sub: 10, mul: 11, div: 11, fdiv: 11, mod: 11, un: 12, pow: 13 };
// an expression tree back to Python text (for grey blocks)
export function exprPy(e, outer = 0) {
  const wrap = (s, p) => (p < outer ? `(${s})` : s);
  switch (e.k) {
    case 'num': return e.f && Number.isInteger(e.v) ? e.v + '.0' : String(e.v);
    case 'str': return pyStr(e.v);
    case 'fstr': return 'f' + pyStr(e.parts.map((p) => (typeof p === 'string' ? p.replace(/[{}]/g, (c) => c + c) : `{${exprPy(p.e)}${p.conv ? '!' + p.conv : ''}${p.spec ? ':' + p.spec : ''}}`)).join(''));
    case 'const': return e.v === null ? 'None' : e.v ? 'True' : 'False';
    case 'name': return e.id;
    case 'bin': { const p = PR[e.op] || 10; return wrap(`${exprPy(e.a, p)} ${OPP[e.op] || '@'} ${exprPy(e.b, p + (e.op === 'pow' ? 0 : 1))}`, p); }
    case 'un': return wrap((e.op === 'neg' ? '-' : e.op === 'pos' ? '+' : '~') + exprPy(e.a, PR.un), PR.un);
    case 'not': return wrap('not ' + exprPy(e.a, PR.not), PR.not);
    case 'bool': { const p = PR['bool_' + e.op]; return wrap(e.vals.map((v) => exprPy(v, p + 1)).join(` ${e.op} `), p); }
    case 'cmp': { let s = exprPy(e.vals[0], PR.cmp + 1); e.ops.forEach((o, i) => { s += ` ${CMPP[o]} ${exprPy(e.vals[i + 1], PR.cmp + 1)}`; }); return wrap(s, PR.cmp); }
    case 'ifx': return wrap(`${exprPy(e.a, 2)} if ${exprPy(e.c, 2)} else ${exprPy(e.b, 1)}`, PR.ifx);
    case 'call': return `${exprPy(e.f, 14)}(${[...e.args.map((a) => exprPy(a)), ...e.kw.map(([k, v]) => `${k}=${exprPy(v)}`)].join(', ')})`;
    case 'attr': return `${exprPy(e.o, 14)}.${e.name}`;
    case 'sub': return `${exprPy(e.o, 14)}[${exprPy(e.ix)}]`;
    case 'slice': return `${e.lo ? exprPy(e.lo) : ''}:${e.hi ? exprPy(e.hi) : ''}${e.st ? ':' + exprPy(e.st) : ''}`;
    case 'list': return `[${e.items.map((x) => exprPy(x)).join(', ')}]`;
    case 'tuple': return `(${e.items.map((x) => exprPy(x)).join(', ')}${e.items.length === 1 ? ',' : ''})`;
    case 'dict': return `{${e.keys.map((k, i) => `${exprPy(k)}: ${exprPy(e.vals[i])}`).join(', ')}}`;
    case 'lambda': return wrap(`lambda ${e.params.map((p) => p.name).join(', ')}: ${exprPy(e.body)}`, 0);
    case 'comp': return `[${exprPy(e.elt)} ${e.gens.map((g) => `for ${exprPy(g.target)} in ${exprPy(g.iter, 2)}${g.ifs.map((c) => ' if ' + exprPy(c, 2)).join('')}`).join(' ')}]`;
  }
  return '?';
}
const isAttr = (e, o, n) => e && e.k === 'attr' && e.name === n && e.o.k === 'name' && (o === null || e.o.id === o);
const call = (e, o, n, argc) => e && e.k === 'call' && (o === null && e.f.k === 'name' ? e.f.id === n : isAttr(e.f, o, n)) && (argc === undefined || e.args.length === argc) && !e.kw.length;
const pinOf = (e) => (e && e.k === 'call' && e.f.k === 'attr' && e.f.o.k === 'name' && /^pin[012]$/.test(e.f.o.id) ? e.f.o.id.slice(3) : null);
export function exprBlock(e) {
  if (e.k === 'num' && !e.f && e.v >= 0) return mk('num', { v: e.v });
  if (e.k === 'num') return mk('num', { v: e.v });
  if (e.k === 'str') return mk('text', { v: e.v });
  if (e.k === 'const' && e.v !== null) return mk('bool', { v: e.v ? 'True' : 'False' });
  if (e.k === 'name' && !/^(True|False|None)$/.test(e.id)) return mk('var', { name: e.id });
  if (e.k === 'bin' && ['add', 'sub', 'mul', 'div', 'fdiv', 'mod'].includes(e.op)) return mk('arith', { op: OPP[e.op] }, { a: exprBlock(e.a), b: exprBlock(e.b) });
  if (e.k === 'cmp' && e.ops.length === 1 && ['lt', 'gt', 'le', 'ge', 'eq', 'ne'].includes(e.ops[0])) return mk('cmp', { op: CMPP[e.ops[0]] }, { a: exprBlock(e.vals[0]), b: exprBlock(e.vals[1]) });
  if (e.k === 'bool' && e.vals.length === 2) return mk('and', { op: e.op }, { a: exprBlock(e.vals[0]), b: exprBlock(e.vals[1]) });
  if (e.k === 'not') return mk('not', {}, { a: exprBlock(e.a) });
  for (const k of ['a', 'b']) { if (call(e, 'button_' + k, 'is_pressed', 0)) return mk('pressed', { btn: k }); if (call(e, 'button_' + k, 'was_pressed', 0)) return mk('was_pressed', { btn: k }); }
  if (call(e, 'pin_logo', 'is_touched', 0)) return mk('logo');
  if (call(e, 'accelerometer', 'was_gesture', 1) && e.args[0].k === 'str' && GEST.includes(e.args[0].v)) return mk('gesture', { g: e.args[0].v });
  for (const ax of ['x', 'y', 'z']) if (call(e, 'accelerometer', 'get_' + ax, 0)) return mk('accel', { ax });
  if (call(e, null, 'temperature', 0)) return mk('temp'); if (call(e, 'display', 'read_light_level', 0)) return mk('light'); if (call(e, 'compass', 'heading', 0)) return mk('heading');
  if (call(e, 'microphone', 'sound_level', 0)) return mk('sound'); if (call(e, null, 'running_time', 0)) return mk('time'); if (call(e, 'radio', 'receive', 0)) return mk('radio_get');
  if (call(e, 'random', 'randint', 2)) return mk('random', {}, { a: exprBlock(e.args[0]), b: exprBlock(e.args[1]) });
  const p = pinOf(e); if (p && e.f.name === 'read_analog' && !e.args.length) return mk('aread', { p }); if (p && e.f.name === 'read_digital' && !e.args.length) return mk('dread', { p });
  return mk('pyexpr', { code: exprPy(e) });
}
export function fromPython(src) {
  const tree = parse(src); const lines = String(src).replace(/\r\n?/g, '\n').split('\n');
  const ind = (l) => l.match(/^\s*/)[0].length;
  const rawOf = (s) => { // the source lines of a statement: its line and everything pushed in under it (and its else / elif / except)
    const a = s.line - 1; const i0 = ind(lines[a] || ''); let b = a + 1;
    while (b < lines.length) { const l = lines[b], tr = l.trim(); if (tr && !tr.startsWith('#') && ind(l) <= i0 && !(ind(l) === i0 && /^(else|elif|except|finally)\b/.test(tr))) break; b++; }
    while (b > a + 1 && !lines[b - 1].trim()) b--;
    return lines.slice(a, b).map((l) => l.slice(Math.min(i0, ind(l)))).join('\n');
  };
  const list = (body) => { const out = []; for (let i = 0; i < body.length; i++) { const b = stmt(body[i], body[i + 1]); if (!b) continue; if (b._eat) { delete b._eat; i++; } out.push(b); } return out; };
  const stmt = (s, next) => {
    const e = s.e;
    if (s.k === 'from' && s.mod === 'microbit' && s.star) return null;
    if (s.k === 'import' && s.names.every(([m, as]) => ['music', 'radio', 'random'].includes(m) && !as)) return null;
    if (s.k === 'while' && !s.orelse && s.c.k === 'const' && s.c.v === true) return Object.assign(mk('forever'), { s: list(s.body) });
    if (s.k === 'while' && !s.orelse) return Object.assign(mk('while', {}, { c: exprBlock(s.c) }), { s: list(s.body) });
    if (s.k === 'for' && !s.orelse && s.target.k === 'name' && s.target.id === 'i' && call(s.iter, null, 'range', 1)) return Object.assign(mk('repeat', {}, { n: exprBlock(s.iter.args[0]) }), { s: list(s.body) });
    if (s.k === 'if') {
      const build = (k) => { const [c, b] = s.tests[k]; const last = k === s.tests.length - 1; const els = last ? s.orelse : [{ k: 'if', tests: s.tests.slice(k + 1), orelse: s.orelse, line: s.tests[k + 1][0].line }];
        if (!els) return Object.assign(mk('if', {}, { c: exprBlock(c) }), { s: list(b) });
        return Object.assign(mk('ifelse', {}, { c: exprBlock(c) }), { s: list(b), e: last ? list(els) : [build(k + 1)] }); };
      if (s.tests.slice(1).every(([c]) => c.line)) return build(0);
    }
    if (s.k === 'assign' && s.targets.length === 1 && s.targets[0].k === 'name') return mk('set', { name: s.targets[0].id }, { v: exprBlock(s.value) });
    if (s.k === 'aug' && s.op === 'add' && s.target.k === 'name') return mk('change', { name: s.target.id }, { v: exprBlock(s.value) });
    if (s.k === 'expr' && e.k === 'call') {
      if (call(e, 'display', 'show', 1) && isAttr(e.args[0], 'Image', e.args[0].name) && ICONS.includes(e.args[0].name)) return mk('show_icon', { icon: e.args[0].name });
      if (call(e, 'display', 'show', 1)) return mk('show', {}, { x: exprBlock(e.args[0]) });
      if (call(e, 'display', 'scroll', 1)) return mk('scroll', {}, { x: exprBlock(e.args[0]) });
      if (call(e, 'display', 'clear', 0)) return mk('clear');
      if (call(e, null, 'sleep', 1)) return mk('pause', {}, { ms: exprBlock(e.args[0]) });
      if (call(e, 'display', 'set_pixel', 3)) return mk('plot', {}, { x: exprBlock(e.args[0]), y: exprBlock(e.args[1]), v: exprBlock(e.args[2]) });
      if (call(e, null, 'print', 1)) return mk('print', {}, { x: exprBlock(e.args[0]) });
      if (call(e, 'music', 'play', 1) && isAttr(e.args[0], 'music', e.args[0].name) && TUNES.includes(e.args[0].name)) return mk('melody', { m: e.args[0].name });
      if (call(e, 'music', 'pitch', 2)) return mk('tone', {}, { f: exprBlock(e.args[0]), ms: exprBlock(e.args[1]) });
      if (call(e, 'radio', 'send', 1)) return mk('radio_send', {}, { x: exprBlock(e.args[0]) });
      const p = pinOf(e);
      if (p && e.f.name === 'write_digital' && e.args.length === 1) return mk('dwrite', { p }, { v: exprBlock(e.args[0]) });
      if (p && e.f.name === 'write_analog' && e.args.length === 1) {
        const a = e.args[0]; // int(26 + angle * 102 / 180): the servo block
        if (call(a, null, 'int', 1) && a.args[0].k === 'bin' && a.args[0].op === 'add' && a.args[0].a.k === 'num' && a.args[0].a.v === 26 && a.args[0].b.k === 'bin' && a.args[0].b.op === 'div' && a.args[0].b.a.k === 'bin' && a.args[0].b.a.op === 'mul') return mk('servo', { p }, { a: exprBlock(a.args[0].b.a.a) });
        return mk('awrite', { p }, { v: exprBlock(a) });
      }
    }
    if (s.k === 'expr' && call(e, 'radio', 'on', 0) && next && next.k === 'expr' && next.e.k === 'call' && isAttr(next.e.f, 'radio', 'config') && next.e.kw.length === 1 && next.e.kw[0][0] === 'group' && !next.e.args.length) return Object.assign(mk('radio_on', {}, { n: exprBlock(next.e.kw[0][1]) }), { _eat: true });
    return mk('pyline', { code: rawOf(s) });
  };
  return list(tree);
}
// ------------------------------------------------------------------ the editor in the page
const UI = {
  blocks: t3('🧩 Blocks', '🧩 ब्लॉक', '🧩 Blocks'), python: t3('🐍 Python', '🐍 Python', '🐍 Python'), drag: t3('Drag blocks into the program. Drag one back here to delete it.', 'ब्लॉक खींचकर प्रोग्राम में डालिए। हटाने के लिए वापस यहाँ खींचिए।', 'Blocks kheench kar program mein daaliye. Hatane ke liye wapas yahan kheenchiye.'),
  start: t3('on start', 'शुरू होने पर', 'start hone par'), fix: t3('Fix the Python first (line {n}), then switch to blocks.', 'पहले Python ठीक कीजिए (लाइन {n}), फिर ब्लॉक पर जाइए।', 'Pehle Python theek kijiye (line {n}), phir blocks par jaiye.'),
  newVar: t3('new variable…', 'नया वेरिएबल…', 'naya variable…'), varName: t3('Name of the new variable (letters, no spaces):', 'नए वेरिएबल का नाम (अक्षर, बिना space):', 'Naye variable ka naam (letters, bina space):'),
};
export class BlockUI {
  constructor(app, core) {
    this.app = app; this.core = core; this.cat = 'basic'; this.drag = null;
    const pane = document.getElementById('codepane'); this.pane = pane;
    if (!document.getElementById('bk5-css')) { const st = document.createElement('style'); st.id = 'bk5-css'; st.textContent = CSS; document.head.appendChild(st); }
    this.bar = document.createElement('div'); this.bar.id = 'bk-bar'; pane.insertBefore(this.bar, pane.firstChild);
    this.box = document.createElement('div'); this.box.id = 'bk'; pane.insertBefore(this.box, document.getElementById('errs'));
    this.box.innerHTML = '<div class="bk-pal"><div class="bk-cats"></div><div class="bk-list"></div></div><div class="bk-ws"></div>';
    this.cats = this.box.querySelector('.bk-cats'); this.list = this.box.querySelector('.bk-list'); this.ws = this.box.querySelector('.bk-ws');
    let want = null; try { want = localStorage.getItem('rl360.mb5blocks'); } catch (e) { /* private */ }
    this.mode = want ? want : core.cfg.blocks ? 'blocks' : 'python';
    this.onMove = (e) => this.dragMove(e); this.onUp = (e) => this.dragEnd(e);
    addEventListener('pointermove', this.onMove); addEventListener('pointerup', this.onUp); addEventListener('pointercancel', this.onUp);
    this.lang = L.lang; this.renderBar(); this.setMode(this.mode, true);
    this.timer = setInterval(() => { if (L.lang !== this.lang) { this.lang = L.lang; this.renderBar(); if (this.mode === 'blocks') this.render(); } }, 400);
  }
  renderBar() {
    this.bar.innerHTML = `<div class="seg"><button data-m="blocks">${esc(tx(UI.blocks))}</button><button data-m="python">${esc(tx(UI.python))}</button></div><span class="bk-msg"></span>`;
    for (const b of this.bar.querySelectorAll('[data-m]')) b.onclick = () => this.setMode(b.dataset.m);
    for (const b of this.bar.querySelectorAll('[data-m]')) b.classList.toggle('on', b.dataset.m === this.mode);
  }
  msg(s) { const m = this.bar.querySelector('.bk-msg'); if (m) m.textContent = s || ''; }
  setMode(m, first) {
    if (m === 'blocks') {
      try { this.prog = fromPython(this.app.code()); } catch (e) { this.msg(tx(UI.fix, { n: e.line || '?' })); if (first) m = 'python'; else return; }
    }
    this.mode = m; if (!first) { try { localStorage.setItem('rl360.mb5blocks', m); } catch (e) { /* private */ } }
    this.pane.classList.toggle('bk-on', m === 'blocks'); this.msg('');
    for (const b of this.bar.querySelectorAll('[data-m]')) b.classList.toggle('on', b.dataset.m === m);
    if (m === 'blocks') { this.renderPalette(); this.render(); }
    else this.app.editor.paint();
  }
  // ---------------------------------------------------------------- the palette
  renderPalette() {
    this.cats.innerHTML = Object.keys(PALETTE).map((c) => `<button data-c="${c}" style="--bc:${CAT[c][1]}" class="${c === this.cat ? 'on' : ''}">${esc(tx(CAT[c][0]))}</button>`).join('');
    for (const b of this.cats.querySelectorAll('[data-c]')) b.onclick = () => { this.cat = b.dataset.c; this.renderPalette(); };
    this.list.innerHTML = `<p class="bk-hint">${esc(tx(UI.drag))}</p>`;
    for (const t of PALETTE[this.cat]) { const el = this.blockEl(mk(t), true); el.classList.add('bk-src'); el.addEventListener('pointerdown', (e) => this.dragStart(e, { t })); this.list.appendChild(el); }
  }
  // ---------------------------------------------------------------- the program
  render() {
    this.vars = new Set(['count']); const walk = (l) => { for (const b of l) { if (b.f && b.f.name && (b.t === 'set' || b.t === 'change' || b.t === 'var')) this.vars.add(b.f.name); for (const v of Object.values(b.i || {})) walk([v]); if (b.s) walk(b.s); if (b.e) walk(b.e); } }; walk(this.prog);
    this.ws.innerHTML = `<div class="bk-hat">${esc(tx(UI.start))}</div>`; this.ws.appendChild(this.stackEl(this.prog));
  }
  stackEl(list) { const d = document.createElement('div'); d.className = 'bk-stack'; d.appendChild(this.gap(list, 0)); list.forEach((b, i) => { d.appendChild(this.blockEl(b)); d.appendChild(this.gap(list, i + 1)); }); return d; }
  gap(list, i) { const g = document.createElement('div'); g.className = 'bk-gap'; g._at = [list, i]; return g; }
  blockEl(b, src) {
    const def = BL[b.t]; const el = document.createElement('div'); el.className = `bk-b bk-${def.k}${def.C ? ' bk-c' : ''}`; el.style.setProperty('--bc', CAT[def.c][1]); el._b = b;
    const row = document.createElement('div'); row.className = 'bk-row'; el.appendChild(row);
    if (def.raw) { const ta = document.createElement(def.k === 's' ? 'textarea' : 'input'); ta.className = 'bk-raw'; ta.value = b.f.code; ta.rows = String(b.f.code).split('\n').length; ta.spellcheck = false; if (!src) ta.oninput = () => { b.f.code = ta.value; this.changed(false); }; else ta.readOnly = true; row.appendChild(ta); }
    else if (def.lit) { const inp = document.createElement('input'); inp.className = 'bk-lit'; inp.value = b.f.v; inp.inputMode = def.lit === 'num' ? 'decimal' : 'text'; inp.size = Math.max(2, String(b.f.v).length); if (!src) inp.oninput = () => { inp.size = Math.max(2, inp.value.length); b.f.v = def.lit === 'num' ? (inp.value.trim() === '' || Number.isNaN(+inp.value) ? 0 : +inp.value) : inp.value; this.changed(false); }; else inp.readOnly = true; if (def.lit === 'text') el.classList.add('bk-txt'); row.appendChild(inp); }
    else {
      const parts = tx(def.txt).split(/(\{[^}]+\})/);
      for (const p of parts) {
        const m = /^\{(\w+)(?::(\w+))?\}$/.exec(p);
        if (!m) { if (p.trim()) { const s = document.createElement('span'); s.textContent = p.trim(); row.appendChild(s); } continue; }
        const [, k, list] = m;
        if (list === 'var') row.appendChild(this.varSel(b, k, src));
        else if (list) { const sel = document.createElement('select'); sel.className = 'bk-sel'; for (const o of LISTS[list]) { const op = document.createElement('option'); op.value = o; op.textContent = o.replace(/_/g, ' ').toLowerCase().replace(/^(true|false)$/, (q) => q[0].toUpperCase() + q.slice(1)); if (list === 'AB' || list === 'AB1') op.textContent = o.toUpperCase(); if (o === b.f[k]) op.selected = true; sel.appendChild(op); } if (!src) sel.onchange = () => { b.f[k] = sel.value; this.changed(false); }; else sel.disabled = true; row.appendChild(sel); }
        else { const slot = document.createElement('span'); slot.className = 'bk-slot'; slot._slot = [b, k]; if (b.i[k]) slot.appendChild(this.blockEl(b.i[k], src)); row.appendChild(slot); }
      }
    }
    if (def.C) { el.appendChild(src ? emptyDiv('bk-in') : Object.assign(this.stackEl(b.s), { className: 'bk-stack bk-in' })); if (def.E) { const r2 = document.createElement('div'); r2.className = 'bk-row'; r2.textContent = tx(def.etxt); el.appendChild(r2); el.appendChild(src ? emptyDiv('bk-in') : Object.assign(this.stackEl(b.e), { className: 'bk-stack bk-in' })); } const f = document.createElement('div'); f.className = 'bk-foot'; el.appendChild(f); }
    if (!src) el.addEventListener('pointerdown', (e) => { if (e.target.closest('input,select,textarea')) return; if (e.target.closest('.bk-b') !== el) return; this.dragStart(e, { b }); });
    return el;
  }
  varSel(b, k, src) {
    const sel = document.createElement('select'); sel.className = 'bk-sel bk-var'; const names = [...(this.vars || new Set(['count'])), b.f[k]];
    for (const n of [...new Set(names)]) { const op = document.createElement('option'); op.value = n; op.textContent = n; if (n === b.f[k]) op.selected = true; sel.appendChild(op); }
    const nw = document.createElement('option'); nw.value = '__new'; nw.textContent = tx(UI.newVar); sel.appendChild(nw);
    if (src) sel.disabled = true; else sel.onchange = () => { if (sel.value === '__new') { const n = (prompt(tx(UI.varName), 'score') || '').trim(); if (/^[A-Za-z_]\w*$/.test(n)) b.f[k] = n; this.changed(true); return; } b.f[k] = sel.value; this.changed(true); };
    return sel;
  }
  // the blocks changed: new Python into the editor (the lesson sees it as an edit)
  changed(redraw) { const src = toPython(this.prog); this.app.editor.value = src; this.app.onEdit(src); if (redraw) this.render(); }
  // ---------------------------------------------------------------- drag and drop
  dragStart(e, what) {
    if (e.button > 0) return; e.preventDefault(); e.stopPropagation();
    const b = what.b || mk(what.t); const ghost = this.blockEl(b, true); ghost.classList.add('bk-ghost'); document.body.appendChild(ghost);
    this.drag = { b, fromPal: !what.b, ghost, x0: e.clientX, y0: e.clientY, moved: false, id: e.pointerId };
    this.place(e);
  }
  place(e) { const g = this.drag.ghost; g.style.left = (e.clientX + 8) + 'px'; g.style.top = (e.clientY + 6) + 'px'; }
  target(x, y) { // the gap or the slot under the pointer
    const def = BL[this.drag.b.t]; let best = null, bd = 1e9;
    if (def.k === 'r') { for (const s of this.ws.querySelectorAll('.bk-slot')) { if (s._slot[0] === this.drag.b || isInside(s, this.drag.b)) continue; const r = s.getBoundingClientRect(); const d = Math.hypot(Math.max(r.left - x, 0, x - r.right), Math.max(r.top - y, 0, y - r.bottom)); if (d < bd && d < 30) { bd = d; best = s; } } return best; }
    for (const g of this.ws.querySelectorAll('.bk-gap')) { if (owns(this.drag.b, g._at[0])) continue; const r = g.getBoundingClientRect(); if (x < r.left - 30 || x > r.right + 40) continue; const d = Math.abs((r.top + r.bottom) / 2 - y); if (d < bd && d < 40) { bd = d; best = g; } }
    return best;
  }
  dragMove(e) {
    const D = this.drag; if (!D || e.pointerId !== D.id) return; if (Math.hypot(e.clientX - D.x0, e.clientY - D.y0) > 5) D.moved = true;
    this.place(e); for (const x of this.ws.querySelectorAll('.hot')) x.classList.remove('hot');
    const t = this.target(e.clientX, e.clientY); if (t) t.classList.add('hot'); D.t = t;
    const pr = this.box.querySelector('.bk-pal').getBoundingClientRect(); this.box.querySelector('.bk-pal').classList.toggle('trash', !D.fromPal && e.clientX < pr.right && e.clientX > pr.left);
  }
  dragEnd(e) {
    const D = this.drag; if (!D || e.pointerId !== D.id) return; this.drag = null; D.ghost.remove();
    this.box.querySelector('.bk-pal').classList.remove('trash'); for (const x of this.ws.querySelectorAll('.hot')) x.classList.remove('hot');
    if (!D.moved) { if (D.fromPal) { this.prog.push(D.b); this.changed(true); } return; } // a tap on the palette adds the block at the end
    const pr = this.box.querySelector('.bk-pal').getBoundingClientRect(); const overPal = e.clientX < pr.right && e.clientX > pr.left && e.clientY > pr.top && e.clientY < pr.bottom;
    const t = D.t;
    if (!D.fromPal) { if (!t && !overPal) return; remove(this.prog, D.b); }
    if (overPal && !D.fromPal) { this.changed(true); return; }
    if (t && t._slot) { const [pb, k] = t._slot; pb.i[k] = D.b; }
    else if (t && t._at) { const [list, i] = t._at; list.splice(Math.min(i, list.length), 0, D.b); }
    else if (D.fromPal) this.prog.push(D.b);
    this.changed(true);
  }
  dispose() { clearInterval(this.timer); removeEventListener('pointermove', this.onMove); removeEventListener('pointerup', this.onUp); removeEventListener('pointercancel', this.onUp); this.pane.classList.remove('bk-on'); this.bar.remove(); this.box.remove(); if (this.drag) this.drag.ghost.remove(); }
}
const emptyDiv = (c) => { const d = document.createElement('div'); d.className = c; return d; };
function remove(list, b) { // take a block out of wherever it is in the program (a list or a slot)
  for (let i = 0; i < list.length; i++) { const x = list[i]; if (x === b) { list.splice(i, 1); return true; } if (x.s && remove(x.s, b)) return true; if (x.e && remove(x.e, b)) return true; if (removeIn(x, b)) return true; }
  return false;
}
function removeIn(x, b) { for (const k of Object.keys(x.i || {})) { const v = x.i[k]; if (v === b) { const def = BL[x.t].d && BL[x.t].d[k]; x.i[k] = def ? mk(def[0] === 'num' ? 'num' : def[0] === 'text' ? 'text' : 'bool', def[0] === 'bool' ? { v: 'True' } : { v: def[1] }) : null; return true; } if (removeIn(v, b) || (v.s && remove(v.s, b))) return true; } return false; }
function isInside(slot, b) { for (let el = slot; el; el = el.parentElement) if (el._b === b) return true; return false; }
function owns(b, list) { for (const L2 of [b.s, b.e]) { if (!L2) continue; if (L2 === list) return true; for (const x of L2) if (owns(x, list)) return true; } return false; } // a C block's own lists (it cannot go inside itself)
const CSS = `
#bk-bar{display:none;align-items:center;gap:8px;padding:5px 8px 4px;border-bottom:1px solid var(--line,#2a3342)}
body.mb5 #bk-bar{display:flex}
#bk-bar .seg{display:flex;background:rgba(255,255,255,.06);border-radius:9px;padding:2px}
#bk-bar .seg button{padding:5px 11px;border-radius:7px;font-size:12.5px;font-weight:700;color:var(--mute,#a39c90)}
#bk-bar .seg button.on{background:var(--ink,#f2ede4);color:#14100a}
#bk-bar .bk-msg{font-size:11.5px;color:#ffb38a;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
#bk{display:none;flex:1;min-height:0;background:#0f1319}
#codepane.bk-on #bk{display:flex}#codepane.bk-on #editor{display:none}
.bk-pal{width:132px;flex:none;display:flex;flex-direction:column;border-right:1px solid rgba(255,255,255,.08);min-height:0;transition:background .15s}
.bk-pal.trash{background:rgba(255,90,70,.18)}
.bk-cats{display:flex;flex-wrap:wrap;gap:3px;padding:6px}
.bk-cats button{font-size:11px;font-weight:700;padding:3px 6px;border-radius:6px;border-left:4px solid var(--bc);background:rgba(255,255,255,.05);color:#e8e2d6}
.bk-cats button.on{background:var(--bc);color:#fff}
.bk-list{flex:1;overflow:auto;padding:4px 6px 10px;display:flex;flex-direction:column;align-items:flex-start;gap:6px}
.bk-hint{font-size:10.5px;color:#8d877c;margin:0 0 2px;line-height:1.3}
.bk-ws{flex:1;overflow:auto;padding:8px 10px 40px;min-width:0}
.bk-hat{display:inline-block;background:#2f7fe0;color:#fff;font-size:12px;font-weight:700;padding:5px 12px 8px;border-radius:12px 12px 4px 4px;margin-bottom:-2px}
.bk-stack{display:flex;flex-direction:column;align-items:flex-start;min-height:6px}
.bk-in{margin-left:14px;padding:2px 0;min-height:16px}
.bk-gap{height:5px;align-self:stretch;min-width:90px;border-radius:3px}
.bk-gap.hot{height:12px;background:#f0a65a;box-shadow:0 0 8px #f0a65a}
.bk-b{background:var(--bc);color:#fff;border-radius:7px;font-size:12.5px;font-weight:600;user-select:none;-webkit-user-select:none;touch-action:none;cursor:grab;box-shadow:0 2px 0 rgba(0,0,0,.28);max-width:100%}
.bk-s{padding:0 0 0 0}
.bk-r{border-radius:16px;display:inline-flex}
.bk-row{display:flex;flex-wrap:wrap;align-items:center;gap:5px;padding:5px 8px;min-height:28px}
.bk-r .bk-row{padding:2px 7px;min-height:22px}
.bk-c{border-radius:7px;padding-bottom:0}
.bk-c>.bk-in{background:#0f1319;border-radius:0 6px 6px 0;margin-right:0;padding:3px 6px 3px 4px}
.bk-foot{height:10px}
.bk-slot{display:inline-flex;min-width:26px;min-height:20px;border-radius:12px;background:rgba(0,0,0,.18)}
.bk-slot.hot{outline:2px solid #f0a65a;box-shadow:0 0 8px #f0a65a}
.bk-lit{width:auto;min-width:22px;border:0;border-radius:11px;padding:2px 7px;font:600 12.5px var(--mono,monospace);background:#fff;color:#1b1b1b;text-align:center}
.bk-txt .bk-lit{text-align:left}
.bk-sel{border:0;border-radius:8px;padding:2px 4px;font:600 12px inherit;background:rgba(255,255,255,.92);color:#1b1b1b;max-width:120px}
.bk-raw{border:0;border-radius:5px;padding:3px 6px;font:500 12px var(--mono,monospace);background:#20262f;color:#d8dee8;resize:none;min-width:160px;white-space:pre}
.bk-src{cursor:grab}
.bk-ghost{position:fixed;z-index:200;pointer-events:none;opacity:.88;transform:rotate(-2deg)}
@media (max-width:980px){.bk-pal{width:112px}.bk-b{font-size:12px}}
`;
