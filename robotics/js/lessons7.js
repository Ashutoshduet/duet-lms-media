// DUET Robotics Lab 360, batch 7: thirty more Arduino projects for school labs (games, alarms, meters, displays, home
// automation, mechanisms), built only from the parts the bench already has. Same shape as lessons.js / lessons3.js:
// steps (place, wire, check, run, edit, act, watch), check (the circuit checks, first failing message shown), done.
// New here (lessonrt.js, "batch 7"): a lesson's tick(S, dt) watches the bench every frame and keeps what it saw in
// S.mem (all runs) and S.memRun (this run): the LCD's lines, the 7-segment's digits, tones, the relay's load, … The
// step checks and done() read those, so a step is done only when the real circuit and sketch have really done it.
// The ideas come from well-known school projects (see devtools/ROBOTICS.md, batch 7); circuits, code and texts are ours.
import { lcdText, oledLit } from './libs3.js';

const P = 2.54;
const pick = (lg, en, hi, hg) => (lg === 'hi' ? hi : lg === 'hg' ? hg : en);
// the breadboard rail hole at a column (rails have a gap after every five holes)
export const rail = (r, col) => { let best = 0; for (let i = 0; i < 50; i++) if (Math.abs(3 + i + Math.floor(i / 5) - col) < Math.abs(3 + best + Math.floor(best / 5) - col)) best = i; return 'H:' + r + (best + 1); }; // (the nearest: the rails skip a column after every five holes)
// 7-segment: the segments a–g of each digit (1 = lit)
export const SEG_DIGITS = ['1111110', '0110000', '1101101', '1111001', '0110011', '1011011', '1011111', '1110000', '1111111', '1111011'];
// the digit a 7-segment display shows now (or -1: blank / not a digit)
export function segDigit(p) {
  if (!p || p.state.burnt) return -1; const s = p.state.seg || {};
  const pat = ['A', 'B', 'C', 'D', 'E', 'F', 'G'].map((k) => ((s[k] || 0) > 0.002 ? '1' : '0')).join('');
  return SEG_DIGITS.indexOf(pat);
}
// Morse code A–Z (the SOS lesson's sketch has the same table)
export const MORSE = ['.-', '-...', '-.-.', '-..', '.', '..-.', '--.', '....', '..', '.---', '-.-', '.-..', '--', '-.', '---', '.--.', '--.-', '.-.', '...', '-', '..-', '...-', '.--', '-..-', '-.--', '--..'];
// the tone the bench is sounding now (Hz), or 0
const toneNow = (S) => { const s = S.lab.sounds.find((x) => x.kind === 'tone'); return s ? s.f : 0; };
const bt = (S) => S.lab.mcu.t / 1e6; // the board's own clock (s): waits are measured in it, not in the page's time
const lcdRows = (S, tag = 'lcd') => { const p = S.part(tag); return p ? lcdText(p).map((r) => r.trimEnd()) : ['', '']; };
// what every batch-7 lesson watches each frame (only what is on its bench)
function tick7(S) {
  batch7.rt = S; // (live texts read the runner that is watching now)
  const lab = S.lab, M = S.mem, R = S.memRun;
  const tb = bt(S); R.dtb = R.tb === undefined ? 0 : Math.max(0, tb - R.tb); R.tb = tb; // board seconds since the last frame (frames can be slow)
  for (const p of lab.parts) {
    if (p.type === 'lcd16') { const rows = lcdText(p); const key = rows.join('|'); if (key !== R.lcdLast) { R.lcdLast = key; (R.lcd || (R.lcd = [])).push(rows.map((r) => r.trimEnd())); if (R.lcd.length > 300) R.lcd.shift(); } }
    if (p.type === 'seg7') { const d = segDigit(p); if (d !== R.dLast) { R.dLast = d; if (d >= 0) { (R.digits || (R.digits = [])).push(d); if (R.digits.length > 300) R.digits.shift(); (M.digits || (M.digits = new Set())).add(d); } } }
    if (p.type === 'oled') { const n = oledLit(p); R.oledMax = Math.max(R.oledMax || 0, n); R.oledNow = n; }
    if (p.type === 'load230') { if (p.state.on) { R.loadOn = (R.loadOn || 0) + 1; if (!R.loadWas) R.loadStarts = (R.loadStarts || 0) + 1; } R.loadWas = !!p.state.on; }
    if (p.type === 'relay' && p.state.on && !R.relayWas) R.relayOns = (R.relayOns || 0) + 1;
    if (p.type === 'relay') R.relayWas = !!p.state.on;
  }
  // tones: a burst is a run of notes with gaps under 0.3 s (a tune); R.bursts = their lengths (board seconds)
  const f = toneNow(S), t = bt(S);
  if (f) { R.tones = (R.tones || 0) + 1; if (R.toneT0 === undefined || t - R.toneT1 > 0.3) R.toneT0 = t; R.toneT1 = t; }
  else if (R.toneT0 !== undefined && t - R.toneT1 > 0.3) { (R.bursts || (R.bursts = [])).push(R.toneT1 - R.toneT0); R.toneT0 = undefined; }
}
const bursts = (S) => S.memRun.bursts || [];
const tunes = (S) => S.memRun.tunes || [];
// the lines [from, to] of a sketch that match two patterns (an info step highlights them)
const lines = (src, a, b) => { const L = src.split('\n'); const i = L.findIndex((x) => a.test(x)); const j = b ? L.findIndex((x, k) => k >= i && b.test(x)) : i; return [i + 1, j + 1]; };
// a step's text worked out from what really happened (read each time the card is drawn)
function live(S0, f) { const o = {}; for (const lg of ['en', 'hi', 'hg']) Object.defineProperty(o, lg, { enumerable: true, get: () => { try { const S = S0.rt; return S ? String(f(lg, S) || '') : ''; } catch (e) { return ''; } } }); return o; }
// LCD rows ever shown this run that match
const lcdSeen = (S, re) => (S.memRun.lcd || []).some((rows) => re.test(rows[0]) || re.test(rows[1]));
const lcdNow = (S, re, tag) => { const r = lcdRows(S, tag); return re.test(r[0]) || re.test(r[1]); };
const lineSeen = (S, re) => S.serLines.some((l) => re.test(l));
const numsIn = (S, re) => S.serLines.map((l) => re.exec(l)).filter(Boolean).map((m) => +m[1]);

// ------------------------------------------------------------------ the sketches (our own, written for this lab)
const SOS = `// Morse code lighthouse: a message in flashes of light and beeps
const int lamp = 9;      // the lamp (LED) on pin 9
const int buzzer = 8;    // the buzzer on pin 8
const int dot = 200;     // a dot lasts 200 ms; a dash is three dots
String message = "SOS";

// Morse code for A to Z: . is a short flash, - is a long one
String code[26] = {".-", "-...", "-.-.", "-..", ".", "..-.", "--.", "....", "..",
                   ".---", "-.-", ".-..", "--", "-.", "---", ".--.", "--.-", ".-.",
                   "...", "-", "..-", "...-", ".--", "-..-", "-.--", "--.."};

void flash(int ms) {
  digitalWrite(lamp, HIGH);
  tone(buzzer, 700);
  delay(ms);
  digitalWrite(lamp, LOW);
  noTone(buzzer);
  delay(dot);            // a short gap inside a letter
}

void setup() {
  pinMode(lamp, OUTPUT);
  Serial.begin(9600);
}

void loop() {
  for (int i = 0; i < message.length(); i++) {
    char letter = message.charAt(i);
    if (letter == ' ') {     // a space between words
      delay(dot * 4);
      continue;
    }
    String signs = code[letter - 'A'];
    Serial.print(letter);
    Serial.print(" ");
    Serial.println(signs);
    for (int k = 0; k < signs.length(); k++) {
      if (signs.charAt(k) == '.') {
        flash(dot);
      } else {
        flash(dot * 3);
      }
    }
    delay(dot * 2);          // a longer gap between letters
  }
  delay(dot * 6);            // then the whole message again
}
`;
const MELODY = `// Music box: press the button to play "Twinkle, twinkle, little star"
const int buzzer = 8;
const int button = 2;
int tempo = 300;             // ms for one beat: a smaller number plays faster

// the notes in hertz: C C G G A A G, F F E E D D C (Sa Sa Pa Pa Dha Dha Pa ...)
int notes[] = {262, 262, 392, 392, 440, 440, 392, 349, 349, 330, 330, 294, 294, 262};
int beats[] = {1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 2};

void setup() {
  pinMode(button, INPUT_PULLUP);
  Serial.begin(9600);
  Serial.println("Press the button to play");
}

void loop() {
  if (digitalRead(button) == LOW) {
    for (int i = 0; i < 14; i++) {
      int ms = tempo * beats[i];
      Serial.println(notes[i]);
      tone(buzzer, notes[i], ms - 40);   // a little silence between notes
      delay(ms);
    }
  }
}
`;
const THEREMIN = `// Light theremin: wave your hand over the LDR to play
const int buzzer = 8;

void setup() {
  Serial.begin(9600);
}

void loop() {
  int light = analogRead(A0);                    // dark: small number, bright: big
  int pitch = map(light, 0, 1023, 120, 1500);    // turn it into a note, 120 to 1500 Hz
  Serial.println(pitch);
  tone(buzzer, pitch);
  delay(20);
}
`;
const RGBTEMP = `// Colour thermometer: blue = cool, green = just right, red = hot
const int R = 9;
const int G = 10;
const int B = 11;

void setColor(int r, int g, int b) {
  analogWrite(R, r);
  analogWrite(G, g);
  analogWrite(B, b);
}

void setup() {
  Serial.begin(9600);
}

void loop() {
  int raw = analogRead(A0);
  float celsius = raw * 5.0 / 1023.0 * 100.0;   // LM35: 10 mV for each degree
  Serial.print(celsius);
  Serial.println(" C");
  if (celsius < 20) {
    setColor(0, 0, 255);          // cool: blue
  } else if (celsius < 32) {
    setColor(0, 255, 0);          // just right: green
  } else {
    setColor(255, 0, 0);          // hot: red
  }
  delay(300);
}
`;
const CROSSING = `// Zebra crossing: the cars stop when someone presses WALK
const int red = 12;
const int yellow = 11;
const int green = 10;
const int button = 2;
const int buzzer = 8;
int walkTime = 5;                     // seconds people get to cross

void setup() {
  pinMode(red, OUTPUT);
  pinMode(yellow, OUTPUT);
  pinMode(green, OUTPUT);
  pinMode(button, INPUT_PULLUP);
  Serial.begin(9600);
}

void loop() {
  digitalWrite(green, HIGH);          // cars may go
  if (digitalRead(button) == LOW) {
    Serial.println("WALK pressed");
    delay(1000);
    digitalWrite(green, LOW);
    digitalWrite(yellow, HIGH);       // cars: get ready to stop
    delay(2000);
    digitalWrite(yellow, LOW);
    digitalWrite(red, HIGH);          // cars stop
    for (int s = walkTime; s > 0; s--) {
      Serial.print("Cross now: ");
      Serial.println(s);
      for (int k = 0; k < 4; k++) {   // quick beeps: safe to cross (for people who cannot see)
        tone(buzzer, 1800, 60);
        delay(250);
      }
    }
    digitalWrite(red, LOW);
  }
}
`;
const QUIZ = `// Quiz buzzer: the team that presses first gets the light
const int buttonA = 2;
const int buttonB = 3;
const int lampA = 12;    // team A: red
const int lampB = 11;    // team B: green
const int buzzer = 8;

void setup() {
  pinMode(buttonA, INPUT_PULLUP);
  pinMode(buttonB, INPUT_PULLUP);
  pinMode(lampA, OUTPUT);
  pinMode(lampB, OUTPUT);
  Serial.begin(9600);
  Serial.println("Ready!");
}

void loop() {
  if (digitalRead(buttonA) == LOW) {
    win(lampA, "Team A");
  } else if (digitalRead(buttonB) == LOW) {
    win(lampB, "Team B");
  }
}

void win(int lamp, String team) {
  digitalWrite(lamp, HIGH);
  Serial.print(team);
  Serial.println(" pressed first!");
  tone(buzzer, 1500, 600);
  delay(5000);           // 5 seconds to answer: the other button does nothing now
  digitalWrite(lamp, LOW);
  Serial.println("Ready!");
}
`;
const REACTION = `// Reaction timer: press the button as soon as the red light comes on
#include <Wire.h>
#include <LiquidCrystal_I2C.h>

LiquidCrystal_I2C lcd(0x27, 16, 2);
const int led = 12;
const int button = 2;

void setup() {
  lcd.init();
  lcd.backlight();
  pinMode(led, OUTPUT);
  pinMode(button, INPUT_PULLUP);
  randomSeed(analogRead(A0));        // a different game every time
}

void loop() {
  lcd.clear();
  lcd.print("Get ready...");
  unsigned long wait = random(2000, 5000);   // a wait you cannot guess
  unsigned long t0 = millis();
  while (millis() - t0 < wait) {             // wait, but watch the button all the time
    if (digitalRead(button) == LOW) {        // pressed before the light: no cheating!
      lcd.clear();
      lcd.print("Too early!");
      delay(2000);
      return;
    }
  }
  digitalWrite(led, HIGH);
  unsigned long start = millis();
  while (digitalRead(button) == HIGH) {
    // wait for the press
  }
  unsigned long ms = millis() - start;
  digitalWrite(led, LOW);
  lcd.clear();
  lcd.print("Your time:");
  lcd.setCursor(0, 1);
  lcd.print(ms);
  lcd.print(" ms");
  delay(3000);
}
`;
const DIGITS_TABLE = `// which segments light for each digit (1 = on), in the order a b c d e f g:
// the first row is the digit 0, the next is 1, and so on to 9
byte digits[10][7] = {
  {1, 1, 1, 1, 1, 1, 0},
  {0, 1, 1, 0, 0, 0, 0},
  {1, 1, 0, 1, 1, 0, 1},
  {1, 1, 1, 1, 0, 0, 1},
  {0, 1, 1, 0, 0, 1, 1},
  {1, 0, 1, 1, 0, 1, 1},
  {1, 0, 1, 1, 1, 1, 1},
  {1, 1, 1, 0, 0, 0, 0},
  {1, 1, 1, 1, 1, 1, 1},
  {1, 1, 1, 1, 0, 1, 1}
};

void show(int n) {
  for (int s = 0; s < 7; s++) {
    digitalWrite(segPins[s], digits[n][s]);
  }
}
`;
const SEGCOUNT = `// Count from 0 to 9 on a 7-segment display
int segPins[] = {2, 3, 4, 5, 6, 7, 8};   // segments a, b, c, d, e, f, g

${DIGITS_TABLE}
void setup() {
  for (int s = 0; s < 7; s++) {
    pinMode(segPins[s], OUTPUT);
  }
  Serial.begin(9600);
}

void loop() {
  for (int n = 0; n <= 9; n++) {
    show(n);
    Serial.println(n);
    delay(1000);
  }
}
`;
const DICE = `// Electronic dice: press the button to roll a number from 1 to 6
int segPins[] = {2, 3, 4, 5, 6, 7, 8};   // segments a, b, c, d, e, f, g
const int button = 9;

${DIGITS_TABLE}
void setup() {
  for (int s = 0; s < 7; s++) {
    pinMode(segPins[s], OUTPUT);
  }
  pinMode(button, INPUT_PULLUP);
  randomSeed(analogRead(A0));
  Serial.begin(9600);
  show(0);
}

void loop() {
  if (digitalRead(button) == LOW) {
    for (int i = 0; i < 12; i++) {      // the dice tumbles, slower and slower
      show(random(1, 7));
      delay(40 + i * 15);
    }
    int roll = random(1, 7);            // 1 to 6 (7 is never chosen)
    show(roll);
    Serial.print("You rolled: ");
    Serial.println(roll);
  }
}
`;
const COUNTDOWN = `// Rocket launch: count down on the display, then lift off!
#include <Servo.h>
Servo launcher;
int segPins[] = {2, 3, 4, 5, 6, 7, 8};   // segments a, b, c, d, e, f, g
const int buzzer = 11;
int start = 9;                           // the count starts here

${DIGITS_TABLE}
void setup() {
  for (int s = 0; s < 7; s++) {
    pinMode(segPins[s], OUTPUT);
  }
  launcher.attach(10);
  launcher.write(0);                     // the rocket waits on its launch pad
  Serial.begin(9600);
  for (int n = start; n >= 0; n--) {
    show(n);
    Serial.println(n);
    tone(buzzer, 880, 100);              // tick
    delay(1000);
  }
  Serial.println("Lift off!");
  tone(buzzer, 1400, 1500);
  launcher.write(90);                    // the launch arm swings up
}

void loop() {
}
`;

const NOTICE = `// School notice board: a title that stays, and a notice that scrolls past
#include <Wire.h>
#include <LiquidCrystal_I2C.h>

LiquidCrystal_I2C lcd(0x27, 16, 2);
String notice = "Sports day on Friday! Bring your water bottle and cap.";

void setup() {
  lcd.init();
  lcd.backlight();
  lcd.setCursor(0, 0);
  lcd.print("DUET School News");      // 16 letters: the whole top line
}

void loop() {
  String text = "                " + notice + "                ";   // 16 spaces before and after
  for (int i = 0; i <= text.length() - 16; i++) {
    lcd.setCursor(0, 1);
    lcd.print(text.substring(i, i + 16));   // a window of 16 letters slides along the text
    delay(250);
  }
}
`;
const DIST = `// Distance meter: the HC-SR04 measures, the LCD shows centimetres and a bar
#include <Wire.h>
#include <LiquidCrystal_I2C.h>

LiquidCrystal_I2C lcd(0x27, 16, 2);
const int trig = 9;
const int echo = 10;
int warn = 10;                       // closer than this (cm): a warning

void setup() {
  lcd.init();
  lcd.backlight();
  pinMode(trig, OUTPUT);
  pinMode(echo, INPUT);
}

void loop() {
  digitalWrite(trig, LOW);
  delayMicroseconds(2);
  digitalWrite(trig, HIGH);          // a 10 µs pulse: send a burst of sound
  delayMicroseconds(10);
  digitalWrite(trig, LOW);
  long us = pulseIn(echo, HIGH, 30000);   // no echo in 30 ms: nothing in front
  int cm = us * 0.034 / 2;
  lcd.clear();
  lcd.print("Distance: ");
  lcd.print(cm);
  lcd.print(" cm");
  lcd.setCursor(0, 1);
  if (cm > 0 && cm < warn) {
    lcd.print("TOO CLOSE!");
  } else {
    int blocks = constrain(cm / 10, 0, 16);   // one # for every 10 cm
    for (int i = 0; i < blocks; i++) {
      lcd.print("#");
    }
  }
  delay(300);
}
`;
const SPEED = `// Speed gun: a toy car passes gate 1, then gate 2, 10 cm further on
#include <Wire.h>
#include <LiquidCrystal_I2C.h>

LiquidCrystal_I2C lcd(0x27, 16, 2);
const int gate1 = 2;          // IR sensors: LOW when something is in front
const int gate2 = 3;
float gap = 10.0;             // cm between the two gates

void setup() {
  lcd.init();
  lcd.backlight();
  pinMode(gate1, INPUT);
  pinMode(gate2, INPUT);
  Serial.begin(9600);
  lcd.print("Speed gun ready");
}

void loop() {
  if (digitalRead(gate1) == LOW) {          // the car reaches gate 1
    unsigned long t1 = millis();
    while (digitalRead(gate2) == HIGH) {     // wait until it reaches gate 2
    }
    unsigned long t2 = millis();
    float seconds = (t2 - t1) / 1000.0;
    float speed = gap / seconds;             // speed = distance / time
    lcd.clear();
    lcd.print("Time: ");
    lcd.print(t2 - t1);
    lcd.print(" ms");
    lcd.setCursor(0, 1);
    lcd.print("Speed: ");
    lcd.print(speed, 1);
    lcd.print(" cm/s");
    Serial.print(speed);
    Serial.println(" cm/s");
    delay(1500);
  }
}
`;
const VISITORS = `// Classroom visitor counter: one sensor at the IN door, one at the OUT door
#include <Wire.h>
#include <LiquidCrystal_I2C.h>

LiquidCrystal_I2C lcd(0x27, 16, 2);
const int doorIn = 2;         // IR sensors: LOW when someone is in front
const int doorOut = 3;
const int fullLamp = 12;
int people = 0;
int limit = 5;                // the room is full at this number

void show() {
  lcd.clear();
  lcd.print("In the room: ");
  lcd.print(people);
  lcd.setCursor(0, 1);
  if (people >= limit) {
    lcd.print("ROOM FULL!");
    digitalWrite(fullLamp, HIGH);
  } else {
    lcd.print("Welcome");
    digitalWrite(fullLamp, LOW);
  }
}

void setup() {
  lcd.init();
  lcd.backlight();
  pinMode(doorIn, INPUT);
  pinMode(doorOut, INPUT);
  pinMode(fullLamp, OUTPUT);
  show();
}

void loop() {
  if (digitalRead(doorIn) == LOW) {          // someone walks in
    people++;
    show();
    while (digitalRead(doorIn) == LOW) {     // count each person once
    }
    delay(200);
  }
  if (digitalRead(doorOut) == LOW && people > 0) {   // someone walks out
    people--;
    show();
    while (digitalRead(doorOut) == LOW) {
    }
    delay(200);
  }
}
`;
const RADAR = `// Radar: the servo turns the sensor, the OLED draws what it finds
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <Servo.h>

Adafruit_SSD1306 display(128, 64, &Wire, -1);
Servo turret;
const int trig = 9;
const int echo = 10;
int range = 50;              // cm at the edge of the screen
int seen[19];                // what was seen at 0, 10, 20 … 180 degrees (0 = nothing)
int angle = 0;
int stepBy = 10;

int measure() {
  digitalWrite(trig, LOW);
  delayMicroseconds(2);
  digitalWrite(trig, HIGH);
  delayMicroseconds(10);
  digitalWrite(trig, LOW);
  long us = pulseIn(echo, HIGH, 30000);
  return us * 0.034 / 2;
}

void draw() {
  display.clearDisplay();
  display.drawCircle(64, 63, 60, SSD1306_WHITE);   // the edge: "range" cm away
  display.drawCircle(64, 63, 30, SSD1306_WHITE);   // half way
  float a = angle * 3.1416 / 180;
  display.drawLine(64, 63, 64 + 60 * cos(a), 63 - 60 * sin(a), SSD1306_WHITE);   // the sweep
  for (int i = 0; i <= 18; i++) {
    if (seen[i] > 0 && seen[i] < range) {
      float b = i * 10 * 3.1416 / 180;
      int r = seen[i] * 60 / range;
      display.fillCircle(64 + r * cos(b), 63 - r * sin(b), 2, SSD1306_WHITE);   // something is there!
    }
  }
  display.display();
}

void setup() {
  display.begin(SSD1306_SWITCHCAPVCC, 0x3C);
  turret.attach(6);
  pinMode(trig, OUTPUT);
  pinMode(echo, INPUT);
  Serial.begin(9600);
}

void loop() {
  turret.write(angle);
  delay(120);                          // let the servo get there
  seen[angle / 10] = measure();
  draw();
  Serial.print(angle);
  Serial.print(" deg: ");
  Serial.print(seen[angle / 10]);
  Serial.println(" cm");
  angle = angle + stepBy;
  if (angle >= 180 || angle <= 0) {    // at either end: turn back
    stepBy = -stepBy;
  }
}
`;
const SKETCH = `// Etch-a-sketch: the joystick moves a pen on the OLED; press the stick to wipe the screen
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

Adafruit_SSD1306 display(128, 64, &Wire, -1);
const int button = 2;     // the stick's own switch: LOW when pressed
int x = 64;               // the pen starts in the middle
int y = 32;

void setup() {
  display.begin(SSD1306_SWITCHCAPVCC, 0x3C);
  display.clearDisplay();
  display.display();
  pinMode(button, INPUT_PULLUP);
}

void loop() {
  int jx = analogRead(A0);   // left 0 … right 1023
  int jy = analogRead(A1);   // down 0 … up 1023
  if (jx > 700) x++;
  if (jx < 300) x--;
  if (jy > 700) y--;         // up on the stick = up on the screen (smaller y)
  if (jy < 300) y++;
  x = constrain(x, 0, 127);
  y = constrain(y, 0, 63);
  display.drawPixel(x, y, SSD1306_WHITE);
  if (digitalRead(button) == LOW) {
    display.clearDisplay();
  }
  display.display();
  delay(20);
}
`;
const CALC = `// Pocket calculator: A = plus, B = minus, C = times, D = divide, # = equals, * = clear
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <Keypad.h>

LiquidCrystal_I2C lcd(0x27, 16, 2);
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

long first = 0;       // the number before the sign
char sign = ' ';      // + - x or /
String typed = "";    // the number you are typing now
String line = "";     // everything typed, for the top line

long calculate(long a, char s, long b) {
  if (s == '+') return a + b;
  if (s == '-') return a - b;
  if (s == 'x') return a * b;
  if (s == '/') return a / b;
  return b;            // no sign: just the number
}

void setup() {
  lcd.init();
  lcd.backlight();
  lcd.print("Calculator");
}

void loop() {
  char key = keypad.getKey();
  if (!key) return;                 // no key pressed: nothing to do
  if (key >= '0' && key <= '9') {   // a digit
    typed += key;
    line += key;
  } else if (key == '*') {          // clear everything
    first = 0;
    sign = ' ';
    typed = "";
    line = "";
  } else if (key == '#') {          // equals
    long second = typed.toInt();
    lcd.setCursor(0, 1);
    if (sign == '/' && second == 0) {
      lcd.print("Error: / by 0");
    } else {
      lcd.print("= ");
      lcd.print(calculate(first, sign, second));
    }
    first = 0;
    sign = ' ';
    typed = "";
    line = "";
    return;                         // keep the answer on the screen
  } else {                          // A, B, C or D: a sign
    first = typed.toInt();
    typed = "";
    if (key == 'A') sign = '+';
    if (key == 'B') sign = '-';
    if (key == 'C') sign = 'x';
    if (key == 'D') sign = '/';
    line += sign;
  }
  lcd.clear();
  lcd.print(line);
}
`;
const MATHQUIZ = `// Times-table quiz: type the answer on the keypad, # to check, * to type again
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <Keypad.h>

LiquidCrystal_I2C lcd(0x27, 16, 2);
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

const int buzzer = 10;
int a = 0;            // the question is a x b
int b = 0;
int score = 0;
String typed = "";

void newQuestion() {
  a = random(2, 10);
  b = random(2, 10);
  typed = "";
  lcd.clear();
  lcd.print(a);
  lcd.print(" x ");
  lcd.print(b);
  lcd.print(" = ?");
  lcd.setCursor(0, 1);
  lcd.print("Score: ");
  lcd.print(score);
}

void setup() {
  lcd.init();
  lcd.backlight();
  randomSeed(analogRead(A0));
  newQuestion();
}

void loop() {
  char key = keypad.getKey();
  if (!key) return;
  if (key >= '0' && key <= '9' && typed.length() < 3) {
    typed += key;
    lcd.setCursor(0, 1);
    lcd.print("Answer: ");
    lcd.print(typed);
    lcd.print("    ");
  } else if (key == '*') {
    typed = "";
    lcd.setCursor(0, 1);
    lcd.print("Answer:         ");
  } else if (key == '#') {
    lcd.clear();
    if (typed.toInt() == a * b) {
      score++;
      lcd.print("Correct!");
      tone(buzzer, 1800, 300);      // a happy high beep
    } else {
      lcd.print("Oops: ");
      lcd.print(a);
      lcd.print(" x ");
      lcd.print(b);
      lcd.print(" = ");
      lcd.print(a * b);
      tone(buzzer, 300, 600);       // a low beep
    }
    delay(2000);
    newQuestion();
  }
}
`;
const BELL = `// Automatic school bell: a fast clock and the day's timetable
#include <Wire.h>
#include <LiquidCrystal_I2C.h>

LiquidCrystal_I2C lcd(0x27, 16, 2);
const int bell = 8;                // an active buzzer: HIGH = it rings by itself
int hour = 7;
int minute = 55;                   // the clock starts at 7:55 in the morning
int bells[] = {800, 820, 900, 940, 1020, 1040, 1120};   // the times, as hhmm
const int minuteMs = 100;          // a fast clock: one minute of school = 0.1 s here

void setup() {
  lcd.init();
  lcd.backlight();
  pinMode(bell, OUTPUT);
  Serial.begin(9600);
}

void loop() {
  int now = hour * 100 + minute;   // 9:20 becomes 920
  lcd.setCursor(0, 0);
  lcd.print("Time ");
  if (hour < 10) lcd.print("0");
  lcd.print(hour);
  lcd.print(":");
  if (minute < 10) lcd.print("0");
  lcd.print(minute);
  for (int i = 0; i < sizeof(bells) / sizeof(bells[0]); i++) {
    if (bells[i] == now) {
      lcd.setCursor(0, 1);
      lcd.print("RING! Bell ");
      lcd.print(i + 1);
      Serial.print("Bell at ");
      Serial.println(now);
      digitalWrite(bell, HIGH);
      delay(1500);
      digitalWrite(bell, LOW);
      lcd.setCursor(0, 1);
      lcd.print("                ");
    }
  }
  delay(minuteMs);
  minute++;
  if (minute == 60) {
    minute = 0;
    hour++;
  }
}
`;
const LIGHTMETER = `// Light meter: is your study desk bright enough to read?
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

Adafruit_SSD1306 display(128, 64, &Wire, -1);
int dim = 40;          // below this % the light is too low for reading

void setup() {
  display.begin(SSD1306_SWITCHCAPVCC, 0x3C);
  display.setTextColor(SSD1306_WHITE);
  Serial.begin(9600);
}

void loop() {
  int raw = analogRead(A0);
  int percent = map(raw, 0, 1023, 0, 100);
  display.clearDisplay();
  display.setTextSize(1);
  display.setCursor(0, 0);
  display.print("Light meter");
  display.setTextSize(3);
  display.setCursor(0, 18);
  display.print(percent);
  display.print("%");
  display.setTextSize(1);
  display.setCursor(80, 26);
  if (percent < dim) {
    display.print("Too dark");
  } else {
    display.print("Good");
  }
  display.drawRect(0, 52, 128, 12, SSD1306_WHITE);
  display.fillRect(0, 52, percent * 128 / 100, 12, SSD1306_WHITE);   // the bar
  display.display();
  Serial.println(percent);
  delay(200);
}
`;

const CORRIDOR = `// Corridor light: on only at night, and only when someone walks by
const int pir = 2;                 // HIGH when something warm moves
const int relay = 7;               // HIGH = the relay switches the lamp on
int darkLevel = 300;               // below this the corridor is dark
unsigned long onTime = 10000;      // ms the lamp stays on after the last movement
unsigned long lastSeen = 0;
bool lampOn = false;

void setup() {
  pinMode(pir, INPUT);
  pinMode(relay, OUTPUT);
  Serial.begin(9600);
}

void loop() {
  int light = analogRead(A0);
  bool someone = digitalRead(pir) == HIGH;
  if (someone && light < darkLevel) {      // dark AND someone there: both must be true
    lastSeen = millis();
    if (!lampOn) {
      Serial.println("Lamp ON");
    }
    lampOn = true;
  }
  if (lampOn && millis() - lastSeen > onTime) {
    lampOn = false;
    Serial.println("Lamp OFF");
  }
  digitalWrite(relay, lampOn ? HIGH : LOW);
  delay(100);
}
`;
const AUTOFAN = `// Automatic fan: the relay switches the ceiling fan on above 30 °C and off below 28 °C
const int relay = 8;
float onAt = 30.0;       // switch the fan on above this
float offAt = 28.0;      // and off below this: a gap, so it does not click on and off
bool fanOn = false;

void setup() {
  pinMode(relay, OUTPUT);
  Serial.begin(9600);
}

void loop() {
  float celsius = analogRead(A0) * 5.0 / 1023.0 * 100.0;   // LM35: 10 mV for each degree
  if (!fanOn && celsius > onAt) {
    fanOn = true;
  }
  if (fanOn && celsius < offAt) {
    fanOn = false;
  }
  digitalWrite(relay, fanOn ? HIGH : LOW);
  Serial.print(celsius);
  Serial.print(" C, fan ");
  Serial.println(fanOn ? "ON" : "OFF");
  delay(500);
}
`;
const STAIR = `// Staircase light: press the button, the light stays on for a while, the LCD counts down
#include <Wire.h>
#include <LiquidCrystal_I2C.h>

LiquidCrystal_I2C lcd(0x27, 16, 2);
const int button = 2;
const int relay = 7;
int onTime = 10;          // seconds the light stays on
int left = 0;             // seconds still to go

void setup() {
  lcd.init();
  lcd.backlight();
  pinMode(button, INPUT_PULLUP);
  pinMode(relay, OUTPUT);
}

void loop() {
  if (digitalRead(button) == LOW) {
    left = onTime;                  // pressing again starts the time again
  }
  if (left > 0) {
    digitalWrite(relay, HIGH);
    lcd.setCursor(0, 0);
    lcd.print("Light ON        ");
    lcd.setCursor(0, 1);
    lcd.print("Off in ");
    lcd.print(left);
    lcd.print(" s        ");       // spaces wipe what the line said before
    delay(1000);
    left--;
  } else {
    digitalWrite(relay, LOW);
    lcd.setCursor(0, 0);
    lcd.print("Light OFF       ");
    lcd.setCursor(0, 1);
    lcd.print("Press the button");
  }
}
`;
const SANITIZER = `// No-touch sanitizer: a hand under the nozzle runs the pump for one dose
const int sensor = 7;        // IR sensor: LOW when a hand is in front
const int pump = 8;          // the relay that switches the pump's battery
int dose = 500;              // ms of pumping for one dose
int doses = 0;

void setup() {
  pinMode(sensor, INPUT);
  pinMode(pump, OUTPUT);
  Serial.begin(9600);
}

void loop() {
  if (digitalRead(sensor) == LOW) {
    digitalWrite(pump, HIGH);
    delay(dose);
    digitalWrite(pump, LOW);
    doses++;
    Serial.print("Doses: ");
    Serial.println(doses);
    while (digitalRead(sensor) == LOW) {   // one dose for each hand: wait until it goes away
      delay(50);
    }
    delay(500);
  }
}
`;
const REMOTEFAN = `// Fan regulator: the TV remote's 1, 2, 3 set the fan's speed, 0 stops it
#include <IRremote.hpp>
const int fan = 9;           // to the transistor's base, through 1 kΩ

void setup() {
  pinMode(fan, OUTPUT);
  Serial.begin(9600);
  IrReceiver.begin(11);      // the receiver's OUT is on pin 11
  Serial.println("Fan regulator ready");
}

void loop() {
  if (IrReceiver.decode()) {
    int code = IrReceiver.decodedIRData.command;
    IrReceiver.resume();
    int speed = -1;
    switch (code) {
      case 25: speed = 0; break;      // button 0: off
      case 69: speed = 90; break;     // button 1: slow
      case 70: speed = 160; break;    // button 2: medium
      case 71: speed = 255; break;    // button 3: full speed
    }
    if (speed >= 0) {
      analogWrite(fan, speed);
      Serial.print("Speed: ");
      Serial.println(speed);
    } else {
      Serial.print("Button code: ");
      Serial.println(code);
    }
  }
}
`;
const RAILGATE = `// Railway level crossing: a train comes, the boom comes down, the red lamps flash
#include <Servo.h>
Servo boom;
const int sensor = 7;        // LOW: a train is in front of the sensor
const int lampL = 12;
const int lampR = 11;
const int bell = 8;
int up = 90;                 // boom up: the road is open
int down = 0;                // boom down: the road is closed

void setup() {
  boom.attach(10);
  boom.write(up);
  pinMode(sensor, INPUT);
  pinMode(lampL, OUTPUT);
  pinMode(lampR, OUTPUT);
  Serial.begin(9600);
}

void loop() {
  if (digitalRead(sensor) == LOW) {
    Serial.println("Train! Boom down");
    boom.write(down);
    while (digitalRead(sensor) == LOW) {   // flash the lamps in turn while the train passes
      digitalWrite(lampL, HIGH);
      digitalWrite(lampR, LOW);
      tone(bell, 1200, 150);
      delay(400);
      digitalWrite(lampL, LOW);
      digitalWrite(lampR, HIGH);
      delay(400);
    }
    delay(2000);                            // wait until the last wagon has gone
    digitalWrite(lampR, LOW);
    boom.write(up);
    Serial.println("Road open");
  }
}
`;
const BLINDS = `// Automatic blinds: they open in the morning light and close at night
#include <Stepper.h>
Stepper motor(2048, 8, 10, 9, 11);    // 28BYJ-48 on IN1, IN3, IN2, IN4
bool isOpen = false;
int morning = 600;    // brighter than this: open
int night = 300;      // darker than this: close

void setup() {
  motor.setSpeed(12);                 // 12 turns a minute
  Serial.begin(9600);
}

void loop() {
  int light = analogRead(A0);
  Serial.println(light);
  if (!isOpen && light > morning) {
    Serial.println("Good morning: opening");
    motor.step(1024);                 // half a turn rolls the blind up
    isOpen = true;
  }
  if (isOpen && light < night) {
    Serial.println("Good night: closing");
    motor.step(-1024);                // half a turn back rolls it down
    isOpen = false;
  }
  delay(500);
}
`;
const JSDRIVE = `// Joystick drive: push forward to go, sideways to turn (test a robot with its wheels in the air)
const int ENA = 5;     // left motor: speed
const int IN1 = 7;     // left motor: direction
const int IN2 = 8;
const int ENB = 6;     // right motor: speed
const int IN3 = 2;     // right motor: direction
const int IN4 = 4;

void motor(int en, int a, int b, int speed) {   // speed from -255 (back) to 255 (forward)
  if (speed >= 0) {
    digitalWrite(a, HIGH);
    digitalWrite(b, LOW);
  } else {
    digitalWrite(a, LOW);
    digitalWrite(b, HIGH);
  }
  analogWrite(en, min(abs(speed), 255));
}

void setup() {
  pinMode(ENA, OUTPUT);
  pinMode(IN1, OUTPUT);
  pinMode(IN2, OUTPUT);
  pinMode(ENB, OUTPUT);
  pinMode(IN3, OUTPUT);
  pinMode(IN4, OUTPUT);
  Serial.begin(9600);
}

void loop() {
  int y = analogRead(A1) - 512;      // forward +, back -
  int x = analogRead(A0) - 512;      // right +, left -
  if (abs(y) < 60) y = 0;            // a small dead zone in the middle
  if (abs(x) < 60) x = 0;
  int left = constrain(y + x, -255, 255);
  int right = constrain(y - x, -255, 255);
  motor(ENA, IN1, IN2, left);
  motor(ENB, IN3, IN4, right);
  Serial.print(left);
  Serial.print(" ");
  Serial.println(right);
  delay(50);
}
`;
const CHASER = `// Light chaser: one light runs along the bar and back; the knob sets its speed
int leds[] = {22, 23, 24, 25, 26, 27, 28, 29, 30, 31};

void light(int k, int wait) {
  digitalWrite(leds[k], HIGH);
  delay(wait);
  digitalWrite(leds[k], LOW);
}

void setup() {
  for (int i = 0; i < 10; i++) {
    pinMode(leds[i], OUTPUT);
  }
  Serial.begin(9600);
}

void loop() {
  int wait = map(analogRead(A0), 0, 1023, 20, 300);   // knob down: fast, knob up: slow
  Serial.println(wait);
  for (int k = 0; k < 10; k++) {    // to the right
    light(k, wait);
  }
  for (int k = 8; k > 0; k--) {     // and back
    light(k, wait);
  }
}
`;
const ESPALARM = `// ESP32 motion alarm: the PIR sees someone, the LED and the buzzer warn, the Serial Monitor counts
const int pir = 27;
const int led = 25;
const int buzzer = 26;       // an active buzzer: HIGH = beep
int visitors = 0;
bool wasMoving = false;

void setup() {
  pinMode(pir, INPUT);
  pinMode(led, OUTPUT);
  pinMode(buzzer, OUTPUT);
  Serial.begin(115200);
  Serial.println("PIR warming up...");
  delay(3000);                       // a PIR is HIGH for a moment while it learns the room: not a visitor
  Serial.println("Alarm ready");
}

void loop() {
  bool moving = digitalRead(pir) == HIGH;
  if (moving && !wasMoving) {        // it has only just started: count one visitor
    visitors++;
    Serial.print("Motion! Visitors: ");
    Serial.println(visitors);
  }
  wasMoving = moving;
  digitalWrite(led, moving ? HIGH : LOW);
  digitalWrite(buzzer, moving ? HIGH : LOW);
  delay(100);
}
`;

export function batch7(K, n0) {
  const { t3, P: PL, F, W, need, has, noShort, N, unit, LEDU, merge } = K;
  const S0 = {}; // the lesson runner, for live texts (set by the app: batch7.rt)
  let n = n0;
  // ---------------------------------------------------------------- words several lessons use
  const X = {
    btnSame: t3('Both button wires are on legs that are always joined (the same side of the button): the pin always reads "pressed". Put one wire on each side of the gap the button jumps.',
      'बटन के दोनों तार उन पैरों पर हैं जो हमेशा जुड़े रहते हैं (बटन की एक ही तरफ़): पिन हमेशा "दबा हुआ" पढ़ेगा। एक तार बटन के एक ओर और दूसरा दूसरी ओर लगाइए।',
      'Button ke dono wire un pairon par hain jo hamesha jude rehte hain (button ki ek hi taraf): pin hamesha "daba hua" padhega. Ek wire button ke ek taraf aur doosra doosri taraf lagaiye.'),
    lcd33: t3('The LCD\'s VCC is on 3.3 V: its backlight and letters need 5 V. Move VCC to the + rail (5V).', 'एलसीडी का VCC 3.3 V पर है: इसकी बैकलाइट और अक्षरों को 5 V चाहिए। VCC को + रेल (5V) पर लगाइए।', 'LCD ka VCC 3.3 V par hai: iski backlight aur letters ko 5 V chahiye. VCC ko + rail (5V) par lagaiye.'),
    i2c: t3('{a} must go to {b}: on the Uno, A4 is SDA and A5 is SCL, the two I2C wires.', '{a} को {b} से जोड़िए: Uno पर A4 ही SDA है और A5 ही SCL, यही दो I2C तार हैं।', '{a} ko {b} se jodiye: Uno par A4 hi SDA hai aur A5 hi SCL, yahi do I2C wires hain.'),
    i2cSwap: t3('SDA and SCL are swapped. SDA (data) goes to A4, SCL (clock) to A5; swapped, the screen stays blank.', 'SDA और SCL उल्टे लगे हैं। SDA (डेटा) A4 पर, SCL (क्लॉक) A5 पर; उल्टे लगे तो स्क्रीन ख़ाली रहेगी।', 'SDA aur SCL ulte lage hain. SDA (data) A4 par, SCL (clock) A5 par; ulte lage to screen khaali rahegi.'),
    frontRails: t3('The front rails are not powered: join the back + rail to the front + rail and − to −.', 'आगे वाली रेलों को बिजली नहीं मिल रही: पीछे की + रेल को आगे की + रेल से और − को − से जोड़िए।', 'Aage wali rails ko power nahi mil rahi: peeche ki + rail ko aage ki + rail se aur − ko − se jodiye.'),
    ldrSwap: t3('The LDR and the 10 kΩ resistor are swapped: the LDR must go from 5V to A0, and the resistor from A0 to GND. Swapped, the numbers go the wrong way: bright reads small.', 'एलडीआर और 10 kΩ रेज़िस्टर की जगह उलट गई है: एलडीआर 5V से A0 तक, और रेज़िस्टर A0 से GND तक लगना चाहिए। उलटे हों तो संख्याएँ उल्टी चलती हैं: तेज़ रोशनी में छोटी संख्या।', 'LDR aur 10 kΩ resistor ki jagah ulat gayi hai: LDR 5V se A0 tak, aur resistor A0 se GND tak lagna chahiye. Ulte hon to numbers ulte chalte hain: tez roshni mein chhota number.'),
    ldrPath: t3('The light sensor is a divider: 5V → LDR → A0 → 10 kΩ → GND. One of its three joins is missing.', 'रोशनी सेंसर एक डिवाइडर है: 5V → एलडीआर → A0 → 10 kΩ → GND। इसके तीन जोड़ों में से एक नहीं है।', 'Roshni sensor ek divider hai: 5V → LDR → A0 → 10 kΩ → GND. Iske teen jodon mein se ek nahi hai.'),
    lmRev: t3('The LM35 is the wrong way round: its flat side faces you, the left leg (+Vs) goes to 5V and the right leg to GND. Turned round, a real LM35 gets hot and reads nonsense.', 'LM35 उल्टा लगा है: इसकी चपटी तरफ़ आपकी ओर रहे, बायाँ पैर (+Vs) 5V पर और दायाँ पैर GND पर। उल्टा लगा असली LM35 गर्म होकर ग़लत पढ़ता है।', 'LM35 ulta laga hai: iski flat side aapki taraf rahe, left pair (+Vs) 5V par aur right pair GND par. Ulta laga asli LM35 garam hokar galat padhta hai.'),
    rgbK: t3('The RGB LED\'s longest leg (the common −) must go to GND. On 5V nothing can light: all three LEDs would point the wrong way.', 'RGB एलईडी का सबसे लंबा पैर (कॉमन −) GND पर जाना चाहिए। 5V पर कुछ नहीं जलेगा: तीनों एलईडी उल्टी दिशा में होंगी।', 'RGB LED ka sabse lamba pair (common −) GND par jaana chahiye. 5V par kuch nahi jalega: teeno LED ulti disha mein hongi.'),
    segCom5: t3('The display\'s COM is on 5V. This is a common-cathode display: COM is the − of every segment and goes to GND (the − rail).', 'डिस्प्ले का COM 5V पर है। यह कॉमन-कैथोड डिस्प्ले है: COM हर सेगमेंट का − है और GND (− रेल) पर जाता है।', 'Display ka COM 5V par hai. Yeh common-cathode display hai: COM har segment ka − hai aur GND (− rail) par jaata hai.'),
    segCom: t3('The display\'s COM pin (the middle pin of a row) must go to GND (the front − rail).', 'डिस्प्ले का COM पिन (किसी कतार का बीच वाला पिन) GND (आगे वाली − रेल) पर जाना चाहिए।', 'Display ka COM pin (kisi line ka beech wala pin) GND (aage wali − rail) par jaana chahiye.'),
    segNoRes: t3('Segment {s} is wired straight to pin {p} with no resistor: too much current, it will burn. Wire the pin to the far end of segment {s}\'s resistor.', 'सेगमेंट {s} बिना रेज़िस्टर के सीधे पिन {p} से जुड़ा है: बहुत ज़्यादा करंट, यह जल जाएगा। पिन को सेगमेंट {s} के रेज़िस्टर के दूसरे सिरे से जोड़िए।', 'Segment {s} bina resistor ke seedhe pin {p} se juda hai: bahut zyada current, yeh jal jaayega. Pin ko segment {s} ke resistor ke doosre sire se jodiye.'),
    seg: t3('Segment {s} must be wired from pin {p} through its resistor.', 'सेगमेंट {s} पिन {p} से अपने रेज़िस्टर से होकर जुड़ना चाहिए।', 'Segment {s} pin {p} se apne resistor se hokar judna chahiye.'),
    servo33: t3('The servo\'s red wire is on 3.3 V: too weak, its motor will not turn. It needs 5 V (the + rail).', 'सर्वो का लाल तार 3.3 V पर है: बहुत कमज़ोर, इसकी मोटर नहीं घूमेगी। इसे 5 V (+ रेल) चाहिए।', 'Servo ka laal wire 3.3 V par hai: bahut kamzor, iski motor nahi ghoomegi. Ise 5 V (+ rail) chahiye.'),
    servoGnd: t3('The servo\'s brown wire must go to GND (the − rail).', 'सर्वो का भूरा तार GND (− रेल) पर जाना चाहिए।', 'Servo ka bhoora wire GND (− rail) par jaana chahiye.'),
    servo5: t3('The servo\'s red wire must go to 5V (the + rail).', 'सर्वो का लाल तार 5V (+ रेल) पर जाना चाहिए।', 'Servo ka laal wire 5V (+ rail) par jaana chahiye.'),
    trigEcho: t3('Trig and Echo are swapped: Trig goes to pin {t} and Echo to pin {e}. Swapped, the sensor is never started, so no echo comes back: 0 cm.', 'Trig और Echo उल्टे लगे हैं: Trig पिन {t} पर और Echo पिन {e} पर जाता है। उल्टे लगे तो सेंसर कभी शुरू नहीं होता और कोई गूँज नहीं लौटती: 0 cm।', 'Trig aur Echo ulte lage hain: Trig pin {t} par aur Echo pin {e} par jaata hai. Ulte lage to sensor kabhi shuru nahi hota aur koi echo nahi lautti: 0 cm.'),
    oledI2c: t3('The OLED\'s {a} must go to {b} (on the Uno, A4 = SDA, A5 = SCL).', 'OLED का {a}, {b} से जुड़ना चाहिए (Uno पर A4 = SDA, A5 = SCL)।', 'OLED ka {a}, {b} se judna chahiye (Uno par A4 = SDA, A5 = SCL).'),
    kpOrder: t3('The keypad\'s 8 wires go in order: R1–R4 to pins 9, 8, 7, 6 and C1–C4 to pins 5, 4, 3, 2. Out of order, the keys come out wrong.', 'कीपैड के 8 तार क्रम से: R1–R4 पिन 9, 8, 7, 6 पर और C1–C4 पिन 5, 4, 3, 2 पर। क्रम बिगड़ा तो बटन ग़लत आएँगे।', 'Keypad ke 8 wire kram se: R1–R4 pin 9, 8, 7, 6 par aur C1–C4 pin 5, 4, 3, 2 par. Kram bigda to buttons galat aayenge.'),
    abuzzRev: t3('The active buzzer is the wrong way round: its long leg (+) goes to the pin and the short leg (−) to GND. Turned round, it stays silent.', 'एक्टिव बज़र उल्टा लगा है: इसका लंबा पैर (+) पिन पर और छोटा पैर (−) GND पर जाता है। उल्टा लगा हो तो यह चुप रहता है।', 'Active buzzer ulta laga hai: iska lamba pair (+) pin par aur chhota pair (−) GND par jaata hai. Ulta laga ho to yeh chup rehta hai.'),
    pir33: t3('The PIR\'s VCC is on 3.3 V. It needs 5 V (it makes its own 3.3 V inside); on 3.3 V it never wakes up.', 'पीआईआर का VCC 3.3 V पर है। इसे 5 V चाहिए (यह अंदर अपना 3.3 V ख़ुद बनाता है); 3.3 V पर यह कभी नहीं जागता।', 'PIR ka VCC 3.3 V par hai. Ise 5 V chahiye (yeh andar apna 3.3 V khud banata hai); 3.3 V par yeh kabhi nahi jaagta.'),
    relay33: t3('The relay\'s + is on 3.3 V: its coil needs 5 V to pull the contact over. It will not click.', 'रिले का + 3.3 V पर है: इसकी कॉइल को कॉन्टैक्ट खींचने के लिए 5 V चाहिए। यह क्लिक नहीं करेगा।', 'Relay ka + 3.3 V par hai: iski coil ko contact kheenchne ke liye 5 V chahiye. Yeh click nahi karega.'),
    mains: t3('The 230 V box\'s wires belong in the relay\'s COM and NO. Ask your teacher: never move mains wires yourself.', '230 V डिब्बे के तार रिले के COM और NO में ही रहने चाहिए। टीचर से पूछिए: मेन्स के तार ख़ुद कभी मत हिलाइए।', '230 V dabbe ke wire relay ke COM aur NO mein hi rehne chahiye. Teacher se poochiye: mains ke wire khud kabhi mat hilaiye.'),
    mainsDanger: t3('DANGER: a 230 V wire is joined to the Arduino\'s side! Remove that wire at once. Mains and 5 V must never meet.', 'ख़तरा: 230 V का तार Arduino वाली तरफ़ से जुड़ गया है! वह तार तुरंत हटाइए। मेन्स और 5 V कभी नहीं मिलने चाहिए।', 'Khatra: 230 V ka wire Arduino wali taraf se jud gaya hai! Woh wire turant hataiye. Mains aur 5 V kabhi nahi milne chahiye.'),
    pumpNC: t3('The pump is on the relay\'s NC (normally closed): it would run all the time and stop only when a hand comes. Move that wire to NO (normally open).', 'पंप रिले के NC (सामान्य रूप से बंद) पर है: यह हर समय चलेगा और सिर्फ़ हाथ आने पर रुकेगा। वह तार NO (सामान्य रूप से खुला) पर लगाइए।', 'Pump relay ke NC (normally closed) par hai: yeh har samay chalega aur sirf haath aane par rukega. Woh wire NO (normally open) par lagaiye.'),
    pumpPath: t3('The pump\'s loop: battery + → relay COM, relay NO → pump red, pump black → battery −.', 'पंप का लूप: बैटरी + → रिले COM, रिले NO → पंप लाल, पंप काला → बैटरी −।', 'Pump ka loop: battery + → relay COM, relay NO → pump red, pump black → battery −.'),
    pumpArduino: t3('The pump is joined to the Arduino\'s 5V or GND: its 200 mA must come from its own battery, through the relay.', 'पंप Arduino के 5V या GND से जुड़ा है: इसके 200 mA इसकी अपनी बैटरी से, रिले से होकर आने चाहिए।', 'Pump Arduino ke 5V ya GND se juda hai: iske 200 mA iski apni battery se, relay se hokar aane chahiye.'),
    irRev: t3('The IR receiver is wired the wrong way: its left leg is OUT (to pin {p}), the middle GND, the right VCC (5V). Turned round it has no power and hears nothing.', 'आईआर रिसीवर उल्टा जुड़ा है: इसका बायाँ पैर OUT (पिन {p} पर), बीच वाला GND, दायाँ VCC (5V)। उल्टा हो तो इसे बिजली नहीं मिलती और यह कुछ नहीं सुनता।', 'IR receiver ulta juda hai: iska left pair OUT (pin {p} par), beech wala GND, right VCC (5V). Ulta ho to ise power nahi milti aur yeh kuch nahi sunta.'),
    noDiode: t3('Put the diode across the motor, its grey band towards + (5V): when the motor stops it kicks back a high voltage that can kill the transistor.', 'डायोड को मोटर के आर-पार लगाइए, इसकी स्लेटी पट्टी + (5V) की ओर: मोटर रुकते समय एक ऊँचा वोल्टेज का झटका देती है जो ट्रांज़िस्टर को ख़राब कर सकता है।', 'Diode ko motor ke aar-paar lagaiye, iski grey band + (5V) ki taraf: motor rukte waqt ek ooncha voltage ka jhatka deti hai jo transistor ko kharab kar sakta hai.'),
    steps: t3('IN1–IN4 go to pins 8, 9, 10, 11 in order: IN1 to 8, IN2 to 9, IN3 to 10, IN4 to 11. Out of order, the motor only shakes.', 'IN1–IN4 क्रम से पिन 8, 9, 10, 11 पर: IN1 को 8, IN2 को 9, IN3 को 10, IN4 को 11। क्रम बिगड़ा तो मोटर सिर्फ़ काँपती है।', 'IN1–IN4 kram se pin 8, 9, 10, 11 par: IN1 ko 8, IN2 ko 9, IN3 ko 10, IN4 ko 11. Kram bigda to motor sirf kaanpti hai.'),
    drvGnd: t3('Common ground: join the L298N\'s GND to the Arduino\'s GND (the − rail). Without it the driver cannot understand the Arduino\'s signals and the wheels stay still.', 'कॉमन ग्राउंड: L298N का GND Arduino के GND (− रेल) से जोड़िए। इसके बिना ड्राइवर Arduino के सिग्नल नहीं समझ पाता और पहिये नहीं घूमते।', 'Common ground: L298N ka GND Arduino ke GND (− rail) se jodiye. Iske bina driver Arduino ke signal nahi samajh paata aur pahiye nahi ghoomte.'),
    jsSwap: t3('VRx and VRy are swapped: VRx (left–right) goes to A0 and VRy (forward–back) to A1. Swapped, the robot turns when you push forward.', 'VRx और VRy उल्टे लगे हैं: VRx (बाएँ–दाएँ) A0 पर और VRy (आगे–पीछे) A1 पर। उल्टे हों तो आगे धकेलने पर रोबोट मुड़ता है।', 'VRx aur VRy ulte lage hain: VRx (left–right) A0 par aur VRy (aage–peeche) A1 par. Ulte hon to aage dhakelne par robot mudta hai.'),
    wiper: t3('The knob\'s middle leg must be joined to {p}.', 'नॉब का बीच वाला पैर {p} से जुड़ना चाहिए।', 'Knob ka beech wala pair {p} se judna chahiye.'),
    knobEnds: t3('The knob\'s outer legs must go to 5V and GND (the + and − rails).', 'नॉब के बाहरी पैर 5V और GND (+ और − रेल) से जुड़ने चाहिए।', 'Knob ke bahari pair 5V aur GND (+ aur − rail) se judne chahiye.'),
    espRail: t3('The red + rail is not joined to the ESP32\'s VIN (5 V from the USB) yet: wire VIN to the + rail.', 'लाल + रेल अभी ESP32 के VIN (USB से 5 V) से नहीं जुड़ी: VIN से + रेल तक वायर लगाइए।', 'Red + rail abhi ESP32 ke VIN (USB se 5 V) se nahi judi: VIN se + rail tak wire lagaiye.'),
    espVin: t3('On the ESP32, the 5 V for modules is VIN (the + rail here). The 3V3 pin is too weak for this PIR.', 'ESP32 पर मॉड्यूल के लिए 5 V, VIN है (यहाँ + रेल)। 3V3 पिन इस पीआईआर के लिए कमज़ोर है।', 'ESP32 par module ke liye 5 V, VIN hai (yahan + rail). 3V3 pin is PIR ke liye kamzor hai.'),
  };
  const NM = {
    lamp: t3('lamp LED', 'लैंप एलईडी', 'lamp LED'), bz: N.bz, btn: N.btn, btnA: t3('team A\'s button', 'टीम A का बटन', 'team A ka button'), btnB: t3('team B\'s button', 'टीम B का बटन', 'team B ka button'),
    lcd: t3('LCD', 'एलसीडी', 'LCD'), seg: t3('7-segment display', '7-सेगमेंट डिस्प्ले', '7-segment display'), servo: N.servo, lm: N.lm, ldr: N.ldr, rgb: N.rgb,
    red: t3('red LED', 'लाल एलईडी', 'red LED'), yellow: t3('yellow LED', 'पीली एलईडी', 'yellow LED'), green: t3('green LED', 'हरी एलईडी', 'green LED'),
  };
  // ---------------------------------------------------------------- steps several lessons use
  const CHECK = { k: 'check', do: t3('Check your circuit.', 'अपना सर्किट जाँचिए।', 'Apna circuit check karo.'), see: t3('', '', '') };
  const RUN = (see) => ({ k: 'run', do: t3('Press Run.', '"चलाइए" दबाइए।', 'Run dabaiye.'), see: see || t3('', '', '') });
  const info = (en, hi, hg, see, code) => Object.assign({ k: 'info', do: t3(en, hi, hg), see: see || t3('', '', '') }, code ? { code } : {});
  const place = (q, en, hi, hg, see) => ({ k: 'place', place: q, do: t3(en, hi, hg), see: see || t3('', '', '') });
  const wire = (a, b, en, hi, hg, see) => ({ k: 'wire', wire: [a, b], do: t3(en, hi, hg), see: see || t3('', '', '') });
  const act = (until, en, hi, hg, see) => ({ k: 'act', until, do: t3(en, hi, hg), see: see || t3('', '', '') });
  const watch = (until, en, hi, hg, see) => ({ k: 'watch', until, do: t3(en, hi, hg), see: see || t3('', '', '') });
  const edit = (test, set, en, hi, hg, see) => ({ k: 'edit', test, set, do: t3(en, hi, hg), see: see || t3('', '', '') });
  const fresh = (S) => S.runSrc !== null && S.running();
  const POWER = [['5V', 'H:tp30'], ['GND3', 'H:tn18'], ['H:tp2', 'H:bp2'], ['H:tn3', 'H:bn3']]; // the back rails from the board, bridged to the front rails
  const rails = [noShort, (S) => (S.conn('rail:tp', '5V') ? null : [W.vRail]), (S) => (S.conn('rail:tn', 'GND') ? null : [W.gndRail])];
  const rails2 = [...rails, (S) => (S.conn('rail:bp', '5V') && S.conn('rail:bn', 'GND') ? null : [X.frontRails])];
  // a buzzer on the breadboard (+ leg in column c, − leg in c + 3) wired to a pin and the − rail
  const BUZ = (c, pin) => ({ parts: [PL('bz1', 'buzzer', {}, 'e' + c, 0)], wires: [['D' + pin, 'H:a' + c], ['H:a' + (c + 3), rail('tn', c + 3)]] });
  const buzChecks = (pin) => [has('bz1', NM.bz), need('bz1.P', 'D' + pin, W.toPin, { x: t3('buzzer\'s + leg', 'बज़र का + पैर', 'buzzer ka + pair'), p: pin }), need('bz1.N', 'GND', W.toGnd, { x: t3('buzzer\'s − leg', 'बज़र का − पैर', 'buzzer ka − pair') })];
  // a push button across the gap: one side to the pin, the other to GND
  const btnCheck = (tag, pin, nm) => (S) => {
    if (!S.has(tag)) return [W.missing, { x: nm }];
    const pinSide = ['L1', 'L2'].some((k) => S.conn(tag + '.' + k, 'D' + pin)), gndSide = ['L3', 'L4'].some((k) => S.conn(tag + '.' + k, 'GND'));
    const pinR = ['L3', 'L4'].some((k) => S.conn(tag + '.' + k, 'D' + pin)), gndL = ['L1', 'L2'].some((k) => S.conn(tag + '.' + k, 'GND'));
    if ((pinSide && gndL) || (pinR && gndSide)) return [X.btnSame];
    if (!pinSide && !pinR) return [W.toPin, { x: nm, p: pin }];
    if (!gndSide && !gndL) return [W.toGnd, { x: t3('other side of the button', 'बटन की दूसरी तरफ़', 'button ki doosri taraf') }];
    return null;
  };
  // LCD 16×2 on the mat in front of the board, its four wires
  const LCD = (x = -128, z = 66) => F('lcd', 'lcd16', {}, x, z, 0);
  const LCDWIRES = [['T:lcd:GND', 'H:bn6'], ['T:lcd:VCC', 'H:bp8'], ['T:lcd:SDA', 'A4'], ['T:lcd:SCL', 'A5']];
  const lcdSteps = (see) => [
    wire('lcd.GND', 'rail:bn', 'Wire the LCD\'s GND (the first pin of its backpack) to the front − rail.', 'एलसीडी का GND (बैकपैक का पहला पिन) आगे वाली − रेल से जोड़िए।', 'LCD ka GND (backpack ka pehla pin) aage wali − rail se jodiye.'),
    wire('lcd.VCC', 'rail:bp', 'Its VCC to the front + rail (5 V).', 'इसका VCC आगे वाली + रेल (5 V) से।', 'Iska VCC aage wali + rail (5 V) se.'),
    wire('lcd.SDA', 'A4', 'Its SDA to A4.', 'इसका SDA, A4 से।', 'Iska SDA, A4 se.'),
    wire('lcd.SCL', 'A5', 'Its SCL to A5.', 'इसका SCL, A5 से।', 'Iska SCL, A5 se.', see),
  ];
  const lcdChecks = (tag = 'lcd') => [has(tag, NM.lcd), (S) => (S.conn(tag + '.VCC', '3V3') ? [X.lcd33] : null), need(tag + '.VCC', '5V', W.to5v, { x: t3('LCD\'s VCC', 'एलसीडी का VCC', 'LCD ka VCC') }), need(tag + '.GND', 'GND', W.toGnd, { x: t3('LCD\'s GND', 'एलसीडी का GND', 'LCD ka GND') }),
    (S) => (S.conn(tag + '.SDA', 'A5') && S.conn(tag + '.SCL', 'A4') ? [X.i2cSwap] : null), need(tag + '.SDA', 'A4', X.i2c, { a: 'SDA', b: 'A4' }), need(tag + '.SCL', 'A5', X.i2c, { a: 'SCL', b: 'A5' })];
  // LDR + 10 kΩ divider: LDR from the + rail to A0 (column c, c + 2), the resistor from A0 down to the − rail
  const ldrChecks = (ldr, res, ch) => [has(ldr, NM.ldr), (S) => {
    const top = ['1', '2'].find((k) => S.conn(ldr + '.' + k, '5V')), mid = ['1', '2'].find((k) => S.conn(ldr + '.' + k, 'A' + ch));
    const rTop = ['1', '2'].some((k) => S.conn(res + '.' + k, '5V')), rMid = ['1', '2'].some((k) => S.conn(res + '.' + k, 'A' + ch)), rG = ['1', '2'].some((k) => S.conn(res + '.' + k, 'GND'));
    const lG = ['1', '2'].some((k) => S.conn(ldr + '.' + k, 'GND'));
    if (rTop && rMid && lG && mid) return [X.ldrSwap];
    if (top && mid && top !== mid && rMid && rG) return null;
    return [X.ldrPath];
  }];
  const lmChecks = (tag, ch) => [has(tag, NM.lm), (S) => (S.conn(tag + '.VS', 'GND') && S.conn(tag + '.GND', '5V') ? [X.lmRev] : null),
    need(tag + '.VS', '5V', W.to5v, { x: t3('LM35\'s left leg (+Vs)', 'LM35 का बायाँ पैर (+Vs)', 'LM35 ka left pair (+Vs)') }), need(tag + '.OUT', 'A' + ch, W.join, { a: t3('The LM35\'s middle leg', 'LM35 का बीच वाला पैर', 'LM35 ka beech wala pair'), b: 'A' + ch }),
    need(tag + '.GND', 'GND', W.toGnd, { x: t3('LM35\'s right leg', 'LM35 का दायाँ पैर', 'LM35 ka right pair') })];
  const servoChecks = (tag, pin) => [has(tag, NM.servo), need(tag + '.GND', 'GND', X.servoGnd), (S) => (S.conn(tag + '.VP', '3V3') ? [X.servo33] : null), need(tag + '.VP', '5V', X.servo5),
    need(tag + '.SIG', 'D' + pin, W.toPin, { x: t3('servo\'s orange wire (signal)', 'सर्वो का नारंगी तार (सिग्नल)', 'servo ka orange wire (signal)'), p: pin })];
  // the 7-segment display at g40 (columns 40–44 across the gap), each segment through its own 220 Ω resistor (span 5) to
  // columns 45–49, where the pin's wire goes. a b c d e f g = pins 2 … 8
  const SEGS = [['A', 'rA', 'a43', 2, 'H:b48'], ['B', 'rB', 'b44', 3, 'H:a49'], ['C', 'rC', 'h43', 4, 'H:j48'], ['D', 'rD', 'i41', 5, 'H:j46'], ['E', 'rE', 'j40', 6, 'H:i45'], ['F', 'rF', 'd41', 7, 'H:a46'], ['G', 'rG', 'e40', 8, 'H:a45']];
  const SEGRES = SEGS.map(([, r, h]) => PL(r, 'resistor', { ohms: 220, span: 5 }, h, 0));
  const SEGW = (skip) => SEGS.filter(([s]) => !skip.includes(s)).map(([, , , pin, hole]) => ['D' + pin, hole]);
  const SEG7 = PL('sg', 'seg7', {}, 'g40', 0);
  const SEGFULL = { parts: [SEG7, ...SEGRES], wires: [...POWER, ...SEGW([]), ['H:j42', rail('bn', 42)]] };
  const segChecks = [has('sg', NM.seg), (S) => (S.conn('sg.COM1', '5V') ? [X.segCom5] : null), need('sg.COM1', 'GND', X.segCom),
    ...SEGS.map(([s, r, , pin]) => (S) => {
      if (S.conn('sg.' + s, 'D' + pin)) return [X.segNoRes, { s: s.toLowerCase(), p: pin }];
      return S.chain('D' + pin, [[r]], 'sg.' + s) ? null : [X.seg, { s: s.toLowerCase(), p: pin }];
    })];
  const digitsSeen = (S) => S.memRun.digits || [];
  // HC-SR04 on the breadboard at j50: VCC 50, Trig 51, Echo 52, GND 53 (the front rails feed it)
  const usSteps = (trig, echo) => [
    place(PL('us1', 'hcsr04', {}, 'j50', 0), 'Plug the ultrasonic sensor into 50j–53j, its "eyes" facing you.', 'अल्ट्रासोनिक सेंसर को 50j–53j में लगाइए, इसकी "आँखें" आपकी ओर।', 'Ultrasonic sensor ko 50j–53j mein lagaiye, iski "aankhein" aapki taraf.'),
    wire('us1.VCC', 'rail:bp', 'Wire VCC (column 50) to the front + rail.', 'VCC (कॉलम 50) आगे वाली + रेल से जोड़िए।', 'VCC (column 50) aage wali + rail se jodiye.'),
    wire('us1.TRIG', 'D' + trig, `Trig (column 51) to pin ${trig}.`, `Trig (कॉलम 51) पिन ${trig} से।`, `Trig (column 51) pin ${trig} se.`),
    wire('us1.ECHO', 'D' + echo, `Echo (column 52) to pin ${echo}.`, `Echo (कॉलम 52) पिन ${echo} से।`, `Echo (column 52) pin ${echo} se.`),
    wire('us1.GND', 'rail:bn', 'GND (column 53) to the front − rail.', 'GND (कॉलम 53) आगे वाली − रेल से।', 'GND (column 53) aage wali − rail se.'),
  ];
  const US = (trig, echo) => ({ parts: [PL('us1', 'hcsr04', {}, 'j50', 0)], wires: [['H:f50', rail('bp', 50)], ['H:f51', 'D' + trig], ['H:f52', 'D' + echo], ['H:f53', rail('bn', 53)]] });
  const usChecks = (trig, echo) => [has('us1', N.us), need('us1.VCC', '5V', W.to5v, { x: 'VCC' }), need('us1.GND', 'GND', W.toGnd, { x: 'GND' }),
    (S) => (S.conn('us1.TRIG', 'D' + echo) && S.conn('us1.ECHO', 'D' + trig) ? [X.trigEcho, { t: trig, e: echo }] : null),
    need('us1.TRIG', 'D' + trig, W.toPin, { x: 'Trig', p: trig }), need('us1.ECHO', 'D' + echo, W.toPin, { x: 'Echo', p: echo })];
  // OLED at e20 (top strip): GND 20, VCC 21, SCL 22, SDA 23
  const OLED = PL('oled', 'oled', {}, 'e20', 0);
  const OLEDPRE = { parts: [OLED], wires: [['H:a20', rail('tn', 20)], ['H:a21', rail('tp', 21)], ['H:a22', 'A5'], ['H:a23', 'A4']] };
  const oledSteps = [
    place(OLED, 'Plug the OLED into 20e–23e, its screen facing you.', 'OLED को 20e–23e में लगाइए, इसकी स्क्रीन आपकी ओर।', 'OLED ko 20e–23e mein lagaiye, iski screen aapki taraf.'),
    wire('oled.GND', 'rail:tn', 'Wire its GND (column 20) to the − rail.', 'इसका GND (कॉलम 20) − रेल से जोड़िए।', 'Iska GND (column 20) − rail se jodiye.'),
    wire('oled.VCC', 'rail:tp', 'Its VCC (column 21) to the + rail.', 'इसका VCC (कॉलम 21) + रेल से।', 'Iska VCC (column 21) + rail se.'),
    wire('oled.SCL', 'A5', 'Its SCL (column 22) to A5.', 'इसका SCL (कॉलम 22) A5 से।', 'Iska SCL (column 22) A5 se.'),
    wire('oled.SDA', 'A4', 'Its SDA (column 23) to A4.', 'इसका SDA (कॉलम 23) A4 से।', 'Iska SDA (column 23) A4 se.', t3('The same two I2C wires as the LCD: the OLED answers at its own address, 0x3C.', 'एलसीडी वाले वही दो I2C तार: OLED अपने पते 0x3C पर जवाब देता है।', 'LCD wale wahi do I2C wire: OLED apne address 0x3C par jawab deta hai.')),
  ];
  const oledChecks = [has('oled', t3('OLED', 'ओएलईडी', 'OLED')), need('oled.GND', 'GND', W.toGnd, { x: 'OLED GND' }), (S) => (S.conn('oled.VCC', '5V') || S.conn('oled.VCC', '3V3') ? null : [W.to5v, { x: 'OLED VCC' }]),
    (S) => (S.conn('oled.SDA', 'A5') && S.conn('oled.SCL', 'A4') ? [X.i2cSwap] : null), need('oled.SDA', 'A4', X.oledI2c, { a: 'SDA', b: 'A4' }), need('oled.SCL', 'A5', X.oledI2c, { a: 'SCL', b: 'A5' })];
  // the 4×4 keypad on the mat, R1–R4 to pins 9–6 and C1–C4 to pins 5–2
  const KPPINS = [['R1', 9], ['R2', 8], ['R3', 7], ['R4', 6], ['C1', 5], ['C2', 4], ['C3', 3], ['C4', 2]];
  const KEYPAD = { parts: [F('kp', 'keypad', {}, -40, 165, 0)], wires: KPPINS.map(([k, p]) => ['T:kp:' + k, 'D' + p]) };
  const kpChecks = [has('kp', t3('keypad', 'कीपैड', 'keypad')), ...KPPINS.map(([k, p]) => need('kp.' + k, 'D' + p, X.kpOrder))];
  const KPCODE = `const byte ROWS = 4;
const byte COLS = 4;
char keys[ROWS][COLS] = {
  {'1', '2', '3', 'A'},
  {'4', '5', '6', 'B'},
  {'7', '8', '9', 'C'},
  {'*', '0', '#', 'D'}
};
byte rowPins[ROWS] = {9, 8, 7, 6};
byte colPins[COLS] = {5, 4, 3, 2};
Keypad keypad = Keypad(makeKeymap(keys), rowPins, colPins, ROWS, COLS);`;
  void KPCODE;
  // an IR obstacle sensor on the mat: VCC, GND to the front rails, OUT to a pin
  const irWires = (tag, pin, vcc, gnd) => [['T:' + tag + ':VCC', vcc], ['T:' + tag + ':GND', gnd], ['T:' + tag + ':OUT', 'D' + pin]];
  const irChecks = (tag, pin, nm) => [has(tag, nm), need(tag + '.VCC', '5V', W.to5v, { x: t3('sensor\'s VCC', 'सेंसर का VCC', 'sensor ka VCC') }), need(tag + '.GND', 'GND', W.toGnd, { x: t3('sensor\'s GND', 'सेंसर का GND', 'sensor ka GND') }), need(tag + '.OUT', 'D' + pin, W.toPin, { x: t3('sensor\'s OUT', 'सेंसर का OUT', 'sensor ka OUT'), p: pin })];
  // a relay and a 230 V box (an electrician's work: its two wires are already in COM and NO)
  const relayChecks = (tag, pin) => [has(tag, t3('relay', 'रिले', 'relay')), need(tag + '.S', 'D' + pin, W.toPin, { x: t3('relay\'s S', 'रिले का S', 'relay ka S'), p: pin }), (S) => (S.conn(tag + '.VCC', '3V3') ? [X.relay33] : null),
    need(tag + '.VCC', '5V', W.to5v, { x: t3('relay\'s +', 'रिले का +', 'relay ka +') }), need(tag + '.GND', 'GND', W.toGnd, { x: t3('relay\'s −', 'रिले का −', 'relay ka −') })];
  const mainsChecks = (load, rl) => [(S) => (['A', 'B'].some((k) => S.conn(load + '.' + k, 'GND') || S.conn(load + '.' + k, '5V') || S.conn(load + '.' + k, '3V3')) ? [X.mainsDanger] : null),
    (S) => (S.conn(load + '.A', rl + '.COM') && S.conn(load + '.B', rl + '.NO') ? null : [X.mains])];
  const pirChecks = (tag, pin, vcc) => [has(tag, t3('PIR sensor', 'पीआईआर सेंसर', 'PIR sensor')), (S) => (S.conn(tag + '.VCC', '3V3') ? [vcc === 'esp' ? X.espVin : X.pir33] : null),
    need(tag + '.VCC', vcc === 'esp' ? 'VIN' : '5V', W.to5v, { x: t3('PIR\'s VCC', 'पीआईआर का VCC', 'PIR ka VCC') }), // (on the ESP32 the 5 V pin is VIN) need(tag + '.GND', 'GND', W.toGnd, { x: t3('PIR\'s GND', 'पीआईआर का GND', 'PIR ka GND') }),
    need(tag + '.OUT', 'D' + pin, W.toPin, { x: t3('PIR\'s OUT', 'पीआईआर का OUT', 'PIR ka OUT'), p: pin })];
  const oledLitNow = (S) => S.memRun.oledNow || 0;
  const oledText = (S) => { const p = S.part('oled'); return (p && p.state.text) || ''; };
  const L = [];
  const add = (l) => { l.n = ++n; l.batch = 7; l.tick = l.tick || tick7; L.push(l); return l; };

  // 1 ---------------------------------------------------------------------------------------- Morse code lighthouse
  add({ id: 'sos', cls: '6–7', view: 'bb', code: SOS, drawer: ['led', 'resistor'], serial: true,
    title: t3('Morse code lighthouse', 'मोर्स कोड लाइटहाउस', 'Morse code lighthouse'),
    goal: t3('Flash SOS and then your own name in Morse code, with a lamp and a buzzer, the way ships once talked at night.', 'एक लैंप और बज़र से मोर्स कोड में SOS और फिर अपना नाम चमकाइए, जैसे कभी जहाज़ रात में बात करते थे।', 'Ek lamp aur buzzer se Morse code mein SOS aur phir apna naam chamkaiye, jaise kabhi jahaaz raat mein baat karte the.'),
    setup: merge(BUZ(30, 8), { wires: [['GND3', 'H:tn18']] }),
    steps: [
      info('Morse code turns letters into short and long signals: dots and dashes. SOS (· · · — — — · · ·) means "help!" all over the world. The buzzer is already on pin 8.', 'मोर्स कोड अक्षरों को छोटे और लंबे संकेतों में बदलता है: बिंदु और डैश। SOS (· · · — — — · · ·) का मतलब पूरी दुनिया में "मदद!" है। बज़र पहले से पिन 8 पर लगा है।', 'Morse code letters ko chhote aur lambe signals mein badalta hai: dot aur dash. SOS (· · · — — — · · ·) ka matlab poori duniya mein "madad!" hai. Buzzer pehle se pin 8 par laga hai.'),
      place(PL('led1', 'led', { color: 'yellow' }, 'e22', 0), 'Put the yellow LED (the lighthouse lamp) in the ghost: long leg in 23e.', 'पीली एलईडी (लाइटहाउस का लैंप) नीली आकृति में रखिए: लंबा पैर 23e में।', 'Yellow LED (lighthouse ka lamp) neeli shape mein rakhiye: lamba pair 23e mein.'),
      place(PL('r1', 'resistor', { ohms: 220 }, 'b22', 3), 'Its 220 Ω resistor: 22b to the − rail.', 'इसका 220 Ω रेज़िस्टर: 22b से − रेल तक।', 'Iska 220 Ω resistor: 22b se − rail tak.'),
      wire('D9', 'led1.A', 'Wire pin 9 to the LED\'s long leg (column 23).', 'पिन 9 से एलईडी के लंबे पैर (कॉलम 23) तक वायर।', 'Pin 9 se LED ke lambe pair (column 23) tak wire.'),
      CHECK,
      info('Read the code. code[] holds the Morse signs of A to Z; letter - \'A\' finds a letter\'s place in it (C - A = 2). flash() lights the lamp and beeps for a dot (200 ms) or a dash (600 ms).', 'कोड पढ़िए। code[] में A से Z तक के मोर्स चिह्न हैं; letter - \'A\' उसमें अक्षर की जगह बताता है (C - A = 2)। flash() बिंदु (200 ms) या डैश (600 ms) के लिए लैंप जलाता और बीप करता है।', 'Code padhiye. code[] mein A se Z tak ke Morse signs hain; letter - \'A\' usmein letter ki jagah batata hai (C - A = 2). flash() dot (200 ms) ya dash (600 ms) ke liye lamp jalata aur beep karta hai.', null, lines(SOS, /^String code/, /^void flash/)),
      RUN(t3('The Serial Monitor shows each letter and its signs.', 'सीरियल मॉनिटर हर अक्षर और उसके चिह्न दिखाता है।', 'Serial Monitor har letter aur uske signs dikhata hai.')),
      watch((S) => lineSeen(S, /^S \.\.\.$/) && lineSeen(S, /^O ---$/) && S.toggles('led1') >= 12, 'Watch the lamp and listen.', 'लैंप देखिए और सुनिए।', 'Lamp dekhiye aur suniye.',
        t3('Short-short-short, long-long-long, short-short-short: S O S, again and again.', 'छोटा-छोटा-छोटा, लंबा-लंबा-लंबा, छोटा-छोटा-छोटा: S O S, बार-बार।', 'Chhota-chhota-chhota, lamba-lamba-lamba, chhota-chhota-chhota: S O S, baar-baar.')),
      edit((src) => { const m = /String message = "([A-Z ]{1,12})";/.exec(src); return !!m && m[1] !== 'SOS' && /[A-Z]/.test(m[1]); }, [[/"SOS"/, '"DUET"']],
        'Change "SOS" to your own name in CAPITAL letters (A–Z, at most 12), then press Run.', '"SOS" की जगह अपना नाम बड़े अक्षरों में लिखिए (A–Z, ज़्यादा से ज़्यादा 12), फिर "चलाइए" दबाइए।', '"SOS" ki jagah apna naam capital letters mein likhiye (A–Z, zyada se zyada 12), phir Run dabaiye.'),
      watch((S) => { const m = /String message = "([A-Z ]+)";/.exec(S.runSrc || ''); if (!m) return false; const c = m[1].trim()[0]; return fresh(S) && lineSeen(S, new RegExp('^' + c + ' ' + MORSE[c.charCodeAt(0) - 65].replace(/\./g, '\\.') + '$')) && S.toggles('led1') >= 4; },
        'Watch your name go out in flashes.', 'अपने नाम को चमक में जाते हुए देखिए।', 'Apne naam ko chamak mein jaate hue dekhiye.',
        t3('Your name in light and sound! Ships and soldiers sent messages this way before radios could carry voices.', 'आपका नाम रोशनी और आवाज़ में! रेडियो पर आवाज़ जाने से पहले जहाज़ और सैनिक ऐसे ही संदेश भेजते थे।', 'Aapka naam roshni aur awaaz mein! Radio par awaaz jaane se pehle jahaaz aur sainik aise hi sandesh bhejte the.')),
    ],
    check: [noShort, unit('led1', 'r1', 9, NM.lamp), ...buzChecks(8)],
    done: (S) => S.running() && S.toggles('led1') >= 4 && S.tonesHeard() > 0 && !/"SOS"/.test(S.runSrc || '') });

  // 2 ---------------------------------------------------------------------------------------- music box
  add({ id: 'melody', cls: '6–7', view: 'bb', code: MELODY, drawer: ['buzzer'], serial: true,
    title: t3('Music box: play a tune', 'म्यूज़िक बॉक्स: धुन बजाइए', 'Music box: dhun bajaiye'),
    goal: t3('Store a tune as two lists of numbers (notes and beats) and play it on a buzzer when the button is pressed; then make it faster.', 'एक धुन को संख्याओं की दो सूचियों (सुर और ताल) में रखिए और बटन दबाने पर बज़र पर बजाइए; फिर उसे तेज़ कीजिए।', 'Ek dhun ko numbers ki do lists (sur aur taal) mein rakhiye aur button dabane par buzzer par bajaiye; phir use tez kijiye.'),
    setup: { parts: [PL('b1', 'button', {}, 'e40', 0)], wires: [['GND3', 'H:tn18'], ['D2', 'H:a40'], ['H:a42', rail('tn', 42)]] },
    steps: [
      info('The button is already on pin 2. A tune is just numbers: each note is a frequency (262 Hz is C, our Sa) and each beat a length.', 'बटन पहले से पिन 2 पर है। धुन बस संख्याएँ है: हर सुर एक आवृत्ति (262 Hz यानी C, हमारा सा) और हर ताल एक लंबाई।', 'Button pehle se pin 2 par hai. Dhun bas numbers hai: har sur ek frequency (262 Hz matlab C, hamara Sa) aur har taal ek lambai.'),
      place(PL('bz1', 'buzzer', {}, 'e52', 0), 'Put the buzzer in the ghost: + leg in 52e, − leg in 55e.', 'बज़र नीली आकृति में रखिए: + पैर 52e में, − पैर 55e में।', 'Buzzer neeli shape mein rakhiye: + pair 52e mein, − pair 55e mein.'),
      wire('D8', 'bz1.P', 'Wire pin 8 to the buzzer\'s + leg (column 52).', 'पिन 8 से बज़र के + पैर (कॉलम 52) तक वायर।', 'Pin 8 se buzzer ke + pair (column 52) tak wire.'),
      wire('bz1.N', 'rail:tn', 'Wire its − leg (column 55) to the − rail.', 'इसके − पैर (कॉलम 55) से − रेल तक वायर।', 'Iske − pair (column 55) se − rail tak wire.'),
      CHECK,
      info('Read the code: notes[] and beats[] are arrays, and notes[i] is the note number i. The for loop plays them one after another: tone(buzzer, note, ms).', 'कोड पढ़िए: notes[] और beats[] ऐरे हैं, और notes[i] सुर नंबर i है। for लूप इन्हें एक के बाद एक बजाता है: tone(buzzer, note, ms)।', 'Code padhiye: notes[] aur beats[] arrays hain, aur notes[i] sur number i hai. for loop inhe ek ke baad ek bajata hai: tone(buzzer, note, ms).', null, lines(MELODY, /^int notes/, /^int beats/)),
      RUN(),
      act((S) => S.lab.obs.tones.size >= 5 && tunes(S).some((d) => d > 3), 'Press the button (click and hold it a moment).', 'बटन दबाइए (क्लिक करके एक पल दबाए रखिए)।', 'Button dabaiye (click karke ek pal dabaye rakhiye).',
        t3('Twinkle, twinkle, little star: six different notes, 14 in all. Each line of the Serial Monitor is the note being played.', 'ट्विंकल ट्विंकल लिटिल स्टार: छह अलग सुर, कुल 14। सीरियल मॉनिटर की हर लाइन वह सुर है जो बज रहा है।', 'Twinkle twinkle little star: chhah alag sur, kul 14. Serial Monitor ki har line woh sur hai jo baj raha hai.')),
      edit((src) => { const m = /int tempo = (\d+);/.exec(src); return !!m && +m[1] <= 160 && +m[1] >= 80; }, [[/int tempo = 300;/, 'int tempo = 150;']],
        'Make it twice as fast: change tempo = 300 to tempo = 150, and press Run.', 'इसे दोगुना तेज़ कीजिए: tempo = 300 को tempo = 150 कीजिए, और "चलाइए" दबाइए।', 'Ise doguna tez kijiye: tempo = 300 ko tempo = 150 karo, aur Run dabaiye.'),
      act((S) => fresh(S) && S.lab.obs.tones.size >= 5 && tunes(S).some((d) => d > 1.2 && d < 3), 'Press the button again.', 'बटन फिर दबाइए।', 'Button phir dabaiye.',
        live(S0, (lg, S) => { const d = tunes(S).filter((x) => x > 1.2 && x < 3).pop(); return d ? pick(lg, `The tune took ${d.toFixed(1)} s instead of about 4.2 s: half the wait for each beat, twice the speed.`, `धुन ने लगभग 4.2 s की जगह ${d.toFixed(1)} s लिए: हर ताल का आधा इंतज़ार, दोगुनी रफ़्तार।`, `Dhun ne lagbhag 4.2 s ki jagah ${d.toFixed(1)} s liye: har taal ka aadha intezaar, doguni speed.`) : ''; })),
    ],
    check: [noShort, btnCheck('b1', 2, NM.btn), ...buzChecks(8)],
    // a tune = 14 note lines on the Serial Monitor; its length = the board's time from the first note line to the last
    tick: (S) => { tick7(S); const R = S.memRun; const n = S.lines; if (n !== (R.nl || 0)) { const t = bt(S); for (let i = R.nl || 0; i < n; i++) { if (!/^\d+$/.test((S.serLines[S.serLines.length - n + i] || '').trim())) continue; if (R.tuneT1 === undefined || t - R.tuneT1 > 0.9) { R.tuneT0 = t; R.tuneN = 0; } R.tuneT1 = t; if (++R.tuneN === 14) (R.tunes || (R.tunes = [])).push(R.tuneT1 - R.tuneT0); } R.nl = n; } },
    done: (S) => S.running() && /int tempo = (8\d|9\d|1[0-5]\d|160);/.test(S.runSrc || '') && S.lab.obs.tones.size >= 5 });

  // 3 ---------------------------------------------------------------------------------------- light theremin
  add({ id: 'theremin', cls: '6–8', view: 'bb', code: THEREMIN, drawer: ['ldr', 'resistor'], serial: true,
    title: t3('Light theremin', 'रोशनी वाला थेरेमिन', 'Roshni wala theremin'),
    goal: t3('An instrument you play without touching it: the shadow of your hand on a light sensor changes the note.', 'एक बाजा जिसे बिना छुए बजाते हैं: रोशनी सेंसर पर हाथ की छाया सुर बदल देती है।', 'Ek baaja jise bina chhue bajaate hain: roshni sensor par haath ki chhaya sur badal deti hai.'),
    setup: merge(BUZ(52, 8), { wires: [['GND3', 'H:tn18'], ['5V', 'H:tp30']] }),
    steps: [
      info('The buzzer is ready on pin 8. You will build a light sensor: an LDR and a 10 kΩ resistor in a line from 5V to GND, with A0 in the middle (a voltage divider).', 'बज़र पिन 8 पर तैयार है। आप एक रोशनी सेंसर बनाएँगे: एलडीआर और 10 kΩ रेज़िस्टर, 5V से GND तक एक कतार में, बीच में A0 (वोल्टेज डिवाइडर)।', 'Buzzer pin 8 par taiyaar hai. Aap ek roshni sensor banayenge: LDR aur 10 kΩ resistor, 5V se GND tak ek line mein, beech mein A0 (voltage divider).'),
      place(PL('ldr1', 'ldr', {}, 'e40', 0), 'Put the LDR in the ghost: legs in 40e and 42e.', 'एलडीआर नीली आकृति में रखिए: पैर 40e और 42e में।', 'LDR neeli shape mein rakhiye: pair 40e aur 42e mein.'),
      place(PL('r10', 'resistor', { ohms: 10000 }, 'b42', 3), 'Put the 10 kΩ resistor (brown-black-orange) from 42b to the − rail.', '10 kΩ रेज़िस्टर (भूरा-काला-नारंगी) 42b से − रेल तक लगाइए।', '10 kΩ resistor (brown-black-orange) 42b se − rail tak lagaiye.'),
      wire('ldr1.1', 'rail:tp', 'Wire the LDR\'s left leg (column 40) to the + rail.', 'एलडीआर के बाएँ पैर (कॉलम 40) से + रेल तक वायर।', 'LDR ke left pair (column 40) se + rail tak wire.'),
      wire('A0', 'ldr1.2', 'Wire A0 to column 42, where the LDR meets the resistor.', 'A0 से कॉलम 42 तक वायर, जहाँ एलडीआर रेज़िस्टर से मिलता है।', 'A0 se column 42 tak wire, jahan LDR resistor se milta hai.', t3('Bright light: the LDR lets more through, A0 rises. Shadow: A0 falls.', 'तेज़ रोशनी: एलडीआर ज़्यादा करंट जाने देता है, A0 बढ़ता है। छाया: A0 घटता है।', 'Tez roshni: LDR zyada current jaane deta hai, A0 badhta hai. Chhaya: A0 ghatta hai.')),
      CHECK,
      info('Read the code. map() stretches the reading 0–1023 onto notes 120–1500 Hz, and tone() plays the note, 50 times a second.', 'कोड पढ़िए। map() रीडिंग 0–1023 को सुर 120–1500 Hz पर फैलाता है, और tone() सेकंड में 50 बार सुर बजाता है।', 'Code padhiye. map() reading 0–1023 ko sur 120–1500 Hz par failata hai, aur tone() second mein 50 baar sur bajata hai.', null, lines(THEREMIN, /int pitch/, /tone\(buzzer/)),
      RUN(),
      act((S) => (S.memRun.darkF || 9999) < 450, 'Cover the sensor: turn the room light down (the light slider, or tap the LDR).', 'सेंसर को ढकिए: कमरे की रोशनी कम कीजिए (रोशनी का स्लाइडर, या एलडीआर को छूइए)।', 'Sensor ko dhakiye: room ki roshni kam kijiye (light slider, ya LDR ko touch karo).', t3('In the shadow the note drops low.', 'छाया में सुर नीचा हो जाता है।', 'Chhaya mein sur neecha ho jaata hai.')),
      act((S) => (S.memRun.brightF || 0) > 1000, 'Now bring back bright light.', 'अब तेज़ रोशनी वापस लाइए।', 'Ab tez roshni wapas laiye.', t3('High and bright. Move the slider slowly and you play a slide, like a real theremin.', 'ऊँचा और तेज़। स्लाइडर धीरे-धीरे चलाइए तो सुर फिसलता है, असली थेरेमिन की तरह।', 'Ooncha aur tez. Slider dheere-dheere chalaiye to sur phisalta hai, asli theremin ki tarah.')),
      edit((src) => /map\(\s*light\s*,\s*0\s*,\s*1023\s*,\s*1500\s*,\s*120\s*\)/.test(src), [[/map\(light, 0, 1023, 120, 1500\)/, 'map(light, 0, 1023, 1500, 120)']],
        'Turn it upside down: change map(light, 0, 1023, 120, 1500) to map(light, 0, 1023, 1500, 120), and press Run.', 'इसे उल्टा कीजिए: map(light, 0, 1023, 120, 1500) को map(light, 0, 1023, 1500, 120) कीजिए, और "चलाइए" दबाइए।', 'Ise ulta kijiye: map(light, 0, 1023, 120, 1500) ko map(light, 0, 1023, 1500, 120) karo, aur Run dabaiye.'),
      act((S) => fresh(S) && (S.memRun.darkF || 0) > 1000, 'Make it dark again.', 'फिर अँधेरा कीजिए।', 'Phir andhera kijiye.', t3('Now the shadow plays high notes: map() can turn a range round as well as stretch it.', 'अब छाया ऊँचे सुर बजाती है: map() किसी दायरे को फैलाने के साथ उल्टा भी कर सकता है।', 'Ab chhaya oonche sur bajati hai: map() kisi range ko failane ke saath ulta bhi kar sakta hai.')),
    ],
    check: [noShort, (S) => (S.conn('rail:tp', '5V') ? null : [W.vRail]), ...ldrChecks('ldr1', 'r10', 0), ...buzChecks(8)],
    tick: (S) => { tick7(S); const f = toneNow(S); if (f) { if (S.lab.env.light < 0.3) S.memRun.darkF = f; if (S.lab.env.light > 0.7) S.memRun.brightF = f; } },
    done: (S) => S.running() && (S.memRun.darkF || 0) > 1000 });

  // 4 ---------------------------------------------------------------------------------------- colour thermometer
  add({ id: 'rgbtemp', cls: '7–8', view: 'bb', code: RGBTEMP, drawer: ['lm35'], serial: true,
    title: t3('Colour thermometer', 'रंगों वाला थर्मामीटर', 'Rangon wala thermometer'),
    goal: t3('An LM35 measures the temperature and an RGB LED shows it as a colour: blue when cool, green when just right, red when hot.', 'LM35 तापमान नापता है और RGB एलईडी उसे रंग में दिखाती है: ठंडा हो तो नीला, ठीक हो तो हरा, गर्म हो तो लाल।', 'LM35 temperature naapta hai aur RGB LED use rang mein dikhati hai: thanda ho to neela, theek ho to hara, garam ho to laal.'),
    setup: { parts: [PL('rr', 'resistor', { ohms: 220 }, 'd30', 1), PL('rg', 'resistor', { ohms: 220 }, 'd32', 1), PL('rb', 'resistor', { ohms: 220 }, 'd33', 1), PL('rgb1', 'rgb', {}, 'e30', 0)],
      wires: [['GND3', 'H:tn18'], ['5V', 'H:tp30'], ['D9', 'H:j30'], ['D10', 'H:j32'], ['D11', 'H:j33'], ['H:a31', rail('tn', 31)]] },
    steps: [
      info('The RGB LED from lesson 8 is ready on pins 9 (red), 10 (green) and 11 (blue). Add the temperature sensor.', 'पाठ 8 वाली RGB एलईडी पिन 9 (लाल), 10 (हरा) और 11 (नीला) पर तैयार है। तापमान सेंसर जोड़िए।', 'Lesson 8 wali RGB LED pin 9 (red), 10 (green) aur 11 (blue) par taiyaar hai. Temperature sensor jodiye.'),
      place(PL('t1', 'lm35', {}, 'e45', 0), 'Put the LM35 in 45e–47e, flat side facing you.', 'LM35 को 45e–47e में लगाइए, चपटी तरफ़ आपकी ओर।', 'LM35 ko 45e–47e mein lagaiye, flat side aapki taraf.'),
      wire('t1.VS', 'rail:tp', 'Wire its left leg (+Vs, column 45) to the + rail.', 'इसके बाएँ पैर (+Vs, कॉलम 45) से + रेल तक वायर।', 'Iske left pair (+Vs, column 45) se + rail tak wire.'),
      wire('t1.OUT', 'A0', 'Its middle leg (column 46) to A0.', 'इसका बीच वाला पैर (कॉलम 46) A0 से।', 'Iska beech wala pair (column 46) A0 se.'),
      wire('t1.GND', 'rail:tn', 'Its right leg (column 47) to the − rail.', 'इसका दायाँ पैर (कॉलम 47) − रेल से।', 'Iska right pair (column 47) − rail se.'),
      CHECK,
      RUN(t3('The room is 26 °C: just right, green.', 'कमरा 26 °C का है: बिल्कुल ठीक, हरा।', 'Room 26 °C ka hai: bilkul theek, hara.')),
      act((S) => S.rgbSeen('rgb1', 'B') && S.lab.env.temp < 20, 'Cool the sensor below 20 °C (tap it and use its slider: an ice cube on it).', 'सेंसर को 20 °C से नीचे ठंडा कीजिए (छूकर स्लाइडर से: जैसे उस पर बर्फ़ का टुकड़ा)।', 'Sensor ko 20 °C se neeche thanda kijiye (touch karke slider se: jaise us par barf ka tukda).', t3('Blue: below 20 °C. The if … else if … else picks exactly one colour.', 'नीला: 20 °C से नीचे। if … else if … else ठीक एक ही रंग चुनता है।', 'Neela: 20 °C se neeche. if … else if … else theek ek hi rang chunta hai.')),
      act((S) => S.rgbSeen('rgb1', 'R') && S.lab.env.temp >= 32, 'Now warm it above 32 °C (a hot afternoon in May).', 'अब इसे 32 °C से ऊपर गर्म कीजिए (मई की गर्म दोपहर)।', 'Ab ise 32 °C se upar garam kijiye (May ki garam dopahar).', t3('Red: hot! A red, green and blue LED in one bulb, each with its own pin and resistor.', 'लाल: गर्म! एक बल्ब में लाल, हरी और नीली एलईडी, हर एक का अपना पिन और रेज़िस्टर।', 'Laal: garam! Ek bulb mein red, green aur blue LED, har ek ka apna pin aur resistor.')),
    ],
    check: [noShort, (S) => (S.conn('rail:tp', '5V') ? null : [W.vRail]), ...lmChecks('t1', 0), (S) => (S.conn('rgb1.K', '5V') ? [X.rgbK] : null), need('rgb1.K', 'GND', W.toGnd, { x: t3('RGB LED\'s longest leg', 'RGB एलईडी का सबसे लंबा पैर', 'RGB LED ka sabse lamba pair') })],
    done: (S) => ['R', 'B'].every((c) => S.rgbSeen('rgb1', c)) });

  // 5 ---------------------------------------------------------------------------------------- zebra crossing
  add({ id: 'crossing', cls: '6–8', view: 'bb', code: CROSSING, drawer: ['button'], serial: true,
    title: t3('Zebra crossing with a WALK button', 'WALK बटन वाला ज़ेबरा क्रॉसिंग', 'WALK button wala zebra crossing'),
    goal: t3('A traffic light that lets people cross: press WALK and the cars get yellow, then red, while a beeper tells blind people it is safe.', 'एक ट्रैफ़िक लाइट जो लोगों को सड़क पार करने देती है: WALK दबाइए, गाड़ियों को पीली, फिर लाल बत्ती मिलती है, और बीपर दृष्टिहीन लोगों को बताता है कि अब सुरक्षित है।', 'Ek traffic light jo logon ko sadak paar karne deti hai: WALK dabaiye, gaadiyon ko yellow, phir red light milti hai, aur beeper drishtiheen logon ko batata hai ki ab safe hai.'),
    setup: merge(LEDU(1, 22, 'red', 12), LEDU(2, 28, 'yellow', 11), LEDU(3, 34, 'green', 10), BUZ(52, 8), { wires: [['GND3', 'H:tn18']] }),
    steps: [
      info('The traffic light (red 12, yellow 11, green 10) and a beeper (pin 8) are ready. Add the WALK button that people press at the crossing.', 'ट्रैफ़िक लाइट (लाल 12, पीली 11, हरी 10) और बीपर (पिन 8) तैयार हैं। WALK बटन जोड़िए जिसे लोग क्रॉसिंग पर दबाते हैं।', 'Traffic light (red 12, yellow 11, green 10) aur beeper (pin 8) taiyaar hain. WALK button jodiye jise log crossing par dabaate hain.'),
      place(PL('b1', 'button', {}, 'e40', 0), 'Put the push button across the middle gap at the ghost.', 'पुश बटन को बीच की खाली जगह के आर-पार नीली आकृति पर लगाइए।', 'Push button ko beech ke gap ke aar-paar neeli shape par lagaiye.'),
      wire('D2', 'b1.L1', 'Wire pin 2 to the button (column 40).', 'पिन 2 से बटन (कॉलम 40) तक वायर।', 'Pin 2 se button (column 40) tak wire.'),
      wire('b1.L3', 'rail:tn', 'Wire the button\'s other side (column 42) to the − rail.', 'बटन की दूसरी तरफ़ (कॉलम 42) से − रेल तक वायर।', 'Button ki doosri taraf (column 42) se − rail tak wire.'),
      CHECK,
      RUN(t3('Green for the cars, until someone presses WALK.', 'गाड़ियों के लिए हरी, जब तक कोई WALK न दबाए।', 'Gaadiyon ke liye green, jab tak koi WALK na dabaye.')),
      act((S) => S.memRun.walk && S.memRun.back, 'Press WALK, then watch the whole crossing.', 'WALK दबाइए, फिर पूरा क्रॉसिंग देखिए।', 'WALK dabaiye, phir poora crossing dekhiye.',
        t3('Yellow for 2 s, red while it beeps, then green again: the sketch waits for people, not for a clock.', 'पीली 2 सेकंड, बीप के दौरान लाल, फिर हरी: स्केच घड़ी का नहीं, लोगों का इंतज़ार करता है।', 'Yellow 2 second, beep ke dauraan red, phir green: sketch ghadi ka nahi, logon ka intezaar karta hai.')),
      edit((src) => { const m = /int walkTime = (\d+);/.exec(src); return !!m && +m[1] >= 7 && +m[1] <= 12; }, [[/int walkTime = 5;/, 'int walkTime = 8;']],
        'Old people need more time: change walkTime = 5 to walkTime = 8, and press Run.', 'बुज़ुर्गों को ज़्यादा समय चाहिए: walkTime = 5 को walkTime = 8 कीजिए, और "चलाइए" दबाइए।', 'Buzurgon ko zyada time chahiye: walkTime = 5 ko walkTime = 8 karo, aur Run dabaiye.'),
      act((S) => fresh(S) && (S.memRun.redDur || 0) >= 7 && S.memRun.back, 'Press WALK again and count the beeps.', 'WALK फिर दबाइए और बीप गिनिए।', 'WALK phir dabaiye aur beep giniye.',
        live(S0, (lg, S) => (S.memRun.redDur ? pick(lg, `Red for ${S.memRun.redDur.toFixed(1)} s now: 8 rounds of 4 beeps.`, `अब ${S.memRun.redDur.toFixed(1)} सेकंड लाल: 4-4 बीप के 8 दौर।`, `Ab ${S.memRun.redDur.toFixed(1)} second red: 4-4 beep ke 8 daur.`) : ''))),
    ],
    check: [noShort, unit('led1', 'r1', 12, NM.red), unit('led2', 'r2', 11, NM.yellow), unit('led3', 'r3', 10, NM.green), btnCheck('b1', 2, NM.btn), ...buzChecks(8)],
    tick: (S) => { tick7(S); const R = S.memRun; const red = S.ledLit('led1'); if (red && S.memRun.tones) R.walk = true; if (R.walk && !red && S.ledLit('led3')) R.back = true; if (red && R.redAt === undefined) R.redAt = bt(S); if (!red && R.redAt !== undefined) { R.redDur = Math.max(R.redDur || 0, bt(S) - R.redAt); R.redAt = undefined; } },
    done: (S) => (S.memRun.redDur || 0) >= 7 });

  // 6 ---------------------------------------------------------------------------------------- quiz buzzer
  add({ id: 'quizbuzz', cls: '6–8', view: 'bb', code: QUIZ, drawer: ['button'], serial: true,
    title: t3('Quiz buzzer for two teams', 'दो टीमों का क्विज़ बज़र', 'Do teams ka quiz buzzer'),
    goal: t3('For the school quiz: whichever team presses first gets its light and a beep, and the other team\'s button is locked out.', 'स्कूल क्विज़ के लिए: जो टीम पहले दबाए उसकी बत्ती जले और बीप हो, और दूसरी टीम का बटन बंद हो जाए।', 'School quiz ke liye: jo team pehle dabaye uski light jale aur beep ho, aur doosri team ka button band ho jaaye.'),
    setup: merge(LEDU(1, 22, 'red', 12), LEDU(2, 28, 'green', 11), BUZ(52, 8), { wires: [['GND3', 'H:tn18']] }),
    steps: [
      info('Team A\'s red lamp (pin 12), team B\'s green lamp (pin 11) and the buzzer (pin 8) are ready. Each team gets a button.', 'टीम A का लाल लैंप (पिन 12), टीम B का हरा लैंप (पिन 11) और बज़र (पिन 8) तैयार हैं। हर टीम को एक बटन मिलेगा।', 'Team A ka red lamp (pin 12), team B ka green lamp (pin 11) aur buzzer (pin 8) taiyaar hain. Har team ko ek button milega.'),
      place(PL('b1', 'button', {}, 'e40', 0), 'Put team A\'s button across the gap at the first ghost (columns 40–42).', 'टीम A का बटन पहली नीली आकृति पर गैप के आर-पार लगाइए (कॉलम 40–42)।', 'Team A ka button pehli neeli shape par gap ke aar-paar lagaiye (column 40–42).'),
      wire('D2', 'b1.L1', 'Wire pin 2 to team A\'s button (column 40).', 'पिन 2 से टीम A के बटन (कॉलम 40) तक वायर।', 'Pin 2 se team A ke button (column 40) tak wire.'),
      wire('b1.L3', 'rail:tn', 'Its other side (column 42) to the − rail.', 'इसकी दूसरी तरफ़ (कॉलम 42) − रेल से।', 'Iski doosri taraf (column 42) − rail se.'),
      place(PL('b2', 'button', {}, 'e46', 0), 'Put team B\'s button at the second ghost (columns 46–48).', 'टीम B का बटन दूसरी नीली आकृति पर लगाइए (कॉलम 46–48)।', 'Team B ka button doosri neeli shape par lagaiye (column 46–48).'),
      wire('D3', 'b2.L1', 'Wire pin 3 to team B\'s button (column 46).', 'पिन 3 से टीम B के बटन (कॉलम 46) तक वायर।', 'Pin 3 se team B ke button (column 46) tak wire.'),
      wire('b2.L3', 'rail:tn', 'Its other side (column 48) to the − rail.', 'इसकी दूसरी तरफ़ (कॉलम 48) − रेल से।', 'Iski doosri taraf (column 48) − rail se.'),
      CHECK,
      RUN(t3('"Ready!" on the Serial Monitor.', 'सीरियल मॉनिटर पर "Ready!"।', 'Serial Monitor par "Ready!".')),
      act((S) => S.memRun.aWon, 'Team A knows the answer: press team A\'s button.', 'टीम A को जवाब पता है: टीम A का बटन दबाइए।', 'Team A ko jawab pata hai: team A ka button dabaiye.', t3('Red lamp, beep: "Team A pressed first!"', 'लाल लैंप, बीप: "Team A pressed first!"', 'Red lamp, beep: "Team A pressed first!"')),
      act((S) => S.memRun.locked, 'Quick, while the red lamp is still on: press team B\'s button.', 'जल्दी, जब तक लाल लैंप जल रहा है: टीम B का बटन दबाइए।', 'Jaldi, jab tak red lamp jal raha hai: team B ka button dabaiye.', t3('Nothing! For 5 seconds the sketch is inside win(), in delay(5000), and does not look at the buttons.', 'कुछ नहीं! 5 सेकंड तक स्केच win() के अंदर delay(5000) में है, और बटनों को देखता ही नहीं।', 'Kuch nahi! 5 second tak sketch win() ke andar delay(5000) mein hai, aur buttons ko dekhta hi nahi.')),
      act((S) => S.memRun.bWon, 'When it says "Ready!" again, let team B press first.', 'जब फिर "Ready!" आए, तो टीम B को पहले दबाने दीजिए।', 'Jab phir "Ready!" aaye, to team B ko pehle dabane dijiye.', t3('Green lamp: team B\'s turn. A fair referee that never blinks.', 'हरा लैंप: टीम B की बारी। एक ईमानदार रेफ़री जो कभी पलक नहीं झपकाता।', 'Green lamp: team B ki baari. Ek imaandaar referee jo kabhi palak nahi jhapkata.')),
    ],
    check: [noShort, unit('led1', 'r1', 12, NM.red), unit('led2', 'r2', 11, NM.green), btnCheck('b1', 2, NM.btnA), btnCheck('b2', 3, NM.btnB), ...buzChecks(8)],
    tick: (S) => { tick7(S); const R = S.memRun; const a = S.ledLit('led1'), b = S.ledLit('led2'); const pb = S.part('b2'); if (a && !b) R.aWon = true; if (R.aWon && a && pb && pb.state.pressed && !b) R.lockT = (R.lockT || 0) + R.dtb; if (R.lockT > 0.12) R.locked = true; if (R.locked && b && !a) R.bWon = true; },
    done: (S) => S.memRun.aWon && S.memRun.locked && S.memRun.bWon });

  // 7 ---------------------------------------------------------------------------------------- reaction timer
  add({ id: 'reaction', cls: '7–9', view: 'wide', code: REACTION, drawer: ['button'], serial: false,
    title: t3('Reaction timer game', 'रिएक्शन टाइमर खेल', 'Reaction timer game'),
    goal: t3('How fast are you? The red light comes on after a wait you cannot guess; press the button and the LCD shows your time in milliseconds.', 'आप कितने तेज़ हैं? लाल बत्ती एक अनजाने इंतज़ार के बाद जलती है; बटन दबाइए और एलसीडी आपका समय मिलीसेकंड में दिखाती है।', 'Aap kitne tez hain? Red light ek anjaane intezaar ke baad jalti hai; button dabaiye aur LCD aapka time millisecond mein dikhati hai.'),
    setup: merge(LEDU(1, 22, 'red', 12), { parts: [LCD()], wires: [...POWER, ...LCDWIRES] }),
    steps: [
      info('The LCD and the red light (pin 12) are ready. Add the button you will press.', 'एलसीडी और लाल बत्ती (पिन 12) तैयार हैं। वह बटन जोड़िए जिसे आप दबाएँगे।', 'LCD aur red light (pin 12) taiyaar hain. Woh button jodiye jise aap dabayenge.'),
      place(PL('b1', 'button', {}, 'e40', 0), 'Put the push button across the gap at the ghost.', 'पुश बटन को गैप के आर-पार नीली आकृति पर लगाइए।', 'Push button ko gap ke aar-paar neeli shape par lagaiye.'),
      wire('D2', 'b1.L1', 'Wire pin 2 to the button (column 40).', 'पिन 2 से बटन (कॉलम 40) तक वायर।', 'Pin 2 se button (column 40) tak wire.'),
      wire('b1.L3', 'rail:tn', 'Its other side (column 42) to the − rail.', 'इसकी दूसरी तरफ़ (कॉलम 42) − रेल से।', 'Iski doosri taraf (column 42) − rail se.'),
      CHECK,
      info('Read the code. random(2000, 5000) picks a wait of 2 to 5 s, and the while loop watches the button all through it. millis() is the board\'s stopwatch: the time at the light is kept in start, and millis() - start is your reaction time.', 'कोड पढ़िए। random(2000, 5000) 2 से 5 सेकंड का इंतज़ार चुनता है, और while लूप उस पूरे समय बटन पर नज़र रखता है। millis() बोर्ड की स्टॉपवॉच है: बत्ती जलते समय का समय start में रखा जाता है, और millis() - start आपका रिएक्शन टाइम है।', 'Code padhiye. random(2000, 5000) 2 se 5 second ka intezaar chunta hai, aur while loop us poore samay button par nazar rakhta hai. millis() board ki stopwatch hai: light jalte waqt ka time start mein rakha jaata hai, aur millis() - start aapka reaction time hai.', null, lines(REACTION, /unsigned long wait/, /unsigned long ms/)),
      RUN(t3('"Get ready..." on the LCD.', 'एलसीडी पर "Get ready..."।', 'LCD par "Get ready...".')),
      act((S) => lcdSeen(S, /^\d+ ms$/), 'Wait for the red light, then press the button as fast as you can.', 'लाल बत्ती का इंतज़ार कीजिए, फिर जितनी जल्दी हो सके बटन दबाइए।', 'Red light ka intezaar kijiye, phir jitni jaldi ho sake button dabaiye.',
        live(S0, (lg, S) => { const t = (S.memRun.lcd || []).map((r) => /^(\d+) ms$/.exec(r[1])).filter(Boolean).map((m) => +m[1]); return t.length ? pick(lg, `Your time: ${t[t.length - 1]} ms. Most people need 200–300 ms: the eye sees, the brain decides, the finger moves.`, `आपका समय: ${t[t.length - 1]} ms। ज़्यादातर लोगों को 200–300 ms लगते हैं: आँख देखती है, दिमाग़ तय करता है, उँगली चलती है।`, `Aapka time: ${t[t.length - 1]} ms. Zyadatar logon ko 200–300 ms lagte hain: aankh dekhti hai, dimaag tay karta hai, ungli chalti hai.`) : ''; })),
      act((S) => lcdSeen(S, /Too early!/), 'Next round: try to cheat. Press the button before the light comes on (while it says "Get ready...").', 'अगला दौर: चालाकी कीजिए। बत्ती जलने से पहले बटन दबाइए ("Get ready..." के समय)।', 'Agla daur: chalaki kijiye. Light jalne se pehle button dabaiye ("Get ready..." ke waqt).',
        t3('"Too early!" The sketch watches the button during the whole wait, so even a quick early press is caught.', '"Too early!" स्केच पूरे इंतज़ार के दौरान बटन देखता है, इसलिए जल्दी किया गया छोटा-सा दबाव भी पकड़ा जाता है।', '"Too early!" Sketch poore intezaar ke dauraan button dekhta hai, isliye jaldi kiya gaya chhota sa press bhi pakda jaata hai.')),
    ],
    check: [...rails2, unit('led1', 'r1', 12, NM.red), btnCheck('b1', 2, NM.btn), ...lcdChecks()],
    done: (S) => lcdSeen(S, /^\d+ ms$/) && lcdSeen(S, /Too early!/) });

  // 8 ---------------------------------------------------------------------------------------- 7-segment counter
  add({ id: 'segcount', cls: '7–8', view: 'bb', code: SEGCOUNT, drawer: ['seg7'], serial: true,
    title: t3('Count 0 to 9 on a 7-segment display', '7-सेगमेंट डिस्प्ले पर 0 से 9 गिनिए', '7-segment display par 0 se 9 giniye'),
    goal: t3('The digits on lifts, clocks and petrol pumps: seven LEDs in the shape of an 8. Light the right ones to make each digit.', 'लिफ़्ट, घड़ी और पेट्रोल पंप पर दिखने वाले अंक: 8 के आकार में सात एलईडी। हर अंक बनाने के लिए सही एलईडी जलाइए।', 'Lift, ghadi aur petrol pump par dikhne wale ank: 8 ke aakar mein saat LED. Har ank banane ke liye sahi LED jalaiye.'),
    setup: { parts: SEGRES, wires: [...POWER, ...SEGW(['A'])] },
    steps: [
      info('Seven resistors stand ready, one for each segment a to g, and pins 3 to 8 are wired to segments b to g. You add the display, its ground, and segment a.', 'सात रेज़िस्टर तैयार हैं, a से g तक हर सेगमेंट के लिए एक, और पिन 3 से 8 सेगमेंट b से g से जुड़े हैं। आप डिस्प्ले, उसका ग्राउंड और सेगमेंट a जोड़िए।', 'Saat resistor taiyaar hain, a se g tak har segment ke liye ek, aur pin 3 se 8 segment b se g se jude hain. Aap display, uska ground aur segment a jodiye.'),
      place(SEG7, 'Put the 7-segment display across the middle gap at the ghost (columns 40–44), its dot at the bottom right.', '7-सेगमेंट डिस्प्ले को बीच की खाली जगह के आर-पार नीली आकृति पर लगाइए (कॉलम 40–44), इसका बिंदु नीचे दाईं ओर।', '7-segment display ko beech ke gap ke aar-paar neeli shape par lagaiye (column 40–44), iska dot neeche right side.'),
      wire('sg.COM1', 'rail:bn', 'Wire its COM pin (the middle of the front row, column 42) to the front − rail.', 'इसका COM पिन (आगे वाली कतार का बीच, कॉलम 42) आगे वाली − रेल से जोड़िए।', 'Iska COM pin (aage wali line ka beech, column 42) aage wali − rail se jodiye.', t3('Common cathode: all eight LEDs share this − leg.', 'कॉमन कैथोड: आठों एलईडी का यह − पैर एक ही है।', 'Common cathode: aathon LED ka yeh − pair ek hi hai.')),
      wire('D2', 'rA.2', 'Wire pin 2 to the far end of segment a\'s resistor (column 48, at the back).', 'पिन 2 को सेगमेंट a के रेज़िस्टर के दूसरे सिरे (कॉलम 48, पीछे) से जोड़िए।', 'Pin 2 ko segment a ke resistor ke doosre sire (column 48, peeche) se jodiye.', t3('Every segment is an LED, so every segment needs its own resistor.', 'हर सेगमेंट एक एलईडी है, इसलिए हर सेगमेंट को अपना रेज़िस्टर चाहिए।', 'Har segment ek LED hai, isliye har segment ko apna resistor chahiye.')),
      CHECK,
      info('Read the code. digits[10][7] is a table: one row for each digit, one 1 or 0 for each segment. show(n) copies row n onto the seven pins.', 'कोड पढ़िए। digits[10][7] एक तालिका है: हर अंक की एक पंक्ति, हर सेगमेंट का एक 1 या 0। show(n) पंक्ति n को सातों पिनों पर डाल देता है।', 'Code padhiye. digits[10][7] ek table hai: har ank ki ek row, har segment ka ek 1 ya 0. show(n) row n ko saaton pins par daal deta hai.', null, lines(SEGCOUNT, /^byte digits/, /^void show/)),
      RUN(),
      watch((S) => digitsSeen(S).length && [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].every((d) => digitsSeen(S).includes(d)), 'Watch it count.', 'इसे गिनते हुए देखिए।', 'Ise ginte hue dekhiye.', t3('0 to 9, one a second. The 8 lights all seven segments; the 1 only two (b and c).', '0 से 9, हर सेकंड एक। 8 में सातों सेगमेंट जलते हैं; 1 में सिर्फ़ दो (b और c)।', '0 se 9, har second ek. 8 mein saaton segment jalte hain; 1 mein sirf do (b aur c).')),
      edit((src) => /for\s*\(\s*int n = 9;\s*n >= 0;\s*n--\s*\)/.test(src), [[/for \(int n = 0; n <= 9; n\+\+\)/, 'for (int n = 9; n >= 0; n--)']],
        'Make it count down: change the loop to for (int n = 9; n >= 0; n--) and press Run.', 'इसे उल्टा गिनवाइए: लूप को for (int n = 9; n >= 0; n--) कीजिए और "चलाइए" दबाइए।', 'Ise ulta ginwaiye: loop ko for (int n = 9; n >= 0; n--) karo aur Run dabaiye.'),
      watch((S) => { const d = digitsSeen(S); let k = 0; for (let i = 1; i < d.length; i++) if (d[i] === d[i - 1] - 1) k++; return fresh(S) && k >= 4; }, 'Watch the count now.', 'अब गिनती देखिए।', 'Ab ginti dekhiye.', t3('9, 8, 7 … 0: a countdown, with only one line changed.', '9, 8, 7 … 0: उल्टी गिनती, सिर्फ़ एक लाइन बदलकर।', '9, 8, 7 … 0: ulti ginti, sirf ek line badal kar.')),
    ],
    check: [...rails2, ...segChecks],
    done: (S) => (S.mem.digits || new Set()).size >= 10 && /n--/.test(S.runSrc || '') });

  // 9 ---------------------------------------------------------------------------------------- electronic dice
  add({ id: 'dice', cls: '7–8', view: 'bb', code: DICE, drawer: ['button'], serial: true,
    title: t3('Electronic dice', 'इलेक्ट्रॉनिक पासा', 'Electronic dice'),
    goal: t3('Press a button and the display tumbles through numbers, slows down and stops at a random roll from 1 to 6, for ludo or snakes and ladders.', 'बटन दबाइए और डिस्प्ले पर अंक लुढ़कते हैं, धीमे होते हैं और 1 से 6 के किसी अनजाने अंक पर रुकते हैं, लूडो या साँप-सीढ़ी के लिए।', 'Button dabaiye aur display par ank ludhakte hain, dheeme hote hain aur 1 se 6 ke kisi anjaane ank par rukte hain, ludo ya saanp-seedhi ke liye.'),
    setup: SEGFULL,
    steps: [
      info('The 7-segment display is wired as in the last lesson (pins 2–8 through seven resistors). Add the dice\'s button on pin 9.', '7-सेगमेंट डिस्प्ले पिछले पाठ की तरह जुड़ा है (पिन 2–8, सात रेज़िस्टर से होकर)। पिन 9 पर पासे का बटन जोड़िए।', '7-segment display pichhle lesson ki tarah juda hai (pin 2–8, saat resistor se hokar). Pin 9 par dice ka button jodiye.'),
      place(PL('b1', 'button', {}, 'e53', 0), 'Put the push button across the gap at the ghost (columns 53–55).', 'पुश बटन को गैप के आर-पार नीली आकृति पर लगाइए (कॉलम 53–55)।', 'Push button ko gap ke aar-paar neeli shape par lagaiye (column 53–55).'),
      wire('D9', 'b1.L1', 'Wire pin 9 to the button (column 53).', 'पिन 9 से बटन (कॉलम 53) तक वायर।', 'Pin 9 se button (column 53) tak wire.'),
      wire('b1.L3', 'rail:tn', 'Its other side (column 55) to the − rail.', 'इसकी दूसरी तरफ़ (कॉलम 55) − रेल से।', 'Iski doosri taraf (column 55) − rail se.'),
      CHECK,
      info('Read the code. random(1, 7) gives 1, 2, 3, 4, 5 or 6: the second number is never chosen. The tumbling waits 40 + i × 15 ms, longer each time, like a real dice slowing down.', 'कोड पढ़िए। random(1, 7) 1, 2, 3, 4, 5 या 6 देता है: दूसरी संख्या कभी नहीं चुनी जाती। लुढ़कते समय इंतज़ार 40 + i × 15 ms है, हर बार ज़्यादा, जैसे असली पासा धीमा होता है।', 'Code padhiye. random(1, 7) 1, 2, 3, 4, 5 ya 6 deta hai: doosra number kabhi nahi chuna jaata. Ludhakte waqt intezaar 40 + i × 15 ms hai, har baar zyada, jaise asli dice dheema hota hai.', null, lines(DICE, /the dice tumbles/, /int roll/)),
      RUN(),
      act((S) => numsIn(S, /You rolled: (\d+)/).length >= 3, 'Roll three times: press the button, wait, press again.', 'तीन बार पासा फेंकिए: बटन दबाइए, रुकिए, फिर दबाइए।', 'Teen baar dice phenkiye: button dabaiye, rukiye, phir dabaiye.',
        live(S0, (lg, S) => { const r = numsIn(S, /You rolled: (\d+)/); return r.length ? pick(lg, `You rolled ${r.join(', ')}. Each number has the same chance: 1 in 6.`, `आपने ${r.join(', ')} फेंका। हर संख्या का मौक़ा बराबर है: 6 में 1।`, `Aapne ${r.join(', ')} phenka. Har number ka mauka barabar hai: 6 mein 1.`) : ''; })),
      edit((src) => (src.match(/random\(1, 10\)/g) || []).length === 2, [[/random\(1, 7\)/g, 'random(1, 10)']],
        'Make a lucky-number picker for the class quiz, 1 to 9: change both random(1, 7) to random(1, 10), and press Run.', 'क्लास क्विज़ के लिए 1 से 9 तक का लकी-नंबर चुनने वाला बनाइए: दोनों random(1, 7) को random(1, 10) कीजिए, और "चलाइए" दबाइए।', 'Class quiz ke liye 1 se 9 tak ka lucky-number chunne wala banaiye: dono random(1, 7) ko random(1, 10) karo, aur Run dabaiye.'),
      act((S) => fresh(S) && numsIn(S, /You rolled: (\d+)/).some((v) => v > 6), 'Press until a number above 6 comes up.', 'तब तक दबाइए जब तक 6 से बड़ी संख्या न आए।', 'Tab tak dabaiye jab tak 6 se bada number na aaye.', t3('7, 8 or 9: numbers a dice never shows. The same display can show any digit.', '7, 8 या 9: वे संख्याएँ जो पासा कभी नहीं दिखाता। यही डिस्प्ले कोई भी अंक दिखा सकता है।', '7, 8 ya 9: woh numbers jo dice kabhi nahi dikhata. Yahi display koi bhi ank dikha sakta hai.')),
    ],
    check: [...rails2, ...segChecks, btnCheck('b1', 9, NM.btn)],
    done: (S) => numsIn(S, /You rolled: (\d+)/).some((v) => v > 6) });

  // 10 --------------------------------------------------------------------------------------- rocket countdown
  add({ id: 'countdown', cls: '7–9', view: 'wide', code: COUNTDOWN, drawer: ['servo'], serial: true,
    title: t3('Rocket launch countdown', 'रॉकेट लॉन्च उल्टी गिनती', 'Rocket launch ulti ginti'),
    goal: t3('Like at Sriharikota: count down 9 … 0 on the display with a tick each second, then a servo swings the launch arm up: lift off!', 'श्रीहरिकोटा की तरह: डिस्प्ले पर 9 … 0 उल्टी गिनती, हर सेकंड एक टिक, फिर सर्वो लॉन्च आर्म को ऊपर घुमाता है: उड़ान!', 'Sriharikota ki tarah: display par 9 … 0 ulti ginti, har second ek tick, phir servo launch arm ko upar ghumata hai: udaan!'),
    setup: merge(SEGFULL, BUZ(52, 11)),
    steps: [
      info('The display (pins 2–8) and a buzzer (pin 11) are ready. The servo will be the launch arm.', 'डिस्प्ले (पिन 2–8) और एक बज़र (पिन 11) तैयार हैं। सर्वो लॉन्च आर्म बनेगा।', 'Display (pin 2–8) aur ek buzzer (pin 11) taiyaar hain. Servo launch arm banega.'),
      place(F('sv1', 'servo', {}, 120, 120, 0), 'Put the servo on the mat at the ghost.', 'सर्वो को मैट पर नीली आकृति पर रखिए।', 'Servo ko mat par neeli shape par rakhiye.'),
      wire('sv1.GND', 'rail:bn', 'Wire the servo\'s brown wire to the front − rail.', 'सर्वो का भूरा तार आगे वाली − रेल से जोड़िए।', 'Servo ka bhoora wire aage wali − rail se jodiye.'),
      wire('sv1.VP', 'rail:bp', 'Its red wire to the front + rail (5 V).', 'इसका लाल तार आगे वाली + रेल (5 V) से।', 'Iska laal wire aage wali + rail (5 V) se.'),
      wire('sv1.SIG', 'D10', 'Its orange wire (signal) to pin 10.', 'इसका नारंगी तार (सिग्नल) पिन 10 से।', 'Iska orange wire (signal) pin 10 se.'),
      CHECK,
      info('Read the code: everything is in setup(), so it happens once. loop() is empty: after lift-off there is nothing more to do (press Run again for another launch).', 'कोड पढ़िए: सब कुछ setup() में है, इसलिए एक ही बार होता है। loop() ख़ाली है: उड़ान के बाद कुछ करने को नहीं बचता (फिर से लॉन्च के लिए "चलाइए" दबाइए)।', 'Code padhiye: sab kuch setup() mein hai, isliye ek hi baar hota hai. loop() khaali hai: udaan ke baad kuch karne ko nahi bachta (phir se launch ke liye Run dabaiye).', null, lines(COUNTDOWN, /^void setup/, /^void loop/)),
      RUN(),
      watch((S) => { const d = digitsSeen(S); return d.includes(9) && d.includes(0) && S.servoMax('sv1') > 85 && lineSeen(S, /Lift off!/); }, 'Count along and watch the launch arm.', 'साथ में गिनिए और लॉन्च आर्म देखिए।', 'Saath mein giniye aur launch arm dekhiye.',
        t3('9, 8 … 1, 0 — a long tone and the arm swings up to 90°. Lift off!', '9, 8 … 1, 0 — एक लंबी आवाज़ और आर्म 90° तक ऊपर घूमता है। उड़ान!', '9, 8 … 1, 0 — ek lambi awaaz aur arm 90° tak upar ghoomta hai. Udaan!')),
      edit((src) => { const m = /int start = (\d);/.exec(src); return !!m && +m[1] >= 3 && +m[1] <= 6; }, [[/int start = 9;/, 'int start = 5;']],
        'A test launch is shorter: change start = 9 to start = 5, and press Run.', 'टेस्ट लॉन्च छोटा होता है: start = 9 को start = 5 कीजिए, और "चलाइए" दबाइए।', 'Test launch chhota hota hai: start = 9 ko start = 5 karo, aur Run dabaiye.'),
      watch((S) => { const d = digitsSeen(S); return fresh(S) && d[0] <= 6 && d.includes(0) && lineSeen(S, /Lift off!/); }, 'Watch the short countdown.', 'छोटी उल्टी गिनती देखिए।', 'Chhoti ulti ginti dekhiye.', t3('5 … 0 and lift off. The servo went back to 0° first: write(0) in setup() puts the arm down at every start.', '5 … 0 और उड़ान। सर्वो पहले 0° पर लौटा: setup() का write(0) हर शुरुआत में आर्म नीचे कर देता है।', '5 … 0 aur udaan. Servo pehle 0° par lauta: setup() ka write(0) har shuruaat mein arm neeche kar deta hai.')),
    ],
    check: [...rails2, ...segChecks, ...buzChecks(11), ...servoChecks('sv1', 10)],
    done: (S) => S.servoMax('sv1') > 85 && /int start = [3-6];/.test(S.runSrc || '') && lineSeen(S, /Lift off!/) });

  // 11 --------------------------------------------------------------------------------------- school notice board
  add({ id: 'lcdnotice', cls: '6–8', view: 'wide', code: NOTICE, drawer: ['lcd16'], serial: false,
    title: t3('School notice board on an LCD', 'एलसीडी पर स्कूल का नोटिस बोर्ड', 'LCD par school ka notice board'),
    goal: t3('Wire a 16×2 LCD with only four wires (I2C) and make a notice board: a title that stays and a long notice that scrolls past.', 'सिर्फ़ चार तारों (I2C) से 16×2 एलसीडी जोड़िए और नोटिस बोर्ड बनाइए: एक शीर्षक जो रुका रहे और एक लंबी सूचना जो सरकती जाए।', 'Sirf chaar wires (I2C) se 16×2 LCD jodiye aur notice board banaiye: ek title jo ruka rahe aur ek lambi notice jo sarakti jaaye.'),
    setup: { parts: [], wires: POWER },
    steps: [
      info('The LCD shows two lines of 16 letters. The small board on its back (the I2C backpack) needs only power and two signal wires: SDA (data) and SCL (clock).', 'एलसीडी 16-16 अक्षरों की दो लाइनें दिखाती है। इसके पीछे का छोटा बोर्ड (I2C बैकपैक) सिर्फ़ बिजली और दो सिग्नल तार लेता है: SDA (डेटा) और SCL (क्लॉक)।', 'LCD 16-16 letters ki do lines dikhati hai. Iske peeche ka chhota board (I2C backpack) sirf power aur do signal wire leta hai: SDA (data) aur SCL (clock).'),
      place(LCD(), 'Put the LCD on the mat at the ghost, in front of the board.', 'एलसीडी को मैट पर नीली आकृति पर, बोर्ड के सामने रखिए।', 'LCD ko mat par neeli shape par, board ke saamne rakhiye.'),
      ...lcdSteps(t3('A4 and A5 are the Uno\'s I2C pins. Many modules can share them, each at its own address (this LCD: 0x27).', 'A4 और A5 Uno के I2C पिन हैं। कई मॉड्यूल इन्हें बाँट सकते हैं, हर एक अपने पते पर (यह एलसीडी: 0x27)।', 'A4 aur A5 Uno ke I2C pins hain. Kai module inhe share kar sakte hain, har ek apne address par (yeh LCD: 0x27).')),
      CHECK,
      info('Read the code. The notice gets 16 spaces before and after it; substring(i, i + 16) cuts a 16-letter window out of it, and each time i grows by one, the window slides one letter on.', 'कोड पढ़िए। सूचना के पहले और बाद में 16 ख़ाली जगहें जोड़ी जाती हैं; substring(i, i + 16) उसमें से 16 अक्षरों की खिड़की काटता है, और हर बार i एक बढ़ता है तो खिड़की एक अक्षर आगे सरकती है।', 'Code padhiye. Notice ke pehle aur baad mein 16 khaali jagah jodi jaati hain; substring(i, i + 16) usmein se 16 letters ki khidki kaat-ta hai, aur har baar i ek badhta hai to khidki ek letter aage sarakti hai.', null, lines(NOTICE, /String text/, /delay\(250\)/)),
      RUN(),
      watch((S) => lcdSeen(S, /^DUET School News$/) && lcdSeen(S, /Sports day/), 'Read the notice board.', 'नोटिस बोर्ड पढ़िए।', 'Notice board padhiye.', t3('The title stays still on the top line; the notice slides along the bottom one, four letters a second.', 'शीर्षक ऊपर की लाइन पर रुका रहता है; सूचना नीचे की लाइन पर सरकती है, सेकंड में चार अक्षर।', 'Title upar ki line par ruka rehta hai; notice neeche ki line par sarakti hai, second mein chaar letters.')),
      edit((src) => { const m = /String notice = "([^"]{8,})";/.exec(src); return !!m && !/^Sports day on Friday/.test(m[1]); }, [[/Sports day on Friday! Bring your water bottle and cap\./, 'Science fair on Monday: bring your projects to the hall!']],
        'Write your own notice between the quotes of String notice = "…"; (at least 8 letters), and press Run.', 'String notice = "…"; के उद्धरण चिह्नों के बीच अपनी सूचना लिखिए (कम से कम 8 अक्षर), और "चलाइए" दबाइए।', 'String notice = "…"; ke quotes ke beech apni notice likhiye (kam se kam 8 letters), aur Run dabaiye.'),
      watch((S) => { const m = /String notice = "([^"]+)";/.exec(S.runSrc || ''); const w = m && (m[1].match(/[A-Za-z0-9]{3,}/) || [])[0]; return fresh(S) && !!w && lcdSeen(S, new RegExp(w)); }, 'Watch your notice scroll.', 'अपनी सूचना को सरकते देखिए।', 'Apni notice ko sarakte dekhiye.',
        t3('Your own news on the board. A longer notice only takes longer to pass: the loop goes on to text.length() - 16.', 'बोर्ड पर आपकी अपनी ख़बर। लंबी सूचना बस ज़्यादा देर में निकलती है: लूप text.length() - 16 तक चलता है।', 'Board par aapki apni khabar. Lambi notice bas zyada der mein nikalti hai: loop text.length() - 16 tak chalta hai.')),
    ],
    check: [...rails2, ...lcdChecks()],
    done: (S) => lcdSeen(S, /^DUET School News$/) && !/Sports day on Friday/.test(S.runSrc || '') });

  // 12 --------------------------------------------------------------------------------------- distance meter
  add({ id: 'lcddist', cls: '7–9', view: 'wide', code: DIST, drawer: ['hcsr04'], serial: false,
    title: t3('Distance meter with an LCD', 'एलसीडी वाला दूरी मीटर', 'LCD wala doori meter'),
    goal: t3('A measuring tape made of sound: the ultrasonic sensor measures, the LCD shows the centimetres and a bar, and warns when something is too close.', 'आवाज़ से बना नापने का फ़ीता: अल्ट्रासोनिक सेंसर नापता है, एलसीडी सेंटीमीटर और एक पट्टी दिखाती है, और कोई चीज़ बहुत पास हो तो चेतावनी देती है।', 'Awaaz se bana naapne ka feeta: ultrasonic sensor naapta hai, LCD centimetre aur ek patti dikhati hai, aur koi cheez bahut paas ho to warning deti hai.'),
    setup: { parts: [LCD()], wires: [...POWER, ...LCDWIRES] },
    steps: [
      info('The LCD is ready (A4, A5). Add the HC-SR04: it sends a click of sound too high to hear and times the echo.', 'एलसीडी तैयार है (A4, A5)। HC-SR04 जोड़िए: यह इतनी ऊँची आवाज़ की क्लिक भेजता है कि सुनाई न दे, और गूँज का समय नापता है।', 'LCD taiyaar hai (A4, A5). HC-SR04 jodiye: yeh itni oonchi awaaz ki click bhejta hai ki sunai na de, aur echo ka time naapta hai.'),
      ...usSteps(9, 10),
      CHECK,
      RUN(t3('About "Distance: 39 cm" and a bar of #, one for every 10 cm: the wooden block is 40 cm away.', 'लगभग "Distance: 39 cm" और # की पट्टी, हर 10 cm का एक: लकड़ी का ब्लॉक 40 cm दूर है।', 'Lagbhag "Distance: 39 cm" aur # ki patti, har 10 cm ka ek: lakdi ka block 40 cm door hai.')),
      act((S) => lcdNow(S, /Distance: (2[6-9]|3[0-4]) cm/) && lcdNow(S, /^#{2,3}$/), 'Tap the sensor and slide the block to 30 cm.', 'सेंसर को छूइए और ब्लॉक को 30 cm पर लाइए।', 'Sensor ko touch karo aur block ko 30 cm par laiye.',
        t3('Sound goes 0.034 cm in a microsecond. 30 cm there and back takes about 1760 µs: × 0.034 ÷ 2 = 30.', 'आवाज़ एक माइक्रोसेकंड में 0.034 cm चलती है। 30 cm जाने-आने में लगभग 1760 µs: × 0.034 ÷ 2 = 30।', 'Awaaz ek microsecond mein 0.034 cm chalti hai. 30 cm jaane-aane mein lagbhag 1760 µs: × 0.034 ÷ 2 = 30.')),
      act((S) => lcdNow(S, /TOO CLOSE!/), 'Now bring it closer than 10 cm.', 'अब इसे 10 cm से पास लाइए।', 'Ab ise 10 cm se paas laiye.', t3('"TOO CLOSE!": the if checks the number before the bar is drawn.', '"TOO CLOSE!": पट्टी बनाने से पहले if संख्या जाँचता है।', '"TOO CLOSE!": patti banane se pehle if number jaanchta hai.')),
      edit((src) => { const m = /int warn = (\d+);/.exec(src); return !!m && +m[1] >= 18 && +m[1] <= 30; }, [[/int warn = 10;/, 'int warn = 20;']],
        'For a car\'s bumper 10 cm is too late: change warn = 10 to warn = 20, and press Run.', 'गाड़ी के बंपर के लिए 10 cm बहुत देर है: warn = 10 को warn = 20 कीजिए, और "चलाइए" दबाइए।', 'Gaadi ke bumper ke liye 10 cm bahut der hai: warn = 10 ko warn = 20 karo, aur Run dabaiye.'),
      act((S) => fresh(S) && lcdNow(S, /TOO CLOSE!/) && (S.part('us1') || { state: {} }).state.dist >= 12, 'Put the block at 15 cm.', 'ब्लॉक को 15 cm पर रखिए।', 'Block ko 15 cm par rakhiye.', t3('Warned already at 15 cm. One number in the sketch changes how the whole gadget behaves.', '15 cm पर ही चेतावनी। स्केच की एक संख्या पूरे गैजेट का बर्ताव बदल देती है।', '15 cm par hi warning. Sketch ka ek number poore gadget ka bartaav badal deta hai.')),
    ],
    check: [...rails2, ...lcdChecks(), ...usChecks(9, 10)],
    done: (S) => /int warn = (1[89]|2\d|30);/.test(S.runSrc || '') && lcdSeen(S, /TOO CLOSE!/) });

  // 13 --------------------------------------------------------------------------------------- speed gun
  add({ id: 'speedgun', cls: '8–9', view: 'wide', code: SPEED, drawer: ['ir'], serial: true,
    title: t3('Speed gun: two light gates', 'स्पीड गन: दो लाइट गेट', 'Speed gun: do light gate'),
    goal: t3('Measure speed like a traffic camera: the time a toy car takes between two IR sensors 10 cm apart, and speed = distance ÷ time.', 'ट्रैफ़िक कैमरे की तरह रफ़्तार नापिए: खिलौना कार को 10 cm दूर दो आईआर सेंसरों के बीच लगा समय, और रफ़्तार = दूरी ÷ समय।', 'Traffic camera ki tarah speed naapiye: khilona car ko 10 cm door do IR sensors ke beech laga time, aur speed = doori ÷ time.'),
    setup: { parts: [LCD(), F('g1', 'ir', {}, -10, 100, 2)], wires: [...POWER, ...LCDWIRES, ...irWires('g1', 2, rail('bp', 30), rail('bn', 30))] },
    steps: [
      info('Gate 1 (an IR sensor on pin 2) and the LCD are ready. Gate 2 goes 10 cm further along the track.', 'गेट 1 (पिन 2 पर एक आईआर सेंसर) और एलसीडी तैयार हैं। गेट 2 पटरी पर 10 cm आगे लगेगा।', 'Gate 1 (pin 2 par ek IR sensor) aur LCD taiyaar hain. Gate 2 track par 10 cm aage lagega.'),
      place(F('g2', 'ir', {}, 90, 100, 2), 'Put the second IR sensor (gate 2) on the mat at the ghost.', 'दूसरा आईआर सेंसर (गेट 2) मैट पर नीली आकृति पर रखिए।', 'Doosra IR sensor (gate 2) mat par neeli shape par rakhiye.'),
      wire('g2.VCC', 'rail:bp', 'Wire its VCC to the front + rail.', 'इसका VCC आगे वाली + रेल से जोड़िए।', 'Iska VCC aage wali + rail se jodiye.'),
      wire('g2.GND', 'rail:bn', 'Its GND to the front − rail.', 'इसका GND आगे वाली − रेल से।', 'Iska GND aage wali − rail se.'),
      wire('g2.OUT', 'D3', 'Its OUT to pin 3.', 'इसका OUT पिन 3 से।', 'Iska OUT pin 3 se.'),
      CHECK,
      info('Read the code: millis() when the car reaches gate 1 is kept in t1, and when it reaches gate 2 in t2. t2 - t1 is the time; 10 cm divided by the time is the speed.', 'कोड पढ़िए: कार के गेट 1 पर पहुँचने का millis() t1 में रखा जाता है, और गेट 2 पर पहुँचने का t2 में। t2 - t1 समय है; 10 cm को समय से भाग देने पर रफ़्तार मिलती है।', 'Code padhiye: car ke gate 1 par pahunchne ka millis() t1 mein rakha jaata hai, aur gate 2 par pahunchne ka t2 mein. t2 - t1 time hai; 10 cm ko time se bhaag dene par speed milti hai.', null, lines(SPEED, /the car reaches gate 1/, /float speed/)),
      RUN(t3('"Speed gun ready".', '"Speed gun ready"।', '"Speed gun ready".')),
      act((S) => numsIn(S, /([\d.]+) cm\/s/).length >= 1, 'Be the car: tap gate 1 and slide its block close (under 10 cm), then do the same at gate 2. Then move both blocks away.', 'कार बनिए: गेट 1 को छूकर उसका ब्लॉक पास लाइए (10 cm से कम), फिर गेट 2 के साथ भी यही कीजिए। फिर दोनों ब्लॉक दूर कर दीजिए।', 'Car baniye: gate 1 ko touch karke uska block paas laiye (10 cm se kam), phir gate 2 ke saath bhi yahi kijiye. Phir dono block door kar dijiye.',
        live(S0, (lg, S) => { const v = numsIn(S, /([\d.]+) cm\/s/); return v.length ? pick(lg, `${v[0].toFixed(1)} cm/s: 10 cm in ${(10 / v[0]).toFixed(2)} s.`, `${v[0].toFixed(1)} cm/s: ${(10 / v[0]).toFixed(2)} सेकंड में 10 cm।`, `${v[0].toFixed(1)} cm/s: ${(10 / v[0]).toFixed(2)} second mein 10 cm.`) : ''; })),
      act((S) => { const v = numsIn(S, /([\d.]+) cm\/s/); return v.length >= 2 && v[v.length - 1] > 1.5 * v[0]; }, 'Now be a faster car: do it again, quicker.', 'अब तेज़ कार बनिए: फिर से कीजिए, और जल्दी।', 'Ab tez car baniye: phir se kijiye, aur jaldi.',
        live(S0, (lg, S) => { const v = numsIn(S, /([\d.]+) cm\/s/); return v.length >= 2 ? pick(lg, `${v[v.length - 1].toFixed(1)} cm/s this time. Less time for the same 10 cm means more speed.`, `इस बार ${v[v.length - 1].toFixed(1)} cm/s। उसी 10 cm के लिए कम समय, यानी ज़्यादा रफ़्तार।`, `Is baar ${v[v.length - 1].toFixed(1)} cm/s. Usi 10 cm ke liye kam time, matlab zyada speed.`) : ''; })),
    ],
    check: [...rails2, ...lcdChecks(), ...irChecks('g1', 2, t3('gate 1', 'गेट 1', 'gate 1')), ...irChecks('g2', 3, t3('gate 2', 'गेट 2', 'gate 2'))],
    done: (S) => { const v = numsIn(S, /([\d.]+) cm\/s/); return v.length >= 2 && v[v.length - 1] > 1.5 * v[0]; } });

  // 14 --------------------------------------------------------------------------------------- visitor counter
  add({ id: 'visitors', cls: '7–9', view: 'wide', code: VISITORS, drawer: ['led', 'resistor'], serial: false,
    title: t3('Classroom visitor counter', 'कक्षा में आने-जाने वालों का काउंटर', 'Class mein aane-jaane walon ka counter'),
    goal: t3('Count people coming in through one door and going out through the other, show how many are inside, and light a lamp when the room is full.', 'एक दरवाज़े से अंदर आने और दूसरे से बाहर जाने वालों को गिनिए, अंदर कितने हैं यह दिखाइए, और कमरा भर जाए तो लैंप जलाइए।', 'Ek darwaze se andar aane aur doosre se bahar jaane walon ko giniye, andar kitne hain yeh dikhaiye, aur kamra bhar jaaye to lamp jalaiye.'),
    setup: { parts: [LCD(), F('din', 'ir', {}, -10, 100, 2), F('dout', 'ir', {}, 90, 100, 2)], wires: [...POWER, ...LCDWIRES, ...irWires('din', 2, rail('bp', 30), rail('bn', 30)), ...irWires('dout', 3, rail('bp', 55), rail('bn', 55))] },
    steps: [
      info('The IN door\'s sensor (pin 2), the OUT door\'s sensor (pin 3) and the LCD are ready. Add a red "room full" lamp on pin 12.', 'अंदर वाले दरवाज़े का सेंसर (पिन 2), बाहर वाले का सेंसर (पिन 3) और एलसीडी तैयार हैं। पिन 12 पर लाल "कमरा भरा" लैंप जोड़िए।', 'Andar wale darwaze ka sensor (pin 2), bahar wale ka sensor (pin 3) aur LCD taiyaar hain. Pin 12 par red "kamra bhara" lamp jodiye.'),
      place(PL('led1', 'led', { color: 'red' }, 'e22', 0), 'Put the red LED in the ghost: long leg in 23e.', 'लाल एलईडी नीली आकृति में रखिए: लंबा पैर 23e में।', 'Red LED neeli shape mein rakhiye: lamba pair 23e mein.'),
      place(PL('r1', 'resistor', { ohms: 220 }, 'b22', 3), 'Its 220 Ω resistor: 22b to the − rail.', 'इसका 220 Ω रेज़िस्टर: 22b से − रेल तक।', 'Iska 220 Ω resistor: 22b se − rail tak.'),
      wire('D12', 'led1.A', 'Wire pin 12 to the LED\'s long leg (column 23).', 'पिन 12 से एलईडी के लंबे पैर (कॉलम 23) तक वायर।', 'Pin 12 se LED ke lambe pair (column 23) tak wire.'),
      CHECK,
      info('Read the code: people++ adds one, people-- takes one away. The empty while loop waits until the person has passed, so one person is counted once, however slowly they walk.', 'कोड पढ़िए: people++ एक जोड़ता है, people-- एक घटाता है। ख़ाली while लूप तब तक रुकता है जब तक इंसान निकल न जाए, ताकि हर इंसान एक ही बार गिना जाए, चाहे कितना भी धीरे चले।', 'Code padhiye: people++ ek jodta hai, people-- ek ghatata hai. Khaali while loop tab tak rukta hai jab tak insaan nikal na jaaye, taaki har insaan ek hi baar gina jaaye, chahe kitna bhi dheere chale.', null, lines(VISITORS, /^void loop/, /^}/)),
      RUN(t3('"In the room: 0".', '"In the room: 0"।', '"In the room: 0".')),
      act((S) => lcdNow(S, /In the room: 3/), 'Three students come in: at the IN sensor, slide the block close and away again, three times.', 'तीन विद्यार्थी अंदर आते हैं: अंदर वाले सेंसर पर ब्लॉक को पास लाइए और फिर दूर कीजिए, तीन बार।', 'Teen students andar aate hain: andar wale sensor par block ko paas laiye aur phir door kijiye, teen baar.', t3('3: one for each time the beam was broken.', '3: हर बार किरण टूटने पर एक।', '3: har baar kiran tootne par ek.')),
      act((S) => lcdNow(S, /In the room: 2/), 'One goes out: do the same once at the OUT sensor.', 'एक बाहर जाता है: बाहर वाले सेंसर पर एक बार यही कीजिए।', 'Ek bahar jaata hai: bahar wale sensor par ek baar yahi kijiye.', t3('2. The count can never go below 0: the sketch checks people > 0.', '2। गिनती कभी 0 से नीचे नहीं जाती: स्केच people > 0 जाँचता है।', '2. Ginti kabhi 0 se neeche nahi jaati: sketch people > 0 jaanchta hai.')),
      edit((src) => /int limit = 3;/.test(src), [[/int limit = 5;/, 'int limit = 3;']], 'The computer lab has room for only 3: change limit = 5 to limit = 3, and press Run.', 'कंप्यूटर लैब में सिर्फ़ 3 की जगह है: limit = 5 को limit = 3 कीजिए, और "चलाइए" दबाइए।', 'Computer lab mein sirf 3 ki jagah hai: limit = 5 ko limit = 3 karo, aur Run dabaiye.'),
      act((S) => fresh(S) && lcdNow(S, /ROOM FULL!/) && S.ledLit('led1'), 'The count starts again at 0. Let three students in.', 'गिनती फिर 0 से शुरू होती है। तीन विद्यार्थियों को अंदर आने दीजिए।', 'Ginti phir 0 se shuru hoti hai. Teen students ko andar aane dijiye.', t3('"ROOM FULL!" and the red lamp: the teacher at the door can see it.', '"ROOM FULL!" और लाल लैंप: दरवाज़े पर खड़े टीचर इसे देख सकते हैं।', '"ROOM FULL!" aur red lamp: darwaze par khade teacher ise dekh sakte hain.')),
    ],
    check: [...rails2, ...lcdChecks(), unit('led1', 'r1', 12, NM.red), ...irChecks('din', 2, t3('IN sensor', 'अंदर वाला सेंसर', 'andar wala sensor')), ...irChecks('dout', 3, t3('OUT sensor', 'बाहर वाला सेंसर', 'bahar wala sensor'))],
    done: (S) => /int limit = 3;/.test(S.runSrc || '') && lcdSeen(S, /ROOM FULL!/) });

  // 15 --------------------------------------------------------------------------------------- radar
  add({ id: 'radar', cls: '9–10', view: 'wide', code: RADAR, drawer: ['oled'], serial: true,
    title: t3('Radar screen on an OLED', 'OLED पर रडार स्क्रीन', 'OLED par radar screen'),
    goal: t3('A servo sweeps an ultrasonic sensor from side to side, and an OLED draws a radar: the sweep line and a dot wherever something is found.', 'एक सर्वो अल्ट्रासोनिक सेंसर को एक ओर से दूसरी ओर घुमाता है, और OLED रडार बनाती है: घूमती लाइन और जहाँ कुछ मिले वहाँ एक बिंदु।', 'Ek servo ultrasonic sensor ko ek taraf se doosri taraf ghumata hai, aur OLED radar banati hai: ghoomti line aur jahan kuch mile wahan ek dot.'),
    setup: merge(US(9, 10), { parts: [F('sv1', 'servo', {}, 118, 118, 0)], wires: [...POWER, ['T:sv1:GND', rail('bn', 45)], ['T:sv1:VP', rail('bp', 45)], ['T:sv1:SIG', 'D6']] }),
    steps: [
      info('The ultrasonic sensor (pins 9, 10) and the servo that turns it (pin 6) are ready. On a real radar the sensor sits on the servo\'s arm.', 'अल्ट्रासोनिक सेंसर (पिन 9, 10) और उसे घुमाने वाला सर्वो (पिन 6) तैयार हैं। असली रडार में सेंसर सर्वो की भुजा पर बैठा होता है।', 'Ultrasonic sensor (pin 9, 10) aur use ghumane wala servo (pin 6) taiyaar hain. Asli radar mein sensor servo ki bhuja par baitha hota hai.'),
      ...oledSteps,
      CHECK,
      info('Read draw(): cos() and sin() turn an angle and a distance into a point on the screen (x = 64 + r cos a, y = 63 − r sin a), the same maths as a ship\'s radar.', 'draw() पढ़िए: cos() और sin() किसी कोण और दूरी को स्क्रीन के एक बिंदु में बदलते हैं (x = 64 + r cos a, y = 63 − r sin a), वही गणित जो जहाज़ के रडार में है।', 'draw() padhiye: cos() aur sin() kisi angle aur doori ko screen ke ek point mein badalte hain (x = 64 + r cos a, y = 63 − r sin a), wahi ganit jo jahaaz ke radar mein hai.', null, lines(RADAR, /^void draw/, /display\.display/)),
      RUN(),
      watch((S) => S.servoRange('sv1') >= 150 && oledLitNow(S) > 150, 'Watch the servo sweep and the screen.', 'सर्वो का घूमना और स्क्रीन देखिए।', 'Servo ka ghoomna aur screen dekhiye.', t3('0° to 180° and back, 10° at a time. The block 40 cm away shows as a ring of dots inside the 50 cm edge.', '0° से 180° और वापस, हर बार 10°। 40 cm दूर का ब्लॉक 50 cm वाले किनारे के अंदर बिंदुओं के घेरे जैसा दिखता है।', '0° se 180° aur wapas, har baar 10°. 40 cm door ka block 50 cm wale kinare ke andar dots ke ghere jaisa dikhta hai.')),
      act((S) => numsIn(S, /deg: (\d+) cm/).filter((v) => v >= 15 && v <= 25).length >= 3, 'Tap the sensor and bring the block to 20 cm.', 'सेंसर को छूइए और ब्लॉक को 20 cm पर लाइए।', 'Sensor ko touch karo aur block ko 20 cm par laiye.', t3('The dots move in, closer to the centre: 20 cm is 24 dots from the middle (20 × 60 ÷ 50).', 'बिंदु अंदर, बीच के पास आ जाते हैं: 20 cm बीच से 24 बिंदु दूर है (20 × 60 ÷ 50)।', 'Dots andar, beech ke paas aa jaate hain: 20 cm beech se 24 dots door hai (20 × 60 ÷ 50).')),
      edit((src) => /int range = 100;/.test(src), [[/int range = 50;/, 'int range = 100;']], 'See further: change range = 50 to range = 100, and press Run.', 'और दूर देखिए: range = 50 को range = 100 कीजिए, और "चलाइए" दबाइए।', 'Aur door dekhiye: range = 50 ko range = 100 karo, aur Run dabaiye.'),
      act((S) => fresh(S) && numsIn(S, /deg: (\d+) cm/).filter((v) => v >= 60 && v <= 95).length >= 3, 'Move the block to 80 cm.', 'ब्लॉक को 80 cm पर ले जाइए।', 'Block ko 80 cm par le jaiye.', t3('At 80 cm it is still on the screen: the edge now means 100 cm, so every distance is drawn half as far out.', '80 cm पर भी यह स्क्रीन पर है: अब किनारा 100 cm है, इसलिए हर दूरी आधी दूरी पर बनती है।', '80 cm par bhi yeh screen par hai: ab kinara 100 cm hai, isliye har doori aadhi doori par banti hai.')),
    ],
    check: [...rails2, ...oledChecks, ...usChecks(9, 10), ...servoChecks('sv1', 6)],
    done: (S) => /int range = 100;/.test(S.runSrc || '') && S.servoRange('sv1') >= 150 });

  // 16 --------------------------------------------------------------------------------------- etch-a-sketch
  add({ id: 'sketch', cls: '7–9', view: 'wide', code: SKETCH, drawer: ['joystick'], serial: false,
    title: t3('Etch-a-sketch with a joystick', 'जॉयस्टिक से ड्रॉइंग बोर्ड', 'Joystick se drawing board'),
    goal: t3('Draw on the OLED with a joystick: push it and the pen leaves a line; press the stick down to wipe the screen clean.', 'जॉयस्टिक से OLED पर चित्र बनाइए: उसे धकेलिए और पेन एक लाइन छोड़ता जाता है; स्टिक दबाइए तो स्क्रीन साफ़।', 'Joystick se OLED par chitra banaiye: use dhakeliye aur pen ek line chhodta jaata hai; stick dabaiye to screen saaf.'),
    setup: merge(OLEDPRE, { wires: POWER }),
    steps: [
      info('The OLED is ready. A joystick is two knobs at right angles under one stick, plus a switch you press by pushing the stick down.', 'OLED तैयार है। जॉयस्टिक एक स्टिक के नीचे आपस में समकोण पर दो नॉब हैं, और एक स्विच जो स्टिक नीचे दबाने पर दबता है।', 'OLED taiyaar hai. Joystick ek stick ke neeche aapas mein samkon par do knob hain, aur ek switch jo stick neeche dabane par dabta hai.'),
      place(F('js', 'joystick', {}, -60, 110, 0), 'Put the joystick on the mat at the ghost.', 'जॉयस्टिक को मैट पर नीली आकृति पर रखिए।', 'Joystick ko mat par neeli shape par rakhiye.'),
      wire('js.GND', 'rail:bn', 'Wire its GND to the front − rail.', 'इसका GND आगे वाली − रेल से जोड़िए।', 'Iska GND aage wali − rail se jodiye.'),
      wire('js.V5', 'rail:bp', 'Its +5V to the front + rail.', 'इसका +5V आगे वाली + रेल से।', 'Iska +5V aage wali + rail se.'),
      wire('js.VRX', 'A0', 'VRx (left–right) to A0.', 'VRx (बाएँ–दाएँ) A0 से।', 'VRx (left–right) A0 se.'),
      wire('js.VRY', 'A1', 'VRy (up–down) to A1.', 'VRy (ऊपर–नीचे) A1 से।', 'VRy (upar–neeche) A1 se.'),
      wire('js.SW', 'D2', 'SW (the switch) to pin 2.', 'SW (स्विच) पिन 2 से।', 'SW (switch) pin 2 se.'),
      CHECK,
      RUN(t3('A single dot in the middle: the pen.', 'बीच में एक बिंदु: पेन।', 'Beech mein ek dot: pen.')),
      act((S) => (S.memRun.oledMax || 0) >= 40, 'Drag the joystick\'s cap and hold it to the right, then up: draw a line.', 'जॉयस्टिक की टोपी खींचकर दाईं ओर, फिर ऊपर पकड़े रखिए: एक लाइन बनाइए।', 'Joystick ki topi kheench kar right, phir upar pakde rakhiye: ek line banaiye.', t3('Each loop the pen moves one dot and drawPixel() leaves it lit: a line grows.', 'हर लूप में पेन एक बिंदु चलता है और drawPixel() उसे जला छोड़ता है: लाइन बढ़ती जाती है।', 'Har loop mein pen ek dot chalta hai aur drawPixel() use jala chhodta hai: line badhti jaati hai.')),
      act((S) => (S.memRun.oledMax || 0) >= 40 && oledLitNow(S) <= 2, 'Wipe it: press the stick down (tap the joystick and press, or click its cap).', 'मिटाइए: स्टिक को नीचे दबाइए (जॉयस्टिक को छूकर दबाइए, या उसकी टोपी पर क्लिक)।', 'Mitaiye: stick ko neeche dabaiye (joystick ko touch karke dabaiye, ya uski topi par click).', t3('clearDisplay() wipes the picture; only the pen\'s dot is drawn again.', 'clearDisplay() तस्वीर मिटा देता है; सिर्फ़ पेन का बिंदु फिर बनता है।', 'clearDisplay() picture mita deta hai; sirf pen ka dot phir banta hai.')),
      edit((src) => /display\.fillCircle\(x, y, 1, SSD1306_WHITE\);/.test(src), [[/display\.drawPixel\(x, y, SSD1306_WHITE\);/, 'display.fillCircle(x, y, 1, SSD1306_WHITE);']],
        'A thicker pen: change display.drawPixel(x, y, SSD1306_WHITE); to display.fillCircle(x, y, 1, SSD1306_WHITE); and press Run.', 'मोटा पेन: display.drawPixel(x, y, SSD1306_WHITE); को display.fillCircle(x, y, 1, SSD1306_WHITE); कीजिए और "चलाइए" दबाइए।', 'Mota pen: display.drawPixel(x, y, SSD1306_WHITE); ko display.fillCircle(x, y, 1, SSD1306_WHITE); karo aur Run dabaiye.'),
      act((S) => fresh(S) && (S.memRun.oledMax || 0) >= 100, 'Draw again.', 'फिर से चित्र बनाइए।', 'Phir se chitra banaiye.', t3('A line three dots wide. Now try to write your initial!', 'तीन बिंदु चौड़ी लाइन। अब अपना पहला अक्षर लिखने की कोशिश कीजिए!', 'Teen dot chaudi line. Ab apna pehla akshar likhne ki koshish kijiye!')),
    ],
    check: [...rails2, ...oledChecks, has('js', N.js || t3('joystick', 'जॉयस्टिक', 'joystick')), need('js.GND', 'GND', W.toGnd, { x: t3('joystick\'s GND', 'जॉयस्टिक का GND', 'joystick ka GND') }), need('js.V5', '5V', W.to5v, { x: t3('joystick\'s +5V', 'जॉयस्टिक का +5V', 'joystick ka +5V') }),
      (S) => (S.conn('js.VRX', 'A1') && S.conn('js.VRY', 'A0') ? [X.jsSwap] : null), need('js.VRX', 'A0', W.join, { a: 'VRx', b: 'A0' }), need('js.VRY', 'A1', W.join, { a: 'VRy', b: 'A1' }), need('js.SW', 'D2', W.toPin, { x: 'SW', p: 2 })],
    done: (S) => /fillCircle\(x, y, 1/.test(S.runSrc || '') && (S.memRun.oledMax || 0) >= 100 });

  // 17 --------------------------------------------------------------------------------------- calculator
  add({ id: 'calc', cls: '8–10', view: 'wide', code: CALC, drawer: ['lcd16'], serial: false,
    title: t3('Pocket calculator: keypad and LCD', 'पॉकेट कैलकुलेटर: कीपैड और एलसीडी', 'Pocket calculator: keypad aur LCD'),
    goal: t3('Build a calculator: type numbers on the 4×4 keypad, A B C D are + − × ÷, # gives the answer on the LCD.', 'कैलकुलेटर बनाइए: 4×4 कीपैड पर संख्याएँ टाइप कीजिए, A B C D हैं + − × ÷, # एलसीडी पर जवाब देता है।', 'Calculator banaiye: 4×4 keypad par numbers type kijiye, A B C D hain + − × ÷, # LCD par jawab deta hai.'),
    setup: merge(KEYPAD, { wires: POWER }),
    steps: [
      info('The keypad is wired (its rows to pins 9–6, its columns to 5–2). Add the LCD for the answers.', 'कीपैड जुड़ा है (पंक्तियाँ पिन 9–6 पर, कॉलम 5–2 पर)। जवाबों के लिए एलसीडी जोड़िए।', 'Keypad juda hai (rows pin 9–6 par, columns 5–2 par). Jawabon ke liye LCD jodiye.'),
      place(LCD(), 'Put the LCD on the mat at the ghost.', 'एलसीडी को मैट पर नीली आकृति पर रखिए।', 'LCD ko mat par neeli shape par rakhiye.'),
      ...lcdSteps(),
      CHECK,
      info('Read the code. typed collects the digits as text; toInt() turns "12" into the number 12. A sign key saves the first number; # works out first (sign) second.', 'कोड पढ़िए। typed अंकों को टेक्स्ट की तरह जोड़ता है; toInt() "12" को संख्या 12 बना देता है। चिह्न वाला बटन पहली संख्या रख लेता है; # पहली (चिह्न) दूसरी का हिसाब करता है।', 'Code padhiye. typed digits ko text ki tarah jodta hai; toInt() "12" ko number 12 bana deta hai. Sign wala button pehla number rakh leta hai; # pehla (sign) doosra ka hisaab karta hai.', null, lines(CALC, /^long calculate/, /return b;/)),
      RUN(t3('"Calculator".', '"Calculator"।', '"Calculator".')),
      act((S) => lcdNow(S, /^12\+30$/) && lcdNow(S, /^= 42$/), 'Work out 12 + 30: press 1 2 A 3 0 # on the keypad.', '12 + 30 का हिसाब कीजिए: कीपैड पर 1 2 A 3 0 # दबाइए।', '12 + 30 ka hisaab kijiye: keypad par 1 2 A 3 0 # dabaiye.', t3('= 42. The top line shows what you typed, the bottom line the answer.', '= 42। ऊपर की लाइन आपका टाइप किया दिखाती है, नीचे की लाइन जवाब।', '= 42. Upar ki line aapka type kiya dikhati hai, neeche ki line jawab.')),
      act((S) => lcdNow(S, /^7\/2$/) && lcdNow(S, /^= 3$/), 'Now 7 ÷ 2: press 7 D 2 #.', 'अब 7 ÷ 2: 7 D 2 # दबाइए।', 'Ab 7 ÷ 2: 7 D 2 # dabaiye.', t3('= 3, not 3.5! A long holds whole numbers only, so the .5 is dropped. A float could keep it.', '= 3, 3.5 नहीं! long सिर्फ़ पूरी संख्याएँ रखता है, इसलिए .5 छूट जाता है। float उसे रख सकता है।', '= 3, 3.5 nahi! long sirf poori sankhya rakhta hai, isliye .5 chhoot jaata hai. float use rakh sakta hai.')),
      act((S) => lcdNow(S, /Error: \/ by 0/), 'Try 5 ÷ 0: press 5 D 0 #.', '5 ÷ 0 आज़माइए: 5 D 0 # दबाइए।', '5 ÷ 0 aazmaiye: 5 D 0 # dabaiye.', t3('"Error": nothing can be divided by 0, so the sketch checks before it divides.', '"Error": किसी भी संख्या को 0 से भाग नहीं दे सकते, इसलिए स्केच भाग देने से पहले जाँचता है।', '"Error": kisi bhi number ko 0 se bhaag nahi de sakte, isliye sketch bhaag dene se pehle jaanchta hai.')),
    ],
    check: [...rails2, ...kpChecks, ...lcdChecks()],
    done: (S) => lcdSeen(S, /^= 42$/) && lcdSeen(S, /^= 3$/) && lcdSeen(S, /Error/) });

  // 18 --------------------------------------------------------------------------------------- times-table quiz
  add({ id: 'mathquiz', cls: '6–8', view: 'wide', code: MATHQUIZ, drawer: ['buzzer'], serial: false,
    title: t3('Times-table quiz master', 'पहाड़ों का क्विज़ मास्टर', 'Pahadon ka quiz master'),
    goal: t3('A quiz machine for the class: it asks a times-table question on the LCD, you answer on the keypad, and it beeps and keeps your score.', 'कक्षा के लिए क्विज़ मशीन: यह एलसीडी पर पहाड़े का सवाल पूछती है, आप कीपैड पर जवाब देते हैं, और यह बीप करके आपका स्कोर रखती है।', 'Class ke liye quiz machine: yeh LCD par pahade ka sawaal poochti hai, aap keypad par jawab dete hain, aur yeh beep karke aapka score rakhti hai.'),
    setup: merge(KEYPAD, { parts: [LCD()], wires: [...POWER, ...LCDWIRES] }),
    steps: [
      info('The keypad and the LCD from the calculator are ready. Add a buzzer on pin 10 for the right and wrong beeps.', 'कैलकुलेटर वाले कीपैड और एलसीडी तैयार हैं। सही और ग़लत की बीप के लिए पिन 10 पर बज़र जोड़िए।', 'Calculator wale keypad aur LCD taiyaar hain. Sahi aur galat ki beep ke liye pin 10 par buzzer jodiye.'),
      place(PL('bz1', 'buzzer', {}, 'e52', 0), 'Put the buzzer in the ghost: + leg in 52e.', 'बज़र नीली आकृति में रखिए: + पैर 52e में।', 'Buzzer neeli shape mein rakhiye: + pair 52e mein.'),
      wire('D10', 'bz1.P', 'Wire pin 10 to the buzzer\'s + leg (column 52).', 'पिन 10 से बज़र के + पैर (कॉलम 52) तक वायर।', 'Pin 10 se buzzer ke + pair (column 52) tak wire.'),
      wire('bz1.N', 'rail:tn', 'Its − leg (column 55) to the − rail.', 'इसका − पैर (कॉलम 55) − रेल से।', 'Iska − pair (column 55) − rail se.'),
      CHECK,
      info('Read newQuestion(): random(2, 10) picks 2 to 9 for each number. The answer you type is checked with typed.toInt() == a * b.', 'newQuestion() पढ़िए: random(2, 10) हर संख्या के लिए 2 से 9 चुनता है। आपका टाइप किया जवाब typed.toInt() == a * b से जाँचा जाता है।', 'newQuestion() padhiye: random(2, 10) har number ke liye 2 se 9 chunta hai. Aapka type kiya jawab typed.toInt() == a * b se jaancha jaata hai.', null, lines(MATHQUIZ, /^void newQuestion/, /^}/)),
      RUN(),
      act((S) => lcdSeen(S, /^Correct!$/), 'Read the question on the LCD and type the right answer, then #.', 'एलसीडी पर सवाल पढ़िए और सही जवाब टाइप कीजिए, फिर #।', 'LCD par sawaal padhiye aur sahi jawab type kijiye, phir #.', t3('"Correct!", a high beep, and the score goes up.', '"Correct!", ऊँची बीप, और स्कोर बढ़ता है।', '"Correct!", oonchi beep, aur score badhta hai.')),
      act((S) => lcdSeen(S, /^Oops: /), 'Now give a wrong answer on purpose.', 'अब जानबूझकर ग़लत जवाब दीजिए।', 'Ab jaanboojh kar galat jawab dijiye.', t3('A low beep, and the LCD shows the right answer, so you learn it.', 'नीची बीप, और एलसीडी सही जवाब दिखाती है, ताकि आप सीख लें।', 'Neechi beep, aur LCD sahi jawab dikhati hai, taaki aap seekh lein.')),
      edit((src) => (src.match(/random\(2, 13\)/g) || []).length === 2, [[/random\(2, 10\)/g, 'random(2, 13)']], 'Go up to the 12 times table: change both random(2, 10) to random(2, 13), and press Run.', '12 के पहाड़े तक जाइए: दोनों random(2, 10) को random(2, 13) कीजिए, और "चलाइए" दबाइए।', '12 ke pahade tak jaiye: dono random(2, 10) ko random(2, 13) karo, aur Run dabaiye.'),
      act((S) => fresh(S) && lcdSeen(S, /^Correct!$/), 'Answer one more question correctly.', 'एक और सवाल का सही जवाब दीजिए।', 'Ek aur sawaal ka sahi jawab dijiye.', t3('Questions up to 12 × 12 now. Make a class competition: who gets 5 right first?', 'अब 12 × 12 तक के सवाल। कक्षा में मुक़ाबला कीजिए: 5 सही जवाब पहले कौन देता है?', 'Ab 12 × 12 tak ke sawaal. Class mein muqabla kijiye: 5 sahi jawab pehle kaun deta hai?')),
    ],
    check: [...rails2, ...kpChecks, ...lcdChecks(), ...buzChecks(10)],
    done: (S) => /random\(2, 13\)/.test(S.runSrc || '') && lcdSeen(S, /^Correct!$/) });

  // 19 --------------------------------------------------------------------------------------- school bell
  add({ id: 'schoolbell', cls: '7–9', view: 'wide', code: BELL, drawer: ['abuzz'], serial: true,
    title: t3('Automatic school bell', 'अपने-आप बजने वाली स्कूल की घंटी', 'Apne aap bajne wali school ki ghanti'),
    goal: t3('A clock on the LCD and the day\'s timetable in an array: the bell rings by itself at every period, and you add the lunch bell.', 'एलसीडी पर घड़ी और ऐरे में दिन की समय-सारणी: हर पीरियड पर घंटी अपने-आप बजती है, और आप लंच की घंटी जोड़ते हैं।', 'LCD par ghadi aur array mein din ki time-table: har period par ghanti apne aap bajti hai, aur aap lunch ki ghanti jodte hain.'),
    setup: { parts: [LCD()], wires: [...POWER, ...LCDWIRES] },
    steps: [
      info('The LCD is ready. The bell is an ACTIVE buzzer: it has its own oscillator, so a plain HIGH makes it ring (no tone() needed). It has a + leg, so it must go the right way round.', 'एलसीडी तैयार है। घंटी एक एक्टिव बज़र है: इसका अपना ऑसिलेटर है, इसलिए सिर्फ़ HIGH देने से यह बजता है (tone() की ज़रूरत नहीं)। इसका एक + पैर है, इसलिए इसे सही दिशा में लगाना है।', 'LCD taiyaar hai. Ghanti ek ACTIVE buzzer hai: iska apna oscillator hai, isliye sirf HIGH dene se yeh bajta hai (tone() ki zaroorat nahi). Iska ek + pair hai, isliye ise sahi disha mein lagana hai.'),
      place(PL('bell', 'abuzz', {}, 'e52', 0), 'Put the active buzzer in the ghost: its long leg (+) in 52e, the short leg in 55e.', 'एक्टिव बज़र नीली आकृति में रखिए: लंबा पैर (+) 52e में, छोटा पैर 55e में।', 'Active buzzer neeli shape mein rakhiye: lamba pair (+) 52e mein, chhota pair 55e mein.'),
      wire('D8', 'bell.P', 'Wire pin 8 to its + leg (column 52).', 'पिन 8 से इसके + पैर (कॉलम 52) तक वायर।', 'Pin 8 se iske + pair (column 52) tak wire.'),
      wire('bell.N', 'rail:tn', 'Its − leg (column 55) to the − rail.', 'इसका − पैर (कॉलम 55) − रेल से।', 'Iska − pair (column 55) − rail se.'),
      CHECK,
      info('Read the code. Times are numbers: 9:20 is 920 (hour × 100 + minute). The for loop looks through bells[] and rings when one matches the clock. sizeof(bells) / sizeof(bells[0]) counts the times in the list.', 'कोड पढ़िए। समय संख्याएँ हैं: 9:20 यानी 920 (घंटा × 100 + मिनट)। for लूप bells[] में देखता है और कोई समय घड़ी से मिले तो घंटी बजाता है। sizeof(bells) / sizeof(bells[0]) सूची के समय गिनता है।', 'Code padhiye. Time numbers hain: 9:20 matlab 920 (ghanta × 100 + minute). for loop bells[] mein dekhta hai aur koi time ghadi se mile to ghanti bajata hai. sizeof(bells) / sizeof(bells[0]) list ke time ginta hai.', null, lines(BELL, /^int bells/, /^const int minuteMs/)),
      RUN(t3('The clock starts at 07:55, ten minutes every second.', 'घड़ी 07:55 से चलती है, हर सेकंड दस मिनट।', 'Ghadi 07:55 se chalti hai, har second das minute.')),
      watch((S) => lineSeen(S, /^Bell at 800$/) && lineSeen(S, /^Bell at 820$/) && lcdSeen(S, /RING! Bell 2/), 'Watch the clock and listen for the bells.', 'घड़ी देखिए और घंटियाँ सुनिए।', 'Ghadi dekhiye aur ghantiyan suniye.', t3('8:00 assembly, 8:20 period 1 … the school runs on time without anyone pressing a switch.', '8:00 प्रार्थना, 8:20 पहला पीरियड … स्कूल बिना कोई स्विच दबाए समय पर चलता है।', '8:00 prarthana, 8:20 pehla period … school bina koi switch dabaye time par chalta hai.')),
      edit((src) => /int bells\[\] = \{[^}]*\b1200\b[^}]*\};/.test(src), [[/1040, 1120\}/, '1040, 1120, 1200}']], 'Add the lunch bell at 12:00: put , 1200 at the end of the bells list, and press Run.', '12:00 पर लंच की घंटी जोड़िए: bells की सूची के आख़िर में , 1200 लिखिए, और "चलाइए" दबाइए।', '12:00 par lunch ki ghanti jodiye: bells ki list ke aakhir mein , 1200 likhiye, aur Run dabaiye.'),
      watch((S) => fresh(S) && lineSeen(S, /^Bell at 1200$/), 'Wait for 12:00 (about half a minute).', '12:00 का इंतज़ार कीजिए (लगभग आधा मिनट)।', '12:00 ka intezaar kijiye (lagbhag aadha minute).', t3('RING at 12:00: lunch! The loop found the new time by itself, because sizeof() counts the list again.', '12:00 पर घंटी: लंच! लूप ने नया समय अपने-आप ढूँढ लिया, क्योंकि sizeof() सूची को फिर से गिनता है।', '12:00 par ghanti: lunch! Loop ne naya time apne aap dhoondh liya, kyunki sizeof() list ko phir se ginta hai.')),
    ],
    check: [...rails2, ...lcdChecks(), has('bell', t3('active buzzer', 'एक्टिव बज़र', 'active buzzer')), (S) => (S.conn('bell.N', 'D8') && S.conn('bell.P', 'GND') ? [X.abuzzRev] : null),
      need('bell.P', 'D8', W.toPin, { x: t3('buzzer\'s + leg', 'बज़र का + पैर', 'buzzer ka + pair'), p: 8 }), need('bell.N', 'GND', W.toGnd, { x: t3('buzzer\'s − leg', 'बज़र का − पैर', 'buzzer ka − pair') })],
    done: (S) => lineSeen(S, /^Bell at 1200$/) });

  // 20 --------------------------------------------------------------------------------------- light meter
  add({ id: 'lightmeter', cls: '7–8', view: 'bb', code: LIGHTMETER, drawer: ['ldr', 'resistor'], serial: true,
    title: t3('Light meter for your study desk', 'पढ़ाई की मेज़ के लिए रोशनी मीटर', 'Padhai ki mez ke liye roshni meter'),
    goal: t3('Too little light strains the eyes. Build a meter that shows the light in % with a bar on the OLED, and says when it is too dark to read.', 'कम रोशनी आँखों पर ज़ोर डालती है। एक मीटर बनाइए जो OLED पर रोशनी % में एक पट्टी के साथ दिखाए, और बताए कि कब पढ़ने के लिए बहुत अँधेरा है।', 'Kam roshni aankhon par zor daalti hai. Ek meter banaiye jo OLED par roshni % mein ek patti ke saath dikhaye, aur bataye ki kab padhne ke liye bahut andhera hai.'),
    setup: merge(OLEDPRE, { wires: POWER }),
    steps: [
      info('The OLED is ready. Build the light sensor: an LDR and a 10 kΩ resistor from 5V to GND, with A0 in the middle.', 'OLED तैयार है। रोशनी सेंसर बनाइए: 5V से GND तक एक एलडीआर और 10 kΩ रेज़िस्टर, बीच में A0।', 'OLED taiyaar hai. Roshni sensor banaiye: 5V se GND tak ek LDR aur 10 kΩ resistor, beech mein A0.'),
      place(PL('ldr1', 'ldr', {}, 'e40', 0), 'Put the LDR in the ghost: legs in 40e and 42e.', 'एलडीआर नीली आकृति में रखिए: पैर 40e और 42e में।', 'LDR neeli shape mein rakhiye: pair 40e aur 42e mein.'),
      place(PL('r10', 'resistor', { ohms: 10000 }, 'b42', 3), 'The 10 kΩ resistor from 42b to the − rail.', '10 kΩ रेज़िस्टर 42b से − रेल तक।', '10 kΩ resistor 42b se − rail tak.'),
      wire('ldr1.1', 'rail:tp', 'Wire the LDR\'s left leg (column 40) to the + rail.', 'एलडीआर के बाएँ पैर (कॉलम 40) से + रेल तक वायर।', 'LDR ke left pair (column 40) se + rail tak wire.'),
      wire('A0', 'ldr1.2', 'Wire A0 to column 42.', 'A0 से कॉलम 42 तक वायर।', 'A0 se column 42 tak wire.'),
      CHECK,
      RUN(t3('The room light is on: about 80 %, "Good".', 'कमरे की बत्ती जल रही है: लगभग 80 %, "Good"।', 'Room ki light jal rahi hai: lagbhag 80 %, "Good".')),
      act((S) => /Too dark/.test(oledText(S)) && S.lab.env.light < 0.35, 'Evening comes: turn the room light down.', 'शाम हो गई: कमरे की रोशनी कम कीजिए।', 'Shaam ho gayi: room ki roshni kam kijiye.', t3('The bar shrinks and it says "Too dark": time to switch on the lamp.', 'पट्टी छोटी होती है और "Too dark" लिखा आता है: लैंप जलाने का समय।', 'Patti chhoti hoti hai aur "Too dark" likha aata hai: lamp jalane ka time.')),
      act((S) => /Good/.test(oledText(S)) && S.lab.env.light > 0.7, 'Switch on the desk lamp: bright light again.', 'मेज़ का लैंप जलाइए: फिर तेज़ रोशनी।', 'Mez ka lamp jalaiye: phir tez roshni.', t3('"Good". map() turned the 0–1023 reading into 0–100 %.', '"Good"। map() ने 0–1023 की रीडिंग को 0–100 % में बदल दिया।', '"Good". map() ne 0–1023 ki reading ko 0–100 % mein badal diya.')),
      edit((src) => { const m = /int dim = (\d+);/.exec(src); return !!m && +m[1] >= 55 && +m[1] <= 70; }, [[/int dim = 40;/, 'int dim = 60;']], 'For exams you need more light: change dim = 40 to dim = 60, and press Run.', 'परीक्षा के समय ज़्यादा रोशनी चाहिए: dim = 40 को dim = 60 कीजिए, और "चलाइए" दबाइए।', 'Pariksha ke samay zyada roshni chahiye: dim = 40 ko dim = 60 karo, aur Run dabaiye.'),
      act((S) => fresh(S) && /Too dark/.test(oledText(S)) && S.lab.env.light >= 0.45 && S.lab.env.light <= 0.65, 'Set the room light half way (about 55 %).', 'कमरे की रोशनी आधी कीजिए (लगभग 55 %)।', 'Room ki roshni aadhi kijiye (lagbhag 55 %).', t3('Half light was "Good" before; now it is "Too dark". The meter is the same, only the limit changed.', 'आधी रोशनी पहले "Good" थी; अब "Too dark" है। मीटर वही है, सिर्फ़ सीमा बदली।', 'Aadhi roshni pehle "Good" thi; ab "Too dark" hai. Meter wahi hai, sirf seema badli.')),
    ],
    check: [...rails, ...oledChecks, ...ldrChecks('ldr1', 'r10', 0)],
    done: (S) => /int dim = (5[5-9]|6\d|70);/.test(S.runSrc || '') && /Too dark/.test(oledText(S)) });

  // the relay modules and the 230 V boxes beside the breadboard (as in the home-automation lesson); show: a bulb / a fan on the box
  const RELAY = (tag) => F(tag, 'relay', {}, 70, 135, 0); // in front of the breadboard, its contacts towards the box
  const BOX = (tag, kind) => F(tag, 'load230', { kind, show: true }, -20, 150, 0); // the box (and its bulb or fan) in front, left of the relay
  const RELAY5V = (tag, pin) => [['T:' + tag + ':S', 'D' + pin], ['T:' + tag + ':VCC', rail('bp', 40)], ['T:' + tag + ':GND', rail('bn', 40)]];
  const MAINS = (box, rl) => [['T:' + box + ':A', 'T:' + rl + ':COM'], ['T:' + box + ':B', 'T:' + rl + ':NO']];
  const LDRPRE = { parts: [PL('ldr1', 'ldr', {}, 'e40', 0), PL('r10', 'resistor', { ohms: 10000 }, 'b42', 3)], wires: [['H:a40', rail('tp', 40)], ['A0', 'H:a42']] };
  const ldrPlace = [
    place(PL('ldr1', 'ldr', {}, 'e40', 0), 'Put the LDR in the ghost: legs in 40e and 42e.', 'एलडीआर नीली आकृति में रखिए: पैर 40e और 42e में।', 'LDR neeli shape mein rakhiye: pair 40e aur 42e mein.'),
    place(PL('r10', 'resistor', { ohms: 10000 }, 'b42', 3), 'The 10 kΩ resistor from 42b to the − rail.', '10 kΩ रेज़िस्टर 42b से − रेल तक।', '10 kΩ resistor 42b se − rail tak.'),
    wire('ldr1.1', 'rail:tp', 'Wire the LDR\'s left leg (column 40) to the + rail.', 'एलडीआर के बाएँ पैर (कॉलम 40) से + रेल तक वायर।', 'LDR ke left pair (column 40) se + rail tak wire.'),
    wire('A0', 'ldr1.2', 'Wire A0 to column 42.', 'A0 से कॉलम 42 तक वायर।', 'A0 se column 42 tak wire.'),
  ];
  const loadOn = (S, tag) => { const p = S.part(tag); return !!(p && p.state.on); };

  // 21 --------------------------------------------------------------------------------------- corridor light
  add({ id: 'corridor', cls: '8–10', view: 'wide', code: CORRIDOR, drawer: ['pir'], serial: true,
    title: t3('Corridor light: only at night, only when someone passes', 'गलियारे की बत्ती: सिर्फ़ रात में, सिर्फ़ किसी के गुज़रने पर', 'Galiyare ki light: sirf raat mein, sirf kisi ke guzarne par'),
    goal: t3('Save electricity in the school corridor: a PIR sees people, an LDR sees the dark, and a relay switches the 230 V lamp only when both say yes.', 'स्कूल के गलियारे में बिजली बचाइए: पीआईआर लोगों को देखता है, एलडीआर अँधेरा देखता है, और रिले 230 V का बल्ब तभी जलाता है जब दोनों हाँ कहें।', 'School ke galiyare mein bijli bachaiye: PIR logon ko dekhta hai, LDR andhera dekhta hai, aur relay 230 V ka bulb tabhi jalata hai jab dono haan kahein.'),
    setup: merge(LDRPRE, { parts: [RELAY('rl'), BOX('lamp', 'lamp')], wires: [...POWER, ...RELAY5V('rl', 7), ...MAINS('lamp', 'rl')] }),
    steps: [
      info('Ready: the light sensor (A0), the relay (pin 7) and the corridor\'s 230 V lamp, wired by an electrician into the relay\'s COM and NO. You add the motion sensor.', 'तैयार: रोशनी सेंसर (A0), रिले (पिन 7) और गलियारे का 230 V बल्ब, जिसे इलेक्ट्रीशियन ने रिले के COM और NO में जोड़ा है। आप मोशन सेंसर जोड़िए।', 'Taiyaar: roshni sensor (A0), relay (pin 7) aur galiyare ka 230 V bulb, jise electrician ne relay ke COM aur NO mein joda hai. Aap motion sensor jodiye.'),
      place(F('pir', 'pir', {}, 112, 82, 0), 'Put the PIR sensor on the mat at the ghost, its white dome facing the room.', 'पीआईआर सेंसर को मैट पर नीली आकृति पर रखिए, इसका सफ़ेद गुंबद कमरे की ओर।', 'PIR sensor ko mat par neeli shape par rakhiye, iska safed dome room ki taraf.'),
      wire('pir.VCC', 'rail:bp', 'Wire its VCC to the front + rail (5 V).', 'इसका VCC आगे वाली + रेल (5 V) से जोड़िए।', 'Iska VCC aage wali + rail (5 V) se jodiye.'),
      wire('pir.GND', 'rail:bn', 'Its GND to the front − rail.', 'इसका GND आगे वाली − रेल से।', 'Iska GND aage wali − rail se.'),
      wire('pir.OUT', 'D2', 'Its OUT to pin 2.', 'इसका OUT पिन 2 से।', 'Iska OUT pin 2 se.'),
      CHECK,
      info('Read the code: someone && light < darkLevel is true only when BOTH are true (&& means AND). millis() - lastSeen is how long ago someone moved.', 'कोड पढ़िए: someone && light < darkLevel तभी सच है जब दोनों सच हों (&& का मतलब "और")। millis() - lastSeen बताता है कि किसी को हिले कितनी देर हुई।', 'Code padhiye: someone && light < darkLevel tabhi sach hai jab dono sach hon (&& ka matlab "aur"). millis() - lastSeen batata hai ki kisi ko hile kitni der hui.', null, lines(CORRIDOR, /if \(someone/, /millis\(\) - lastSeen > onTime/)),
      RUN(t3('The PIR needs a few seconds to learn the room.', 'पीआईआर को कमरा समझने में कुछ सेकंड लगते हैं।', 'PIR ko room samajhne mein kuch second lagte hain.')),
      act((S) => S.memRun.dayWave, 'It is daytime. Tap the PIR and wave a hand.', 'दिन है। पीआईआर को छूइए और हाथ हिलाइए।', 'Din hai. PIR ko touch karo aur haath hilaiye.', t3('The PIR saw you (its OUT went HIGH), but the corridor is bright: the lamp stays off. Electricity saved.', 'पीआईआर ने आपको देखा (OUT HIGH हुआ), पर गलियारे में उजाला है: बल्ब बंद रहता है। बिजली बची।', 'PIR ne aapko dekha (OUT HIGH hua), par galiyare mein ujaala hai: bulb band rehta hai. Bijli bachi.')),
      act((S) => loadOn(S, 'lamp') && S.lab.env.light < 0.35, 'Night falls: turn the room light down, then wave again.', 'रात हो गई: कमरे की रोशनी कम कीजिए, फिर हाथ हिलाइए।', 'Raat ho gayi: room ki roshni kam kijiye, phir haath hilaiye.', t3('Click! The relay closes COM–NO and the 230 V lamp lights.', 'क्लिक! रिले COM–NO जोड़ता है और 230 V का बल्ब जल उठता है।', 'Click! Relay COM–NO jodta hai aur 230 V ka bulb jal uthta hai.')),
      watch((S) => S.memRun.offAfter, 'Now stand still and wait.', 'अब स्थिर खड़े रहिए और इंतज़ार कीजिए।', 'Ab sthir khade rahiye aur intezaar kijiye.', live(S0, (lg, S) => (S.memRun.offAfter ? pick(lg, `The lamp went off ${S.memRun.offAfter.toFixed(1)} s after the last movement: nobody left a light on.`, `आख़िरी हलचल के ${S.memRun.offAfter.toFixed(1)} सेकंड बाद बल्ब बुझ गया: कोई बत्ती जलती नहीं छूटी।`, `Aakhri halchal ke ${S.memRun.offAfter.toFixed(1)} second baad bulb bujh gaya: koi light jalti nahi chhooti.`) : ''))),
    ],
    check: [...rails2, ...pirChecks('pir', 2), ...ldrChecks('ldr1', 'r10', 0), ...relayChecks('rl', 7), ...mainsChecks('lamp', 'rl')],
    tick: (S) => { tick7(S); const R = S.memRun; const pir = S.part('pir'); const on = loadOn(S, 'lamp'); const t = bt(S);
      if (pir && pir.state.out && pir.state.age > 2.5) { R.motionAt = t; if (S.lab.env.light > 0.6) R.dayT = (R.dayT || 0) + R.dtb; }
      if (R.dayT > 0.4 && !on && R.motionAt && t - R.motionAt < 0.5 && !R.everOn) R.dayWave = true;
      if (on) R.everOn = true; if (R.everOn && !on && R.wasOn && R.motionAt) R.offAfter = t - R.motionAt; R.wasOn = on; },
    done: (S) => S.memRun.everOn && S.memRun.offAfter > 8 });

  // 22 --------------------------------------------------------------------------------------- automatic fan
  add({ id: 'autofan', cls: '8–10', view: 'wide', code: AUTOFAN, drawer: ['lm35'], serial: true,
    title: t3('Automatic fan for a hot classroom', 'गर्म कक्षा के लिए अपने-आप चलने वाला पंखा', 'Garam class ke liye apne aap chalne wala pankha'),
    goal: t3('An LM35 watches the temperature and a relay switches the ceiling fan on above 30 °C and off below 28 °C, with a gap so it does not keep clicking.', 'LM35 तापमान देखता है और रिले छत के पंखे को 30 °C से ऊपर चालू और 28 °C से नीचे बंद करता है, बीच में एक अंतर रखकर ताकि यह बार-बार क्लिक न करे।', 'LM35 temperature dekhta hai aur relay chhat ke pankhe ko 30 °C se upar on aur 28 °C se neeche off karta hai, beech mein ek gap rakh kar taaki yeh baar-baar click na kare.'),
    setup: { parts: [RELAY('rl'), BOX('fan', 'fan')], wires: [...POWER, ...RELAY5V('rl', 8), ...MAINS('fan', 'rl')] },
    steps: [
      info('The relay (pin 8) and the 230 V ceiling fan, wired by an electrician, are ready. Add the temperature sensor.', 'रिले (पिन 8) और इलेक्ट्रीशियन का जोड़ा 230 V छत का पंखा तैयार हैं। तापमान सेंसर जोड़िए।', 'Relay (pin 8) aur electrician ka joda 230 V chhat ka pankha taiyaar hain. Temperature sensor jodiye.'),
      place(PL('t1', 'lm35', {}, 'e45', 0), 'Put the LM35 in 45e–47e, flat side facing you.', 'LM35 को 45e–47e में लगाइए, चपटी तरफ़ आपकी ओर।', 'LM35 ko 45e–47e mein lagaiye, flat side aapki taraf.'),
      wire('t1.VS', 'rail:tp', 'Wire its left leg (+Vs) to the + rail.', 'इसके बाएँ पैर (+Vs) से + रेल तक वायर।', 'Iske left pair (+Vs) se + rail tak wire.'),
      wire('t1.OUT', 'A0', 'Its middle leg to A0.', 'इसका बीच वाला पैर A0 से।', 'Iska beech wala pair A0 se.'),
      wire('t1.GND', 'rail:tn', 'Its right leg to the − rail.', 'इसका दायाँ पैर − रेल से।', 'Iska right pair − rail se.'),
      CHECK,
      RUN(t3('26 °C: "fan OFF".', '26 °C: "fan OFF"।', '26 °C: "fan OFF".')),
      act((S) => loadOn(S, 'fan') && S.lab.env.temp > 30, 'A hot afternoon: warm the sensor to 34 °C (tap it, use its slider).', 'तेज़ गर्म दोपहर: सेंसर को 34 °C तक गर्म कीजिए (छूकर, स्लाइडर से)।', 'Tez garam dopahar: sensor ko 34 °C tak garam kijiye (touch karke, slider se).', t3('Above 30 °C: click, the fan starts and slowly speeds up.', '30 °C से ऊपर: क्लिक, पंखा चलता है और धीरे-धीरे तेज़ होता है।', '30 °C se upar: click, pankha chalta hai aur dheere-dheere tez hota hai.')),
      act((S) => S.memRun.held, 'Now cool it to 29 °C.', 'अब इसे 29 °C तक ठंडा कीजिए।', 'Ab ise 29 °C tak thanda kijiye.', t3('Still on! Between 28 and 30 °C the fan keeps what it was doing. Without this gap it would click on and off at every tiny change.', 'अब भी चालू! 28 और 30 °C के बीच पंखा जैसा था वैसा रहता है। इस अंतर के बिना यह हर छोटे बदलाव पर क्लिक करके चालू-बंद होता।', 'Ab bhi on! 28 aur 30 °C ke beech pankha jaisa tha waisa rehta hai. Is gap ke bina yeh har chhote badlaav par click karke on-off hota.')),
      act((S) => S.memRun.held && !loadOn(S, 'fan') && S.lab.env.temp < 28, 'Evening: cool it to 25 °C.', 'शाम: इसे 25 °C तक ठंडा कीजिए।', 'Shaam: ise 25 °C tak thanda kijiye.', t3('Below 28 °C: click, off. The fan slows down and stops.', '28 °C से नीचे: क्लिक, बंद। पंखा धीमा होकर रुक जाता है।', '28 °C se neeche: click, band. Pankha dheema hokar ruk jaata hai.')),
    ],
    check: [...rails2, ...lmChecks('t1', 0), ...relayChecks('rl', 8), ...mainsChecks('fan', 'rl')],
    tick: (S) => { tick7(S); const R = S.memRun; const T = S.lab.env.temp; if (loadOn(S, 'fan') && T > 28.2 && T < 29.8) R.heldT = (R.heldT || 0) + R.dtb; if (R.heldT > 1) R.held = true; },
    done: (S) => S.memRun.held && (S.memRun.loadStarts || 0) >= 1 && !loadOn(S, 'fan') });

  // 23 --------------------------------------------------------------------------------------- staircase timer
  add({ id: 'stairtimer', cls: '8–10', view: 'wide', code: STAIR, drawer: [], serial: false,
    title: t3('Staircase light timer', 'सीढ़ियों की बत्ती का टाइमर', 'Seedhiyon ki light ka timer'),
    goal: t3('Like the switch on a building\'s stairs: one press lights the 230 V lamp, the LCD counts down, and the light goes off by itself.', 'इमारत की सीढ़ियों के स्विच की तरह: एक बार दबाने पर 230 V का बल्ब जलता है, एलसीडी उल्टी गिनती दिखाती है, और बत्ती अपने-आप बुझ जाती है।', 'Imaarat ki seedhiyon ke switch ki tarah: ek baar dabane par 230 V ka bulb jalta hai, LCD ulti ginti dikhati hai, aur light apne aap bujh jaati hai.'),
    setup: { parts: [LCD(), PL('b1', 'button', {}, 'e40', 0), RELAY('rl'), BOX('lamp', 'lamp')], wires: [...POWER, ...LCDWIRES, ['D2', 'H:a40'], ['H:a42', rail('tn', 42)], ...MAINS('lamp', 'rl')] },
    steps: [
      info('The button (pin 2), the LCD and the relay with its 230 V lamp are on the bench. The relay\'s 5 V side is not wired yet: that is your job.', 'बटन (पिन 2), एलसीडी और 230 V बल्ब वाला रिले बेंच पर हैं। रिले की 5 V वाली तरफ़ अभी जुड़ी नहीं है: यह आपका काम है।', 'Button (pin 2), LCD aur 230 V bulb wala relay bench par hain. Relay ki 5 V wali taraf abhi judi nahi hai: yeh aapka kaam hai.'),
      wire('rl.S', 'D7', 'Wire the relay\'s S pin to pin 7.', 'रिले का S पिन, पिन 7 से जोड़िए।', 'Relay ka S pin, pin 7 se jodiye.'),
      wire('rl.VCC', 'rail:bp', 'Its + pin to the front + rail (5 V).', 'इसका + पिन आगे वाली + रेल (5 V) से।', 'Iska + pin aage wali + rail (5 V) se.'),
      wire('rl.GND', 'rail:bn', 'Its − pin to the front − rail.', 'इसका − पिन आगे वाली − रेल से।', 'Iska − pin aage wali − rail se.', t3('S only signals; the relay\'s coil takes its 70 mA from + and −.', 'S सिर्फ़ संकेत देता है; रिले की कॉइल अपने 70 mA + और − से लेती है।', 'S sirf signal deta hai; relay ki coil apne 70 mA + aur − se leti hai.')),
      CHECK,
      RUN(t3('"Light OFF · Press the button".', '"Light OFF · Press the button"।', '"Light OFF · Press the button".')),
      act((S) => loadOn(S, 'lamp') && lcdNow(S, /Off in \d+ s/), 'Press the button.', 'बटन दबाइए।', 'Button dabaiye.', t3('Click, the stairs light up, and the LCD counts down from 10.', 'क्लिक, सीढ़ियाँ रोशन, और एलसीडी 10 से उल्टी गिनती गिनती है।', 'Click, seedhiyan roshan, aur LCD 10 se ulti ginti ginti hai.')),
      watch((S) => (S.memRun.onDur || 0) > 8, 'Wait for it to go off by itself.', 'इसके अपने-आप बुझने का इंतज़ार कीजिए।', 'Iske apne aap bujhne ka intezaar kijiye.', t3('10 seconds, then click: off. Nobody can forget the stair light on.', '10 सेकंड, फिर क्लिक: बंद। सीढ़ियों की बत्ती कोई जलती नहीं भूल सकता।', '10 second, phir click: band. Seedhiyon ki light koi jalti nahi bhool sakta.')),
      edit((src) => { const m = /int onTime = (\d+);/.exec(src); return !!m && +m[1] >= 4 && +m[1] <= 7; }, [[/int onTime = 10;/, 'int onTime = 5;']], 'A short flight of stairs needs less time: change onTime = 10 to onTime = 5, and press Run.', 'छोटी सीढ़ियों के लिए कम समय चाहिए: onTime = 10 को onTime = 5 कीजिए, और "चलाइए" दबाइए।', 'Chhoti seedhiyon ke liye kam time chahiye: onTime = 10 ko onTime = 5 karo, aur Run dabaiye.'),
      act((S) => fresh(S) && S.memRun.onDur > 3.5 && S.memRun.onDur < 7.5, 'Press the button and wait.', 'बटन दबाइए और इंतज़ार कीजिए।', 'Button dabaiye aur intezaar kijiye.',
        live(S0, (lg, S) => (S.memRun.onDur ? pick(lg, `On for ${S.memRun.onDur.toFixed(1)} s now: half the electricity of before.`, `अब ${S.memRun.onDur.toFixed(1)} सेकंड जली: पहले की आधी बिजली।`, `Ab ${S.memRun.onDur.toFixed(1)} second jali: pehle ki aadhi bijli.`) : ''))),
    ],
    check: [...rails2, ...lcdChecks(), btnCheck('b1', 2, NM.btn), ...relayChecks('rl', 7), ...mainsChecks('lamp', 'rl')],
    tick: (S) => { tick7(S); const R = S.memRun; const rl = S.part('rl'); if (!rl) return; const on = rl.state.onT || 0; if (rl.state.on && R.onAt === undefined) R.onAt = R.onT0 ?? on; if (!rl.state.on) { if (R.onAt !== undefined) { R.onDur = on - R.onAt; R.onAt = undefined; } R.onT0 = on; } },
    done: (S) => /int onTime = [4-7];/.test(S.runSrc || '') && S.memRun.onDur > 3.5 && S.memRun.onDur < 7.5 });

  // 24 --------------------------------------------------------------------------------------- sanitizer
  add({ id: 'sanitizer', cls: '7–9', view: 'wide', code: SANITIZER, drawer: [], serial: true,
    title: t3('No-touch sanitizer dispenser', 'बिना छुए सैनिटाइज़र मशीन', 'Bina chhue sanitizer machine'),
    goal: t3('Hold your hand under the nozzle: an IR sensor sees it and a relay runs the pump for one dose, from its own battery. No germs from a shared button.', 'नोज़ल के नीचे हाथ रखिए: आईआर सेंसर उसे देखता है और रिले पंप को उसकी अपनी बैटरी से एक ख़ुराक भर चलाता है। साझा बटन से कोई कीटाणु नहीं।', 'Nozzle ke neeche haath rakhiye: IR sensor use dekhta hai aur relay pump ko uski apni battery se ek dose bhar chalata hai. Shared button se koi germs nahi.'),
    setup: { parts: [F('ir1', 'ir', {}, 110, 85, 2), F('rl', 'relay', {}, -10, 130, 0), F('bat', 'aa4', {}, -100, 150, 0), F('pump', 'pump', { mount: 'bottle' }, 62.5, 170, 0)],
      wires: [...POWER, ...irWires('ir1', 7, rail('bp', 55), rail('bn', 55)), ...RELAY5V('rl', 8), ['T:pump:N', 'T:bat:N']] },
    steps: [
      info('The hand sensor (IR, pin 7) and the relay (pin 8) are wired. The pump sits in the sanitizer bottle; its black wire already goes to the battery box\'s −. You wire the pump\'s loop through the relay.', 'हाथ का सेंसर (आईआर, पिन 7) और रिले (पिन 8) जुड़े हैं। पंप सैनिटाइज़र की बोतल में है; इसका काला तार पहले से बैटरी बॉक्स के − से जुड़ा है। आप रिले से होकर पंप का लूप जोड़िए।', 'Haath ka sensor (IR, pin 7) aur relay (pin 8) jude hain. Pump sanitizer ki bottle mein hai; iska kaala wire pehle se battery box ke − se juda hai. Aap relay se hokar pump ka loop jodiye.'),
      wire('bat.P', 'rl.COM', 'Wire the battery\'s red wire (+) to the relay\'s COM (the middle contact).', 'बैटरी का लाल तार (+) रिले के COM (बीच वाले कॉन्टैक्ट) से जोड़िए।', 'Battery ka red wire (+) relay ke COM (beech wale contact) se jodiye.'),
      wire('rl.NO', 'pump.P', 'The relay\'s NO to the pump\'s red wire.', 'रिले का NO पंप के लाल तार से।', 'Relay ka NO pump ke red wire se.', t3('NO = normally open: joined to COM only while the relay is on.', 'NO = सामान्य रूप से खुला: सिर्फ़ रिले चालू रहने तक COM से जुड़ा।', 'NO = normally open: sirf relay on rehne tak COM se juda.')),
      CHECK,
      RUN(),
      act((S) => numsIn(S, /Doses: (\d+)/).length >= 1 && (S.memRun.pumpRan || 0) > 0.3, 'Hold your hand under it: tap the IR sensor and slide the block close.', 'हाथ नीचे रखिए: आईआर सेंसर को छूकर ब्लॉक पास लाइए।', 'Haath neeche rakhiye: IR sensor ko touch karke block paas laiye.', t3('Click, whirr: one dose, then it stops even though your hand is still there.', 'क्लिक, घर्र: एक ख़ुराक, फिर यह रुक जाता है, भले ही आपका हाथ वहीं है।', 'Click, gharr: ek dose, phir yeh ruk jaata hai, bhale hi aapka haath wahin hai.')),
      act((S) => numsIn(S, /Doses: (\d+)/).length >= 2, 'Take your hand away (move the block away), then bring it back.', 'हाथ हटाइए (ब्लॉक दूर कीजिए), फिर वापस लाइए।', 'Haath hataiye (block door kijiye), phir wapas laiye.', t3('A second dose: the while loop waited for your hand to leave first.', 'दूसरी ख़ुराक: while लूप ने पहले आपके हाथ के जाने का इंतज़ार किया।', 'Doosri dose: while loop ne pehle aapke haath ke jaane ka intezaar kiya.')),
      edit((src) => { const m = /int dose = (\d+);/.exec(src); return !!m && +m[1] >= 700 && +m[1] <= 1200; }, [[/int dose = 500;/, 'int dose = 800;']], 'Big hands need more: change dose = 500 to dose = 800, and press Run.', 'बड़े हाथों को ज़्यादा चाहिए: dose = 500 को dose = 800 कीजिए, और "चलाइए" दबाइए।', 'Bade haathon ko zyada chahiye: dose = 500 ko dose = 800 karo, aur Run dabaiye.'),
      act((S) => fresh(S) && (S.memRun.pumpRan || 0) > 0.7, 'Hold your hand under it again.', 'फिर से हाथ नीचे रखिए।', 'Phir se haath neeche rakhiye.', live(S0, (lg, S) => (S.memRun.pumpRan ? pick(lg, `The pump ran ${S.memRun.pumpRan.toFixed(1)} s: about ${Math.round(S.memRun.pumpRan * 30)} mL.`, `पंप ${S.memRun.pumpRan.toFixed(1)} सेकंड चला: लगभग ${Math.round(S.memRun.pumpRan * 30)} mL।`, `Pump ${S.memRun.pumpRan.toFixed(1)} second chala: lagbhag ${Math.round(S.memRun.pumpRan * 30)} mL.`) : ''))),
    ],
    check: [...rails2, ...irChecks('ir1', 7, N.ir), ...relayChecks('rl', 8), (S) => (['pump.P', 'pump.N'].some((e) => S.conn(e, '5V') || S.conn(e, 'GND')) ? [X.pumpArduino] : null),
      (S) => (S.conn('bat.P', 'rl.COM') && S.conn('rl.NC', 'pump.P') ? [X.pumpNC] : null), (S) => (S.conn('bat.P', 'rl.COM') && S.conn('rl.NO', 'pump.P') && S.conn('pump.N', 'bat.N') ? null : [X.pumpPath])],
    tick: (S) => { tick7(S); const R = S.memRun; const rl = S.part('rl'); if (!rl) return; const on = rl.state.onT || 0; if (rl.state.on && R.pAt === undefined) R.pAt = R.onT0 ?? on; if (!rl.state.on) { if (R.pAt !== undefined) { R.pumpRan = on - R.pAt; R.pAt = undefined; } R.onT0 = on; } },
    done: (S) => /int dose = (7\d\d|8\d\d|9\d\d|1[01]\d\d|1200);/.test(S.runSrc || '') && (S.memRun.pumpRan || 0) > 0.7 });

  // 25 --------------------------------------------------------------------------------------- remote fan regulator
  add({ id: 'remotefan', cls: '9–10', view: 'wide', code: REMOTEFAN, drawer: ['irrx'], serial: true,
    title: t3('Fan regulator with a TV remote', 'टीवी रिमोट से पंखे का रेगुलेटर', 'TV remote se pankhe ka regulator'),
    goal: t3('Buttons 1, 2, 3 of a TV remote set a DC fan\'s speed with PWM through a transistor, and 0 stops it: a regulator you do not have to get up for.', 'टीवी रिमोट के बटन 1, 2, 3 ट्रांज़िस्टर से PWM देकर डीसी पंखे की रफ़्तार तय करते हैं, और 0 उसे रोकता है: ऐसा रेगुलेटर जिसके लिए उठना न पड़े।', 'TV remote ke button 1, 2, 3 transistor se PWM dekar DC pankhe ki speed tay karte hain, aur 0 use rokta hai: aisa regulator jiske liye uthna na pade.'),
    setup: { parts: [PL('q1', 'npn', {}, 'e40', 0), PL('rb', 'resistor', { ohms: 1000 }, 'c37', 0), PL('d1', 'diode', {}, 'a42', 3), F('m1', 'motor', {}, 95, 160, 0)],
      wires: [...POWER, ['D9', 'H:a37'], ['H:a40', rail('tn', 40)], ['T:m1:P', rail('tp', 47)], ['T:m1:N', 'H:b42']] },
    steps: [
      info('The fan\'s driver from lesson 13 is ready: pin 9 → 1 kΩ → transistor, the motor between 5V and the collector, the diode across it. Add the IR receiver that hears the remote.', 'पाठ 13 वाला पंखे का ड्राइवर तैयार है: पिन 9 → 1 kΩ → ट्रांज़िस्टर, मोटर 5V और कलेक्टर के बीच, डायोड उसके आर-पार। रिमोट को सुनने वाला आईआर रिसीवर जोड़िए।', 'Lesson 13 wala pankhe ka driver taiyaar hai: pin 9 → 1 kΩ → transistor, motor 5V aur collector ke beech, diode uske aar-paar. Remote ko sunne wala IR receiver jodiye.'),
      place(PL('ir', 'irrx', {}, 'j48', 0), 'Plug the IR receiver into 48j–50j, its dome facing you.', 'आईआर रिसीवर को 48j–50j में लगाइए, इसका गुंबद आपकी ओर।', 'IR receiver ko 48j–50j mein lagaiye, iska dome aapki taraf.'),
      wire('ir.OUT', 'D11', 'Wire its left leg (OUT, column 48) to pin 11.', 'इसका बायाँ पैर (OUT, कॉलम 48) पिन 11 से जोड़िए।', 'Iska left pair (OUT, column 48) pin 11 se jodiye.'),
      wire('ir.GND', 'rail:bn', 'Its middle leg (GND, column 49) to the front − rail.', 'इसका बीच वाला पैर (GND, कॉलम 49) आगे वाली − रेल से।', 'Iska beech wala pair (GND, column 49) aage wali − rail se.'),
      wire('ir.VCC', 'rail:bp', 'Its right leg (VCC, column 50) to the front + rail.', 'इसका दायाँ पैर (VCC, कॉलम 50) आगे वाली + रेल से।', 'Iska right pair (VCC, column 50) aage wali + rail se.'),
      CHECK,
      info('Read the code: each remote button sends its own number (the command): 1 is 69, 2 is 70, 3 is 71, 0 is 25. switch picks the speed for each; analogWrite gives that much PWM.', 'कोड पढ़िए: रिमोट का हर बटन अपनी संख्या (कमांड) भेजता है: 1 यानी 69, 2 यानी 70, 3 यानी 71, 0 यानी 25। switch हर एक के लिए रफ़्तार चुनता है; analogWrite उतना PWM देता है।', 'Code padhiye: remote ka har button apna number (command) bhejta hai: 1 matlab 69, 2 matlab 70, 3 matlab 71, 0 matlab 25. switch har ek ke liye speed chunta hai; analogWrite utna PWM deta hai.', null, lines(REMOTEFAN, /switch \(code\)/, /case 71/)),
      RUN(t3('"Fan regulator ready".', '"Fan regulator ready"।', '"Fan regulator ready".')),
      act((S) => numsIn(S, /Speed: (\d+)/).includes(255) && S.motorMax('m1') > 500, 'Tap the IR receiver: its card has the remote. Press 3.', 'आईआर रिसीवर को छूइए: उसके कार्ड में रिमोट है। 3 दबाइए।', 'IR receiver ko touch karo: uske card mein remote hai. 3 dabaiye.', t3('Full speed: PWM 255 is on all the time.', 'पूरी रफ़्तार: PWM 255 हर समय चालू है।', 'Poori speed: PWM 255 har samay on hai.')),
      act((S) => numsIn(S, /Speed: (\d+)/).includes(90) && S.motorLevels('m1') >= 2, 'Press 1.', '1 दबाइए।', '1 dabaiye.', t3('Slow: on 90 / 255 of the time, so the motor gets about a third of the power.', 'धीमा: 255 में से 90 हिस्से चालू, इसलिए मोटर को लगभग एक-तिहाई ताक़त मिलती है।', 'Dheema: 255 mein se 90 hisse on, isliye motor ko lagbhag ek-tihaai taaqat milti hai.')),
      act((S) => numsIn(S, /Speed: (\d+)/).includes(0) && Math.abs((S.part('m1') || { state: {} }).state.w || 0) < 30, 'Press 0.', '0 दबाइए।', '0 dabaiye.', t3('Off: the fan slows down and stops. Try a button that has no case: its code shows on the Serial Monitor.', 'बंद: पंखा धीमा होकर रुकता है। कोई ऐसा बटन दबाइए जिसका case नहीं है: उसका कोड सीरियल मॉनिटर पर दिखेगा।', 'Band: pankha dheema hokar rukta hai. Koi aisa button dabaiye jiska case nahi hai: uska code Serial Monitor par dikhega.')),
    ],
    check: [...rails2, has('ir', t3('IR receiver', 'आईआर रिसीवर', 'IR receiver')), (S) => (S.conn('ir.VCC', 'D11') || (S.conn('ir.OUT', '5V') && S.conn('ir.VCC', 'GND')) || (S.conn('ir.OUT', 'GND') && S.conn('ir.GND', '5V')) ? [X.irRev, { p: 11 }] : null),
      need('ir.OUT', 'D11', W.toPin, { x: t3('IR receiver\'s OUT', 'आईआर रिसीवर का OUT', 'IR receiver ka OUT'), p: 11 }), need('ir.GND', 'GND', W.toGnd, { x: t3('IR receiver\'s GND', 'आईआर रिसीवर का GND', 'IR receiver ka GND') }), need('ir.VCC', '5V', W.to5v, { x: t3('IR receiver\'s VCC', 'आईआर रिसीवर का VCC', 'IR receiver ka VCC') }),
      (S) => (S.has('d1') && S.chain('q1.C', [['d1', 'A', 'K']], '5V') ? null : [X.noDiode])],
    done: (S) => numsIn(S, /Speed: (\d+)/).length >= 3 && S.motorLevels('m1') >= 2 });

  // 26 --------------------------------------------------------------------------------------- railway crossing
  add({ id: 'railgate', cls: '7–9', view: 'wide', code: RAILGATE, drawer: ['servo'], serial: true,
    title: t3('Railway level crossing', 'रेलवे फाटक', 'Railway phatak'),
    goal: t3('A sensor beside the track sees the train: the boom comes down, two red lamps flash in turn and a bell rings, and the road opens again after the train.', 'पटरी के पास लगा सेंसर ट्रेन को देखता है: फाटक नीचे आता है, दो लाल बत्तियाँ बारी-बारी चमकती हैं और घंटी बजती है, और ट्रेन के बाद सड़क फिर खुलती है।', 'Patri ke paas laga sensor train ko dekhta hai: phatak neeche aata hai, do red lights baari-baari chamakti hain aur ghanti bajti hai, aur train ke baad sadak phir khulti hai.'),
    setup: merge(LEDU(1, 22, 'red', 12), LEDU(2, 28, 'red', 11), BUZ(52, 8), { parts: [F('ir1', 'ir', {}, 20, 100, 2)], wires: [...POWER, ...irWires('ir1', 7, rail('bp', 25), rail('bn', 25))] }),
    steps: [
      info('Ready: the train sensor (IR, pin 7), two red lamps (pins 12 and 11) and the bell (pin 8). The servo will be the boom across the road.', 'तैयार: ट्रेन सेंसर (आईआर, पिन 7), दो लाल बत्तियाँ (पिन 12 और 11) और घंटी (पिन 8)। सर्वो सड़क के आर-पार का फाटक बनेगा।', 'Taiyaar: train sensor (IR, pin 7), do red lights (pin 12 aur 11) aur ghanti (pin 8). Servo sadak ke aar-paar ka phatak banega.'),
      place(F('sv1', 'servo', {}, 118, 118, 0), 'Put the servo (the boom) on the mat at the ghost.', 'सर्वो (फाटक) को मैट पर नीली आकृति पर रखिए।', 'Servo (phatak) ko mat par neeli shape par rakhiye.'),
      wire('sv1.GND', 'rail:bn', 'Wire its brown wire to the front − rail.', 'इसका भूरा तार आगे वाली − रेल से जोड़िए।', 'Iska bhoora wire aage wali − rail se jodiye.'),
      wire('sv1.VP', 'rail:bp', 'Its red wire to the front + rail.', 'इसका लाल तार आगे वाली + रेल से।', 'Iska laal wire aage wali + rail se.'),
      wire('sv1.SIG', 'D10', 'Its orange wire to pin 10.', 'इसका नारंगी तार पिन 10 से।', 'Iska orange wire pin 10 se.'),
      CHECK,
      RUN(t3('The boom goes up (90°): the road is open.', 'फाटक ऊपर (90°): सड़क खुली है।', 'Phatak upar (90°): sadak khuli hai.')),
      act((S) => S.servo('sv1') && S.part('sv1').state.angle < 5 && S.memRun.flashL && S.memRun.flashR, 'A train is coming: tap the IR sensor and slide the block close.', 'ट्रेन आ रही है: आईआर सेंसर को छूकर ब्लॉक पास लाइए।', 'Train aa rahi hai: IR sensor ko touch karke block paas laiye.', t3('Down comes the boom, the lamps flash left, right, left, and the bell rings.', 'फाटक नीचे आता है, बत्तियाँ बाएँ, दाएँ, बाएँ चमकती हैं, और घंटी बजती है।', 'Phatak neeche aata hai, lights left, right, left chamakti hain, aur ghanti bajti hai.')),
      act((S) => S.memRun.reopened, 'The train has passed: move the block away and wait.', 'ट्रेन निकल गई: ब्लॉक दूर कीजिए और इंतज़ार कीजिए।', 'Train nikal gayi: block door kijiye aur intezaar kijiye.', t3('Two seconds more for the last wagon, then the boom goes up: "Road open".', 'आख़िरी डिब्बे के लिए दो सेकंड और, फिर फाटक ऊपर: "Road open"।', 'Aakhri dibbe ke liye do second aur, phir phatak upar: "Road open".')),
    ],
    check: [...rails2, unit('led1', 'r1', 12, NM.red), unit('led2', 'r2', 11, NM.red), ...buzChecks(8), ...irChecks('ir1', 7, N.ir), ...servoChecks('sv1', 10)],
    tick: (S) => { tick7(S); const R = S.memRun; if (S.ledLit('led1') && !S.ledLit('led2')) R.flashL = true; if (S.ledLit('led2') && !S.ledLit('led1')) R.flashR = true; const sv = S.part('sv1'); if (R.flashL && sv && sv.state.angle > 85 && lineSeen(S, /Road open/)) R.reopened = true; },
    done: (S) => S.memRun.reopened && S.servoMin('sv1') < 5 });

  // 27 --------------------------------------------------------------------------------------- automatic blinds
  add({ id: 'blinds', cls: '8–10', view: 'wide', code: BLINDS, drawer: ['ldr', 'resistor'], serial: true,
    title: t3('Automatic window blinds', 'अपने-आप खुलने वाले पर्दे', 'Apne aap khulne wale parde'),
    goal: t3('A stepper motor rolls the blind up when the morning light comes and down when it gets dark; an LDR tells it which.', 'स्टेपर मोटर सुबह की रोशनी आने पर पर्दा ऊपर लपेटती है और अँधेरा होने पर नीचे; एलडीआर उसे बताता है कि कब।', 'Stepper motor subah ki roshni aane par parda upar lapet-ti hai aur andhera hone par neeche; LDR use batata hai ki kab.'),
    setup: { parts: [F('st', 'stepper', {}, -95, 100, 0)], wires: [...POWER, ['T:st:IN1', 'D8'], ['T:st:IN2', 'D9'], ['T:st:IN3', 'D10'], ['T:st:IN4', 'D11']] },
    steps: [
      info('The 28BYJ-48 stepper and its ULN2003 driver are wired to pins 8–11, but not to power yet. A whole turn is 2048 steps; half a turn (1024) rolls the blind up or down.', '28BYJ-48 स्टेपर और उसका ULN2003 ड्राइवर पिन 8–11 से जुड़े हैं, पर अभी बिजली से नहीं। पूरा चक्कर 2048 क़दम है; आधा चक्कर (1024) पर्दे को ऊपर या नीचे लपेटता है।', '28BYJ-48 stepper aur uska ULN2003 driver pin 8–11 se jude hain, par abhi bijli se nahi. Poora chakkar 2048 steps hai; aadha chakkar (1024) parde ko upar ya neeche lapet-ta hai.'),
      wire('st.GND', 'rail:bn', 'Wire the driver\'s − to the front − rail.', 'ड्राइवर का − आगे वाली − रेल से जोड़िए।', 'Driver ka − aage wali − rail se jodiye.'),
      wire('st.VCC', 'rail:bp', 'Its + to the front + rail (5 V).', 'इसका + आगे वाली + रेल (5 V) से।', 'Iska + aage wali + rail (5 V) se.'),
      ...ldrPlace,
      CHECK,
      RUN(t3('The room is bright: "Good morning: opening", the shaft turns half a turn.', 'कमरे में उजाला है: "Good morning: opening", शाफ़्ट आधा चक्कर घूमता है।', 'Room mein ujaala hai: "Good morning: opening", shaft aadha chakkar ghoomta hai.')),
      act((S) => S.memRun.closed, 'Evening: turn the room light right down.', 'शाम: कमरे की रोशनी बिल्कुल कम कीजिए।', 'Shaam: room ki roshni bilkul kam kijiye.', t3('"Good night: closing": half a turn back, step by step, the LEDs A B C D on the driver lighting in turn.', '"Good night: closing": आधा चक्कर वापस, क़दम दर क़दम, ड्राइवर की एलईडी A B C D बारी-बारी जलती हैं।', '"Good night: closing": aadha chakkar wapas, step by step, driver ki LED A B C D baari-baari jalti hain.')),
      act((S) => S.memRun.reopened, 'Morning again: bright light.', 'फिर सुबह: तेज़ रोशनी।', 'Phir subah: tez roshni.', t3('Open again. Between 300 and 600 nothing happens: a dusty cloud does not make the blind go up and down all day.', 'फिर खुला। 300 और 600 के बीच कुछ नहीं होता: एक धूल भरा बादल पर्दे को दिन भर ऊपर-नीचे नहीं कराता।', 'Phir khula. 300 aur 600 ke beech kuch nahi hota: ek dhool bhara baadal parde ko din bhar upar-neeche nahi karata.')),
    ],
    check: [...rails2, has('st', t3('stepper driver', 'स्टेपर ड्राइवर', 'stepper driver')), ...[8, 9, 10, 11].map((p, i) => need('st.IN' + (i + 1), 'D' + p, X.steps)), need('st.VCC', '5V', W.to5v, { x: t3('driver\'s +', 'ड्राइवर का +', 'driver ka +') }), need('st.GND', 'GND', W.toGnd, { x: t3('driver\'s −', 'ड्राइवर का −', 'driver ka −') }), ...ldrChecks('ldr1', 'r10', 0)],
    tick: (S) => { tick7(S); const R = S.memRun; const st = S.part('st'); if (!st) return; const a = st.state.angle || 0; R.aMax = Math.max(R.aMax ?? a, a); if (R.aMax - a > 170) R.closed = true; if (R.closed) { R.aMin = Math.min(R.aMin ?? a, a); if (a - R.aMin > 170) R.reopened = true; } },
    done: (S) => S.memRun.closed && S.memRun.reopened });

  // 28 --------------------------------------------------------------------------------------- joystick drive
  add({ id: 'jsdrive', cls: '9–11', view: 'carbench', code: JSDRIVE, drawer: ['joystick'], serial: true,
    title: t3('Joystick drive: test a robot\'s motors', 'जॉयस्टिक ड्राइव: रोबोट की मोटरें जाँचिए', 'Joystick drive: robot ki motors jaanchiye'),
    goal: t3('Before a robot car goes on the floor, test it on the bench with its wheels in the air: a joystick drives both motors through an L298N, forward, back and turning.', 'रोबोट कार को ज़मीन पर उतारने से पहले बेंच पर पहिये हवा में रखकर जाँचिए: जॉयस्टिक L298N से दोनों मोटरें चलाता है, आगे, पीछे और मोड़।', 'Robot car ko zameen par utaarne se pehle bench par pahiye hawa mein rakh kar jaanchiye: joystick L298N se dono motors chalata hai, aage, peeche aur mod.'),
    setup: { parts: [F('drv', 'l298n', {}, 30, 110, 0), F('bat', 'bat18650', {}, -160, 135, 0), F('mL', 'bomotor', { side: 'L' }, -20, 150, 3), F('mR', 'bomotor', { side: 'R' }, 85, 150, 1)],
      wires: [...POWER, ['T:bat:P', 'T:drv:VS'], ['T:bat:N', 'T:drv:GND'], ['T:mL:P', 'T:drv:OUT1'], ['T:mL:N', 'T:drv:OUT2'], ['T:mR:P', 'T:drv:OUT3'], ['T:mR:N', 'T:drv:OUT4'],
        ['T:drv:ENA', 'D5'], ['T:drv:IN1', 'D7'], ['T:drv:IN2', 'D8'], ['T:drv:ENB', 'D6'], ['T:drv:IN3', 'D2'], ['T:drv:IN4', 'D4']] },
    steps: [
      info('The L298N, its 7.4 V battery and the two gear motors are wired as on a robot car (ENA 5, IN1 7, IN2 8, ENB 6, IN3 2, IN4 4). Two jobs are left: the common ground, and the joystick.', 'L298N, उसकी 7.4 V बैटरी और दोनों गियर मोटरें रोबोट कार की तरह जुड़ी हैं (ENA 5, IN1 7, IN2 8, ENB 6, IN3 2, IN4 4)। दो काम बाक़ी हैं: कॉमन ग्राउंड, और जॉयस्टिक।', 'L298N, uski 7.4 V battery aur dono gear motors robot car ki tarah judi hain (ENA 5, IN1 7, IN2 8, ENB 6, IN3 2, IN4 4). Do kaam baaki hain: common ground, aur joystick.'),
      wire('drv.GND', 'rail:bn', 'Common ground: wire the L298N\'s GND terminal to the front − rail.', 'कॉमन ग्राउंड: L298N के GND टर्मिनल को आगे वाली − रेल से जोड़िए।', 'Common ground: L298N ke GND terminal ko aage wali − rail se jodiye.', t3('Now a HIGH from the Arduino means the same to the driver: both measure from the same 0 V.', 'अब Arduino का HIGH ड्राइवर के लिए भी वही है: दोनों एक ही 0 V से नापते हैं।', 'Ab Arduino ka HIGH driver ke liye bhi wahi hai: dono ek hi 0 V se naapte hain.')),
      place(F('js', 'joystick', {}, -60, 105, 0), 'Put the joystick on the mat at the ghost.', 'जॉयस्टिक को मैट पर नीली आकृति पर रखिए।', 'Joystick ko mat par neeli shape par rakhiye.'),
      wire('js.GND', 'rail:bn', 'Its GND to the front − rail.', 'इसका GND आगे वाली − रेल से।', 'Iska GND aage wali − rail se.'),
      wire('js.V5', 'rail:bp', 'Its +5V to the front + rail.', 'इसका +5V आगे वाली + रेल से।', 'Iska +5V aage wali + rail se.'),
      wire('js.VRX', 'A0', 'VRx (left–right) to A0.', 'VRx (बाएँ–दाएँ) A0 से।', 'VRx (left–right) A0 se.'),
      wire('js.VRY', 'A1', 'VRy (forward–back) to A1.', 'VRy (आगे–पीछे) A1 से।', 'VRy (aage–peeche) A1 se.'),
      CHECK,
      info('Read loop(): forward is y, turning is x. left = y + x and right = y − x: push right and the left wheel goes faster than the right, so the car turns right. This is how tanks steer.', 'loop() पढ़िए: आगे y है, मुड़ना x है। left = y + x और right = y − x: दाईं ओर धकेलिए तो बायाँ पहिया दाएँ से तेज़ चलता है, और कार दाईं ओर मुड़ती है। टैंक ऐसे ही मुड़ते हैं।', 'loop() padhiye: aage y hai, mudna x hai. left = y + x aur right = y − x: right dhakeliye to left pahiya right se tez chalta hai, aur car right mudti hai. Tank aise hi mudte hain.', null, lines(JSDRIVE, /int left = /, /motor\(ENB/)),
      RUN(t3('Stick in the middle: both wheels stop (the dead zone ignores a stick that is not quite centred).', 'स्टिक बीच में: दोनों पहिये रुके (डेड ज़ोन थोड़ी टेढ़ी स्टिक को अनदेखा करता है)।', 'Stick beech mein: dono pahiye ruke (dead zone thodi tedhi stick ko andekha karta hai).')),
      act((S) => S.memRun.fwd, 'Push the stick forward (up) and hold it.', 'स्टिक को आगे (ऊपर) धकेलकर पकड़े रखिए।', 'Stick ko aage (upar) dhakel kar pakde rakhiye.', t3('Both wheels turn forward at full speed.', 'दोनों पहिये पूरी रफ़्तार से आगे घूमते हैं।', 'Dono pahiye poori speed se aage ghoomte hain.')),
      act((S) => S.memRun.spin, 'Now push it to the right.', 'अब इसे दाईं ओर धकेलिए।', 'Ab ise right dhakeliye.', t3('Left wheel forward, right wheel back: the robot would spin on the spot to the right.', 'बायाँ पहिया आगे, दायाँ पीछे: रोबोट अपनी जगह पर दाईं ओर घूमेगा।', 'Left pahiya aage, right peeche: robot apni jagah par right ghoomega.')),
    ],
    check: [noShort, (S) => (S.conn('drv.GND', 'GND') ? null : [X.drvGnd]), (S) => (S.conn('rail:bp', '5V') && S.conn('rail:bn', 'GND') ? null : [X.frontRails]),
      has('js', t3('joystick', 'जॉयस्टिक', 'joystick')), need('js.GND', 'GND', W.toGnd, { x: t3('joystick\'s GND', 'जॉयस्टिक का GND', 'joystick ka GND') }), need('js.V5', '5V', W.to5v, { x: t3('joystick\'s +5V', 'जॉयस्टिक का +5V', 'joystick ka +5V') }),
      (S) => (S.conn('js.VRX', 'A1') && S.conn('js.VRY', 'A0') ? [X.jsSwap] : null), need('js.VRX', 'A0', W.join, { a: 'VRx', b: 'A0' }), need('js.VRY', 'A1', W.join, { a: 'VRy', b: 'A1' }),
      ...[['ENA', 5], ['IN1', 7], ['IN2', 8], ['ENB', 6], ['IN3', 2], ['IN4', 4]].map(([a, p]) => need('drv.' + a, 'D' + p, W.toPin, { x: 'L298N ' + a, p }))],
    tick: (S) => { tick7(S); const R = S.memRun; const L = S.part('mL'), Rm = S.part('mR'); if (!L || !Rm) return; const l = L.state.w || 0, r = Rm.state.w || 0;
      if (l > 400 && r > 400) R.fwdT = (R.fwdT || 0) + R.dtb; if (R.fwdT > 0.4) R.fwd = true; if (l > 300 && r < -300) R.spinT = (R.spinT || 0) + R.dtb; if (R.spinT > 0.4) R.spin = true; },
    done: (S) => S.memRun.fwd && S.memRun.spin });

  // 29 --------------------------------------------------------------------------------------- Mega light chaser
  add({ id: 'mega_chaser', board: 'mega', view: 'mega4', wview: 'mega4', code: CHASER, drawer: ['pot'], serial: true, cls: '8–10',
    title: t3('Light chaser on the Mega', 'Mega पर दौड़ती रोशनी', 'Mega par daudti roshni'),
    goal: t3('One light runs along a 10-LED bar and back again, like the lights of a fancy shop sign; a knob sets how fast it runs.', 'एक रोशनी 10 एलईडी की पट्टी पर दौड़ती है और लौटती है, जैसे किसी दुकान के चमकदार बोर्ड की बत्तियाँ; एक नॉब तय करता है कि कितनी तेज़।', 'Ek roshni 10 LED ki patti par daudti hai aur laut-ti hai, jaise kisi dukaan ke chamakdar board ki lights; ek knob tay karta hai ki kitni tez.'),
    setup: { parts: [PL('bar1', 'bar10', {}, 'e6', 0), PL('sip1', 'sip10', {}, 'h5', 0)], wires: [['GND5', rail('bn', 4)], ['H:j5', rail('bn', 5)], ['5V', rail('bp', 19)], ...[22, 23, 24, 25, 26, 27, 28, 29, 30, 31].map((p, i) => ['D' + p, 'H:a' + (6 + i)])] },
    steps: [
      info('The bar graph is wired to pins 22 to 31 through its resistor network, as in the Mega lesson. Add the speed knob.', 'बार ग्राफ़ अपने रेज़िस्टर नेटवर्क से होकर पिन 22 से 31 पर जुड़ा है, Mega वाले पाठ की तरह। रफ़्तार का नॉब जोड़िए।', 'Bar graph apne resistor network se hokar pin 22 se 31 par juda hai, Mega wale lesson ki tarah. Speed ka knob jodiye.'),
      place(PL('pot1', 'pot', {}, 'f20', 0), 'Put the knob in the ghost: legs in 20f, 22f and 24f.', 'नॉब नीली आकृति में रखिए: पैर 20f, 22f और 24f में।', 'Knob neeli shape mein rakhiye: pair 20f, 22f aur 24f mein.'),
      wire('pot1.1', 'rail:bn', 'Wire its left leg (column 20) to the front − rail.', 'इसका बायाँ पैर (कॉलम 20) आगे वाली − रेल से जोड़िए।', 'Iska left pair (column 20) aage wali − rail se jodiye.'),
      wire('pot1.3', 'rail:bp', 'Its right leg (column 24) to the front + rail.', 'इसका दायाँ पैर (कॉलम 24) आगे वाली + रेल से।', 'Iska right pair (column 24) aage wali + rail se.'),
      wire('A0', 'pot1.W', 'Its middle leg (column 22) to A0.', 'इसका बीच वाला पैर (कॉलम 22) A0 से।', 'Iska beech wala pair (column 22) A0 se.'),
      CHECK,
      info('Read the code: the first for loop goes 0 → 9 and the second 8 → 1, so the light bounces at both ends without stopping twice on the end LEDs. map() turns the knob into a wait of 20 to 300 ms.', 'कोड पढ़िए: पहला for लूप 0 → 9 जाता है और दूसरा 8 → 1, इसलिए रोशनी दोनों सिरों पर उछलती है, आख़िरी एलईडी पर दो बार रुके बिना। map() नॉब को 20 से 300 ms के इंतज़ार में बदलता है।', 'Code padhiye: pehla for loop 0 → 9 jaata hai aur doosra 8 → 1, isliye roshni dono siron par uchhalti hai, aakhri LED par do baar ruke bina. map() knob ko 20 se 300 ms ke intezaar mein badalta hai.', null, lines(CHASER, /^void loop/, /^}/)),
      RUN(),
      act((S) => { const v = numsIn(S, /^(\d+)$/); return v.length > 0 && v[v.length - 1] <= 30 && (S.memRun.kChanges || 0) > 12; }, 'Turn the knob all the way down: fast!', 'नॉब को पूरा नीचे घुमाइए: तेज़!', 'Knob ko poora neeche ghumaiye: tez!', t3('20 ms a light: it zips along and bounces back.', 'हर बत्ती 20 ms: यह सरपट दौड़ती है और लौट आती है।', 'Har light 20 ms: yeh sarpat daudti hai aur laut aati hai.')),
      act((S) => { const v = numsIn(S, /^(\d+)$/); return v.length > 0 && v[v.length - 1] >= 270; }, 'Now all the way up: slow.', 'अब पूरा ऊपर: धीमा।', 'Ab poora upar: dheema.', live(S0, (lg, S) => (numsIn(S, /^(\d+)$/).length ? pick(lg, `${numsIn(S, /^(\d+)$/).pop()} ms a light now. Ten LEDs, two for loops and one array: the Mega has pins to spare.`, `अब हर बत्ती ${numsIn(S, /^(\d+)$/).pop()} ms। दस एलईडी, दो for लूप और एक ऐरे: Mega के पास फ़ालतू पिन हैं।`, `Ab har light ${numsIn(S, /^(\d+)$/).pop()} ms. Das LED, do for loop aur ek array: Mega ke paas faltu pins hain.`) : ''))),
    ],
    check: [noShort, (S) => (S.conn('rail:bp', '5V') ? null : [W.vRail]), has('pot1', N.pot), need('pot1.W', 'A0', X.wiper, { p: 'A0' }), (S) => (S.conn('pot1.1', 'GND') && S.conn('pot1.3', '5V') || S.conn('pot1.1', '5V') && S.conn('pot1.3', 'GND') ? null : [X.knobEnds])],
    tick: (S) => { tick7(S); const R = S.memRun; const p = S.part('bar1'); if (!p) return; const b = p.state.segB || []; let k = -1; for (let i = 0; i < 10; i++) if ((b[i] || 0) > 0.15) { k = i; break; }
      if (k >= 0 && k !== R.kLast) { R.kChanges = (R.kChanges || 0) + 1; R.kLast = k; } const v = numsIn(S, /^(\d+)$/); if (v.length && v[v.length - 1] <= 30) S.mem.fastSeen = true; },
    done: (S) => { const v = numsIn(S, /^(\d+)$/); return v.length > 0 && v[v.length - 1] >= 270 && (S.mem.fastSeen || false); } });

  // 30 --------------------------------------------------------------------------------------- ESP32 motion alarm
  add({ id: 'esp_alarm', board: 'esp32', view: 'wide', code: ESPALARM, drawer: ['pir'], serial: true, baud: 115200, cls: '9–10',
    title: t3('ESP32 motion alarm', 'ESP32 मोशन अलार्म', 'ESP32 motion alarm'),
    goal: t3('A visitor alarm on the ESP32: the PIR runs on 5 V but its OUT is 3.3 V, just right for the ESP32; an LED and a buzzer warn, and the Serial Monitor counts visitors.', 'ESP32 पर आगंतुक अलार्म: पीआईआर 5 V पर चलता है पर इसका OUT 3.3 V है, ESP32 के लिए बिल्कुल ठीक; एक एलईडी और बज़र चेतावनी देते हैं, और सीरियल मॉनिटर आगंतुक गिनता है।', 'ESP32 par visitor alarm: PIR 5 V par chalta hai par iska OUT 3.3 V hai, ESP32 ke liye bilkul theek; ek LED aur buzzer warning dete hain, aur Serial Monitor visitors ginta hai.'),
    setup: { parts: [PL('led1', 'led', { color: 'red' }, 'e30', 0), PL('r1', 'resistor', { ohms: 220 }, 'b30', 3), PL('bz', 'abuzz', {}, 'e40', 0)],
      wires: [['H:a4', rail('tp', 4)], ['H:a5', rail('tn', 5)], ['H:a11', 'H:a31'], ['H:a10', 'H:a40'], ['H:a43', rail('tn', 43)]] },
    steps: [
      info('On the ESP32: VIN (5 V from the USB) feeds the + rail, GND the − rail. The red LED is on GPIO 25 and an active buzzer on GPIO 26. Add the PIR.', 'ESP32 पर: VIN (USB से 5 V) + रेल को बिजली देता है, GND − रेल को। लाल एलईडी GPIO 25 पर और एक्टिव बज़र GPIO 26 पर है। पीआईआर जोड़िए।', 'ESP32 par: VIN (USB se 5 V) + rail ko power deta hai, GND − rail ko. Red LED GPIO 25 par aur active buzzer GPIO 26 par hai. PIR jodiye.'),
      place(F('pir', 'pir', {}, 75, 85, 0), 'Put the PIR sensor on the mat at the ghost.', 'पीआईआर सेंसर को मैट पर नीली आकृति पर रखिए।', 'PIR sensor ko mat par neeli shape par rakhiye.'),
      wire('pir.VCC', 'rail:tp', 'Wire its VCC to the + rail (5 V, from VIN).', 'इसका VCC + रेल (VIN से 5 V) से जोड़िए।', 'Iska VCC + rail (VIN se 5 V) se jodiye.'),
      wire('pir.GND', 'rail:tn', 'Its GND to the − rail.', 'इसका GND − रेल से।', 'Iska GND − rail se.'),
      wire('pir.OUT', 'D27', 'Its OUT to GPIO 27 (column 9, a free hole beside the pin).', 'इसका OUT GPIO 27 से (कॉलम 9, पिन के पास का ख़ाली छेद)।', 'Iska OUT GPIO 27 se (column 9, pin ke paas ka khaali hole).', t3('Its OUT gives 3.3 V: safe for the ESP32, whose pins must never get 5 V.', 'इसका OUT 3.3 V देता है: ESP32 के लिए सुरक्षित, जिसके पिनों को कभी 5 V नहीं मिलना चाहिए।', 'Iska OUT 3.3 V deta hai: ESP32 ke liye safe, jiske pins ko kabhi 5 V nahi milna chahiye.')),
      CHECK,
      RUN(t3('"Alarm ready" at 115200 baud. The PIR first learns the room for a few seconds.', '115200 बॉड पर "Alarm ready"। पीआईआर पहले कुछ सेकंड कमरा समझता है।', '115200 baud par "Alarm ready". PIR pehle kuch second room samajhta hai.')),
      act((S) => numsIn(S, /Visitors: (\d+)/).length >= 1 && S.ledLit('led1') && S.tonesHeard() > 0, 'When it has settled, tap the PIR and wave.', 'जब यह शांत हो जाए, पीआईआर को छूकर हाथ हिलाइए।', 'Jab yeh shaant ho jaaye, PIR ko touch karke haath hilaiye.', t3('Beep and red light while it sees you; "Motion! Visitors: …" counts each new movement once.', 'जब तक यह आपको देखता है, बीप और लाल बत्ती; "Motion! Visitors: …" हर नई हलचल को एक बार गिनता है।', 'Jab tak yeh aapko dekhta hai, beep aur red light; "Motion! Visitors: …" har nayi halchal ko ek baar ginta hai.')),
      act((S) => { const v = numsIn(S, /Visitors: (\d+)/); return v.length >= 1 && v[v.length - 1] >= v[0] + 1; }, 'Wait until it is quiet, then wave again.', 'शांत होने तक रुकिए, फिर हाथ हिलाइए।', 'Shaant hone tak rukiye, phir haath hilaiye.', t3('The next visitor. wasMoving remembers the last reading, so a long wave still counts as one.', 'अगला आगंतुक। wasMoving पिछली रीडिंग याद रखता है, इसलिए देर तक हाथ हिलाना भी एक ही गिना जाता है।', 'Agla visitor. wasMoving pichhli reading yaad rakhta hai, isliye der tak haath hilana bhi ek hi gina jaata hai.')),
    ],
    check: [(S) => (S.conn('VIN', 'GND') ? [W.short] : null), (S) => (S.conn('rail:tp', 'VIN') ? null : [X.espRail]), (S) => (S.conn('rail:tn', 'GND') ? null : [W.gndRail]), ...pirChecks('pir', 27, 'esp')],
    done: (S) => { const v = numsIn(S, /Visitors: (\d+)/); return v.length >= 2; } });

  const H = { t3, PL, F, W, need, has, noShort, N, unit, LEDU, merge, X, NM, CHECK, RUN, info, place, wire, act, watch, edit, fresh, POWER, rails, rails2, BUZ, buzChecks, btnCheck, LCD, LCDWIRES, lcdSteps, lcdChecks, ldrChecks, lmChecks, servoChecks, SEGS, SEGFULL, segChecks, digitsSeen, add, S0 };
  void H;
  batch7.rt = null; Object.defineProperty(S0, 'rt', { get: () => batch7.rt });
  return L;
}
