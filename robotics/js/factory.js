// DUET Robotics Lab 360: the project factory. One line of plan (a job, a sensor, an output) becomes a whole guided
// lesson: the output is already wired on the bench; the student places and wires the sensor, checks the circuit, runs the
// sketch, makes the sensor do its job on the bench (dark, hot, near, dry, gas, a press, a wave), sees the output answer,
// changes the sketch's limit (or how long it holds), and proves the change on the bench. Wrong wiring fails as it does
// for real (the circuit checks and the simulator: a reversed or missing wire, 5 V into the wrong pin, a short).
// Text in English, Hindi and Hinglish. Every lesson is checked end to end without a browser (devtools/test/robofactory.mjs).
// The jobs are common school-project ideas from around the world (see devtools/curriculum); sketches and texts are ours.
import { lcdText } from './libs3.js';

const t3 = (en, hi, hg) => ({ en, hi, hg });
const P = (tag, type, props, hole, rot) => ({ tag, type, props: props || {}, at: { hole }, rot: rot || 0 });
const F = (tag, type, props, x, z, rot) => ({ tag, type, props: props || {}, at: { x, z }, rot: rot || 0 });
const POWER = [['5V', 'H:tp30'], ['GND3', 'H:tn18'], ['H:tp2', 'H:bp2'], ['H:tn3', 'H:bn3']];
const fill = (o, f) => t3(f(o.en, 'en'), f(o.hi, 'hi'), f(o.hg, 'hg'));
const join3 = (...xs) => t3(xs.map((x) => (typeof x === 'string' ? x : x.en)).join(''), xs.map((x) => (typeof x === 'string' ? x : x.hi)).join(''), xs.map((x) => (typeof x === 'string' ? x : x.hg)).join(''));
const w = (a, b, en, hi, hg) => ({ k: 'wire', wire: [a, b], do: t3(en, hi, hg), see: t3('', '', '') });
const lastNum = (S) => (S.nums.length ? S.nums[S.nums.length - 1] : null);
const fresh = (S) => S.runSrc !== null && S.t - (S.freshAt || 0) > 0.3;
// the circuit checks' little helpers (W = the shared messages of lessons.js, passed in as K.W)
const need = (a, b, m, args) => (S) => (S.conn(a, b) ? null : [m, args]);
const has = (W, tag, name) => (S) => (S.has(tag) ? null : [W.missing, { x: name }]);
const noShort = (W) => (S) => (S.conn('5V', 'GND') ? [W.short] : null);
const XF = {
  esp5v: t3('This part is joined to VIN (5 V): its signal would push 5 V into the ESP32\'s GPIO and damage it. Power it from 3V3 (the front + rail).', 'यह पुर्ज़ा VIN (5 V) से जुड़ा है: इसका सिग्नल ESP32 के GPIO में 5 V डालेगा और उसे ख़राब कर देगा। इसे 3V3 (आगे वाली + रेल) से बिजली दीजिए।', 'Yeh part VIN (5 V) se juda hai: iska signal ESP32 ke GPIO mein 5 V daalega aur use kharaab kar dega. Ise 3V3 (aage wali + rail) se bijli dijiye.'),
  potEnds3: t3('The knob\'s two outer legs go to 3V3 and GND (the front + and − rails), and its middle leg to GPIO 34.', 'नॉब के दोनों बाहरी पैर 3V3 और GND (आगे वाली + और − रेल) पर, और बीच वाला पैर GPIO 34 पर।', 'Knob ke dono bahari pair 3V3 aur GND (aage wali + aur − rail) par, aur beech wala pair GPIO 34 par.'),
  piEcho: t3('Echo goes straight to GPIO 24: the HC-SR04 answers with 5 V, too much for the Pi. Echo must go through the divider.', 'Echo सीधे GPIO 24 पर है: HC-SR04 5 V से जवाब देता है, Pi के लिए बहुत ज़्यादा। Echo को डिवाइडर से होकर जाना चाहिए।', 'Echo seedhe GPIO 24 par hai: HC-SR04 5 V se jawab deta hai, Pi ke liye bahut zyada. Echo ko divider se hokar jaana chahiye.'),
  pico5v: t3('This part is joined to VBUS (5 V): its signal would push 5 V into the Pico\'s GPIO and damage it. Power it from the 3V3 pin.', 'यह पुर्ज़ा VBUS (5 V) से जुड़ा है: इसका सिग्नल Pico के GPIO में 5 V डालेगा और उसे ख़राब कर देगा। इसे 3V3 पिन से बिजली दीजिए।', 'Yeh part VBUS (5 V) se juda hai: iska signal Pico ke GPIO mein 5 V daalega aur use kharaab kar dega. Ise 3V3 pin se bijli dijiye.'),
  potEndsP: t3('The knob\'s two outer legs go to 3V3 and GND, and its middle leg to GP26.', 'नॉब के दोनों बाहरी पैर 3V3 और GND पर, और बीच वाला पैर GP26 पर।', 'Knob ke dono bahari pair 3V3 aur GND par, aur beech wala pair GP26 par.'),
  potEnds: t3('The knob\'s two outer legs go to 5V and GND (the + and − rails), and its middle leg to A0.', 'नॉब के दोनों बाहरी पैर 5V और GND (+ और − रेल) पर जाते हैं, और बीच वाला पैर A0 पर।', 'Knob ke dono bahari pair 5V aur GND (+ aur − rail) par jaate hain, aur beech wala pair A0 par.'),
};

// ------------------------------------------------------------------ outputs (already wired on the bench)
const OUT = {
  led: {
    name: t3('LED', 'एलईडी', 'LED'), pin: 13,
    parts: [P('led1', 'led', { color: 'red' }, 'e22', 0), P('r1', 'resistor', { ohms: 220 }, 'b22', 3)], wires: [['D13', 'H:a23']],
    ready: t3('The red LED and its 220 Ω resistor are already wired to pin 13.', 'लाल एलईडी और उसका 220 Ω रेज़िस्टर पहले से पिन 13 पर लगे हैं।', 'Laal LED aur uska 220 Ω resistor pehle se pin 13 par lage hain.'),
    onWords: t3('the LED lights up', 'एलईडी जल उठती है', 'LED jal uthti hai'),
    decl: ['const int led = 13;          // the LED (through its resistor)'], setup: ['pinMode(led, OUTPUT);'], on: ['digitalWrite(led, HIGH);'], off: ['digitalWrite(led, LOW);'],
    isOn: (S) => S.ledLit('led1'),
  },
  buzzer: {
    name: t3('buzzer', 'बज़र', 'buzzer'), pin: 8,
    parts: [P('bz1', 'buzzer', {}, 'e30', 0)], wires: [['D8', 'H:a30'], ['H:a33', 'H:tn27']],
    ready: t3('The buzzer is already wired to pin 8.', 'बज़र पहले से पिन 8 पर लगा है।', 'Buzzer pehle se pin 8 par laga hai.'),
    onWords: t3('the buzzer sounds', 'बज़र बजता है', 'buzzer bajta hai'),
    decl: ['const int buzzer = 8;       // the piezo buzzer'], setup: [], on: ['tone(buzzer, 2000);         // a 2000 Hz note'], off: ['noTone(buzzer);'],
    isOn: (S) => S.lab.sounds.some((s) => s.kind === 'tone'),
  },
  servo: {
    name: t3('servo', 'सर्वो', 'servo'), pin: 3,
    parts: [F('sv1', 'servo', {}, 20, 165, 0)], wires: [['T:sv1:GND', 'H:tn40'], ['T:sv1:VP', 'H:tp40'], ['T:sv1:SIG', 'D3']],
    ready: t3('The servo is already wired: brown to −, red to +, orange (signal) to pin 3.', 'सर्वो पहले से लगा है: भूरा − पर, लाल + पर, नारंगी (सिग्नल) पिन 3 पर।', 'Servo pehle se laga hai: brown − par, laal + par, orange (signal) pin 3 par.'),
    onWords: t3('the servo turns to 90°', 'सर्वो 90° घूम जाता है', 'servo 90° ghoom jaata hai'),
    inc: ['#include <Servo.h>'], decl: ['Servo arm;                  // the servo on pin 3'], setup: ['arm.attach(3);', 'arm.write(0);'], on: ['arm.write(90);'], off: ['arm.write(0);'],
    isOn: (S) => ((S.part('sv1') && S.part('sv1').state.angle) || 0) > 60,
  },
  relay: {
    name: t3('relay and lamp', 'रिले और बल्ब', 'relay aur bulb'), pin: 4,
    parts: [F('rl1', 'relay', {}, 30, 132, 0), F('lamp', 'load230', { kind: 'lamp' }, 22, 66, 0)],
    wires: [['T:lamp:A', 'T:rl1:COM'], ['T:lamp:B', 'T:rl1:NO'], ['T:rl1:S', 'D4'], ['T:rl1:VCC', 'H:bp20'], ['T:rl1:GND', 'H:bn20']],
    ready: t3('The relay is wired to pin 4, and an electrician has wired the 230 V lamp to its COM and NO. You work only on the safe 5 V side.', 'रिले पिन 4 पर लगा है, और इलेक्ट्रीशियन ने 230 V का बल्ब उसके COM और NO से जोड़ा है। आप सिर्फ़ सुरक्षित 5 V वाली तरफ़ काम करते हैं।', 'Relay pin 4 par laga hai, aur electrician ne 230 V ka bulb uske COM aur NO se joda hai. Aap sirf safe 5 V wali taraf kaam karte hain.'),
    onWords: t3('the relay clicks and the lamp lights', 'रिले क्लिक करता है और बल्ब जलता है', 'relay click karta hai aur bulb jalta hai'),
    decl: ['const int relay = 4;        // the relay: HIGH = lamp on'], setup: ['pinMode(relay, OUTPUT);'], on: ['digitalWrite(relay, HIGH);'], off: ['digitalWrite(relay, LOW);'],
    isOn: (S) => !!(S.part('rl1') && S.part('rl1').state.on),
  },
  lcd: {
    name: t3('LCD', 'एलसीडी', 'LCD'), pin: 'A4/A5',
    parts: [F('lcd', 'lcd16', {}, -128, 66, 0)], wires: [['T:lcd:GND', 'H:bn10'], ['T:lcd:VCC', 'H:bp10'], ['T:lcd:SDA', 'A4'], ['T:lcd:SCL', 'A5']],
    ready: t3('The 16×2 LCD is already wired: SDA to A4, SCL to A5 (I2C).', '16×2 एलसीडी पहले से लगी है: SDA, A4 पर और SCL, A5 पर (I2C)।', '16×2 LCD pehle se lagi hai: SDA A4 par aur SCL A5 par (I2C).'),
    onWords: t3('the LCD shows the warning', 'एलसीडी पर चेतावनी आती है', 'LCD par warning aati hai'),
    inc: ['#include <Wire.h>', '#include <LiquidCrystal_I2C.h>'], decl: ['LiquidCrystal_I2C lcd(0x27, 16, 2);'], setup: ['lcd.init();', 'lcd.backlight();'],
    on: (j) => ['lcd.setCursor(0, 1);', `lcd.print("${pad(j.on)}");`], off: (j) => ['lcd.setCursor(0, 1);', `lcd.print("${pad(j.off)}");`],
    isOn: (S, j) => { const p = S.part('lcd'); return !!p && lcdText(p)[1].startsWith(j.on); },
  },
};
OUT.rgb = {
  name: t3('colour LED', 'रंगीन एलईडी', 'colour LED'), pin: '9/10/11', clash: ['sonar'],
  parts: [P('rr', 'resistor', { ohms: 220 }, 'd30', 1), P('rg', 'resistor', { ohms: 220 }, 'd32', 1), P('rb', 'resistor', { ohms: 220 }, 'd33', 1), P('rgb1', 'rgb', {}, 'e30', 0)],
  wires: [['D9', 'H:j30'], ['D10', 'H:j32'], ['D11', 'H:j33'], ['H:a31', 'H:tn25']],
  ready: t3('The RGB LED is already wired: red to pin 9, green to 10, blue to 11, each through 220 Ω. Green means all is well.', 'RGB एलईडी पहले से लगी है: लाल पिन 9, हरा 10, नीला 11 पर, हर एक 220 Ω से होकर। हरा मतलब सब ठीक।', 'RGB LED pehle se lagi hai: laal pin 9, hara 10, neela 11 par, har ek 220 Ω se hokar. Hara matlab sab theek.'),
  onWords: t3('the light turns from green to red', 'रोशनी हरी से लाल हो जाती है', 'roshni hari se laal ho jaati hai'),
  decl: ['const int red = 9;     // the RGB LED\'s three colours', 'const int green = 10;', 'const int blue = 11;'], setup: ['pinMode(red, OUTPUT);', 'pinMode(green, OUTPUT);', 'pinMode(blue, OUTPUT);'],
  on: ['digitalWrite(red, HIGH);    // red: warning', 'digitalWrite(green, LOW);'], off: ['digitalWrite(red, LOW);', 'digitalWrite(green, HIGH);  // green: all well'],
  isOn: (S) => { const p = S.part('rgb1'); const c = (p && p.state.ch) || {}; return (c.R || 0) > 0.002 && (c.G || 0) < 0.002; },
};
OUT.pump = {
  name: t3('water pump', 'पानी का पंप', 'paani ka pump'), pin: 4,
  parts: [F('bat', 'aa4', {}, -40, 150, 0), F('pump', 'pump', { mount: 'tank' }, 182, 140, 1), F('rl1', 'relay', {}, 60, 118, 0)],
  wires: [['T:pump:N', 'T:bat:N'], ['T:bat:P', 'T:rl1:COM'], ['T:rl1:NO', 'T:pump:P'], ['T:rl1:S', 'D4'], ['T:rl1:VCC', 'H:bp20'], ['T:rl1:GND', 'H:bn20']],
  ready: t3('The pump is already wired with its own 6 V battery through a relay on pin 4: a pump needs about 200 mA, far more than a pin can give.', 'पंप पहले से अपनी 6 V बैटरी और पिन 4 के रिले से जुड़ा है: पंप को लगभग 200 mA चाहिए, पिन जितना दे सकता है उससे कहीं ज़्यादा।', 'Pump pehle se apni 6 V battery aur pin 4 ke relay se juda hai: pump ko lagbhag 200 mA chahiye, pin jitna de sakta hai usse kahin zyada.'),
  onWords: t3('the relay clicks and the pump pours water', 'रिले क्लिक करता है और पंप पानी डालता है', 'relay click karta hai aur pump paani daalta hai'),
  decl: ['const int relay = 4;        // the pump\'s relay: HIGH = pump on'], setup: ['pinMode(relay, OUTPUT);'], on: ['digitalWrite(relay, HIGH);'], off: ['digitalWrite(relay, LOW);'],
  isOn: (S) => ((S.part('pump') && S.part('pump').state.flow) || 0) > 5,
};
const pad = (s) => (s + ' '.repeat(16)).slice(0, 16);
// (batch 12) the 0.96" OLED: every job that warns on the LCD can also warn on it, in big letters
const oledLines = (title, msg) => ['oled.clearDisplay();', 'oled.setTextSize(1);', 'oled.setCursor(0, 0);', `oled.println("${title.slice(0, 21)}");`, 'oled.setTextSize(2);           // big letters: 10 to a line', 'oled.setCursor(0, 24);', `oled.println("${msg}");`, 'oled.display();               // send the picture to the screen'];
OUT.oled = {
  name: t3('OLED screen', 'ओएलईडी स्क्रीन', 'OLED screen'), pin: 'A4/A5',
  parts: [P('oled', 'oled', {}, 'e20', 0)], wires: [['H:a20', 'H:tn20'], ['H:a21', 'H:tp21'], ['H:a22', 'A5'], ['H:a23', 'A4']],
  ready: t3('The OLED screen (128 × 64 dots) is already wired: GND, VCC (5 V), SCL to A5, SDA to A4. It is on the I2C bus at address 0x3C.', 'ओएलईडी स्क्रीन (128 × 64 बिंदु) पहले से लगी है: GND, VCC (5 V), SCL, A5 पर, SDA, A4 पर। यह I2C पर 0x3C पते पर है।', 'OLED screen (128 × 64 dots) pehle se lagi hai: GND, VCC (5 V), SCL A5 par, SDA A4 par. Yeh I2C par 0x3C address par hai.'),
  onWords: t3('the OLED shows the warning in big letters', 'ओएलईडी पर बड़े अक्षरों में चेतावनी आती है', 'OLED par bade aksharon mein warning aati hai'),
  inc: ['#include <Wire.h>', '#include <Adafruit_GFX.h>', '#include <Adafruit_SSD1306.h>'], decl: ['Adafruit_SSD1306 oled(128, 64, &Wire, -1);   // the OLED (no reset pin)'],
  setup: ['oled.begin(SSD1306_SWITCHCAPVCC, 0x3C);', 'oled.setTextColor(SSD1306_WHITE);'],
  on: (j) => oledLines(j.title.en, j.on), off: (j) => oledLines(j.title.en, j.off),
  isOn: (S, j) => { const p = S.part('oled'); return !!p && !!p.state.on && String(p.state.text || '').includes(j.on); },
};

// ------------------------------------------------------------------ sensors (the student places and wires them)
// analog: the sketch compares a reading with `limit`; the edit makes it more sensitive (l0 -> l1) and the student proves
// it with a reading between the two ("edge"). digital: the output stays on for `hold` ms after the sensor stops; the edit
// makes that 1000 -> 3000 ms.  set(B, k): what the student does on the bench (k = 'on' | 'off' | 'edge'), for the tests.
const bump = (lab) => { lab.stateV++; lab.instKey = null; };
const IN = {
  button: {
    name: t3('push button', 'पुश बटन', 'push button'), tag: 'b1', drawer: ['button'], view: 'bb', lvl: 0, digital: true,
    place: P('b1', 'button', {}, 'e40', 0), placeDo: t3('Push the button into 40e–42e, across the middle gap.', 'बटन को 40e–42e में, बीच की खाली जगह के आर-पार लगाइए।', 'Button ko 40e–42e mein, beech ki khaali jagah ke aar-paar lagaiye.'),
    wires: [w('D2', 'b1.L1', 'Wire pin 2 to its top-left leg.', 'पिन 2 को इसके ऊपर-बाएँ पैर से जोड़िए।', 'Pin 2 ko iske upar-left pair se jodiye.'), w('b1.L3', 'rail:tn', 'Wire its top-right leg to the − rail.', 'इसके ऊपर-दाएँ पैर को − रेल से जोड़िए।', 'Iske upar-right pair ko − rail se jodiye.')],
    checks: (K) => [has(K.W, 'b1', t3('button', 'बटन', 'button')), need('b1.L1', 'D2', K.W.toPin, { x: t3('The button', 'बटन', 'Button'), p: 2 }), (S) => (S.conn('b1.L3', 'GND') || S.conn('b1.L4', 'GND') ? null : [K.W.toGnd, { x: t3('The button\'s other leg', 'बटन का दूसरा पैर', 'Button ka doosra pair') }])],
    decl: ['const int button = 2;       // to GND when pressed (INPUT_PULLUP)'], setup: ['pinMode(button, INPUT_PULLUP);'], trig: 'digitalRead(button) == LOW',
    when: t3('someone presses the button', 'कोई बटन दबाता है', 'koi button dabata hai'),
    onDo: t3('Press and hold the button (tap it).', 'बटन दबाकर रखिए (उसे छूइए)।', 'Button dabaakar rakhiye (use touch karo).'), offDo: t3('Let go of the button and wait a moment.', 'बटन छोड़िए और एक पल रुकिए।', 'Button chhodiye aur ek pal rukiye.'),
    againDo: t3('Press the button once, let go, and count the seconds.', 'बटन एक बार दबाइए, छोड़िए, और सेकंड गिनिए।', 'Button ek baar dabaiye, chhodiye, aur second giniye.'),
    active: (S) => !!(S.part('b1') && S.part('b1').state.pressed),
    set: (B, k) => { const p = B.lab.byTag('b1'); const on = k === 'on'; if (p && !!p.state.pressed !== on) { p.state.pressed = on; B.lab.rebuild(); } },
  },
  pir: {
    name: t3('PIR motion sensor', 'पीआईआर मोशन सेंसर', 'PIR motion sensor'), tag: 'pir', drawer: ['pir'], view: 'wide', lvl: 2, digital: true,
    place: F('pir', 'pir', {}, 176, 78, 1), placeDo: t3('Put the PIR sensor on the mat at the ghost, its white dome looking into the room.', 'पीआईआर सेंसर को मैट पर नीली आकृति पर रखिए, सफ़ेद गुंबद कमरे की तरफ़।', 'PIR sensor ko mat par neeli shape par rakhiye, safed dome room ki taraf.'),
    wires: [w('pir.VCC', 'rail:bp', 'Wire its VCC to the front + rail.', 'इसका VCC आगे वाली + रेल से जोड़िए।', 'Iska VCC aage wali + rail se jodiye.'), w('pir.GND', 'rail:bn', 'Its GND to the front − rail.', 'इसका GND आगे वाली − रेल से।', 'Iska GND aage wali − rail se.'), w('pir.OUT', 'D2', 'Its OUT (the middle pin) to pin 2.', 'इसका OUT (बीच वाला पिन) पिन 2 से।', 'Iska OUT (beech wala pin) pin 2 se.')],
    checks: (K) => [has(K.W, 'pir', t3('PIR sensor', 'पीआईआर सेंसर', 'PIR sensor')), need('pir.VCC', '5V', K.W.to5v, { x: 'VCC' }), need('pir.GND', 'GND', K.W.toGnd, { x: 'GND' }), need('pir.OUT', 'D2', K.W.toPin, { x: 'PIR OUT', p: 2 })],
    decl: ['const int pir = 2;          // HIGH while it sees movement'], setup: ['pinMode(pir, INPUT);'], trig: 'digitalRead(pir) == HIGH',
    when: t3('someone moves in front of the sensor', 'सेंसर के सामने कोई हिलता है', 'sensor ke saamne koi hilta hai'),
    onDo: t3('Tap the PIR sensor and press ✋ Wave.', 'पीआईआर सेंसर को छूइए और ✋ हाथ हिलाइए दबाइए।', 'PIR sensor ko touch karo aur ✋ Wave dabaiye.'), offDo: t3('Now keep still and wait: no one moves.', 'अब स्थिर रहिए और रुकिए: कोई नहीं हिलता।', 'Ab sthir rahiye aur rukiye: koi nahi hilta.'),
    againDo: t3('Wait 3 seconds (after each alarm a PIR rests and ignores movement), then wave once, keep still and count the seconds.', '3 सेकंड रुकिए (हर अलार्म के बाद पीआईआर आराम करता है और हलचल नहीं देखता), फिर एक बार हाथ हिलाइए, स्थिर रहिए और सेकंड गिनिए।', '3 second rukiye (har alarm ke baad PIR aaram karta hai aur halchal nahi dekhta), phir ek baar haath hilaiye, sthir rahiye aur second giniye.'),
    active: (S) => !!(S.part('pir') && S.part('pir').state.out), ready: (S) => ((S.part('pir') && S.part('pir').state.age) || 0) > 3,
    set: (B, k) => { const p = B.lab.byTag('pir'); if (p && p.state.motion !== (k === 'on')) { p.state.motion = k === 'on'; bump(B.lab); } },
  },
  ir: {
    name: t3('IR obstacle sensor', 'आईआर बाधा सेंसर', 'IR obstacle sensor'), tag: 'ir1', drawer: ['ir'], view: 'wide', lvl: 1, digital: true,
    place: F('ir1', 'ir', {}, 110, 85, 2), placeDo: t3('Put the IR sensor on the mat at the ghost.', 'आईआर सेंसर को मैट पर नीली आकृति पर रखिए।', 'IR sensor ko mat par neeli shape par rakhiye.'),
    wires: [w('ir1.VCC', 'rail:tp', 'Wire its VCC pin to the + rail.', 'इसके VCC पिन को + रेल से जोड़िए।', 'Iske VCC pin ko + rail se jodiye.'), w('ir1.GND', 'rail:tn', 'Its GND pin to the − rail.', 'इसका GND पिन − रेल से।', 'Iska GND pin − rail se.'), w('ir1.OUT', 'D7', 'Its OUT pin to pin 7.', 'इसका OUT पिन, पिन 7 से।', 'Iska OUT pin, pin 7 se.')],
    checks: (K) => [has(K.W, 'ir1', t3('IR sensor', 'आईआर सेंसर', 'IR sensor')), need('ir1.VCC', '5V', K.W.to5v, { x: 'VCC' }), need('ir1.GND', 'GND', K.W.toGnd, { x: 'GND' }), need('ir1.OUT', 'D7', K.W.toPin, { x: 'OUT', p: 7 })],
    decl: ['const int ir = 7;           // LOW when something is near'], setup: ['pinMode(ir, INPUT);'], trig: 'digitalRead(ir) == LOW',
    when: t3('something comes close to the IR sensor', 'कोई चीज़ आईआर सेंसर के पास आती है', 'koi cheez IR sensor ke paas aati hai'),
    onDo: t3('Tap the IR sensor and slide the block close (under 10 cm).', 'आईआर सेंसर को छूइए और ब्लॉक को पास लाइए (10 cm से कम)।', 'IR sensor ko touch karo aur block ko paas laiye (10 cm se kam).'), offDo: t3('Move the block far away (over 20 cm) and wait.', 'ब्लॉक को दूर ले जाइए (20 cm से ज़्यादा) और रुकिए।', 'Block ko door le jaiye (20 cm se zyada) aur rukiye.'),
    againDo: t3('Bring the block close once, move it away, and count the seconds.', 'ब्लॉक को एक बार पास लाइए, दूर ले जाइए, और सेकंड गिनिए।', 'Block ko ek baar paas laiye, door le jaiye, aur second giniye.'),
    active: (S) => !!(S.part('ir1') && S.part('ir1').state.near),
    set: (B, k) => { const p = B.lab.byTag('ir1'); const d = k === 'on' ? 5 : 30; if (p && p.state.dist !== d) { p.state.dist = d; bump(B.lab); } },
  },
  pot: {
    name: t3('knob (potentiometer)', 'नॉब (पोटेंशियोमीटर)', 'knob (potentiometer)'), tag: 'pot1', drawer: ['pot'], view: 'bb', lvl: 0, analog: true,
    place: P('pot1', 'pot', {}, 'e45', 0), placeDo: t3('Put the knob into 45e–47e.', 'नॉब को 45e–47e में लगाइए।', 'Knob ko 45e–47e mein lagaiye.'),
    wires: [w('pot1.1', 'rail:tn', 'Wire its left leg (column 45) to the − rail.', 'इसके बाएँ पैर (कॉलम 45) को − रेल से जोड़िए।', 'Iske left pair (column 45) ko − rail se jodiye.'), w('pot1.3', 'rail:tp', 'Its right leg (column 47) to the + rail.', 'इसका दायाँ पैर (कॉलम 47) + रेल से।', 'Iska right pair (column 47) + rail se.'), w('A0', 'pot1.W', 'Its middle leg (the wiper) to A0.', 'इसका बीच वाला पैर (वाइपर) A0 से।', 'Iska beech wala pair (wiper) A0 se.')],
    checks: (K) => [has(K.W, 'pot1', t3('knob', 'नॉब', 'knob')), need('pot1.W', 'A0', K.W.join, { a: t3('The knob\'s middle leg', 'नॉब का बीच वाला पैर', 'Knob ka beech wala pair'), b: 'A0' }), (S) => ((S.conn('pot1.1', 'GND') && S.conn('pot1.3', '5V')) || (S.conn('pot1.3', 'GND') && S.conn('pot1.1', '5V')) ? null : [XF.potEnds])],
    decl: [], setup: [], read: 'int knob = analogRead(A0);  // 0 (left) to 1023 (right)', v: 'knob', label: 'Knob', cond: 'knob > limit', l0: 500, l1: 300,
    note: 'turned further than this: on',
    when: t3('the knob is turned past the limit', 'नॉब सीमा से आगे घुमाया जाता है', 'knob limit se aage ghumaya jaata hai'),
    onDo: t3('Tap the knob and turn it more than halfway (above 500).', 'नॉब को छूइए और आधे से ज़्यादा घुमाइए (500 से ऊपर)।', 'Knob ko touch karo aur aadhe se zyada ghumaiye (500 se upar).'), offDo: t3('Turn it back, well below halfway.', 'इसे वापस आधे से काफ़ी नीचे घुमाइए।', 'Ise wapas aadhe se kaafi neeche ghumaiye.'),
    edgeDo: t3('Now turn it to about 40 % (around 400).', 'अब इसे लगभग 40 % (करीब 400) पर लाइए।', 'Ab ise lagbhag 40 % (kareeb 400) par laiye.'),
    set: (B, k) => { const p = B.lab.byTag('pot1'); const v = { on: 0.85, off: 0.1, edge: 0.4 }[k]; if (p && p.state.pos !== v) { p.state.pos = v; bump(B.lab); } },
  },
  ldr: {
    name: t3('light sensor (LDR)', 'रोशनी सेंसर (एलडीआर)', 'light sensor (LDR)'), tag: 'ldr1', drawer: ['ldr', 'resistor'], view: 'bb', lvl: 0, analog: true,
    place: P('ldr1', 'ldr', {}, 'e40', 0), placeDo: t3('Put the LDR into 40e–41e.', 'एलडीआर को 40e–41e में लगाइए।', 'LDR ko 40e–41e mein lagaiye.'),
    place2: P('r10', 'resistor', { ohms: 10000 }, 'b42', 3), place2Do: t3('Put the 10 kΩ resistor from 42b down to the − rail.', '10 kΩ रेज़िस्टर को 42b से नीचे − रेल तक लगाइए।', '10 kΩ resistor ko 42b se neeche − rail tak lagaiye.'),
    wires: [w('ldr1.1', 'rail:tp', 'Wire the LDR\'s left leg to the + rail.', 'एलडीआर के बाएँ पैर को + रेल से जोड़िए।', 'LDR ke left pair ko + rail se jodiye.'), w('A0', 'ldr1.2', 'Wire A0 to its right leg (it meets the resistor there).', 'A0 को इसके दाएँ पैर से जोड़िए (वहीं रेज़िस्टर मिलता है)।', 'A0 ko iske right pair se jodiye (wahin resistor milta hai).')],
    checks: (K) => [has(K.W, 'ldr1', t3('LDR', 'एलडीआर', 'LDR')), need('ldr1.2', 'A0', K.W.join, { a: t3('The LDR\'s right leg', 'एलडीआर का दायाँ पैर', 'LDR ka right pair'), b: 'A0' }), need('ldr1.1', '5V', K.W.to5v, { x: 'LDR' })],
    decl: [], setup: [], read: 'int light = analogRead(A0);  // bright: high, dark: low', v: 'light', label: 'Light', cond: 'light < limit', l0: 300, l1: 500,
    note: 'darker than this: on',
    when: t3('it gets dark', 'अँधेरा होता है', 'andhera hota hai'),
    onDo: t3('Slide the Room light down: make it dark.', '"कमरे की रोशनी" स्लाइडर नीचे कीजिए: अँधेरा कीजिए।', '"Room light" slider neeche kijiye: andhera kijiye.'), offDo: t3('Make the room bright again.', 'कमरे में फिर से रोशनी कीजिए।', 'Room mein phir se roshni kijiye.'),
    edgeDo: t3('Now make it dim, not dark (about 45 %).', 'अब हल्की रोशनी कीजिए, अँधेरा नहीं (लगभग 45 %)।', 'Ab halki roshni kijiye, andhera nahi (lagbhag 45 %).'),
    set: (B, k) => { const v = { on: 0.08, off: 0.85, edge: 0.45 }[k]; if (B.lab.env.light !== v) { B.lab.env.light = v; bump(B.lab); } },
  },
  lm35: {
    name: t3('temperature sensor LM35', 'तापमान सेंसर LM35', 'temperature sensor LM35'), tag: 't1', drawer: ['lm35'], view: 'bb', lvl: 1, analog: true,
    place: P('t1', 'lm35', {}, 'e45', 0), placeDo: t3('Put the LM35 into 45e–47e, flat side facing you.', 'LM35 को 45e–47e में लगाइए, चपटी तरफ़ आपकी ओर।', 'LM35 ko 45e–47e mein lagaiye, flat side aapki taraf.'),
    wires: [w('t1.VS', 'rail:tp', 'Wire its left leg (+Vs) to the + rail.', 'इसके बाएँ पैर (+Vs) को + रेल से जोड़िए।', 'Iske left pair (+Vs) ko + rail se jodiye.'), w('t1.OUT', 'A0', 'Its middle leg (OUT) to A0.', 'इसका बीच वाला पैर (OUT) A0 से।', 'Iska beech wala pair (OUT) A0 se.'), w('t1.GND', 'rail:tn', 'Its right leg (GND) to the − rail.', 'इसका दायाँ पैर (GND) − रेल से।', 'Iska right pair (GND) − rail se.')],
    checks: (K) => [has(K.W, 't1', t3('LM35 sensor', 'LM35 सेंसर', 'LM35 sensor')), need('t1.VS', '5V', K.W.to5v, { x: '+Vs' }), need('t1.OUT', 'A0', K.W.join, { a: 'OUT', b: 'A0' }), need('t1.GND', 'GND', K.W.toGnd, { x: 'GND' })],
    decl: [], setup: [], read: 'int temp = analogRead(A0) * 500L / 1023;  // °C (10 mV per degree)', v: 'temp', label: 'Temp C', cond: 'temp > limit', l0: 35, l1: 30,
    note: 'hotter than this (°C): on',
    when: t3('it gets too hot', 'बहुत गर्मी होती है', 'bahut garmi hoti hai'),
    onDo: t3('Tap the sensor and warm it to 40 °C.', 'सेंसर को छूइए और उसे 40 °C तक गर्म कीजिए।', 'Sensor ko touch karo aur use 40 °C tak garam kijiye.'), offDo: t3('Cool it back to 25 °C.', 'उसे वापस 25 °C तक ठंडा कीजिए।', 'Use wapas 25 °C tak thanda kijiye.'),
    edgeDo: t3('Now warm it only to 32 °C.', 'अब उसे सिर्फ़ 32 °C तक गर्म कीजिए।', 'Ab use sirf 32 °C tak garam kijiye.'),
    set: (B, k) => { const v = { on: 40, off: 25, edge: 32 }[k]; if (B.lab.env.temp !== v) { B.lab.env.temp = v; bump(B.lab); } },
  },
  sonar: {
    name: t3('ultrasonic sensor', 'अल्ट्रासोनिक सेंसर', 'ultrasonic sensor'), tag: 'us1', drawer: ['hcsr04'], view: 'wide', lvl: 1, analog: true,
    place: P('us1', 'hcsr04', {}, 'j50', 0), placeDo: t3('Plug the ultrasonic sensor into 50j–53j, its "eyes" facing you.', 'अल्ट्रासोनिक सेंसर को 50j–53j में लगाइए, इसकी "आँखें" आपकी तरफ़।', 'Ultrasonic sensor ko 50j–53j mein lagaiye, iski "aankhen" aapki taraf.'),
    wires: [w('us1.VCC', 'rail:tp', 'Wire VCC (column 50) to the + rail.', 'VCC (कॉलम 50) को + रेल से जोड़िए।', 'VCC (column 50) ko + rail se jodiye.'), w('us1.TRIG', 'D9', 'Trig (column 51) to pin 9.', 'Trig (कॉलम 51) को पिन 9 से।', 'Trig (column 51) ko pin 9 se.'), w('us1.ECHO', 'D10', 'Echo (column 52) to pin 10.', 'Echo (कॉलम 52) को पिन 10 से।', 'Echo (column 52) ko pin 10 se.'), w('us1.GND', 'rail:tn', 'GND (column 53) to the − rail.', 'GND (कॉलम 53) को − रेल से।', 'GND (column 53) ko − rail se.')],
    checks: (K) => [has(K.W, 'us1', t3('ultrasonic sensor', 'अल्ट्रासोनिक सेंसर', 'ultrasonic sensor')), need('us1.VCC', '5V', K.W.to5v, { x: 'VCC' }), need('us1.GND', 'GND', K.W.toGnd, { x: 'GND' }), need('us1.TRIG', 'D9', K.W.toPin, { x: 'Trig', p: 9 }), need('us1.ECHO', 'D10', K.W.toPin, { x: 'Echo', p: 10 })],
    decl: ['const int trig = 9, echo = 10;'], setup: ['pinMode(trig, OUTPUT);', 'pinMode(echo, INPUT);'],
    readLines: ['digitalWrite(trig, LOW);', 'delayMicroseconds(2);', 'digitalWrite(trig, HIGH);     // a 10 µs ping', 'delayMicroseconds(10);', 'digitalWrite(trig, LOW);', 'long us = pulseIn(echo, HIGH);  // how long the echo took', 'int cm = us / 58;              // sound: 58 µs per cm, there and back'],
    v: 'cm', label: 'Distance cm', cond: 'cm > 0 && cm < limit', l0: 20, l1: 40, note: 'closer than this (cm): on',
    when: t3('something comes closer than the limit', 'कोई चीज़ सीमा से ज़्यादा पास आती है', 'koi cheez limit se zyada paas aati hai'),
    onDo: t3('Tap the sensor and slide the block closer than 15 cm.', 'सेंसर को छूइए और ब्लॉक को 15 cm से पास लाइए।', 'Sensor ko touch karo aur block ko 15 cm se paas laiye.'), offDo: t3('Move the block far away (over 60 cm).', 'ब्लॉक को दूर ले जाइए (60 cm से ज़्यादा)।', 'Block ko door le jaiye (60 cm se zyada).'),
    edgeDo: t3('Now put the block at 30 cm.', 'अब ब्लॉक को 30 cm पर रखिए।', 'Ab block ko 30 cm par rakhiye.'),
    set: (B, k) => { const p = B.lab.byTag('us1'); const d = { on: 10, off: 80, edge: 30 }[k]; if (p && p.state.dist !== d) { p.state.dist = d; bump(B.lab); } },
  },
  soil: {
    name: t3('soil moisture sensor', 'मिट्टी नमी सेंसर', 'soil moisture sensor'), tag: 'soil', drawer: ['soil'], view: 'wide', lvl: 2, analog: true,
    place: F('soil', 'soil', {}, 150, 92, 0), placeDo: t3('Put the soil sensor on the mat at the ghost, its probe in the pot.', 'मिट्टी सेंसर को मैट पर नीली आकृति पर रखिए, उसका प्रोब गमले में।', 'Soil sensor ko mat par neeli shape par rakhiye, uska probe gamle mein.'),
    wires: [w('soil.VCC', 'rail:bp', 'Wire its VCC to the front + rail.', 'इसका VCC आगे वाली + रेल से जोड़िए।', 'Iska VCC aage wali + rail se jodiye.'), w('soil.GND', 'rail:bn', 'Its GND to the front − rail.', 'इसका GND आगे वाली − रेल से।', 'Iska GND aage wali − rail se.'), w('soil.AO', 'A0', 'Its AO (analog out) to A0.', 'इसका AO (एनालॉग आउट) A0 से।', 'Iska AO (analog out) A0 se.')],
    checks: (K) => [has(K.W, 'soil', t3('soil sensor', 'मिट्टी सेंसर', 'soil sensor')), need('soil.VCC', '5V', K.W.to5v, { x: 'VCC' }), need('soil.GND', 'GND', K.W.toGnd, { x: 'GND' }), need('soil.AO', 'A0', K.W.join, { a: 'AO', b: 'A0' })],
    decl: [], setup: [], read: 'int soil = analogRead(A0);   // dry soil: big number, wet soil: small', v: 'soil', label: 'Soil', cond: 'soil > limit', l0: 600, l1: 450, note: 'drier than this: on',
    when: t3('the soil gets dry', 'मिट्टी सूख जाती है', 'mitti sookh jaati hai'),
    onDo: t3('Tap the soil sensor and dry the soil (moisture 10 %).', 'मिट्टी सेंसर को छूइए और मिट्टी सुखाइए (नमी 10 %)।', 'Soil sensor ko touch karo aur mitti sukhaiye (nami 10 %).'), offDo: t3('Water it: moisture 80 %.', 'पानी दीजिए: नमी 80 %।', 'Paani dijiye: nami 80 %.'),
    edgeDo: t3('Now set the moisture to 60 %: only a little dry.', 'अब नमी 60 % कीजिए: बस थोड़ी सूखी।', 'Ab nami 60 % kijiye: bas thodi sookhi.'),
    set: (B, k) => { const p = B.lab.byTag('soil'); const v = { on: 0.1, off: 0.85, edge: 0.6 }[k]; if (p && p.state.moist !== v) { p.state.moist = v; bump(B.lab); } },
  },
  gas: {
    name: t3('gas sensor MQ-2', 'गैस सेंसर MQ-2', 'gas sensor MQ-2'), tag: 'mq', drawer: ['mq2'], view: 'wide', lvl: 2, analog: true, warm: true,
    place: F('mq', 'mq2', {}, 160, 92, 0), placeDo: t3('Put the gas sensor on the mat at the ghost.', 'गैस सेंसर को मैट पर नीली आकृति पर रखिए।', 'Gas sensor ko mat par neeli shape par rakhiye.'),
    wires: [w('mq.VCC', 'rail:bp', 'Wire its VCC to the front + rail.', 'इसका VCC आगे वाली + रेल से जोड़िए।', 'Iska VCC aage wali + rail se jodiye.'), w('mq.GND', 'rail:bn', 'Its GND to the front − rail.', 'इसका GND आगे वाली − रेल से।', 'Iska GND aage wali − rail se.'), w('mq.AO', 'A0', 'Its AO to A0.', 'इसका AO, A0 से।', 'Iska AO, A0 se.')],
    checks: (K) => [has(K.W, 'mq', t3('gas sensor', 'गैस सेंसर', 'gas sensor')), need('mq.VCC', '5V', K.W.to5v, { x: 'VCC' }), need('mq.GND', 'GND', K.W.toGnd, { x: 'GND' }), need('mq.AO', 'A0', K.W.join, { a: 'AO', b: 'A0' })],
    decl: [], setup: [], read: 'int gas = analogRead(A0);    // clean air: small, gas: big', v: 'gas', label: 'Gas', cond: 'gas > limit', l0: 400, l1: 250, note: 'more gas than this: on',
    when: t3('gas leaks into the air', 'हवा में गैस लीक होती है', 'hawa mein gas leak hoti hai'),
    onDo: t3('Wait for the sensor to warm up, then tap it and let gas leak: 2000 ppm.', 'सेंसर गर्म होने दीजिए, फिर उसे छूइए और गैस लीक कीजिए: 2000 ppm।', 'Sensor garam hone dijiye, phir use touch karo aur gas leak kijiye: 2000 ppm.'), offDo: t3('Clear the air: 5 ppm.', 'हवा साफ़ कीजिए: 5 ppm।', 'Hawa saaf kijiye: 5 ppm.'),
    edgeDo: t3('Now a small leak: about 400 ppm.', 'अब एक छोटा लीक: लगभग 400 ppm।', 'Ab ek chhota leak: lagbhag 400 ppm.'),
    set: (B, k) => { const p = B.lab.byTag('mq'); const v = { on: 2000, off: 5, edge: 400 }[k]; if (p && p.state.ppm !== v) { p.state.ppm = v; bump(B.lab); } },
  },
};

const DHT_BASE = {
  tag: 'dht', drawer: ['dht11'], view: 'wide', lvl: 2, analog: true, delay: 500,
  place: P('dht', 'dht11', {}, 'j40', 0), placeDo: t3('Plug the DHT11 into 40j–42j, its grille facing you.', 'DHT11 को 40j–42j में लगाइए, जाली आपकी तरफ़।', 'DHT11 ko 40j–42j mein lagaiye, jaali aapki taraf.'),
  wires: [w('dht.VCC', 'rail:bp', 'Its middle pin (+) to the front + rail.', 'इसका बीच वाला पिन (+) आगे वाली + रेल से।', 'Iska beech wala pin (+) aage wali + rail se.'), w('dht.GND', 'rail:bn', 'Its right pin (−) to the front − rail.', 'इसका दायाँ पिन (−) आगे वाली − रेल से।', 'Iska right pin (−) aage wali − rail se.'), w('dht.DATA', 'D2', 'Its left pin (DATA) to pin 2.', 'इसका बायाँ पिन (DATA) पिन 2 से।', 'Iska left pin (DATA) pin 2 se.')],
  checks: (K) => [has(K.W, 'dht', t3('DHT11', 'DHT11', 'DHT11')), need('dht.VCC', '5V', K.W.to5v, { x: 'DHT11 +' }), need('dht.GND', 'GND', K.W.toGnd, { x: 'DHT11 −' }), need('dht.DATA', 'D2', K.W.toPin, { x: 'DATA', p: 2 })],
  inc: ['#include <DHT.h>'], decl: ['DHT dht(2, DHT11);          // the DHT11\'s DATA on pin 2'], setup: ['dht.begin();'],
};
IN.dht = Object.assign({}, DHT_BASE, {
  name: t3('DHT11 sensor (temperature)', 'DHT11 सेंसर (तापमान)', 'DHT11 sensor (temperature)'),
  read: 'int temp = dht.readTemperature();   // °C (it answers every 2 s)', v: 'temp', label: 'Temp C', cond: 'temp > limit', l0: 35, l1: 30, note: 'hotter than this (°C): on',
  when: t3('the air gets too hot', 'हवा बहुत गर्म हो जाती है', 'hawa bahut garam ho jaati hai'),
  onDo: t3('Tap the DHT11 and warm the air to 40 °C.', 'DHT11 को छूइए और हवा 40 °C तक गर्म कीजिए।', 'DHT11 ko touch karo aur hawa 40 °C tak garam kijiye.'), offDo: t3('Cool the air to 25 °C (the DHT11 follows in a few seconds).', 'हवा को 25 °C तक ठंडा कीजिए (DHT11 कुछ सेकंड में साथ आता है)।', 'Hawa ko 25 °C tak thanda kijiye (DHT11 kuch second mein saath aata hai).'),
  edgeDo: t3('Now warm it only to 32 °C.', 'अब हवा सिर्फ़ 32 °C तक गर्म कीजिए।', 'Ab hawa sirf 32 °C tak garam kijiye.'),
  set: (B, k) => { const v = { on: 40, off: 25, edge: 32 }[k]; if (B.lab.env.temp !== v) { B.lab.env.temp = v; bump(B.lab); } },
});
IN.hum = Object.assign({}, DHT_BASE, {
  name: t3('DHT11 sensor (humidity)', 'DHT11 सेंसर (नमी)', 'DHT11 sensor (humidity)'),
  read: 'int hum = dht.readHumidity();      // % of water in the air', v: 'hum', label: 'Humidity %', cond: 'hum > limit', l0: 75, l1: 60, note: 'more humid than this (%): on',
  when: t3('the air gets too humid', 'हवा में बहुत नमी हो जाती है', 'hawa mein bahut nami ho jaati hai'),
  onDo: t3('Tap the DHT11 and raise the humidity to 90 %.', 'DHT11 को छूइए और नमी 90 % कीजिए।', 'DHT11 ko touch karo aur nami 90 % kijiye.'), offDo: t3('Dry the air to 45 % (the DHT11 follows in a few seconds).', 'हवा सुखाकर 45 % कीजिए (DHT11 कुछ सेकंड में साथ आता है)।', 'Hawa sukhaakar 45 % kijiye (DHT11 kuch second mein saath aata hai).'),
  edgeDo: t3('Now set the humidity to 68 %.', 'अब नमी 68 % कीजिए।', 'Ab nami 68 % kijiye.'),
  set: (B, k) => { const v = { on: 90, off: 45, edge: 68 }[k]; if (B.lab.env.hum !== v) { B.lab.env.hum = v; bump(B.lab); } },
});
IN.ldrb = Object.assign({}, IN.ldr, {
  name: t3('light sensor (LDR)', 'रोशनी सेंसर (एलडीआर)', 'light sensor (LDR)'),
  read: 'int light = analogRead(A0);  // bright: high, dark: low', v: 'light', label: 'Light', cond: 'light > limit', l0: 800, l1: 600, note: 'brighter than this: on',
  when: t3('light falls on the sensor', 'सेंसर पर रोशनी पड़ती है', 'sensor par roshni padti hai'),
  onDo: t3('Slide the Room light up to full brightness.', '"कमरे की रोशनी" स्लाइडर पूरा ऊपर कीजिए।', '"Room light" slider poora upar kijiye.'), offDo: t3('Make the room dark.', 'कमरे में अँधेरा कीजिए।', 'Room mein andhera kijiye.'),
  edgeDo: t3('Now make it fairly bright, not full (about 60 %).', 'अब अच्छी रोशनी कीजिए, पूरी नहीं (लगभग 60 %)।', 'Ab achhi roshni kijiye, poori nahi (lagbhag 60 %).'),
  set: (B, k) => { const v = { on: 1, off: 0.08, edge: 0.6 }[k]; if (B.lab.env.light !== v) { B.lab.env.light = v; bump(B.lab); } },
});
IN.cold = Object.assign({}, IN.lm35, {
  cond: 'temp < limit', l0: 20, l1: 26, note: 'colder than this (°C): on',
  when: t3('it gets too cold', 'बहुत ठंड हो जाती है', 'bahut thand ho jaati hai'),
  onDo: t3('Tap the sensor and cool it to 10 °C.', 'सेंसर को छूइए और उसे 10 °C तक ठंडा कीजिए।', 'Sensor ko touch karo aur use 10 °C tak thanda kijiye.'), offDo: t3('Warm it back to 30 °C.', 'उसे वापस 30 °C तक गर्म कीजिए।', 'Use wapas 30 °C tak garam kijiye.'),
  edgeDo: t3('Now cool it only to 23 °C.', 'अब उसे सिर्फ़ 23 °C तक ठंडा कीजिए।', 'Ab use sirf 23 °C tak thanda kijiye.'),
  set: (B, k) => { const v = { on: 10, off: 30, edge: 23 }[k]; if (B.lab.env.temp !== v) { B.lab.env.temp = v; bump(B.lab); } },
});

// ------------------------------------------------------------------ the same jobs on the ESP32 (3.3 V, 12-bit ADC on GPIO 34, 115200 baud)
// Rails: back + = VIN (5 V), back − = GND; front + = 3V3, front − = GND. 3.3 V sensors go on the front rails; a 5 V module's
// signal must never reach a GPIO (the simulator warns, as the real chip would be damaged).
const ESP_POWER = [['H:a4', 'H:tp2'], ['H:a5', 'H:tn3'], ['H:j4', 'H:bp2'], ['H:j5', 'H:bn3']];
const EIN = {}, EOUT = {};
const eread = (v, note) => `int ${v} = analogRead(34);   // GPIO 34 (ADC1): 0 to 4095, ${note}`;
EIN.button = Object.assign({}, IN.button, {
  wires: [w('D27', 'b1.L1', 'Wire GPIO 27 (D27) to its top-left leg.', 'GPIO 27 (D27) को इसके ऊपर-बाएँ पैर से जोड़िए।', 'GPIO 27 (D27) ko iske upar-left pair se jodiye.'), w('b1.L3', 'rail:tn', 'Wire its top-right leg to the − rail.', 'इसके ऊपर-दाएँ पैर को − रेल से जोड़िए।', 'Iske upar-right pair ko − rail se jodiye.')],
  checks: (K) => [has(K.W, 'b1', t3('button', 'बटन', 'button')), need('b1.L1', 'D27', K.W.toPin, { x: t3('The button', 'बटन', 'Button'), p: 27 }), (S) => (S.conn('b1.L3', 'GND') || S.conn('b1.L4', 'GND') ? null : [K.W.toGnd, { x: t3('The button\'s other leg', 'बटन का दूसरा पैर', 'Button ka doosra pair') }])],
  decl: ['const int button = 27;      // GPIO 27, to GND when pressed (INPUT_PULLUP)'],
});
EIN.pir = Object.assign({}, IN.pir, {
  wires: [w('pir.VCC', 'rail:tp', 'Wire its VCC to the back + rail (5 V from VIN): a PIR needs 5 V.', 'इसका VCC पीछे वाली + रेल (VIN से 5 V) से जोड़िए: पीआईआर को 5 V चाहिए।', 'Iska VCC peeche wali + rail (VIN se 5 V) se jodiye: PIR ko 5 V chahiye.'), w('pir.GND', 'rail:tn', 'Its GND to the back − rail.', 'इसका GND पीछे वाली − रेल से।', 'Iska GND peeche wali − rail se.'), w('pir.OUT', 'D27', 'Its OUT to GPIO 27: its signal is only 3.3 V, safe for the ESP32.', 'इसका OUT, GPIO 27 से: इसका सिग्नल सिर्फ़ 3.3 V है, ESP32 के लिए सुरक्षित।', 'Iska OUT, GPIO 27 se: iska signal sirf 3.3 V hai, ESP32 ke liye safe.')],
  checks: (K) => [has(K.W, 'pir', t3('PIR sensor', 'पीआईआर सेंसर', 'PIR sensor')), need('pir.VCC', 'VIN', K.W.join, { a: 'PIR VCC', b: 'VIN (5 V)' }), need('pir.GND', 'GND', K.W.toGnd, { x: 'GND' }), need('pir.OUT', 'D27', K.W.toPin, { x: 'PIR OUT', p: 27 })],
  decl: ['const int pir = 27;         // GPIO 27: HIGH while it sees movement'],
});
EIN.ir = Object.assign({}, IN.ir, {
  wires: [w('ir1.VCC', 'rail:bp', 'Wire its VCC pin to the front + rail (3.3 V).', 'इसके VCC पिन को आगे वाली + रेल (3.3 V) से जोड़िए।', 'Iske VCC pin ko aage wali + rail (3.3 V) se jodiye.'), w('ir1.GND', 'rail:bn', 'Its GND pin to the front − rail.', 'इसका GND पिन आगे वाली − रेल से।', 'Iska GND pin aage wali − rail se.'), w('ir1.OUT', 'D27', 'Its OUT pin to GPIO 27.', 'इसका OUT पिन, GPIO 27 से।', 'Iska OUT pin, GPIO 27 se.')],
  checks: (K) => [has(K.W, 'ir1', t3('IR sensor', 'आईआर सेंसर', 'IR sensor')), need('ir1.VCC', '3V3', K.W.join, { a: 'IR VCC', b: '3V3' }), need('ir1.GND', 'GND', K.W.toGnd, { x: 'GND' }), need('ir1.OUT', 'D27', K.W.toPin, { x: 'OUT', p: 27 })],
  decl: ['const int ir = 27;          // GPIO 27: LOW when something is near'],
});
EIN.pot = Object.assign({}, IN.pot, {
  wires: [w('pot1.1', 'rail:bn', 'Wire its left leg (column 45) to the front − rail.', 'इसके बाएँ पैर (कॉलम 45) को आगे वाली − रेल से जोड़िए।', 'Iske left pair (column 45) ko aage wali − rail se jodiye.'), w('pot1.3', 'rail:bp', 'Its right leg (column 47) to the front + rail (3.3 V).', 'इसका दायाँ पैर (कॉलम 47) आगे वाली + रेल (3.3 V) से।', 'Iska right pair (column 47) aage wali + rail (3.3 V) se.'), w('D34', 'pot1.W', 'Its middle leg (the wiper) to GPIO 34.', 'इसका बीच वाला पैर (वाइपर) GPIO 34 से।', 'Iska beech wala pair (wiper) GPIO 34 se.')],
  checks: (K) => [has(K.W, 'pot1', t3('knob', 'नॉब', 'knob')), need('pot1.W', 'D34', K.W.join, { a: t3('The knob\'s middle leg', 'नॉब का बीच वाला पैर', 'Knob ka beech wala pair'), b: 'GPIO 34' }), (S) => ((S.conn('pot1.1', 'GND') && S.conn('pot1.3', '3V3')) || (S.conn('pot1.3', 'GND') && S.conn('pot1.1', '3V3')) ? null : [XF.potEnds3])],
  read: eread('knob', 'left to right'), l0: 2000, l1: 1200,
  onDo: t3('Tap the knob and turn it more than halfway (above 2000).', 'नॉब को छूइए और आधे से ज़्यादा घुमाइए (2000 से ऊपर)।', 'Knob ko touch karo aur aadhe se zyada ghumaiye (2000 se upar).'),
  edgeDo: t3('Now turn it to about 40 % (around 1600).', 'अब इसे लगभग 40 % (करीब 1600) पर लाइए।', 'Ab ise lagbhag 40 % (kareeb 1600) par laiye.'),
});
const ldrE = { place2: P('r10', 'resistor', { ohms: 10000 }, 'b42', 3),
  wires: [w('ldr1.1', 'rail:bp', 'Wire the LDR\'s left leg to the front + rail (3.3 V), not to 5 V.', 'एलडीआर के बाएँ पैर को आगे वाली + रेल (3.3 V) से जोड़िए, 5 V से नहीं।', 'LDR ke left pair ko aage wali + rail (3.3 V) se jodiye, 5 V se nahi.'), w('D34', 'ldr1.2', 'Wire GPIO 34 to its right leg (it meets the resistor there).', 'GPIO 34 को इसके दाएँ पैर से जोड़िए (वहीं रेज़िस्टर मिलता है)।', 'GPIO 34 ko iske right pair se jodiye (wahin resistor milta hai).')],
  checks: (K) => [has(K.W, 'ldr1', t3('LDR', 'एलडीआर', 'LDR')), need('ldr1.2', 'D34', K.W.join, { a: t3('The LDR\'s right leg', 'एलडीआर का दायाँ पैर', 'LDR ka right pair'), b: 'GPIO 34' }), (S) => (S.conn('ldr1.1', 'VIN') ? [XF.esp5v] : null), need('ldr1.1', '3V3', K.W.join, { a: 'LDR', b: '3V3' })] };
EIN.ldr = Object.assign({}, IN.ldr, ldrE, { read: eread('light', 'bright: high, dark: low'), l0: 1000, l1: 2500 });
EIN.ldrb = Object.assign({}, IN.ldrb, ldrE, { read: eread('light', 'bright: high, dark: low'), l0: 3200, l1: 2200 });
const lmE = { wires: [w('t1.VS', 'rail:tp', 'Wire its left leg (+Vs) to the back + rail (5 V from VIN): the LM35 needs at least 4 V.', 'इसके बाएँ पैर (+Vs) को पीछे वाली + रेल (VIN से 5 V) से जोड़िए: LM35 को कम से कम 4 V चाहिए।', 'Iske left pair (+Vs) ko peeche wali + rail (VIN se 5 V) se jodiye: LM35 ko kam se kam 4 V chahiye.'), w('t1.OUT', 'D34', 'Its middle leg (OUT) to GPIO 34: it gives only 10 mV per °C, safe for the ESP32.', 'इसका बीच वाला पैर (OUT) GPIO 34 से: यह हर °C पर सिर्फ़ 10 mV देता है, ESP32 के लिए सुरक्षित।', 'Iska beech wala pair (OUT) GPIO 34 se: yeh har °C par sirf 10 mV deta hai, ESP32 ke liye safe.'), w('t1.GND', 'rail:tn', 'Its right leg (GND) to the back − rail.', 'इसका दायाँ पैर (GND) पीछे वाली − रेल से।', 'Iska right pair (GND) peeche wali − rail se.')],
  checks: (K) => [has(K.W, 't1', t3('LM35 sensor', 'LM35 सेंसर', 'LM35 sensor')), need('t1.VS', 'VIN', K.W.join, { a: '+Vs', b: 'VIN (5 V)' }), need('t1.OUT', 'D34', K.W.join, { a: 'OUT', b: 'GPIO 34' }), need('t1.GND', 'GND', K.W.toGnd, { x: 'GND' })],
  read: 'int temp = analogReadMilliVolts(34) / 10;  // °C: 10 mV per degree' };
EIN.lm35 = Object.assign({}, IN.lm35, lmE);
EIN.cold = Object.assign({}, IN.cold, lmE);
EIN.soil = Object.assign({}, IN.soil, {
  wires: [w('soil.VCC', 'rail:bp', 'Wire its VCC to the front + rail (3.3 V).', 'इसका VCC आगे वाली + रेल (3.3 V) से जोड़िए।', 'Iska VCC aage wali + rail (3.3 V) se jodiye.'), w('soil.GND', 'rail:bn', 'Its GND to the front − rail.', 'इसका GND आगे वाली − रेल से।', 'Iska GND aage wali − rail se.'), w('soil.AO', 'D34', 'Its AO to GPIO 34.', 'इसका AO, GPIO 34 से।', 'Iska AO, GPIO 34 se.')],
  checks: (K) => [has(K.W, 'soil', t3('soil sensor', 'मिट्टी सेंसर', 'soil sensor')), (S) => (S.conn('soil.VCC', 'VIN') ? [XF.esp5v] : null), need('soil.VCC', '3V3', K.W.join, { a: 'VCC', b: '3V3' }), need('soil.GND', 'GND', K.W.toGnd, { x: 'GND' }), need('soil.AO', 'D34', K.W.join, { a: 'AO', b: 'GPIO 34' })],
  read: eread('soil', 'dry soil: big, wet soil: small'), l0: 3000, l1: 2000,
});
const dhtE = { wires: [w('dht.VCC', 'rail:bp', 'Its middle pin (+) to the front + rail (3.3 V).', 'इसका बीच वाला पिन (+) आगे वाली + रेल (3.3 V) से।', 'Iska beech wala pin (+) aage wali + rail (3.3 V) se.'), w('dht.GND', 'rail:bn', 'Its right pin (−) to the front − rail.', 'इसका दायाँ पिन (−) आगे वाली − रेल से।', 'Iska right pin (−) aage wali − rail se.'), w('dht.DATA', 'D27', 'Its left pin (DATA) to GPIO 27.', 'इसका बायाँ पिन (DATA) GPIO 27 से।', 'Iska left pin (DATA) GPIO 27 se.')],
  checks: (K) => [has(K.W, 'dht', t3('DHT11', 'DHT11', 'DHT11')), need('dht.VCC', '3V3', K.W.join, { a: 'DHT11 +', b: '3V3' }), need('dht.GND', 'GND', K.W.toGnd, { x: 'DHT11 −' }), need('dht.DATA', 'D27', K.W.toPin, { x: 'DATA', p: 27 })],
  decl: ['DHT dht(27, DHT11);         // the DHT11\'s DATA on GPIO 27'] };
EIN.dht = Object.assign({}, IN.dht, dhtE);
EIN.hum = Object.assign({}, IN.hum, dhtE);
// (batch 14) a web page on the phone: the ESP32 joins the school WiFi and serves the job's warning (Class 8 IoT)
const net = (S) => S.lab.net4 || { seen: { pages: 0, paths: {} } };
const lastBody = (S) => String(((net(S).seen || {}).last || {}).body || '');
EOUT.web = { name: t3('web page on a phone', 'फ़ोन पर वेब पेज', 'phone par web page'), pin: 'WiFi', parts: [], wires: [], web: true,
  ready: t3('The ESP32 joins the school WiFi (DUET-School) and serves a web page; the phone on the bench opens it. No wires for this output: it goes by radio.', 'ESP32 स्कूल के WiFi (DUET-School) से जुड़ता है और एक वेब पेज देता है; बेंच पर रखा फ़ोन उसे खोलता है। इस आउटपुट के लिए कोई वायर नहीं: यह रेडियो से जाता है।', 'ESP32 school ke WiFi (DUET-School) se judta hai aur ek web page deta hai; bench par rakha phone use kholta hai. Is output ke liye koi wire nahi: yeh radio se jaata hai.'),
  onWords: t3('the page on the phone shows the warning', 'फ़ोन के पेज पर चेतावनी आती है', 'phone ke page par warning aati hai'),
  isOn: (S, j) => lastBody(S).includes('<h1 style="color:#d0342c">' + j.on) };
EOUT.led = Object.assign({}, OUT.led, { pin: 25, parts: [P('led1', 'led', { color: 'red' }, 'e30', 0), P('r1', 'resistor', { ohms: 220 }, 'b30', 3)], wires: [['H:a11', 'H:a31']],
  ready: t3('The red LED and its 220 Ω resistor are already wired to GPIO 25.', 'लाल एलईडी और उसका 220 Ω रेज़िस्टर पहले से GPIO 25 पर लगे हैं।', 'Laal LED aur uska 220 Ω resistor pehle se GPIO 25 par lage hain.'),
  decl: ['const int led = 25;         // GPIO 25: the LED (through its resistor)'] });
EOUT.buzzer = Object.assign({}, OUT.buzzer, { pin: 26, parts: [P('bz1', 'buzzer', {}, 'e52', 0)], wires: [['H:a10', 'H:a52'], ['H:a55', 'H:tn45']],
  ready: t3('The buzzer is already wired to GPIO 26. The ESP32 makes its note with a PWM channel (ledc).', 'बज़र पहले से GPIO 26 पर लगा है। ESP32 इसका सुर PWM चैनल (ledc) से बनाता है।', 'Buzzer pehle se GPIO 26 par laga hai. ESP32 iska sur PWM channel (ledc) se banata hai.'),
  decl: ['const int buzzer = 26;      // GPIO 26: the piezo buzzer'], setup: ['ledcSetup(0, 2000, 8);      // PWM channel 0', 'ledcAttachPin(buzzer, 0);'], on: ['ledcWriteTone(0, 2000);     // a 2000 Hz note'], off: ['ledcWriteTone(0, 0);'] });
EOUT.relay = Object.assign({}, OUT.relay, { pin: 33, wires: [['T:lamp:A', 'T:rl1:COM'], ['T:lamp:B', 'T:rl1:NO'], ['T:rl1:S', 'H:a12'], ['T:rl1:VCC', 'H:tp20'], ['T:rl1:GND', 'H:tn20']],
  ready: t3('The relay is wired to GPIO 33 and to 5 V, and an electrician has wired the 230 V lamp to its COM and NO.', 'रिले GPIO 33 और 5 V से जुड़ा है, और इलेक्ट्रीशियन ने 230 V का बल्ब उसके COM और NO से जोड़ा है।', 'Relay GPIO 33 aur 5 V se juda hai, aur electrician ne 230 V ka bulb uske COM aur NO se joda hai.'),
  decl: ['const int relay = 33;       // GPIO 33: the relay, HIGH = lamp on'] });
EOUT.pump = Object.assign({}, OUT.pump, { pin: 33, wires: [['T:pump:N', 'T:bat:N'], ['T:bat:P', 'T:rl1:COM'], ['T:rl1:NO', 'T:pump:P'], ['T:rl1:S', 'H:a12'], ['T:rl1:VCC', 'H:tp20'], ['T:rl1:GND', 'H:tn20']],
  ready: t3('The pump is already wired with its own 6 V battery through a relay on GPIO 33.', 'पंप पहले से अपनी 6 V बैटरी और GPIO 33 के रिले से जुड़ा है।', 'Pump pehle se apni 6 V battery aur GPIO 33 ke relay se juda hai.'),
  decl: ['const int relay = 33;       // GPIO 33: the pump\'s relay, HIGH = pump on'] });
// (batch 12; the module covers rows b–i, so its wires start in row a or j) the RGB LED, the servo (ESP32Servo.h: the Arduino Servo library does not build for the ESP32) and the I2C LCD
// on GPIO 21 (SDA) and 22 (SCL), powered from VIN (5 V) as the LCD's backpack needs
const rgbAt = (r, g, b) => ({ parts: [P('rr', 'resistor', { ohms: 220 }, 'd30', 1), P('rg', 'resistor', { ohms: 100 }, 'd32', 1), P('rb', 'resistor', { ohms: 100 }, 'd33', 1), P('rgb1', 'rgb', {}, 'e30', 0)],
  wires: [[r, 'H:j30'], [g, 'H:j32'], [b, 'H:j33'], ['H:a31', 'H:tn25']] });
EOUT.rgb = Object.assign({}, OUT.rgb, rgbAt('H:a11', 'H:a10', 'H:a12'), { pin: '25/26/33',
  ready: t3('The RGB LED is already wired: red to GPIO 25, green to GPIO 26, blue to GPIO 33, each through its resistor (100 Ω for green and blue: at 3.3 V they need a smaller one). Green means all is well.', 'RGB एलईडी पहले से लगी है: लाल GPIO 25, हरा GPIO 26, नीला GPIO 33 पर, हर एक अपने रेज़िस्टर से होकर (हरे और नीले के लिए 100 Ω: 3.3 V पर उन्हें छोटा रेज़िस्टर चाहिए)। हरा मतलब सब ठीक।', 'RGB LED pehle se lagi hai: laal GPIO 25, hara GPIO 26, neela GPIO 33 par, har ek apne resistor se hokar (hare aur neele ke liye 100 Ω: 3.3 V par unhe chhota resistor chahiye). Hara matlab sab theek.'),
  decl: ['const int red = 25;    // the RGB LED\'s three colours', 'const int green = 26;', 'const int blue = 33;'] });
EOUT.servo = Object.assign({}, OUT.servo, { pin: 13, wires: [['T:sv1:GND', 'H:tn40'], ['T:sv1:VP', 'H:tp40'], ['T:sv1:SIG', 'H:a6']],
  ready: t3('The servo is already wired: brown to −, red to the back + rail (5 V from VIN), orange (signal) to GPIO 13. On the ESP32 the servo library is ESP32Servo.h.', 'सर्वो पहले से लगा है: भूरा − पर, लाल पीछे वाली + रेल (VIN से 5 V) पर, नारंगी (सिग्नल) GPIO 13 पर। ESP32 पर सर्वो की लाइब्रेरी ESP32Servo.h है।', 'Servo pehle se laga hai: brown − par, laal peeche wali + rail (VIN se 5 V) par, orange (signal) GPIO 13 par. ESP32 par servo ki library ESP32Servo.h hai.'),
  inc: ['#include <ESP32Servo.h>'], decl: ['Servo arm;                  // the servo on GPIO 13'], setup: ['arm.attach(13);', 'arm.write(0);'] });
EOUT.oled = Object.assign({}, OUT.oled, { pin: '21/22', parts: [P('oled', 'oled', {}, 'e22', 0)], wires: [['H:a22', 'H:tn22'], ['H:a23', 'H:bp23'], ['H:a24', 'H:j17'], ['H:a25', 'H:j14']],
  ready: t3('The OLED screen (128 × 64 dots) is already wired: GND, VCC to the front + rail (3.3 V: its I2C lines then stay at the ESP32\'s own 3.3 V), SCL to GPIO 22, SDA to GPIO 21. Address 0x3C.', 'ओएलईडी स्क्रीन (128 × 64 बिंदु) पहले से लगी है: GND, VCC आगे वाली + रेल (3.3 V: तब इसकी I2C लाइनें ESP32 के अपने 3.3 V पर रहती हैं) पर, SCL GPIO 22 पर, SDA GPIO 21 पर। पता 0x3C।', 'OLED screen (128 × 64 dots) pehle se lagi hai: GND, VCC aage wali + rail (3.3 V: tab iski I2C lines ESP32 ke apne 3.3 V par rehti hain) par, SCL GPIO 22 par, SDA GPIO 21 par. Address 0x3C.') });
EOUT.lcd = Object.assign({}, OUT.lcd, { pin: '21/22', wires: [['T:lcd:GND', 'H:tn10'], ['T:lcd:VCC', 'H:tp10'], ['T:lcd:SDA', 'H:j14'], ['T:lcd:SCL', 'H:j17']],
  ready: t3('The 16×2 LCD is already wired: VCC to the back + rail (5 V from VIN), SDA to GPIO 21, SCL to GPIO 22: the ESP32\'s I2C pins.', '16×2 एलसीडी पहले से लगी है: VCC पीछे वाली + रेल (VIN से 5 V) पर, SDA GPIO 21 पर, SCL GPIO 22 पर: ये ESP32 के I2C पिन हैं।', '16×2 LCD pehle se lagi hai: VCC peeche wali + rail (VIN se 5 V) par, SDA GPIO 21 par, SCL GPIO 22 par: yeh ESP32 ke I2C pin hain.') });

// ------------------------------------------------------------------ the same jobs on the Raspberry Pi Pico, in MicroPython
// Rails: back + = VBUS (5 V), back − = GND; front − = GND. 3.3 V parts take the Pico's 3V3 pin; ADC on GP26 (0-65535).
const PICO_POWER = [['H:a2', 'H:tp1'], ['H:a4', 'H:tn3'], ['H:j19', 'H:bn15']];
const PIN = {}, POUT = {};
PIN.button = Object.assign({}, IN.button, { place: P('b1', 'button', {}, 'e40', 0),
  wires: [w('b1.L2', 'GP14', 'Wire its bottom-left leg to GP14.', 'इसके नीचे-बाएँ पैर को GP14 से जोड़िए।', 'Iske neeche-left pair ko GP14 se jodiye.'), w('b1.L4', 'rail:bn', 'Its bottom-right leg to the front − rail.', 'इसका नीचे-दायाँ पैर आगे वाली − रेल से।', 'Iska neeche-right pair aage wali − rail se.')],
  checks: (K) => [has(K.W, 'b1', t3('button', 'बटन', 'button')), need('b1.L2', 'GP14', K.W.join, { a: t3('The button', 'बटन', 'Button'), b: 'GP14' }), (S) => (S.conn('b1.L4', 'GND') || S.conn('b1.L3', 'GND') ? null : [K.W.toGnd, { x: t3('The button\'s other leg', 'बटन का दूसरा पैर', 'Button ka doosra pair') }])],
  py: { decl: ['button = Pin(14, Pin.IN, Pin.PULL_UP)   # free: 1, pressed: 0'], trig: 'button.value() == 0' } });
PIN.pir = Object.assign({}, IN.pir, {
  wires: [w('pir.VCC', 'rail:tp', 'Wire its VCC to the back + rail (5 V from VBUS): a PIR needs 5 V.', 'इसका VCC पीछे वाली + रेल (VBUS से 5 V) से जोड़िए: पीआईआर को 5 V चाहिए।', 'Iska VCC peeche wali + rail (VBUS se 5 V) se jodiye: PIR ko 5 V chahiye.'), w('pir.GND', 'rail:tn', 'Its GND to the back − rail.', 'इसका GND पीछे वाली − रेल से।', 'Iska GND peeche wali − rail se.'), w('pir.OUT', 'GP14', 'Its OUT to GP14 (a 3.3 V signal: safe for the Pico).', 'इसका OUT, GP14 से (3.3 V सिग्नल: Pico के लिए सुरक्षित)।', 'Iska OUT, GP14 se (3.3 V signal: Pico ke liye safe).')],
  checks: (K) => [has(K.W, 'pir', t3('PIR sensor', 'पीआईआर सेंसर', 'PIR sensor')), need('pir.VCC', 'VBUS', K.W.join, { a: 'PIR VCC', b: 'VBUS (5 V)' }), need('pir.GND', 'GND', K.W.toGnd, { x: 'GND' }), need('pir.OUT', 'GP14', K.W.join, { a: 'PIR OUT', b: 'GP14' })],
  py: { decl: ['pir = Pin(14, Pin.IN)       # 1 while it sees movement'], trig: 'pir.value() == 1' } });
PIN.ir = Object.assign({}, IN.ir, {
  wires: [w('ir1.VCC', '3V3', 'Wire its VCC pin to the Pico\'s 3V3 pin.', 'इसके VCC पिन को Pico के 3V3 पिन से जोड़िए।', 'Iske VCC pin ko Pico ke 3V3 pin se jodiye.'), w('ir1.GND', 'rail:bn', 'Its GND pin to the front − rail.', 'इसका GND पिन आगे वाली − रेल से।', 'Iska GND pin aage wali − rail se.'), w('ir1.OUT', 'GP14', 'Its OUT pin to GP14.', 'इसका OUT पिन, GP14 से।', 'Iska OUT pin, GP14 se.')],
  checks: (K) => [has(K.W, 'ir1', t3('IR sensor', 'आईआर सेंसर', 'IR sensor')), need('ir1.VCC', '3V3', K.W.join, { a: 'IR VCC', b: '3V3' }), need('ir1.GND', 'GND', K.W.toGnd, { x: 'GND' }), need('ir1.OUT', 'GP14', K.W.join, { a: 'OUT', b: 'GP14' })],
  py: { decl: ['ir = Pin(14, Pin.IN)        # 0 when something is near'], trig: 'ir.value() == 0' } });
const adcPy = (v, note) => ({ decl: ['sensor = ADC(26)            # GP26: 0 to 65535'], read: `${v} = sensor.read_u16()   # ${note}` });
PIN.pot = Object.assign({}, IN.pot, {
  wires: [w('pot1.1', 'rail:tn', 'Wire its left leg (column 45) to the back − rail.', 'इसके बाएँ पैर (कॉलम 45) को पीछे वाली − रेल से जोड़िए।', 'Iske left pair (column 45) ko peeche wali − rail se jodiye.'), w('pot1.3', '3V3', 'Its right leg (column 47) to the Pico\'s 3V3 pin.', 'इसका दायाँ पैर (कॉलम 47) Pico के 3V3 पिन से।', 'Iska right pair (column 47) Pico ke 3V3 pin se.'), w('GP26', 'pot1.W', 'Its middle leg (the wiper) to GP26 (ADC0).', 'इसका बीच वाला पैर (वाइपर) GP26 (ADC0) से।', 'Iska beech wala pair (wiper) GP26 (ADC0) se.')],
  checks: (K) => [has(K.W, 'pot1', t3('knob', 'नॉब', 'knob')), need('pot1.W', 'GP26', K.W.join, { a: t3('The knob\'s middle leg', 'नॉब का बीच वाला पैर', 'Knob ka beech wala pair'), b: 'GP26' }), (S) => ((S.conn('pot1.1', 'GND') && S.conn('pot1.3', '3V3')) || (S.conn('pot1.3', 'GND') && S.conn('pot1.1', '3V3')) ? null : [XF.potEndsP])],
  py: adcPy('knob', 'left to right'), l0: 32000, l1: 20000,
  onDo: t3('Tap the knob and turn it more than halfway (above 32000).', 'नॉब को छूइए और आधे से ज़्यादा घुमाइए (32000 से ऊपर)।', 'Knob ko touch karo aur aadhe se zyada ghumaiye (32000 se upar).'),
  edgeDo: t3('Now turn it to about 40 % (around 26000).', 'अब इसे लगभग 40 % (करीब 26000) पर लाइए।', 'Ab ise lagbhag 40 % (kareeb 26000) par laiye.') });
const ldrP = { place: P('ldr1', 'ldr', {}, 'a40', 0), placeDo: t3('Put the LDR into 40a–41a.', 'एलडीआर को 40a–41a में लगाइए।', 'LDR ko 40a–41a mein lagaiye.'),
  wires: [w('ldr1.1', '3V3', 'Wire the LDR\'s left leg to the Pico\'s 3V3 pin.', 'एलडीआर के बाएँ पैर को Pico के 3V3 पिन से जोड़िए।', 'LDR ke left pair ko Pico ke 3V3 pin se jodiye.'), w('ldr1.2', 'GP26', 'Wire its right leg to GP26 (it meets the resistor there).', 'इसके दाएँ पैर को GP26 से जोड़िए (वहीं रेज़िस्टर मिलता है)।', 'Iske right pair ko GP26 se jodiye (wahin resistor milta hai).')],
  checks: (K) => [has(K.W, 'ldr1', t3('LDR', 'एलडीआर', 'LDR')), need('ldr1.2', 'GP26', K.W.join, { a: t3('The LDR\'s right leg', 'एलडीआर का दायाँ पैर', 'LDR ka right pair'), b: 'GP26' }), (S) => (S.conn('ldr1.1', 'VBUS') ? [XF.pico5v] : null), need('ldr1.1', '3V3', K.W.join, { a: 'LDR', b: '3V3' })] };
PIN.ldr = Object.assign({}, IN.ldr, ldrP, { py: adcPy('light', 'bright: big, dark: small'), l0: 15000, l1: 40000 });
PIN.ldrb = Object.assign({}, IN.ldrb, ldrP, { py: adcPy('light', 'bright: big, dark: small'), l0: 50000, l1: 35000 });
const lmP = { wires: [w('t1.VS', 'rail:tp', 'Wire its left leg (+Vs) to the back + rail (5 V from VBUS): the LM35 needs at least 4 V.', 'इसके बाएँ पैर (+Vs) को पीछे वाली + रेल (VBUS से 5 V) से जोड़िए: LM35 को कम से कम 4 V चाहिए।', 'Iske left pair (+Vs) ko peeche wali + rail (VBUS se 5 V) se jodiye: LM35 ko kam se kam 4 V chahiye.'), w('t1.OUT', 'GP26', 'Its middle leg (OUT) to GP26: 10 mV per °C, safe for the Pico.', 'इसका बीच वाला पैर (OUT) GP26 से: हर °C पर 10 mV, Pico के लिए सुरक्षित।', 'Iska beech wala pair (OUT) GP26 se: har °C par 10 mV, Pico ke liye safe.'), w('t1.GND', 'rail:tn', 'Its right leg (GND) to the back − rail.', 'इसका दायाँ पैर (GND) पीछे वाली − रेल से।', 'Iska right pair (GND) peeche wali − rail se.')],
  checks: (K) => [has(K.W, 't1', t3('LM35 sensor', 'LM35 सेंसर', 'LM35 sensor')), need('t1.VS', 'VBUS', K.W.join, { a: '+Vs', b: 'VBUS (5 V)' }), need('t1.OUT', 'GP26', K.W.join, { a: 'OUT', b: 'GP26' }), need('t1.GND', 'GND', K.W.toGnd, { x: 'GND' })],
  py: { decl: ['sensor = ADC(26)            # GP26'], read: 'temp = round(sensor.read_u16() * 3.3 / 65535 * 100)   # °C: 10 mV per degree' } };
PIN.lm35 = Object.assign({}, IN.lm35, lmP);
// (batch 14) the DHT11 on the Pico: MicroPython's own dht module, its DATA on GP14 (the digital sensors' pin), + on 3V3
const dhtP = { wires: [w('dht.VCC', '3V3', 'Wire its middle pin (+) to the Pico\'s 3V3 pin: the DHT11 works at 3.3 V.', 'इसके बीच वाले पिन (+) को Pico के 3V3 पिन से जोड़िए: DHT11 3.3 V पर चलता है।', 'Iske beech wale pin (+) ko Pico ke 3V3 pin se jodiye: DHT11 3.3 V par chalta hai.'), w('dht.GND', 'rail:bn', 'Its right pin (−) to the front − rail.', 'इसका दायाँ पिन (−) आगे वाली − रेल से।', 'Iska right pin (−) aage wali − rail se.'), w('dht.DATA', 'GP14', 'Its left pin (DATA) to GP14.', 'इसका बायाँ पिन (DATA) GP14 से।', 'Iska left pin (DATA) GP14 se.')],
  checks: (K) => [has(K.W, 'dht', t3('DHT11', 'DHT11', 'DHT11')), (S) => (S.conn('dht.VCC', 'VBUS') ? [XF.pico5v] : null), need('dht.VCC', '3V3', K.W.join, { a: 'DHT11 +', b: '3V3' }), need('dht.GND', 'GND', K.W.toGnd, { x: 'DHT11 −' }), need('dht.DATA', 'GP14', K.W.join, { a: 'DATA', b: 'GP14' })] };
const dhtPy = (v, fn) => ({ dht: true, imp: ['import dht'], decl: ['sensor = dht.DHT11(Pin(14))  # the DHT11\'s DATA on GP14'],
  read: ['try:', '    sensor.measure()            # it answers once every 2 s', `    ${v} = sensor.${fn}()`, 'except OSError:                 # a DHT11 sometimes misses a reading: try again', `    ${v} = None`] });
PIN.dht = Object.assign({}, IN.dht, dhtP, { py: dhtPy('temp', 'temperature') });
PIN.hum = Object.assign({}, IN.hum, dhtP, { py: dhtPy('hum', 'humidity') });
PIN.cold = Object.assign({}, IN.cold, lmP);
PIN.soil = Object.assign({}, IN.soil, {
  wires: [w('soil.VCC', '3V3', 'Wire its VCC to the Pico\'s 3V3 pin.', 'इसका VCC Pico के 3V3 पिन से जोड़िए।', 'Iska VCC Pico ke 3V3 pin se jodiye.'), w('soil.GND', 'rail:bn', 'Its GND to the front − rail.', 'इसका GND आगे वाली − रेल से।', 'Iska GND aage wali − rail se.'), w('soil.AO', 'GP26', 'Its AO to GP26.', 'इसका AO, GP26 से।', 'Iska AO, GP26 se.')],
  checks: (K) => [has(K.W, 'soil', t3('soil sensor', 'मिट्टी सेंसर', 'soil sensor')), (S) => (S.conn('soil.VCC', 'VBUS') ? [XF.pico5v] : null), need('soil.VCC', '3V3', K.W.join, { a: 'VCC', b: '3V3' }), need('soil.GND', 'GND', K.W.toGnd, { x: 'GND' }), need('soil.AO', 'GP26', K.W.join, { a: 'AO', b: 'GP26' })],
  py: adcPy('soil', 'dry soil: big, wet soil: small'), l0: 48000, l1: 30000 });
POUT.led = Object.assign({}, OUT.led, { pin: 'GP15', parts: [P('led1', 'led', { color: 'red' }, 'f31', 0), P('r1', 'resistor', { ohms: 330 }, 'j31', 1)], wires: [['H:i21', 'H:j32']],
  ready: t3('The red LED and its 330 Ω resistor are already wired to GP15.', 'लाल एलईडी और उसका 330 Ω रेज़िस्टर पहले से GP15 पर लगे हैं।', 'Laal LED aur uska 330 Ω resistor pehle se GP15 par lage hain.'),
  py: { decl: ['led = Pin(15, Pin.OUT)      # GP15: the LED'], on: ['led.value(1)'], off: ['led.value(0)'] } });
// (batch 12) the buzzer on PWM (freq() is the note, duty_u16() switches it on) and the RGB LED
POUT.buzzer = Object.assign({}, OUT.buzzer, { pin: 'GP18', parts: [P('bz1', 'buzzer', {}, 'e30', 0)], wires: [['H:b18', 'H:a30'], ['H:a33', 'H:tn27']],
  ready: t3('The buzzer is already wired to GP18. The Pico plays its note with PWM: freq() is the note, duty_u16() switches it on and off.', 'बज़र पहले से GP18 पर लगा है। Pico इसका सुर PWM से बजाता है: freq() सुर है, duty_u16() उसे चालू और बंद करता है।', 'Buzzer pehle se GP18 par laga hai. Pico iska sur PWM se bajata hai: freq() sur hai, duty_u16() use on aur off karta hai.'),
  py: { decl: ['buzzer = PWM(Pin(18))       # GP18: the piezo buzzer', 'buzzer.freq(2000)           # its note: 2000 Hz', 'buzzer.duty_u16(0)          # silent for now'], on: ['buzzer.duty_u16(32768)      # half on, half off: it sounds'], off: ['buzzer.duty_u16(0)'] } });
POUT.rgb = Object.assign({}, OUT.rgb, rgbAt('H:b18', 'H:b17', 'H:b16'), { pin: 'GP18/19/20',
  ready: t3('The RGB LED is already wired: red to GP18, green to GP19, blue to GP20, each through its resistor (100 Ω for green and blue: at 3.3 V they need a smaller one). Green means all is well.', 'RGB एलईडी पहले से लगी है: लाल GP18, हरा GP19, नीला GP20 पर, हर एक अपने रेज़िस्टर से होकर (हरे और नीले के लिए 100 Ω: 3.3 V पर उन्हें छोटा रेज़िस्टर चाहिए)। हरा मतलब सब ठीक।', 'RGB LED pehle se lagi hai: laal GP18, hara GP19, neela GP20 par, har ek apne resistor se hokar (hare aur neele ke liye 100 Ω: 3.3 V par unhe chhota resistor chahiye). Hara matlab sab theek.'),
  py: { decl: ['red = Pin(18, Pin.OUT)      # GP18: the RGB LED\'s red', 'green = Pin(19, Pin.OUT)    # GP19: its green', 'blue = Pin(20, Pin.OUT)     # GP20: its blue (not used here)'], on: ['red.value(1)                # red: warning', 'green.value(0)'], off: ['red.value(0)', 'green.value(1)              # green: all well'] } });
POUT.servo = Object.assign({}, OUT.servo, { pin: 'GP16', wires: [['T:sv1:GND', 'H:tn40'], ['T:sv1:VP', 'H:tp40'], ['T:sv1:SIG', 'H:a21']],
  ready: t3('The servo is already wired: brown to −, red to + (5 V), orange (signal) to GP16.', 'सर्वो पहले से लगा है: भूरा − पर, लाल + (5 V) पर, नारंगी (सिग्नल) GP16 पर।', 'Servo pehle se laga hai: brown − par, laal + (5 V) par, orange (signal) GP16 par.'),
  py: { decl: ['arm = PWM(Pin(16))          # GP16: the servo', 'arm.freq(50)                # a pulse every 20 ms', 'arm.duty_u16(1638)          # 0.5 ms pulse: 0°'], on: ['arm.duty_u16(4915)          # 1.5 ms pulse: 90°'], off: ['arm.duty_u16(1638)'] } });
POUT.relay = Object.assign({}, OUT.relay, { pin: 'GP17', wires: [['T:lamp:A', 'T:rl1:COM'], ['T:lamp:B', 'T:rl1:NO'], ['T:rl1:S', 'H:a20'], ['T:rl1:VCC', 'H:tp20'], ['T:rl1:GND', 'H:tn20']],
  ready: t3('The relay is wired to GP17 and 5 V, and an electrician has wired the 230 V lamp to its COM and NO.', 'रिले GP17 और 5 V से जुड़ा है, और इलेक्ट्रीशियन ने 230 V का बल्ब उसके COM और NO से जोड़ा है।', 'Relay GP17 aur 5 V se juda hai, aur electrician ne 230 V ka bulb uske COM aur NO se joda hai.'),
  py: { decl: ['relay = Pin(17, Pin.OUT)    # GP17: 1 = lamp on'], on: ['relay.value(1)'], off: ['relay.value(0)'] } });
POUT.pump = Object.assign({}, OUT.pump, { pin: 'GP17', wires: [['T:pump:N', 'T:bat:N'], ['T:bat:P', 'T:rl1:COM'], ['T:rl1:NO', 'T:pump:P'], ['T:rl1:S', 'H:a20'], ['T:rl1:VCC', 'H:tp20'], ['T:rl1:GND', 'H:tn20']],
  ready: t3('The pump is already wired with its own 6 V battery through a relay on GP17.', 'पंप पहले से अपनी 6 V बैटरी और GP17 के रिले से जुड़ा है।', 'Pump pehle se apni 6 V battery aur GP17 ke relay se juda hai.'),
  py: { decl: ['relay = Pin(17, Pin.OUT)    # GP17: the pump\'s relay, 1 = pump on'], on: ['relay.value(1)'], off: ['relay.value(0)'] } });
// ------------------------------------------------------------------ (batch 12) the same jobs on the Raspberry Pi 4, in Python with gpiozero
// Rails: back + = 5V, back − = GND; front + = 3V3, front − = GND. The Pi's GPIO pins are 3.3 V and it has no analog inputs,
// so its sensors are the digital ones (button, PIR, IR obstacle) and the DHT11 (temperature, humidity: adafruit_dht).
const PI_POWER = [['5V', 'H:tp30'], ['GND1', 'H:tn28'], ['3V3', 'H:bp30'], ['GND2', 'H:bn28']];
const QIN = {}, QOUT = {};
QIN.button = Object.assign({}, IN.button, {
  wires: [w('GPIO17', 'b1.L1', 'Wire GPIO 17 (physical pin 11) to its top-left leg.', 'GPIO 17 (फ़िज़िकल पिन 11) को इसके ऊपर-बाएँ पैर से जोड़िए।', 'GPIO 17 (physical pin 11) ko iske upar-left pair se jodiye.'), w('b1.L3', 'rail:tn', 'Wire its top-right leg to the − rail (GND).', 'इसके ऊपर-दाएँ पैर को − रेल (GND) से जोड़िए।', 'Iske upar-right pair ko − rail (GND) se jodiye.')],
  checks: (K) => [has(K.W, 'b1', t3('button', 'बटन', 'button')), need('b1.L1', 'GPIO17', K.W.join, { a: t3('The button', 'बटन', 'Button'), b: 'GPIO 17' }), (S) => (S.conn('b1.L3', 'GND') || S.conn('b1.L4', 'GND') ? null : [K.W.toGnd, { x: t3('The button\'s other leg', 'बटन का दूसरा पैर', 'Button ka doosra pair') }])],
  pi: { imp: ['Button'], decl: ['button = Button(17)          # GPIO 17, to GND when pressed (its pull-up is inside the Pi)'], trig: 'button.is_pressed' } });
QIN.pir = Object.assign({}, IN.pir, {
  wires: [w('pir.VCC', 'rail:tp', 'Wire its VCC to the back + rail (5 V): a PIR needs 5 V, and its OUT gives only 3.3 V, safe for the Pi.', 'इसका VCC पीछे वाली + रेल (5 V) से जोड़िए: पीआईआर को 5 V चाहिए, और इसका OUT सिर्फ़ 3.3 V देता है, Pi के लिए सुरक्षित।', 'Iska VCC peeche wali + rail (5 V) se jodiye: PIR ko 5 V chahiye, aur iska OUT sirf 3.3 V deta hai, Pi ke liye surakshit.'),
    w('pir.GND', 'rail:tn', 'Its GND to the back − rail.', 'इसका GND पीछे वाली − रेल से।', 'Iska GND peeche wali − rail se.'), w('pir.OUT', 'GPIO4', 'Its OUT to GPIO 4 (physical pin 7).', 'इसका OUT GPIO 4 (फ़िज़िकल पिन 7) से।', 'Iska OUT GPIO 4 (physical pin 7) se.')],
  checks: (K) => [has(K.W, 'pir', t3('PIR sensor', 'पीआईआर सेंसर', 'PIR sensor')), need('pir.VCC', '5V', K.W.join, { a: 'PIR VCC', b: '5V' }), need('pir.GND', 'GND', K.W.toGnd, { x: 'GND' }), need('pir.OUT', 'GPIO4', K.W.join, { a: 'PIR OUT', b: 'GPIO 4' })],
  pi: { imp: ['MotionSensor'], decl: ['pir = MotionSensor(4)        # GPIO 4: motion_detected while it sees someone move'], trig: 'pir.motion_detected' } });
QIN.ir = Object.assign({}, IN.ir, {
  wires: [w('ir1.VCC', 'rail:bp', 'Wire its VCC pin to the front + rail (3.3 V).', 'इसके VCC पिन को आगे वाली + रेल (3.3 V) से जोड़िए।', 'Iske VCC pin ko aage wali + rail (3.3 V) se jodiye.'), w('ir1.GND', 'rail:bn', 'Its GND pin to the front − rail.', 'इसका GND पिन आगे वाली − रेल से।', 'Iska GND pin aage wali − rail se.'), w('ir1.OUT', 'GPIO27', 'Its OUT pin to GPIO 27 (physical pin 13).', 'इसका OUT पिन GPIO 27 (फ़िज़िकल पिन 13) से।', 'Iska OUT pin GPIO 27 (physical pin 13) se.')],
  checks: (K) => [has(K.W, 'ir1', t3('IR sensor', 'आईआर सेंसर', 'IR sensor')), need('ir1.VCC', '3V3', K.W.join, { a: 'IR VCC', b: '3V3' }), need('ir1.GND', 'GND', K.W.toGnd, { x: 'GND' }), need('ir1.OUT', 'GPIO27', K.W.join, { a: 'OUT', b: 'GPIO 27' })],
  pi: { imp: ['DigitalInputDevice'], decl: ['ir = DigitalInputDevice(27)  # GPIO 27: the module pulls it to 0 when something is near'], trig: 'ir.value == 0' } });
const dhtQ = { wires: [w('dht.VCC', 'rail:bp', 'Its middle pin (+) to the front + rail (3.3 V).', 'इसका बीच वाला पिन (+) आगे वाली + रेल (3.3 V) से।', 'Iska beech wala pin (+) aage wali + rail (3.3 V) se.'), w('dht.GND', 'rail:bn', 'Its right pin (−) to the front − rail.', 'इसका दायाँ पिन (−) आगे वाली − रेल से।', 'Iska right pin (−) aage wali − rail se.'), w('dht.DATA', 'GPIO4', 'Its left pin (DATA) to GPIO 4 (physical pin 7).', 'इसका बायाँ पिन (DATA) GPIO 4 (फ़िज़िकल पिन 7) से।', 'Iska left pin (DATA) GPIO 4 (physical pin 7) se.')],
  checks: (K) => [has(K.W, 'dht', t3('DHT11', 'DHT11', 'DHT11')), need('dht.VCC', '3V3', K.W.join, { a: 'DHT11 +', b: '3V3' }), need('dht.GND', 'GND', K.W.toGnd, { x: 'DHT11 −' }), need('dht.DATA', 'GPIO4', K.W.join, { a: 'DATA', b: 'GPIO 4' })] };
const dhtPi = (v, prop) => ({ mods: ['board', 'adafruit_dht'], decl: ['dht = adafruit_dht.DHT11(board.D4)   # the DHT11\'s DATA on GPIO 4'],
  read: ['try:', `    ${v} = dht.${prop}`, 'except RuntimeError:              # a DHT11 sometimes misses a reading: try again', `    ${v} = None`] });
QIN.dht = Object.assign({}, IN.dht, dhtQ, { pi: dhtPi('temp', 'temperature') });
// (batch 14) the HC-SR04 on the Pi: 5 V for the sensor, its 5 V Echo through a 1 kΩ / 2.2 kΩ divider (already on the
// breadboard) to GPIO 24, Trig on GPIO 25 (GPIO 23 is the relay's); gpiozero's DistanceSensor does the timing
QIN.sonar = Object.assign({}, IN.sonar, { view: 'wide', cond: 'cm < limit',
  preParts: [P('rd1', 'resistor', { ohms: 1000 }, 'g47', 2), P('rd2', 'resistor', { ohms: 2200 }, 'j43', 1)], preWires: [['GPIO24', 'H:f43']],
  placeDo: t3('Plug the ultrasonic sensor into 45j–48j, its "eyes" facing you. The divider for its Echo (1 kΩ and 2.2 kΩ) is already on the breadboard, its middle wired to GPIO 24.', 'अल्ट्रासोनिक सेंसर को 45j–48j में लगाइए, इसकी "आँखें" आपकी तरफ़। इसके Echo का डिवाइडर (1 kΩ और 2.2 kΩ) पहले से ब्रेडबोर्ड पर है, उसका बीच GPIO 24 से जुड़ा है।', 'Ultrasonic sensor ko 45j–48j mein lagaiye, iski "aankhen" aapki taraf. Iske Echo ka divider (1 kΩ aur 2.2 kΩ) pehle se breadboard par hai, uska beech GPIO 24 se juda hai.'),
  place: P('us1', 'hcsr04', {}, 'j45', 0),
  wires: [w('us1.VCC', 'rail:tp', 'Wire VCC (column 45) to the back + rail (5 V): the HC-SR04 needs 5 V.', 'VCC (कॉलम 45) को पीछे वाली + रेल (5 V) से जोड़िए: HC-SR04 को 5 V चाहिए।', 'VCC (column 45) ko peeche wali + rail (5 V) se jodiye: HC-SR04 ko 5 V chahiye.'),
    w('us1.TRIG', 'GPIO25', 'Trig (column 46) to GPIO 25 (physical pin 22).', 'Trig (कॉलम 46) को GPIO 25 (फ़िज़िकल पिन 22) से।', 'Trig (column 46) ko GPIO 25 (physical pin 22) se.'),
    w('us1.GND', 'rail:bn', 'GND (column 48) to the front − rail.', 'GND (कॉलम 48) को आगे वाली − रेल से।', 'GND (column 48) ko aage wali − rail se.')],
  checks: (K) => [has(K.W, 'us1', t3('ultrasonic sensor', 'अल्ट्रासोनिक सेंसर', 'ultrasonic sensor')), need('us1.VCC', '5V', K.W.join, { a: 'VCC', b: '5 V' }), need('us1.GND', 'GND', K.W.toGnd, { x: 'GND' }), need('us1.TRIG', 'GPIO25', K.W.join, { a: 'Trig', b: 'GPIO 25' }),
    (S) => (S.conn('us1.ECHO', 'GPIO24') ? [XF.piEcho] : null)],
  pi: { imp: ['DistanceSensor'], decl: ['sensor = DistanceSensor(echo=24, trigger=25, max_distance=2)   # Echo comes through the divider'], read: ['cm = round(sensor.distance * 100)   # .distance is in metres'], sleep: 0.2 } });
QIN.hum = Object.assign({}, IN.hum, dhtQ, { pi: dhtPi('hum', 'humidity') });
QOUT.led = Object.assign({}, OUT.led, { pin: 'GPIO18', wires: [['GPIO18', 'H:a23']],
  ready: t3('The red LED and its 220 Ω resistor are already wired to GPIO 18 (physical pin 12).', 'लाल एलईडी और उसका 220 Ω रेज़िस्टर पहले से GPIO 18 (फ़िज़िकल पिन 12) पर लगे हैं।', 'Laal LED aur uska 220 Ω resistor pehle se GPIO 18 (physical pin 12) par lage hain.'),
  pi: { imp: ['LED'], decl: ['led = LED(18)                # GPIO 18: the LED (through its resistor)'], on: ['led.on()'], off: ['led.off()'] } });
QOUT.buzzer = Object.assign({}, OUT.buzzer, { name: t3('buzzer', 'बज़र', 'buzzer'), pin: 'GPIO18', parts: [P('bz1', 'abuzz', {}, 'e30', 0)], wires: [['GPIO18', 'H:a30'], ['H:a33', 'H:tn27']],
  ready: t3('An active buzzer is already wired to GPIO 18: it beeps by itself when its + leg gets 3.3 V, so gpiozero\'s Buzzer just switches it on and off.', 'एक एक्टिव बज़र पहले से GPIO 18 पर लगा है: इसके + पैर को 3.3 V मिलते ही यह ख़ुद बीप करता है, इसलिए gpiozero का Buzzer इसे बस चालू-बंद करता है।', 'Ek active buzzer pehle se GPIO 18 par laga hai: iske + pair ko 3.3 V milte hi yeh khud beep karta hai, isliye gpiozero ka Buzzer ise bas on-off karta hai.'),
  pi: { imp: ['Buzzer'], decl: ['buzzer = Buzzer(18)          # GPIO 18: the active buzzer'], on: ['buzzer.on()'], off: ['buzzer.off()'] },
  isOn: (S) => !!(S.part('bz1') && S.part('bz1').state.on) });
QOUT.relay = Object.assign({}, OUT.relay, { pin: 'GPIO23', wires: [['T:lamp:A', 'T:rl1:COM'], ['T:lamp:B', 'T:rl1:NO'], ['T:rl1:S', 'GPIO23'], ['T:rl1:VCC', 'H:tp20'], ['T:rl1:GND', 'H:tn20']],
  ready: t3('The relay is wired to GPIO 23 and to 5 V (its coil needs 5 V; its input switches on with the Pi\'s 3.3 V), and an electrician has wired the 230 V lamp to its COM and NO.', 'रिले GPIO 23 और 5 V से जुड़ा है (इसकी कॉइल को 5 V चाहिए; इसका इनपुट Pi के 3.3 V से चालू हो जाता है), और इलेक्ट्रीशियन ने 230 V का बल्ब उसके COM और NO से जोड़ा है।', 'Relay GPIO 23 aur 5 V se juda hai (iski coil ko 5 V chahiye; iska input Pi ke 3.3 V se on ho jaata hai), aur electrician ne 230 V ka bulb uske COM aur NO se joda hai.'),
  pi: { imp: ['OutputDevice'], decl: ['relay = OutputDevice(23)     # GPIO 23: the relay, on = lamp on'], on: ['relay.on()'], off: ['relay.off()'] } });
QOUT.pump = Object.assign({}, OUT.pump, { pin: 'GPIO23', wires: [['T:pump:N', 'T:bat:N'], ['T:bat:P', 'T:rl1:COM'], ['T:rl1:NO', 'T:pump:P'], ['T:rl1:S', 'GPIO23'], ['T:rl1:VCC', 'H:tp20'], ['T:rl1:GND', 'H:tn20']],
  ready: t3('The pump is already wired with its own 6 V battery through a relay on GPIO 23: a pump needs about 200 mA, and a Pi pin only a few mA.', 'पंप पहले से अपनी 6 V बैटरी और GPIO 23 के रिले से जुड़ा है: पंप को लगभग 200 mA चाहिए, और Pi का पिन सिर्फ़ कुछ mA देता है।', 'Pump pehle se apni 6 V battery aur GPIO 23 ke relay se juda hai: pump ko lagbhag 200 mA chahiye, aur Pi ka pin sirf kuch mA deta hai.'),
  pi: { imp: ['OutputDevice'], decl: ['relay = OutputDevice(23)     # GPIO 23: the pump\'s relay, on = pump on'], on: ['relay.on()'], off: ['relay.off()'] } });
QOUT.servo = Object.assign({}, OUT.servo, { pin: 'GPIO12', wires: [['T:sv1:GND', 'H:tn40'], ['T:sv1:VP', 'H:tp40'], ['T:sv1:SIG', 'GPIO12']],
  ready: t3('The servo is already wired: brown to −, red to the 5 V rail, orange (signal) to GPIO 12. An SG90 wants pulses from 0.5 to 2.5 ms, so the code tells AngularServo so.', 'सर्वो पहले से लगा है: भूरा − पर, लाल 5 V रेल पर, नारंगी (सिग्नल) GPIO 12 पर। SG90 को 0.5 से 2.5 ms की पल्स चाहिए, इसलिए कोड AngularServo को यही बताता है।', 'Servo pehle se laga hai: brown − par, laal 5 V rail par, orange (signal) GPIO 12 par. SG90 ko 0.5 se 2.5 ms ki pulse chahiye, isliye code AngularServo ko yahi batata hai.'),
  pi: { imp: ['AngularServo'], decl: ['arm = AngularServo(12, min_angle=0, max_angle=180, min_pulse_width=0.0005, max_pulse_width=0.0025)   # GPIO 12', 'arm.angle = 0'], on: ['arm.angle = 90'], off: ['arm.angle = 0'] } });
QOUT.rgb = Object.assign({}, OUT.rgb, rgbAt('GPIO5', 'GPIO6', 'GPIO13'), { pin: 'GPIO 5/6/13',
  ready: t3('The RGB LED is already wired: red to GPIO 5, green to GPIO 6, blue to GPIO 13, each through its resistor (100 Ω for green and blue: at 3.3 V they need a smaller one). Green means all is well.', 'RGB एलईडी पहले से लगी है: लाल GPIO 5, हरा GPIO 6, नीला GPIO 13 पर, हर एक अपने रेज़िस्टर से होकर (हरे और नीले के लिए 100 Ω: 3.3 V पर उन्हें छोटा रेज़िस्टर चाहिए)। हरा मतलब सब ठीक।', 'RGB LED pehle se lagi hai: laal GPIO 5, hara GPIO 6, neela GPIO 13 par, har ek apne resistor se hokar (hare aur neele ke liye 100 Ω: 3.3 V par unhe chhota resistor chahiye). Hara matlab sab theek.'),
  pi: { imp: ['LED'], decl: ['red = LED(5)                 # GPIO 5: the RGB LED\'s red', 'green = LED(6)               # GPIO 6: its green', 'blue = LED(13)               # GPIO 13: its blue (not used here)'], on: ['red.on()                     # red: warning', 'green.off()'], off: ['red.off()', 'green.on()                   # green: all well'] } });
function sketchPi(job, ik, ok) {
  const inp = QIN[ik], out = ok === 'relay' ? relayFor(QOUT[ok], job) : QOUT[ok], ip = inp.pi, op = out.pi;
  const gz = [...new Set([...(ip.imp || []), ...(op.imp || [])])];
  const L = [`# ${job.title.en}: ${inp.name.en} and ${out.name.en}`, `# ${job.why.en}`];
  if (gz.length) L.push(`from gpiozero import ${gz.join(', ')}`);
  L.push('import time', ...(ip.mods || []).map((m) => 'import ' + m), '', ...ip.decl, ...op.decl);
  if (inp.analog) L.push(`limit = ${inp.l0}                  # ${inp.note}`);
  else L.push('hold = 1.0                  # stay on this long after it stops (seconds)', 'last = None                 # when the sensor was last active');
  L.push('', 'while True:');
  if (inp.analog) {
    L.push(...ip.read.map((x) => '    ' + x), `    if ${inp.v} is None:`, '        time.sleep(2)', '        continue', `    print("${inp.label}:", ${inp.v})`, `    if ${inp.cond}:`, ...op.on.map((x) => '        ' + x), '    else:', ...op.off.map((x) => '        ' + x), (ip.sleep ? `    time.sleep(${ip.sleep})` : '    time.sleep(2)              # a DHT11 answers once every 2 s'));
  } else {
    L.push(`    if ${ip.trig}:`, '        last = time.monotonic()  # active now: start the hold time again', '    if last is not None and time.monotonic() - last < hold:', ...op.on.map((x) => '        ' + x), '    else:', ...op.off.map((x) => '        ' + x), '    time.sleep(0.05)');
  }
  L.push('');
  return L.join('\n');
}

function sketchPy(job, ik, ok) {
  const inp = PIN[ik], out = ok === 'relay' ? relayFor(POUT[ok], job) : POUT[ok], ip = inp.py, op = out.py;
  const mods = ['Pin']; if (ip.read && !ip.dht) mods.push('ADC'); if (op.decl.some((x) => x.includes('PWM('))) mods.push('PWM');
  const L = [`# ${job.title.en}: ${inp.name.en} and ${out.name.en}`, `# ${job.why.en}`, `from machine import ${mods.join(', ')}`, 'import time', ...(ip.imp || []), '', ...ip.decl, ...op.decl];
  if (inp.analog) L.push(`limit = ${inp.l0}             # ${inp.note}`);
  else L.push('hold = 1000                 # stay on this long after it stops (ms)', 'last = None                 # when the sensor was last active');
  L.push('', 'while True:');
  if (inp.analog) {
    L.push(...(Array.isArray(ip.read) ? ip.read : [ip.read]).map((x) => '    ' + x)); if (ip.dht) L.push(`    if ${inp.v} is None:`, '        time.sleep(2)', '        continue');
    L.push(`    print("${inp.label}:", ${inp.v})`, `    if ${inp.cond.replace('&&', 'and')}:`, ...op.on.map((x) => '        ' + x), '    else:', ...op.off.map((x) => '        ' + x), `    time.sleep(${(inp.delay || 200) / 1000})`);
  } else {
    L.push(`    if ${ip.trig}:`, '        last = time.ticks_ms()   # active now: start the hold time again', '    if last is not None and time.ticks_diff(time.ticks_ms(), last) < hold:', ...op.on.map((x) => '        ' + x), '    else:', ...op.off.map((x) => '        ' + x), '    time.sleep(0.05)');
  }
  L.push('');
  return L.join('\n');
}

// ------------------------------------------------------------------ the jobs: [key, sensor, outputs, title (en, hi, hg), why (en, hi, hg), LCD on, LCD off, class]
const J = (key, inp, outs, en, hi, hg, wen, whi, whg, on, off, cls) => ({ key, inp, outs, title: t3(en, hi, hg), why: t3(wen, whi, whg), on, off, cls });
export const JOBS = [
  J('doorbell', 'button', ['buzzer', 'lcd'], 'Doorbell', 'दरवाज़े की घंटी', 'Darwaze ki ghanti', 'A visitor presses the button and the house hears it.', 'मेहमान बटन दबाता है और घर में आवाज़ पहुँचती है।', 'Mehmaan button dabata hai aur ghar mein awaaz pahunchti hai.', 'Ding dong!', 'Welcome', 5),
  J('lightswitch', 'button', ['led', 'relay'], 'Push-button light', 'बटन वाली लाइट', 'Button wali light', 'A push button switches the light; it stays on a moment after you let go.', 'पुश बटन लाइट चलाता है; छोड़ने के बाद भी एक पल जलती रहती है।', 'Push button light chalata hai; chhodne ke baad bhi ek pal jalti rehti hai.', 'Light ON', 'Light off', 5),
  J('crossing', 'button', ['servo', 'lcd'], 'Pedestrian crossing barrier', 'पैदल पार करने का बैरियर', 'Pedestrian crossing barrier', 'A walker presses the button and the barrier stops the cars.', 'पैदल चलने वाला बटन दबाता है और बैरियर गाड़ियाँ रोकता है।', 'Paidal chalne wala button dabata hai aur barrier gaadiyan rokta hai.', 'WALK now', 'Wait', 6),
  J('gate', 'button', ['servo'], 'Push-button gate', 'बटन से खुलने वाला गेट', 'Button se khulne wala gate', 'The guard presses a button and the gate swings open.', 'गार्ड बटन दबाता है और गेट खुल जाता है।', 'Guard button dabata hai aur gate khul jaata hai.', 'Gate open', 'Gate shut', 6),
  J('nurse', 'button', ['buzzer', 'led', 'lcd'], 'Hospital bed call button', 'अस्पताल बेड कॉल बटन', 'Hospital bed call button', 'A patient presses the button and the nurse is called.', 'मरीज़ बटन दबाता है और नर्स को बुलाया जाता है।', 'Mareez button dabata hai aur nurse ko bulaya jaata hai.', 'Bed 1 calls!', 'All well', 6),
  J('dimmer', 'pot', ['led', 'relay'], 'Knob lamp switch', 'नॉब से लैंप स्विच', 'Knob se lamp switch', 'Turn the knob past a mark and the lamp comes on, like a regulator.', 'नॉब को निशान से आगे घुमाइए और लैंप जल जाता है, रेगुलेटर की तरह।', 'Knob ko nishaan se aage ghumaiye aur lamp jal jaata hai, regulator ki tarah.', 'Lamp ON', 'Lamp off', 5),
  J('tankmark', 'pot', ['buzzer', 'lcd'], 'Tank level alarm (float knob)', 'टंकी स्तर अलार्म (फ़्लोट नॉब)', 'Tank level alarm (float knob)', 'A float turns a knob as the water rises; past the mark, an alarm.', 'पानी बढ़ने पर फ़्लोट नॉब घुमाता है; निशान पार होते ही अलार्म।', 'Paani badhne par float knob ghumata hai; nishaan paar hote hi alarm.', 'Tank FULL!', 'Filling', 6),
  J('steer', 'pot', ['servo'], 'Knob steering', 'नॉब से स्टीयरिंग', 'Knob se steering', 'Past the mark, the knob swings the servo arm across.', 'निशान पार करते ही नॉब सर्वो की भुजा घुमा देता है।', 'Nishaan paar karte hi knob servo ki bhuja ghuma deta hai.', 'Turned', 'Straight', 6),
  J('nightlamp', 'ldr', ['relay', 'lcd'], 'Night lamp', 'नाइट लैंप', 'Night lamp', 'The room lamp switches itself on when it gets dark.', 'अँधेरा होने पर कमरे का लैंप अपने-आप जल जाता है।', 'Andhera hone par room ka lamp apne aap jal jaata hai.', 'Night: lamp ON', 'Day: lamp off', 6),
  J('streetlight', 'ldr', ['led', 'relay'], 'Automatic street light', 'स्वचालित स्ट्रीट लाइट', 'Automatic street light', 'Street lights should burn only at night, not all day.', 'स्ट्रीट लाइट सिर्फ़ रात में जलनी चाहिए, पूरे दिन नहीं।', 'Street light sirf raat mein jalni chahiye, poore din nahi.', 'Street ON', 'Street off', 6),
  J('curtain', 'ldr', ['servo'], 'Automatic curtain', 'स्वचालित पर्दा', 'Automatic parda', 'At dusk the curtain closes by itself.', 'शाम होते ही पर्दा अपने-आप बंद हो जाता है।', 'Shaam hote hi parda apne aap band ho jaata hai.', 'Closed', 'Open', 6),
  J('tripwire', 'ldr', ['buzzer', 'lcd'], 'Laser tripwire alarm', 'लेज़र ट्रिपवायर अलार्म', 'Laser tripwire alarm', 'A thief blocks the light beam on the LDR and the alarm sounds.', 'चोर एलडीआर पर पड़ती रोशनी रोकता है और अलार्म बजता है।', 'Chor LDR par padti roshni rokta hai aur alarm bajta hai.', 'INTRUDER!', 'Beam OK', 7),
  J('fridge', 'ldr', ['buzzer'], 'Cupboard light checker', 'अलमारी लाइट चेकर', 'Almari light checker', 'When the cupboard is shut and dark, a short beep says it is closed.', 'अलमारी बंद और अँधेरी हो तो छोटी बीप बताती है कि वह बंद है।', 'Almari band aur andheri ho to chhoti beep batati hai ki woh band hai.', 'Shut', 'Open', 6),
  J('toohot', 'lm35', ['buzzer', 'lcd', 'led'], 'Too-hot warning', 'ज़्यादा गर्मी की चेतावनी', 'Zyada garmi ki warning', 'Machines and classrooms need a warning when they get too hot.', 'मशीनों और कक्षाओं को ज़्यादा गर्म होने पर चेतावनी चाहिए।', 'Machines aur classes ko zyada garam hone par warning chahiye.', 'TOO HOT!', 'Temp OK', 6),
  J('coolfan', 'lm35', ['relay'], 'Automatic cooling fan', 'स्वचालित कूलिंग पंखा', 'Automatic cooling fan', 'The fan switches on only when the room is hot, saving electricity.', 'पंखा सिर्फ़ गर्म कमरे में चलता है, बिजली बचती है।', 'Pankha sirf garam room mein chalta hai, bijli bachti hai.', 'Fan ON', 'Fan off', 7),
  J('fever', 'lm35', ['lcd', 'led'], 'Fever check station', 'बुखार जाँच केंद्र', 'Fever check station', 'At the school gate, a high temperature is flagged at once.', 'स्कूल गेट पर ज़्यादा तापमान तुरंत दिख जाता है।', 'School gate par zyada taapmaan turant dikh jaata hai.', 'See the nurse', 'Normal', 7),
  J('vent', 'lm35', ['servo'], 'Greenhouse vent opener', 'ग्रीनहाउस खिड़की ओपनर', 'Greenhouse vent opener', 'When the greenhouse gets hot, the vent opens to let heat out.', 'ग्रीनहाउस गर्म होने पर खिड़की खुलती है ताकि गर्मी निकले।', 'Greenhouse garam hone par khidki khulti hai taaki garmi nikle.', 'Vent open', 'Vent shut', 7),
  J('parkbeep', 'sonar', ['lcd', 'led'], 'Parking distance warning', 'पार्किंग दूरी चेतावनी', 'Parking distance warning', 'A driver backing up is warned before touching the wall.', 'पीछे जाती गाड़ी के ड्राइवर को दीवार छूने से पहले चेतावनी मिलती है।', 'Peeche jaati gaadi ke driver ko deewar chhoone se pehle warning milti hai.', 'STOP!', 'Keep going', 6),
  J('dustbin', 'sonar', ['servo'], 'Smart dustbin lid', 'स्मार्ट डस्टबिन ढक्कन', 'Smart dustbin dhakkan', 'A hand comes near and the lid opens: no touching a dirty lid.', 'हाथ पास आते ही ढक्कन खुलता है: गंदे ढक्कन को छूना नहीं पड़ता।', 'Haath paas aate hi dhakkan khulta hai: gande dhakkan ko chhoona nahi padta.', 'Lid open', 'Lid shut', 6),
  J('blindstick', 'sonar', ['buzzer'], 'Blind stick (third eye)', 'नेत्रहीन छड़ी (तीसरी आँख)', 'Blind stick (teesri aankh)', 'A stick that beeps before a person who cannot see hits something.', 'एक छड़ी जो न देख पाने वाले व्यक्ति के टकराने से पहले बीप करती है।', 'Ek chhadi jo na dekh paane wale vyakti ke takraane se pehle beep karti hai.', 'Obstacle!', 'Clear', 7),
  J('door', 'sonar', ['servo'], 'Automatic door', 'स्वचालित दरवाज़ा', 'Automatic darwaza', 'Someone walks up and the door opens by itself.', 'कोई पास आता है और दरवाज़ा अपने-आप खुल जाता है।', 'Koi paas aata hai aur darwaza apne aap khul jaata hai.', 'Door open', 'Door shut', 7),
  J('distancing', 'sonar', ['buzzer', 'led'], 'Queue distance alarm', 'कतार दूरी अलार्म', 'Queue distance alarm', 'In a queue, it beeps if the next person stands too close.', 'कतार में अगला व्यक्ति बहुत पास खड़ा हो तो बीप होती है।', 'Kataar mein agla vyakti bahut paas khada ho to beep hoti hai.', 'Too close', 'OK', 7),
  J('thirst', 'soil', ['buzzer', 'led', 'lcd'], 'Plant thirst alarm', 'पौधे की प्यास का अलार्म', 'Paudhe ki pyaas ka alarm', 'The plant cannot ask for water, so the sensor asks for it.', 'पौधा पानी नहीं माँग सकता, इसलिए सेंसर माँगता है।', 'Paudha paani nahi maang sakta, isliye sensor maangta hai.', 'Water me!', 'Soil OK', 6),
  J('valve', 'soil', ['servo'], 'Garden sprinkler valve', 'बगीचे का स्प्रिंकलर वाल्व', 'Bagiche ka sprinkler valve', 'When the soil is dry, a servo opens the water valve.', 'मिट्टी सूखी हो तो सर्वो पानी का वाल्व खोलता है।', 'Mitti sookhi ho to servo paani ka valve kholta hai.', 'Valve open', 'Valve shut', 7),
  J('pumprelay', 'soil', ['pump'], 'Farm pump switch', 'खेत पंप स्विच', 'Khet pump switch', 'The farm pump runs only when the field is dry, saving water and power.', 'खेत का पंप सिर्फ़ सूखे खेत में चलता है, पानी और बिजली बचती है।', 'Khet ka pump sirf sookhe khet mein chalta hai, paani aur bijli bachti hai.', 'Pump ON', 'Pump off', 7),
  J('gasleak', 'gas', ['lcd', 'led'], 'Kitchen gas leak warning', 'रसोई गैस लीक चेतावनी', 'Kitchen gas leak warning', 'LPG has no smell of its own; a sensor warns before it is dangerous.', 'एलपीजी की अपनी कोई गंध नहीं होती; सेंसर ख़तरे से पहले चेतावनी देता है।', 'LPG ki apni koi gandh nahi hoti; sensor khatre se pehle warning deta hai.', 'GAS LEAK!', 'Air clean', 7),
  J('exhaust', 'gas', ['relay'], 'Exhaust fan on gas', 'गैस पर एग्ज़ॉस्ट पंखा', 'Gas par exhaust pankha', 'When gas is found, the exhaust fan blows it out of the kitchen.', 'गैस मिलते ही एग्ज़ॉस्ट पंखा उसे रसोई से बाहर निकालता है।', 'Gas milte hi exhaust pankha use kitchen se bahar nikalta hai.', 'Exhaust ON', 'Exhaust off', 8),
  J('valveshut', 'gas', ['servo'], 'Gas valve shut-off', 'गैस वाल्व बंद', 'Gas valve band', 'On a leak, a servo turns the cylinder valve off.', 'लीक होने पर सर्वो सिलेंडर का वाल्व बंद कर देता है।', 'Leak hone par servo cylinder ka valve band kar deta hai.', 'Valve OFF', 'Valve on', 8),
  J('roomlight', 'pir', ['relay', 'led'], 'Automatic room light', 'स्वचालित कमरे की लाइट', 'Automatic room ki light', 'The light comes on when someone enters and goes off when the room is empty.', 'कोई आए तो लाइट जलती है, कमरा ख़ाली हो तो बुझ जाती है।', 'Koi aaye to light jalti hai, room khaali ho to bujh jaati hai.', 'Light ON', 'Empty room', 7),
  J('greeter', 'pir', ['servo', 'lcd'], 'Welcome greeter', 'स्वागत करने वाला', 'Welcome greeter', 'A visitor walks in and a robot arm waves hello.', 'मेहमान आता है और रोबोट की भुजा हाथ हिलाकर स्वागत करती है।', 'Mehmaan aata hai aur robot ki bhuja haath hilaakar swagat karti hai.', 'Welcome!', 'Hello', 7),
  J('intruder', 'pir', ['lcd'], 'Intruder alert screen', 'घुसपैठिया चेतावनी स्क्रीन', 'Intruder alert screen', 'The guard\'s screen shows when someone moves in the store room.', 'स्टोर रूम में कोई हिले तो गार्ड की स्क्रीन पर दिखता है।', 'Store room mein koi hile to guard ki screen par dikhta hai.', 'MOTION!', 'All quiet', 7),
  J('sanitiser', 'ir', ['servo', 'pump'], 'Automatic hand sanitiser', 'स्वचालित हैंड सैनिटाइज़र', 'Automatic hand sanitiser', 'Put a hand under it and it sprays: no one touches the bottle.', 'हाथ नीचे रखिए और यह छिड़कता है: बोतल कोई नहीं छूता।', 'Haath neeche rakhiye aur yeh chhidakta hai: bottle koi nahi chhoota.', 'Spraying', 'Ready', 6),
  J('tap', 'ir', ['servo'], 'Smart tap', 'स्मार्ट नल', 'Smart nal', 'Water flows only while hands are under the tap.', 'पानी सिर्फ़ तब बहता है जब हाथ नल के नीचे हों।', 'Paani sirf tab behta hai jab haath nal ke neeche hon.', 'Water on', 'Water off', 6),
  J('slot', 'ir', ['led', 'lcd'], 'Parking slot sensor', 'पार्किंग स्लॉट सेंसर', 'Parking slot sensor', 'A light over each slot shows drivers which places are taken.', 'हर स्लॉट के ऊपर की लाइट ड्राइवरों को बताती है कि कौन-सी जगह भरी है।', 'Har slot ke upar ki light drivers ko batati hai ki kaun si jagah bhari hai.', 'Slot taken', 'Slot free', 6),
  J('levelcross', 'ir', ['servo', 'buzzer'], 'Railway level crossing', 'रेलवे फाटक', 'Railway phatak', 'A train reaches the sensor and the crossing gate comes down.', 'ट्रेन सेंसर तक पहुँचती है और फाटक बंद हो जाता है।', 'Train sensor tak pahunchti hai aur phatak band ho jaata hai.', 'TRAIN!', 'Road open', 7),
  J('stairs', 'button', ['relay', 'led'], 'Stair light with a timer', 'टाइमर वाली सीढ़ी की लाइट', 'Timer wali seedhi ki light', 'Press once at the bottom of the stairs; the light stays on long enough to climb, then saves power.', 'सीढ़ी के नीचे एक बार दबाइए; लाइट चढ़ने भर तक जलती है, फिर बिजली बचाती है।', 'Seedhi ke neeche ek baar dabaiye; light chadhne bhar tak jalti hai, phir bijli bachati hai.', 'Stairs lit', 'Stairs dark', 6),
  J('panic', 'button', ['buzzer', 'rgb'], 'Panic button for a shop', 'दुकान का पैनिक बटन', 'Dukaan ka panic button', 'A shopkeeper in danger presses a hidden button and an alarm goes off.', 'ख़तरे में दुकानदार एक छिपा बटन दबाता है और अलार्म बज उठता है।', 'Khatre mein dukaandaar ek chhipa button dabata hai aur alarm baj uthta hai.', 'HELP!', 'Shop open', 6),
  J('heaterset', 'pot', ['relay', 'rgb'], 'Heater set-point knob', 'हीटर सेट-पॉइंट नॉब', 'Heater set-point knob', 'Turn the knob past the mark to switch the water heater on.', 'नॉब को निशान से आगे घुमाइए और पानी का हीटर चालू हो जाता है।', 'Knob ko nishaan se aage ghumaiye aur paani ka heater on ho jaata hai.', 'Heater ON', 'Heater off', 6),
  J('growlight', 'ldr', ['rgb', 'relay'], 'Grow light for plants', 'पौधों की ग्रो लाइट', 'Paudhon ki grow light', 'When daylight fades, a lamp keeps the seedlings growing.', 'दिन की रोशनी कम होते ही एक लैंप पौधों को बढ़ने देता है।', 'Din ki roshni kam hote hi ek lamp paudhon ko badhne deta hai.', 'Grow lamp ON', 'Sunlight OK', 6),
  J('sunrise', 'ldrb', ['buzzer', 'lcd'], 'Sunrise alarm', 'सूर्योदय अलार्म', 'Suryoday alarm', 'The first light of the morning wakes you up.', 'सुबह की पहली रोशनी आपको जगाती है।', 'Subah ki pehli roshni aapko jagati hai.', 'Good morning!', 'Night', 6),
  J('fridgeopen', 'ldrb', ['buzzer', 'led'], 'Fridge door left open alarm', 'फ़्रिज का दरवाज़ा खुला रहने का अलार्म', 'Fridge ka darwaza khula rehne ka alarm', 'Inside a closed fridge it is dark; light means the door is open, so it beeps.', 'बंद फ़्रिज के अंदर अँधेरा रहता है; रोशनी मतलब दरवाज़ा खुला है, इसलिए बीप होती है।', 'Band fridge ke andar andhera rehta hai; roshni matlab darwaza khula hai, isliye beep hoti hai.', 'Door OPEN!', 'Door shut', 6),
  J('blinds', 'ldrb', ['servo'], 'Sun blind closer', 'धूप वाला ब्लाइंड', 'Dhoop wala blind', 'In strong sun the blind closes to keep the classroom cool.', 'तेज़ धूप में ब्लाइंड बंद होकर कक्षा को ठंडा रखता है।', 'Tez dhoop mein blind band hokar class ko thanda rakhta hai.', 'Blind shut', 'Blind open', 6),
  J('incubator', 'cold', ['relay', 'lcd'], 'Egg incubator heater', 'अंडा इनक्यूबेटर हीटर', 'Anda incubator heater', 'Eggs need steady warmth: the heater comes on when the box gets cold.', 'अंडों को लगातार गर्मी चाहिए: डिब्बा ठंडा होते ही हीटर चालू होता है।', 'Andon ko lagaataar garmi chahiye: dabba thanda hote hi heater on hota hai.', 'Heater ON', 'Warm enough', 7),
  J('frost', 'cold', ['buzzer', 'rgb'], 'Frost alarm for crops', 'फ़सल के लिए पाला अलार्म', 'Fasal ke liye paala alarm', 'Frost kills young crops; the farmer is warned on a cold night.', 'पाला कच्ची फ़सल को मार देता है; ठंडी रात में किसान को चेतावनी मिलती है।', 'Paala kachchi fasal ko maar deta hai; thandi raat mein kisaan ko warning milti hai.', 'FROST!', 'No frost', 7),
  J('tankfull', 'sonar', ['buzzer', 'lcd'], 'Water tank full alarm', 'पानी की टंकी भरने का अलार्म', 'Paani ki tanki bharne ka alarm', 'A sensor looks down into the tank: when the water comes close, the tank is full.', 'सेंसर टंकी में नीचे देखता है: पानी पास आए तो टंकी भरी है।', 'Sensor tanki mein neeche dekhta hai: paani paas aaye to tanki bhari hai.', 'TANK FULL', 'Filling', 7),
  J('waterplant', 'soil', ['pump'], 'Automatic plant watering', 'स्वचालित पौधा सिंचाई', 'Automatic paudha sinchai', 'The pump waters the plant only when its soil is dry.', 'पंप पौधे को सिर्फ़ तब पानी देता है जब मिट्टी सूखी हो।', 'Pump paudhe ko sirf tab paani deta hai jab mitti sookhi ho.', 'Watering', 'Soil OK', 7),
  J('soillamp', 'soil', ['rgb'], 'Soil health lamp', 'मिट्टी की सेहत का लैंप', 'Mitti ki sehat ka lamp', 'Green: the soil is fine; red: it needs water.', 'हरा: मिट्टी ठीक है; लाल: पानी चाहिए।', 'Hara: mitti theek hai; laal: paani chahiye.', 'Dry!', 'Soil OK', 6),
  J('bottle', 'ir', ['pump'], 'Bottle filling station', 'बोतल भरने का स्टेशन', 'Bottle bharne ka station', 'Put a bottle under the spout and water flows; take it away and it stops.', 'नल के नीचे बोतल रखिए और पानी बहता है; हटाइए तो रुक जाता है।', 'Nal ke neeche bottle rakhiye aur paani behta hai; hataiye to ruk jaata hai.', 'Filling', 'Ready', 7),
  J('airlamp', 'gas', ['rgb'], 'Air quality lamp', 'हवा की गुणवत्ता का लैंप', 'Hawa ki quality ka lamp', 'A lamp in the corridor turns red when the air is not safe.', 'हवा सुरक्षित न हो तो गलियारे का लैंप लाल हो जाता है।', 'Hawa surakshit na ho to galiyare ka lamp laal ho jaata hai.', 'Bad air', 'Clean air', 7),
  J('classfan', 'pir', ['relay'], 'Classroom energy saver', 'कक्षा बिजली बचाने वाला', 'Class bijli bachane wala', 'Fans and lights run only while someone is in the classroom.', 'पंखे और लाइट तभी चलते हैं जब कक्षा में कोई हो।', 'Pankhe aur light tabhi chalte hain jab class mein koi ho.', 'Class in use', 'Empty: off', 7),
  J('heatwave', 'dht', ['lcd', 'rgb', 'buzzer'], 'Heat-wave warning', 'लू की चेतावनी', 'Loo ki warning', 'In a heat wave the school is told to keep children indoors and drinking water.', 'लू में स्कूल को बताया जाता है कि बच्चों को अंदर रखें और पानी पिलाएँ।', 'Loo mein school ko bataya jaata hai ki bachchon ko andar rakhein aur paani pilayein.', 'HEAT WAVE', 'Weather OK', 7),
  J('greenfan', 'dht', ['relay', 'servo'], 'Greenhouse cooling', 'ग्रीनहाउस कूलिंग', 'Greenhouse cooling', 'When the greenhouse air gets hot, the fan or the vent cools it.', 'ग्रीनहाउस की हवा गर्म होते ही पंखा या खिड़की उसे ठंडा करती है।', 'Greenhouse ki hawa garam hote hi pankha ya khidki use thanda karti hai.', 'Cooling', 'Temp OK', 8),
  J('grainstore', 'hum', ['buzzer', 'lcd', 'rgb'], 'Grain store humidity alert', 'अनाज भंडार नमी चेतावनी', 'Anaaj bhandaar nami warning', 'Damp air spoils stored grain; the storekeeper is warned in time.', 'नम हवा रखे अनाज को ख़राब करती है; भंडारी को समय पर चेतावनी मिलती है।', 'Nam hawa rakhe anaaj ko kharaab karti hai; bhandaari ko samay par warning milti hai.', 'TOO DAMP', 'Store dry', 8),
  J('bathfan', 'hum', ['relay'], 'Bathroom steam fan', 'बाथरूम भाप पंखा', 'Bathroom bhaap pankha', 'Steam from a hot shower switches the exhaust fan on.', 'गर्म पानी की भाप से एग्ज़ॉस्ट पंखा चालू हो जाता है।', 'Garam paani ki bhaap se exhaust pankha on ho jaata hai.', 'Fan ON', 'Fan off', 8),
  J('handwash', 'button', ['pump'], 'Push-button hand-wash tap', 'बटन वाला हाथ धोने का नल', 'Button wala haath dhone ka nal', 'Press once: water runs for a few seconds, enough to wash, and then stops by itself.', 'एक बार दबाइए: पानी कुछ सेकंड बहता है, हाथ धोने भर, फिर अपने-आप रुक जाता है।', 'Ek baar dabaiye: paani kuch second behta hai, haath dhone bhar, phir apne aap ruk jaata hai.', 'Water on', 'Water off', 7),
  J('watchman', 'button', ['rgb', 'lcd'], 'Gate call for the watchman', 'चौकीदार के लिए गेट कॉल', 'Chowkidaar ke liye gate call', 'A visitor at the gate presses the button and the watchman\'s light turns red.', 'गेट पर आया व्यक्ति बटन दबाता है और चौकीदार की लाइट लाल हो जाती है।', 'Gate par aaya vyakti button dabata hai aur chowkidaar ki light laal ho jaati hai.', 'Visitor!', 'Gate quiet', 6),
  J('fanmark', 'pot', ['relay'], 'Fan regulator with an on mark', 'ऑन निशान वाला पंखा रेगुलेटर', 'On nishaan wala pankha regulator', 'Past the mark on the dial, the fan switches on.', 'डायल पर निशान से आगे पंखा चालू हो जाता है।', 'Dial par nishaan se aage pankha on ho jaata hai.', 'Fan ON', 'Fan off', 6),
  J('shopsign', 'ldr', ['relay', 'rgb'], 'Shop sign that lights at dusk', 'शाम को जलने वाला दुकान का बोर्ड', 'Shaam ko jalne wala dukaan ka board', 'The shop board lights up by itself when evening falls.', 'शाम होते ही दुकान का बोर्ड अपने-आप जल उठता है।', 'Shaam hote hi dukaan ka board apne aap jal uthta hai.', 'Sign ON', 'Sign off', 6),
  J('henhouse', 'ldr', ['servo'], 'Hen-house door at dusk', 'शाम को मुर्ग़ीघर का दरवाज़ा', 'Shaam ko murgighar ka darwaza', 'At dusk the door closes to keep the hens safe from animals at night.', 'शाम को दरवाज़ा बंद होता है ताकि रात में मुर्ग़ियाँ जानवरों से सुरक्षित रहें।', 'Shaam ko darwaza band hota hai taaki raat mein murgiyan jaanwaron se surakshit rahein.', 'Door shut', 'Door open', 7),
  J('bikelamp', 'ldr', ['led', 'buzzer'], 'Bicycle lamp reminder', 'साइकिल लैंप याद दिलाने वाला', 'Cycle lamp yaad dilane wala', 'When it gets dark on the road, the cycle lamp comes on and a beep reminds the rider.', 'सड़क पर अँधेरा होते ही साइकिल का लैंप जलता है और बीप सवार को याद दिलाती है।', 'Sadak par andhera hote hi cycle ka lamp jalta hai aur beep sawaar ko yaad dilati hai.', 'Lamp ON', 'Lamp off', 6),
  J('drawer', 'ldrb', ['buzzer', 'rgb'], 'Locker drawer opened alarm', 'लॉकर दराज़ खुलने का अलार्म', 'Locker daraaz khulne ka alarm', 'Inside a shut drawer it is dark; if light gets in, someone opened it.', 'बंद दराज़ में अँधेरा रहता है; रोशनी आए तो किसी ने उसे खोला है।', 'Band daraaz mein andhera rehta hai; roshni aaye to kisi ne use khola hai.', 'OPENED!', 'Locked', 7),
  J('serverroom', 'lm35', ['buzzer', 'rgb', 'relay'], 'Computer lab overheat alarm', 'कंप्यूटर लैब ज़्यादा गर्मी अलार्म', 'Computer lab zyada garmi alarm', 'Computers fail when the room gets too hot; the alarm calls for help in time.', 'कमरा बहुत गर्म हो तो कंप्यूटर ख़राब होते हैं; अलार्म समय पर मदद बुलाता है।', 'Room bahut garam ho to computer kharaab hote hain; alarm samay par madad bulata hai.', 'OVERHEAT', 'Room cool', 7),
  J('batteryhot', 'lm35', ['buzzer', 'rgb'], 'Battery overheat warning', 'बैटरी ज़्यादा गर्म होने की चेतावनी', 'Battery zyada garam hone ki warning', 'A battery that gets too hot while charging can catch fire: unplug it at the warning.', 'चार्ज होते समय बहुत गर्म हुई बैटरी में आग लग सकती है: चेतावनी पर उसे निकाल दीजिए।', 'Charge hote samay bahut garam hui battery mein aag lag sakti hai: warning par use nikaal dijiye.', 'UNPLUG NOW', 'Charging', 8),
  J('teacool', 'cold', ['buzzer', 'lcd'], 'Tea is cool enough', 'चाय पीने लायक ठंडी', 'Chai peene layak thandi', 'Hot tea burns the tongue; a beep says it has cooled enough to drink.', 'गर्म चाय जीभ जला देती है; बीप बताती है कि अब पीने लायक ठंडी है।', 'Garam chai jeebh jala deti hai; beep batati hai ki ab peene layak thandi hai.', 'Drink now', 'Too hot', 6),
  J('fishtank', 'cold', ['relay', 'rgb'], 'Fish tank heater', 'मछली टैंक हीटर', 'Machhli tank heater', 'Tropical fish need warm water: the heater runs when the tank gets cold.', 'गर्म देशों की मछलियों को गर्म पानी चाहिए: टैंक ठंडा होते ही हीटर चलता है।', 'Garam deshon ki machhliyon ko garam paani chahiye: tank thanda hote hi heater chalta hai.', 'Heater ON', 'Water warm', 7),
  J('garage', 'sonar', ['servo', 'buzzer'], 'Garage door opener', 'गैराज दरवाज़ा ओपनर', 'Garage darwaza opener', 'The car comes close and the garage door opens for it.', 'गाड़ी पास आती है और गैराज का दरवाज़ा उसके लिए खुल जाता है।', 'Gaadi paas aati hai aur garage ka darwaza uske liye khul jaata hai.', 'Door open', 'Door shut', 7),
  J('shopchime', 'sonar', ['buzzer', 'rgb'], 'Shop entry chime', 'दुकान प्रवेश घंटी', 'Dukaan pravesh ghanti', 'A customer walks up to the counter and a chime tells the shopkeeper.', 'ग्राहक काउंटर तक आता है और घंटी दुकानदार को बताती है।', 'Graahak counter tak aata hai aur ghanti dukaandaar ko batati hai.', 'Customer!', 'Waiting', 6),
  J('paddy', 'soil', ['pump', 'lcd'], 'Paddy field water keeper', 'धान के खेत का पानी रखवाला', 'Dhaan ke khet ka paani rakhwala', 'Paddy needs wet soil all the time; the pump tops it up when it dries.', 'धान को हर समय गीली मिट्टी चाहिए; सूखने पर पंप पानी भर देता है।', 'Dhaan ko har samay geeli mitti chahiye; sookhne par pump paani bhar deta hai.', 'Field dry', 'Field wet', 7),
  J('smoke', 'gas', ['buzzer', 'rgb'], 'Smoke alarm', 'धुआँ अलार्म', 'Dhuaan alarm', 'The MQ-2 also smells smoke: a fire is caught early.', 'MQ-2 धुआँ भी सूँघता है: आग जल्दी पकड़ी जाती है।', 'MQ-2 dhuaan bhi soonghta hai: aag jaldi pakdi jaati hai.', 'SMOKE!', 'Air clean', 7),
  J('fumehood', 'gas', ['relay', 'lcd'], 'Science lab fume fan', 'विज्ञान लैब धुआँ पंखा', 'Science lab dhuaan pankha', 'When an experiment gives off fumes, the fan pulls them out of the lab.', 'प्रयोग से धुआँ निकले तो पंखा उसे लैब से बाहर खींचता है।', 'Prayog se dhuaan nikle to pankha use lab se bahar kheenchta hai.', 'Fan ON', 'Fan off', 8),
  J('bathlight', 'pir', ['relay', 'rgb'], 'Bathroom light that switches off itself', 'अपने-आप बुझने वाली बाथरूम लाइट', 'Apne aap bujhne wali bathroom light', 'Nobody forgets the light again: it goes off a while after the last movement.', 'अब कोई लाइट बंद करना नहीं भूलता: आख़िरी हलचल के कुछ देर बाद यह बुझ जाती है।', 'Ab koi light band karna nahi bhoolta: aakhiri halchal ke kuch der baad yeh bujh jaati hai.', 'Light ON', 'Light off', 7),
  J('farmgate', 'pir', ['buzzer', 'rgb'], 'Farm gate animal alert', 'खेत के गेट पर जानवर चेतावनी', 'Khet ke gate par jaanwar warning', 'A stray animal at the field gate at night sets off an alarm.', 'रात में खेत के गेट पर आवारा जानवर आए तो अलार्म बजता है।', 'Raat mein khet ke gate par aawara jaanwar aaye to alarm bajta hai.', 'ANIMAL!', 'All quiet', 7),
  J('exhibit', 'pir', ['led', 'servo'], 'Museum exhibit that wakes up', 'जागने वाली संग्रहालय प्रदर्शनी', 'Jaagne wali museum exhibit', 'The exhibit lights and moves only when a visitor comes near, saving power.', 'प्रदर्शनी तभी जलती और हिलती है जब कोई दर्शक पास आए, बिजली बचती है।', 'Exhibit tabhi jalti aur hilti hai jab koi darshak paas aaye, bijli bachti hai.', 'Showing', 'Resting', 7),
  J('mailbox', 'ir', ['led', 'buzzer'], 'Letter-box alert', 'लेटर-बॉक्स चेतावनी', 'Letter-box warning', 'A letter drops past the sensor and the house knows the post has come.', 'चिट्ठी सेंसर के आगे से गिरती है और घर को पता चलता है कि डाक आई है।', 'Chitthi sensor ke aage se girti hai aur ghar ko pata chalta hai ki daak aayi hai.', 'Post came', 'No post', 6),
  J('handdryer', 'ir', ['relay'], 'Hand dryer', 'हैंड ड्रायर', 'Hand dryer', 'Hands under the dryer switch its fan on; take them away and it stops soon after.', 'ड्रायर के नीचे हाथ आते ही पंखा चलता है; हटाने के कुछ देर बाद रुक जाता है।', 'Dryer ke neeche haath aate hi pankha chalta hai; hatane ke kuch der baad ruk jaata hai.', 'Drying', 'Ready', 7),
  J('turnstile', 'ir', ['servo', 'lcd'], 'Turnstile gate', 'टर्नस्टाइल गेट', 'Turnstile gate', 'A person reaches the gate and the arm swings to let one through.', 'व्यक्ति गेट तक पहुँचता है और भुजा घूमकर एक को निकलने देती है।', 'Vyakti gate tak pahunchta hai aur bhuja ghoomkar ek ko nikalne deti hai.', 'Go through', 'Wait', 7),
  J('booksdamp', 'hum', ['rgb', 'buzzer'], 'Library damp alarm', 'पुस्तकालय नमी अलार्म', 'Library nami alarm', 'Monsoon damp grows mould on books; the librarian is warned to air the room.', 'बरसात की नमी किताबों पर फफूँद लाती है; लाइब्रेरियन को कमरा हवादार करने की चेतावनी मिलती है।', 'Barsaat ki nami kitaabon par phaphoond laati hai; librarian ko room hawadaar karne ki warning milti hai.', 'TOO DAMP', 'Books OK', 8),
  J('coolroom', 'dht', ['relay'], 'Server cupboard cooler', 'सर्वर अलमारी कूलर', 'Server almari cooler', 'The cupboard fan runs only when its air gets hot.', 'अलमारी का पंखा तभी चलता है जब उसकी हवा गर्म हो।', 'Almari ka pankha tabhi chalta hai jab uski hawa garam ho.', 'Cooling', 'Temp OK', 8),
  J('liftcall', 'button', ['led', 'buzzer'], 'Lift call button', 'लिफ़्ट बुलाने का बटन', 'Lift bulane ka button', 'Press the call button: its light stays on so you know the lift is coming.', 'बुलाने का बटन दबाइए: उसकी लाइट जलती रहती है ताकि पता रहे कि लिफ़्ट आ रही है।', 'Bulane ka button dabaiye: uski light jalti rehti hai taaki pata rahe ki lift aa rahi hai.', 'Lift coming', 'Lift free', 6),
  J('panelshade', 'ldr', ['buzzer', 'lcd'], 'Solar panel shade alarm', 'सोलर पैनल छाया अलार्म', 'Solar panel chhaya alarm', 'A shaded solar panel makes little power; the alarm says something is covering it.', 'छाया में सोलर पैनल कम बिजली बनाता है; अलार्म बताता है कि कुछ उसे ढक रहा है।', 'Chhaya mein solar panel kam bijli banata hai; alarm batata hai ki kuch use dhak raha hai.', 'Panel shaded', 'Full sun', 7),
  J('tunnel', 'ldr', ['led', 'relay'], 'Car headlights in a tunnel', 'सुरंग में गाड़ी की हेडलाइट', 'Surang mein gaadi ki headlight', 'Entering a dark tunnel, the headlights switch on by themselves.', 'अँधेरी सुरंग में घुसते ही हेडलाइट अपने-आप जल जाती है।', 'Andheri surang mein ghuste hi headlight apne aap jal jaati hai.', 'Lights ON', 'Lights off', 6),
  J('lighthouse', 'ldr', ['rgb', 'relay'], 'Lighthouse lamp', 'लाइटहाउस लैंप', 'Lighthouse lamp', 'The lighthouse lamp shines for ships only after sunset.', 'लाइटहाउस का लैंप जहाज़ों के लिए सिर्फ़ सूरज ढलने के बाद जलता है।', 'Lighthouse ka lamp jahaazon ke liye sirf sooraj dhalne ke baad jalta hai.', 'Lamp ON', 'Day', 6),
  J('solarpump', 'ldrb', ['pump'], 'Solar-time water pump', 'धूप के समय चलने वाला पानी पंप', 'Dhoop ke samay chalne wala paani pump', 'A solar pump should run only while the sun is strong.', 'सोलर पंप सिर्फ़ तेज़ धूप में चलना चाहिए।', 'Solar pump sirf tez dhoop mein chalna chahiye.', 'Pumping', 'No sun', 7),
  J('darkroom', 'ldrb', ['buzzer', 'lcd'], 'Darkroom light alarm', 'डार्करूम लाइट अलार्म', 'Darkroom light alarm', 'In a darkroom or a seed store, light getting in is a problem: it beeps.', 'डार्करूम या बीज भंडार में रोशनी आना समस्या है: यह बीप करता है।', 'Darkroom ya beej bhandaar mein roshni aana samasya hai: yeh beep karta hai.', 'LIGHT IN!', 'Dark OK', 7),
  J('milkchill', 'lm35', ['buzzer', 'lcd', 'rgb'], 'Milk chiller alarm', 'दूध चिलर अलार्म', 'Doodh chiller alarm', 'Milk spoils when the chiller warms up; the dairy is warned at once.', 'चिलर गर्म होने पर दूध ख़राब होता है; डेयरी को तुरंत चेतावनी मिलती है।', 'Chiller garam hone par doodh kharaab hota hai; dairy ko turant warning milti hai.', 'MILK WARM!', 'Chilled', 7),
  J('engine', 'lm35', ['rgb', 'led'], 'Engine overheat light', 'इंजन ज़्यादा गर्म होने की लाइट', 'Engine zyada garam hone ki light', 'A warning light tells the driver to stop before the engine is damaged.', 'चेतावनी लाइट ड्राइवर को इंजन ख़राब होने से पहले रुकने को कहती है।', 'Warning light driver ko engine kharaab hone se pehle rukne ko kehti hai.', 'STOP: HOT', 'Engine OK', 7),
  J('thermostat', 'cold', ['relay', 'led'], 'Room heater thermostat', 'रूम हीटर थर्मोस्टेट', 'Room heater thermostat', 'The heater runs only while the room is cold, then rests.', 'हीटर तभी चलता है जब कमरा ठंडा हो, फिर रुक जाता है।', 'Heater tabhi chalta hai jab room thanda ho, phir ruk jaata hai.', 'Heating', 'Warm', 7),
  J('frostcover', 'cold', ['servo'], 'Frost cover for seedlings', 'पौधों के लिए पाला कवर', 'Paudhon ke liye paala cover', 'On a cold night a servo pulls a cover over the seedlings.', 'ठंडी रात में सर्वो पौधों पर कवर खींच देता है।', 'Thandi raat mein servo paudhon par cover kheench deta hai.', 'Covered', 'Open', 7),
  J('cattlemist', 'dht', ['pump'], 'Cattle shed mist cooler', 'पशु शेड मिस्ट कूलर', 'Pashu shed mist cooler', 'In hot weather a fine water spray keeps the animals cool.', 'गर्म मौसम में पानी की हल्की फुहार पशुओं को ठंडा रखती है।', 'Garam mausam mein paani ki halki phuhaar pashuon ko thanda rakhti hai.', 'Misting', 'Cool', 8),
  J('rainsoon', 'hum', ['lcd', 'rgb'], 'Rain-coming hint', 'बारिश आने का संकेत', 'Baarish aane ka sanket', 'Air gets very humid before rain: a hint to bring the clothes in.', 'बारिश से पहले हवा में बहुत नमी हो जाती है: कपड़े अंदर लाने का संकेत।', 'Baarish se pehle hawa mein bahut nami ho jaati hai: kapde andar laane ka sanket.', 'Rain soon?', 'Dry air', 8),
  J('trucks', 'sonar', ['buzzer', 'rgb'], 'Low bridge height warning', 'नीचे पुल की ऊँचाई चेतावनी', 'Neeche pul ki oonchai warning', 'A sensor under the bridge warns when a tall truck comes too close to the top.', 'पुल के नीचे का सेंसर ऊँचे ट्रक के ऊपर से बहुत पास आने पर चेतावनी देता है।', 'Pul ke neeche ka sensor oonche truck ke upar se bahut paas aane par warning deta hai.', 'TOO TALL!', 'Clear', 7),
  J('carwash', 'sonar', ['pump'], 'Car wash sprinkler', 'कार वॉश स्प्रिंकलर', 'Car wash sprinkler', 'The car rolls in and the water spray starts by itself.', 'गाड़ी अंदर आती है और पानी की बौछार अपने-आप शुरू होती है।', 'Gaadi andar aati hai aur paani ki bauchhaar apne aap shuru hoti hai.', 'Washing', 'Waiting', 7),
  J('treeguard', 'soil', ['lcd', 'buzzer'], 'Tree sapling water reminder', 'पौधे को पानी याद दिलाने वाला', 'Paudhe ko paani yaad dilane wala', 'New saplings along the road die in the dry season; this reminds the gardener.', 'सड़क के नए पौधे सूखे मौसम में मर जाते हैं; यह माली को याद दिलाता है।', 'Sadak ke naye paudhe sookhe mausam mein mar jaate hain; yeh maali ko yaad dilata hai.', 'Water tree!', 'Tree OK', 6),
  J('biogas', 'gas', ['lcd', 'rgb'], 'Biogas plant leak watch', 'बायोगैस प्लांट लीक निगरानी', 'Biogas plant leak nigraani', 'Methane from a biogas plant can catch fire; a leak is shown at once.', 'बायोगैस प्लांट की मीथेन आग पकड़ सकती है; लीक तुरंत दिखता है।', 'Biogas plant ki methane aag pakad sakti hai; leak turant dikhta hai.', 'METHANE!', 'Safe', 8),
  J('afterhours', 'pir', ['buzzer', 'lcd'], 'Shop after-hours alarm', 'दुकान बंद होने के बाद अलार्म', 'Dukaan band hone ke baad alarm', 'Once the shop is shut, any movement inside sounds the alarm.', 'दुकान बंद होने के बाद अंदर कोई भी हलचल अलार्म बजाती है।', 'Dukaan band hone ke baad andar koi bhi halchal alarm bajati hai.', 'ALARM!', 'Shop shut', 7),
  J('corridor', 'pir', ['led', 'relay'], 'Corridor night light', 'गलियारे की रात की लाइट', 'Galiyare ki raat ki light', 'At night the corridor lights only while someone walks through.', 'रात में गलियारा तभी रोशन होता है जब कोई गुज़रे।', 'Raat mein galiyara tabhi roshan hota hai jab koi guzre.', 'Light ON', 'Light off', 7),
  J('occupied', 'pir', ['rgb'], 'Washroom occupied light', 'वॉशरूम उपयोग में लाइट', 'Washroom upyog mein light', 'Red outside the door while someone is inside, green when it is free.', 'अंदर कोई हो तो दरवाज़े के बाहर लाल, ख़ाली हो तो हरा।', 'Andar koi ho to darwaze ke bahar laal, khaali ho to hara.', 'Occupied', 'Free', 7),
  J('piggybank', 'ir', ['buzzer', 'lcd'], 'Piggy bank coin chime', 'गुल्लक सिक्का घंटी', 'Gullak sikka ghanti', 'A coin drops past the sensor and the piggy bank says thank you.', 'सिक्का सेंसर के आगे से गिरता है और गुल्लक धन्यवाद कहती है।', 'Sikka sensor ke aage se girta hai aur gullak dhanyavaad kehti hai.', 'Thank you!', 'Save more', 6),
  J('soap', 'ir', ['pump'], 'Automatic soap dispenser', 'स्वचालित साबुन डिस्पेंसर', 'Automatic saabun dispenser', 'A hand under the nozzle gets liquid soap without touching anything.', 'नोज़ल के नीचे हाथ आते ही बिना कुछ छुए तरल साबुन मिलता है।', 'Nozzle ke neeche haath aate hi bina kuch chhuye taral saabun milta hai.', 'Soap!', 'Ready', 7),
  J('bookdrop', 'ir', ['led', 'buzzer'], 'Library book-drop alert', 'लाइब्रेरी बुक-ड्रॉप चेतावनी', 'Library book-drop warning', 'A returned book drops through the slot and the librarian is told.', 'लौटाई गई किताब स्लॉट से गिरती है और लाइब्रेरियन को पता चलता है।', 'Lautaayi gayi kitaab slot se girti hai aur librarian ko pata chalta hai.', 'Book in', 'Empty', 6),
  J('touchless', 'ir', ['buzzer', 'lcd'], 'Contactless doorbell', 'बिना छुए घंटी', 'Bina chhuye ghanti', 'Wave near the door and the bell rings: nothing to touch.', 'दरवाज़े के पास हाथ हिलाइए और घंटी बजती है: कुछ छूना नहीं।', 'Darwaze ke paas haath hilaiye aur ghanti bajti hai: kuch chhoona nahi.', 'Ding dong!', 'Welcome', 6),
  // batch 14: more jobs, from the projects schools build worldwide (ATL labs, maker sites, science fairs), written fresh for DUET
  J('busstop', 'button', ['led', 'buzzer', 'lcd'], 'Bus stop request bell', 'बस स्टॉप रुकने की घंटी', 'Bus stop rukne ki ghanti', 'A passenger presses the button and the driver knows to stop at the next stop.', 'यात्री बटन दबाता है और ड्राइवर जान जाता है कि अगले स्टॉप पर रुकना है।', 'Yatri button dabata hai aur driver jaan jaata hai ki agle stop par rukna hai.', 'STOP NEXT', 'Next stop', 5),
  J('elderhelp', 'button', ['buzzer', 'rgb'], 'Grandparent help button', 'बुज़ुर्गों का मदद बटन', 'Buzurgon ka madad button', 'An elderly person presses one big button and the family hears it from another room.', 'बुज़ुर्ग एक बड़ा बटन दबाते हैं और परिवार दूसरे कमरे में सुन लेता है।', 'Buzurg ek bada button dabaate hain aur parivaar doosre kamre mein sun leta hai.', 'HELP!', 'All fine', 5),
  J('orderready', 'button', ['lcd', 'led'], 'Canteen order-ready sign', 'कैंटीन ऑर्डर तैयार बोर्ड', 'Canteen order taiyaar board', 'The cook presses a button when the food is ready, so nobody crowds the counter.', 'खाना तैयार होने पर रसोइया बटन दबाता है, ताकि काउंटर पर भीड़ न लगे।', 'Khaana taiyaar hone par rasoiya button dabata hai, taaki counter par bheed na lage.', 'Order ready', 'Cooking...', 5),
  J('petfeeder', 'button', ['servo'], 'Pet feeder flap', 'पालतू जानवर का खाना फ़्लैप', 'Paaltu jaanwar ka khaana flap', 'Press the button and a flap opens for a moment to drop food into the bowl.', 'बटन दबाइए और एक फ़्लैप पल भर खुलकर कटोरे में खाना गिराता है।', 'Button dabaiye aur ek flap pal bhar khulkar katore mein khaana girata hai.', 'Feeding', 'Closed', 6),
  J('bucketfill', 'button', ['pump'], 'Push-to-fill bucket tap', 'दबाओ और बाल्टी भरो नल', 'Dabao aur balti bharo nal', 'One press runs the pump for a set time: the bucket fills and no water is wasted.', 'एक बार दबाने से पंप तय समय तक चलता है: बाल्टी भरती है और पानी बर्बाद नहीं होता।', 'Ek baar dabaane se pump tay samay tak chalta hai: balti bharti hai aur paani barbaad nahi hota.', 'Filling', 'Stopped', 6),
  J('quizbuzz', 'button', ['buzzer', 'led'], 'Quiz contest buzzer', 'क्विज़ प्रतियोगिता बज़र', 'Quiz competition buzzer', 'The team that presses first gets to answer: the buzzer and the light show who it was.', 'जो टीम पहले दबाती है वही जवाब देती है: बज़र और लाइट बताते हैं कि कौन था।', 'Jo team pehle dabaati hai wahi jawaab deti hai: buzzer aur light batate hain ki kaun tha.', 'Team A!', 'Ready', 5),
  J('labhelp', 'button', ['rgb', 'lcd'], 'Lab help-request light', 'लैब में मदद माँगने की लाइट', 'Lab mein madad maangne ki light', 'In a busy lab a group presses its button and the teacher sees who needs help.', 'भरी लैब में कोई टोली अपना बटन दबाती है और शिक्षक देख लेते हैं कि किसे मदद चाहिए।', 'Bhari lab mein koi toli apna button dabaati hai aur teacher dekh lete hain ki kise madad chahiye.', 'Need help', 'Working', 6),
  J('chemist', 'button', ['buzzer', 'led'], 'Chemist night bell', 'दवा की दुकान की रात की घंटी', 'Dawa ki dukaan ki raat ki ghanti', 'At night a customer presses the bell and the chemist sleeping upstairs comes down.', 'रात में ग्राहक घंटी दबाता है और ऊपर सोया दवा वाला नीचे आ जाता है।', 'Raat mein graahak ghanti dabata hai aur upar soya dawa wala neeche aa jaata hai.', 'Customer!', 'Shop shut', 5),
  J('scarecrow', 'pir', ['buzzer', 'servo'], 'Electronic scarecrow', 'इलेक्ट्रॉनिक बिजूका', 'Electronic bijooka', 'Birds and animals that come near the crop are scared off by a noise and a waving arm.', 'फ़सल के पास आने वाले पक्षी और जानवर आवाज़ और हिलते हाथ से डरकर भाग जाते हैं।', 'Fasal ke paas aane wale pakshi aur jaanwar awaaz aur hilte haath se darkar bhaag jaate hain.', 'Shoo!', 'Watching', 7),
  J('monkey', 'pir', ['buzzer', 'rgb'], 'Terrace monkey alarm', 'छत पर बंदर अलार्म', 'Chhat par bandar alarm', 'Monkeys on the terrace set off a loud alarm before they reach the clothes and the plants.', 'छत पर बंदर आते ही तेज़ अलार्म बजता है, इससे पहले कि वे कपड़ों और पौधों तक पहुँचें।', 'Chhat par bandar aate hi tez alarm bajta hai, isse pehle ki woh kapdon aur paudhon tak pahunchein.', 'MONKEY!', 'All clear', 7),
  J('babycot', 'pir', ['buzzer', 'lcd'], 'Baby cot watcher', 'बच्चे के पालने की निगरानी', 'Bachche ke paalne ki nigraani', 'When the baby wakes and moves, the parents in the next room hear a soft beep.', 'बच्चा जागकर हिलता है तो बगल के कमरे में माता-पिता को हल्की बीप सुनाई देती है।', 'Bachcha jaagkar hilta hai to bagal ke kamre mein mata-pita ko halki beep sunai deti hai.', 'Baby awake', 'Sleeping', 7),
  J('spotlight', 'pir', ['relay', 'led'], 'Security spotlight', 'सुरक्षा स्पॉटलाइट', 'Suraksha spotlight', 'Anyone walking into the compound at night is lit up by a bright lamp.', 'रात में अहाते में आने वाला हर कोई तेज़ रोशनी में आ जाता है।', 'Raat mein ahaate mein aane wala har koi tez roshni mein aa jaata hai.', 'Light ON', 'Dark', 7),
  J('elephant', 'pir', ['buzzer', 'rgb'], 'Wild elephant early warning', 'जंगली हाथी की पहले से चेतावनी', 'Jungli haathi ki pehle se chetaavni', 'Near forests, a sensor at the edge of the fields tells the village that elephants are close.', 'जंगल के पास खेतों के किनारे का सेंसर गाँव को बताता है कि हाथी पास हैं।', 'Jungle ke paas kheton ke kinaare ka sensor gaon ko batata hai ki haathi paas hain.', 'ELEPHANT!', 'Safe', 7),
  J('kiosk', 'pir', ['lcd'], 'Information kiosk wake-up', 'सूचना कियोस्क का जागना', 'Soochna kiosk ka jaagna', 'The kiosk screen sleeps to save power and wakes with a greeting when someone walks up.', 'कियोस्क की स्क्रीन बिजली बचाने के लिए सोती है और किसी के पास आने पर स्वागत के साथ जागती है।', 'Kiosk ki screen bijli bachaane ke liye soti hai aur kisi ke paas aane par swagat ke saath jaagti hai.', 'Hello! Ask me', 'Sleeping', 7),
  J('binfull', 'ir', ['led', 'buzzer', 'lcd'], 'Dustbin full indicator', 'कूड़ेदान भरा संकेतक', 'Koodedaan bhara sanketak', 'An IR sensor under the lid sees the rubbish reach the top: time to empty the bin.', 'ढक्कन के नीचे का आईआर सेंसर देखता है कि कचरा ऊपर तक आ गया: कूड़ेदान ख़ाली करने का समय।', 'Dhakkan ke neeche ka IR sensor dekhta hai ki kachra upar tak aa gaya: koodedaan khaali karne ka samay.', 'BIN FULL', 'Bin OK', 6),
  J('conveyor', 'ir', ['buzzer', 'led', 'lcd'], 'Conveyor box detector', 'कन्वेयर पर डिब्बा पहचानने वाला', 'Conveyor par dibba pehchaanne wala', 'Each box that passes on the factory belt is seen by the sensor and signalled.', 'फ़ैक्ट्री की पट्टी पर गुज़रता हर डिब्बा सेंसर देखता है और संकेत देता है।', 'Factory ki patti par guzarta har dibba sensor dekhta hai aur sanket deta hai.', 'Box!', 'Belt empty', 7),
  J('noentry', 'ir', ['buzzer', 'rgb'], 'No-entry zone alarm', 'प्रवेश वर्जित क्षेत्र अलार्म', 'Pravesh varjit kshetra alarm', 'Anyone who reaches past the safety line of a machine sets off the warning.', 'मशीन की सुरक्षा रेखा के पार हाथ ले जाने वाला हर कोई चेतावनी बजा देता है।', 'Machine ki suraksha rekha ke paar haath le jaane wala har koi chetaavni baja deta hai.', 'KEEP BACK!', 'Safe', 6),
  J('atmlight', 'ir', ['relay', 'led'], 'ATM cabin light', 'एटीएम केबिन की लाइट', 'ATM cabin ki light', 'The cabin light comes on when a customer steps up to the machine.', 'ग्राहक मशीन के पास आता है तो केबिन की लाइट जल जाती है।', 'Graahak machine ke paas aata hai to cabin ki light jal jaati hai.', 'Light ON', 'Light off', 7),
  J('wardrobe', 'ir', ['led'], 'Wardrobe light', 'अलमारी के अंदर की लाइट', 'Almari ke andar ki light', 'Reach into the dark wardrobe and a small light shows the clothes.', 'अँधेरी अलमारी में हाथ डालिए और एक छोटी लाइट कपड़े दिखा देती है।', 'Andheri almari mein haath daaliye aur ek chhoti light kapde dikha deti hai.', 'Light ON', 'Light off', 6),
  J('goal', 'ir', ['buzzer', 'lcd'], 'Goal-line sensor', 'गोल रेखा सेंसर', 'Goal rekha sensor', 'The ball crossing the goal line is seen at once: no arguments about the goal.', 'गेंद गोल रेखा पार करते ही दिख जाती है: गोल पर कोई बहस नहीं।', 'Gend goal rekha paar karte hi dikh jaati hai: goal par koi behes nahi.', 'GOAL!', 'Play on', 6),
  J('speedwarn', 'pot', ['buzzer', 'rgb', 'lcd'], 'Over-speed warning', 'तेज़ रफ़्तार चेतावनी', 'Tez raftaar chetaavni', 'A knob plays the accelerator; past the speed limit, the driver is warned.', 'नॉब एक्सेलरेटर का काम करता है; गति सीमा पार होते ही ड्राइवर को चेतावनी मिलती है।', 'Knob accelerator ka kaam karta hai; speed limit paar hote hi driver ko chetaavni milti hai.', 'SLOW DOWN', 'Speed OK', 6),
  J('cranelimit', 'pot', ['buzzer', 'rgb'], 'Crane arm angle limit', 'क्रेन की भुजा की कोण सीमा', 'Crane ki bhuja ki kon seema', 'A knob on the crane arm measures its angle; raised too far, the crane could tip over.', 'क्रेन की भुजा पर लगा नॉब उसका कोण नापता है; बहुत ऊपर उठी तो क्रेन पलट सकती है।', 'Crane ki bhuja par laga knob uska kon naapta hai; bahut upar uthi to crane palat sakti hai.', 'TOO HIGH!', 'Angle OK', 7),
  J('volume', 'pot', ['led', 'lcd'], 'Headphone volume guard', 'हेडफ़ोन आवाज़ रक्षक', 'Headphone awaaz rakshak', 'Turn the volume past a safe mark and a light warns you: loud music damages the ears.', 'आवाज़ सुरक्षित निशान से आगे घुमाइए तो लाइट चेताती है: तेज़ संगीत कानों को नुक़सान पहुँचाता है।', 'Awaaz surakshit nishaan se aage ghumaiye to light chetaati hai: tez sangeet kaanon ko nuksaan pahunchata hai.', 'TOO LOUD', 'Safe level', 5),
  J('stoveknob', 'pot', ['buzzer', 'rgb'], 'Gas stove knob reminder', 'गैस चूल्हे के नॉब की याद', 'Gas choolhe ke knob ki yaad', 'A stove knob left turned on is dangerous; a beep reminds the family to turn it off.', 'चालू छोड़ा गया चूल्हे का नॉब ख़तरनाक है; बीप परिवार को उसे बंद करने की याद दिलाती है।', 'Chaalu chhoda gaya choolhe ka knob khatarnaak hai; beep parivaar ko use band karne ki yaad dilaati hai.', 'STOVE ON', 'Stove off', 6),
  J('smokebeam', 'ldr', ['buzzer', 'rgb', 'lcd'], 'Smoke detector (light beam)', 'धुआँ डिटेक्टर (रोशनी की किरण)', 'Dhuaan detector (roshni ki kiran)', 'Smoke between a lamp and the LDR blocks the light: the same idea as in many smoke alarms.', 'लैंप और एलडीआर के बीच का धुआँ रोशनी रोक देता है: कई धुआँ अलार्म इसी विचार पर चलते हैं।', 'Lamp aur LDR ke beech ka dhuaan roshni rok deta hai: kai dhuaan alarm isi vichaar par chalte hain.', 'SMOKE!', 'Air clear', 7),
  J('readinglamp', 'ldr', ['led', 'relay'], 'Study table lamp', 'पढ़ाई की मेज़ का लैंप', 'Padhai ki mez ka lamp', 'When the room gets too dim to read, the table lamp switches on by itself.', 'कमरे में पढ़ने लायक़ रोशनी न रहे तो मेज़ का लैंप अपने-आप जल जाता है।', 'Kamre mein padhne laayak roshni na rahe to mez ka lamp apne aap jal jaata hai.', 'Lamp ON', 'Bright room', 6),
  J('beacon', 'ldr', ['led', 'rgb'], 'Tower warning beacon', 'टावर की चेतावनी बत्ती', 'Tower ki chetaavni batti', 'Tall towers must show a red light at night, so that planes and helicopters see them.', 'ऊँचे टावरों पर रात में लाल बत्ती ज़रूरी है, ताकि हवाई जहाज़ और हेलीकॉप्टर उन्हें देख सकें।', 'Oonche towers par raat mein laal batti zaroori hai, taaki hawai jahaaz aur helicopter unhe dekh sakein.', 'Beacon ON', 'Daytime', 6),
  J('festival', 'ldr', ['rgb', 'relay'], 'Festival lights at sunset', 'सूर्यास्त पर त्योहार की रोशनी', 'Sooryaast par tyohaar ki roshni', 'Diwali lights that switch on by themselves when the evening comes.', 'दिवाली की रोशनी जो शाम होते ही अपने-आप जल जाती है।', 'Diwali ki roshni jo shaam hote hi apne aap jal jaati hai.', 'Lights ON', 'Daytime', 6),
  J('powercut', 'ldr', ['buzzer', 'lcd'], 'Power cut alarm', 'बिजली कटौती अलार्म', 'Bijli katauti alarm', 'An LDR watches the tube light of a ward: when it goes dark, the battery-powered board reports a power cut.', 'एलडीआर वार्ड की ट्यूबलाइट देखता है: अँधेरा होते ही बैटरी पर चलता बोर्ड बिजली जाने की सूचना देता है।', 'LDR ward ki tubelight dekhta hai: andhera hote hi battery par chalta board bijli jaane ki soochna deta hai.', 'POWER CUT', 'Power OK', 7),
  J('solarpanel', 'ldrb', ['servo'], 'Solar panel lifter', 'सोलर पैनल उठाने वाला', 'Solar panel uthaane wala', 'When the sun comes out, a servo tilts the solar panel up towards it.', 'धूप निकलते ही सर्वो सोलर पैनल को उसकी ओर उठा देता है।', 'Dhoop nikalte hi servo solar panel ko uski or utha deta hai.', 'Tilted up', 'Resting', 7),
  J('headlight', 'ldrb', ['led', 'rgb'], 'Headlight auto-dipper', 'हेडलाइट ऑटो डिपर', 'Headlight auto dipper', 'The bright beam of an oncoming car dips your headlights, so nobody is dazzled.', 'सामने से आती गाड़ी की तेज़ रोशनी आपकी हेडलाइट नीची कर देती है, ताकि किसी की आँखें न चौंधियाएँ।', 'Saamne se aati gaadi ki tez roshni aapki headlight neechi kar deti hai, taaki kisi ki aankhen na chaundhiyaayein.', 'Dipped', 'High beam', 7),
  J('strongsun', 'ldrb', ['buzzer', 'rgb'], 'Strong sun warning', 'तेज़ धूप की चेतावनी', 'Tez dhoop ki chetaavni', 'On the playground, very strong sunlight is a signal to drink water and find shade.', 'खेल के मैदान में बहुत तेज़ धूप पानी पीने और छाँव ढूँढ़ने का संकेत है।', 'Khel ke maidaan mein bahut tez dhoop paani peene aur chhaanv dhoondhne ka sanket hai.', 'SHADE!', 'Mild sun', 6),
  J('flame', 'ldrb', ['led', 'lcd'], 'Burner flame watcher', 'बर्नर की लौ निगरानी', 'Burner ki lau nigraani', 'An LDR beside the burner sees its glow and shows that the flame is burning.', 'बर्नर के पास का एलडीआर उसकी चमक देखता है और दिखाता है कि लौ जल रही है।', 'Burner ke paas ka LDR uski chamak dekhta hai aur dikhata hai ki lau jal rahi hai.', 'Flame ON', 'No flame', 7),
  J('ironhot', 'lm35', ['buzzer', 'rgb'], 'Iron left on warning', 'इस्त्री चालू छूटने की चेतावनी', 'Istri chaalu chhootne ki chetaavni', 'A hot iron left on the board is a fire risk; the warning tells everyone.', 'बोर्ड पर चालू छूटी गर्म इस्त्री से आग लग सकती है; चेतावनी सबको बता देती है।', 'Board par chaalu chhooti garam istri se aag lag sakti hai; chetaavni sabko bata deti hai.', 'IRON HOT!', 'Iron cool', 6),
  J('motorhot', 'lm35', ['buzzer', 'lcd'], 'Pump motor overheat alarm', 'पंप मोटर ज़्यादा गर्म अलार्म', 'Pump motor zyada garam alarm', 'A farm pump running dry gets very hot; the alarm saves the motor.', 'सूखा चलता खेत का पंप बहुत गर्म हो जाता है; अलार्म मोटर को बचाता है।', 'Sookha chalta khet ka pump bahut garam ho jaata hai; alarm motor ko bachaata hai.', 'MOTOR HOT', 'Motor OK', 7),
  J('geyser', 'lm35', ['led', 'lcd', 'buzzer'], 'Hot water ready light', 'गर्म पानी तैयार लाइट', 'Garam paani taiyaar light', 'The geyser light says when the water is hot enough for a bath.', 'गीज़र की लाइट बताती है कि पानी नहाने लायक़ गर्म हो गया।', 'Geyser ki light batati hai ki paani nahaane laayak garam ho gaya.', 'Water hot', 'Heating...', 6),
  J('transformer', 'lm35', ['lcd', 'rgb'], 'Transformer heat watch', 'ट्रांसफ़ॉर्मर गर्मी निगरानी', 'Transformer garmi nigraani', 'A hot transformer can burn out the supply of a whole colony; the lineman is warned early.', 'गर्म ट्रांसफ़ॉर्मर पूरी कॉलोनी की बिजली ठप कर सकता है; लाइनमैन को पहले ही चेतावनी मिलती है।', 'Garam transformer poori colony ki bijli thap kar sakta hai; lineman ko pehle hi chetaavni milti hai.', 'TOO HOT', 'Normal', 8),
  J('compost', 'lm35', ['lcd', 'rgb'], 'Compost pit thermometer', 'खाद के गड्ढे का थर्मामीटर', 'Khaad ke gaddhe ka thermometer', 'A working compost heap heats up; the reading tells the farmer when to turn it.', 'सक्रिय खाद का ढेर गर्म होता है; रीडिंग किसान को बताती है कि उसे कब पलटना है।', 'Sakriya khaad ka dher garam hota hai; reading kisaan ko batati hai ki use kab palatna hai.', 'Turn it', 'Warming', 7),
  J('pipefreeze', 'cold', ['buzzer', 'rgb', 'lcd'], 'Water pipe freeze warning', 'पानी के पाइप जमने की चेतावनी', 'Paani ke pipe jamne ki chetaavni', 'In the hills, pipes burst when the water in them freezes; the warning comes before that.', 'पहाड़ों में पाइप का पानी जमने पर पाइप फट जाते हैं; चेतावनी उससे पहले आती है।', 'Pahaadon mein pipe ka paani jamne par pipe phat jaate hain; chetaavni usse pehle aati hai.', 'FREEZE!', 'Pipes OK', 7),
  J('brooder', 'cold', ['relay'], 'Chick brooder heater', 'चूज़ों का ब्रूडर हीटर', 'Choozon ka brooder heater', 'Baby chicks die of cold; the heater lamp comes on when the brooder cools down.', 'छोटे चूज़े ठंड से मर जाते हैं; ब्रूडर ठंडा होते ही हीटर लैंप जल जाता है।', 'Chhote chooze thand se mar jaate hain; brooder thanda hote hi heater lamp jal jaata hai.', 'Heating', 'Warm', 7),
  J('bathwater', 'cold', ['rgb', 'led'], 'Bath water too cold', 'नहाने का पानी बहुत ठंडा', 'Nahaane ka paani bahut thanda', 'Before a baby\'s bath, a red light says the water is still too cold.', 'बच्चे के नहाने से पहले लाल लाइट बताती है कि पानी अभी बहुत ठंडा है।', 'Bachche ke nahaane se pehle laal light batati hai ki paani abhi bahut thanda hai.', 'Too cold', 'Just right', 6),
  J('coldwave', 'cold', ['lcd', 'buzzer'], 'Cold wave school notice', 'शीत लहर स्कूल सूचना', 'Sheet lehar school soochna', 'On a very cold morning the board reminds everyone to wear sweaters and keep the windows shut.', 'बहुत ठंडी सुबह बोर्ड सबको स्वेटर पहनने और खिड़कियाँ बंद रखने की याद दिलाता है।', 'Bahut thandi subah board sabko sweater pehenne aur khidkiyaan band rakhne ki yaad dilata hai.', 'Wear sweater', 'Mild day', 7),
  J('heightcheck', 'sonar', ['servo', 'lcd'], 'Ride height check', 'झूले की ऊँचाई जाँच', 'Jhoole ki oonchai jaanch', 'A sensor above the entry: a child whose head comes close is tall enough, and the gate opens.', 'प्रवेश के ऊपर लगा सेंसर: जिस बच्चे का सिर पास आए वह काफ़ी लंबा है, और गेट खुल जाता है।', 'Pravesh ke upar laga sensor: jis bachche ka sir paas aaye woh kaafi lamba hai, aur gate khul jaata hai.', 'Tall enough', 'Too short', 7),
  J('screenguard', 'sonar', ['buzzer', 'led'], 'Screen distance guard', 'स्क्रीन दूरी रक्षक', 'Screen doori rakshak', 'Sitting too close to a screen strains the eyes; it beeps until you move back.', 'स्क्रीन के बहुत पास बैठना आँखों पर ज़ोर डालता है; जब तक आप पीछे न हटें, यह बीप करता है।', 'Screen ke bahut paas baithna aankhon par zor daalta hai; jab tak aap peeche na hatein, yeh beep karta hai.', 'TOO CLOSE', 'Good', 6),
  J('platform', 'sonar', ['buzzer', 'lcd'], 'Platform edge warning', 'प्लेटफ़ॉर्म किनारा चेतावनी', 'Platform kinaara chetaavni', 'A sensor along the platform edge warns anyone who stands too near the tracks.', 'प्लेटफ़ॉर्म के किनारे का सेंसर पटरियों के बहुत पास खड़े हर किसी को चेताता है।', 'Platform ke kinaare ka sensor patriyon ke bahut paas khade har kisi ko chetaata hai.', 'STAND BACK', 'Mind the gap', 7),
  J('silo', 'sonar', ['lcd', 'led'], 'Grain silo full alarm', 'अनाज कोठी भरी अलार्म', 'Anaaj kothi bhari alarm', 'A sensor at the top of the silo stops the loading before grain spills over.', 'कोठी के ऊपर का सेंसर अनाज बाहर गिरने से पहले भराई रुकवा देता है।', 'Kothi ke upar ka sensor anaaj bahar girne se pehle bharaai rukwa deta hai.', 'SILO FULL', 'Filling', 7),
  J('tollbooth', 'sonar', ['servo'], 'Toll plaza barrier', 'टोल प्लाज़ा बैरियर', 'Toll plaza barrier', 'A car stops at the booth and the barrier lifts for it.', 'गाड़ी बूथ पर रुकती है और उसके लिए बैरियर उठ जाता है।', 'Gaadi booth par rukti hai aur uske liye barrier uth jaata hai.', 'Go', 'Stop', 7),
  J('nursery', 'soil', ['rgb', 'lcd'], 'Seedling tray monitor', 'पौध ट्रे मॉनिटर', 'Paudh tray monitor', 'Young seedlings dry out in a day; a red light tells the gardener which tray needs water.', 'छोटी पौध एक दिन में सूख जाती है; लाल लाइट माली को बताती है कि किस ट्रे को पानी चाहिए।', 'Chhoti paudh ek din mein sookh jaati hai; laal light maali ko batati hai ki kis tray ko paani chahiye.', 'Water me', 'Moist', 6),
  J('terrace', 'soil', ['pump'], 'Terrace garden watering', 'छत के बगीचे की सिंचाई', 'Chhat ke bagiche ki sinchaai', 'The pots on the terrace are watered by a small pump only when their soil is dry.', 'छत के गमलों को छोटा पंप तभी पानी देता है जब उनकी मिट्टी सूखी हो।', 'Chhat ke gamlon ko chhota pump tabhi paani deta hai jab unki mitti sookhi ho.', 'Watering', 'Moist', 7),
  J('pitch', 'soil', ['lcd', 'buzzer'], 'Cricket pitch dryness check', 'क्रिकेट पिच सूखापन जाँच', 'Cricket pitch sookhapan jaanch', 'The groundsman waters the pitch when the sensor says it is too dry and cracking.', 'सेंसर बताए कि पिच बहुत सूखी है और फट रही है, तो ग्राउंड्समैन पानी देता है।', 'Sensor bataaye ki pitch bahut sookhi hai aur phat rahi hai, to groundsman paani deta hai.', 'Too dry', 'Pitch OK', 7),
  J('sewer', 'gas', ['buzzer', 'rgb', 'lcd'], 'Sewer gas warning for workers', 'सीवर गैस चेतावनी (कर्मचारियों के लिए)', 'Sewer gas chetaavni (karmchaariyon ke liye)', 'Workers have died from gas in manholes; the sensor checks the air before anyone goes down.', 'मैनहोल की गैस से कर्मचारियों की जान गई है; किसी के उतरने से पहले सेंसर हवा जाँचता है।', 'Manhole ki gas se karmchaariyon ki jaan gayi hai; kisi ke utarne se pehle sensor hawa jaanchta hai.', 'DO NOT ENTER', 'Air OK', 8),
  J('breath', 'gas', ['servo', 'lcd'], 'Drunk-driving ignition lock', 'शराब पीकर गाड़ी चलाने पर इग्निशन लॉक', 'Sharaab peekar gaadi chalaane par ignition lock', 'The driver breathes on the sensor; alcohol vapour makes a servo lock the ignition.', 'ड्राइवर सेंसर पर साँस छोड़ता है; शराब की भाप से सर्वो इग्निशन लॉक कर देता है।', 'Driver sensor par saans chhodta hai; sharaab ki bhaap se servo ignition lock kar deta hai.', 'LOCKED', 'Drive safe', 8),
  J('fruitripe', 'gas', ['rgb', 'lcd'], 'Fruit ripening watch', 'फल पकने की निगरानी', 'Phal pakne ki nigraani', 'Ripening and rotting fruit give off gases; a rising reading tells the shopkeeper to sell soon.', 'पकते और सड़ते फल गैसें छोड़ते हैं; बढ़ती रीडिंग दुकानदार को जल्दी बेचने को कहती है।', 'Pakte aur sadte phal gases chhodte hain; badhti reading dukaandaar ko jaldi bechne ko kehti hai.', 'Sell soon', 'Fresh', 8),
  J('garagefumes', 'gas', ['relay'], 'Garage fume fan', 'गैराज धुआँ पंखा', 'Garage dhuaan pankha', 'Exhaust and petrol fumes build up in a closed garage; the fan clears them out.', 'बंद गैराज में गाड़ी का धुआँ और पेट्रोल की भाप भर जाती है; पंखा उन्हें बाहर निकालता है।', 'Band garage mein gaadi ka dhuaan aur petrol ki bhaap bhar jaati hai; pankha unhe bahar nikaalta hai.', 'Fan ON', 'Air OK', 8),
  J('poultry', 'dht', ['relay', 'pump'], 'Poultry shed cooling', 'मुर्गी शेड की ठंडक', 'Murgi shed ki thandak', 'Hens die in a heatwave; the fans and a mist spray switch on when the shed gets hot.', 'लू में मुर्गियाँ मर जाती हैं; शेड गर्म होते ही पंखे और फुहार चालू हो जाते हैं।', 'Loo mein murgiyaan mar jaati hain; shed garam hote hi pankhe aur phuhaar chaalu ho jaate hain.', 'Cooling', 'Shed OK', 8),
  J('comfort', 'dht', ['lcd', 'rgb'], 'Classroom comfort meter', 'कक्षा आराम मीटर', 'Kaksha aaraam meter', 'Students learn badly in a hot room; the meter tells the teacher to open the windows or switch on the fans.', 'गर्म कमरे में बच्चे ठीक से नहीं पढ़ पाते; मीटर शिक्षक को खिड़कियाँ खोलने या पंखे चलाने को कहता है।', 'Garam kamre mein bachche theek se nahi padh paate; meter teacher ko khidkiyaan kholne ya pankhe chalaane ko kehta hai.', 'Too warm', 'Comfy', 8),
  J('clothesdry', 'hum', ['relay'], 'Drying room fan', 'कपड़े सुखाने के कमरे का पंखा', 'Kapde sukhaane ke kamre ka pankha', 'Wet clothes make the air damp; the fan runs until the room is dry again.', 'गीले कपड़े हवा को नम कर देते हैं; कमरा फिर सूखने तक पंखा चलता है।', 'Geele kapde hawa ko nam kar dete hain; kamra phir sookhne tak pankha chalta hai.', 'Fan ON', 'Dry air', 8),
  J('museum', 'hum', ['rgb', 'lcd', 'buzzer'], 'Museum humidity guard', 'संग्रहालय नमी रक्षक', 'Sangrahaalay nami rakshak', 'Old paintings and books grow mould in damp air; the guard warns the curator.', 'पुरानी पेंटिंग और किताबों पर नम हवा में फफूँद लगती है; रक्षक क्यूरेटर को चेताता है।', 'Puraani painting aur kitaabon par nam hawa mein phaphoond lagti hai; rakshak curator ko chetaata hai.', 'TOO DAMP', 'Air OK', 8),
  J('mirror', 'hum', ['relay'], 'Bathroom mirror demister', 'बाथरूम के शीशे की धुंध हटाने वाला', 'Bathroom ke sheeshe ki dhundh hataane wala', 'Steam fogs the mirror; a small heater behind it switches on when the air is humid.', 'भाप शीशे को धुंधला कर देती है; हवा नम होते ही उसके पीछे का छोटा हीटर चालू हो जाता है।', 'Bhaap sheeshe ko dhundhla kar deti hai; hawa nam hote hi uske peeche ka chhota heater chaalu ho jaata hai.', 'Demisting', 'Clear', 8),
];
// a job + output that is already a hand-made lesson in the app (lessons.js and the batches): not made again here
const HAND_MADE = new Set(['nightlamp:led', 'toohot:led', 'parkbeep:buzzer', 'thirst:relay', 'gasleak:buzzer', 'roomlight:buzzer']);

const FAN_JOBS = new Set(['coolfan', 'exhaust', 'serverroom', 'greenfan', 'coolroom', 'bathfan', 'fumehood', 'classfan', 'handdryer', 'fanmark', 'garagefumes', 'poultry', 'clothesdry']);
const HEAT_JOBS = new Set(['heaterset', 'thermostat', 'fishtank', 'incubator', 'brooder', 'mirror']);
function relayFor(out, job) { // the 230 V box the relay switches, in the words of the job
  if (FAN_JOBS.has(job.key)) return Object.assign({}, out, { name: t3('relay and fan', 'रिले और पंखा', 'relay aur pankha'), parts: out.parts.map((p) => (p.type === 'load230' ? Object.assign({}, p, { props: { kind: 'fan' } }) : p)),
    ready: fill(out.ready, (x, lg) => x.replace({ en: 'the 230 V lamp', hi: '230 V का बल्ब', hg: '230 V ka bulb' }[lg], { en: 'a 230 V fan', hi: '230 V का पंखा', hg: '230 V ka pankha' }[lg])),
    onWords: t3('the relay clicks and the fan starts', 'रिले क्लिक करता है और पंखा चलने लगता है', 'relay click karta hai aur pankha chalne lagta hai'),
    decl: (out.decl || []).map((x) => x.replace('lamp on', 'fan on')), py: out.py && Object.assign({}, out.py, { decl: out.py.decl.map((x) => x.replace('lamp on', 'fan on')) }) });
  if (HEAT_JOBS.has(job.key)) return Object.assign({}, out, { name: t3('relay and heater lamp', 'रिले और हीटर लैंप', 'relay aur heater lamp'),
    onWords: t3('the relay clicks and the heater comes on (the lamp shows it)', 'रिले क्लिक करता है और हीटर चालू होता है (लैंप दिखाता है)', 'relay click karta hai aur heater on hota hai (lamp dikhata hai)'),
    decl: (out.decl || []).map((x) => x.replace('lamp on', 'heater on')), py: out.py && Object.assign({}, out.py, { decl: out.py.decl.map((x) => x.replace('lamp on', 'heater on')) }) });
  return out;
}
const CLS = (job, inp, out) => Math.min(9, Math.max(job.cls, 5 + inp.lvl + (out === 'lcd' || out === 'relay' || out === 'web' ? 1 : 0)));

// ------------------------------------------------------------------ the sketch
function sketch(job, ik, ok, board) {
  if (board === 'pico') return sketchPy(job, ik, ok);
  if (board === 'pi4') return sketchPi(job, ik, ok);
  const esp = board === 'esp32', inp = (esp ? EIN : IN)[ik], out = ok === 'relay' ? relayFor((esp ? EOUT : OUT)[ok], job) : (esp ? EOUT : OUT)[ok];
  const on = typeof out.on === 'function' ? out.on(job) : out.on, off = typeof out.off === 'function' ? out.off(job) : out.off;
  const L = [`// ${job.title.en}: ${inp.name.en} and ${out.name.en}`, `// ${job.why.en}`];
  const inc = [...(inp.inc || []), ...(out.inc || [])]; if (inc.length) L.push(...inc);
  L.push('', ...inp.decl, ...out.decl);
  if (inp.analog) L.push(`int limit = ${inp.l0};             // ${inp.note}`);
  else L.push('unsigned long hold = 1000;    // stay on this long after it stops (ms)', 'unsigned long last = 0;       // when the sensor was last active');
  L.push('', 'void setup() {', ...[...inp.setup, ...out.setup].map((x) => '  ' + x));
  if (ok === 'lcd') L.push(`  lcd.setCursor(0, 0);`, `  lcd.print("${pad(job.title.en.slice(0, 16))}");`);
  if (inp.analog) L.push(`  Serial.begin(${esp ? 115200 : 9600});`);
  L.push('}', '', 'void loop() {');
  if (inp.analog) {
    L.push(...(inp.readLines || [inp.read]).map((x) => '  ' + x));
    L.push(`  Serial.print("${inp.label}: ");`, `  Serial.println(${inp.v});`);
    if (ok === 'lcd') L.push('  lcd.setCursor(0, 0);', `  lcd.print("${inp.label}: ");`, `  lcd.print(${inp.v});`, '  lcd.print("     ");');
    L.push(`  if (${inp.cond}) {`, ...on.map((x) => '    ' + x), '  } else {', ...off.map((x) => '    ' + x), '  }', `  delay(${inp.delay || 200});`);
  } else {
    L.push(`  if (${inp.trig}) {`, '    last = millis();           // active now: start the hold time again', '  }');
    L.push('  if (last > 0 && millis() - last < hold) {', ...on.map((x) => '    ' + x), '  } else {', ...off.map((x) => '    ' + x), '  }', '  delay(50);');
  }
  L.push('}', '');
  return L.join('\n');
}

// (batch 14) the ESP32 sketch of a web-page job: WiFi, a WebServer, the sensor read 5 times a second in loop()
const htmlEsc = (x) => String(x).replace(/&/g, '&amp;').replace(/</g, '&lt;');
function sketchWeb(job, ik) {
  const inp = EIN[ik]; const L = [`// ${job.title.en}: ${inp.name.en} and a web page on the phone`, `// ${job.why.en}`, '#include <WiFi.h>', '#include <WebServer.h>', ...(inp.inc || []), '',
    'const char* ssid = "DUET-School";', 'const char* password = "stem2026";', 'WebServer server(80);', ...inp.decl];
  const rd = (inp.readLines || [inp.read]); const v = inp.v;
  if (inp.analog) L.push(`int limit = ${inp.l0};             // ${inp.note}`, `int ${v} = 0;                  // the last reading`);
  else L.push('unsigned long hold = 1000;    // stay on this long after it stops (ms)', 'unsigned long last = 0;       // when the sensor was last active');
  L.push('bool warn = false;', '', 'void handleRoot() {', '  String h = "<meta http-equiv=\\"refresh\\" content=\\"2\\">";   // the phone asks again every 2 s',
    `  h += "<h3>${htmlEsc(job.title.en)}</h3>";`);
  if (inp.analog) L.push(`  h += "<p>${inp.label}: <b>" + String(${v}) + "</b></p>";`);
  L.push('  if (warn) {', `    h += "<h1 style=\\"color:#d0342c\\">${htmlEsc(job.on)}</h1>";`, '  } else {', `    h += "<h1 style=\\"color:#2b8a3e\\">${htmlEsc(job.off)}</h1>";`, '  }', '  server.send(200, "text/html", h);', '}', '',
    'void setup() {', ...inp.setup.map((x) => '  ' + x), '  Serial.begin(115200);', '  WiFi.begin(ssid, password);', '  while (WiFi.status() != WL_CONNECTED) {', '    delay(500);', '    Serial.print(".");', '  }', '  Serial.println();',
    '  Serial.print("Open on the phone: http://");', '  Serial.println(WiFi.localIP());', '  server.on("/", handleRoot);', '  server.begin();', '}', '', 'unsigned long lastRead = 0;', '', 'void loop() {',
    '  server.handleClient();        // answer the phone', `  if (millis() - lastRead >= ${inp.delay || 200}) {`, '    lastRead = millis();');
  if (inp.analog) { L.push(...rd.map((x) => '    ' + x.replace(new RegExp(`^int ${v} = `), `${v} = `)), `    Serial.print("${inp.label}: ");`, `    Serial.println(${v});`, `    warn = ${inp.cond};`); }
  else L.push(`    if (${inp.trig}) {`, '      last = millis();           // active now: start the hold time again', '    }', '    warn = last > 0 && millis() - last < hold;');
  L.push('  }', '}', '');
  return L.join('\n');
}

// ------------------------------------------------------------------ one lesson
function lesson(K, job, ik, ok, n, board) {
  const esp = board === 'esp32', pico = board === 'pico', pi = board === 'pi4', inp = (esp ? EIN : pico ? PIN : pi ? QIN : IN)[ik], out0 = (esp ? EOUT : pico ? POUT : pi ? QOUT : OUT)[ok];
  const out = ok === 'relay' ? relayFor(out0, job) : out0;
  const ON = (S) => out.isOn(S, job);
  const id = `f_${job.key}_${ok}` + (esp ? '_esp' : pico ? '_pico' : pi ? '_pi' : '');
  const web = !!out.web; const code = web ? sketchWeb(job, ik) : sketch(job, ik, ok, board);
  const wide = inp.view === 'wide' || ['servo', 'relay', 'lcd'].includes(ok);
  const when = fill(inp.when, (x) => x), onW = out.onWords;
  const goal = join3(job.why, ' ', t3(`When ${when.en}, ${onW.en}.`, `जब ${when.hi}, तब ${onW.hi}।`, `Jab ${when.hg}, tab ${onW.hg}.`));
  const steps = [
    { k: 'info', do: join3(job.why, ' ', out.ready), see: t3(`Your job: wire the ${inp.name.en} and teach the board when to switch the ${out.name.en}.`, `आपका काम: ${inp.name.hi} जोड़िए और बोर्ड को सिखाइए कि ${out.name.hi} कब चलाना है।`, `Aapka kaam: ${inp.name.hg} jodiye aur board ko sikhaiye ki ${out.name.hg} kab chalana hai.`) },
    { k: 'place', place: inp.place, do: inp.placeDo, see: t3('', '', '') },
  ];
  if (inp.place2) steps.push({ k: 'place', place: inp.place2, do: inp.place2Do, see: t3('', '', '') });
  steps.push(...inp.wires);
  steps.push({ k: 'check', do: t3('Check your circuit.', 'अपना सर्किट जाँचिए।', 'Apna circuit check karo.'), see: t3('', '', '') });
  steps.push({ k: 'run', do: t3('Press Run.', '"चलाइए" दबाइए।', 'Run dabaiye.'), see: inp.analog ? t3(`The Serial Monitor shows the reading (${inp.label}) every 0.2 s.`, `सीरियल मॉनिटर हर 0.2 s में रीडिंग (${inp.label}) दिखाता है।`, `Serial Monitor har 0.2 s mein reading (${inp.label}) dikhata hai.`) : t3('', '', '') });
  if (web) steps.push({ k: 'act', until: (S) => fresh(S) && ((net(S).seen.paths || {})['/'] || 0) >= 1, do: t3('The Serial Monitor shows the address. On the phone, open the Browser, type that address (http://192.168.1.…) and press Go.', 'सीरियल मॉनिटर पता दिखाता है। फ़ोन पर Browser खोलिए, वह पता (http://192.168.1.…) लिखिए और Go दबाइए।', 'Serial Monitor address dikhata hai. Phone par Browser kholiye, woh address (http://192.168.1.…) likhiye aur Go dabaiye.'),
    see: t3('The page asks the ESP32 again every 2 s by itself (meta refresh): leave it open.', 'पेज हर 2 s में अपने-आप ESP32 से फिर पूछता है (meta refresh): इसे खुला रहने दीजिए।', 'Page har 2 s mein apne aap ESP32 se phir poochhta hai (meta refresh): ise khula rehne dijiye.') });
  const trig = inp.analog ? (S) => { const v = lastNum(S); return v !== null && cmp(ik, v, inp.l0); } : (S) => (!inp.ready || inp.ready(S)) && inp.active(S);
  steps.push({ k: 'act', until: (S) => fresh(S) && trig(S) && ON(S) && (S.memRun.onSeen = true), do: inp.onDo, see: t3(`${cap(onW.en)}.`, `${onW.hi}।`, `${cap(onW.hg)}.`) });
  steps.push({ k: 'act', until: (S) => fresh(S) && S.memRun.onSeen && !trig(S) && !ON(S), do: inp.offDo,
    see: t3(`And off again: the ${out.name.en} answers the sensor by itself.`, `और फिर बंद: ${out.name.hi} अपने-आप सेंसर का जवाब देता है।`, `Aur phir band: ${out.name.hg} apne aap sensor ka jawab deta hai.`) });
  if (inp.analog) {
    const py = pico || pi, re = py ? new RegExp(`^limit\\s*=\\s*${inp.l1}\\b`, 'm') : new RegExp(`int\\s+limit\\s*=\\s*${inp.l1}\\s*;`);
    steps.push({ k: 'edit', test: (src) => re.test(src), set: py ? [[new RegExp(`^limit = ${inp.l0}\\b`, 'm'), `limit = ${inp.l1}`]] : [[new RegExp(`int limit = ${inp.l0};`), `int limit = ${inp.l1};`]],
      do: t3(`Make it more sensitive: change limit = ${inp.l0} to ${inp.l1} and press Run.`, `इसे ज़्यादा संवेदनशील बनाइए: limit = ${inp.l0} को ${inp.l1} कीजिए और "चलाइए" दबाइए।`, `Ise zyada sensitive banaiye: limit = ${inp.l0} ko ${inp.l1} karo aur Run dabaiye.`), see: t3('', '', '') });
    steps.push({ k: 'act', until: (S) => { const v = lastNum(S); const ok2 = fresh(S) && v !== null && cmp(ik, v, inp.l1) && !cmp(ik, v, inp.l0) && ON(S); if (ok2) S.memRun.final = true; return ok2; }, do: inp.edgeDo,
      see: t3(`Before your change this would not have switched it; now it does. Choosing the limit is how engineers tune a real ${job.title.en.toLowerCase()}.`, `आपके बदलाव से पहले यह इसे चालू नहीं करता; अब करता है। सीमा चुनकर ही इंजीनियर असली उपकरण को ठीक करते हैं।`, `Aapke badlaav se pehle yeh ise on nahi karta; ab karta hai. Limit chunkar hi engineer asli device ko tune karte hain.`) });
  } else {
    if (pi) steps.push({ k: 'edit', test: (src) => /^hold\s*=\s*3(\.0)?\b/m.test(src), set: [[/^hold = 1\.0\b/m, 'hold = 3.0']], // (the Pi counts seconds)
      do: t3('Keep it on longer: change hold = 1.0 to 3.0 and press Run.', 'इसे ज़्यादा देर चालू रखिए: hold = 1.0 को 3.0 कीजिए और "चलाइए" दबाइए।', 'Ise zyada der on rakhiye: hold = 1.0 ko 3.0 karo aur Run dabaiye.'), see: t3('', '', '') });
    else steps.push({ k: 'edit', test: (src) => (pico ? /^hold\s*=\s*3000\b/m : /unsigned\s+long\s+hold\s*=\s*3000\s*;/).test(src), set: pico ? [[/^hold = 1000\b/m, 'hold = 3000']] : [[/unsigned long hold = 1000;/, 'unsigned long hold = 3000;']],
      do: t3('Keep it on longer: change hold = 1000 to 3000 and press Run.', 'इसे ज़्यादा देर चालू रखिए: hold = 1000 को 3000 कीजिए और "चलाइए" दबाइए।', 'Ise zyada der on rakhiye: hold = 1000 ko 3000 karo aur Run dabaiye.'), see: t3('', '', '') });
    steps.push({ k: 'act', until: (S) => { const ok2 = fresh(S) && (S.memRun.afterMax || 0) >= 2.5; if (ok2) S.memRun.final = true; return ok2; }, do: inp.againDo,
      see: ((c) => t3(`It now stays on about 3 s after the sensor stops: ${c} counts the time without stopping the board.`, `अब सेंसर रुकने के बाद यह लगभग 3 s चालू रहता है: ${c} बोर्ड को रोके बिना समय गिनता है।`, `Ab sensor rukne ke baad yeh lagbhag 3 s on rehta hai: ${c} board ko roke bina time ginta hai.`))(pi ? 'time.monotonic()' : pico ? 'time.ticks_ms()' : 'millis()') });
  }
  const tick = (S, dt) => { // the hold after a digital sensor stops: how long the output stayed on (this run)
    if (inp.analog) return; const R = S.memRun; if (!fresh(S)) return;
    if (!inp.active(S) && ON(S)) { R.after = (R.after || 0) + dt; R.afterMax = Math.max(R.afterMax || 0, R.after); } else R.after = 0;
  };
  const check = pi ? [(S) => (S.conn('5V', 'GND') || S.conn('3V3', 'GND') ? [K.W.short] : null), ...inp.checks(K)] : pico ? [(S) => (S.conn('VBUS', 'GND') || S.conn('3V3', 'GND') ? [K.W.short] : null), ...inp.checks(K)] : esp ? [(S) => (S.conn('VIN', 'GND') || S.conn('3V3', 'GND') ? [K.W.short] : null), ...inp.checks(K)] : [noShort(K.W), (S) => (S.conn('rail:tp', '5V') ? null : [K.W.vRail]), ...inp.checks(K)];
  const cls = pi ? Math.max(10, CLS(job, inp, ok) + 2) : pico ? Math.max(9, CLS(job, inp, ok) + 2) : esp ? Math.max(8, CLS(job, inp, ok) + 1) : CLS(job, inp, ok); const sfx = esp ? ' (ESP32)' : pico ? ' (Pico)' : pi ? ' (Raspberry Pi)' : '';
  return {
    id, n, batch: 'F', phone: web || undefined, factory: { job: job.key, inp: ik, out: ok, board: board || 'uno' }, board: esp ? 'esp32' : pico ? 'pico' : pi ? 'pi4' : undefined, baud: esp || pico ? 115200 : undefined, lang: pico || pi ? 'py' : undefined, cls: String(cls), blocks: !esp && !pico && !pi && cls <= 6 && ik !== 'sonar', view: pi ? (wide ? 'wide' : 'pi6w') : wide ? 'wide' : esp ? 'esp4' : 'bb', wview: pi ? (wide ? 'wide' : 'pi6w') : undefined, // (pulseIn has no block yet)
    code, drawer: inp.drawer, serial: !!inp.analog, title: t3(`${job.title.en}: ${inp.name.en} → ${out.name.en}${sfx}`, `${job.title.hi}: ${inp.name.hi} → ${out.name.hi}${sfx}`, `${job.title.hg}: ${inp.name.hg} → ${out.name.hg}${sfx}`),
    goal, setup: { parts: [...out.parts, ...(inp.preParts || [])].map((p) => Object.assign({}, p)), wires: [...(esp ? ESP_POWER : pico ? PICO_POWER : pi ? PI_POWER : POWER), ...out.wires, ...(inp.preWires || [])] }, steps, check, tick,
    done: (S) => !!S.memRun.final,
  };
}
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const cmp = (ik, v, lim) => ({ pot: v > lim, ldr: v < lim, ldrb: v > lim, lm35: v > lim, cold: v < lim, dht: v > lim, hum: v > lim, sonar: v > 0 && v < lim, soil: v > lim, gas: v > lim }[ik]);

// ------------------------------------------------------------------ all of them
export function batchF(K, n0) {
  const out = []; let n = n0;
  for (const board of ['uno', 'esp32', 'pico', 'pi4']) for (const job of JOBS) for (const ok of [...job.outs, ...(job.outs.includes('lcd') ? ['oled'] : []), ...(board === 'esp32' ? ['web'] : [])]) { // (batch 12: every LCD job on the OLED too)
    const T = board === 'esp32' ? [EIN, EOUT] : board === 'pico' ? [PIN, POUT] : board === 'pi4' ? [QIN, QOUT] : [IN, OUT];
    if (!T[0][job.inp] || !T[1][ok]) continue;
    if ((board === 'uno' && HAND_MADE.has(job.key + ':' + ok)) || ((OUT[ok] || {}).clash || []).includes(job.inp)) continue;
    out.push(lesson(K, job, job.inp, ok, ++n, board));
  }
  return out;
}
export const FACTORY = { IN, OUT, EIN, EOUT, PIN, POUT, QIN, QOUT, sketch };
