// DUET Robotics Lab 360, batch 4: more boards. The Nano (in the breadboard), the Mega 2560 (more pins, four serial ports)
// and the ESP32 (3.3 V, 12-bit ADC, PWM, touch, WiFi, Bluetooth). Same shape as lessons.js; a lesson also has
//   board   the board on the bench when it opens ('nano', 'mega', 'esp32'; the old lessons: the Uno)
//   boards  boards the student may switch to in this lesson (the board box beside the bench, and the Board list)
//   phone   the simulated phone and the school WiFi router are on the bench (esp32.js, phone4.js)
//   baud    the Serial Monitor's speed when the lesson opens (ESP32 sketches use 115200)
// The helpers (t3, P, F, W, need, has, noShort, N, unit, LEDU, merge) come from lessons.js, so there is no import loop.

// a hole of a power rail at a breadboard column (the rails have a gap after every five holes)
const rail = (r, col) => { for (let i = 0; i < 50; i++) if (3 + i + Math.floor(i / 5) === col) return 'H:' + r + (i + 1); throw new Error('no rail hole at column ' + col); };

// ------------------------------------------------------------------ the sketches
const NANO_BLINK = `// Blink on the Nano: the L LED is on pin 13, as on the Uno
void setup() {
  pinMode(13, OUTPUT);
}

void loop() {
  digitalWrite(13, HIGH);   // on: 5 V
  delay(500);
  digitalWrite(13, LOW);    // off: 0 V
  delay(500);
}
`;
const TRAFFIC = `// A traffic light (the same sketch as on the Uno)
const int red = 12;
const int yellow = 11;
const int green = 10;

void setup() {
  pinMode(red, OUTPUT);
  pinMode(yellow, OUTPUT);
  pinMode(green, OUTPUT);
}

void loop() {
  digitalWrite(red, HIGH);      // stop
  delay(3000);
  digitalWrite(red, LOW);
  digitalWrite(green, HIGH);    // go
  delay(3000);
  digitalWrite(green, LOW);
  digitalWrite(yellow, HIGH);   // get ready to stop
  delay(1000);
  digitalWrite(yellow, LOW);
}
`;
const MEGA_SERIAL = `// The Mega has four serial ports. Serial1 talks to itself through one wire: TX1 (pin 18) -> RX1 (pin 19)
void setup() {
  Serial.begin(9600);     // the USB port: the Serial Monitor
  Serial1.begin(9600);    // TX1 = pin 18, RX1 = pin 19
}

void loop() {
  Serial1.println("Hello from Serial1");   // out of pin 18 ...
  delay(500);
  while (Serial1.available()) {            // ... and back in at pin 19
    char c = Serial1.read();
    Serial.write(c);                       // show it on the Serial Monitor
  }
}
`;
const MEGA_BAR = `// Bar graph: ten LEDs on the Mega's pins 22-31 show how far the knob is turned
const int leds[10] = {22, 23, 24, 25, 26, 27, 28, 29, 30, 31};

void setup() {
  for (int i = 0; i < 10; i++) {
    pinMode(leds[i], OUTPUT);
  }
  Serial.begin(9600);
}

void loop() {
  int value = analogRead(A0);              // 0 to about 1015 (USB gives a little under 5 V)
  int level = map(value, 0, 1000, 0, 10);  // 0 to 10 LEDs
  level = constrain(level, 0, 10);         // never more than 10
  for (int i = 0; i < 10; i++) {
    if (i < level) {
      digitalWrite(leds[i], HIGH);
    } else {
      digitalWrite(leds[i], LOW);
    }
  }
  Serial.println(level);
  delay(50);
}
`;
const ESP_BLINK = `// Blink on the ESP32: its blue LED is on GPIO 2 (LED_BUILTIN)
void setup() {
  pinMode(LED_BUILTIN, OUTPUT);   // LED_BUILTIN is 2 on this board
  Serial.begin(115200);           // ESP32 sketches usually talk at 115200 baud
}

void loop() {
  digitalWrite(LED_BUILTIN, HIGH);  // HIGH is 3.3 V on an ESP32
  Serial.println("LED on");
  delay(500);
  digitalWrite(LED_BUILTIN, LOW);
  Serial.println("LED off");
  delay(500);
}
`;
const ESP_KNOB = `// Knob dimmer: read GPIO 34 (0-4095) and set the blue LED's brightness with PWM (ledc)
const int knob = 34;   // an ADC1 pin, input only
const int led = 2;     // the blue LED on the board

void setup() {
  Serial.begin(115200);
  ledcSetup(0, 5000, 8);     // PWM channel 0: 5000 Hz, 8 bits (0-255)
  ledcAttachPin(led, 0);     // the LED's pin follows channel 0
}

void loop() {
  int raw = analogRead(knob);              // 0 to 4095: 12 bits
  int duty = map(raw, 0, 4095, 0, 255);
  ledcWrite(0, duty);                      // the brightness
  Serial.print("Knob: ");
  Serial.print(raw);
  Serial.print("   brightness: ");
  Serial.println(duty);
  delay(100);
}
`;
const ESP_TOUCH = `// Touch light switch: touch the copper plate to turn the lamp on, touch it again to turn it off
const int lamp = 25;
bool on = false;

void setup() {
  Serial.begin(115200);
  pinMode(lamp, OUTPUT);
}

void loop() {
  int t = touchRead(T0);     // T0 is GPIO 4: about 70 free, about 15 touched
  Serial.println(t);
  if (t < 40) {              // a finger!
    on = !on;                // swap: on <-> off
    digitalWrite(lamp, on ? HIGH : LOW);
    delay(400);              // wait, so that one touch is one switch
  }
  delay(50);
}
`;
const ESP_WIFI = `// WiFi lamp: the ESP32 makes a web page with ON and OFF buttons; a phone on the same WiFi opens it
#include <WiFi.h>
#include <WebServer.h>

const char* ssid = "DUET-School";
const char* password = "";     // the password from the router's sticker
WebServer server(80);          // a web server on port 80
const int lamp = 25;

String page(String state) {
  String h = "<h2>DUET WiFi Lamp</h2>";
  h += "<p>The lamp is <b>" + state + "</b></p>";
  h += "<p><a href=\\"/on\\"><button>ON</button></a> ";
  h += "<a href=\\"/off\\"><button>OFF</button></a></p>";
  return h;
}

void handleRoot() { server.send(200, "text/html", page(digitalRead(lamp) ? "ON" : "OFF")); }
void handleOn()   { digitalWrite(lamp, HIGH); server.send(200, "text/html", page("ON")); }
void handleOff()  { digitalWrite(lamp, LOW);  server.send(200, "text/html", page("OFF")); }

void setup() {
  pinMode(lamp, OUTPUT);
  Serial.begin(115200);
  WiFi.begin(ssid, password);
  Serial.print("Joining WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println();
  Serial.print("Open this on the phone: http://");
  Serial.println(WiFi.localIP());
  server.on("/", handleRoot);    // which function answers which page
  server.on("/on", handleOn);
  server.on("/off", handleOff);
  server.begin();
}

void loop() {
  server.handleClient();         // answer the phone
}
`;
const ESP_IOT = `// IoT dashboard: the ESP32 reads an LM35 and serves a live chart of the temperature to the phone
#include <WiFi.h>
#include <WebServer.h>

const char* ssid = "DUET-School";
const char* password = "stem2026";
WebServer server(80);
const int sensor = 34;         // an ADC1 pin: it works while WiFi is on (ADC2 pins do not)

float temps[20];               // the last 20 readings
int count = 0;

float readTemp() {
  int mv = analogReadMilliVolts(sensor);   // calibrated millivolts
  return mv / 10.0;                        // LM35: 10 mV for each degree C
}

void handleRoot() {
  String h = "<meta http-equiv=\\"refresh\\" content=\\"2\\">";   // the phone asks again every 2 s
  h += "<h3>Class temperature</h3>";
  h += "<h1>" + String(temps[count - 1], 1) + " &deg;C</h1>";
  h += "<svg width=\\"300\\" height=\\"160\\">";
  h += "<rect width=\\"300\\" height=\\"160\\" fill=\\"#eef4fb\\"/>";
  h += "<polyline fill=\\"none\\" stroke=\\"#e8590c\\" stroke-width=\\"3\\" points=\\"";
  for (int i = 0; i < count; i++) {
    int x = i * 15;
    int y = 160 - (int)(temps[i] * 3);      // 0 C at the bottom, 50 C near the top
    h += String(x) + "," + String(y) + " ";
  }
  h += "\\"/></svg>";
  server.send(200, "text/html", h);
}

void setup() {
  Serial.begin(115200);
  temps[0] = readTemp();
  count = 1;
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println();
  Serial.print("Dashboard: http://");
  Serial.println(WiFi.localIP());
  server.on("/", handleRoot);
  server.begin();
}

unsigned long last = 0;

void loop() {
  server.handleClient();
  if (millis() - last >= 1000) {           // one reading every second
    last = millis();
    float t = readTemp();
    if (count < 20) {
      temps[count] = t;
      count++;
    } else {
      for (int i = 0; i < 19; i++) temps[i] = temps[i + 1];   // move the old ones left
      temps[19] = t;
    }
    Serial.print("Temperature: ");
    Serial.println(t);
  }
}
`;
const ESP_BT = `// Bluetooth lamp: a phone app sends 1 or 0 over Bluetooth; the ESP32 switches the lamp and answers
#include "BluetoothSerial.h"
BluetoothSerial SerialBT;
const int lamp = 25;

void setup() {
  pinMode(lamp, OUTPUT);
  Serial.begin(115200);
  SerialBT.begin("DUET-ESP32");    // the name the phone will see
  Serial.println("Bluetooth is on: connect to DUET-ESP32");
}

void loop() {
  if (SerialBT.available()) {
    char c = SerialBT.read();
    if (c == '1') {
      digitalWrite(lamp, HIGH);
      SerialBT.println("Lamp ON");
    }
    if (c == '0') {
      digitalWrite(lamp, LOW);
      SerialBT.println("Lamp OFF");
    }
  }
  delay(20);
}
`;
const ESP_HALL = `// The ESP32's own sensors: the Hall sensor feels a magnet; the temperature sensor is not there on this chip
void setup() {
  Serial.begin(115200);
  pinMode(2, OUTPUT);
}

void loop() {
  int h = hallRead();                   // the magnet's field (only core 2.x, only the original ESP32)
  Serial.print("Hall: ");
  Serial.print(h);
  Serial.print("   chip temperature: ");
  Serial.println(temperatureRead());    // always 53.3 on the ESP32-WROOM-32
  if (h > 60 || h < -30) {
    digitalWrite(2, HIGH);              // a magnet is near: the blue LED lights
  } else {
    digitalWrite(2, LOW);
  }
  delay(300);
}
`;

export function batch4(K) {
  const { t3, P, F, W, need, has, noShort, N, unit, LEDU, merge } = K;
  const S4 = {
    notNano: t3('Swap to the Nano first: tap the Nano in its box beside the bench.', 'पहले Nano लगाइए: बेंच के पास डिब्बे में रखे Nano को छूइए।', 'Pehle Nano lagaiye: bench ke paas dabbe mein rakhe Nano ko touch karo.'),
    noLoop: t3('Pin 18 (TX1) is not wired to pin 19 (RX1) yet.', 'पिन 18 (TX1) अभी पिन 19 (RX1) से नहीं जुड़ा।', 'Pin 18 (TX1) abhi pin 19 (RX1) se nahi juda.'),
    seg: t3('Segment {k} of the bar graph must be wired to pin {p}.', 'बार ग्राफ़ का खंड {k} पिन {p} से जुड़ना चाहिए।', 'Bar graph ka segment {k} pin {p} se judna chahiye.'),
    netGnd: t3('The resistor network\'s pin 1 (the dot) must be joined to GND (the − rail).', 'रेज़िस्टर नेटवर्क का पिन 1 (बिंदु वाला) GND (− रेल) से जुड़ना चाहिए।', 'Resistor network ka pin 1 (dot wala) GND (− rail) se judna chahiye.'),
    wiper: t3('The knob\'s middle leg must be joined to {p}.', 'नॉब का बीच वाला पैर {p} से जुड़ना चाहिए।', 'Knob ka beech wala pair {p} se judna chahiye.'),
    ends: t3('The knob\'s outer legs must go to {v} and GND.', 'नॉब के बाहरी पैर {v} और GND से जुड़ने चाहिए।', 'Knob ke bahari pair {v} aur GND se judne chahiye.'),
    pot33: t3('On an ESP32 the knob gets 3V3, never VIN: 5 V on GPIO 34 would be too much for the chip.', 'ESP32 पर नॉब को 3V3 दीजिए, VIN कभी नहीं: GPIO 34 पर 5 V चिप के लिए ज़्यादा है।', 'ESP32 par knob ko 3V3 dijiye, VIN kabhi nahi: GPIO 34 par 5 V chip ke liye zyada hai.'),
    pad: t3('The touch plate\'s pin must be wired to GPIO 4 (T0).', 'टच प्लेट का पिन GPIO 4 (T0) से जुड़ना चाहिए।', 'Touch plate ka pin GPIO 4 (T0) se judna chahiye.'),
    lm5: t3('The LM35\'s left leg needs 5 V: the + rail, which is joined to VIN.', 'LM35 के बाएँ पैर को 5 V चाहिए: + रेल, जो VIN से जुड़ी है।', 'LM35 ke left pair ko 5 V chahiye: + rail, jo VIN se judi hai.'),
    adc1: t3('The LM35\'s middle leg must go to GPIO 34. (An ADC2 pin would read 0 while WiFi is on.)', 'LM35 का बीच वाला पैर GPIO 34 से जुड़ना चाहिए। (ADC2 पिन WiFi चालू रहते 0 पढ़ेगा।)', 'LM35 ka beech wala pair GPIO 34 se judna chahiye. (ADC2 pin WiFi on rehte 0 padhega.)'),
  };
  const gpio = (n) => t3('GPIO ' + n, 'GPIO ' + n, 'GPIO ' + n);
  const NM = { bar: t3('bar graph', 'बार ग्राफ़', 'bar graph'), sip: t3('resistor network', 'रेज़िस्टर नेटवर्क', 'resistor network'), pad: t3('touch plate', 'टच प्लेट', 'touch plate'), mag: t3('magnet', 'चुंबक', 'magnet') };
  // what the phone and the network saw (esp32.js): pages loaded, Bluetooth
  const net = (S) => S.lab.net4 || { seen: { pages: 0, paths: {} }, bt: {}, staIP: () => null };
  const paths = (S) => net(S).seen.paths || {};
  const led25 = { parts: [P('led1', 'led', { color: 'red' }, 'e30', 0), P('r1', 'resistor', { ohms: 220 }, 'b30', 3)], wires: [['H:a5', rail('tn', 5)], ['H:a11', 'H:a31']] };
  const L = [
    // ---------------------------------------------------------------------------------------------------- Nano 1
    { id: 'nano_meet', board: 'nano', view: 'board', code: NANO_BLINK, drawer: [], icon: '▭',
      title: t3('Meet the Nano', 'Nano से मिलिए', 'Nano se miliye'),
      goal: t3('A whole Arduino as small as your thumb, that plugs into the breadboard. Find its parts and its pins.', 'अँगूठे जितना छोटा पूरा Arduino, जो ब्रेडबोर्ड में लग जाता है। इसके हिस्से और पिन पहचानिए।', 'Angoothe jitna chhota poora Arduino, jo breadboard mein lag jaata hai. Iske parts aur pins pehchaniye.'),
      setup: { parts: [], wires: [] },
      steps: [
        { k: 'info', do: t3('This is a Nano board, like the Arduino Nano. It has the same brain as the Uno (ATmega328P) and runs the same sketches, but it plugs straight into the breadboard.', 'यह Nano बोर्ड है, Arduino Nano जैसा। इसका दिमाग़ Uno वाला ही है (ATmega328P) और यह वही स्केच चलाता है, पर यह सीधे ब्रेडबोर्ड में लग जाता है।', 'Yeh Nano board hai, Arduino Nano jaisa. Iska dimaag Uno wala hi hai (ATmega328P) aur yeh wahi sketch chalata hai, par yeh seedhe breadboard mein lag jaata hai.'),
          see: t3('It sits across the middle gap, one pin in each column, columns 3 to 17.', 'यह बीच की खाली जगह के आर-पार बैठता है, हर कॉलम में एक पिन, कॉलम 3 से 17 तक।', 'Yeh beech ke gap ke aar-paar baithta hai, har column mein ek pin, column 3 se 17 tak.') },
        { k: 'tap', region: 'n_usb', do: t3('Tap the small USB socket at its left end.', 'इसके बाएँ सिरे पर छोटे USB सॉकेट को छूइए।', 'Iske left end par chhote USB socket ko touch karo.'), see: t3('A mini-USB socket: 5 V power and your code come in here. A CH340 chip under the board turns USB into Serial.', 'मिनी-USB सॉकेट: 5 V बिजली और आपका कोड यहीं से आता है। बोर्ड के नीचे CH340 चिप USB को सीरियल में बदलती है।', 'Mini-USB socket: 5 V power aur aapka code yahin se aata hai. Board ke neeche CH340 chip USB ko Serial mein badalti hai.') },
        { k: 'tap', region: 'n_mcu', do: t3('Tap the square chip, turned on its corner.', 'कोने पर घूमी हुई चौकोर चिप को छूइए।', 'Kone par ghoomi hui square chip ko touch karo.'), see: t3('The ATmega328P again, in a tiny flat case (TQFP) with 32 legs: the Uno\'s long chip has 28.', 'फिर से ATmega328P, एक छोटे चपटे केस (TQFP) में, 32 पैरों वाला: Uno की लंबी चिप में 28 पैर हैं।', 'Phir se ATmega328P, ek chhote chapte case (TQFP) mein, 32 pairon wala: Uno ki lambi chip mein 28 pair hain.') },
        { k: 'tap', region: 'n_back', do: t3('Tap the back row of pins.', 'पीछे वाली पिनों की कतार को छूइए।', 'Peeche wali pins ki line ko touch karo.'), see: t3('D12 down to D2, then GND, RST, RX0 and TX1. Pins 3, 5, 6, 9, 10, 11 have PWM, as on the Uno.', 'D12 से D2 तक, फिर GND, RST, RX0 और TX1। पिन 3, 5, 6, 9, 10, 11 पर PWM है, Uno की तरह।', 'D12 se D2 tak, phir GND, RST, RX0 aur TX1. Pin 3, 5, 6, 9, 10, 11 par PWM hai, Uno ki tarah.') },
        { k: 'tap', region: 'n_front', do: t3('Tap the front row of pins.', 'आगे वाली पिनों की कतार को छूइए।', 'Aage wali pins ki line ko touch karo.'), see: t3('D13, 3V3, REF, A0–A7, 5V, RST, GND and VIN. The Nano has two more analog inputs than the Uno: A6 and A7 (they can only be read with analogRead).', 'D13, 3V3, REF, A0–A7, 5V, RST, GND और VIN। Nano में Uno से दो एनालॉग इनपुट ज़्यादा हैं: A6 और A7 (इन्हें सिर्फ़ analogRead से पढ़ सकते हैं)।', 'D13, 3V3, REF, A0–A7, 5V, RST, GND aur VIN. Nano mein Uno se do analog input zyada hain: A6 aur A7 (inhe sirf analogRead se padh sakte hain).') },
        { k: 'tap', region: 'n_reset', do: t3('Tap the tiny RESET button.', 'छोटे रीसेट बटन को छूइए।', 'Chhote RESET button ko touch karo.'), see: t3('It restarts your sketch from the top, like the Uno\'s.', 'यह Uno की तरह आपके स्केच को शुरू से चलाता है।', 'Yeh Uno ki tarah aapke sketch ko shuru se chalata hai.') },
        { k: 'info', do: t3('Each pin is in a breadboard column, and the column\'s five holes are joined inside. So you wire a pin from any free hole of its column: a–c at the back, i–j at the front.', 'हर पिन एक ब्रेडबोर्ड कॉलम में है, और कॉलम के पाँचों छेद अंदर से जुड़े हैं। इसलिए किसी पिन को उसके कॉलम के किसी भी ख़ाली छेद से जोड़िए: पीछे a–c, आगे i–j।', 'Har pin ek breadboard column mein hai, aur column ke paanchon holes andar se jude hain. Isliye kisi pin ko uske column ke kisi bhi khaali hole se jodiye: peeche a–c, aage i–j.'),
          see: t3('Point at a hole next to a pin: it says which Nano pin it is joined to.', 'किसी पिन के पास वाले छेद पर पॉइंट कीजिए: वह बताएगा कि कौन-से Nano पिन से जुड़ा है।', 'Kisi pin ke paas wale hole par point kijiye: woh batayega ki kaunse Nano pin se juda hai.') },
        { k: 'run', do: t3('Press Run: it is the Uno\'s Blink sketch.', '"चलाइए" दबाइए: यह Uno वाला ही Blink स्केच है।', 'Run dabaiye: yeh Uno wala hi Blink sketch hai.'), see: t3('The code is uploaded to the Nano.', 'कोड Nano पर अपलोड होता है।', 'Code Nano par upload hota hai.') },
        { k: 'watch', until: (S) => S.toggles('L') >= 4, do: t3('Watch the L LED on the Nano.', 'Nano पर L एलईडी को देखिए।', 'Nano par L LED ko dekhiye.'), see: t3('It blinks, on pin 13, exactly as on the Uno. Same chip, same code!', 'यह पिन 13 पर, बिल्कुल Uno की तरह, जलती-बुझती है। वही चिप, वही कोड!', 'Yeh pin 13 par, bilkul Uno ki tarah, blink karti hai. Wahi chip, wahi code!') },
      ],
      done: (S) => ['n_usb', 'n_mcu', 'n_back', 'n_front', 'n_reset'].every((r) => S.tapped(r)) && S.toggles('L') >= 4 },
    // ---------------------------------------------------------------------------------------------------- Nano 2
    { id: 'nano_traffic', board: 'uno', boards: ['uno', 'nano'], view: 'swap4', wview: 'bb', code: TRAFFIC, drawer: [],
      title: t3('Traffic light: Uno → Nano', 'ट्रैफ़िक लाइट: Uno → Nano', 'Traffic light: Uno se Nano'),
      goal: t3('Move a finished project from the Uno to a Nano on the breadboard: the parts stay, the code stays, only the wires change.', 'बने हुए प्रोजेक्ट को Uno से ब्रेडबोर्ड पर लगे Nano पर ले जाइए: पुर्ज़े वही, कोड वही, बस वायर बदलेंगे।', 'Bane hue project ko Uno se breadboard par lage Nano par le jaiye: parts wahi, code wahi, bas wires badlenge.'),
      setup: merge(LEDU(1, 22, 'red', 12), LEDU(2, 28, 'yellow', 11), LEDU(3, 34, 'green', 10), { wires: [['GND3', rail('tn', 18)]] }),
      steps: [
        { k: 'info', do: t3('This is the traffic light from lesson 4, on the Uno. In a real gadget the big Uno does not fit: a Nano does the same job on the breadboard itself.', 'यह पाठ 4 वाली ट्रैफ़िक लाइट है, Uno पर। असली गैजेट में बड़ा Uno नहीं समाता: Nano यही काम ब्रेडबोर्ड पर ही कर देता है।', 'Yeh lesson 4 wali traffic light hai, Uno par. Asli gadget mein bada Uno nahi samata: Nano yahi kaam breadboard par hi kar deta hai.'),
          see: t3('The LEDs and resistors will stay exactly where they are.', 'एलईडी और रेज़िस्टर बिल्कुल अपनी जगह पर रहेंगे।', 'LED aur resistor bilkul apni jagah par rahenge.') },
        { k: 'act', until: (S) => S.board() === 'nano', do: t3('Swap the board: tap the Nano in its box beside the bench (or choose Nano in the Board list).', 'बोर्ड बदलिए: बेंच के पास डिब्बे में रखे Nano को छूइए (या बोर्ड की सूची में Nano चुनिए)।', 'Board badliye: bench ke paas dabbe mein rakhe Nano ko touch karo (ya Board list mein Nano chuniye).'),
          see: t3('The Uno goes back in the box and the Nano plugs into columns 3–17. The Uno\'s wires are gone: the Nano\'s pins are in the breadboard now.', 'Uno डिब्बे में वापस जाता है और Nano कॉलम 3–17 में लग जाता है। Uno के वायर हट गए: अब Nano के पिन ब्रेडबोर्ड में हैं।', 'Uno dabbe mein wapas jaata hai aur Nano column 3–17 mein lag jaata hai. Uno ke wires hat gaye: ab Nano ke pins breadboard mein hain.') },
        { k: 'wire', wire: ['D12', 'led1.A'], do: t3('Wire the Nano\'s D12 (column 3, a free hole a–c) to the red LED\'s long leg (column 23).', 'Nano के D12 (कॉलम 3, कोई ख़ाली छेद a–c) से लाल एलईडी के लंबे पैर (कॉलम 23) तक वायर।', 'Nano ke D12 (column 3, koi khaali hole a–c) se red LED ke lambe pair (column 23) tak wire.'), see: t3('', '', '') },
        { k: 'wire', wire: ['D11', 'led2.A'], do: t3('Wire D11 (column 4) to the yellow LED\'s long leg (column 29).', 'D11 (कॉलम 4) से पीली एलईडी के लंबे पैर (कॉलम 29) तक वायर।', 'D11 (column 4) se yellow LED ke lambe pair (column 29) tak wire.'), see: t3('', '', '') },
        { k: 'wire', wire: ['D10', 'led3.A'], do: t3('Wire D10 (column 5) to the green LED\'s long leg (column 35).', 'D10 (कॉलम 5) से हरी एलईडी के लंबे पैर (कॉलम 35) तक वायर।', 'D10 (column 5) se green LED ke lambe pair (column 35) tak wire.'), see: t3('', '', '') },
        { k: 'wire', wire: ['GND1', 'rail:tn'], do: t3('Wire the Nano\'s GND (column 14, back row) to the blue − rail.', 'Nano के GND (कॉलम 14, पीछे की कतार) से नीली − रेल तक वायर।', 'Nano ke GND (column 14, peeche ki line) se neeli − rail tak wire.'), see: t3('Now the current can come back to the Nano.', 'अब करंट Nano तक लौट सकता है।', 'Ab current Nano tak laut sakta hai.') },
        { k: 'check', do: t3('Check your circuit.', 'अपना सर्किट जाँचिए।', 'Apna circuit check karo.'), see: t3('', '', '') },
        { k: 'run', do: t3('Press Run. The sketch is not changed at all.', '"चलाइए" दबाइए। स्केच में कुछ भी नहीं बदला।', 'Run dabaiye. Sketch mein kuch bhi nahi badla.'), see: t3('Pins 12, 11 and 10 mean the same on the Nano as on the Uno, so the same code works.', 'पिन 12, 11 और 10 का मतलब Nano पर भी वही है जो Uno पर, इसलिए वही कोड चलता है।', 'Pin 12, 11 aur 10 ka matlab Nano par bhi wahi hai jo Uno par, isliye wahi code chalta hai.') },
        { k: 'watch', until: (S) => ['led1', 'led2', 'led3'].every((x) => S.toggles(x) >= 2), do: t3('Watch one full cycle (7 seconds).', 'एक पूरा चक्र देखिए (7 सेकंड)।', 'Ek poora cycle dekhiye (7 second).'), see: t3('Red, green, yellow: your traffic light now runs on a board one third the size.', 'लाल, हरी, पीली: आपकी ट्रैफ़िक लाइट अब एक-तिहाई आकार के बोर्ड पर चल रही है।', 'Red, green, yellow: aapki traffic light ab ek-tihaai size ke board par chal rahi hai.') },
      ],
      check: [(S) => (S.board() === 'nano' ? null : [S4.notNano]), noShort, unit('led1', 'r1', 12, N.r), unit('led2', 'r2', 11), unit('led3', 'r3', 10)],
      done: (S) => S.board() === 'nano' && S.running() && ['led1', 'led2', 'led3'].every((x) => S.toggles(x) >= 2) },
    // ---------------------------------------------------------------------------------------------------- Mega 1
    { id: 'mega_meet', board: 'mega', view: 'board', wview: 'board', code: MEGA_SERIAL, drawer: [], serial: true,
      title: t3('Meet the Mega 2560', 'Mega 2560 से मिलिए', 'Mega 2560 se miliye'),
      goal: t3('The big brother of the Uno: 54 digital pins, 16 analog inputs and 4 serial ports. Make one serial port talk to itself.', 'Uno का बड़ा भाई: 54 डिजिटल पिन, 16 एनालॉग इनपुट और 4 सीरियल पोर्ट। एक सीरियल पोर्ट से ख़ुद से बात करवाइए।', 'Uno ka bada bhai: 54 digital pins, 16 analog inputs aur 4 serial ports. Ek serial port ko khud se baat karwaiye.'),
      setup: { parts: [], wires: [] },
      steps: [
        { k: 'info', do: t3('This is a Mega 2560 board, like the Arduino Mega. It is shaped like a long Uno, so Uno shields fit on its left end. Robots with many motors and sensors use it.', 'यह Mega 2560 बोर्ड है, Arduino Mega जैसा। इसका आकार लंबे Uno जैसा है, इसलिए Uno की शील्ड इसके बाएँ हिस्से पर लग जाती हैं। बहुत सारी मोटर और सेंसर वाले रोबोट इसे लेते हैं।', 'Yeh Mega 2560 board hai, Arduino Mega jaisa. Iska shape lambe Uno jaisa hai, isliye Uno ki shields iske left hisse par lag jaati hain. Bahut saari motors aur sensors wale robots ise lete hain.'),
          see: t3('Drag to turn the bench; it is 10 cm long.', 'बेंच घुमाने के लिए खींचिए; यह 10 cm लंबा है।', 'Bench ghumane ke liye kheenchiye; yeh 10 cm lamba hai.') },
        { k: 'tap', region: 'm_mcu', do: t3('Tap the big square chip.', 'बड़ी चौकोर चिप को छूइए।', 'Badi square chip ko touch karo.'), see: t3('The ATmega2560: 256 KB for programs and 8 KB of memory, eight times the Uno\'s. Same 16 MHz speed.', 'ATmega2560: प्रोग्राम के लिए 256 KB और 8 KB मेमोरी, Uno से आठ गुना। रफ़्तार वही 16 MHz।', 'ATmega2560: program ke liye 256 KB aur 8 KB memory, Uno se aath guna. Speed wahi 16 MHz.') },
        { k: 'tap', region: 'm_pwm', do: t3('Tap the pins 0–13 at the back left.', 'पीछे बाईं ओर के पिन 0–13 को छूइए।', 'Peeche left side ke pins 0–13 ko touch karo.'), see: t3('The same places as on the Uno. On the Mega, pins 2 to 13 all have PWM.', 'Uno वाली ही जगह। Mega पर पिन 2 से 13 सब पर PWM है।', 'Uno wali hi jagah. Mega par pin 2 se 13 sab par PWM hai.') },
        { k: 'tap', region: 'm_comm', do: t3('Tap the next row: pins 14–21 (COMMUNICATION).', 'अगली कतार छूइए: पिन 14–21 (COMMUNICATION)।', 'Agli line touch karo: pins 14–21 (COMMUNICATION).'), see: t3('Three more serial ports: TX3/RX3 (14, 15), TX2/RX2 (16, 17), TX1/RX1 (18, 19), and I2C: SDA 20, SCL 21.', 'तीन और सीरियल पोर्ट: TX3/RX3 (14, 15), TX2/RX2 (16, 17), TX1/RX1 (18, 19), और I2C: SDA 20, SCL 21।', 'Teen aur serial ports: TX3/RX3 (14, 15), TX2/RX2 (16, 17), TX1/RX1 (18, 19), aur I2C: SDA 20, SCL 21.') },
        { k: 'tap', region: 'm_dbl', do: t3('Tap the double row of pins at the right end.', 'दाएँ सिरे पर पिनों की दोहरी कतार को छूइए।', 'Right end par pins ki double line ko touch karo.'), see: t3('Pins 22 to 53: 32 more pins, with 5V at the top and GND at the bottom. 44, 45 and 46 also do PWM.', 'पिन 22 से 53: 32 और पिन, ऊपर 5V और नीचे GND। 44, 45 और 46 पर भी PWM है।', 'Pin 22 se 53: 32 aur pins, upar 5V aur neeche GND. 44, 45 aur 46 par bhi PWM hai.') },
        { k: 'tap', region: 'm_analog', do: t3('Tap the analog inputs at the front.', 'आगे वाले एनालॉग इनपुट को छूइए।', 'Aage wale analog inputs ko touch karo.'), see: t3('A0 to A15: sixteen of them. In code, A0 is pin 54 on the Mega.', 'A0 से A15: पूरे सोलह। कोड में Mega पर A0 का मतलब पिन 54 है।', 'A0 se A15: poore solah. Code mein Mega par A0 ka matlab pin 54 hai.') },
        { k: 'wire', wire: ['D18', 'D19'], do: t3('Wire pin 18 (TX1) to pin 19 (RX1), next to it.', 'पिन 18 (TX1) से उसके पास वाले पिन 19 (RX1) तक वायर।', 'Pin 18 (TX1) se uske paas wale pin 19 (RX1) tak wire.'), see: t3('Whatever Serial1 sends on TX1 now comes straight back on RX1: a loopback.', 'Serial1 जो कुछ TX1 पर भेजेगा, वह सीधा RX1 पर लौट आएगा: लूपबैक।', 'Serial1 jo kuch TX1 par bhejega, woh seedha RX1 par laut aayega: loopback.') },
        { k: 'run', do: t3('Press Run.', '"चलाइए" दबाइए।', 'Run dabaiye.'), see: t3('Serial (USB) and Serial1 both start at 9600 baud.', 'Serial (USB) और Serial1, दोनों 9600 बॉड पर शुरू होते हैं।', 'Serial (USB) aur Serial1, dono 9600 baud par shuru hote hain.') },
        { k: 'watch', until: (S) => S.lineCount() >= 2, do: t3('Look at the Serial Monitor.', 'सीरियल मॉनिटर देखिए।', 'Serial Monitor dekhiye.'), see: t3('"Hello from Serial1" went out of pin 18, came in at pin 19, and the sketch passed it on to the computer. Pull the wire out and it stops.', '"Hello from Serial1" पिन 18 से निकला, पिन 19 पर आया, और स्केच ने उसे कंप्यूटर तक पहुँचाया। वायर निकालिए तो यह रुक जाएगा।', '"Hello from Serial1" pin 18 se nikla, pin 19 par aaya, aur sketch ne use computer tak pahunchaya. Wire nikaliye to yeh ruk jaayega.') },
      ],
      check: [(S) => (S.conn('D18', 'D19') ? null : [S4.noLoop])],
      done: (S) => ['m_mcu', 'm_pwm', 'm_comm', 'm_dbl', 'm_analog'].every((r) => S.tapped(r)) && S.conn('D18', 'D19') && S.lineCount() >= 2 },
    // ---------------------------------------------------------------------------------------------------- Mega 2
    { id: 'mega_bar', board: 'mega', view: 'mega4', wview: 'mega4', code: MEGA_BAR, drawer: [], serial: true,
      title: t3('10-LED bar graph on the Mega', 'Mega पर 10 एलईडी का बार ग्राफ़', 'Mega par 10 LED ka bar graph'),
      goal: t3('Drive many LEDs from the Mega\'s extra pins with an array and a for loop: a level meter for a knob.', 'Mega के अतिरिक्त पिनों से ऐरे और for लूप के साथ कई एलईडी चलाइए: नॉब के लिए लेवल मीटर।', 'Mega ke extra pins se array aur for loop ke saath kai LED chalaiye: knob ke liye level meter.'),
      setup: {
        parts: [P('bar1', 'bar10', {}, 'e6', 0), P('sip1', 'sip10', {}, 'h5', 0), P('pot1', 'pot', {}, 'f20', 0)],
        wires: [['GND5', rail('bn', 4)], ['H:j5', rail('bn', 5)], ['5V', rail('bp', 19)], ['H:j20', rail('bn', 21)], ['H:j24', rail('bp', 25)], ['A0', 'H:j22'],
          ...[22, 23, 24, 25, 26, 27, 28, 29].map((p, i) => ['D' + p, 'H:a' + (6 + i)])],
      },
      steps: [
        { k: 'info', do: t3('Ten LEDs in one block (a bar graph), with a resistor network under them: one strip holding ten 220 Ω resistors. Pins 22 to 29 are already wired.', 'एक ब्लॉक में दस एलईडी (बार ग्राफ़), और उनके नीचे रेज़िस्टर नेटवर्क: एक पट्टी में दस 220 Ω रेज़िस्टर। पिन 22 से 29 पहले से जुड़े हैं।', 'Ek block mein das LED (bar graph), aur unke neeche resistor network: ek patti mein das 220 Ω resistor. Pin 22 se 29 pehle se jude hain.'),
          see: t3('On an Uno, ten LEDs would use almost every pin. The Mega still has more than forty free.', 'Uno पर दस एलईडी लगभग सारे पिन ले लेतीं। Mega पर अब भी चालीस से ज़्यादा पिन ख़ाली हैं।', 'Uno par das LED lagbhag saare pins le leti. Mega par ab bhi chaalis se zyada pins khaali hain.') },
        { k: 'wire', wire: ['D30', 'bar1.A9'], do: t3('Wire pin 30 (the double row, left column) to segment 9\'s anode: column 14, row a–d.', 'पिन 30 (दोहरी कतार, बायाँ कॉलम) से खंड 9 के एनोड तक वायर: कॉलम 14, पंक्ति a–d।', 'Pin 30 (double line, left column) se segment 9 ke anode tak wire: column 14, row a–d.'), see: t3('', '', '') },
        { k: 'wire', wire: ['D31', 'bar1.A10'], do: t3('Wire pin 31 (right column) to segment 10\'s anode: column 15.', 'पिन 31 (दायाँ कॉलम) से खंड 10 के एनोड तक वायर: कॉलम 15।', 'Pin 31 (right column) se segment 10 ke anode tak wire: column 15.'), see: t3('', '', '') },
        { k: 'check', do: t3('Check your circuit.', 'अपना सर्किट जाँचिए।', 'Apna circuit check karo.'), see: t3('', '', '') },
        { k: 'info', code: [2, 3], do: t3('Read the code. The array leds[] holds the ten pin numbers; a for loop goes through them, so ten LEDs need only a few lines.', 'कोड पढ़िए। ऐरे leds[] में दस पिन नंबर हैं; for लूप एक-एक करके उन पर जाता है, इसलिए दस एलईडी के लिए कुछ ही लाइनें काफ़ी हैं।', 'Code padhiye. Array leds[] mein das pin number hain; for loop ek-ek karke un par jaata hai, isliye das LED ke liye kuch hi lines kaafi hain.'),
          see: t3('map(value, 0, 1000, 0, 10) turns the knob\'s reading into 0–10 LEDs; constrain() keeps it at most 10, because the top of the knob reads a little over 1000.', 'map(value, 0, 1000, 0, 10) नॉब की रीडिंग को 0–10 एलईडी में बदलता है; constrain() इसे 10 से ऊपर नहीं जाने देता, क्योंकि नॉब के आख़िर में रीडिंग 1000 से थोड़ी ज़्यादा होती है।', 'map(value, 0, 1000, 0, 10) knob ki reading ko 0–10 LED mein badalta hai; constrain() ise 10 se upar nahi jaane deta, kyunki knob ke end mein reading 1000 se thodi zyada hoti hai.') },
        { k: 'run', do: t3('Press Run.', '"चलाइए" दबाइए।', 'Run dabaiye.'), see: t3('', '', '') },
        { k: 'act', until: (S) => { const p = S.part('bar1'); return !!p && !!p.state.levels && p.state.levels.has(10); }, do: t3('Turn the knob all the way up (drag it, or tap it and use the slider).', 'नॉब को पूरा ऊपर घुमाइए (खींचिए, या छूकर स्लाइडर से)।', 'Knob ko poora upar ghumaiye (kheenchiye, ya touch karke slider se).'), see: t3('All ten light up: analogRead gives about 1015 and the code turns it into 10.', 'दसों जल उठती हैं: analogRead लगभग 1015 देता है और कोड उसे 10 में बदल देता है।', 'Dason jal uthti hain: analogRead lagbhag 1015 deta hai aur code use 10 mein badal deta hai.') },
        { k: 'act', until: (S) => { const p = S.part('bar1'); return !!p && !!p.state.levels && p.state.levels.has(10) && p.state.levels.has(0) && p.state.lit === 0; }, do: t3('Now turn it all the way down.', 'अब इसे पूरा नीचे घुमाइए।', 'Ab ise poora neeche ghumaiye.'), see: t3('The bar shrinks to nothing. You drove 10 LEDs from 10 pins, and 44 pins are still free!', 'बार घटते-घटते ग़ायब हो जाता है। आपने 10 पिनों से 10 एलईडी चलाईं, और 44 पिन अब भी ख़ाली हैं!', 'Bar ghatte-ghatte gaayab ho jaata hai. Aapne 10 pins se 10 LED chalaayi, aur 44 pins ab bhi khaali hain!') },
      ],
      check: [noShort, has('bar1', NM.bar), ...[...Array(10)].map((_, i) => (S) => (S.conn('bar1.A' + (i + 1), 'D' + (22 + i)) ? null : [S4.seg, { k: i + 1, p: 22 + i }])),
        has('sip1', NM.sip), (S) => (S.conn('sip1.C', 'GND') ? null : [S4.netGnd]), (S) => (S.conn('pot1.W', 'A0') ? null : [S4.wiper, { p: 'A0' }])],
      done: (S) => { const p = S.part('bar1'); return S.running() && !!p && p.state.levels && p.state.levels.has(10) && p.state.levels.has(0); } },
    // ---------------------------------------------------------------------------------------------------- ESP32 1
    { id: 'esp_meet', board: 'esp32', view: 'board', code: ESP_BLINK, drawer: [], baud: 115200, serial: true,
      title: t3('Meet the ESP32', 'ESP32 से मिलिए', 'ESP32 se miliye'),
      goal: t3('A board with WiFi and Bluetooth inside. Find its parts, learn why it works at 3.3 V, and blink its blue LED.', 'ऐसा बोर्ड जिसके अंदर WiFi और Bluetooth है। इसके हिस्से पहचानिए, जानिए कि यह 3.3 V पर क्यों चलता है, और इसकी नीली एलईडी जलाइए।', 'Aisa board jiske andar WiFi aur Bluetooth hai. Iske parts pehchaniye, jaaniye ki yeh 3.3 V par kyun chalta hai, aur iski neeli LED jalaiye.'),
      setup: { parts: [], wires: [] },
      steps: [
        { k: 'info', do: t3('This is an ESP32 DevKit V1. Its chip runs at 240 MHz (15 times the Uno), has two cores, WiFi and Bluetooth. It works at 3.3 V, not 5 V.', 'यह ESP32 DevKit V1 है। इसकी चिप 240 MHz पर चलती है (Uno से 15 गुना), इसमें दो कोर, WiFi और Bluetooth हैं। यह 5 V पर नहीं, 3.3 V पर चलता है।', 'Yeh ESP32 DevKit V1 hai. Iski chip 240 MHz par chalti hai (Uno se 15 guna), ismein do core, WiFi aur Bluetooth hain. Yeh 5 V par nahi, 3.3 V par chalta hai.'),
          see: t3('It plugs into the breadboard, columns 4–18. It is wide: only one free hole is left beside each pin (row a at the back, row j at the front).', 'यह ब्रेडबोर्ड में कॉलम 4–18 में लगता है। यह चौड़ा है: हर पिन के पास सिर्फ़ एक ख़ाली छेद बचता है (पीछे पंक्ति a, आगे पंक्ति j)।', 'Yeh breadboard mein column 4–18 mein lagta hai. Yeh chauda hai: har pin ke paas sirf ek khaali hole bachta hai (peeche row a, aage row j).') },
        { k: 'tap', region: 'e_wroom', do: t3('Tap the silver metal can.', 'चाँदी जैसे धातु के डिब्बे को छूइए।', 'Silver metal ke dabbe ko touch karo.'), see: t3('The ESP32-WROOM-32 module: the ESP32 chip, 4 MB of flash memory and the radio, under a metal shield.', 'ESP32-WROOM-32 मॉड्यूल: धातु के ढक्कन के नीचे ESP32 चिप, 4 MB फ़्लैश मेमोरी और रेडियो।', 'ESP32-WROOM-32 module: metal cover ke neeche ESP32 chip, 4 MB flash memory aur radio.') },
        { k: 'tap', region: 'e_ant', do: t3('Tap the wiggly gold line at the end of the module.', 'मॉड्यूल के सिरे पर टेढ़ी-मेढ़ी सुनहरी लाइन को छूइए।', 'Module ke end par tedhi-medhi sunehri line ko touch karo.'), see: t3('The WiFi and Bluetooth antenna, printed on the board. Keep metal and wires away from it.', 'WiFi और Bluetooth का एंटीना, बोर्ड पर ही छपा हुआ। धातु और वायर इससे दूर रखिए।', 'WiFi aur Bluetooth ka antenna, board par hi chhapa hua. Metal aur wires isse door rakhiye.') },
        { k: 'tap', region: 'e_usb', do: t3('Tap the micro-USB socket.', 'माइक्रो-USB सॉकेट को छूइए।', 'Micro-USB socket ko touch karo.'), see: t3('Power and code come in here. A small regulator turns the USB\'s 5 V into 3.3 V for the chip.', 'बिजली और कोड यहीं से आते हैं। एक छोटा रेगुलेटर USB के 5 V को चिप के लिए 3.3 V में बदलता है।', 'Power aur code yahin se aate hain. Ek chhota regulator USB ke 5 V ko chip ke liye 3.3 V mein badalta hai.') },
        { k: 'tap', region: 'e_en', do: t3('Tap the button marked EN.', 'EN लिखे बटन को छूइए।', 'EN likhe button ko touch karo.'), see: t3('EN is the reset button. The other one, BOOT, is GPIO 0: hold it if an upload ever fails to start.', 'EN रीसेट बटन है। दूसरा, BOOT, GPIO 0 है: कभी अपलोड शुरू न हो तो इसे दबाकर रखिए।', 'EN reset button hai. Doosra, BOOT, GPIO 0 hai: kabhi upload shuru na ho to ise daba kar rakhiye.') },
        { k: 'tap', region: 'e_front', do: t3('Tap the front row of pins.', 'आगे वाली पिनों की कतार को छूइए।', 'Aage wali pins ki line ko touch karo.'), see: t3('Pins are named by GPIO number, not in order: D23 is GPIO 23, RX0 / TX0 are GPIO 3 / 1 (USB Serial). Point at a pin to see what it can do.', 'पिनों के नाम GPIO नंबर से हैं, क्रम में नहीं: D23 यानी GPIO 23, RX0 / TX0 यानी GPIO 3 / 1 (USB सीरियल)। पिन पर पॉइंट कीजिए, वह बताएगा कि क्या कर सकता है।', 'Pins ke naam GPIO number se hain, order mein nahi: D23 matlab GPIO 23, RX0 / TX0 matlab GPIO 3 / 1 (USB Serial). Pin par point kijiye, woh batayega ki kya kar sakta hai.') },
        { k: 'tap', region: 'e_back', do: t3('Tap the back row of pins.', 'पीछे वाली पिनों की कतार को छूइए।', 'Peeche wali pins ki line ko touch karo.'), see: t3('VIN (5 V from USB), GPIO 13 to 39, EN. GPIO 34, 35, 36 (VP) and 39 (VN) are input only: good for sensors, they cannot light an LED.', 'VIN (USB से 5 V), GPIO 13 से 39, EN। GPIO 34, 35, 36 (VP) और 39 (VN) सिर्फ़ इनपुट हैं: सेंसर के लिए अच्छे, एलईडी नहीं जला सकते।', 'VIN (USB se 5 V), GPIO 13 se 39, EN. GPIO 34, 35, 36 (VP) aur 39 (VN) sirf input hain: sensors ke liye achhe, LED nahi jala sakte.') },
        { k: 'info', do: t3('3.3 V logic: HIGH is 3.3 V, and the pins take at most 3.6 V. Never wire 5 V (VIN, or a 5 V sensor\'s output) straight to a GPIO: the lab warns you, a real ESP32 can be damaged.', '3.3 V लॉजिक: HIGH यानी 3.3 V, और पिन ज़्यादा से ज़्यादा 3.6 V सहते हैं। 5 V (VIN, या 5 V सेंसर का आउटपुट) कभी सीधे GPIO से मत जोड़िए: लैब चेतावनी देगी, असली ESP32 ख़राब हो सकता है।', '3.3 V logic: HIGH matlab 3.3 V, aur pins zyada se zyada 3.6 V sehte hain. 5 V (VIN, ya 5 V sensor ka output) kabhi seedhe GPIO se mat jodiye: lab warning degi, asli ESP32 kharab ho sakta hai.'),
          see: t3('The Serial Monitor is set to 115200 baud, the ESP32\'s usual speed.', 'सीरियल मॉनिटर 115200 बॉड पर है, ESP32 की आम रफ़्तार।', 'Serial Monitor 115200 baud par hai, ESP32 ki aam speed.') },
        { k: 'run', do: t3('Press Run.', '"चलाइए" दबाइए।', 'Run dabaiye.'), see: t3('First the ESP32 prints its start-up lines, then your sketch runs.', 'पहले ESP32 अपनी शुरुआती लाइनें लिखता है, फिर आपका स्केच चलता है।', 'Pehle ESP32 apni shuruaati lines likhta hai, phir aapka sketch chalta hai.') },
        { k: 'watch', until: (S) => S.toggles('L') >= 4, do: t3('Watch the blue LED.', 'नीली एलईडी को देखिए।', 'Neeli LED ko dekhiye.'), see: t3('It blinks: LED_BUILTIN is GPIO 2 on this board (13 on the Uno), and the same Arduino code runs.', 'यह जलती-बुझती है: इस बोर्ड पर LED_BUILTIN यानी GPIO 2 (Uno पर 13), और वही Arduino कोड चलता है।', 'Yeh blink karti hai: is board par LED_BUILTIN matlab GPIO 2 (Uno par 13), aur wahi Arduino code chalta hai.') },
      ],
      done: (S) => ['e_wroom', 'e_ant', 'e_usb', 'e_en', 'e_front', 'e_back'].every((r) => S.tapped(r)) && S.toggles('L') >= 4 },
    // ---------------------------------------------------------------------------------------------------- ESP32 2
    { id: 'esp_knob', board: 'esp32', view: 'bb', code: ESP_KNOB, drawer: [], baud: 115200, serial: true,
      title: t3('ESP32 knob dimmer: 12-bit ADC and PWM', 'ESP32 नॉब डिमर: 12-बिट ADC और PWM', 'ESP32 knob dimmer: 12-bit ADC aur PWM'),
      goal: t3('Read a knob as 0–4095 and set the LED\'s brightness with the ESP32\'s PWM (ledc).', 'नॉब को 0–4095 में पढ़िए और ESP32 के PWM (ledc) से एलईडी की चमक तय कीजिए।', 'Knob ko 0–4095 mein padhiye aur ESP32 ke PWM (ledc) se LED ki chamak tay kijiye.'),
      setup: { parts: [P('pot1', 'pot', {}, 'f30', 0)], wires: [['H:j4', rail('bp', 4)], ['H:j5', rail('bn', 5)], ['H:j30', rail('bn', 31)], ['H:j34', rail('bp', 33)]] },
      steps: [
        { k: 'info', do: t3('The knob\'s ends are on the bottom rails: + is joined to the ESP32\'s 3V3, − to GND. On an ESP32 the knob gets 3.3 V, never 5 V.', 'नॉब के सिरे नीचे की रेल पर हैं: + ESP32 के 3V3 से जुड़ी है, − GND से। ESP32 पर नॉब को 3.3 V मिलता है, 5 V कभी नहीं।', 'Knob ke ends neeche ki rail par hain: + ESP32 ke 3V3 se judi hai, − GND se. ESP32 par knob ko 3.3 V milta hai, 5 V kabhi nahi.'),
          see: t3('Its middle leg will give 0 V to 3.3 V.', 'इसका बीच वाला पैर 0 V से 3.3 V देगा।', 'Iska beech wala pair 0 V se 3.3 V dega.') },
        { k: 'wire', wire: ['pot1.W', 'D34'], do: t3('Wire the knob\'s middle leg (column 32, row g–j) to GPIO 34 (column 15, hole a15).', 'नॉब के बीच वाले पैर (कॉलम 32, पंक्ति g–j) से GPIO 34 (कॉलम 15, छेद a15) तक वायर।', 'Knob ke beech wale pair (column 32, row g–j) se GPIO 34 (column 15, hole a15) tak wire.'), see: t3('GPIO 34 is an ADC1 input: it can read voltages even while WiFi is on.', 'GPIO 34 एक ADC1 इनपुट है: WiFi चालू रहते भी यह वोल्टेज पढ़ सकता है।', 'GPIO 34 ek ADC1 input hai: WiFi on rehte bhi yeh voltage padh sakta hai.') },
        { k: 'check', do: t3('Check your circuit.', 'अपना सर्किट जाँचिए।', 'Apna circuit check karo.'), see: t3('', '', '') },
        { k: 'info', code: [9, 10], do: t3('Read the code. ledcSetup makes a PWM channel (5000 times a second, 8 bits: 0–255) and ledcAttachPin joins the LED\'s pin to it. Every output pin of an ESP32 can do PWM.', 'कोड पढ़िए। ledcSetup एक PWM चैनल बनाता है (एक सेकंड में 5000 बार, 8 बिट: 0–255) और ledcAttachPin एलईडी के पिन को उससे जोड़ता है। ESP32 का हर आउटपुट पिन PWM कर सकता है।', 'Code padhiye. ledcSetup ek PWM channel banata hai (ek second mein 5000 baar, 8 bit: 0–255) aur ledcAttachPin LED ke pin ko usse jodta hai. ESP32 ka har output pin PWM kar sakta hai.'),
          see: t3('analogWrite(2, value) also works on an ESP32; ledc lets you choose the speed and the number of steps.', 'analogWrite(2, value) भी ESP32 पर चलता है; ledc में आप रफ़्तार और कदमों की गिनती चुन सकते हैं।', 'analogWrite(2, value) bhi ESP32 par chalta hai; ledc mein aap speed aur steps ki ginti chun sakte hain.') },
        { k: 'run', do: t3('Press Run.', '"चलाइए" दबाइए।', 'Run dabaiye.'), see: t3('', '', '') },
        { k: 'act', until: (S) => S.adcMax(34) > 3900, do: t3('Turn the knob all the way up and watch the numbers.', 'नॉब को पूरा ऊपर घुमाइए और संख्याएँ देखिए।', 'Knob ko poora upar ghumaiye aur numbers dekhiye.'), see: t3('The reading climbs to 4095 (12 bits: four times finer than the Uno\'s 1023) and the blue LED is bright.', 'रीडिंग 4095 तक जाती है (12 बिट: Uno के 1023 से चार गुना बारीक) और नीली एलईडी तेज़ चमकती है।', 'Reading 4095 tak jaati hai (12 bit: Uno ke 1023 se chaar guna bareek) aur neeli LED tez chamakti hai.') },
        { k: 'act', until: (S) => S.adcMax(34) > 3900 && S.adcMin(34) < 150, do: t3('Now turn it all the way down.', 'अब इसे पूरा नीचे घुमाइए।', 'Ab ise poora neeche ghumaiye.'), see: t3('Near 0 V the ESP32 reads 0 a little early, and it reaches 4095 a little before 3.3 V: its ADC is not exact at the ends. Use the middle of the range for measuring.', '0 V के पास ESP32 थोड़ा पहले ही 0 पढ़ने लगता है, और 3.3 V से थोड़ा पहले 4095 पर पहुँच जाता है: इसका ADC सिरों पर एकदम सही नहीं है। नापने के लिए बीच की रेंज लीजिए।', '0 V ke paas ESP32 thoda pehle hi 0 padhne lagta hai, aur 3.3 V se thoda pehle 4095 par pahunch jaata hai: iska ADC ends par ekdum sahi nahi hai. Naapne ke liye beech ki range lijiye.') },
      ],
      check: [(S) => (S.conn('pot1.W', 'D34') ? null : [S4.wiper, { p: 'GPIO 34' }]), (S) => (S.conn('pot1.1', 'VIN') || S.conn('pot1.3', 'VIN') ? [S4.pot33] : null), (S) => ((S.conn('pot1.1', '3V3') && S.conn('pot1.3', 'GND')) || (S.conn('pot1.3', '3V3') && S.conn('pot1.1', 'GND')) ? null : [S4.ends, { v: '3V3' }])],
      done: (S) => S.running() && S.adcMax(34) > 3900 && S.adcMin(34) < 150 },
    // ---------------------------------------------------------------------------------------------------- ESP32 3
    { id: 'esp_touch', board: 'esp32', view: 'esp4', code: ESP_TOUCH, drawer: ['touch4'], baud: 115200, serial: true,
      title: t3('Touch light switch', 'टच लाइट स्विच', 'Touch light switch'),
      goal: t3('The ESP32 can feel a finger without any button: make a lamp you switch on and off by touching a copper plate.', 'ESP32 बिना बटन के उँगली महसूस कर सकता है: ऐसा लैंप बनाइए जो तांबे की प्लेट छूने से जले और बुझे।', 'ESP32 bina button ke ungli mehsoos kar sakta hai: aisa lamp banaiye jo copper plate chhoone se jale aur bujhe.'),
      setup: led25,
      steps: [
        { k: 'info', do: t3('The red LED (the lamp) is on GPIO 25, through its resistor to GND. GPIO 4 is touch pin T0: it can tell when a finger is near.', 'लाल एलईडी (लैंप) GPIO 25 पर है, अपने रेज़िस्टर से होकर GND तक। GPIO 4 टच पिन T0 है: उँगली पास आने का पता लगा सकता है।', 'Red LED (lamp) GPIO 25 par hai, apne resistor se hokar GND tak. GPIO 4 touch pin T0 hai: ungli paas aane ka pata laga sakta hai.'),
          see: t3('A real ESP32 has nine touch pins.', 'असली ESP32 में नौ टच पिन होते हैं।', 'Asli ESP32 mein nau touch pins hote hain.') },
        { k: 'place', place: F('pad1', 'touch4', {}, 60, 72, 0), do: t3('Put the copper touch plate on the mat at the ghost.', 'तांबे की टच प्लेट को मैट पर नीली आकृति पर रखिए।', 'Copper touch plate ko mat par neeli shape par rakhiye.'), see: t3('', '', '') },
        { k: 'wire', wire: ['pad1.PAD', 'D4'], do: t3('Wire the plate\'s pin to GPIO 4 (T0): column 8, hole j8.', 'प्लेट के पिन से GPIO 4 (T0) तक वायर: कॉलम 8, छेद j8।', 'Plate ke pin se GPIO 4 (T0) tak wire: column 8, hole j8.'), see: t3('', '', '') },
        { k: 'check', do: t3('Check your circuit.', 'अपना सर्किट जाँचिए।', 'Apna circuit check karo.'), see: t3('', '', '') },
        { k: 'run', do: t3('Press Run and look at the Serial Monitor.', '"चलाइए" दबाइए और सीरियल मॉनिटर देखिए।', 'Run dabaiye aur Serial Monitor dekhiye.'), see: t3('touchRead(T0) gives about 70 with nothing near.', 'कुछ पास न हो तो touchRead(T0) लगभग 70 देता है।', 'Kuch paas na ho to touchRead(T0) lagbhag 70 deta hai.') },
        { k: 'act', until: (S) => S.ledLit('led1'), do: t3('Touch the plate (press and hold it for a moment).', 'प्लेट को छूइए (एक पल के लिए दबाकर रखिए)।', 'Plate ko touch karo (ek pal ke liye daba kar rakhiye).'), see: t3('The number drops to about 15: your finger stores a little charge. The sketch sees it below 40 and turns the lamp on.', 'संख्या लगभग 15 पर गिर जाती है: आपकी उँगली थोड़ा चार्ज जमा करती है। स्केच इसे 40 से नीचे देखता है और लैंप जला देता है।', 'Number lagbhag 15 par gir jaata hai: aapki ungli thoda charge jama karti hai. Sketch ise 40 se neeche dekhta hai aur lamp jala deta hai.') },
        { k: 'act', until: (S) => S.toggles('led1') >= 2 && !S.ledLit('led1'), do: t3('Touch it again.', 'इसे फिर छूइए।', 'Ise phir touch karo.'), see: t3('Off again: one plate, no moving parts. Phones and lift buttons use the same idea.', 'फिर बंद: एक प्लेट, कोई हिलने वाला पुर्ज़ा नहीं। फ़ोन और लिफ़्ट के बटन यही तरीक़ा अपनाते हैं।', 'Phir band: ek plate, koi hilne wala part nahi. Phone aur lift ke buttons yahi tareeka apnaate hain.') },
      ],
      check: [has('pad1', NM.pad), (S) => (S.conn('pad1.PAD', 'D4') ? null : [S4.pad]), unit('led1', 'r1', 25)],
      done: (S) => S.running() && S.toggles('led1') >= 2 },
    // ---------------------------------------------------------------------------------------------------- ESP32 4
    { id: 'esp_wifi', board: 'esp32', view: 'esp4', code: ESP_WIFI, drawer: [], baud: 115200, serial: true, phone: true,
      title: t3('WiFi lamp: control it from a phone', 'WiFi लैंप: फ़ोन से चलाइए', 'WiFi lamp: phone se chalaiye'),
      goal: t3('Join the school WiFi, make a small web page on the ESP32, and switch the lamp from a phone\'s browser.', 'स्कूल के WiFi से जुड़िए, ESP32 पर एक छोटा वेब पेज बनाइए, और फ़ोन के ब्राउज़र से लैंप चलाइए।', 'School ke WiFi se judiye, ESP32 par ek chhota web page banaiye, aur phone ke browser se lamp chalaiye.'),
      setup: led25,
      steps: [
        { k: 'info', do: t3('Beside the bench: the school WiFi router and a phone on that WiFi. The router\'s sticker shows the network\'s name, DUET-School, and its password, stem2026.', 'बेंच के पास: स्कूल का WiFi राउटर और उसी WiFi पर एक फ़ोन। राउटर के स्टिकर पर नेटवर्क का नाम DUET-School और पासवर्ड stem2026 लिखा है।', 'Bench ke paas: school ka WiFi router aur usi WiFi par ek phone. Router ke sticker par network ka naam DUET-School aur password stem2026 likha hai.'),
          see: t3('Everything is simulated here: no real network is used.', 'यहाँ सब कुछ सिम्युलेट किया गया है: कोई असली नेटवर्क इस्तेमाल नहीं होता।', 'Yahan sab kuch simulate kiya gaya hai: koi asli network use nahi hota.') },
        { k: 'edit', test: (src) => /password\s*=\s*"stem2026"/.test(src), set: [[/password = ""/, 'password = "stem2026"']], do: t3('In the code, type the password between the quotes: password = "stem2026"; then press Run.', 'कोड में quotes के बीच पासवर्ड लिखिए: password = "stem2026"; फिर "चलाइए" दबाइए।', 'Code mein quotes ke beech password likhiye: password = "stem2026"; phir Run dabaiye.'),
          see: t3('The Serial Monitor prints dots while the ESP32 joins the WiFi (about 2 seconds).', 'ESP32 के WiFi से जुड़ते समय सीरियल मॉनिटर पर बिंदु छपते हैं (लगभग 2 सेकंड)।', 'ESP32 ke WiFi se judte waqt Serial Monitor par dots chhapte hain (lagbhag 2 second).') },
        { k: 'watch', until: (S) => !!net(S).staIP() && S.lineCount() >= 2, do: t3('Wait for the ESP32 to join the WiFi, and read its address on the Serial Monitor.', 'ESP32 के WiFi से जुड़ने का इंतज़ार कीजिए, और सीरियल मॉनिटर पर उसका पता पढ़िए।', 'ESP32 ke WiFi se judne ka intezaar kijiye, aur Serial Monitor par uska address padhiye.'), see: t3('Like http://192.168.1.47: the router gave the ESP32 this address (an IP address) on the school network.', 'जैसे http://192.168.1.47: राउटर ने स्कूल नेटवर्क पर ESP32 को यह पता (IP एड्रेस) दिया है।', 'Jaise http://192.168.1.47: router ne school network par ESP32 ko yeh address (IP address) diya hai.') },
        { k: 'act', until: (S) => (paths(S)['/'] || 0) >= 1, do: t3('On the phone, tap the browser\'s address bar, type that address and press Go.', 'फ़ोन पर ब्राउज़र के एड्रेस बार को छूइए, वह पता लिखिए और Go दबाइए।', 'Phone par browser ke address bar ko touch karo, woh address likhiye aur Go dabaiye.'), see: t3('The page comes from your ESP32: handleRoot() made that HTML. No internet is needed, only the same WiFi.', 'यह पेज आपके ESP32 से आया है: handleRoot() ने वह HTML बनाया। इंटरनेट नहीं चाहिए, बस एक ही WiFi।', 'Yeh page aapke ESP32 se aaya hai: handleRoot() ne woh HTML banaya. Internet nahi chahiye, bas ek hi WiFi.') },
        { k: 'act', until: (S) => (paths(S)['/on'] || 0) >= 1 && S.ledLit('led1'), do: t3('Tap ON on the phone.', 'फ़ोन पर ON दबाइए।', 'Phone par ON dabaiye.'), see: t3('The phone asked for the page /on; server.handleClient() ran handleOn(), and GPIO 25 went HIGH.', 'फ़ोन ने /on पेज माँगा; server.handleClient() ने handleOn() चलाया, और GPIO 25 HIGH हो गया।', 'Phone ne /on page maanga; server.handleClient() ne handleOn() chalaya, aur GPIO 25 HIGH ho gaya.') },
        { k: 'act', until: (S) => (paths(S)['/off'] || 0) >= 1 && !S.ledLit('led1') && S.toggles('led1') >= 2, do: t3('Tap OFF.', 'OFF दबाइए।', 'OFF dabaiye.'), see: t3('You switch a lamp over WiFi: smart plugs and smart lights work just like this.', 'आप WiFi से लैंप चला रहे हैं: स्मार्ट प्लग और स्मार्ट लाइट बिल्कुल ऐसे ही काम करते हैं।', 'Aap WiFi se lamp chala rahe hain: smart plugs aur smart lights bilkul aise hi kaam karte hain.') },
      ],
      check: [unit('led1', 'r1', 25)],
      done: (S) => (paths(S)['/on'] || 0) >= 1 && (paths(S)['/off'] || 0) >= 1 && S.toggles('led1') >= 2 },
    // ---------------------------------------------------------------------------------------------------- ESP32 5
    { id: 'esp_iot', board: 'esp32', view: 'esp4', code: ESP_IOT, drawer: ['lm35'], baud: 115200, serial: true, phone: true,
      title: t3('IoT temperature dashboard', 'IoT तापमान डैशबोर्ड', 'IoT temperature dashboard'),
      goal: t3('Measure the room\'s temperature with an LM35 and show a live chart on the phone: your own Internet of Things device.', 'LM35 से कमरे का तापमान नापिए और फ़ोन पर लाइव चार्ट दिखाइए: आपका अपना Internet of Things उपकरण।', 'LM35 se room ka temperature naapiye aur phone par live chart dikhaiye: aapka apna Internet of Things device.'),
      setup: { parts: [], wires: [['H:a4', rail('tp', 4)], ['H:a5', rail('tn', 5)]] },
      steps: [
        { k: 'place', place: P('t1', 'lm35', {}, 'e40', 0), do: t3('Put the LM35 in 40e–42e, flat side facing you.', 'LM35 को 40e–42e में लगाइए, चपटी तरफ़ आपकी ओर।', 'LM35 ko 40e–42e mein lagaiye, flat side aapki taraf.'), see: t3('The top rails are already joined to the ESP32: + to VIN (5 V), − to GND.', 'ऊपर की रेल पहले से ESP32 से जुड़ी हैं: + VIN (5 V) से, − GND से।', 'Upar ki rail pehle se ESP32 se judi hain: + VIN (5 V) se, − GND se.') },
        { k: 'wire', wire: ['t1.VS', 'rail:tp'], do: t3('Wire its left leg (column 40) to the + rail: the LM35 needs at least 4 V, so it takes VIN, not 3V3.', 'इसके बाएँ पैर (कॉलम 40) से + रेल तक वायर: LM35 को कम से कम 4 V चाहिए, इसलिए यह VIN लेता है, 3V3 नहीं।', 'Iske left pair (column 40) se + rail tak wire: LM35 ko kam se kam 4 V chahiye, isliye yeh VIN leta hai, 3V3 nahi.'), see: t3('', '', '') },
        { k: 'wire', wire: ['t1.OUT', 'D34'], do: t3('Wire its middle leg (column 41) to GPIO 34 (hole a15).', 'इसके बीच वाले पैर (कॉलम 41) से GPIO 34 (छेद a15) तक वायर।', 'Iske beech wale pair (column 41) se GPIO 34 (hole a15) tak wire.'), see: t3('Its output is only 0.26 V at 26 °C: safe for a 3.3 V pin.', 'इसका आउटपुट 26 °C पर सिर्फ़ 0.26 V है: 3.3 V पिन के लिए सुरक्षित।', 'Iska output 26 °C par sirf 0.26 V hai: 3.3 V pin ke liye surakshit.') },
        { k: 'wire', wire: ['t1.GND', 'rail:tn'], do: t3('Wire its right leg (column 42) to the − rail.', 'इसके दाएँ पैर (कॉलम 42) से − रेल तक वायर।', 'Iske right pair (column 42) se − rail tak wire.'), see: t3('', '', '') },
        { k: 'check', do: t3('Check your circuit.', 'अपना सर्किट जाँचिए।', 'Apna circuit check karo.'), see: t3('', '', '') },
        { k: 'info', code: [13, 16], do: t3('Read readTemp(): analogReadMilliVolts() uses the ESP32\'s factory calibration, so 260 mV really means 26 °C. (Plain analogRead is not exact near 0 V on an ESP32.)', 'readTemp() पढ़िए: analogReadMilliVolts() ESP32 की फ़ैक्ट्री कैलिब्रेशन इस्तेमाल करता है, इसलिए 260 mV सच में 26 °C है। (ESP32 पर सादा analogRead 0 V के पास सटीक नहीं होता।)', 'readTemp() padhiye: analogReadMilliVolts() ESP32 ki factory calibration use karta hai, isliye 260 mV sach mein 26 °C hai. (ESP32 par saada analogRead 0 V ke paas sateek nahi hota.)'),
          see: t3('handleRoot() builds the page: the latest reading, and a line chart (an SVG polyline) of the last 20.', 'handleRoot() पेज बनाता है: नई रीडिंग, और पिछली 20 का लाइन चार्ट (SVG polyline)।', 'handleRoot() page banata hai: nayi reading, aur pichhli 20 ka line chart (SVG polyline).') },
        { k: 'run', do: t3('Press Run.', '"चलाइए" दबाइए।', 'Run dabaiye.'), see: t3('It joins the WiFi and prints the dashboard\'s address.', 'यह WiFi से जुड़ता है और डैशबोर्ड का पता लिखता है।', 'Yeh WiFi se judta hai aur dashboard ka address likhta hai.') },
        { k: 'act', until: (S) => (paths(S)['/'] || 0) >= 2, do: t3('On the phone, open that address in the browser.', 'फ़ोन पर ब्राउज़र में वह पता खोलिए।', 'Phone par browser mein woh address kholiye.'), see: t3('The page asks again every 2 seconds by itself (meta refresh), and the chart grows.', 'पेज हर 2 सेकंड में ख़ुद दोबारा माँगता है (meta refresh), और चार्ट बढ़ता जाता है।', 'Page har 2 second mein khud dobara maangta hai (meta refresh), aur chart badhta jaata hai.') },
        { k: 'act', until: (S) => S.tempSeen(37) && (paths(S)['/'] || 0) >= 4 && /polyline/.test((net(S).seen.last || {}).body || ''), do: t3('Tap the sensor and warm it to 40 °C (like holding it in your hand on a hot day).', 'सेंसर को छूइए और उसे 40 °C तक गर्म कीजिए (जैसे गर्मी के दिन हाथ में पकड़ने पर)।', 'Sensor ko touch karo aur use 40 °C tak garam kijiye (jaise garmi ke din haath mein pakadne par).'), see: t3('The line on the phone climbs. Farms, cold stores and hospitals watch temperatures from far away like this.', 'फ़ोन पर लाइन ऊपर चढ़ती है। खेत, कोल्ड स्टोर और अस्पताल दूर से तापमान ऐसे ही देखते हैं।', 'Phone par line upar chadhti hai. Khet, cold store aur hospital door se temperature aise hi dekhte hain.') },
      ],
      check: [has('t1', N.lm), (S) => (S.conn('t1.VS', 'VIN') ? null : [S4.lm5]), (S) => (S.conn('t1.OUT', 'D34') ? null : [S4.adc1]), need('t1.GND', 'GND', W.toGnd, { x: t3('LM35\'s right leg', 'LM35 का दायाँ पैर', 'LM35 ka right pair') })],
      done: (S) => S.tempSeen(37) && (paths(S)['/'] || 0) >= 4 },
    // ---------------------------------------------------------------------------------------------------- ESP32 6
    { id: 'esp_bt', board: 'esp32', view: 'esp4', code: ESP_BT, drawer: [], baud: 115200, serial: true, phone: true,
      title: t3('Bluetooth lamp', 'Bluetooth लैंप', 'Bluetooth lamp'),
      goal: t3('Use the ESP32\'s own Bluetooth: a phone app sends 1 or 0, and the lamp obeys. No extra module needed.', 'ESP32 का अपना Bluetooth इस्तेमाल कीजिए: फ़ोन का ऐप 1 या 0 भेजता है, और लैंप मानता है। अलग मॉड्यूल की ज़रूरत नहीं।', 'ESP32 ka apna Bluetooth use kijiye: phone ka app 1 ya 0 bhejta hai, aur lamp maanta hai. Alag module ki zaroorat nahi.'),
      setup: led25,
      steps: [
        { k: 'info', code: [3, 9], do: t3('With an Uno you need an HC-05 module for Bluetooth. The ESP32 has it inside: BluetoothSerial works like Serial, but over the air.', 'Uno के साथ Bluetooth के लिए HC-05 मॉड्यूल चाहिए। ESP32 में यह अंदर ही है: BluetoothSerial, Serial की तरह ही काम करता है, पर हवा के रास्ते।', 'Uno ke saath Bluetooth ke liye HC-05 module chahiye. ESP32 mein yeh andar hi hai: BluetoothSerial, Serial ki tarah hi kaam karta hai, par hawa ke raaste.'),
          see: t3('SerialBT.begin("DUET-ESP32") gives the board its Bluetooth name.', 'SerialBT.begin("DUET-ESP32") बोर्ड को उसका Bluetooth नाम देता है।', 'SerialBT.begin("DUET-ESP32") board ko uska Bluetooth naam deta hai.') },
        { k: 'run', do: t3('Press Run.', '"चलाइए" दबाइए।', 'Run dabaiye.'), see: t3('', '', '') },
        { k: 'act', until: (S) => net(S).bt.conn === 'DUET-ESP32', do: t3('On the phone, open the BT Terminal app and tap DUET-ESP32 to connect.', 'फ़ोन पर BT Terminal ऐप खोलिए और जुड़ने के लिए DUET-ESP32 को छूइए।', 'Phone par BT Terminal app kholiye aur judne ke liye DUET-ESP32 ko touch karo.'), see: t3('Connected: the phone and the ESP32 now talk like a Serial cable without a cable.', 'जुड़ गया: अब फ़ोन और ESP32 बिना केबल के, सीरियल केबल की तरह बात करते हैं।', 'Jud gaya: ab phone aur ESP32 bina cable ke, Serial cable ki tarah baat karte hain.') },
        { k: 'act', until: (S) => S.ledLit('led1') && (net(S).bt.got || 0) >= 1, do: t3('Tap the button 1.', 'बटन 1 दबाइए।', 'Button 1 dabaiye.'), see: t3('The app sent "1"; SerialBT.read() got it, the lamp is on, and the ESP32 answered "Lamp ON".', 'ऐप ने "1" भेजा; SerialBT.read() ने उसे पाया, लैंप जल गया, और ESP32 ने जवाब दिया "Lamp ON"।', 'App ne "1" bheja; SerialBT.read() ne use paaya, lamp jal gaya, aur ESP32 ne jawab diya "Lamp ON".') },
        { k: 'act', until: (S) => !S.ledLit('led1') && S.toggles('led1') >= 2, do: t3('Tap the button 0.', 'बटन 0 दबाइए।', 'Button 0 dabaiye.'), see: t3('Off. Change the sketch so that "2" makes the lamp blink, if you like!', 'बंद। चाहें तो स्केच बदलिए ताकि "2" भेजने पर लैंप जलता-बुझता रहे!', 'Band. Chahein to sketch badliye taaki "2" bhejne par lamp blink karta rahe!') },
      ],
      check: [unit('led1', 'r1', 25)],
      done: (S) => S.toggles('led1') >= 2 && (net(S).bt.got || 0) >= 2 },
    // ---------------------------------------------------------------------------------------------------- ESP32 7
    { id: 'esp_hall', board: 'esp32', view: 'board', code: ESP_HALL, drawer: [], baud: 115200, serial: true,
      title: t3('The ESP32\'s own sensors', 'ESP32 के अपने सेंसर', 'ESP32 ke apne sensors'),
      goal: t3('The ESP32 chip can feel a magnet with no extra part. Find out, too, why its own "temperature sensor" cannot measure the room.', 'ESP32 चिप बिना किसी अलग पुर्ज़े के चुंबक महसूस कर सकती है। यह भी जानिए कि इसका अपना "तापमान सेंसर" कमरे का तापमान क्यों नहीं नाप सकता।', 'ESP32 chip bina kisi alag part ke magnet mehsoos kar sakti hai. Yeh bhi jaaniye ki iska apna "temperature sensor" room ka temperature kyun nahi naap sakta.'),
      setup: { parts: [F('mag1', 'magnet4', {}, 0, 0, 0)], wires: [] },
      steps: [
        { k: 'info', do: t3('Under the metal can, the original ESP32 chip has a Hall sensor: it feels magnetic fields. hallRead() reads it, but only with the ESP32 Arduino core 2.x (core 3.0 removed it) and only on the original ESP32 (like this WROOM-32): the newer ESP32-S2, S3 and C3 have no Hall sensor.', 'धातु के डिब्बे के नीचे, ओरिजिनल ESP32 चिप में एक हॉल सेंसर है: यह चुंबकीय क्षेत्र महसूस करता है। hallRead() इसे पढ़ता है, पर सिर्फ़ ESP32 Arduino core 2.x में (core 3.0 में हटा दिया गया) और सिर्फ़ ओरिजिनल ESP32 (जैसे यह WROOM-32) पर: नए ESP32-S2, S3 और C3 में हॉल सेंसर नहीं है।', 'Metal dabbe ke neeche, original ESP32 chip mein ek Hall sensor hai: yeh magnetic field mehsoos karta hai. hallRead() ise padhta hai, par sirf ESP32 Arduino core 2.x mein (core 3.0 mein hata diya gaya) aur sirf original ESP32 (jaise yeh WROOM-32) par: naye ESP32-S2, S3 aur C3 mein Hall sensor nahi hai.'),
          see: t3('A bar magnet is held 4 cm above the board.', 'एक छड़ चुंबक बोर्ड से 4 cm ऊपर पकड़ा हुआ है।', 'Ek chhad magnet board se 4 cm upar pakda hua hai.') },
        { k: 'run', do: t3('Press Run.', '"चलाइए" दबाइए।', 'Run dabaiye.'), see: t3('', '', '') },
        { k: 'watch', until: (S) => S.lineCount() >= 3, do: t3('Read the Hall numbers on the Serial Monitor.', 'सीरियल मॉनिटर पर हॉल की संख्याएँ पढ़िए।', 'Serial Monitor par Hall ke numbers padhiye.'), see: t3('About 10 to 30, a little jumpy: that is the Earth and the room, with no magnet near.', 'लगभग 10 से 30, थोड़ा उछलती हुई: चुंबक पास न हो तो यह धरती और कमरे का क्षेत्र है।', 'Lagbhag 10 se 30, thoda uchhalti hui: magnet paas na ho to yeh dharti aur room ka field hai.') },
        { k: 'act', until: (S) => !!S.lab.mcu.hallSeen && S.lab.mcu.hallSeen.max > 70, do: t3('Tap the magnet and slide it down to 5 mm above the can.', 'चुंबक को छूइए और उसे डिब्बे से 5 mm ऊपर तक नीचे लाइए।', 'Magnet ko touch karo aur use dabbe se 5 mm upar tak neeche laiye.'), see: t3('The number jumps above 60 and the blue LED lights: the sketch noticed the magnet.', 'संख्या 60 से ऊपर कूदती है और नीली एलईडी जलती है: स्केच ने चुंबक पहचान लिया।', 'Number 60 se upar koodta hai aur neeli LED jalti hai: sketch ne magnet pehchaan liya.') },
        { k: 'act', until: (S) => !!S.lab.mcu.hallSeen && S.lab.mcu.hallSeen.min < -40, do: t3('Turn the magnet over (Flip: S pole down).', 'चुंबक को पलटिए (Flip: S ध्रुव नीचे)।', 'Magnet ko palatiye (Flip: S pole neeche).'), see: t3('Now the number goes below zero: the Hall sensor tells north from south.', 'अब संख्या शून्य से नीचे जाती है: हॉल सेंसर उत्तर और दक्षिण ध्रुव में फ़र्क़ पहचानता है।', 'Ab number zero se neeche jaata hai: Hall sensor north aur south pole mein farq pehchaanta hai.') },
        { k: 'info', do: t3('Now look at "chip temperature": always 53.3, hot room or cold. The first ESP32s had a temperature sensor inside; on this chip it does not work, and temperatureRead() just gives 53.3 °C.', 'अब "chip temperature" देखिए: हमेशा 53.3, कमरा गर्म हो या ठंडा। पहले के ESP32 में अंदर तापमान सेंसर था; इस चिप पर वह काम नहीं करता, और temperatureRead() बस 53.3 °C देता है।', 'Ab "chip temperature" dekhiye: hamesha 53.3, room garam ho ya thanda. Pehle ke ESP32 mein andar temperature sensor tha; is chip par woh kaam nahi karta, aur temperatureRead() bas 53.3 °C deta hai.'),
          see: t3('A chip\'s own sensor would measure the chip, not the room anyway. For the room, use an LM35 or DHT11 (the IoT dashboard lesson).', 'चिप का अपना सेंसर वैसे भी चिप को नापता, कमरे को नहीं। कमरे के लिए LM35 या DHT11 लीजिए (IoT डैशबोर्ड वाला पाठ)।', 'Chip ka apna sensor waise bhi chip ko naapta, room ko nahi. Room ke liye LM35 ya DHT11 lijiye (IoT dashboard wala lesson).') },
      ],
      done: (S) => !!S.lab.mcu.hallSeen && S.lab.mcu.hallSeen.max > 70 && S.lab.mcu.hallSeen.min < -40 },
  ];
  L.forEach((l, i) => { l.n = K.base + i; l.batch = 4; });
  return L;
}
export { rail };
