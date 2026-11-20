// DUET Robotics Lab 360: fast checks of the engine without a browser (compiler, microcontroller, circuit solver, modules)
// and of every lesson's sketch. node devtools/test/robocore.mjs   (exit 1 on a failure)
import { compile } from '../../robotics/js/cpp.js';
import { Lab } from '../../robotics/js/sim.js';
import { LESSONS, FREE_CODE } from '../../robotics/js/lessons.js';
import { BOARDS } from '../../robotics/js/boards.js';
let fails = 0; const ok = (c, m) => { if (!c) { fails++; console.log('FAIL ' + m); } else console.log('ok   ' + m); };
const serial = (lab) => { let s = ''; for (const o of lab.mcu.ser.take()) s += String.fromCharCode(...o.bytes); return s; };
const run = (lab, src, frames, each) => { const c = compile(src); if (!c.ok) throw new Error(JSON.stringify(c.errors)); lab.run(c); let out = ''; for (let f = 0; f < frames; f++) { if (each) each(f); lab.step(1000 / 60); out += serial(lab); } return out; };

// every lesson sketch compiles
for (const l of LESSONS.filter((x) => x.lang !== 'py')) { const c = compile(l.code, l.board ? BOARDS[l.board] : undefined); ok(c.ok, `lesson ${l.n} (${l.id}) sketch compiles` + (c.ok ? '' : ' ' + JSON.stringify(c.errors))); } // (the Python lessons have their own tests; each sketch for its own board: an ESP32 one includes ESP32Servo.h)
ok(compile(FREE_CODE).ok, 'free build sketch compiles');
{ const sv = (inc) => `#include <${inc}>\nServo arm;\nvoid setup() { arm.attach(13); arm.write(90); }\nvoid loop() {}`; // (batch 12) the servo library each board really builds
  const e1 = compile(sv('Servo.h'), BOARDS.esp32), e2 = compile(sv('ESP32Servo.h'), BOARDS.esp32), e3 = compile(sv('ESP32Servo.h'), BOARDS.uno);
  ok(!e1.ok && e1.errors[0].code === 'E_SERVO_ESP', 'ESP32: #include <Servo.h> stops, as the real IDE does'); ok(e2.ok, 'ESP32: ESP32Servo.h builds'); ok(!e3.ok && e3.errors[0].code === 'E_ESPSERVO_ONLY', 'Uno: ESP32Servo.h is refused'); }
// C semantics of the Uno
{ const lab = new Lab(); const out = run(lab, `void setup(){ Serial.begin(9600); int x = 32767; x++; Serial.println(x); Serial.println(7 / 2); Serial.println(7 / 2.0); Serial.println(-7 % 3); unsigned long t = 0; t--; Serial.println(t); byte b = 300; Serial.println(b); Serial.println(map(512, 0, 1023, 0, 180)); Serial.println(String("a") + 5); Serial.println(random(100)); } void loop(){}`, 30);
  ok(out === '-32768\r\n3\r\n3.50\r\n-1\r\n4294967295\r\n44\r\n90\r\na5\r\n7\r\n', 'int overflow, integer division, float print, unsigned wrap, byte, map, String, avr random(): ' + JSON.stringify(out)); }
// compiler errors in plain words, with the line
for (const [src, code, line] of [['void setup(){ int x = 5\n x++; }\nvoid loop(){}', 'E_SEMI', 1], ['void setup(){\n digitalWrite(13, HIGH);\nvoid loop(){}', 'E_NESTED_FUNC', 3], ['void loop(){}', 'E_NO_SETUP', 1], ['void setup(){\n digitalwrite(13, HIGH); }\nvoid loop(){}', 'E_UNKNOWN_FUNC', 2], ['void setup(){ Serial.printIn(1); } void loop(){}', 'E_SERIAL', 1], ['#include <Servo.h>\nServo s;\nvoid setup(){ s.attach(9) ; s.wirte(90); } void loop(){}', 'E_SERVO', 3]]) {
  const r = compile(src); ok(!r.ok && r.errors[0].code === code && r.errors[0].line === line, `error ${code} on line ${line}` + (r.ok ? '' : ' got ' + r.errors[0].code + '@' + r.errors[0].line));
}
ok(compile('void setup(){ long x = 60 * 1000; } void loop(){}').warnings.some((w) => w.code === 'W_OVERFLOW'), 'warns: 60 * 1000 does not fit in an int');
// blink: timing on the virtual clock, LED current through 220 ohm, burn without a resistor
{ const lab = new Lab(); const led = lab.addPart('led', { color: 'red' }, { hole: 'e22' }, 0, 'led1'); lab.addPart('resistor', { ohms: 220 }, { hole: 'b22' }, 3, 'r1');
  lab.addWire('B:D13', 'H:a23'); lab.addWire('B:GND3', 'H:tn10');
  run(lab, 'void setup(){ pinMode(13, OUTPUT); } void loop(){ digitalWrite(13, HIGH); delay(500); digitalWrite(13, LOW); delay(500); }', 150);
  const o = lab.obs.leds[led.uid]; ok(o.toggles >= 4 && Math.abs(o.periods[o.periods.length - 1] - 0.5) < 0.04, 'blink: 0.5 s on, 0.5 s off');
  ok(Math.abs(o.maxI - 0.0126) < 0.001, 'LED current (5 V − 1.9 V) / 245 Ω ≈ 12.6 mA: ' + (o.maxI * 1000).toFixed(1));
  ok(lab.conn('led1.A', 'D13') && lab.conn('r1.2', 'GND'), 'netlist: breadboard column and − rail'); }
{ const lab = new Lab(); const led = lab.addPart('led', { color: 'red' }, { hole: 'e22' }, 0); lab.addWire('B:D13', 'H:a23'); lab.addWire('B:GND3', 'H:a22');
  let burn = 0; lab.on((t) => { if (t === 'burn') burn++; }); run(lab, 'void setup(){ pinMode(13, OUTPUT); digitalWrite(13, HIGH); } void loop(){}', 30);
  ok(led.state.burnt && burn === 1, 'no resistor: the LED burns out'); }
// short circuit: the USB fuse
{ const lab = new Lab(); lab.addWire('B:5V', 'B:GND1'); let fuse = 0; lab.on((t) => { if (t === 'fuse') fuse++; }); run(lab, 'void setup(){} void loop(){}', 40); ok(fuse === 1 && !lab.powered, '5V to GND trips the fuse'); }
// pot + analogRead, pull-up button, floating input
{ const lab = new Lab(); const pot = lab.addPart('pot', {}, { hole: 'e45' }, 0); lab.addWire('B:5V', 'H:a45'); lab.addWire('B:GND1', 'H:a49'); lab.addWire('B:A0', 'H:a47');
  const b = lab.addPart('button', {}, { hole: 'e30' }, 0); lab.addWire('B:D2', 'H:a30'); lab.addWire('B:GND3', 'H:a32');
  const out = run(lab, 'void setup(){ Serial.begin(9600); pinMode(2, INPUT_PULLUP); } void loop(){ Serial.print(analogRead(A0)); Serial.print(" "); Serial.println(digitalRead(2)); delay(100); }', 40, (f) => { if (f === 12) { pot.state.pos = 0.1; lab.stateV++; } if (f === 24) { b.state.pressed = true; lab.rebuild(); } });
  const L = out.trim().split('\r\n').map((x) => x.split(' ').map(Number));
  ok(Math.abs(L[0][0] - 507) < 4 && L[0][1] === 1, 'pot at the middle reads ~507 (USB gives 4.96 V), button free reads HIGH: ' + L[0]);
  ok(L.some(([a]) => Math.abs(a - 913) < 5), 'pot turned reads ~913');
  ok(L[L.length - 1][1] === 0, 'button pressed reads LOW'); }
{ const lab = new Lab(); lab.addWire('B:D2', 'H:a5'); const out = run(lab, 'void setup(){ Serial.begin(115200); pinMode(2, INPUT); } void loop(){ Serial.print(digitalRead(2)); delay(3); }', 12);
  ok(out.includes('0') && out.includes('1'), 'a floating input reads HIGH and LOW by itself'); }
// PWM averaging (RGB), tone on a buzzer, servo, HC-SR04 echo, motor through a transistor
{ const lab = new Lab(); const rgb = lab.addPart('rgb', {}, { hole: 'e30' }, 0); for (const [c, p] of [[30, 9], [32, 10], [33, 11]]) { lab.addPart('resistor', { ohms: 220 }, { hole: 'd' + c }, 1); lab.addWire('B:D' + p, 'H:j' + c); } lab.addWire('B:GND1', 'H:a31');
  run(lab, 'void setup(){} void loop(){ analogWrite(9, 255); analogWrite(10, 64); analogWrite(11, 0); delay(50); }', 10);
  ok(Math.abs(rgb.state.ch.R - 0.0126) < 0.001 && Math.abs(rgb.state.ch.G / 0.0092 - 64 / 255) < 0.05 && rgb.state.ch.B === 0, 'PWM: average current follows the duty'); }
{ const lab = new Lab(); lab.addPart('buzzer', {}, { hole: 'e52' }, 0); lab.addWire('B:D8', 'H:a52'); lab.addWire('B:GND1', 'H:a55');
  run(lab, 'void setup(){} void loop(){ tone(8, 440); delay(100); }', 10); ok(lab.sounds.some((s) => s.kind === 'tone' && s.f === 440), 'tone(8, 440) sounds the buzzer'); }
{ const lab = new Lab(); const sv = lab.addPart('servo', {}, { x: 20, z: 165 }, 0); lab.addWire('T:' + sv.uid + ':GND', 'B:GND1'); lab.addWire('T:' + sv.uid + ':VP', 'B:5V'); lab.addWire('T:' + sv.uid + ':SIG', 'B:D9');
  run(lab, '#include <Servo.h>\nServo s; void setup(){ s.attach(9); s.write(20); } void loop(){}', 40); ok(Math.abs(sv.state.angle - 20) < 1, 'servo goes to 20°: ' + sv.state.angle.toFixed(1)); }
{ const lab = new Lab(); const us = lab.addPart('hcsr04', {}, { hole: 'j50' }, 0); lab.addWire('B:5V', 'H:f50'); lab.addWire('B:D9', 'H:f51'); lab.addWire('B:D10', 'H:f52'); lab.addWire('B:GND1', 'H:f53'); us.state.dist = 25;
  const out = run(lab, LESSONS.find((l) => l.id === 'parking').code.replace('tone(buzzer, 1500, 60);', ''), 30); const cm = +(/Distance: (\d+)/.exec(out) || [])[1];
  ok(Math.abs(cm - 24.7) <= 1.5, 'HC-SR04 measures 25 cm: ' + cm); }
{ const lab = new Lab(); lab.addPart('npn', {}, { hole: 'e40' }, 0); lab.addPart('resistor', { ohms: 1000 }, { hole: 'c37' }, 0); lab.addPart('diode', {}, { hole: 'a42' }, 3); const m = lab.addPart('motor', {}, { x: 95, z: 160 }, 0);
  lab.addWire('B:5V', 'H:tp20'); lab.addWire('T:' + m.uid + ':P', 'H:tp22'); lab.addWire('T:' + m.uid + ':N', 'H:b42'); lab.addWire('B:D9', 'H:a37'); lab.addWire('B:GND1', 'H:a40');
  run(lab, 'void setup(){ pinMode(9, OUTPUT); digitalWrite(9, HIGH); } void loop(){}', 150);
  ok(m.state.w > 500 && m.state.i > 0.1 && m.state.i < 0.3, `motor spins through the transistor: ${Math.round(m.state.w * 60 / 6.283)} rpm, ${(m.state.i * 1000).toFixed(0)} mA`); }
console.log(fails ? `${fails} FAILED` : 'all passed'); process.exit(fails ? 1 : 0);
