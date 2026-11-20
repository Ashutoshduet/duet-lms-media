// DUET Robotics Lab 360, batch 24: Class 11 machine sessions, written fresh for DUET (same shape as lessons.js).
//   wateratm   a water ATM (an RO kiosk, as in Indian villages and railway stations): tap an RFID card, the pump pours
//              one glass through a relay, and the price comes off that card's balance (scenes3.js AtmScene measures the
//              glass). The reader, the LCD and the pump with its battery are already wired; the student wires the relay.
//              The first program runs the pump 4 s: the glass is about half full (≈ 130 mL of 250), so the student
//              works out the pump's rate (≈ 33 mL a second) and calibrates pourMs (≈ 7600 ms). Then the blue tag, with
//              only Rs 3 on it, buys one glass and is refused the next ("Low balance"), with nothing poured.
//   vending    a rotary vending machine: six compartments on a tray turned by the 28BYJ-48 stepper (2048 steps a turn),
//              one door at the front, a 4×4 keypad to choose (a digit, then #), the LCD shows the item and its price
//              (scenes3.js VendScene measures each move). The first program guesses 300 steps per compartment: item 3
//              stops at 105°, between two doors (a jam). 2048 ÷ 6 = 341.3 → 341. Then from 6 to 1 the tray goes 300° the
//              long way round; the student makes it take the short way (± 3 compartments at most: wrap with ± 6).
// The helpers (t3, P, F, W, need, has, noShort) come from lessons.js. devtools/test/robocore24.mjs plays them end to end.
import { GLASS, CUR, VEND } from './scenes3.js';

const t3 = (en, hi, hg) => ({ en, hi, hg });
const pick = (lg, en, hi, hg) => (lg === 'hi' ? hi : lg === 'hg' ? hg : en);
function live(f) { const o = {}; for (const lg of ['en', 'hi', 'hg']) Object.defineProperty(o, lg, { enumerable: true, get: () => { try { return String(f(lg, (CUR.sim && CUR.sim.res) || {}) || ''); } catch (e) { return ''; } } }); return o; }

// ------------------------------------------------------------------ the programs
const ATM = `// Water ATM: tap your card, get a glass of clean water, and the price comes off your balance.
#include <SPI.h>
#include <MFRC522.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>

MFRC522 rfid(10, 9);                   // SDA (SS) on pin 10, RST on pin 9
LiquidCrystal_I2C lcd(0x27, 16, 2);   // address 0x27, 16 columns, 2 rows
const int pump = 4;                    // the relay: HIGH = pump on

String cards[] = {"A3 4F 1C 2D", "5B 2E 91 C4"};   // the white card, the blue tag
int balance[] = {10, 3};               // rupees on each
const int PRICE = 2;                   // rupees for one glass
unsigned long pourMs = 4000;           // how long the pump runs for one glass (ms)

void showReady() {
  lcd.clear();
  lcd.print("WATER ATM  Rs 2");
  lcd.setCursor(0, 1);
  lcd.print("Tap your card");
}

void setup() {
  pinMode(pump, OUTPUT);
  digitalWrite(pump, LOW);
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
  rfid.PICC_HaltA();
  Serial.print("Card: ");
  Serial.println(uid);

  int who = -1;                          // whose card is it?
  for (int i = 0; i < 2; i++) {
    if (uid == cards[i]) who = i;
  }
  lcd.clear();
  if (who == -1) {
    lcd.print("Unknown card");
  } else if (balance[who] < PRICE) {
    lcd.print("Low balance");
    lcd.setCursor(0, 1);
    lcd.print("Bal: Rs ");
    lcd.print(balance[who]);
  } else {
    balance[who] = balance[who] - PRICE;
    lcd.print("Pouring...");
    digitalWrite(pump, HIGH);            // the relay switches the pump on
    delay(pourMs);
    digitalWrite(pump, LOW);
    lcd.clear();
    lcd.print("Enjoy your water");
    lcd.setCursor(0, 1);
    lcd.print("Bal: Rs ");
    lcd.print(balance[who]);
    Serial.print("Balance: ");
    Serial.println(balance[who]);
  }
  delay(2500);
  showReady();
}
`;

const VENDC = `// Rotary vending machine: choose 1 to 6 on the keypad and #, and the tray brings that compartment to the door.
#include <Keypad.h>
#include <Stepper.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>

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

Stepper tray(2048, 10, 12, 11, 13);    // 28BYJ-48: 2048 steps a turn (IN1, IN3, IN2, IN4)
LiquidCrystal_I2C lcd(0x27, 16, 2);

String names[] = {"Chips", "Biscuits", "Juice", "Chocolate", "Peanuts", "Water"};
int prices[] = {20, 10, 30, 40, 15, 20};
int stepsPerSlot = 300;                // steps from one compartment to the next (a guess)
int pos = 1;                           // the compartment at the door now
int item = 0;                          // the one being chosen

void showMenu() {
  lcd.clear();
  lcd.print("Choose 1-6 + #");
}

void setup() {
  tray.setSpeed(10);
  lcd.init();
  lcd.backlight();
  Serial.begin(9600);
  showMenu();
}

void loop() {
  char k = keypad.getKey();
  if (!k) return;
  if (k >= '1' && k <= '6') {
    item = k - '0';
    lcd.clear();
    lcd.print(names[item - 1]);
    lcd.setCursor(0, 1);
    lcd.print("Rs ");
    lcd.print(prices[item - 1]);
    lcd.print("  press #");
  } else if (k == '#' && item > 0) {
    int moveSlots = item - pos;        // how many compartments to turn
    lcd.clear();
    lcd.print("Turning...");
    tray.step(moveSlots * stepsPerSlot);
    pos = item;
    Serial.print("Served ");
    Serial.println(item);
    lcd.clear();
    lcd.print("Take your ");
    lcd.setCursor(0, 1);
    lcd.print(names[item - 1]);
    item = 0;
    delay(2000);
    showMenu();
  }
}
`;

export function batch24(K, n0) {
  const { F, W, need, has, noShort } = K;
  const E = t3('', '', '');
  const CHECK = { k: 'check', do: t3('Check your circuit.', 'अपना सर्किट जाँचिए।', 'Apna circuit check karo.'), see: E };
  const RUN = (see) => ({ k: 'run', do: t3('Press Run.', '"चलाइए" दबाइए।', 'Run dabaiye.'), see: see || E });
  const w3 = (a, b, en, hi, hg, see) => ({ k: 'wire', wire: [a, b], do: t3(en, hi, hg), see: see || E });
  const fresh = (S) => S.runSrc !== null && S.t - (S.freshAt || 0) > 0.3;
  const POWER = [['5V', 'H:tp30'], ['GND3', 'H:tn18'], ['H:tp2', 'H:bp2'], ['H:tn3', 'H:bn3']];
  const rails = [noShort, (S) => (S.conn('rail:tp', '5V') ? null : [W.vRail]), (S) => (S.conn('rail:tn', 'GND') ? null : [W.gndRail])];
  let n = n0;
  const L = [];

  // 1 ------------------------------------------------------------------------------------------------- water ATM (RFID)
  const RF = [['SDA', 'D10'], ['SCK', 'D13'], ['MOSI', 'D11'], ['MISO', 'D12'], ['RST', 'D9'], ['GND', 'H:bn40'], ['V33', '3V3']];
  const okMs = (src) => { const m = /unsigned\s+long\s+pourMs\s*=\s*(\d+)\s*;/.exec(src || ''); return !!m && +m[1] >= 7000 && +m[1] <= 8200; };
  L.push({ id: 'wateratm', cls: '11', blocks: false, view: 'wide', rview: 'scene3', code: ATM, drawer: ['relay'], serial: true, scene: { kind: 'atm' },
    title: t3('Water ATM with RFID', 'आरएफ़आईडी वाला वॉटर एटीएम', 'RFID wala water ATM'),
    goal: t3('A village water ATM: tap a card, the pump pours one glass of clean water, and Rs 2 comes off that card\'s balance. Make the glass come out full by measuring the pump, and refuse a card that has run out of money.', 'गाँव का वॉटर एटीएम: कार्ड लगाइए, पंप साफ़ पानी का एक गिलास भरता है, और उस कार्ड के बैलेंस से Rs 2 कटते हैं। पंप को नापकर गिलास पूरा भरवाइए, और जिस कार्ड में पैसे ख़त्म हो गए उसे मना कीजिए।', 'Gaon ka water ATM: card lagaiye, pump saaf paani ka ek glass bharta hai, aur us card ke balance se Rs 2 katte hain. Pump ko naap kar glass poora bharwaiye, aur jis card mein paise khatam ho gaye use mana kijiye.'),
    setup: { parts: [F('rf', 'rfid', {}, 110, 160, 0), F('lcd', 'lcd16', {}, -128, 66, 0), F('bat', 'aa4', {}, -40, 150, 0), F('pump', 'pump', { mount: 'tank' }, 182, 140, 1), F('rl1', 'relay', {}, 30, 118, 0)],
      wires: [...POWER, ...RF.map(([p, b]) => ['T:rf:' + p, b]), ['T:lcd:GND', 'H:bn10'], ['T:lcd:VCC', 'H:bp10'], ['T:lcd:SDA', 'A4'], ['T:lcd:SCL', 'A5'],
        ['T:pump:N', 'T:bat:N'], ['T:bat:P', 'T:rl1:COM'], ['T:rl1:NO', 'T:pump:P']] },
    steps: [
      { k: 'info', do: t3('Water ATMs sell clean RO water by the glass or the can, in villages and at railway stations, paid with a card. The RC522 reader (SPI, 3.3 V) and the 16×2 LCD (I2C) are already wired, and the pump with its own 6 V battery: but the pump takes about 200 mA, so a relay must switch it.', 'वॉटर एटीएम गाँवों और रेलवे स्टेशनों पर साफ़ RO पानी गिलास या कैन के हिसाब से बेचते हैं, कार्ड से भुगतान। RC522 रीडर (SPI, 3.3 V) और 16×2 एलसीडी (I2C) पहले से लगे हैं, और पंप अपनी 6 V बैटरी के साथ: पर पंप लगभग 200 mA लेता है, इसलिए इसे रिले से चलाना होगा।', 'Water ATM gaon aur railway station par saaf RO paani glass ya can ke hisaab se bechte hain, card se payment. RC522 reader (SPI, 3.3 V) aur 16×2 LCD (I2C) pehle se lage hain, aur pump apni 6 V battery ke saath: par pump lagbhag 200 mA leta hai, isliye ise relay se chalana hoga.'),
        see: t3('The battery\'s + goes through the relay\'s COM and NO to the pump: when the relay clicks, the pump runs.', 'बैटरी का + रिले के COM और NO से होकर पंप तक जाता है: रिले क्लिक करे तो पंप चलता है।', 'Battery ka + relay ke COM aur NO se hokar pump tak jaata hai: relay click kare to pump chalta hai.') },
      w3('rl1.S', 'D4', 'Wire the relay\'s S (signal) to pin 4.', 'रिले का S (सिग्नल) पिन 4 से जोड़िए।', 'Relay ka S (signal) pin 4 se jodiye.'),
      w3('rl1.VCC', 'rail:tp', 'Its + (VCC) to the + rail: its coil needs 5 V.', 'इसका + (VCC) + रेल से: इसकी कॉइल को 5 V चाहिए।', 'Iska + (VCC) + rail se: iski coil ko 5 V chahiye.'),
      w3('rl1.GND', 'rail:tn', 'Its − (GND) to the − rail.', 'इसका − (GND) − रेल से।', 'Iska − (GND) − rail se.'),
      CHECK,
      RUN(t3('"WATER ATM Rs 2 / Tap your card" on the LCD.', 'एलसीडी पर "WATER ATM Rs 2 / Tap your card"।', 'LCD par "WATER ATM Rs 2 / Tap your card".')),
      { k: 'act', until: (S) => fresh(S) && S.w('poured'), do: t3('Tap the white card on the reader (in the panel) and watch the glass.', 'सफ़ेद कार्ड रीडर पर लगाइए (पैनल में) और गिलास देखिए।', 'Safed card reader par lagaiye (panel mein) aur glass dekhiye.'),
        see: live((lg, R) => (R.last === undefined ? '' : pick(lg, `Your glass got ${R.last} mL in 4 s: about ${Math.round(R.last / 4)} mL a second. A glass is ${GLASS.full} mL, so the customer paid for a full glass and got ${R.last < GLASS.lo ? 'much less' : 'it'}.`, `आपके गिलास में 4 s में ${R.last} mL आया: लगभग ${Math.round(R.last / 4)} mL हर सेकंड। गिलास ${GLASS.full} mL का है, यानी ग्राहक ने पूरे गिलास के पैसे दिए और ${R.last < GLASS.lo ? 'काफ़ी कम' : 'उतना'} पाया।`, `Aapke glass mein 4 s mein ${R.last} mL aaya: lagbhag ${Math.round(R.last / 4)} mL har second. Glass ${GLASS.full} mL ka hai, yaani customer ne poore glass ke paise diye aur ${R.last < GLASS.lo ? 'kaafi kam' : 'utna'} paaya.`))) },
      { k: 'edit', test: okMs, set: [[/unsigned long pourMs = 4000;/, 'unsigned long pourMs = 7600;']],
        do: t3('Calibrate it: the pump gives about 33 mL a second, and a glass is 250 mL: 250 ÷ 33 ≈ 7.6 s. Change pourMs = 4000 to 7600 and press Run.', 'इसे कैलिब्रेट कीजिए: पंप हर सेकंड लगभग 33 mL देता है, और गिलास 250 mL का है: 250 ÷ 33 ≈ 7.6 s। pourMs = 4000 को 7600 कीजिए और "चलाइए" दबाइए।', 'Ise calibrate kijiye: pump har second lagbhag 33 mL deta hai, aur glass 250 mL ka hai: 250 ÷ 33 ≈ 7.6 s. pourMs = 4000 ko 7600 kijiye aur Run dabaiye.'), see: E },
      { k: 'act', until: (S) => fresh(S) && S.w('full'), do: t3('Tap the white card again.', 'सफ़ेद कार्ड फिर से लगाइए।', 'Safed card phir se lagaiye.'),
        see: live((lg, R) => (R.last === undefined ? '' : pick(lg, `${R.last} mL: a full glass. Real water ATMs are calibrated just like this, and checked by an inspector with a measuring jug.`, `${R.last} mL: पूरा गिलास। असली वॉटर एटीएम भी ऐसे ही कैलिब्रेट होते हैं, और इंस्पेक्टर नापने वाले जग से जाँचता है।`, `${R.last} mL: poora glass. Asli water ATM bhi aise hi calibrate hote hain, aur inspector naapne wale jug se jaanchta hai.`))) },
      { k: 'act', until: (S) => fresh(S) && S.w('refused'), do: t3('Now the blue tag: it has only Rs 3. Tap it once, wait for its glass, then tap it again.', 'अब नीला टैग: इस पर सिर्फ़ Rs 3 हैं। इसे एक बार लगाइए, गिलास भरने दीजिए, फिर दोबारा लगाइए।', 'Ab neela tag: is par sirf Rs 3 hain. Ise ek baar lagaiye, glass bharne dijiye, phir dobara lagaiye.'),
        see: live((lg, R) => pick(lg, `The first glass left Rs ${R.bal && R.bal.tag !== undefined ? R.bal.tag : 1}; the second tap is refused ("Low balance") and the pump stays off. The machine never gives water it was not paid for, and never takes money for water it did not give.`, `पहले गिलास के बाद Rs ${R.bal && R.bal.tag !== undefined ? R.bal.tag : 1} बचे; दूसरी बार मना ("Low balance") और पंप बंद रहता है। मशीन बिना पैसे पानी नहीं देती, और बिना पानी दिए पैसे नहीं काटती।`, `Pehle glass ke baad Rs ${R.bal && R.bal.tag !== undefined ? R.bal.tag : 1} bache; doosri baar mana ("Low balance") aur pump band rehta hai. Machine bina paise paani nahi deti, aur bina paani diye paise nahi kaatti.`)) },
    ],
    check: [...rails, has('rl1', t3('relay', 'रिले', 'relay')), need('rl1.S', 'D4', W.toPin, { x: t3('relay\'s S', 'रिले का S', 'relay ka S'), p: 4 }), need('rl1.VCC', '5V', W.to5v, { x: t3('relay\'s +', 'रिले का +', 'relay ka +') }), need('rl1.GND', 'GND', W.toGnd, { x: t3('relay\'s −', 'रिले का −', 'relay ka −') })],
    done: (S) => S.w('full') && S.w('refused') });
  // 2 ------------------------------------------------------------------------------------------- rotary vending machine
  const KP = [['R1', 9], ['R2', 8], ['R3', 7], ['R4', 6], ['C1', 5], ['C2', 4], ['C3', 3], ['C4', 2]];
  const STP = [['IN1', 10], ['IN2', 11], ['IN3', 12], ['IN4', 13]];
  const okSlot = (src) => /int\s+stepsPerSlot\s*=\s*(341|2048\s*\/\s*6)\s*;/.test(src || '');
  const okShort = (src) => /if\s*\(\s*moveSlots\s*>\s*3\s*\)\s*moveSlots\s*-=\s*6\s*;/.test(src || '') && /if\s*\(\s*moveSlots\s*<\s*-\s*3\s*\)\s*moveSlots\s*\+=\s*6\s*;/.test(src || '');
  const moves = (R) => (R.moves || []).map((d) => Math.round(d) + '°').join(', ');
  L.push({ id: 'vending', cls: '11', blocks: false, view: 'wide', rview: 'scene3', code: VENDC, drawer: ['stepper'], serial: true, scene: { kind: 'vend' },
    title: t3('Vending machine model', 'वेंडिंग मशीन मॉडल', 'Vending machine model'),
    goal: t3('A rotary vending machine: choose an item on the keypad, and a stepper turns the tray until that compartment is at the door. Measure how far a compartment really is, then make the tray take the short way round.', 'घूमने वाली वेंडिंग मशीन: कीपैड पर चीज़ चुनिए, और स्टेपर ट्रे को तब तक घुमाता है जब तक वह खाना दरवाज़े पर न आ जाए। नापिए कि एक खाना असल में कितना दूर है, फिर ट्रे को छोटे रास्ते से घुमाइए।', 'Ghoomne wali vending machine: keypad par cheez chuniye, aur stepper tray ko tab tak ghumata hai jab tak woh khaana darwaze par na aa jaaye. Naapiye ki ek khaana asal mein kitna door hai, phir tray ko chhote raaste se ghumaiye.'),
    setup: { parts: [F('kp', 'keypad', {}, 60, 165, 0), F('lcd', 'lcd16', {}, -128, 66, 0)],
      wires: [...POWER, ...KP.map(([id, pin]) => ['T:kp:' + id, 'D' + pin]), ['T:lcd:GND', 'H:bn10'], ['T:lcd:VCC', 'H:bp10'], ['T:lcd:SDA', 'A4'], ['T:lcd:SCL', 'A5']] },
    steps: [
      { k: 'info', do: t3('Snack machines in offices and stations bring the chosen item to one door. Here a round tray holds six items, 60° apart, and the 28BYJ-48 stepper under it turns exactly as many steps as it is told. The keypad (pins 2–9) and the LCD (I2C) are already wired.', 'दफ़्तरों और स्टेशनों की स्नैक मशीनें चुनी हुई चीज़ को एक दरवाज़े तक लाती हैं। यहाँ एक गोल ट्रे में छह चीज़ें हैं, 60° की दूरी पर, और इसके नीचे 28BYJ-48 स्टेपर ठीक उतने क़दम घूमता है जितने कहे जाएँ। कीपैड (पिन 2–9) और एलसीडी (I2C) पहले से लगे हैं।', 'Daftar aur station ki snack machine chuni hui cheez ko ek darwaze tak laati hain. Yahan ek gol tray mein chhah cheezein hain, 60° ki doori par, aur iske neeche 28BYJ-48 stepper theek utne kadam ghoomta hai jitne kahe jaayein. Keypad (pin 2–9) aur LCD (I2C) pehle se lage hain.'), see: E },
      { k: 'place', place: F('st', 'stepper', {}, -66, 150, 0), do: t3('Put the stepper\'s driver board on the mat at the ghost (the motor under the tray is plugged into it).', 'स्टेपर के ड्राइवर बोर्ड को मैट पर नीली आकृति पर रखिए (ट्रे के नीचे की मोटर इसमें लगी है)।', 'Stepper ke driver board ko mat par neeli shape par rakhiye (tray ke neeche ki motor ismein lagi hai).'), see: E },
      ...STP.map(([id, pin]) => w3('st.' + id, 'D' + pin, `Wire ${id} to pin ${pin}.`, `${id} को पिन ${pin} से जोड़िए।`, `${id} ko pin ${pin} se jodiye.`)),
      w3('st.GND', 'rail:bn', 'Its − pin to the front − rail.', 'इसका − पिन आगे वाली − रेल से।', 'Iska − pin aage wali − rail se.'),
      w3('st.VCC', 'rail:bp', 'Its + pin to the front + rail.', 'इसका + पिन आगे वाली + रेल से।', 'Iska + pin aage wali + rail se.'),
      CHECK,
      RUN(t3('"Choose 1-6 + #" on the LCD. Compartment 1 is at the door.', 'एलसीडी पर "Choose 1-6 + #"। खाना 1 दरवाज़े पर है।', 'LCD par "Choose 1-6 + #". Khaana 1 darwaze par hai.')),
      { k: 'act', until: (S) => fresh(S) && S.w('jam'), do: t3('Buy the juice: press 3, then # (on the keypad panel).', 'जूस ख़रीदिए: 3 दबाइए, फिर # (कीपैड पैनल पर)।', 'Juice khareediye: 3 dabaiye, phir # (keypad panel par).'),
        see: live((lg, R) => (R.jamAt === undefined ? '' : pick(lg, `The tray stopped at ${R.jamAt}°, between two doors: nothing can come out. Compartment 3 is at 120°, and 600 steps × 360° ÷ 2048 = 105°: 300 was only a guess.`, `ट्रे ${R.jamAt}° पर रुकी, दो खानों के बीच: कुछ बाहर नहीं आ सकता। खाना 3, 120° पर है, और 600 क़दम × 360° ÷ 2048 = 105°: 300 बस एक अंदाज़ा था।`, `Tray ${R.jamAt}° par ruki, do khaanon ke beech: kuch bahar nahi aa sakta. Khaana 3, 120° par hai, aur 600 kadam × 360° ÷ 2048 = 105°: 300 bas ek andaaza tha.`))) },
      { k: 'edit', test: okSlot, set: [[/int stepsPerSlot = 300;/, 'int stepsPerSlot = 341;']], do: t3('One turn is 2048 steps and there are 6 compartments: 2048 ÷ 6 = 341.3. Change stepsPerSlot = 300 to 341 and press Run (the tray starts again with compartment 1 at the door).', 'एक चक्कर 2048 क़दम का है और खाने 6 हैं: 2048 ÷ 6 = 341.3। stepsPerSlot = 300 को 341 कीजिए और "चलाइए" दबाइए (ट्रे फिर से खाना 1 को दरवाज़े पर रखकर शुरू होती है)।', 'Ek chakkar 2048 kadam ka hai aur khaane 6 hain: 2048 ÷ 6 = 341.3. stepsPerSlot = 300 ko 341 kijiye aur Run dabaiye (tray phir se khaana 1 ko darwaze par rakh kar shuru hoti hai).'), see: E },
      { k: 'act', until: (S) => fresh(S) && S.w('served3'), do: t3('Buy the juice again: 3, then #.', 'फिर से जूस ख़रीदिए: 3, फिर #।', 'Phir se juice khareediye: 3, phir #.'),
        see: live((lg, R) => (!R.last ? '' : pick(lg, `${R.last.at}°: the juice is at the door. 682 steps are 119.9°; the 0.1° left over is far too small to matter.`, `${R.last.at}°: जूस दरवाज़े पर है। 682 क़दम = 119.9°; बचा 0.1° कोई मायने नहीं रखता।`, `${R.last.at}°: juice darwaze par hai. 682 kadam = 119.9°; bacha 0.1° koi maayne nahi rakhta.`))) },
      { k: 'act', until: (S) => fresh(S) && S.w('longway'), do: t3('Now water (6, then #), and then chips (1, then #). Watch which way the tray goes for the chips.', 'अब पानी (6, फिर #), फिर चिप्स (1, फिर #)। देखिए चिप्स के लिए ट्रे किधर घूमती है।', 'Ab paani (6, phir #), phir chips (1, phir #). Dekhiye chips ke liye tray kidhar ghoomti hai.'),
        see: live((lg, R) => pick(lg, `Your moves: ${moves(R)}. From 6 to 1 it went all the way back, 300°, though 1 is just one compartment past 6: on a round tray the short way is the other way round.`, `आपकी चालें: ${moves(R)}। 6 से 1 तक यह पूरा पीछे गई, 300°, जबकि 1, 6 से बस एक खाना आगे है: गोल ट्रे पर छोटा रास्ता दूसरी तरफ़ है।`, `Aapki chaalein: ${moves(R)}. 6 se 1 tak yeh poora peeche gayi, 300°, jabki 1, 6 se bas ek khaana aage hai: gol tray par chhota raasta doosri taraf hai.`)) },
      { k: 'edit', test: okShort, set: [[/(    int moveSlots = item - pos;[^\n]*\n)/, '$1    if (moveSlots > 3) moveSlots -= 6;   // more than half way round: go the other way\n    if (moveSlots < -3) moveSlots += 6;\n']],
        do: t3('Take the short way: under int moveSlots = item - pos; add\n    if (moveSlots > 3) moveSlots -= 6;\n    if (moveSlots < -3) moveSlots += 6;\nand press Run.', 'छोटा रास्ता लीजिए: int moveSlots = item - pos; के नीचे लिखिए\n    if (moveSlots > 3) moveSlots -= 6;\n    if (moveSlots < -3) moveSlots += 6;\nऔर "चलाइए" दबाइए।', 'Chhota raasta lijiye: int moveSlots = item - pos; ke neeche likhiye\n    if (moveSlots > 3) moveSlots -= 6;\n    if (moveSlots < -3) moveSlots += 6;\naur Run dabaiye.'), see: E },
      { k: 'act', until: (S) => fresh(S) && S.w('shortway'), do: t3('Again: water (6, #), then chips (1, #).', 'फिर से: पानी (6, #), फिर चिप्स (1, #)।', 'Phir se: paani (6, #), phir chips (1, #).'),
        see: live((lg, R) => pick(lg, `Your moves: ${moves(R)}. From 6 to 1 now takes 60° forward instead of 300° back: five times quicker, and less wear on the gears. Lifts, robot arms and satellite dishes all choose the shorter way like this.`, `आपकी चालें: ${moves(R)}। 6 से 1 अब 300° पीछे की जगह 60° आगे: पाँच गुना जल्दी, और गियर कम घिसते हैं। लिफ़्ट, रोबोट बाँह और सैटेलाइट डिश सब ऐसे ही छोटा रास्ता चुनते हैं।`, `Aapki chaalein: ${moves(R)}. 6 se 1 ab 300° peeche ki jagah 60° aage: paanch guna jaldi, aur gear kam ghiste hain. Lift, robot arm aur satellite dish sab aise hi chhota raasta chunte hain.`)) },
    ],
    check: [...rails, has('st', t3('stepper driver', 'स्टेपर ड्राइवर', 'stepper driver')), ...STP.map(([id, pin]) => need('st.' + id, 'D' + pin, W.toPin, { x: id, p: pin })), need('st.GND', 'GND', W.toGnd, { x: t3('driver\'s −', 'ड्राइवर का −', 'driver ka −') }), need('st.VCC', '5V', W.to5v, { x: t3('driver\'s +', 'ड्राइवर का +', 'driver ka +') })],
    done: (S) => S.w('shortway') });
  for (const l of L) { l.n = ++n; l.batch = 24; if (l.scene) l.world = l.scene; } // (the lesson runtime asks the "world": worlds3.js makes it from the scene)
  return L;
}
