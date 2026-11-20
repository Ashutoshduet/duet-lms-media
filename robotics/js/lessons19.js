// DUET Robotics Lab 360, batch 19: the Class 10 robots on the Raspberry Pi 4 in Python (gpiozero), written fresh for DUET.
// Same shape as lessons6.js / lessons15.js (pi6.js runs the Python on the bench's real circuit, robots.js the car):
//   pi_linecar  a line follower: two LineSensor eyes and Robot.value. Python is not real time: a loop that sleeps 0.3 s
//               between looks runs off the tape at the bends; a fast loop holds it.
//   pi_avoidcar an obstacle-avoiding car: a DistanceSensor fixed at the front (Echo through 1 kΩ / 2.2 kΩ), back off and
//               turn to a random side (random.choice) so it never sticks in a corner. .distance is in metres: "safe = 30"
//               (thinking in cm) makes every wall "too close", and the car only backs and turns.
//   pi_wallcar  a wall follower with proportional control: keep the right wall at 15 cm, steer = kp × error. kp too big
//               and it swings from side to side (flag wobble) into the walls; the right hand finds FINISH in maze A, by a shorter way
//               than the Uno's left hand (mazecar).
// devtools/test/robocore19.mjs plays every one.
const t3 = (en, hi, hg) => ({ en, hi, hg });
const rail = (r, col) => { let best = 0; for (let i = 0; i < 50; i++) if (Math.abs(3 + i + Math.floor(i / 5) - col) < Math.abs(3 + best + Math.floor(best / 5) - col)) best = i; return 'H:' + r + (best + 1); }; // (the nearest rail hole)

const ROBOT = 'robot = Robot(left=Motor(5, 6, enable=12), right=Motor(20, 21, enable=13))';
export const PI_LINE = `# Line follower on the Raspberry Pi: two IR sensors look down at the floor.
# A LineSensor's line_detected is True over the black tape.
from gpiozero import Robot, Motor, LineSensor
from time import sleep

${ROBOT}
left_eye = LineSensor(17)
right_eye = LineSensor(27)
speed = 0.5          # 0 .. 1
turn = -0.25         # the inside wheel in a turn (a little backwards)

while True:
    L = left_eye.line_detected
    R = right_eye.line_detected
    if L and not R:
        robot.value = (turn, speed)      # tape under the left eye: turn left
    elif R and not L:
        robot.value = (speed, turn)      # tape under the right eye: turn right
    else:
        robot.value = (speed, speed)     # both on white: straight on
    sleep(0.01)                          # look again 100 times a second
`;
export const PI_AVOID = `# Obstacle-avoiding car on the Raspberry Pi: an HC-SR04 fixed at the front.
from gpiozero import Robot, Motor, DistanceSensor
from time import sleep
from random import choice

${ROBOT}
sensor = DistanceSensor(echo=24, trigger=23, max_distance=2)
speed = 0.6
safe = 0.30          # metres: nearer than this is too close

while True:
    d = sensor.distance                  # .distance is in metres
    if d > safe:
        robot.forward(speed)             # the way is clear
    else:
        print("Too close:", round(d * 100), "cm")
        robot.backward(speed)            # back off a little
        sleep(0.3)
        side = choice(["left", "right"]) # a random side: it never sticks in a corner
        if side == "left":
            robot.left(speed)
        else:
            robot.right(speed)
        sleep(0.4)
    sleep(0.05)
`;
export const PI_WALL = `# Wall-following robot: it keeps the wall on its right 15 cm away,
# steering in proportion to the error (a P controller), until FINISH.
from gpiozero import Robot, Motor, DistanceSensor, LineSensor
from time import sleep

${ROBOT}
ahead = DistanceSensor(echo=24, trigger=23, max_distance=2)
side = DistanceSensor(echo=26, trigger=16, max_distance=2)   # looks right
finish = LineSensor(4)       # IR under the nose: the black FINISH square
base = 0.5       # the speed on a straight
target = 15      # cm from the right wall
kp = 0.03        # how hard it steers for each cm of error

def limit(x):
    return max(-1, min(1, x))

while not finish.line_detected:
    front = ahead.distance * 100
    right = side.distance * 100
    if front < 12:                       # a wall ahead: turn left on the spot
        robot.left(0.6)
        sleep(0.25)
    elif right > 35:                     # the right wall has ended: curve round it
        robot.value = (base, base / 2)
    else:
        error = right - target           # + means too far from the wall
        steer = kp * error
        robot.value = (limit(base + steer), limit(base - steer))
    sleep(0.03)
robot.stop()
print("FINISH! Out by the right-hand wall")
`;

export function batch19(K, n0) {
  const { P, F } = K;
  const E = t3('', '', '');
  const run = (see) => ({ k: 'run', do: t3('Press Run.', '"चलाइए" दबाइए।', 'Run dabaiye.'), see: see || E });
  const check = { k: 'check', do: t3('Press "Check my circuit".', '"मेरा सर्किट जाँचिए" दबाइए।', '"Mera circuit check karo" dabaiye.'), see: E };
  const X = {
    missing: t3('The {x} is not on the bench yet.', '{x} अभी बेंच पर नहीं है।', '{x} abhi bench par nahi hai.'),
    toPin: t3('The {x} must be joined to {p}.', '{x} को {p} से जोड़िए।', '{x} ko {p} se jodiye.'),
    short: t3('3.3 V or 5 V is joined straight to GND: a short circuit! Remove that wire.', '3.3 V या 5 V सीधे GND से जुड़ा है: शॉर्ट सर्किट! वह वायर हटाइए।', '3.3 V ya 5 V seedhe GND se juda hai: short circuit! Woh wire hataiye.'),
    fiveIn: t3('{p} is joined to 5 V! A Raspberry Pi pin takes at most 3.3 V. Take that wire off.', '{p} 5 V से जुड़ गया है! Raspberry Pi का पिन ज़्यादा से ज़्यादा 3.3 V सहता है। वह वायर हटाइए।', '{p} 5 V se jud gaya hai! Raspberry Pi ka pin zyada se zyada 3.3 V sehta hai. Woh wire hataiye.'),
    irVcc: t3('Give the IR sensors 3.3 V, not 5 V: on 5 V their OUT would put 5 V into the Pi\'s GPIO pins.', 'IR सेंसरों को 5 V नहीं, 3.3 V दीजिए: 5 V पर उनका OUT, Pi के GPIO पिनों में 5 V डालेगा।', 'IR sensors ko 5 V nahi, 3.3 V dijiye: 5 V par unka OUT, Pi ke GPIO pins mein 5 V daalega.'),
    eyesSwap: t3('The eyes are swapped: the left sensor\'s OUT goes to GPIO 17, the right one\'s to GPIO 27. Swapped, the car turns away from the tape.', 'आँखें उलट गई हैं: बाएँ सेंसर का OUT GPIO 17 पर, दाएँ का GPIO 27 पर। उलटी हों तो कार टेप से दूर मुड़ती है।', 'Aankhein ulat gayi hain: left sensor ka OUT GPIO 17 par, right ka GPIO 27 par. Ulti hon to car tape se door mudti hai.'),
    echoDirect: t3('Echo goes straight to GPIO {p}: the HC-SR04 answers with 5 V, too much for the Pi. Put the divider in: 1 kΩ from Echo, 2.2 kΩ to GND, GPIO {p} from the middle.', 'Echo सीधे GPIO {p} पर है: HC-SR04 5 V से जवाब देता है, Pi के लिए बहुत ज़्यादा। डिवाइडर लगाइए: Echo से 1 kΩ, GND तक 2.2 kΩ, बीच से GPIO {p}।', 'Echo seedhe GPIO {p} par hai: HC-SR04 5 V se jawab deta hai, Pi ke liye bahut zyada. Divider lagaiye: Echo se 1 kΩ, GND tak 2.2 kΩ, beech se GPIO {p}.'),
    divider: t3('The divider is not right yet: Echo → 1 kΩ → the middle → 2.2 kΩ → GND, and the middle to GPIO {p}.', 'डिवाइडर अभी ठीक नहीं: Echo → 1 kΩ → बीच → 2.2 kΩ → GND, और बीच से GPIO {p}।', 'Divider abhi theek nahi: Echo → 1 kΩ → beech → 2.2 kΩ → GND, aur beech se GPIO {p}.'),
    drvGnd: t3('The L298N\'s GND must be joined to a GND pin of the Pi (common ground), or its inputs cannot read the Pi\'s 3.3 V.', 'L298N का GND, Pi के किसी GND पिन से जुड़ना चाहिए (साझा ग्राउंड), वरना इसके इनपुट Pi के 3.3 V को नहीं पढ़ पाते।', 'L298N ka GND, Pi ke kisi GND pin se judna chahiye (common ground), warna iske input Pi ke 3.3 V ko nahi padh paate.'),
  };
  const noShort = (S) => (S.conn('3V3', 'GND') || S.conn('5V', 'GND') ? [X.short] : null);
  const no5 = (pin) => (S) => (S.conn(pin, '5V') ? [X.fiveIn, { p: pin }] : null);
  const need = (a, b, x, p) => (S) => (S.conn(a, b) ? null : [X.toPin, { x, p }]);
  const has = (tag, x) => (S) => (S.has(tag) ? null : [X.missing, { x }]);
  // the car's drive, all wired: the battery feeds the L298N, the motors on OUT1–OUT4, IN1–IN4 on GPIO 5, 6, 20, 21,
  // ENA / ENB on GPIO 12 / 13 (PWM: the speed), the common ground; the HC-SR04s' 5 V and GND on the breadboard's rails
  const DRIVE = [F('drv', 'l298n', {}, -35, 105, 0), F('bat', 'bat18650', {}, -190, 108, 0), F('mL', 'bomotor', { side: 'L' }, -80, 152, 3), F('mR', 'bomotor', { side: 'R' }, 10, 152, 1)];
  const DRIVEW = [['T:bat:P', 'T:drv:VS'], ['T:bat:N', 'T:drv:GND'], ['T:mL:P', 'T:drv:OUT1'], ['T:mL:N', 'T:drv:OUT2'], ['T:mR:P', 'T:drv:OUT3'], ['T:mR:N', 'T:drv:OUT4'],
    ['T:drv:IN1', 'B:GPIO5'], ['T:drv:IN2', 'B:GPIO6'], ['T:drv:IN3', 'B:GPIO20'], ['T:drv:IN4', 'B:GPIO21'], ['T:drv:ENA', 'B:GPIO12'], ['T:drv:ENB', 'B:GPIO13'], ['T:drv:GND', 'B:GND2']];
  const driveChk = [noShort, (S) => (S.conn('drv.GND', 'GND') ? null : [X.drvGnd]), ...[['IN1', 5], ['IN2', 6], ['IN3', 20], ['IN4', 21], ['ENA', 12], ['ENB', 13]].map(([a, g]) => need('drv.' + a, 'GPIO' + g, 'L298N ' + a, 'GPIO ' + g))];
  const RAILS = [['B:5V', rail('tp', 3)], ['B:GND6', rail('bn', 19)]];
  // an HC-SR04 at column c (VCC c, Trig c+1, Echo c+2, GND c+3) with its divider: 1 kΩ from Echo to column c−2, 2.2 kΩ from there to the − rail
  const sonar = (tag, r1, r2, c) => ({ parts: [P(r1, 'resistor', { ohms: 1000 }, 'g' + (c + 2), 2), P(r2, 'resistor', { ohms: 2200 }, 'j' + (c - 2), 1)], wires: [[rail('tp', c - 1), 'H:f' + c], [rail('bn', c + 4), 'H:f' + (c + 3)]], us: P(tag, 'hcsr04', {}, 'j' + c, 0) });
  const sonarChk = (tag, r1, r2, trig, echo) => [no5('GPIO' + echo), need(tag + '.TRIG', 'GPIO' + trig, t3('sensor\'s Trig', 'सेंसर का Trig', 'sensor ka Trig'), 'GPIO ' + trig), (S) => (S.conn(tag + '.ECHO', 'GPIO' + echo) ? [X.echoDirect, { p: echo }] : null),
    (S) => (S.has(r1) && S.has(r2) && S.chain(tag + '.ECHO', [[r1]], 'GPIO' + echo) && S.chain('GPIO' + echo, [[r2]], 'GND') ? null : [X.divider, { p: echo }])];
  const IRN = t3('IR sensor', 'IR सेंसर', 'IR sensor'), USN = t3('ultrasonic sensor', 'अल्ट्रासोनिक सेंसर', 'ultrasonic sensor');
  const sleepOf = (src) => { const m = /\n    sleep\(\s*([\d.]+)\s*\)\s*#?[^\n]*\n?$/.exec(src || ''); return m ? +m[1] : null; };
  const numOf = (src, name) => { const m = new RegExp(`\\n${name}\\s*=\\s*(-?[\\d.]+)`).exec(src || ''); return m ? +m[1] : null; };
  const fresh = (S) => S.running() && S.fresh();
  const doneRun = (S) => S.runSrc !== null && S.t - (S.freshAt || 0) > 0.3;
  const lines = (S, re) => (S.serLines || []).some((l) => re.test(l));
  let n = n0;
  const L = [];

  // 1 ------------------------------------------------------------------------------------------------- line follower
  L.push({ id: 'pi_linecar', board: 'pi4', cls: '10', view: 'carbench', wview: 'carbench', rview: 'arena', code: PI_LINE, drawer: ['ir'], world: { kind: 'car', car: 'line', board: 'pi' },
    title: t3('Line follower in Python', 'Python में लाइन फ़ॉलोअर', 'Python mein line follower'),
    goal: t3('A Raspberry Pi car follows a black tape round a track: two IR eyes look down, gpiozero\'s LineSensor reads them, and Robot.value sets both wheels at once. Then find out why a robot\'s loop must be quick.', 'एक Raspberry Pi कार ट्रैक पर काली टेप के पीछे चलती है: दो IR आँखें नीचे देखती हैं, gpiozero का LineSensor उन्हें पढ़ता है, और Robot.value दोनों पहिये एक साथ सेट करता है। फिर जानिए कि रोबोट का लूप तेज़ क्यों होना चाहिए।', 'Ek Raspberry Pi car track par kaali tape ke peeche chalti hai: do IR aankhein neeche dekhti hain, gpiozero ka LineSensor unhe padhta hai, aur Robot.value dono pahiye ek saath set karta hai. Phir jaaniye ki robot ka loop tez kyon hona chahiye.'),
    setup: { parts: DRIVE, wires: DRIVEW },
    steps: [
      { k: 'info', do: t3('The car\'s drive is wired on the bench (its twin is on the track: 🏁 Robot view): IN1–IN4 on GPIO 5, 6, 20, 21, ENA and ENB on GPIO 12 and 13, and the common ground. Add its eyes.', 'कार की ड्राइव बेंच पर जुड़ी है (इसकी जुड़वाँ ट्रैक पर है: 🏁 रोबोट व्यू): IN1–IN4, GPIO 5, 6, 20, 21 पर, ENA और ENB, GPIO 12 और 13 पर, और साझा ग्राउंड। इसकी आँखें जोड़िए।', 'Car ki drive bench par judi hai (iski judwaan track par hai: 🏁 Robot view): IN1–IN4, GPIO 5, 6, 20, 21 par, ENA aur ENB, GPIO 12 aur 13 par, aur common ground. Iski aankhein jodiye.'),
        see: t3('The IR modules run on 3.3 V here, so their OUT gives the Pi 3.3 V at most: safe for its pins.', 'IR मॉड्यूल यहाँ 3.3 V पर चलते हैं, तो उनका OUT, Pi को ज़्यादा से ज़्यादा 3.3 V देता है: इसके पिनों के लिए सुरक्षित।', 'IR module yahan 3.3 V par chalte hain, to unka OUT, Pi ko zyada se zyada 3.3 V deta hai: iske pins ke liye surakshit.') },
      { k: 'place', place: F('irL', 'ir', {}, 140, 62, 2), do: t3('Put an IR sensor at the left ghost: the car\'s left eye.', 'एक IR सेंसर बाईं नीली आकृति पर रखिए: कार की बाईं आँख।', 'Ek IR sensor left neeli shape par rakhiye: car ki left aankh.'), see: E },
      { k: 'place', place: F('irR', 'ir', {}, 178, 62, 2), do: t3('Put the second IR sensor at the right ghost: the right eye.', 'दूसरा IR सेंसर दाईं नीली आकृति पर रखिए: दाईं आँख।', 'Doosra IR sensor right neeli shape par rakhiye: right aankh.'), see: E },
      { k: 'wire', wire: ['irL.VCC', '3V3'], do: t3('Left eye: VCC to 3.3V (physical pin 1).', 'बाईं आँख: VCC को 3.3V (फ़िज़िकल पिन 1) से।', 'Left aankh: VCC ko 3.3V (physical pin 1) se.'), see: E },
      { k: 'wire', wire: ['irL.GND', 'GND'], do: t3('Its GND to a GND pin.', 'इसका GND किसी GND पिन से।', 'Iska GND kisi GND pin se.'), see: E },
      { k: 'wire', wire: ['irL.OUT', 'GPIO17'], do: t3('Its OUT to GPIO 17 (physical pin 11).', 'इसका OUT, GPIO 17 (फ़िज़िकल पिन 11) से।', 'Iska OUT, GPIO 17 (physical pin 11) se.'), see: E },
      { k: 'wire', wire: ['irR.VCC', '3V3b'], do: t3('Right eye: VCC to the other 3.3V pin (physical pin 17).', 'दाईं आँख: VCC को दूसरे 3.3V पिन (फ़िज़िकल पिन 17) से।', 'Right aankh: VCC ko doosre 3.3V pin (physical pin 17) se.'), see: E },
      { k: 'wire', wire: ['irR.GND', 'GND'], do: t3('Its GND to a GND pin.', 'इसका GND किसी GND पिन से।', 'Iska GND kisi GND pin se.'), see: E },
      { k: 'wire', wire: ['irR.OUT', 'GPIO27'], do: t3('Its OUT to GPIO 27 (physical pin 13).', 'इसका OUT, GPIO 27 (फ़िज़िकल पिन 13) से।', 'Iska OUT, GPIO 27 (physical pin 13) se.'), see: E },
      check,
      run(t3('Run puts the car at START on the track.', '"चलाइए" कार को ट्रैक पर START पर रखता है।', 'Run car ko track par START par rakhta hai.')),
      { k: 'watch', until: (S) => fresh(S) && S.w('lap'), do: t3('Watch a full lap, and the eyes\' lights.', 'एक पूरा चक्कर देखिए, और आँखों की बत्तियाँ।', 'Ek poora chakkar dekhiye, aur aankhon ki lights.'),
        see: t3('Robot.value = (left, right) sets both wheels in one line: (−0.25, 0.5) pulls the left wheel back a little and the car turns left onto the tape.', 'Robot.value = (left, right) एक लाइन में दोनों पहिये सेट करता है: (−0.25, 0.5) बाएँ पहिये को थोड़ा पीछे खींचता है और कार बाएँ मुड़कर टेप पर आ जाती है।', 'Robot.value = (left, right) ek line mein dono pahiye set karta hai: (−0.25, 0.5) left pahiye ko thoda peeche kheenchta hai aur car left mud kar tape par aa jaati hai.') },
      { k: 'edit', test: (src) => (sleepOf(src) || 0) >= 0.2, set: [[/    sleep\(0\.01\)/, '    sleep(0.3)']], do: t3('"It looks 100 times a second, surely 3 is enough?" Change the last sleep(0.01) to sleep(0.3) and Run.', '"यह सेकंड में 100 बार देखता है, 3 बार काफ़ी नहीं?" आख़िरी sleep(0.01) को sleep(0.3) कीजिए और "चलाइए"।', '"Yeh second mein 100 baar dekhta hai, 3 baar kaafi nahi?" Aakhri sleep(0.01) ko sleep(0.3) karo aur Run.'), see: E },
      { k: 'watch', until: (S) => fresh(S) && S.w('lost'), do: t3('Watch the first bend.', 'पहला मोड़ देखिए।', 'Pehla mod dekhiye.'),
        see: t3('Off the track! For 0.3 s at a time the car is blind: it drives about 9 cm with its wheels set the old way, and in a bend the tape has slipped past both eyes before it looks again. A robot\'s loop must be quicker than the world it watches.', 'ट्रैक से बाहर! एक बार में 0.3 s तक कार अंधी रहती है: यह पुरानी सेटिंग पर लगभग 9 cm चल लेती है, और मोड़ में दोबारा देखने से पहले टेप दोनों आँखों के पार निकल चुकी होती है। रोबोट का लूप, जिस दुनिया को वह देखता है उससे तेज़ होना चाहिए।', 'Track se bahar! Ek baar mein 0.3 s tak car andhi rehti hai: yeh purani setting par lagbhag 9 cm chal leti hai, aur mod mein dobara dekhne se pehle tape dono aankhon ke paar nikal chuki hoti hai. Robot ka loop, jis duniya ko woh dekhta hai usse tez hona chahiye.') },
      { k: 'edit', test: (src) => { const s = sleepOf(src); return s !== null && s <= 0.03; }, set: [[/    sleep\(0\.3\)/, '    sleep(0.02)']], do: t3('Make it look often again: sleep(0.02), and Run.', 'इसे फिर से जल्दी-जल्दी देखने दीजिए: sleep(0.02), और "चलाइए"।', 'Ise phir se jaldi-jaldi dekhne dijiye: sleep(0.02), aur Run.'), see: E },
      { k: 'watch', until: (S) => fresh(S) && S.w('lap') && !S.w('lost'), do: t3('Watch a clean lap.', 'एक साफ़ चक्कर देखिए।', 'Ek saaf chakkar dekhiye.'),
        see: t3('Round it goes. Fifty looks a second is plenty here; a racing line follower checks its sensors over a thousand times a second.', 'यह घूम गई। यहाँ सेकंड में पचास बार देखना काफ़ी है; रेस वाली लाइन फ़ॉलोअर अपने सेंसर सेकंड में हज़ार से ज़्यादा बार जाँचती है।', 'Yeh ghoom gayi. Yahan second mein pachaas baar dekhna kaafi hai; race wali line follower apne sensor second mein hazaar se zyada baar jaanchti hai.') },
    ],
    check: [...driveChk, has('irL', IRN), has('irR', IRN), (S) => (S.conn('irL.VCC', '5V') || S.conn('irR.VCC', '5V') ? [X.irVcc] : null), (S) => (S.conn('irL.OUT', 'GPIO27') && S.conn('irR.OUT', 'GPIO17') ? [X.eyesSwap] : null),
      ...[['irL', 17], ['irR', 27]].flatMap(([k, g]) => [need(k + '.VCC', '3V3', t3('sensor\'s VCC', 'सेंसर का VCC', 'sensor ka VCC'), '3.3V'), need(k + '.GND', 'GND', t3('sensor\'s GND', 'सेंसर का GND', 'sensor ka GND'), 'GND'), need(k + '.OUT', 'GPIO' + g, t3('sensor\'s OUT', 'सेंसर का OUT', 'sensor ka OUT'), 'GPIO ' + g)])],
    done: (S) => S.w('lap') && !S.w('lost') && (sleepOf(S.runSrc) || 1) <= 0.03 });

  // 2 ------------------------------------------------------------------------------------------- obstacle avoider
  const SA = sonar('us1', 'r1', 'r2', 45);
  L.push({ id: 'pi_avoidcar', board: 'pi4', cls: '10', view: 'carbench', wview: 'carbench', rview: 'arena', code: PI_AVOID, drawer: ['resistor'], serial: true, world: { kind: 'car', car: 'avoid', board: 'pi', fixed: true },
    title: t3('Obstacle-avoiding car in Python', 'Python में बाधा से बचने वाली कार', 'Python mein obstacle se bachne wali car'),
    goal: t3('A Raspberry Pi car explores a room with boxes: an ultrasonic sensor fixed at its front, gpiozero\'s DistanceSensor, and a random turn so it never gets stuck in a corner. Then the most common bug of all: the wrong units.', 'एक Raspberry Pi कार डिब्बों वाला कमरा घूमती है: इसके आगे लगा अल्ट्रासोनिक सेंसर, gpiozero का DistanceSensor, और एक बेतरतीब मोड़ ताकि यह कभी कोने में न फँसे। फिर सबसे आम गड़बड़: ग़लत इकाई।', 'Ek Raspberry Pi car dabbon wala kamra ghoomti hai: iske aage laga ultrasonic sensor, gpiozero ka DistanceSensor, aur ek random mod taaki yeh kabhi kone mein na phanse. Phir sabse aam gadbad: galat unit.'),
    setup: { parts: [...DRIVE, SA.us], wires: [...DRIVEW, ...RAILS, ...SA.wires] },
    steps: [
      { k: 'info', do: t3('The car (🏁 Robot view) is in a room with boxes. Its drive is wired; its HC-SR04 is on the breadboard with 5 V and GND. Its Echo answers with 5 V, so it needs a divider before the Pi.', 'कार (🏁 रोबोट व्यू) डिब्बों वाले कमरे में है। इसकी ड्राइव जुड़ी है; इसका HC-SR04 ब्रेडबोर्ड पर 5 V और GND के साथ है। इसका Echo 5 V से जवाब देता है, तो Pi तक पहुँचने से पहले इसे डिवाइडर चाहिए।', 'Car (🏁 Robot view) dabbon wale kamre mein hai. Iski drive judi hai; iska HC-SR04 breadboard par 5 V aur GND ke saath hai. Iska Echo 5 V se jawab deta hai, to Pi tak pahunchne se pehle ise divider chahiye.'), see: E },
      { k: 'wire', wire: ['us1.TRIG', 'GPIO23'], do: t3('Wire Trig (column 46) to GPIO 23 (physical pin 16).', 'Trig (कॉलम 46) से GPIO 23 (फ़िज़िकल पिन 16) तक वायर।', 'Trig (column 46) se GPIO 23 (physical pin 16) tak wire.'), see: E },
      { k: 'place', place: SA.parts[0], do: t3('Put the 1 kΩ resistor (brown, black, red) from Echo\'s column 47 to column 43, in row g.', '1 kΩ रेज़िस्टर (भूरा, काला, लाल) Echo के कॉलम 47 से कॉलम 43 तक, पंक्ति g में लगाइए।', '1 kΩ resistor (brown, black, red) Echo ke column 47 se column 43 tak, row g mein lagaiye.'), see: E },
      { k: 'place', place: SA.parts[1], do: t3('Put the 2.2 kΩ resistor (red, red, red) from 43j into the − rail.', '2.2 kΩ रेज़िस्टर (लाल, लाल, लाल) 43j से − रेल में लगाइए।', '2.2 kΩ resistor (laal, laal, laal) 43j se − rail mein lagaiye.'), see: E },
      { k: 'wire', wire: ['r2.1', 'GPIO24'], do: t3('Wire the middle of the divider (column 43) to GPIO 24 (physical pin 18).', 'डिवाइडर के बीच (कॉलम 43) से GPIO 24 (फ़िज़िकल पिन 18) तक वायर।', 'Divider ke beech (column 43) se GPIO 24 (physical pin 18) tak wire.'),
        see: t3('5 V × 2.2 ÷ (1 + 2.2) ≈ 3.4 V: a safe HIGH for the Pi.', '5 V × 2.2 ÷ (1 + 2.2) ≈ 3.4 V: Pi के लिए सुरक्षित HIGH।', '5 V × 2.2 ÷ (1 + 2.2) ≈ 3.4 V: Pi ke liye surakshit HIGH.') },
      check,
      run(),
      { k: 'watch', until: (S) => fresh(S) && S.w('explored') && S.wv('exploredBumps') === 0, do: t3('Watch the car explore, and "Too close" in the terminal.', 'कार को घूमते देखिए, और टर्मिनल में "Too close"।', 'Car ko ghoomte dekhiye, aur terminal mein "Too close".'),
        see: t3('Nearer than 0.30 m it backs off and turns to a side picked by choice(): like a coin toss, so it cannot get stuck going left, right, left in one corner.', '0.30 m से पास आने पर यह पीछे हटती है और choice() से चुनी तरफ़ मुड़ती है: सिक्का उछालने जैसा, ताकि यह एक कोने में बाएँ, दाएँ, बाएँ करते हुए फँस न सके।', '0.30 m se paas aane par yeh peeche hatti hai aur choice() se chuni taraf mudti hai: sikka uchhaalne jaisa, taaki yeh ek kone mein left, right, left karte hue phans na sake.') },
      { k: 'edit', test: (src) => (numOf(src, 'safe') || 0) >= 5, set: [[/safe = 0\.30 /, 'safe = 30   ']], do: t3('A friend says "safe distance is 30 cm" and types safe = 30. Change it to safe = 30 and Run.', 'एक दोस्त कहता है "सुरक्षित दूरी 30 cm है" और safe = 30 लिखता है। इसे safe = 30 कीजिए और "चलाइए"।', 'Ek dost kehta hai "safe doori 30 cm hai" aur safe = 30 likhta hai. Ise safe = 30 karo aur Run.'), see: E },
      { k: 'watch', until: (S) => fresh(S) && S.w('back') && S.wv('fwdD') < 150 && S.lineCount() >= 6, do: t3('Watch the car and the terminal.', 'कार और टर्मिनल देखिए।', 'Car aur terminal dekhiye.'),
        see: t3('It never drives on: it backs and turns, backs and turns, with the room empty ahead. .distance is in metres, at most 2 here: every reading is less than 30, so every wall is "too close". Units are the bug behind real disasters, like the Mars Climate Orbiter lost in 1999.', 'यह कभी आगे नहीं जाती: पीछे और मुड़ना, पीछे और मुड़ना, जबकि आगे कमरा ख़ाली है। .distance मीटर में है, यहाँ ज़्यादा से ज़्यादा 2: हर रीडिंग 30 से कम है, तो हर दीवार "बहुत पास" है। इकाइयों की ग़लती असली बड़ी घटनाओं के पीछे रही है, जैसे 1999 में खोया Mars Climate Orbiter।', 'Yeh kabhi aage nahi jaati: peeche aur mudna, peeche aur mudna, jabki aage kamra khaali hai. .distance metre mein hai, yahan zyada se zyada 2: har reading 30 se kam hai, to har deewar "bahut paas" hai. Units ki galti asli badi ghatnaon ke peeche rahi hai, jaise 1999 mein khoya Mars Climate Orbiter.') },
      { k: 'edit', test: (src) => { const v = numOf(src, 'safe'); return v !== null && v >= 0.2 && v <= 0.5; }, set: [[/safe = 30   /, 'safe = 0.30 ']], do: t3('Put it back in metres: safe = 0.30, and Run.', 'इसे वापस मीटर में कीजिए: safe = 0.30, और "चलाइए"।', 'Ise wapas metre mein kijiye: safe = 0.30, aur Run.'), see: E },
      { k: 'watch', until: (S) => fresh(S) && S.w('explored') && S.wv('exploredBumps') === 0, do: t3('Watch it explore again.', 'इसे फिर से घूमते देखिए।', 'Ise phir se ghoomte dekhiye.'),
        see: t3('Exploring again. Good habit: name a variable with its unit (safe_m = 0.30) so nobody can mix them up.', 'फिर से घूम रही है। अच्छी आदत: वेरिएबल के नाम में उसकी इकाई रखिए (safe_m = 0.30) ताकि कोई गड़बड़ न करे।', 'Phir se ghoom rahi hai. Achhi aadat: variable ke naam mein uski unit rakhiye (safe_m = 0.30) taaki koi gadbad na kare.') },
    ],
    check: [...driveChk, has('us1', USN), ...sonarChk('us1', 'r1', 'r2', 23, 24)],
    done: (S) => S.w('explored') && S.wv('exploredBumps') === 0 && (numOf(S.runSrc, 'safe') || 9) < 1 });

  // 3 ------------------------------------------------------------------------------------------------ wall follower
  const SF = sonar('us1', 'r1', 'r2', 45), SS = sonar('us2', 'r3', 'r4', 30);
  L.push({ id: 'pi_wallcar', board: 'pi4', cls: '10', view: 'carbench', wview: 'carbench', rview: 'arenamaze', code: PI_WALL, drawer: ['hcsr04'], serial: true, world: { kind: 'car', car: 'mazeR', board: 'pi' },
    title: t3('Wall-following robot (P control)', 'दीवार के साथ चलने वाला रोबोट (P कंट्रोल)', 'Deewar ke saath chalne wala robot (P control)'),
    goal: t3('A Raspberry Pi robot keeps a wall on its right at 15 cm, steering a little for a small error and a lot for a big one: proportional (P) control, the first step of the PID control in drones, cruise control and self-driving cars. It follows the right wall through the maze to FINISH.', 'एक Raspberry Pi रोबोट अपनी दाईं ओर की दीवार को 15 cm पर रखता है, छोटी ग़लती पर थोड़ा और बड़ी पर ज़्यादा मुड़ते हुए: आनुपातिक (P) कंट्रोल, ड्रोन, क्रूज़ कंट्रोल और बिना ड्राइवर की कारों के PID कंट्रोल का पहला क़दम। यह दाईं दीवार के साथ भूलभुलैया से FINISH तक जाता है।', 'Ek Raspberry Pi robot apni right ki deewar ko 15 cm par rakhta hai, chhoti galti par thoda aur badi par zyada mudte hue: proportional (P) control, drone, cruise control aur bina driver ki cars ke PID control ka pehla kadam. Yeh right deewar ke saath bhool-bhulaiya se FINISH tak jaata hai.'),
    setup: { parts: [...DRIVE, SF.us, ...SF.parts, ...SS.parts, F('irM', 'ir', {}, 178, 62, 2)],
      wires: [...DRIVEW, ...RAILS, ...SF.wires, ...SS.wires, ['H:f46', 'B:GPIO23'], ['H:h43', 'B:GPIO24'], ['T:irM:VCC', 'B:3V3'], ['T:irM:GND', 'B:GND3'], ['T:irM:OUT', 'B:GPIO4']] },
    steps: [
      { k: 'info', do: t3('Ready on the bench: the drive, the front HC-SR04 (Trig GPIO 23, Echo through its divider to GPIO 24), the IR under the nose for FINISH (GPIO 4), and a second divider in columns 28–34 for the right-hand sensor.', 'बेंच पर तैयार: ड्राइव, आगे वाला HC-SR04 (Trig GPIO 23, Echo अपने डिवाइडर से GPIO 24), FINISH के लिए नाक के नीचे वाला IR (GPIO 4), और दाएँ सेंसर के लिए कॉलम 28–34 में दूसरा डिवाइडर।', 'Bench par taiyaar: drive, aage wala HC-SR04 (Trig GPIO 23, Echo apne divider se GPIO 24), FINISH ke liye naak ke neeche wala IR (GPIO 4), aur right sensor ke liye column 28–34 mein doosra divider.'), see: E },
      { k: 'place', place: SS.us, do: t3('Plug the right-hand ultrasonic sensor into 30j–33j: its Echo (column 32) meets the 1 kΩ.', 'दाएँ वाले अल्ट्रासोनिक सेंसर को 30j–33j में लगाइए: इसका Echo (कॉलम 32) 1 kΩ से मिलता है।', 'Right wale ultrasonic sensor ko 30j–33j mein lagaiye: iska Echo (column 32) 1 kΩ se milta hai.'),
        see: t3('On the robot it sits on the right edge, looking right at the wall.', 'रोबोट पर यह दाएँ किनारे पर है, दाईं ओर दीवार को देखता हुआ।', 'Robot par yeh right kinaare par hai, right ki taraf deewar ko dekhta hua.') },
      { k: 'wire', wire: ['us2.TRIG', 'GPIO16'], do: t3('Wire its Trig (column 31) to GPIO 16 (physical pin 36).', 'इसका Trig (कॉलम 31) GPIO 16 (फ़िज़िकल पिन 36) से जोड़िए।', 'Iska Trig (column 31) GPIO 16 (physical pin 36) se jodiye.'), see: E },
      { k: 'wire', wire: ['r4.1', 'GPIO26'], do: t3('Wire the middle of its divider (column 28) to GPIO 26 (physical pin 37).', 'इसके डिवाइडर के बीच (कॉलम 28) को GPIO 26 (फ़िज़िकल पिन 37) से जोड़िए।', 'Iske divider ke beech (column 28) ko GPIO 26 (physical pin 37) se jodiye.'), see: E },
      check,
      { k: 'info', code: [12, 13, 14, 29, 30, 31], do: t3('The P controller: error = right − target (in cm); steer = kp × error; the left wheel gets base + steer, the right base − steer. 5 cm too far: steer 0.15, a gentle turn towards the wall. Twice the error, twice the turn.', 'P कंट्रोलर: error = right − target (cm में); steer = kp × error; बाएँ पहिये को base + steer, दाएँ को base − steer। 5 cm ज़्यादा दूर: steer 0.15, दीवार की ओर हल्का मोड़। दोगुनी ग़लती, दोगुना मोड़।', 'P controller: error = right − target (cm mein); steer = kp × error; left pahiye ko base + steer, right ko base − steer. 5 cm zyada door: steer 0.15, deewar ki or halka mod. Doguni galti, doguna mod.'), see: E },
      run(t3('Run puts the robot at START in maze A.', '"चलाइए" रोबोट को भूलभुलैया A में START पर रखता है।', 'Run robot ko bhool-bhulaiya A mein START par rakhta hai.')),
      { k: 'watch', until: (S) => S.fresh() && S.w('solved'), do: t3('Watch it follow the right wall, and the panel.', 'इसे दाईं दीवार के साथ चलते देखिए, और पैनल।', 'Ise right deewar ke saath chalte dekhiye, aur panel.'),
        see: t3('Smooth along the walls, round the ends, and out. The right hand took a shorter way through this maze than the Uno\'s left hand (no dead end); in another maze it is the other way round.', 'दीवारों के साथ आराम से, सिरों के चारों ओर, और बाहर। इस भूलभुलैया में दाएँ हाथ ने Uno के बाएँ हाथ से छोटा रास्ता लिया (कोई बंद गली नहीं); किसी दूसरी भूलभुलैया में इसका उल्टा होता है।', 'Deewaron ke saath aaram se, siron ke chaaron or, aur bahar. Is bhool-bhulaiya mein right haath ne Uno ke left haath se chhota raasta liya (koi band gali nahi); kisi doosri bhool-bhulaiya mein iska ulta hota hai.') },
      { k: 'edit', test: (src) => (numOf(src, 'kp') || 0) >= 0.4, set: [[/kp = 0\.03 /, 'kp = 0.5  ']], do: t3('Make it steer harder: kp = 0.5, and Run.', 'इसे ज़ोर से मोड़िए: kp = 0.5, और "चलाइए"।', 'Ise zor se modiye: kp = 0.5, aur Run.'), see: E },
      { k: 'watch', until: (S) => S.fresh() && S.w('wobble'), do: t3('Watch it on the first straight.', 'इसे पहले सीधे रास्ते पर देखिए।', 'Ise pehle seedhe raaste par dekhiye.'),
        see: t3('It swings from side to side, harder and harder, and soon hits a wall or loses its way. Each correction is too big, so it overshoots the line, and its sensors and wheels are a little late. Too much gain makes a controller oscillate: drones and ovens tuned like this shake or overheat.', 'यह एक तरफ़ से दूसरी तरफ़ झूलता है, और ज़ोर से, और जल्द ही दीवार से टकराता है या रास्ता भटक जाता है। हर सुधार बहुत बड़ा है, तो यह आगे निकल जाता है, और इसके सेंसर और पहिये थोड़ी देर से चलते हैं। बहुत ज़्यादा gain कंट्रोलर को डोलने पर मजबूर करता है: ऐसे सेट किए ड्रोन और ओवन काँपते या ज़्यादा गर्म होते हैं।', 'Yeh ek taraf se doosri taraf jhoolta hai, aur zor se, aur jald hi deewar se takraata hai ya raasta bhatak jaata hai. Har sudhaar bahut bada hai, to yeh aage nikal jaata hai, aur iske sensor aur pahiye thodi der se chalte hain. Bahut zyada gain controller ko dolne par majboor karta hai: aise set kiye drone aur oven kaanpte ya zyada garam hote hain.') },
      { k: 'edit', test: (src) => { const v = numOf(src, 'kp'); return v !== null && v >= 0.01 && v <= 0.06; }, set: [[/kp = 0\.5  /, 'kp = 0.04 ']], do: t3('Tune it: a kp between 0.01 and 0.06 (try 0.04), and Run.', 'इसे ठीक कीजिए: 0.01 और 0.06 के बीच का kp (0.04 आज़माइए), और "चलाइए"।', 'Ise theek kijiye: 0.01 aur 0.06 ke beech ka kp (0.04 aazmaiye), aur Run.'), see: E },
      { k: 'watch', until: (S) => S.fresh() && S.w('solved') && S.wv('solvedBumps') === 0, do: t3('Watch it reach FINISH with no bump.', 'इसे बिना टक्कर FINISH तक पहुँचते देखिए।', 'Ise bina takkar FINISH tak pahunchte dekhiye.'),
        see: t3('Tuned. Engineers tune a controller just like this: raise the gain until it starts to wobble, then take it back a good step. PID adds two more terms (I and D) to calm the wobble and remove the last error.', 'सेट हो गया। इंजीनियर कंट्रोलर को ठीक ऐसे ही सेट करते हैं: gain तब तक बढ़ाओ जब तक यह डोलने न लगे, फिर एक अच्छा क़दम पीछे लो। PID इसमें दो और हिस्से (I और D) जोड़ता है, डोलना शांत करने और बची ग़लती मिटाने के लिए।', 'Set ho gaya. Engineer controller ko theek aise hi set karte hain: gain tab tak badhao jab tak yeh dolne na lage, phir ek achha kadam peeche lo. PID ismein do aur hisse (I aur D) jodta hai, dolna shaant karne aur bachi galti mitaane ke liye.') },
    ],
    check: [...driveChk, has('us2', USN), ...sonarChk('us2', 'r3', 'r4', 16, 26), ...sonarChk('us1', 'r1', 'r2', 23, 24), need('irM.OUT', 'GPIO4', t3('FINISH sensor\'s OUT', 'FINISH सेंसर का OUT', 'FINISH sensor ka OUT'), 'GPIO 4')],
    tick: (S) => { const v = numOf(S.runSrc, 'kp'); if (v === null) return; if (S.w('wobble') && v >= 0.2) S.mem.wobbled = true; if (S.mem.wobbled && S.w('solved') && S.wv('solvedBumps') === 0 && v <= 0.06) S.mem.tuned = true; },
    done: (S) => !!S.mem.tuned });

  void doneRun; void lines;
  for (const l of L) { l.n = ++n; l.lang = 'py'; l.batch = 19; }
  return L;
}
