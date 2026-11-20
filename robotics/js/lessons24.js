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
//   plotter    a pen plotter: X and Y axes, each a 28BYJ-48 on a GT2 belt (51.2 steps a mm), and an SG90 that lifts the pen
//              (scenes3.js PlotScene inks the paper wherever the pen moves while down). It draws a house. lineTo() first
//              moves all of X, then all of Y: the roof's slopes come out as steps. stepBoth() (already in the sketch:
//              a little X, a little Y, again and again, as a CNC machine interpolates) makes them straight, and then the
//              pen, still down, draws a line across the house to the door: penUp() and penDown() round that move.
//   pickplace  the conveyor brings boxes to a stop plate; a two-servo arm with a suction cup (a vacuum pump on a relay)
//              lifts each into a crate (scenes3.js PickScene). The first program lowers the cup with lift.write(0), the
//              belt's level: the box is in the way, the servo strains and dents it; 40° is the box's top. Then it stops
//              the pump as it starts the swing: the cup lets go half-way round and the box falls on the floor (the
//              program counts it as packed). Waiting 0.6 s for the swing to finish packs three boxes in the crate.
//   sumo       robot sumo on a 1540 mm black ring with a white edge (robots.js CAR_CFG.sumo): the line car with two IR
//              sensors at its front corners looking down (LOW over the white edge) and an HC-SR04 at the front, against a
//              1 kg practice dummy. The first program moves the moment it starts: the referee's 5-second rule. With a
//              5 s wait it charges, pushes the dummy out, and follows it off the ring: the edge is checked only when
//              nothing is ahead. Edge first, then attack: it pushes the dummy out and stays in (win).
// The helpers (t3, P, F, W, need, has, noShort) come from lessons.js. devtools/test/robocore24.mjs plays them end to end.
import { GLASS, CUR, LIFT, SLIDE } from './scenes3.js';
import { ARMCUR, CARCUR } from './robots.js';
import { curlOf } from './parts29.js'; // (batch 29: the robot hand's fingers)

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

const PLOTC = `// Pen plotter: two steppers move the pen over the paper (X to the right, Y towards you), and a servo lifts it.
#include <Stepper.h>
#include <Servo.h>

Stepper sx(2048, 8, 10, 9, 11);          // X axis: IN1-IN4 on pins 8-11
Stepper sy(2048, 4, 6, 5, 7);            // Y axis: IN1-IN4 on pins 4-7
Servo pen;
const float stepsPerMm = 2048 / 40.0;    // 20-tooth GT2 pulleys: 40 mm of belt a turn
float px = 0, py = 0;                    // where the pen is now (mm)

void penUp()   { pen.write(90); delay(300); }
void penDown() { pen.write(25); delay(300); }

// both motors together: a few steps of X, a few of Y, again and again, so the pen goes straight
void stepBoth(long nx, long ny) {
  long n = max(abs(nx), abs(ny));
  long doneX = 0, doneY = 0;
  for (long i = 1; i <= n; i++) {
    long wantX = nx * i / n;
    long wantY = ny * i / n;
    sx.step(wantX - doneX);
    sy.step(wantY - doneY);
    doneX = wantX;
    doneY = wantY;
  }
}

// move the pen to (x, y), in mm
void lineTo(float x, float y) {
  long nx = round((x - px) * stepsPerMm);
  long ny = round((y - py) * stepsPerMm);
  sx.step(nx);                           // all of X first...
  sy.step(ny);                           // ...then all of Y
  px = x;
  py = y;
}

void setup() {
  pen.attach(3);
  penUp();
  sx.setSpeed(15);
  sy.setSpeed(15);
  Serial.begin(9600);
  lineTo(30, 40);                        // the house's top-left corner
  penDown();
  lineTo(70, 40);                        // the walls
  lineTo(70, 80);
  lineTo(30, 80);
  lineTo(30, 40);
  lineTo(50, 20);                        // the roof
  lineTo(70, 40);
  lineTo(45, 80);                        // to the door
  lineTo(45, 65);                        // the door
  lineTo(55, 65);
  lineTo(55, 80);
  penUp();
  Serial.println("Done");
}

void loop() {
}
`;

const PICKC = `// Pick-and-place line: the conveyor brings each box to the stop, and the arm lifts it into the crate.
#include <Stepper.h>
#include <Servo.h>

Stepper belt(2048, 8, 10, 9, 11);      // the conveyor's motor (IN1-IN4 on pins 8-11)
Servo swing;                           // turns the arm: 0 = over the belt, 90 = over the crate
Servo lift;                            // lowers the suction cup: 90 = up
const int irPin = 2;                   // the IR sensor at the stop: LOW = a box has arrived
const int pump = 4;                    // the vacuum pump's relay: HIGH = the cup sucks
int boxes = 0;

void setup() {
  pinMode(irPin, INPUT);
  pinMode(pump, OUTPUT);
  swing.attach(6);
  lift.attach(5);
  swing.write(0);
  lift.write(90);
  belt.setSpeed(12);
  Serial.begin(9600);
}

void loop() {
  if (digitalRead(irPin) == HIGH) {    // no box at the stop yet: run the belt
    belt.step(64);
    return;
  }
  lift.write(0);                       // down onto the box
  delay(500);
  digitalWrite(pump, HIGH);            // suck
  delay(300);
  lift.write(90);                      // up
  delay(500);
  swing.write(90);                     // over the crate
  digitalWrite(pump, LOW);             // let go
  delay(300);
  swing.write(0);                      // back over the belt
  delay(600);
  boxes++;
  Serial.print("Boxes packed: ");
  Serial.println(boxes);
}
`;

const SUMOC = `// Sumo robot: find the opponent with the ultrasonic sensor and push it out of the ring, without leaving the ring yourself.
const int ENA = 5, IN1 = 7, IN2 = 8;    // motor A: the left wheel
const int ENB = 6, IN3 = 2, IN4 = 4;    // motor B: the right wheel
const int edgeL = 11, edgeR = 12;       // IR sensors at the front corners, looking down: LOW over the white edge
const int trig = 9, echo = 10;          // the HC-SR04 at the front

// one motor: v from -255 (backwards) to 255 (forwards)
void motor(int en, int a, int b, int v) {
  digitalWrite(a, v > 0 ? HIGH : LOW);
  digitalWrite(b, v < 0 ? HIGH : LOW);
  analogWrite(en, abs(v));
}
void drive(int left, int right) {
  motor(ENA, IN1, IN2, left);
  motor(ENB, IN3, IN4, right);
}
int distanceCm() {
  digitalWrite(trig, LOW);
  delayMicroseconds(2);
  digitalWrite(trig, HIGH);
  delayMicroseconds(10);
  digitalWrite(trig, LOW);
  long t = pulseIn(echo, HIGH, 25000);
  if (t == 0) return 400;                 // no echo: nothing ahead
  return t / 58;
}

void setup() {
  pinMode(ENA, OUTPUT); pinMode(IN1, OUTPUT); pinMode(IN2, OUTPUT);
  pinMode(ENB, OUTPUT); pinMode(IN3, OUTPUT); pinMode(IN4, OUTPUT);
  pinMode(edgeL, INPUT);
  pinMode(edgeR, INPUT);
  pinMode(trig, OUTPUT);
  pinMode(echo, INPUT);
  Serial.begin(9600);
  Serial.println("Hajime!");
}

void loop() {
  int d = distanceCm();
  if (d < 60) {                           // the opponent is ahead: charge!
    drive(255, 255);
  } else if (digitalRead(edgeL) == LOW || digitalRead(edgeR) == LOW) {   // the white edge: back off and turn
    drive(-200, -200);
    delay(300);
    drive(200, -200);
    delay(250);
  } else {
    drive(140, -140);                     // look for it: turn on the spot
  }
}
`;

const WALLC = `// Wall-following robot: keep 15 cm from the wall on the right, all the way round the room.
const int ENA = 5, IN1 = 7, IN2 = 8;    // motor A: the left wheel
const int ENB = 6, IN3 = 2, IN4 = 4;    // motor B: the right wheel
const int trigF = 9, echoF = 10;        // the HC-SR04 looking ahead
const int trigR = 11, echoR = 12;       // the HC-SR04 looking right, at the wall
int base = 150;                         // speed on a straight (0 .. 255)
float Kp = 8;                           // how hard it steers for each cm off

void motor(int en, int a, int b, int v) {
  v = constrain(v, -255, 255);
  digitalWrite(a, v > 0 ? HIGH : LOW);
  digitalWrite(b, v < 0 ? HIGH : LOW);
  analogWrite(en, abs(v));
}
void drive(int left, int right) {
  motor(ENA, IN1, IN2, left);
  motor(ENB, IN3, IN4, right);
}
int distanceCm(int trig, int echo) {
  digitalWrite(trig, LOW);
  delayMicroseconds(2);
  digitalWrite(trig, HIGH);
  delayMicroseconds(10);
  digitalWrite(trig, LOW);
  long t = pulseIn(echo, HIGH, 25000);
  if (t == 0) return 400;               // no echo
  return t / 58;
}

void setup() {
  pinMode(ENA, OUTPUT); pinMode(IN1, OUTPUT); pinMode(IN2, OUTPUT);
  pinMode(ENB, OUTPUT); pinMode(IN3, OUTPUT); pinMode(IN4, OUTPUT);
  pinMode(trigF, OUTPUT); pinMode(echoF, INPUT);
  pinMode(trigR, OUTPUT); pinMode(echoR, INPUT);
}

void loop() {
  int front = distanceCm(trigF, echoF);
  int right = distanceCm(trigR, echoR);
  if (front < 25) {                     // a wall ahead: turn left on the spot
    drive(-150, 150);
    delay(200);
    return;
  }
  if (right < 15) {
    drive(base - 70, base + 70);        // too close: veer left
  } else {
    drive(base + 70, base - 70);        // too far: veer right
  }
  delay(20);
}
`;

const WIFIC = `// WiFi robot car: the ESP32 makes its own WiFi, and a web page on the phone is the joystick.
#include <WiFi.h>
#include <WebServer.h>

const char* ssid = "DUET-Car";
const char* password = "robocar123";
WebServer server(80);

const int ENA = 14, IN1 = 27, IN2 = 26;   // motor A: the left wheel
const int ENB = 32, IN3 = 25, IN4 = 33;   // motor B: the right wheel
int speed = 200;

void motor(int en, int a, int b, int v) {
  digitalWrite(a, v > 0 ? HIGH : LOW);
  digitalWrite(b, v < 0 ? HIGH : LOW);
  analogWrite(en, abs(v));
}
void drive(int left, int right) {
  motor(ENA, IN1, IN2, left);
  motor(ENB, IN3, IN4, right);
}

// a joystick button: one request when pressed, one when let go
String button(String d, String label) {
  return "<button ontouchstart=\\"fetch('/go?d=" + d + "')\\" ontouchend=\\"fetch('/go?d=S')\\">" + label + "</button>";
}

void handleRoot() {
  String h = "<h2>DUET Car</h2><div style=\\"text-align:center;font-size:30px\\">";
  h += button("F", "▲") + "<br>";
  h += button("L", "◀") + button("R", "▶") + "<br>";
  h += button("B", "▼") + "</div>";
  h += "<p>Hold a button to drive, let go to stop.</p>";
  server.send(200, "text/html", h);
}

void handleGo() {
  String d = server.arg("d");
  if (d == "F") drive(speed, speed);
  else if (d == "B") drive(-speed, -speed);
  else if (d == "L") drive(-speed, speed);
  else if (d == "R") drive(speed, -speed);
  else drive(0, 0);
  server.send(200, "text/plain", "ok");
}

void setup() {
  pinMode(ENA, OUTPUT); pinMode(IN1, OUTPUT); pinMode(IN2, OUTPUT);
  pinMode(ENB, OUTPUT); pinMode(IN3, OUTPUT); pinMode(IN4, OUTPUT);
  Serial.begin(115200);
  WiFi.softAP(ssid, password);            // the car is its own WiFi hotspot
  Serial.print("Join the WiFi ");
  Serial.print(ssid);
  Serial.print(" and open http://");
  Serial.println(WiFi.softAPIP());
  server.on("/", handleRoot);
  server.on("/go", handleGo);
  server.begin();
}

void loop() {
  server.handleClient();
}
`;

const SOCC = `// Robot soccer player: drive it from the phone and score in the yellow goal.
// The app sends one letter per button: F forward, B back, L left, R right, S stop (when you let go).
const int ENA = 5, IN1 = 7, IN2 = 8;    // motor A: the left wheel
const int ENB = 6, IN3 = 2, IN4 = 4;    // motor B: the right wheel
int speed = 230;                        // 0 .. 255

void motor(int en, int a, int b, int v) {
  digitalWrite(a, v > 0 ? HIGH : LOW);
  digitalWrite(b, v < 0 ? HIGH : LOW);
  analogWrite(en, abs(v));
}
void drive(int left, int right) {
  motor(ENA, IN1, IN2, left);
  motor(ENB, IN3, IN4, right);
}

void setup() {
  pinMode(ENA, OUTPUT); pinMode(IN1, OUTPUT); pinMode(IN2, OUTPUT);
  pinMode(ENB, OUTPUT); pinMode(IN3, OUTPUT); pinMode(IN4, OUTPUT);
  Serial.begin(9600);                   // the HC-05 talks at 9600 baud
}

void loop() {
  if (Serial.available() > 0) {
    char c = Serial.read();
    if (c == 'F') drive(speed, speed);
    if (c == 'B') drive(-speed, -speed);
    if (c == 'L') drive(-speed, speed);   // spin on the spot
    if (c == 'R') drive(speed, -speed);
    if (c == 'S') drive(0, 0);
  }
}
`;

const GESTC = `// Gesture-controlled car: tip your hand to drive.
// The MPU-6050 is on the back of a glove, on a 1 m ribbon cable to the car's Uno (the wireless version comes later).
#include <Wire.h>
#include <MPU6050_light.h>

MPU6050 mpu(Wire);
const int ENA = 5, IN1 = 7, IN2 = 8;    // motor A: the left wheel
const int ENB = 6, IN3 = 2, IN4 = 4;    // motor B: the right wheel
int speed = 170;

void motor(int en, int a, int b, int v) {
  digitalWrite(a, v > 0 ? HIGH : LOW);
  digitalWrite(b, v < 0 ? HIGH : LOW);
  analogWrite(en, abs(v));
}
void drive(int left, int right) {
  motor(ENA, IN1, IN2, left);
  motor(ENB, IN3, IN4, right);
}

void setup() {
  pinMode(ENA, OUTPUT); pinMode(IN1, OUTPUT); pinMode(IN2, OUTPUT);
  pinMode(ENB, OUTPUT); pinMode(IN3, OUTPUT); pinMode(IN4, OUTPUT);
  Serial.begin(9600);
  Wire.begin();
  mpu.begin();
  Serial.println("Calibrating: keep the glove flat on the desk");
  mpu.calcOffsets();                    // measures 'flat' for 1 s
  Serial.println("Ready: put the glove on");
}

void loop() {
  mpu.update();
  float fb = mpu.getAngleY();           // hand tipped forward (+) or back (-), in degrees
  float lr = mpu.getAngleX();           // hand tipped right (+) or left (-)

  if (fb > 0) drive(speed, speed);              // forward
  else if (fb < 0) drive(-speed, -speed);       // back
  else if (lr > 0) drive(speed, -speed);        // turn right
  else if (lr < 0) drive(-speed, speed);        // turn left
  else drive(0, 0);                             // flat: stop
  delay(20);
}
`;

const WXC = `// School weather station: temperature, humidity, air pressure and rain, sent to the cloud (ThingSpeak).
#include <WiFi.h>
#include <HTTPClient.h>
#include <Wire.h>
#include <DHT.h>
#include <Adafruit_BMP085.h>

const char* ssid = "DUET-School";
const char* password = "stem2026";
String writeKey = "DUETWX7K2M9Q4R1A";    // the channel's Write API Key (ThingSpeak channel 2468013)

DHT dht(27, DHT11);                       // the DHT11's DATA on GPIO 27
Adafruit_BMP085 bmp;                      // the BMP180 on I2C: SDA GPIO 21, SCL GPIO 22
const int RAIN = 26;                      // the rain gauge's S (a water level sensor standing in a cup)

void setup() {
  Serial.begin(115200);
  dht.begin();
  bmp.begin();
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println();
  Serial.print("WiFi connected: ");
  Serial.println(WiFi.localIP());
}

void loop() {
  float t = dht.readTemperature();
  float h = dht.readHumidity();
  float p = bmp.readPressure() / 100.0;   // Pa to hPa
  int rain = analogRead(RAIN);            // 0: a dry cup; more water, a bigger number

  String url = "http://api.thingspeak.com/update?api_key=" + writeKey;
  url += "&field1=" + String(t) + "&field2=" + String(h) + "&field3=" + String(p) + "&field4=" + String(rain);

  HTTPClient http;
  http.begin(url);
  int code = http.GET();
  Serial.print("Sent ");
  Serial.print(t); Serial.print(" C, ");
  Serial.print(h); Serial.print(" %, ");
  Serial.print(p); Serial.print(" hPa, rain ");
  Serial.println(rain);
  Serial.print("ThingSpeak answered: ");
  if (code > 0) Serial.println(http.getString());   // the entry's number, or 0: not saved
  else Serial.println(code);                       // below 0: no connection
  http.end();
  delay(2000);                                     // then the next update
}
`;

const HANDC = `// Bionic hand: a glove with a flex sensor on each finger moves a robot hand with five servos.
#include <Servo.h>

Servo finger[5];                                // thumb, index, middle, ring, little
const int servoPin[5] = {3, 5, 6, 9, 10};
const int flexPin[5] = {A0, A1, A2, A3, A4};

void setup() {
  Serial.begin(9600);
  for (int i = 0; i < 5; i++) {
    finger[i].attach(servoPin[i]);
  }
}

void loop() {
  for (int i = 0; i < 5; i++) {
    int f = analogRead(flexPin[i]);             // this finger's flex sensor
    int angle = map(f, 0, 1023, 0, 180);
    finger[i].write(angle);                     // 0 = open, 180 = closed
    Serial.print(f);
    Serial.print("  ");
  }
  Serial.println();
  delay(50);
}
`;

const BALC = `// Self-balancing robot: it stands on two wheels by driving them under itself as it starts to fall.
#include <Wire.h>
#include <MPU6050_light.h>

MPU6050 mpu(Wire);
const int ENA = 5, IN1 = 7, IN2 = 8;    // motor A: the left wheel
const int ENB = 6, IN3 = 2, IN4 = 4;    // motor B: the right wheel

float Kp = 40;          // P: how hard it drives for each degree of tilt
float Ki = 0;           // I: how much its push grows while a tilt goes on (per degree, per second)
float Kd = 0;           // D: how hard it pushes against the speed of tipping (per °/s)
float setpoint = -2;    // the tilt it balances at: its battery sits behind the axle, so it stands leaning 2° back
float iTerm = 0;
unsigned long lastT, lastPrint = 0;

void motor(int en, int a, int b, int v) {
  digitalWrite(a, v > 0 ? HIGH : LOW);
  digitalWrite(b, v < 0 ? HIGH : LOW);
  analogWrite(en, abs(v));
}
void drive(int v) {
  motor(ENA, IN1, IN2, v);
  motor(ENB, IN3, IN4, v);
}

void setup() {
  pinMode(ENA, OUTPUT); pinMode(IN1, OUTPUT); pinMode(IN2, OUTPUT);
  pinMode(ENB, OUTPUT); pinMode(IN3, OUTPUT); pinMode(IN4, OUTPUT);
  Serial.begin(115200);
  Wire.begin();
  mpu.begin();
  Serial.println("Hold it upright and still...");
  mpu.calcOffsets();
  Serial.println("Let go!");
  lastT = micros();
}

void loop() {
  mpu.update();
  float angle = mpu.getAngleY();      // + when it leans forward
  float rate = mpu.getGyroY();        // how fast it is tipping (°/s)
  float dt = (micros() - lastT) / 1000000.0;
  lastT = micros();
  if (abs(angle) > 40) {              // it has fallen: stop the wheels
    drive(0);
    return;
  }
  float error = angle - setpoint;
  iTerm = constrain(iTerm + Ki * error * dt, -255, 255);
  int out = Kp * error + iTerm + Kd * rate;
  drive(constrain(out, -255, 255));   // drive under it: forward when it falls forward
  if (millis() - lastPrint > 250) {
    lastPrint = millis();
    Serial.println(angle);
  }
  delay(5);
}
`;

const GIMC = `// Self-stabilising gimbal: the MPU-6050 sits on the camera platform; two servos turn the platform so it stays level.
#include <Wire.h>
#include <MPU6050_light.h>
#include <Servo.h>

MPU6050 mpu(Wire);
Servo rollServo;                // on top of the handle: tips the platform left and right
Servo pitchServo;               // on the bracket: tips it forward and back
float rollPos = 90;             // where the servos are told to be (°)
float pitchPos = 90;
float Kp = 2;                   // how far the servos move, each loop, for each degree the platform is off

void setup() {
  Serial.begin(115200);
  Wire.begin();
  mpu.begin();
  rollServo.attach(9);
  pitchServo.attach(10);
  rollServo.write(90);
  pitchServo.write(90);
  Serial.println("Keep it level and still...");
  mpu.calcOffsets();
  Serial.println("Go!");
}

void loop() {
  mpu.update();
  float roll = mpu.getAngleX();     // the platform's tilt to the right (°)
  float pitch = mpu.getAngleY();    // and forward (°)
  rollPos = rollPos + Kp * roll;    // move each servo by the tilt
  pitchPos = pitchPos + Kp * pitch;
  rollPos = constrain(rollPos, 0, 180);
  pitchPos = constrain(pitchPos, 0, 180);
  rollServo.write(rollPos);
  pitchServo.write(pitchPos);
  Serial.print(roll);
  Serial.print(" ");
  Serial.println(pitch);
  delay(10);
}
`;

const BEAMC = `// Ball-on-beam balancer: the HC-SR04 finds the ball, and the servo tips the beam to roll it to the middle.
#include <Servo.h>

Servo beam;
const int TRIG = 6, ECHO = 7;
float setpoint = 23;    // where the ball should stay: 23 cm from the sensor (the middle of the beam)
float Kp = 3;           // ° of servo for each cm the ball is off
float Ki = 0;           // ° for each cm·s it has been off: it keeps growing while the ball stays off
float Kd = 0;           // ° for each cm/s the ball is rolling
float iTerm = 0, lastDist = 0;
unsigned long lastT;

float readCm() {
  digitalWrite(TRIG, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG, LOW);
  long us = pulseIn(ECHO, HIGH, 30000);
  return us * 0.0343 / 2;
}

void setup() {
  pinMode(TRIG, OUTPUT);
  pinMode(ECHO, INPUT);
  beam.attach(9);
  beam.write(90);
  Serial.begin(9600);
  lastDist = readCm();
  lastT = millis();
}

void loop() {
  float dist = readCm();
  float dt = (millis() - lastT) / 1000.0;
  lastT = millis();
  float error = setpoint - dist;               // + when the ball is too near the sensor
  float speed = (dist - lastDist) / dt;        // cm/s, + when it rolls away from the sensor
  lastDist = dist;
  iTerm = constrain(iTerm + Ki * error * dt, -30, 30);
  float out = Kp * error + iTerm - Kd * speed;
  beam.write(constrain(90 + out, 40, 140));    // above 90 the sensor's end goes up: the ball rolls away from it
  Serial.println(dist);
  delay(50);
}
`;

const RATIONC = `// Smart ration shop: a family's ration card shows its rice for the month, and the scale beeps when the bag has exactly that.
#include <SPI.h>
#include <MFRC522.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <HX711.h>

MFRC522 rfid(10, 9);                   // SDA (SS) on pin 10, RST on pin 9
LiquidCrystal_I2C lcd(0x27, 16, 2);
HX711 scale;
const int BEEP = 8;

String cards[] = {"A3 4F 1C 2D", "5B 2E 91 C4"};   // the families' ration cards
String names[] = {"Sunita", "Ramesh"};
long quota[] = {5000, 3000};           // rice this month (g)
bool taken[] = {false, false};         // has the family had it?
int who = -1;                          // whose rice is being weighed (-1: nobody's)

void setup() {
  Serial.begin(9600);
  SPI.begin();
  rfid.PCD_Init();
  lcd.init();
  lcd.backlight();
  scale.begin(2, 5);                   // DT on pin 2, SCK on pin 5
  scale.set_scale(430);                // this load cell: 430 counts a gram
  scale.tare();                        // the empty bowl reads 0
  pinMode(BEEP, OUTPUT);
  lcd.print("Tap ration card");
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
    who = -1;
    for (int i = 0; i < 2; i++) {
      if (uid == cards[i]) who = i;
    }
    lcd.clear();
    if (who == -1) {
      lcd.print("Unknown card");
//  } else if (taken[who]) {
//    lcd.print(names[who]);
//    lcd.setCursor(0, 1);
//    lcd.print("Already taken");
//    who = -1;
    } else {
      lcd.print(names[who]);
      lcd.print(" ");
      lcd.print(quota[who] / 1000.0, 1);
      lcd.print(" kg");
    }
  }
  if (who >= 0) {                      // weigh the rice in the bowl
    long g = scale.get_units(3);
    lcd.setCursor(0, 1);
    if (g >= quota[who]) {
      tone(BEEP, 2000, 400);
      lcd.print("STOP: all given ");
      Serial.print(names[who]);
      Serial.print(" got ");
      Serial.println(g);
      taken[who] = true;
      who = -1;
    } else {
      lcd.print("Given ");
      lcd.print(g);
      lcd.print(" g      ");
    }
  }
}
`;

const ARMIK = `// Robot arm, reach a point: type x y z (mm) in the Serial Monitor and the claw goes there (inverse kinematics).
#include <Servo.h>

Servo base, shoulder, elbow, claw;
const float L1 = 105;     // shoulder to elbow (mm)
const float L2 = 150;     // elbow to the middle of the claw (mm)
const float H = 78;       // the shoulder's height above the desk (mm)

// x to the right, y towards you, z up, from the middle of the base (mm)
void reachTo(float x, float y, float z) {
  float b = atan2(y, x);                   // which way the base points
  float r = sqrt(x * x + y * y);           // how far out, seen from above
  float h = z - H;                         // how far above the shoulder
  float d = sqrt(r * r + h * h);           // shoulder to claw, in a straight line
//  if (d > L1 + L2 - 2) {
//    Serial.println("Out of reach");
//    return;
//  }
  float s = atan2(h, r) + acos((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d));
  float e = acos((L1 * L1 + L2 * L2 - d * d) / (2 * L1 * L2));
  Serial.print("base ");
  Serial.print(degrees(b));
  Serial.print("  shoulder ");
  Serial.print(degrees(s));
  Serial.print("  elbow ");
  Serial.println(degrees(e));
  base.write(degrees(b));
  shoulder.write(degrees(s));
  elbow.write(degrees(e));
}

void setup() {
  base.attach(3);
  shoulder.attach(5);
  elbow.attach(6);
  claw.attach(9);
  claw.write(30);                          // the claw open
  Serial.begin(9600);
  reachTo(0, 150, 150);                    // ready: in front, up high
  Serial.println("Type x y z in mm, e.g. -90 150 60");
}

void loop() {
  if (Serial.available()) {
    float x = Serial.parseFloat();
    float y = Serial.parseFloat();
    float z = Serial.parseFloat();
    while (Serial.available()) Serial.read();   // the rest of the line
    Serial.print("Going to ");
    Serial.print(x);
    Serial.print(", ");
    Serial.print(y);
    Serial.print(", ");
    Serial.println(z);
    reachTo(x, y, z);
  }
}
`;

const AIDET = `# Object detection on the Raspberry Pi: the camera looks at the table, and YOLOv8n names what it sees.
from picamera2 import Picamera2
from ultralytics import YOLO

picam2 = Picamera2()
picam2.configure(picam2.create_preview_configuration(main={"format": "RGB888", "size": (640, 480)}))
picam2.start()
model = YOLO("yolov8n.pt")       # trained on 80 everyday things (the COCO set)
print("Ready")

while True:
    frame = picam2.capture_array()
    results = model(frame)
    for box in results[0].boxes:
        name = model.names[int(box.cls)]
        conf = float(box.conf)
        if conf > 0.3:
            print(name, round(conf, 2))
    print("---")
`;

const FACEC = `# Face-tracking camera: OpenCV finds the face, and two servos turn the camera to keep it in the middle.
from picamera2 import Picamera2
from gpiozero import AngularServo
import cv2
import time

pan = AngularServo(17, min_angle=-90, max_angle=90)    # turns the camera left and right
tilt = AngularServo(18, min_angle=-90, max_angle=90)   # and up and down
pan_angle = 0
tilt_angle = 0
pan.angle = pan_angle
tilt.angle = tilt_angle

face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
picam2 = Picamera2()
picam2.configure(picam2.create_preview_configuration(main={"format": "RGB888", "size": (640, 480)}))
picam2.start()
frames = 0
t0 = time.time()

while True:
    frame = picam2.capture_array()
    gray = cv2.cvtColor(frame, cv2.COLOR_RGB2GRAY)
    faces = face_cascade.detectMultiScale(gray, 1.1, 5)
    for (x, y, w, h) in faces:
        err_x = (x + w / 2) / frame.shape[1] - 0.5     # the face: -0.5 at the left edge, +0.5 at the right
        err_y = (y + h / 2) / frame.shape[0] - 0.5     # and from the top to the bottom
        pan_angle = pan_angle - err_x * 30
        tilt_angle = tilt_angle - err_y * 20
        pan_angle = max(-80, min(80, pan_angle))
        tilt_angle = max(-60, min(60, tilt_angle))
        pan.angle = pan_angle
        tilt.angle = tilt_angle
        break
    frames += 1
    if time.time() - t0 >= 1:
        print("fps:", frames, " pan:", round(pan_angle))
        frames = 0
        t0 = time.time()
`;

const BINC = `# AI smart bin: the camera looks at what is on the tray, and the flap sends it to the WET or the DRY bin.
from picamera2 import Picamera2
from gpiozero import AngularServo
from ultralytics import YOLO
import time

flap = AngularServo(17, min_angle=-90, max_angle=90)   # -45: the green WET bin, +45: the blue DRY bin
door = AngularServo(18, min_angle=-90, max_angle=90)   # 0: shut, 90: open (the tray tips its load down)
flap.angle = 0
door.angle = 0
WET = ["banana", "apple"]          # food: it rots, so it goes to compost

picam2 = Picamera2()
picam2.configure(picam2.create_preview_configuration(main={"format": "RGB888", "size": (640, 480)}))
picam2.start()
model = YOLO("yolov8n.pt")
print("Drop something in")

while True:
    results = model(picam2.capture_array(), conf=0.5, verbose=False)
    if len(results[0].boxes) == 0:
        continue
    name = model.names[int(results[0].boxes[0].cls)]
    # if name == "cell phone":
    #     print("E-waste! Please hand it to the teacher.")
    #     time.sleep(3)
    #     continue
    if name in WET:
        print(name, "-> WET bin")
        flap.angle = -45
    else:
        print(name, "-> DRY bin")
        flap.angle = 45
    time.sleep(0.5)
    door.angle = 90
    time.sleep(1)
    door.angle = 0
    flap.angle = 0
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
  // 9 ------------------------------------------------------------------------------------------------------ pen plotter
  const okBoth = (src) => /lineTo\(float x, float y\) \{[\s\S]*?stepBoth\(\s*nx\s*,\s*ny\s*\)\s*;[\s\S]*?\n\}/.test(src || '') && !/lineTo\(float x, float y\) \{[^}]*sx\.step\(nx\);/.test(src || '');
  const okLift = (src) => /penUp\(\);\s*\n\s*lineTo\(45,\s*80\);[^\n]*\n\s*penDown\(\);/.test(src || '');
  L.push({ id: 'plotter', cls: '11', blocks: false, view: 'wide', rview: 'scene3cv', code: PLOTC, drawer: ['servo'], serial: true, scene: { kind: 'plot' },
    title: t3('Pen plotter with two steppers', 'दो स्टेपर वाला पेन प्लॉटर', 'Do stepper wala pen plotter'),
    goal: t3('A plotter draws with a pen moved by two motors, one for each direction, as CNC machines and 3D printers do. Make the slanted lines straight by moving both axes together, and lift the pen when it should not draw.', 'प्लॉटर एक पेन से बनाता है जिसे दो मोटरें चलाती हैं, हर दिशा के लिए एक, जैसे CNC मशीनें और 3D प्रिंटर। दोनों अक्षों को साथ चलाकर तिरछी लाइनें सीधी कीजिए, और जहाँ नहीं बनाना वहाँ पेन उठाइए।', 'Plotter ek pen se banata hai jise do motors chalati hain, har disha ke liye ek, jaise CNC machine aur 3D printer. Dono axis ko saath chala kar tirchhi lines seedhi kijiye, aur jahan nahi banana wahan pen uthaiye.'),
    setup: { parts: [F('stX', 'stepper', { mount: 'plotX' }, 96, 150, 0), F('stY', 'stepper', { mount: 'plotY' }, -66, 150, 0), F('psu', 'psu5', {}, 40, 78, 2)],
      wires: [['5V', 'H:tp30'], ['GND3', 'H:tn18'], ['T:psu:P', 'H:bp20'], ['T:psu:N', 'H:bn21'], ['GND1', 'H:bn5'], // (the motors on their own 5 V adapter, the front rails; the servo on the Arduino's, the back rails; one ground)
        ...[['IN1', 8], ['IN2', 9], ['IN3', 10], ['IN4', 11]].map(([id, pin]) => ['T:stX:' + id, 'D' + pin]), ['T:stX:GND', 'H:bn50'], ['T:stX:VCC', 'H:bp50'],
        ...[['IN1', 4], ['IN2', 5], ['IN3', 6], ['IN4', 7]].map(([id, pin]) => ['T:stY:' + id, 'D' + pin]), ['T:stY:GND', 'H:bn44'], ['T:stY:VCC', 'H:bp44']] },
    steps: [
      { k: 'info', do: t3('The X motor moves the pen\'s carriage left and right along a bar; the Y motor moves the whole bar towards and away from you. Both are 28BYJ-48s on GT2 belts (51.2 steps a mm), already wired (X on pins 8–11, Y on 4–7). Together they draw about half an amp, more than the Arduino\'s 5 V pin should give, so they have their own 5 V adapter on the front rails, its − joined to the Arduino\'s GND. An SG90 lifts the pen: 25° puts it on the paper, 90° lifts it.', 'X मोटर पेन की कैरिज को एक छड़ पर बाएँ-दाएँ चलाती है; Y मोटर पूरी छड़ को आपकी ओर और दूर ले जाती है। दोनों GT2 बेल्ट पर 28BYJ-48 हैं (हर mm के 51.2 क़दम), पहले से जुड़ी (X पिन 8–11 पर, Y 4–7 पर)। दोनों मिलकर लगभग आधा एम्पियर लेती हैं, Arduino के 5 V पिन की सीमा से ज़्यादा, इसलिए उनका अपना 5 V एडैप्टर आगे की रेलों पर है, उसका − Arduino के GND से जुड़ा। एक SG90 पेन उठाता है: 25° पर पेन काग़ज़ पर, 90° पर ऊपर।', 'X motor pen ki carriage ko ek rod par left-right chalati hai; Y motor poori rod ko aapki taraf aur door le jaati hai. Dono GT2 belt par 28BYJ-48 hain (har mm ke 51.2 kadam), pehle se judi (X pin 8–11 par, Y 4–7 par). Dono milkar lagbhag aadha ampere leti hain, Arduino ke 5 V pin ki seema se zyada, isliye unka apna 5 V adapter aage ki rails par hai, uska − Arduino ke GND se juda. Ek SG90 pen uthata hai: 25° par pen kaagaz par, 90° par upar.'), see: E },
      { k: 'place', place: F('svP', 'servo', { mount: 'pen' }, 178, 62, 0), do: t3('Put the pen servo\'s plug on the mat at the ghost (the servo is on the pen\'s carriage).', 'पेन सर्वो के प्लग को मैट पर नीली आकृति पर रखिए (सर्वो पेन की कैरिज पर है)।', 'Pen servo ke plug ko mat par neeli shape par rakhiye (servo pen ki carriage par hai).'), see: E },
      w3('svP.SIG', 'D3', 'Wire its orange signal wire to pin 3.', 'इसका नारंगी सिग्नल तार पिन 3 से जोड़िए।', 'Iska orange signal wire pin 3 se jodiye.'),
      w3('svP.VP', 'rail:tp', 'Its red wire to the + rail.', 'इसका लाल तार + रेल से।', 'Iska laal wire + rail se.'),
      w3('svP.GND', 'rail:tn', 'Its brown wire to the − rail.', 'इसका भूरा तार − रेल से।', 'Iska bhoora wire − rail se.'),
      CHECK,
      RUN(),
      { k: 'act', until: (S) => fresh(S) && S.w('stairs'), do: t3('Watch it draw the house (it takes about a minute).', 'इसे घर बनाते देखिए (लगभग एक मिनट लगता है)।', 'Ise ghar banate dekhiye (lagbhag ek minute lagta hai).'),
        see: live((lg, R) => pick(lg, `The walls are fine, but the roof is two steps instead of two slopes (up to ${R.roofDev ?? '?'} mm off). lineTo() moves all of X and then all of Y, so a slanted line becomes an L.`, `दीवारें ठीक हैं, पर छत दो ढलानों की जगह दो सीढ़ियाँ बन गई (ढलान से ${R.roofDev ?? '?'} mm तक दूर)। lineTo() पहले पूरा X, फिर पूरा Y चलाता है, तो तिरछी लाइन L बन जाती है।`, `Deewarein theek hain, par chhat do dhalaanon ki jagah do seedhiyan ban gayi (dhalaan se ${R.roofDev ?? '?'} mm tak door). lineTo() pehle poora X, phir poora Y chalata hai, to tirchhi line L ban jaati hai.`)) },
      { k: 'edit', test: okBoth, set: [[/  sx\.step\(nx\);[^\n]*\n  sy\.step\(ny\);[^\n]*\n/, '  stepBoth(nx, ny);                     // both axes together\n']], do: t3('Move both together: in lineTo(), replace the two lines\n  sx.step(nx);\n  sy.step(ny);\nwith\n  stepBoth(nx, ny);\nand press Run (a fresh sheet).', 'दोनों को साथ चलाइए: lineTo() में ये दो लाइनें\n  sx.step(nx);\n  sy.step(ny);\nहटाकर लिखिए\n  stepBoth(nx, ny);\nऔर "चलाइए" दबाइए (नया काग़ज़)।', 'Dono ko saath chalaiye: lineTo() mein yeh do lines\n  sx.step(nx);\n  sy.step(ny);\nhata kar likhiye\n  stepBoth(nx, ny);\naur Run dabaiye (naya kaagaz).'), see: E },
      { k: 'act', until: (S) => fresh(S) && S.w('drag'), do: t3('Watch the house again.', 'घर फिर से देखिए।', 'Ghar phir se dekhiye.'),
        see: live((lg, R) => pick(lg, `The roof is straight now (${(R.roofDev ?? 9) < 0.5 ? 'right on its pencil lines' : 'within ' + R.roofDev + ' mm of its pencil lines'}). But a ${R.stray ?? '?'} mm line runs across the house to the door: the pen was still down while it moved there.`, `छत अब सीधी है (${(R.roofDev ?? 9) < 0.5 ? 'ठीक पेंसिल की लाइनों पर' : 'पेंसिल की लाइनों से ' + R.roofDev + ' mm के अंदर'})। पर घर के आर-पार दरवाज़े तक ${R.stray ?? '?'} mm की एक लाइन है: वहाँ जाते समय पेन नीचे ही था।`, `Chhat ab seedhi hai (${(R.roofDev ?? 9) < 0.5 ? 'theek pencil ki lines par' : 'pencil ki lines se ' + R.roofDev + ' mm ke andar'}). Par ghar ke aar-paar darwaze tak ${R.stray ?? '?'} mm ki ek line hai: wahan jaate samay pen neeche hi tha.`)) },
      { k: 'edit', test: okLift, set: [[/  lineTo\(45, 80\);[^\n]*\n/, '  penUp();\n  lineTo(45, 80);                        // to the door, in the air\n  penDown();\n']], do: t3('Lift the pen for that move: put penUp(); before lineTo(45, 80); and penDown(); after it, then press Run.', 'उस चाल के लिए पेन उठाइए: lineTo(45, 80); से पहले penUp(); और उसके बाद penDown(); लिखिए, फिर "चलाइए" दबाइए।', 'Us chaal ke liye pen uthaiye: lineTo(45, 80); se pehle penUp(); aur uske baad penDown(); likhiye, phir Run dabaiye.'), see: E },
      { k: 'act', until: (S) => fresh(S) && S.w('house'), do: t3('Watch the last drawing.', 'आख़िरी ड्रॉइंग देखिए।', 'Aakhri drawing dekhiye.'),
        see: live((lg, R) => pick(lg, `A clean house: every line on its pencil line (within ${Math.max(0.5, R.dev ?? 0)} mm), ${R.cover ?? '?'} % of it drawn, nothing extra. G-code, the language of CNC machines and 3D printers, has the same two moves: G1 draws a straight line with both axes together, G0 travels with the tool up.`, `एक साफ़ घर: हर लाइन अपनी पेंसिल लाइन पर (${Math.max(0.5, R.dev ?? 0)} mm के अंदर), ${R.cover ?? '?'} % बना, कुछ फ़ालतू नहीं। G-code, CNC मशीनों और 3D प्रिंटरों की भाषा, में यही दो चालें हैं: G1 दोनों अक्षों को साथ चलाकर सीधी लाइन बनाता है, G0 औज़ार उठाकर चलता है।`, `Ek saaf ghar: har line apni pencil line par (${Math.max(0.5, R.dev ?? 0)} mm ke andar), ${R.cover ?? '?'} % bana, kuch faaltu nahi. G-code, CNC machines aur 3D printers ki bhasha, mein yahi do chaalein hain: G1 dono axis ko saath chala kar seedhi line banata hai, G0 tool utha kar chalta hai.`)) },
    ],
    check: [noShort, (S) => (S.conn('rail:tp', '5V') ? null : [W.vRail]), (S) => (S.conn('rail:tn', 'GND') ? null : [W.gndRail]), has('svP', t3('pen servo', 'पेन सर्वो', 'pen servo')), need('svP.SIG', 'D3', W.toPin, { x: t3('servo\'s orange wire', 'सर्वो का नारंगी तार', 'servo ka orange wire'), p: 3 }), need('svP.VP', '5V', W.to5v, { x: t3('servo\'s red wire', 'सर्वो का लाल तार', 'servo ka laal wire') }), need('svP.GND', 'GND', W.toGnd, { x: t3('servo\'s brown wire', 'सर्वो का भूरा तार', 'servo ka bhoora wire') })],
    done: (S) => S.w('house') });
  // 10 --------------------------------------------------------------------------------------------- pick-and-place line
  const okTop = (src) => { const m = /\n  lift\.write\((\d+)\);\s*\/\/ down onto the box/.exec(src || ''); return !!m && +m[1] >= 38 && +m[1] <= 45; };
  const okSwing = (src) => { const m = /swing\.write\(90\);[^\n]*\n\s*delay\((\d+)\);/.exec(src || ''); return !!m && +m[1] >= 400 && +m[1] <= 1500; };
  L.push({ id: 'pickplace', cls: '11', blocks: false, view: 'wide', rview: 'scene3cv', code: PICKC, drawer: ['servo'], serial: true, scene: { kind: 'pick' },
    title: t3('Pick-and-place line: conveyor, sensor and arm', 'पिक-एंड-प्लेस लाइन: कन्वेयर, सेंसर और बाँह', 'Pick-and-place line: conveyor, sensor aur baanh'),
    goal: t3('A small packing line: the conveyor brings each box to a stop, the IR sensor says it has arrived, and an arm with a suction cup lifts it into a crate. Make the arm gentle with the boxes and patient with its moves.', 'एक छोटी पैकिंग लाइन: कन्वेयर हर डिब्बे को स्टॉप तक लाता है, आईआर सेंसर बताता है कि वह आ गया, और सक्शन कप वाली बाँह उसे उठाकर क्रेट में रखती है। बाँह को डिब्बों के साथ नरम और अपनी चालों के साथ धैर्यवान बनाइए।', 'Ek chhoti packing line: conveyor har dabbe ko stop tak laata hai, IR sensor batata hai ki woh aa gaya, aur suction cup wali baanh use utha kar crate mein rakhti hai. Baanh ko dabbon ke saath naram aur apni chaalon ke saath dhairyawaan banaiye.'),
    setup: { parts: [F('st', 'stepper', { mount: 'belt' }, 96, 150, 0), F('ir1', 'ir', { mount: 'belt' }, 196, 120, 0), F('svS', 'servo', { mount: 'pick' }, 178, 40, 0), F('rl1', 'relay', {}, 30, 118, 0), F('bat', 'aa4', {}, -40, 150, 0), F('pump', 'pump', { mount: 'vac' }, 182, 150, 1)],
      wires: [...POWER, ...[['IN1', 8], ['IN2', 9], ['IN3', 10], ['IN4', 11]].map(([id, pin]) => ['T:st:' + id, 'D' + pin]), ['T:st:GND', 'H:bn50'], ['T:st:VCC', 'H:bp50'],
        ['T:ir1:OUT', 'D2'], ['T:ir1:VCC', 'H:tp40'], ['T:ir1:GND', 'H:tn40'], ['T:svS:SIG', 'D6'], ['T:svS:VP', 'H:bp36'], ['T:svS:GND', 'H:bn36'],
        ['T:rl1:S', 'D4'], ['T:rl1:VCC', 'H:tp44'], ['T:rl1:GND', 'H:tn44'], ['T:pump:N', 'T:bat:N'], ['T:bat:P', 'T:rl1:COM'], ['T:rl1:NO', 'T:pump:P']] },
    steps: [
      { k: 'info', do: t3('The conveyor (pins 8–11), the IR sensor at the stop (pin 2), the arm\'s swing servo (pin 6) and the vacuum pump\'s relay (pin 4, the pump on its own battery) are wired. The lift servo, which lowers the suction cup, is not.', 'कन्वेयर (पिन 8–11), स्टॉप पर आईआर सेंसर (पिन 2), बाँह का घुमाने वाला सर्वो (पिन 6) और वैक्यूम पंप का रिले (पिन 4, पंप अपनी बैटरी पर) जुड़े हैं। ऊपर-नीचे करने वाला सर्वो, जो सक्शन कप नीचे लाता है, नहीं जुड़ा।', 'Conveyor (pin 8–11), stop par IR sensor (pin 2), baanh ka ghumane wala servo (pin 6) aur vacuum pump ka relay (pin 4, pump apni battery par) jude hain. Upar-neeche karne wala servo, jo suction cup neeche laata hai, nahi juda.'), see: E },
      { k: 'place', place: F('svL', 'servo', { mount: 'pick' }, 178, 70, 0), do: t3('Put the lift servo\'s plug on the mat at the ghost (the servo is on the arm).', 'ऊपर-नीचे वाले सर्वो के प्लग को मैट पर नीली आकृति पर रखिए (सर्वो बाँह पर है)।', 'Upar-neeche wale servo ke plug ko mat par neeli shape par rakhiye (servo baanh par hai).'), see: E },
      w3('svL.SIG', 'D5', 'Wire its orange signal wire to pin 5.', 'इसका नारंगी सिग्नल तार पिन 5 से जोड़िए।', 'Iska orange signal wire pin 5 se jodiye.'),
      w3('svL.VP', 'rail:bp', 'Its red wire to the front + rail.', 'इसका लाल तार आगे वाली + रेल से।', 'Iska laal wire aage wali + rail se.'),
      w3('svL.GND', 'rail:bn', 'Its brown wire to the front − rail.', 'इसका भूरा तार आगे वाली − रेल से।', 'Iska bhoora wire aage wali − rail se.'),
      CHECK,
      RUN(),
      { k: 'act', until: (S) => fresh(S) && S.w('press'), do: t3('Watch the first box arrive and the arm come down.', 'पहले डिब्बे को आते और बाँह को नीचे आते देखिए।', 'Pehle dabbe ko aate aur baanh ko neeche aate dekhiye.'),
        see: t3('The cup lands on the box and keeps pushing: lift.write(0) asks for the belt\'s level, but the box is in the way. The servo strains (it draws its stall current) and the box\'s top is dented. A suction cup only needs to touch: the box\'s top is at 40°.', 'कप डिब्बे पर आता है और दबाता रहता है: lift.write(0) बेल्ट के स्तर तक माँगता है, पर डिब्बा रास्ते में है। सर्वो पूरा ज़ोर लगाता है (रुकने का करंट खींचता है) और डिब्बे का ऊपर पिचक जाता है। सक्शन कप को बस छूना है: डिब्बे का ऊपर 40° पर है।', 'Cup dabbe par aata hai aur dabata rehta hai: lift.write(0) belt ke level tak maangta hai, par dabba raaste mein hai. Servo poora zor lagata hai (rukne ka current kheenchta hai) aur dabbe ka upar pichak jaata hai. Suction cup ko bas chhoona hai: dabbe ka upar 40° par hai.') },
      { k: 'edit', test: okTop, set: [[/  lift\.write\(0\);([^\n]*)/, '  lift.write(40);$1']], do: t3('Change lift.write(0); (down onto the box) to lift.write(40); and press Run.', 'lift.write(0); (डिब्बे पर नीचे) को lift.write(40); कीजिए और "चलाइए" दबाइए।', 'lift.write(0); (dabbe par neeche) ko lift.write(40); kijiye aur Run dabaiye.'), see: E },
      { k: 'act', until: (S) => fresh(S) && S.w('dropped'), do: t3('Watch it pick the next box.', 'इसे अगला डिब्बा उठाते देखिए।', 'Ise agla dabba uthate dekhiye.'),
        see: t3('It lifts the box gently now, but switches the pump off the moment it starts the swing: the cup lets go half-way round, over the gap, and the box falls on the floor. The Serial Monitor still says "Boxes packed": the program cannot see where the arm is. A servo gets its order at once, but takes time to get there.', 'अब यह डिब्बा आराम से उठाती है, पर घूमना शुरू करते ही पंप बंद कर देती है: कप आधे रास्ते में छोड़ देता है, खाली जगह के ऊपर, और डिब्बा फ़र्श पर गिर जाता है। सीरियल मॉनिटर फिर भी कहता है "Boxes packed": प्रोग्राम देख नहीं सकता कि बाँह कहाँ है। सर्वो को आदेश तुरंत मिलता है, पर वहाँ पहुँचने में समय लगता है।', 'Ab yeh dabba aaram se uthati hai, par ghoomna shuru karte hi pump band kar deti hai: cup aadhe raaste mein chhod deta hai, khaali jagah ke upar, aur dabba farsh par gir jaata hai. Serial Monitor phir bhi kehta hai "Boxes packed": program dekh nahi sakta ki baanh kahan hai. Servo ko order turant milta hai, par wahan pahunchne mein samay lagta hai.') },
      { k: 'edit', test: okSwing, set: [[/(  swing\.write\(90\);[^\n]*\n)/, '$1  delay(600);                          // wait until it is over the crate\n']], do: t3('Wait for the swing: after swing.write(90); add delay(600); and press Run.', 'घुमाव का इंतज़ार कीजिए: swing.write(90); के बाद delay(600); लिखिए और "चलाइए" दबाइए।', 'Ghumaav ka intezaar kijiye: swing.write(90); ke baad delay(600); likhiye aur Run dabaiye.'), see: E },
      { k: 'act', until: (S) => fresh(S) && S.w('placed3'), do: t3('Watch three boxes go into the crate.', 'तीन डिब्बों को क्रेट में जाते देखिए।', 'Teen dabbon ko crate mein jaate dekhiye.'),
        see: live((lg, R) => pick(lg, `${R.placed ?? 3} boxes in the crate, none dropped, none dented. Factory pick-and-place robots work the same way, but faster: they wait for a "move done" signal from their motors instead of a fixed delay.`, `क्रेट में ${R.placed ?? 3} डिब्बे, कोई नहीं गिरा, कोई नहीं पिचका। फ़ैक्टरी के पिक-एंड-प्लेस रोबोट भी ऐसे ही काम करते हैं, बस तेज़: वे तय delay की जगह अपनी मोटरों से "चाल पूरी" का सिग्नल लेते हैं।`, `Crate mein ${R.placed ?? 3} dabbe, koi nahi gira, koi nahi pichka. Factory ke pick-and-place robot bhi aise hi kaam karte hain, bas tez: woh fixed delay ki jagah apni motors se "chaal poori" ka signal lete hain.`)) },
    ],
    check: [noShort, (S) => (S.conn('rail:tp', '5V') ? null : [W.vRail]), has('svL', t3('lift servo', 'ऊपर-नीचे वाला सर्वो', 'upar-neeche wala servo')), need('svL.SIG', 'D5', W.toPin, { x: t3('lift servo\'s orange wire', 'ऊपर-नीचे वाले सर्वो का नारंगी तार', 'upar-neeche wale servo ka orange wire'), p: 5 }), need('svL.VP', '5V', W.to5v, { x: t3('lift servo\'s red wire', 'सर्वो का लाल तार', 'servo ka laal wire') }), need('svL.GND', 'GND', W.toGnd, { x: t3('lift servo\'s brown wire', 'सर्वो का भूरा तार', 'servo ka bhoora wire') })],
    done: (S) => S.w('placed3') });
  // 11 -------------------------------------------------------------------------------------------------------- sumo robot
  const okWait5 = (src) => /Serial\.println\("Hajime!"\);\s*\n\s*delay\(\s*5000\s*\)\s*;/.test(src || '') || /void setup\(\) \{[\s\S]*?delay\(\s*5000\s*\)\s*;[\s\S]*?\n\}/.test(src || '');
  const okEdgeFirst = (src) => { const m = /void loop\(\) \{([\s\S]*)\n\}/.exec(src || ''); if (!m) return false; const b = m[1]; const e = b.indexOf('digitalRead(edgeL)'), c = b.indexOf('d < 60'); return e > 0 && c > 0 && e < c; };
  L.push({ id: 'sumo', cls: '11', blocks: false, view: 'carbench', wview: 'carbench', rview: 'arenasumo', code: SUMOC, drawer: ['hcsr04'], serial: true, world: { kind: 'car', car: 'sumo' },
    title: t3('Sumo robot', 'सूमो रोबोट', 'Sumo robot'),
    goal: t3('Robot sumo: two robots in a black ring with a white edge; whoever pushes the other out wins. Find the opponent with the ultrasonic sensor, obey the referee\'s start rule, and never drive out yourself.', 'रोबोट सूमो: सफ़ेद किनारे वाले काले घेरे में दो रोबोट; जो दूसरे को बाहर धकेले वह जीतता है। अल्ट्रासोनिक सेंसर से विरोधी को ढूँढिए, रेफ़री के शुरुआती नियम को मानिए, और ख़ुद कभी बाहर मत जाइए।', 'Robot sumo: safed kinare wale kaale ghere mein do robot; jo doosre ko bahar dhakele woh jeetta hai. Ultrasonic sensor se virodhi ko dhoondhiye, referee ke shuruaati niyam ko maaniye, aur khud kabhi bahar mat jaiye.'),
    setup: { parts: [...CARP, F('irL', 'ir', {}, 140, 62, 2), F('irR', 'ir', {}, 178, 62, 2)],
      wires: [...CARW, ['T:irL:VCC', 'H:tp40'], ['T:irL:GND', 'H:tn40'], ['T:irL:OUT', 'D11'], ['T:irR:VCC', 'H:tp44'], ['T:irR:GND', 'H:tn44'], ['T:irR:OUT', 'D12']] },
    steps: [
      { k: 'info', do: t3('The car, its L298N and motors are wired as before, and two IR sensors at its front corners look down at the ring (pins 11 and 12): over the black ring nothing comes back (HIGH), over the white edge it does (LOW). The opponent is a 1 kg practice robot.', 'कार, उसका L298N और मोटरें पहले की तरह जुड़ी हैं, और आगे के कोनों पर दो IR सेंसर घेरे को नीचे देखते हैं (पिन 11 और 12): काले घेरे पर कुछ नहीं लौटता (HIGH), सफ़ेद किनारे पर लौटता है (LOW)। विरोधी 1 kg का अभ्यास रोबोट है।', 'Car, uska L298N aur motors pehle ki tarah jude hain, aur aage ke kono par do IR sensor ghere ko neeche dekhte hain (pin 11 aur 12): kaale ghere par kuch nahi lautta (HIGH), safed kinare par lautta hai (LOW). Virodhi 1 kg ka abhyaas robot hai.'), see: E },
      { k: 'place', place: P('us1', 'hcsr04', {}, 'j50', 0), do: t3('Put the HC-SR04 in the breadboard at the ghost (row j, from column 50): it looks ahead from the car\'s nose.', 'HC-SR04 को ब्रेडबोर्ड में नीली आकृति पर लगाइए (पंक्ति j, कॉलम 50 से): यह कार की नाक से आगे देखता है।', 'HC-SR04 ko breadboard mein neeli shape par lagaiye (row j, column 50 se): yeh car ki naak se aage dekhta hai.'), see: E },
      w3('us1.VCC', 'rail:tp', 'Wire its VCC to the + rail.', 'इसका VCC + रेल से जोड़िए।', 'Iska VCC + rail se jodiye.'),
      w3('us1.TRIG', 'D9', 'Its TRIG to pin 9.', 'इसका TRIG पिन 9 से।', 'Iska TRIG pin 9 se.'),
      w3('us1.ECHO', 'D10', 'Its ECHO to pin 10.', 'इसका ECHO पिन 10 से।', 'Iska ECHO pin 10 se.'),
      w3('us1.GND', 'rail:tn', 'Its GND to the − rail.', 'इसका GND − रेल से।', 'Iska GND − rail se.'),
      CHECK,
      RUN(),
      { k: 'act', until: (S) => fresh(S) && S.w('early'), do: t3('Watch the start (the arena).', 'शुरुआत देखिए (अखाड़ा)।', 'Shuruaat dekhiye (arena).'),
        see: t3('"Matta!" The referee stops the bout: the car moved the moment it was switched on. In robot sumo, as in real sumo, both robots must wait 5 seconds after the start, so the players can step back from the ring.', '"मत्ता!" रेफ़री मुकाबला रोकता है: कार चालू होते ही चल पड़ी। रोबोट सूमो में, असली सूमो की तरह, दोनों रोबोटों को शुरुआत के बाद 5 सेकंड रुकना होता है, ताकि खिलाड़ी घेरे से पीछे हट सकें।', '"Matta!" Referee muqaabla rokta hai: car on hote hi chal padi. Robot sumo mein, asli sumo ki tarah, dono robots ko shuruaat ke baad 5 second rukna hota hai, taaki players ghere se peeche hat sakein.') },
      { k: 'edit', test: okWait5, set: [[/(  Serial\.println\("Hajime!"\);\n)/, '$1  delay(5000);                            // the 5-second rule\n']], do: t3('At the end of setup(), after Serial.println("Hajime!"); add delay(5000); and press Run.', 'setup() के आख़िर में, Serial.println("Hajime!"); के बाद delay(5000); लिखिए और "चलाइए" दबाइए।', 'setup() ke aakhir mein, Serial.println("Hajime!"); ke baad delay(5000); likhiye aur Run dabaiye.'), see: E },
      { k: 'act', until: (S) => fresh(S) && S.w('out'), do: t3('Watch the bout.', 'मुकाबला देखिए।', 'Muqaabla dekhiye.'),
        see: t3('It waits, charges and pushes the opponent out... and drives straight out after it! While the opponent is ahead (even off the ring), d < 60 is true, so the edge sensors are never read. Both robots out: in a real bout, whoever touches the floor first loses.', 'यह रुकती है, धावा बोलती है और विरोधी को बाहर धकेलती है... और उसके पीछे सीधे बाहर चली जाती है! जब तक विरोधी आगे है (घेरे के बाहर भी), d < 60 सच रहता है, तो किनारे वाले सेंसर कभी पढ़े ही नहीं जाते। दोनों रोबोट बाहर: असली मुकाबले में जो पहले फ़र्श छूता है वह हारता है।', 'Yeh rukti hai, dhaava bolti hai aur virodhi ko bahar dhakelti hai... aur uske peeche seedhe bahar chali jaati hai! Jab tak virodhi aage hai (ghere ke bahar bhi), d < 60 sach rehta hai, to kinare wale sensor kabhi padhe hi nahi jaate. Dono robot bahar: asli muqaable mein jo pehle farsh chhoota hai woh haarta hai.') },
      { k: 'edit', test: okEdgeFirst, set: [[/  if \(d < 60\) \{[^\n]*\n    drive\(255, 255\);\n  \} else if \(digitalRead\(edgeL\) == LOW \|\| digitalRead\(edgeR\) == LOW\) \{([^\n]*)\n((?:    [^\n]*\n){4})/, '  if (digitalRead(edgeL) == LOW || digitalRead(edgeR) == LOW) {$1\n$2  } else if (d < 60) {                    // the opponent is ahead: charge!\n    drive(255, 255);\n']],
        do: t3('The edge comes first: in loop(), swap the two tests, so it reads\n  if (digitalRead(edgeL) == LOW || digitalRead(edgeR) == LOW) {\n    (back off and turn)\n  } else if (d < 60) {\n    drive(255, 255);\n  } else {\n    (search)\n  }\nand press Run.', 'किनारा पहले: loop() में दोनों जाँचों की जगह बदलिए, ताकि यह ऐसा पढ़े\n  if (digitalRead(edgeL) == LOW || digitalRead(edgeR) == LOW) {\n    (पीछे हटो और मुड़ो)\n  } else if (d < 60) {\n    drive(255, 255);\n  } else {\n    (ढूँढो)\n  }\nऔर "चलाइए" दबाइए।', 'Kinara pehle: loop() mein dono checks ki jagah badliye, taaki yeh aisa padhe\n  if (digitalRead(edgeL) == LOW || digitalRead(edgeR) == LOW) {\n    (peeche hato aur mudo)\n  } else if (d < 60) {\n    drive(255, 255);\n  } else {\n    (dhoondho)\n  }\naur Run dabaiye.'), see: E },
      { k: 'act', until: (S) => fresh(S) && S.w('win'), do: t3('Watch the bout again.', 'मुकाबला फिर देखिए।', 'Muqaabla phir dekhiye.'),
        see: t3('It pushes the opponent over the edge, sees the white line under its own nose, and backs off: it stays in, and wins. Every sumo robot checks its edge sensors before anything else, many times a second.', 'यह विरोधी को किनारे से बाहर धकेलती है, अपनी नाक के नीचे सफ़ेद लाइन देखती है, और पीछे हट जाती है: यह अंदर रहती है, और जीतती है। हर सूमो रोबोट किसी भी चीज़ से पहले अपने किनारे वाले सेंसर जाँचता है, हर सेकंड कई बार।', 'Yeh virodhi ko kinare se bahar dhakelti hai, apni naak ke neeche safed line dekhti hai, aur peeche hat jaati hai: yeh andar rehti hai, aur jeetti hai. Har sumo robot kisi bhi cheez se pehle apne kinare wale sensor jaanchta hai, har second kai baar.') },
    ],
    check: [noShort, (S) => (S.conn('rail:tp', '5V') ? null : [W.vRail]), has('us1', t3('ultrasonic sensor', 'अल्ट्रासोनिक सेंसर', 'ultrasonic sensor')), need('us1.TRIG', 'D9', W.toPin, { x: 'TRIG', p: 9 }), need('us1.ECHO', 'D10', W.toPin, { x: 'ECHO', p: 10 }), need('us1.VCC', '5V', W.to5v, { x: 'VCC' }), need('us1.GND', 'GND', W.toGnd, { x: 'GND' })],
    done: (S) => S.w('win') });
  // 12 ------------------------------------------------------------------------------------------- wall-following robot
  const okP = (src) => /int\s+error\s*=\s*right\s*-\s*15\s*;/.test(src || '') && /int\s+turn\s*=\s*Kp\s*\*\s*error\s*;/.test(src || '') && /drive\(\s*base\s*\+\s*turn\s*,\s*base\s*-\s*turn\s*\)/.test(src || '');
  const okClamp = (src) => /int\s+error\s*=\s*constrain\(\s*right\s*,\s*0\s*,\s*(2\d|30)\s*\)\s*-\s*15\s*;/.test(src || '') && /drive\(\s*base\s*\+\s*turn\s*,\s*base\s*-\s*turn\s*\)/.test(src || '');
  L.push({ id: 'wallp', cls: '11', blocks: false, view: 'carbench', wview: 'carbench', rview: 'arenawall', code: WALLC, drawer: ['hcsr04'], serial: false, world: { kind: 'car', car: 'wallp' },
    title: t3('Wall-following robot (P control)', 'दीवार के साथ चलने वाला रोबोट (P कंट्रोल)', 'Deewar ke saath chalne wala robot (P control)'),
    goal: t3('A robot vacuum cleans along the skirting by keeping a set distance from the wall. Make the car keep 15 cm from the wall on its right, all the way round a room with an almirah in one corner: first by "too close or too far", then by how far off it is (P control).', 'रोबोट वैक्यूम दीवार से एक तय दूरी रखकर किनारे-किनारे सफ़ाई करता है। कार को उसकी दाईं ओर की दीवार से 15 cm पर रखिए, एक कोने में अलमारी वाले पूरे कमरे के चारों ओर: पहले "बहुत पास या बहुत दूर" से, फिर इससे कि वह कितनी हटी है (P कंट्रोल)।', 'Robot vacuum deewar se ek tay doori rakhkar kinaare-kinaare safai karta hai. Car ko uski right taraf ki deewar se 15 cm par rakhiye, ek kone mein almaari wale poore kamre ke chaaron or: pehle "bahut paas ya bahut door" se, phir isse ki woh kitni hati hai (P control).'),
    setup: { parts: [...CARP, P('us1', 'hcsr04', {}, 'j50', 0)], wires: [...CARW, ['H:f50', 'H:tp41'], ['H:f51', 'D9'], ['H:f52', 'D10'], ['H:f53', 'H:tn44']] },
    steps: [
      { k: 'info', do: t3('The car, its L298N and motors are wired as before, and one HC-SR04 looks ahead from its nose (pins 9 and 10). The room is 3 m × 2 m, with a steel almirah in the far right corner (the 🏁 Robot view). The car starts 15 cm from the near wall, the wall on its right.', 'कार, उसका L298N और मोटरें पहले की तरह जुड़ी हैं, और एक HC-SR04 उसकी नाक से आगे देखता है (पिन 9 और 10)। कमरा 3 m × 2 m है, दूर वाले दाएँ कोने में स्टील की अलमारी है (🏁 रोबोट व्यू)। कार पास वाली दीवार से 15 cm पर शुरू होती है, दीवार उसकी दाईं ओर।', 'Car, uska L298N aur motors pehle ki tarah jude hain, aur ek HC-SR04 uski naak se aage dekhta hai (pin 9 aur 10). Kamra 3 m × 2 m hai, door wale right kone mein steel ki almaari hai (🏁 Robot view). Car paas wali deewar se 15 cm par shuru hoti hai, deewar uski right taraf.'), see: E },
      { k: 'place', place: P('us2', 'hcsr04', {}, 'j40', 0), do: t3('The robot\'s right eye: plug a second HC-SR04 into 40j–43j.', 'रोबोट की दाईं आँख: दूसरा HC-SR04 40j–43j में लगाइए।', 'Robot ki right aankh: doosra HC-SR04 40j–43j mein lagaiye.'),
        see: t3('On the car it sits at the right front corner, looking straight out at the wall.', 'कार पर यह आगे वाले दाएँ कोने पर लगा है, सीधे दीवार की ओर देखता हुआ।', 'Car par yeh aage wale right kone par laga hai, seedhe deewar ki taraf dekhta hua.') },
      w3('us2.VCC', 'rail:tp', 'Its VCC (column 40) to the + rail.', 'इसका VCC (कॉलम 40) + रेल से।', 'Iska VCC (column 40) + rail se.'),
      w3('us2.TRIG', 'D11', 'Trig (column 41) to pin 11.', 'Trig (कॉलम 41) पिन 11 से।', 'Trig (column 41) pin 11 se.'),
      w3('us2.ECHO', 'D12', 'Echo (column 42) to pin 12.', 'Echo (कॉलम 42) पिन 12 से।', 'Echo (column 42) pin 12 se.'),
      w3('us2.GND', 'rail:tn', 'GND (column 43) to the − rail.', 'GND (कॉलम 43) − रेल से।', 'GND (column 43) − rail se.'),
      CHECK,
      RUN(t3('Run puts the car back at its start.', '"चलाइए" कार को वापस शुरुआत पर रखता है।', 'Run car ko wapas shuruaat par rakhta hai.')),
      { k: 'act', until: (S) => fresh(S) && S.w('zigzag'), do: t3('Watch it go along the wall (the 🏁 Robot view), and the swings in the panel.', 'इसे दीवार के साथ चलते देखिए (🏁 रोबोट व्यू), और पैनल में झूले।', 'Ise deewar ke saath chalte dekhiye (🏁 Robot view), aur panel mein jhoole.'),
        see: liveCarSim((lg, C) => pick(lg, `It keeps to the wall, but it never drives straight: ${C.swingRate ?? '?'} swings a second. Too close: hard left. Too far: hard right. There are only two answers, and both are a full turn, even when it is 1 cm off. This is bang-bang control, like a room heater that is either full on or off.`, `यह दीवार के साथ रहती है, पर कभी सीधी नहीं चलती: हर सेकंड ${C.swingRate ?? '?'} झूले। बहुत पास: ज़ोर से बाएँ। बहुत दूर: ज़ोर से दाएँ। सिर्फ़ दो जवाब हैं, और दोनों पूरा मोड़ हैं, चाहे यह 1 cm ही हटी हो। यह बैंग-बैंग कंट्रोल है, उस हीटर जैसा जो या तो पूरा चालू है या बंद।`, `Yeh deewar ke saath rehti hai, par kabhi seedhi nahi chalti: har second ${C.swingRate ?? '?'} jhoole. Bahut paas: zor se left. Bahut door: zor se right. Sirf do jawaab hain, aur dono poora mod hain, chahe yeh 1 cm hi hati ho. Yeh bang-bang control hai, us heater jaisa jo ya to poora on hai ya off.`)) },
      { k: 'edit', test: okP, set: [[/  if \(right < 15\) \{\n[^\n]*\n  \} else \{\n[^\n]*\n  \}\n/, '  int error = right - 15;               // + too far, - too close (cm)\n  int turn = Kp * error;                // steer as hard as it is off\n  drive(base + turn, base - turn);\n']],
        do: t3('P control: steer by how far off it is. In loop(), replace the whole if (right < 15) { … } else { … } with\n  int error = right - 15;\n  int turn = Kp * error;\n  drive(base + turn, base - turn);\nand press Run.', 'P कंट्रोल: जितना हटी है, उतना स्टीयर कीजिए। loop() में पूरे if (right < 15) { … } else { … } की जगह लिखिए\n  int error = right - 15;\n  int turn = Kp * error;\n  drive(base + turn, base - turn);\nऔर "चलाइए" दबाइए।', 'P control: jitna hati hai, utna steer kijiye. loop() mein poore if (right < 15) { … } else { … } ki jagah likhiye\n  int error = right - 15;\n  int turn = Kp * error;\n  drive(base + turn, base - turn);\naur Run dabaiye.'), see: E },
      { k: 'act', until: (S) => fresh(S) && S.w('whip'), do: t3('Watch it go along the almirah, to its end.', 'इसे अलमारी के साथ, उसके सिरे तक जाते देखिए।', 'Ise almaari ke saath, uske sire tak jaate dekhiye.'),
        see: liveCarSim((lg, C) => pick(lg, `Smooth and straight along the walls, no zig-zag at all... until the almirah ends. There the wall on its right is suddenly gone: the side sensor jumps from 15 cm to the far wall, 70 cm away, or hears no echo at all (400). Error = 55 or more, turn = 8 × 55 = 440: one wheel full forward, the other full back. It whips round on the spot, ${C.whip || '?'}° in just over half a second, far too far, nose into the almirah's side, and now every reading throws it the other way. P control believes every reading, however wild.`, `दीवारों के साथ स्मूद और सीधी, कोई ज़िग-ज़ैग नहीं... जब तक अलमारी ख़त्म नहीं होती। वहाँ इसकी दाईं ओर की दीवार अचानक ग़ायब: साइड सेंसर 15 cm से कूदकर 70 cm दूर की दीवार पढ़ता है, या कोई गूँज ही नहीं सुनता (400)। error = 55 या ज़्यादा, turn = 8 × 55 = 440: एक पहिया पूरा आगे, दूसरा पूरा पीछे। यह अपनी जगह पर झटके से घूमती है, आधे सेकंड से थोड़ा ज़्यादा में ${C.whip || '?'}°, बहुत ज़्यादा, नाक अलमारी के किनारे में, और अब हर रीडिंग इसे दूसरी ओर फेंकती है। P कंट्रोल हर रीडिंग पर भरोसा करता है, चाहे वह कितनी भी अजीब हो।`, `Deewaron ke saath smooth aur seedhi, koi zig-zag nahi... jab tak almaari khatam nahi hoti. Wahan iski right taraf ki deewar achaanak gaayab: side sensor 15 cm se koodkar 70 cm door ki deewar padhta hai, ya koi goonj hi nahi sunta (400). Error = 55 ya zyada, turn = 8 × 55 = 440: ek pahiya poora aage, doosra poora peeche. Yeh apni jagah par jhatke se ghoomti hai, aadhe second se thoda zyada mein ${C.whip || '?'}°, bahut zyada, naak almaari ke kinaare mein, aur ab har reading ise doosri taraf phenkti hai. P control har reading par bharosa karta hai, chahe woh kitni bhi ajeeb ho.`)) },
      { k: 'edit', test: okClamp, set: [[/int error = right - 15;/, 'int error = constrain(right, 0, 25) - 15;']],
        do: t3('Limit the error: change int error = right - 15; to\n  int error = constrain(right, 0, 25) - 15;\nand press Run.', 'एरर को सीमित कीजिए: int error = right - 15; को बदलकर लिखिए\n  int error = constrain(right, 0, 25) - 15;\nऔर "चलाइए" दबाइए।', 'Error ko seemit kijiye: int error = right - 15; ko badalkar likhiye\n  int error = constrain(right, 0, 25) - 15;\naur Run dabaiye.'), see: E },
      { k: 'act', until: (S) => fresh(S) && S.w('lapW'), do: t3('Watch it go all the way round.', 'इसे पूरा चक्कर लगाते देखिए।', 'Ise poora chakkar lagaate dekhiye.'),
        see: liveCarSim((lg, C) => pick(lg, `All the way round the room in ${C.lapT ?? '?'} s, ${C.lapBumps ?? 0} bumps, its hardest right turn ${C.whip || '?'}°. constrain() never lets it believe more than 25 cm, so the error is at most 10 and the turn at most 80: at the almirah's end it curves round the corner and finds the wall again. Limiting what a controller may do with one strange reading is in every real one: a robot vacuum, a car's lane-keeping, a drone.`, `${C.lapT ?? '?'} s में पूरे कमरे का चक्कर, ${C.lapBumps ?? 0} टक्कर, सबसे तेज़ दायाँ मोड़ ${C.whip || '?'}°। constrain() इसे कभी 25 cm से ज़्यादा पर भरोसा नहीं करने देता, तो error ज़्यादा से ज़्यादा 10 और turn ज़्यादा से ज़्यादा 80: अलमारी के सिरे पर यह कोने से घूमकर निकलती है और दीवार फिर पा लेती है। एक अजीब रीडिंग पर कंट्रोलर कितना करे, इसकी सीमा हर असली कंट्रोलर में होती है: रोबोट वैक्यूम, कार का लेन-कीपिंग, ड्रोन।`, `${C.lapT ?? '?'} s mein poore kamre ka chakkar, ${C.lapBumps ?? 0} takkar, sabse tez right mod ${C.whip || '?'}°. constrain() ise kabhi 25 cm se zyada par bharosa nahi karne deta, to error zyada se zyada 10 aur turn zyada se zyada 80: almaari ke sire par yeh kone se ghoomkar nikalti hai aur deewar phir paa leti hai. Ek ajeeb reading par controller kitna kare, iski seema har asli controller mein hoti hai: robot vacuum, car ka lane-keeping, drone.`)) },
    ],
    check: [noShort, (S) => (S.conn('rail:tp', '5V') ? null : [W.vRail]), has('us2', t3('right ultrasonic sensor', 'दायाँ अल्ट्रासोनिक सेंसर', 'right ultrasonic sensor')), need('us2.TRIG', 'D11', W.toPin, { x: 'TRIG', p: 11 }), need('us2.ECHO', 'D12', W.toPin, { x: 'ECHO', p: 12 }), need('us2.VCC', '5V', W.to5v, { x: 'VCC' }), need('us2.GND', 'GND', W.toGnd, { x: 'GND' })],
    done: (S) => S.w('lapW') });
  // 13 ------------------------------------------------------------------------------------ WiFi robot car, web joystick
  const wnet = (S) => S.lab.net4 || { phone: {}, seen: { paths: {} } };
  const okFailsafe = (src) => { const m = /void loop\(\) \{([\s\S]*)\n\}/.exec(src || ''); return !!m && /if\s*\(\s*WiFi\.softAPgetStationNum\(\)\s*==\s*0\s*\)\s*\{?\s*(\/\/[^\n]*\n\s*)?drive\(\s*0\s*,\s*0\s*\)/.test(m[1]); };
  L.push({ id: 'wificar', board: 'esp32', cls: '11', blocks: false, view: 'carbench', wview: 'carbench', rview: 'arenabt', code: WIFIC, drawer: [], baud: 115200, serial: true, phone: true, world: { kind: 'car', car: 'wifi', board: 'esp32' },
    title: t3('WiFi robot car with a web joystick', 'वेब जॉयस्टिक वाली WiFi रोबोट कार', 'Web joystick wali WiFi robot car'),
    goal: t3('The ESP32 on the car makes its own WiFi; a web page on the phone is the joystick: hold a button to drive, let go to stop. Then find out what happens when the phone quietly leaves the car\'s WiFi, and make the car safe.', 'कार पर लगा ESP32 अपना ख़ुद का WiFi बनाता है; फ़ोन पर एक वेब पेज जॉयस्टिक है: चलाने के लिए बटन दबाए रखिए, रोकने के लिए छोड़िए। फिर पता कीजिए कि जब फ़ोन चुपचाप कार का WiFi छोड़ दे तो क्या होता है, और कार को सुरक्षित बनाइए।', 'Car par laga ESP32 apna khud ka WiFi banata hai; phone par ek web page joystick hai: chalane ke liye button dabaye rakhiye, rokne ke liye chhodiye. Phir pata kijiye ki jab phone chupchaap car ka WiFi chhod de to kya hota hai, aur car ko surakshit banaiye.'),
    setup: { parts: CARP, wires: [['T:bat:P', 'T:drv:VS'], ['T:bat:N', 'T:drv:GND'], ['T:mL:P', 'T:drv:OUT1'], ['T:mL:N', 'T:drv:OUT2'], ['T:mR:P', 'T:drv:OUT3'], ['T:mR:N', 'T:drv:OUT4'], ['T:drv:ENA', 'H:a8'], ['T:drv:IN1', 'H:a9'], ['T:drv:IN2', 'H:a10']] }, // (the ESP32 sits in the breadboard: a8–a10 are its GPIO 14, 27, 26)
    steps: [
      { k: 'info', do: t3('This car carries an ESP32 instead of an Arduino Uno. On the bench: the L298N on the battery, both motors, and motor A already joined to the ESP32 (ENA to GPIO 14, IN1 to 27, IN2 to 26). The phone stands beside the bench.', 'इस कार पर Arduino Uno की जगह ESP32 है। बेंच पर: बैटरी पर L298N, दोनों मोटरें, और मोटर A पहले से ESP32 से जुड़ी (ENA GPIO 14 से, IN1 27 से, IN2 26 से)। फ़ोन बेंच के पास रखा है।', 'Is car par Arduino Uno ki jagah ESP32 hai. Bench par: battery par L298N, dono motors, aur motor A pehle se ESP32 se judi (ENA GPIO 14 se, IN1 27 se, IN2 26 se). Phone bench ke paas rakha hai.'),
        see: t3('The ESP32\'s pins are 3.3 V: the L298N takes anything over 2.3 V as HIGH, so it works. Keep away from GPIO 34 to 39: they can only read, never drive.', 'ESP32 के पिन 3.3 V के हैं: L298N 2.3 V से ऊपर को HIGH मानता है, तो यह चलता है। GPIO 34 से 39 से दूर रहिए: वे सिर्फ़ पढ़ सकते हैं, चला नहीं सकते।', 'ESP32 ke pin 3.3 V ke hain: L298N 2.3 V se upar ko HIGH maanta hai, to yeh chalta hai. GPIO 34 se 39 se door rahiye: woh sirf padh sakte hain, chala nahi sakte.') },
      w3('drv.ENB', 'D32', 'Motor B: join the L298N\'s ENB to GPIO 32 (D32).', 'मोटर B: L298N का ENB, GPIO 32 (D32) से जोड़िए।', 'Motor B: L298N ka ENB, GPIO 32 (D32) se jodiye.'),
      w3('drv.IN3', 'D25', 'IN3 to GPIO 25.', 'IN3, GPIO 25 से।', 'IN3, GPIO 25 se.'),
      w3('drv.IN4', 'D33', 'IN4 to GPIO 33.', 'IN4, GPIO 33 से।', 'IN4, GPIO 33 se.'),
      w3('drv.GND', 'GND1', 'Last: the L298N\'s GND to a GND pin of the ESP32.', 'आख़िर में: L298N का GND, ESP32 के किसी GND पिन से।', 'Aakhir mein: L298N ka GND, ESP32 ke kisi GND pin se.', t3('Common ground: without it the L298N cannot tell the ESP32\'s 3.3 V from 0 V.', 'कॉमन ग्राउंड: इसके बिना L298N, ESP32 के 3.3 V और 0 V में फ़र्क़ नहीं कर पाता।', 'Common ground: iske bina L298N, ESP32 ke 3.3 V aur 0 V mein farq nahi kar paata.')),
      CHECK,
      RUN(t3('The Serial Monitor (115200 baud) says: Join the WiFi DUET-Car and open http://192.168.4.1', 'सीरियल मॉनिटर (115200 बॉड) कहता है: Join the WiFi DUET-Car and open http://192.168.4.1', 'Serial Monitor (115200 baud) kehta hai: Join the WiFi DUET-Car and open http://192.168.4.1')),
      { k: 'act', until: (S) => wnet(S).phone.wifi === 'DUET-Car', do: t3('Tap the phone to bring it close. Open WiFi and join DUET-Car (password robocar123).', 'फ़ोन को पास लाने के लिए उस पर टैप कीजिए। WiFi खोलिए और DUET-Car से जुड़िए (पासवर्ड robocar123)।', 'Phone ko paas laane ke liye us par tap kijiye. WiFi kholiye aur DUET-Car se judiye (password robocar123).'),
        see: t3('WiFi.softAP() made the ESP32 a hotspot, like a phone\'s hotspot: no router needed, so the car works in a field. Its own address is always 192.168.4.1.', 'WiFi.softAP() ने ESP32 को एक हॉटस्पॉट बना दिया, फ़ोन के हॉटस्पॉट जैसा: राउटर की ज़रूरत नहीं, तो कार मैदान में भी चलती है। इसका अपना पता हमेशा 192.168.4.1 होता है।', 'WiFi.softAP() ne ESP32 ko ek hotspot bana diya, phone ke hotspot jaisa: router ki zaroorat nahi, to car maidan mein bhi chalti hai. Iska apna address hamesha 192.168.4.1 hota hai.') },
      { k: 'act', until: (S) => ((wnet(S).seen.paths || {})['/'] || 0) >= 1, do: t3('Open the phone\'s Browser and go to 192.168.4.1', 'फ़ोन का ब्राउज़र खोलिए और 192.168.4.1 पर जाइए', 'Phone ka Browser kholiye aur 192.168.4.1 par jaiye'),
        see: t3('The joystick, sent by handleRoot(). Each button has ontouchstart, which asks for /go?d=F the moment your finger lands, and ontouchend, which asks for /go?d=S when it lifts.', 'जॉयस्टिक, जिसे handleRoot() ने भेजा। हर बटन में ontouchstart है, जो उँगली रखते ही /go?d=F माँगता है, और ontouchend, जो उँगली उठाने पर /go?d=S माँगता है।', 'Joystick, jise handleRoot() ne bheja. Har button mein ontouchstart hai, jo ungli rakhte hi /go?d=F maangta hai, aur ontouchend, jo ungli uthaane par /go?d=S maangta hai.') },
      { k: 'act', until: (S) => S.w('fwd') && (S.w('left') || S.w('right')), do: t3('Press and hold ▲ to drive (watch the 🏁 Robot view or the panel), let go to stop. Then hold ◀ or ▶.', '▲ दबाए रखिए तो कार चलती है (🏁 रोबोट व्यू या पैनल देखिए), छोड़िए तो रुकती है। फिर ◀ या ▶ दबाए रखिए।', '▲ dabaye rakhiye to car chalti hai (🏁 Robot view ya panel dekhiye), chhodiye to rukti hai. Phir ◀ ya ▶ dabaye rakhiye.'),
        see: t3('Every press and every let-go is one small web request to the car; handleGo() reads d with server.arg("d") and sets both motors.', 'हर दबाना और हर छोड़ना कार को एक छोटा वेब अनुरोध है; handleGo(), server.arg("d") से d पढ़ता है और दोनों मोटरें सेट करता है।', 'Har dabaana aur har chhodna car ko ek chhota web request hai; handleGo(), server.arg("d") se d padhta hai aur dono motors set karta hai.') },
      { k: 'act', until: (S) => fresh(S) && S.w('runaway'), do: t3('Now a long straight run across the yard: hold ▲ for 2 seconds or more.', 'अब आँगन के पार एक लंबी सीधी दौड़: ▲ को 2 सेकंड या ज़्यादा दबाए रखिए।', 'Ab aangan ke paar ek lambi seedhi daud: ▲ ko 2 second ya zyada dabaye rakhiye.'),
        see: t3('Crash! In the middle of the run the phone saw that DUET-Car has no internet and went back to the school WiFi, as Android does. When you let go, /go?d=S went to a WiFi the car is not on, and never arrived. The car only knew "F", so it drove on into the wall. A robot must stop by itself when it loses its driver.', 'धड़ाम! दौड़ के बीच में फ़ोन ने देखा कि DUET-Car पर इंटरनेट नहीं है और वह वापस स्कूल के WiFi पर चला गया, जैसा Android करता है। जब आपने छोड़ा, /go?d=S ऐसे WiFi पर गया जिस पर कार नहीं है, और कभी नहीं पहुँचा। कार सिर्फ़ "F" जानती थी, तो वह दीवार में जा घुसी। रोबोट को अपना ड्राइवर खोने पर ख़ुद रुकना चाहिए।', 'Dhadaam! Daud ke beech mein phone ne dekha ki DUET-Car par internet nahi hai aur woh wapas school ke WiFi par chala gaya, jaisa Android karta hai. Jab aapne chhoda, /go?d=S aise WiFi par gaya jis par car nahi hai, aur kabhi nahi pahuncha. Car sirf "F" jaanti thi, to woh deewar mein ja ghusi. Robot ko apna driver khone par khud rukna chahiye.') },
      { k: 'edit', test: okFailsafe, set: [[/void loop\(\) \{\n/, 'void loop() {\n  if (WiFi.softAPgetStationNum() == 0) {   // no phone on our WiFi: nobody is driving\n    drive(0, 0);\n  }\n']],
        do: t3('A failsafe: at the start of loop(), add\n  if (WiFi.softAPgetStationNum() == 0) {\n    drive(0, 0);\n  }\nand press Run.', 'एक फ़ेलसेफ़: loop() की शुरुआत में लिखिए\n  if (WiFi.softAPgetStationNum() == 0) {\n    drive(0, 0);\n  }\nऔर "चलाइए" दबाइए।', 'Ek failsafe: loop() ki shuruaat mein likhiye\n  if (WiFi.softAPgetStationNum() == 0) {\n    drive(0, 0);\n  }\naur Run dabaiye.'),
        see: t3('softAPgetStationNum() counts the phones joined to the car\'s WiFi.', 'softAPgetStationNum() गिनता है कि कार के WiFi से कितने फ़ोन जुड़े हैं।', 'softAPgetStationNum() ginta hai ki car ke WiFi se kitne phone jude hain.') },
      { k: 'act', until: (S) => fresh(S) && S.w('safeStop'), do: t3('On the phone, join DUET-Car again, open 192.168.4.1, and do the long run again (▲ for 2 seconds or more).', 'फ़ोन पर फिर DUET-Car से जुड़िए, 192.168.4.1 खोलिए, और लंबी दौड़ फिर कीजिए (▲ 2 सेकंड या ज़्यादा)।', 'Phone par phir DUET-Car se judiye, 192.168.4.1 kholiye, aur lambi daud phir kijiye (▲ 2 second ya zyada).'),
        see: liveCarSim((lg, C) => pick(lg, `The phone left again, but this time the car stopped by itself, ${C.stopMm ?? '?'} mm later: no phone, no driving. Trains have the same idea (the driver's dead man's pedal), and a drone that loses its remote lands or flies home.`, `फ़ोन फिर चला गया, पर इस बार कार ${C.stopMm ?? '?'} mm बाद ख़ुद रुक गई: फ़ोन नहीं, तो चलना नहीं। ट्रेनों में यही विचार है (ड्राइवर का डेड मैन पैडल), और रिमोट खोने वाला ड्रोन उतर जाता है या घर लौट आता है।`, `Phone phir chala gaya, par is baar car ${C.stopMm ?? '?'} mm baad khud ruk gayi: phone nahi, to chalna nahi. Trains mein yahi vichaar hai (driver ka dead man pedal), aur remote khone wala drone utar jaata hai ya ghar laut aata hai.`)) },
      { k: 'act', until: (S) => fresh(S) && S.w('parked'), do: t3('Join DUET-Car once more. When the phone says "DUET-Car has no internet", tap Stay connected. Then drive into the box P and stop inside it.', 'एक बार फिर DUET-Car से जुड़िए। जब फ़ोन कहे "DUET-Car पर इंटरनेट नहीं है", तो "जुड़े रहिए" दबाइए। फिर बॉक्स P में गाड़ी ले जाकर उसके अंदर रोकिए।', 'Ek baar phir DUET-Car se judiye. Jab phone kahe "DUET-Car par internet nahi hai", to "Jude rahiye" dabaiye. Phir box P mein gaadi le jaakar uske andar rokiye.'),
        see: t3('Parked! "Stay connected" tells Android to keep a WiFi that has no internet. Real WiFi cars, drones and ESP32 gadgets all ask you to do this.', 'पार्क हो गई! "जुड़े रहिए" Android से कहता है कि बिना इंटरनेट वाला WiFi भी बनाए रखे। असली WiFi कारें, ड्रोन और ESP32 गैजेट सब आपसे यही करने को कहते हैं।', 'Park ho gayi! "Jude rahiye" Android se kehta hai ki bina internet wala WiFi bhi banaye rakhe. Asli WiFi cars, drone aur ESP32 gadgets sab aapse yahi karne ko kehte hain.') },
    ],
    check: [noShort, (S) => (['ENA', 'IN1', 'IN2', 'ENB', 'IN3', 'IN4'].some((k) => ['D34', 'D35', 'VP', 'VN'].some((q) => S.conn('drv.' + k, q))) ? [t3('GPIO 34, 35, 36 (VP) and 39 (VN) are input only: they cannot drive the L298N. Use the GPIO the step names.', 'GPIO 34, 35, 36 (VP) और 39 (VN) सिर्फ़ इनपुट हैं: ये L298N को नहीं चला सकते। स्टेप में बताया GPIO लगाइए।', 'GPIO 34, 35, 36 (VP) aur 39 (VN) sirf input hain: yeh L298N ko nahi chala sakte. Step mein bataya GPIO lagaiye.')] : null),
      (S) => (S.conn('drv.GND', 'GND') ? null : [t3('The L298N\'s GND must be joined to a GND pin of the ESP32 (common ground), or its inputs cannot read the ESP32\'s 3.3 V.', 'L298N का GND, ESP32 के किसी GND पिन से जुड़ना चाहिए (कॉमन ग्राउंड), वरना इसके इनपुट ESP32 के 3.3 V को नहीं पढ़ सकते।', 'L298N ka GND, ESP32 ke kisi GND pin se judna chahiye (common ground), warna iske input ESP32 ke 3.3 V ko nahi padh sakte.')]), ...[['ENB', 32], ['IN3', 25], ['IN4', 33], ['ENA', 14], ['IN1', 27], ['IN2', 26]].map(([a, p]) => need('drv.' + a, 'D' + p, W.toPin, { x: 'L298N ' + a, p }))],
    done: (S) => S.w('parked') });
  // 14 ----------------------------------------------------------------------------------------- robot soccer player
  const spdOf = (src) => { const m = /int\s+speed\s*=\s*(\d+)\s*;/.exec(src || ''); return m ? +m[1] : 0; };
  const okArc = (src) => /c\s*==\s*'L'\s*\)\s*drive\(\s*speed\s*\/\s*2\s*,\s*speed\s*\)/.test(src || '') && /c\s*==\s*'R'\s*\)\s*drive\(\s*speed\s*,\s*speed\s*\/\s*2\s*\)/.test(src || '');
  L.push({ id: 'soccer', cls: '11', blocks: false, view: 'carbench', wview: 'carbench', rview: 'arenasoccer', code: SOCC, drawer: [], serial: false, world: { kind: 'car', car: 'soccer' },
    title: t3('Robot soccer player', 'रोबोट फ़ुटबॉल खिलाड़ी', 'Robot football khiladi'),
    goal: t3('In school robot soccer you drive your robot from a phone and push a tennis ball into the goal. A V-shaped scoop on the front lets it carry the ball: dribbling. Find out why a fast robot cannot dribble, and how to turn without losing the ball.', 'स्कूल के रोबोट फ़ुटबॉल में आप फ़ोन से अपना रोबोट चलाते हैं और टेनिस बॉल को गोल में धकेलते हैं। आगे लगा V-आकार का स्कूप गेंद को साथ ले जाने देता है: ड्रिब्लिंग। पता कीजिए कि तेज़ रोबोट ड्रिबल क्यों नहीं कर पाता, और गेंद खोए बिना कैसे मुड़ें।', 'School ke robot football mein aap phone se apna robot chalate hain aur tennis ball ko goal mein dhakelte hain. Aage laga V-shape ka scoop ball ko saath le jaane deta hai: dribbling. Pata kijiye ki tez robot dribble kyon nahi kar paata, aur ball khoye bina kaise mudein.'),
    setup: { parts: [...CARP, P('bt', 'hc05', {}, 'j40', 0)], wires: [...CARW, ['H:f41', 'H:tp41'], ['H:f42', 'H:tn42'], ['H:f43', 'D0']] },
    steps: [
      { k: 'info', do: t3('The Bluetooth car, with an acrylic V-scoop on its nose, stands on a 2.4 m × 1.6 m pitch (the 🏁 Robot view). The tennis ball is ahead of it; score in the yellow goal, on its right. Everything is wired: the drive as before, the HC-05 on pin 0.', 'ब्लूटूथ कार, नाक पर ऐक्रेलिक V-स्कूप के साथ, 2.4 m × 1.6 m के मैदान पर खड़ी है (🏁 रोबोट व्यू)। टेनिस बॉल इसके आगे है; पीले गोल में गोल कीजिए, जो इसकी दाईं ओर है। सब जुड़ा है: ड्राइव पहले की तरह, HC-05 पिन 0 पर।', 'Bluetooth car, naak par acrylic V-scoop ke saath, 2.4 m × 1.6 m ke maidan par khadi hai (🏁 Robot view). Tennis ball iske aage hai; peele goal mein goal kijiye, jo iski right taraf hai. Sab juda hai: drive pehle ki tarah, HC-05 pin 0 par.'), see: E },
      CHECK,
      RUN(),
      { k: 'act', until: (S) => { const b = S.part('bt'); return !!(b && b.state.paired); }, do: t3('In the car\'s panel (the phone app), press "Connect HC-05".', 'कार के पैनल (फ़ोन ऐप) में "HC-05 से जोड़िए" दबाइए।', 'Car ke panel (phone app) mein "HC-05 se jodiye" dabaiye.'), see: E },
      { k: 'act', until: (S) => fresh(S) && S.w('kick'), do: t3('Drive at the ball: hold ▲ (or the ↑ key).', 'गेंद की ओर चलाइए: ▲ (या ↑ कुंजी) दबाए रखिए।', 'Ball ki taraf chalaiye: ▲ (ya ↑ key) dabaye rakhiye.'),
        see: liveCarSim((lg, C) => pick(lg, `Thwack! At speed 230 the car hits the ball like a bat: it shoots off at ${C.shotV ? (C.shotV / 1000).toFixed(1) : '?'} m/s and bounces off the boards. The car is 10 times heavier than the ball, so the ball leaves faster than the car came: good for a shot, hopeless for keeping it.`, `धप! रफ़्तार 230 पर कार गेंद को बल्ले की तरह मारती है: वह ${C.shotV ? (C.shotV / 1000).toFixed(1) : '?'} m/s से भागती है और बोर्ड से टकराकर लौटती है। कार गेंद से 10 गुना भारी है, तो गेंद कार के आने से भी तेज़ जाती है: शॉट के लिए अच्छा, गेंद रखने के लिए बेकार।`, `Dhap! Speed 230 par car ball ko balle ki tarah maarti hai: woh ${C.shotV ? (C.shotV / 1000).toFixed(1) : '?'} m/s se bhaagti hai aur board se takraakar lautti hai. Car ball se 10 guna bhaari hai, to ball car ke aane se bhi tez jaati hai: shot ke liye achha, ball rakhne ke liye bekaar.`)) },
      { k: 'edit', test: (src) => { const v = spdOf(src); return v >= 100 && v <= 150; }, set: [[/int speed = 230;/, 'int speed = 130;']], do: t3('Slow down: change speed = 230 to speed = 130 and press Run.', 'धीमा कीजिए: speed = 230 को speed = 130 कीजिए और "चलाइए" दबाइए।', 'Dheema kijiye: speed = 230 ko speed = 130 kijiye aur Run dabaiye.'), see: E },
      { k: 'act', until: (S) => fresh(S) && S.w('lostBall'), do: t3('Drive gently into the ball so it sits in the V, then turn right (▶) with it, towards the yellow goal.', 'गेंद में धीरे से जाइए ताकि वह V में बैठ जाए, फिर उसके साथ दाएँ (▶) मुड़िए, पीले गोल की ओर।', 'Ball mein dheere se jaiye taaki woh V mein baith jaaye, phir uske saath right (▶) mudiye, peele goal ki taraf.'),
        see: t3('Caught it: met gently, the ball sits in the V and the car carries it. But the moment it spins on the spot, the ball flies out sideways. A spin swings the scoop sideways at about 0.8 m/s, and nothing holds the ball from the side.', 'पकड़ ली: धीरे से मिलने पर गेंद V में बैठ जाती है और कार उसे साथ ले जाती है। पर जैसे ही यह अपनी जगह पर घूमती है, गेंद बगल से उड़ जाती है। घूमना स्कूप को लगभग 0.8 m/s से बगल में झुलाता है, और बगल से गेंद को कुछ नहीं थामता।', 'Pakad li: dheere se milne par ball V mein baith jaati hai aur car use saath le jaati hai. Par jaise hi yeh apni jagah par ghoomti hai, ball bagal se ud jaati hai. Ghoomna scoop ko lagbhag 0.8 m/s se bagal mein jhulaata hai, aur bagal se ball ko kuch nahi thaamta.') },
      { k: 'edit', test: okArc, set: [[/if \(c == 'L'\) drive\(-speed, speed\);[^\n]*/, "if (c == 'L') drive(speed / 2, speed);   // a curve: both wheels forward"], [/if \(c == 'R'\) drive\(speed, -speed\);/, "if (c == 'R') drive(speed, speed / 2);"]],
        do: t3('Turn the way a footballer does, running in a curve. Change the L and R lines to\n  if (c == \'L\') drive(speed / 2, speed);\n  if (c == \'R\') drive(speed, speed / 2);\nand press Run.', 'वैसे मुड़िए जैसे फ़ुटबॉलर मुड़ता है, घुमावदार दौड़कर। L और R वाली लाइनें बदलिए\n  if (c == \'L\') drive(speed / 2, speed);\n  if (c == \'R\') drive(speed, speed / 2);\nऔर "चलाइए" दबाइए।', 'Waise mudiye jaise footballer mudta hai, ghumaavdaar daudkar. L aur R wali lines badaliye\n  if (c == \'L\') drive(speed / 2, speed);\n  if (c == \'R\') drive(speed, speed / 2);\naur Run dabaiye.'), see: E },
      { k: 'act', until: (S) => fresh(S) && S.w('goal'), do: t3('Catch the ball again and dribble it into the yellow goal: curve right with ▶, then ▲.', 'गेंद फिर पकड़िए और ड्रिबल करके पीले गोल में डालिए: ▶ से दाएँ घूमिए, फिर ▲।', 'Ball phir pakadiye aur dribble karke peele goal mein daaliye: ▶ se right ghoomiye, phir ▲.'),
        see: liveCarSim((lg, C) => pick(lg, `GOAL! In ${C.goalT ?? '?'} s. In a curve the scoop keeps pushing the ball forwards, so the V holds it all the way round. Fast to the ball, gentle on it, curves instead of spins: that is how the winning teams drive. A real kicker (a solenoid that punches the ball) gives the shot back.`, `गोल! ${C.goalT ?? '?'} s में। घुमाव में स्कूप गेंद को आगे धकेलता रहता है, तो V उसे पूरे मोड़ में थामे रखता है। गेंद तक तेज़, गेंद पर धीमा, घूमने की जगह घुमाव: जीतने वाली टीमें ऐसे ही चलाती हैं। असली किकर (गेंद को मुक्का मारने वाला सोलेनॉइड) शॉट वापस देता है।`, `GOAL! ${C.goalT ?? '?'} s mein. Ghumaav mein scoop ball ko aage dhakelta rehta hai, to V use poore mod mein thaame rakhta hai. Ball tak tez, ball par dheema, ghoomne ki jagah ghumaav: jeetne wali teams aise hi chalaati hain. Asli kicker (ball ko mukka maarne wala solenoid) shot wapas deta hai.`)) },
    ],
    check: [noShort, (S) => (S.conn('rail:tp', '5V') ? null : [W.vRail]), has('bt', t3('Bluetooth module', 'ब्लूटूथ मॉड्यूल', 'Bluetooth module')), need('bt.VCC', '5V', W.to5v, { x: 'VCC' }), need('bt.GND', 'GND', W.toGnd, { x: 'GND' }), need('bt.TXD', 'D0', W.toPin, { x: 'TXD', p: 0 })],
    done: (S) => S.w('goal') });
  // 13 ------------------------------------------------------------------------------- gesture-controlled car (batch 26)
  const dzOf = (src) => { // the dead zone the four comparisons use (a number, or a const), or null if they differ or are missing
    const c = (src || '').replace(/\/\/[^\n]*/g, ''); const K = {}; const D = /(?:const\s+)?(?:int|float)\s+(\w+)\s*=\s*([\d.]+)\s*;/g; let m; while ((m = D.exec(c))) K[m[1]] = +m[2];
    const num = (x) => (x in K ? K[x] : /^[\d.]+$/.test(x) ? +x : NaN); const g = (re) => { const r = re.exec(c); return r ? num(r[1]) : NaN; };
    const v = [g(/fb\s*>\s*([\w.]+)/), g(/fb\s*<\s*-\s*([\w.]+)/), g(/lr\s*>\s*([\w.]+)/), g(/lr\s*<\s*-\s*([\w.]+)/)]; return v.some((x) => !(x >= 0)) || v.some((x) => x !== v[0]) ? null : v[0]; };
  const SWAP = t3('SDA and SCL are swapped: SDA (data) goes to A4, SCL (clock) to A5. Swapped, the MPU-6050 never answers.', 'SDA और SCL आपस में बदल गए हैं: SDA (डेटा) A4 पर जाता है, SCL (क्लॉक) A5 पर। बदले हुए हों तो MPU-6050 कभी जवाब नहीं देता।', 'SDA aur SCL aapas mein badal gaye hain: SDA (data) A4 par jaata hai, SCL (clock) A5 par. Badle hue hon to MPU-6050 kabhi jawaab nahi deta.');
  L.push({ id: 'gesturecar', cls: '11', blocks: false, view: 'carbench', wview: 'carbench', rview: 'arenabt', code: GESTC, drawer: [], baud: 9600, serial: true, world: { kind: 'car', car: 'gesture' },
    title: t3('Gesture-controlled car', 'इशारों से चलने वाली कार', 'Ishaaron se chalne wali car'),
    goal: t3('Tip your hand forward and the car drives; tip it right and it turns. An MPU-6050 on a glove measures your hand\'s tilt. Find out why a car that obeys every degree shudders and never stops, and fix it the way every joystick, drone remote and game controller does: with a dead zone.', 'हाथ आगे झुकाइए और कार चलती है; दाईं ओर झुकाइए और वह मुड़ती है। दस्ताने पर लगा MPU-6050 आपके हाथ का झुकाव नापता है। पता कीजिए कि हर डिग्री मानने वाली कार काँपती क्यों है और कभी रुकती क्यों नहीं, और इसे वैसे ठीक कीजिए जैसे हर जॉयस्टिक, ड्रोन रिमोट और गेम कंट्रोलर करता है: डेड ज़ोन से।', 'Haath aage jhukaiye aur car chalti hai; right jhukaiye aur woh mudti hai. Dastaane par laga MPU-6050 aapke haath ka jhukaav naapta hai. Pata kijiye ki har degree maanne wali car kaanpti kyon hai aur kabhi rukti kyon nahi, aur ise waise theek kijiye jaise har joystick, drone remote aur game controller karta hai: dead zone se.'),
    setup: { parts: [...CARP, F('mpu', 'mpu6050', {}, -165, 8, 0)], wires: [...CARW, ['T:mpu:VCC', 'H:tp3'], ['T:mpu:GND', 'H:tn4']] },
    steps: [
      { k: 'info', do: t3('The car from the Bluetooth lessons, without its HC-05. Beside it lies the glove: a GY-521 (MPU-6050) stitched on its back, on a 1 m ribbon cable to the car. Its VCC and GND are on the rails already; the I2C wires are yours.', 'ब्लूटूथ वाले पाठों की कार, बिना HC-05 के। इसके पास दस्ताना रखा है: इसकी पीठ पर एक GY-521 (MPU-6050) सिला है, 1 m के रिबन केबल से कार तक। इसका VCC और GND पहले से रेल पर हैं; I2C के तार आप लगाइए।', 'Bluetooth wale lessons ki car, bina HC-05 ke. Iske paas dastaana rakha hai: iski peeth par ek GY-521 (MPU-6050) sila hai, 1 m ke ribbon cable se car tak. Iska VCC aur GND pehle se rail par hain; I2C ke taar aap lagaiye.'), see: E },
      w3('mpu.SDA', 'A4', 'Join the GY-521\'s SDA (data) to A4.', 'GY-521 का SDA (डेटा) A4 से जोड़िए।', 'GY-521 ka SDA (data) A4 se jodiye.'),
      w3('mpu.SCL', 'A5', 'And its SCL (clock) to A5. A4 and A5 are the Uno\'s I2C pins.', 'और इसका SCL (क्लॉक) A5 से। A4 और A5, Uno के I2C पिन हैं।', 'Aur iska SCL (clock) A5 se. A4 aur A5, Uno ke I2C pin hain.'),
      CHECK,
      RUN(t3('The Serial Monitor asks for the glove to lie flat while calcOffsets() measures "flat" (a second). Then the glove goes on your hand: the ✋ panel tips it, or the arrow keys. Did the car creep off on its own already? Remember that: we come back to it.', 'सीरियल मॉनिटर कहता है कि जब तक calcOffsets() "सपाट" नापता है (एक सेकंड), दस्ताना सपाट पड़ा रहे। फिर दस्ताना आपके हाथ पर: ✋ पैनल इसे झुकाता है, या ऐरो कुंजियाँ। क्या कार पहले ही अपने आप खिसक गई? याद रखिए: हम उस पर लौटेंगे।', 'Serial Monitor kehta hai ki jab tak calcOffsets() "sapaat" naapta hai (ek second), dastaana sapaat pada rahe. Phir dastaana aapke haath par: ✋ panel ise jhukaata hai, ya arrow keys. Kya car pehle hi apne aap khisak gayi? Yaad rakhiye: hum us par lautenge.')),
      { k: 'act', until: (S) => fresh(S) && (S.wv('handD') || 0) > 300, do: t3('Tip your hand forward: hold ▲ (or the ↑ key).', 'हाथ आगे झुकाइए: ▲ (या ↑ कुंजी) दबाए रखिए।', 'Haath aage jhukaiye: ▲ (ya ↑ key) dabaye rakhiye.'),
        see: t3('Off it goes. Tipped 30°, the Uno reads fb ≈ +30, so fb > 0 is true: forward.', 'यह चल पड़ी। 30° झुका हाथ: Uno fb ≈ +30 पढ़ता है, तो fb > 0 सच है: आगे।', 'Yeh chal padi. 30° jhuka haath: Uno fb ≈ +30 padhta hai, to fb > 0 sach hai: aage.') },
      { k: 'act', until: (S) => fresh(S) && S.w('nostop'), do: t3('Now let go: your hand goes back to flat. Watch the car, and the "Uno reads" row.', 'अब छोड़िए: आपका हाथ फिर सपाट हो जाता है। कार देखिए, और "Uno पढ़ता है" वाली पंक्ति।', 'Ab chhodiye: aapka haath phir sapaat ho jaata hai. Car dekhiye, aur "Uno padhta hai" wali line.'),
        see: t3('It never stops: it lurches forward, back, forward… No hand is perfectly still: it sways a few degrees and trembles a little, so fb reads +1.8, −0.7, +2.3… and is almost never exactly 0. fb > 0 or fb < 0 always wins, so "stop" never runs. Nor do the turn lines: tip right and it still only lurches back and forth.', 'यह कभी नहीं रुकती: झटके से आगे, पीछे, आगे… कोई हाथ पूरी तरह स्थिर नहीं रहता: वह कुछ डिग्री डोलता है और थोड़ा काँपता है, तो fb +1.8, −0.7, +2.3… पढ़ता है और लगभग कभी ठीक 0 नहीं होता। fb > 0 या fb < 0 हमेशा जीतता है, तो "रुको" कभी नहीं चलता। मुड़ने वाली लाइनें भी नहीं: दाएँ झुकाइए, तब भी यह बस आगे-पीछे झटके खाती है।', 'Yeh kabhi nahi rukti: jhatke se aage, peeche, aage… Koi haath poori tarah sthir nahi rehta: woh kuch degree dolta hai aur thoda kaanpta hai, to fb +1.8, −0.7, +2.3… padhta hai aur lagbhag kabhi theek 0 nahi hota. fb > 0 ya fb < 0 hamesha jeetta hai, to "ruko" kabhi nahi chalta. Mudne wali lines bhi nahi: right jhukaiye, tab bhi yeh bas aage-peeche jhatke khaati hai.') },
      { k: 'edit', test: (src) => { const d = dzOf(src); return d !== null && d >= 10 && d <= 30; }, set: [[/fb > 0\)/, 'fb > 20)'], [/fb < 0\)/, 'fb < -20)'], [/lr > 0\)/, 'lr > 20)'], [/lr < 0\)/, 'lr < -20)']],
        do: t3('Give it a dead zone, so small tilts mean nothing. Change the four 0s:\n  fb > 20,  fb < -20,  lr > 20,  lr < -20\nand press Run.', 'इसे डेड ज़ोन दीजिए, ताकि छोटे झुकाव का कोई मतलब न हो। चारों 0 बदलिए:\n  fb > 20,  fb < -20,  lr > 20,  lr < -20\nऔर "चलाइए" दबाइए।', 'Ise dead zone dijiye, taaki chhote jhukaav ka koi matlab na ho. Chaaron 0 badaliye:\n  fb > 20,  fb < -20,  lr > 20,  lr < -20\naur Run dabaiye.'), see: E },
      { k: 'act', until: (S) => fresh(S) && S.w('handStop'), do: t3('Drive forward again (hold ▲), then let go.', 'फिर आगे चलाइए (▲ दबाए रखिए), फिर छोड़िए।', 'Phir aage chalaiye (▲ dabaye rakhiye), phir chhodiye.'),
        see: t3('It stops, and stays stopped: your hand\'s sway of a few degrees is inside the dead zone. 20° is a choice: too small and it shudders again, too big and you must bend your wrist hard to drive. Joysticks, drone remotes, game controllers and even a car\'s steering all have one.', 'यह रुकती है, और रुकी रहती है: आपके हाथ का कुछ डिग्री का डोलना डेड ज़ोन के अंदर है। 20° एक चुनाव है: बहुत छोटा तो यह फिर काँपेगी, बहुत बड़ा तो चलाने के लिए कलाई ज़ोर से मोड़नी पड़ेगी। जॉयस्टिक, ड्रोन रिमोट, गेम कंट्रोलर और कार के स्टीयरिंग, सबमें यह होता है।', 'Yeh rukti hai, aur ruki rehti hai: aapke haath ka kuch degree ka dolna dead zone ke andar hai. 20° ek chunaav hai: bahut chhota to yeh phir kaanpegi, bahut bada to chalaane ke liye kalaai zor se modni padegi. Joystick, drone remote, game controller aur car ki steering, sab mein yeh hota hai.') },
      { k: 'act', until: (S) => fresh(S) && S.w('parked'), do: t3('Now park it in the box marked P: ◀ ▶ tip your hand to turn, ▲ drives, and let go to stop inside.', 'अब इसे P वाले डिब्बे में पार्क कीजिए: ◀ ▶ हाथ झुकाकर मोड़ते हैं, ▲ चलाता है, और अंदर रुकने के लिए छोड़िए।', 'Ab ise P wale dabbe mein park kijiye: ◀ ▶ haath jhukaakar modte hain, ▲ chalaata hai, aur andar rukne ke liye chhodiye.'),
        see: t3('Parked by hand. To lose the cable, the next version sends fb and lr by radio: two nRF24L01 modules, or ESP-NOW between two ESP32s.', 'हाथ से पार्क हो गई। केबल हटाने के लिए अगला संस्करण fb और lr रेडियो से भेजता है: दो nRF24L01 मॉड्यूल, या दो ESP32 के बीच ESP-NOW।', 'Haath se park ho gayi. Cable hataane ke liye agla version fb aur lr radio se bhejta hai: do nRF24L01 module, ya do ESP32 ke beech ESP-NOW.') },
    ],
    check: [...rails, has('mpu', t3('motion sensor MPU-6050', 'मोशन सेंसर MPU-6050', 'motion sensor MPU-6050')), (S) => (S.conn('mpu.SDA', 'A5') && S.conn('mpu.SCL', 'A4') ? [SWAP] : null), need('mpu.VCC', '5V', W.to5v, { x: 'VCC' }), need('mpu.GND', 'GND', W.toGnd, { x: 'GND' }), need('mpu.SDA', 'A4', W.join, { a: 'SDA', b: 'A4' }), need('mpu.SCL', 'A5', W.join, { a: 'SCL', b: 'A5' })],
    done: (S) => S.w('parked') && S.w('handStop') });
  // 15 --------------------------------------------------------------------- weather station on the cloud (batch 27)
  // The cloud (esp32.js Net.cloud): what the channel took since this Run (the net's clock and the lesson's both count seconds)
  const cloud = (S) => { const N = S.lab.net4; const C = N && N.cloud; if (!C) return { got: [], calls: [], C: null, N }; const t0 = N.now - (S.t - (S.freshAt || 0)) - 0.01; return { got: C.entries.filter((e) => e.t >= t0), calls: (C.log || []).filter((c) => c.t >= t0), C, N }; };
  const lastDelay = (src) => { const m = [...(src || '').matchAll(/delay\(\s*(\d+)\s*\)/g)]; return m.length ? +m[m.length - 1][1] : 0; };
  let wetAt = null; const cupMm = (S) => { const p = S.lab.byTag('wl'); return p ? p.state.depth || 0 : 0; };
  L.push({ id: 'wxcloud', board: 'esp32', cls: '11', blocks: false, view: 'wide', code: WXC, drawer: [], baud: 115200, serial: true, phone: true,
    title: t3('Weather station that posts to a website', 'वेबसाइट पर डेटा भेजने वाला मौसम स्टेशन', 'Website par data bhejne wala mausam station'),
    goal: t3('An ESP32 measures temperature, humidity, air pressure and rain, and sends them to ThingSpeak, a real IoT cloud: anyone with the link sees the school\'s weather on a chart, from anywhere. Find out why most updates are thrown away, why the rain gauge reads 0 with a cup full of water, and see a storm coming on the pressure chart.', 'एक ESP32 तापमान, नमी, हवा का दबाव और बारिश नापता है, और उन्हें ThingSpeak पर भेजता है, एक असली IoT क्लाउड: लिंक वाला कोई भी, कहीं से भी, स्कूल का मौसम चार्ट पर देखता है। पता कीजिए कि ज़्यादातर अपडेट क्यों फेंक दिए जाते हैं, पानी से भरे कप के साथ भी बारिश मापक 0 क्यों पढ़ता है, और दबाव के चार्ट पर तूफ़ान आता देखिए।', 'Ek ESP32 temperature, humidity, hawa ka dabaav aur baarish naapta hai, aur unhe ThingSpeak par bhejta hai, ek asli IoT cloud: link wala koi bhi, kahin se bhi, school ka mausam chart par dekhta hai. Pata kijiye ki zyaadatar update kyon phenk diye jaate hain, paani se bhare cup ke saath bhi rain gauge 0 kyon padhta hai, aur dabaav ke chart par toofaan aata dekhiye.'),
    setup: { parts: [P('dht', 'dht11', {}, 'e40', 0), F('bmp', 'bmp180', {}, -55, 80, 0), F('wl', 'wlevel', {}, -150, 95, 0)],
      wires: [['H:a4', 'H:tp2'], ['H:a5', 'H:tn3'], ['H:j4', 'H:bp2'], ['H:j5', 'H:bn3'], ['H:a40', 'H:a9'], ['H:a41', 'H:bp34'], ['H:a42', 'H:bn35'],
        ['T:bmp:VIN', 'H:bp30'], ['T:bmp:GND', 'H:bn31'], ['T:bmp:SDA', 'H:j14'], ['T:bmp:SCL', 'H:j17'], ['T:wl:VCC', 'H:bp44'], ['T:wl:GND', 'H:bn45'], ['T:wl:S', 'H:a10']] }, // (the ESP32 sits in the breadboard: a9 is beside GPIO 27, a10 beside 26, j14 beside 21, j17 beside 22)
    steps: [
      { k: 'info', do: t3('The school\'s weather station, wired as its build sheet says: a DHT11 (temperature and humidity) on GPIO 27, a BMP180 (air pressure) on I2C (GPIO 21 and 22), and a rain gauge: a water level sensor standing in a cup on the roof, its S on GPIO 26. Everything runs on 3.3 V. The class owns a ThingSpeak channel, number 2468013; its Write API Key is in the sketch.', 'स्कूल का मौसम स्टेशन, उसकी बिल्ड शीट के अनुसार जुड़ा: GPIO 27 पर एक DHT11 (तापमान और नमी), I2C (GPIO 21 और 22) पर एक BMP180 (हवा का दबाव), और एक बारिश मापक: छत पर एक कप में खड़ा पानी स्तर सेंसर, उसका S GPIO 26 पर। सब कुछ 3.3 V पर चलता है। कक्षा का एक ThingSpeak चैनल है, नंबर 2468013; उसकी Write API Key स्केच में है।', 'School ka mausam station, uski build sheet ke hisaab se juda: GPIO 27 par ek DHT11 (temperature aur humidity), I2C (GPIO 21 aur 22) par ek BMP180 (hawa ka dabaav), aur ek rain gauge: chhat par ek cup mein khada water level sensor, uska S GPIO 26 par. Sab kuch 3.3 V par chalta hai. Class ka ek ThingSpeak channel hai, number 2468013; uski Write API Key sketch mein hai.'), see: E },
      CHECK,
      RUN(t3('The Serial Monitor (115200 baud) shows the ESP32 joining the school WiFi, then one update every 2 s: what it sent, and what ThingSpeak answered.', 'सीरियल मॉनिटर (115200 बॉड) दिखाता है कि ESP32 स्कूल WiFi से जुड़ता है, फिर हर 2 s में एक अपडेट: उसने क्या भेजा, और ThingSpeak ने क्या जवाब दिया।', 'Serial Monitor (115200 baud) dikhaata hai ki ESP32 school WiFi se judta hai, phir har 2 s mein ek update: usne kya bheja, aur ThingSpeak ne kya jawaab diya.')),
      { k: 'act', until: (S) => { const c = cloud(S); return !!c.C && (c.C.viewed || 0) > 0 && c.got.length >= 2 && c.calls.filter((x) => !x.ok).length >= 3; }, do: t3('Open the channel on the phone: Browser, tap the address bar, type thingspeak.com/channels/2468013 and Go. Watch it for half a minute (it refreshes every 15 s).', 'फ़ोन पर चैनल खोलिए: ब्राउज़र, पते वाली पट्टी पर टैप, thingspeak.com/channels/2468013 लिखिए और जाइए। आधा मिनट देखिए (यह हर 15 s में ताज़ा होता है)।', 'Phone par channel kholiye: Browser, address bar par tap, thingspeak.com/channels/2468013 likhiye aur Go. Aadha minute dekhiye (yeh har 15 s mein refresh hota hai).'),
        see: t3('Your data, on the internet. But a point arrives only every 15 s, though the sketch sends every 2 s: most lines on the Serial Monitor say "ThingSpeak answered: 0". The free plan takes one update a channel every 15 s; anything sooner is thrown away. Those sends only waste power and data.', 'आपका डेटा, इंटरनेट पर। पर बिंदु सिर्फ़ हर 15 s में आता है, जबकि स्केच हर 2 s में भेजता है: सीरियल मॉनिटर पर ज़्यादातर लाइनें कहती हैं "ThingSpeak answered: 0"। फ़्री प्लान एक चैनल में हर 15 s में एक ही अपडेट लेता है; उससे पहले वाला फेंक दिया जाता है। वे भेजना बस बिजली और डेटा बर्बाद करते हैं।', 'Aapka data, internet par. Par point sirf har 15 s mein aata hai, jabki sketch har 2 s mein bhejta hai: Serial Monitor par zyaadatar lines kehti hain "ThingSpeak answered: 0". Free plan ek channel mein har 15 s mein ek hi update leta hai; usse pehle wala phenk diya jaata hai. Woh bhejna bas bijli aur data barbaad karte hain.') },
      { k: 'edit', test: (src) => lastDelay(src) >= 15000 && lastDelay(src) <= 600000, set: [[/delay\(2000\);(\s*\/\/ then the next update)/, 'delay(20000);$1']],
        do: t3('Send once every 20 s: change the last delay(2000) to delay(20000) and press Run.', 'हर 20 s में एक बार भेजिए: आख़िरी delay(2000) को delay(20000) कीजिए और "चलाइए" दबाइए।', 'Har 20 s mein ek baar bhejiye: aakhri delay(2000) ko delay(20000) kijiye aur Run dabaiye.'),
        see: t3('Now every update is kept: the answer is the entry\'s number (1, 2, 3 …), never 0.', 'अब हर अपडेट रखा जाता है: जवाब एंट्री का नंबर है (1, 2, 3 …), कभी 0 नहीं।', 'Ab har update rakha jaata hai: jawaab entry ka number hai (1, 2, 3 …), kabhi 0 nahi.') },
      { k: 'act', until: (S) => { if (cupMm(S) < 15) { wetAt = null; return false; } const c = cloud(S); if (!c.N) return false; if (wetAt === null) wetAt = c.N.now; return c.got.some((e) => e.t > wetAt + 0.5 && e.f[4] === 0); },
        do: t3('Rain! Tap the water level sensor and fill its cup to 25 mm. Then wait for the next point on the Rain chart.', 'बारिश! पानी स्तर सेंसर को छूइए और उसका कप 25 mm तक भरिए। फिर बारिश वाले चार्ट पर अगले बिंदु का इंतज़ार कीजिए।', 'Baarish! Water level sensor ko touch karo aur uska cup 25 mm tak bhariye. Phir Rain chart par agle point ka intezaar kijiye.'),
        see: t3('25 mm of water in the cup, and the chart says rain 0. GPIO 26 is an ADC2 pin, and the ESP32\'s WiFi radio uses ADC2: while WiFi is on, analogRead(26) cannot measure and gives 0. The sensor and the wire are fine; the pin is the problem. Only ADC1 pins (32 to 36, 39) read while WiFi is on.', 'कप में 25 mm पानी, और चार्ट कहता है बारिश 0। GPIO 26 एक ADC2 पिन है, और ESP32 का WiFi रेडियो ADC2 का इस्तेमाल करता है: WiFi चालू रहते analogRead(26) नाप नहीं पाता और 0 देता है। सेंसर और तार ठीक हैं; दिक़्क़त पिन की है। WiFi चालू रहते सिर्फ़ ADC1 पिन (32 से 36, 39) पढ़ते हैं।', 'Cup mein 25 mm paani, aur chart kehta hai baarish 0. GPIO 26 ek ADC2 pin hai, aur ESP32 ka WiFi radio ADC2 use karta hai: WiFi on rehte analogRead(26) naap nahi paata aur 0 deta hai. Sensor aur taar theek hain; dikkat pin ki hai. WiFi on rehte sirf ADC1 pin (32 se 36, 39) padhte hain.') },
      w3('wl.S', 'D34', 'Move the rain gauge to an ADC1 pin: tap the wire from S to GPIO 26 and delete it (🗑), then wire S to GPIO 34.', 'बारिश मापक को ADC1 पिन पर ले जाइए: S से GPIO 26 वाले तार पर टैप करके उसे हटाइए (🗑), फिर S को GPIO 34 से जोड़िए।', 'Rain gauge ko ADC1 pin par le jaiye: S se GPIO 26 wale taar par tap karke use hataiye (🗑), phir S ko GPIO 34 se jodiye.'),
      { k: 'edit', test: (src) => /const\s+int\s+RAIN\s*=\s*34\s*;/.test(src || ''), set: [[/const int RAIN = 26;/, 'const int RAIN = 34;']], do: t3('And in the sketch: const int RAIN = 34; then press Run.', 'और स्केच में: const int RAIN = 34; फिर "चलाइए" दबाइए।', 'Aur sketch mein: const int RAIN = 34; phir Run dabaiye.'), see: E },
      { k: 'act', until: (S) => cloud(S).got.some((e) => (e.f[4] || 0) > 500), do: t3('Wait for the next point on the Rain chart (up to 20 s).', 'बारिश वाले चार्ट पर अगले बिंदु का इंतज़ार कीजिए (20 s तक)।', 'Rain chart par agle point ka intezaar kijiye (20 s tak).'),
        see: t3('There is the rain: about 2200 for 25 mm of water. GPIO 34 is on ADC1, which WiFi leaves alone. Remember it for every ESP32 project with WiFi: analog sensors on 32 to 36 or 39 only.', 'यह रही बारिश: 25 mm पानी के लिए लगभग 2200। GPIO 34, ADC1 पर है, जिसे WiFi नहीं छूता। हर WiFi वाले ESP32 प्रोजेक्ट के लिए याद रखिए: एनालॉग सेंसर सिर्फ़ 32 से 36 या 39 पर।', 'Yeh rahi baarish: 25 mm paani ke liye lagbhag 2200. GPIO 34, ADC1 par hai, jise WiFi nahi chhoota. Har WiFi wale ESP32 project ke liye yaad rakhiye: analog sensor sirf 32 se 36 ya 39 par.') },
      { k: 'act', until: (S) => cloud(S).got.some((e) => e.f[3] !== undefined && e.f[3] < 995), do: t3('A storm is coming: tap the pressure sensor and set the weather to −25 hPa. Watch the Pressure chart.', 'तूफ़ान आ रहा है: दबाव सेंसर को छूइए और मौसम −25 hPa कीजिए। दबाव वाला चार्ट देखिए।', 'Toofaan aa raha hai: pressure sensor ko touch karo aur mausam −25 hPa kijiye. Pressure chart dekhiye.'),
        see: t3('The pressure line falls. Forecasters watch exactly this: air pressure falling more than about 3 hPa in 3 hours warns of a storm, often half a day before the clouds come. The station keeps the record for the whole school, and anyone with the link can see it.', 'दबाव की रेखा गिरती है। मौसम विज्ञानी ठीक यही देखते हैं: 3 घंटे में लगभग 3 hPa से ज़्यादा गिरता हवा का दबाव तूफ़ान की चेतावनी है, अक्सर बादल आने से आधा दिन पहले। स्टेशन पूरे स्कूल के लिए रिकॉर्ड रखता है, और लिंक वाला कोई भी उसे देख सकता है।', 'Dabaav ki rekha girti hai. Mausam vigyaani theek yahi dekhte hain: 3 ghante mein lagbhag 3 hPa se zyada girta hawa ka dabaav toofaan ki chetaavni hai, aksar baadal aane se aadha din pehle. Station poore school ke liye record rakhta hai, aur link wala koi bhi use dekh sakta hai.') },
    ],
    check: [noShort, (S) => (S.conn('rail:bp', '3V3') ? null : [t3('The front + rail must be joined to the ESP32\'s 3V3 pin.', 'आगे वाली + रेल ESP32 के 3V3 पिन से जुड़ी होनी चाहिए।', 'Aage wali + rail ESP32 ke 3V3 pin se judi honi chahiye.')]),
      has('dht', t3('DHT11', 'DHT11', 'DHT11')), has('bmp', t3('pressure sensor BMP180', 'दबाव सेंसर BMP180', 'pressure sensor BMP180')), has('wl', t3('water level sensor', 'पानी स्तर सेंसर', 'water level sensor')),
      (S) => (['dht.VCC', 'bmp.VIN', 'wl.VCC'].some((x) => S.conn(x, 'VIN')) ? [t3('A sensor is on VIN (5 V): its signal would push 5 V into a 3.3 V pin. Power it from 3V3.', 'एक सेंसर VIN (5 V) पर है: उसका सिग्नल 3.3 V पिन में 5 V धकेलेगा। उसे 3V3 से चलाइए।', 'Ek sensor VIN (5 V) par hai: uska signal 3.3 V pin mein 5 V dhakelega. Use 3V3 se chalaiye.')] : null),
      need('dht.DATA', 'D27', W.join, { a: 'DHT11 DATA', b: 'GPIO 27' }), (S) => (S.conn('bmp.SDA', 'D22') && S.conn('bmp.SCL', 'D21') ? [t3('SDA and SCL are swapped: SDA goes to GPIO 21, SCL to GPIO 22.', 'SDA और SCL आपस में बदल गए हैं: SDA GPIO 21 पर जाता है, SCL GPIO 22 पर।', 'SDA aur SCL aapas mein badal gaye hain: SDA GPIO 21 par jaata hai, SCL GPIO 22 par.')] : null),
      need('bmp.SDA', 'D21', W.join, { a: 'SDA', b: 'GPIO 21' }), need('bmp.SCL', 'D22', W.join, { a: 'SCL', b: 'GPIO 22' }),
      (S) => (S.conn('wl.S', 'D26') || S.conn('wl.S', 'D34') ? null : [t3('The rain gauge\'s S must reach its GPIO (26 on the build sheet; 34 later).', 'बारिश मापक का S उसके GPIO तक पहुँचना चाहिए (बिल्ड शीट पर 26; बाद में 34)।', 'Rain gauge ka S uske GPIO tak pahunchna chahiye (build sheet par 26; baad mein 34).')])],
    done: (S) => cloud(S).got.some((e) => e.f[3] !== undefined && e.f[3] < 995) && cloud(S).got.some((e) => (e.f[4] || 0) > 500) });
  // 16 ------------------------------------------------------------------------------ bionic hand with a flex glove (batch 29)
  const curl = (S) => { const h = S.part('hand'); return h ? curlOf(h) : [0, 0, 0, 0, 0]; };
  const settled = (S) => { const h = S.part('hand'); return !!h && h.state.target.every((t, i) => t !== null && Math.abs(t - h.state.ang[i]) < 2); };
  const gest = (S, g) => { const p = S.part('glove'); return !!p && p.state.gesture === g; };
  L.push({ id: 'bionichand', cls: '11', blocks: false, view: 'wide', code: HANDC, drawer: [], serial: true,
    title: t3('Bionic hand with a flex glove', 'फ़्लेक्स दस्ताने वाला बायोनिक हाथ', 'Flex dastaane wala bionic haath'),
    goal: t3('Bend your fingers in a glove, and a robot hand copies them: five flex sensors, five servos. Find out why the hand hardly moves at first, calibrate it from what the sensors really give, and fix a thumb that does the opposite of yours.', 'दस्ताने में अपनी उँगलियाँ मोड़िए, और एक रोबोट हाथ उनकी नक़ल करता है: पाँच फ़्लेक्स सेंसर, पाँच सर्वो। पता कीजिए कि शुरू में हाथ मुश्किल से क्यों हिलता है, सेंसर असल में जो देते हैं उससे उसे कैलिब्रेट कीजिए, और उस अँगूठे को ठीक कीजिए जो आपके अँगूठे का उल्टा करता है।', 'Dastaane mein apni ungliyaan modiye, aur ek robot haath unki nakal karta hai: paanch flex sensor, paanch servo. Pata kijiye ki shuru mein haath mushkil se kyon hilta hai, sensor asal mein jo dete hain usse use calibrate kijiye, aur us angoothe ko theek kijiye jo aapke angoothe ka ulta karta hai.'),
    setup: { parts: [F('glove', 'flexglove', {}, -175, 205, 0), F('hand', 'robohand', {}, 150, 205, 0), F('bat', 'aa4', {}, 40, 165, 0)],
      wires: [...POWER, ['T:glove:VCC', 'H:tp20'], ['T:glove:GND', 'H:tn21'], ['T:glove:F1', 'A0'], ['T:glove:F3', 'A2'], ['T:glove:F4', 'A3'], ['T:glove:F5', 'A4'],
        ['T:hand:S1', 'D3'], ['T:hand:S3', 'D6'], ['T:hand:S4', 'D9'], ['T:hand:S5', 'D10'], ['T:hand:V', 'T:bat:P'], ['T:hand:GND', 'H:a55'], ['T:bat:N', 'H:b55']] }, // (column 55: where the servos' GND and the battery's − meet)
    steps: [
      { k: 'info', do: t3('On the left, the glove: a flex sensor on each finger and a 10 kΩ resistor for each on its wrist board (F1 thumb … F5 little finger). On the right, the robot hand: five servos in its forearm, on their own 6 V battery. Four fingers are wired; the index finger and the common ground are yours.', 'बाईं ओर दस्ताना: हर उँगली पर एक फ़्लेक्स सेंसर और उसकी कलाई वाली बोर्ड पर हर एक के लिए 10 kΩ रेज़िस्टर (F1 अँगूठा … F5 छोटी उँगली)। दाईं ओर रोबोट हाथ: उसकी बाँह में पाँच सर्वो, अपनी 6 V बैटरी पर। चार उँगलियाँ जुड़ी हैं; तर्जनी और कॉमन ग्राउंड आपके ज़िम्मे।', 'Left mein dastaana: har ungli par ek flex sensor aur uske wrist board par har ek ke liye 10 kΩ resistor (F1 angootha … F5 chhoti ungli). Right mein robot haath: uski baanh mein paanch servo, apni 6 V battery par. Chaar ungliyaan judi hain; tarjani aur common ground aapke zimme.'), see: E },
      w3('glove.F2', 'A1', 'Wire the glove\'s F2 (the index finger) to A1.', 'दस्ताने का F2 (तर्जनी) A1 से जोड़िए।', 'Dastaane ka F2 (tarjani) A1 se jodiye.'),
      w3('hand.S2', 'D5', 'Wire the hand\'s S2 (the index finger\'s servo) to pin 5.', 'हाथ का S2 (तर्जनी का सर्वो) पिन 5 से जोड़िए।', 'Haath ka S2 (tarjani ka servo) pin 5 se jodiye.'),
      w3('H:c55', 'rail:tn', 'Common ground: column 55 is where the hand\'s GND meets the battery\'s −. Wire column 55 to the − rail too.', 'कॉमन ग्राउंड: कॉलम 55 पर हाथ का GND बैटरी के − से मिलता है। कॉलम 55 को − रेल से भी जोड़िए।', 'Common ground: column 55 par haath ka GND battery ke − se milta hai. Column 55 ko − rail se bhi jodiye.', t3('Five servos can pull 3 A together, so they run on their own battery, never on the Arduino\'s 5V pin. But a servo reads its signal against its own GND: the two grounds must be joined, or it sees no signal and only twitches.', 'पाँच सर्वो मिलकर 3 A खींच सकते हैं, इसलिए वे अपनी बैटरी पर चलते हैं, कभी Arduino के 5V पिन पर नहीं। पर सर्वो अपना सिग्नल अपने GND के हिसाब से पढ़ता है: दोनों ग्राउंड जुड़े होने चाहिए, वरना उसे सिग्नल नहीं मिलता और वह बस फड़कता है।', 'Paanch servo milkar 3 A kheench sakte hain, isliye woh apni battery par chalte hain, kabhi Arduino ke 5V pin par nahi. Par servo apna signal apne GND ke hisaab se padhta hai: dono ground jude hone chahiye, warna use signal nahi milta aur woh bas phadakta hai.')),
      CHECK,
      RUN(t3('The Serial Monitor shows the five fingers\' readings, thumb first, 20 times a second.', 'सीरियल मॉनिटर पाँचों उँगलियों की रीडिंग दिखाता है, पहले अँगूठा, सेकंड में 20 बार।', 'Serial Monitor paanchon ungliyon ki reading dikhaata hai, pehle angootha, second mein 20 baar.')),
      { k: 'act', until: (S) => fresh(S) && gest(S, 'fist') && settled(S) && Math.max(...curl(S).slice(1)) < 70, do: t3('Tap the glove and make a fist (✊). Watch the robot hand, and the five numbers.', 'दस्ताने को छूइए और मुट्ठी बनाइए (✊)। रोबोट हाथ देखिए, और पाँचों संख्याएँ।', 'Dastaane ko touch karo aur mutthi banaiye (✊). Robot haath dekhiye, aur paanchon numbers.'),
        see: t3('The robot hand hardly moves, and the wrong way: open, its fingers stood half bent (about 50°); in a fist they open a little (about 16°). The numbers say why: a straight finger reads about 290, a bent one about 95. map(f, 0, 1023, 0, 180) expects all of 0 to 1023, and a bigger number for more bend.', 'रोबोट हाथ मुश्किल से हिलता है, और उल्टा: खुले हाथ पर उसकी उँगलियाँ आधी मुड़ी थीं (लगभग 50°); मुट्ठी में वे थोड़ी खुल जाती हैं (लगभग 16°)। संख्याएँ बताती हैं क्यों: सीधी उँगली लगभग 290 पढ़ती है, मुड़ी हुई लगभग 95। map(f, 0, 1023, 0, 180) पूरे 0 से 1023 की उम्मीद करता है, और ज़्यादा मुड़ने पर बड़ी संख्या की।', 'Robot haath mushkil se hilta hai, aur ulta: khule haath par uski ungliyaan aadhi mudi thin (lagbhag 50°); mutthi mein woh thodi khul jaati hain (lagbhag 16°). Numbers batate hain kyon: seedhi ungli lagbhag 290 padhti hai, mudi hui lagbhag 95. map(f, 0, 1023, 0, 180) poore 0 se 1023 ki ummeed karta hai, aur zyada mudne par badi sankhya ki.') },
      { k: 'edit', test: (src) => /map\(\s*f\s*,\s*(2[6-9]\d|30\d)\s*,\s*(8\d|9\d|1[01]\d)\s*,\s*0\s*,\s*180\s*\)/.test(src || '') && /constrain\(\s*angle\s*,\s*0\s*,\s*180\s*\)/.test(src || ''),
        set: [[/int angle = map\(f, 0, 1023, 0, 180\);/, 'int angle = map(f, 290, 95, 0, 180);  // straight ≈ 290 → open, bent ≈ 95 → closed\n    angle = constrain(angle, 0, 180);']],
        do: t3('Calibrate: map from what the glove really gives. Change the map line to\n  int angle = map(f, 290, 95, 0, 180);\nadd below it\n  angle = constrain(angle, 0, 180);\nand press Run.', 'कैलिब्रेट कीजिए: map उससे कीजिए जो दस्ताना असल में देता है। map वाली लाइन बदलिए\n  int angle = map(f, 290, 95, 0, 180);\nउसके नीचे जोड़िए\n  angle = constrain(angle, 0, 180);\nऔर "चलाइए" दबाइए।', 'Calibrate kijiye: map usse kijiye jo dastaana asal mein deta hai. Map wali line badaliye\n  int angle = map(f, 290, 95, 0, 180);\nuske neeche jodiye\n  angle = constrain(angle, 0, 180);\naur Run dabaiye.'),
        see: t3('map() works backwards too: 290 becomes 0 (open), 95 becomes 180 (closed). constrain() stops a finger bent a little further from asking for more than 180°.', 'map() उल्टा भी काम करता है: 290, 0 (खुला) बनता है, 95, 180 (बंद)। constrain() थोड़ा और मुड़ी उँगली को 180° से ज़्यादा माँगने से रोकता है।', 'map() ulta bhi kaam karta hai: 290, 0 (khula) banta hai, 95, 180 (band). constrain() thodi aur mudi ungli ko 180° se zyada maangne se rokta hai.') },
      { k: 'act', until: (S) => { const c = curl(S); return fresh(S) && gest(S, 'fist') && settled(S) && Math.min(...c.slice(1)) > 150 && c[0] < 45; }, do: t3('Make a fist again (✊).', 'फिर से मुट्ठी बनाइए (✊)।', 'Phir se mutthi banaiye (✊).'),
        see: t3('Four fingers close, but the thumb flies open! Its servo is mounted the other way round in the forearm (it has to be, to fit beside the others), so for the thumb 180° means open. One finger needs the mapping mirrored.', 'चार उँगलियाँ बंद होती हैं, पर अँगूठा खुल जाता है! उसका सर्वो बाँह में उल्टा लगा है (दूसरों के बगल में फ़िट होने के लिए ऐसा करना पड़ता है), इसलिए अँगूठे के लिए 180° का मतलब खुला है। एक उँगली की मैपिंग उलटनी है।', 'Chaar ungliyaan band hoti hain, par angootha khul jaata hai! Uska servo baanh mein ulta laga hai (doosron ke bagal mein fit hone ke liye aisa karna padta hai), isliye angoothe ke liye 180° ka matlab khula hai. Ek ungli ki mapping ulatni hai.') },
      { k: 'edit', test: (src) => /if\s*\(\s*i\s*==\s*0\s*\)\s*\{?\s*angle\s*=\s*180\s*-\s*angle\s*;/.test(src || ''), set: [[/angle = constrain\(angle, 0, 180\);/, 'angle = constrain(angle, 0, 180);\n    if (i == 0) angle = 180 - angle;      // the thumb\'s servo is mounted reversed']],
        do: t3('Mirror the thumb: below the constrain line add\n  if (i == 0) angle = 180 - angle;\nand press Run.', 'अँगूठे को उलटिए: constrain वाली लाइन के नीचे जोड़िए\n  if (i == 0) angle = 180 - angle;\nऔर "चलाइए" दबाइए।', 'Angoothe ko ulatiye: constrain wali line ke neeche jodiye\n  if (i == 0) angle = 180 - angle;\naur Run dabaiye.'), see: E },
      { k: 'act', until: (S) => fresh(S) && gest(S, 'fist') && settled(S) && Math.min(...curl(S)) > 150, do: t3('A fist once more (✊).', 'एक बार फिर मुट्ठी (✊)।', 'Ek baar phir mutthi (✊).'),
        see: t3('A real fist, thumb and all.', 'एक असली मुट्ठी, अँगूठे के साथ।', 'Ek asli mutthi, angoothe ke saath.') },
      { k: 'act', until: (S) => { const c = curl(S); return fresh(S) && gest(S, 'peace') && settled(S) && c[1] < 30 && c[2] < 30 && c[0] > 150 && c[3] > 150 && c[4] > 150; }, do: t3('Now the peace sign (✌).', 'अब शांति का निशान (✌)।', 'Ab peace ka nishaan (✌).'),
        see: t3('Every finger on its own. Bionic hands for people who have lost a hand work the same way, but read the muscles of the forearm (EMG sensors) instead of a glove: read what the sensor really gives, then map and constrain it.', 'हर उँगली अपने हिसाब से। जिन लोगों का हाथ नहीं है उनके बायोनिक हाथ भी ऐसे ही काम करते हैं, पर दस्ताने की जगह बाँह की मांसपेशियाँ (EMG सेंसर) पढ़ते हैं: सेंसर असल में जो देता है उसे पढ़िए, फिर map और constrain कीजिए।', 'Har ungli apne hisaab se. Jin logon ka haath nahi hai unke bionic haath bhi aise hi kaam karte hain, par dastaane ki jagah baanh ki maanspeshiyaan (EMG sensor) padhte hain: sensor asal mein jo deta hai use padhiye, phir map aur constrain kijiye.') },
    ],
    check: [...rails, has('glove', t3('flex glove', 'फ़्लेक्स दस्ताना', 'flex dastaana')), has('hand', t3('robot hand', 'रोबोट हाथ', 'robot haath')),
      (S) => (S.conn('hand.V', '5V') ? [t3('The servos are on the Arduino\'s 5V: five servos can pull 3 A, and the board would reset. They have their own battery: V to its +.', 'सर्वो Arduino के 5V पर हैं: पाँच सर्वो 3 A खींच सकते हैं, और बोर्ड रीसेट हो जाएगा। उनकी अपनी बैटरी है: V उसके + पर।', 'Servo Arduino ke 5V par hain: paanch servo 3 A kheench sakte hain, aur board reset ho jaayega. Unki apni battery hai: V uske + par.')] : null),
      need('glove.F2', 'A1', W.join, { a: 'F2', b: 'A1' }), need('hand.S2', 'D5', W.toPin, { x: 'S2', p: 5 }),
      (S) => (S.conn('hand.GND', 'GND') ? null : [t3('Common ground: the hand\'s GND must be joined to the board\'s GND (the − rail), or the servos see no signal.', 'कॉमन ग्राउंड: हाथ का GND बोर्ड के GND (− रेल) से जुड़ा होना चाहिए, वरना सर्वो को सिग्नल नहीं दिखता।', 'Common ground: haath ka GND board ke GND (− rail) se juda hona chahiye, warna servo ko signal nahi dikhta.')])],
    done: (S) => gest(S, 'peace') && curl(S)[1] < 30 && curl(S)[0] > 150 });
  // 17 ------------------------------------------------------------------------------ self-balancing robot (Class 12, batch 32)
  // P alone falls (wheels that only roll at a speed cannot hold a lean: they must keep speeding up); PI rocks wider and wider;
  // PID stands (creeping a little: no calibration is perfect, and it has no encoders to feel it is moving)
  const numOf = (src, name) => { const m = new RegExp(`float\\s+${name}\\s*=\\s*(-?[\\d.]+)\\s*;`).exec(src || ''); return m ? +m[1] : null; };
  L.push({ id: 'balancebot', cls: '12', blocks: false, view: 'carbench', wview: 'carbench', rview: 'arenabal', code: BALC, drawer: [], baud: 115200, serial: true, world: { kind: 'car', car: 'balance' },
    title: t3('Self-balancing robot', 'ख़ुद संतुलन बनाने वाला रोबोट', 'Khud santulan banaane wala robot'),
    goal: t3('A robot on two wheels falls over unless its wheels keep driving under it, a little ahead of every tip, like a hand balancing a stick. An MPU-6050 measures the tilt; a PID controller decides how hard to drive. Add P, I and D one at a time and see what each one does, and what goes wrong without it.', 'दो पहियों वाला रोबोट तब तक गिर जाता है जब तक उसके पहिये हर झुकाव से थोड़ा आगे उसके नीचे न चलते रहें, जैसे हाथ पर डंडा संतुलित करना। MPU-6050 झुकाव नापता है; PID कंट्रोलर तय करता है कि कितनी ज़ोर से चलाना है। P, I और D एक-एक करके जोड़िए और देखिए हर एक क्या करता है, और उसके बिना क्या बिगड़ता है।', 'Do pahiyon wala robot tab tak gir jaata hai jab tak uske pahiye har jhukaav se thoda aage uske neeche na chalte rahein, jaise haath par danda santulit karna. MPU-6050 jhukaav naapta hai; PID controller tay karta hai ki kitne zor se chalaana hai. P, I aur D ek-ek karke jodiye aur dekhiye har ek kya karta hai, aur uske bina kya bigadta hai.'),
    setup: { parts: [...CARP, F('mpu', 'mpu6050', {}, -165, 8, 0)], wires: [...CARW, ['T:mpu:VCC', 'H:tp3'], ['T:mpu:GND', 'H:tn4'], ['T:mpu:SDA', 'A4'], ['T:mpu:SCL', 'A5']] },
    steps: [
      { k: 'info', do: t3('The robot: two wheels on one axle, three decks (motor driver, battery, Uno), and the GY-521 (MPU-6050) flat on the top deck, on A4 / A5. Everything is wired. After Run a hand holds it upright while calcOffsets() calibrates, and lets go at "Let go!". Watch it in the 🏁 Robot view, and the angle on the Serial Monitor.', 'रोबोट: एक धुरी पर दो पहिये, तीन डेक (मोटर ड्राइवर, बैटरी, Uno), और ऊपर वाले डेक पर सपाट GY-521 (MPU-6050), A4 / A5 पर। सब जुड़ा है। Run के बाद एक हाथ इसे सीधा पकड़े रहता है जब तक calcOffsets() कैलिब्रेट करता है, और "Let go!" पर छोड़ देता है। इसे 🏁 रोबोट व्यू में देखिए, और कोण सीरियल मॉनिटर पर।', 'Robot: ek dhuri par do pahiye, teen deck (motor driver, battery, Uno), aur upar wale deck par sapaat GY-521 (MPU-6050), A4 / A5 par. Sab juda hai. Run ke baad ek haath ise seedha pakde rehta hai jab tak calcOffsets() calibrate karta hai, aur "Let go!" par chhod deta hai. Ise 🏁 Robot view mein dekhiye, aur angle Serial Monitor par.'), see: E },
      CHECK,
      RUN(t3('Only P for now: Kp = 40, Ki = 0, Kd = 0. setpoint is −2, because the battery sits a little behind the axle: the robot balances leaning 2° back (a builder finds this by holding it balanced on its wheels and reading the Serial Monitor).', 'अभी सिर्फ़ P: Kp = 40, Ki = 0, Kd = 0। setpoint −2 है, क्योंकि बैटरी धुरी से थोड़ा पीछे है: रोबोट 2° पीछे झुककर संतुलित होता है (बनाने वाला इसे पहियों पर संतुलित पकड़कर और सीरियल मॉनिटर पढ़कर पता करता है)।', 'Abhi sirf P: Kp = 40, Ki = 0, Kd = 0. setpoint −2 hai, kyonki battery dhuri se thoda peeche hai: robot 2° peeche jhuk kar santulit hota hai (banaane wala ise pahiyon par santulit pakad kar aur Serial Monitor padh kar pata karta hai).')),
      { k: 'act', until: (S) => fresh(S) && S.w('fellOver'), do: t3('Watch it after it is let go.', 'छोड़े जाने के बाद इसे देखिए।', 'Chhode jaane ke baad ise dekhiye.'),
        see: t3('It drives under itself, faster and faster … and falls anyway. P turns a tilt into a wheel speed. But to hold a lean the wheels must keep speeding up, and P alone asks for more speed only once it leans further. So it leans further, and further, until the motors are flat out.', 'यह अपने नीचे चलता है, तेज़ और तेज़ … और फिर भी गिर जाता है। P झुकाव को पहिये की रफ़्तार में बदलता है। पर झुकाव थामने के लिए पहियों को लगातार तेज़ होते जाना पड़ता है, और अकेला P ज़्यादा रफ़्तार तभी माँगता है जब यह और झुके। तो यह और झुकता है, और भी, जब तक मोटरें पूरी रफ़्तार पर न हों।', 'Yeh apne neeche chalta hai, tez aur tez … aur phir bhi gir jaata hai. P jhukaav ko pahiye ki raftaar mein badalta hai. Par jhukaav thaamne ke liye pahiyon ko lagaataar tez hote jaana padta hai, aur akela P zyada raftaar tabhi maangta hai jab yeh aur jhuke. To yeh aur jhukta hai, aur bhi, jab tak motors poori raftaar par na hon.') },
      { k: 'edit', test: (src) => { const v = numOf(src, 'Ki'); return v !== null && v >= 150 && v <= 300 && !numOf(src, 'Kd'); }, set: [[/float Ki = 0;/, 'float Ki = 200;']], do: t3('Add I: change Ki = 0 to Ki = 200 and press Run. iTerm grows by Ki × error every second the tilt goes on, so the push keeps growing.', 'I जोड़िए: Ki = 0 को Ki = 200 कीजिए और "चलाइए" दबाइए। जब तक झुकाव बना रहता है, iTerm हर सेकंड Ki × error बढ़ता है, तो धक्का बढ़ता जाता है।', 'I jodiye: Ki = 0 ko Ki = 200 kijiye aur Run dabaiye. Jab tak jhukaav bana rehta hai, iTerm har second Ki × error badhta hai, to dhakka badhta jaata hai.'), see: E },
      { k: 'act', until: (S) => fresh(S) && S.w('wobble'), do: t3('Watch it again.', 'इसे फिर देखिए।', 'Ise phir dekhiye.'),
        see: t3('Now it catches itself, but it rocks: forward, back, forward, swinging past 6° each way, often until it falls. I is slow: its push is still growing after the robot is already upright, so it overshoots the other way, and the same again. P looks at how far it leans, I at how long; neither looks at how fast it is tipping.', 'अब यह ख़ुद को थाम लेता है, पर झूलता है: आगे, पीछे, आगे, हर तरफ़ 6° से आगे, अक्सर गिरने तक। I धीमा है: रोबोट के सीधा हो जाने के बाद भी इसका धक्का बढ़ रहा होता है, तो यह दूसरी तरफ़ ज़्यादा चला जाता है, और फिर वही। P देखता है कितना झुका, I देखता है कितनी देर; कोई नहीं देखता कि यह कितनी तेज़ी से झुक रहा है।', 'Ab yeh khud ko thaam leta hai, par jhoolta hai: aage, peeche, aage, har taraf 6° se aage, aksar girne tak. I dheema hai: robot ke seedha ho jaane ke baad bhi iska dhakka badh raha hota hai, to yeh doosri taraf zyada chala jaata hai, aur phir wahi. P dekhta hai kitna jhuka, I dekhta hai kitni der; koi nahi dekhta ki yeh kitni tezi se jhuk raha hai.') },
      { k: 'edit', test: (src) => { const v = numOf(src, 'Kd'); return v !== null && v >= 1 && v <= 2; }, set: [[/float Kd = 0;/, 'float Kd = 1.5;']], do: t3('Add D: change Kd = 0 to Kd = 1.5 and press Run.', 'D जोड़िए: Kd = 0 को Kd = 1.5 कीजिए और "चलाइए" दबाइए।', 'D jodiye: Kd = 0 ko Kd = 1.5 kijiye aur Run dabaiye.'),
        see: t3('Kd × rate pushes against the speed of tipping: as it swings back up, rate turns negative and the motors ease off before it overshoots.', 'Kd × rate झुकने की रफ़्तार के ख़िलाफ़ धकेलता है: जब यह वापस ऊपर झूलता है, rate नकारात्मक हो जाता है और मोटरें ज़्यादा जाने से पहले ढीली पड़ जाती हैं।', 'Kd × rate jhukne ki raftaar ke khilaaf dhakelta hai: jab yeh wapas upar jhoolta hai, rate negative ho jaata hai aur motors zyada jaane se pehle dheeli pad jaati hain.') },
      { k: 'act', until: (S) => fresh(S) && S.w('stayed'), do: t3('Watch it for 10 seconds.', 'इसे 10 सेकंड देखिए।', 'Ise 10 second dekhiye.'),
        see: liveCarSim((lg, C) => pick(lg, `It stands, steady at −2°: P for how far it leans, I for how long, D for how fast. Look closely and it creeps (${Math.round((C.balD || 0) / 10)} cm so far): no calibration is perfect, and a twentieth of a degree is enough to roll it. It cannot feel that it is moving, so real balancing robots and Segway-style scooters add wheel encoders and a slow speed loop that leans the setpoint back against the creep.`, `यह खड़ा है, −2° पर स्थिर: P बताता है कितना झुका, I कितनी देर, D कितनी तेज़ी से। ध्यान से देखिए तो यह सरकता है (अब तक ${Math.round((C.balD || 0) / 10)} cm): कोई कैलिब्रेशन पूरा सही नहीं होता, और डिग्री का बीसवाँ हिस्सा भी इसे लुढ़काने को काफ़ी है। इसे पता नहीं चलता कि यह चल रहा है, इसलिए असली संतुलन रोबोट और Segway जैसे स्कूटर व्हील एनकोडर और एक धीमा स्पीड लूप जोड़ते हैं जो सरकने के ख़िलाफ़ setpoint को पीछे झुकाता है।`, `Yeh khada hai, −2° par sthir: P batata hai kitna jhuka, I kitni der, D kitni tezi se. Dhyaan se dekhiye to yeh sarakta hai (ab tak ${Math.round((C.balD || 0) / 10)} cm): koi calibration poora sahi nahi hota, aur degree ka beesvaan hissa bhi ise ludhkaane ko kaafi hai. Ise pata nahi chalta ki yeh chal raha hai, isliye asli balancing robot aur Segway jaise scooter wheel encoder aur ek dheema speed loop jodte hain jo sarakne ke khilaaf setpoint ko peeche jhukaata hai.`)) },
    ],
    check: [...rails, has('mpu', t3('motion sensor MPU-6050', 'मोशन सेंसर MPU-6050', 'motion sensor MPU-6050')), need('mpu.SDA', 'A4', W.join, { a: 'SDA', b: 'A4' }), need('mpu.SCL', 'A5', W.join, { a: 'SCL', b: 'A5' })],
    done: (S) => S.w('stayed') });
  // 18 ------------------------------------------------------------------- self-stabilising gimbal (Class 12, batch 33)
  // The wrong sign runs a servo to its end stop by itself; Kp = 2 shakes the platform at about 10 Hz (the servos only take a
  // new angle 50 times a second, so the loop pushes again before the phone has moved); Kp = 0.25 keeps it level as you walk
  const signFixed = (src) => /rollPos\s*=\s*rollPos\s*-\s*Kp\s*\*\s*roll\s*;/.test(src) && /pitchPos\s*=\s*pitchPos\s*-\s*Kp\s*\*\s*pitch\s*;/.test(src);
  L.push({ id: 'gimbal', cls: '12', blocks: false, view: 'wide', rview: 'scene3gb', code: GIMC, drawer: [], baud: 115200, serial: true, scene: { kind: 'gimbal' },
    title: t3('Self-stabilising gimbal', 'ख़ुद स्थिर रहने वाला गिम्बल', 'Khud sthir rehne wala gimbal'),
    goal: t3('A hand-held camera gimbal keeps the camera level however your hand tilts. The MPU-6050 on the camera platform measures its tilt, and two servos turn the platform back. Get the direction right, find out why too strong a correction shakes, and walk with it.', 'हाथ में पकड़ा कैमरा गिम्बल कैमरे को सीधा रखता है, चाहे आपका हाथ कैसे भी झुके। कैमरा प्लेटफ़ॉर्म पर लगा MPU-6050 उसका झुकाव नापता है, और दो सर्वो प्लेटफ़ॉर्म को वापस घुमाते हैं। दिशा सही कीजिए, पता कीजिए कि बहुत ज़ोर का सुधार क्यों हिलाता है, और इसके साथ चलिए।', 'Haath mein pakda camera gimbal camera ko seedha rakhta hai, chahe aapka haath kaise bhi jhuke. Camera platform par laga MPU-6050 uska jhukaav naapta hai, aur do servo platform ko wapas ghumaate hain. Disha sahi kijiye, pata kijiye ki bahut zor ka sudhaar kyon hilaata hai, aur iske saath chaliye.'),
    setup: { parts: [F('svR', 'servo', {}, 178, 52, 1), F('svP', 'servo', {}, 178, 82, 1), F('mpu', 'mpu6050', {}, 130, 128, 0)], wires: [...POWER, ['T:svR:GND', 'H:bn40'], ['T:svR:VP', 'H:bp40'], ['T:svR:SIG', 'D9'], ['T:svP:GND', 'H:bn44'], ['T:svP:VP', 'H:bp44'], ['T:svP:SIG', 'D10'], ['T:mpu:VCC', 'H:bp48'], ['T:mpu:GND', 'H:bn49']] },
    steps: [
      { k: 'info', do: t3('The gimbal stands beside the bench: the handle in your hand, the roll servo (pin 9) on top of it, the pitch servo (pin 10) on its bracket, and the camera platform with an action camera and the GY-521 (MPU-6050) flat in front of it. The servos are wired, and the MPU-6050\'s power; the I2C wires are yours.', 'गिम्बल बेंच के पास खड़ा है: हैंडल आपके हाथ में, उसके ऊपर रोल सर्वो (पिन 9), उसके ब्रैकेट पर पिच सर्वो (पिन 10), और कैमरा प्लेटफ़ॉर्म, जिस पर एक एक्शन कैमरा है और उसके आगे सपाट GY-521 (MPU-6050)। सर्वो जुड़े हैं, और MPU-6050 की बिजली भी; I2C तार आपके हैं।', 'Gimbal bench ke paas khada hai: handle aapke haath mein, uske upar roll servo (pin 9), uske bracket par pitch servo (pin 10), aur camera platform, jis par ek action camera hai aur uske aage sapaat GY-521 (MPU-6050). Servo jude hain, aur MPU-6050 ki bijli bhi; I2C taar aapke hain.'), see: E },
      w3('mpu.SDA', 'A4', 'Join the GY-521\'s SDA (data) to A4.', 'GY-521 का SDA (डेटा) A4 से जोड़िए।', 'GY-521 ka SDA (data) A4 se jodiye.'),
      w3('mpu.SCL', 'A5', 'And its SCL (clock) to A5.', 'और इसका SCL (क्लॉक) A5 से।', 'Aur iska SCL (clock) A5 se.'),
      CHECK,
      RUN(t3('Keep your hand level while calcOffsets() learns "level" (a second): the Serial Monitor says Go!', 'जब तक calcOffsets() "सीधा" सीखता है (एक सेकंड), हाथ सीधा रखिए: सीरियल मॉनिटर Go! कहता है।', 'Jab tak calcOffsets() "seedha" seekhta hai (ek second), haath seedha rakhiye: Serial Monitor Go! kehta hai.')),
      { k: 'act', until: (S) => fresh(S) && S.w('wrongWay'), do: t3('Watch the camera after Go!, your hand still level.', 'Go! के बाद कैमरा देखिए, हाथ अब भी सीधा।', 'Go! ke baad camera dekhiye, haath ab bhi seedha.'),
        see: t3('It flips over by itself until a servo hits its end stop, though your hand never moved. The sensor always reads a few tenths of a degree, and rollPos + Kp × roll turns the servo the same way as that tilt: the tilt grows, the push grows, every loop. That is positive feedback; a controller must push against the error.', 'यह अपने आप पलट जाता है जब तक कोई सर्वो अपने छोर तक न पहुँच जाए, जबकि आपका हाथ हिला ही नहीं। सेंसर हमेशा डिग्री के कुछ दसवें हिस्से पढ़ता है, और rollPos + Kp × roll सर्वो को उसी झुकाव की दिशा में घुमाता है: झुकाव बढ़ता है, धक्का बढ़ता है, हर लूप में। यह पॉज़िटिव फ़ीडबैक है; कंट्रोलर को एरर के ख़िलाफ़ धकेलना चाहिए।', 'Yeh apne aap palat jaata hai jab tak koi servo apne chhor tak na pahunch jaaye, jabki aapka haath hila hi nahi. Sensor hamesha degree ke kuch dasvein hisse padhta hai, aur rollPos + Kp × roll servo ko usi jhukaav ki disha mein ghumaata hai: jhukaav badhta hai, dhakka badhta hai, har loop mein. Yeh positive feedback hai; controller ko error ke khilaaf dhakelna chahiye.') },
      { k: 'edit', test: signFixed, set: [[/rollPos = rollPos \+ Kp \* roll;/, 'rollPos = rollPos - Kp * roll;'], [/pitchPos = pitchPos \+ Kp \* pitch;/, 'pitchPos = pitchPos - Kp * pitch;']], do: t3('Turn against the tilt: change both + Kp to - Kp:\n  rollPos = rollPos - Kp * roll;\n  pitchPos = pitchPos - Kp * pitch;\nPut your hand level and press Run.', 'झुकाव के ख़िलाफ़ घुमाइए: दोनों + Kp को - Kp कीजिए:\n  rollPos = rollPos - Kp * roll;\n  pitchPos = pitchPos - Kp * pitch;\nहाथ सीधा कीजिए और "चलाइए" दबाइए।', 'Jhukaav ke khilaaf ghumaiye: dono + Kp ko - Kp kijiye:\n  rollPos = rollPos - Kp * roll;\n  pitchPos = pitchPos - Kp * pitch;\nHaath seedha kijiye aur Run dabaiye.'), see: E },
      { k: 'act', until: (S) => fresh(S) && S.w('shaky'), do: t3('Watch it, then tilt your hand right.', 'इसे देखिए, फिर हाथ दाएँ झुकाइए।', 'Ise dekhiye, phir haath right jhukaiye.'),
        see: live((lg, R) => pick(lg, `Now it pushes the right way, but far too hard: the platform shakes about ${Math.round(R.hz ?? 10)} times a second, buzzing. Each loop moves the servo 2 × the tilt, and a servo takes a new angle only 50 times a second, so before the camera has moved the loop has already pushed again. It lands past level on the other side, further each time.`, `अब यह सही दिशा में धकेलता है, पर बहुत ज़्यादा ज़ोर से: प्लेटफ़ॉर्म एक सेकंड में लगभग ${Math.round(R.hz ?? 10)} बार काँपता है, भिनभिनाता हुआ। हर लूप सर्वो को झुकाव का 2 गुना घुमाता है, और सर्वो एक सेकंड में बस 50 बार नया कोण लेता है, तो कैमरे के हिलने से पहले ही लूप फिर धकेल चुका होता है। यह दूसरी तरफ़ सीधे से आगे जा पहुँचता है, हर बार और दूर।`, `Ab yeh sahi disha mein dhakelta hai, par bahut zyada zor se: platform ek second mein lagbhag ${Math.round(R.hz ?? 10)} baar kaanpta hai, bhinbhinaata hua. Har loop servo ko jhukaav ka 2 guna ghumaata hai, aur servo ek second mein bas 50 baar naya angle leta hai, to camera ke hilne se pehle hi loop phir dhakel chuka hota hai. Yeh doosri taraf seedhe se aage ja pahunchta hai, har baar aur door.`)) },
      { k: 'edit', test: (src) => { const k = numOf(src, 'Kp'); return signFixed(src) && k !== null && k >= 0.15 && k <= 0.5; }, set: [[/float Kp = 2;/, 'float Kp = 0.25;']], do: t3('Gentler: change Kp = 2 to Kp = 0.25 and press Run (hand level).', 'धीमा: Kp = 2 को Kp = 0.25 कीजिए और "चलाइए" दबाइए (हाथ सीधा)।', 'Dheema: Kp = 2 ko Kp = 0.25 kijiye aur Run dabaiye (haath seedha).'), see: E },
      { k: 'act', until: (S) => fresh(S) && S.w('level'), do: t3('Choose Your hand: Walk, and watch the camera for 5 seconds.', 'आपका हाथ: चलिए चुनिए, और 5 सेकंड कैमरा देखिए।', 'Aapka haath: Chaliye chuniye, aur 5 second camera dekhiye.'),
        see: live((lg, R) => pick(lg, `Your hand sways ±10°, the camera stays within ${R.worst ?? 4}°. A quarter of the tilt each loop: it catches up in a few loops and never overshoots. Real gimbals use brushless motors instead of servos: they answer in a thousandth of a second, so they can push much harder without shaking.`, `आपका हाथ ±10° झूलता है, कैमरा ${R.worst ?? 4}° के अंदर रहता है। हर लूप में झुकाव का चौथाई: कुछ लूप में यह पकड़ लेता है और कभी आगे नहीं निकलता। असली गिम्बल सर्वो की जगह ब्रशलेस मोटर लगाते हैं: वे एक सेकंड के हज़ारवें हिस्से में जवाब देती हैं, इसलिए बिना हिले बहुत ज़्यादा ज़ोर लगा सकती हैं।`, `Aapka haath ±10° jhoolta hai, camera ${R.worst ?? 4}° ke andar rehta hai. Har loop mein jhukaav ka chauthaai: kuch loop mein yeh pakad leta hai aur kabhi aage nahi nikalta. Asli gimbal servo ki jagah brushless motor lagaate hain: woh ek second ke hazaarvein hisse mein jawaab deti hain, isliye bina hile bahut zyada zor laga sakti hain.`)) },
    ],
    check: [...rails, has('mpu', t3('motion sensor MPU-6050', 'मोशन सेंसर MPU-6050', 'motion sensor MPU-6050')), (S) => (S.conn('mpu.SDA', 'A5') && S.conn('mpu.SCL', 'A4') ? [SWAP] : null), need('mpu.SDA', 'A4', W.join, { a: 'SDA', b: 'A4' }), need('mpu.SCL', 'A5', W.join, { a: 'SCL', b: 'A5' })],
    done: (S) => S.w('level') });
  // 19 ------------------------------------------------------------------ ball-on-beam balancer (Class 12, batch 34)
  // P alone swings the ball end to end (nothing slows it); PD stops it, but 2 cm short (the beam is level at 97°, not 90°);
  // PID creeps the last 2 cm and holds it in the middle
  L.push({ id: 'ballbeam', cls: '12', blocks: false, view: 'wide', rview: 'scene3bb', code: BEAMC, drawer: [], serial: true, scene: { kind: 'beam' },
    title: t3('Ball-on-beam balancer', 'बीम पर गेंद संतुलक', 'Beam par gend santulak'),
    goal: t3('Keep a ping-pong ball still in the middle of a tipping beam. The HC-SR04 at one end measures where the ball is; a servo tips the beam to roll it back. It is the classic test of a PID controller: P, then D, then I, and each one fixes what the last one could not.', 'एक झुकते बीम के बीच में पिंग-पोंग गेंद को स्थिर रखिए। एक सिरे पर लगा HC-SR04 नापता है कि गेंद कहाँ है; सर्वो बीम झुकाकर उसे वापस लुढ़काता है। यह PID कंट्रोलर की क्लासिक परीक्षा है: P, फिर D, फिर I, और हर एक वह ठीक करता है जो पिछला नहीं कर पाया।', 'Ek jhukte beam ke beech mein ping-pong gend ko sthir rakhiye. Ek sire par laga HC-SR04 naapta hai ki gend kahan hai; servo beam jhukaakar use wapas ludhkaata hai. Yeh PID controller ki classic pariksha hai: P, phir D, phir I, aur har ek woh theek karta hai jo pichhla nahi kar paaya.'),
    setup: { parts: [F('sv', 'servo', {}, 178, 52, 1), P('us', 'hcsr04', {}, 'j50', 0)], wires: [...POWER, ['T:sv:GND', 'H:bn40'], ['T:sv:VP', 'H:bp40'], ['T:sv:SIG', 'D9'], ['H:f50', 'H:tp41'], ['H:f53', 'H:tn44']] },
    steps: [
      { k: 'info', do: t3('Beside the bench: a 50 cm aluminium beam on a pivot, the servo (pin 9) pushing its rod, and the HC-SR04 at the left end looking along the beam at the ball. The HC-SR04 on the breadboard is that one; its power is wired, its two signal wires are yours.', 'बेंच के पास: धुरी पर 50 cm का एल्युमिनियम बीम, उसकी छड़ को धकेलता सर्वो (पिन 9), और बाएँ सिरे पर बीम के साथ गेंद की ओर देखता HC-SR04। ब्रेडबोर्ड पर लगा HC-SR04 वही है; उसकी बिजली जुड़ी है, उसके दो सिग्नल तार आपके हैं।', 'Bench ke paas: dhuri par 50 cm ka aluminium beam, uski chhad ko dhakelta servo (pin 9), aur baayein sire par beam ke saath gend ki or dekhta HC-SR04. Breadboard par laga HC-SR04 wahi hai; uski bijli judi hai, uske do signal taar aapke hain.'), see: E },
      w3('us.TRIG', 'D6', 'Wire its Trig (column 51) to pin 6.', 'इसका Trig (कॉलम 51) पिन 6 से जोड़िए।', 'Iska Trig (column 51) pin 6 se jodiye.'),
      w3('us.ECHO', 'D7', 'And its Echo (column 52) to pin 7.', 'और इसका Echo (कॉलम 52) पिन 7 से।', 'Aur iska Echo (column 52) pin 7 se.'),
      CHECK,
      RUN(t3('Only P for now (Kp = 3, Ki = 0, Kd = 0). The ball starts at the far end; the Serial Monitor prints how far it is from the sensor.', 'अभी सिर्फ़ P (Kp = 3, Ki = 0, Kd = 0)। गेंद दूर वाले सिरे से शुरू होती है; सीरियल मॉनिटर बताता है कि वह सेंसर से कितनी दूर है।', 'Abhi sirf P (Kp = 3, Ki = 0, Kd = 0). Gend door wale sire se shuru hoti hai; Serial Monitor batata hai ki woh sensor se kitni door hai.')),
      { k: 'act', until: (S) => fresh(S) && S.w('swinging'), do: t3('Watch the ball.', 'गेंद देखिए।', 'Gend dekhiye.'),
        see: t3('It rolls to the middle … and straight past it, to the other side and back, again and again. P tips the beam only by how far the ball is off. By the middle the ball is already rolling fast, and nothing there slows it: P waits until it is off the other way.', 'यह बीच तक लुढ़कती है … और सीधे उसके आगे, दूसरी तरफ़ और वापस, बार-बार। P बीम को बस उतना झुकाता है जितनी गेंद दूर है। बीच तक पहुँचते-पहुँचते गेंद तेज़ लुढ़क रही होती है, और वहाँ उसे कुछ धीमा नहीं करता: P तब तक रुकता है जब तक वह दूसरी तरफ़ दूर न हो जाए।', 'Yeh beech tak ludhakti hai … aur seedhe uske aage, doosri taraf aur wapas, baar-baar. P beam ko bas utna jhukaata hai jitni gend door hai. Beech tak pahunchte-pahunchte gend tez ludhak rahi hoti hai, aur wahan use kuch dheema nahi karta: P tab tak rukta hai jab tak woh doosri taraf door na ho jaaye.') },
      { k: 'edit', test: (src) => { const v = numOf(src, 'Kd'); return v !== null && v >= 1 && v <= 4 && !numOf(src, 'Ki'); }, set: [[/float Kd = 0;/, 'float Kd = 2;']], do: t3('Add D: change Kd = 0 to Kd = 2 and press Run. -Kd × speed tips the beam against the way the ball is rolling.', 'D जोड़िए: Kd = 0 को Kd = 2 कीजिए और "चलाइए" दबाइए। -Kd × speed बीम को गेंद के लुढ़कने की दिशा के ख़िलाफ़ झुकाता है।', 'D jodiye: Kd = 0 ko Kd = 2 kijiye aur Run dabaiye. -Kd × speed beam ko gend ke ludhakne ki disha ke khilaaf jhukaata hai.'), see: E },
      { k: 'act', until: (S) => fresh(S) && S.w('offset'), do: t3('Watch it again.', 'इसे फिर देखिए।', 'Ise phir dekhiye.'),
        see: live((lg, R) => pick(lg, `Calm now: it rolls in and stops. But ${Math.abs(R.off ?? 2)} cm short of the middle, every time. The beam is level at 97°, not 90°: a servo horn only fits every 15° or so, and this one went on a little off. For the ball to stay still the beam must be level, so the servo must be at 97, so out must be 7, so Kp × error = 7: the ball must be 7 ÷ 3 cm off.`, `अब शांत: यह लुढ़ककर आती है और रुक जाती है। पर बीच से ${Math.abs(R.off ?? 2)} cm पहले, हर बार। बीम 97° पर सीधा है, 90° पर नहीं: सर्वो का हॉर्न हर 15° के आसपास ही फ़िट होता है, और यह थोड़ा हटकर लगा। गेंद के रुके रहने के लिए बीम सीधा होना चाहिए, तो सर्वो 97 पर, तो out 7, तो Kp × error = 7: गेंद को 7 ÷ 3 cm दूर रहना ही है।`, `Ab shaant: yeh ludhak kar aati hai aur ruk jaati hai. Par beech se ${Math.abs(R.off ?? 2)} cm pehle, har baar. Beam 97° par seedha hai, 90° par nahi: servo ka horn har 15° ke aaspaas hi fit hota hai, aur yeh thoda hatkar laga. Gend ke ruke rehne ke liye beam seedha hona chahiye, to servo 97 par, to out 7, to Kp × error = 7: gend ko 7 ÷ 3 cm door rehna hi hai.`)) },
      { k: 'edit', test: (src) => { const v = numOf(src, 'Ki'); return v !== null && v >= 0.5 && v <= 3 && (numOf(src, 'Kd') || 0) >= 1; }, set: [[/float Ki = 0;/, 'float Ki = 1.5;']], do: t3('Add I: change Ki = 0 to Ki = 1.5 and press Run.', 'I जोड़िए: Ki = 0 को Ki = 1.5 कीजिए और "चलाइए" दबाइए।', 'I jodiye: Ki = 0 ko Ki = 1.5 kijiye aur Run dabaiye.'), see: E },
      { k: 'act', until: (S) => fresh(S) && S.w('held'), do: t3('Watch it, then flick the ball (👉 in the panel).', 'इसे देखिए, फिर गेंद को झटका दीजिए (पैनल में 👉)।', 'Ise dekhiye, phir gend ko jhatka dijiye (panel mein 👉).'),
        see: t3('It stops short, then creeps the last 2 cm and stays in the middle. iTerm grows for as long as the ball is off, until it gives the 7° that P alone could only get from an error. That is what I is for: the error that is small but never goes away. Flick it and it comes back.', 'यह पहले रुकती है, फिर आख़िरी 2 cm सरकती है और बीच में रहती है। जब तक गेंद दूर है iTerm बढ़ता रहता है, जब तक वह 7° न दे दे जो अकेला P बस एरर से ही ला सकता था। I इसी के लिए है: वह एरर जो छोटी है पर कभी जाती नहीं। झटका दीजिए, यह लौट आती है।', 'Yeh pehle rukti hai, phir aakhri 2 cm sarakti hai aur beech mein rehti hai. Jab tak gend door hai iTerm badhta rehta hai, jab tak woh 7° na de de jo akela P bas error se hi la sakta tha. I isi ke liye hai: woh error jo chhoti hai par kabhi jaati nahi. Jhatka dijiye, yeh laut aati hai.') },
    ],
    check: [...rails, has('us', t3('ultrasonic sensor HC-SR04', 'अल्ट्रासोनिक सेंसर HC-SR04', 'ultrasonic sensor HC-SR04')), need('us.TRIG', 'D6', W.toPin, { x: 'TRIG', p: 6 }), need('us.ECHO', 'D7', W.toPin, { x: 'ECHO', p: 7 }), need('us.VCC', '5V', W.to5v, { x: 'VCC' }), need('us.GND', 'GND', W.toGnd, { x: 'GND' })],
    done: (S) => S.w('held') });
  // 20 ------------------------------------------------------------------------ smart ration shop (Class 12, batch 35)
  // The card shows the month's rice; the scale beeps at the quota; the same card tapped again gets it all again, until the
  // taken[] check is switched on
  const okTaken = (src) => /\n\s*\}\s*else\s+if\s*\(\s*taken\[who\]\s*\)\s*\{\s*\n\s*lcd\.print\(names\[who\]\);\s*\n\s*lcd\.setCursor\(0,\s*1\);\s*\n\s*lcd\.print\("Already taken"\);\s*\n\s*who\s*=\s*-1;/.test(src || '');
  L.push({ id: 'rationshop', cls: '12', blocks: false, view: 'wide', rview: 'scene3', code: RATIONC, drawer: [], serial: true, scene: { kind: 'ration' },
    title: t3('Smart ration shop: RFID card and grain weight', 'स्मार्ट राशन दुकान: RFID कार्ड और अनाज का वज़न', 'Smart ration dukaan: RFID card aur anaaj ka wazan'),
    goal: t3('A fair-price shop gives each family its month\'s rice: the family\'s ration card is read by RFID, and a load cell weighs the rice so nobody gets less, or more. Build it, find the hole a dishonest customer would use, and close it, as the ePoS machines in real ration shops do.', 'उचित मूल्य की दुकान हर परिवार को उसके महीने का चावल देती है: परिवार का राशन कार्ड RFID से पढ़ा जाता है, और लोड सेल चावल तौलता है ताकि किसी को कम न मिले, न ज़्यादा। इसे बनाइए, वह छेद ढूँढिए जिसे कोई बेईमान ग्राहक इस्तेमाल करेगा, और उसे बंद कीजिए, जैसे असली राशन दुकानों की ePoS मशीनें करती हैं।', 'Uchit mulya ki dukaan har parivaar ko uske mahine ka chaawal deti hai: parivaar ka ration card RFID se padha jaata hai, aur load cell chaawal taulta hai taaki kisi ko kam na mile, na zyada. Ise banaiye, woh chhed dhoondhiye jise koi beimaan grahak istemaal karega, aur use band kijiye, jaise asli ration dukaanon ki ePoS machines karti hain.'),
    setup: { parts: [F('rf', 'rfid', {}, 110, 160, 0), F('lcd', 'lcd16', {}, -128, 66, 0), F('lc', 'loadcell', { load: 'rice' }, 195, 150, 0), P('bz', 'buzzer', {}, 'e30', 0)],
      wires: [...POWER, ...RF.map(([p, b]) => ['T:rf:' + p, b]), ['T:lcd:GND', 'H:bn10'], ['T:lcd:VCC', 'H:bp10'], ['T:lcd:SDA', 'A4'], ['T:lcd:SCL', 'A5'], ['T:lc:VCC', 'H:tp46'], ['T:lc:GND', 'H:tn44'], ['D8', 'H:a30'], ['H:a33', 'H:tn27']] },
    steps: [
      { k: 'info', do: t3('The counter: the RC522 card reader (SPI, pins 9–13), the LCD (I2C), the beeper on pin 8, and the scale: a 5 kg load cell under a steel bowl, its green HX711 board powered. Its two signal wires are yours.', 'काउंटर: RC522 कार्ड रीडर (SPI, पिन 9–13), LCD (I2C), पिन 8 पर बीपर, और तराज़ू: स्टील के कटोरे के नीचे 5 kg का लोड सेल, उसका हरा HX711 बोर्ड बिजली से जुड़ा। उसके दो सिग्नल तार आपके हैं।', 'Counter: RC522 card reader (SPI, pin 9–13), LCD (I2C), pin 8 par beeper, aur taraazu: steel ke katore ke neeche 5 kg ka load cell, uska hara HX711 board bijli se juda. Uske do signal taar aapke hain.'), see: E },
      w3('lc.DT', 'D2', 'Wire the HX711\'s DT (data) to pin 2.', 'HX711 का DT (डेटा) पिन 2 से जोड़िए।', 'HX711 ka DT (data) pin 2 se jodiye.'),
      w3('lc.SCK', 'D5', 'And its SCK (clock) to pin 5.', 'और इसका SCK (क्लॉक) पिन 5 से।', 'Aur iska SCK (clock) pin 5 se.'),
      CHECK,
      RUN(t3('tare() takes the empty bowl as 0, so only the rice is weighed.', 'tare() ख़ाली कटोरे को 0 मान लेता है, ताकि सिर्फ़ चावल तौला जाए।', 'tare() khaali katore ko 0 maan leta hai, taaki sirf chaawal taula jaaye.')),
      { k: 'act', until: (S) => fresh(S) && S.w('shown'), do: t3('In the panel: tap Sunita\'s card (white).', 'पैनल में: सुनीता का कार्ड छुआइए (सफ़ेद)।', 'Panel mein: Sunita ka card chhuaaiye (safed).'), see: t3('Her card is known: 5.0 kg of rice this month.', 'उसका कार्ड पहचाना गया: इस महीने 5.0 kg चावल।', 'Uska card pehchaana gaya: is mahine 5.0 kg chaawal.') },
      { k: 'act', until: (S) => fresh(S) && S.w('stopped'), do: t3('The shopkeeper pours the rice: choose Pours rice, and watch the LCD.', 'दुकानदार चावल डालता है: चावल डालता है चुनिए, और LCD देखिए।', 'Dukaandaar chaawal daalta hai: Chaawal daalta hai chuniye, aur LCD dekhiye.'),
        see: live((lg, R) => pick(lg, `Beep: STOP at ${R.stopAt ?? 5000} g. The shopkeeper stops a moment later, so the bag holds ${R.given ?? R.stopAt ?? 5000} g: the scale, not the shopkeeper's eye, decides.`, `बीप: ${R.stopAt ?? 5000} g पर STOP। दुकानदार एक पल बाद रुकता है, तो थैले में ${R.given ?? R.stopAt ?? 5000} g है: तराज़ू तय करता है, दुकानदार की आँख नहीं।`, `Beep: ${R.stopAt ?? 5000} g par STOP. Dukaandaar ek pal baad rukta hai, to thaile mein ${R.given ?? R.stopAt ?? 5000} g hai: taraazu tay karta hai, dukaandaar ki aankh nahi.`)) },
      { k: 'act', until: (S) => fresh(S) && S.w('twice'), do: t3('Now be the dishonest customer: take the bag away, then tap Sunita\'s card again.', 'अब बेईमान ग्राहक बनिए: थैला ले जाइए, फिर सुनीता का कार्ड फिर से छुआइए।', 'Ab beimaan grahak baniye: thaila le jaaiye, phir Sunita ka card phir se chhuaaiye.'),
        see: t3('"Sunita 5.0 kg" again: she could fill a second bag, and the next, until the shop\'s stock runs out. The program writes taken[who] = true, but nothing ever reads it.', '"Sunita 5.0 kg" फिर से: वह दूसरा थैला भर सकती है, और अगला, जब तक दुकान का स्टॉक ख़त्म न हो जाए। प्रोग्राम taken[who] = true लिखता है, पर उसे कोई पढ़ता ही नहीं।', '"Sunita 5.0 kg" phir se: woh doosra thaila bhar sakti hai, aur agla, jab tak dukaan ka stock khatam na ho jaaye. Program taken[who] = true likhta hai, par use koi padhta hi nahi.') },
      { k: 'edit', test: okTaken, set: [[/\/\/  \} else if \(taken\[who\]\) \{\n\/\/    lcd\.print\(names\[who\]\);\n\/\/    lcd\.setCursor\(0, 1\);\n\/\/    lcd\.print\("Already taken"\);\n\/\/    who = -1;\n/, '    } else if (taken[who]) {\n      lcd.print(names[who]);\n      lcd.setCursor(0, 1);\n      lcd.print("Already taken");\n      who = -1;\n']],
        do: t3('Switch the check on: remove the // at the start of the five lines from } else if (taken[who]) { to who = -1; and press Run.', 'जाँच चालू कीजिए: } else if (taken[who]) { से who = -1; तक की पाँच लाइनों के शुरू से // हटाइए और "चलाइए" दबाइए।', 'Jaanch chaalu kijiye: } else if (taken[who]) { se who = -1; tak ki paanch lines ke shuru se // hataiye aur Run dabaiye.'), see: E },
      { k: 'act', until: (S) => fresh(S) && S.w('refused'), do: t3('Try it again: tap Sunita\'s card, pour until the beep, take the bag away, and tap her card once more.', 'फिर आज़माइए: सुनीता का कार्ड छुआइए, बीप तक डालिए, थैला ले जाइए, और उसका कार्ड एक बार और छुआइए।', 'Phir aazmaaiye: Sunita ka card chhuaaiye, beep tak daaliye, thaila le jaaiye, aur uska card ek baar aur chhuaaiye.'),
        see: t3('"Already taken": the hole is closed. But only until the Uno restarts: taken[] lives in RAM, and a power cut forgets it. Real ePoS machines check every card with a state server over the mobile network, with the family\'s Aadhaar fingerprint, and print a receipt.', '"Already taken": छेद बंद। पर बस Uno के दोबारा शुरू होने तक: taken[] RAM में रहता है, और बिजली जाते ही भूल जाता है। असली ePoS मशीनें मोबाइल नेटवर्क से हर कार्ड को राज्य के सर्वर से जाँचती हैं, परिवार के आधार फ़िंगरप्रिंट के साथ, और रसीद छापती हैं।', '"Already taken": chhed band. Par bas Uno ke dobaara shuru hone tak: taken[] RAM mein rehta hai, aur bijli jaate hi bhool jaata hai. Asli ePoS machines mobile network se har card ko rajya ke server se jaanchti hain, parivaar ke Aadhaar fingerprint ke saath, aur raseed chhaapti hain.') },
    ],
    check: [...rails, has('lc', t3('load cell with HX711', 'HX711 वाला लोड सेल', 'HX711 wala load cell')), need('lc.DT', 'D2', W.toPin, { x: 'DT', p: 2 }), need('lc.SCK', 'D5', W.toPin, { x: 'SCK', p: 5 })],
    done: (S) => S.w('refused') });
  // 21 ---------------------------------------------------------- robot arm: inverse kinematics to a point (Class 12, batch 36)
  // Type coordinates; red and green are reached; blue (282 mm away, the arm reaches 255) makes acos() NaN, Servo.write()
  // takes NaN as 0 and the elbow folds the forearm back into itself; the reach check answers "Out of reach" instead
  const okReach = (src) => /\n\s*if\s*\(\s*d\s*>\s*L1\s*\+\s*L2\s*-\s*2\s*\)\s*\{\s*\n\s*Serial\.println\("Out of reach"\);\s*\n\s*return;\s*\n\s*\}/.test(src || '');
  const said = (S, re) => (S.serLines || []).some((x) => re.test(x));
  L.push({ id: 'armreach', cls: '12', blocks: false, view: 'side', wview: 'armbench', rview: 'armtgt', code: ARMIK, drawer: [], serial: true, world: { kind: 'arm', level: 7 },
    title: t3('Robot arm: inverse kinematics to reach a point', 'रोबोट बाँह: इनवर्स काइनेमैटिक्स से किसी बिंदु तक पहुँचना', 'Robot arm: inverse kinematics se kisi bindu tak pahunchna'),
    goal: t3('Tell the arm where, not how: type a point in millimetres and the program works out the three joint angles. Then find what happens when the point is too far away, and make the arm say so instead of hurting itself.', 'बाँह को बताइए कहाँ, कैसे नहीं: मिलीमीटर में एक बिंदु टाइप कीजिए और प्रोग्राम तीनों जोड़ों के कोण निकालता है। फिर पता कीजिए कि बिंदु बहुत दूर हो तो क्या होता है, और बाँह से यह कहलवाइए, ख़ुद को चोट पहुँचाने के बजाय।', 'Baanh ko bataiye kahan, kaise nahi: millimetre mein ek bindu type kijiye aur program teeno jodon ke kon nikaalta hai. Phir pata kijiye ki bindu bahut door ho to kya hota hai, aur baanh se yeh kehlwaiye, khud ko chot pahunchaane ke bajaay.'),
    setup: { parts: ARMP, wires: aWires },
    steps: [
      { k: 'info', do: t3('The arm is wired (base, shoulder, elbow, claw on pins 3, 5, 6, 9, with its 5 V adapter). Three balls stand on rods in front of it; the panel gives each one\'s x, y, z: x to the right, y towards you, z up, in mm from the middle of the base.', 'बाँह जुड़ी है (बेस, कंधा, कोहनी, पंजा पिन 3, 5, 6, 9 पर, अपने 5 V अडैप्टर के साथ)। इसके सामने छड़ों पर तीन गेंदें खड़ी हैं; पैनल हर एक का x, y, z बताता है: x दाईं ओर, y आपकी ओर, z ऊपर, बेस के बीच से mm में।', 'Baanh judi hai (base, kandha, kohni, panja pin 3, 5, 6, 9 par, apne 5 V adapter ke saath). Iske saamne chhadon par teen gendein khadi hain; panel har ek ka x, y, z batata hai: x right, y aapki or, z upar, base ke beech se mm mein.'), see: E },
      { k: 'info', code: [10, 25], do: t3('Read reachTo(): atan2 turns the base towards the point, Pythagoras gives r and d, and the cosine rule gives the shoulder and elbow angles of the triangle shoulder–elbow–claw (sides L1, L2 and d).', 'reachTo() पढ़िए: atan2 बेस को बिंदु की ओर घुमाता है, पाइथागोरस r और d देता है, और कोसाइन नियम त्रिभुज कंधा–कोहनी–पंजा (भुजाएँ L1, L2 और d) से कंधे और कोहनी के कोण देता है।', 'reachTo() padhiye: atan2 base ko bindu ki or ghumaata hai, Pythagoras r aur d deta hai, aur cosine niyam tribhuj kandha–kohni–panja (bhujaayein L1, L2 aur d) se kandhe aur kohni ke kon deta hai.'), see: E },
      RUN(),
      { k: 'act', until: (S) => fresh(S) && S.w('touch_red'), do: t3('In the Serial Monitor type   -90 150 60   and press Send.', 'सीरियल मॉनिटर में   -90 150 60   टाइप कीजिए और Send दबाइए।', 'Serial Monitor mein   -90 150 60   type kijiye aur Send dabaiye.'),
        see: t3('The claw goes straight to the red ball: base 121°, shoulder 52°, elbow 85°. You gave a point; the cosine rule found the angles.', 'पंजा सीधा लाल गेंद पर जाता है: बेस 121°, कंधा 52°, कोहनी 85°। आपने एक बिंदु दिया; कोसाइन नियम ने कोण निकाले।', 'Panja seedha laal gend par jaata hai: base 121°, kandha 52°, kohni 85°. Aapne ek bindu diya; cosine niyam ne kon nikaale.') },
      { k: 'act', until: (S) => fresh(S) && S.w('folded'), do: t3('Now the blue ball: type   0 280 40   and Send.', 'अब नीली गेंद:   0 280 40   टाइप कीजिए और Send।', 'Ab neeli gend:   0 280 40   type kijiye aur Send.'),
        see: t3('The arm folds up on itself and the elbow servo buzzes against its own forearm. The Serial Monitor says shoulder nan, elbow nan. The ball is 282 mm from the shoulder, but L1 + L2 is only 255: no triangle has those sides, the cosine is more than 1, and acos() answers "not a number". Servo.write() takes nan as 0°.', 'बाँह ख़ुद पर मुड़ जाती है और कोहनी का सर्वो अपनी ही बाँह से टकराकर भिनभिनाता है। सीरियल मॉनिटर कहता है shoulder nan, elbow nan। गेंद कंधे से 282 mm दूर है, पर L1 + L2 बस 255 है: ऐसी भुजाओं वाला कोई त्रिभुज नहीं, कोसाइन 1 से ज़्यादा है, और acos() "संख्या नहीं" जवाब देता है। Servo.write() nan को 0° मान लेता है।', 'Baanh khud par mud jaati hai aur kohni ka servo apni hi baanh se takraakar bhinbhinaata hai. Serial Monitor kehta hai shoulder nan, elbow nan. Gend kandhe se 282 mm door hai, par L1 + L2 bas 255 hai: aisi bhujaaon wala koi tribhuj nahi, cosine 1 se zyada hai, aur acos() "number nahi" jawaab deta hai. Servo.write() nan ko 0° maan leta hai.') },
      { k: 'edit', test: okReach, set: [[/\/\/  if \(d > L1 \+ L2 - 2\) \{\n\/\/    Serial\.println\("Out of reach"\);\n\/\/    return;\n\/\/  \}\n/, '  if (d > L1 + L2 - 2) {\n    Serial.println("Out of reach");\n    return;\n  }\n']],
        do: t3('Check before you move: remove the // from the four lines of the if (d > L1 + L2 - 2) block, and press Run.', 'चलाने से पहले जाँचिए: if (d > L1 + L2 - 2) वाले ब्लॉक की चार लाइनों से // हटाइए, और "चलाइए" दबाइए।', 'Chalaane se pehle jaanchiye: if (d > L1 + L2 - 2) wale block ki chaar lines se // hataiye, aur Run dabaiye.'), see: E },
      { k: 'act', until: (S) => fresh(S) && said(S, /Out of reach/) && S.w('touch_green'), do: t3('Type   0 280 40   again, then the green ball:   80 120 120', 'फिर से   0 280 40   टाइप कीजिए, फिर हरी गेंद:   80 120 120', 'Phir se   0 280 40   type kijiye, phir hari gend:   80 120 120'),
        see: t3('"Out of reach", and the arm stays where it is; then it touches the green ball. Real robot controllers check every point against the arm\'s reach, and its joint limits, before they move, and refuse with an error, as this one now does.', '"Out of reach", और बाँह जहाँ है वहीं रहती है; फिर यह हरी गेंद छूती है। असली रोबोट कंट्रोलर हिलने से पहले हर बिंदु को बाँह की पहुँच और उसके जोड़ों की सीमाओं से जाँचते हैं, और गलती बताकर मना कर देते हैं, जैसे यह अब करता है।', '"Out of reach", aur baanh jahan hai wahin rehti hai; phir yeh hari gend chhooti hai. Asli robot controller hilne se pehle har bindu ko baanh ki pahunch aur uske jodon ki seemaaon se jaanchte hain, aur galti batakar mana kar dete hain, jaise yeh ab karta hai.') },
    ],
    check: [noShort],
    done: (S) => S.w('touch_green') && said(S, /Out of reach/) });
  // 22 ------------------------------------------------------------- object detection with a camera (Class 12, batch 37)
  // The ribbon in the wrong way: no camera; YOLOv8n finds the bottle and the cup at about two frames a second, and floods
  // the terminal (verbose); the TV remote is also taken for a cell phone at 0.38 until the threshold goes up to 0.5
  const saidR = (S, re) => (S.serLines || []).some((x) => re.test(x));
  const okVerb = (src) => /results\s*=\s*model\(\s*frame\s*,\s*verbose\s*=\s*False\s*\)/.test(src || '');
  const okThr = (src) => { const m = /if\s+conf\s*>\s*([\d.]+)\s*:/.exec(src || ''); return okVerb(src) && !!m && +m[1] >= 0.45 && +m[1] <= 0.55; };
  L.push({ id: 'aidetect', board: 'pi4', cls: '12', blocks: false, view: 'pi6', wview: 'pi6w', rview: 'scene3ai', code: AIDET, drawer: [], serial: true, scene: { kind: 'aicam', ribbon: 'flipped' },
    title: t3('Object detection with a camera (AI)', 'कैमरे से वस्तु पहचान (AI)', 'Camera se vastu pehchaan (AI)'),
    goal: t3('A Raspberry Pi camera and YOLO, a neural network trained on 80 everyday things, name what is on the table and how sure they are. Get the camera working, see how slow and how wrong AI can be, and set the confidence it must reach.', 'Raspberry Pi कैमरा और YOLO, 80 रोज़मर्रा की चीज़ों पर ट्रेन किया एक न्यूरल नेटवर्क, बताते हैं कि मेज़ पर क्या है और वे कितने पक्के हैं। कैमरा चालू कीजिए, देखिए AI कितना धीमा और कितना ग़लत हो सकता है, और वह भरोसा तय कीजिए जिस तक उसे पहुँचना है।', 'Raspberry Pi camera aur YOLO, 80 rozmarra ki cheezon par train kiya ek neural network, batate hain ki mez par kya hai aur woh kitne pakke hain. Camera chaalu kijiye, dekhiye AI kitna dheema aur kitna galat ho sakta hai, aur woh bharosa tay kijiye jis tak use pahunchna hai.'),
    setup: { parts: [], wires: [] },
    steps: [
      { k: 'info', do: t3('Beside the Pi: a Camera Module 3 on a little tripod, on its ribbon cable to the Pi\'s CAMERA port, looking at a white table. The panel puts things on the table. The Pi has picamera2 and ultralytics installed, and the yolov8n.pt model (6 MB).', 'Pi के पास: छोटे तिपाए पर कैमरा मॉड्यूल 3, अपनी रिबन केबल से Pi के CAMERA पोर्ट पर, एक सफ़ेद मेज़ की ओर देखता। पैनल मेज़ पर चीज़ें रखता है। Pi पर picamera2 और ultralytics लगे हैं, और yolov8n.pt मॉडल (6 MB)।', 'Pi ke paas: chhote tipaaye par Camera Module 3, apni ribbon cable se Pi ke CAMERA port par, ek safed mez ki or dekhta. Panel mez par cheezein rakhta hai. Pi par picamera2 aur ultralytics lage hain, aur yolov8n.pt model (6 MB).'), see: E },
      RUN(t3('Read the terminal.', 'टर्मिनल पढ़िए।', 'Terminal padhiye.')),
      { k: 'act', until: (S) => fresh(S) && S.w('camOk'), do: t3('IndexError: Picamera2 found no camera. The ribbon cable went in the wrong way round: in the panel, flip it, then press Run again.', 'IndexError: Picamera2 को कोई कैमरा नहीं मिला। रिबन केबल उल्टी लगी है: पैनल में उसे पलटिए, फिर "चलाइए" दबाइए।', 'IndexError: Picamera2 ko koi camera nahi mila. Ribbon cable ulti lagi hai: panel mein use palatiye, phir Run dabaiye.'),
        see: t3('"Ready": the camera is found. Its ribbon has contacts on one side only; on a Pi 4 they face the HDMI ports. The wrong way round, nothing is broken, the Pi just sees no camera.', '"Ready": कैमरा मिल गया। इसकी रिबन के कॉन्टैक्ट एक ही तरफ़ होते हैं; Pi 4 पर वे HDMI पोर्ट की ओर होते हैं। उल्टी लगी हो तो कुछ टूटता नहीं, Pi को बस कैमरा नहीं दिखता।', '"Ready": camera mil gaya. Iski ribbon ke contacts ek hi taraf hote hain; Pi 4 par woh HDMI ports ki or hote hain. Ulti lagi ho to kuch toot-ta nahi, Pi ko bas camera nahi dikhta.') },
      { k: 'act', until: (S) => fresh(S) && saidR(S, /^bottle 0\.\d+/) && saidR(S, /^cup 0\.\d+/), do: t3('Put the water bottle and the cup on the table.', 'मेज़ पर पानी की बोतल और कप रखिए।', 'Mez par paani ki bottle aur cup rakhiye.'),
        see: t3('"bottle 0.88", "cup 0.82": the network gives each thing a class and a confidence. But look at the speed: about 450 ms for each frame, two frames a second, and ultralytics prints its own two lines for every frame (verbose), burying yours.', '"bottle 0.88", "cup 0.82": नेटवर्क हर चीज़ को एक क्लास और एक भरोसा देता है। पर रफ़्तार देखिए: हर फ़्रेम में लगभग 450 ms, सेकंड में दो फ़्रेम, और ultralytics हर फ़्रेम पर अपनी दो लाइनें छापता है (verbose), जिनमें आपकी लाइनें दब जाती हैं।', '"bottle 0.88", "cup 0.82": network har cheez ko ek class aur ek bharosa deta hai. Par raftaar dekhiye: har frame mein lagbhag 450 ms, second mein do frame, aur ultralytics har frame par apni do lines chhaapta hai (verbose), jinmein aapki lines dab jaati hain.') },
      { k: 'edit', test: okVerb, set: [[/results = model\(frame\)/, 'results = model(frame, verbose=False)']], do: t3('Quiet: change results = model(frame) to results = model(frame, verbose=False) and press Run.', 'शांत: results = model(frame) को results = model(frame, verbose=False) कीजिए और "चलाइए" दबाइए।', 'Shaant: results = model(frame) ko results = model(frame, verbose=False) kijiye aur Run dabaiye.'), see: E },
      { k: 'act', until: (S) => fresh(S) && saidR(S, /^remote 0\.\d+/) && saidR(S, /^cell phone 0\.\d+/), do: t3('Now put the TV remote on the table too (no phone).', 'अब मेज़ पर टीवी रिमोट भी रखिए (फ़ोन नहीं)।', 'Ab mez par TV remote bhi rakhiye (phone nahi).'),
        see: t3('"remote 0.58" and "cell phone 0.38": there is no phone on the table. A remote looks like a phone to a small network: black, flat, a hand\'s length. YOLO gives every guess it has, and a low threshold (0.3) lets the weak wrong ones through.', '"remote 0.58" और "cell phone 0.38": मेज़ पर कोई फ़ोन नहीं है। छोटे नेटवर्क को रिमोट फ़ोन जैसा दिखता है: काला, चपटा, एक हथेली लंबा। YOLO अपना हर अनुमान देता है, और कम थ्रेशहोल्ड (0.3) कमज़ोर ग़लत अनुमानों को भी आने देता है।', '"remote 0.58" aur "cell phone 0.38": mez par koi phone nahi hai. Chhote network ko remote phone jaisa dikhta hai: kaala, chapta, ek hatheli lamba. YOLO apna har anumaan deta hai, aur kam threshold (0.3) kamzor galat anumaanon ko bhi aane deta hai.') },
      { k: 'edit', test: okThr, set: [[/if conf > 0\.3:/, 'if conf > 0.5:']], do: t3('Raise the bar: change if conf > 0.3: to if conf > 0.5: and press Run.', 'बार ऊँचा कीजिए: if conf > 0.3: को if conf > 0.5: कीजिए और "चलाइए" दबाइए।', 'Bar ooncha kijiye: if conf > 0.3: ko if conf > 0.5: kijiye aur Run dabaiye.'), see: E },
      { k: 'act', until: (S) => fresh(S) && (S.serLines || []).filter((x) => /^remote 0\.\d+/.test(x)).length >= 3 && !saidR(S, /^cell phone/), do: t3('Watch it with the bottle, the cup and the remote still on the table.', 'बोतल, कप और रिमोट अभी भी मेज़ पर रखे हुए देखिए।', 'Bottle, cup aur remote abhi bhi mez par rakhe hue dekhiye.'),
        see: t3('No more phantom phone, and the remote, bottle and cup still come through. Too high, and real things get lost too: turn the room light down and watch the confidences fall. Every AI system picks this line between missing things and imagining them.', 'अब कोई नक़ली फ़ोन नहीं, और रिमोट, बोतल और कप अब भी आते हैं। बहुत ऊँचा, तो असली चीज़ें भी छूट जाती हैं: कमरे की रोशनी कम कीजिए और भरोसा गिरते देखिए। हर AI सिस्टम चीज़ें छोड़ने और चीज़ें सोच लेने के बीच यह रेखा चुनता है।', 'Ab koi nakli phone nahi, aur remote, bottle aur cup ab bhi aate hain. Bahut ooncha, to asli cheezein bhi chhoot jaati hain: kamre ki roshni kam kijiye aur bharosa girte dekhiye. Har AI system cheezein chhodne aur cheezein soch lene ke beech yeh rekha chunta hai.') },
    ],
    check: [],
    done: (S) => (S.serLines || []).some((x) => /^remote 0\.\d+/.test(x)) && !saidR(S, /^cell phone/) && /conf\s*>\s*0\.[45]/.test(S.runSrc || '') });
  // 23 ------------------------------------------------------------ face-tracking pan-tilt camera (Class 12, batch 38)
  // The wrong sign turns away from the face; right, but at 640 × 480 the Pi does 5 frames a second and steers by old
  // pictures, so a walking face drifts to the edge; at 320 × 240 it does about 17 and keeps the face in the middle
  const okPanF = (src) => /pan_angle\s*=\s*pan_angle\s*\+\s*err_x\s*\*\s*30/.test(src || '');
  const okSmallF = (src) => okPanF(src) && /"size":\s*\(\s*320\s*,\s*240\s*\)/.test(src || '');
  L.push({ id: 'facetrack', board: 'pi4', cls: '12', blocks: false, view: 'pi6', wview: 'pi6w', rview: 'scene3ft', code: FACEC, drawer: [], serial: true, scene: { kind: 'face' },
    title: t3('Face-tracking pan-tilt camera', 'चेहरे के पीछे घूमने वाला पैन-टिल्ट कैमरा', 'Chehre ke peeche ghoomne wala pan-tilt camera'),
    goal: t3('A camera on two servos that keeps a face in the middle of its picture, as video-call cameras and security domes do. OpenCV finds the face; the program turns the servos by how far it is from the middle. Get the direction right, and find out why a slow loop cannot keep up.', 'दो सर्वो पर लगा कैमरा जो चेहरे को अपनी तस्वीर के बीच में रखता है, जैसे वीडियो-कॉल कैमरे और सिक्योरिटी डोम करते हैं। OpenCV चेहरा ढूँढता है; प्रोग्राम सर्वो को उतना घुमाता है जितना चेहरा बीच से दूर है। दिशा सही कीजिए, और पता कीजिए कि धीमा लूप साथ क्यों नहीं दे पाता।', 'Do servo par laga camera jo chehre ko apni tasveer ke beech mein rakhta hai, jaise video-call camera aur security dome karte hain. OpenCV chehra dhoondhta hai; program servo ko utna ghumaata hai jitna chehra beech se door hai. Disha sahi kijiye, aur pata kijiye ki dheema loop saath kyon nahi de paata.'),
    setup: { parts: [F('svP', 'servo', {}, 178, 52, 1), F('svT', 'servo', {}, 178, 82, 1)], wires: [['B:5V', 'H:bp2'], ['B:GND6', 'H:bn3'], ['T:svP:GND', 'H:bn40'], ['T:svP:VP', 'H:bp40'], ['T:svP:SIG', 'B:GPIO17'], ['T:svT:GND', 'H:bn44'], ['T:svT:VP', 'H:bp44'], ['T:svT:SIG', 'B:GPIO18']] },
    steps: [
      { k: 'info', do: t3('Beside the Pi: the Camera Module 3 on a pan-tilt head, the pan servo on GPIO 17, the tilt servo on GPIO 18, and a person in front of it. The panel moves the person: a step left or right, or walking to and fro.', 'Pi के पास: पैन-टिल्ट हेड पर कैमरा मॉड्यूल 3, GPIO 17 पर पैन सर्वो, GPIO 18 पर टिल्ट सर्वो, और उसके सामने एक व्यक्ति। पैनल व्यक्ति को हिलाता है: बाएँ या दाएँ एक क़दम, या इधर-उधर चलना।', 'Pi ke paas: pan-tilt head par Camera Module 3, GPIO 17 par pan servo, GPIO 18 par tilt servo, aur uske saamne ek vyakti. Panel vyakti ko hilaata hai: left ya right ek kadam, ya idhar-udhar chalna.'), see: E },
      RUN(t3('Every second the terminal prints the frames per second and where the camera points.', 'हर सेकंड टर्मिनल फ़्रेम प्रति सेकंड और कैमरे की दिशा दिखाता है।', 'Har second terminal frames per second aur camera ki disha dikhaata hai.')),
      { k: 'act', until: (S) => fresh(S) && S.w('lost'), do: t3('In the panel, move the person a step to the right.', 'पैनल में व्यक्ति को एक क़दम दाईं ओर ले जाइए।', 'Panel mein vyakti ko ek kadam right le jaaiye.'),
        see: t3('The camera turns left, away from the face, until the face slips out of the picture. The face is right of the middle, err_x is +, and pan_angle - err_x × 30 turns the camera left: the error grows. In gpiozero a bigger angle turns this pan servo to the right.', 'कैमरा बाईं ओर घूमता है, चेहरे से दूर, जब तक चेहरा तस्वीर से बाहर न निकल जाए। चेहरा बीच से दाईं ओर है, err_x + है, और pan_angle - err_x × 30 कैमरे को बाईं ओर घुमाता है: एरर बढ़ता है। gpiozero में बड़ा कोण इस पैन सर्वो को दाईं ओर घुमाता है।', 'Camera left ghoomta hai, chehre se door, jab tak chehra tasveer se bahar na nikal jaaye. Chehra beech se right hai, err_x + hai, aur pan_angle - err_x × 30 camera ko left ghumaata hai: error badhta hai. gpiozero mein bada angle is pan servo ko right ghumaata hai.') },
      { k: 'edit', test: okPanF, set: [[/pan_angle = pan_angle - err_x \* 30/, 'pan_angle = pan_angle + err_x * 30']], do: t3('Change pan_angle - err_x * 30 to pan_angle + err_x * 30, put the person back in the middle, and press Run.', 'pan_angle - err_x * 30 को pan_angle + err_x * 30 कीजिए, व्यक्ति को वापस बीच में लाइए, और "चलाइए" दबाइए।', 'pan_angle - err_x * 30 ko pan_angle + err_x * 30 kijiye, vyakti ko wapas beech mein laaiye, aur Run dabaiye.'), see: E },
      { k: 'act', until: (S) => fresh(S) && S.w('lagging'), do: t3('Now let the person walk to and fro (Walk), and watch the face in the picture.', 'अब व्यक्ति को इधर-उधर चलने दीजिए (चले), और तस्वीर में चेहरा देखिए।', 'Ab vyakti ko idhar-udhar chalne dijiye (Chale), aur tasveer mein chehra dekhiye.'),
        see: live((lg, R) => pick(lg, `It follows, but always behind: the face is more than 15° off the middle ${R.off ?? 30} % of the time, up to ${R.worst ?? 20}° (past 30° it is out of the picture). The terminal says fps: 5 or 6. Finding a face in 640 × 480 takes the Pi about 160 ms, so the camera steers by a picture that is already a fifth of a second old, and only five times a second.`, `यह पीछा करता है, पर हमेशा पीछे: चेहरा ${R.off ?? 30} % समय बीच से 15° से ज़्यादा हटा रहता है, ${R.worst ?? 20}° तक (30° के बाद यह तस्वीर से बाहर है)। टर्मिनल कहता है fps: 5 या 6। 640 × 480 में चेहरा ढूँढने में Pi को लगभग 160 ms लगते हैं, तो कैमरा एक सेकंड के पाँचवें हिस्से पुरानी तस्वीर से मुड़ता है, और सेकंड में बस पाँच बार।`, `Yeh peecha karta hai, par hamesha peeche: chehra ${R.off ?? 30} % samay beech se 15° se zyada hata rehta hai, ${R.worst ?? 20}° tak (30° ke baad yeh tasveer se bahar hai). Terminal kehta hai fps: 5 ya 6. 640 × 480 mein chehra dhoondhne mein Pi ko lagbhag 160 ms lagte hain, to camera ek second ke paanchve hisse purani tasveer se mudta hai, aur second mein bas paanch baar.`)) },
      { k: 'edit', test: okSmallF, set: [[/"size": \(640, 480\)/, '"size": (320, 240)']], do: t3('A smaller picture is four times less work: change (640, 480) to (320, 240) and press Run (the person keeps walking).', 'छोटी तस्वीर चार गुना कम काम है: (640, 480) को (320, 240) कीजिए और "चलाइए" दबाइए (व्यक्ति चलता रहता है)।', 'Chhoti tasveer chaar guna kam kaam hai: (640, 480) ko (320, 240) kijiye aur Run dabaiye (vyakti chalta rehta hai).'), see: E },
      { k: 'act', until: (S) => fresh(S) && S.w('tracked'), do: t3('Watch it follow the walking person for 10 seconds.', 'चलते व्यक्ति के पीछे इसे 10 सेकंड घूमते देखिए।', 'Chalte vyakti ke peeche ise 10 second ghoomte dekhiye.'),
        see: live((lg, R) => pick(lg, `fps: about 17, and the face stays near the middle: more than 15° off only ${R.off ?? 5} % of the time. A face is still 40 pixels across at 320 × 240, plenty for the detector. Because err_x is a fraction of the picture's width, the same 30 works at any size. Real tracking cameras do this, and also guess where the face is going next.`, `fps: लगभग 17, और चेहरा बीच के पास रहता है: बस ${R.off ?? 5} % समय 15° से ज़्यादा हटा। 320 × 240 पर भी चेहरा 40 पिक्सेल चौड़ा है, डिटेक्टर के लिए काफ़ी। err_x तस्वीर की चौड़ाई का हिस्सा है, इसलिए वही 30 हर आकार पर चलता है। असली ट्रैकिंग कैमरे यही करते हैं, और यह भी अंदाज़ा लगाते हैं कि चेहरा आगे कहाँ जाएगा।`, `fps: lagbhag 17, aur chehra beech ke paas rehta hai: bas ${R.off ?? 5} % samay 15° se zyada hata. 320 × 240 par bhi chehra 40 pixel chauda hai, detector ke liye kaafi. err_x tasveer ki chaudaai ka hissa hai, isliye wahi 30 har size par chalta hai. Asli tracking camera yahi karte hain, aur yeh bhi andaaza lagaate hain ki chehra aage kahan jaayega.`)) },
    ],
    check: [],
    done: (S) => S.w('tracked') });
  // 24 ------------------------------------------------------------------- smart bin that sorts by AI (Class 12, batch 39)
  // banana → WET, bottle → DRY; the leftover sandwich goes to DRY until WET lists every food class; the old phone goes to DRY
  // until the e-waste lines are switched on
  const okWet = (src) => { const m = /WET\s*=\s*\[([^\]]*)\]/.exec(src || ''); return !!m && /"sandwich"/.test(m[1]) && /"banana"/.test(m[1]); };
  const okE = (src) => okWet(src) && /\n\s{4}if name == "cell phone":\s*\n\s{8}print\("E-waste! Please hand it to the teacher\."\)\s*\n\s{8}time\.sleep\(3\)\s*\n\s{8}continue/.test(src || '');
  L.push({ id: 'aibin', board: 'pi4', cls: '12', blocks: false, view: 'pi6', wview: 'pi6w', rview: 'scene3bn', code: BINC, drawer: [], serial: true, scene: { kind: 'aibin' },
    title: t3('Smart bin that sorts by AI image class', 'AI इमेज क्लास से छाँटने वाला स्मार्ट कूड़ेदान', 'AI image class se chhaantne wala smart koodedaan'),
    goal: t3('Wet waste and dry waste go to different places: the wet to compost, the dry to recycling. A camera and YOLO look at what is dropped in, and a servo flap sends it to the right bin. Teach the bin what counts as food, and what to do with things that belong in neither.', 'गीला कूड़ा और सूखा कूड़ा अलग-अलग जगह जाते हैं: गीला खाद में, सूखा रीसाइक्लिंग में। एक कैमरा और YOLO देखते हैं कि क्या डाला गया, और सर्वो फ़्लैप उसे सही कूड़ेदान में भेजता है। कूड़ेदान को सिखाइए कि खाना क्या है, और उन चीज़ों का क्या करना है जो किसी में नहीं जातीं।', 'Geela kooda aur sookha kooda alag-alag jagah jaate hain: geela khaad mein, sookha recycling mein. Ek camera aur YOLO dekhte hain ki kya daala gaya, aur servo flap use sahi koodedaan mein bhejta hai. Koodedaan ko sikhaiye ki khaana kya hai, aur un cheezon ka kya karna hai jo kisi mein nahi jaatin.'),
    setup: { parts: [F('svF', 'servo', {}, 178, 52, 1), F('svD', 'servo', {}, 178, 82, 1)], wires: [['B:5V', 'H:bp2'], ['B:GND6', 'H:bn3'], ['T:svF:GND', 'H:bn40'], ['T:svF:VP', 'H:bp40'], ['T:svF:SIG', 'B:GPIO17'], ['T:svD:GND', 'H:bn44'], ['T:svD:VP', 'H:bp44'], ['T:svD:SIG', 'B:GPIO18']] },
    steps: [
      { k: 'info', do: t3('Beside the Pi: the smart bin. A tray at the top with the camera looking down at it, a trapdoor under the tray (servo on GPIO 18), and a flap (GPIO 17) that tips into the green WET bin or the blue DRY bin. The panel drops things on the tray, one at a time.', 'Pi के पास: स्मार्ट कूड़ेदान। ऊपर एक ट्रे जिस पर कैमरा नीचे देखता है, ट्रे के नीचे एक ढक्कन (GPIO 18 पर सर्वो), और एक फ़्लैप (GPIO 17) जो हरे गीले या नीले सूखे कूड़ेदान में झुकता है। पैनल ट्रे पर एक बार में एक चीज़ गिराता है।', 'Pi ke paas: smart koodedaan. Upar ek tray jis par camera neeche dekhta hai, tray ke neeche ek dhakkan (GPIO 18 par servo), aur ek flap (GPIO 17) jo hare geele ya neele sookhe koodedaan mein jhukta hai. Panel tray par ek baar mein ek cheez giraata hai.'), see: E },
      RUN(),
      { k: 'act', until: (S) => fresh(S) && S.w('wet_banana') && S.w('dry_bottle'), do: t3('Drop in a banana peel; when it is gone, a plastic bottle.', 'एक केले का छिलका डालिए; उसके जाने के बाद, एक प्लास्टिक की बोतल।', 'Ek kele ka chhilka daaliye; uske jaane ke baad, ek plastic ki bottle.'),
        see: t3('"banana -> WET bin", "bottle -> DRY bin": YOLO names it, the flap turns, then the trapdoor opens. The flap goes first and waits half a second, so the thing never lands on a flap still in the middle.', '"banana -> WET bin", "bottle -> DRY bin": YOLO नाम बताता है, फ़्लैप घूमता है, फिर ढक्कन खुलता है। फ़्लैप पहले जाता है और आधा सेकंड रुकता है, ताकि चीज़ कभी बीच में रुके फ़्लैप पर न गिरे।', '"banana -> WET bin", "bottle -> DRY bin": YOLO naam batata hai, flap ghoomta hai, phir dhakkan khulta hai. Flap pehle jaata hai aur aadha second rukta hai, taaki cheez kabhi beech mein ruke flap par na gire.') },
      { k: 'act', until: (S) => fresh(S) && S.w('dry_sandwich'), do: t3('Now drop in a leftover sandwich.', 'अब एक बचा हुआ सैंडविच डालिए।', 'Ab ek bacha hua sandwich daaliye.'),
        see: t3('"sandwich -> DRY bin": food in the dry bin, where it will rot among the paper and plastic. YOLO knew it was a sandwich; the program only knew two foods. Anything not in WET goes to DRY.', '"sandwich -> DRY bin": खाना सूखे कूड़ेदान में, जहाँ वह काग़ज़ और प्लास्टिक के बीच सड़ेगा। YOLO जानता था कि यह सैंडविच है; प्रोग्राम बस दो खाने जानता था। जो WET में नहीं, वह DRY में जाता है।', '"sandwich -> DRY bin": khaana sookhe koodedaan mein, jahan woh kaagaz aur plastic ke beech sadega. YOLO jaanta tha ki yeh sandwich hai; program bas do khaane jaanta tha. Jo WET mein nahi, woh DRY mein jaata hai.') },
      { k: 'edit', test: okWet, set: [[/WET = \["banana", "apple"\]/, 'WET = ["banana", "apple", "orange", "sandwich", "broccoli", "carrot", "hot dog", "pizza", "donut", "cake"]']], do: t3('Give it all the foods YOLO knows: change the WET line to\n  WET = ["banana", "apple", "orange", "sandwich", "broccoli", "carrot", "hot dog", "pizza", "donut", "cake"]\nand press Run.', 'इसे YOLO के जाने सारे खाने दीजिए: WET वाली लाइन को\n  WET = ["banana", "apple", "orange", "sandwich", "broccoli", "carrot", "hot dog", "pizza", "donut", "cake"]\nकीजिए और "चलाइए" दबाइए।', 'Ise YOLO ke jaane saare khaane dijiye: WET wali line ko\n  WET = ["banana", "apple", "orange", "sandwich", "broccoli", "carrot", "hot dog", "pizza", "donut", "cake"]\nkijiye aur Run dabaiye.'), see: E },
      { k: 'act', until: (S) => fresh(S) && S.w('wet_sandwich') && S.w('ewasteDry'), do: t3('Drop in the sandwich again, then an old phone.', 'फिर से सैंडविच डालिए, फिर एक पुराना फ़ोन।', 'Phir se sandwich daaliye, phir ek puraana phone.'),
        see: t3('The sandwich goes to WET now. But the phone went to DRY: "cell phone -> DRY bin". A phone is e-waste: its battery can catch fire in a garbage truck, and its metals should be recovered, not buried. It belongs in neither bin.', 'सैंडविच अब गीले में जाता है। पर फ़ोन सूखे में गया: "cell phone -> DRY bin"। फ़ोन ई-कचरा है: इसकी बैटरी कूड़ा-गाड़ी में आग पकड़ सकती है, और इसकी धातुएँ निकाली जानी चाहिए, गाड़ी नहीं। यह किसी कूड़ेदान में नहीं जाता।', 'Sandwich ab geele mein jaata hai. Par phone sookhe mein gaya: "cell phone -> DRY bin". Phone e-waste hai: iski battery kooda-gaadi mein aag pakad sakti hai, aur iski dhaatuein nikaali jaani chahiye, gaadi nahi. Yeh kisi koodedaan mein nahi jaata.') },
      { k: 'edit', test: okE, set: [[/    # if name == "cell phone":\n    #     print\("E-waste! Please hand it to the teacher\."\)\n    #     time\.sleep\(3\)\n    #     continue\n/, '    if name == "cell phone":\n        print("E-waste! Please hand it to the teacher.")\n        time.sleep(3)\n        continue\n']], do: t3('Switch on the e-waste check: take the "# " (the hash and the space after it) out of its four lines, so the if lines up with the next if, and press Run.', 'ई-कचरे की जाँच चालू कीजिए: उसकी चार लाइनों से "# " (हैश और उसके बाद की खाली जगह) हटाइए, ताकि यह if अगले if की सीध में आए, और "चलाइए" दबाइए।', 'E-waste ki jaanch chaalu kijiye: uski chaar lines se "# " (hash aur uske baad ki khaali jagah) hataiye, taaki yeh if agle if ki seedh mein aaye, aur Run dabaiye.'), see: E },
      { k: 'act', until: (S) => fresh(S) && S.w('ewasteHeld'), do: t3('Drop in the old phone again.', 'फिर से पुराना फ़ोन डालिए।', 'Phir se puraana phone daaliye.'),
        see: t3('"E-waste! Please hand it to the teacher." The trapdoor stays shut and the phone waits on the tray (take it back off in the panel). Real sorting lines do the same: whatever the AI is not sure about, or must not mix in, goes to a person.', '"E-waste! Please hand it to the teacher." ढक्कन बंद रहता है और फ़ोन ट्रे पर इंतज़ार करता है (पैनल में इसे वापस उठाइए)। असली छँटाई लाइनें भी यही करती हैं: जिस पर AI पक्का नहीं, या जिसे मिलाना नहीं, वह किसी इंसान के पास जाता है।', '"E-waste! Please hand it to the teacher." Dhakkan band rehta hai aur phone tray par intezaar karta hai (panel mein ise wapas uthaiye). Asli chhantaai lines bhi yahi karti hain: jis par AI pakka nahi, ya jise milaana nahi, woh kisi insaan ke paas jaata hai.') },
    ],
    check: [],
    done: (S) => S.w('ewasteHeld') });
  for (const l of L) { l.n = ++n; l.batch = 24; if (l.scene) l.world = l.scene; } // (the lesson runtime asks the "world": worlds3.js makes it from the scene)
  return L;
}
