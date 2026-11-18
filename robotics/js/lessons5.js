// DUET Robotics Lab 360, batch 5: the BBC micro:bit V2 and Python, Class 6–9. Same shape as lessons.js; each lesson's
// `world` is the micro:bit desk (microbit.js MBCore: make), its scene, its parts and clips, the panel's rows and buttons.
// The steps ask what really happened on the board: the pictures the display showed, the numbers, the presses, shakes,
// clips, the temperature it read, the servo's angle; a step is done only when it happened (lessonrt.js asks S.w / S.wv).
// The helpers (t3, W) come from lessons.js (batch5(K, n0)), so there is no import loop; nothing here needs three.js.
import { MBCore, MBX } from './microbit.js';

const make = (app, cfg) => new MBCore(app, cfg);
// the headset puts the micro:bit desk in front of you (xr.js: centre); "robot" view: a little further back
const centre = (dx, dz) => (focus) => ({ c: [MBX + dx, 0, dz], k: focus === 'robot' ? 0.55 : 1 });
const world = (o) => Object.assign({ kind: 'mb', make, centre: centre(o.cx || 0, o.cz || 0) }, o);
const has = (S, re) => (S.wv('texts') || []).some((t) => re.test(t));
const q = (s) => `["']${s}["']`; // a text in either quote (Blocks write 'x', the lessons "x")

// ------------------------------------------------------------------ the programs
const MEET = `# Meet the micro:bit: it says hello, then smiles
from microbit import *

display.scroll("Hello")
display.show(Image.HAPPY)
`;
const BADGE = `# Name badge: your name scrolls across the display, again and again
from microbit import *

while True:
    display.scroll("ASHA")
    display.show(Image.HAPPY)
    sleep(1000)
`;
const HEART = `# Heart beat: a big heart, a small heart, again and again
from microbit import *

while True:
    display.show(Image.HEART)
    sleep(500)
    display.show(Image.HEART_SMALL)
    sleep(500)
`;
const COUNT = `# Button counter: A adds one, B starts again from 0
from microbit import *

count = 0
display.show(count)
while True:
    if button_a.was_pressed():
        count = count + 1
        display.show(count)
    if button_b.was_pressed():
        count = 0
        display.show(count)
    sleep(20)
`;
const STEPS = `# Step counter: every shake is one step
from microbit import *

steps = 0
while True:
    if accelerometer.was_gesture("shake"):
        steps += 1
        display.show(steps)
    sleep(20)
`;
const THERMO = `# Thermometer: the temperature in degrees Celsius, and a warning when it is hot
from microbit import *

while True:
    t = temperature()
    print(t)
    if t > 32:
        display.show(Image.SAD)
        sleep(1000)
    display.scroll(str(t) + "C")
`;
const COMPASS = `# Compass: an arrow that always points north
from microbit import *

if not compass.is_calibrated():
    compass.calibrate()
while True:
    h = compass.heading()
    if h < 45 or h > 315:
        display.show(Image.ARROW_N)
    elif h < 135:
        display.show(Image.ARROW_W)
    elif h < 225:
        display.show(Image.ARROW_S)
    else:
        display.show(Image.ARROW_E)
    print(h)
    sleep(100)
`;
const NIGHT = `# Night light: the LEDs measure the light; in the dark they light up
from microbit import *

while True:
    level = display.read_light_level()
    print(level)
    if level < 50:
        display.show(Image("99999:99999:99999:99999:99999"))
    else:
        display.clear()
    sleep(200)
`;
const RPS = `# Rock, paper, scissors over the radio: the same program runs on both micro:bits
from microbit import *
import radio
import random

radio.on()
radio.config(group=7)
signs = ["R", "P", "S"]
mine = ""
theirs = ""
while True:
    if accelerometer.was_gesture("shake"):
        mine = random.choice(signs)
        display.show(mine)
        radio.send(mine)
    msg = radio.receive()
    if msg:
        theirs = msg
    if mine and theirs:
        sleep(1000)
        if mine == theirs:
            display.show(Image.MEH)
        elif mine + theirs in ["RS", "PR", "SP"]:
            display.show(Image.HAPPY)
        else:
            display.show(Image.SAD)
        mine = ""
        theirs = ""
    sleep(20)
`;
const PLANT = `# Plant waterer: two nails in the soil feel how wet it is.
# When it is dry, an LED and a sad face ask for water.
from microbit import *

while True:
    moisture = pin0.read_analog()   # 0 = bone dry, 1023 = very wet
    print(moisture)
    if moisture < 400:
        pin1.write_digital(1)       # the LED on pin 1 lights up
        display.show(Image.SAD)
    else:
        pin1.write_digital(0)
        display.show(Image.HAPPY)
    sleep(1000)
`;
const GATE = `# A servo gate: A opens it, B shuts it
from microbit import *

def angle(a):
    # 0 to 180 degrees -> a pulse 0.5 to 2.5 ms long, every 20 ms
    pin0.write_analog(int(26 + a * 102 / 180))

pin0.set_analog_period(20)
angle(90)                  # shut: across the road
while True:
    if button_a.was_pressed():
        angle(180)         # open
        display.show(Image.ARROW_N)
    if button_b.was_pressed():
        angle(90)          # shut
        display.show(Image.NO)
    sleep(20)
`;
export const MB_CODES = { MEET, BADGE, HEART, COUNT, STEPS, THERMO, COMPASS, NIGHT, RPS, PLANT, GATE };

export function batch5(K, n0) {
  const { t3, W } = K;
  const run = (see) => ({ k: 'run', do: t3('Press Run.', '"चलाइए" दबाइए।', 'Run dabaiye.'), see: see || t3('The program goes into the micro:bit and starts.', 'प्रोग्राम micro:bit में जाकर चलने लगता है।', 'Program micro:bit mein jaakar chalne lagta hai.') });
  const X = { // words for the circuit checks
    clip: t3('A crocodile clip is missing: {a} must be joined to {b}.', 'एक क्रोकोडाइल क्लिप कम है: {a} को {b} से जोड़िए।', 'Ek crocodile clip kam hai: {a} ko {b} se jodiye.'),
    swapLed: t3('The LED is the wrong way round: its long leg (+) goes to pin 1, its short leg (−) to GND.', 'एलईडी उल्टी लगी है: लंबा पैर (+) पिन 1 पर, छोटा पैर (−) GND पर।', 'LED ulti lagi hai: lamba pair (+) pin 1 par, chhota pair (−) GND par.'),
    short: t3('3V is clipped straight to GND: that is a short circuit! Take that clip off.', '3V सीधे GND से जुड़ा है: यह शॉर्ट सर्किट है! वह क्लिप हटाइए।', '3V seedhe GND se juda hai: yeh short circuit hai! Woh clip hataiye.'),
    servoPow: t3('The servo\'s red (+) pin must go to 3V and its brown pin to GND, or it has no power.', 'सर्वो का लाल (+) पिन 3V पर और भूरा पिन GND पर जाना चाहिए, वरना उसे बिजली नहीं मिलेगी।', 'Servo ka red (+) pin 3V par aur brown pin GND par jaana chahiye, warna use power nahi milegi.'),
    nails: t3('One nail goes to 3V and the other to pin 0: then pin 0 measures how much current the soil lets through.', 'एक कील 3V पर और दूसरी पिन 0 पर जाती है: तब पिन 0 नापता है कि मिट्टी से कितना करंट गुज़रता है।', 'Ek keel 3V par aur doosri pin 0 par jaati hai: tab pin 0 naapta hai ki mitti se kitna current guzarta hai.'),
  };
  const clipNeed = (a, b, an, bn) => (S) => (S.w(`conn:${a}~${b}`) ? null : [X.clip, { a: an, b: bn }]);
  const noShort = (S) => (S.w('conn:3V~GND') ? [X.short] : null);
  const tapAct = (ids, d, s) => ({ k: 'act', until: (S) => ids.every((r) => S.tapped(r)), do: d, see: s });
  const L = [
    // 1 ------------------------------------------------------------------------------------------------------------
    { id: 'mbmeet', free: true, view: 'mb', code: MEET, drawer: [], icon: '◎',
      title: t3('Meet the micro:bit', 'micro:bit से मिलिए', 'micro:bit se miliye'),
      goal: t3('Find the parts of a BBC micro:bit V2, front and back, and run your first Python program.', 'BBC micro:bit V2 के हिस्से पहचानिए, आगे और पीछे से, और अपना पहला Python प्रोग्राम चलाइए।', 'BBC micro:bit V2 ke parts pehchaniye, aage aur peeche se, aur apna pehla Python program chalaiye.'),
      world: world({ scene: 'desk', learn: true, controls: ['A', 'B', 'logo', 'flip'], hud: ['buttons'], title: t3('micro:bit V2', 'micro:bit V2', 'micro:bit V2') }),
      setup: { parts: [], wires: [] },
      steps: [
        { k: 'info', do: t3('This is a BBC micro:bit V2: a tiny computer, 5 cm × 4 cm, made for schools. Lights, buttons and sensors are already on it, so you can start without any wires.', 'यह BBC micro:bit V2 है: स्कूलों के लिए बना 5 cm × 4 cm का छोटा-सा कंप्यूटर। लाइट, बटन और सेंसर इस पर पहले से लगे हैं, इसलिए बिना वायर के शुरू कर सकते हैं।', 'Yeh BBC micro:bit V2 hai: schools ke liye bana 5 cm × 4 cm ka chhota sa computer. Lights, buttons aur sensors ispar pehle se lage hain, isliye bina wires ke shuru kar sakte hain.'),
          see: t3('Drag the desk to look round it; pinch or scroll to zoom.', 'डेस्क को खींचकर चारों ओर देखिए; ज़ूम के लिए दो उँगलियों से फैलाइए या स्क्रॉल कीजिए।', 'Desk ko kheench kar chaaron taraf dekhiye; zoom ke liye do ungliyon se failaiye ya scroll kijiye.') },
        tapAct(['mb_leds'], t3('Tap the 25 small red lights in the middle.', 'बीच की 25 छोटी लाल लाइटों को छूइए।', 'Beech ki 25 chhoti red lights ko touch karo.'), t3('The LED display: 5 rows and 5 columns. It shows pictures, numbers and words.', 'एलईडी डिस्प्ले: 5 पंक्तियाँ और 5 कॉलम। यह तस्वीरें, संख्याएँ और शब्द दिखाता है।', 'LED display: 5 rows aur 5 columns. Yeh pictures, numbers aur words dikhata hai.')),
        tapAct(['mb_a', 'mb_b'], t3('Press button A, then button B (tap them on the board).', 'बटन A दबाइए, फिर बटन B (बोर्ड पर छूकर)।', 'Button A dabaiye, phir button B (board par touch karke).'), t3('Two buttons your program can read: button_a and button_b.', 'दो बटन जिन्हें आपका प्रोग्राम पढ़ सकता है: button_a और button_b।', 'Do buttons jinhe aapka program padh sakta hai: button_a aur button_b.')),
        tapAct(['mb_logo'], t3('Tap the gold logo at the top.', 'ऊपर वाले सुनहरे लोगो को छूइए।', 'Upar wale sunehre logo ko touch karo.'), t3('It is a touch sensor: it feels your finger.', 'यह टच सेंसर है: यह आपकी उँगली महसूस करता है।', 'Yeh touch sensor hai: yeh aapki ungli mehsoos karta hai.')),
        tapAct(['mb_pins'], t3('Tap one of the big gold pads at the bottom.', 'नीचे वाले किसी बड़े सुनहरे पैड को छूइए।', 'Neeche wale kisi bade sunehre pad ko touch karo.'), t3('Pins 0, 1, 2, 3V and GND: crocodile clips go in their holes, to join LEDs, sensors and motors.', 'पिन 0, 1, 2, 3V और GND: इनके छेदों में क्रोकोडाइल क्लिप लगती हैं, एलईडी, सेंसर और मोटर जोड़ने के लिए।', 'Pins 0, 1, 2, 3V aur GND: inke chhedon mein crocodile clips lagti hain, LED, sensor aur motor jodne ke liye.')),
        { k: 'act', until: (S) => S.w('flipped') && !S.w('faceUp'), do: t3('Press "Turn the board over" in the panel.', 'पैनल में "बोर्ड पलटिए" दबाइए।', 'Panel mein "Board palatiye" dabaiye.'), see: t3('The back: the chips that do the work.', 'पीछे की तरफ़: वे चिप जो असली काम करती हैं।', 'Peeche ki taraf: woh chips jo asli kaam karti hain.') },
        tapAct(['mb_cpu', 'mb_motion', 'mb_speaker'], t3('Tap the processor, the compass & accelerometer chip and the speaker.', 'प्रोसेसर, कंपास और एक्सेलेरोमीटर वाली चिप, और स्पीकर को छूइए।', 'Processor, compass aur accelerometer wali chip, aur speaker ko touch karo.'), t3('The processor runs your Python; the little motion chip feels tilting, shaking and north; the speaker plays music.', 'प्रोसेसर आपका Python चलाता है; छोटी मोशन चिप झुकना, हिलना और उत्तर दिशा महसूस करती है; स्पीकर संगीत बजाता है।', 'Processor aapka Python chalata hai; chhoti motion chip jhukna, hilna aur uttar disha mehsoos karti hai; speaker music bajata hai.')),
        tapAct(['mb_usb', 'mb_battery', 'mb_radio'], t3('Find the USB socket, the battery socket and the radio antenna, and tap them.', 'USB सॉकेट, बैटरी सॉकेट और रेडियो एंटेना ढूँढिए और छूइए।', 'USB socket, battery socket aur radio antenna dhoondiye aur touch karo.'), t3('USB brings power and your program; 2 AAA cells can power it instead; the antenna lets micro:bits talk to each other.', 'USB से बिजली और आपका प्रोग्राम आता है; उसकी जगह 2 AAA सेल से भी चलता है; एंटेना से micro:bit आपस में बात करते हैं।', 'USB se power aur aapka program aata hai; uski jagah 2 AAA cells se bhi chalta hai; antenna se micro:bits aapas mein baat karte hain.')),
        { k: 'act', until: (S) => S.w('faceUp'), do: t3('Turn it back over, face up.', 'इसे फिर से पलटकर सीधा कीजिए।', 'Ise phir se palat kar seedha kijiye.'), see: t3('Now look at the program on the right: three lines of Python.', 'अब दाईं ओर का प्रोग्राम देखिए: Python की तीन लाइनें।', 'Ab right side ka program dekhiye: Python ki teen lines.') },
        { k: 'info', code: [2, 4, 5], do: t3('from microbit import * gives your program the board\'s parts. display.scroll("Hello") slides a word across; display.show(Image.HAPPY) draws a smile.', 'from microbit import * आपके प्रोग्राम को बोर्ड के हिस्से देता है। display.scroll("Hello") शब्द को सरकाता है; display.show(Image.HAPPY) मुस्कान बनाता है।', 'from microbit import * aapke program ko board ke parts deta hai. display.scroll("Hello") word ko sarkata hai; display.show(Image.HAPPY) smile banata hai.'),
          see: t3('Lines that start with # are notes for people: the micro:bit skips them.', '# से शुरू होने वाली लाइनें लोगों के लिए नोट हैं: micro:bit उन्हें छोड़ देता है।', '# se shuru hone wali lines logon ke liye notes hain: micro:bit unhe chhod deta hai.') },
        run(),
        { k: 'watch', until: (S) => has(S, /^Hello$/) && S.w('img:HAPPY'), do: t3('Watch the display.', 'डिस्प्ले देखिए।', 'Display dekhiye.'), see: t3('Hello slides past, one column of LEDs at a time, then a smile stays. Your first program works!', 'Hello एक-एक कॉलम करके सरकता है, फिर मुस्कान रुकी रहती है। आपका पहला प्रोग्राम चल गया!', 'Hello ek-ek column karke sarakta hai, phir smile ruki rehti hai. Aapka pehla program chal gaya!') },
      ],
      done: (S) => ['mb_leds', 'mb_a', 'mb_b', 'mb_logo', 'mb_pins', 'mb_cpu'].every((r) => S.tapped(r)) && S.w('img:HAPPY') },
    // 2 ------------------------------------------------------------------------------------------------------------
    { id: 'mbbadge', view: 'mb', code: BADGE, drawer: [],
      title: t3('Name badge', 'नाम का बैज', 'Naam ka badge'),
      goal: t3('Make a badge that scrolls your name for ever, and learn what a loop is.', 'ऐसा बैज बनाइए जो आपका नाम लगातार दिखाता रहे, और जानिए कि लूप क्या होता है।', 'Aisa badge banaiye jo aapka naam lagataar dikhata rahe, aur jaaniye ki loop kya hota hai.'),
      world: world({ scene: 'badge', battery: true, controls: [], hud: [], title: t3('Name badge', 'नाम का बैज', 'Naam ka badge') }),
      setup: { parts: [], wires: [] },
      steps: [
        { k: 'info', code: [4, 5, 6, 7], do: t3('while True: repeats the lines pushed in under it, again and again, for ever. That is a loop.', 'while True: अपने नीचे अंदर खिसकी लाइनों को बार-बार, हमेशा दोहराता है। इसे लूप कहते हैं।', 'while True: apne neeche andar khiski lines ko baar-baar, hamesha dohrata hai. Ise loop kehte hain.'), see: t3('4 spaces in front of a line put it inside the loop.', 'किसी लाइन के आगे 4 spaces उसे लूप के अंदर रखते हैं।', 'Kisi line ke aage 4 spaces use loop ke andar rakhte hain.') },
        run(),
        { k: 'watch', until: (S) => (S.wv('texts') || []).filter((t) => t === 'ASHA').length >= 2, do: t3('Watch the badge.', 'बैज देखिए।', 'Badge dekhiye.'), see: t3('ASHA, a smile, ASHA again: the loop never stops. A badge runs on 2 AAA cells, away from the computer.', 'ASHA, मुस्कान, फिर ASHA: लूप कभी नहीं रुकता। बैज कंप्यूटर से दूर 2 AAA सेल पर चलता है।', 'ASHA, smile, phir ASHA: loop kabhi nahi rukta. Badge computer se door 2 AAA cells par chalta hai.') },
        { k: 'edit', test: (src) => { const m = /display\.scroll\(\s*["']([^"']+)["']/.exec(src); return !!m && m[1] !== 'ASHA'; }, set: [[/"ASHA"/, '"RAVI"']],
          do: t3('Change ASHA to your own name (keep the quotes), then press Run. Tip: 🧩 Blocks shows the same program as blocks: you can change it there too.', 'ASHA की जगह अपना नाम लिखिए (quotes रहने दीजिए), फिर "चलाइए" दबाइए। सुझाव: 🧩 ब्लॉक में वही प्रोग्राम ब्लॉक की तरह दिखता है: वहाँ भी बदल सकते हैं।', 'ASHA ki jagah apna naam likhiye (quotes rehne dijiye), phir Run dabaiye. Tip: 🧩 Blocks mein wahi program blocks ki tarah dikhta hai: wahan bhi badal sakte hain.'),
          see: t3('Text in quotes is called a string.', 'Quotes के अंदर के टेक्स्ट को string कहते हैं।', 'Quotes ke andar ke text ko string kehte hain.') },
        { k: 'watch', until: (S) => (S.wv('texts') || []).some((t) => t !== 'ASHA' && t.length > 0 && S.w('scrolled')), do: t3('Watch your name go by.', 'अपना नाम गुज़रते देखिए।', 'Apna naam guzarte dekhiye.'), see: t3('Each letter is drawn by the 25 LEDs and slides one column every 150 ms.', 'हर अक्षर 25 एलईडी से बनता है और हर 150 ms में एक कॉलम सरकता है।', 'Har letter 25 LEDs se banta hai aur har 150 ms mein ek column sarakta hai.') },
        { k: 'edit', test: (src) => { const m = /display\.scroll\([^)]*delay\s*=\s*(\d+)/.exec(src); return !!m && +m[1] < 150; }, set: [[/display\.scroll\((\s*["'][^"']*["'])\s*\)/, 'display.scroll($1, delay=80)']],
          do: t3('Make it faster: write display.scroll("RAVI", delay=80) (with your name), then Run.', 'इसे तेज़ कीजिए: display.scroll("RAVI", delay=80) लिखिए (अपने नाम के साथ), फिर "चलाइए"।', 'Ise tez kijiye: display.scroll("RAVI", delay=80) likhiye (apne naam ke saath), phir Run.'),
          see: t3('delay is how many milliseconds each step waits: smaller is faster.', 'delay बताता है कि हर क़दम कितने मिलीसेकंड रुकता है: कम यानी तेज़।', 'delay batata hai ki har step kitne millisecond rukta hai: kam matlab tez.') },
        { k: 'watch', until: (S) => S.w('scrolled') && S.wv('lastDelay') > 0 && S.wv('lastDelay') < 150, do: t3('Watch it again.', 'फिर देखिए।', 'Phir dekhiye.'), see: t3('Faster! Badges at a science fair use about 80–100 ms.', 'तेज़! विज्ञान मेले के बैज में लगभग 80–100 ms रखते हैं।', 'Tez! Science fair ke badges mein lagbhag 80–100 ms rakhte hain.') },
      ],
      done: (S) => S.wv('lastDelay') > 0 && S.wv('lastDelay') < 150 && (S.wv('texts') || []).some((t) => t !== 'ASHA') },
    // 3 ------------------------------------------------------------------------------------------------------------
    { id: 'mbheart', view: 'mb', code: HEART, drawer: [],
      title: t3('Heart beat', 'दिल की धड़कन', 'Dil ki dhadkan'),
      goal: t3('Animate a beating heart with two pictures and sleep(), then change its speed and its pictures.', 'दो तस्वीरों और sleep() से धड़कता दिल बनाइए, फिर उसकी रफ़्तार और तस्वीरें बदलिए।', 'Do pictures aur sleep() se dhadakta dil banaiye, phir uski speed aur pictures badliye.'),
      world: world({ scene: 'desk', controls: [], hud: [], title: t3('Heart beat', 'दिल की धड़कन', 'Dil ki dhadkan') }),
      setup: { parts: [], wires: [] },
      steps: [
        { k: 'info', code: [5, 6], do: t3('display.show(Image.HEART) lights the LEDs in the shape of a heart. sleep(500) waits 500 milliseconds: half a second.', 'display.show(Image.HEART) एलईडी को दिल के आकार में जलाता है। sleep(500), 500 मिलीसेकंड यानी आधा सेकंड रुकता है।', 'display.show(Image.HEART) LEDs ko dil ke aakar mein jalata hai. sleep(500), 500 millisecond matlab aadha second rukta hai.'), see: t3('1000 ms = 1 second.', '1000 ms = 1 सेकंड।', '1000 ms = 1 second.') },
        run(),
        { k: 'watch', until: (S) => S.wv('beats') >= 4, do: t3('Watch the heart.', 'दिल को देखिए।', 'Dil ko dekhiye.'), see: t3('Big, small, big, small: one beat a second, 60 a minute, like a heart at rest.', 'बड़ा, छोटा, बड़ा, छोटा: एक सेकंड में एक धड़कन, एक मिनट में 60, जैसे आराम करते दिल की।', 'Bada, chhota, bada, chhota: ek second mein ek dhadkan, ek minute mein 60, jaise aaram karte dil ki.') },
        { k: 'edit', test: (src) => { const d = [...src.matchAll(/sleep\(\s*(\d+)\s*\)/g)].map((m) => +m[1]); return d.length >= 2 && d.every((x) => x <= 300); }, set: [[/sleep\(500\)/g, 'sleep(250)']],
          do: t3('A heart after running beats faster: change both sleep(500) to sleep(250), then Run.', 'दौड़ने के बाद दिल तेज़ धड़कता है: दोनों sleep(500) को sleep(250) कीजिए, फिर "चलाइए"।', 'Daudne ke baad dil tez dhadakta hai: dono sleep(500) ko sleep(250) karo, phir Run.'), see: t3('', '', '') },
        { k: 'watch', until: (S) => S.wv('beats') >= 4 && S.wv('heartMs') < 0.65, do: t3('Watch it now.', 'अब देखिए।', 'Ab dekhiye.'), see: t3('Two beats a second: 120 a minute, like your heart after a race.', 'एक सेकंड में दो धड़कन: एक मिनट में 120, जैसे दौड़ के बाद आपका दिल।', 'Ek second mein do dhadkan: ek minute mein 120, jaise race ke baad aapka dil.') },
        { k: 'edit', test: (src) => /Image\.HEART\b/.test(src) && !/Image\.HEART_SMALL\b/.test(src) && /display\.show\(Image\.(?!HEART\b)[A-Z_]+\)/.test(src), set: [[/Image\.HEART_SMALL/, 'Image.DIAMOND_SMALL']],
          do: t3('Use another picture for the small beat: change HEART_SMALL to DIAMOND_SMALL, DUCK or BUTTERFLY, then Run.', 'छोटी धड़कन के लिए दूसरी तस्वीर लीजिए: HEART_SMALL की जगह DIAMOND_SMALL, DUCK या BUTTERFLY लिखिए, फिर "चलाइए"।', 'Chhoti dhadkan ke liye doosri picture lijiye: HEART_SMALL ki jagah DIAMOND_SMALL, DUCK ya BUTTERFLY likhiye, phir Run.'),
          see: t3('Image has more than 60 pictures built in.', 'Image में 60 से ज़्यादा तस्वीरें पहले से बनी हैं।', 'Image mein 60 se zyada pictures pehle se bani hain.') },
        { k: 'watch', until: (S) => { const im = S.wv('images'); return !!im && [...im.entries()].some(([k, n]) => k !== 'HEART' && k !== 'HEART_SMALL' && n >= 2); }, do: t3('Watch your animation.', 'अपना एनिमेशन देखिए।', 'Apna animation dekhiye.'), see: t3('Two pictures shown one after the other make an animation, as in a cartoon.', 'एक के बाद एक दिखाई गई दो तस्वीरें एनिमेशन बनाती हैं, जैसे कार्टून में।', 'Ek ke baad ek dikhayi gayi do pictures animation banati hain, jaise cartoon mein.') },
      ],
      done: (S) => { const im = S.wv('images'); return !!im && [...im.entries()].some(([k, n]) => k !== 'HEART' && k !== 'HEART_SMALL' && n >= 2); } },
    // 4 ------------------------------------------------------------------------------------------------------------
    { id: 'mbcount', view: 'mb', code: COUNT, drawer: [],
      title: t3('Button counter', 'बटन काउंटर', 'Button counter'),
      goal: t3('Count button presses with a variable and if: A adds, B starts again.', 'वेरिएबल और if से बटन दबाना गिनिए: A जोड़ता है, B फिर से शुरू करता है।', 'Variable aur if se button dabana giniye: A jodta hai, B phir se shuru karta hai.'),
      world: world({ scene: 'desk', controls: ['A', 'B'], hud: ['buttons'], title: t3('Button counter', 'बटन काउंटर', 'Button counter') }),
      setup: { parts: [], wires: [] },
      steps: [
        { k: 'info', code: [4], do: t3('count is a variable: a box with a name that holds a number. It starts at 0.', 'count एक वेरिएबल है: नाम वाला एक डिब्बा जिसमें संख्या रहती है। यह 0 से शुरू होता है।', 'count ek variable hai: naam wala ek dabba jismein number rehta hai. Yeh 0 se shuru hota hai.'), see: t3('', '', '') },
        { k: 'info', code: [7, 8, 9], do: t3('if button_a.was_pressed(): asks a question. When the answer is True, the lines pushed in under it run.', 'if button_a.was_pressed(): एक सवाल पूछता है। जवाब True हो, तो उसके नीचे अंदर खिसकी लाइनें चलती हैं।', 'if button_a.was_pressed(): ek sawaal poochta hai. Jawab True ho, to uske neeche andar khiski lines chalti hain.'), see: t3('count = count + 1 takes the number out, adds 1, and puts it back in the box.', 'count = count + 1 संख्या निकालता है, 1 जोड़ता है, और वापस डिब्बे में रखता है।', 'count = count + 1 number nikalta hai, 1 jodta hai, aur wapas dabbe mein rakhta hai.') },
        run(),
        { k: 'act', until: (S) => (S.wv('nums') || []).includes(3), do: t3('Press button A three times: tap it on the board, press the A key, or use the panel.', 'बटन A तीन बार दबाइए: बोर्ड पर छूकर, कीबोर्ड की A key से, या पैनल से।', 'Button A teen baar dabaiye: board par touch karke, keyboard ki A key se, ya panel se.'), see: t3('1, 2, 3: the display shows the count each time.', '1, 2, 3: डिस्प्ले हर बार गिनती दिखाता है।', '1, 2, 3: display har baar ginti dikhata hai.') },
        { k: 'act', until: (S) => { const n = S.wv('nums') || []; return n.includes(3) && n[n.length - 1] === 0; }, do: t3('Press B.', 'B दबाइए।', 'B dabaiye.'), see: t3('count goes back to 0.', 'count फिर से 0 हो जाता है।', 'count phir se 0 ho jaata hai.') },
        { k: 'edit', test: (src) => /count\s*(\+\s*2\b|\+=\s*2\b)/.test(src), set: [[/count \+ 1/, 'count + 2']], do: t3('Count in twos: change count + 1 to count + 2, then Run.', 'दो-दो करके गिनिए: count + 1 को count + 2 कीजिए, फिर "चलाइए"।', 'Do-do karke giniye: count + 1 ko count + 2 karo, phir Run.'), see: t3('', '', '') },
        { k: 'act', until: (S) => (S.wv('nums') || []).includes(6), do: t3('Press A three times again.', 'फिर से A तीन बार दबाइए।', 'Phir se A teen baar dabaiye.'), see: t3('2, 4, 6: the same program, a different rule. Scorers at a match use one like this.', '2, 4, 6: वही प्रोग्राम, अलग नियम। मैच में स्कोर गिनने वाले ऐसा ही इस्तेमाल करते हैं।', '2, 4, 6: wahi program, alag niyam. Match mein score ginne wale aisa hi use karte hain.') },
      ],
      done: (S) => (S.wv('nums') || []).includes(6) },
    // 5 ------------------------------------------------------------------------------------------------------------
    { id: 'mbsteps', view: 'mb', code: STEPS, drawer: [],
      title: t3('Step counter and dice', 'क़दम गिनने वाला और पासा', 'Step counter aur dice'),
      goal: t3('Use the accelerometer: see tilting as numbers, count shakes as steps, then make a dice.', 'एक्सेलेरोमीटर इस्तेमाल कीजिए: झुकाव को संख्याओं में देखिए, हिलाने को क़दम की तरह गिनिए, फिर पासा बनाइए।', 'Accelerometer use kijiye: jhukaav ko numbers mein dekhiye, hilane ko steps ki tarah giniye, phir dice banaiye.'),
      world: world({ scene: 'watch', controls: ['shake', 'tilt', 'phone'], hud: ['acc', 'shakes'], title: t3('Accelerometer', 'एक्सेलेरोमीटर', 'Accelerometer') }),
      setup: { parts: [], wires: [] },
      steps: [
        { k: 'info', do: t3('Inside is an accelerometer: it feels which way is down, and every jolt. Here the micro:bit is a watch on a strap.', 'इसके अंदर एक्सेलेरोमीटर है: यह महसूस करता है कि नीचे किधर है, और हर झटका भी। यहाँ micro:bit पट्टे वाली घड़ी बना है।', 'Iske andar accelerometer hai: yeh mehsoos karta hai ki neeche kidhar hai, aur har jhatka bhi. Yahan micro:bit patte wali ghadi bana hai.'), see: t3('Drag the board to tilt it; let go and it lies flat again.', 'बोर्ड को खींचकर झुकाइए; छोड़ने पर यह फिर सीधा हो जाता है।', 'Board ko kheench kar jhukaiye; chhodne par yeh phir seedha ho jaata hai.') },
        run(t3('The panel shows x, y and z in milli-g. Flat on the desk, z is about −1024: one g pulling down.', 'पैनल x, y और z को मिली-g में दिखाता है। डेस्क पर सीधा रखने पर z लगभग −1024: एक g नीचे की ओर।', 'Panel x, y aur z ko milli-g mein dikhata hai. Desk par seedha rakhne par z lagbhag −1024: ek g neeche ki taraf.')),
        { k: 'act', until: (S) => S.w('gesture:right') || S.w('gesture:left'), do: t3('Tilt the board to one side (drag it right or left, or "Hold it" → right).', 'बोर्ड को एक तरफ़ झुकाइए (दाएँ या बाएँ खींचिए, या "ऐसे पकड़िए" → दाएँ)।', 'Board ko ek taraf jhukaiye (right ya left kheenchiye, ya "Aise pakdiye" → right).'), see: t3('x grows towards +1024 (right) or −1024 (left), and the gesture changes.', 'x बढ़कर +1024 (दाएँ) या −1024 (बाएँ) की ओर जाता है, और gesture बदल जाता है।', 'x badh kar +1024 (right) ya −1024 (left) ki taraf jaata hai, aur gesture badal jaata hai.') },
        { k: 'act', until: (S) => (S.wv('nums') || []).includes(3), do: t3('Shake it three times: drag it quickly to and fro, or press "Shake it".', 'इसे तीन बार हिलाइए: तेज़ी से इधर-उधर खींचिए, या "हिलाइए" दबाइए।', 'Ise teen baar hilaiye: tezi se idhar-udhar kheenchiye, ya "Hilaiye" dabaiye.'), see: t3('Each shake is one step: steps += 1 is short for steps = steps + 1.', 'हर बार हिलाना एक क़दम है: steps += 1, steps = steps + 1 का छोटा रूप है।', 'Har baar hilana ek step hai: steps += 1, steps = steps + 1 ka chhota roop hai.') },
        { k: 'edit', test: (src) => /import random/.test(src) && /random\.randint\(\s*1\s*,\s*6\s*\)/.test(src), set: [[/from microbit import \*\n/, 'from microbit import *\nimport random\n'], [/display\.show\(steps\)/, 'display.show(random.randint(1, 6))']],
          do: t3('Turn it into a dice: add import random under the first line, and change display.show(steps) to display.show(random.randint(1, 6)). Run.', 'इसे पासा बनाइए: पहली लाइन के नीचे import random लिखिए, और display.show(steps) को display.show(random.randint(1, 6)) कीजिए। "चलाइए"।', 'Ise dice banaiye: pehli line ke neeche import random likhiye, aur display.show(steps) ko display.show(random.randint(1, 6)) karo. Run.'),
          see: t3('random.randint(1, 6) picks a whole number from 1 to 6, as a dice does.', 'random.randint(1, 6) 1 से 6 तक कोई भी पूरी संख्या चुनता है, जैसे पासा।', 'random.randint(1, 6) 1 se 6 tak koi bhi poora number chunta hai, jaise dice.') },
        { k: 'act', until: (S) => { const n = (S.wv('nums') || []).filter((x) => x >= 1 && x <= 6); return n.length >= 3 && new Set(n).size >= 2; }, do: t3('Shake it a few times.', 'इसे कुछ बार हिलाइए।', 'Ise kuch baar hilaiye.'), see: t3('A different number each time: you cannot guess the next one. Play Ludo with it!', 'हर बार अलग संख्या: अगली संख्या का अंदाज़ा नहीं लगा सकते। इससे लूडो खेलिए!', 'Har baar alag number: agle number ka andaaza nahi laga sakte. Isse Ludo kheliye!') },
      ],
      done: (S) => { const n = (S.wv('nums') || []).filter((x) => x >= 1 && x <= 6); return new Set(n).size >= 2; } },
    // 6 ------------------------------------------------------------------------------------------------------------
    { id: 'mbtemp', view: 'mb', code: THERMO, drawer: [], serial: true,
      title: t3('Thermometer', 'थर्मामीटर', 'Thermometer'),
      goal: t3('Read the temperature sensor, show it, warn when it is hot, and turn °C into °F.', 'तापमान सेंसर पढ़िए, उसे दिखाइए, गर्मी होने पर चेतावनी दीजिए, और °C को °F में बदलिए।', 'Temperature sensor padhiye, use dikhaiye, garmi hone par warning dijiye, aur °C ko °F mein badaliye.'),
      world: world({ scene: 'thermo', controls: ['temp'], hud: ['temp'], temp: 26, title: t3('Thermometer', 'थर्मामीटर', 'Thermometer') }),
      setup: { parts: [], wires: [] },
      steps: [
        { k: 'info', code: [5], do: t3('temperature() reads a sensor inside the processor chip, in whole degrees Celsius.', 'temperature() प्रोसेसर चिप के अंदर का सेंसर पढ़ता है, पूरे डिग्री सेल्सियस में।', 'temperature() processor chip ke andar ka sensor padhta hai, poore degree Celsius mein.'), see: t3('The chip warms itself a little, so it reads 1–2 °C above the room.', 'चिप ख़ुद थोड़ी गर्म होती है, इसलिए कमरे से 1–2 °C ज़्यादा पढ़ती है।', 'Chip khud thodi garam hoti hai, isliye kamre se 1–2 °C zyada padhti hai.') },
        run(t3('It scrolls the temperature; print() also sends it to the Serial Monitor.', 'यह तापमान स्क्रॉल करता है; print() उसे सीरियल मॉनिटर पर भी भेजता है।', 'Yeh temperature scroll karta hai; print() use Serial Monitor par bhi bhejta hai.')),
        { k: 'watch', until: (S) => has(S, /^\d+C$/), do: t3('Watch the display and the Serial Monitor.', 'डिस्प्ले और सीरियल मॉनिटर देखिए।', 'Display aur Serial Monitor dekhiye.'), see: t3('About 27C: the room is 26 °C.', 'लगभग 27C: कमरा 26 °C का है।', 'Lagbhag 27C: kamra 26 °C ka hai.') },
        { k: 'act', until: (S) => has(S, /^(3[3-9]|[4-9]\d)C$/) && S.w('img:SAD'), do: t3('Warm it up: slide Temperature to 40 °C (a sunny window sill in May).', 'इसे गर्म कीजिए: Temperature को 40 °C तक सरकाइए (मई में धूप वाली खिड़की)।', 'Ise garam kijiye: Temperature ko 40 °C tak sarkaiye (May mein dhoop wali khidki).'), see: t3('Over 32 °C it shows a sad face first: if t > 32 is True.', '32 °C से ऊपर यह पहले उदास चेहरा दिखाता है: if t > 32 सच (True) है।', '32 °C se upar yeh pehle udaas chehra dikhata hai: if t > 32 True hai.') },
        { k: 'edit', test: (src) => /t\s*\*\s*9\s*\/\s*5\s*\+\s*32/.test(src) && /["']F["']/.test(src), set: [[/str\(t\) \+ "C"/, 'str(t * 9 / 5 + 32) + "F"']],
          do: t3('Show Fahrenheit: change str(t) + "C" to str(t * 9 / 5 + 32) + "F", then Run.', 'फ़ारेनहाइट दिखाइए: str(t) + "C" को str(t * 9 / 5 + 32) + "F" कीजिए, फिर "चलाइए"।', 'Fahrenheit dikhaiye: str(t) + "C" ko str(t * 9 / 5 + 32) + "F" karo, phir Run.'), see: t3('', '', '') },
        { k: 'watch', until: (S) => has(S, /F$/), do: t3('Watch the display.', 'डिस्प्ले देखिए।', 'Display dekhiye.'), see: t3('41 °C is 105.8 °F. In Python, / always gives a decimal number (a float), even 10 / 5 = 2.0.', '41 °C यानी 105.8 °F। Python में / हमेशा दशमलव संख्या (float) देता है, 10 / 5 भी 2.0।', '41 °C matlab 105.8 °F. Python mein / hamesha decimal number (float) deta hai, 10 / 5 bhi 2.0.') },
      ],
      done: (S) => has(S, /F$/) && S.w('img:SAD') },
    // 7 ------------------------------------------------------------------------------------------------------------
    { id: 'mbcompass', view: 'mb', code: COMPASS, drawer: [], serial: true,
      title: t3('Compass', 'कंपास', 'Compass'),
      goal: t3('Calibrate the magnetometer and make an arrow that always points north.', 'मैग्नेटोमीटर कैलिब्रेट कीजिए और ऐसा तीर बनाइए जो हमेशा उत्तर दिखाए।', 'Magnetometer calibrate kijiye aur aisa teer banaiye jo hamesha uttar dikhaye.'),
      world: world({ scene: 'compass', controls: ['heading', 'calib', 'tilt', 'A'], hud: ['compass', 'acc'], title: t3('Compass', 'कंपास', 'Compass') }),
      setup: { parts: [], wires: [] },
      steps: [
        { k: 'info', code: [4, 5, 7], do: t3('The compass chip feels the Earth\'s magnetism. compass.heading() is where the logo points: 0 north, 90 east, 180 south, 270 west.', 'कंपास चिप पृथ्वी का चुंबकत्व महसूस करती है। compass.heading() बताता है कि लोगो किधर है: 0 उत्तर, 90 पूर्व, 180 दक्षिण, 270 पश्चिम।', 'Compass chip prithvi ka magnetism mehsoos karti hai. compass.heading() batata hai ki logo kidhar hai: 0 uttar, 90 poorv, 180 dakshin, 270 paschim.'), see: t3('', '', '') },
        run(t3('First it asks you to calibrate: TILT TO FILL SCREEN.', 'पहले यह कैलिब्रेट करने को कहता है: TILT TO FILL SCREEN।', 'Pehle yeh calibrate karne ko kehta hai: TILT TO FILL SCREEN.')),
        { k: 'act', until: (S) => S.w('calibrated'), do: t3('Tilt the board round in circles (drag it) until all 25 LEDs are lit. Or press "Tilt it around for me".', 'बोर्ड को गोल-गोल झुकाइए (खींचकर) जब तक सारी 25 एलईडी न जल जाएँ। या "मेरे लिए चारों ओर झुकाइए" दबाइए।', 'Board ko gol-gol jhukaiye (kheench kar) jab tak saari 25 LEDs na jal jaayein. Ya "Mere liye chaaron taraf jhukaiye" dabaiye.'), see: t3('Calibrating teaches it the magnetism of the room and of the board itself.', 'कैलिब्रेट करने से यह कमरे का और बोर्ड का अपना चुंबकत्व सीख लेता है।', 'Calibrate karne se yeh kamre ka aur board ka apna magnetism seekh leta hai.') },
        { k: 'act', until: (S) => S.wv('heading') >= 70 && S.wv('heading') <= 110 && S.wv('shownImg') === 'ARROW_W', do: t3('Turn the board so its logo points east (slider "Turn the board": 90°).', 'बोर्ड को घुमाइए ताकि लोगो पूर्व की ओर हो (स्लाइडर "बोर्ड घुमाइए": 90°)।', 'Board ko ghumaiye taaki logo poorv ki taraf ho (slider "Board ghumaiye": 90°).'), see: t3('The arrow points left: that way is north.', 'तीर बाईं ओर है: उत्तर उसी तरफ़ है।', 'Teer left ki taraf hai: uttar usi taraf hai.') },
        { k: 'act', until: (S) => S.wv('heading') >= 160 && S.wv('heading') <= 200 && S.wv('shownImg') === 'ARROW_S', do: t3('Now point it south (180°).', 'अब इसे दक्षिण की ओर कीजिए (180°)।', 'Ab ise dakshin ki taraf kijiye (180°).'), see: t3('North is behind you now: the arrow points back down.', 'अब उत्तर आपके पीछे है: तीर नीचे की ओर है।', 'Ab uttar aapke peeche hai: teer neeche ki taraf hai.') },
        { k: 'edit', test: (src) => /button_a\.was_pressed\(\)/.test(src) && /display\.scroll\(\s*(h|str\(h\))\s*\)/.test(src), set: [[/    print\(h\)/, '    if button_a.was_pressed():\n        display.scroll(h)\n    print(h)']],
          do: t3('Show the number when A is pressed: above print(h) add\n    if button_a.was_pressed():\n        display.scroll(h)\nthen Run.', 'A दबाने पर संख्या दिखाइए: print(h) के ऊपर लिखिए\n    if button_a.was_pressed():\n        display.scroll(h)\nफिर "चलाइए"।', 'A dabane par number dikhaiye: print(h) ke upar likhiye\n    if button_a.was_pressed():\n        display.scroll(h)\nphir Run.'), see: t3('', '', '') },
        { k: 'act', until: (S) => S.w('scrolled') && (S.wv('nums') || []).some((x) => x >= 0 && x <= 359), do: t3('Press A.', 'A दबाइए।', 'A dabaiye.'), see: t3('Scouts and sailors read directions as numbers like this: "head 225°".', 'स्काउट और नाविक दिशा ऐसी ही संख्याओं में पढ़ते हैं: "225° की ओर चलो"।', 'Scouts aur navik disha aisi hi numbers mein padhte hain: "225° ki taraf chalo".') },
      ],
      done: (S) => S.w('calibrated') && S.w('scrolled') && ['ARROW_N', 'ARROW_E', 'ARROW_S', 'ARROW_W'].some((a) => S.w('img:' + a)) },
    // 8 ------------------------------------------------------------------------------------------------------------
    { id: 'mbnight', view: 'mb', code: NIGHT, drawer: [], serial: true,
      title: t3('Night light', 'रात की बत्ती', 'Night light'),
      goal: t3('Measure light with the LEDs themselves and switch the lights on in the dark.', 'एलईडी से ही रोशनी नापिए और अँधेरे में बत्ती जलाइए।', 'LEDs se hi roshni naapiye aur andhere mein batti jalaiye.'),
      world: world({ scene: 'night', controls: ['light'], hud: ['light'], title: t3('Night light', 'रात की बत्ती', 'Night light') }),
      setup: { parts: [], wires: [] },
      steps: [
        { k: 'info', code: [5], do: t3('The micro:bit has no separate light sensor: its LEDs can measure light! display.read_light_level() gives 0 (dark) to 255 (bright).', 'micro:bit में अलग से रोशनी का सेंसर नहीं है: इसकी एलईडी ही रोशनी नाप सकती हैं! display.read_light_level() 0 (अँधेरा) से 255 (तेज़ रोशनी) देता है।', 'micro:bit mein alag se light sensor nahi hai: iski LEDs hi roshni naap sakti hain! display.read_light_level() 0 (andhera) se 255 (tez roshni) deta hai.'), see: t3('', '', '') },
        run(),
        { k: 'act', until: (S) => S.w('allLit') && S.wv('light') < 50, do: t3('Make the room dark: slide Room light down to 10% (or the 💡 slider in the tool bar).', 'कमरे में अँधेरा कीजिए: Room light को 10% तक नीचे सरकाइए (या टूल बार का 💡 स्लाइडर)।', 'Kamre mein andhera kijiye: Room light ko 10% tak neeche sarkaiye (ya tool bar ka 💡 slider).'), see: t3('In the dark, all 25 LEDs come on.', 'अँधेरे में सारी 25 एलईडी जल जाती हैं।', 'Andhere mein saari 25 LEDs jal jaati hain.') },
        { k: 'act', until: (S) => S.w('allLit') && S.wv('light') > 100 && S.wv('shown').every((v) => !v), do: t3('Turn the room light up again.', 'कमरे की रोशनी फिर से बढ़ाइए।', 'Kamre ki roshni phir se badhaiye.'), see: t3('Bright again: the LEDs go off. Street lights work like this.', 'फिर से रोशनी: एलईडी बुझ जाती हैं। सड़क की बत्तियाँ ऐसे ही काम करती हैं।', 'Phir se roshni: LEDs bujh jaati hain. Sadak ki battiyan aise hi kaam karti hain.') },
        { k: 'edit', test: (src) => /Image\(\s*["']([1-8]{5}:){4}[1-8]{5}["']\s*\)/.test(src), set: [[/"99999:99999:99999:99999:99999"/, '"33333:33333:33333:33333:33333"']],
          do: t3('A softer light: in the Image change every 9 to 3 (brightness goes from 0 to 9), then Run.', 'हल्की रोशनी: Image में हर 9 को 3 कीजिए (चमक 0 से 9 तक होती है), फिर "चलाइए"।', 'Halki roshni: Image mein har 9 ko 3 karo (brightness 0 se 9 tak hoti hai), phir Run.'), see: t3('', '', '') },
        { k: 'act', until: (S) => S.wv('allLit') > 0 && S.wv('allLit') < 9 && S.wv('light') < 50, do: t3('Make it dark again.', 'फिर से अँधेरा कीजिए।', 'Phir se andhera kijiye.'), see: t3('A gentle glow, kinder to sleepy eyes, and it uses less battery.', 'हल्की चमक, नींद भरी आँखों के लिए अच्छी, और बैटरी भी कम ख़र्च होती है।', 'Halki chamak, neend bhari aankhon ke liye achhi, aur battery bhi kam kharch hoti hai.') },
      ],
      done: (S) => S.wv('allLit') > 0 && S.wv('allLit') < 9 },
    // 9 ------------------------------------------------------------------------------------------------------------
    { id: 'mbrps', view: 'mbtwo', code: RPS, drawer: [],
      title: t3('Rock, paper, scissors by radio', 'रेडियो से पत्थर-काग़ज़-कैंची', 'Radio se rock-paper-scissors'),
      goal: t3('Two micro:bits run the same program and play over the radio: send, receive, compare.', 'दो micro:bit एक ही प्रोग्राम चलाते हैं और रेडियो पर खेलते हैं: भेजो, पाओ, मिलाओ।', 'Do micro:bits ek hi program chalate hain aur radio par khelte hain: bhejo, paao, milao.'),
      world: world({ scene: 'rps', boards: 2, battery: true, controls: ['shake', 'friend'], hud: ['radio'], title: t3('Two micro:bits', 'दो micro:bit', 'Do micro:bits') }),
      setup: { parts: [], wires: [] },
      steps: [
        { k: 'info', do: t3('Yours on the left, your friend\'s on the right. Both run the program in the editor, as when you both download it. They talk by radio.', 'बाईं ओर आपका, दाईं ओर दोस्त का। दोनों एडिटर वाला प्रोग्राम चलाते हैं, जैसे आप दोनों ने उसे डाउनलोड किया हो। ये रेडियो से बात करते हैं।', 'Left mein aapka, right mein dost ka. Dono editor wala program chalate hain, jaise aap dono ne use download kiya ho. Yeh radio se baat karte hain.'), see: t3('', '', '') },
        { k: 'info', code: [6, 7, 15, 16], do: t3('radio.on() switches the radio on. group=7 is like a channel: only boards in the same group hear each other. radio.send() sends a message; radio.receive() gives the next one, or None.', 'radio.on() रेडियो चालू करता है। group=7 एक चैनल जैसा है: एक ही group वाले बोर्ड ही एक-दूसरे को सुनते हैं। radio.send() संदेश भेजता है; radio.receive() अगला संदेश देता है, या None।', 'radio.on() radio on karta hai. group=7 ek channel jaisa hai: ek hi group wale boards hi ek doosre ko sunte hain. radio.send() message bhejta hai; radio.receive() agla message deta hai, ya None.'), see: t3('', '', '') },
        run(),
        { k: 'act', until: (S) => { const r = S.wv('radio'); return !!r && (r.sent[0] || 0) >= 1; }, do: t3('Shake your micro:bit (drag it quickly to and fro, or "Shake it").', 'अपना micro:bit हिलाइए (तेज़ी से इधर-उधर खींचिए, या "हिलाइए")।', 'Apna micro:bit hilaiye (tezi se idhar-udhar kheenchiye, ya "Hilaiye").'), see: t3('It picks R, P or S at random, shows it, and sends it: watch the radio ring.', 'यह R, P या S में से कोई एक चुनता है, दिखाता है, और भेजता है: रेडियो की लहर देखिए।', 'Yeh R, P ya S mein se koi ek chunta hai, dikhata hai, aur bhejta hai: radio ki lehar dekhiye.') },
        { k: 'act', until: (S) => S.wv('results') >= 1 && S.wv('friendResults') >= 1, do: t3('Now your friend shakes theirs ("Friend shakes").', 'अब आपका दोस्त अपना हिलाए ("दोस्त हिलाए")।', 'Ab aapka dost apna hilaye ("Dost hilaye").'), see: t3('Each board compares its sign with the one it received: a smile means you won, a sad face you lost, "meh" a draw.', 'हर बोर्ड अपना चिह्न मिले हुए चिह्न से मिलाता है: मुस्कान यानी आप जीते, उदास चेहरा यानी हारे, "meh" यानी बराबरी।', 'Har board apna sign mile hue sign se milata hai: smile matlab aap jeete, udaas chehra matlab haare, "meh" matlab barabari.') },
        { k: 'act', until: (S) => S.wv('results') >= 3, do: t3('Play two more rounds: both shake each time.', 'दो राउंड और खेलिए: हर बार दोनों हिलाएँ।', 'Do round aur kheliye: har baar dono hilayein.'), see: t3('mine + theirs in ["RS", "PR", "SP"]: rock beats scissors, paper beats rock, scissors beat paper.', 'mine + theirs in ["RS", "PR", "SP"]: पत्थर कैंची को हराता है, काग़ज़ पत्थर को, कैंची काग़ज़ को।', 'mine + theirs in ["RS", "PR", "SP"]: rock scissors ko harata hai, paper rock ko, scissors paper ko.') },
        { k: 'edit', test: (src) => { const m = /radio\.config\(\s*group\s*=\s*(\d+)\s*\)/.exec(src); return !!m && +m[1] !== 7 && +m[1] <= 255; }, set: [[/group=7/, 'group=42']],
          do: t3('Choose your own group, so other pairs in the class do not join in: change group=7 to a number from 0 to 255, then Run.', 'अपना group चुनिए, ताकि कक्षा के दूसरे जोड़े बीच में न आएँ: group=7 को 0 से 255 के बीच की कोई संख्या कीजिए, फिर "चलाइए"।', 'Apna group chuniye, taaki class ke doosre jode beech mein na aayein: group=7 ko 0 se 255 ke beech ka koi number karo, phir Run.'), see: t3('Both boards get the new program, so they are still in the same group.', 'दोनों बोर्ड को नया प्रोग्राम मिलता है, इसलिए वे अब भी एक ही group में हैं।', 'Dono boards ko naya program milta hai, isliye woh ab bhi ek hi group mein hain.') },
        { k: 'act', until: (S) => S.wv('results') >= 1 && S.wv('friendResults') >= 1, do: t3('Play one more round in your new group.', 'नए group में एक राउंड और खेलिए।', 'Naye group mein ek round aur kheliye.'), see: t3('Radio messages are how micro:bits make quiz buzzers, step races and class votes.', 'रेडियो संदेशों से micro:bit क्विज़ बज़र, क़दमों की रेस और कक्षा के वोट बनाते हैं।', 'Radio messages se micro:bit quiz buzzer, steps ki race aur class ke vote banate hain.') },
      ],
      done: (S) => S.wv('results') >= 1 && S.wv('friendResults') >= 1 },
    // 10 -----------------------------------------------------------------------------------------------------------
    { id: 'mbplant', view: 'mbwide', code: PLANT, drawer: [], serial: true,
      title: t3('Plant waterer', 'पौधे को पानी की याद', 'Paudhe ko paani ki yaad'),
      goal: t3('Clip two nails in a plant pot to pin 0 and 3V to sense the soil, and an LED on pin 1 to ask for water.', 'गमले की दो कीलों को पिन 0 और 3V से क्लिप कीजिए ताकि मिट्टी की नमी पता चले, और पिन 1 पर एलईडी जो पानी माँगे।', 'Gamle ki do keelon ko pin 0 aur 3V se clip kijiye taaki mitti ki nami pata chale, aur pin 1 par LED jo paani maange.'),
      world: world({ scene: 'plant', parts: [{ tag: 'soil', type: 'soil', m: 0.42 }, { tag: 'led1', type: 'led', color: 'red' }], dry: 0.03, battery: false, controls: ['water'], hud: ['soil', 'led'], cx: -10, title: t3('Plant waterer', 'पौधे को पानी', 'Paudhe ko paani') }),
      setup: { parts: [], wires: [] },
      steps: [
        { k: 'info', do: t3('Wet soil lets electricity through more easily than dry soil. Two nails in the soil and a pin that measures voltage make a moisture sensor.', 'गीली मिट्टी से बिजली सूखी मिट्टी के मुक़ाबले आसानी से गुज़रती है। मिट्टी में दो कीलें और वोल्टेज नापने वाला पिन मिलकर नमी का सेंसर बनाते हैं।', 'Geeli mitti se bijli sookhi mitti ke muqable aasani se guzarti hai. Mitti mein do keelein aur voltage naapne wala pin milkar nami ka sensor banate hain.'), see: t3('Tap a pad, then the thing the clip goes to.', 'पहले पैड छूइए, फिर वह चीज़ जिस पर क्लिप जाएगी।', 'Pehle pad touch karo, phir woh cheez jispar clip jaayegi.') },
        { k: 'act', clip: ['3V', 'soil.N1'], until: (S) => S.w('conn:3V~soil.N1'), do: t3('Clip 3V to the left nail: tap 3V, then the nail.', '3V को बाईं कील से क्लिप कीजिए: पहले 3V छूइए, फिर कील।', '3V ko left keel se clip kijiye: pehle 3V touch karo, phir keel.'), see: t3('The blue shape shows where the clip goes.', 'नीली आकृति दिखाती है कि क्लिप कहाँ जाएगी।', 'Neeli shape dikhati hai ki clip kahan jaayegi.') },
        { k: 'act', clip: ['P0', 'soil.N2'], until: (S) => S.w('conn:P0~soil.N2'), do: t3('Clip pin 0 to the right nail.', 'पिन 0 को दाईं कील से क्लिप कीजिए।', 'Pin 0 ko right keel se clip kijiye.'), see: t3('', '', '') },
        { k: 'act', clip: ['P1', 'led1.A'], until: (S) => S.w('conn:P1~led1.A'), do: t3('Clip pin 1 to the LED\'s long leg (+).', 'पिन 1 को एलईडी के लंबे पैर (+) से क्लिप कीजिए।', 'Pin 1 ko LED ke lambe pair (+) se clip kijiye.'), see: t3('', '', '') },
        { k: 'act', clip: ['GND', 'led1.K'], until: (S) => S.w('conn:GND~led1.K'), do: t3('Clip GND to the LED\'s short leg (−).', 'GND को एलईडी के छोटे पैर (−) से क्लिप कीजिए।', 'GND ko LED ke chhote pair (−) se clip kijiye.'), see: t3('A micro:bit pin gives only a little current, so a small LED can go straight on it.', 'micro:bit का पिन थोड़ा-सा ही करंट देता है, इसलिए छोटी एलईडी सीधे उस पर लग सकती है।', 'micro:bit ka pin thoda sa hi current deta hai, isliye chhoti LED seedhe uspar lag sakti hai.') },
        { k: 'check', do: t3('Press "Check my circuit".', '"मेरा सर्किट जाँचिए" दबाइए।', '"Mera circuit check karo" dabaiye.'), see: t3('', '', '') },
        run(t3('pin0.read_analog() measures the voltage on pin 0 as 0 to 1023. The Serial Monitor shows each reading.', 'pin0.read_analog() पिन 0 का वोल्टेज 0 से 1023 के रूप में नापता है। सीरियल मॉनिटर हर रीडिंग दिखाता है।', 'pin0.read_analog() pin 0 ka voltage 0 se 1023 ke roop mein naapta hai. Serial Monitor har reading dikhata hai.')),
        { k: 'watch', until: (S) => S.w('lit:led1') && S.w('img:SAD'), do: t3('Watch the soil dry out: the plant droops and the reading falls.', 'मिट्टी को सूखते देखिए: पौधा मुरझाता है और रीडिंग घटती है।', 'Mitti ko sookhte dekhiye: paudha murjhata hai aur reading ghatti hai.'), see: t3('Below 400 the soil is dry: the LED lights up and the face is sad.', '400 से नीचे मिट्टी सूखी है: एलईडी जलती है और चेहरा उदास होता है।', '400 se neeche mitti sookhi hai: LED jalti hai aur chehra udaas hota hai.') },
        { k: 'act', until: (S) => S.w('img:HAPPY') && !S.w('lit:led1') && (S.wv('analog').P0 || 0) > 600, do: t3('Water the plant: tap the pot or press "Water the plant".', 'पौधे को पानी दीजिए: गमले को छूइए या "पौधे को पानी दीजिए" दबाइए।', 'Paudhe ko paani dijiye: gamle ko touch karo ya "Paudhe ko paani dijiye" dabaiye.'), see: t3('The reading jumps up, the LED goes off, the face smiles. Farmers use sensors like this to save water.', 'रीडिंग ऊपर जाती है, एलईडी बुझती है, चेहरा मुस्कुराता है। किसान पानी बचाने के लिए ऐसे सेंसर इस्तेमाल करते हैं।', 'Reading upar jaati hai, LED bujhti hai, chehra muskurata hai. Kisaan paani bachane ke liye aise sensors use karte hain.') },
      ],
      check: [noShort, clipNeed('3V', 'soil.N1', '3V', t3('the left nail', 'बाईं कील', 'left keel')), clipNeed('P0', 'soil.N2', 'pin 0', t3('the right nail', 'दाईं कील', 'right keel')),
        (S) => (S.w('conn:P1~led1.K') && S.w('conn:GND~led1.A') ? [X.swapLed] : null), clipNeed('P1', 'led1.A', 'pin 1', t3('the LED\'s long leg (+)', 'एलईडी का लंबा पैर (+)', 'LED ka lamba pair (+)')), clipNeed('GND', 'led1.K', 'GND', t3('the LED\'s short leg (−)', 'एलईडी का छोटा पैर (−)', 'LED ka chhota pair (−)'))],
      done: (S) => S.w('img:HAPPY') && S.w('img:SAD') && S.w('conn:P1~led1.A') },
    // 11 -----------------------------------------------------------------------------------------------------------
    { id: 'mbgate', view: 'mbwide', code: GATE, drawer: [],
      title: t3('Servo gate', 'सर्वो गेट', 'Servo gate'),
      goal: t3('Clip a servo to pin 0, 3V and GND and open and shut a gate with buttons A and B.', 'सर्वो को पिन 0, 3V और GND से क्लिप कीजिए और बटन A और B से गेट खोलिए-बंद कीजिए।', 'Servo ko pin 0, 3V aur GND se clip kijiye aur button A aur B se gate kholiye-band kijiye.'),
      world: world({ scene: 'gate', parts: [{ tag: 'sv1', type: 'servo' }], controls: ['A', 'B'], hud: ['servo', 'buttons'], cx: -20, title: t3('Servo gate', 'सर्वो गेट', 'Servo gate') }),
      setup: { parts: [], wires: [] },
      steps: [
        { k: 'info', do: t3('A servo turns to an angle and holds it there. Its signal is a pulse every 20 ms: 0.5 ms long means 0°, 2.5 ms means 180°.', 'सर्वो किसी कोण तक घूमकर वहीं रुका रहता है। इसका सिग्नल हर 20 ms पर एक पल्स है: 0.5 ms लंबी यानी 0°, 2.5 ms यानी 180°।', 'Servo kisi angle tak ghoom kar wahin ruka rehta hai. Iska signal har 20 ms par ek pulse hai: 0.5 ms lambi matlab 0°, 2.5 ms matlab 180°.'), see: t3('', '', '') },
        { k: 'act', clip: ['P0', 'sv1.SIG'], until: (S) => S.w('conn:P0~sv1.SIG'), do: t3('Clip pin 0 to the servo plug\'s orange (signal) pin.', 'पिन 0 को सर्वो प्लग के नारंगी (सिग्नल) पिन से क्लिप कीजिए।', 'Pin 0 ko servo plug ke orange (signal) pin se clip kijiye.'), see: t3('', '', '') },
        { k: 'act', clip: ['3V', 'sv1.VP'], until: (S) => S.w('conn:3V~sv1.VP'), do: t3('Clip 3V to the red (+) pin.', '3V को लाल (+) पिन से क्लिप कीजिए।', '3V ko red (+) pin se clip kijiye.'), see: t3('', '', '') },
        { k: 'act', clip: ['GND', 'sv1.GND'], until: (S) => S.w('conn:GND~sv1.GND'), do: t3('Clip GND to the brown pin.', 'GND को भूरे पिन से क्लिप कीजिए।', 'GND ko brown pin se clip kijiye.'), see: t3('', '', '') },
        { k: 'check', do: t3('Press "Check my circuit".', '"मेरा सर्किट जाँचिए" दबाइए।', '"Mera circuit check karo" dabaiye.'), see: t3('', '', '') },
        { k: 'info', code: [4, 5, 6], do: t3('def angle(a): makes your own command. write_analog(26) gives a 0.5 ms pulse (0°), write_analog(128) a 2.5 ms pulse (180°).', 'def angle(a): आपका अपना कमांड बनाता है। write_analog(26) 0.5 ms की पल्स (0°) देता है, write_analog(128) 2.5 ms की पल्स (180°)।', 'def angle(a): aapka apna command banata hai. write_analog(26) 0.5 ms ki pulse (0°) deta hai, write_analog(128) 2.5 ms ki pulse (180°).'), see: t3('', '', '') },
        run(t3('angle(90): the boom stays across the road.', 'angle(90): बूम सड़क के आर-पार रहता है।', 'angle(90): boom sadak ke aar-paar rehta hai.')),
        { k: 'act', until: (S) => { const s = (S.wv('servo') || {}).sv1; return !!s && s.max >= 170; }, do: t3('Press A to open the gate.', 'गेट खोलने के लिए A दबाइए।', 'Gate kholne ke liye A dabaiye.'), see: t3('The servo turns to 180° and the boom swings open. On 3 V a servo is slower than on 5 V.', 'सर्वो 180° तक घूमता है और बूम खुल जाता है। 3 V पर सर्वो 5 V से धीमा चलता है।', 'Servo 180° tak ghoomta hai aur boom khul jaata hai. 3 V par servo 5 V se dheema chalta hai.') },
        { k: 'act', until: (S) => { const s = (S.wv('servo') || {}).sv1; return !!s && s.max >= 170 && S.app.world.parts.sv1.state.angle <= 100; }, do: t3('Press B to shut it.', 'बंद करने के लिए B दबाइए।', 'Band karne ke liye B dabaiye.'), see: t3('Back to 90°: across the road.', 'वापस 90°: सड़क के आर-पार।', 'Wapas 90°: sadak ke aar-paar.') },
        { k: 'edit', test: (src) => /angle\(\s*1[23]\d\s*\)/.test(src) && !/angle\(\s*180\s*\)/.test(src), set: [[/angle\(180\)/, 'angle(135)']], do: t3('Open it only halfway: change angle(180) to angle(135), then Run.', 'इसे आधा ही खोलिए: angle(180) को angle(135) कीजिए, फिर "चलाइए"।', 'Ise aadha hi kholiye: angle(180) ko angle(135) karo, phir Run.'), see: t3('', '', '') },
        { k: 'act', until: (S) => { const s = (S.wv('servo') || {}).sv1; return !!s && s.max >= 120 && s.max <= 150; }, do: t3('Press A.', 'A दबाइए।', 'A dabaiye.'), see: t3('135°: halfway. Car parks and railway crossings work this way, with bigger servos.', '135°: आधा। पार्किंग और रेलवे फाटक ऐसे ही काम करते हैं, बड़े सर्वो के साथ।', '135°: aadha. Parking aur railway phatak aise hi kaam karte hain, bade servos ke saath.') },
      ],
      check: [noShort, clipNeed('P0', 'sv1.SIG', 'pin 0', t3('the orange (signal) pin', 'नारंगी (सिग्नल) पिन', 'orange (signal) pin')), (S) => (S.w('conn:3V~sv1.VP') && S.w('conn:GND~sv1.GND') ? null : [X.servoPow])],
      done: (S) => { const s = (S.wv('servo') || {}).sv1; return !!s && s.max >= 120 && s.max <= 150; } },
  ];
  // the school class each lesson is made for (as batch 3's `cls`)
  const CLS = { mbmeet: '6', mbbadge: '6', mbheart: '6', mbcount: '6–7', mbsteps: '7', mbtemp: '7', mbcompass: '7–8', mbnight: '7–8', mbrps: '8', mbplant: '8–9', mbgate: '9' };
  L.forEach((l, i) => { l.n = n0 + i + 1; l.lang = 'py'; l.batch = 5; l.cls = CLS[l.id]; });
  void W; return L;
}
