// DUET Robotics Lab 360, batch 5: the BBC micro:bit V2 (a compatible board of our own design), as a simulation with no 3D:
// the 5×5 display, buttons A and B, the touch logo, the accelerometer and its gestures, the compass, temperature, light
// level (read by the LEDs), the microphone, the speaker, the radio between two boards, the edge pins P0/P1/P2 with
// crocodile clips to parts (LED, buzzer, servo, soil probes) solved as a real circuit (solver.js), and the MicroPython
// modules a student imports: microbit, music, radio, audio (plus random, time, math from py.js).
// MBCore is the lesson's "world" (main.js: setWorld): it compiles the student's Python, runs one program per board on the
// lab's virtual clock (the board's MCU slot runs a small scheduler, so Run / Stop / Reset, the running line, the speed and
// the error box all work as for the Uno), keeps what happened for the lesson steps, draws its panel (hud) and, in the
// browser, loads the 3D board and scene (mbworld5.js).
import { compile as pyCompile, Nat, Mod, Flt, PyErr, tup, str, typeName, Tup, Dict, Rng, NAME_HINTS, Pend } from './py.js';
import { RtError } from './mcu.js';
import { solve } from './solver.js';
import { CPP, REGIONS, tx, L } from './i18n.js';
import { suggest } from './cpp.js';
import { LED_COLORS } from './parts.js';

const t3 = (en, hi, hg) => ({ en, hi, hg });
export const MBX = -2600; // the micro:bit desk stands away from the Arduino bench (bench mm): its hidden pins are never under the pointer
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const D2R = Math.PI / 180;
const nowMs = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

// ------------------------------------------------------------------ the 5×5 font (our own drawing), rows top to bottom
const FONT_SRC = `
 |00000 00000 00000 00000 00000
!|01000 01000 01000 00000 01000
"|01010 01010 00000 00000 00000
#|01010 11111 01010 11111 01010
$|01110 11000 01110 00011 11110
%|11001 10010 00100 01001 10011
&|01100 10010 01100 10010 01101
'|01000 01000 00000 00000 00000
(|00100 01000 01000 01000 00100
)|01000 00100 00100 00100 01000
*|00000 01010 00100 01010 00000
+|00000 00100 01110 00100 00000
,|00000 00000 00000 00100 01000
-|00000 00000 01110 00000 00000
.|00000 00000 00000 00000 01000
/|00001 00010 00100 01000 10000
0|01100 10010 10010 10010 01100
1|00100 01100 00100 00100 01110
2|11100 00010 01100 10000 11110
3|11110 00010 00100 10010 01100
4|00110 01010 10010 11111 00010
5|11111 10000 11110 00001 11110
6|00010 00100 01110 10001 01110
7|11111 00010 00100 01000 10000
8|01110 10001 01110 10001 01110
9|01110 10001 01110 00100 01000
:|00000 01000 00000 01000 00000
;|00000 00100 00000 00100 01000
<|00010 00100 01000 00100 00010
=|00000 01110 00000 01110 00000
>|01000 00100 00010 00100 01000
?|01110 00001 00110 00000 00100
@|01110 10001 10101 10011 01100
A|01100 10010 11110 10010 10010
B|11100 10010 11100 10010 11100
C|01110 10000 10000 10000 01110
D|11100 10010 10010 10010 11100
E|11110 10000 11100 10000 11110
F|11110 10000 11100 10000 10000
G|01110 10000 10011 10001 01110
H|10010 10010 11110 10010 10010
I|11100 01000 01000 01000 11100
J|11111 00010 00010 10010 01100
K|10010 10100 11000 10100 10010
L|10000 10000 10000 10000 11110
M|10001 11011 10101 10001 10001
N|10001 11001 10101 10011 10001
O|01100 10010 10010 10010 01100
P|11100 10010 11100 10000 10000
Q|01100 10010 10010 01100 00110
R|11100 10010 11100 10010 10001
S|01110 10000 01100 00010 11100
T|11111 00100 00100 00100 00100
U|10010 10010 10010 10010 01100
V|10001 10001 10001 01010 00100
W|10001 10001 10101 11011 10001
X|10010 10010 01100 10010 10010
Y|10001 01010 00100 00100 00100
Z|11110 00100 01000 10000 11110
[|01110 01000 01000 01000 01110
\\|10000 01000 00100 00010 00001
]|01110 00010 00010 00010 01110
^|00100 01010 00000 00000 00000
_|00000 00000 00000 00000 11111
\`|01000 00100 00000 00000 00000
a|00000 01110 10010 10010 01111
b|10000 10000 11100 10010 11100
c|00000 01110 10000 10000 01110
d|00010 00010 01110 10010 01110
e|01100 10010 11100 10000 01110
f|00110 01000 11100 01000 01000
g|01110 10010 01110 00010 01100
h|10000 10000 11100 10010 10010
i|01000 00000 01000 01000 01000
j|00010 00000 00010 00010 01100
k|10000 10100 11000 10100 10010
l|01000 01000 01000 01000 00110
m|00000 11011 10101 10101 10001
n|00000 11100 10010 10010 10010
o|00000 01100 10010 10010 01100
p|00000 11100 10010 11100 10000
q|00000 01110 10010 01110 00010
r|00000 01110 10000 10000 10000
s|00000 00110 01000 00100 11000
t|01000 11100 01000 01000 00110
u|00000 10010 10010 10010 01111
v|00000 10001 10001 01010 00100
w|00000 10001 10101 10101 01010
x|00000 10010 01100 01100 10010
y|00000 10010 01110 00010 01100
z|00000 11110 00100 01000 11110
{|00110 00100 01100 00100 00110
||01000 01000 01000 01000 01000
}|11000 01000 01100 01000 11000
~|00000 00000 01100 00011 00000`;
export const FONT = {};
for (const ln of FONT_SRC.split('\n')) { if (!ln) continue; const c = ln[0]; const rows = ln.slice(2).split(' '); FONT[c] = rows.map((r) => [...r].map((b) => (b === '1' ? 9 : 0))); }
const glyph = (c) => FONT[c] || FONT['?'];
function glyphCols(c) { // the glyph's columns (left to right), trimmed for proportional scrolling
  const g = glyph(c); if (c === ' ') return [[0, 0, 0, 0, 0], [0, 0, 0, 0, 0]];
  const cols = []; for (let x = 0; x < 5; x++) cols.push(g.map((row) => row[x]));
  let a = 0, b = 4; while (a < 4 && cols[a].every((v) => !v)) a++; while (b > a && cols[b].every((v) => !v)) b--;
  return cols.slice(a, b + 1);
}

// ------------------------------------------------------------------ images (pixel patterns as MicroPython has them)
const IMG = {
  HEART: '09090:99999:99999:09990:00900', HEART_SMALL: '00000:09090:09990:00900:00000', HAPPY: '00000:09090:00000:90009:09990', SMILE: '00000:00000:00000:90009:09990',
  SAD: '00000:09090:00000:09990:90009', CONFUSED: '00000:09090:00000:09090:90909', ANGRY: '90009:09090:00000:99999:90909', ASLEEP: '00000:99099:00000:09990:00000',
  SURPRISED: '09090:00000:00900:09090:00900', SILLY: '90009:00000:99999:00909:00999', FABULOUS: '99999:99099:00000:09090:09990', MEH: '09090:00000:00090:00900:09000',
  YES: '00000:00009:00090:90900:09000', NO: '90009:09090:00900:09090:90009',
  CLOCK12: '00900:00900:00900:00000:00000', CLOCK1: '00090:00090:00900:00000:00000', CLOCK2: '00000:00099:00900:00000:00000', CLOCK3: '00000:00000:00999:00000:00000',
  CLOCK4: '00000:00000:00900:00099:00000', CLOCK5: '00000:00000:00900:00090:00090', CLOCK6: '00000:00000:00900:00900:00900', CLOCK7: '00000:00000:00900:09000:09000',
  CLOCK8: '00000:00000:00900:99000:00000', CLOCK9: '00000:00000:99900:00000:00000', CLOCK10: '00000:99000:00900:00000:00000', CLOCK11: '09000:09000:00900:00000:00000',
  ARROW_N: '00900:09990:90909:00900:00900', ARROW_NE: '00999:00099:00909:09000:90000', ARROW_E: '00900:00090:99999:00090:00900', ARROW_SE: '90000:09000:00909:00099:00999',
  ARROW_S: '00900:00900:90909:09990:00900', ARROW_SW: '00009:00090:90900:99000:99900', ARROW_W: '00900:09000:99999:09000:00900', ARROW_NW: '99900:99000:90900:00090:00009',
  TRIANGLE: '00000:00900:09090:99999:00000', TRIANGLE_LEFT: '90000:99000:90900:90090:99999', CHESSBOARD: '09090:90909:09090:90909:09090', DIAMOND: '00900:09090:90009:09090:00900',
  DIAMOND_SMALL: '00000:00900:09090:00900:00000', SQUARE: '99999:90009:90009:90009:99999', SQUARE_SMALL: '00000:09990:09090:09990:00000', RABBIT: '90900:90900:99990:99090:99990',
  COW: '90009:90009:99999:09990:00900', MUSIC_CROTCHET: '00900:00900:00900:99900:99900', MUSIC_QUAVER: '00900:00990:00909:99900:99900', MUSIC_QUAVERS: '09999:09009:09009:99099:99099',
  PITCHFORK: '90909:90909:99999:00900:00900', XMAS: '00900:09990:00900:09990:99999', PACMAN: '09999:99090:99900:99990:09999', TARGET: '00900:09990:99099:09990:00900',
  TSHIRT: '99099:99999:09990:09990:09990', ROLLERSKATE: '00099:00099:99999:99999:09090', DUCK: '09900:99900:09999:09990:00000', HOUSE: '00900:09990:99999:09990:09090',
  TORTOISE: '00000:09990:99999:09090:00000', BUTTERFLY: '99099:99999:00900:99999:99099', STICKFIGURE: '00900:99999:00900:09090:90009', GHOST: '99999:90909:99999:99999:90909',
  SWORD: '00900:00900:00900:09990:00900', GIRAFFE: '99000:09000:09000:09990:09090', SKULL: '09990:90909:99999:09990:09990', UMBRELLA: '09990:99999:00900:90900:09900',
  SNAKE: '99000:99099:09090:09990:00000', SCISSORS: '99009:99090:00900:99090:99009',
};
export const IMG_NAMES = Object.keys(IMG);
const sigOf = (px) => { let s = ''; for (let i = 0; i < 25; i++) s += px[i] ? '1' : '0'; return s; };
const BY_SIG = {};
// an Image: w × h brightness values 0–9. Built-in ones are read-only (MicroPython says so too)
export class MBImage {
  constructor(w, h, px, name) { this.w = w; this.h = h; this.px = px || new Uint8Array(w * h); this.name = name || null; this.ro = !!name; }
  static parse(s, R) {
    const rows = String(s).replace(/\n/g, ':').split(':').filter((r, i, a) => r.length || i < a.length - 1);
    if (rows.length && rows[rows.length - 1] === '') rows.pop();
    const h = rows.length, w = Math.max(0, ...rows.map((r) => r.length)); const im = new MBImage(w, h);
    rows.forEach((r, y) => [...r].forEach((c, x) => { if (!/[0-9]/.test(c)) throw (R ? R.err('ValueError', 'MB_IMAGE_STR', {}) : new Error('image')); im.px[y * w + x] = +c; }));
    return im;
  }
  get pyType() { return 'Image'; }
  copy() { return new MBImage(this.w, this.h, this.px.slice()); }
  get(x, y) { return x >= 0 && y >= 0 && x < this.w && y < this.h ? this.px[y * this.w + x] : 0; }
  shift(dx, dy) { const o = new MBImage(this.w, this.h); for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) o.px[y * this.w + x] = this.get(x + dx, y + dy); return o; }
  as5() { const p = new Uint8Array(25); for (let y = 0; y < 5; y++) for (let x = 0; x < 5; x++) p[y * 5 + x] = this.get(x, y); return p; }
  pyStr() { let s = ''; for (let y = 0; y < this.h; y++) { for (let x = 0; x < this.w; x++) s += this.px[y * this.w + x]; s += ':'; } return `Image('${s}')`; }
  pyEq(o) { return o instanceof MBImage && o.w === this.w && o.h === this.h && o.px.every((v, i) => v === this.px[i]); }
  pyAdd(o) { if (!(o instanceof MBImage)) return undefined; const r = new MBImage(this.w, this.h); for (let i = 0; i < r.px.length; i++) r.px[i] = Math.min(9, this.px[i] + o.get(i % this.w, Math.floor(i / this.w))); return r; }
  pyMul(k) { if (typeof k !== 'number' && !(k instanceof Flt)) return undefined; const f = k instanceof Flt ? k.v : k; const r = new MBImage(this.w, this.h); for (let i = 0; i < r.px.length; i++) r.px[i] = clamp(Math.round(this.px[i] * f), 0, 9); return r; }
  pyNames() { return ['width', 'height', 'set_pixel', 'get_pixel', 'shift_left', 'shift_right', 'shift_up', 'shift_down', 'crop', 'copy', 'invert', 'fill']; }
  pyGet(name, R) {
    const me = this; const nat = (sig, fn) => new Nat(name, sig, fn);
    const rw = (R2) => { if (me.ro) throw R2.err('TypeError', 'MB_IMAGE_RO', {}); };
    switch (name) {
      case 'width': return nat([], () => me.w);
      case 'height': return nat([], () => me.h);
      case 'set_pixel': return nat(['x', 'y', 'value'], (R2, x, y, v) => { rw(R2); x = int(R2, x); y = int(R2, y); v = int(R2, v); if (x < 0 || y < 0 || x >= me.w || y >= me.h) throw R2.err('ValueError', 'MB_PIXEL', { x, y }); if (v < 0 || v > 9) throw R2.err('ValueError', 'MB_BRIGHT', { v }); me.px[y * me.w + x] = v; return null; });
      case 'get_pixel': return nat(['x', 'y'], (R2, x, y) => { x = int(R2, x); y = int(R2, y); if (x < 0 || y < 0 || x >= me.w || y >= me.h) throw R2.err('ValueError', 'MB_PIXEL', { x, y }); return me.px[y * me.w + x]; });
      case 'shift_left': return nat(['n'], (R2, n) => me.shift(int(R2, n), 0));
      case 'shift_right': return nat(['n'], (R2, n) => me.shift(-int(R2, n), 0));
      case 'shift_up': return nat(['n'], (R2, n) => me.shift(0, int(R2, n)));
      case 'shift_down': return nat(['n'], (R2, n) => me.shift(0, -int(R2, n)));
      case 'crop': return nat(['x', 'y', 'w', 'h'], (R2, x, y, w, h) => { const o = new MBImage(int(R2, w), int(R2, h)); for (let j = 0; j < o.h; j++) for (let i = 0; i < o.w; i++) o.px[j * o.w + i] = me.get(i + int(R2, x), j + int(R2, y)); return o; });
      case 'copy': return nat([], () => me.copy());
      case 'invert': return nat([], () => { const o = me.copy(); o.px = o.px.map((v) => 9 - v); return o; });
      case 'fill': return nat(['value'], (R2, v) => { rw(R2); me.px.fill(clamp(int(R2, v), 0, 9)); return null; });
    }
    return undefined;
  }
}
for (const [k, s] of Object.entries(IMG)) { const im = MBImage.parse(s); im.name = k; im.ro = true; IMG[k] = im; BY_SIG[sigOf(im.px)] = BY_SIG[sigOf(im.px)] || k; }
const int = (R, v) => { if (typeof v === 'number') return Math.trunc(v); if (typeof v === 'boolean') return +v; if (v instanceof Flt) return Math.trunc(v.v); throw R.err('TypeError', 'P_NEED_INT', { fn: 'micro:bit', t: typeName(v) }); };
const num = (R, v) => { if (typeof v === 'number') return v; if (typeof v === 'boolean') return +v; if (v instanceof Flt) return v.v; throw R.err('TypeError', 'P_NEED_NUM', { fn: 'micro:bit', t: typeName(v) }); };
// the Image class: Image.HEART, Image('09090:…'), Image(5, 5)
const ImageClass = {
  pyType: 'type', pyName: 'Image',
  pyNames: () => [...IMG_NAMES, 'ALL_CLOCKS', 'ALL_ARROWS'],
  pyGet(name) {
    if (IMG[name]) return IMG[name];
    if (name === 'ALL_CLOCKS') return ['CLOCK12', 'CLOCK1', 'CLOCK2', 'CLOCK3', 'CLOCK4', 'CLOCK5', 'CLOCK6', 'CLOCK7', 'CLOCK8', 'CLOCK9', 'CLOCK10', 'CLOCK11'].map((k) => IMG[k]);
    if (name === 'ALL_ARROWS') return ['ARROW_N', 'ARROW_NE', 'ARROW_E', 'ARROW_SE', 'ARROW_S', 'ARROW_SW', 'ARROW_W', 'ARROW_NW'].map((k) => IMG[k]);
    return undefined;
  },
  pyCall(R, args) {
    if (!args.length) return new MBImage(5, 5);
    if (typeof args[0] === 'string') return args[0].length === 1 ? new MBImage(5, 5, Uint8Array.from(glyph(args[0]).flat())) : MBImage.parse(args[0], R);
    const w = int(R, args[0]), h = int(R, args[1] !== undefined ? args[1] : args[0]); const im = new MBImage(w, h);
    if (args[2]) { const b = R.list(args[2]); for (let i = 0; i < Math.min(b.length, w * h); i++) im.px[i] = clamp(int(R, b[i]), 0, 9); }
    return im;
  },
  pyStr: () => "<class 'Image'>",
};

// ------------------------------------------------------------------ music: notes like "c4:4" (note, octave, ticks)
const NOTE_I = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 };
export const TUNES = { // our own transcriptions of old public-domain tunes, and short sound effects
  BA_DING: ['b5:1', 'e6:3'], JUMP_UP: ['c5:1', 'd', 'e', 'f', 'g'], JUMP_DOWN: ['g5:1', 'f', 'e', 'd', 'c'],
  POWER_UP: ['g4:1', 'c5', 'e', 'g:2', 'e:1', 'g:3'], POWER_DOWN: ['g5:1', 'd#', 'c', 'g4:2', 'b:1', 'c5:3'],
  DADADADUM: ['r4:2', 'g', 'g', 'g', 'eb:8', 'r:2', 'f', 'f', 'f', 'd:8'],
  BIRTHDAY: ['c4:3', 'c:1', 'd:4', 'c:4', 'f', 'e:8', 'c:3', 'c:1', 'd:4', 'c:4', 'g', 'f:8', 'c:3', 'c:1', 'c5:4', 'a4', 'f', 'e', 'd', 'a#:3', 'a#:1', 'a:4', 'f', 'g', 'f:8'],
  ODE: ['e4', 'e', 'f', 'g', 'g', 'f', 'e', 'd', 'c', 'c', 'd', 'e', 'e:6', 'd:2', 'd:8', 'e:4', 'e', 'f', 'g', 'g', 'f', 'e', 'd', 'c', 'c', 'd', 'e', 'd:6', 'c:2', 'c:8'],
  ENTERTAINER: ['d4:1', 'd#', 'e', 'c5:2', 'e4:1', 'c5:2', 'e4:1', 'c5:3', 'c6:1', 'd', 'd#', 'e', 'c', 'd', 'e:2', 'b5:1', 'd6:2', 'c:4'],
  PRELUDE: ['c4:1', 'e', 'g', 'c5', 'e', 'g4', 'c5', 'e', 'c4', 'e', 'g', 'c5', 'e', 'g4', 'c5', 'e', 'c4', 'd', 'a', 'd5', 'f', 'a4', 'd5', 'f', 'c4', 'd', 'a', 'd5', 'f', 'a4', 'd5', 'f'],
  WEDDING: ['c4:4', 'f:3', 'f:1', 'f:8', 'c:4', 'g:3', 'e:1', 'f:8', 'c:4', 'f:3', 'a:1', 'c5:4', 'a4:3', 'f:1', 'f:4', 'e:3', 'f:1', 'g:8'],
  FUNERAL: ['c3:4', 'c:3', 'c:1', 'c:4', 'd#:3', 'd:1', 'd:3', 'c:1', 'c:3', 'b2:1', 'c3:4'],
  RINGTONE: ['c4:1', 'd', 'e:2', 'g', 'd:1', 'e', 'f:2', 'a', 'e:1', 'f', 'g:2', 'b', 'c5:4'],
  PUNCHLINE: ['c4:3', 'g3:1', 'f#', 'g', 'g#:3', 'g', 'r', 'b', 'c4'],
  BADDY: ['c3:3', 'r', 'd:2', 'd#', 'r', 'c', 'r', 'f#:8'], CHASE: ['a4:1', 'b', 'c5', 'b4', 'a:2', 'r', 'a:1', 'b', 'c5', 'd', 'c', 'b4', 'a:2'],
  WAWAWAWAA: ['e3:3', 'r:1', 'd#:3', 'r:1', 'd:4', 'r:1', 'c#:8'], BLUES: ['c2:2', 'e', 'g', 'a', 'a#', 'a', 'g', 'e', 'c2:2', 'e', 'g', 'a', 'a#', 'a', 'g', 'e'],
  FUNK: ['c2:2', 'c3:1', 'r', 'c2:2', 'c3:1', 'r', 'g2:2', 'a#', 'c3:4'], PYTHON: ['d5:1', 'b4', 'r', 'b', 'b', 'a#', 'b', 'g5', 'r', 'd', 'd', 'r', 'b4', 'c5', 'r', 'c', 'c', 'r', 'd', 'e:5', 'c:1', 'a4'],
};
// a tune -> [{ f (Hz, 0 = rest), ms }]
function parseTune(R, tune, tempo) {
  const list = typeof tune === 'string' ? [tune] : R.list(tune); const out = []; let oct = 4, dur = 4;
  const tick = 60000 / tempo.bpm / tempo.ticks;
  for (const n0 of list) {
    const n = String(n0).trim().toLowerCase(); const m = /^([a-gr])([#b]?)(\d)?(?::(\d+))?$/.exec(n);
    if (!m) throw R.err('ValueError', 'MB_NOTE', { note: String(n0) });
    if (m[3]) oct = +m[3]; if (m[4]) dur = +m[4];
    let f = 0; if (m[1] !== 'r') { const semi = NOTE_I[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + (oct - 4) * 12 - 9; f = 440 * Math.pow(2, semi / 12); }
    out.push({ f, ms: dur * tick });
  }
  return out;
}
const SOUNDS = { // audio.play(Sound.HAPPY): little made-up sweeps
  GIGGLE: [[700, 60], [900, 60], [700, 60], [1000, 60], [800, 80]], HAPPY: [[523, 90], [659, 90], [784, 160]], HELLO: [[440, 90], [660, 160]], MYSTERIOUS: [[330, 200], [311, 200], [294, 300]],
  SAD: [[392, 200], [349, 200], [311, 350]], SLIDE: [[400, 60], [500, 60], [600, 60], [700, 60], [800, 60]], SOARING: [[523, 120], [698, 120], [880, 220]], SPRING: [[300, 50], [900, 50], [300, 50], [900, 50]],
  TWINKLE: [[1200, 60], [1500, 60], [1800, 60], [1500, 60]], YAWN: [[600, 200], [400, 300], [300, 300]],
};

// ------------------------------------------------------------------ the board
const PADS = ['P0', 'P1', 'P2', '3V', 'GND'];
const GESTURES = ['up', 'down', 'left', 'right', 'face up', 'face down', 'freefall', '3g', '6g', '8g', 'shake'];
export class MicroBit {
  constructor(core, k) {
    this.core = core; this.k = k; this.name = k ? 'friend' : 'you';
    this.tilt = { pitch: 0, roll: 0, flip: false }; this.yaw = 0; // how the board is held (degrees); yaw: where its logo points (0 = north)
    this.shakeT = -1; this.calibrated = false; this.btn = { a: mkBtn(), b: mkBtn(), logo: mkBtn(), P0: mkBtn(), P1: mkBtn(), P2: mkBtn() }; // P0–P2: a finger on the pin (is_touched)
    this.powerOff();
  }
  powerOff() { this.on = false; this.disp = { buf: new Uint8Array(25), anim: null, lit: true }; this.sound = null; this.pins = {}; this.radio = null; }
  // a fresh start of the program (Run / Reset): the board's own state, not how it is held
  reset() {
    this.on = true; this.t0 = 0; this.disp = { buf: new Uint8Array(25), anim: null, lit: true }; this.sound = null; this.vol = 1; this.speakerOn = true;
    this.pins = {}; for (const p of ['P0', 'P1', 'P2']) this.pins[p] = { mode: 'unused', level: 0, duty: 0, period: 20000, pull: 'down', music: false };
    this.radio = { on: false, group: 0, channel: 7, length: 32, queue: 3, power: 6, q: [] };
    this.tempo = { ticks: 4, bpm: 120 };
    for (const b of Object.values(this.btn)) { b.presses = 0; b.was = false; }
    this.gest = { cur: 'face up', hist: [] }; this.micEv = { hist: [], cur: null, loudAt: -1 }; this.thresh = { loud: 128, quiet: 30 };
    this.shakeT = -1; // (batch 8: the clock starts again at 0, so an old shake's time would lie in the future)
    this.err = null;
  }
  get now() { return this.core.now; }
  // ---------------------------------------------------------------- the display
  pixelsAt(T) {
    const d = this.disp; if (!this.on) return ZERO25;
    const a = d.anim;
    if (a) {
      const k = Math.floor((T - a.start) / a.delay);
      if (a.loop) return a.frames[((k % a.frames.length) + a.frames.length) % a.frames.length];
      if (k < a.frames.length) return a.frames[Math.max(0, k)];
      d.buf = a.final ? a.final.slice() : a.frames[a.frames.length - 1].slice(); d.anim = null;
    }
    return d.buf;
  }
  settle(T) { const p = this.pixelsAt(T); if (this.disp.anim) { this.disp.buf = p.slice(); this.disp.anim = null; } } // stop an animation where it is
  setImage(px, T, why) { this.settle(T); this.disp.buf = px.slice(); this.core.seeImage(this, px, why); }
  animate(frames, delayMs, T, loop, final, why) {
    this.disp.anim = { frames, delay: Math.max(1, delayMs) * 1000, start: T, loop: !!loop, final }; this.core.seeAnim(this, frames, why);
    return frames.length * delayMs;
  }
  scrollFrames(text, mono) {
    const cols = []; for (let i = 0; i < 5; i++) cols.push([0, 0, 0, 0, 0]);
    for (const c of String(text)) { const gc = mono ? [0, 1, 2, 3, 4].map((x) => glyph(c).map((r) => r[x])) : glyphCols(c); cols.push(...gc, [0, 0, 0, 0, 0]); }
    for (let i = 0; i < 4; i++) cols.push([0, 0, 0, 0, 0]);
    const frames = []; for (let k = 1; k + 5 <= cols.length; k++) { const f = new Uint8Array(25); for (let x = 0; x < 5; x++) for (let y = 0; y < 5; y++) f[y * 5 + x] = cols[k + x][y]; frames.push(f); }
    return frames;
  }
  // ---------------------------------------------------------------- sensors
  accel(T) { // milli-g, as the micro:bit reports it (face up, flat: z = -1024)
    const { pitch, roll, flip } = this.tilt; const p = pitch * D2R, r = roll * D2R; let x = 1024 * Math.sin(r), y = -1024 * Math.sin(p) * Math.cos(r), z = -1024 * Math.cos(p) * Math.cos(r);
    if (flip) { z = -z; x = -x; }
    if (this.shakeT >= 0 && T - this.shakeT < 450000) { const s = (T - this.shakeT) / 1e6; const a = 1700 * Math.sin(s * 2 * Math.PI * 9) * (1 - s / 0.45); x += a; y += a * 0.4; z += a * 0.3; }
    const n = (k) => Math.round(k + (Math.sin(T / 1e5 + k) * 6));
    return [n(x), n(y), n(z)];
  }
  gestureOf(T) {
    if (this.shakeT >= 0 && T - this.shakeT < 450000) return 'shake';
    const [x, y, z] = this.accel(T); const th = 760;
    if (x < -th) return 'left'; if (x > th) return 'right'; if (y < -th) return 'up'; if (y > th) return 'down'; if (z < -th) return 'face up'; if (z > th) return 'face down';
    return '';
  }
  heading() { return Math.round(((this.yaw % 360) + 360) % 360) % 360; }
  lightLevel() { const v = this.core.env.light; return clamp(Math.round(255 * Math.pow(clamp(v, 0, 1), 1.6)), 0, 255); }
  temperature() { return Math.round(this.core.env.temp + 1.4 + (this.k ? -0.4 : 0)); }
  soundLevel(T) { let s = this.core.env.sound; if (this.micEv.loudAt >= 0 && T - this.micEv.loudAt < 220000) s = Math.max(s, 230 - (T - this.micEv.loudAt) / 2000); return clamp(Math.round(s), 0, 255); }
  press(id, down) {
    const b = this.btn[id]; if (!b) return; if (down && !b.down) { b.presses++; b.was = true; b.at = this.now; this.core.obs.press[id] = (this.core.obs.press[id] || 0) + (this.k ? 0 : 1); this.core.obs.pressAny = true; if (this.k) this.core.obs.friendPress = (this.core.obs.friendPress || 0) + 1; }
    b.down = !!down; this.core.dirty();
  }
  shake() { this.shakeT = this.now; this.core.obs.shakes[this.k] = (this.core.obs.shakes[this.k] || 0) + 1; this.core.dirty(); }
  // ---------------------------------------------------------------- the Python side: the modules this board gives its program
  host() {
    const B = this, core = this.core;
    return {
      modules: { microbit: (R) => B.mod(R, 'microbit'), music: (R) => B.musicMod(R), radio: (R) => B.radioMod(R), audio: (R) => B.audioMod(R), speech: () => null, neopixel: () => null, machine: () => null },
      print: (s, R) => { if (!B.k) core.serial(s, R.t); },
      hint: (name, G) => {
        if (MB_TOP.includes(name) && !G[name]) return { code: 'P_NAME_MOD', args: { name, mod: 'microbit', fix: 'from microbit import *' } };
        if (['music', 'radio', 'random', 'time', 'math', 'audio', 'utime'].includes(name)) return { code: 'P_NAME_MOD', args: { name, mod: name, fix: 'import ' + name } };
        return null;
      },
      names: () => MB_TOP,
    };
  }
  mod(R, name) {
    const B = this; const nat = (n, sig, fn, o) => new Nat(n, sig, fn, o);
    const blocking = { blocking: true };
    const display = obj('display', {
      show: nat('show', ['image', 'delay=400', 'wait=True', 'loop=False', 'clear=False'], function* (R2, v, delay, wait, loop, clear) {
        const T = R2.t; delay = num(R2, delay);
        if (v instanceof MBImage) { B.setImage(v.as5(), T, { img: v.name }); return null; }
        let frames; let why = {};
        if (typeof v === 'string' || typeof v === 'number' || v instanceof Flt || typeof v === 'boolean') {
          const s = str(v); why = { text: s, num: typeof v === 'number' || v instanceof Flt ? (v instanceof Flt ? v.v : v) : undefined };
          if ([...s].length === 1) { B.setImage(Uint8Array.from(glyph(s).flat()), T, why); return null; }
          frames = [...s].map((c) => Uint8Array.from(glyph(c).flat()));
        } else if (Array.isArray(v)) frames = v.map((x) => (x instanceof MBImage ? x.as5() : Uint8Array.from(glyph(str(x)[0] || ' ').flat())));
        else throw R2.err('TypeError', 'MB_SHOW', { t: typeName(v) });
        if (!frames.length) return null;
        if (frames.length === 1 && !loop) { B.setImage(frames[0], T, why); return null; }
        const names = Array.isArray(v) ? v.map((x) => (x instanceof MBImage ? x.name : null)) : null;
        const ms = B.animate(frames, delay, T, loop, clear ? new Uint8Array(25) : null, Object.assign(why, { names }));
        if (truthy(wait) && !truthy(loop)) yield* R2.sleep(ms); else if (truthy(wait) && truthy(loop)) for (;;) yield* R2.sleep(1e6);
        return null;
      }, blocking),
      scroll: nat('scroll', ['text', 'delay=150', 'wait=True', 'loop=False', 'monospace=False'], function* (R2, v, delay, wait, loop, mono) {
        const s = str(v); const frames = B.scrollFrames(s, truthy(mono));
        const ms = B.animate(frames, num(R2, delay), R2.t, truthy(loop), new Uint8Array(25), { text: s, scroll: true, num: typeof v === 'number' || v instanceof Flt ? (v instanceof Flt ? v.v : v) : undefined });
        if (truthy(wait) && !truthy(loop)) yield* R2.sleep(ms); else if (truthy(wait) && truthy(loop)) for (;;) yield* R2.sleep(1e6);
        return null;
      }, blocking),
      clear: nat('clear', [], (R2) => { B.setImage(new Uint8Array(25), R2.t, { clear: true }); return null; }),
      set_pixel: nat('set_pixel', ['x', 'y', 'value'], (R2, x, y, v) => { x = int(R2, x); y = int(R2, y); v = int(R2, v); if (x < 0 || x > 4 || y < 0 || y > 4) throw R2.err('ValueError', 'MB_PIXEL', { x, y }); if (v < 0 || v > 9) throw R2.err('ValueError', 'MB_BRIGHT', { v }); B.settle(R2.t); B.disp.buf[y * 5 + x] = v; B.core.seeImage(B, B.disp.buf, { pixel: true }); return null; }),
      get_pixel: nat('get_pixel', ['x', 'y'], (R2, x, y) => { x = int(R2, x); y = int(R2, y); if (x < 0 || x > 4 || y < 0 || y > 4) throw R2.err('ValueError', 'MB_PIXEL', { x, y }); return B.pixelsAt(R2.t)[y * 5 + x]; }),
      on: nat('on', [], () => { B.disp.lit = true; return null; }), off: nat('off', [], () => { B.disp.lit = false; return null; }), is_on: nat('is_on', [], () => B.disp.lit),
      read_light_level: nat('read_light_level', [], () => { B.core.obs.light = true; return B.lightLevel(); }),
    });
    const button = (id) => obj('button_' + id, {
      is_pressed: nat('is_pressed', [], () => !!B.btn[id].down),
      was_pressed: nat('was_pressed', [], () => { const w = B.btn[id].was; B.btn[id].was = false; return w; }),
      get_presses: nat('get_presses', [], () => { const n = B.btn[id].presses; B.btn[id].presses = 0; B.btn[id].was = false; return n; }),
    });
    const pin = (p) => B.pinObj(R, p);
    const accelerometer = obj('accelerometer', {
      get_x: nat('get_x', [], (R2) => B.accel(R2.t)[0]), get_y: nat('get_y', [], (R2) => B.accel(R2.t)[1]), get_z: nat('get_z', [], (R2) => B.accel(R2.t)[2]),
      get_values: nat('get_values', [], (R2) => tup(B.accel(R2.t))),
      get_strength: nat('get_strength', [], (R2) => { const [x, y, z] = B.accel(R2.t); return Math.round(Math.hypot(x, y, z)); }),
      current_gesture: nat('current_gesture', [], (R2) => B.gestureOf(R2.t)),
      is_gesture: nat('is_gesture', ['name'], (R2, g) => { chkGesture(R2, g); return B.gestureOf(R2.t) === g; }),
      was_gesture: nat('was_gesture', ['name'], (R2, g) => { chkGesture(R2, g); const i = B.gest.hist.indexOf(g); if (i < 0) return false; B.gest.hist = B.gest.hist.filter((x) => x !== g); return true; }),
      get_gestures: nat('get_gestures', [], () => { const h = tup(B.gest.hist); B.gest.hist = []; return h; }),
      set_range: nat('set_range', ['value'], () => null),
    });
    const compass = obj('compass', {
      calibrate: nat('calibrate', [], function* (R2) { yield* B.calibrate(R2); return null; }, blocking),
      is_calibrated: nat('is_calibrated', [], () => B.calibrated),
      clear_calibration: nat('clear_calibration', [], () => { B.calibrated = false; return null; }),
      heading: nat('heading', [], function* (R2) { if (!B.calibrated) yield* B.calibrate(R2); B.core.obs.heading = true; return B.heading(); }, blocking),
      get_x: nat('get_x', [], () => Math.round(30000 * Math.sin(-B.yaw * D2R))), get_y: nat('get_y', [], () => Math.round(30000 * Math.cos(B.yaw * D2R))), get_z: nat('get_z', [], () => -38000),
      get_field_strength: nat('get_field_strength', [], () => 48500),
    });
    const microphone = obj('microphone', {
      sound_level: nat('sound_level', [], (R2) => { B.core.obs.mic = true; return B.soundLevel(R2.t); }),
      current_event: nat('current_event', [], (R2) => { const l = B.soundLevel(R2.t); return l > B.thresh.loud ? EV.LOUD : l < B.thresh.quiet ? EV.QUIET : null; }),
      was_event: nat('was_event', ['event'], (R2, e) => { const i = B.micEv.hist.indexOf(e); if (i < 0) return false; B.micEv.hist = B.micEv.hist.filter((x) => x !== e); return true; }),
      is_event: nat('is_event', ['event'], (R2, e) => { const l = B.soundLevel(R2.t); return e === EV.LOUD ? l > B.thresh.loud : e === EV.QUIET ? l < B.thresh.quiet : false; }),
      get_events: nat('get_events', [], () => { const h = tup(B.micEv.hist); B.micEv.hist = []; return h; }),
      set_threshold: nat('set_threshold', ['event', 'value'], (R2, e, v) => { if (e === EV.LOUD) B.thresh.loud = int(R2, v); else B.thresh.quiet = int(R2, v); return null; }),
    });
    const speaker = obj('speaker', { on: nat('on', [], () => { B.speakerOn = true; return null; }), off: nat('off', [], () => { B.speakerOn = false; return null; }), is_on: nat('is_on', [], () => B.speakerOn) });
    const attrs = {
      display, Image: ImageClass, button_a: button('a'), button_b: button('b'), pin_logo: B.logoObj(), accelerometer, compass, microphone, speaker,
      pin0: pin('P0'), pin1: pin('P1'), pin2: pin('P2'), pin_speaker: obj('pin_speaker', {}),
      SoundEvent: obj('SoundEvent', { LOUD: EV.LOUD, QUIET: EV.QUIET }), Sound: SOUND_OBJ, audio: B.audioMod(R),
      sleep: nat('sleep', ['ms'], function* (R2, ms) { yield* R2.sleep(num(R2, ms)); return null; }, blocking),
      running_time: nat('running_time', [], (R2) => Math.floor(R2.t / 1000)),
      temperature: nat('temperature', [], () => { B.core.obs.temp = true; return B.temperature(); }),
      panic: nat('panic', ['n=0'], (R2, n) => { throw R2.err('RuntimeError', 'MB_PANIC', { n: int(R2, n) }); }),
      reset: nat('reset', [], () => { B.core.wantReset = true; return null; }),
      set_volume: nat('set_volume', ['v'], (R2, v) => { B.vol = clamp(int(R2, v), 0, 255) / 255; return null; }),
      scale: nat('scale', '*', (R2, args, kw) => { const v = num(R2, args[0]); const f = R2.list(kw && kw.from_ || args[1]), t = R2.list(kw && kw.to || args[2]); const a = num(R2, f[0]), b = num(R2, f[1]), c = num(R2, t[0]), d = num(R2, t[1]); const r = c + (v - a) * (d - c) / (b - a); return typeof t[0] === 'number' && typeof t[1] === 'number' ? Math.round(r) : new Flt(r); }),
      i2c: obj('i2c', {}), spi: obj('spi', {}), uart: obj('uart', {}),
    };
    for (let i = 3; i <= 20; i++) if (![17, 18].includes(i)) attrs['pin' + i] = B.pinObj(R, 'P' + i);
    return new Mod(name, attrs);
  }
  logoObj() { const B = this; return obj('pin_logo', { is_touched: new Nat('is_touched', [], () => !!B.btn.logo.down), was_touched: new Nat('was_touched', [], () => { const w = B.btn.logo.was; B.btn.logo.was = false; return w; }), get_touches: new Nat('get_touches', [], () => { const n = B.btn.logo.presses; B.btn.logo.presses = 0; return n; }), set_touch_mode: new Nat('set_touch_mode', ['mode'], () => null) }); }
  pinObj(R, p) {
    const B = this, core = this.core; const P = () => B.pins[p] || (B.pins[p] = { mode: 'unused', level: 0, duty: 0, period: 20000, pull: 'down' });
    const nat = (n, sig, fn) => new Nat(n, sig, fn);
    const o = obj('pin' + p.slice(1), {
      write_digital: nat('write_digital', ['value'], (R2, v) => { const q = P(); q.mode = 'out'; q.level = int(R2, v) ? 1 : 0; q.duty = q.level; core.pinChanged(B, p); return null; }),
      read_digital: nat('read_digital', [], (R2) => { const q = P(); if (q.mode !== 'out' && q.mode !== 'in') { q.mode = 'in'; if (q.pullSet !== true) q.pull = 'down'; core.pinChanged(B, p); } return core.readPin(B, p, false, R2.t) > 1.65 ? 1 : 0; }),
      write_analog: nat('write_analog', ['value'], (R2, v) => { const n = num(R2, v); if (n < 0 || n > 1023) throw R2.err('ValueError', 'MB_ANALOG_RANGE', { v: Math.round(n) }); const q = P(); q.mode = 'pwm'; q.duty = n / 1023; q.level = q.duty; core.pinChanged(B, p); return null; }),
      read_analog: nat('read_analog', [], (R2) => { const q = P(); if (q.mode !== 'ain') { q.mode = 'ain'; core.pinChanged(B, p); } const v = core.readPin(B, p, true, R2.t); const n = clamp(Math.round(v / 3.3 * 1023), 0, 1023); core.obs.analog[p] = n; return n; }),
      set_analog_period: nat('set_analog_period', ['period'], (R2, ms) => { const v = num(R2, ms); if (v < 1) throw R2.err('ValueError', 'MB_PERIOD', {}); P().period = v * 1000; core.pinChanged(B, p); return null; }),
      set_analog_period_microseconds: nat('set_analog_period_microseconds', ['period'], (R2, us) => { const v = num(R2, us); if (v < 256) throw R2.err('ValueError', 'MB_PERIOD', {}); P().period = v; core.pinChanged(B, p); return null; }),
      get_analog_period_microseconds: nat('get_analog_period_microseconds', [], () => P().period),
      is_touched: nat('is_touched', [], () => !!(B.btn[p] && B.btn[p].down)),
      set_pull: nat('set_pull', ['value'], (R2, v) => { const q = P(); q.pull = v === 1 ? 'up' : v === 2 ? 'down' : 'none'; q.pullSet = true; core.pinChanged(B, p); return null; }),
      get_pull: nat('get_pull', [], () => (P().pull === 'up' ? 1 : P().pull === 'down' ? 2 : 0)),
      get_mode: nat('get_mode', [], () => ({ unused: 'unused', out: 'write_digital', pwm: 'write_analog', in: 'read_digital', ain: 'read_analog' }[P().mode] || 'unused')),
      set_touch_mode: nat('set_touch_mode', ['mode'], () => null),
    });
    o.attrs.PULL_UP = 1; o.attrs.PULL_DOWN = 2; o.attrs.NO_PULL = 0; o.attrs.RESISTIVE = 0; o.attrs.CAPACITIVE = 1;
    return o;
  }
  // compass.calibrate(): "TILT TO FILL SCREEN", then tilt the board until every LED is lit (as a real micro:bit asks)
  *calibrate(R) {
    const s = 'TILT TO FILL SCREEN'; const fr = this.scrollFrames(s); this.animate(fr, 70, R.t, false, new Uint8Array(25), { text: s, calib: true });
    yield* R.sleep(fr.length * 70);
    const filled = new Uint8Array(25); this.calib = { filled, on: true }; let blink = 0;
    for (;;) {
      const x = clamp(Math.round(2 + this.tilt.roll / 22), 0, 4), y = clamp(Math.round(2 - this.tilt.pitch / 22), 0, 4); filled[y * 5 + x] = 9;
      const show = filled.slice(); show[y * 5 + x] = (blink++ % 4 < 2) ? 9 : 0; this.disp.anim = null; this.disp.buf = show;
      if (filled.every((v) => v)) break;
      yield* R.sleep(30);
    }
    this.calib = null; this.calibrated = true; this.core.obs.calibrated = true;
    this.disp.buf = IMG.HAPPY.as5(); yield* R.sleep(600); this.disp.buf = new Uint8Array(25);
  }
  // ---------------------------------------------------------------- sound: music on the speaker and on a pin
  play(notes, T, pinName, loop) {
    const total = notes.reduce((s, n) => s + n.ms, 0);
    this.sound = { notes, start: T, total, loop: !!loop, pin: pinName || 'P0' };
    if (pinName && this.pins[pinName]) { this.pins[pinName].music = true; this.core.pinChanged(this, pinName); }
    this.core.obs.music = (this.core.obs.music || 0) + 1;
    return total;
  }
  toneAt(T) { // the frequency playing now (0: silence)
    const s = this.sound; if (!s || !this.on) return 0; let t = (T - s.start) / 1000;
    if (s.total < 0) return s.notes[0].f; // music.pitch() with no duration: until stopped
    if (t >= s.total) { if (!s.loop) { this.stopSound(); return 0; } t %= s.total; }
    for (const n of s.notes) { if (t < n.ms) return n.f && t < n.ms - Math.min(15, n.ms * 0.1) ? n.f : 0; t -= n.ms; }
    return 0;
  }
  stopSound() { const s = this.sound; this.sound = null; if (s && s.pin && this.pins[s.pin]) { this.pins[s.pin].music = false; this.core.pinChanged(this, s.pin); } }
  musicMod() {
    const B = this; const nat = (n, sig, fn, o) => new Nat(n, sig, fn, o); const bl = { blocking: true };
    const pinName = (v) => (v && v.pyName && /^pin\d+$/.test(v.pyName) ? 'P' + v.pyName.slice(3) : v === null ? null : 'P0');
    const attrs = {
      play: nat('play', ['music', 'pin=pin0', 'wait=True', 'loop=False'], function* (R2, m, p, wait, loop) {
        const notes = m instanceof TuneObj ? m.notes(R2, B.tempo) : parseTune(R2, m, B.tempo); const ms = B.play(notes, R2.t, typeof p === 'string' ? 'P0' : pinName(p), truthy(loop));
        if (truthy(wait)) { if (truthy(loop)) for (;;) yield* R2.sleep(1e6); yield* R2.sleep(ms); B.stopSound(); }
        return null;
      }, Object.assign({ defs: { pin: 'pin0' } }, bl)),
      pitch: nat('pitch', ['frequency', 'duration=-1', 'pin=pin0', 'wait=True'], function* (R2, f, d, p, wait) {
        const ms = num(R2, d); const fr = num(R2, f); B.play([{ f: fr, ms: ms < 0 ? 1e9 : ms }], R2.t, typeof p === 'string' ? 'P0' : pinName(p), false); if (ms < 0) B.sound.total = -1;
        if (truthy(wait) && ms >= 0) { yield* R2.sleep(ms); B.stopSound(); }
        return null;
      }, bl),
      stop: nat('stop', ['pin=None'], () => { B.stopSound(); return null; }),
      set_tempo: nat('set_tempo', ['ticks=4', 'bpm=120'], (R2, t, b) => { B.tempo = { ticks: int(R2, t), bpm: int(R2, b) }; return null; }),
      get_tempo: nat('get_tempo', [], () => tup([B.tempo.ticks, B.tempo.bpm])),
      reset: nat('reset', [], () => { B.tempo = { ticks: 4, bpm: 120 }; return null; }),
    };
    for (const k of Object.keys(TUNES)) attrs[k] = new TuneObj(k);
    return new Mod('music', attrs);
  }
  audioMod() {
    const B = this; return new Mod('audio', {
      play: new Nat('play', ['source', 'wait=True', 'pin=None'], function* (R2, s, wait) { const steps = s && s.sound ? SOUNDS[s.sound] : null; if (!steps) throw R2.err('TypeError', 'MB_AUDIO', {}); const ms = B.play(steps.map(([f, d]) => ({ f, ms: d })), R2.t, null, false); if (truthy(wait)) { yield* R2.sleep(ms); B.stopSound(); } return null; }, { blocking: true }),
      is_playing: new Nat('is_playing', [], (R2) => !!B.toneAt(R2.t)), stop: new Nat('stop', [], () => { B.stopSound(); return null; }),
    });
  }
  radioMod() {
    const B = this, core = this.core; const nat = (n, sig, fn) => new Nat(n, sig, fn);
    const need = (R2) => { if (!B.radio.on) throw R2.err('ValueError', 'MB_RADIO_OFF', {}); };
    return new Mod('radio', {
      on: nat('on', [], () => { B.radio.on = true; core.obs.radioOn = true; return null; }), off: nat('off', [], () => { B.radio.on = false; return null; }),
      config: nat('config', '*', (R2, args, kw) => { for (const k in kw || {}) { if (!['length', 'queue', 'channel', 'power', 'address', 'group', 'data_rate'].includes(k)) throw R2.err('TypeError', 'P_KWARG', { name: 'config', kw: k }); if (k === 'group' || k === 'channel' || k === 'length' || k === 'queue' || k === 'power') B.radio[k] = int(R2, kw[k]); } if (B.radio.group < 0 || B.radio.group > 255) throw R2.err('ValueError', 'MB_RADIO_GROUP', {}); return null; }),
      reset: nat('reset', [], () => { Object.assign(B.radio, { group: 0, channel: 7, length: 32, queue: 3, power: 6 }); return null; }),
      send: nat('send', ['message'], (R2, m) => { need(R2); const s = str(m); if (new TextEncoder().encode(s).length + 3 > B.radio.length) throw R2.err('ValueError', 'MB_RADIO_LONG', { n: B.radio.length - 3 }); core.radioSend(B, s, R2.t); return null; }),
      receive: nat('receive', [], (R2) => { need(R2); const m = B.radio.q.shift(); if (m === undefined) return null; core.obs.radioGot[B.k] = (core.obs.radioGot[B.k] || 0) + 1; core.obs.lastGot[B.k] = m.s; return m.s; }),
      send_bytes: nat('send_bytes', ['message'], (R2, m) => { need(R2); core.radioSend(B, str(m), R2.t); return null; }),
      receive_bytes: nat('receive_bytes', [], (R2) => { need(R2); const m = B.radio.q.shift(); return m ? m.s : null; }),
      receive_full: nat('receive_full', [], (R2) => { need(R2); const m = B.radio.q.shift(); if (m) { core.obs.lastRssi = m.rssi !== undefined ? m.rssi : -45; core.obs.radioGot[B.k] = (core.obs.radioGot[B.k] || 0) + 1; } return m ? tup([m.s, m.rssi !== undefined ? m.rssi : -45, Math.floor(m.t)]) : null; }),
      RATE_1MBIT: 0, RATE_2MBIT: 1, RATE_250KBIT: 2,
    });
  }
}
const ZERO25 = new Uint8Array(25);
const mkBtn = () => ({ down: false, presses: 0, was: false });
const truthy = (v) => !(v === false || v === null || v === 0 || v === undefined || v === '');
const EV = { LOUD: { pyType: 'SoundEvent', pyStr: () => 'SoundEvent.LOUD', name: 'LOUD' }, QUIET: { pyType: 'SoundEvent', pyStr: () => 'SoundEvent.QUIET', name: 'QUIET' } };
const SOUND_OBJ = { pyType: 'Sound', pyName: 'Sound', pyNames: () => Object.keys(SOUNDS), pyGet: (n) => (SOUNDS[n] ? { pyType: 'Sound', sound: n, pyStr: () => 'Sound.' + n } : undefined) };
class TuneObj { constructor(k) { this.k = k; } get pyType() { return 'tuple'; } pyStr() { return `music.${this.k}`; } notes(R, tempo) { return parseTune(R, TUNES[this.k], tempo); } pyIter() { return TUNES[this.k]; } pyLen() { return TUNES[this.k].length; } }
function obj(name, methods) { // a micro:bit object (display, button_a, …): its methods by name
  const o = { pyType: 'MicroBit' + name[0].toUpperCase() + name.slice(1), pyName: name, attrs: methods, pyNames: () => Object.keys(o.attrs), pyGet: (n) => o.attrs[n], pyStr: () => `<${name}>` };
  return o;
}
function chkGesture(R, g) { if (!GESTURES.includes(g)) throw R.err('ValueError', 'MB_GESTURE', Object.assign({ g: String(g) }, suggest(String(g), GESTURES) || {})); }
// every name `from microbit import *` gives
export const MB_TOP = ['display', 'Image', 'button_a', 'button_b', 'pin_logo', 'accelerometer', 'compass', 'microphone', 'speaker', 'pin0', 'pin1', 'pin2', 'pin3', 'pin4', 'pin5', 'pin6', 'pin7', 'pin8', 'pin9', 'pin10', 'pin11', 'pin12', 'pin13', 'pin14', 'pin15', 'pin16', 'pin19', 'pin20', 'pin_speaker', 'SoundEvent', 'Sound', 'audio', 'sleep', 'running_time', 'temperature', 'panic', 'reset', 'set_volume', 'scale', 'i2c', 'spi', 'uart'];
Object.assign(NAME_HINTS, { delay: 'sleep', millis: 'running_time', button: 'button_a', buttonA: 'button_a', scroll: 'display.scroll', show: 'display.show' });

// ------------------------------------------------------------------ parts on crocodile clips
// pins (the clip's end): each has a role in the circuit. soil: two galvanised nails in a pot (the soil between them is a
// resistor: wet soil lets more current through)
export const MB_PARTS = {
  led: { pins: ['A', 'K'], name: t3('LED', 'एलईडी', 'LED'), pin: { A: t3('long leg (+)', 'लंबा पैर (+)', 'lamba pair (+)'), K: t3('short leg (−)', 'छोटा पैर (−)', 'chhota pair (−)') } },
  buzzer: { pins: ['P', 'N'], name: t3('Piezo buzzer', 'पीज़ो बज़र', 'Piezo buzzer'), pin: { P: t3('+ (red)', '+ (लाल)', '+ (red)'), N: t3('− (black)', '− (काला)', '− (black)') } },
  servo: { pins: ['GND', 'VP', 'SIG'], name: t3('Servo SG90', 'सर्वो SG90', 'Servo SG90'), pin: { GND: t3('brown: GND', 'भूरा: GND', 'brown: GND'), VP: t3('red: + power', 'लाल: + बिजली', 'red: + power'), SIG: t3('orange: signal', 'नारंगी: सिग्नल', 'orange: signal') } },
  pot: { pins: ['E1', 'W', 'E2'], name: t3('Knob (10 kΩ potentiometer)', 'नॉब (10 kΩ पोटेंशियोमीटर)', 'Knob (10 kΩ potentiometer)'), pin: { E1: t3('end 1', 'सिरा 1', 'sira 1'), W: t3('middle (wiper)', 'बीच वाला (वाइपर)', 'beech wala (wiper)'), E2: t3('end 2', 'सिरा 2', 'sira 2') } }, // (batch 12)
  soil: { pins: ['N1', 'N2'], name: t3('Soil probes (two nails)', 'मिट्टी की प्रोब (दो कीलें)', 'Soil probes (do keelein)'), pin: { N1: t3('nail 1', 'कील 1', 'keel 1'), N2: t3('nail 2', 'कील 2', 'keel 2') } },
};
export const soilOhms = (m) => 20000 * Math.pow(1 / clamp(m, 0.02, 1), 2.5);
class UF { constructor() { this.p = new Map(); } find(a) { let p = this.p.get(a); if (p === undefined) { this.p.set(a, a); return a; } if (p === a) return a; p = this.find(p); this.p.set(a, p); return p; } union(a, b) { const x = this.find(a), y = this.find(b); if (x !== y) this.p.set(x, y); } }

// ------------------------------------------------------------------ the lesson's world: boards, program, clips, panel
export class MBCore {
  constructor(app, cfg) {
    this.app = app; this.cfg = cfg || {}; this.kind = 'mb'; this.ready = false; this.lab = app && app.lab;
    this.boards = [new MicroBit(this, 0)]; if (this.cfg.boards === 2) this.boards.push(new MicroBit(this, 1));
    this.env = { temp: this.cfg.temp !== undefined ? this.cfg.temp : 26, sound: 18, gap: this.cfg.gap || 2, get light() { return app && app.lab ? app.lab.env.light : 0.75; } };
    this.parts = {}; for (const p of this.cfg.parts || []) this.parts[p.tag] = Object.assign({ state: { angle: 90, b: 0, m: p.m !== undefined ? p.m : 0.6 } }, p);
    this.version = 1; this.clips = []; for (const [a, b] of this.cfg.clips || []) this.addClip(a, b, true);
    this.now = 0; this.tasks = []; this.sounds = [];
    this.obs = this.freshObs(); this.flags = new Set(); this.vals = {}; this.taps = new Set(); this.seen = new Set(); // seen: what happened since the lesson opened (not reset by Run)
    this.lastRun = null;
    if (typeof window !== 'undefined' && app && app.stage) this.loading = import('./mbworld5.js'); // the 3D board and scene (three.js): only in the browser
  }
  freshObs() { return { images: new Map(), seq: [], texts: [], nums: [], press: {}, shakes: {}, gestures: new Set(), analog: {}, radioSent: {}, radioGot: {}, lastGot: {}, ledMax: {}, servo: {}, music: 0, beats: 0, shownAt: {}, heartT: [], friendImgs: new Map(), lastDelay: 0 }; }
  dirty() { this.version++; if (this.view) this.view.kick(); }
  get mcu() { return this.lab.mcu; }
  // ---------------------------------------------------------------- compile and run (main.js: run() asks the world)
  compile(src) {
    const c = pyCompile(src, { cost: 20 });
    if (!c.ok) return { ok: false, errors: c.errors.map((e) => ({ code: e.code, line: e.line, args: e.args })), warnings: [], info: {} };
    this.lastRun = c;
    return { ok: true, errors: [], warnings: c.warnings, info: { serial: c.info.serial }, make: (mcu) => this.program(c, mcu) };
  }
  program(c, mcu) {
    const core = this;
    core.now = 0; core.obs = core.freshObs(); core.wantReset = false;
    for (const b of core.boards) b.reset();
    core.tasks = core.boards.map((b) => { const t = c.make(b.host()); t.board = b; return t; });
    const ser = mcu.ser; ser.on = true; ser.baud = 115200;
    core.dirty();
    return {
      *init() {},
      *setup() { for (;;) { core.step(mcu); yield 0; } },
      *loop() { yield 0; },
    };
  }
  step(mcu) { // run every board's program up to the lab's clock (each board in turns of 2 ms, so radio messages arrive in order)
    const until = mcu.until, wall = mcu.wallEnd; let lag = false;
    const live = this.tasks.filter((t) => !t.done);
    for (;;) {
      let best = null; for (const t of live) if (!t.done && t.t < until && (!best || t.t < best.t)) best = t;
      if (!best) break;
      const r = best.run(live.length > 1 ? Math.min(until, best.t + 2000) : until, wall);
      if (r === 'error') this.fail(best, mcu);
      if (r === 'wall') { lag = true; break; }
    }
    for (const t of this.tasks) if (t.done && t.t < until && !lag) t.t = until; // a finished program: its board keeps time
    const tmin = this.tasks.reduce((m, t) => Math.min(m, t.t), until);
    if (lag) { mcu.wallOut = true; mcu.t = Math.max(mcu.t, tmin); } else mcu.t = until;
    this.now = mcu.t; mcu.L = this.tasks[0] && !this.tasks[0].done ? this.tasks[0].line : 0;
    if (this.wantReset) { this.wantReset = false; setTimeout(() => this.app && this.app.resetBoard && this.app.resetBoard(), 0); }
  }
  fail(task, mcu) {
    const e = task.err; const b = task.board;
    const word = e.type || 'Error'; const s = `Line ${e.line} ${word}`; // the board scrolls it, as MicroPython does
    b.errScroll = { frames: b.scrollFrames(s), start: nowMs() }; b.disp.anim = null; b.disp.buf = new Uint8Array(25); b.stopSound();
    this.obs.error = e;
    throw new RtError(e.code, Object.assign({}, e.args, b.k ? { board: 2 } : {}), e.line);
  }
  running() { return this.lab && this.lab.mcu.state === 'running' && this.tasks.length > 0; }
  serial(s, t) { const ser = this.lab.mcu.ser; for (const ch of s.replace(/\n/g, '\r\n')) ser.queue.push([t, ch.charCodeAt(0)]); }
  // ---------------------------------------------------------------- what the lessons see
  seeImage(b, px, why) {
    const o = this.obs; if (b.k && !why.text) { const n = BY_SIG[sigOf(px)] || null; o.friendImg = n; if (n) o.friendImgs.set(n, (o.friendImgs.get(n) || 0) + 1); return; }
    const name = (why && why.img) || BY_SIG[sigOf(px)] || null;
    if (name) { o.images.set(name, (o.images.get(name) || 0) + 1); o.shownAt[name] = this.now; if (name === 'HEART') { o.heartT.push(this.tasks[0] ? this.tasks[0].t : this.now); if (o.heartT.length > 20) o.heartT.shift(); } }
    if (px.every((v) => v > 0)) { o.allLit = px[0]; o.allLitAt = this.now; this.seen.add('allLit'); } else if (o.allLit && px.every((v) => !v)) o.clearedAfter = true;
    const key = name || sigOf(px); if (o.seq[o.seq.length - 1] !== key) { o.seq.push(key); if (o.seq.length > 200) o.seq.shift(); }
    if (why.text !== undefined) { o.texts.push(why.text); if (o.texts.length > 100) o.texts.shift(); }
    if (why.num !== undefined) { o.nums.push(why.num); if (o.nums.length > 200) o.nums.shift(); }
    if (b.k) return; this.dirty();
  }
  seeAnim(b, frames, why) {
    const o = this.obs;
    if (b.k) { if (why.text !== undefined) o.friendText = why.text; return; }
    if (why.text !== undefined) { o.texts.push(why.text); if (o.texts.length > 100) o.texts.shift(); if (why.scroll) { o.scrolled = (o.scrolled || 0) + 1; o.lastDelay = frames.length ? this.boards[0].disp.anim && this.boards[0].disp.anim.delay / 1000 : 0; } }
    if (why.num !== undefined) { o.nums.push(why.num); if (o.nums.length > 200) o.nums.shift(); }
    if (why.names) for (const n of why.names) if (n) { o.images.set(n, (o.images.get(n) || 0) + 1); if (o.seq[o.seq.length - 1] !== n) o.seq.push(n); }
    this.dirty();
  }
  // alternations of two images (a heart beat: HEART, HEART_SMALL, HEART, …)
  beats(a, b) { const s = this.obs.seq.filter((k) => k === a || k === b); let n = 0; for (let i = 1; i < s.length; i++) if (s[i] !== s[i - 1]) n++; return n; }
  flag(n) {
    const o = this.obs;
    switch (n) {
      case 'running': return this.running();
      case 'pressA': return !!o.press.a; case 'pressB': return !!o.press.b; case 'logo': return !!o.press.logo;
      case 'shake': return !!o.shakes[0]; case 'friendShake': return !!o.shakes[1];
      case 'scrolled': return !!o.scrolled; case 'calibrated': return !!this.boards[0].calibrated; // (the board keeps its calibration, as a real one keeps it in flash)
      case 'error': return !!o.error;
      case 'faceUp': return !this.boards[0].tilt.flip;
      case 'flipped': return this.seen.has('flipped');
    }
    if (n.startsWith('img:')) return o.images.has(n.slice(4));
    if (n.startsWith('tap:')) return this.taps.has(n.slice(4));
    if (n.startsWith('conn:')) { const [a, b] = n.slice(5).split('~'); return this.conn(a, b); }
    if (n.startsWith('lit:')) return this.ledLit(n.slice(4));
    if (n.startsWith('gesture:')) return o.gestures.has(n.slice(8));
    return this.flags.has(n) || this.seen.has(n);
  }
  val(n) {
    const o = this.obs, B = this.boards[0];
    switch (n) {
      case 'texts': return o.texts; case 'nums': return o.nums; case 'seq': return o.seq; case 'presses': return o.press; case 'shakes': return o.shakes[0] || 0;
      case 'heading': return B.heading(); case 'temp': return B.temperature(); case 'light': return B.lightLevel(); case 'moisture': { const s = this.partOf('soil'); return s ? s.state.m : 0; }
      case 'shown': return B.pixelsAt(this.now); case 'shownImg': return BY_SIG[sigOf(B.pixelsAt(this.now))] || null;
      case 'friendShown': return this.boards[1] ? BY_SIG[sigOf(this.boards[1].pixelsAt(this.now))] || null : null;
      case 'analog': return o.analog; case 'servo': return o.servo; case 'radio': return { sent: o.radioSent, got: o.radioGot, last: o.lastGot };
      case 'beats': return this.beats('HEART', 'HEART_SMALL');
      case 'heartMs': { const h = o.heartT; if (h.length < 3) return 9999; const d = []; for (let i = 1; i < h.length; i++) d.push(h[i] - h[i - 1]); return d.slice(-3).reduce((a, b) => a + b, 0) / Math.min(3, d.length) / 1e6; } // seconds
      case 'results': return ['HAPPY', 'SAD', 'MEH'].reduce((n, k) => n + (o.images.get(k) || 0), 0);
      case 'friendResults': return ['HAPPY', 'SAD', 'MEH'].reduce((n, k) => n + (o.friendImgs.get(k) || 0), 0);
      case 'lastDelay': return o.lastDelay; case 'allLit': return o.allLit; case 'images': return o.images;
      case 'friendText': return o.friendText || null; case 'friendLit': return this.boards[1] ? [...this.boards[1].pixelsAt(this.now)].filter(Boolean).length : 0;
      case 'sound': return B.soundLevel(this.now); case 'music': return o.music || 0; case 'tone': return B.toneAt(this.now); // (batch 8)
    }
    return this.vals[n];
  }
  onRun() { this.flags.clear(); }
  // ---------------------------------------------------------------- clips (crocodile leads): the board's pads and the parts' pins
  // ends: 'P0', '3V', 'GND' (board 1; '2:P0' for the second board), 'led1.A', 'soil.N1', …
  endOk(e) { if (/^(\d:)?(P0|P1|P2|3V|GND)$/.test(e)) return true; const [tag, pin] = e.split('.'); const p = this.parts[tag]; return !!p && MB_PARTS[p.type].pins.includes(pin); }
  isPad(e) { return /^(\d:)?(P0|P1|P2|3V|GND)$/.test(e); }
  clipsAt(e) { return this.clips.filter((c) => c.a === e || c.b === e); }
  addClip(a, b, quiet) {
    if (a === b || !this.endOk(a) || !this.endOk(b)) return null;
    if (this.isPad(b) && !this.isPad(a)) [a, b] = [b, a];
    if (this.clips.some((c) => (c.a === a && c.b === b) || (c.a === b && c.b === a))) return null;
    if (this.clipsAt(a).length >= (this.isPad(a) ? 2 : 1) || this.clipsAt(b).length >= (this.isPad(b) ? 2 : 1)) return 'full';
    const pad = a.replace(/^\d:/, '');
    const used = new Set(this.clips.map((c) => c.color));
    const color = pad === 'GND' ? 'black' : pad === '3V' ? 'red' : ['yellow', 'green', 'white', 'blue', 'yellow2'].find((c) => !used.has(c)) || 'yellow';
    const c = { id: 'c' + (++CLIP_ID), a, b, color: color.replace('2', '') };
    this.clips.push(c); this.circuitV = null; this.dirty(); if (!quiet && this.view) this.view.onClips();
    return c;
  }
  removeClip(c) { this.clips = this.clips.filter((x) => x !== c); this.circuitV = null; this.dirty(); if (this.view) this.view.onClips(); }
  conn(a, b) { const uf = this.uf(); return uf.find(norm(a)) === uf.find(norm(b)); }
  uf() { if (this._ufV === this.version && this._uf) return this._uf; const uf = new UF(); for (const c of this.clips) uf.union(norm(c.a), norm(c.b)); this._uf = uf; this._ufV = this.version; return uf; }
  partOf(type) { return Object.values(this.parts).find((p) => p.type === type); }
  ledLit(tag) { const p = this.parts[tag]; return !!p && (p.state.b || 0) > 0.18; }
  pinChanged() { this.circuitV = null; this.version++; }
  // the circuit of board 1, its clips and parts: the voltage on every pad and part pin (solver.js)
  circuit() {
    if (this.circuitV && this.circuitKey === this.version) return this.circuitV;
    const uf = this.uf(); const B = this.boards[0]; const idx = new Map(); let n = 1;
    const gnd = uf.find('0:GND'); idx.set(gnd, 0);
    const node = (k) => { const r = uf.find(norm(k)); let i = idx.get(r); if (i === undefined) { i = n++; idx.set(r, i); } return i; };
    const els = [];
    if (B.on) {
      els.push({ type: 'V', a: node('3V'), b: 0, v: 3.3, r: 0.4, role: '3v' });
      for (const p of ['P0', 'P1', 'P2']) {
        const q = B.pins[p]; if (!q) continue;
        const out = q.mode === 'out' || q.mode === 'pwm' || q.music;
        // (batch 8) PWM is full 3.3 V pulses, on for `duty` of the time: an LED on it glows at that share of its full current
        if (out) els.push({ type: 'V', a: node(p), b: 0, v: 3.3 * (q.music ? 0.5 : q.mode === 'pwm' ? (q.duty > 0 ? 1 : 0) : q.level), r: 120, role: 'pin', pin: p });
        else if (q.mode === 'in') els.push({ type: 'R', a: node(p), b: q.pull === 'up' ? node('3V') : 0, r: q.pull === 'none' ? 1e8 : 13000, role: 'pull' });
        else if (q.mode === 'ain') els.push({ type: 'R', a: node(p), b: 0, r: 1e6, role: 'adc' });
      }
    }
    for (const p of Object.values(this.parts)) {
      const N = (pin) => node(p.tag + '.' + pin);
      if (p.type === 'led') { const c = LED_COLORS[p.color || 'red']; els.push({ type: 'D', a: N('A'), b: N('K'), vf: c.vf, rs: c.rs, part: p }); }
      if (p.type === 'buzzer') els.push({ type: 'R', a: N('P'), b: N('N'), r: 1e6, part: p });
      if (p.type === 'servo') els.push({ type: 'R', a: N('VP'), b: N('GND'), r: p.state.moving ? 40 : 700, part: p }, { type: 'R', a: N('SIG'), b: N('GND'), r: 2e6, part: p, role: 'sig' });
      if (p.type === 'soil') els.push({ type: 'R', a: N('N1'), b: N('N2'), r: soilOhms(p.state.m), part: p });
      if (p.type === 'pot') { const k = clamp(p.state.pos === undefined ? 0.5 : p.state.pos, 0, 1); els.push({ type: 'R', a: N('E1'), b: N('W'), r: 10000 * k + 0.5, part: p }, { type: 'R', a: N('W'), b: N('E2'), r: 10000 * (1 - k) + 0.5, part: p }); }
    }
    const V = solve(n, els, null);
    this.circuitV = { V, els, node, n }; this.circuitKey = this.version;
    return this.circuitV;
  }
  readPin(B, p, analog, T) {
    if (B.k) return analog ? 0 : 0; // the second board has nothing on its pins
    const q = B.pins[p]; const C = this.circuit(); const key = norm(p);
    const attached = this.clips.some((c) => norm(c.a) === key || norm(c.b) === key);
    if (!attached) { // a pin with nothing on it: the pull-down holds it at 0 V; an analog read floats and wanders
      if (analog) return 1.1 + 0.5 * Math.sin(T / 3.1e5 + 1.7) + 0.25 * Math.sin(T / 0.7e5);
      return q && q.pull === 'up' ? 3.3 : 0;
    }
    const v = C.V[C.node(p)] || 0;
    return analog ? Math.max(0, v + (Math.random() - 0.5) * 0.006) : v;
  }
  // (batch 12) the received signal strength (dBm): about -45 at 1 m at full power, 25 dB weaker for every ten times the
  // distance (the panel's "distance between the boards"), 3 dB weaker for each power step below 7, and a little noise
  rssi(from) { const d = Math.max(0.2, this.env.gap || 1), pw = from.radio ? from.radio.power : 6; return Math.max(-120, Math.min(-30, Math.round(-45 - 25 * Math.log10(d) - (7 - pw) * 3 + (Math.random() - 0.5) * 3))); }
  radioSend(from, s, T) {
    const o = this.obs; o.radioSent[from.k] = (o.radioSent[from.k] || 0) + 1; o.lastSent = o.lastSent || {}; o.lastSent[from.k] = s;
    for (const b of this.boards) {
      if (b === from || !b.radio || !b.radio.on || b.radio.group !== from.radio.group || b.radio.channel !== from.radio.channel) continue;
      const rssi = this.rssi(from); if (rssi < -98) continue; // (batch 12) too far for this power: lost
      if (b.radio.q.length < b.radio.queue) b.radio.q.push({ s, t: T, rssi });
    }
    this.flash = { k: from.k, at: nowMs() }; this.dirty();
  }
  // ---------------------------------------------------------------- every frame: physics of the parts, gestures, sounds
  update(dt) {
    const T = this.now, running = this.running(); let moved = false;
    if (this.autoTilt) { // "Tilt it around for me": a slow spiral that passes over all 25 LEDs of the calibration game
      const a = this.autoTilt, b = this.boards[0];
      if (b.calib || a.t > 0 || !running) { a.t += dt; const r = Math.min(1, a.t / 7) * 78, w = a.t * 2.6; b.tilt.roll = r * Math.cos(w); b.tilt.pitch = r * Math.sin(w); this.holdTilt = true; moved = true; this.dirty(); }
      if (a.t > 8.5 || (a.t > 0.5 && !b.calib && b.calibrated)) { this.autoTilt = null; this.holdTilt = false; b.tilt.roll = 0; b.tilt.pitch = 0; this.settleSoon = true; }
    }
    for (const b of this.boards) {
      if (!running && b.on && this.lab.mcu.state !== 'running') { if (this.lab.mcu.state !== 'error') { b.powerOff(); moved = true; } else { b.on = false; b.sound = null; } }
      if (!b.on || !b.gest) continue;
      const g = b.gestureOf(T);
      if (g !== b.gest.cur) { b.gest.cur = g; if (g) { b.gest.hist.push(g); if (b.gest.hist.length > 8) b.gest.hist.shift(); if (!b.k) this.obs.gestures.add(g); } }
      const lvl = b.soundLevel(T); const ev = lvl > b.thresh.loud ? EV.LOUD : lvl < b.thresh.quiet ? EV.QUIET : null;
      if (ev !== b.micEv.cur) { b.micEv.cur = ev; if (ev) { b.micEv.hist.push(ev); if (b.micEv.hist.length > 8) b.micEv.hist.shift(); } }
    }
    // the circuit: LEDs, the servo, the buzzer
    this.sounds = [];
    const C = this.circuit(); const B0 = this.boards[0];
    for (const e of C.els) {
      const p = e.part; if (!p) continue; const va = C.V[e.a] || 0, vb = C.V[e.b] || 0;
      if (p.type === 'led') { const pw = ['P0', 'P1', 'P2'].find((q) => B0.pins[q] && B0.pins[q].mode === 'pwm' && !B0.pins[q].music && (this.conn(q, p.tag + '.A') || this.conn(q, p.tag + '.K'))); const I = Math.max(0, e.i || 0) * (pw ? B0.pins[pw].duty : 1); const b = Math.min(1.5, Math.pow(I / 0.015, 0.55)); if (Math.abs((p.state.b || 0) - b) > 0.01) moved = true; p.state.b = b; p.state.i = I; this.obs.ledMax[p.tag] = Math.max(this.obs.ledMax[p.tag] || 0, I); }
      if (p.type === 'buzzer') { const pin = ['P0', 'P1', 'P2'].find((q) => B0.pins[q] && B0.pins[q].music && this.conn(q, p.tag + '.P')); const f = pin ? B0.toneAt(T) : 0; p.state.on = !!f && this.conn(p.tag + '.N', 'GND'); if (p.state.on) this.sounds.push({ id: 'mbz' + p.tag, kind: 'tone', f, amp: 0.8 }); }
      if (p.type === 'servo' && e.role !== 'sig') {
        const pow = va - vb; const s = p.state; s.powered = pow > 2.6;
        const pin = ['P0', 'P1', 'P2'].find((q) => B0.pins[q] && B0.pins[q].mode === 'pwm' && this.conn(q, p.tag + '.SIG'));
        let target = null; if (s.powered && pin && running) { const q = B0.pins[pin]; const us = q.duty * q.period; if (q.period >= 10000 && q.period <= 30000 && us >= 400 && us <= 2700) target = clamp((us - 500) / 2000 * 180, 0, 180); }
        s.target = target;
        if (target !== null) { const rate = 520 * clamp((pow - 2.4) / 2.6, 0.25, 1) * dt; const d = target - s.angle; s.angle = Math.abs(d) <= rate ? target : s.angle + Math.sign(d) * rate; }
        if (this.cfg.scene === 'worm') { if (s.prevA !== undefined) s.dist = (s.dist || 0) + Math.abs(s.angle - s.prevA) * 0.25; s.prevA = s.angle; } // (batch 13) an inchworm: one foot grips, the other slides, so every degree of bend moves it 0.25 mm
        const mv = target !== null && Math.abs(target - s.angle) > 0.5; if (mv !== !!s.moving) { s.moving = mv; this.circuitV = null; }
        if (mv) { moved = true; this.sounds.push({ id: 'mbsv' + p.tag, kind: 'servo', f: 120, amp: 0.5 }); }
        const o = this.obs.servo[p.tag] || (this.obs.servo[p.tag] = { min: 999, max: -999 }); if (target !== null) { o.min = Math.min(o.min, s.angle); o.max = Math.max(o.max, s.angle); }
      }
      if (p.type === 'soil') { const s = p.state; const m0 = s.m; s.m = clamp(s.m - dt * (this.cfg.dry || 0.012), 0.02, 1); if (s.water > 0) { const k = Math.min(s.water, dt * 0.45); s.m = clamp(s.m + k, 0, 0.95); s.water -= k; } if (Math.abs(s.m - m0) > 1e-4) { this.circuitV = null; this.version++; } moved = moved || Math.abs(s.m - m0) > 0.002; }
    }
    // the speakers
    for (const b of this.boards) { if (!b.on || !b.speakerOn) continue; const f = b.toneAt(T); if (f) this.sounds.push({ id: 'mbsp' + b.k, kind: 'tone', f, amp: 0.55 * b.vol }); }
    if (this.lab) this.lab.sounds.push(...this.sounds);
    if (this.view) moved = this.view.update(dt) || moved;
    return moved;
  }
  // ---------------------------------------------------------------- the panel (main.js draws it in the page; xrui.js in the headset)
  hud() {
    const B = this.boards[0], T = this.now, o = this.obs; const rows = []; const H = this.cfg.hud || [];
    const W = HUDW;
    if (H.includes('buttons')) rows.push([tx(W.buttons), `A ${B.btn.a.down ? '●' : '○'} ${o.press.a || 0} · B ${B.btn.b.down ? '●' : '○'} ${o.press.b || 0}`]);
    if (H.includes('acc')) { const [x, y, z] = B.on ? B.accel(T) : B.accel(0); rows.push([tx(W.acc), `x ${x} · y ${y} · z ${z}`]); rows.push([tx(W.gesture), B.gestureOf(T) || '—']); }
    if (H.includes('shakes')) rows.push([tx(W.shakes), String(o.shakes[0] || 0)]);
    if (H.includes('temp')) rows.push([tx(W.temp), `${B.temperature()} °C`]);
    if (H.includes('compass')) rows.push([tx(W.heading), `${B.heading()}° ${dirName(B.heading())}${B.calibrated ? '' : ' · ' + tx(W.notCal)}`]);
    if (H.includes('light')) rows.push([tx(W.light), `${B.lightLevel()} / 255`]);
    if (H.includes('mic')) rows.push([tx(W.sound), `${B.soundLevel(T)} / 255`]);
    if (H.includes('soil')) { const s = this.partOf('soil'); if (s) rows.push([tx(W.moist), `${Math.round(s.state.m * 100)}% · P0 ${o.analog.P0 !== undefined ? o.analog.P0 : '—'}`]); }
    if (H.includes('led')) for (const p of Object.values(this.parts)) if (p.type === 'led') rows.push([tx(MB_PARTS.led.name), p.state.b > 0.18 ? `● ${(p.state.i * 1000).toFixed(1)} mA` : '○']);
    if (H.includes('servo')) for (const p of Object.values(this.parts)) if (p.type === 'servo') rows.push([tx(W.servo), `${Math.round(p.state.angle)}°${p.state.powered ? '' : ' · ' + tx(W.noPower)}`]);
    if (H.includes('worm')) { const w = this.partOf('servo'); rows.push([tx(W.wormD), `${((w && w.state.dist) || 0) >= 0 ? (((w && w.state.dist) || 0) / 10).toFixed(1) : 0} cm`]); }
    if (H.includes('gap')) rows.push([tx(W.gapH), `${Math.round(this.env.gap)} m · ${o.lastRssi !== undefined ? o.lastRssi + ' dBm' : '—'}`]);
    if (H.includes('knob')) { const k = this.partOf('pot'); if (k) rows.push([tx(W.knob), `${Math.round(k.state.pos * 100)}% · P1 ${o.analog.P1 !== undefined ? o.analog.P1 : '—'}`]); }
    if (H.includes('radio')) { const r = o.radioSent, g = o.radioGot; rows.push([tx(W.radio), `${tx(W.you)} ↑${r[0] || 0} ↓${g[0] || 0} · ${tx(W.friend)} ↑${r[1] || 0} ↓${g[1] || 0}`]); }
    const C = []; const ctl = this.cfg.controls || ['A', 'B'];
    for (const c of ctl) {
      if (c === 'A' || c === 'B') C.push({ id: c, kind: 'button', label: { en: `Press ${c}`, hi: `${c} दबाइए`, hg: `${c} dabaiye` } });
      if (c === 'AB') C.push({ id: 'AB', kind: 'button', label: { en: 'Press A + B', hi: 'A + B दबाइए', hg: 'A + B dabaiye' } });
      if (c === 'logo') C.push({ id: 'logo', kind: 'button', label: W.touchLogo });
      if (c === 'P0') C.push({ id: 'P0', kind: 'button', label: W.touchP0 });
      if (c === 'P1') C.push({ id: 'P1', kind: 'button', label: W.touchP1 });
      if (c === 'P2') C.push({ id: 'P2', kind: 'button', label: W.touchP2 });
      if (c === 'fAB') { C.push({ id: 'fA', kind: 'button', label: W.fA }); C.push({ id: 'fB', kind: 'button', label: W.fB }); }
      if (c === 'shake') C.push({ id: 'shake', kind: 'button', label: W.shake });
      if (c === 'friend') C.push({ id: 'fshake', kind: 'button', label: W.fshake });
      if (c === 'flip') C.push({ id: 'flip', kind: 'button', label: W.flip });
      if (c === 'tilt') C.push({ id: 'tilt', kind: 'seg', label: W.tilt, value: tiltName(B.tilt), options: [['left', W.tLeft], ['flat', W.tFlat], ['right', W.tRight], ['up', W.tUp]] });
      if (c === 'temp') C.push({ id: 'temp', kind: 'range', label: W.roomTemp, min: 0, max: 50, value: Math.round(this.env.temp), unit: '°C' });
      if (c === 'light') C.push({ id: 'light', kind: 'range', label: W.roomLight, min: 0, max: 100, value: Math.round(this.env.light * 100), unit: '%' });
      if (c === 'heading') C.push({ id: 'heading', kind: 'range', label: W.turn, min: 0, max: 359, value: B.heading(), unit: '°' });
      if (c === 'calib') C.push({ id: 'calib', kind: 'button', label: W.autoTilt });
      if (c === 'sound') { C.push({ id: 'sound', kind: 'range', label: W.noise, min: 0, max: 255, value: Math.round(this.env.sound), unit: '' }); C.push({ id: 'clap', kind: 'button', label: W.clap }); }
      if (c === 'water') C.push({ id: 'water', kind: 'button', label: W.water });
      if (c === 'gap') C.push({ id: 'gap', kind: 'range', label: W.gap, min: 1, max: 30, value: Math.round(this.env.gap), unit: 'm' }); // (batch 12)
      if (c === 'knob') { const k = this.partOf('pot'); C.push({ id: 'knob', kind: 'range', label: W.knob, min: 0, max: 100, value: Math.round((k ? k.state.pos : 0.5) * 100), unit: '%' }); }
      if (c === 'phone' && this.phoneOk()) C.push({ id: 'phone', kind: 'button', label: this.phoneOn ? W.phoneOff : W.phone });
    }
    return { title: this.cfg.title || W.title, rows, controls: C };
  }
  control(id, v) {
    const B = this.boards[0];
    const tap = (b, k) => { b.press(k, true); setTimeout(() => b.press(k, false), 260); };
    switch (id) {
      case 'A': tap(B, 'a'); break; case 'B': tap(B, 'b'); break; case 'AB': tap(B, 'a'); tap(B, 'b'); break; case 'logo': tap(B, 'logo'); break; case 'P0': tap(B, 'P0'); break; case 'P1': tap(B, 'P1'); break; case 'P2': tap(B, 'P2'); break;
      case 'fA': if (this.boards[1]) tap(this.boards[1], 'a'); break; case 'fB': if (this.boards[1]) tap(this.boards[1], 'b'); break; // (batch 8: the friend's buttons)
      case 'shake': B.shake(); break; case 'fshake': if (this.boards[1]) this.boards[1].shake(); break;
      case 'flip': B.tilt.flip = !B.tilt.flip; if (B.tilt.flip) this.seen.add('flipped'); this.dirty(); break;
      case 'tilt': B.tilt = Object.assign(B.tilt, v === 'left' ? { roll: -55, pitch: 0 } : v === 'right' ? { roll: 55, pitch: 0 } : v === 'up' ? { pitch: 80, roll: 0 } : { pitch: 0, roll: 0 }); this.holdTilt = v !== 'flat'; this.dirty(); break;
      case 'temp': this.env.temp = +v; this.dirty(); break;
      case 'light': if (this.app && this.app.setLight) this.app.setLight(+v / 100); this.dirty(); break;
      case 'heading': B.yaw = +v; this.dirty(); break;
      case 'calib': this.autoTilt = { t: 0 }; break;
      case 'sound': this.env.sound = +v; break;
      case 'clap': for (const b of this.boards) if (b.micEv) b.micEv.loudAt = this.now; break;
      case 'gap': this.env.gap = +v; this.dirty(); break;
      case 'knob': { const k = this.partOf('pot'); if (k) { k.state.pos = +v / 100; this.dirty(); } break; }
      case 'water': { const s = this.partOf('soil'); if (s) { s.state.water = 0.6; this.obs.watered = (this.obs.watered || 0) + 1; } break; }
      case 'phone': this.togglePhone(); break;
    }
    if (this.view) this.view.kick();
  }
  phoneOk() { return typeof window !== 'undefined' && 'DeviceOrientationEvent' in window && (navigator.maxTouchPoints || 0) > 0; }
  togglePhone() {
    if (this.phoneOn) { removeEventListener('deviceorientation', this._dor); removeEventListener('devicemotion', this._dmo); this.phoneOn = false; return; }
    const go = () => {
      let base = null;
      this._dor = (e) => { if (e.beta === null) return; if (!base) base = { b: e.beta, g: e.gamma }; const B = this.boards[0]; B.tilt.pitch = clamp(-(e.beta - base.b), -90, 90); B.tilt.roll = clamp(e.gamma - base.g, -90, 90); this.holdTilt = true; this.dirty(); };
      this._dmo = (e) => { const a = e.acceleration || {}; if (Math.hypot(a.x || 0, a.y || 0, a.z || 0) > 14 && this.now - (this.boards[0].shakeT || 0) > 600000) this.boards[0].shake(); };
      addEventListener('deviceorientation', this._dor); addEventListener('devicemotion', this._dmo); this.phoneOn = true;
    };
    const P = window.DeviceOrientationEvent; if (P && P.requestPermission) P.requestPermission().then((r) => { if (r === 'granted') go(); }).catch(() => {}); else go();
  }
  pickables() { return this.view ? this.view.pickables() : []; }
  // the 3D board and scene (mbworld5.js), built over a few frames
  async build() {
    if (!this.loading) { this.ready = true; return; }
    const M = await this.loading; if (this.dead) return;
    this.view = new M.MBView(this); await this.view.build();
    if (this.dead) return;
    this.ready = true; this.buildMs = this.view.buildMs;
  }
  dispose() { this.dead = true; if (this.phoneOn) this.togglePhone(); if (this.view) this.view.dispose(); this.view = null; }
  // the board's own region the student tapped (lesson 1)
  tap(id) { this.taps.add(id); if (this.app && this.app.tapRegion) this.app.tapRegion(id); }
}
let CLIP_ID = 0;
const norm = (e) => (/^\d:/.test(e) ? e : /^(P0|P1|P2|3V|GND)$/.test(e) ? '0:' + e : e);
const DIRS = [t3('N', 'उत्तर', 'North'), t3('NE', 'उत्तर-पूर्व', 'North-East'), t3('E', 'पूर्व', 'East'), t3('SE', 'दक्षिण-पूर्व', 'South-East'), t3('S', 'दक्षिण', 'South'), t3('SW', 'दक्षिण-पश्चिम', 'South-West'), t3('W', 'पश्चिम', 'West'), t3('NW', 'उत्तर-पश्चिम', 'North-West')];
export const dirName = (h) => tx(DIRS[Math.round(h / 45) % 8]);
const tiltName = (t) => (t.pitch > 40 ? 'up' : t.roll < -30 ? 'left' : t.roll > 30 ? 'right' : 'flat');
const HUDW = {
  title: t3('micro:bit', 'micro:bit', 'micro:bit'), buttons: t3('Buttons (presses)', 'बटन (कितनी बार)', 'Buttons (kitni baar)'), acc: t3('Accelerometer (mg)', 'एक्सेलेरोमीटर (mg)', 'Accelerometer (mg)'),
  gesture: t3('Gesture', 'हरकत (gesture)', 'Gesture'), shakes: t3('Shakes', 'हिलाया', 'Shake kiya'), temp: t3('temperature()', 'temperature()', 'temperature()'),
  heading: t3('compass.heading()', 'compass.heading()', 'compass.heading()'), notCal: t3('not calibrated', 'कैलिब्रेट नहीं', 'calibrate nahi'), light: t3('read_light_level()', 'read_light_level()', 'read_light_level()'),
  sound: t3('sound_level()', 'sound_level()', 'sound_level()'), moist: t3('Soil moisture', 'मिट्टी की नमी', 'Mitti ki nami'), servo: t3('Servo angle', 'सर्वो का कोण', 'Servo ka angle'),
  noPower: t3('no power', 'बिजली नहीं', 'power nahi'), radio: t3('Radio sent ↑ / got ↓', 'रेडियो भेजा ↑ / मिला ↓', 'Radio bheja ↑ / mila ↓'), you: t3('you', 'आप', 'aap'), friend: t3('friend', 'दोस्त', 'dost'),
  touchP0: t3('Touch pin 0', 'पिन 0 छूइए', 'Pin 0 touch karo'), touchP1: t3('Touch pin 1', 'पिन 1 छूइए', 'Pin 1 touch karo'), touchP2: t3('Touch pin 2', 'पिन 2 छूइए', 'Pin 2 touch karo'), fA: t3('Friend presses A', 'दोस्त A दबाए', 'Dost A dabaye'), fB: t3('Friend presses B', 'दोस्त B दबाए', 'Dost B dabaye'), touchLogo: t3('Touch the logo', 'लोगो छूइए', 'Logo touch karo'), shake: t3('Shake it', 'हिलाइए', 'Hilaiye'), fshake: t3('Friend shakes', 'दोस्त हिलाए', 'Dost hilaye'),
  flip: t3('Turn the board over', 'बोर्ड पलटिए', 'Board palatiye'), tilt: t3('Hold it', 'ऐसे पकड़िए', 'Aise pakdiye'), tLeft: t3('left', 'बाएँ', 'left'), tFlat: t3('flat', 'सीधा', 'flat'), tRight: t3('right', 'दाएँ', 'right'), tUp: t3('logo up', 'लोगो ऊपर', 'logo upar'),
  roomTemp: t3('Temperature', 'तापमान', 'Temperature'), roomLight: t3('Room light', 'कमरे की रोशनी', 'Room light'), turn: t3('Turn the board (logo points to)', 'बोर्ड घुमाइए (लोगो किधर)', 'Board ghumaiye (logo kidhar)'),
  autoTilt: t3('Tilt it around for me', 'मेरे लिए चारों ओर झुकाइए', 'Mere liye chaaron taraf jhukaiye'), noise: t3('Noise in the room', 'कमरे का शोर', 'Kamre ka shor'), clap: t3('Clap!', 'ताली!', 'Taali!'),
  water: t3('Water the plant', 'पौधे को पानी दीजिए', 'Paudhe ko paani dijiye'), gap: t3('Distance between the boards', 'दोनों बोर्डों के बीच दूरी', 'Dono boards ke beech doori'), gapH: t3('Distance · signal (RSSI)', 'दूरी · सिग्नल (RSSI)', 'Doori · signal (RSSI)'), knob: t3('Turn the knob', 'नॉब घुमाइए', 'Knob ghumaiye'), wormD: t3('Distance walked', 'चली गई दूरी', 'Chali gayi doori'), phone: t3('📱 Tilt with my phone', '📱 फ़ोन से झुकाइए', '📱 Phone se jhukaiye'), phoneOff: t3('📱 Phone tilt off', '📱 फ़ोन से झुकाना बंद', '📱 Phone tilt band'),
};
export { HUDW };

// ------------------------------------------------------------------ the board's parts (lesson 1: tap to learn), messages
const R3 = (n, d) => ({ n, d });
Object.assign(REGIONS, {
  mb_leds: R3(t3('LED display (5 × 5)', 'एलईडी डिस्प्ले (5 × 5)', 'LED display (5 × 5)'), t3('25 red LEDs in 5 rows and 5 columns. display.show() and display.scroll() draw on it; each LED has 10 brightness levels (0–9). The same LEDs can also measure the light around them.', '5 पंक्तियों और 5 कॉलम में 25 लाल एलईडी। display.show() और display.scroll() इन पर लिखते हैं; हर एलईडी की 10 चमक होती हैं (0–9)। यही एलईडी आसपास की रोशनी भी नाप सकती हैं।', '5 rows aur 5 columns mein 25 red LEDs. display.show() aur display.scroll() inpar likhte hain; har LED ki 10 brightness levels hoti hain (0–9). Yahi LEDs aas-paas ki roshni bhi naap sakti hain.')),
  mb_a: R3(t3('Button A', 'बटन A', 'Button A'), t3('A push button. button_a.is_pressed() is True while you hold it; button_a.was_pressed() remembers a press.', 'एक पुश बटन। जब तक आप इसे दबाए रखते हैं, button_a.is_pressed() True रहता है; button_a.was_pressed() दबाना याद रखता है।', 'Ek push button. Jab tak aap ise dabaye rakhte hain, button_a.is_pressed() True rehta hai; button_a.was_pressed() dabana yaad rakhta hai.')),
  mb_b: R3(t3('Button B', 'बटन B', 'Button B'), t3('The second button: button_b. Press A and B together for a third "button".', 'दूसरा बटन: button_b। तीसरे "बटन" के लिए A और B एक साथ दबाइए।', 'Doosra button: button_b. Teesre "button" ke liye A aur B ek saath dabaiye.')),
  mb_logo: R3(t3('Touch logo', 'टच लोगो', 'Touch logo'), t3('The gold pad at the top is a touch sensor: pin_logo.is_touched() is True while your finger is on it.', 'ऊपर वाला सुनहरा हिस्सा टच सेंसर है: उस पर उँगली रखने पर pin_logo.is_touched() True होता है।', 'Upar wala sunehra hissa touch sensor hai: us par ungli rakhne par pin_logo.is_touched() True hota hai.')),
  mb_mic: R3(t3('Microphone light', 'माइक्रोफ़ोन लाइट', 'Microphone light'), t3('This small LED lights up when the microphone is listening (microphone.sound_level()). The microphone itself is on the back.', 'जब माइक्रोफ़ोन सुन रहा होता है (microphone.sound_level()), यह छोटी एलईडी जलती है। माइक्रोफ़ोन ख़ुद पीछे की तरफ़ है।', 'Jab microphone sun raha hota hai (microphone.sound_level()), yeh chhoti LED jalti hai. Microphone khud peeche ki taraf hai.')),
  mb_pins: R3(t3('Edge connector: pins 0, 1, 2, 3V, GND', 'एज कनेक्टर: पिन 0, 1, 2, 3V, GND', 'Edge connector: pins 0, 1, 2, 3V, GND'), t3('The gold strips at the bottom. The five big ones take crocodile clips: 0, 1 and 2 are inputs and outputs (pin0.write_digital(1), pin0.read_analog()), 3V gives power, GND is 0 V. The thin ones need an edge-connector board.', 'नीचे की सुनहरी पट्टियाँ। पाँच बड़ी पट्टियों पर क्रोकोडाइल क्लिप लगती हैं: 0, 1 और 2 इनपुट और आउटपुट हैं (pin0.write_digital(1), pin0.read_analog()), 3V बिजली देता है, GND यानी 0 V। पतली पट्टियों के लिए एज-कनेक्टर बोर्ड चाहिए।', 'Neeche ki sunehri pattiyan. Paanch badi pattiyon par crocodile clip lagti hai: 0, 1 aur 2 input aur output hain (pin0.write_digital(1), pin0.read_analog()), 3V power deta hai, GND matlab 0 V. Patli pattiyon ke liye edge-connector board chahiye.')),
  mb_cpu: R3(t3('Processor (nRF52833)', 'प्रोसेसर (nRF52833)', 'Processor (nRF52833)'), t3('The brain: a 64 MHz chip with 512 KB of flash and 128 KB of RAM. Your Python program runs here. It also has the radio and Bluetooth inside.', 'दिमाग़: 64 MHz की चिप, 512 KB फ़्लैश और 128 KB RAM के साथ। आपका Python प्रोग्राम यहीं चलता है। रेडियो और Bluetooth भी इसी के अंदर हैं।', 'Dimaag: 64 MHz ki chip, 512 KB flash aur 128 KB RAM ke saath. Aapka Python program yahin chalta hai. Radio aur Bluetooth bhi isi ke andar hain.')),
  mb_motion: R3(t3('Accelerometer and compass', 'एक्सेलेरोमीटर और कंपास', 'Accelerometer aur compass'), t3('One tiny chip feels tilting and shaking (accelerometer.get_x(), was_gesture("shake")) and the Earth\'s magnetism (compass.heading()).', 'एक छोटी-सी चिप झुकना और हिलना महसूस करती है (accelerometer.get_x(), was_gesture("shake")) और पृथ्वी का चुंबकत्व भी (compass.heading())।', 'Ek chhoti si chip jhukna aur hilna mehsoos karti hai (accelerometer.get_x(), was_gesture("shake")) aur prithvi ka magnetism bhi (compass.heading()).')),
  mb_usb: R3(t3('Micro USB socket', 'माइक्रो USB सॉकेट', 'Micro USB socket'), t3('Connects the board to the computer: power, your program (it appears as a drive), and print() messages.', 'बोर्ड को कंप्यूटर से जोड़ता है: बिजली, आपका प्रोग्राम (यह एक ड्राइव की तरह दिखता है), और print() के संदेश।', 'Board ko computer se jodta hai: power, aapka program (yeh ek drive ki tarah dikhta hai), aur print() ke messages.')),
  mb_battery: R3(t3('Battery socket', 'बैटरी सॉकेट', 'Battery socket'), t3('For 2 × AAA cells (3 V), so the micro:bit works away from the computer: in a badge, on a robot, in a plant pot.', '2 × AAA सेल (3 V) के लिए, ताकि micro:bit कंप्यूटर से दूर भी चले: बैज में, रोबोट पर, गमले में।', '2 × AAA cell (3 V) ke liye, taaki micro:bit computer se door bhi chale: badge mein, robot par, gamle mein.')),
  mb_reset: R3(t3('Reset and power button', 'रीसेट और पावर बटन', 'Reset aur power button'), t3('Press it and your program starts again from the top. Hold it to switch the board off.', 'इसे दबाइए, तो आपका प्रोग्राम फिर से शुरू से चलेगा। देर तक दबाने पर बोर्ड बंद हो जाता है।', 'Ise dabaiye, to aapka program phir se shuru se chalega. Der tak dabane par board band ho jaata hai.')),
  mb_speaker: R3(t3('Speaker', 'स्पीकर', 'Speaker'), t3('It plays music.play(music.BIRTHDAY) and audio.play(Sound.HAPPY). The same music also comes out on pin 0.', 'यह music.play(music.BIRTHDAY) और audio.play(Sound.HAPPY) बजाता है। वही संगीत पिन 0 पर भी आता है।', 'Yeh music.play(music.BIRTHDAY) aur audio.play(Sound.HAPPY) bajata hai. Wahi music pin 0 par bhi aata hai.')),
  mb_micback: R3(t3('Microphone', 'माइक्रोफ़ोन', 'Microphone'), t3('Hears claps and noise: microphone.sound_level() goes from 0 (quiet) to 255 (loud).', 'ताली और शोर सुनता है: microphone.sound_level() 0 (शांत) से 255 (तेज़) तक जाता है।', 'Taali aur shor sunta hai: microphone.sound_level() 0 (shaant) se 255 (tez) tak jaata hai.')),
  mb_radio: R3(t3('Radio and Bluetooth antenna', 'रेडियो और Bluetooth एंटेना', 'Radio aur Bluetooth antenna'), t3('This copper track in the corner sends and receives radio. radio.send("hi") reaches every micro:bit nearby in the same group.', 'कोने की यह ताँबे की लाइन रेडियो भेजती और पकड़ती है। radio.send("hi") पास के उसी group वाले हर micro:bit तक पहुँचता है।', 'Kone ki yeh copper line radio bhejti aur pakadti hai. radio.send("hi") paas ke usi group wale har micro:bit tak pahunchta hai.')),
  mb_iface: R3(t3('USB interface chip', 'USB इंटरफ़ेस चिप', 'USB interface chip'), t3('A second small processor: it copies your program from the computer onto the main chip.', 'एक दूसरा छोटा प्रोसेसर: यह आपका प्रोग्राम कंप्यूटर से मुख्य चिप पर डालता है।', 'Ek doosra chhota processor: yeh aapka program computer se main chip par daalta hai.')),
});
export const MB_MSG = {
  P_NAME_MOD: t3('NameError: "{name}" comes from the {mod} module: add "{fix}" at the top of the program.', 'NameError: "{name}", {mod} मॉड्यूल से आता है: प्रोग्राम में सबसे ऊपर "{fix}" लिखिए।', 'NameError: "{name}", {mod} module se aata hai: program mein sabse upar "{fix}" likhiye.'),
  MB_PIXEL: t3('ValueError: the display has 5 columns and 5 rows, numbered 0 to 4 (you gave x={x}, y={y}).', 'ValueError: डिस्प्ले में 5 कॉलम और 5 पंक्तियाँ हैं, 0 से 4 तक (आपने x={x}, y={y} दिया)।', 'ValueError: display mein 5 columns aur 5 rows hain, 0 se 4 tak (aapne x={x}, y={y} diya).'),
  MB_BRIGHT: t3('ValueError: brightness goes from 0 (off) to 9 (brightest), not {v}.', 'ValueError: चमक 0 (बंद) से 9 (सबसे तेज़) तक होती है, {v} नहीं।', 'ValueError: brightness 0 (band) se 9 (sabse tez) tak hoti hai, {v} nahi.'),
  MB_IMAGE_RO: t3('TypeError: a built-in image cannot be changed. Copy it first: img = Image.HEART.copy()', 'TypeError: पहले से बनी इमेज बदली नहीं जा सकती। पहले उसकी कॉपी बनाइए: img = Image.HEART.copy()', 'TypeError: pehle se bani image badli nahi ja sakti. Pehle uski copy banaiye: img = Image.HEART.copy()'),
  MB_IMAGE_STR: t3('ValueError: an Image is made of digits 0–9 in rows split by ":", like Image("09090:99999:99999:09990:00900")', 'ValueError: Image में ":" से अलग पंक्तियों में 0–9 के अंक होते हैं, जैसे Image("09090:99999:99999:09990:00900")', 'ValueError: Image mein ":" se alag rows mein 0–9 ke digits hote hain, jaise Image("09090:99999:99999:09990:00900")'),
  MB_SHOW: t3('TypeError: display.show() can show an Image, a number, a text or a list of images, not a {t}.', 'TypeError: display.show() इमेज, संख्या, टेक्स्ट या इमेज की लिस्ट दिखा सकता है, {t} नहीं।', 'TypeError: display.show() image, number, text ya images ki list dikha sakta hai, {t} nahi.'),
  MB_GESTURE: t3('ValueError: "{g}" is not a gesture. Use one of: up, down, left, right, face up, face down, shake, freefall, 3g.', 'ValueError: "{g}" कोई gesture नहीं है। इनमें से लिखिए: up, down, left, right, face up, face down, shake, freefall, 3g।', 'ValueError: "{g}" koi gesture nahi hai. Inmein se likhiye: up, down, left, right, face up, face down, shake, freefall, 3g.'),
  MB_NOTE: t3('ValueError: "{note}" is not a note. Write a note name a–g (or r for a rest), then the octave and :length, like "c4:4".', 'ValueError: "{note}" कोई सुर नहीं है। a–g में से सुर (या रुकने के लिए r), फिर ऑक्टेव और :लंबाई लिखिए, जैसे "c4:4"।', 'ValueError: "{note}" koi note nahi hai. a–g mein se note (ya rukne ke liye r), phir octave aur :length likhiye, jaise "c4:4".'),
  MB_AUDIO: t3('TypeError: audio.play() needs a Sound, like Sound.HAPPY.', 'TypeError: audio.play() को कोई Sound चाहिए, जैसे Sound.HAPPY।', 'TypeError: audio.play() ko koi Sound chahiye, jaise Sound.HAPPY.'),
  MB_RADIO_OFF: t3('ValueError: the radio is off. Call radio.on() first.', 'ValueError: रेडियो बंद है। पहले radio.on() लिखिए।', 'ValueError: radio band hai. Pehle radio.on() likhiye.'),
  MB_RADIO_LONG: t3('ValueError: the message is too long: the radio sends at most {n} letters at a time.', 'ValueError: संदेश बहुत लंबा है: रेडियो एक बार में ज़्यादा से ज़्यादा {n} अक्षर भेजता है।', 'ValueError: message bahut lamba hai: radio ek baar mein zyada se zyada {n} letters bhejta hai.'),
  MB_RADIO_GROUP: t3('ValueError: the radio group is a number from 0 to 255.', 'ValueError: रेडियो group 0 से 255 तक की संख्या होता है।', 'ValueError: radio group 0 se 255 tak ka number hota hai.'),
  MB_ANALOG_RANGE: t3('ValueError: write_analog() takes 0 to 1023, not {v}.', 'ValueError: write_analog() में 0 से 1023 तक का मान लिखिए, {v} नहीं।', 'ValueError: write_analog() mein 0 se 1023 tak ki value likhiye, {v} nahi.'),
  MB_PERIOD: t3('ValueError: the analog period is too short.', 'ValueError: एनालॉग पीरियड बहुत छोटा है।', 'ValueError: analog period bahut chhota hai.'),
  MB_PANIC: t3('RuntimeError: panic({n}): the program stopped itself.', 'RuntimeError: panic({n}): प्रोग्राम ने ख़ुद को रोक दिया।', 'RuntimeError: panic({n}): program ne khud ko rok diya.'),
};
Object.assign(CPP, MB_MSG);
export { IMG };
