// DUET Robotics Lab 360, batch 21: the Raspberry Pi 4 on the network and with RFID (Class 10), written fresh for DUET.
// pi20.js gives the Pi's Python Flask (a web server the bench's phone reaches through the school WiFi, esp32.js netOf)
// and SimpleMFRC522 (the RC522 on SPI0):
//   pi_flask      a web page that switches the classroom lamp (an LED on GPIO 17): @app.route, app.run(host="0.0.0.0",
//                 port=5000), the address with :5000 on the phone. Without host="0.0.0.0" Flask listens only on the
//                 Pi itself (127.0.0.1) and the phone is refused.
//   pi_rfidsheet  attendance with RFID cards into attendance.csv: each card's number is a student; an unknown card is
//                 named in the terminal, its number goes into the dictionary; a second tap is "already marked"
//   pi_tripwire   an LDR and 10 kΩ into GPIO 17 (the pin's own threshold is the comparator); when_deactivated runs the
//                 alarm; without pause() the program ends and nothing guards the door
// devtools/test/robocore21.mjs plays them.
const t3 = (en, hi, hg) => ({ en, hi, hg });
const rail = (r, col) => { let best = 0; for (let i = 0; i < 50; i++) if (Math.abs(3 + i + Math.floor(i / 5) - col) < Math.abs(3 + best + Math.floor(best / 5) - col)) best = i; return 'H:' + r + (best + 1); };

export const PI_FLASK = `# A web page that switches the classroom lamp, served by the Pi with Flask
from flask import Flask
from gpiozero import LED

app = Flask(__name__)
lamp = LED(17)

PAGE = """<h1>Class 10 lamp</h1>
<p>The lamp is <b>{state}</b>.</p>
<p><a href="/on">Turn ON</a> &nbsp; <a href="/off">Turn OFF</a></p>"""

@app.route("/")
def home():
    return PAGE.format(state="ON" if lamp.is_lit else "OFF")

@app.route("/on")
def turn_on():
    lamp.on()
    return home()

@app.route("/off")
def turn_off():
    lamp.off()
    return home()

app.run(host="0.0.0.0", port=5000)
`;
export const PI_ATTEND = `# Attendance with RFID: each card is a student; a tap writes a row to attendance.csv
from mfrc522 import SimpleMFRC522
import RPi.GPIO as GPIO
import csv
from time import sleep, strftime

reader = SimpleMFRC522()
students = {
    701406916061: "Asha",     # the white card
}
present = []

print("Tap your card...")
try:
    while True:
        id, text = reader.read()          # waits for a card
        name = students.get(id, "Unknown")
        if name == "Unknown":
            print("Unknown card:", id)
        elif name in present:
            print(name, "is already marked")
        else:
            present.append(name)
            with open("attendance.csv", "a") as f:
                csv.writer(f).writerow([strftime("%d-%m-%Y"), strftime("%H:%M"), name])
            print(name, "marked present")
        sleep(1)
finally:
    GPIO.cleanup()
`;

export const PI_TRIP = `# Laser tripwire: a laser shines on an LDR; whoever breaks the beam sets off the alarm.
# The LDR and a 10 kOhm resistor make a divider into GPIO 17: light -> HIGH, beam broken -> LOW.
from gpiozero import DigitalInputDevice, Buzzer
from signal import pause
from time import strftime

beam = DigitalInputDevice(17)
buzzer = Buzzer(18)
count = 0

def broken():
    global count
    count += 1
    print(strftime("%H:%M:%S"), "INTRUDER!", count)
    buzzer.beep(0.1, 0.1, n=10)

def restored():
    print("Beam OK")

beam.when_deactivated = broken
beam.when_activated = restored
print("Guarding... the beam is", "OK" if beam.value else "BROKEN")
pause()
`;

export function batch21(K, n0) {
  const { P, F } = K;
  const E = t3('', '', '');
  const run = (see) => ({ k: 'run', do: t3('Press Run.', '"चलाइए" दबाइए।', 'Run dabaiye.'), see: see || E });
  const check = { k: 'check', do: t3('Press "Check my circuit".', '"मेरा सर्किट जाँचिए" दबाइए।', '"Mera circuit check karo" dabaiye.'), see: E };
  const X = {
    toPin: t3('The {x} must be joined to {p}.', '{x} को {p} से जोड़िए।', '{x} ko {p} se jodiye.'),
    rf5: t3('The RC522 is on 5 V: it is a 3.3 V chip. Its 3.3V pin goes to the Pi\'s 3.3V.', 'RC522 को 5 V मिल रहा है: यह 3.3 V की चिप है। इसका 3.3V पिन Pi के 3.3V पर जाता है।', 'RC522 ko 5 V mil raha hai: yeh 3.3 V ki chip hai. Iska 3.3V pin Pi ke 3.3V par jaata hai.'),
  };
  const need = (a, b, x, p) => (S) => (S.conn(a, b) ? null : [X.toPin, { x, p }]);
  const net = (S) => S.lab.net4 || { seen: { pages: 0, paths: {} }, piIP: () => null };
  const fl = (S) => (S.lab.mcu && S.lab.mcu.flask6) || null;
  const served = (S, path) => { const f = fl(S); return f ? f.log.filter(([p, c]) => (!path || p === path) && c === 200).length : 0; };
  const said = (S, re) => (S.serLines || []).some((l) => re.test(l));
  const hostOf = (src) => { const m = /app\.run\(([^)]*)\)/.exec(src || ''); return m ? m[1] : ''; };
  let n = n0;
  const L = [];

  // 1 ------------------------------------------------------------------------------------------------------- Flask lamp
  L.push({ id: 'pi_flask', board: 'pi4', cls: '10', view: 'pi6', wview: 'pi6w', code: PI_FLASK, drawer: [], serial: true, phone: true,
    title: t3('Web-controlled lamp with Flask', 'Flask से वेब से चलने वाला लैंप', 'Flask se web se chalne wala lamp'),
    goal: t3('Your Raspberry Pi becomes a web server: Flask turns a few Python functions into web pages, and any phone on the school WiFi switches the classroom lamp. Then the one word that decides who can reach it.', 'आपका Raspberry Pi एक वेब सर्वर बन जाता है: Flask कुछ Python फ़ंक्शनों को वेब पेज बना देता है, और स्कूल WiFi पर कोई भी फ़ोन क्लास का लैंप चला सकता है। फिर वह एक शब्द जो तय करता है कि इसे कौन खोल सकता है।', 'Aapka Raspberry Pi ek web server ban jaata hai: Flask kuch Python functions ko web pages bana deta hai, aur school WiFi par koi bhi phone class ka lamp chala sakta hai. Phir woh ek shabd jo tay karta hai ki ise kaun khol sakta hai.'),
    setup: { parts: [P('led1', 'led', { color: 'yellow' }, 'f21', 0), P('r1', 'resistor', { ohms: 330 }, 'j21', 1)], wires: [['B:GND6', rail('bn', 19)], ['B:GPIO17', 'H:i22']] },
    steps: [
      { k: 'info', code: [13, 14, 17, 18, 27], do: t3('The lamp is the LED on GPIO 17. @app.route("/on") above a def says: when a browser asks for /on, run this function and send back what it returns. app.run(host="0.0.0.0", port=5000) starts the server on port 5000.', 'लैंप GPIO 17 वाली LED है। def के ऊपर @app.route("/on") कहता है: जब कोई ब्राउज़र /on माँगे, यह फ़ंक्शन चलाओ और जो यह लौटाए वह भेज दो। app.run(host="0.0.0.0", port=5000) सर्वर को पोर्ट 5000 पर शुरू करता है।', 'Lamp GPIO 17 wali LED hai. def ke upar @app.route("/on") kehta hai: jab koi browser /on maange, yeh function chalao aur jo yeh lautaaye woh bhej do. app.run(host="0.0.0.0", port=5000) server ko port 5000 par shuru karta hai.'), see: E },
      run(t3('The program keeps running: a server waits for visitors.', 'प्रोग्राम चलता रहता है: सर्वर आने वालों का इंतज़ार करता है।', 'Program chalta rehta hai: server aane walon ka intezaar karta hai.')),
      { k: 'watch', until: (S) => said(S, /Running on http:\/\/192\.168\.\d+\.\d+:5000/), do: t3('Read the terminal: find the Pi\'s address.', 'टर्मिनल पढ़िए: Pi का पता ढूँढिए।', 'Terminal padhiye: Pi ka address dhoondhiye.'),
        see: t3('"Running on http://192.168.1.…:5000": that is the Pi on the school WiFi, and :5000 is the port, the door the server listens at.', '"Running on http://192.168.1.…:5000": यह स्कूल WiFi पर Pi है, और :5000 पोर्ट है, वह दरवाज़ा जिस पर सर्वर सुनता है।', '"Running on http://192.168.1.…:5000": yeh school WiFi par Pi hai, aur :5000 port hai, woh darwaza jis par server sunta hai.') },
      { k: 'act', until: (S) => served(S, '/') >= 1, do: t3('On the phone, open the Browser and type that address, with :5000 at the end. Go.', 'फ़ोन पर Browser खोलिए और वह पता लिखिए, आख़िर में :5000 के साथ। Go।', 'Phone par Browser kholiye aur woh address likhiye, aakhir mein :5000 ke saath. Go.'),
        see: t3('The page came from your Python: home() filled in "OFF". The terminal logs the visit: "GET / HTTP/1.1" 200 means the page was found.', 'पेज आपके Python से आया: home() ने "OFF" भरा। टर्मिनल इस मुलाक़ात को लिखता है: "GET / HTTP/1.1" 200 यानी पेज मिल गया।', 'Page aapke Python se aaya: home() ne "OFF" bhara. Terminal is mulaqat ko likhta hai: "GET / HTTP/1.1" 200 yaani page mil gaya.') },
      { k: 'act', until: (S) => S.ledLit('led1') && served(S, '/on') >= 1, do: t3('Tap "Turn ON" on the phone.', 'फ़ोन पर "Turn ON" छूइए।', 'Phone par "Turn ON" touch karo.'),
        see: t3('The lamp is on, switched from a phone across the room. Smart plugs and home-automation hubs work exactly like this.', 'लैंप जल गया, कमरे के दूसरी ओर के फ़ोन से। स्मार्ट प्लग और होम-ऑटोमेशन हब ठीक ऐसे ही काम करते हैं।', 'Lamp jal gaya, kamre ke doosri or ke phone se. Smart plug aur home automation hub theek aise hi kaam karte hain.') },
      { k: 'edit', test: (src) => /app\.run\(\s*port\s*=\s*5000\s*\)/.test(src), set: [[/app\.run\(host="0\.0\.0\.0", port=5000\)/, 'app.run(port=5000)']], do: t3('A tutorial online writes app.run(port=5000). Change the last line to that and Run.', 'एक ऑनलाइन ट्यूटोरियल app.run(port=5000) लिखता है। आख़िरी लाइन को वैसा कीजिए और "चलाइए"।', 'Ek online tutorial app.run(port=5000) likhta hai. Aakhri line ko waisa karo aur Run.'), see: E },
      { k: 'act', until: (S) => S.running() && /port=5000/.test(hostOf(S.runSrc)) && !/0\.0\.0\.0/.test(hostOf(S.runSrc)) && (net(S).seen.errs || 0) > (S.memRun.e0 || 0) && net(S).seen.lastErr && net(S).seen.lastErr.error === 'refused', do: t3('Open the page on the phone again (tap the address and Go).', 'फ़ोन पर पेज फिर से खोलिए (पते को छूइए और Go)।', 'Phone par page phir se kholiye (address ko touch karo aur Go).'),
        see: t3('Refused! The terminal says "Running on http://127.0.0.1:5000" only: without host="0.0.0.0" Flask listens on the Pi itself, not on the WiFi. That is safe while you build, and why the phone cannot get in. host="0.0.0.0" means: listen on every network the Pi is on.', 'मना कर दिया! टर्मिनल सिर्फ़ "Running on http://127.0.0.1:5000" कहता है: host="0.0.0.0" के बिना Flask सिर्फ़ Pi के अंदर सुनता है, WiFi पर नहीं। बनाते समय यह सुरक्षित है, और इसीलिए फ़ोन अंदर नहीं आ पाता। host="0.0.0.0" का मतलब: Pi जिस-जिस नेटवर्क पर है, सब पर सुनो।', 'Mana kar diya! Terminal sirf "Running on http://127.0.0.1:5000" kehta hai: host="0.0.0.0" ke bina Flask sirf Pi ke andar sunta hai, WiFi par nahi. Banate samay yeh surakshit hai, aur isiliye phone andar nahi aa paata. host="0.0.0.0" ka matlab: Pi jis jis network par hai, sab par suno.') },
      { k: 'edit', test: (src) => /app\.run\(host="0\.0\.0\.0", port=5000\)/.test(src), set: [[/app\.run\(port=5000\)/, 'app.run(host="0.0.0.0", port=5000)']], do: t3('Put host="0.0.0.0" back and Run.', 'host="0.0.0.0" वापस लगाइए और "चलाइए"।', 'host="0.0.0.0" wapas lagaiye aur Run.'), see: E },
      { k: 'act', until: (S) => /0\.0\.0\.0/.test(hostOf(S.runSrc)) && served(S, '/off') >= 1 && !S.ledLit('led1'), do: t3('Open the page on the phone and tap "Turn OFF".', 'फ़ोन पर पेज खोलिए और "Turn OFF" छूइए।', 'Phone par page kholiye aur "Turn OFF" touch karo.'),
        see: t3('Back in control. Only people on the school WiFi can reach it, and anyone there can: a real one would ask for a password before switching anything.', 'फिर से आपके हाथ में। सिर्फ़ स्कूल WiFi वाले इसे खोल सकते हैं, और वहाँ का कोई भी खोल सकता है: असली सिस्टम कुछ भी चालू करने से पहले पासवर्ड माँगेगा।', 'Phir se aapke haath mein. Sirf school WiFi wale ise khol sakte hain, aur wahan ka koi bhi khol sakta hai: asli system kuch bhi chalu karne se pehle password maangega.') },
    ],
    check: [],
    tick: (S) => { if (S.memRun.e0 === undefined) S.memRun.e0 = net(S).seen.errs || 0; }, // (the phone's failures before this run)
    done: (S) => /0\.0\.0\.0/.test(hostOf(S.runSrc)) && served(S, '/off') >= 1 });

  // 2 ------------------------------------------------------------------------------------------- RFID attendance sheet
  L.push({ id: 'pi_rfidsheet', board: 'pi4', cls: '10', view: 'pi6w', wview: 'pi6w', code: PI_ATTEND, drawer: [], serial: true,
    title: t3('Attendance with RFID and a spreadsheet', 'RFID और स्प्रेडशीट से हाज़िरी', 'RFID aur spreadsheet se haaziri'),
    goal: t3('Each student\'s RFID card has its own number. The Pi reads it, looks it up in a dictionary of names, and writes the date, the time and the name into attendance.csv, which the school office opens as a spreadsheet. A card the Pi does not know is named, and a second tap is not counted twice.', 'हर विद्यार्थी के RFID कार्ड का अपना नंबर है। Pi उसे पढ़ता है, नामों की डिक्शनरी में ढूँढता है, और तारीख़, समय और नाम attendance.csv में लिखता है, जिसे स्कूल ऑफ़िस स्प्रेडशीट की तरह खोलता है। जिस कार्ड को Pi नहीं जानता उसका नंबर बताया जाता है, और दूसरा टैप दो बार नहीं गिना जाता।', 'Har vidyarthi ke RFID card ka apna number hai. Pi use padhta hai, naamon ki dictionary mein dhoondhta hai, aur date, time aur naam attendance.csv mein likhta hai, jise school office spreadsheet ki tarah kholta hai. Jis card ko Pi nahi jaanta uska number bataya jaata hai, aur doosra tap do baar nahi gina jaata.'),
    setup: { parts: [F('rf', 'rfid', {}, 40, 152, 0)], wires: [['T:rf:SCK', 'B:GPIO11'], ['T:rf:MOSI', 'B:GPIO10'], ['T:rf:MISO', 'B:GPIO9'], ['T:rf:GND', 'B:GND5'], ['T:rf:V33', 'B:3V3']] },
    steps: [
      { k: 'info', do: t3('The RC522 talks SPI. Its clock and data are wired to the Pi\'s SPI0 (SCK GPIO 11, MOSI GPIO 10, MISO GPIO 9), with 3.3 V and GND. Two wires are yours.', 'RC522, SPI पर बात करता है। इसकी क्लॉक और डेटा Pi के SPI0 से जुड़े हैं (SCK GPIO 11, MOSI GPIO 10, MISO GPIO 9), 3.3 V और GND के साथ। दो तार आपके हैं।', 'RC522, SPI par baat karta hai. Iski clock aur data Pi ke SPI0 se jude hain (SCK GPIO 11, MOSI GPIO 10, MISO GPIO 9), 3.3 V aur GND ke saath. Do wire aapke hain.'), see: E },
      { k: 'wire', wire: ['rf.SDA', 'GPIO8'], do: t3('SDA (chip select) to GPIO 8, called CE0 (physical pin 24).', 'SDA (चिप सेलेक्ट) को GPIO 8, जिसे CE0 कहते हैं (फ़िज़िकल पिन 24), से जोड़िए।', 'SDA (chip select) ko GPIO 8, jise CE0 kehte hain (physical pin 24), se jodiye.'), see: E },
      { k: 'wire', wire: ['rf.RST', 'GPIO25'], do: t3('RST to GPIO 25 (physical pin 22).', 'RST को GPIO 25 (फ़िज़िकल पिन 22) से।', 'RST ko GPIO 25 (physical pin 22) se.'), see: t3('SimpleMFRC522 expects exactly these two pins.', 'SimpleMFRC522 ठीक इन्हीं दो पिनों की उम्मीद करता है।', 'SimpleMFRC522 theek inhi do pins ki ummeed karta hai.') },
      check,
      run(t3('"Tap your card..."', '"Tap your card..."', '"Tap your card..."')),
      { k: 'act', until: (S) => said(S, /^Asha marked present/), do: t3('Tap the reader and show it the white card (Asha\'s).', 'रीडर को छूइए और उसे सफ़ेद कार्ड (आशा का) दिखाइए।', 'Reader ko touch karo aur use safed card (Asha ka) dikhaiye.'),
        see: t3('Its number is in the dictionary: "Asha", and attendance.csv got a row (see it under the terminal).', 'इसका नंबर डिक्शनरी में है: "Asha", और attendance.csv में एक पंक्ति जुड़ी (टर्मिनल के नीचे देखिए)।', 'Iska number dictionary mein hai: "Asha", aur attendance.csv mein ek row judi (terminal ke neeche dekhiye).') },
      { k: 'act', until: (S) => said(S, /^Unknown card: 391623328800/), do: t3('Now show it the blue key tag (Ravi\'s).', 'अब इसे नीला की टैग (रवि का) दिखाइए।', 'Ab ise neela key tag (Ravi ka) dikhaiye.'),
        see: t3('"Unknown card: 391623328800". The tag works, but its number is not in the dictionary yet.', '"Unknown card: 391623328800"। टैग काम करता है, पर इसका नंबर अभी डिक्शनरी में नहीं है।', '"Unknown card: 391623328800". Tag kaam karta hai, par iska number abhi dictionary mein nahi hai.') },
      { k: 'edit', test: (src) => /391623328800\s*:\s*"Ravi"/.test(src), set: [[/(    701406916061: "Asha",[^\n]*\n)/, '$1    391623328800: "Ravi",     # the blue tag\n']], do: t3('Add Ravi under Asha in the dictionary: 391623328800: "Ravi", and Run.', 'डिक्शनरी में आशा के नीचे रवि जोड़िए: 391623328800: "Ravi", और "चलाइए"।', 'Dictionary mein Asha ke neeche Ravi jodiye: 391623328800: "Ravi", aur Run.'), see: E },
      { k: 'act', until: (S) => said(S, /^Ravi marked present/) && said(S, /^Asha is already marked/), do: t3('Show the tag, then the card, then the card again.', 'टैग दिखाइए, फिर कार्ड, फिर कार्ड दोबारा।', 'Tag dikhaiye, phir card, phir card dobara.'),
        see: t3('Ravi is marked, Asha is marked, and her second tap is not counted: name in present stops it. Open attendance.csv: one row a tap that counted. But Run the program again and present starts empty: a real system reads today\'s rows back from the file when it starts.', 'रवि दर्ज, आशा दर्ज, और उसका दूसरा टैप नहीं गिना गया: name in present उसे रोकता है। attendance.csv खोलिए: हर गिने गए टैप की एक पंक्ति। पर प्रोग्राम फिर से चलाइए तो present ख़ाली से शुरू होता है: असली सिस्टम शुरू होते समय आज की पंक्तियाँ फ़ाइल से वापस पढ़ता है।', 'Ravi darj, Asha darj, aur uska doosra tap nahi gina gaya: name in present use rokta hai. attendance.csv kholiye: har gine gaye tap ki ek row. Par program phir se chalaiye to present khaali se shuru hota hai: asli system shuru hote samay aaj ki rows file se wapas padhta hai.') },
    ],
    check: [(S) => (S.conn('rf.V33', '5V') ? [X.rf5] : null), need('rf.SDA', 'GPIO8', t3('reader\'s SDA', 'रीडर का SDA', 'reader ka SDA'), 'GPIO 8 (CE0)'), need('rf.RST', 'GPIO25', t3('reader\'s RST', 'रीडर का RST', 'reader ka RST'), 'GPIO 25'),
      need('rf.SCK', 'GPIO11', 'SCK', 'GPIO 11'), need('rf.MOSI', 'GPIO10', 'MOSI', 'GPIO 10'), need('rf.MISO', 'GPIO9', 'MISO', 'GPIO 9'), need('rf.V33', '3V3', t3('reader\'s 3.3V', 'रीडर का 3.3V', 'reader ka 3.3V'), '3.3V')],
    done: (S) => { const t = (S.lab.fs6 && S.lab.fs6.get('attendance.csv')) || ''; return /Ravi/.test(t) && /Asha/.test(t) && said(S, /already marked/); } });

  // 3 ------------------------------------------------------------------------------------------------ laser tripwire
  const dark = (S) => S.lab.env.light <= 0.2;
  L.push({ id: 'pi_tripwire', board: 'pi4', cls: '10', view: 'pi6w', wview: 'pi6w', code: PI_TRIP, drawer: ['ldr', 'resistor'], serial: true,
    title: t3('Laser tripwire in Python', 'Python में लेज़र ट्रिपवायर', 'Python mein laser tripwire'),
    goal: t3('A laser pointer shines across a doorway onto an LDR. The Pi has no analog input, so a divider and the GPIO pin\'s own threshold decide "light" or "dark", and gpiozero runs your function the moment the beam is broken. In the app the room light slider is the beam.', 'एक लेज़र पॉइंटर दरवाज़े के पार एक LDR पर चमकता है। Pi में एनालॉग इनपुट नहीं है, तो एक डिवाइडर और GPIO पिन की अपनी सीमा तय करते हैं "रोशनी" या "अँधेरा", और बीम टूटते ही gpiozero आपका फ़ंक्शन चला देता है। ऐप में कमरे की रोशनी वाला स्लाइडर ही बीम है।', 'Ek laser pointer darwaze ke paar ek LDR par chamakta hai. Pi mein analog input nahi hai, to ek divider aur GPIO pin ki apni seema tay karte hain "roshni" ya "andhera", aur beam tootte hi gpiozero aapka function chala deta hai. App mein room light slider hi beam hai.'),
    setup: { parts: [P('bz1', 'abuzz', {}, 'e56', 0)], wires: [['B:GND6', rail('bn', 19)], ['B:GPIO18', 'H:a56'], ['B:GND7', 'H:a59']] },
    steps: [
      { k: 'info', do: t3('Ready: an active buzzer on GPIO 18. Your job: the beam\'s sensor, an LDR from 3.3V and a 10 kΩ resistor to GND, with GPIO 17 between them.', 'तैयार: GPIO 18 पर एक एक्टिव बज़र। आपका काम: बीम का सेंसर, 3.3V से एक LDR और GND तक 10 kΩ रेज़िस्टर, बीच में GPIO 17।', 'Taiyaar: GPIO 18 par ek active buzzer. Aapka kaam: beam ka sensor, 3.3V se ek LDR aur GND tak 10 kΩ resistor, beech mein GPIO 17.'), see: E },
      { k: 'place', place: P('ldr1', 'ldr', {}, 'f33', 0), do: t3('Plug the LDR into 33f and 35f.', 'LDR को 33f और 35f में लगाइए।', 'LDR ko 30f aur 32f mein lagaiye.'), see: E },
      { k: 'place', place: P('r1', 'resistor', { ohms: 10000 }, 'j35', 1), do: t3('Put the 10 kΩ resistor (brown, black, orange) from 35j into the − rail.', '10 kΩ रेज़िस्टर (भूरा, काला, नारंगी) 35j से − रेल में लगाइए।', '10 kΩ resistor (brown, black, orange) 32j se − rail mein lagaiye.'), see: E },
      { k: 'wire', wire: ['ldr1.1', '3V3'], do: t3('Wire the LDR\'s other leg (column 33) to 3.3V (physical pin 1).', 'LDR के दूसरे पैर (कॉलम 33) से 3.3V (फ़िज़िकल पिन 1) तक वायर।', 'LDR ke doosre pair (column 33) se 3.3V (physical pin 1) tak wire.'), see: E },
      { k: 'wire', wire: ['r1.1', 'GPIO17'], do: t3('Wire the middle (column 35) to GPIO 17 (physical pin 11).', 'बीच (कॉलम 35) से GPIO 17 (फ़िज़िकल पिन 11) तक वायर।', 'Beech (column 35) se GPIO 17 (physical pin 11) tak wire.'),
        see: t3('In the light the LDR is about 600 Ω, so the middle is near 3 V: HIGH. In the dark it is over 50 kΩ: under 0.6 V, LOW. The pin switches at about 1.6 V.', 'रोशनी में LDR लगभग 600 Ω है, तो बीच लगभग 3 V: HIGH। अँधेरे में 50 kΩ से ज़्यादा: 0.6 V से कम, LOW। पिन लगभग 1.6 V पर बदलता है।', 'Roshni mein LDR lagbhag 600 Ω hai, to beech lagbhag 3 V: HIGH. Andhere mein 50 kΩ se zyada: 0.6 V se kam, LOW. Pin lagbhag 1.6 V par badalta hai.') },
      check,
      run(),
      { k: 'act', until: (S) => said(S, /INTRUDER! 1$/) && S.part('bz1') && S.part('bz1').state.beeps >= 2, do: t3('Break the beam: slide the room light down to 10 %.', 'बीम तोड़िए: कमरे की रोशनी 10 % तक कम कीजिए।', 'Beam todiye: room light 10 % tak kam kijiye.'),
        see: t3('"INTRUDER! 1" and ten quick beeps. You never asked the pin in a loop: when_deactivated ran broken() the moment GPIO 17 went LOW.', '"INTRUDER! 1" और दस तेज़ बीप। आपने लूप में पिन से कभी नहीं पूछा: GPIO 17 के LOW होते ही when_deactivated ने broken() चला दिया।', '"INTRUDER! 1" aur das tez beep. Aapne loop mein pin se kabhi nahi poocha: GPIO 17 ke LOW hote hi when_deactivated ne broken() chala diya.') },
      { k: 'act', until: (S) => said(S, /^Beam OK/) && !dark(S), do: t3('Let the beam back: slide the room light up again.', 'बीम वापस आने दीजिए: कमरे की रोशनी फिर बढ़ाइए।', 'Beam wapas aane dijiye: room light phir badhaiye.'), see: E },
      { k: 'edit', test: (src) => !/^pause\(\)/m.test(src), set: [[/\npause\(\)\n/, '\n']], do: t3('"pause() does nothing, it just waits." Delete the last line, pause(), and Run.', '"pause() कुछ नहीं करता, बस रुकता है।" आख़िरी लाइन pause() मिटाइए और "चलाइए"।', '"pause() kuch nahi karta, bas rukta hai." Aakhri line pause() mitaiye aur Run.'), see: E },
      { k: 'act', until: (S) => S.runSrc !== null && !/^pause\(\)/m.test(S.runSrc) && S.lab.mcu.state === 'done' && dark(S), do: t3('Break the beam again.', 'बीम फिर से तोड़िए।', 'Beam phir se todiye.'),
        see: t3('Silence. The program reached its last line and ended, and Python switched gpiozero off with it: nobody was left to run broken(). pause() keeps the program alive, waiting for events. Read the hint under the code.', 'सन्नाटा। प्रोग्राम अपनी आख़िरी लाइन तक पहुँचा और ख़त्म हो गया, और Python ने उसके साथ gpiozero बंद कर दिया: broken() चलाने वाला कोई नहीं बचा। pause() प्रोग्राम को ज़िंदा रखता है, घटनाओं का इंतज़ार करते हुए। कोड के नीचे का संकेत पढ़िए।', 'Sannata. Program apni aakhri line tak pahuncha aur khatam ho gaya, aur Python ne uske saath gpiozero band kar diya: broken() chalane wala koi nahi bacha. pause() program ko zinda rakhta hai, ghatnaon ka intezaar karte hue. Code ke neeche ka sanket padhiye.') },
      { k: 'edit', test: (src) => /\npause\(\)\s*$/.test(src), set: [[/\n?$/, '\npause()\n']], do: t3('Put pause() back as the last line, slide the light up, and Run.', 'pause() को आख़िरी लाइन के रूप में वापस लगाइए, रोशनी बढ़ाइए, और "चलाइए"।', 'pause() ko aakhri line ke roop mein wapas lagaiye, roshni badhaiye, aur Run.'), see: E },
      { k: 'act', until: (S) => /\npause\(\)\s*$/.test(S.runSrc || '') && said(S, /INTRUDER! 2$/), do: t3('Break the beam twice: down, up, down.', 'बीम दो बार तोड़िए: नीचे, ऊपर, नीचे।', 'Beam do baar todiye: neeche, upar, neeche.'),
        see: t3('Guarding again, and counting: 2 intruders. Shops and museums use the same beam, often invisible infrared, and log the times as this does.', 'फिर से पहरा, और गिनती भी: 2 घुसपैठिए। दुकानें और संग्रहालय यही बीम इस्तेमाल करते हैं, अक्सर न दिखने वाली इन्फ्रारेड, और इसी तरह समय दर्ज करते हैं।', 'Phir se pehra, aur ginti bhi: 2 ghuspaithiye. Dukaanein aur sangrahalay yahi beam use karte hain, aksar na dikhne wali infrared, aur isi tarah time darj karte hain.') },
    ],
    check: [(S) => (S.has('ldr1') ? null : [X.toPin, { x: t3('LDR', 'LDR', 'LDR'), p: '3.3V' }]), need('ldr1.1', '3V3', t3('LDR\'s leg', 'LDR का पैर', 'LDR ka pair'), '3.3V'), need('r1.1', 'GPIO17', t3('middle of the divider', 'डिवाइडर का बीच', 'divider ka beech'), 'GPIO 17'), need('r1.2', 'GND', t3('10 kΩ resistor', '10 kΩ रेज़िस्टर', '10 kΩ resistor'), 'GND (the − rail)')],
    done: (S) => /\npause\(\)\s*$/.test(S.runSrc || '') && said(S, /INTRUDER! 2$/) });

  for (const l of L) { l.n = ++n; l.lang = 'py'; l.batch = 21; }
  return L;
}
