// DUET Robotics Lab 360, batch 3: ten projects that Indian school ATL / STEM labs build with the common modules. Same
// shape as lessons.js; `scene` is what stands next to the bench (scenes3.js: the logic, worlds3.js: the 3D), `rview` the
// camera for its run / watch / act steps, `blocks: true` opens the lesson in the block editor (Class 6–8), `cls` the class.
// The last step of each lesson shows the student's own results: numbers taken from what really happened (live()).
// The helpers (t3, P, F, W, need, has, noShort, N) come from lessons.js (batch3(K)), so there is no import loop.
import { CUR } from './scenes3.js';

// ------------------------------------------------------------------ the sketches
const THERMO = `// Digital thermometer: the DHT11 measures, the LCD shows it
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <DHT.h>

LiquidCrystal_I2C lcd(0x27, 16, 2);   // address 0x27, 16 columns, 2 rows
DHT dht(2, DHT11);                    // the DHT11's DATA is on pin 2

void setup() {
  lcd.init();
  lcd.backlight();
  dht.begin();
  lcd.setCursor(0, 0);
  lcd.print("DUET Thermometer");
  delay(1500);
}

void loop() {
  float t = dht.readTemperature();   // degrees Celsius
  float h = dht.readHumidity();      // percent
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Temp: ");
  lcd.print(t, 1);
  lcd.print(" C");
  lcd.setCursor(0, 1);
  lcd.print("Humidity: ");
  lcd.print(h, 0);
  lcd.print(" %");
  delay(2000);
}
`;
const GARDEN = `// Smart irrigation: water the plant only when its soil is dry
const int sensor = A0;   // the soil sensor's AO
const int relay = 7;     // the relay's S: HIGH = pump on
int dry = 600;           // above this number the soil is dry

void setup() {
  pinMode(relay, OUTPUT);
  Serial.begin(9600);
}

void loop() {
  int soil = analogRead(sensor);   // dry soil: big number, wet soil: small
  Serial.print("Soil: ");
  Serial.println(soil);
  if (soil > dry) {
    digitalWrite(relay, HIGH);     // dry: pump on
  } else {
    digitalWrite(relay, LOW);      // wet enough: pump off
  }
  delay(500);
}
`;
const ROOM = `// Home automation: the remote's buttons switch the lamp and the fan
#include <IRremote.hpp>
const int lampRelay = 7;
const int fanRelay = 8;
bool lamp = false;
bool fan = false;

void setup() {
  pinMode(lampRelay, OUTPUT);
  pinMode(fanRelay, OUTPUT);
  Serial.begin(9600);
  IrReceiver.begin(11);          // the receiver's OUT is on pin 11
}

void loop() {
  if (IrReceiver.decode()) {
    int code = IrReceiver.decodedIRData.command;
    Serial.print("Button code: ");
    Serial.println(code);
    if (code == 69) {            // button 1: the lamp
      lamp = !lamp;
      digitalWrite(lampRelay, lamp);
    }
    if (code == 70) {            // button 2: the fan
      fan = !fan;
      digitalWrite(fanRelay, fan);
    }
    IrReceiver.resume();         // ready for the next button
  }
}
`;
const BURGLAR = `// Burglar alarm: the PIR sees someone move, the buzzer and the LED warn
const int pir = 2;
const int buzzer = 8;
const int led = 13;

void setup() {
  pinMode(pir, INPUT);
  pinMode(led, OUTPUT);
}

void loop() {
  if (digitalRead(pir) == HIGH) {   // someone moved
    digitalWrite(led, HIGH);
    tone(buzzer, 2000, 150);
    delay(200);
    digitalWrite(led, LOW);
    delay(100);
  } else {
    digitalWrite(led, LOW);
  }
}
`;
const DOOR = `// RFID door lock: the servo opens the latch only for the right card
#include <SPI.h>
#include <MFRC522.h>
#include <Servo.h>

MFRC522 rfid(10, 9);              // SDA (SS) on pin 10, RST on pin 9
Servo latch;
String allowed = "00 00 00 00";   // put your card's number here

void setup() {
  Serial.begin(9600);
  SPI.begin();
  rfid.PCD_Init();
  latch.attach(3);
  latch.write(0);                 // 0 degrees = locked
  Serial.println("Show a card...");
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
  if (uid == allowed) {
    Serial.println("Welcome! Door open");
    latch.write(90);              // pull the latch: the door swings open
    delay(3000);
    latch.write(0);               // lock again
  } else {
    Serial.println("Access denied");
  }
  rfid.PICC_HaltA();
}
`;
const WEATHER = `// Weather station: temperature and humidity on the OLED
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <DHT.h>

Adafruit_SSD1306 display(128, 64, &Wire, -1);
DHT dht(2, DHT11);

void setup() {
  dht.begin();
  display.begin(SSD1306_SWITCHCAPVCC, 0x3C);
}

void loop() {
  float t = dht.readTemperature();
  float h = dht.readHumidity();
  display.clearDisplay();
  display.setTextColor(SSD1306_WHITE);
  display.setTextSize(1);
  display.setCursor(0, 0);
  display.println("DUET Weather");
  display.setTextSize(2);
  display.setCursor(0, 18);
  display.print(t, 1);
  display.println(" C");
  display.setCursor(0, 42);
  display.print(h, 0);
  display.println(" %");
  display.drawRect(104, 14, 20, 50, SSD1306_WHITE);     // a thermometer
  display.fillRect(107, 61 - t, 14, t, SSD1306_WHITE);  // 1 dot = 1 degree
  display.display();
  delay(2000);
}
`;
const LOCKER = `// Keypad lock: type the password and # to open the locker
#include <Keypad.h>
#include <Servo.h>

const byte ROWS = 4;
const byte COLS = 4;
char keys[ROWS][COLS] = {
  {'1', '2', '3', 'A'},
  {'4', '5', '6', 'B'},
  {'7', '8', '9', 'C'},
  {'*', '0', '#', 'D'}
};
byte rowPins[ROWS] = {9, 8, 7, 6};
byte colPins[COLS] = {5, 4, 3, 2};
Keypad keypad = Keypad(makeKeymap(keys), rowPins, colPins, ROWS, COLS);

Servo latch;
const int buzzer = 12;
String password = "1234";
String typed = "";

void setup() {
  latch.attach(10);
  latch.write(0);                 // locked
  Serial.begin(9600);
}

void loop() {
  char key = keypad.getKey();
  if (key) {
    tone(buzzer, 1800, 40);       // a short beep for every key
    Serial.print(key);
    if (key == '#') {             // # = check the password
      Serial.println();
      if (typed == password) {
        Serial.println("Open!");
        latch.write(90);
        delay(4000);
        latch.write(0);
      } else {
        Serial.println("Wrong password");
        tone(buzzer, 300, 800);   // a long low beep
      }
      typed = "";
    } else if (key == '*') {      // * = start again
      typed = "";
    } else {
      typed += key;
    }
  }
}
`;
const GAS = `// Gas leak alarm: the MQ-2 smells LPG, the buzzer and the red LED warn
const int gas = A0;
const int buzzer = 8;
const int led = 13;
int limit = 300;          // above this number: gas!

void setup() {
  pinMode(led, OUTPUT);
  Serial.begin(9600);
}

void loop() {
  int value = analogRead(gas);
  Serial.print("Gas: ");
  Serial.println(value);
  if (value > limit) {
    digitalWrite(led, HIGH);
    tone(buzzer, 2500);
  } else {
    digitalWrite(led, LOW);
    noTone(buzzer);
  }
  delay(300);
}
`;
const PANTILT = `// Pan-tilt: the joystick moves the laser head left-right and up-down
#include <Servo.h>
Servo pan;
Servo tilt;

void setup() {
  pan.attach(5);
  tilt.attach(6);
  Serial.begin(9600);
}

void loop() {
  int x = analogRead(A0);                   // left-right: 0 to 1023
  int y = analogRead(A1);                   // down-up: 0 to 1023
  int panAngle = map(x, 0, 1023, 180, 0);   // stick right: turn right
  int tiltAngle = map(y, 0, 1023, 30, 150); // stick up: look up
  pan.write(panAngle);
  tilt.write(tiltAngle);
  Serial.print(panAngle);
  Serial.print(" ");
  Serial.println(tiltAngle);
  delay(15);
}
`;
const TURN = `// Turntable: the stepper turns the plate a quarter turn at a time
#include <Stepper.h>
const int stepsPerTurn = 2048;               // 28BYJ-48: 2048 steps = one full turn
Stepper motor(stepsPerTurn, 8, 10, 9, 11);   // IN1, IN3, IN2, IN4

void setup() {
  motor.setSpeed(10);                        // 10 turns a minute
  Serial.begin(9600);
}

void loop() {
  Serial.println("Quarter turn");
  motor.step(512);                           // 2048 / 4 = 512 steps = 90 degrees
  delay(1000);
}
`;

// a step's text that is worked out from what really happened (getters: read each time the card is drawn)
function live(f) { const o = {}; for (const lg of ['en', 'hi', 'hg']) Object.defineProperty(o, lg, { enumerable: true, get: () => { try { return String(f(lg, (CUR.sim && CUR.sim.res) || {}) || ''); } catch (e) { return ''; } } }); return o; }
const pick = (lg, en, hi, hg) => (lg === 'hi' ? hi : lg === 'hg' ? hg : en);

export function batch3(K) {
  const { t3, P, F, W, need, has, noShort, N } = K;
  const n0 = K.n0 || 23;
  const X = {
    i2c: t3('{a} must go to {b}: on the Uno, A4 is SDA and A5 is SCL, the two I2C wires.', '{a} को {b} से जोड़िए: Uno पर A4 ही SDA है और A5 ही SCL, यही दो I2C तार हैं।', '{a} ko {b} se jodiye: Uno par A4 hi SDA hai aur A5 hi SCL, yahi do I2C wires hain.'),
    i2cSwap: t3('SDA and SCL are swapped. SDA (data) goes to A4, SCL (clock) to A5; swapped, the screen stays blank.', 'SDA और SCL उल्टे लगे हैं। SDA (डेटा) A4 पर, SCL (क्लॉक) A5 पर; उल्टे लगे तो स्क्रीन ख़ाली रहेगी।', 'SDA aur SCL ulte lage hain. SDA (data) A4 par, SCL (clock) A5 par; ulte lage to screen khaali rahegi.'),
    frontRails: t3('The front rails are not powered: join the back + rail to the front + rail and − to −.', 'आगे वाली रेलों को बिजली नहीं मिल रही: पीछे की + रेल को आगे की + रेल से और − को − से जोड़िए।', 'Aage wali rails ko power nahi mil rahi: peeche ki + rail ko aage ki + rail se aur − ko − se jodiye.'),
    mains: t3('The 230 V box\'s wires belong in the relay\'s COM and NO. Ask your teacher: never move mains wires yourself.', '230 V डिब्बे के तार रिले के COM और NO में ही रहने चाहिए। टीचर से पूछिए: मेन्स के तार ख़ुद कभी मत हिलाइए।', '230 V dabbe ke wire relay ke COM aur NO mein hi rehne chahiye. Teacher se poochiye: mains ke wire khud kabhi mat hilaiye.'),
    mainsDanger: t3('DANGER: a 230 V wire is joined to the Arduino\'s side! Remove that wire at once. Mains and 5 V must never meet.', 'ख़तरा: 230 V का तार Arduino वाली तरफ़ से जुड़ गया है! वह तार तुरंत हटाइए। मेन्स और 5 V कभी नहीं मिलने चाहिए।', 'Khatra: 230 V ka wire Arduino wali taraf se jud gaya hai! Woh wire turant hataiye. Mains aur 5 V kabhi nahi milne chahiye.'),
    rfid5v: t3('The RC522 is joined to 5V: it is a 3.3 V chip and would be damaged. Move its 3.3V pin to the Arduino\'s 3.3V.', 'RC522 को 5V मिल रहा है: यह 3.3 V की चिप है और ख़राब हो जाएगी। इसका 3.3V पिन Arduino के 3.3V पर लगाइए।', 'RC522 ko 5V mil raha hai: yeh 3.3 V ki chip hai aur kharab ho jaayegi. Iska 3.3V pin Arduino ke 3.3V par lagaiye.'),
    pumpPath: t3('The pump\'s path: battery + → relay COM, relay NO → pump red, pump black → battery −.', 'पंप का रास्ता: बैटरी + → रिले COM, रिले NO → पंप लाल, पंप काला → बैटरी −।', 'Pump ka raasta: battery + → relay COM, relay NO → pump red, pump black → battery −.'),
    pumpArduino: t3('The pump is joined to the Arduino\'s 5V or GND: its 200 mA must come from its own battery, through the relay.', 'पंप Arduino के 5V या GND से जुड़ा है: इसके 200 mA इसकी अपनी बैटरी से, रिले से होकर आने चाहिए।', 'Pump Arduino ke 5V ya GND se juda hai: iske 200 mA iski apni battery se, relay se hokar aane chahiye.'),
    steps: t3('IN1–IN4 go to pins 8, 9, 10, 11 in order: IN1 to 8, IN2 to 9, IN3 to 10, IN4 to 11.', 'IN1–IN4 क्रम से पिन 8, 9, 10, 11 पर: IN1 को 8, IN2 को 9, IN3 को 10, IN4 को 11।', 'IN1–IN4 kram se pin 8, 9, 10, 11 par: IN1 ko 8, IN2 ko 9, IN3 ko 10, IN4 ko 11.'),
    kpOrder: t3('The keypad\'s 8 wires go in order: R1–R4 to pins 9, 8, 7, 6 and C1–C4 to pins 5, 4, 3, 2.', 'कीपैड के 8 तार क्रम से: R1–R4 पिन 9, 8, 7, 6 पर और C1–C4 पिन 5, 4, 3, 2 पर।', 'Keypad ke 8 wire kram se: R1–R4 pin 9, 8, 7, 6 par aur C1–C4 pin 5, 4, 3, 2 par.'),
  };
  const NN = {
    lcd: t3('LCD', 'एलसीडी', 'LCD'), dht: t3('DHT11', 'DHT11', 'DHT11'), soil: t3('soil sensor', 'मिट्टी सेंसर', 'soil sensor'), relay: t3('relay', 'रिले', 'relay'), pir: t3('PIR sensor', 'पीआईआर सेंसर', 'PIR sensor'),
    ir: t3('IR receiver', 'आईआर रिसीवर', 'IR receiver'), rfid: t3('RFID reader', 'आरएफ़आईडी रीडर', 'RFID reader'), kp: t3('keypad', 'कीपैड', 'keypad'), st: t3('stepper driver', 'स्टेपर ड्राइवर', 'stepper driver'), mq: t3('gas sensor', 'गैस सेंसर', 'gas sensor'),
    oled: t3('OLED', 'ओएलईडी', 'OLED'), js: t3('joystick', 'जॉयस्टिक', 'joystick'),
  };
  const CHECK = { k: 'check', do: t3('Check your circuit.', 'अपना सर्किट जाँचिए।', 'Apna circuit check karo.'), see: t3('', '', '') };
  const RUN = (see) => ({ k: 'run', do: t3('Press Run.', '"चलाइए" दबाइए।', 'Run dabaiye.'), see: see || t3('', '', '') });
  const POWER = [['5V', 'H:tp30'], ['GND3', 'H:tn18'], ['H:tp2', 'H:bp2'], ['H:tn3', 'H:bn3']]; // the back rails from the board, bridged to the front rails
  const rails = [noShort, (S) => (S.conn('rail:tp', '5V') ? null : [W.vRail]), (S) => (S.conn('rail:tn', 'GND') ? null : [W.gndRail]), (S) => (S.conn('rail:bp', '5V') && S.conn('rail:bn', 'GND') ? null : [X.frontRails])];
  const w3 = (tag, pin, to, en, hi, hg, see) => ({ k: 'wire', wire: [tag + '.' + pin, to], do: t3(en, hi, hg), see: see || t3('', '', '') });
  const pw = (tag, en, hi, hg) => [w3(tag, 'VCC', 'rail:bp', `Wire the ${en}'s VCC to the front + rail.`, `${hi} का VCC आगे वाली + रेल से जोड़िए।`, `${hg} ka VCC aage wali + rail se jodiye.`),
    w3(tag, 'GND', 'rail:bn', 'Its GND to the front − rail.', 'इसका GND आगे वाली − रेल से।', 'Iska GND aage wali − rail se.')];
  const powChecks = (tag, nm) => [need(tag + '.VCC', '5V', W.to5v, { x: nm }), need(tag + '.GND', 'GND', W.toGnd, { x: nm })];
  const i2cChecks = (tag, nm) => [has(tag, nm), ...powChecks(tag, nm), (S) => (S.conn(tag + '.SDA', 'A5') && S.conn(tag + '.SCL', 'A4') ? [X.i2cSwap] : null),
    need(tag + '.SDA', 'A4', X.i2c, { a: 'SDA', b: 'A4' }), need(tag + '.SCL', 'A5', X.i2c, { a: 'SCL', b: 'A5' })];
  const relayWires = (tag, pin, nm) => [w3(tag, 'S', 'D' + pin, `Wire the ${nm.en}'s S pin to pin ${pin}.`, `${nm.hi} का S पिन, पिन ${pin} से जोड़िए।`, `${nm.hg} ka S pin, pin ${pin} se jodiye.`),
    w3(tag, 'VCC', 'rail:bp', 'Its + pin to the front + rail.', 'इसका + पिन आगे वाली + रेल से।', 'Iska + pin aage wali + rail se.'), w3(tag, 'GND', 'rail:bn', 'Its − pin to the front − rail.', 'इसका − पिन आगे वाली − रेल से।', 'Iska − pin aage wali − rail se.')];
  const relayChecks = (tag, pin, nm) => [has(tag, nm), need(tag + '.S', 'D' + pin, W.toPin, { x: nm, p: pin }), ...powChecks(tag, nm)];
  const mainsChecks = (load, rl) => [(S) => (['A', 'B'].some((k) => S.conn(load + '.' + k, 'GND') || S.conn(load + '.' + k, '5V') || S.conn(load + '.' + k, '3V3')) ? [X.mainsDanger] : null),
    (S) => (S.conn(load + '.A', rl + '.COM') && S.conn(load + '.B', rl + '.NO') ? null : [X.mains])];
  const fresh = (S) => S.runSrc !== null && S.t - (S.freshAt || 0) > 0.3;
  const tagN = (S, tag) => S.part(tag);
  let n = n0;
  const L = [];

  // 1 -------------------------------------------------------------------------------------------------------- thermometer
  L.push({ id: 'lcdtemp', n: ++n, cls: '6–8', blocks: true, view: 'wide', rview: 'scene3', code: THERMO, drawer: ['dht11', 'lcd16'], serial: false, scene: { kind: 'air' },
    title: t3('Digital thermometer on an LCD', 'एलसीडी पर डिजिटल थर्मामीटर', 'LCD par digital thermometer'),
    goal: t3('Measure the room\'s temperature and humidity with a DHT11 and show them on a 16×2 LCD, then warm the sensor with a cup of hot chai.', 'DHT11 से कमरे का तापमान और नमी नापिए और 16×2 एलसीडी पर दिखाइए, फिर गर्म चाय के कप से सेंसर को गर्म कीजिए।', 'DHT11 se room ka temperature aur nami naapiye aur 16×2 LCD par dikhaiye, phir garam chai ke cup se sensor ko garam kijiye.'),
    setup: { parts: [], wires: POWER },
    steps: [
      { k: 'info', do: t3('Two new modules today. The blue DHT11 measures temperature and humidity. The LCD shows two lines of 16 letters; the small board on its back (I2C) needs only four wires.', 'आज दो नए मॉड्यूल। नीला DHT11 तापमान और नमी नापता है। एलसीडी 16-16 अक्षरों की दो लाइनें दिखाती है; इसके पीछे का छोटा बोर्ड (I2C) सिर्फ़ चार तार लेता है।', 'Aaj do naye module. Neela DHT11 temperature aur nami naapta hai. LCD 16-16 letters ki do lines dikhati hai; iske peeche ka chhota board (I2C) sirf chaar wire leta hai.'),
        see: t3('The rails are ready: back and front + rails are 5 V, the − rails are GND.', 'रेल तैयार हैं: पीछे और आगे की + रेल 5 V हैं, − रेल GND।', 'Rails taiyaar hain: peeche aur aage ki + rail 5 V hain, − rail GND.') },
      { k: 'place', place: P('dht', 'dht11', {}, 'j40', 0), do: t3('Plug the DHT11 into 40j–42j, its blue grille facing you.', 'DHT11 को 40j–42j में लगाइए, नीली जाली आपकी तरफ़।', 'DHT11 ko 40j–42j mein lagaiye, neeli jaali aapki taraf.'), see: t3('', '', '') },
      w3('dht', 'VCC', 'rail:bp', 'Wire its middle pin, + (column 41), to the front + rail.', 'इसका बीच वाला पिन, + (कॉलम 41), आगे वाली + रेल से जोड़िए।', 'Iska beech wala pin, + (column 41), aage wali + rail se jodiye.'),
      w3('dht', 'GND', 'rail:bn', 'Its right pin, − (column 42), to the front − rail.', 'इसका दायाँ पिन, − (कॉलम 42), आगे वाली − रेल से।', 'Iska right pin, − (column 42), aage wali − rail se.'),
      w3('dht', 'DATA', 'D2', 'Its left pin, DATA (column 40), to pin 2.', 'इसका बायाँ पिन, DATA (कॉलम 40), पिन 2 से।', 'Iska left pin, DATA (column 40), pin 2 se.', t3('One wire carries both numbers, one bit after another.', 'एक ही तार दोनों संख्याएँ एक-एक बिट करके लाता है।', 'Ek hi wire dono numbers ek-ek bit karke laata hai.')),
      { k: 'place', place: F('lcd', 'lcd16', {}, -128, 66, 0), do: t3('Put the LCD on the mat at the ghost, in front of the board.', 'एलसीडी को मैट पर नीली आकृति पर, बोर्ड के सामने रखिए।', 'LCD ko mat par neeli shape par, board ke saamne rakhiye.'), see: t3('', '', '') },
      w3('lcd', 'GND', 'rail:bn', 'Wire the LCD\'s GND (the first pin of its backpack) to the front − rail.', 'एलसीडी का GND (बैकपैक का पहला पिन) आगे वाली − रेल से जोड़िए।', 'LCD ka GND (backpack ka pehla pin) aage wali − rail se jodiye.'),
      w3('lcd', 'VCC', 'rail:bp', 'Its VCC to the front + rail.', 'इसका VCC आगे वाली + रेल से।', 'Iska VCC aage wali + rail se.'),
      w3('lcd', 'SDA', 'A4', 'Its SDA to A4.', 'इसका SDA, A4 से।', 'Iska SDA, A4 se.'),
      w3('lcd', 'SCL', 'A5', 'Its SCL to A5.', 'इसका SCL, A5 से।', 'Iska SCL, A5 se.', t3('I2C: two wires, SDA carries the letters and SCL ticks the time. Many modules can share them, each at its own address (this one: 0x27).', 'I2C: दो तार, SDA अक्षर लाता है और SCL समय की टिक-टिक देता है। कई मॉड्यूल इन्हें बाँट सकते हैं, हर एक अपने पते पर (यह: 0x27)।', 'I2C: do wire, SDA letters laata hai aur SCL time ki tick-tick deta hai. Kai module inhe share kar sakte hain, har ek apne address par (yeh: 0x27).')),
      CHECK,
      RUN(t3('First "DUET Thermometer", then the readings every 2 seconds.', 'पहले "DUET Thermometer", फिर हर 2 सेकंड में रीडिंग।', 'Pehle "DUET Thermometer", phir har 2 second mein reading.')),
      { k: 'watch', until: (S) => S.w('shown'), do: t3('Read the LCD.', 'एलसीडी पढ़िए।', 'LCD padhiye.'), see: t3('The room is about 26 °C and 55 % humid. The DHT11 counts in whole degrees, so 26.0 means 26 ± 2 °C.', 'कमरा लगभग 26 °C का है और नमी 55 %। DHT11 पूरे डिग्री में गिनता है, इसलिए 26.0 का मतलब है 26 ± 2 °C।', 'Room lagbhag 26 °C ka hai aur nami 55 %. DHT11 poore degree mein ginta hai, isliye 26.0 ka matlab hai 26 ± 2 °C.') },
      { k: 'act', until: (S) => S.w('hot'), do: t3('In the room panel, put the cup of hot chai next to the sensor.', 'कमरे के पैनल में गर्म चाय का कप सेंसर के पास रखिए।', 'Room ke panel mein garam chai ka cup sensor ke paas rakhiye.'),
        see: t3('The number climbs for a few seconds: the sensor itself must warm up. The steam also raises the humidity.', 'संख्या कुछ सेकंड तक बढ़ती रहती है: सेंसर को ख़ुद गर्म होना पड़ता है। भाप से नमी भी बढ़ती है।', 'Number kuch second tak badhta rehta hai: sensor ko khud garam hona padta hai. Bhaap se nami bhi badhti hai.') },
      { k: 'edit', test: (src) => { const m = /lcd\.print\("([^"]*)"\);\s*\n\s*delay\(1500\)/.exec(src); return !!m && m[1] !== 'DUET Thermometer' && m[1].length > 0 && m[1].length <= 16; }, set: [[/DUET Thermometer/, 'Hello Class 7!']],
        do: t3('Put your own name on the screen: change "DUET Thermometer" (16 letters at most) and press Run.', 'स्क्रीन पर अपना नाम लिखिए: "DUET Thermometer" बदलिए (ज़्यादा से ज़्यादा 16 अक्षर) और "चलाइए" दबाइए।', 'Screen par apna naam likhiye: "DUET Thermometer" badaliye (zyada se zyada 16 letters) aur Run dabaiye.'), see: t3('', '', '') },
      { k: 'watch', until: (S) => S.w('named') && S.w('shown'), do: t3('Watch the screen as the board starts.', 'बोर्ड चालू होते समय स्क्रीन देखिए।', 'Board on hote waqt screen dekhiye.'),
        see: live((lg, R) => (R.t0 === undefined ? '' : pick(lg, `Your results: the LCD showed ${R.t0} °C and ${R.h0} % in the room; with the chai it went up to ${R.tMax} °C${R.hMax ? ' and ' + R.hMax + ' %' : ''}.${R.name ? ' And it said "' + R.name + '".' : ''}`, `आपके नतीजे: एलसीडी ने कमरे में ${R.t0} °C और ${R.h0} % दिखाया; चाय के पास यह ${R.tMax} °C${R.hMax ? ' और ' + R.hMax + ' %' : ''} तक गया।${R.name ? ' और इसने लिखा "' + R.name + '"।' : ''}`, `Aapke results: LCD ne room mein ${R.t0} °C aur ${R.h0} % dikhaya; chai ke paas yeh ${R.tMax} °C${R.hMax ? ' aur ' + R.hMax + ' %' : ''} tak gaya.${R.name ? ' Aur isne likha "' + R.name + '".' : ''}`))) },
    ],
    check: [...rails, has('dht', NN.dht), ...powChecks('dht', NN.dht), need('dht.DATA', 'D2', W.toPin, { x: 'DHT11 DATA', p: 2 }), ...i2cChecks('lcd', NN.lcd)],
    done: (S) => S.w('shown') && S.w('hot') && S.w('named') });

  // 2 -------------------------------------------------------------------------------------------------------- smart irrigation
  L.push({ id: 'irrigate', n: ++n, cls: '6–8', blocks: true, view: 'wide', rview: 'scene3', code: GARDEN, drawer: ['soil', 'relay'], serial: true, scene: { kind: 'garden' },
    title: t3('Smart irrigation', 'स्मार्ट सिंचाई', 'Smart irrigation'),
    goal: t3('A soil sensor tells the Arduino when the tulsi plant\'s soil is dry; a relay then runs a water pump from its own battery until the soil is wet again.', 'मिट्टी सेंसर Arduino को बताता है कि तुलसी के पौधे की मिट्टी कब सूखी है; तब रिले पानी के पंप को उसकी अपनी बैटरी से चलाता है, जब तक मिट्टी फिर गीली न हो जाए।', 'Mitti sensor Arduino ko batata hai ki tulsi ke paudhe ki mitti kab sookhi hai; tab relay paani ke pump ko uski apni battery se chalata hai, jab tak mitti phir geeli na ho jaaye.'),
    setup: { parts: [F('bat', 'aa4', {}, -40, 150, 0), F('pump', 'pump', { mount: 'tank' }, 182, 140, 1)], wires: [...POWER, ['T:pump:N', 'T:bat:N']] },
    steps: [
      { k: 'info', do: t3('The plant is next to the bench, in dry soil. The pump is in the water tank; its black wire already goes to the battery box\'s −.', 'पौधा बेंच के पास सूखी मिट्टी में है। पंप पानी की टंकी में है; इसका काला तार पहले से बैटरी बॉक्स के − से जुड़ा है।', 'Paudha bench ke paas sookhi mitti mein hai. Pump paani ki tanki mein hai; iska kaala wire pehle se battery box ke − se juda hai.'),
        see: t3('The pump takes about 200 mA: too much for a pin (40 mA at most). A relay will switch its battery.', 'पंप लगभग 200 mA लेता है: पिन के लिए बहुत ज़्यादा (ज़्यादा से ज़्यादा 40 mA)। रिले इसकी बैटरी को चालू-बंद करेगा।', 'Pump lagbhag 200 mA leta hai: pin ke liye bahut zyada (zyada se zyada 40 mA). Relay iski battery ko on-off karega.') },
      { k: 'place', place: F('soil', 'soil', {}, 150, 92, 0), do: t3('Put the soil sensor\'s module on the mat at the ghost (its fork is already in the pot).', 'मिट्टी सेंसर का मॉड्यूल मैट पर नीली आकृति पर रखिए (इसका काँटा पहले से गमले में है)।', 'Mitti sensor ka module mat par neeli shape par rakhiye (iska kaanta pehle se gamle mein hai).'), see: t3('', '', '') },
      ...pw('soil', 'soil sensor', 'मिट्टी सेंसर', 'Soil sensor'),
      w3('soil', 'AO', 'A0', 'Its AO (analog out) to A0.', 'इसका AO (एनालॉग आउट) A0 से।', 'Iska AO (analog out) A0 se.'),
      { k: 'place', place: F('rl', 'relay', {}, 60, 118, 0), do: t3('Put the relay module on the mat at the ghost.', 'रिले मॉड्यूल को मैट पर नीली आकृति पर रखिए।', 'Relay module ko mat par neeli shape par rakhiye.'), see: t3('', '', '') },
      ...relayWires('rl', 7, NN.relay),
      w3('bat', 'P', 'rl.COM', 'Now the pump\'s side: the battery\'s red wire (+) to the relay\'s COM.', 'अब पंप वाली तरफ़: बैटरी का लाल तार (+) रिले के COM से।', 'Ab pump wali taraf: battery ka red wire (+) relay ke COM se.'),
      w3('rl', 'NO', 'pump.P', 'The relay\'s NO to the pump\'s red wire.', 'रिले का NO पंप के लाल तार से।', 'Relay ka NO pump ke red wire se.', t3('A loop: battery + → COM → (relay on) → NO → pump → battery −. The relay is the switch in it.', 'एक लूप: बैटरी + → COM → (रिले चालू) → NO → पंप → बैटरी −। रिले इसमें स्विच है।', 'Ek loop: battery + → COM → (relay on) → NO → pump → battery −. Relay ismein switch hai.')),
      CHECK,
      RUN(t3('The Serial Monitor shows the soil: a big number means dry.', 'सीरियल मॉनिटर मिट्टी दिखाता है: बड़ी संख्या मतलब सूखी।', 'Serial Monitor mitti dikhata hai: bada number matlab sookhi.')),
      { k: 'watch', until: (S) => S.w('watered') && S.w('stopped'), do: t3('Watch the pot, the relay\'s red LED and the numbers.', 'गमला, रिले की लाल एलईडी और संख्याएँ देखिए।', 'Gamla, relay ki laal LED aur numbers dekhiye.'),
        see: t3('Dry: click, the pump waters the plant until the number falls below 600, then click, off.', 'सूखी: क्लिक, पंप पौधे को तब तक पानी देता है जब तक संख्या 600 से नीचे न आ जाए, फिर क्लिक, बंद।', 'Sookhi: click, pump paudhe ko tab tak paani deta hai jab tak number 600 se neeche na aa jaaye, phir click, band.') },
      { k: 'act', until: (S) => S.w('cycle2'), do: t3('Make a hot afternoon: press "dry the soil" in the garden panel.', 'तेज़ दोपहर बनाइए: बगीचे के पैनल में "मिट्टी सुखाइए" दबाइए।', 'Tez dopahar banaiye: bagiche ke panel mein "mitti sukhaiye" dabaiye.'), see: t3('It waters again by itself. Nobody had to remember!', 'यह अपने-आप फिर पानी देता है। किसी को याद नहीं रखना पड़ा!', 'Yeh apne aap phir paani deta hai. Kisi ko yaad nahi rakhna pada!') },
      { k: 'edit', test: (src) => /int\s+dry\s*=\s*(4\d\d)\s*;/.test(src), set: [[/int dry = 600;/, 'int dry = 450;']], do: t3('Tulsi likes damp soil. Change dry = 600 to dry = 450 and press Run.', 'तुलसी को नम मिट्टी पसंद है। dry = 600 को dry = 450 कीजिए और "चलाइए" दबाइए।', 'Tulsi ko nam mitti pasand hai. dry = 600 ko dry = 450 karo aur Run dabaiye.'), see: t3('', '', '') },
      { k: 'act', until: (S) => fresh(S) && S.wv('stopRun') === S.wv('runs') && (S.wv('m') || 0) > 0.64, do: t3('Dry the soil once more and watch.', 'मिट्टी को एक बार और सुखाइए और देखिए।', 'Mitti ko ek baar aur sukhaiye aur dekhiye.'),
        see: live((lg, R) => (R.dry === undefined ? '' : pick(lg, `Your results: the pump came on at ${R.dry} (dry), poured ${R.ml} mL and stopped at ${R.wet} (wet) — ${R.cycles} waterings, no one watching.`, `आपके नतीजे: पंप ${R.dry} (सूखी) पर चालू हुआ, ${R.ml} mL पानी डाला और ${R.wet} (गीली) पर रुका — ${R.cycles} बार पानी, बिना किसी के देखे।`, `Aapke results: pump ${R.dry} (sookhi) par on hua, ${R.ml} mL paani daala aur ${R.wet} (geeli) par ruka — ${R.cycles} baar paani, bina kisi ke dekhe.`))) },
    ],
    check: [...rails, has('soil', NN.soil), ...powChecks('soil', NN.soil), need('soil.AO', 'A0', W.join, { a: t3('The soil sensor\'s AO', 'मिट्टी सेंसर का AO', 'Soil sensor ka AO'), b: 'A0' }), ...relayChecks('rl', 7, NN.relay),
      (S) => (['pump.P', 'pump.N'].some((e) => S.conn(e, '5V') || S.conn(e, 'GND')) ? [X.pumpArduino] : null), (S) => (S.conn('bat.P', 'rl.COM') && S.conn('rl.NO', 'pump.P') && S.conn('pump.N', 'bat.N') ? null : [X.pumpPath])],
    done: (S) => S.w('cycle2') && (S.wv('m') || 0) > 0.6 });

  // 3 -------------------------------------------------------------------------------------------------------- home automation
  L.push({ id: 'homeauto', n: ++n, cls: '9–12', blocks: false, view: 'wide', rview: 'scene3', code: ROOM, drawer: ['irrx'], serial: true, scene: { kind: 'room' },
    title: t3('Home automation with a remote', 'रिमोट से होम ऑटोमेशन', 'Remote se home automation'),
    goal: t3('A TV remote switches a 230 V lamp and a ceiling fan through two relays. You wire only the safe 5 V side.', 'एक टीवी रिमोट दो रिले से 230 V का बल्ब और छत का पंखा चालू-बंद करता है। आप सिर्फ़ सुरक्षित 5 V वाली तरफ़ जोड़ते हैं।', 'Ek TV remote do relay se 230 V ka bulb aur chhat ka pankha on-off karta hai. Aap sirf safe 5 V wali taraf jodte hain.'),
    setup: { parts: [F('rl1', 'relay', {}, 30, 132, 0), F('rl2', 'relay', {}, 110, 132, 0), F('lamp', 'load230', { kind: 'lamp' }, 22, 66, 0), F('fan', 'load230', { kind: 'fan' }, 102, 66, 0)],
      wires: [...POWER, ['T:lamp:A', 'T:rl1:COM'], ['T:lamp:B', 'T:rl1:NO'], ['T:fan:A', 'T:rl2:COM'], ['T:fan:B', 'T:rl2:NO']] },
    steps: [
      { k: 'info', do: t3('Safety first. The grey boxes hold 230 V mains: an electrician has wired them to the relays\' COM and NO, and closed them. Mains can kill: never open or touch those wires.', 'पहले सुरक्षा। स्लेटी डिब्बों में 230 V मेन्स है: इलेक्ट्रीशियन ने इन्हें रिले के COM और NO से जोड़कर बंद कर दिया है। मेन्स जान ले सकता है: वे तार कभी मत खोलिए, मत छूइए।', 'Pehle safety. Grey dabbon mein 230 V mains hai: electrician ne inhe relay ke COM aur NO se jodkar band kar diya hai. Mains jaan le sakta hai: woh wire kabhi mat kholiye, mat chhooiye.'),
        see: t3('The relay keeps the two worlds apart: a coil on the 5 V side moves a contact on the 230 V side.', 'रिले दोनों दुनिया को अलग रखता है: 5 V वाली तरफ़ की कॉइल 230 V वाली तरफ़ का कॉन्टैक्ट हिलाती है।', 'Relay dono duniya ko alag rakhta hai: 5 V wali taraf ki coil 230 V wali taraf ka contact hilati hai.') },
      { k: 'place', place: P('ir', 'irrx', {}, 'j48', 0), do: t3('Plug the IR receiver into 48j–50j, its dome facing you.', 'आईआर रिसीवर को 48j–50j में लगाइए, इसका गुंबद आपकी तरफ़।', 'IR receiver ko 48j–50j mein lagaiye, iska dome aapki taraf.'), see: t3('', '', '') },
      w3('ir', 'VCC', 'rail:bp', 'Its right leg, VCC (column 50), to the front + rail.', 'इसका दायाँ पैर, VCC (कॉलम 50), आगे वाली + रेल से।', 'Iska right pair, VCC (column 50), aage wali + rail se.'),
      w3('ir', 'GND', 'rail:bn', 'Its middle leg, GND (column 49), to the front − rail.', 'इसका बीच वाला पैर, GND (कॉलम 49), आगे वाली − रेल से।', 'Iska beech wala pair, GND (column 49), aage wali − rail se.'),
      w3('ir', 'OUT', 'D11', 'Its left leg, OUT (column 48), to pin 11.', 'इसका बायाँ पैर, OUT (कॉलम 48), पिन 11 से।', 'Iska left pair, OUT (column 48), pin 11 se.'),
      ...relayWires('rl1', 7, t3('lamp relay', 'बल्ब वाले रिले', 'bulb wale relay')),
      ...relayWires('rl2', 8, t3('fan relay', 'पंखे वाले रिले', 'pankhe wale relay')),
      CHECK,
      RUN(t3('Press remote buttons: the Serial Monitor shows each button\'s code.', 'रिमोट के बटन दबाइए: सीरियल मॉनिटर हर बटन का कोड दिखाता है।', 'Remote ke button dabaiye: Serial Monitor har button ka code dikhata hai.')),
      { k: 'act', until: (S) => S.w('lampOn'), do: t3('Press 1 on the remote (in the room panel).', 'रिमोट पर 1 दबाइए (कमरे के पैनल में)।', 'Remote par 1 dabaiye (room ke panel mein).'), see: t3('Code 69, click: the lamp lights.', 'कोड 69, क्लिक: बल्ब जलता है।', 'Code 69, click: bulb jalta hai.') },
      { k: 'act', until: (S) => S.w('fanOn'), do: t3('Press 2.', '2 दबाइए।', '2 dabaiye.'), see: t3('Code 70: the fan starts and speeds up slowly.', 'कोड 70: पंखा चलता है और धीरे-धीरे तेज़ होता है।', 'Code 70: pankha chalta hai aur dheere-dheere tez hota hai.') },
      { k: 'act', until: (S) => S.w('lampOff'), do: t3('Press 1 again.', '1 फिर से दबाइए।', '1 phir se dabaiye.'), see: t3('lamp = !lamp flips it: the same button turns it off.', 'lamp = !lamp इसे उलट देता है: वही बटन इसे बंद करता है।', 'lamp = !lamp ise ulat deta hai: wahi button ise band karta hai.') },
      { k: 'edit', test: (src) => /code\s*==\s*71\s*\)/.test(src) && !/code\s*==\s*70\s*\)/.test(src), set: [[/code == 70\)/, 'code == 71)']], do: t3('Use button 3 for the fan: its code is 71. Change 70 to 71 and press Run.', 'पंखे के लिए बटन 3 लीजिए: इसका कोड 71 है। 70 को 71 कीजिए और "चलाइए" दबाइए।', 'Pankhe ke liye button 3 lijiye: iska code 71 hai. 70 ko 71 karo aur Run dabaiye.'), see: t3('', '', '') },
      { k: 'act', until: (S) => fresh(S) && S.part('fan') && S.part('fan').state.on && (S.wv('lastKey') === '3'), do: t3('Press 3.', '3 दबाइए।', '3 dabaiye.'),
        see: live((lg, R) => (!R.keys ? '' : pick(lg, `Your results: you pressed ${R.keys.join(', ')}; the lamp ${R.lampOn ? 'and the fan answered' : 'answered'}. A real smart home works just like this, with Wi-Fi in place of the remote.`, `आपके नतीजे: आपने ${R.keys.join(', ')} दबाए; बल्ब ${R.fanOn ? 'और पंखे ने' : 'ने'} जवाब दिया। असली स्मार्ट घर भी ऐसे ही चलता है, रिमोट की जगह वाई-फ़ाई से।`, `Aapke results: aapne ${R.keys.join(', ')} dabaye; bulb ${R.fanOn ? 'aur pankhe ne' : 'ne'} jawab diya. Asli smart ghar bhi aise hi chalta hai, remote ki jagah Wi-Fi se.`))) },
    ],
    check: [...rails, ...mainsChecks('lamp', 'rl1'), ...mainsChecks('fan', 'rl2'), has('ir', NN.ir), ...powChecks('ir', NN.ir), need('ir.OUT', 'D11', W.toPin, { x: 'IR OUT', p: 11 }), ...relayChecks('rl1', 7, NN.relay), ...relayChecks('rl2', 8, NN.relay)],
    done: (S) => S.w('lampOn') && S.w('fanOn') && S.w('lampOff') });

  // 4 -------------------------------------------------------------------------------------------------------- burglar alarm
  L.push({ id: 'burglar', n: ++n, cls: '6–8', blocks: true, view: 'wide', rview: 'scene3', code: BURGLAR, drawer: ['pir'], serial: false, scene: { kind: 'burglar' },
    title: t3('Burglar alarm', 'चोर अलार्म', 'Chor alarm'),
    goal: t3('A PIR motion sensor watches the room. When someone walks in, the buzzer sounds and the red LED flashes.', 'पीआईआर मोशन सेंसर कमरे पर नज़र रखता है। कोई अंदर आए तो बज़र बजता है और लाल एलईडी चमकती है।', 'PIR motion sensor room par nazar rakhta hai. Koi andar aaye to buzzer bajta hai aur laal LED chamakti hai.'),
    setup: { parts: [P('led1', 'led', { color: 'red' }, 'e22', 0), P('r1', 'resistor', { ohms: 220 }, 'b22', 3), P('bz1', 'buzzer', {}, 'e30', 0)], wires: [...POWER, ['D13', 'H:a23'], ['D8', 'H:a30'], ['H:a33', 'H:tn27']] },
    steps: [
      { k: 'info', do: t3('The red LED (pin 13) and the buzzer (pin 8) are ready. Today\'s sensor sees the heat of a moving body: the PIR (passive infrared).', 'लाल एलईडी (पिन 13) और बज़र (पिन 8) तैयार हैं। आज का सेंसर हिलते शरीर की गर्मी देखता है: पीआईआर (पैसिव इन्फ़्रारेड)।', 'Laal LED (pin 13) aur buzzer (pin 8) taiyaar hain. Aaj ka sensor hilte shareer ki garmi dekhta hai: PIR (passive infrared).'), see: t3('', '', '') },
      { k: 'place', place: F('pir', 'pir', {}, 176, 78, 1), do: t3('Put the PIR sensor on the mat at the ghost, its white dome looking into the room.', 'पीआईआर सेंसर को मैट पर नीली आकृति पर रखिए, इसका सफ़ेद गुंबद कमरे की तरफ़।', 'PIR sensor ko mat par neeli shape par rakhiye, iska safed dome room ki taraf.'), see: t3('', '', '') },
      ...pw('pir', 'PIR sensor', 'पीआईआर सेंसर', 'PIR sensor'),
      w3('pir', 'OUT', 'D2', 'Its OUT (the middle pin) to pin 2.', 'इसका OUT (बीच वाला पिन) पिन 2 से।', 'Iska OUT (beech wala pin) pin 2 se.'),
      CHECK,
      RUN(t3('At power-on the PIR studies the room for a moment, and its output is HIGH: a short alarm. A real one takes about a minute.', 'चालू होते ही पीआईआर एक पल कमरे को समझता है, और इसका आउटपुट HIGH रहता है: एक छोटा अलार्म। असली सेंसर लगभग एक मिनट लेता है।', 'On hote hi PIR ek pal room ko samajhta hai, aur iska output HIGH rehta hai: ek chhota alarm. Asli sensor lagbhag ek minute leta hai.')),
      { k: 'act', until: (S) => S.w('alarm'), do: t3('In the room panel, let the thief walk in.', 'कमरे के पैनल में चोर को अंदर आने दीजिए।', 'Room ke panel mein chor ko andar aane dijiye.'), see: t3('Caught! The alarm sounds while he moves.', 'पकड़ा गया! वह जब तक हिलता है, अलार्म बजता है।', 'Pakda gaya! Woh jab tak hilta hai, alarm bajta hai.') },
      { k: 'watch', until: (S) => S.w('quiet'), do: t3('Wait after he has gone.', 'उसके जाने के बाद रुकिए।', 'Uske jaane ke baad rukiye.'), see: t3('Quiet again a few seconds later: the PIR keeps OUT HIGH for its "time" (the Tx knob, 3 s here).', 'कुछ सेकंड बाद फिर शांति: पीआईआर अपने "समय" (Tx नॉब, यहाँ 3 s) तक OUT को HIGH रखता है।', 'Kuch second baad phir shaanti: PIR apne "time" (Tx knob, yahan 3 s) tak OUT ko HIGH rakhta hai.') },
      { k: 'edit', test: (src) => /tone\(buzzer,\s*3000\s*,/.test(src), set: [[/tone\(buzzer, 2000,/, 'tone(buzzer, 3000,']], do: t3('Make the siren sharper: change tone(buzzer, 2000, 150) to 3000 and press Run.', 'सायरन तीखा कीजिए: tone(buzzer, 2000, 150) को 3000 कीजिए और "चलाइए" दबाइए।', 'Siren teekha kijiye: tone(buzzer, 2000, 150) ko 3000 karo aur Run dabaiye.'), see: t3('', '', '') },
      { k: 'act', until: (S) => fresh(S) && S.w('alarm') && S.lab.obs.tones.has(3000), do: t3('Now let the cat walk past.', 'अब बिल्ली को पास से गुज़रने दीजिए।', 'Ab billi ko paas se guzarne dijiye.'),
        see: live((lg, R) => (R.delay === undefined ? '' : pick(lg, `Your results: the alarm started ${R.delay} s after the walk began${R.alarmSecs ? ' and sounded for ' + R.alarmSecs + ' s' : ''}. The cat set it off too: a PIR sees any warm body. Real alarms point it away from pets.`, `आपके नतीजे: चलना शुरू होने के ${R.delay} s बाद अलार्म बजा${R.alarmSecs ? ' और ' + R.alarmSecs + ' s तक बजा' : ''}। बिल्ली से भी बजा: पीआईआर हर गर्म शरीर देखता है। असली अलार्म इसे पालतू जानवरों से दूर रखते हैं।`, `Aapke results: chalna shuru hone ke ${R.delay} s baad alarm baja${R.alarmSecs ? ' aur ' + R.alarmSecs + ' s tak baja' : ''}. Billi se bhi baja: PIR har garam shareer dekhta hai. Asli alarm ise paltu jaanwaron se door rakhte hain.`))) },
    ],
    check: [...rails, has('pir', NN.pir), ...powChecks('pir', NN.pir), need('pir.OUT', 'D2', W.toPin, { x: 'PIR OUT', p: 2 })],
    done: (S) => S.w('alarm') && S.lab.obs.tones.has(3000) });

  // 5 -------------------------------------------------------------------------------------------------------- RFID door lock
  L.push({ id: 'rfidlock', n: ++n, cls: '9–12', blocks: false, view: 'wide', rview: 'scene3', code: DOOR, drawer: ['rfid'], serial: true, scene: { kind: 'door', ok: 'card' },
    title: t3('RFID door lock', 'आरएफ़आईडी दरवाज़ा लॉक', 'RFID darwaza lock'),
    goal: t3('Read the number (UID) of an RFID card and open the door\'s latch with a servo only for your card.', 'आरएफ़आईडी कार्ड का नंबर (UID) पढ़िए और सर्वो से दरवाज़े की कुंडी सिर्फ़ अपने कार्ड से खोलिए।', 'RFID card ka number (UID) padhiye aur servo se darwaze ki kundi sirf apne card se kholiye.'),
    setup: { parts: [F('sv1', 'servo', { mount: 'door' }, 178, 70, 1)], wires: [...POWER, ['T:sv1:GND', 'H:bn40'], ['T:sv1:VP', 'H:bp40'], ['T:sv1:SIG', 'D3']] },
    steps: [
      { k: 'info', do: t3('The door\'s latch is pulled by a servo (already wired to pin 3). Now its reader: the RC522 talks over SPI, a fast four-wire bus, and it needs 3.3 V.', 'दरवाज़े की कुंडी एक सर्वो खींचता है (पहले से पिन 3 पर)। अब इसका रीडर: RC522, SPI से बात करता है, जो चार तारों वाली तेज़ बस है, और इसे 3.3 V चाहिए।', 'Darwaze ki kundi ek servo kheenchta hai (pehle se pin 3 par). Ab iska reader: RC522, SPI se baat karta hai, jo chaar wires wali tez bus hai, aur ise 3.3 V chahiye.'), see: t3('', '', '') },
      { k: 'place', place: F('rf', 'rfid', {}, 40, 152, 0), do: t3('Put the RFID reader on the mat at the ghost.', 'आरएफ़आईडी रीडर को मैट पर नीली आकृति पर रखिए।', 'RFID reader ko mat par neeli shape par rakhiye.'), see: t3('', '', '') },
      w3('rf', 'SDA', 'D10', 'Wire SDA (its first pin) to pin 10.', 'SDA (पहला पिन) को पिन 10 से जोड़िए।', 'SDA (pehla pin) ko pin 10 se jodiye.'),
      w3('rf', 'SCK', 'D13', 'SCK to pin 13.', 'SCK को पिन 13 से।', 'SCK ko pin 13 se.'),
      w3('rf', 'MOSI', 'D11', 'MOSI to pin 11.', 'MOSI को पिन 11 से।', 'MOSI ko pin 11 se.'),
      w3('rf', 'MISO', 'D12', 'MISO to pin 12.', 'MISO को पिन 12 से।', 'MISO ko pin 12 se.', t3('SPI: SCK ticks, MOSI carries the Arduino\'s words to the reader, MISO the reader\'s answer back. Pins 11, 12, 13 are the Uno\'s SPI pins.', 'SPI: SCK टिक-टिक करता है, MOSI Arduino की बात रीडर तक ले जाता है, MISO रीडर का जवाब वापस। पिन 11, 12, 13 Uno के SPI पिन हैं।', 'SPI: SCK tick-tick karta hai, MOSI Arduino ki baat reader tak le jaata hai, MISO reader ka jawab wapas. Pin 11, 12, 13 Uno ke SPI pin hain.')),
      w3('rf', 'RST', 'D9', 'RST to pin 9 (skip IRQ).', 'RST को पिन 9 से (IRQ छोड़िए)।', 'RST ko pin 9 se (IRQ chhodiye).'),
      w3('rf', 'GND', 'rail:bn', 'GND to the front − rail.', 'GND को आगे वाली − रेल से।', 'GND ko aage wali − rail se.'),
      w3('rf', 'V33', '3V3', 'And 3.3V to the Arduino\'s 3.3V pin, not 5V!', 'और 3.3V को Arduino के 3.3V पिन से, 5V से नहीं!', 'Aur 3.3V ko Arduino ke 3.3V pin se, 5V se nahi!'),
      CHECK,
      RUN(t3('"Show a card..." on the Serial Monitor.', 'सीरियल मॉनिटर पर "Show a card..."।', 'Serial Monitor par "Show a card...".')),
      { k: 'act', until: (S) => S.w('cardSeen') && S.w('denied'), do: t3('In the door panel, hold the white card on the reader. Read its number on the Serial Monitor.', 'दरवाज़े के पैनल में सफ़ेद कार्ड रीडर पर रखिए। सीरियल मॉनिटर पर इसका नंबर पढ़िए।', 'Darwaze ke panel mein safed card reader par rakhiye. Serial Monitor par iska number padhiye.'),
        see: t3('"Card: A3 4F 1C 2D", then "Access denied": the sketch does not know your card yet.', '"Card: A3 4F 1C 2D", फिर "Access denied": स्केच अभी आपका कार्ड नहीं जानता।', '"Card: A3 4F 1C 2D", phir "Access denied": sketch abhi aapka card nahi jaanta.') },
      { k: 'edit', test: (src) => /String\s+allowed\s*=\s*"A3 4F 1C 2D"\s*;/i.test(src), set: [[/"00 00 00 00"/, '"A3 4F 1C 2D"']], do: t3('Teach it your card: change "00 00 00 00" to the number you read, "A3 4F 1C 2D", and press Run.', 'इसे अपना कार्ड सिखाइए: "00 00 00 00" को पढ़े गए नंबर "A3 4F 1C 2D" से बदलिए और "चलाइए" दबाइए।', 'Ise apna card sikhaiye: "00 00 00 00" ko padhe gaye number "A3 4F 1C 2D" se badaliye aur Run dabaiye.'), see: t3('', '', '') },
      { k: 'act', until: (S) => fresh(S) && S.w('opened'), do: t3('Hold the white card on the reader again.', 'सफ़ेद कार्ड फिर से रीडर पर रखिए।', 'Safed card phir se reader par rakhiye.'), see: t3('Welcome! The servo pulls the latch, the door swings open, and 3 s later it locks again.', 'स्वागत है! सर्वो कुंडी खींचता है, दरवाज़ा खुलता है, और 3 s बाद फिर बंद हो जाता है।', 'Swagat hai! Servo kundi kheenchta hai, darwaza khulta hai, aur 3 s baad phir band ho jaata hai.') },
      { k: 'act', until: (S) => fresh(S) && S.w('opened') && S.w('denied'), do: t3('Now try the blue tag.', 'अब नीला टैग आज़माइए।', 'Ab neela tag aazmaiye.'),
        see: live((lg, R) => (!R.shown ? '' : pick(lg, `Your results: your card A3 4F 1C 2D opened the door; the tag 5B 2E 91 C4 was refused. Every card has its own number, which is why school and office ID cards can open only their own doors.`, `आपके नतीजे: आपके कार्ड A3 4F 1C 2D से दरवाज़ा खुला; टैग 5B 2E 91 C4 को मना कर दिया गया। हर कार्ड का अपना नंबर होता है, इसीलिए स्कूल और दफ़्तर के आईडी कार्ड सिर्फ़ अपने दरवाज़े खोलते हैं।`, `Aapke results: aapke card A3 4F 1C 2D se darwaza khula; tag 5B 2E 91 C4 ko mana kar diya gaya. Har card ka apna number hota hai, isiliye school aur office ke ID card sirf apne darwaze kholte hain.`))) },
    ],
    check: [...rails, has('rf', NN.rfid), (S) => (S.conn('rf.V33', '5V') ? [X.rfid5v] : null), need('rf.V33', '3V3', W.join, { a: '3.3V', b: t3('the Arduino\'s 3.3V pin', 'Arduino का 3.3V पिन', 'Arduino ka 3.3V pin') }), need('rf.GND', 'GND', W.toGnd, { x: NN.rfid }),
      need('rf.SDA', 'D10', W.toPin, { x: 'SDA', p: 10 }), need('rf.SCK', 'D13', W.toPin, { x: 'SCK', p: 13 }), need('rf.MOSI', 'D11', W.toPin, { x: 'MOSI', p: 11 }), need('rf.MISO', 'D12', W.toPin, { x: 'MISO', p: 12 }), need('rf.RST', 'D9', W.toPin, { x: 'RST', p: 9 })],
    done: (S) => S.w('opened') && S.w('denied') });

  // 6 -------------------------------------------------------------------------------------------------------- OLED weather station
  L.push({ id: 'weather', n: ++n, cls: '9–12', blocks: true, view: 'wide', rview: 'scene3', code: WEATHER, drawer: ['dht11', 'oled'], serial: false, scene: { kind: 'air', sky: true },
    title: t3('Weather station on an OLED', 'ओएलईडी पर मौसम केंद्र', 'OLED par weather station'),
    goal: t3('Show the temperature, humidity and a thermometer bar on a 128 × 64 OLED, and watch it change with the weather.', '128 × 64 ओएलईडी पर तापमान, नमी और थर्मामीटर की पट्टी दिखाइए, और मौसम के साथ बदलते देखिए।', '128 × 64 OLED par temperature, nami aur thermometer ki patti dikhaiye, aur mausam ke saath badalte dekhiye.'),
    setup: { parts: [], wires: POWER },
    steps: [
      { k: 'place', place: P('dht', 'dht11', {}, 'j40', 0), do: t3('Plug the DHT11 into 40j–42j, its grille facing you.', 'DHT11 को 40j–42j में लगाइए, जाली आपकी तरफ़।', 'DHT11 ko 40j–42j mein lagaiye, jaali aapki taraf.'), see: t3('', '', '') },
      w3('dht', 'VCC', 'rail:bp', 'Its middle pin (+) to the front + rail.', 'इसका बीच वाला पिन (+) आगे वाली + रेल से।', 'Iska beech wala pin (+) aage wali + rail se.'),
      w3('dht', 'GND', 'rail:bn', 'Its right pin (−) to the front − rail.', 'इसका दायाँ पिन (−) आगे वाली − रेल से।', 'Iska right pin (−) aage wali − rail se.'),
      w3('dht', 'DATA', 'D2', 'Its left pin (DATA) to pin 2.', 'इसका बायाँ पिन (DATA) पिन 2 से।', 'Iska left pin (DATA) pin 2 se.'),
      { k: 'place', place: P('oled', 'oled', {}, 'e20', 0), do: t3('Plug the OLED\'s four pins into 20e–23e: it lies flat, its screen over the lower half.', 'ओएलईडी के चार पिन 20e–23e में लगाइए: यह सपाट लेटता है, इसकी स्क्रीन निचले आधे पर।', 'OLED ke chaar pin 20e–23e mein lagaiye: yeh flat letta hai, iski screen neeche wale aadhe par.'), see: t3('', '', '') },
      w3('oled', 'GND', 'rail:tn', 'Its GND (column 20) to the back − rail.', 'इसका GND (कॉलम 20) पीछे वाली − रेल से।', 'Iska GND (column 20) peeche wali − rail se.'),
      w3('oled', 'VCC', 'rail:tp', 'Its VCC (column 21) to the back + rail.', 'इसका VCC (कॉलम 21) पीछे वाली + रेल से।', 'Iska VCC (column 21) peeche wali + rail se.'),
      w3('oled', 'SCL', 'A5', 'Its SCL (column 22) to A5.', 'इसका SCL (कॉलम 22) A5 से।', 'Iska SCL (column 22) A5 se.'),
      w3('oled', 'SDA', 'A4', 'Its SDA (column 23) to A4.', 'इसका SDA (कॉलम 23) A4 से।', 'Iska SDA (column 23) A4 se.'),
      CHECK,
      RUN(),
      { k: 'watch', until: (S) => S.w('shown'), do: t3('Read the OLED.', 'ओएलईडी पढ़िए।', 'OLED padhiye.'), see: t3('Big numbers (text size 2) and a bar: fillRect() fills one dot for every degree.', 'बड़ी संख्याएँ (टेक्स्ट साइज़ 2) और एक पट्टी: fillRect() हर डिग्री के लिए एक बिंदु भरता है।', 'Bade numbers (text size 2) aur ek patti: fillRect() har degree ke liye ek dot bharta hai.') },
      { k: 'act', until: (S) => S.w('changed'), do: t3('Change the weather outside: try Rainy or Winter night.', 'बाहर का मौसम बदलिए: बारिश या सर्दी की रात आज़माइए।', 'Bahar ka mausam badaliye: baarish ya sardi ki raat aazmaiye.'), see: t3('Rain: cooler and very humid. A winter night: cold, the bar shrinks.', 'बारिश: ठंडा और बहुत नम। सर्दी की रात: ठंड, पट्टी छोटी होती है।', 'Baarish: thanda aur bahut nam. Sardi ki raat: thand, patti chhoti hoti hai.') },
      { k: 'edit', test: (src) => /display\.print\(\s*t\s*\*\s*1\.8\s*\+\s*32/.test(src), set: [[/display\.print\(t, 1\);\n  display\.println\(" C"\);/, 'display.print(t * 1.8 + 32, 1);\n  display.println(" F");']], do: t3('Show Fahrenheit: change display.print(t, 1) to display.print(t * 1.8 + 32, 1), " C" to " F", and press Run. In Blocks: drag a Maths block (+, then ×) into the print block in place of t.', 'फ़ारेनहाइट दिखाइए: display.print(t, 1) को display.print(t * 1.8 + 32, 1) कीजिए, " C" को " F", और "चलाइए" दबाइए। ब्लॉक में: गणित वाला ब्लॉक (+, फिर ×) खींचकर print ब्लॉक में t की जगह रखिए।', 'Fahrenheit dikhaiye: display.print(t, 1) ko display.print(t * 1.8 + 32, 1) karo, " C" ko " F", aur Run dabaiye. Blocks mein: Maths block (+, phir ×) kheench kar print block mein t ki jagah rakhiye.'), see: t3('', '', '') },
      { k: 'watch', until: (S) => fresh(S) && S.w('fahrenheit'), do: t3('Read it again.', 'फिर से पढ़िए।', 'Phir se padhiye.'),
        see: live((lg, R) => (R.tMin === undefined ? '' : pick(lg, `Your results: the screen showed ${R.tMin} °C to ${R.tMax} °C as the weather changed${R.tF ? ', and ' + R.tF + ' °F at the end' : ''}. The same heat is a bigger number in °F: °F = °C × 1.8 + 32.`, `आपके नतीजे: मौसम बदलने पर स्क्रीन ने ${R.tMin} °C से ${R.tMax} °C तक दिखाया${R.tF ? ', और आख़िर में ' + R.tF + ' °F' : ''}। वही गर्मी °F में बड़ी संख्या होती है: °F = °C × 1.8 + 32।`, `Aapke results: mausam badalne par screen ne ${R.tMin} °C se ${R.tMax} °C tak dikhaya${R.tF ? ', aur aakhir mein ' + R.tF + ' °F' : ''}. Wahi garmi °F mein bada number hoti hai: °F = °C × 1.8 + 32.`))) },
    ],
    check: [...rails, has('dht', NN.dht), ...powChecks('dht', NN.dht), need('dht.DATA', 'D2', W.toPin, { x: 'DHT11 DATA', p: 2 }), ...i2cChecks('oled', NN.oled)],
    done: (S) => S.w('changed') && S.w('fahrenheit') });

  // 7 -------------------------------------------------------------------------------------------------------- keypad lock
  L.push({ id: 'keylock', n: ++n, cls: '9–12', blocks: false, view: 'wide', rview: 'scene3', code: LOCKER, drawer: ['keypad'], serial: true, scene: { kind: 'locker' },
    title: t3('Keypad password lock', 'कीपैड पासवर्ड लॉक', 'Keypad password lock'),
    goal: t3('Type a password on a 4×4 keypad; the right one and # make a servo open the locker, a wrong one gets a long beep.', '4×4 कीपैड पर पासवर्ड टाइप कीजिए; सही पासवर्ड और # से सर्वो लॉकर खोलता है, ग़लत पर लंबी बीप।', '4×4 keypad par password type kijiye; sahi password aur # se servo locker kholta hai, galat par lambi beep.'),
    setup: { parts: [F('sv1', 'servo', { mount: 'lock' }, 178, 70, 1), P('bz1', 'buzzer', {}, 'e30', 0)], wires: [...POWER, ['T:sv1:GND', 'H:bn40'], ['T:sv1:VP', 'H:bp40'], ['T:sv1:SIG', 'D10'], ['D12', 'H:a30'], ['H:a33', 'H:tn27']] },
    steps: [
      { k: 'info', do: t3('The locker\'s latch servo (pin 10) and a buzzer (pin 12) are ready. The keypad has 16 keys but only 8 wires: 4 rows and 4 columns.', 'लॉकर की कुंडी वाला सर्वो (पिन 10) और बज़र (पिन 12) तैयार हैं। कीपैड में 16 बटन हैं पर सिर्फ़ 8 तार: 4 पंक्तियाँ और 4 कॉलम।', 'Locker ki kundi wala servo (pin 10) aur buzzer (pin 12) taiyaar hain. Keypad mein 16 button hain par sirf 8 wire: 4 rows aur 4 columns.'), see: t3('', '', '') },
      { k: 'place', place: F('kp', 'keypad', {}, -40, 165, 0), do: t3('Put the keypad on the mat at the ghost.', 'कीपैड को मैट पर नीली आकृति पर रखिए।', 'Keypad ko mat par neeli shape par rakhiye.'), see: t3('', '', '') },
      ...[['R1', 9], ['R2', 8], ['R3', 7], ['R4', 6], ['C1', 5], ['C2', 4], ['C3', 3], ['C4', 2]].map(([id, pin], i) => w3('kp', id, 'D' + pin, `Wire its pin ${i + 1} (${id}) to pin ${pin}.`, `इसका पिन ${i + 1} (${id}) पिन ${pin} से जोड़िए।`, `Iska pin ${i + 1} (${id}) pin ${pin} se jodiye.`,
        i === 7 ? t3('Eight wires in order: the left four are the rows, the right four the columns.', 'क्रम से आठ तार: बाएँ चार पंक्तियाँ हैं, दाएँ चार कॉलम।', 'Kram se aath wire: left ke chaar rows hain, right ke chaar columns.') : null)),
      CHECK,
      RUN(t3('Each key you press beeps and shows on the Serial Monitor.', 'हर दबाया गया बटन बीप करता है और सीरियल मॉनिटर पर दिखता है।', 'Har dabaya gaya button beep karta hai aur Serial Monitor par dikhta hai.')),
      { k: 'act', until: (S) => S.w('wrong'), do: t3('Try a wrong password: press 1 1 1 1 #.', 'ग़लत पासवर्ड आज़माइए: 1 1 1 1 # दबाइए।', 'Galat password aazmaiye: 1 1 1 1 # dabaiye.'), see: t3('A long low beep, and the locker stays shut.', 'एक लंबी धीमी बीप, और लॉकर बंद रहता है।', 'Ek lambi dheemi beep, aur locker band rehta hai.') },
      { k: 'act', until: (S) => S.w('opened'), do: t3('Now the right one: 1 2 3 4 #.', 'अब सही वाला: 1 2 3 4 #।', 'Ab sahi wala: 1 2 3 4 #.'), see: t3('"Open!": the servo pulls the latch for 4 seconds.', '"Open!": सर्वो 4 सेकंड के लिए कुंडी खींचता है।', '"Open!": servo 4 second ke liye kundi kheenchta hai.') },
      { k: 'edit', test: (src) => /String\s+password\s*=\s*"2580"\s*;/.test(src), set: [[/"1234"/, '"2580"']], do: t3('1234 is too easy to guess. Change the password to "2580" and press Run.', '1234 का अंदाज़ा लगाना बहुत आसान है। पासवर्ड को "2580" कीजिए और "चलाइए" दबाइए।', '1234 ka andaza lagana bahut aasaan hai. Password ko "2580" karo aur Run dabaiye.'), see: t3('', '', '') },
      { k: 'act', until: (S) => fresh(S) && S.w('opened') && S.wv('res') && S.wv('res').code === '2580', do: t3('Open it with 2 5 8 0 #.', '2 5 8 0 # से खोलिए।', '2 5 8 0 # se kholiye.'),
        see: live((lg, R) => (!R.code ? '' : pick(lg, `Your results: "${R.wrongCode || '1111'}" was refused, "${R.code}" opened the locker. A 4-digit code has 10 000 choices; adding A–D gives 65 536.`, `आपके नतीजे: "${R.wrongCode || '1111'}" को मना किया गया, "${R.code}" से लॉकर खुला। 4 अंकों के कोड के 10 000 विकल्प हैं; A–D जोड़ें तो 65 536।`, `Aapke results: "${R.wrongCode || '1111'}" ko mana kiya gaya, "${R.code}" se locker khula. 4 digit ke code ke 10 000 options hain; A–D jodein to 65 536.`))) },
    ],
    check: [noShort, has('kp', NN.kp), ...[['R1', 9], ['R2', 8], ['R3', 7], ['R4', 6], ['C1', 5], ['C2', 4], ['C3', 3], ['C4', 2]].map(([id, pin]) => (S) => (S.conn('kp.' + id, 'D' + pin) ? null : [X.kpOrder]))],
    done: (S) => !!(S.wv('res') && S.wv('res').wrongCode && S.wv('res').code === '2580') });

  // 8 -------------------------------------------------------------------------------------------------------- gas leak alarm
  L.push({ id: 'gasalarm', n: ++n, cls: '6–8', blocks: true, view: 'wide', rview: 'scene3', code: GAS, drawer: ['mq2'], serial: true, scene: { kind: 'kitchen' },
    title: t3('Gas leak alarm', 'गैस लीक अलार्म', 'Gas leak alarm'),
    goal: t3('An MQ-2 sensor smells LPG in the kitchen and sounds the alarm before the gas can catch fire.', 'MQ-2 सेंसर रसोई में एलपीजी सूँघता है और गैस में आग लगने से पहले अलार्म बजाता है।', 'MQ-2 sensor rasoi mein LPG soonghta hai aur gas mein aag lagne se pehle alarm bajata hai.'),
    setup: { parts: [P('led1', 'led', { color: 'red' }, 'e22', 0), P('r1', 'resistor', { ohms: 220 }, 'b22', 3), P('bz1', 'buzzer', {}, 'e30', 0)], wires: [...POWER, ['D13', 'H:a23'], ['D8', 'H:a30'], ['H:a33', 'H:tn27']] },
    steps: [
      { k: 'place', place: F('mq', 'mq2', {}, 160, 92, 0), do: t3('Put the MQ-2 gas sensor on the mat at the ghost, near the kitchen.', 'MQ-2 गैस सेंसर को मैट पर नीली आकृति पर, रसोई के पास रखिए।', 'MQ-2 gas sensor ko mat par neeli shape par, rasoi ke paas rakhiye.'), see: t3('', '', '') },
      ...pw('mq', 'gas sensor', 'गैस सेंसर', 'Gas sensor'),
      w3('mq', 'AO', 'A0', 'Its AO to A0.', 'इसका AO, A0 से।', 'Iska AO, A0 se.'),
      CHECK,
      RUN(t3('Its heater takes 150 mA and warms the sensor: the numbers start high and settle.', 'इसका हीटर 150 mA लेता है और सेंसर को गर्म करता है: संख्याएँ ऊँची शुरू होकर नीचे टिकती हैं।', 'Iska heater 150 mA leta hai aur sensor ko garam karta hai: numbers oonche shuru hokar neeche tikte hain.')),
      { k: 'watch', until: (S) => S.w('warm'), do: t3('Wait for the sensor to warm up (the Serial Monitor).', 'सेंसर के गर्म होने तक रुकिए (सीरियल मॉनिटर)।', 'Sensor ke garam hone tak rukiye (Serial Monitor).'), see: t3('Clean air: a low number, about 80.', 'साफ़ हवा: छोटी संख्या, लगभग 80।', 'Saaf hawa: chhota number, lagbhag 80.') },
      { k: 'act', until: (S) => S.w('alarm'), do: t3('In the kitchen panel, leave the gas knob open a little (about 30 %).', 'रसोई के पैनल में गैस का नॉब थोड़ा खुला छोड़िए (लगभग 30 %)।', 'Rasoi ke panel mein gas ka knob thoda khula chhodiye (lagbhag 30 %).'), see: t3('The number climbs past 300: the LED and the buzzer warn.', 'संख्या 300 के पार जाती है: एलईडी और बज़र चेतावनी देते हैं।', 'Number 300 ke paar jaata hai: LED aur buzzer warning dete hain.') },
      { k: 'act', until: (S) => S.w('safe'), do: t3('Close the knob (0 %) and open the window.', 'नॉब बंद कीजिए (0 %) और खिड़की खोलिए।', 'Knob band kijiye (0 %) aur khidki kholiye.'), see: t3('Fresh air carries the gas out; the alarm stops. In a real leak: no flame, no switches, open the windows, turn off the cylinder.', 'ताज़ी हवा गैस बाहर ले जाती है; अलार्म रुकता है। असली लीक में: कोई आग नहीं, कोई स्विच नहीं, खिड़कियाँ खोलिए, सिलेंडर बंद कीजिए।', 'Taazi hawa gas bahar le jaati hai; alarm rukta hai. Asli leak mein: koi aag nahi, koi switch nahi, khidkiyan kholiye, cylinder band kijiye.') },
      { k: 'edit', test: (src) => /int\s+limit\s*=\s*(1[5-9]\d|2[0-4]\d)\s*;/.test(src), set: [[/int limit = 300;/, 'int limit = 200;']], do: t3('Warn earlier: change limit = 300 to limit = 200 and press Run.', 'पहले चेतावनी दीजिए: limit = 300 को limit = 200 कीजिए और "चलाइए" दबाइए।', 'Pehle warning dijiye: limit = 300 ko limit = 200 karo aur Run dabaiye.'), see: t3('', '', '') },
      { k: 'act', until: (S) => fresh(S) && S.w('alarm'), do: t3('Close the window and leave the knob open a little again.', 'खिड़की बंद कीजिए और नॉब फिर थोड़ा खुला छोड़िए।', 'Khidki band kijiye aur knob phir thoda khula chhodiye.'),
        see: live((lg, R) => (R.max === undefined ? '' : pick(lg, `Your results: clean air read ${R.clean ?? '≈ 80'}; the alarm began at ${R.alarmAt} and the gas reached ${R.max}. A lower limit warns sooner, but steam and smoke may set it off too.`, `आपके नतीजे: साफ़ हवा ${R.clean ?? '≈ 80'} पढ़ी; अलार्म ${R.alarmAt} पर शुरू हुआ और गैस ${R.max} तक पहुँची। कम limit जल्दी चेतावनी देती है, पर भाप और धुएँ से भी बज सकती है।`, `Aapke results: saaf hawa ${R.clean ?? '≈ 80'} padhi; alarm ${R.alarmAt} par shuru hua aur gas ${R.max} tak pahunchi. Kam limit jaldi warning deti hai, par bhaap aur dhuen se bhi baj sakti hai.`))) },
    ],
    check: [...rails, has('mq', NN.mq), ...powChecks('mq', NN.mq), need('mq.AO', 'A0', W.join, { a: t3('The gas sensor\'s AO', 'गैस सेंसर का AO', 'Gas sensor ka AO'), b: 'A0' })],
    done: (S) => S.w('safe') && S.w('alarm') });

  // 9 -------------------------------------------------------------------------------------------------------- joystick pan-tilt
  L.push({ id: 'pantilt', n: ++n, cls: '9–12', blocks: true, view: 'wide', rview: 'scene3pt', code: PANTILT, drawer: ['joystick'], serial: true, scene: { kind: 'pantilt' },
    title: t3('Joystick pan-tilt laser', 'जॉयस्टिक पैन-टिल्ट लेज़र', 'Joystick pan-tilt laser'),
    goal: t3('Two servos turn a laser head left-right (pan) and up-down (tilt); a joystick steers it onto the targets.', 'दो सर्वो एक लेज़र हेड को बाएँ-दाएँ (पैन) और ऊपर-नीचे (टिल्ट) घुमाते हैं; जॉयस्टिक से इसे निशानों पर लगाइए।', 'Do servo ek laser head ko left-right (pan) aur upar-neeche (tilt) ghumate hain; joystick se ise nishanon par lagaiye.'),
    setup: { parts: [F('svP', 'servo', { mount: 'pt' }, 178, 52, 1), F('svT', 'servo', { mount: 'pt' }, 178, 82, 1)], wires: [...POWER, ['T:svP:GND', 'H:bn40'], ['T:svP:VP', 'H:bp40'], ['T:svP:SIG', 'D5'], ['T:svT:GND', 'H:bn44'], ['T:svT:VP', 'H:bp44'], ['T:svT:SIG', 'D6']] },
    steps: [
      { k: 'place', place: F('js', 'joystick', {}, -60, 160, 0), do: t3('Put the joystick on the mat at the ghost. The pan servo (pin 5) and the tilt servo (pin 6) are wired.', 'जॉयस्टिक को मैट पर नीली आकृति पर रखिए। पैन सर्वो (पिन 5) और टिल्ट सर्वो (पिन 6) जुड़े हैं।', 'Joystick ko mat par neeli shape par rakhiye. Pan servo (pin 5) aur tilt servo (pin 6) jude hain.'), see: t3('', '', '') },
      w3('js', 'GND', 'rail:bn', 'Wire its GND to the front − rail.', 'इसका GND आगे वाली − रेल से जोड़िए।', 'Iska GND aage wali − rail se jodiye.'),
      w3('js', 'V5', 'rail:bp', 'Its +5V to the front + rail.', 'इसका +5V आगे वाली + रेल से।', 'Iska +5V aage wali + rail se.'),
      w3('js', 'VRX', 'A0', 'VRx (left–right) to A0.', 'VRx (बाएँ–दाएँ) A0 से।', 'VRx (left–right) A0 se.'),
      w3('js', 'VRY', 'A1', 'VRy (up–down) to A1.', 'VRy (ऊपर–नीचे) A1 से।', 'VRy (upar–neeche) A1 se.'),
      CHECK,
      RUN(t3('The head looks straight ahead: the stick in the middle reads about 512, and map() turns that into 90°.', 'हेड सीधा आगे देखता है: बीच में स्टिक लगभग 512 पढ़ती है, और map() उसे 90° बना देता है।', 'Head seedha aage dekhta hai: beech mein stick lagbhag 512 padhti hai, aur map() use 90° bana deta hai.')),
      { k: 'act', until: (S) => S.w('hitA'), do: t3('Drag the joystick\'s cap: put the laser dot on target A (left, low).', 'जॉयस्टिक की टोपी खींचिए: लेज़र का बिंदु निशान A (बाएँ, नीचे) पर लाइए।', 'Joystick ki topi kheenchiye: laser ka dot nishan A (left, neeche) par laaiye.'), see: t3('Hit! The angles follow your hand.', 'निशाना लगा! कोण आपके हाथ के साथ चलते हैं।', 'Nishana laga! Angles aapke haath ke saath chalte hain.') },
      { k: 'act', until: (S) => S.w('hitB'), do: t3('Now target B (right, high).', 'अब निशान B (दाएँ, ऊपर)।', 'Ab nishan B (right, upar).'), see: t3('Let go and the stick springs back: the head looks ahead again.', 'छोड़िए तो स्टिक वापस आ जाती है: हेड फिर सामने देखता है।', 'Chhodiye to stick wapas aa jaati hai: head phir saamne dekhta hai.') },
      { k: 'edit', test: (src) => /map\(\s*y\s*,\s*0\s*,\s*1023\s*,\s*150\s*,\s*30\s*\)/.test(src), set: [[/map\(y, 0, 1023, 30, 150\)/, 'map(y, 0, 1023, 150, 30)']], do: t3('Make it fly like a plane (pull back to look up): change map(y, 0, 1023, 30, 150) to map(y, 0, 1023, 150, 30) and press Run.', 'इसे हवाई जहाज़ की तरह चलाइए (पीछे खींचें तो ऊपर): map(y, 0, 1023, 30, 150) को map(y, 0, 1023, 150, 30) कीजिए और "चलाइए" दबाइए।', 'Ise hawai jahaz ki tarah chalaiye (peeche kheenchein to upar): map(y, 0, 1023, 30, 150) ko map(y, 0, 1023, 150, 30) karo aur Run dabaiye.'), see: t3('', '', '') },
      { k: 'act', until: (S) => fresh(S) && S.w('hitB'), do: t3('Hit target B again: which way must the stick go now?', 'निशान B पर फिर लगाइए: अब स्टिक किस तरफ़ जानी चाहिए?', 'Nishan B par phir lagaiye: ab stick kis taraf jaani chahiye?'),
        see: live((lg, R) => (!R.hitA ? '' : pick(lg, `Your results: target A at pan ${R.hitA[0]}°, tilt ${R.hitA[1]}°${R.hitB ? `; B at ${R.hitB[0]}°, ${R.hitB[1]}°` : ''}; the head swept from ${R.panRange[0]}° to ${R.panRange[1]}°. Swapping the last two numbers of map() flips a direction.`, `आपके नतीजे: निशान A पैन ${R.hitA[0]}°, टिल्ट ${R.hitA[1]}° पर${R.hitB ? `; B ${R.hitB[0]}°, ${R.hitB[1]}° पर` : ''}; हेड ${R.panRange[0]}° से ${R.panRange[1]}° तक घूमा। map() के आख़िरी दो अंक बदलने से दिशा उलट जाती है।`, `Aapke results: nishan A pan ${R.hitA[0]}°, tilt ${R.hitA[1]}° par${R.hitB ? `; B ${R.hitB[0]}°, ${R.hitB[1]}° par` : ''}; head ${R.panRange[0]}° se ${R.panRange[1]}° tak ghooma. map() ke aakhri do number badalne se disha ulat jaati hai.`))) },
    ],
    check: [...rails, has('js', NN.js), need('js.V5', '5V', W.to5v, { x: NN.js }), need('js.GND', 'GND', W.toGnd, { x: NN.js }), need('js.VRX', 'A0', W.join, { a: 'VRx', b: 'A0' }), need('js.VRY', 'A1', W.join, { a: 'VRy', b: 'A1' })],
    done: (S) => S.w('hitA') && S.w('hitB') });

  // 10 ------------------------------------------------------------------------------------------------------- stepper turntable
  L.push({ id: 'turntable', n: ++n, cls: '6–8', blocks: true, view: 'wide', rview: 'scene3', code: TURN, drawer: ['stepper'], serial: true, scene: { kind: 'turn' },
    title: t3('Stepper motor turntable', 'स्टेपर मोटर टर्नटेबल', 'Stepper motor turntable'),
    goal: t3('A stepper motor turns exactly as many steps as you ask: make a display turntable that turns a quarter turn at a time.', 'स्टेपर मोटर ठीक उतने क़दम घूमती है जितने आप कहें: एक डिस्प्ले टर्नटेबल बनाइए जो एक बार में चौथाई चक्कर घूमे।', 'Stepper motor theek utne steps ghoomti hai jitne aap kahein: ek display turntable banaiye jo ek baar mein chauthai chakkar ghoome.'),
    setup: { parts: [], wires: POWER },
    steps: [
      { k: 'place', place: F('st', 'stepper', {}, -66, 150, 0), do: t3('Put the stepper\'s driver board on the mat at the ghost (the motor under the turntable is plugged into it).', 'स्टेपर के ड्राइवर बोर्ड को मैट पर नीली आकृति पर रखिए (टर्नटेबल के नीचे की मोटर इसमें लगी है)।', 'Stepper ke driver board ko mat par neeli shape par rakhiye (turntable ke neeche ki motor ismein lagi hai).'), see: t3('', '', '') },
      ...[['IN1', 8], ['IN2', 9], ['IN3', 10], ['IN4', 11]].map(([id, pin]) => w3('st', id, 'D' + pin, `Wire ${id} to pin ${pin}.`, `${id} को पिन ${pin} से जोड़िए।`, `${id} ko pin ${pin} se jodiye.`)),
      w3('st', 'GND', 'rail:bn', 'Its − pin to the front − rail.', 'इसका − पिन आगे वाली − रेल से।', 'Iska − pin aage wali − rail se.'),
      w3('st', 'VCC', 'rail:bp', 'Its + pin to the front + rail.', 'इसका + पिन आगे वाली + रेल से।', 'Iska + pin aage wali + rail se.', t3('The four coils take about 200 mA together: the driver gives it, the pins only say which coils.', 'चारों कॉइल मिलकर लगभग 200 mA लेती हैं: ड्राइवर यह देता है, पिन सिर्फ़ बताते हैं कि कौन-सी कॉइल।', 'Chaaron coil milkar lagbhag 200 mA leti hain: driver yeh deta hai, pin sirf batate hain ki kaunsi coil.')),
      CHECK,
      RUN(),
      { k: 'watch', until: (S) => S.w('quarter'), do: t3('Watch the turntable and the four LEDs A–D.', 'टर्नटेबल और चारों एलईडी A–D देखिए।', 'Turntable aur chaaron LED A–D dekhiye.'), see: t3('The LEDs walk A, B, C, D: each step pulls the magnet a little further. 512 steps = 90°.', 'एलईडी A, B, C, D चलती हैं: हर क़दम चुंबक को थोड़ा आगे खींचता है। 512 क़दम = 90°।', 'LED A, B, C, D chalti hain: har step magnet ko thoda aage kheenchta hai. 512 steps = 90°.') },
      { k: 'edit', test: (src) => /setSpeed\(\s*(2\d|3\d)\s*\)/.test(src), set: [[/setSpeed\(10\)/, 'setSpeed(25)']], do: t3('Faster? Change setSpeed(10) to setSpeed(25) and press Run.', 'और तेज़? setSpeed(10) को setSpeed(25) कीजिए और "चलाइए" दबाइए।', 'Aur tez? setSpeed(10) ko setSpeed(25) karo aur Run dabaiye.'), see: t3('', '', '') },
      { k: 'watch', until: (S) => fresh(S) && S.part('st') && (S.part('st').state.miss || 0) > 100 && !S.w('quarter'), do: t3('Watch and listen.', 'देखिए और सुनिए।', 'Dekhiye aur suniye.'), see: t3('It hums but does not turn: the coils change faster than the magnet can follow. This motor manages about 15 turns a minute.', 'यह गुनगुनाती है पर घूमती नहीं: कॉइल इतनी तेज़ी से बदलती हैं कि चुंबक साथ नहीं दे पाता। यह मोटर लगभग 15 चक्कर एक मिनट में ही कर पाती है।', 'Yeh gungunati hai par ghoomti nahi: coil itni tezi se badalti hain ki magnet saath nahi de paata. Yeh motor lagbhag 15 chakkar ek minute mein hi kar paati hai.') },
      { k: 'edit', test: (src) => /setSpeed\(\s*(1[0-4]|[5-9])\s*\)/.test(src) && /step\(\s*2048\s*\)/.test(src), set: [[/setSpeed\(\d+\)/, 'setSpeed(12)'], [/step\(512\)/, 'step(2048)']], do: t3('Use setSpeed(12) and a full turn: step(512) → step(2048). Press Run.', 'setSpeed(12) और पूरा चक्कर लीजिए: step(512) → step(2048)। "चलाइए" दबाइए।', 'setSpeed(12) aur poora chakkar lijiye: step(512) → step(2048). Run dabaiye.'), see: t3('', '', '') },
      { k: 'watch', until: (S) => fresh(S) && S.w('full'), do: t3('Watch one full turn.', 'एक पूरा चक्कर देखिए।', 'Ek poora chakkar dekhiye.'),
        see: live((lg, R) => (R.turn === undefined ? '' : pick(lg, `Your results: ${Math.abs(R.steps)} steps turned the plate ${Math.abs(R.turn)}°, so one step is ${(Math.abs(R.turn / R.steps) || 0).toFixed(3)}°. That precision is why 3D printers and CNC machines use steppers.`, `आपके नतीजे: ${Math.abs(R.steps)} क़दमों ने प्लेट को ${Math.abs(R.turn)}° घुमाया, यानी एक क़दम ${(Math.abs(R.turn / R.steps) || 0).toFixed(3)}° का है। इसी सटीकता के कारण 3D प्रिंटर और CNC मशीनें स्टेपर इस्तेमाल करती हैं।`, `Aapke results: ${Math.abs(R.steps)} steps ne plate ko ${Math.abs(R.turn)}° ghumaya, yaani ek step ${(Math.abs(R.turn / R.steps) || 0).toFixed(3)}° ka hai. Isi precision ke kaaran 3D printer aur CNC machine stepper use karti hain.`))) },
    ],
    check: [...rails, has('st', NN.st), ...[['IN1', 8], ['IN2', 9], ['IN3', 10], ['IN4', 11]].map(([id, pin]) => (S) => (S.conn('st.' + id, 'D' + pin) ? null : [X.steps])), need('st.VCC', '5V', W.to5v, { x: NN.st }), need('st.GND', 'GND', W.toGnd, { x: NN.st })],
    done: (S) => S.w('full') });

  for (const l of L) { l.world = l.scene; } // the lesson runtime asks the "world" (worlds3.js makes it from the scene)
  void N; void tagN;
  return L;
}
