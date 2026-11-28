// DUET Robotics Lab 360, batch 9: micro:bit projects for Class 4 (Python, or blocks). Radio between two micro:bits
// (yours on the left, a friend's on the right, both running the same program), crocodile clips to a servo, an LED and
// soil probes, and the built-in sensors used as instruments: a guitar, a step measurer, a kick logger, a traffic survey,
// a compass treasure hunt, timing gates. Written fresh for DUET. Same shape as lessons8.js (tick, S.memRun, S.mem).
import { MBCore, MBX } from './microbit.js';

const make = (app, cfg) => new MBCore(app, cfg);
const centre = (dx, dz) => (focus) => ({ c: [MBX + dx, 0, dz], k: focus === 'robot' ? 0.55 : 1 });
const world = (o) => Object.assign({ kind: 'mb', make, centre: centre(o.cx || 0, o.cz || 0) }, o);
const img = (S) => S.wv('shownImg');
const lit = (S) => [...(S.wv('shown') || [])].filter((v) => v > 0).length;
const texts = (S) => (S.wv('texts') || []).map(String);
const has = (S, re) => texts(S).some((t) => re.test(t));
const lastNum = (S) => { const n = S.wv('nums') || []; return n.length ? +n[n.length - 1] : null; };
const ran = (S, re) => re.test(S.runSrc || '');
const R = (S) => S.memRun || {}; const M = (S) => S.mem || {};
const radio = (S) => S.wv('radio') || { sent: {}, got: {} };
const got = (S, k) => radio(S).got[k] || 0; const sent = (S, k) => radio(S).sent[k] || 0;
const angle = (S, tag = 'sv1') => { const p = S.app.world.parts[tag]; return p ? p.state.angle : 90; };
// a servo's lowest and highest angle in this run (tick)
const servoSpan = (S) => { const m = S.memRun; const a = angle(S); m.lo = Math.min(m.lo === undefined ? 999 : m.lo, a); m.hi = Math.max(m.hi === undefined ? -999 : m.hi, a); };

// ------------------------------------------------------------------ the programs
const CHAT = `# Micro chat: A sends YES, B sends NO, a shake sends a smile.
# Whatever comes in by radio is shown.
from microbit import *
import radio

radio.on()
radio.config(group=12)
while True:
    if button_a.was_pressed():
        radio.send("YES")
    if button_b.was_pressed():
        radio.send("NO")
    if accelerometer.was_gesture("shake"):
        radio.send("SMILE")
    msg = radio.receive()
    if msg == "SMILE":
        display.show(Image.HAPPY)
    elif msg:
        display.scroll(msg)
    sleep(20)
`;
const MOOD = `# Mood radio: A picks your mood, B sends it; your friend's mood shows on your screen
from microbit import *
import radio

MOODS = [Image.HAPPY, Image.SAD, Image.ANGRY, Image.ASLEEP]
NAMES = ["HAPPY", "SAD", "ANGRY", "ASLEEP"]
mine = 0
radio.on()
radio.config(group=21)
display.show(MOODS[mine])
while True:
    if button_a.was_pressed():
        mine = (mine + 1) % len(MOODS)
        display.show(MOODS[mine])
    if button_b.was_pressed():
        radio.send(NAMES[mine])
    msg = radio.receive()
    if msg in NAMES:
        display.show(MOODS[NAMES.index(msg)])
        sleep(2000)
        display.show(MOODS[mine])
    sleep(20)
`;
const REDGREEN = `# Red light, green light: the caller presses A for GO and B for STOP.
# Players may only move on GO: move on STOP and you are out!
from microbit import *
import radio

radio.on()
radio.config(group=33)
state = "STOP"
display.show(Image.NO)
while True:
    if button_a.was_pressed():
        radio.send("GO")
    if button_b.was_pressed():
        radio.send("STOP")
    msg = radio.receive()
    if msg == "GO":
        state = "GO"
        display.show(Image.YES)
    elif msg == "STOP":
        state = "STOP"
        display.show(Image.NO)
    if accelerometer.was_gesture("shake") and state == "STOP":
        display.show(Image.SKULL)       # you moved on red: out!
    sleep(20)
`;
const MDICE = `# Multi dice: shake any micro:bit in the group and every dice rolls
from microbit import *
import radio
import random

radio.on()
radio.config(group=55)
while True:
    roll = False
    if accelerometer.was_gesture("shake"):
        radio.send("ROLL")
        roll = True
    if radio.receive() == "ROLL":
        roll = True
    if roll:
        display.show(random.randint(1, 6))
    sleep(20)
`;
const DUCK = `# Teleporting duck: throw the duck to your friend's micro:bit by radio
from microbit import *
import radio

radio.on()
radio.config(group=66)
duck = False
while True:
    if pin_logo.was_touched():          # make a duck (only one player!)
        duck = True
    if button_a.was_pressed() and duck:
        radio.send("DUCK")
        duck = False
    if radio.receive() == "DUCK":
        duck = True
    if duck:
        display.show(Image.DUCK)
    else:
        display.clear()
    sleep(20)
`;
const VOTE = `# Voting machine: each voter presses A or B, the votes travel by radio,
# and the logo shows the votes this micro:bit has counted
from microbit import *
import radio

radio.on()
radio.config(group=77)
votes_a = 0
votes_b = 0
while True:
    if button_a.was_pressed():
        radio.send("A")
        display.show(Image.YES)
    if button_b.was_pressed():
        radio.send("B")
        display.show(Image.YES)
    msg = radio.receive()
    if msg == "A":
        votes_a += 1
    elif msg == "B":
        votes_b += 1
    if pin_logo.was_touched():
        display.scroll("A" + str(votes_a) + " B" + str(votes_b))
    sleep(20)
`;
const SERVO_FN = `def angle(a):
    # 0 to 180 degrees -> a pulse 0.5 to 2.5 ms long, every 20 ms
    pin0.write_analog(int(26 + a * 102 / 180))

pin0.set_analog_period(20)
`;
const WAVE = `# Waving arm: a servo on pin 0 waves hello when you press A
from microbit import *

${SERVO_FN}angle(90)
while True:
    if button_a.was_pressed():
        for i in range(3):             # wave three times
            angle(45)
            sleep(600)                 # a servo needs time to get there
            angle(135)
            sleep(600)
        angle(90)
    sleep(20)
`;
const MILK = `# Milk carton robot: wave a hand over its eyes (the LEDs) and it opens its mouth
from microbit import *

${SERVO_FN}angle(0)                               # mouth shut
display.show(Image.HAPPY)
while True:
    if display.read_light_level() < 40:    # a hand makes a shadow
        display.show(Image.SURPRISED)
        angle(90)                          # mouth open: munch!
        audio.play(Sound.GIGGLE)
        sleep(1000)
        angle(0)
        display.show(Image.HAPPY)
    sleep(100)
`;
const CURTAIN = `# Automatic curtain: it opens in the morning light and shuts when it gets dark
from microbit import *

${SERVO_FN}while True:
    level = display.read_light_level()
    if level > 120:
        angle(180)                     # day: open
        display.show(Image.HAPPY)
    elif level < 40:
        angle(0)                       # night: shut
        display.show(Image.ASLEEP)
    sleep(500)
`;
const BELL = `# Doorbell: A plays ding-dong; B shows how many visitors came
from microbit import *
import music

visitors = 0
display.show(Image.HOUSE)
while True:
    if button_a.was_pressed():
        visitors += 1
        display.show(Image.MUSIC_QUAVERS)
        music.play(["E5:4", "C5:8"])     # ding... dong
        display.show(Image.HOUSE)
    if button_b.was_pressed():
        display.scroll(visitors)
    sleep(20)
`;
const LAMP = `# Night lamp: an LED on pin 1 comes on when the room gets dark
from microbit import *

while True:
    if display.read_light_level() < 50:
        pin1.write_digital(1)          # dark: lamp on
    else:
        pin1.write_digital(0)          # light: lamp off
    sleep(200)
`;
const THIRST = `# Plant thirst alarm: two nails in the soil; the screen shows how wet it is,
# and when it is too dry it beeps and asks for water
from microbit import *
import music

while True:
    moisture = pin0.read_analog()      # dry soil: low, wet soil: high (0 to 1023)
    print(moisture)
    rows = moisture * 5 // 1024
    bars = Image(5, 5)
    for y in range(rows):
        for x in range(5):
            bars.set_pixel(x, 4 - y, 9)
    display.show(bars)
    if moisture < 400:
        music.pitch(880, 100)          # beep!
        display.scroll("WATER ME", delay=80)
    sleep(500)
`;
const GUITAR = `# Air guitar: press A to play; tilt the micro:bit to change the note
from microbit import *
import music

while True:
    if button_a.is_pressed():
        x = accelerometer.get_x()        # -1024 (left) to 1024 (right)
        music.pitch(440 + x // 4, 50)
    sleep(10)
`;
const STEPS = `# Distance walked: every shake is a step; A shows how far you walked, in metres
from microbit import *

steps = 0
STEP_LENGTH = 0.6          # metres: measure your own step!
while True:
    if accelerometer.was_gesture("shake"):
        steps += 1
        display.show(steps)
    if button_a.was_pressed():
        display.scroll(steps * STEP_LENGTH)
    sleep(20)
`;
const KICK = `# Kick strength: tape the micro:bit to your shoe, kick, and it logs how hard
from microbit import *

best = 0
while True:
    strength = accelerometer.get_strength()   # about 1000 when still (1 g)
    if strength > 1500:                       # a kick!
        print(strength)
        if strength > best:
            best = strength
        display.show(Image.YES)
        sleep(500)
        display.clear()
    if button_a.was_pressed():
        display.scroll(best)
    sleep(10)
`;
const TRAFFIC = `# Traffic survey at the school gate:
# A counts cars, B counts bikes, the logo counts people walking; shake for the totals
from microbit import *

cars = 0
bikes = 0
walkers = 0
while True:
    if button_a.was_pressed():
        cars += 1
        display.show(cars)
    if button_b.was_pressed():
        bikes += 1
        display.show(bikes)
    if pin_logo.was_touched():
        walkers += 1
        display.show(walkers)
    if accelerometer.was_gesture("shake"):
        display.scroll("C" + str(cars) + " B" + str(bikes) + " W" + str(walkers))
    sleep(20)
`;
const TREASURE = `# Treasure hunt: the treasure lies at 135 degrees (south-east). Turn until you face it.
from microbit import *

TARGET = 135
while True:
    h = compass.heading()
    diff = (TARGET - h + 540) % 360 - 180      # -180 to 180: how far to turn
    if abs(diff) < 15:
        display.show(Image.YES)
    elif diff > 0:
        display.show(Image.ARROW_E)            # turn right
    else:
        display.show(Image.ARROW_W)            # turn left
    sleep(100)
`;
const GATES = `# Timing gates: a toy car crosses gate 1 (pin 0), then gate 2 (pin 1). How fast was it?
from microbit import *

GAP = 50                         # centimetres between the two gates
while True:
    if pin0.is_touched():
        start = running_time()
        display.show(Image.ARROW_E)
        while not pin1.is_touched():
            sleep(1)
        ms = running_time() - start
        speed = GAP * 1000 // ms         # centimetres per second
        display.scroll(str(speed) + " CM/S")
    sleep(5)
`;
const BALANCE = `# Digital balance: a ruler balanced on a pencil, the micro:bit in the middle.
# The dot slides towards the heavy (low) side and sits in the middle when it balances.
from microbit import *

while True:
    x = accelerometer.get_x()          # + when the right side is low
    col = 2 + int(x / 300)             # about -3 to +3 around the middle
    col = max(0, min(4, col))          # keep it on the screen
    display.clear()
    display.set_pixel(col, 2, 9)
    sleep(100)
`;
const FIREFLY = `# Fireflies: each micro:bit flashes about once a second. When it sees a friend flash
# (a radio message), it moves its own clock forward a little. Soon they flash together.
from microbit import *
import radio
import random

radio.on()
radio.config(group=99)
clock = random.randint(0, 99)
while True:
    clock += 1
    if clock >= 100:                   # flash!
        clock = 0
        radio.send("F")
        display.show(Image("99999:99999:99999:99999:99999"))
        sleep(100)
        display.clear()
    if radio.receive() == "F" and clock > 50:
        clock += 10                    # a friend flashed: hurry a little
    sleep(10)
`;
const BURGLAR = `# Burglar alarm: put the micro:bit in a drawer and press A to arm it.
# If anyone moves it, the buzzer on pin 0 plays an alarm. A again disarms it.
from microbit import *
import music

armed = False
display.show(Image.NO)
while True:
    if button_a.was_pressed():
        armed = not armed
        if armed:
            display.show(Image.YES)
            sleep(1000)                    # time to close the drawer
            accelerometer.was_gesture("shake")   # forget that movement
        else:
            display.show(Image.NO)
    if armed and accelerometer.was_gesture("shake"):
        display.show(Image.SKULL)
        music.play(music.POWER_DOWN)       # on pin 0 (and the speaker)
    sleep(20)
`;
export const MB9_CODES = { CHAT, MOOD, REDGREEN, MDICE, DUCK, VOTE, WAVE, MILK, CURTAIN, BELL, LAMP, THIRST, GUITAR, STEPS, KICK, TRAFFIC, TREASURE, GATES, BALANCE, FIREFLY, BURGLAR };

export function batch9(K, n0) {
  const { t3 } = K;
  const T = (en, hi, hg) => t3(en, hi, hg);
  const E = T('', '', '');
  const run = (see) => ({ k: 'run', do: T('Press Run.', '"चलाइए" दबाइए।', 'Run dabaiye.'), see: see || T('The program goes into the micro:bit and starts.', 'प्रोग्राम micro:bit में जाकर चलने लगता है।', 'Program micro:bit mein jaakar chalne lagta hai.') });
  const run2 = () => run(T('The same program goes into both micro:bits, yours and your friend\'s.', 'एक ही प्रोग्राम दोनों micro:bit में जाता है, आपके और दोस्त के।', 'Ek hi program dono micro:bits mein jaata hai, aapke aur dost ke.'));
  const info = (code, d, s) => ({ k: 'info', code, do: d, see: s || E });
  const act = (until, d, s) => ({ k: 'act', until, do: d, see: s || E });
  const watch = (until, d, s) => ({ k: 'watch', until, do: d, see: s || E });
  const edit = (test, set, d) => ({ k: 'edit', test, set, do: d, see: E });
  const check = () => ({ k: 'check', do: T('Press "Check my circuit".', '"मेरा सर्किट जाँचिए" दबाइए।', '"Mera circuit check karo" dabaiye.'), see: E });
  // crocodile clips
  const X = {
    clip: T('A crocodile clip is missing: {a} must be joined to {b}.', 'एक क्रोकोडाइल क्लिप कम है: {a} को {b} से जोड़िए।', 'Ek crocodile clip kam hai: {a} ko {b} se jodiye.'),
    swapLed: T('The LED is the wrong way round: its long leg (+) goes to pin 1, its short leg (−) to GND.', 'एलईडी उल्टी लगी है: लंबा पैर (+) पिन 1 पर, छोटा पैर (−) GND पर।', 'LED ulti lagi hai: lamba pair (+) pin 1 par, chhota pair (−) GND par.'),
    short: T('3V is clipped straight to GND: that is a short circuit! Take that clip off.', '3V सीधे GND से जुड़ा है: यह शॉर्ट सर्किट है! वह क्लिप हटाइए।', '3V seedhe GND se juda hai: yeh short circuit hai! Woh clip hataiye.'),
    servoPow: T('The servo\'s red (+) wire must go to 3V and its brown wire to GND, or it has no power.', 'सर्वो का लाल (+) तार 3V पर और भूरा तार GND पर जाना चाहिए, वरना उसे बिजली नहीं मिलेगी।', 'Servo ka red (+) taar 3V par aur brown taar GND par jaana chahiye, warna use power nahi milegi.'),
  };
  const clipNeed = (a, b, an, bn) => (S) => (S.w(`conn:${a}~${b}`) ? null : [X.clip, { a: an, b: bn }]);
  const noShort = (S) => (S.w('conn:3V~GND') ? [X.short] : null);
  const SIGN = T('the orange (signal) wire', 'नारंगी (सिग्नल) तार', 'orange (signal) taar');
  const servoCheck = [noShort, clipNeed('P0', 'sv1.SIG', 'pin 0', SIGN), (S) => (S.w('conn:3V~sv1.VP') && S.w('conn:GND~sv1.GND') ? null : [X.servoPow])];
  const servoClips = () => [
    { k: 'act', clip: ['P0', 'sv1.SIG'], until: (S) => S.w('conn:P0~sv1.SIG'), do: T('Clip pin 0 to the servo\'s orange (signal) wire: tap pin 0, then the orange wire.', 'पिन 0 को सर्वो के नारंगी (सिग्नल) तार से क्लिप कीजिए: पहले पिन 0 छूइए, फिर नारंगी तार।', 'Pin 0 ko servo ke orange (signal) taar se clip kijiye: pehle pin 0 touch karo, phir orange taar.'), see: T('The signal tells the servo which angle to turn to.', 'सिग्नल सर्वो को बताता है कि किस कोण पर घूमना है।', 'Signal servo ko batata hai ki kis angle par ghoomna hai.') },
    { k: 'act', clip: ['3V', 'sv1.VP'], until: (S) => S.w('conn:3V~sv1.VP'), do: T('Clip 3V to the red (+) wire.', '3V को लाल (+) तार से क्लिप कीजिए।', '3V ko red (+) taar se clip kijiye.'), see: E },
    { k: 'act', clip: ['GND', 'sv1.GND'], until: (S) => S.w('conn:GND~sv1.GND'), do: T('Clip GND to the brown (−) wire.', 'GND को भूरे (−) तार से क्लिप कीजिए।', 'GND ko brown (−) taar se clip kijiye.'), see: T('A small SG90 servo runs on the micro:bit\'s 3 V when it moves gently; bigger ones need their own battery.', 'छोटा SG90 सर्वो धीरे चलने पर micro:bit के 3 V पर चल जाता है; बड़े सर्वो को अपनी बैटरी चाहिए।', 'Chhota SG90 servo dheere chalne par micro:bit ke 3 V par chal jaata hai; bade servo ko apni battery chahiye.') },
    check(),
  ];
  const twoBoards = (title, controls, hud) => world({ scene: 'rps', boards: 2, battery: true, controls, hud: hud || ['radio'], title });
  const servoWorld = (title, controls, hud) => world({ scene: 'gate', parts: [{ tag: 'sv1', type: 'servo' }], controls, hud: hud || ['servo'], title });
  const radioInfo = (code, grp) => info(code, T(`radio.on() switches the radio on. group=${grp} is your channel: only micro:bits in the same group (0 to 255) hear each other, so two games in one classroom don't mix.`, `radio.on() रेडियो चालू करता है। group=${grp} आपका चैनल है: एक ही group (0 से 255) वाले micro:bit ही एक-दूसरे को सुनते हैं, ताकि एक कक्षा में दो खेल आपस में न मिलें।`, `radio.on() radio on karta hai. group=${grp} aapka channel hai: ek hi group (0 se 255) wale micro:bits hi ek doosre ko sunte hain, taaki ek class mein do games aapas mein na milein.`));
  const L = [
    // 1 ------------------------------------------------------------------------------------------------------------
    { id: 'mbchat', view: 'mbtwo', code: CHAT, drawer: [],
      title: T('Micro chat by radio', 'रेडियो से माइक्रो चैट', 'Radio se micro chat'),
      goal: T('Send YES, NO and smiles between two micro:bits by radio, then add a message of your own.', 'दो micro:bit के बीच रेडियो से YES, NO और मुस्कान भेजिए, फिर अपना एक संदेश जोड़िए।', 'Do micro:bits ke beech radio se YES, NO aur muskaan bhejiye, phir apna ek message jodiye.'),
      world: twoBoards(T('Two micro:bits', 'दो micro:bit', 'Do micro:bits'), ['A', 'B', 'shake', 'logo', 'fAB']),
      setup: { parts: [], wires: [] },
      tick: (S) => { const f = S.wv('friendText'); if (ran(S, /pin_logo\.was_touched\(\)/) && f && !['YES', 'NO'].includes(f)) S.mem.own = true; },
      steps: [
        radioInfo([6, 7], 12),
        info([15, 18, 19], T('radio.receive() gives the next message, or None when nothing came. elif msg: means "if any other message came": then it scrolls.', 'radio.receive() अगला संदेश देता है, या कुछ न आया हो तो None। elif msg: का मतलब है "अगर कोई और संदेश आया": तब वह स्क्रॉल होता है।', 'radio.receive() agla message deta hai, ya kuch na aaya ho to None. elif msg: ka matlab hai "agar koi aur message aaya": tab woh scroll hota hai.')),
        run2(),
        act((S) => S.wv('friendText') === 'YES', T('Press A on your micro:bit (the left one).', 'अपने micro:bit (बाएँ वाले) पर A दबाइए।', 'Apne micro:bit (left wale) par A dabaiye.'), T('YES scrolls on your friend\'s board: the message flew by radio, no wires.', 'दोस्त के बोर्ड पर YES स्क्रॉल होता है: संदेश रेडियो से उड़कर गया, बिना तार।', 'Dost ke board par YES scroll hota hai: message radio se udkar gaya, bina taar.')),
        act((S) => has(S, /^NO$/), T('Now your friend presses B ("Friend presses B").', 'अब आपका दोस्त B दबाए ("दोस्त B दबाए")।', 'Ab aapka dost B dabaye ("Dost B dabaye").'), T('NO arrives on your board.', 'आपके बोर्ड पर NO आता है।', 'Aapke board par NO aata hai.')),
        act((S) => S.wv('friendShown') === 'HAPPY', T('Shake yours.', 'अपना हिलाइए।', 'Apna hilaiye.'), T('A smile pops up on your friend\'s screen.', 'दोस्त की स्क्रीन पर मुस्कान आती है।', 'Dost ki screen par muskaan aati hai.')),
        edit((src) => /pin_logo\.was_touched\(\)/.test(src) && (src.match(/radio\.send\("[^"]+"\)/g) || []).length >= 4, [[/(    msg = radio\.receive\(\))/, '    if pin_logo.was_touched():\n        radio.send("LUNCH")\n$1']],
          T('A message of your own: above msg = radio.receive() add\n    if pin_logo.was_touched():\n        radio.send("LUNCH")\n(or any word in capitals), then Run.', 'अपना संदेश: msg = radio.receive() के ऊपर लिखिए\n    if pin_logo.was_touched():\n        radio.send("LUNCH")\n(या बड़े अक्षरों में कोई भी शब्द), फिर "चलाइए"।', 'Apna message: msg = radio.receive() ke upar likhiye\n    if pin_logo.was_touched():\n        radio.send("LUNCH")\n(ya capital letters mein koi bhi shabd), phir Run.')),
        act((S) => !!M(S).own, T('Touch your logo.', 'अपना लोगो छूइए।', 'Apna logo chhuiye.'), T('Your word arrives. Real radios work the same way: walkie-talkies, Wi-Fi and phones send messages through the air.', 'आपका शब्द पहुँच गया। असली रेडियो ऐसे ही काम करते हैं: वॉकी-टॉकी, वाई-फ़ाई और फ़ोन हवा से संदेश भेजते हैं।', 'Aapka shabd pahunch gaya. Asli radio aise hi kaam karte hain: walkie-talkie, Wi-Fi aur phone hawa se message bhejte hain.')),
      ],
      done: (S) => !!M(S).own },
    // 2 ------------------------------------------------------------------------------------------------------------
    { id: 'mbmood', view: 'mbtwo', code: MOOD, drawer: [],
      title: T('Mood radio', 'मूड रेडियो', 'Mood radio'),
      goal: T('Pick a mood face and send it to a friend by radio; their mood shows on your board.', 'एक मूड वाला चेहरा चुनिए और रेडियो से दोस्त को भेजिए; उनका मूड आपके बोर्ड पर दिखता है।', 'Ek mood wala chehra chuniye aur radio se dost ko bhejiye; unka mood aapke board par dikhta hai.'),
      world: twoBoards(T('Mood radio', 'मूड रेडियो', 'Mood radio'), ['A', 'B', 'fAB']),
      setup: { parts: [], wires: [] },
      tick: (S) => { if (ran(S, /Image\.SURPRISED/) && S.wv('friendShown') === 'SURPRISED') S.mem.five = true; },
      steps: [
        info([5, 6], T('Two lists in the same order: MOODS[2] is the angry picture and NAMES[2] its name. The radio sends words, not pictures, so the name travels and the other board looks up the picture.', 'एक ही क्रम में दो सूचियाँ: MOODS[2] ग़ुस्से वाली तस्वीर है और NAMES[2] उसका नाम। रेडियो शब्द भेजता है, तस्वीर नहीं, इसलिए नाम जाता है और दूसरा बोर्ड तस्वीर ढूँढ लेता है।', 'Ek hi order mein do lists: MOODS[2] gusse wali tasveer hai aur NAMES[2] uska naam. Radio shabd bhejta hai, tasveer nahi, isliye naam jaata hai aur doosra board tasveer dhoondh leta hai.')),
        info([13], T('(mine + 1) % len(MOODS): the next mood, and after the last one, back to the first.', '(mine + 1) % len(MOODS): अगला मूड, और आख़िरी के बाद फिर पहला।', '(mine + 1) % len(MOODS): agla mood, aur aakhri ke baad phir pehla.')),
        run2(),
        act((S) => img(S) === 'ANGRY', T('Press A until your face is angry.', 'A दबाते रहिए जब तक आपका चेहरा ग़ुस्से वाला न हो।', 'A dabaate rahiye jab tak aapka chehra gusse wala na ho.')),
        act((S) => S.wv('friendShown') === 'ANGRY', T('Press B to send your mood.', 'अपना मूड भेजने के लिए B दबाइए।', 'Apna mood bhejne ke liye B dabaiye.'), T('Your friend sees that you are angry, for 2 seconds.', 'दोस्त 2 सेकंड के लिए देखता है कि आप ग़ुस्से में हैं।', 'Dost 2 second ke liye dekhta hai ki aap gusse mein ho.')),
        act((S) => img(S) === 'SAD' && got(S, 0) >= 1, T('Your friend presses A once, then B ("Friend presses A", "Friend presses B").', 'आपका दोस्त एक बार A दबाए, फिर B ("दोस्त A दबाए", "दोस्त B दबाए")।', 'Aapka dost ek baar A dabaye, phir B ("Dost A dabaye", "Dost B dabaye").'), T('Your friend is sad. Maybe ask why!', 'आपका दोस्त उदास है। शायद पूछिए क्यों!', 'Aapka dost udaas hai. Shayad poochhiye kyun!')),
        edit((src) => /Image\.SURPRISED/.test(src) && /"SURPRISED"/.test(src), [[/Image\.ASLEEP\]/, 'Image.ASLEEP, Image.SURPRISED]'], [/"ASLEEP"\]/, '"ASLEEP", "SURPRISED"]']],
          T('Add a mood: at the end of MOODS add , Image.SURPRISED and at the end of NAMES add , "SURPRISED" (same place in both lists), then Run.', 'एक मूड जोड़िए: MOODS के आख़िर में , Image.SURPRISED और NAMES के आख़िर में , "SURPRISED" लिखिए (दोनों सूचियों में एक ही जगह), फिर "चलाइए"।', 'Ek mood jodiye: MOODS ke aakhir mein , Image.SURPRISED aur NAMES ke aakhir mein , "SURPRISED" likhiye (dono lists mein ek hi jagah), phir Run.')),
        act((S) => !!M(S).five, T('Press A four times to reach the surprised face, then B.', 'हैरान चेहरे तक पहुँचने के लिए A चार बार दबाइए, फिर B।', 'Hairaan chehre tak pahunchne ke liye A chaar baar dabaiye, phir B.'), T('Five moods now. len(MOODS) grew by itself, so the % still wraps round at the end.', 'अब पाँच मूड। len(MOODS) अपने आप बढ़ गया, इसलिए % अब भी आख़िर में घूमकर शुरू पर आता है।', 'Ab paanch mood. len(MOODS) apne aap badh gaya, isliye % ab bhi aakhir mein ghoom kar shuru par aata hai.')),
      ],
      done: (S) => !!M(S).five },
    // 3 ------------------------------------------------------------------------------------------------------------
    { id: 'mbredgreen', view: 'mbtwo', code: REDGREEN, drawer: [],
      title: T('Red light, green light by radio', 'रेडियो से लाल बत्ती, हरी बत्ती', 'Radio se red light, green light'),
      goal: T('The playground game with micro:bits: the caller sends GO and STOP, and a player who moves on STOP is out.', 'micro:bit के साथ मैदान वाला खेल: बुलाने वाला GO और STOP भेजता है, और STOP पर हिलने वाला खिलाड़ी आउट।', 'micro:bit ke saath maidaan wala game: bulane wala GO aur STOP bhejta hai, aur STOP par hilne wala player out.'),
      world: twoBoards(T('Caller and player', 'बुलाने वाला और खिलाड़ी', 'Caller aur player'), ['A', 'B', 'friend']),
      setup: { parts: [], wires: [] },
      tick: (S, dt) => { const m = S.memRun; const fs = (S.app.world.obs.shakes || {})[1] || 0;
        if (m.fs === undefined) m.fs = fs; if (fs > m.fs && S.wv('friendShown') === 'YES') m.goShake = S.t; m.fs = fs;
        if (m.goShake !== undefined && S.t - m.goShake > 1 && S.wv('friendShown') === 'YES') m.safe = true;
        if (m.m0 === undefined) m.m0 = S.wv('music') || 0; if (ran(S, /music\./) && (S.wv('music') || 0) > m.m0 && S.wv('friendShown') === 'YES') S.mem.ding = true; },
      steps: [
        info([11, 12, 13, 14], T('You are the caller: your A and B send GO and STOP. A micro:bit does not hear its own messages, so the player\'s board changes, not yours.', 'आप बुलाने वाले हैं: आपके A और B GO और STOP भेजते हैं। micro:bit अपने ही संदेश नहीं सुनता, इसलिए खिलाड़ी का बोर्ड बदलता है, आपका नहीं।', 'Aap caller ho: aapke A aur B GO aur STOP bhejte hain. micro:bit apne hi message nahi sunta, isliye player ka board badalta hai, aapka nahi.')),
        info([22, 23], T('and needs both: a shake AND the light is red.', 'and को दोनों चाहिए: हिलना और लाल बत्ती।', 'and ko dono chahiye: hilna aur red light.')),
        run2(),
        act((S) => S.wv('friendShown') === 'YES', T('Green light: press A.', 'हरी बत्ती: A दबाइए।', 'Green light: A dabaiye.'), T('The player\'s board shows a tick: run!', 'खिलाड़ी के बोर्ड पर टिक: दौड़ो!', 'Player ke board par tick: daudo!')),
        act((S) => !!R(S).safe, T('The player runs ("Friend shakes").', 'खिलाड़ी दौड़ता है ("दोस्त हिलाए")।', 'Player daudta hai ("Dost hilaye").'), T('Moving on green is allowed: nothing happens.', 'हरी बत्ती पर चलना ठीक है: कुछ नहीं होता।', 'Green light par chalna theek hai: kuch nahi hota.')),
        act((S) => S.wv('friendShown') === 'NO', T('Red light: press B.', 'लाल बत्ती: B दबाइए।', 'Red light: B dabaiye.'), T('A cross: freeze!', 'क्रॉस: रुक जाओ!', 'Cross: ruk jao!')),
        act((S) => S.wv('friendShown') === 'SKULL', T('The player moves anyway ("Friend shakes").', 'खिलाड़ी फिर भी हिलता है ("दोस्त हिलाए")।', 'Player phir bhi hilta hai ("Dost hilaye").'), T('Out! The board felt the move, so nobody can argue about it.', 'आउट! बोर्ड ने हरकत महसूस की, इसलिए कोई बहस नहीं कर सकता।', 'Out! Board ne harkat mehsoos ki, isliye koi behas nahi kar sakta.')),
        edit((src) => /import music/.test(src) && /music\.play\(/.test(src), [[/import radio\n/, 'import radio\nimport music\n'], [/(        display\.show\(Image\.YES\)\n)/, '$1        music.play(music.BA_DING)\n']],
          T('Players can\'t always look at their board: under import radio add import music, and under display.show(Image.YES) add\n        music.play(music.BA_DING)\nthen Run.', 'खिलाड़ी हमेशा बोर्ड नहीं देख सकते: import radio के नीचे import music लिखिए, और display.show(Image.YES) के नीचे लिखिए\n        music.play(music.BA_DING)\nफिर "चलाइए"।', 'Players hamesha board nahi dekh sakte: import radio ke neeche import music likhiye, aur display.show(Image.YES) ke neeche likhiye\n        music.play(music.BA_DING)\nphir Run.')),
        act((S) => !!M(S).ding, T('Press A for green.', 'हरी बत्ती के लिए A दबाइए।', 'Green light ke liye A dabaiye.'), T('Ba-ding: a sound you can hear while you run.', 'बा-डिंग: दौड़ते हुए सुनाई देने वाली आवाज़।', 'Ba-ding: daudte hue sunai dene wali awaaz.')),
      ],
      done: (S) => !!M(S).ding },
    // 4 ------------------------------------------------------------------------------------------------------------
    { id: 'mbmdice', view: 'mbtwo', code: MDICE, drawer: [],
      title: T('Multi dice by radio', 'रेडियो से कई पासे', 'Radio se multi dice'),
      goal: T('Shake one micro:bit and every dice in the group rolls; then make it two dice and see which totals come most.', 'एक micro:bit हिलाइए और group के सारे पासे घूमते हैं; फिर दो पासे बनाइए और देखिए कौन-सा जोड़ सबसे ज़्यादा आता है।', 'Ek micro:bit hilaiye aur group ke saare dice ghoomte hain; phir do dice banaiye aur dekhiye kaun sa total sabse zyada aata hai.'),
      world: twoBoards(T('Multi dice', 'कई पासे', 'Multi dice'), ['shake', 'friend']),
      setup: { parts: [], wires: [] },
      tick: (S) => { if (ran(S, /randint\(1, 6\) \+ random\.randint\(1, 6\)/) && lastNum(S) > 6) S.mem.two = true; },
      steps: [
        info([10, 11, 12, 13, 14], T('Shaking sends ROLL to the group, and hearing ROLL rolls too: one shake rolls every dice.', 'हिलाने पर group को ROLL जाता है, और ROLL सुनने पर भी पासा घूमता है: एक बार हिलाना, सारे पासे।', 'Hilane par group ko ROLL jaata hai, aur ROLL sunne par bhi dice ghoomta hai: ek baar hilana, saare dice.')),
        run2(),
        act((S) => lastNum(S) >= 1 && S.wv('friendLit') > 0, T('Shake your micro:bit.', 'अपना micro:bit हिलाइए।', 'Apna micro:bit hilaiye.'), T('Both dice roll: a number on each, usually different.', 'दोनों पासे घूमते हैं: दोनों पर एक संख्या, अक्सर अलग।', 'Dono dice ghoomte hain: dono par ek number, aksar alag.')),
        act((S) => got(S, 0) >= 1, T('Now your friend shakes theirs ("Friend shakes").', 'अब दोस्त अपना हिलाए ("दोस्त हिलाए")।', 'Ab dost apna hilaye ("Dost hilaye").'), T('Yours rolls too. Board games with many players can use this.', 'आपका भी घूमता है। कई खिलाड़ियों वाले खेल में यह काम आता है।', 'Aapka bhi ghoomta hai. Kai players wale game mein yeh kaam aata hai.')),
        edit((src) => /randint\(1, 6\) \+ random\.randint\(1, 6\)/.test(src), [[/display\.show\(random\.randint\(1, 6\)\)/, 'display.show(random.randint(1, 6) + random.randint(1, 6))']],
          T('Two dice in one: change display.show(random.randint(1, 6)) to\n        display.show(random.randint(1, 6) + random.randint(1, 6))\nthen Run.', 'एक में दो पासे: display.show(random.randint(1, 6)) को ऐसा कीजिए\n        display.show(random.randint(1, 6) + random.randint(1, 6))\nफिर "चलाइए"।', 'Ek mein do dice: display.show(random.randint(1, 6)) ko aisa karo\n        display.show(random.randint(1, 6) + random.randint(1, 6))\nphir Run.')),
        act((S) => !!M(S).two, T('Shake until you see a number bigger than 6.', '6 से बड़ी संख्या दिखने तक हिलाइए।', '6 se bada number dikhne tak hilaiye.'), T('2 to 12, and 7 comes most often: more pairs make 7 (1+6, 2+5, 3+4…) than make 2 or 12.', '2 से 12, और 7 सबसे ज़्यादा आता है: 7 बनाने वाले जोड़े (1+6, 2+5, 3+4…) 2 या 12 से ज़्यादा हैं।', '2 se 12, aur 7 sabse zyada aata hai: 7 banane wale jode (1+6, 2+5, 3+4…) 2 ya 12 se zyada hain.')),
      ],
      done: (S) => !!M(S).two },
    // 5 ------------------------------------------------------------------------------------------------------------
    { id: 'mbduck', view: 'mbtwo', code: DUCK, drawer: [],
      title: T('Teleporting duck by radio', 'रेडियो से उड़ने वाली बत्तख', 'Radio se teleporting duck'),
      goal: T('One duck, two micro:bits: throw it across the room by radio. It is never in two places at once.', 'एक बत्तख, दो micro:bit: इसे रेडियो से कमरे के पार फेंकिए। यह कभी एक साथ दो जगह नहीं होती।', 'Ek duck, do micro:bits: ise radio se kamre ke paar phenkiye. Yeh kabhi ek saath do jagah nahi hoti.'),
      world: twoBoards(T('Teleporting duck', 'उड़ने वाली बत्तख', 'Teleporting duck'), ['logo', 'A', 'shake', 'fAB']),
      setup: { parts: [], wires: [] },
      tick: (S) => { if (ran(S, /and duck:/) && ran(S, /was_gesture\("shake"\) and duck/) && S.wv('friendShown') === 'DUCK') S.mem.shake = true; },
      steps: [
        info([11, 12, 13, 14, 15], T('duck is True on the board that has the duck. Sending it also sets duck = False here: the duck leaves, it isn\'t copied.', 'जिस बोर्ड के पास बत्तख है उस पर duck True है। भेजते समय यहाँ duck = False भी होता है: बत्तख जाती है, उसकी नकल नहीं बनती।', 'Jis board ke paas duck hai us par duck True hai. Bhejte samay yahan duck = False bhi hota hai: duck jaati hai, uski copy nahi banti.')),
        run2(),
        act((S) => img(S) === 'DUCK', T('Make a duck: touch your logo.', 'बत्तख बनाइए: अपना लोगो छूइए।', 'Duck banaiye: apna logo chhuiye.'), T('Quack.', 'क्वैक।', 'Quack.')),
        act((S) => S.wv('friendShown') === 'DUCK' && lit(S) === 0, T('Throw it: press A.', 'फेंकिए: A दबाइए।', 'Phenkiye: A dabaiye.'), T('It vanished from yours and appeared on your friend\'s.', 'यह आपके बोर्ड से ग़ायब होकर दोस्त के बोर्ड पर आ गई।', 'Yeh aapke board se gaayab hokar dost ke board par aa gayi.')),
        act((S) => img(S) === 'DUCK' && S.wv('friendLit') === 0, T('Your friend throws it back ("Friend presses A").', 'दोस्त इसे वापस फेंके ("दोस्त A दबाए")।', 'Dost ise wapas phenke ("Dost A dabaye").'), T('Back to you. Pass it round the whole class: everyone in group 66.', 'वापस आपके पास। इसे पूरी कक्षा में घुमाइए: group 66 में सब।', 'Wapas aapke paas. Ise poori class mein ghumaiye: group 66 mein sab.')),
        edit((src) => /was_gesture\("shake"\) and duck/.test(src), [[/button_a\.was_pressed\(\) and duck/, 'accelerometer.was_gesture("shake") and duck']],
          T('Throw it with a flick: change button_a.was_pressed() to accelerometer.was_gesture("shake"), then Run.', 'झटके से फेंकिए: button_a.was_pressed() को accelerometer.was_gesture("shake") कीजिए, फिर "चलाइए"।', 'Jhatke se phenkiye: button_a.was_pressed() ko accelerometer.was_gesture("shake") karo, phir Run.')),
        act((S) => !!M(S).shake, T('Make a new duck (logo), then flick it (shake).', 'नई बत्तख बनाइए (लोगो), फिर झटका दीजिए (हिलाइए)।', 'Nayi duck banaiye (logo), phir jhatka dijiye (hilaiye).'), T('Any input can start any action: a button, a touch or a shake.', 'कोई भी इनपुट कोई भी काम शुरू कर सकता है: बटन, छूना या हिलाना।', 'Koi bhi input koi bhi kaam shuru kar sakta hai: button, touch ya hilana.')),
      ],
      done: (S) => !!M(S).shake },
    // 6 ------------------------------------------------------------------------------------------------------------
    { id: 'mbvote', view: 'mbtwo', code: VOTE, drawer: [],
      title: T('Voting machine by radio', 'रेडियो से वोटिंग मशीन', 'Radio se voting machine'),
      goal: T('Vote A or B by radio and count the votes; then make sure each voter can vote only once.', 'रेडियो से A या B को वोट दीजिए और वोट गिनिए; फिर पक्का कीजिए कि हर कोई एक ही बार वोट दे सके।', 'Radio se A ya B ko vote dijiye aur vote giniye; phir pakka kijiye ki har koi ek hi baar vote de sake.'),
      world: twoBoards(T('Voting machine', 'वोटिंग मशीन', 'Voting machine'), ['A', 'B', 'logo', 'fAB']),
      setup: { parts: [], wires: [] },
      tick: (S) => { const m = S.memRun; const p = (S.wv('presses') || {}).a || 0;
        if (m.p0 === undefined) { m.p0 = p; m.s0 = sent(S, 0); }
        if (ran(S, /and not voted/) && p - m.p0 >= 3 && sent(S, 0) - m.s0 === 1) S.mem.once = true; },
      steps: [
        info([11, 12, 18, 19], T('Your vote goes out by radio; the other board counts it: votes_a += 1 adds one to A\'s total.', 'आपका वोट रेडियो से जाता है; दूसरा बोर्ड उसे गिनता है: votes_a += 1 A के कुल में एक जोड़ता है।', 'Aapka vote radio se jaata hai; doosra board use ginta hai: votes_a += 1 A ke total mein ek jodta hai.')),
        run2(),
        act((S) => got(S, 1) >= 1, T('Vote A on yours: press A.', 'अपने पर A को वोट दीजिए: A दबाइए।', 'Apne par A ko vote dijiye: A dabaiye.'), T('A tick on yours; the vote is counted on your friend\'s board.', 'आपके पर टिक; वोट दोस्त के बोर्ड पर गिना गया।', 'Aapke par tick; vote dost ke board par gina gaya.')),
        act((S) => got(S, 0) >= 1, T('Your friend votes B ("Friend presses B").', 'दोस्त B को वोट दे ("दोस्त B दबाए")।', 'Dost B ko vote de ("Dost B dabaye").')),
        act((S) => has(S, /^A\d+ B[1-9]\d*$/), T('Touch your logo for the count.', 'गिनती के लिए अपना लोगो छूइए।', 'Ginti ke liye apna logo chhuiye.'), T('A0 B1: your board counted your friend\'s vote. In class, one teacher\'s board counts everyone\'s.', 'A0 B1: आपके बोर्ड ने दोस्त का वोट गिना। कक्षा में, टीचर का एक बोर्ड सबके वोट गिनता है।', 'A0 B1: aapke board ne dost ka vote gina. Class mein, teacher ka ek board sabke vote ginta hai.')),
        edit((src) => (src.match(/was_pressed\(\) and not voted/g) || []).length === 2 && (src.match(/voted = True/g) || []).length === 2 && /voted = False/.test(src),
          [[/votes_b = 0\n/, 'votes_b = 0\nvoted = False\n'], [/if button_a\.was_pressed\(\):/, 'if button_a.was_pressed() and not voted:'], [/if button_b\.was_pressed\(\):/, 'if button_b.was_pressed() and not voted:'], [/(        radio\.send\("A"\)\n)/, '$1        voted = True\n'], [/(        radio\.send\("B"\)\n)/, '$1        voted = True\n']],
          T('One person, one vote: under votes_b = 0 add voted = False; change both button lines to end with and not voted: (if button_a.was_pressed() and not voted:); and under each radio.send add voted = True. Then Run.', 'एक व्यक्ति, एक वोट: votes_b = 0 के नीचे voted = False लिखिए; दोनों बटन वाली लाइनों के आख़िर में and not voted: कीजिए (if button_a.was_pressed() and not voted:); और हर radio.send के नीचे voted = True लिखिए। फिर "चलाइए"।', 'Ek vyakti, ek vote: votes_b = 0 ke neeche voted = False likhiye; dono button wali lines ke aakhir mein and not voted: karo (if button_a.was_pressed() and not voted:); aur har radio.send ke neeche voted = True likhiye. Phir Run.')),
        act((S) => !!M(S).once, T('Try to cheat: press A three times.', 'चीटिंग की कोशिश कीजिए: A तीन बार दबाइए।', 'Cheating ki koshish kijiye: A teen baar dabaiye.'), T('Only one vote went out. Real voting machines also make sure each person votes once.', 'सिर्फ़ एक वोट गया। असली वोटिंग मशीनें भी पक्का करती हैं कि हर व्यक्ति एक ही बार वोट दे।', 'Sirf ek vote gaya. Asli voting machines bhi pakka karti hain ki har vyakti ek hi baar vote de.')),
      ],
      done: (S) => !!M(S).once },
    // 7 ------------------------------------------------------------------------------------------------------------
    { id: 'mbwave', view: 'mbwide', code: WAVE, drawer: [],
      title: T('Waving arm (servo)', 'हाथ हिलाने वाला सर्वो', 'Waving arm (servo)'),
      goal: T('Clip a servo motor to the micro:bit and make its arm wave hello, then wave wider.', 'micro:bit से एक सर्वो मोटर क्लिप कीजिए और उसकी भुजा से हेलो हिलवाइए, फिर और चौड़ा।', 'micro:bit se ek servo motor clip kijiye aur uski arm se hello hilwaiye, phir aur chauda.'),
      world: servoWorld(T('Waving arm', 'हिलता हाथ', 'Hilta haath'), ['A']),
      setup: { parts: [], wires: [] },
      tick: (S) => { servoSpan(S); const m = S.memRun; if (m.lo <= 55 && m.hi >= 125) S.mem.wave = true; if (ran(S, /angle\(20\)/) && m.lo <= 30 && m.hi >= 150) S.mem.wide = true; },
      steps: [
        ...servoClips(),
        info([4, 5, 6, 8], T('A servo turns to the angle it is told: 0 to 180 degrees. The micro:bit tells it with pulses on pin 0, 50 times a second; angle() works out the pulse for you.', 'सर्वो उतना घूमता है जितना कोण बताया जाए: 0 से 180 डिग्री। micro:bit उसे पिन 0 पर पल्स से बताता है, सेकंड में 50 बार; angle() पल्स का हिसाब कर देता है।', 'Servo utna ghoomta hai jitna angle bataya jaye: 0 se 180 degree. micro:bit use pin 0 par pulse se batata hai, second mein 50 baar; angle() pulse ka hisaab kar deta hai.')),
        run(),
        act((S) => !!M(S).wave, T('Press A.', 'A दबाइए।', 'A dabaiye.'), T('45°, 135°, three times: hello! A small servo turns about 170° a second on 3 V, so each swing needs its 0.6 s.', '45°, 135°, तीन बार: हेलो! छोटा सर्वो 3 V पर लगभग 170° प्रति सेकंड घूमता है, इसलिए हर झूले को 0.6 सेकंड चाहिए।', '45°, 135°, teen baar: hello! Chhota servo 3 V par lagbhag 170° per second ghoomta hai, isliye har jhoole ko 0.6 second chahiye.')),
        edit((src) => /angle\(20\)/.test(src) && /angle\(160\)/.test(src) && (src.match(/sleep\(900\)/g) || []).length === 2, [[/angle\(45\)/, 'angle(20)'], [/angle\(135\)/, 'angle(160)'], [/sleep\(600\)                 # a servo/, 'sleep(900)                 # a servo'], [/(angle\(160\)\n            )sleep\(600\)/, '$1sleep(900)']],
          T('Wave wider: change angle(45) to angle(20) and angle(135) to angle(160). A longer swing takes longer, so change both sleep(600) to sleep(900). Then Run.', 'और चौड़ा हिलाइए: angle(45) को angle(20) और angle(135) को angle(160) कीजिए। लंबा झूला ज़्यादा समय लेता है, इसलिए दोनों sleep(600) को sleep(900) कीजिए। फिर "चलाइए"।', 'Aur chauda hilaiye: angle(45) ko angle(20) aur angle(135) ko angle(160) karo. Lamba jhoola zyada time leta hai, isliye dono sleep(600) ko sleep(900) karo. Phir Run.')),
        act((S) => !!M(S).wide, T('Press A.', 'A दबाइए।', 'A dabaiye.'), T('A big wave. Robot arms in factories turn their joints with motors like this, just bigger.', 'बड़ा हाथ हिलाना। कारख़ानों की रोबोट भुजाएँ भी ऐसी ही मोटरों से जोड़ घुमाती हैं, बस बड़ी।', 'Bada haath hilana. Factories ki robot arms bhi aisi hi motors se jod ghumati hain, bas badi.')),
      ],
      check: servoCheck,
      done: (S) => !!M(S).wide },
    // 8 ------------------------------------------------------------------------------------------------------------
    { id: 'mbmilk', view: 'mbwide', code: MILK, drawer: [],
      title: T('Milk carton robot (servo)', 'दूध के डिब्बे वाला रोबोट (सर्वो)', 'Milk carton robot (servo)'),
      goal: T('A hungry carton monster: wave a hand over its eyes and its servo mouth opens with a giggle.', 'भूखा डिब्बा राक्षस: उसकी आँखों के ऊपर हाथ हिलाइए और उसका सर्वो वाला मुँह खिलखिलाकर खुलता है।', 'Bhookha dibba monster: uski aankhon ke upar haath hilaiye aur uska servo wala munh khilkhila kar khulta hai.'),
      world: servoWorld(T('Carton robot', 'डिब्बा रोबोट', 'Dibba robot'), ['light'], ['servo', 'light']),
      setup: { parts: [], wires: [] },
      tick: (S) => { servoSpan(S); const l = S.wv('light'); if (angle(S) >= 80 && img(S) === 'SURPRISED') { S.memRun.open = true; if (ran(S, /< 80/) && l >= 40 && l < 80) S.mem.easy = true; } if (S.memRun.open && angle(S) <= 10 && img(S) === 'HAPPY') S.memRun.shut = true; },
      steps: [
        ...servoClips(),
        info([10], T('The LEDs feel light. A hand above them makes a shadow: the light level drops below 40.', 'एलईडी रोशनी महसूस करती हैं। ऊपर रखा हाथ परछाईं बनाता है: रोशनी 40 से नीचे गिरती है।', 'LEDs roshni mehsoos karti hain. Upar rakha haath parchhaai banata hai: roshni 40 se neeche girti hai.')),
        run(),
        act((S) => !!R(S).open, T('Feed it: slide Room light down to 10% (your hand over its eyes).', 'इसे खिलाइए: Room light को 10% तक नीचे सरकाइए (आँखों पर आपका हाथ)।', 'Ise khilaiye: Room light ko 10% tak neeche sarkaiye (aankhon par aapka haath).'), T('Its mouth opens: munch!', 'मुँह खुलता है: चप-चप!', 'Munh khulta hai: chap-chap!')),
        act((S) => !!R(S).shut && S.wv('light') > 100, T('Take your hand away: Room light back to 75%.', 'हाथ हटाइए: Room light वापस 75%।', 'Haath hataiye: Room light wapas 75%.'), T('Mouth shut, happy face.', 'मुँह बंद, ख़ुश चेहरा।', 'Munh band, khush chehra.')),
        edit((src) => /read_light_level\(\) < 80/.test(src), [[/read_light_level\(\) < 40/, 'read_light_level() < 80']],
          T('Make it hungrier: change < 40 to < 80, so a lighter shadow is enough. Then Run.', 'इसे और भूखा बनाइए: < 40 को < 80 कीजिए, ताकि हल्की परछाईं भी काफ़ी हो। फिर "चलाइए"।', 'Ise aur bhookha banaiye: < 40 ko < 80 karo, taaki halki parchhaai bhi kaafi ho. Phir Run.')),
        act((S) => !!M(S).easy, T('A light shadow: Room light to 45%.', 'हल्की परछाईं: Room light 45%।', 'Halki parchhaai: Room light 45%.'), T('It eats now even in a half shadow. Make the carton face from a real milk carton, with the servo as its jaw!', 'अब यह आधी परछाईं में भी खाता है। असली दूध के डिब्बे से चेहरा बनाइए, सर्वो को जबड़ा बनाकर!', 'Ab yeh aadhi parchhaai mein bhi khaata hai. Asli doodh ke dibbe se chehra banaiye, servo ko jabda banakar!')),
      ],
      check: servoCheck,
      done: (S) => !!M(S).easy },
    // 9 ------------------------------------------------------------------------------------------------------------
    { id: 'mbcurtain', view: 'mbwide', code: CURTAIN, drawer: [],
      title: T('Automatic curtain: light sensor and servo', 'अपने आप चलने वाला पर्दा: लाइट सेंसर और सर्वो', 'Automatic curtain: light sensor aur servo'),
      goal: T('A curtain that opens at sunrise and shuts at night, with a gap between the two limits so it doesn\'t flap at dusk.', 'ऐसा पर्दा जो सूरज निकलने पर खुले और रात में बंद हो, दोनों सीमाओं के बीच अंतर के साथ ताकि शाम को फड़फड़ाए नहीं।', 'Aisa parda jo suraj nikalne par khule aur raat mein band ho, dono seemaon ke beech gap ke saath taaki shaam ko phadphadaye nahi.'),
      world: servoWorld(T('Curtain', 'पर्दा', 'Parda'), ['light'], ['servo', 'light']),
      setup: { parts: [], wires: [] },
      tick: (S, dt) => { const m = S.memRun; const l = S.wv('light'); const a = angle(S);
        if (a <= 10 && l >= 40 && l <= 120) { m.dusk = (m.dusk || 0) + dt; if (m.dusk > 2) m.held = true; } else m.dusk = 0;
        if (ran(S, /level > 60/) && a >= 170 && l > 60 && l <= 120) S.mem.early = true; },
      steps: [
        ...servoClips(),
        info([9, 10, 13, 14], T('Above 120 the curtain opens (180°); below 40 it shuts (0°). Between 40 and 120 neither is true, so it stays as it was.', '120 से ऊपर पर्दा खुलता है (180°); 40 से नीचे बंद होता है (0°)। 40 और 120 के बीच दोनों सच नहीं, इसलिए जैसा था वैसा रहता है।', '120 se upar parda khulta hai (180°); 40 se neeche band hota hai (0°). 40 aur 120 ke beech dono sach nahi, isliye jaisa tha waisa rehta hai.')),
        run(),
        act((S) => angle(S) >= 170, T('Morning: slide Room light to 100%.', 'सुबह: Room light को 100% कीजिए।', 'Subah: Room light ko 100% kijiye.'), T('The curtain opens.', 'पर्दा खुलता है।', 'Parda khulta hai.')),
        act((S) => angle(S) <= 10, T('Night: slide it to 10%.', 'रात: इसे 10% कीजिए।', 'Raat: ise 10% kijiye.'), T('It shuts.', 'बंद हो जाता है।', 'Band ho jaata hai.')),
        act((S) => !!R(S).held, T('Dusk: slide it to 45% and wait.', 'शाम: इसे 45% कीजिए और रुकिए।', 'Shaam: ise 45% kijiye aur rukiye.'), T('It stays shut: half-light is between the limits. If both limits were the same, a passing cloud would open and shut it again and again.', 'यह बंद ही रहता है: हल्की रोशनी दोनों सीमाओं के बीच है। अगर दोनों सीमाएँ एक होतीं, तो गुज़रता बादल इसे बार-बार खोलता-बंद करता।', 'Yeh band hi rehta hai: halki roshni dono seemaon ke beech hai. Agar dono seemayein ek hoti, to guzarta baadal ise baar-baar kholta-band karta.')),
        edit((src) => /level > 60/.test(src), [[/level > 120/, 'level > 60']],
          T('Open it earlier in the morning: change level > 120 to level > 60, then Run.', 'सुबह जल्दी खोलिए: level > 120 को level > 60 कीजिए, फिर "चलाइए"।', 'Subah jaldi kholiye: level > 120 ko level > 60 karo, phir Run.')),
        act((S) => !!M(S).early, T('Keep the light at 45%.', 'रोशनी 45% पर रखिए।', 'Roshni 45% par rakhiye.'), T('Now the early-morning light is enough to open it.', 'अब सुबह की हल्की रोशनी ही इसे खोलने को काफ़ी है।', 'Ab subah ki halki roshni hi ise kholne ko kaafi hai.')),
      ],
      check: servoCheck,
      done: (S) => !!M(S).early },
    // 10 -----------------------------------------------------------------------------------------------------------
    { id: 'mbbell', view: 'mb', code: BELL, drawer: [],
      title: T('Doorbell: push button and speaker', 'दरवाज़े की घंटी: बटन और स्पीकर', 'Doorbell: button aur speaker'),
      goal: T('A doorbell that plays ding-dong and counts the visitors; then compose your own chime.', 'ऐसी घंटी जो डिंग-डॉन्ग बजाए और मेहमान गिने; फिर अपनी धुन बनाइए।', 'Aisi ghanti jo ding-dong bajaye aur mehmaan gine; phir apni dhun banaiye.'),
      world: world({ scene: 'desk', controls: ['A', 'B'], hud: ['buttons'], title: T('Doorbell', 'दरवाज़े की घंटी', 'Darwaze ki ghanti') }),
      setup: { parts: [], wires: [] },
      tick: (S) => { const m = S.memRun; if (m.m0 === undefined) m.m0 = S.wv('music') || 0; if ((S.wv('music') || 0) > m.m0) m.rang = true; if (m.rang && ran(S, /music\.play\(\["C5:4", "E5:4", "G5:8"\]\)/)) S.mem.tune = true; },
      steps: [
        info([11], T('Each note is a name, an octave and a length: "E5:4" is E in octave 5, 4 beats long. Higher octave numbers sound higher.', 'हर सुर में नाम, सप्तक और लंबाई है: "E5:4" यानी सप्तक 5 का E, 4 ताल लंबा। सप्तक की संख्या जितनी ऊँची, आवाज़ उतनी ऊँची।', 'Har sur mein naam, octave aur lambai hai: "E5:4" matlab octave 5 ka E, 4 beat lamba. Octave ka number jitna ooncha, awaaz utni oonchi.')),
        run(),
        act((S) => !!R(S).rang && S.w('img:MUSIC_QUAVERS'), T('A visitor! Press A.', 'मेहमान आया! A दबाइए।', 'Mehmaan aaya! A dabaiye.'), T('Ding… dong. (Turn the sound on.)', 'डिंग… डॉन्ग। (आवाज़ चालू कीजिए।)', 'Ding… dong. (Sound on kijiye.)')),
        act((S) => lastNum(S) >= 3, T('Two more visitors (A, A), then press B.', 'दो मेहमान और (A, A), फिर B दबाइए।', 'Do mehmaan aur (A, A), phir B dabaiye.'), T('3 visitors today. Shops count customers like this.', 'आज 3 मेहमान। दुकानें ग्राहक ऐसे ही गिनती हैं।', 'Aaj 3 mehmaan. Dukaanein graahak aise hi ginti hain.')),
        edit((src) => /music\.play\(\["C5:4", "E5:4", "G5:8"\]\)/.test(src), [[/music\.play\(\["E5:4", "C5:8"\]\)/, 'music.play(["C5:4", "E5:4", "G5:8"])']],
          T('Your own chime: change ["E5:4", "C5:8"] to ["C5:4", "E5:4", "G5:8"] (three notes going up), then Run.', 'अपनी धुन: ["E5:4", "C5:8"] को ["C5:4", "E5:4", "G5:8"] कीजिए (ऊपर चढ़ते तीन सुर), फिर "चलाइए"।', 'Apni dhun: ["E5:4", "C5:8"] ko ["C5:4", "E5:4", "G5:8"] karo (upar chadhte teen sur), phir Run.')),
        act((S) => !!M(S).tune, T('Press A.', 'A दबाइए।', 'A dabaiye.'), T('C, E, G: the notes of a happy chord. Sa, Ga, Pa in Indian music.', 'C, E, G: ख़ुशनुमा कॉर्ड के सुर। भारतीय संगीत में सा, ग, प।', 'C, E, G: khushnuma chord ke sur. Bhartiya sangeet mein Sa, Ga, Pa.')),
      ],
      done: (S) => !!M(S).tune },
    // 11 -----------------------------------------------------------------------------------------------------------
    { id: 'mblamp', view: 'mbwide', code: LAMP, drawer: [],
      title: T('Night lamp: light sensor and LED', 'रात का लैंप: लाइट सेंसर और एलईडी', 'Night lamp: light sensor aur LED'),
      goal: T('Clip an LED to pin 1 and switch it on when the room gets dark; then make it a gentle glow.', 'पिन 1 से एक एलईडी क्लिप कीजिए और कमरे में अँधेरा होने पर जलाइए; फिर इसे हल्की रोशनी बनाइए।', 'Pin 1 se ek LED clip kijiye aur kamre mein andhera hone par jalaiye; phir ise halki roshni banaiye.'),
      world: world({ scene: 'desk', parts: [{ tag: 'led1', type: 'led', color: 'yellow' }], controls: ['light'], hud: ['light', 'led'], title: T('Night lamp', 'रात का लैंप', 'Raat ka lamp') }),
      setup: { parts: [], wires: [] },
      tick: (S) => { const p = S.app.world.parts.led1; const b = p ? p.state.b || 0 : 0; if (ran(S, /write_analog\(/) && S.wv('light') < 50 && b > 0.05 && b < 0.6) S.mem.glow = true; },
      steps: [
        { k: 'act', clip: ['P1', 'led1.A'], until: (S) => S.w('conn:P1~led1.A'), do: T('Clip pin 1 to the LED\'s long leg (+).', 'पिन 1 को एलईडी के लंबे पैर (+) से क्लिप कीजिए।', 'Pin 1 ko LED ke lambe pair (+) se clip kijiye.'), see: E },
        { k: 'act', clip: ['GND', 'led1.K'], until: (S) => S.w('conn:GND~led1.K'), do: T('Clip GND to the LED\'s short leg (−).', 'GND को एलईडी के छोटे पैर (−) से क्लिप कीजिए।', 'GND ko LED ke chhote pair (−) se clip kijiye.'), see: T('A micro:bit pin gives only a little current, so a small LED needs no resistor here.', 'micro:bit का पिन थोड़ा ही करंट देता है, इसलिए यहाँ छोटी एलईडी को रेज़िस्टर नहीं चाहिए।', 'micro:bit ka pin thoda hi current deta hai, isliye yahan chhoti LED ko resistor nahi chahiye.') },
        check(),
        info([5, 6, 8], T('write_digital(1) puts 3 V on pin 1: the LED lights. write_digital(0) makes it 0 V: off.', 'write_digital(1) पिन 1 पर 3 V देता है: एलईडी जलती है। write_digital(0) उसे 0 V करता है: बंद।', 'write_digital(1) pin 1 par 3 V deta hai: LED jalti hai. write_digital(0) use 0 V karta hai: band.')),
        run(),
        act((S) => S.w('lit:led1') && S.wv('light') < 50, T('Make it dark: Room light to 10%.', 'अँधेरा कीजिए: Room light 10%।', 'Andhera kijiye: Room light 10%.'), T('The lamp comes on.', 'लैंप जल जाता है।', 'Lamp jal jaata hai.')),
        act((S) => !S.w('lit:led1') && S.wv('light') > 100, T('Morning: Room light back to 75%.', 'सुबह: Room light वापस 75%।', 'Subah: Room light wapas 75%.'), T('Off by itself: no one forgets to switch it off.', 'अपने आप बंद: कोई बंद करना नहीं भूलता।', 'Apne aap band: koi band karna nahi bhoolta.')),
        edit((src) => /pin1\.write_analog\(\s*\d+\s*\)/.test(src), [[/pin1\.write_digital\(1\)/, 'pin1.write_analog(300)']],
          T('A gentle glow: change pin1.write_digital(1) to pin1.write_analog(300) (0 is off, 1023 is full), then Run.', 'हल्की रोशनी: pin1.write_digital(1) को pin1.write_analog(300) कीजिए (0 बंद, 1023 पूरी), फिर "चलाइए"।', 'Halki roshni: pin1.write_digital(1) ko pin1.write_analog(300) karo (0 band, 1023 poori), phir Run.')),
        act((S) => !!M(S).glow, T('Make it dark again.', 'फिर से अँधेरा कीजिए।', 'Phir se andhera kijiye.'), T('Dimmer: the pin switches on and off very fast, on for 300 parts in 1023. It saves battery and doesn\'t dazzle sleepy eyes.', 'धीमी: पिन बहुत तेज़ी से चालू-बंद होता है, 1023 में से 300 हिस्से चालू। बैटरी बचती है और नींद भरी आँखें नहीं चौंधियातीं।', 'Dheemi: pin bahut tezi se on-off hota hai, 1023 mein se 300 hisse on. Battery bachti hai aur neend bhari aankhein nahi chaundhiyati.')),
      ],
      check: [noShort, (S) => (S.w('conn:P1~led1.K') && S.w('conn:GND~led1.A') ? [X.swapLed] : null), clipNeed('P1', 'led1.A', 'pin 1', T('the LED\'s long leg (+)', 'एलईडी का लंबा पैर (+)', 'LED ka lamba pair (+)')), clipNeed('GND', 'led1.K', 'GND', T('the LED\'s short leg (−)', 'एलईडी का छोटा पैर (−)', 'LED ka chhota pair (−)'))],
      done: (S) => !!M(S).glow },
    // 12 -----------------------------------------------------------------------------------------------------------
    { id: 'mbthirst', view: 'mbwide', code: THIRST, drawer: [], serial: true,
      title: T('Plant thirst alarm: soil moisture and LED screen', 'पौधे की प्यास का अलार्म: मिट्टी की नमी और एलईडी स्क्रीन', 'Paudhe ki pyaas ka alarm: mitti ki nami aur LED screen'),
      goal: T('Two nails in a pot measure how wet the soil is; the screen shows it as a bar, and a dry plant beeps for water.', 'गमले में दो कीलें मिट्टी की नमी नापती हैं; स्क्रीन उसे बार में दिखाती है, और सूखा पौधा पानी के लिए बीप करता है।', 'Gamle mein do keelein mitti ki nami naapti hain; screen use bar mein dikhati hai, aur sookha paudha paani ke liye beep karta hai.'),
      world: world({ scene: 'plant', parts: [{ tag: 'soil', type: 'soil', m: 0.5 }], dry: 0.03, battery: false, controls: ['water'], hud: ['soil'], cx: -10, title: T('Thirst alarm', 'प्यास अलार्म', 'Pyaas alarm') }),
      setup: { parts: [], wires: [] },
      tick: (S) => { const a = (S.wv('analog') || {}).P0; if (has(S, /^WATER ME$/)) S.memRun.dry = true; if (S.memRun.dry && a > 600) S.memRun.wet = true;
        if (ran(S, /moisture < 500/) && has(S, /^WATER ME$/) && a >= 400 && a < 500) S.mem.early = true; },
      steps: [
        { k: 'act', clip: ['3V', 'soil.N1'], until: (S) => S.w('conn:3V~soil.N1'), do: T('Clip 3V to the left nail.', '3V को बाईं कील से क्लिप कीजिए।', '3V ko left keel se clip kijiye.'), see: E },
        { k: 'act', clip: ['P0', 'soil.N2'], until: (S) => S.w('conn:P0~soil.N2'), do: T('Clip pin 0 to the right nail.', 'पिन 0 को दाईं कील से क्लिप कीजिए।', 'Pin 0 ko right keel se clip kijiye.'), see: T('Wet soil lets more electricity through: pin 0 reads a higher number.', 'गीली मिट्टी ज़्यादा बिजली जाने देती है: पिन 0 बड़ी संख्या पढ़ता है।', 'Geeli mitti zyada bijli jaane deti hai: pin 0 bada number padhta hai.') },
        check(),
        info([7, 9, 10, 11, 12, 13], T('read_analog() gives 0 to 1023. moisture * 5 // 1024 turns it into 0 to 5 rows of the bar.', 'read_analog() 0 से 1023 देता है। moisture * 5 // 1024 उसे बार की 0 से 5 पंक्तियों में बदलता है।', 'read_analog() 0 se 1023 deta hai. moisture * 5 // 1024 use bar ki 0 se 5 rows mein badalta hai.')),
        run(),
        watch((S) => !!R(S).dry, T('Watch the soil dry out: the bar goes down.', 'मिट्टी सूखते देखिए: बार नीचे जाता है।', 'Mitti sookhte dekhiye: bar neeche jaata hai.'), T('Below 400: beep, WATER ME.', '400 से नीचे: बीप, WATER ME।', '400 se neeche: beep, WATER ME.')),
        act((S) => !!R(S).wet, T('Water the plant: tap the pot or press "Water the plant".', 'पौधे को पानी दीजिए: गमले को छूइए या "पौधे को पानी दीजिए" दबाइए।', 'Paudhe ko paani dijiye: gamle ko chhuiye ya "Paudhe ko paani dijiye" dabaiye.'), T('The bar jumps up; the plant is quiet again.', 'बार ऊपर उछलता है; पौधा फिर शांत।', 'Bar upar uchhalta hai; paudha phir shaant.')),
        edit((src) => /moisture < 500/.test(src), [[/moisture < 400/, 'moisture < 500']],
          T('A thirstier plant (tulsi likes moist soil): change moisture < 400 to moisture < 500, then Run.', 'ज़्यादा प्यासा पौधा (तुलसी को नम मिट्टी पसंद है): moisture < 400 को moisture < 500 कीजिए, फिर "चलाइए"।', 'Zyada pyaasa paudha (tulsi ko nam mitti pasand hai): moisture < 400 ko moisture < 500 karo, phir Run.')),
        watch((S) => !!M(S).early, T('Watch it dry again.', 'फिर सूखते देखिए।', 'Phir sookhte dekhiye.'), T('It asks for water sooner now. Each plant needs its own limit: a cactus would want a much lower one.', 'अब यह जल्दी पानी माँगता है। हर पौधे की अपनी सीमा होती है: कैक्टस को बहुत कम चाहिए।', 'Ab yeh jaldi paani maangta hai. Har paudhe ki apni seema hoti hai: cactus ko bahut kam chahiye.')),
      ],
      check: [noShort, clipNeed('3V', 'soil.N1', '3V', T('the left nail', 'बाईं कील', 'left keel')), clipNeed('P0', 'soil.N2', 'pin 0', T('the right nail', 'दाईं कील', 'right keel'))],
      done: (S) => !!M(S).early },
    // 13 -----------------------------------------------------------------------------------------------------------
    { id: 'mbguitar', view: 'mb', code: GUITAR, drawer: [],
      title: T('Guitar from the accelerometer', 'एक्सेलेरोमीटर वाला गिटार', 'Accelerometer wala guitar'),
      goal: T('An air guitar: press A to play, tilt the board to bend the note higher or lower.', 'हवा वाला गिटार: बजाने के लिए A दबाइए, सुर ऊँचा-नीचा करने के लिए बोर्ड झुकाइए।', 'Hawa wala guitar: bajaane ke liye A dabaiye, sur ooncha-neecha karne ke liye board jhukaiye.'),
      world: world({ scene: 'desk', controls: ['A', 'tilt', 'phone'], hud: ['acc'], title: T('Air guitar', 'हवा वाला गिटार', 'Hawa wala guitar') }),
      setup: { parts: [], wires: [] },
      tick: (S) => { const f = S.wv('tone') || 0; if (!f) return; const x = (S.app.world.boards[0].accel(S.app.world.now) || [0])[0]; const m = S.memRun;
        if (Math.abs(x) < 200) m.mid = f; else if (x > 500) m.hi = Math.max(m.hi || 0, f); else if (x < -500) m.lo = Math.min(m.lo || 1e9, f);
        if (ran(S, /x \/\/ 2\b/) && f > 800) S.mem.wide = true; },
      steps: [
        info([7, 8], T('get_x() is 0 when flat, up to about +1000 leaning right and −1000 leaning left. 440 + x // 4 turns that into a note from about 230 to 650 hertz (vibrations a second); 440 is the note A.', 'सीधा हो तो get_x() 0, दाएँ झुके तो लगभग +1000, बाएँ झुके तो −1000। 440 + x // 4 इसे लगभग 230 से 650 हर्ट्ज़ (प्रति सेकंड कंपन) के सुर में बदलता है; 440 सुर A है।', 'Seedha ho to get_x() 0, right jhuke to lagbhag +1000, left jhuke to −1000. 440 + x // 4 ise lagbhag 230 se 650 hertz (vibrations per second) ke sur mein badalta hai; 440 sur A hai.')),
        run(),
        act((S) => (R(S).mid || 0) > 400 && R(S).mid < 480, T('Hold it flat and press A.', 'इसे सीधा पकड़िए और A दबाइए।', 'Ise seedha pakdiye aur A dabaiye.'), T('440: the note A, the one orchestras tune to.', '440: सुर A, जिस पर ऑर्केस्ट्रा अपने साज़ मिलाते हैं।', '440: sur A, jis par orchestra apne saaz milaate hain.')),
        act((S) => (R(S).hi || 0) > 600, T('Lean it right ("Hold it": right) and press A.', 'दाएँ झुकाइए ("ऐसे पकड़िए": दाएँ) और A दबाइए।', 'Right jhukaiye ("Aise pakdiye": right) aur A dabaiye.'), T('Higher.', 'ऊँचा।', 'Ooncha.')),
        act((S) => (R(S).lo || 1e9) < 300, T('Lean it left and press A.', 'बाएँ झुकाइए और A दबाइए।', 'Left jhukaiye aur A dabaiye.'), T('Lower. Your tilt is the guitar\'s neck.', 'नीचा। आपका झुकाना गिटार की गर्दन है।', 'Neecha. Aapka jhukana guitar ki gardan hai.')),
        edit((src) => /440 \+ x \/\/ 2\b/.test(src), [[/440 \+ x \/\/ 4/, '440 + x // 2']],
          T('A bigger range: change x // 4 to x // 2, then Run.', 'बड़ी रेंज: x // 4 को x // 2 कीजिए, फिर "चलाइए"।', 'Badi range: x // 4 ko x // 2 karo, phir Run.')),
        act((S) => !!M(S).wide, T('Lean it right and play.', 'दाएँ झुकाकर बजाइए।', 'Right jhuka kar bajaiye.'), T('Over 800 hertz now: dividing by a smaller number makes each tilt count for more.', 'अब 800 हर्ट्ज़ से ऊपर: छोटी संख्या से भाग देने पर हर झुकाव ज़्यादा असर करता है।', 'Ab 800 hertz se upar: chhote number se divide karne par har jhukaav zyada asar karta hai.')),
      ],
      done: (S) => !!M(S).wide },
    // 14 -----------------------------------------------------------------------------------------------------------
    { id: 'mbstride', view: 'mb', code: STEPS, drawer: [],
      title: T('Distance calculator (step length)', 'दूरी कैलकुलेटर (कदम की लंबाई)', 'Distance calculator (kadam ki lambai)'),
      goal: T('Count your steps and turn them into metres walked; then put in your own step length.', 'अपने कदम गिनिए और उन्हें चली गई दूरी (मीटर) में बदलिए; फिर अपने कदम की लंबाई डालिए।', 'Apne kadam giniye aur unhe chali gayi doori (metre) mein badaliye; phir apne kadam ki lambai daaliye.'),
      world: world({ scene: 'watch', controls: ['shake', 'A'], hud: ['shakes'], title: T('Distance walked', 'चली गई दूरी', 'Chali gayi doori') }),
      setup: { parts: [], wires: [] },
      tick: (S) => { if (ran(S, /STEP_LENGTH = 0\.5\b/) && has(S, /^\d+\.\d+$/)) { const t = texts(S).filter((x) => /^\d+\.\d+$/.test(x)).pop(); if (Math.abs(+t * 2 - Math.round(+t * 2)) < 0.01 && +t > 0) S.mem.mine = true; } },
      steps: [
        info([5], T('STEP_LENGTH is how far one step takes you. Measure yours: walk 10 steps, measure with a tape, divide by 10.', 'STEP_LENGTH एक कदम की दूरी है। अपना नापिए: 10 कदम चलिए, फ़ीते से नापिए, 10 से भाग दीजिए।', 'STEP_LENGTH ek kadam ki doori hai. Apna naapiye: 10 kadam chaliye, feete se naapiye, 10 se divide kijiye.')),
        run(),
        act((S) => has(S, /^3\.0$/), T('Walk 5 steps (shake 5 times), then press A.', '5 कदम चलिए (5 बार हिलाइए), फिर A दबाइए।', '5 kadam chaliye (5 baar hilaiye), phir A dabaiye.'), T('5 × 0.6 = 3.0 metres.', '5 × 0.6 = 3.0 मीटर।', '5 × 0.6 = 3.0 metre.')),
        edit((src) => /STEP_LENGTH = 0\.5\b/.test(src), [[/STEP_LENGTH = 0\.6/, 'STEP_LENGTH = 0.5']],
          T('Your own step: a Class 4 student\'s step is often about half a metre. Change 0.6 to 0.5, then Run.', 'अपना कदम: कक्षा 4 के बच्चे का कदम अक्सर लगभग आधा मीटर होता है। 0.6 को 0.5 कीजिए, फिर "चलाइए"।', 'Apna kadam: Class 4 ke bachche ka kadam aksar lagbhag aadha metre hota hai. 0.6 ko 0.5 karo, phir Run.')),
        act((S) => !!M(S).mine, T('Walk 4 steps and press A.', '4 कदम चलिए और A दबाइए।', '4 kadam chaliye aur A dabaiye.'), T('4 × 0.5 = 2.0 metres. Walk round the school ground and work out how big it is!', '4 × 0.5 = 2.0 मीटर। स्कूल के मैदान का चक्कर लगाइए और पता कीजिए कि वह कितना बड़ा है!', '4 × 0.5 = 2.0 metre. School ground ka chakkar lagaiye aur pata kijiye ki woh kitna bada hai!')),
      ],
      done: (S) => !!M(S).mine },
    // 15 -----------------------------------------------------------------------------------------------------------
    { id: 'mbkick', view: 'mb', code: KICK, drawer: [], serial: true,
      title: T('Kick strength data logger', 'किक की ताक़त का डेटा लॉगर', 'Kick strength data logger'),
      goal: T('Strap the micro:bit to a shoe, log every kick\'s strength to the Serial Monitor, and keep the best one.', 'micro:bit को जूते पर बाँधिए, हर किक की ताक़त सीरियल मॉनिटर पर लिखिए, और सबसे अच्छी याद रखिए।', 'micro:bit ko joote par baandhiye, har kick ki taaqat Serial Monitor par likhiye, aur sabse achhi yaad rakhiye.'),
      world: world({ scene: 'desk', controls: ['shake', 'A'], hud: ['acc'], title: T('Kick logger', 'किक लॉगर', 'Kick logger') }),
      setup: { parts: [], wires: [] },
      tick: (S) => { if (ran(S, /best \/ 1000/) && has(S, /^\d\.\d+$/)) S.mem.g = true; },
      steps: [
        info([6, 7], T('get_strength() is how hard the board is being pushed, in milli-g: about 1000 standing still (gravity), much more in a kick.', 'get_strength() बताता है बोर्ड पर कितना ज़ोर लग रहा है, milli-g में: रुके रहने पर लगभग 1000 (गुरुत्व), किक में बहुत ज़्यादा।', 'get_strength() batata hai board par kitna zor lag raha hai, milli-g mein: ruke rehne par lagbhag 1000 (gravity), kick mein bahut zyada.')),
        info([8, 10, 11], T('print() logs each kick to the Serial Monitor, a record you can copy into a spreadsheet. best keeps the biggest.', 'print() हर किक को सीरियल मॉनिटर पर लिखता है, ऐसा रिकॉर्ड जिसे स्प्रेडशीट में कॉपी कर सकते हैं। best सबसे बड़ी रखता है।', 'print() har kick ko Serial Monitor par likhta hai, aisa record jise spreadsheet mein copy kar sakte ho. best sabse badi rakhta hai.')),
        run(),
        act((S) => (S.nums || []).some((v) => v > 1500), T('Kick! (press "Shake it")', 'किक! ("हिलाइए" दबाइए)', 'Kick! ("Hilaiye" dabaiye)'), T('A tick, and a number in the Serial Monitor.', 'एक टिक, और सीरियल मॉनिटर में एक संख्या।', 'Ek tick, aur Serial Monitor mein ek number.')),
        act((S) => (S.nums || []).filter((v) => v > 1500).length >= 3 && S.w('scrolled'), T('Kick twice more, then press A for your best.', 'दो बार और किक कीजिए, फिर अपनी सबसे अच्छी के लिए A दबाइए।', 'Do baar aur kick kijiye, phir apni sabse achhi ke liye A dabaiye.'), T('Your best kick. Compare left foot and right foot!', 'आपकी सबसे अच्छी किक। बायाँ और दायाँ पैर मिलाइए!', 'Aapki sabse achhi kick. Left aur right pair milaiye!')),
        edit((src) => /display\.scroll\(\s*best \/ 1000\s*\)/.test(src), [[/display\.scroll\(best\)/, 'display.scroll(best / 1000)']],
          T('Show it in g: change display.scroll(best) to display.scroll(best / 1000), then Run.', 'इसे g में दिखाइए: display.scroll(best) को display.scroll(best / 1000) कीजिए, फिर "चलाइए"।', 'Ise g mein dikhaiye: display.scroll(best) ko display.scroll(best / 1000) karo, phir Run.')),
        act((S) => !!M(S).g, T('Kick, then press A.', 'किक कीजिए, फिर A दबाइए।', 'Kick kijiye, phir A dabaiye.'), T('2.5 g means two and a half times the pull of gravity. Fighter pilots feel up to 9 g.', '2.5 g यानी गुरुत्व के खिंचाव का ढाई गुना। लड़ाकू पायलट 9 g तक महसूस करते हैं।', '2.5 g matlab gravity ke khinchav ka dhaai guna. Fighter pilot 9 g tak mehsoos karte hain.')),
      ],
      done: (S) => !!M(S).g },
    // 16 -----------------------------------------------------------------------------------------------------------
    { id: 'mbtraffic', view: 'mb', code: TRAFFIC, drawer: [], serial: true,
      title: T('Traffic survey data logger', 'ट्रैफ़िक सर्वे डेटा लॉगर', 'Traffic survey data logger'),
      goal: T('Count cars, bikes and people walking at the school gate, and log the counts as data you can graph.', 'स्कूल गेट पर कारें, बाइक और पैदल लोग गिनिए, और गिनती को ऐसे डेटा में लिखिए जिसका ग्राफ़ बन सके।', 'School gate par cars, bikes aur paidal log giniye, aur ginti ko aise data mein likhiye jiska graph ban sake.'),
      world: world({ scene: 'desk', controls: ['A', 'B', 'logo', 'shake'], hud: ['buttons'], title: T('Traffic survey', 'ट्रैफ़िक सर्वे', 'Traffic survey') }),
      setup: { parts: [], wires: [] },
      tick: (S) => { if (ran(S, /print\(cars, bikes, walkers\)/) && (S.serLines || []).some((l) => /^\d+ \d+ \d+$/.test(l.trim()))) S.mem.log = true; },
      steps: [
        info([7, 8, 9, 10, 11, 12, 13, 14, 15], T('Three counters, one for each kind of traveller. Each press adds one and shows the new count.', 'तीन गिनती, हर तरह के यात्री के लिए एक। हर दबाना एक जोड़ता है और नई गिनती दिखाता है।', 'Teen ginti, har tarah ke yatri ke liye ek. Har dabana ek jodta hai aur nayi ginti dikhata hai.')),
        run(),
        act((S) => has(S, /^C3 B2 W1$/), T('At the gate: 3 cars (A, A, A), 2 bikes (B, B), 1 person walking (logo). Then shake for the totals.', 'गेट पर: 3 कारें (A, A, A), 2 बाइक (B, B), 1 पैदल (लोगो)। फिर कुल के लिए हिलाइए।', 'Gate par: 3 cars (A, A, A), 2 bikes (B, B), 1 paidal (logo). Phir total ke liye hilaiye.'), T('C3 B2 W1. Traffic police and town planners count like this before they build a crossing.', 'C3 B2 W1। ट्रैफ़िक पुलिस और शहर योजनाकार ज़ेबरा क्रॉसिंग बनाने से पहले ऐसे ही गिनते हैं।', 'C3 B2 W1. Traffic police aur town planners zebra crossing banane se pehle aise hi ginte hain.')),
        edit((src) => /print\(cars, bikes, walkers\)/.test(src), [[/(        display\.scroll\("C" \+ str\(cars\)[^\n]*\n)/, '$1        print(cars, bikes, walkers)\n']],
          T('Log the data: under the display.scroll line add\n        print(cars, bikes, walkers)\nthen Run.', 'डेटा लिखिए: display.scroll वाली लाइन के नीचे लिखिए\n        print(cars, bikes, walkers)\nफिर "चलाइए"।', 'Data likhiye: display.scroll wali line ke neeche likhiye\n        print(cars, bikes, walkers)\nphir Run.')),
        act((S) => !!M(S).log, T('Count a few again, then shake.', 'फिर कुछ गिनिए, फिर हिलाइए।', 'Phir kuch giniye, phir hilaiye.'), T('The Serial Monitor shows the three numbers. Shake every 5 minutes and you get a table: how traffic changes through the morning.', 'सीरियल मॉनिटर तीनों संख्याएँ दिखाता है। हर 5 मिनट पर हिलाइए और एक तालिका बनेगी: सुबह भर ट्रैफ़िक कैसे बदलता है।', 'Serial Monitor teeno numbers dikhata hai. Har 5 minute par hilaiye aur ek table banegi: subah bhar traffic kaise badalta hai.')),
      ],
      done: (S) => !!M(S).log },
    // 17 -----------------------------------------------------------------------------------------------------------
    { id: 'mbtreasure', view: 'mb', code: TREASURE, drawer: [],
      title: T('Treasure hunt with headings: compass and LED screen', 'दिशाओं से ख़ज़ाने की खोज: कंपास और एलईडी स्क्रीन', 'Dishaon se khazane ki khoj: compass aur LED screen'),
      goal: T('The treasure is at 135° (south-east): the compass guides you with arrows until you face it.', 'ख़ज़ाना 135° (दक्षिण-पूर्व) पर है: कंपास तीरों से आपको राह दिखाता है जब तक आप उसकी ओर न हों।', 'Khazana 135° (dakshin-poorv) par hai: compass teeron se aapko raah dikhata hai jab tak aap uski taraf na ho.'),
      world: world({ scene: 'compass', controls: ['heading', 'calib', 'tilt'], hud: ['compass', 'acc'], title: T('Treasure hunt', 'ख़ज़ाने की खोज', 'Khazane ki khoj') }),
      setup: { parts: [], wires: [] },
      tick: (S) => { const h = S.wv('heading'); if (ran(S, /TARGET = 270/) && img(S) === 'YES' && h >= 255 && h <= 285) S.mem.west = true; },
      steps: [
        info([7], T('diff is how far you must turn: + means turn right, − means turn left. The % 360 sum makes 350° and 10° count as only 20° apart.', 'diff बताता है कितना घूमना है: + यानी दाएँ, − यानी बाएँ। % 360 वाला हिसाब 350° और 10° को सिर्फ़ 20° दूर गिनता है।', 'diff batata hai kitna ghoomna hai: + matlab right, − matlab left. % 360 wala hisaab 350° aur 10° ko sirf 20° door ginta hai.')),
        run(T('First it asks you to calibrate: TILT TO FILL SCREEN.', 'पहले यह कैलिब्रेट करने को कहता है: TILT TO FILL SCREEN।', 'Pehle yeh calibrate karne ko kehta hai: TILT TO FILL SCREEN.')),
        act((S) => S.w('calibrated'), T('Tilt the board round until all 25 LEDs are lit, or press "Tilt it around for me".', 'बोर्ड को गोल-गोल झुकाइए जब तक सारी 25 एलईडी न जलें, या "मेरे लिए चारों ओर झुकाइए" दबाइए।', 'Board ko gol-gol jhukaiye jab tak saari 25 LEDs na jalein, ya "Mere liye chaaron taraf jhukaiye" dabaiye.')),
        act((S) => img(S) === 'ARROW_E' && S.wv('heading') < 100, T('Face north-east: slide "Turn the board" to 40°.', 'उत्तर-पूर्व की ओर मुँह कीजिए: "बोर्ड घुमाइए" को 40° कीजिए।', 'Uttar-poorv ki taraf munh kijiye: "Board ghumaiye" ko 40° kijiye.'), T('An arrow: turn right.', 'तीर: दाएँ घूमिए।', 'Teer: right ghoomiye.')),
        act((S) => img(S) === 'YES', T('Turn right until the tick comes (about 135°).', 'टिक आने तक दाएँ घूमिए (लगभग 135°)।', 'Tick aane tak right ghoomiye (lagbhag 135°).'), T('Found! Within 15° counts as facing it.', 'मिल गया! 15° के अंदर यानी उसकी ओर।', 'Mil gaya! 15° ke andar matlab uski taraf.')),
        edit((src) => /TARGET = 270\b/.test(src), [[/TARGET = 135/, 'TARGET = 270']],
          T('Hide the next treasure in the west: change TARGET = 135 to TARGET = 270, then Run.', 'अगला ख़ज़ाना पश्चिम में छिपाइए: TARGET = 135 को TARGET = 270 कीजिए, फिर "चलाइए"।', 'Agla khazana paschim mein chhupaiye: TARGET = 135 ko TARGET = 270 karo, phir Run.')),
        act((S) => !!M(S).west, T('Find it: turn to 270°.', 'इसे ढूँढिए: 270° की ओर घूमिए।', 'Ise dhoondhiye: 270° ki taraf ghoomiye.'), T('West. Scouts and sailors find their way with headings like these.', 'पश्चिम। स्काउट और नाविक ऐसी ही दिशाओं से रास्ता ढूँढते हैं।', 'Paschim. Scouts aur sailors aisi hi dishaon se raasta dhoondhte hain.')),
      ],
      done: (S) => !!M(S).west },
    // 18 -----------------------------------------------------------------------------------------------------------
    { id: 'mbgates', view: 'mb', code: GATES, drawer: [],
      title: T('Timing gates for a toy car', 'खिलौना कार के लिए टाइमिंग गेट', 'Toy car ke liye timing gates'),
      goal: T('Two touch gates measure how long a toy car takes between them; the micro:bit works out its speed.', 'दो टच गेट नापते हैं कि खिलौना कार उनके बीच कितना समय लेती है; micro:bit उसकी रफ़्तार निकालता है।', 'Do touch gates naapte hain ki toy car unke beech kitna time leti hai; micro:bit uski speed nikaalta hai.'),
      world: world({ scene: 'desk', controls: ['P0', 'P1'], hud: [], title: T('Timing gates', 'टाइमिंग गेट', 'Timing gates') }),
      setup: { parts: [], wires: [] },
      tick: (S) => { if (ran(S, /GAP = 100\b/) && texts(S).some((t) => { const m = /^(\d+) CM\/S$/.exec(t); return m && +m[1] >= 90 && +m[1] <= 110; })) S.mem.gap = true; },
      steps: [
        info([1, 6, 9], T('Each gate is a strip of foil on pin 0 or pin 1, and the car drags a foil tail joined to GND: crossing a gate joins them, so is_touched() becomes True.', 'हर गेट पिन 0 या पिन 1 पर फ़ॉइल की पट्टी है, और कार GND से जुड़ी फ़ॉइल की पूँछ घसीटती है: गेट पार करते ही दोनों जुड़ते हैं और is_touched() True हो जाता है।', 'Har gate pin 0 ya pin 1 par foil ki patti hai, aur car GND se judi foil ki poonchh ghaseetti hai: gate paar karte hi dono judte hain aur is_touched() True ho jaata hai.')),
        info([11, 12], T('speed = distance ÷ time. The time is in milliseconds, so GAP * 1000 // ms gives centimetres per second.', 'रफ़्तार = दूरी ÷ समय। समय मिलीसेकंड में है, इसलिए GAP * 1000 // ms सेंटीमीटर प्रति सेकंड देता है।', 'Speed = doori ÷ time. Time milliseconds mein hai, isliye GAP * 1000 // ms centimetre per second deta hai.')),
        run(),
        act((S) => has(S, /^(4[5-9]|5[0-5]) CM\/S$/), T('The car crosses gate 1: press "Touch pin 0". One second later it crosses gate 2: "Touch pin 1".', 'कार गेट 1 पार करती है: "पिन 0 छूइए" दबाइए। एक सेकंड बाद गेट 2: "पिन 1 छूइए"।', 'Car gate 1 paar karti hai: "Pin 0 touch karo" dabaiye. Ek second baad gate 2: "Pin 1 touch karo".'), T('50 cm in 1 second: 50 CM/S.', '1 सेकंड में 50 cm: 50 CM/S।', '1 second mein 50 cm: 50 CM/S.')),
        act((S) => texts(S).some((t) => { const m = /^(\d+) CM\/S$/.exec(t); return m && +m[1] >= 90; }), T('A faster push: gate 2 only half a second after gate 1.', 'तेज़ धक्का: गेट 1 के सिर्फ़ आधे सेकंड बाद गेट 2।', 'Tez dhakka: gate 1 ke sirf aadhe second baad gate 2.'), T('Half the time, twice the speed: about 100 CM/S.', 'आधा समय, दोगुनी रफ़्तार: लगभग 100 CM/S।', 'Aadha time, do-guni speed: lagbhag 100 CM/S.')),
        edit((src) => /GAP = 100\b/.test(src), [[/GAP = 50/, 'GAP = 100']],
          T('Move the gates a metre apart: change GAP = 50 to GAP = 100, then Run.', 'गेट एक मीटर दूर रखिए: GAP = 50 को GAP = 100 कीजिए, फिर "चलाइए"।', 'Gates ek metre door rakhiye: GAP = 50 ko GAP = 100 karo, phir Run.')),
        act((S) => !!M(S).gap, T('Gate 1, then gate 2 one second later.', 'गेट 1, फिर एक सेकंड बाद गेट 2।', 'Gate 1, phir ek second baad gate 2.'), T('100 cm in 1 second: 100 CM/S. Race your toy cars down a ramp: does a steeper ramp make them faster?', '1 सेकंड में 100 cm: 100 CM/S। ढलान से अपनी खिलौना कारें दौड़ाइए: क्या ज़्यादा ढलान से वे तेज़ होती हैं?', '1 second mein 100 cm: 100 CM/S. Dhalaan se apni toy cars daudaiye: kya zyada dhalaan se woh tez hoti hain?')),
      ],
      done: (S) => !!M(S).gap },
    // 19 -----------------------------------------------------------------------------------------------------------
    { id: 'mbbalance', view: 'mb', code: BALANCE, drawer: [],
      title: T('Digital balance (tilt)', 'डिजिटल तराज़ू (झुकाव)', 'Digital taraazu (jhukaav)'),
      goal: T('A balance like a see-saw: a dot shows which side is heavier and sits in the middle when both sides match.', 'सी-सॉ जैसा तराज़ू: एक बिंदु बताता है कौन-सी तरफ़ भारी है और दोनों बराबर हों तो बीच में रहता है।', 'See-saw jaisa taraazu: ek bindu batata hai kaun si taraf bhaari hai aur dono barabar hon to beech mein rehta hai.'),
      world: world({ scene: 'desk', controls: ['tilt', 'phone'], hud: ['acc'], title: T('Digital balance', 'डिजिटल तराज़ू', 'Digital taraazu') }),
      setup: { parts: [], wires: [] },
      tick: (S) => { const p = [...(S.wv('shown') || [])]; const c = [0, 1, 2, 3, 4].find((x) => p[10 + x] === 9); const m = S.memRun; if (c !== undefined) (m.cols || (m.cols = new Set())).add(c); if (ran(S, /Image\.YES/) && img(S) === 'YES') S.mem.ok = true; },
      steps: [
        info([7, 8], T('x / 300 turns the tilt into a step left or right of the middle column (2); int() drops the part after the point. max and min keep the dot between columns 0 and 4.', 'x / 300 झुकाव को बीच वाले कॉलम (2) से बाएँ या दाएँ के कदम में बदलता है; int() दशमलव के बाद का हिस्सा हटाता है। max और min बिंदु को कॉलम 0 और 4 के बीच रखते हैं।', 'x / 300 jhukaav ko beech wale column (2) se left ya right ke kadam mein badalta hai; int() decimal ke baad ka hissa hatata hai. max aur min bindu ko column 0 aur 4 ke beech rakhte hain.')),
        run(),
        act((S) => (R(S).cols || new Set()).has(4), T('Put a weight on the right: lean it right ("Hold it": right).', 'दाईं तरफ़ वज़न रखिए: इसे दाईं ओर झुकाइए ("ऐसे पकड़िए": दाएँ)।', 'Right taraf wazan rakhiye: ise right jhukaiye ("Aise pakdiye": right).'), T('The dot runs to the heavy side.', 'बिंदु भारी तरफ़ भागता है।', 'Bindu bhaari taraf bhaagta hai.')),
        act((S) => (R(S).cols || new Set()).has(0), T('Now the left side is heavier: lean it left.', 'अब बाईं तरफ़ भारी है: बाईं ओर झुकाइए।', 'Ab left taraf bhaari hai: left jhukaiye.')),
        act((S) => { const p = [...(S.wv('shown') || [])]; return p[12] === 9; }, T('Balance it: hold it flat.', 'संतुलित कीजिए: सीधा पकड़िए।', 'Santulit kijiye: seedha pakdiye.'), T('In the middle: both sides weigh the same. Old shop scales (taraazu) work like this.', 'बीच में: दोनों तरफ़ बराबर वज़न। पुराने दुकान के तराज़ू ऐसे ही काम करते हैं।', 'Beech mein: dono taraf barabar wazan. Purane dukaan ke taraazu aise hi kaam karte hain.')),
        edit((src) => /if col == 2:\s*\n\s+display\.show\(Image\.YES\)/.test(src), [[/(    display\.set_pixel\(col, 2, 9\)\n)/, '$1    if col == 2:\n        display.show(Image.YES)\n']],
          T('A clear "balanced" sign: under display.set_pixel(col, 2, 9) add\n    if col == 2:\n        display.show(Image.YES)\nthen Run.', 'साफ़ "संतुलित" निशान: display.set_pixel(col, 2, 9) के नीचे लिखिए\n    if col == 2:\n        display.show(Image.YES)\nफिर "चलाइए"।', 'Saaf "santulit" nishaan: display.set_pixel(col, 2, 9) ke neeche likhiye\n    if col == 2:\n        display.show(Image.YES)\nphir Run.')),
        act((S) => !!M(S).ok, T('Tilt it, then balance it again.', 'झुकाइए, फिर संतुलित कीजिए।', 'Jhukaiye, phir santulit kijiye.'), T('A tick when it balances: put coins on each end of a ruler and find out how many make it level.', 'संतुलित होने पर टिक: रूलर के दोनों सिरों पर सिक्के रखिए और पता कीजिए कितने से वह सीधा होता है।', 'Santulit hone par tick: ruler ke dono siron par sikke rakhiye aur pata kijiye kitne se woh seedha hota hai.')),
      ],
      done: (S) => !!M(S).ok },
    // 20 -----------------------------------------------------------------------------------------------------------
    { id: 'mbfireflies', view: 'mbtwo', code: FIREFLY, drawer: [],
      title: T('Fireflies by radio', 'रेडियो से जुगनू', 'Radio se jugnu'),
      goal: T('Two micro:bits flash at random times, then fall into step, the way fireflies in a tree flash together.', 'दो micro:bit बेतरतीब समय पर चमकते हैं, फिर एक साथ चमकने लगते हैं, जैसे पेड़ पर जुगनू साथ-साथ चमकते हैं।', 'Do micro:bits random samay par chamakte hain, phir ek saath chamakne lagte hain, jaise ped par jugnu saath-saath chamakte hain.'),
      world: world({ scene: 'rps', boards: 2, battery: true, controls: [], hud: ['radio'], title: T('Fireflies', 'जुगनू', 'Jugnu') }),
      setup: { parts: [], wires: [] },
      tick: (S) => { const m = S.memRun; const a = [...(S.wv('shown') || [])].every((v) => v > 0), b = S.wv('friendLit') === 25;
        if (a && !m.a) m.ta = S.t; if (b && !m.b) m.tb = S.t; m.a = a; m.b = b;
        if (a && b) { if (!m.both) { m.together = (m.together || 0) + 1; } m.both = true; } else if (!a && !b) m.both = false;
        if (m.ta !== undefined && m.tb !== undefined && Math.abs(m.ta - m.tb) > 0.35 && (a || b)) m.apart = true;
        if (ran(S, /clock \+= 20/) && (m.together || 0) >= 3) S.mem.fast = true; },
      steps: [
        info([11, 12, 14], T('clock counts up to 100 (about one second), then the board flashes and tells everyone with radio.send("F").', 'clock 100 तक गिनता है (लगभग एक सेकंड), फिर बोर्ड चमकता है और radio.send("F") से सबको बताता है।', 'clock 100 tak ginta hai (lagbhag ek second), phir board chamakta hai aur radio.send("F") se sabko batata hai.')),
        info([18, 19], T('Hearing a flash when it is more than halfway to its own flash moves the clock 10 steps forward: it catches up a little each time. (Hurrying all the time would keep the gap the same!)', 'अपनी चमक के आधे से ज़्यादा रास्ते पर हो और चमक सुने, तो clock 10 कदम आगे जाता है: हर बार थोड़ा पास आता है। (हमेशा जल्दी करने से फ़ासला वैसा ही रहता!)', 'Apni chamak ke aadhe se zyada raaste par ho aur chamak sune, to clock 10 kadam aage jaata hai: har baar thoda paas aata hai. (Hamesha jaldi karne se faasla waisa hi rehta!)')),
        run(T('Each board starts its clock at a random place: they flash at different times.', 'हर बोर्ड अपनी घड़ी बेतरतीब जगह से शुरू करता है: वे अलग-अलग समय पर चमकते हैं।', 'Har board apni ghadi random jagah se shuru karta hai: woh alag-alag samay par chamakte hain.')),
        watch((S) => (R(S).together || 0) >= 3, T('Watch both boards for a while.', 'दोनों बोर्ड थोड़ी देर देखिए।', 'Dono board thodi der dekhiye.'), T('In step! Nobody is in charge: each only hurries a little when it sees a flash. Fireflies in Southeast Asian mangroves do exactly this.', 'एक साथ! कोई मुखिया नहीं: हर एक चमक देखकर बस थोड़ा जल्दी करता है। दक्षिण-पूर्व एशिया के मैंग्रोव में जुगनू ठीक यही करते हैं।', 'Ek saath! Koi mukhiya nahi: har ek chamak dekhkar bas thoda jaldi karta hai. Dakshin-poorv Asia ke mangrove mein jugnu theek yahi karte hain.')),
        edit((src) => /clock \+= 20/.test(src), [[/clock \+= 10/, 'clock += 20']],
          T('A bigger nudge: change clock += 10 to clock += 20, then Run.', 'बड़ा धक्का: clock += 10 को clock += 20 कीजिए, फिर "चलाइए"।', 'Bada dhakka: clock += 10 ko clock += 20 karo, phir Run.')),
        watch((S) => !!M(S).fast, T('Watch them find each other again.', 'उन्हें फिर एक-दूसरे को पाते देखिए।', 'Unhe phir ek doosre ko paate dekhiye.'), T('A bigger nudge pulls them together faster. Heart cells and crowds clapping together follow the same rule.', 'बड़ा धक्का उन्हें जल्दी साथ लाता है। दिल की कोशिकाएँ और साथ ताली बजाती भीड़ भी यही नियम मानती हैं।', 'Bada dhakka unhe jaldi saath laata hai. Dil ki koshikaayein aur saath taali bajaati bheed bhi yahi niyam maanti hai.')),
      ],
      done: (S) => !!M(S).fast },
    // 21 -----------------------------------------------------------------------------------------------------------
    { id: 'mbburglar', view: 'mbwide', code: BURGLAR, drawer: [],
      title: T('Burglar alarm: motion sensor and tune on a buzzer', 'चोर अलार्म: मोशन सेंसर और बज़र पर धुन', 'Chor alarm: motion sensor aur buzzer par dhun'),
      goal: T('The micro:bit\'s motion sensor guards a drawer: arm it, and any movement plays an alarm on a buzzer clipped to pin 0.', 'micro:bit का मोशन सेंसर दराज़ की रखवाली करता है: इसे चालू कीजिए, और ज़रा-सी हरकत पर पिन 0 से क्लिप किए बज़र पर अलार्म बजता है।', 'micro:bit ka motion sensor daraaz ki rakhwali karta hai: ise chalu kijiye, aur zara si harkat par pin 0 se clip kiye buzzer par alarm bajta hai.'),
      world: world({ scene: 'desk', parts: [{ tag: 'bz1', type: 'buzzer' }], controls: ['A', 'shake'], hud: [], title: T('Burglar alarm', 'चोर अलार्म', 'Chor alarm') }),
      setup: { parts: [], wires: [] },
      tick: (S) => { const b = S.app.world.parts.bz1; if (b && b.state.on && img(S) === 'SKULL') { S.memRun.rang = true; if (ran(S, /range\(3\)/)) S.memRun.siren = (S.memRun.siren || 0) + 1; } const m = S.memRun; if (m.m0 === undefined) m.m0 = S.wv('music') || 0; if (ran(S, /range\(3\)/) && (S.wv('music') || 0) - m.m0 >= 3) S.mem.siren = true; },
      steps: [
        { k: 'act', clip: ['P0', 'bz1.P'], until: (S) => S.w('conn:P0~bz1.P'), do: T('Clip pin 0 to the buzzer\'s + (red) leg.', 'पिन 0 को बज़र के + (लाल) पैर से क्लिप कीजिए।', 'Pin 0 ko buzzer ke + (red) pair se clip kijiye.'), see: E },
        { k: 'act', clip: ['GND', 'bz1.N'], until: (S) => S.w('conn:GND~bz1.N'), do: T('Clip GND to its − (black) leg.', 'GND को उसके − (काले) पैर से क्लिप कीजिए।', 'GND ko uske − (kaale) pair se clip kijiye.'), see: T('music.play() sends the tune out on pin 0 as well as the speaker: a buzzer in a drawer is louder.', 'music.play() धुन को स्पीकर के साथ पिन 0 पर भी भेजता है: दराज़ में बज़र ज़्यादा ज़ोर से बजता है।', 'music.play() dhun ko speaker ke saath pin 0 par bhi bhejta hai: daraaz mein buzzer zyada zor se bajta hai.') },
        check(),
        info([6, 10, 13, 14, 17], T('armed is the alarm switch. After arming it waits a second and forgets that movement, so closing the drawer does not set it off.', 'armed अलार्म का स्विच है। चालू करने के बाद यह एक सेकंड रुककर वह हरकत भूल जाता है, ताकि दराज़ बंद करने से अलार्म न बजे।', 'armed alarm ka switch hai. Chalu karne ke baad yeh ek second rukkar woh harkat bhool jaata hai, taaki daraaz band karne se alarm na baje.')),
        run(),
        act((S) => img(S) === 'YES', T('Arm it: press A.', 'चालू कीजिए: A दबाइए।', 'Chalu kijiye: A dabaiye.')),
        act((S) => !!R(S).rang, T('A thief opens the drawer: press "Shake it".', 'चोर दराज़ खोलता है: "हिलाइए" दबाइए।', 'Chor daraaz kholta hai: "Hilaiye" dabaiye.'), T('Skull and alarm! The accelerometer felt the drawer move.', 'खोपड़ी और अलार्म! एक्सेलेरोमीटर ने दराज़ की हरकत महसूस की।', 'Khopdi aur alarm! Accelerometer ne daraaz ki harkat mehsoos ki.')),
        act((S) => img(S) === 'NO', T('It is only you: press A to disarm.', 'यह आप ही हैं: बंद करने के लिए A दबाइए।', 'Yeh aap hi ho: band karne ke liye A dabaiye.')),
        edit((src) => /for i in range\(3\):\s*\n\s+music\.play\(music\.POWER_DOWN\)/.test(src), [[/        music\.play\(music\.POWER_DOWN\)[^\n]*\n/, '        for i in range(3):\n            music.play(music.POWER_DOWN)\n']],
          T('A longer alarm: change the music.play line to play three times:\n        for i in range(3):\n            music.play(music.POWER_DOWN)\nthen Run.', 'लंबा अलार्म: music.play वाली लाइन को तीन बार बजने वाला बनाइए:\n        for i in range(3):\n            music.play(music.POWER_DOWN)\nफिर "चलाइए"।', 'Lamba alarm: music.play wali line ko teen baar bajne wala banaiye:\n        for i in range(3):\n            music.play(music.POWER_DOWN)\nphir Run.')),
        act((S) => !!M(S).siren, T('Arm it (A), then move it (shake).', 'चालू कीजिए (A), फिर हिलाइए।', 'Chalu kijiye (A), phir hilaiye.'), T('Three times now: harder for a thief to ignore.', 'अब तीन बार: चोर के लिए अनसुना करना मुश्किल।', 'Ab teen baar: chor ke liye ansuna karna mushkil.')),
      ],
      check: [noShort, clipNeed('P0', 'bz1.P', 'pin 0', T('the buzzer\'s + leg', 'बज़र का + पैर', 'buzzer ka + pair')), clipNeed('GND', 'bz1.N', 'GND', T('the buzzer\'s − leg', 'बज़र का − पैर', 'buzzer ka − pair'))],
      done: (S) => !!M(S).siren },
  ];
  L.forEach((l, i) => { l.n = n0 + i + 1; l.lang = 'py'; l.batch = 9; l.cls = '4'; });
  return L;
}
