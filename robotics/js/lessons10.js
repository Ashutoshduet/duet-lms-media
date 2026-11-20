// DUET Robotics Lab 360, batch 10: first micro:bit projects for Class 2 (age 7+), best built with blocks. Short programs,
// one idea each (a button, a picture, a loop, a tune, a timer, a touch pin), one small change at the end. Written fresh
// for DUET. Same shape as lessons8.js (tick, S.memRun, S.mem).
import { MBCore, MBX } from './microbit.js';

const make = (app, cfg) => new MBCore(app, cfg);
const centre = (dx, dz) => (focus) => ({ c: [MBX + dx, 0, dz], k: focus === 'robot' ? 0.55 : 1 });
const world = (o) => Object.assign({ kind: 'mb', make, centre: centre(o.cx || 0, o.cz || 0), blocks: true }, o);
const img = (S) => S.wv('shownImg');
const px = (S) => [...(S.wv('shown') || [])];
const texts = (S) => (S.wv('texts') || []).map(String);
const has = (S, re) => texts(S).some((t) => re.test(t));
const ran = (S, re) => re.test(S.runSrc || '');
const R = (S) => S.memRun || {}; const M = (S) => S.mem || {};
const sigOf = (S) => px(S).map((v) => (v ? 1 : 0)).join('');
// two dance poses (our own drawings)
const POSE_A = '90900:09990:00909:09090:90009', POSE_B = '00909:09990:90900:09090:90009';
const sig = (s) => s.split(':').join('').split('').map((c) => (c === '0' ? 0 : 1)).join('');

// ------------------------------------------------------------------ the programs
const SMILEY = `# Smiley buttons: A makes a happy face, B a sad one
from microbit import *

while True:
    if button_a.was_pressed():
        display.show(Image.HAPPY)
    if button_b.was_pressed():
        display.show(Image.SAD)
    sleep(20)
`;
const EMOTION = `# Emotion badge: wear it and show how you feel.
# A: happy, B: angry, A and B together: sleepy
from microbit import *

while True:
    if button_a.is_pressed() and button_b.is_pressed():
        display.show(Image.ASLEEP)
    elif button_a.is_pressed():
        display.show(Image.HAPPY)
    elif button_b.is_pressed():
        display.show(Image.ANGRY)
    sleep(50)
`;
const DANCE = `# Dance steps: a little stick figure dances, two moves again and again
from microbit import *

MOVE1 = Image("${POSE_A}")
MOVE2 = Image("${POSE_B}")
while True:
    display.show(MOVE1)
    sleep(400)
    display.show(MOVE2)
    sleep(400)
`;
const MUSICBOX = `# Music box: A plays Ode to Joy, B plays The Entertainer
from microbit import *
import music

display.show(Image.MUSIC_QUAVERS)
while True:
    if button_a.was_pressed():
        music.play(music.ODE)
    if button_b.was_pressed():
        music.play(music.ENTERTAINER)
    sleep(20)
`;
const COUNTDOWN = `# Countdown: press A to count down from 10, then a cheer
from microbit import *
import music

display.show(Image.TRIANGLE)
while True:
    if button_a.was_pressed():
        for i in range(10, 0, -1):
            display.show(i)
            sleep(1000)
        display.show(Image.HAPPY)
        music.play(music.POWER_UP)
    sleep(20)
`;
const BREATHE = `# Calm breathing: the lights glow brighter while you breathe in,
# and fade while you breathe out
from microbit import *

glow = Image(5, 5)
while True:
    for b in range(10):              # breathe in
        glow.fill(b)
        display.show(glow)
        sleep(400)
    for b in range(9, -1, -1):       # breathe out
        glow.fill(b)
        display.show(glow)
        sleep(400)
`;
const PICKER = `# Activity picker: shake it and it picks what the class does next
from microbit import *
import random

ACTIVITIES = ["RUN", "JUMP", "DANCE", "SING"]
while True:
    if accelerometer.was_gesture("shake"):
        display.scroll(random.choice(ACTIVITIES))
    sleep(20)
`;
const LOVE = `# Love meter: hold pin 0 and GND and it "measures" how much you love chocolate.
# (It is a game: the number is random!)
from microbit import *
import random

display.show(Image.HEART)
while True:
    if pin0.is_touched():
        display.show(Image.HEART_SMALL)
        sleep(1000)
        score = random.randint(0, 100)
        display.scroll(str(score) + "%")
        display.show(Image.HEART)
    sleep(20)
`;
const HANDWASH = `# Hand-washing timer: press A and scrub your hands until the tick
from microbit import *
import music

display.show(Image.UMBRELLA)
while True:
    if button_a.was_pressed():
        for second in range(20):
            display.show(Image.ALL_CLOCKS[second % 12])
            sleep(1000)
        display.show(Image.YES)
        music.play(music.BA_DING)
    sleep(20)
`;
const BANANA = `# Banana keyboard: join three bananas to pins 0, 1 and 2.
# Hold GND with one hand and touch a banana with the other to play a note.
from microbit import *
import music

while True:
    if pin0.is_touched():
        music.pitch(262, 200)      # C (Sa)
    if pin1.is_touched():
        music.pitch(330, 200)      # E (Ga)
    if pin2.is_touched():
        music.pitch(392, 200)      # G (Pa)
    sleep(10)
`;
const POTATO = `# Hot potato: press A and pass the micro:bit round the circle.
# Whoever holds it when the time runs out is out!
from microbit import *
import random
import music

POTATO = Image("00000:09990:99999:09990:00000")
while True:
    if button_a.was_pressed():
        display.show(POTATO)
        sleep(random.randint(5000, 15000))   # nobody knows how long
        display.show(Image.SKULL)
        music.play(music.WAWAWAWAA)
    sleep(20)
`;
export const MB10_CODES = { SMILEY, EMOTION, DANCE, MUSICBOX, COUNTDOWN, BREATHE, PICKER, LOVE, HANDWASH, BANANA, POTATO };

export function batch10(K, n0) {
  const { t3 } = K;
  const T = (en, hi, hg) => t3(en, hi, hg);
  const E = T('', '', '');
  const run = (see) => ({ k: 'run', do: T('Press Run.', '"चलाइए" दबाइए।', 'Run dabaiye.'), see: see || T('The program goes into the micro:bit and starts.', 'प्रोग्राम micro:bit में जाकर चलने लगता है।', 'Program micro:bit mein jaakar chalne lagta hai.') });
  const info = (code, d, s) => ({ k: 'info', code, do: d, see: s || E });
  const act = (until, d, s) => ({ k: 'act', until, do: d, see: s || E });
  const watch = (until, d, s) => ({ k: 'watch', until, do: d, see: s || E });
  const edit = (test, set, d) => ({ k: 'edit', test, set, do: d, see: E });
  const desk = (title, controls, hud, more) => world(Object.assign({ scene: 'desk', controls, hud: hud || [], title }, more || {}));
  // a tune finished playing in this run, and (for the edit) the new program played it
  const music0 = (S) => { const m = S.memRun; if (m.m0 === undefined) m.m0 = S.wv('music') || 0; return (S.wv('music') || 0) - m.m0; };
  const L = [
    // 1 ------------------------------------------------------------------------------------------------------------
    { id: 'mbsmiley', view: 'mb', code: SMILEY, drawer: [],
      title: T('Smiley buttons', 'स्माइली बटन', 'Smiley buttons'),
      goal: T('Two buttons, two faces: your first program that listens to you.', 'दो बटन, दो चेहरे: आपका पहला प्रोग्राम जो आपकी बात सुनता है।', 'Do button, do chehre: aapka pehla program jo aapki baat sunta hai.'),
      world: desk(T('Smiley buttons', 'स्माइली बटन', 'Smiley buttons'), ['A', 'B', 'logo'], ['buttons']),
      setup: { parts: [], wires: [] },
      tick: (S) => { if (ran(S, /pin_logo/) && img(S) === 'SURPRISED') S.mem.logo = true; },
      steps: [
        info([5, 6], T('Read it like a sentence: "if button A was pressed, show a happy face."', 'इसे वाक्य की तरह पढ़िए: "अगर बटन A दबाया गया, तो ख़ुश चेहरा दिखाओ।"', 'Ise vaakya ki tarah padhiye: "agar button A dabaya gaya, to khush chehra dikhao."')),
        run(),
        act((S) => img(S) === 'HAPPY', T('Press A.', 'A दबाइए।', 'A dabaiye.'), T('A smile!', 'मुस्कान!', 'Muskaan!')),
        act((S) => img(S) === 'SAD', T('Press B.', 'B दबाइए।', 'B dabaiye.'), T('A sad face.', 'उदास चेहरा।', 'Udaas chehra.')),
        edit((src) => /pin_logo\.is_touched\(\)/.test(src) && /Image\.SURPRISED/.test(src), [[/(    sleep\(20\))/, '    if pin_logo.is_touched():\n        display.show(Image.SURPRISED)\n$1']],
          T('A third face: above sleep(20) add\n    if pin_logo.is_touched():\n        display.show(Image.SURPRISED)\n(in blocks: an "if logo touched" with "show icon SURPRISED"), then Run.', 'तीसरा चेहरा: sleep(20) के ऊपर लिखिए\n    if pin_logo.is_touched():\n        display.show(Image.SURPRISED)\n(ब्लॉक में: "अगर लोगो छुआ गया" के अंदर "आइकन दिखाइए SURPRISED"), फिर "चलाइए"।', 'Teesra chehra: sleep(20) ke upar likhiye\n    if pin_logo.is_touched():\n        display.show(Image.SURPRISED)\n(blocks mein: "agar logo touch hua" ke andar "icon dikhaiye SURPRISED"), phir Run.')),
        act((S) => !!M(S).logo, T('Touch the gold logo.', 'सुनहरा लोगो छूइए।', 'Sunehra logo chhuiye.'), T('Surprised! Each "if" checks one thing: add as many as you like.', 'हैरान! हर "if" एक चीज़ जाँचता है: जितने चाहें उतने जोड़िए।', 'Hairaan! Har "if" ek cheez check karta hai: jitne chahein utne jodiye.')),
      ],
      done: (S) => !!M(S).logo },
    // 2 ------------------------------------------------------------------------------------------------------------
    { id: 'mbemotion', view: 'mb', code: EMOTION, drawer: [],
      title: T('Emotion badge', 'भावना बैज', 'Emotion badge'),
      goal: T('A badge you wear that shows how you feel: happy, angry, or sleepy with both buttons.', 'पहनने वाला बैज जो बताए आप कैसा महसूस कर रहे हैं: ख़ुश, ग़ुस्सा, या दोनों बटन से नींद।', 'Pehanne wala badge jo bataye aap kaisa mehsoos kar rahe ho: khush, gussa, ya dono button se neend.'),
      world: world({ scene: 'badge', controls: ['A', 'B', 'AB'], hud: ['buttons'], title: T('Emotion badge', 'भावना बैज', 'Emotion badge') }),
      setup: { parts: [], wires: [] },
      tick: (S) => { if (ran(S, /Image\.SILLY/) && img(S) === 'SILLY') S.mem.silly = true; },
      steps: [
        info([6], T('and means both: A is pressed AND B is pressed. It is checked first, because when both are pressed, "A is pressed" is true too.', 'and यानी दोनों: A दबा है और B दबा है। इसे पहले जाँचते हैं, क्योंकि दोनों दबे हों तो "A दबा है" भी सच होता है।', 'and matlab dono: A daba hai aur B daba hai. Ise pehle check karte hain, kyunki dono dabe hon to "A daba hai" bhi sach hota hai.')),
        run(),
        act((S) => img(S) === 'HAPPY', T('Press A.', 'A दबाइए।', 'A dabaiye.')),
        act((S) => img(S) === 'ANGRY', T('Press B.', 'B दबाइए।', 'B dabaiye.')),
        act((S) => img(S) === 'ASLEEP', T('Press A and B together.', 'A और B एक साथ दबाइए।', 'A aur B ek saath dabaiye.'), T('Sleepy. Wear it on the lanyard so your friends know how you feel.', 'नींद। इसे डोरी पर पहनिए ताकि दोस्तों को पता चले आप कैसा महसूस कर रहे हैं।', 'Neend. Ise dori par pehniye taaki doston ko pata chale aap kaisa mehsoos kar rahe ho.')),
        edit((src) => /Image\.SILLY/.test(src), [[/Image\.HAPPY/, 'Image.SILLY']],
          T('Change Image.HAPPY to Image.SILLY, then Run.', 'Image.HAPPY को Image.SILLY कीजिए, फिर "चलाइए"।', 'Image.HAPPY ko Image.SILLY karo, phir Run.')),
        act((S) => !!M(S).silly, T('Press A.', 'A दबाइए।', 'A dabaiye.'), T('A silly face. The micro:bit has more than 60 pictures to choose from.', 'मज़ेदार चेहरा। micro:bit में चुनने के लिए 60 से ज़्यादा तस्वीरें हैं।', 'Mazedaar chehra. micro:bit mein chunne ke liye 60 se zyada tasveerein hain.')),
      ],
      done: (S) => !!M(S).silly },
    // 3 ------------------------------------------------------------------------------------------------------------
    { id: 'mbdance', view: 'mb', code: DANCE, drawer: [],
      title: T('Dance steps', 'नाच के क़दम', 'Dance steps'),
      goal: T('Two pictures, one after the other, again and again: an animation, like a flip book.', 'दो तस्वीरें, एक के बाद एक, बार-बार: एनिमेशन, फ़्लिप बुक की तरह।', 'Do tasveerein, ek ke baad ek, baar-baar: animation, flip book ki tarah.'),
      world: desk(T('Dance steps', 'नाच के क़दम', 'Naach ke kadam'), []),
      setup: { parts: [], wires: [] },
      tick: (S) => { const m = S.memRun; const s = sigOf(S); const k = s === sig(POSE_A) ? 'A' : s === sig(POSE_B) ? 'B' : null; if (!k || k === m.k) return;
        if (m.k) { m.flips = (m.flips || 0) + 1; if (m.at !== undefined) { m.gap = S.t - m.at; if (ran(S, /sleep\(200\)/) && m.gap < 0.3 && m.flips >= 4) S.mem.fast = true; } } m.k = k; m.at = S.t; },
      steps: [
        info([4, 5], T('MOVE1 and MOVE2 are pictures we drew with numbers: 9 is a bright LED, 0 an off one, and : starts the next row.', 'MOVE1 और MOVE2 संख्याओं से बनाई तस्वीरें हैं: 9 जलती एलईडी, 0 बुझी, और : से अगली पंक्ति शुरू।', 'MOVE1 aur MOVE2 numbers se banayi tasveerein hain: 9 jalti LED, 0 bujhi, aur : se agli row shuru.')),
        run(),
        watch((S) => (R(S).flips || 0) >= 4, T('Watch it dance.', 'इसे नाचते देखिए।', 'Ise naachte dekhiye.'), T('Each picture stays 400 ms, then the other: your eyes see a dance.', 'हर तस्वीर 400 ms रहती है, फिर दूसरी: आँखों को नाच दिखता है।', 'Har tasveer 400 ms rehti hai, phir doosri: aankhon ko naach dikhta hai.')),
        edit((src) => (src.match(/sleep\(200\)/g) || []).length === 2, [[/sleep\(400\)/g, 'sleep(200)']],
          T('Faster dancing: change both sleep(400) to sleep(200), then Run.', 'तेज़ नाच: दोनों sleep(400) को sleep(200) कीजिए, फिर "चलाइए"।', 'Tez naach: dono sleep(400) ko sleep(200) karo, phir Run.')),
        watch((S) => !!M(S).fast, T('Watch again.', 'फिर देखिए।', 'Phir dekhiye.'), T('Twice as fast. Cartoons show about 24 pictures every second.', 'दोगुना तेज़। कार्टून हर सेकंड लगभग 24 तस्वीरें दिखाते हैं।', 'Do-guna tez. Cartoon har second lagbhag 24 tasveerein dikhate hain.')),
      ],
      done: (S) => !!M(S).fast },
    // 4 ------------------------------------------------------------------------------------------------------------
    { id: 'mbmusicbox', view: 'mb', code: MUSICBOX, drawer: [],
      title: T('Music box: play a melody', 'म्यूज़िक बॉक्स: धुन बजाइए', 'Music box: dhun bajaiye'),
      goal: T('Play two famous old tunes on the micro:bit\'s speaker, then make them faster.', 'micro:bit के स्पीकर पर दो मशहूर पुरानी धुनें बजाइए, फिर उन्हें तेज़ कीजिए।', 'micro:bit ke speaker par do mashhoor purani dhunein bajaiye, phir unhe tez kijiye.'),
      world: desk(T('Music box', 'म्यूज़िक बॉक्स', 'Music box'), ['A', 'B']),
      setup: { parts: [], wires: [] },
      tick: (S) => { const n = music0(S); if (n >= 1 && ran(S, /set_tempo\(bpm=\d+\)/)) S.mem.fast = true; },
      steps: [
        info([8, 10], T('music.ODE is Ode to Joy (Beethoven, 1824) and music.ENTERTAINER is The Entertainer (Scott Joplin, 1902): tunes so old that everyone may play them.', 'music.ODE है ओड टू जॉय (बीथोवन, 1824) और music.ENTERTAINER है द एंटरटेनर (स्कॉट जॉप्लिन, 1902): इतनी पुरानी धुनें कि सब बजा सकते हैं।', 'music.ODE hai Ode to Joy (Beethoven, 1824) aur music.ENTERTAINER hai The Entertainer (Scott Joplin, 1902): itni purani dhunein ki sab baja sakte hain.')),
        run(),
        act((S) => music0(S) >= 1, T('Press A (turn the sound on).', 'A दबाइए (आवाज़ चालू कीजिए)।', 'A dabaiye (sound on kijiye).'), T('Ode to Joy.', 'ओड टू जॉय।', 'Ode to Joy.')),
        act((S) => music0(S) >= 2, T('Press B.', 'B दबाइए।', 'B dabaiye.'), T('The Entertainer: ragtime piano music.', 'द एंटरटेनर: रैगटाइम पियानो संगीत।', 'The Entertainer: ragtime piano sangeet.')),
        edit((src) => /music\.set_tempo\(bpm=\d+\)/.test(src), [[/(display\.show\(Image\.MUSIC_QUAVERS\)\n)/, '$1music.set_tempo(bpm=180)\n']],
          T('Faster: under display.show(Image.MUSIC_QUAVERS) add\nmusic.set_tempo(bpm=180)\nthen Run. (bpm: beats per minute; it was 120.)', 'तेज़: display.show(Image.MUSIC_QUAVERS) के नीचे लिखिए\nmusic.set_tempo(bpm=180)\nफिर "चलाइए"। (bpm: प्रति मिनट ताल; पहले 120 था।)', 'Tez: display.show(Image.MUSIC_QUAVERS) ke neeche likhiye\nmusic.set_tempo(bpm=180)\nphir Run. (bpm: beats per minute; pehle 120 tha.)')),
        act((S) => !!M(S).fast, T('Press A.', 'A दबाइए।', 'A dabaiye.'), T('The same tune, faster. Musicians call the speed the tempo.', 'वही धुन, तेज़। संगीतकार इस रफ़्तार को टेम्पो कहते हैं।', 'Wahi dhun, tez. Musicians is speed ko tempo kehte hain.')),
      ],
      done: (S) => !!M(S).fast },
    // 5 ------------------------------------------------------------------------------------------------------------
    { id: 'mbcountdown', view: 'mb', code: COUNTDOWN, drawer: [],
      title: T('Countdown timer', 'उल्टी गिनती टाइमर', 'Countdown timer'),
      goal: T('Count down 10, 9, 8… 1 like a rocket launch, then cheer.', 'रॉकेट लॉन्च की तरह 10, 9, 8… 1 उल्टी गिनती, फिर जश्न।', 'Rocket launch ki tarah 10, 9, 8… 1 ulti ginti, phir jashn.'),
      world: desk(T('Countdown', 'उल्टी गिनती', 'Ulti ginti'), ['A']),
      setup: { parts: [], wires: [] },
      tick: (S) => { const n = (S.wv('nums') || []).slice(-6).join(','); if (ran(S, /range\(5, 0, -1\)/) && img(S) === 'HAPPY' && /5,4,3,2,1$/.test(n)) S.mem.five = true; },
      steps: [
        info([8], T('range(10, 0, -1) counts 10, 9, 8 … 1: start at 10, stop before 0, and go down by 1 each time.', 'range(10, 0, -1) गिनता है 10, 9, 8 … 1: 10 से शुरू, 0 से पहले रुको, और हर बार 1 घटाओ।', 'range(10, 0, -1) ginta hai 10, 9, 8 … 1: 10 se shuru, 0 se pehle ruko, aur har baar 1 ghatao.')),
        run(),
        act((S) => img(S) === 'HAPPY', T('Press A and count with it: ten, nine, eight…', 'A दबाइए और साथ में गिनिए: दस, नौ, आठ…', 'A dabaiye aur saath mein giniye: das, nau, aath…'), T('Lift off! Rockets at Sriharikota launch after a countdown like this.', 'उड़ान! श्रीहरिकोटा से रॉकेट ऐसी ही उल्टी गिनती के बाद उड़ते हैं।', 'Udaan! Sriharikota se rocket aisi hi ulti ginti ke baad udte hain.')),
        edit((src) => /range\(5, 0, -1\)/.test(src), [[/range\(10, 0, -1\)/, 'range(5, 0, -1)']],
          T('A shorter countdown: change range(10, 0, -1) to range(5, 0, -1), then Run.', 'छोटी उल्टी गिनती: range(10, 0, -1) को range(5, 0, -1) कीजिए, फिर "चलाइए"।', 'Chhoti ulti ginti: range(10, 0, -1) ko range(5, 0, -1) karo, phir Run.')),
        act((S) => !!M(S).five, T('Press A.', 'A दबाइए।', 'A dabaiye.'), T('5, 4, 3, 2, 1: one number changed the whole countdown.', '5, 4, 3, 2, 1: एक संख्या ने पूरी गिनती बदल दी।', '5, 4, 3, 2, 1: ek number ne poori ginti badal di.')),
      ],
      done: (S) => !!M(S).five },
    // 6 ------------------------------------------------------------------------------------------------------------
    { id: 'mbbreathe', view: 'mb', code: BREATHE, drawer: [],
      title: T('Calming breathing LEDs', 'शांत साँस वाली एलईडी', 'Shaant saans wali LEDs'),
      goal: T('Lights that glow brighter and dimmer slowly, to breathe along with when you want to calm down.', 'ऐसी बत्तियाँ जो धीरे-धीरे तेज़ और धीमी हों, ताकि शांत होने के लिए साथ में साँस ले सकें।', 'Aisi battiyan jo dheere-dheere tez aur dheemi hon, taaki shaant hone ke liye saath mein saans le sakein.'),
      world: desk(T('Calm breathing', 'शांत साँस', 'Shaant saans'), []),
      setup: { parts: [], wires: [] },
      tick: (S) => { const m = S.memRun; const b = Math.max(0, ...px(S)); (m.seen || (m.seen = new Set())).add(b);
        if (b === 0 && m.peak) { m.cycles = (m.cycles || 0) + 1; m.peak = false; } if (b === 0) m.t0 = S.t; if (b === 9 && !m.peak) { m.peak = true; m.rise = S.t - (m.t0 || 0); if (ran(S, /sleep\(600\)/) && m.rise > 4.2) S.mem.slow = true; } },
      steps: [
        info([7, 8, 9], T('glow.fill(b) sets every LED of the picture to brightness b, from 0 (off) to 9 (brightest). The loop goes 0, 1, 2 … 9: brighter and brighter.', 'glow.fill(b) तस्वीर की हर एलईडी की चमक b करता है, 0 (बंद) से 9 (सबसे तेज़)। लूप 0, 1, 2 … 9 चलता है: और तेज़, और तेज़।', 'glow.fill(b) tasveer ki har LED ki chamak b karta hai, 0 (band) se 9 (sabse tez). Loop 0, 1, 2 … 9 chalta hai: aur tez, aur tez.')),
        run(),
        watch((S) => (R(S).cycles || 0) >= 1 && (R(S).seen || new Set()).size >= 9, T('Breathe in while it glows brighter, out while it fades.', 'चमक बढ़ते समय साँस अंदर लीजिए, घटते समय बाहर छोड़िए।', 'Chamak badhte samay saans andar lijiye, ghatte samay bahar chhodiye.'), T('Four seconds in, four seconds out. Slow breathing really does calm your heart.', 'चार सेकंड अंदर, चार सेकंड बाहर। धीमी साँस सच में दिल को शांत करती है।', 'Chaar second andar, chaar second bahar. Dheemi saans sach mein dil ko shaant karti hai.')),
        edit((src) => (src.match(/sleep\(600\)/g) || []).length === 2, [[/sleep\(400\)/g, 'sleep(600)']],
          T('Slower, calmer breaths: change both sleep(400) to sleep(600), then Run.', 'धीमी, और शांत साँस: दोनों sleep(400) को sleep(600) कीजिए, फिर "चलाइए"।', 'Dheemi, aur shaant saans: dono sleep(400) ko sleep(600) karo, phir Run.')),
        watch((S) => !!M(S).slow, T('Breathe along again.', 'फिर साथ में साँस लीजिए।', 'Phir saath mein saans lijiye.'), T('Six seconds each way now. Yoga teachers count breaths like this.', 'अब हर तरफ़ छह सेकंड। योग शिक्षक ऐसे ही साँसें गिनते हैं।', 'Ab har taraf chhe second. Yoga teacher aise hi saansein ginte hain.')),
      ],
      done: (S) => !!M(S).slow },
    // 7 ------------------------------------------------------------------------------------------------------------
    { id: 'mbpicker', view: 'mb', code: PICKER, drawer: [],
      title: T('Activity picker', 'गतिविधि चुनने वाला', 'Activity picker'),
      goal: T('Shake it and it picks the class\'s next activity at random; then add your own.', 'हिलाइए और यह कक्षा की अगली गतिविधि बेतरतीब ढंग से चुनता है; फिर अपनी जोड़िए।', 'Hilaiye aur yeh class ki agli activity random tareeke se chunta hai; phir apni jodiye.'),
      world: desk(T('Activity picker', 'गतिविधि चुनने वाला', 'Activity picker'), ['shake', 'phone'], ['shakes']),
      setup: { parts: [], wires: [] },
      tick: (S) => { if (ran(S, /"CLAP"/) && has(S, /^CLAP$/)) S.mem.clap = true; },
      steps: [
        info([5, 8], T('ACTIVITIES is a list of words. random.choice() closes its eyes and picks one.', 'ACTIVITIES शब्दों की सूची है। random.choice() आँख बंद करके एक चुनता है।', 'ACTIVITIES shabdon ki list hai. random.choice() aankh band karke ek chunta hai.')),
        run(),
        act((S) => has(S, /^(RUN|JUMP|DANCE|SING)$/), T('Shake it.', 'इसे हिलाइए।', 'Ise hilaiye.'), T('Now everybody does it!', 'अब सब यही करें!', 'Ab sab yahi karein!')),
        edit((src) => /"CLAP"\]/.test(src), [[/"SING"\]/, '"SING", "CLAP"]']],
          T('Add your own: after "SING" add , "CLAP" inside the brackets, then Run.', 'अपनी जोड़िए: "SING" के बाद कोष्ठक के अंदर , "CLAP" लिखिए, फिर "चलाइए"।', 'Apni jodiye: "SING" ke baad bracket ke andar , "CLAP" likhiye, phir Run.')),
        act((S) => !!M(S).clap, T('Shake until it says CLAP.', 'CLAP आने तक हिलाते रहिए।', 'CLAP aane tak hilaate rahiye.'), T('Clap! Five choices now, each just as likely.', 'ताली! अब पाँच विकल्प, सबकी बराबर संभावना।', 'Taali! Ab paanch vikalp, sabka barabar chance.')),
      ],
      done: (S) => !!M(S).clap },
    // 8 ------------------------------------------------------------------------------------------------------------
    { id: 'mblove', view: 'mb', code: LOVE, drawer: [],
      title: T('Love meter (touch pins)', 'प्यार मीटर (टच पिन)', 'Love meter (touch pins)'),
      goal: T('A party game: hold pin 0 and GND and get a score. Learn how touch pins work, and why the score is only a game.', 'पार्टी गेम: पिन 0 और GND पकड़िए और स्कोर पाइए। सीखिए टच पिन कैसे काम करते हैं, और स्कोर सिर्फ़ खेल क्यों है।', 'Party game: pin 0 aur GND pakdiye aur score paaiye. Seekhiye touch pin kaise kaam karte hain, aur score sirf game kyun hai.'),
      world: desk(T('Love meter', 'प्यार मीटर', 'Love meter'), ['P0']),
      setup: { parts: [], wires: [] },
      tick: (S) => { if (ran(S, /"WOW"/) && has(S, /^WOW$/)) S.mem.wow = true; },
      steps: [
        info([8], T('Your body lets a tiny current through. Holding pin 0 and GND at the same time joins them, so pin0.is_touched() is True.', 'आपका शरीर बहुत छोटा करंट जाने देता है। पिन 0 और GND एक साथ पकड़ने से वे जुड़ जाते हैं, तो pin0.is_touched() True होता है।', 'Aapka shareer bahut chhota current jaane deta hai. Pin 0 aur GND ek saath pakadne se woh jud jaate hain, to pin0.is_touched() True hota hai.')),
        info([11], T('The score is random.randint(0, 100): a made-up number. A real meter measures something real, like temperature.', 'स्कोर random.randint(0, 100) है: बनाई हुई संख्या। असली मीटर कुछ असली नापता है, जैसे तापमान।', 'Score random.randint(0, 100) hai: banaya hua number. Asli meter kuch asli naapta hai, jaise temperature.')),
        run(),
        act((S) => has(S, /^\d+%$/), T('Hold pin 0 and GND: press "Touch pin 0".', 'पिन 0 और GND पकड़िए: "पिन 0 छूइए" दबाइए।', 'Pin 0 aur GND pakdiye: "Pin 0 touch karo" dabaiye.'), T('Your chocolate-love score!', 'आपका चॉकलेट-प्यार स्कोर!', 'Aapka chocolate-pyaar score!')),
        edit((src) => /if score > \d+:\s*\n\s+display\.scroll\("WOW"\)/.test(src), [[/(        display\.scroll\(str\(score\) \+ "%"\)\n)/, '$1        if score > 80:\n            display.scroll("WOW")\n']],
          T('Cheer big scores: under the display.scroll(str(score) + "%") line add\n        if score > 80:\n            display.scroll("WOW")\nthen Run.', 'बड़े स्कोर पर वाह: display.scroll(str(score) + "%") वाली लाइन के नीचे लिखिए\n        if score > 80:\n            display.scroll("WOW")\nफिर "चलाइए"।', 'Bade score par waah: display.scroll(str(score) + "%") wali line ke neeche likhiye\n        if score > 80:\n            display.scroll("WOW")\nphir Run.')),
        act((S) => !!M(S).wow, T('Play until you get a WOW.', 'WOW आने तक खेलिए।', 'WOW aane tak kheliye.'), T('About one try in five scores more than 80. Try it with a banana in between: fruit lets current through too!', 'लगभग पाँच में से एक बार 80 से ज़्यादा आता है। बीच में केला रखकर देखिए: फल से भी करंट जाता है!', 'Lagbhag paanch mein se ek baar 80 se zyada aata hai. Beech mein kela rakh kar dekhiye: fal se bhi current jaata hai!')),
      ],
      done: (S) => !!M(S).wow },
    // 9 ------------------------------------------------------------------------------------------------------------
    { id: 'mbhandwash', view: 'mb', code: HANDWASH, drawer: [],
      title: T('Hand-washing timer', 'हाथ धोने का टाइमर', 'Haath dhone ka timer'),
      goal: T('A timer by the wash basin: scrub your hands until the tick, the time doctors advise.', 'वॉश बेसिन के पास टाइमर: टिक आने तक हाथ रगड़िए, जितना डॉक्टर बताते हैं।', 'Wash basin ke paas timer: tick aane tak haath ragadiye, jitna doctor batate hain.'),
      world: desk(T('Hand-washing timer', 'हाथ धोने का टाइमर', 'Haath dhone ka timer'), ['A']),
      setup: { parts: [], wires: [] },
      tick: (S) => { const m = S.memRun; const i = img(S) || ''; if (/^CLOCK/.test(i) && m.t0 === undefined) m.t0 = S.t; if (i === 'YES' && m.t0 !== undefined && m.dur === undefined) { m.dur = S.t - m.t0; if (ran(S, /range\(30\)/) && m.dur > 28) S.mem.thirty = true; } },
      steps: [
        info([8, 9, 10], T('The loop runs 20 times, once a second, and the clock hand moves each time: 20 seconds, the time doctors say to scrub (sing "Happy Birthday" twice).', 'लूप 20 बार चलता है, हर सेकंड एक बार, और घड़ी की सुई हर बार चलती है: 20 सेकंड, जितना डॉक्टर रगड़ने को कहते हैं।', 'Loop 20 baar chalta hai, har second ek baar, aur ghadi ki sui har baar chalti hai: 20 second, jitna doctor ragadne ko kehte hain.')),
        run(),
        act((S) => (R(S).dur || 0) > 18, T('Press A and scrub, scrub, scrub until the tick.', 'A दबाइए और टिक आने तक रगड़िए, रगड़िए, रगड़िए।', 'A dabaiye aur tick aane tak ragadiye, ragadiye, ragadiye.'), T('Clean! Soap needs time to break up the germs.', 'साफ़! साबुन को कीटाणु तोड़ने में समय लगता है।', 'Saaf! Saabun ko keetanu todne mein time lagta hai.')),
        edit((src) => /range\(30\)/.test(src), [[/range\(20\)/, 'range(30)']],
          T('For really dirty hands after the garden: change range(20) to range(30), then Run.', 'बगीचे के बाद बहुत गंदे हाथों के लिए: range(20) को range(30) कीजिए, फिर "चलाइए"।', 'Bageeche ke baad bahut gande haathon ke liye: range(20) ko range(30) karo, phir Run.')),
        act((S) => !!M(S).thirty, T('Press A and scrub.', 'A दबाइए और रगड़िए।', 'A dabaiye aur ragadiye.'), T('30 seconds. Put a micro:bit timer by your school\'s wash basins!', '30 सेकंड। अपने स्कूल के वॉश बेसिन के पास micro:bit टाइमर लगाइए!', '30 second. Apne school ke wash basin ke paas micro:bit timer lagaiye!')),
      ],
      done: (S) => !!M(S).thirty },
    // 10 -----------------------------------------------------------------------------------------------------------
    { id: 'mbbanana', view: 'mb', code: BANANA, drawer: [],
      title: T('Banana keyboard (touch pins)', 'केले वाला कीबोर्ड (टच पिन)', 'Kele wala keyboard (touch pins)'),
      goal: T('Three bananas on pins 0, 1 and 2 play three notes: Sa, Ga, Pa. Then add a fourth note on the logo.', 'पिन 0, 1 और 2 पर तीन केले तीन सुर बजाते हैं: सा, ग, प। फिर लोगो पर चौथा सुर जोड़िए।', 'Pin 0, 1 aur 2 par teen kele teen sur bajaate hain: Sa, Ga, Pa. Phir logo par chautha sur jodiye.'),
      world: desk(T('Banana keyboard', 'केले वाला कीबोर्ड', 'Kele wala keyboard'), ['P0', 'P1', 'P2', 'logo']),
      setup: { parts: [], wires: [] },
      tick: (S) => { const f = Math.round(S.wv('tone') || 0); if (f) (S.memRun.notes || (S.memRun.notes = new Set())).add(f); if (f === 523 && ran(S, /pin_logo/)) S.mem.top = true; },
      steps: [
        info([1, 2, 7], T('A banana is mostly water with a little salt in it, so a tiny current goes through it. Touching a banana and GND joins its pin to GND.', 'केले में ज़्यादातर पानी और थोड़ा नमक होता है, इसलिए उसमें से छोटा करंट जाता है। केला और GND छूने से उसका पिन GND से जुड़ जाता है।', 'Kele mein zyaadatar paani aur thoda namak hota hai, isliye usmein se chhota current jaata hai. Kela aur GND chhoone se uska pin GND se jud jaata hai.')),
        info([8, 10, 12], T('music.pitch(262, 200) plays 262 vibrations a second for 200 ms: the note C, Sa.', 'music.pitch(262, 200) 200 ms तक हर सेकंड 262 कंपन बजाता है: सुर C, सा।', 'music.pitch(262, 200) 200 ms tak har second 262 vibrations bajata hai: sur C, Sa.')),
        run(),
        act((S) => (R(S).notes || new Set()).has(262), T('Touch the banana on pin 0 ("Touch pin 0").', 'पिन 0 वाला केला छूइए ("पिन 0 छूइए")।', 'Pin 0 wala kela chhuiye ("Pin 0 touch karo").'), T('Sa.', 'सा।', 'Sa.')),
        act((S) => (R(S).notes || new Set()).has(330), T('Now pin 1.', 'अब पिन 1।', 'Ab pin 1.'), T('Ga.', 'ग।', 'Ga.')),
        act((S) => (R(S).notes || new Set()).has(392), T('And pin 2.', 'और पिन 2।', 'Aur pin 2.'), T('Pa. Play Sa Ga Pa Ga Sa!', 'प। सा ग प ग सा बजाइए!', 'Pa. Sa Ga Pa Ga Sa bajaiye!')),
        edit((src) => /pin_logo\.is_touched\(\)/.test(src) && /music\.pitch\(523/.test(src), [[/(    sleep\(10\))/, '    if pin_logo.is_touched():\n        music.pitch(523, 200)      # high C (upper Sa)\n$1']],
          T('A fourth key: above sleep(10) add\n    if pin_logo.is_touched():\n        music.pitch(523, 200)\nthen Run.', 'चौथी कुंजी: sleep(10) के ऊपर लिखिए\n    if pin_logo.is_touched():\n        music.pitch(523, 200)\nफिर "चलाइए"।', 'Chauthi key: sleep(10) ke upar likhiye\n    if pin_logo.is_touched():\n        music.pitch(523, 200)\nphir Run.')),
        act((S) => !!M(S).top, T('Touch the logo.', 'लोगो छूइए।', 'Logo chhuiye.'), T('Upper Sa: 523 is twice 262, one octave higher.', 'तार सा: 523, 262 का दोगुना है, एक सप्तक ऊँचा।', 'Taar Sa: 523, 262 ka do-guna hai, ek octave ooncha.')),
      ],
      done: (S) => !!M(S).top },
    // 11 -----------------------------------------------------------------------------------------------------------
    { id: 'mbpotato', view: 'mb', code: POTATO, drawer: [],
      title: T('Hot potato', 'गरम आलू', 'Garam aloo'),
      goal: T('The party game: pass the micro:bit round; a secret random timer decides who is out.', 'पार्टी गेम: micro:bit को घुमाइए; एक गुप्त बेतरतीब टाइमर तय करता है कौन आउट है।', 'Party game: micro:bit ko ghumaiye; ek gupt random timer tay karta hai kaun out hai.'),
      world: desk(T('Hot potato', 'गरम आलू', 'Garam aloo'), ['A']),
      setup: { parts: [], wires: [] },
      tick: (S) => { const m = S.memRun; const i = img(S); const potato = sigOf(S) === sig('00000:09990:99999:09990:00000');
        if (potato && m.t0 === undefined) m.t0 = S.t; if (i === 'SKULL' && m.t0 !== undefined && m.dur === undefined) { m.dur = S.t - m.t0; if (ran(S, /randint\(3000, 8000\)/) && m.dur < 9) S.mem.short = true; } },
      steps: [
        info([11], T('random.randint(5000, 15000) picks a time from 5 to 15 seconds. Nobody knows it, not even the person who pressed A.', 'random.randint(5000, 15000) 5 से 15 सेकंड के बीच का समय चुनता है। किसी को नहीं पता, A दबाने वाले को भी नहीं।', 'random.randint(5000, 15000) 5 se 15 second ke beech ka time chunta hai. Kisi ko nahi pata, A dabane wale ko bhi nahi.')),
        run(),
        act((S) => R(S).dur !== undefined, T('Press A and pass it round the circle. Quick, it\'s hot!', 'A दबाइए और घेरे में आगे बढ़ाइए। जल्दी, यह गरम है!', 'A dabaiye aur ghere mein aage badhaiye. Jaldi, yeh garam hai!'), T('Out! Whoever was holding it sits in the middle.', 'आउट! जिसके हाथ में था वह बीच में बैठेगा।', 'Out! Jiske haath mein tha woh beech mein baithega.')),
        edit((src) => /randint\(3000, 8000\)/.test(src), [[/randint\(5000, 15000\)/, 'randint(3000, 8000)']],
          T('A faster game for a small circle: change randint(5000, 15000) to randint(3000, 8000), then Run.', 'छोटे घेरे के लिए तेज़ खेल: randint(5000, 15000) को randint(3000, 8000) कीजिए, फिर "चलाइए"।', 'Chhote ghere ke liye tez game: randint(5000, 15000) ko randint(3000, 8000) karo, phir Run.')),
        act((S) => !!M(S).short, T('Press A and pass it.', 'A दबाइए और आगे बढ़ाइए।', 'A dabaiye aur aage badhaiye.'), T('3 to 8 seconds now: hotter!', 'अब 3 से 8 सेकंड: और गरम!', 'Ab 3 se 8 second: aur garam!')),
      ],
      done: (S) => !!M(S).short },
  ];
  L.forEach((l, i) => { l.n = n0 + i + 1; l.lang = 'py'; l.batch = 10; l.cls = '2'; });
  return L;
}
