// DUET Robotics Lab 360, batch 24: Class 11 machine sessions, written fresh for DUET (same shape as lessons.js).
//   wateratm   a water ATM (an RO kiosk, as in Indian villages and railway stations): tap an RFID card, the pump pours
//              one glass through a relay, and the price comes off that card's balance (scenes3.js AtmScene measures the
//              glass). The reader, the LCD and the pump with its battery are already wired; the student wires the relay.
//              The first program runs the pump 4 s: the glass is about half full (≈ 130 mL of 250), so the student
//              works out the pump's rate (≈ 33 mL a second) and calibrates pourMs (≈ 7600 ms). Then the blue tag, with
//              only Rs 3 on it, buys one glass and is refused the next ("Low balance"), with nothing poured.
// The helpers (t3, P, F, W, need, has, noShort) come from lessons.js. devtools/test/robocore24.mjs plays them end to end.
import { GLASS, CUR } from './scenes3.js';

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
  for (const l of L) { l.n = ++n; l.batch = 24; if (l.scene) l.world = l.scene; } // (the lesson runtime asks the "world": worlds3.js makes it from the scene)
  return L;
}
