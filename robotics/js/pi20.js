// DUET Robotics Lab 360, batch 20: data on the Raspberry Pi 4. Python 3 there keeps files on its SD card, and Class 10
// logs, plots and predicts with them. pi6.js gives the Pi's Python these, made here:
//   open(name, mode)   a file on the Pi's card (lab.fs6: name -> text; it lasts across Runs, a lesson can bring its own):
//                      read, readline, readlines, write (str only, as Python: write(23.4) is a TypeError), writelines,
//                      close, iteration by line, `with open(…) as f:` (py.js); FileNotFoundError, a closed file, the
//                      wrong mode (io.UnsupportedOperation)
//   os                 getcwd, listdir, remove, path.exists / getsize
//   csv                writer(f).writerow / writerows ("\r\n" at the end of a row, as Python's csv does), reader(f)
//   statistics         mean, median, stdev, linear_regression (slope, intercept), correlation
//   matplotlib.pyplot  figure, plot, scatter, bar, title, xlabel, ylabel, grid, legend, xlim, ylim, savefig, show,
//                      close. A list of strings on an axis is plotted as categories in the order they come, as the real
//                      matplotlib does: numbers read from a CSV and not turned into float() come out in a jumbled order.
// drawFigure(ctx, fig, w, h) paints a figure: on the Pi's little screen (models6.js) and in the page's Figure window (app6.js).
import { Nat, Mod, Flt, tup, str, typeName, Dict, PyErr } from './py.js';

const t3 = (en, hi, hg) => ({ en, hi, hg });
const F = (v) => new Flt(v);
const absent = (v) => typeof v === 'symbol';
const isNone = (v) => v === null || v === undefined || absent(v);
const nat = (name, sig, fn, o) => new Nat(name, sig, fn, o);
const numOr = (v) => (typeof v === 'number' ? v : typeof v === 'boolean' ? +v : v instanceof Flt ? v.v : null);
const num = (R, v, fn) => { const x = numOr(v); if (x === null) throw R.err('TypeError', 'P_NEED_NUM', { fn: fn || '?', t: typeName(v) }); return x; };
const list = (R, v) => (Array.isArray(v) ? v : [...R.it(v)]);

class Obj { // a Python object made in JavaScript: getters, setters, methods
  constructor(type) { this._type = type; this.pyName = type; this._m = null; }
  get pyType() { return this._type; }
  pyNames() { return [...Object.keys(this.methods()), ...Object.keys(this.props())]; }
  pyGet(n, R) { const pr = this.props(); if (n in pr) return pr[n](R); const ms = this._m || (this._m = this.methods()); return ms[n]; }
  pySet(n, v, R) { const s = this.setters(); if (!s[n]) return false; s[n](v, R); return true; }
  methods() { return {}; } props() { return {}; } setters() { return {}; }
  pyStr() { return `<${this._type} object>`; }
}
const klass = (name, make) => ({ pyType: 'type', pyName: name, pyCall: (R, a, kw) => make(R, a, kw || {}), pyGet: () => undefined, pyNames: () => [], pyStr: () => `<class '${name}'>` });
const kwArg = (a, kw, i, name, def) => (kw && name in kw ? kw[name] : a.length > i ? a[i] : def);

// ------------------------------------------------------------------ the SD card
export const fsOf = (m) => { const lab = m.lab || m; if (!lab.fs6) lab.fs6 = new Map(); return lab.fs6; };
const clean = (name) => String(name).replace(/^\.\//, '').replace(/^\/home\/pi\//, '');
class PyFile extends Obj {
  constructor(m, R, name, mode) {
    super('TextIOWrapper'); this.m = m; this.fs = fsOf(m); this.name = clean(name); this.mode = mode; this.closed = false; this.pos = 0;
    const k = mode.replace(/[bt+]/g, '');
    if (!['r', 'w', 'a', 'x'].includes(k) || mode.includes('b')) throw R.err('ValueError', 'N20_MODE', { mode });
    this.r = k === 'r' || mode.includes('+'); this.w = k !== 'r' || mode.includes('+');
    if (k === 'r' && !this.fs.has(this.name)) throw R.err('FileNotFoundError', 'N20_NOFILE', { name: this.name });
    if (k === 'x' && this.fs.has(this.name)) throw R.err('FileExistsError', 'N20_EXISTS', { name: this.name });
    if (k === 'w' || k === 'x') this.fs.set(this.name, '');
    if (k === 'a' && !this.fs.has(this.name)) this.fs.set(this.name, '');
    if (k === 'a') this.pos = this.fs.get(this.name).length;
    this.m.files6 = (this.m.files6 || 0) + 1; this.touch();
  }
  touch() { const lab = this.m.lab; if (lab) lab.fsV6 = (lab.fsV6 || 0) + 1; }
  pyStr() { return `<_io.TextIOWrapper name='${this.name}' mode='${this.mode}' encoding='UTF-8'>`; }
  live(R, want) {
    if (this.closed) throw R.err('ValueError', 'N20_CLOSED', {});
    if (want === 'r' && !this.r) throw R.err('UnsupportedOperation', 'N20_NOT_R', {});
    if (want === 'w' && !this.w) throw R.err('UnsupportedOperation', 'N20_NOT_W', {});
  }
  text() { return this.fs.get(this.name) || ''; }
  write(R, s) {
    this.live(R, 'w'); if (typeof s !== 'string') throw R.err('TypeError', 'N20_WRITE_STR', { t: typeName(s) });
    const t = this.text(); this.fs.set(this.name, this.mode.startsWith('a') ? t + s : t.slice(0, this.pos) + s + t.slice(this.pos + s.length));
    this.pos = this.mode.startsWith('a') ? this.text().length : this.pos + s.length; this.m.wrote6 = (this.m.wrote6 || 0) + 1; this.touch(); return s.length;
  }
  readline(R) { this.live(R, 'r'); const t = this.text(); if (this.pos >= t.length) return ''; let j = t.indexOf('\n', this.pos); j = j < 0 ? t.length : j + 1; const ln = t.slice(this.pos, j); this.pos = j; return ln; }
  close() { if (!this.closed) { this.closed = true; this.touch(); } }
  pyEnter() { return this; }
  pyExit() { this.close(); }
  pyIter(R) { const me = this; return { [Symbol.iterator]() { return { next: () => { const ln = me.readline(R); return ln === '' ? { value: undefined, done: true } : { value: ln, done: false }; } }; } }; }
  pyNext(R) { const ln = this.readline(R); return ln === '' ? undefined : ln; }
  methods() {
    const me = this;
    return {
      write: nat('write', ['s'], (R, s) => me.write(R, s)),
      writelines: nat('writelines', ['lines'], (R, ls) => { for (const s of list(R, ls)) me.write(R, s); return null; }),
      read: nat('read', ['size=-1'], (R, n) => { me.live(R, 'r'); const t = me.text(); const k = isNone(n) || n < 0 ? t.length : num(R, n); const s = t.slice(me.pos, me.pos + k); me.pos += s.length; return s; }),
      readline: nat('readline', [], (R) => me.readline(R)),
      readlines: nat('readlines', [], (R) => { const out = []; for (;;) { const l = me.readline(R); if (l === '') return out; out.push(l); } }),
      close: nat('close', [], () => { me.close(); return null; }), flush: nat('flush', [], () => null),
      seek: nat('seek', ['pos'], (R, p) => { me.pos = num(R, p); return me.pos; }), tell: nat('tell', [], () => me.pos),
    };
  }
  props() { const me = this; return { closed: () => me.closed, name: () => me.name, mode: () => me.mode }; }
}
export const openFn = (m) => nat('open', ['file', 'mode="r"', 'buffering=-1', 'encoding=None', 'errors=None', 'newline=None'], (R, name, mode) => {
  if (typeof name !== 'string') throw R.err('TypeError', 'N20_NAME_STR', { t: typeName(name) });
  return new PyFile(m, R, name, isNone(mode) ? 'r' : String(mode));
});

function osMod(m) {
  const fs = () => fsOf(m);
  const path = new Mod('os.path', {
    exists: nat('exists', ['path'], (R, p) => fs().has(clean(p)) || clean(p) === '.' || clean(p) === ''),
    isfile: nat('isfile', ['path'], (R, p) => fs().has(clean(p))),
    getsize: nat('getsize', ['path'], (R, p) => { const k = clean(p); if (!fs().has(k)) throw R.err('FileNotFoundError', 'N20_NOFILE', { name: k }); return new TextEncoder().encode(fs().get(k)).length; }),
    join: nat('join', '*', (R, a) => a.map(String).join('/'), { star: true }),
  });
  return new Mod('os', {
    path, getcwd: nat('getcwd', [], () => '/home/pi'), name: 'posix', sep: '/',
    listdir: nat('listdir', ['path="."'], () => [...fs().keys()].sort()),
    remove: nat('remove', ['path'], (R, p) => { const k = clean(p); if (!fs().delete(k)) throw R.err('FileNotFoundError', 'N20_NOFILE', { name: k }); return null; }),
  });
}

// ------------------------------------------------------------------ csv
const cell = (v) => { const s = typeof v === 'string' ? v : isNone(v) ? '' : str(v); return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
function parseRow(line) {
  const out = []; let cur = '', q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (q) { if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; } else if (c === '"') q = false; else cur += c; }
    else if (c === '"') q = true; else if (c === ',') { out.push(cur); cur = ''; } else cur += c;
  }
  out.push(cur); return out;
}
function csvMod() {
  class Writer extends Obj {
    constructor(f) { super('_csv.writer'); this.f = f; }
    methods() {
      const me = this; const row = (R, r) => { const f = me.f; if (!f || !f.write) throw R.err('TypeError', 'N20_CSV_FILE', {}); f.write(R, list(R, r).map(cell).join(',') + '\r\n'); return null; };
      return { writerow: nat('writerow', ['row'], row), writerows: nat('writerows', ['rows'], (R, rs) => { for (const r of list(R, rs)) row(R, r); return null; }) };
    }
  }
  class Reader extends Obj {
    constructor(f) { super('_csv.reader'); this.f = f; this.line_num = 0; }
    pyNext(R) { if (!this.src) this.src = R.it(this.f)[Symbol.iterator](); const n = this.src.next(); if (n.done) return undefined; this.line_num++; const ln = String(n.value).replace(/\r?\n$/, ''); return ln === '' ? [] : parseRow(ln); }
    pyIter(R) { const me = this; return { [Symbol.iterator]() { return { next: () => { const v = me.pyNext(R); return v === undefined ? { value: undefined, done: true } : { value: v, done: false }; } }; } }; }
    props() { const me = this; return { line_num: () => me.line_num }; }
  }
  return new Mod('csv', {
    writer: klass('writer', (R, a) => new Writer(a[0])), reader: klass('reader', (R, a) => new Reader(a[0])),
    QUOTE_MINIMAL: 0, QUOTE_ALL: 1, QUOTE_NONNUMERIC: 2, QUOTE_NONE: 3,
  });
}

// ------------------------------------------------------------------ statistics
function statsMod() {
  const nums = (R, v, fn) => { const a = list(R, v).map((x) => num(R, x, fn)); return a; };
  const mean = (a) => a.reduce((s, x) => s + x, 0) / a.length;
  const need = (R, a, n, fn) => { if (a.length < n) throw R.err('StatisticsError', n === 1 ? 'N20_STAT_EMPTY' : 'N20_STAT_TWO', { fn }); };
  return new Mod('statistics', {
    mean: nat('mean', ['data'], (R, d) => { const a = nums(R, d, 'mean'); need(R, a, 1, 'mean'); const v = mean(a); return a.every(Number.isInteger) && Number.isInteger(v) ? v : F(v); }),
    fmean: nat('fmean', ['data'], (R, d) => { const a = nums(R, d, 'fmean'); need(R, a, 1, 'fmean'); return F(mean(a)); }),
    median: nat('median', ['data'], (R, d) => { const a = nums(R, d, 'median').sort((x, y) => x - y); need(R, a, 1, 'median'); const k = a.length >> 1; const v = a.length % 2 ? a[k] : (a[k - 1] + a[k]) / 2; return Number.isInteger(v) && a.length % 2 ? v : F(v); }),
    stdev: nat('stdev', ['data'], (R, d) => { const a = nums(R, d, 'stdev'); need(R, a, 2, 'stdev'); const m = mean(a); return F(Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / (a.length - 1))); }),
    correlation: nat('correlation', ['x', 'y'], (R, x, y) => { const a = nums(R, x, 'correlation'), b = nums(R, y, 'correlation'); if (a.length !== b.length) throw R.err('StatisticsError', 'N20_STAT_LEN', {}); need(R, a, 2, 'correlation'); const ma = mean(a), mb = mean(b); let sab = 0, saa = 0, sbb = 0; a.forEach((v, i) => { sab += (v - ma) * (b[i] - mb); saa += (v - ma) ** 2; sbb += (b[i] - mb) ** 2; }); return F(sab / Math.sqrt(saa * sbb)); }),
    linear_regression: nat('linear_regression', ['x', 'y'], (R, x, y) => {
      const a = nums(R, x, 'linear_regression'), b = nums(R, y, 'linear_regression'); if (a.length !== b.length) throw R.err('StatisticsError', 'N20_STAT_LEN', {}); need(R, a, 2, 'linear_regression');
      const ma = mean(a), mb = mean(b); let sab = 0, saa = 0; a.forEach((v, i) => { sab += (v - ma) * (b[i] - mb); saa += (v - ma) ** 2; }); if (!saa) throw R.err('StatisticsError', 'N20_STAT_CONST', {});
      const slope = sab / saa, icpt = mb - slope * ma; const o = tup([F(slope), F(icpt)]); o.pyGet = (n) => (n === 'slope' ? F(slope) : n === 'intercept' ? F(icpt) : undefined); o.pyName = 'LinearRegression'; return o;
    }),
  });
}

// ------------------------------------------------------------------ matplotlib.pyplot
const COLORS = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b'];
const NAMED = { b: '#1f77b4', blue: '#1f77b4', r: '#d62728', red: '#d62728', g: '#2ca02c', green: '#2ca02c', orange: '#ff7f0e', k: '#111111', black: '#111111', m: '#9467bd', purple: '#9467bd', c: '#17becf', cyan: '#17becf', y: '#bcbd22', grey: '#7f7f7f', gray: '#7f7f7f' };
const newFig = () => ({ series: [], title: '', xlabel: '', ylabel: '', grid: false, legend: false, xlim: null, ylim: null, n: 1 });
function pltMod(m) {
  const P = m.plt6 || (m.plt6 = { fig: newFig(), shown: [], saved: [], count: 0 });
  const vals = (R, v) => list(R, v).map((x) => (typeof x === 'string' ? x : num(R, x, 'plot')));
  const add = (R, kind, a, kw) => {
    let x, y, fmt = '';
    const args = a.slice(); if (args.length && typeof args[args.length - 1] === 'string' && args.length >= 2 && !Array.isArray(args[args.length - 1])) fmt = args.pop();
    if (args.length === 1) { y = vals(R, args[0]); x = y.map((_, i) => i); } else { x = vals(R, args[0]); y = vals(R, args[1]); }
    if (x.length !== y.length) throw R.err('ValueError', 'N20_PLOT_LEN', { a: x.length, b: y.length });
    const fm = /^([bgrcmyk])?([o.s^x*+])?(--|-|:)?$/.exec(fmt) || [];
    const col = kw && kw.color ? (NAMED[kw.color] || String(kw.color)) : fm[1] ? NAMED[fm[1]] : COLORS[P.fig.series.length % COLORS.length];
    const marker = kw && kw.marker ? String(kw.marker) : fm[2] || (kind === 'scatter' ? 'o' : null);
    const ls = kind === 'scatter' ? 'none' : kw && kw.linestyle ? String(kw.linestyle) : fm[3] || (fm[2] && !fm[3] ? 'none' : '-');
    P.fig.series.push({ kind, x, y, color: col, marker, ls, label: kw && kw.label !== undefined && !isNone(kw.label) ? String(kw.label) : null });
    return [];
  };
  const set = (k) => nat(k, ['s', 'fontsize=None'], (R, s) => { P.fig[k] = str(s); return null; });
  const done = (R, how, name) => { const f = JSON.parse(JSON.stringify(P.fig)); f.n = P.count + 1; m.fig6 = f; m.figV6 = (m.figV6 || 0) + 1; if (how === 'show') P.shown.push(f); else P.saved.push([name, f]); if (m.lab) m.lab.fsV6 = (m.lab.fsV6 || 0) + 1; return f; };
  const mod = new Mod('matplotlib.pyplot', {
    figure: nat('figure', '*', () => { P.count++; P.fig = newFig(); return null; }, { star: true }),
    plot: nat('plot', '*', (R, a, kw) => add(R, 'line', a, kw), { star: true }),
    scatter: nat('scatter', '*', (R, a, kw) => add(R, 'scatter', a, kw), { star: true }),
    bar: nat('bar', '*', (R, a, kw) => add(R, 'bar', a, kw), { star: true }),
    title: set('title'), xlabel: set('xlabel'), ylabel: set('ylabel'),
    grid: nat('grid', ['visible=True'], (R, v) => { P.fig.grid = isNone(v) ? true : !!v; return null; }),
    legend: nat('legend', '*', () => { P.fig.legend = true; return null; }, { star: true }),
    xlim: nat('xlim', ['lo', 'hi'], (R, lo, hi) => { P.fig.xlim = [num(R, lo), num(R, hi)]; return null; }),
    ylim: nat('ylim', ['lo', 'hi'], (R, lo, hi) => { P.fig.ylim = [num(R, lo), num(R, hi)]; return null; }),
    xticks: nat('xticks', '*', () => null, { star: true }), tight_layout: nat('tight_layout', [], () => null),
    savefig: nat('savefig', ['fname', 'dpi=None'], (R, name) => { const k = clean(name); done(R, 'save', k); fsOf(m).set(k, `\u0089PNG figure: ${P.fig.title || 'Figure ' + (P.count + 1)}`); return null; }),
    show: nat('show', ['block=None'], (R) => { done(R, 'show'); return null; }),
    close: nat('close', ['fig=None'], () => { P.fig = newFig(); return null; }),
    clf: nat('clf', [], () => { P.fig = newFig(); return null; }),
  });
  return mod;
}

export function dataModules(m) {
  return {
    os: () => osMod(m), csv: () => csvMod(), statistics: () => statsMod(),
    'matplotlib.pyplot': () => pltMod(m), matplotlib: (R) => new Mod('matplotlib', { pyplot: R.imp('matplotlib.pyplot'), __version__: '3.6.3' }),
    io: () => new Mod('io', {}),
  };
}

// ------------------------------------------------------------------ painting a figure (a matplotlib-style window)
const isNum = (v) => typeof v === 'number';
function axis(vals) { // numbers -> a numeric axis; any string -> categories in the order they first come
  if (vals.every(isNum)) return { cat: null, of: (v) => v };
  const cats = []; for (const v of vals) { const k = String(v); if (!cats.includes(k)) cats.push(k); }
  return { cat: cats, of: (v) => cats.indexOf(String(v)) };
}
function nice(lo, hi, n = 5) {
  if (lo === hi) { lo -= 1; hi += 1; }
  const step0 = (hi - lo) / n; const p = Math.pow(10, Math.floor(Math.log10(step0))); const st = [1, 2, 2.5, 5, 10].map((k) => k * p).find((k) => k >= step0) || p * 10;
  const a = Math.floor(lo / st) * st, b = Math.ceil(hi / st) * st; const ticks = []; for (let v = a; v <= b + st / 2; v += st) ticks.push(+v.toFixed(10)); return { lo: a, hi: b, ticks, st };
}
const fmtTick = (v, st) => { const d = st >= 1 ? 0 : Math.min(4, Math.ceil(-Math.log10(st))); return v.toFixed(d); };
export function drawFigure(c, fig, W, H, opt = {}) {
  const font = opt.font || 'system-ui, sans-serif'; const s = H / 400;
  c.save(); c.fillStyle = '#ffffff'; c.fillRect(0, 0, W, H);
  if (!fig || !fig.series || !fig.series.length) { c.fillStyle = '#888'; c.font = `${14 * s}px ${font}`; c.textAlign = 'center'; c.fillText('(empty figure)', W / 2, H / 2); c.restore(); return; }
  const xs = [], ys = []; for (const S of fig.series) { xs.push(...S.x); ys.push(...S.y); }
  const AX = axis(xs), AY = axis(ys); const bars = fig.series.some((S) => S.kind === 'bar');
  const xv = xs.map(AX.of), yv = ys.map(AY.of).concat(bars ? [0] : []);
  let x0 = Math.min(...xv), x1 = Math.max(...xv), y0 = Math.min(...yv), y1 = Math.max(...yv);
  if (fig.xlim) [x0, x1] = fig.xlim; if (fig.ylim) [y0, y1] = fig.ylim;
  if (bars || AX.cat) { x0 -= 0.6; x1 += 0.6; } else { const px = (x1 - x0 || 1) * 0.05; x0 -= px; x1 += px; }
  const py = (y1 - y0 || 1) * 0.06; const NY = AY.cat ? { lo: y0 - 0.5, hi: y1 + 0.5, ticks: AY.cat.map((_, i) => i), st: 1 } : nice(y0 - (fig.ylim ? 0 : py), y1 + (fig.ylim ? 0 : py));
  const NX = AX.cat ? { lo: x0, hi: x1, ticks: AX.cat.map((_, i) => i), st: 1 } : nice(x0, x1, 6);
  if (!AX.cat && !bars) { NX.lo = x0; NX.hi = x1; NX.ticks = NX.ticks.filter((t) => t >= x0 - 1e-9 && t <= x1 + 1e-9); }
  const L = 64 * s + (AY.cat ? 10 * s : 0), Rm = 18 * s, T = (fig.title ? 34 : 16) * s, B = (fig.xlabel ? 52 : 34) * s;
  const X = (v) => L + (v - NX.lo) / (NX.hi - NX.lo || 1) * (W - L - Rm), Y = (v) => H - B - (v - NY.lo) / (NY.hi - NY.lo || 1) * (H - T - B);
  c.font = `${11 * s}px ${font}`; c.fillStyle = '#222'; c.strokeStyle = '#222'; c.lineWidth = Math.max(1, s);
  // grid and ticks
  c.textAlign = 'right'; c.textBaseline = 'middle';
  const yEvery = AY.cat ? Math.max(1, Math.ceil(NY.ticks.length / 12)) : 1; // (many words on an axis: every few, or they pile up)
  for (const t of NY.ticks) { const yy = Y(t); if (AY.cat && t % yEvery) continue; if (fig.grid) { c.strokeStyle = '#e3e3e3'; c.beginPath(); c.moveTo(L, yy); c.lineTo(W - Rm, yy); c.stroke(); } c.strokeStyle = '#222'; c.beginPath(); c.moveTo(L - 4 * s, yy); c.lineTo(L, yy); c.stroke(); c.fillText(AY.cat ? AY.cat[t] : fmtTick(t, NY.st), L - 7 * s, yy); }
  c.textAlign = 'center'; c.textBaseline = 'top'; const every = Math.max(1, Math.ceil(NX.ticks.length / 10));
  NX.ticks.forEach((t, i) => { const xx = X(t); if (fig.grid) { c.strokeStyle = '#e3e3e3'; c.beginPath(); c.moveTo(xx, T); c.lineTo(xx, H - B); c.stroke(); } c.strokeStyle = '#222'; c.beginPath(); c.moveTo(xx, H - B); c.lineTo(xx, H - B + 4 * s); c.stroke(); if (i % every === 0) c.fillText(AX.cat ? AX.cat[t] : fmtTick(t, NX.st), xx, H - B + 7 * s); });
  // the series
  const nb = fig.series.filter((S) => S.kind === 'bar').length; let bi = 0;
  for (const S of fig.series) {
    c.strokeStyle = S.color; c.fillStyle = S.color; c.lineWidth = 2 * s;
    const pts = S.x.map((xv2, i) => [X(AX.of(xv2)), Y(AY.of(S.y[i]))]);
    if (S.kind === 'bar') { const bw = (X(1) - X(0)) * 0.8 / nb; pts.forEach(([xx, yy]) => { const x2 = xx - (X(1) - X(0)) * 0.4 + bi * bw; c.fillRect(x2, Math.min(yy, Y(0)), bw - 1, Math.abs(Y(0) - yy)); }); bi++; continue; }
    if (S.ls && S.ls !== 'none' && pts.length > 1) { c.setLineDash(S.ls === '--' ? [8 * s, 5 * s] : S.ls === ':' ? [2 * s, 4 * s] : []); c.beginPath(); pts.forEach(([xx, yy], i) => (i ? c.lineTo(xx, yy) : c.moveTo(xx, yy))); c.stroke(); c.setLineDash([]); }
    if (S.marker) for (const [xx, yy] of pts) { c.beginPath(); c.arc(xx, yy, (S.kind === 'scatter' ? 4 : 3) * s, 0, 7); c.fill(); }
  }
  // the frame, the labels, the title, the legend
  c.strokeStyle = '#222'; c.lineWidth = Math.max(1, s); c.strokeRect(L, T, W - L - Rm, H - T - B);
  c.fillStyle = '#111'; c.textAlign = 'center'; c.textBaseline = 'alphabetic';
  if (fig.title) { c.font = `600 ${14 * s}px ${font}`; c.fillText(fig.title, (L + W - Rm) / 2, T - 10 * s); }
  c.font = `${12 * s}px ${font}`; if (fig.xlabel) c.fillText(fig.xlabel, (L + W - Rm) / 2, H - 10 * s);
  if (fig.ylabel) { c.save(); c.translate(14 * s, (T + H - B) / 2); c.rotate(-Math.PI / 2); c.fillText(fig.ylabel, 0, 0); c.restore(); }
  if (fig.legend) {
    const items = fig.series.filter((S) => S.label); if (items.length) {
      c.font = `${11 * s}px ${font}`; const w = Math.max(...items.map((S) => c.measureText(S.label).width)) + 40 * s, h = items.length * 18 * s + 8 * s; const lx = W - Rm - w - 8 * s, ly = T + 8 * s;
      c.fillStyle = 'rgba(255,255,255,0.9)'; c.fillRect(lx, ly, w, h); c.strokeStyle = '#ccc'; c.strokeRect(lx, ly, w, h);
      items.forEach((S, i) => { const yy = ly + 13 * s + i * 18 * s; c.strokeStyle = S.color; c.fillStyle = S.color; c.lineWidth = 2 * s; c.beginPath(); c.moveTo(lx + 6 * s, yy); c.lineTo(lx + 26 * s, yy); c.stroke(); c.fillStyle = '#222'; c.textAlign = 'left'; c.textBaseline = 'middle'; c.fillText(S.label, lx + 32 * s, yy); });
    }
  }
  c.restore();
}

// the messages (English, Hindi, Hinglish)
export const MSG20 = {
  N20_NOFILE: t3('FileNotFoundError: there is no file "{name}" on the Pi\'s card yet. Check its name, or make it first with open("{name}", "w").', 'FileNotFoundError: Pi के कार्ड पर "{name}" नाम की कोई फ़ाइल अभी नहीं है। नाम जाँचिए, या पहले open("{name}", "w") से बनाइए।', 'FileNotFoundError: Pi ke card par "{name}" naam ki koi file abhi nahi hai. Naam check karo, ya pehle open("{name}", "w") se banaiye.'),
  N20_EXISTS: t3('FileExistsError: "{name}" is already there; mode "x" only makes new files.', 'FileExistsError: "{name}" पहले से है; मोड "x" सिर्फ़ नई फ़ाइलें बनाता है।', 'FileExistsError: "{name}" pehle se hai; mode "x" sirf nayi files banata hai.'),
  N20_MODE: t3('ValueError: "{mode}" is not a mode here: use "r" (read), "w" (write a new file), "a" (add to the end).', 'ValueError: "{mode}" यहाँ कोई मोड नहीं: "r" (पढ़ना), "w" (नई फ़ाइल लिखना), "a" (आख़िर में जोड़ना) लिखिए।', 'ValueError: "{mode}" yahan koi mode nahi: "r" (padhna), "w" (nayi file likhna), "a" (aakhir mein jodna) likhiye.'),
  N20_CLOSED: t3('ValueError: I/O operation on closed file (the file was closed: write inside the with block).', 'ValueError: बंद फ़ाइल पर काम (फ़ाइल बंद हो चुकी है: with वाले हिस्से के अंदर लिखिए)।', 'ValueError: band file par kaam (file band ho chuki hai: with wale hisse ke andar likhiye).'),
  N20_NOT_R: t3('io.UnsupportedOperation: not readable (the file was opened to write: open it with "r" to read).', 'io.UnsupportedOperation: पढ़ा नहीं जा सकता (फ़ाइल लिखने के लिए खुली है: पढ़ने के लिए "r" से खोलिए)।', 'io.UnsupportedOperation: padha nahi ja sakta (file likhne ke liye khuli hai: padhne ke liye "r" se kholiye).'),
  N20_NOT_W: t3('io.UnsupportedOperation: not writable (the file was opened with "r": use "a" or "w" to write).', 'io.UnsupportedOperation: लिखा नहीं जा सकता (फ़ाइल "r" से खुली है: लिखने के लिए "a" या "w")।', 'io.UnsupportedOperation: likha nahi ja sakta (file "r" se khuli hai: likhne ke liye "a" ya "w").'),
  N20_WRITE_STR: t3('TypeError: write() argument must be str, not {t}. Turn it into text first, with str().', 'TypeError: write() को str चाहिए, {t} नहीं। पहले इसे str() से टेक्स्ट बनाइए।', 'TypeError: write() ko str chahiye, {t} nahi. Pehle ise str() se text banaiye.'),
  N20_NAME_STR: t3('TypeError: a file\'s name is text in quotes, not {t}.', 'TypeError: फ़ाइल का नाम quotes में टेक्स्ट होता है, {t} नहीं।', 'TypeError: file ka naam quotes mein text hota hai, {t} nahi.'),
  N20_CSV_FILE: t3('TypeError: csv.writer needs a file that is open to write.', 'TypeError: csv.writer को लिखने के लिए खुली फ़ाइल चाहिए।', 'TypeError: csv.writer ko likhne ke liye khuli file chahiye.'),
  N20_STAT_EMPTY: t3('StatisticsError: {fn}() needs at least one value.', 'StatisticsError: {fn}() को कम से कम एक मान चाहिए।', 'StatisticsError: {fn}() ko kam se kam ek value chahiye.'),
  N20_STAT_TWO: t3('StatisticsError: {fn}() needs at least two values.', 'StatisticsError: {fn}() को कम से कम दो मान चाहिए।', 'StatisticsError: {fn}() ko kam se kam do values chahiye.'),
  N20_STAT_LEN: t3('StatisticsError: x and y must have the same number of values.', 'StatisticsError: x और y में मानों की गिनती बराबर होनी चाहिए।', 'StatisticsError: x aur y mein values ki ginti barabar honi chahiye.'),
  N20_STAT_CONST: t3('StatisticsError: x is the same every time, so no line can be fitted.', 'StatisticsError: x हर बार एक ही है, तो कोई रेखा नहीं बैठ सकती।', 'StatisticsError: x har baar ek hi hai, to koi rekha nahi baith sakti.'),
  N20_PLOT_LEN: t3('ValueError: x and y must have the same length ({a} and {b} values).', 'ValueError: x और y की लंबाई बराबर होनी चाहिए ({a} और {b} मान)।', 'ValueError: x aur y ki lambai barabar honi chahiye ({a} aur {b} values).'),
};
void Dict; void PyErr;
