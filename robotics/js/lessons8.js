// DUET Robotics Lab 360, batch 8: micro:bit projects for Class 3 (Python, or blocks). No wires: the board's own buttons,
// logo, display, speaker, microphone, light sensing, accelerometer, and pin 0 as a touch pad. Each is a small game or
// gadget from the classic school list (dice, stopwatch, noise meter, pet hamster…), written fresh for DUET.
// Steps ask what really happened on the board (MBCore flag / val); a lesson's tick() keeps what this run showed
// (S.memRun, cleared by Run) and what the lesson ever showed (S.mem), so a step after an edit counts only the new program.
import { MBCore, MBX } from './microbit.js';

const make = (app, cfg) => new MBCore(app, cfg);
const centre = (dx, dz) => (focus) => ({ c: [MBX + dx, 0, dz], k: focus === 'robot' ? 0.55 : 1 });
const world = (o) => Object.assign({ kind: 'mb', make, centre: centre(o.cx || 0, o.cz || 0) }, o);
// what the board shows and says
const img = (S) => S.wv('shownImg');
const lit = (S) => [...(S.wv('shown') || [])].filter((v) => v > 0).length;
const texts = (S) => (S.wv('texts') || []).map(String);
const has = (S, re) => texts(S).some((t) => re.test(t));
const lastNum = (S) => { const n = S.wv('nums') || []; return n.length ? +n[n.length - 1] : null; };
const ran = (S, re) => re.test(S.runSrc || ''); // the program running now has this in it (the edit was Run)
const R = (S) => S.memRun || {}; const M = (S) => S.mem || {};
const PICS3 = ['SQUARE_SMALL', 'SQUARE', 'SCISSORS'];

// ------------------------------------------------------------------ the programs
const RPS1 = `# Rock, paper, scissors: shake the micro:bit and it picks one for you
from microbit import *
import random

while True:
    if accelerometer.was_gesture("shake"):
        tool = random.randint(0, 2)
        if tool == 0:
            display.show(Image.SQUARE_SMALL)   # rock
        elif tool == 1:
            display.show(Image.SQUARE)         # paper
        else:
            display.show(Image.SCISSORS)       # scissors
    sleep(20)
`;
const REACT = `# Reaction time: when the heart appears, press A as fast as you can
from microbit import *
import random

while True:
    display.show(Image.ASLEEP)
    button_a.was_pressed()              # forget any old press
    sleep(random.randint(2000, 5000))   # wait 2 to 5 seconds: you can't guess when
    if button_a.was_pressed():
        display.show(Image.NO)          # too early: that's cheating!
        sleep(1500)
        continue
    display.show(Image.HEART)
    start = running_time()
    while not button_a.is_pressed():
        sleep(1)
    ms = running_time() - start
    display.scroll(ms)
    sleep(1000)
`;
const LIGHTM = `# Light meter: the brighter the room, the more rows of lights
from microbit import *

while True:
    level = display.read_light_level()   # 0 (dark) to 255 (bright)
    rows = level * 5 // 255
    bars = Image(5, 5)
    for y in range(rows):
        for x in range(5):
            bars.set_pixel(x, 4 - y, 9)
    display.show(bars)
    sleep(200)
`;
const DICE = `# Dice: shake it and it rolls, then shows the dots
from microbit import *
import random

FACES = [
    Image("00000:00000:00900:00000:00000"),
    Image("90000:00000:00000:00000:00009"),
    Image("90000:00000:00900:00000:00009"),
    Image("90009:00000:00000:00000:90009"),
    Image("90009:00000:00900:00000:90009"),
    Image("90009:00000:90009:00000:90009"),
]

while True:
    if accelerometer.was_gesture("shake"):
        for i in range(8):                  # it rolls...
            display.show(random.choice(FACES))
            sleep(80)
        n = random.randint(1, 6)
        display.show(FACES[n - 1])          # ...and stops
    sleep(20)
`;
const STOPW = `# Stopwatch: A starts it, B stops it and shows the seconds
from microbit import *

running = False
start = 0
display.show(Image.CLOCK12)
while True:
    if button_a.was_pressed():
        start = running_time()
        running = True
    if button_b.was_pressed() and running:
        running = False
        secs = (running_time() - start) // 1000
        display.scroll(secs)
        display.show(Image.CLOCK12)
    if running:
        hand = (running_time() - start) // 1000 % 12
        display.show(Image.ALL_CLOCKS[hand])
    sleep(50)
`;
const TUG = `# Tug of LED: A pulls the dot left, B pulls it right. Who wins?
from microbit import *

x = 2
while True:
    if button_a.was_pressed():
        x = x - 1
    if button_b.was_pressed():
        x = x + 1
    if x < 0:
        display.scroll("A WINS")
        x = 2
    elif x > 4:
        display.scroll("B WINS")
        x = 2
    display.clear()
    display.set_pixel(x, 2, 9)
    sleep(20)
`;
const SEVEN = `# Seven seconds: press A, count 7 seconds in your head, then press B
from microbit import *

display.show(Image.ARROW_W)                 # "press A"
while True:
    if button_a.was_pressed():
        display.clear()
        start = running_time()
        button_b.was_pressed()              # forget any old press
        while not button_b.was_pressed():
            sleep(10)
        secs = (running_time() - start) / 1000
        if 6.5 <= secs <= 7.5:
            display.show(Image.HAPPY)
        else:
            display.show(Image.SAD)
        sleep(1000)
        display.scroll(secs)
        display.show(Image.ARROW_W)
    sleep(20)
`;
const COIN = `# Coin flipper: A tosses a coin, B shows the score
from microbit import *
import random

heads = 0
tails = 0
while True:
    if button_a.was_pressed():
        for i in range(4):                  # the coin spins in the air
            display.show(Image.DIAMOND_SMALL)
            sleep(100)
            display.show(Image.DIAMOND)
            sleep(100)
        if random.randint(0, 1) == 0:
            display.show("H")
            heads += 1
        else:
            display.show("T")
            tails += 1
    if button_b.was_pressed():
        display.scroll(str(heads) + " H " + str(tails) + " T")
    sleep(20)
`;
const LEVEL = `# Spirit level: the arrow shows which side to lift; a tick when it is level
from microbit import *

while True:
    x = accelerometer.get_x()          # leaning right: +, leaning left: -
    if x > 200:
        display.show(Image.ARROW_E)    # the right side is low: lift it
    elif x < -200:
        display.show(Image.ARROW_W)    # the left side is low: lift it
    else:
        display.show(Image.YES)        # level!
    sleep(100)
`;
const CLAP = `# Clap lights: clap once and the lights come on, clap again and they go off
from microbit import *

lit = False
while True:
    if microphone.was_event(SoundEvent.LOUD):
        lit = not lit
        if lit:
            display.show(Image("99999:99999:99999:99999:99999"))
        else:
            display.clear()
    sleep(50)
`;
const NOISE = `# Noise meter: a smile when the class is quiet, an angry face when it is too loud
from microbit import *

while True:
    level = microphone.sound_level()   # 0 (silent) to 255 (very loud)
    print(level)
    if level > 150:
        display.show(Image.ANGRY)
    elif level > 80:
        display.show(Image.MEH)
    else:
        display.show(Image.HAPPY)
    sleep(200)
`;
const HAMSTER = `# Pet hamster: stroke the logo and it is happy, shake it and it feels sick,
# leave it alone and it falls asleep
from microbit import *

last = running_time()
display.show(Image.HAPPY)
while True:
    if pin_logo.is_touched():
        display.show(Image.HAPPY)
        audio.play(Sound.GIGGLE)
        last = running_time()
    elif accelerometer.was_gesture("shake"):
        display.show(Image.CONFUSED)
        audio.play(Sound.SAD)
        last = running_time()
    elif running_time() - last > 10000:
        display.show(Image.ASLEEP)
    sleep(100)
`;
const BLOW = `# Blow away the lights: blow on the microphone and the LEDs go out one by one
from microbit import *
import random

display.show(Image("99999:99999:99999:99999:99999"))
left = 25
while left > 0:
    if microphone.sound_level() > 100:
        x = random.randint(0, 4)
        y = random.randint(0, 4)
        if display.get_pixel(x, y) > 0:
            display.set_pixel(x, y, 0)
            left -= 1
    sleep(20)
display.show(Image.HAPPY)
`;
const POEM = `# Poetry machine: A makes up a short poem from three lists of words
from microbit import *
import random

WHO = ["THE CAT", "MY FRIEND", "A BIRD", "THE MOON"]
DOES = ["SINGS", "DANCES", "SLEEPS", "SMILES"]
WHERE = ["IN THE RAIN", "AT NIGHT", "ON THE ROOF", "BY THE SEA"]
while True:
    if button_a.was_pressed():
        poem = random.choice(WHO) + " " + random.choice(DOES) + " " + random.choice(WHERE)
        display.scroll(poem, delay=70)
    sleep(20)
`;
const STEADY = `# Steady hand: move the loop along the wire without touching it.
# The wire is joined to pin 0 and the loop to GND: a touch joins them.
from microbit import *
import music

mistakes = 0
display.show(Image.HAPPY)
while True:
    if pin0.is_touched():
        mistakes += 1
        music.pitch(200, 300)              # a buzz
        display.show(mistakes)
        while pin0.is_touched():           # wait until the loop is off the wire
            sleep(10)
    if button_a.was_pressed():             # A: a new player
        mistakes = 0
        display.show(Image.HAPPY)
    sleep(10)
`;
const TRAITS = `# Class survey: A for yes, B for no, touch the logo for the result
from microbit import *

yes = 0
no = 0
while True:
    if button_a.was_pressed():
        yes += 1
        display.show(Image.YES)
    if button_b.was_pressed():
        no += 1
        display.show(Image.NO)
    if pin_logo.is_touched():
        display.scroll(str(yes) + " YES " + str(no) + " NO")
    sleep(50)
`;
const SNAP = `# Snap the dot: press A when the dot is in the middle
from microbit import *

score = 0
x = 0
step = 1
while True:
    display.clear()
    display.set_pixel(x, 2, 9)
    sleep(200)
    if button_a.was_pressed():
        if x == 2:
            score += 1
            display.show(Image.YES)
        else:
            display.show(Image.NO)
        sleep(500)
        display.scroll(score)
    x = x + step
    if x == 0 or x == 4:
        step = -step
`;
const EIGHT = `# Magic 8-ball: ask a yes-or-no question, shake, and read the answer
from microbit import *
import random

ANSWERS = ["YES", "NO", "MAYBE", "ASK AGAIN"]
display.show("?")
while True:
    if accelerometer.was_gesture("shake"):
        display.show(Image.ALL_CLOCKS, delay=60)   # thinking...
        display.scroll(random.choice(ANSWERS))
        display.show("?")
    sleep(20)
`;
const HILO = `# Guess my number: the micro:bit hides a number from 1 to 9.
# A changes your guess, B checks it: the arrow says higher or lower.
from microbit import *
import random

secret = random.randint(1, 9)
guess = 1
tries = 0
display.show(guess)
while True:
    if button_a.was_pressed():
        guess = guess % 9 + 1              # 1, 2 ... 9, then 1 again
        display.show(guess)
    if button_b.was_pressed():
        tries += 1
        if guess < secret:
            display.show(Image.ARROW_N)    # higher
        elif guess > secret:
            display.show(Image.ARROW_S)    # lower
        else:
            display.show(Image.HAPPY)
            sleep(1000)
            display.scroll(str(tries) + " TRIES")
            secret = random.randint(1, 9)
            tries = 0
        sleep(800)
        display.show(guess)
    sleep(20)
`;
const BIKE = `# Bike light: A changes the mode: off, on, flashing
from microbit import *

ALL = Image("99999:99999:99999:99999:99999")
mode = 0
while True:
    if button_a.was_pressed():
        mode = (mode + 1) % 3
    if mode == 0:
        display.clear()
    elif mode == 1:
        display.show(ALL)
    elif running_time() // 250 % 2 == 0:  # flashing: on for 250 ms...
        display.show(ALL)
    else:                                  # ...off for 250 ms
        display.clear()
    sleep(20)
`;
const MORSE = `# Morse code tapper: A taps a dot, B a dash, the logo turns them into a letter
from microbit import *

CODE = {".-": "A", ".": "E", "..": "I", "--": "M", "-.": "N", "---": "O", "...": "S", "-": "T"}
taps = ""
while True:
    if button_a.was_pressed():
        taps = taps + "."
        display.show(Image("00000:00000:00900:00000:00000"))
    if button_b.was_pressed():
        taps = taps + "-"
        display.show(Image("00000:00000:09990:00000:00000"))
    if pin_logo.was_touched():
        display.scroll(CODE.get(taps, "?"))
        taps = ""
    sleep(20)
`;
const CATCH = `# Catch the falling dot: A and B move your basket along the bottom row
from microbit import *
import random

basket = 2
score = 0
x = random.randint(0, 4)
y = 0
ticks = 0
while True:
    if button_a.was_pressed() and basket > 0:
        basket -= 1
    if button_b.was_pressed() and basket < 4:
        basket += 1
    ticks += 1
    if ticks == 8:                     # every 8 turns of the loop the dot falls one row
        ticks = 0
        y += 1
        if y == 4:
            if x == basket:
                score += 1
                display.show(Image.YES)
            else:
                display.scroll("SCORE " + str(score))
                score = 0
            sleep(300)
            x = random.randint(0, 4)
            y = 0
    display.clear()
    display.set_pixel(x, y, 9)
    display.set_pixel(basket, 4, 4)
    sleep(50)
`;
const TRUNDLE = `# Trundle wheel: a foil strip on the wheel touches a contact (pin 0) once every turn.
# Count the turns to measure the playground. A: the distance, B: start again.
from microbit import *

WHEEL = 1.0                  # metres per turn: a wheel 32 cm across
turns = 0
display.show(0)
while True:
    if pin0.is_touched():
        turns += 1
        display.show(turns)
        while pin0.is_touched():       # wait for the strip to move past
            sleep(5)
    if button_a.was_pressed():
        display.scroll(str(turns * WHEEL) + " M")
    if button_b.was_pressed():
        turns = 0
        display.show(0)
    sleep(5)
`;
export const MB8_CODES = { RPS1, REACT, LIGHTM, DICE, STOPW, TUG, SEVEN, COIN, LEVEL, CLAP, NOISE, HAMSTER, BLOW, POEM, STEADY, TRAITS, SNAP, EIGHT, HILO, BIKE, MORSE, CATCH, TRUNDLE };

export function batch8(K, n0) {
  const { t3 } = K;
  const T = (en, hi, hg) => t3(en, hi, hg);
  const E = T('', '', '');
  const run = (see) => ({ k: 'run', do: T('Press Run.', '"चलाइए" दबाइए।', 'Run dabaiye.'), see: see || T('The program goes into the micro:bit and starts.', 'प्रोग्राम micro:bit में जाकर चलने लगता है।', 'Program micro:bit mein jaakar chalne lagta hai.') });
  const info = (code, d, s) => ({ k: 'info', code, do: d, see: s || E });
  const act = (until, d, s) => ({ k: 'act', until, do: d, see: s || E });
  const watch = (until, d, s) => ({ k: 'watch', until, do: d, see: s || E });
  const edit = (test, set, d) => ({ k: 'edit', test, set, do: d, see: E });
  const L = [
    // 1 ------------------------------------------------------------------------------------------------------------
    { id: 'mbrps1', view: 'mb', code: RPS1, drawer: [],
      title: T('Rock, paper, scissors', 'पत्थर, काग़ज़, कैंची', 'Rock, paper, scissors'),
      goal: T('Shake the micro:bit and it picks rock, paper or scissors at random, fairly.', 'micro:bit हिलाइए और यह बिना पक्षपात के, बेतरतीब ढंग से पत्थर, काग़ज़ या कैंची चुनता है।', 'micro:bit hilaiye aur yeh bina bhedbhav ke, random tareeke se rock, paper ya scissors chunta hai.'),
      world: world({ scene: 'desk', controls: ['shake', 'phone'], hud: ['shakes'], title: T('Rock, paper, scissors', 'पत्थर, काग़ज़, कैंची', 'Rock, paper, scissors') }),
      setup: { parts: [], wires: [] },
      tick: (S) => { const m = S.memRun; if (PICS3.includes(img(S))) m.pic = true; else if (m.pic && lit(S) === 0 && ran(S, /display\.clear\(\)/)) { m.hid = true; S.mem.hid = true; } },
      steps: [
        info([6, 7], T('accelerometer.was_gesture("shake") is True once after each shake. random.randint(0, 2) picks 0, 1 or 2, each just as likely: the micro:bit\'s way of choosing fairly.', 'accelerometer.was_gesture("shake") हर बार हिलाने के बाद एक बार True होता है। random.randint(0, 2) 0, 1 या 2 चुनता है, तीनों की बराबर संभावना: micro:bit का निष्पक्ष चुनाव।', 'accelerometer.was_gesture("shake") har baar hilane ke baad ek baar True hota hai. random.randint(0, 2) 0, 1 ya 2 chunta hai, teenon ka barabar chance: micro:bit ka fair chunav.')),
        run(),
        act((S) => PICS3.some((n) => S.w('img:' + n)), T('Shake the micro:bit: press "Shake it", or drag it quickly to and fro.', 'micro:bit हिलाइए: "हिलाइए" दबाइए, या उसे तेज़ी से इधर-उधर खींचिए।', 'micro:bit hilaiye: "Hilaiye" dabaiye, ya use tezi se idhar-udhar kheenchiye.'),
          T('A small square is rock, a big square is paper, and scissors are scissors. Play against a friend: both say "rock, paper, scissors!" and show.', 'छोटा चौकोर पत्थर है, बड़ा चौकोर काग़ज़, और कैंची कैंची। दोस्त के साथ खेलिए: दोनों बोलिए "पत्थर, काग़ज़, कैंची!" और दिखाइए।', 'Chhota square rock hai, bada square paper, aur scissors scissors. Dost ke saath kheliye: dono boliye "rock, paper, scissors!" aur dikhaiye.')),
        act((S) => S.wv('shakes') >= 6 && PICS3.filter((n) => S.w('img:' + n)).length >= 2, T('Shake it 5 more times. Did you get all three?', 'इसे 5 बार और हिलाइए। क्या तीनों आए?', 'Ise 5 baar aur hilaiye. Kya teeno aaye?'),
          T('Random means nobody can guess the next one, but over many shakes each comes about one time in three.', 'बेतरतीब का मतलब है कि अगला कोई नहीं बता सकता, पर बहुत बार हिलाने पर हर एक लगभग तीन में से एक बार आता है।', 'Random ka matlab hai ki agla koi guess nahi kar sakta, par bahut baar hilane par har ek lagbhag teen mein se ek baar aata hai.')),
        edit((src) => /\n        sleep\(\s*2000\s*\)\s*\n        display\.clear\(\)/.test(src), [[/(            display\.show\(Image\.SCISSORS\)[^\n]*\n)/, '$1        sleep(2000)\n        display.clear()\n']],
          T('Hide the answer after 2 seconds, so the next player can\'t peek: under the scissors line add these two lines, 8 spaces in (in line with else:\'s if)\n        sleep(2000)\n        display.clear()\nthen Run.', 'उत्तर 2 सेकंड बाद छिपाइए, ताकि अगला खिलाड़ी झाँक न सके: कैंची वाली लाइन के नीचे ये दो लाइनें 8 स्पेस अंदर लिखिए\n        sleep(2000)\n        display.clear()\nफिर "चलाइए"।', 'Answer 2 second baad chhupaiye, taaki agla player jhaank na sake: scissors wali line ke neeche yeh do lines 8 space andar likhiye\n        sleep(2000)\n        display.clear()\nphir Run.')),
        act((S) => !!R(S).hid, T('Shake it again and wait.', 'फिर से हिलाइए और रुकिए।', 'Phir se hilaiye aur rukiye.'),
          T('The picture stays 2 seconds, then the screen goes dark. The spaces at the start of a line tell Python which if a line belongs to.', 'तस्वीर 2 सेकंड रहती है, फिर स्क्रीन अँधेरी हो जाती है। लाइन की शुरुआत के स्पेस Python को बताते हैं कि लाइन किस if के अंदर है।', 'Tasveer 2 second rehti hai, phir screen andheri ho jaati hai. Line ki shuruaat ke space Python ko batate hain ki line kis if ke andar hai.')),
      ],
      done: (S) => !!M(S).hid },
    // 2 ------------------------------------------------------------------------------------------------------------
    { id: 'mbreact', view: 'mb', code: REACT, drawer: [],
      title: T('Reaction time game', 'रिएक्शन टाइम गेम', 'Reaction time game'),
      goal: T('Measure how fast you react, in milliseconds, and catch players who press too early.', 'नापिए कि आप कितनी जल्दी प्रतिक्रिया करते हैं, मिलीसेकंड में, और जल्दी दबाने वालों को पकड़िए।', 'Naapiye ki aap kitni jaldi react karte ho, milliseconds mein, aur jaldi dabane walon ko pakdiye.'),
      world: world({ scene: 'desk', controls: ['A'], hud: ['buttons'], title: T('Reaction time', 'रिएक्शन टाइम', 'Reaction time') }),
      setup: { parts: [], wires: [] },
      tick: (S) => { if (img(S) === 'NO') S.mem.cheat = true; if (ran(S, /ms \/ 1000/) && has(S, /^0?\.\d+$|^\d\.\d+$/)) S.mem.secs = true; },
      steps: [
        info([8, 14, 17], T('The heart comes after a random wait of 2 to 5 seconds. running_time() is a stopwatch inside the micro:bit, in milliseconds (1000 ms = 1 second): the program notes the time when the heart appears and again when you press A.', 'दिल 2 से 5 सेकंड के बेतरतीब इंतज़ार के बाद आता है। running_time() micro:bit के अंदर की स्टॉपवॉच है, मिलीसेकंड में (1000 ms = 1 सेकंड): प्रोग्राम दिल आने का समय नोट करता है और A दबाने का भी।', 'Dil 2 se 5 second ke random intezaar ke baad aata hai. running_time() micro:bit ke andar ki stopwatch hai, milliseconds mein (1000 ms = 1 second): program dil aane ka time note karta hai aur A dabane ka bhi.')),
        run(),
        act((S) => S.w('img:HEART') && lastNum(S) !== null && lastNum(S) > 0, T('When the heart appears, press A as fast as you can.', 'जैसे ही दिल दिखे, जितनी जल्दी हो सके A दबाइए।', 'Jaise hi dil dikhe, jitni jaldi ho sake A dabaiye.'),
          T('The number is your reaction time in milliseconds. Most people take 200 to 300 ms: the time your eyes, brain and finger need.', 'यह संख्या आपका रिएक्शन टाइम है, मिलीसेकंड में। ज़्यादातर लोगों को 200 से 300 ms लगते हैं: आँख, दिमाग़ और उँगली का समय।', 'Yeh number aapka reaction time hai, milliseconds mein. Zyaadatar logon ko 200 se 300 ms lagte hain: aankh, dimaag aur ungli ka time.')),
        act((S) => S.w('img:NO'), T('Now try to cheat: press A before the heart comes.', 'अब चीटिंग कीजिए: दिल आने से पहले A दबाइए।', 'Ab cheating kijiye: dil aane se pehle A dabaiye.'),
          T('The program checks for an early press and shows a cross. Good games are fair games.', 'प्रोग्राम जल्दी दबाने को पकड़ता है और क्रॉस दिखाता है। अच्छे खेल ईमानदार खेल होते हैं।', 'Program jaldi dabane ko pakadta hai aur cross dikhata hai. Achhe games imaandaar games hote hain.')),
        edit((src) => /display\.scroll\(\s*ms\s*\/\s*1000\s*\)/.test(src), [[/display\.scroll\(ms\)/, 'display.scroll(ms / 1000)']],
          T('Show seconds instead: change display.scroll(ms) to display.scroll(ms / 1000), then Run.', 'सेकंड दिखाइए: display.scroll(ms) को display.scroll(ms / 1000) कीजिए, फिर "चलाइए"।', 'Seconds dikhaiye: display.scroll(ms) ko display.scroll(ms / 1000) karo, phir Run.')),
        act((S) => !!M(S).secs, T('Play again: wait for the heart, then press A.', 'फिर खेलिए: दिल का इंतज़ार कीजिए, फिर A दबाइए।', 'Phir kheliye: dil ka intezaar kijiye, phir A dabaiye.'),
          T('0.25 means a quarter of a second. Try with your other hand: is it slower?', '0.25 यानी सेकंड का चौथाई हिस्सा। दूसरे हाथ से कोशिश कीजिए: क्या धीमा है?', '0.25 matlab second ka chauthai hissa. Doosre haath se try kijiye: kya slow hai?')),
      ],
      done: (S) => !!M(S).secs && !!M(S).cheat },
    // 3 ------------------------------------------------------------------------------------------------------------
    { id: 'mblight', view: 'mb', code: LIGHTM, drawer: [],
      title: T('Light level meter', 'रोशनी मापक', 'Light level meter'),
      goal: T('Measure the light with the display itself and draw it as a bar: more light, more rows.', 'डिस्प्ले से ही रोशनी नापिए और उसे बार की तरह दिखाइए: ज़्यादा रोशनी, ज़्यादा पंक्तियाँ।', 'Display se hi roshni naapiye aur use bar ki tarah dikhaiye: zyada roshni, zyada rows.'),
      world: world({ scene: 'desk', controls: ['light', 'A'], hud: ['light'], title: T('Light meter', 'रोशनी मापक', 'Light meter') }),
      setup: { parts: [], wires: [] },
      tick: (S) => { if (ran(S, /display\.scroll\(\s*level\s*\)/) && S.w('scrolled') && lastNum(S) !== null && lastNum(S) >= 0 && lastNum(S) <= 255) S.mem.num = true; },
      steps: [
        info([5, 6], T('read_light_level() gives 0 in the dark and 255 in bright light: the LEDs themselves feel the light. level * 5 // 255 turns that into 0 to 5 rows (// divides and drops the part after the point).', 'read_light_level() अँधेरे में 0 और तेज़ रोशनी में 255 देता है: एलईडी ख़ुद रोशनी महसूस करती हैं। level * 5 // 255 इसे 0 से 5 पंक्तियों में बदलता है (// भाग देकर दशमलव के बाद का हिस्सा हटा देता है)।', 'read_light_level() andhere mein 0 aur tez roshni mein 255 deta hai: LEDs khud roshni mehsoos karti hain. level * 5 // 255 ise 0 se 5 rows mein badalta hai (// divide karke point ke baad ka hissa hata deta hai).')),
        info([8, 9, 10], T('A loop inside a loop: for each row y, counting from the bottom, light all 5 LEDs x of that row.', 'लूप के अंदर लूप: हर पंक्ति y के लिए, नीचे से गिनते हुए, उस पंक्ति की पाँचों एलईडी x जलाइए।', 'Loop ke andar loop: har row y ke liye, neeche se ginte hue, us row ki paanchon LEDs x jalaiye.')),
        run(),
        act((S) => S.wv('light') < 20 && lit(S) === 0, T('Make the room dark: slide Room light down to 10%.', 'कमरे में अँधेरा कीजिए: Room light को 10% तक नीचे सरकाइए।', 'Kamre mein andhera kijiye: Room light ko 10% tak neeche sarkaiye.'), T('No rows: hardly any light.', 'कोई पंक्ति नहीं: लगभग कोई रोशनी नहीं।', 'Koi row nahi: lagbhag koi roshni nahi.')),
        act((S) => S.wv('light') > 200 && lit(S) >= 20, T('Now make it bright: slide Room light up to 100%.', 'अब तेज़ रोशनी कीजिए: Room light को 100% तक ऊपर सरकाइए।', 'Ab tez roshni kijiye: Room light ko 100% tak upar sarkaiye.'),
          T('4 or 5 rows: plenty of light. Gardeners, farmers and photographers measure light like this.', '4 या 5 पंक्तियाँ: भरपूर रोशनी। माली, किसान और फ़ोटोग्राफ़र ऐसे ही रोशनी नापते हैं।', '4 ya 5 rows: bharpoor roshni. Maali, kisaan aur photographer aise hi roshni naapte hain.')),
        edit((src) => /button_a\.was_pressed\(\)/.test(src) && /display\.scroll\(\s*level\s*\)/.test(src), [[/    display\.show\(bars\)\n/, '    display.show(bars)\n    if button_a.was_pressed():\n        display.scroll(level)\n']],
          T('Read the exact number: under display.show(bars) add\n    if button_a.was_pressed():\n        display.scroll(level)\nthen Run.', 'सही संख्या पढ़िए: display.show(bars) के नीचे लिखिए\n    if button_a.was_pressed():\n        display.scroll(level)\nफिर "चलाइए"।', 'Sahi number padhiye: display.show(bars) ke neeche likhiye\n    if button_a.was_pressed():\n        display.scroll(level)\nphir Run.')),
        act((S) => !!M(S).num, T('Press A.', 'A दबाइए।', 'A dabaiye.'),
          T('The exact light level. Note the readings at the window, in the corridor and under a desk: where would a plant grow best?', 'रोशनी का सही स्तर। खिड़की पर, गलियारे में और मेज़ के नीचे रीडिंग लिखिए: पौधा कहाँ सबसे अच्छा उगेगा?', 'Roshni ka sahi level. Khidki par, corridor mein aur desk ke neeche reading likhiye: paudha kahan sabse achha ugega?')),
      ],
      done: (S) => !!M(S).num },
    // 4 ------------------------------------------------------------------------------------------------------------
    { id: 'mbdice', view: 'mb', code: DICE, drawer: [],
      title: T('Shake dice', 'हिलाने वाला पासा', 'Shake dice'),
      goal: T('A dice with real dots: shake to roll, a little animation, then a fair number from 1 to 6.', 'असली बिंदुओं वाला पासा: हिलाइए, थोड़ा घूमता है, फिर 1 से 6 तक की निष्पक्ष संख्या।', 'Asli dots wala dice: hilaiye, thoda ghoomta hai, phir 1 se 6 tak ka fair number.'),
      world: world({ scene: 'desk', controls: ['shake', 'phone'], hud: ['shakes'], title: T('Dice', 'पासा', 'Dice') }),
      setup: { parts: [], wires: [] },
      tick: (S, dt) => { const m = S.memRun; const n = lit(S); const sh = S.wv('shakes') || 0;
        if (sh !== m.sh) { m.sh = sh; m.still = 0; m.counted = false; } else { m.still = (m.still || 0) + dt; }
        if (m.sh && !m.counted && m.still > 1.2 && n >= 1 && n <= 6) { m.counted = true; m.rolls = (m.rolls || 0) + 1; S.mem.rolls = (S.mem.rolls || 0) + 1; }
        if (ran(S, /display\.scroll\(\s*n\s*\)/) && S.w('scrolled') && lastNum(S) >= 1 && lastNum(S) <= 6) S.mem.num = true; },
      steps: [
        info([5, 6, 7, 8, 9, 10, 11, 12], T('FACES is a list of six pictures, the six sides of a dice. A list keeps things in order: FACES[0] is the first one.', 'FACES छह तस्वीरों की सूची (list) है, पासे के छह चेहरे। सूची चीज़ों को क्रम में रखती है: FACES[0] पहली है।', 'FACES chhe tasveeron ki list hai, dice ke chhe chehre. List cheezon ko order mein rakhti hai: FACES[0] pehli hai.')),
        info([19, 20], T('random.randint(1, 6) picks 1 to 6. Python counts a list from 0, so face n is FACES[n - 1].', 'random.randint(1, 6) 1 से 6 चुनता है। Python सूची को 0 से गिनता है, इसलिए चेहरा n है FACES[n - 1]।', 'random.randint(1, 6) 1 se 6 chunta hai. Python list ko 0 se ginta hai, isliye chehra n hai FACES[n - 1].')),
        run(),
        act((S) => (R(S).rolls || 0) >= 1, T('Shake it.', 'इसे हिलाइए।', 'Ise hilaiye.'), T('It rolls for a moment, then stops on a number of dots. Count them!', 'यह थोड़ी देर घूमता है, फिर कुछ बिंदुओं पर रुकता है। गिनिए!', 'Yeh thodi der ghoomta hai, phir kuch dots par rukta hai. Giniye!')),
        act((S) => (R(S).rolls || 0) >= 4, T('Roll it 3 more times. Play Ludo or Snakes and Ladders with it!', 'इसे 3 बार और घुमाइए। इससे लूडो या साँप-सीढ़ी खेलिए!', 'Ise 3 baar aur ghumaiye. Isse Ludo ya saanp-seedhi kheliye!'),
          T('Each number has the same chance: 1 in 6. That is what makes a dice fair.', 'हर संख्या की बराबर संभावना है: 6 में 1। इसी से पासा निष्पक्ष होता है।', 'Har number ka barabar chance hai: 6 mein 1. Isi se dice fair hota hai.')),
        edit((src) => /\n        display\.scroll\(\s*n\s*\)/.test(src), [[/(        display\.show\(FACES\[n - 1\]\)[^\n]*\n)/, '$1        sleep(1000)\n        display.scroll(n)\n']],
          T('Add the number too: under the line that shows FACES[n - 1] add\n        sleep(1000)\n        display.scroll(n)\nthen Run.', 'संख्या भी दिखाइए: FACES[n - 1] दिखाने वाली लाइन के नीचे लिखिए\n        sleep(1000)\n        display.scroll(n)\nफिर "चलाइए"।', 'Number bhi dikhaiye: FACES[n - 1] dikhane wali line ke neeche likhiye\n        sleep(1000)\n        display.scroll(n)\nphir Run.')),
        act((S) => !!M(S).num, T('Shake it.', 'इसे हिलाइए।', 'Ise hilaiye.'), T('Dots, then the number: do they match?', 'पहले बिंदु, फिर संख्या: क्या दोनों मिलते हैं?', 'Pehle dots, phir number: kya dono milte hain?')),
      ],
      done: (S) => !!M(S).num && (M(S).rolls || 0) >= 4 },
    // 5 ------------------------------------------------------------------------------------------------------------
    { id: 'mbstop', view: 'mb', code: STOPW, drawer: [],
      title: T('Stopwatch', 'स्टॉपवॉच', 'Stopwatch'),
      goal: T('A stopwatch with a ticking clock hand: A starts, B stops and shows the time.', 'घूमती सुई वाली स्टॉपवॉच: A शुरू करता है, B रोककर समय दिखाता है।', 'Ghoomti sui wali stopwatch: A shuru karta hai, B rok kar time dikhata hai.'),
      world: world({ scene: 'desk', controls: ['A', 'B'], hud: ['buttons'], title: T('Stopwatch', 'स्टॉपवॉच', 'Stopwatch') }),
      setup: { parts: [], wires: [] },
      tick: (S) => { if (ran(S, /\(running_time\(\) - start\) \/ 1000/) && has(S, /^\d+\.\d+$/)) S.mem.dec = true; },
      steps: [
        info([4, 5, 9, 10], T('running is True or False: it remembers whether the stopwatch is going. start remembers the time when you pressed A.', 'running True या False है: यह याद रखता है कि स्टॉपवॉच चल रही है या नहीं। start याद रखता है कि A कब दबाया था।', 'running True ya False hai: yeh yaad rakhta hai ki stopwatch chal rahi hai ya nahi. start yaad rakhta hai ki A kab dabaya tha.')),
        info([17, 18], T('The clock hand moves one step every second: // 1000 turns milliseconds into whole seconds, and % 12 starts again from 0 after 11.', 'घड़ी की सुई हर सेकंड एक कदम चलती है: // 1000 मिलीसेकंड को पूरे सेकंड बनाता है, और % 12 11 के बाद फिर 0 से शुरू करता है।', 'Ghadi ki sui har second ek kadam chalti hai: // 1000 milliseconds ko poore seconds banata hai, aur % 12 11 ke baad phir 0 se shuru karta hai.')),
        run(),
        act((S) => S.w('scrolled') && lastNum(S) >= 2, T('Press A, count to 5 in your head, then press B.', 'A दबाइए, मन में 5 तक गिनिए, फिर B दबाइए।', 'A dabaiye, mann mein 5 tak giniye, phir B dabaiye.'),
          T('Was it really 5? Most people count a little too fast or too slow.', 'क्या सच में 5 था? ज़्यादातर लोग थोड़ा तेज़ या धीमा गिनते हैं।', 'Kya sach mein 5 tha? Zyaadatar log thoda tez ya slow ginte hain.')),
        edit((src) => /secs = \(running_time\(\) - start\) \/ 1000/.test(src), [[/secs = \(running_time\(\) - start\) \/\/ 1000/, 'secs = (running_time() - start) / 1000']],
          T('Show tenths of a second: in the secs = line change // 1000 to / 1000 (one slash keeps the decimals), then Run.', 'सेकंड का दसवाँ हिस्सा दिखाइए: secs = वाली लाइन में // 1000 को / 1000 कीजिए (एक स्लैश दशमलव रखता है), फिर "चलाइए"।', 'Second ka dasvaan hissa dikhaiye: secs = wali line mein // 1000 ko / 1000 karo (ek slash decimal rakhta hai), phir Run.')),
        act((S) => !!M(S).dec, T('Time 5 seconds again: A, count, B.', 'फिर 5 सेकंड नापिए: A, गिनती, B।', 'Phir 5 second naapiye: A, ginti, B.'),
          T('Now you see 5.2 or 4.85. Races at sports day are timed like this, to hundredths of a second.', 'अब 5.2 या 4.85 जैसा दिखता है। खेल दिवस की दौड़ ऐसे ही सेकंड के सौवें हिस्से तक नापी जाती है।', 'Ab 5.2 ya 4.85 jaisa dikhta hai. Sports day ki race aise hi second ke sauven hisse tak naapi jaati hai.')),
      ],
      done: (S) => !!M(S).dec },
    // 6 ------------------------------------------------------------------------------------------------------------
    { id: 'mbtug', view: 'mb', code: TUG, drawer: [],
      title: T('Tug of LED', 'एलईडी की रस्साकशी', 'Tug of LED'),
      goal: T('A two-player game: each button pulls the dot its way; pull it off your edge to win.', 'दो खिलाड़ियों का खेल: हर बटन बिंदु को अपनी ओर खींचता है; अपने किनारे से बाहर खींचिए और जीतिए।', 'Do players ka game: har button dot ko apni taraf kheenchta hai; apne kinare se bahar kheenchiye aur jeetiye.'),
      world: world({ scene: 'desk', controls: ['A', 'B'], hud: ['buttons'], title: T('Tug of LED', 'एलईडी की रस्साकशी', 'Tug of LED') }),
      setup: { parts: [], wires: [] },
      tick: (S) => { const m = S.memRun; if (m.m0 === undefined) { m.m0 = S.wv('music') || 0; m.t0 = texts(S).length; }
        if (ran(S, /music\.play\(/) && (S.wv('music') || 0) > m.m0 && texts(S).slice(m.t0).some((t) => /WINS/.test(t))) S.mem.tune = true; },
      steps: [
        info([4, 7, 9], T('x is where the dot is: 0 is the left edge, 4 the right edge, 2 the middle. A takes one away (x - 1), B adds one (x + 1).', 'x बताता है बिंदु कहाँ है: 0 बायाँ किनारा, 4 दायाँ किनारा, 2 बीच। A एक घटाता है (x - 1), B एक जोड़ता है (x + 1)।', 'x batata hai dot kahan hai: 0 left kinara, 4 right kinara, 2 beech. A ek ghatata hai (x - 1), B ek jodta hai (x + 1).')),
        run(),
        act((S) => has(S, /^A WINS$/), T('Player A: press A three times.', 'खिलाड़ी A: A तीन बार दबाइए।', 'Player A: A teen baar dabaiye.'), T('The dot fell off the left edge: A wins, and it starts again in the middle.', 'बिंदु बाएँ किनारे से गिर गया: A जीता, और खेल फिर बीच से शुरू।', 'Dot left kinare se gir gaya: A jeeta, aur game phir beech se shuru.')),
        act((S) => has(S, /^B WINS$/), T('Now a real game: one player on A, one on B, press as fast as you can!', 'अब असली खेल: एक खिलाड़ी A पर, एक B पर, जितना तेज़ दबा सकें दबाइए!', 'Ab asli game: ek player A par, ek B par, jitna tez daba sakein dabaiye!'), T('A race of fingers. Count the score on paper: first to 5 wins.', 'उँगलियों की दौड़। स्कोर काग़ज़ पर लिखिए: पहले 5 जीतने वाला विजेता।', 'Ungliyon ki race. Score kaagaz par likhiye: pehle 5 jeetne wala winner.')),
        edit((src) => /import music/.test(src) && /music\.play\(/.test(src), [[/from microbit import \*\n/, 'from microbit import *\nimport music\n'], [/(        display\.scroll\("A WINS"\)\n)/, '$1        music.play(music.POWER_UP)\n'], [/(        display\.scroll\("B WINS"\)\n)/, '$1        music.play(music.POWER_UP)\n']],
          T('A tune for the winner: under from microbit import * add import music, and under each display.scroll(... WINS) line add\n        music.play(music.POWER_UP)\nthen Run.', 'विजेता के लिए धुन: from microbit import * के नीचे import music लिखिए, और हर display.scroll(... WINS) वाली लाइन के नीचे लिखिए\n        music.play(music.POWER_UP)\nफिर "चलाइए"।', 'Winner ke liye dhun: from microbit import * ke neeche import music likhiye, aur har display.scroll(... WINS) wali line ke neeche likhiye\n        music.play(music.POWER_UP)\nphir Run.')),
        act((S) => !!M(S).tune, T('Play until someone wins.', 'किसी के जीतने तक खेलिए।', 'Kisi ke jeetne tak kheliye.'), T('The speaker plays a victory tune. Turn your sound on to hear it.', 'स्पीकर जीत की धुन बजाता है। सुनने के लिए आवाज़ चालू कीजिए।', 'Speaker jeet ki dhun bajata hai. Sunne ke liye sound on kijiye.')),
      ],
      done: (S) => !!M(S).tune },
    // 7 ------------------------------------------------------------------------------------------------------------
    { id: 'mbseven', view: 'mb', code: SEVEN, drawer: [],
      title: T('Seven-second game', 'सात सेकंड का खेल', 'Seven-second game'),
      goal: T('Can you feel 7 seconds without a clock? Press A, count, press B: within half a second wins.', 'क्या आप बिना घड़ी 7 सेकंड महसूस कर सकते हैं? A दबाइए, गिनिए, B दबाइए: आधे सेकंड के अंदर तो जीत।', 'Kya aap bina ghadi 7 second mehsoos kar sakte ho? A dabaiye, giniye, B dabaiye: aadhe second ke andar to jeet.'),
      world: world({ scene: 'desk', controls: ['A', 'B'], hud: ['buttons'], title: T('Seven seconds', 'सात सेकंड', 'Seven seconds') }),
      setup: { parts: [], wires: [] },
      tick: (S) => { const m = S.memRun; const i = img(S);
        if (i === 'HAPPY' && m.last !== 'HAPPY') { m.won = (m.won || 0) + 1; if (ran(S, /6\.8 <= secs <= 7\.2/)) S.mem.hard = true; }
        if (i === 'SAD' && m.last !== 'SAD') m.lost = (m.lost || 0) + 1; if (i) m.last = i; },
      steps: [
        info([12, 13], T('secs is the time between A and B. 6.5 <= secs <= 7.5 is True when secs is between 6.5 and 7.5: you may be half a second out.', 'secs A और B के बीच का समय है। 6.5 <= secs <= 7.5 तब True है जब secs 6.5 और 7.5 के बीच हो: आधा सेकंड इधर-उधर चल जाएगा।', 'secs A aur B ke beech ka time hai. 6.5 <= secs <= 7.5 tab True hai jab secs 6.5 aur 7.5 ke beech ho: aadha second idhar-udhar chal jayega.')),
        run(),
        act((S) => (R(S).won || 0) >= 1, T('Press A, count seven seconds in your head (one-and, two-and…), then press B.', 'A दबाइए, मन में सात सेकंड गिनिए (एक-और, दो-और…), फिर B दबाइए।', 'A dabaiye, mann mein saat second giniye (ek-aur, do-aur…), phir B dabaiye.'),
          T('Within half a second: a smile! Then it shows how long it really was.', 'आधे सेकंड के अंदर: मुस्कान! फिर यह बताता है असल में कितना समय था।', 'Aadhe second ke andar: muskaan! Phir yeh batata hai asal mein kitna time tha.')),
        act((S) => (R(S).lost || 0) >= 1, T('Now press A, and B after only 3 seconds.', 'अब A दबाइए, और सिर्फ़ 3 सेकंड बाद B।', 'Ab A dabaiye, aur sirf 3 second baad B.'),
          T('Too soon: a sad face. Our feeling for time is not as good as a clock\'s.', 'बहुत जल्दी: उदास चेहरा। समय का हमारा अंदाज़ा घड़ी जितना अच्छा नहीं होता।', 'Bahut jaldi: udaas chehra. Time ka hamara andaaza ghadi jitna achha nahi hota.')),
        edit((src) => /6\.8\s*<=\s*secs\s*<=\s*7\.2/.test(src), [[/6\.5 <= secs <= 7\.5/, '6.8 <= secs <= 7.2']],
          T('Make it harder: change 6.5 <= secs <= 7.5 to 6.8 <= secs <= 7.2, then Run.', 'इसे कठिन बनाइए: 6.5 <= secs <= 7.5 को 6.8 <= secs <= 7.2 कीजिए, फिर "चलाइए"।', 'Ise mushkil banaiye: 6.5 <= secs <= 7.5 ko 6.8 <= secs <= 7.2 karo, phir Run.')),
        act((S) => !!M(S).hard, T('Try again: can you get within 0.2 seconds?', 'फिर कोशिश कीजिए: क्या आप 0.2 सेकंड के अंदर आ सकते हैं?', 'Phir try kijiye: kya aap 0.2 second ke andar aa sakte ho?'),
          T('Hard! Musicians and athletes train this sense of timing.', 'मुश्किल है! संगीतकार और खिलाड़ी समय का यह अंदाज़ा अभ्यास से सीखते हैं।', 'Mushkil hai! Musicians aur athletes timing ka yeh andaaza practice se seekhte hain.')),
      ],
      done: (S) => !!M(S).hard },
    // 8 ------------------------------------------------------------------------------------------------------------
    { id: 'mbcoin', view: 'mb', code: COIN, drawer: [],
      title: T('Coin flipper', 'सिक्का उछालना', 'Coin flipper'),
      goal: T('Toss a coin that spins, keep the score of heads and tails, and see how chance adds up.', 'घूमता सिक्का उछालिए, चित और पट गिनिए, और देखिए कि संयोग कैसे जुड़ता है।', 'Ghoomta sikka uchhaliye, heads aur tails giniye, aur dekhiye ki chance kaise judta hai.'),
      world: world({ scene: 'desk', controls: ['A', 'B'], hud: ['buttons'], title: T('Coin', 'सिक्का', 'Sikka') }),
      setup: { parts: [], wires: [] },
      tick: (S) => { const i = img(S); if (ran(S, /display\.show\(Image\.HAPPY\)/) && (i === 'HAPPY' || i === 'SQUARE')) S.mem.pics = true;
        for (const t of texts(S)) { const m = /^(\d+) H (\d+) T$/.exec(t); if (m && +m[1] + +m[2] >= 10) S.mem.ten = true; } },
      steps: [
        info([14], T('random.randint(0, 1) is 0 or 1: like a real coin, two sides, each just as likely.', 'random.randint(0, 1) 0 या 1 है: असली सिक्के की तरह, दो पहलू, दोनों की बराबर संभावना।', 'random.randint(0, 1) 0 ya 1 hai: asli sikke ki tarah, do side, dono ka barabar chance.')),
        info([5, 6, 16, 19], T('heads and tails are counters: += 1 adds one each time.', 'heads और tails गिनती रखते हैं: += 1 हर बार एक जोड़ता है।', 'heads aur tails ginti rakhte hain: += 1 har baar ek jodta hai.')),
        run(),
        act((S) => has(S, /^[HT]$/), T('Press A to toss.', 'उछालने के लिए A दबाइए।', 'Uchhaalne ke liye A dabaiye.'), T('Heads (H) or tails (T)? Cricket captains toss a coin like this before a match.', 'चित (H) या पट (T)? क्रिकेट कप्तान मैच से पहले ऐसे ही टॉस करते हैं।', 'Heads (H) ya tails (T)? Cricket captain match se pehle aise hi toss karte hain.')),
        act((S) => !!M(S).ten, T('Toss it 10 times, then press B for the score.', '10 बार उछालिए, फिर स्कोर के लिए B दबाइए।', '10 baar uchhaliye, phir score ke liye B dabaiye.'),
          T('About half heads and half tails, but rarely exactly 5 and 5. With 100 tosses it gets closer to half.', 'लगभग आधे चित और आधे पट, पर ठीक 5 और 5 कम ही आता है। 100 बार उछालने पर यह आधे के और पास आता है।', 'Lagbhag aadhe heads aur aadhe tails, par theek 5 aur 5 kam hi aata hai. 100 baar uchhaalne par yeh aadhe ke aur paas aata hai.')),
        edit((src) => /display\.show\(Image\.HAPPY\)/.test(src) && !/display\.show\("H"\)/.test(src), [[/display\.show\("H"\)/, 'display.show(Image.HAPPY)'], [/display\.show\("T"\)/, 'display.show(Image.SQUARE)']],
          T('Use pictures: change display.show("H") to display.show(Image.HAPPY) and display.show("T") to display.show(Image.SQUARE), then Run.', 'तस्वीरें लगाइए: display.show("H") को display.show(Image.HAPPY) और display.show("T") को display.show(Image.SQUARE) कीजिए, फिर "चलाइए"।', 'Tasveerein lagaiye: display.show("H") ko display.show(Image.HAPPY) aur display.show("T") ko display.show(Image.SQUARE) karo, phir Run.')),
        act((S) => !!M(S).pics, T('Toss it again.', 'फिर से उछालिए।', 'Phir se uchhaliye.'), T('A face for heads, a square for tails: the two sides of your coin.', 'चित के लिए चेहरा, पट के लिए चौकोर: आपके सिक्के के दो पहलू।', 'Heads ke liye chehra, tails ke liye square: aapke sikke ki do side.')),
      ],
      done: (S) => !!M(S).pics && !!M(S).ten },
    // 9 ------------------------------------------------------------------------------------------------------------
    { id: 'mblevel', view: 'mb', code: LEVEL, drawer: [], serial: true,
      title: T('Spirit level', 'स्पिरिट लेवल', 'Spirit level'),
      goal: T('Use the accelerometer to tell when a shelf is level, and which side to lift when it is not.', 'एक्सेलेरोमीटर से पता कीजिए कि शेल्फ़ सीधी है या नहीं, और नहीं तो कौन-सी तरफ़ उठानी है।', 'Accelerometer se pata kijiye ki shelf seedhi hai ya nahi, aur nahi to kaun si taraf uthani hai.'),
      world: world({ scene: 'desk', controls: ['tilt', 'phone'], hud: ['acc'], title: T('Spirit level', 'स्पिरिट लेवल', 'Spirit level') }),
      setup: { parts: [], wires: [] },
      tick: (S) => { if (img(S) === 'ARROW_W') S.mem.left = true; if (ran(S, /print\(\s*x\s*\)/) && (S.nums || []).some((v) => v > 600)) S.mem.nums = true; },
      steps: [
        info([5], T('The accelerometer feels which way is down. get_x() is about 0 when the board is flat, + when it leans right, − when it leans left (up to about 1000).', 'एक्सेलेरोमीटर महसूस करता है कि नीचे किधर है। बोर्ड सीधा हो तो get_x() लगभग 0, दाईं ओर झुके तो +, बाईं ओर झुके तो − (लगभग 1000 तक)।', 'Accelerometer mehsoos karta hai ki neeche kidhar hai. Board seedha ho to get_x() lagbhag 0, right jhuke to +, left jhuke to − (lagbhag 1000 tak).')),
        run(),
        act((S) => img(S) === 'YES', T('Hold it flat ("Hold it": flat).', 'इसे सीधा पकड़िए ("ऐसे पकड़िए": सीधा)।', 'Ise seedha pakdiye ("Aise pakdiye": flat).'), T('A tick: level.', 'टिक: सीधा।', 'Tick: seedha.')),
        act((S) => img(S) === 'ARROW_E', T('Lean it to the right ("Hold it": right), or tilt your phone with 📱.', 'इसे दाईं ओर झुकाइए ("ऐसे पकड़िए": दाएँ), या 📱 से अपना फ़ोन झुकाइए।', 'Ise right jhukaiye ("Aise pakdiye": right), ya 📱 se apna phone jhukaiye.'),
          T('The arrow says: lift the right side. Masons and carpenters use a spirit level for straight walls and shelves.', 'तीर कहता है: दाईं तरफ़ उठाइए। राजमिस्त्री और बढ़ई सीधी दीवारों और शेल्फ़ के लिए स्पिरिट लेवल इस्तेमाल करते हैं।', 'Teer kehta hai: right side uthaiye. Raajmistri aur carpenter seedhi deewaron aur shelf ke liye spirit level use karte hain.')),
        act((S) => img(S) === 'ARROW_W', T('Now lean it to the left.', 'अब इसे बाईं ओर झुकाइए।', 'Ab ise left jhukaiye.')),
        edit((src) => /\n    print\(\s*x\s*\)/.test(src), [[/(    x = accelerometer\.get_x\(\)[^\n]*\n)/, '$1    print(x)\n']],
          T('See the numbers: under the x = line add\n    print(x)\nthen Run and open the Serial Monitor.', 'संख्याएँ देखिए: x = वाली लाइन के नीचे लिखिए\n    print(x)\nफिर "चलाइए" और सीरियल मॉनिटर खोलिए।', 'Numbers dekhiye: x = wali line ke neeche likhiye\n    print(x)\nphir Run aur Serial Monitor kholiye.')),
        act((S) => !!M(S).nums, T('Lean it to the right again and watch the numbers.', 'फिर से दाईं ओर झुकाइए और संख्याएँ देखिए।', 'Phir se right jhukaiye aur numbers dekhiye.'),
          T('About 840: it leans 55°. Standing on its side it would read about 1000, the pull of gravity (1 g).', 'लगभग 840: यह 55° झुका है। करवट खड़ा हो तो लगभग 1000 पढ़ेगा, गुरुत्व का खिंचाव (1 g)।', 'Lagbhag 840: yeh 55° jhuka hai. Side par khada ho to lagbhag 1000 padhega, gravity ka khinchav (1 g).')),
      ],
      done: (S) => !!M(S).nums && !!M(S).left },
    // 10 -----------------------------------------------------------------------------------------------------------
    { id: 'mbclap', view: 'mb', code: CLAP, drawer: [],
      title: T('Clap lights', 'ताली से बत्ती', 'Clap lights'),
      goal: T('Switch the lights on and off with a clap, then set a threshold so loud talking does not count.', 'ताली से बत्ती जलाइए और बुझाइए, फिर एक सीमा (threshold) रखिए ताकि ज़ोर से बात करना न गिना जाए।', 'Taali se batti jalaiye aur bujhaiye, phir ek threshold rakhiye taaki zor se baat karna na gina jaye.'),
      world: world({ scene: 'desk', controls: ['sound'], hud: ['mic'], title: T('Clap lights', 'ताली से बत्ती', 'Clap lights') }),
      setup: { parts: [], wires: [] },
      tick: (S, dt) => { const m = S.memRun; const on = lit(S) === 25; const snd = S.wv('sound') || 0;
        if (snd > 200) m.peak = S.t;
        if (m.on !== undefined && on !== m.on) { m.tog = (m.tog || 0) + 1; if (on) m.wasOn = true; else if (m.wasOn) m.offAfter = true;
          const clap = m.peak !== undefined && S.t - m.peak < 0.4; if (!clap && snd > 120) m.talkTog = true; if (clap && ran(S, /set_threshold/)) m.clapTog = true; m.quiet = 0; }
        m.on = on; if (snd > 120 && snd < 200 && !(m.peak !== undefined && S.t - m.peak < 0.4)) m.quiet = (m.quiet || 0) + dt; else if (snd <= 120) m.quiet = 0;
        if (m.quiet > 1.5 && ran(S, /set_threshold/)) m.calm = true; if (m.calm && m.clapTog) S.mem.fixed = true; },
      steps: [
        info([6], T('The micro:bit V2 has a microphone (the little hole by the logo). was_event(SoundEvent.LOUD) is True once after a loud sound, like a clap.', 'micro:bit V2 में माइक्रोफ़ोन है (लोगो के पास छोटा छेद)। was_event(SoundEvent.LOUD) किसी तेज़ आवाज़, जैसे ताली, के बाद एक बार True होता है।', 'micro:bit V2 mein microphone hai (logo ke paas chhota chhed). was_event(SoundEvent.LOUD) kisi tez awaaz, jaise taali, ke baad ek baar True hota hai.')),
        info([7], T('lit = not lit flips True to False and False to True: a toggle, like a switch you press once for on and again for off.', 'lit = not lit True को False और False को True करता है: टॉगल, उस स्विच की तरह जो एक बार दबाने पर चालू और फिर दबाने पर बंद हो।', 'lit = not lit True ko False aur False ko True karta hai: toggle, us switch ki tarah jo ek baar dabane par on aur phir dabane par off ho.')),
        run(),
        act((S) => lit(S) === 25, T('Clap! (press "Clap!")', 'ताली बजाइए! ("ताली!" दबाइए)', 'Taali bajaiye! ("Taali!" dabaiye)'), T('The lights come on.', 'बत्ती जल गई।', 'Batti jal gayi.')),
        act((S) => !!R(S).offAfter, T('Clap again.', 'फिर ताली बजाइए।', 'Phir taali bajaiye.'), T('Off. Your clap is the switch.', 'बंद। आपकी ताली ही स्विच है।', 'Band. Aapki taali hi switch hai.')),
        act((S) => !!R(S).talkTog, T('Slide "Noise in the room" to 150: people talking loudly.', '"कमरे का शोर" को 150 तक सरकाइए: लोग ज़ोर से बात कर रहे हैं।', '"Kamre ka shor" ko 150 tak sarkaiye: log zor se baat kar rahe hain.'),
          T('Oops: loud talking flips the lights too. Above 128 counts as LOUD, and talking at 150 is above it.', 'अरे: ज़ोर की बातचीत भी बत्ती बदल देती है। 128 से ऊपर LOUD गिना जाता है, और 150 की बातचीत उससे ऊपर है।', 'Arre: zor ki baatcheet bhi batti badal deti hai. 128 se upar LOUD gina jaata hai, aur 150 ki baatcheet usse upar hai.')),
        edit((src) => /set_threshold\(\s*SoundEvent\.LOUD\s*,\s*2\d\d\s*\)/.test(src), [[/lit = False\n/, 'lit = False\nmicrophone.set_threshold(SoundEvent.LOUD, 200)\n']],
          T('Only claps: under lit = False add\nmicrophone.set_threshold(SoundEvent.LOUD, 200)\nthen Run.', 'सिर्फ़ ताली: lit = False के नीचे लिखिए\nmicrophone.set_threshold(SoundEvent.LOUD, 200)\nफिर "चलाइए"।', 'Sirf taali: lit = False ke neeche likhiye\nmicrophone.set_threshold(SoundEvent.LOUD, 200)\nphir Run.')),
        act((S) => !!M(S).fixed, T('Keep the noise at 150 for a moment: nothing happens. Then clap.', 'शोर को थोड़ी देर 150 पर रखिए: कुछ नहीं होता। फिर ताली बजाइए।', 'Shor ko thodi der 150 par rakhiye: kuch nahi hota. Phir taali bajaiye.'),
          T('Talking (150) is below 200, a clap (about 230) is above it. A threshold is the line a reading must cross.', 'बातचीत (150) 200 से नीचे है, ताली (लगभग 230) ऊपर। Threshold वह रेखा है जिसे रीडिंग को पार करना होता है।', 'Baatcheet (150) 200 se neeche hai, taali (lagbhag 230) upar. Threshold woh line hai jise reading ko paar karna hota hai.')),
      ],
      done: (S) => !!M(S).fixed },
    // 11 -----------------------------------------------------------------------------------------------------------
    { id: 'mbnoise', view: 'mb', code: NOISE, drawer: [], serial: true,
      title: T('Noise meter', 'शोर मापक', 'Noise meter'),
      goal: T('A noise meter for the classroom: a smile when it is quiet, a warning face when it gets too loud.', 'कक्षा के लिए शोर मापक: शांति में मुस्कान, बहुत शोर में चेतावनी वाला चेहरा।', 'Class ke liye shor maapak: shanti mein muskaan, bahut shor mein warning wala chehra.'),
      world: world({ scene: 'desk', controls: ['sound'], hud: ['mic'], title: T('Noise meter', 'शोर मापक', 'Noise meter') }),
      setup: { parts: [], wires: [] },
      tick: (S) => { const s = S.wv('sound') || 0; if (ran(S, /level > 100/) && img(S) === 'ANGRY' && s > 100 && s < 150) S.mem.lib = true; },
      steps: [
        info([5], T('microphone.sound_level() is how loud it is right now: 0 is silent, 255 very loud.', 'microphone.sound_level() अभी की आवाज़ बताता है: 0 बिल्कुल शांत, 255 बहुत तेज़।', 'microphone.sound_level() abhi ki awaaz batata hai: 0 bilkul shaant, 255 bahut tez.')),
        info([7, 8, 9, 10, 11, 12], T('if, elif, else: Python asks each question in turn, and the first True one wins. Above 150: angry; above 80: so-so; else: happy.', 'if, elif, else: Python बारी-बारी हर सवाल पूछता है, और पहला True वाला जीतता है। 150 से ऊपर: ग़ुस्सा; 80 से ऊपर: ठीक-ठाक; वरना: ख़ुश।', 'if, elif, else: Python baari-baari har sawaal poochhta hai, aur pehla True wala jeetta hai. 150 se upar: gussa; 80 se upar: theek-thaak; warna: khush.')),
        run(),
        watch((S) => img(S) === 'HAPPY', T('Watch the face.', 'चेहरा देखिए।', 'Chehra dekhiye.'), T('A quiet room: a smile.', 'शांत कमरा: मुस्कान।', 'Shaant kamra: muskaan.')),
        act((S) => img(S) === 'MEH' && S.wv('sound') > 80, T('Slide "Noise in the room" to 120: a class working in groups.', '"कमरे का शोर" को 120 तक सरकाइए: समूह में काम करती कक्षा।', '"Kamre ka shor" ko 120 tak sarkaiye: group mein kaam karti class.'), T('So-so: busy, but fine.', 'ठीक-ठाक: व्यस्त, पर ठीक।', 'Theek-thaak: busy, par theek.')),
        act((S) => img(S) === 'ANGRY', T('Slide it to 220: everyone shouting.', 'इसे 220 तक सरकाइए: सब चिल्ला रहे हैं।', 'Ise 220 tak sarkaiye: sab chilla rahe hain.'), T('An angry face. Libraries and hospitals put up quiet-please signs like this.', 'ग़ुस्से वाला चेहरा। पुस्तकालय और अस्पताल ऐसे ही "शांति रखें" के संकेत लगाते हैं।', 'Gusse wala chehra. Library aur hospital aise hi "shanti rakhein" ke sign lagaate hain.')),
        edit((src) => /level > 100/.test(src) && /level > 40/.test(src), [[/level > 150/, 'level > 100'], [/level > 80/, 'level > 40']],
          T('Make it a library sign: change 150 to 100 and 80 to 40, then Run.', 'इसे पुस्तकालय का संकेत बनाइए: 150 को 100 और 80 को 40 कीजिए, फिर "चलाइए"।', 'Ise library ka sign banaiye: 150 ko 100 aur 80 ko 40 karo, phir Run.')),
        act((S) => !!M(S).lib, T('Slide the noise to 120 again.', 'शोर को फिर 120 पर लाइए।', 'Shor ko phir 120 par laiye.'), T('The same group-work noise is too loud for a library: each place needs its own limit.', 'वही समूह-काम वाला शोर पुस्तकालय के लिए बहुत ज़्यादा है: हर जगह की अपनी सीमा होती है।', 'Wahi group-kaam wala shor library ke liye bahut zyada hai: har jagah ki apni seema hoti hai.')),
      ],
      done: (S) => !!M(S).lib },
    // 12 -----------------------------------------------------------------------------------------------------------
    { id: 'mbhamster', view: 'mb', code: HAMSTER, drawer: [],
      title: T('Pet hamster', 'पालतू हैम्स्टर', 'Pet hamster'),
      goal: T('A virtual pet with feelings: stroke it, shake it, or leave it alone, and see how it reacts.', 'भावनाओं वाला आभासी पालतू: इसे सहलाइए, हिलाइए, या अकेला छोड़िए, और देखिए यह कैसे जवाब देता है।', 'Feelings wala virtual pet: ise sehlaiye, hilaiye, ya akela chhodiye, aur dekhiye yeh kaise react karta hai.'),
      world: world({ scene: 'desk', controls: ['logo', 'shake'], hud: [], title: T('Pet hamster', 'पालतू हैम्स्टर', 'Pet hamster') }),
      setup: { parts: [], wires: [] },
      tick: (S) => { const m = S.memRun; const p = (S.wv('presses') || {}).logo || 0, sh = S.wv('shakes') || 0; const i = img(S);
        if (m.t0 === undefined || p !== m.p || sh !== m.sh) { m.t0 = S.t; m.p = p; m.sh = sh; m.slept = false; }
        if (i === 'CONFUSED') m.sick = true; if (m.sick && i === 'HAPPY') m.better = true;
        if (i === 'ASLEEP' && !m.slept) { m.slept = true; m.bored = S.t - m.t0; if (ran(S, /> 5000/) && m.bored < 8) S.mem.fast = true; } },
      steps: [
        info([8], T('pin_logo.is_touched() is True while a finger is on the gold logo: it is a touch sensor.', 'जब तक उँगली सुनहरे लोगो पर है, pin_logo.is_touched() True है: यह टच सेंसर है।', 'Jab tak ungli sunehre logo par hai, pin_logo.is_touched() True hai: yeh touch sensor hai.')),
        info([5, 11, 16], T('last remembers when you last played with it. running_time() - last is how long ago that was.', 'last याद रखता है कि आपने आख़िरी बार कब खेला। running_time() - last बताता है कि वह कितनी देर पहले था।', 'last yaad rakhta hai ki aapne aakhri baar kab khela. running_time() - last batata hai ki woh kitni der pehle tha.')),
        run(),
        act((S) => !!R(S).sick, T('Shake it.', 'इसे हिलाइए।', 'Ise hilaiye.'), T('A dizzy face and a sad sound: hamsters don\'t like being shaken!', 'चक्कर वाला चेहरा और उदास आवाज़: हैम्स्टर को हिलाया जाना पसंद नहीं!', 'Chakkar wala chehra aur udaas awaaz: hamster ko hilaya jaana pasand nahi!')),
        act((S) => !!R(S).better, T('Stroke it: press "Touch the logo".', 'इसे सहलाइए: "लोगो छूइए" दबाइए।', 'Ise sehlaiye: "Logo touch karo" dabaiye.'), T('It giggles and smiles again.', 'यह खिलखिलाता है और फिर मुस्कुराता है।', 'Yeh khilkhilata hai aur phir muskurata hai.')),
        watch((S) => img(S) === 'ASLEEP', T('Now leave it alone for 10 seconds.', 'अब इसे 10 सेकंड अकेला छोड़िए।', 'Ab ise 10 second akela chhodiye.'), T('Zzz: bored, it fell asleep.', 'ज़्ज़्ज़: ऊबकर सो गया।', 'Zzz: bore hokar so gaya.')),
        edit((src) => /> 5000/.test(src) && !/> 10000/.test(src), [[/> 10000/, '> 5000']],
          T('A sleepier hamster: change 10000 to 5000 (5 seconds), then Run.', 'ज़्यादा नींद वाला हैम्स्टर: 10000 को 5000 (5 सेकंड) कीजिए, फिर "चलाइए"।', 'Zyada neend wala hamster: 10000 ko 5000 (5 second) karo, phir Run.')),
        act((S) => !!M(S).fast, T('Stroke it once, then wait.', 'एक बार सहलाइए, फिर रुकिए।', 'Ek baar sehlaiye, phir rukiye.'), T('Asleep after 5 seconds now. Real pets need attention too: feed, play, rest.', 'अब 5 सेकंड में सो जाता है। असली पालतू को भी ध्यान चाहिए: खाना, खेल, आराम।', 'Ab 5 second mein so jaata hai. Asli pet ko bhi dhyaan chahiye: khaana, khel, aaraam.')),
      ],
      done: (S) => !!M(S).fast },
    // 13 -----------------------------------------------------------------------------------------------------------
    { id: 'mbblow', view: 'mb', code: BLOW, drawer: [],
      title: T('Blow away the LEDs', 'फूँक से एलईडी बुझाइए', 'Blow away the LEDs'),
      goal: T('Like birthday candles: blow on the microphone and the lights go out one by one.', 'जन्मदिन की मोमबत्तियों की तरह: माइक्रोफ़ोन पर फूँकिए और बत्तियाँ एक-एक करके बुझती हैं।', 'Birthday candles ki tarah: microphone par phoonkiye aur battiyan ek-ek karke bujhti hain.'),
      world: world({ scene: 'desk', controls: ['sound'], hud: ['mic'], title: T('Blow away the LEDs', 'फूँक से एलईडी बुझाइए', 'Phoonk se LED bujhaiye') }),
      setup: { parts: [], wires: [] },
      tick: (S, dt) => { const m = S.memRun; const s = S.wv('sound') || 0; const n = lit(S);
        if (ran(S, /> 1[5-9]\d/)) { if (s > 110 && s < 170 && n === 25) m.soft = (m.soft || 0) + dt; if ((m.soft || 0) > 1 && img(S) === 'HAPPY') S.mem.hard = true; } },
      steps: [
        info([8], T('Blowing on a microphone makes a loud rushing noise: sound_level() goes above 100.', 'माइक्रोफ़ोन पर फूँकने से तेज़ सरसराहट होती है: sound_level() 100 से ऊपर जाता है।', 'Microphone par phoonkne se tez sarsaraahat hoti hai: sound_level() 100 se upar jaata hai.')),
        info([9, 10, 11, 12, 13], T('Each time it hears you, it picks a random LED; if that LED is still on, it switches it off. left counts how many are still on.', 'हर बार आवाज़ सुनकर यह एक बेतरतीब एलईडी चुनता है; अगर वह अभी जल रही है तो उसे बुझा देता है। left गिनता है कितनी अभी जल रही हैं।', 'Har baar awaaz sunkar yeh ek random LED chunta hai; agar woh abhi jal rahi hai to use bujha deta hai. left ginta hai kitni abhi jal rahi hain.')),
        run(),
        act((S) => img(S) === 'HAPPY', T('Blow: slide "Noise in the room" to 220 and hold it. (On a real micro:bit, blow on the hole by the logo.)', 'फूँकिए: "कमरे का शोर" को 220 पर सरकाकर रखिए। (असली micro:bit पर लोगो के पास वाले छेद पर फूँकिए।)', 'Phoonkiye: "Kamre ka shor" ko 220 par sarka kar rakhiye. (Asli micro:bit par logo ke paas wale chhed par phoonkiye.)'),
          T('One by one the lights go out, and when all 25 are gone: a smile. Happy birthday!', 'एक-एक करके बत्तियाँ बुझती हैं, और सारी 25 बुझने पर: मुस्कान। जन्मदिन मुबारक!', 'Ek-ek karke battiyan bujhti hain, aur saari 25 bujhne par: muskaan. Happy birthday!')),
        edit((src) => /sound_level\(\) > 1[5-9]\d/.test(src), [[/sound_level\(\) > 100/, 'sound_level() > 180']],
          T('You must blow harder: change > 100 to > 180, then Run.', 'ज़ोर से फूँकना पड़ेगा: > 100 को > 180 कीजिए, फिर "चलाइए"।', 'Zor se phoonkna padega: > 100 ko > 180 karo, phir Run.')),
        act((S) => !!M(S).hard, T('Blow softly first (noise 150): nothing happens. Then blow hard (220).', 'पहले धीरे फूँकिए (शोर 150): कुछ नहीं होता। फिर ज़ोर से (220)।', 'Pehle dheere phoonkiye (shor 150): kuch nahi hota. Phir zor se (220).'),
          T('A soft breath is below 180 now. Games often get harder by moving a limit like this.', 'हल्की फूँक अब 180 से नीचे है। खेल अक्सर ऐसे ही किसी सीमा को बदलकर कठिन बनाए जाते हैं।', 'Halki phoonk ab 180 se neeche hai. Games aksar aise hi kisi seema ko badal kar mushkil banaye jaate hain.')),
      ],
      done: (S) => !!M(S).hard },
    // 14 -----------------------------------------------------------------------------------------------------------
    { id: 'mbpoem', view: 'mb', code: POEM, drawer: [],
      title: T('Poetry generator', 'कविता मशीन', 'Poetry generator'),
      goal: T('A machine that makes up little poems by picking words from lists, and your own words in it.', 'एक मशीन जो सूचियों से शब्द चुनकर छोटी कविताएँ बनाती है, और उसमें आपके अपने शब्द।', 'Ek machine jo lists se shabd chunkar chhoti kavitayein banati hai, aur usmein aapke apne shabd.'),
      world: world({ scene: 'desk', controls: ['A'], hud: [], title: T('Poetry machine', 'कविता मशीन', 'Kavita machine') }),
      setup: { parts: [], wires: [] },
      tick: (S) => { const m = /WHO = \[([^\]]*)\]/.exec(S.runSrc || ''); if (!m) return; const mine = [...m[1].matchAll(/"([^"]+)"/g)].map((x) => x[1]).filter((w) => !['THE CAT', 'MY FRIEND', 'A BIRD', 'THE MOON'].includes(w));
        if (mine.length && texts(S).some((t) => mine.some((w) => t.startsWith(w + ' ')))) S.mem.mine = true; },
      steps: [
        info([5, 6, 7], T('Three lists of words: who, does what, where. random.choice() picks one word from a list.', 'शब्दों की तीन सूचियाँ: कौन, क्या करता है, कहाँ। random.choice() सूची से एक शब्द चुनता है।', 'Shabdon ki teen lists: kaun, kya karta hai, kahan. random.choice() list se ek shabd chunta hai.')),
        info([10], T('+ joins words together, and " " puts a space between them. 4 × 4 × 4 = 64 different poems!', '+ शब्दों को जोड़ता है, और " " उनके बीच जगह देता है। 4 × 4 × 4 = 64 अलग कविताएँ!', '+ shabdon ko jodta hai, aur " " unke beech space deta hai. 4 × 4 × 4 = 64 alag kavitayein!')),
        run(),
        act((S) => has(S, /^[A-Z ]+ (SINGS|DANCES|SLEEPS|SMILES) /), T('Press A for a poem.', 'कविता के लिए A दबाइए।', 'Kavita ke liye A dabaiye.'), T('A line of poetry nobody wrote: the machine chose it.', 'कविता की एक पंक्ति जो किसी ने नहीं लिखी: मशीन ने चुनी।', 'Kavita ki ek line jo kisi ne nahi likhi: machine ne chuni.')),
        edit((src) => { const m = /WHO = \[([^\]]*)\]/.exec(src); return !!m && (m[1].match(/"[^"]+"/g) || []).length >= 5; }, [[/"THE MOON"\]/, '"THE MOON", "GRANDMA"]']],
          T('Add your own word: at the end of the WHO list, after "THE MOON", add , "GRANDMA" (or any name, in capitals), then Run.', 'अपना शब्द जोड़िए: WHO सूची के आख़िर में, "THE MOON" के बाद , "GRANDMA" लिखिए (या कोई भी नाम, बड़े अक्षरों में), फिर "चलाइए"।', 'Apna shabd jodiye: WHO list ke aakhir mein, "THE MOON" ke baad , "GRANDMA" likhiye (ya koi bhi naam, capital letters mein), phir Run.')),
        act((S) => !!M(S).mine, T('Press A until your word comes.', 'अपना शब्द आने तक A दबाते रहिए।', 'Apna shabd aane tak A dabaate rahiye.'), T('Now 5 × 4 × 4 = 80 poems. Add more words to every list for a whole book of poems.', 'अब 5 × 4 × 4 = 80 कविताएँ। हर सूची में और शब्द जोड़िए और कविताओं की पूरी किताब बनाइए।', 'Ab 5 × 4 × 4 = 80 kavitayein. Har list mein aur shabd jodiye aur kavitaon ki poori kitaab banaiye.')),
      ],
      done: (S) => !!M(S).mine },
    // 15 -----------------------------------------------------------------------------------------------------------
    { id: 'mbsteady', view: 'mb', code: STEADY, drawer: [],
      title: T('Steady-hand wire game', 'स्थिर हाथ वाला तार का खेल', 'Steady-hand wire game'),
      goal: T('The fairground game: a wire on pin 0, a loop on GND. Every touch buzzes and counts as a mistake.', 'मेले वाला खेल: पिन 0 पर तार, GND पर छल्ला। हर छूना भिनभिनाता है और गलती गिना जाता है।', 'Mele wala game: pin 0 par taar, GND par chhalla. Har touch bhinbhinata hai aur galti gina jaata hai.'),
      world: world({ scene: 'desk', controls: ['P0', 'A'], hud: [], title: T('Steady hand', 'स्थिर हाथ', 'Steady hand') }),
      setup: { parts: [], wires: [] },
      tick: (S) => { if (ran(S, /GAME OVER/) && has(S, /^GAME OVER$/)) S.mem.over = true; },
      steps: [
        info([1, 2, 9], T('Bend a long wire into a wavy shape and join it to pin 0; make a loop of wire round it, joined to GND. When the loop touches the wire, pin 0 and GND are joined and pin0.is_touched() is True.', 'एक लंबे तार को लहरदार मोड़िए और पिन 0 से जोड़िए; उसके चारों ओर तार का छल्ला बनाइए, GND से जुड़ा। छल्ला तार को छुए तो पिन 0 और GND जुड़ जाते हैं और pin0.is_touched() True होता है।', 'Ek lambe taar ko lehardaar modiye aur pin 0 se jodiye; uske chaaron taraf taar ka chhalla banaiye, GND se juda. Chhalla taar ko chhue to pin 0 aur GND jud jaate hain aur pin0.is_touched() True hota hai.')),
        info([13, 14], T('while pin0.is_touched(): waits until the loop is off the wire, so one touch counts once, not a hundred times.', 'while pin0.is_touched(): छल्ला तार से हटने तक रुकता है, ताकि एक छूना एक ही बार गिना जाए, सौ बार नहीं।', 'while pin0.is_touched(): chhalla taar se hatne tak rukta hai, taaki ek touch ek hi baar gina jaye, sau baar nahi.')),
        run(),
        act((S) => lastNum(S) === 1, T('Oops, the loop touches the wire: press "Touch pin 0".', 'अरे, छल्ला तार से छू गया: "पिन 0 छूइए" दबाइए।', 'Arre, chhalla taar se chhu gaya: "Pin 0 touch karo" dabaiye.'), T('A buzz and 1: one mistake.', 'भिनभिनाहट और 1: एक गलती।', 'Bhinbhinaahat aur 1: ek galti.')),
        act((S) => lastNum(S) === 3, T('Touch it twice more.', 'दो बार और छुइए।', 'Do baar aur chhuiye.'), T('3 mistakes. Shaky hands buzz more: the game trains a steady hand, like a surgeon\'s.', '3 गलतियाँ। काँपते हाथ ज़्यादा भिनभिनाते हैं: यह खेल हाथ को स्थिर बनाता है, सर्जन की तरह।', '3 galtiyan. Kaanpte haath zyada bhinbhinaate hain: yeh game haath ko steady banata hai, surgeon ki tarah.')),
        act((S) => img(S) === 'HAPPY', T('Press A for the next player.', 'अगले खिलाड़ी के लिए A दबाइए।', 'Agle player ke liye A dabaiye.'), T('The count starts again from 0.', 'गिनती फिर 0 से शुरू।', 'Ginti phir 0 se shuru.')),
        edit((src) => /if mistakes\s*(==|>=)\s*3\s*:/.test(src) && /GAME OVER/.test(src), [[/(        display\.show\(mistakes\)\n)/, '$1        if mistakes == 3:\n            display.scroll("GAME OVER")\n']],
          T('Three strikes and you\'re out: under display.show(mistakes) add\n        if mistakes == 3:\n            display.scroll("GAME OVER")\nthen Run.', 'तीन गलतियाँ और खेल ख़त्म: display.show(mistakes) के नीचे लिखिए\n        if mistakes == 3:\n            display.scroll("GAME OVER")\nफिर "चलाइए"।', 'Teen galtiyan aur game khatam: display.show(mistakes) ke neeche likhiye\n        if mistakes == 3:\n            display.scroll("GAME OVER")\nphir Run.')),
        act((S) => !!M(S).over, T('Touch the wire three times.', 'तार को तीन बार छुइए।', 'Taar ko teen baar chhuiye.'), T('GAME OVER. == asks "is it equal?"; a single = would store a value instead.', 'GAME OVER। == पूछता है "क्या बराबर है?"; अकेला = कोई मान रख देता।', 'GAME OVER. == poochhta hai "kya barabar hai?"; akela = koi value rakh deta.')),
      ],
      done: (S) => !!M(S).over },
    // 16 -----------------------------------------------------------------------------------------------------------
    { id: 'mbtraits', view: 'mb', code: TRAITS, drawer: [],
      title: T('Population trait counter', 'कक्षा सर्वे गिनती', 'Population trait counter'),
      goal: T('Survey your class (can you roll your tongue?), count yes and no, and turn the result into a percentage.', 'अपनी कक्षा का सर्वे कीजिए (क्या आप जीभ मोड़ सकते हैं?), हाँ और ना गिनिए, और नतीजे को प्रतिशत में बदलिए।', 'Apni class ka survey kijiye (kya aap jeebh mod sakte ho?), haan aur na giniye, aur result ko percentage mein badaliye.'),
      world: world({ scene: 'desk', controls: ['A', 'B', 'logo'], hud: ['buttons'], title: T('Class survey', 'कक्षा सर्वे', 'Class survey') }),
      setup: { parts: [], wires: [] },
      tick: (S) => { for (const t of texts(S)) { const m = /^(\d+) YES (\d+) NO$/.exec(t); if (m && +m[1] + +m[2] >= 8) S.mem.eight = true; } if (ran(S, /yes \* 100 \/\/ \(yes \+ no\)/) && has(S, /^\d+%$/)) S.mem.pct = true; },
      steps: [
        info([7, 8, 10, 11], T('Ask each classmate: "Can you roll your tongue?" Press A for yes, B for no. yes and no count the answers.', 'हर सहपाठी से पूछिए: "क्या आप जीभ मोड़ सकते हैं?" हाँ के लिए A, ना के लिए B दबाइए। yes और no जवाब गिनते हैं।', 'Har classmate se poochhiye: "Kya aap jeebh mod sakte ho?" Haan ke liye A, na ke liye B dabaiye. yes aur no jawaab ginte hain.')),
        run(),
        act((S) => !!M(S).eight, T('Ask 8 friends (press A or B for each), then touch the logo.', '8 दोस्तों से पूछिए (हर एक के लिए A या B), फिर लोगो छूइए।', '8 doston se poochhiye (har ek ke liye A ya B), phir logo chhuiye.'),
          T('Your class data! Scientists count traits like this to see how common they are in a population.', 'आपकी कक्षा का डेटा! वैज्ञानिक ऐसे ही गुण गिनते हैं, यह देखने के लिए कि आबादी में वे कितने आम हैं।', 'Aapki class ka data! Scientists aise hi traits ginte hain, yeh dekhne ke liye ki population mein woh kitne common hain.')),
        edit((src) => /yes \* 100 \/\/ \(yes \+ no\)/.test(src), [[/display\.scroll\(str\(yes\) \+ " YES " \+ str\(no\) \+ " NO"\)/, 'display.scroll(str(yes * 100 // (yes + no)) + "%")']],
          T('Show the share who said yes: change the scroll line to\n        display.scroll(str(yes * 100 // (yes + no)) + "%")\nthen Run.', 'हाँ कहने वालों का हिस्सा दिखाइए: scroll वाली लाइन को ऐसा कीजिए\n        display.scroll(str(yes * 100 // (yes + no)) + "%")\nफिर "चलाइए"।', 'Haan kehne walon ka hissa dikhaiye: scroll wali line ko aisa karo\n        display.scroll(str(yes * 100 // (yes + no)) + "%")\nphir Run.')),
        act((S) => !!M(S).pct, T('Count again: 3 yes and 1 no, then touch the logo. (Touch it before anyone votes and see what happens!)', 'फिर गिनिए: 3 हाँ और 1 ना, फिर लोगो छूइए। (किसी के वोट से पहले छूकर देखिए क्या होता है!)', 'Phir giniye: 3 haan aur 1 na, phir logo chhuiye. (Kisi ke vote se pehle chhoo kar dekhiye kya hota hai!)'),
          T('75%: three out of four. With no votes, yes + no is 0, and nobody can divide by 0: Python stops with ZeroDivisionError.', '75%: चार में से तीन। बिना वोट के yes + no 0 है, और 0 से कोई भाग नहीं दे सकता: Python ZeroDivisionError देकर रुक जाता है।', '75%: chaar mein se teen. Bina vote ke yes + no 0 hai, aur 0 se koi divide nahi kar sakta: Python ZeroDivisionError dekar ruk jaata hai.')),
      ],
      done: (S) => !!M(S).pct },
    // 17 -----------------------------------------------------------------------------------------------------------
    { id: 'mbsnap', view: 'mb', code: SNAP, drawer: [],
      title: T('Snap the dot', 'बिंदु पकड़िए', 'Snap the dot'),
      goal: T('A dot runs to and fro: press A exactly when it is in the middle. Then make it faster.', 'एक बिंदु आगे-पीछे दौड़ता है: ठीक बीच में होने पर A दबाइए। फिर इसे तेज़ कीजिए।', 'Ek dot aage-peeche daudta hai: theek beech mein hone par A dabaiye. Phir ise tez kijiye.'),
      world: world({ scene: 'desk', controls: ['A'], hud: ['buttons'], title: T('Snap the dot', 'बिंदु पकड़िए', 'Dot pakdiye') }),
      setup: { parts: [], wires: [] },
      tick: (S) => { if (ran(S, /sleep\(100\)/) && img(S) === 'YES') S.mem.fast = true; },
      steps: [
        info([8, 9, 10], T('Each turn of the loop draws the dot at x and waits 200 ms. Your press is checked after the wait, so it counts where the dot was when you pressed.', 'लूप का हर चक्कर बिंदु को x पर बनाता है और 200 ms रुकता है। आपका दबाना रुकने के बाद जाँचा जाता है, इसलिए वही जगह गिनी जाती है जहाँ बिंदु दबाते समय था।', 'Loop ka har chakkar dot ko x par banata hai aur 200 ms rukta hai. Aapka dabana rukne ke baad check hota hai, isliye wahi jagah gini jaati hai jahan dot dabaate samay tha.')),
        info([19, 20, 21], T('step is +1 or −1. At an edge, step = -step turns the dot round, like a ball bouncing off a wall.', 'step +1 या −1 है। किनारे पर step = -step बिंदु को पलट देता है, दीवार से टकराकर लौटती गेंद की तरह।', 'step +1 ya −1 hai. Kinare par step = -step dot ko palat deta hai, deewar se takra kar lautti ball ki tarah.')),
        run(),
        act((S) => S.w('img:YES'), T('Press A when the dot is in the middle.', 'जब बिंदु बीच में हो, A दबाइए।', 'Jab dot beech mein ho, A dabaiye.'), T('A tick and your score.', 'टिक और आपका स्कोर।', 'Tick aur aapka score.')),
        act((S) => S.w('img:NO'), T('Now press when it is at an edge.', 'अब किनारे पर होने पर दबाइए।', 'Ab kinare par hone par dabaiye.'), T('A cross: missed.', 'क्रॉस: चूक गए।', 'Cross: chook gaye.')),
        edit((src) => /\n    sleep\(100\)/.test(src) && !/\n    sleep\(200\)/.test(src), [[/\n    sleep\(200\)/, '\n    sleep(100)']],
          T('Level 2: change sleep(200) to sleep(100): the dot runs twice as fast. Then Run.', 'लेवल 2: sleep(200) को sleep(100) कीजिए: बिंदु दोगुना तेज़ दौड़ेगा। फिर "चलाइए"।', 'Level 2: sleep(200) ko sleep(100) karo: dot do-guna tez daudega. Phir Run.')),
        act((S) => !!M(S).fast, T('Snap it in the middle again.', 'फिर से बीच में पकड़िए।', 'Phir se beech mein pakdiye.'), T('Harder! Games get harder by making things faster, and so do our reflexes with practice.', 'मुश्किल! खेल चीज़ें तेज़ करके कठिन होते हैं, और अभ्यास से हमारी फुर्ती भी बढ़ती है।', 'Mushkil! Games cheezein tez karke mushkil hote hain, aur practice se hamari furti bhi badhti hai.')),
      ],
      done: (S) => !!M(S).fast },
    // 18 -----------------------------------------------------------------------------------------------------------
    { id: 'mb8ball', view: 'mb', code: EIGHT, drawer: [],
      title: T('Magic 8-ball', 'जादुई 8-बॉल', 'Magic 8-ball'),
      goal: T('Ask a question, shake, and get an answer after a little "thinking" animation; then make one answer more likely.', 'सवाल पूछिए, हिलाइए, और थोड़े "सोचने" वाले एनिमेशन के बाद जवाब पाइए; फिर एक जवाब की संभावना बढ़ाइए।', 'Sawaal poochhiye, hilaiye, aur thode "sochne" wale animation ke baad jawaab paaiye; phir ek jawaab ka chance badhaiye.'),
      world: world({ scene: 'desk', controls: ['shake', 'phone'], hud: ['shakes'], title: T('Magic 8-ball', 'जादुई 8-बॉल', 'Magic 8-ball') }),
      setup: { parts: [], wires: [] },
      tick: (S) => { if (ran(S, /"YES", "YES"|"YES",\s*"NO",\s*"MAYBE",\s*"ASK AGAIN",\s*"YES"/) && has(S, /^YES$/)) S.mem.yes = true; },
      steps: [
        info([5, 9], T('Image.ALL_CLOCKS is a list of 12 clock pictures: shown one after another every 60 ms, the hand spins while it "thinks".', 'Image.ALL_CLOCKS 12 घड़ी-तस्वीरों की सूची है: हर 60 ms पर एक के बाद एक, सुई घूमती है जैसे यह "सोच" रहा हो।', 'Image.ALL_CLOCKS 12 ghadi-tasveeron ki list hai: har 60 ms par ek ke baad ek, sui ghoomti hai jaise yeh "soch" raha ho.')),
        run(),
        act((S) => has(S, /^(YES|NO|MAYBE|ASK AGAIN)$/), T('Ask it a question, then shake it.', 'इससे सवाल पूछिए, फिर हिलाइए।', 'Isse sawaal poochhiye, phir hilaiye.'), T('An answer, chosen at random: it doesn\'t know anything really!', 'जवाब, बेतरतीब ढंग से चुना हुआ: इसे सच में कुछ नहीं पता!', 'Jawaab, random tareeke se chuna hua: ise sach mein kuch nahi pata!')),
        edit((src) => { const m = /ANSWERS = \[([^\]]*)\]/.exec(src); return !!m && (m[1].match(/"YES"/g) || []).length >= 2; }, [[/"ASK AGAIN"\]/, '"ASK AGAIN", "YES"]']],
          T('A friendlier ball: add a second "YES" at the end of ANSWERS, then Run.', 'ज़्यादा दोस्ताना बॉल: ANSWERS के आख़िर में दूसरा "YES" जोड़िए, फिर "चलाइए"।', 'Zyada dostana ball: ANSWERS ke aakhir mein doosra "YES" jodiye, phir Run.')),
        act((S) => !!M(S).yes, T('Shake until it says YES.', 'YES आने तक हिलाइए।', 'YES aane tak hilaiye.'), T('YES is now 2 of 5 answers: 40% instead of 25%. Putting a choice in a list twice makes it twice as likely.', 'अब 5 में से 2 जवाब YES हैं: 25% की जगह 40%। सूची में दो बार डालने से संभावना दोगुनी।', 'Ab 5 mein se 2 jawaab YES hain: 25% ki jagah 40%. List mein do baar daalne se chance do-guna.')),
      ],
      done: (S) => !!M(S).yes },
    // 19 -----------------------------------------------------------------------------------------------------------
    { id: 'mbhilo', view: 'mb', code: HILO, drawer: [],
      title: T('Guess my number', 'मेरा नंबर पहचानो', 'Mera number pehchano'),
      goal: T('Find the hidden number with "higher" and "lower" clues, in as few tries as you can.', '"ऊपर" और "नीचे" के इशारों से छिपी संख्या ढूँढिए, जितनी कम कोशिशों में हो सके।', '"Upar" aur "neeche" ke ishaaron se chhupi sankhya dhoondhiye, jitni kam koshishon mein ho sake.'),
      world: world({ scene: 'desk', controls: ['A', 'B'], hud: ['buttons'], title: T('Guess my number', 'मेरा नंबर पहचानो', 'Mera number pehchano') }),
      setup: { parts: [], wires: [] },
      tick: (S) => { if (ran(S, /randint\(1, 20\)/) && ran(S, /% 20 \+ 1/) && has(S, /^\d+ TRIES$/)) S.mem.twenty = true; },
      steps: [
        info([6, 12], T('secret is the hidden number. guess % 9 + 1 adds one, and after 9 goes back to 1.', 'secret छिपी संख्या है। guess % 9 + 1 एक जोड़ता है, और 9 के बाद फिर 1 पर आता है।', 'secret chhupi sankhya hai. guess % 9 + 1 ek jodta hai, aur 9 ke baad phir 1 par aata hai.')),
        run(),
        act((S) => has(S, /^\d+ TRIES$/), T('Find it: A to change your guess, B to check. Follow the arrows.', 'इसे ढूँढिए: अनुमान बदलने के लिए A, जाँचने के लिए B। तीर के हिसाब से चलिए।', 'Ise dhoondhiye: anumaan badalne ke liye A, check karne ke liye B. Teer ke hisaab se chaliye.'), T('Found! Best trick: always guess the middle of what is left (5 first). Then you never need more than 4 tries.', 'मिल गया! सबसे अच्छी तरकीब: हमेशा बचे हुए का बीच वाला अनुमान लगाइए (पहले 5)। तब 4 से ज़्यादा कोशिश कभी नहीं लगेगी।', 'Mil gaya! Sabse achhi trick: hamesha bache hue ka beech wala anumaan lagaiye (pehle 5). Tab 4 se zyada koshish kabhi nahi lagegi.')),
        edit((src) => /randint\(1, 20\)/.test(src) && !/randint\(1, 9\)/.test(src) && /% 20 \+ 1/.test(src), [[/randint\(1, 9\)/g, 'randint(1, 20)'], [/% 9 \+ 1/, '% 20 + 1']],
          T('Harder: numbers up to 20. Change both randint(1, 9) to randint(1, 20) and % 9 + 1 to % 20 + 1, then Run.', 'कठिन: 20 तक की संख्याएँ। दोनों randint(1, 9) को randint(1, 20) और % 9 + 1 को % 20 + 1 कीजिए, फिर "चलाइए"।', 'Mushkil: 20 tak ke numbers. Dono randint(1, 9) ko randint(1, 20) aur % 9 + 1 ko % 20 + 1 karo, phir Run.')),
        act((S) => !!M(S).twenty, T('Find the new number.', 'नई संख्या ढूँढिए।', 'Nayi sankhya dhoondhiye.'), T('With halving, 20 numbers need at most 5 tries. Computers search huge lists the same way.', 'आधा करते जाने से 20 संख्याओं में ज़्यादा से ज़्यादा 5 कोशिश। कंप्यूटर बड़ी सूचियाँ ऐसे ही खोजते हैं।', 'Aadha karte jaane se 20 numbers mein zyada se zyada 5 koshish. Computer badi lists aise hi khojte hain.')),
      ],
      done: (S) => !!M(S).twenty },
    // 20 -----------------------------------------------------------------------------------------------------------
    { id: 'mbbike', view: 'mb', code: BIKE, drawer: [],
      title: T('Bike light with modes', 'मोड वाली साइकिल लाइट', 'Mode wali cycle light'),
      goal: T('One button, three modes: off, on and flashing, like a real bike light. Then make it flash faster.', 'एक बटन, तीन मोड: बंद, चालू और चमकती, असली साइकिल लाइट की तरह। फिर इसे तेज़ चमकाइए।', 'Ek button, teen mode: band, chalu aur chamakti, asli cycle light ki tarah. Phir ise tez chamkaiye.'),
      world: world({ scene: 'desk', controls: ['A'], hud: ['buttons'], title: T('Bike light', 'साइकिल लाइट', 'Cycle light') }),
      setup: { parts: [], wires: [] },
      tick: (S, dt) => { const m = S.memRun; const on = lit(S) === 25; if (m.on !== undefined && on !== m.on) { (m.flips || (m.flips = [])).push(S.t); m.flips = m.flips.filter((x) => S.t - x < 2); } m.on = on;
        const f = (m.flips || []).length; if (f >= 6) m.flash = true; if (ran(S, /\/\/ 100 % 2/) && f >= 14) S.mem.fast = true; },
      steps: [
        info([5, 8, 9], T('mode remembers which mode the light is in: 0, 1 or 2. (mode + 1) % 3 goes 0, 1, 2, 0, 1, 2…', 'mode याद रखता है कि लाइट किस मोड में है: 0, 1 या 2। (mode + 1) % 3 चलता है 0, 1, 2, 0, 1, 2…', 'mode yaad rakhta hai ki light kis mode mein hai: 0, 1 ya 2. (mode + 1) % 3 chalta hai 0, 1, 2, 0, 1, 2…')),
        info([13], T('running_time() // 250 % 2 is 0 for 250 ms, then 1 for 250 ms, and so on: the light flashes twice a second.', 'running_time() // 250 % 2 250 ms तक 0, फिर 250 ms तक 1, और ऐसे ही: लाइट सेकंड में दो बार चमकती है।', 'running_time() // 250 % 2 250 ms tak 0, phir 250 ms tak 1, aur aise hi: light second mein do baar chamakti hai.')),
        run(),
        act((S) => lit(S) === 25, T('Press A once: on.', 'A एक बार दबाइए: चालू।', 'A ek baar dabaiye: chalu.')),
        act((S) => !!R(S).flash, T('Press A again: flashing.', 'A फिर दबाइए: चमकती।', 'A phir dabaiye: chamakti.'), T('Flashing lights are easier to notice at night: drivers see you sooner.', 'चमकती लाइट रात में जल्दी दिखती है: गाड़ी वाले आपको जल्दी देखते हैं।', 'Chamakti light raat mein jaldi dikhti hai: gaadi wale aapko jaldi dekhte hain.')),
        edit((src) => /\/\/ 100 % 2/.test(src), [[/\/\/ 250 % 2/, '// 100 % 2']],
          T('Flash faster: change // 250 % 2 to // 100 % 2, then Run.', 'तेज़ चमकाइए: // 250 % 2 को // 100 % 2 कीजिए, फिर "चलाइए"।', 'Tez chamkaiye: // 250 % 2 ko // 100 % 2 karo, phir Run.')),
        act((S) => !!M(S).fast, T('Press A twice to get to flashing.', 'चमकने वाले मोड तक जाने के लिए A दो बार दबाइए।', 'Chamakne wale mode tak jaane ke liye A do baar dabaiye.'), T('Five flashes a second now. (Very fast flashing can bother some people: bike lights stay below about 4 a second.)', 'अब सेकंड में पाँच बार। (बहुत तेज़ चमक कुछ लोगों को परेशान कर सकती है: साइकिल लाइट लगभग 4 बार प्रति सेकंड से कम रहती हैं।)', 'Ab second mein paanch baar. (Bahut tez chamak kuch logon ko pareshaan kar sakti hai: cycle light lagbhag 4 baar per second se kam rehti hain.)')),
      ],
      done: (S) => !!M(S).fast },
    // 21 -----------------------------------------------------------------------------------------------------------
    { id: 'mbmorse', view: 'mb', code: MORSE, drawer: [],
      title: T('Morse code tapper', 'मोर्स कोड टैपर', 'Morse code tapper'),
      goal: T('Tap dots and dashes and the micro:bit reads them as letters; then teach it a new letter.', 'बिंदु और डैश टैप कीजिए और micro:bit उन्हें अक्षर पढ़ता है; फिर उसे नया अक्षर सिखाइए।', 'Bindu aur dash tap kijiye aur micro:bit unhe akshar padhta hai; phir use naya akshar sikhaiye.'),
      world: world({ scene: 'desk', controls: ['A', 'B', 'logo'], hud: ['buttons'], title: T('Morse tapper', 'मोर्स टैपर', 'Morse tapper') }),
      setup: { parts: [], wires: [] },
      tick: (S) => { if (ran(S, /"\.\.\.\.": "H"/) && has(S, /^H$/)) S.mem.h = true; },
      steps: [
        info([4], T('CODE is a dictionary: each pattern of dots and dashes looks up its letter, like a word in a dictionary. CODE.get(taps, "?") gives "?" when the pattern isn\'t there.', 'CODE एक डिक्शनरी है: बिंदु-डैश का हर पैटर्न अपना अक्षर ढूँढता है, जैसे शब्दकोश में शब्द। पैटर्न न मिले तो CODE.get(taps, "?") "?" देता है।', 'CODE ek dictionary hai: bindu-dash ka har pattern apna akshar dhoondhta hai, jaise shabdkosh mein shabd. Pattern na mile to CODE.get(taps, "?") "?" deta hai.')),
        run(),
        act((S) => has(S, /^S$/), T('Tap S: A, A, A (three dots), then touch the logo.', 'S टैप कीजिए: A, A, A (तीन बिंदु), फिर लोगो छूइए।', 'S tap kijiye: A, A, A (teen bindu), phir logo chhuiye.')),
        act((S) => has(S, /^O$/), T('Now O: B, B, B (three dashes), logo.', 'अब O: B, B, B (तीन डैश), लोगो।', 'Ab O: B, B, B (teen dash), logo.'), T('S, O, S: the call for help that ships sent by radio for a hundred years.', 'S, O, S: मदद की पुकार जो जहाज़ सौ साल तक रेडियो से भेजते रहे।', 'S, O, S: madad ki pukaar jo jahaaz sau saal tak radio se bhejte rahe.')),
        edit((src) => /"\.\.\.\.": "H"/.test(src), [[/"-": "T"\}/, '"-": "T", "....": "H"}']],
          T('Teach it H (four dots): at the end of CODE, after "-": "T", add , "....": "H" then Run.', 'इसे H सिखाइए (चार बिंदु): CODE के आख़िर में, "-": "T" के बाद , "....": "H" लिखिए फिर "चलाइए"।', 'Ise H sikhaiye (chaar bindu): CODE ke aakhir mein, "-": "T" ke baad , "....": "H" likhiye phir Run.')),
        act((S) => !!M(S).h, T('Tap A four times, then the logo.', 'A चार बार टैप कीजिए, फिर लोगो।', 'A chaar baar tap kijiye, phir logo.'), T('H. Add the whole alphabet and send your name!', 'H। पूरी वर्णमाला जोड़िए और अपना नाम भेजिए!', 'H. Poori varnmala jodiye aur apna naam bhejiye!')),
      ],
      done: (S) => !!M(S).h },
    // 22 -----------------------------------------------------------------------------------------------------------
    { id: 'mbcatch', view: 'mb', code: CATCH, drawer: [],
      title: T('Catch the falling dot', 'गिरता बिंदु पकड़िए', 'Girta dot pakdiye'),
      goal: T('A falling-dot game: move the basket with A and B and catch as many dots as you can.', 'गिरते बिंदु का खेल: A और B से टोकरी चलाइए और जितने हो सकें बिंदु पकड़िए।', 'Girte dot ka game: A aur B se tokri chalaiye aur jitne ho sakein dot pakdiye.'),
      world: world({ scene: 'desk', controls: ['A', 'B'], hud: ['buttons'], title: T('Catch the dot', 'बिंदु पकड़िए', 'Dot pakdiye') }),
      setup: { parts: [], wires: [] },
      tick: (S) => { const m = S.memRun; if (img(S) === 'YES' && !m.y) { m.y = true; m.caught = (m.caught || 0) + 1; } if (img(S) !== 'YES') m.y = false; if (ran(S, /ticks == 4\b/) && (m.caught || 0) >= 2) S.mem.fast = true; },
      steps: [
        info([15, 16, 17, 18], T('The loop goes round every 50 ms; ticks counts the turns, and every 8th turn (400 ms) the dot falls one row.', 'लूप हर 50 ms में घूमता है; ticks चक्कर गिनता है, और हर 8वें चक्कर (400 ms) पर बिंदु एक पंक्ति गिरता है।', 'Loop har 50 ms mein ghoomta hai; ticks chakkar ginta hai, aur har 8ve chakkar (400 ms) par dot ek row girta hai.')),
        info([30, 31], T('The dot is bright (9) and your basket dimmer (4), so you can tell them apart.', 'बिंदु तेज़ (9) है और आपकी टोकरी धीमी (4), ताकि दोनों अलग पहचान में आएँ।', 'Dot tez (9) hai aur aapki tokri dheemi (4), taaki dono alag pehchaan mein aayein.')),
        run(),
        act((S) => (R(S).caught || 0) >= 1, T('Catch a dot: move the basket under it with A (left) and B (right).', 'एक बिंदु पकड़िए: A (बाएँ) और B (दाएँ) से टोकरी उसके नीचे लाइए।', 'Ek dot pakdiye: A (left) aur B (right) se tokri uske neeche laiye.'), T('A tick: caught!', 'टिक: पकड़ लिया!', 'Tick: pakad liya!')),
        act((S) => has(S, /^SCORE \d+$/), T('Now miss one on purpose.', 'अब जानबूझकर एक छोड़िए।', 'Ab jaanboojh kar ek chhodiye.'), T('Game over: your score, and it starts again.', 'खेल ख़त्म: आपका स्कोर, और फिर से शुरू।', 'Game khatam: aapka score, aur phir se shuru.')),
        edit((src) => /ticks == 4\b/.test(src), [[/ticks == 8/, 'ticks == 4']],
          T('Level 2: change ticks == 8 to ticks == 4: the dots fall twice as fast. Then Run.', 'लेवल 2: ticks == 8 को ticks == 4 कीजिए: बिंदु दोगुनी तेज़ी से गिरेंगे। फिर "चलाइए"।', 'Level 2: ticks == 8 ko ticks == 4 karo: dots do-guni tezi se girenge. Phir Run.')),
        act((S) => !!M(S).fast, T('Catch two dots at the new speed.', 'नई रफ़्तार पर दो बिंदु पकड़िए।', 'Nayi speed par do dot pakdiye.'), T('Faster! Most video games have levels that change one number like this.', 'और तेज़! ज़्यादातर वीडियो गेम के लेवल ऐसे ही एक संख्या बदलते हैं।', 'Aur tez! Zyaadatar video games ke level aise hi ek number badalte hain.')),
      ],
      done: (S) => !!M(S).fast },
    // 23 -----------------------------------------------------------------------------------------------------------
    { id: 'mbtrundle', view: 'mb', code: TRUNDLE, drawer: [],
      title: T('Trundle wheel', 'ट्रंडल व्हील (नापने का पहिया)', 'Trundle wheel (naapne ka pahiya)'),
      goal: T('A measuring wheel: count its turns and turn them into metres. Then fit a smaller wheel.', 'नापने वाला पहिया: इसके चक्कर गिनिए और उन्हें मीटर में बदलिए। फिर छोटा पहिया लगाइए।', 'Naapne wala pahiya: iske chakkar giniye aur unhe metre mein badaliye. Phir chhota pahiya lagaiye.'),
      world: world({ scene: 'desk', controls: ['P0', 'A', 'B'], hud: [], title: T('Trundle wheel', 'नापने का पहिया', 'Naapne ka pahiya') }),
      setup: { parts: [], wires: [] },
      tick: (S) => { if (ran(S, /WHEEL = 0\.5\b/) && has(S, /^1\.5 M$/)) S.mem.small = true; },
      steps: [
        info([5], T('A wheel 32 cm across goes 1 metre in one turn (its edge is π × 32 cm ≈ 100 cm long). WHEEL is that distance.', '32 cm चौड़ा पहिया एक चक्कर में 1 मीटर चलता है (उसका किनारा π × 32 cm ≈ 100 cm लंबा है)। WHEEL यही दूरी है।', '32 cm chauda pahiya ek chakkar mein 1 metre chalta hai (uska kinara π × 32 cm ≈ 100 cm lamba hai). WHEEL yahi doori hai.')),
        run(),
        act((S) => has(S, /^4\.0 M$/), T('Roll it four turns ("Touch pin 0" four times), then press A.', 'इसे चार चक्कर घुमाइए ("पिन 0 छूइए" चार बार), फिर A दबाइए।', 'Ise chaar chakkar ghumaiye ("Pin 0 touch karo" chaar baar), phir A dabaiye.'), T('4.0 metres. Groundsmen mark cricket pitches with a wheel like this.', '4.0 मीटर। मैदान वाले क्रिकेट पिच ऐसे ही पहिये से नापते हैं।', '4.0 metre. Maidaan wale cricket pitch aise hi pahiye se naapte hain.')),
        edit((src) => /WHEEL = 0\.5\b/.test(src), [[/WHEEL = 1\.0/, 'WHEEL = 0.5']],
          T('A smaller wheel (16 cm across) goes only half a metre a turn: change WHEEL = 1.0 to WHEEL = 0.5, then Run.', 'छोटा पहिया (16 cm चौड़ा) एक चक्कर में आधा मीटर चलता है: WHEEL = 1.0 को WHEEL = 0.5 कीजिए, फिर "चलाइए"।', 'Chhota pahiya (16 cm chauda) ek chakkar mein aadha metre chalta hai: WHEEL = 1.0 ko WHEEL = 0.5 karo, phir Run.')),
        act((S) => !!M(S).small, T('Roll it three turns, then press A.', 'तीन चक्कर घुमाइए, फिर A दबाइए।', 'Teen chakkar ghumaiye, phir A dabaiye.'), T('1.5 metres. Measure your classroom: how many metres long is it?', '1.5 मीटर। अपनी कक्षा नापिए: वह कितने मीटर लंबी है?', '1.5 metre. Apni class naapiye: woh kitne metre lambi hai?')),
      ],
      done: (S) => !!M(S).small },
  ];
  L.forEach((l, i) => { l.n = n0 + i + 1; l.lang = 'py'; l.batch = 8; l.cls = '3'; });
  return L;
}
