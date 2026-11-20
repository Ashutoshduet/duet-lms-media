// DUET Robotics Lab 360: the Arduino basics, as data. A lesson lists the parts already on the bench (setup), the sketch,
// and 4–10 guided steps. Step kinds:
//   tap    tap a part of the board (region)                      place  put a part where the blue ghost shows
//   wire   join two points (any hole of the right strip counts)  check  "Check my circuit" says it is right
//   edit   change the code as asked (test on the text)          run    upload and run the sketch
//   act    do something on the bench (press, turn, slide)       watch  look: the step is done when it really happens
//   info   read, then Next
// check: the circuit checks, in order; the first that fails is the message shown. done: the lesson is complete only when
// the real circuit and code have worked (observed on the bench, not taken from the step list).
// Helpers get S (lessonrt.js): conn(a, b), has(tag), part(tag), led(tag), servo(tag), adc(ch), lines(re), ...
import { batch2 } from './lessons2.js';
import { batch4 } from './lessons4.js'; // batch 4: Nano, Mega 2560, ESP32 (WiFi, Bluetooth, touch, Hall)
import { batch3 } from './lessons3.js'; // batch 3: school-lab module projects
import { batch5 } from './lessons5.js'; // batch 5: the BBC micro:bit V2 in Python (and blocks)
import { batch6 } from './lessons6.js'; // batch 6: Raspberry Pi Pico (MicroPython) and Raspberry Pi 4 (Python, gpiozero)
import { batch7 } from './lessons7.js';
import { batch8 } from './lessons8.js'; // micro:bit projects for Class 3
import { batch9 } from './lessons9.js'; // micro:bit projects for Class 4 (radio, servos, sensors)
import { batch10 } from './lessons10.js'; // first micro:bit projects for Class 2
import { batch11 } from './lessons11.js'; // micro:bit loggers, games and machines for Class 5
import { batch13 } from './lessons13.js'; // micro:bit for Classes 4-5: dimmer, hot or cold by RSSI, exercise coach
import { batch12 } from './lessons12.js'; // Class 6 on the Uno: binary, diode, transistor switch, servo dance, colour code
import { batchC } from './circuits.js'; // battery circuits for Classes 1-3 (no code)
import { batchF } from './factory.js'; // the project factory: one-line plans made into whole lessons (Uno, ESP32, Pico) // batch 7: thirty more Arduino projects (games, alarms, meters, displays, home automation)
import { batchFM } from './factorymb.js'; // batch 14: the project bank on the micro:bit (Classes 3-6)
import { batch14 } from './lessons14.js'; // batch 14: the Class 7 robot cars (table robot, light-seeker, dancer, lap counter)
import { batch15 } from './lessons15.js'; // batch 15: Class 10 on the Raspberry Pi 4 (traffic lights, reaction game, distance, quiz buzzer, Morse)
import { batch16, batch16mb } from './lessons16.js';
import { batch17 } from './lessons17.js'; // batch 17: Class 9 (Pico password lock, Pico gas alarm, Uno bank locker) // batch 16: Class 8 (smart home on a web page with four switches, RFID attendance register)
const t3 = (en, hi, hg) => ({ en, hi, hg });
const grp = (list, g) => { for (const l of list) l.group = l.group || g; return list; }; // a lesson's section in the lesson strip
const P = (tag, type, props, hole, rot) => ({ tag, type, props: props || {}, at: { hole }, rot: rot || 0 });
const F = (tag, type, props, x, z, rot) => ({ tag, type, props: props || {}, at: { x, z }, rot: rot || 0 });
const RAILS = [['5V', 'rail:tp'], ['GND3', 'rail:tn']];

// the same words are used by many lessons
const W = {
  ledShort: t3('Both legs of the LED are in the same column, so they are joined: no current goes through the LED. Move one leg to the next column.',
    'एलईडी के दोनों पैर एक ही कॉलम में हैं, इसलिए आपस में जुड़ गए: करंट एलईडी से होकर नहीं जाएगा। एक पैर को अगले कॉलम में लगाइए।',
    'LED ke dono pair ek hi column mein hain, isliye aapas mein jud gaye: current LED se hokar nahi jayega. Ek pair ko agle column mein lagaiye.'),
  ledRev: t3('The LED is the wrong way round. Its long leg (+) must go towards the Arduino pin, and its short leg (−) towards GND.',
    'एलईडी उल्टी लगी है। इसका लंबा पैर (+) Arduino के पिन की तरफ़ और छोटा पैर (−) GND की तरफ़ जाना चाहिए।',
    'LED ulti lagi hai. Iska lamba pair (+) Arduino ke pin ki taraf aur chhota pair (−) GND ki taraf jaana chahiye.'),
  noRes: t3('No resistor: the LED is joined straight to the pin and GND. Too much current will burn it. Put the resistor in the path.',
    'रेज़िस्टर नहीं है: एलईडी सीधे पिन और GND से जुड़ी है। ज़्यादा करंट से यह जल जाएगी। रास्ते में रेज़िस्टर लगाइए।',
    'Resistor nahi hai: LED seedhe pin aur GND se judi hai. Zyada current se yeh jal jaayegi. Raaste mein resistor lagaiye.'),
  gndRail: t3('The blue − rail is not joined to the Arduino\'s GND yet: add a wire from a GND pin to the − rail.',
    'नीली − रेल अभी Arduino के GND से नहीं जुड़ी: किसी GND पिन से − रेल तक वायर लगाइए।',
    'Neeli − rail abhi Arduino ke GND se nahi judi: kisi GND pin se − rail tak wire lagaiye.'),
  vRail: t3('The red + rail is not joined to the Arduino\'s 5V yet: add a wire from 5V to the + rail.',
    'लाल + रेल अभी Arduino के 5V से नहीं जुड़ी: 5V से + रेल तक वायर लगाइए।',
    'Red + rail abhi Arduino ke 5V se nahi judi: 5V se + rail tak wire lagaiye.'),
  short: t3('5V is joined straight to GND: that is a short circuit! Remove that wire.', '5V सीधे GND से जुड़ गया है: यह शॉर्ट सर्किट है! वह वायर हटाइए।', '5V seedhe GND se jud gaya hai: yeh short circuit hai! Woh wire hataiye.'),
  missing: t3('The {x} is not on the bench yet.', '{x} अभी बेंच पर नहीं है।', '{x} abhi bench par nahi hai.'),
  toPin: t3('The {x} must be joined to pin {p}.', '{x} को पिन {p} से जोड़िए।', '{x} ko pin {p} se jodiye.'),
  toGnd: t3('The {x} must be joined to GND (the − rail).', '{x} को GND (− रेल) से जोड़िए।', '{x} ko GND (− rail) se jodiye.'),
  to5v: t3('The {x} must be joined to 5V (the + rail).', '{x} को 5V (+ रेल) से जोड़िए।', '{x} ko 5V (+ rail) se jodiye.'),
  join: t3('{a} must be joined to {b}.', '{a} को {b} से जोड़िए।', '{a} ko {b} se jodiye.'),
  runIt: t3('Press Run to upload the sketch.', 'स्केच अपलोड करने के लिए "चलाइए" दबाइए।', 'Sketch upload karne ke liye Run dabaiye.'),
  serialOpen: t3('The Serial Monitor shows what the board sends.', 'सीरियल मॉनिटर दिखाता है कि बोर्ड क्या भेज रहा है।', 'Serial Monitor dikhata hai ki board kya bhej raha hai.'),
};
// one LED, its resistor to the − rail, and its long leg wired to a pin (the layout most lessons use)
function ledUnit(S, led, res, pin, name) {
  const nm = name || { en: 'LED', hi: 'एलईडी', hg: 'LED' };
  if (!S.has(led)) return [W.missing, { x: nm }];
  if (S.sameStrip(led + '.A', led + '.K')) return [W.ledShort];
  const ok = S.chain('D' + pin, [[led, 'A', 'K'], [res]], 'GND');
  if (ok) return null;
  if (S.chain('D' + pin, [[led, 'K', 'A'], [res]], 'GND')) return [W.ledRev];
  if (S.chain('D' + pin, [[led, 'A', 'K']], 'GND') || (S.conn(led + '.A', 'D' + pin) && S.conn(led + '.K', 'GND'))) return [W.noRes];
  if (!S.has(res)) return [W.missing, { x: { en: 'resistor', hi: 'रेज़िस्टर', hg: 'resistor' } }];
  if (!S.conn('rail:tn', 'GND') && (S.connAny(res, 'rail:tn') || S.connAny(led, 'rail:tn'))) return [W.gndRail];
  if (!S.conn(led + '.A', 'D' + pin) && !S.connAny(res, 'D' + pin)) return [W.toPin, { x: { en: 'LED\'s long leg (+)', hi: 'एलईडी का लंबा पैर (+)', hg: 'LED ka lamba pair (+)' }, p: pin }];
  return [W.toGnd, { x: { en: 'resistor (or the LED\'s short leg)', hi: 'रेज़िस्टर (या एलईडी का छोटा पैर)', hg: 'resistor (ya LED ka chhota pair)' } }];
}
const unit = (led, res, pin, name) => (S) => ledUnit(S, led, res, pin, name);
const need = (a, b, m, args) => (S) => (S.conn(a, b) ? null : [m, args]);
const has = (tag, name) => (S) => (S.has(tag) ? null : [W.missing, { x: name }]);
const noShort = (S) => (S.conn('5V', 'GND') ? [W.short] : null);
const N = {
  pot: t3('knob', 'नॉब', 'knob'), btn: t3('push button', 'पुश बटन', 'push button'), bz: t3('buzzer', 'बज़र', 'buzzer'), ldr: t3('LDR', 'एलडीआर', 'LDR'),
  servo: t3('servo', 'सर्वो', 'servo'), q: t3('transistor', 'ट्रांज़िस्टर', 'transistor'), d: t3('diode', 'डायोड', 'diode'), m: t3('motor', 'मोटर', 'motor'), us: t3('ultrasonic sensor', 'अल्ट्रासोनिक सेंसर', 'ultrasonic sensor'),
  ir: t3('IR sensor', 'आईआर सेंसर', 'IR sensor'), lm: t3('LM35 sensor', 'LM35 सेंसर', 'LM35 sensor'), r: t3('resistor', 'रेज़िस्टर', 'resistor'), rgb: t3('RGB LED', 'RGB एलईडी', 'RGB LED'),
};

// ------------------------------------------------------------------ the sketches
const BLINK = `// Blink: the LED on pin 13 goes on and off
void setup() {
  pinMode(13, OUTPUT);     // pin 13 will give power
}

void loop() {
  digitalWrite(13, HIGH);  // on: 5 V
  delay(1000);             // wait 1000 ms = 1 second
  digitalWrite(13, LOW);   // off: 0 V
  delay(1000);
}
`;
const TRAFFIC = `// A traffic light
const int red = 12;
const int yellow = 11;
const int green = 10;

void setup() {
  pinMode(red, OUTPUT);
  pinMode(yellow, OUTPUT);
  pinMode(green, OUTPUT);
}

void loop() {
  digitalWrite(red, HIGH);      // stop
  delay(3000);
  digitalWrite(red, LOW);
  digitalWrite(green, HIGH);    // go
  delay(3000);
  digitalWrite(green, LOW);
  digitalWrite(yellow, HIGH);   // get ready to stop
  delay(1000);
  digitalWrite(yellow, LOW);
}
`;
const BUTTON = `// Press the button: the LED lights up
const int button = 2;
const int led = 13;

void setup() {
  pinMode(button, INPUT_PULLUP);  // HIGH when free, LOW when pressed
  pinMode(led, OUTPUT);
}

void loop() {
  if (digitalRead(button) == LOW) {
    digitalWrite(led, HIGH);
  } else {
    digitalWrite(led, LOW);
  }
}
`;
const KNOB = `// Read the knob and send the number to the computer
void setup() {
  Serial.begin(9600);
}

void loop() {
  int value = analogRead(A0);   // 0 to 1023
  Serial.print("Knob: ");
  Serial.println(value);
  delay(200);
}
`;
const FADE = `// Fade: PWM makes the LED dim and bright
const int led = 9;   // a ~ pin

void setup() {
  pinMode(led, OUTPUT);
}

void loop() {
  for (int b = 0; b <= 255; b = b + 5) {
    analogWrite(led, b);
    delay(20);
  }
  for (int b = 255; b >= 0; b = b - 5) {
    analogWrite(led, b);
    delay(20);
  }
}
`;
const RGB = `// Mix colours with one RGB LED
const int R = 9, G = 10, B = 11;

void setColor(int r, int g, int b) {
  analogWrite(R, r);
  analogWrite(G, g);
  analogWrite(B, b);
}

void setup() {
  pinMode(R, OUTPUT);
  pinMode(G, OUTPUT);
  pinMode(B, OUTPUT);
}

void loop() {
  setColor(255, 0, 0);     delay(800);   // red
  setColor(0, 255, 0);     delay(800);   // green
  setColor(0, 0, 255);     delay(800);   // blue
  setColor(255, 180, 0);   delay(800);   // yellow = red + green
  setColor(160, 0, 255);   delay(800);   // purple = red + blue
  setColor(255, 255, 255); delay(800);   // white = all three
}
`;
const PIANO = `// A mini piano: three buttons, three notes
const int buzzer = 8;
int keys[] = {2, 3, 4};
int notes[] = {262, 330, 392};   // Sa (C), Ga (E), Pa (G)

void setup() {
  for (int i = 0; i < 3; i++) {
    pinMode(keys[i], INPUT_PULLUP);
  }
  tone(buzzer, 262, 150); delay(200);   // a short tune at the start
  tone(buzzer, 330, 150); delay(200);
  tone(buzzer, 392, 300); delay(400);
}

void loop() {
  bool pressed = false;
  for (int i = 0; i < 3; i++) {
    if (digitalRead(keys[i]) == LOW) {
      tone(buzzer, notes[i]);
      pressed = true;
    }
  }
  if (!pressed) {
    noTone(buzzer);
  }
  delay(10);
}
`;
const NIGHT = `// Night lamp: the LED comes on when it gets dark
const int led = 9;

void setup() {
  pinMode(led, OUTPUT);
  Serial.begin(9600);
}

void loop() {
  int light = analogRead(A0);   // bright: high, dark: low
  Serial.println(light);
  if (light < 300) {
    digitalWrite(led, HIGH);
  } else {
    digitalWrite(led, LOW);
  }
  delay(200);
}
`;
const SWEEP = `// Sweep: the servo turns from 0° to 180° and back
#include <Servo.h>
Servo myServo;

void setup() {
  myServo.attach(9);
}

void loop() {
  for (int angle = 0; angle <= 180; angle++) {
    myServo.write(angle);
    delay(10);
  }
  for (int angle = 180; angle >= 0; angle--) {
    myServo.write(angle);
    delay(10);
  }
}
`;
const SERVOKNOB = `// The servo follows the knob
#include <Servo.h>
Servo myServo;

void setup() {
  myServo.attach(9);
  Serial.begin(9600);
}

void loop() {
  int value = analogRead(A0);              // 0 to 1023
  int angle = map(value, 0, 1023, 0, 180); // to 0° to 180°
  myServo.write(angle);
  Serial.println(angle);
  delay(20);
}
`;
const MOTOR = `// Motor speed with PWM and a transistor
const int motor = 9;   // to the transistor's base

void setup() {
  pinMode(motor, OUTPUT);
  Serial.begin(9600);
}

void loop() {
  int speeds[] = {0, 120, 255};
  for (int i = 0; i < 3; i++) {
    analogWrite(motor, speeds[i]);
    Serial.print("Speed: ");
    Serial.println(speeds[i]);
    delay(2500);
  }
}
`;
const PARKING = `// Parking sensor: beeps faster as you come closer
const int trig = 9, echo = 10, buzzer = 8;

void setup() {
  pinMode(trig, OUTPUT);
  pinMode(echo, INPUT);
  Serial.begin(9600);
}

void loop() {
  digitalWrite(trig, LOW);
  delayMicroseconds(2);
  digitalWrite(trig, HIGH);     // a 10 µs pulse starts a measurement
  delayMicroseconds(10);
  digitalWrite(trig, LOW);
  long time = pulseIn(echo, HIGH);      // µs for the echo to come back
  int cm = time * 0.034 / 2;            // sound: 0.034 cm per µs, there and back
  Serial.print("Distance: ");
  Serial.print(cm);
  Serial.println(" cm");
  if (cm < 50) {
    tone(buzzer, 1500, 60);
    delay(cm * 8 + 40);                 // closer = faster beeps
  } else {
    delay(200);
  }
}
`;
const IRALARM = `// Obstacle alarm with an IR sensor
const int sensor = 7, led = 13, buzzer = 8;

void setup() {
  pinMode(sensor, INPUT);
  pinMode(led, OUTPUT);
}

void loop() {
  if (digitalRead(sensor) == LOW) {   // LOW: something is in front
    digitalWrite(led, HIGH);
    tone(buzzer, 2000, 100);
    delay(150);
  } else {
    digitalWrite(led, LOW);
  }
}
`;
const TEMP = `// Temperature meter with an LM35
const int led = 13;

void setup() {
  pinMode(led, OUTPUT);
  Serial.begin(9600);
}

void loop() {
  int raw = analogRead(A0);
  float volts = raw * 5.0 / 1023.0;
  float celsius = volts * 100.0;        // LM35: 10 mV for each °C
  Serial.print("Temperature: ");
  Serial.print(celsius);
  Serial.println(" C");
  if (celsius > 35) {
    digitalWrite(led, HIGH);            // too hot!
  } else {
    digitalWrite(led, LOW);
  }
  delay(500);
}
`;
const FREE = `// Free build: write your own sketch
void setup() {
  pinMode(13, OUTPUT);
  Serial.begin(9600);
}

void loop() {
  digitalWrite(13, HIGH);
  delay(500);
  digitalWrite(13, LOW);
  delay(500);
}
`;
export const FREE_CODE = FREE;

// a red LED with its 220 Ω resistor to the − rail, at column c (LED: short leg c, long leg c+1), and its wire to a pin
const LEDU = (n, c, color, pin) => ({ parts: [P('led' + n, 'led', { color }, 'e' + c, 0), P('r' + n, 'resistor', { ohms: 220 }, 'b' + c, 3)], wires: pin ? [['D' + pin, 'H:a' + (c + 1)]] : [] });
const merge = (...u) => ({ parts: u.flatMap((x) => x.parts || []), wires: u.flatMap((x) => x.wires || []) });

export const LESSONS = [
  // 1 ------------------------------------------------------------------------------------------------------------
  { id: 'meet', n: 1, free: true, view: 'board', icon: '◎', code: BLINK, drawer: [],
    title: t3('Meet the board', 'बोर्ड से मिलिए', 'Board se miliye'),
    goal: t3('Find the parts of an Arduino Uno and learn what each one does.', 'Arduino Uno के हिस्से पहचानिए और जानिए कि हर हिस्सा क्या करता है।', 'Arduino Uno ke parts pehchaniye aur jaaniye ki har part kya karta hai.'),
    setup: { parts: [], wires: [] },
    steps: [
      { k: 'info', do: t3('This is an UNO R3 board, like the Arduino Uno. It is a tiny computer that can switch lights, read sensors and drive motors.', 'यह UNO R3 बोर्ड है, Arduino Uno जैसा। यह एक छोटा-सा कंप्यूटर है जो बत्तियाँ जला सकता है, सेंसर पढ़ सकता है और मोटर चला सकता है।', 'Yeh UNO R3 board hai, Arduino Uno jaisa. Yeh ek chhota sa computer hai jo lights jala sakta hai, sensors padh sakta hai aur motors chala sakta hai.'),
        see: t3('Drag to turn the bench around; pinch or scroll to zoom.', 'बेंच घुमाने के लिए खींचिए; ज़ूम के लिए दो उँगलियों से फैलाइए या स्क्रॉल कीजिए।', 'Bench ghumane ke liye kheenchiye; zoom ke liye do ungliyon se failaiye ya scroll kijiye.') },
      { k: 'tap', region: 'usb', do: t3('Tap the silver USB port.', 'चाँदी जैसे USB पोर्ट को छूइए।', 'Silver USB port ko touch karo.'), see: t3('Power (5 V) and your code come in here from the computer.', 'कंप्यूटर से बिजली (5 V) और आपका कोड यहीं से आता है।', 'Computer se power (5 V) aur aapka code yahin se aata hai.') },
      { k: 'tap', region: 'jack', do: t3('Tap the black power jack.', 'काले पावर जैक को छूइए।', 'Black power jack ko touch karo.'), see: t3('A battery or adapter (7–12 V) plugs in here.', 'यहाँ बैटरी या एडैप्टर (7–12 V) लगता है।', 'Yahan battery ya adapter (7–12 V) lagta hai.') },
      { k: 'tap', region: 'mcu', do: t3('Tap the long black chip.', 'लंबी काली चिप को छूइए।', 'Lambi kaali chip ko touch karo.'), see: t3('The ATmega328P: the brain that runs your sketch.', 'ATmega328P: वह दिमाग़ जो आपका स्केच चलाता है।', 'ATmega328P: woh dimaag jo aapka sketch chalata hai.') },
      { k: 'tap', region: 'digital', do: t3('Tap the row of digital pins at the back.', 'पीछे वाली डिजिटल पिनों की कतार को छूइए।', 'Peeche wali digital pins ki line ko touch karo.'), see: t3('Pins 0–13: ON/OFF outputs and inputs. A ~ means it can also do PWM.', 'पिन 0–13: चालू/बंद आउटपुट और इनपुट। ~ का मतलब, यह PWM भी कर सकता है।', 'Pin 0–13: ON/OFF outputs aur inputs. ~ ka matlab, yeh PWM bhi kar sakta hai.') },
      { k: 'tap', region: 'analog', do: t3('Tap the analog pins A0–A5 at the front right.', 'आगे दाईं ओर के एनालॉग पिन A0–A5 को छूइए।', 'Aage right side ke analog pins A0–A5 ko touch karo.'), see: t3('They measure voltages from 0 to 5 V as numbers 0 to 1023.', 'ये 0 से 5 V तक के वोल्टेज को 0 से 1023 की संख्या में नापते हैं।', 'Yeh 0 se 5 V tak ke voltage ko 0 se 1023 ke number mein naapte hain.') },
      { k: 'tap', region: 'power', do: t3('Tap the power pins: 5V, 3.3V and GND.', 'पावर पिन छूइए: 5V, 3.3V और GND।', 'Power pins touch karo: 5V, 3.3V aur GND.'), see: t3('5V gives power to your circuit; GND is 0 V, where the current returns.', '5V आपके सर्किट को बिजली देता है; GND यानी 0 V, जहाँ करंट लौटता है।', '5V aapke circuit ko power deta hai; GND matlab 0 V, jahan current lautta hai.') },
      { k: 'tap', region: 'reset', do: t3('Find the RESET button in the corner and tap it.', 'कोने में रीसेट बटन ढूँढिए और उसे छूइए।', 'Kone mein RESET button dhoondiye aur use touch karo.'), see: t3('RESET restarts your sketch from the top. You have met the whole board!', 'रीसेट आपके स्केच को शुरू से चलाता है। आपने पूरा बोर्ड जान लिया!', 'RESET aapke sketch ko shuru se chalata hai. Aapne poora board jaan liya!') },
    ],
    done: (S) => ['usb', 'jack', 'mcu', 'digital', 'analog', 'power', 'reset'].every((r) => S.tapped(r)) },
  // 2 ------------------------------------------------------------------------------------------------------------
  { id: 'blink', n: 2, free: true, view: 'board', code: BLINK, drawer: [],
    title: t3('Blink the built-in LED', 'बोर्ड की एलईडी जलाइए-बुझाइए', 'Built-in LED blink karo'),
    goal: t3('Your first sketch: make the "L" LED on pin 13 blink, then change its speed.', 'आपका पहला स्केच: पिन 13 की "L" एलईडी को जलाइए-बुझाइए, फिर उसकी रफ़्तार बदलिए।', 'Aapka pehla sketch: pin 13 ki "L" LED ko blink karo, phir uski speed badlo.'),
    setup: { parts: [], wires: [] },
    steps: [
      { k: 'tap', region: 'ledL', do: t3('Tap the tiny LED marked L, next to pin 13.', 'पिन 13 के पास "L" लिखी छोटी एलईडी को छूइए।', 'Pin 13 ke paas "L" likhi chhoti LED ko touch karo.'), see: t3('It is joined to pin 13 on the board itself.', 'यह बोर्ड पर ही पिन 13 से जुड़ी है।', 'Yeh board par hi pin 13 se judi hai.') },
      { k: 'info', code: [2, 5], do: t3('Read the code. setup() runs once: pinMode(13, OUTPUT) makes pin 13 an output. loop() runs again and again.', 'कोड पढ़िए। setup() एक बार चलता है: pinMode(13, OUTPUT) पिन 13 को आउटपुट बनाता है। loop() बार-बार चलता है।', 'Code padhiye. setup() ek baar chalta hai: pinMode(13, OUTPUT) pin 13 ko output banata hai. loop() baar-baar chalta hai.'),
        see: t3('digitalWrite(13, HIGH) gives 5 V; LOW gives 0 V; delay(1000) waits one second.', 'digitalWrite(13, HIGH) 5 V देता है; LOW, 0 V; delay(1000) एक सेकंड रुकता है।', 'digitalWrite(13, HIGH) 5 V deta hai; LOW, 0 V; delay(1000) ek second rukta hai.') },
      { k: 'run', do: t3('Press Run.', '"चलाइए" दबाइए।', 'Run dabaiye.'), see: t3('The code is uploaded to the board and starts.', 'कोड बोर्ड पर अपलोड होकर चलने लगता है।', 'Code board par upload hokar chalne lagta hai.') },
      { k: 'watch', until: (S) => S.toggles('L') >= 4, do: t3('Watch the L LED.', 'L एलईडी को देखिए।', 'L LED ko dekhiye.'), see: t3('It blinks: one second on, one second off. The yellow line in the code shows what the board is doing now.', 'यह जलती-बुझती है: एक सेकंड जली, एक सेकंड बुझी। कोड में पीली लाइन दिखाती है कि बोर्ड अभी क्या कर रहा है।', 'Yeh jalti-bujhti hai: ek second on, ek second off. Code mein peeli line dikhati hai ki board abhi kya kar raha hai.') },
      { k: 'edit', test: (src) => { const d = [...src.matchAll(/delay\(\s*(\d+)\s*\)/g)].map((m) => +m[1]); return d.length >= 2 && d.every((x) => x <= 300); }, set: [[/delay\(1000\)/g, 'delay(200)']],
        do: t3('Change both delay(1000) to delay(200), then press Run.', 'दोनों delay(1000) को delay(200) कीजिए, फिर "चलाइए" दबाइए।', 'Dono delay(1000) ko delay(200) karo, phir Run dabaiye.'), see: t3('Smaller number, shorter wait.', 'छोटी संख्या, कम इंतज़ार।', 'Chhota number, kam intezaar.') },
      { k: 'watch', until: (S) => S.running() && S.fresh() && S.toggles('L') >= 6 && S.period('L') < 0.5, do: t3('Watch the LED again.', 'एलईडी को फिर देखिए।', 'LED ko phir dekhiye.'), see: t3('It blinks five times faster. You changed what the board does!', 'अब यह पाँच गुना तेज़ जलती-बुझती है। आपने बोर्ड का काम बदल दिया!', 'Ab yeh paanch guna tez blink karti hai. Aapne board ka kaam badal diya!') },
    ],
    done: (S) => S.running() && S.toggles('L') >= 6 && S.period('L') < 0.5 },
  // 3 ------------------------------------------------------------------------------------------------------------
  { id: 'ledres', n: 3, free: true, view: 'bb', code: BLINK, drawer: ['led', 'resistor'],
    title: t3('An LED with a resistor', 'रेज़िस्टर के साथ एलईडी', 'Resistor ke saath LED'),
    goal: t3('Build your first circuit on the breadboard and learn why an LED needs a resistor (Ohm\'s law).', 'ब्रेडबोर्ड पर पहला सर्किट बनाइए और जानिए कि एलईडी को रेज़िस्टर क्यों चाहिए (ओम का नियम)।', 'Breadboard par pehla circuit banaiye aur jaaniye ki LED ko resistor kyun chahiye (Ohm ka niyam).'),
    setup: { parts: [], wires: [] },
    steps: [
      { k: 'info', do: t3('This is a breadboard. Each column of five holes (a–e, and f–j) is joined inside. The long rows at the edges are the + and − rails.', 'यह ब्रेडबोर्ड है। पाँच छेदों का हर कॉलम (a–e, और f–j) अंदर से जुड़ा है। किनारों की लंबी लाइनें + और − रेल हैं।', 'Yeh breadboard hai. Paanch holes ka har column (a–e, aur f–j) andar se juda hai. Kinaron ki lambi lines + aur − rails hain.'),
        see: t3('Point at a hole: the holes joined to it light up green.', 'किसी छेद पर पॉइंट कीजिए: उससे जुड़े छेद हरे हो जाते हैं।', 'Kisi hole par point kijiye: usse jude holes green ho jaate hain.') },
      { k: 'place', place: P('led1', 'led', { color: 'red' }, 'e22', 0), do: t3('Drag the red LED from the Parts drawer to the blue ghost: long leg (+) in 23e, short leg (−) in 22e.', 'पुर्ज़ों के ड्रॉअर से लाल एलईडी खींचकर नीली आकृति पर रखिए: लंबा पैर (+) 23e में, छोटा पैर (−) 22e में।', 'Parts drawer se red LED kheench kar neeli shape par rakhiye: lamba pair (+) 23e mein, chhota pair (−) 22e mein.'),
        see: t3('The LED stands with its legs in two different columns.', 'एलईडी के पैर दो अलग कॉलम में लगे हैं।', 'LED ke pair do alag columns mein lage hain.') },
      { k: 'place', place: P('r1', 'resistor', { ohms: 220 }, 'b22', 3), do: t3('Put the 220 Ω resistor from 22b to the blue − rail.', '220 Ω का रेज़िस्टर 22b से नीली − रेल तक लगाइए।', '220 Ω ka resistor 22b se neeli − rail tak lagaiye.'),
        see: t3('Its bands red-red-brown mean 2, 2 and one zero: 220 Ω.', 'इसकी पट्टियाँ लाल-लाल-भूरी: 2, 2 और एक शून्य, यानी 220 Ω।', 'Iski bands red-red-brown: 2, 2 aur ek zero, matlab 220 Ω.') },
      { k: 'wire', wire: ['D13', 'led1.A'], do: t3('Wire pin 13 to the LED\'s long leg (any hole in column 23, a–d).', 'पिन 13 से एलईडी के लंबे पैर तक वायर लगाइए (कॉलम 23 का कोई भी छेद, a–d)।', 'Pin 13 se LED ke lambe pair tak wire lagaiye (column 23 ka koi bhi hole, a–d).'),
        see: t3('Drag from the pin to the hole, or tap one and then the other.', 'पिन से छेद तक खींचिए, या पहले एक को और फिर दूसरे को छूइए।', 'Pin se hole tak kheenchiye, ya pehle ek ko aur phir doosre ko touch karo.') },
      { k: 'wire', wire: ['GND3', 'rail:tn'], do: t3('Wire a GND pin to the blue − rail.', 'किसी GND पिन से नीली − रेल तक वायर लगाइए।', 'Kisi GND pin se neeli − rail tak wire lagaiye.'), see: t3('Now the current has a way back: pin 13 → LED → resistor → GND.', 'अब करंट के लौटने का रास्ता बन गया: पिन 13 → एलईडी → रेज़िस्टर → GND।', 'Ab current ke lautne ka raasta ban gaya: pin 13 → LED → resistor → GND.') },
      { k: 'check', do: t3('Press "Check my circuit".', '"मेरा सर्किट जाँचिए" दबाइए।', '"Mera circuit check karo" dabaiye.'), see: t3('A green tick means it is right; otherwise it tells you what to fix.', 'हरा निशान यानी सही; वरना यह बताएगा कि क्या ठीक करना है।', 'Green tick matlab sahi; warna yeh batayega ki kya theek karna hai.') },
      { k: 'run', do: t3('Press Run.', '"चलाइए" दबाइए।', 'Run dabaiye.'), see: t3('Your LED blinks together with the L LED: both are on pin 13.', 'आपकी एलईडी, L एलईडी के साथ जलती-बुझती है: दोनों पिन 13 पर हैं।', 'Aapki LED, L LED ke saath blink karti hai: dono pin 13 par hain.') },
      { k: 'watch', until: (S) => S.toggles('led1') >= 2, do: t3('Point at the LED while it is on to see its current.', 'एलईडी जली हो, तब उस पर पॉइंट करके उसका करंट देखिए।', 'LED jali ho, tab us par point karke uska current dekhiye.'),
        see: t3('About 13 mA: I = (5 V − 2 V) ÷ 220 Ω ≈ 0.013 A. That is Ohm\'s law.', 'लगभग 13 mA: I = (5 V − 2 V) ÷ 220 Ω ≈ 0.013 A। यही ओम का नियम है।', 'Lagbhag 13 mA: I = (5 V − 2 V) ÷ 220 Ω ≈ 0.013 A. Yahi Ohm ka niyam hai.') },
      { k: 'act', until: (S) => S.part('r1') && S.part('r1').props.ohms >= 1000 && S.ledMax('led1') > 0.001 && S.ledMax('led1', true) < 0.005,
        do: t3('Tap the resistor and choose 1 kΩ.', 'रेज़िस्टर को छूइए और 1 kΩ चुनिए।', 'Resistor ko touch karo aur 1 kΩ chuniye.'), see: t3('The LED is dimmer: (5 − 1.9) ÷ 1000 ≈ 3 mA. More ohms, less current. (With no resistor at all, about 90 mA flows and the LED burns!)', 'एलईडी धीमी जलती है: (5 − 1.9) ÷ 1000 ≈ 3 mA। ज़्यादा ओम, कम करंट। (बिना रेज़िस्टर के करीब 90 mA जाता है और एलईडी जल जाती है!)', 'LED dheemi jalti hai: (5 − 1.9) ÷ 1000 ≈ 3 mA. Zyada ohm, kam current. (Bina resistor ke kareeb 90 mA jaata hai aur LED jal jaati hai!)') },
    ],
    check: [noShort, unit('led1', 'r1', 13)],
    done: (S) => S.running() && S.ledLit('led1') && S.ledMax('led1') < 0.03 && S.part('r1') && S.chain('D13', [['led1', 'A', 'K'], ['r1']], 'GND') },
  // 4 ------------------------------------------------------------------------------------------------------------
  { id: 'traffic', n: 4, view: 'bb', code: TRAFFIC, drawer: ['led', 'resistor'],
    title: t3('Traffic light', 'ट्रैफ़िक लाइट', 'Traffic light'),
    goal: t3('Three LEDs on three pins, switched in turn by the code.', 'तीन पिन पर तीन एलईडी, जिन्हें कोड बारी-बारी से चलाता है।', 'Teen pins par teen LED, jinhe code baari-baari se chalata hai.'),
    setup: merge(LEDU(1, 22, 'red', 12), { wires: [['GND3', 'H:tn18']] }),
    steps: [
      { k: 'info', do: t3('The red LED is already on pin 12. Add a yellow one on pin 11 and a green one on pin 10.', 'लाल एलईडी पहले से पिन 12 पर है। पिन 11 पर पीली और पिन 10 पर हरी एलईडी लगाइए।', 'Red LED pehle se pin 12 par hai. Pin 11 par yellow aur pin 10 par green LED lagaiye.'), see: t3('Each LED gets its own resistor to the − rail.', 'हर एलईडी का अपना रेज़िस्टर − रेल तक जाता है।', 'Har LED ka apna resistor − rail tak jaata hai.') },
      { k: 'place', place: P('led2', 'led', { color: 'yellow' }, 'e28', 0), do: t3('Put the yellow LED in the ghost: long leg in 29e.', 'पीली एलईडी नीली आकृति में रखिए: लंबा पैर 29e में।', 'Yellow LED neeli shape mein rakhiye: lamba pair 29e mein.'), see: t3('', '', '') },
      { k: 'place', place: P('r2', 'resistor', { ohms: 220 }, 'b28', 3), do: t3('Its 220 Ω resistor: 28b to the − rail.', 'इसका 220 Ω रेज़िस्टर: 28b से − रेल तक।', 'Iska 220 Ω resistor: 28b se − rail tak.'), see: t3('', '', '') },
      { k: 'wire', wire: ['D11', 'led2.A'], do: t3('Wire pin 11 to the yellow LED\'s long leg.', 'पिन 11 से पीली एलईडी के लंबे पैर तक वायर।', 'Pin 11 se yellow LED ke lambe pair tak wire.'), see: t3('', '', '') },
      { k: 'place', place: P('led3', 'led', { color: 'green' }, 'e34', 0), do: t3('Put the green LED in the ghost: long leg in 35e.', 'हरी एलईडी नीली आकृति में रखिए: लंबा पैर 35e में।', 'Green LED neeli shape mein rakhiye: lamba pair 35e mein.'), see: t3('', '', '') },
      { k: 'place', place: P('r3', 'resistor', { ohms: 220 }, 'b34', 3), do: t3('Its 220 Ω resistor: 34b to the − rail.', 'इसका 220 Ω रेज़िस्टर: 34b से − रेल तक।', 'Iska 220 Ω resistor: 34b se − rail tak.'), see: t3('', '', '') },
      { k: 'wire', wire: ['D10', 'led3.A'], do: t3('Wire pin 10 to the green LED\'s long leg.', 'पिन 10 से हरी एलईडी के लंबे पैर तक वायर।', 'Pin 10 se green LED ke lambe pair tak wire.'), see: t3('', '', '') },
      { k: 'check', do: t3('Check your circuit.', 'अपना सर्किट जाँचिए।', 'Apna circuit check karo.'), see: t3('', '', '') },
      { k: 'run', do: t3('Press Run.', '"चलाइए" दबाइए।', 'Run dabaiye.'), see: t3('', '', '') },
      { k: 'watch', until: (S) => ['led1', 'led2', 'led3'].every((x) => S.toggles(x) >= 2), do: t3('Watch one full cycle (7 seconds).', 'एक पूरा चक्र देखिए (7 सेकंड)।', 'Ek poora cycle dekhiye (7 second).'), see: t3('Red 3 s, green 3 s, yellow 1 s: the code switches one pin at a time.', 'लाल 3 सेकंड, हरी 3 सेकंड, पीली 1 सेकंड: कोड एक बार में एक पिन चलाता है।', 'Red 3 second, green 3 second, yellow 1 second: code ek baar mein ek pin chalata hai.') },
    ],
    check: [noShort, unit('led1', 'r1', 12, N.r), unit('led2', 'r2', 11), unit('led3', 'r3', 10)],
    done: (S) => S.running() && ['led1', 'led2', 'led3'].every((x) => S.toggles(x) >= 2) },
  // 5 ------------------------------------------------------------------------------------------------------------
  { id: 'button', n: 5, view: 'bb', code: BUTTON, drawer: ['button', 'led', 'resistor'],
    title: t3('Push button', 'पुश बटन', 'Push button'),
    goal: t3('Read a button with digitalRead() and light the LED while it is pressed.', 'digitalRead() से बटन पढ़िए और जब तक वह दबा हो, एलईडी जलाइए।', 'digitalRead() se button padhiye aur jab tak woh daba ho, LED jalaiye.'),
    setup: merge(LEDU(1, 22, 'red', 13), { wires: [['GND3', 'H:tn18']] }),
    steps: [
      { k: 'place', place: P('b1', 'button', {}, 'e40', 0), do: t3('Put the push button across the middle gap, as the ghost shows.', 'पुश बटन को बीच की खाली जगह के आर-पार लगाइए, जैसा नीली आकृति दिखा रही है।', 'Push button ko beech ke gap ke aar-paar lagaiye, jaisa neeli shape dikha rahi hai.'), see: t3('Pressing it joins column 40 to column 42.', 'इसे दबाने से कॉलम 40, कॉलम 42 से जुड़ जाता है।', 'Ise dabane se column 40, column 42 se jud jaata hai.') },
      { k: 'wire', wire: ['D2', 'b1.L1'], do: t3('Wire pin 2 to the button (column 40).', 'पिन 2 से बटन तक वायर (कॉलम 40)।', 'Pin 2 se button tak wire (column 40).'), see: t3('', '', '') },
      { k: 'wire', wire: ['b1.L3', 'rail:tn'], do: t3('Wire the other side of the button (column 42) to the − rail.', 'बटन की दूसरी तरफ़ (कॉलम 42) से − रेल तक वायर।', 'Button ki doosri taraf (column 42) se − rail tak wire.'), see: t3('Pressed, pin 2 is joined to GND.', 'दबाने पर पिन 2, GND से जुड़ जाता है।', 'Dabane par pin 2, GND se jud jaata hai.') },
      { k: 'check', do: t3('Check your circuit.', 'अपना सर्किट जाँचिए।', 'Apna circuit check karo.'), see: t3('', '', '') },
      { k: 'run', do: t3('Press Run.', '"चलाइए" दबाइए।', 'Run dabaiye.'), see: t3('INPUT_PULLUP keeps pin 2 at HIGH until the button pulls it LOW.', 'INPUT_PULLUP पिन 2 को HIGH रखता है, जब तक बटन उसे LOW न कर दे।', 'INPUT_PULLUP pin 2 ko HIGH rakhta hai, jab tak button use LOW na kar de.') },
      { k: 'act', until: (S) => S.flag('pressLit'), do: t3('Press and hold the button (mouse or finger).', 'बटन को दबाकर रखिए (माउस या उँगली से)।', 'Button ko daba kar rakhiye (mouse ya ungli se).'), see: t3('The LED lights while you hold it.', 'जब तक दबाकर रखेंगे, एलईडी जलेगी।', 'Jab tak daba kar rakhenge, LED jalegi.') },
      { k: 'act', until: (S) => S.flag('releaseDark'), do: t3('Let go of the button.', 'बटन छोड़िए।', 'Button chhodiye.'), see: t3('The LED goes off. (Try INPUT instead of INPUT_PULLUP: pin 2 "floats" and the LED flickers by itself!)', 'एलईडी बुझ जाती है। (INPUT_PULLUP की जगह INPUT लिखकर देखिए: पिन 2 "फ़्लोट" करता है और एलईडी अपने-आप टिमटिमाती है!)', 'LED bujh jaati hai. (INPUT_PULLUP ki jagah INPUT likh kar dekhiye: pin 2 "float" karta hai aur LED apne aap timtimati hai!)') },
    ],
    check: [noShort, unit('led1', 'r1', 13), has('b1', N.btn), need('D2', 'b1.L1', W.toPin, { x: N.btn, p: 2 }), (S) => (S.conn('b1.L3', 'GND') ? null : [W.toGnd, { x: t3('other side of the button', 'बटन की दूसरी तरफ़', 'button ki doosri taraf') }])],
    done: (S) => S.flag('pressLit') && S.flag('releaseDark') },
  // 6 ------------------------------------------------------------------------------------------------------------
  { id: 'knob', n: 6, view: 'bb', code: KNOB, drawer: ['pot'], serial: true,
    title: t3('Knob and Serial', 'नॉब और सीरियल', 'Knob aur Serial'),
    goal: t3('Read a potentiometer with analogRead() and send the numbers to the Serial Monitor.', 'analogRead() से पोटेंशियोमीटर पढ़िए और संख्याएँ सीरियल मॉनिटर पर भेजिए।', 'analogRead() se potentiometer padhiye aur numbers Serial Monitor par bhejiye.'),
    setup: { parts: [], wires: [['GND3', 'H:tn18']] },
    steps: [
      { k: 'wire', wire: ['5V', 'rail:tp'], do: t3('First give the red + rail power: wire 5V to it.', 'पहले लाल + रेल को बिजली दीजिए: 5V से उस तक वायर लगाइए।', 'Pehle red + rail ko power dijiye: 5V se us tak wire lagaiye.'), see: t3('Now the + rail is 5 V and the − rail is GND, along the whole breadboard.', 'अब पूरे ब्रेडबोर्ड पर + रेल 5 V है और − रेल GND।', 'Ab poore breadboard par + rail 5 V hai aur − rail GND.') },
      { k: 'place', place: P('pot1', 'pot', {}, 'e45', 0), do: t3('Put the knob (potentiometer) in the ghost: legs in 45e, 47e and 49e.', 'नॉब (पोटेंशियोमीटर) नीली आकृति में रखिए: पैर 45e, 47e और 49e में।', 'Knob (potentiometer) neeli shape mein rakhiye: pair 45e, 47e aur 49e mein.'), see: t3('', '', '') },
      { k: 'wire', wire: ['pot1.1', 'rail:tn'], do: t3('Wire its left leg (column 45) to the − rail (GND).', 'इसके बाएँ पैर (कॉलम 45) से − रेल (GND) तक वायर।', 'Iske left pair (column 45) se − rail (GND) tak wire.'), see: t3('', '', '') },
      { k: 'wire', wire: ['pot1.3', 'rail:tp'], do: t3('Wire its right leg (column 49) to the + rail (5 V).', 'इसके दाएँ पैर (कॉलम 49) से + रेल (5 V) तक वायर।', 'Iske right pair (column 49) se + rail (5 V) tak wire.'), see: t3('Turning it clockwise now gives a bigger number.', 'अब इसे घड़ी की दिशा में घुमाने पर संख्या बढ़ेगी।', 'Ab ise clockwise ghumane par number badhega.') },
      { k: 'wire', wire: ['A0', 'pot1.W'], do: t3('Wire its middle leg (column 47) to A0.', 'इसके बीच वाले पैर (कॉलम 47) से A0 तक वायर।', 'Iske beech wale pair (column 47) se A0 tak wire.'), see: t3('The middle leg gives any voltage from 0 to 5 V.', 'बीच वाला पैर 0 से 5 V तक कोई भी वोल्टेज देता है।', 'Beech wala pair 0 se 5 V tak koi bhi voltage deta hai.') },
      { k: 'check', do: t3('Check your circuit.', 'अपना सर्किट जाँचिए।', 'Apna circuit check karo.'), see: t3('', '', '') },
      { k: 'run', do: t3('Press Run. The Serial Monitor opens.', '"चलाइए" दबाइए। सीरियल मॉनिटर खुल जाएगा।', 'Run dabaiye. Serial Monitor khul jayega.'), see: W.serialOpen },
      { k: 'act', until: (S) => S.adcMin(0) < 60, do: t3('Drag the knob all the way to the left.', 'नॉब को खींचकर पूरा बाईं ओर घुमाइए।', 'Knob ko kheench kar poora left ghumaiye.'), see: t3('The number goes down to 0: 0 V.', 'संख्या 0 तक आ जाती है: 0 V।', 'Number 0 tak aa jaata hai: 0 V.') },
      { k: 'act', until: (S) => S.adcMax(0) > 960, do: t3('Now turn it all the way to the right.', 'अब इसे पूरा दाईं ओर घुमाइए।', 'Ab ise poora right ghumaiye.'), see: t3('It goes up to 1023: 5 V. Each step is 5 ÷ 1023 ≈ 0.005 V.', 'यह 1023 तक जाती है: 5 V। हर क़दम 5 ÷ 1023 ≈ 0.005 V का है।', 'Yeh 1023 tak jaata hai: 5 V. Har step 5 ÷ 1023 ≈ 0.005 V ka hai.') },
    ],
    check: [noShort, (S) => (S.conn('rail:tp', '5V') ? null : [W.vRail]), has('pot1', N.pot), need('pot1.1', 'GND', W.toGnd, { x: t3('knob\'s left leg', 'नॉब का बायाँ पैर', 'knob ka left pair') }), need('pot1.3', '5V', W.to5v, { x: t3('knob\'s right leg', 'नॉब का दायाँ पैर', 'knob ka right pair') }), need('pot1.W', 'A0', W.join, { a: t3('The knob\'s middle leg', 'नॉब का बीच वाला पैर', 'Knob ka beech wala pair'), b: 'A0' })],
    done: (S) => S.adcMin(0) < 60 && S.adcMax(0) > 960 && S.lineCount() >= 5 },
  // 7 ------------------------------------------------------------------------------------------------------------
  { id: 'fade', n: 7, view: 'bb', code: FADE, drawer: ['led', 'resistor'],
    title: t3('Fade with PWM', 'PWM से धीमा-तेज़', 'PWM se fade'),
    goal: t3('analogWrite() on a ~ pin switches it very fast, so the LED looks dim or bright.', '~ वाले पिन पर analogWrite() उसे बहुत तेज़ी से चालू-बंद करता है, इसलिए एलईडी धीमी या तेज़ दिखती है।', '~ wale pin par analogWrite() use bahut tezi se on-off karta hai, isliye LED dheemi ya tez dikhti hai.'),
    setup: merge(LEDU(1, 22, 'red', 0), { wires: [['GND3', 'H:tn18']] }),
    steps: [
      { k: 'tap', region: 'digital', do: t3('Look at the pins with ~ : 3, 5, 6, 9, 10, 11. Tap the digital pins.', '~ वाले पिन देखिए: 3, 5, 6, 9, 10, 11। डिजिटल पिनों को छूइए।', '~ wale pins dekhiye: 3, 5, 6, 9, 10, 11. Digital pins ko touch karo.'), see: t3('Only these can do PWM (pulse width modulation).', 'सिर्फ़ यही पिन PWM (पल्स विड्थ मॉड्यूलेशन) कर सकते हैं।', 'Sirf yahi pins PWM (pulse width modulation) kar sakte hain.') },
      { k: 'wire', wire: ['D9', 'led1.A'], do: t3('Wire pin ~9 to the LED\'s long leg.', 'पिन ~9 से एलईडी के लंबे पैर तक वायर।', 'Pin ~9 se LED ke lambe pair tak wire.'), see: t3('', '', '') },
      { k: 'run', do: t3('Press Run.', '"चलाइए" दबाइए।', 'Run dabaiye.'), see: t3('', '', '') },
      { k: 'watch', until: (S) => S.levels('led1') >= 4, do: t3('Watch the LED, and point at pin 9 to see its waveform.', 'एलईडी को देखिए, और पिन 9 पर पॉइंट करके उसकी तरंग देखिए।', 'LED ko dekhiye, aur pin 9 par point karke uski waveform dekhiye.'),
        see: t3('It fades in and out. analogWrite(9, 128) keeps the pin on half of the time (490 times a second), so the LED gets half the power.', 'यह धीरे-धीरे जलती और बुझती है। analogWrite(9, 128) पिन को आधे समय चालू रखता है (एक सेकंड में 490 बार), तो एलईडी को आधी पावर मिलती है।', 'Yeh dheere-dheere jalti aur bujhti hai. analogWrite(9, 128) pin ko aadhe time on rakhta hai (ek second mein 490 baar), to LED ko aadhi power milti hai.') },
      { k: 'edit', test: (src) => /delay\(\s*([0-9])\s*\)/.test(src), set: [[/delay\(20\)/g, 'delay(5)']], do: t3('Change both delay(20) to delay(5) and press Run.', 'दोनों delay(20) को delay(5) कीजिए और "चलाइए" दबाइए।', 'Dono delay(20) ko delay(5) karo aur Run dabaiye.'), see: t3('The fading gets four times quicker.', 'धीमा-तेज़ होना चार गुना जल्दी होता है।', 'Fade hona chaar guna jaldi hota hai.') },
      { k: 'watch', until: (S) => S.running() && S.fresh() && S.levels('led1') >= 4, do: t3('Watch again. (Later, try the wire on pin 8: no ~, so it only blinks.)', 'फिर देखिए। (बाद में वायर पिन 8 पर लगाकर देखिए: ~ नहीं है, तो यह सिर्फ़ जलती-बुझती है।)', 'Phir dekhiye. (Baad mein wire pin 8 par laga kar dekhiye: ~ nahi hai, to yeh sirf blink karti hai.)'), see: t3('Smooth fading: a real LED is dimmed exactly like this.', 'धीरे-धीरे बदलती रोशनी: असली एलईडी ठीक ऐसे ही धीमी की जाती है।', 'Smooth fading: asli LED theek aise hi dheemi ki jaati hai.') },
    ],
    check: [noShort, unit('led1', 'r1', 9)],
    done: (S) => S.running() && S.levels('led1') >= 4 && S.conn('led1.A', 'D9') },
  // 8 ------------------------------------------------------------------------------------------------------------
  { id: 'rgb', n: 8, view: 'bb', code: RGB, drawer: ['rgb'],
    title: t3('Mix colours (RGB)', 'रंग मिलाइए (RGB)', 'Colours mix karo (RGB)'),
    goal: t3('Three PWM pins drive the red, green and blue LEDs inside one bulb to mix any colour.', 'तीन PWM पिन एक बल्ब के अंदर की लाल, हरी और नीली एलईडी को चलाकर कोई भी रंग बनाते हैं।', 'Teen PWM pins ek bulb ke andar ki red, green aur blue LEDs ko chala kar koi bhi colour banate hain.'),
    setup: { parts: [P('rr', 'resistor', { ohms: 220 }, 'd30', 1), P('rg', 'resistor', { ohms: 220 }, 'd32', 1), P('rb', 'resistor', { ohms: 220 }, 'd33', 1)], wires: [['GND3', 'H:tn18']] },
    steps: [
      { k: 'place', place: P('rgb1', 'rgb', {}, 'e30', 0), do: t3('Put the RGB LED in 30e–33e. Its longest leg (common −) goes in 31e.', 'RGB एलईडी को 30e–33e में लगाइए। इसका सबसे लंबा पैर (कॉमन −) 31e में जाएगा।', 'RGB LED ko 30e–33e mein lagaiye. Iska sabse lamba pair (common −) 31e mein jayega.'), see: t3('Each colour leg already has a 220 Ω resistor across the gap.', 'हर रंग वाले पैर के लिए खाली जगह के आर-पार 220 Ω रेज़िस्टर पहले से लगा है।', 'Har colour wale pair ke liye gap ke aar-paar 220 Ω resistor pehle se laga hai.') },
      { k: 'wire', wire: ['rgb1.K', 'rail:tn'], do: t3('Wire the common leg (column 31) to the − rail.', 'कॉमन पैर (कॉलम 31) से − रेल तक वायर।', 'Common pair (column 31) se − rail tak wire.'), see: t3('', '', '') },
      { k: 'wire', wire: ['D9', 'rr.2'], do: t3('Wire pin ~9 to the red resistor\'s lower end (column 30, f–j).', 'पिन ~9 से लाल वाले रेज़िस्टर के निचले सिरे तक वायर (कॉलम 30, f–j)।', 'Pin ~9 se red wale resistor ke neeche wale end tak wire (column 30, f–j).'), see: t3('', '', '') },
      { k: 'wire', wire: ['D10', 'rg.2'], do: t3('Wire pin ~10 to column 32 (f–j): green.', 'पिन ~10 से कॉलम 32 (f–j) तक: हरा।', 'Pin ~10 se column 32 (f–j) tak: green.'), see: t3('', '', '') },
      { k: 'wire', wire: ['D11', 'rb.2'], do: t3('Wire pin ~11 to column 33 (f–j): blue.', 'पिन ~11 से कॉलम 33 (f–j) तक: नीला।', 'Pin ~11 se column 33 (f–j) tak: blue.'), see: t3('', '', '') },
      { k: 'check', do: t3('Check your circuit.', 'अपना सर्किट जाँचिए।', 'Apna circuit check karo.'), see: t3('', '', '') },
      { k: 'run', do: t3('Press Run.', '"चलाइए" दबाइए।', 'Run dabaiye.'), see: t3('', '', '') },
      { k: 'watch', until: (S) => S.rgbSeen('rgb1', 'R') && S.rgbSeen('rgb1', 'G') && S.rgbSeen('rgb1', 'B') && S.rgbMix('rgb1'), do: t3('Watch the colours change.', 'रंगों को बदलते देखिए।', 'Colours ko badalte dekhiye.'), see: t3('Red + green = yellow, red + blue = purple, all three = white. Your screen makes colours the same way!', 'लाल + हरा = पीला, लाल + नीला = बैंगनी, तीनों = सफ़ेद। आपकी स्क्रीन भी रंग ऐसे ही बनाती है!', 'Red + green = yellow, red + blue = purple, teeno = white. Aapki screen bhi colours aise hi banati hai!') },
    ],
    check: [noShort, has('rgb1', N.rgb), (S) => (S.sameStrip('rgb1.R', 'rgb1.K') ? [W.ledShort] : null), need('rgb1.K', 'GND', W.toGnd, { x: t3('RGB LED\'s longest leg', 'RGB एलईडी का सबसे लंबा पैर', 'RGB LED ka sabse lamba pair') }),
      (S) => (S.chain('D9', [['rr'], ['rgb1', 'R', 'K']], 'GND') ? null : [W.toPin, { x: t3('red leg (through its resistor)', 'लाल पैर (रेज़िस्टर से होकर)', 'red pair (resistor se hokar)'), p: 9 }]),
      (S) => (S.chain('D10', [['rg'], ['rgb1', 'G', 'K']], 'GND') ? null : [W.toPin, { x: t3('green leg (through its resistor)', 'हरा पैर (रेज़िस्टर से होकर)', 'green pair (resistor se hokar)'), p: 10 }]),
      (S) => (S.chain('D11', [['rb'], ['rgb1', 'B', 'K']], 'GND') ? null : [W.toPin, { x: t3('blue leg (through its resistor)', 'नीला पैर (रेज़िस्टर से होकर)', 'blue pair (resistor se hokar)'), p: 11 }])],
    done: (S) => S.running() && S.rgbSeen('rgb1', 'R') && S.rgbSeen('rgb1', 'G') && S.rgbSeen('rgb1', 'B') && S.rgbMix('rgb1') },
  // 9 ------------------------------------------------------------------------------------------------------------
  { id: 'piano', n: 9, view: 'bb', code: PIANO, drawer: ['buzzer', 'button'],
    title: t3('Buzzer and a mini piano', 'बज़र और छोटा पियानो', 'Buzzer aur mini piano'),
    goal: t3('tone() makes notes on a piezo buzzer; three buttons play Sa, Ga and Pa.', 'tone() पीज़ो बज़र पर सुर बजाता है; तीन बटन सा, ग और प बजाते हैं।', 'tone() piezo buzzer par sur bajata hai; teen buttons Sa, Ga aur Pa bajate hain.'),
    setup: { parts: [P('k1', 'button', {}, 'e9', 0), P('k2', 'button', {}, 'e15', 0), P('k3', 'button', {}, 'e21', 0)], wires: [['GND3', 'H:tn18'], ['D2', 'H:a9'], ['D3', 'H:a15'], ['D4', 'H:a21'], ['H:a11', 'H:tn8'], ['H:a17', 'H:tn13'], ['H:a23', 'H:tn19']] },
    steps: [
      { k: 'info', do: t3('Three buttons are ready on pins 2, 3 and 4 (each to GND). Now add the buzzer.', 'तीन बटन पिन 2, 3 और 4 पर तैयार हैं (हर एक GND तक)। अब बज़र लगाइए।', 'Teen buttons pin 2, 3 aur 4 par ready hain (har ek GND tak). Ab buzzer lagaiye.'), see: t3('', '', '') },
      { k: 'place', place: P('bz1', 'buzzer', {}, 'e52', 0), do: t3('Put the buzzer in the ghost: + in 52e, − in 55e.', 'बज़र नीली आकृति में रखिए: + 52e में, − 55e में।', 'Buzzer neeli shape mein rakhiye: + 52e mein, − 55e mein.'), see: t3('', '', '') },
      { k: 'wire', wire: ['D8', 'bz1.P'], do: t3('Wire pin 8 to the buzzer\'s + (column 52).', 'पिन 8 से बज़र के + (कॉलम 52) तक वायर।', 'Pin 8 se buzzer ke + (column 52) tak wire.'), see: t3('', '', '') },
      { k: 'wire', wire: ['bz1.N', 'rail:tn'], do: t3('Wire the buzzer\'s − (column 55) to the − rail.', 'बज़र के − (कॉलम 55) से − रेल तक वायर।', 'Buzzer ke − (column 55) se − rail tak wire.'), see: t3('', '', '') },
      { k: 'run', do: t3('Press Run (turn your sound on).', '"चलाइए" दबाइए (आवाज़ चालू रखिए)।', 'Run dabaiye (sound on rakhiye).'), see: t3('A short tune: 262, 330 and 392 vibrations a second.', 'एक छोटी धुन: एक सेकंड में 262, 330 और 392 कंपन।', 'Ek chhoti dhun: ek second mein 262, 330 aur 392 vibrations.') },
      { k: 'act', until: (S) => S.pianoNotes() >= 2, do: t3('Play: hold the buttons one by one.', 'बजाइए: एक-एक करके बटन दबाकर रखिए।', 'Bajaiye: ek-ek karke buttons daba kar rakhiye.'), see: t3('Each button plays its own note. A higher number in tone() is a higher note.', 'हर बटन अपना सुर बजाता है। tone() में बड़ी संख्या यानी ऊँचा सुर।', 'Har button apna sur bajata hai. tone() mein bada number matlab ooncha sur.') },
    ],
    check: [noShort, has('bz1', N.bz), need('D8', 'bz1.P', W.toPin, { x: N.bz, p: 8 }), need('bz1.N', 'GND', W.toGnd, { x: N.bz })],
    done: (S) => S.pianoNotes() >= 2 },
  // 10 -----------------------------------------------------------------------------------------------------------
  { id: 'night', n: 10, view: 'bb', code: NIGHT, drawer: ['ldr', 'resistor'], serial: true,
    title: t3('Night lamp with an LDR', 'एलडीआर से रात की बत्ती', 'LDR se night lamp'),
    goal: t3('A light sensor in a voltage divider: the lamp turns on by itself when the room gets dark.', 'वोल्टेज डिवाइडर में लगा रोशनी सेंसर: कमरे में अँधेरा होते ही बत्ती अपने-आप जल जाती है।', 'Voltage divider mein laga light sensor: room mein andhera hote hi lamp apne aap jal jaata hai.'),
    setup: merge(LEDU(1, 22, 'yellow', 9), { wires: [['GND3', 'H:tn18'], ['5V', 'H:tp30']] }),
    steps: [
      { k: 'place', place: P('ldr1', 'ldr', {}, 'e40', 0), do: t3('Put the LDR in 40e and 42e.', 'एलडीआर को 40e और 42e में लगाइए।', 'LDR ko 40e aur 42e mein lagaiye.'), see: t3('', '', '') },
      { k: 'place', place: P('r10', 'resistor', { ohms: 10000 }, 'b42', 3), do: t3('Put the 10 kΩ resistor (brown-black-orange) from 42b to the − rail.', '10 kΩ का रेज़िस्टर (भूरा-काला-नारंगी) 42b से − रेल तक लगाइए।', '10 kΩ ka resistor (brown-black-orange) 42b se − rail tak lagaiye.'), see: t3('LDR and resistor share the 5 V between them: a voltage divider.', 'एलडीआर और रेज़िस्टर 5 V को आपस में बाँटते हैं: यह वोल्टेज डिवाइडर है।', 'LDR aur resistor 5 V ko aapas mein baant-te hain: yeh voltage divider hai.') },
      { k: 'wire', wire: ['ldr1.1', 'rail:tp'], do: t3('Wire the LDR\'s left leg (column 40) to the + rail.', 'एलडीआर के बाएँ पैर (कॉलम 40) से + रेल तक वायर।', 'LDR ke left pair (column 40) se + rail tak wire.'), see: t3('', '', '') },
      { k: 'wire', wire: ['A0', 'ldr1.2'], do: t3('Wire A0 to column 42, where the LDR meets the resistor.', 'A0 से कॉलम 42 तक वायर, जहाँ एलडीआर और रेज़िस्टर मिलते हैं।', 'A0 se column 42 tak wire, jahan LDR aur resistor milte hain.'), see: t3('', '', '') },
      { k: 'check', do: t3('Check your circuit.', 'अपना सर्किट जाँचिए।', 'Apna circuit check karo.'), see: t3('', '', '') },
      { k: 'run', do: t3('Press Run.', '"चलाइए" दबाइए।', 'Run dabaiye.'), see: t3('In a bright room A0 reads high, so the lamp stays off.', 'रोशनी वाले कमरे में A0 ज़्यादा पढ़ता है, तो बत्ती बुझी रहती है।', 'Roshni wale room mein A0 zyada padhta hai, to lamp bujha rehta hai.') },
      { k: 'act', until: (S) => S.flag('darkLit'), do: t3('Slide the Room light down to make it dark.', '"कमरे की रोशनी" स्लाइडर नीचे करके अँधेरा कीजिए।', '"Room light" slider neeche karke andhera kijiye.'), see: t3('The LDR\'s resistance rises, A0 drops below 300 and the lamp turns on!', 'एलडीआर का प्रतिरोध बढ़ता है, A0 300 से नीचे जाता है और बत्ती जल जाती है!', 'LDR ka resistance badhta hai, A0 300 se neeche jaata hai aur lamp jal jaata hai!') },
      { k: 'act', until: (S) => S.flag('brightDark'), do: t3('Now make the room bright again.', 'अब कमरे में फिर से रोशनी कीजिए।', 'Ab room mein phir se roshni kijiye.'), see: t3('The lamp turns off: an automatic street light works the same way.', 'बत्ती बुझ जाती है: अपने-आप जलने वाली सड़क की बत्ती भी ऐसे ही काम करती है।', 'Lamp bujh jaata hai: automatic street light bhi aise hi kaam karti hai.') },
    ],
    check: [noShort, unit('led1', 'r1', 9), has('ldr1', N.ldr), has('r10', N.r), need('ldr1.1', '5V', W.to5v, { x: N.ldr }), need('ldr1.2', 'A0', W.join, { a: t3('The LDR\'s other leg', 'एलडीआर का दूसरा पैर', 'LDR ka doosra pair'), b: 'A0' }), (S) => (S.chain('A0', [['r10']], 'GND') ? null : [W.join, { a: t3('The 10 kΩ resistor', '10 kΩ रेज़िस्टर', '10 kΩ resistor'), b: t3('A0 and GND', 'A0 और GND', 'A0 aur GND') }])],
    done: (S) => S.flag('darkLit') && S.flag('brightDark') },
  // 11 -----------------------------------------------------------------------------------------------------------
  { id: 'sweep', n: 11, view: 'wide', code: SWEEP, drawer: ['servo'],
    title: t3('Servo sweep', 'सर्वो स्वीप', 'Servo sweep'),
    goal: t3('A servo turns to the angle you write: sweep it from 0° to 180°.', 'सर्वो उसी कोण पर घूमता है जो आप लिखते हैं: इसे 0° से 180° तक घुमाइए।', 'Servo usi angle par ghoomta hai jo aap likhte hain: ise 0° se 180° tak ghumaiye.'),
    setup: { parts: [], wires: [['GND3', 'H:tn18'], ['5V', 'H:tp30']] },
    steps: [
      { k: 'place', place: F('sv1', 'servo', {}, 20, 165, 0), do: t3('Put the servo on the mat, at the ghost in front of the breadboard.', 'सर्वो को मैट पर, ब्रेडबोर्ड के सामने वाली नीली आकृति पर रखिए।', 'Servo ko mat par, breadboard ke saamne wali neeli shape par rakhiye.'), see: t3('Its cable has three wires: brown (GND), red (5 V), orange (signal).', 'इसकी केबल में तीन तार हैं: भूरा (GND), लाल (5 V), नारंगी (सिग्नल)।', 'Iski cable mein teen taar hain: brown (GND), red (5 V), orange (signal).') },
      { k: 'wire', wire: ['sv1.GND', 'rail:tn'], do: t3('Wire the brown pin of its plug to the − rail.', 'इसके प्लग के भूरे पिन से − रेल तक वायर।', 'Iske plug ke brown pin se − rail tak wire.'), see: t3('', '', '') },
      { k: 'wire', wire: ['sv1.VP', 'rail:tp'], do: t3('Wire the red pin to the + rail (5 V).', 'लाल पिन से + रेल (5 V) तक वायर।', 'Red pin se + rail (5 V) tak wire.'), see: t3('', '', '') },
      { k: 'wire', wire: ['sv1.SIG', 'D9'], do: t3('Wire the orange pin to pin ~9.', 'नारंगी पिन से पिन ~9 तक वायर।', 'Orange pin se pin ~9 tak wire.'), see: t3('', '', '') },
      { k: 'check', do: t3('Check your circuit.', 'अपना सर्किट जाँचिए।', 'Apna circuit check karo.'), see: t3('', '', '') },
      { k: 'run', do: t3('Press Run.', '"चलाइए" दबाइए।', 'Run dabaiye.'), see: t3('', '', '') },
      { k: 'watch', until: (S) => S.servoRange('sv1') > 170, do: t3('Watch the white horn.', 'सफ़ेद हॉर्न को देखिए।', 'White horn ko dekhiye.'), see: t3('It sweeps 0° → 180° → 0°. myServo.write(angle) sets the angle; the servo\'s own board holds it there.', 'यह 0° → 180° → 0° घूमता है। myServo.write(angle) कोण तय करता है; सर्वो का अपना बोर्ड उसे वहीं रोके रखता है।', 'Yeh 0° → 180° → 0° ghoomta hai. myServo.write(angle) angle set karta hai; servo ka apna board use wahin roke rakhta hai.') },
    ],
    check: [noShort, (S) => (S.conn('rail:tp', '5V') ? null : [W.vRail]), has('sv1', N.servo), need('sv1.GND', 'GND', W.toGnd, { x: t3('servo\'s brown wire', 'सर्वो का भूरा तार', 'servo ka brown wire') }), need('sv1.VP', '5V', W.to5v, { x: t3('servo\'s red wire', 'सर्वो का लाल तार', 'servo ka red wire') }), need('sv1.SIG', 'D9', W.toPin, { x: t3('servo\'s orange wire', 'सर्वो का नारंगी तार', 'servo ka orange wire'), p: 9 })],
    done: (S) => S.servoRange('sv1') > 170 },
  // 12 -----------------------------------------------------------------------------------------------------------
  { id: 'servoknob', n: 12, view: 'wide', code: SERVOKNOB, drawer: [], serial: true,
    title: t3('Servo with a knob', 'नॉब से सर्वो', 'Knob se servo'),
    goal: t3('map() turns the knob\'s 0–1023 into 0–180°: the servo follows your hand.', 'map() नॉब के 0–1023 को 0–180° में बदलता है: सर्वो आपके हाथ के साथ घूमता है।', 'map() knob ke 0–1023 ko 0–180° mein badalta hai: servo aapke haath ke saath ghoomta hai.'),
    setup: { parts: [P('pot1', 'pot', {}, 'e45', 0), F('sv1', 'servo', {}, 20, 165, 0)], wires: [['GND3', 'H:tn18'], ['5V', 'H:tp30'], ['H:a45', 'H:tn38'], ['H:a49', 'H:tp38'], ['A0', 'H:b47'], ['T:sv1:GND', 'H:tn24'], ['T:sv1:VP', 'H:tp24'], ['T:sv1:SIG', 'D9']] },
    steps: [
      { k: 'info', code: [11, 12], do: t3('The knob (A0) and the servo (pin 9) from the last lessons are ready. Read the code: map(value, 0, 1023, 0, 180).', 'पिछले पाठों का नॉब (A0) और सर्वो (पिन 9) तैयार हैं। कोड पढ़िए: map(value, 0, 1023, 0, 180)।', 'Pichle lessons ka knob (A0) aur servo (pin 9) ready hain. Code padhiye: map(value, 0, 1023, 0, 180).'), see: t3('map() scales a number from one range to another: 512 becomes 90.', 'map() एक रेंज की संख्या को दूसरी रेंज में बदलता है: 512 बन जाता है 90।', 'map() ek range ke number ko doosri range mein badalta hai: 512 ban jaata hai 90.') },
      { k: 'run', do: t3('Press Run.', '"चलाइए" दबाइए।', 'Run dabaiye.'), see: t3('', '', '') },
      { k: 'act', until: (S) => S.servoMin('sv1') < 15, do: t3('Turn the knob fully left.', 'नॉब को पूरा बाईं ओर घुमाइए।', 'Knob ko poora left ghumaiye.'), see: t3('The servo goes to 0°.', 'सर्वो 0° पर जाता है।', 'Servo 0° par jaata hai.') },
      { k: 'act', until: (S) => S.servoMax('sv1') > 165, do: t3('Turn the knob fully right.', 'नॉब को पूरा दाईं ओर घुमाइए।', 'Knob ko poora right ghumaiye.'), see: t3('The servo goes to 180°: it copies the knob. This is how a robot arm is steered.', 'सर्वो 180° पर जाता है: यह नॉब की नकल करता है। रोबोट की बाँह ऐसे ही चलाई जाती है।', 'Servo 180° par jaata hai: yeh knob ki nakal karta hai. Robot ki baanh aise hi chalayi jaati hai.') },
      { k: 'edit', test: (src) => /map\([^)]*,\s*0\s*,\s*90\s*\)/.test(src), set: [[/0, 180\)/, '0, 90)']], do: t3('Change map(value, 0, 1023, 0, 180) to end in 0, 90 and press Run.', 'map(value, 0, 1023, 0, 180) का आख़िरी भाग 0, 90 कीजिए और "चलाइए" दबाइए।', 'map(value, 0, 1023, 0, 180) ka aakhri hissa 0, 90 karo aur Run dabaiye.'), see: t3('Now the full knob turn moves the servo only to 90°.', 'अब नॉब पूरा घुमाने पर सर्वो सिर्फ़ 90° तक जाता है।', 'Ab knob poora ghumane par servo sirf 90° tak jaata hai.') },
    ],
    check: [noShort, need('pot1.W', 'A0', W.join, { a: t3('The knob\'s middle leg', 'नॉब का बीच वाला पैर', 'Knob ka beech wala pair'), b: 'A0' }), need('sv1.SIG', 'D9', W.toPin, { x: N.servo, p: 9 })],
    done: (S) => S.servoMin('sv1') < 15 && S.servoMax('sv1') > 165 },
  // 13 -----------------------------------------------------------------------------------------------------------
  { id: 'motor', n: 13, view: 'wide', code: MOTOR, drawer: ['npn', 'resistor', 'diode', 'motor'], serial: true,
    title: t3('DC motor speed', 'डीसी मोटर की रफ़्तार', 'DC motor ki speed'),
    goal: t3('A transistor lets a small pin current switch a big motor current; PWM sets the speed.', 'ट्रांज़िस्टर से पिन का छोटा करंट मोटर के बड़े करंट को चालू-बंद करता है; PWM रफ़्तार तय करता है।', 'Transistor se pin ka chhota current motor ke bade current ko on-off karta hai; PWM speed set karta hai.'),
    setup: { parts: [], wires: [['GND3', 'H:tn18'], ['5V', 'H:tp30']] },
    steps: [
      { k: 'place', place: P('q1', 'npn', {}, 'e40', 0), do: t3('Put the transistor in 40e–42e, flat side facing you (E, B, C from left).', 'ट्रांज़िस्टर को 40e–42e में लगाइए, चपटी तरफ़ आपकी ओर (बाएँ से E, B, C)।', 'Transistor ko 40e–42e mein lagaiye, flat side aapki taraf (left se E, B, C).'), see: t3('', '', '') },
      { k: 'place', place: P('rb', 'resistor', { ohms: 1000 }, 'c37', 0), do: t3('Put the 1 kΩ resistor from 37c to 41c (to the base).', '1 kΩ रेज़िस्टर 37c से 41c (बेस तक) लगाइए।', '1 kΩ resistor 37c se 41c (base tak) lagaiye.'), see: t3('It limits the base current to about 4 mA.', 'यह बेस का करंट लगभग 4 mA तक सीमित रखता है।', 'Yeh base ka current lagbhag 4 mA tak seemit rakhta hai.') },
      { k: 'place', place: P('d1', 'diode', {}, 'a42', 3), do: t3('Put the diode from 42a up to the red + rail, grey band at the + rail.', 'डायोड को 42a से ऊपर लाल + रेल तक लगाइए, स्लेटी पट्टी + रेल की तरफ़।', 'Diode ko 42a se upar red + rail tak lagaiye, grey band + rail ki taraf.'), see: t3('', '', '') },
      { k: 'place', place: F('m1', 'motor', {}, 95, 160, 0), do: t3('Put the motor on the mat at the ghost.', 'मोटर को मैट पर नीली आकृति पर रखिए।', 'Motor ko mat par neeli shape par rakhiye.'), see: t3('', '', '') },
      { k: 'wire', wire: ['D9', 'rb.1'], do: t3('Wire pin ~9 to the resistor (column 37).', 'पिन ~9 से रेज़िस्टर (कॉलम 37) तक वायर।', 'Pin ~9 se resistor (column 37) tak wire.'), see: t3('', '', '') },
      { k: 'wire', wire: ['q1.E', 'rail:tn'], do: t3('Wire the emitter (column 40) to the − rail.', 'एमिटर (कॉलम 40) से − रेल तक वायर।', 'Emitter (column 40) se − rail tak wire.'), see: t3('', '', '') },
      { k: 'wire', wire: ['m1.P', 'rail:tp'], do: t3('Wire the motor\'s red lead to the + rail.', 'मोटर के लाल तार से + रेल तक वायर।', 'Motor ke red wire se + rail tak wire.'), see: t3('', '', '') },
      { k: 'wire', wire: ['m1.N', 'q1.C'], do: t3('Wire the motor\'s black lead to the collector (column 42).', 'मोटर के काले तार से कलेक्टर (कॉलम 42) तक वायर।', 'Motor ke black wire se collector (column 42) tak wire.'), see: t3('Motor current: + rail → motor → transistor → GND.', 'मोटर का करंट: + रेल → मोटर → ट्रांज़िस्टर → GND।', 'Motor ka current: + rail → motor → transistor → GND.') },
      { k: 'check', do: t3('Check your circuit.', 'अपना सर्किट जाँचिए।', 'Apna circuit check karo.'), see: t3('', '', '') },
      { k: 'run', do: t3('Press Run.', '"चलाइए" दबाइए।', 'Run dabaiye.'), see: t3('', '', '') },
      { k: 'watch', until: (S) => S.motorLevels('m1') >= 2 && S.motorMax('m1') > 300, do: t3('Watch the fan and point at the motor to see its current.', 'पंखे को देखिए और मोटर पर पॉइंट करके उसका करंट देखिए।', 'Fan ko dekhiye aur motor par point karke uska current dekhiye.'), see: t3('Stop, half speed, full speed: about 170 mA at full speed, far more than a pin\'s 40 mA.', 'रुकी, आधी रफ़्तार, पूरी रफ़्तार: पूरी रफ़्तार पर लगभग 170 mA, पिन के 40 mA से कहीं ज़्यादा।', 'Ruki, aadhi speed, poori speed: poori speed par lagbhag 170 mA, pin ke 40 mA se kahin zyada.') },
    ],
    check: [noShort, (S) => (S.conn('rail:tp', '5V') ? null : [W.vRail]), has('q1', N.q), has('rb', N.r), (S) => (S.chain('D9', [['rb']], 'q1.B') ? null : [W.join, { a: t3('Pin 9', 'पिन 9', 'Pin 9'), b: t3('the base (B), through the 1 kΩ resistor', 'बेस (B), 1 kΩ रेज़िस्टर से होकर', 'base (B), 1 kΩ resistor se hokar') }]),
      need('q1.E', 'GND', W.toGnd, { x: t3('emitter (E)', 'एमिटर (E)', 'emitter (E)') }), has('m1', N.m), need('m1.P', '5V', W.to5v, { x: t3('motor\'s red lead', 'मोटर का लाल तार', 'motor ka red wire') }), need('m1.N', 'q1.C', W.join, { a: t3('The motor\'s black lead', 'मोटर का काला तार', 'Motor ka black wire'), b: t3('the collector (C)', 'कलेक्टर (C)', 'collector (C)') }),
      has('d1', N.d), (S) => (S.conn('d1.K', '5V') && S.conn('d1.A', 'q1.C') ? null : S.conn('d1.A', '5V') && S.conn('d1.K', 'q1.C') ? [t3('The diode is the wrong way round: its grey band must face the + rail.', 'डायोड उल्टा लगा है: इसकी स्लेटी पट्टी + रेल की तरफ़ होनी चाहिए।', 'Diode ulta laga hai: iski grey band + rail ki taraf honi chahiye.')] : [t3('The diode goes across the motor: band to the + rail, other end to the collector.', 'डायोड मोटर के आर-पार लगता है: पट्टी + रेल पर, दूसरा सिरा कलेक्टर पर।', 'Diode motor ke aar-paar lagta hai: band + rail par, doosra end collector par.')])],
    done: (S) => S.motorLevels('m1') >= 2 && S.motorMax('m1') > 300 },
  // 14 -----------------------------------------------------------------------------------------------------------
  { id: 'parking', n: 14, view: 'wide', code: PARKING, drawer: ['hcsr04'], serial: true,
    title: t3('Ultrasonic parking beeper', 'अल्ट्रासोनिक पार्किंग बीपर', 'Ultrasonic parking beeper'),
    goal: t3('Measure distance with sound echoes and beep faster as something comes closer.', 'आवाज़ की गूँज से दूरी नापिए और चीज़ पास आने पर तेज़ बीप कीजिए।', 'Sound ki echo se doori naapiye aur cheez paas aane par tez beep kijiye.'),
    setup: { parts: [P('bz1', 'buzzer', {}, 'e30', 0)], wires: [['GND3', 'H:tn18'], ['5V', 'H:tp30'], ['D8', 'H:a30'], ['H:a33', 'H:tn27']] },
    steps: [
      { k: 'place', place: P('us1', 'hcsr04', {}, 'j50', 0), do: t3('Plug the ultrasonic sensor into 50j–53j, its "eyes" facing you.', 'अल्ट्रासोनिक सेंसर को 50j–53j में लगाइए, इसकी "आँखें" आपकी तरफ़।', 'Ultrasonic sensor ko 50j–53j mein lagaiye, iski "aankhein" aapki taraf.'), see: t3('One "eye" sends sound, the other listens.', 'एक "आँख" आवाज़ भेजती है, दूसरी सुनती है।', 'Ek "aankh" sound bhejti hai, doosri sunti hai.') },
      { k: 'wire', wire: ['us1.VCC', 'rail:tp'], do: t3('Wire VCC (column 50) to the + rail.', 'VCC (कॉलम 50) से + रेल तक वायर।', 'VCC (column 50) se + rail tak wire.'), see: t3('', '', '') },
      { k: 'wire', wire: ['us1.TRIG', 'D9'], do: t3('Wire Trig (column 51) to pin 9.', 'Trig (कॉलम 51) से पिन 9 तक वायर।', 'Trig (column 51) se pin 9 tak wire.'), see: t3('', '', '') },
      { k: 'wire', wire: ['us1.ECHO', 'D10'], do: t3('Wire Echo (column 52) to pin 10.', 'Echo (कॉलम 52) से पिन 10 तक वायर।', 'Echo (column 52) se pin 10 tak wire.'), see: t3('', '', '') },
      { k: 'wire', wire: ['us1.GND', 'rail:tn'], do: t3('Wire GND (column 53) to the − rail.', 'GND (कॉलम 53) से − रेल तक वायर।', 'GND (column 53) se − rail tak wire.'), see: t3('', '', '') },
      { k: 'check', do: t3('Check your circuit.', 'अपना सर्किट जाँचिए।', 'Apna circuit check karo.'), see: t3('', '', '') },
      { k: 'run', do: t3('Press Run.', '"चलाइए" दबाइए।', 'Run dabaiye.'), see: t3('The Serial Monitor shows the distance to the wooden block.', 'सीरियल मॉनिटर लकड़ी के ब्लॉक की दूरी दिखाता है।', 'Serial Monitor wooden block ki doori dikhata hai.') },
      { k: 'act', until: (S) => S.distSeen('us1', 0, 15) && S.tonesHeard() > 0, do: t3('Tap the sensor and slide the block closer than 15 cm.', 'सेंसर को छूइए और ब्लॉक को 15 cm से पास लाइए।', 'Sensor ko touch karo aur block ko 15 cm se paas laiye.'), see: t3('Beep-beep-beep, faster and faster, like a car\'s parking sensor!', 'बीप-बीप-बीप, और तेज़, बिल्कुल कार के पार्किंग सेंसर जैसा!', 'Beep-beep-beep, aur tez, bilkul car ke parking sensor jaisa!') },
    ],
    check: [noShort, (S) => (S.conn('rail:tp', '5V') ? null : [W.vRail]), has('us1', N.us), need('us1.VCC', '5V', W.to5v, { x: 'VCC' }), need('us1.GND', 'GND', W.toGnd, { x: 'GND' }), need('us1.TRIG', 'D9', W.toPin, { x: 'Trig', p: 9 }), need('us1.ECHO', 'D10', W.toPin, { x: 'Echo', p: 10 })],
    done: (S) => S.distSeen('us1', 0, 15) && S.distSeen('us1', 25, 400) && S.tonesHeard() > 0 },
  // 15 -----------------------------------------------------------------------------------------------------------
  { id: 'iralarm', n: 15, view: 'wide', code: IRALARM, drawer: ['ir'],
    title: t3('IR obstacle alarm', 'आईआर बाधा अलार्म', 'IR obstacle alarm'),
    goal: t3('An infrared sensor sees an obstacle and the board sounds an alarm.', 'इन्फ़्रारेड सेंसर बाधा देखता है और बोर्ड अलार्म बजाता है।', 'Infrared sensor obstacle dekhta hai aur board alarm bajata hai.'),
    setup: merge(LEDU(1, 22, 'red', 13), { parts: [P('bz1', 'buzzer', {}, 'e30', 0)], wires: [['GND3', 'H:tn18'], ['5V', 'H:tp30'], ['D8', 'H:a30'], ['H:a33', 'H:tn27']] }),
    steps: [
      { k: 'place', place: F('ir1', 'ir', {}, 110, 85, 2), do: t3('Put the IR sensor on the mat at the ghost.', 'आईआर सेंसर को मैट पर नीली आकृति पर रखिए।', 'IR sensor ko mat par neeli shape par rakhiye.'), see: t3('It looks forward with an infrared LED and a receiver.', 'यह इन्फ़्रारेड एलईडी और रिसीवर से आगे देखता है।', 'Yeh infrared LED aur receiver se aage dekhta hai.') },
      { k: 'wire', wire: ['ir1.VCC', 'rail:tp'], do: t3('Wire its VCC pin to the + rail.', 'इसके VCC पिन से + रेल तक वायर।', 'Iske VCC pin se + rail tak wire.'), see: t3('', '', '') },
      { k: 'wire', wire: ['ir1.GND', 'rail:tn'], do: t3('Wire its GND pin to the − rail.', 'इसके GND पिन से − रेल तक वायर।', 'Iske GND pin se − rail tak wire.'), see: t3('', '', '') },
      { k: 'wire', wire: ['ir1.OUT', 'D7'], do: t3('Wire its OUT pin to pin 7.', 'इसके OUT पिन से पिन 7 तक वायर।', 'Iske OUT pin se pin 7 tak wire.'), see: t3('', '', '') },
      { k: 'check', do: t3('Check your circuit.', 'अपना सर्किट जाँचिए।', 'Apna circuit check karo.'), see: t3('', '', '') },
      { k: 'run', do: t3('Press Run.', '"चलाइए" दबाइए।', 'Run dabaiye.'), see: t3('', '', '') },
      { k: 'act', until: (S) => S.flag('irAlarm'), do: t3('Tap the sensor and slide the block close (under 10 cm).', 'सेंसर को छूइए और ब्लॉक को पास लाइए (10 cm से कम)।', 'Sensor ko touch karo aur block ko paas laiye (10 cm se kam).'), see: t3('Its green light comes on, OUT goes LOW: the LED flashes and the buzzer beeps.', 'इसकी हरी बत्ती जलती है, OUT LOW होता है: एलईडी चमकती है और बज़र बजता है।', 'Iski green light jalti hai, OUT LOW hota hai: LED chamakti hai aur buzzer bajta hai.') },
      { k: 'act', until: (S) => S.flag('irQuiet'), do: t3('Move the block far away again.', 'ब्लॉक को फिर दूर ले जाइए।', 'Block ko phir door le jaiye.'), see: t3('Quiet again. Robots use these to stop before they hit a wall.', 'फिर शांति। रोबोट दीवार से टकराने से पहले रुकने के लिए इन्हीं का इस्तेमाल करते हैं।', 'Phir shaanti. Robots deewar se takrane se pehle rukne ke liye inhi ka use karte hain.') },
    ],
    check: [noShort, (S) => (S.conn('rail:tp', '5V') ? null : [W.vRail]), has('ir1', N.ir), need('ir1.VCC', '5V', W.to5v, { x: 'VCC' }), need('ir1.GND', 'GND', W.toGnd, { x: 'GND' }), need('ir1.OUT', 'D7', W.toPin, { x: 'OUT', p: 7 })],
    done: (S) => S.flag('irAlarm') && S.flag('irQuiet') },
  // 16 -----------------------------------------------------------------------------------------------------------
  { id: 'temp', n: 16, view: 'bb', code: TEMP, drawer: ['lm35'], serial: true,
    title: t3('Temperature meter', 'तापमान मीटर', 'Temperature meter'),
    goal: t3('Read an LM35 sensor, turn its voltage into °C, and warn when it gets too hot.', 'LM35 सेंसर पढ़िए, उसके वोल्टेज को °C में बदलिए, और ज़्यादा गर्मी होने पर चेतावनी दीजिए।', 'LM35 sensor padhiye, uske voltage ko °C mein badaliye, aur zyada garmi hone par warning dijiye.'),
    setup: merge(LEDU(1, 22, 'red', 13), { wires: [['GND3', 'H:tn18'], ['5V', 'H:tp30']] }),
    steps: [
      { k: 'place', place: P('t1', 'lm35', {}, 'e45', 0), do: t3('Put the LM35 in 45e–47e, flat side facing you.', 'LM35 को 45e–47e में लगाइए, चपटी तरफ़ आपकी ओर।', 'LM35 ko 45e–47e mein lagaiye, flat side aapki taraf.'), see: t3('Left: +5 V, middle: output, right: GND.', 'बायाँ: +5 V, बीच: आउटपुट, दायाँ: GND।', 'Left: +5 V, beech: output, right: GND.') },
      { k: 'wire', wire: ['t1.VS', 'rail:tp'], do: t3('Wire its left leg (column 45) to the + rail.', 'इसके बाएँ पैर (कॉलम 45) से + रेल तक वायर।', 'Iske left pair (column 45) se + rail tak wire.'), see: t3('', '', '') },
      { k: 'wire', wire: ['t1.OUT', 'A0'], do: t3('Wire its middle leg (column 46) to A0.', 'इसके बीच वाले पैर (कॉलम 46) से A0 तक वायर।', 'Iske beech wale pair (column 46) se A0 tak wire.'), see: t3('', '', '') },
      { k: 'wire', wire: ['t1.GND', 'rail:tn'], do: t3('Wire its right leg (column 47) to the − rail.', 'इसके दाएँ पैर (कॉलम 47) से − रेल तक वायर।', 'Iske right pair (column 47) se − rail tak wire.'), see: t3('', '', '') },
      { k: 'check', do: t3('Check your circuit.', 'अपना सर्किट जाँचिए।', 'Apna circuit check karo.'), see: t3('', '', '') },
      { k: 'run', do: t3('Press Run.', '"चलाइए" दबाइए।', 'Run dabaiye.'), see: t3('The room is 26 °C: the sensor gives 0.26 V, A0 reads about 53, and 53 × 5 ÷ 1023 × 100 ≈ 26.', 'कमरा 26 °C का है: सेंसर 0.26 V देता है, A0 लगभग 53 पढ़ता है, और 53 × 5 ÷ 1023 × 100 ≈ 26।', 'Room 26 °C ka hai: sensor 0.26 V deta hai, A0 lagbhag 53 padhta hai, aur 53 × 5 ÷ 1023 × 100 ≈ 26.') },
      { k: 'act', until: (S) => S.tempSeen(38) && S.ledLit('led1'), do: t3('Tap the sensor and warm it to 40 °C (like holding it in your fingers on a hot day).', 'सेंसर को छूइए और उसे 40 °C तक गर्म कीजिए (जैसे गर्मी के दिन उँगलियों में पकड़ने पर)।', 'Sensor ko touch karo aur use 40 °C tak garam kijiye (jaise garmi ke din ungliyon mein pakadne par).'), see: t3('The reading climbs past 35 °C and the red LED warns you.', 'रीडिंग 35 °C से ऊपर जाती है और लाल एलईडी चेतावनी देती है।', 'Reading 35 °C se upar jaati hai aur red LED warning deti hai.') },
    ],
    check: [noShort, (S) => (S.conn('rail:tp', '5V') ? null : [W.vRail]), has('t1', N.lm), need('t1.VS', '5V', W.to5v, { x: t3('LM35\'s left leg (+Vs)', 'LM35 का बायाँ पैर (+Vs)', 'LM35 ka left pair (+Vs)') }), need('t1.OUT', 'A0', W.join, { a: t3('The LM35\'s middle leg', 'LM35 का बीच वाला पैर', 'LM35 ka beech wala pair'), b: 'A0' }), need('t1.GND', 'GND', W.toGnd, { x: t3('LM35\'s right leg', 'LM35 का दायाँ पैर', 'LM35 ka right pair') })],
    done: (S) => S.tempSeen(38) && S.tempSeen(20, 30) && S.ledLit('led1') },
];
// batch 2: robots (lessons2.js)
for (const l of LESSONS) l.group = 'basics'; // the lesson strip's sections (main.js renderStrip)
LESSONS.push(...grp(batch2({ t3, P, F, W, need, has, noShort, N }), 'robots'));
// batch 4: more boards (lessons4.js), numbered after the lessons before them
LESSONS.push(...grp(batch4({ t3, P, F, W, need, has, noShort, N, unit, LEDU, merge, base: LESSONS.length + 1 }), 'boards'));
// batch 3: projects with the school-lab modules (lessons3.js); numbered after the lessons above
LESSONS.push(...grp(batch3({ t3, P, F, W, need, has, noShort, N, n0: LESSONS.length }), 'modules'));
// batch 5: the micro:bit in Python (lessons5.js). They run on the micro:bit desk (microbit.js, mbworld5.js), so they are
// listed in the page; the node checks of the Arduino sketches (robocore*.mjs) do not get them: robocore5.mjs runs them itself
if (typeof document !== 'undefined') LESSONS.push(...grp(batch5({ t3, W }, LESSONS.length), 'microbit'));
// batches 10, 8, 9, 11: the micro:bit projects of Classes 2, 3, 4 and 5 (devtools/test/robocore8.mjs plays every one)
if (typeof document !== 'undefined') for (const b of [batch10, batch8, batch9, batch11, batch13]) LESSONS.push(...grp(b({ t3, W }, LESSONS.length), 'microbit'));
if (typeof document !== 'undefined') LESSONS.push(...grp(batch16mb({ t3, W }, LESSONS.length), 'microbit')); // batch 16: the Class 8 gesture AI (robocore16.mjs plays it)
// batch 6: the Raspberry Pi (lessons6.js), in Python too, so likewise listed in the page only; robocore6.mjs runs them
if (typeof document !== 'undefined') LESSONS.push(...grp(batch6({ t3, P, F, W }, LESSONS.length), 'pi'));
if (typeof document !== 'undefined') LESSONS.push(...grp(batch15({ t3, P, F, W }, LESSONS.length), 'pi')); // batch 15 (robocore15.mjs plays them)
// batch 7: Arduino projects (lessons7.js), C++ on the Uno / Mega / ESP32, so in the page and in the node checks alike
LESSONS.push(...grp(batch7({ t3, P, F, W, need, has, noShort, N, unit, LEDU, merge }, LESSONS.length), 'projects'));
LESSONS.push(...grp(batch12({ t3, P, F, W, need, has, noShort, N, unit, LEDU, merge }, LESSONS.length), 'projects')); // batch 12: Class 6 electronics (lessons12.js)
LESSONS.push(...grp(batch14({ t3, P, F, W, need, has, noShort, N }, LESSONS.length), 'robots')); // batch 14: the Class 7 robot cars (lessons14.js)
LESSONS.push(...grp(batch16({ t3, P, F, W, need, has, noShort, N, unit }, LESSONS.length), 'projects')); // batch 16: Class 8 sessions (lessons16.js; robocore16.mjs plays them)
LESSONS.push(...grp(batch17({ t3, P, F, W, need, has, noShort, N }, LESSONS.length), 'projects')); // batch 17: Class 9 sessions (lessons17.js; robocore17.mjs plays them)
// battery circuits for the youngest (circuits.js) and the project bank (factory.js: a job, a sensor and an output each);
// every one is checked end to end by devtools/test/robocircuits.mjs and robofactory.mjs
LESSONS.push(...grp(batchC({ W }, LESSONS.length), 'circuits'));
LESSONS.push(...grp(batchF({ W }, LESSONS.length), 'bank'));
// batch 14: the same bank on the micro:bit (factorymb.js), in the page only (robofactorymb.mjs plays every one)
if (typeof document !== 'undefined') LESSONS.push(...grp(batchFM({ W }, LESSONS.length), 'bank'));
export const BY_ID = Object.fromEntries(LESSONS.map((l) => [l.id, l]));
export { W as LESSON_WORDS, RAILS };
