// DUET Robotics Lab 360, batch 12 (Arduino Uno, Class 6): the electronics ideas a Class 6 curriculum needs and the
// earlier batches did not have yet: binary numbers on four LEDs, the diode as a one-way street, the transistor as a
// switch for a load a pin cannot drive, a servo dance from a list of angles, and a resistor colour-code reader (the
// divider rule turned round). Same shape as lessons7.js (tick, S.mem / S.memRun, live texts); circuits, sketches and
// texts are our own. devtools/test/robocore12.mjs plays every one, with a realistic mistake each.
import { rail } from './lessons7.js';

const pick = (lg, en, hi, hg) => (lg === 'hi' ? hi : lg === 'hg' ? hg : en);
function live(S0, f) { const o = {}; for (const lg of ['en', 'hi', 'hg']) Object.defineProperty(o, lg, { enumerable: true, get: () => { try { const S = S0.rt; return S ? String(f(lg, S) || '') : ''; } catch (e) { return ''; } } }); return o; }
const lineSeen = (S, re) => S.serLines.some((l) => re.test(l));

// ------------------------------------------------------------------ the sketches
const BINARY = `// Binary counter: four LEDs show the numbers 0 to 15 the way a computer stores them
const int pins[4] = {2, 3, 4, 5};   // the 1s, the 2s, the 4s and the 8s

void setup() {
  for (int b = 0; b < 4; b++) {
    pinMode(pins[b], OUTPUT);
  }
  Serial.begin(9600);
}

void loop() {
  for (int n = 0; n < 16; n++) {
    Serial.print(n);
    Serial.print(" = ");
    for (int b = 3; b >= 0; b--) {
      Serial.print(bitRead(n, b));            // bit b of n: 0 or 1
    }
    Serial.println();
    for (int b = 0; b < 4; b++) {
      digitalWrite(pins[b], bitRead(n, b));   // 1: that LED on
    }
    delay(1000);
  }
}
`;
const DIODE = `// A diode is a one-way street for current
const int pin = 7;     // pin 7 -> diode -> LED -> resistor -> GND

void setup() {
  pinMode(pin, OUTPUT);
  Serial.begin(9600);
}

void loop() {
  digitalWrite(pin, HIGH);
  Serial.println("pin 7 HIGH: current wants to flow");
  delay(1000);
  digitalWrite(pin, LOW);
  Serial.println("pin 7 LOW");
  delay(1000);
}
`;
const NPN = `// Transistor as a switch: a small current into the base switches a big one
// The lamp is three LEDs (about 13 mA each, 40 mA together): too much for one pin.
const int base = 9;    // pin 9 -> 1 kOhm -> the transistor's base

void setup() {
  pinMode(base, OUTPUT);
  Serial.begin(9600);
}

void loop() {
  digitalWrite(base, HIGH);   // a few mA into the base: the lamp's 40 mA flows
  Serial.println("ON");
  delay(1000);
  digitalWrite(base, LOW);    // no base current: the lamp is off
  Serial.println("OFF");
  delay(1000);
}
`;
const DANCE = `// Servo dance: the arm follows a list of moves
#include <Servo.h>

Servo arm;
int moves[7] = {0, 90, 180, 90, 45, 135, 90};   // the dance: angles in degrees
int beat = 600;                                 // ms for each move

void setup() {
  arm.attach(9);
  Serial.begin(9600);
}

void loop() {
  for (int i = 0; i < 7; i++) {
    arm.write(moves[i]);
    Serial.println(moves[i]);
    delay(beat);
  }
  Serial.println("bow!");
}
`;
const COLOUR = `// Resistor colour-code reader: measure an unknown resistor and name its colour bands
const char* colours[10] = {"black", "brown", "red", "orange", "yellow", "green", "blue", "violet", "grey", "white"};
const int E12[12] = {10, 12, 15, 18, 22, 27, 33, 39, 47, 56, 68, 82};   // the values resistors are made in
const long known = 10000;    // the known resistor, from 5V to A0 (10 kOhm)

void setup() {
  Serial.begin(9600);
}

void loop() {
  int raw = analogRead(A0);              // the unknown one goes from A0 to GND
  if (raw > 1000) {                      // almost 5 V: nothing (or something huge) pulls A0 down
    Serial.println("No resistor between A0 and GND");
    delay(1000);
    return;
  }
  float v = raw * 5.0 / 1023.0;
  long r = known * v / (5.0 - v);        // the divider rule, turned round
  float x = r;
  int zeros = 0;
  while (x >= 100) {                     // two digits (10 to 99.9) and a number of zeros
    x = x / 10;
    zeros++;
  }
  int best = 10;                         // the nearest value a real resistor is made in
  for (int i = 0; i < 12; i++) {
    if (fabs(x - E12[i]) < fabs(x - best)) best = E12[i];
  }
  if (fabs(x - 100) < fabs(x - best)) {  // 98.8 is nearest 100: that is 10 and one more zero
    best = 10;
    zeros++;
  }
  Serial.print(r);
  Serial.print(" ohms: ");
  Serial.print(colours[best / 10]);
  Serial.print(", ");
  Serial.print(colours[best % 10]);
  Serial.print(", ");
  Serial.println(colours[zeros]);
  delay(1000);
}
`;

// ------------------------------------------------------------------ the lessons
export function batch12(K, n0) {
  const { t3, P: PL, F, W, need, has, noShort, N, unit, LEDU, merge } = K;
  const S0 = {}; let n = n0;
  const X = {
    diodeRev: t3('The diode is the wrong way round for this lesson\'s first test: its grey band (the cathode, K) must point towards the LED, away from pin 7.', 'इस पाठ के पहले टेस्ट के लिए डायोड उल्टा लगा है: इसकी स्लेटी पट्टी (कैथोड, K) एलईडी की ओर होनी चाहिए, पिन 7 से दूर।', 'Is paath ke pehle test ke liye diode ulta laga hai: iski grey band (cathode, K) LED ki taraf honi chahiye, pin 7 se door.'),
    diodePath: t3('The path is pin 7 → diode → LED\'s long leg → LED → resistor → GND. One join is missing.', 'रास्ता है पिन 7 → डायोड → एलईडी का लंबा पैर → एलईडी → रेज़िस्टर → GND। एक जोड़ नहीं है।', 'Raasta hai pin 7 → diode → LED ka lamba pair → LED → resistor → GND. Ek jod nahi hai.'),
    npnTurned: t3('The transistor is turned round: with its flat side facing you the legs are E, B, C from the left. E goes to GND, C to the lamp.', 'ट्रांज़िस्टर उल्टा घूमा है: चपटी तरफ़ आपकी ओर हो तो बाएँ से पैर E, B, C हैं। E, GND पर और C लैंप पर जाता है।', 'Transistor ulta ghooma hai: flat side aapki taraf ho to left se pair E, B, C hain. E GND par aur C lamp par jaata hai.'),
    noBaseR: t3('Pin 9 is wired straight to the base with no resistor: the base would pull far too much current from the pin. Go through the 1 kΩ resistor.', 'पिन 9 बिना रेज़िस्टर के सीधे बेस से जुड़ा है: बेस पिन से बहुत ज़्यादा करंट खींचेगा। 1 kΩ रेज़िस्टर से होकर जोड़िए।', 'Pin 9 bina resistor ke seedhe base se juda hai: base pin se bahut zyada current kheenchega. 1 kΩ resistor se hokar jodiye.'),
    servo33: t3('The servo\'s red wire is on 3.3 V: too weak, its motor will not turn. It needs 5 V (the + rail).', 'सर्वो का लाल तार 3.3 V पर है: बहुत कमज़ोर, इसकी मोटर नहीं घूमेगी। इसे 5 V (+ रेल) चाहिए।', 'Servo ka laal wire 3.3 V par hai: bahut kamzor, iski motor nahi ghoomegi. Ise 5 V (+ rail) chahiye.'),
    rxPlace: t3('The unknown resistor must go from A0 (column 40) down to GND, the − rail. Joined to 5V, the reader sees no resistor at all.', 'अनजान रेज़िस्टर A0 (कॉलम 40) से नीचे GND, यानी − रेल तक जाना चाहिए। 5V से जुड़ा हो तो रीडर को कोई रेज़िस्टर दिखता ही नहीं।', 'Anjaan resistor A0 (column 40) se neeche GND, yaani − rail tak jaana chahiye. 5V se juda ho to reader ko koi resistor dikhta hi nahi.'),
  };
  const CHECK = { k: 'check', do: t3('Check your circuit.', 'अपना सर्किट जाँचिए।', 'Apna circuit check karo.'), see: t3('', '', '') };
  const RUN = (see) => ({ k: 'run', do: t3('Press Run.', '"चलाइए" दबाइए।', 'Run dabaiye.'), see: see || t3('', '', '') });
  const info = (en, hi, hg, see) => ({ k: 'info', do: t3(en, hi, hg), see: see || t3('', '', '') });
  const place = (q, en, hi, hg, see) => ({ k: 'place', place: q, do: t3(en, hi, hg), see: see || t3('', '', '') });
  const wire = (a, b, en, hi, hg, see) => ({ k: 'wire', wire: [a, b], do: t3(en, hi, hg), see: see || t3('', '', '') });
  const act = (until, en, hi, hg, see) => ({ k: 'act', until, do: t3(en, hi, hg), see: see || t3('', '', '') });
  const watch = (until, en, hi, hg, see) => ({ k: 'watch', until, do: t3(en, hi, hg), see: see || t3('', '', '') });
  const edit = (test, set, en, hi, hg, see) => ({ k: 'edit', test, set, do: t3(en, hi, hg), see: see || t3('', '', '') });
  const fresh = (S) => S.runSrc !== null && S.running();
  const POWER = [['5V', 'H:tp30'], ['GND3', 'H:tn18'], ['H:tp2', 'H:bp2'], ['H:tn3', 'H:bn3']];
  const rails = [noShort, (S) => (S.conn('rail:tp', '5V') ? null : [W.vRail]), (S) => (S.conn('rail:tn', 'GND') ? null : [W.gndRail])];
  const L = [];
  const add = (l) => { l.n = ++n; l.batch = 12; l.cls = l.cls || '6'; L.push(l); return l; };

  // 1 ------------------------------------------------------------------------------------------ binary counter
  const NB = [t3('red LED (the 1s)', 'लाल एलईडी (1 वाली)', 'laal LED (1 wali)'), t3('yellow LED (the 2s)', 'पीली एलईडी (2 वाली)', 'peeli LED (2 wali)'), t3('green LED (the 4s)', 'हरी एलईडी (4 वाली)', 'hari LED (4 wali)'), t3('blue LED (the 8s)', 'नीली एलईडी (8 वाली)', 'neeli LED (8 wali)')];
  const bitsNow = (S) => [1, 2, 3, 4].reduce((v, i) => v + (S.ledLit('led' + i) ? 1 << (i - 1) : 0), 0);
  const lastN = (S) => { for (let i = S.serLines.length - 1; i >= 0; i--) { const m = /^(\d+) = [01]{4}$/.exec(S.serLines[i].trim()); if (m) return +m[1]; } return null; };
  add({ id: 'u_binary', view: 'bb', code: BINARY, drawer: ['led', 'resistor'], serial: true,
    title: t3('Binary counter on 4 LEDs', '4 एलईडी पर बाइनरी काउंटर', '4 LED par binary counter'),
    goal: t3('Count from 0 to 15 with four LEDs, the way a computer stores numbers: each LED is one bit worth 1, 2, 4 or 8.', 'चार एलईडी से 0 से 15 तक गिनिए, जैसे कंप्यूटर संख्याएँ रखता है: हर एलईडी एक बिट है जिसकी क़ीमत 1, 2, 4 या 8 है।', 'Chaar LED se 0 se 15 tak giniye, jaise computer numbers rakhta hai: har LED ek bit hai jiski keemat 1, 2, 4 ya 8 hai.'),
    setup: { parts: merge(LEDU(1, 21, 'red', 2), LEDU(2, 24, 'yellow', 3), LEDU(3, 27, 'green', 4)).parts, wires: [...POWER, ...merge(LEDU(1, 21, 'red', 2), LEDU(2, 24, 'yellow', 3), LEDU(3, 27, 'green', 4)).wires] },
    tick: (S, dt) => { const R = S.memRun; if (!fresh(S)) return; const k = lastN(S); if (k === null) return; R.t = (R.k === k ? (R.t || 0) : 0) + (dt || 1 / 60); R.k = k; if (R.t < 0.3) return; if (bitsNow(S) === k) { (R.ok || (R.ok = new Set())).add(k); if (k % 2 === 1) R.odd = true; } if (S.ledLit('led1')) R.ones = true; },
    steps: [
      info('Computers count with only two digits, 0 and 1: off and on. Four LEDs can show every number from 0 to 15. Three are ready: red is the 1s (pin 2), yellow the 2s (pin 3), green the 4s (pin 4).', 'कंप्यूटर सिर्फ़ दो अंकों से गिनते हैं, 0 और 1: बंद और चालू। चार एलईडी 0 से 15 तक हर संख्या दिखा सकती हैं। तीन तैयार हैं: लाल 1 वाली (पिन 2), पीली 2 वाली (पिन 3), हरी 4 वाली (पिन 4)।', 'Computer sirf do ankon se ginte hain, 0 aur 1: band aur chalu. Chaar LED 0 se 15 tak har number dikha sakti hain. Teen taiyaar hain: laal 1 wali (pin 2), peeli 2 wali (pin 3), hari 4 wali (pin 4).'),
      place(PL('led4', 'led', { color: 'blue' }, 'e30', 0), 'Put the blue LED at the ghost: it is the 8s, long leg in column 31.', 'नीली एलईडी को नीली आकृति पर लगाइए: यह 8 वाली है, लंबा पैर कॉलम 31 में।', 'Neeli LED ko neeli shape par lagaiye: yeh 8 wali hai, lamba pair column 31 mein.'),
      place(PL('r4', 'resistor', { ohms: 220 }, 'b30', 3), 'Put its 220 Ω resistor from column 30 up to the − rail.', 'इसका 220 Ω रेज़िस्टर कॉलम 30 से ऊपर − रेल तक लगाइए।', 'Iska 220 Ω resistor column 30 se upar − rail tak lagaiye.'),
      wire('D5', 'led4.A', 'Wire pin 5 to its long leg (column 31).', 'पिन 5 को इसके लंबे पैर (कॉलम 31) से जोड़िए।', 'Pin 5 ko iske lambe pair (column 31) se jodiye.'),
      CHECK,
      info('Read the code. bitRead(n, b) gives bit b of the number n, 0 or 1, and digitalWrite turns that LED on for a 1. The Serial Monitor shows each number with its four bits.', 'कोड पढ़िए। bitRead(n, b) संख्या n का बिट b देता है, 0 या 1, और 1 होने पर digitalWrite वह एलईडी जलाता है। सीरियल मॉनिटर हर संख्या उसके चार बिट के साथ दिखाता है।', 'Code padhiye. bitRead(n, b) number n ka bit b deta hai, 0 ya 1, aur 1 hone par digitalWrite woh LED jalata hai. Serial Monitor har number uske chaar bit ke saath dikhata hai.'),
      RUN(),
      watch((S) => { const o = S.memRun.ok; return !!o && o.has(5) && o.has(10) && o.has(15); }, 'Count along with the LEDs up to 15.', 'एलईडी के साथ 15 तक गिनिए।', 'LED ke saath 15 tak giniye.',
        t3('5 = 0101: the 4s and the 1s are on, 4 + 1 = 5. 10 = 1010: 8 + 2. 15 = 1111: all four, 8 + 4 + 2 + 1.', '5 = 0101: 4 वाली और 1 वाली जलीं, 4 + 1 = 5। 10 = 1010: 8 + 2। 15 = 1111: चारों, 8 + 4 + 2 + 1।', '5 = 0101: 4 wali aur 1 wali jali, 4 + 1 = 5. 10 = 1010: 8 + 2. 15 = 1111: chaaron, 8 + 4 + 2 + 1.')),
      edit((src) => /n \+= 2/.test(src), [[/n\+\+/, 'n += 2']], 'Count in twos: change n++ to n += 2, and press Run.', 'दो-दो करके गिनिए: n++ को n += 2 कीजिए, और "चलाइए" दबाइए।', 'Do-do karke giniye: n++ ko n += 2 karo, aur Run dabaiye.'),
      watch((S) => fresh(S) && !!S.memRun.ok && S.memRun.ok.size >= 4 && !S.memRun.ones && !S.memRun.odd, 'Watch the red LED (the 1s) while it counts 0, 2, 4, 6 …', 'जब यह 0, 2, 4, 6 … गिने, तब लाल एलईडी (1 वाली) देखिए।', 'Jab yeh 0, 2, 4, 6 … gine, tab laal LED (1 wali) dekhiye.',
        t3('The red LED never lights: every even number ends in 0 in binary. That is how a computer tells odd from even in one step.', 'लाल एलईडी कभी नहीं जलती: बाइनरी में हर सम संख्या 0 पर ख़त्म होती है। इसी से कंप्यूटर एक ही क़दम में सम और विषम पहचानता है।', 'Laal LED kabhi nahi jalti: binary mein har sam sankhya 0 par khatam hoti hai. Isi se computer ek hi kadam mein sam aur visham pehchaanta hai.')),
    ],
    check: [...rails, unit('led1', 'r1', 2, NB[0]), unit('led2', 'r2', 3, NB[1]), unit('led3', 'r3', 4, NB[2]), unit('led4', 'r4', 5, NB[3])],
    done: (S) => !!S.memRun.ok && S.memRun.ok.size >= 4 && !S.memRun.ones && /n \+= 2/.test(S.runSrc || '') });

  // 2 ------------------------------------------------------------------------------------------ diode: one-way street
  add({ id: 'u_diode', view: 'bb', code: DIODE, drawer: ['diode'], serial: true,
    title: t3('Diode one-way street', 'डायोड: एक-तरफ़ा सड़क', 'Diode: ek-tarfa sadak'),
    goal: t3('Put a diode in the LED\'s path and see that current passes one way only: turned round, it blocks.', 'एलईडी के रास्ते में डायोड लगाइए और देखिए कि करंट सिर्फ़ एक तरफ़ जाता है: उल्टा लगाने पर रुक जाता है।', 'LED ke raaste mein diode lagaiye aur dekhiye ki current sirf ek taraf jaata hai: ulta lagane par ruk jaata hai.'),
    setup: { parts: [PL('led1', 'led', { color: 'red' }, 'e43', 0), PL('r1', 'resistor', { ohms: 220 }, 'b43', 3)], wires: [...POWER, ['D7', 'H:a40']] },
    tick: (S, dt) => { const R = S.memRun; if (!fresh(S)) return; const hi = S.lab.mcu.pins[7] && S.lab.mcu.pins[7].level === 1; const p = S.part('d1'); if (!p) return; const fwd = S.conn('d1.A', 'D7'); if (hi && S.ledLit('led1') && fwd) R.fwd = true; if (hi && !S.ledLit('led1') && S.conn('d1.K', 'D7') && S.conn('d1.A', 'led1.A')) { R.hiT = (R.hiT || 0) + (dt || 1 / 60); if (R.hiT > 0.5) S.mem.blocked = true; } },
    steps: [
      info('Pin 7 is wired to column 40, and the LED with its resistor is ready in columns 43–44. A diode lets current through one way only: from its anode (A) to its cathode (K, the end with the grey band).', 'पिन 7 कॉलम 40 से जुड़ा है, और एलईडी अपने रेज़िस्टर के साथ कॉलम 43–44 में तैयार है। डायोड करंट को सिर्फ़ एक तरफ़ जाने देता है: एनोड (A) से कैथोड (K, स्लेटी पट्टी वाला सिरा) की ओर।', 'Pin 7 column 40 se juda hai, aur LED apne resistor ke saath column 43–44 mein taiyaar hai. Diode current ko sirf ek taraf jaane deta hai: anode (A) se cathode (K, grey band wala end) ki taraf.'),
      place(PL('d1', 'diode', {}, 'c40', 0), 'Put the diode from 40c to 44c, its grey band at column 44 (towards the LED).', 'डायोड को 40c से 44c तक लगाइए, इसकी स्लेटी पट्टी कॉलम 44 पर (एलईडी की ओर)।', 'Diode ko 40c se 44c tak lagaiye, iski grey band column 44 par (LED ki taraf).'),
      CHECK,
      RUN(),
      watch((S) => !!S.memRun.fwd, 'Watch the LED.', 'एलईडी देखिए।', 'LED dekhiye.', t3('It blinks: when pin 7 is HIGH, current goes A → K through the diode, then through the LED. The diode takes about 0.7 V of the 5 V.', 'यह झपकती है: जब पिन 7 HIGH होता है, करंट डायोड में A → K जाता है, फिर एलईडी से। डायोड 5 V में से लगभग 0.7 V लेता है।', 'Yeh jhapakti hai: jab pin 7 HIGH hota hai, current diode mein A → K jaata hai, phir LED se. Diode 5 V mein se lagbhag 0.7 V leta hai.')),
      act((S) => !S.has('d1'), 'Take the diode out (tap it, then delete it).', 'डायोड निकालिए (उसे छूइए, फिर मिटाइए)।', 'Diode nikaaliye (use touch karo, phir mitaiye).'),
      place(PL('d1', 'diode', {}, 'c44', 2), 'Put it back the other way round: grey band at column 40, towards pin 7.', 'इसे उल्टा वापस लगाइए: स्लेटी पट्टी कॉलम 40 पर, पिन 7 की ओर।', 'Ise ulta wapas lagaiye: grey band column 40 par, pin 7 ki taraf.'),
      watch((S) => !!S.mem.blocked, 'Watch the LED while pin 7 is HIGH.', 'जब पिन 7 HIGH हो, तब एलईडी देखिए।', 'Jab pin 7 HIGH ho, tab LED dekhiye.',
        t3('Dark, even though pin 7 says HIGH: the diode blocks the current coming into its cathode. That is how a phone charger turns AC into DC, and how a diode protects a circuit from a battery put in backwards.', 'अँधेरा, जबकि पिन 7 HIGH है: डायोड अपने कैथोड में आने वाले करंट को रोकता है। फ़ोन चार्जर इसी तरह AC को DC बनाता है, और डायोड उल्टी लगी बैटरी से सर्किट को ऐसे ही बचाता है।', 'Andhera, jabki pin 7 HIGH hai: diode apne cathode mein aane wale current ko rokta hai. Phone charger isi tarah AC ko DC banata hai, aur diode ulti lagi battery se circuit ko aise hi bachata hai.')),
    ],
    check: [...rails, has('d1', N.d), (S) => (S.has('led1') && S.sameStrip('led1.A', 'led1.K') ? [W.ledShort] : null),
      (S) => (S.conn('d1.K', 'D7') && S.conn('d1.A', 'led1.A') ? [X.diodeRev] : null), (S) => (S.conn('d1.A', 'D7') && S.conn('d1.K', 'led1.A') ? null : [X.diodePath]),
      (S) => (S.conn('led1.K', 'r1.1') && S.conn('r1.2', 'GND') ? null : [W.toGnd, { x: t3('resistor', 'रेज़िस्टर', 'resistor') }])],
    done: (S) => !!S.mem.blocked });

  // 3 ------------------------------------------------------------------------------------------ transistor as a switch
  // the lamp: three LEDs, each from the + rail through 220 Ω (across the gap) to a shared line in row j that the collector takes to GND
  const lampLED = (i, c, color) => [PL('led' + i, 'led', { color }, 'e' + c, 0), PL('r' + i, 'resistor', { ohms: 220 }, 'd' + c, 1)];
  const LAMP = { parts: [...lampLED(1, 20, 'white'), ...lampLED(2, 24, 'white'), ...lampLED(3, 28, 'white')],
    wires: [['H:a21', rail('tp', 21)], ['H:a25', rail('tp', 25)], ['H:a29', rail('tp', 29)], ['H:j20', 'H:j24'], ['H:i24', 'H:i28']] };
  const pinMA = (S, p) => { const e = S.lab.els.find((q) => q.role === 'pin' && q.pin === p); return e ? Math.abs(e.iAvg || 0) * 1000 : 0; };
  const lampMA = (S) => [1, 2, 3].reduce((a, i) => { const e = S.lab.els.find((q) => q.part === S.part('led' + i)); return a + (e ? Math.abs(e.iAvg || 0) * 1000 : 0); }, 0);
  add({ id: 'u_npn', view: 'bb', code: NPN, drawer: ['npn', 'resistor'], serial: true,
    title: t3('Transistor as a switch', 'स्विच की तरह ट्रांज़िस्टर', 'Switch ki tarah transistor'),
    goal: t3('A lamp of three LEDs needs about 40 mA, the most a pin can give. Let a transistor switch it, with only a few mA from the pin.', 'तीन एलईडी के लैंप को लगभग 40 mA चाहिए, जितना एक पिन अधिकतम दे सकता है। इसे ट्रांज़िस्टर से चलाइए, पिन से सिर्फ़ कुछ mA लेकर।', 'Teen LED ke lamp ko lagbhag 40 mA chahiye, jitna ek pin adhiktam de sakta hai. Ise transistor se chalaiye, pin se sirf kuch mA lekar.'),
    setup: { parts: LAMP.parts, wires: [...POWER, ...LAMP.wires] },
    tick: (S) => { const R = S.memRun; if (!fresh(S)) return; const on = [1, 2, 3].every((i) => S.ledLit('led' + i)); if (on) { R.on = true; R.pinMA = Math.max(R.pinMA || 0, pinMA(S, 9)); R.lampMA = Math.max(R.lampMA || 0, lampMA(S)); } else if (R.on && [1, 2, 3].every((i) => !S.ledLit('led' + i))) R.off = true; },
    steps: [
      info('The lamp is ready: three white LEDs, each from the + rail through its 220 Ω resistor to one shared line along row j. Nothing joins that line to GND yet, so the lamp is off.', 'लैंप तैयार है: तीन सफ़ेद एलईडी, हर एक + रेल से अपने 220 Ω रेज़िस्टर से होकर पंक्ति j की एक साझा लाइन तक। अभी वह लाइन GND से नहीं जुड़ी, इसलिए लैंप बंद है।', 'Lamp taiyaar hai: teen safed LED, har ek + rail se apne 220 Ω resistor se hokar row j ki ek saajha line tak. Abhi woh line GND se nahi judi, isliye lamp band hai.'),
      place(PL('q1', 'npn', {}, 'e40', 0), 'Put the transistor in 40e–42e, its flat side facing you (E, B, C from the left).', 'ट्रांज़िस्टर को 40e–42e में लगाइए, चपटी तरफ़ आपकी ओर (बाएँ से E, B, C)।', 'Transistor ko 40e–42e mein lagaiye, flat side aapki taraf (left se E, B, C).'),
      place(PL('rb', 'resistor', { ohms: 1000 }, 'c37', 0), 'Put the 1 kΩ resistor from 37c to 41c: it feeds the base gently.', '1 kΩ रेज़िस्टर 37c से 41c तक लगाइए: यह बेस को हल्का करंट देता है।', '1 kΩ resistor 37c se 41c tak lagaiye: yeh base ko halka current deta hai.'),
      wire('D9', 'rb.1', 'Wire pin 9 to the resistor (column 37).', 'पिन 9 को रेज़िस्टर (कॉलम 37) से जोड़िए।', 'Pin 9 ko resistor (column 37) se jodiye.'),
      wire('q1.E', 'rail:tn', 'Wire the emitter (column 40) to the − rail.', 'एमिटर (कॉलम 40) को − रेल से जोड़िए।', 'Emitter (column 40) ko − rail se jodiye.'),
      wire('r3.2', 'q1.C', 'Wire the lamp\'s shared line (row j) to the collector (column 42).', 'लैंप की साझा लाइन (पंक्ति j) को कलेक्टर (कॉलम 42) से जोड़िए।', 'Lamp ki saajha line (row j) ko collector (column 42) se jodiye.'),
      CHECK,
      RUN(),
      watch((S) => !!S.memRun.on && !!S.memRun.off, 'Watch the lamp, and point at pin 9\'s wire and at an LED to see their currents.', 'लैंप देखिए, और पिन 9 के तार और किसी एलईडी पर पॉइंट करके उनका करंट देखिए।', 'Lamp dekhiye, aur pin 9 ke wire aur kisi LED par point karke unka current dekhiye.',
        live(S0, (lg, S) => { const a = (S.memRun.pinMA || 0).toFixed(1), b = Math.round(S.memRun.lampMA || 0); return pick(lg, `The lamp flashes. Pin 9 gives only about ${a} mA into the base, and the transistor lets about ${b} mA flow through the lamp: a small current switches a big one.`, `लैंप चमकता-बुझता है। पिन 9 बेस में सिर्फ़ लगभग ${a} mA देता है, और ट्रांज़िस्टर लैंप से लगभग ${b} mA बहने देता है: छोटा करंट बड़े करंट को चलाता है।`, `Lamp chamakta-bujhta hai. Pin 9 base mein sirf lagbhag ${a} mA deta hai, aur transistor lamp se lagbhag ${b} mA behne deta hai: chhota current bade current ko chalata hai.`); })),
      edit((src) => /delay\(150\)/.test(src) && !/delay\(1000\)/.test(src), [[/delay\(1000\)/g, 'delay(150)']], 'Make it a warning beacon: change both delay(1000) to delay(150), and press Run.', 'इसे चेतावनी बीकन बनाइए: दोनों delay(1000) को delay(150) कीजिए, और "चलाइए" दबाइए।', 'Ise warning beacon banaiye: dono delay(1000) ko delay(150) karo, aur Run dabaiye.'),
      watch((S) => fresh(S) && !!S.memRun.on && !!S.memRun.off && S.serLines.filter((l) => /^ON$/.test(l.trim())).length >= 4, 'Watch the beacon.', 'बीकन देखिए।', 'Beacon dekhiye.', t3('Fast flashes: a transistor can switch thousands of times a second without wearing out, unlike a relay\'s moving contact.', 'तेज़ चमक: ट्रांज़िस्टर एक सेकंड में हज़ारों बार बिना घिसे स्विच कर सकता है, रिले के हिलने वाले कॉन्टैक्ट की तरह नहीं।', 'Tez chamak: transistor ek second mein hazaaron baar bina ghise switch kar sakta hai, relay ke hilne wale contact ki tarah nahi.')),
    ],
    check: [...rails, has('q1', N.q), (S) => (S.conn('D9', 'q1.B') ? [X.noBaseR] : null), has('rb', N.r), (S) => (S.chain('D9', [['rb']], 'q1.B') ? null : [W.join, { a: t3('Pin 9', 'पिन 9', 'Pin 9'), b: t3('the base (B), through the 1 kΩ resistor', 'बेस (B), 1 kΩ रेज़िस्टर से होकर', 'base (B), 1 kΩ resistor se hokar') }]),
      (S) => (S.conn('q1.C', 'GND') && S.conn('q1.E', 'r3.2') ? [X.npnTurned] : null), need('q1.E', 'GND', W.toGnd, { x: t3('emitter (E)', 'एमिटर (E)', 'emitter (E)') }),
      need('r3.2', 'q1.C', W.join, { a: t3('The lamp\'s shared line', 'लैंप की साझा लाइन', 'Lamp ki saajha line'), b: t3('the collector (C)', 'कलेक्टर (C)', 'collector (C)') })],
    done: (S) => !!S.memRun.on && !!S.memRun.off && /delay\(150\)/.test(S.runSrc || '') });

  // 4 ------------------------------------------------------------------------------------------ servo dance
  const angles = (S) => S.serLines.map((l) => /^(\d+)$/.exec(l.trim())).filter(Boolean).map((m) => +m[1]);
  add({ id: 'u_servodance', view: 'wide', code: DANCE, drawer: ['servo'], serial: true,
    title: t3('Servo dance', 'सर्वो का नाच', 'Servo ka naach'),
    goal: t3('Write a dance as a list of angles: the servo arm follows it, beat by beat. Then change the beat.', 'नाच को कोणों की सूची की तरह लिखिए: सर्वो की भुजा ताल-दर-ताल उसके पीछे चलती है। फिर ताल बदलिए।', 'Naach ko konon ki list ki tarah likhiye: servo ki bhuja taal-dar-taal uske peeche chalti hai. Phir taal badliye.'),
    setup: { parts: [], wires: [...POWER] },
    tick: (S) => { const R = S.memRun; if (!fresh(S)) return; const p = S.part('sv1'); if (!p) return; const a = p.state.angle; if (a < 3) R.a0 = true; if (a > 177) R.a180 = true; if (Math.abs(a - 45) < 3) R.a45 = true; const bows = S.serLines.filter((l) => /bow!/.test(l)).length; if (bows !== R.bows) { if (R.bows !== undefined) { R.loop = S.t - (R.bowT || S.t); } R.bowT = S.t; R.bows = bows; } },
    steps: [
      place(F('sv1', 'servo', {}, 120, 120, 0), 'Put the servo on the mat at the ghost.', 'सर्वो को मैट पर नीली आकृति पर रखिए।', 'Servo ko mat par neeli shape par rakhiye.'),
      wire('sv1.GND', 'rail:bn', 'Wire its brown wire to the front − rail.', 'इसका भूरा तार आगे वाली − रेल से जोड़िए।', 'Iska bhoora wire aage wali − rail se jodiye.'),
      wire('sv1.VP', 'rail:bp', 'Its red wire to the front + rail (5 V).', 'इसका लाल तार आगे वाली + रेल (5 V) से।', 'Iska laal wire aage wali + rail (5 V) se.'),
      wire('sv1.SIG', 'D9', 'Its orange wire (signal) to pin 9.', 'इसका नारंगी तार (सिग्नल) पिन 9 से।', 'Iska orange wire (signal) pin 9 se.'),
      CHECK,
      info('Read the code. moves[7] is a list of seven angles; the for loop takes them one by one: moves[0] is 0, moves[1] is 90 … Each move lasts one beat.', 'कोड पढ़िए। moves[7] सात कोणों की सूची है; for लूप उन्हें एक-एक करके लेता है: moves[0] है 0, moves[1] है 90 … हर चाल एक ताल तक चलती है।', 'Code padhiye. moves[7] saat konon ki list hai; for loop unhe ek-ek karke leta hai: moves[0] hai 0, moves[1] hai 90 … Har chaal ek taal tak chalti hai.'),
      RUN(),
      watch((S) => !!S.memRun.a0 && !!S.memRun.a180 && !!S.memRun.a45 && (S.memRun.bows || 0) >= 1, 'Watch one whole dance.', 'एक पूरा नाच देखिए।', 'Ek poora naach dekhiye.', t3('0°, 90°, 180°, back, 45°, 135° and a bow: the arm follows the list exactly, about 4 seconds for the dance.', '0°, 90°, 180°, वापस, 45°, 135° और झुककर सलाम: भुजा सूची के ठीक पीछे चलती है, नाच में लगभग 4 सेकंड।', '0°, 90°, 180°, wapas, 45°, 135° aur jhuk kar salaam: bhuja list ke theek peeche chalti hai, naach mein lagbhag 4 second.')),
      edit((src) => /int beat = 300;/.test(src), [[/int beat = 600;/, 'int beat = 300;']], 'Dance twice as fast: change beat = 600 to beat = 300, and press Run.', 'दुगनी तेज़ी से नाचिए: beat = 600 को beat = 300 कीजिए, और "चलाइए" दबाइए।', 'Dugni tezi se naachiye: beat = 600 ko beat = 300 karo, aur Run dabaiye.'),
      watch((S) => fresh(S) && (S.memRun.bows || 0) >= 2 && S.memRun.loop > 0 && S.memRun.loop < 2.6 && !!S.memRun.a180, 'Watch the faster dance.', 'तेज़ नाच देखिए।', 'Tez naach dekhiye.',
        live(S0, (lg, S) => { const t = (S.memRun.loop || 0).toFixed(1); return pick(lg, `One dance now takes about ${t} s. Still every angle: the servo turns about 500° a second, so 300 ms is enough even for 0° → 180°. Try 100: the arm can no longer keep up.`, `अब एक नाच में लगभग ${t} s लगते हैं। फिर भी हर कोण: सर्वो एक सेकंड में लगभग 500° घूमता है, इसलिए 0° → 180° के लिए भी 300 ms काफ़ी है। 100 आज़माइए: भुजा पीछे रह जाती है।`, `Ab ek naach mein lagbhag ${t} s lagte hain. Phir bhi har kon: servo ek second mein lagbhag 500° ghoomta hai, isliye 0° → 180° ke liye bhi 300 ms kaafi hai. 100 aazmaiye: bhuja peeche reh jaati hai.`); })),
    ],
    check: [...rails, (S) => (S.conn('rail:bp', '5V') && S.conn('rail:bn', 'GND') ? null : [W.vRail]), has('sv1', N.servo), (S) => (S.conn('sv1.VP', '3V3') ? [X.servo33] : null), need('sv1.VP', '5V', W.to5v, { x: t3('servo\'s red wire', 'सर्वो का लाल तार', 'servo ka laal wire') }),
      need('sv1.GND', 'GND', W.toGnd, { x: t3('servo\'s brown wire', 'सर्वो का भूरा तार', 'servo ka bhoora wire') }), need('sv1.SIG', 'D9', W.toPin, { x: t3('servo\'s orange wire', 'सर्वो का नारंगी तार', 'servo ka orange wire'), p: 9 })],
    done: (S) => (S.memRun.bows || 0) >= 2 && /int beat = 300;/.test(S.runSrc || '') });

  // 5 ------------------------------------------------------------------------------------------ resistor colour-code reader
  const read = (S, re) => S.serLines.some((l) => re.test(l));
  add({ id: 'u_colourcode', view: 'bb', code: COLOUR, drawer: ['resistor'], serial: true,
    title: t3('Resistor colour-code reader', 'रेज़िस्टर रंग-कोड रीडर', 'Resistor rang-code reader'),
    goal: t3('Measure an unknown resistor with a known one and A0, then name its colour bands: the first two are digits, the third is how many zeros.', 'एक जाने-पहचाने रेज़िस्टर और A0 से अनजान रेज़िस्टर नापिए, फिर उसकी रंगीन पट्टियाँ बताइए: पहली दो अंक हैं, तीसरी बताती है कितने शून्य।', 'Ek jaane-pehchaane resistor aur A0 se anjaan resistor naapiye, phir uski rangeen pattiyan bataiye: pehli do ank hain, teesri batati hai kitne shunya.'),
    setup: { parts: [PL('rk', 'resistor', { ohms: 10000 }, 'a40', 3)], wires: [...POWER, ['A0', 'H:c40']] },
    steps: [
      info('The known 10 kΩ resistor goes from the + rail down to column 40, and A0 reads column 40. The unknown one will go from column 40 to GND: the two share the 5 V, and A0 tells us how.', 'जाना-पहचाना 10 kΩ रेज़िस्टर + रेल से नीचे कॉलम 40 तक है, और A0 कॉलम 40 पढ़ता है। अनजान रेज़िस्टर कॉलम 40 से GND तक जाएगा: दोनों 5 V बाँटते हैं, और A0 बताता है कि कैसे।', 'Jaana-pehchaana 10 kΩ resistor + rail se neeche column 40 tak hai, aur A0 column 40 padhta hai. Anjaan resistor column 40 se GND tak jaayega: dono 5 V baant-te hain, aur A0 batata hai ki kaise.'),
      place(PL('rx', 'resistor', { ohms: 4700 }, 'b40', 3), 'Put the unknown resistor (yellow, violet, red) from 40b up to the − rail.', 'अनजान रेज़िस्टर (पीला, बैंगनी, लाल) 40b से ऊपर − रेल तक लगाइए।', 'Anjaan resistor (peela, baingani, laal) 40b se upar − rail tak lagaiye.'),
      CHECK,
      info('Read the code: r = 10000 × V ÷ (5 − V) turns the voltage into ohms. The while loop keeps two digits and counts the zeros; E12[ ] snaps the reading to the nearest value resistors are made in (a 1 kΩ may measure 988 Ω); colours[ ] names each: 0 black, 1 brown, 2 red … 9 white.', 'कोड पढ़िए: r = 10000 × V ÷ (5 − V) वोल्टेज को ओम में बदलता है। while लूप दो अंक रखता है और शून्य गिनता है; E12[ ] रीडिंग को उस सबसे पास वाली क़ीमत पर ले आता है जिसमें रेज़िस्टर बनते हैं (1 kΩ का माप 988 Ω आ सकता है); colours[ ] हर एक का रंग बताता है: 0 काला, 1 भूरा, 2 लाल … 9 सफ़ेद।', 'Code padhiye: r = 10000 × V ÷ (5 − V) voltage ko ohm mein badalta hai. while loop do ank rakhta hai aur shunya ginta hai; E12[ ] reading ko us sabse paas wali keemat par le aata hai jismein resistor bante hain (1 kΩ ka maap 988 Ω aa sakta hai); colours[ ] har ek ka rang batata hai: 0 kaala, 1 bhoora, 2 laal … 9 safed.'),
      RUN(),
      watch((S) => read(S, /ohms: yellow, violet, red/), 'Open the Serial Monitor.', 'सीरियल मॉनिटर खोलिए।', 'Serial Monitor kholiye.', t3('About 4700 ohms: yellow (4), violet (7), red (2 zeros) = 47 00 = 4.7 kΩ, the bands on the resistor.', 'लगभग 4700 ओम: पीला (4), बैंगनी (7), लाल (2 शून्य) = 47 00 = 4.7 kΩ, जो पट्टियाँ रेज़िस्टर पर हैं।', 'Lagbhag 4700 ohm: peela (4), baingani (7), laal (2 shunya) = 47 00 = 4.7 kΩ, jo pattiyan resistor par hain.')),
      act((S) => S.part('rx') && S.part('rx').props.ohms === 220 && read(S, /ohms: red, red, brown/), 'Tap the unknown resistor and change its value to 220 Ω.', 'अनजान रेज़िस्टर को छूइए और उसकी क़ीमत 220 Ω कीजिए।', 'Anjaan resistor ko touch karo aur uski keemat 220 Ω karo.', t3('red, red, brown: 22 and one zero, 220 Ω.', 'लाल, लाल, भूरा: 22 और एक शून्य, 220 Ω।', 'laal, laal, bhoora: 22 aur ek shunya, 220 Ω.')),
      act((S) => S.part('rx') && S.part('rx').props.ohms === 100000 && read(S, /ohms: brown, black, yellow/), 'Now try 100 kΩ.', 'अब 100 kΩ आज़माइए।', 'Ab 100 kΩ aazmaiye.', t3('brown, black, yellow: 10 and four zeros, 100 000 Ω. The real Arduino reads big resistors less exactly: A0 has only 1024 steps.', 'भूरा, काला, पीला: 10 और चार शून्य, 100 000 Ω। असली Arduino बड़े रेज़िस्टर कम सटीक पढ़ता है: A0 में सिर्फ़ 1024 क़दम हैं।', 'bhoora, kaala, peela: 10 aur chaar shunya, 100 000 Ω. Asli Arduino bade resistor kam sateek padhta hai: A0 mein sirf 1024 kadam hain.')),
    ],
    check: [...rails, has('rk', N.r), has('rx', t3('unknown resistor', 'अनजान रेज़िस्टर', 'anjaan resistor')), (S) => (S.connAny('rx', '5V') && !S.connAny('rx', 'GND') ? [X.rxPlace] : null),
      (S) => ((S.conn('rx.1', 'A0') && S.conn('rx.2', 'GND')) || (S.conn('rx.2', 'A0') && S.conn('rx.1', 'GND')) ? null : [X.rxPlace]),
      (S) => ((S.conn('rk.1', 'A0') && S.conn('rk.2', '5V')) || (S.conn('rk.2', 'A0') && S.conn('rk.1', '5V')) ? null : [W.join, { a: t3('The 10 kΩ resistor', '10 kΩ रेज़िस्टर', '10 kΩ resistor'), b: t3('5V and A0', '5V और A0', '5V aur A0') }])],
    done: (S) => read(S, /ohms: brown, black, yellow/) });

  batch12.rt = null; Object.defineProperty(S0, 'rt', { get: () => batch12.rt });
  for (const l of L) { const t0 = l.tick; l.tick = (S, dt) => { batch12.rt = S; if (t0) t0(S, dt); }; }
  return L;
}
