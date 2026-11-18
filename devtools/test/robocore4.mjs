// DUET Robotics Lab 360, batch 4 (more boards): the engine without a browser. Each board's pins and breadboard holes,
// ADC resolution, 3.3 V and 5 V logic and the ESP32's level warnings, WiFi and web routes (WebServer, AsyncWebServer,
// soft AP), Bluetooth serial, touch, Hall, ledc, the Mega's serial ports, the compiler's board checks; then every new
// lesson, end to end, built as a student would (setup, each place / wire at its ghost), run, and checked as complete.
//   node devtools/test/robocore4.mjs [lesson,...]      (exit 1 on a failure)
import { compile } from '../../robotics/js/cpp.js';
import { Lab } from '../../robotics/js/sim.js';
import { BOARDS } from '../../robotics/js/boards.js';
import { LESSONS } from '../../robotics/js/lessons.js';
import { LessonRT } from '../../robotics/js/lessonrt.js';
import { netOf, SCHOOL, AP_IP } from '../../robotics/js/esp32.js';

const only = process.argv[2] ? process.argv[2].split(',') : null;
let fails = 0; const ok = (c, m) => { if (!c) { fails++; console.log('FAIL ' + m); } else console.log('ok   ' + m); };
const serial = (lab, baud) => { let s = ''; for (const o of lab.mcu.ser.take()) if (!baud || o.baud === baud) s += String.fromCharCode(...o.bytes); return s; };
function run(lab, src, secs, each, baud) {
  const c = compile(src, lab.def); if (!c.ok) throw new Error('compile ' + JSON.stringify(c.errors));
  lab.run(c); let out = ''; const dt = 1 / 60;
  for (let f = 0; f < secs * 60; f++) { if (each) each(f * dt, f); lab.step(1000 * dt); out += serial(lab, baud); if (lab.mcu.state === 'error') throw new Error('runtime ' + JSON.stringify(lab.mcu.err)); }
  return out;
}
const near = (a, b, tol) => Math.abs(a - b) <= tol;

if (!only) {
  // ------------------------------------------------------------ boards: pins and holes
  { const N = BOARDS.nano, M = BOARDS.mega, E = BOARDS.esp32;
    ok(N.pins.length === 30 && N.pins.filter((p) => p.gpio !== undefined).length === 22, `Nano: 30 pins, 22 GPIO (D0–D13, A0–A7)`);
    ok(M.pins.filter((p) => p.gpio !== undefined).length === 70 && M.pins.filter((p) => p.gpio >= 54).length === 16, `Mega: 70 GPIO (54 digital + 16 analog)`);
    ok(E.pins.length === 30 && E.pins.filter((p) => p.gpio !== undefined).length === 25, `ESP32 DevKit V1: 30 pins, 25 GPIO on them (${E.pins.filter((p) => p.gpio !== undefined).map((p) => p.gpio).sort((a, b) => a - b).join(',')})`);
    const lab = new Lab(); lab.setBoard('nano');
    ok(lab.bbMap().pin.get('D12') === 'd3' && lab.bbMap().pin.get('D13') === 'h3' && lab.bbMap().pin.get('VIN') === 'h17', 'Nano in the breadboard: D12 in 3d, D13 in 3h, VIN in 17h');
    ok(lab.conn('D12', 'H:a3') && !lab.endpointFree('H:e3') && lab.endpointFree('H:c3') && !lab.endpointFree('B:D12'), 'Nano: a hole of D12\'s column is D12; the holes under the board are covered');
    ok(!lab.addPart('led', {}, { hole: 'e10' }, 0) && !!lab.addPart('led', {}, { hole: 'e30' }, 0), 'Nano: no part fits under it; one fits beside it');
    lab.setBoard('esp32');
    ok(lab.bbMap().pin.get('D23') === 'i18' && lab.bbMap().pin.get('VIN') === 'b4' && lab.endpointFree('H:a4') && lab.endpointFree('H:j18') && !lab.endpointFree('H:c10'), 'ESP32 in the breadboard: rows b and i, one free hole (a / j) beside each pin');
    lab.setBoard('mega'); ok(lab.board.x === -112 && lab.endpointFree('B:D53') && lab.conn('SDA', 'D20'), 'Mega on the mat; its SDA pin is D20');
    lab.setBoard('uno'); ok(lab.board.x === -92 && lab.board.z === -2 && lab.def.id === 'uno', 'back to the Uno, in its old place'); }
  // ------------------------------------------------------------ compiler: board checks and names
  { const E = BOARDS.esp32, U = BOARDS.uno, M = BOARDS.mega;
    const c1 = compile('#include <WiFi.h>\nvoid setup(){ WiFi.begin("a", "b"); }\nvoid loop(){}', U); ok(!c1.ok && c1.errors[0].code === 'E_BOARD_LIB', 'WiFi on an Uno: "does not work on the Uno"');
    const c2 = compile('void setup(){ touchRead(4); }\nvoid loop(){}', M); ok(!c2.ok && c2.errors[0].code === 'E_BOARD_FUNC', 'touchRead() on a Mega: "an ESP32 function"');
    const c3 = compile('void setup(){ Serial1.begin(9600); }\nvoid loop(){}', U); ok(!c3.ok && c3.errors[0].code === 'E_BOARD_LIB', 'Serial1 on an Uno: an error');
    ok(compile('void setup(){ Serial1.begin(9600); Serial3.begin(9600); }\nvoid loop(){}', M).ok, 'Serial1–3 on the Mega');
    const c4 = compile('void setup(){ WiFi.begin("a"); }\nvoid loop(){}', E); ok(!c4.ok && c4.errors[0].code === 'E_LIB4_INCLUDE', 'WiFi without #include <WiFi.h>: says which include');
    const k = (b, n) => { const c = compile(`int x = ${n};\nvoid setup(){ Serial.begin(9600); Serial.println(x); }\nvoid loop(){}`, b); return c.ok ? c.js.match(/v_x=(\d+)/)[1] | 0 : null; };
    ok(k(U, 'LED_BUILTIN') === 13 && k(E, 'LED_BUILTIN') === 2 && k(M, 'A0') === 54 && k(U, 'A0') === 14 && k(E, 'A0') === 36 && k(E, 'T0') === 4, 'names per board: LED_BUILTIN 13 / 2, A0 14 / 54 / 36, T0 = GPIO 4');
    const c5 = compile('#include <WiFi.h>\n#include <ESPAsyncWebServer.h>\nAsyncWebServer server(80);\nconst char page[] PROGMEM = R"rawliteral(<h1>Hi</h1>)rawliteral";\nvoid setup(){ server.on("/", HTTP_GET, [](AsyncWebServerRequest *request){ request->send(200, "text/html", page); }); server.begin(); }\nvoid loop(){}', E);
    ok(c5.ok, 'ESPAsyncWebServer style: lambda with a request, PROGMEM, raw string R"rawliteral(…)rawliteral"' + (c5.ok ? '' : ' ' + JSON.stringify(c5.errors)));
    const c6 = compile('#include <WebServer.h>\nWebServer s(80);\nvoid h(int x){}\nvoid setup(){ s.on("/", h); }\nvoid loop(){}', E); ok(!c6.ok && c6.errors[0].code === 'E_HANDLER', 'a page handler with the wrong parameters: E_HANDLER');
    ok(compile('const char* ssid = "DUET";\nvoid setup(){ Serial.begin(9600); Serial.println(ssid); }\nvoid loop(){}', U).ok, 'a const char* text compiles (it stays a quoted string)'); }
  // ------------------------------------------------------------ ADC and logic levels
  { const lab = new Lab(); lab.setBoard('esp32'); const pot = lab.addPart('pot', {}, { hole: 'f30' }, 0);
    lab.addWire('H:j4', 'H:j30'); lab.addWire('H:j5', 'H:j34'); lab.addWire('H:i32', 'H:a15'); // 3V3 - pot - GND, wiper -> GPIO 34
    const out = run(lab, 'void setup(){ Serial.begin(115200); }\nvoid loop(){ Serial.print(analogRead(34)); Serial.print(" "); Serial.println(analogReadMilliVolts(34)); analogReadResolution(10); Serial.println(analogRead(34)); analogReadResolution(12); delay(100); }', 0.6, null, 115200);
    const L = out.trim().split('\r\n').filter((x) => /^\d/.test(x)); const [raw, mv] = L[0].split(' ').map(Number); const r10 = +L[1];
    ok(near(raw, 2112, 40) && near(mv, 1650, 25) && near(r10, raw / 4, 15), `ESP32 ADC 12-bit: 1.65 V reads ${raw} (of 4095), ${mv} mV calibrated; 10-bit: ${r10}`);
    pot.state.pos = 0.98; lab.stateV++; lab.instKey = null; const out2 = run(lab, 'void setup(){ Serial.begin(115200); }\nvoid loop(){ Serial.println(analogRead(34)); delay(50); }', 0.3, null, 115200);
    ok(+out2.trim().split('\r\n').filter((x) => /^\d+$/.test(x))[0] === 0, 'ESP32 ADC near 0 V (66 mV) already reads 0, as a real ESP32 does');
    const lab2 = new Lab(); lab2.addPart('pot', {}, { hole: 'e45' }, 0); lab2.addWire('B:5V', 'H:a45'); lab2.addWire('B:GND1', 'H:a49'); lab2.addWire('B:A0', 'H:a47');
    const o3 = run(lab2, 'void setup(){ Serial.begin(9600); }\nvoid loop(){ Serial.println(analogRead(A0)); delay(100); }', 0.3); ok(near(+o3.trim().split('\r\n')[0], 507, 4), 'Uno ADC unchanged: 10-bit, ~507 at 2.48 V');
    const lab3 = new Lab(); lab3.setBoard('mega'); lab3.addPart('pot', {}, { hole: 'e45' }, 0); lab3.addWire('B:5V', 'H:a45'); lab3.addWire('B:GND1', 'H:a49'); lab3.addWire('B:A15', 'H:a47');
    const o4 = run(lab3, 'void setup(){ Serial.begin(9600); }\nvoid loop(){ Serial.println(analogRead(A15)); delay(100); }', 0.3); ok(near(+o4.trim().split('\r\n')[0], 507, 4), 'Mega analogRead(A15) (pin 69) reads the knob: ' + o4.trim().split('\r\n')[0]);
    const lab4 = new Lab(); lab4.setBoard('nano'); lab4.addPart('pot', {}, { hole: 'e45' }, 0); lab4.addWire('H:i14', 'H:a45'); lab4.addWire('H:i16', 'H:a49'); lab4.addWire('H:i13', 'H:a47'); // 5V col 14, GND col 16, A7 col 13 (front row)
    const o5 = run(lab4, 'void setup(){ Serial.begin(9600); }\nvoid loop(){ Serial.println(analogRead(A7)); delay(100); }', 0.3); ok(near(+o5.trim().split('\r\n')[0], 507, 4), 'Nano analogRead(A7) through its breadboard column: ' + o5.trim().split('\r\n')[0]);
    const c = compile('void setup(){ pinMode(A7, OUTPUT); }\nvoid loop(){}', lab4.def); lab4.run(c); lab4.step(20); ok(lab4.mcu.state === 'error' && lab4.mcu.err.code === 'R_ANALOG_ONLY', 'Nano: A7 is analog input only'); }
  { // 3.3 V logic and the warnings
    const lab = new Lab(); lab.setBoard('esp32'); const warns = []; lab.on((t, d) => { if (t === 'warn') warns.push(d); });
    const led = lab.addPart('led', { color: 'red' }, { hole: 'e30' }, 0); lab.addPart('resistor', { ohms: 220 }, { hole: 'b30' }, 3); lab.addWire('H:a5', 'H:tn2'); lab.addWire('H:a11', 'H:a31');
    run(lab, 'void setup(){ pinMode(25, OUTPUT); digitalWrite(25, HIGH); }\nvoid loop(){}', 0.3);
    const v = lab.voltageAt('B:D25'); ok(near(v, 3.3, 0.25) && near(led.state.i * 1000, 5.9, 1.2), `ESP32 HIGH is 3.3 V (${v.toFixed(2)} V); the LED gets ${(led.state.i * 1000).toFixed(1)} mA (an Uno gives 12.6 mA)`);
    ok(!warns.length, 'no warning for a correct 3.3 V circuit');
    lab.addWire('H:a4', 'H:a40'); lab.addPart('resistor', { ohms: 220 }, { hole: 'c40' }, 0); lab.addWire('H:a14', 'H:a44'); // VIN (5 V) -> 220 Ω -> GPIO 35 (input only): a 5 V signal on a 3.3 V pin
    run(lab, 'void setup(){ pinMode(35, INPUT); }\nvoid loop(){ delay(10); }', 0.4);
    ok(warns.some((w) => w.msg.en.includes('GPIO 35') || /GPIO \{pin\}/.test(w.msg.en)) && lab.voltageAt('B:D35') < 4.4, `5 V through a resistor into GPIO 35: warned, the pin is clamped at ${lab.voltageAt('B:D35').toFixed(2)} V`);
    lab.addWire('H:j4', 'H:b40'); // 3V3 (front, column 4) to VIN (joined to column 40 above)
    run(lab, 'void setup(){}\nvoid loop(){}', 0.2); ok(warns.some((w) => /VIN \(5 V\) is joined to 3V3/.test(w.msg.en)), 'VIN joined to 3V3: warned');
    const lab2 = new Lab(); lab2.setBoard('esp32'); const w2 = []; lab2.on((t, d) => { if (t === 'warn') w2.push(d); }); lab2.addPart('hcsr04', {}, { hole: 'j50' }, 0); lab2.addWire('H:j4', 'H:f50'); lab2.addWire('H:j5', 'H:f53');
    run(lab2, 'void setup(){}\nvoid loop(){}', 0.2); ok(w2.some((w) => /needs 5 V/.test(w.msg.en)), 'an HC-SR04 on 3V3: "needs 5 V, use VIN"');
    const lab3 = new Lab(); lab3.setBoard('esp32'); const c = compile('void setup(){ pinMode(34, OUTPUT); digitalWrite(34, HIGH); }\nvoid loop(){}', lab3.def); lab3.run(c); lab3.step(20);
    ok(lab3.mcu.notes.some((n) => n.code === 'N_INPUT_ONLY') && lab3.mcu.pins[34].mode === 0, 'GPIO 34 as OUTPUT: a note, it stays an input');
    const c2 = compile('void setup(){ digitalWrite(7, HIGH); }\nvoid loop(){}', lab3.def); lab3.run(c2); lab3.step(20); ok(lab3.mcu.err && lab3.mcu.err.code === 'R_PIN_FLASH', 'GPIO 7: "wired to the flash chip"'); }
  // ------------------------------------------------------------ WiFi, web routes, soft AP
  { const lab = new Lab(); lab.setBoard('esp32'); const N = netOf(lab); const warns = []; lab.on((t, d) => { if (t === 'warn') warns.push(d); });
    const web = (pass) => `#include <WiFi.h>\n#include <WebServer.h>\nWebServer server(80);\nint hits = 0;\nvoid root() { hits++; server.send(200, "text/html", "<h1>Hits " + String(hits) + "</h1>"); }\nvoid setv() { server.send(200, "text/plain", "v=" + server.arg("v")); }\nvoid setup(){ Serial.begin(115200); WiFi.begin("${SCHOOL.ssid}", "${pass}"); while (WiFi.status() != WL_CONNECTED) { delay(200); } Serial.println(WiFi.localIP()); server.on("/", root); server.on("/set", HTTP_GET, setv); server.begin(); }\nvoid loop(){ server.handleClient(); }`;
    run(lab, web('wrong'), 5); ok(!N.staIP() && warns.some((w) => /wrong password/.test(w.msg.en)), 'WiFi: a wrong password never connects; the router tells why');
    const got = []; const out = run(lab, web(SCHOOL.pass), 6, (t, f) => {
      if (f === 180) N.request('http://' + N.staIP() + '/', (r) => got.push(r));
      if (f === 200) N.request(N.staIP() + '/set?v=42', (r) => got.push(r));
      if (f === 220) N.request(N.staIP() + '/nothing', (r) => got.push(r));
      if (f === 240) N.request('192.168.1.250/', (r) => got.push(r));
    }, 115200);
    ok(/192\.168\.1\.\d+/.test(out) && out.includes(N.staIP()), 'WiFi.begin + localIP: ' + N.staIP());
    ok(got[0] && got[0].code === 200 && got[0].body === '<h1>Hits 1</h1>', 'GET / runs the sketch\'s handler: ' + JSON.stringify(got[0] && got[0].body));
    ok(got[1] && got[1].body === 'v=42', 'GET /set?v=42: server.arg("v")');
    ok(got[2] && got[2].code === 404 && /Not found: \/nothing/.test(got[2].body), 'an unknown page: 404 "Not found: /nothing"');
    ok(got.length === 3, 'another address: no answer yet (it times out)');
    const lab2 = new Lab(); lab2.setBoard('esp32'); const N2 = netOf(lab2); const g2 = [];
    run(lab2, `#include <WiFi.h>\n#include <WebServer.h>\nWebServer server(80);\nvoid root(){ server.send(200, "text/plain", "hi"); }\nvoid setup(){ WiFi.begin("${SCHOOL.ssid}", "${SCHOOL.pass}"); while (WiFi.status() != WL_CONNECTED) delay(100); server.on("/", root); server.begin(); }\nvoid loop(){ }`, 9, (t, f) => { if (f === 200) N2.request(N2.staIP() + '/', (r) => g2.push(r)); });
    ok(g2[0] && g2[0].error === 'timeout' && lab2.mcu.notes.some((n) => n.code === 'N_NO_HANDLE'), 'no server.handleClient() in loop(): the page times out, and a note says why');
    const lab3 = new Lab(); lab3.setBoard('esp32'); const N3 = netOf(lab3); const g3 = []; let joined = '';
    run(lab3, '#include <WiFi.h>\n#include <ESPAsyncWebServer.h>\nAsyncWebServer server(80);\nint level = 0;\nvoid setup(){ pinMode(2, OUTPUT); WiFi.softAP("DUET-Robot", "robot1234"); server.on("/led", HTTP_GET, [](AsyncWebServerRequest *request){ if (request->hasParam("on")) { level = request->getParam("on")->value().toInt(); digitalWrite(2, level); } request->send(200, "text/plain", "LED " + String(level)); }); server.begin(); }\nvoid loop(){ delay(1000); }', 3,
      (t, f) => { if (f === 60) { joined = N3.join('DUET-Robot', 'robot1234'); } if (f === 70) N3.request(AP_IP + '/led?on=1', (r) => g3.push(r)); });
    ok(joined === 'ok' && g3[0] && g3[0].body === 'LED 1' && lab3.ledL > 0.5, `soft AP + AsyncWebServer: the phone joins DUET-Robot, /led?on=1 answers "${g3[0] && g3[0].body}" (no handleClient needed) and the LED lights`);
    ok(N3.join('DUET-Robot', 'short') === 'pass', 'a wrong AP password is refused'); }
  // ------------------------------------------------------------ Bluetooth serial
  { const lab = new Lab(); lab.setBoard('esp32'); const N = netOf(lab);
    run(lab, '#include "BluetoothSerial.h"\nBluetoothSerial BT;\nvoid setup(){ pinMode(2, OUTPUT); BT.begin("DUET-T"); }\nvoid loop(){ if (BT.available()) { char c = BT.read(); if (c == \'1\') { digitalWrite(2, HIGH); BT.println("ON"); } } if (BT.hasClient()) { } delay(20); }', 2.5,
      (t, f) => { if (f === 30) N.btConnect('DUET-T'); if (f === 60) N.btSend('1'); });
    ok(N.btDevices().includes('DUET-T') && N.bt.conn === 'DUET-T' && lab.ledL > 0.5 && N.bt.log.some((x) => x.text === 'ON'), 'BluetoothSerial: the phone finds DUET-T, sends "1", the LED lights, the phone gets "ON"');
    lab.resetBoard(); lab.step(50); ok(!N.bt.conn && N.bt.log.some((x) => x.sys === 'lost'), 'the ESP32 restarts: the phone shows "connection lost"'); }
  // ------------------------------------------------------------ touch, Hall, temperatureRead, ledc
  { const lab = new Lab(); lab.setBoard('esp32'); const pad = lab.addPart('touch4', {}, { x: 60, z: 72 }, 0); lab.addWire('T:' + pad.uid + ':PAD', 'H:j8');
    const mag = lab.addPart('magnet4', {}, { x: 0, z: 0 }, 0);
    const out = run(lab, 'void setup(){ Serial.begin(115200); ledcSetup(0, 5000, 8); ledcAttachPin(2, 0); ledcWrite(0, 64); ledcAttach(23, 1000, 10); ledcWrite(23, 1023); }\nvoid loop(){ Serial.print(touchRead(T0)); Serial.print(" "); Serial.print(hallRead()); Serial.print(" "); Serial.println(temperatureRead()); delay(100); }', 1.6,
      (t, f) => { pad.state.pressed = f >= 40 && f < 60; mag.state.dist = f < 70 ? 40 : 4; mag.state.pole = 'N'; }, 115200);
    const L = out.trim().split('\r\n').filter((x) => /^\d/.test(x)).map((x) => x.split(' ').map(Number));
    ok(L[0][0] > 55 && L.some((r) => r[0] < 25), `touchRead(T0): ${L[0][0]} free, ${Math.min(...L.map((r) => r[0]))} touched`);
    ok(near(L[0][1], 18, 12) && Math.max(...L.map((r) => r[1])) > 90, `hallRead(): ~${L[0][1]} with no magnet, ${Math.max(...L.map((r) => r[1]))} with the N pole 4 mm away`);
    ok(L.every((r) => near(r[2], 53.33, 0.01)) && lab.mcu.notes.some((n) => n.code === 'N_TEMP_NONE'), 'temperatureRead() is 53.33 (no working sensor on the ESP32-WROOM-32), with a note');
    ok(lab.mcu.pins[2].pwm === 64 && lab.mcu.pins[23].level === 1, 'ledc: core 2.x (channel 0 = 64/255 on GPIO 2) and core 3.x (ledcAttach on GPIO 23, full)'); }
  { const lab = new Lab(); lab.setBoard('esp32'); const c = compile('#include <WiFi.h>\nvoid setup(){ Serial.begin(115200); WiFi.begin("x", "y"); }\nvoid loop(){ Serial.println(analogRead(4)); delay(100); }', lab.def); lab.run(c); for (let i = 0; i < 20; i++) lab.step(16);
    ok(lab.mcu.notes.some((n) => n.code === 'N_ADC2_WIFI'), 'ADC2 (GPIO 4) while WiFi is on: reads 0, with a note'); }
  // ------------------------------------------------------------ the Mega's serial ports
  { const lab = new Lab(); lab.setBoard('mega'); lab.addWire('B:D18', 'B:D19');
    const out = run(lab, 'void setup(){ Serial.begin(9600); Serial1.begin(9600); Serial3.begin(9600); }\nvoid loop(){ Serial1.print("A"); Serial3.print("B"); delay(100); while (Serial1.available()) Serial.write(Serial1.read()); while (Serial3.available()) Serial.write(Serial3.read()); }', 1);
    ok(out.includes('A') && !out.includes('B'), `Mega: Serial1 comes back through the TX1–RX1 wire ("${out.slice(0, 6)}…"); Serial3 has no wire: nothing`); }
  // ------------------------------------------------------------ an old lesson still runs on the Uno after a board change
  { const lab = new Lab(); const app = { lab, code: () => '', world: null, onStepDone() {}, onLessonComplete() {} }; const rt = new LessonRT(app);
    rt.open('esp_meet'); ok(lab.def.id === 'esp32', 'opening an ESP32 lesson puts the ESP32 on the bench'); rt.open('traffic'); ok(lab.def.id === 'uno' && lab.wires.some((w) => w.a === 'B:GND3' || w.b === 'B:GND3'), 'opening an old lesson puts the Uno back, with its wires'); }
}

// ------------------------------------------------------------ every new lesson, end to end
function build(l) {
  const lab = new Lab(); const app = { lab, code: () => app.src, world: null, onStepDone() {}, onLessonComplete() {} }; app.src = l.code;
  const rt = new LessonRT(app); rt.open(l.id);
  for (const s of l.steps) {
    if (s.k === 'act' && l.id === 'nano_traffic' && !lab.byTag('nanoDone')) { lab.setBoard('nano'); }
    if (s.k === 'place') { const q = s.place; if (!lab.byTag(q.tag)) { const p = lab.addPart(q.type, q.props, q.at, q.rot, q.tag); if (!p) ok(false, `${l.id}: place ${q.tag} fits`); } }
    if (s.k === 'wire') { const g = rt.ghostWire(s.wire); if (!g) { ok(false, `${l.id}: a ghost wire for ${s.wire}`); continue; } lab.addWire(g[0], g[1]); if (!rt.conn(s.wire[0], s.wire[1])) ok(false, `${l.id}: wire ${s.wire} joins`); }
  }
  return { lab, app, rt };
}
function play(B, l, src, secs, each) {
  const { lab, app, rt } = B; app.src = src; const c = compile(src, lab.def); if (!c.ok) throw new Error('compile ' + JSON.stringify(c.errors));
  lab.run(c); rt.onRun(src); const dt = 1 / 60; let ser = ''; const baud = l.baud || 9600; let part = '';
  for (let f = 0; f < secs * 60; f++) {
    if (each) each(f * dt, f); lab.step(1000 * dt); rt.update(dt);
    for (const o of lab.mcu.ser.take()) { if (o.baud !== baud) continue; const s = String.fromCharCode(...o.bytes); ser += s; part += s.replace(/\r/g, ''); const ls = part.split('\n'); part = ls.pop(); for (const x of ls) rt.onSerialLine(x); }
    if (lab.mcu.state === 'error') throw new Error('runtime ' + JSON.stringify(lab.mcu.err));
  }
  return ser;
}
const edit = (src, set) => set.reduce((s, [re, v]) => s.replace(re, v), src);
const stepsDone = (B, l, kinds) => l.steps.every((s, i) => !kinds.includes(s.k) || B.rt.stepDone(s) || (s.k === 'check' && !B.rt.runCheck()) || console.log(`     (${l.id}: step ${i} ${s.k} not done)`));
const T = {
  nano_meet(l, B) { for (const r of ['n_usb', 'n_mcu', 'n_back', 'n_front', 'n_reset']) B.rt.taps.add(r); play(B, l, l.code, 3); ok(B.rt.toggles('L') >= 4, 'nano_meet: the L LED blinks on pin 13'); },
  nano_traffic(l, B) { ok(B.lab.def.id === 'nano' && !B.rt.runCheck(), 'nano_traffic: on the Nano, the circuit check passes: ' + JSON.stringify(B.rt.runCheck() || '')); play(B, l, l.code, 8.5); ok(['led1', 'led2', 'led3'].every((x) => B.rt.toggles(x) >= 2), 'nano_traffic: the same sketch runs the three LEDs'); },
  mega_meet(l, B) { for (const r of ['m_mcu', 'm_pwm', 'm_comm', 'm_dbl', 'm_analog']) B.rt.taps.add(r); const out = play(B, l, l.code, 2.2); ok(/Hello from Serial1/.test(out), 'mega_meet: "Hello from Serial1" comes back through the loopback wire'); },
  mega_bar(l, B) {
    ok(!B.rt.runCheck(), 'mega_bar: the circuit check passes: ' + JSON.stringify(B.rt.runCheck() || ''));
    const pot = B.lab.byTag('pot1'); play(B, l, l.code, 2.5, (t) => { pot.state.pos = t < 1 ? 1 : t < 1.5 ? 0.5 : 0; B.lab.stateV++; B.lab.instKey = null; });
    const p = B.lab.byTag('bar1'); ok(p.state.levels.has(10) && p.state.levels.has(5) && p.state.levels.has(0), `mega_bar: the bar shows 10, 5 and 0 LEDs (${[...p.state.levels].sort((a, b) => a - b).join(',')})`);
  },
  esp_meet(l, B) { for (const r of ['e_wroom', 'e_ant', 'e_usb', 'e_en', 'e_front', 'e_back']) B.rt.taps.add(r); const out = play(B, l, l.code, 3); ok(B.rt.toggles('L') >= 4 && /LED on/.test(out) && /POWERON_RESET/.test(out), 'esp_meet: GPIO 2 blinks (LED_BUILTIN), boot lines at 115200'); },
  esp_knob(l, B) {
    ok(!B.rt.runCheck(), 'esp_knob: the circuit check passes: ' + JSON.stringify(B.rt.runCheck() || ''));
    const pot = B.lab.byTag('pot1'); play(B, l, l.code, 2, (t) => { pot.state.pos = t < 1 ? 1 : 0; B.lab.stateV++; B.lab.instKey = null; });
    ok(B.rt.adcMax(34) > 3900 && B.rt.adcMin(34) < 150, `esp_knob: GPIO 34 reads ${B.rt.adcMin(34)}–${B.rt.adcMax(34)}`);
  },
  esp_touch(l, B) {
    ok(!B.rt.runCheck(), 'esp_touch: the circuit check passes: ' + JSON.stringify(B.rt.runCheck() || ''));
    const pad = B.lab.byTag('pad1'); play(B, l, l.code, 3, (t) => { pad.state.pressed = (t > 0.5 && t < 0.75) || (t > 1.8 && t < 2.05); });
    ok(B.rt.toggles('led1') >= 2 && !B.rt.ledLit('led1'), `esp_touch: two touches: on, then off (${B.rt.toggles('led1')} changes)`);
  },
  esp_wifi(l, B) {
    const N = netOf(B.lab); play(B, l, l.code, 4); ok(!N.staIP(), 'esp_wifi: with no password it does not join');
    const src = edit(l.code, l.steps.find((s) => s.k === 'edit').set); const got = [];
    const out = play(B, l, src, 7, (t, f) => { if (f === 200) N.request(N.staIP(), (r) => got.push(r)); if (f === 260) N.request(N.staIP() + '/on', (r) => got.push(r)); if (f === 330) N.request('http://' + N.staIP() + '/off', (r) => got.push(r)); });
    ok(/Open this on the phone: http:\/\/192\.168\.1\.\d+/.test(out), 'esp_wifi: prints its address');
    ok(got.length === 3 && /<button>ON<\/button>/.test(got[0].body) && /The lamp is <b>ON/.test(got[1].body) && /OFF/.test(got[2].body), 'esp_wifi: the page has ON / OFF buttons; /on and /off answer');
    ok(B.rt.toggles('led1') >= 2 && !B.rt.ledLit('led1'), 'esp_wifi: the phone switched the lamp on and off');
  },
  esp_iot(l, B) {
    ok(!B.rt.runCheck(), 'esp_iot: the circuit check passes: ' + JSON.stringify(B.rt.runCheck() || ''));
    const N = netOf(B.lab); const got = [];
    play(B, l, l.code, 14, (t, f) => { if (t > 4 && B.lab.env.temp !== 40) { B.lab.env.temp = 40; B.lab.stateV++; } if (f > 150 && f % 120 === 0) N.request(N.staIP() + '/', (r) => got.push(r)); });
    const last = got[got.length - 1] || {}; const pts = /points="([^"]*)"/.exec(last.body || ''); const n = pts ? pts[1].trim().split(/\s+/).length : 0;
    ok(got.length >= 5 && /(39\.[5-9]|40\.\d) &deg;C/.test(last.body) && n >= 10, `esp_iot: the page shows ${(/<h1>([^<]*)/.exec(last.body || '') || [])[1]}, and a chart of ${n} points`);
    ok(B.rt.tempSeen(37) && B.rt.tempSeen(20, 30), 'esp_iot: the Serial Monitor shows 26 °C, then 40 °C');
  },
  esp_bt(l, B) {
    const N = netOf(B.lab); play(B, l, l.code, 3, (t, f) => { if (f === 90) N.btConnect('DUET-ESP32'); if (f === 120) N.btSend('1'); if (f === 150) N.btSend('0'); });
    ok(N.bt.got >= 2 && N.bt.log.filter((x) => x.text === 'Lamp ON' || x.text === 'Lamp OFF').length === 2 && B.rt.toggles('led1') >= 2, 'esp_bt: 1 and 0 from the phone switch the lamp; the phone reads "Lamp ON", "Lamp OFF"');
  },
  esp_hall(l, B) {
    const m = B.lab.byTag('mag1'); play(B, l, l.code, 3.5, (t) => { m.state.dist = t < 1 ? 40 : 5; m.state.pole = t < 2.2 ? 'N' : 'S'; });
    const h = B.lab.mcu.hallSeen; ok(h.max > 70 && h.min < -40, `esp_hall: the Hall number goes from ${h.min} to ${h.max} with the magnet`);
  },
};
for (const l of LESSONS.filter((x) => x.batch === 4)) {
  if (only && !only.includes(l.id)) continue;
  const t0 = Date.now();
  try {
    for (const s of l.steps) for (const k of ['do', 'see']) for (const lg of ['en', 'hi', 'hg']) if (!s[k] || typeof s[k][lg] !== 'string') ok(false, `${l.id}: step ${s.k} has ${k}.${lg}`);
    ok(compile(l.code).ok && compile(l.code, BOARDS[l.board]).ok, `${l.id}: the sketch compiles (with and without its board)`);
    const B = build(l); T[l.id](l, B);
    // the lesson's own "complete" test, on the real bench
    if (B.rt.lesson.done) ok(!!B.rt.lesson.done(B.rt), `${l.id}: the lesson counts as complete`);
  } catch (e) { ok(false, `${l.id}: ${e.message}`); console.log(e.stack.split('\n').slice(0, 4).join('\n')); }
  console.log(`     ${l.id} ${((Date.now() - t0) / 1000).toFixed(1)} s`);
}
void stepsDone;
console.log(fails ? `${fails} FAILED` : 'all passed'); process.exit(fails ? 1 : 0);
