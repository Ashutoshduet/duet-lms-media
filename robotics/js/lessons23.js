// DUET Robotics Lab 360, batch 23: Class 11 robot-arm sessions, written fresh for DUET (same shape as lessons.js). The arm
// on the desk is batch 2's (robots.js ArmSim, worlds.js ArmWorld, level 4: the wooden block at A and the mark B):
//   armcopy    master and slave: four knobs on the breadboard are a small copy of the arm, and the arm copies them
//              (map() from 0..1023 to the joint's angles). The master's shoulder knob is fitted the other way round, so
//              the first program lifts when the knob goes down; the student swaps map()'s range, then picks the block
//              up at A and puts it down at B by hand, with the knobs
//   armrecord  teach and play back, as factory robots are taught: the same knobs, a RECORD and a PLAY button; each
//              pose goes into four arrays, and PLAY glides through them (all joints together, in 40 small steps). The
//              memory holds only 3 poses at first ("Memory full!"), but a pick-and-place needs 7: MAXP = 10
//   armbt      the arm from a phone over Bluetooth, on an ESP32 (BluetoothSerial, ESP32Servo): the phone's Bluetooth terminal
//              sends commands like B140 (base to 140°). The first program reads the angle with one SerialBT.read(), so it
//              gets only the first digit ("B140" turns the base to 1°!); SerialBT.parseInt() reads the whole number. Then
//              a pick-and-place by typed commands
//   delivery   a delivery robot on the line track (robots.js CAR_CFG.deliv): three stations beside the line, which the
//              side IR (pin 9) sees; the robot counts them, stops 3 s and chimes. deliverTo = 0 stops at every one (a bus);
//              deliverTo = 2 takes the parcel only to station 2 and drives past 1 and 3
// The helpers (t3, P, F, W, need, has, noShort) come from lessons.js. devtools/test/robocore23.mjs plays them end to end.

const t3 = (en, hi, hg) => ({ en, hi, hg });

// ------------------------------------------------------------------ the programs
const ARMCOPY = `// Master and slave: four knobs are a small copy of the arm, and the arm copies them.
#include <Servo.h>
Servo base;
Servo shoulder;
Servo elbow;
Servo claw;

void setup() {
  base.attach(3);
  shoulder.attach(5);
  elbow.attach(6);
  claw.attach(9);
  Serial.begin(9600);
}

void loop() {
  int b = map(analogRead(A0), 0, 1023, 0, 180);    // knob 1: the base
  int s = map(analogRead(A1), 0, 1023, 180, 0);    // knob 2: the shoulder
  int e = map(analogRead(A2), 0, 1023, 0, 180);    // knob 3: the elbow
  int g = map(analogRead(A3), 0, 1023, 30, 95);    // knob 4: the claw (30 open, 95 shut)
  base.write(b);
  shoulder.write(s);
  elbow.write(e);
  claw.write(g);
  Serial.print(b);
  Serial.print(" ");
  Serial.print(s);
  Serial.print(" ");
  Serial.print(e);
  Serial.print(" ");
  Serial.println(g);
  delay(50);
}
`;

const ARMREC = `// Teach and play back: pose the arm with the knobs, press RECORD at each pose, then PLAY.
#include <Servo.h>
Servo base;
Servo shoulder;
Servo elbow;
Servo claw;
const int REC = 2;              // the RECORD button (to GND when pressed)
const int PLAY = 4;             // the PLAY button
const int MAXP = 3;             // how many poses the memory holds
int poseB[MAXP];
int poseS[MAXP];
int poseE[MAXP];
int poseG[MAXP];
int count = 0;                  // poses recorded so far
int cur[4] = {90, 90, 90, 60};  // where the four joints are now

void moveAll(int b, int s, int e, int g) {
  base.write(b);
  shoulder.write(s);
  elbow.write(e);
  claw.write(g);
  cur[0] = b; cur[1] = s; cur[2] = e; cur[3] = g;
}

void glide(int b, int s, int e, int g) {   // all four joints together, in 40 small steps
  int b0 = cur[0], s0 = cur[1], e0 = cur[2], g0 = cur[3];
  for (int i = 1; i <= 40; i++) {
    moveAll(b0 + (b - b0) * i / 40, s0 + (s - s0) * i / 40, e0 + (e - e0) * i / 40, g0 + (g - g0) * i / 40);
    delay(20);
  }
}

void setup() {
  base.attach(3);
  shoulder.attach(5);
  elbow.attach(6);
  claw.attach(9);
  pinMode(REC, INPUT_PULLUP);
  pinMode(PLAY, INPUT_PULLUP);
  Serial.begin(9600);
  Serial.println("Pose the arm, press RECORD at each pose, then PLAY");
}

void loop() {
  int b = map(analogRead(A0), 0, 1023, 0, 180);
  int s = map(analogRead(A1), 0, 1023, 0, 180);
  int e = map(analogRead(A2), 0, 1023, 0, 180);
  int g = map(analogRead(A3), 0, 1023, 30, 95);
  moveAll(b, s, e, g);                     // teaching: the arm follows the knobs
  if (digitalRead(REC) == LOW) {
    if (count < MAXP) {
      poseB[count] = b;
      poseS[count] = s;
      poseE[count] = e;
      poseG[count] = g;
      count++;
      Serial.print("Pose ");
      Serial.print(count);
      Serial.println(" saved");
    } else {
      Serial.println("Memory full!");
    }
    while (digitalRead(REC) == LOW) delay(10);   // wait for the button to be let go
  }
  if (digitalRead(PLAY) == LOW && count > 0) {
    Serial.println("Playing");
    for (int i = 0; i < count; i++) {
      glide(poseB[i], poseS[i], poseE[i], poseG[i]);
      delay(300);
    }
    Serial.println("Done");
    while (digitalRead(PLAY) == LOW) delay(10);
    while (digitalRead(PLAY) == HIGH && digitalRead(REC) == HIGH) delay(10);   // stay at the last pose until a button,
    while (digitalRead(PLAY) == LOW || digitalRead(REC) == LOW) delay(10);     // then teach again once it is let go
  }
  delay(30);
}
`;

const ARMBT = `// Robot arm from the phone: send commands from a Bluetooth terminal app, like B140 or G90.
// B = base, S = shoulder, E = elbow, G = claw (grip), then the angle.
#include <BluetoothSerial.h>
#include <ESP32Servo.h>
BluetoothSerial SerialBT;
Servo base;
Servo shoulder;
Servo elbow;
Servo claw;

void setup() {
  Serial.begin(115200);
  SerialBT.begin("DUET-Arm");             // the name the phone sees
  base.attach(13);
  shoulder.attach(14);
  elbow.attach(27);
  claw.attach(26);
  base.write(90);
  shoulder.write(90);
  elbow.write(90);
  claw.write(60);
  Serial.println("Pair the phone with DUET-Arm and send B, S, E or G and an angle");
}

void loop() {
  if (SerialBT.available()) {
    char joint = SerialBT.read();         // B, S, E or G
    if (joint != 'B' && joint != 'S' && joint != 'E' && joint != 'G') return;   // skip anything else (the line's end)
    int angle = SerialBT.read() - '0';    // the angle
    angle = constrain(angle, 0, 180);
    if (joint == 'B') base.write(angle);
    if (joint == 'S') shoulder.write(angle);
    if (joint == 'E') elbow.write(angle);
    if (joint == 'G') claw.write(constrain(angle, 30, 95));   // the claw: 30 open, 95 shut
    SerialBT.print("OK ");
    SerialBT.print(joint);
    SerialBT.print(" ");
    SerialBT.println(angle);
  }
}
`;

const CDRIVE = `const int ENA = 5, IN1 = 7, IN2 = 8;    // motor A: the left wheel
const int ENB = 6, IN3 = 2, IN4 = 4;    // motor B: the right wheel

// one motor: v from -255 (backwards) to 255 (forwards)
void motor(int en, int a, int b, int v) {
  v = constrain(v, -255, 255);
  digitalWrite(a, v > 0 ? HIGH : LOW);
  digitalWrite(b, v < 0 ? HIGH : LOW);
  analogWrite(en, abs(v));       // PWM: how fast
}

void drive(int left, int right) {
  motor(ENA, IN1, IN2, left);
  motor(ENB, IN3, IN4, right);
}`;
const DELIV = `// Delivery robot: it follows the line round the school and stops at the stations beside it.
// A third IR sensor on its left side sees each station's black mark, and the robot counts them.
${CDRIVE}
const int irLeft = 11, irRight = 12, irMark = 9;
const int buzzer = 10;
int speed = 110;
int deliverTo = 0;      // 0: stop at every station (like a bus); or a station's number
int station = 0;        // the last station it passed
bool onMark = false;

void setup() {
  pinMode(ENA, OUTPUT); pinMode(IN1, OUTPUT); pinMode(IN2, OUTPUT);
  pinMode(ENB, OUTPUT); pinMode(IN3, OUTPUT); pinMode(IN4, OUTPUT);
  pinMode(irLeft, INPUT);
  pinMode(irRight, INPUT);
  pinMode(irMark, INPUT);
  Serial.begin(9600);
}

void followLine() {
  int L = digitalRead(irLeft);
  int R = digitalRead(irRight);
  if (L == LOW && R == LOW) drive(speed, speed);
  else if (L == HIGH && R == LOW) drive(0, speed);
  else if (L == LOW && R == HIGH) drive(speed, 0);
  else drive(0, 0);
}

void loop() {
  followLine();
  int M = digitalRead(irMark);            // HIGH over a station's black mark
  if (M == HIGH && !onMark) {             // it has just reached one
    station = station + 1;
    if (station > 3) station = 1;         // three stations round the track
    Serial.print("Station ");
    Serial.println(station);
    if (deliverTo == 0 || station == deliverTo) {
      drive(0, 0);
      tone(buzzer, 1500, 300);
      Serial.print("Delivery at station ");
      Serial.println(station);
      delay(3000);                        // time to take the parcel
    }
  }
  onMark = (M == HIGH);
}
`;

export function batch23(K, n0) {
  const { P, F, W, need, has, noShort, N } = K;
  const E = t3('', '', '');
  const CHECK = { k: 'check', do: t3('Check your circuit.', 'अपना सर्किट जाँचिए।', 'Apna circuit check karo.'), see: E };
  const RUN = (see) => ({ k: 'run', do: t3('Press Run.', '"चलाइए" दबाइए।', 'Run dabaiye.'), see: see || E });
  const w3 = (a, b, en, hi, hg, see) => ({ k: 'wire', wire: [a, b], do: t3(en, hi, hg), see: see || E });
  const fresh = (S) => S.runSrc !== null && S.t - (S.freshAt || 0) > 0.3;
  // the arm of batch 2: the 5 V adapter on the front rails, the four servos' plugs on the mat (pins 3, 5, 6, 9)
  const ARMPARTS = [F('psu', 'psu5', {}, 40, 78, 2), F('svB', 'mg996r', { mount: 'arm' }, 172, 50, 1), F('svS', 'mg996r', { mount: 'arm' }, 172, 78, 1), F('svE', 'mg996r', { mount: 'arm' }, 172, 106, 1), F('svG', 'servo', { mount: 'arm' }, 172, 134, 1)];
  const SUPPLY = [['T:psu:P', 'H:bp20'], ['T:psu:N', 'H:bn21'], ['GND1', 'H:bn5']];
  const SERVO = { svB: 3, svS: 5, svE: 6, svG: 9 };
  const servoWires = (k) => [['T:' + k + ':GND', 'H:bn' + (24 + Object.keys(SERVO).indexOf(k) * 4)], ['T:' + k + ':VP', 'H:bp' + (24 + Object.keys(SERVO).indexOf(k) * 4)], ['T:' + k + ':SIG', 'D' + SERVO[k]]];
  // the master: four knobs on the breadboard, their ends on the top rails (the Arduino's 5 V and GND)
  const KNOB = [['pk1', 39, 'A0'], ['pk2', 45, 'A1'], ['pk3', 51, 'A2'], ['pk4', 57, 'A3']]; // (a knob's legs are 2 columns apart: c, c + 2, c + 4)
  const KNOBPARTS = KNOB.map(([t, c]) => P(t, 'pot', {}, 'e' + c, 0));
  const KNOBENDS = [['5V', 'H:tp30'], ['GND3', 'H:tn18'], ...KNOB.flatMap(([, c], i) => [['H:a' + c, 'H:tn' + (31 + i * 5)], ['H:a' + (c + 4), 'H:tp' + (34 + i * 5)]])]; // (rail holes are numbered 1–50 along the rail)
  const WIPERS = KNOB.map(([t, c, a]) => ['H:a' + (c + 2), a]);
  const JOINT = [t3('base', 'बेस', 'base'), t3('shoulder', 'कंधा', 'shoulder'), t3('elbow', 'कोहनी', 'elbow'), t3('claw', 'पंजा', 'claw')];
  const sv = { svB: t3('base servo', 'बेस का सर्वो', 'base ka servo'), svS: t3('shoulder servo', 'कंधे का सर्वो', 'shoulder ka servo'), svE: t3('elbow servo', 'कोहनी का सर्वो', 'elbow ka servo'), svG: t3('claw servo', 'पंजे का सर्वो', 'claw ka servo') };
  const X = {
    psuRail: t3('The adapter must feed the front rails: its + to the red + rail, its − to the blue − rail.', 'एडैप्टर को आगे वाली रेलें चलानी हैं: इसका + लाल + रेल पर, − नीली − रेल पर।', 'Adapter ko aage wali rails chalani hain: iska + red + rail par, − blue − rail par.'),
    commonGnd: t3('The adapter\'s − and the Arduino\'s GND must be joined (common ground).', 'एडैप्टर का − और Arduino का GND जुड़ा होना चाहिए (कॉमन ग्राउंड)।', 'Adapter ka − aur Arduino ka GND juda hona chahiye (common ground).'),
    knobs: t3('Each knob\'s middle leg (its wiper) goes to its own analog pin, in order: knob 1 (base) to A0, knob 2 (shoulder) to A1, knob 3 (elbow) to A2, knob 4 (claw) to A3.', 'हर नॉब का बीच वाला पैर (वाइपर) अपने एनालॉग पिन पर, क्रम से: नॉब 1 (बेस) A0, नॉब 2 (कंधा) A1, नॉब 3 (कोहनी) A2, नॉब 4 (पंजा) A3।', 'Har knob ka beech wala pair (wiper) apne analog pin par, kram se: knob 1 (base) A0, knob 2 (shoulder) A1, knob 3 (elbow) A2, knob 4 (claw) A3.'),
  };
  const armChecks = [noShort, (S) => (S.conn('psu.P', 'rail:bp') && S.conn('psu.N', 'rail:bn') ? null : [X.psuRail]), (S) => (S.conn('psu.N', 'GND') ? null : [X.commonGnd]),
    ...Object.keys(SERVO).map((k) => need(k + '.SIG', 'D' + SERVO[k], W.toPin, { x: t3(sv[k].en + '\'s orange wire', sv[k].hi + ' का नारंगी तार', sv[k].hg + ' ka orange wire'), p: SERVO[k] }))];
  const knobChecks = [(S) => (KNOB.every(([t]) => S.has(t)) ? null : [W.missing, { x: t3('knob', 'नॉब', 'knob') }]),
    (S) => (KNOB.every(([t, , a]) => S.conn(t + '.W', a)) ? null : [X.knobs]),
    (S) => (KNOB.every(([t]) => (S.conn(t + '.1', 'GND') && S.conn(t + '.3', '5V')) || (S.conn(t + '.3', 'GND') && S.conn(t + '.1', '5V'))) ? null : [W.join, { a: t3('Each knob\'s outer legs', 'हर नॉब के बाहरी पैर', 'Har knob ke baahri pair'), b: t3('5V and GND (the top rails)', '5V और GND (ऊपर की रेलें)', '5V aur GND (upar ki rails)') }])];
  const ang = (S, t) => { const p = S.part(t); return p ? p.state.angle : 90; };
  const pos = (S, t) => { const p = S.part(t); return p ? p.state.pos : 0.5; };
  let n = n0;
  const L = [];

  // 1 ---------------------------------------------------------------------------------------------- master and slave
  const okMap = (src) => /int\s+s\s*=\s*map\(\s*analogRead\(\s*A1\s*\)\s*,\s*0\s*,\s*1023\s*,\s*0\s*,\s*180\s*\)/.test(src || '');
  L.push({ id: 'armcopy', cls: '11', blocks: false, view: 'side', wview: 'armbench', code: ARMCOPY, drawer: ['pot'], serial: true, world: { kind: 'arm', level: 4 },
    tick: (S) => { if (fresh(S) && pos(S, 'pk2') > 0.65 && ang(S, 'svS') < 60) S.mem.reversed = true; },
    title: t3('Robot arm: copy a knob arm (master and slave)', 'रोबोट बाँह: नॉब वाली बाँह की नकल (मास्टर और स्लेव)', 'Robot arm: knob wali baanh ki nakal (master aur slave)'),
    goal: t3('Bomb-disposal and surgical robots copy the hands of a person at a distance. Here four knobs are a small "master" copy of the arm: turn a knob, and the big "slave" joint follows. Then move a block from A to B by hand, through the robot.', 'बम निरोधक और सर्जरी वाले रोबोट दूर बैठे इंसान के हाथों की नकल करते हैं। यहाँ चार नॉब बाँह की एक छोटी "मास्टर" नकल हैं: नॉब घुमाइए, और बड़ा "स्लेव" जोड़ पीछे चलता है। फिर रोबोट के ज़रिए हाथ से ब्लॉक को A से B ले जाइए।', 'Bomb disposal aur surgery wale robot door baithe insaan ke haathon ki nakal karte hain. Yahan chaar knob baanh ki ek chhoti "master" nakal hain: knob ghumaiye, aur bada "slave" joint peeche chalta hai. Phir robot ke zariye haath se block ko A se B le jaiye.'),
    setup: { parts: [...ARMPARTS, ...KNOBPARTS], wires: [...SUPPLY, ...Object.keys(SERVO).flatMap(servoWires), ...KNOBENDS] },
    steps: [
      { k: 'info', do: t3('Ready: the arm with its 5 V adapter and its four servos on pins 3, 5, 6 and 9, and four knobs on the breadboard (their outer legs already on 5 V and GND). Knob 1 is the base, 2 the shoulder, 3 the elbow, 4 the claw.', 'तैयार: 5 V एडैप्टर के साथ बाँह और पिन 3, 5, 6, 9 पर इसके चार सर्वो, और ब्रेडबोर्ड पर चार नॉब (उनके बाहरी पैर पहले से 5 V और GND पर)। नॉब 1 बेस है, 2 कंधा, 3 कोहनी, 4 पंजा।', 'Taiyaar: 5 V adapter ke saath baanh aur pin 3, 5, 6, 9 par iske chaar servo, aur breadboard par chaar knob (unke baahri pair pehle se 5 V aur GND par). Knob 1 base hai, 2 shoulder, 3 elbow, 4 claw.'),
        see: t3('A knob between 5 V and GND is a voltage divider: its middle leg gives 0 to 5 V as it turns, and analogRead gives 0 to 1023.', '5 V और GND के बीच का नॉब एक वोल्टेज डिवाइडर है: घुमाने पर इसका बीच वाला पैर 0 से 5 V देता है, और analogRead 0 से 1023।', '5 V aur GND ke beech ka knob ek voltage divider hai: ghumane par iska beech wala pair 0 se 5 V deta hai, aur analogRead 0 se 1023.') },
      ...KNOB.map(([t, c, a], i) => w3(t + '.W', a, `Wire knob ${i + 1}'s middle leg (column ${c + 2}) to ${a}: the ${JOINT[i].en}.`, `नॉब ${i + 1} के बीच वाले पैर (कॉलम ${c + 2}) को ${a} से जोड़िए: ${JOINT[i].hi}।`, `Knob ${i + 1} ke beech wale pair (column ${c + 2}) ko ${a} se jodiye: ${JOINT[i].hg}.`)),
      CHECK,
      { k: 'info', code: [16, 19], do: t3('Read the four map() lines: each turns 0..1023 into the joint\'s angles. The claw uses only 30 (open) to 95 (shut).', 'map() की चारों लाइनें पढ़िए: हर एक 0..1023 को जोड़ के कोणों में बदलती है। पंजा सिर्फ़ 30 (खुला) से 95 (बंद) तक चलता है।', 'map() ki chaaron lines padhiye: har ek 0..1023 ko joint ke angles mein badalti hai. Claw sirf 30 (khula) se 95 (band) tak chalta hai.'), see: E },
      RUN(t3('All knobs in the middle: the arm stands at 90°, 90°, 90°.', 'सभी नॉब बीच में: बाँह 90°, 90°, 90° पर खड़ी है।', 'Sabhi knob beech mein: baanh 90°, 90°, 90° par khadi hai.')),
      { k: 'act', until: (S) => !!S.mem.reversed, do: t3('Lift the arm: tap knob 2 (the shoulder) and turn it up, to about three-quarters.', 'बाँह उठाइए: नॉब 2 (कंधा) को छूइए और ऊपर, लगभग तीन-चौथाई तक घुमाइए।', 'Baanh uthaiye: knob 2 (shoulder) ko touch karo aur upar, lagbhag teen-chauthai tak ghumaiye.'),
        see: t3('It goes DOWN! On the master the shoulder knob is fitted the other way round, so map(…, 180, 0) turns it upside down. On a real bomb-disposal robot this mistake could knock over what it should lift gently.', 'यह नीचे जाती है! मास्टर पर कंधे का नॉब उल्टा लगा है, इसलिए map(…, 180, 0) इसे उलट देता है। असली बम निरोधक रोबोट पर यह ग़लती उसी चीज़ को गिरा सकती है जिसे उसे धीरे से उठाना था।', 'Yeh NEECHE jaati hai! Master par shoulder ka knob ulta laga hai, isliye map(…, 180, 0) ise ulat deta hai. Asli bomb disposal robot par yeh galti usi cheez ko gira sakti hai jise use dheere se uthana tha.') },
      { k: 'edit', test: okMap, set: [[/int s = map\(analogRead\(A1\), 0, 1023, 180, 0\);/, 'int s = map(analogRead(A1), 0, 1023, 0, 180);']],
        do: t3('Turn the shoulder the right way: change map(analogRead(A1), 0, 1023, 180, 0) to map(analogRead(A1), 0, 1023, 0, 180), and press Run.', 'कंधे को सही दिशा दीजिए: map(analogRead(A1), 0, 1023, 180, 0) को map(analogRead(A1), 0, 1023, 0, 180) कीजिए, और "चलाइए" दबाइए।', 'Shoulder ko sahi disha dijiye: map(analogRead(A1), 0, 1023, 180, 0) ko map(analogRead(A1), 0, 1023, 0, 180) karo, aur Run dabaiye.'), see: E },
      { k: 'act', until: (S) => fresh(S) && S.w('placed'), do: t3('Now move the block from A to B by hand, with the knobs. Open the claw (knob 4 down), turn the base to A (about 140°), lower the shoulder and elbow to the block (about 45° and 66°), shut the claw, lift, turn to B (about 40°), lower and open.', 'अब नॉब से ब्लॉक को हाथ से A से B ले जाइए। पंजा खोलिए (नॉब 4 नीचे), बेस को A की ओर घुमाइए (लगभग 140°), कंधा और कोहनी ब्लॉक तक नीचे लाइए (लगभग 45° और 66°), पंजा बंद कीजिए, उठाइए, B की ओर घुमाइए (लगभग 40°), नीचे लाकर खोलिए।', 'Ab knob se block ko haath se A se B le jaiye. Claw kholiye (knob 4 neeche), base ko A ki taraf ghumaiye (lagbhag 140°), shoulder aur elbow block tak neeche laiye (lagbhag 45° aur 66°), claw band kijiye, uthaiye, B ki taraf ghumaiye (lagbhag 40°), neeche laakar kholiye.'),
        see: t3('Placed at B, by your hands through the robot\'s. The panel\'s angles helped; a real master arm has the same joints and lengths as the slave, so the operator just moves it like the real thing. If the claw pressed into the desk, the panel said so: a real arm would strain its gears.', 'B पर रख दिया, रोबोट के हाथों से आपके हाथों ने। पैनल के कोणों ने मदद की; असली मास्टर बाँह में स्लेव जैसे ही जोड़ और लंबाइयाँ होती हैं, इसलिए चलाने वाला उसे असली की तरह हिलाता है। अगर पंजा डेस्क में दबा, तो पैनल ने बताया: असली बाँह के गियर पर ज़ोर पड़ता।', 'B par rakh diya, robot ke haathon se aapke haathon ne. Panel ke angles ne madad ki; asli master baanh mein slave jaise hi joint aur lambaiyan hoti hain, isliye chalane wala use asli ki tarah hilata hai. Agar claw desk mein daba, to panel ne bataya: asli baanh ke gear par zor padta.') },
    ],
    check: [...armChecks, ...knobChecks],
    done: (S) => okMap(S.runSrc) && S.w('placed') });

  // 2 ---------------------------------------------------------------------------------------------- teach and play back
  const maxp = (src) => { const m = /const\s+int\s+MAXP\s*=\s*(\d+)\s*;/.exec(src || ''); return m ? +m[1] : 0; };
  const lines = (S) => S.serLines || [];
  const saved = (S) => lines(S).filter((x) => /^Pose \d+ saved$/.test(x)).length;
  const BTN = [['b1', 10, 'D2', t3('RECORD', 'RECORD', 'RECORD')], ['b2', 16, 'D4', t3('PLAY', 'PLAY', 'PLAY')]];
  L.push({ id: 'armrecord', cls: '11', blocks: false, view: 'side', wview: 'armbench', code: ARMREC, drawer: ['button'], serial: true, world: { kind: 'arm', level: 4 },
    tick: (S) => { if (!fresh(S)) return; const M = S.memRun; if (lines(S).includes('Memory full!')) S.mem.full = true; if (lines(S).includes('Playing')) M.playing = true; if (M.playing && S.w('placed')) M.playedPlace = true; },
    title: t3('Robot arm: record and play back moves', 'रोबोट बाँह: चालें रिकॉर्ड करो और दोहराओ', 'Robot arm: chaalein record karo aur dohrao'),
    goal: t3('Factory robots are taught, not programmed line by line: an operator moves the arm through a job and saves each pose, and the robot then repeats it all day. Build that: the knobs, a RECORD button, a PLAY button and arrays for memory.', 'फ़ैक्टरी रोबोट को लाइन-दर-लाइन प्रोग्राम नहीं, सिखाया जाता है: ऑपरेटर बाँह को काम से गुज़ारता है और हर मुद्रा सहेजता है, और फिर रोबोट उसे दिन भर दोहराता है। यही बनाइए: नॉब, एक RECORD बटन, एक PLAY बटन और याद रखने के लिए ऐरे।', 'Factory robot ko line-dar-line program nahi, sikhaya jaata hai: operator baanh ko kaam se guzarta hai aur har pose save karta hai, aur phir robot use din bhar dohrata hai. Yahi banaiye: knob, ek RECORD button, ek PLAY button aur yaad rakhne ke liye array.'),
    setup: { parts: [...ARMPARTS, ...KNOBPARTS], wires: [...SUPPLY, ...Object.keys(SERVO).flatMap(servoWires), ...KNOBENDS, ...WIPERS] },
    steps: [
      { k: 'info', do: t3('Ready from the last session: the arm and its four knobs (A0 to A3). Today two buttons: RECORD on pin 2 and PLAY on pin 4, each to GND when pressed (INPUT_PULLUP).', 'पिछले सत्र से तैयार: बाँह और इसके चार नॉब (A0 से A3)। आज दो बटन: पिन 2 पर RECORD और पिन 4 पर PLAY, दबाने पर हर एक GND से (INPUT_PULLUP)।', 'Pichhle session se taiyaar: baanh aur iske chaar knob (A0 se A3). Aaj do button: pin 2 par RECORD aur pin 4 par PLAY, dabane par har ek GND se (INPUT_PULLUP).'), see: E },
      ...BTN.flatMap(([t, c, d, nm]) => [
        { k: 'place', place: P(t, 'button', {}, 'e' + c, 0), do: t3(`Push the ${nm.en} button into ${c}e–${c + 2}e, across the middle gap.`, `${nm.hi} बटन को ${c}e–${c + 2}e में, बीच की खाली जगह के आर-पार लगाइए।`, `${nm.hg} button ko ${c}e–${c + 2}e mein, beech ki khaali jagah ke aar-paar lagaiye.`), see: E },
        w3(t + '.L1', d, `Wire its left leg (column ${c}) to pin ${d.slice(1)}.`, `इसके बाएँ पैर (कॉलम ${c}) को पिन ${d.slice(1)} से जोड़िए।`, `Iske left pair (column ${c}) ko pin ${d.slice(1)} se jodiye.`),
        w3(t + '.L3', 'rail:tn', `Its right leg (column ${c + 2}) to the top − rail (GND).`, `इसका दायाँ पैर (कॉलम ${c + 2}) ऊपर की − रेल (GND) से।`, `Iska right pair (column ${c + 2}) upar ki − rail (GND) se.`)]),
      CHECK,
      { k: 'info', code: [9, 14], do: t3('Read the memory: four arrays, poseB[], poseS[], poseE[], poseG[], one place for each saved pose, and count. MAXP says how many places there are.', 'याददाश्त पढ़िए: चार ऐरे, poseB[], poseS[], poseE[], poseG[], हर सहेजी मुद्रा के लिए एक जगह, और count। MAXP बताता है कितनी जगहें हैं।', 'Yaaddasht padhiye: chaar array, poseB[], poseS[], poseE[], poseG[], har saved pose ke liye ek jagah, aur count. MAXP batata hai kitni jagahein hain.'),
        see: t3('glide() moves all four joints together in 40 small steps, so the arm flows from pose to pose instead of jerking.', 'glide() चारों जोड़ों को एक साथ 40 छोटे क़दमों में चलाता है, ताकि बाँह झटके के बजाय एक मुद्रा से दूसरी में बहती है।', 'glide() chaaron joints ko ek saath 40 chhote kadmon mein chalata hai, taaki baanh jhatke ke bajaye ek pose se doosre mein behti hai.') },
      RUN(),
      { k: 'act', until: (S) => !!S.mem.full, do: t3('Teach the pick-and-place: with the knobs, go to each pose and press RECORD there: open above A, down to the block, shut the claw, lift, turn to B, down, open. Seven poses.', 'उठाओ-रखो सिखाइए: नॉब से हर मुद्रा पर जाइए और वहाँ RECORD दबाइए: A के ऊपर खुला, ब्लॉक तक नीचे, पंजा बंद, उठाइए, B की ओर, नीचे, खोलिए। सात मुद्राएँ।', 'Uthao-rakho sikhaiye: knob se har pose par jaaiye aur wahan RECORD dabaiye: A ke upar khula, block tak neeche, claw band, uthaiye, B ki taraf, neeche, kholiye. Saat poses.'),
        see: t3('"Memory full!" after the third: MAXP = 3 gave the arrays only three places. A fourth would be written past the end of the array, over other variables: C++ would not stop you, which is why the program checks count < MAXP.', 'तीसरी के बाद "Memory full!": MAXP = 3 ने ऐरे को सिर्फ़ तीन जगहें दीं। चौथी ऐरे के आख़िर के बाद, दूसरे वेरिएबल के ऊपर लिखी जाती: C++ आपको नहीं रोकता, इसीलिए प्रोग्राम count < MAXP जाँचता है।', 'Teesri ke baad "Memory full!": MAXP = 3 ne array ko sirf teen jagahein di. Chauthi array ke aakhir ke baad, doosre variable ke upar likhi jaati: C++ aapko nahi rokta, isiliye program count < MAXP jaanchta hai.') },
      { k: 'edit', test: (src) => maxp(src) >= 8 && maxp(src) <= 30, set: [[/const int MAXP = 3;/, 'const int MAXP = 10;']],
        do: t3('Give it room for the whole job: change MAXP = 3 to MAXP = 10, and press Run. (Each pose is 4 numbers of 2 bytes: 10 poses take 80 of the Uno\'s 2048 bytes of memory.)', 'पूरे काम की जगह दीजिए: MAXP = 3 को MAXP = 10 कीजिए, और "चलाइए" दबाइए। (हर मुद्रा 2 बाइट की 4 संख्याएँ है: 10 मुद्राएँ Uno की 2048 बाइट मेमोरी में से 80 लेती हैं।)', 'Poore kaam ki jagah dijiye: MAXP = 3 ko MAXP = 10 karo, aur Run dabaiye. (Har pose 2 byte ke 4 number hai: 10 poses Uno ki 2048 byte memory mein se 80 leti hain.)'), see: E },
      { k: 'act', until: (S) => fresh(S) && saved(S) >= 7, do: t3('Teach the seven poses again, pressing RECORD at each one.', 'सातों मुद्राएँ फिर से सिखाइए, हर एक पर RECORD दबाते हुए।', 'Saaton poses phir se sikhaiye, har ek par RECORD dabaate hue.'), see: t3('"Pose 7 saved". The block is at B now: you carried it there while teaching.', '"Pose 7 saved"। ब्लॉक अब B पर है: सिखाते हुए आप उसे वहाँ ले गए।', '"Pose 7 saved". Block ab B par hai: sikhaate hue aap use wahan le gaye.') },
      { k: 'act', until: (S) => fresh(S) && S.memRun.playedPlace, do: t3('In the arm\'s panel press "Block back to A", turn the knobs anywhere you like, and press PLAY.', 'बाँह के पैनल में "ब्लॉक वापस A पर" दबाइए, नॉब कहीं भी घुमा दीजिए, और PLAY दबाइए।', 'Baanh ke panel mein "Block wapas A par" dabaiye, knob kahin bhi ghuma dijiye, aur PLAY dabaiye.'),
        see: t3('It does the whole job by itself, smoothly, from memory: the knobs do not matter now. That is how car-factory robots are taught to weld and paint. Press PLAY again for one more round; a factory would just keep going.', 'यह पूरा काम ख़ुद, आराम से, याद से करती है: अब नॉब मायने नहीं रखते। कार फ़ैक्टरी के रोबोट को वेल्डिंग और पेंटिंग ऐसे ही सिखाई जाती है। एक और बार के लिए PLAY फिर दबाइए; फ़ैक्टरी बस चलती रहती।', 'Yeh poora kaam khud, aaram se, yaad se karti hai: ab knob maayne nahi rakhte. Car factory ke robot ko welding aur painting aise hi sikhayi jaati hai. Ek aur baar ke liye PLAY phir dabaiye; factory bas chalti rehti.') },
    ],
    check: [...armChecks, ...knobChecks, ...BTN.flatMap(([t, , d, nm]) => [has(t, t3(nm.en + ' button', nm.hi + ' बटन', nm.hg + ' button')), need(t + '.L1', d, W.toPin, { x: t3(nm.en + ' button', nm.hi + ' बटन', nm.hg + ' button'), p: +d.slice(1) }),
      (S) => (S.conn(t + '.L3', 'GND') || S.conn(t + '.L4', 'GND') ? null : [W.toGnd, { x: t3(nm.en + ' button\'s other leg', nm.hi + ' बटन का दूसरा पैर', nm.hg + ' button ka doosra pair') }])])],
    done: (S) => maxp(S.runSrc) >= 8 && S.memRun.playedPlace });

  // 3 ---------------------------------------------------------------------------------------------- the arm from a phone
  // the ESP32 in the breadboard: its GND (front row, column 5) to the adapter's − rail, the servos' signals on GPIO 13, 14, 27, 26
  const ESERVO = { svB: 13, svS: 14, svE: 27, svG: 26 };
  const ESUPPLY = [['T:psu:P', 'H:bp20'], ['T:psu:N', 'H:bn21'], ['H:j5', 'H:bn3']];
  const eServoPow = (k) => [['T:' + k + ':GND', 'H:bn' + (24 + Object.keys(ESERVO).indexOf(k) * 4)], ['T:' + k + ':VP', 'H:bp' + (24 + Object.keys(ESERVO).indexOf(k) * 4)]];
  const netOf4 = (S) => S.lab.net4 || { bt: { conn: null, log: [] } };
  const btLog = (S) => (netOf4(S).bt.log || []).filter((x) => !x.sys && !x.me).map((x) => x.text);
  const okParse = (src) => /int\s+angle\s*=\s*SerialBT\.parseInt\(\s*\)\s*;/.test(src || '');
  const XB = { espGnd: t3('The ESP32\'s GND must join the adapter\'s − rail (common ground), or the servos cannot read its signals.', 'ESP32 का GND एडैप्टर की − रेल से जुड़ना चाहिए (कॉमन ग्राउंड), वरना सर्वो इसके सिग्नल नहीं पढ़ सकते।', 'ESP32 ka GND adapter ki − rail se judna chahiye (common ground), warna servo iske signal nahi padh sakte.'),
    gpio12: t3('Not GPIO 12: it is a strapping pin, and a servo pulling it at power-up can stop the ESP32 from starting. Use the pins the steps say.', 'GPIO 12 नहीं: यह स्ट्रैपिंग पिन है, और चालू होते समय सर्वो उसे खींचे तो ESP32 शुरू नहीं होता। वही पिन लीजिए जो स्टेप बताते हैं।', 'GPIO 12 nahi: yeh strapping pin hai, aur chalu hote samay servo use kheenche to ESP32 shuru nahi hota. Wahi pin lijiye jo steps batate hain.') };
  L.push({ id: 'armbt', board: 'esp32', cls: '11', blocks: false, view: 'side', wview: 'armbench', code: ARMBT, drawer: [], baud: 115200, serial: true, phone: true, world: { kind: 'arm', level: 4 },
    tick: (S) => { if (S.fresh() && !okParse(S.runSrc) && ang(S, 'svB') < 10 && btLog(S).some((x) => /^OK B 1$/.test(x))) S.mem.oneDigit = true; },
    title: t3('Robot arm: phone control over Bluetooth', 'रोबोट बाँह: ब्लूटूथ से फ़ोन द्वारा', 'Robot arm: Bluetooth se phone dwara'),
    goal: t3('No wires to the operator: the arm takes typed commands from a phone over Bluetooth, B140 for "base to 140°". Read a number out of a stream of letters, then do a whole pick-and-place from the phone.', 'चलाने वाले तक कोई तार नहीं: बाँह ब्लूटूथ से फ़ोन के लिखे आदेश लेती है, B140 यानी "बेस 140° पर"। अक्षरों की धारा से एक संख्या पढ़िए, फिर फ़ोन से पूरा उठाओ-रखो कीजिए।', 'Chalane wale tak koi taar nahi: baanh Bluetooth se phone ke likhe aadesh leti hai, B140 yaani "base 140° par". Aksharon ki dhaara se ek sankhya padhiye, phir phone se poora uthao-rakho kijiye.'),
    setup: { parts: ARMPARTS, wires: [...ESUPPLY, ...Object.keys(ESERVO).flatMap(eServoPow)] },
    steps: [
      { k: 'info', do: t3('An ESP32 drives the arm today: it has Bluetooth built in. The adapter powers the servos as before, and the ESP32\'s GND is joined to the adapter\'s − rail. Your job: the four signal wires.', 'आज ESP32 बाँह चलाता है: इसमें ब्लूटूथ अंदर ही है। एडैप्टर पहले की तरह सर्वो को बिजली देता है, और ESP32 का GND एडैप्टर की − रेल से जुड़ा है। आपका काम: चारों सिग्नल तार।', 'Aaj ESP32 baanh chalata hai: ismein Bluetooth andar hi hai. Adapter pehle ki tarah servo ko bijli deta hai, aur ESP32 ka GND adapter ki − rail se juda hai. Aapka kaam: chaaron signal taar.'),
        see: t3('The ESP32\'s pins give 3.3 V, enough for a servo\'s signal; the servos\' power still comes from the 5 V adapter.', 'ESP32 के पिन 3.3 V देते हैं, सर्वो के सिग्नल के लिए काफ़ी; सर्वो की बिजली अब भी 5 V एडैप्टर से आती है।', 'ESP32 ke pin 3.3 V dete hain, servo ke signal ke liye kaafi; servo ki bijli ab bhi 5 V adapter se aati hai.') },
      ...Object.keys(ESERVO).map((k) => w3(k + '.SIG', 'D' + ESERVO[k], `Wire the ${sv[k].en}'s orange wire to GPIO ${ESERVO[k]}.`, `${sv[k].hi} का नारंगी तार GPIO ${ESERVO[k]} से जोड़िए।`, `${sv[k].hg} ka orange wire GPIO ${ESERVO[k]} se jodiye.`)),
      CHECK,
      { k: 'info', code: [25, 31], do: t3('Read loop(): one letter says which joint, and then the angle is read. The phone sends "B140" and then the line\'s end, all at once.', 'loop() पढ़िए: एक अक्षर बताता है कौन-सा जोड़, फिर कोण पढ़ा जाता है। फ़ोन "B140" और फिर लाइन का अंत, सब एक साथ भेजता है।', 'loop() padhiye: ek akshar batata hai kaun sa joint, phir angle padha jaata hai. Phone "B140" aur phir line ka ant, sab ek saath bhejta hai.'), see: E },
      RUN(t3('It starts Bluetooth as "DUET-Arm".', 'यह ब्लूटूथ "DUET-Arm" नाम से शुरू करता है।', 'Yeh Bluetooth "DUET-Arm" naam se shuru karta hai.')),
      { k: 'act', until: (S) => netOf4(S).bt.conn === 'DUET-Arm', do: t3('On the phone, open the Bluetooth app and tap DUET-Arm to connect.', 'फ़ोन पर ब्लूटूथ ऐप खोलिए और जोड़ने के लिए DUET-Arm पर टैप कीजिए।', 'Phone par Bluetooth app kholiye aur jodne ke liye DUET-Arm par tap kijiye.'), see: E },
      { k: 'act', until: (S) => !!S.mem.oneDigit, do: t3('Type B140 and send it.', 'B140 लिखिए और भेजिए।', 'B140 likhiye aur bhejiye.'),
        see: t3('The base swings right round to 1°, and the phone shows "OK B 1"! SerialBT.read() takes ONE character, so the angle was only the "1"; the "4" and "0" were then read as joint letters and skipped. A real arm swinging the wrong way could hit someone.', 'बेस घूमकर 1° तक चला गया, और फ़ोन पर "OK B 1"! SerialBT.read() एक ही अक्षर लेता है, इसलिए कोण सिर्फ़ "1" रहा; "4" और "0" फिर जोड़ के अक्षर समझकर छोड़ दिए गए। ग़लत दिशा में घूमती असली बाँह किसी को लग सकती है।', 'Base ghoom kar 1° tak chala gaya, aur phone par "OK B 1"! SerialBT.read() ek hi akshar leta hai, isliye angle sirf "1" raha; "4" aur "0" phir joint ke akshar samajh kar chhod diye gaye. Galat disha mein ghoomti asli baanh kisi ko lag sakti hai.') },
      { k: 'edit', test: okParse, set: [[/int angle = SerialBT\.read\(\) - '0';/, 'int angle = SerialBT.parseInt();']],
        do: t3('Read the whole number: change SerialBT.read() - \'0\' to SerialBT.parseInt(), and press Run. parseInt() collects digits until something that is not a digit.', 'पूरी संख्या पढ़िए: SerialBT.read() - \'0\' को SerialBT.parseInt() कीजिए, और "चलाइए" दबाइए। parseInt() अंक तब तक इकट्ठा करता है जब तक कोई ग़ैर-अंक न आए।', 'Poori sankhya padhiye: SerialBT.read() - \'0\' ko SerialBT.parseInt() karo, aur Run dabaiye. parseInt() ank tab tak ikattha karta hai jab tak koi gair-ank na aaye.'), see: E },
      { k: 'act', until: (S) => fresh(S) && Math.abs(ang(S, 'svB') - 140) < 4 && btLog(S).some((x) => /^OK B 140$/.test(x)), do: t3('The ESP32 restarted, so connect to DUET-Arm again, and send B140.', 'ESP32 फिर से चालू हुआ, इसलिए DUET-Arm से फिर जुड़िए, और B140 भेजिए।', 'ESP32 phir se chalu hua, isliye DUET-Arm se phir judiye, aur B140 bhejiye.'),
        see: t3('"OK B 140": the base points at A.', '"OK B 140": बेस A की ओर है।', '"OK B 140": base A ki taraf hai.') },
      { k: 'act', until: (S) => fresh(S) && S.w('placed'), do: t3('Now the whole job from the phone, one command at a time: G30 (open), S45 and E66 (down to the block), G92 (grip), S80 (lift), B40 (to B), S45 (down), G30 (let go).', 'अब पूरा काम फ़ोन से, एक-एक आदेश: G30 (खोलो), S45 और E66 (ब्लॉक तक नीचे), G92 (पकड़ो), S80 (उठाओ), B40 (B की ओर), S45 (नीचे), G30 (छोड़ो)।', 'Ab poora kaam phone se, ek-ek aadesh: G30 (kholo), S45 aur E66 (block tak neeche), G92 (pakdo), S80 (uthao), B40 (B ki taraf), S45 (neeche), G30 (chhodo).'),
        see: t3('Placed at B from across the room. A short command language like this (a letter and a number) is how many real robots and 3D printers are driven: a printer\'s G-code says G1 X40 Y20.', 'कमरे के उस पार से B पर रख दिया। ऐसी छोटी आदेश भाषा (एक अक्षर और एक संख्या) से बहुत से असली रोबोट और 3D प्रिंटर चलते हैं: प्रिंटर का G-code कहता है G1 X40 Y20।', 'Kamre ke us paar se B par rakh diya. Aisi chhoti aadesh bhasha (ek akshar aur ek sankhya) se bahut se asli robot aur 3D printer chalte hain: printer ka G-code kehta hai G1 X40 Y20.') },
    ],
    check: [(S) => (S.conn('VIN', 'GND') || S.conn('3V3', 'GND') ? [W.short] : null), (S) => (S.conn('psu.P', 'rail:bp') && S.conn('psu.N', 'rail:bn') ? null : [X.psuRail]), (S) => (S.conn('psu.N', 'GND') ? null : [XB.espGnd]),
      (S) => (Object.keys(ESERVO).some((k) => S.conn(k + '.SIG', 'D12')) ? [XB.gpio12] : null),
      ...Object.keys(ESERVO).map((k) => need(k + '.SIG', 'D' + ESERVO[k], W.toPin, { x: t3(sv[k].en + '\'s orange wire', sv[k].hi + ' का नारंगी तार', sv[k].hg + ' ka orange wire'), p: ESERVO[k] }))],
    done: (S) => okParse(S.runSrc) && S.w('placed') });

  // 4 ---------------------------------------------------------------------------------------------- delivery robot
  const CARPARTS = [F('drv', 'l298n', {}, -35, 105, 0), F('bat', 'bat18650', {}, -190, 108, 0), F('mL', 'bomotor', { side: 'L' }, -80, 152, 3), F('mR', 'bomotor', { side: 'R' }, 10, 152, 1)];
  const CARWIRES = [['T:bat:P', 'T:drv:VS'], ['T:bat:N', 'T:drv:GND'], ['T:mL:P', 'T:drv:OUT1'], ['T:mL:N', 'T:drv:OUT2'], ['T:mR:P', 'T:drv:OUT3'], ['T:mR:N', 'T:drv:OUT4'],
    ['T:drv:ENA', 'D5'], ['T:drv:ENB', 'D6'], ['T:drv:IN1', 'D7'], ['T:drv:IN2', 'D8'], ['T:drv:IN3', 'D2'], ['T:drv:IN4', 'D4'], ['GND3', 'H:tn18'], ['5V', 'H:tp30'], ['T:drv:GND', 'GND1']];
  const IRW = [['T:irL:VCC', 'H:tp35'], ['T:irL:GND', 'H:tn36'], ['T:irL:OUT', 'D11'], ['T:irR:VCC', 'H:tp41'], ['T:irR:GND', 'H:tn42'], ['T:irR:OUT', 'D12'], ['T:irM:VCC', 'H:tp45'], ['T:irM:GND', 'H:tn46'], ['T:irM:OUT', 'D9']];
  const XD = { drvGnd: t3('The L298N\'s GND must be joined to the Arduino\'s GND too (common ground).', 'L298N का GND, Arduino के GND से भी जुड़ना चाहिए (कॉमन ग्राउंड)।', 'L298N ka GND, Arduino ke GND se bhi judna chahiye (common ground).') };
  const driveChecks = [noShort, (S) => (S.conn('rail:tp', '5V') ? null : [W.vRail]), (S) => (S.conn('drv.GND', 'GND') ? null : [XD.drvGnd]),
    ...[['ENA', 5], ['ENB', 6], ['IN1', 7], ['IN2', 8], ['IN3', 2], ['IN4', 4]].map(([a, p]) => need('drv.' + a, 'D' + p, W.toPin, { x: 'L298N ' + a, p }))];
  const irChecks = (tag, pin) => [has(tag, N.ir), need(tag + '.OUT', 'D' + pin, W.toPin, { x: 'OUT', p: pin })];
  const deliverTo = (src) => { const m = /int\s+deliverTo\s*=\s*(\d+)\s*;/.exec(src || ''); return m ? +m[1] : -1; };
  const BZ = t3('buzzer', 'बज़र', 'buzzer');
  L.push({ id: 'delivery', cls: '11', view: 'carbench', wview: 'carbench', rview: 'arena', code: DELIV, drawer: ['buzzer'], serial: true, world: { kind: 'car', car: 'deliv' },
    title: t3('Delivery robot that stops at stations', 'स्टेशनों पर रुकने वाला डिलीवरी रोबोट', 'Station par rukne wala delivery robot'),
    goal: t3('Hospitals and warehouses use robots that follow a line and stop where a parcel is wanted. Ours carries the school\'s mail round a track with three stations: first it stops at every one like a bus, then it delivers only where you tell it.', 'अस्पताल और गोदाम ऐसे रोबोट इस्तेमाल करते हैं जो लाइन के साथ चलते हैं और जहाँ पार्सल चाहिए वहाँ रुकते हैं। हमारा रोबोट तीन स्टेशनों वाले ट्रैक पर स्कूल की डाक ले जाता है: पहले यह बस की तरह हर स्टेशन पर रुकता है, फिर सिर्फ़ वहीं देता है जहाँ आप कहें।', 'Aspatal aur godown aise robot istemaal karte hain jo line ke saath chalte hain aur jahan parcel chahiye wahan rukte hain. Hamara robot teen station wale track par school ki daak le jaata hai: pehle yeh bus ki tarah har station par rukta hai, phir sirf wahin deta hai jahan aap kahein.'),
    setup: { parts: [...CARPARTS, F('irL', 'ir', {}, 140, 62, 2), F('irR', 'ir', {}, 178, 62, 2), F('irM', 'ir', {}, 104, 62, 2)], wires: [...CARWIRES, ...IRW] },
    steps: [
      { k: 'info', do: t3('Ready on the bench: the line-follower car (sensors on pins 11 and 12) with a third IR sensor on its left side (pin 9) for the stations\' marks. Your job: a chime, so people know the robot has arrived.', 'बेंच पर तैयार: लाइन फ़ॉलोअर कार (सेंसर पिन 11 और 12 पर) और उसकी बाईं तरफ़ स्टेशनों के निशान के लिए तीसरा IR सेंसर (पिन 9)। आपका काम: एक घंटी, ताकि लोगों को पता चले कि रोबोट आ गया।', 'Bench par taiyaar: line follower car (sensor pin 11 aur 12 par) aur uski left taraf station ke nishaan ke liye teesra IR sensor (pin 9). Aapka kaam: ek ghanti, taaki logon ko pata chale ki robot aa gaya.'),
        see: t3('In the 🏁 Robot view: the track with STATION 1, 2 and 3, each a black mark beside the line.', '🏁 रोबोट व्यू में: STATION 1, 2 और 3 वाला ट्रैक, हर एक लाइन के पास एक काला निशान।', '🏁 Robot view mein: STATION 1, 2 aur 3 wala track, har ek line ke paas ek kaala nishaan.') },
      { k: 'place', place: P('bz1', 'buzzer', {}, 'e20', 0), do: t3('Put the buzzer at the ghost: its + leg in column 20.', 'बज़र को नीली आकृति पर लगाइए: इसका + पैर कॉलम 20 में।', 'Buzzer ko neeli shape par lagaiye: iska + pair column 20 mein.'), see: E },
      w3('bz1.P', 'D10', 'Wire its + leg (column 20) to pin 10.', 'इसके + पैर (कॉलम 20) को पिन 10 से जोड़िए।', 'Iske + pair (column 20) ko pin 10 se jodiye.'),
      w3('bz1.N', 'rail:tn', 'Its − leg (column 23) to the − rail.', 'इसका − पैर (कॉलम 23) − रेल से।', 'Iska − pair (column 23) − rail se.'),
      CHECK,
      { k: 'info', code: [43, 58], do: t3('Read loop(): it counts a station only at the moment the side sensor reaches its mark (HIGH now, not before), as the lap counter did. Then it stops for 3 s and chimes, if deliverTo is 0 or that station\'s number.', 'loop() पढ़िए: यह स्टेशन तभी गिनता है जब बगल वाला सेंसर उसके निशान पर पहुँचता है (अभी HIGH, पहले नहीं), जैसे लैप काउंटर ने किया। फिर अगर deliverTo 0 हो या उसी स्टेशन का नंबर, तो 3 s रुककर घंटी बजाता है।', 'loop() padhiye: yeh station tabhi ginta hai jab bagal wala sensor uske nishaan par pahunchta hai (abhi HIGH, pehle nahi), jaise lap counter ne kiya. Phir agar deliverTo 0 ho ya usi station ka number, to 3 s ruk kar ghanti bajata hai.'), see: E },
      { k: 'run', do: t3('Press Run.', '"चलाइए" दबाइए।', 'Run dabaiye.'), see: t3('Run puts the car at START.', '"चलाइए" कार को START पर रखता है।', 'Run car ko START par rakhta hai.') },
      { k: 'watch', until: (S) => fresh(S) && [1, 2, 3].every((i) => S.w('stop' + i)), do: t3('Watch one round, and the Serial Monitor.', 'एक चक्कर देखिए, और सीरियल मॉनिटर।', 'Ek chakkar dekhiye, aur Serial Monitor.'),
        see: t3('It stops at every station for 3 s, with a chime: like a bus. Fine for a mail round, slow when only one parcel is for station 2.', 'यह हर स्टेशन पर 3 s रुकता है, घंटी के साथ: बस की तरह। डाक बाँटने के लिए ठीक, पर जब सिर्फ़ एक पार्सल स्टेशन 2 का हो तो धीमा।', 'Yeh har station par 3 s rukta hai, ghanti ke saath: bus ki tarah. Daak baantne ke liye theek, par jab sirf ek parcel station 2 ka ho to dheema.') },
      { k: 'edit', test: (src) => deliverTo(src) === 2, set: [[/int deliverTo = 0;/, 'int deliverTo = 2;']],
        do: t3('Today\'s parcel is for station 2 (the science lab): change deliverTo = 0 to deliverTo = 2, and press Run.', 'आज का पार्सल स्टेशन 2 (साइंस लैब) का है: deliverTo = 0 को deliverTo = 2 कीजिए, और "चलाइए" दबाइए।', 'Aaj ka parcel station 2 (science lab) ka hai: deliverTo = 0 ko deliverTo = 2 karo, aur Run dabaiye.'), see: E },
      { k: 'watch', until: (S) => fresh(S) && S.w('stop2') && S.w('pass1') && S.w('pass3'), do: t3('Watch the round again.', 'चक्कर फिर देखिए।', 'Chakkar phir dekhiye.'),
        see: t3('It counts station 1 and drives on, stops only at 2 and chimes, and drives past 3 back towards START: the robot knows where it is by counting marks. If someone lifted it and put it down further on, its count would be wrong: real ones read a barcode or an RFID tag at each station.', 'यह स्टेशन 1 गिनकर आगे बढ़ता है, सिर्फ़ 2 पर रुककर घंटी बजाता है, और 3 के आगे से START की ओर निकल जाता है: रोबोट निशान गिनकर जानता है कि वह कहाँ है। अगर कोई इसे उठाकर आगे रख दे, तो इसकी गिनती ग़लत हो जाएगी: असली रोबोट हर स्टेशन पर बारकोड या RFID टैग पढ़ते हैं।', 'Yeh station 1 gin kar aage badhta hai, sirf 2 par ruk kar ghanti bajata hai, aur 3 ke aage se START ki or nikal jaata hai: robot nishaan gin kar jaanta hai ki woh kahan hai. Agar koi ise utha kar aage rakh de, to iski ginti galat ho jaayegi: asli robot har station par barcode ya RFID tag padhte hain.') },
    ],
    check: [...driveChecks, ...irChecks('irL', 11), ...irChecks('irR', 12), ...irChecks('irM', 9), has('bz1', BZ), need('bz1.P', 'D10', W.toPin, { x: t3('buzzer\'s + leg', 'बज़र का + पैर', 'buzzer ka + pair'), p: 10 }), need('bz1.N', 'GND', W.toGnd, { x: t3('buzzer\'s − leg', 'बज़र का − पैर', 'buzzer ka − pair') })],
    done: (S) => deliverTo(S.runSrc) === 2 && S.w('stop2') && S.w('pass1') && S.w('pass3') });

  for (const l of L) { l.n = ++n; l.batch = 23; }
  return L;
}
