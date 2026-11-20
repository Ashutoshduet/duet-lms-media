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
//   tracker    a dual-axis solar tracker: a pan servo and a tilt servo carry a small panel with a 4-LDR sun sensor (its
//              black cross shades the LDRs away from the sun; scenes3.js TrackerScene). The first program turns the pan the
//              wrong way (the servo is mounted the other way round): the panel runs away from the sun. Then, aligned, it
//              hunts: with no dead band (tol = 0) a one-count flicker moves a servo every loop, back and forth. tol = 25 calms
//              it (± 4°). Then a whole day (1 minute): the panel follows the sun, and makes more energy than a fixed one.
//   lift       a mini lift: three floors, the car on a cable wound by the stepper (a 20 mm pulley: 60 mm a floor is
//              60 ÷ 62.8 × 2048 = 1956 steps), call buttons on pins 2–4, the LCD. After a power cut the car is 25 mm above G,
//              but the program believes it is at G: called to floor 1 it stops between floors. The student wires the limit
//              switch at the bottom of the shaft (pin 5) and adds homing: in setup() the car goes down step by step until
//              it presses the switch, and only then counts floors (every 3D printer and real lift does this at start).
//   conveyor   a conveyor belt: the stepper turns the drive roller (30 mm: 94.2 mm of belt a turn), an IR sensor on the rail
//              finds each cardboard box, and a servo stamp marks it "QC OK" (scenes3.js ConveyorScene). The first program
//              runs the motor at 25 rpm: it hums and the belt stays still (the 28BYJ-48 cannot follow a step every 1.2 ms;
//              about 15 rpm is its top speed at 5 V). At 12 rpm the belt runs, but the sensor stays LOW for the whole box
//              while the loop moves only 2.9 mm at a time: one box is stamped again and again (and the bare belt behind it),
//              and counted each time. The fix waits until the box has passed the sensor (count the box arriving, not the
//              box being there): each box once, in the middle.
//   armsquare  the 4-servo arm holds a felt pen over a sheet of paper (robots.js ArmSim level 6). penAt(x, y, z) is inverse
//              kinematics: atan2 for the base, the cosine rule (acos) for the shoulder and elbow. The first program writes
//              the base's angle in radians (1.87 → 2°): it draws on the desk to the right. With degrees() it reaches the
//              paper, but each corner is a jump of all the joints at once (a joint move): the sides curve and the pen
//              lifts and digs. lineTo() (40 small steps along the line, each through penAt: a linear move) draws a square.
//   slider     a camera slider for time-lapse: the stepper turns a 20-tooth GT2 pulley (40 mm of belt a turn), the carriage
//              carries a small camera along a 2020 rail, and pin 7 clicks its shutter (an optocoupler on the remote socket;
//              the student wires the LED that stands for it). 12 photos 15 mm apart should cover 180 mm. The first program
//              takes the pulley as a 20 mm roller (2048 ÷ 62.8 = 32.6 steps a mm): the photos end at 114 mm. 20 teeth × 2 mm
//              = 40 mm a turn: 51.2 steps a mm. Then the photos are blurred: the shutter clicks while the carriage still
//              rocks from stopping (scenes3.js SliderScene); half a second's settling time makes every photo sharp.
// The helpers (t3, P, F, W, need, has, noShort) come from lessons.js. devtools/test/robocore24.mjs plays them end to end.
import { GLASS, CUR, LIFT, SLIDE } from './scenes3.js';
import { ARMCUR, CARCUR } from './robots.js';

const t3 = (en, hi, hg) => ({ en, hi, hg });
const pick = (lg, en, hi, hg) => (lg === 'hi' ? hi : lg === 'hg' ? hg : en);
function liveCar(f) { const o = {}; for (const lg of ['en', 'hi', 'hg']) Object.defineProperty(o, lg, { enumerable: true, get: () => { try { return String(f(lg, (CARCUR.sim && CARCUR.sim.lap) || {}) || ''); } catch (e) { return ''; } } }); return o; }
function liveCarSim(f) { const o = {}; for (const lg of ['en', 'hi', 'hg']) Object.defineProperty(o, lg, { enumerable: true, get: () => { try { return String(f(lg, CARCUR.sim || {}) || ''); } catch (e) { return ''; } } }); return o; }
function liveArm(f) { const o = {}; for (const lg of ['en', 'hi', 'hg']) Object.defineProperty(o, lg, { enumerable: true, get: () => { try { return String(f(lg, (ARMCUR.sim && ARMCUR.sim.res) || {}) || ''); } catch (e) { return ''; } } }); return o; }
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

const TRACK = `// Dual-axis solar tracker: four LDRs tell which way is brighter, and two servos turn the panel that way.
#include <Servo.h>
Servo pan;                      // turns the panel left and right
Servo tilt;                     // turns it up and down
int panA = 90;                  // the angles now
int tiltA = 120;
int tol = 0;                    // differences smaller than this are ignored

void setup() {
  pan.attach(9);
  tilt.attach(10);
  pan.write(panA);
  tilt.write(tiltA);
  Serial.begin(9600);
}

void loop() {
  int tl = analogRead(A0);      // the four LDRs: brighter = bigger
  int tr = analogRead(A1);
  int bl = analogRead(A2);
  int br = analogRead(A3);
  int dh = (tr + br) / 2 - (tl + bl) / 2;   // right minus left
  int dv = (tl + tr) / 2 - (bl + br) / 2;   // top minus bottom
  if (abs(dh) > tol) {
    if (dh > 0) panA = panA - 1;            // the sun is to the right: turn right
    else panA = panA + 1;
  }
  if (abs(dv) > tol) {
    if (dv > 0) tiltA = tiltA + 1;          // the sun is higher: tilt up
    else tiltA = tiltA - 1;
  }
  panA = constrain(panA, 0, 180);
  tiltA = constrain(tiltA, 90, 180);
  pan.write(panA);
  tilt.write(tiltA);
  Serial.print(dh);
  Serial.print(" ");
  Serial.println(dv);
  delay(30);
}
`;

const LIFTC = `// Mini lift: three floors. Press a call button and the stepper winds the cable to bring the car there.
#include <Stepper.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>

Stepper lift(2048, 8, 10, 9, 11);      // 28BYJ-48 (IN1, IN3, IN2, IN4), its pulley at the top of the shaft
LiquidCrystal_I2C lcd(0x27, 16, 2);
const int callPins[3] = {2, 3, 4};     // the call buttons of floors G, 1 and 2 (LOW = pressed)
const int limitPin = 5;                // the switch at the bottom of the shaft (LOW = the car is down)
const long stepsPerFloor = 1956;       // 60 mm a floor; one turn of the 20 mm pulley winds 62.8 mm
int floorNow = 0;                      // the floor the lift believes it is at

void showFloor() {
  lcd.clear();
  lcd.print("Floor ");
  if (floorNow == 0) lcd.print("G");
  else lcd.print(floorNow);
}

void setup() {
  for (int i = 0; i < 3; i++) pinMode(callPins[i], INPUT_PULLUP);
  pinMode(limitPin, INPUT_PULLUP);
  lift.setSpeed(15);
  lcd.init();
  lcd.backlight();
  Serial.begin(9600);
  showFloor();
}

void goTo(int f) {
  lcd.clear();
  lcd.print("Going...");
  lift.step((f - floorNow) * stepsPerFloor);
  floorNow = f;
  Serial.print("At floor ");
  Serial.println(floorNow);
  showFloor();
}

void loop() {
  for (int i = 0; i < 3; i++) {
    if (digitalRead(callPins[i]) == LOW && i != floorNow) goTo(i);
  }
}
`;

const CONVC = `// Conveyor belt: the stepper drives the belt, the IR sensor finds each box, and the stamp marks it "QC OK".
#include <Stepper.h>
#include <Servo.h>

Stepper belt(2048, 8, 10, 9, 11);      // 28BYJ-48: IN1-IN4 on pins 8-11 (the library wants IN1, IN3, IN2, IN4)
Servo stamp;
const int irPin = 2;                   // the IR sensor: LOW = a box in front of it
int rpm = 25;                          // the belt motor's speed (turns a minute)
int count = 0;                         // boxes stamped

void setup() {
  pinMode(irPin, INPUT);
  stamp.attach(6);
  stamp.write(0);                      // the stamp up
  belt.setSpeed(rpm);
  Serial.begin(9600);
  Serial.println("Conveyor ready");
}

void stampBox() {
  stamp.write(90);                     // bring the stamp down on the box
  delay(400);
  stamp.write(0);                      // and lift it
  delay(400);
}

void loop() {
  belt.step(64);                       // move the belt a little (64 steps = 2.9 mm)
  if (digitalRead(irPin) == LOW) {     // a box in front of the sensor
    stampBox();
    count++;
    Serial.print("Box ");
    Serial.print(count);
    Serial.println(" stamped");
  }
}
`;

const ARMSQ = `// Robot arm draws a square: a felt pen in the claw, a sheet of paper in front of the arm.
#include <Servo.h>

Servo base, shoulder, elbow, claw;
const float L1 = 105;     // shoulder to elbow (mm)
const float L2 = 180;     // elbow to the pen's tip (mm)
const float H = 78;       // the shoulder's height above the paper (mm)

// the square's corners (mm): x to the right, y towards you; the last is the first again
float sq[5][2] = {{-40, 130}, {40, 130}, {40, 210}, {-40, 210}, {-40, 130}};

// put the pen's tip at x, y on the paper and z mm above it (inverse kinematics)
void penAt(float x, float y, float z) {
  float b = atan2(y, x);                   // which way the base points
  float r = sqrt(x * x + y * y);           // how far out the tip is
  float h = z - H;                         // how far below the shoulder
  float d = sqrt(r * r + h * h);           // shoulder to tip, in a straight line
  float s = atan2(h, r) + acos((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d));
  float e = acos((L1 * L1 + L2 * L2 - d * d) / (2 * L1 * L2));
  base.write(b);
  shoulder.write(degrees(s));
  elbow.write(degrees(e));
}

// a straight line from (x1, y1) to (x2, y2), in 40 small steps
void lineTo(float x1, float y1, float x2, float y2) {
  for (int k = 1; k <= 40; k++) {
    float t = k / 40.0;
    penAt(x1 + (x2 - x1) * t, y1 + (y2 - y1) * t, 0);
    delay(25);
  }
}

void setup() {
  base.attach(3);
  shoulder.attach(5);
  elbow.attach(6);
  claw.attach(9);
  claw.write(95);                          // hold the pen tight
  Serial.begin(9600);
  penAt(sq[0][0], sq[0][1], 20);           // above the first corner
  delay(1500);
  penAt(sq[0][0], sq[0][1], 0);            // pen down
  delay(600);
  for (int i = 1; i < 5; i++) {
    penAt(sq[i][0], sq[i][1], 0);          // to the next corner
    delay(800);
  }
  penAt(sq[0][0], sq[0][1], 20);           // pen up
  Serial.println("Square done");
}

void loop() {
}
`;

const SLIDEC = `// Camera slider: a time-lapse along the rail, 12 photos 15 mm apart.
#include <Stepper.h>

Stepper slider(2048, 8, 10, 9, 11);     // the 28BYJ-48 turns the belt's pulley (IN1-IN4 on pins 8-11)
const int shutter = 7;                  // HIGH = click (an optocoupler on the camera's remote socket; the LED shows it)
float stepsPerMm = 2048 / (3.1416 * 20);   // steps for 1 mm of belt: one turn of the 20 mm pulley
const int photos = 12;
const float gap = 15;                   // mm between two photos

void setup() {
  pinMode(shutter, OUTPUT);
  slider.setSpeed(12);
  Serial.begin(9600);
  Serial.println("Time-lapse: 12 photos, 180 mm");
  for (int i = 1; i <= photos; i++) {
    slider.step(gap * stepsPerMm);      // move the camera on
    digitalWrite(shutter, HIGH);        // click
    delay(100);
    digitalWrite(shutter, LOW);
    Serial.print("Photo ");
    Serial.print(i);
    Serial.print(" at ");
    Serial.print(i * gap, 0);
    Serial.println(" mm");
    delay(300);
  }
  Serial.println("Done");
}

void loop() {
}
`;

const PIDC = `// PID line follower: five IR sensors tell how far the line is from the middle, and the motors steer by that much.
const int ENA = 5, IN1 = 7, IN2 = 8;    // motor A: the left wheel
const int ENB = 6, IN3 = 2, IN4 = 4;    // motor B: the right wheel
const int S[5] = {A0, A1, A2, A3, A4};  // the sensor bar, left to right (HIGH = over the black line)

int base = 150;          // speed on a straight line (0 .. 255)
float Kp = 90;           // how hard it steers for each sensor's worth of error
float Kd = 0;            // how hard it steers against a change in the error
float lastError = 0;

// one motor: v from -255 (backwards) to 255 (forwards)
void motor(int en, int a, int b, int v) {
  digitalWrite(a, v > 0 ? HIGH : LOW);
  digitalWrite(b, v < 0 ? HIGH : LOW);
  analogWrite(en, abs(v));
}

void setup() {
  pinMode(ENA, OUTPUT); pinMode(IN1, OUTPUT); pinMode(IN2, OUTPUT);
  pinMode(ENB, OUTPUT); pinMode(IN3, OUTPUT); pinMode(IN4, OUTPUT);
  for (int i = 0; i < 5; i++) pinMode(S[i], INPUT);
}

void loop() {
  int sum = 0, n = 0;
  for (int i = 0; i < 5; i++) {
    if (digitalRead(S[i]) == HIGH) {     // this sensor is over the line
      sum = sum + (i - 2);               // -2 far left ... +2 far right
      n = n + 1;
    }
  }
  float error;
  if (n > 0) error = (float)sum / n;     // where the line is: -2 .. +2 (0: right under the middle)
  else if (lastError > 0) error = 2.5;   // lost: it is past the side it was last seen on
  else error = -2.5;
  float turn = Kp * error + Kd * (error - lastError);
  lastError = error;
  int left = constrain(base + turn, -255, 255);
  int right = constrain(base - turn, -255, 255);
  motor(ENA, IN1, IN2, left);
  motor(ENB, IN3, IN4, right);
  delay(5);
}
`;

export function batch24(K, n0) {
  const { P, F, W, need, has, noShort } = K;
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
  // 3 --------------------------------------------------------------------------------------------- dual-axis solar tracker
  const LQ = [['TL', 'A0'], ['TR', 'A1'], ['BL', 'A2'], ['BR', 'A3']];
  const okPan = (src) => /if\s*\(\s*dh\s*>\s*0\s*\)\s*panA\s*=\s*panA\s*\+\s*1\s*;/.test(src || '') && /else\s+panA\s*=\s*panA\s*-\s*1\s*;/.test(src || '');
  const okTol = (src) => { const m = /int\s+tol\s*=\s*(\d+)\s*;/.exec(src || ''); return !!m && +m[1] >= 15 && +m[1] <= 40; };
  L.push({ id: 'tracker', cls: '11', blocks: false, view: 'wide', rview: 'scene3pt', code: TRACK, drawer: ['ldr4'], serial: true, scene: { kind: 'tracker' },
    title: t3('Dual-axis solar tracker', 'दो-अक्ष वाला सोलर ट्रैकर', 'Do-axis wala solar tracker'),
    goal: t3('A solar panel makes the most power facing the sun. Four LDRs split by a black cross tell which way is brighter, and two servos turn the panel there: left-right (pan) and up-down (tilt). Fix the direction, add a dead band so it stops hunting, and see how much more energy it makes in a day than a fixed panel.', 'सोलर पैनल सूरज की ओर मुँह करके सबसे ज़्यादा बिजली बनाता है। काले क्रॉस से बँटे चार एलडीआर बताते हैं कि किधर ज़्यादा रोशनी है, और दो सर्वो पैनल को उधर घुमाते हैं: बाएँ-दाएँ (पैन) और ऊपर-नीचे (टिल्ट)। दिशा ठीक कीजिए, डेड बैंड जोड़िए ताकि यह हिलना बंद करे, और देखिए एक दिन में यह स्थिर पैनल से कितनी ज़्यादा ऊर्जा बनाता है।', 'Solar panel sooraj ki taraf munh karke sabse zyada bijli banata hai. Kaale cross se bante chaar LDR batate hain ki kidhar zyada roshni hai, aur do servo panel ko udhar ghumate hain: left-right (pan) aur upar-neeche (tilt). Disha theek kijiye, dead band jodiye taaki yeh hilna band kare, aur dekhiye ek din mein yeh fixed panel se kitni zyada urja banata hai.'),
    setup: { parts: [F('svP', 'servo', { mount: 'pt' }, 178, 52, 1), F('svT', 'servo', { mount: 'pt' }, 178, 82, 1)], wires: [...POWER, ['T:svP:GND', 'H:bn40'], ['T:svP:VP', 'H:bp40'], ['T:svP:SIG', 'D9'], ['T:svT:GND', 'H:bn44'], ['T:svT:VP', 'H:bp44'], ['T:svT:SIG', 'D10']] },
    steps: [
      { k: 'info', do: t3('A panel facing the sun all day makes about a third more energy than one fixed on the roof. The pan servo (pin 9) and the tilt servo (pin 10) are already wired. The sensor on the panel\'s top edge has four LDRs, each with its 10 kΩ, so each gives a voltage: brighter is higher.', 'दिन भर सूरज की ओर मुँह किया पैनल छत पर लगे स्थिर पैनल से लगभग एक-तिहाई ज़्यादा ऊर्जा बनाता है। पैन सर्वो (पिन 9) और टिल्ट सर्वो (पिन 10) पहले से लगे हैं। पैनल के ऊपरी किनारे वाले सेंसर में चार एलडीआर हैं, हर एक के साथ 10 kΩ, तो हर एक वोल्टेज देता है: ज़्यादा रोशनी, ज़्यादा वोल्टेज।', 'Din bhar sooraj ki taraf munh kiya panel chhat par lage fixed panel se lagbhag ek-tihaai zyada urja banata hai. Pan servo (pin 9) aur tilt servo (pin 10) pehle se lage hain. Panel ke upar wale kinare ke sensor mein chaar LDR hain, har ek ke saath 10 kΩ, to har ek voltage deta hai: zyada roshni, zyada voltage.'), see: E },
      { k: 'place', place: F('ldr4', 'ldr4', {}, -60, 160, 0), do: t3('Put the sun sensor\'s plug on the mat at the ghost (its cable goes up to the panel).', 'सूरज सेंसर के प्लग को मैट पर नीली आकृति पर रखिए (इसका तार पैनल तक जाता है)।', 'Sooraj sensor ke plug ko mat par neeli shape par rakhiye (iska taar panel tak jaata hai).'), see: E },
      w3('ldr4.VCC', 'rail:bp', 'Wire its VCC to the front + rail.', 'इसका VCC आगे वाली + रेल से जोड़िए।', 'Iska VCC aage wali + rail se jodiye.'),
      w3('ldr4.GND', 'rail:bn', 'Its GND to the front − rail.', 'इसका GND आगे वाली − रेल से।', 'Iska GND aage wali − rail se.'),
      ...LQ.map(([q, a]) => w3('ldr4.' + q, a, `${q} to ${a}.`, `${q} को ${a} से।`, `${q} ko ${a} se.`)),
      CHECK,
      RUN(),
      { k: 'act', until: (S) => fresh(S) && S.w('runaway'), do: t3('Watch the panel and the sun. (The sun stands still for now: the day is paused.)', 'पैनल और सूरज देखिए। (अभी सूरज रुका है: दिन रुका है।)', 'Panel aur sooraj dekhiye. (Abhi sooraj ruka hai: din ruka hai.)'),
        see: t3('It tilts up nicely, but it turns away from the sun until the pan servo hits its end! On this stand the pan servo is fitted the other way round: a bigger angle turns the panel to the right.', 'यह ठीक से ऊपर झुकता है, पर सूरज से दूर घूमता जाता है जब तक पैन सर्वो अपने छोर पर न पहुँच जाए! इस स्टैंड पर पैन सर्वो उल्टा लगा है: बड़ा कोण पैनल को दाईं ओर घुमाता है।', 'Yeh theek se upar jhukta hai, par sooraj se door ghoomta jaata hai jab tak pan servo apne chhor par na pahunch jaaye! Is stand par pan servo ulta laga hai: bada angle panel ko right ghumata hai.') },
      { k: 'edit', test: okPan, set: [[/if \(dh > 0\) panA = panA - 1;/, 'if (dh > 0) panA = panA + 1;'], [/else panA = panA \+ 1;/, 'else panA = panA - 1;']],
        do: t3('Swap the pan\'s two directions: if (dh > 0) panA = panA + 1; and else panA = panA - 1; then Run.', 'पैन की दोनों दिशाएँ बदलिए: if (dh > 0) panA = panA + 1; और else panA = panA - 1; फिर "चलाइए"।', 'Pan ki dono dishayein badliye: if (dh > 0) panA = panA + 1; aur else panA = panA - 1; phir Run.'), see: E },
      { k: 'act', until: (S) => fresh(S) && S.w('locked'), do: t3('Watch it find the sun.', 'इसे सूरज ढूँढते देखिए।', 'Ise sooraj dhoondhte dekhiye.'), see: t3('All four LDRs see the same now: the panel faces the sun.', 'अब चारों एलडीआर बराबर देखते हैं: पैनल सूरज की ओर है।', 'Ab chaaron LDR barabar dekhte hain: panel sooraj ki taraf hai.') },
      { k: 'act', until: (S) => fresh(S) && S.w('hunting'), do: t3('Keep watching for 10 seconds: is it still?', '10 सेकंड और देखिए: क्या यह स्थिर है?', '10 second aur dekhiye: kya yeh sthir hai?'),
        see: live((lg, R) => pick(lg, `It twitches back and forth: ${R.rev10 || 0} turn-arounds in 10 s. With tol = 0 a difference of one count, just flicker, moves a servo every 30 ms. That wears out gears and wastes the power the panel makes.`, `यह आगे-पीछे फड़कता है: 10 s में ${R.rev10 || 0} बार दिशा बदली। tol = 0 में एक गिनती का फ़र्क़, बस टिमटिमाहट, हर 30 ms में सर्वो हिला देता है। इससे गियर घिसते हैं और पैनल की बनाई बिजली बर्बाद होती है।`, `Yeh aage-peeche phadakta hai: 10 s mein ${R.rev10 || 0} baar disha badli. tol = 0 mein ek count ka farq, bas timtimahat, har 30 ms mein servo hila deta hai. Isse gear ghiste hain aur panel ki banayi bijli barbaad hoti hai.`)) },
      { k: 'edit', test: okTol, set: [[/int tol = 0;/, 'int tol = 25;']], do: t3('Add a dead band: change int tol = 0; to int tol = 25; and press Run.', 'डेड बैंड जोड़िए: int tol = 0; को int tol = 25; कीजिए और "चलाइए" दबाइए।', 'Dead band jodiye: int tol = 0; ko int tol = 25; kijiye aur Run dabaiye.'), see: E },
      { k: 'act', until: (S) => fresh(S) && S.w('calm'), do: t3('Watch it for 10 seconds again.', 'फिर 10 सेकंड देखिए।', 'Phir 10 second dekhiye.'),
        see: t3('Still: it moves only when the sun is a few degrees off. Every real controller has a dead band like this (a room\'s thermostat too).', 'स्थिर: यह तभी हिलता है जब सूरज कुछ डिग्री हट जाए। हर असली कंट्रोलर में ऐसा डेड बैंड होता है (कमरे के थर्मोस्टैट में भी)।', 'Sthir: yeh tabhi hilta hai jab sooraj kuch degree hat jaaye. Har asli controller mein aisa dead band hota hai (room ke thermostat mein bhi).') },
      { k: 'act', until: (S) => S.w('followed'), do: t3('Play the day (Sun panel: "Play"): a whole day in one minute.', 'दिन चलाइए (सूरज पैनल: "चलाइए"): पूरा दिन एक मिनट में।', 'Din chalaiye (sooraj panel: "Chalaiye"): poora din ek minute mein.'),
        see: live((lg, R) => pick(lg, `The panel followed the sun all day (never more than ${R.maxErr ?? '?'}° off) and made ${R.gain ?? '?'} % more energy than the fixed panel facing south at 30°. Big solar farms in Rajasthan use trackers for exactly this.`, `पैनल दिन भर सूरज के पीछे चला (कभी ${R.maxErr ?? '?'}° से ज़्यादा नहीं हटा) और 30° पर दक्षिण की ओर लगे स्थिर पैनल से ${R.gain ?? '?'} % ज़्यादा ऊर्जा बनाई। राजस्थान के बड़े सोलर फ़ार्म ठीक इसी के लिए ट्रैकर लगाते हैं।`, `Panel din bhar sooraj ke peeche chala (kabhi ${R.maxErr ?? '?'}° se zyada nahi hata) aur 30° par south ki taraf lage fixed panel se ${R.gain ?? '?'} % zyada urja banayi. Rajasthan ke bade solar farm theek isi ke liye tracker lagate hain.`)) },
    ],
    check: [...rails, has('ldr4', t3('sun sensor', 'सूरज सेंसर', 'sooraj sensor')), need('ldr4.VCC', '5V', W.to5v, { x: 'VCC' }), need('ldr4.GND', 'GND', W.toGnd, { x: 'GND' }), ...LQ.map(([q, a]) => need('ldr4.' + q, a, W.join, { a: q, b: a }))],
    done: (S) => S.w('followed') });
  // 4 ---------------------------------------------------------------------------------------------------------- mini lift
  const CALLS = [[0, 20, 2], [1, 25, 3], [2, 30, 4]]; // floor, the button's column, its pin
  const okHome = (src) => /while\s*\(\s*digitalRead\s*\(\s*limitPin\s*\)\s*==\s*HIGH\s*\)\s*\{?\s*(\/\/[^\n]*\s*)?lift\.step\(\s*-\s*\d+\s*\)\s*;/.test(src || '');
  L.push({ id: 'lift', cls: '11', blocks: false, view: 'wide', rview: 'scene3pt', code: LIFTC, drawer: ['button'], serial: true, scene: { kind: 'lift' },
    title: t3('Mini lift with floor buttons', 'मंज़िल बटनों वाली मिनी लिफ़्ट', 'Manzil buttons wali mini lift'),
    goal: t3('A three-floor lift: a stepper winds the car\'s cable, and call buttons bring it to G, 1 or 2. After a power cut it does not know where it is: give it a limit switch and teach it to find the bottom first (homing).', 'तीन मंज़िल की लिफ़्ट: स्टेपर कार की रस्सी लपेटता है, और कॉल बटन उसे G, 1 या 2 पर लाते हैं। बिजली जाने के बाद उसे पता नहीं कि वह कहाँ है: उसे लिमिट स्विच दीजिए और सिखाइए कि पहले नीचे का छोर ढूँढे (होमिंग)।', 'Teen manzil ki lift: stepper car ki rassi lapet-ta hai, aur call button use G, 1 ya 2 par laate hain. Bijli jaane ke baad use pata nahi ki woh kahan hai: use limit switch dijiye aur sikhaiye ki pehle neeche ka chhor dhoondhe (homing).'),
    setup: { parts: [F('st', 'stepper', {}, -66, 150, 0), F('lcd', 'lcd16', {}, -128, 66, 0), ...CALLS.map(([f, c]) => P('c' + f, 'button', {}, 'e' + c, 0))],
      wires: [...POWER, ...[['IN1', 8], ['IN2', 9], ['IN3', 10], ['IN4', 11]].map(([id, pin]) => ['T:st:' + id, 'D' + pin]), ['T:st:GND', 'H:bn44'], ['T:st:VCC', 'H:bp44'],
        ['T:lcd:GND', 'H:bn10'], ['T:lcd:VCC', 'H:bp10'], ['T:lcd:SDA', 'A4'], ['T:lcd:SCL', 'A5'], ...CALLS.flatMap(([, c, pin]) => [['D' + pin, 'H:a' + c], ['H:a' + (c + 2), 'H:tn' + (c + 2)]])] },
    steps: [
      { k: 'info', do: t3(`A lift counts floors by counting the motor's steps: the car hangs on a cable wound on a 20 mm pulley, so one turn (2048 steps) lifts it 62.8 mm, and a floor (${LIFT.floor} mm) is 1956 steps. The stepper (pins 8–11), the LCD and the call buttons G, 1, 2 (pins 2, 3, 4) are wired. Last night there was a power cut.`, `लिफ़्ट मोटर के क़दम गिनकर मंज़िलें गिनती है: कार एक रस्सी पर लटकी है जो 20 mm की घिरनी पर लिपटती है, तो एक चक्कर (2048 क़दम) उसे 62.8 mm उठाता है, और एक मंज़िल (${LIFT.floor} mm) 1956 क़दम है। स्टेपर (पिन 8–11), एलसीडी और कॉल बटन G, 1, 2 (पिन 2, 3, 4) लगे हैं। कल रात बिजली गई थी।`, `Lift motor ke kadam gin kar manzilein ginti hai: car ek rassi par latki hai jo 20 mm ki ghirni par lipat-ti hai, to ek chakkar (2048 kadam) use 62.8 mm uthata hai, aur ek manzil (${LIFT.floor} mm) 1956 kadam hai. Stepper (pin 8–11), LCD aur call button G, 1, 2 (pin 2, 3, 4) lage hain. Kal raat bijli gayi thi.`), see: E },
      RUN(t3('"Floor G" on the LCD: the program believes the car is at G.', 'एलसीडी पर "Floor G": प्रोग्राम मानता है कि कार G पर है।', 'LCD par "Floor G": program maanta hai ki car G par hai.')),
      { k: 'act', until: (S) => fresh(S) && S.w('between'), do: t3('Call the lift to floor 1 (the panel: Call the lift → 1).', 'लिफ़्ट को मंज़िल 1 पर बुलाइए (पैनल: Call the lift → 1)।', 'Lift ko manzil 1 par bulaiye (panel: Call the lift → 1).'),
        see: live((lg, R) => (R.between === undefined ? '' : pick(lg, `It stopped at ${R.between} mm, not at ${LIFT.floor}: the doors cannot open. The power cut left the car ${LIFT.h0} mm above G, and the program only counts steps from where it thinks it started.`, `यह ${R.between} mm पर रुकी, ${LIFT.floor} पर नहीं: दरवाज़े नहीं खुल सकते। बिजली जाने से कार G से ${LIFT.h0} mm ऊपर रह गई थी, और प्रोग्राम बस वहीं से क़दम गिनता है जहाँ उसे लगता है कि शुरू हुआ।`, `Yeh ${R.between} mm par ruki, ${LIFT.floor} par nahi: darwaze nahi khul sakte. Bijli jaane se car G se ${LIFT.h0} mm upar reh gayi thi, aur program bas wahin se kadam ginta hai jahan use lagta hai ki shuru hua.`))) },
      { k: 'place', place: P('lim', 'button', {}, 'e40', 0), do: t3('The limit switch at the bottom of the shaft is wired to the breadboard like a button: put it in at 40e–42e, across the gap. The car presses it when it is all the way down.', 'शाफ़्ट के नीचे लगा लिमिट स्विच ब्रेडबोर्ड पर बटन की तरह जुड़ा है: इसे 40e–42e में, बीच के गैप के आर-पार लगाइए। कार पूरी नीचे हो तो इसे दबाती है।', 'Shaft ke neeche laga limit switch breadboard par button ki tarah juda hai: ise 40e–42e mein, beech ke gap ke aar-paar lagaiye. Car poori neeche ho to ise dabaati hai.'), see: E },
      w3('D5', 'lim.L1', 'Wire pin 5 to its top-left leg.', 'पिन 5 को इसके ऊपर-बाएँ पैर से जोड़िए।', 'Pin 5 ko iske upar-left pair se jodiye.'),
      w3('lim.L3', 'rail:tn', 'Its top-right leg to the − rail.', 'इसका ऊपर-दायाँ पैर − रेल से।', 'Iska upar-right pair − rail se.', t3('INPUT_PULLUP keeps pin 5 HIGH; the car pressing the switch pulls it LOW.', 'INPUT_PULLUP पिन 5 को HIGH रखता है; कार स्विच दबाए तो वह LOW हो जाता है।', 'INPUT_PULLUP pin 5 ko HIGH rakhta hai; car switch dabaye to woh LOW ho jaata hai.')),
      CHECK,
      { k: 'edit', test: okHome, set: [[/(  lcd\.backlight\(\);\n  Serial\.begin\(9600\);\n)/, '$1  lcd.print("Homing...");\n  while (digitalRead(limitPin) == HIGH) {   // down, a few steps at a time, until the car presses the switch\n    lift.step(-8);\n  }\n  floorNow = 0;                        // now it really is at G\n']],
        do: t3('Teach it homing: in setup(), after Serial.begin(9600); add\n  lcd.print("Homing...");\n  while (digitalRead(limitPin) == HIGH) {\n    lift.step(-8);\n  }\n  floorNow = 0;\nand press Run.', 'इसे होमिंग सिखाइए: setup() में Serial.begin(9600); के बाद लिखिए\n  lcd.print("Homing...");\n  while (digitalRead(limitPin) == HIGH) {\n    lift.step(-8);\n  }\n  floorNow = 0;\nऔर "चलाइए" दबाइए।', 'Ise homing sikhaiye: setup() mein Serial.begin(9600); ke baad likhiye\n  lcd.print("Homing...");\n  while (digitalRead(limitPin) == HIGH) {\n    lift.step(-8);\n  }\n  floorNow = 0;\naur Run dabaiye.'), see: E },
      { k: 'watch', until: (S) => fresh(S) && S.w('homed'), do: t3('Watch the car at the start.', 'शुरू में कार को देखिए।', 'Shuru mein car ko dekhiye.'), see: t3('Down it goes until the car presses the switch, then it stops: now step 0 really is floor G. 3D printers and CNC machines home their axes the same way each time they are switched on.', 'यह नीचे जाती है जब तक कार स्विच न दबा दे, फिर रुकती है: अब क़दम 0 सच में मंज़िल G है। 3D प्रिंटर और CNC मशीनें भी हर बार चालू होने पर ऐसे ही होम करती हैं।', 'Yeh neeche jaati hai jab tak car switch na daba de, phir rukti hai: ab kadam 0 sach mein manzil G hai. 3D printer aur CNC machine bhi har baar chalu hone par aise hi home karti hain.') },
      { k: 'act', until: (S) => fresh(S) && S.w('floor2') && S.w('floor1'), do: t3('Call it to 2, then to 1.', 'इसे 2 पर, फिर 1 पर बुलाइए।', 'Ise 2 par, phir 1 par bulaiye.'),
        see: live((lg, R) => pick(lg, `Its stops: ${(R.stops || []).map((x) => x + ' mm').join(', ')}. Every floor exactly, and it will stay exact after the next power cut, because it homes first.`, `इसके ठहराव: ${(R.stops || []).map((x) => x + ' mm').join(', ')}। हर मंज़िल पर ठीक, और अगली बार बिजली जाने के बाद भी ठीक रहेगी, क्योंकि यह पहले होम करती है।`, `Iske thehraav: ${(R.stops || []).map((x) => x + ' mm').join(', ')}. Har manzil par theek, aur agli baar bijli jaane ke baad bhi theek rahegi, kyunki yeh pehle home karti hai.`)) },
    ],
    check: [...rails, has('lim', t3('limit switch', 'लिमिट स्विच', 'limit switch')), need('lim.L1', 'D5', W.toPin, { x: t3('limit switch', 'लिमिट स्विच', 'limit switch'), p: 5 }), (S) => (S.conn('lim.L3', 'GND') || S.conn('lim.L4', 'GND') ? null : [W.toGnd, { x: t3('limit switch\'s other leg', 'लिमिट स्विच का दूसरा पैर', 'limit switch ka doosra pair') }])],
    done: (S) => S.w('homed') && S.w('floor2') && S.w('floor1') });
  // 5 ------------------------------------------------------------------------------------------------------ conveyor belt
  const okRpm = (src) => { const m = /int\s+rpm\s*=\s*(\d+)\s*;/.exec(src || ''); return !!m && +m[1] >= 5 && +m[1] <= 15; };
  const okWait = (src) => /while\s*\(\s*digitalRead\s*\(\s*irPin\s*\)\s*==\s*LOW\s*\)\s*\{?\s*(\/\/[^\n]*\s*)?belt\.step\(\s*\d+\s*\)\s*;/.test(src || '');
  const offs = (R) => (R.offs || []).slice(-3).map((o) => (o > 0 ? '+' : '') + o + ' mm').join(', ');
  L.push({ id: 'conveyor', cls: '11', blocks: false, view: 'wide', rview: 'scene3cv', code: CONVC, drawer: ['ir'], serial: true, scene: { kind: 'conveyor' },
    title: t3('Conveyor belt with a stepper', 'स्टेपर वाली कन्वेयर बेल्ट', 'Stepper wali conveyor belt'),
    goal: t3('A factory conveyor: a stepper drives the belt, an IR sensor finds each box, and a servo stamps it "QC OK". Find the motor\'s top speed, then make every box get exactly one stamp and one count.', 'फ़ैक्टरी की कन्वेयर: स्टेपर बेल्ट चलाता है, आईआर सेंसर हर डिब्बा ढूँढता है, और सर्वो उस पर "QC OK" का ठप्पा लगाता है। मोटर की सबसे तेज़ रफ़्तार पता कीजिए, फिर हर डिब्बे पर ठीक एक ठप्पा और एक गिनती कराइए।', 'Factory ki conveyor: stepper belt chalata hai, IR sensor har dabba dhoondhta hai, aur servo us par "QC OK" ka thappa lagata hai. Motor ki sabse tez speed pata kijiye, phir har dabbe par theek ek thappa aur ek ginti karaiye.'),
    setup: { parts: [F('st', 'stepper', { mount: 'belt' }, 96, 150, 0), F('sv', 'servo', { mount: 'stamp' }, 178, 62, 0)],
      wires: [...POWER, ...[['IN1', 8], ['IN2', 9], ['IN3', 10], ['IN4', 11]].map(([id, pin]) => ['T:st:' + id, 'D' + pin]), ['T:st:GND', 'H:bn50'], ['T:st:VCC', 'H:bp50'],
        ['T:sv:GND', 'H:bn40'], ['T:sv:VP', 'H:bp40'], ['T:sv:SIG', 'D6']] },
    steps: [
      { k: 'info', do: t3('Conveyor belts carry parcels, bottles and car parts past machines that check, fill or mark them. Here a 28BYJ-48 stepper turns the belt\'s drive roller (30 mm across, so one turn moves the belt 94 mm). Its driver (pins 8–11) and the stamp\'s servo (pin 6) are already wired.', 'कन्वेयर बेल्ट पार्सल, बोतलें और गाड़ी के पुर्ज़े उन मशीनों के आगे से ले जाती हैं जो उन्हें जाँचती, भरती या उन पर निशान लगाती हैं। यहाँ 28BYJ-48 स्टेपर बेल्ट का ड्राइव रोलर घुमाता है (30 mm मोटा, तो एक चक्कर में बेल्ट 94 mm चलती है)। इसका ड्राइवर (पिन 8–11) और ठप्पे का सर्वो (पिन 6) पहले से लगे हैं।', 'Conveyor belt parcel, bottle aur gaadi ke purze un machines ke aage se le jaati hai jo unhein jaanchti, bharti ya un par nishaan lagati hain. Yahan 28BYJ-48 stepper belt ka drive roller ghumata hai (30 mm mota, to ek chakkar mein belt 94 mm chalti hai). Iska driver (pin 8–11) aur thappe ka servo (pin 6) pehle se lage hain.'), see: E },
      { k: 'place', place: F('ir1', 'ir', { mount: 'belt' }, 196, 120, 0), do: t3('Put the IR sensor\'s plug on the mat at the ghost (the sensor itself is on the belt\'s rail, looking across the belt).', 'आईआर सेंसर के प्लग को मैट पर नीली आकृति पर रखिए (सेंसर ख़ुद बेल्ट की रेलिंग पर है, बेल्ट के आर-पार देखता हुआ)।', 'IR sensor ke plug ko mat par neeli shape par rakhiye (sensor khud belt ki railing par hai, belt ke aar-paar dekhta hua).'), see: E },
      w3('ir1.OUT', 'D2', 'Wire its OUT to pin 2.', 'इसका OUT पिन 2 से जोड़िए।', 'Iska OUT pin 2 se jodiye.'),
      w3('ir1.VCC', 'rail:tp', 'Its VCC to the + rail.', 'इसका VCC + रेल से।', 'Iska VCC + rail se.'),
      w3('ir1.GND', 'rail:tn', 'Its GND to the − rail.', 'इसका GND − रेल से।', 'Iska GND − rail se.', t3('OUT goes LOW while a box is in front of the sensor: its green light comes on.', 'सेंसर के सामने डिब्बा हो तो OUT LOW होता है: इसकी हरी बत्ती जलती है।', 'Sensor ke saamne dabba ho to OUT LOW hota hai: iski hari batti jalti hai.')),
      CHECK,
      RUN(t3('"Conveyor ready" in the Serial Monitor.', 'सीरियल मॉनिटर में "Conveyor ready"।', 'Serial Monitor mein "Conveyor ready".')),
      { k: 'act', until: (S) => fresh(S) && S.w('stall'), do: t3('Watch the motor and the belt.', 'मोटर और बेल्ट देखिए।', 'Motor aur belt dekhiye.'),
        see: t3('The driver\'s four LEDs flicker and the motor hums, but the belt does not move. At 25 rpm the program changes the coils every 1.2 ms; the 28BYJ-48\'s rotor (through its 64:1 gears) needs about 1.7 ms to follow each one, so it misses every step. At 5 V it manages about 15 turns a minute.', 'ड्राइवर की चारों एलईडी टिमटिमाती हैं और मोटर गुनगुनाती है, पर बेल्ट नहीं चलती। 25 rpm पर प्रोग्राम हर 1.2 ms में कॉइल बदलता है; 28BYJ-48 का रोटर (64:1 गियर के साथ) हर बार पीछे आने में लगभग 1.7 ms लेता है, तो हर क़दम छूट जाता है। 5 V पर यह लगभग 15 चक्कर एक मिनट में कर पाती है।', 'Driver ki chaaron LED timtimati hain aur motor gungunati hai, par belt nahi chalti. 25 rpm par program har 1.2 ms mein coil badalta hai; 28BYJ-48 ka rotor (64:1 gear ke saath) har baar peeche aane mein lagbhag 1.7 ms leta hai, to har kadam chhoot jaata hai. 5 V par yeh lagbhag 15 chakkar ek minute mein kar paati hai.') },
      { k: 'edit', test: okRpm, set: [[/int rpm = 25;/, 'int rpm = 12;']], do: t3('Slow it down: change int rpm = 25; to int rpm = 12; and press Run.', 'इसे धीमा कीजिए: int rpm = 25; को int rpm = 12; कीजिए और "चलाइए" दबाइए।', 'Ise dheema kijiye: int rpm = 25; ko int rpm = 12; kijiye aur Run dabaiye.'), see: E },
      { k: 'act', until: (S) => fresh(S) && S.w('multi'), do: t3('Watch the first box reach the stamp, and the Serial Monitor.', 'पहले डिब्बे को ठप्पे तक पहुँचते देखिए, और सीरियल मॉनिटर।', 'Pehle dabbe ko thappe tak pahunchte dekhiye, aur Serial Monitor.'),
        see: live((lg, R) => (!R.multi ? '' : pick(lg, `One box went past and the program counted ${R.multi.n + R.multi.belt}: ${R.multi.n} stamps smudged on the box, and ${R.multi.belt} on the bare belt behind it. The sensor stays LOW for the whole 30 mm of the box, but each loop moves the belt only 2.9 mm, so the if is true again and again.`, `एक डिब्बा गुज़रा और प्रोग्राम ने ${R.multi.n + R.multi.belt} गिने: डिब्बे पर ${R.multi.n} धुँधले ठप्पे, और उसके पीछे ख़ाली बेल्ट पर ${R.multi.belt}। डिब्बे के पूरे 30 mm तक सेंसर LOW रहता है, पर हर loop बेल्ट को सिर्फ़ 2.9 mm चलाता है, तो if बार-बार सच होता है।`, `Ek dabba guzra aur program ne ${R.multi.n + R.multi.belt} gine: dabbe par ${R.multi.n} dhundhle thappe, aur uske peeche khaali belt par ${R.multi.belt}. Dabbe ke poore 30 mm tak sensor LOW rehta hai, par har loop belt ko sirf 2.9 mm chalata hai, to if baar-baar sach hota hai.`))) },
      { k: 'edit', test: okWait, set: [[/(    Serial\.println\(" stamped"\);\n)/, '$1    while (digitalRead(irPin) == LOW) {   // wait until this box has gone past the sensor\n      belt.step(64);\n    }\n']],
        do: t3('Count the box arriving, not the box being there: after Serial.println(" stamped"); add\n    while (digitalRead(irPin) == LOW) {\n      belt.step(64);\n    }\nand press Run.', 'डिब्बे का आना गिनिए, उसका वहाँ होना नहीं: Serial.println(" stamped"); के बाद लिखिए\n    while (digitalRead(irPin) == LOW) {\n      belt.step(64);\n    }\nऔर "चलाइए" दबाइए।', 'Dabbe ka aana giniye, uska wahan hona nahi: Serial.println(" stamped"); ke baad likhiye\n    while (digitalRead(irPin) == LOW) {\n      belt.step(64);\n    }\naur Run dabaiye.'), see: E },
      { k: 'act', until: (S) => fresh(S) && S.w('once'), do: t3('Watch three boxes go by.', 'तीन डिब्बे गुज़रते देखिए।', 'Teen dabbe guzarte dekhiye.'),
        see: live((lg, R) => pick(lg, `One stamp on each box, in the middle (${offs(R)} from the centre), and one count each: about ${R.rate ?? '?'} boxes a minute. While the box is still in front of the sensor, the program only moves the belt on, so the next stamp waits for the next box. Every counter on a production line works this way.`, `हर डिब्बे पर एक ठप्पा, बीच में (केंद्र से ${offs(R)}), और हर एक की एक गिनती: लगभग ${R.rate ?? '?'} डिब्बे एक मिनट में। जब तक डिब्बा सेंसर के सामने है, प्रोग्राम बस बेल्ट को आगे चलाता है, तो अगला ठप्पा अगले डिब्बे का इंतज़ार करता है। प्रोडक्शन लाइन का हर काउंटर ऐसे ही काम करता है।`, `Har dabbe par ek thappa, beech mein (centre se ${offs(R)}), aur har ek ki ek ginti: lagbhag ${R.rate ?? '?'} dabbe ek minute mein. Jab tak dabba sensor ke saamne hai, program bas belt ko aage chalata hai, to agla thappa agle dabbe ka intezaar karta hai. Production line ka har counter aise hi kaam karta hai.`)) },
    ],
    check: [...rails, has('ir1', t3('IR sensor', 'आईआर सेंसर', 'IR sensor')), need('ir1.OUT', 'D2', W.toPin, { x: t3('IR sensor\'s OUT', 'आईआर सेंसर का OUT', 'IR sensor ka OUT'), p: 2 }), need('ir1.VCC', '5V', W.to5v, { x: 'VCC' }), need('ir1.GND', 'GND', W.toGnd, { x: 'GND' })],
    done: (S) => S.w('once') });
  // 6 ---------------------------------------------------------------------------------------- robot arm draws a square
  const ARMP = [F('psu', 'psu5', {}, 40, 78, 2), F('svB', 'mg996r', { mount: 'arm' }, 172, 50, 1), F('svS', 'mg996r', { mount: 'arm' }, 172, 78, 1), F('svE', 'mg996r', { mount: 'arm' }, 172, 106, 1), F('svG', 'servo', { mount: 'arm' }, 172, 134, 1)];
  const ASV = { svB: 3, svS: 5, svE: 6, svG: 9 };
  const aWires = [['T:psu:P', 'H:bp20'], ['T:psu:N', 'H:bn21'], ['GND1', 'H:bn5'], ...Object.keys(ASV).flatMap((k, i) => [['T:' + k + ':GND', 'H:bn' + (24 + i * 4)], ['T:' + k + ':VP', 'H:bp' + (24 + i * 4)], ['T:' + k + ':SIG', 'D' + ASV[k]]])];
  const okDeg = (src) => /base\.write\(\s*degrees\(\s*b\s*\)\s*\)\s*;/.test(src || '') || /base\.write\(\s*b\s*\*\s*180(\.0)?\s*\/\s*PI\s*\)\s*;/.test(src || '');
  const okLine = (src) => /lineTo\(\s*sq\[\s*i\s*-\s*1\s*\]\[0\]\s*,\s*sq\[\s*i\s*-\s*1\s*\]\[1\]\s*,\s*sq\[\s*i\s*\]\[0\]\s*,\s*sq\[\s*i\s*\]\[1\]\s*\)\s*;/.test(src || '');
  L.push({ id: 'armsquare', cls: '11', blocks: false, view: 'side', wview: 'armbench', rview: 'armpaper', code: ARMSQ, drawer: [], serial: true, world: { kind: 'arm', level: 6 },
    title: t3('Robot arm: draw a square', 'रोबोट बाँह: एक वर्ग बनाइए', 'Robot arm: ek square banaiye'),
    goal: t3('A felt pen in the claw and a sheet of paper in front of the arm. Work out the joint angles from where the pen should be (inverse kinematics), fix the units, and make the sides straight by moving the tip along a line, as welding robots and plotters do.', 'पंजे में एक स्केच पेन और बाँह के सामने एक काग़ज़। पेन जहाँ होना चाहिए वहाँ से जोड़ों के कोण निकालिए (इनवर्स काइनेमैटिक्स), इकाई ठीक कीजिए, और नोक को एक सीधी रेखा पर चलाकर भुजाएँ सीधी कीजिए, जैसे वेल्डिंग रोबोट और प्लॉटर करते हैं।', 'Panje mein ek sketch pen aur baanh ke saamne ek kaagaz. Pen jahan hona chahiye wahan se joints ke angle nikaliye (inverse kinematics), unit theek kijiye, aur nok ko ek seedhi line par chala kar sides seedhi kijiye, jaise welding robot aur plotter karte hain.'),
    setup: { parts: ARMP, wires: aWires },
    steps: [
      { k: 'info', do: t3('The arm is wired as before (base, shoulder, elbow, claw on pins 3, 5, 6, 9, with its 5 V adapter). The claw holds a felt pen; the paper has an 80 mm square pencilled on it, 130 to 210 mm in front of the base. To put the pen\'s tip at a point, the program must work backwards from the point to three angles.', 'बाँह पहले की तरह जुड़ी है (बेस, कंधा, कोहनी, पंजा पिन 3, 5, 6, 9 पर, अपने 5 V एडैप्टर के साथ)। पंजे में स्केच पेन है; काग़ज़ पर पेंसिल से 80 mm का वर्ग बना है, बेस से 130 से 210 mm आगे। पेन की नोक किसी बिंदु पर रखने के लिए प्रोग्राम को उस बिंदु से उल्टा चलकर तीन कोण निकालने होंगे।', 'Baanh pehle ki tarah judi hai (base, shoulder, elbow, claw pin 3, 5, 6, 9 par, apne 5 V adapter ke saath). Panje mein sketch pen hai; kaagaz par pencil se 80 mm ka square bana hai, base se 130 se 210 mm aage. Pen ki nok kisi point par rakhne ke liye program ko us point se ulta chal kar teen angle nikaalne honge.'), see: E },
      { k: 'info', code: [13, 23], do: t3('Read penAt(): atan2 gives the base\'s direction, Pythagoras gives the distances, and the cosine rule (acos) gives the shoulder and elbow angles of the triangle shoulder–elbow–tip. This is inverse kinematics.', 'penAt() पढ़िए: atan2 बेस की दिशा देता है, पाइथागोरस दूरियाँ, और कोसाइन नियम (acos) कंधा–कोहनी–नोक त्रिभुज के कंधे और कोहनी के कोण। यही इनवर्स काइनेमैटिक्स है।', 'penAt() padhiye: atan2 base ki disha deta hai, Pythagoras dooriyan, aur cosine rule (acos) shoulder–elbow–nok triangle ke shoulder aur elbow ke angle. Yahi inverse kinematics hai.'), see: E },
      RUN(),
      { k: 'act', until: (S) => fresh(S) && S.w('offPaper'), do: t3('Watch where the pen goes down.', 'देखिए पेन कहाँ नीचे आता है।', 'Dekhiye pen kahan neeche aata hai.'),
        see: t3('It draws on the desk, far to the right of the paper! atan2() answers in radians: about 1.87 for the first corner. base.write() wants degrees, so the base went to 2°.', 'यह काग़ज़ से बहुत दाईं ओर, मेज़ पर बनाता है! atan2() रेडियन में जवाब देता है: पहले कोने के लिए लगभग 1.87। base.write() को डिग्री चाहिए, तो बेस 2° पर चला गया।', 'Yeh kaagaz se bahut right mein, mez par banata hai! atan2() radian mein jawab deta hai: pehle kone ke liye lagbhag 1.87. base.write() ko degree chahiye, to base 2° par chala gaya.') },
      { k: 'edit', test: okDeg, set: [[/base\.write\(b\);/, 'base.write(degrees(b));']], do: t3('Change base.write(b); to base.write(degrees(b)); (the other two already use degrees()) and press Run.', 'base.write(b); को base.write(degrees(b)); कीजिए (बाक़ी दो पहले से degrees() लेते हैं) और "चलाइए" दबाइए।', 'base.write(b); ko base.write(degrees(b)); kijiye (baaki do pehle se degrees() lete hain) aur Run dabaiye.'), see: E },
      { k: 'act', until: (S) => fresh(S) && S.w('crooked'), do: t3('Watch the square being drawn.', 'वर्ग बनते देखिए।', 'Square bante dekhiye.'),
        see: liveArm((lg, R) => pick(lg, `The sides are not straight: the worst spot is ${R.dev ?? '?'} mm off the pencil line, and only ${R.cover ?? '?'} % of the square has ink. Sent straight to a corner, every servo turns at full speed and they finish at different times, so the tip swings along a curve, and its height wanders: the pen lifts off or presses in. Factory robots call this a joint move.`, `भुजाएँ सीधी नहीं: सबसे ख़राब जगह पेंसिल की लाइन से ${R.dev ?? '?'} mm दूर है, और वर्ग के सिर्फ़ ${R.cover ?? '?'} % हिस्से पर स्याही है। सीधे कोने पर भेजने से हर सर्वो पूरी रफ़्तार से घूमता है और सब अलग-अलग समय पर रुकते हैं, तो नोक एक वक्र पर झूलती है, और उसकी ऊँचाई बदलती रहती है: पेन उठ जाता है या दब जाता है। फ़ैक्टरी के रोबोट इसे जॉइंट मूव कहते हैं।`, `Sides seedhi nahi: sabse kharab jagah pencil ki line se ${R.dev ?? '?'} mm door hai, aur square ke sirf ${R.cover ?? '?'} % hisse par syaahi hai. Seedhe kone par bhejne se har servo poori speed se ghoomta hai aur sab alag-alag time par rukte hain, to nok ek curve par jhoolti hai, aur uski unchaai badalti rehti hai: pen uth jaata hai ya dab jaata hai. Factory ke robot ise joint move kehte hain.`)) },
      { k: 'edit', test: okLine, set: [[/    penAt\(sq\[i\]\[0\], sq\[i\]\[1\], 0\);[^\n]*\n    delay\(800\);\n/, '    lineTo(sq[i - 1][0], sq[i - 1][1], sq[i][0], sq[i][1]);   // along a straight line\n']],
        do: t3('Move along the line instead: in the for loop, replace the two lines\n    penAt(sq[i][0], sq[i][1], 0);\n    delay(800);\nwith\n    lineTo(sq[i - 1][0], sq[i - 1][1], sq[i][0], sq[i][1]);\nand press Run.', 'इसके बजाय लाइन पर चलाइए: for लूप में ये दो लाइनें\n    penAt(sq[i][0], sq[i][1], 0);\n    delay(800);\nहटाकर लिखिए\n    lineTo(sq[i - 1][0], sq[i - 1][1], sq[i][0], sq[i][1]);\nऔर "चलाइए" दबाइए।', 'Iske bajaay line par chalaiye: for loop mein yeh do lines\n    penAt(sq[i][0], sq[i][1], 0);\n    delay(800);\nhata kar likhiye\n    lineTo(sq[i - 1][0], sq[i - 1][1], sq[i][0], sq[i][1]);\naur Run dabaiye.'), see: E },
      { k: 'act', until: (S) => fresh(S) && S.w('square'), do: t3('Watch it draw again (on a fresh sheet).', 'इसे फिर से बनाते देखिए (नए काग़ज़ पर)।', 'Ise phir se banate dekhiye (naye kaagaz par).'),
        see: liveArm((lg, R) => pick(lg, `A square: never more than ${R.dev ?? '?'} mm off the pencil line, with ink on ${R.cover ?? '?'} % of it. Each side is 40 small steps, and penAt() works out every one, so the tip stays on a straight line and on the paper. This is a linear move: welding robots, pen plotters and 3D printers all move like this. (A tiny gap is where whole degrees put the tip a millimetre too high: drawing robots hold the pen on a spring.)`, `एक वर्ग: पेंसिल की लाइन से कभी ${R.dev ?? '?'} mm से ज़्यादा नहीं हटा, ${R.cover ?? '?'} % पर स्याही। हर भुजा 40 छोटे क़दम है, और penAt() हर क़दम का हिसाब लगाता है, तो नोक सीधी लाइन पर और काग़ज़ पर रहती है। यह लीनियर मूव है: वेल्डिंग रोबोट, पेन प्लॉटर और 3D प्रिंटर सब ऐसे ही चलते हैं। (कोई छोटा गैप वहाँ है जहाँ पूरे डिग्री ने नोक को एक मिलीमीटर ऊपर रख दिया: ड्रॉइंग रोबोट पेन को स्प्रिंग पर पकड़ते हैं।)`, `Ek square: pencil ki line se kabhi ${R.dev ?? '?'} mm se zyada nahi hata, ${R.cover ?? '?'} % par syaahi. Har side 40 chhote kadam hai, aur penAt() har kadam ka hisaab lagata hai, to nok seedhi line par aur kaagaz par rehti hai. Yeh linear move hai: welding robot, pen plotter aur 3D printer sab aise hi chalte hain. (Koi chhota gap wahan hai jahan poore degree ne nok ko ek millimetre upar rakh diya: drawing robot pen ko spring par pakadte hain.)`)) },
    ],
    check: [noShort],
    done: (S) => S.w('square') });
  // 7 ------------------------------------------------------------------------------------------------- camera slider
  const okMm = (src) => { const m = /float\s+stepsPerMm\s*=\s*([^;]+);/.exec(src || ''); if (!m) return false; const t = m[1].replace(/\s+/g, ''); return /^(2048\/40(\.0)?|2048\.0\/40|51\.2|2048\/\(20\*2(\.0)?\)|2048\.0\/\(20\*2\))$/.test(t); };
  const okSettle = (src) => { const m = /slider\.step\([^;]*\);[^\n]*\n\s*delay\(\s*(\d+)\s*\)\s*;/.exec(src || ''); return !!m && +m[1] >= 400 && +m[1] <= 1500; };
  L.push({ id: 'slider', cls: '11', blocks: false, view: 'wide', rview: 'scene3cv', code: SLIDEC, drawer: ['led'], serial: true, scene: { kind: 'slider' },
    title: t3('Camera slider with a stepper', 'स्टेपर वाला कैमरा स्लाइडर', 'Stepper wala camera slider'),
    goal: t3('Film makers slide the camera a little between photos to make a moving time-lapse. A stepper pulls the camera along a rail with a toothed belt, and pin 7 clicks the shutter. Work out the steps for a millimetre from the pulley\'s teeth, then make every photo sharp.', 'फ़िल्म बनाने वाले हर फ़ोटो के बीच कैमरा थोड़ा खिसकाते हैं ताकि टाइम-लैप्स चलता हुआ दिखे। स्टेपर दाँतेदार बेल्ट से कैमरे को रेल पर खींचता है, और पिन 7 शटर दबाता है। पुली के दाँतों से एक मिलीमीटर के क़दम निकालिए, फिर हर फ़ोटो साफ़ कीजिए।', 'Film banane wale har photo ke beech camera thoda khiskaate hain taaki time-lapse chalta hua dikhe. Stepper daantedaar belt se camera ko rail par kheenchta hai, aur pin 7 shutter dabata hai. Pulley ke daanton se ek millimetre ke kadam nikaliye, phir har photo saaf kijiye.'),
    setup: { parts: [F('st', 'stepper', { mount: 'slider' }, 96, 150, 0), P('r1', 'resistor', { ohms: 220 }, 'b30', 3)],
      wires: [...POWER, ...[['IN1', 8], ['IN2', 9], ['IN3', 10], ['IN4', 11]].map(([id, pin]) => ['T:st:' + id, 'D' + pin]), ['T:st:GND', 'H:bn50'], ['T:st:VCC', 'H:bp50']] },
    steps: [
      { k: 'info', do: t3('The camera rides on a carriage along an aluminium rail. A GT2 toothed belt pulls it: the 28BYJ-48 (pins 8–11, wired) turns a pulley with 20 teeth, 2 mm apart. The camera\'s remote socket is clicked by pin 7 through an optocoupler, a tiny LED inside a chip that lights a light sensor: so pin 7 just lights an LED.', 'कैमरा एक कैरिज पर एल्युमिनियम रेल के साथ चलता है। GT2 दाँतेदार बेल्ट उसे खींचती है: 28BYJ-48 (पिन 8–11, जुड़ा है) 20 दाँतों वाली पुली घुमाता है, दाँत 2 mm की दूरी पर। कैमरे का रिमोट सॉकेट पिन 7 से एक ऑप्टोकपलर के ज़रिए दबता है, चिप के अंदर एक छोटी एलईडी जो एक लाइट सेंसर को रोशन करती है: तो पिन 7 बस एक एलईडी जलाता है।', 'Camera ek carriage par aluminium rail ke saath chalta hai. GT2 daantedaar belt use kheenchti hai: 28BYJ-48 (pin 8–11, juda hai) 20 daanton wali pulley ghumata hai, daant 2 mm ki doori par. Camera ka remote socket pin 7 se ek optocoupler ke zariye dabta hai, chip ke andar ek chhoti LED jo ek light sensor ko roshan karti hai: to pin 7 bas ek LED jalata hai.'), see: E },
      { k: 'place', place: P('led1', 'led', { color: 'red' }, 'e30', 0), do: t3('Put the red LED in at the ghost: long leg (+) in 31e, short leg (−) in 30e, next to its 220 Ω resistor.', 'लाल एलईडी नीली आकृति पर लगाइए: लंबा पैर (+) 31e में, छोटा पैर (−) 30e में, इसके 220 Ω रेज़िस्टर के पास।', 'Laal LED neeli shape par lagaiye: lamba pair (+) 31e mein, chhota pair (−) 30e mein, iske 220 Ω resistor ke paas.'), see: E },
      w3('D7', 'led1.A', 'Wire pin 7 to the LED\'s long leg (column 31).', 'पिन 7 को एलईडी के लंबे पैर (कॉलम 31) से जोड़िए।', 'Pin 7 ko LED ke lambe pair (column 31) se jodiye.', t3('Each flash of this LED is one click of the camera.', 'इस एलईडी की हर चमक कैमरे का एक क्लिक है।', 'Is LED ki har chamak camera ka ek click hai.')),
      CHECK,
      RUN(t3('"Time-lapse: 12 photos, 180 mm" in the Serial Monitor, and the camera starts to move.', 'सीरियल मॉनिटर में "Time-lapse: 12 photos, 180 mm", और कैमरा चलने लगता है।', 'Serial Monitor mein "Time-lapse: 12 photos, 180 mm", aur camera chalne lagta hai.')),
      { k: 'act', until: (S) => fresh(S) && S.w('short'), do: t3('Watch the whole time-lapse: 12 photos.', 'पूरा टाइम-लैप्स देखिए: 12 फ़ोटो।', 'Poora time-lapse dekhiye: 12 photo.'),
        see: live((lg, R) => pick(lg, `The Serial Monitor says photo 12 is at 180 mm, but the camera is at ${R.end ?? '?'} mm. The program treats the pulley as a 20 mm roller (π × 20 = 62.8 mm a turn), but a belt sits on the teeth: 20 teeth × 2 mm = 40 mm a turn.`, `सीरियल मॉनिटर कहता है फ़ोटो 12, 180 mm पर है, पर कैमरा ${R.end ?? '?'} mm पर है। प्रोग्राम पुली को 20 mm का रोलर मानता है (π × 20 = 62.8 mm एक चक्कर), पर बेल्ट दाँतों पर बैठती है: 20 दाँत × 2 mm = 40 mm एक चक्कर।`, `Serial Monitor kehta hai photo 12, 180 mm par hai, par camera ${R.end ?? '?'} mm par hai. Program pulley ko 20 mm ka roller maanta hai (π × 20 = 62.8 mm ek chakkar), par belt daanton par baithti hai: 20 daant × 2 mm = 40 mm ek chakkar.`)) },
      { k: 'edit', test: okMm, set: [[/float stepsPerMm = 2048 \/ \(3\.1416 \* 20\);[^\n]*/, 'float stepsPerMm = 2048 / 40.0;      // steps for 1 mm of belt: 20 teeth × 2 mm = 40 mm a turn']], do: t3('Count the teeth: change the stepsPerMm line to\nfloat stepsPerMm = 2048 / 40.0;\n(51.2 steps for each mm) and press Run. The camera starts again from the motor end.', 'दाँत गिनिए: stepsPerMm वाली लाइन को ऐसा कीजिए\nfloat stepsPerMm = 2048 / 40.0;\n(हर mm के लिए 51.2 क़दम) और "चलाइए" दबाइए। कैमरा फिर मोटर वाले सिरे से शुरू होता है।', 'Daant giniye: stepsPerMm wali line ko aisa kijiye\nfloat stepsPerMm = 2048 / 40.0;\n(har mm ke liye 51.2 kadam) aur Run dabaiye. Camera phir motor wale sire se shuru hota hai.'), see: E },
      { k: 'act', until: (S) => fresh(S) && S.w('far') && S.w('blurred'), do: t3('Watch it again, and the camera\'s photos (in the panel).', 'फिर देखिए, और कैमरे की फ़ोटो (पैनल में)।', 'Phir dekhiye, aur camera ki photo (panel mein).'),
        see: live((lg, R) => pick(lg, `${R.end ?? '?'} mm: the whole 180 mm. But ${R.sharpN ? 'only ' + R.sharpN + ' of the 12 photos are' : 'not one of the 12 photos is'} sharp. Look at the camera when it stops: it rocks on the rail for a moment, and the shutter clicks at once, while it is still moving.`, `${R.end ?? '?'} mm: पूरे 180 mm। पर ${R.sharpN ? '12 में से सिर्फ़ ' + R.sharpN + ' फ़ोटो साफ़ हैं' : '12 में से एक भी फ़ोटो साफ़ नहीं'}। रुकते समय कैमरे को देखिए: यह एक पल रेल पर हिलता है, और शटर तुरंत दब जाता है, जब यह हिल ही रहा होता है।`, `${R.end ?? '?'} mm: poore 180 mm. Par ${R.sharpN ? '12 mein se sirf ' + R.sharpN + ' photo saaf hain' : '12 mein se ek bhi photo saaf nahi'}. Rukte samay camera ko dekhiye: yeh ek pal rail par hilta hai, aur shutter turant dab jaata hai, jab yeh hil hi raha hota hai.`)) },
      { k: 'edit', test: okSettle, set: [[/(    slider\.step\(gap \* stepsPerMm\);[^\n]*\n)/, '$1    delay(500);                         // let the camera stop rocking\n']], do: t3('Give it settling time: after slider.step(gap * stepsPerMm); add\n    delay(500);\nand press Run.', 'इसे रुकने का समय दीजिए: slider.step(gap * stepsPerMm); के बाद लिखिए\n    delay(500);\nऔर "चलाइए" दबाइए।', 'Ise rukne ka samay dijiye: slider.step(gap * stepsPerMm); ke baad likhiye\n    delay(500);\naur Run dabaiye.'), see: E },
      { k: 'act', until: (S) => fresh(S) && S.w('sharp'), do: t3('Watch the time-lapse once more.', 'टाइम-लैप्स एक बार और देखिए।', 'Time-lapse ek baar aur dekhiye.'),
        see: live((lg, R) => pick(lg, `All 12 photos sharp, from 15 to ${R.end ?? '?'} mm. Every machine that stops and then measures, prints or photographs waits for its settling time: CNC machines, pick-and-place robots, even a phone camera on a selfie stick.`, `सभी 12 फ़ोटो साफ़, 15 से ${R.end ?? '?'} mm तक। हर मशीन जो रुककर नापती, छापती या फ़ोटो खींचती है, अपने रुकने के समय का इंतज़ार करती है: CNC मशीनें, पिक-एंड-प्लेस रोबोट, सेल्फ़ी स्टिक पर फ़ोन कैमरा भी।`, `Sabhi 12 photo saaf, 15 se ${R.end ?? '?'} mm tak. Har machine jo ruk kar naapti, chhaapti ya photo kheenchti hai, apne rukne ke samay ka intezaar karti hai: CNC machine, pick-and-place robot, selfie stick par phone camera bhi.`)) },
    ],
    check: [noShort, (S) => (S.conn('rail:tn', 'GND') ? null : [W.gndRail]), has('led1', t3('LED', 'एलईडी', 'LED')), need('led1.A', 'D7', W.toPin, { x: t3('LED\'s long leg', 'एलईडी का लंबा पैर', 'LED ka lamba pair'), p: 7 })],
    done: (S) => S.w('sharp') });
  // 8 ----------------------------------------------------------------------------------------------- PID line follower
  const CARP = [F('drv', 'l298n', {}, -35, 105, 0), F('bat', 'bat18650', {}, -190, 108, 0), F('mL', 'bomotor', { side: 'L' }, -80, 152, 3), F('mR', 'bomotor', { side: 'R' }, 10, 152, 1)];
  const CARW = [['T:bat:P', 'T:drv:VS'], ['T:bat:N', 'T:drv:GND'], ['T:mL:P', 'T:drv:OUT1'], ['T:mL:N', 'T:drv:OUT2'], ['T:mR:P', 'T:drv:OUT3'], ['T:mR:N', 'T:drv:OUT4'],
    ['T:drv:ENA', 'D5'], ['T:drv:ENB', 'D6'], ['T:drv:IN1', 'D7'], ['T:drv:IN2', 'D8'], ['T:drv:IN3', 'D2'], ['T:drv:IN4', 'D4'], ['GND3', 'H:tn18'], ['5V', 'H:tp30'], ['T:drv:GND', 'GND1']];
  const S5P = [['S1', 'A0'], ['S2', 'A1'], ['S3', 'A2'], ['S4', 'A3'], ['S5', 'A4']];
  const kpOf = (src) => { const m = /float\s+Kp\s*=\s*([\d.]+)\s*;/.exec(src || ''); return m ? +m[1] : null; };
  const kdOf = (src) => { const m = /float\s+Kd\s*=\s*([\d.]+)\s*;/.exec(src || ''); return m ? +m[1] : null; };
  const baseOf = (src) => { const m = /int\s+base\s*=\s*(\d+)\s*;/.exec(src || ''); return m ? +m[1] : null; };
  L.push({ id: 'pidline', cls: '11', blocks: false, view: 'carbench', wview: 'carbench', rview: 'arena', code: PIDC, drawer: ['ir5'], serial: false, world: { kind: 'car', car: 'pid' },
    title: t3('PID line follower (smooth and fast)', 'PID लाइन फ़ॉलोअर (स्मूद और तेज़)', 'PID line follower (smooth aur tez)'),
    goal: t3('Racing line followers do not just ask "left or right?": five sensors tell them how far off the line they are, and they steer by that much (P), and against how fast it is changing (D). Tune Kp and Kd, and see the lap get smoother and faster.', 'रेसिंग लाइन फ़ॉलोअर सिर्फ़ "बाएँ या दाएँ?" नहीं पूछते: पाँच सेंसर बताते हैं कि वे लाइन से कितना हटे हैं, और वे उतना ही स्टीयर करते हैं (P), और वह कितनी तेज़ी से बदल रहा है उसके ख़िलाफ़ (D)। Kp और Kd ट्यून कीजिए, और चक्कर को स्मूद और तेज़ होते देखिए।', 'Racing line follower sirf "left ya right?" nahi poochhte: paanch sensor batate hain ki woh line se kitna hate hain, aur woh utna hi steer karte hain (P), aur woh kitni tezi se badal raha hai uske khilaaf (D). Kp aur Kd tune kijiye, aur chakkar ko smooth aur tez hote dekhiye.'),
    setup: { parts: CARP, wires: CARW },
    steps: [
      { k: 'info', do: t3('The car from the line-follower lessons, with its L298N and motors wired as before (ENA 5, ENB 6, IN1–IN4 on 7, 8, 2, 4). Under its nose now sits a bar of five IR sensors, 12 mm apart: the 19 mm tape always covers one or two of them.', 'लाइन फ़ॉलोअर पाठों वाली कार, उसका L298N और मोटरें पहले की तरह जुड़ी (ENA 5, ENB 6, IN1–IN4 पर 7, 8, 2, 4)। उसकी नाक के नीचे अब पाँच IR सेंसर की पट्टी है, 12 mm की दूरी पर: 19 mm की टेप हमेशा उनमें से एक या दो को ढकती है।', 'Line follower lessons wali car, uska L298N aur motors pehle ki tarah jude (ENA 5, ENB 6, IN1–IN4 par 7, 8, 2, 4). Uski naak ke neeche ab paanch IR sensor ki patti hai, 12 mm ki doori par: 19 mm ki tape hamesha unmein se ek ya do ko dhakti hai.'), see: E },
      { k: 'place', place: F('ir5', 'ir5', {}, 150, 70, 2), do: t3('Put the 5-channel sensor\'s plug board on the mat at the ghost (the sensors themselves are on the car).', '5-चैनल सेंसर के प्लग बोर्ड को मैट पर नीली आकृति पर रखिए (सेंसर ख़ुद कार पर हैं)।', '5-channel sensor ke plug board ko mat par neeli shape par rakhiye (sensor khud car par hain).'), see: E },
      w3('ir5.VCC', 'rail:tp', 'Wire its VCC to the + rail.', 'इसका VCC + रेल से जोड़िए।', 'Iska VCC + rail se jodiye.'),
      w3('ir5.GND', 'rail:tn', 'Its GND to the − rail.', 'इसका GND − रेल से।', 'Iska GND − rail se.'),
      ...S5P.map(([s, a]) => w3('ir5.' + s, a, `${s} to ${a}.`, `${s} को ${a} से।`, `${s} ko ${a} se.`)),
      CHECK,
      { k: 'info', code: [24, 41], do: t3('Read loop(): the sensors over the line give the error, from −2 (line far left) to +2 (far right). turn = Kp × error steers by how far off it is; the left wheel gets base + turn, the right base − turn.', 'loop() पढ़िए: लाइन पर पड़े सेंसर एरर देते हैं, −2 (लाइन बहुत बाएँ) से +2 (बहुत दाएँ) तक। turn = Kp × error उतना स्टीयर करता है जितना यह हटा है; बायाँ पहिया base + turn पाता है, दायाँ base − turn।', 'loop() padhiye: line par pade sensor error dete hain, −2 (line bahut left) se +2 (bahut right) tak. turn = Kp × error utna steer karta hai jitna yeh hata hai; left wheel base + turn paata hai, right base − turn.'), see: E },
      RUN(),
      { k: 'act', until: (S) => fresh(S) && S.w('zigzag'), do: t3('Watch the car on the track (the arena).', 'ट्रैक पर कार देखिए (अखाड़ा)।', 'Track par car dekhiye (arena).'),
        see: liveCarSim((lg, C) => pick(lg, `It zig-zags across the line, ${C.swingRate || '?'} swings a second. Kp = 90 steers far too hard: one sensor's worth of error already puts 90 between the wheels, so the car swings past the line every time, and back.`, `यह लाइन के आर-पार ज़िगज़ैग करती है, हर सेकंड ${C.swingRate || '?'} झूले। Kp = 90 बहुत ज़्यादा स्टीयर करता है: एक सेंसर जितना एरर ही पहियों में 90 का फ़र्क़ कर देता है, तो कार हर बार लाइन से आगे झूल जाती है, और वापस।`, `Yeh line ke aar-paar zigzag karti hai, har second ${C.swingRate || '?'} jhoole. Kp = 90 bahut zyada steer karta hai: ek sensor jitna error hi wheels mein 90 ka farq kar deta hai, to car har baar line se aage jhool jaati hai, aur wapas.`)) },
      { k: 'edit', test: (src) => { const k = kpOf(src); return k !== null && k >= 15 && k <= 35; }, set: [[/float Kp = 90;/, 'float Kp = 25;']], do: t3('Gentler: change float Kp = 90; to float Kp = 25; and press Run (the car starts again on the start line).', 'धीमे: float Kp = 90; को float Kp = 25; कीजिए और "चलाइए" दबाइए (कार फिर स्टार्ट लाइन से शुरू होती है)।', 'Dheeme: float Kp = 90; ko float Kp = 25; kijiye aur Run dabaiye (car phir start line se shuru hoti hai).'), see: E },
      { k: 'act', until: (S) => fresh(S) && S.w('fullLap'), do: t3('Watch it go round, until a whole lap is timed (the panel: Laps).', 'इसे घूमते देखिए, जब तक पूरा एक चक्कर न नप जाए (पैनल: Laps)।', 'Ise ghoomte dekhiye, jab tak poora ek chakkar na nap jaaye (panel: Laps).'),
        see: liveCar((lg, L) => pick(lg, `Calm now: a lap in ${L.last ? L.last.toFixed(1) : '?'} s, ${L.off ?? '?'} mm off the line on average, ${L.swings ?? '?'} swings a second. But it is slow.`, `अब शांत: एक चक्कर ${L.last ? L.last.toFixed(1) : '?'} s में, औसतन लाइन से ${L.off ?? '?'} mm, हर सेकंड ${L.swings ?? '?'} झूले। पर यह धीमी है।`, `Ab shaant: ek chakkar ${L.last ? L.last.toFixed(1) : '?'} s mein, average line se ${L.off ?? '?'} mm, har second ${L.swings ?? '?'} jhoole. Par yeh dheemi hai.`)) },
      { k: 'edit', test: (src) => { const b = baseOf(src), k = kpOf(src); return b !== null && b >= 200 && k !== null && k <= 35; }, set: [[/int base = 150;/, 'int base = 210;']], do: t3('Race it: change int base = 150; to int base = 210; and press Run.', 'रेस कराइए: int base = 150; को int base = 210; कीजिए और "चलाइए" दबाइए।', 'Race karaiye: int base = 150; ko int base = 210; kijiye aur Run dabaiye.'), see: E },
      { k: 'act', until: (S) => fresh(S) && S.w('lost'), do: t3('Watch the first bends.', 'पहले मोड़ देखिए।', 'Pehle mod dekhiye.'),
        see: t3('Off it goes at a bend! At this speed the line slides across the sensors faster, and Kp = 25 cannot turn the car hard enough to keep up. More speed needs more steering, but more Kp brought the zig-zag back.', 'एक मोड़ पर यह बाहर निकल गई! इस रफ़्तार पर लाइन सेंसरों के आर-पार तेज़ी से खिसकती है, और Kp = 25 कार को उतना तेज़ नहीं मोड़ पाता। ज़्यादा रफ़्तार को ज़्यादा स्टीयरिंग चाहिए, पर ज़्यादा Kp ने ज़िगज़ैग वापस ला दिया था।', 'Ek mod par yeh bahar nikal gayi! Is speed par line sensors ke aar-paar tezi se khisakti hai, aur Kp = 25 car ko utna tez nahi mod paata. Zyada speed ko zyada steering chahiye, par zyada Kp ne zigzag wapas la diya tha.') },
      { k: 'edit', test: (src) => { const d = kdOf(src), k = kpOf(src), b = baseOf(src); return d !== null && d >= 80 && d <= 250 && k !== null && k >= 40 && k <= 70 && b !== null && b >= 200; }, set: [[/float Kp = 25;/, 'float Kp = 50;'], [/float Kd = 0;/, 'float Kd = 150;']],
        do: t3('Steer harder, and add D to stop the zig-zag: change float Kp = 25; to float Kp = 50; and float Kd = 0; to float Kd = 150; then press Run.', 'और ज़ोर से स्टीयर कीजिए, और ज़िगज़ैग रोकने के लिए D जोड़िए: float Kp = 25; को float Kp = 50; और float Kd = 0; को float Kd = 150; कीजिए, फिर "चलाइए" दबाइए।', 'Aur zor se steer kijiye, aur zigzag rokne ke liye D jodiye: float Kp = 25; ko float Kp = 50; aur float Kd = 0; ko float Kd = 150; kijiye, phir Run dabaiye.'), see: E },
      { k: 'act', until: (S) => fresh(S) && S.w('smooth'), do: t3('Watch it race a whole lap.', 'इसे पूरा एक चक्कर रेस करते देखिए।', 'Ise poora ek chakkar race karte dekhiye.'),
        see: liveCar((lg, L) => pick(lg, `A lap in ${L.last ? L.last.toFixed(1) : '?'} s at speed 210, ${L.off ?? '?'} mm off the line on average, ${L.swings ?? '?'} swings a second: fast and steady. D steers against the change: as the car swings back towards the line the error shrinks fast, and D eases the turn before it overshoots. Drones, cruise control and a lift that stops gently all use PID.`, `रफ़्तार 210 पर एक चक्कर ${L.last ? L.last.toFixed(1) : '?'} s में, औसतन लाइन से ${L.off ?? '?'} mm, हर सेकंड ${L.swings ?? '?'} झूले: तेज़ और स्थिर। D बदलाव के ख़िलाफ़ स्टीयर करता है: कार जब लाइन की ओर लौटती है, एरर तेज़ी से घटता है, और D आगे निकलने से पहले मोड़ को हल्का कर देता है। ड्रोन, क्रूज़ कंट्रोल और आराम से रुकने वाली लिफ़्ट, सब PID से चलते हैं।`, `Speed 210 par ek chakkar ${L.last ? L.last.toFixed(1) : '?'} s mein, average line se ${L.off ?? '?'} mm, har second ${L.swings ?? '?'} jhoole: tez aur sthir. D badlaav ke khilaaf steer karta hai: car jab line ki taraf lautti hai, error tezi se ghat-ta hai, aur D aage nikalne se pehle mod ko halka kar deta hai. Drone, cruise control aur aaram se rukne wali lift, sab PID se chalte hain.`)) },
    ],
    check: [noShort, (S) => (S.conn('rail:tp', '5V') ? null : [W.vRail]), has('ir5', t3('5-channel sensor', '5-चैनल सेंसर', '5-channel sensor')), need('ir5.VCC', '5V', W.to5v, { x: 'VCC' }), need('ir5.GND', 'GND', W.toGnd, { x: 'GND' }), ...S5P.map(([s, a]) => need('ir5.' + s, a, W.join, { a: s, b: a }))],
    done: (S) => S.w('smooth') });
  for (const l of L) { l.n = ++n; l.batch = 24; if (l.scene) l.world = l.scene; } // (the lesson runtime asks the "world": worlds3.js makes it from the scene)
  return L;
}
