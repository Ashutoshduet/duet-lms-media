// DUET Robotics Lab 360, batch 15: Class 10 projects on the Raspberry Pi 4 in Python (gpiozero), written fresh for DUET.
// Same shape as lessons6.js (pi6.js runs the Python on the bench's real circuit); most of each circuit is already on the
// breadboard, the student adds the new part, runs, does what the step says and makes one edit:
//   pi_traffic   traffic lights: three LEDs and sleep() as the timer (UK / India order: red, red + amber, green, amber)
//   pi_reaction  reaction game: an LED after a random wait, a button, time() and the best of three
//   pi_distance  DistanceSensor (an HC-SR04 with its Echo through a 1 kΩ / 2.2 kΩ divider) and a too-close buzzer
//   pi_quiz      quiz buzzer for three teams: the first button wins, its light, a beep, the others locked out
//   pi_morse     Morse code: type a message in the terminal, the LED and the buzzer send it (a dictionary)
// devtools/test/robocore15.mjs plays every one.
const t3 = (en, hi, hg) => ({ en, hi, hg });
const rail = (r, col) => { for (let i = 0; i < 50; i++) if (3 + i + Math.floor(i / 5) === col) return 'H:' + r + (i + 1); throw new Error('no rail hole at column ' + col); };

const TRAFFIC = `# Traffic lights: red, amber and green LEDs on GPIO 22, 27 and 17
from gpiozero import LED
from time import sleep

red = LED(22)
amber = LED(27)
green = LED(17)

while True:
    red.on()
    sleep(3)          # stop
    amber.on()
    sleep(1)          # red and amber together: get ready
    red.off()
    amber.off()
    green.on()
    sleep(3)          # go
    green.off()
    amber.on()
    sleep(1)          # amber alone: stop if you safely can
    amber.off()
`;
const REACTION = `# Reaction game: when the LED lights, press the button as fast as you can
from gpiozero import LED, Button
from time import sleep, time
from random import uniform

led = LED(17)
button = Button(27)
best = 99

for game in range(3):
    print("Get ready...")
    sleep(uniform(2, 5))        # a wait you cannot guess
    led.on()
    start = time()
    button.wait_for_press()
    t = time() - start
    led.off()
    print("Your time:", round(t, 3), "s")
    if t < best:
        best = t
    sleep(1)
print("Best:", round(best, 3), "s")
`;
const DISTANCE = `# Distance with an HC-SR04 and gpiozero: Trig on GPIO 23, Echo on GPIO 24 (through a divider)
from gpiozero import DistanceSensor, Buzzer
from time import sleep

sensor = DistanceSensor(echo=24, trigger=23, max_distance=2)
buzzer = Buzzer(18)

while True:
    cm = sensor.distance * 100      # .distance is in metres
    print(round(cm, 1), "cm")
    sleep(0.2)
`;
const QUIZ = `# Quiz buzzer for three teams: the first button pressed wins and its LED lights
from gpiozero import LED, Button, Buzzer
from time import sleep

buttons = [Button(5), Button(6), Button(13)]
lights = [LED(17), LED(27), LED(22)]
buzzer = Buzzer(18)
lock = 5                         # seconds the other teams are locked out

print("Quiz ready!")
while True:
    for team in range(3):
        if buttons[team].is_pressed:
            lights[team].on()
            buzzer.beep(on_time=0.1, off_time=0.1, n=2)
            print("Team", team + 1, "first!")
            sleep(lock)
            lights[team].off()
            print("Quiz ready!")
    sleep(0.01)
`;
const MORSE = `# Morse code: type a message, and the LED and the buzzer send it
from gpiozero import LED, Buzzer
from time import sleep

CODE = {"A": ".-", "B": "-...", "C": "-.-.", "D": "-..", "E": ".", "F": "..-.", "G": "--.", "H": "....",
        "I": "..", "J": ".---", "K": "-.-", "L": ".-..", "M": "--", "N": "-.", "O": "---", "P": ".--.",
        "Q": "--.-", "R": ".-.", "S": "...", "T": "-", "U": "..-", "V": "...-", "W": ".--", "X": "-..-",
        "Y": "-.--", "Z": "--..", "0": "-----", "1": ".----", "2": "..---", "3": "...--", "4": "....-",
        "5": ".....", "6": "-....", "7": "--...", "8": "---..", "9": "----."}
led = LED(17)
buzzer = Buzzer(18)
unit = 0.2                       # one dot, in seconds; a dash is three

def signal(t):
    led.on()
    buzzer.on()
    sleep(t)
    led.off()
    buzzer.off()
    sleep(unit)                  # the gap inside a letter

while True:
    text = input("Message: ").upper()
    for ch in text:
        if ch == " ":
            sleep(unit * 4)      # between words: 7 units in all
        elif ch in CODE:
            print(ch, CODE[ch])
            for s in CODE[ch]:
                if s == ".":
                    signal(unit)
                else:
                    signal(unit * 3)
            sleep(unit * 2)      # between letters: 3 units in all
    print("Sent.")
`;
export const BATCH15_CODE = { TRAFFIC, REACTION, DISTANCE, QUIZ, MORSE };

export function batch15(K, n0) {
  const { P, F } = K; void F;
  const E = t3('', '', '');
  const run = (see) => ({ k: 'run', do: t3('Press Run.', '"चलाइए" दबाइए।', 'Run dabaiye.'), see: see || E });
  const check = { k: 'check', do: t3('Press "Check my circuit".', '"मेरा सर्किट जाँचिए" दबाइए।', '"Mera circuit check karo" dabaiye.'), see: E };
  const X = {
    missing: t3('The {x} is not on the breadboard yet.', '{x} अभी ब्रेडबोर्ड पर नहीं है।', '{x} abhi breadboard par nahi hai.'),
    toPin: t3('The {x} must be joined to {p}.', '{x} को {p} से जोड़िए।', '{x} ko {p} se jodiye.'),
    ledPath: t3('The {x} LED needs its path: GPIO {p} → the long leg → the short leg → its resistor → the − rail.', '{x} एलईडी का रास्ता: GPIO {p} → लंबा पैर → छोटा पैर → उसका रेज़िस्टर → − रेल।', '{x} LED ka raasta: GPIO {p} → lamba pair → chhota pair → uska resistor → − rail.'),
    btn: t3('The {x} button: one leg to GPIO {p}, the leg across the button to the − rail (GND).', '{x} बटन: एक पैर GPIO {p} से, बटन के उस पार वाला पैर − रेल (GND) से।', '{x} button: ek pair GPIO {p} se, button ke us paar wala pair − rail (GND) se.'),
    short: t3('3.3 V or 5 V is joined straight to GND: a short circuit! Remove that wire.', '3.3 V या 5 V सीधे GND से जुड़ा है: शॉर्ट सर्किट! वह वायर हटाइए।', '3.3 V ya 5 V seedhe GND se juda hai: short circuit! Woh wire hataiye.'),
    fiveIn: t3('{p} is joined to 5 V! A Raspberry Pi pin takes at most 3.3 V. Take that wire off.', '{p} 5 V से जुड़ गया है! Raspberry Pi का पिन ज़्यादा से ज़्यादा 3.3 V सहता है। वह वायर हटाइए।', '{p} 5 V se jud gaya hai! Raspberry Pi ka pin zyada se zyada 3.3 V sehta hai. Woh wire hataiye.'),
    echoDirect: t3('Echo goes straight to GPIO 24: the HC-SR04 answers with 5 V, too much for the Pi. Put the divider in: 1 kΩ from Echo, 2.2 kΩ to GND, GPIO 24 from the middle.', 'Echo सीधे GPIO 24 पर है: HC-SR04 5 V से जवाब देता है, Pi के लिए बहुत ज़्यादा। डिवाइडर लगाइए: Echo से 1 kΩ, GND तक 2.2 kΩ, बीच से GPIO 24।', 'Echo seedhe GPIO 24 par hai: HC-SR04 5 V se jawab deta hai, Pi ke liye bahut zyada. Divider lagaiye: Echo se 1 kΩ, GND tak 2.2 kΩ, beech se GPIO 24.'),
    divider: t3('The divider is not right yet: Echo → 1 kΩ → the middle → 2.2 kΩ → GND, and the middle to GPIO 24.', 'डिवाइडर अभी ठीक नहीं: Echo → 1 kΩ → बीच → 2.2 kΩ → GND, और बीच से GPIO 24।', 'Divider abhi theek nahi: Echo → 1 kΩ → beech → 2.2 kΩ → GND, aur beech se GPIO 24.'),
  };
  const noShort = (S) => (S.conn('3V3', 'GND') || S.conn('5V', 'GND') ? [X.short] : null);
  const no5 = (pin) => (S) => (S.conn(pin, '5V') ? [X.fiveIn, { p: pin }] : null);
  const COL = { red: t3('red', 'लाल', 'laal'), amber: t3('amber', 'पीली', 'peeli'), green: t3('green', 'हरी', 'hari') };
  // an LED (long leg in the column after `col`) and its 330 Ω resistor from row j into the front − rail
  const ledAt = (tag, rtag, color, col) => [P(tag, 'led', { color }, 'f' + col, 0), P(rtag, 'resistor', { ohms: 330 }, 'j' + col, 1)];
  const ledChk = (tag, rtag, gp, nm) => (S) => (S.has(tag) && S.has(rtag) && S.chain('GPIO' + gp, [[tag, 'A', 'K'], [rtag]], 'GND') ? null : [X.ledPath, { x: nm, p: gp }]);
  const btnChk = (tag, gp, nm) => (S) => (S.has(tag) && (S.conn(tag + '.L2', 'GPIO' + gp) || S.conn(tag + '.L1', 'GPIO' + gp)) && (S.conn(tag + '.L4', 'GND') || S.conn(tag + '.L3', 'GND')) ? null : [X.btn, { x: nm, p: gp }]);
  const GNDW = [['B:GND6', rail('bn', 19)]];
  const lit = (S, t) => S.ledLit(t);
  const lines = (S, re) => (S.serLines || []).map((l) => re.exec(String(l).trim())).filter(Boolean);
  const team = t3('team', 'टीम', 'team');
  let n = n0;
  const L = [
    // 1 ---------------------------------------------------------------------------------------------- traffic lights
    { id: 'pi_traffic', board: 'pi4', cls: '10', view: 'pi6', wview: 'pi6w', code: TRAFFIC, drawer: ['led', 'resistor'],
      title: t3('Traffic lights in Python', 'Python में ट्रैफ़िक लाइट', 'Python mein traffic light'),
      goal: t3('Three LEDs and a loop of sleep() make a real junction\'s light sequence: red, red with amber, green, amber, and red again. Change the times as a traffic engineer would.', 'तीन एलईडी और sleep() का एक लूप असली चौराहे की लाइटों का क्रम बनाते हैं: लाल, लाल के साथ पीली, हरी, पीली, और फिर लाल। ट्रैफ़िक इंजीनियर की तरह समय बदलिए।', 'Teen LED aur sleep() ka ek loop asli chauraahe ki lights ka kram banate hain: laal, laal ke saath peeli, hari, peeli, aur phir laal. Traffic engineer ki tarah time badaliye.'),
      setup: { parts: [...ledAt('led1', 'r1', 'red', 21), ...ledAt('led2', 'r2', 'yellow', 25)], wires: [...GNDW, ['B:GPIO22', 'H:i22'], ['B:GPIO27', 'H:i26']] },
      steps: [
        { k: 'info', do: t3('The red LED (GPIO 22) and the amber LED (GPIO 27) are wired, each with a 330 Ω resistor into the − rail, which goes to a GND pin. The green one is your job.', 'लाल एलईडी (GPIO 22) और पीली एलईडी (GPIO 27) जुड़ी हैं, हर एक 330 Ω रेज़िस्टर से − रेल में, जो एक GND पिन तक जाती है। हरी एलईडी आपका काम है।', 'Laal LED (GPIO 22) aur peeli LED (GPIO 27) judi hain, har ek 330 Ω resistor se − rail mein, jo ek GND pin tak jaati hai. Hari LED aapka kaam hai.'), see: E },
        { k: 'place', place: P('led3', 'led', { color: 'green' }, 'f29', 0), do: t3('Put the green LED in 29f–30f, its long leg in column 30.', 'हरी एलईडी 29f–30f में लगाइए, लंबा पैर कॉलम 30 में।', 'Hari LED 29f–30f mein lagaiye, lamba pair column 30 mein.'), see: E },
        { k: 'place', place: P('r3', 'resistor', { ohms: 330 }, 'j29', 1), do: t3('Put a 330 Ω resistor from 29j into the − rail.', '330 Ω रेज़िस्टर 29j से − रेल में लगाइए।', '330 Ω resistor 29j se − rail mein lagaiye.'), see: E },
        { k: 'wire', wire: ['led3.A', 'GPIO17'], do: t3('Wire GPIO 17 (physical pin 11) to the green LED\'s long leg.', 'GPIO 17 (फ़िज़िकल पिन 11) से हरी एलईडी के लंबे पैर तक वायर।', 'GPIO 17 (physical pin 11) se hari LED ke lambe pair tak wire.'), see: E },
        check,
        run(t3('Red for 3 s, red and amber for 1 s, green for 3 s, amber for 1 s, and again.', 'लाल 3 s, लाल और पीली 1 s, हरी 3 s, पीली 1 s, और फिर से।', 'Laal 3 s, laal aur peeli 1 s, hari 3 s, peeli 1 s, aur phir se.')),
        { k: 'watch', until: (S) => S.memRun.cycle >= 1, do: t3('Watch one whole cycle of the lights.', 'लाइटों का एक पूरा चक्कर देखिए।', 'Lights ka ek poora chakkar dekhiye.'),
          see: t3('A program that never ends: while True repeats the sequence for ever, and each sleep() is the time a light stays on.', 'कभी न ख़त्म होने वाला प्रोग्राम: while True क्रम को हमेशा दोहराता है, और हर sleep() वह समय है जितनी देर लाइट जलती है।', 'Kabhi na khatm hone wala program: while True kram ko hamesha dohraata hai, aur har sleep() woh time hai jitni der light jalti hai.') },
        { k: 'edit', test: (src) => { const m = /green\.on\(\)\s*\n\s*sleep\((\d+(?:\.\d+)?)\)/.exec(src); return !!m && +m[1] >= 5 && +m[1] <= 10; }, set: [[/green\.on\(\)\n    sleep\(3\)/, 'green.on()\n    sleep(6)']],
          do: t3('The main road is busy: give it a longer green. Change the sleep(3) after green.on() to sleep(6) and press Run.', 'मुख्य सड़क पर भीड़ है: उसे ज़्यादा देर हरी दीजिए। green.on() के बाद वाले sleep(3) को sleep(6) कीजिए और "चलाइए" दबाइए।', 'Main road par bheed hai: use zyada der hari dijiye. green.on() ke baad wale sleep(3) ko sleep(6) karo aur Run dabaiye.'), see: E },
        { k: 'watch', until: (S) => (S.memRun.gMax || 0) >= 5.5, do: t3('Time the green light.', 'हरी लाइट का समय देखिए।', 'Hari light ka time dekhiye.'),
          see: t3('Six seconds of green. Real junctions do this by the clock of the day: longer greens for the main road at rush hour, and some count the cars waiting with sensors.', 'छह सेकंड हरी। असली चौराहे दिन के समय के हिसाब से ऐसा करते हैं: भीड़ के समय मुख्य सड़क को ज़्यादा हरी, और कुछ सेंसर से इंतज़ार करती गाड़ियाँ गिनते हैं।', 'Chhe second hari. Asli chauraahe din ke time ke hisaab se aisa karte hain: bheed ke time main road ko zyada hari, aur kuch sensor se intezaar karti gaadiyaan ginte hain.') },
      ],
      check: [noShort, ledChk('led1', 'r1', 22, COL.red), ledChk('led2', 'r2', 27, COL.amber), ledChk('led3', 'r3', 17, COL.green)],
      tick: (S, dt) => { const R = S.memRun; const g = lit(S, 'led3'), r = lit(S, 'led1'), a = lit(S, 'led2');
        if (g) { R.gOn = (R.gOn || 0) + dt; R.gMax = Math.max(R.gMax || 0, R.gOn); } else R.gOn = 0;
        const st = (r ? 'R' : '') + (a ? 'A' : '') + (g ? 'G' : ''); if (st !== R.st) { R.seq = ((R.seq || '') + ' ' + st).slice(-40); R.st = st; if (/R RA G A R$/.test(R.seq)) R.cycle = (R.cycle || 0) + 1; } },
      done: (S) => (S.memRun.gMax || 0) >= 5.5 },
    // 2 ---------------------------------------------------------------------------------------------- reaction game
    { id: 'pi_reaction', board: 'pi4', cls: '10', view: 'pi6', wview: 'pi6w', code: REACTION, drawer: ['button'], serial: true,
      title: t3('Reaction game in Python', 'Python में रिएक्शन गेम', 'Python mein reaction game'),
      goal: t3('An LED lights after a wait you cannot guess; press the button as fast as you can. time() measures you to the millisecond, and the Pi keeps your best of three.', 'एक एलईडी ऐसे इंतज़ार के बाद जलती है जिसका अंदाज़ा नहीं लग सकता; जितनी जल्दी हो सके बटन दबाइए। time() आपको मिलीसेकंड तक नापता है, और Pi तीन में से सबसे अच्छा रखता है।', 'Ek LED aise intezaar ke baad jalti hai jiska andaaza nahi lag sakta; jitni jaldi ho sake button dabaiye. time() aapko millisecond tak naapta hai, aur Pi teen mein se sabse achha rakhta hai.'),
      setup: { parts: ledAt('led1', 'r1', 'red', 31), wires: [...GNDW, ['B:GPIO17', 'H:i32']] },
      steps: [
        { k: 'info', do: t3('The red LED is wired to GPIO 17. Add the button.', 'लाल एलईडी GPIO 17 पर लगी है। बटन जोड़िए।', 'Laal LED GPIO 17 par lagi hai. Button jodiye.'), see: E },
        { k: 'place', place: P('b1', 'button', {}, 'e44', 0), do: t3('Put the button across the gap at 44e–46f.', 'बटन को बीच की खाली जगह के आर-पार 44e–46f पर लगाइए।', 'Button ko beech ke gap ke aar-paar 44e–46f par lagaiye.'), see: E },
        { k: 'wire', wire: ['b1.L2', 'GPIO27'], do: t3('Wire GPIO 27 (physical pin 13) to the button\'s leg in column 44 (rows g–j).', 'GPIO 27 (फ़िज़िकल पिन 13) से बटन के कॉलम 44 वाले पैर (पंक्ति g–j) तक वायर।', 'GPIO 27 (physical pin 13) se button ke column 44 wale pair (row g–j) tak wire.'), see: E },
        { k: 'wire', wire: ['b1.L4', 'rail:bn'], do: t3('Wire its other leg (column 46) to the − rail.', 'इसके दूसरे पैर (कॉलम 46) से − रेल तक वायर।', 'Iske doosre pair (column 46) se − rail tak wire.'), see: t3('Button(27) turns on the Pi\'s own pull-up: free it reads 1, pressed it is pulled to GND.', 'Button(27) Pi का अपना पुल-अप चालू करता है: छूटा हो तो 1, दबा हो तो GND की तरफ़ खिंच जाता है।', 'Button(27) Pi ka apna pull-up chalu karta hai: chhoota ho to 1, daba ho to GND ki taraf khinch jaata hai.') },
        check,
        run(t3('"Get ready..." in the terminal: watch the LED.', 'टर्मिनल में "Get ready...": एलईडी देखिए।', 'Terminal mein "Get ready...": LED dekhiye.')),
        { k: 'act', until: (S) => lines(S, /^Best: ([\d.]+) s$/).length > 0, do: t3('Three rounds: each time the LED lights, press the button at once.', 'तीन राउंड: हर बार एलईडी जलते ही तुरंत बटन दबाइए।', 'Teen round: har baar LED jalte hi turant button dabaiye.'),
          see: t3('Most people need 0.2 to 0.3 s: the light goes from your eye to your brain to your finger. uniform(2, 5) picks a wait you cannot learn.', 'ज़्यादातर लोगों को 0.2 से 0.3 s लगते हैं: रोशनी आँख से दिमाग़ और फिर उँगली तक जाती है। uniform(2, 5) ऐसा इंतज़ार चुनता है जिसे आप सीख नहीं सकते।', 'Zyadatar logon ko 0.2 se 0.3 s lagte hain: roshni aankh se dimaag aur phir ungli tak jaati hai. uniform(2, 5) aisa intezaar chunta hai jise aap seekh nahi sakte.') },
        { k: 'edit', test: (src) => /if\s+t\s*<\s*0\.3\s*:\s*\n\s+print\(\s*"Lightning fast!"\s*\)/.test(src), set: [[/    print\("Your time:", round\(t, 3\), "s"\)\n/, '    print("Your time:", round(t, 3), "s")\n    if t < 0.3:\n        print("Lightning fast!")\n']],
          do: t3('Praise a fast hand: under the print of "Your time", add  if t < 0.3:  and inside it  print("Lightning fast!"). Run.', 'तेज़ हाथ की तारीफ़: "Your time" वाले print के नीचे  if t < 0.3:  और उसके अंदर  print("Lightning fast!")  लिखिए। "चलाइए"।', 'Tez haath ki taareef: "Your time" wale print ke neeche  if t < 0.3:  aur uske andar  print("Lightning fast!")  likhiye. Run.'), see: E },
        { k: 'act', until: (S) => lines(S, /^Lightning fast!$/).length > 0, do: t3('Play again, quick as you can.', 'फिर से खेलिए, जितना तेज़ हो सके।', 'Phir se kheliye, jitna tez ho sake.'),
          see: t3('An if inside the for: your program now decides as well as measures. Sprint starts are timed the same way, and a start faster than 0.1 s counts as a false start.', 'for के अंदर एक if: अब आपका प्रोग्राम नापने के साथ फ़ैसला भी करता है। दौड़ की शुरुआत ऐसे ही नापी जाती है, और 0.1 s से तेज़ शुरुआत "फ़ॉल्स स्टार्ट" गिनी जाती है।', 'for ke andar ek if: ab aapka program naapne ke saath faisla bhi karta hai. Daud ki shuruaat aise hi naapi jaati hai, aur 0.1 s se tez shuruaat "false start" gini jaati hai.') },
      ],
      check: [noShort, ledChk('led1', 'r1', 17, COL.red), btnChk('b1', 27, t3('', '', ''))],
      done: (S) => lines(S, /^Lightning fast!$/).length > 0 },
    // 3 ---------------------------------------------------------------------------------------------- distance sensor
    { id: 'pi_distance', board: 'pi4', cls: '10', view: 'pi6', wview: 'pi6w', code: DISTANCE, drawer: ['resistor'], serial: true,
      title: t3('Distance sensor with GPIO Zero', 'GPIO Zero के साथ दूरी सेंसर', 'GPIO Zero ke saath doori sensor'),
      goal: t3('An HC-SR04 measures distance with sound; gpiozero\'s DistanceSensor does the timing for you. Its Echo answers with 5 V, so a voltage divider brings it down to 3.3 V for the Pi. Then a too-close alarm.', 'HC-SR04 आवाज़ से दूरी नापता है; gpiozero का DistanceSensor समय आपके लिए नापता है। इसका Echo 5 V से जवाब देता है, तो वोल्टेज डिवाइडर उसे Pi के लिए 3.3 V तक लाता है। फिर बहुत पास आने का अलार्म।', 'HC-SR04 awaaz se doori naapta hai; gpiozero ka DistanceSensor time aapke liye naapta hai. Iska Echo 5 V se jawab deta hai, to voltage divider use Pi ke liye 3.3 V tak laata hai. Phir bahut paas aane ka alarm.'),
      setup: { parts: [P('us1', 'hcsr04', {}, 'j45', 0), P('bz1', 'abuzz', {}, 'e56', 0)], wires: [['B:5V', rail('tp', 3)], [rail('tp', 43), 'H:f45'], ...GNDW, [rail('bn', 49), 'H:f48'], ['B:GPIO18', 'H:a56'], ['B:GND7', 'H:a59']] },
      steps: [
        { k: 'info', do: t3('The HC-SR04 gets 5 V and GND; an active buzzer is on GPIO 18. Your job: Trig, and Echo through a divider of 1 kΩ and 2.2 kΩ: 5 × 2.2 ÷ 3.2 ≈ 3.4 V, safe for GPIO 24.', 'HC-SR04 को 5 V और GND मिल रहे हैं; एक एक्टिव बज़र GPIO 18 पर है। आपका काम: Trig, और 1 kΩ व 2.2 kΩ के डिवाइडर से होकर Echo: 5 × 2.2 ÷ 3.2 ≈ 3.4 V, GPIO 24 के लिए सुरक्षित।', 'HC-SR04 ko 5 V aur GND mil rahe hain; ek active buzzer GPIO 18 par hai. Aapka kaam: Trig, aur 1 kΩ va 2.2 kΩ ke divider se hokar Echo: 5 × 2.2 ÷ 3.2 ≈ 3.4 V, GPIO 24 ke liye surakshit.'), see: E },
        { k: 'wire', wire: ['us1.TRIG', 'GPIO23'], do: t3('Wire Trig (column 46) to GPIO 23 (physical pin 16).', 'Trig (कॉलम 46) से GPIO 23 (फ़िज़िकल पिन 16) तक वायर।', 'Trig (column 46) se GPIO 23 (physical pin 16) tak wire.'), see: t3('Trig is an input of the sensor: the Pi\'s 3.3 V is enough for it.', 'Trig सेंसर का इनपुट है: Pi का 3.3 V इसके लिए काफ़ी है।', 'Trig sensor ka input hai: Pi ka 3.3 V iske liye kaafi hai.') },
        { k: 'place', place: P('r1', 'resistor', { ohms: 1000 }, 'g47', 2), do: t3('Put the 1 kΩ resistor (brown, black, red) from Echo\'s column 47 to column 43, in row g.', '1 kΩ रेज़िस्टर (भूरा, काला, लाल) Echo के कॉलम 47 से कॉलम 43 तक, पंक्ति g में लगाइए।', '1 kΩ resistor (brown, black, red) Echo ke column 47 se column 43 tak, row g mein lagaiye.'), see: E },
        { k: 'place', place: P('r2', 'resistor', { ohms: 2200 }, 'j43', 1), do: t3('Put the 2.2 kΩ resistor (red, red, red) from 43j into the − rail.', '2.2 kΩ रेज़िस्टर (लाल, लाल, लाल) 43j से − रेल में लगाइए।', '2.2 kΩ resistor (red, red, red) 43j se − rail mein lagaiye.'), see: E },
        { k: 'wire', wire: ['r2.1', 'GPIO24'], do: t3('Wire the middle of the divider (column 43) to GPIO 24 (physical pin 18).', 'डिवाइडर के बीच (कॉलम 43) से GPIO 24 (फ़िज़िकल पिन 18) तक वायर।', 'Divider ke beech (column 43) se GPIO 24 (physical pin 18) tak wire.'), see: E },
        check,
        run(t3('The terminal prints the distance to the wooden block five times a second.', 'टर्मिनल लकड़ी के ब्लॉक की दूरी हर सेकंड पाँच बार दिखाता है।', 'Terminal lakdi ke block ki doori har second paanch baar dikhata hai.')),
        { k: 'act', until: (S) => S.nums.some((v) => v > 1 && v < 15) && S.nums.some((v) => v > 60), do: t3('Tap the sensor; slide the block closer than 15 cm, then farther than 60 cm.', 'सेंसर को छूइए; ब्लॉक को 15 cm से पास, फिर 60 cm से दूर ले जाइए।', 'Sensor ko touch karo; block ko 15 cm se paas, phir 60 cm se door le jaiye.'),
          see: t3('DistanceSensor sends the ping, times the echo and gives .distance in metres (up to max_distance). You wrote no timing code at all.', 'DistanceSensor पिंग भेजता है, गूँज का समय नापता है और .distance मीटर में देता है (max_distance तक)। आपने समय का कोई कोड नहीं लिखा।', 'DistanceSensor ping bhejta hai, goonj ka time naapta hai aur .distance metre mein deta hai (max_distance tak). Aapne time ka koi code nahi likha.') },
        { k: 'edit', test: (src) => /if\s+cm\s*<\s*20\s*:\s*\n\s+buzzer\.on\(\)\s*\n\s*else\s*:\s*\n\s+buzzer\.off\(\)/.test(src), set: [[/    print\(round\(cm, 1\), "cm"\)\n/, '    print(round(cm, 1), "cm")\n    if cm < 20:\n        buzzer.on()\n    else:\n        buzzer.off()\n']],
          do: t3('A parking alarm: under the print, add  if cm < 20:  buzzer.on()  and  else:  buzzer.off(). Run.', 'पार्किंग अलार्म: print के नीचे  if cm < 20:  buzzer.on()  और  else:  buzzer.off()  जोड़िए। "चलाइए"।', 'Parking alarm: print ke neeche  if cm < 20:  buzzer.on()  aur  else:  buzzer.off()  jodiye. Run.'), see: E },
        { k: 'act', until: (S) => S.part('bz1') && S.part('bz1').state.on && S.part('us1') && S.part('us1').state.dist < 20, do: t3('Bring the block closer than 20 cm.', 'ब्लॉक को 20 cm से पास लाइए।', 'Block ko 20 cm se paas laiye.'),
          see: t3('Beep! A car\'s reversing sensor is this, with four sensors and a beep that gets faster as the wall gets nearer.', 'बीप! गाड़ी का रिवर्स सेंसर यही है, चार सेंसर और ऐसी बीप के साथ जो दीवार पास आने पर तेज़ होती जाती है।', 'Beep! Gaadi ka reverse sensor yahi hai, chaar sensor aur aisi beep ke saath jo deewar paas aane par tez hoti jaati hai.') },
      ],
      check: [noShort, no5('GPIO24'), (S) => (S.conn('us1.TRIG', 'GPIO23') ? null : [X.toPin, { x: t3('sensor\'s Trig', 'सेंसर का Trig', 'sensor ka Trig'), p: 'GPIO 23' }]), (S) => (S.conn('us1.ECHO', 'GPIO24') ? [X.echoDirect] : null),
        (S) => (S.has('r1') && S.has('r2') && S.chain('us1.ECHO', [['r1']], 'GPIO24') && S.chain('GPIO24', [['r2']], 'GND') ? null : [X.divider])],
      done: (S) => S.part('bz1') && S.part('bz1').state.on && /buzzer\.on\(\)/.test(S.runSrc || '') },
    // 4 ---------------------------------------------------------------------------------------------- quiz buzzer
    { id: 'pi_quiz', board: 'pi4', cls: '10', view: 'pi6', wview: 'pi6w', code: QUIZ, drawer: ['button'], serial: true,
      title: t3('Quiz buzzer for three teams', 'तीन टीमों के लिए क्विज़ बज़र', 'Teen teams ke liye quiz buzzer'),
      goal: t3('Three teams, three buttons, three lights: the first team to press gets its light and a beep, and the others are locked out while it answers. Lists keep the buttons and lights in order.', 'तीन टीमें, तीन बटन, तीन लाइटें: सबसे पहले दबाने वाली टीम को अपनी लाइट और एक बीप मिलती है, और उसके जवाब देते समय बाक़ी टीमें बंद रहती हैं। लिस्ट बटनों और लाइटों को क्रम में रखती हैं।', 'Teen teams, teen button, teen lights: sabse pehle dabaane wali team ko apni light aur ek beep milti hai, aur uske jawaab dete time baaki teams band rehti hain. List buttons aur lights ko kram mein rakhti hain.'),
      setup: { parts: [...ledAt('led1', 'r1', 'red', 21), ...ledAt('led2', 'r2', 'green', 25), ...ledAt('led3', 'r3', 'yellow', 29), P('b1', 'button', {}, 'e34', 0), P('b2', 'button', {}, 'e40', 0), P('bz1', 'abuzz', {}, 'e57', 0)],
        wires: [...GNDW, ['B:GPIO17', 'H:i22'], ['B:GPIO27', 'H:i26'], ['B:GPIO22', 'H:i30'], ['B:GPIO5', 'H:g34'], [rail('bn', 36), 'H:j36'], ['B:GPIO6', 'H:g40'], [rail('bn', 42), 'H:j42'], ['B:GPIO18', 'H:a57'], ['B:GND7', 'H:a60']] },
      steps: [
        { k: 'info', do: t3('Team 1 has button GPIO 5 and the red light (GPIO 17); team 2 button GPIO 6 and green (GPIO 27); team 3\'s light is yellow (GPIO 22). The buzzer is on GPIO 18. Team 3 needs its button.', 'टीम 1 का बटन GPIO 5 और लाल लाइट (GPIO 17); टीम 2 का बटन GPIO 6 और हरी (GPIO 27); टीम 3 की लाइट पीली (GPIO 22) है। बज़र GPIO 18 पर है। टीम 3 को उसका बटन चाहिए।', 'Team 1 ka button GPIO 5 aur laal light (GPIO 17); team 2 ka button GPIO 6 aur hari (GPIO 27); team 3 ki light peeli (GPIO 22) hai. Buzzer GPIO 18 par hai. Team 3 ko uska button chahiye.'), see: E },
        { k: 'place', place: P('b3', 'button', {}, 'e46', 0), do: t3('Put team 3\'s button across the gap at 46e–48f.', 'टीम 3 का बटन बीच की खाली जगह के आर-पार 46e–48f पर लगाइए।', 'Team 3 ka button beech ke gap ke aar-paar 46e–48f par lagaiye.'), see: E },
        { k: 'wire', wire: ['b3.L2', 'GPIO13'], do: t3('Wire GPIO 13 (physical pin 33) to its leg in column 46 (rows g–j).', 'GPIO 13 (फ़िज़िकल पिन 33) से इसके कॉलम 46 वाले पैर (पंक्ति g–j) तक वायर।', 'GPIO 13 (physical pin 33) se iske column 46 wale pair (row g–j) tak wire.'), see: E },
        { k: 'wire', wire: ['b3.L4', 'rail:bn'], do: t3('Wire its other leg (column 48) to the − rail.', 'इसके दूसरे पैर (कॉलम 48) से − रेल तक वायर।', 'Iske doosre pair (column 48) se − rail tak wire.'), see: E },
        check,
        { k: 'info', code: [5, 6, 13, 14, 15], do: t3('buttons[0] is team 1\'s button and lights[0] its light: one number, team, picks both. The for loop checks the three buttons again and again, a hundred times a second.', 'buttons[0] टीम 1 का बटन है और lights[0] उसकी लाइट: एक नंबर, team, दोनों चुनता है। for लूप तीनों बटन बार-बार, सेकंड में सौ बार जाँचता है।', 'buttons[0] team 1 ka button hai aur lights[0] uski light: ek number, team, dono chunta hai. for loop teeno button baar-baar, second mein sau baar jaanchta hai.'), see: E },
        run(t3('"Quiz ready!" in the terminal.', 'टर्मिनल में "Quiz ready!"।', 'Terminal mein "Quiz ready!".')),
        { k: 'act', until: (S) => lines(S, /^Team 3 first!$/).length > 0 && S.ledLit('led3'), do: t3('Team 3 knows the answer: press its button.', 'टीम 3 को जवाब पता है: उसका बटन दबाइए।', 'Team 3 ko jawaab pata hai: uska button dabaiye.'),
          see: t3('Yellow light, two beeps, "Team 3 first!". While sleep(lock) runs, nobody else\'s press is even read: the others are locked out.', 'पीली लाइट, दो बीप, "Team 3 first!"। जब तक sleep(lock) चलता है, किसी और का दबाना पढ़ा भी नहीं जाता: बाक़ी बंद हैं।', 'Peeli light, do beep, "Team 3 first!". Jab tak sleep(lock) chalta hai, kisi aur ka dabaana padha bhi nahi jaata: baaki band hain.') },
        { k: 'edit', test: (src) => /^lock\s*=\s*3\b/m.test(src), set: [[/^lock = 5\b/m, 'lock = 3']], do: t3('A faster quiz: change lock = 5 to lock = 3 and press Run.', 'तेज़ क्विज़: lock = 5 को lock = 3 कीजिए और "चलाइए" दबाइए।', 'Tez quiz: lock = 5 ko lock = 3 karo aur Run dabaiye.'), see: E },
        { k: 'act', until: (S) => S.memRun.t2 !== undefined && S.memRun.ready2 !== undefined && S.memRun.ready2 - S.memRun.t2 < 3.6, do: t3('Now team 2 presses first.', 'अब टीम 2 पहले दबाती है।', 'Ab team 2 pehle dabaati hai.'),
          see: t3('Green, and three seconds later "Quiz ready!" again. One number at the top of the program changes the whole game: that is why good programs keep such numbers in one named place.', 'हरी, और तीन सेकंड बाद फिर "Quiz ready!"। प्रोग्राम के ऊपर एक संख्या पूरा खेल बदल देती है: इसीलिए अच्छे प्रोग्राम ऐसी संख्याएँ एक नाम वाली जगह पर रखते हैं।', 'Hari, aur teen second baad phir "Quiz ready!". Program ke upar ek sankhya poora khel badal deti hai: isiliye achhe program aisi sankhyaayein ek naam wali jagah par rakhte hain.') },
      ],
      check: [noShort, btnChk('b3', 13, t3('team 3', 'टीम 3', 'team 3'))],
      tick: (S) => { const R = S.memRun; const ls = S.serLines || []; const k = ls.length; if (k === R.k) return; R.k = k; const last = String(ls[k - 1] || '').trim();
        if (last === 'Team 2 first!') R.t2 = S.t; if (last === 'Quiz ready!' && R.t2 !== undefined && R.ready2 === undefined) R.ready2 = S.t; },
      done: (S) => S.memRun.ready2 !== undefined && S.memRun.ready2 - S.memRun.t2 < 3.6 },
    // 5 ---------------------------------------------------------------------------------------------- Morse code
    { id: 'pi_morse', board: 'pi4', cls: '10', view: 'pi6', wview: 'pi6w', code: MORSE, drawer: [], serial: true,
      title: t3('Morse code translator', 'मोर्स कोड अनुवादक', 'Morse code anuvaadak'),
      goal: t3('Type a message in the terminal; a dictionary turns each letter into dots and dashes, and the LED and the buzzer send them, as ships and radio operators did for a hundred years.', 'टर्मिनल में संदेश लिखिए; एक डिक्शनरी हर अक्षर को डॉट और डैश में बदलती है, और एलईडी व बज़र उन्हें भेजते हैं, जैसे जहाज़ और रेडियो ऑपरेटर सौ साल तक करते रहे।', 'Terminal mein sandesh likhiye; ek dictionary har akshar ko dot aur dash mein badalti hai, aur LED va buzzer unhe bhejte hain, jaise jahaaz aur radio operator sau saal tak karte rahe.'),
      setup: { parts: [...ledAt('led1', 'r1', 'yellow', 31), P('bz1', 'abuzz', {}, 'e40', 0)], wires: [...GNDW, ['B:GPIO17', 'H:i32'], ['B:GND7', 'H:a43']] },
      steps: [
        { k: 'info', do: t3('The LED is on GPIO 17. The active buzzer\'s − leg is on GND; its + leg needs GPIO 18.', 'एलईडी GPIO 17 पर है। एक्टिव बज़र का − पैर GND पर है; उसके + पैर को GPIO 18 चाहिए।', 'LED GPIO 17 par hai. Active buzzer ka − pair GND par hai; uske + pair ko GPIO 18 chahiye.'), see: E },
        { k: 'wire', wire: ['bz1.P', 'GPIO18'], do: t3('Wire GPIO 18 (physical pin 12) to the buzzer\'s + leg (column 40).', 'GPIO 18 (फ़िज़िकल पिन 12) से बज़र के + पैर (कॉलम 40) तक वायर।', 'GPIO 18 (physical pin 12) se buzzer ke + pair (column 40) tak wire.'), see: E },
        check,
        { k: 'info', code: [4, 5, 6, 7, 8], do: t3('CODE is a dictionary: CODE["S"] gives "...". A dot is one unit long, a dash three; the gaps are one unit inside a letter, three between letters and seven between words.', 'CODE एक डिक्शनरी है: CODE["S"] देता है "..."। डॉट एक यूनिट लंबा, डैश तीन; अक्षर के अंदर एक यूनिट का अंतर, अक्षरों के बीच तीन और शब्दों के बीच सात।', 'CODE ek dictionary hai: CODE["S"] deta hai "...". Dot ek unit lamba, dash teen; akshar ke andar ek unit ka antar, akshron ke beech teen aur shabdon ke beech saat.'), see: E },
        run(t3('"Message: " in the terminal waits for you.', 'टर्मिनल में "Message: " आपका इंतज़ार करता है।', 'Terminal mein "Message: " aapka intezaar karta hai.')),
        { k: 'act', until: (S) => lines(S, /^O ---$/).length > 0 && lines(S, /^Sent\.$/).length > 0 && S.toggles('led1') >= 18, do: t3('Type SOS in the box under the terminal and press Enter.', 'टर्मिनल के नीचे वाले बॉक्स में SOS लिखिए और Enter दबाइए।', 'Terminal ke neeche wale box mein SOS likhiye aur Enter dabaiye.'),
          see: t3('Three short, three long, three short: ... --- ... , the call for help every sailor knows.', 'तीन छोटे, तीन लंबे, तीन छोटे: ... --- ... , मदद की वह पुकार जिसे हर नाविक जानता है।', 'Teen chhote, teen lambe, teen chhote: ... --- ... , madad ki woh pukaar jise har naavik jaanta hai.') },
        { k: 'edit', test: (src) => /^unit\s*=\s*0?\.1\b/m.test(src), set: [[/^unit = 0\.2\b/m, 'unit = 0.1']], do: t3('Send twice as fast: change unit = 0.2 to unit = 0.1 and press Run.', 'दोगुनी रफ़्तार से भेजिए: unit = 0.2 को unit = 0.1 कीजिए और "चलाइए" दबाइए।', 'Dugni raftaar se bhejiye: unit = 0.2 ko unit = 0.1 karo aur Run dabaiye.'), see: E },
        { k: 'act', until: (S) => lines(S, /^I \.\.$/).length > 0 && lines(S, /^Sent\.$/).length > 0, do: t3('Type your name (or HI) and press Enter.', 'अपना नाम (या HI) लिखिए और Enter दबाइए।', 'Apna naam (ya HI) likhiye aur Enter dabaiye.'),
          see: t3('Every timing comes from one number, unit: change it and the whole message speeds up, gaps and all. Skilled operators sent 20 words a minute or more.', 'हर समय एक संख्या, unit, से आता है: इसे बदलिए और पूरा संदेश तेज़ हो जाता है, अंतर समेत। कुशल ऑपरेटर एक मिनट में 20 या ज़्यादा शब्द भेजते थे।', 'Har time ek sankhya, unit, se aata hai: ise badaliye aur poora sandesh tez ho jaata hai, antar samet. Kushal operator ek minute mein 20 ya zyada shabd bhejte the.') },
      ],
      check: [noShort, ledChk('led1', 'r1', 17, t3('yellow', 'पीली', 'peeli')), (S) => (S.conn('bz1.P', 'GPIO18') ? null : [X.toPin, { x: t3('buzzer\'s + leg', 'बज़र का + पैर', 'buzzer ka + pair'), p: 'GPIO 18' }])],
      done: (S) => /^unit\s*=\s*0?\.1\b/m.test(S.runSrc || '') && lines(S, /^Sent\.$/).length > 0 },
  ];
  for (const l of L) { l.n = ++n; l.lang = 'py'; l.batch = 15; }
  return L;
}
