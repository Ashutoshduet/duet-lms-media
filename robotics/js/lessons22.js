// DUET Robotics Lab 360, batch 22: sessions with the small digital sensor modules (parts22.js), written fresh for DUET
// (same shape as lessons.js):
//   drowsy     a driver drowsiness alarm on the Uno: an IR eye-blink sensor on the driver's spectacles (OUT LOW while the
//              eye is closed) and a buzzer. The first program beeps at every blink, which nobody would keep switched on;
//              the student gives it a time limit (2 s), so blinks stay quiet and only a long closure sounds the alarm.
//   smartfarm  a smart farm on the ESP32: the soil sensor (GPIO 34) and the rain module (GPIO 27) on the farmer's phone, the
//              pump through a relay (GPIO 33). In auto it waters a dry field and stops when it is wet; the first program
//              also pumps in the rain (wasted power, a waterlogged field) until the student adds && !raining(); the phone
//              can take over (Pump on for the cattle trough) and hand back (Auto). The lesson's tick is the field: the
//              pump and the rain wet the soil.
//   kisanws    the Kisan weather station for the panchayat on the ESP32: DHT11 (GPIO 27), rain (GPIO 26), a cup anemometer
//              (GPIO 25, INPUT_PULLUP: its switch closes to GND once a turn; 1 turn a second = 2.4 km/h) and a page any
//              phone can open, with the spraying advice (no pesticide in rain or above 15 km/h). The first program counts
//              every loop() while the switch is closed (a "cyclone" of thousands of km/h); the edit counts only the change
//              from HIGH to LOW, and the wind reads true.
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

const FARM = `// Smart farm: the soil and the rain on the farmer's phone, and a pump that waters by itself.
#include <WiFi.h>
#include <WebServer.h>

const char* ssid = "DUET-School";
const char* password = "stem2026";
WebServer server(80);

const int soilPin = 34;         // the soil sensor's AO: dry soil gives a big number
const int rainPin = 27;         // the rain module's OUT: LOW while it rains
const int relay = 33;           // the pump's relay: HIGH = pump on
int dry = 3700;                 // drier than this: start watering
int wet = 2300;                 // wetter than this: stop
bool pump = false;
bool autoMode = true;           // the farm decides by itself; the phone can take over
unsigned long lastCheck = 0;

int soil() {
  return analogRead(soilPin);
}

bool raining() {
  return digitalRead(rainPin) == LOW;
}

void setPump(bool on) {
  if (on == pump) return;
  pump = on;
  digitalWrite(relay, on ? HIGH : LOW);
  Serial.println(on ? "Pump ON" : "Pump OFF");
}

void handleRoot() {
  String h = "<meta http-equiv=\\"refresh\\" content=\\"2\\">";
  h += "<h2>DUET Smart Farm</h2>";
  h += "<p>Soil: <b>" + String(soil()) + "</b> (dry above " + String(dry) + ")</p>";
  h += "<p>Rain: <b>";
  h += raining() ? "raining" : "no rain";
  h += "</b></p><p>Pump: <b>";
  h += pump ? "ON" : "OFF";
  h += "</b> (";
  h += autoMode ? "auto" : "manual";
  h += ")</p><p><a href=\\"/on\\"><button>Pump on</button></a> ";
  h += "<a href=\\"/off\\"><button>Pump off</button></a> ";
  h += "<a href=\\"/auto\\"><button>Auto</button></a></p>";
  server.send(200, "text/html", h);
}

void backHome() {
  server.sendHeader("Location", "/");   // back to the main page
  server.send(303);
}

void handleOn() {                       // the farmer takes over
  autoMode = false;
  setPump(true);
  backHome();
}

void handleOff() {
  autoMode = false;
  setPump(false);
  backHome();
}

void handleAuto() {                     // and hands back to the farm
  autoMode = true;
  backHome();
}

void setup() {
  Serial.begin(115200);
  pinMode(rainPin, INPUT);
  pinMode(relay, OUTPUT);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) delay(500);
  Serial.print("Open on the phone: http://");
  Serial.println(WiFi.localIP());
  server.on("/", handleRoot);
  server.on("/on", handleOn);
  server.on("/off", handleOff);
  server.on("/auto", handleAuto);
  server.begin();
}

void loop() {
  server.handleClient();               // answer the phone
  if (autoMode && millis() - lastCheck >= 1000) {   // once a second
    lastCheck = millis();
    int s = soil();
    Serial.print("Soil ");
    Serial.print(s);
    Serial.println(raining() ? "  raining" : "");
    if (s > dry) setPump(true);        // thirsty: water the field
    if (s < wet) setPump(false);       // wet enough: stop
  }
}
`;

const KISAN = `// Kisan weather station for the panchayat: temperature, humidity, rain and wind on any phone.
#include <WiFi.h>
#include <WebServer.h>
#include <DHT.h>

const char* ssid = "DUET-School";
const char* password = "stem2026";
WebServer server(80);
DHT dht(27, DHT11);             // temperature and humidity on GPIO 27
const int rainPin = 26;         // the rain module's OUT: LOW while it rains
const int windPin = 25;         // the anemometer's switch: closes to GND once a turn
int clicks = 0;                 // turns counted in this 3-second window
int lastState = HIGH;
float kmh = 0;                  // the wind speed
float temp = 0;
float hum = 0;
unsigned long windowStart = 0;

bool raining() {
  return digitalRead(rainPin) == LOW;
}

void handleRoot() {
  String h = "<meta http-equiv=\\"refresh\\" content=\\"3\\">";
  h += "<h2>Kisan Weather Station</h2>";
  h += "<p>Temperature: <b>" + String(temp, 1) + " C</b></p>";
  h += "<p>Humidity: <b>" + String(hum, 0) + " %</b></p>";
  h += "<p>Rain: <b>";
  h += raining() ? "raining" : "dry";
  h += "</b></p><p>Wind: <b>" + String(kmh, 1) + " km/h</b></p>";
  if (raining() || kmh > 15) {          // the spray drifts in wind and washes off in rain
    h += "<h3 style=\\"color:#d0342c\\">Do not spray pesticide today</h3>";
  } else {
    h += "<h3 style=\\"color:#2b8a3e\\">Good weather to spray</h3>";
  }
  server.send(200, "text/html", h);
}

void setup() {
  Serial.begin(115200);
  pinMode(rainPin, INPUT);
  pinMode(windPin, INPUT_PULLUP);       // HIGH, and LOW while the switch is closed
  dht.begin();
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) delay(500);
  Serial.print("Open on the phone: http://");
  Serial.println(WiFi.localIP());
  server.on("/", handleRoot);
  server.begin();
  windowStart = millis();
}

void loop() {
  server.handleClient();
  int now = digitalRead(windPin);
  if (now == LOW) clicks++;             // the switch is closed: count a turn
  lastState = now;
  if (millis() - windowStart >= 3000) { // every 3 seconds
    kmh = clicks / 3.0 * 2.4;           // 1 turn a second = 2.4 km/h
    clicks = 0;
    windowStart = millis();
    temp = dht.readTemperature();
    hum = dht.readHumidity();
    Serial.print("Wind ");
    Serial.print(kmh, 1);
    Serial.print(" km/h  ");
    Serial.print(temp, 1);
    Serial.print(" C  ");
    Serial.print(hum, 0);
    Serial.println(" %");
  }
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

  // 2 ---------------------------------------------------------------------------------------------- ESP32 smart farm
  // tick: the field. The pump (about 33 mL/s) and the rain wet the soil; what the farm did, this run
  const ESP_POWER = [['H:a4', 'H:tp2'], ['H:a5', 'H:tn3'], ['H:j4', 'H:bp2'], ['H:j5', 'H:bn3']];
  const PUMPW = [['T:pump:N', 'T:bat:N'], ['T:bat:P', 'T:rl1:COM'], ['T:rl1:NO', 'T:pump:P'], ['T:rl1:S', 'H:a12'], ['T:rl1:VCC', 'H:tp20'], ['T:rl1:GND', 'H:tn20']];
  const net = (S) => S.lab.net4 || { seen: { pages: 0, paths: {} }, staIP: () => null };
  const paths = (S) => net(S).seen.paths || {};
  const body = (S) => String((net(S).seen.last || {}).body || '');
  const moist = (S) => { const p = S.part('soil'); return p ? p.state.moist || 0 : 0; };
  const rainingNow = (S) => { const p = S.part('rn1'); return !!(p && p.state.powered && p.state.trig); };
  const field = (S, dt) => {
    const p = S.part('soil'), pm = S.part('pump'), rn = S.part('rn1'); if (!p || !dt) return; const M = S.memRun;
    const flow = pm ? pm.state.flow || 0 : 0, rain = !!(rn && rn.state.trig);
    let d = 0; if (flow > 3) d += 0.08 * dt * Math.min(1, flow / 30); if (rain) d += 0.05 * dt;
    if (d && p.state.moist < 0.95) { p.state.moist = Math.min(0.95, p.state.moist + d); S.lab.stateV++; S.lab.instKey = null; }
    if (!fresh(S)) return; // (what this program decided: the relay, not the water still running out of the pipe after a Run)
    const rl = S.part('rl1'), on = !!(rl && rl.state.on);
    if (on) M.pumped = true;
    if (p.state.moist <= 0.2) M.dryAt = S.t;
    if (M.pumped && !on && p.state.moist >= 0.55 && M.dryAt !== undefined) M.cycle = true; // dry -> watered -> stopped by itself
    if (rain && on) M.rainPump = (M.rainPump || 0) + dt;
    if (rain && p.state.moist <= 0.2) M.rainDry = true;
    if (/\(manual\)/.test(body(S)) && on) M.manual = true;
    if (M.manual && /\(auto\)/.test(body(S)) && !on) M.backAuto = true;
  };
  const okRain = (src) => /if\s*\(\s*s\s*>\s*dry\s*&&\s*!\s*raining\(\)\s*\)\s*setPump\(true\)/.test(src || '');
  const SOIL = t3('soil sensor', 'मिट्टी सेंसर', 'soil sensor'), RAIN = t3('rain sensor', 'रेन सेंसर', 'rain sensor');
  const XF = {
    v5: t3('A sensor is on VIN (5 V): its output would reach 5 V, more than an ESP32 pin can take. Put VCC on the front + rail (3.3 V).', 'एक सेंसर VIN (5 V) पर है: उसका आउटपुट 5 V तक जाएगा, ESP32 का पिन इतना नहीं सह सकता। VCC को आगे वाली + रेल (3.3 V) पर लगाइए।', 'Ek sensor VIN (5 V) par hai: uska output 5 V tak jaayega, ESP32 ka pin itna nahi seh sakta. VCC ko aage wali + rail (3.3 V) par lagaiye.'),
  };
  L.push({ id: 'smartfarm', board: 'esp32', cls: '10', blocks: false, view: 'wide', code: FARM, drawer: ['soil', 'rain'], baud: 115200, serial: true, phone: true, tick: (S, dt) => { RT.S = S; field(S, dt); },
    title: t3('Smart farm: soil, rain and pump on the phone', 'स्मार्ट खेत: मिट्टी, बारिश और पंप फ़ोन पर', 'Smart khet: mitti, baarish aur pump phone par'),
    goal: t3('A farmer walks to the field twice a day to start the pump, and forgets to stop it when it rains. Your ESP32 watches the soil and the sky, waters only a thirsty field, and puts it all on the farmer\'s phone with a button to take over.', 'किसान दिन में दो बार पंप चलाने खेत जाता है, और बारिश में उसे बंद करना भूल जाता है। आपका ESP32 मिट्टी और आसमान देखता है, सिर्फ़ प्यासे खेत को पानी देता है, और सब कुछ किसान के फ़ोन पर दिखाता है, साथ में ख़ुद चलाने का बटन।', 'Kisan din mein do baar pump chalane khet jaata hai, aur baarish mein use band karna bhool jaata hai. Aapka ESP32 mitti aur aasmaan dekhta hai, sirf pyaase khet ko paani deta hai, aur sab kuch kisan ke phone par dikhata hai, saath mein khud chalane ka button.'),
    setup: { parts: [F('bat', 'aa4', {}, -40, 150, 0), F('pump', 'pump', { mount: 'tank' }, 182, 140, 1), F('rl1', 'relay', {}, 60, 118, 0)], wires: [...ESP_POWER, ...PUMPW] },
    steps: [
      { k: 'info', do: t3('Ready on the bench: the ESP32 and the pump with its own 6 V battery, switched by a relay on GPIO 33. Missing: the farm\'s senses. The soil sensor goes into the field; the rain plate goes on a post in the open.', 'बेंच पर तैयार: ESP32 और अपनी 6 V बैटरी वाला पंप, GPIO 33 के रिले से चलता है। कमी: खेत की इंद्रियों की। मिट्टी सेंसर खेत में जाता है; रेन प्लेट खुले में एक खंभे पर।', 'Bench par taiyaar: ESP32 aur apni 6 V battery wala pump, GPIO 33 ke relay se chalta hai. Kami: khet ki indriyon ki. Soil sensor khet mein jaata hai; rain plate khule mein ek khambhe par.'),
        see: t3('Both sensors run on 3.3 V here, from the front + rail: an ESP32 pin must never see more than 3.3 V.', 'दोनों सेंसर यहाँ आगे वाली + रेल से 3.3 V पर चलते हैं: ESP32 के पिन पर कभी 3.3 V से ज़्यादा नहीं आना चाहिए।', 'Dono sensor yahan aage wali + rail se 3.3 V par chalte hain: ESP32 ke pin par kabhi 3.3 V se zyada nahi aana chahiye.') },
      { k: 'place', place: F('soil', 'soil', {}, 150, 92, 0), do: t3('Put the soil sensor on the mat at the ghost, its probe in the field\'s pot.', 'मिट्टी सेंसर को मैट पर नीली आकृति पर रखिए, उसका प्रोब खेत के गमले में।', 'Soil sensor ko mat par neeli shape par rakhiye, uska probe khet ke gamle mein.'), see: E },
      w3('soil', 'VCC', 'rail:bp', 'Wire its VCC to the front + rail (3.3 V).', 'इसका VCC आगे वाली + रेल (3.3 V) से जोड़िए।', 'Iska VCC aage wali + rail (3.3 V) se jodiye.'),
      w3('soil', 'GND', 'rail:bn', 'Its GND to the front − rail.', 'इसका GND आगे वाली − रेल से।', 'Iska GND aage wali − rail se.'),
      w3('soil', 'AO', 'D34', 'Its AO (analog out) to GPIO 34.', 'इसका AO (एनालॉग आउट) GPIO 34 से।', 'Iska AO (analog out) GPIO 34 se.'),
      { k: 'place', place: F('rn1', 'rain', {}, -125, 5, 2), do: t3('Put the rain sensor on the mat at the ghost: the small board, and its plate out in the open.', 'रेन सेंसर को मैट पर नीली आकृति पर रखिए: छोटा बोर्ड, और उसकी प्लेट खुले में।', 'Rain sensor ko mat par neeli shape par rakhiye: chhota board, aur uski plate khule mein.'), see: E },
      w3('rn1', 'VCC', 'rail:bp', 'Wire its VCC to the front + rail (3.3 V).', 'इसका VCC आगे वाली + रेल (3.3 V) से जोड़िए।', 'Iska VCC aage wali + rail (3.3 V) se jodiye.'),
      w3('rn1', 'GND', 'rail:bn', 'Its GND to the front − rail.', 'इसका GND आगे वाली − रेल से।', 'Iska GND aage wali − rail se.'),
      w3('rn1', 'OUT', 'D27', 'Its OUT to GPIO 27.', 'इसका OUT, GPIO 27 से।', 'Iska OUT, GPIO 27 se.'),
      CHECK,
      { k: 'info', code: [86, 97], do: t3('Read loop(): once a second, in auto, it reads the soil. Above dry (3700) the field is thirsty and the pump starts; below wet (2300) it stops. Two limits, so the pump does not click on and off at one number.', 'loop() पढ़िए: ऑटो में हर सेकंड यह मिट्टी पढ़ता है। dry (3700) से ऊपर खेत प्यासा है और पंप चलता है; wet (2300) से नीचे रुकता है। दो सीमाएँ, ताकि पंप एक ही संख्या पर बार-बार चालू-बंद न हो।', 'loop() padhiye: auto mein har second yeh mitti padhta hai. dry (3700) se upar khet pyaasa hai aur pump chalta hai; wet (2300) se neeche rukta hai. Do limits, taaki pump ek hi number par baar-baar on-off na ho.'), see: E },
      RUN(t3('It joins the WiFi and prints its address, then the soil every second.', 'यह WiFi से जुड़ता है और अपना पता लिखता है, फिर हर सेकंड मिट्टी।', 'Yeh WiFi se judta hai aur apna address likhta hai, phir har second mitti.')),
      { k: 'watch', until: (S) => !!net(S).staIP() && S.lineCount() >= 1, do: t3('Wait for the address on the Serial Monitor.', 'सीरियल मॉनिटर पर पते का इंतज़ार कीजिए।', 'Serial Monitor par address ka intezaar kijiye.'), see: t3('Like http://192.168.1.31: the router gave the farm that address.', 'जैसे http://192.168.1.31: राउटर ने खेत को वह पता दिया है।', 'Jaise http://192.168.1.31: router ne khet ko woh address diya hai.') },
      { k: 'act', until: (S) => fresh(S) && (paths(S)['/'] || 0) >= 1 && /Smart Farm/.test(body(S)), do: t3('On the phone, open the Browser, type the address from the Serial Monitor (http://192.168.1.…) and press Go.', 'फ़ोन पर Browser खोलिए, सीरियल मॉनिटर वाला पता (http://192.168.1.…) लिखिए और Go दबाइए।', 'Phone par Browser kholiye, Serial Monitor wala address (http://192.168.1.…) likhiye aur Go dabaiye.'),
        see: t3('The farm on the phone: soil, rain and pump, refreshed every 2 seconds by itself. The farmer can be at home, or in the next village on the same WiFi.', 'फ़ोन पर खेत: मिट्टी, बारिश और पंप, हर 2 सेकंड में अपने-आप ताज़ा। किसान घर पर हो सकता है।', 'Phone par khet: mitti, baarish aur pump, har 2 second mein apne aap taaza. Kisan ghar par ho sakta hai.') },
      { k: 'act', until: (S) => fresh(S) && S.memRun.cycle, do: t3('The dry season: tap the soil sensor and set the moisture to 15 %. Then watch.', 'सूखा मौसम: मिट्टी सेंसर को छूइए और नमी 15 % कीजिए। फिर देखिए।', 'Sookha mausam: soil sensor ko touch karo aur nami 15 % kijiye. Phir dekhiye.'),
        see: t3('"Pump ON": the water soaks in, the reading falls, and below 2300 "Pump OFF" by itself. Nobody walked to the field.', '"Pump ON": पानी सोखता है, रीडिंग गिरती है, और 2300 से नीचे अपने-आप "Pump OFF"। कोई खेत तक नहीं गया।', '"Pump ON": paani sokhta hai, reading girti hai, aur 2300 se neeche apne aap "Pump OFF". Koi khet tak nahi gaya.') },
      { k: 'act', until: (S) => fresh(S) && (S.memRun.rainPump || 0) >= 1.5, do: t3('The monsoon comes: tap the rain sensor and let it rain on the plate. Then set the soil to 15 % again (the topsoil is still dry).', 'मानसून आया: रेन सेंसर को छूइए और प्लेट पर बारिश होने दीजिए। फिर मिट्टी को फिर से 15 % कीजिए (ऊपर की मिट्टी अभी सूखी है)।', 'Monsoon aaya: rain sensor ko touch karo aur plate par baarish hone dijiye. Phir mitti ko phir se 15 % kijiye (upar ki mitti abhi sookhi hai).'),
        see: t3('The pump runs in the rain! The program only asks about the soil. The farmer pays for the electricity, the rain was free, and too much water rots the roots.', 'बारिश में पंप चल रहा है! प्रोग्राम सिर्फ़ मिट्टी के बारे में पूछता है। बिजली का बिल किसान भरता है, बारिश मुफ़्त थी, और ज़्यादा पानी से जड़ें सड़ती हैं।', 'Baarish mein pump chal raha hai! Program sirf mitti ke baare mein poochhta hai. Bijli ka bill kisan bharta hai, baarish muft thi, aur zyada paani se jadein sadti hain.') },
      { k: 'edit', test: okRain, set: [[/if \(s > dry\) setPump\(true\);/, 'if (s > dry && !raining()) setPump(true);']],
        do: t3('Water only when it is not raining: change if (s > dry) to if (s > dry && !raining()) and press Run. && means "and", ! means "not".', 'सिर्फ़ तब पानी दीजिए जब बारिश न हो रही हो: if (s > dry) को if (s > dry && !raining()) कीजिए और "चलाइए" दबाइए। && का मतलब "और", ! का मतलब "नहीं"।', 'Sirf tab paani dijiye jab baarish na ho rahi ho: if (s > dry) ko if (s > dry && !raining()) karo aur Run dabaiye. && ka matlab "aur", ! ka matlab "nahi".'), see: E },
      { k: 'act', until: (S) => fresh(S) && S.memRun.rainDry && !S.memRun.rainPump && moist(S) >= 0.55 && rainingNow(S), do: t3('It is still raining: set the soil to 15 % once more, and watch.', 'अभी भी बारिश हो रही है: मिट्टी को एक बार फिर 15 % कीजिए, और देखिए।', 'Abhi bhi baarish ho rahi hai: mitti ko ek baar phir 15 % kijiye, aur dekhiye.'),
        see: t3('The pump stays off and the rain waters the field for free. Two conditions joined by && is how real controllers decide.', 'पंप बंद रहता है और बारिश मुफ़्त में खेत को पानी देती है। && से जुड़ी दो शर्तें: असली कंट्रोलर ऐसे ही फ़ैसला करते हैं।', 'Pump band rehta hai aur baarish muft mein khet ko paani deti hai. && se judi do shartein: asli controller aise hi faisla karte hain.') },
      { k: 'act', until: (S) => fresh(S) && S.memRun.manual, do: t3('The rain stops: wipe the plate dry. The farmer wants to fill the cattle trough: on the phone, tap "Pump on".', 'बारिश रुकी: प्लेट पोंछकर सुखाइए। किसान को पशुओं की नाँद भरनी है: फ़ोन पर "Pump on" दबाइए।', 'Baarish ruki: plate pochh kar sukhaiye. Kisan ko pashuon ki naand bharni hai: phone par "Pump on" dabaiye.'),
        see: t3('"Pump ON (manual)": the phone has taken over, and the farm no longer decides by itself.', '"Pump ON (manual)": फ़ोन ने कमान ले ली, और खेत अब ख़ुद फ़ैसला नहीं करता।', '"Pump ON (manual)": phone ne kamaan le li, aur khet ab khud faisla nahi karta.') },
      { k: 'act', until: (S) => fresh(S) && S.memRun.backAuto, do: t3('The trough is full: tap "Auto" to hand the farm back.', 'नाँद भर गई: खेत वापस सौंपने के लिए "Auto" दबाइए।', 'Naand bhar gayi: khet wapas saunpne ke liye "Auto" dabaiye.'),
        see: live((lg, S) => { const v = S && S.serLines ? S.serLines.map((x) => /^Soil (\d+)/.exec(x)).filter(Boolean).map((m) => +m[1]) : []; const last = v.length ? v[v.length - 1] : '…';
          return pick(lg, `Your results: back in auto, the soil reads ${last}, wet enough, so "Pump OFF". The farm watered a dry field, left the rain to do its work, and let the farmer take over. Real smart-irrigation kits on Indian farms do just this, over WiFi or a SIM card.`,
            `आपके नतीजे: वापस ऑटो में, मिट्टी ${last} पढ़ती है, काफ़ी गीली, इसलिए "Pump OFF"। खेत ने सूखे खेत को पानी दिया, बारिश को उसका काम करने दिया, और किसान को कमान लेने दी। भारत के खेतों में असली स्मार्ट-सिंचाई किट यही करते हैं, WiFi या SIM कार्ड से।`,
            `Aapke results: wapas auto mein, mitti ${last} padhti hai, kaafi geeli, isliye "Pump OFF". Khet ne sookhe khet ko paani diya, baarish ko uska kaam karne diya, aur kisan ko kamaan lene di. Bharat ke kheton mein asli smart-irrigation kit yahi karte hain, WiFi ya SIM card se.`); }) },
    ],
    check: [(S) => (S.conn('VIN', 'GND') || S.conn('3V3', 'GND') ? [W.short] : null), has('soil', SOIL), has('rn1', RAIN),
      (S) => (S.conn('soil.VCC', 'VIN') || S.conn('rn1.VCC', 'VIN') ? [XF.v5] : null),
      need('soil.VCC', '3V3', W.join, { a: t3('The soil sensor\'s VCC', 'मिट्टी सेंसर का VCC', 'Soil sensor ka VCC'), b: '3V3' }), need('soil.GND', 'GND', W.toGnd, { x: t3('soil sensor\'s GND', 'मिट्टी सेंसर का GND', 'Soil sensor ka GND') }),
      need('soil.AO', 'D34', W.join, { a: t3('The soil sensor\'s AO', 'मिट्टी सेंसर का AO', 'Soil sensor ka AO'), b: 'GPIO 34' }),
      need('rn1.VCC', '3V3', W.join, { a: t3('The rain sensor\'s VCC', 'रेन सेंसर का VCC', 'Rain sensor ka VCC'), b: '3V3' }), need('rn1.GND', 'GND', W.toGnd, { x: t3('rain sensor\'s GND', 'रेन सेंसर का GND', 'Rain sensor ka GND') }),
      need('rn1.OUT', 'D27', W.toPin, { x: t3('rain sensor\'s OUT', 'रेन सेंसर का OUT', 'Rain sensor ka OUT'), p: 27 })],
    done: (S) => okRain(S.runSrc) && S.memRun.rainDry && !S.memRun.rainPump && S.memRun.backAuto });

  // 3 ---------------------------------------------------------------------------------------------- Kisan weather station
  const winds = (S) => (S.serLines || []).map((x) => /^Wind (\d+(?:\.\d+)?) km\/h/.exec(x)).filter(Boolean).map((m) => +m[1]);
  const lastWind = (S) => { const v = winds(S); return v.length ? v[v.length - 1] : null; };
  const near = (S, k, tol) => { const v = lastWind(S); return v !== null && Math.abs(v - k) <= tol; };
  const windNow = (S) => { const p = S.part('an1'); return p ? p.state.wind || 0 : 0; };
  const okEdge = (src) => /if\s*\(\s*now\s*==\s*LOW\s*&&\s*lastState\s*==\s*HIGH\s*\)\s*clicks\+\+/.test(src || '');
  const DHTN = t3('DHT11', 'DHT11', 'DHT11'), ANEMO = t3('anemometer', 'एनीमोमीटर', 'anemometer');
  L.push({ id: 'kisanws', board: 'esp32', cls: '10', blocks: false, view: 'wide', code: KISAN, drawer: ['dht11', 'rain', 'anemo'], baud: 115200, serial: true, phone: true, tick: (S) => { RT.S = S; },
    title: t3('Kisan weather station for the panchayat', 'पंचायत के लिए किसान मौसम स्टेशन', 'Panchayat ke liye kisan mausam station'),
    goal: t3('Should we spray the cotton today? Spray drifts onto the next field in a strong wind and washes off in the rain. Your ESP32 weather station measures temperature, humidity, rain and wind, and any farmer in the village opens its page on a phone for the answer.', 'आज कपास पर छिड़काव करें? तेज़ हवा में दवा बगल के खेत में उड़ जाती है और बारिश में धुल जाती है। आपका ESP32 मौसम स्टेशन तापमान, नमी, बारिश और हवा नापता है, और गाँव का कोई भी किसान फ़ोन पर इसका पेज खोलकर जवाब पाता है।', 'Aaj kapaas par chhidkaav karein? Tez hawa mein dawa bagal ke khet mein ud jaati hai aur baarish mein dhul jaati hai. Aapka ESP32 mausam station temperature, nami, baarish aur hawa naapta hai, aur gaon ka koi bhi kisan phone par iska page khol kar jawab paata hai.'),
    setup: { parts: [], wires: [...ESP_POWER] },
    steps: [
      { k: 'info', do: t3('Ready on the bench: the ESP32 with its rails (3.3 V in front). Three instruments to fit: the DHT11 for temperature and humidity, the rain plate, and a cup anemometer for the wind.', 'बेंच पर तैयार: अपनी रेलों के साथ ESP32 (आगे 3.3 V)। तीन यंत्र लगाने हैं: तापमान और नमी के लिए DHT11, रेन प्लेट, और हवा के लिए कप एनीमोमीटर।', 'Bench par taiyaar: apni rails ke saath ESP32 (aage 3.3 V). Teen yantra lagane hain: temperature aur nami ke liye DHT11, rain plate, aur hawa ke liye cup anemometer.'),
        see: t3('A real station puts them on a pole 2 m up, the DHT11 in a white louvred box out of the sun.', 'असली स्टेशन इन्हें 2 m ऊँचे खंभे पर लगाता है, DHT11 को धूप से बचाकर सफ़ेद जालीदार डिब्बे में।', 'Asli station inhe 2 m oonche khambhe par lagata hai, DHT11 ko dhoop se bachakar safed jaalidaar dibbe mein.') },
      { k: 'place', place: P('dht', 'dht11', {}, 'j40', 0), do: t3('Plug the DHT11 into 40j–42j, its grille facing you.', 'DHT11 को 40j–42j में लगाइए, जाली आपकी तरफ़।', 'DHT11 ko 40j–42j mein lagaiye, jaali aapki taraf.'), see: E },
      w3('dht', 'VCC', 'rail:bp', 'Its middle pin (+) to the front + rail (3.3 V).', 'इसका बीच वाला पिन (+) आगे वाली + रेल (3.3 V) से।', 'Iska beech wala pin (+) aage wali + rail (3.3 V) se.'),
      w3('dht', 'GND', 'rail:bn', 'Its right pin (−) to the front − rail.', 'इसका दायाँ पिन (−) आगे वाली − रेल से।', 'Iska right pin (−) aage wali − rail se.'),
      w3('dht', 'DATA', 'D27', 'Its left pin (DATA) to GPIO 27.', 'इसका बायाँ पिन (DATA) GPIO 27 से।', 'Iska left pin (DATA) GPIO 27 se.'),
      { k: 'place', place: F('rn1', 'rain', {}, -125, 5, 2), do: t3('Put the rain sensor on the mat at the ghost.', 'रेन सेंसर को मैट पर नीली आकृति पर रखिए।', 'Rain sensor ko mat par neeli shape par rakhiye.'), see: E },
      w3('rn1', 'VCC', 'rail:bp', 'Wire its VCC to the front + rail (3.3 V).', 'इसका VCC आगे वाली + रेल (3.3 V) से जोड़िए।', 'Iska VCC aage wali + rail (3.3 V) se jodiye.'),
      w3('rn1', 'GND', 'rail:bn', 'Its GND to the front − rail.', 'इसका GND आगे वाली − रेल से।', 'Iska GND aage wali − rail se.'),
      w3('rn1', 'OUT', 'D26', 'Its OUT to GPIO 26.', 'इसका OUT, GPIO 26 से।', 'Iska OUT, GPIO 26 se.'),
      { k: 'place', place: F('an1', 'anemo', {}, 110, 85, 2), do: t3('Put the anemometer on the mat at the ghost.', 'एनीमोमीटर को मैट पर नीली आकृति पर रखिए।', 'Anemometer ko mat par neeli shape par rakhiye.'), see: E },
      w3('an1', 'A', 'D25', 'Wire its lead A to GPIO 25.', 'इसका तार A, GPIO 25 से जोड़िए।', 'Iska taar A, GPIO 25 se jodiye.'),
      w3('an1', 'B', 'rail:bn', 'Its lead B to the front − rail (GND).', 'इसका तार B आगे वाली − रेल (GND) से।', 'Iska taar B aage wali − rail (GND) se.',
        t3('No power for the anemometer: it is only a switch. INPUT_PULLUP holds GPIO 25 HIGH, and the switch pulls it LOW once a turn.', 'एनीमोमीटर को बिजली नहीं चाहिए: यह बस एक स्विच है। INPUT_PULLUP, GPIO 25 को HIGH रखता है, और स्विच हर चक्कर में उसे LOW करता है।', 'Anemometer ko bijli nahi chahiye: yeh bas ek switch hai. INPUT_PULLUP, GPIO 25 ko HIGH rakhta hai, aur switch har chakkar mein use LOW karta hai.')),
      CHECK,
      { k: 'info', code: [53, 63], do: t3('Read loop(): it counts turns for 3 seconds, then km/h = turns ÷ 3 × 2.4 (one turn a second is 2.4 km/h), and reads the DHT11.', 'loop() पढ़िए: यह 3 सेकंड तक चक्कर गिनता है, फिर km/h = चक्कर ÷ 3 × 2.4 (एक सेकंड में एक चक्कर = 2.4 km/h), और DHT11 पढ़ता है।', 'loop() padhiye: yeh 3 second tak chakkar ginta hai, phir km/h = chakkar ÷ 3 × 2.4 (ek second mein ek chakkar = 2.4 km/h), aur DHT11 padhta hai.'), see: E },
      RUN(t3('It joins the WiFi and prints its address; every 3 s a line of weather.', 'यह WiFi से जुड़ता है और अपना पता लिखता है; हर 3 s मौसम की एक लाइन।', 'Yeh WiFi se judta hai aur apna address likhta hai; har 3 s mausam ki ek line.')),
      { k: 'watch', until: (S) => !!net(S).staIP() && S.lineCount() >= 1, do: t3('Wait for the address on the Serial Monitor.', 'सीरियल मॉनिटर पर पते का इंतज़ार कीजिए।', 'Serial Monitor par address ka intezaar kijiye.'), see: E },
      { k: 'act', until: (S) => fresh(S) && (paths(S)['/'] || 0) >= 1 && /Kisan Weather Station/.test(body(S)), do: t3('On the phone, open the Browser, type the address and press Go.', 'फ़ोन पर Browser खोलिए, पता लिखिए और Go दबाइए।', 'Phone par Browser kholiye, address likhiye aur Go dabaiye.'),
        see: t3('The village\'s weather page; it refreshes itself every 3 s.', 'गाँव का मौसम पेज; यह हर 3 s में अपने-आप ताज़ा होता है।', 'Gaon ka mausam page; yeh har 3 s mein apne aap taaza hota hai.') },
      { k: 'act', until: (S) => fresh(S) && windNow(S) > 0 && windNow(S) <= 20 && (lastWind(S) || 0) > 100 && (S.mem.cyclone = true), do: t3('A light breeze: tap the anemometer and set the wind to 10 km/h. Watch the Serial Monitor.', 'हल्की हवा: एनीमोमीटर को छूइए और हवा 10 km/h कीजिए। सीरियल मॉनिटर देखिए।', 'Halki hawa: anemometer ko touch karo aur hawa 10 km/h kijiye. Serial Monitor dekhiye.'),
        see: live((lg, S) => { const v = S ? lastWind(S) : null; if (v === null) return ''; return pick(lg, `"Wind ${v} km/h": a cyclone from a breeze? loop() runs thousands of times a second, and while the switch stays closed, every pass adds one more "turn".`, `"Wind ${v} km/h": हल्की हवा से चक्रवात? loop() एक सेकंड में हज़ारों बार चलता है, और जब तक स्विच बंद रहे, हर बार एक और "चक्कर" जुड़ जाता है।`, `"Wind ${v} km/h": halki hawa se cyclone? loop() ek second mein hazaaron baar chalta hai, aur jab tak switch band rahe, har baar ek aur "chakkar" jud jaata hai.`); }) },
      { k: 'edit', test: okEdge, set: [[/if \(now == LOW\) clicks\+\+;/, 'if (now == LOW && lastState == HIGH) clicks++;']],
        do: t3('Count a turn only at the moment the switch closes, when the pin goes from HIGH to LOW: change if (now == LOW) to if (now == LOW && lastState == HIGH) and press Run.', 'चक्कर सिर्फ़ उस पल गिनिए जब स्विच बंद होता है, जब पिन HIGH से LOW होता है: if (now == LOW) को if (now == LOW && lastState == HIGH) कीजिए और "चलाइए" दबाइए।', 'Chakkar sirf us pal giniye jab switch band hota hai, jab pin HIGH se LOW hota hai: if (now == LOW) ko if (now == LOW && lastState == HIGH) karo aur Run dabaiye.'), see: E },
      { k: 'act', until: (S) => fresh(S) && windNow(S) >= 8 && windNow(S) <= 12 && near(S, windNow(S), 2) && (S.memRun.calm = true), do: t3('Keep the wind at 10 km/h and wait for two readings.', 'हवा 10 km/h पर रखिए और दो रीडिंग का इंतज़ार कीजिए।', 'Hawa 10 km/h par rakhiye aur do reading ka intezaar kijiye.'),
        see: t3('About 10 km/h now: 4 turns a second, counted once each. Catching the edge (the change), not the level, is how every counter works: a bicycle computer, an energy meter, a factory\'s bottle counter.', 'अब लगभग 10 km/h: एक सेकंड में 4 चक्कर, हर एक एक बार गिना। स्तर नहीं, बदलाव (एज) पकड़ना: हर काउंटर ऐसे ही चलता है, साइकिल कंप्यूटर, बिजली मीटर, फ़ैक्ट्री का बोतल काउंटर।', 'Ab lagbhag 10 km/h: ek second mein 4 chakkar, har ek ek baar gina. Level nahi, badlaav (edge) pakadna: har counter aise hi chalta hai, cycle computer, bijli meter, factory ka bottle counter.') },
      { k: 'act', until: (S) => fresh(S) && windNow(S) >= 18 && near(S, windNow(S), 3) && /Do not spray/.test(body(S)) && (S.memRun.gust = true), do: t3('A gusty afternoon: set the wind to 25 km/h, and look at the phone.', 'तेज़ हवा वाली दोपहर: हवा 25 km/h कीजिए, और फ़ोन देखिए।', 'Tez hawa wali dopahar: hawa 25 km/h kijiye, aur phone dekhiye.'),
        see: t3('"Do not spray pesticide today": above 15 km/h the fine spray drifts onto the neighbour\'s crop, the school, the pond.', '"Do not spray pesticide today": 15 km/h से ऊपर बारीक छिड़काव पड़ोसी की फ़सल, स्कूल, तालाब पर उड़ जाता है।', '"Do not spray pesticide today": 15 km/h se upar baareek chhidkaav padosi ki fasal, school, taalaab par ud jaata hai.') },
      { k: 'act', until: (S) => fresh(S) && windNow(S) <= 12 && rainingNow(S) && /Rain: <b>raining/.test(body(S)) && /Do not spray/.test(body(S)) && (S.memRun.wet = true), do: t3('The wind drops to 5 km/h, but it starts to rain: set the wind to 5 and let it rain on the plate.', 'हवा 5 km/h पर आ गई, पर बारिश शुरू हो गई: हवा 5 कीजिए और प्लेट पर बारिश होने दीजिए।', 'Hawa 5 km/h par aa gayi, par baarish shuru ho gayi: hawa 5 kijiye aur plate par baarish hone dijiye.'),
        see: t3('Still "Do not spray": rain washes the spray off the leaves. raining() || kmh > 15 means either one is enough.', 'अब भी "Do not spray": बारिश पत्तियों से दवा धो देती है। raining() || kmh > 15 का मतलब है कि दोनों में से एक ही काफ़ी है।', 'Ab bhi "Do not spray": baarish pattiyon se dawa dho deti hai. raining() || kmh > 15 ka matlab hai ki dono mein se ek hi kaafi hai.') },
      { k: 'act', until: (S) => fresh(S) && S.memRun.wet && !rainingNow(S) && /Good weather to spray/.test(body(S)), do: t3('The sky clears: wipe the plate dry.', 'आसमान साफ़: प्लेट पोंछकर सुखाइए।', 'Aasmaan saaf: plate pochh kar sukhaiye.'),
        see: live((lg, S) => { const v = S ? lastWind(S) : null; return pick(lg, `Your results: wind ${v === null ? '…' : v} km/h, no rain: "Good weather to spray". The panchayat can put this page on the notice-board TV, and IMD's agromet stations give farmers the same advice by SMS.`, `आपके नतीजे: हवा ${v === null ? '…' : v} km/h, बारिश नहीं: "Good weather to spray"। पंचायत यह पेज नोटिस-बोर्ड के टीवी पर लगा सकती है, और IMD के कृषि-मौसम स्टेशन किसानों को यही सलाह SMS से देते हैं।`, `Aapke results: hawa ${v === null ? '…' : v} km/h, baarish nahi: "Good weather to spray". Panchayat yeh page notice-board ke TV par laga sakti hai, aur IMD ke agromet station kisanon ko yahi salah SMS se dete hain.`); }) },
    ],
    check: [(S) => (S.conn('VIN', 'GND') || S.conn('3V3', 'GND') ? [W.short] : null), has('dht', DHTN), has('rn1', RAIN), has('an1', ANEMO),
      (S) => (S.conn('dht.VCC', 'VIN') || S.conn('rn1.VCC', 'VIN') ? [XF.v5] : null),
      need('dht.VCC', '3V3', W.join, { a: t3('The DHT11\'s + pin', 'DHT11 का + पिन', 'DHT11 ka + pin'), b: '3V3' }), need('dht.GND', 'GND', W.toGnd, { x: t3('DHT11\'s − pin', 'DHT11 का − पिन', 'DHT11 ka − pin') }), need('dht.DATA', 'D27', W.toPin, { x: t3('DHT11\'s DATA', 'DHT11 का DATA', 'DHT11 ka DATA'), p: 27 }),
      need('rn1.VCC', '3V3', W.join, { a: t3('The rain sensor\'s VCC', 'रेन सेंसर का VCC', 'Rain sensor ka VCC'), b: '3V3' }), need('rn1.GND', 'GND', W.toGnd, { x: t3('rain sensor\'s GND', 'रेन सेंसर का GND', 'Rain sensor ka GND') }),
      need('rn1.OUT', 'D26', W.toPin, { x: t3('rain sensor\'s OUT', 'रेन सेंसर का OUT', 'Rain sensor ka OUT'), p: 26 }),
      need('an1.A', 'D25', W.toPin, { x: t3('anemometer\'s lead A', 'एनीमोमीटर का तार A', 'Anemometer ka taar A'), p: 25 }), need('an1.B', 'GND', W.toGnd, { x: t3('anemometer\'s lead B', 'एनीमोमीटर का तार B', 'Anemometer ka taar B') })],
    done: (S) => okEdge(S.runSrc) && S.memRun.calm && S.memRun.gust && S.memRun.wet && /Good weather to spray/.test(body(S)) });

  for (const l of L) { l.n = ++n; l.batch = 22; }
  return L;
}
