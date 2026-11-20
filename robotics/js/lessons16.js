// DUET Robotics Lab 360, batch 16: two Class 8 sessions, written fresh for DUET (same shape as lessons.js):
//   smarthome4  a smart-home web page on the ESP32: four appliances (LEDs), a Switch button for each, and "All off";
//               one handler serves all four through the page's ?n= argument, and it answers with a redirect to "/"
//   attendance  an RFID attendance register on the Uno: each student taps an ID card, the 16×2 LCD greets them and
//               counts the class, an unknown card is shown with its number, and a second tap is not counted twice
// The helpers (t3, P, F, W, need, has, noShort, unit) come from lessons.js, so there is no import loop.
// devtools/test/robocore16.mjs plays both end to end.
import { CUR } from './scenes3.js';
import { MBCore, MBX } from './microbit.js';

const t3 = (en, hi, hg) => ({ en, hi, hg });
const rail = (r, col) => { for (let i = 0; i < 50; i++) if (3 + i + Math.floor(i / 5) === col) return 'H:' + r + (i + 1); throw new Error('no rail hole at column ' + col); };
const railN = (r, col) => { let best = 0; for (let i = 0; i < 50; i++) if (Math.abs(3 + i + Math.floor(i / 5) - col) < Math.abs(3 + best + Math.floor(best / 5) - col)) best = i; return 'H:' + r + (best + 1); }; // (the nearest rail hole)
const pick = (lg, en, hi, hg) => (lg === 'hi' ? hi : lg === 'hg' ? hg : en);
// a step's text worked out from what really happened (read each time the card is drawn)
function live(f) { const o = {}; for (const lg of ['en', 'hi', 'hg']) Object.defineProperty(o, lg, { enumerable: true, get: () => { try { return String(f(lg, (CUR.sim && CUR.sim.res) || {}) || ''); } catch (e) { return ''; } } }); return o; }

// ------------------------------------------------------------------ the sketches
const HOME4 = `// Smart home: a web page on the ESP32 with a switch for each of four appliances
#include <WiFi.h>
#include <WebServer.h>

const char* ssid = "DUET-School";
const char* password = "stem2026";
WebServer server(80);

const int pins[4] = {25, 26, 27, 33};             // the four appliances' GPIOs
String names[4] = {"Light", "Fan", "TV", "Pump"};
bool on[4] = {false, false, false, false};

String page() {
  String h = "<h2>DUET Smart Home</h2>";
  for (int i = 0; i < 4; i++) {
    h += "<p>" + names[i] + " is <b>";
    h += on[i] ? "ON" : "OFF";
    h += "</b> <a href=\\"/switch?n=" + String(i) + "\\"><button>Switch</button></a></p>";
  }
  h += "<p><a href=\\"/alloff\\"><button>All off</button></a></p>";
  return h;
}

void backHome() {
  server.sendHeader("Location", "/");   // go back to the main page,
  server.send(303);                     // so a refresh does not switch again
}

void handleRoot() {
  server.send(200, "text/html", page());
}

void handleSwitch() {
  int i = server.arg("n").toInt();      // which one: /switch?n=2 is the TV
  if (i >= 0 && i < 4) {
    on[i] = !on[i];                     // flip it
    digitalWrite(pins[i], on[i] ? HIGH : LOW);
    Serial.print(names[i]);
    Serial.println(on[i] ? " ON" : " OFF");
  }
  backHome();
}

void handleAllOff() {
  for (int i = 0; i < 4; i++) {
    on[i] = false;
    digitalWrite(pins[i], LOW);
  }
  Serial.println("All off");
  backHome();
}

void setup() {
  Serial.begin(115200);
  for (int i = 0; i < 4; i++) pinMode(pins[i], OUTPUT);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) delay(500);
  Serial.print("Open on the phone: http://");
  Serial.println(WiFi.localIP());
  server.on("/", handleRoot);
  server.on("/switch", handleSwitch);
  server.on("/alloff", handleAllOff);
  server.begin();
}

void loop() {
  server.handleClient();
}
`;
const ATTEND = `// Attendance register: each student taps an ID card; the LCD says who is present and counts the class
#include <SPI.h>
#include <MFRC522.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>

MFRC522 rfid(10, 9);                    // SDA (SS) on pin 10, RST on pin 9
LiquidCrystal_I2C lcd(0x27, 16, 2);    // address 0x27, 16 columns, 2 rows

String ids[] = {"A3 4F 1C 2D", "00 00 00 00"};   // the class list: card numbers...
String names[] = {"Asha", "Ravi"};               // ...and whose they are
bool present[] = {false, false};
int count = 0;

void showReady() {
  lcd.clear();
  lcd.print("Tap your card");
  lcd.setCursor(0, 1);
  lcd.print("Present: ");
  lcd.print(count);
}

void setup() {
  Serial.begin(9600);
  SPI.begin();
  rfid.PCD_Init();
  lcd.init();
  lcd.backlight();
  showReady();
}

void loop() {
  if (!rfid.PICC_IsNewCardPresent()) return;   // no card: look again
  if (!rfid.PICC_ReadCardSerial()) return;
  String uid = "";
  for (byte i = 0; i < rfid.uid.size; i++) {
    if (rfid.uid.uidByte[i] < 0x10) uid += "0";
    uid += String(rfid.uid.uidByte[i], HEX);
    if (i < rfid.uid.size - 1) uid += " ";
  }
  uid.toUpperCase();
  Serial.print("Card: ");
  Serial.println(uid);

  int who = -1;                          // find the card in the class list
  for (int i = 0; i < 2; i++) {
    if (uid == ids[i]) who = i;
  }
  lcd.clear();
  if (who == -1) {
    lcd.print("Unknown card");
    lcd.setCursor(0, 1);
    lcd.print(uid);
  } else if (present[who]) {
    lcd.print(names[who]);
    lcd.setCursor(0, 1);
    lcd.print("Already marked");
  } else {
    present[who] = true;
    count++;
    lcd.print(names[who] + " Present");
    lcd.setCursor(0, 1);
    lcd.print("Count: ");
    lcd.print(count);
    Serial.print(names[who]);
    Serial.println(" present");
  }
  rfid.PICC_HaltA();
  delay(2000);                           // time to read the screen
  showReady();
}
`;
const PONG = `// Pong for one player: turn the knob to move the paddle and keep the ball in play
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

Adafruit_SSD1306 display(128, 64, &Wire, -1);

int bx = 64, by = 20;      // the ball's corner (dots)
int dx = 2, dy = 2;        // how far it moves each frame
int paddleW = 24;          // the paddle's width (dots)
int score = 0;
int lives = 3;

void setup() {
  Serial.begin(9600);
  display.begin(SSD1306_SWITCHCAPVCC, 0x3C);
  display.setTextColor(SSD1306_WHITE);
}

void loop() {
  int px = map(analogRead(A0), 0, 1023, 0, 128 - paddleW);   // the knob moves the paddle

  bx += dx;
  by += dy;
  if (bx <= 0 || bx >= 125) dx = -dx;    // bounce off the side walls
  if (by <= 10) dy = -dy;                 // and off the top
  if (by >= 58) {                         // down at the paddle
    if (bx + 3 >= px && bx <= px + paddleW) {
      dy = -dy;                           // a hit: back up it goes
      score++;
      Serial.print("Hit! Score ");
      Serial.println(score);
    } else {
      lives--;                            // missed
      Serial.print("Missed! Lives ");
      Serial.println(lives);
      bx = 64;
      by = 20;
      dy = 2;
    }
  }

  display.clearDisplay();
  display.setCursor(0, 0);
  display.print("Score ");
  display.print(score);
  display.setCursor(80, 0);
  display.print("Lives ");
  display.print(lives);
  display.fillRect(bx, by, 3, 3, SSD1306_WHITE);        // the ball
  display.fillRect(px, 61, paddleW, 3, SSD1306_WHITE);  // the paddle
  display.display();

  if (lives == 0) {                       // the game is over: start again
    Serial.println("Game over");
    display.clearDisplay();
    display.setTextSize(2);
    display.setCursor(10, 24);
    display.print("GAME OVER");
    display.display();
    delay(3000);
    display.setTextSize(1);
    score = 0;
    lives = 3;
  }
  delay(20);
}
`;
const GESTURE = `# Gesture AI: teach the micro:bit three gestures by example, then it recognises them.
# Hold the board the way you want it, then: A = "L" (tilted left), B = "R" (tilted right),
# touch the logo = "F" (flat). Each example is three numbers from the accelerometer: x, y, z.
from microbit import *

examples = []                     # the training data: [x, y, z, label]

def feel():
    return [accelerometer.get_x(), accelerometer.get_y(), accelerometer.get_z()]

def distance(a, b):               # how different two readings are
    return ((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2) ** 0.5

def recognise(now):               # the nearest example wins (nearest neighbour)
    best = "?"
    best_d = 99999
    for ex in examples:
        d = distance(now, ex)
        if d < best_d:
            best_d = d
            best = ex[3]
    return best, best_d

while True:
    now = feel()
    label = None
    if button_a.was_pressed():
        label = "L"
    elif button_b.was_pressed():
        label = "R"
    elif pin_logo.was_touched():
        label = "F"
    if label:
        examples.append(now + [label])        # learn one example
        print("learned", label, len(examples))
        display.show(label)
        sleep(600)
    elif examples:
        guess, d = recognise(now)
        display.show(guess)
        print(guess, int(d))
        sleep(300)
    else:
        display.show("?")
        sleep(100)
`;
export const BATCH16_CODE = { HOME4, ATTEND, PONG, GESTURE };

export function batch16(K, n0) {
  const { P, F, W, need, has, noShort, unit } = K;
  const E = t3('', '', '');
  const X = {
    i2c: t3('{a} must go to {b}: on the Uno, A4 is SDA and A5 is SCL, the two I2C wires.', '{a} को {b} से जोड़िए: Uno पर A4 ही SDA है और A5 ही SCL, यही दो I2C तार हैं।', '{a} ko {b} se jodiye: Uno par A4 hi SDA hai aur A5 hi SCL, yahi do I2C wires hain.'),
    i2cSwap: t3('SDA and SCL are swapped. SDA (data) goes to A4, SCL (clock) to A5; swapped, the screen stays blank.', 'SDA और SCL उल्टे लगे हैं। SDA (डेटा) A4 पर, SCL (क्लॉक) A5 पर; उल्टे लगे तो स्क्रीन ख़ाली रहेगी।', 'SDA aur SCL ulte lage hain. SDA (data) A4 par, SCL (clock) A5 par; ulte lage to screen khaali rahegi.'),
    frontRails: t3('The front rails are not powered: join the back + rail to the front + rail and − to −.', 'आगे वाली रेलों को बिजली नहीं मिल रही: पीछे की + रेल को आगे की + रेल से और − को − से जोड़िए।', 'Aage wali rails ko power nahi mil rahi: peeche ki + rail ko aage ki + rail se aur − ko − se jodiye.'),
    rfid5v: t3('The RC522 is joined to 5V: it is a 3.3 V chip and would be damaged. Move its 3.3V pin to the Arduino\'s 3.3V.', 'RC522 को 5V मिल रहा है: यह 3.3 V की चिप है और ख़राब हो जाएगी। इसका 3.3V पिन Arduino के 3.3V पर लगाइए।', 'RC522 ko 5V mil raha hai: yeh 3.3 V ki chip hai aur kharab ho jaayegi. Iska 3.3V pin Arduino ke 3.3V par lagaiye.'),
  };
  const NN = { lcd: t3('LCD', 'एलसीडी', 'LCD'), rfid: t3('RFID reader', 'आरएफ़आईडी रीडर', 'RFID reader') };
  const CHECK = { k: 'check', do: t3('Check your circuit.', 'अपना सर्किट जाँचिए।', 'Apna circuit check karo.'), see: E };
  const RUN = (see) => ({ k: 'run', do: t3('Press Run.', '"चलाइए" दबाइए।', 'Run dabaiye.'), see: see || E });
  const w3 = (tag, pin, to, en, hi, hg, see) => ({ k: 'wire', wire: [tag + '.' + pin, to], do: t3(en, hi, hg), see: see || E });
  const fresh = (S) => S.runSrc !== null && S.t - (S.freshAt || 0) > 0.3;
  const net = (S) => S.lab.net4 || { seen: { pages: 0, paths: {} }, staIP: () => null };
  const paths = (S) => net(S).seen.paths || {};
  const body = (S) => ((net(S).seen.last || {}).body || '');
  let n = n0;
  const L = [];

  // 1 ---------------------------------------------------------------------------------------------- smart home, 4 switches
  const APP = [['led1', 'yellow', 30, 25, t3('Light', 'लाइट', 'Light')], ['led2', 'green', 35, 26, t3('Fan', 'पंखा', 'Pankha')], ['led3', 'red', 40, 27, t3('TV', 'टीवी', 'TV')], ['led4', 'red', 45, 33, t3('Pump', 'पंप', 'Pump')]];
  const lit = (S) => APP.filter(([t]) => S.ledLit(t)).length;
  L.push({ id: 'smarthome4', board: 'esp32', cls: '8', view: 'esp4', code: HOME4, drawer: [], baud: 115200, serial: true, phone: true,
    title: t3('Smart home: four switches on a web page', 'स्मार्ट होम: वेब पेज पर चार स्विच', 'Smart home: web page par chaar switch'),
    goal: t3('Four appliances (an LED stands in for each) get a Switch button each on the ESP32\'s web page, and an "All off" button. Switch them from a phone, then rename one, as a real smart-home app lets you.', 'चार उपकरणों (हर एक की जगह एक एलईडी) के लिए ESP32 के वेब पेज पर एक-एक Switch बटन, और एक "All off" बटन। फ़ोन से इन्हें चलाइए, फिर एक का नाम बदलिए, जैसे असली स्मार्ट-होम ऐप में होता है।', 'Chaar appliances (har ek ki jagah ek LED) ke liye ESP32 ke web page par ek-ek Switch button, aur ek "All off" button. Phone se inhe chalaiye, phir ek ka naam badaliye, jaise asli smart-home app mein hota hai.'),
    setup: { parts: APP.flatMap(([tag, color, c], i) => [P(tag, 'led', { color }, 'e' + c, 0), P('r' + (i + 1), 'resistor', { ohms: 220 }, 'b' + c, 3)]), wires: [['H:a5', rail('tn', 5)]] },
    steps: [
      { k: 'info', do: t3('Four LEDs stand for the appliances of a home: yellow the Light, green the Fan, red the TV, and the last red one the water Pump. Each has its 220 Ω resistor into the top − rail, which goes to the ESP32\'s GND.', 'चार एलईडी घर के उपकरणों की जगह हैं: पीली लाइट, हरी पंखा, लाल टीवी, और आख़िरी लाल पानी का पंप। हर एक का 220 Ω रेज़िस्टर ऊपर की − रेल में है, जो ESP32 के GND तक जाती है।', 'Chaar LED ghar ke appliances ki jagah hain: peeli Light, hari Pankha, laal TV, aur aakhri laal paani ka Pump. Har ek ka 220 Ω resistor upar ki − rail mein hai, jo ESP32 ke GND tak jaati hai.'),
        see: t3('In a real home each GPIO drives a relay module, and the relay switches the 230 V appliance. The program is the same.', 'असली घर में हर GPIO एक रिले मॉड्यूल चलाता है, और रिले 230 V का उपकरण चालू-बंद करता है। प्रोग्राम वही रहता है।', 'Asli ghar mein har GPIO ek relay module chalata hai, aur relay 230 V ka appliance on-off karta hai. Program wahi rehta hai.') },
      ...APP.map(([tag, , c, gp, nm]) => ({ k: 'wire', wire: [tag + '.A', 'D' + gp],
        do: t3(`Wire GPIO ${gp} to the ${nm.en} LED's long leg (column ${c + 1}).`, `GPIO ${gp} से ${nm.hi} वाली एलईडी के लंबे पैर (कॉलम ${c + 1}) तक वायर।`, `GPIO ${gp} se ${nm.hg} wali LED ke lambe pair (column ${c + 1}) tak wire.`), see: E })),
      CHECK,
      { k: 'info', code: [9, 11], do: t3('Read the three lists at the top: pins[], names[] and on[]. Item 0 of each is the Light, item 1 the Fan, and so on. One loop in page() writes a line and a button for every appliance.', 'ऊपर की तीन सूचियाँ पढ़िए: pins[], names[] और on[]। हर एक का item 0 लाइट है, item 1 पंखा, और आगे ऐसे ही। page() का एक लूप हर उपकरण के लिए एक लाइन और एक बटन लिखता है।', 'Upar ki teen lists padhiye: pins[], names[] aur on[]. Har ek ka item 0 Light hai, item 1 Pankha, aur aage aise hi. page() ka ek loop har appliance ke liye ek line aur ek button likhta hai.'),
        see: t3('Each button asks for /switch?n=0, 1, 2 or 3. One function, handleSwitch(), reads n with server.arg("n") and flips that one appliance.', 'हर बटन /switch?n=0, 1, 2 या 3 माँगता है। एक ही फ़ंक्शन, handleSwitch(), server.arg("n") से n पढ़ता है और उसी उपकरण को पलटता है।', 'Har button /switch?n=0, 1, 2 ya 3 maangta hai. Ek hi function, handleSwitch(), server.arg("n") se n padhta hai aur usi appliance ko palatta hai.') },
      RUN(t3('It joins the school WiFi and prints its address.', 'यह स्कूल के WiFi से जुड़ता है और अपना पता लिखता है।', 'Yeh school ke WiFi se judta hai aur apna address likhta hai.')),
      { k: 'watch', until: (S) => !!net(S).staIP() && S.lineCount() >= 1, do: t3('Wait for the address on the Serial Monitor.', 'सीरियल मॉनिटर पर पते का इंतज़ार कीजिए।', 'Serial Monitor par address ka intezaar kijiye.'), see: t3('Like http://192.168.1.47: the router gave it that address.', 'जैसे http://192.168.1.47: राउटर ने इसे वह पता दिया है।', 'Jaise http://192.168.1.47: router ne ise woh address diya hai.') },
      { k: 'act', until: (S) => (paths(S)['/'] || 0) >= 1, do: t3('On the phone, open that address in the browser.', 'फ़ोन पर ब्राउज़र में वह पता खोलिए।', 'Phone par browser mein woh address kholiye.'), see: t3('Four lines, each with its state and a Switch button: page() wrote all of them from the three lists.', 'चार लाइनें, हर एक में उसकी हालत और एक Switch बटन: page() ने तीनों सूचियों से सब लिखा।', 'Chaar lines, har ek mein uski haalat aur ek Switch button: page() ne teeno lists se sab likha.') },
      { k: 'act', until: (S) => S.ledLit('led1') && S.ledLit('led2'), do: t3('Switch on the Light and the Fan.', 'लाइट और पंखा चालू कीजिए।', 'Light aur Pankha on kijiye.'),
        see: t3('The phone asked for /switch?n=0, then /switch?n=1. The ESP32 answered "303, go to /", so the phone shows the main page again: tap refresh and nothing switches twice.', 'फ़ोन ने /switch?n=0, फिर /switch?n=1 माँगा। ESP32 ने जवाब दिया "303, / पर जाइए", इसलिए फ़ोन फिर मुख्य पेज दिखाता है: रिफ़्रेश दबाने से कुछ दो बार नहीं पलटता।', 'Phone ne /switch?n=0, phir /switch?n=1 maanga. ESP32 ne jawab diya "303, / par jaiye", isliye phone phir main page dikhata hai: refresh dabane se kuch do baar nahi palat-ta.') },
      { k: 'act', until: (S) => (paths(S)['/alloff'] || 0) >= 1 && lit(S) === 0, do: t3('Leaving home? Tap "All off".', 'घर से निकल रहे हैं? "All off" दबाइए।', 'Ghar se nikal rahe hain? "All off" dabaiye.'), see: t3('Everything off with one tap: one loop wrote LOW to all four pins.', 'एक बार दबाने से सब बंद: एक लूप ने चारों पिनों पर LOW लिखा।', 'Ek baar dabane se sab band: ek loop ne chaaron pins par LOW likha.') },
      { k: 'edit', test: (src) => /String\s+names\s*\[\s*4\s*\]\s*=\s*\{[^}]*"Geyser"/.test(src) && !/"Pump"/.test(src), set: [[/"Pump"/, '"Geyser"']],
        do: t3('Winter is here: the fourth switch now runs the bathroom geyser. In names[], change "Pump" to "Geyser" and press Run.', 'सर्दी आ गई: चौथा स्विच अब बाथरूम का गीज़र चलाता है। names[] में "Pump" को "Geyser" कीजिए और "चलाइए" दबाइए।', 'Sardi aa gayi: chautha switch ab bathroom ka geyser chalata hai. names[] mein "Pump" ko "Geyser" karo aur Run dabaiye.'), see: E },
      { k: 'act', until: (S) => fresh(S) && S.ledLit('led4') && /Geyser is <b>ON/.test(body(S)), do: t3('Open the page again and switch on the Geyser.', 'पेज फिर से खोलिए और गीज़र चालू कीजिए।', 'Page phir se kholiye aur Geyser on kijiye.'),
        see: t3('A new name on the page and nothing else changed: the page is made from the list. Real smart-home apps work the same way, with a list of devices the owner can rename.', 'पेज पर नया नाम और बाक़ी कुछ नहीं बदला: पेज सूची से बनता है। असली स्मार्ट-होम ऐप भी ऐसे ही चलते हैं, उपकरणों की सूची के साथ जिसके नाम मालिक बदल सकता है।', 'Page par naya naam aur baaki kuch nahi badla: page list se banta hai. Asli smart-home apps bhi aise hi chalte hain, devices ki list ke saath jiske naam owner badal sakta hai.') },
    ],
    check: APP.map(([tag, , , gp, nm], i) => unit(tag, 'r' + (i + 1), gp, nm)),
    done: (S) => (paths(S)['/alloff'] || 0) >= 1 && S.ledLit('led4') && /Geyser is <b>ON/.test(body(S)) });

  // 2 ---------------------------------------------------------------------------------------------- RFID attendance register
  const POWER = [['5V', 'H:tp30'], ['GND3', 'H:tn18'], ['H:tp2', 'H:bp2'], ['H:tn3', 'H:bn3']];
  const rails = [noShort, (S) => (S.conn('rail:tp', '5V') ? null : [W.vRail]), (S) => (S.conn('rail:tn', 'GND') ? null : [W.gndRail]), (S) => (S.conn('rail:bp', '5V') && S.conn('rail:bn', 'GND') ? null : [X.frontRails])];
  L.push({ id: 'attendance', cls: '8', blocks: false, view: 'wide', rview: 'scene3', code: ATTEND, drawer: ['rfid', 'lcd16'], serial: true, scene: { kind: 'attend' },
    title: t3('RFID attendance register', 'आरएफ़आईडी हाज़िरी रजिस्टर', 'RFID attendance register'),
    goal: t3('Each student taps an ID card at the classroom door: the LCD greets them by name and counts who is present. A card not on the list is shown with its number, and nobody is counted twice.', 'हर छात्र कक्षा के दरवाज़े पर अपना आईडी कार्ड लगाता है: एलसीडी नाम से स्वागत करती है और हाज़िर बच्चों को गिनती है। सूची से बाहर का कार्ड उसके नंबर के साथ दिखता है, और किसी को दो बार नहीं गिना जाता।', 'Har student class ke darwaze par apna ID card lagata hai: LCD naam se swagat karti hai aur haazir bachchon ko ginti hai. List se bahar ka card uske number ke saath dikhta hai, aur kisi ko do baar nahi gina jaata.'),
    setup: { parts: [], wires: POWER },
    steps: [
      { k: 'info', do: t3('Calling the roll takes ten minutes of every school day. Today\'s register does it in a second per student: an RC522 RFID reader at the door and a 16×2 LCD. Two students to start with: Asha has the white card, Ravi the blue tag.', 'हाज़िरी लेने में हर दिन दस मिनट लगते हैं। आज का रजिस्टर हर छात्र के लिए एक सेकंड लेता है: दरवाज़े पर RC522 आरएफ़आईडी रीडर और एक 16×2 एलसीडी। शुरुआत में दो छात्र: आशा के पास सफ़ेद कार्ड है, रवि के पास नीला टैग।', 'Haaziri lene mein har din das minute lagte hain. Aaj ka register har student ke liye ek second leta hai: darwaze par RC522 RFID reader aur ek 16×2 LCD. Shuruaat mein do student: Asha ke paas safed card hai, Ravi ke paas neela tag.'), see: E },
      { k: 'place', place: F('rf', 'rfid', {}, 40, 152, 0), do: t3('Put the RFID reader on the mat at the ghost.', 'आरएफ़आईडी रीडर को मैट पर नीली आकृति पर रखिए।', 'RFID reader ko mat par neeli shape par rakhiye.'), see: E },
      w3('rf', 'SDA', 'D10', 'Wire SDA (its first pin) to pin 10.', 'SDA (पहला पिन) को पिन 10 से जोड़िए।', 'SDA (pehla pin) ko pin 10 se jodiye.'),
      w3('rf', 'SCK', 'D13', 'SCK to pin 13.', 'SCK को पिन 13 से।', 'SCK ko pin 13 se.'),
      w3('rf', 'MOSI', 'D11', 'MOSI to pin 11.', 'MOSI को पिन 11 से।', 'MOSI ko pin 11 se.'),
      w3('rf', 'MISO', 'D12', 'MISO to pin 12.', 'MISO को पिन 12 से।', 'MISO ko pin 12 se.', t3('Pins 11, 12 and 13 are the Uno\'s SPI pins: MOSI carries the Arduino\'s words to the reader, MISO the answer back, SCK the clock.', 'पिन 11, 12 और 13 Uno के SPI पिन हैं: MOSI Arduino की बात रीडर तक ले जाता है, MISO जवाब वापस, SCK घड़ी।', 'Pin 11, 12 aur 13 Uno ke SPI pin hain: MOSI Arduino ki baat reader tak le jaata hai, MISO jawab wapas, SCK ghadi.')),
      w3('rf', 'RST', 'D9', 'RST to pin 9 (skip IRQ).', 'RST को पिन 9 से (IRQ छोड़िए)।', 'RST ko pin 9 se (IRQ chhodiye).'),
      w3('rf', 'GND', 'rail:bn', 'GND to the front − rail.', 'GND को आगे वाली − रेल से।', 'GND ko aage wali − rail se.'),
      w3('rf', 'V33', '3V3', 'And 3.3V to the Arduino\'s 3.3V pin, not 5V!', 'और 3.3V को Arduino के 3.3V पिन से, 5V से नहीं!', 'Aur 3.3V ko Arduino ke 3.3V pin se, 5V se nahi!'),
      { k: 'place', place: F('lcd', 'lcd16', {}, -128, 66, 0), do: t3('Put the LCD on the mat at the ghost, in front of the board.', 'एलसीडी को मैट पर नीली आकृति पर, बोर्ड के सामने रखिए।', 'LCD ko mat par neeli shape par, board ke saamne rakhiye.'), see: E },
      w3('lcd', 'GND', 'rail:bn', 'Wire the LCD\'s GND to the front − rail.', 'एलसीडी का GND आगे वाली − रेल से जोड़िए।', 'LCD ka GND aage wali − rail se jodiye.'),
      w3('lcd', 'VCC', 'rail:bp', 'Its VCC to the front + rail (the LCD takes 5 V).', 'इसका VCC आगे वाली + रेल से (एलसीडी 5 V लेती है)।', 'Iska VCC aage wali + rail se (LCD 5 V leti hai).'),
      w3('lcd', 'SDA', 'A4', 'Its SDA to A4.', 'इसका SDA, A4 से।', 'Iska SDA, A4 se.'),
      w3('lcd', 'SCL', 'A5', 'Its SCL to A5.', 'इसका SCL, A5 से।', 'Iska SCL, A5 se.', t3('Two buses on one Arduino: SPI for the reader, I2C for the screen. Each has its own pins, so they never get in each other\'s way.', 'एक Arduino पर दो बस: रीडर के लिए SPI, स्क्रीन के लिए I2C। हर एक के अपने पिन हैं, इसलिए ये एक-दूसरे के रास्ते में नहीं आतीं।', 'Ek Arduino par do bus: reader ke liye SPI, screen ke liye I2C. Har ek ke apne pin hain, isliye ye ek-doosre ke raaste mein nahi aati.')),
      CHECK,
      { k: 'info', code: [10, 13], do: t3('Read the class list: ids[] holds the card numbers and names[] whose they are, in the same order. present[] remembers who has come, and count adds them up.', 'कक्षा की सूची पढ़िए: ids[] में कार्ड के नंबर हैं और names[] में किसके हैं, उसी क्रम में। present[] याद रखता है कि कौन आ चुका है, और count उन्हें जोड़ता है।', 'Class ki list padhiye: ids[] mein card ke number hain aur names[] mein kiske hain, usi kram mein. present[] yaad rakhta hai ki kaun aa chuka hai, aur count unhe jodta hai.'),
        see: t3('Ravi\'s number is still "00 00 00 00": nobody has read his tag yet.', 'रवि का नंबर अभी "00 00 00 00" है: अभी किसी ने उसका टैग नहीं पढ़ा।', 'Ravi ka number abhi "00 00 00 00" hai: abhi kisi ne uska tag nahi padha.') },
      RUN(t3('"Tap your card" and "Present: 0" on the LCD.', 'एलसीडी पर "Tap your card" और "Present: 0"।', 'LCD par "Tap your card" aur "Present: 0".')),
      { k: 'act', until: (S) => S.w('asha'), do: t3('In the door panel, tap Asha\'s white card on the reader.', 'दरवाज़े के पैनल में आशा का सफ़ेद कार्ड रीडर पर लगाइए।', 'Darwaze ke panel mein Asha ka safed card reader par lagaiye.'),
        see: t3('"Asha Present", "Count: 1". The loop found her card\'s number at place 0 of ids[], so it took names[0].', '"Asha Present", "Count: 1"। लूप ने उसके कार्ड का नंबर ids[] की जगह 0 पर पाया, इसलिए names[0] लिया।', '"Asha Present", "Count: 1". Loop ne uske card ka number ids[] ki jagah 0 par paaya, isliye names[0] liya.') },
      { k: 'act', until: (S) => S.w('unknown'), do: t3('Now Ravi taps his blue tag.', 'अब रवि अपना नीला टैग लगाता है।', 'Ab Ravi apna neela tag lagata hai.'),
        see: t3('"Unknown card" and its number, 5B 2E 91 C4: the tag is not on the list yet. Write the number down.', '"Unknown card" और उसका नंबर, 5B 2E 91 C4: टैग अभी सूची में नहीं है। नंबर लिख लीजिए।', '"Unknown card" aur uska number, 5B 2E 91 C4: tag abhi list mein nahi hai. Number likh lijiye.') },
      { k: 'edit', test: (src) => /String\s+ids\s*\[\s*\]\s*=\s*\{[^}]*"5B 2E 91 C4"/i.test(src), set: [[/"00 00 00 00"/, '"5B 2E 91 C4"']],
        do: t3('Put Ravi on the list: in ids[], change "00 00 00 00" to his tag\'s number, "5B 2E 91 C4", and press Run.', 'रवि को सूची में डालिए: ids[] में "00 00 00 00" को उसके टैग के नंबर "5B 2E 91 C4" से बदलिए और "चलाइए" दबाइए।', 'Ravi ko list mein daaliye: ids[] mein "00 00 00 00" ko uske tag ke number "5B 2E 91 C4" se badaliye aur Run dabaiye.'), see: E },
      { k: 'act', until: (S) => fresh(S) && S.w('asha') && S.w('ravi') && S.w('n2'), do: t3('A new morning: Asha taps her card, then Ravi his tag.', 'नई सुबह: आशा अपना कार्ड लगाती है, फिर रवि अपना टैग।', 'Nayi subah: Asha apna card lagati hai, phir Ravi apna tag.'),
        see: t3('"Ravi Present", "Count: 2". The register knows the whole class now.', '"Ravi Present", "Count: 2"। रजिस्टर अब पूरी कक्षा को जानता है।', '"Ravi Present", "Count: 2". Register ab poori class ko jaanta hai.') },
      { k: 'act', until: (S) => fresh(S) && S.w('already') && S.w('n2') && !S.w('n3'), do: t3('Asha taps her card once more, as if for a friend who is absent.', 'आशा एक बार फिर अपना कार्ड लगाती है, जैसे किसी ग़ैरहाज़िर दोस्त के लिए।', 'Asha ek baar phir apna card lagati hai, jaise kisi gairhaazir dost ke liye.'),
        see: live((lg, R) => (!R.names ? '' : pick(lg, `Your results: ${R.names.join(' and ')} marked present, the count stopped at ${R.count}, and the second tap only said "Already marked". present[] remembered her, so the class cannot be counted twice. Schools and offices send the same list to a computer every day.`,
          `आपके नतीजे: ${R.names.join(' और ')} हाज़िर दर्ज हुए, गिनती ${R.count} पर रुकी, और दूसरी बार लगाने पर सिर्फ़ "Already marked" आया। present[] ने उसे याद रखा, इसलिए कक्षा को दो बार नहीं गिना जा सकता। स्कूल और दफ़्तर यही सूची हर दिन कंप्यूटर पर भेजते हैं।`,
          `Aapke results: ${R.names.join(' aur ')} haazir darj hue, ginti ${R.count} par ruki, aur doosri baar lagane par sirf "Already marked" aaya. present[] ne use yaad rakha, isliye class ko do baar nahi gina ja sakta. School aur office yahi list har din computer par bhejte hain.`))) },
    ],
    check: [...rails, has('rf', NN.rfid), (S) => (S.conn('rf.V33', '5V') ? [X.rfid5v] : null), need('rf.V33', '3V3', W.join, { a: '3.3V', b: t3('the Arduino\'s 3.3V pin', 'Arduino का 3.3V पिन', 'Arduino ka 3.3V pin') }), need('rf.GND', 'GND', W.toGnd, { x: NN.rfid }),
      need('rf.SDA', 'D10', W.toPin, { x: 'SDA', p: 10 }), need('rf.SCK', 'D13', W.toPin, { x: 'SCK', p: 13 }), need('rf.MOSI', 'D11', W.toPin, { x: 'MOSI', p: 11 }), need('rf.MISO', 'D12', W.toPin, { x: 'MISO', p: 12 }), need('rf.RST', 'D9', W.toPin, { x: 'RST', p: 9 }),
      has('lcd', NN.lcd), need('lcd.VCC', '5V', W.to5v, { x: NN.lcd }), need('lcd.GND', 'GND', W.toGnd, { x: NN.lcd }), (S) => (S.conn('lcd.SDA', 'A5') && S.conn('lcd.SCL', 'A4') ? [X.i2cSwap] : null),
      need('lcd.SDA', 'A4', X.i2c, { a: 'SDA', b: 'A4' }), need('lcd.SCL', 'A5', X.i2c, { a: 'SCL', b: 'A5' })],
    done: (S) => S.w('ravi') && S.w('already') });

  // 3 ---------------------------------------------------------------------------------------------- Pong on an OLED with a knob
  // the lesson watches the Serial Monitor's "Hit! Score n" and "Missed! Lives n" lines (memRun: score, hits, misses)
  const RT = { S: null };
  const tickPong = (S) => {
    RT.S = S; const R = S.memRun; const total = S.lineCount(); const fresh0 = total - (R.seenLines || 0); R.seenLines = total;
    if (fresh0 > 0) for (const ln of (S.serLines || []).slice(-Math.min(fresh0, 80))) {
      const h = /Hit! Score (\d+)/.exec(ln); if (h) { R.hits = (R.hits || 0) + 1; R.score = Math.max(R.score || 0, +h[1]); }
      if (/Missed!/.test(ln)) R.misses = (R.misses || 0) + 1;
      if (/Game over/.test(ln)) R.overs = (R.overs || 0) + 1;
    }
  };
  const liveRT = (f) => { const o = {}; for (const lg of ['en', 'hi', 'hg']) Object.defineProperty(o, lg, { enumerable: true, get: () => { try { return RT.S ? String(f(lg, RT.S.memRun, RT.S) || '') : ''; } catch (e) { return ''; } } }); return o; };
  const XP = {
    wiper: t3('The knob\'s middle leg (the wiper) must go to A0: it is the paddle\'s position.', 'नॉब का बीच वाला पैर (वाइपर) A0 पर जाना चाहिए: यही पैडल की जगह है।', 'Knob ka beech wala pair (wiper) A0 par jaana chahiye: yahi paddle ki jagah hai.'),
    ends: t3('The knob\'s two outer legs go to opposite rails: one to − (GND), the other to + (5 V). On the same rail its voltage cannot change, and the paddle never moves.', 'नॉब के दोनों बाहरी पैर उलटी रेलों पर: एक − (GND) पर, दूसरा + (5 V) पर। एक ही रेल पर इसका वोल्टेज बदल नहीं सकता, और पैडल कभी नहीं हिलता।', 'Knob ke dono bahari pair ulti rails par: ek − (GND) par, doosra + (5 V) par. Ek hi rail par iska voltage badal nahi sakta, aur paddle kabhi nahi hilta.'),
    oledI2c: t3('{a} must go to {b}: on the Uno, A4 is SDA and A5 is SCL.', '{a} को {b} से जोड़िए: Uno पर A4 ही SDA है और A5 ही SCL।', '{a} ko {b} se jodiye: Uno par A4 hi SDA hai aur A5 hi SCL.'),
  };
  L.push({ id: 'pong', cls: '8', blocks: false, view: 'wide', rview: 'bb', code: PONG, drawer: ['pot'], serial: true, tick: tickPong,
    title: t3('Pong on an OLED with a knob', 'ओएलईडी पर पोंग, नॉब से', 'OLED par Pong, knob se'),
    goal: t3('Make the first video game, Pong (1972), for one player: a ball bounces round a 128 × 64 screen, and a knob slides the paddle that keeps it in play. Then make it harder.', 'पहला वीडियो गेम, पोंग (1972), एक खिलाड़ी के लिए बनाइए: गेंद 128 × 64 स्क्रीन पर उछलती है, और एक नॉब पैडल को खिसकाता है जो उसे खेल में रखता है। फिर इसे मुश्किल बनाइए।', 'Pehla video game, Pong (1972), ek khiladi ke liye banaiye: ball 128 × 64 screen par uchhalti hai, aur ek knob paddle ko khiskata hai jo use khel mein rakhta hai. Phir ise mushkil banaiye.'),
    setup: { parts: [P('oled', 'oled', {}, 'e20', 0)], wires: [...POWER, ['H:a20', railN('tn', 20)], ['H:a21', railN('tp', 21)], ['H:a22', 'A5'], ['H:a23', 'A4']] },
    steps: [
      { k: 'info', do: t3('The OLED is ready on I2C (SDA A4, SCL A5). Now the game controller: a 10 kΩ knob. Its middle leg gives 0 V to 5 V as you turn it, and analogRead() turns that into 0 to 1023.', 'ओएलईडी I2C पर तैयार है (SDA A4, SCL A5)। अब गेम का कंट्रोलर: 10 kΩ का नॉब। घुमाने पर इसका बीच वाला पैर 0 V से 5 V देता है, और analogRead() उसे 0 से 1023 बना देता है।', 'OLED I2C par taiyaar hai (SDA A4, SCL A5). Ab game ka controller: 10 kΩ ka knob. Ghumane par iska beech wala pair 0 V se 5 V deta hai, aur analogRead() use 0 se 1023 bana deta hai.'), see: E },
      { k: 'place', place: P('pot1', 'pot', {}, 'f30', 0), do: t3('Put the knob in the ghost: legs in 30f, 32f and 34f.', 'नॉब नीली आकृति में रखिए: पैर 30f, 32f और 34f में।', 'Knob neeli shape mein rakhiye: pair 30f, 32f aur 34f mein.'), see: E },
      w3('pot1', '1', 'rail:bn', 'Wire its left leg (column 30) to the front − rail.', 'इसका बायाँ पैर (कॉलम 30) आगे वाली − रेल से जोड़िए।', 'Iska left pair (column 30) aage wali − rail se jodiye.'),
      w3('pot1', '3', 'rail:bp', 'Its right leg (column 34) to the front + rail.', 'इसका दायाँ पैर (कॉलम 34) आगे वाली + रेल से।', 'Iska right pair (column 34) aage wali + rail se.'),
      w3('pot1', 'W', 'A0', 'Its middle leg (column 32) to A0.', 'इसका बीच वाला पैर (कॉलम 32) A0 से।', 'Iska beech wala pair (column 32) A0 se.'),
      CHECK,
      { k: 'info', code: [21, 21], do: t3('Read the first line of loop(): map() turns the knob\'s 0–1023 into the paddle\'s left edge, 0 to 104 dots (128 minus the paddle\'s 24).', 'loop() की पहली लाइन पढ़िए: map() नॉब के 0–1023 को पैडल के बाएँ किनारे में बदलता है, 0 से 104 बिंदु (128 में से पैडल के 24 घटाकर)।', 'loop() ki pehli line padhiye: map() knob ke 0–1023 ko paddle ke left kinare mein badalta hai, 0 se 104 dots (128 mein se paddle ke 24 ghata kar).'),
        see: t3('Each loop moves the ball 2 dots across and 2 down, draws the whole picture in memory, and display() sends it to the screen: about 25 pictures a second, like a cartoon.', 'हर लूप गेंद को 2 बिंदु आड़ा और 2 नीचे ले जाता है, पूरी तस्वीर मेमोरी में बनाता है, और display() उसे स्क्रीन पर भेजता है: एक सेकंड में लगभग 25 तस्वीरें, कार्टून की तरह।', 'Har loop ball ko 2 dot aada aur 2 neeche le jaata hai, poori tasveer memory mein banata hai, aur display() use screen par bhejta hai: ek second mein lagbhag 25 tasveerein, cartoon ki tarah.') },
      RUN(t3('The score, three lives, the ball and the paddle.', 'स्कोर, तीन ज़िंदगियाँ, गेंद और पैडल।', 'Score, teen zindagiyaan, ball aur paddle.')),
      { k: 'watch', until: (S) => (S.memRun.misses || 0) >= 1, do: t3('Do not touch the knob yet: watch where the ball lands.', 'अभी नॉब को मत छूइए: देखिए गेंद कहाँ गिरती है।', 'Abhi knob ko mat chhooiye: dekhiye ball kahan girti hai.'),
        see: t3('It falls past the paddle: "Missed! Lives 2". The program checks only one thing at the bottom: is the ball between px and px + paddleW?', 'वह पैडल के बगल से गिर जाती है: "Missed! Lives 2"। नीचे प्रोग्राम एक ही बात जाँचता है: क्या गेंद px और px + paddleW के बीच है?', 'Woh paddle ke bagal se gir jaati hai: "Missed! Lives 2". Neeche program ek hi baat jaanchta hai: kya ball px aur px + paddleW ke beech hai?') },
      { k: 'act', until: (S) => (S.memRun.score || 0) >= 3, do: t3('Now play: drag the knob to keep the paddle under the ball. Score 3 points.', 'अब खेलिए: नॉब घुमाकर पैडल को गेंद के नीचे रखिए। 3 अंक बनाइए।', 'Ab kheliye: knob ghuma kar paddle ko ball ke neeche rakhiye. 3 ank banaiye.'),
        see: t3('Each hit turns dy round (2 becomes −2), and the ball climbs again. Lose all three lives and the screen says GAME OVER, then a new game starts.', 'हर हिट dy को पलट देता है (2 से −2), और गेंद फिर ऊपर चढ़ती है। तीनों ज़िंदगियाँ गईं तो स्क्रीन पर GAME OVER, फिर नया खेल शुरू।', 'Har hit dy ko palat deta hai (2 se −2), aur ball phir upar chadhti hai. Teeno zindagiyaan gayi to screen par GAME OVER, phir naya khel shuru.') },
      { k: 'edit', test: (src) => { const m = /int\s+paddleW\s*=\s*(\d+)\s*;/.exec(src); return !!m && +m[1] >= 8 && +m[1] <= 16; }, set: [[/int paddleW = 24;/, 'int paddleW = 14;']],
        do: t3('Too easy? Make the paddle narrower: change paddleW = 24 to 14 and press Run.', 'बहुत आसान? पैडल पतला कीजिए: paddleW = 24 को 14 कीजिए और "चलाइए" दबाइए।', 'Bahut aasaan? Paddle patla kijiye: paddleW = 24 ko 14 karo aur Run dabaiye.'), see: E },
      { k: 'act', until: (S) => S.runSrc !== null && /paddleW\s*=\s*(?:[89]|1[0-6])\s*;/.test(S.runSrc) && (S.memRun.score || 0) >= 2, do: t3('Play again with the narrow paddle: score 2.', 'पतले पैडल से फिर खेलिए: 2 अंक बनाइए।', 'Patle paddle se phir kheliye: 2 ank banaiye.'),
        see: liveRT((lg, R) => (R.hits === undefined ? '' : pick(lg, `Your results with the narrow paddle: ${R.hits} hits and ${R.misses || 0} misses. One number in the code changed the whole game: game designers tune levels exactly like this, a paddle a little smaller or a ball a little faster.`,
          `पतले पैडल के साथ आपके नतीजे: ${R.hits} हिट और ${R.misses || 0} मिस। कोड की एक संख्या ने पूरा खेल बदल दिया: गेम डिज़ाइनर लेवल ठीक ऐसे ही बनाते हैं, पैडल थोड़ा छोटा या गेंद थोड़ी तेज़।`,
          `Patle paddle ke saath aapke results: ${R.hits} hit aur ${R.misses || 0} miss. Code ke ek number ne poora khel badal diya: game designer level bilkul aise hi banate hain, paddle thoda chhota ya ball thodi tez.`))) },
    ],
    check: [...rails, has('oled', t3('OLED', 'ओएलईडी', 'OLED')), (S) => (S.conn('oled.SDA', 'A5') && S.conn('oled.SCL', 'A4') ? [X.i2cSwap] : null), need('oled.SDA', 'A4', XP.oledI2c, { a: 'SDA', b: 'A4' }), need('oled.SCL', 'A5', XP.oledI2c, { a: 'SCL', b: 'A5' }),
      has('pot1', t3('knob', 'नॉब', 'knob')), need('pot1.W', 'A0', XP.wiper), (S) => ((S.conn('pot1.1', 'GND') && S.conn('pot1.3', '5V')) || (S.conn('pot1.1', '5V') && S.conn('pot1.3', 'GND')) ? null : [XP.ends])],
    done: (S) => S.runSrc !== null && /paddleW\s*=\s*(?:[89]|1[0-6])\s*;/.test(S.runSrc) && (S.memRun.score || 0) >= 2 });

  for (const l of L) { l.n = ++n; l.batch = 16; if (l.scene) l.world = l.scene; } // (the lesson runtime asks the "world": worlds3.js makes it from the scene)
  return L;
}

// ------------------------------------------------------------------ batch 16, micro:bit: Class 8 gesture AI (page only,
// like the other micro:bit batches; devtools/test/robocore16.mjs plays it on a real MBCore)
const tiltOf = (B) => { const { roll, pitch } = B.tilt; return pitch > 45 ? 'up' : roll < -30 ? 'left' : roll > 30 ? 'right' : 'flat'; };
export function batch16mb(K, n0) {
  const E = t3('', '', '');
  const make = (app, cfg) => new MBCore(app, cfg);
  const world = (o) => Object.assign({ kind: 'mb', make, centre: (focus) => ({ c: [MBX, 0, 0], k: focus === 'robot' ? 0.55 : 1 }) }, o);
  // what the program printed, with how the board was held at that moment: memRun.seen[tilt] = { g, d }, memRun.taught[label]
  const tick = (S) => {
    const R = S.memRun; const total = S.lineCount(); const nw = total - (R.seenLines || 0); R.seenLines = total; if (nw <= 0) return;
    const B = S.app.world && S.app.world.boards && S.app.world.boards[0]; const tl = B ? tiltOf(B) : 'flat';
    for (const ln of (S.serLines || []).slice(-Math.min(nw, 80))) {
      const m = /^learned ([LRF]) (\d+)$/.exec(String(ln).trim()); if (m) { (R.taught || (R.taught = {}))[m[1]] = ((R.taught || {})[m[1]] || 0) + 1; R.n = +m[2]; (R.taughtAt || (R.taughtAt = {}))[m[1]] = tl; }
      const g = /^([LRF?]) (\d+)$/.exec(String(ln).trim()); if (g) { (R.seen || (R.seen = {}))[tl] = { g: g[1], d: +g[2], n: R.n || 0 }; (S.mem.dists || (S.mem.dists = {}))[tl + g[1]] = +g[2]; }
    }
  };
  const seen = (S, tl) => (S.memRun.seen || {})[tl] || {};
  const taught = (S, k) => (S.memRun.taught || {})[k] || 0;
  const liveRT = (f) => { const o = {}; for (const lg of ['en', 'hi', 'hg']) Object.defineProperty(o, lg, { enumerable: true, get: () => { try { return RTM.S ? String(f(lg, RTM.S) || '') : ''; } catch (e) { return ''; } } }); return o; };
  const RTM = { S: null };
  let n = n0;
  const L = [{ id: 'mbgestureai', view: 'mb', code: GESTURE, drawer: [], serial: true, tick: (S) => { RTM.S = S; tick(S); },
    title: t3('Gesture AI: teach by example', 'जेस्चर एआई: उदाहरण से सिखाइए', 'Gesture AI: udaharan se sikhaiye'),
    goal: t3('Train a tiny AI on the micro:bit with no rules at all: show it examples of three ways of holding it, and it recognises them by the nearest example. Then find out what it does with something it was never taught, and teach it to say "I don\'t know".', 'micro:bit पर एक छोटा एआई बिना किसी नियम के सिखाइए: इसे पकड़ने के तीन तरीक़ों के उदाहरण दिखाइए, और यह सबसे पास वाले उदाहरण से उन्हें पहचानता है। फिर देखिए कि जो कभी नहीं सिखाया उसका यह क्या करता है, और इसे "मुझे नहीं पता" कहना सिखाइए।', 'micro:bit par ek chhota AI bina kisi niyam ke sikhaiye: ise pakadne ke teen tareekon ke udaharan dikhaiye, aur yeh sabse paas wale udaharan se unhe pehchaanta hai. Phir dekhiye ki jo kabhi nahi sikhaya uska yeh kya karta hai, aur ise "mujhe nahi pata" kehna sikhaiye.'),
    world: world({ scene: 'desk', controls: ['tilt', 'A', 'B', 'logo'], hud: ['acc'], title: t3('Gesture AI', 'जेस्चर एआई', 'Gesture AI') }),
    setup: { parts: [], wires: [] },
    steps: [
      { k: 'info', code: [6, 6], do: t3('No if-rules about angles anywhere: the program keeps a list of examples. Each one is three numbers from the accelerometer (x, y, z) and a name: L, R or F.', 'कोणों के कोई if-नियम कहीं नहीं: प्रोग्राम उदाहरणों की एक सूची रखता है। हर एक में एक्सेलेरोमीटर की तीन संख्याएँ (x, y, z) और एक नाम: L, R या F।', 'Angles ke koi if-niyam kahin nahi: program udaharanon ki ek list rakhta hai. Har ek mein accelerometer ke teen number (x, y, z) aur ek naam: L, R ya F.'), see: E },
      { k: 'info', code: [11, 22], do: t3('distance() measures how different two readings are (Pythagoras in 3D). recognise() goes through every example and keeps the nearest one. This is the nearest-neighbour method, one of the oldest in machine learning.', 'distance() नापता है कि दो रीडिंग कितनी अलग हैं (3D में पाइथागोरस)। recognise() हर उदाहरण देखता है और सबसे पास वाला रखता है। यह nearest-neighbour तरीक़ा है, मशीन लर्निंग के सबसे पुराने तरीक़ों में से एक।', 'distance() naapta hai ki do reading kitni alag hain (3D mein Pythagoras). recognise() har udaharan dekhta hai aur sabse paas wala rakhta hai. Yeh nearest-neighbour tareeka hai, machine learning ke sabse purane tareekon mein se ek.'), see: E },
      { k: 'run', do: t3('Press Run.', '"चलाइए" दबाइए।', 'Run dabaiye.'), see: t3('"?": it knows nothing yet.', '"?": अभी यह कुछ नहीं जानता।', '"?": abhi yeh kuch nahi jaanta.') },
      { k: 'act', until: (S) => taught(S, 'L') >= 2 && (S.memRun.taughtAt || {}).L === 'left', do: t3('Teach "L": tilt the board left ("Hold it": left) and press A twice.', '"L" सिखाइए: बोर्ड बाईं ओर झुकाइए ("ऐसे पकड़िए": बाएँ) और A दो बार दबाइए।', '"L" sikhaiye: board left jhukaiye ("Hold it": left) aur A do baar dabaiye.'), see: t3('"learned L 1", "learned L 2": two examples in the list.', '"learned L 1", "learned L 2": सूची में दो उदाहरण।', '"learned L 1", "learned L 2": list mein do udaharan.') },
      { k: 'act', until: (S) => taught(S, 'R') >= 2 && (S.memRun.taughtAt || {}).R === 'right', do: t3('Teach "R": tilt it right and press B twice.', '"R" सिखाइए: इसे दाईं ओर झुकाइए और B दो बार दबाइए।', '"R" sikhaiye: ise right jhukaiye aur B do baar dabaiye.'), see: E },
      { k: 'act', until: (S) => seen(S, 'left').g === 'L' && seen(S, 'right').g === 'R' && seen(S, 'left').n >= 4 && seen(S, 'right').n >= 4, do: t3('Test it: tilt it left, then right.', 'जाँचिए: इसे बाईं ओर, फिर दाईं ओर झुकाइए।', 'Check kijiye: ise left, phir right jhukaiye.'),
        see: t3('L, then R, and the Serial Monitor shows how near the best example was: a small number.', 'L, फिर R, और सीरियल मॉनिटर दिखाता है कि सबसे अच्छा उदाहरण कितना पास था: एक छोटी संख्या।', 'L, phir R, aur Serial Monitor dikhata hai ki sabse achha udaharan kitna paas tha: ek chhoti sankhya.') },
      { k: 'act', until: (S) => /^[LR]$/.test(seen(S, 'flat').g || '') && (seen(S, 'flat').d || 0) > 500, do: t3('Now lay it flat, a way you never taught. What does it say?', 'अब इसे सीधा रखिए, ऐसा तरीक़ा जो आपने कभी नहीं सिखाया। यह क्या कहता है?', 'Ab ise seedha rakhiye, aisa tareeka jo aapne kabhi nahi sikhaya. Yeh kya kehta hai?'),
        see: liveRT((lg, S) => { const v = seen(S, 'flat'); return v.g ? pick(lg, `It says ${v.g}: wrong, but it can only answer with names it knows. Look at the distance: ${v.d}, far bigger than before. An AI is only as good as its training data.`, `यह ${v.g} कहता है: ग़लत, पर यह सिर्फ़ उन्हीं नामों से जवाब दे सकता है जो यह जानता है। दूरी देखिए: ${v.d}, पहले से बहुत ज़्यादा। एआई उतना ही अच्छा है जितना उसका ट्रेनिंग डेटा।`, `Yeh ${v.g} kehta hai: galat, par yeh sirf unhi naamon se jawab de sakta hai jo yeh jaanta hai. Distance dekhiye: ${v.d}, pehle se bahut zyada. AI utna hi achha hai jitna uska training data.`) : ''; }) },
      { k: 'act', until: (S) => taught(S, 'F') >= 1 && seen(S, 'flat').g === 'F', do: t3('Teach "F": keep it flat and touch the logo.', '"F" सिखाइए: इसे सीधा रखिए और लोगो छूइए।', '"F" sikhaiye: ise seedha rakhiye aur logo chhooiye.'), see: t3('Now flat is F. More kinds of examples, more it can recognise.', 'अब सीधा F है। जितनी तरह के उदाहरण, उतना ज़्यादा यह पहचान सकता है।', 'Ab seedha F hai. Jitni tarah ke udaharan, utna zyada yeh pehchaan sakta hai.') },
      { k: 'edit', test: (src) => /if d > \d+:\s*\n\s*guess = "\?"/.test(src), set: [[/        guess, d = recognise\(now\)\n/, '        guess, d = recognise(now)\n        if d > 500:\n            guess = "?"           # too far from every example: "I don\'t know"\n']],
        do: t3('Teach it to say "I don\'t know": after guess, d = recognise(now) add two lines, if d > 500: and (indented) guess = "?". Then press Run.', 'इसे "मुझे नहीं पता" कहना सिखाइए: guess, d = recognise(now) के बाद दो लाइनें जोड़िए, if d > 500: और (अंदर खिसकाकर) guess = "?"। फिर "चलाइए" दबाइए।', 'Ise "mujhe nahi pata" kehna sikhaiye: guess, d = recognise(now) ke baad do lines jodiye, if d > 500: aur (andar khiskaa kar) guess = "?". Phir Run dabaiye.'),
        see: t3('Run starts the program again, and the examples were only in its memory (RAM): the training is gone. Real systems save the trained model to a file.', '"चलाइए" प्रोग्राम फिर से शुरू करता है, और उदाहरण सिर्फ़ उसकी मेमोरी (RAM) में थे: ट्रेनिंग चली गई। असली सिस्टम ट्रेन किया मॉडल फ़ाइल में सहेजते हैं।', 'Run program phir se shuru karta hai, aur udaharan sirf uski memory (RAM) mein the: training chali gayi. Asli system train kiya model file mein save karte hain.') },
      { k: 'act', until: (S) => /if d > \d+:/.test(S.runSrc || '') && taught(S, 'L') >= 1 && taught(S, 'R') >= 1 && taught(S, 'F') >= 1 && seen(S, 'up').g === '?', do: t3('Teach it again, one example each (left + A, right + B, flat + logo), then tilt it up, towards you.', 'फिर से सिखाइए, हर एक का एक उदाहरण (बाएँ + A, दाएँ + B, सीधा + लोगो), फिर इसे ऊपर, अपनी ओर झुकाइए।', 'Phir se sikhaiye, har ek ka ek udaharan (left + A, right + B, seedha + logo), phir ise upar, apni taraf jhukaiye.'),
        see: liveRT((lg, S) => { const v = seen(S, 'up'); return v.g ? pick(lg, `"?" with a distance of ${v.d}: too far from every example, so it says it does not know instead of guessing. Self-driving cars and medical AI need exactly this: knowing when they are unsure.`, `${v.d} की दूरी के साथ "?": हर उदाहरण से बहुत दूर, इसलिए यह अंदाज़ा लगाने की जगह कहता है कि इसे नहीं पता। सेल्फ़-ड्राइविंग कारों और मेडिकल एआई को ठीक यही चाहिए: यह जानना कि वे कब पक्के नहीं हैं।`, `${v.d} ki distance ke saath "?": har udaharan se bahut door, isliye yeh andaaza lagane ki jagah kehta hai ki ise nahi pata. Self-driving cars aur medical AI ko bilkul yahi chahiye: yeh jaanna ki woh kab pakke nahi hain.`) : ''; }) },
    ],
    done: (S) => /if d > \d+:/.test(S.runSrc || '') && taught(S, 'F') >= 1 && seen(S, 'up').g === '?' }];
  for (const l of L) { l.n = ++n; l.batch = '16mb'; l.lang = 'py'; l.cls = '8'; }
  return L;
}
