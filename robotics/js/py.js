// DUET Robotics Lab 360, batch 5: a small Python (MicroPython style) for the boards, our own code. No internet, no cloud.
//   compile(source, opts) -> { ok, errors, warnings, info, make(host) }
// The source is parsed and turned into ONE JavaScript generator function: every Python statement may pause there, so a
// `while True:` loop never freezes the page, and sleep() only moves a virtual clock. make(host) gives a Task that runs it:
// task.run(until, wallEnd) runs it up to a virtual time (µs) or until the frame's few milliseconds are spent.
// The language lives here; a board adds its modules (`from microbit import *`, later the Raspberry Pi's) through host.
// Values: None null · bool true/false · int JS number · float Flt (32-bit, printed as MicroPython on the micro:bit does) ·
// str JS string · list Array · tuple Tup · dict Dict · range Rng · functions PyFn (Python) and Nat (JavaScript) ·
// a board's own objects (Image, pins, …) answer pyGet(name) / pyType / pyStr().
// Errors are PyErr: a Python type (NameError, …), a message code (texts at the end: English, Hindi, Hinglish) and the line.
import { CPP, msg } from './i18n.js';
import { suggest } from './cpp.js';

const t3 = (en, hi, hg) => ({ en, hi, hg });
const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

// ------------------------------------------------------------------ values
export class Flt { constructor(v) { this.v = Math.fround(v); } }
// (batch 38) a float kept exact: CPython's time.time() is a double near 1.8e9, and a 32-bit float rounds it to 128 s steps;
// differences of two such times are small again, so arithmetic on them can go on in Flt
export const dbl = (v) => { const f = new Flt(0); f.v = v; return f; };
export class Tup extends Array {}
export const tup = (items) => { const t = new Tup(); for (const x of items) t.push(x); return t; };
export class Rng {
  constructor(a, b, s) { this.a = a; this.b = b; this.s = s; }
  get length() { const { a, b, s } = this; return s > 0 ? Math.max(0, Math.ceil((b - a) / s)) : Math.max(0, Math.ceil((a - b) / -s)); }
  at(i) { return this.a + i * this.s; }
  [Symbol.iterator]() { let v = this.a; const { b, s } = this; return { next: () => (s > 0 ? v < b : v > b) ? { value: (v += s) - s, done: false } : { value: undefined, done: true } }; }
}
export class Dict {
  constructor() { this.m = new Map(); }
  get size() { return this.m.size; }
  get(k) { const e = this.m.get(hkey(k)); return e ? e[1] : undefined; }
  set(k, v) { const h = hkey(k); const e = this.m.get(h); if (e) e[1] = v; else this.m.set(h, [k, v]); }
  has(k) { return this.m.has(hkey(k)); }
  del(k) { return this.m.delete(hkey(k)); }
  keys() { return [...this.m.values()].map((e) => e[0]); }
  vals() { return [...this.m.values()].map((e) => e[1]); }
  items() { return [...this.m.values()]; }
}
function hkey(k) {
  if (typeof k === 'string') return 's' + k;
  if (typeof k === 'number') return 'n' + k;
  if (typeof k === 'boolean') return 'n' + (k ? 1 : 0);
  if (k instanceof Flt) return 'n' + k.v;
  if (k === null) return 'N';
  if (k instanceof Tup) return 't(' + k.map(hkey).join(',') + ')';
  if (k && k.pyHash) return k.pyHash();
  throw perr('TypeError', 'P_UNHASHABLE', { t: typeName(k) });
}
// a Python function: its parameters, the defaults of the last ones, and its body (a JS generator function)
export class PyFn { constructor(name, params, defs, gen, line) { this.name = name; this.params = params; this.defs = defs; this.gen = gen; this.line = line; } }
// a function written in JavaScript: sig lists its parameters ('name', 'name=default' with a JS value in defs, or '*' for
// "anything": then fn gets (R, args, kw)). blocking: fn is a generator function (it may wait, like sleep()).
export class Nat {
  constructor(name, sig, fn, opts) {
    this.name = name; this.fn = fn; this.blocking = !!(opts && opts.blocking); this.star = sig === '*';
    if (!this.star) { this.params = []; this.defs = []; for (const p of sig) { const [n, d] = String(p).split('='); this.params.push(n); this.defs.push(d === undefined ? NODEF : d === '' ? ABSENT : (opts && opts.defs && n in opts.defs ? opts.defs[n] : parseDef(d))); } }
    this.kind = opts && opts.kind;
  }
}
const NODEF = Symbol('nodef'), ABSENT = Symbol('absent'); // a parameter that must be given / an optional one left out
function parseDef(d) { if (d === 'None') return null; if (d === 'True') return true; if (d === 'False') return false; if (/^-?\d+$/.test(d)) return +d; if (/^-?\d*\.\d+$/.test(d)) return new Flt(+d); return d.replace(/^['"]|['"]$/g, ''); }
export class Mod { constructor(name, attrs) { this.name = name; this.attrs = attrs || {}; } }
// an exception type (ValueError, …) and an exception value (what `except … as e` gets)
export class ExcType { constructor(name, base) { this.name = name; this.base = base; } }
export class PyExc { constructor(type, args, text) { this.type = type; this.args = args || []; this.text = text; } }
const EXC = {};
for (const [n, b] of [['BaseException', null], ['Exception', 'BaseException'], ['ArithmeticError', 'Exception'], ['ZeroDivisionError', 'ArithmeticError'], ['OverflowError', 'ArithmeticError'],
  ['LookupError', 'Exception'], ['IndexError', 'LookupError'], ['KeyError', 'LookupError'], ['NameError', 'Exception'], ['UnboundLocalError', 'NameError'], ['TypeError', 'Exception'],
  ['ValueError', 'Exception'], ['AttributeError', 'Exception'], ['RuntimeError', 'Exception'], ['RecursionError', 'RuntimeError'], ['NotImplementedError', 'RuntimeError'], ['ImportError', 'Exception'],
  ['AssertionError', 'Exception'], ['MemoryError', 'Exception'], ['OSError', 'Exception'], ['FileNotFoundError', 'OSError'], ['FileExistsError', 'OSError'], ['PermissionError', 'OSError'], ['IsADirectoryError', 'OSError'], ['StopIteration', 'Exception'], ['KeyboardInterrupt', 'BaseException'], ['SyntaxError', 'Exception'], ['IndentationError', 'SyntaxError']]) EXC[n] = new ExcType(n, b ? EXC[b] : null);
export { EXC };
// a Python error on its way out: a type, a message code with its values, and the line (taken from the running task)
export class PyErr extends Error {
  constructor(type, code, args, line) { super(type + ': ' + code); this.type = type; this.code = code; this.args = args || {}; this.line = line; }
  get val() { if (!this._val) this._val = this.exc || new PyExc(EXC[this.type] || EXC.Exception, [this.text()], null); return this._val; }
  text() { const s = msg({ code: this.code, args: this.args }); return s.replace(/^\w+: /, ''); }
}
let CUR = null; // the runtime of the task that is running now (errors take its line)
export function perr(type, code, args) { return new PyErr(type, code, args, CUR ? CUR.L : 0); }

export function typeName(v) {
  if (v === null || v === undefined) return 'NoneType';
  switch (typeof v) { case 'boolean': return 'bool'; case 'number': return 'int'; case 'string': return 'str'; }
  if (v instanceof Flt) return 'float';
  if (v instanceof Tup) return 'tuple';
  if (Array.isArray(v)) return 'list';
  if (v instanceof Dict) return 'dict';
  if (v instanceof Rng) return 'range';
  if (v instanceof PyFn || v instanceof Nat) return v.kind === 'type' ? 'type' : 'function';
  if (v instanceof Mod) return 'module';
  if (v instanceof ExcType) return 'type';
  if (v instanceof PyExc) return v.type.name;
  if (v.pyType) return v.pyType;
  return 'object';
}
const isNum = (v) => typeof v === 'number' || v instanceof Flt || typeof v === 'boolean';
const nv = (v) => (typeof v === 'number' ? v : v instanceof Flt ? v.v : v === true ? 1 : 0); // the number in an int / float / bool
const F = (v) => new Flt(v);
export function fmtFloat(v) { // as MicroPython prints a 32-bit float: 7 significant digits, %g style
  if (Number.isNaN(v)) return 'nan'; if (!Number.isFinite(v)) return v > 0 ? 'inf' : '-inf';
  if (v === 0) return Object.is(v, -0) ? '-0.0' : '0.0';
  const ex = +v.toExponential(6).split('e')[1];
  if (ex < -4 || ex >= 7) { let [m, e] = v.toExponential(6).split('e'); m = m.replace(/\.?0+$/, ''); const n = +e; return m + 'e' + (n < 0 ? '-' : '+') + String(Math.abs(n)).padStart(2, '0'); }
  let s = v.toFixed(Math.max(0, 6 - ex)); if (s.includes('.')) s = s.replace(/0+$/, '').replace(/\.$/, '.0'); else s += '.0';
  return s;
}
export function str(v) {
  if (typeof v === 'string') return v;
  if (v === null || v === undefined) return 'None';
  if (v === true) return 'True'; if (v === false) return 'False';
  if (typeof v === 'number') return Number.isInteger(v) ? (Math.abs(v) < 1e21 ? String(v) : BigInt(v).toString()) : fmtFloat(v);
  if (v instanceof Flt) return fmtFloat(v.v);
  if (v instanceof PyExc) return v.args.length === 1 ? str(v.args[0]) : v.args.length ? repr(tup(v.args)) : '';
  if (v.pyStr) return v.pyStr();
  return repr(v);
}
export function repr(v, seen) {
  if (typeof v === 'string') { const q = v.includes("'") && !v.includes('"') ? '"' : "'"; return q + v.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t').replace(new RegExp(q, 'g'), '\\' + q) + q; }
  if (Array.isArray(v)) {
    seen = seen || new Set(); if (seen.has(v)) return v instanceof Tup ? '(...)' : '[...]'; seen.add(v);
    const s = v.map((x) => repr(x, seen)).join(', '); seen.delete(v);
    return v instanceof Tup ? '(' + s + (v.length === 1 ? ',' : '') + ')' : '[' + s + ']';
  }
  if (v instanceof Dict) return '{' + v.items().map(([k, x]) => repr(k, seen) + ': ' + repr(x, seen)).join(', ') + '}';
  if (v instanceof Rng) return v.s === 1 ? `range(${v.a}, ${v.b})` : `range(${v.a}, ${v.b}, ${v.s})`;
  if (v instanceof PyFn) return `<function ${v.name}>`;
  if (v instanceof Nat) return v.kind === 'type' ? `<class '${v.name}'>` : `<function ${v.name}>`;
  if (v instanceof Mod) return `<module '${v.name}'>`;
  if (v instanceof ExcType) return `<class '${v.name}'>`;
  if (v instanceof PyExc) return `${v.type.name}(${v.args.map((a) => repr(a)).join(', ')})`;
  if (v && v.pyRepr) return v.pyRepr();
  return str(v);
}
export function truth(v) {
  if (v === null || v === undefined || v === false || v === 0 || v === '') return false;
  if (v === true || typeof v === 'number' || typeof v === 'string') return true;
  if (v instanceof Flt) return v.v !== 0;
  if (Array.isArray(v)) return v.length > 0;
  if (v instanceof Dict) return v.size > 0;
  if (v instanceof Rng) return v.length > 0;
  if (v.pyBool) return v.pyBool();
  return true;
}
export function eq(a, b) {
  if (a === b) return a !== a ? false : true; // NaN
  if (isNum(a) && isNum(b)) return nv(a) === nv(b);
  if (Array.isArray(a) && Array.isArray(b)) { if ((a instanceof Tup) !== (b instanceof Tup) || a.length !== b.length) return false; for (let i = 0; i < a.length; i++) if (!eq(a[i], b[i])) return false; return true; }
  if (a instanceof Dict && b instanceof Dict) { if (a.size !== b.size) return false; for (const [k, v] of a.items()) { if (!b.has(k) || !eq(v, b.get(k))) return false; } return true; }
  if (a instanceof Rng && b instanceof Rng) return a.length === b.length && (a.length === 0 || (a.a === b.a && (a.length === 1 || a.s === b.s)));
  if (a && a.pyEq) return a.pyEq(b);
  return false;
}
function cmp(a, b, op) { // -1, 0, 1 for < ordering
  if (isNum(a) && isNum(b)) { const x = nv(a), y = nv(b); return x < y ? -1 : x > y ? 1 : 0; }
  if (typeof a === 'string' && typeof b === 'string') return a < b ? -1 : a > b ? 1 : 0;
  if (Array.isArray(a) && Array.isArray(b) && (a instanceof Tup) === (b instanceof Tup)) {
    for (let i = 0; i < Math.min(a.length, b.length); i++) if (!eq(a[i], b[i])) return cmp(a[i], b[i], op);
    return a.length - b.length;
  }
  throw perr('TypeError', 'P_CMP', { a: typeName(a), b: typeName(b), op });
}
function idx(v, n, t) { // a whole-number index, from the end when negative
  if (typeof v === 'boolean') v = +v;
  if (typeof v !== 'number') throw perr('TypeError', 'P_INDEX_TYPE', { t: typeName(v) });
  const i = v < 0 ? v + n : v;
  if (i < 0 || i >= n) throw perr('IndexError', n ? 'P_INDEX' : 'P_INDEX_EMPTY', { i: v, n, last: n - 1, t });
  return i;
}
const intOf = (v, fn) => { if (typeof v === 'number') return v; if (typeof v === 'boolean') return +v; throw perr('TypeError', 'P_NEED_INT', { fn, t: typeName(v) }); };
const numOf = (v, fn) => { if (isNum(v)) return nv(v); throw perr('TypeError', 'P_NEED_NUM', { fn, t: typeName(v) }); };
const MAXLEN = 30000; // a list longer than this would not fit in a micro:bit's 128 KB
const big = (n) => { if (n > MAXLEN) throw perr('MemoryError', 'P_MEMORY', {}); };
// Python's floor division and modulo (the sign follows the divisor)
const fmod = (a, b) => { const r = a % b; return r !== 0 && (r < 0) !== (b < 0) ? r + b : r; };

// ------------------------------------------------------------------ operators (R.add(a, b), …)
const OPS = {
  add(a, b) {
    if (typeof a === 'number' && typeof b === 'number') return a + b;
    if (typeof a === 'string' && typeof b === 'string') return a + b;
    if (isNum(a) && isNum(b)) return a instanceof Flt || b instanceof Flt ? F(nv(a) + nv(b)) : nv(a) + nv(b);
    if (Array.isArray(a) && Array.isArray(b) && (a instanceof Tup) === (b instanceof Tup)) { big(a.length + b.length); return a instanceof Tup ? tup([...a, ...b]) : [...a, ...b]; }
    if (a && a.pyAdd) { const r = a.pyAdd(b); if (r !== undefined) return r; }
    if ((typeof a === 'string' && isNum(b)) || (isNum(a) && typeof b === 'string')) throw perr('TypeError', 'P_STR_NUM', {});
    throw perr('TypeError', 'P_TYPE_OP', { op: '+', a: typeName(a), b: typeName(b) });
  },
  sub(a, b) {
    if (typeof a === 'number' && typeof b === 'number') return a - b;
    if (isNum(a) && isNum(b)) return a instanceof Flt || b instanceof Flt ? F(nv(a) - nv(b)) : nv(a) - nv(b);
    if (a && a.pySub) { const r = a.pySub(b); if (r !== undefined) return r; }
    throw perr('TypeError', 'P_TYPE_OP', { op: '-', a: typeName(a), b: typeName(b) });
  },
  mul(a, b) {
    if (typeof a === 'number' && typeof b === 'number') return a * b;
    if (isNum(a) && isNum(b)) return a instanceof Flt || b instanceof Flt ? F(nv(a) * nv(b)) : nv(a) * nv(b);
    const rep = (s, n) => { n = Math.max(0, n); if (typeof s === 'string') { big(s.length * n / 8); return s.repeat(n); } big(s.length * n); const o = []; for (let i = 0; i < n; i++) o.push(...s); return s instanceof Tup ? tup(o) : o; };
    if ((typeof a === 'string' || Array.isArray(a)) && (typeof b === 'number' || typeof b === 'boolean')) return rep(a, +b);
    if ((typeof b === 'string' || Array.isArray(b)) && (typeof a === 'number' || typeof a === 'boolean')) return rep(b, +a);
    if (a && a.pyMul) { const r = a.pyMul(b); if (r !== undefined) return r; }
    if (b && b.pyMul) { const r = b.pyMul(a); if (r !== undefined) return r; }
    throw perr('TypeError', 'P_TYPE_OP', { op: '*', a: typeName(a), b: typeName(b) });
  },
  div(a, b) {
    if (isNum(a) && isNum(b)) { const y = nv(b); if (y === 0) throw perr('ZeroDivisionError', 'P_DIV0', {}); return F(nv(a) / y); }
    if (a && a.pyDiv) { const r = a.pyDiv(b); if (r !== undefined) return r; }
    throw perr('TypeError', 'P_TYPE_OP', { op: '/', a: typeName(a), b: typeName(b) });
  },
  fdiv(a, b) {
    if (isNum(a) && isNum(b)) { const x = nv(a), y = nv(b); if (y === 0) throw perr('ZeroDivisionError', 'P_DIV0', {}); const r = Math.floor(x / y); return a instanceof Flt || b instanceof Flt ? F(r) : r; }
    throw perr('TypeError', 'P_TYPE_OP', { op: '//', a: typeName(a), b: typeName(b) });
  },
  mod(a, b) {
    if (typeof a === 'string') return pctFormat(a, b);
    if (isNum(a) && isNum(b)) { const x = nv(a), y = nv(b); if (y === 0) throw perr('ZeroDivisionError', 'P_DIV0', {}); const r = fmod(x, y); return a instanceof Flt || b instanceof Flt ? F(r) : r; }
    throw perr('TypeError', 'P_TYPE_OP', { op: '%', a: typeName(a), b: typeName(b) });
  },
  pow(a, b) {
    if (isNum(a) && isNum(b)) {
      const x = nv(a), y = nv(b);
      if (x === 0 && y < 0) throw perr('ZeroDivisionError', 'P_DIV0', {});
      if (typeof a !== 'object' && typeof b !== 'object' && y >= 0) return Math.pow(x, y);
      return F(Math.pow(x, y));
    }
    throw perr('TypeError', 'P_TYPE_OP', { op: '**', a: typeName(a), b: typeName(b) });
  },
  band(a, b) { return bit(a, b, '&', (x, y) => x & y); },
  bor(a, b) { return bit(a, b, '|', (x, y) => x | y); },
  bxor(a, b) { return bit(a, b, '^', (x, y) => x ^ y); },
  shl(a, b) { return bit(a, b, '<<', (x, y) => x * Math.pow(2, y)); },
  shr(a, b) { return bit(a, b, '>>', (x, y) => Math.floor(x / Math.pow(2, y))); },
  neg(a) { if (typeof a === 'number') return -a; if (a instanceof Flt) return F(-a.v); if (typeof a === 'boolean') return -a; throw perr('TypeError', 'P_UNARY', { op: '-', t: typeName(a) }); },
  pos(a) { if (isNum(a)) return typeof a === 'boolean' ? +a : a; throw perr('TypeError', 'P_UNARY', { op: '+', t: typeName(a) }); },
  inv(a) { if (typeof a === 'number' || typeof a === 'boolean') return ~a; throw perr('TypeError', 'P_UNARY', { op: '~', t: typeName(a) }); },
  lt(a, b) { return typeof a === 'number' && typeof b === 'number' ? a < b : cmp(a, b, '<') < 0; },
  le(a, b) { return typeof a === 'number' && typeof b === 'number' ? a <= b : cmp(a, b, '<=') <= 0; },
  gt(a, b) { return typeof a === 'number' && typeof b === 'number' ? a > b : cmp(a, b, '>') > 0; },
  ge(a, b) { return typeof a === 'number' && typeof b === 'number' ? a >= b : cmp(a, b, '>=') >= 0; },
  eq(a, b) { return eq(a, b); },
  ne(a, b) { return !eq(a, b); },
  is(a, b) { return a === b || (a === undefined && b === null) || (isNum(a) && isNum(b) && typeof a === typeof b && nv(a) === nv(b) && !(a instanceof Flt)); },
  isnot(a, b) { return !OPS.is(a, b); },
  in(a, b) { // a in b
    if (typeof b === 'string') { if (typeof a !== 'string') throw perr('TypeError', 'P_IN_STR', { t: typeName(a) }); return b.includes(a); }
    if (Array.isArray(b)) return b.some((x) => eq(x, a));
    if (b instanceof Dict) return b.has(a);
    if (b instanceof Rng) { if (!isNum(a)) return false; const v = nv(a); if (!Number.isInteger(v)) return false; const k = (v - b.a) / b.s; return Number.isInteger(k) && k >= 0 && k < b.length; }
    if (b && b.pyIn) return b.pyIn(a);
    throw perr('TypeError', 'P_NOT_ITER', { t: typeName(b) });
  },
  notin(a, b) { return !OPS.in(a, b); },
};
function bit(a, b, op, f) {
  if ((typeof a === 'number' || typeof a === 'boolean') && (typeof b === 'number' || typeof b === 'boolean')) return f(+a, +b);
  throw perr('TypeError', 'P_TYPE_OP', { op, a: typeName(a), b: typeName(b) });
}
// "%d players" % n, "%s: %.1f" % (name, v)
function pctFormat(s, args) {
  const list = args instanceof Tup ? [...args] : [args]; let k = 0;
  const out = s.replace(/%([-+ 0#]*)(\d+)?(?:\.(\d+))?([diouxXeEfFgGcrs%])/g, (m, flags, w, p, c) => {
    if (c === '%') return '%';
    if (k >= list.length) throw perr('TypeError', 'P_FORMAT_ARGS', {});
    const v = list[k++]; return fmtSpec(v, (flags.includes('-') ? '<' : '') + (flags.includes('0') ? '0' : '') + (w || '') + (p !== undefined ? '.' + p : '') + (c === 'i' || c === 'u' ? 'd' : c === 'r' ? 'r' : c === 's' ? '' : c), c === 'r');
  });
  if (k < list.length && !(list.length === 1 && args instanceof Dict)) throw perr('TypeError', 'P_FORMAT_ARGS', {});
  return out;
}
// a value through a format spec: [[fill]align][sign][0][width][,][.precision][type]
export function fmtSpec(v, spec, isRepr) {
  const m = /^(?:(.)?([<>^=]))?([-+ ])?(0)?(\d+)?(,)?(?:\.(\d+))?([bcdeEfFgGnosxX%r])?$/.exec(spec || '');
  if (!m) throw perr('ValueError', 'P_FORMAT_SPEC', { spec });
  let [, fill, align, sign, zero, width, comma, prec, type] = m;
  let s;
  if (isRepr || type === 'r') s = repr(v);
  else if (type === 'd' || type === 'n') { if (!isNum(v) || v instanceof Flt) throw perr('ValueError', 'P_FORMAT_SPEC', { spec }); s = String(Math.abs(+nv(v))); if (comma) s = s.replace(/\B(?=(\d{3})+(?!\d))/g, ','); s = (nv(v) < 0 ? '-' : sign === '+' ? '+' : '') + s; }
  else if ('xXob'.includes(type || '_') && type) { const n = intOf(v, 'format'); s = Math.abs(n).toString(type === 'o' ? 8 : type === 'b' ? 2 : 16); if (type === 'X') s = s.toUpperCase(); if (n < 0) s = '-' + s; }
  else if ('fFeEgG%'.includes(type || '_') && type) {
    let x = numOf(v, 'format'); const p = prec === undefined ? 6 : +prec;
    if (type === '%') { x *= 100; s = x.toFixed(p) + '%'; } else if (type === 'f' || type === 'F') s = x.toFixed(p); else if (type === 'e' || type === 'E') { s = x.toExponential(p).replace(/e([+-])(\d)$/, 'e$10$2'); if (type === 'E') s = s.toUpperCase(); } else s = String(+x.toPrecision(Math.max(1, p)));
    if (comma) s = s.replace(/^(-?\d+)/, (q) => q.replace(/\B(?=(\d{3})+(?!\d))/g, ','));
    if (sign === '+' && x >= 0) s = '+' + s;
  } else if (type === 'c') s = String.fromCodePoint(intOf(v, 'format'));
  else { s = str(v); if (prec !== undefined && typeof v === 'string') s = s.slice(0, +prec); else if (prec !== undefined && v instanceof Flt) s = String(+v.v.toPrecision(+prec)); }
  const w = width ? +width : 0;
  if (s.length < w) {
    const numeric = isNum(v) && !isRepr && type !== 's';
    if (zero && !align) { const neg = /^[-+]/.test(s) ? s[0] : ''; return neg + s.slice(neg.length).padStart(w - neg.length, '0'); }
    const f = fill || ' ', a = align || (numeric ? '>' : '<'), pad = w - s.length;
    if (a === '<') return s + f.repeat(pad); if (a === '>') return f.repeat(pad) + s;
    if (a === '^') return f.repeat(Math.floor(pad / 2)) + s + f.repeat(Math.ceil(pad / 2));
    return f.repeat(pad) + s;
  }
  return s;
}

// ------------------------------------------------------------------ the lexer
const KW = new Set(['False', 'None', 'True', 'and', 'as', 'assert', 'async', 'await', 'break', 'class', 'continue', 'def', 'del', 'elif', 'else', 'except', 'finally', 'for', 'from', 'global', 'if', 'import', 'in', 'is', 'lambda', 'nonlocal', 'not', 'or', 'pass', 'raise', 'return', 'try', 'while', 'with', 'yield']);
const OPLIST = ['**=', '//=', '>>=', '<<=', '...', '->', ':=', '**', '//', '<<', '>>', '<=', '>=', '==', '!=', '+=', '-=', '*=', '/=', '%=', '&=', '|=', '^=', '+', '-', '*', '/', '%', '@', '&', '|', '^', '~', '<', '>', '(', ')', '[', ']', '{', '}', ',', ':', '.', ';', '='];
const CLOSE = { '(': ')', '[': ']', '{': '}' };
class SynErr extends Error { constructor(code, line, args, type) { super(code); this.code = code; this.line = line; this.args = args || {}; this.type = type || 'SyntaxError'; } }
const NAME_RE = /[\p{L}_][\p{L}\p{N}_]*/uy;
const NUM_RE = /(0[xX][0-9a-fA-F_]+|0[bB][01_]+|0[oO][0-7_]+|(?:\d[\d_]*(?:\.[\d_]*)?|\.\d[\d_]*)(?:[eE][+-]?\d+)?)([jJ])?/y;

export function lex(src) {
  src = String(src || '').replace(/\r\n?/g, '\n').replace(/ /g, ' ');
  const toks = []; const ind = [0]; const opens = [];
  let i = 0, line = 1, bol = true; const n = src.length;
  const push = (t, v, extra) => { const k = { t, v, line }; if (extra) Object.assign(k, extra); toks.push(k); return k; };
  while (i < n) {
    if (bol) {
      let col = 0, j = i;
      while (j < n && (src[j] === ' ' || src[j] === '\t' || src[j] === '\f')) { col = src[j] === '\t' ? (col + 8) & ~7 : src[j] === '\f' ? 0 : col + 1; j++; }
      if (j >= n) { i = j; break; }
      if (src[j] === '\n') { i = j + 1; line++; continue; }
      if (src[j] === '#') { while (j < n && src[j] !== '\n') j++; i = j; continue; }
      if (col > ind[ind.length - 1]) { ind.push(col); push('indent', col); }
      else if (col < ind[ind.length - 1]) {
        while (col < ind[ind.length - 1]) { ind.pop(); push('dedent', col); }
        if (col !== ind[ind.length - 1]) throw new SynErr('P_DEDENT', line, {}, 'IndentationError');
      }
      i = j; bol = false;
      if (src.startsWith('//', i)) throw new SynErr('P_SLASHES', line);
      continue;
    }
    const c = src[i];
    if (c === '\n') { i++; if (opens.length) { line++; continue; } push('nl'); line++; bol = true; continue; }
    if (c === ' ' || c === '\t' || c === '\f') { i++; continue; }
    if (c === '#') { while (i < n && src[i] !== '\n') i++; continue; }
    if (c === '\\') { if (src[i + 1] === '\n') { i += 2; line++; continue; } throw new SynErr('P_CHAR', line, { ch: '\\' }); }
    // a name (or a string prefix: r'…', f"…")
    NAME_RE.lastIndex = i; let m = NAME_RE.exec(src);
    if (m) {
      const w = m[0]; const q = src[i + w.length];
      if ((q === '"' || q === "'") && /^(r|u|f|b|rb|br|fr|rf)$/i.test(w)) { i += w.length; i = lexString(src, i, w.toLowerCase(), push, () => line, (d) => { line += d; }); continue; }
      push('name', w, { kw: KW.has(w) }); i += w.length; continue;
    }
    if (/[0-9]/.test(c) || (c === '.' && /[0-9]/.test(src[i + 1] || ''))) {
      NUM_RE.lastIndex = i; m = NUM_RE.exec(src); let txt = m[0];
      const after = src[i + txt.length + (m[2] ? 1 : 0)] || '';
      if (/[\p{L}\p{N}_]/u.test(after)) { let e = i + txt.length; while (e < n && /[\p{L}\p{N}_.]/u.test(src[e])) e++; throw new SynErr('P_NUMBER', line, { text: src.slice(i, e) }); }
      if (m[2]) throw new SynErr('P_UNSUPPORTED', line, { what: t3('complex numbers (j)', 'कॉम्प्लेक्स संख्याएँ (j)', 'complex numbers (j)') });
      i += txt.length; txt = txt.replace(/_/g, '');
      let v, f = false;
      if (/^0[xX]/.test(txt)) v = parseInt(txt.slice(2), 16); else if (/^0[bB]/.test(txt)) v = parseInt(txt.slice(2), 2); else if (/^0[oO]/.test(txt)) v = parseInt(txt.slice(2), 8);
      else if (/[.eE]/.test(txt)) { v = parseFloat(txt); f = true; }
      else { if (/^0\d/.test(txt) && /[1-9]/.test(txt)) throw new SynErr('P_NUMBER_ZERO', line, { text: txt }); v = parseInt(txt, 10); }
      push('num', v, { f, text: txt }); continue;
    }
    if (c === '"' || c === "'") { i = lexString(src, i, '', push, () => line, (d) => { line += d; }); continue; }
    if ('“”‘’„«»'.includes(c)) throw new SynErr('P_QUOTES', line);
    // C and Arduino habits, in plain words
    if ((c === '+' || c === '-') && src[i + 1] === c && /^[\s;)\]]|^$/.test(src.slice(i + 2, i + 3))) { const prev = toks[toks.length - 1]; if (prev && prev.t === 'name') throw new SynErr('P_PLUSPLUS', line, { op: c + c, name: prev.v }); }
    if (c === '&' && src[i + 1] === '&') throw new SynErr('P_ANDOR', line, { c: '&&', py: 'and' });
    if (c === '|' && src[i + 1] === '|') throw new SynErr('P_ANDOR', line, { c: '||', py: 'or' });
    if (c === '!' && src[i + 1] !== '=') throw new SynErr('P_BANG', line);
    let op = null; for (const o of OPLIST) if (src.startsWith(o, i)) { op = o; break; }
    if (!op) throw new SynErr('P_CHAR', line, { ch: c });
    if (op in CLOSE) opens.push({ op, line });
    else if (op === ')' || op === ']' || op === '}') {
      const o = opens.pop();
      if (!o) throw new SynErr(op === '}' ? 'P_BRACE' : 'P_CLOSE', line, { got: op });
      if (CLOSE[o.op] !== op) throw new SynErr('P_EXPECTED', line, { want: CLOSE[o.op], got: op });
    }
    push('op', op); i += op.length;
  }
  if (opens.length) { const o = opens[opens.length - 1]; throw new SynErr('P_PAREN', o.line, { open: o.op, close: CLOSE[o.op], at: o.line }); }
  if (toks.length && toks[toks.length - 1].t !== 'nl' && !bol) push('nl');
  while (ind.length > 1) { ind.pop(); push('dedent', 0); }
  push('eof');
  return toks;
}
const ESC = { n: '\n', t: '\t', r: '\r', '0': '\0', '\\': '\\', "'": "'", '"': '"', a: '\x07', b: '\b', f: '\f', v: '\v', '\n': '' };
function lexString(src, i, pre, push, lineOf, addLines) {
  const q = src[i]; const triple = src.startsWith(q + q + q, i); const L0 = lineOf();
  i += triple ? 3 : 1; let s = ''; const raw = pre.includes('r'); let rawText = '';
  for (;;) {
    if (i >= src.length) throw new SynErr('P_STRING', L0);
    const c = src[i];
    if (triple ? src.startsWith(q + q + q, i) : c === q) { i += triple ? 3 : 1; break; }
    if (c === '\n') { if (!triple) throw new SynErr('P_STRING', L0); addLines(1); }
    if (c === '\\' && !raw) {
      const d = src[i + 1];
      if (d === 'x') { s += String.fromCharCode(parseInt(src.substr(i + 2, 2), 16)); rawText += src.substr(i, 4); i += 4; continue; }
      if (d === 'u') { s += String.fromCharCode(parseInt(src.substr(i + 2, 4), 16)); rawText += src.substr(i, 6); i += 6; continue; }
      if (d === '\n') addLines(1);
      s += d in ESC ? ESC[d] : '\\' + d; rawText += c + d; i += 2; continue;
    }
    s += c; rawText += c; i++;
  }
  push('str', s, { f: pre.includes('f'), raw: rawText, line: L0, bytes: pre.includes('b') });
  return i;
}

// ------------------------------------------------------------------ the parser (tokens -> a tree of plain objects)
const AUG = { '+=': 'add', '-=': 'sub', '*=': 'mul', '/=': 'div', '//=': 'fdiv', '%=': 'mod', '**=': 'pow', '&=': 'band', '|=': 'bor', '^=': 'bxor', '<<=': 'shl', '>>=': 'shr' };
const BIN = { '+': 'add', '-': 'sub', '*': 'mul', '/': 'div', '//': 'fdiv', '%': 'mod', '**': 'pow', '&': 'band', '|': 'bor', '^': 'bxor', '<<': 'shl', '>>': 'shr' };
const CMPOP = { '<': 'lt', '>': 'gt', '<=': 'le', '>=': 'ge', '==': 'eq', '!=': 'ne' };
const TYPEWORDS = new Set(['int', 'float', 'str', 'bool', 'char', 'long', 'void', 'String', 'byte', 'const', 'double', 'unsigned', 'boolean', 'var', 'let', 'auto']);
const show = (k) => (k.t === 'eof' ? '(end)' : k.t === 'nl' ? '(end of line)' : k.t === 'indent' || k.t === 'dedent' ? '(indent)' : k.t === 'str' ? '"' + k.v + '"' : String(k.text || k.v));

class Parser {
  constructor(toks) { this.k = toks; this.p = 0; this.loops = 0; this.funcs = 0; }
  get tok() { return this.k[this.p]; }
  peek(d = 1) { return this.k[this.p + d] || this.k[this.k.length - 1]; }
  next() { return this.k[this.p++]; }
  is(v, t = 'op') { const k = this.tok; return k.t === t && k.v === v; }
  isKw(v) { const k = this.tok; return k.t === 'name' && k.v === v; }
  eat(v) { if (this.is(v) || this.isKw(v)) { this.p++; return true; } return false; }
  fail(code, args, k) { throw new SynErr(code, (k || this.tok).line, args); }
  expect(v) { if (this.eat(v)) return; const k = this.tok; if (k.t === 'nl' || k.t === 'eof') this.fail('P_EOL', { after: show(this.k[this.p - 1] || k) }); this.fail('P_EXPECTED', { want: v, got: show(k) }); }
  name() { const k = this.tok; if (k.t !== 'name') this.fail('P_EXPECTED', { want: t3('a name', 'कोई नाम', 'koi naam'), got: show(k) }); if (k.kw) this.fail('P_KEYWORD', { name: k.v }); this.p++; return k.v; }
  program() {
    const body = [];
    while (this.tok.t !== 'eof') { if (this.tok.t === 'nl') { this.p++; continue; } if (this.tok.t === 'indent') this.fail('P_INDENT', {}, this.tok); body.push(...this.stmt()); }
    return body;
  }
  // the block after a ':'
  suite(word, line) {
    if (this.tok.t !== 'nl') { if (this.tok.t === 'eof') this.fail('P_NEED_INDENT', { w: word, at: line }); return this.simple(); }
    this.p++;
    while (this.tok.t === 'nl') this.p++;
    if (this.tok.t !== 'indent') this.fail('P_NEED_INDENT', { w: word, at: line }, this.tok.t === 'eof' ? this.k[this.p - 1] : this.tok);
    this.p++; const body = [];
    while (this.tok.t !== 'dedent' && this.tok.t !== 'eof') { if (this.tok.t === 'nl') { this.p++; continue; } if (this.tok.t === 'indent') this.fail('P_INDENT', {}); body.push(...this.stmt()); }
    if (this.tok.t === 'dedent') this.p++;
    return body;
  }
  colon(word) {
    if (this.is(':')) { this.p++; return; }
    const k = this.tok;
    if (this.is('=')) this.fail('P_EQ_IF', {});
    if (this.is('{')) this.fail('P_BRACE', {});
    if (k.t === 'nl' || k.t === 'eof') this.fail('P_COLON', { w: word }, this.k[this.p - 1]);
    if (word === 'else' && this.isKw('if')) this.fail('P_ELSEIF', {});
    this.fail('P_EXPECTED', { want: ':', got: show(k) });
  }
  stmt() {
    const k = this.tok;
    if (k.t === 'dedent') { this.p++; return []; }
    if (k.t === 'name' && k.kw) {
      const line = k.line;
      switch (k.v) {
        case 'if': {
          this.p++; const tests = []; let c = this.test(); this.colon('if'); tests.push([c, this.suite('if', line)]); let orelse = null;
          for (;;) {
            if (this.isKw('elif')) { const l2 = this.tok.line; this.p++; c = this.test(); this.colon('elif'); tests.push([c, this.suite('elif', l2)]); continue; }
            if (this.isKw('else')) { const l2 = this.tok.line; this.p++; this.colon('else'); orelse = this.suite('else', l2); }
            break;
          }
          return [{ k: 'if', tests, orelse, line }];
        }
        case 'while': {
          this.p++; const c = this.test(); this.colon('while'); this.loops++; const body = this.suite('while', line); this.loops--;
          let orelse = null; if (this.isKw('else')) { const l2 = this.tok.line; this.p++; this.colon('else'); orelse = this.suite('else', l2); }
          return [{ k: 'while', c, body, orelse, line }];
        }
        case 'for': {
          this.p++; const target = this.targetList(); if (!this.isKw('in')) this.fail('P_EXPECTED', { want: 'in', got: show(this.tok) }); this.p++;
          const iter = this.testList(); this.colon('for'); this.loops++; const body = this.suite('for', line); this.loops--;
          let orelse = null; if (this.isKw('else')) { const l2 = this.tok.line; this.p++; this.colon('else'); orelse = this.suite('else', l2); }
          return [{ k: 'for', target, iter, body, orelse, line }];
        }
        case 'def': {
          this.p++; const name = this.name(); this.expect('('); const params = this.params(')', name); this.expect(')');
          if (this.eat('->')) this.test();
          this.colon('def'); const saved = this.loops; this.loops = 0; this.funcs++; const body = this.suite('def', line); this.funcs--; this.loops = saved;
          return [{ k: 'def', name, params, body, line }];
        }
        case 'try': {
          this.p++; this.colon('try'); const body = this.suite('try', line); const handlers = []; let orelse = null, fin = null;
          while (this.isKw('except')) {
            const l2 = this.tok.line; this.p++; let types = null, as = null;
            if (!this.is(':')) { types = this.test(); if (this.eat('as')) as = this.name(); else if (this.eat(',')) as = this.name(); }
            this.colon('except'); handlers.push({ types, as, body: this.suite('except', l2), line: l2 });
          }
          if (this.isKw('else')) { const l2 = this.tok.line; this.p++; this.colon('else'); orelse = this.suite('else', l2); }
          if (this.isKw('finally')) { const l2 = this.tok.line; this.p++; this.colon('finally'); fin = this.suite('finally', l2); }
          if (!handlers.length && !fin) this.fail('P_EXPECTED', { want: 'except', got: show(this.tok) });
          return [{ k: 'try', body, handlers, orelse, fin, line }];
        }
        case 'elif': case 'else': this.fail('P_ELSE', { w: k.v, need: 'if' }); break;
        case 'except': case 'finally': this.fail('P_ELSE', { w: k.v, need: 'try' }); break;
        case 'class': this.fail('P_UNSUPPORTED', { what: t3('class (making your own types)', 'class (अपने टाइप बनाना)', 'class (apne types banana)') }); break;
        case 'with': { // batch 20: with open(…) as f:  (a context manager: its exit runs however the block ends)
          this.p++; const items = [];
          do { const e = this.test(); const as = this.eat('as') ? this.target(this.bitor()) : null; items.push({ e, as }); } while (this.eat(','));
          this.colon('with'); const body = this.suite('with', line);
          return [{ k: 'with', items, body, line }];
        }
        case 'async': case 'await': case 'yield': this.fail('P_UNSUPPORTED', { what: k.v }); break;
      }
    }
    if (this.is('@')) { // batch 20: decorators (@app.route("/") above a def): name = deco(function)
      const decos = [];
      while (this.is('@')) { this.p++; decos.push(this.test()); if (this.tok.t !== 'nl') this.fail('P_SYNTAX', { got: show(this.tok) }); this.p++; }
      if (!this.isKw('def')) this.fail('P_EXPECTED', { want: 'def', got: show(this.tok) });
      const d = this.stmt(); d[0].decos = decos; return d;
    }
    if (this.is('}')) this.fail('P_BRACE', {});
    return this.simple();
  }
  simple() {
    const out = [];
    for (;;) {
      out.push(this.small());
      if (this.eat(';')) { if (this.tok.t === 'nl' || this.tok.t === 'eof') break; continue; }
      break;
    }
    const k = this.tok;
    if (k.t === 'nl') this.p++;
    else if (k.t !== 'eof' && k.t !== 'dedent') {
      if (this.is('{')) this.fail('P_BRACE', {});
      const prev = this.k[this.p - 1];
      if (prev && prev.t === 'name' && TYPEWORDS.has(prev.v) && k.t === 'name') this.fail('P_TYPE_DECL', { type: prev.v, name: k.v });
      if (prev && prev.t === 'name' && !prev.kw && k.t === 'name' && TYPEWORDS.has(this.k[this.p - 2] && this.k[this.p - 2].v)) this.fail('P_TYPE_DECL', { type: this.k[this.p - 2].v, name: k.v });
      this.fail('P_SYNTAX', { got: show(k) });
    }
    return out;
  }
  small() {
    const k = this.tok, line = k.line;
    if (k.t === 'name' && k.kw) {
      switch (k.v) {
        case 'pass': this.p++; return { k: 'pass', line };
        case 'break': case 'continue': this.p++; if (!this.loops) this.fail('P_OUTSIDE', { w: k.v, where: t3('a loop (for / while)', 'लूप (for / while)', 'loop (for / while)') }, k); return { k: k.v, line };
        case 'return': { this.p++; if (!this.funcs) this.fail('P_OUTSIDE', { w: 'return', where: t3('a def', 'def', 'def') }, k); const e = this.tok.t === 'nl' || this.tok.t === 'eof' || this.is(';') ? null : this.testList(); return { k: 'return', e, line }; }
        case 'global': case 'nonlocal': { this.p++; const names = [this.name()]; while (this.eat(',')) names.push(this.name()); return { k: k.v, names, line }; }
        case 'import': { this.p++; const names = []; do { const mod = this.dotted(); const as = this.eat('as') ? this.name() : null; names.push([mod, as]); } while (this.eat(',')); return { k: 'import', names, line }; }
        case 'from': {
          this.p++; const mod = this.dotted(); if (!this.isKw('import')) this.fail('P_EXPECTED', { want: 'import', got: show(this.tok) }); this.p++;
          if (this.eat('*')) { if (this.funcs) this.fail('P_STAR_IMPORT', {}, k); return { k: 'from', mod, star: true, line }; }
          const par = this.eat('('); const names = [];
          do { if (par && this.is(')')) break; const n = this.name(); names.push([n, this.eat('as') ? this.name() : null]); } while (this.eat(','));
          if (par) this.expect(')');
          return { k: 'from', mod, names, line };
        }
        case 'del': { this.p++; const targets = [this.target(this.expr())]; while (this.eat(',')) targets.push(this.target(this.expr())); return { k: 'del', targets, line }; }
        case 'assert': { this.p++; const test = this.test(); const m = this.eat(',') ? this.test() : null; return { k: 'assert', test, m, line }; }
        case 'raise': { this.p++; const e = this.tok.t === 'nl' || this.tok.t === 'eof' ? null : this.test(); if (this.eat('from')) this.test(); return { k: 'raise', e, line }; }
      }
    }
    const e = this.testList(true);
    if (this.is('=')) {
      const targets = [this.target(e)]; let value;
      for (;;) { this.p++; value = this.testList(true); if (!this.is('=')) break; targets.push(this.target(value)); }
      return { k: 'assign', targets, value, line };
    }
    if (this.tok.t === 'op' && AUG[this.tok.v]) {
      const op = AUG[this.next().v]; const target = this.target(e);
      if (target.k === 'tuple' || target.k === 'list') this.fail('P_ASSIGN', { what: t3('a list of names', 'नामों की लिस्ट', 'naamon ki list') });
      return { k: 'aug', op, target, value: this.testList(), line };
    }
    if (this.is(':') && e.k === 'name') this.fail('P_UNSUPPORTED', { what: t3('type hints (name: type)', 'टाइप हिंट (name: type)', 'type hints (name: type)') });
    return { k: 'expr', e, line };
  }
  dotted() { let n = this.name(); while (this.eat('.')) n += '.' + this.name(); return n; }
  // a place a value can be put: a name, x.attr, x[i], or a tuple / list of these
  target(e) {
    switch (e.k) {
      case 'name': if (e.id === 'True' || e.id === 'False' || e.id === 'None') break; return e;
      case 'attr': case 'sub': return e;
      case 'tuple': case 'list': e.items.forEach((x) => this.target(x)); return e;
    }
    const what = e.k === 'num' ? t3('a number', 'संख्या', 'number') : e.k === 'str' || e.k === 'fstr' ? t3('a text in quotes', 'quotes वाले टेक्स्ट', 'quotes wale text') : e.k === 'call' ? t3('a function call', 'फ़ंक्शन कॉल', 'function call') : e.k === 'cmp' ? t3('a comparison (did you mean == ?)', 'तुलना (क्या आप == लिखना चाहते थे?)', 'comparison (kya aap == likhna chahte the?)') : t3('this', 'इस', 'is');
    throw new SynErr('P_ASSIGN', e.line, { what });
  }
  targetList() { // for x in … / for i, v in …
    const first = this.target(this.bitor()); if (!this.is(',')) return first;
    const items = [first]; while (this.eat(',')) { if (this.isKw('in')) break; items.push(this.target(this.bitor())); }
    return { k: 'tuple', items, line: first.line };
  }
  params(close, fname) {
    const params = []; let seenDef = false; const names = new Set();
    while (!this.is(close)) {
      if (this.is('*') || this.is('**')) this.fail('P_UNSUPPORTED', { what: t3('*args and **kwargs', '*args और **kwargs', '*args aur **kwargs') });
      const name = this.name(); if (names.has(name)) this.fail('P_DUP_ARG', { name, fn: fname }); names.add(name);
      let def = null; if (this.eat('=')) { def = this.test(); seenDef = true; } else if (seenDef) this.fail('P_DEFAULT_ORDER', {});
      if (close === ')' && this.eat(':')) this.test(); // a type hint (name: int) is read and left out
      params.push({ name, def });
      if (!this.eat(',')) break;
    }
    return params;
  }
  // ---------------------------------------------------------------- expressions
  testList(allowTuple) {
    const first = this.test(); if (!this.is(',')) return first;
    const items = [first];
    while (this.eat(',')) { if (this.tok.t === 'nl' || this.tok.t === 'eof' || this.is('=') || this.is(')') || this.is(';') || this.is(':') || (this.tok.t === 'op' && AUG[this.tok.v])) break; items.push(this.test()); }
    void allowTuple; return { k: 'tuple', items, line: first.line };
  }
  test() {
    if (this.isKw('lambda')) { const line = this.tok.line; this.p++; const params = this.params(':', 'lambda'); this.expect(':'); this.funcs++; const body = this.test(); this.funcs--; return { k: 'lambda', params, body, line }; }
    const c = this.orTest();
    if (this.isKw('if') ) { this.p++; const cond = this.orTest(); if (!this.isKw('else')) this.fail('P_EXPECTED', { want: 'else', got: show(this.tok) }); this.p++; const b = this.test(); return { k: 'ifx', c: cond, a: c, b, line: c.line }; }
    if (this.is(':=')) this.fail('P_UNSUPPORTED', { what: ':=' });
    return c;
  }
  orTest() { let a = this.andTest(); if (!this.isKw('or')) return a; const vals = [a]; while (this.eat('or')) vals.push(this.andTest()); return { k: 'bool', op: 'or', vals, line: a.line }; }
  andTest() { let a = this.notTest(); if (!this.isKw('and')) return a; const vals = [a]; while (this.eat('and')) vals.push(this.notTest()); return { k: 'bool', op: 'and', vals, line: a.line }; }
  notTest() { if (this.isKw('not')) { const line = this.tok.line; this.p++; return { k: 'not', a: this.notTest(), line }; } return this.comparison(); }
  comparison() {
    const a = this.bitor(); const ops = [], vals = [a];
    for (;;) {
      const k = this.tok; let op = null;
      if (k.t === 'op' && CMPOP[k.v]) { op = CMPOP[k.v]; this.p++; }
      else if (this.isKw('in')) { op = 'in'; this.p++; }
      else if (this.isKw('not') && this.peek().t === 'name' && this.peek().v === 'in') { op = 'notin'; this.p += 2; }
      else if (this.isKw('is')) { this.p++; op = this.eat('not') ? 'isnot' : 'is'; }
      else break;
      ops.push(op); vals.push(this.bitor());
    }
    return ops.length ? { k: 'cmp', ops, vals, line: a.line } : a;
  }
  binLevel(next, ops) { let a = next(); while (this.tok.t === 'op' && ops.includes(this.tok.v)) { const op = this.next().v; const b = next(); a = { k: 'bin', op: BIN[op], a, b, sym: op, line: a.line }; } return a; }
  bitor() { return this.binLevel(() => this.bitxor(), ['|']); }
  bitxor() { return this.binLevel(() => this.bitand(), ['^']); }
  bitand() { return this.binLevel(() => this.shift(), ['&']); }
  shift() { return this.binLevel(() => this.arith(), ['<<', '>>']); }
  arith() { return this.binLevel(() => this.term(), ['+', '-']); }
  term() { return this.binLevel(() => this.factor(), ['*', '/', '//', '%', '@']); }
  factor() {
    const k = this.tok;
    if (k.t === 'op' && (k.v === '-' || k.v === '+' || k.v === '~')) {
      this.p++; const a = this.factor();
      if (k.v === '-' && a.k === 'num') return { k: 'num', v: -a.v, f: a.f, line: k.line };
      return { k: 'un', op: k.v === '-' ? 'neg' : k.v === '+' ? 'pos' : 'inv', a, line: k.line };
    }
    return this.power();
  }
  power() { const a = this.atomExpr(); if (this.is('**')) { this.p++; const b = this.factor(); return { k: 'bin', op: 'pow', a, b, sym: '**', line: a.line }; } return a; }
  atomExpr() {
    let e = this.atom();
    for (;;) {
      if (this.is('(')) { this.p++; const [args, kw] = this.callArgs(); this.expect(')'); e = { k: 'call', f: e, args, kw, line: e.line }; continue; }
      if (this.is('[')) { this.p++; const ix = this.subscript(); this.expect(']'); e = { k: 'sub', o: e, ix, line: e.line }; continue; }
      if (this.is('.')) { this.p++; const k = this.tok; if (k.t !== 'name') this.fail('P_EXPECTED', { want: t3('a name after "."', '"." के बाद कोई नाम', '"." ke baad koi naam'), got: show(k) }); this.p++; e = { k: 'attr', o: e, name: k.v, line: e.line }; continue; }
      return e;
    }
  }
  callArgs() {
    const args = [], kw = [];
    while (!this.is(')')) {
      if (this.is('*') || this.is('**')) this.fail('P_UNSUPPORTED', { what: t3('* and ** in a call', 'कॉल में * और **', 'call mein * aur **') });
      if (this.tok.t === 'name' && !this.tok.kw && this.peek().t === 'op' && this.peek().v === '=') { const n = this.next().v; this.p++; kw.push([n, this.test()]); }
      else { if (kw.length) this.fail('P_ARG_ORDER', {}); let a = this.test(); if (this.isKw('for')) a = this.compTail('list', a); args.push(a); }
      if (!this.eat(',')) break;
    }
    return [args, kw];
  }
  subscript() {
    const one = () => {
      let lo = null, hi = null, st = null;
      if (!this.is(':')) { lo = this.test(); if (!this.is(':')) return lo; }
      this.p++; if (!this.is(']') && !this.is(':') && !this.is(',')) hi = this.test();
      if (this.eat(':')) { if (!this.is(']') && !this.is(',')) st = this.test(); }
      return { k: 'slice', lo, hi, st, line: this.tok.line };
    };
    const a = one(); if (!this.is(',')) return a;
    const items = [a]; while (this.eat(',')) { if (this.is(']')) break; items.push(one()); }
    return { k: 'tuple', items, line: a.line };
  }
  atom() {
    const k = this.tok;
    switch (k.t) {
      case 'num': this.p++; return { k: 'num', v: k.v, f: k.f, line: k.line };
      case 'str': {
        const parts = []; let any = false;
        while (this.tok.t === 'str') { const s = this.next(); if (s.f) { any = true; parts.push(...fparts(s)); } else parts.push(s.v); }
        if (!any) return { k: 'str', v: parts.join(''), line: k.line };
        return { k: 'fstr', parts, line: k.line };
      }
      case 'name': {
        if (k.v === 'None' || k.v === 'True' || k.v === 'False') { this.p++; return { k: 'const', v: k.v === 'None' ? null : k.v === 'True', line: k.line }; }
        if (k.kw) {
          if (k.v === 'lambda') return this.test();
          this.fail('P_SYNTAX', { got: k.v });
        }
        this.p++; return { k: 'name', id: k.v, line: k.line };
      }
      case 'op': {
        if (k.v === '(') {
          this.p++; if (this.eat(')')) return { k: 'tuple', items: [], line: k.line };
          const first = this.test();
          if (this.isKw('for')) { const c = this.compTail('list', first); this.expect(')'); return c; }
          if (this.eat(')')) { first.paren = true; return first; }
          const items = [first]; while (this.eat(',')) { if (this.is(')')) break; items.push(this.test()); }
          this.expect(')'); return { k: 'tuple', items, line: k.line };
        }
        if (k.v === '[') {
          this.p++; if (this.eat(']')) return { k: 'list', items: [], line: k.line };
          const first = this.test();
          if (this.isKw('for')) { const c = this.compTail('list', first); this.expect(']'); return c; }
          const items = [first]; while (this.eat(',')) { if (this.is(']')) break; items.push(this.test()); }
          this.expect(']'); return { k: 'list', items, line: k.line };
        }
        if (k.v === '{') {
          this.p++; const keys = [], vals = [];
          if (this.eat('}')) return { k: 'dict', keys, vals, line: k.line };
          const k0 = this.test(); if (!this.is(':')) this.fail('P_UNSUPPORTED', { what: t3('sets { }', 'सेट { }', 'sets { }') });
          this.p++; const v0 = this.test(); if (this.isKw('for')) this.fail('P_UNSUPPORTED', { what: t3('dictionary comprehensions', 'डिक्शनरी कॉम्प्रिहेंशन', 'dictionary comprehensions') });
          keys.push(k0); vals.push(v0);
          while (this.eat(',')) { if (this.is('}')) break; keys.push(this.test()); this.expect(':'); vals.push(this.test()); }
          this.expect('}'); return { k: 'dict', keys, vals, line: k.line };
        }
        if (k.v === '...') { this.p++; return { k: 'const', v: null, line: k.line }; }
        break;
      }
      case 'nl': case 'eof': this.fail('P_EOL', { after: show(this.k[this.p - 1] || k) }, this.k[this.p - 1] || k); break;
      case 'indent': this.fail('P_INDENT', {}); break;
    }
    if (k.t === 'op' && k.v === '}') this.fail('P_BRACE', {});
    this.fail('P_SYNTAX', { got: show(k) });
  }
  compTail(kind, elt) {
    const gens = [];
    while (this.isKw('for')) {
      this.p++; const target = this.targetList(); if (!this.isKw('in')) this.fail('P_EXPECTED', { want: 'in', got: show(this.tok) }); this.p++;
      const iter = this.orTest(); const ifs = []; while (this.isKw('if')) { this.p++; ifs.push(this.orTest()); }
      gens.push({ target, iter, ifs });
    }
    return { k: 'comp', kind, elt, gens, line: elt.line };
  }
}
// an f-string's pieces: text and {expression[!r][:spec]}
function fparts(tok) {
  const s = tok.raw, out = []; let i = 0, lit = '';
  const unesc = (x) => x.replace(/\\(.)/g, (m, d) => (d in ESC ? ESC[d] : m));
  while (i < s.length) {
    const c = s[i];
    if (c === '{' && s[i + 1] === '{') { lit += '{'; i += 2; continue; }
    if (c === '}' && s[i + 1] === '}') { lit += '}'; i += 2; continue; }
    if (c === '{') {
      if (lit) { out.push(unesc(lit)); lit = ''; }
      let depth = 1, j = i + 1, q = null;
      for (; j < s.length; j++) { const d = s[j]; if (q) { if (d === q) q = null; continue; } if (d === '"' || d === "'") q = d; else if (d === '{' || d === '[' || d === '(') depth++; else if (d === '}' || d === ']' || d === ')') { depth--; if (!depth) break; } }
      if (j >= s.length) throw new SynErr('P_FSTRING', tok.line);
      let inner = s.slice(i + 1, j), spec = '', conv = '';
      let k = 0, d2 = 0, q2 = null; for (; k < inner.length; k++) { const d = inner[k]; if (q2) { if (d === q2) q2 = null; continue; } if (d === '"' || d === "'") q2 = d; else if ('([{'.includes(d)) d2++; else if (')]}'.includes(d)) d2--; else if (d === ':' && !d2) break; else if (d === '!' && !d2 && inner[k + 1] !== '=') break; }
      const head = inner.slice(0, k); let rest = inner.slice(k);
      if (rest.startsWith('!')) { conv = rest[1]; rest = rest.slice(2); }
      if (rest.startsWith(':')) spec = rest.slice(1);
      if (!head.trim()) throw new SynErr('P_FSTRING', tok.line);
      let e; try { const toks = lex(head.trim()); toks.forEach((t) => { t.line = tok.line; }); const p = new Parser(toks); e = p.testList(); if (p.tok.t !== 'nl' && p.tok.t !== 'eof') throw new SynErr('P_FSTRING', tok.line); }
      catch (err) { if (err instanceof SynErr) { err.line = tok.line; throw err; } throw err; }
      out.push({ e, spec, conv }); i = j + 1; continue;
    }
    if (c === '}') throw new SynErr('P_FSTRING', tok.line);
    if (c === '\\') { lit += s.slice(i, i + 2); i += 2; continue; }
    lit += c; i++;
  }
  if (lit) out.push(unesc(lit));
  return out;
}

// ------------------------------------------------------------------ code generation (the tree -> one JS generator function)
const J = (s) => JSON.stringify(s);
class Scope {
  constructor(kind, parent, params) { this.kind = kind; this.parent = parent; this.locals = new Set(params || []); this.params = new Set(params || []); this.globals = new Set(); this.nonlocals = new Set(); this.temps = 0; this.excs = []; }
}
// the names a function body assigns (they are its locals), not looking inside nested defs / lambdas
function assigned(body, out, decl) {
  const tgt = (t) => { if (!t) return; if (t.k === 'name') out.add(t.id); else if (t.k === 'tuple' || t.k === 'list') t.items.forEach(tgt); };
  for (const s of body) {
    switch (s.k) {
      case 'assign': s.targets.forEach(tgt); break;
      case 'aug': tgt(s.target); break;
      case 'for': tgt(s.target); assigned(s.body, out, decl); if (s.orelse) assigned(s.orelse, out, decl); break;
      case 'while': assigned(s.body, out, decl); if (s.orelse) assigned(s.orelse, out, decl); break;
      case 'if': for (const [, b] of s.tests) assigned(b, out, decl); if (s.orelse) assigned(s.orelse, out, decl); break;
      case 'try': assigned(s.body, out, decl); for (const h of s.handlers) { if (h.as) out.add(h.as); assigned(h.body, out, decl); } if (s.orelse) assigned(s.orelse, out, decl); if (s.fin) assigned(s.fin, out, decl); break;
      case 'def': out.add(s.name); break;
      case 'with': for (const it of s.items) tgt(it.as); assigned(s.body, out, decl); break;
      case 'import': for (const [m, as] of s.names) out.add(as || m.split('.')[0]); break;
      case 'from': if (s.names) for (const [n, as] of s.names) out.add(as || n); break;
      case 'del': s.targets.forEach(tgt); break;
      case 'global': case 'nonlocal': for (const n of s.names) decl.add(s.k + ':' + n); break;
    }
  }
}
class Gen {
  constructor() { this.consts = []; this.warnings = []; this.uses = new Set(); this.lbl = 0; }
  temp(sc) { const n = 't' + (++sc.temps); return n; }
  // ------------------------------------------------ names
  where(id, sc) { // 'g' (global) or 'l' (a JS local / closure variable)
    if (sc.kind === 'module') return 'g';
    if (sc.globals.has(id)) return 'g';
    for (let s = sc; s && s.kind !== 'module'; s = s.parent) { if (s.globals.has(id)) return 'g'; if (s.locals.has(id) || s.nonlocals.has(id)) return 'l'; }
    return 'g';
  }
  load(id, sc) {
    this.uses.add(id);
    if (this.where(id, sc) === 'g') return `(G[${J(id)}] !== undefined ? G[${J(id)}] : R.gb(${J(id)}, G))`;
    return `($${id} !== undefined ? $${id} : R.ub(${J(id)}))`;
  }
  store(id, sc, v) { return this.where(id, sc) === 'g' ? `G[${J(id)}] = ${v}` : `$${id} = ${v}`; }
  // ------------------------------------------------ expressions
  call(f, args, kw, sc) {
    const t = this.temp(sc);
    const kws = kw.length ? '{' + kw.map(([n, e]) => J(n) + ': ' + this.expr(e, sc)).join(', ') + '}' : 'null';
    return `(${t} = R.c(${f}, [${args.map((a) => this.expr(a, sc)).join(', ')}], ${kws}), ${t} instanceof R.P ? (yield* ${t}.g) : ${t})`;
  }
  expr(e, sc) {
    switch (e.k) {
      case 'num': if (e.f) { this.consts.push(e.v); return `C[${this.consts.length - 1}]`; } return String(e.v);
      case 'str': return J(e.v);
      case 'const': return e.v === null ? 'null' : String(e.v);
      case 'name': return this.load(e.id, sc);
      case 'bin': return `R.${e.op === undefined ? 'matmul' : e.op}(${this.expr(e.a, sc)}, ${this.expr(e.b, sc)})`;
      case 'un': return `R.${e.op}(${this.expr(e.a, sc)})`;
      case 'not': return `!R.T(${this.expr(e.a, sc)})`;
      case 'bool': {
        let code = this.expr(e.vals[e.vals.length - 1], sc);
        for (let i = e.vals.length - 2; i >= 0; i--) { const t = this.temp(sc); code = e.op === 'or' ? `(R.T(${t} = ${this.expr(e.vals[i], sc)}) ? ${t} : ${code})` : `(!R.T(${t} = ${this.expr(e.vals[i], sc)}) ? ${t} : ${code})`; }
        return code;
      }
      case 'cmp': {
        if (e.ops.length === 1) return `R.${e.ops[0]}(${this.expr(e.vals[0], sc)}, ${this.expr(e.vals[1], sc)})`;
        const ts = e.vals.map(() => this.temp(sc)); const parts = [];
        for (let i = 0; i < e.ops.length; i++) parts.push(`R.${e.ops[i]}(${i === 0 ? `(${ts[0]} = ${this.expr(e.vals[0], sc)})` : ts[i]}, (${ts[i + 1]} = ${this.expr(e.vals[i + 1], sc)}))`);
        return '(' + parts.join(' && ') + ')';
      }
      case 'ifx': return `(R.T(${this.expr(e.c, sc)}) ? ${this.expr(e.a, sc)} : ${this.expr(e.b, sc)})`;
      case 'call': {
        if (e.f.k === 'attr') { // a method: obj.name(…)
          const t = this.temp(sc); const kws = e.kw.length ? '{' + e.kw.map(([n, x]) => J(n) + ': ' + this.expr(x, sc)).join(', ') + '}' : 'null';
          return `(${t} = R.cm(${this.expr(e.f.o, sc)}, ${J(e.f.name)}, [${e.args.map((a) => this.expr(a, sc)).join(', ')}], ${kws}), ${t} instanceof R.P ? (yield* ${t}.g) : ${t})`;
        }
        return this.call(this.expr(e.f, sc), e.args, e.kw, sc);
      }
      case 'attr': return `R.ga(${this.expr(e.o, sc)}, ${J(e.name)})`;
      case 'sub': return `R.gi(${this.expr(e.o, sc)}, ${this.index(e.ix, sc)})`;
      case 'slice': return this.index(e, sc);
      case 'list': return `[${e.items.map((x) => this.expr(x, sc)).join(', ')}]`;
      case 'tuple': return `R.tup([${e.items.map((x) => this.expr(x, sc)).join(', ')}])`;
      case 'dict': return `R.dict([${e.keys.map((x) => this.expr(x, sc)).join(', ')}], [${e.vals.map((x) => this.expr(x, sc)).join(', ')}])`;
      case 'fstr': return `R.fs([${e.parts.map((p) => (typeof p === 'string' ? J(p) : `R.fv(${this.expr(p.e, sc)}, ${J(p.spec)}, ${J(p.conv)})`)).join(', ')}])`;
      case 'lambda': return this.func('<lambda>', e.params, [{ k: 'return', e: e.body, line: e.line }], sc, e.line);
      case 'comp': return this.comp(e, sc);
    }
    throw new SynErr('P_SYNTAX', e.line, { got: e.k });
  }
  index(ix, sc) { return ix.k === 'slice' ? `R.slice(${ix.lo ? this.expr(ix.lo, sc) : 'null'}, ${ix.hi ? this.expr(ix.hi, sc) : 'null'}, ${ix.st ? this.expr(ix.st, sc) : 'null'})` : this.expr(ix, sc); }
  comp(e, sc) {
    const cs = new Scope('comp', sc); const names = new Set(); const tg = (t) => { if (t.k === 'name') names.add(t.id); else if (t.items) t.items.forEach(tg); };
    for (const g of e.gens) tg(g.target); for (const n of names) cs.locals.add(n);
    const out = this.temp(cs);
    let body = `${out}.push(${this.expr(e.elt, cs)});`;
    for (let i = e.gens.length - 1; i >= 0; i--) {
      const g = e.gens[i]; const v = this.temp(cs);
      const conds = g.ifs.map((c) => `if (!R.T(${this.expr(c, cs)})) continue;`).join(' ');
      body = `for (const ${v} of R.it(${i === 0 ? '__ITER__' : this.expr(g.iter, cs)})) { if (R.k()) yield 0; ${this.assignTo(g.target, v, cs)} ${conds} ${body} }`;
    }
    const decl = [...[...names].map((n) => '$' + n), ...Array.from({ length: cs.temps }, (_, i) => 't' + (i + 1))];
    const iter0 = this.expr(e.gens[0].iter, sc); // the first iterable is evaluated outside (as Python does)
    return `(yield* (function* () { let ${decl.join(', ')}; ${out} = []; ${body.replace('__ITER__', () => iter0)} return ${out}; })())`;
  }
  // ------------------------------------------------ assignment
  assignTo(t, v, sc) {
    switch (t.k) {
      case 'name': return this.store(t.id, sc, v) + ';';
      case 'attr': return `R.sa(${this.expr(t.o, sc)}, ${J(t.name)}, ${v});`;
      case 'sub': return `R.si(${this.expr(t.o, sc)}, ${this.index(t.ix, sc)}, ${v});`;
      case 'tuple': case 'list': { const u = this.temp(sc); return `${u} = R.up(${v}, ${t.items.length}); ` + t.items.map((x, i) => this.assignTo(x, `${u}[${i}]`, sc)).join(' '); }
    }
    throw new SynErr('P_ASSIGN', t.line, { what: '?' });
  }
  // ------------------------------------------------ statements
  block(body, sc) { return body.map((s) => this.stmt(s, sc)).join('\n'); }
  stmt(s, sc) {
    const pre = `if (R.s(${s.line})) yield 0;`;
    switch (s.k) {
      case 'pass': return pre;
      case 'expr': {
        const e = s.e;
        if (e.k === 'cmp' && e.ops.length === 1 && e.ops[0] === 'eq') this.warnings.push({ code: 'P_W_COMPARE', line: s.line, args: {} });
        if (e.k === 'attr' || (e.k === 'name' && !e.paren)) this.warnings.push({ code: 'P_W_NOCALL', line: s.line, args: { name: e.k === 'attr' ? exprText(e) : e.id } });
        return `${pre} ${this.expr(e, sc)};`;
      }
      case 'assign': {
        if (s.targets.length === 1) return `${pre} ${this.assignTo(s.targets[0], this.expr(s.value, sc), sc)}`;
        const t = this.temp(sc); return `${pre} ${t} = ${this.expr(s.value, sc)}; ${s.targets.map((x) => this.assignTo(x, t, sc)).join(' ')}`;
      }
      case 'aug': {
        const op = s.op === 'add' ? 'iadd' : s.op; const t = s.target;
        if (t.k === 'name') return `${pre} ${this.store(t.id, sc, `R.${op}(${this.load(t.id, sc)}, ${this.expr(s.value, sc)})`)};`;
        if (t.k === 'attr') { const o = this.temp(sc); return `${pre} ${o} = ${this.expr(t.o, sc)}; R.sa(${o}, ${J(t.name)}, R.${op}(R.ga(${o}, ${J(t.name)}), ${this.expr(s.value, sc)}));`; }
        const o = this.temp(sc), k = this.temp(sc);
        return `${pre} ${o} = ${this.expr(t.o, sc)}; ${k} = ${this.index(t.ix, sc)}; R.si(${o}, ${k}, R.${op}(R.gi(${o}, ${k}), ${this.expr(s.value, sc)}));`;
      }
      case 'if': {
        let code = pre + ' ';
        s.tests.forEach(([c, b], i) => { code += `${i ? ' else ' : ''}if (R.T(${this.expr(c, sc)})) {\n${this.block(b, sc)}\n}`; });
        if (s.orelse) code += ` else {\n${this.block(s.orelse, sc)}\n}`;
        return code;
      }
      case 'while': {
        const lb = 'L' + (++this.lbl); sc.loops = sc.loops || []; sc.loops.push(s.orelse ? lb : null);
        const body = this.block(s.body, sc); sc.loops.pop();
        const loop = `${pre} for (;;) { if (R.k()) yield 0; if (!R.T(${this.expr(s.c, sc)})) break;\n${body} }`;
        return s.orelse ? `${lb}: { ${loop}\n${this.block(s.orelse, sc)} }` : loop;
      }
      case 'for': {
        const lb = 'L' + (++this.lbl); const v = this.temp(sc); sc.loops = sc.loops || []; sc.loops.push(s.orelse ? lb : null);
        const body = this.block(s.body, sc); sc.loops.pop();
        const loop = `${pre} for (const ${v} of R.it(${this.expr(s.iter, sc)})) { if (R.k()) yield 0; ${this.assignTo(s.target, v, sc)}\n${body} }`;
        return s.orelse ? `${lb}: { ${loop}\n${this.block(s.orelse, sc)} }` : loop;
      }
      case 'break': { const l = sc.loops && sc.loops[sc.loops.length - 1]; return `${pre} break${l ? ' ' + l : ''};`; }
      case 'continue': return `${pre} continue;`;
      case 'return': return `${pre} return ${s.e ? this.expr(s.e, sc) : 'null'};`;
      case 'def': {
        if (!s.decos || !s.decos.length) return `${pre} ${this.store(s.name, sc, this.func(s.name, s.params, s.body, sc, s.line))};`;
        const f = this.temp(sc), r = this.temp(sc); let code = `${pre} ${f} = ${this.func(s.name, s.params, s.body, sc, s.line)};`;
        for (const d of s.decos.slice().reverse()) code += ` ${f} = (${r} = R.c(${this.expr(d, sc)}, [${f}], null), ${r} instanceof R.P ? (yield* ${r}.g) : ${r});`;
        return `${code} ${this.store(s.name, sc, f)};`;
      }
      case 'with': {
        let code = pre; const ms = [];
        for (const it of s.items) { const m = this.temp(sc), v = this.temp(sc); ms.push(m); code += ` ${m} = ${this.expr(it.e, sc)}; ${v} = R.enter(${m});${it.as ? ' ' + this.assignTo(it.as, v, sc) : ''} try {`; }
        code += `\n${this.block(s.body, sc)}\n`;
        for (const m of ms.reverse()) code += `} finally { R.exit(${m}); }`;
        return code;
      }
      case 'global': for (const n of s.names) sc.globals.add(n); return pre;
      case 'nonlocal': return pre;
      case 'import': return pre + ' ' + s.names.map(([m, as]) => (as ? this.store(as, sc, `R.imp(${J(m)})`) : this.store(m.split('.')[0], sc, `R.imp(${J(m.split('.')[0])})`) + (m.includes('.') ? `; R.imp(${J(m)})` : '')) + ';').join(' ');
      case 'from': {
        if (s.star) { this.stars = this.stars || []; this.stars.push(s.mod); return `${pre} R.star(${J(s.mod)}, G);`; }
        const t = this.temp(sc);
        return `${pre} ${t} = R.imp(${J(s.mod)}); ` + s.names.map(([n, as]) => this.store(as || n, sc, `R.from(${t}, ${J(n)}, ${J(s.mod)})`) + ';').join(' ');
      }
      case 'del': return pre + ' ' + s.targets.map((t) => {
        if (t.k === 'name') return this.where(t.id, sc) === 'g' ? `R.delg(G, ${J(t.id)});` : `$${t.id} = undefined;`;
        if (t.k === 'sub') return `R.di(${this.expr(t.o, sc)}, ${this.index(t.ix, sc)});`;
        throw new SynErr('P_ASSIGN', s.line, { what: 'del' });
      }).join(' ');
      case 'assert': return `${pre} if (!R.T(${this.expr(s.test, sc)})) throw R.err('AssertionError', 'P_ASSERT', { m: ${s.m ? `R.str(${this.expr(s.m, sc)})` : '""'} });`;
      case 'raise': {
        if (s.e) return `${pre} throw R.raise(${this.expr(s.e, sc)});`;
        const cur = sc.excs[sc.excs.length - 1]; return cur ? `${pre} throw ${cur};` : `${pre} throw R.err('RuntimeError', 'P_RERAISE', {});`;
      }
      case 'try': {
        const ok = this.temp(sc), ex = this.temp(sc), x = this.temp(sc);
        let code = `${pre} ${ok} = false; try {\n`;
        if (s.handlers.length) {
          code += `try {\n${this.block(s.body, sc)}\n${ok} = true; } catch (${ex}) { ${x} = R.ex(${ex});\n`;
          sc.excs.push(ex);
          s.handlers.forEach((h, i) => {
            const cond = h.types ? `R.em(${x}, ${this.expr(h.types, sc)})` : 'true';
            code += `${i ? ' else ' : ''}if (${cond}) { ${h.as ? this.store(h.as, sc, `${x}.val`) + ';' : ''}\n${this.block(h.body, sc)}\n}`;
          });
          sc.excs.pop();
          code += ` else throw ${ex}; }\n`;
          if (s.orelse) code += `if (${ok}) {\n${this.block(s.orelse, sc)}\n}\n`;
        } else code += `${this.block(s.body, sc)}\n`;
        code += `}${s.fin ? ` finally {\n${this.block(s.fin, sc)}\n}` : ' finally {}'}`;
        return code;
      }
    }
    throw new SynErr('P_SYNTAX', s.line, { got: s.k });
  }
  func(name, params, body, sc, line) {
    const fs = new Scope('func', sc, params.map((p) => p.name));
    const loc = new Set(), decl = new Set(); assigned(body, loc, decl);
    for (const d of decl) { const [k, n] = d.split(':'); if (k === 'global') fs.globals.add(n); else { fs.nonlocals.add(n); } }
    for (const n of loc) if (!fs.globals.has(n) && !fs.nonlocals.has(n)) fs.locals.add(n);
    const code = this.block(body, fs);
    const locals = [...fs.locals].filter((n) => !fs.params.has(n)).map((n) => '$' + n);
    const temps = Array.from({ length: fs.temps }, (_, i) => 't' + (i + 1));
    const defs = params.filter((p) => p.def).map((p) => this.expr(p.def, sc));
    const all = [...locals, ...temps];
    return `R.fn(${J(name)}, ${J(params.map((p) => p.name))}, [${defs.join(', ')}], function* (${params.map((p) => '$' + p.name).join(', ')}) {${all.length ? ' let ' + all.join(', ') + ';' : ''}\n${code}\nreturn null; }, ${line})`;
  }
  module(body) {
    const sc = new Scope('module', null);
    const code = this.block(body, sc);
    const temps = Array.from({ length: sc.temps }, (_, i) => 't' + (i + 1));
    return `return function* main(R, G, C) {${temps.length ? ' let ' + temps.join(', ') + ';' : ''}\n${code}\n};`;
  }
}
function exprText(e) { return e.k === 'name' ? e.id : e.k === 'attr' ? exprText(e.o) + '.' + e.name : '…'; }

// ------------------------------------------------------------------ compile
// opts.known: names the board gives (for warnings); returns the same shape as cpp.js's compile
export function compile(src, opts = {}) {
  const info = { serial: /\bprint\s*\(/.test(String(src || '')), imports: [] };
  try {
    const toks = lex(src);
    const tree = new Parser(toks).program();
    for (const s of tree) { if (s.k === 'import') for (const [m] of s.names) info.imports.push(m); if (s.k === 'from') info.imports.push(s.mod); }
    const gen = new Gen(); const js = gen.module(tree);
    let main; try { main = new Function(js)(); } catch (err) { return { ok: false, errors: [{ code: 'P_INTERNAL', line: 1, args: { msg: String(err.message || err) } }], warnings: [], js }; }
    const C = gen.consts.map((v) => new Flt(v));
    return { ok: true, errors: [], warnings: gen.warnings.slice(0, 5), info, js, tree, prog: { main, C }, make: (host) => new Task({ main, C }, host, opts) };
  } catch (err) {
    if (err instanceof SynErr) return { ok: false, errors: [{ code: err.code, line: err.line, args: err.args, type: err.type }], warnings: [], info };
    return { ok: false, errors: [{ code: 'P_INTERNAL', line: 1, args: { msg: String((err && err.stack) || err) } }], warnings: [], info };
  }
}
export function parse(src) { return new Parser(lex(src)).program(); }

// ------------------------------------------------------------------ the runtime of one running program (R)
class Pend { constructor(g) { this.g = g; } }
const LIMIT = 48; // calls inside calls: a micro:bit runs out of stack at about this depth
export class Task {
  constructor(prog, host, opts) {
    this.host = host || {}; this.opts = opts || {};
    const R = this.R = new PyRT(this);
    this.G = Object.create(null); this.G.__name__ = '__main__';
    this.gen = prog.main(R, this.G, prog.C);
    this.done = false; this.err = null;
  }
  get t() { return this.R.t; } set t(v) { this.R.t = v; }
  get line() { return this.R.L; }
  // run until the virtual clock reaches `until` (µs), or the wall time is spent. -> 'ok' | 'wall' | 'done' | 'error'
  run(until, wallEnd = Infinity) {
    const R = this.R; if (this.done) return this.err ? 'error' : 'done';
    R.until = until; R.wallEnd = wallEnd; R.wallOut = false; const prev = CUR; CUR = R;
    try {
      while (R.t < until && !R.wallOut) { const r = this.gen.next(); if (r.done) { this.done = true; R.L = 0; return 'done'; } }
    } catch (e) {
      this.done = true;
      if (e instanceof PyErr) this.err = { type: e.type, code: e.code, args: e.args, line: e.line || R.L, val: e._val };
      else if (e instanceof RangeError) this.err = { type: 'RecursionError', code: 'P_RECURSION', args: {}, line: R.L };
      else this.err = { type: 'RuntimeError', code: 'P_INTERNAL', args: { msg: String((e && e.message) || e) }, line: R.L, js: e };
      return 'error';
    } finally { CUR = prev; }
    return R.wallOut ? 'wall' : 'ok';
  }
}
// what the generated code calls. Board modules get R too (R.task.host is the board).
export class PyRT {
  constructor(task) {
    this.task = task; this.host = task.host; this.t = 0; this.until = 0; this.wallEnd = Infinity; this.wallOut = false; this.L = 0; this.ops = 0; this.depth = 0;
    this.cost = task.opts.cost || 20; // µs of virtual time for one statement (MicroPython on a 64 MHz micro:bit)
    this.mods = Object.create(null); this.P = Pend; this.rnd = mulberry(task.opts.seed !== undefined ? task.opts.seed : (Math.random() * 4294967296) >>> 0);
  }
  s(line) { this.L = line; this.t += this.cost; if (this.t >= this.until) return true; if ((++this.ops & 127) === 0 && now() > this.wallEnd) { this.wallOut = true; return true; } return false; }
  k() { this.t += this.cost / 4; if (this.t >= this.until) return true; if ((++this.ops & 127) === 0 && now() > this.wallEnd) { this.wallOut = true; return true; } return false; }
  // wait (virtual time): the program pauses, the page goes on
  *sleep(ms) {
    const end = this.t + Math.max(0, ms) * 1000;
    while (this.t < end) { if (end <= this.until) { this.t = end; break; } this.t = this.until; yield 0; }
  }
  err(type, code, args) { return new PyErr(type, code, args, this.L); }
  T(v) { return truth(v); }
  str(v) { return str(v); }
  tup(a) { return tup(a); }
  dict(ks, vs) { const d = new Dict(); ks.forEach((k, i) => d.set(k, vs[i])); return d; }
  fn(name, params, defs, gen, line) { return new PyFn(name, params, defs, gen, line); }
  // names
  gb(name, G) { // a global that is not set: a builtin, or a NameError with a hint
    if (name in BUILTINS) return BUILTINS[name];
    const H = this.host;
    if (H.builtins && name in H.builtins) return H.builtins[name];
    if (H.hint) { const h = H.hint(name, G); if (h) throw this.err('NameError', h.code, h.args); }
    const pool = [...Object.keys(G), ...Object.keys(BUILTINS), ...(H.names ? H.names() : [])];
    const sg = NAME_HINTS[name] ? { s: NAME_HINTS[name], caps: false } : suggest(name, pool);
    throw this.err('NameError', 'P_NAME', Object.assign({ name }, sg || {}));
  }
  ub(name) { throw this.err('UnboundLocalError', 'P_UNBOUND', { name }); }
  delg(G, name) { if (!(name in G)) this.gb(name, G); delete G[name]; }
  // calls
  bind(f, args, kw) {
    const n = f.params.length, out = new Array(n);
    if (args.length > n) throw this.err('TypeError', 'P_ARGS', { name: f.name, need: n, got: args.length });
    for (let i = 0; i < args.length; i++) out[i] = args[i];
    if (kw) for (const k in kw) {
      const j = f.params.indexOf(k);
      if (j < 0) { const sg = suggest(k, f.params); throw this.err('TypeError', 'P_KWARG', Object.assign({ name: f.name, kw: k }, sg || {})); }
      if (j < args.length) throw this.err('TypeError', 'P_DUP_VALUE', { name: f.name, param: k });
      out[j] = kw[k];
    }
    const d0 = n - f.defs.length;
    for (let i = args.length; i < n; i++) if (out[i] === undefined) {
      const d = f instanceof Nat ? f.defs[i] : i >= d0 ? f.defs[i - d0] : NODEF;
      if (d === NODEF) throw this.err('TypeError', 'P_MISSING', { name: f.name, param: f.params[i] });
      out[i] = d;
    }
    return out;
  }
  c(f, args, kw) {
    if (f instanceof PyFn) {
      const vals = this.bind(f, args, kw);
      if (this.depth >= LIMIT) throw this.err('RuntimeError', 'P_RECURSION', {});
      return new Pend(this.run(f, vals));
    }
    if (f instanceof Nat) {
      const r = f.star ? f.fn(this, args, kw) : f.fn(this, ...this.bind(f, args, kw));
      return f.blocking ? new Pend(r) : r;
    }
    if (f instanceof ExcType) return new PyExc(f, args, null);
    if (f && f.pyCall) { const r = f.pyCall(this, args, kw); return r instanceof Pend ? r : r; }
    if (f === null || f === undefined) throw this.err('TypeError', 'P_NONE_CALL', {});
    throw this.err('TypeError', 'P_NOT_CALLABLE', { t: typeName(f) });
  }
  *run(f, vals) { const L = this.L; this.depth++; try { return yield* f.gen(...vals); } finally { this.depth--; this.L = L; } }
  // call a Python value from JavaScript (sorted(key=…), map(…)): a generator
  *callv(f, args) { const r = this.c(f, args, null); return r instanceof Pend ? yield* r.g : r; }
  cm(o, name, args, kw) { // obj.name(…)
    const m = METHODS[typeof o === 'string' ? 'str' : o instanceof Tup ? 'tuple' : Array.isArray(o) ? 'list' : o instanceof Dict ? 'dict' : ''];
    if (m && m[name]) { const f = m[name]; const r = f.star ? f.fn(this, o, args, kw) : f.fn(this, o, ...this.bind(f, args, kw)); return f.blocking ? new Pend(r) : r; }
    return this.c(this.ga(o, name), args, kw);
  }
  ga(o, name) {
    if (o instanceof Mod) { const v = o.attrs[name]; if (v !== undefined) return v; throw this.err('AttributeError', 'P_ATTR', Object.assign({ obj: `module "${o.name}"`, name }, suggest(name, Object.keys(o.attrs)) || {})); }
    if (o && o.pyGet) { const v = o.pyGet(name, this); if (v !== undefined) return v; throw this.err('AttributeError', 'P_ATTR', Object.assign({ obj: o.pyName || typeName(o), name }, (o.pyNames && suggest(name, o.pyNames())) || {})); }
    const tn = typeof o === 'string' ? 'str' : o instanceof Tup ? 'tuple' : Array.isArray(o) ? 'list' : o instanceof Dict ? 'dict' : '';
    const m = METHODS[tn]; if (m && m[name]) { const f = m[name]; return new Nat(name, f.star ? '*' : f.params.map((p, i) => (f.defs[i] === NODEF ? p : p + '=_')), (R, ...a) => (f.star ? f.fn(R, o, ...a) : f.fn(R, o, ...a)), { blocking: f.blocking, defs: Object.fromEntries(f.params.map((p, i) => [p, f.defs[i]])) }); }
    if (o instanceof PyExc && name === 'args') return tup(o.args);
    if (o instanceof Flt && (name === 'real')) return o;
    throw this.err('AttributeError', 'P_ATTR', Object.assign({ obj: typeName(o), name }, (m && suggest(name, Object.keys(m))) || {}));
  }
  enter(o) { if (o && o.pyEnter) return o.pyEnter(this); if (o && o.pyGet) throw this.err('AttributeError', 'P_NOT_CTX', { t: o.pyName || typeName(o) }); throw this.err('TypeError', 'P_NOT_CTX', { t: typeName(o) }); } // batch 20: with
  exit(o) { if (o && o.pyExit) o.pyExit(this); }
  sa(o, name, v) { if (o && o.pySet && o.pySet(name, v, this)) return; throw this.err('AttributeError', 'P_ATTR_SET', { obj: o && o.pyName ? o.pyName : typeName(o), name }); }
  // [ ]
  gi(o, k) {
    if (k instanceof Slice) return k.get(o, this);
    if (Array.isArray(o)) return o[idx(k, o.length, typeName(o))];
    if (typeof o === 'string') return o[idx(k, o.length, 'str')];
    if (o instanceof Dict) { const v = o.get(k); if (v === undefined) throw this.err('KeyError', 'P_KEY', { key: repr(k) }); return v; }
    if (o instanceof Rng) return o.at(idx(k, o.length, 'range'));
    if (o && o.pyGetItem) return o.pyGetItem(k, this);
    throw this.err('TypeError', 'P_NOT_SUB', { t: typeName(o) });
  }
  si(o, k, v) {
    if (Array.isArray(o) && !(o instanceof Tup)) { if (k instanceof Slice) { k.set(o, v, this); return; } o[idx(k, o.length, 'list')] = v; return; }
    if (o instanceof Dict) { o.set(k, v); return; }
    if (o && o.pySetItem) { o.pySetItem(k, v, this); return; }
    throw this.err('TypeError', o instanceof Tup || typeof o === 'string' ? 'P_IMMUTABLE' : 'P_NOT_SUB', { t: typeName(o) });
  }
  di(o, k) {
    if (Array.isArray(o) && !(o instanceof Tup)) { if (k instanceof Slice) { k.set(o, [], this); return; } o.splice(idx(k, o.length, 'list'), 1); return; }
    if (o instanceof Dict) { if (!o.del(k)) throw this.err('KeyError', 'P_KEY', { key: repr(k) }); return; }
    throw this.err('TypeError', 'P_NOT_SUB', { t: typeName(o) });
  }
  slice(a, b, c) { return new Slice(a, b, c); }
  up(v, n) { // a, b = v
    const items = this.list(v);
    if (items.length !== n) throw this.err('ValueError', 'P_UNPACK', { got: items.length, need: n });
    return items;
  }
  list(v) { if (Array.isArray(v)) return v; return [...this.it(v)]; }
  // for … in …: a JS iterable
  it(v) {
    if (Array.isArray(v)) return liveIter(v);
    if (v instanceof Rng || typeof v === 'string') return v;
    if (v instanceof Dict) return v.keys();
    if (v && v.pyIter) return v.pyIter(this);
    throw this.err('TypeError', 'P_NOT_ITER', { t: typeName(v) });
  }
  // f-strings
  fs(parts) { return parts.join(''); }
  fv(v, spec, conv) { return conv === 'r' ? fmtSpec(repr(v), spec) : spec ? fmtSpec(v, spec) : str(v); }
  // import
  imp(name) {
    if (this.mods[name]) return this.mods[name];
    const H = this.host; let m = null;
    if (H.modules && H.modules[name]) m = H.modules[name](this);
    else if (CORE_MODS[name]) m = CORE_MODS[name](this);
    if (!m) { const pool = [...Object.keys(CORE_MODS), ...Object.keys(H.modules || {})]; throw this.err('ImportError', 'P_IMPORT', Object.assign({ name }, suggest(name, pool) || {})); }
    return (this.mods[name] = m);
  }
  from(m, name, mod) { const v = m instanceof Mod ? m.attrs[name] : undefined; if (v === undefined) throw this.err('ImportError', 'P_IMPORT_NAME', Object.assign({ mod, name }, suggest(name, Object.keys(m.attrs || {})) || {})); return v; }
  star(mod, G) { const m = this.imp(mod); for (const k of Object.keys(m.attrs)) if (!k.startsWith('_')) G[k] = m.attrs[k]; }
  // exceptions
  ex(e) { if (e instanceof PyErr) return e; throw e; }
  em(e, types) { // does the error match except <types>?
    const list = types instanceof Tup || Array.isArray(types) ? types : [types];
    for (const T of list) {
      if (!(T instanceof ExcType)) throw this.err('TypeError', 'P_EXCEPT_TYPE', {});
      for (let x = EXC[e.type] || EXC.Exception; x; x = x.base) if (x === T) return true;
      if (e.exc && e.exc.type) for (let x = e.exc.type; x; x = x.base) if (x === T) return true;
    }
    return false;
  }
  raise(v) {
    if (v instanceof ExcType) v = new PyExc(v, [], null);
    if (!(v instanceof PyExc)) return this.err('TypeError', 'P_RAISE_TYPE', {});
    const e = new PyErr(v.type.name, 'P_RAISED', { type: v.type.name, msg: v.args.length ? str(v.args.length === 1 ? v.args[0] : tup(v.args)) : '' }, this.L);
    e.exc = v; e._val = v; return e;
  }
  print(s) { if (this.host.print) this.host.print(s, this); }
}
Object.assign(PyRT.prototype, OPS);
PyRT.prototype.iadd = function (a, b) { if (Array.isArray(a) && !(a instanceof Tup)) { const items = this.list(b); big(a.length + items.length); a.push(...items); return a; } return OPS.add(a, b); };
PyRT.prototype.matmul = function () { throw this.err('TypeError', 'P_TYPE_OP', { op: '@', a: '?', b: '?' }); };
function* liveIter(a) { for (let i = 0; i < a.length; i++) yield a[i]; } // a list changed while the loop runs is seen as Python sees it
class Slice {
  constructor(a, b, c) { this.a = a; this.b = b; this.c = c; }
  range(n) {
    const st = this.c === null ? 1 : intOf(this.c, 'slice'); if (st === 0) throw perr('ValueError', 'P_SLICE_STEP', {});
    const norm = (v, d) => { if (v === null) return d; let i = intOf(v, 'slice'); if (i < 0) i += n; return st > 0 ? Math.max(0, Math.min(n, i)) : Math.max(-1, Math.min(n - 1, i)); };
    const a = norm(this.a, st > 0 ? 0 : n - 1), b = norm(this.b, st > 0 ? n : -1); const out = [];
    if (st > 0) for (let i = a; i < b; i += st) out.push(i); else for (let i = a; i > b; i += st) out.push(i);
    return out;
  }
  get(o, R) {
    if (typeof o === 'string') return this.range(o.length).map((i) => o[i]).join('');
    if (Array.isArray(o)) { const r = this.range(o.length).map((i) => o[i]); return o instanceof Tup ? tup(r) : r; }
    if (o instanceof Rng) return this.range(o.length).map((i) => o.at(i));
    throw R.err('TypeError', 'P_NOT_SUB', { t: typeName(o) });
  }
  set(o, v, R) {
    const items = R.list(v); const ids = this.range(o.length);
    if (this.c === null || this.c === 1) { const a = ids.length ? ids[0] : Math.max(0, Math.min(o.length, this.a === null ? 0 : (intOf(this.a, 'slice') < 0 ? intOf(this.a, 'slice') + o.length : intOf(this.a, 'slice')))); o.splice(a, ids.length, ...items); return; }
    if (items.length !== ids.length) throw R.err('ValueError', 'P_UNPACK', { got: items.length, need: ids.length });
    ids.forEach((i, k) => { o[i] = items[k]; });
  }
}
function mulberry(a) { return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

// ------------------------------------------------------------------ builtins
const N = (name, sig, fn, opts) => new Nat(name, sig, fn, opts);
const ty = (name, sig, fn) => N(name, sig, fn, { kind: 'type' });
function toInt(R, v, base) {
  if (typeof v === 'number') return v; if (typeof v === 'boolean') return +v; if (v instanceof Flt) { if (!Number.isFinite(v.v)) throw R.err('OverflowError', 'P_FLOAT_INT', {}); return Math.trunc(v.v); }
  if (typeof v === 'string') { const s = v.trim().replace(/_/g, ''); const b = base === null || base === undefined ? 10 : intOf(base, 'int'); const ok = b === 10 ? /^[-+]?\d+$/.test(s) : b === 16 ? /^[-+]?(0x)?[0-9a-f]+$/i.test(s) : b === 2 ? /^[-+]?(0b)?[01]+$/i.test(s) : /^[-+]?[0-9a-z]+$/i.test(s); if (!ok) throw R.err('ValueError', 'P_INT_PARSE', { text: v }); return parseInt(s.replace(/^([-+]?)0[xb]/i, '$1'), b); }
  throw R.err('TypeError', 'P_NEED_NUM', { fn: 'int', t: typeName(v) });
}
function toFloat(R, v) {
  if (isNum(v)) return F(nv(v));
  if (typeof v === 'string') { const s = v.trim().toLowerCase(); if (/^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/.test(s)) return F(parseFloat(s)); if (/^[-+]?(inf|infinity)$/.test(s)) return F(s[0] === '-' ? -Infinity : Infinity); if (/^[-+]?nan$/.test(s)) return F(NaN); throw R.err('ValueError', 'P_FLOAT_PARSE', { text: v }); }
  throw R.err('TypeError', 'P_NEED_NUM', { fn: 'float', t: typeName(v) });
}
function rangeOf(R, a, b, c) {
  if (b === undefined || b === ABSENT) { b = a; a = 0; }
  const A = intOf(a, 'range'), B = intOf(b, 'range'), S = c === undefined || c === ABSENT ? 1 : intOf(c, 'range');
  if (S === 0) throw R.err('ValueError', 'P_RANGE_STEP', {});
  return new Rng(A, B, S);
}
function roundHalfEven(x) { const r = Math.round(x); return Math.abs(x % 1) === 0.5 && r % 2 !== 0 ? r - 1 : r; }
function* keyed(R, items, key) { if (key === null || key === undefined) return items.map((x) => [x, x]); const out = []; for (const x of items) out.push([yield* R.callv(key, [x]), x]); return out; }
function sortPairs(pairs, rev) { const s = pairs.map((p, i) => [p[0], p[1], i]); s.sort((a, b) => { const c = cmp(a[0], b[0], '<'); return (rev ? -c : c) || a[2] - b[2]; }); return s.map((p) => p[1]); }
function* minmax(R, args, kw, sign, name) {
  let items = args.length === 1 ? R.list(args[0]) : args; const key = kw && kw.key;
  if (!items.length) { if (kw && 'default' in kw) return kw.default; throw R.err('ValueError', 'P_EMPTY_SEQ', { fn: name }); }
  const pairs = yield* keyed(R, items, key); let best = pairs[0];
  for (const p of pairs) if (cmp(p[0], best[0], '<') * sign > 0) best = p;
  return best[1];
}
function lenOf(R, v) {
  if (typeof v === 'string' || Array.isArray(v)) return v.length;
  if (v instanceof Dict) return v.size; if (v instanceof Rng) return v.length;
  if (v && v.pyLen) return v.pyLen();
  throw R.err('TypeError', 'P_NO_LEN', { t: typeName(v) });
}
export const BUILTINS = {
  print: N('print', '*', (R, args, kw) => { const sep = kw && kw.sep !== undefined && kw.sep !== null ? str(kw.sep) : ' ', end = kw && kw.end !== undefined && kw.end !== null ? str(kw.end) : '\n'; R.print(args.map(str).join(sep) + end); return null; }),
  len: N('len', ['obj'], lenOf),
  range: ty('range', ['start', 'stop=', 'step='], rangeOf),
  int: ty('int', ['x=0', 'base=None'], (R, v, b) => toInt(R, v, b)),
  float: ty('float', ['x=0'], (R, v) => toFloat(R, v)),
  str: ty('str', ['x=""'], (R, v) => str(v)),
  bool: ty('bool', ['x=False'], (R, v) => truth(v)),
  list: ty('list', ['x=None'], (R, v) => { if (v === null) return []; const a = [...R.it(v)]; big(a.length); return a; }),
  tuple: ty('tuple', ['x=None'], (R, v) => (v === null ? tup([]) : tup([...R.it(v)]))),
  dict: ty('dict', '*', (R, args, kw) => { const d = new Dict(); if (args[0] instanceof Dict) for (const [k, v] of args[0].items()) d.set(k, v); else if (args[0]) for (const p of R.it(args[0])) { const [k, v] = R.up(p, 2); d.set(k, v); } if (kw) for (const k in kw) d.set(k, kw[k]); return d; }),
  abs: N('abs', ['x'], (R, v) => { if (typeof v === 'number') return Math.abs(v); if (v instanceof Flt) return F(Math.abs(v.v)); if (typeof v === 'boolean') return +v; throw R.err('TypeError', 'P_NEED_NUM', { fn: 'abs', t: typeName(v) }); }),
  min: N('min', '*', (R, a, kw) => minmax(R, a, kw, -1, 'min'), { blocking: true }),
  max: N('max', '*', (R, a, kw) => minmax(R, a, kw, 1, 'max'), { blocking: true }),
  sum: N('sum', ['items', 'start=0'], (R, v, s) => { let t = s; for (const x of R.it(v)) t = OPS.add(t, x); return t; }),
  round: N('round', ['x', 'digits=None'], (R, v, d) => { const x = numOf(v, 'round'); if (d === null) return roundHalfEven(x); const k = Math.pow(10, intOf(d, 'round')); const r = roundHalfEven(x * k) / k; return typeof v === 'number' ? r : F(r); }),
  sorted: N('sorted', ['items', 'key=None', 'reverse=False'], function* (R, v, key, rev) { return sortPairs(yield* keyed(R, [...R.it(v)], key), truth(rev)); }, { blocking: true }),
  reversed: N('reversed', ['items'], (R, v) => [...R.it(v)].reverse()),
  enumerate: N('enumerate', ['items', 'start=0'], (R, v, s) => { let i = intOf(s, 'enumerate'); return [...R.it(v)].map((x) => tup([i++, x])); }),
  zip: N('zip', '*', (R, args) => { const ls = args.map((a) => [...R.it(a)]); const n = ls.length ? Math.min(...ls.map((l) => l.length)) : 0; const o = []; for (let i = 0; i < n; i++) o.push(tup(ls.map((l) => l[i]))); return o; }),
  map: N('map', '*', function* (R, args) { const f = args[0]; const ls = args.slice(1).map((a) => [...R.it(a)]); const n = ls.length ? Math.min(...ls.map((l) => l.length)) : 0; const o = []; for (let i = 0; i < n; i++) o.push(yield* R.callv(f, ls.map((l) => l[i]))); return o; }, { blocking: true }),
  filter: N('filter', ['fn', 'items'], function* (R, f, v) { const o = []; for (const x of R.it(v)) if (f === null ? truth(x) : truth(yield* R.callv(f, [x]))) o.push(x); return o; }, { blocking: true }),
  any: N('any', ['items'], (R, v) => { for (const x of R.it(v)) if (truth(x)) return true; return false; }),
  all: N('all', ['items'], (R, v) => { for (const x of R.it(v)) if (!truth(x)) return false; return true; }),
  chr: N('chr', ['i'], (R, i) => String.fromCodePoint(intOf(i, 'chr'))),
  ord: N('ord', ['c'], (R, c) => { if (typeof c !== 'string' || [...c].length !== 1) throw R.err('TypeError', 'P_ORD', {}); return c.codePointAt(0); }),
  hex: N('hex', ['i'], (R, i) => { const n = intOf(i, 'hex'); return (n < 0 ? '-0x' : '0x') + Math.abs(n).toString(16); }),
  bin: N('bin', ['i'], (R, i) => { const n = intOf(i, 'bin'); return (n < 0 ? '-0b' : '0b') + Math.abs(n).toString(2); }),
  oct: N('oct', ['i'], (R, i) => { const n = intOf(i, 'oct'); return (n < 0 ? '-0o' : '0o') + Math.abs(n).toString(8); }),
  divmod: N('divmod', ['a', 'b'], (R, a, b) => tup([OPS.fdiv(a, b), OPS.mod(a, b)])),
  pow: N('pow', ['a', 'b'], (R, a, b) => OPS.pow(a, b)),
  type: N('type', ['x'], (R, v) => { const n = typeName(v); return BUILTINS[n] && BUILTINS[n].kind === 'type' ? BUILTINS[n] : new Nat(n, [], () => null, { kind: 'type' }); }),
  isinstance: N('isinstance', ['x', 'types'], (R, v, T) => {
    const list = T instanceof Tup ? T : [T]; const n = typeName(v);
    return list.some((t) => (t instanceof ExcType ? v instanceof PyExc && R.em({ type: v.type.name, exc: v }, t) : t && t.kind === 'type' && (t.name === n || (t.name === 'int' && n === 'bool'))));
  }),
  repr: N('repr', ['x'], (R, v) => repr(v)),
  callable: N('callable', ['x'], (R, v) => v instanceof PyFn || v instanceof Nat || v instanceof ExcType || !!(v && v.pyCall)),
  input: N('input', ['prompt=""'], (R, p) => { if (R.host.input) return R.host.input(p, R); throw R.err('RuntimeError', 'P_INPUT', {}); }, { blocking: false }),
  id: N('id', ['x'], (R, v) => (typeof v === 'number' ? v : 1)),
  hash: N('hash', ['x'], (R, v) => { const h = hkey(v); let x = 0; for (let i = 0; i < h.length; i++) x = (x * 31 + h.charCodeAt(i)) | 0; return x; }),
  iter: N('iter', ['x'], (R, v) => [...R.it(v)]),
  next: N('next', ['it', 'default=_'], (R, v, d) => { if (Array.isArray(v) && v.length) return v.shift(); if (v && v.pyNext) { const r = v.pyNext(R); if (r !== undefined) return r; } if (d !== ABSENT && d !== undefined) return d; throw R.err('StopIteration', 'P_STOP', {}); }), // (batch 20: a csv reader or a file: next(reader) skips the header row)
  ...Object.fromEntries(Object.entries(EXC).map(([k, v]) => [k, v])),
};
export const NAME_HINTS = { true: 'True', false: 'False', null: 'None', NULL: 'None', none: 'None', println: 'print', printf: 'print', echo: 'print', delay: 'sleep', millis: 'running_time', function: 'def', void: 'def', length: 'len', elseif: 'elif', Print: 'print' };

// methods of str, list, dict, tuple: each a Nat whose fn gets (R, self, …)
const M = (name, sig, fn, opts) => new Nat(name, sig, fn, opts);
const strOf = (R, v, fn) => { if (typeof v !== 'string') throw R.err('TypeError', 'P_NEED_STR', { fn, t: typeName(v) }); return v; };
const splitWs = (s, n) => { const out = []; let rest = s.replace(/^\s+/, ''); while (rest) { if (n >= 0 && out.length >= n) { out.push(rest); break; } const m = /^(\S+)\s*/.exec(rest); out.push(m[1]); rest = rest.slice(m[0].length); } return out; };
const METHODS = {
  str: {
    upper: M('upper', [], (R, s) => s.toUpperCase()), lower: M('lower', [], (R, s) => s.toLowerCase()),
    strip: M('strip', ['chars=None'], (R, s, c) => (c === null ? s.trim() : s.replace(new RegExp(`^[${escRe(c)}]+|[${escRe(c)}]+$`, 'g'), ''))),
    lstrip: M('lstrip', ['chars=None'], (R, s, c) => (c === null ? s.replace(/^\s+/, '') : s.replace(new RegExp(`^[${escRe(c)}]+`), ''))),
    rstrip: M('rstrip', ['chars=None'], (R, s, c) => (c === null ? s.replace(/\s+$/, '') : s.replace(new RegExp(`[${escRe(c)}]+$`), ''))),
    split: M('split', ['sep=None', 'maxsplit=-1'], (R, s, sep, n) => { n = intOf(n, 'split'); if (sep === null) return splitWs(s, n); strOf(R, sep, 'split'); if (!sep) throw R.err('ValueError', 'P_EMPTY_SEP', {}); const parts = s.split(sep); if (n >= 0 && parts.length > n + 1) return [...parts.slice(0, n), parts.slice(n).join(sep)]; return parts; }),
    splitlines: M('splitlines', [], (R, s) => s.split(/\r?\n/).filter((x, i, a) => i < a.length - 1 || x)),
    join: M('join', ['items'], (R, s, v) => [...R.it(v)].map((x) => strOf(R, x, 'join')).join(s)),
    replace: M('replace', ['old', 'new', 'count=-1'], (R, s, a, b, n) => { strOf(R, a, 'replace'); strOf(R, b, 'replace'); n = intOf(n, 'replace'); if (n < 0) return s.split(a).join(b); let out = s; let from = 0; for (let i = 0; i < n; i++) { const k = out.indexOf(a, from); if (k < 0) break; out = out.slice(0, k) + b + out.slice(k + a.length); from = k + b.length; } return out; }),
    find: M('find', ['sub', 'start=0'], (R, s, a, st) => s.indexOf(strOf(R, a, 'find'), intOf(st, 'find'))),
    rfind: M('rfind', ['sub'], (R, s, a) => s.lastIndexOf(strOf(R, a, 'rfind'))),
    index: M('index', ['sub'], (R, s, a) => { const k = s.indexOf(strOf(R, a, 'index')); if (k < 0) throw R.err('ValueError', 'P_SUBSTR', { x: repr(a) }); return k; }),
    count: M('count', ['sub'], (R, s, a) => (strOf(R, a, 'count') ? s.split(a).length - 1 : s.length + 1)),
    startswith: M('startswith', ['prefix'], (R, s, a) => (a instanceof Tup ? a.some((x) => s.startsWith(x)) : s.startsWith(strOf(R, a, 'startswith')))),
    endswith: M('endswith', ['suffix'], (R, s, a) => (a instanceof Tup ? a.some((x) => s.endsWith(x)) : s.endsWith(strOf(R, a, 'endswith')))),
    isdigit: M('isdigit', [], (R, s) => /^\d+$/.test(s)), isalpha: M('isalpha', [], (R, s) => /^\p{L}+$/u.test(s)), isalnum: M('isalnum', [], (R, s) => /^[\p{L}\p{N}]+$/u.test(s)),
    isspace: M('isspace', [], (R, s) => /^\s+$/.test(s)), isupper: M('isupper', [], (R, s) => /\p{Lu}/u.test(s) && s === s.toUpperCase()), islower: M('islower', [], (R, s) => /\p{Ll}/u.test(s) && s === s.toLowerCase()),
    title: M('title', [], (R, s) => s.replace(/\b\p{L}/gu, (c) => c.toUpperCase())), capitalize: M('capitalize', [], (R, s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()),
    center: M('center', ['width', 'fill=" "'], (R, s, w, f) => fmtSpec(s, (f || ' ') + '^' + intOf(w, 'center'))),
    zfill: M('zfill', ['width'], (R, s, w) => { const n = intOf(w, 'zfill'); const neg = /^[-+]/.test(s) ? s[0] : ''; return neg + s.slice(neg.length).padStart(n - neg.length, '0'); }),
    format: M('format', '*', (R, s, args, kw) => strFormat(R, s, args, kw)),
    encode: M('encode', [], (R, s) => s),
  },
  list: {
    append: M('append', ['x'], (R, a, x) => { big(a.length + 1); a.push(x); return null; }),
    extend: M('extend', ['items'], (R, a, v) => { const items = R.list(v); big(a.length + items.length); a.push(...items); return null; }),
    insert: M('insert', ['i', 'x'], (R, a, i, x) => { let k = intOf(i, 'insert'); if (k < 0) k = Math.max(0, k + a.length); a.splice(Math.min(k, a.length), 0, x); return null; }),
    pop: M('pop', ['i=-1'], (R, a, i) => { if (!a.length) throw R.err('IndexError', 'P_POP_EMPTY', {}); return a.splice(idx(i, a.length, 'list'), 1)[0]; }),
    remove: M('remove', ['x'], (R, a, x) => { const k = a.findIndex((y) => eq(y, x)); if (k < 0) throw R.err('ValueError', 'P_NOT_IN_LIST', { x: repr(x) }); a.splice(k, 1); return null; }),
    index: M('index', ['x'], (R, a, x) => { const k = a.findIndex((y) => eq(y, x)); if (k < 0) throw R.err('ValueError', 'P_NOT_IN_LIST', { x: repr(x) }); return k; }),
    count: M('count', ['x'], (R, a, x) => a.filter((y) => eq(y, x)).length),
    sort: M('sort', ['key=None', 'reverse=False'], function* (R, a, key, rev) { const s = sortPairs(yield* keyed(R, a.slice(), key), truth(rev)); a.splice(0, a.length, ...s); return null; }, { blocking: true }),
    reverse: M('reverse', [], (R, a) => { a.reverse(); return null; }),
    clear: M('clear', [], (R, a) => { a.length = 0; return null; }),
    copy: M('copy', [], (R, a) => a.slice()),
  },
  tuple: {
    index: M('index', ['x'], (R, a, x) => { const k = a.findIndex((y) => eq(y, x)); if (k < 0) throw R.err('ValueError', 'P_NOT_IN_LIST', { x: repr(x) }); return k; }),
    count: M('count', ['x'], (R, a, x) => a.filter((y) => eq(y, x)).length),
  },
  dict: {
    keys: M('keys', [], (R, d) => d.keys()), values: M('values', [], (R, d) => d.vals()), items: M('items', [], (R, d) => d.items().map(([k, v]) => tup([k, v]))),
    get: M('get', ['key', 'default=None'], (R, d, k, def) => { const v = d.get(k); return v === undefined ? def : v; }),
    pop: M('pop', ['key', 'default='], (R, d, k, def) => { const v = d.get(k); if (v === undefined) { if (def !== ABSENT) return def; throw R.err('KeyError', 'P_KEY', { key: repr(k) }); } d.del(k); return v; }),
    setdefault: M('setdefault', ['key', 'default=None'], (R, d, k, def) => { const v = d.get(k); if (v !== undefined) return v; d.set(k, def); return def; }),
    update: M('update', ['other'], (R, d, o) => { if (!(o instanceof Dict)) throw R.err('TypeError', 'P_NEED_DICT', { t: typeName(o) }); for (const [k, v] of o.items()) d.set(k, v); return null; }),
    clear: M('clear', [], (R, d) => { d.m.clear(); return null; }), copy: M('copy', [], (R, d) => { const n = new Dict(); for (const [k, v] of d.items()) n.set(k, v); return n; }),
  },
};
function escRe(s) { return String(s).replace(/[\\\]\[^-]/g, '\\$&'); }
function strFormat(R, s, args, kw) {
  let auto = 0;
  return s.replace(/\{\{|\}\}|\{([^{}!:]*)(?:!([rs]))?(?::([^{}]*))?\}/g, (m, field, conv, spec) => {
    if (m === '{{') return '{'; if (m === '}}') return '}';
    let v;
    if (field === '') { if (auto >= args.length) throw R.err('IndexError', 'P_FORMAT_ARGS', {}); v = args[auto++]; }
    else if (/^\d+$/.test(field)) { if (+field >= args.length) throw R.err('IndexError', 'P_FORMAT_ARGS', {}); v = args[+field]; }
    else { if (!kw || !(field in kw)) throw R.err('KeyError', 'P_KEY', { key: repr(field) }); v = kw[field]; }
    return conv === 'r' ? fmtSpec(repr(v), spec || '') : fmtSpec(v, spec || '');
  });
}

// ------------------------------------------------------------------ the modules every board has: random, time, math
const CORE_MODS = {
  random: (R) => new Mod('random', {
    seed: N('seed', ['n=None'], (R2, n) => { R2.rnd = mulberry(n === null ? (Math.random() * 4294967296) >>> 0 : intOf(n, 'seed')); return null; }),
    random: N('random', [], (R2) => F(R2.rnd())),
    randint: N('randint', ['a', 'b'], (R2, a, b) => { const A = intOf(a, 'randint'), B = intOf(b, 'randint'); if (B < A) throw R2.err('ValueError', 'P_RAND_RANGE', {}); return A + Math.floor(R2.rnd() * (B - A + 1)); }),
    randrange: N('randrange', ['start', 'stop=', 'step='], (R2, a, b, c) => { const r = rangeOf(R2, a, b, c); if (!r.length) throw R2.err('ValueError', 'P_RAND_RANGE', {}); return r.at(Math.floor(R2.rnd() * r.length)); }),
    uniform: N('uniform', ['a', 'b'], (R2, a, b) => F(numOf(a, 'uniform') + R2.rnd() * (numOf(b, 'uniform') - numOf(a, 'uniform')))),
    choice: N('choice', ['items'], (R2, v) => { const n = lenOf(R2, v); if (!n) throw R2.err('IndexError', 'P_CHOICE_EMPTY', {}); return R2.gi(v, Math.floor(R2.rnd() * n)); }),
    getrandbits: N('getrandbits', ['n'], (R2, n) => Math.floor(R2.rnd() * Math.pow(2, intOf(n, 'getrandbits')))),
    shuffle: N('shuffle', ['items'], (R2, a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(R2.rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return null; }),
  }),
  time: (R) => timeMod('time'),
  utime: (R) => timeMod('utime'),
  math: () => new Mod('math', {
    pi: F(Math.PI), e: F(Math.E), inf: F(Infinity), nan: F(NaN), tau: F(2 * Math.PI),
    ...Object.fromEntries(['sqrt', 'sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'exp', 'log10', 'log2', 'fabs'].map((k) => [k, N(k, ['x'], (R2, x) => { const v = numOf(x, k); if (k === 'sqrt' && v < 0) throw R2.err('ValueError', 'P_MATH_DOMAIN', {}); return F(k === 'fabs' ? Math.abs(v) : Math[k](v)); })])),
    log: N('log', ['x', 'base=None'], (R2, x, b) => { const v = numOf(x, 'log'); if (v <= 0) throw R2.err('ValueError', 'P_MATH_DOMAIN', {}); return F(b === null ? Math.log(v) : Math.log(v) / Math.log(numOf(b, 'log'))); }),
    pow: N('pow', ['x', 'y'], (R2, x, y) => F(Math.pow(numOf(x, 'pow'), numOf(y, 'pow')))),
    atan2: N('atan2', ['y', 'x'], (R2, y, x) => F(Math.atan2(numOf(y, 'atan2'), numOf(x, 'atan2')))),
    hypot: N('hypot', ['x', 'y'], (R2, x, y) => F(Math.hypot(numOf(x, 'hypot'), numOf(y, 'hypot')))),
    floor: N('floor', ['x'], (R2, x) => Math.floor(numOf(x, 'floor'))), ceil: N('ceil', ['x'], (R2, x) => Math.ceil(numOf(x, 'ceil'))), trunc: N('trunc', ['x'], (R2, x) => Math.trunc(numOf(x, 'trunc'))),
    radians: N('radians', ['x'], (R2, x) => F(numOf(x, 'radians') * Math.PI / 180)), degrees: N('degrees', ['x'], (R2, x) => F(numOf(x, 'degrees') * 180 / Math.PI)),
    fmod: N('fmod', ['x', 'y'], (R2, x, y) => F(numOf(x, 'fmod') % numOf(y, 'fmod'))), copysign: N('copysign', ['x', 'y'], (R2, x, y) => F(Math.abs(numOf(x, 'copysign')) * (numOf(y, 'copysign') < 0 ? -1 : 1))),
    isnan: N('isnan', ['x'], (R2, x) => Number.isNaN(numOf(x, 'isnan'))), isinf: N('isinf', ['x'], (R2, x) => { const v = numOf(x, 'isinf'); return !Number.isFinite(v) && !Number.isNaN(v); }),
  }),
};
function timeMod(name) {
  return new Mod(name, {
    sleep: N('sleep', ['seconds'], function* (R, s) { yield* R.sleep(numOf(s, 'sleep') * 1000); return null; }, { blocking: true }),
    sleep_ms: N('sleep_ms', ['ms'], function* (R, s) { yield* R.sleep(numOf(s, 'sleep_ms')); return null; }, { blocking: true }),
    sleep_us: N('sleep_us', ['us'], function* (R, s) { yield* R.sleep(numOf(s, 'sleep_us') / 1000); return null; }, { blocking: true }),
    ticks_ms: N('ticks_ms', [], (R) => Math.floor(R.t / 1000)),
    ticks_us: N('ticks_us', [], (R) => Math.floor(R.t)),
    ticks_add: N('ticks_add', ['a', 'b'], (R, a, b) => intOf(a, 'ticks_add') + intOf(b, 'ticks_add')),
    ticks_diff: N('ticks_diff', ['a', 'b'], (R, a, b) => intOf(a, 'ticks_diff') - intOf(b, 'ticks_diff')),
    time: N('time', [], (R) => Math.floor(R.t / 1e6)),
    monotonic: N('monotonic', [], (R) => F(R.t / 1e6)),
  });
}
export { CORE_MODS, METHODS, Pend };

// ------------------------------------------------------------------ the messages (English, Hindi, Hinglish)
export const PY_MSG = {
  P_INDENT: t3('IndentationError: this line is pushed in (indented), but the line above does not end with ":". Line it up with the line above.', 'IndentationError: यह लाइन अंदर खिसकी हुई (indent) है, पर ऊपर वाली लाइन ":" पर ख़त्म नहीं होती। इसे ऊपर वाली लाइन की सीध में लाइए।', 'IndentationError: yeh line andar khiski hui (indent) hai, par upar wali line ":" par khatam nahi hoti. Ise upar wali line ki seedh mein laiye.'),
  P_DEDENT: t3('IndentationError: this line does not line up with any line above. Use as many spaces as the other lines of its block (4 for each level).', 'IndentationError: यह लाइन ऊपर की किसी भी लाइन की सीध में नहीं है। अपने ब्लॉक की बाक़ी लाइनों जितने ही spaces छोड़िए (हर लेवल पर 4)।', 'IndentationError: yeh line upar ki kisi bhi line ki seedh mein nahi hai. Apne block ki baaki lines jitne hi spaces chhodiye (har level par 4).'),
  P_NEED_INDENT: t3('IndentationError: after the ":" of "{w}" (line {at}) the next lines must be pushed in by 4 spaces.', 'IndentationError: "{w}" (लाइन {at}) के ":" के बाद वाली लाइनें 4 spaces अंदर खिसकाकर लिखिए।', 'IndentationError: "{w}" (line {at}) ke ":" ke baad wali lines 4 spaces andar khiska kar likhiye.'),
  P_COLON: t3('SyntaxError: a ":" is missing at the end of this "{w}" line.', 'SyntaxError: इस "{w}" वाली लाइन के आख़िर में ":" छूट गया है।', 'SyntaxError: is "{w}" wali line ke aakhir mein ":" chhoot gaya hai.'),
  P_SYNTAX: t3('SyntaxError: "{got}" does not make sense here.', 'SyntaxError: यहाँ "{got}" का मतलब नहीं बनता।', 'SyntaxError: yahan "{got}" ka matlab nahi banta.'),
  P_EXPECTED: t3('SyntaxError: I expected "{want}" here, but found "{got}".', 'SyntaxError: यहाँ "{want}" होना चाहिए, पर "{got}" मिला।', 'SyntaxError: yahan "{want}" hona chahiye, par "{got}" mila.'),
  P_EOL: t3('SyntaxError: this line ends too early: something is missing after "{after}".', 'SyntaxError: यह लाइन बीच में ही ख़त्म हो गई: "{after}" के बाद कुछ छूट गया है।', 'SyntaxError: yeh line beech mein hi khatam ho gayi: "{after}" ke baad kuch chhoot gaya hai.'),
  P_PAREN: t3('SyntaxError: the "{open}" on line {at} is never closed: every "{open}" needs its "{close}".', 'SyntaxError: लाइन {at} का "{open}" कभी बंद नहीं हुआ: हर "{open}" का एक "{close}" होना चाहिए।', 'SyntaxError: line {at} ka "{open}" kabhi band nahi hua: har "{open}" ka ek "{close}" hona chahiye.'),
  P_CLOSE: t3('SyntaxError: there is a "{got}" here, but no bracket was opened for it.', 'SyntaxError: यहाँ "{got}" है, पर इसका खुलने वाला ब्रैकेट कहीं नहीं है।', 'SyntaxError: yahan "{got}" hai, par iska khulne wala bracket kahin nahi hai.'),
  P_STRING: t3('SyntaxError: a text in quotes is not closed on this line. Put the same quote mark at its end.', 'SyntaxError: इस लाइन पर quotes वाला टेक्स्ट बंद नहीं हुआ। उसके आख़िर में भी वही quote लगाइए।', 'SyntaxError: is line par quotes wala text band nahi hua. Uske aakhir mein bhi wahi quote lagaiye.'),
  P_FSTRING: t3('SyntaxError: the { } inside this f-string are not right: write f"Score {score}".', 'SyntaxError: इस f-string के अंदर के { } सही नहीं हैं: ऐसे लिखिए f"Score {score}"।', 'SyntaxError: is f-string ke andar ke { } sahi nahi hain: aise likhiye f"Score {score}".'),
  P_QUOTES: t3('SyntaxError: this line has curly quotes (“ ” or ‘ ’) from a word processor. Type straight quotes " or \' instead.', 'SyntaxError: इस लाइन में टेढ़े quotes (“ ” या ‘ ’) हैं, जो वर्ड प्रोसेसर से आते हैं। उनकी जगह सीधे quotes " या \' टाइप कीजिए।', 'SyntaxError: is line mein tedhe quotes (“ ” ya ‘ ’) hain, jo word processor se aate hain. Unki jagah seedhe quotes " ya \' type kijiye.'),
  P_CHAR: t3('SyntaxError: the sign "{ch}" cannot be used in Python code.', 'SyntaxError: Python कोड में "{ch}" चिह्न नहीं लिख सकते।', 'SyntaxError: Python code mein "{ch}" sign nahi likh sakte.'),
  P_NUMBER: t3('SyntaxError: "{text}" is not a number or a name. A name cannot start with a digit.', 'SyntaxError: "{text}" न संख्या है, न नाम। नाम अंक से शुरू नहीं हो सकता।', 'SyntaxError: "{text}" na number hai, na naam. Naam digit se shuru nahi ho sakta.'),
  P_NUMBER_ZERO: t3('SyntaxError: "{text}": in Python a whole number cannot start with 0. Remove the 0 in front.', 'SyntaxError: "{text}": Python में पूरी संख्या 0 से शुरू नहीं हो सकती। आगे का 0 हटाइए।', 'SyntaxError: "{text}": Python mein poora number 0 se shuru nahi ho sakta. Aage ka 0 hataiye.'),
  P_PLUSPLUS: t3('SyntaxError: Python has no "{op}". Write {name} += 1 (or {name} -= 1).', 'SyntaxError: Python में "{op}" नहीं होता। इसकी जगह {name} += 1 (या {name} -= 1) लिखिए।', 'SyntaxError: Python mein "{op}" nahi hota. Iski jagah {name} += 1 (ya {name} -= 1) likhiye.'),
  P_ANDOR: t3('SyntaxError: Python writes "{py}", not "{c}".', 'SyntaxError: Python में "{c}" की जगह "{py}" लिखते हैं।', 'SyntaxError: Python mein "{c}" ki jagah "{py}" likhte hain.'),
  P_BANG: t3('SyntaxError: Python writes "not x", not "!x".', 'SyntaxError: Python में "!x" की जगह "not x" लिखते हैं।', 'SyntaxError: Python mein "!x" ki jagah "not x" likhte hain.'),
  P_SLASHES: t3('SyntaxError: a comment in Python starts with #, not //.', 'SyntaxError: Python में कमेंट # से शुरू होता है, // से नहीं।', 'SyntaxError: Python mein comment # se shuru hota hai, // se nahi.'),
  P_BRACE: t3('SyntaxError: Python does not use { } around blocks. End the line with ":" and push the lines inside in by 4 spaces.', 'SyntaxError: Python में ब्लॉक के लिए { } नहीं लगते। लाइन के आख़िर में ":" लगाइए और अंदर वाली लाइनें 4 spaces अंदर खिसकाइए।', 'SyntaxError: Python mein block ke liye { } nahi lagte. Line ke aakhir mein ":" lagaiye aur andar wali lines 4 spaces andar khiskaiye.'),
  P_ELSEIF: t3('SyntaxError: Python writes "elif", not "else if".', 'SyntaxError: Python में "else if" की जगह "elif" लिखते हैं।', 'SyntaxError: Python mein "else if" ki jagah "elif" likhte hain.'),
  P_TYPE_DECL: t3('SyntaxError: Python does not write a type before a name. Write {name} = … instead of {type} {name} = …', 'SyntaxError: Python में नाम से पहले टाइप नहीं लिखते। {type} {name} = … की जगह {name} = … लिखिए।', 'SyntaxError: Python mein naam se pehle type nahi likhte. {type} {name} = … ki jagah {name} = … likhiye.'),
  P_EQ_IF: t3('SyntaxError: to compare, write "==" (two = signs). One "=" puts a value into a name.', 'SyntaxError: तुलना के लिए "==" (दो =) लिखिए। एक "=" नाम में मान रखता है।', 'SyntaxError: compare karne ke liye "==" (do =) likhiye. Ek "=" naam mein value rakhta hai.'),
  P_ASSIGN: t3('SyntaxError: a value cannot be put into {what}. The name goes on the left of "=", the value on the right.', 'SyntaxError: {what} में मान नहीं रख सकते। "=" के बाईं ओर नाम आता है, दाईं ओर मान।', 'SyntaxError: {what} mein value nahi rakh sakte. "=" ke left mein naam aata hai, right mein value.'),
  P_KEYWORD: t3('SyntaxError: "{name}" is a Python word and cannot be used as a name.', 'SyntaxError: "{name}" Python का अपना शब्द है, इसे नाम की तरह इस्तेमाल नहीं कर सकते।', 'SyntaxError: "{name}" Python ka apna word hai, ise naam ki tarah use nahi kar sakte.'),
  P_UNSUPPORTED: t3('Sorry, {what} is not in the lab\'s Python yet.', 'माफ़ कीजिए, {what} अभी लैब के Python में नहीं है।', 'Sorry, {what} abhi lab ke Python mein nahi hai.'),
  P_OUTSIDE: t3('SyntaxError: "{w}" can only be used inside {where}.', 'SyntaxError: "{w}" सिर्फ़ {where} के अंदर इस्तेमाल हो सकता है।', 'SyntaxError: "{w}" sirf {where} ke andar use ho sakta hai.'),
  P_ELSE: t3('SyntaxError: this "{w}" has no "{need}" just above it at the same indent.', 'SyntaxError: इस "{w}" के ठीक ऊपर, उसी सीध में, कोई "{need}" नहीं है।', 'SyntaxError: is "{w}" ke theek upar, usi seedh mein, koi "{need}" nahi hai.'),
  P_ARG_ORDER: t3('SyntaxError: a plain value cannot come after a name=value inside the brackets.', 'SyntaxError: ब्रैकेट में name=value के बाद सीधा मान नहीं आ सकता।', 'SyntaxError: bracket mein name=value ke baad seedhi value nahi aa sakti.'),
  P_DEFAULT_ORDER: t3('SyntaxError: a name without a default (=…) cannot come after one with a default.', 'SyntaxError: बिना default (=…) वाला नाम, default वाले नाम के बाद नहीं आ सकता।', 'SyntaxError: bina default (=…) wala naam, default wale naam ke baad nahi aa sakta.'),
  P_DUP_ARG: t3('SyntaxError: "{name}" is written twice in def {fn}().', 'SyntaxError: def {fn}() में "{name}" दो बार लिखा है।', 'SyntaxError: def {fn}() mein "{name}" do baar likha hai.'),
  P_STAR_IMPORT: t3('SyntaxError: "from … import *" goes at the top of the program, not inside a def.', 'SyntaxError: "from … import *" प्रोग्राम में सबसे ऊपर लिखिए, def के अंदर नहीं।', 'SyntaxError: "from … import *" program mein sabse upar likhiye, def ke andar nahi.'),
  P_NAME: t3('NameError: I do not know the name "{name}". Give it a value first, like {name} = 0', 'NameError: मैं "{name}" नाम को नहीं जानता। पहले इसे कोई मान दीजिए, जैसे {name} = 0', 'NameError: main "{name}" naam ko nahi jaanta. Pehle ise koi value dijiye, jaise {name} = 0'),
  P_UNBOUND: t3('UnboundLocalError: "{name}" is used in this def before it gets a value here. To change a name from outside the def, write "global {name}" at the top of the def.', 'UnboundLocalError: इस def में "{name}" को मान मिलने से पहले ही इस्तेमाल किया गया। def के बाहर वाला नाम बदलने के लिए def में सबसे ऊपर "global {name}" लिखिए।', 'UnboundLocalError: is def mein "{name}" ko value milne se pehle hi use kiya gaya. def ke bahar wala naam badalne ke liye def mein sabse upar "global {name}" likhiye.'),
  P_ATTR: t3('AttributeError: {obj} has no "{name}".', 'AttributeError: {obj} में "{name}" नहीं होता।', 'AttributeError: {obj} mein "{name}" nahi hota.'),
  P_ATTR_SET: t3('AttributeError: "{name}" of {obj} cannot be changed.', 'AttributeError: {obj} का "{name}" बदला नहीं जा सकता।', 'AttributeError: {obj} ka "{name}" badla nahi ja sakta.'),
  P_TYPE_OP: t3('TypeError: "{op}" cannot be used with a {a} and a {b}.', 'TypeError: "{op}" को {a} और {b} के साथ इस्तेमाल नहीं कर सकते।', 'TypeError: "{op}" ko {a} aur {b} ke saath use nahi kar sakte.'),
  P_UNARY: t3('TypeError: "{op}" cannot be used with a {t}.', 'TypeError: "{op}" को {t} के साथ इस्तेमाल नहीं कर सकते।', 'TypeError: "{op}" ko {t} ke saath use nahi kar sakte.'),
  P_STR_NUM: t3('TypeError: + cannot join a text (str) and a number. Turn the number into text first: "Score " + str(score)', 'TypeError: + से टेक्स्ट (str) और संख्या नहीं जुड़ते। पहले संख्या को टेक्स्ट बनाइए: "Score " + str(score)', 'TypeError: + se text (str) aur number nahi judte. Pehle number ko text banaiye: "Score " + str(score)'),
  P_CMP: t3('TypeError: a {a} and a {b} cannot be compared with "{op}".', 'TypeError: {a} और {b} की तुलना "{op}" से नहीं हो सकती।', 'TypeError: {a} aur {b} ka compare "{op}" se nahi ho sakta.'),
  P_IN_STR: t3('TypeError: only a text can be looked for inside a text with "in", not a {t}.', 'TypeError: "in" से टेक्स्ट के अंदर सिर्फ़ टेक्स्ट ढूँढ सकते हैं, {t} नहीं।', 'TypeError: "in" se text ke andar sirf text dhoondh sakte hain, {t} nahi.'),
  P_NOT_CALLABLE: t3('TypeError: this is a {t}, not a function, so it cannot be called with ( ).', 'TypeError: यह {t} है, फ़ंक्शन नहीं, इसलिए इसे ( ) से नहीं बुला सकते।', 'TypeError: yeh {t} hai, function nahi, isliye ise ( ) se call nahi kar sakte.'),
  P_NONE_CALL: t3('TypeError: this is None (nothing), so it cannot be called with ( ).', 'TypeError: यह None (कुछ नहीं) है, इसलिए इसे ( ) से नहीं बुला सकते।', 'TypeError: yeh None (kuch nahi) hai, isliye ise ( ) se call nahi kar sakte.'),
  P_ARGS: t3('TypeError: {name}() takes {need} value(s), but {got} were given.', 'TypeError: {name}() {need} मान लेता है, पर {got} दिए गए।', 'TypeError: {name}() {need} value leta hai, par {got} diye gaye.'),
  P_KWARG: t3('TypeError: {name}() has no option called "{kw}".', 'TypeError: {name}() में "{kw}" नाम का कोई option नहीं है।', 'TypeError: {name}() mein "{kw}" naam ka koi option nahi hai.'),
  P_MISSING: t3('TypeError: {name}() needs a value for "{param}".', 'TypeError: {name}() को "{param}" के लिए मान चाहिए।', 'TypeError: {name}() ko "{param}" ke liye value chahiye.'),
  P_DUP_VALUE: t3('TypeError: {name}() got two values for "{param}".', 'TypeError: {name}() को "{param}" के लिए दो मान मिले।', 'TypeError: {name}() ko "{param}" ke liye do values mili.'),
  P_INDEX: t3('IndexError: {i} is outside the {t}: it has {n} items, numbered 0 to {last}.', 'IndexError: {i}, {t} के बाहर है: इसमें {n} चीज़ें हैं, 0 से {last} तक।', 'IndexError: {i}, {t} ke bahar hai: ismein {n} items hain, 0 se {last} tak.'),
  P_INDEX_EMPTY: t3('IndexError: the {t} is empty: there is no item {i}.', 'IndexError: {t} ख़ाली है: इसमें {i} नंबर की कोई चीज़ नहीं।', 'IndexError: {t} khaali hai: ismein {i} number ka koi item nahi.'),
  P_POP_EMPTY: t3('IndexError: pop() from an empty list.', 'IndexError: ख़ाली लिस्ट से pop() नहीं हो सकता।', 'IndexError: khaali list se pop() nahi ho sakta.'),
  P_INDEX_TYPE: t3('TypeError: the number inside [ ] must be a whole number (int), not a {t}.', 'TypeError: [ ] के अंदर पूरी संख्या (int) होनी चाहिए, {t} नहीं।', 'TypeError: [ ] ke andar poora number (int) hona chahiye, {t} nahi.'),
  P_IMMUTABLE: t3('TypeError: a {t} cannot be changed after it is made.', 'TypeError: {t} बनने के बाद बदला नहीं जा सकता।', 'TypeError: {t} banne ke baad badla nahi ja sakta.'),
  P_KEY: t3('KeyError: the dictionary has no key {key}.', 'KeyError: डिक्शनरी में {key} नाम की कोई key नहीं है।', 'KeyError: dictionary mein {key} naam ki koi key nahi hai.'),
  P_DIV0: t3('ZeroDivisionError: dividing by zero is not possible.', 'ZeroDivisionError: शून्य से भाग नहीं दे सकते।', 'ZeroDivisionError: zero se divide nahi kar sakte.'),
  P_INT_PARSE: t3('ValueError: int() cannot read "{text}" as a whole number.', 'ValueError: int(), "{text}" को पूरी संख्या की तरह नहीं पढ़ सकता।', 'ValueError: int(), "{text}" ko poore number ki tarah nahi padh sakta.'),
  P_FLOAT_PARSE: t3('ValueError: float() cannot read "{text}" as a number.', 'ValueError: float(), "{text}" को संख्या की तरह नहीं पढ़ सकता।', 'ValueError: float(), "{text}" ko number ki tarah nahi padh sakta.'),
  P_FLOAT_INT: t3('OverflowError: infinity or nan cannot become a whole number.', 'OverflowError: infinity या nan पूरी संख्या नहीं बन सकते।', 'OverflowError: infinity ya nan poora number nahi ban sakte.'),
  P_NOT_ITER: t3('TypeError: a {t} cannot be gone through with "for … in" (or "in").', 'TypeError: {t} पर "for … in" (या "in") नहीं चल सकता।', 'TypeError: {t} par "for … in" (ya "in") nahi chal sakta.'),
  P_UNPACK: t3('ValueError: there are {got} values, but {need} names to put them in.', 'ValueError: मान {got} हैं, पर उन्हें रखने के लिए नाम {need} हैं।', 'ValueError: values {got} hain, par unhe rakhne ke liye naam {need} hain.'),
  P_NOT_SUB: t3('TypeError: a {t} cannot be used with [ ].', 'TypeError: {t} के साथ [ ] नहीं लगा सकते।', 'TypeError: {t} ke saath [ ] nahi laga sakte.'),
  P_NO_LEN: t3('TypeError: a {t} has no length: len() cannot measure it.', 'TypeError: {t} की कोई लंबाई नहीं होती: len() इसे नहीं नाप सकता।', 'TypeError: {t} ki koi length nahi hoti: len() ise nahi naap sakta.'),
  P_NEED_INT: t3('TypeError: {fn}() needs a whole number (int), not a {t}.', 'TypeError: {fn}() को पूरी संख्या (int) चाहिए, {t} नहीं।', 'TypeError: {fn}() ko poora number (int) chahiye, {t} nahi.'),
  P_NEED_NUM: t3('TypeError: {fn}() needs a number, not a {t}.', 'TypeError: {fn}() को संख्या चाहिए, {t} नहीं।', 'TypeError: {fn}() ko number chahiye, {t} nahi.'),
  P_NEED_STR: t3('TypeError: {fn}() needs a text (str), not a {t}.', 'TypeError: {fn}() को टेक्स्ट (str) चाहिए, {t} नहीं।', 'TypeError: {fn}() ko text (str) chahiye, {t} nahi.'),
  P_NEED_DICT: t3('TypeError: update() needs a dictionary, not a {t}.', 'TypeError: update() को डिक्शनरी चाहिए, {t} नहीं।', 'TypeError: update() ko dictionary chahiye, {t} nahi.'),
  P_UNHASHABLE: t3('TypeError: a {t} cannot be a dictionary key.', 'TypeError: {t} डिक्शनरी की key नहीं बन सकता।', 'TypeError: {t} dictionary ki key nahi ban sakta.'),
  P_IMPORT: t3('ImportError: there is no module called "{name}" on this board.', 'ImportError: इस बोर्ड पर "{name}" नाम का कोई मॉड्यूल नहीं है।', 'ImportError: is board par "{name}" naam ka koi module nahi hai.'),
  P_IMPORT_NAME: t3('ImportError: the module {mod} has no "{name}".', 'ImportError: {mod} मॉड्यूल में "{name}" नहीं है।', 'ImportError: {mod} module mein "{name}" nahi hai.'),
  P_RECURSION: t3('RuntimeError: a function keeps calling itself, and the memory for calls ran out.', 'RuntimeError: एक फ़ंक्शन ख़ुद को बार-बार बुला रहा है, और कॉल की मेमोरी भर गई।', 'RuntimeError: ek function khud ko baar-baar call kar raha hai, aur calls ki memory bhar gayi.'),
  P_MEMORY: t3('MemoryError: this is too big for the board\'s memory.', 'MemoryError: यह बोर्ड की मेमोरी के लिए बहुत बड़ा है।', 'MemoryError: yeh board ki memory ke liye bahut bada hai.'),
  P_NOT_IN_LIST: t3('ValueError: {x} is not in the list.', 'ValueError: {x} लिस्ट में नहीं है।', 'ValueError: {x} list mein nahi hai.'),
  P_SUBSTR: t3('ValueError: {x} is not in the text.', 'ValueError: {x} टेक्स्ट में नहीं है।', 'ValueError: {x} text mein nahi hai.'),
  P_EMPTY_SEQ: t3('ValueError: {fn}() of nothing: the list is empty.', 'ValueError: ख़ाली लिस्ट का {fn}() नहीं निकल सकता।', 'ValueError: khaali list ka {fn}() nahi nikal sakta.'),
  P_EMPTY_SEP: t3('ValueError: split("") cannot split on an empty text.', 'ValueError: split("") ख़ाली टेक्स्ट पर नहीं तोड़ सकता।', 'ValueError: split("") khaali text par nahi tod sakta.'),
  P_RAND_RANGE: t3('ValueError: the range for the random number is empty (the first number is bigger).', 'ValueError: random संख्या की रेंज ख़ाली है (पहली संख्या बड़ी है)।', 'ValueError: random number ki range khaali hai (pehla number bada hai).'),
  P_NOT_CTX: t3('TypeError: a {t} cannot be used after "with" (with is for things like open(…) that must be closed).', 'TypeError: {t} को "with" के बाद नहीं लिख सकते (with, open(…) जैसी चीज़ों के लिए है जिन्हें बंद करना होता है)।', 'TypeError: {t} ko "with" ke baad nahi likh sakte (with, open(…) jaisi cheezon ke liye hai jinhe band karna hota hai).'),
  P_CHOICE_EMPTY: t3('IndexError: choice() cannot pick from an empty list.', 'IndexError: choice() ख़ाली लिस्ट से कुछ नहीं चुन सकता।', 'IndexError: choice() khaali list se kuch nahi chun sakta.'),
  P_RANGE_STEP: t3('ValueError: the step of range() cannot be 0.', 'ValueError: range() का step 0 नहीं हो सकता।', 'ValueError: range() ka step 0 nahi ho sakta.'),
  P_SLICE_STEP: t3('ValueError: the step of a slice [::] cannot be 0.', 'ValueError: slice [::] का step 0 नहीं हो सकता।', 'ValueError: slice [::] ka step 0 nahi ho sakta.'),
  P_MATH_DOMAIN: t3('ValueError: this maths cannot be done with that number (like the square root of a negative number).', 'ValueError: उस संख्या के साथ यह गणित नहीं हो सकता (जैसे ऋण संख्या का वर्गमूल)।', 'ValueError: us number ke saath yeh maths nahi ho sakta (jaise negative number ka square root).'),
  P_ORD: t3('TypeError: ord() needs exactly one letter.', 'TypeError: ord() को ठीक एक अक्षर चाहिए।', 'TypeError: ord() ko theek ek letter chahiye.'),
  P_FORMAT_ARGS: t3('TypeError: the number of { } (or %) places and the values given do not match.', 'TypeError: { } (या %) की जगहें और दिए गए मान बराबर नहीं हैं।', 'TypeError: { } (ya %) ki jagah aur di gayi values barabar nahi hain.'),
  P_FORMAT_SPEC: t3('ValueError: the format "{spec}" is not right for this value.', 'ValueError: फ़ॉर्मैट "{spec}" इस मान के लिए सही नहीं है।', 'ValueError: format "{spec}" is value ke liye sahi nahi hai.'),
  P_STOP: t3('StopIteration: there are no more items.', 'StopIteration: और कोई चीज़ नहीं बची।', 'StopIteration: aur koi item nahi bacha.'),
  P_RAISED: t3('{type}: {msg}', '{type}: {msg}', '{type}: {msg}'),
  P_RAISE_TYPE: t3('TypeError: only an error, like ValueError("…"), can be raised.', 'TypeError: raise के साथ सिर्फ़ कोई error लिख सकते हैं, जैसे ValueError("…")।', 'TypeError: raise ke saath sirf koi error likh sakte hain, jaise ValueError("…").'),
  P_RERAISE: t3('RuntimeError: a bare "raise" is used outside of an "except".', 'RuntimeError: अकेला "raise" किसी "except" के बाहर लिखा है।', 'RuntimeError: akela "raise" kisi "except" ke bahar likha hai.'),
  P_EXCEPT_TYPE: t3('TypeError: "except" needs an error type, like ValueError.', 'TypeError: "except" के साथ error का टाइप लिखिए, जैसे ValueError।', 'TypeError: "except" ke saath error ka type likhiye, jaise ValueError.'),
  P_ASSERT: t3('AssertionError: the check after "assert" was False. {m}', 'AssertionError: "assert" के बाद वाली जाँच False निकली। {m}', 'AssertionError: "assert" ke baad wali check False nikli. {m}'),
  P_INPUT: t3('RuntimeError: input() needs a keyboard, and this board has none. Use its buttons instead.', 'RuntimeError: input() को कीबोर्ड चाहिए, और इस बोर्ड पर कीबोर्ड नहीं है। इसकी जगह बटन इस्तेमाल कीजिए।', 'RuntimeError: input() ko keyboard chahiye, aur is board par keyboard nahi hai. Iski jagah buttons use kijiye.'),
  P_INTERNAL: t3('Something went wrong in the lab ({msg}). Please tell DUET STEM.', 'लैब में कुछ गड़बड़ हुई ({msg})। कृपया DUET STEM को बताइए।', 'Lab mein kuch gadbad hui ({msg}). Please DUET STEM ko bataiye.'),
  P_W_COMPARE: t3('This line compares with "==" but does nothing with the answer. To put a value in, use one "=".', 'यह लाइन "==" से तुलना करती है, पर जवाब का कुछ नहीं करती। मान रखने के लिए एक "=" लिखिए।', 'Yeh line "==" se compare karti hai, par jawab ka kuch nahi karti. Value rakhne ke liye ek "=" likhiye.'),
  P_W_NOCALL: t3('"{name}" alone does nothing: to run it, add brackets: {name}()', 'अकेला "{name}" कुछ नहीं करता: इसे चलाने के लिए ब्रैकेट लगाइए: {name}()', 'Akela "{name}" kuch nahi karta: ise chalane ke liye bracket lagaiye: {name}()'),
};
Object.assign(CPP, PY_MSG); // the lab's error box finds them by code (i18n.js msg())
// the error as one line of text in the current language (for the board's own display and print(e))
export function errText(e) { return msg(e); }

// ------------------------------------------------------------------ syntax colours (the editor), as cpp.js does it for C
const HL_KW = new Set(['if', 'elif', 'else', 'for', 'while', 'in', 'not', 'and', 'or', 'is', 'def', 'return', 'import', 'from', 'as', 'pass', 'break', 'continue', 'global', 'nonlocal', 'try', 'except', 'finally', 'raise', 'lambda', 'del', 'assert', 'with', 'class', 'yield']);
const HL_CONST = new Set(['True', 'False', 'None']);
export function highlight(code, known) {
  const out = []; const re = /(#.*$)|("""[\s\S]*?(?:"""|$)|'''[\s\S]*?(?:'''|$)|[rRfFbBuU]{0,2}"(?:\\.|[^"\\\n])*"?|[rRfFbBuU]{0,2}'(?:\\.|[^'\\\n])*'?)|(\b0[xXbBoO][0-9a-fA-F_]+\b|\b\d[\d_]*\.?\d*(?:[eE][+-]?\d+)?\b|\.\d+\b)|([\p{L}_][\p{L}\p{N}_]*)|(\s+)|([^\s\p{L}\p{N}_"'#]+)/gmu;
  let m;
  while ((m = re.exec(code))) {
    if (m[1]) out.push(['com', m[1]]);
    else if (m[2]) out.push(['str', m[2]]);
    else if (m[3]) out.push(['num', m[3]]);
    else if (m[4]) { const w = m[4]; out.push([HL_KW.has(w) ? 'kw' : HL_CONST.has(w) ? 'const' : w in BUILTINS && !(BUILTINS[w] instanceof ExcType) ? 'fn' : known && known.has(w) ? 'type' : 'id', w]); }
    else out.push(['', m[0]]);
  }
  return out;
}
