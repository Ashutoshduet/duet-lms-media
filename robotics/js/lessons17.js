// DUET Robotics Lab 360, batch 17: Class 9 sessions, written fresh for DUET (same shape as lessons.js):
//   pico_keylock   a password lock on the Raspberry Pi Pico in MicroPython: the 4×4 keypad is scanned by our own code
//                  (one row HIGH at a time, the columns pulled down), the servo latch by PWM at 50 Hz, a buzzer;
//                  the password is shown as stars, and three wrong tries lock the keypad for 10 seconds
//   pico_gasalarm  an MQ-2 gas alarm on the Pico: the sensor runs on 5 V, so its AO goes through a 10 kΩ / 20 kΩ divider
//                  to GP26; the heater warms up first; two limits (alarm and safe) so the alarm does not flicker
//   smarttank      a rooftop water tank on the Uno: the HC-SR04 in the lid, the pump through a relay, low / high limits, and
//                  dry-run protection (the level must rise within 5 s, or the pump stops and the alarm sounds)
//   banklocker     a bank locker on the Uno with two factors: the owner's RFID card AND a PIN on the keypad (rows on
//                  A0–A3, because the reader's SPI takes pins 9–13); "Card first!", an unknown card, three wrong PINs
// The helpers (t3, P, F, W, need, has, noShort) come from lessons.js; scenes3.js runs the locker / kitchen / bank scenes.
// devtools/test/robocore17.mjs plays all three end to end.
import { CUR } from './scenes3.js';

const t3 = (en, hi, hg) => ({ en, hi, hg });
const pick = (lg, en, hi, hg) => (lg === 'hi' ? hi : lg === 'hg' ? hg : en);
const RT = { S: null }; // the lesson runtime that is playing now (each lesson's tick sets it)
function live(f) { const o = {}; for (const lg of ['en', 'hi', 'hg']) Object.defineProperty(o, lg, { enumerable: true, get: () => { try { return String(f(lg, (CUR.sim && CUR.sim.res) || {}, RT.S) || ''); } catch (e) { return ''; } } }); return o; }

// ------------------------------------------------------------------ the programs
const PLOCK = `# Password lock on the Pico: a 4x4 keypad, a servo latch and a buzzer.
# Type the password and # to open. Three wrong tries lock the keypad for 10 seconds.
from machine import Pin, PWM
import time

KEYS = ["123A", "456B", "789C", "*0#D"]
rows = [Pin(p, Pin.OUT) for p in (6, 7, 8, 9)]                     # R1-R4
cols = [Pin(p, Pin.IN, Pin.PULL_DOWN) for p in (10, 11, 12, 13)]   # C1-C4

servo = PWM(Pin(15))
servo.freq(50)                  # a servo wants one pulse every 20 ms
buzzer = PWM(Pin(18))

PASSWORD = "1234"
typed = ""
wrong = 0

def latch(angle):               # 0 = locked, 90 = open
    servo.duty_u16(int(1638 + angle * 6553 / 180))   # a pulse of 0.5 ms to 2.5 ms

def beep(freq, ms):
    buzzer.freq(freq)
    buzzer.duty_u16(32768)
    time.sleep_ms(ms)
    buzzer.duty_u16(0)

def get_key():                  # one row HIGH at a time: which column goes HIGH with it?
    for r in range(4):
        rows[r].value(1)
        for c in range(4):
            if cols[c].value() == 1:
                rows[r].value(0)
                return KEYS[r][c]
        rows[r].value(0)
    return None

latch(0)
print("Type the password and #")
while True:
    key = get_key()
    if key is None:
        time.sleep_ms(20)
        continue
    beep(1800, 40)
    while get_key() == key:     # wait until the key is let go
        time.sleep_ms(10)
    if key == "#":
        if typed == PASSWORD:
            print("Open!")
            wrong = 0
            latch(90)
            time.sleep(4)
            latch(0)
        else:
            wrong += 1
            print("Wrong password", wrong)
            beep(300, 800)
            if wrong >= 3:
                print("Locked for 10 s")
                for i in range(10):
                    beep(2500, 300)
                    time.sleep_ms(700)
                wrong = 0
        typed = ""
    elif key == "*":
        typed = ""
    else:
        typed += key
        print("*" * len(typed))   # stars, not the password
`;
const PGAS = `# Gas leak alarm on the Pico: an MQ-2 smells LPG; the red LED and the buzzer warn.
# The MQ-2 runs on 5 V, so its AO can rise above 3.3 V: a divider (10 k and 20 k)
# gives GP26 two thirds of it. 5 V x 20 / 30 = 3.33 V at most.
from machine import Pin, PWM, ADC
import time

gas = ADC(26)                   # GP26: 0 to 65535
led = Pin(15, Pin.OUT)
buzzer = PWM(Pin(18))
buzzer.freq(2500)
ALARM = 20000                   # above this: gas!
SAFE = 12000                    # below this: safe again (the gap stops flickering)
alarm = False

print("Warming up the sensor...")
time.sleep(20)                  # the heater needs time (a new MQ-2: a day, then a few minutes each time)
print("Ready")

while True:
    v = gas.read_u16()
    if v > ALARM:
        alarm = True
    elif v < SAFE:
        alarm = False
    led.value(1 if alarm else 0)
    buzzer.duty_u16(32768 if alarm else 0)
    print("Gas", v, "ALARM" if alarm else "ok")
    time.sleep(0.5)
`;
const BANK = `// Bank locker: two keys open it, the owner's card AND the PIN (two-factor)
#include <SPI.h>
#include <MFRC522.h>
#include <Keypad.h>
#include <Servo.h>

MFRC522 rfid(10, 9);               // SDA (SS) on pin 10, RST on pin 9
const byte ROWS = 4;
const byte COLS = 4;
char keys[ROWS][COLS] = {
  {'1', '2', '3', 'A'},
  {'4', '5', '6', 'B'},
  {'7', '8', '9', 'C'},
  {'*', '0', '#', 'D'}
};
byte rowPins[ROWS] = {A0, A1, A2, A3};   // pins 9-13 belong to the RFID reader (SPI)
byte colPins[COLS] = {5, 4, 3, 2};
Keypad keypad = Keypad(makeKeymap(keys), rowPins, colPins, ROWS, COLS);
Servo door;
const int buzzer = 8;

String owner = "A3 4F 1C 2D";      // factor 1: something you have (the card)
String pin = "4321";               // factor 2: something you know (the PIN)
bool cardOk = false;
unsigned long cardTime = 0;
String typed = "";
int wrong = 0;

void setup() {
  Serial.begin(9600);
  SPI.begin();
  rfid.PCD_Init();
  door.attach(6);
  door.write(0);                   // locked
  Serial.println("Show your card");
}

void loop() {
  if (rfid.PICC_IsNewCardPresent() && rfid.PICC_ReadCardSerial()) {
    String uid = "";
    for (byte i = 0; i < rfid.uid.size; i++) {
      if (rfid.uid.uidByte[i] < 0x10) uid += "0";
      uid += String(rfid.uid.uidByte[i], HEX);
      if (i < rfid.uid.size - 1) uid += " ";
    }
    uid.toUpperCase();
    rfid.PICC_HaltA();
    if (uid == owner) {
      cardOk = true;
      cardTime = millis();
      typed = "";
      Serial.println("Card OK. Now type your PIN and #");
      tone(buzzer, 2000, 100);
    } else {
      Serial.print("Unknown card ");
      Serial.println(uid);
      tone(buzzer, 300, 800);
    }
  }
  if (cardOk && millis() - cardTime > 15000) {   // 15 s to type the PIN
    cardOk = false;
    Serial.println("Too slow: show your card again");
  }

  char key = keypad.getKey();
  if (key) {
    tone(buzzer, 1800, 40);
    if (!cardOk) {
      Serial.println("Card first!");
      return;
    }
    if (key == '#') {
      if (typed == pin) {
        Serial.println("Open!");
        wrong = 0;
        door.write(90);
        delay(4000);
        door.write(0);
      } else {
        wrong++;
        Serial.print("Wrong PIN ");
        Serial.println(wrong);
        tone(buzzer, 300, 800);
        if (wrong >= 3) {
          Serial.println("ALARM! Locker blocked");
          for (int i = 0; i < 10; i++) {
            tone(buzzer, 2500, 300);
            delay(600);
          }
          wrong = 0;
        }
      }
      cardOk = false;
      typed = "";
    } else if (key == '*') {
      typed = "";
    } else {
      typed += key;
    }
  }
}
`;
const TANKC = `// Smart water tank: the ultrasonic sensor in the lid measures the air above the water.
// The pump fills the tank when it is low and stops when it is full; if the sump is empty,
// the water does not rise, so it stops the pump (a dry pump burns out) and sounds the alarm.
const int trig = 9, echo = 10;
const int relay = 7;            // the pump's relay
const int buzzer = 8;
const int depth = 108;          // cm from the sensor down to the tank's floor (100 cm of tank + 8 cm)
int low = 30;                   // % : start the pump below this
int high = 90;                  // % : stop it above this
bool pumping = false;
int startLevel = 0;
unsigned long checkTime = 0;
unsigned long retryAt = 0;

int readLevel() {
  digitalWrite(trig, LOW);
  delayMicroseconds(2);
  digitalWrite(trig, HIGH);      // a 10 us ping
  delayMicroseconds(10);
  digitalWrite(trig, LOW);
  long us = pulseIn(echo, HIGH, 30000);
  int cm = us / 58;              // the air above the water
  return constrain(depth - cm, 0, 100);   // 100 cm deep: 1 cm of water = 1 %
}

void setup() {
  pinMode(trig, OUTPUT);
  pinMode(echo, INPUT);
  pinMode(relay, OUTPUT);
  Serial.begin(9600);
}

void loop() {
  int level = readLevel();
  Serial.print("Level ");
  Serial.print(level);
  Serial.println(" %");
  if (!pumping && level < low && millis() > retryAt) {
    pumping = true;
    startLevel = level;
    checkTime = millis();
    digitalWrite(relay, HIGH);
    Serial.println("Pump ON");
  }
  if (pumping && level > high) {
    pumping = false;
    digitalWrite(relay, LOW);
    Serial.println("Pump OFF: tank full");
  }
  if (pumping && millis() - checkTime > 5000) {   // every 5 s: has the water risen?
    if (level <= startLevel) {                    // no: the sump is empty
      pumping = false;
      digitalWrite(relay, LOW);
      Serial.println("DRY RUN! Pump stopped, trying again in 20 s");
      for (int i = 0; i < 5; i++) {
        tone(buzzer, 2500, 300);
        delay(500);
      }
      retryAt = millis() + 20000;
    }
    startLevel = level;
    checkTime = millis();
  }
  delay(500);
}
`;
export const BATCH17_CODE = { PLOCK, PGAS, BANK, TANKC };

export function batch17(K, n0) {
  const { P, F, W, need, has, noShort } = K;
  const E = t3('', '', '');
  const CHECK = { k: 'check', do: t3('Check your circuit.', 'अपना सर्किट जाँचिए।', 'Apna circuit check karo.'), see: E };
  const RUN = (see) => ({ k: 'run', do: t3('Press Run.', '"चलाइए" दबाइए।', 'Run dabaiye.'), see: see || E });
  const w3 = (tag, pin, to, en, hi, hg, see) => ({ k: 'wire', wire: [tag + '.' + pin, to], do: t3(en, hi, hg), see: see || E });
  const fresh = (S) => S.runSrc !== null && S.t - (S.freshAt || 0) > 0.3;
  const lineSeen = (S, re) => (S.serLines || []).some((l) => re.test(l));
  const X = {
    kpPico: t3('The keypad\'s 8 wires go in order: R1–R4 to GP6–GP9 and C1–C4 to GP10–GP13. In the wrong order, the keys come out wrong.', 'कीपैड के 8 तार क्रम से: R1–R4, GP6–GP9 पर और C1–C4, GP10–GP13 पर। ग़लत क्रम में बटन ग़लत निकलते हैं।', 'Keypad ke 8 wire kram se: R1–R4, GP6–GP9 par aur C1–C4, GP10–GP13 par. Galat kram mein keys galat nikalti hain.'),
    kpBank: t3('The keypad\'s 8 wires: R1–R4 to A0–A3 and C1–C4 to pins 5, 4, 3, 2.', 'कीपैड के 8 तार: R1–R4, A0–A3 पर और C1–C4 पिन 5, 4, 3, 2 पर।', 'Keypad ke 8 wire: R1–R4, A0–A3 par aur C1–C4 pin 5, 4, 3, 2 par.'),
    mqDirect: t3('AO goes straight to GP26: with a lot of gas it rises above 3.3 V, more than a Pico pin can take. Put the divider in: AO → 10 kΩ → the middle → 20 kΩ → GND, and GP26 to the middle.', 'AO सीधे GP26 पर है: बहुत गैस में यह 3.3 V से ऊपर जाता है, जितना Pico का पिन नहीं सहता। डिवाइडर लगाइए: AO → 10 kΩ → बीच → 20 kΩ → GND, और GP26 बीच से।', 'AO seedhe GP26 par hai: bahut gas mein yeh 3.3 V se upar jaata hai, jitna Pico ka pin nahi sehta. Divider lagaiye: AO → 10 kΩ → beech → 20 kΩ → GND, aur GP26 beech se.'),
    mqDiv: t3('The divider is not right yet: AO → 10 kΩ → the middle → 20 kΩ → the − rail, and GP26 to the middle.', 'डिवाइडर अभी ठीक नहीं: AO → 10 kΩ → बीच → 20 kΩ → − रेल, और GP26 बीच से।', 'Divider abhi theek nahi: AO → 10 kΩ → beech → 20 kΩ → − rail, aur GP26 beech se.'),
    mqPow: t3('The MQ-2 needs 5 V for its heater: VCC to the back + rail (VBUS), GND to the back − rail.', 'MQ-2 के हीटर को 5 V चाहिए: VCC पीछे वाली + रेल (VBUS) पर, GND पीछे वाली − रेल पर।', 'MQ-2 ke heater ko 5 V chahiye: VCC peeche wali + rail (VBUS) par, GND peeche wali − rail par.'),
    rfid5v: t3('The RC522 is joined to 5V: it is a 3.3 V chip and would be damaged. Move its 3.3V pin to the Arduino\'s 3.3V.', 'RC522 को 5V मिल रहा है: यह 3.3 V की चिप है और ख़राब हो जाएगी। इसका 3.3V पिन Arduino के 3.3V पर लगाइए।', 'RC522 ko 5V mil raha hai: yeh 3.3 V ki chip hai aur kharab ho jaayegi. Iska 3.3V pin Arduino ke 3.3V par lagaiye.'),
  };
  const KP = t3('keypad', 'कीपैड', 'keypad');
  let n = n0;
  const L = [];

  // 1 ---------------------------------------------------------------------------------------------- Pico password lock
  const PICO_POWER = [['H:a2', 'H:tp1'], ['H:a4', 'H:tn3'], ['H:j19', 'H:bn15']]; // VBUS → back + (5 V), GND → back −, GND → front −
  const PKP = [['R1', 6], ['R2', 7], ['R3', 8], ['R4', 9], ['C1', 10], ['C2', 11], ['C3', 12], ['C4', 13]];
  L.push({ id: 'pico_keylock', board: 'pico', cls: '9', blocks: false, view: 'wide', rview: 'scene3', code: PLOCK, drawer: ['keypad'], serial: true, scene: { kind: 'locker' },
    title: t3('Password lock on the Pico', 'Pico पर पासवर्ड लॉक', 'Pico par password lock'),
    goal: t3('A locker that opens for the right password, in MicroPython. No keypad library here: your own code scans the 16 keys, drives the servo latch with PWM, hides the password as stars and locks out a thief after three wrong tries.', 'सही पासवर्ड पर खुलने वाला लॉकर, MicroPython में। यहाँ कोई कीपैड लाइब्रेरी नहीं: आपका अपना कोड 16 बटन स्कैन करता है, PWM से सर्वो की कुंडी चलाता है, पासवर्ड को सितारों में छिपाता है और तीन ग़लत कोशिशों के बाद चोर को रोक देता है।', 'Sahi password par khulne wala locker, MicroPython mein. Yahan koi keypad library nahi: aapka apna code 16 keys scan karta hai, PWM se servo ki kundi chalata hai, password ko sitaaron mein chhupata hai aur teen galat koshishon ke baad chor ko rok deta hai.'),
    setup: { parts: [F('sv1', 'servo', { mount: 'lock' }, 178, 70, 1), P('bz1', 'buzzer', {}, 'e30', 0)],
      wires: [...PICO_POWER, ['T:sv1:GND', 'H:tn40'], ['T:sv1:VP', 'H:tp40'], ['T:sv1:SIG', 'H:j21'], ['H:b18', 'H:a30'], ['H:a33', 'H:tn27']] },
    steps: [
      { k: 'info', do: t3('Ready on the bench: the locker\'s servo latch (signal on GP15, power from VBUS, 5 V) and a buzzer on GP18. Your job: the keypad. Its 16 keys need only 8 wires, 4 rows and 4 columns.', 'बेंच पर तैयार: लॉकर की सर्वो कुंडी (सिग्नल GP15 पर, पावर VBUS से, 5 V) और GP18 पर एक बज़र। आपका काम: कीपैड। इसके 16 बटन को सिर्फ़ 8 तार चाहिए, 4 पंक्तियाँ और 4 कॉलम।', 'Bench par taiyaar: locker ki servo kundi (signal GP15 par, power VBUS se, 5 V) aur GP18 par ek buzzer. Aapka kaam: keypad. Iske 16 keys ko sirf 8 wire chahiye, 4 rows aur 4 columns.'), see: E },
      { k: 'place', place: F('kp', 'keypad', {}, -40, 165, 0), do: t3('Put the keypad on the mat at the ghost.', 'कीपैड को मैट पर नीली आकृति पर रखिए।', 'Keypad ko mat par neeli shape par rakhiye.'), see: E },
      ...PKP.map(([id, gp], i) => w3('kp', id, 'GP' + gp, `Wire its pin ${i + 1} (${id}) to GP${gp}.`, `इसका पिन ${i + 1} (${id}) GP${gp} से जोड़िए।`, `Iska pin ${i + 1} (${id}) GP${gp} se jodiye.`,
        i === 7 ? t3('GP6–GP13 sit side by side along the Pico\'s front edge, with a GND between them: count the pins on the board\'s labels.', 'GP6–GP13 Pico के आगे वाले किनारे पर एक साथ हैं, बीच में एक GND: बोर्ड के लेबल पर पिन गिनिए।', 'GP6–GP13 Pico ke aage wale kinare par saath-saath hain, beech mein ek GND: board ke label par pin giniye.') : null)),
      CHECK,
      { k: 'info', code: [24, 32], do: t3('Read get_key(): it sets one row HIGH, looks at the four columns (each pulled down to 0 inside the Pico), and sets the row LOW again. A pressed key joins its row to its column, so that column reads 1: row and column name the key.', 'get_key() पढ़िए: यह एक पंक्ति को HIGH करता है, चारों कॉलम देखता है (हर एक Pico के अंदर 0 पर खिंचा है), और पंक्ति को फिर LOW करता है। दबा हुआ बटन अपनी पंक्ति को अपने कॉलम से जोड़ता है, तो वह कॉलम 1 पढ़ता है: पंक्ति और कॉलम बटन बताते हैं।', 'get_key() padhiye: yeh ek row ko HIGH karta hai, chaaron columns dekhta hai (har ek Pico ke andar 0 par khincha hai), aur row ko phir LOW karta hai. Daba hua key apni row ko apne column se jodta hai, to woh column 1 padhta hai: row aur column key batate hain.'),
        see: t3('A library would do the same in its getKey(). Here you can see every step.', 'लाइब्रेरी अपने getKey() में यही करती है। यहाँ आप हर क़दम देख सकते हैं।', 'Library apne getKey() mein yahi karti hai. Yahan aap har kadam dekh sakte hain.') },
      RUN(t3('"Type the password and #" on the Serial Monitor.', 'सीरियल मॉनिटर पर "Type the password and #"।', 'Serial Monitor par "Type the password and #".')),
      { k: 'act', until: (S) => S.w('opened'), do: t3('In the locker panel, type 1 2 3 4 and #.', 'लॉकर के पैनल में 1 2 3 4 और # दबाइए।', 'Locker ke panel mein 1 2 3 4 aur # dabaiye.'),
        see: t3('A star for each key (the password never shows), then "Open!": the latch turns to 90° for 4 seconds.', 'हर बटन पर एक सितारा (पासवर्ड कभी नहीं दिखता), फिर "Open!": कुंडी 4 सेकंड के लिए 90° घूमती है।', 'Har key par ek sitaara (password kabhi nahi dikhta), phir "Open!": kundi 4 second ke liye 90° ghoomti hai.') },
      { k: 'act', until: (S) => lineSeen(S, /Locked for 10 s/), do: t3('Now be the thief: type three wrong passwords, each ending with #.', 'अब चोर बनिए: तीन ग़लत पासवर्ड टाइप कीजिए, हर एक के आख़िर में #।', 'Ab chor baniye: teen galat password type kijiye, har ek ke aakhir mein #.'),
        see: t3('Three long beeps, then a siren and "Locked for 10 s": guessing 10,000 four-digit codes would now take more than a day. Phones and ATMs do the same.', 'तीन लंबी बीप, फिर सायरन और "Locked for 10 s": अब 10,000 चार अंकों के कोड आज़माने में एक दिन से ज़्यादा लगेगा। फ़ोन और एटीएम भी यही करते हैं।', 'Teen lambi beep, phir siren aur "Locked for 10 s": ab 10,000 chaar ankon ke code aazmane mein ek din se zyada lagega. Phone aur ATM bhi yahi karte hain.') },
      { k: 'edit', test: (src) => { const m = /PASSWORD\s*=\s*"([0-9A-D]{4,8})"/.exec(src); return !!m && m[1] !== '1234'; }, set: [[/PASSWORD = "1234"/, 'PASSWORD = "2580"']],
        do: t3('1234 is the first code a thief tries. Choose your own: change PASSWORD = "1234" to 4 to 8 keys (digits or A–D), for example "2580", and press Run.', '1234 चोर सबसे पहले आज़माता है। अपना चुनिए: PASSWORD = "1234" को 4 से 8 बटन (अंक या A–D) कीजिए, जैसे "2580", और "चलाइए" दबाइए।', '1234 chor sabse pehle aazmata hai. Apna chuniye: PASSWORD = "1234" ko 4 se 8 keys (digits ya A–D) karo, jaise "2580", aur Run dabaiye.'), see: E },
      { k: 'act', until: (S) => fresh(S) && S.w('opened'), do: t3('Open it with your new password.', 'नए पासवर्ड से इसे खोलिए।', 'Naye password se ise kholiye.'),
        see: live((lg, R) => (!R.code ? '' : pick(lg, `Your results: it opened for "${R.code}"${R.wrongCode !== undefined ? ' and refused "' + R.wrongCode + '"' : ''}. Your own scan, your own PWM, your own lockout: the same parts as a hotel safe.`, `आपके नतीजे: यह "${R.code}" पर खुला${R.wrongCode !== undefined ? ' और "' + R.wrongCode + '" को मना किया' : ''}। आपका अपना स्कैन, अपना PWM, अपना लॉकआउट: होटल की तिजोरी जैसे ही हिस्से।`, `Aapke results: yeh "${R.code}" par khula${R.wrongCode !== undefined ? ' aur "' + R.wrongCode + '" ko mana kiya' : ''}. Aapka apna scan, apna PWM, apna lockout: hotel ki tijori jaise hi hisse.`))) },
    ],
    check: [(S) => (S.conn('3V3', 'GND') || S.conn('VBUS', 'GND') ? [W.short] : null), has('kp', KP), ...PKP.map(([id, gp]) => (S) => (S.conn('kp.' + id, 'GP' + gp) ? null : [X.kpPico]))],
    done: (S) => /PASSWORD\s*=\s*"(?!1234")/.test(S.runSrc || '') && S.w('opened') });

  // 2 ---------------------------------------------------------------------------------------------- Pico gas alarm
  L.push({ id: 'pico_gasalarm', board: 'pico', cls: '9', blocks: false, view: 'wide', rview: 'scene3', code: PGAS, drawer: ['mq2', 'resistor'], serial: true, scene: { kind: 'kitchen' },
    title: t3('Gas leak alarm on the Pico', 'Pico पर गैस लीक अलार्म', 'Pico par gas leak alarm'),
    goal: t3('An MQ-2 smells LPG in the kitchen and the Pico sounds the alarm. The catch: the sensor works on 5 V and a Pico pin takes 3.3 V, so you build a voltage divider first.', 'MQ-2 रसोई में एलपीजी सूँघता है और Pico अलार्म बजाता है। पेच: सेंसर 5 V पर चलता है और Pico का पिन 3.3 V सहता है, इसलिए पहले आप वोल्टेज डिवाइडर बनाते हैं।', 'MQ-2 rasoi mein LPG soonghta hai aur Pico alarm bajata hai. Pech: sensor 5 V par chalta hai aur Pico ka pin 3.3 V sehta hai, isliye pehle aap voltage divider banate hain.'),
    setup: { parts: [P('led1', 'led', { color: 'red' }, 'f24', 0), P('r1', 'resistor', { ohms: 220 }, 'j24', 1), P('bz1', 'buzzer', {}, 'e30', 0)],
      wires: [...PICO_POWER, ['H:i21', 'H:i25'], ['H:b18', 'H:a30'], ['H:a33', 'H:tn27']] },
    steps: [
      { k: 'info', do: t3('Ready: a red LED on GP15 and a buzzer on GP18. The MQ-2\'s heater needs 5 V (VBUS, the back + rail) and its AO gives more volts for more gas: with a lot of LPG, more than 3.3 V.', 'तैयार: GP15 पर लाल एलईडी और GP18 पर बज़र। MQ-2 के हीटर को 5 V चाहिए (VBUS, पीछे वाली + रेल) और इसका AO ज़्यादा गैस पर ज़्यादा वोल्ट देता है: बहुत एलपीजी में 3.3 V से ज़्यादा।', 'Taiyaar: GP15 par laal LED aur GP18 par buzzer. MQ-2 ke heater ko 5 V chahiye (VBUS, peeche wali + rail) aur iska AO zyada gas par zyada volt deta hai: bahut LPG mein 3.3 V se zyada.'), see: E },
      { k: 'place', place: F('mq', 'mq2', {}, 160, 92, 0), do: t3('Put the MQ-2 on the mat at the ghost, near the kitchen.', 'MQ-2 को मैट पर नीली आकृति पर, रसोई के पास रखिए।', 'MQ-2 ko mat par neeli shape par, rasoi ke paas rakhiye.'), see: E },
      w3('mq', 'VCC', 'rail:tp', 'Wire its VCC to the back + rail (5 V from VBUS).', 'इसका VCC पीछे वाली + रेल (VBUS से 5 V) से जोड़िए।', 'Iska VCC peeche wali + rail (VBUS se 5 V) se jodiye.'),
      w3('mq', 'GND', 'rail:tn', 'Its GND to the back − rail.', 'इसका GND पीछे वाली − रेल से।', 'Iska GND peeche wali − rail se.'),
      { k: 'place', place: P('rd1', 'resistor', { ohms: 10000 }, 'g47', 2), do: t3('Now the divider. Put a 10 kΩ resistor (brown, black, orange) from 47g to 43g.', 'अब डिवाइडर। 10 kΩ रेज़िस्टर (भूरा, काला, नारंगी) 47g से 43g तक लगाइए।', 'Ab divider. 10 kΩ resistor (bhoora, kaala, naarangi) 47g se 43g tak lagaiye.'), see: E },
      { k: 'place', place: P('rd2', 'resistor', { ohms: 20000 }, 'j43', 1), do: t3('And a 20 kΩ resistor (red, black, orange) from 43j into the front − rail.', 'और 20 kΩ रेज़िस्टर (लाल, काला, नारंगी) 43j से आगे वाली − रेल में।', 'Aur 20 kΩ resistor (laal, kaala, naarangi) 43j se aage wali − rail mein.'),
        see: t3('Column 43 is the middle: it gets 20 / (10 + 20), two thirds, of what comes in at column 47. 5 V becomes 3.33 V.', 'कॉलम 43 बीच है: कॉलम 47 पर जो आता है उसका 20 / (10 + 20), यानी दो-तिहाई इसे मिलता है। 5 V बनता है 3.33 V।', 'Column 43 beech hai: column 47 par jo aata hai uska 20 / (10 + 20), yaani do-tihaai ise milta hai. 5 V banta hai 3.33 V.') },
      w3('mq', 'AO', 'rd1.1', 'Wire the MQ-2\'s AO to column 47 (the 10 kΩ\'s free end).', 'MQ-2 का AO कॉलम 47 (10 kΩ का खुला सिरा) से जोड़िए।', 'MQ-2 ka AO column 47 (10 kΩ ka khula sira) se jodiye.'),
      w3('rd2', '1', 'GP26', 'And the middle (column 43) to GP26, an ADC pin.', 'और बीच (कॉलम 43) को GP26 से, जो एक ADC पिन है।', 'Aur beech (column 43) ko GP26 se, jo ek ADC pin hai.'),
      CHECK,
      RUN(t3('"Warming up the sensor..." for 20 seconds, then a reading every half second.', '20 सेकंड तक "Warming up the sensor...", फिर हर आधे सेकंड में एक रीडिंग।', '20 second tak "Warming up the sensor...", phir har aadhe second mein ek reading.')),
      { k: 'watch', until: (S) => lineSeen(S, /^Gas \d+ ok/), do: t3('Wait for the heater, then read the clean-air number.', 'हीटर का इंतज़ार कीजिए, फिर साफ़ हवा की संख्या पढ़िए।', 'Heater ka intezaar kijiye, phir saaf hawa ki sankhya padhiye.'),
        see: t3('Clean air gives a low number. A cold MQ-2 reads higher at first: that is why the program waits.', 'साफ़ हवा में संख्या कम आती है। ठंडा MQ-2 शुरू में ज़्यादा पढ़ता है: इसीलिए प्रोग्राम इंतज़ार करता है।', 'Saaf hawa mein sankhya kam aati hai. Thanda MQ-2 shuru mein zyada padhta hai: isiliye program intezaar karta hai.') },
      { k: 'act', until: (S) => S.w('alarm'), do: t3('In the kitchen panel, open the gas leak to 30 %.', 'रसोई के पैनल में गैस लीक 30 % खोलिए।', 'Rasoi ke panel mein gas leak 30 % kholiye.'),
        see: t3('The number climbs past 20000: the LED and the buzzer warn long before the gas is enough to catch fire.', 'संख्या 20000 से ऊपर चढ़ती है: गैस आग पकड़ने लायक होने से बहुत पहले एलईडी और बज़र चेतावनी देते हैं।', 'Sankhya 20000 se upar chadhti hai: gas aag pakadne laayak hone se bahut pehle LED aur buzzer chetaavni dete hain.') },
      { k: 'act', until: (S) => S.w('safe'), do: t3('Close the leak and open the window.', 'लीक बंद कीजिए और खिड़की खोलिए।', 'Leak band kijiye aur khidki kholiye.'),
        see: live((lg, R, S) => { const v = ((S && S.serLines) || []).map((l) => /^Gas (\d+)/.exec(l)).filter(Boolean).map((m) => +m[1]); const mx = v.length ? Math.max(...v) : 0; return !mx ? '' : pick(lg, `The alarm stops only below 12000, not at 20000: between the two limits it keeps its state, so it does not flicker on and off at the edge. The highest reading was ${mx}, still under 65535: the divider kept GP26 safe.`, `अलार्म 20000 पर नहीं, सिर्फ़ 12000 से नीचे रुकता है: दोनों सीमाओं के बीच यह अपनी हालत बनाए रखता है, इसलिए किनारे पर बार-बार चालू-बंद नहीं होता। सबसे ऊँची रीडिंग ${mx} थी, फिर भी 65535 से कम: डिवाइडर ने GP26 को सुरक्षित रखा।`, `Alarm 20000 par nahi, sirf 12000 se neeche rukta hai: dono seemaon ke beech yeh apni haalat banaye rakhta hai, isliye kinare par baar-baar on-off nahi hota. Sabse oonchi reading ${mx} thi, phir bhi 65535 se kam: divider ne GP26 ko surakshit rakha.`); }) },
    ],
    check: [(S) => (S.conn('3V3', 'GND') || S.conn('VBUS', 'GND') ? [W.short] : null), has('mq', t3('gas sensor', 'गैस सेंसर', 'gas sensor')), (S) => (S.conn('mq.VCC', 'VBUS') && S.conn('mq.GND', 'GND') ? null : [X.mqPow]),
      (S) => (S.conn('mq.AO', 'GP26') ? [X.mqDirect] : null), (S) => (S.has('rd1') && S.has('rd2') && S.conn('mq.AO', 'rd1.1') && S.conn('rd1.2', 'rd2.1') && S.conn('rd2.1', 'GP26') && S.conn('rd2.2', 'GND') ? null : [X.mqDiv])],
    done: (S) => S.w('alarm') && S.w('safe') });

  // 3 ---------------------------------------------------------------------------------------------- Uno bank locker
  const POWER = [['5V', 'H:tp30'], ['GND3', 'H:tn18'], ['H:tp2', 'H:bp2'], ['H:tn3', 'H:bn3']];
  const RF = [['SDA', 'D10'], ['SCK', 'D13'], ['MOSI', 'D11'], ['MISO', 'D12'], ['RST', 'D9']];
  const BKP = [['R1', 'A0'], ['R2', 'A1'], ['R3', 'A2'], ['R4', 'A3'], ['C1', 'D5'], ['C2', 'D4'], ['C3', 'D3'], ['C4', 'D2']];
  L.push({ id: 'banklocker', cls: '9', blocks: false, view: 'wide', rview: 'scene3', code: BANK, drawer: ['keypad'], serial: true, scene: { kind: 'bank' },
    title: t3('Bank locker: card and PIN', 'बैंक लॉकर: कार्ड और पिन', 'Bank locker: card aur PIN'),
    goal: t3('A locker that needs two keys, as a bank\'s does: something you have (the owner\'s RFID card) and something you know (a PIN on the keypad). Neither alone is enough.', 'ऐसा लॉकर जिसे बैंक की तरह दो चाबियाँ चाहिए: कुछ जो आपके पास है (मालिक का आरएफ़आईडी कार्ड) और कुछ जो आप जानते हैं (कीपैड पर पिन)। अकेले कोई भी काफ़ी नहीं।', 'Aisa locker jise bank ki tarah do chaabiyaan chahiye: kuch jo aapke paas hai (maalik ka RFID card) aur kuch jo aap jaante hain (keypad par PIN). Akele koi bhi kaafi nahi.'),
    setup: { parts: [F('sv1', 'servo', { mount: 'lock' }, 178, 70, 1), P('bz1', 'buzzer', {}, 'e30', 0), F('rf', 'rfid', {}, 40, 152, 0)],
      wires: [...POWER, ['T:sv1:GND', 'H:bn40'], ['T:sv1:VP', 'H:bp40'], ['T:sv1:SIG', 'D6'], ['D8', 'H:a30'], ['H:a33', 'H:tn27'], ...RF.map(([k, p]) => ['T:rf:' + k, p]), ['T:rf:GND', 'H:bn44'], ['T:rf:V33', '3V3']] },
    steps: [
      { k: 'info', do: t3('Ready: the RC522 reader (SPI on pins 10–13, RST on 9, 3.3 V), the locker\'s servo latch on pin 6 and a buzzer on pin 8. Only the keypad is left, and pins 9–13 are taken.', 'तैयार: RC522 रीडर (SPI पिन 10–13 पर, RST 9 पर, 3.3 V), लॉकर की सर्वो कुंडी पिन 6 पर और बज़र पिन 8 पर। सिर्फ़ कीपैड बचा है, और पिन 9–13 भरे हुए हैं।', 'Taiyaar: RC522 reader (SPI pin 10–13 par, RST 9 par, 3.3 V), locker ki servo kundi pin 6 par aur buzzer pin 8 par. Sirf keypad bacha hai, aur pin 9–13 bhare hue hain.'),
        see: t3('The analog pins A0–A5 also work as ordinary digital pins (14–19): the keypad\'s rows go there.', 'एनालॉग पिन A0–A5 साधारण डिजिटल पिन (14–19) की तरह भी चलते हैं: कीपैड की पंक्तियाँ वहाँ जाती हैं।', 'Analog pin A0–A5 saadharan digital pin (14–19) ki tarah bhi chalte hain: keypad ki rows wahan jaati hain.') },
      { k: 'place', place: F('kp', 'keypad', {}, -40, 165, 0), do: t3('Put the keypad on the mat at the ghost.', 'कीपैड को मैट पर नीली आकृति पर रखिए।', 'Keypad ko mat par neeli shape par rakhiye.'), see: E },
      ...BKP.map(([id, pin], i) => w3('kp', id, pin, `Wire its pin ${i + 1} (${id}) to ${pin.replace(/^D/, 'pin ')}.`, `इसका पिन ${i + 1} (${id}) ${pin.replace(/^D/, 'पिन ')} से जोड़िए।`, `Iska pin ${i + 1} (${id}) ${pin.replace(/^D/, 'pin ')} se jodiye.`)),
      CHECK,
      { k: 'info', code: [24, 25], do: t3('Read the two factors: owner (the card\'s number) and pin. cardOk remembers that the card was shown, and only for 15 seconds.', 'दोनों फ़ैक्टर पढ़िए: owner (कार्ड का नंबर) और pin। cardOk याद रखता है कि कार्ड दिखाया गया था, और सिर्फ़ 15 सेकंड तक।', 'Dono factor padhiye: owner (card ka number) aur pin. cardOk yaad rakhta hai ki card dikhaya gaya tha, aur sirf 15 second tak.'), see: E },
      RUN(t3('"Show your card".', '"Show your card"।', '"Show your card".')),
      { k: 'act', until: (S) => lineSeen(S, /Card first!/), do: t3('Someone has seen the PIN. Type 4 3 2 1 # without a card.', 'किसी ने पिन देख लिया है। बिना कार्ड के 4 3 2 1 # दबाइए।', 'Kisi ne PIN dekh liya hai. Bina card ke 4 3 2 1 # dabaiye.'),
        see: t3('"Card first!": knowing the PIN is not enough.', '"Card first!": पिन जानना काफ़ी नहीं।', '"Card first!": PIN jaanna kaafi nahi.') },
      { k: 'act', until: (S) => lineSeen(S, /Unknown card 5B 2E 91 C4/), do: t3('A stranger shows a card: hold the blue tag on the reader.', 'कोई अजनबी कार्ड दिखाता है: नीला टैग रीडर पर रखिए।', 'Koi ajnabi card dikhata hai: neela tag reader par rakhiye.'), see: t3('"Unknown card" and a long beep.', '"Unknown card" और एक लंबी बीप।', '"Unknown card" aur ek lambi beep.') },
      { k: 'act', until: (S) => S.w('opened'), do: t3('Now the owner: hold the white card on the reader, then type 4 3 2 1 #.', 'अब मालिक: सफ़ेद कार्ड रीडर पर रखिए, फिर 4 3 2 1 # दबाइए।', 'Ab maalik: safed card reader par rakhiye, phir 4 3 2 1 # dabaiye.'),
        see: t3('"Card OK", then "Open!": both factors together open the locker.', '"Card OK", फिर "Open!": दोनों फ़ैक्टर मिलकर लॉकर खोलते हैं।', '"Card OK", phir "Open!": dono factor milkar locker kholte hain.') },
      { k: 'edit', test: (src) => { const m = /String\s+pin\s*=\s*"([0-9A-D]{4,8})"/.exec(src); return !!m && m[1] !== '4321'; }, set: [[/String pin = "4321";/, 'String pin = "8642";']],
        do: t3('Set your own PIN: change pin = "4321" to 4 to 8 keys, for example "8642", and press Run.', 'अपना पिन रखिए: pin = "4321" को 4 से 8 बटन कीजिए, जैसे "8642", और "चलाइए" दबाइए।', 'Apna PIN rakhiye: pin = "4321" ko 4 se 8 keys karo, jaise "8642", aur Run dabaiye.'), see: E },
      { k: 'act', until: (S) => fresh(S) && S.w('opened'), do: t3('Open it: the white card, then your new PIN and #.', 'इसे खोलिए: सफ़ेद कार्ड, फिर नया पिन और #।', 'Ise kholiye: safed card, phir naya PIN aur #.'),
        see: live((lg, R) => (!R.code ? '' : pick(lg, `Your results: the card and "${R.code}" opened it. A lost card is useless without the PIN, and a seen PIN is useless without the card: banks, UPI and email logins use the same two-factor idea.`, `आपके नतीजे: कार्ड और "${R.code}" से यह खुला। खोया कार्ड पिन के बिना बेकार है, और देखा हुआ पिन कार्ड के बिना बेकार: बैंक, यूपीआई और ईमेल लॉगिन यही टू-फ़ैक्टर तरीक़ा अपनाते हैं।`, `Aapke results: card aur "${R.code}" se yeh khula. Khoya card PIN ke bina bekaar hai, aur dekha hua PIN card ke bina bekaar: bank, UPI aur email login yahi two-factor tareeka apnaate hain.`))) },
    ],
    check: [noShort, (S) => (S.conn('rf.V33', '5V') ? [X.rfid5v] : null), has('kp', KP), ...BKP.map(([id, pin]) => (S) => (S.conn('kp.' + id, pin) ? null : [X.kpBank]))],
    done: (S) => /String\s+pin\s*=\s*"(?!4321")/.test(S.runSrc || '') && S.w('opened') });

  // 4 ---------------------------------------------------------------------------------------------- Uno smart water tank
  const RLW = [['T:rl:S', 'D7'], ['T:rl:VCC', 'H:bp48'], ['T:rl:GND', 'H:bn48'], ['T:bat:P', 'T:rl:COM'], ['T:rl:NO', 'T:pump:P'], ['T:pump:N', 'T:bat:N']];
  const XT = {
    us: t3('The ultrasonic sensor: VCC to the + rail (5 V), Trig to pin 9, Echo to pin 10, GND to the − rail. Without it the program reads 0 cm, a "full" tank, and the pump never starts.', 'अल्ट्रासोनिक सेंसर: VCC + रेल (5 V) पर, Trig पिन 9 पर, Echo पिन 10 पर, GND − रेल पर। इसके बिना प्रोग्राम 0 cm पढ़ता है, यानी "भरी" टंकी, और पंप कभी चालू नहीं होता।', 'Ultrasonic sensor: VCC + rail (5 V) par, Trig pin 9 par, Echo pin 10 par, GND − rail par. Iske bina program 0 cm padhta hai, yaani "bhari" tanki, aur pump kabhi on nahi hota.'),
    swap: t3('Trig and Echo are swapped: Trig (column 51) goes to pin 9, Echo (column 52) to pin 10.', 'Trig और Echo उल्टे लगे हैं: Trig (कॉलम 51) पिन 9 पर, Echo (कॉलम 52) पिन 10 पर।', 'Trig aur Echo ulte lage hain: Trig (column 51) pin 9 par, Echo (column 52) pin 10 par.'),
  };
  L.push({ id: 'smarttank', cls: '9', blocks: false, view: 'wide', rview: 'scene3', code: TANKC, drawer: ['hcsr04'], serial: true, scene: { kind: 'tank' },
    title: t3('Smart water tank: level, pump and alarm', 'स्मार्ट पानी की टंकी: लेवल, पंप और अलार्म', 'Smart paani ki tanki: level, pump aur alarm'),
    goal: t3('No more overflowing tanks or "motor band karo!": the ultrasonic sensor watches the water, the relay starts the pump when it is low and stops it when it is full, and if the sump is empty it protects the pump from running dry.', 'अब न टंकी बहेगी, न "मोटर बंद करो!": अल्ट्रासोनिक सेंसर पानी पर नज़र रखता है, रिले पानी कम होने पर पंप चलाता है और भरने पर बंद करता है, और संप ख़ाली हो तो पंप को सूखा चलने से बचाता है।', 'Ab na tanki bahegi, na "motor band karo!": ultrasonic sensor paani par nazar rakhta hai, relay paani kam hone par pump chalata hai aur bharne par band karta hai, aur sump khaali ho to pump ko sookha chalne se bachata hai.'),
    setup: { parts: [F('bat', 'aa4', {}, -40, 150, 0), F('pump', 'pump', { mount: 'tank' }, 182, 140, 1), F('rl', 'relay', {}, 60, 118, 0), P('bz1', 'buzzer', {}, 'e30', 0)], wires: [...POWER, ...RLW, ['D8', 'H:a30'], ['H:a33', 'H:tn27']] },
    steps: [
      { k: 'info', do: t3('Ready: the pump in the sump, switched by the relay on pin 7 (its own battery), and a buzzer on pin 8. Missing: the eyes. The HC-SR04 sits in the tank\'s lid and measures the air gap above the water.', 'तैयार: संप में पंप, पिन 7 वाले रिले से चलता है (अपनी बैटरी से), और पिन 8 पर बज़र। कमी: आँखों की। HC-SR04 टंकी के ढक्कन में बैठकर पानी के ऊपर की हवा की दूरी नापता है।', 'Taiyaar: sump mein pump, pin 7 wale relay se chalta hai (apni battery se), aur pin 8 par buzzer. Kami: aankhon ki. HC-SR04 tanki ke dhakkan mein baithkar paani ke upar ki hawa ki doori naapta hai.'),
        see: t3('In a real tank it goes in the lid on long wires; here it stays on the breadboard and the panel tells it what the lid sees.', 'असली टंकी में यह लंबे तारों से ढक्कन में लगता है; यहाँ यह ब्रेडबोर्ड पर रहता है और पैनल इसे बताता है कि ढक्कन से क्या दिखता है।', 'Asli tanki mein yeh lambe taaron se dhakkan mein lagta hai; yahan yeh breadboard par rehta hai aur panel ise batata hai ki dhakkan se kya dikhta hai.') },
      { k: 'place', place: P('us1', 'hcsr04', {}, 'j50', 0), do: t3('Plug the ultrasonic sensor into 50j–53j, its "eyes" facing you.', 'अल्ट्रासोनिक सेंसर को 50j–53j में लगाइए, इसकी "आँखें" आपकी तरफ़।', 'Ultrasonic sensor ko 50j–53j mein lagaiye, iski "aankhen" aapki taraf.'), see: E },
      w3('us1', 'VCC', 'rail:bp', 'Wire VCC (column 50) to the front + rail.', 'VCC (कॉलम 50) को आगे वाली + रेल से जोड़िए।', 'VCC (column 50) ko aage wali + rail se jodiye.'),
      w3('us1', 'TRIG', 'D9', 'Trig (column 51) to pin 9.', 'Trig (कॉलम 51) को पिन 9 से।', 'Trig (column 51) ko pin 9 se.'),
      w3('us1', 'ECHO', 'D10', 'Echo (column 52) to pin 10.', 'Echo (कॉलम 52) को पिन 10 से।', 'Echo (column 52) ko pin 10 se.'),
      w3('us1', 'GND', 'rail:bn', 'GND (column 53) to the front − rail.', 'GND (कॉलम 53) को आगे वाली − रेल से।', 'GND (column 53) ko aage wali − rail se.'),
      CHECK,
      { k: 'info', code: [16, 24], do: t3('Read readLevel(): the echo\'s time gives the air gap in cm, and the tank is 100 cm deep under a sensor 8 cm above the brim, so the level in % is simply 108 minus the gap.', 'readLevel() पढ़िए: इको का समय cm में हवा की दूरी देता है, और टंकी 100 cm गहरी है, सेंसर किनारे से 8 cm ऊपर, इसलिए लेवल % में बस 108 घटा दूरी है।', 'readLevel() padhiye: echo ka time cm mein hawa ki doori deta hai, aur tanki 100 cm gehri hai, sensor kinare se 8 cm upar, isliye level % mein bas 108 minus doori hai.'), see: E },
      RUN(t3('"Level 60 %" every half second; the pump stays off.', 'हर आधे सेकंड "Level 60 %"; पंप बंद रहता है।', 'Har aadhe second "Level 60 %"; pump band rehta hai.')),
      { k: 'act', until: (S) => S.w('autoOn') && S.w('full'), do: t3('Morning rush: in the tank panel, open the taps, and leave them open.', 'सुबह की भीड़: टंकी के पैनल में नल खोलिए, और खुले छोड़ दीजिए।', 'Subah ki bheed: tanki ke panel mein nal kholiye, aur khule chhod dijiye.'),
        see: t3('The level falls; below 30 % click, "Pump ON"; it fills even while the taps run; above 90 % click, "Pump OFF: tank full". Nobody has to shout "motor band karo!".', 'लेवल गिरता है; 30 % से नीचे क्लिक, "Pump ON"; नल चलते हुए भी टंकी भरती है; 90 % से ऊपर क्लिक, "Pump OFF: tank full"। किसी को "मोटर बंद करो!" चिल्लाना नहीं पड़ता।', 'Level girta hai; 30 % se neeche click, "Pump ON"; nal chalte hue bhi tanki bharti hai; 90 % se upar click, "Pump OFF: tank full". Kisi ko "motor band karo!" chillana nahi padta.') },
      { k: 'act', until: (S) => S.w('dryStop'), do: t3('The water supply is off today: set the sump to Empty, and keep the taps open.', 'आज पानी की सप्लाई बंद है: संप को ख़ाली कीजिए, और नल खुले रखिए।', 'Aaj paani ki supply band hai: sump ko khaali kijiye, aur nal khule rakhiye.'),
        see: t3('The pump starts but the level does not rise: after 5 s, "DRY RUN!", the pump stops and the alarm beeps. A pump running without water heats up and burns out in minutes.', 'पंप चालू होता है पर लेवल नहीं बढ़ता: 5 s बाद "DRY RUN!", पंप रुकता है और अलार्म बजता है। बिना पानी चलता पंप कुछ ही मिनट में गर्म होकर जल जाता है।', 'Pump on hota hai par level nahi badhta: 5 s baad "DRY RUN!", pump rukta hai aur alarm bajta hai. Bina paani chalta pump kuch hi minute mein garam hokar jal jaata hai.') },
      { k: 'edit', test: (src) => { const m = /int\s+low\s*=\s*(\d+)\s*;/.exec(src); return !!m && +m[1] >= 40 && +m[1] <= 70; }, set: [[/int low = 30;/, 'int low = 50;']],
        do: t3('Water cuts are common: keep a bigger reserve. Change low = 30 to low = 50 and press Run.', 'पानी की कटौती आम है: ज़्यादा पानी बचाकर रखिए। low = 30 को low = 50 कीजिए और "चलाइए" दबाइए।', 'Paani ki katauti aam hai: zyada paani bacha kar rakhiye. low = 30 ko low = 50 karo aur Run dabaiye.'), see: E },
      { k: 'act', until: (S) => fresh(S) && S.w('autoOn') && S.w('full') && (S.wv('res') || {}).onAt >= 40, do: t3('The supply is back: set the sump to Has water, and keep the taps open.', 'सप्लाई वापस आ गई: संप को "पानी है" कीजिए, और नल खुले रखिए।', 'Supply wapas aa gayi: sump ko "paani hai" kijiye, aur nal khule rakhiye.'),
        see: live((lg, R) => (R.onAt === undefined ? '' : pick(lg, `Your results: the pump now starts at ${R.onAt} % and stops at ${R.offAt === undefined ? '…' : R.offAt + ' %'}: the tank never falls below half. Two numbers in the code decide how the whole house lives with water.`, `आपके नतीजे: पंप अब ${R.onAt} % पर चालू होता है और ${R.offAt === undefined ? '…' : R.offAt + ' %'} पर रुकता है: टंकी कभी आधी से कम नहीं होती। कोड की दो संख्याएँ तय करती हैं कि पूरा घर पानी के साथ कैसे रहता है।`, `Aapke results: pump ab ${R.onAt} % par on hota hai aur ${R.offAt === undefined ? '…' : R.offAt + ' %'} par rukta hai: tanki kabhi aadhi se kam nahi hoti. Code ke do number tay karte hain ki poora ghar paani ke saath kaise rehta hai.`))) },
    ],
    check: [noShort, has('us1', t3('ultrasonic sensor', 'अल्ट्रासोनिक सेंसर', 'ultrasonic sensor')), (S) => (S.conn('us1.TRIG', 'D10') && S.conn('us1.ECHO', 'D9') ? [XT.swap] : null),
      (S) => (S.conn('us1.VCC', '5V') && S.conn('us1.GND', 'GND') && S.conn('us1.TRIG', 'D9') && S.conn('us1.ECHO', 'D10') ? null : [XT.us])],
    done: (S) => /int\s+low\s*=\s*(?!30\s*;)\d+/.test(S.runSrc || '') && S.w('full') && (S.wv('res') || {}).onAt >= 40 });

  for (const l of L) { l.n = ++n; l.batch = 17; l.tick = (S) => { RT.S = S; }; if (l.scene) l.world = l.scene; if (l.board === 'pico') l.lang = 'py'; }
  return L;
}
