// DUET Robotics Lab 360, batch 23: Class 11 robot-arm sessions, written fresh for DUET (same shape as lessons.js). The arm
// on the desk is batch 2's (robots.js ArmSim, worlds.js ArmWorld, level 4: the wooden block at A and the mark B):
//   armcopy    master and slave: four knobs on the breadboard are a small copy of the arm, and the arm copies them
//              (map() from 0..1023 to the joint's angles). The master's shoulder knob is fitted the other way round, so
//              the first program lifts when the knob goes down; the student swaps map()'s range, then picks the block
//              up at A and puts it down at B by hand, with the knobs
//   armrecord  teach and play back, as factory robots are taught: the same knobs, a RECORD and a PLAY button; each
//              pose goes into four arrays, and PLAY glides through them (all joints together, in 40 small steps). The
//              memory holds only 3 poses at first ("Memory full!"), but a pick-and-place needs 7: MAXP = 10
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

export function batch23(K, n0) {
  const { P, F, W, need, has, noShort } = K;
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

  for (const l of L) { l.n = ++n; l.batch = 23; }
  return L;
}
