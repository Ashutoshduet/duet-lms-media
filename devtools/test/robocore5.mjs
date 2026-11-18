// DUET Robotics Lab 360, batch 5: the micro:bit and Python, without a browser.
//  1. the Python interpreter (py.js): numbers as MicroPython has them, strings, lists, dicts, functions, loops, errors with
//     their line, syntax errors in plain words, and a `while True:` that never freezes (it pauses on the virtual clock)
//  2. the micro:bit (microbit.js): display, images, buttons, accelerometer and gestures, compass, temperature, light,
//     microphone, music, pins through a real circuit (LED, soil, servo), the radio between two boards
//  3. the blocks (blocks5.js): every lesson's program goes to blocks and back to the same Python
//  4. every lesson (lessons5.js), step by step as a student plays it: each step's own condition must come true
//   node devtools/test/robocore5.mjs [part]   (exit 1 on a failure)
import { compile as pyc, fmtFloat } from '../../robotics/js/py.js';
import { PY_MSG } from '../../robotics/js/py.js';
import { Lab } from '../../robotics/js/sim.js';
import { MBCore, MB_MSG } from '../../robotics/js/microbit.js';
import { batch5 } from '../../robotics/js/lessons5.js';
import { fromPython, toPython } from '../../robotics/js/blocks5.js';
import { msg, L } from '../../robotics/js/i18n.js';

let fails = 0; const ok = (c, m) => { if (!c) { fails++; console.log('FAIL ' + m); } else console.log('ok   ' + m); };
const only = process.argv[2];
const t3 = (en, hi, hg) => ({ en, hi, hg });
// a program on its own (no board): print() collected, `secs` of virtual time in frames of 16.7 ms, a 4 ms wall budget each
function py(src, secs = 2, opts = {}) {
  const c = pyc(src, opts); if (!c.ok) return { err: c.errors[0], out: '' };
  let out = ''; const t = c.make({ print: (s) => { out += s; } }); let wall = 0; let r;
  for (let f = 0; f < secs * 60 && !t.done; f++) { const w0 = performance.now(); r = t.run((f + 1) * 16667, w0 + 4); wall = Math.max(wall, performance.now() - w0); }
  return { out, err: t.err, task: t, wall, r };
}
// a micro:bit lesson desk without the page: the Uno's MCU slot runs the boards' scheduler, as in the app
function desk(cfg) { const lab = new Lab(); const taps = new Set(); const app = { lab, tapRegion: (id) => taps.add(id), setLight: (v) => { lab.env.light = v; } }; const core = new MBCore(app, cfg || {}); return { lab, core, taps, app }; }
function runOn(D, src, secs, each) {
  const r = D.core.compile(src); if (!r.ok) throw new Error('compile: ' + msg(r.errors[0]));
  D.lab.run(r); D.core.onRun(); D.src = src; let out = '';
  for (let f = 0; f < secs * 60; f++) { if (each) each(f / 60, D); D.lab.step(1000 / 60); D.core.update(1 / 60); for (const o of D.lab.mcu.ser.take()) out += String.fromCharCode(...o.bytes); if (D.lab.mcu.state === 'error') break; }
  return out;
}
const step = (D, secs, each) => { let out = ''; for (let f = 0; f < secs * 60; f++) { if (each) each(f / 60, D); D.lab.step(1000 / 60); D.core.update(1 / 60); for (const o of D.lab.mcu.ser.take()) out += String.fromCharCode(...o.bytes); } return out; };
const disp = (D, k = 0) => [...D.core.boards[k].pixelsAt(D.core.now)].map((v) => (v ? '#' : '.')).join('').match(/.{5}/g).join('/');

// ---------------------------------------------------------------- 1. the language
if (!only || only === 'py') {
  let r = py(`print(7 / 2, 7 // 2, -7 // 2, -7 % 3, 2 ** 10, 1 / 3, 0.1 + 0.2, 4 / 2, 10 * 0.5, int(3.9), round(2.5), round(3.5), abs(-4))`);
  ok(r.out === '3.5 3 -4 2 1024 0.3333333 0.3 2.0 5.0 3 2 4 4\n', 'numbers as MicroPython on a micro:bit: / gives a float (7 digits), // floors, round half to even: ' + JSON.stringify(r.out));
  r = py(`s = "Hello"\nprint(s[0], s[-1], s[1:3], s[::-1], len(s), s.upper(), s * 2, "ll" in s, s.find("l"), s.replace("l", "L"), "a,b".split(","), "-".join(["x", "y"]))`);
  ok(r.out === "H o el olleH 5 HELLO HelloHello True 2 HeLLo ['a', 'b'] x-y\n", 'strings: index, slices, methods: ' + JSON.stringify(r.out));
  r = py(`a = [3, 1, 2]\na.append(5)\na.sort()\nb = a[:]\nb.pop()\nprint(a, b, sum(a), max(a), min(a), a.index(3), [x * x for x in a if x % 2], sorted(a, reverse=True), list(range(2, 9, 3)))\nd = {"a": 1}\nd["b"] = 2\nd["a"] += 10\nprint(d, d.get("z", 0), len(d), "a" in d, sorted(d.keys()), list(d.items())[0])`);
  ok(r.out === "[1, 2, 3, 5] [1, 2, 3] 11 5 1 2 [1, 9, 25] [5, 3, 2, 1] [2, 5, 8]\n{'a': 11, 'b': 2} 0 2 True ['a', 'b'] ('a', 11)\n", 'lists, comprehensions, dicts: ' + JSON.stringify(r.out));
  r = py(`def fact(n):\n    if n <= 1:\n        return 1\n    return n * fact(n - 1)\ndef add(a, b=10):\n    return a + b\ncount = 0\ndef bump():\n    global count\n    count += 1\ndef outer():\n    x = 1\n    def inner():\n        nonlocal x\n        x += 5\n    inner()\n    return x\nbump(); bump()\nprint(fact(10), add(1), add(1, b=2), count, outer(), (lambda q: q * 3)(4), sorted(["bb", "a", "ccc"], key=len))`);
  ok(r.out === "3628800 11 3 2 6 12 ['a', 'bb', 'ccc']\n", 'functions: recursion, defaults, keywords, global, nonlocal, lambda, key=: ' + JSON.stringify(r.out));
  r = py(`for i in range(10):\n    if i == 2:\n        continue\n    if i == 5:\n        break\n    print(i, end=" ")\nelse:\n    print("no")\nn = 0\nwhile n < 3:\n    n += 1\nelse:\n    print("done", n)\nx, y = 1, 2\nx, y = y, x\nprint(x, y, 1 < x <= 2 < 3, 0 or "z", 1 and 0, not [], None is None, "%d%%" % 50, "{:>4}|{:.2f}".format(7, 3.14159), f"{x}+{y}={x + y:03d}")`);
  ok(r.out === '0 1 3 4 done 3\n2 1 True z 0 True True 50% |   7|3.14 2+1=003\n'.replace('|   7|3.14', '   7|3.14'), 'loops with break / continue / else, swaps, chained comparisons, formatting: ' + JSON.stringify(r.out));
  r = py(`try:\n    x = [1][5]\nexcept IndexError as e:\n    print("caught", type(e) == IndexError)\ntry:\n    raise ValueError("bad value")\nexcept Exception as e:\n    print(e)\nfinally:\n    print("finally")\ntry:\n    int("abc")\nexcept (TypeError, ValueError):\n    print("not a number")`);
  ok(/caught/.test(r.out) && /bad value\nfinally\nnot a number/.test(r.out), 'try / except / finally, raise, a tuple of errors: ' + JSON.stringify(r.out));
  // runtime errors: the right type, a message in plain words, the line where it happened (also inside a function)
  for (const [src, type, code, line] of [['x = 5\nprint(y)', 'NameError', 'P_NAME', 2], ['a = "Score " + 5', 'TypeError', 'P_STR_NUM', 1], ['a = [1, 2]\n\nb = a[7]', 'IndexError', 'P_INDEX', 3], ['print(1 / 0)', 'ZeroDivisionError', 'P_DIV0', 1],
    ['def f(n):\n    return n + "x"\n\nf(3)', 'TypeError', 'P_STR_NUM', 2], ['d = {}\nd["k"]', 'KeyError', 'P_KEY', 2], ['int("12a")', 'ValueError', 'P_INT_PARSE', 1], ['def f():\n    return f()\nf()', 'RuntimeError', 'P_RECURSION', 2],
    ['x = 1\ndef g():\n    x += 1\ng()', 'UnboundLocalError', 'P_UNBOUND', 3], ['import motor', 'ImportError', 'P_IMPORT', 1], ['"a".shout()', 'AttributeError', 'P_ATTR', 1], ['x = true', 'NameError', 'P_NAME', 1]]) {
    const q = py(src); ok(q.err && q.err.type === type && q.err.code === code && q.err.line === line, `${type} on line ${line}: ${q.err ? msg(q.err) : 'no error'} ${q.err ? '@' + q.err.line : ''}`);
  }
  { const q = py('x = true'); ok(/Did you mean "True"/.test(msg(q.err)), 'true -> "Did you mean True?"'); }
  // syntax errors: in plain words, with the line; C and Arduino habits explained
  for (const [src, code, line] of [['if x = 5:\n    pass', 'P_EQ_IF', 1], ['if x > 5\n    pass', 'P_COLON', 1], ['for i in range(3):\nprint(i)', 'P_NEED_INDENT', 2], ['x = 1\n    y = 2', 'P_INDENT', 2], ['if a:\n    b = 1\n  c = 2', 'P_DEDENT', 3],
    ['print("hi)', 'P_STRING', 1], ['x = (1, 2\ny = 3', 'P_PAREN', 1], ['print(“hi”)', 'P_QUOTES', 1], ['x++', 'P_PLUSPLUS', 1], ['int x = 5', 'P_TYPE_DECL', 1], ['// note', 'P_SLASHES', 1], ['if (x) {\n}', 'P_BRACE', 1],
    ['if a and b && c:\n    pass', 'P_ANDOR', 1], ['while True:\n    pass\nelse if x:\n    pass', 'P_ELSEIF', 3], ['x = 1\nelif x:\n    pass', 'P_ELSE', 2], ['return 5', 'P_OUTSIDE', 1], ['class A:\n    pass', 'P_UNSUPPORTED', 1], ['x = 08', 'P_NUMBER_ZERO', 1], ['2nd = 4', 'P_NUMBER', 1]]) {
    const c = pyc(src); ok(!c.ok && c.errors[0].code === code && c.errors[0].line === line, `syntax: ${JSON.stringify(src).slice(0, 26)} -> ${c.ok ? 'compiled!' : c.errors[0].code + '@' + c.errors[0].line}: ${c.ok ? '' : msg(c.errors[0])}`);
  }
  ok(pyc('x = 5\nx == 6\n').warnings.some((w) => w.code === 'P_W_COMPARE') && pyc('display.clear\n').warnings.some((w) => w.code === 'P_W_NOCALL'), 'warns: "x == 6" alone does nothing; a function without ( ) does nothing');
  // while True never freezes: the program pauses every few statements; sleep() moves only the virtual clock
  r = py('n = 0\nwhile True:\n    n += 1\n', 1); ok(!r.err && r.wall < 30 && r.task.R.t >= 0.9e6 - 20 || r.r === 'wall', `while True: pass returns to the page every frame (worst frame ${r.wall.toFixed(1)} ms of 4 ms budget, ${Math.round(r.task.R.t / 1e3)} ms virtual)`);
  r = py('import time\nwhile True:\n    print(time.ticks_ms())\n    time.sleep(0.5)\n', 2.2); ok(r.out.trim().split('\n').map(Number).join(',') === '0,500,1000,1500,2000', 'time.sleep(0.5): the program wakes every 500 ms of virtual time: ' + r.out.trim().split('\n').join(','));
  ok(fmtFloat(Math.fround(1e7)) === '1e+07' && fmtFloat(Math.fround(0.00001)) === '1e-05' && fmtFloat(Math.fround(123.5)) === '123.5', 'floats print as %g with 7 digits (1e+07, 1e-05, 123.5)');
  // every message in three languages
  const codes = Object.entries({ ...PY_MSG, ...MB_MSG }); ok(codes.every(([, v]) => v.en && v.hi && v.hg && (/[\u0900-\u097F]/.test(v.hi) || /^\{\w+\}: \{\w+\}$/.test(v.hi))), `${codes.length} error messages, each in English, Hindi (Devanagari) and Hinglish`);
  L.lang = 'hi'; ok(/NameError: मैं "zz" नाम को नहीं जानता/.test(msg({ code: 'P_NAME', args: { name: 'zz' } })), 'in Hindi: ' + msg({ code: 'P_NAME', args: { name: 'zz' } })); L.lang = 'en';
}

// ---------------------------------------------------------------- 2. the micro:bit
if (!only || only === 'mb') {
  let D = desk(); runOn(D, 'from microbit import *\ndisplay.show(Image.HEART)\n', 0.3); ok(disp(D) === '.#.#./#####/#####/.###./..#..' && D.core.flag('img:HEART'), 'display.show(Image.HEART): ' + disp(D));
  D = desk(); runOn(D, 'from microbit import *\ndisplay.scroll("Hi")\nprint(running_time())\n', 3, (t, d) => { if (Math.abs(t - 0.45) < 0.009) d.mid = disp(d); });
  ok(D.mid && D.mid.includes('#') && disp(D) === '...../...../...../...../.....', 'display.scroll("Hi") slides across and leaves the display blank: ' + D.mid);
  D = desk(); let out = runOn(D, 'from microbit import *\ndisplay.scroll("Hi")\nprint(running_time())\n', 3); ok(Math.abs(+out.trim() - 150 * 11) < 60, `scroll waits for the text to pass (H 4 columns + i 1, gaps, in and out: 11 steps × 150 ms): running_time() = ${out.trim()}`);
  D = desk(); out = runOn(D, 'from microbit import *\nimg = Image("90009:09090:00900:09090:90009")\nprint(img.get_pixel(0, 0), img.width())\nimg2 = img.shift_left(1)\nprint(img2.get_pixel(0, 1))\ndisplay.show(img * 0.5)\ntry:\n    Image.HEART.set_pixel(0, 0, 9)\nexcept TypeError:\n    print("read-only")\n', 0.5);
  ok(out === '9 5\r\n9\r\nread-only\r\n' && D.core.boards[0].pixelsAt(D.core.now)[0] === 5, 'Image(): pixels, shift_left, brightness × 0.5, built-in images are read-only: ' + JSON.stringify(out));
  D = desk(); runOn(D, 'from microbit import *\nn = 0\nwhile True:\n    if button_a.was_pressed():\n        n += 1\n        display.show(n)\n    if button_b.is_pressed():\n        display.show(Image.NO)\n    sleep(20)\n', 2.5, (t, d) => { const b = d.core.boards[0]; for (const x of [0.3, 0.7, 1.1]) { if (Math.abs(t - x) < 0.009) b.press('a', true); if (Math.abs(t - x - 0.1) < 0.009) b.press('a', false); } if (Math.abs(t - 1.6) < 0.009) b.press('b', true); });
  ok(D.core.val('nums').join() === '1,2,3' && D.core.val('shownImg') === 'NO', 'buttons: was_pressed() counts each press once (1, 2, 3), is_pressed() while held');
  D = desk(); runOn(D, 'from microbit import *\nwhile True:\n    if pin0.is_touched():\n        display.show(Image.HAPPY)\n    elif pin_logo.is_touched():\n        display.show(Image.HEART)\n    sleep(20)\n', 1.2, (t, d) => { const b = d.core.boards[0]; if (Math.abs(t - 0.3) < 0.009) b.press('P0', true); if (Math.abs(t - 0.5) < 0.009) b.press('P0', false); if (Math.abs(t - 0.8) < 0.009) b.press('logo', true); });
  ok(D.core.flag('img:HAPPY') && D.core.val('shownImg') === 'HEART', 'touch: a finger on pin 0 (pin0.is_touched()) and on the logo (pin_logo.is_touched())');
  D = desk(); out = runOn(D, 'from microbit import *\nwhile True:\n    print(accelerometer.get_x(), accelerometer.get_z(), accelerometer.current_gesture())\n    sleep(250)\n', 1.1, (t, d) => { d.core.boards[0].tilt.roll = t > 0.5 ? 70 : 0; });
  const lines = out.trim().split('\r\n').map((l) => l.split(' ')); ok(Math.abs(+lines[0][0]) < 20 && Math.abs(+lines[0][1] + 1024) < 20 && lines[0][2] === 'face' && +lines[lines.length - 1][0] > 900 && lines[lines.length - 1][2] === 'right', 'accelerometer: flat z ≈ −1024 "face up"; tilted right x ≈ +962 "right": ' + lines.map((l) => l.join(' ')).join(' | '));
  D = desk(); runOn(D, 'from microbit import *\ns = 0\nwhile True:\n    if accelerometer.was_gesture("shake"):\n        s += 1\n        display.show(s)\n    sleep(20)\n', 3, (t, d) => { if ([0.4, 1.2, 2.0].some((x) => Math.abs(t - x) < 0.009)) d.core.boards[0].shake(); });
  ok(D.core.val('nums').join() === '1,2,3', 'was_gesture("shake"): one count per shake: ' + D.core.val('nums').join());
  D = desk(); D.core.boards[0].yaw = 90; D.core.control('calib'); out = runOn(D, 'from microbit import *\nprint(compass.heading())\n', 16);
  ok(D.core.flag('calibrated') && out.trim() === '90', 'compass.heading() first asks to calibrate (tilt to fill the screen), then reads 90 pointing east: ' + JSON.stringify(out));
  D = desk({ temp: 31 }); D.lab.env.light = 0.1; out = runOn(D, 'from microbit import *\nprint(temperature(), display.read_light_level(), microphone.sound_level() < 50)\n', 0.3); ok(/^32 \d \w+/.test(out) && +out.split(' ')[1] < 10, 'temperature() reads the room +1 °C (the chip warms itself); the LEDs read a dark room as light level ' + out.trim());
  D = desk(); runOn(D, 'from microbit import *\nimport music\nmusic.play(music.BA_DING, wait=False)\nwhile True:\n    sleep(100)\n', 0.05); ok(D.lab.sounds.some((s) => s.kind === 'tone' && Math.abs(s.f - 987.8) < 1), 'music.play(): the speaker plays B5 = 988 Hz');
  // pins through the circuit: an LED on pin 1, the soil between 3V and pin 0, a servo on pin 0
  D = desk({ parts: [{ tag: 'soil', type: 'soil', m: 0.8 }, { tag: 'led1', type: 'led', color: 'red' }], clips: [['3V', 'soil.N1'], ['P0', 'soil.N2'], ['P1', 'led1.A'], ['GND', 'led1.K']], dry: 0 });
  out = runOn(D, 'from microbit import *\nwhile True:\n    m = pin0.read_analog()\n    print(m)\n    pin1.write_digital(1 if m < 400 else 0)\n    sleep(300)\n', 1); const wet = +out.trim().split('\r\n')[0];
  D.core.parts.soil.state.m = 0.06; out = step(D, 1); const dry = +out.trim().split('\r\n').pop();
  ok(wet > 950 && dry < 120 && D.core.ledLit('led1') && Math.abs(D.core.parts.led1.state.i * 1000 - 11.7) < 1, `soil probes: wet ${wet}, dry ${dry}; the LED on pin 1 lights with (3.3 − 1.9) V / 132 Ω ≈ 11.7 mA: ${(D.core.parts.led1.state.i * 1000).toFixed(1)} mA`);
  D = desk({ parts: [{ tag: 'led1', type: 'led' }], clips: [['P1', 'led1.K'], ['GND', 'led1.A']] }); runOn(D, 'from microbit import *\npin1.write_digital(1)\n', 0.3); ok(!D.core.ledLit('led1'), 'an LED the wrong way round stays dark');
  D = desk({ parts: [{ tag: 'sv1', type: 'servo' }], clips: [['P0', 'sv1.SIG'], ['3V', 'sv1.VP'], ['GND', 'sv1.GND']] });
  runOn(D, 'from microbit import *\npin0.set_analog_period(20)\npin0.write_analog(26)\nsleep(1200)\npin0.write_analog(77)\n', 2.5); ok(D.core.val('servo').sv1.min < 3 && Math.abs(D.core.parts.sv1.state.angle - 90) < 2, `servo: a 0.5 ms pulse turns it to 0°, 1.5 ms to 90° (${D.core.parts.sv1.state.angle.toFixed(1)}°)`);
  D = desk({ parts: [{ tag: 'sv1', type: 'servo' }], clips: [['P0', 'sv1.SIG'], ['GND', 'sv1.GND']] }); runOn(D, 'from microbit import *\npin0.write_analog(128)\n', 1.5); ok(Math.abs(D.core.parts.sv1.state.angle - 90) < 0.1, 'servo without its red (+) clip has no power and does not move');
  // the radio: two boards, the same program; another group hears nothing
  const RADIO = 'from microbit import *\nimport radio\nradio.on()\nradio.config(group=GROUP)\nwhile True:\n    if button_a.was_pressed():\n        radio.send("hello")\n    m = radio.receive()\n    if m:\n        display.scroll(m, wait=False)\n    sleep(10)\n';
  D = desk({ boards: 2 }); runOn(D, RADIO.replace('GROUP', '7'), 1.5, (t, d) => { if (Math.abs(t - 0.3) < 0.009) d.core.boards[0].press('a', true); if (Math.abs(t - 0.4) < 0.009) d.core.boards[0].press('a', false); });
  ok(D.core.obs.radioSent[0] === 1 && D.core.obs.radioGot[1] === 1 && D.core.obs.friendText === 'hello' && !D.core.obs.radioGot[0], 'radio: board 1 sends "hello", board 2 receives it and scrolls it; the sender does not hear itself');
  D = desk({ boards: 2 }); runOn(D, RADIO.replace('GROUP', '7'), 1, (t, d) => { if (Math.abs(t - 0.2) < 0.009) d.core.boards[1].radio.group = 9; if (Math.abs(t - 0.3) < 0.009) d.core.boards[0].press('a', true); });
  ok(D.core.obs.radioSent[0] === 1 && !D.core.obs.radioGot[1], 'radio: a board in another group hears nothing');
  // errors on the board: in the error box (with the line) and scrolled on the LEDs, as MicroPython does
  D = desk(); let err = null; D.lab.on((t, d) => { if (t === 'error') err = d; }); runOn(D, 'from microbit import *\n\ndisplay.scrol("x")\n', 0.3);
  ok(err && err.code === 'P_ATTR' && err.line === 3 && /Did you mean "scroll"/.test(msg(err)) && D.core.boards[0].errScroll, 'a mistake stops the program: ' + (err && msg(err)) + ' (line ' + (err && err.line) + '), and "Line 3 AttributeError" scrolls on the display');
  D = desk(); err = null; D.lab.on((t, d) => { if (t === 'error') err = d; }); runOn(D, 'display.show(Image.HEART)\n', 0.3); ok(err && /add "from microbit import \*"/.test(msg(err)), 'forgetting the import: ' + (err && msg(err)));
  D = desk(); err = null; D.lab.on((t, d) => { if (t === 'error') err = d; }); runOn(D, 'from microbit import *\ndisplay.set_pixel(5, 0, 9)\n', 0.3); ok(err && err.code === 'MB_PIXEL', 'set_pixel(5, 0, 9): ' + (err && msg(err)));
  D = desk(); err = null; D.lab.on((t, d) => { if (t === 'error') err = d; }); runOn(D, 'from microbit import *\nimport radio\nradio.send("x")\n', 0.3); ok(err && err.code === 'MB_RADIO_OFF', 'radio.send() before radio.on(): ' + (err && msg(err)));
  // the clock: speed, and a busy loop is not faster than real time
  D = desk(); D.lab.speed = 2; out = runOn(D, 'from microbit import *\nwhile True:\n    print(running_time())\n    sleep(1000)\n', 2.05); ok(out.trim().split('\r\n').join() === '0,1000,2000,3000,4000', 'at 2× speed, sleep(1000) passes twice a second: ' + out.trim().split('\r\n').join());
}

// ---------------------------------------------------------------- 3. blocks <-> Python
const LS = batch5({ t3, W: {} }, 44);
if (!only || only === 'blocks') {
  for (const l of LS) {
    const b = fromPython(l.code); const p = toPython(b); const p2 = toPython(fromPython(p)); const c = pyc(p);
    ok(c.ok && p === p2 && !b.some((x) => x.t === 'pyline' && /display|button|sleep/.test(x.f.code) && !/def /.test(x.f.code)), `${l.id}: blocks make the same program again (${b.length} blocks${b.some((x) => x.t === 'pyline') ? ', some as Python blocks' : ''})`);
  }
}

// ---------------------------------------------------------------- 4. every lesson, as a student plays it
// what the student does in each "act" step (and between "watch" steps), in order
const ACT = {
  mbmeet: [(D) => ['mb_leds'].forEach((r) => D.core.tap(r)), (D) => { D.core.tap('mb_a'); D.core.tap('mb_b'); }, (D) => D.core.tap('mb_logo'), (D) => D.core.tap('mb_pins'), (D) => D.core.control('flip'), (D) => ['mb_cpu', 'mb_motion', 'mb_speaker'].forEach((r) => D.core.tap(r)), (D) => ['mb_usb', 'mb_battery', 'mb_radio'].forEach((r) => D.core.tap(r)), (D) => D.core.control('flip')],
  mbcount: [(D) => presses(D, 'a', 3), (D) => presses(D, 'b', 1), (D) => presses(D, 'a', 3)],
  mbsteps: [(D) => { D.core.control('tilt', 'right'); D.after = () => D.core.control('tilt', 'flat'); }, (D) => shakes(D, 3), (D) => shakes(D, 4)],
  mbtemp: [(D) => D.core.control('temp', 40)],
  mbcompass: [(D) => D.core.control('calib'), (D) => D.core.control('heading', 90), (D) => D.core.control('heading', 180), (D) => presses(D, 'a', 1)],
  mbnight: [(D) => D.core.control('light', 10), (D) => D.core.control('light', 90), (D) => D.core.control('light', 10)],
  mbrps: [(D) => shakes(D, 1), (D) => { D.fs = (t) => { if (t > 0.2 && !D.fsd) { D.fsd = 1; D.core.boards[1].shake(); } }; }, (D) => { D.round = 0; D.fs = (t) => { const k = Math.floor(t / 2.2); if (k > D.round && k <= 3) { D.round = k; D.core.boards[0].shake(); setT(D, 0.4, () => D.core.boards[1].shake()); } }; }, (D) => { D.fsd = 0; D.fs = (t) => { if (t > 0.2 && !D.fsd) { D.fsd = 1; D.core.boards[0].shake(); setT(D, 0.4, () => D.core.boards[1].shake()); } }; }],
  mbplant: [(D) => D.core.addClip('3V', 'soil.N1'), (D) => D.core.addClip('P0', 'soil.N2'), (D) => D.core.addClip('P1', 'led1.A'), (D) => D.core.addClip('GND', 'led1.K'), (D) => D.core.control('water')],
  mbgate: [(D) => D.core.addClip('P0', 'sv1.SIG'), (D) => D.core.addClip('3V', 'sv1.VP'), (D) => D.core.addClip('GND', 'sv1.GND'), (D) => presses(D, 'a', 1), (D) => presses(D, 'b', 1), (D) => presses(D, 'a', 1)],
};
function setT(D, dt, f) { (D.timers = D.timers || []).push([D.t + dt, f]); }
function presses(D, k, n) { for (let i = 0; i < n; i++) { setT(D, 0.15 + i * 0.4, () => D.core.boards[0].press(k, true)); setT(D, 0.3 + i * 0.4, () => D.core.boards[0].press(k, false)); } }
function shakes(D, n) { for (let i = 0; i < n; i++) setT(D, 0.2 + i * 0.7, () => D.core.boards[0].shake()); }
if (!only || only === 'lessons' || LS.some((l) => l.id === only)) {
  ok(LS.length === 11 && new Set(LS.map((l) => l.id)).size === 11 && LS.every((l) => l.n > 44 && l.lang === 'py'), `${LS.length} micro:bit lessons, n ${LS[0].n}–${LS[LS.length - 1].n}`);
  for (const l of LS) {
    if (only && only !== 'lessons' && only !== l.id) continue;
    for (const s of l.steps) for (const k of ['do', 'see']) if (s[k]) for (const lg of ['en', 'hi', 'hg']) if (typeof s[k][lg] !== 'string' || (k === 'do' && !s[k][lg])) ok(false, `${l.id}: step ${s.k} has ${k}.${lg}`);
    for (const k of ['title', 'goal']) for (const lg of ['en', 'hi', 'hg']) if (!l[k][lg]) ok(false, `${l.id}: ${k}.${lg}`);
    const c0 = pyc(l.code); if (!c0.ok) { ok(false, `${l.id}: program compiles: ${msg(c0.errors[0])}`); continue; }
    const D = desk(l.world); D.lab.env.light = 0.75; D.t = 0; D.src = l.code; const acts = (ACT[l.id] || []).slice();
    const S = { app: { world: D.core, code: () => D.src }, w: (f) => D.core.flag(f), wv: (n) => D.core.val(n), tapped: (r) => D.taps.has(r), running: () => D.lab.mcu.state === 'running' };
    const tick = (secs, until) => { for (let f = 0; f < secs * 60; f++) { D.t += 1 / 60; if (D.fs) D.fs(D.t - D.t0); for (const tm of (D.timers || []).filter((x) => x[0] <= D.t)) { tm[1](); D.timers.splice(D.timers.indexOf(tm), 1); } D.lab.step(1000 / 60); D.core.update(1 / 60); D.lab.mcu.ser.take(); if (until && until()) return true; } return !until || until(); };
    const t0 = Date.now(); let okAll = true; const log = [];
    for (const [i, s] of l.steps.entries()) {
      let done = false;
      if (s.k === 'info') done = true;
      else if (s.k === 'run') { const r = D.core.compile(D.src); D.lab.run(r); D.core.onRun(); done = tick(0.3, () => S.running()); }
      else if (s.k === 'edit') { const src = s.set.reduce((x, [re, v]) => x.replace(re, v), D.src); done = s.test(src) && !s.test(l.code); D.src = src; const r = D.core.compile(src); if (!r.ok) { ok(false, `${l.id}: step ${i} edit compiles: ${msg(r.errors[0])}`); done = false; } else { D.lab.run(r); D.core.onRun(); D.t0 = D.t; tick(0.2); } }
      else if (s.k === 'check') { const bad = (l.check || []).map((f) => f(S)).find(Boolean); done = !bad; if (bad) log.push('check: ' + JSON.stringify(bad[0].en)); }
      else if (s.k === 'act' || s.k === 'watch') {
        if (s.k === 'act') { const f = acts.shift(); D.t0 = D.t; if (f) f(D); }
        done = tick(s.k === 'watch' ? 40 : 30, () => { try { return !!s.until(S); } catch (e) { return false; } });
        if (D.after) { D.after(); D.after = null; tick(0.5); }
        D.fs = null;
      }
      if (!done) { okAll = false; log.push(`step ${i} (${s.k}) not done`); break; }
    }
    const fin = (() => { try { return !!l.done(S); } catch (e) { return false; } })();
    ok(okAll && fin, `${l.id} (n ${l.n}): all ${l.steps.length} steps done, lesson complete in ${(D.t).toFixed(0)} s of board time, ${Date.now() - t0} ms` + (log.length ? ' · ' + log.join(' · ') + ` · shown ${D.core.val('shownImg')} nums ${D.core.val('nums').slice(-5)} texts ${D.core.val('texts').slice(-3)}` : '') + (fin ? '' : ' · done() false'));
  }
  // a wrong circuit gets its own message
  const plant = LS.find((l) => l.id === 'mbplant'); const D = desk(plant.world); D.core.addClip('3V', 'soil.N1'); D.core.addClip('P0', 'soil.N2'); D.core.addClip('P1', 'led1.K'); D.core.addClip('GND', 'led1.A');
  const S = { w: (f) => D.core.flag(f), wv: (n) => D.core.val(n) }; const bad = plant.check.map((f) => f(S)).find(Boolean);
  ok(bad && /wrong way round/.test(bad[0].en), 'plant: the LED clipped the wrong way round: "' + (bad && bad[0].en) + '"');
}
console.log(fails ? `${fails} FAILED` : 'all passed'); process.exit(fails ? 1 : 0);
