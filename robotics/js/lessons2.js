// DUET Robotics Lab 360, batch 2: robots that school ATL / STEM labs in India build. Same shape as lessons.js; a lesson
// may also have `world` (the robot next to the bench: worlds.js) and `rview` (the camera for its run/watch/act steps).
// The helpers (t3, P, F, W, need, has, noShort, N) come from lessons.js (batch2(K)), so there is no import loop.
// Drop 1: the robot arm in five levels, the line follower, the obstacle-avoiding car.

// ------------------------------------------------------------------ the sketches
const ARM1 = `// Robot arm, level 1: the base turns the whole arm
#include <Servo.h>
Servo base;

void setup() {
  base.attach(3);    // the base servo's orange wire is on pin 3
  base.write(90);    // 90 = straight towards you
  delay(1500);
  base.write(30);    // 0 = right, 180 = left
}

void loop() {
}
`;
const ARM2 = `// Robot arm, level 2: base and shoulder
#include <Servo.h>
Servo base;
Servo shoulder;

void setup() {
  base.attach(3);
  shoulder.attach(5);
  base.write(60);        // turn towards the red ball
  delay(800);
  shoulder.write(60);    // lift the upper arm: 0 = flat, 90 = straight up
}

void loop() {
}
`;
const ARM3 = `// Robot arm, level 3: base, shoulder and elbow
#include <Servo.h>
Servo base;
Servo shoulder;
Servo elbow;

void moveTo(int b, int s, int e) {   // one pose: base, shoulder, elbow
  base.write(b);
  shoulder.write(s);
  elbow.write(e);       // 180 = straight on, 90 = a right angle
  delay(1000);
}

void setup() {
  base.attach(3);
  shoulder.attach(5);
  elbow.attach(6);
  moveTo(90, 90, 90);     // home
  moveTo(100, 70, 90);    // towards the ball
}

void loop() {
}
`;
const ARM4 = `// Robot arm, level 4: pick the block up at A and put it down at B
#include <Servo.h>
Servo base;
Servo shoulder;
Servo elbow;
Servo claw;

void moveTo(int b, int s, int e) {
  base.write(b);
  shoulder.write(s);
  elbow.write(e);
  delay(900);
}

void setup() {
  base.attach(3);
  shoulder.attach(5);
  elbow.attach(6);
  claw.attach(9);
  claw.write(30);          // open the claw
  moveTo(140, 80, 90);     // above A
  moveTo(140, 45, 66);     // down to the block
  claw.write(90);          // close: hold the block
  delay(600);
  moveTo(140, 80, 90);     // lift it
  moveTo(90, 80, 90);      // turn towards B
  moveTo(90, 45, 66);      // down
  claw.write(30);          // open: let go
  delay(600);
  moveTo(90, 90, 90);      // home
}

void loop() {
}
`;
const ARM5 = `// Robot arm, level 5: drive it with a joystick
#include <Servo.h>
Servo base;
Servo shoulder;
Servo elbow;
Servo claw;
int b = 90;    // where the base is now
int s = 90;    // where the shoulder is now

void setup() {
  base.attach(3);
  shoulder.attach(5);
  elbow.attach(6);
  claw.attach(9);
  pinMode(2, INPUT_PULLUP);    // the joystick's button
  elbow.write(110);
  Serial.begin(9600);
}

void loop() {
  int x = analogRead(A0);      // left-right: 0 .. 1023, 512 in the middle
  int y = analogRead(A1);      // down-up
  if (x > 700) b = b - 2;      // stick right: turn right
  if (x < 300) b = b + 2;      // stick left: turn left
  if (y > 700) s = s + 2;      // stick up: lift
  if (y < 300) s = s - 2;      // stick down: lower
  b = constrain(b, 0, 180);
  s = constrain(s, 20, 160);
  base.write(b);
  shoulder.write(s);
  if (digitalRead(2) == LOW) {
    claw.write(90);            // stick pressed: close the claw
  } else {
    claw.write(30);
  }
  Serial.print(b);
  Serial.print(" ");
  Serial.println(s);
  delay(20);
}
`;
const DRIVE = `const int ENA = 5, IN1 = 7, IN2 = 8;    // motor A: the left wheel
const int ENB = 6, IN3 = 2, IN4 = 4;    // motor B: the right wheel

// one motor: v from -255 (backwards) to 255 (forwards)
void motor(int en, int a, int b, int v) {
  digitalWrite(a, v > 0 ? HIGH : LOW);
  digitalWrite(b, v < 0 ? HIGH : LOW);
  analogWrite(en, abs(v));       // PWM: how fast
}

void drive(int left, int right) {
  motor(ENA, IN1, IN2, left);
  motor(ENB, IN3, IN4, right);
}
`;
const PINS = `  pinMode(ENA, OUTPUT); pinMode(IN1, OUTPUT); pinMode(IN2, OUTPUT);
  pinMode(ENB, OUTPUT); pinMode(IN3, OUTPUT); pinMode(IN4, OUTPUT);`;
const LINE = `// Line follower: two IR sensors look down at the floor
// (their OUT is LOW on white, where light comes back, and HIGH on the black tape)
${DRIVE}
const int irLeft = 11, irRight = 12;
int speed = 110;    // 0 .. 255
int turn = 0;       // the inside wheel in a turn: 0 = stop

void setup() {
${PINS}
  pinMode(irLeft, INPUT);
  pinMode(irRight, INPUT);
}

void loop() {
  int L = digitalRead(irLeft);
  int R = digitalRead(irRight);
  if (L == LOW && R == LOW) {
    drive(speed, speed);          // both on white: straight on
  } else if (L == HIGH && R == LOW) {
    drive(turn, speed);           // tape under the left sensor: turn left
  } else if (L == LOW && R == HIGH) {
    drive(speed, turn);           // tape under the right sensor: turn right
  } else {
    drive(0, 0);                  // both on black: stop
  }
}
`;
const AVOID = `// Obstacle-avoiding car: it looks ahead; near a wall it stops,
// looks left and right, backs off, and turns to the side that is more open
#include <Servo.h>
${DRIVE}
const int trig = 9, echo = 10;
Servo scan;
int speed = 140;
int safe = 30;      // cm: closer than this is "too close"

int distanceCm() {
  digitalWrite(trig, LOW);
  delayMicroseconds(2);
  digitalWrite(trig, HIGH);
  delayMicroseconds(10);
  digitalWrite(trig, LOW);
  long t = pulseIn(echo, HIGH, 30000);   // wait at most 30 ms
  if (t == 0) return 400;                // no echo: nothing near
  return t * 0.034 / 2;
}

void setup() {
${PINS}
  pinMode(trig, OUTPUT);
  pinMode(echo, INPUT);
  scan.attach(3);
  scan.write(90);                        // look straight ahead
  Serial.begin(9600);
}

void loop() {
  int ahead = distanceCm();
  Serial.println(ahead);
  if (ahead > safe) {
    drive(speed, speed);                 // the way is clear
    delay(50);
    return;
  }
  drive(0, 0);                           // stop, and look round
  scan.write(170);
  delay(400);
  int left = distanceCm();
  scan.write(10);
  delay(400);
  int right = distanceCm();
  scan.write(90);
  delay(300);
  drive(-speed, -speed);                 // back off a little first
  delay(250);
  if (left > right) {
    drive(-speed, speed);                // spin to the left
  } else {
    drive(speed, -speed);                // spin to the right
  }
  delay(450);
}
`;
const BIN = `// Smart dustbin: a hand near the sensor opens the lid,
// and the lid shuts again by itself
#include <Servo.h>
const int trig = 9, echo = 10;
Servo lid;
int openCm = 5;       // a hand closer than this opens the lid
int waitMs = 3000;    // how long the lid stays open

int distanceCm() {
  digitalWrite(trig, LOW);
  delayMicroseconds(2);
  digitalWrite(trig, HIGH);
  delayMicroseconds(10);
  digitalWrite(trig, LOW);
  long t = pulseIn(echo, HIGH, 30000);
  if (t == 0) return 400;                // no echo: nothing near
  return t * 0.034 / 2;
}

void setup() {
  pinMode(trig, OUTPUT);
  pinMode(echo, INPUT);
  lid.attach(3);
  lid.write(0);                          // shut
  Serial.begin(9600);
}

void loop() {
  int d = distanceCm();
  Serial.println(d);
  if (d < openCm) {
    lid.write(100);                      // open wide
    delay(waitMs);                       // time to throw the rubbish in
    lid.write(0);                        // shut again
  }
  delay(100);
}
`;
const BT = `// Bluetooth car: the phone app sends one letter for each button
// F forward, B back, L left, R right, S stop (when you let go)
${DRIVE}
int speed = 200;      // 0 .. 255

void setup() {
${PINS}
  Serial.begin(9600);                    // the HC-05 talks at 9600 baud
}

void loop() {
  if (Serial.available() > 0) {          // a letter has come in
    char c = Serial.read();
    if (c == 'F') drive(speed, speed);
    if (c == 'B') drive(-speed, -speed);
    if (c == 'L') drive(-speed, speed);  // spin on the spot
    if (c == 'R') drive(speed, -speed);
    if (c == 'S') drive(0, 0);
  }
}
`;
const HYD = `// Pascal's law: press on water shut in a tube, and the pressure
// is the same everywhere in it. P = F / A, so the syringe that
// lifts gives F2 = P x A2. (No electronics in the arm: this sketch
// only does the sums, on the Serial Monitor.)
float d1 = 1.20;    // cm: inside width of the syringe you push (5 mL)
float d2 = 1.91;    // cm: inside width of the syringe that lifts (20 mL)
float F1 = 10.0;    // N: how hard you push (10 N is the weight of 1 kg)

void setup() {
  Serial.begin(9600);
  float A1 = 3.1416 * (d1 / 2) * (d1 / 2);    // area = pi x r x r (cm2)
  float A2 = 3.1416 * (d2 / 2) * (d2 / 2);
  float P = F1 / A1;                          // N per cm2
  float F2 = P * A2;
  Serial.print("A1 = "); Serial.print(A1); Serial.println(" cm2");
  Serial.print("A2 = "); Serial.print(A2); Serial.println(" cm2");
  Serial.print("P  = "); Serial.print(P * 10); Serial.println(" kPa");
  Serial.print("F2 = "); Serial.print(F2); Serial.println(" N");
}

void loop() {
}
`;
export const BATCH2_CODE = { ARM1, ARM2, ARM3, ARM4, ARM5, LINE, AVOID, BIN, BT, HYD };

export function batch2(K) {
  const { t3, P, F, W, need, has, noShort, N } = K;
  // words used by these lessons
  const X = {
    commonGnd: t3('The adapter\'s − must also be joined to the Arduino\'s GND (wire the front − rail to a GND pin), or the servos cannot understand the signal.',
      'एडैप्टर का − Arduino के GND से भी जुड़ना चाहिए (आगे वाली − रेल से किसी GND पिन तक वायर), वरना सर्वो सिग्नल नहीं समझ पाएँगे।',
      'Adapter ka − Arduino ke GND se bhi judna chahiye (aage wali − rail se kisi GND pin tak wire), warna servos signal nahi samajh payenge.'),
    psuRail: t3('The adapter must feed the front rails: its + to the red + rail, its − to the blue − rail.', 'एडैप्टर आगे वाली रेलों को बिजली दे: इसका + लाल + रेल पर, इसका − नीली − रेल पर।', 'Adapter aage wali rails ko power de: iska + red + rail par, iska − blue − rail par.'),
    notUno: t3('The servo\'s red wire is on the Arduino\'s 5V. The MG996R can pull 2.5 A and the board would reset: put it on the adapter\'s + rail.', 'सर्वो का लाल तार Arduino के 5V पर है। MG996R 2.5 A तक खींच सकता है और बोर्ड रीसेट हो जाएगा: इसे एडैप्टर की + रेल पर लगाइए।', 'Servo ka red wire Arduino ke 5V par hai. MG996R 2.5 A tak kheench sakta hai aur board reset ho jayega: ise adapter ki + rail par lagaiye.'),
    bt: t3('Bluetooth module HC-05', 'ब्लूटूथ मॉड्यूल HC-05', 'Bluetooth module HC-05'),
    btCrossed: t3('The HC-05\'s TXD is on pin 1, the Arduino\'s TX: two talkers and no listener. Move it to pin 0 (RX).', 'HC-05 का TXD पिन 1 पर है, जो Arduino का TX है: दो बोलने वाले, सुनने वाला कोई नहीं। इसे पिन 0 (RX) पर लगाइए।', 'HC-05 ka TXD pin 1 par hai, jo Arduino ka TX hai: do bolne wale, sunne wala koi nahi. Ise pin 0 (RX) par lagaiye.'),
    drvGnd: t3('The L298N\'s GND must be joined to the Arduino\'s GND too (common ground), or IN1–IN4 mean nothing to it.', 'L298N का GND, Arduino के GND से भी जुड़ना चाहिए (कॉमन ग्राउंड), वरना IN1–IN4 का उसके लिए कोई मतलब नहीं।', 'L298N ka GND, Arduino ke GND se bhi judna chahiye (common ground), warna IN1–IN4 ka uske liye koi matlab nahi.'),
  };
  const sv = (k) => ({ svB: t3('base servo', 'बेस का सर्वो', 'base ka servo'), svS: t3('shoulder servo', 'कंधे का सर्वो', 'shoulder ka servo'), svE: t3('elbow servo', 'कोहनी का सर्वो', 'elbow ka servo'), svG: t3('claw servo', 'पंजे का सर्वो', 'claw ka servo') }[k]);
  // the arm's bench: the adapter, and the four servo plugs (base, shoulder, elbow: MG996R; claw: SG90)
  const ARMPARTS = [F('psu', 'psu5', {}, 40, 78, 2), F('svB', 'mg996r', { mount: 'arm' }, 172, 50, 1), F('svS', 'mg996r', { mount: 'arm' }, 172, 78, 1), F('svE', 'mg996r', { mount: 'arm' }, 172, 106, 1), F('svG', 'servo', { mount: 'arm' }, 172, 134, 1)];
  const SUPPLY = [['T:psu:P', 'H:bp20'], ['T:psu:N', 'H:bn21'], ['GND1', 'H:bn5']];
  const SERVO = { svB: 3, svS: 5, svE: 6, svG: 9 };
  const servoWires = (k) => [['T:' + k + ':GND', 'H:bn' + (24 + Object.keys(SERVO).indexOf(k) * 4)], ['T:' + k + ':VP', 'H:bp' + (24 + Object.keys(SERVO).indexOf(k) * 4)], ['T:' + k + ':SIG', 'D' + SERVO[k]]];
  const armSetup = (wired) => ({ parts: ARMPARTS, wires: [...SUPPLY, ...wired.flatMap(servoWires)] });
  const servoChecks = (k) => [need(k + '.GND', 'GND', W.toGnd, { x: t3('The ' + sv(k).en + '\'s brown wire', sv(k).hi + ' का भूरा तार', sv(k).hg + ' ka brown wire') }),
    (S) => (S.conn(k + '.VP', '5V') ? [X.notUno] : null), need(k + '.VP', 'psu.P', W.join, { a: t3('The ' + sv(k).en + '\'s red wire', sv(k).hi + ' का लाल तार', sv(k).hg + ' ka red wire'), b: t3('the adapter\'s + rail', 'एडैप्टर की + रेल', 'adapter ki + rail') }),
    need(k + '.SIG', 'D' + SERVO[k], W.toPin, { x: t3(sv(k).en + '\'s orange wire', sv(k).hi + ' का नारंगी तार', sv(k).hg + ' ka orange wire'), p: SERVO[k] })];
  const supplyChecks = [noShort, (S) => (S.conn('psu.P', 'rail:bp') && S.conn('psu.N', 'rail:bn') ? null : [X.psuRail]), (S) => (S.conn('psu.N', 'GND') ? null : [X.commonGnd])];
  const wireServo = (k, extra) => [
    { k: 'wire', wire: [k + '.GND', 'rail:bn'], do: t3(`Wire the ${sv(k).en}'s brown wire (its plug on the mat) to the front blue − rail.`, `${sv(k).hi} का भूरा तार (मैट पर उसका प्लग) आगे वाली नीली − रेल से जोड़िए।`, `${sv(k).hg} ka brown wire (mat par uska plug) aage wali blue − rail se jodiye.`), see: t3('', '', '') },
    { k: 'wire', wire: [k + '.VP', 'rail:bp'], do: t3('Its red wire to the front red + rail (the adapter\'s 5 V).', 'इसका लाल तार आगे वाली लाल + रेल (एडैप्टर का 5 V) से।', 'Iska red wire aage wali red + rail (adapter ka 5 V) se.'), see: t3('', '', '') },
    { k: 'wire', wire: [k + '.SIG', 'D' + SERVO[k]], do: t3(`Its orange wire to pin ${SERVO[k]}.`, `इसका नारंगी तार पिन ${SERVO[k]} से।`, `Iska orange wire pin ${SERVO[k]} se.`), see: extra || t3('', '', '') },
  ];
  // the car's bench: the driver, the battery and the two motors, wired as on the real car
  const CARPARTS = [F('drv', 'l298n', {}, -35, 105, 0), F('bat', 'bat18650', {}, -190, 108, 0), F('mL', 'bomotor', { side: 'L' }, -80, 152, 3), F('mR', 'bomotor', { side: 'R' }, 10, 152, 1)];
  const CARWIRES = [['T:bat:P', 'T:drv:VS'], ['T:bat:N', 'T:drv:GND'], ['T:mL:P', 'T:drv:OUT1'], ['T:mL:N', 'T:drv:OUT2'], ['T:mR:P', 'T:drv:OUT3'], ['T:mR:N', 'T:drv:OUT4'],
    ['T:drv:ENA', 'D5'], ['T:drv:ENB', 'D6'], ['T:drv:IN1', 'D7'], ['T:drv:IN2', 'D8'], ['T:drv:IN3', 'D2'], ['T:drv:IN4', 'D4'], ['GND3', 'H:tn18'], ['5V', 'H:tp30']];
  const driveChecks = [noShort, (S) => (S.conn('rail:tp', '5V') ? null : [W.vRail]), (S) => (S.conn('drv.GND', 'GND') ? null : [X.drvGnd]),
    ...[['ENA', 5], ['ENB', 6], ['IN1', 7], ['IN2', 8], ['IN3', 2], ['IN4', 4]].map(([a, p]) => need('drv.' + a, 'D' + p, W.toPin, { x: 'L298N ' + a, p }))];
  const irUnit = (tag, pin, side) => [
    { k: 'wire', wire: [tag + '.VCC', 'rail:tp'], do: t3(`Wire the ${side.en} sensor's VCC to the + rail.`, `${side.hi} सेंसर का VCC + रेल से जोड़िए।`, `${side.hg} sensor ka VCC + rail se jodiye.`), see: t3('', '', '') },
    { k: 'wire', wire: [tag + '.GND', 'rail:tn'], do: t3('Its GND to the − rail.', 'इसका GND − रेल से।', 'Iska GND − rail se.'), see: t3('', '', '') },
    { k: 'wire', wire: [tag + '.OUT', 'D' + pin], do: t3(`Its OUT to pin ${pin}.`, `इसका OUT पिन ${pin} से।`, `Iska OUT pin ${pin} se.`), see: t3('', '', '') },
  ];
  const fresh = (S) => S.running() && S.fresh();
  // the dustbin: the sensor's and the lid servo's plugs on the mat
  const BINPARTS = [F('us', 'hcsr04f', {}, 172, 62, 1), F('sv', 'servo', { mount: 'bin' }, 172, 112, 1)];
  return [
    // 17 ----------------------------------------------------------------------------------------------------------
    { id: 'arm1', n: 17, view: 'side', wview: 'armbench', code: ARM1, drawer: [], world: { kind: 'arm', level: 1 },
      title: t3('Robot arm 1: the base', 'रोबोट बाँह 1: बेस', 'Robot arm 1: base'),
      goal: t3('A real 4-joint arm stands next to the bench. Power its servos safely and turn the base to point at the red flag.', 'बेंच के पास एक असली 4 जोड़ों वाली बाँह खड़ी है। इसके सर्वो को सुरक्षित बिजली दीजिए और बेस घुमाकर लाल झंडे की ओर कीजिए।', 'Bench ke paas ek asli 4 joints wali baanh khadi hai. Iske servos ko safe power dijiye aur base ghuma kar laal jhande ki taraf kijiye.'),
      setup: { parts: ARMPARTS, wires: [] },
      steps: [
        { k: 'info', do: t3('The arm has four servos: base, shoulder, elbow (strong MG996R) and the claw (an SG90). Their cables end in the four plugs on the mat. Today: only the base.', 'बाँह में चार सर्वो हैं: बेस, कंधा, कोहनी (ताक़तवर MG996R) और पंजा (एक SG90)। इनकी केबल मैट पर रखे चार प्लग में ख़त्म होती हैं। आज: सिर्फ़ बेस।', 'Baanh mein chaar servo hain: base, shoulder, elbow (taakatwar MG996R) aur claw (ek SG90). Inki cable mat par rakhe chaar plug mein khatam hoti hai. Aaj: sirf base.'),
          see: t3('Four servos can pull more than 2 A when they push hard. USB gives 0.5 A, so they get their own 5 V adapter.', 'चार सर्वो ज़ोर लगाते समय 2 A से ज़्यादा खींच सकते हैं। USB सिर्फ़ 0.5 A देता है, इसलिए इन्हें अपना 5 V एडैप्टर मिलता है।', 'Chaar servo zor lagate waqt 2 A se zyada kheench sakte hain. USB sirf 0.5 A deta hai, isliye inhe apna 5 V adapter milta hai.') },
        { k: 'wire', wire: ['psu.P', 'rail:bp'], do: t3('Wire the adapter\'s + to the front red + rail.', 'एडैप्टर का + आगे वाली लाल + रेल से जोड़िए।', 'Adapter ka + aage wali red + rail se jodiye.'), see: t3('', '', '') },
        { k: 'wire', wire: ['psu.N', 'rail:bn'], do: t3('Wire the adapter\'s − to the front blue − rail.', 'एडैप्टर का − आगे वाली नीली − रेल से जोड़िए।', 'Adapter ka − aage wali blue − rail se jodiye.'), see: t3('', '', '') },
        { k: 'wire', wire: ['GND1', 'rail:bn'], do: t3('Wire a GND pin of the Arduino to the same − rail.', 'Arduino के किसी GND पिन को उसी − रेल से जोड़िए।', 'Arduino ke kisi GND pin ko usi − rail se jodiye.'),
          see: t3('Common ground: now the adapter and the Arduino share one 0 V, so the signal\'s 5 V means the same to both.', 'कॉमन ग्राउंड: अब एडैप्टर और Arduino का 0 V एक है, तो सिग्नल के 5 V का मतलब दोनों के लिए एक ही है।', 'Common ground: ab adapter aur Arduino ka 0 V ek hai, to signal ke 5 V ka matlab dono ke liye ek hi hai.') },
        ...wireServo('svB'),
        { k: 'check', do: t3('Check your circuit.', 'अपना सर्किट जाँचिए।', 'Apna circuit check karo.'), see: t3('', '', '') },
        { k: 'run', do: t3('Press Run.', '"चलाइए" दबाइए।', 'Run dabaiye.'), see: t3('', '', '') },
        { k: 'watch', until: (S) => S.servoMin('svB') < 35, do: t3('Watch the arm, and the base angle in the arm\'s panel.', 'बाँह को और बाँह के पैनल में बेस का कोण देखिए।', 'Baanh ko aur baanh ke panel mein base ka angle dekhiye.'),
          see: t3('It looks at you (90°), then turns right to 30°. The blue half ring on the desk is how far the claw can reach.', 'यह पहले आपकी ओर (90°) देखती है, फिर दाईं ओर 30° तक घूमती है। डेस्क पर नीला आधा छल्ला दिखाता है कि पंजा कहाँ तक पहुँच सकता है।', 'Yeh pehle aapki taraf (90°) dekhti hai, phir right 30° tak ghoomti hai. Desk par neela aadha chhalla dikhata hai ki claw kahan tak pahunch sakta hai.') },
        { k: 'edit', test: (src) => /base\.write\(\s*1(1[6-9]|2[0-4])\s*\)/.test(src), set: [[/base\.write\(30\)/, 'base.write(120)']],
          do: t3('The red flag is at 120°. Change base.write(30) to base.write(120) and press Run.', 'लाल झंडा 120° पर है। base.write(30) को base.write(120) कीजिए और "चलाइए" दबाइए।', 'Laal jhanda 120° par hai. base.write(30) ko base.write(120) karo aur Run dabaiye.'), see: t3('', '', '') },
        { k: 'watch', until: (S) => S.w('aimed'), do: t3('Watch it turn.', 'इसे घूमते देखिए।', 'Ise ghoomte dekhiye.'), see: t3('It points at the flag. One servo, one joint, one number: that is one degree of freedom.', 'यह झंडे की ओर इशारा करती है। एक सर्वो, एक जोड़, एक संख्या: यही एक "डिग्री ऑफ़ फ़्रीडम" है।', 'Yeh jhande ki taraf ishara karti hai. Ek servo, ek joint, ek number: yahi ek degree of freedom hai.') },
      ],
      check: [...supplyChecks, ...servoChecks('svB')],
      done: (S) => S.w('aimed') },
    // 18 ----------------------------------------------------------------------------------------------------------
    { id: 'arm2', n: 18, view: 'side', wview: 'armbench', code: ARM2, drawer: [], world: { kind: 'arm', level: 2 },
      title: t3('Robot arm 2: the shoulder', 'रोबोट बाँह 2: कंधा', 'Robot arm 2: shoulder'),
      goal: t3('Add the shoulder: two joints together reach a red ball in the air.', 'कंधा जोड़िए: दो जोड़ मिलकर हवा में लटकी लाल गेंद तक पहुँचते हैं।', 'Shoulder jodiye: do joints milkar hawa mein lal ball tak pahunchte hain.'),
      setup: armSetup(['svB']),
      steps: [
        { k: 'info', do: t3('The adapter and the base are wired from level 1. The shoulder lifts the upper arm: 0° is flat, 90° is straight up.', 'एडैप्टर और बेस लेवल 1 से जुड़े हैं। कंधा ऊपर वाली बाँह को उठाता है: 0° यानी सपाट, 90° यानी सीधा ऊपर।', 'Adapter aur base level 1 se jude hain. Shoulder upar wali baanh ko uthata hai: 0° matlab flat, 90° matlab seedha upar.'), see: t3('', '', '') },
        ...wireServo('svS'),
        { k: 'check', do: t3('Check your circuit.', 'अपना सर्किट जाँचिए।', 'Apna circuit check karo.'), see: t3('', '', '') },
        { k: 'run', do: t3('Press Run.', '"चलाइए" दबाइए।', 'Run dabaiye.'), see: t3('', '', '') },
        { k: 'watch', until: (S) => S.servoMax('svS') > 55, do: t3('Watch the claw\'s height in the panel.', 'पैनल में पंजे की ऊँचाई देखिए।', 'Panel mein claw ki oonchai dekhiye.'), see: t3('At 60° the claw is too low and too far: it misses the ball.', '60° पर पंजा बहुत नीचे और बहुत दूर है: गेंद से चूक जाता है।', '60° par claw bahut neeche aur bahut door hai: ball se chook jaata hai.') },
        { k: 'edit', test: (src) => /shoulder\.write\(\s*(9[5-9]|10[0-5])\s*\)/.test(src), set: [[/shoulder\.write\(60\)/, 'shoulder.write(100)']],
          do: t3('Change shoulder.write(60) to shoulder.write(100) and press Run.', 'shoulder.write(60) को shoulder.write(100) कीजिए और "चलाइए" दबाइए।', 'shoulder.write(60) ko shoulder.write(100) karo aur Run dabaiye.'), see: t3('', '', '') },
        { k: 'watch', until: (S) => S.w('touched'), do: t3('Watch the ball.', 'गेंद को देखिए।', 'Ball ko dekhiye.'), see: t3('The ball lights up green: the claw touches it. The elbow has no signal yet, so it stays bent at 90°.', 'गेंद हरी हो जाती है: पंजा उसे छूता है। कोहनी को अभी सिग्नल नहीं मिला, इसलिए वह 90° पर मुड़ी रहती है।', 'Ball green ho jaati hai: claw use chhoota hai. Elbow ko abhi signal nahi mila, isliye woh 90° par mudi rehti hai.') },
      ],
      check: [...supplyChecks, ...servoChecks('svB'), ...servoChecks('svS')],
      done: (S) => S.w('touched') },
    // 19 ----------------------------------------------------------------------------------------------------------
    { id: 'arm3', n: 19, view: 'side', wview: 'armbench', code: ARM3, drawer: [], world: { kind: 'arm', level: 3 },
      title: t3('Robot arm 3: the elbow', 'रोबोट बाँह 3: कोहनी', 'Robot arm 3: elbow'),
      goal: t3('Three joints: base, shoulder and elbow put the claw on a point in space.', 'तीन जोड़: बेस, कंधा और कोहनी मिलकर पंजे को हवा के किसी बिंदु पर पहुँचाते हैं।', 'Teen joints: base, shoulder aur elbow milkar claw ko hawa ke kisi point par pahunchate hain.'),
      setup: armSetup(['svB', 'svS']),
      steps: [
        { k: 'info', code: [6, 11], do: t3('Read moveTo(b, s, e): one pose of the arm in three numbers. The elbow: 180° is straight on, 90° is a right angle.', 'moveTo(b, s, e) पढ़िए: तीन संख्याओं में बाँह की एक मुद्रा। कोहनी: 180° यानी सीधी, 90° यानी समकोण।', 'moveTo(b, s, e) padhiye: teen numbers mein baanh ka ek pose. Elbow: 180° matlab seedhi, 90° matlab right angle.'), see: t3('', '', '') },
        ...wireServo('svE'),
        { k: 'check', do: t3('Check your circuit.', 'अपना सर्किट जाँचिए।', 'Apna circuit check karo.'), see: t3('', '', '') },
        { k: 'run', do: t3('Press Run.', '"चलाइए" दबाइए।', 'Run dabaiye.'), see: t3('', '', '') },
        { k: 'watch', until: (S) => S.servoMin('svE') < 95 && S.servoMax('svS') > 85, do: t3('Watch the two poses.', 'दोनों मुद्राएँ देखिए।', 'Dono poses dekhiye.'), see: t3('Home, then towards the ball: but the claw stops short of it.', 'पहले घर, फिर गेंद की ओर: पर पंजा उससे पहले रुक जाता है।', 'Pehle home, phir ball ki taraf: par claw usse pehle ruk jaata hai.') },
        { k: 'edit', test: (src) => /moveTo\(\s*100\s*,\s*70\s*,\s*1(1[5-9]|2[0-5])\s*\)/.test(src), set: [[/moveTo\(100, 70, 90\)/, 'moveTo(100, 70, 120)']],
          do: t3('Straighten the elbow: change moveTo(100, 70, 90) to moveTo(100, 70, 120), then Run.', 'कोहनी सीधी कीजिए: moveTo(100, 70, 90) को moveTo(100, 70, 120) कीजिए, फिर "चलाइए"।', 'Elbow seedhi karo: moveTo(100, 70, 90) ko moveTo(100, 70, 120) karo, phir Run.'), see: t3('', '', '') },
        { k: 'watch', until: (S) => S.w('touched'), do: t3('Watch the ball.', 'गेंद को देखिए।', 'Ball ko dekhiye.'), see: t3('Touched! Base, shoulder and elbow: three numbers fix the point (x, y, z). That is inverse kinematics, done by hand.', 'छू लिया! बेस, कंधा और कोहनी: तीन संख्याएँ बिंदु (x, y, z) तय करती हैं। यही हाथ से की गई "इनवर्स काइनेमैटिक्स" है।', 'Chhoo liya! Base, shoulder aur elbow: teen numbers point (x, y, z) tay karte hain. Yahi haath se ki gayi inverse kinematics hai.') },
      ],
      check: [...supplyChecks, ...servoChecks('svB'), ...servoChecks('svS'), ...servoChecks('svE')],
      done: (S) => S.w('touched') },
    // 20 ----------------------------------------------------------------------------------------------------------
    { id: 'arm4', n: 20, view: 'side', wview: 'armbench', code: ARM4, drawer: [], world: { kind: 'arm', level: 4 },
      title: t3('Robot arm 4: pick and place', 'रोबोट बाँह 4: उठाओ और रखो', 'Robot arm 4: uthao aur rakho'),
      goal: t3('Add the claw and move a real wooden block from A to B with a list of poses.', 'पंजा जोड़िए और मुद्राओं की एक सूची से लकड़ी के ब्लॉक को A से B तक ले जाइए।', 'Claw jodiye aur poses ki ek list se lakdi ke block ko A se B tak le jaiye.'),
      setup: armSetup(['svB', 'svS', 'svE']),
      steps: [
        { k: 'info', do: t3('The claw is worked by a small SG90: 30° opens it wide (44 mm), 95° shuts it. The block is 25 mm wide.', 'पंजे को एक छोटा SG90 चलाता है: 30° पर पूरा खुलता है (44 mm), 95° पर बंद। ब्लॉक 25 mm चौड़ा है।', 'Claw ko ek chhota SG90 chalata hai: 30° par poora khulta hai (44 mm), 95° par band. Block 25 mm chauda hai.'), see: t3('', '', '') },
        ...wireServo('svG'),
        { k: 'check', do: t3('Check your circuit.', 'अपना सर्किट जाँचिए।', 'Apna circuit check karo.'), see: t3('', '', '') },
        { k: 'run', do: t3('Press Run.', '"चलाइए" दबाइए।', 'Run dabaiye.'), see: t3('', '', '') },
        { k: 'watch', until: (S) => S.w('grabbed'), do: t3('Watch the claw at A.', 'A पर पंजे को देखिए।', 'A par claw ko dekhiye.'), see: t3('The claw closes on the block: the servo wants 90° but stops at about 58°, where the block is. It keeps pushing: that is the grip.', 'पंजा ब्लॉक पर बंद होता है: सर्वो 90° तक जाना चाहता है पर लगभग 58° पर रुक जाता है, जहाँ ब्लॉक है। वह धकेलता रहता है: यही पकड़ है।', 'Claw block par band hota hai: servo 90° tak jaana chahta hai par lagbhag 58° par ruk jaata hai, jahan block hai. Woh dhakelta rehta hai: yahi pakad hai.') },
        { k: 'watch', until: (S) => S.w('released'), do: t3('Watch where it puts the block down.', 'देखिए यह ब्लॉक को कहाँ रखती है।', 'Dekhiye yeh block ko kahan rakhti hai.'), see: t3('In front of the arm (90°), not at B. B is at 40°.', 'बाँह के सामने (90°), B पर नहीं। B 40° पर है।', 'Baanh ke saamne (90°), B par nahi. B 40° par hai.') },
        { k: 'edit', test: (src) => /moveTo\(\s*40\s*,\s*80\s*,\s*90\s*\)/.test(src) && /moveTo\(\s*40\s*,\s*45\s*,\s*66\s*\)/.test(src), set: [[/moveTo\(90, 80, 90\)/, 'moveTo(40, 80, 90)'], [/moveTo\(90, 45, 66\)/, 'moveTo(40, 45, 66)']],
          do: t3('Change the two poses "towards B" and "down" from base 90 to base 40, then Run.', '"B की ओर" और "नीचे" वाली दोनों मुद्राओं में बेस 90 को 40 कीजिए, फिर "चलाइए"।', '"B ki taraf" aur "neeche" wale dono poses mein base 90 ko 40 karo, phir Run.'), see: t3('', '', '') },
        { k: 'watch', until: (S) => S.w('placed'), do: t3('Watch the whole job.', 'पूरा काम देखिए।', 'Poora kaam dekhiye.'), see: t3('Picked at A, placed at B. Factory arms work exactly like this: a list of poses, played again and again.', 'A से उठाया, B पर रखा। फ़ैक्टरी की बाँहें बिल्कुल ऐसे ही काम करती हैं: मुद्राओं की एक सूची, बार-बार।', 'A se uthaya, B par rakha. Factory ki baanhein bilkul aise hi kaam karti hain: poses ki ek list, baar-baar.') },
      ],
      check: [...supplyChecks, ...['svB', 'svS', 'svE', 'svG'].flatMap(servoChecks)],
      done: (S) => S.w('placed') },
    // 21 ----------------------------------------------------------------------------------------------------------
    { id: 'arm5', n: 21, view: 'side', wview: 'armbench', rview: 'armjs', /* (the joystick, left of the board, stays in view while it drives the arm) */ code: ARM5, drawer: ['joystick'], serial: true, world: { kind: 'arm', level: 5 },
      title: t3('Robot arm 5: joystick control', 'रोबोट बाँह 5: जॉयस्टिक से', 'Robot arm 5: joystick se control'),
      goal: t3('Drive the arm by hand: a joystick (two knobs in one) moves the base and the shoulder; its button works the claw.', 'बाँह को हाथ से चलाइए: एक जॉयस्टिक (एक में दो नॉब) बेस और कंधे को चलाता है; इसका बटन पंजे को।', 'Baanh ko haath se chalaiye: ek joystick (ek mein do knob) base aur shoulder ko chalata hai; iska button claw ko.'),
      setup: armSetup(['svB', 'svS', 'svE', 'svG']),
      steps: [
        { k: 'place', place: F('js', 'joystick', {}, -165, 100, 2), do: t3('Put the joystick on the mat at the ghost, left of the board.', 'जॉयस्टिक को मैट पर, बोर्ड के बाईं ओर नीली आकृति पर रखिए।', 'Joystick ko mat par, board ke left neeli shape par rakhiye.'), see: t3('Inside: two 10 kΩ knobs at right angles, and a push switch.', 'अंदर: आपस में समकोण पर दो 10 kΩ नॉब, और एक पुश स्विच।', 'Andar: aapas mein right angle par do 10 kΩ knob, aur ek push switch.') },
        { k: 'wire', wire: ['js.GND', 'GND2'], do: t3('Wire its GND to a GND pin of the Arduino.', 'इसका GND, Arduino के किसी GND पिन से जोड़िए।', 'Iska GND, Arduino ke kisi GND pin se jodiye.'), see: t3('', '', '') },
        { k: 'wire', wire: ['js.V5', '5V'], do: t3('Its +5V to the Arduino\'s 5V (a joystick needs very little current).', 'इसका +5V, Arduino के 5V से (जॉयस्टिक को बहुत कम करंट चाहिए)।', 'Iska +5V, Arduino ke 5V se (joystick ko bahut kam current chahiye).'), see: t3('', '', '') },
        { k: 'wire', wire: ['js.VRX', 'A0'], do: t3('VRx to A0.', 'VRx को A0 से।', 'VRx ko A0 se.'), see: t3('', '', '') },
        { k: 'wire', wire: ['js.VRY', 'A1'], do: t3('VRy to A1.', 'VRy को A1 से।', 'VRy ko A1 se.'), see: t3('', '', '') },
        { k: 'wire', wire: ['js.SW', 'D2'], do: t3('SW to pin 2.', 'SW को पिन 2 से।', 'SW ko pin 2 se.'), see: t3('', '', '') },
        { k: 'check', do: t3('Check your circuit.', 'अपना सर्किट जाँचिए।', 'Apna circuit check karo.'), see: t3('', '', '') },
        { k: 'run', do: t3('Press Run.', '"चलाइए" दबाइए।', 'Run dabaiye.'), see: t3('In the middle the stick reads about 512 on both: nothing moves.', 'बीच में स्टिक दोनों पर लगभग 512 पढ़ती है: कुछ नहीं हिलता।', 'Beech mein stick dono par lagbhag 512 padhti hai: kuch nahi hilta.') },
        { k: 'act', until: (S) => S.servoRange('svB') > 80, do: t3('Drag the joystick\'s black cap to the left or right and hold it there.', 'जॉयस्टिक की काली टोपी को बाएँ या दाएँ खींचकर वहीं रोके रखिए।', 'Joystick ki kaali topi ko left ya right kheench kar wahin roke rakhiye.'), see: t3('While it is held, b changes by 2 every 20 ms: the base turns at 100° a second.', 'जब तक पकड़े रहें, b हर 20 ms में 2 बदलता है: बेस एक सेकंड में 100° घूमता है।', 'Jab tak pakde rahein, b har 20 ms mein 2 badalta hai: base ek second mein 100° ghoomta hai.') },
        { k: 'act', until: (S) => S.servoRange('svS') > 50, do: t3('Now push the stick up or down and hold it.', 'अब स्टिक को ऊपर या नीचे करके रोके रखिए।', 'Ab stick ko upar ya neeche karke roke rakhiye.'), see: t3('The shoulder lifts and lowers the arm. Let go and the stick springs back to the middle: the arm stays where it is.', 'कंधा बाँह को उठाता और नीचे करता है। छोड़ते ही स्टिक बीच में लौट आती है: बाँह वहीं रुकी रहती है।', 'Shoulder baanh ko uthata aur neeche karta hai. Chhodte hi stick beech mein laut aati hai: baanh wahin ruki rehti hai.') },
      ],
      check: [...supplyChecks, has('js', t3('joystick', 'जॉयस्टिक', 'joystick')), need('js.V5', '5V', W.to5v, { x: '+5V' }), need('js.GND', 'GND', W.toGnd, { x: 'GND' }),
        need('js.VRX', 'A0', W.join, { a: 'VRx', b: 'A0' }), need('js.VRY', 'A1', W.join, { a: 'VRy', b: 'A1' }), need('js.SW', 'D2', W.toPin, { x: 'SW', p: 2 })],
      done: (S) => S.servoRange('svB') > 80 && S.servoRange('svS') > 50 },
    // 22 ----------------------------------------------------------------------------------------------------------
    { id: 'linecar', n: 22, view: 'carbench', wview: 'carbench', rview: 'arena', code: LINE, drawer: ['ir'], world: { kind: 'car', car: 'line' },
      title: t3('Line-follower car', 'लाइन फ़ॉलोअर कार', 'Line follower car'),
      goal: t3('Two IR sensors watch the floor and the car follows a black tape round a real track. Tune its speed and its turns.', 'दो IR सेंसर ज़मीन देखते हैं और कार असली ट्रैक पर काली टेप के पीछे चलती है। इसकी रफ़्तार और मोड़ ठीक कीजिए।', 'Do IR sensor zameen dekhte hain aur car asli track par kaali tape ke peeche chalti hai. Iski speed aur turns tune kijiye.'),
      setup: { parts: CARPARTS, wires: CARWIRES },
      steps: [
        { k: 'info', do: t3('The car is on the track (the 🏁 Robot view). Its driver, battery and motors are also here on the bench, its test stand: the battery is on 12V and GND, the motors on OUT1–OUT4, and ENA, ENB, IN1–IN4 on pins 5, 6, 7, 8, 2, 4.', 'कार ट्रैक पर है (🏁 रोबोट व्यू)। इसका ड्राइवर, बैटरी और मोटरें यहाँ बेंच पर भी हैं, इसके टेस्ट स्टैंड पर: बैटरी 12V और GND पर, मोटरें OUT1–OUT4 पर, और ENA, ENB, IN1–IN4 पिन 5, 6, 7, 8, 2, 4 पर।', 'Car track par hai (🏁 Robot view). Iska driver, battery aur motors yahan bench par bhi hain, iske test stand par: battery 12V aur GND par, motors OUT1–OUT4 par, aur ENA, ENB, IN1–IN4 pin 5, 6, 7, 8, 2, 4 par.'),
          see: t3('IN1 HIGH and IN2 LOW: the left wheel goes forward; swap them and it goes back. ENA\'s PWM sets how fast.', 'IN1 HIGH और IN2 LOW: बायाँ पहिया आगे; उल्टा करें तो पीछे। ENA का PWM रफ़्तार तय करता है।', 'IN1 HIGH aur IN2 LOW: left wheel aage; ulta karein to peeche. ENA ka PWM speed tay karta hai.') },
        { k: 'wire', wire: ['drv.GND', 'GND1'], do: t3('One wire is missing: join the L298N\'s GND terminal to a GND pin of the Arduino.', 'एक वायर बाकी है: L298N के GND टर्मिनल को Arduino के किसी GND पिन से जोड़िए।', 'Ek wire baaki hai: L298N ke GND terminal ko Arduino ke kisi GND pin se jodiye.'),
          see: t3('Common ground. Without it the driver cannot tell HIGH from LOW, and the car will not move.', 'कॉमन ग्राउंड। इसके बिना ड्राइवर HIGH और LOW में फ़र्क़ नहीं कर पाता, और कार नहीं चलेगी।', 'Common ground. Iske bina driver HIGH aur LOW mein farq nahi kar paata, aur car nahi chalegi.') },
        { k: 'place', place: F('irL', 'ir', {}, 140, 62, 2), do: t3('Put an IR sensor at the left ghost: it is the car\'s left sensor.', 'एक IR सेंसर बाईं नीली आकृति पर रखिए: यह कार का बायाँ सेंसर है।', 'Ek IR sensor left neeli shape par rakhiye: yeh car ka left sensor hai.'), see: t3('On the car it looks down at the floor, 17 mm left of the middle.', 'कार पर यह नीचे ज़मीन को देखता है, बीच से 17 mm बाएँ।', 'Car par yeh neeche zameen ko dekhta hai, beech se 17 mm left.') },
        { k: 'place', place: F('irR', 'ir', {}, 178, 62, 2), do: t3('Put the second IR sensor at the right ghost.', 'दूसरा IR सेंसर दाईं नीली आकृति पर रखिए।', 'Doosra IR sensor right neeli shape par rakhiye.'), see: t3('', '', '') },
        ...irUnit('irL', 11, t3('left', 'बाएँ', 'left')),
        ...irUnit('irR', 12, t3('right', 'दाएँ', 'right')),
        { k: 'check', do: t3('Check your circuit.', 'अपना सर्किट जाँचिए।', 'Apna circuit check karo.'), see: t3('', '', '') },
        { k: 'run', do: t3('Press Run.', '"चलाइए" दबाइए।', 'Run dabaiye.'), see: t3('Run puts the car at START.', '"चलाइए" कार को START पर रखता है।', 'Run car ko START par rakhta hai.') },
        { k: 'watch', until: (S) => fresh(S) && S.w('lap'), do: t3('Watch the car and the sensor lights.', 'कार और सेंसरों की बत्तियों को देखिए।', 'Car aur sensors ki lights ko dekhiye.'),
          see: t3('When the tape slides under the left sensor, the left wheel stops and the car turns back onto the line. One lap!', 'जब टेप बाएँ सेंसर के नीचे आती है, बायाँ पहिया रुकता है और कार मुड़कर लाइन पर लौट आती है। एक चक्कर पूरा!', 'Jab tape left sensor ke neeche aati hai, left wheel rukta hai aur car mud kar line par laut aati hai. Ek chakkar poora!') },
        { k: 'edit', test: (src) => /int\s+speed\s*=\s*(2[0-5]\d)\s*;/.test(src), set: [[/int speed = 110;/, 'int speed = 220;']],
          do: t3('Make it faster: change speed = 110 to speed = 220 and press Run.', 'इसे तेज़ कीजिए: speed = 110 को speed = 220 कीजिए और "चलाइए" दबाइए।', 'Ise tez kijiye: speed = 110 ko speed = 220 karo aur Run dabaiye.'), see: t3('', '', '') },
        { k: 'watch', until: (S) => fresh(S) && (S.w('lost') || S.w('lap')), do: t3('Watch the S-bend.', 'S-मोड़ को देखिए।', 'S-mod ko dekhiye.'), see: t3('Too fast: the car is past the tape before the slow wheel can turn it, and it runs off the line.', 'बहुत तेज़: धीमा पहिया मोड़ पाए, उससे पहले कार टेप से आगे निकल जाती है और लाइन छूट जाती है।', 'Bahut tez: dheema wheel mod paaye, usse pehle car tape se aage nikal jaati hai aur line chhoot jaati hai.') },
        { k: 'edit', test: (src) => /int\s+turn\s*=\s*-\s*(speed\s*\/\s*2|[6-9]\d|1[0-3]\d)\s*;/.test(src) && /int\s+speed\s*=\s*(1[6-9]\d|2[0-5]\d)\s*;/.test(src), set: [[/int turn = 0;/, 'int turn = -speed / 2;']],
          do: t3('Turn harder: let the inside wheel go backwards at half speed. Change turn = 0 to turn = -speed / 2 and press Run.', 'तेज़ मोड़िए: अंदर वाला पहिया आधी रफ़्तार से पीछे चले। turn = 0 को turn = -speed / 2 कीजिए और "चलाइए" दबाइए।', 'Tez modiye: andar wala wheel aadhi speed se peeche chale. turn = 0 ko turn = -speed / 2 karo aur Run dabaiye.'), see: t3('', '', '') },
        { k: 'watch', until: (S) => fresh(S) && S.w('lap') && !S.w('lost'), do: t3('Watch a full lap at speed 220, and its lap time.', 'speed 220 पर एक पूरा चक्कर और उसका समय देखिए।', 'Speed 220 par ek poora chakkar aur uska time dekhiye.'),
          see: t3('It holds the line at the bends now. Yet the lap is not twice as fast: every sharp turn costs time. Try speed 150 with turn 0 too: the best lap often comes from a middle speed. Racing line followers add more sensors and PID control.', 'अब यह मोड़ों पर भी लाइन पकड़े रहती है। फिर भी चक्कर दोगुना तेज़ नहीं: हर तीखा मोड़ समय लेता है। speed 150 और turn 0 भी आज़माइए: सबसे अच्छा चक्कर अक्सर बीच की रफ़्तार पर आता है। रेस वाली लाइन फ़ॉलोअर में ज़्यादा सेंसर और PID कंट्रोल होता है।', 'Ab yeh modon par bhi line pakde rehti hai. Phir bhi chakkar doguna tez nahi: har teekha mod time leta hai. Speed 150 aur turn 0 bhi try kijiye: sabse achha chakkar aksar beech ki speed par aata hai. Race wali line followers mein zyada sensors aur PID control hota hai.') },
      ],
      check: [...driveChecks, has('irL', N.ir), has('irR', N.ir), ...['irL', 'irR'].flatMap((k, i) => [need(k + '.VCC', '5V', W.to5v, { x: 'VCC' }), need(k + '.GND', 'GND', W.toGnd, { x: 'GND' }), need(k + '.OUT', 'D' + (11 + i), W.toPin, { x: 'OUT', p: 11 + i })])],
      done: (S) => S.w('lap') && !S.w('lost') && /turn\s*=\s*-/.test(S.runSrc || '') },
    // 23 ----------------------------------------------------------------------------------------------------------
    { id: 'avoidcar', n: 23, view: 'carbench', wview: 'carbench', rview: 'arena', code: AVOID, drawer: ['hcsr04', 'servo'], serial: true, world: { kind: 'car', car: 'avoid' },
      title: t3('Obstacle-avoiding car', 'बाधा से बचने वाली कार', 'Obstacle avoiding car'),
      goal: t3('An ultrasonic sensor on a servo looks ahead, then left and right, and the car turns away from walls and boxes in a room.', 'सर्वो पर लगा अल्ट्रासोनिक सेंसर आगे, फिर बाएँ और दाएँ देखता है, और कार कमरे की दीवारों और डिब्बों से मुड़कर बचती है।', 'Servo par laga ultrasonic sensor aage, phir left aur right dekhta hai, aur car kamre ki deewaron aur dabbon se mud kar bachti hai.'),
      setup: { parts: CARPARTS, wires: [...CARWIRES, ['T:drv:GND', 'GND1']] },
      steps: [
        { k: 'info', do: t3('The car (🏁 Robot view) is in a small room with boxes. Its drive is wired on the bench as in the line follower. Add its eyes: an HC-SR04 that a servo turns.', 'कार (🏁 रोबोट व्यू) डिब्बों वाले एक छोटे कमरे में है। इसकी ड्राइव बेंच पर लाइन फ़ॉलोअर की तरह जुड़ी है। इसकी आँखें जोड़िए: एक HC-SR04, जिसे सर्वो घुमाता है।', 'Car (🏁 Robot view) dabbon wale ek chhote kamre mein hai. Iski drive bench par line follower ki tarah judi hai. Iski aankhein jodiye: ek HC-SR04, jise servo ghumata hai.'), see: t3('', '', '') },
        { k: 'place', place: P('us1', 'hcsr04', {}, 'j50', 0), do: t3('Plug the ultrasonic sensor into 50j–53j.', 'अल्ट्रासोनिक सेंसर को 50j–53j में लगाइए।', 'Ultrasonic sensor ko 50j–53j mein lagaiye.'), see: t3('', '', '') },
        { k: 'wire', wire: ['us1.VCC', 'rail:tp'], do: t3('VCC (column 50) to the + rail.', 'VCC (कॉलम 50) को + रेल से।', 'VCC (column 50) ko + rail se.'), see: t3('', '', '') },
        { k: 'wire', wire: ['us1.TRIG', 'D9'], do: t3('Trig (column 51) to pin 9.', 'Trig (कॉलम 51) को पिन 9 से।', 'Trig (column 51) ko pin 9 se.'), see: t3('', '', '') },
        { k: 'wire', wire: ['us1.ECHO', 'D10'], do: t3('Echo (column 52) to pin 10.', 'Echo (कॉलम 52) को पिन 10 से।', 'Echo (column 52) ko pin 10 se.'), see: t3('', '', '') },
        { k: 'wire', wire: ['us1.GND', 'rail:tn'], do: t3('GND (column 53) to the − rail.', 'GND (कॉलम 53) को − रेल से।', 'GND (column 53) ko − rail se.'), see: t3('', '', '') },
        { k: 'place', place: F('sv1', 'servo', {}, 150, 100, 2), do: t3('Put the servo on the mat at the ghost: on the car it turns the sensor.', 'सर्वो को मैट पर नीली आकृति पर रखिए: कार पर यह सेंसर को घुमाता है।', 'Servo ko mat par neeli shape par rakhiye: car par yeh sensor ko ghumata hai.'), see: t3('', '', '') },
        { k: 'wire', wire: ['sv1.GND', 'rail:tn'], do: t3('Its brown wire to the − rail.', 'इसका भूरा तार − रेल से।', 'Iska brown wire − rail se.'), see: t3('', '', '') },
        { k: 'wire', wire: ['sv1.VP', 'rail:tp'], do: t3('Its red wire to the + rail.', 'इसका लाल तार + रेल से।', 'Iska red wire + rail se.'), see: t3('', '', '') },
        { k: 'wire', wire: ['sv1.SIG', 'D3'], do: t3('Its orange wire to pin 3.', 'इसका नारंगी तार पिन 3 से।', 'Iska orange wire pin 3 se.'), see: t3('', '', '') },
        { k: 'check', do: t3('Check your circuit.', 'अपना सर्किट जाँचिए।', 'Apna circuit check karo.'), see: t3('', '', '') },
        { k: 'run', do: t3('Press Run.', '"चलाइए" दबाइए।', 'Run dabaiye.'), see: t3('', '', '') },
        { k: 'watch', until: (S) => fresh(S) && S.w('explored'), do: t3('Watch the car explore the room, and "Ahead" in its panel.', 'कार को कमरा घूमते देखिए, और इसके पैनल में "सामने" देखिए।', 'Car ko kamra ghoomte dekhiye, aur iske panel mein "Saamne" dekhiye.'),
          see: t3('Under 30 cm it stops, looks left (170°) and right (10°), backs off a little, and spins towards the side with more room.', '30 cm से कम पर यह रुकती है, बाएँ (170°) और दाएँ (10°) देखती है, थोड़ा पीछे हटती है, और ज़्यादा जगह वाली तरफ़ घूम जाती है।', '30 cm se kam par yeh rukti hai, left (170°) aur right (10°) dekhti hai, thoda peeche hatti hai, aur zyada jagah wali taraf ghoom jaati hai.') },
        { k: 'edit', test: (src) => /int\s+safe\s*=\s*[1-4]\s*;/.test(src), set: [[/int safe = 30;/, 'int safe = 3;']],
          do: t3('What if it looks too late? Change safe = 30 to safe = 3 and press Run.', 'अगर यह बहुत देर से देखे तो? safe = 30 को safe = 3 कीजिए और "चलाइए" दबाइए।', 'Agar yeh bahut der se dekhe to? safe = 30 ko safe = 3 karo aur Run dabaiye.'), see: t3('', '', '') },
        { k: 'watch', until: (S) => fresh(S) && S.w('bump'), do: t3('Watch the first wall.', 'पहली दीवार को देखिए।', 'Pehli deewar ko dekhiye.'), see: t3('Bump! The sensor sits 2 cm behind the bumper, the car moves 1–2 cm while the code measures, and the wide beam sees a wall at a slant late: 3 cm is too close.', 'टक्कर! सेंसर बंपर से 2 cm पीछे है, कोड के नापते-नापते कार 1–2 cm चल लेती है, और तिरछी दीवार चौड़ी किरण को देर से दिखती है: 3 cm बहुत पास है।', 'Takkar! Sensor bumper se 2 cm peeche hai, code ke naapte-naapte car 1–2 cm chal leti hai, aur tirchhi deewar chaudi beam ko der se dikhti hai: 3 cm bahut paas hai.') },
        { k: 'edit', test: (src) => /int\s+safe\s*=\s*(2\d|3\d|40)\s*;/.test(src), set: [[/int safe = 3;/, 'int safe = 25;']],
          do: t3('Choose a safe distance again: safe = 25, and Run.', 'फिर से सुरक्षित दूरी चुनिए: safe = 25, और "चलाइए"।', 'Phir se safe doori chuniye: safe = 25, aur Run.'), see: t3('', '', '') },
        { k: 'watch', until: (S) => fresh(S) && S.w('explored') && S.wv('exploredBumps') === 0, do: t3('Watch it drive round without a bump.', 'इसे बिना टक्कर घूमते देखिए।', 'Ise bina takkar ghoomte dekhiye.'), see: t3('Robot vacuum cleaners and warehouse robots use the same idea, with more sensors.', 'रोबोट वैक्यूम क्लीनर और गोदाम के रोबोट यही तरीक़ा अपनाते हैं, बस ज़्यादा सेंसरों के साथ।', 'Robot vacuum cleaner aur godaam ke robots yahi tareeka apnaate hain, bas zyada sensors ke saath.') },
      ],
      check: [...driveChecks, (S) => (S.conn('rail:tn', 'GND') ? null : [W.gndRail]), has('us1', N.us), need('us1.VCC', '5V', W.to5v, { x: 'VCC' }), need('us1.GND', 'GND', W.toGnd, { x: 'GND' }), need('us1.TRIG', 'D9', W.toPin, { x: 'Trig', p: 9 }), need('us1.ECHO', 'D10', W.toPin, { x: 'Echo', p: 10 }),
        has('sv1', N.servo), need('sv1.GND', 'GND', W.toGnd, { x: N.servo }), need('sv1.VP', '5V', W.to5v, { x: N.servo }), need('sv1.SIG', 'D3', W.toPin, { x: N.servo, p: 3 })],
      done: (S) => S.w('explored') && S.wv('exploredBumps') === 0 },
    // 24 ----------------------------------------------------------------------------------------------------------
    { id: 'smartbin', n: 24, view: 'binside', wview: 'armbench', rview: 'binside', code: BIN, drawer: [], serial: true, world: { kind: 'bin' },
      title: t3('Smart dustbin', 'स्मार्ट कूड़ेदान', 'Smart dustbin'),
      goal: t3('A dustbin whose lid opens by itself when a hand comes near: an ultrasonic sensor watches, a servo lifts the lid.', 'ऐसा कूड़ेदान जिसका ढक्कन हाथ पास आते ही अपने-आप खुलता है: अल्ट्रासोनिक सेंसर देखता है, सर्वो ढक्कन उठाता है।', 'Aisa dustbin jiska dhakkan haath paas aate hi apne-aap khulta hai: ultrasonic sensor dekhta hai, servo dhakkan uthata hai.'),
      setup: { parts: BINPARTS, wires: [['5V', 'H:tp30'], ['GND3', 'H:tn18']] },
      steps: [
        { k: 'info', do: t3('Next to the bench stands a real kitchen dustbin. An HC-SR04 looks out of its front; an SG90 servo at the back lifts the lid. Their cables end in the two plugs on the mat. The + and − rails already come from the Arduino\'s 5V and GND.', 'बेंच के पास रसोई का एक असली कूड़ेदान है। इसके आगे से एक HC-SR04 बाहर देखता है; पीछे लगा SG90 सर्वो ढक्कन उठाता है। इनकी केबल मैट पर रखे दो प्लग में ख़त्म होती हैं। + और − रेल पहले से Arduino के 5V और GND से जुड़ी हैं।', 'Bench ke paas kitchen ka ek asli dustbin hai. Iske aage se ek HC-SR04 bahar dekhta hai; peeche laga SG90 servo dhakkan uthata hai. Inki cable mat par rakhe do plug mein khatam hoti hai. + aur − rail pehle se Arduino ke 5V aur GND se judi hain.'),
          see: t3('One small SG90 pulls about 250 mA while it moves: the USB\'s 500 mA is enough for it (four big servos were not, in the arm).', 'एक छोटा SG90 चलते समय लगभग 250 mA खींचता है: USB के 500 mA उसके लिए काफ़ी हैं (बाँह के चार बड़े सर्वो के लिए नहीं थे)।', 'Ek chhota SG90 chalte waqt lagbhag 250 mA kheenchta hai: USB ke 500 mA uske liye kaafi hain (baanh ke chaar bade servos ke liye nahi the).') },
        { k: 'wire', wire: ['us.VCC', 'rail:tp'], do: t3('Wire the sensor\'s VCC (its plug on the mat) to the + rail.', 'सेंसर का VCC (मैट पर उसका प्लग) + रेल से जोड़िए।', 'Sensor ka VCC (mat par uska plug) + rail se jodiye.'), see: t3('', '', '') },
        { k: 'wire', wire: ['us.GND', 'rail:tn'], do: t3('Its GND to the − rail.', 'इसका GND − रेल से।', 'Iska GND − rail se.'), see: t3('', '', '') },
        { k: 'wire', wire: ['us.TRIG', 'D9'], do: t3('Trig to pin 9.', 'Trig को पिन 9 से।', 'Trig ko pin 9 se.'), see: t3('', '', '') },
        { k: 'wire', wire: ['us.ECHO', 'D10'], do: t3('Echo to pin 10.', 'Echo को पिन 10 से।', 'Echo ko pin 10 se.'), see: t3('', '', '') },
        { k: 'wire', wire: ['sv.GND', 'rail:tn'], do: t3('Now the lid\'s servo: its brown wire to the − rail.', 'अब ढक्कन का सर्वो: इसका भूरा तार − रेल से।', 'Ab dhakkan ka servo: iska brown wire − rail se.'), see: t3('', '', '') },
        { k: 'wire', wire: ['sv.VP', 'rail:tp'], do: t3('Its red wire to the + rail.', 'इसका लाल तार + रेल से।', 'Iska red wire + rail se.'), see: t3('', '', '') },
        { k: 'wire', wire: ['sv.SIG', 'D3'], do: t3('Its orange wire to pin 3.', 'इसका नारंगी तार पिन 3 से।', 'Iska orange wire pin 3 se.'), see: t3('', '', '') },
        { k: 'check', do: t3('Check your circuit.', 'अपना सर्किट जाँचिए।', 'Apna circuit check karo.'), see: t3('', '', '') },
        { k: 'run', do: t3('Press Run.', '"चलाइए" दबाइए।', 'Run dabaiye.'), see: t3('The Serial Monitor shows what the sensor hears: about 180 cm, the far wall.', 'सीरियल मॉनिटर दिखाता है कि सेंसर क्या सुनता है: लगभग 180 cm, दूर की दीवार।', 'Serial Monitor dikhata hai ki sensor kya sunta hai: lagbhag 180 cm, door ki deewar.') },
        { k: 'act', until: (S) => fresh(S) && S.w('missed'), do: t3('Press "Bring rubbish" in the dustbin\'s panel.', 'कूड़ेदान के पैनल में "कचरा लाइए" दबाइए।', 'Dustbin ke panel mein "Kachra laiye" dabaiye.'),
          see: t3('The hand stops 10 cm away, as people do, but the code opens the lid only below 5 cm. The lid stays shut and the paper bounces off. The wiring is right: the bug is a number.', 'हाथ 10 cm दूर रुकता है, जैसे लोग करते हैं, पर कोड ढक्कन सिर्फ़ 5 cm से कम पर खोलता है। ढक्कन बंद रहता है और काग़ज़ उछलकर गिर जाता है। वायरिंग सही है: ग़लती एक संख्या में है।', 'Haath 10 cm door rukta hai, jaise log karte hain, par code dhakkan sirf 5 cm se kam par kholta hai. Dhakkan band rehta hai aur kaagaz uchhal kar gir jaata hai. Wiring sahi hai: galti ek number mein hai.') },
        { k: 'edit', test: (src) => /int\s+openCm\s*=\s*(1[2-9]|[23]\d|40)\s*;/.test(src), set: [[/int openCm = 5;/, 'int openCm = 20;']],
          do: t3('Change openCm = 5 to openCm = 20 and press Run.', 'openCm = 5 को openCm = 20 कीजिए और "चलाइए" दबाइए।', 'openCm = 5 ko openCm = 20 karo aur Run dabaiye.'), see: t3('', '', '') },
        { k: 'act', until: (S) => fresh(S) && S.w('binned'), do: t3('Bring rubbish again.', 'फिर से कचरा लाइए।', 'Phir se kachra laiye.'),
          see: t3('At 20 cm the lid swings open before the hand arrives, and the paper drops in.', '20 cm पर हाथ पहुँचने से पहले ही ढक्कन खुल जाता है, और काग़ज़ अंदर गिरता है।', '20 cm par haath pahunchne se pehle hi dhakkan khul jaata hai, aur kaagaz andar girta hai.') },
        { k: 'watch', until: (S) => fresh(S) && S.w('closed'), do: t3('Watch the lid when the hand has gone.', 'हाथ जाने के बाद ढक्कन को देखिए।', 'Haath jaane ke baad dhakkan ko dekhiye.'),
          see: t3('Three seconds later it shuts by itself: delay(waitMs). Shop-bought smart bins run this same loop; some add a second sensor inside that tells when the bin is full.', 'तीन सेकंड बाद यह अपने-आप बंद हो जाता है: delay(waitMs)। बाज़ार के स्मार्ट कूड़ेदान यही लूप चलाते हैं; कुछ में अंदर एक दूसरा सेंसर होता है जो बताता है कि डिब्बा भर गया।', 'Teen second baad yeh apne-aap band ho jaata hai: delay(waitMs). Bazaar ke smart dustbin yahi loop chalate hain; kuch mein andar ek doosra sensor hota hai jo batata hai ki dabba bhar gaya.') },
      ],
      check: [noShort, (S) => (S.conn('rail:tp', '5V') ? null : [W.vRail]), (S) => (S.conn('rail:tn', 'GND') ? null : [W.gndRail]),
        need('us.VCC', '5V', W.to5v, { x: 'VCC' }), need('us.GND', 'GND', W.toGnd, { x: 'GND' }), need('us.TRIG', 'D9', W.toPin, { x: 'Trig', p: 9 }), need('us.ECHO', 'D10', W.toPin, { x: 'Echo', p: 10 }),
        need('sv.GND', 'GND', W.toGnd, { x: N.servo }), need('sv.VP', '5V', W.to5v, { x: N.servo }), need('sv.SIG', 'D3', W.toPin, { x: N.servo, p: 3 })],
      done: (S) => S.w('binned') && S.w('closed') },
    // 25 ----------------------------------------------------------------------------------------------------------
    { id: 'btcar', n: 25, view: 'carbench', wview: 'carbench', rview: 'arenabt', code: BT, drawer: ['hc05'], world: { kind: 'car', car: 'bt' },
      title: t3('Bluetooth car', 'ब्लूटूथ कार', 'Bluetooth car'),
      goal: t3('Drive the car from a phone: the app sends a letter for each button, an HC-05 radio hands it to the Arduino. Park it in the box.', 'फ़ोन से कार चलाइए: ऐप हर बटन के लिए एक अक्षर भेजता है, HC-05 रेडियो उसे Arduino तक पहुँचाता है। इसे बॉक्स में पार्क कीजिए।', 'Phone se car chalaiye: app har button ke liye ek letter bhejta hai, HC-05 radio use Arduino tak pahunchata hai. Ise box mein park kijiye.'),
      setup: { parts: CARPARTS, wires: [...CARWIRES, ['T:drv:GND', 'GND1']] },
      steps: [
        { k: 'info', do: t3('The car (🏁 Robot view) waits in a yard with two boxes and a parking space P. Its drive is wired on the bench as before. Give it ears: an HC-05 Bluetooth module.', 'कार (🏁 रोबोट व्यू) दो डिब्बों और एक पार्किंग जगह P वाले आँगन में खड़ी है। इसकी ड्राइव बेंच पर पहले की तरह जुड़ी है। इसे कान दीजिए: एक HC-05 ब्लूटूथ मॉड्यूल।', 'Car (🏁 Robot view) do dabbon aur ek parking jagah P wale aangan mein khadi hai. Iski drive bench par pehle ki tarah judi hai. Ise kaan dijiye: ek HC-05 Bluetooth module.'),
          see: t3('The phone talks Bluetooth; the HC-05 turns it into Serial letters at 9600 baud, just like the USB cable does.', 'फ़ोन ब्लूटूथ में बात करता है; HC-05 उसे 9600 बॉड पर सीरियल अक्षरों में बदलता है, जैसे USB केबल करती है।', 'Phone Bluetooth mein baat karta hai; HC-05 use 9600 baud par Serial letters mein badalta hai, jaise USB cable karti hai.') },
        { k: 'place', place: P('bt', 'hc05', {}, 'j40', 0), do: t3('Plug the HC-05 into 40j–45j.', 'HC-05 को 40j–45j में लगाइए।', 'HC-05 ko 40j–45j mein lagaiye.'), see: t3('Its pins, left to right: EN, VCC, GND, TXD, RXD, STATE.', 'इसके पिन, बाएँ से दाएँ: EN, VCC, GND, TXD, RXD, STATE।', 'Iske pin, left se right: EN, VCC, GND, TXD, RXD, STATE.') },
        { k: 'wire', wire: ['bt.VCC', 'rail:tp'], do: t3('VCC (column 41) to the + rail.', 'VCC (कॉलम 41) को + रेल से।', 'VCC (column 41) ko + rail se.'), see: t3('', '', '') },
        { k: 'wire', wire: ['bt.GND', 'rail:tn'], do: t3('GND (column 42) to the − rail.', 'GND (कॉलम 42) को − रेल से।', 'GND (column 42) ko − rail se.'), see: t3('', '', '') },
        { k: 'wire', wire: ['bt.TXD', 'D0'], do: t3('TXD (column 43) to pin 0, the Arduino\'s RX.', 'TXD (कॉलम 43) को पिन 0, Arduino के RX से।', 'TXD (column 43) ko pin 0, Arduino ke RX se.'),
          see: t3('Sender to listener: TX → RX. On a real Uno, take this wire off while you upload: pin 0 is also the USB\'s line. RXD stays free: the car only listens.', 'भेजने वाला सुनने वाले तक: TX → RX। असली Uno पर अपलोड करते समय यह तार हटा लीजिए: पिन 0, USB की लाइन भी है। RXD खाली रहता है: कार सिर्फ़ सुनती है।', 'Bhejne wala sunne wale tak: TX → RX. Asli Uno par upload karte waqt yeh wire hata lijiye: pin 0, USB ki line bhi hai. RXD khaali rehta hai: car sirf sunti hai.') },
        { k: 'check', do: t3('Check your circuit.', 'अपना सर्किट जाँचिए।', 'Apna circuit check karo.'), see: t3('', '', '') },
        { k: 'run', do: t3('Press Run.', '"चलाइए" दबाइए।', 'Run dabaiye.'), see: t3('The HC-05\'s red LED blinks fast: it is waiting for a phone.', 'HC-05 की लाल LED तेज़ी से झपकती है: यह फ़ोन का इंतज़ार कर रहा है।', 'HC-05 ki laal LED tezi se jhapakti hai: yeh phone ka intezaar kar raha hai.') },
        { k: 'act', until: (S) => { const b = S.part('bt'); return !!(b && b.state.paired); }, do: t3('In the phone app (the car\'s panel), press "Connect HC-05".', 'फ़ोन ऐप (कार का पैनल) में "HC-05 से जोड़िए" दबाइए।', 'Phone app (car ka panel) mein "HC-05 se jodiye" dabaiye.'),
          see: t3('Paired (PIN 1234). The LED now blinks slowly, and STATE goes HIGH.', 'जुड़ गया (PIN 1234)। अब LED धीरे झपकती है, और STATE HIGH हो जाता है।', 'Jud gaya (PIN 1234). Ab LED dheere jhapakti hai, aur STATE HIGH ho jaata hai.') },
        { k: 'act', until: (S) => S.w('fwd') && (S.w('left') || S.w('right')), do: t3('Hold ▲ (or the ↑ key) to drive, let go to stop. Then hold ◀ or ▶.', '▲ (या ↑ कुंजी) दबाए रखिए तो कार चलती है, छोड़िए तो रुकती है। फिर ◀ या ▶ दबाए रखिए।', '▲ (ya ↑ key) dabaye rakhiye to car chalti hai, chhodiye to rukti hai. Phir ◀ ya ▶ dabaye rakhiye.'),
          see: t3('Each button sends one letter (F, B, L, R) and letting go sends S. Serial.read() takes the letter and the sketch sets both motors.', 'हर बटन एक अक्षर भेजता है (F, B, L, R) और छोड़ने पर S जाता है। Serial.read() अक्षर लेता है और स्केच दोनों मोटरें सेट करता है।', 'Har button ek letter bhejta hai (F, B, L, R) aur chhodne par S jaata hai. Serial.read() letter leta hai aur sketch dono motors set karta hai.') },
        { k: 'edit', test: (src) => /int\s+speed\s*=\s*([6-9]\d|1[0-4]\d|150)\s*;/.test(src), set: [[/int speed = 200;/, 'int speed = 120;']],
          do: t3('At 200 the car is hard to stop inside P. Change speed = 200 to speed = 120 and press Run.', '200 पर कार को P के अंदर रोकना मुश्किल है। speed = 200 को speed = 120 कीजिए और "चलाइए" दबाइए।', '200 par car ko P ke andar rokna mushkil hai. speed = 200 ko speed = 120 karo aur Run dabaiye.'), see: t3('', '', '') },
        { k: 'act', until: (S) => S.w('parked'), do: t3('Drive into the box P and stop inside it.', 'बॉक्स P में गाड़ी ले जाइए और उसके अंदर रोकिए।', 'Box P mein gaadi le jaiye aur uske andar rokiye.'),
          see: t3('Parked! Slow is easier to steer: real remote-control cars have a slow gear for this. You could add letters of your own, like H for a horn.', 'पार्क हो गई! धीमी कार को चलाना आसान है: असली रिमोट कारों में इसी के लिए धीमा गियर होता है। आप अपने अक्षर भी जोड़ सकते हैं, जैसे हॉर्न के लिए H।', 'Park ho gayi! Dheemi car ko chalana aasaan hai: asli remote cars mein isi ke liye dheema gear hota hai. Aap apne letters bhi jod sakte hain, jaise horn ke liye H.') },
      ],
      check: [...driveChecks, (S) => (S.conn('rail:tn', 'GND') ? null : [W.gndRail]), has('bt', X.bt), need('bt.VCC', '5V', W.to5v, { x: 'VCC' }), need('bt.GND', 'GND', W.toGnd, { x: 'GND' }),
        (S) => (S.conn('bt.TXD', 'D1') ? [X.btCrossed] : null), need('bt.TXD', 'D0', W.toPin, { x: 'TXD', p: 0 })],
      done: (S) => S.w('parked') },
    // 26 ----------------------------------------------------------------------------------------------------------
    { id: 'hydarm', n: 26, view: 'hydside', wview: 'hydside', rview: 'hydside', code: HYD, drawer: [], serial: true, world: { kind: 'hyd' },
      title: t3('Hydraulic arm (Pascal\'s law)', 'हाइड्रॉलिक बाँह (पास्कल का नियम)', 'Hydraulic arm (Pascal ka niyam)'),
      goal: t3('Two syringes and a tube of water lift a cardboard arm with a load of coins. Measure how pressure trades force for distance.', 'दो सिरिंज और पानी भरी नली, सिक्कों से लदी गत्ते की बाँह को उठाती हैं। नापिए कि दबाव ताक़त और दूरी का सौदा कैसे करता है।', 'Do syringe aur paani bhari nali, sikkon se ladi gatte ki baanh ko uthati hain. Naapiye ki pressure taakat aur doori ka sauda kaise karta hai.'),
      setup: { parts: [], wires: [] },
      steps: [
        { k: 'info', do: t3('No motor and no battery: your hand is the motor. Pressure is force on each cm² (P = F ÷ A). Push on water shut in a tube and that pressure is the same everywhere in it: Pascal\'s law (Class 8, Force and Pressure).', 'न मोटर, न बैटरी: आपका हाथ ही मोटर है। दबाव यानी हर cm² पर बल (P = F ÷ A)। नली में बंद पानी को दबाइए तो वह दबाव उसमें हर जगह एक-सा होता है: पास्कल का नियम (कक्षा 8, बल और दबाव)।', 'Na motor, na battery: aapka haath hi motor hai. Pressure matlab har cm² par force (P = F ÷ A). Nali mein band paani ko dabaiye to woh pressure usmein har jagah ek-sa hota hai: Pascal ka niyam (Class 8, Force and Pressure).'),
          see: t3('Brakes in a car, a JCB\'s bucket and a barber\'s chair all work this way, with oil instead of water.', 'कार के ब्रेक, JCB की बाल्टी और नाई की कुर्सी सब ऐसे ही काम करते हैं, पानी की जगह तेल से।', 'Car ke brake, JCB ki baalti aur naai ki kursi sab aise hi kaam karte hain, paani ki jagah tel se.') },
        { k: 'act', until: (S) => S.w('lifted'), do: t3('Push the plunger of the syringe lying on the board: drag it, or use Push in the arm\'s panel. Lift the arm.', 'बोर्ड पर लेटी सिरिंज का प्लंजर धकेलिए: उसे खींचिए, या बाँह के पैनल में "धकेलिए" का इस्तेमाल कीजिए। बाँह उठाइए।', 'Board par leti syringe ka plunger dhakeliye: use kheenchiye, ya baanh ke panel mein "Dhakeliye" use kijiye. Baanh uthaiye.'),
          see: t3('Two 10 mL syringes: the same area at both ends, so F₂ = F₁ and the lift syringe moves as far as you push.', 'दो 10 mL सिरिंज: दोनों सिरों पर एक ही क्षेत्रफल, तो F₂ = F₁ और उठाने वाली सिरिंज उतनी ही चलती है जितना आप धकेलते हैं।', 'Do 10 mL syringe: dono siron par ek hi area, to F₂ = F₁ aur uthane wali syringe utni hi chalti hai jitna aap dhakelte hain.') },
        { k: 'act', until: (S) => S.w('smallPush'), do: t3('In the panel choose 5 mL to push and 20 mL to lift, then push again. Read F₁ and F₂.', 'पैनल में धकेलने के लिए 5 mL और उठाने के लिए 20 mL चुनिए, फिर धकेलिए। F₁ और F₂ पढ़िए।', 'Panel mein dhakelne ke liye 5 mL aur uthane ke liye 20 mL chuniye, phir dhakeliye. F₁ aur F₂ padhiye.'),
          see: t3('A₂ is 2.5 times A₁, so the same pressure gives 2.5 times the force: a light push holds the load. But your whole push lifts the arm only a little: d₂ is 2.5 times shorter than d₁. F₁ × d₁ = F₂ × d₂: nothing for free.', 'A₂, A₁ का 2.5 गुना है, तो वही दबाव 2.5 गुना बल देता है: हल्का धक्का बोझ सँभाल लेता है। पर आपका पूरा धक्का बाँह को थोड़ा ही उठाता है: d₂, d₁ से 2.5 गुना छोटा है। F₁ × d₁ = F₂ × d₂: कुछ भी मुफ़्त नहीं।', 'A₂, A₁ ka 2.5 guna hai, to wahi pressure 2.5 guna force deta hai: halka dhakka bojh sambhaal leta hai. Par aapka poora dhakka baanh ko thoda hi uthata hai: d₂, d₁ se 2.5 guna chhota hai. F₁ × d₁ = F₂ × d₂: kuch bhi muft nahi.') },
        { k: 'run', do: t3('The sketch does the same sum for a push of 10 N. Press Run and read the Serial Monitor.', 'स्केच 10 N के धक्के के लिए यही हिसाब करता है। "चलाइए" दबाइए और सीरियल मॉनिटर पढ़िए।', 'Sketch 10 N ke dhakke ke liye yahi hisaab karta hai. Run dabaiye aur Serial Monitor padhiye.'),
          see: t3('F2 = 25.3 N from a 10 N push: the area grew 2.5 times, and so did the force.', '10 N के धक्के से F2 = 25.3 N: क्षेत्रफल 2.5 गुना बढ़ा, तो बल भी।', '10 N ke dhakke se F2 = 25.3 N: area 2.5 guna badha, to force bhi.') },
        { k: 'edit', test: (src) => /float\s+d1\s*=\s*1\.91\s*;/.test(src) && /float\s+d2\s*=\s*1\.20?\s*;/.test(src), set: [[/float d1 = 1\.20;/, 'float d1 = 1.91;'], [/float d2 = 1\.91;/, 'float d2 = 1.20;']],
          do: t3('Swap the syringes in the sketch: d1 = 1.91 and d2 = 1.20. Press Run.', 'स्केच में सिरिंज बदलिए: d1 = 1.91 और d2 = 1.20। "चलाइए" दबाइए।', 'Sketch mein syringe badaliye: d1 = 1.91 aur d2 = 1.20. Run dabaiye.'),
          see: t3('F2 = 3.9 N: pushing the big one, the small one gives less force, but it moves 2.5 times as far and as fast.', 'F2 = 3.9 N: बड़ी को धकेलने पर छोटी कम बल देती है, पर 2.5 गुना ज़्यादा दूर और तेज़ चलती है।', 'F2 = 3.9 N: badi ko dhakelne par chhoti kam force deti hai, par 2.5 guna zyada door aur tez chalti hai.') },
        { k: 'act', until: (S) => S.w('bigPush'), do: t3('Try it on the rig: 20 mL to push, 5 mL to lift, and push.', 'रिग पर आज़माइए: धकेलने के लिए 20 mL, उठाने के लिए 5 mL, और धकेलिए।', 'Rig par try kijiye: dhakelne ke liye 20 mL, uthane ke liye 5 mL, aur dhakeliye.'),
          see: t3('A short push swings the arm far and fast, but F₁ is big. A JCB uses big cylinders for strength and the driver\'s small levers for control.', 'छोटा धक्का बाँह को दूर और तेज़ घुमाता है, पर F₁ बड़ा है। JCB ताक़त के लिए बड़े सिलिंडर और नियंत्रण के लिए चालक के छोटे लीवर इस्तेमाल करता है।', 'Chhota dhakka baanh ko door aur tez ghumata hai, par F₁ bada hai. JCB taakat ke liye bade cylinder aur control ke liye driver ke chhote lever use karta hai.') },
        { k: 'act', until: (S) => S.w('airTried'), do: t3('Last: fill the tube with air instead of water, and push hard.', 'आख़िर में: नली में पानी की जगह हवा भरिए, और ज़ोर से धकेलिए।', 'Aakhir mein: nali mein paani ki jagah hawa bhariye, aur zor se dhakeliye.'),
          see: t3('The arm starts late and stops lower: the first part of your push only squeezes the air, until it is pressed hard enough to hold the coins. Water and oil hardly squeeze at all, so every mm you push reaches the arm: that is why hydraulics use liquids.', 'बाँह देर से उठती है और नीचे ही रुक जाती है: आपके धक्के का पहला हिस्सा बस हवा को दबाता है, जब तक वह सिक्कों को सँभालने लायक़ न दब जाए। पानी और तेल लगभग नहीं दबते, तो आपका हर mm बाँह तक पहुँचता है: इसीलिए हाइड्रॉलिक्स में द्रव इस्तेमाल होते हैं।', 'Baanh der se uthti hai aur neeche hi ruk jaati hai: aapke dhakke ka pehla hissa bas hawa ko dabata hai, jab tak woh sikkon ko sambhaalne laayak na dab jaaye. Paani aur tel lagbhag nahi dabte, to aapka har mm baanh tak pahunchta hai: isiliye hydraulics mein liquids use hote hain.') },
      ],
      done: (S) => S.w('lifted') && S.w('smallPush') && S.w('bigPush') && S.w('airTried') },
  ];
}
