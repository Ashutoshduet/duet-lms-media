// DUET Robotics Lab 360, batch 18: the last Class 9 session, written fresh for DUET (same shape as lessons14.js):
//   mazecar   a maze-solving robot on the Uno: the left-hand rule. Two HC-SR04 look ahead and to the left, an IR sensor
//             under the nose sees the black FINISH square. A way on the left: take it; else go on; else turn right. It
//             goes into the dead end, turns round and comes out, with no map. At full speed its timed right turn swings
//             far past 90° and it bumps about; in maze B FINISH is inside an island of walls and it goes round and round. robots.js (MAZE, CarSim) runs the maze; devtools/test/robocore18.mjs plays it.
const t3 = (en, hi, hg) => ({ en, hi, hg });

const DRIVE = `const int ENA = 5, IN1 = 7, IN2 = 8;    // motor A: the left wheel
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
const PINS = `  pinMode(ENA, OUTPUT); pinMode(IN1, OUTPUT); pinMode(IN2, OUTPUT);
  pinMode(ENB, OUTPUT); pinMode(IN3, OUTPUT); pinMode(IN4, OUTPUT);`;

export const MAZEC = `// Maze-solving robot: the left-hand rule.
// Walk through a maze with your left hand always on the wall, and you come out
// (if all its walls join up). Two HC-SR04 look ahead and to the left, and an IR
// sensor under the nose sees the black FINISH square.
${DRIVE}
const int trigF = 9, echoF = 10;     // the sensor that looks ahead
const int trigL = 11, echoL = 12;    // the sensor that looks left
const int finish = 3;                // IR under the nose: HIGH over the black square
int speed = 130;     // 0 .. 255
int wall = 15;       // cm: keep the left wall this far away
int open = 30;       // cm: more than this on the left: a way opens there
int stopAt = 10;     // cm: a wall this close ahead: turn right
bool out = false;
int last = 0;

int distanceCm(int trig, int echo) {
  digitalWrite(trig, LOW);
  delayMicroseconds(2);
  digitalWrite(trig, HIGH);
  delayMicroseconds(10);
  digitalWrite(trig, LOW);
  long t = pulseIn(echo, HIGH, 30000);   // wait at most 30 ms
  if (t == 0) return 400;                // no echo: nothing near
  return t * 0.034 / 2;
}

// say on the Serial Monitor what the robot does, when it changes
void tell(int now) {
  if (now == last) return;
  last = now;
  if (now == 1) Serial.println("Way on the left: turn left");
  if (now == 2) Serial.println("Wall on the left: go on");
  if (now == 3) Serial.println("Wall ahead: turn right");
}

void setup() {
${PINS}
  pinMode(trigF, OUTPUT); pinMode(echoF, INPUT);
  pinMode(trigL, OUTPUT); pinMode(echoL, INPUT);
  pinMode(finish, INPUT);
  Serial.begin(9600);
  delay(1000);                           // a second to stand still, then go
}

void loop() {
  if (out) return;                       // out of the maze: stay stopped
  if (digitalRead(finish) == HIGH) {     // on the black square
    drive(0, 0);
    Serial.println("FINISH! Out of the maze");
    out = true;
    return;
  }
  int ahead = distanceCm(trigF, echoF);
  int left = distanceCm(trigL, echoL);
  if (left > open) {                     // 1. a way on the left: take it
    tell(1);
    drive(speed / 2, speed);             //    (a curve to the left)
  } else if (ahead > stopAt) {           // 2. no way left, but ahead is clear: go on,
    tell(2);
    int err = left - wall;               //    steering to keep the wall 'wall' cm away
    drive(speed - 6 * err, speed + 6 * err);
  } else {                               // 3. walls left and ahead: turn right
    tell(3);
    drive(speed, -speed);
    delay(300);
  }
}
`;

export function batch18(K, n0) {
  const { P, F, W, need, has, noShort, N } = K;
  const E = t3('', '', '');
  const CARPARTS = [F('drv', 'l298n', {}, -35, 105, 0), F('bat', 'bat18650', {}, -190, 108, 0), F('mL', 'bomotor', { side: 'L' }, -80, 152, 3), F('mR', 'bomotor', { side: 'R' }, 10, 152, 1)];
  const CARWIRES = [['T:bat:P', 'T:drv:VS'], ['T:bat:N', 'T:drv:GND'], ['T:mL:P', 'T:drv:OUT1'], ['T:mL:N', 'T:drv:OUT2'], ['T:mR:P', 'T:drv:OUT3'], ['T:mR:N', 'T:drv:OUT4'],
    ['T:drv:ENA', 'D5'], ['T:drv:ENB', 'D6'], ['T:drv:IN1', 'D7'], ['T:drv:IN2', 'D8'], ['T:drv:IN3', 'D2'], ['T:drv:IN4', 'D4'], ['GND3', 'H:tn18'], ['5V', 'H:tp30']];
  const X = {
    drvGnd: t3('The L298N\'s GND must be joined to the Arduino\'s GND too (common ground), or IN1–IN4 mean nothing to it.', 'L298N का GND, Arduino के GND से भी जुड़ना चाहिए (कॉमन ग्राउंड), वरना IN1–IN4 का उसके लिए कोई मतलब नहीं।', 'L298N ka GND, Arduino ke GND se bhi judna chahiye (common ground), warna IN1–IN4 ka uske liye koi matlab nahi.'),
    usSwap: t3('The left sensor\'s Trig and Echo are swapped: Trig (column 41) goes to pin 11, Echo (column 42) to pin 12.', 'बाएँ सेंसर के Trig और Echo उलट गए हैं: Trig (कॉलम 41) पिन 11 पर, Echo (कॉलम 42) पिन 12 पर।', 'Left sensor ke Trig aur Echo ulat gaye hain: Trig (column 41) pin 11 par, Echo (column 42) pin 12 par.'),
  };
  const driveChecks = [noShort, (S) => (S.conn('rail:tp', '5V') ? null : [W.vRail]), (S) => (S.conn('drv.GND', 'GND') ? null : [X.drvGnd]),
    ...[['ENA', 5], ['ENB', 6], ['IN1', 7], ['IN2', 8], ['IN3', 2], ['IN4', 4]].map(([a, p]) => need('drv.' + a, 'D' + p, W.toPin, { x: 'L298N ' + a, p }))];
  const fresh = (S) => S.running() && S.fresh();
  const speedOf = (src) => { const m = /int\s+speed\s*=\s*(\d+)\s*;/.exec(src || ''); return m ? +m[1] : 0; };
  const US = t3('ultrasonic sensor', 'अल्ट्रासोनिक सेंसर', 'ultrasonic sensor');
  let n = n0;
  const L = [
    { id: 'mazecar', cls: '9', view: 'carbench', wview: 'carbench', rview: 'arenamaze', code: MAZEC, drawer: ['hcsr04'], serial: true, world: { kind: 'car', car: 'maze' },
      title: t3('Maze-solving robot (left-hand rule)', 'भूलभुलैया सुलझाने वाला रोबोट (बाएँ हाथ का नियम)', 'Maze solve karne wala robot (left hand rule)'),
      goal: t3('A robot finds its way out of a plywood maze with no map, by one old rule: keep your left hand on the wall. One ultrasonic sensor looks ahead, one looks left, and an IR sensor under its nose sees the black FINISH square.', 'एक रोबोट बिना नक्शे के प्लाईवुड की भूलभुलैया से बाहर निकलता है, एक पुराने नियम से: अपना बायाँ हाथ दीवार पर रखो। एक अल्ट्रासोनिक सेंसर आगे देखता है, एक बाएँ, और नाक के नीचे का IR सेंसर काला FINISH चौकोर देखता है।', 'Ek robot bina naqshe ke plywood ki bhool-bhulaiya se bahar nikalta hai, ek purane niyam se: apna left haath deewar par rakho. Ek ultrasonic sensor aage dekhta hai, ek left, aur naak ke neeche ka IR sensor kaala FINISH square dekhta hai.'),
      setup: { parts: [...CARPARTS, P('us1', 'hcsr04', {}, 'j50', 0), F('irM', 'ir', {}, 178, 62, 2)],
        wires: [...CARWIRES, ['H:f50', 'H:tp41'], ['H:f51', 'D9'], ['H:f52', 'D10'], ['H:f53', 'H:tn44'], ['T:irM:VCC', 'H:tp35'], ['T:irM:GND', 'H:tn36'], ['T:irM:OUT', 'D3']] },
      steps: [
        { k: 'info', do: t3('The robot stands at START in a maze of 4 × 3 rooms, each 45 cm (the 🏁 Robot view). Ready on the bench: its drive (pins 5, 6, 7, 8, 2, 4), the front ultrasonic sensor on pins 9 and 10, and the IR sensor under its nose on pin 3.', 'रोबोट 4 × 3 कमरों की भूलभुलैया में START पर खड़ा है, हर कमरा 45 cm (🏁 रोबोट व्यू)। बेंच पर तैयार: इसकी ड्राइव (पिन 5, 6, 7, 8, 2, 4), आगे वाला अल्ट्रासोनिक सेंसर पिन 9 और 10 पर, और नाक के नीचे वाला IR सेंसर पिन 3 पर।', 'Robot 4 × 3 kamron ki bhool-bhulaiya mein START par khada hai, har kamra 45 cm (🏁 Robot view). Bench par taiyaar: iski drive (pin 5, 6, 7, 8, 2, 4), aage wala ultrasonic sensor pin 9 aur 10 par, aur naak ke neeche wala IR sensor pin 3 par.'),
          see: t3('The left-hand rule, in order: if there is a way on the left, take it; if not, and the way ahead is clear, go on; if not, turn right. A dead end is just "turn right" twice.', 'बाएँ हाथ का नियम, इसी क्रम में: बाएँ रास्ता हो तो उधर जाओ; न हो, और आगे रास्ता खुला हो, तो चलते रहो; वह भी न हो तो दाएँ मुड़ो। बंद गली बस दो बार "दाएँ मुड़ो" है।', 'Left hand rule, isi kram mein: left raasta ho to udhar jao; na ho, aur aage raasta khula ho, to chalte raho; woh bhi na ho to right mudo. Band gali bas do baar "right mudo" hai.') },
        { k: 'wire', wire: ['drv.GND', 'GND1'], do: t3('One wire is missing: join the L298N\'s GND terminal to a GND pin of the Arduino.', 'एक वायर बाकी है: L298N के GND टर्मिनल को Arduino के किसी GND पिन से जोड़िए।', 'Ek wire baaki hai: L298N ke GND terminal ko Arduino ke kisi GND pin se jodiye.'),
          see: t3('Common ground: the driver and the Arduino now agree what 0 V is.', 'कॉमन ग्राउंड: अब ड्राइवर और Arduino मानते हैं कि 0 V क्या है।', 'Common ground: ab driver aur Arduino maante hain ki 0 V kya hai.') },
        { k: 'place', place: P('us2', 'hcsr04', {}, 'j40', 0), do: t3('The robot\'s left eye: plug a second ultrasonic sensor into 40j–43j.', 'रोबोट की बाईं आँख: दूसरा अल्ट्रासोनिक सेंसर 40j–43j में लगाइए।', 'Robot ki left aankh: doosra ultrasonic sensor 40j–43j mein lagaiye.'),
          see: t3('On the car it sits on the left edge, looking straight out to the left at the wall.', 'कार पर यह बाएँ किनारे पर लगा है, सीधे बाईं ओर दीवार को देखता हुआ।', 'Car par yeh left kinaare par laga hai, seedhe left ki taraf deewar ko dekhta hua.') },
        { k: 'wire', wire: ['us2.VCC', 'rail:tp'], do: t3('Its VCC (column 40) to the + rail.', 'इसका VCC (कॉलम 40) + रेल से।', 'Iska VCC (column 40) + rail se.'), see: E },
        { k: 'wire', wire: ['us2.TRIG', 'D11'], do: t3('Trig (column 41) to pin 11.', 'Trig (कॉलम 41) पिन 11 से।', 'Trig (column 41) pin 11 se.'), see: E },
        { k: 'wire', wire: ['us2.ECHO', 'D12'], do: t3('Echo (column 42) to pin 12.', 'Echo (कॉलम 42) पिन 12 से।', 'Echo (column 42) pin 12 se.'), see: E },
        { k: 'wire', wire: ['us2.GND', 'rail:tn'], do: t3('GND (column 43) to the − rail.', 'GND (कॉलम 43) − रेल से।', 'GND (column 43) − rail se.'), see: E },
        { k: 'check', do: t3('Check your circuit.', 'अपना सर्किट जाँचिए।', 'Apna circuit check karo.'), see: E },
        { k: 'run', do: t3('Press Run, and open the Serial Monitor.', '"चलाइए" दबाइए, और सीरियल मॉनिटर खोलिए।', 'Run dabaiye, aur Serial Monitor kholiye.'), see: t3('Run puts the robot at START.', '"चलाइए" रोबोट को START पर रखता है।', 'Run robot ko START par rakhta hai.') },
        { k: 'watch', until: (S) => fresh(S) && S.w('solved'), do: t3('Watch the robot find its way, and what it says on the Serial Monitor.', 'रोबोट को रास्ता ढूँढते देखिए, और सीरियल मॉनिटर पर यह क्या कहता है।', 'Robot ko raasta dhoondhte dekhiye, aur Serial Monitor par yeh kya kehta hai.'),
          see: t3('It took every way on the left, even the one into the dead end: there it turned right twice and came back out. It never knew where FINISH was, and needed no map. Count the rooms it went through in the panel.', 'इसने बाईं ओर का हर रास्ता लिया, बंद गली वाला भी: वहाँ यह दो बार दाएँ मुड़ा और वापस निकल आया। इसे कभी पता नहीं था कि FINISH कहाँ है, और नक्शे की ज़रूरत नहीं पड़ी। पैनल में गिनिए कि यह कितने कमरों से गुज़रा।', 'Isne left ka har raasta liya, band gali wala bhi: wahan yeh do baar right muda aur wapas nikal aaya. Ise kabhi pata nahi tha ki FINISH kahan hai, aur naqshe ki zaroorat nahi padi. Panel mein giniye ki yeh kitne kamron se guzra.') },
        { k: 'edit', test: (src) => speedOf(src) >= 245, set: [[/int speed = 130;/, 'int speed = 255;']], do: t3('Race it at full speed: change speed = 130 to speed = 255 and press Run.', 'इसे पूरी रफ़्तार पर दौड़ाइए: speed = 130 को speed = 255 कीजिए और "चलाइए" दबाइए।', 'Ise poori speed par daudaiye: speed = 130 ko speed = 255 karo aur Run dabaiye.'), see: E },
        { k: 'watch', until: (S) => fresh(S) && S.w('bump'), do: t3('Watch the first corner.', 'पहला मोड़ देखिए।', 'Pehla mod dekhiye.'),
          see: t3('Bang! The right turn is timed: 300 ms of spinning. At full speed 300 ms swings it far past a quarter turn, and its curves go wider: it loses the wall, wanders back the way it came and hits a wall. A timed turn is right only at the speed it was tuned for.', 'धड़ाम! दाएँ मुड़ना समय से है: 300 ms तक घूमना। पूरी रफ़्तार पर 300 ms में यह चौथाई चक्कर से बहुत आगे घूम जाता है, और इसके मोड़ चौड़े हो जाते हैं: दीवार छूट जाती है, यह आए हुए रास्ते पर लौटता है और दीवार से टकरा जाता है। समय वाला मोड़ उसी रफ़्तार पर सही है जिस पर उसे सेट किया गया था।', 'Dhadaam! Right mudna time se hai: 300 ms tak ghoomna. Poori speed par 300 ms mein yeh chauthai chakkar se bahut aage ghoom jaata hai, aur iske mod chaude ho jaate hain: deewar chhoot jaati hai, yeh aaye hue raaste par lautta hai aur deewar se takra jaata hai. Time wala mod usi speed par sahi hai jis par use set kiya gaya tha.') },
        { k: 'edit', test: (src) => { const s = speedOf(src); return s >= 100 && s <= 200; }, set: [[/int speed = 255;/, 'int speed = 150;']], do: t3('Choose a speed it can handle: speed = 150, and Run.', 'ऐसी रफ़्तार चुनिए जो यह सँभाल सके: speed = 150, और "चलाइए"।', 'Aisi speed chuniye jo yeh sambhaal sake: speed = 150, aur Run.'), see: E },
        { k: 'watch', until: (S) => fresh(S) && S.w('solved') && S.wv('solvedBumps') === 0, do: t3('Watch it come out of the maze without a bump.', 'इसे बिना टक्कर भूलभुलैया से निकलते देखिए।', 'Ise bina takkar bhool-bhulaiya se nikalte dekhiye.'),
          see: t3('Out, with no bump, and quicker than at 130. Contest robots also turn by their sensors or wheel encoders, not by time, so the turn stays right at any speed.', 'बाहर, बिना टक्कर, और 130 से जल्दी। प्रतियोगिता वाले रोबोट समय से नहीं, सेंसरों या पहियों के एनकोडर से मुड़ते हैं, ताकि हर रफ़्तार पर मोड़ सही रहे।', 'Bahar, bina takkar, aur 130 se jaldi. Competition wale robot time se nahi, sensors ya pahiyon ke encoder se mudte hain, taaki har speed par mod sahi rahe.') },
        { k: 'act', until: (S) => fresh(S) && S.w('loop'), do: t3('Now a harder maze: in the panel choose maze B (FINISH in the middle) and press Run.', 'अब एक मुश्किल भूलभुलैया: पैनल में भूलभुलैया B चुनिए (FINISH बीच में) और "चलाइए" दबाइए।', 'Ab ek mushkil bhool-bhulaiya: panel mein bhool-bhulaiya B chuniye (FINISH beech mein) aur Run dabaiye.'),
          see: t3('Round it goes, and back to START: it never gets to FINISH! FINISH sits inside a C of walls that touches no other wall, an island. A hand on the left wall only ever goes round the walls joined to that wall. To find the middle, a robot must remember where it has been and map the maze: micromouse contests (and the Trémaux and flood-fill methods) do just that.', 'यह घूमता है, और वापस START पर: FINISH तक कभी नहीं पहुँचता! FINISH दीवारों के एक C के अंदर है, जो किसी और दीवार को नहीं छूता: एक टापू। बाईं दीवार पर रखा हाथ बस उस दीवार से जुड़ी दीवारों के चारों ओर घूमता है। बीच तक पहुँचने के लिए रोबोट को याद रखना होता है कि वह कहाँ-कहाँ गया, और भूलभुलैया का नक्शा बनाना होता है: माइक्रोमाउस प्रतियोगिताएँ (और Trémaux और flood-fill तरीक़े) यही करती हैं।', 'Yeh ghoomta hai, aur wapas START par: FINISH tak kabhi nahi pahunchta! FINISH deewaron ke ek C ke andar hai, jo kisi aur deewar ko nahi chhoota: ek tapu. Left deewar par rakha haath bas us deewar se judi deewaron ke chaaron or ghoomta hai. Beech tak pahunchne ke liye robot ko yaad rakhna hota hai ki woh kahan-kahan gaya, aur bhool-bhulaiya ka naqsha banana hota hai: micromouse competitions (aur Trémaux aur flood-fill tareeke) yahi karti hain.') },
      ],
      check: [...driveChecks, (S) => (S.conn('rail:tn', 'GND') ? null : [W.gndRail]),
        has('us2', US), (S) => (S.conn('us2.TRIG', 'D12') && S.conn('us2.ECHO', 'D11') ? [X.usSwap] : null),
        need('us2.VCC', '5V', W.to5v, { x: 'VCC' }), need('us2.GND', 'GND', W.toGnd, { x: 'GND' }), need('us2.TRIG', 'D11', W.toPin, { x: 'Trig', p: 11 }), need('us2.ECHO', 'D12', W.toPin, { x: 'Echo', p: 12 }),
        has('us1', US), need('us1.TRIG', 'D9', W.toPin, { x: 'Trig', p: 9 }), need('us1.ECHO', 'D10', W.toPin, { x: 'Echo', p: 10 }), has('irM', N.ir), need('irM.OUT', 'D3', W.toPin, { x: 'OUT', p: 3 })],
      tick: (S) => { if (S.w('solved') && S.wv('solvedBumps') === 0 && speedOf(S.runSrc) >= 140) S.mem.cleanOut = true; },
      done: (S) => !!S.mem.cleanOut && S.w('loop') },
  ];
  for (const l of L) { l.n = ++n; l.batch = 18; }
  return L;
}
