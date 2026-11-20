// DUET Robotics Lab 360, batch 11: micro:bit projects for Class 5 (Python, or blocks): data loggers that write CSV
// lines (environment, solar spots, egg drop, rocket launch), games (flappy bird on 5 × 5, a radio infection game),
// binary numbers, a combination lock, and a railway crossing with a servo barrier. Written fresh for DUET.
// Same shape as lessons8.js (tick, S.memRun, S.mem); devtools/test/robocore8.mjs plays every one.
import { MBCore, MBX } from './microbit.js';

const make = (app, cfg) => new MBCore(app, cfg);
const centre = (dx, dz) => (focus) => ({ c: [MBX + dx, 0, dz], k: focus === 'robot' ? 0.55 : 1 });
const world = (o) => Object.assign({ kind: 'mb', make, centre: centre(o.cx || 0, o.cz || 0) }, o);
const img = (S) => S.wv('shownImg');
const px = (S) => [...(S.wv('shown') || [])];
const lit = (S) => px(S).filter((v) => v > 0).length;
const texts = (S) => (S.wv('texts') || []).map(String);
const has = (S, re) => texts(S).some((t) => re.test(t));
const lastNum = (S) => { const n = S.wv('nums') || []; return n.length ? +n[n.length - 1] : null; };
const ran = (S, re) => re.test(S.runSrc || '');
const R = (S) => S.memRun || {}; const M = (S) => S.mem || {};
const lines = (S, re) => (S.serLines || []).filter((l) => re.test(String(l).trim()));

// ------------------------------------------------------------------ the programs
const ENVLOG = `# Environment data logger: every 2 seconds it writes the time, the temperature and
# the light level as one line of CSV (values with commas), ready for a spreadsheet
from microbit import *

print("seconds,temperature,light")
start = running_time()
while True:
    secs = (running_time() - start) // 1000
    print(str(secs) + "," + str(temperature()) + "," + str(display.read_light_level()))
    display.show(Image.DIAMOND_SMALL)     # a blink: a reading was taken
    sleep(100)
    display.clear()
    sleep(1900)
`;
const SOLAR = `# Solar panel test: put the micro:bit where a solar panel could go and press A to log
# the light there. B tells you which spot was the brightest.
from microbit import *

readings = []
while True:
    if button_a.was_pressed():
        level = display.read_light_level()
        readings.append(level)
        print(len(readings), level)
        display.scroll(len(readings))
    if button_b.was_pressed() and len(readings) > 0:
        best = readings.index(max(readings)) + 1
        display.scroll("SPOT " + str(best))
    sleep(20)
`;
const EGG = `# Egg drop: pack an egg and the micro:bit in a box and drop it.
# It keeps the biggest jolt; A shows it, and says if the egg would have cracked.
from microbit import *

biggest = 0
while True:
    s = accelerometer.get_strength()       # about 1000 (1 g) when still
    if s > biggest:
        biggest = s
    if button_a.was_pressed():
        display.scroll(biggest)
        if biggest > 2500:
            display.show(Image.SAD)        # cracked!
        else:
            display.show(Image.HAPPY)      # safe
    if button_b.was_pressed():             # B: ready for the next drop
        biggest = 0
        display.show(Image.YES)
    sleep(5)
`;
const ROCKET = `# Rocket logger: it waits for the launch (a big jolt), then records the push
# every 100 ms for 2 seconds. A shows the biggest, and the readings go to the Serial Monitor.
from microbit import *

display.show(Image.ARROW_N)
while True:
    if accelerometer.get_strength() > 1500:          # lift-off!
        flight = []
        for i in range(20):
            flight.append(accelerometer.get_strength())
            sleep(100)
        for value in flight:
            print(value)
        display.show(Image.YES)
        while not button_a.was_pressed():
            sleep(20)
        display.scroll(max(flight))
        display.show(Image.ARROW_N)
    sleep(5)
`;
const FLAPPY = `# Flappy bird on 5 x 5: A flaps the bird (left column) up; it falls by itself.
# Fly through the gaps in the pipes. Touching a pipe ends the game.
from microbit import *
import random

bird = 2
pipe_x = 4
gap = random.randint(0, 3)               # the gap is rows gap and gap + 1
score = 0
tick = 0
while True:
    if button_a.was_pressed() and bird > 0:
        bird -= 1
    tick += 1
    if tick % 3 == 0 and bird < 4:       # gravity, every 3rd turn
        bird += 1
    if tick % 4 == 0:                    # the pipe moves left every 4th turn
        pipe_x -= 1
        if pipe_x < 0:
            pipe_x = 4
            gap = random.randint(0, 3)
            score += 1
    if pipe_x == 0 and not (gap <= bird <= gap + 1):
        display.scroll("SCORE " + str(score))
        bird, pipe_x, score, tick = 2, 4, 0, 0
        gap = random.randint(0, 3)
    display.clear()
    for y in range(5):
        if not (gap <= y <= gap + 1):
            display.set_pixel(pipe_x, y, 4)
    display.set_pixel(0, bird, 9)
    sleep(150)
`;
const INFECT = `# Infection game: one player is "patient zero" (press B). A sick micro:bit
# coughs by radio; a healthy one nearby that hears it may catch it (1 chance in 3 each cough).
from microbit import *
import radio
import random

radio.on()
radio.config(group=88)
sick = False
display.show(Image.HAPPY)
while True:
    if button_b.was_pressed():
        sick = True                      # patient zero
    if sick:
        radio.send("COUGH")
        display.show(Image.SAD)
    msg = radio.receive()
    if msg == "COUGH" and not sick and random.randint(1, 3) == 1:
        sick = True
    sleep(500)
`;
const BINARY = `# Binary stopwatch: the bottom row counts the seconds in binary.
# Each LED is worth double the one on its right: 16, 8, 4, 2, 1.
from microbit import *

while True:
    secs = running_time() // 1000 % 32         # 0 to 31, then again
    for x in range(5):
        bit = (secs >> (4 - x)) & 1            # is this LED's value in secs?
        display.set_pixel(x, 4, 9 * bit)
    if button_a.was_pressed():
        display.scroll(secs)
    sleep(50)
`;
const LOCK = `# Combination lock: enter the secret code with A and B, then touch the logo.
# Three wrong tries lock it for 10 seconds.
from microbit import *

SECRET = "ABAA"
entered = ""
wrong = 0
display.show(Image.SQUARE)
while True:
    if button_a.was_pressed():
        entered += "A"
        display.show("A")
    if button_b.was_pressed():
        entered += "B"
        display.show("B")
    if pin_logo.was_touched():
        if entered == SECRET:
            display.show(Image.YES)            # open!
            wrong = 0
        else:
            display.show(Image.NO)
            wrong += 1
            if wrong == 3:
                display.scroll("LOCKED")
                sleep(10000)
                wrong = 0
        entered = ""
        sleep(1000)
        display.show(Image.SQUARE)
    sleep(20)
`;
const RAIL = `# Railway crossing: a train touches the track sensor (pin 1). The lights flash,
# the bell rings and the barrier (a servo on pin 0) comes down; it rises 3 s after the train.
from microbit import *
import music

def angle(a):
    pin0.write_analog(int(26 + a * 102 / 180))

pin0.set_analog_period(20)
angle(90)                                 # barrier up
last_train = -10000
while True:
    if pin1.is_touched():
        last_train = running_time()
    if running_time() - last_train < 3000:
        angle(0)                          # barrier down
        display.show(Image.NO)
        music.pitch(1000, 100)
        display.clear()
        sleep(150)
    else:
        angle(90)
        display.show(Image.YES)
        sleep(20)
`;
const LEARN = `# Gesture recognition, the machine-learning way. Teach it with examples:
# A records "wave" (hold the board tilted right), B records "rest" (hold it flat).
# Then it guesses: the gesture whose average is nearest to what it feels now.
from microbit import *

wave = []
rest = []
while True:
    x = accelerometer.get_x()
    if button_a.was_pressed():
        wave.append(x)                    # one example of "wave"
        display.show(len(wave))
        sleep(500)
    if button_b.was_pressed():
        rest.append(x)                    # one example of "rest"
        display.show(len(rest))
        sleep(500)
    if len(wave) >= 3 and len(rest) >= 3:     # trained: guess
        avg_wave = sum(wave) / len(wave)
        avg_rest = sum(rest) / len(rest)
        if abs(x - avg_wave) < abs(x - avg_rest):
            display.show("W")
        else:
            display.show("R")
    sleep(50)
`;
export const MB11_CODES = { ENVLOG, SOLAR, EGG, ROCKET, FLAPPY, INFECT, BINARY, LOCK, RAIL, LEARN };

export function batch11(K, n0) {
  const { t3 } = K;
  const T = (en, hi, hg) => t3(en, hi, hg);
  const E = T('', '', '');
  const run = (see) => ({ k: 'run', do: T('Press Run.', '"चलाइए" दबाइए।', 'Run dabaiye.'), see: see || T('The program goes into the micro:bit and starts.', 'प्रोग्राम micro:bit में जाकर चलने लगता है।', 'Program micro:bit mein jaakar chalne lagta hai.') });
  const info = (code, d, s) => ({ k: 'info', code, do: d, see: s || E });
  const act = (until, d, s) => ({ k: 'act', until, do: d, see: s || E });
  const watch = (until, d, s) => ({ k: 'watch', until, do: d, see: s || E });
  const edit = (test, set, d) => ({ k: 'edit', test, set, do: d, see: E });
  const desk = (title, controls, hud, more) => world(Object.assign({ scene: 'desk', controls, hud: hud || [], title }, more || {}));
  const X = {
    clip: T('A crocodile clip is missing: {a} must be joined to {b}.', 'एक क्रोकोडाइल क्लिप कम है: {a} को {b} से जोड़िए।', 'Ek crocodile clip kam hai: {a} ko {b} se jodiye.'),
    short: T('3V is clipped straight to GND: that is a short circuit! Take that clip off.', '3V सीधे GND से जुड़ा है: यह शॉर्ट सर्किट है! वह क्लिप हटाइए।', '3V seedhe GND se juda hai: yeh short circuit hai! Woh clip hataiye.'),
    servoPow: T('The servo\'s red (+) wire must go to 3V and its brown wire to GND, or it has no power.', 'सर्वो का लाल (+) तार 3V पर और भूरा तार GND पर जाना चाहिए, वरना उसे बिजली नहीं मिलेगी।', 'Servo ka red (+) taar 3V par aur brown taar GND par jaana chahiye, warna use power nahi milegi.'),
  };
  const L = [
    // 1 ------------------------------------------------------------------------------------------------------------
    { id: 'mbenvlog', view: 'mb', code: ENVLOG, drawer: [], serial: true,
      title: T('Environment data logger', 'पर्यावरण डेटा लॉगर', 'Environment data logger'),
      goal: T('Log the temperature and the light every 2 seconds as CSV lines, then add a third sensor.', 'हर 2 सेकंड पर तापमान और रोशनी CSV लाइनों में लिखिए, फिर तीसरा सेंसर जोड़िए।', 'Har 2 second par temperature aur roshni CSV lines mein likhiye, phir teesra sensor jodiye.'),
      world: desk(T('Data logger', 'डेटा लॉगर', 'Data logger'), ['temp', 'light', 'sound'], ['temp', 'light']),
      setup: { parts: [], wires: [] },
      tick: (S) => { if (lines(S, /^\d+,\d+,\d+$/).some((l) => +l.split(',')[1] >= 36)) S.memRun.hot = true; if (ran(S, /sound_level/) && lines(S, /^\d+,\d+,\d+,\d+$/).length >= 2) S.mem.four = true; },
      steps: [
        info([9], T('One print() makes one line: the numbers joined with commas. That is CSV (comma-separated values): every spreadsheet can open it.', 'एक print() एक लाइन बनाता है: कॉमा से जुड़ी संख्याएँ। यह CSV (कॉमा से अलग मान) है: हर स्प्रेडशीट इसे खोल सकती है।', 'Ek print() ek line banata hai: comma se judi sankhyaein. Yeh CSV (comma separated values) hai: har spreadsheet ise khol sakti hai.')),
        run(T('Open the Serial Monitor: a header line, then a reading every 2 seconds.', 'सीरियल मॉनिटर खोलिए: एक शीर्षक लाइन, फिर हर 2 सेकंड पर एक रीडिंग।', 'Serial Monitor kholiye: ek heading line, phir har 2 second par ek reading.')),
        watch((S) => lines(S, /^\d+,\d+,\d+$/).length >= 3, T('Watch three readings arrive.', 'तीन रीडिंग आते देखिए।', 'Teen reading aate dekhiye.'), T('seconds, °C, light: a table growing line by line.', 'सेकंड, °C, रोशनी: लाइन-दर-लाइन बढ़ती तालिका।', 'second, °C, roshni: line-dar-line badhti table.')),
        act((S) => !!R(S).hot, T('Warm it up: slide Temperature to 35 °C.', 'गर्म कीजिए: Temperature को 35 °C कीजिए।', 'Garam kijiye: Temperature ko 35 °C kijiye.'), T('The next line shows it. Leave a logger in the classroom all day and you see the room heat up after lunch.', 'अगली लाइन में दिखता है। लॉगर को दिन भर कक्षा में छोड़िए और देखिए दोपहर बाद कमरा कैसे गर्म होता है।', 'Agli line mein dikhta hai. Logger ko din bhar class mein chhodiye aur dekhiye dopahar baad kamra kaise garam hota hai.')),
        edit((src) => /sound_level\(\)/.test(src) && /light,sound/.test(src), [[/"seconds,temperature,light"/, '"seconds,temperature,light,sound"'], [/str\(display\.read_light_level\(\)\)\)/, 'str(display.read_light_level()) + "," + str(microphone.sound_level()))']],
          T('A third sensor: change the header to "seconds,temperature,light,sound" and add + "," + str(microphone.sound_level()) at the end of the print, inside its brackets. Then Run.', 'तीसरा सेंसर: शीर्षक को "seconds,temperature,light,sound" कीजिए और print के आख़िर में, कोष्ठक के अंदर + "," + str(microphone.sound_level()) जोड़िए। फिर "चलाइए"।', 'Teesra sensor: heading ko "seconds,temperature,light,sound" karo aur print ke aakhir mein, bracket ke andar + "," + str(microphone.sound_level()) jodiye. Phir Run.')),
        watch((S) => !!M(S).four, T('Watch the new lines.', 'नई लाइनें देखिए।', 'Nayi lines dekhiye.'), T('Four columns now. Weather stations log like this, every few minutes, for years.', 'अब चार कॉलम। मौसम केंद्र ऐसे ही, हर कुछ मिनट पर, सालों तक लिखते हैं।', 'Ab chaar column. Mausam kendra aise hi, har kuch minute par, saalon tak likhte hain.')),
      ],
      done: (S) => !!M(S).four },
    // 2 ------------------------------------------------------------------------------------------------------------
    { id: 'mbsolar', view: 'mb', code: SOLAR, drawer: [], serial: true,
      title: T('Solar panel experiment logger', 'सोलर पैनल प्रयोग लॉगर', 'Solar panel experiment logger'),
      goal: T('Measure the light at different spots, keep the readings in a list, and let the micro:bit pick the best place for a solar panel.', 'अलग-अलग जगह रोशनी नापिए, रीडिंग एक सूची में रखिए, और micro:bit को सोलर पैनल की सबसे अच्छी जगह चुनने दीजिए।', 'Alag-alag jagah roshni naapiye, reading ek list mein rakhiye, aur micro:bit ko solar panel ki sabse achhi jagah chunne dijiye.'),
      world: desk(T('Solar spots', 'सोलर जगहें', 'Solar jagahein'), ['light', 'A', 'B', 'logo'], ['light']),
      setup: { parts: [], wires: [] },
      tick: (S) => { const m = S.memRun; const lp = (S.wv('presses') || {}).logo || 0; if (m.l0 === undefined) m.l0 = lp; if (ran(S, /sum\(readings\)/) && lp > m.l0 && /^\d+$/.test(texts(S).slice(-1)[0] || '')) S.mem.avg = true; },
      steps: [
        info([5, 9], T('readings = [] is an empty list. append() adds each new reading at the end, so the list remembers every spot.', 'readings = [] एक ख़ाली सूची है। append() हर नई रीडिंग आख़िर में जोड़ता है, तो सूची हर जगह याद रखती है।', 'readings = [] ek khaali list hai. append() har nayi reading aakhir mein jodta hai, to list har jagah yaad rakhti hai.')),
        info([13], T('max(readings) is the biggest; readings.index() finds where it is in the list. Lists count from 0, so + 1 gives the spot number.', 'max(readings) सबसे बड़ी है; readings.index() बताता है कि वह सूची में कहाँ है। सूची 0 से गिनती है, इसलिए + 1 जगह का नंबर देता है।', 'max(readings) sabse badi hai; readings.index() batata hai ki woh list mein kahan hai. List 0 se ginti hai, isliye + 1 jagah ka number deta hai.')),
        run(),
        act((S) => (S.nums || []).length >= 3, T('Three spots: Room light 30% (shade), press A; 90% (the roof), press A; 60% (a window), press A.', 'तीन जगहें: Room light 30% (छाया), A दबाइए; 90% (छत), A दबाइए; 60% (खिड़की), A दबाइए।', 'Teen jagah: Room light 30% (chhaaya), A dabaiye; 90% (chhat), A dabaiye; 60% (khidki), A dabaiye.'), T('Each reading goes into the list, and to the Serial Monitor.', 'हर रीडिंग सूची में जाती है, और सीरियल मॉनिटर पर।', 'Har reading list mein jaati hai, aur Serial Monitor par.')),
        act((S) => has(S, /^SPOT 2$/), T('Press B: which spot was the brightest?', 'B दबाइए: कौन-सी जगह सबसे रोशन थी?', 'B dabaiye: kaun si jagah sabse roshan thi?'), T('SPOT 2: the roof. That is where a panel makes the most electricity.', 'SPOT 2: छत। वहीं पैनल सबसे ज़्यादा बिजली बनाता है।', 'SPOT 2: chhat. Wahin panel sabse zyada bijli banata hai.')),
        edit((src) => /pin_logo\.was_touched\(\)/.test(src) && /sum\(readings\) \/\/ len\(readings\)/.test(src), [[/(    sleep\(20\))/, '    if pin_logo.was_touched() and len(readings) > 0:\n        display.scroll(sum(readings) // len(readings))\n$1']],
          T('The average too: above sleep(20) add\n    if pin_logo.was_touched() and len(readings) > 0:\n        display.scroll(sum(readings) // len(readings))\nthen Run.', 'औसत भी: sleep(20) के ऊपर लिखिए\n    if pin_logo.was_touched() and len(readings) > 0:\n        display.scroll(sum(readings) // len(readings))\nफिर "चलाइए"।', 'Average bhi: sleep(20) ke upar likhiye\n    if pin_logo.was_touched() and len(readings) > 0:\n        display.scroll(sum(readings) // len(readings))\nphir Run.')),
        act((S) => !!M(S).avg, T('Log two spots again (A, A), then touch the logo.', 'फिर दो जगह लिखिए (A, A), फिर लोगो छूइए।', 'Phir do jagah likhiye (A, A), phir logo chhuiye.'), T('The average: add them all up, divide by how many. (and len(readings) > 0 stops a divide by zero.)', 'औसत: सब जोड़िए, गिनती से भाग दीजिए। (and len(readings) > 0 शून्य से भाग को रोकता है।)', 'Average: sab jodiye, ginti se bhaag dijiye. (and len(readings) > 0 shoonya se bhaag ko rokta hai.)')),
      ],
      done: (S) => !!M(S).avg },
    // 3 ------------------------------------------------------------------------------------------------------------
    { id: 'mbeggdrop', view: 'mb', code: EGG, drawer: [],
      title: T('Egg drop impact logger', 'अंडा गिराने वाला झटका लॉगर', 'Egg drop impact logger'),
      goal: T('Record the biggest jolt when a box is dropped, and tell whether an egg inside would crack.', 'डिब्बा गिरने पर सबसे बड़ा झटका रिकॉर्ड कीजिए, और बताइए अंदर का अंडा टूटता या नहीं।', 'Dibba girne par sabse bada jhatka record kijiye, aur bataiye andar ka anda toot-ta ya nahi.'),
      world: desk(T('Egg drop', 'अंडा गिराना', 'Anda girana'), ['shake', 'A', 'B'], ['acc']),
      setup: { parts: [], wires: [] },
      tick: (S) => { const i = img(S); if (i === 'SAD' || i === 'HAPPY') { if (S.w('scrolled')) S.memRun.verdict = i; } if (ran(S, /biggest \/ 1000/) && has(S, /^\d\.\d+$/)) S.mem.g = true; },
      steps: [
        info([7, 8, 9], T('get_strength() is how hard the board is pushed, in milli-g. Each reading bigger than biggest becomes the new biggest: the program keeps the record.', 'get_strength() बताता है बोर्ड पर कितना ज़ोर है, milli-g में। biggest से बड़ी हर रीडिंग नया biggest बनती है: प्रोग्राम रिकॉर्ड रखता है।', 'get_strength() batata hai board par kitna zor hai, milli-g mein. biggest se badi har reading naya biggest banti hai: program record rakhta hai.')),
        run(),
        act((S) => !!R(S).verdict, T('Drop the box (press "Shake it" for the landing), then press A.', 'डिब्बा गिराइए (ज़मीन से टकराने के लिए "हिलाइए" दबाइए), फिर A दबाइए।', 'Dibba giraiye (zameen se takraane ke liye "Hilaiye" dabaiye), phir A dabaiye.'), T('The biggest jolt, then a verdict: over 2500 milli-g (2.5 g) the egg would crack.', 'सबसे बड़ा झटका, फिर फ़ैसला: 2500 milli-g (2.5 g) से ऊपर अंडा टूट जाता।', 'Sabse bada jhatka, phir faisla: 2500 milli-g (2.5 g) se upar anda toot jaata.')),
        act((S) => img(S) === 'YES', T('Press B for the next drop.', 'अगली बार के लिए B दबाइए।', 'Agli baar ke liye B dabaiye.'), T('Ready. Try padding: cotton, paper, a balloon. Softer landings make smaller jolts.', 'तैयार। गद्दी आज़माइए: रुई, काग़ज़, गुब्बारा। नरम उतरने पर झटका छोटा होता है।', 'Taiyaar. Gaddi aazmaiye: rui, kaagaz, gubbaara. Naram utarne par jhatka chhota hota hai.')),
        edit((src) => /display\.scroll\(\s*biggest \/ 1000\s*\)/.test(src), [[/display\.scroll\(biggest\)/, 'display.scroll(biggest / 1000)']],
          T('Show it in g: change display.scroll(biggest) to display.scroll(biggest / 1000), then Run.', 'इसे g में दिखाइए: display.scroll(biggest) को display.scroll(biggest / 1000) कीजिए, फिर "चलाइए"।', 'Ise g mein dikhaiye: display.scroll(biggest) ko display.scroll(biggest / 1000) karo, phir Run.')),
        act((S) => !!M(S).g, T('Drop it again, then press A.', 'फिर गिराइए, फिर A दबाइए।', 'Phir giraiye, phir A dabaiye.'), T('In g: 1 g is the pull you feel standing still.', 'g में: 1 g वह खिंचाव है जो खड़े रहने पर महसूस होता है।', 'g mein: 1 g woh khinchav hai jo khade rehne par mehsoos hota hai.')),
      ],
      done: (S) => !!M(S).g },
    // 4 ------------------------------------------------------------------------------------------------------------
    { id: 'mbrocket', view: 'mb', code: ROCKET, drawer: [], serial: true,
      title: T('Rocket acceleration logger', 'रॉकेट त्वरण लॉगर', 'Rocket acceleration logger'),
      goal: T('Wait for lift-off, record 20 readings in 2 seconds, then print the flight data and show the peak.', 'उड़ान का इंतज़ार कीजिए, 2 सेकंड में 20 रीडिंग रिकॉर्ड कीजिए, फिर उड़ान का डेटा छापिए और सबसे ऊँची रीडिंग दिखाइए।', 'Udaan ka intezaar kijiye, 2 second mein 20 reading record kijiye, phir udaan ka data chhapiye aur sabse oonchi reading dikhaiye.'),
      world: desk(T('Rocket logger', 'रॉकेट लॉगर', 'Rocket logger'), ['shake', 'A'], ['acc']),
      setup: { parts: [], wires: [] },
      tick: (S) => { if (ran(S, /range\(40\)/) && (S.nums || []).length >= 40 && img(S) === 'YES') S.mem.long = true; },
      steps: [
        info([7, 8, 9, 10, 11], T('At lift-off it fills a list, flight, with 20 readings, one every 100 ms: 2 seconds of flight.', 'उड़ान शुरू होते ही यह एक सूची, flight, में 20 रीडिंग भरता है, हर 100 ms पर एक: 2 सेकंड की उड़ान।', 'Udaan shuru hote hi yeh ek list, flight, mein 20 reading bharta hai, har 100 ms par ek: 2 second ki udaan.')),
        run(),
        act((S) => (S.nums || []).length >= 20 && img(S) === 'YES', T('Launch! (press "Shake it")', 'लॉन्च! ("हिलाइए" दबाइए)', 'Launch! ("Hilaiye" dabaiye)'), T('20 numbers in the Serial Monitor: the push at each moment of the flight.', 'सीरियल मॉनिटर में 20 संख्याएँ: उड़ान के हर पल का धक्का।', 'Serial Monitor mein 20 sankhyaein: udaan ke har pal ka dhakka.')),
        act((S) => S.w('scrolled') && lastNum(S) > 1500, T('Press A for the peak.', 'सबसे ऊँची रीडिंग के लिए A दबाइए।', 'Sabse oonchi reading ke liye A dabaiye.'), T('The biggest push, right at launch. Paste the 20 numbers into a spreadsheet and draw the graph.', 'सबसे बड़ा धक्का, ठीक लॉन्च पर। 20 संख्याएँ स्प्रेडशीट में डालकर ग्राफ़ बनाइए।', 'Sabse bada dhakka, theek launch par. 20 sankhyaein spreadsheet mein daal kar graph banaiye.')),
        edit((src) => /range\(40\)/.test(src), [[/range\(20\)/, 'range(40)']],
          T('A longer flight: change range(20) to range(40) (4 seconds), then Run.', 'लंबी उड़ान: range(20) को range(40) (4 सेकंड) कीजिए, फिर "चलाइए"।', 'Lambi udaan: range(20) ko range(40) (4 second) karo, phir Run.')),
        act((S) => !!M(S).long, T('Launch again.', 'फिर लॉन्च कीजिए।', 'Phir launch kijiye.'), T('40 readings now. A real water rocket\'s micro:bit sees the push, then free fall (nearly 0 g), then the landing.', 'अब 40 रीडिंग। असली पानी-रॉकेट का micro:bit पहले धक्का, फिर मुक्त पतन (लगभग 0 g), फिर उतरना देखता है।', 'Ab 40 reading. Asli paani-rocket ka micro:bit pehle dhakka, phir mukt patan (lagbhag 0 g), phir utarna dekhta hai.')),
      ],
      done: (S) => !!M(S).long },
    // 5 ------------------------------------------------------------------------------------------------------------
    { id: 'mbflappy', view: 'mb', code: FLAPPY, drawer: [],
      title: T('Flappy bird on 5 by 5 LEDs', '5 × 5 एलईडी पर फ़्लैपी बर्ड', '5 × 5 LEDs par Flappy bird'),
      goal: T('A whole game in 25 LEDs: gravity, flapping, moving pipes, a score and game over.', '25 एलईडी में पूरा खेल: गुरुत्व, पंख फड़फड़ाना, चलते पाइप, स्कोर और गेम ओवर।', '25 LEDs mein poora game: gravity, pankh phadphadana, chalte pipe, score aur game over.'),
      world: desk(T('Flappy bird', 'फ़्लैपी बर्ड', 'Flappy bird'), ['A'], ['buttons']),
      setup: { parts: [], wires: [] },
      tick: (S) => { const m = /SCORE (\d+)/; for (const t of texts(S)) { const r = m.exec(t); if (r) { S.memRun.over = true; if (+r[1] >= 1) S.memRun.scored = true; if (ran(S, /sleep\(250\)/) && +r[1] >= 1) S.mem.slow = true; } } },
      steps: [
        info([14, 15, 17], T('tick counts the turns of the loop. Every 3rd turn the bird falls a row (gravity); every 4th the pipe moves left. % gives the remainder: tick % 3 == 0 means "tick divides by 3".', 'tick लूप के चक्कर गिनता है। हर तीसरे चक्कर पर चिड़िया एक पंक्ति गिरती है (गुरुत्व); हर चौथे पर पाइप बाएँ खिसकता है। % शेषफल देता है: tick % 3 == 0 यानी "tick 3 से पूरा बँटता है"।', 'tick loop ke chakkar ginta hai. Har teesre chakkar par chidiya ek row girti hai (gravity); har chauthe par pipe left khisakta hai. % sheshphal deta hai: tick % 3 == 0 matlab "tick 3 se poora bant-ta hai".')),
        info([23], T('gap <= bird <= gap + 1 is True when the bird is in the gap. not turns it round: hitting the pipe ends the game.', 'gap <= bird <= gap + 1 तब True है जब चिड़िया खाली जगह में है। not उसे उलट देता है: पाइप से टकराना खेल ख़त्म करता है।', 'gap <= bird <= gap + 1 tab True hai jab chidiya khaali jagah mein hai. not use ulat deta hai: pipe se takraana game khatam karta hai.')),
        run(),
        act((S) => !!R(S).scored, T('Play: press A to flap up through the gaps.', 'खेलिए: खाली जगह से निकलने के लिए A दबाकर ऊपर उड़िए।', 'Kheliye: khaali jagah se nikalne ke liye A daba kar upar udiye.'), T('Game over with a score. Not easy!', 'स्कोर के साथ गेम ओवर। आसान नहीं है!', 'Score ke saath game over. Aasaan nahi hai!')),
        edit((src) => /\n    sleep\(250\)/.test(src), [[/\n    sleep\(150\)/, '\n    sleep(250)']],
          T('An easier level: change the last sleep(150) to sleep(250): everything moves slower. Then Run.', 'आसान लेवल: आख़िरी sleep(150) को sleep(250) कीजिए: सब धीमा चलेगा। फिर "चलाइए"।', 'Aasaan level: aakhri sleep(150) ko sleep(250) karo: sab dheema chalega. Phir Run.')),
        act((S) => !!M(S).slow, T('Play again and score at least 1.', 'फिर खेलिए और कम से कम 1 स्कोर कीजिए।', 'Phir kheliye aur kam se kam 1 score kijiye.'), T('Game designers tune numbers like this until a game is hard but fair.', 'गेम डिज़ाइनर ऐसी ही संख्याएँ तब तक बदलते हैं जब तक खेल कठिन पर निष्पक्ष न हो।', 'Game designer aisi hi sankhyaein tab tak badalte hain jab tak game mushkil par nishpaksh na ho.')),
      ],
      done: (S) => !!M(S).slow },
    // 6 ------------------------------------------------------------------------------------------------------------
    { id: 'mbinfect', view: 'mbtwo', code: INFECT, drawer: [],
      title: T('Infection game by radio', 'रेडियो से संक्रमण खेल', 'Radio se infection game'),
      goal: T('See how an illness spreads from one person to the next by radio "coughs", then add a vaccine.', 'देखिए बीमारी रेडियो की "खाँसी" से एक से दूसरे में कैसे फैलती है, फिर टीका जोड़िए।', 'Dekhiye beemari radio ki "khaansi" se ek se doosre mein kaise phailti hai, phir teeka jodiye.'),
      world: world({ scene: 'rps', boards: 2, battery: true, controls: ['A', 'B', 'fAB'], hud: ['radio'], title: T('Infection game', 'संक्रमण खेल', 'Infection game') }),
      setup: { parts: [], wires: [] },
      tick: (S, dt) => { const m = S.memRun; if (ran(S, /immune/) && S.wv('friendShown') === 'SAD' && img(S) === 'YES') { m.safe = (m.safe || 0) + dt; if (m.safe > 6) S.mem.vax = true; } },
      steps: [
        info([15, 17, 18, 19], T('A sick board "coughs" by radio every half second. A healthy board that hears it catches it 1 time in 3: random.randint(1, 3) == 1.', 'बीमार बोर्ड हर आधे सेकंड रेडियो से "खाँसता" है। सुनने वाला स्वस्थ बोर्ड 3 में से 1 बार बीमार होता है: random.randint(1, 3) == 1।', 'Beemaar board har aadhe second radio se "khaansta" hai. Sunne wala swasth board 3 mein se 1 baar beemaar hota hai: random.randint(1, 3) == 1.')),
        run(T('Both boards start healthy: smiles.', 'दोनों बोर्ड स्वस्थ शुरू होते हैं: मुस्कान।', 'Dono board swasth shuru hote hain: muskaan.')),
        act((S) => img(S) === 'SAD', T('You are patient zero: press B.', 'आप पहले मरीज़ हैं: B दबाइए।', 'Aap pehle mareez ho: B dabaiye.'), T('Sad face: you are coughing by radio now.', 'उदास चेहरा: अब आप रेडियो से खाँस रहे हैं।', 'Udaas chehra: ab aap radio se khaans rahe ho.')),
        watch((S) => S.wv('friendShown') === 'SAD', T('Watch your friend.', 'दोस्त को देखिए।', 'Dost ko dekhiye.'), T('Caught it. In class, with 30 micro:bits, the whole room gets sick within a minute: that is how fast flu spreads.', 'उसे लग गई। कक्षा में 30 micro:bit हों तो एक मिनट में पूरा कमरा बीमार: फ़्लू इतनी तेज़ी से फैलता है।', 'Use lag gayi. Class mein 30 micro:bits hon to ek minute mein poora kamra beemaar: flu itni tezi se phailta hai.')),
        edit((src) => /immune = True/.test(src) && /not sick and not immune/.test(src), [[/sick = False\n/, 'sick = False\nimmune = False\n'], [/(    msg = radio\.receive\(\))/, '    if button_a.was_pressed() and not sick:\n        immune = True                    # vaccinated\n        display.show(Image.YES)\n$1'], [/not sick and random/, 'not sick and not immune and random']],
          T('A vaccine: under sick = False add immune = False; above msg = radio.receive() add\n    if button_a.was_pressed() and not sick:\n        immune = True\n        display.show(Image.YES)\nand change "not sick and random" to "not sick and not immune and random". Then Run.', 'टीका: sick = False के नीचे immune = False लिखिए; msg = radio.receive() के ऊपर लिखिए\n    if button_a.was_pressed() and not sick:\n        immune = True\n        display.show(Image.YES)\nऔर "not sick and random" को "not sick and not immune and random" कीजिए। फिर "चलाइए"।', 'Teeka: sick = False ke neeche immune = False likhiye; msg = radio.receive() ke upar likhiye\n    if button_a.was_pressed() and not sick:\n        immune = True\n        display.show(Image.YES)\naur "not sick and random" ko "not sick and not immune and random" karo. Phir Run.')),
        act((S) => !!M(S).vax, T('Get vaccinated: press A. Then your friend is patient zero: "Friend presses B". Wait and watch.', 'टीका लगवाइए: A दबाइए। फिर आपका दोस्त पहला मरीज़ है: "दोस्त B दबाए"। रुकिए और देखिए।', 'Teeka lagwaiye: A dabaiye. Phir aapka dost pehla mareez hai: "Dost B dabaye". Rukiye aur dekhiye.'), T('Your friend coughs and coughs, and you stay well: a vaccine stops the chain.', 'दोस्त खाँसता रहता है, और आप ठीक रहते हैं: टीका कड़ी तोड़ देता है।', 'Dost khaansta rehta hai, aur aap theek rehte ho: teeka kadi tod deta hai.')),
      ],
      done: (S) => !!M(S).vax },
    // 7 ------------------------------------------------------------------------------------------------------------
    { id: 'mbbinary', view: 'mb', code: BINARY, drawer: [],
      title: T('Binary stopwatch', 'बाइनरी स्टॉपवॉच', 'Binary stopwatch'),
      goal: T('Count the seconds in binary on five LEDs, the way computers store every number.', 'पाँच एलईडी पर बाइनरी में सेकंड गिनिए, जैसे कंप्यूटर हर संख्या रखते हैं।', 'Paanch LEDs par binary mein second giniye, jaise computer har sankhya rakhte hain.'),
      world: desk(T('Binary stopwatch', 'बाइनरी स्टॉपवॉच', 'Binary stopwatch'), ['A'], []),
      setup: { parts: [], wires: [] },
      tick: (S) => { const p = px(S); const v = [0, 1, 2, 3, 4].reduce((a, x) => a * 2 + (p[20 + x] ? 1 : 0), 0); const m = S.memRun; (m.vals || (m.vals = new Set())).add(v); if (v === 31) m.top = true; if (ran(S, /% 64/) && m.top && v === 0) S.mem.overflow = true; },
      steps: [
        info([7, 8, 9], T('secs >> (4 - x) shifts the number right; & 1 keeps its last bit, 1 or 0. So each LED shows one bit: 16, 8, 4, 2 or 1.', 'secs >> (4 - x) संख्या को दाईं ओर खिसकाता है; & 1 उसका आख़िरी बिट रखता है, 1 या 0। तो हर एलईडी एक बिट दिखाती है: 16, 8, 4, 2 या 1।', 'secs >> (4 - x) sankhya ko right khisakata hai; & 1 uska aakhri bit rakhta hai, 1 ya 0. To har LED ek bit dikhati hai: 16, 8, 4, 2 ya 1.')),
        run(),
        watch((S) => (R(S).vals || new Set()).has(5), T('Watch the bottom row count. Wait for 5: lit, off, lit (4 + 1).', 'नीचे की पंक्ति गिनती देखिए। 5 का इंतज़ार कीजिए: जली, बुझी, जली (4 + 1)।', 'Neeche ki row ginti dekhiye. 5 ka intezaar kijiye: jali, bujhi, jali (4 + 1).'), T('101 in binary is 5. Every number, letter and photo in a phone is stored as bits like these.', 'बाइनरी में 101 यानी 5। फ़ोन में हर संख्या, अक्षर और फ़ोटो ऐसे ही बिट में रखी जाती है।', 'Binary mein 101 matlab 5. Phone mein har sankhya, akshar aur photo aise hi bit mein rakhi jaati hai.')),
        act((S) => S.w('scrolled') && lastNum(S) !== null, T('Press A to check: it scrolls the number in ordinary digits.', 'जाँचने के लिए A दबाइए: यह संख्या सामान्य अंकों में दिखाता है।', 'Check karne ke liye A dabaiye: yeh sankhya normal ankon mein dikhata hai.')),
        edit((src) => /% 64/.test(src) && !/% 32/.test(src), [[/% 32/, '% 64']],
          T('Count higher: change % 32 to % 64. Five LEDs can only show up to 31, so watch what happens after 31. Then Run.', 'आगे गिनिए: % 32 को % 64 कीजिए। पाँच एलईडी सिर्फ़ 31 तक दिखा सकती हैं, तो देखिए 31 के बाद क्या होता है। फिर "चलाइए"।', 'Aage giniye: % 32 ko % 64 karo. Paanch LEDs sirf 31 tak dikha sakti hain, to dekhiye 31 ke baad kya hota hai. Phir Run.')),
        watch((S) => !!M(S).overflow, T('Watch it count past 31 (about half a minute).', '31 के आगे गिनते देखिए (लगभग आधा मिनट)।', '31 ke aage ginte dekhiye (lagbhag aadha minute).'), T('At 32 all five go dark: the 32 needs a sixth LED. That is "overflow": old games and clocks went wrong this way.', '32 पर पाँचों बुझ जाती हैं: 32 को छठी एलईडी चाहिए। इसे "ओवरफ़्लो" कहते हैं: पुराने गेम और घड़ियाँ ऐसे ही गड़बड़ाती थीं।', '32 par paanchon bujh jaati hain: 32 ko chhathi LED chahiye. Ise "overflow" kehte hain: purane game aur ghadiyan aise hi gadbadati thin.')),
      ],
      done: (S) => !!M(S).overflow },
    // 8 ------------------------------------------------------------------------------------------------------------
    { id: 'mblock', view: 'mb', code: LOCK, drawer: [],
      title: T('Combination lock with buttons', 'बटनों वाला कॉम्बिनेशन लॉक', 'Buttons wala combination lock'),
      goal: T('A secret code of A and B presses opens the lock; three wrong tries lock it for 10 seconds, as real locks do.', 'A और B दबाने का गुप्त कोड ताला खोलता है; तीन ग़लत कोशिशें इसे 10 सेकंड बंद कर देती हैं, जैसे असली ताले करते हैं।', 'A aur B dabane ka gupt code taala kholta hai; teen galat koshishein ise 10 second band kar deti hain, jaise asli taale karte hain.'),
      world: desk(T('Combination lock', 'कॉम्बिनेशन लॉक', 'Combination lock'), ['A', 'B', 'logo'], ['buttons']),
      setup: { parts: [], wires: [] },
      tick: (S) => { if (ran(S, /SECRET = "BBAB"/) && img(S) === 'YES') S.mem.code = true; },
      steps: [
        info([5, 6, 11, 14, 17], T('entered collects the presses as letters: A, then AB, then ABA… When you touch the logo it is compared with SECRET.', 'entered दबाने को अक्षरों में जोड़ता है: A, फिर AB, फिर ABA… लोगो छूने पर इसे SECRET से मिलाया जाता है।', 'entered dabane ko akshar mein jodta hai: A, phir AB, phir ABA… Logo chhoone par ise SECRET se milaya jaata hai.')),
        run(),
        act((S) => S.w('img:YES'), T('Enter the code: A, B, A, A, then touch the logo.', 'कोड डालिए: A, B, A, A, फिर लोगो छूइए।', 'Code daaliye: A, B, A, A, phir logo chhuiye.'), T('A tick: open!', 'टिक: खुल गया!', 'Tick: khul gaya!')),
        act((S) => has(S, /^LOCKED$/), T('Now be a thief: try three wrong codes (for example B, logo; A, logo; B, B, logo).', 'अब चोर बनिए: तीन ग़लत कोड आज़माइए (जैसे B, लोगो; A, लोगो; B, B, लोगो)।', 'Ab chor baniye: teen galat code aazmaiye (jaise B, logo; A, logo; B, B, logo).'), T('LOCKED for 10 seconds. That makes guessing very slow: phones and ATMs do the same.', '10 सेकंड के लिए बंद। इससे अंदाज़ा लगाना बहुत धीमा हो जाता है: फ़ोन और एटीएम भी यही करते हैं।', '10 second ke liye band. Isse andaaza lagana bahut dheema ho jaata hai: phone aur ATM bhi yahi karte hain.')),
        edit((src) => /SECRET = "BBAB"/.test(src), [[/SECRET = "ABAA"/, 'SECRET = "BBAB"']],
          T('Change the code: SECRET = "BBAB", then Run.', 'कोड बदलिए: SECRET = "BBAB", फिर "चलाइए"।', 'Code badliye: SECRET = "BBAB", phir Run.')),
        act((S) => !!M(S).code, T('Open it with the new code: B, B, A, B, logo.', 'नए कोड से खोलिए: B, B, A, B, लोगो।', 'Naye code se kholiye: B, B, A, B, logo.'), T('With 4 presses of 2 buttons there are 2 × 2 × 2 × 2 = 16 codes. A 6-press code has 64.', '2 बटन के 4 दबाव से 2 × 2 × 2 × 2 = 16 कोड बनते हैं। 6 दबाव वाले कोड 64।', '2 button ke 4 dabaav se 2 × 2 × 2 × 2 = 16 code bante hain. 6 dabaav wale code 64.')),
      ],
      done: (S) => !!M(S).code },
    // 9 ------------------------------------------------------------------------------------------------------------
    { id: 'mbrail', view: 'mbwide', code: RAIL, drawer: [],
      title: T('Railway crossing with a servo', 'सर्वो वाला रेलवे फाटक', 'Servo wala railway phatak'),
      goal: T('A level crossing: a train on the track sensor brings the barrier down with flashing lights and a bell; it rises 3 seconds after the train.', 'रेलवे फाटक: पटरी के सेंसर पर ट्रेन आते ही बत्तियों और घंटी के साथ बैरियर नीचे; ट्रेन के 3 सेकंड बाद ऊपर।', 'Railway phatak: patri ke sensor par train aate hi battiyon aur ghanti ke saath barrier neeche; train ke 3 second baad upar.'),
      world: world({ scene: 'gate', parts: [{ tag: 'sv1', type: 'servo' }], controls: ['P1'], hud: ['servo'], title: T('Railway crossing', 'रेलवे फाटक', 'Railway phatak') }),
      setup: { parts: [], wires: [] },
      tick: (S) => { const a = S.app.world.parts.sv1 ? S.app.world.parts.sv1.state.angle : 90; const m = S.memRun; if (a <= 5) { m.down = true; m.downAt = m.downAt || S.t; } if (m.down && a >= 85) { m.up = true; if (ran(S, /< 5000/) && m.downAt && S.t - m.downAt > 4.5) S.mem.longer = true; } },
      steps: [
        { k: 'act', clip: ['P0', 'sv1.SIG'], until: (S) => S.w('conn:P0~sv1.SIG'), do: T('Clip pin 0 to the servo\'s orange (signal) wire.', 'पिन 0 को सर्वो के नारंगी (सिग्नल) तार से क्लिप कीजिए।', 'Pin 0 ko servo ke orange (signal) taar se clip kijiye.'), see: E },
        { k: 'act', clip: ['3V', 'sv1.VP'], until: (S) => S.w('conn:3V~sv1.VP'), do: T('Clip 3V to the red (+) wire.', '3V को लाल (+) तार से क्लिप कीजिए।', '3V ko red (+) taar se clip kijiye.'), see: E },
        { k: 'act', clip: ['GND', 'sv1.GND'], until: (S) => S.w('conn:GND~sv1.GND'), do: T('Clip GND to the brown (−) wire.', 'GND को भूरे (−) तार से क्लिप कीजिए।', 'GND ko brown (−) taar se clip kijiye.'), see: E },
        { k: 'check', do: T('Press "Check my circuit".', '"मेरा सर्किट जाँचिए" दबाइए।', '"Mera circuit check karo" dabaiye.'), see: E },
        info([11, 14, 15], T('last_train remembers when the train was last on the sensor. While that was less than 3000 ms ago, the barrier stays down.', 'last_train याद रखता है कि ट्रेन आख़िरी बार सेंसर पर कब थी। जब तक वह 3000 ms से कम पहले था, बैरियर नीचे रहता है।', 'last_train yaad rakhta hai ki train aakhri baar sensor par kab thi. Jab tak woh 3000 ms se kam pehle tha, barrier neeche rehta hai.')),
        run(),
        act((S) => !!R(S).up, T('A train passes: press "Touch pin 1" (the track sensor), then wait.', 'ट्रेन गुज़रती है: "पिन 1 छूइए" (पटरी का सेंसर) दबाइए, फिर रुकिए।', 'Train guzarti hai: "Pin 1 touch karo" (patri ka sensor) dabaiye, phir rukiye.'), T('Down with lights and a bell, then up again when the track is clear.', 'बत्तियों और घंटी के साथ नीचे, फिर पटरी ख़ाली होने पर ऊपर।', 'Battiyon aur ghanti ke saath neeche, phir patri khaali hone par upar.')),
        edit((src) => /< 5000/.test(src), [[/< 3000/, '< 5000']],
          T('Safer for a long goods train: change < 3000 to < 5000, then Run.', 'लंबी मालगाड़ी के लिए ज़्यादा सुरक्षित: < 3000 को < 5000 कीजिए, फिर "चलाइए"।', 'Lambi maalgaadi ke liye zyada surakshit: < 3000 ko < 5000 karo, phir Run.')),
        act((S) => !!M(S).longer, T('Another train: touch pin 1 and wait.', 'एक और ट्रेन: पिन 1 छूइए और रुकिए।', 'Ek aur train: pin 1 chhuiye aur rukiye.'), T('Down for 5 seconds now. Real crossings use sensors on the rails a long way before the road.', 'अब 5 सेकंड नीचे। असली फाटक सड़क से काफ़ी पहले पटरी पर लगे सेंसर इस्तेमाल करते हैं।', 'Ab 5 second neeche. Asli phatak sadak se kaafi pehle patri par lage sensor istemaal karte hain.')),
      ],
      check: [(S) => (S.w('conn:3V~GND') ? [X.short] : null), (S) => (S.w('conn:P0~sv1.SIG') ? null : [X.clip, { a: 'pin 0', b: T('the orange (signal) wire', 'नारंगी (सिग्नल) तार', 'orange (signal) taar') }]), (S) => (S.w('conn:3V~sv1.VP') && S.w('conn:GND~sv1.GND') ? null : [X.servoPow])],
      done: (S) => !!M(S).longer },
    // 10 -----------------------------------------------------------------------------------------------------------
    { id: 'mblearn', view: 'mb', code: LEARN, drawer: [],
      title: T('Gesture recognition with machine learning', 'मशीन लर्निंग से हरकत पहचानना', 'Machine learning se gesture pehchaanna'),
      goal: T('Train the micro:bit with examples instead of rules: it learns what "wave" and "rest" feel like and then recognises them.', 'नियमों की जगह उदाहरणों से micro:bit को सिखाइए: यह सीखता है कि "wave" और "rest" कैसे लगते हैं और फिर उन्हें पहचानता है।', 'Niyamon ki jagah udaharanon se micro:bit ko sikhaiye: yeh seekhta hai ki "wave" aur "rest" kaise lagte hain aur phir unhe pehchaanta hai.'),
      world: world({ scene: 'desk', controls: ['tilt', 'A', 'B', 'phone'], hud: ['acc'], title: T('Machine learning', 'मशीन लर्निंग', 'Machine learning') }),
      setup: { parts: [], wires: [] },
      tick: (S) => { const t = texts(S).slice(-1)[0]; const x = (S.app.world.boards[0].accel(S.app.world.now) || [0])[0]; const m = S.memRun;
        if (t === 'W' && x > 500) m.w = true; if (t === 'R' && Math.abs(x) < 200) m.r = true; if (ran(S, />= 5 and len\(rest\) >= 5/) && m.w && m.r) S.mem.five = true; },
      steps: [
        info([9, 10, 11, 14, 15], T('No rules about angles here. Each press of A or B saves one example (the reading x) in a list: this is the training data.', 'यहाँ कोणों के कोई नियम नहीं। A या B का हर दबाना एक उदाहरण (रीडिंग x) सूची में रखता है: यही ट्रेनिंग डेटा है।', 'Yahan angles ke koi niyam nahi. A ya B ka har dabana ek udaharan (reading x) list mein rakhta hai: yahi training data hai.')),
        info([18, 19, 20, 21], T('The model is just two averages. To guess, it measures how far the reading now is from each average and picks the nearer one.', 'मॉडल बस दो औसत है। अंदाज़ा लगाने के लिए यह नापता है कि अभी की रीडिंग हर औसत से कितनी दूर है, और पास वाला चुनता है।', 'Model bas do average hai. Andaaza lagane ke liye yeh naapta hai ki abhi ki reading har average se kitni door hai, aur paas wala chunta hai.')),
        run(),
        act((S) => (S.wv('nums') || []).includes(3), T('Train "wave": hold it tilted right ("Hold it": right) and press A three times.', '"wave" सिखाइए: इसे दाईं ओर झुकाकर पकड़िए ("ऐसे पकड़िए": दाएँ) और A तीन बार दबाइए।', '"wave" sikhaiye: ise right jhuka kar pakdiye ("Aise pakdiye": right) aur A teen baar dabaiye.'), T('Three examples of wave.', 'wave के तीन उदाहरण।', 'wave ke teen udaharan.')),
        act((S) => has(S, /^[WR]$/), T('Train "rest": hold it flat and press B three times.', '"rest" सिखाइए: इसे सीधा पकड़िए और B तीन बार दबाइए।', '"rest" sikhaiye: ise seedha pakdiye aur B teen baar dabaiye.'), T('Trained! Now it guesses all the time: R.', 'सीख गया! अब यह लगातार अंदाज़ा लगाता है: R।', 'Seekh gaya! Ab yeh lagaataar andaaza lagata hai: R.')),
        act((S) => !!R(S).w && !!R(S).r, T('Test it: tilt it right, then flat again.', 'जाँचिए: दाईं ओर झुकाइए, फिर सीधा।', 'Check kijiye: right jhukaiye, phir seedha.'), T('W, then R: it recognises gestures it was shown. Phones learn your face and voice from examples like this, only with millions of numbers.', 'W, फिर R: यह दिखाई गई हरकतें पहचानता है। फ़ोन आपका चेहरा और आवाज़ ऐसे ही उदाहरणों से सीखते हैं, बस लाखों संख्याओं के साथ।', 'W, phir R: yeh dikhayi gayi harkatein pehchaanta hai. Phone aapka chehra aur awaaz aise hi udaharanon se seekhte hain, bas laakhon sankhyaon ke saath.')),
        edit((src) => />= 5 and len\(rest\) >= 5/.test(src), [[/len\(wave\) >= 3 and len\(rest\) >= 3/, 'len(wave) >= 5 and len(rest) >= 5']],
          T('More data, a steadier model: change both 3s in len(wave) >= 3 and len(rest) >= 3 to 5, then Run.', 'ज़्यादा डेटा, ज़्यादा भरोसेमंद मॉडल: len(wave) >= 3 and len(rest) >= 3 के दोनों 3 को 5 कीजिए, फिर "चलाइए"।', 'Zyada data, zyada bharosemand model: len(wave) >= 3 and len(rest) >= 3 ke dono 3 ko 5 karo, phir Run.')),
        act((S) => !!M(S).five, T('Train again with 5 examples each (A five times tilted right, B five times flat), then test it.', 'फिर से सिखाइए, हर एक के 5 उदाहरण (दाईं ओर झुकाकर A पाँच बार, सीधा B पाँच बार), फिर जाँचिए।', 'Phir se sikhaiye, har ek ke 5 udaharan (right jhuka kar A paanch baar, seedha B paanch baar), phir check kijiye.'), T('The memory starts empty after Run: a new model, trained from scratch. Real AI teams spend most of their time collecting good examples.', 'Run के बाद याद ख़ाली होती है: नया मॉडल, शुरू से सिखाया हुआ। असली AI टीमें ज़्यादातर समय अच्छे उदाहरण इकट्ठा करने में लगाती हैं।', 'Run ke baad yaad khaali hoti hai: naya model, shuru se sikhaya hua. Asli AI teams zyaadatar samay achhe udaharan ikattha karne mein lagaati hain.')),
      ],
      done: (S) => !!M(S).five },
  ];
  L.forEach((l, i) => { l.n = n0 + i + 1; l.lang = 'py'; l.batch = 11; l.cls = '5'; });
  return L;
}
