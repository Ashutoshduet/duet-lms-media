// DUET Robotics Lab 360, batch 14: the robot car sessions of Class 7 still to come, written fresh for DUET (same shape as
// lessons2.js; robots.js and worlds.js run the cars, devtools/test/robocore14.mjs plays every one):
//   edgecar   a table robot: two IR sensors at the front corners look down; past the edge of the desk nothing comes back.
//             Too fast and it cannot stop in time: it rolls over the edge and falls 75 cm to the floor (and lies there).
//   lightcar  a light-seeker: two LDRs look a little left and a little right; it steers to the brighter side, stops at the
//             torch, and spins to look round when everything is dark. Move the torch and it finds it again.
//   dancecar  a dancing robot: a routine of timed moves. A timed spin is never exactly a full turn: tune spinTime until
//             the panel says 360°, as robot dancers calibrate on the real floor.
//   lapcar    the line follower with a third IR sensor on its side that sees a short black marker beside the start line:
//             it counts laps and times them with millis().
const t3 = (en, hi, hg) => ({ en, hi, hg });

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
}`;
const PINS = `  pinMode(ENA, OUTPUT); pinMode(IN1, OUTPUT); pinMode(IN2, OUTPUT);
  pinMode(ENB, OUTPUT); pinMode(IN3, OUTPUT); pinMode(IN4, OUTPUT);`;

const EDGE = `// Table robot: two IR sensors at the front corners look down at the desk.
// Over the desk, light comes back and OUT is LOW; past the edge nothing comes back: OUT is HIGH.
${DRIVE}
const int irLeft = 11, irRight = 12;
int speed = 120;    // 0 .. 255

void setup() {
${PINS}
  pinMode(irLeft, INPUT);
  pinMode(irRight, INPUT);
}

void loop() {
  int L = digitalRead(irLeft);
  int R = digitalRead(irRight);
  if (L == HIGH || R == HIGH) {         // an edge!
    drive(0, 0);                        // stop
    delay(200);
    drive(-speed, -speed);              // back away from it
    delay(400);
    if (L == HIGH) {
      drive(speed, -speed);             // edge on the left: spin right
    } else {
      drive(-speed, speed);             // edge on the right: spin left
    }
    delay(350);
  } else {
    drive(speed, speed);                // the desk goes on: forward
  }
}
`;
const LIGHT = `// Light-seeking robot: two LDRs at the front, one looking a little left, one a little right.
// It turns towards the brighter side, like a moth to a lamp, and stops when the light is very near.
${DRIVE}
int speed = 140;
int near = 940;     // brighter than this (0 .. 1023): it has arrived
int dark = 300;     // darker than this on both sides: no light in front

void setup() {
${PINS}
  Serial.begin(9600);
}

void loop() {
  int left = analogRead(A0);     // the left LDR: bright light, big number
  int right = analogRead(A1);    // the right LDR
  Serial.print(left);
  Serial.print(" ");
  Serial.println(right);
  if (left > near || right > near) {
    drive(0, 0);                         // at the light: stop
  } else if (left < dark && right < dark) {
    drive(speed, -speed);                // dark all round: spin and look
  } else if (left > right + 40) {
    drive(speed / 4, speed);             // brighter on the left: turn left
  } else if (right > left + 40) {
    drive(speed, speed / 4);             // brighter on the right: turn right
  } else {
    drive(speed, speed);                 // about the same: straight on
  }
  delay(20);
}
`;
const DANCE = `// Dancing robot: a routine of timed moves, like the steps on a dance chart.
// Forward, back, a spin each way, a wiggle, a bow; then the dance again.
${DRIVE}
int speed = 150;
int spinTime = 600;    // ms of spinning: tune it until the spin is one full turn

void step(int left, int right, int ms) {
  drive(left, right);
  delay(ms);
  drive(0, 0);
  delay(300);          // a pause between the steps, on the beat
}

void setup() {
${PINS}
}

void loop() {
  step(speed, speed, 700);          // forward
  step(-speed, -speed, 700);        // back
  step(-speed, speed, spinTime);    // spin left
  step(speed, -speed, spinTime);    // spin right
  for (int i = 0; i < 3; i++) {     // the wiggle
    step(speed, -speed, 120);
    step(-speed, speed, 120);
  }
  delay(1500);                      // the bow
}
`;
const LAP = `// Lap counter: the line follower, and a third IR sensor on the car's left side.
// Beside the start line lies a short black marker: each time the side sensor passes it, one lap.
${DRIVE}
const int irLeft = 11, irRight = 12, irMark = 9;
int speed = 110;
int turn = 0;
int laps = 0;
unsigned long lastLap = 0;   // millis() at the last marker
bool onMark = false;

void setup() {
${PINS}
  pinMode(irLeft, INPUT);
  pinMode(irRight, INPUT);
  pinMode(irMark, INPUT);
  Serial.begin(9600);
}

void loop() {
  int L = digitalRead(irLeft);
  int R = digitalRead(irRight);
  if (L == LOW && R == LOW) {
    drive(speed, speed);
  } else if (L == HIGH && R == LOW) {
    drive(turn, speed);
  } else if (L == LOW && R == HIGH) {
    drive(speed, turn);
  } else {
    drive(0, 0);
  }
  int M = digitalRead(irMark);                     // HIGH over the black marker
  if (M == HIGH && !onMark) {                      // it has just reached it
    if (lastLap > 0) {
      laps = laps + 1;
      Serial.print("Lap ");
      Serial.print(laps);
      Serial.print(" time ");
      Serial.print((millis() - lastLap) / 1000.0);
      Serial.println(" s");
    } else {
      Serial.println("Start!");
    }
    lastLap = millis();
  }
  onMark = (M == HIGH);
}
`;
export const BATCH14_CODE = { EDGE, LIGHT, DANCE, LAP };

export function batch14(K, n0) {
  const { P, F, W, need, has, noShort, N } = K;
  const E = t3('', '', '');
  const X = {
    drvGnd: t3('The L298N\'s GND must be joined to the Arduino\'s GND too (common ground), or IN1–IN4 mean nothing to it.', 'L298N का GND, Arduino के GND से भी जुड़ना चाहिए (कॉमन ग्राउंड), वरना IN1–IN4 का उसके लिए कोई मतलब नहीं।', 'L298N ka GND, Arduino ke GND se bhi judna chahiye (common ground), warna IN1–IN4 ka uske liye koi matlab nahi.'),
    ldr: t3('The {x} LDR needs its divider: one leg to the + rail, the other to {a} and through 10 kΩ to the − rail.', '{x} एलडीआर को डिवाइडर चाहिए: एक पैर + रेल पर, दूसरा {a} पर और 10 kΩ से होकर − रेल पर।', '{x} LDR ko divider chahiye: ek pair + rail par, doosra {a} par aur 10 kΩ se hokar − rail par.'),
    swapLdr: t3('The two LDRs are swapped: the left one must go to A0 and the right one to A1, or the robot turns away from the light.', 'दोनों एलडीआर उलट गए हैं: बायाँ A0 पर और दायाँ A1 पर जाना चाहिए, वरना रोबोट रोशनी से दूर मुड़ेगा।', 'Dono LDR ulat gaye hain: left A0 par aur right A1 par jaana chahiye, warna robot roshni se door mudega.'),
  };
  const CARPARTS = [F('drv', 'l298n', {}, -35, 105, 0), F('bat', 'bat18650', {}, -190, 108, 0), F('mL', 'bomotor', { side: 'L' }, -80, 152, 3), F('mR', 'bomotor', { side: 'R' }, 10, 152, 1)];
  const CARWIRES = [['T:bat:P', 'T:drv:VS'], ['T:bat:N', 'T:drv:GND'], ['T:mL:P', 'T:drv:OUT1'], ['T:mL:N', 'T:drv:OUT2'], ['T:mR:P', 'T:drv:OUT3'], ['T:mR:N', 'T:drv:OUT4'],
    ['T:drv:ENA', 'D5'], ['T:drv:ENB', 'D6'], ['T:drv:IN1', 'D7'], ['T:drv:IN2', 'D8'], ['T:drv:IN3', 'D2'], ['T:drv:IN4', 'D4'], ['GND3', 'H:tn18'], ['5V', 'H:tp30']];
  const GNDW = ['T:drv:GND', 'GND1'];
  const driveChecks = [noShort, (S) => (S.conn('rail:tp', '5V') ? null : [W.vRail]), (S) => (S.conn('drv.GND', 'GND') ? null : [X.drvGnd]),
    ...[['ENA', 5], ['ENB', 6], ['IN1', 7], ['IN2', 8], ['IN3', 2], ['IN4', 4]].map(([a, p]) => need('drv.' + a, 'D' + p, W.toPin, { x: 'L298N ' + a, p }))];
  const gndStep = { k: 'wire', wire: ['drv.GND', 'GND1'], do: t3('One wire is missing: join the L298N\'s GND terminal to a GND pin of the Arduino.', 'एक वायर बाकी है: L298N के GND टर्मिनल को Arduino के किसी GND पिन से जोड़िए।', 'Ek wire baaki hai: L298N ke GND terminal ko Arduino ke kisi GND pin se jodiye.'),
    see: t3('Common ground: the driver and the Arduino now agree what 0 V is, so HIGH and LOW mean the same to both.', 'कॉमन ग्राउंड: अब ड्राइवर और Arduino मानते हैं कि 0 V क्या है, तो HIGH और LOW दोनों के लिए एक ही हैं।', 'Common ground: ab driver aur Arduino maante hain ki 0 V kya hai, to HIGH aur LOW dono ke liye ek hi hain.') };
  const irUnit = (tag, pin, side) => [
    { k: 'wire', wire: [tag + '.VCC', 'rail:tp'], do: t3(`Wire the ${side.en} sensor's VCC to the + rail.`, `${side.hi} सेंसर का VCC + रेल से जोड़िए।`, `${side.hg} sensor ka VCC + rail se jodiye.`), see: E },
    { k: 'wire', wire: [tag + '.GND', 'rail:tn'], do: t3('Its GND to the − rail.', 'इसका GND − रेल से।', 'Iska GND − rail se.'), see: E },
    { k: 'wire', wire: [tag + '.OUT', 'D' + pin], do: t3(`Its OUT to pin ${pin}.`, `इसका OUT पिन ${pin} से।`, `Iska OUT pin ${pin} se.`), see: E },
  ];
  const irChecks = (tag, pin) => [has(tag, N.ir), need(tag + '.VCC', '5V', W.to5v, { x: 'VCC' }), need(tag + '.GND', 'GND', W.toGnd, { x: 'GND' }), need(tag + '.OUT', 'D' + pin, W.toPin, { x: 'OUT', p: pin })];
  const fresh = (S) => S.running() && S.fresh();
  const check = { k: 'check', do: t3('Check your circuit.', 'अपना सर्किट जाँचिए।', 'Apna circuit check karo.'), see: E };
  const run = (see) => ({ k: 'run', do: t3('Press Run.', '"चलाइए" दबाइए।', 'Run dabaiye.'), see: see || t3('Run puts the car at its start.', '"चलाइए" कार को उसकी शुरुआत की जगह पर रखता है।', 'Run car ko uski shuruaat ki jagah par rakhta hai.') });
  const left = t3('left', 'बाएँ', 'left'), right = t3('right', 'दाएँ', 'right');
  const speedOf = (src) => { const m = /int\s+speed\s*=\s*(\d+)\s*;/.exec(src || ''); return m ? +m[1] : 0; };
  const serLaps = (S) => (S.serLines || []).map((l) => /^Lap (\d+) time ([\d.]+) s$/.exec(String(l).trim())).filter(Boolean).map((m) => ({ n: +m[1], t: +m[2] }));
  let n = n0;
  const L = [
    // 1 ------------------------------------------------------------------------------------------------- table robot
    { id: 'edgecar', cls: '7', view: 'carbench', wview: 'carbench', rview: 'arenaedge', code: EDGE, drawer: ['ir'], world: { kind: 'car', car: 'edge' },
      title: t3('Table robot that never falls off', 'मेज़ से कभी न गिरने वाला रोबोट', 'Table se kabhi na girne wala robot'),
      goal: t3('A small robot drives about on a desk. Two IR sensors at its front corners look down: at the edge of the desk nothing comes back, and the robot must stop and turn before its wheels go over. Robot vacuum cleaners use the same "cliff sensors" on stairs.', 'एक छोटा रोबोट मेज़ पर घूमता है। आगे के दोनों कोनों पर लगे दो IR सेंसर नीचे देखते हैं: मेज़ के किनारे पर कुछ लौटकर नहीं आता, और पहिये किनारे से निकलने से पहले रोबोट को रुककर मुड़ना होता है। रोबोट वैक्यूम क्लीनर सीढ़ियों पर यही "क्लिफ़ सेंसर" इस्तेमाल करते हैं।', 'Ek chhota robot table par ghoomta hai. Aage ke dono konon par lage do IR sensor neeche dekhte hain: table ke kinaare par kuch laut kar nahi aata, aur pahiye kinaare se nikalne se pehle robot ko ruk kar mudna hota hai. Robot vacuum cleaner seedhiyon par yahi "cliff sensor" use karte hain.'),
      setup: { parts: CARPARTS, wires: CARWIRES },
      steps: [
        { k: 'info', do: t3('The car stands on a desk, 75 cm above the floor (the 🏁 Robot view). Its driver, battery and motors are here on the bench: battery on 12V and GND, motors on OUT1–OUT4, ENA, ENB, IN1–IN4 on pins 5, 6, 7, 8, 2, 4.', 'कार फ़र्श से 75 cm ऊँची एक मेज़ पर खड़ी है (🏁 रोबोट व्यू)। इसका ड्राइवर, बैटरी और मोटरें यहाँ बेंच पर हैं: बैटरी 12V और GND पर, मोटरें OUT1–OUT4 पर, ENA, ENB, IN1–IN4 पिन 5, 6, 7, 8, 2, 4 पर।', 'Car floor se 75 cm oonchi ek table par khadi hai (🏁 Robot view). Iska driver, battery aur motors yahan bench par hain: battery 12V aur GND par, motors OUT1–OUT4 par, ENA, ENB, IN1–IN4 pin 5, 6, 7, 8, 2, 4 par.'),
          see: t3('Unlike the line follower, these sensors sit on two arms in front of the car, well ahead of its wheels and its ball caster: they must see the edge before anything that holds the car up reaches it.', 'लाइन फ़ॉलोअर से अलग, ये सेंसर कार के आगे दो भुजाओं पर लगे हैं, पहियों और बॉल कैस्टर से काफ़ी आगे: कार को थामने वाली किसी भी चीज़ के किनारे तक पहुँचने से पहले इन्हें किनारा दिखना चाहिए।', 'Line follower se alag, yeh sensor car ke aage do bhujaon par lage hain, pahiyon aur ball caster se kaafi aage: car ko thaamne wali kisi bhi cheez ke kinaare tak pahunchne se pehle inhe kinaara dikhna chahiye.') },
        gndStep,
        { k: 'place', place: F('irL', 'ir', {}, 140, 62, 2), do: t3('Put an IR sensor at the left ghost: the car\'s front-left corner.', 'एक IR सेंसर बाईं नीली आकृति पर रखिए: कार का आगे-बायाँ कोना।', 'Ek IR sensor left neeli shape par rakhiye: car ka aage-left kona.'), see: E },
        { k: 'place', place: F('irR', 'ir', {}, 178, 62, 2), do: t3('Put the second IR sensor at the right ghost: the front-right corner.', 'दूसरा IR सेंसर दाईं नीली आकृति पर रखिए: आगे-दायाँ कोना।', 'Doosra IR sensor right neeli shape par rakhiye: aage-right kona.'), see: E },
        ...irUnit('irL', 11, left), ...irUnit('irR', 12, right),
        check,
        run(t3('Run puts the car on the desk.', '"चलाइए" कार को मेज़ पर रखता है।', 'Run car ko table par rakhta hai.')),
        { k: 'watch', until: (S) => fresh(S) && S.w('saved3') && !S.w('fell'), do: t3('Watch the robot and the sensor lights on the arms.', 'रोबोट और भुजाओं पर सेंसरों की बत्तियाँ देखिए।', 'Robot aur bhujaon par sensors ki lights dekhiye.'),
          see: t3('At the edge a sensor\'s light goes out (nothing comes back), the robot stops, backs off and turns away. Three edges seen and escaped!', 'किनारे पर किसी सेंसर की बत्ती बुझती है (कुछ लौटकर नहीं आता), रोबोट रुकता है, पीछे हटता है और मुड़ जाता है। तीन किनारे देखे और बचा!', 'Kinaare par kisi sensor ki light bujhti hai (kuch laut kar nahi aata), robot rukta hai, peeche hatta hai aur mud jaata hai. Teen kinaare dekhe aur bacha!') },
        { k: 'edit', test: (src) => speedOf(src) >= 230, set: [[/int speed = 120;/, 'int speed = 255;']], do: t3('Make it faster: change speed = 120 to speed = 255 and press Run.', 'इसे तेज़ कीजिए: speed = 120 को speed = 255 कीजिए और "चलाइए" दबाइए।', 'Ise tez kijiye: speed = 120 ko speed = 255 karo aur Run dabaiye.'), see: E },
        { k: 'watch', until: (S) => fresh(S) && S.w('fell'), do: t3('Watch the first edge.', 'पहला किनारा देखिए।', 'Pehla kinaara dekhiye.'),
          see: t3('It falls off! drive(0, 0) only cuts the power: the wheels roll on by themselves for a moment. At full speed that is more than the 5 cm between the sensors and the ball caster, and the robot goes over before it stops. Press 🏁 Start to put it back.', 'यह गिर गया! drive(0, 0) सिर्फ़ बिजली काटता है: पहिये कुछ पल अपने-आप लुढ़कते रहते हैं। पूरी रफ़्तार पर यह सेंसरों और बॉल कैस्टर के बीच की 5 cm दूरी से ज़्यादा है, और रुकने से पहले रोबोट नीचे चला जाता है। इसे वापस रखने के लिए 🏁 Start दबाइए।', 'Yeh gir gaya! drive(0, 0) sirf bijli kaatta hai: pahiye kuch pal apne aap ludhakte rehte hain. Poori speed par yeh sensors aur ball caster ke beech ki 5 cm doori se zyada hai, aur rukne se pehle robot neeche chala jaata hai. Ise wapas rakhne ke liye 🏁 Start dabaiye.') },
        { k: 'edit', test: (src) => !/drive\(0,\s*0\);\s*\/\/\s*stop\s*\n\s*delay\(200\);/.test(src) && speedOf(src) >= 230, set: [[/    drive\(0, 0\);                        \/\/ stop\n    delay\(200\);\n/, '']],
          do: t3('Brake hard instead: delete the two lines drive(0, 0); // stop and delay(200);, so it reverses the moment it sees the edge. Press Run.', 'इसकी जगह ज़ोर से ब्रेक लगाइए: drive(0, 0); // stop और delay(200); वाली दोनों लाइनें मिटाइए, ताकि किनारा दिखते ही यह उल्टा चले। "चलाइए" दबाइए।', 'Iski jagah zor se brake lagaiye: drive(0, 0); // stop aur delay(200); wali dono lines mitaiye, taaki kinaara dikhte hi yeh ulta chale. Run dabaiye.'), see: E },
        { k: 'watch', until: (S) => fresh(S) && S.w('saved3') && !S.w('fell'), do: t3('Watch it at full speed now.', 'अब इसे पूरी रफ़्तार पर देखिए।', 'Ab ise poori speed par dekhiye.'),
          see: t3('Driving the motors backwards stops the wheels far faster than letting them roll: it stays on the desk at full speed. Real robots also slow down near edges, and put the cliff sensors as far forward as they can.', 'मोटरों को उल्टा चलाना पहियों को लुढ़कने देने से कहीं जल्दी रोकता है: पूरी रफ़्तार पर भी यह मेज़ पर रहता है। असली रोबोट किनारों के पास धीमे भी होते हैं, और क्लिफ़ सेंसर जितना हो सके आगे लगाते हैं।', 'Motors ko ulta chalana pahiyon ko ludhakne dene se kahin jaldi rokta hai: poori speed par bhi yeh table par rehta hai. Asli robot kinaaron ke paas dheeme bhi hote hain, aur cliff sensor jitna ho sake aage lagate hain.') },
      ],
      check: [...driveChecks, ...irChecks('irL', 11), ...irChecks('irR', 12)],
      done: (S) => S.w('saved3') && !S.w('fell') && speedOf(S.runSrc) >= 230 },
    // 2 ------------------------------------------------------------------------------------------------- light-seeker
    { id: 'lightcar', cls: '7', view: 'carbench', wview: 'wide', rview: 'arenalight', code: LIGHT, drawer: ['ldr', 'resistor'], serial: true, world: { kind: 'car', car: 'light' },
      title: t3('Light-seeking robot', 'रोशनी ढूँढने वाला रोबोट', 'Roshni dhoondhne wala robot'),
      goal: t3('Two light sensors look a little left and a little right; the robot steers towards the brighter side and finds a torch in a dark room, like a moth to a lamp. Move the torch and it finds it again.', 'दो रोशनी सेंसर थोड़ा बाएँ और थोड़ा दाएँ देखते हैं; रोबोट ज़्यादा रोशनी वाली तरफ़ मुड़ता है और अँधेरे कमरे में टॉर्च ढूँढ लेता है, जैसे पतंगा दीये की ओर। टॉर्च हटाइए और यह उसे फिर ढूँढ लेता है।', 'Do roshni sensor thoda left aur thoda right dekhte hain; robot zyada roshni wali taraf mudta hai aur andhere room mein torch dhoondh leta hai, jaise patanga diye ki or. Torch hataiye aur yeh use phir dhoondh leta hai.'),
      setup: { parts: CARPARTS, wires: CARWIRES },
      steps: [
        { k: 'info', do: t3('The car is in a dark room with a torch on a stand (the 🏁 Robot view). Its driver, battery and motors are wired on the bench as before. Its eyes will be two LDRs, each with a 10 kΩ resistor: a voltage divider, as in the night lamp.', 'कार एक अँधेरे कमरे में है और एक स्टैंड पर टॉर्च है (🏁 रोबोट व्यू)। इसका ड्राइवर, बैटरी और मोटरें पहले की तरह बेंच पर जुड़े हैं। इसकी आँखें दो एलडीआर होंगी, हर एक के साथ 10 kΩ रेज़िस्टर: नाइट लैंप की तरह एक वोल्टेज डिवाइडर।', 'Car ek andhere room mein hai aur ek stand par torch hai (🏁 Robot view). Iska driver, battery aur motors pehle ki tarah bench par jude hain. Iski aankhen do LDR hongi, har ek ke saath 10 kΩ resistor: night lamp ki tarah ek voltage divider.'), see: E },
        gndStep,
        { k: 'place', place: P('ldrL', 'ldr', {}, 'e40', 0), do: t3('Put the left LDR into 40e–42e.', 'बायाँ एलडीआर 40e–42e में लगाइए।', 'Left LDR 40e–42e mein lagaiye.'), see: t3('On the car it looks 32° to the left.', 'कार पर यह 32° बाईं ओर देखता है।', 'Car par yeh 32° left ki taraf dekhta hai.') },
        { k: 'place', place: P('rL', 'resistor', { ohms: 10000 }, 'b42', 3), do: t3('Put a 10 kΩ resistor from 42b down to the − rail.', '10 kΩ रेज़िस्टर को 42b से नीचे − रेल तक लगाइए।', '10 kΩ resistor ko 42b se neeche − rail tak lagaiye.'), see: E },
        { k: 'wire', wire: ['ldrL.1', 'rail:tp'], do: t3('Wire the LDR\'s other leg (column 40) to the + rail.', 'एलडीआर के दूसरे पैर (कॉलम 40) को + रेल से जोड़िए।', 'LDR ke doosre pair (column 40) ko + rail se jodiye.'), see: E },
        { k: 'wire', wire: ['A0', 'ldrL.2'], do: t3('Wire A0 to column 42, the middle of the divider.', 'A0 को कॉलम 42 से जोड़िए, डिवाइडर का बीच।', 'A0 ko column 42 se jodiye, divider ka beech.'), see: E },
        { k: 'place', place: P('ldrR', 'ldr', {}, 'e46', 0), do: t3('Put the right LDR into 46e–48e.', 'दायाँ एलडीआर 46e–48e में लगाइए।', 'Right LDR 46e–48e mein lagaiye.'), see: t3('This one looks 32° to the right.', 'यह 32° दाईं ओर देखता है।', 'Yeh 32° right ki taraf dekhta hai.') },
        { k: 'place', place: P('rR', 'resistor', { ohms: 10000 }, 'b48', 3), do: t3('Put the second 10 kΩ resistor from 48b down to the − rail.', 'दूसरा 10 kΩ रेज़िस्टर 48b से नीचे − रेल तक लगाइए।', 'Doosra 10 kΩ resistor 48b se neeche − rail tak lagaiye.'), see: E },
        { k: 'wire', wire: ['ldrR.1', 'rail:tp'], do: t3('Its other leg (column 46) to the + rail.', 'इसका दूसरा पैर (कॉलम 46) + रेल से।', 'Iska doosra pair (column 46) + rail se.'), see: E },
        { k: 'wire', wire: ['A1', 'ldrR.2'], do: t3('Wire A1 to column 48.', 'A1 को कॉलम 48 से जोड़िए।', 'A1 ko column 48 se jodiye.'), see: E },
        check,
        run(t3('Run puts the car in the corner. The Serial Monitor shows both eyes: left, right.', '"चलाइए" कार को कोने में रखता है। सीरियल मॉनिटर दोनों आँखें दिखाता है: बायाँ, दायाँ।', 'Run car ko kone mein rakhta hai. Serial Monitor dono aankhen dikhata hai: left, right.')),
        { k: 'watch', until: (S) => fresh(S) && S.w('found'), do: t3('Watch the robot and the two numbers.', 'रोबोट और दोनों संख्याएँ देखिए।', 'Robot aur dono sankhyaayein dekhiye.'),
          see: t3('The eye that faces the torch reads more, so that wheel slows and the robot turns to it; straight on when both read the same; it stops at the torch.', 'टॉर्च की ओर वाली आँख ज़्यादा पढ़ती है, तो उस तरफ़ का पहिया धीमा होता है और रोबोट उसकी ओर मुड़ता है; दोनों बराबर हों तो सीधा; टॉर्च पर पहुँचकर रुकता है।', 'Torch ki taraf wali aankh zyada padhti hai, to us taraf ka pahiya dheema hota hai aur robot uski taraf mudta hai; dono barabar hon to seedha; torch par pahunch kar rukta hai.') },
        { k: 'act', until: (S) => fresh(S) && S.w('found') && S.wv('found') && S.wv('found').size >= 2, do: t3('Move the torch: choose B (or C) under Torch in the panel.', 'टॉर्च हटाइए: पैनल में Torch के नीचे B (या C) चुनिए।', 'Torch hataiye: panel mein Torch ke neeche B (ya C) chuniye.'),
          see: t3('Now the torch is behind it: both eyes read dark, so it spins on the spot, looking, until one eye catches the light; then it drives to it again.', 'अब टॉर्च पीछे है: दोनों आँखें अँधेरा पढ़ती हैं, तो यह अपनी जगह घूमकर देखता है, जब तक कोई आँख रोशनी न पकड़ ले; फिर उसकी ओर चल देता है।', 'Ab torch peeche hai: dono aankhen andhera padhti hain, to yeh apni jagah ghoom kar dekhta hai, jab tak koi aankh roshni na pakad le; phir uski taraf chal deta hai.') },
        { k: 'edit', test: (src) => { const m = /int\s+near\s*=\s*(\d+)\s*;/.exec(src); return !!m && +m[1] <= 880 && +m[1] >= 760; }, set: [[/int near = 940;/, 'int near = 860;']],
          do: t3('A shy robot: change near = 940 to near = 860 and press Run.', 'एक शर्मीला रोबोट: near = 940 को near = 860 कीजिए और "चलाइए" दबाइए।', 'Ek sharmila robot: near = 940 ko near = 860 karo aur Run dabaiye.'), see: E },
        { k: 'watch', until: (S) => fresh(S) && S.w('foundFar'), do: t3('Watch where it stops.', 'देखिए यह कहाँ रुकता है।', 'Dekhiye yeh kahan rukta hai.'),
          see: t3('It stops farther from the torch: a smaller number is reached sooner, because the light gets brighter as you come nearer (four times brighter at half the distance).', 'यह टॉर्च से ज़्यादा दूर रुकता है: छोटी संख्या जल्दी आ जाती है, क्योंकि पास जाने पर रोशनी तेज़ होती जाती है (आधी दूरी पर चार गुना)।', 'Yeh torch se zyada door rukta hai: chhoti sankhya jaldi aa jaati hai, kyunki paas jaane par roshni tez hoti jaati hai (aadhi doori par chaar guna).') },
      ],
      check: [...driveChecks, has('ldrL', N.ldr), has('ldrR', N.ldr), (S) => (S.conn('ldrL.2', 'A1') && S.conn('ldrR.2', 'A0') ? [X.swapLdr] : null),
        (S) => (S.conn('ldrL.2', 'A0') && S.conn('ldrL.1', '5V') && S.chain('A0', [['rL']], 'GND') ? null : [X.ldr, { x: left, a: 'A0' }]),
        (S) => (S.conn('ldrR.2', 'A1') && S.conn('ldrR.1', '5V') && S.chain('A1', [['rR']], 'GND') ? null : [X.ldr, { x: right, a: 'A1' }])],
      done: (S) => S.w('foundFar') },
    // 3 ------------------------------------------------------------------------------------------------- dancer
    { id: 'dancecar', cls: '7', view: 'carbench', wview: 'carbench', rview: 'arenadance', code: DANCE, drawer: [], world: { kind: 'car', car: 'dance' },
      title: t3('Dancing robot (timed moves)', 'नाचने वाला रोबोट (समय वाली चालें)', 'Naachne wala robot (time wali chaalein)'),
      goal: t3('A dance routine made of timed moves: forward, back, a spin each way, a wiggle. A timed spin is never exactly one turn on a real floor, so you tune it, as robot dance teams do before a show.', 'समय वाली चालों से बना एक डांस: आगे, पीछे, दोनों तरफ़ एक-एक चक्कर, एक मटक। असली फ़र्श पर समय वाला चक्कर कभी ठीक एक पूरा चक्कर नहीं होता, तो आप उसे ट्यून करते हैं, जैसे रोबोट डांस टीमें शो से पहले करती हैं।', 'Time wali chaalon se bana ek dance: aage, peeche, dono taraf ek-ek chakkar, ek matak. Asli floor par time wala chakkar kabhi theek ek poora chakkar nahi hota, to aap use tune karte hain, jaise robot dance teams show se pehle karti hain.'),
      setup: { parts: CARPARTS, wires: CARWIRES },
      steps: [
        { k: 'info', do: t3('The car stands on a dance mat (the 🏁 Robot view); its driver, battery and motors are wired on the bench. No sensors this time: just a program of steps and times.', 'कार एक डांस मैट पर खड़ी है (🏁 रोबोट व्यू); इसका ड्राइवर, बैटरी और मोटरें बेंच पर जुड़े हैं। इस बार कोई सेंसर नहीं: बस कदमों और समय का प्रोग्राम।', 'Car ek dance mat par khadi hai (🏁 Robot view); iska driver, battery aur motors bench par jude hain. Is baar koi sensor nahi: bas kadmon aur time ka program.'), see: E },
        gndStep,
        check,
        { k: 'info', code: [19, 20, 21, 22, 23, 24], do: t3('Read step(): it drives, waits, stops, and pauses on the beat. loop() is the dance chart: each line one step. Write a move once as a function and the dance reads like music.', 'step() पढ़िए: यह चलाता है, रुकता है, बंद करता है, और ताल पर ठहरता है। loop() डांस चार्ट है: हर लाइन एक कदम। किसी चाल को एक बार फ़ंक्शन बनाकर लिखिए और डांस संगीत की तरह पढ़ा जाता है।', 'step() padhiye: yeh chalata hai, rukta hai, band karta hai, aur taal par thehrta hai. loop() dance chart hai: har line ek kadam. Kisi chaal ko ek baar function bana kar likhiye aur dance music ki tarah padha jaata hai.'), see: E },
        run(t3('Run puts the car on the spot in the middle of the mat.', '"चलाइए" कार को मैट के बीच वाले निशान पर रखता है।', 'Run car ko mat ke beech wale nishaan par rakhta hai.')),
        { k: 'watch', until: (S) => fresh(S) && S.w('spinL') && S.w('spinR'), do: t3('Watch the dance, and "Last spin" in the panel.', 'डांस देखिए, और पैनल में "Last spin"।', 'Dance dekhiye, aur panel mein "Last spin".'),
          see: t3('Forward, back, a spin left and a spin right; but 600 ms of spinning is less than half a turn: it ends the spin facing the wrong way.', 'आगे, पीछे, एक चक्कर बाएँ और एक दाएँ; पर 600 ms का घूमना आधे चक्कर से भी कम है: चक्कर के बाद यह ग़लत तरफ़ देखता है।', 'Aage, peeche, ek chakkar left aur ek right; par 600 ms ka ghoomna aadhe chakkar se bhi kam hai: chakkar ke baad yeh galat taraf dekhta hai.') },
        { k: 'edit', test: (src) => { const m = /int\s+spinTime\s*=\s*(\d+)\s*;/.exec(src); return !!m && +m[1] >= 900 && +m[1] <= 2000; }, set: [[/int spinTime = 600;/, 'int spinTime = 1350;']],
          do: t3('600 ms turned about 160°. A full turn is 360°, so it needs about 600 × 360 ÷ 160 ≈ 1350 ms. Change spinTime = 600 to spinTime = 1350 and press Run.', '600 ms में लगभग 160° घूमा। पूरा चक्कर 360° है, तो लगभग 600 × 360 ÷ 160 ≈ 1350 ms चाहिए। spinTime = 600 को spinTime = 1350 कीजिए और "चलाइए" दबाइए।', '600 ms mein lagbhag 160° ghooma. Poora chakkar 360° hai, to lagbhag 600 × 360 ÷ 160 ≈ 1350 ms chahiye. spinTime = 600 ko spinTime = 1350 karo aur Run dabaiye.'), see: E },
        { k: 'watch', until: (S) => fresh(S) && S.w('fullspin'), do: t3('Watch "Last spin": it should be 360°, give or take 20°. If not, change spinTime by 50 at a time and Run again.', '"Last spin" देखिए: यह 360° होना चाहिए, 20° कम-ज़्यादा। न हो तो spinTime को 50-50 करके बदलिए और फिर "चलाइए"।', '"Last spin" dekhiye: yeh 360° hona chahiye, 20° kam-zyada. Na ho to spinTime ko 50-50 karke badaliye aur phir Run.'),
          see: t3('One full turn: it ends the spin facing the audience again. The sum is close, not exact: the motors take a moment to speed up and roll on after they stop. A weaker battery would turn less: real robots check with a sensor (a compass or an encoder) instead of trusting the clock.', 'एक पूरा चक्कर: चक्कर के बाद यह फिर दर्शकों की ओर देखता है। हिसाब पास है, बिल्कुल ठीक नहीं: मोटरें तेज़ होने में एक पल लेती हैं और रुकने के बाद लुढ़कती हैं। कमज़ोर बैटरी कम घुमाती: असली रोबोट घड़ी पर भरोसा करने की जगह सेंसर (कंपास या एनकोडर) से जाँचते हैं।', 'Ek poora chakkar: chakkar ke baad yeh phir audience ki taraf dekhta hai. Hisaab paas hai, bilkul theek nahi: motors tez hone mein ek pal leti hain aur rukne ke baad ludhakti hain. Kamzor battery kam ghumaati: asli robot ghadi par bharosa karne ki jagah sensor (compass ya encoder) se jaanchte hain.') },
      ],
      check: [...driveChecks],
      done: (S) => S.w('fullspin') },
    // 4 ------------------------------------------------------------------------------------------------- lap counter
    { id: 'lapcar', cls: '7', view: 'carbench', wview: 'carbench', rview: 'arena', code: LAP, drawer: ['ir'], serial: true, world: { kind: 'car', car: 'lap' },
      title: t3('Lap-counting race car', 'चक्कर गिनने वाली रेस कार', 'Chakkar ginne wali race car'),
      goal: t3('The line-follower car gets a third IR sensor on its side. Beside the start line lies a short black marker: each time the car passes it, the Arduino counts a lap and times it with millis(), like the timing gate of a real race.', 'लाइन फ़ॉलोअर कार की बगल में तीसरा IR सेंसर लगता है। स्टार्ट लाइन के पास एक छोटा काला निशान है: कार हर बार उसके पास से गुज़रती है तो Arduino एक चक्कर गिनता है और millis() से उसका समय नापता है, असली रेस के टाइमिंग गेट की तरह।', 'Line follower car ki bagal mein teesra IR sensor lagta hai. Start line ke paas ek chhota kaala nishaan hai: car har baar uske paas se guzarti hai to Arduino ek chakkar ginta hai aur millis() se uska time naapta hai, asli race ke timing gate ki tarah.'),
      setup: { parts: [...CARPARTS, F('irL', 'ir', {}, 140, 62, 2), F('irR', 'ir', {}, 178, 62, 2)],
        wires: [...CARWIRES, GNDW, ['T:irL:VCC', 'H:tp35'], ['T:irL:GND', 'H:tn36'], ['T:irL:OUT', 'D11'], ['T:irR:VCC', 'H:tp41'], ['T:irR:GND', 'H:tn42'], ['T:irR:OUT', 'D12']] },
      steps: [
        { k: 'info', do: t3('The car is the line follower from before, its two line sensors wired to pins 11 and 12. Your job: a third IR sensor for the lap marker, on pin 9.', 'कार पहले वाली लाइन फ़ॉलोअर है, उसके दोनों लाइन सेंसर पिन 11 और 12 पर लगे हैं। आपका काम: लैप निशान के लिए तीसरा IR सेंसर, पिन 9 पर।', 'Car pehle wali line follower hai, uske dono line sensor pin 11 aur 12 par lage hain. Aapka kaam: lap nishaan ke liye teesra IR sensor, pin 9 par.'),
          see: t3('On the car it sits on the left side, 6 cm out from the middle: it never sees the line, only the marker beside it.', 'कार पर यह बाईं तरफ़, बीच से 6 cm बाहर लगा है: यह लाइन को कभी नहीं देखता, सिर्फ़ उसके पास वाला निशान।', 'Car par yeh left taraf, beech se 6 cm bahar laga hai: yeh line ko kabhi nahi dekhta, sirf uske paas wala nishaan.') },
        { k: 'place', place: F('irM', 'ir', {}, 104, 62, 2), do: t3('Put the third IR sensor at the ghost.', 'तीसरा IR सेंसर नीली आकृति पर रखिए।', 'Teesra IR sensor neeli shape par rakhiye.'), see: E },
        ...irUnit('irM', 9, t3('marker', 'निशान वाले', 'nishaan wale')),
        check,
        { k: 'info', code: [40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54], do: t3('Read the end of loop(): it counts only the moment the sensor reaches the marker (HIGH now, not HIGH before), or one marker would count a hundred times. millis() minus the last time gives the lap time.', 'loop() का आख़िरी हिस्सा पढ़िए: यह सिर्फ़ उस पल को गिनता है जब सेंसर निशान पर पहुँचता है (अभी HIGH, पहले नहीं), वरना एक निशान सौ बार गिना जाता। millis() में से पिछला समय घटाने पर चक्कर का समय मिलता है।', 'loop() ka aakhri hissa padhiye: yeh sirf us pal ko ginta hai jab sensor nishaan par pahunchta hai (abhi HIGH, pehle nahi), warna ek nishaan sau baar gina jaata. millis() mein se pichhla time ghataane par chakkar ka time milta hai.'), see: E },
        run(),
        { k: 'watch', until: (S) => fresh(S) && serLaps(S).some((l) => l.n >= 2) && (S.mem.slow = Math.min(...serLaps(S).map((l) => l.t))), do: t3('Watch the Serial Monitor for two laps.', 'दो चक्करों के लिए सीरियल मॉनिटर देखिए।', 'Do chakkaron ke liye Serial Monitor dekhiye.'),
          see: t3('"Start!" at the first pass, then "Lap 1 time …", "Lap 2 time …": your own race timing.', 'पहली बार "Start!", फिर "Lap 1 time …", "Lap 2 time …": आपकी अपनी रेस टाइमिंग।', 'Pehli baar "Start!", phir "Lap 1 time …", "Lap 2 time …": aapki apni race timing.') },
        { k: 'edit', test: (src) => speedOf(src) >= 150 && /int\s+turn\s*=\s*-\s*speed\s*\/\s*2\s*;/.test(src), set: [[/int speed = 110;/, 'int speed = 170;'], [/int turn = 0;/, 'int turn = -speed / 2;']],
          do: t3('Race mode: change speed = 110 to speed = 170 and turn = 0 to turn = -speed / 2 (the inside wheel goes back in a bend). Press Run.', 'रेस मोड: speed = 110 को speed = 170 और turn = 0 को turn = -speed / 2 कीजिए (मोड़ पर अंदर वाला पहिया पीछे चलता है)। "चलाइए" दबाइए।', 'Race mode: speed = 110 ko speed = 170 aur turn = 0 ko turn = -speed / 2 karo (mod par andar wala pahiya peeche chalta hai). Run dabaiye.'), see: E },
        { k: 'watch', until: (S) => fresh(S) && serLaps(S).some((l) => l.t < (S.mem.slow || 0) - 0.5), do: t3('Watch the lap times now.', 'अब चक्करों का समय देखिए।', 'Ab chakkaron ka time dekhiye.'),
          see: t3('A faster lap, measured to a hundredth of a second. Engineers tune a robot exactly like this: change one thing, measure, compare.', 'एक तेज़ चक्कर, सेकंड के सौवें हिस्से तक नापा गया। इंजीनियर रोबोट को ठीक ऐसे ही ट्यून करते हैं: एक चीज़ बदलिए, नापिए, तुलना कीजिए।', 'Ek tez chakkar, second ke sauvein hisse tak naapa gaya. Engineer robot ko theek aise hi tune karte hain: ek cheez badaliye, naapiye, tulna kijiye.') },
      ],
      check: [...driveChecks, ...irChecks('irL', 11), ...irChecks('irR', 12), ...irChecks('irM', 9)],
      done: (S) => serLaps(S).some((l) => l.t < (S.mem.slow || 0) - 0.5) && speedOf(S.runSrc) >= 150 },
  ];
  for (const l of L) { l.n = ++n; l.batch = 14; }
  return L;
}
