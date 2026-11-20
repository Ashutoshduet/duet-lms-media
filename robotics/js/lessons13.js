// DUET Robotics Lab 360, batch 13: micro:bit projects for the Class 4 and Class 5 sessions still to come (Python, or
// blocks): a dimmer (a knob on pin 1, an LED on pin 0 with PWM), a hot-or-cold hunt by radio signal strength (RSSI:
// microbit.js works it out from the distance on the panel and the sender's power), and an exercise coach that learns
// your best and sets the next target from it. Written fresh for DUET. Same shape as lessons9.js (tick, S.memRun, S.mem);
// devtools/test/robocore13.mjs plays every one.
import { MBCore, MBX } from './microbit.js';

const make = (app, cfg) => new MBCore(app, cfg);
const centre = (dx, dz) => (focus) => ({ c: [MBX + dx, 0, dz], k: focus === 'robot' ? 0.55 : 1 });
const world = (o) => Object.assign({ kind: 'mb', make, centre: centre(o.cx || 0, o.cz || 0) }, o);
const img = (S) => S.wv('shownImg');
const px = (S) => [...(S.wv('shown') || [])];
const lit = (S) => px(S).filter((v) => v > 0).length;
const nums = (S) => (S.wv('nums') || []).map(Number);
const lastNum = (S) => { const n = nums(S); return n.length ? n[n.length - 1] : null; };
const ran = (S, re) => re.test(S.runSrc || '');
const lines = (S, re) => (S.serLines || []).map((l) => re.exec(String(l).trim())).filter(Boolean);

// ------------------------------------------------------------------ the programs
const DIMMER = `# Dimmer: the knob on pin 1 sets how bright the LED on pin 0 glows
from microbit import *

while True:
    knob = pin1.read_analog()        # 0 (turned left) to 1023 (turned right)
    pin0.write_analog(knob)          # the same number: 0 = off, 1023 = full brightness
    display.show(knob * 9 // 1023)   # 0 to 9 on the screen
    sleep(50)
`;
const HOTCOLD = `# Hot or cold: hide your friend's micro:bit, then find it by its radio signal.
# Both boards send "ping". The closer they are, the stronger the signal (RSSI).
from microbit import *
import radio

radio.config(group=7, power=7)
radio.on()
while True:
    radio.send("ping")
    msg = radio.receive_full()
    if msg:
        rssi = msg[1]                    # signal strength: -45 is strong, -95 is weak
        print(rssi)
        bars = (rssi + 98) // 10         # 0 to 5 bars
        bars = max(0, min(5, bars))
        display.clear()
        for y in range(bars):
            for x in range(5):
                display.set_pixel(x, 4 - y, 9)
    sleep(200)
`;
const COACH = `# Exercise coach: jumping jacks for 20 seconds. It learns from you:
# the next target is your best so far + 2.
from microbit import *
import music

best = 0
target = 5                                  # the first goal
display.show(Image.ARROW_W)                 # press A to start a set
while True:
    if button_a.was_pressed():
        display.show(Image.YES)
        accelerometer.was_gesture("shake")  # forget a shake from before the set
        jumps = 0
        start = running_time()
        while running_time() - start < 20000:   # one set: 20 seconds
            if accelerometer.was_gesture("shake"):
                jumps += 1
                display.show(jumps % 10)
            sleep(20)
        music.play(music.BA_DING)
        print("jumps", jumps, "target", target)
        if jumps >= target:
            display.show(Image.HAPPY)
        else:
            display.show(Image.SAD)
        if jumps > best:
            best = jumps
        target = best + 2                   # the coach learns: a little more next time
        sleep(2000)
        display.show(Image.ARROW_W)
    sleep(20)
`;

const WORM = `# Inchworm robot: one servo bends and straightens the body. The rubber foot at the back
# grips and the stick foot at the front slides, so every bend moves it a little forward.
from microbit import *

def angle(a):
    pin0.write_analog(int(26 + a * 102 / 180))    # 0.5 ms (0 degrees) to 2.5 ms (180) pulses

pin0.set_analog_period(20)
angle(150)
steps = 0
walking = False
while True:
    if button_a.was_pressed():
        walking = not walking          # A: start or stop
    if walking:
        angle(90)                      # bend: the back slides up behind the front
        sleep(500)
        angle(150)                     # straighten: the front slides forward
        sleep(500)
        steps += 1
        print("step", steps)
        display.show(steps % 10)
    else:
        display.show(Image.ASLEEP)
        sleep(50)
`;

// ------------------------------------------------------------------ the lessons
export function batch13(K, n0) {
  const { t3 } = K;
  const T = (en, hi, hg) => t3(en, hi, hg);
  const E = T('', '', '');
  const run = (see) => ({ k: 'run', do: T('Press Run.', '"चलाइए" दबाइए।', 'Run dabaiye.'), see: see || T('The program goes into the micro:bit and starts.', 'प्रोग्राम micro:bit में जाकर चलने लगता है।', 'Program micro:bit mein jaakar chalne lagta hai.') });
  const run2 = () => run(T('The same program goes into both micro:bits, yours and your friend\'s.', 'एक ही प्रोग्राम दोनों micro:bit में जाता है, आपके और दोस्त के।', 'Ek hi program dono micro:bits mein jaata hai, aapke aur dost ke.'));
  const info = (code, d, s) => ({ k: 'info', code, do: d, see: s || E });
  const act = (until, d, s) => ({ k: 'act', until, do: d, see: s || E });
  const edit = (test, set, d) => ({ k: 'edit', test, set, do: d, see: E });
  const check = () => ({ k: 'check', do: T('Press "Check my circuit".', '"मेरा सर्किट जाँचिए" दबाइए।', '"Mera circuit check karo" dabaiye.'), see: E });
  const clip = (a, b, d, s) => ({ k: 'act', clip: [a, b], until: (S) => S.w(`conn:${a}~${b}`), do: d, see: s || E });
  const X = {
    clip: T('A crocodile clip is missing: {a} must be joined to {b}.', 'एक क्रोकोडाइल क्लिप कम है: {a} को {b} से जोड़िए।', 'Ek crocodile clip kam hai: {a} ko {b} se jodiye.'),
    short: T('3V is clipped straight to GND: that is a short circuit! Take that clip off.', '3V सीधे GND से जुड़ा है: यह शॉर्ट सर्किट है! वह क्लिप हटाइए।', '3V seedhe GND se juda hai: yeh short circuit hai! Woh clip hataiye.'),
    swapLed: T('The LED is the wrong way round: its long leg (+) goes to pin 0, its short leg (−) to GND.', 'एलईडी उल्टी लगी है: लंबा पैर (+) पिन 0 पर, छोटा पैर (−) GND पर।', 'LED ulti lagi hai: lamba pair (+) pin 0 par, chhota pair (−) GND par.'),
    servoPow: T('The servo\'s red (+) wire must go to 3V and its brown wire to GND, or it has no power.', 'सर्वो का लाल (+) तार 3V पर और भूरा तार GND पर जाना चाहिए, वरना उसे बिजली नहीं मिलेगी।', 'Servo ka laal (+) taar 3V par aur bhoora taar GND par jaana chahiye, warna use bijli nahi milegi.'),
    knobEnds: T('The knob\'s two ends go to GND (end 1) and 3V (end 2); without both, its middle leg has no voltage to share out.', 'नॉब के दोनों सिरे GND (सिरा 1) और 3V (सिरा 2) पर जाते हैं; दोनों के बिना इसके बीच वाले पैर के पास बाँटने को वोल्टेज नहीं होता।', 'Knob ke dono sire GND (sira 1) aur 3V (sira 2) par jaate hain; dono ke bina iske beech wale pair ke paas baantne ko voltage nahi hota.'),
  };
  const need = (a, b, an, bn) => (S) => (S.w(`conn:${a}~${b}`) ? null : [X.clip, { a: an, b: bn }]);
  const noShort = (S) => (S.w('conn:3V~GND') ? [X.short] : null);
  const ledB = (S) => { const p = S.app.world.parts.led1; return p ? p.state.b || 0 : 0; };
  const knobAt = (S) => { const p = S.app.world.parts.pot1; return p ? (p.state.pos === undefined ? 0.5 : p.state.pos) : 0.5; };
  const sets = (S) => lines(S, /^jumps (\d+) target (\d+)$/).map((m) => ({ j: +m[1], t: +m[2] }));
  const gap = (S) => S.app.world.env.gap;
  let n = n0;
  const L = [
    // 1 ------------------------------------------------------------------------------------------------- dimmer (Class 4)
    { id: 'mbdimmer', view: 'mbwide', code: DIMMER, drawer: [],
      title: T('Dimmer: knob and LED', 'डिमर: नॉब और एलईडी', 'Dimmer: knob aur LED'),
      goal: T('Turn a knob and the LED glows brighter or dimmer, like a fan regulator: the micro:bit reads the knob on pin 1 and sets the LED on pin 0.', 'नॉब घुमाइए और एलईडी तेज़ या धीमी चमकती है, पंखे के रेगुलेटर की तरह: micro:bit पिन 1 पर नॉब पढ़ता है और पिन 0 पर एलईडी चलाता है।', 'Knob ghumaiye aur LED tez ya dheemi chamakti hai, pankhe ke regulator ki tarah: micro:bit pin 1 par knob padhta hai aur pin 0 par LED chalata hai.'),
      world: world({ scene: 'dimmer', parts: [{ tag: 'led1', type: 'led', color: 'yellow' }, { tag: 'pot1', type: 'pot' }], controls: ['knob'], hud: ['knob', 'led'], title: T('Dimmer', 'डिमर', 'Dimmer') }),
      setup: { parts: [], wires: [] },
      tick: (S) => { const m = S.memRun; const b = ledB(S), k = knobAt(S), d = lastNum(S); if (k > 0.95 && b > 0.6 && d === 9) m.full = b; if (k > 0.2 && k < 0.45 && b > 0.04 && b < (m.full || 1) * 0.6 && d >= 1 && d <= 4) m.dim = b; if (ran(S, /write_analog\(knob \/\/ 4\)/) && k > 0.95 && d === 9 && b > 0.02 && b < 0.45) S.mem.night = true; },
      steps: [
        clip('P0', 'led1.A', T('Clip pin 0 to the LED\'s long leg (+).', 'पिन 0 को एलईडी के लंबे पैर (+) से क्लिप कीजिए।', 'Pin 0 ko LED ke lambe pair (+) se clip kijiye.')),
        clip('GND', 'led1.K', T('Clip GND to its short leg (−).', 'GND को इसके छोटे पैर (−) से क्लिप कीजिए।', 'GND ko iske chhote pair (−) se clip kijiye.')),
        clip('GND', 'pot1.E1', T('Clip GND to the knob\'s end 1 (left leg).', 'GND को नॉब के सिरे 1 (बायाँ पैर) से क्लिप कीजिए।', 'GND ko knob ke sire 1 (left pair) se clip kijiye.')),
        clip('3V', 'pot1.E2', T('Clip 3V to its end 2 (right leg).', '3V को इसके सिरे 2 (दायाँ पैर) से क्लिप कीजिए।', '3V ko iske sire 2 (right pair) se clip kijiye.')),
        clip('P1', 'pot1.W', T('Clip pin 1 to its middle leg (the wiper).', 'पिन 1 को इसके बीच वाले पैर (वाइपर) से क्लिप कीजिए।', 'Pin 1 ko iske beech wale pair (wiper) se clip kijiye.'),
          T('Turning the knob slides the middle leg from the GND end to the 3V end: its voltage goes from 0 to 3 V.', 'नॉब घुमाने से बीच वाला पैर GND वाले सिरे से 3V वाले सिरे तक खिसकता है: इसका वोल्टेज 0 से 3 V तक जाता है।', 'Knob ghumane se beech wala pair GND wale sire se 3V wale sire tak khisakta hai: iska voltage 0 se 3 V tak jaata hai.')),
        check(),
        info([5, 6], T('read_analog() turns the knob\'s voltage into a number from 0 to 1023; write_analog() switches pin 0 on and off very fast, on for that share of the time (PWM): the LED looks dimmer or brighter.', 'read_analog() नॉब के वोल्टेज को 0 से 1023 तक की संख्या में बदलता है; write_analog() पिन 0 को बहुत तेज़ी से चालू-बंद करता है, उतने हिस्से के लिए चालू (PWM): एलईडी धीमी या तेज़ दिखती है।', 'read_analog() knob ke voltage ko 0 se 1023 tak ke number mein badalta hai; write_analog() pin 0 ko bahut tezi se on-off karta hai, utne hisse ke liye on (PWM): LED dheemi ya tez dikhti hai.')),
        run(),
        act((S) => !!S.memRun.full, T('Turn the knob all the way up (the slider "Turn the knob" in the panel).', 'नॉब पूरा घुमाइए (पैनल में "नॉब घुमाइए" स्लाइडर)।', 'Knob poora ghumaiye (panel mein "Knob ghumaiye" slider).'), T('Full brightness, and 9 on the screen.', 'पूरी रोशनी, और स्क्रीन पर 9।', 'Poori roshni, aur screen par 9.')),
        act((S) => !!S.memRun.dim, T('Now turn it to about a third.', 'अब इसे लगभग एक-तिहाई पर लाइए।', 'Ab ise lagbhag ek-tihaai par laiye.'), T('A soft glow and 2 or 3 on the screen: the LED gets that share of the time.', 'हल्की चमक और स्क्रीन पर 2 या 3: एलईडी को समय का उतना ही हिस्सा मिलता है।', 'Halki chamak aur screen par 2 ya 3: LED ko samay ka utna hi hissa milta hai.')),
        edit((src) => /write_analog\(knob \/\/ 4\)/.test(src), [[/pin0\.write_analog\(knob\)/, 'pin0.write_analog(knob // 4)']], T('Night mode, never too bright: change pin0.write_analog(knob) to pin0.write_analog(knob // 4), then Run.', 'नाइट मोड, कभी ज़्यादा तेज़ नहीं: pin0.write_analog(knob) को pin0.write_analog(knob // 4) कीजिए, फिर "चलाइए"।', 'Night mode, kabhi zyada tez nahi: pin0.write_analog(knob) ko pin0.write_analog(knob // 4) karo, phir Run.')),
        act((S) => !!S.mem.night, T('Turn the knob all the way up again.', 'नॉब फिर से पूरा घुमाइए।', 'Knob phir se poora ghumaiye.'), T('The screen still says 9, but the LED glows at a quarter: the program, not the knob, decides the brightness. A bedroom night lamp works like this.', 'स्क्रीन अब भी 9 दिखाती है, पर एलईडी एक-चौथाई पर चमकती है: रोशनी नॉब नहीं, प्रोग्राम तय करता है। बेडरूम का नाइट लैंप ऐसे ही काम करता है।', 'Screen ab bhi 9 dikhati hai, par LED ek-chauthaai par chamakti hai: roshni knob nahi, program tay karta hai. Bedroom ka night lamp aise hi kaam karta hai.')),
      ],
      check: [noShort, (S) => (S.w('conn:P0~led1.K') && S.w('conn:GND~led1.A') ? [X.swapLed] : null), need('P0', 'led1.A', 'pin 0', T('the LED\'s long leg', 'एलईडी का लंबा पैर', 'LED ka lamba pair')), need('GND', 'led1.K', 'GND', T('the LED\'s short leg', 'एलईडी का छोटा पैर', 'LED ka chhota pair')),
        (S) => (S.w('conn:GND~pot1.E1') && S.w('conn:3V~pot1.E2')) || (S.w('conn:GND~pot1.E2') && S.w('conn:3V~pot1.E1')) ? null : [X.knobEnds], need('P1', 'pot1.W', 'pin 1', T('the knob\'s middle leg', 'नॉब का बीच वाला पैर', 'knob ka beech wala pair'))],
      done: (S) => !!S.mem.night },
    // 2 ------------------------------------------------------------------------------------------------- hot or cold (Class 4)
    { id: 'mbhotcold', view: 'mbtwo', code: HOTCOLD, drawer: [], serial: true,
      title: T('Hot or cold by radio signal strength', 'रेडियो सिग्नल की ताक़त से गर्म या ठंडा', 'Radio signal ki taakat se garam ya thanda'),
      goal: T('Hide a friend\'s micro:bit and find it by its radio signal: the closer you get, the more bars light up, as on a phone.', 'दोस्त का micro:bit छिपाइए और उसे रेडियो सिग्नल से ढूँढिए: जितना पास जाएँगे, उतनी ज़्यादा पट्टियाँ जलेंगी, फ़ोन की तरह।', 'Dost ka micro:bit chhupaiye aur use radio signal se dhoondhiye: jitna paas jaayenge, utni zyada pattiyan jalengi, phone ki tarah.'),
      world: world({ scene: 'rps', boards: 2, battery: true, gap: 8, controls: ['gap'], hud: ['gap', 'radio'], title: T('Hot or cold', 'गर्म या ठंडा', 'Garam ya thanda') }),
      setup: { parts: [], wires: [] },
      tick: (S) => { const m = S.memRun; const rs = lines(S, /^(-\d+)$/); const r = rs.length ? +rs[rs.length - 1][1] : null, g = gap(S), b = lit(S); if (r === null) return; if (g >= 20 && b <= 5) m.cold = r; if (g <= 1.5 && b >= 25) m.hot = r; if (ran(S, /power=1\b/) && g >= 2.5 && g <= 3.5 && b <= 10 && r < -70) S.mem.weak = r; },
      steps: [
        info([9, 10, 12], T('Every 0.2 s each board sends "ping". receive_full() gives the message with its signal strength (RSSI, in dBm): about −45 next to you, −90 across the playground.', 'हर 0.2 s पर दोनों बोर्ड "ping" भेजते हैं। receive_full() संदेश को उसकी सिग्नल ताक़त (RSSI, dBm में) के साथ देता है: पास में लगभग −45, खेल के मैदान के पार −90।', 'Har 0.2 s par dono board "ping" bhejte hain. receive_full() sandesh ko uski signal taakat (RSSI, dBm mein) ke saath deta hai: paas mein lagbhag −45, khel ke maidaan ke paar −90.')),
        run2(),
        act((S) => S.memRun.cold !== undefined, T('Your friend hides far away: set the distance between the boards to 25 m.', 'दोस्त दूर छिपता है: दोनों बोर्डों के बीच की दूरी 25 m कीजिए।', 'Dost door chhupta hai: dono boards ke beech ki doori 25 m kijiye.'), T('Cold: one bar or none, and the numbers are around −80.', 'ठंडा: एक पट्टी या कोई नहीं, और संख्याएँ −80 के आसपास।', 'Thanda: ek patti ya koi nahi, aur sankhyayein −80 ke aaspaas.')),
        act((S) => S.memRun.hot !== undefined, T('Walk towards it: bring the distance down to 1 m.', 'उसकी ओर चलिए: दूरी घटाकर 1 m कीजिए।', 'Uski taraf chaliye: doori ghata kar 1 m kijiye.'), T('Hot! All five bars: the signal is about −45. Radio waves spread out, so they get weaker fast as you go further.', 'गर्म! पाँचों पट्टियाँ: सिग्नल लगभग −45। रेडियो तरंगें फैलती हैं, इसलिए दूर जाने पर जल्दी कमज़ोर होती हैं।', 'Garam! Paanchon pattiyan: signal lagbhag −45. Radio tarangein phailti hain, isliye door jaane par jaldi kamzor hoti hain.')),
        edit((src) => /power=1\b/.test(src), [[/power=7/, 'power=1']], T('A harder game: change power=7 to power=1 (a weaker radio), then Run.', 'कठिन खेल: power=7 को power=1 (कमज़ोर रेडियो) कीजिए, फिर "चलाइए"।', 'Kathin khel: power=7 ko power=1 (kamzor radio) karo, phir Run.')),
        act((S) => S.mem.weak !== undefined, T('Stand 3 m away.', '3 m दूर खड़े होइए।', '3 m door khade hoiye.'), T('Only one or two bars at 3 m now: with less power you must come much closer. Hospitals and schools use this to find a lost tag.', 'अब 3 m पर सिर्फ़ एक या दो पट्टियाँ: कम ताक़त में बहुत पास आना पड़ता है। अस्पताल और स्कूल खोया टैग ढूँढने के लिए ऐसा ही करते हैं।', 'Ab 3 m par sirf ek ya do pattiyan: kam taakat mein bahut paas aana padta hai. Hospital aur school khoya tag dhoondhne ke liye aisa hi karte hain.')),
      ],
      check: [], done: (S) => S.mem.weak !== undefined },
    // 3 ------------------------------------------------------------------------------------------------- exercise coach (Class 5)
    { id: 'mbcoach', view: 'mb', code: COACH, drawer: [], serial: true,
      title: T('Simple AI exercise timer', 'आसान AI व्यायाम टाइमर', 'Aasaan AI exercise timer'),
      goal: T('A 20-second set of jumping jacks: the micro:bit counts each jump, then learns from your best and sets the next target just above it.', '20 सेकंड का जंपिंग जैक का सेट: micro:bit हर कूद गिनता है, फिर आपके सबसे अच्छे से सीखकर अगला लक्ष्य उससे थोड़ा ऊपर रखता है।', '20 second ka jumping jack ka set: micro:bit har kood ginta hai, phir aapke sabse acche se seekh kar agla lakshya usse thoda upar rakhta hai.'),
      world: world({ scene: 'desk', battery: true, controls: ['A', 'shake'], hud: ['shakes'], title: T('Exercise coach', 'व्यायाम कोच', 'Exercise coach') }),
      setup: { parts: [], wires: [] },
      tick: (S) => { const st = sets(S); const m = S.memRun; if (st.some((x) => x.t === 5 && x.j >= 5) && img(S) === 'HAPPY') m.won = true; if (m.won && st.some((x) => x.t > 5 && x.j < x.t) && img(S) === 'SAD') m.missed = true; if (ran(S, /< 10000/) && st.length >= 1) S.mem.quick = true; },
      steps: [
        info([16, 17, 26, 27, 28], T('Each shake is one jump. After the set the coach compares your jumps with the target, keeps your best, and sets target = best + 2. That is learning from data: the next goal depends on what you did.', 'हर हिलाना एक कूद है। सेट के बाद कोच आपकी कूदों की तुलना लक्ष्य से करता है, आपका सबसे अच्छा याद रखता है, और लक्ष्य = सबसे अच्छा + 2 रखता है। यही डेटा से सीखना है: अगला लक्ष्य आपके किए पर निर्भर करता है।', 'Har hilana ek kood hai. Set ke baad coach aapki koodon ki tulna lakshya se karta hai, aapka sabse accha yaad rakhta hai, aur lakshya = sabse accha + 2 rakhta hai. Yahi data se seekhna hai: agla lakshya aapke kiye par nirbhar karta hai.')),
        run(),
        act((S) => !!S.memRun.won, T('Press A, then do 6 jumping jacks (press "Shake" 6 times) before the 20 seconds are up.', 'A दबाइए, फिर 20 सेकंड पूरे होने से पहले 6 जंपिंग जैक कीजिए ("हिलाइए" 6 बार दबाइए)।', 'A dabaiye, phir 20 second poore hone se pehle 6 jumping jack kijiye ("Hilaiye" 6 baar dabaiye).'), T('A happy face: you beat the target of 5. Look at the Serial Monitor: your next target is 8.', 'मुस्कुराता चेहरा: आपने 5 का लक्ष्य पार किया। सीरियल मॉनिटर देखिए: आपका अगला लक्ष्य 8 है।', 'Muskurata chehra: aapne 5 ka lakshya paar kiya. Serial Monitor dekhiye: aapka agla lakshya 8 hai.')),
        act((S) => !!S.memRun.missed, T('A tired set: press A and do only 3 jumps.', 'थका हुआ सेट: A दबाइए और सिर्फ़ 3 कूद कीजिए।', 'Thaka hua set: A dabaiye aur sirf 3 kood kijiye.'), T('A sad face: 3 is below the target of 8. Your best stays 6, so the target stays 8: the coach does not lower the goal after one bad day.', 'उदास चेहरा: 3 लक्ष्य 8 से कम है। आपका सबसे अच्छा 6 ही रहता है, इसलिए लक्ष्य 8 रहता है: कोच एक बुरे दिन के बाद लक्ष्य नहीं घटाता।', 'Udaas chehra: 3 lakshya 8 se kam hai. Aapka sabse accha 6 hi rehta hai, isliye lakshya 8 rehta hai: coach ek bure din ke baad lakshya nahi ghatata.')),
        edit((src) => /< 10000/.test(src) && !/< 20000/.test(src), [[/< 20000/, '< 10000']], T('A quick set for the class warm-up: change < 20000 to < 10000 (10 seconds), then Run.', 'क्लास वार्म-अप के लिए छोटा सेट: < 20000 को < 10000 (10 सेकंड) कीजिए, फिर "चलाइए"।', 'Class warm-up ke liye chhota set: < 20000 ko < 10000 (10 second) karo, phir Run.')),
        act((S) => !!S.mem.quick, T('Press A and jump for the shorter set.', 'A दबाइए और छोटे सेट के लिए कूदिए।', 'A dabaiye aur chhote set ke liye koodiye.'), T('Done in 10 seconds. Smartwatches and fitness apps set goals the same way: from your own data.', '10 सेकंड में पूरा। स्मार्टवॉच और फ़िटनेस ऐप भी लक्ष्य ऐसे ही तय करते हैं: आपके अपने डेटा से।', '10 second mein poora. Smartwatch aur fitness app bhi lakshya aise hi tay karte hain: aapke apne data se.')),
      ],
      check: [], done: (S) => !!S.mem.quick },
    // 4 ------------------------------------------------------------------------------------------------- inchworm (Class 5)
    { id: 'mbinchworm', view: 'mbwide', code: WORM, drawer: [], serial: true,
      title: T('Inchworm robot (servo)', 'इंचवर्म रोबोट (सर्वो)', 'Inchworm robot (servo)'),
      goal: T('A robot with no wheels: one servo bends and straightens its body like an inchworm, and two different feet turn that wiggle into walking.', 'बिना पहियों का रोबोट: एक सर्वो इंचवर्म की तरह इसका शरीर मोड़ता और सीधा करता है, और दो अलग-अलग पैर उस हिलने को चलने में बदल देते हैं।', 'Bina pahiyon ka robot: ek servo inchworm ki tarah iska shareer modta aur seedha karta hai, aur do alag-alag pair us hilne ko chalne mein badal dete hain.'),
      world: world({ scene: 'worm', parts: [{ tag: 'sv1', type: 'servo' }], controls: ['A'], hud: ['servo', 'worm'], title: T('Inchworm robot', 'इंचवर्म रोबोट', 'Inchworm robot') }),
      setup: { parts: [], wires: [] },
      tick: (S) => { const m = S.memRun; const sv = S.app.world.parts.sv1; const d = sv ? sv.state.dist || 0 : 0; const st = lines(S, /^step (\d+)$/); if (m.d0 === undefined) m.d0 = d; m.walked = d - m.d0;
        if (st.length !== m.n) { if (m.n !== undefined && m.atStep !== undefined) m.last = d - m.atStep; m.n = st.length; m.atStep = d; } if (ran(S, /angle\(30\)/) && m.last >= 55) S.mem.big = true; },
      steps: [
        clip('P0', 'sv1.SIG', T('Clip pin 0 to the servo\'s orange (signal) wire.', 'पिन 0 को सर्वो के नारंगी (सिग्नल) तार से क्लिप कीजिए।', 'Pin 0 ko servo ke orange (signal) taar se clip kijiye.')),
        clip('3V', 'sv1.VP', T('Clip 3V to the red (+) wire.', '3V को लाल (+) तार से क्लिप कीजिए।', '3V ko red (+) taar se clip kijiye.')),
        clip('GND', 'sv1.GND', T('Clip GND to the brown (−) wire.', 'GND को भूरे (−) तार से क्लिप कीजिए।', 'GND ko brown (−) taar se clip kijiye.')),
        check(),
        info([16, 17, 18, 19], T('Bend, then straighten. While it bends, the rubber foot at the back holds and the front stays; while it straightens, the back grips and the front slides ahead. Two feet that grip differently make one wiggle into a step.', 'मोड़ो, फिर सीधा करो। मुड़ते समय पीछे का रबड़ वाला पैर पकड़े रहता है; सीधा होते समय पीछे वाला पकड़ता है और आगे वाला फिसलकर आगे बढ़ता है। अलग-अलग पकड़ वाले दो पैर एक हिलने को क़दम बना देते हैं।', 'Modo, phir seedha karo. Mudte samay peeche ka rubber wala pair pakde rehta hai; seedha hote samay peeche wala pakadta hai aur aage wala phisal kar aage badhta hai. Alag-alag pakad wale do pair ek hilne ko kadam bana dete hain.')),
        run(),
        act((S) => (S.memRun.walked || 0) >= 100, T('Press A and let it walk 10 cm along the ruler.', 'A दबाइए और इसे रूलर पर 10 cm चलने दीजिए।', 'A dabaiye aur ise ruler par 10 cm chalne dijiye.'), T('About 3 cm a step, a bend of 60° each time.', 'हर क़दम लगभग 3 cm, हर बार 60° का मोड़।', 'Har kadam lagbhag 3 cm, har baar 60° ka mod.')),
        edit((src) => /angle\(30\)/.test(src) && (src.match(/sleep\(800\)/g) || []).length === 2, [[/angle\(90\)/, 'angle(30)'], [/sleep\(500\)/g, 'sleep(800)']], T('Bigger steps: change angle(90) to angle(30) (a 120° bend) and both sleep(500) to sleep(800), then Run and press A.', 'बड़े क़दम: angle(90) को angle(30) (120° का मोड़) और दोनों sleep(500) को sleep(800) कीजिए, फिर "चलाइए" और A दबाइए।', 'Bade kadam: angle(90) ko angle(30) (120° ka mod) aur dono sleep(500) ko sleep(800) karo, phir Run aur A dabaiye.')),
        act((S) => !!S.mem.big, T('Watch a few steps.', 'कुछ क़दम देखिए।', 'Kuch kadam dekhiye.'), T('About 6 cm a step now: twice the bend, twice the stride. The longer sleeps matter: on 3 V the servo turns only about 180° a second, so a 120° bend needs about 0.7 s.', 'अब हर क़दम लगभग 6 cm: दुगना मोड़, दुगना क़दम। लंबे sleep ज़रूरी हैं: 3 V पर सर्वो एक सेकंड में सिर्फ़ लगभग 180° घूमता है, इसलिए 120° के मोड़ को लगभग 0.7 s चाहिए।', 'Ab har kadam lagbhag 6 cm: dugna mod, dugna kadam. Lambe sleep zaroori hain: 3 V par servo ek second mein sirf lagbhag 180° ghoomta hai, isliye 120° ke mod ko lagbhag 0.7 s chahiye.')),
      ],
      check: [noShort, need('P0', 'sv1.SIG', 'pin 0', T('the orange (signal) wire', 'नारंगी (सिग्नल) तार', 'orange (signal) taar')), (S) => (S.w('conn:3V~sv1.VP') && S.w('conn:GND~sv1.GND') ? null : [X.servoPow])],
      done: (S) => !!S.mem.big },
  ];
  for (const l of L) { l.n = ++n; l.lang = 'py'; l.batch = 13; l.cls = l.id === 'mbcoach' || l.id === 'mbinchworm' ? '5' : '4'; }
  return L;
}
export const MB13_CODES = { DIMMER, HOTCOLD, COACH, WORM };
