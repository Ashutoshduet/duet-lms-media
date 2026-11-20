// DUET Robotics Lab 360, batch 17: Class 9 sessions, written fresh for DUET (same shape as lessons.js):
//   pico_keylock   a password lock on the Raspberry Pi Pico in MicroPython: the 4×4 keypad is scanned by our own code
//                  (one row HIGH at a time, the columns pulled down), the servo latch by PWM at 50 Hz, a buzzer;
//                  the password is shown as stars, and three wrong tries lock the keypad for 10 seconds
//   pico_gasalarm  an MQ-2 gas alarm on the Pico: the sensor runs on 5 V, so its AO goes through a 10 kΩ / 20 kΩ divider
//                  to GP26; the heater warms up first; two limits (alarm and safe) so the alarm does not flicker
//   smarttank      a rooftop water tank on the Uno: the HC-SR04 in the lid, the pump through a relay, low / high limits, and
//                  dry-run protection (the level must rise within 5 s, or the pump stops and the alarm sounds)
//   pico_linecar / pico_avoidcar  the Class 7 cars again on the Pico in MicroPython (L298N on GP16–GP21, PWM in %), the
//                  sonar's Echo through a 1 kΩ / 2.2 kΩ divider to GP13, time_pulse_us() for its echo
//   greenhouse     a polyhouse on the Uno: DHT11 + soil + LDR in, pump + fan (two relays, a battery pack each) + grow light out
//   pico_weather   a DHT11 and an SSD1306 OLED on the Pico's I2C0 (GP4 / GP5) with the ssd1306 driver (pi6.js machine.I2C)
//   pico_rfidlock  the RC522 on the Pico's SPI0 (GP2 / GP3 / GP4, CS GP1, RST GP0) with the mfrc522 driver; an ALLOWED list
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
const PDRIVE = `from machine import Pin, PWM
import time

in1, in2 = Pin(16, Pin.OUT), Pin(17, Pin.OUT)     # motor A: the left wheel
in3, in4 = Pin(18, Pin.OUT), Pin(19, Pin.OUT)     # motor B: the right wheel
ena, enb = PWM(Pin(20)), PWM(Pin(21))             # their speed (PWM)
ena.freq(1000)
enb.freq(1000)

def wheel(a, b, en, v):           # one wheel: v from -100 (backwards) to 100 (forwards), in %
    a.value(1 if v > 0 else 0)
    b.value(1 if v < 0 else 0)
    en.duty_u16(int(min(100, abs(v)) * 65535 / 100))

def drive(left, right):
    wheel(in1, in2, ena, left)
    wheel(in3, in4, enb, right)
`;
const PLINE = `# Line follower on the Pico: two IR sensors look down at the floor
# (their OUT is 0 on white, where the light comes back, and 1 on the black tape)
${PDRIVE}
ir_left, ir_right = Pin(14, Pin.IN), Pin(15, Pin.IN)
speed = 45          # % of full power
turn = 0            # the inside wheel in a turn: 0 = stop

while True:
    L = ir_left.value()
    R = ir_right.value()
    if L == 0 and R == 0:
        drive(speed, speed)       # both on white: straight on
    elif L == 1 and R == 0:
        drive(turn, speed)        # tape under the left sensor: turn left
    elif L == 0 and R == 1:
        drive(speed, turn)        # tape under the right sensor: turn right
    else:
        drive(0, 0)               # both on black: stop
    time.sleep_ms(5)
`;
const PAVOID = `# Obstacle-avoiding car on the Pico: it looks ahead; near a wall it stops,
# looks left and right, backs off, and turns to the side that is more open
${PDRIVE}from machine import time_pulse_us

trig = Pin(14, Pin.OUT)
echo = Pin(13, Pin.IN)            # through the 1 k / 2.2 k divider: 5 V becomes 3.4 V
scan = PWM(Pin(15))
scan.freq(50)
speed = 55          # %
safe = 30           # cm: closer than this is "too close"

def look(angle):
    scan.duty_u16(int(1638 + angle * 6553 / 180))

def distance_cm():
    trig.value(0)
    time.sleep_us(2)
    trig.value(1)                 # a 10 us ping
    time.sleep_us(10)
    trig.value(0)
    t = time_pulse_us(echo, 1, 30000)   # how long Echo stays HIGH (negative: no echo)
    if t < 0:
        return 400
    return t * 0.0343 / 2

look(90)
while True:
    ahead = distance_cm()
    print(int(ahead))
    if ahead > safe:
        drive(speed, speed)       # the way is clear
        time.sleep_ms(50)
        continue
    drive(0, 0)                   # stop, and look round
    look(170)
    time.sleep_ms(400)
    left = distance_cm()
    look(10)
    time.sleep_ms(400)
    right = distance_cm()
    look(90)
    time.sleep_ms(300)
    drive(-speed, -speed)         # back off a little first
    time.sleep_ms(250)
    if left > right:
        drive(-speed, speed)      # spin to the left
    else:
        drive(speed, -speed)      # spin to the right
    time.sleep_ms(450)
`;
const GREEN = `// Smart greenhouse: the Arduino looks after the plant by itself, day and night.
// The DHT11 watches the air, the soil sensor the roots, the LDR the sun.
#include <DHT.h>
DHT dht(2, DHT11);              // the DHT11's DATA on pin 2
const int soilPin = A0;         // soil: dry = big number
const int lightPin = A1;        // light: bright = big number
const int pump = 7;             // relay 1: the water pump
const int fan = 8;              // relay 2: the fan
const int growLight = 9;        // an LED for the plant at night
int dry = 600;                  // soil above this: water it
int hot = 32;                   // °C above this: fan on
int dark = 300;                 // light below this: night

void setup() {
  dht.begin();
  pinMode(pump, OUTPUT);
  pinMode(fan, OUTPUT);
  pinMode(growLight, OUTPUT);
  Serial.begin(9600);
}

void loop() {
  float t = dht.readTemperature();
  float h = dht.readHumidity();
  int soil = analogRead(soilPin);
  int light = analogRead(lightPin);

  digitalWrite(pump, soil > dry ? HIGH : LOW);           // thirsty: water
  if (!isnan(t)) {
    digitalWrite(fan, t > hot || h > 85 ? HIGH : LOW);   // too hot or too damp: air it
  }
  digitalWrite(growLight, light < dark ? HIGH : LOW);    // night: grow light on

  Serial.print("T ");
  Serial.print(t, 1);
  Serial.print(" C  H ");
  Serial.print(h, 0);
  Serial.print(" %  soil ");
  Serial.print(soil);
  Serial.print("  light ");
  Serial.println(light);
  delay(1000);
}
`;
const PWEATHER = `# Weather station on the Pico: a DHT11 measures, a 128 x 64 OLED shows it
from machine import Pin, I2C
import ssd1306
import dht
import time

i2c = I2C(0, sda=Pin(4), scl=Pin(5))        # the OLED: SDA on GP4, SCL on GP5
print("I2C found:", [hex(a) for a in i2c.scan()])
oled = ssd1306.SSD1306_I2C(128, 64, i2c)    # the ssd1306 driver, at address 0x3c
sensor = dht.DHT11(Pin(14))                  # the DHT11's DATA on GP14

while True:
    try:
        sensor.measure()
        t = sensor.temperature()
        h = sensor.humidity()
    except OSError:                          # a missed reading: try again
        time.sleep(2)
        continue
    oled.fill(0)                             # clear the picture in memory
    oled.text("DUET Weather", 16, 0)
    oled.text("Temp: " + str(t) + " C", 0, 20)
    oled.text("Hum:  " + str(h) + " %", 0, 34)
    oled.rect(0, 52, 128, 10, 1)             # a thermometer bar: 0 to 50 C
    oled.fill_rect(0, 52, int(t * 128 / 50), 10, 1)
    oled.show()                              # send it to the screen
    print(t, h)
    time.sleep(2)
`;
const PRFID = `# RFID door lock on the Pico: the servo opens the latch only for a card on the list
from machine import Pin, PWM
from mfrc522 import MFRC522
import time

reader = MFRC522(spi_id=0, sck=2, miso=4, mosi=3, cs=1, rst=0)   # SPI0 on GP2, GP3, GP4; SDA (CS) on GP1, RST on GP0
latch = PWM(Pin(15))
latch.freq(50)
ALLOWED = ["00 00 00 00"]          # the card numbers that may open the door

def turn(angle):                   # 0 = locked, 90 = open
    latch.duty_u16(int(1638 + angle * 6553 / 180))

def uid_text(uid):                 # [0xA3, 0x4F, ...] -> "A3 4F ..."
    s = ""
    for b in uid:
        s += "%02X " % b
    return s.strip()

turn(0)
reader.init()
print("Show a card...")
while True:
    stat, bits = reader.request(reader.REQIDL)
    if stat == reader.OK:
        stat, uid = reader.SelectTagSN()
        if stat == reader.OK:
            card = uid_text(uid)
            print("Card:", card)
            if card in ALLOWED:
                print("Welcome! Door open")
                turn(90)
                time.sleep(3)
                turn(0)
            else:
                print("Access denied")
    time.sleep_ms(100)
`;
export const BATCH17_CODE = { PLOCK, PGAS, BANK, TANKC, PLINE, PAVOID, GREEN, PWEATHER, PRFID };

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

  // 7 ---------------------------------------------------------------------------------------------- Uno smart greenhouse
  const GH_W = [['T:soil:VCC', 'H:bp45'], ['T:soil:GND', 'H:bn45'], ['T:soil:AO', 'A0'], ['H:a40', 'H:tp36'], ['A1', 'H:a42'], ['D9', 'H:a31'],
    ['T:rl:S', 'D7'], ['T:rl:VCC', 'H:bp48'], ['T:rl:GND', 'H:bn48'], ['T:bat:P', 'T:rl:COM'], ['T:rl:NO', 'T:pump:P'], ['T:pump:N', 'T:bat:N']];
  const XG = {
    dht: t3('The DHT11: DATA (left, column 50) to pin 2, + (middle) to the front + rail, − (right) to the front − rail.', 'DHT11: DATA (बायाँ, कॉलम 50) पिन 2 पर, + (बीच) आगे वाली + रेल पर, − (दायाँ) आगे वाली − रेल पर।', 'DHT11: DATA (left, column 50) pin 2 par, + (beech) aage wali + rail par, − (right) aage wali − rail par.'),
    fan: t3('The fan\'s relay: S to pin 8, + and − to the front rails; on its other side the fan\'s pack + to COM, NO to the fan\'s red wire, the fan\'s black wire to the pack −.', 'पंखे का रिले: S पिन 8 पर, + और − आगे की रेलों पर; दूसरी तरफ़ पंखे के पैक का + COM पर, NO से पंखे का लाल तार, पंखे का काला तार पैक के − पर।', 'Pankhe ka relay: S pin 8 par, + aur − aage ki rails par; doosri taraf pankhe ke pack ka + COM par, NO se pankhe ka laal taar, pankhe ka kaala taar pack ke − par.'),
  };
  L.push({ id: 'greenhouse', cls: '9', blocks: false, view: 'wide', rview: 'scene3', code: GREEN, drawer: ['dht11', 'relay', 'motor'], serial: true, scene: { kind: 'greenhouse' },
    title: t3('Smart greenhouse: air, soil and light', 'स्मार्ट ग्रीनहाउस: हवा, मिट्टी और रोशनी', 'Smart greenhouse: hawa, mitti aur roshni'),
    goal: t3('A polyhouse that runs itself: the pump waters dry soil, a fan cools hot or damp air, and a grow light comes on at night. Three sensors, three outputs, one loop.', 'ऐसा पॉलीहाउस जो ख़ुद चलता है: पंप सूखी मिट्टी को पानी देता है, पंखा गर्म या नम हवा को ठंडा करता है, और रात में ग्रो लाइट जलती है। तीन सेंसर, तीन आउटपुट, एक लूप।', 'Aisa polyhouse jo khud chalta hai: pump sookhi mitti ko paani deta hai, pankha garam ya nam hawa ko thanda karta hai, aur raat mein grow light jalti hai. Teen sensor, teen output, ek loop.'),
    setup: { parts: [F('soil', 'soil', {}, 150, 92, 0), P('ldr1', 'ldr', {}, 'e40', 0), P('r10', 'resistor', { ohms: 10000 }, 'b42', 3), P('led1', 'led', { color: 'yellow' }, 'e30', 0), P('r1', 'resistor', { ohms: 220 }, 'b30', 3),
      F('bat', 'aa4', {}, -40, 150, 0), F('pump', 'pump', { mount: 'tank' }, 182, 140, 1), F('rl', 'relay', {}, 60, 118, 0)], wires: [...POWER, ...GH_W] },
    steps: [
      { k: 'info', do: t3('Already working from the garden lesson: the soil sensor (A0), the pump through relay 1 (pin 7), an LDR (A1, bright = big) and a yellow grow light (pin 9). New today: the air. A DHT11 for temperature and humidity, and a fan on a second relay.', 'बगीचे वाले पाठ से पहले से चालू: मिट्टी सेंसर (A0), रिले 1 (पिन 7) से पंप, एक एलडीआर (A1, रोशनी = बड़ी संख्या) और पीली ग्रो लाइट (पिन 9)। आज नया: हवा। तापमान और नमी के लिए DHT11, और दूसरे रिले पर पंखा।', 'Bagiche wale paath se pehle se chalu: mitti sensor (A0), relay 1 (pin 7) se pump, ek LDR (A1, roshni = bada number) aur peeli grow light (pin 9). Aaj naya: hawa. Temperature aur nami ke liye DHT11, aur doosre relay par pankha.'), see: E },
      { k: 'place', place: P('dht', 'dht11', {}, 'j50', 0), do: t3('Plug the DHT11 into 50j–52j, its grille facing you.', 'DHT11 को 50j–52j में लगाइए, जाली आपकी तरफ़।', 'DHT11 ko 50j–52j mein lagaiye, jaali aapki taraf.'), see: E },
      w3('dht', 'DATA', 'D2', 'Its left pin (DATA) to pin 2.', 'इसका बायाँ पिन (DATA) पिन 2 से।', 'Iska left pin (DATA) pin 2 se.'),
      w3('dht', 'VCC', 'rail:bp', 'Its middle pin (+) to the front + rail.', 'इसका बीच वाला पिन (+) आगे वाली + रेल से।', 'Iska beech wala pin (+) aage wali + rail se.'),
      w3('dht', 'GND', 'rail:bn', 'Its right pin (−) to the front − rail.', 'इसका दायाँ पिन (−) आगे वाली − रेल से।', 'Iska right pin (−) aage wali − rail se.'),
      { k: 'place', place: F('rl2', 'relay', {}, 100, 118, 0), do: t3('Put the second relay on the mat at the ghost.', 'दूसरा रिले मैट पर नीली आकृति पर रखिए।', 'Doosra relay mat par neeli shape par rakhiye.'), see: E },
      w3('rl2', 'S', 'D8', 'Its S to pin 8.', 'इसका S पिन 8 से।', 'Iska S pin 8 se.'),
      w3('rl2', 'VCC', 'rail:bp', 'Its + to the front + rail.', 'इसका + आगे वाली + रेल से।', 'Iska + aage wali + rail se.'),
      w3('rl2', 'GND', 'rail:bn', 'Its − to the front − rail.', 'इसका − आगे वाली − रेल से।', 'Iska − aage wali − rail se.'),
      { k: 'place', place: F('fan', 'motor', {}, 228, 30, 0), do: t3('Put the fan (a DC motor with a propeller) at the ghost, next to the plant.', 'पंखा (प्रोपेलर वाली डीसी मोटर) नीली आकृति पर, पौधे के पास रखिए।', 'Pankha (propeller wali DC motor) neeli shape par, paudhe ke paas rakhiye.'), see: E },
      { k: 'place', place: F('bat2', 'aa4', {}, -130, 150, 0), do: t3('The fan gets its own battery pack: put it at the ghost.', 'पंखे का अपना बैटरी पैक है: इसे नीली आकृति पर रखिए।', 'Pankhe ka apna battery pack hai: ise neeli shape par rakhiye.'), see: E },
      w3('bat2', 'P', 'rl2.COM', 'Its power loop: the pack\'s red wire (+) to relay 2\'s COM.', 'इसका पावर लूप: पैक का लाल तार (+) रिले 2 के COM से।', 'Iska power loop: pack ka laal taar (+) relay 2 ke COM se.'),
      w3('rl2', 'NO', 'fan.P', 'Relay 2\'s NO to the fan\'s red wire.', 'रिले 2 का NO पंखे के लाल तार से।', 'Relay 2 ka NO pankhe ke laal taar se.'),
      w3('fan', 'N', 'bat2.N', 'The fan\'s black wire to the pack\'s black wire (−).', 'पंखे का काला तार पैक के काले तार (−) से।', 'Pankhe ka kaala taar pack ke kaale taar (−) se.', t3('Two loops, each with its own switch: the pump\'s through relay 1, the fan\'s through relay 2. The Arduino only moves the relays.', 'दो लूप, हर एक का अपना स्विच: पंप का रिले 1 से, पंखे का रिले 2 से। Arduino सिर्फ़ रिले हिलाता है।', 'Do loop, har ek ka apna switch: pump ka relay 1 se, pankhe ka relay 2 se. Arduino sirf relay hilata hai.')),
      CHECK,
      { k: 'info', code: [27, 31], do: t3('Read the three rules in loop(): each output has its own if, written as condition ? HIGH : LOW. The fan has two reasons: too hot OR too damp (|| means "or").', 'loop() के तीन नियम पढ़िए: हर आउटपुट का अपना if है, condition ? HIGH : LOW की तरह लिखा। पंखे के दो कारण हैं: बहुत गर्म या बहुत नम (|| मतलब "या")।', 'loop() ke teen niyam padhiye: har output ka apna if hai, condition ? HIGH : LOW ki tarah likha. Pankhe ke do kaaran hain: bahut garam ya bahut nam (|| matlab "ya").'), see: E },
      RUN(t3('A line every second: temperature, humidity, soil and light.', 'हर सेकंड एक लाइन: तापमान, नमी, मिट्टी और रोशनी।', 'Har second ek line: temperature, nami, mitti aur roshni.')),
      { k: 'watch', until: (S) => S.w('fanOn') && S.w('cooled'), do: t3('A sunny afternoon: watch the temperature.', 'धूप वाली दोपहर: तापमान देखिए।', 'Dhoop wali dopahar: temperature dekhiye.'),
        see: t3('The plastic traps the sun\'s heat. Past 32 °C, click: the fan starts and pulls the air down a few degrees.', 'प्लास्टिक धूप की गर्मी को रोक लेता है। 32 °C के पार, क्लिक: पंखा चलता है और हवा को कुछ डिग्री ठंडा करता है।', 'Plastic dhoop ki garmi ko rok leta hai. 32 °C ke paar, click: pankha chalta hai aur hawa ko kuch degree thanda karta hai.') },
      { k: 'act', until: (S) => S.w('growNight') && S.w('fanOff'), do: t3('Evening: in the panel, turn the sun off.', 'शाम: पैनल में धूप बंद कीजिए।', 'Shaam: panel mein dhoop band kijiye.'),
        see: t3('The LDR goes dark, so the grow light comes on; the air cools, so the fan stops by itself.', 'एलडीआर अंधेरे में चला जाता है, तो ग्रो लाइट जलती है; हवा ठंडी होती है, तो पंखा अपने-आप रुकता है।', 'LDR andhere mein chala jaata hai, to grow light jalti hai; hawa thandi hoti hai, to pankha apne-aap rukta hai.') },
      { k: 'act', until: (S) => S.w('cycle2'), do: t3('A dry spell: press "dry the soil".', 'सूखा: "मिट्टी सुखाइए" दबाइए।', 'Sookha: "mitti sukhaiye" dabaiye.'), see: t3('The pump waters until the soil is wet again, as in the garden: three systems, each minding its own job in the same loop.', 'बगीचे की तरह पंप मिट्टी के फिर गीली होने तक पानी देता है: तीन सिस्टम, एक ही लूप में अपना-अपना काम।', 'Bagiche ki tarah pump mitti ke phir geeli hone tak paani deta hai: teen system, ek hi loop mein apna-apna kaam.') },
      { k: 'edit', test: (src) => { const m = /int\s+hot\s*=\s*(\d+)\s*;/.exec(src); return !!m && +m[1] >= 26 && +m[1] <= 30; }, set: [[/int hot = 32;/, 'int hot = 29;']],
        do: t3('Tomatoes drop their flowers above about 30 °C. Change hot = 32 to hot = 29 and press Run.', 'टमाटर लगभग 30 °C से ऊपर फूल गिरा देते हैं। hot = 32 को hot = 29 कीजिए और "चलाइए" दबाइए।', 'Tamatar lagbhag 30 °C se upar phool gira dete hain. hot = 32 ko hot = 29 karo aur Run dabaiye.'), see: E },
      { k: 'act', until: (S) => S.runSrc !== null && /int\s+hot\s*=\s*(2[6-9]|30)\s*;/.test(S.runSrc) && S.w('held'), do: t3('Morning again: turn the sun on.', 'फिर सुबह: धूप चालू कीजिए।', 'Phir subah: dhoop chalu kijiye.'),
        see: live((lg, R) => (R.held === undefined ? '' : pick(lg, `Your results: in full sun the fan now holds the house at ${R.held} °C (with hot = 32 it climbed to ${R.tMax} °C). Farmers in polyhouses grow tomatoes, capsicum and flowers this way, with the same three sensors.`, `आपके नतीजे: तेज़ धूप में पंखा अब घर को ${R.held} °C पर रखता है (hot = 32 के साथ यह ${R.tMax} °C तक चढ़ा था)। पॉलीहाउस में किसान टमाटर, शिमला मिर्च और फूल ऐसे ही उगाते हैं, इन्हीं तीन सेंसरों के साथ।`, `Aapke results: tez dhoop mein pankha ab ghar ko ${R.held} °C par rakhta hai (hot = 32 ke saath yeh ${R.tMax} °C tak chadha tha). Polyhouse mein kisaan tamatar, shimla mirch aur phool aise hi ugaate hain, inhi teen sensoron ke saath.`))) },
    ],
    check: [noShort, (S) => (S.conn('rail:bp', '5V') && S.conn('rail:bn', 'GND') ? null : [W.vRail]), has('dht', t3('DHT11', 'DHT11', 'DHT11')), (S) => (S.conn('dht.DATA', 'D2') && S.conn('dht.VCC', '5V') && S.conn('dht.GND', 'GND') ? null : [XG.dht]),
      has('rl2', t3('second relay', 'दूसरा रिले', 'doosra relay')), has('fan', t3('fan', 'पंखा', 'pankha')), (S) => (S.conn('rl2.S', 'D8') && S.conn('rl2.VCC', '5V') && S.conn('rl2.GND', 'GND') && S.conn('bat2.P', 'rl2.COM') && S.conn('rl2.NO', 'fan.P') && S.conn('fan.N', 'bat2.N') ? null : [XG.fan])],
    done: (S) => /int\s+hot\s*=\s*(2[6-9]|30)\s*;/.test(S.runSrc || '') && S.w('held') });

  // 8 ---------------------------------------------------------------------------------------------- Pico weather station (I2C OLED)
  const XW = {
    oledPow: t3('The OLED: GND to the − rail, VCC to the Pico\'s 3V3 pin. On 5 V (VBUS) its own pull-ups would put 5 V on SDA and SCL, too much for the Pico.', 'ओएलईडी: GND − रेल पर, VCC Pico के 3V3 पिन पर। 5 V (VBUS) पर इसके अपने पुल-अप SDA और SCL पर 5 V डालेंगे, Pico के लिए बहुत ज़्यादा।', 'OLED: GND − rail par, VCC Pico ke 3V3 pin par. 5 V (VBUS) par iske apne pull-up SDA aur SCL par 5 V daalenge, Pico ke liye bahut zyada.'),
    swap: t3('SDA and SCL are swapped: SDA (data) goes to GP4, SCL (clock) to GP5. Swapped, nothing answers on the bus.', 'SDA और SCL उल्टे हैं: SDA (डेटा) GP4 पर, SCL (क्लॉक) GP5 पर। उल्टे हों तो बस पर कोई जवाब नहीं देता।', 'SDA aur SCL ulte hain: SDA (data) GP4 par, SCL (clock) GP5 par. Ulte hon to bus par koi jawab nahi deta.'),
    bus: t3('The OLED\'s SDA goes to GP4 and its SCL to GP5: those two are I2C0 in the program.', 'ओएलईडी का SDA, GP4 पर और SCL, GP5 पर: प्रोग्राम में यही दोनों I2C0 हैं।', 'OLED ka SDA, GP4 par aur SCL, GP5 par: program mein yahi dono I2C0 hain.'),
    dht: t3('The DHT11: DATA (left, column 40) to GP14, + (middle) to the Pico\'s 3V3, − (right) to the front − rail.', 'DHT11: DATA (बायाँ, कॉलम 40) GP14 पर, + (बीच) Pico के 3V3 पर, − (दायाँ) आगे वाली − रेल पर।', 'DHT11: DATA (left, column 40) GP14 par, + (beech) Pico ke 3V3 par, − (right) aage wali − rail par.'),
  };
  L.push({ id: 'pico_weather', board: 'pico', cls: '9', blocks: false, view: 'wide', rview: 'scene3', code: PWEATHER, drawer: ['oled', 'dht11'], serial: true, scene: { kind: 'air', sky: true },
    title: t3('Weather station on the Pico: DHT11 and OLED', 'Pico पर मौसम केंद्र: DHT11 और ओएलईडी', 'Pico par weather station: DHT11 aur OLED'),
    goal: t3('Temperature, humidity and a thermometer bar on a 128 × 64 OLED, in MicroPython. The screen talks I2C: two wires shared by many modules, each at its own address.', 'MicroPython में 128 × 64 ओएलईडी पर तापमान, नमी और थर्मामीटर की पट्टी। स्क्रीन I2C बोलती है: दो तार जिन्हें कई मॉड्यूल बाँटते हैं, हर एक अपने पते पर।', 'MicroPython mein 128 × 64 OLED par temperature, nami aur thermometer ki patti. Screen I2C bolti hai: do taar jinhe kai module baant-te hain, har ek apne address par.'),
    setup: { parts: [], wires: PICO_POWER },
    steps: [
      { k: 'info', do: t3('Two modules today. The OLED speaks I2C: SDA carries the data, SCL the clock. On the Pico, GP4 and GP5 make the bus I2C0. The DHT11 has its own one-wire talk on GP14.', 'आज दो मॉड्यूल। ओएलईडी I2C बोलती है: SDA डेटा लाता है, SCL घड़ी। Pico पर GP4 और GP5 मिलकर बस I2C0 बनाते हैं। DHT11 GP14 पर अपनी एक-तार वाली बात करता है।', 'Aaj do module. OLED I2C bolti hai: SDA data laata hai, SCL ghadi. Pico par GP4 aur GP5 milkar bus I2C0 banate hain. DHT11 GP14 par apni ek-taar wali baat karta hai.'), see: E },
      { k: 'place', place: P('oled', 'oled', {}, 'e30', 0), do: t3('Plug the OLED\'s four pins into 30e–33e, its screen over the breadboard.', 'ओएलईडी के चार पिन 30e–33e में लगाइए, स्क्रीन ब्रेडबोर्ड के ऊपर।', 'OLED ke chaar pin 30e–33e mein lagaiye, screen breadboard ke upar.'), see: E },
      w3('oled', 'GND', 'rail:tn', 'Its GND (column 30) to the back − rail.', 'इसका GND (कॉलम 30) पीछे वाली − रेल से।', 'Iska GND (column 30) peeche wali − rail se.'),
      w3('oled', 'VCC', '3V3', 'Its VCC (column 31) to the Pico\'s 3V3 pin.', 'इसका VCC (कॉलम 31) Pico के 3V3 पिन से।', 'Iska VCC (column 31) Pico ke 3V3 pin se.'),
      w3('oled', 'SCL', 'GP5', 'Its SCL (column 32) to GP5.', 'इसका SCL (कॉलम 32) GP5 से।', 'Iska SCL (column 32) GP5 se.'),
      w3('oled', 'SDA', 'GP4', 'Its SDA (column 33) to GP4.', 'इसका SDA (कॉलम 33) GP4 से।', 'Iska SDA (column 33) GP4 se.'),
      { k: 'place', place: P('dht', 'dht11', {}, 'j40', 0), do: t3('Plug the DHT11 into 40j–42j, its grille facing you.', 'DHT11 को 40j–42j में लगाइए, जाली आपकी तरफ़।', 'DHT11 ko 40j–42j mein lagaiye, jaali aapki taraf.'), see: E },
      w3('dht', 'DATA', 'GP14', 'Its left pin (DATA) to GP14.', 'इसका बायाँ पिन (DATA) GP14 से।', 'Iska left pin (DATA) GP14 se.'),
      w3('dht', 'VCC', '3V3', 'Its middle pin (+) to the Pico\'s 3V3 too.', 'इसका बीच वाला पिन (+) भी Pico के 3V3 से।', 'Iska beech wala pin (+) bhi Pico ke 3V3 se.'),
      w3('dht', 'GND', 'rail:bn', 'Its right pin (−) to the front − rail.', 'इसका दायाँ पिन (−) आगे वाली − रेल से।', 'Iska right pin (−) aage wali − rail se.'),
      CHECK,
      { k: 'info', code: [7, 9], do: t3('i2c.scan() asks every address on the bus who is there; the OLED answers at 0x3c. ssd1306 is a small driver file you copy to the Pico once; it draws in memory, and show() sends the whole picture.', 'i2c.scan() बस के हर पते से पूछता है कि कौन है; ओएलईडी 0x3c पर जवाब देती है। ssd1306 एक छोटी ड्राइवर फ़ाइल है जिसे आप एक बार Pico पर कॉपी करते हैं; यह मेमोरी में चित्र बनाती है, और show() पूरा चित्र भेजता है।', 'i2c.scan() bus ke har address se poochta hai ki kaun hai; OLED 0x3c par jawab deti hai. ssd1306 ek chhoti driver file hai jise aap ek baar Pico par copy karte hain; yeh memory mein chitra banati hai, aur show() poora chitra bhejta hai.'), see: E },
      RUN(t3('"I2C found: [\'0x3c\']" on the shell, then the readings on the screen.', 'शेल पर "I2C found: [\'0x3c\']", फिर स्क्रीन पर रीडिंग।', 'Shell par "I2C found: [\'0x3c\']", phir screen par reading.')),
      { k: 'watch', until: (S) => S.w('shown'), do: t3('Read the OLED.', 'ओएलईडी पढ़िए।', 'OLED padhiye.'), see: t3('Sunny: about 34 °C and 40 %. The bar is t × 128 ÷ 50 dots long.', 'धूप: लगभग 34 °C और 40 %। पट्टी t × 128 ÷ 50 बिंदु लंबी है।', 'Dhoop: lagbhag 34 °C aur 40 %. Patti t × 128 ÷ 50 dot lambi hai.') },
      { k: 'act', until: (S) => S.w('changed'), do: t3('Change the weather outside: try Rainy or Winter night.', 'बाहर का मौसम बदलिए: बारिश या सर्दी की रात आज़माइए।', 'Bahar ka mausam badaliye: baarish ya sardi ki raat aazmaiye.'), see: t3('The numbers follow a few seconds later: the DHT11 answers once every 2 s.', 'संख्याएँ कुछ सेकंड बाद बदलती हैं: DHT11 हर 2 s में एक बार जवाब देता है।', 'Sankhyaein kuch second baad badalti hain: DHT11 har 2 s mein ek baar jawab deta hai.') },
      { k: 'edit', test: (src) => /str\(\s*round\(\s*t\s*\*\s*1\.8\s*\+\s*32\s*\)\s*\)\s*\+\s*"\s*F"/.test(src), set: [[/"Temp: " \+ str\(t\) \+ " C"/, '"Temp: " + str(round(t * 1.8 + 32)) + " F"']],
        do: t3('Show Fahrenheit: change str(t) + " C" to str(round(t * 1.8 + 32)) + " F" and press Run.', 'फ़ारेनहाइट दिखाइए: str(t) + " C" को str(round(t * 1.8 + 32)) + " F" कीजिए और "चलाइए" दबाइए।', 'Fahrenheit dikhaiye: str(t) + " C" ko str(round(t * 1.8 + 32)) + " F" karo aur Run dabaiye.'), see: E },
      { k: 'watch', until: (S) => S.runSrc !== null && /1\.8/.test(S.runSrc) && S.w('fahrenheit'), do: t3('Read it again.', 'फिर से पढ़िए।', 'Phir se padhiye.'),
        see: live((lg, R) => (R.tMin === undefined ? '' : pick(lg, `Your results: the OLED showed ${R.tMin} °C to ${R.tMax} °C as the weather changed${R.tF ? ', and ' + R.tF + ' °F at the end' : ''}. The same screen and driver work with any sensor: the Pico's I2C bus can carry many modules on the same two wires.`, `आपके नतीजे: मौसम बदलने पर ओएलईडी ने ${R.tMin} °C से ${R.tMax} °C तक दिखाया${R.tF ? ', और आख़िर में ' + R.tF + ' °F' : ''}। यही स्क्रीन और ड्राइवर किसी भी सेंसर के साथ चलते हैं: Pico की I2C बस उन्हीं दो तारों पर कई मॉड्यूल ले जा सकती है।`, `Aapke results: mausam badalne par OLED ne ${R.tMin} °C se ${R.tMax} °C tak dikhaya${R.tF ? ', aur aakhir mein ' + R.tF + ' °F' : ''}. Yahi screen aur driver kisi bhi sensor ke saath chalte hain: Pico ki I2C bus unhi do taaron par kai module le ja sakti hai.`))) },
    ],
    check: [(S) => (S.conn('3V3', 'GND') || S.conn('VBUS', 'GND') ? [W.short] : null), has('oled', t3('OLED', 'ओएलईडी', 'OLED')), (S) => (S.conn('oled.VCC', '3V3') && S.conn('oled.GND', 'GND') ? null : [XW.oledPow]),
      (S) => (S.conn('oled.SDA', 'GP5') && S.conn('oled.SCL', 'GP4') ? [XW.swap] : null), (S) => (S.conn('oled.SDA', 'GP4') && S.conn('oled.SCL', 'GP5') ? null : [XW.bus]),
      has('dht', t3('DHT11', 'DHT11', 'DHT11')), (S) => (S.conn('dht.DATA', 'GP14') && S.conn('dht.VCC', '3V3') && S.conn('dht.GND', 'GND') ? null : [XW.dht])],
    done: (S) => /1\.8/.test(S.runSrc || '') && S.w('fahrenheit') && S.w('changed') });

  // 9 ---------------------------------------------------------------------------------------------- Pico RFID door lock (SPI)
  const PRF = [['SDA', 'GP1'], ['SCK', 'GP2'], ['MOSI', 'GP3'], ['MISO', 'GP4'], ['RST', 'GP0']];
  const XR = {
    rf5v: t3('The RC522 is on 5 V (VBUS): it is a 3.3 V chip and would be damaged. Its 3.3V pin goes to the Pico\'s 3V3.', 'RC522 5 V (VBUS) पर है: यह 3.3 V की चिप है और ख़राब हो जाएगी। इसका 3.3V पिन Pico के 3V3 पर जाता है।', 'RC522 5 V (VBUS) par hai: yeh 3.3 V ki chip hai aur kharab ho jaayegi. Iska 3.3V pin Pico ke 3V3 par jaata hai.'),
    rf: t3('The RC522\'s wires: SDA to GP1, SCK to GP2, MOSI to GP3, MISO to GP4, RST to GP0, GND to the − rail, 3.3V to the Pico\'s 3V3.', 'RC522 के तार: SDA GP1 पर, SCK GP2 पर, MOSI GP3 पर, MISO GP4 पर, RST GP0 पर, GND − रेल पर, 3.3V Pico के 3V3 पर।', 'RC522 ke taar: SDA GP1 par, SCK GP2 par, MOSI GP3 par, MISO GP4 par, RST GP0 par, GND − rail par, 3.3V Pico ke 3V3 par.'),
  };
  L.push({ id: 'pico_rfidlock', board: 'pico', cls: '9', blocks: false, view: 'wide', rview: 'scene3', code: PRFID, drawer: ['rfid'], serial: true, scene: { kind: 'door', ok: 'card' },
    title: t3('RFID door lock on the Pico', 'Pico पर आरएफ़आईडी दरवाज़ा लॉक', 'Pico par RFID darwaza lock'),
    goal: t3('The RC522 card reader on the Pico\'s SPI bus, in MicroPython: read a card\'s number, keep a list of allowed cards, and open the latch with a servo only for them.', 'MicroPython में Pico की SPI बस पर RC522 कार्ड रीडर: कार्ड का नंबर पढ़िए, अनुमति वाले कार्डों की सूची रखिए, और सिर्फ़ उन्हीं के लिए सर्वो से कुंडी खोलिए।', 'MicroPython mein Pico ki SPI bus par RC522 card reader: card ka number padhiye, anumati wale cardon ki list rakhiye, aur sirf unhi ke liye servo se kundi kholiye.'),
    setup: { parts: [F('sv1', 'servo', { mount: 'door' }, 178, 70, 1)], wires: [...PICO_POWER, ['T:sv1:GND', 'H:tn40'], ['T:sv1:VP', 'H:tp40'], ['T:sv1:SIG', 'H:j21']] },
    steps: [
      { k: 'info', do: t3('The door\'s latch servo is ready (signal on GP15, power from VBUS). The reader talks SPI, a fast four-wire bus: SCK the clock, MOSI the Pico\'s words, MISO the reader\'s answers, SDA (CS) "you, listen". On the Pico, GP2, GP3 and GP4 are SPI0.', 'दरवाज़े की कुंडी का सर्वो तैयार है (सिग्नल GP15 पर, पावर VBUS से)। रीडर SPI बोलता है, चार तारों वाली तेज़ बस: SCK घड़ी, MOSI Pico की बात, MISO रीडर का जवाब, SDA (CS) "तुम सुनो"। Pico पर GP2, GP3 और GP4, SPI0 हैं।', 'Darwaze ki kundi ka servo taiyaar hai (signal GP15 par, power VBUS se). Reader SPI bolta hai, chaar taaron wali tez bus: SCK ghadi, MOSI Pico ki baat, MISO reader ka jawab, SDA (CS) "tum suno". Pico par GP2, GP3 aur GP4, SPI0 hain.'), see: E },
      { k: 'place', place: F('rf', 'rfid', {}, 40, 152, 0), do: t3('Put the RFID reader on the mat at the ghost.', 'आरएफ़आईडी रीडर को मैट पर नीली आकृति पर रखिए।', 'RFID reader ko mat par neeli shape par rakhiye.'), see: E },
      ...PRF.map(([k, g]) => w3('rf', k, g, `Wire its ${k} to ${g}.`, `इसका ${k} ${g} से जोड़िए।`, `Iska ${k} ${g} se jodiye.`)),
      w3('rf', 'GND', 'rail:bn', 'GND to the front − rail.', 'GND को आगे वाली − रेल से।', 'GND ko aage wali − rail se.'),
      w3('rf', 'V33', '3V3', 'And 3.3V to the Pico\'s 3V3 pin, not VBUS!', 'और 3.3V को Pico के 3V3 पिन से, VBUS से नहीं!', 'Aur 3.3V ko Pico ke 3V3 pin se, VBUS se nahi!'),
      CHECK,
      { k: 'info', code: [6, 6], do: t3('MFRC522(spi_id=0, sck=2, miso=4, mosi=3, cs=1, rst=0) names every wire you just made. mfrc522 is a small driver file copied to the Pico, like ssd1306 for the OLED.', 'MFRC522(spi_id=0, sck=2, miso=4, mosi=3, cs=1, rst=0) अभी लगाए हर तार का नाम लेता है। mfrc522 एक छोटी ड्राइवर फ़ाइल है जो Pico पर कॉपी होती है, जैसे ओएलईडी के लिए ssd1306।', 'MFRC522(spi_id=0, sck=2, miso=4, mosi=3, cs=1, rst=0) abhi lagaye har taar ka naam leta hai. mfrc522 ek chhoti driver file hai jo Pico par copy hoti hai, jaise OLED ke liye ssd1306.'), see: E },
      RUN(t3('"Show a card..." on the shell.', 'शेल पर "Show a card..."।', 'Shell par "Show a card...".')),
      { k: 'act', until: (S) => S.w('cardSeen') && S.w('denied'), do: t3('In the door panel, hold the white card on the reader. Read its number.', 'दरवाज़े के पैनल में सफ़ेद कार्ड रीडर पर रखिए। इसका नंबर पढ़िए।', 'Darwaze ke panel mein safed card reader par rakhiye. Iska number padhiye.'), see: t3('"Card: A3 4F 1C 2D", then "Access denied": it is not on the list yet.', '"Card: A3 4F 1C 2D", फिर "Access denied": यह अभी सूची में नहीं है।', '"Card: A3 4F 1C 2D", phir "Access denied": yeh abhi list mein nahi hai.') },
      { k: 'edit', test: (src) => /ALLOWED\s*=\s*\[[^\]]*"A3 4F 1C 2D"/i.test(src), set: [[/"00 00 00 00"/, '"A3 4F 1C 2D"']], do: t3('Put your card on the list: in ALLOWED, change "00 00 00 00" to "A3 4F 1C 2D" and press Run.', 'अपना कार्ड सूची में डालिए: ALLOWED में "00 00 00 00" को "A3 4F 1C 2D" कीजिए और "चलाइए" दबाइए।', 'Apna card list mein daaliye: ALLOWED mein "00 00 00 00" ko "A3 4F 1C 2D" karo aur Run dabaiye.'), see: E },
      { k: 'act', until: (S) => S.runSrc !== null && /A3 4F 1C 2D/.test(S.runSrc) && S.w('opened'), do: t3('Hold the white card on the reader again.', 'सफ़ेद कार्ड फिर से रीडर पर रखिए।', 'Safed card phir se reader par rakhiye.'), see: t3('Welcome! The latch turns to 90°, the door swings open, and 3 s later it locks again.', 'स्वागत है! कुंडी 90° घूमती है, दरवाज़ा खुलता है, और 3 s बाद फिर बंद।', 'Swagat hai! Kundi 90° ghoomti hai, darwaza khulta hai, aur 3 s baad phir band.') },
      { k: 'act', until: (S) => S.runSrc !== null && S.w('opened') && S.w('denied') && lineSeen(S, /Card: 5B 2E 91 C4/) && lineSeen(S, /Access denied/), do: t3('Now try the blue tag.', 'अब नीला टैग आज़माइए।', 'Ab neela tag aazmaiye.'),
        see: t3('Refused: 5B 2E 91 C4 is not in ALLOWED. A list makes it easy to add a whole class: one string for each card, separated by commas.', 'मना: 5B 2E 91 C4, ALLOWED में नहीं है। सूची से पूरी कक्षा जोड़ना आसान है: हर कार्ड के लिए एक स्ट्रिंग, कॉमा से अलग।', 'Mana: 5B 2E 91 C4, ALLOWED mein nahi hai. List se poori class jodna aasaan hai: har card ke liye ek string, comma se alag.') },
    ],
    check: [(S) => (S.conn('3V3', 'GND') || S.conn('VBUS', 'GND') ? [W.short] : null), has('rf', t3('RFID reader', 'आरएफ़आईडी रीडर', 'RFID reader')), (S) => (S.conn('rf.V33', 'VBUS') ? [XR.rf5v] : null),
      (S) => (PRF.every(([k, g]) => S.conn('rf.' + k, g)) && S.conn('rf.GND', 'GND') && S.conn('rf.V33', '3V3') ? null : [XR.rf])],
    done: (S) => /A3 4F 1C 2D/.test(S.runSrc || '') && S.w('opened') && S.w('denied') });

  // 5, 6 ------------------------------------------------------------------------------------------- the Pico robot cars
  const CARPARTS = [F('drv', 'l298n', {}, -35, 105, 0), F('bat', 'bat18650', {}, -190, 108, 0), F('mL', 'bomotor', { side: 'L' }, -80, 152, 3), F('mR', 'bomotor', { side: 'R' }, 10, 152, 1)];
  const PICO_BACK_COL = { 16: 21, 17: 20, 18: 18, 19: 17, 20: 16, 21: 15 }; // GP -> the breadboard column of its pin (back row)
  const PDRV = [['IN1', 16], ['IN2', 17], ['IN3', 18], ['IN4', 19], ['ENA', 20], ['ENB', 21]];
  const CARW = [['T:bat:P', 'T:drv:VS'], ['T:bat:N', 'T:drv:GND'], ['T:mL:P', 'T:drv:OUT1'], ['T:mL:N', 'T:drv:OUT2'], ['T:mR:P', 'T:drv:OUT3'], ['T:mR:N', 'T:drv:OUT4'], ...PDRV.map(([k, g]) => ['T:drv:' + k, 'H:a' + PICO_BACK_COL[g]]), ...PICO_POWER]; // (setup wires go to the holes beside the Pico's pins)
  const XC = {
    drvGnd: t3('The L298N\'s GND must be joined to the Pico\'s GND too (common ground), or IN1–IN4 mean nothing to it.', 'L298N का GND, Pico के GND से भी जुड़ना चाहिए (कॉमन ग्राउंड), वरना IN1–IN4 का उसके लिए कोई मतलब नहीं।', 'L298N ka GND, Pico ke GND se bhi judna chahiye (common ground), warna IN1–IN4 ka uske liye koi matlab nahi.'),
    ir: t3('The {x} IR sensor: VCC to the Pico\'s 3V3 pin (its OUT then stays at 3.3 V), GND to the − rail, OUT to {p}.', '{x} IR सेंसर: VCC, Pico के 3V3 पिन पर (तब इसका OUT 3.3 V पर रहता है), GND − रेल पर, OUT {p} पर।', '{x} IR sensor: VCC, Pico ke 3V3 pin par (tab iska OUT 3.3 V par rehta hai), GND − rail par, OUT {p} par.'),
    ir5: t3('An IR sensor is on 5 V (VBUS): its OUT would then put 5 V on a Pico pin. Move its VCC to the 3V3 pin.', 'एक IR सेंसर 5 V (VBUS) पर है: तब इसका OUT Pico के पिन पर 5 V डालेगा। इसका VCC 3V3 पिन पर लगाइए।', 'Ek IR sensor 5 V (VBUS) par hai: tab iska OUT Pico ke pin par 5 V daalega. Iska VCC 3V3 pin par lagaiye.'),
    echoDirect: t3('Echo goes straight to GP13: the HC-SR04 answers with 5 V, too much for the Pico. Use the divider: Echo → 1 kΩ → the middle → 2.2 kΩ → GND, and GP13 from the middle.', 'Echo सीधे GP13 पर है: HC-SR04 5 V से जवाब देता है, Pico के लिए बहुत ज़्यादा। डिवाइडर लगाइए: Echo → 1 kΩ → बीच → 2.2 kΩ → GND, और GP13 बीच से।', 'Echo seedhe GP13 par hai: HC-SR04 5 V se jawab deta hai, Pico ke liye bahut zyada. Divider lagaiye: Echo → 1 kΩ → beech → 2.2 kΩ → GND, aur GP13 beech se.'),
    us: t3('The HC-SR04: VCC to the back + rail (VBUS, 5 V), GND to the back − rail, Trig to GP14, Echo through the divider to GP13.', 'HC-SR04: VCC पीछे वाली + रेल (VBUS, 5 V) पर, GND पीछे वाली − रेल पर, Trig GP14 पर, Echo डिवाइडर से होकर GP13 पर।', 'HC-SR04: VCC peeche wali + rail (VBUS, 5 V) par, GND peeche wali − rail par, Trig GP14 par, Echo divider se hokar GP13 par.'),
    sv: t3('The servo: brown to the − rail, red to the back + rail (VBUS, 5 V), orange to GP15.', 'सर्वो: भूरा − रेल पर, लाल पीछे वाली + रेल (VBUS, 5 V) पर, नारंगी GP15 पर।', 'Servo: bhoora − rail par, laal peeche wali + rail (VBUS, 5 V) par, naarangi GP15 par.'),
  };
  const carFresh = (S) => S.running() && S.fresh();
  const driveChk = [(S) => (S.conn('3V3', 'GND') || S.conn('VBUS', 'GND') ? [W.short] : null), (S) => (S.conn('drv.GND', 'GND') ? null : [XC.drvGnd])];
  const LEFT = t3('left', 'बायाँ', 'left'), RIGHT = t3('right', 'दायाँ', 'right');
  const irWires = (tag, gp, side) => [w3(tag, 'VCC', '3V3', `Wire the ${side.en} sensor's VCC to the Pico's 3V3 pin.`, `${side.hi} सेंसर का VCC Pico के 3V3 पिन से जोड़िए।`, `${side.hg} sensor ka VCC Pico ke 3V3 pin se jodiye.`),
    w3(tag, 'GND', 'rail:bn', 'Its GND to the front − rail.', 'इसका GND आगे वाली − रेल से।', 'Iska GND aage wali − rail se.'), w3(tag, 'OUT', 'GP' + gp, `Its OUT to GP${gp}.`, `इसका OUT, GP${gp} से।`, `Iska OUT, GP${gp} se.`)];
  L.push({ id: 'pico_linecar', board: 'pico', cls: '9', view: 'carbench', wview: 'carbench', rview: 'arena', code: PLINE, drawer: ['ir'], world: { kind: 'car', car: 'line' },
    title: t3('Line-follower car on the Pico', 'Pico पर लाइन फ़ॉलोअर कार', 'Pico par line follower car'),
    goal: t3('The Class 7 line follower, now on a Raspberry Pi Pico in MicroPython: the same two IR sensors and L298N, PWM in percent, and the same tuning of speed against turns.', 'कक्षा 7 वाली लाइन फ़ॉलोअर, अब Raspberry Pi Pico पर MicroPython में: वही दो IR सेंसर और L298N, प्रतिशत में PWM, और रफ़्तार बनाम मोड़ की वही ट्यूनिंग।', 'Class 7 wali line follower, ab Raspberry Pi Pico par MicroPython mein: wahi do IR sensor aur L298N, percent mein PWM, aur speed vs mod ki wahi tuning.'),
    setup: { parts: CARPARTS, wires: CARW },
    steps: [
      { k: 'info', do: t3('The car is on the track (🏁 Robot view); its drive is on the bench: the battery on the L298N, the motors on OUT1–OUT4, and IN1–IN4, ENA, ENB on GP16–GP21.', 'कार ट्रैक पर है (🏁 रोबोट व्यू); इसकी ड्राइव बेंच पर है: बैटरी L298N पर, मोटरें OUT1–OUT4 पर, और IN1–IN4, ENA, ENB, GP16–GP21 पर।', 'Car track par hai (🏁 Robot view); iski drive bench par hai: battery L298N par, motors OUT1–OUT4 par, aur IN1–IN4, ENA, ENB, GP16–GP21 par.'),
        see: t3('The L298N reads the Pico\'s 3.3 V as HIGH, so no level shifter is needed for its inputs.', 'L298N, Pico के 3.3 V को HIGH पढ़ता है, इसलिए इसके इनपुट के लिए लेवल शिफ़्टर नहीं चाहिए।', 'L298N, Pico ke 3.3 V ko HIGH padhta hai, isliye iske input ke liye level shifter nahi chahiye.') },
      w3('drv', 'GND', 'GND', 'Join the L298N\'s GND terminal to a GND pin of the Pico.', 'L298N के GND टर्मिनल को Pico के किसी GND पिन से जोड़िए।', 'L298N ke GND terminal ko Pico ke kisi GND pin se jodiye.', t3('Common ground: without it the car will not move.', 'कॉमन ग्राउंड: इसके बिना कार नहीं चलेगी।', 'Common ground: iske bina car nahi chalegi.')),
      { k: 'place', place: F('irL', 'ir', {}, 140, 62, 2), do: t3('Put an IR sensor at the left ghost: the car\'s left sensor.', 'एक IR सेंसर बाईं नीली आकृति पर रखिए: कार का बायाँ सेंसर।', 'Ek IR sensor left neeli shape par rakhiye: car ka left sensor.'), see: E },
      { k: 'place', place: F('irR', 'ir', {}, 178, 62, 2), do: t3('And the second at the right ghost.', 'और दूसरा दाईं नीली आकृति पर।', 'Aur doosra right neeli shape par.'), see: E },
      ...irWires('irL', 14, LEFT), ...irWires('irR', 15, RIGHT),
      CHECK,
      { k: 'info', code: [9, 17], do: t3('wheel() and drive() are the Uno\'s motor() and drive() in Python: the direction on two pins, the speed as a PWM duty, 0–65535 for 0–100 %.', 'wheel() और drive() Uno के motor() और drive() ही हैं, Python में: दो पिन पर दिशा, PWM ड्यूटी से रफ़्तार, 0–100 % के लिए 0–65535।', 'wheel() aur drive() Uno ke motor() aur drive() hi hain, Python mein: do pin par disha, PWM duty se speed, 0–100 % ke liye 0–65535.'), see: E },
      { k: 'run', do: t3('Press Run.', '"चलाइए" दबाइए।', 'Run dabaiye.'), see: t3('Run puts the car at START.', '"चलाइए" कार को START पर रखता है।', 'Run car ko START par rakhta hai.') },
      { k: 'watch', until: (S) => carFresh(S) && S.w('lap'), do: t3('Watch one lap.', 'एक चक्कर देखिए।', 'Ek chakkar dekhiye.'), see: t3('The same rule as on the Uno: the tape under one sensor, that wheel stops, the car turns back to the line.', 'Uno वाला ही नियम: एक सेंसर के नीचे टेप, वह पहिया रुकता है, कार लाइन पर लौटती है।', 'Uno wala hi niyam: ek sensor ke neeche tape, woh wheel rukta hai, car line par lautti hai.') },
      { k: 'edit', test: (src) => /speed\s*=\s*(8\d|9\d|100)\b/.test(src), set: [[/speed = 45 /, 'speed = 85 ']], do: t3('Faster: change speed = 45 to speed = 85 and press Run.', 'तेज़: speed = 45 को speed = 85 कीजिए और "चलाइए" दबाइए।', 'Tez: speed = 45 ko speed = 85 karo aur Run dabaiye.'), see: E },
      { k: 'watch', until: (S) => carFresh(S) && (S.w('lost') || S.w('lap')), do: t3('Watch the S-bend.', 'S-मोड़ देखिए।', 'S-mod dekhiye.'), see: t3('Too fast for a stopped inside wheel: it runs off the line.', 'रुके हुए अंदर वाले पहिये के लिए बहुत तेज़: यह लाइन से उतर जाती है।', 'Ruke hue andar wale wheel ke liye bahut tez: yeh line se utar jaati hai.') },
      { k: 'edit', test: (src) => /turn\s*=\s*-\s*(speed\s*\/\/?\s*2|[3-9]\d)\b/.test(src) && /speed\s*=\s*(8\d|9\d|100)\b/.test(src), set: [[/turn = 0 /, 'turn = -speed // 2 ']],
        do: t3('Let the inside wheel go backwards at half speed: change turn = 0 to turn = -speed // 2 and press Run.', 'अंदर वाले पहिये को आधी रफ़्तार से पीछे चलने दीजिए: turn = 0 को turn = -speed // 2 कीजिए और "चलाइए" दबाइए।', 'Andar wale wheel ko aadhi speed se peeche chalne dijiye: turn = 0 ko turn = -speed // 2 karo aur Run dabaiye.'), see: E },
      { k: 'watch', until: (S) => carFresh(S) && S.w('lap') && !S.w('lost'), do: t3('Watch a full lap at 85 %.', '85 % पर एक पूरा चक्कर देखिए।', '85 % par ek poora chakkar dekhiye.'),
        see: t3('It holds the line again. // is Python\'s whole-number division: -85 // 2 is -43, a backwards wheel that swings the car round the bend.', 'यह फिर लाइन पकड़े रहती है। // Python का पूरे अंक वाला भाग है: -85 // 2 बराबर -43, पीछे चलता पहिया जो कार को मोड़ पर घुमा देता है।', 'Yeh phir line pakde rehti hai. // Python ka poore ank wala bhaag hai: -85 // 2 barabar -43, peeche chalta wheel jo car ko mod par ghuma deta hai.') },
    ],
    check: [...driveChk, has('irL', t3('left IR sensor', 'बायाँ IR सेंसर', 'left IR sensor')), has('irR', t3('right IR sensor', 'दायाँ IR सेंसर', 'right IR sensor')), (S) => (S.conn('irL.VCC', 'VBUS') || S.conn('irR.VCC', 'VBUS') ? [XC.ir5] : null),
      ...[['irL', 14, LEFT], ['irR', 15, RIGHT]].map(([k, gp, sd]) => (S) => (S.conn(k + '.VCC', '3V3') && S.conn(k + '.GND', 'GND') && S.conn(k + '.OUT', 'GP' + gp) ? null : [XC.ir, { x: sd, p: 'GP' + gp }]))],
    done: (S) => S.w('lap') && !S.w('lost') && /turn\s*=\s*-/.test(S.runSrc || '') });

  L.push({ id: 'pico_avoidcar', board: 'pico', cls: '9', view: 'carbench', wview: 'carbench', rview: 'arena', code: PAVOID, drawer: ['hcsr04', 'servo', 'resistor'], serial: true, world: { kind: 'car', car: 'avoid' },
    title: t3('Obstacle-avoiding car on the Pico', 'Pico पर बाधा से बचने वाली कार', 'Pico par baadha se bachne wali car'),
    goal: t3('An HC-SR04 on a servo looks ahead, left and right, and the Pico steers the car round a room of boxes. The sensor speaks 5 V, the Pico 3.3 V: a divider sits between them.', 'सर्वो पर लगा HC-SR04 आगे, बाएँ और दाएँ देखता है, और Pico डिब्बों वाले कमरे में कार को घुमाता है। सेंसर 5 V बोलता है, Pico 3.3 V: बीच में एक डिवाइडर।', 'Servo par laga HC-SR04 aage, left aur right dekhta hai, aur Pico dibbon wale kamre mein car ko ghumata hai. Sensor 5 V bolta hai, Pico 3.3 V: beech mein ek divider.'),
    setup: { parts: [...CARPARTS, P('rd1', 'resistor', { ohms: 1000 }, 'g52', 2), P('rd2', 'resistor', { ohms: 2200 }, 'j48', 1)], wires: [...CARW, ['T:drv:GND', 'H:j14']] }, // (GND3, column 14)
    steps: [
      { k: 'info', do: t3('The car (🏁 Robot view) is in a room with boxes; its drive is wired as in the line follower. Ready on the breadboard: a 1 kΩ (48g–52g) and a 2.2 kΩ (48j into the − rail), the Echo divider.', 'कार (🏁 रोबोट व्यू) डिब्बों वाले कमरे में है; इसकी ड्राइव लाइन फ़ॉलोअर जैसी जुड़ी है। ब्रेडबोर्ड पर तैयार: 1 kΩ (48g–52g) और 2.2 kΩ (48j से − रेल में), Echo का डिवाइडर।', 'Car (🏁 Robot view) dibbon wale kamre mein hai; iski drive line follower jaisi judi hai. Breadboard par taiyaar: 1 kΩ (48g–52g) aur 2.2 kΩ (48j se − rail mein), Echo ka divider.'), see: E },
      { k: 'place', place: P('us1', 'hcsr04', {}, 'j50', 0), do: t3('Plug the ultrasonic sensor into 50j–53j: its Echo (column 52) meets the 1 kΩ.', 'अल्ट्रासोनिक सेंसर को 50j–53j में लगाइए: इसका Echo (कॉलम 52) 1 kΩ से मिलता है।', 'Ultrasonic sensor ko 50j–53j mein lagaiye: iska Echo (column 52) 1 kΩ se milta hai.'), see: E },
      w3('us1', 'VCC', 'rail:tp', 'VCC (column 50) to the back + rail (5 V from VBUS).', 'VCC (कॉलम 50) को पीछे वाली + रेल (VBUS से 5 V) से।', 'VCC (column 50) ko peeche wali + rail (VBUS se 5 V) se.'),
      w3('us1', 'GND', 'rail:tn', 'GND (column 53) to the back − rail.', 'GND (कॉलम 53) को पीछे वाली − रेल से।', 'GND (column 53) ko peeche wali − rail se.'),
      w3('us1', 'TRIG', 'GP14', 'Trig (column 51) to GP14: a 3.3 V ping is enough for it.', 'Trig (कॉलम 51) को GP14 से: इसके लिए 3.3 V की पिंग काफ़ी है।', 'Trig (column 51) ko GP14 se: iske liye 3.3 V ki ping kaafi hai.'),
      w3('rd2', '1', 'GP13', 'The divider\'s middle (column 48) to GP13.', 'डिवाइडर का बीच (कॉलम 48) GP13 से।', 'Divider ka beech (column 48) GP13 se.', t3('5 V × 2.2 / 3.2 = 3.4 V: just inside what a Pico pin can take.', '5 V × 2.2 / 3.2 = 3.4 V: Pico का पिन जितना सह सकता है, उसके अंदर।', '5 V × 2.2 / 3.2 = 3.4 V: Pico ka pin jitna seh sakta hai, uske andar.')),
      { k: 'place', place: F('sv1', 'servo', {}, 150, 100, 2), do: t3('Put the servo on the mat at the ghost: on the car it turns the sensor.', 'सर्वो को मैट पर नीली आकृति पर रखिए: कार पर यह सेंसर घुमाता है।', 'Servo ko mat par neeli shape par rakhiye: car par yeh sensor ghumata hai.'), see: E },
      w3('sv1', 'GND', 'rail:bn', 'Its brown wire to the front − rail.', 'इसका भूरा तार आगे वाली − रेल से।', 'Iska bhoora taar aage wali − rail se.'),
      w3('sv1', 'VP', 'rail:tp', 'Its red wire to the back + rail (5 V).', 'इसका लाल तार पीछे वाली + रेल (5 V) से।', 'Iska laal taar peeche wali + rail (5 V) se.'),
      w3('sv1', 'SIG', 'GP15', 'Its orange wire to GP15.', 'इसका नारंगी तार GP15 से।', 'Iska naarangi taar GP15 se.'),
      CHECK,
      { k: 'run', do: t3('Press Run.', '"चलाइए" दबाइए।', 'Run dabaiye.'), see: E },
      { k: 'watch', until: (S) => carFresh(S) && S.w('explored'), do: t3('Watch the car explore the room.', 'कार को कमरा घूमते देखिए।', 'Car ko kamra ghoomte dekhiye.'), see: t3('time_pulse_us() times the echo as pulseIn() does on the Uno; under 30 cm the car stops, looks both ways, and turns to the open side.', 'time_pulse_us() इको का समय वैसे ही नापता है जैसे Uno पर pulseIn(); 30 cm से कम पर कार रुकती है, दोनों तरफ़ देखती है, और खुली तरफ़ मुड़ती है।', 'time_pulse_us() echo ka time waise hi naapta hai jaise Uno par pulseIn(); 30 cm se kam par car rukti hai, dono taraf dekhti hai, aur khuli taraf mudti hai.') },
      { k: 'edit', test: (src) => /safe\s*=\s*[1-4]\b/.test(src), set: [[/safe = 30 /, 'safe = 3 ']], do: t3('What if it looks too late? Change safe = 30 to safe = 3 and press Run.', 'अगर यह बहुत देर से देखे तो? safe = 30 को safe = 3 कीजिए और "चलाइए" दबाइए।', 'Agar yeh bahut der se dekhe to? safe = 30 ko safe = 3 karo aur Run dabaiye.'), see: E },
      { k: 'watch', until: (S) => carFresh(S) && S.w('bump'), do: t3('Watch the first wall.', 'पहली दीवार देखिए।', 'Pehli deewar dekhiye.'), see: t3('Bump! The car moves while it measures, and the beam sees a slanted wall late: 3 cm is far too close.', 'टक्कर! नापते-नापते कार चलती रहती है, और तिरछी दीवार बीम को देर से दिखती है: 3 cm बहुत पास है।', 'Takkar! Naapte-naapte car chalti rehti hai, aur tirchhi deewar beam ko der se dikhti hai: 3 cm bahut paas hai.') },
      { k: 'edit', test: (src) => /safe\s*=\s*(2\d|3\d|40)\b/.test(src), set: [[/safe = 3 /, 'safe = 25 ']], do: t3('Choose a safe distance again: safe = 25, and Run.', 'फिर से सुरक्षित दूरी चुनिए: safe = 25, और "चलाइए"।', 'Phir se safe doori chuniye: safe = 25, aur Run.'), see: E },
      { k: 'watch', until: (S) => carFresh(S) && S.w('explored') && S.wv('exploredBumps') === 0, do: t3('Watch it drive round without a bump.', 'इसे बिना टक्कर घूमते देखिए।', 'Ise bina takkar ghoomte dekhiye.'), see: t3('The same program idea as on the Uno, in another language on another chip: once you know the idea, the board is a detail.', 'Uno वाला ही प्रोग्राम का विचार, दूसरी भाषा में दूसरी चिप पर: विचार समझ आ गया तो बोर्ड एक छोटी बात है।', 'Uno wala hi program ka vichaar, doosri bhasha mein doosri chip par: vichaar samajh aa gaya to board ek chhoti baat hai.') },
    ],
    check: [...driveChk, has('us1', t3('ultrasonic sensor', 'अल्ट्रासोनिक सेंसर', 'ultrasonic sensor')), (S) => (S.conn('us1.ECHO', 'GP13') ? [XC.echoDirect] : null),
      (S) => (S.conn('us1.VCC', 'VBUS') && S.conn('us1.GND', 'GND') && S.conn('us1.TRIG', 'GP14') && S.conn('rd2.1', 'GP13') && S.conn('us1.ECHO', 'rd1.1') ? null : [XC.us]),
      has('sv1', t3('servo', 'सर्वो', 'servo')), (S) => (S.conn('sv1.GND', 'GND') && S.conn('sv1.VP', 'VBUS') && S.conn('sv1.SIG', 'GP15') ? null : [XC.sv])],
    done: (S) => S.w('explored') && S.wv('exploredBumps') === 0 });

  for (const l of L) { l.n = ++n; l.batch = 17; l.tick = (S) => { RT.S = S; }; if (l.scene) l.world = l.scene; if (l.board === 'pico') l.lang = 'py'; }
  return L;
}
