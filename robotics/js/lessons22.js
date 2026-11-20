// DUET Robotics Lab 360, batch 22: sessions with the small digital sensor modules (parts22.js), written fresh for DUET
// (same shape as lessons.js):
//   drowsy     a driver drowsiness alarm on the Uno: an IR eye-blink sensor on the driver's spectacles (OUT LOW while the
//              eye is closed) and a buzzer. The first program beeps at every blink, which nobody would keep switched on;
//              the student gives it a time limit (2 s), so blinks stay quiet and only a long closure sounds the alarm.
// The helpers (t3, P, F, W, need, has, noShort) come from lessons.js. devtools/test/robocore22.mjs plays them end to end.

const t3 = (en, hi, hg) => ({ en, hi, hg });
const pick = (lg, en, hi, hg) => (lg === 'hi' ? hi : lg === 'hg' ? hg : en);
const RT = { S: null }; // the lesson runtime that is playing now (each lesson's tick sets it)
function live(f) { const o = {}; for (const lg of ['en', 'hi', 'hg']) Object.defineProperty(o, lg, { enumerable: true, get: () => { try { return String(f(lg, RT.S) || ''); } catch (e) { return ''; } } }); return o; }

// ------------------------------------------------------------------ the programs
const DROWSY = `// Driver drowsiness alarm: an IR eye-blink sensor on the driver's spectacles.
// A normal blink lasts about a tenth of a second. Eyes shut for longer mean the
// driver is falling asleep at the wheel, and the buzzer must wake them up.
const int eye = 7;              // the sensor's OUT: LOW while the eye is closed
const int buzzer = 8;
unsigned long sleepy = 0;       // ms: eyes closed for longer than this sound the alarm
bool closed = false;
bool alarm = false;
unsigned long closedAt = 0;
int blinks = 0;

void setup() {
  pinMode(eye, INPUT);
  Serial.begin(9600);
  Serial.println("Drive safe!");
}

void loop() {
  bool shut = digitalRead(eye) == LOW;
  if (shut && !closed) {        // the eyelid just came down
    closed = true;
    closedAt = millis();
  }
  if (closed && !alarm && millis() - closedAt > sleepy) {
    alarm = true;
    tone(buzzer, 2500);         // a loud, high beep
    Serial.println("WAKE UP!");
  }
  if (!shut && closed) {        // the eye opened again
    closed = false;
    blinks++;
    Serial.print("Blink ");
    Serial.print(blinks);
    Serial.print(": eyes closed ");
    Serial.print(millis() - closedAt);
    Serial.println(" ms");
    if (alarm) {
      alarm = false;
      noTone(buzzer);
    }
  }
  delay(10);
}
`;

export function batch22(K, n0) {
  const { P, F, W, need, has, noShort } = K;
  const E = t3('', '', '');
  const CHECK = { k: 'check', do: t3('Check your circuit.', 'अपना सर्किट जाँचिए।', 'Apna circuit check karo.'), see: E };
  const RUN = (see) => ({ k: 'run', do: t3('Press Run.', '"चलाइए" दबाइए।', 'Run dabaiye.'), see: see || E });
  const w3 = (tag, pin, to, en, hi, hg, see) => ({ k: 'wire', wire: [tag + '.' + pin, to], do: t3(en, hi, hg), see: see || E });
  const fresh = (S) => S.runSrc !== null && S.t - (S.freshAt || 0) > 0.3;
  const POWER = [['5V', 'H:tp30'], ['GND3', 'H:tn18'], ['H:tp2', 'H:bp2'], ['H:tn3', 'H:bn3']];
  let n = n0;
  const L = [];

  // 1 ---------------------------------------------------------------------------------------------- driver drowsiness alarm
  // tick: each closure of the eye, how long it lasted and whether the buzzer sounded during it (this run)
  const watchEye = (S) => {
    const e = S.part('eb1'), bz = S.part('bz1'); if (!e) return; const M = S.memRun;
    const shut = !!(e.state.powered && (e.state.trig || e.state.pulse > 0)); const loud = !!(bz && bz.state.on);
    if (shut && M.c0 === undefined) { M.c0 = S.t; M.buzzed = false; }
    if (shut && loud) { M.buzzed = true; if (S.t - M.c0 > 1.5) M.woke = true; }
    if (!shut && M.c0 !== undefined) {
      const d = S.t - M.c0; M.c0 = undefined;
      if (d < 0.6) { if (M.buzzed) { M.falseAl = (M.falseAl || 0) + 1; S.mem.falseSeen = true; } else M.quiet = (M.quiet || 0) + 1; }
      else if (M.woke) M.stopped = !loud; // the eyes open: the alarm must stop
      M.buzzed = false;
    }
    if (!shut && M.woke && M.stopped === false && !loud) M.stopped = true;
  };
  const okSleepy = (src) => { const m = /unsigned\s+long\s+sleepy\s*=\s*(\d+)\s*;/.exec(src || ''); return !!m && +m[1] >= 1000 && +m[1] <= 3000; };
  const EB = t3('eye-blink sensor', 'आँख झपकने का सेंसर', 'eye blink sensor');
  L.push({ id: 'drowsy', cls: '10', blocks: false, view: 'wide', code: DROWSY, drawer: ['blink'], serial: true, tick: (S) => { RT.S = S; watchEye(S); },
    title: t3('Driver drowsiness alarm', 'ड्राइवर नींद अलार्म', 'Driver neend alarm'),
    goal: t3('Night drives on the highway: a driver who nods off for two seconds travels 30 metres with nobody steering. An IR sensor on the spectacles watches the eye; your program tells a blink from sleep and sounds the buzzer in time.', 'हाईवे पर रात का सफ़र: दो सेकंड झपकी लेने वाला ड्राइवर बिना स्टीयरिंग के 30 मीटर चला जाता है। चश्मे पर लगा IR सेंसर आँख देखता है; आपका प्रोग्राम पलक झपकने और नींद में फ़र्क़ करता है और समय पर बज़र बजाता है।', 'Highway par raat ka safar: do second jhapki lene wala driver bina steering ke 30 metre chala jaata hai. Chashme par laga IR sensor aankh dekhta hai; aapka program palak jhapakne aur neend mein farq karta hai aur samay par buzzer bajata hai.'),
    setup: { parts: [P('bz1', 'buzzer', {}, 'e30', 0)], wires: [...POWER, ['D8', 'H:a30'], ['H:a33', 'H:tn27']] },
    steps: [
      { k: 'info', do: t3('Ready on the bench: a buzzer on pin 8. Missing: the eye. The IR eye-blink sensor clips onto the arm of the driver\'s spectacles and looks at one eye from the side.', 'बेंच पर तैयार: पिन 8 पर एक बज़र। कमी: आँख की। IR आँख झपकने का सेंसर ड्राइवर के चश्मे की डंडी पर लगता है और बगल से एक आँख को देखता है।', 'Bench par taiyaar: pin 8 par ek buzzer. Kami: aankh ki. IR eye blink sensor driver ke chashme ki dandi par lagta hai aur bagal se ek aankh ko dekhta hai.'),
        see: t3('An open eye has a dark pupil that sends little infrared back; a closed eyelid is skin, which reflects more. The board compares that with its knob and pulls OUT LOW while the eye is closed.', 'खुली आँख की काली पुतली थोड़ी इन्फ़्रारेड लौटाती है; बंद पलक त्वचा है, जो ज़्यादा लौटाती है। बोर्ड इसे अपने नॉब से मिलाता है और आँख बंद रहने तक OUT को LOW रखता है।', 'Khuli aankh ki kaali putli thodi infrared lautati hai; band palak skin hai, jo zyada lautati hai. Board ise apne knob se milata hai aur aankh band rehne tak OUT ko LOW rakhta hai.') },
      { k: 'place', place: F('eb1', 'blink', {}, 110, 85, 2), do: t3('Put the eye-blink sensor on the mat at the ghost.', 'आँख झपकने वाले सेंसर को मैट पर नीली आकृति पर रखिए।', 'Eye blink sensor ko mat par neeli shape par rakhiye.'), see: E },
      w3('eb1', 'VCC', 'rail:tp', 'Wire its VCC pin to the + rail.', 'इसके VCC पिन को + रेल से जोड़िए।', 'Iske VCC pin ko + rail se jodiye.'),
      w3('eb1', 'GND', 'rail:tn', 'Its GND pin to the − rail.', 'इसका GND पिन − रेल से।', 'Iska GND pin − rail se.'),
      w3('eb1', 'OUT', 'D7', 'Its OUT pin to pin 7.', 'इसका OUT पिन, पिन 7 से।', 'Iska OUT pin, pin 7 se.'),
      CHECK,
      { k: 'info', code: [19, 28], do: t3('Read loop(): when the eye shuts, closedAt keeps the time from millis(). While it stays shut, millis() − closedAt is how long it has been closed; longer than sleepy, and the alarm starts. When the eye opens, the alarm stops.', 'loop() पढ़िए: आँख बंद होते ही closedAt में millis() का समय रखा जाता है। जब तक बंद रहे, millis() − closedAt बताता है कितनी देर से बंद है; sleepy से ज़्यादा हो तो अलार्म शुरू। आँख खुलते ही अलार्म बंद।', 'loop() padhiye: aankh band hote hi closedAt mein millis() ka time rakha jaata hai. Jab tak band rahe, millis() − closedAt batata hai kitni der se band hai; sleepy se zyada ho to alarm shuru. Aankh khulte hi alarm band.'), see: E },
      RUN(t3('"Drive safe!" on the Serial Monitor.', 'सीरियल मॉनिटर पर "Drive safe!"।', 'Serial Monitor par "Drive safe!".')),
      { k: 'act', until: (S) => (S.memRun.falseAl || 0) >= 2, do: t3('Tap the sensor and press 😉 Blink, two or three times, as anyone blinks while driving.', 'सेंसर को छूइए और 😉 पलक झपकाइए दो-तीन बार दबाइए, जैसे गाड़ी चलाते हुए हर कोई पलक झपकाता है।', 'Sensor ko touch karo aur 😉 Palak jhapkaiye do-teen baar dabaiye, jaise gaadi chalate hue har koi palak jhapkata hai.'),
        see: t3('"WAKE UP!" at every blink! sleepy = 0 means any closed eye is sleep. People blink 15–20 times a minute: a driver would pull this alarm off the dashboard within five minutes, and then it saves nobody.', 'हर पलक पर "WAKE UP!"! sleepy = 0 का मतलब है हर बंद आँख नींद है। लोग एक मिनट में 15–20 बार पलक झपकाते हैं: ड्राइवर पाँच मिनट में यह अलार्म डैशबोर्ड से उखाड़ देगा, और फिर यह किसी को नहीं बचाता।', 'Har palak par "WAKE UP!"! sleepy = 0 ka matlab hai har band aankh neend hai. Log ek minute mein 15–20 baar palak jhapkate hain: driver paanch minute mein yeh alarm dashboard se ukhaad dega, aur phir yeh kisi ko nahi bachata.') },
      { k: 'edit', test: okSleepy, set: [[/unsigned long sleepy = 0;/, 'unsigned long sleepy = 2000;']],
        do: t3('A blink is about 0.1 to 0.4 s; nodding off is 1 s or more. Change sleepy = 0 to sleepy = 2000 (2 seconds) and press Run.', 'पलक झपकना लगभग 0.1 से 0.4 s का होता है; झपकी 1 s या ज़्यादा। sleepy = 0 को sleepy = 2000 (2 सेकंड) कीजिए और "चलाइए" दबाइए।', 'Palak jhapkana lagbhag 0.1 se 0.4 s ka hota hai; jhapki 1 s ya zyada. sleepy = 0 ko sleepy = 2000 (2 second) karo aur Run dabaiye.'), see: E },
      { k: 'act', until: (S) => fresh(S) && (S.memRun.quiet || 0) >= 2 && !S.memRun.falseAl, do: t3('Blink two or three times again.', 'फिर से दो-तीन बार पलक झपकाइए।', 'Phir se do-teen baar palak jhapkaiye.'),
        see: t3('Quiet now: the Serial Monitor counts each blink and how long it lasted, about 150 ms, far below 2000.', 'अब शांति: सीरियल मॉनिटर हर पलक गिनता है और बताता है वह कितनी देर रही, लगभग 150 ms, 2000 से बहुत कम।', 'Ab shaanti: Serial Monitor har palak ginta hai aur batata hai woh kitni der rahi, lagbhag 150 ms, 2000 se bahut kam.') },
      { k: 'act', until: (S) => fresh(S) && S.memRun.woke && S.memRun.stopped, do: t3('Now the driver is nodding off: press 😑 Close the eyes, count "one, two, three", then press 👀 Open the eyes.', 'अब ड्राइवर को झपकी आ रही है: 😑 आँखें बंद कीजिए दबाइए, "एक, दो, तीन" गिनिए, फिर 👀 आँखें खोलिए दबाइए।', 'Ab driver ko jhapki aa rahi hai: 😑 Aankhein band kijiye dabaiye, "ek, do, teen" giniye, phir 👀 Aankhein kholiye dabaiye.'),
        see: live((lg, S) => { const M = (S && S.memRun) || {}; if (!M.woke) return '';
          return pick(lg, `Your results: quiet blinks, then "WAKE UP!" and the buzzer after 2 seconds of closed eyes, silent again when they opened. At 60 km/h a car covers 33 m in 2 s: real alarms in trucks and new cars warn sooner and also watch the head nodding. Try sleepy = 1000.`,
            `आपके नतीजे: पलक पर शांति, फिर आँखें 2 सेकंड बंद रहने पर "WAKE UP!" और बज़र, खुलते ही फिर चुप। 60 km/h पर कार 2 s में 33 m चलती है: ट्रकों और नई कारों के असली अलार्म इससे जल्दी चेताते हैं और सिर का झुकना भी देखते हैं। sleepy = 1000 आज़माइए।`,
            `Aapke results: palak par shaanti, phir aankhein 2 second band rehne par "WAKE UP!" aur buzzer, khulte hi phir chup. 60 km/h par car 2 s mein 33 m chalti hai: trucks aur nayi cars ke asli alarm isse jaldi chetate hain aur sir ka jhukna bhi dekhte hain. sleepy = 1000 aazmaiye.`); }) },
    ],
    check: [noShort, (S) => (S.conn('rail:tp', '5V') ? null : [W.vRail]), has('eb1', EB),
      need('eb1.VCC', '5V', W.to5v, { x: t3('sensor\'s VCC pin', 'सेंसर का VCC पिन', 'Sensor ka VCC pin') }), need('eb1.GND', 'GND', W.toGnd, { x: t3('sensor\'s GND pin', 'सेंसर का GND पिन', 'Sensor ka GND pin') }),
      need('eb1.OUT', 'D7', W.toPin, { x: t3('sensor\'s OUT pin', 'सेंसर का OUT पिन', 'Sensor ka OUT pin'), p: 7 })],
    done: (S) => okSleepy(S.runSrc) && S.memRun.woke && S.memRun.stopped && (S.memRun.quiet || 0) >= 2 });

  for (const l of L) { l.n = ++n; l.batch = 22; }
  return L;
}
