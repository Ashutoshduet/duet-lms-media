// DUET Robotics Lab 360, batch 14: the project bank on the BBC micro:bit (Classes 3–6). The same jobs as factory.js (a real
// job, a sensor and an output), built from what the micro:bit has on board: button A, the light level its LED screen reads,
// the temperature inside its chip, a knob on pin 1 (crocodile clips), and as outputs its speaker, its LED screen, an LED on
// pin 0 or a servo on pin 0 (crocodile clips). Each lesson: clip the parts, Run, make the sensor do its job (on, then
// off), one edit (a limit, or how long it stays on), and a last act that proves the edit. MicroPython that also opens as
// blocks. devtools/test/robofactorymb.mjs plays every one end to end.
import { MBCore, MBX } from './microbit.js';
import { JOBS } from './factory.js';

const t3 = (en, hi, hg) => ({ en, hi, hg });
const E = t3('', '', '');
const make = (app, cfg) => new MBCore(app, cfg);
const centre = (dx, dz) => (focus) => ({ c: [MBX + dx, 0, dz], k: focus === 'robot' ? 0.55 : 1 });
const world = (o) => Object.assign({ kind: 'mb', make, centre: centre(o.cx || 0, o.cz || 0) }, o);
const join3 = (...xs) => t3(xs.map((x) => (typeof x === 'string' ? x : x.en)).join(''), xs.map((x) => (typeof x === 'string' ? x : x.hi)).join(''), xs.map((x) => (typeof x === 'string' ? x : x.hg)).join(''));
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const fresh = (S) => S.runSrc !== null && S.t - (S.freshAt || 0) > 0.3;
const lastNum = (S) => (S.nums.length ? S.nums[S.nums.length - 1] : null);
const W0 = (S) => S.app.world;

// ------------------------------------------------------------------ the sensors (on the board, or a knob on pin 1)
const MIN = {
  button: {
    name: t3('button A', 'बटन A', 'button A'), lvl: 0, digital: true, controls: ['A'], hud: ['buttons'],
    trig: 'button_a.is_pressed()',
    when: t3('someone presses button A', 'कोई बटन A दबाता है', 'koi button A dabata hai'),
    onDo: t3('Press A (in the panel, or tap button A on the board).', 'A दबाइए (पैनल में, या बोर्ड पर बटन A को छूइए)।', 'A dabaiye (panel mein, ya board par button A ko touch karo).'),
    offDo: t3('Let go and wait a moment.', 'छोड़िए और एक पल रुकिए।', 'Chhodiye aur ek pal rukiye.'),
    againDo: t3('Press A once, then count the seconds.', 'A एक बार दबाइए, फिर सेकंड गिनिए।', 'A ek baar dabaiye, phir second giniye.'),
    active: (S) => { const B = W0(S).boards[0]; return !!(B.btn && B.btn.a && B.btn.a.down); },
  },
  ldr: {
    name: t3('light sensor (the LED screen)', 'रोशनी सेंसर (एलईडी स्क्रीन)', 'roshni sensor (LED screen)'), lvl: 0, analog: true, controls: ['light'], hud: ['light'],
    read: 'light = display.read_light_level()   # 0 (dark) to 255 (bright)', v: 'light', cond: 'light < limit', l0: 50, l1: 90, note: 'darker than this: on',
    when: t3('it gets dark', 'अँधेरा होता है', 'andhera hota hai'),
    onDo: t3('Slide the Room light down: make it dark.', '"कमरे की रोशनी" स्लाइडर नीचे कीजिए: अँधेरा कीजिए।', '"Room light" slider neeche kijiye: andhera kijiye.'),
    offDo: t3('Make the room bright again.', 'कमरे में फिर से उजाला कीजिए।', 'Room mein phir se ujaala kijiye.'),
    edgeDo: t3('Now make it dim, not dark (about 45 %).', 'अब हल्की रोशनी कीजिए, अँधेरा नहीं (लगभग 45 %)।', 'Ab halki roshni kijiye, andhera nahi (lagbhag 45 %).'),
    set: { on: 8, off: 85, edge: 45 }, ctl: 'light',
  },
  ldrb: {
    name: t3('light sensor (the LED screen)', 'रोशनी सेंसर (एलईडी स्क्रीन)', 'roshni sensor (LED screen)'), lvl: 0, analog: true, controls: ['light'], hud: ['light'],
    read: 'light = display.read_light_level()   # 0 (dark) to 255 (bright)', v: 'light', cond: 'light > limit', l0: 220, l1: 150, note: 'brighter than this: on',
    when: t3('bright light falls on it', 'उस पर तेज़ रोशनी पड़ती है', 'us par tez roshni padti hai'),
    onDo: t3('Slide the Room light all the way up.', '"कमरे की रोशनी" स्लाइडर पूरा ऊपर कीजिए।', '"Room light" slider poora upar kijiye.'),
    offDo: t3('Make the room dark.', 'कमरे में अँधेरा कीजिए।', 'Room mein andhera kijiye.'),
    edgeDo: t3('Now make it bright, but not full (about 85 %).', 'अब तेज़ रोशनी कीजिए, पर पूरी नहीं (लगभग 85 %)।', 'Ab tez roshni kijiye, par poori nahi (lagbhag 85 %).'),
    set: { on: 100, off: 8, edge: 85 }, ctl: 'light',
  },
  hot: {
    name: t3('temperature sensor (inside the chip)', 'तापमान सेंसर (चिप के अंदर)', 'temperature sensor (chip ke andar)'), lvl: 1, analog: true, controls: ['temp'], hud: ['temp'],
    read: 'temp = temperature()   # °C', v: 'temp', cond: 'temp > limit', l0: 35, l1: 30, note: 'hotter than this (°C): on',
    when: t3('it gets too hot', 'बहुत गर्मी होती है', 'bahut garmi hoti hai'),
    onDo: t3('Set the room temperature to 40 °C.', 'कमरे का तापमान 40 °C कीजिए।', 'Room ka temperature 40 °C kijiye.'),
    offDo: t3('Bring it back to 25 °C.', 'उसे वापस 25 °C कीजिए।', 'Use wapas 25 °C kijiye.'),
    edgeDo: t3('Now set it to 32 °C.', 'अब उसे 32 °C कीजिए।', 'Ab use 32 °C kijiye.'),
    set: { on: 40, off: 25, edge: 32 }, ctl: 'temp',
  },
  cold: {
    name: t3('temperature sensor (inside the chip)', 'तापमान सेंसर (चिप के अंदर)', 'temperature sensor (chip ke andar)'), lvl: 1, analog: true, controls: ['temp'], hud: ['temp'],
    read: 'temp = temperature()   # °C', v: 'temp', cond: 'temp < limit', l0: 20, l1: 26, note: 'colder than this (°C): on',
    when: t3('it gets too cold', 'बहुत ठंड हो जाती है', 'bahut thand ho jaati hai'),
    onDo: t3('Set the room temperature to 10 °C.', 'कमरे का तापमान 10 °C कीजिए।', 'Room ka temperature 10 °C kijiye.'),
    offDo: t3('Warm it back to 30 °C.', 'उसे वापस 30 °C तक गर्म कीजिए।', 'Use wapas 30 °C tak garam kijiye.'),
    edgeDo: t3('Now set it to 23 °C.', 'अब उसे 23 °C कीजिए।', 'Ab use 23 °C kijiye.'),
    set: { on: 10, off: 30, edge: 23 }, ctl: 'temp',
  },
  pot: {
    name: t3('knob on pin 1', 'पिन 1 पर नॉब', 'pin 1 par knob'), lvl: 1, analog: true, controls: ['knob'], hud: ['knob'], part: { tag: 'pot1', type: 'pot' },
    clips: [['GND', 'pot1.E1', t3('Clip GND to the knob\'s end 1 (left leg).', 'GND को नॉब के सिरे 1 (बायाँ पैर) से क्लिप कीजिए।', 'GND ko knob ke sire 1 (left pair) se clip kijiye.')],
      ['3V', 'pot1.E2', t3('Clip 3V to its end 2 (right leg).', '3V को इसके सिरे 2 (दायाँ पैर) से क्लिप कीजिए।', '3V ko iske sire 2 (right pair) se clip kijiye.')],
      ['P1', 'pot1.W', t3('Clip pin 1 to its middle leg (the wiper).', 'पिन 1 को इसके बीच वाले पैर (वाइपर) से क्लिप कीजिए।', 'Pin 1 ko iske beech wale pair (wiper) se clip kijiye.')]],
    read: 'knob = pin1.read_analog()   # 0 (turned left) to 1023 (turned right)', v: 'knob', cond: 'knob > limit', l0: 500, l1: 300, note: 'turned further than this: on',
    when: t3('the knob is turned past the mark', 'नॉब निशान से आगे घुमाया जाता है', 'knob nishaan se aage ghumaya jaata hai'),
    onDo: t3('Turn the knob more than halfway (the slider in the panel).', 'नॉब को आधे से ज़्यादा घुमाइए (पैनल का स्लाइडर)।', 'Knob ko aadhe se zyada ghumaiye (panel ka slider).'),
    offDo: t3('Turn it right down.', 'उसे पूरा नीचे घुमाइए।', 'Use poora neeche ghumaiye.'),
    edgeDo: t3('Now turn it to about 40 %.', 'अब उसे लगभग 40 % पर लाइए।', 'Ab use lagbhag 40 % par laiye.'),
    set: { on: 85, off: 10, edge: 40 }, ctl: 'knob',
  },
};
const IN_OF = { button: 'button', ldr: 'ldr', ldrb: 'ldrb', lm35: 'hot', dht: 'hot', cold: 'cold', pot: 'pot' };
const cmp = (ik, v, lim) => ({ ldr: v < lim, ldrb: v > lim, hot: v > lim, cold: v < lim, pot: v > lim }[ik]);

// ------------------------------------------------------------------ the outputs
const NO_ICON = (j) => /[A-Z]{3,}/.test(j.on) && j.key !== 'goal'; // a warning (STOP, TOO HOT, SMOKE …) gets a cross, the rest a tick
const MOUT = {
  speaker: {
    name: t3('speaker', 'स्पीकर', 'speaker'), imp: ['import music'], setup: [], hud: [],
    ready: t3('The micro:bit has its own speaker on the back.', 'micro:bit के पीछे उसका अपना स्पीकर है।', 'micro:bit ke peeche uska apna speaker hai.'),
    onWords: t3('the speaker beeps', 'स्पीकर बीप करता है', 'speaker beep karta hai'),
    on: () => ['music.pitch(2000, 100)    # a short beep, again and again'], off: () => [],
    isOn: (S) => S.t - (S.memRun.toneT ?? -9) < 0.25,
  },
  icon: {
    name: t3('LED screen', 'एलईडी स्क्रीन', 'LED screen'), imp: [], setup: [], hud: [],
    ready: t3('The 25 LEDs on the front are the screen.', 'सामने की 25 एलईडी ही स्क्रीन हैं।', 'Saamne ki 25 LED hi screen hain.'),
    onWords: (j) => (NO_ICON(j) ? t3('the screen shows a cross', 'स्क्रीन पर क्रॉस आता है', 'screen par cross aata hai') : t3('the screen shows a tick', 'स्क्रीन पर सही का निशान आता है', 'screen par sahi ka nishaan aata hai')),
    on: (j) => [`display.show(Image.${NO_ICON(j) ? 'NO' : 'YES'})      # ${j.on}`], off: () => ['display.clear()'],
    isOn: (S, j) => S.wv('shownImg') === (NO_ICON(j) ? 'NO' : 'YES'),
  },
  led: {
    name: t3('LED on pin 0', 'पिन 0 पर एलईडी', 'pin 0 par LED'), imp: [], setup: [], hud: ['led'], part: { tag: 'led1', type: 'led', color: 'red' },
    clips: [['P0', 'led1.A', t3('Clip pin 0 to the LED\'s long leg (+).', 'पिन 0 को एलईडी के लंबे पैर (+) से क्लिप कीजिए।', 'Pin 0 ko LED ke lambe pair (+) se clip kijiye.')],
      ['GND', 'led1.K', t3('Clip GND to its short leg (−).', 'GND को इसके छोटे पैर (−) से क्लिप कीजिए।', 'GND ko iske chhote pair (−) se clip kijiye.')]],
    ready: t3('A red LED waits on the desk, with two crocodile clips.', 'डेस्क पर एक लाल एलईडी है, दो क्रोकोडाइल क्लिप के साथ।', 'Desk par ek laal LED hai, do crocodile clip ke saath.'),
    onWords: t3('the LED lights up', 'एलईडी जल उठती है', 'LED jal uthti hai'),
    on: () => ['pin0.write_digital(1)'], off: () => ['pin0.write_digital(0)'],
    isOn: (S) => { const p = W0(S).parts.led1; return !!p && (p.state.b || 0) > 0.3; },
  },
  servo: {
    name: t3('servo on pin 0', 'पिन 0 पर सर्वो', 'pin 0 par servo'), imp: [], hud: ['servo'], part: { tag: 'sv1', type: 'servo' },
    clips: [['GND', 'sv1.GND', t3('Clip GND to the servo\'s brown wire.', 'GND को सर्वो के भूरे तार से क्लिप कीजिए।', 'GND ko servo ke brown wire se clip kijiye.')],
      ['3V', 'sv1.VP', t3('Clip 3V to its red wire (power).', '3V को इसके लाल तार (बिजली) से क्लिप कीजिए।', '3V ko iske laal wire (bijli) se clip kijiye.')],
      ['P0', 'sv1.SIG', t3('Clip pin 0 to its orange wire (the signal).', 'पिन 0 को इसके नारंगी तार (सिग्नल) से क्लिप कीजिए।', 'Pin 0 ko iske orange wire (signal) se clip kijiye.')]],
    setup: ['pin0.set_analog_period(20)     # a servo wants one pulse every 20 ms', 'pin0.write_analog(26)          # a 0.5 ms pulse: 0 degrees'],
    ready: t3('A small servo (SG90) waits on the desk, with three crocodile clips.', 'डेस्क पर एक छोटा सर्वो (SG90) है, तीन क्रोकोडाइल क्लिप के साथ।', 'Desk par ek chhota servo (SG90) hai, teen crocodile clip ke saath.'),
    onWords: t3('the servo turns to 90°', 'सर्वो 90° घूम जाता है', 'servo 90° ghoom jaata hai'),
    on: () => ['pin0.write_analog(77)      # a 1.5 ms pulse: 90 degrees'], off: () => ['pin0.write_analog(26)      # back to 0 degrees'],
    isOn: (S) => { const p = W0(S).parts.sv1; return !!p && (p.state.angle || 0) > 60; },
  },
};
const OUT_OF = { buzzer: 'speaker', led: 'led', relay: 'led', lcd: 'icon', oled: 'icon', rgb: 'icon', servo: 'servo' };

// ------------------------------------------------------------------ the program
export function sketchMB(job, ik, ok) {
  const inp = MIN[ik], out = MOUT[ok]; const on = out.on(job), off = out.off(job);
  const L = [`# ${job.title.en}: ${inp.name.en} and ${out.name.en}`, `# ${job.why.en}`, 'from microbit import *', ...out.imp, ''];
  if (inp.analog) L.push(`limit = ${inp.l0}         # ${inp.note}`);
  else L.push('hold = 1000         # stay on this long after the button is let go (ms)', 'last = -10000       # when the button was last pressed (long ago)');
  L.push(...out.setup, '', 'while True:');
  if (inp.analog) {
    L.push('    ' + inp.read, `    print(${inp.v})`, `    if ${inp.cond}:`, ...on.map((x) => '        ' + x));
    if (off.length) L.push('    else:', ...off.map((x) => '        ' + x));
    L.push('    sleep(200)');
  } else {
    L.push(`    if ${inp.trig}:`, '        last = running_time()   # pressed now: start the hold time again', '    if running_time() - last < hold:', ...on.map((x) => '        ' + x));
    if (off.length) L.push('    else:', ...off.map((x) => '        ' + x));
    L.push('    sleep(50)');
  }
  return L.join('\n') + '\n';
}

// ------------------------------------------------------------------ one lesson
const X = {
  clip: t3('A crocodile clip is missing: {a} must be joined to {b}.', 'एक क्रोकोडाइल क्लिप कम है: {a} को {b} से जोड़िए।', 'Ek crocodile clip kam hai: {a} ko {b} se jodiye.'),
  short: t3('3V is clipped straight to GND: that is a short circuit! Take that clip off.', '3V सीधे GND से जुड़ा है: यह शॉर्ट सर्किट है! वह क्लिप हटाइए।', '3V seedhe GND se juda hai: yeh short circuit hai! Woh clip hataiye.'),
  swapLed: t3('The LED is the wrong way round: its long leg (+) goes to pin 0, its short leg (−) to GND.', 'एलईडी उल्टी लगी है: लंबा पैर (+) पिन 0 पर, छोटा पैर (−) GND पर।', 'LED ulti lagi hai: lamba pair (+) pin 0 par, chhota pair (−) GND par.'),
};
const PIN_NAME = { P0: 'pin 0', P1: 'pin 1', GND: 'GND', '3V': '3V' };
function lesson(job, ik, ok, n) {
  const inp = MIN[ik], out = MOUT[ok];
  const ON = (S) => out.isOn(S, job);
  const id = `m_${job.key}_${ok}`; const code = sketchMB(job, ik, ok);
  const onW = typeof out.onWords === 'function' ? out.onWords(job) : out.onWords;
  const relayNote = job.outs.includes('relay') && ok === 'led' && !job.outs.includes('led') ? t3(' (The LED stands in for the lamp: a relay would switch the real one.)', ' (एलईडी यहाँ बल्ब की जगह है: असली बल्ब को रिले चलाएगा।)', ' (LED yahan bulb ki jagah hai: asli bulb ko relay chalayega.)') : t3('', '', '');
  const steps = [{ k: 'info', do: join3(job.why, ' ', out.ready, relayNote), see: t3(`Your job: teach the micro:bit when to switch the ${out.name.en}: when ${inp.when.en}.`, `आपका काम: micro:bit को सिखाइए कि ${out.name.hi} कब चलाना है: जब ${inp.when.hi}।`, `Aapka kaam: micro:bit ko sikhaiye ki ${out.name.hg} kab chalana hai: jab ${inp.when.hg}.`) }];
  const clips = [...(out.clips || []), ...(inp.clips || [])];
  for (const [a, b, d] of clips) steps.push({ k: 'act', clip: [a, b], until: (S) => S.w(`conn:${a}~${b}`), do: d, see: E });
  if (clips.length) steps.push({ k: 'check', do: t3('Press "Check my circuit".', '"मेरा सर्किट जाँचिए" दबाइए।', '"Mera circuit check karo" dabaiye.'), see: E });
  steps.push({ k: 'run', do: t3('Press Run.', '"चलाइए" दबाइए।', 'Run dabaiye.'), see: inp.analog ? t3(`The Serial Monitor shows the reading (${inp.v}) five times a second.`, `सीरियल मॉनिटर हर सेकंड पाँच बार रीडिंग (${inp.v}) दिखाता है।`, `Serial Monitor har second paanch baar reading (${inp.v}) dikhata hai.`) : t3('The program goes into the micro:bit and starts.', 'प्रोग्राम micro:bit में जाकर चलने लगता है।', 'Program micro:bit mein jaakar chalne lagta hai.') });
  const trig = inp.analog ? (S) => { const v = lastNum(S); return v !== null && cmp(ik, v, inp.l0); } : (S) => inp.active(S);
  steps.push({ k: 'act', until: (S) => fresh(S) && trig(S) && ON(S) && (S.memRun.onSeen = true), do: inp.onDo, see: t3(`${cap(onW.en)}.`, `${onW.hi}।`, `${cap(onW.hg)}.`) });
  steps.push({ k: 'act', until: (S) => fresh(S) && S.memRun.onSeen && !trig(S) && !ON(S), do: inp.offDo,
    see: t3(`And off again: the ${out.name.en} answers the sensor by itself.`, `और फिर बंद: ${out.name.hi} अपने-आप सेंसर का जवाब देता है।`, `Aur phir band: ${out.name.hg} apne aap sensor ka jawab deta hai.`) });
  if (inp.analog) {
    steps.push({ k: 'edit', test: (src) => new RegExp(`^limit\\s*=\\s*${inp.l1}\\b`, 'm').test(src), set: [[new RegExp(`^limit = ${inp.l0}\\b`, 'm'), `limit = ${inp.l1}`]],
      do: t3(`Make it more sensitive: change limit = ${inp.l0} to ${inp.l1} and press Run.`, `इसे ज़्यादा संवेदनशील बनाइए: limit = ${inp.l0} को ${inp.l1} कीजिए और "चलाइए" दबाइए।`, `Ise zyada sensitive banaiye: limit = ${inp.l0} ko ${inp.l1} karo aur Run dabaiye.`), see: E });
    steps.push({ k: 'act', until: (S) => { const v = lastNum(S); const ok2 = fresh(S) && v !== null && cmp(ik, v, inp.l1) && !cmp(ik, v, inp.l0) && ON(S); if (ok2) S.memRun.final = true; return ok2; }, do: inp.edgeDo,
      see: t3(`Before your change this would not have switched it; now it does. Choosing the limit is how engineers tune a real ${job.title.en.toLowerCase()}.`, `आपके बदलाव से पहले यह इसे चालू नहीं करता; अब करता है। सीमा चुनकर ही इंजीनियर असली उपकरण को ठीक करते हैं।`, `Aapke badlaav se pehle yeh ise on nahi karta; ab karta hai. Limit chunkar hi engineer asli device ko tune karte hain.`) });
  } else {
    steps.push({ k: 'edit', test: (src) => /^hold\s*=\s*3000\b/m.test(src), set: [[/^hold = 1000\b/m, 'hold = 3000']],
      do: t3('Keep it on longer: change hold = 1000 to 3000 and press Run.', 'इसे ज़्यादा देर चालू रखिए: hold = 1000 को 3000 कीजिए और "चलाइए" दबाइए।', 'Ise zyada der on rakhiye: hold = 1000 ko 3000 karo aur Run dabaiye.'), see: E });
    steps.push({ k: 'act', until: (S) => { const ok2 = fresh(S) && (S.memRun.afterMax || 0) >= 2.5; if (ok2) S.memRun.final = true; return ok2; }, do: inp.againDo,
      see: t3('It now stays on about 3 s after you let go: running_time() counts the milliseconds without stopping the program.', 'अब छोड़ने के बाद यह लगभग 3 s चालू रहता है: running_time() प्रोग्राम को रोके बिना मिलीसेकंड गिनता है।', 'Ab chhodne ke baad yeh lagbhag 3 s on rehta hai: running_time() program ko roke bina millisecond ginta hai.') });
  }
  const tick = (S, dt) => {
    const R = S.memRun; if (S.wv('tone')) R.toneT = S.t;
    if (inp.analog || !fresh(S)) return;
    if (!inp.active(S) && ON(S)) { R.after = (R.after || 0) + dt; R.afterMax = Math.max(R.afterMax || 0, R.after); } else R.after = 0;
  };
  const check = [(S) => (S.w('conn:3V~GND') ? [X.short] : null)];
  if (ok === 'led') check.push((S) => (S.w('conn:P0~led1.K') && S.w('conn:GND~led1.A') ? [X.swapLed] : null));
  for (const [a, b] of clips) check.push((S) => (S.w(`conn:${a}~${b}`) ? null : [X.clip, { a: PIN_NAME[a] || a, b: b.split('.')[1] }]));
  const parts = [out.part, inp.part].filter(Boolean).map((p) => Object.assign({}, p));
  const scene = ok === 'servo' ? 'gate' : ik === 'pot' ? 'dimmer' : 'desk';
  const cls = Math.min(6, Math.max(3, job.cls - 2 + (clips.length ? 1 : 0)));
  const when = inp.when;
  return {
    id, n, batch: 'FM', lang: 'py', factory: { job: job.key, inp: ik, out: ok, board: 'microbit' }, cls: String(cls), view: parts.length ? 'mbwide' : 'mb', code, drawer: [], serial: !!inp.analog, icon: '▦',
    title: t3(`${job.title.en}: ${inp.name.en} → ${out.name.en} (micro:bit)`, `${job.title.hi}: ${inp.name.hi} → ${out.name.hi} (micro:bit)`, `${job.title.hg}: ${inp.name.hg} → ${out.name.hg} (micro:bit)`),
    goal: join3(job.why, ' ', t3(`When ${when.en}, ${onW.en}.`, `जब ${when.hi}, तब ${onW.hi}।`, `Jab ${when.hg}, tab ${onW.hg}.`)),
    world: world({ scene, parts, controls: inp.controls, hud: [...inp.hud, ...out.hud], title: job.title }),
    setup: { parts: [], wires: [] }, steps, check, tick, done: (S) => !!S.memRun.final,
  };
}

// ------------------------------------------------------------------ all of them
export function batchFM(K, n0) {
  const out = []; let n = n0; const seen = new Set();
  for (const job of JOBS) {
    const ik = IN_OF[job.inp]; if (!ik) continue;
    for (const o of job.outs) {
      const ok = OUT_OF[o]; if (!ok || seen.has(job.key + ':' + ok)) continue;
      if (ik === 'pot' && ok === 'servo') continue; // (the knob and the servo gate would stand in each other's place on the desk)
      seen.add(job.key + ':' + ok); out.push(lesson(job, ik, ok, ++n));
    }
  }
  return out;
}
export const FACTORY_MB = { MIN, MOUT, IN_OF, OUT_OF, sketchMB };
