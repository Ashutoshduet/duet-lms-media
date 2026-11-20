// DUET Robotics Lab 360, batch 6: the Raspberry Pi boards without a browser.
//  1. the boards: the Pico's pins in the breadboard (rows c and h, the holes it covers), the Pi 4's 40-pin header (BCM and
//     physical numbers, 3V3 / 5V / GND), the circuit hooks (pull-downs, the 1.8 kΩ pull-ups on GPIO 2 / 3, clamp diodes)
//  2. MicroPython on the Pico: Pin, PWM, ADC (and the temperature sensor), time_pulse_us with an HC-SR04 through a
//     divider, irq, Timer, errors with their line, the kind hints (a pin in the code with no wire, leg numbers as GP numbers)
//  3. Python on the Pi 4: gpiozero (LED, PWMLED, Button and its events, MotionSensor, Buzzer, DistanceSensor, Servo, Motor,
//     Robot on an L298N), pause() and a program that ends, RPi.GPIO, adafruit_dht with its odd failed reading, input()
//  4. every lesson (lessons6.js), step by step as a student plays it: built at its ghosts, checked, run, edited, acted on
//   node devtools/test/robocore6.mjs [engine|lessons|<id>,...]   (exit 1 on a failure)
import { compile } from '../../robotics/js/cpp.js';
import { Lab } from '../../robotics/js/sim.js';
import { BOARDS, holeAt } from '../../robotics/js/boards.js';
import { msg, L } from '../../robotics/js/i18n.js';
import { servoAngle } from '../../robotics/js/pi6.js';
import { batch6 } from '../../robotics/js/lessons6.js';
import { LESSONS, BY_ID, LESSON_WORDS } from '../../robotics/js/lessons.js';
import { LessonRT } from '../../robotics/js/lessonrt.js';
import { CarSim } from '../../robotics/js/robots.js';
import { BO } from '../../robotics/js/parts2.js';
const t3 = (en, hi, hg) => ({ en, hi, hg });

let fails = 0; const ok = (c, m) => { if (!c) { fails++; console.log('FAIL ' + m); } else console.log('ok   ' + m); };
const arg = process.argv[2] || ''; const only = arg && !['engine', 'lessons'].includes(arg) ? arg.split(',') : null;
const near = (a, b, tol) => Math.abs(a - b) <= tol;
const serial = (lab) => { let s = ''; for (const o of lab.mcu.ser.take()) s += String.fromCharCode(...o.bytes); return s; };
function run(lab, src, secs, each) {
  const c = compile(src, lab.def); if (!c.ok) return { out: '', err: c.errors[0], compile: true };
  const notes = []; const warns = []; const off = lab.on((t, d) => { if (t === 'note') notes.push(d.code); if (t === 'warn') warns.push(d); });
  lab.run(c); let out = serial(lab); const dt = 1 / 60;
  for (let f = 0; f < secs * 60; f++) { if (each) each(f * dt, f); lab.step(1000 * dt); out += serial(lab); if (lab.mcu.state === 'error') break; }
  off(); return { out, err: lab.mcu.state === 'error' ? lab.mcu.err : null, notes, warns, mcu: lab.mcu };
}
const en = (e) => { const o = L.lang; L.lang = 'en'; const s = msg(e); L.lang = o; return s; };
const pico = () => { const lab = new Lab(); lab.setBoard('pico'); return lab; };
const pi = () => { const lab = new Lab(); lab.setBoard('pi4'); return lab; };
const rail = (r, col) => { for (let i = 0; i < 50; i++) if (3 + i + Math.floor(i / 5) === col) return 'H:' + r + (i + 1); throw new Error('no rail hole at column ' + col); };

if (!only && arg !== 'lessons') {
  // ------------------------------------------------------------ 1. the boards
  { const P = BOARDS.pico, Q = BOARDS.pi4;
    ok(P.pins.length === 40 && P.pins.filter((p) => p.gpio !== undefined).length === 26, `Pico: 40 pins, 26 GPIO (${P.pins.filter((p) => p.gpio !== undefined).length})`);
    ok(Q.pins.length === 40 && Q.pins.filter((p) => p.gpio !== undefined).length === 28 && Q.pins.filter((p) => p.net === 'GND').length === 8, 'Pi 4: 40-pin header, 28 GPIO (BCM 0–27), 8 GND');
    const lab = pico(); const m = lab.bbMap();
    ok(m.pin.get('GP0') === 'h2' && m.pin.get('GP15') === 'h21' && m.pin.get('VBUS') === 'c2' && m.pin.get('GP16') === 'c21' && m.pin.get('3V3') === 'c6', 'Pico in the breadboard: GP0 in 2h, GP15 in 21h, VBUS in 2c, 3V3 in 6c, GP16 in 21c');
    ok(lab.endpointFree('H:a2') && lab.endpointFree('H:j21') && !lab.endpointFree('H:e10') && !lab.endpointFree('H:f10') && lab.endpointFree('H:a23'), 'Pico: two free holes beside each pin (a, b / i, j); d–g under it are covered');
    ok(lab.conn('GP15', 'H:j21') && lab.conn('GND1', 'H:i4') && lab.conn('VBUS', 'H:a2'), 'Pico: a pin is joined to its column');
    const q = pi(); const p11 = Q.pins.find((p) => p.phys === 11), p1 = Q.pins.find((p) => p.phys === 1), p2 = Q.pins.find((p) => p.phys === 2), p40 = Q.pins.find((p) => p.phys === 40);
    ok(p11.id === 'GPIO17' && p1.net === '3V3' && p2.net === '5V' && p40.id === 'GPIO21' && Q.pins.find((p) => p.phys === 39).net === 'GND', 'Pi 4 header: pin 1 3V3, pin 2 5V, pin 11 GPIO 17, pin 39 GND, pin 40 GPIO 21');
    ok(p1.at[0] < p2.at[0] && p1.at[1] < p40.at[1] && near(p2.at[0] - p1.at[0], 2.54, 0.01) && near(p40.at[1] - p1.at[1], 19 * 2.54, 0.01), 'Pi 4 header: odd pins inside, even pins on the edge, pin 1 at the back, 2.54 mm pitch');
    ok(q.endpointFree('B:GPIO17') && !q.def.bb && q.board.x === -98, 'Pi 4 on the mat; its pins take jumper wires');
    q.setBoard('uno'); ok(q.def.id === 'uno' && q.board.x === -92, 'back to the Uno, in its old place'); }

  // ------------------------------------------------------------ 2. the Pico (MicroPython)
  { const lab = pico(); const r = run(lab, 'from machine import Pin\nimport time\nled = Pin("LED", Pin.OUT)\nwhile True:\n    led.toggle()\n    time.sleep(0.5)\n', 4);
    const o = lab.obs.leds.L; ok(!r.err && o && o.toggles >= 6 && near(o.periods[o.periods.length - 1], 0.5, 0.05), `onboard LED (GP25, "LED") blinks every 0.5 s: ${o && o.toggles} toggles` + (r.err ? ' ' + en(r.err) : ''));
    ok(r.out.startsWith('MPY: soft reboot'), 'the Shell starts with "MPY: soft reboot"'); }
  const picoLed = (lab, res) => { lab.addPart('led', { color: 'red' }, { hole: 'f31' }, 0, 'led1'); if (res) lab.addPart('resistor', { ohms: res }, { hole: 'j31' }, 1, 'r1'); lab.addWire('H:j19', rail('bn', 19)); lab.addWire('H:i21', 'H:g32'); if (!res) lab.addWire('H:j31', rail('bn', 31)); };
  { const lab = pico(); picoLed(lab, 220); const r = run(lab, 'from machine import Pin\nled = Pin(15, Pin.OUT)\nled.value(1)\n', 1);
    const led = lab.byTag('led1'); ok(!r.err && near(led.state.i * 1000, 6.0, 0.8) && lab.conn('led1.A', 'GP15') && lab.conn('r1.2', 'GND'), `LED + 220 Ω on GP15: (3.3 V − 1.8 V) / 245 Ω ≈ ${(led.state.i * 1000).toFixed(1)} mA` + (r.err ? ' ' + en(r.err) : '')); }
  { const lab = pico(); picoLed(lab, 0); const r = run(lab, 'from machine import Pin\nPin(15, Pin.OUT).on()\n', 1);
    ok(r.warns.some((w) => /mA/.test(w.msg.en)) && lab.byTag('led1').state.burnt, `no resistor: "${r.warns[0] && r.warns[0].msg.en.slice(0, 40)}…" and the LED burns`); }
  { const lab = pico(); picoLed(lab, 220); const r = run(lab, 'from machine import Pin\nled = Pin(14, Pin.OUT)\nwhile True:\n    led.toggle()\n    import time\n    time.sleep(0.3)\n', 2.5);
    ok(r.notes.includes('N6_PINS'), 'Pin(14) with the LED on GP15: the hint "did you mean GP15?" (' + r.notes.join(',') + ')'); }
  { const lab = pico(); picoLed(lab, 220); const r = run(lab, 'from machine import Pin\nimport time\nled = Pin(20, Pin.OUT)\nwhile True:\n    led.toggle()\n    time.sleep(0.3)\n', 2.5);
    ok(r.notes.includes('N6_PICO_PHYS'), 'Pin(20) when the wire is on leg 20 (GP15): the hint "Pin(20) means GP20, not the 20th leg" (' + r.notes.join(',') + ')'); }
  { const lab = pico(); lab.addPart('button', {}, { hole: 'e40' }, 0, 'b1'); lab.addWire('H:i19', 'H:i42'); lab.addWire('H:i20', 'H:j40'); // GP14 -> leg 2 (strip 40 bottom), GND -> leg 4 (strip 42 bottom)
    const b = lab.byTag('b1'); const r = run(lab, 'from machine import Pin\nimport time\nbtn = Pin(14, Pin.IN, Pin.PULL_UP)\nwhile True:\n    print(btn.value())\n    time.sleep(0.1)\n', 2, (t) => { b.state.pressed = t > 1; lab.rebuild(); });
    const L1 = r.out.split('\r\n').filter((x) => /^[01]$/.test(x)); ok(!r.err && L1[0] === '1' && L1[L1.length - 1] === '0', `button with PULL_UP to GND: 1 free, 0 pressed (${L1.slice(0, 3)}…${L1.slice(-2)})` + (r.err ? ' ' + en(r.err) : ''));
    lab.wires = lab.wires.filter((w) => w.b !== 'H:i42'); lab.addWire('H:a6', 'H:a42'); lab.rebuild(); // the other leg to 3V3 instead
    const r2 = run(lab, 'from machine import Pin\nimport time\nbtn = Pin(14, Pin.IN, Pin.PULL_DOWN)\nwhile True:\n    print(btn.value())\n    time.sleep(0.1)\n', 2, (t) => { b.state.pressed = t > 1; lab.rebuild(); });
    const L2 = r2.out.split('\r\n').filter((x) => /^[01]$/.test(x)); ok(!r2.err && L2[0] === '0' && L2[L2.length - 1] === '1', `button with PULL_DOWN to 3V3: 0 free, 1 pressed (${L2.slice(0, 3)}…${L2.slice(-2)})` + (r2.err ? ' ' + en(r2.err) : '')); }
  { const lab = pico(); picoLed(lab, 220); const r = run(lab, 'from machine import Pin, PWM\nimport time\npwm = PWM(Pin(15))\npwm.freq(1000)\nwhile True:\n    for d in range(0, 65536, 4096):\n        pwm.duty_u16(d)\n        time.sleep(0.02)\n', 3);
    const lv = lab.mcu.obs6.duty[15]; ok(!r.err && lv && lv.size >= 10 && lab.obs.leds[lab.byTag('led1').uid].levels.size >= 3, `PWM fade on GP15: ${lv && lv.size} duty steps, the LED's brightness changes` + (r.err ? ' ' + en(r.err) : ''));
    const r2 = run(lab, 'from machine import Pin, PWM\npwm = PWM(Pin(15))\npwm.freq(1000)\npwm.duty_u16(32768)\n', 1); ok(near(lab.byTag('led1').state.i * 1000, 3.0, 0.6), `duty 50 %: about half the current (${(lab.byTag('led1').state.i * 1000).toFixed(1)} mA)` + (r2.err ? ' ' + en(r2.err) : ''));
    const r3 = run(lab, 'from machine import Pin, PWM\npwm = PWM(Pin(15))\npwm.freq(2)\n', 0.5); ok(r3.err && r3.err.code === 'N6_PWM_FREQ' && r3.err.line === 3, 'freq(2): ValueError on line 3, "8 Hz to 62.5 MHz"'); }
  { const lab = pico(); const pot = lab.addPart('pot', {}, { hole: 'a30' }, 0, 'pot1'); lab.addWire('H:a6', rail('tp', 29)); lab.addWire(rail('tp', 30), 'H:b30'); lab.addWire('H:b4', rail('tn', 33)); lab.addWire(rail('tn', 34), 'H:b34'); lab.addWire('H:b11', 'H:b32'); // 3V3 – pot – GND, wiper -> GP26
    const r = run(lab, 'from machine import ADC\nimport time\nknob = ADC(26)\ntemp = ADC(4)\nwhile True:\n    print(knob.read_u16(), temp.read_u16())\n    time.sleep(0.2)\n', 1.2);
    const L1 = r.out.split('\r\n').filter((x) => /^\d+ \d+$/.test(x)).map((x) => x.split(' ').map(Number)); const [k, t] = L1[L1.length - 1] || [];
    const deg = 27 - (t * 3.3 / 65535 - 0.706) / 0.001721;
    ok(!r.err && near(k, 32768, 400) && near(deg, 28.4, 1.5), `ADC: the knob at the middle reads ${k} (of 65535), ADC(4) gives ${Math.round(deg * 10) / 10} °C` + (r.err ? ' ' + en(r.err) : ''));
    pot.state.pos = 1; lab.stateV++; const r2 = run(lab, 'from machine import ADC\nprint(ADC(Pin(26)).read_u16())\n', 0.3); ok(r2.err && r2.err.code === 'N6_NAME_MOD' && /from machine import Pin/.test(en(r2.err)), 'Pin without its import: "add from machine import Pin" (' + (r2.err && en(r2.err)).slice(0, 60) + ')');
    const r3 = run(lab, 'from machine import ADC\nx = ADC(15)\n', 0.3); ok(r3.err && r3.err.code === 'N6_ADC_PIN' && r3.err.line === 2, 'ADC(15): "ADC works on GP26, GP27 and GP28 only", line 2');
    lab.wires = lab.wires.filter((w) => w.a !== 'H:a6'); lab.addWire('H:a2', rail('tp', 29)); pot.state.pos = 0; lab.rebuild(); // the knob on VBUS (5 V) instead of 3V3, turned to that end
    const r4 = run(lab, 'from machine import ADC\nimport time\nwhile True:\n    print(ADC(26).read_u16())\n    time.sleep(0.2)\n', 1); if (process.env.DEBUG) console.log(JSON.stringify(r4.warns), r4.err, lab.voltageAt("B:GP26")); ok(r4.warns.some((w) => /3\.3 V/.test(w.msg.en) && /GP26/.test(w.args.pin)), '5 V on GP26 through the knob: "' + ((r4.warns[0] && r4.warns[0].args.v) || '?') + ' V is reaching GP26!"'); }
  { const lab = pico(); const sv = lab.addPart('servo', {}, { x: 30, z: 120 }, 0, 'sv1'); lab.addWire('T:' + sv.uid + ':GND', 'H:i4'); lab.addWire('T:' + sv.uid + ':VP', 'H:a2'); lab.addWire('T:' + sv.uid + ':SIG', 'H:a21');
    const r = run(lab, 'from machine import Pin, PWM\nservo = PWM(Pin(16))\nservo.freq(50)\nservo.duty_u16(4915)\n', 1.5); ok(!r.err && near(sv.state.angle, 90, 3), `servo on GP16, 50 Hz, duty 4915 (1.5 ms): ${sv.state.angle.toFixed(1)}°` + (r.err ? ' ' + en(r.err) : ''));
    ok(servoAngle({ f: 50, d: 0.025 }) === 0 && servoAngle({ f: 50, d: 0.125 }) === 180 && servoAngle({ f: 1000, d: 0.5 }) === null, 'servo pulses: 0.5 ms → 0°, 2.5 ms → 180°, 1 kHz PWM is not a servo signal'); }
  const sonar = (lab, divider) => { // HC-SR04 at 45j–48j: VCC 45, TRIG 46, ECHO 47, GND 48; VBUS on the top + rail; Pico GND on the bottom − rail
    const us = lab.addPart('hcsr04', {}, { hole: 'j45' }, 0, 'us1'); lab.addWire('H:a2', rail('tp', 3)); lab.addWire(rail('tp', 43), 'H:f45'); lab.addWire('H:i19', rail('bn', 19)); lab.addWire(rail('bn', 48), 'H:f48');
    lab.addWire('H:a20', 'H:f46'); // GP17 -> TRIG
    if (divider) { lab.addPart('resistor', { ohms: 1000 }, { hole: 'g47' }, 2, 'r1'); lab.addPart('resistor', { ohms: 2200 }, { hole: 'j43' }, 1, 'r2'); lab.addWire('H:i43', 'H:a21'); } // ECHO – 1 kΩ – 43 – 2.2 kΩ – GND; 43 -> GP16
    else lab.addWire('H:g47', 'H:a21');
    return us; };
  const SONAR = 'from machine import Pin, time_pulse_us\nimport time\ntrig = Pin(17, Pin.OUT)\necho = Pin(16, Pin.IN)\nwhile True:\n    trig.low()\n    time.sleep_us(2)\n    trig.high()\n    time.sleep_us(10)\n    trig.low()\n    t = time_pulse_us(echo, 1, 30000)\n    print(round(t * 0.0343 / 2, 1))\n    time.sleep(0.2)\n';
  { const lab = pico(); const us = sonar(lab, true); us.state.dist = 25; const r = run(lab, SONAR, 1.5);
    const L1 = r.out.split('\r\n').filter((x) => /^-?\d+(\.\d+)?$/.test(x)).map(Number); const v = L1[L1.length - 1];
    ok(!r.err && near(v, 25, 1.2) && !r.warns.length, `HC-SR04 through 1 kΩ + 2.2 kΩ: ${v} cm, no warning (echo at GP16 ${(lab.voltageAt('r2.1') || 0).toFixed(2)} V max)` + (r.err ? ' ' + en(r.err) : ''));
    const lab2 = pico(); const us2 = sonar(lab2, false); us2.state.dist = 40; const r2 = run(lab2, SONAR, 1.5); const L2 = r2.out.split('\r\n').filter((x) => /^-?\d+(\.\d+)?$/.test(x)).map(Number);
    ok(near(L2[L2.length - 1], 40, 1.5) && r2.warns.some((w) => /reaching GP16/.test(tx6(w))), `no divider: it reads ${L2[L2.length - 1]} cm, but "5 V is reaching GP16!"`); }
  { const lab = pico(); picoLed(lab, 220); lab.addPart('button', {}, { hole: 'e40' }, 0, 'b1'); lab.addWire('H:i20', 'H:j40'); lab.addWire('H:i19', 'H:i42'); const b = lab.byTag('b1');
    const r = run(lab, 'from machine import Pin\nimport time\nled = Pin(15, Pin.OUT)\nbtn = Pin(14, Pin.IN, Pin.PULL_UP)\ndef pressed(p):\n    led.toggle()\nbtn.irq(trigger=Pin.IRQ_FALLING, handler=pressed)\nwhile True:\n    time.sleep(1)\n', 3, (t) => { b.state.pressed = (t > 0.5 && t < 0.8) || (t > 1.5 && t < 1.8) || (t > 2.4 && t < 2.6); lab.rebuild(); });
    ok(!r.err && lab.mcu.obs6.events.irq === 3 && lab.byTag('led1').state.b > 0.2, `irq on GP14 (falling): 3 presses → 3 calls, the LED ends on` + (r.err ? ' ' + en(r.err) : ''));
    const r2 = run(lab, 'from machine import Pin, Timer\nled = Pin(15, Pin.OUT)\ndef tick(t):\n    led.toggle()\nTimer(period=250, mode=Timer.PERIODIC, callback=tick)\n', 2.1);
    ok(!r2.err && lab.mcu.obs6.events.timer >= 7 && lab.obs.leds[lab.byTag('led1').uid].toggles >= 6, `Timer(period=250): ${lab.mcu.obs6.events.timer} ticks after the program ended (the Pico keeps its timers)` + (r2.err ? ' ' + en(r2.err) : '')); }
  { const lab = pico(); const r = run(lab, 'from machine import Pin\nx = 0\nwhile True:\n    x += 1\n', 1); ok(!r.err && lab.mcu.state === 'running' && lab.mcu.t > 0.9e6, '`while True:` with no sleep: the page does not freeze, the clock goes on');
    const r2 = run(lab, 'from machine import Pin\nled = Pin(30, Pin.OUT)\n', 0.3); ok(r2.err && r2.err.code === 'N6_PIN_BAD' && r2.err.line === 2, 'Pin(30): "there is no pin 30 on the Pico", line 2');
    const r3 = run(lab, 'from gpiozero import LED\n', 0.3); ok(r3.err && r3.err.code === 'N6_MOD_PICO', 'gpiozero on the Pico: "for the Raspberry Pi computer… use machine.Pin"');
    ok(/Traceback \(most recent call last\):\r\n  File "<stdin>", line 1/.test(r3.out), 'the Shell shows a MicroPython traceback'); }

  // ------------------------------------------------------------ 3. the Pi 4 (Python 3, gpiozero)
  const piLed = (lab, gpio = 'GPIO17') => { lab.addPart('led', { color: 'red' }, { hole: 'f31' }, 0, 'led1'); lab.addPart('resistor', { ohms: 330 }, { hole: 'j31' }, 1, 'r1'); lab.addWire('B:GND1', rail('bn', 31 + 4)); lab.addWire('B:' + gpio, 'H:g32'); };
  { const lab = pi(); piLed(lab); const r = run(lab, 'from gpiozero import LED\nfrom signal import pause\nled = LED(17)\nled.blink(on_time=0.5, off_time=0.5)\npause()\n', 4);
    const o = lab.obs.leds[lab.byTag('led1').uid]; ok(!r.err && o.toggles >= 6 && near(o.periods[o.periods.length - 1], 0.5, 0.05) && /pi@raspberrypi:~ \$ python3 main.py/.test(r.out), `gpiozero LED(17).blink() with pause(): ${o.toggles} toggles, 0.5 s each; the terminal shows "python3 main.py"` + (r.err ? ' ' + en(r.err) : ''));
    const r2 = run(lab, 'from gpiozero import LED\nfrom time import sleep\nled = LED(11)\nwhile True:\n    led.toggle()\n    sleep(0.4)\n', 2.5); ok(r2.notes.includes('N6_PHYS'), 'LED(11) with the LED on physical pin 11: "LED(11) means GPIO 11… write 17" (' + r2.notes.join(',') + ')');
    const r3 = run(lab, 'from gpiozero import LED\nled = LED("BOARD11")\nled.on()\nwhile True:\n    pass\n', 1); ok(!r3.err && lab.byTag('led1').state.b > 0.2, 'LED("BOARD11") is GPIO 17');
    const r4 = run(lab, 'from gpiozero import LED\nled = LED(40)\n', 0.3); ok(r4.err && r4.err.code === 'N6_PI_PIN' && /BOARD40/.test(en(r4.err)), 'LED(40): "no GPIO 40… if 40 is a physical pin number, write BOARD40"');
    const r5 = run(lab, 'from gpiozero import LED, Button\nled = LED(17)\nb = Button(17)\n', 0.3); ok(r5.err && r5.err.code === 'N6_IN_USE' && r5.err.line === 3, 'two devices on GPIO 17: GPIOPinInUse on line 3'); }
  { const lab = pi(); piLed(lab); lab.addPart('button', {}, { hole: 'e44' }, 0, 'b1'); lab.addWire('B:GPIO27', 'H:a44'); lab.addWire('B:GND2', 'H:a46'); const b = lab.byTag('b1');
    const press = (t) => { b.state.pressed = (t > 0.6 && t < 1.0) || (t > 1.6 && t < 2.0); lab.rebuild(); };
    const r = run(lab, 'from gpiozero import LED, Button\nfrom signal import pause\nled = LED(17)\nbutton = Button(27)\nbutton.when_pressed = led.toggle\npause()\n', 2.6, press);
    ok(!r.err && lab.mcu.obs6.events.pressed === 2 && lab.obs.leds[lab.byTag('led1').uid].toggles === 2, 'Button(27).when_pressed = led.toggle: two presses, two toggles' + (r.err ? ' ' + en(r.err) : ''));
    const r2 = run(lab, 'from gpiozero import LED, Button\nled = LED(17)\nbutton = Button(27)\nbutton.when_pressed = led.on\nbutton.when_released = led.off\n', 2.6, press);
    ok(r2.notes.includes('N6_ENDED') && lab.mcu.state === 'done' && lab.byTag('led1').state.b < 0.05 && /\$ $/.test(r2.out), 'no pause(): the program ends, gpiozero closes, the hint "add pause()", the prompt comes back');
    const r3 = run(lab, 'from gpiozero import LED, Button\nled = LED(17)\nbutton = Button(27)\nwhile True:\n    button.wait_for_press()\n    led.on()\n    button.wait_for_release()\n    led.off()\n', 2.6, press);
    ok(!r3.err && lab.obs.leds[lab.byTag('led1').uid].toggles >= 3, 'wait_for_press() / wait_for_release() follow the button'); }
  { const lab = pi(); const pir = lab.addPart('pir', {}, { x: 60, z: 110 }, 0, 'pir1'); lab.addPart('abuzz', {}, { hole: 'e50' }, 0, 'bz1');
    lab.addWire('T:' + pir.uid + ':VCC', 'B:5V'); lab.addWire('T:' + pir.uid + ':GND', 'B:GND3'); lab.addWire('T:' + pir.uid + ':OUT', 'B:GPIO4'); lab.addWire('B:GPIO18', 'H:a50'); lab.addWire('B:GND4', 'H:a53');
    const r = run(lab, 'from gpiozero import MotionSensor, Buzzer\nfrom time import sleep\npir = MotionSensor(4)\nbuzzer = Buzzer(18)\nsleep(3)\nwhile True:\n    pir.wait_for_motion()\n    print("Motion!")\n    buzzer.beep(0.2, 0.2, n=3, background=False)\n', 7, (t) => { pir.state.motion = t > 4 && t < 4.5; });
    ok(!r.err && /Motion!/.test(r.out) && lab.byTag('bz1').state.beeps >= 3 && lab.obs.tones.has(2300), `PIR on GPIO 4 + active buzzer on GPIO 18: "Motion!", ${lab.byTag('bz1').state.beeps} beeps` + (r.err ? ' ' + en(r.err) : '')); }
  { const lab = pi(); lab.addPart('dht11', {}, { hole: 'e40' }, 0, 'th1'); lab.addWire('B:GPIO4', 'H:a40'); lab.addWire('B:3V3', 'H:a41'); lab.addWire('B:GND1', 'H:a42'); lab.env.temp = 31;
    const src = 'import adafruit_dht, board, time\ndht = adafruit_dht.DHT11(board.D4)\nwhile True:\n    try:\n        print("Temp:", dht.temperature, "C  Humidity:", dht.humidity, "%")\n    except RuntimeError as e:\n        print("Again:", e)\n    time.sleep(2)\n';
    const r = run(lab, src, 13); const T = r.out.split('\r\n').filter((x) => /^Temp:/.test(x));
    ok(!r.err && T.length >= 4 && /Again: Checksum did not validate/.test(r.out) && /Temp: 3\d/.test(T[T.length - 1]), `DHT11 on GPIO 4 with adafruit_dht: ${T[T.length - 1]}; a failed reading is caught` + (r.err ? ' ' + en(r.err) : ''));
    const r2 = run(lab, src.replace('DHT11', 'DHT22'), 3); ok(r2.notes.includes('N6_DHT22') && /Temp: \d{3}/.test(r2.out), 'DHT22 code on a DHT11: silly numbers and the hint "use DHT11"');
    lab.wires = lab.wires.filter((w) => w.a !== 'B:GPIO4'); lab.rebuild(); const r3 = run(lab, 'import adafruit_dht, board\ndht = adafruit_dht.DHT11(board.D4)\nprint(dht.temperature)\n', 1); ok(r3.err && r3.err.code === 'N6_DHT_NONE' && r3.err.line === 3, 'no wire on DATA: "DHT sensor not found, check wiring", line 3'); }
  { const lab = pi(); const us = lab.addPart('hcsr04', {}, { hole: 'j45' }, 0, 'us1'); lab.addWire('B:5V', 'H:f45'); lab.addWire('B:GND1', rail('bn', 48)); lab.addWire(rail('bn', 49), 'H:f48'); lab.addWire('B:GPIO23', 'H:f46');
    lab.addPart('resistor', { ohms: 1000 }, { hole: 'g47' }, 2, 'r1'); lab.addPart('resistor', { ohms: 2200 }, { hole: 'j43' }, 1, 'r2'); lab.addWire('H:i43', 'B:GPIO24'); us.state.dist = 30;
    const r = run(lab, 'from gpiozero import DistanceSensor\nfrom time import sleep\ns = DistanceSensor(echo=24, trigger=23)\nwhile True:\n    print(round(s.distance * 100))\n    sleep(0.3)\n', 1.5); const L1 = r.out.split('\r\n').filter((x) => /^\d+$/.test(x)).map(Number);
    ok(!r.err && near(L1[L1.length - 1], 30, 1), `DistanceSensor(echo=24, trigger=23) through the divider: ${L1[L1.length - 1]} cm` + (r.err ? ' ' + en(r.err) : ''));
    const r2 = run(lab, 'from gpiozero import DistanceSensor\nfrom time import sleep\ns = DistanceSensor(23, 24)\nwhile True:\n    print(s.distance)\n    sleep(0.3)\n', 1.5); ok(r2.notes.includes('N6_SWAP'), 'DistanceSensor(23, 24) (swapped): the hint "the first pin is Echo"'); }
  { const lab = pi(); const drv = lab.addPart('l298n', {}, { x: 40, z: 110 }, 0, 'drv'); const ml = lab.addPart('bomotor', { side: 'L' }, { x: -20, z: 160 }, 0, 'mL'), mr = lab.addPart('bomotor', { side: 'R' }, { x: 100, z: 160 }, 0, 'mR'); const bat = lab.addPart('bat18650', {}, { x: -40, z: 100 }, 0, 'bat');
    const T = (p, pin) => 'T:' + p.uid + ':' + pin; lab.addWire(T(bat, 'P'), T(drv, 'VS')); lab.addWire(T(bat, 'N'), T(drv, 'GND'));
    for (const [a, b] of [['OUT1', [ml, 'P']], ['OUT2', [ml, 'N']], ['OUT3', [mr, 'P']], ['OUT4', [mr, 'N']]]) lab.addWire(T(drv, a), T(b[0], b[1]));
    for (const [a, g] of [['ENA', 12], ['IN1', 5], ['IN2', 6], ['IN3', 20], ['IN4', 21], ['ENB', 13]]) lab.addWire(T(drv, a), 'B:GPIO' + g);
    const CAR = 'from gpiozero import Robot, Motor\nfrom time import sleep\nrobot = Robot(left=Motor(5, 6, enable=12), right=Motor(20, 21, enable=13))\nrobot.forward(0.8)\nsleep(10)\n';
    const r = run(lab, CAR, 1.5); ok(!r.err && ml.state.w < -150 && mr.state.w < -150 ? false : true, 'Robot without a common ground: ' + (Math.abs(ml.state.w) < 20 ? 'the motors do not move' : 'MOVED (wrong)'));
    lab.addWire(T(drv, 'GND'), 'B:GND5'); const r2 = run(lab, CAR, 1.5); ok(!r2.err && Math.abs(ml.state.w) > 300 && Math.abs(mr.state.w) > 300 && Math.sign(ml.state.w) === Math.sign(mr.state.w) && drv.state.a > 0.7, `with the common ground: both wheels turn (${Math.round(ml.state.w)}, ${Math.round(mr.state.w)} rad/s), ENA ${Math.round(drv.state.a * 100)} %` + (r2.err ? ' ' + en(r2.err) : ''));
    const r3 = run(lab, CAR.replace('robot.forward(0.8)', 'robot.left(0.6)'), 1.5); ok(Math.sign(ml.state.w) === -Math.sign(mr.state.w) && Math.abs(ml.state.w) > 150, 'robot.left(): the wheels turn opposite ways'); }
  { const lab = pi(); piLed(lab); const r = run(lab, 'import RPi.GPIO as GPIO\nimport time\nGPIO.setmode(GPIO.BCM)\nGPIO.setup(17, GPIO.OUT)\nGPIO.output(17, GPIO.HIGH)\ntime.sleep(5)\n', 1); ok(!r.err && lab.byTag('led1').state.b > 0.2, 'RPi.GPIO: setmode(BCM), setup, output(17, HIGH) lights the LED');
    const r2 = run(lab, 'import RPi.GPIO as GPIO\nGPIO.setup(17, GPIO.OUT)\n', 0.3); ok(r2.err && r2.err.code === 'N6_GPIO_MODE' && r2.err.line === 2, 'RPi.GPIO without setmode(): "Please set pin numbering mode…", line 2');
    const r3 = run(lab, 'name = input("Your name? ")\nprint("Namaste", name)\n', 1.2, (t, f) => { if (f === 20) lab.mcu.ser.send('Asha\n'); }); ok(/Your name\? Asha\r\nNamaste Asha/.test(r3.out), 'input() reads a line typed into the terminal');
    lab.addWire('B:GPIO2', 'H:a20'); const r4 = run(lab, 'from gpiozero import Button\nfrom time import sleep\nb = Button(2)\nwhile True:\n    print(b.is_pressed)\n    sleep(0.2)\n', 0.6); ok(/False/.test(r4.out) && !r4.notes.includes('N6_FLOAT'), 'GPIO 2 has the board\'s 1.8 kΩ pull-up: a free button reads not pressed'); }
}
function tx6(w) { const a = {}; for (const [k, v] of Object.entries(w.args || {})) a[k] = typeof v === 'object' ? v.en : v; return String(w.msg.en).replace(/\{(\w+)\}/g, (m, k) => a[k] ?? ''); }

// ------------------------------------------------------------ 4. the lessons, as a student plays them
if (arg !== 'engine') {
  const LS = batch6({ t3, P: (tag, type, props, hole, rot) => ({ tag, type, props: props || {}, at: { hole }, rot: rot || 0 }), F: (tag, type, props, x, z, rot) => ({ tag, type, props: props || {}, at: { x, z }, rot: rot || 0 }), W: LESSON_WORDS }, LESSONS.length);
  for (const l of LS) { if (!BY_ID[l.id]) { LESSONS.push(l); BY_ID[l.id] = l; } } // (lessons.js lists them in the page only)
  ok(LS.length === 12 && new Set(LS.map((l) => l.id)).size === 12 && LS.every((l) => l.cls && l.lang === 'py' && l.baud === 115200), `${LS.length} lessons (n ${LS[0].n}–${LS[LS.length - 1].n}): 8 Pico, 4 Pi 4, each with its class`);
  const say = (x) => (x && typeof x === 'object' ? x.en : x);
  const txt = (r) => { if (!r) return ''; const [m, a] = r; const A = {}; for (const [k, v] of Object.entries(a || {})) A[k] = say(v); return String(m.en).replace(/\{(\w+)\}/g, (q, k) => A[k] ?? ''); };
  for (const l of LS) {
    for (const k of ['title', 'goal']) for (const lg of ['en', 'hi', 'hg']) if (!l[k][lg]) ok(false, `${l.id}: ${k}.${lg}`);
    for (const s of l.steps) for (const k of ['do', 'see']) if (s[k]) for (const lg of ['en', 'hi', 'hg']) if (typeof s[k][lg] !== 'string') ok(false, `${l.id}: step ${s.k} ${k}.${lg}`);
    for (const s of l.steps) if (s.k === 'tap' && !BOARDS[l.board].regions.some((g) => g.id === s.region)) ok(false, `${l.id}: tap region ${s.region} exists`);
    const c = compile(l.code, BOARDS[l.board]); ok(c.ok, `${l.id}: the program compiles` + (c.ok ? '' : ' ' + JSON.stringify(c.errors)));
    for (const s of l.steps.filter((q) => q.k === 'edit')) { const e = s.set.reduce((x, [re, v]) => x.replace(re, v), l.code); ok(s.test(e) && !s.test(l.code) && compile(e, BOARDS[l.board]).ok, `${l.id}: its edit (as the hint does it) passes the step test and compiles`); }
  }
  // a pretend app (as robocore2.mjs): the lesson's bench built at its ghosts, the robot car driven by the bench's motors
  function build(l) {
    const lab = new Lab(); const app = { lab, code: () => app.src, world: null, onStepDone() {}, onLessonComplete() { app.done = true; } }; app.src = l.code;
    const rt = new LessonRT(app); rt.open(l.id);
    let sim = null; if (l.world && l.world.kind === 'car') { sim = new CarSim(l.world.car); app.world = { flag: (n) => sim.flags.has(n), val: (n) => sim[n], onRun: () => sim.reset() }; }
    for (const s of l.steps) {
      if (s.k === 'place') { const q = s.place; if (!lab.byTag(q.tag)) { const p = lab.addPart(q.type, q.props, q.at, q.rot, q.tag); if (!p) ok(false, `${l.id}: ${q.tag} fits at its ghost`); } }
      if (s.k === 'wire') { const g = rt.ghostWire(s.wire); if (!g) { ok(false, `${l.id}: a ghost wire for ${s.wire}`); continue; } lab.addWire(g[0], g[1]); if (!rt.conn(s.wire[0], s.wire[1])) ok(false, `${l.id}: wire ${s.wire} joins (${g})`); }
    }
    return { lab, app, rt, sim, l };
  }
  // run a program for some seconds, as the app does (the lesson runtime sees every frame and every printed line)
  function play(B, src, secs, each) {
    const { lab, app, rt, sim } = B; app.src = src; const c = compile(src, lab.def); if (!c.ok) throw new Error(B.l.id + ' ' + JSON.stringify(c.errors));
    lab.run(c); rt.onRun(src); const dt = 1 / 60; let ser = '', buf = '';
    for (let f = 0; f < secs * 60; f++) {
      if (each) each(f * dt, f); lab.step(1000 * dt);
      if (sim) { const w = (t) => { const p = lab.byTag(t); return p ? p.state.w / BO.gear * BO.rw : 0; }; sim.update(dt, w('mL'), w('mR')); }
      rt.update(dt); for (const o of lab.mcu.ser.take()) { const s = String.fromCharCode(...o.bytes); ser += s; buf += s; }
      let k; while ((k = buf.indexOf('\n')) >= 0) { rt.onSerialLine(buf.slice(0, k).replace(/\r$/, '')); buf = buf.slice(k + 1); }
      if (lab.mcu.state === 'error') throw new Error(B.l.id + ' runtime ' + en(lab.mcu.err));
    }
    return ser;
  }
  const editOf = (l, i) => l.steps.filter((s) => s.k === 'edit')[i];
  const edited = (l, i) => editOf(l, i).set.reduce((x, [re, v]) => x.replace(re, v), l.code);
  const stepOk = (B, k, i = 0) => { const s = B.l.steps.filter((q) => q.k === k)[i]; return B.rt.stepDone(s); };
  const pressAt = (B, t0, t1) => (t) => { const b = B.lab.byTag('b1'); const p = t > t0 && t < t1; if (b.state.pressed !== p) { b.state.pressed = p; B.lab.stateV++; B.lab.instKey = null; } };
  const T = {
    pico_blink(l, B) {
      for (const r of ['p_rp2040', 'p_bootsel', 'p_led', 'p_front']) B.rt.taps.add(r);
      const out = play(B, l.code, 3); ok(B.rt.toggles('L') >= 4 && /MPY: soft reboot/.test(out), `pico_blink: the green LED (GP25) blinks, ${B.rt.toggles('L')} toggles, period ${B.rt.period('L').toFixed(2)} s; the Shell says "MPY: soft reboot"`);
      play(B, edited(l, 0), 2.5); ok(B.rt.period('L') < 0.25 && l.done(B.rt), `pico_blink: time.sleep(0.1) blinks fast (${B.rt.period('L').toFixed(2)} s): done`);
    },
    pico_led(l, B) {
      ok(!B.rt.runCheck(), 'pico_led: the circuit at the ghosts passes the check ' + txt(B.rt.runCheck()));
      play(B, l.code, 4.5); const o = B.lab.obs.leds[B.lab.byTag('led1').uid]; ok(o.toggles >= 3 && near(o.maxI * 1000, 4.5, 1.2), `pico_led: GP15 blinks the LED once a second at ${(o.maxI * 1000).toFixed(1)} mA`);
      play(B, edited(l, 0), 2.5); ok(l.done(B.rt), `pico_led: 0.2 s flashes (${B.rt.period('led1').toFixed(2)} s): done`);
      // the kind hints: no resistor, LED reversed, no GND on the rail
      const B2 = build(l); B2.lab.removePart(B2.lab.byTag('r1')); B2.lab.addWire('H:i31', rail('bn', 31)); ok(/no resistor/.test(txt(B2.rt.runCheck())), 'pico_led: the LED straight to GND, no resistor: ' + txt(B2.rt.runCheck()));
      const B3 = build(l); const led = B3.lab.byTag('led1'); B3.lab.removePart(led); B3.lab.addPart('led', { color: 'red' }, { hole: 'f32' }, 2, 'led1'); ok(/wrong way round/.test(txt(B3.rt.runCheck())), 'pico_led: the LED turned round: ' + txt(B3.rt.runCheck()));
    },
    pico_button(l, B) {
      ok(!B.rt.runCheck(), 'pico_button: the check passes ' + txt(B.rt.runCheck()));
      play(B, l.code, 2, pressAt(B, 0.5, 1.2)); ok(B.rt.flag('pressLit') && B.rt.flag('releaseDark'), 'pico_button: PULL_UP: pressed lights, released darkens');
      const b = B.lab.byTag('b1'); play(B, edited(l, 0), 3, (t) => { const p = (t > 0.4 && t < 0.6) || (t > 1.6 && t < 1.8); if (b.state.pressed !== p) { b.state.pressed = p; B.lab.stateV++; B.lab.instKey = null; } });
      ok(l.done(B.rt), `pico_button: toggle: two presses, on then off (${B.rt.toggles('led1')} toggles, lit ${B.rt.ledLit('led1')})`);
      const B2 = build(l); const w = B2.lab.wires.find((x) => [x.a, x.b].some((e) => /^H:[f-j]42$/.test(e))); B2.lab.removeWire(w); B2.lab.addWire(rail('bn', 37), 'H:a40');
      ok(/always joined/.test(txt(B2.rt.runCheck())), 'pico_button: both wires on the same column of the button: ' + txt(B2.rt.runCheck()));
    },
    pico_fade(l, B) {
      play(B, l.code, 4); ok(B.rt.levels('led1') >= 3, `pico_fade: PWM breathes the LED (${B.rt.levels('led1')} brightness levels)`);
      play(B, edited(l, 0), 5); ok(l.done(B.rt), 'pico_fade: slower breath: done');
    },
    pico_pot(l, B) {
      ok(!B.rt.runCheck(), 'pico_pot: the check passes ' + txt(B.rt.runCheck()));
      const pot = B.lab.byTag('pot1'); const out = play(B, l.code, 3, (t) => { const v = t < 1.5 ? 1 : 0; if (pot.state.pos !== v) { pot.state.pos = v; B.lab.stateV++; B.lab.instKey = null; } });
      ok(B.rt.adcMax(26) > 60000 && B.rt.adcMin(26) < 2000 && /65\d{3} 3\.3 V/.test(out), `pico_pot: GP26 reads ${B.rt.adcMin(26)}–${B.rt.adcMax(26)}; the Shell prints "${(out.match(/\d+ [\d.]+ V/g) || [''])[0]}"`);
      play(B, edited(l, 0), 3, (t) => { const v = Math.min(1, t / 2.5); pot.state.pos = v; B.lab.stateV++; B.lab.instKey = null; }); ok(B.rt.levels('led1') >= 2 && l.done(B.rt), `pico_pot: the knob dims the LED (${B.rt.levels('led1')} brightness levels, ${B.lab.mcu.obs6.duty[15].size} PWM settings): done`);
      const B2 = build(l); B2.lab.removeWire(B2.lab.wires.find((x) => [x.a, x.b].some((e) => /^H:[a-e]40$/.test(e)))); B2.lab.addWire('H:a2', 'H:b40');
      ok(/VBUS/.test(txt(B2.rt.runCheck())), 'pico_pot: a knob on VBUS: ' + txt(B2.rt.runCheck()));
    },
    pico_servo(l, B) {
      ok(!B.rt.runCheck(), 'pico_servo: the check passes ' + txt(B.rt.runCheck()));
      play(B, l.code, 4); ok(B.rt.servoRange('sv1') >= 170, `pico_servo: 0°, 90°, 180° (range ${Math.round(B.rt.servoRange('sv1'))}°)`);
      play(B, edited(l, 0), 4.5); ok(l.done(B.rt), `pico_servo: the radar sweep: ${B.lab.mcu.obs6.angles.size} angles: done`);
    },
    pico_sonar(l, B) {
      ok(!B.rt.runCheck(), 'pico_sonar: the check passes ' + txt(B.rt.runCheck()));
      const us = B.lab.byTag('us1'); const set = (d) => { if (us.state.dist !== d) { us.state.dist = d; B.lab.stateV++; B.lab.instKey = null; } };
      const out = play(B, l.code, 3, (t) => set(t < 1.5 ? 10 : 80)); ok(B.rt.distSeen('us1', 2, 15) && B.rt.distSeen('us1', 60, 400), `pico_sonar: 10 cm and 80 cm read through the divider (${out.split('\r\n').filter((x) => /^\d/.test(x)).slice(-1)[0]} cm)`);
      play(B, edited(l, 0), 2, (t) => set(t < 1 ? 50 : 12)); ok(l.done(B.rt), `pico_sonar: the Pico's LED warns under 20 cm: done (L ${B.lab.ledL.toFixed(2)})`);
      const B2 = build(l); const g = B2.lab.wires.find((x) => [x.a, x.b].some((e) => B2.lab.conn(e, 'GP16'))); B2.lab.removeWire(g); B2.lab.addWire('H:a21', 'H:i47'); ok(/straight to GP16/.test(txt(B2.rt.runCheck())), 'pico_sonar: Echo straight into GP16: ' + txt(B2.rt.runCheck()));
    },
    pico_lamp(l, B) {
      ok(!B.rt.runCheck(), 'pico_lamp: the check passes ' + txt(B.rt.runCheck()));
      const env = B.lab.env; play(B, l.code, 4, (t) => { env.light = t < 1 ? 0.75 : t < 2.4 ? 0.2 : 0.8; B.lab.stateV++; }); ok(B.rt.flag('darkLit') && B.rt.flag('brightDark'), 'pico_lamp: dark lights the lamp, light puts it out');
      const src = edited(l, 0); play(B, src, 4, (t) => { env.light = t < 1.2 ? 0.2 : t < 2.6 ? 0.8 : 0.45; B.lab.stateV++; }); ok(B.rt.ledLit('led1') && l.done(B.rt), `pico_lamp: threshold 32000 lights it at 45 % light: done (reading ${B.rt.nums.slice(-1)[0]})`);
    },
    pi_led(l, B) {
      for (const r of ['q_soc', 'q_header', 'q_usbc']) B.rt.taps.add(r);
      ok(!B.rt.runCheck(), 'pi_led: the check passes ' + txt(B.rt.runCheck()));
      const out = play(B, l.code, 3); ok(B.rt.toggles('led1') >= 3 && /python3 main\.py/.test(out), `pi_led: LED(17).blink() + pause(): ${B.rt.toggles('led1')} toggles`);
      play(B, edited(l, 0), 2.5, pressAt(B, 0.6, 1.4)); ok(l.done(B.rt), 'pi_led: when_pressed = led.on, when_released = led.off: done');
      const B2 = build(l); const g = B2.lab.wires.find((x) => [x.a, x.b].includes('B:GPIO17')); B2.lab.removeWire(g); B2.lab.addWire('B:5V', [g.a, g.b].find((e) => e !== 'B:GPIO17'));
      ok(/./.test(txt(B2.rt.runCheck())), 'pi_led: the LED on 5 V instead of GPIO 17: ' + txt(B2.rt.runCheck()));
    },
    pi_pir(l, B) {
      ok(!B.rt.runCheck(), 'pi_pir: the check passes ' + txt(B.rt.runCheck()));
      const pir = B.lab.byTag('pir1'); const wave = (a, b) => (t) => { const m = t > a && t < b; if (pir.state.motion !== m) { pir.state.motion = m; B.lab.stateV++; B.lab.instKey = null; } };
      const out = play(B, l.code, 6, wave(2.5, 3)); ok(/Ready/.test(out) && /Motion detected!/.test(out) && B.lab.byTag('bz1').state.beeps >= 5, `pi_pir: "Ready", a wave: "Motion detected!", ${B.lab.byTag('bz1').state.beeps} beeps`);
      play(B, edited(l, 0), 13, (t) => { const m = (t > 3 && t < 3.5) || (t > 9.5 && t < 10); if (pir.state.motion !== m) { pir.state.motion = m; B.lab.stateV++; B.lab.instKey = null; } });
      ok(l.done(B.rt), `pi_pir: the counter prints 2 after two waves: done (${B.rt.nums.slice(-3)})`);
    },
    pi_dht(l, B) {
      ok(!B.rt.runCheck(), 'pi_dht: the check passes ' + txt(B.rt.runCheck()));
      const out = play(B, l.code, 13); const ls = out.split('\r\n').filter((x) => /Temp:/.test(x)); ok(ls.length >= 4 && /\d\d:\d\d:\d\d {2}Temp: 2\d\.0 C {3}Humidity: \d+ %/.test(ls[0]) && /Reading failed, trying again: Checksum/.test(out), `pi_dht: "${ls[0]}", and a failed reading is caught`);
      const th = B.lab.byTag('th1'); play(B, edited(l, 0), 30, (t) => { th.state.tS = 40; }); ok(l.done(B.rt), `pi_dht: warmed to 40 °C: "Too hot!" (${(B.lab.mcu.obs6.dht.slice(-1)[0] || [])[0]} °C): done`);
    },
    pi_car(l, B) {
      ok(!B.rt.runCheck(), 'pi_car: the check passes ' + txt(B.rt.runCheck()));
      play(B, l.code, 7); const S = B.sim; ok(B.lab.mcu.state === 'done' && S.odo > 900 && !S.flags.has('parked'), `pi_car: the first route ends short of P (${Math.round(S.x)}, ${Math.round(S.z)}, heading ${Math.round(S.h * 180 / Math.PI)}°, ${Math.round(S.odo)} mm)`);
      play(B, edited(l, 0), 9); ok(S.flags.has('parked') && l.done(B.rt), `pi_car: sleep(2.4) parks in P (${Math.round(S.x)}, ${Math.round(S.z)}, heading ${Math.round(S.h * 180 / Math.PI)}°)`);
      const B2 = build(l); const g = B2.lab.wires.find((x) => [x.a, x.b].some((e) => /^B:GND/.test(e))); B2.lab.removeWire(g); ok(/common ground/.test(txt(B2.rt.runCheck())), 'pi_car: no common ground: ' + txt(B2.rt.runCheck()));
    },
  };
  for (const l of LS) {
    if (only && !only.includes(l.id)) continue;
    try { const B = build(l); if (T[l.id]) T[l.id](l, B); else ok(false, l.id + ': no test'); } catch (e) { ok(false, l.id + ': ' + (e.stack || e).toString().split('\n').slice(0, 3).join(' | ')); }
  }
}

console.log(fails ? `${fails} FAILED` : 'all passed'); process.exit(fails ? 1 : 0);
