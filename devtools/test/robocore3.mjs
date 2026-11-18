// DUET Robotics Lab 360, batch 3 (school-lab modules, block coding): engine checks without a browser.
//   1. every module: wired on a virtual bench, driven by a small sketch through its Arduino library, it does what the real
//      one does (and nothing when it is wired wrong, unpowered or at another address)
//   2. every new lesson: its bench is built as a student would (setup, then each place / wire step at its ghost), the
//      circuit check passes, its sketch runs, its scene (scenes3.js) reacts, the lesson's own watch / act steps come true,
//      and the "edit" steps change the behaviour as the lesson says
//   3. the block editor's model: every lesson sketch -> blocks -> C++ compiles and does the same (blocks3 round trip)
//   node devtools/test/robocore3.mjs [modules|lessons|blocks|<lesson id>,...]      (exit 1 on a failure)
import { compile, parse } from '../../robotics/js/cpp.js';
import { Lab } from '../../robotics/js/sim.js';
import { lcdText, oledLit, CARDS, legacyCode } from '../../robotics/js/libs3.js';
import { irSend, rfidShow, keyPress, KEYMAP } from '../../robotics/js/parts3.js';
import { LESSONS, FREE_CODE } from '../../robotics/js/lessons.js';
import { toBlocks, toCpp, mk, blockDiff } from '../../robotics/js/blocks.js';
import { LessonRT } from '../../robotics/js/lessonrt.js';
import { makeScene } from '../../robotics/js/scenes3.js';

const arg = process.argv[2] || 'all'; const only = (k) => arg === 'all' || arg.split(',').includes(k);
let fails = 0; const ok = (c, m) => { if (!c) { fails++; console.log('FAIL ' + m); } else console.log('ok   ' + m); };
const T = (p, id) => 'T:' + p.uid + ':' + id;
function run(lab, src, secs, each) {
  const c = compile(src); if (!c.ok) throw new Error('compile: ' + JSON.stringify(c.errors));
  lab.run(c); let ser = ''; const dt = 1 / 60;
  for (let f = 0; f < secs * 60; f++) { if (each) each(f * dt, f); lab.step(1000 * dt); for (const o of lab.mcu.ser.take()) ser += String.fromCharCode(...o.bytes); if (lab.mcu.state === 'error') throw new Error('runtime ' + JSON.stringify(lab.mcu.err)); }
  return ser;
}
const rails = (lab) => { lab.addWire('B:5V', 'H:tp30'); lab.addWire('B:GND3', 'H:tn18'); };

if (only('modules')) {
  // ---- the compiler knows the libraries, and says what is wrong in plain words
  for (const [src, code] of [
    ['LiquidCrystal_I2C lcd(0x27, 16, 2);\nvoid setup(){ lcd.init(); } void loop(){}', 'E_LIB_INCLUDE'],
    ['#include <LiquidCrystal_I2C.h>\nLiquidCrystal_I2C lcd(0x27, 16, 2);\nvoid setup(){ lcd.int(); } void loop(){}', 'E_LIB_METHOD'],
    ['#include <MFRC522.h>\nMFRC522 r(10, 9);\nvoid setup(){ int x = r.uid.sise; } void loop(){}', 'E_LIB_MEMBER'],
    ['void setup(){ int x = 3; int y = &x; } void loop(){}', 'E_UNSUPPORTED'],
  ]) { const c = compile(src); ok(!c.ok && c.errors[0].code === code, `compile error ${code}: ${c.ok ? 'compiled!' : c.errors[0].code}`); }
  { const c = compile('#include <Keypad.h>\n#include <Stepper.h>\n#include <IRremote.hpp>\n#include <SPI.h>\n#include <MFRC522.h>\n#include <Adafruit_GFX.h>\n#include <Adafruit_SSD1306.h>\nvoid setup(){ Serial.println(F("hi")); } void loop(){}'); ok(c.ok && !c.warnings.length, 'the libraries\' #includes are known (no "not in the lab" warning)'); }

  // ---- LCD 16×2 (I2C) + DHT11
  { const lab = new Lab(); rails(lab);
    const lcd = lab.addPart('lcd16', {}, { x: -150, z: 100 }, 0, 'lcd'); lab.addWire(T(lcd, 'GND'), 'H:tn20'); lab.addWire(T(lcd, 'VCC'), 'H:tp20'); lab.addWire(T(lcd, 'SDA'), 'B:A4'); lab.addWire(T(lcd, 'SCL'), 'B:A5');
    const dht = lab.addPart('dht11', {}, { hole: 'j40' }, 0, 'dht'); lab.addWire('H:f40', 'B:D2'); lab.addWire('H:f41', 'H:tp41'); lab.addWire('H:f42', 'H:tn42');
    const src = '#include <Wire.h>\n#include <LiquidCrystal_I2C.h>\n#include <DHT.h>\nLiquidCrystal_I2C lcd(0x27, 16, 2);\nDHT dht(2, DHT11);\nvoid setup(){ lcd.init(); lcd.backlight(); dht.begin(); }\nvoid loop(){ float t = dht.readTemperature(); float h = dht.readHumidity(); lcd.setCursor(0, 0); lcd.print("Temp: "); lcd.print(t, 0); lcd.print((char)223); lcd.print("C  "); lcd.setCursor(0, 1); lcd.print("Hum:  "); lcd.print(h, 0); lcd.print(" %  "); delay(1000); }';
    lab.env.temp = 27; lab.env.hum = 61; run(lab, src, 9);
    const tx = lcdText(lcd); ok(/Temp: 27°C/.test(tx[0]) && /Hum: +61 %/.test(tx[1]), `LCD shows the DHT11's reading: "${tx[0]}" / "${tx[1]}"`);
    ok(lcd.state.bl && lab.i5 > 0.02, `LCD backlight on, the 5 V carries ${Math.round(lab.i5 * 1000)} mA`);
    lab.env.temp = 41; run(lab, src, 12); ok(/Temp: 41°C/.test(lcdText(lcd)[0]), `warm air: the DHT11 follows in a few seconds: "${lcdText(lcd)[0]}"`);
    // the wrong address: the LCD stays blank (a real I2C device does not answer)
    lab.setProps(lcd, { addr: 0x3f }); lcd.state.initd = false; run(lab, src, 1.5); // (a fresh LCD at another address) ok(lcdText(lcd)[0].trim() === '', 'LCD at 0x3F does not answer to lcd(0x27, …): it stays blank');
    lab.setProps(lcd, { addr: 0x27 });
    // SDA and SCL swapped: nothing either
    for (const w of [...lab.wires]) if (w.a === T(lcd, 'SDA') || w.a === T(lcd, 'SCL')) lab.removeWire(w);
    lab.addWire(T(lcd, 'SDA'), 'B:A5'); lab.addWire(T(lcd, 'SCL'), 'B:A4'); lcd.state.initd = false; run(lab, src, 1.5); ok(lcdText(lcd)[0].trim() === '', 'LCD with SDA and SCL swapped stays blank');
    // the DHT11 on another pin: NaN
    const nan = run(lab, '#include <DHT.h>\nDHT dht(3, DHT11);\nvoid setup(){ Serial.begin(9600); dht.begin(); }\nvoid loop(){ Serial.println(dht.readTemperature()); delay(500); }', 1.2);
    ok(/nan/.test(nan), 'DHT11 read on the wrong pin gives nan: ' + JSON.stringify(nan.slice(0, 12)));
  }
  // ---- OLED (I2C): text and shapes
  { const lab = new Lab(); rails(lab); const o = lab.addPart('oled', {}, { hole: 'a20' }, 0, 'oled');
    lab.addWire('H:b20', 'H:tn19'); lab.addWire('H:b21', 'H:tp21'); lab.addWire('H:b22', 'B:A5'); lab.addWire('H:b23', 'B:A4');
    run(lab, '#include <Wire.h>\n#include <Adafruit_GFX.h>\n#include <Adafruit_SSD1306.h>\nAdafruit_SSD1306 display(128, 64, &Wire, -1);\nvoid setup(){ display.begin(SSD1306_SWITCHCAPVCC, 0x3C); display.clearDisplay(); display.setTextSize(2); display.setTextColor(SSD1306_WHITE); display.setCursor(0, 0); display.println("26 C"); display.drawRect(0, 40, 128, 24, SSD1306_WHITE); display.fillCircle(100, 52, 6, SSD1306_WHITE); display.display(); }\nvoid loop(){}', 1);
    const n = oledLit(o); ok(n > 300 && n < 2000, `OLED shows text and shapes: ${n} dots lit`);
    run(lab, '#include <Adafruit_SSD1306.h>\nAdafruit_SSD1306 display(128, 64, &Wire, -1);\nvoid setup(){ display.begin(SSD1306_SWITCHCAPVCC, 0x3C); display.clearDisplay(); display.println("hi"); }\nvoid loop(){}', 0.5);
    ok(oledLit(o) === 0, 'OLED: without display() the picture stays in the Arduino (nothing on the screen)');
  }
  // ---- 7-segment: segments are LEDs, each through its own resistor; pins 2, 3, 4 light a, b, c (a "7")
  { const lab = new Lab(); lab.addWire('B:GND3', 'H:bn18'); const s = lab.addPart('seg7', {}, { hole: 'g40' }, 0, 'sg'); lab.addWire('H:j42', 'H:bn40');
    lab.addPart('resistor', { ohms: 330, span: 3 }, { hole: 'b43' }, 0, 'rA'); lab.addWire('H:a46', 'B:D2');
    lab.addPart('resistor', { ohms: 330, span: 3 }, { hole: 'd44' }, 0, 'rB'); lab.addWire('H:a47', 'B:D3');
    lab.addPart('resistor', { ohms: 330, span: 3 }, { hole: 'h43' }, 0, 'rC'); lab.addWire('H:j46', 'B:D4');
    run(lab, 'void setup(){ for (int p = 2; p <= 4; p++) { pinMode(p, OUTPUT); digitalWrite(p, HIGH); } } void loop(){}', 0.5);
    const lit = Object.entries(s.state.seg || {}).filter(([, i]) => i > 0.003).map(([k]) => k).sort().join('');
    ok(lit === 'ABC' && !s.state.burnt, `7-segment: segments a, b, c light through their resistors: ${lit} (${['A', 'B', 'C'].map((k) => k + ' ' + ((s.state.seg || {})[k] * 1000).toFixed(1)).join(', ')} mA)`);
  }
  // ---- IR receiver + remote: IRremote 4 and the old IRrecv API
  { const lab = new Lab(); rails(lab); const ir = lab.addPart('irrx', {}, { hole: 'j30' }, 0, 'ir'); lab.addWire('H:f30', 'B:D11'); lab.addWire('H:f31', 'H:tn31'); lab.addWire('H:f32', 'H:tp32');
    const out = run(lab, '#include <IRremote.hpp>\nvoid setup(){ Serial.begin(9600); IrReceiver.begin(11, ENABLE_LED_FEEDBACK); }\nvoid loop(){ if (IrReceiver.decode()) { Serial.println(IrReceiver.decodedIRData.command, HEX); IrReceiver.resume(); } }', 2, (t, f) => { if (f === 20) irSend(lab, '1'); if (f === 60) irSend(lab, 'OK'); });
    ok(/45\r\n1C\r\n/.test(out), 'IR: IrReceiver reads the remote\'s 1 and OK: ' + JSON.stringify(out));
    const old = run(lab, '#include <IRremote.h>\nIRrecv irrecv(11);\ndecode_results results;\nvoid setup(){ Serial.begin(9600); irrecv.enableIRIn(); }\nvoid loop(){ if (irrecv.decode(&results)) { Serial.println(results.value, HEX); irrecv.resume(); } }', 1.5, (t, f) => { if (f === 20) irSend(lab, '1'); });
    ok(old.includes('FFA25D'), 'IR: the old IRrecv gives FFA25D for 1: ' + JSON.stringify(old) + ' ' + legacyCode(0x45).toString(16));
    const nores = run(lab, '#include <IRremote.hpp>\nvoid setup(){ Serial.begin(9600); IrReceiver.begin(11); }\nvoid loop(){ if (IrReceiver.decode()) { Serial.println(IrReceiver.decodedIRData.command); } }', 2, (t, f) => { if (f === 20) irSend(lab, '1'); if (f === 60) irSend(lab, '2'); });
    ok((nores.match(/\n/g) || []).length === 1, 'IR: without resume() only the first code arrives');
  }
  // ---- keypad 4×4: scanned through the circuit
  { const lab = new Lab(); const kp = lab.addPart('keypad', {}, { x: 60, z: 110 }, 0, 'kp'); const pins = [9, 8, 7, 6, 5, 4, 3, 2];
    ['R1', 'R2', 'R3', 'R4', 'C1', 'C2', 'C3', 'C4'].forEach((id, i) => lab.addWire(T(kp, id), 'B:D' + pins[i]));
    const src = '#include <Keypad.h>\nconst byte ROWS = 4;\nconst byte COLS = 4;\nchar keys[ROWS][COLS] = {{\'1\',\'2\',\'3\',\'A\'},{\'4\',\'5\',\'6\',\'B\'},{\'7\',\'8\',\'9\',\'C\'},{\'*\',\'0\',\'#\',\'D\'}};\nbyte rowPins[ROWS] = {9, 8, 7, 6};\nbyte colPins[COLS] = {5, 4, 3, 2};\nKeypad keypad = Keypad(makeKeymap(keys), rowPins, colPins, ROWS, COLS);\nvoid setup(){ Serial.begin(9600); }\nvoid loop(){ char key = keypad.getKey(); if (key) { Serial.print(key); } }';
    const seq = ['1', '9', '#', 'B', '0']; const out = run(lab, src, 3, (t, f) => { const k = Math.floor(f / 30) - 1; if (f % 30 === 0 && k >= 0 && k < seq.length) { const r = KEYMAP.findIndex((row) => row.includes(seq[k])); keyPress(lab, kp, r * 4 + KEYMAP[r].indexOf(seq[k]), 0.2); } });
    ok(out === '19#B0', 'keypad: getKey() reads 1 9 # B 0: ' + JSON.stringify(out));
    // rows and columns swapped in the wiring: other keys come out (a real mistake)
    const lab2 = new Lab(); const kp2 = lab2.addPart('keypad', {}, { x: 60, z: 110 }, 0, 'kp'); const pins2 = [5, 4, 3, 2, 9, 8, 7, 6];
    ['R1', 'R2', 'R3', 'R4', 'C1', 'C2', 'C3', 'C4'].forEach((id, i) => lab2.addWire(T(kp2, id), 'B:D' + pins2[i]));
    const out2 = run(lab2, src, 1, (t, f) => { if (f === 20) keyPress(lab2, kp2, 1, 0.2); }); ok(out2 !== '2' && out2.length === 1, `keypad wired rows↔columns: pressing 2 gives "${out2}"`);
  }
  // ---- stepper 28BYJ-48 + ULN2003
  { const lab = new Lab(); rails(lab); const st = lab.addPart('stepper', {}, { x: -60, z: 110 }, 0, 'st'); [8, 9, 10, 11].forEach((p, i) => lab.addWire(T(st, 'IN' + (i + 1)), 'B:D' + p)); lab.addWire(T(st, 'GND'), 'H:tn10'); lab.addWire(T(st, 'VCC'), 'H:tp10');
    const src = (rpm, steps, order = '8, 10, 9, 11') => `#include <Stepper.h>\nStepper motor(2048, ${order});\nvoid setup(){ motor.setSpeed(${rpm}); motor.step(${steps}); }\nvoid loop(){}`;
    run(lab, src(10, 512), 4); ok(Math.abs(st.state.angle - 90) < 1, `stepper: step(512) at 10 rpm turns 90° (${st.state.angle.toFixed(1)}°), the coils take ${Math.round(lab.i5 * 1000)} mA at rest`);
    run(lab, src(10, -1024), 7); ok(Math.abs(st.state.angle - (90 - 180)) < 1, `stepper: step(-1024) turns back 180° (${st.state.angle.toFixed(1)}°)`);
    const a0 = st.state.angle; run(lab, src(25, 512), 3); ok(Math.abs(st.state.angle - a0) < 20 && (st.state.miss || 0) > 50, `stepper: at 25 rpm it is too fast and only shakes (moved ${(st.state.angle - a0).toFixed(1)}°, ${st.state.miss} missed)`);
    const a1 = st.state.angle; st.state.miss = 0; run(lab, src(10, 512, '8, 9, 10, 11'), 4); ok(Math.abs(st.state.angle - a1) < 10, `stepper: pins in the order 8, 9, 10, 11 only shake it (moved ${(st.state.angle - a1).toFixed(1)}°)`);
  }
  // ---- RFID RC522: SPI wiring, 3.3 V, UID of the card and the tag
  { const lab = new Lab(); lab.addWire('B:GND3', 'H:tn18'); const rf = lab.addPart('rfid', {}, { x: 70, z: 120 }, 0, 'rf');
    for (const [id, to] of [['SDA', 'B:D10'], ['SCK', 'B:D13'], ['MOSI', 'B:D11'], ['MISO', 'B:D12'], ['RST', 'B:D9'], ['GND', 'H:tn40'], ['V33', 'B:3V3']]) lab.addWire(T(rf, id), to);
    const src = '#include <SPI.h>\n#include <MFRC522.h>\nMFRC522 rfid(10, 9);\nvoid setup(){ Serial.begin(9600); SPI.begin(); rfid.PCD_Init(); }\nvoid loop(){\n  if (!rfid.PICC_IsNewCardPresent()) return;\n  if (!rfid.PICC_ReadCardSerial()) return;\n  String uid = "";\n  for (byte i = 0; i < rfid.uid.size; i++) { uid += String(rfid.uid.uidByte[i] < 0x10 ? " 0" : " "); uid += String(rfid.uid.uidByte[i], HEX); }\n  uid.toUpperCase();\n  Serial.println(uid);\n  rfid.PICC_HaltA();\n}';
    const out = run(lab, src, 3, (t, f) => { if (f === 30) rfidShow(lab, 'card'); if (f === 140) rfidShow(lab, 'tag'); });
    ok(out === ' A3 4F 1C 2D\r\n 5B 2E 91 C4\r\n', 'RFID reads the card and the tag once each (PICC_HaltA): ' + JSON.stringify(out));
    for (const w of [...lab.wires]) if (w.a === T(rf, 'V33')) lab.removeWire(w); lab.addWire(T(rf, 'V33'), 'B:5V');
    const out5 = run(lab, src, 1.5, (t, f) => { if (f === 30) rfidShow(lab, 'card'); }); ok(out5 === '' && rf.state.over, 'RFID on 5 V: it does not work (and the part says so)');
    void CARDS;
  }
  // ---- relay: S HIGH -> click, COM–NO closed: a 230 V lamp lights, a 6 V pump runs
  { const lab = new Lab(); rails(lab); const rl = lab.addPart('relay', {}, { x: 150, z: 120 }, 0, 'rl'); lab.addWire(T(rl, 'S'), 'B:D7'); lab.addWire(T(rl, 'VCC'), 'H:tp50'); lab.addWire(T(rl, 'GND'), 'H:tn50');
    const lamp = lab.addPart('load230', { kind: 'lamp' }, { x: 150, z: 40 }, 0, 'lamp'); lab.addWire(T(lamp, 'A'), T(rl, 'COM')); lab.addWire(T(lamp, 'B'), T(rl, 'NO'));
    run(lab, 'void setup(){ pinMode(7, OUTPUT); } void loop(){ digitalWrite(7, HIGH); delay(1000); digitalWrite(7, LOW); delay(1000); }', 0.6);
    ok(rl.state.on && lamp.state.on && Math.abs(lamp.state.i - 0.039) < 0.003, `relay on: the 230 V bulb lights (${(lamp.state.i * 1000).toFixed(0)} mA through the contacts), the coil takes ${Math.round(lab.i5 * 1000)} mA`);
    run(lab, 'void setup(){ pinMode(7, OUTPUT); } void loop(){ digitalWrite(7, HIGH); delay(1000); digitalWrite(7, LOW); delay(1000); }', 4.2); ok(rl.state.clicks >= 4, `relay clicks on and off with the sketch (${rl.state.clicks} clicks)`);
    const lab2 = new Lab(); rails(lab2); const r2 = lab2.addPart('relay', {}, { x: 150, z: 120 }, 0, 'rl'); lab2.addWire(T(r2, 'S'), 'B:D7'); lab2.addWire(T(r2, 'VCC'), 'H:tp50'); lab2.addWire(T(r2, 'GND'), 'H:tn50');
    const bat = lab2.addPart('aa4', {}, { x: 60, z: 140 }, 0, 'bat'); const pump = lab2.addPart('pump', {}, { x: 110, z: 150 }, 0, 'pump');
    lab2.addWire(T(bat, 'P'), T(r2, 'COM')); lab2.addWire(T(r2, 'NO'), T(pump, 'P')); lab2.addWire(T(pump, 'N'), T(bat, 'N'));
    run(lab2, 'void setup(){ pinMode(7, OUTPUT); digitalWrite(7, HIGH); } void loop(){}', 1.5); ok(pump.state.flow > 25 && lab2.i5 < 0.15, `relay runs the pump from its own battery: ${pump.state.flow.toFixed(1)} mL/s, ${Math.round(pump.state.i * 1000)} mA; the Arduino's 5 V carries only ${Math.round(lab2.i5 * 1000)} mA`);
  }
  // ---- PIR: HIGH at power-up, then HIGH for its hold time after motion
  { const lab = new Lab(); rails(lab); const pir = lab.addPart('pir', {}, { x: 150, z: 100 }, 1, 'pir'); lab.addWire(T(pir, 'VCC'), 'H:tp45'); lab.addWire(T(pir, 'GND'), 'H:tn45'); lab.addWire(T(pir, 'OUT'), 'B:D2');
    const log = []; run(lab, 'void setup(){ pinMode(2, INPUT); Serial.begin(9600); } void loop(){ Serial.println(digitalRead(2)); delay(250); }', 14, (t) => { pir.state.motion = t > 6 && t < 7; log.push(pir.state.out ? 1 : 0); });
    const at = (s) => log[Math.round(s * 60)]; ok(at(1) === 1 && at(4) === 0 && at(6.5) === 1 && at(9) === 1 && at(12) === 0, `PIR: HIGH while it learns the room, LOW, HIGH on motion, stays ${pir.props.hold} s, LOW again (${[1, 4, 6.5, 9, 12].map(at).join('')})`);
  }
  // ---- soil moisture: AO rises as the soil dries; MQ-2: AO rises with gas, after its warm-up
  { const lab = new Lab(); rails(lab); const so = lab.addPart('soil', {}, { x: 150, z: 120 }, 0, 'soil'); lab.addWire(T(so, 'VCC'), 'H:tp45'); lab.addWire(T(so, 'GND'), 'H:tn45'); lab.addWire(T(so, 'AO'), 'B:A0');
    const v = []; for (const m of [0.15, 0.5, 0.9]) { so.state.moist = m; const out = run(lab, 'void setup(){ Serial.begin(9600); } void loop(){ Serial.println(analogRead(A0)); delay(200); }', 0.6); v.push(+out.trim().split(/\s+/).pop()); }
    ok(v[0] > 850 && v[1] > 500 && v[1] < 800 && v[2] < 300, `soil: dry ${v[0]}, damp ${v[1]}, wet ${v[2]} (analogRead)`);
    const lab2 = new Lab(); rails(lab2); const mq = lab2.addPart('mq2', {}, { x: 150, z: 120 }, 0, 'mq'); lab2.addWire(T(mq, 'VCC'), 'H:tp45'); lab2.addWire(T(mq, 'GND'), 'H:tn45'); lab2.addWire(T(mq, 'AO'), 'B:A0');
    const g = (secs) => +run(lab2, 'void setup(){ Serial.begin(9600); } void loop(){ Serial.println(analogRead(A0)); delay(200); }', secs).trim().split(/\s+/).pop();
    const cold = g(0.5); const clean = g(14); mq.state.ppm = 1500; const gas = g(1);
    ok(cold > clean + 80 && clean < 150 && gas > 450, `MQ-2: cold ${cold} → warm clean air ${clean} → LPG 1500 ppm ${gas}; heater ${Math.round(lab2.i5 * 1000)} mA`);
  }
}

// ------------------------------------------------------------------ the lessons, played as a student would
const NEW3 = LESSONS.filter((l) => l.scene);
if (only('lessons') || NEW3.some((l) => only(l.id))) {
  ok(NEW3.length === 10 && new Set(LESSONS.map((l) => l.id)).size === LESSONS.length, `${NEW3.length} batch-3 lessons (n ${NEW3[0].n}–${NEW3[NEW3.length - 1].n}), ids unique`);
  for (const l of NEW3) {
    const c = compile(l.code); ok(c.ok && !c.warnings.length, `${l.id}: sketch compiles` + (c.ok ? (c.warnings.length ? ' (warnings: ' + c.warnings.map((w) => w.code).join(',') + ')' : '') : ' ' + JSON.stringify(c.errors)));
    for (const s of l.steps) for (const k of ['do', 'see']) if (s[k]) for (const lg of ['en', 'hi', 'hg']) if (typeof s[k][lg] !== 'string') ok(false, `${l.id}: step ${s.k} has ${k}.${lg}`);
    for (const k of ['title', 'goal']) for (const lg of ['en', 'hi', 'hg']) if (!l[k][lg]) ok(false, `${l.id}: ${k}.${lg}`);
  }
}
// build the bench as the student does (setup, then each place / wire step at its ghost)
function build(l) {
  const lab = new Lab(); const app = { lab, code: () => app.src, world: null, onStepDone() {}, onLessonComplete() {} }; app.src = l.code;
  const rt = new LessonRT(app); rt.open(l.id);
  const sim = makeScene(l.scene); app.world = { flag: (n) => sim.flag(n), val: (n) => sim.val(n), onRun: () => sim.onRun(lab) };
  for (const s of l.steps) {
    if (s.k === 'place') { const q = s.place; if (!lab.byTag(q.tag)) { const p = lab.addPart(q.type, q.props, q.at, q.rot, q.tag); if (!p) ok(false, `${l.id}: place ${q.tag} fits`); } }
    if (s.k === 'wire') { const g = rt.ghostWire(s.wire); if (!g) { ok(false, `${l.id}: a ghost wire for ${s.wire}`); continue; } lab.addWire(g[0], g[1]); if (!rt.conn(s.wire[0], s.wire[1])) ok(false, `${l.id}: wire ${s.wire} joins`); }
  }
  for (let f = 0; f < 8 * 60; f++) { lab.step(1000 / 60); sim.update(1 / 60, lab); } // the minutes the student spends wiring: the sensors settle in the room's air
  return { lab, app, rt, sim };
}
// play the lesson's steps after the wiring: Check, Run, the edits, and each watch / act step until it comes true
function play(l, B, acts) {
  const { lab, app, rt, sim } = B; let src = l.code; let ser = ''; const dt = 1 / 60; let ai = 0;
  const start = (code) => { const c = compile(code); if (!c.ok) throw new Error(JSON.stringify(c.errors)); app.src = code; lab.run(c); rt.onRun(code); };
  const sim1 = (each, secs, until) => { for (let f = 0; f < secs * 60; f++) { const t = f * dt; if (each) each(t, sim, lab); lab.step(1000 * dt); sim.update(dt, lab); rt.update(dt); for (const o of lab.mcu.ser.take()) ser += String.fromCharCode(...o.bytes); if (lab.mcu.state === 'error') throw new Error('runtime ' + JSON.stringify(lab.mcu.err)); if (until && until() && t > 0.3) return t; } return -1; };
  for (const s of l.steps) {
    if (s.k === 'check') { const r = rt.runCheck(); ok(!r, `${l.id}: the circuit check passes` + (r ? ': ' + JSON.stringify(r[0].en) : '')); }
    if (s.k === 'run') start(src);
    if (s.k === 'edit') { const e = s.set.reduce((x, [re, v]) => x.replace(re, v), src); ok(s.test(e) && !s.test(src), `${l.id}: the edit "${s.do.en.slice(0, 50)}…" is what the step asks`); src = e; start(src); }
    if (s.k === 'watch' || s.k === 'act') { const act = acts[ai++]; const t = sim1(act, 40, () => s.until(rt)); ok(t >= 0, `${l.id}: ${s.k} "${s.do.en.slice(0, 60)}" comes true` + (t >= 0 ? ` (${t.toFixed(1)} s)` : ' — timed out') + (s.see && s.see.en && s === l.steps[l.steps.length - 1] ? ' · ' + s.see.en : '')); }
  }
  ok(!!l.done(rt), `${l.id}: the lesson is complete (done)`);
  return ser;
}
const once = (at, f) => { let did = false; return (t, sim, lab) => { if (!did && t >= at) { did = true; f(sim, lab); } }; };
const seq = (keys, at = 0.3, gap = 0.35) => (t, sim, lab) => { const k = Math.round((t - at) / gap); if (k >= 0 && k < keys.length && Math.abs(t - at - k * gap) < 0.009) sim.press(lab, keys[k]); };
const stick = (x, y) => (t, sim, lab) => { const js = lab.byTag('js'); if (js && (js.state.x !== x || js.state.y !== y)) { js.state.x = x; js.state.y = y; lab.stateV++; lab.instKey = null; } };
const ACTS = () => ({ // (made fresh for each play: once() remembers that it has acted)
  lcdtemp: [null, once(0.5, (s) => s.control('chai', 1)), null],
  irrigate: [null, once(0.5, (s) => s.control('dry')), once(0.5, (s) => s.control('dry'))],
  homeauto: [once(0.5, (s, lab) => s.press(lab, '1')), once(0.5, (s, lab) => s.press(lab, '2')), once(0.5, (s, lab) => s.press(lab, '1')), once(0.8, (s, lab) => s.press(lab, '3'))],
  burglar: [once(3, (s) => s.control('walk')), null, once(3, (s) => s.control('cat'))],
  rfidlock: [once(1, (s, lab) => s.control('card', null, lab)), once(1, (s, lab) => s.control('card', null, lab)), once(1, (s, lab) => s.control('tag', null, lab))],
  weather: [null, once(0.5, (s) => s.control('sky', 'rainy')), null],
  keylock: [seq(['1', '1', '1', '1', '#']), seq(['1', '2', '3', '4', '#']), seq(['2', '5', '8', '0', '#'])],
  gasalarm: [null, once(0.3, (s) => s.control('leak', 30)), once(0.3, (s) => { s.control('leak', 0); s.control('win', '1'); }), once(0.3, (s) => { s.control('win', '0'); s.control('leak', 30); })],
  pantilt: [stick(0.306, 0.292), stick(0.694, 0.683), stick(0.694, 0.317)],
  turntable: [null, null, null],
});
for (const l of NEW3) {
  if (!(only('lessons') || only(l.id))) continue;
  const t0 = Date.now();
  try {
    const B = build(l); const out = play(l, B, ACTS()[l.id] || []);
    if (l.id === 'rfidlock') ok(/Card: A3 4F 1C 2D\r\nAccess denied/.test(out) && /Welcome! Door open/.test(out), 'rfidlock: the Serial Monitor shows the card\'s number, "Access denied", then "Welcome!"');
    if (l.id === 'irrigate') ok(B.lab.i5 < 0.2 && B.sim.ml > 50, `irrigate: the pump drew from its battery, ${Math.round(B.sim.ml)} mL poured; the Arduino's 5 V carried ${Math.round(B.lab.i5 * 1000)} mA`);
  } catch (e) { ok(false, `${l.id}: ${e.message}`); console.log(e.stack.split('\n').slice(0, 4).join('\n')); }
  console.log(`     ${l.id} ${((Date.now() - t0) / 1000).toFixed(1)} s`);
}

// ------------------------------------------------------------------ the block editor's model (blocks.js)
if (only('blocks')) {
  // the sketch's tree without line numbers and spelling: { } around one statement, `int a, b;` split, `else { if … }` = `else if …`,
  // the globals first (the blocks keep every global in one stack, at the top)
  const norm = (n) => {
    if (Array.isArray(n)) return n.flatMap((x) => (x && x.k === 'decl' && x.vars.length > 1 ? x.vars.map((v) => norm(Object.assign({}, x, { vars: [v] }))) : [norm(x)]));
    if (!n || typeof n !== 'object') return n;
    const o = {}; for (const [k, v] of Object.entries(n)) { if (k === 'line' || k === 'text' || k === 'semi' || k === 'top') continue; o[k] = norm(v); }
    const blk = (x) => (x && x.k !== 'block' ? { k: 'block', body: [x] } : x);
    if (o.k === 'if') { o.a = blk(o.a); if (o.b && o.b.k === 'block' && o.b.body.length === 1 && o.b.body[0].k === 'if') o.b = o.b.body[0]; else if (o.b && o.b.k !== 'if') o.b = blk(o.b); }
    if (o.k === 'for' || o.k === 'while' || o.k === 'do') o.body = blk(o.body);
    return o;
  };
  const tree = (src) => { const it = parse(src).items; return JSON.stringify(norm([...it.filter((x) => x.k === 'decl'), ...it.filter((x) => x.k !== 'decl')])); };
  const greys = (prog) => { let n = 0; const walk = (l) => { for (const b of l || []) { if (b.t === 'raw' || b.t === 'rawv') n++; walk(Object.values(b.i || {}).filter(Boolean)); walk(b.s); walk(b.e); } }; for (const st of prog.stacks) walk(st.body); return n; };
  const cpp = (src) => toCpp(toBlocks(src).prog).code;
  // every sketch of every lesson (all batches) and the free build's: C++ -> blocks -> C++ is the same program, keeps its comments, and is stable
  const sketches = [['free', FREE_CODE], ...LESSONS.filter((l) => compile(l.code).ok).map((l) => [l.id, l.code])];
  let same = 0; const bad = [];
  for (const [id, src] of sketches) {
    const r = toBlocks(src); if (!r.ok) { bad.push(id + ' (no blocks: ' + r.error.code + ')'); continue; }
    const out = toCpp(r.prog).code; const c = compile(out);
    const cm0 = (src.match(/\/\/|\/\*/g) || []).length, cm1 = (out.match(/\/\//g) || []).length;
    if (c.ok && tree(out) === tree(src) && cm1 >= cm0 && cpp(out) === out) same++; else bad.push(id);
  }
  ok(!bad.length, `blocks: ${same}/${sketches.length} lesson sketches (all batches) go C++ → blocks → C++ unchanged in meaning, comments kept` + (bad.length ? ' — not: ' + bad.join(', ') : ''));
  // the beginners' lessons are blocks from end to end (no grey "C++" block), and each of their edit steps is a change of one value in a block
  for (const l of LESSONS.filter((x) => x.blocks)) {
    const r = toBlocks(l.code); ok(r.ok && greys(r.prog) === 0, `blocks: ${l.id} (Class ${l.cls || '6–8'}) opens as blocks only` + (r.ok ? ` (${greys(r.prog)} grey C++ blocks)` : ''));
    let src = l.code;
    for (const s of l.steps.filter((x) => x.k === 'edit')) {
      const want = s.set.reduce((x, [re, v]) => x.replace(re, v), src); const A = toBlocks(src).prog, B = toBlocks(want).prog;
      const ch = blockDiff(A, B); // the student types a new value in a block, picks a choice, or drags a Maths block into a slot
      if (!ch) { ok(false, `blocks: ${l.id} edit "${s.do.en.slice(0, 44)}…" needs blocks added or removed`); src = want; continue; }
      for (const c of ch) { if (c.kind === 'lit') c.block.f.v = c.v; else if (c.kind === 'field') c.block.f[c.key] = c.v; else c.block.i[c.key] = c.v; }
      const made = toCpp(A).code; const typed = ch.filter((c) => c.kind !== 'slot').length;
      ok(ch.length > 0 && ch.length <= 3 && s.test(made) && compile(made).ok, `blocks: ${l.id} edit "${s.do.en.slice(0, 44)}…" is done in blocks: ${typed} value(s) typed, ${ch.length - typed} block(s) dragged in`);
      src = made;
    }
  }
  // a program put together from the palette (no C++ typed): it compiles with its #includes and runs on the bench
  { const P = toBlocks('void setup() {}\nvoid loop() {}').prog; const G = P.stacks[0].body, S = P.stacks.find((x) => x.hat === 'setup').body, Lp = P.stacks.find((x) => x.hat === 'loop').body;
    G.push(mk('lcd_decl'), mk('dht_decl', { pin: '2' })); S.push(mk('lcd_init'), mk('lcd_bl'), mk('dht_begin'), mk('pinmode', {}, { pin: { t: 'pin', f: { v: '13' }, i: {} } }));
    const ifb = mk('if', {}, { c: mk('cmp', { op: '>' }, { a: mk('dht_t'), b: { t: 'num', f: { v: '30' }, i: {} } }) }); ifb.s.push(mk('dwrite'));
    Lp.push(mk('lcd_cursor'), mk('lcd_print', {}, { v: mk('dht_t') }), ifb, mk('delay'));
    const code = toCpp(P).code; const c = compile(code);
    ok(c.ok && /#include <Wire\.h>\n#include <LiquidCrystal_I2C\.h>\n#include <DHT\.h>/.test(code), 'blocks: a program put together from the palette brings its own #includes and compiles' + (c.ok ? '' : ' ' + JSON.stringify(c.errors)));
    const lab = new Lab(); rails(lab); const lcd = lab.addPart('lcd16', {}, { x: -150, z: 100 }, 0, 'lcd'); lab.addWire(T(lcd, 'GND'), 'H:tn20'); lab.addWire(T(lcd, 'VCC'), 'H:tp20'); lab.addWire(T(lcd, 'SDA'), 'B:A4'); lab.addWire(T(lcd, 'SCL'), 'B:A5');
    const d = lab.addPart('dht11', {}, { hole: 'j40' }, 0, 'dht'); lab.addWire('H:f40', 'B:D2'); lab.addWire('H:f41', 'H:tp41'); lab.addWire('H:f42', 'H:tn42');
    if (c.ok) { run(lab, code, 6); ok(/^\d\d\.\d\d/.test(lcdText(lcd)[0] || ''), `blocks: …and runs: the LCD shows "${(lcdText(lcd)[0] || '').trim()}"`); }
    void d; }
  // what the blocks cannot show is said in plain words, and nothing is lost
  { const r = toBlocks('#define LED 13\nvoid setup() { pinMode(LED, OUTPUT); }\nvoid loop() {}'); ok(!r.ok && r.error.code === 'B3_DEFINE' && r.error.line === 1, 'blocks: a #define keeps the sketch in C++ (with the reason)');
    const r2 = toBlocks('void setup() {\n  pinMode(13, OUTPUT)\n}\nvoid loop() {}'); ok(!r2.ok && r2.error.line >= 2, `blocks: a C++ mistake keeps the blocks away and names line ${r2.ok ? '?' : r2.error.line}`);
    const src = 'int a[3] = {1, 2, 3};\nvoid setup() {\n  switch (a[0]) {\n    case 1: a[1] = 5; break;\n  }\n  do { a[2]--; } while (a[2] > 0);\n}\nvoid loop() {}\n';
    const r3 = toBlocks(src); ok(r3.ok && greys(r3.prog) === 3 && tree(toCpp(r3.prog).code) === tree(src), 'blocks: C++ the blocks do not know stays as grey C++ blocks, unchanged'); }
  // the beginners' lessons played to the end with the C++ the blocks wrote
  for (const l of LESSONS.filter((x) => x.blocks && x.scene)) {
    try { const L2 = Object.assign({}, l, { code: cpp(l.code) }); play(L2, build(L2), ACTS()[l.id] || []); } catch (e) { ok(false, `blocks: ${l.id} with the blocks' C++: ${e.message}`); }
  }
}
console.log(fails ? `${fails} FAILED` : 'all passed'); process.exit(fails ? 1 : 0);
