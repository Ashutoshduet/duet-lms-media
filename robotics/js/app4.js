// DUET Robotics Lab 360, batch 4: the app's side of the new boards. main.js calls install4(app) once; everything else is
// done here, on the app (a few of its methods are wrapped, each marked "batch 4"):
//   the Board list (Free build, and lessons that allow a change) and the board box beside the bench (a tap, a ray in the
//   headset: the board swaps); the camera views of the new boards; the pin popups and the region callouts of each board;
//   the phone and the school WiFi router (ESP32 lessons, and Free build with an ESP32); the ESP32's 3.3 V warnings; the
//   Serial Monitor's speed per lesson; the texts in English, Hindi and Hinglish.
import * as THREE from 'three';
import { BOARDS, holeAt } from './boards.js';
import { VIEWS } from './stage.js';
import { T, tx, t, CPP, REGIONS, SPEC } from './i18n.js';
import { MSG4 } from './lib4.js';
import { SPEC4, PARTS4 } from './parts4.js';
import { pinTitle, pinShort } from './boards4.js';
import { Phone, buildRouter } from './phone4.js';
import { netOf } from './esp32.js';
import { buildBoard4 } from './models4.js';
import * as MD from './models.js';
import { PARTS } from './parts.js';
import { FREE_CODE } from './lessons.js';

const t3 = (en, hi, hg) => ({ en, hi, hg });
const $ = (s) => document.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const store = { get(k) { try { return localStorage.getItem('rl360.' + k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem('rl360.' + k, v); } catch (e) { /* private */ } } };
export const ORDER = ['uno', 'nano', 'mega', 'esp32'];
const BNAME = { uno: 'UNO R3', nano: 'Nano', mega: 'Mega 2560', esp32: 'ESP32 DevKit' };
const PHONE_AT = { x: 182, z: 26 }, ROUTER_AT = { x: 46, z: -116 }, BOX_AT = { x: -128, z: -78 };

// ------------------------------------------------------------------ words
export const T4 = {
  board4: t3('Board', 'बोर्ड', 'Board'),
  boardNow: t3('The {b} is on the bench now.', 'अब बेंच पर {b} है।', 'Ab bench par {b} hai.'),
  boardBox: t3('Other boards: tap one to use it', 'दूसरे बोर्ड: इस्तेमाल के लिए किसी को छूइए', 'Doosre boards: use karne ke liye kisi ko touch karo'),
  holeOf: t3('joined to the {b}\'s pin {p}', '{b} के पिन {p} से जुड़ा', '{b} ke pin {p} se juda'),
  under: t3('under the {b}', '{b} के नीचे', '{b} ke neeche'),
  tPhone: t3('Phone', 'फ़ोन', 'Phone'),
  phoneTip: t3('Tap to bring it close, then tap its screen', 'पास लाने के लिए छूइए, फिर इसकी स्क्रीन छूइए', 'Paas laane ke liye touch karo, phir iski screen touch karo'),
  dist4: t3('Height over the chip', 'चिप से ऊँचाई', 'Chip se oonchai'), flip4: t3('Flip', 'पलटिए', 'Flip'),
};
const REG4 = {
  // Nano
  n_usb: { n: t3('Mini-USB socket', 'मिनी-USB सॉकेट', 'Mini-USB socket'), d: t3('5 V power and your code come in here. A CH340 chip under the board turns USB into the Serial on pins 0 and 1.', '5 V बिजली और आपका कोड यहीं से आते हैं। बोर्ड के नीचे CH340 चिप USB को पिन 0 और 1 के सीरियल में बदलती है।', '5 V power aur aapka code yahin se aate hain. Board ke neeche CH340 chip USB ko pin 0 aur 1 ke Serial mein badalti hai.') },
  n_mcu: { n: t3('ATmega328P (TQFP-32): the brain', 'ATmega328P (TQFP-32): दिमाग़', 'ATmega328P (TQFP-32): dimaag'), d: t3('The same microcontroller as the Uno, in a small flat case with 32 legs: 16 MHz, 32 KB for programs, 2 KB of memory.', 'Uno वाला ही माइक्रोकंट्रोलर, 32 पैरों वाले छोटे चपटे केस में: 16 MHz, प्रोग्राम के लिए 32 KB, 2 KB मेमोरी।', 'Uno wala hi microcontroller, 32 pairon wale chhote chapte case mein: 16 MHz, program ke liye 32 KB, 2 KB memory.') },
  n_reset: { n: t3('RESET button', 'रीसेट बटन', 'RESET button'), d: t3('Press it and the sketch starts again from the top.', 'इसे दबाइए, तो स्केच फिर से शुरू से चलेगा।', 'Ise dabaiye, to sketch phir se shuru se chalega.') },
  n_leds: { n: t3('TX, RX, L and power LEDs', 'TX, RX, L और पावर एलईडी', 'TX, RX, L aur power LEDs'), d: t3('TX and RX flicker with Serial, L is joined to pin 13, PWR is on while the board has power.', 'सीरियल पर TX और RX टिमटिमाती हैं, L पिन 13 से जुड़ी है, PWR बिजली रहने तक जलती है।', 'Serial par TX aur RX timtimaati hain, L pin 13 se judi hai, PWR power rehne tak jalti hai.') },
  n_xtal: { n: t3('16 MHz crystal', '16 MHz क्रिस्टल', '16 MHz crystal'), d: t3('The board\'s clock: 16 million ticks a second.', 'बोर्ड की घड़ी: एक सेकंड में 1.6 करोड़ टिक।', 'Board ki ghadi: ek second mein 1.6 crore tick.') },
  n_back: { n: t3('Back row: D12 … D2, GND, RST, RX0, TX1', 'पीछे की कतार: D12 … D2, GND, RST, RX0, TX1', 'Peeche ki line: D12 … D2, GND, RST, RX0, TX1'), d: t3('Each pin is in its own breadboard column. Wire it from a free hole a–c of that column.', 'हर पिन अपने ब्रेडबोर्ड कॉलम में है। उस कॉलम के ख़ाली छेद a–c से वायर लगाइए।', 'Har pin apne breadboard column mein hai. Us column ke khaali hole a–c se wire lagaiye.') },
  n_front: { n: t3('Front row: D13, 3V3, REF, A0–A7, 5V, RST, GND, VIN', 'आगे की कतार: D13, 3V3, REF, A0–A7, 5V, RST, GND, VIN', 'Aage ki line: D13, 3V3, REF, A0–A7, 5V, RST, GND, VIN'), d: t3('A6 and A7 are analog inputs only. Wire a pin from a free hole i–j of its column.', 'A6 और A7 सिर्फ़ एनालॉग इनपुट हैं। पिन को उसके कॉलम के ख़ाली छेद i–j से जोड़िए।', 'A6 aur A7 sirf analog input hain. Pin ko uske column ke khaali hole i–j se jodiye.') },
  n_icsp: { n: t3('ICSP pads', 'ICSP पैड', 'ICSP pads'), d: t3('Six holes to program the chip without USB. Not needed for now.', 'USB के बिना चिप प्रोग्राम करने के छह छेद। अभी ज़रूरत नहीं।', 'USB ke bina chip program karne ke chhe hole. Abhi zaroorat nahi.') },
  // Mega
  m_usb: { n: t3('USB port', 'USB पोर्ट', 'USB port'), d: t3('Power (5 V), your code and Serial (pins 0 and 1) come in here.', 'बिजली (5 V), आपका कोड और सीरियल (पिन 0 और 1) यहीं से आते हैं।', 'Power (5 V), aapka code aur Serial (pin 0 aur 1) yahin se aate hain.') },
  m_jack: { n: t3('Power jack', 'पावर जैक', 'Power jack'), d: t3('For a 7–12 V adapter or battery: robots with many motors use it.', '7–12 V एडैप्टर या बैटरी के लिए: बहुत सी मोटर वाले रोबोट इसे लेते हैं।', '7–12 V adapter ya battery ke liye: bahut si motors wale robots ise lete hain.') },
  m_mcu: { n: t3('ATmega2560: the brain', 'ATmega2560: दिमाग़', 'ATmega2560: dimaag'), d: t3('100 legs, 16 MHz, 256 KB for programs, 8 KB of memory and 4 KB EEPROM: eight times the Uno.', '100 पैर, 16 MHz, प्रोग्राम के लिए 256 KB, 8 KB मेमोरी और 4 KB EEPROM: Uno से आठ गुना।', '100 pair, 16 MHz, program ke liye 256 KB, 8 KB memory aur 4 KB EEPROM: Uno se aath guna.') },
  m_usbchip: { n: t3('USB chip', 'USB चिप', 'USB chip'), d: t3('Turns the computer\'s USB into Serial for the main chip.', 'कंप्यूटर के USB को मुख्य चिप के सीरियल में बदलती है।', 'Computer ke USB ko main chip ke Serial mein badalti hai.') },
  m_xtal: { n: t3('16 MHz crystal', '16 MHz क्रिस्टल', '16 MHz crystal'), d: t3('The clock: delay(1000) is exactly one second.', 'घड़ी: delay(1000) ठीक एक सेकंड है।', 'Ghadi: delay(1000) theek ek second hai.') },
  m_reset: { n: t3('RESET button', 'रीसेट बटन', 'RESET button'), d: t3('Restarts the sketch from the top.', 'स्केच को शुरू से चलाता है।', 'Sketch ko shuru se chalata hai.') },
  m_pwm: { n: t3('Pins 0–13 (PWM 2–13)', 'पिन 0–13 (PWM 2–13)', 'Pins 0–13 (PWM 2–13)'), d: t3('Where the Uno has them. 0 and 1 are the USB Serial; 2 to 13 can all do analogWrite().', 'Uno वाली जगह पर। 0 और 1 USB सीरियल हैं; 2 से 13 सब analogWrite() कर सकते हैं।', 'Uno wali jagah par. 0 aur 1 USB Serial hain; 2 se 13 sab analogWrite() kar sakte hain.') },
  m_comm: { n: t3('Pins 14–21: COMMUNICATION', 'पिन 14–21: COMMUNICATION', 'Pins 14–21: COMMUNICATION'), d: t3('Three more serial ports (Serial3: 14/15, Serial2: 16/17, Serial1: 18/19) and I2C (SDA 20, SCL 21).', 'तीन और सीरियल पोर्ट (Serial3: 14/15, Serial2: 16/17, Serial1: 18/19) और I2C (SDA 20, SCL 21)।', 'Teen aur serial ports (Serial3: 14/15, Serial2: 16/17, Serial1: 18/19) aur I2C (SDA 20, SCL 21).') },
  m_dbl: { n: t3('Pins 22–53', 'पिन 22–53', 'Pins 22–53'), d: t3('32 more digital pins in two columns (even on the left, odd on the right), 5V at the top, GND at the bottom. 44–46 do PWM; 50–53 are SPI.', 'दो कॉलम में 32 और डिजिटल पिन (बाईं ओर सम, दाईं ओर विषम), ऊपर 5V, नीचे GND। 44–46 PWM करते हैं; 50–53 SPI हैं।', 'Do column mein 32 aur digital pins (left mein even, right mein odd), upar 5V, neeche GND. 44–46 PWM karte hain; 50–53 SPI hain.') },
  m_analog: { n: t3('Analog inputs A0–A15', 'एनालॉग इनपुट A0–A15', 'Analog inputs A0–A15'), d: t3('Sixteen inputs, 0 V to 5 V as 0 to 1023. In code A0 is pin 54 and A15 is pin 69.', 'सोलह इनपुट, 0 V से 5 V को 0 से 1023 में। कोड में A0 यानी पिन 54 और A15 यानी पिन 69।', 'Solah inputs, 0 V se 5 V ko 0 se 1023 mein. Code mein A0 matlab pin 54 aur A15 matlab pin 69.') },
  m_power: { n: t3('Power pins', 'पावर पिन', 'Power pins'), d: t3('5V and 3.3V out, GND (0 V), Vin (the jack\'s voltage), as on the Uno.', 'Uno की तरह 5V और 3.3V बाहर, GND (0 V), Vin (जैक का वोल्टेज)।', 'Uno ki tarah 5V aur 3.3V bahar, GND (0 V), Vin (jack ka voltage).') },
  m_ledL: { n: t3('"L" LED (pin 13)', '"L" एलईडी (पिन 13)', '"L" LED (pin 13)'), d: t3('Joined to pin 13, as on the Uno.', 'Uno की तरह पिन 13 से जुड़ी।', 'Uno ki tarah pin 13 se judi.') },
  // ESP32
  e_wroom: { n: t3('ESP32-WROOM-32 module', 'ESP32-WROOM-32 मॉड्यूल', 'ESP32-WROOM-32 module'), d: t3('Under the metal shield: the ESP32 chip (2 cores, 240 MHz, 520 KB RAM), 4 MB of flash, and the WiFi / Bluetooth radio. The shield stops radio noise.', 'धातु के ढक्कन के नीचे: ESP32 चिप (2 कोर, 240 MHz, 520 KB RAM), 4 MB फ़्लैश, और WiFi / Bluetooth रेडियो। ढक्कन रेडियो की गड़बड़ी रोकता है।', 'Metal cover ke neeche: ESP32 chip (2 core, 240 MHz, 520 KB RAM), 4 MB flash, aur WiFi / Bluetooth radio. Cover radio ki gadbadi rokta hai.') },
  e_ant: { n: t3('PCB antenna', 'PCB एंटीना', 'PCB antenna'), d: t3('The zig-zag copper line sends and receives WiFi and Bluetooth (2.4 GHz). Keep wires and metal away from it.', 'टेढ़ी-मेढ़ी तांबे की लाइन WiFi और Bluetooth (2.4 GHz) भेजती और पकड़ती है। वायर और धातु इससे दूर रखिए।', 'Tedhi-medhi copper line WiFi aur Bluetooth (2.4 GHz) bhejti aur pakadti hai. Wires aur metal isse door rakhiye.') },
  e_usb: { n: t3('Micro-USB socket', 'माइक्रो-USB सॉकेट', 'Micro-USB socket'), d: t3('5 V power, your code, and Serial at 115200 baud.', '5 V बिजली, आपका कोड, और 115200 बॉड पर सीरियल।', '5 V power, aapka code, aur 115200 baud par Serial.'), usb: true },
  e_uart: { n: t3('CP2102: USB to Serial', 'CP2102: USB से सीरियल', 'CP2102: USB se Serial'), d: t3('Translates between the computer\'s USB and the ESP32\'s Serial (GPIO 1 and 3).', 'कंप्यूटर के USB और ESP32 के सीरियल (GPIO 1 और 3) के बीच बात करवाती है।', 'Computer ke USB aur ESP32 ke Serial (GPIO 1 aur 3) ke beech baat karwaati hai.') },
  e_reg: { n: t3('3.3 V regulator (AMS1117)', '3.3 V रेगुलेटर (AMS1117)', '3.3 V regulator (AMS1117)'), d: t3('Turns the USB\'s 5 V into the steady 3.3 V the ESP32 needs. Its output is the 3V3 pin.', 'USB के 5 V को ESP32 के लिए स्थिर 3.3 V में बदलता है। इसका आउटपुट 3V3 पिन है।', 'USB ke 5 V ko ESP32 ke liye steady 3.3 V mein badalta hai. Iska output 3V3 pin hai.') },
  e_en: { n: t3('EN button (reset)', 'EN बटन (रीसेट)', 'EN button (reset)'), d: t3('EN = enable. Press it and the ESP32 restarts: you see its start-up lines at 115200 baud.', 'EN यानी enable। इसे दबाइए तो ESP32 फिर शुरू होता है: 115200 बॉड पर उसकी शुरुआती लाइनें दिखती हैं।', 'EN matlab enable. Ise dabaiye to ESP32 phir shuru hota hai: 115200 baud par uski shuruaati lines dikhti hain.') },
  e_boot: { n: t3('BOOT button (GPIO 0)', 'BOOT बटन (GPIO 0)', 'BOOT button (GPIO 0)'), d: t3('Hold it while an upload starts, if the upload ever fails. In a sketch it is GPIO 0: digitalRead(0) is LOW while it is pressed.', 'कभी अपलोड न हो तो अपलोड शुरू होते समय इसे दबाकर रखिए। स्केच में यह GPIO 0 है: दबा हो तो digitalRead(0) LOW होता है।', 'Kabhi upload na ho to upload shuru hote waqt ise daba kar rakhiye. Sketch mein yeh GPIO 0 hai: daba ho to digitalRead(0) LOW hota hai.') },
  e_led: { n: t3('Blue LED (GPIO 2) and red power LED', 'नीली एलईडी (GPIO 2) और लाल पावर एलईडी', 'Neeli LED (GPIO 2) aur red power LED'), d: t3('LED_BUILTIN is GPIO 2 on this board. The red one is on while there is power.', 'इस बोर्ड पर LED_BUILTIN यानी GPIO 2। लाल वाली बिजली रहने तक जलती है।', 'Is board par LED_BUILTIN matlab GPIO 2. Red wali power rehne tak jalti hai.') },
  e_back: { n: t3('Back row: VIN, GND, GPIO 13 … 39, EN', 'पीछे की कतार: VIN, GND, GPIO 13 … 39, EN', 'Peeche ki line: VIN, GND, GPIO 13 … 39, EN'), d: t3('Wire from the free hole in row a. 32–36 and 39 are ADC1 (they work with WiFi on); 34–39 are input only; VIN is 5 V.', 'पंक्ति a के ख़ाली छेद से वायर लगाइए। 32–36 और 39 ADC1 हैं (WiFi चालू होने पर भी चलते हैं); 34–39 सिर्फ़ इनपुट हैं; VIN 5 V है।', 'Row a ke khaali hole se wire lagaiye. 32–36 aur 39 ADC1 hain (WiFi on hone par bhi chalte hain); 34–39 sirf input hain; VIN 5 V hai.') },
  e_front: { n: t3('Front row: 3V3, GND, GPIO 15 … 23', 'आगे की कतार: 3V3, GND, GPIO 15 … 23', 'Aage ki line: 3V3, GND, GPIO 15 … 23'), d: t3('Wire from the free hole in row j. RX0/TX0 (GPIO 3/1) are the USB Serial; RX2/TX2 (16/17) are Serial2; 21 is SDA, 22 is SCL.', 'पंक्ति j के ख़ाली छेद से वायर लगाइए। RX0/TX0 (GPIO 3/1) USB सीरियल हैं; RX2/TX2 (16/17) Serial2; 21 SDA, 22 SCL।', 'Row j ke khaali hole se wire lagaiye. RX0/TX0 (GPIO 3/1) USB Serial hain; RX2/TX2 (16/17) Serial2; 21 SDA, 22 SCL.') },
};
// starter sketches for Free build, per board
export const STARTER = { // (batch 6: app6.js adds the Python starters of the Pico and the Pi 4)
  nano: '// Free build on the Nano: write your own sketch\nvoid setup() {\n  pinMode(13, OUTPUT);\n  Serial.begin(9600);\n}\n\nvoid loop() {\n  digitalWrite(13, HIGH);\n  delay(500);\n  digitalWrite(13, LOW);\n  delay(500);\n}\n',
  mega: '// Free build on the Mega 2560: 54 pins, Serial1-3\nvoid setup() {\n  pinMode(13, OUTPUT);\n  Serial.begin(9600);\n}\n\nvoid loop() {\n  digitalWrite(13, HIGH);\n  delay(500);\n  digitalWrite(13, LOW);\n  delay(500);\n}\n',
  esp32: '// Free build on the ESP32: 3.3 V pins, WiFi, Bluetooth\nvoid setup() {\n  pinMode(LED_BUILTIN, OUTPUT);   // GPIO 2\n  Serial.begin(115200);\n}\n\nvoid loop() {\n  digitalWrite(LED_BUILTIN, HIGH);\n  delay(500);\n  digitalWrite(LED_BUILTIN, LOW);\n  delay(500);\n}\n',
};

export function install4(app) {
  Object.assign(CPP, MSG4); Object.assign(REGIONS, REG4); Object.assign(T, T4); Object.assign(SPEC, SPEC4); void PARTS4;
  Object.assign(VIEWS, {
    mega4: { tgt: [-62, 0, 2], hw: 118, hd: 46, dir: [0, 0.72, 0.7] },
    esp4: { tgt: [68, 16, -6], hw: 150, hd: 82, dir: [0, 0.74, 0.67] },
    swap4: { tgt: [-34, 0, -14], hw: 152, hd: 70, dir: [0, 0.78, 0.62] },
    phone4: { tgt: [PHONE_AT.x, 80, PHONE_AT.z - 14], hw: 60, hd: 220, dir: [-0.12, 0.34, 0.93] }, // (hd: the upright phone, 160 mm tall, fits up and down)
  });
  const UNOVIEW = Object.assign({}, VIEWS.board);
  const lab = app.lab, view = app.view, stage = app.stage;
  const X = { phone: null, router: null, box: null, boxFor: '' };
  app.x4 = X;

  // ------------------------------------------------------------ the board on the bench
  const boardView = () => {
    const d = lab.def; if (d.id === 'uno') { VIEWS.board = Object.assign({}, UNOVIEW); return; }
    const r = d.regions; const cx = r.reduce((s, q) => s + q.at[0], 0) / r.length * 0.3;
    VIEWS.board = { tgt: [lab.board.x + cx, d.bb ? 12 : 6, lab.board.z], hw: d.view.hw, hd: d.view.hd, dir: [0.1, 0.74, 0.66] };
  };
  lab.on((type, d) => {
    if (type === 'board') { boardView(); renderPicker(); placeExtras(); }
    if (type === 'warn') { const a = {}; for (const [k, v] of Object.entries(d.args || {})) a[k] = typeof v === 'object' ? tx(v) : v; app.toast(tx(d.msg, a), 'bad', 8000); }
  });
  app.switchBoard = (id, quiet) => {
    if (!BOARDS[id] || lab.def.id === id) return false;
    const freeCode = app.mode === 'free' && [FREE_CODE, ...Object.values(STARTER)].includes(app.editor.value);
    lab.setBoard(id); if (app.mode === 'free') { store.set('board4', id); if (freeCode) app.editor.value = id === 'uno' ? FREE_CODE : STARTER[id]; }
    app.closeCallout(); app.renderStatus(); app.stage.kick();
    if (!quiet) app.toast(tx(T4.boardNow, { b: lab.def.short }));
    return true;
  };

  // ------------------------------------------------------------ the Board list (in the parts drawer)
  const st = document.createElement('style');
  st.textContent = '#board4{display:none;align-items:center;gap:6px;margin:0 6px 8px;font-size:12px;color:var(--mute)}#board4.show{display:flex}#board4 select{flex:1;min-width:0;font:inherit;font-weight:700;color:inherit;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.18);border-radius:8px;padding:4px 6px}#board4 select option{color:#111}';
  document.head.appendChild(st);
  const pk = document.createElement('div'); pk.id = 'board4'; pk.innerHTML = '<label for="board4s"></label><select id="board4s"></select>';
  const drawer = $('#drawer'); if (drawer) drawer.insertBefore(pk, $('#plist'));
  const sel = pk.querySelector('select'); sel.onchange = () => app.switchBoard(sel.value);
  // a toolbar button that brings the phone close (shown while the phone is on the bench)
  const pb = document.createElement('button'); pb.className = 'tb'; pb.style.display = 'none'; pb.innerHTML = '📱 <span class="tl"></span>';
  const rb = document.querySelector('#bar [data-view="robot"]'); if (rb) rb.after(pb); else { const bar = $('#bar'); if (bar) bar.appendChild(pb); }
  pb.onclick = () => { stage.userMoved = false; stage.setView('phone4'); };
  const allowed = () => { const Ls = app.mode === 'lesson' && app.rt.lesson; if (Ls) return Ls.boards || null; return ORDER; };
  function renderPicker() {
    const list = allowed(); pk.classList.toggle('show', !!list && list.length > 1);
    pk.querySelector('label').textContent = t('board4'); pb.querySelector('.tl').textContent = t('tPhone');
    if (list) sel.innerHTML = list.map((id) => `<option value="${id}"${id === lab.def.id ? ' selected' : ''}>${esc(BNAME[id] || BOARDS[id].short)}</option>`).join('');
  }

  // ------------------------------------------------------------ the phone, the router and the board box
  function show(obj, on, pickMeshes) {
    if (!obj) return; const has = obj.parent === stage.root;
    if (on && !has) stage.root.add(obj); if (!on && has) stage.root.remove(obj);
    for (const m of pickMeshes || []) { const i = view.pickExtra.indexOf(m); if (on && i < 0) view.pickExtra.push(m); if (!on && i >= 0) view.pickExtra.splice(i, 1); }
    stage.kick();
  }
  function wantPhone() { const Ls = app.mode === 'lesson' && app.rt.lesson; return Ls ? !!Ls.phone : lab.def.id === 'esp32'; }
  function placeExtras() {
    const ph = wantPhone();
    if (ph && !X.phone) { X.phone = new Phone(app, (o, a) => tx(o, a)); X.phone.obj.position.set(PHONE_AT.x, 0, PHONE_AT.z); X.router = buildRouter(); X.router.position.set(ROUTER_AT.x, 0, ROUTER_AT.z); X.router.rotation.y = 0.12; X.phone.obj.rotation.y = -0.22; }
    if (X.phone) { show(X.phone.obj, ph, [X.phone.screen]); show(X.router, ph); }
    pb.style.display = ph ? '' : 'none';
    // the board box: the boards this lesson (or Free build) can swap to
    const list = (allowed() || []).filter((id) => id !== lab.def.id); const key = list.join(',');
    if (key !== X.boxFor) { if (X.box) { show(X.box, false, X.box.userData.picks); } X.box = list.length ? buildBox(list) : null; X.boxFor = key; }
    if (X.box) show(X.box, true, X.box.userData.picks);
  }
  const boxModels = {};
  function buildBox(list) {
    const g = new THREE.Group(); g.position.set(BOX_AT.x, 0, BOX_AT.z); g.name = 'box4'; const picks = [];
    const foam = new THREE.MeshStandardMaterial({ color: 0x3a3d44, roughness: 0.95 }), card = new THREE.MeshStandardMaterial({ color: 0xb08a5c, roughness: 0.85 });
    const sizes = { uno: 68.6 * 0.62, nano: 43.2 * 0.62, mega: 101.6 * 0.62, esp32: 51.5 * 0.62 }; for (const id of list) sizes[id] = sizes[id] || BOARDS[id].size[0] * 0.62; const total = list.reduce((s, id) => s + sizes[id] + 10, 10); // (batch 6: any other board by its size)
    g.add(MD.box(total + 8, 6, 52, card, 0, 3, 0)); g.add(MD.box(total, 1.2, 46, foam, 0, 6.4, 0));
    let x = -total / 2 + 10;
    for (const id of list) {
      const w = sizes[id]; const m = boxModels[id] || (boxModels[id] = id === 'uno' ? MD.buildUno() : buildBoard4(BOARDS[id]));
      const holder = new THREE.Group(); holder.scale.setScalar(0.62); holder.position.set(x + w / 2, 7 - (BOARDS[id].bb ? BOARDS[id].pcbY - 3 : 0) * 0.62, -2); holder.add(m); g.add(holder);
      const C = document.createElement('canvas'); C.width = 256; C.height = 64; const c = C.getContext('2d'); c.fillStyle = '#f1f3f5'; c.fillRect(0, 0, 256, 64); c.fillStyle = '#212529'; c.font = `800 34px ${'"Noto Sans Devanagari", Arial, sans-serif'}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(BOARDS[id].short, 128, 34);
      const lt = new THREE.CanvasTexture(C); lt.colorSpace = THREE.SRGBColorSpace; const lab0 = new THREE.Mesh(new THREE.PlaneGeometry(26, 6.5), new THREE.MeshStandardMaterial({ map: lt, roughness: 0.6 })); lab0.rotation.x = -Math.PI / 2; lab0.position.set(x + w / 2, 6.3 + 0.2, 20.5); g.add(lab0);
      const p = MD.box(w + 6, 16, 44, new THREE.MeshBasicMaterial({ visible: false }), x + w / 2, 10, 0); p.userData.region = 'swap:' + id; g.add(p); picks.push(p);
      x += w + 10;
    }
    g.traverse((o) => { if (o.isMesh && o.material && o.material.visible !== false) { o.castShadow = true; o.receiveShadow = true; } });
    g.userData.picks = picks; return g;
  }

  // ------------------------------------------------------------ wrapped app methods (batch 4)
  const W = (name, f) => { const o = app[name].bind(app); app[name] = (...a) => f(o, ...a); };
  W('openLesson', (o, id, quiet) => { const r = o(id, quiet); const Ls = app.rt.lesson; if (X.phone) X.phone.reset(); const b = $('#ser-baud'); if (b && Ls) b.value = String(Ls.baud || 9600); boardView(); renderPicker(); placeExtras(); return r; });
  W('openFree', (o) => { const r = o(); const want = store.get('board4'); if (want && BOARDS[want] && want !== lab.def.id) app.switchBoard(want, true); else if (!want && lab.def.id !== 'uno') app.switchBoard('uno', true); const b = $('#ser-baud'); if (b) b.value = lab.def.id === 'esp32' ? '115200' : '9600'; boardView(); renderPicker(); placeExtras(); return r; });
  W('renderAll', (o) => { o(); renderPicker(); if (X.phone) X.phone.dirty = true; });
  W('tapRegion', (o, id) => {
    if (id.startsWith('phone@')) { // the first tap brings the phone close (on a screen); then taps work its apps
      if (!stage.renderer.xr.isPresenting && stage.viewName !== 'phone4' && !(window.robo4 && window.robo4.direct)) { stage.userMoved = false; stage.setView('phone4'); return; }
      const [u, v] = id.slice(6).split(',').map(Number); if (X.phone) { X.phone.tap(u, v); if (X.phone.kb && !stage.renderer.xr.isPresenting) kbFocus(); } return;
    }
    if (id.startsWith('swap:')) { app.switchBoard(id.slice(5)); app.rt.taps.add(id); app.renderCard(); return; }
    o(id); const reg = lab.def.regions && lab.def.regions.find((r) => r.id === id); if (reg && reg.reset && id !== 'reset') app.resetBoard();
  });
  W('down', (o, e) => { // the phone and the board box answer a tap before the holes and pins behind them
    if (!(window.DuetGate && DuetGate.active) && !(e.pointerType === 'mouse' && e.button !== 0) && !(e.pointerType === 'touch' && app.touches && app.touches.size >= 1)) {
      const hit = view.pickObject(app.ndc(e.clientX, e.clientY));
      if (hit && hit.kind === 'region' && /^(phone@|swap:)/.test(hit.id)) { app.sound.unlock(); app.lastXY = { x: e.clientX, y: e.clientY }; app.drag = { kind: 'region', id: hit.id, x: e.clientX, y: e.clientY }; app.block(e); return; }
    }
    return o(e);
  });
  W('pinInfo', (o, pin) => { const r = o(pin); if (lab.def.id !== 'uno') r.name = pinTitle(lab.def, pin, tx); return r; });
  W('epName', (o, ep) => { if (ep.startsWith('B:') && lab.def.id !== 'uno') { const p = lab.def.pins.find((q) => q.id === ep.slice(2)); if (p) return pinShort(lab.def, p); } return o(ep); });
  W('partLive', (o, p) => (PARTS[p.type] && PARTS[p.type].live ? PARTS[p.type].live(p, lab) : o(p)));
  W('controlsFor', (o, p) => {
    const def = PARTS[p.type]; if (!def || !def.controls) return o(p);
    const R = (id, label, min, max, val, step = 1) => `<div class="row"><label>${esc(label)}</label><input type="range" id="${id}" min="${min}" max="${max}" step="${step}" value="${val}"><span id="${id}-v"></span></div>`;
    return def.controls(p, t, R);
  });
  W('bindControls', (o, el) => { o(el); const p = app.sel && app.sel.part; if (p && PARTS[p.type] && PARTS[p.type].bind) PARTS[p.type].bind(p, el, app); });
  W('renderCallout', (o) => { // a new board's region: its pins (with their voltages), its specs, its USB / reset
    o(); const s = app.sel; if (!s || !s.region || lab.def.id === 'uno') return;
    const reg = lab.def.regions.find((r) => r.id === s.region); const el = $('#callout'); if (!reg || !el.classList.contains('show')) return;
    let h = '';
    if (reg.pins) h += `<div class="pins">${lab.def.pins.filter((p) => reg.hdrs.includes(p.hdr) && p.net !== 'NC').map((p) => `<div>${esc(pinTitle(lab.def, p, tx))}<span data-ep="B:${p.id}"></span></div>`).join('')}</div>`;
    if (reg.specs) h += `<h4>${esc(t('specs'))}</h4><table>${lab.def.specs.map(([k, v]) => `<tr><td>${esc(tx(SPEC[k] || { en: k }))}</td><td>${esc(v)}</td></tr>`).join('')}</table>`;
    if (reg.usb) h += `<div class="row"><label>${esc(t('usb'))}</label><button class="btn${lab.board.usb ? ' on' : ''}" id="co-usb4">${esc(lab.board.usb ? t('plugged') : t('unplugged'))}</button></div>`;
    if (reg.reset) h += `<div class="row"><button class="btn" id="co-reset4">⟲ ${esc(t('reset'))}</button></div>`;
    if (!h) return; el.insertAdjacentHTML('beforeend', h); app.fitCallout();
    const u = el.querySelector('#co-usb4'); if (u) u.onclick = () => { lab.board.usb = !lab.board.usb; if (lab.board.usb && lab.mcu.prog) lab.mcu.start(); lab.emit('power', lab.board.usb); app.renderCallout(); app.renderStatus(); };
    const rs = el.querySelector('#co-reset4'); if (rs) rs.onclick = () => app.resetBoard();
    app.liveCallout();
  });
  W('showTip', (o, xy) => { // a hole a Nano / ESP32 pin sits in, or covers: say so
    const hp = app.hoverPart, rg = hp && !app.hoverEp && typeof hp.region === 'string' ? hp.region : '';
    if (rg && !REGIONS[rg]) { // the board box or the phone: their own short tip
      const tip = $('#tip'); let h = '';
      if (rg.startsWith('swap:')) { const id = rg.slice(5); h = `<b>${esc(BNAME[id] || id)}</b><span>${esc(t('boardBox'))}</span>`; }
      else if (rg.startsWith('phone@')) h = `<b>${esc(t('tPhone'))}</b><span>${esc(t('phoneTip'))}</span>`;
      if (!h) { app.hideTip(); return; }
      tip.innerHTML = h; tip.classList.add('show');
      const r = tip.getBoundingClientRect(); let x = xy.x + 16, y = xy.y + 16; if (x + r.width > innerWidth - 8) x = xy.x - r.width - 12; if (y + r.height > innerHeight - 8) y = xy.y - r.height - 12;
      tip.style.left = x + 'px'; tip.style.top = y + 'px'; return;
    }
    o(xy); const ep = app.hoverEp; if (!ep || !ep.startsWith('H:') || !lab.def.bb) return;
    const m = lab.bbMap(); const h = ep.slice(2); const tip = $('#tip'); if (!tip.classList.contains('show')) return;
    const hh = holeAt(h); let pid = m.at.get(h) || null;
    if (!pid && hh && !hh.rail) { const f = [...m.pin].find(([, hole]) => holeAt(hole).strip === hh.strip); if (f) pid = f[0]; }
    let line = ''; if (pid) { const p = lab.def.pins.find((q) => q.id === pid); line = tx(T4.holeOf, { b: lab.def.short, p: pinShort(lab.def, p) }) + ' · ' + pinTitle(lab.def, p, tx); } else if (m.cover.has(h)) line = tx(T4.under, { b: lab.def.short });
    if (line) { const sp = document.createElement('span'); sp.textContent = line; sp.className = 'b4'; tip.insertBefore(sp, tip.children[1] || null); }
  });
  // typing on the phone: on a screen, the computer's keys or the tablet's own keyboard type into it (the small keys on the
  // 3D phone work too, and are what a headset uses)
  const kin = document.createElement('input'); kin.id = 'phone4in'; kin.type = 'text'; kin.autocomplete = 'off'; kin.spellcheck = false;
  kin.setAttribute('autocapitalize', 'none'); kin.setAttribute('autocorrect', 'off'); kin.setAttribute('aria-label', 'phone keyboard');
  kin.style.cssText = 'position:fixed;left:0;bottom:0;width:2px;height:2px;opacity:0;border:0;padding:0;margin:0;font-size:16px;z-index:-1';
  document.body.appendChild(kin);
  function kbFocus() { kin.value = ' '; try { kin.focus({ preventScroll: true }); kin.setSelectionRange(1, 1); } catch (e) { /* old browser */ } }
  kin.addEventListener('keydown', (e) => {
    const P = X.phone; if (!P || !P.kb) { kin.blur(); return; }
    let k = null; if (e.key === 'Enter') k = 'Go'; else if (e.key === 'Backspace') k = '⌫'; else if (e.key === 'Escape') { P.kb = null; P.dirty = true; kin.blur(); } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) k = e.key === ' ' ? 'space' : e.key;
    if (k || e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); }
    if (k) { P.key(k); if (k === 'Go') kin.blur(); stage.kick(); }
  });
  kin.addEventListener('input', () => { // soft keyboards that send no key names (Android): read what changed
    const P = X.phone, v = kin.value; kin.value = ' '; if (!P || !P.kb) return;
    if (!v.length) P.key('⌫'); else for (const ch of v.slice(1)) P.key(ch === ' ' ? 'space' : ch);
    stage.kick();
  });
  W('frame', (o, dt) => {
    o(dt);
    if (document.activeElement === kin && !(X.phone && X.phone.kb)) kin.blur();
    if (X.phone && X.phone.obj.parent) { X.phone.update(dt); }
    if (X.router && X.router.parent) { const L = X.router.userData.leds, tt = performance.now() / 1000; const on = Math.floor(tt * 7 + Math.sin(tt * 3) * 2) % 3 !== 0; if (L[1].emissiveIntensity !== (on ? 1.6 : 0.2)) { L[1].emissiveIntensity = on ? 1.6 : 0.2; stage.kick(); } }
  });

  // ------------------------------------------------------------ test hooks (devtools/test/robotest4.mjs)
  window.robo4 = {
    board: () => lab.def.id,
    switch: (id) => app.switchBoard(id),
    regionScreen(id) { const r = lab.def.regions.find((q) => q.id === id); if (!r) return null; const top = (lab.def.pcbY || 3) + 1.6; return stage.toScreen([lab.board.x + r.at[0], top + r.h * 0.8, lab.board.z + r.at[1]]); },
    boxScreen(id) { if (!X.box) return null; const p = X.box.userData.picks.find((q) => q.userData.region === 'swap:' + id); if (!p) return null; const v = new THREE.Vector3(); p.getWorldPosition(v); stage.root.updateMatrixWorld(true); const inv = new THREE.Matrix4().copy(stage.root.matrixWorld).invert(); v.applyMatrix4(inv); return stage.toScreen([v.x, v.y, v.z]); },
    phone: () => X.phone && { app: X.phone.appId, url: X.phone.url, page: X.phone.page && { title: X.phone.page.title, code: X.phone.page.code, h: X.phone.page.h, links: X.phone.page.hits.map((h) => h.act) }, err: X.phone.err, kb: !!X.phone.kb, kbText: X.phone.kb ? X.phone.kb.text : null, items: X.phone.items.map((i) => i.id).filter(Boolean), net: { wifi: netOf(lab).phone.wifi, ip: netOf(lab).staIP(), bt: netOf(lab).bt.conn, pages: netOf(lab).seen.pages } },
    // the screen point of a phone item (its id), so a test taps it as a student would
    phoneItem(id) { const P = X.phone; if (!P) return null; P.draw(true); const it = P.items.find((q) => q.id === id); if (!it) return null; const u = (it.x + it.w / 2) / 540, v = 1 - (it.y + it.h / 2) / 1152; const s = P.screen; const g = s.geometry.parameters; const pt = new THREE.Vector3((u - 0.5) * g.width, (v - 0.5) * g.height, 0.2); s.updateMatrixWorld(true); pt.applyMatrix4(s.matrixWorld); stage.root.updateMatrixWorld(true); pt.applyMatrix4(new THREE.Matrix4().copy(stage.root.matrixWorld).invert()); return stage.toScreen([pt.x, pt.y, pt.z]); },
    roleCenter(tag, role) { // the middle of a part's handle (robo.roleScreen gives its top), as a finger would take it
      const p = lab.byTag(tag); const e = p && app.view.parts.get(p.uid); if (!e) return null; let o = null; e.obj.traverse((q) => { if (q.userData.role === role) o = q; }); if (!o) return null;
      const c = new THREE.Box3().setFromObject(o).getCenter(new THREE.Vector3()); stage.root.updateMatrixWorld(true); c.applyMatrix4(new THREE.Matrix4().copy(stage.root.matrixWorld).invert()); return stage.toScreen([c.x, c.y, c.z]);
    },
    roleCenterWorld(tag, role) { const p = lab.byTag(tag); const e = p && app.view.parts.get(p.uid); if (!e) return null; let o = null; e.obj.traverse((q) => { if (q.userData.role === role) o = q; }); return o ? new THREE.Box3().setFromObject(o).getCenter(new THREE.Vector3()).toArray() : null; },
    phoneWorld(id) { const P = X.phone; if (!P) return null; P.draw(true); const it = P.items.find((q) => q.id === id); if (!it) return null; const u = (it.x + it.w / 2) / 540, v = 1 - (it.y + it.h / 2) / 1152; const s = P.screen; const g = s.geometry.parameters; const pt = new THREE.Vector3((u - 0.5) * g.width, (v - 0.5) * g.height, 0.2); s.updateMatrixWorld(true); return pt.applyMatrix4(s.matrixWorld).toArray(); },
    boxWorld(id) { if (!X.box) return null; const p = X.box.userData.picks.find((q) => q.userData.region === 'swap:' + id); if (!p) return null; const v = new THREE.Vector3(); p.updateMatrixWorld(true); p.getWorldPosition(v); return v.toArray(); },
    net: () => { const N = netOf(lab); return { ip: N.staIP(), pages: N.seen.pages, paths: N.seen.paths || {}, bt: N.bt.conn, got: N.bt.got || 0 }; },
    go: (path) => { const N = netOf(lab); if (X.phone && N.staIP()) X.phone.go(N.staIP() + (path || '/')); }, // (batch 22) the phone's browser opens a page of the board
  };
  boardView(); renderPicker();
}
