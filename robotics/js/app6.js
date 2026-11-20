// DUET Robotics Lab 360, batch 6: the app's side of the Raspberry Pi boards. main.js calls install6(app) once (after
// install4 and install3); everything else is done here, on the app:
//   the Python editor (colours, indents) and the Shell / Terminal while a Pico or a Pi 4 is on the bench; the Board list
//   (Free build) with their Python starters; the camera view of the Pi with its screen; the region callouts and the specs
//   in English, Hindi and Hinglish; the Pi's little screen showing its terminal; the test hooks (robotest6.mjs).
import { VIEWS } from './stage.js';
import { T, tx, t, REGIONS, SPEC } from './i18n.js';
import { ORDER, STARTER } from './app4.js';
import { highlight as pyHighlight } from './py.js';
import { drawFigure } from './pi20.js'; // (batch 20: the Pi's files and its matplotlib window)

const t3 = (en, hi, hg) => ({ en, hi, hg });
const $ = (s) => document.querySelector(s);
const PY6 = { hl: (s) => pyHighlight(s), open: /:\s*(#.*)?$/, ind: '    ', label: 'Python code' };

export const T6 = {
  shell6: t3('Shell (MicroPython)', 'Shell (MicroPython)', 'Shell (MicroPython)'),
  term6: t3('Terminal', 'टर्मिनल', 'Terminal'),
  empty6: t3('What your program prints with print() shows here.', 'आपका प्रोग्राम print() से जो लिखता है, वह यहाँ दिखता है।', 'Aapka program print() se jo likhta hai, woh yahan dikhta hai.'),
  send6: t3('Type here for input(), then Send', 'input() के लिए यहाँ लिखिए, फिर भेजिए', 'input() ke liye yahan likhiye, phir Send'),
  files20: t3('Files on the Pi', 'Pi पर फ़ाइलें', 'Pi par files'), fig20: t3('Figure', 'चित्र', 'Figure'), close20: t3('Close', 'बंद', 'Band'),
  lines20: t3('lines', 'पंक्तियाँ', 'lines'), empty20: t3('(empty file)', '(ख़ाली फ़ाइल)', '(khaali file)'),
};
export const SPEC6 = {
  pwm6: t3('PWM', 'PWM', 'PWM'), lang6: t3('Languages', 'भाषाएँ', 'Languages'), cpu6: t3('Processor', 'प्रोसेसर', 'Processor'), ram6: t3('RAM', 'रैम', 'RAM'),
  net6: t3('Network', 'नेटवर्क', 'Network'), video6: t3('Screens', 'स्क्रीन', 'Screens'), os6: t3('Operating system', 'ऑपरेटिंग सिस्टम', 'Operating system'), vin6: t3('Power in', 'बिजली इनपुट', 'Power input'),
};
const REG6 = {
  // Pico
  p_rp2040: { n: t3('RP2040: the brain', 'RP2040: दिमाग़', 'RP2040: dimaag'), d: t3('A microcontroller made by Raspberry Pi: two cores at 133 MHz and 264 KB of memory. MicroPython runs on it, and your program with it.', 'Raspberry Pi का बनाया माइक्रोकंट्रोलर: 133 MHz के दो कोर और 264 KB मेमोरी। इस पर MicroPython चलता है, और उसके साथ आपका प्रोग्राम।', 'Raspberry Pi ka banaya microcontroller: 133 MHz ke do core aur 264 KB memory. Is par MicroPython chalta hai, aur uske saath aapka program.') },
  p_usb: { n: t3('Micro-USB socket', 'माइक्रो-USB सॉकेट', 'Micro-USB socket'), d: t3('5 V power from the computer (it is VBUS, pin 40), and the link to Thonny: your program goes in, print() comes out in the Shell.', 'कंप्यूटर से 5 V बिजली (यही VBUS, पिन 40 है), और Thonny से जुड़ाव: आपका प्रोग्राम अंदर जाता है, print() Shell में बाहर आता है।', 'Computer se 5 V power (yahi VBUS, pin 40 hai), aur Thonny se link: aapka program andar jaata hai, print() Shell mein bahar aata hai.') },
  p_bootsel: { n: t3('BOOTSEL button', 'BOOTSEL बटन', 'BOOTSEL button'), d: t3('Hold it while you plug in the USB: the Pico shows up as a drive called RPI-RP2. Copy the MicroPython .uf2 file onto it once, and it is ready for Thonny.', 'USB लगाते समय इसे दबाए रखिए: Pico, RPI-RP2 नाम की ड्राइव बनकर दिखता है। एक बार उस पर MicroPython की .uf2 फ़ाइल कॉपी कीजिए, फिर यह Thonny के लिए तैयार है।', 'USB lagate waqt ise dabaye rakhiye: Pico, RPI-RP2 naam ki drive bankar dikhta hai. Ek baar uspar MicroPython ki .uf2 file copy kijiye, phir yeh Thonny ke liye ready hai.') },
  p_led: { n: t3('The green LED (GP25)', 'हरी एलईडी (GP25)', 'Green LED (GP25)'), d: t3('Joined to GP25 inside the board. In MicroPython: Pin("LED", Pin.OUT).', 'बोर्ड के अंदर GP25 से जुड़ी। MicroPython में: Pin("LED", Pin.OUT)।', 'Board ke andar GP25 se judi. MicroPython mein: Pin("LED", Pin.OUT).') },
  p_flash: { n: t3('Flash memory (2 MB)', 'फ़्लैश मेमोरी (2 MB)', 'Flash memory (2 MB)'), d: t3('Keeps MicroPython and your files (main.py) even when the power is off.', 'बिजली बंद होने पर भी MicroPython और आपकी फ़ाइलें (main.py) सँभालकर रखती है।', 'Power off hone par bhi MicroPython aur aapki files (main.py) sambhal kar rakhti hai.') },
  p_xtal: { n: t3('12 MHz crystal', '12 MHz क्रिस्टल', '12 MHz crystal'), d: t3('The clock. The RP2040 multiplies it up to 133 MHz, so time.sleep(1) is one second.', 'घड़ी। RP2040 इसे 133 MHz तक बढ़ाता है, इसलिए time.sleep(1) ठीक एक सेकंड है।', 'Ghadi. RP2040 ise 133 MHz tak badhata hai, isliye time.sleep(1) theek ek second hai.') },
  p_smps: { n: t3('Power supply (buck-boost)', 'पावर सप्लाई (बक-बूस्ट)', 'Power supply (buck-boost)'), d: t3('Makes a steady 3.3 V from anything between 1.8 and 5.5 V on VSYS: USB or a few AA cells.', 'VSYS पर 1.8 से 5.5 V तक, कुछ भी हो, उससे स्थिर 3.3 V बनाती है: USB या कुछ AA सेल।', 'VSYS par 1.8 se 5.5 V tak, kuch bhi ho, usse steady 3.3 V banati hai: USB ya kuch AA cells.') },
  p_debug: { n: t3('Debug pins (SWD)', 'डीबग पिन (SWD)', 'Debug pins (SWD)'), d: t3('For a debugger, to look inside the chip while it runs. Not needed for now.', 'डीबगर के लिए, चलते समय चिप के अंदर देखने को। अभी ज़रूरत नहीं।', 'Debugger ke liye, chalte waqt chip ke andar dekhne ko. Abhi zaroorat nahi.') },
  p_front: { n: t3('Front row: pins 1–20 (GP0 … GP15, GND)', 'आगे की कतार: पिन 1–20 (GP0 … GP15, GND)', 'Aage ki line: pin 1–20 (GP0 … GP15, GND)'), d: t3('Each pin is in its own breadboard column; wire it from a free hole in rows i–j. In code you use the GP number: Pin(15) is GP15, which is pin 20. Every pin is 3.3 V: never 5 V into one.', 'हर पिन अपने ब्रेडबोर्ड कॉलम में है; उसे पंक्ति i–j के ख़ाली छेद से जोड़िए। कोड में GP नंबर लिखते हैं: Pin(15) यानी GP15, जो पिन 20 है। हर पिन 3.3 V का है: इनमें कभी 5 V मत डालिए।', 'Har pin apne breadboard column mein hai; use row i–j ke khaali hole se jodiye. Code mein GP number likhte hain: Pin(15) matlab GP15, jo pin 20 hai. Har pin 3.3 V ka hai: inmein kabhi 5 V mat daaliye.') },
  p_back: { n: t3('Back row: pins 21–40 (power, ADC, GP16 … GP28)', 'पीछे की कतार: पिन 21–40 (बिजली, ADC, GP16 … GP28)', 'Peeche ki line: pin 21–40 (power, ADC, GP16 … GP28)'), d: t3('VBUS (5 V from the USB), VSYS, 3V3(OUT) for sensors, and GP26–GP28, the three pins with an ADC. Wire from a free hole in rows a–b.', 'VBUS (USB से 5 V), VSYS, सेंसर के लिए 3V3(OUT), और GP26–GP28, ADC वाले तीन पिन। पंक्ति a–b के ख़ाली छेद से वायर लगाइए।', 'VBUS (USB se 5 V), VSYS, sensors ke liye 3V3(OUT), aur GP26–GP28, ADC wale teen pin. Row a–b ke khaali hole se wire lagaiye.') },
  // Pi 4
  q_soc: { n: t3('BCM2711: the processor', 'BCM2711: प्रोसेसर', 'BCM2711: processor'), d: t3('Four 64-bit cores at 1.8 GHz under a metal lid: a whole computer that runs Linux (Raspberry Pi OS), a browser, and Python.', 'धातु के ढक्कन के नीचे 1.8 GHz के चार 64-बिट कोर: एक पूरा कंप्यूटर जो Linux (Raspberry Pi OS), ब्राउज़र और Python चलाता है।', 'Metal cover ke neeche 1.8 GHz ke chaar 64-bit core: ek poora computer jo Linux (Raspberry Pi OS), browser aur Python chalata hai.') },
  q_ram: { n: t3('RAM (LPDDR4)', 'रैम (LPDDR4)', 'RAM (LPDDR4)'), d: t3('1 to 8 GB of working memory, like a laptop\'s. The Pico has 264 KB: thousands of times less.', 'लैपटॉप की तरह 1 से 8 GB काम की मेमोरी। Pico में 264 KB है: हज़ारों गुना कम।', 'Laptop ki tarah 1 se 8 GB kaam ki memory. Pico mein 264 KB hai: hazaaron guna kam.') },
  q_header: { n: t3('The 40-pin header (J8)', '40-पिन हेडर (J8)', '40-pin header (J8)'), d: t3('Pin 1 (3.3 V) is the square pad at the back. Odd pins on the inner row, even pins on the edge. 26 of them are GPIO; gpiozero uses GPIO numbers, not pin numbers: GPIO 17 is pin 11. 3.3 V logic: never put 5 V into a GPIO. The card beside it shows every pin.', 'पिन 1 (3.3 V) पीछे वाला चौकोर पैड है। विषम पिन अंदर की कतार में, सम पिन किनारे पर। इनमें 26 GPIO हैं; gpiozero GPIO नंबर लेता है, पिन नंबर नहीं: GPIO 17 यानी पिन 11। 3.3 V लॉजिक: किसी GPIO में कभी 5 V मत डालिए। बगल वाला कार्ड हर पिन दिखाता है।', 'Pin 1 (3.3 V) peeche wala chaukor pad hai. Odd pins andar ki line mein, even pins kinare par. Inmein 26 GPIO hain; gpiozero GPIO number leta hai, pin number nahi: GPIO 17 matlab pin 11. 3.3 V logic: kisi GPIO mein kabhi 5 V mat daaliye. Bagal wala card har pin dikhata hai.') },
  q_usb3: { n: t3('2 × USB 3.0 (blue)', '2 × USB 3.0 (नीले)', '2 × USB 3.0 (blue)'), d: t3('Fast USB for a pen drive or a webcam.', 'पेन ड्राइव या वेबकैम के लिए तेज़ USB।', 'Pen drive ya webcam ke liye tez USB.') },
  q_usb2: { n: t3('2 × USB 2.0', '2 × USB 2.0', '2 × USB 2.0'), d: t3('For the keyboard and the mouse.', 'कीबोर्ड और माउस के लिए।', 'Keyboard aur mouse ke liye.') },
  q_eth: { n: t3('Gigabit Ethernet', 'गीगाबिट ईथरनेट', 'Gigabit Ethernet'), d: t3('A network cable to the school router (there is WiFi and Bluetooth on the board too).', 'स्कूल राउटर तक नेटवर्क केबल (बोर्ड पर WiFi और Bluetooth भी हैं)।', 'School router tak network cable (board par WiFi aur Bluetooth bhi hain).') },
  q_usbc: { n: t3('USB-C power in', 'USB-C पावर इनपुट', 'USB-C power input'), d: t3('Its own 5 V, 3 A supply: a phone charger is often too weak. The 5 V pins (2 and 4) of the header come straight from here.', 'इसकी अपनी 5 V, 3 A सप्लाई: फ़ोन का चार्जर अक्सर कमज़ोर पड़ता है। हेडर के 5 V पिन (2 और 4) सीधे यहीं से आते हैं।', 'Iski apni 5 V, 3 A supply: phone ka charger aksar kamzor padta hai. Header ke 5 V pin (2 aur 4) seedhe yahin se aate hain.') },
  q_hdmi: { n: t3('2 × micro-HDMI', '2 × माइक्रो-HDMI', '2 × micro-HDMI'), d: t3('Two screens, up to 4K. The little screen behind is on HDMI0 and shows the terminal.', 'दो स्क्रीन, 4K तक। पीछे वाली छोटी स्क्रीन HDMI0 पर है और टर्मिनल दिखाती है।', 'Do screen, 4K tak. Peeche wali chhoti screen HDMI0 par hai aur terminal dikhati hai.') },
  q_audio: { n: t3('Audio / video jack', 'ऑडियो / वीडियो जैक', 'Audio / video jack'), d: t3('Headphones or a speaker (and old TVs).', 'हेडफ़ोन या स्पीकर (और पुराने टीवी)।', 'Headphone ya speaker (aur purane TV).') },
  q_csi: { n: t3('Camera connector (CSI)', 'कैमरा कनेक्टर (CSI)', 'Camera connector (CSI)'), d: t3('A ribbon cable to the Pi camera: lift the dark latch, slide the cable in, press the latch down.', 'Pi कैमरे के लिए रिबन केबल: गहरा लैच उठाइए, केबल अंदर सरकाइए, लैच दबा दीजिए।', 'Pi camera ke liye ribbon cable: dark latch uthaiye, cable andar sarkaiye, latch daba dijiye.') },
  q_dsi: { n: t3('Display connector (DSI)', 'डिस्प्ले कनेक्टर (DSI)', 'Display connector (DSI)'), d: t3('For the official touch screen, with a ribbon cable.', 'आधिकारिक टच स्क्रीन के लिए, रिबन केबल से।', 'Official touch screen ke liye, ribbon cable se.') },
  q_sd: { n: t3('microSD card (underneath)', 'माइक्रोSD कार्ड (नीचे)', 'microSD card (neeche)'), d: t3('The Pi\'s hard disk: Raspberry Pi OS, your files and your Python programs live on it.', 'Pi की हार्ड डिस्क: Raspberry Pi OS, आपकी फ़ाइलें और Python प्रोग्राम इसी पर रहते हैं।', 'Pi ki hard disk: Raspberry Pi OS, aapki files aur Python programs isi par rehte hain.') },
  q_wifi: { n: t3('WiFi and Bluetooth', 'WiFi और Bluetooth', 'WiFi aur Bluetooth'), d: t3('The radio under the metal shield: 2.4 and 5 GHz WiFi, Bluetooth 5.0.', 'धातु के ढक्कन के नीचे रेडियो: 2.4 और 5 GHz WiFi, Bluetooth 5.0।', 'Metal cover ke neeche radio: 2.4 aur 5 GHz WiFi, Bluetooth 5.0.') },
  q_usbctl: { n: t3('USB controller (VL805)', 'USB कंट्रोलर (VL805)', 'USB controller (VL805)'), d: t3('Runs the four USB ports.', 'चारों USB पोर्ट चलाता है।', 'Chaaron USB port chalata hai.') },
  q_pmic: { n: t3('Power chip (PMIC)', 'पावर चिप (PMIC)', 'Power chip (PMIC)'), d: t3('Makes 3.3 V and the other voltages from the 5 V input. The 3.3 V pins (1 and 17) give at most about 50 mA in all.', '5 V इनपुट से 3.3 V और बाक़ी वोल्टेज बनाती है। 3.3 V पिन (1 और 17) कुल मिलाकर लगभग 50 mA तक देते हैं।', '5 V input se 3.3 V aur baaki voltages banati hai. 3.3 V pins (1 aur 17) kul milakar lagbhag 50 mA tak dete hain.') },
  q_leds: { n: t3('PWR (red) and ACT (green) LEDs', 'PWR (लाल) और ACT (हरी) एलईडी', 'PWR (red) aur ACT (green) LEDs'), d: t3('Red: power is good. Green: the SD card is busy; it flickers while your program starts.', 'लाल: बिजली ठीक है। हरी: SD कार्ड काम में है; आपका प्रोग्राम शुरू होते समय टिमटिमाती है।', 'Red: power theek hai. Green: SD card kaam mein hai; aapka program shuru hote waqt timtimaati hai.') },
  q_poe: { n: t3('PoE pins', 'PoE पिन', 'PoE pins'), d: t3('Power over Ethernet: with an add-on board, the network cable can power the Pi.', 'Power over Ethernet: एक ऐड-ऑन बोर्ड से नेटवर्क केबल ही Pi को बिजली दे सकती है।', 'Power over Ethernet: ek add-on board se network cable hi Pi ko power de sakti hai.') },
};
const FREE6 = {
  pico: '# Free build on the Raspberry Pi Pico: MicroPython\nfrom machine import Pin\nimport time\n\nled = Pin("LED", Pin.OUT)    # the green LED (GP25)\n\nwhile True:\n    led.toggle()\n    time.sleep(0.5)\n',
  pi4: '# Free build on the Raspberry Pi 4: Python 3 with gpiozero\nfrom gpiozero import LED\nfrom signal import pause\n\nled = LED(17)          # GPIO 17 = physical pin 11\nled.blink()\n\npause()\n',
};

export function install6(app) {
  Object.assign(REGIONS, REG6); Object.assign(T, T6); Object.assign(SPEC, SPEC6); Object.assign(STARTER, FREE6);
  for (const id of ['pico', 'pi4']) if (!ORDER.includes(id)) ORDER.push(id);
  Object.assign(VIEWS, { pi6: { tgt: [-96, 24, -8], hw: 182, hd: 64, dir: [0, 0.62, 0.79] }, pi6w: { tgt: [-30, 8, -4], hw: 108, hd: 46, dir: [0, 0.74, 0.67] }, arenapi: { tgt: [2560, 0, 20], hw: 760, hd: 560, dir: [0, 0.82, 0.57] } }); // (arenapi: the Pi car's floor, its start and P) // the screen, the Pi, its card and the breadboard; for wiring: the Pi and the breadboard // the Pi, its card, the breadboard and the screen behind
  const lab = app.lab, view = app.view, stage = app.stage; const T0 = { serial: T.serial, serialEmpty: T.serialEmpty, sendPh: T.sendPh };
  const st = document.createElement('style'); st.textContent = 'body.py6 #ser-baud{display:none}body.py6 #serout{background:#0d0f12;color:#e6e6e6}'
    // batch 20: under the terminal, the Pi's files and its figure; a window that shows one of them
    + '#fs20{display:none;flex-wrap:wrap;gap:6px;padding:6px 8px;border-top:1px solid var(--line);background:#0d0f12}body.pi20 #fs20{display:flex}'
    + '#fs20 b{font-size:12px;color:var(--mute);font-weight:700;align-self:center;margin-right:2px}#fs20 button{font:600 12.5px/1 system-ui,sans-serif;color:var(--txt);background:rgba(255,255,255,.07);border:1px solid var(--line);border-radius:8px;padding:6px 9px;cursor:pointer}'
    + '#fs20 button.fig{color:#0b0e13;background:var(--blue);border-color:transparent}'
    + '#win20{position:fixed;inset:0;z-index:60;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,.45)}#win20.on{display:flex}'
    + '#win20 .w{width:min(760px,94vw);max-height:86vh;display:flex;flex-direction:column;background:#ececec;border-radius:10px;overflow:hidden;box-shadow:0 18px 60px rgba(0,0,0,.5)}'
    + '#win20 .h{display:flex;align-items:center;gap:8px;padding:8px 12px;background:#d8d8d8;color:#222;font:700 14px system-ui,sans-serif}#win20 .h span{flex:1}#win20 .h button{font:700 13px system-ui,sans-serif;border:0;border-radius:6px;padding:6px 10px;background:#bbb;color:#111;cursor:pointer}'
    + '#win20 canvas{width:100%;height:auto;display:block;background:#fff}#win20 pre{margin:0;padding:12px 14px;overflow:auto;background:#fff;color:#111;font:13px/1.45 ui-monospace,Menlo,Consolas,monospace;white-space:pre}';
  document.head.appendChild(st);
  const X = { scrT: 0, scrText: null, fsK: null, figV: null };
  // ------------------------------------------------------------ batch 20: the Pi's SD card and matplotlib's window
  const sp = $('#serpane'); const bar = document.createElement('div'); bar.id = 'fs20'; if (sp) sp.insertBefore(bar, $('#serin'));
  const win = document.createElement('div'); win.id = 'win20'; win.innerHTML = '<div class="w" role="dialog" aria-modal="true"><div class="h"><span></span><button type="button"></button></div><div class="b"></div></div>'; document.body.appendChild(win);
  win.onclick = (e) => { if (e.target === win) win.classList.remove('on'); }; win.querySelector('.h button').onclick = () => win.classList.remove('on');
  const esc = (x) => String(x).replace(/[&<>]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[ch]);
  function showWin(kind, name) {
    const h = win.querySelector('.h span'), b = win.querySelector('.b'); win.querySelector('.h button').textContent = '✕ ' + tx(T6.close20);
    if (kind === 'fig') {
      const f = lab.mcu.fig6; h.textContent = `${tx(T6.fig20)} ${f ? f.n : 1}${f && f.title ? ' · ' + f.title : ''}`; b.innerHTML = ''; const C = document.createElement('canvas'); C.width = 1280; C.height = 800; b.appendChild(C);
      drawFigure(C.getContext('2d'), f, C.width, C.height);
    } else { const t = (lab.fs6 && lab.fs6.get(name)) || ''; h.textContent = '📄 /home/pi/' + name; b.innerHTML = `<pre>${esc(t.replace(/\r/g, '')) || esc(tx(T6.empty20))}</pre>`; }
    win.classList.add('on'); win.dataset.kind = kind; win.dataset.name = name || '';
  }
  function fsBar() { // the strip under the terminal: a button for each file and one for the figure
    const pi = lab.def.id === 'pi4'; const fs = lab.fs6 || new Map(); const fig = pi && lab.mcu.fig6;
    const k = pi + '|' + (lab.fsV6 || 0) + '|' + (lab.mcu.figV6 || 0) + '|' + [...fs.keys()].join(',');
    if (k === X.fsK) return; X.fsK = k;
    document.body.classList.toggle('pi20', pi && (fs.size > 0 || !!fig));
    bar.innerHTML = `<b>📁 ${esc(tx(T6.files20))}:</b>` + [...fs.keys()].sort().map((n) => { const t = fs.get(n) || ''; const nl = t.split('\n').filter((x) => x.length).length; return `<button type="button" data-f="${esc(n)}">${esc(n)}${/\.png$/.test(n) ? '' : ` · ${nl} ${esc(tx(T6.lines20))}`}</button>`; }).join('') + (fig ? `<button type="button" class="fig" data-fig="1">📈 ${esc(tx(T6.fig20))} ${fig.n}</button>` : '');
    for (const b2 of bar.querySelectorAll('button')) b2.onclick = () => { const n = b2.dataset.f; if (b2.dataset.fig || /\.png$/.test(n || '')) showWin('fig'); else showWin('file', n); };
    if (win.classList.contains('on') && win.dataset.kind === 'file' && fs.has(win.dataset.name)) showWin('file', win.dataset.name); // (a file open in the window grows as the program writes)
  }
  // a Python board on the bench: the editor speaks Python, the Serial Monitor is the Shell (Pico) or the Terminal (Pi 4)
  function onBoard() {
    const d = lab.def, py = !!d.py; document.body.classList.toggle('py6', py);
    if (py) { app.editor.mode = PY6; app.editor.t.setAttribute('aria-label', 'Python code'); } else if (app.editor.mode === PY6) { app.editor.mode = null; app.editor.t.setAttribute('aria-label', 'Arduino code'); }
    app.editor.paint && app.editor.paint();
    Object.assign(T, py ? { serial: d.id === 'pico' ? T6.shell6 : T6.term6, serialEmpty: T6.empty6, sendPh: T6.send6 } : T0);
    const e = $('#serout .empty'); if (e) e.textContent = tx(T.serialEmpty); const si = $('#ser-txt'); if (si) si.placeholder = tx(T.sendPh);
    const b = $('#ser-baud'); if (py && b) b.value = '115200';
    if (app.blocks3) app.blocks3.renderSwitch(); if (py && app.blocks3 && app.blocks3.mode === 'blocks') app.blocks3.setMode('cpp', false);
    const tab = $('#s-tabs [data-tab="ser"]'); if (tab) tab.textContent = tx(T.serial);
    hideBoxExtras();
  }
  // the board box (app4.js) shows the Pi 4 on its own: its card, screen and cables stay on the bench
  function hideBoxExtras() { const B = app.x4 && app.x4.box; if (B) B.traverse((o) => { if (o.userData.extras6) o.visible = false; }); }
  lab.on((type) => { if (type === 'board') onBoard(); });
  const W = (name, f) => { const o = app[name].bind(app); app[name] = (...a) => f(o, ...a); };
  W('openLesson', (o, id, quiet) => { const r = o(id, quiet); onBoard(); return r; }); // batch 6
  W('openFree', (o) => { const r = o(); if (lab.def.py && ![...Object.values(FREE6)].includes(app.editor.value) && /^\s*(\/\/|#include|void )/m.test(app.editor.value)) app.editor.value = FREE6[lab.def.id]; onBoard(); return r; }); // batch 6
  // a wave at the PIR lasts 1.2 s of the board's time (and at least 3 frames), not of the wall clock: a slow phone that draws a
  // frame a second (or a headset compiling a shader) still sees it
  const waves = new Map();
  app.wave6 = (p) => { p.state.motion = true; waves.set(p, { t: lab.obs.t, f: 0 }); lab.stateV++; lab.instKey = null; stage.kick(); };
  W('bindControls', (o, el) => { o(el); const b = el.querySelector('#co3-wave'), p = app.sel && app.sel.part; if (b && p) b.onclick = () => app.wave6(p); }); // batch 6
  W('frame', (o, dt) => { // the Pi's screen shows its terminal (a few times a second, when it changed)
    o(dt);
    for (const [p, w] of waves) if ((++w.f >= 3 && lab.obs.t - w.t >= 1.2) || !lab.parts.includes(p)) { p.state.motion = false; waves.delete(p); lab.stateV++; lab.instKey = null; }
    fsBar();
    const fv = lab.mcu.figV6; if (lab.def.id === 'pi4' && lab.mcu.fig6 && fv !== X.figV && lab.mcu.plt6 && lab.mcu.plt6.shown.length) { X.figV = fv; showWin('fig'); } // plt.show(): its window opens, as on the Pi's desktop
    const scr = view.board && view.board.userData.screen; if (!scr) return;
    X.scrT -= dt; if (X.scrT > 0) return; X.scrT = 0.2;
    const txt = (lab.mcu.state === 'running' || lab.mcu.state === 'done' || lab.mcu.state === 'error') && app.serText ? app.serText : 'pi@raspberrypi:~ $ ';
    if (scr.draw(txt, 'pi@raspberrypi: ~', lab.mcu.fig6, lab.mcu.figV6)) { X.scrText = txt; stage.kick(); }
  });
  // ------------------------------------------------------------ test hooks (devtools/test/robotest6.mjs)
  window.robo6 = {
    board: () => lab.def.id, py: () => !!lab.def.py, mode: () => (app.editor.mode === PY6 ? 'py' : 'cpp'), serialTab: () => tx(T.serial), screen: () => X.scrText,
    state: () => ({ mcu: lab.mcu.state, obs: lab.mcu.obs6 ? { prints: lab.mcu.obs6.prints, events: lab.mcu.obs6.events, angles: lab.mcu.obs6.angles.size, dht: lab.mcu.obs6.dht.length, lines: lab.mcu.obs6.lines.slice(-4) } : null, ledL: lab.ledL, err: lab.mcu.err ? { code: lab.mcu.err.code, line: lab.mcu.err.line } : null }),
    t: (k) => t(k),
    files: () => (lab.fs6 ? Object.fromEntries(lab.fs6) : {}), fig: () => lab.mcu.fig6 || null, win: () => (win.classList.contains('on') ? win.dataset.kind + ':' + (win.dataset.name || '') : null), // (batch 20)
    view(o) { VIEWS.test6 = o; stage.userMoved = false; stage.fitPts = null; if (o.full) stage.free = { fw: 1, fh: 1 }; stage.setView('test6', true); }, // (a camera for the screenshots)
  };
  onBoard();
}
