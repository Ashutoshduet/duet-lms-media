# Robotics Lab 360

The app is `robotics/` (one page, `index.html` + `js/*.js`, no build step). Lessons 1–16 teach the Arduino basics on a
3D bench (board, breadboard, parts, wires, code, Serial Monitor). This file describes the additions; other batches add
their own sections below.

## Batch 2: robots (lessons 17 onwards)

Projects that school ATL / STEM labs in India build, with real parts, real wiring and a real sketch that runs on the
simulated Uno. Each robot stands next to the bench (or on its own floor) and is driven by the bench's parts: the servos
and motors you wire on the bench move the robot, and the robot's sensors are read back by the bench's sensors.

| n | id | Lesson | Robot | What the student does |
|---|---|---|---|---|
| 17 | `arm1` | Robot arm 1: the base | 4-joint arm (3 × MG996R, SG90 claw) | adapter on the front rails, common ground, base servo on pin 3; point at the flag (120°) |
| 18 | `arm2` | Robot arm 2: the shoulder | same | shoulder servo on pin 5; touch the red ball (shoulder 100°) |
| 19 | `arm3` | Robot arm 3: the elbow | same | elbow servo on pin 6; `moveTo(b, s, e)`; touch the ball (elbow 120°) |
| 20 | `arm4` | Robot arm 4: pick and place | same, wooden block, marks A and B | claw servo on pin 9; a list of poses; fix B's base angle (40°) so the block lands on B |
| 21 | `arm5` | Robot arm 5: joystick control | same + joystick module | place and wire the joystick (A0, A1, pin 2); hold the stick to drive base and shoulder |
| 22 | `linecar` | Line-follower car | 2WD car, 2 IR modules, black tape track | common ground; place and wire the IR sensors (11, 12); tune `speed` and `turn` |
| 23 | `avoidcar` | Obstacle-avoiding car | 2WD car, HC-SR04 on an SG90, room with boxes | place and wire the sensor and the servo; tune `safe` (3 cm bumps, 25–30 cm does not) |
| 24 | `smartbin` | Smart dustbin | pedal bin, HC-SR04 at the front, SG90 lifts the lid; a hand brings paper | wire sensor (9, 10) and servo (3); `openCm = 5` misses a hand that stops at 10 cm; 20 cm works; the lid shuts after `waitMs` |
| 25 | `btcar` | Bluetooth car | 2WD car + HC-05, yard with boxes and a parking space P | place and wire the HC-05 (TXD → RX pin 0; TX pin 1 is caught); pair; drive with the phone pad or the arrow keys (F/B/L/R/S letters); slow to 120 and park in P |
| 26 | `hydarm` | Hydraulic arm (Pascal's law) | cardboard arm, two syringes (5, 10, 20 mL), a tube of water, 12 coins | push the plunger; 5 → 20 mL multiplies force (F₁ × d₁ = F₂ × d₂); a sketch prints the same sums; air squeezes |

Lessons from other batches are numbered after these (they count `LESSONS` when they are added).

### Files

- `js/parts2.js`: the new parts as data (pins with their own height and wire direction, electrical model):
  L298N (two H-bridges, PWM on ENA/ENB, a 2 V drop, needs a common ground), BO gear motor (1:48, 65 mm wheel), 2 × 18650
  battery, HC-05, joystick, 5 V adapter, MG996R; `hcsr04f` (an HC-SR04 on a robot: only its plug on the mat). Merged into
  `PARTS` by `parts.js`.
- `js/models2.js`: their 3D models and the robots' (arm, car, arena, dustbin, hydraulic rig), modelled in code from datasheet
  sizes. Printed boards' textures are drawn once and shared.
- `js/robots.js`: the robots' physics without 3D (node tests run it): arm kinematics and the claw; differential-drive car,
  IR over the tape, ultrasonic rays (five in a ±15° cone), walls and boxes, laps; dustbin; hydraulic syringes (Pascal).
- `js/worlds.js`: a lesson's `world` (built over several frames, its shaders compiled before it shows), the sync with the
  bench's parts, and the live panel (`#world`: angles, reach, sensors, motors, laps; its controls).
- `js/lessons2.js`: the lessons (English, Hindi, Hinglish), added to `LESSONS` by `lessons.js` (`batch2(K)`).
- `js/xrui.js`: the headset (WebXR) interaction for all lessons; `js/xr.js` sets it up.
- `models/hand.glb` (91 KB, CC BY 4.0, credited in `credits.html`): the hand that brings rubbish to the dustbin, loaded
  only when that lesson opens (GLTFLoader + meshopt decoder in `lib/addons/`).

A lesson can now have `world` (`{ kind: 'arm', level }`, `{ kind: 'car', car: 'line' | 'avoid' | 'bt' }`, …), `wview`
(the camera for its wiring and placing steps) and `rview` (the camera for its run / watch / act steps). Lesson helpers
`S.w(flag)` and `S.wv(name)` read the robot's flags and values.

### How the bench and the robot stay in step

`main.js` steps the bench (sketch + circuit) and the robot together in slices of at most 10 ms of simulated time, so a
sensor never lags the sketch by a slow frame (phones, the 2× speed). The car's motors are the bench's BO motors (their
speed through the gears is the wheel's), the IR modules' outputs come from the tape under the car's sensors, and the
HC-SR04's echo from the room. Run puts the car back at its start.

### Phones and headsets

- No shadow-casting light on phones and on the Quest (`stage.js`; a soft blob under each robot instead). In a headset on
  a computer, the shadow map is redrawn only when the bench changes.
- The Quest browser gets the light materials (`LITE`) and no bloom.
- Draw calls: every part's still pieces are merged across parts into one mesh per material (`view.batchParts`), all
  wires likewise (`view.batchWires`); desk and mat are two calls each; the Uno went from 55 to about 20 calls.
- A lesson opens without a long freeze: parts are built a few per frame, the robot over several frames, its shaders with
  `compileAsync`; drawer pictures only for the parts a drawer shows.

### Headset (Meta Quest), controllers or hands

A panel stands left of the bench: **Step** (the lesson card; Back, Check, Next; the clicked part's controls), **Parts**
(take a part: it follows the ray; trigger / pinch puts it down; A/X turns it; B/Y drops it), **Code** (the sketch with the
running line; point at a number and change it with − / +, or apply the step's change), **Robot** (the robot's panel and
controls), and Run, Stop, Reset, Move / Wire tool, Bench / Robot view, previous / next lesson. On the bench: trigger (or
pinch) on a free hole, pin or terminal and pull to another to lay a wire (or click one, then the other); on a part to move
it; hold on a button; pull a knob, a joystick or a syringe. The thumbstick turns and sizes the bench, the grip turns it.

### Tests

- `node devtools/test/robocore.mjs`: engine (unchanged lessons 1–16).
- `node devtools/test/robocore2.mjs`: every new lesson end to end without a browser: the bench built from its steps,
  the sketch run, the robot driven by it, the tuning edits checked (e.g. speed 220 loses the line, `turn = -speed / 2`
  keeps it; `safe = 3` bumps, `safe = 25` does not; no common ground: the car does not move; `openCm = 5` misses the hand;
  the Bluetooth letters park the car in P, TXD on pin 1 is caught; 5 → 20 mL gives ×2.5 force and air lifts less).
- `node devtools/test/robotest.mjs new|all [outdir]` (static server on `PORT`): every lesson through the real UI.
- `node devtools/test/roboxr.mjs [ids]`: lessons in WebXR on an emulated Quest 3 (IWER), with controllers; `HANDS=id`
  plays one with hands.
- `node devtools/test/robophone.mjs [ids]` (`QUEST=1` for the Quest's UA): open freeze, draw calls, JS time per frame.
- On a busy machine give the browser tests `SLOW=3` (every wait three times longer). Headless Chrome draws a frame only
  when something asks for one, and the app draws only when something changes, so a robot left alone in a headless page
  stops; the tests keep asking the page for its state, which keeps it going (a real browser draws at the screen's rate).

## Batch 4: more boards (Nano, Mega 2560, ESP32)

Until now the bench had only the UNO R3. Batch 4 adds three boards, as data in `boards4.js` (pins, what each pin can do,
specs, the parts a student can tap), each with its own 3D model, microcontroller and lessons. A lesson names its board
(`board`), and may let the student change it (`boards`); the old lessons open on the Uno exactly as before.

| Board | On the bench | What is special (and simulated) |
|---|---|---|
| Nano (ATmega328P, CH340, mini-USB) | plugs into the breadboard, pins in rows d and h, columns 3–17 | same chip and sketches as the Uno; each pin joins its breadboard strip (wire from a free hole a–c / i–j); the holes under it are covered; A6/A7 analog only |
| Mega 2560 | on the mat, left of the breadboard | 54 digital pins (15 PWM), A0–A15 (A0 = 54), Serial1–3 on 14–19 (bytes go out of TX and reach whatever RX is wired: loopback, or another port) |
| ESP32 DevKit V1 (ESP32-WROOM-32, 30 pins) | plugs into the breadboard, rows b and i, columns 4–18 (one free hole beside each pin) | 3.3 V logic (HIGH = 3.3 V, thresholds 2.5 / 0.8 V), clamp diodes on every pin, warnings for 5 V on a pin, VIN on 3V3, a 5 V module on 3V3; GPIO numbering (34–39 input only, 6–11 flash, strapping pins noted); ADC 12-bit (not exact near 0 V and above 3.1 V), `analogReadMilliVolts`, `analogReadResolution`, ADC2 reads 0 while WiFi is on; PWM on every output pin (`analogWrite`, `ledcSetup/ledcAttachPin/ledcWrite` core 2.x and `ledcAttach/ledcWrite(pin)` core 3.x); `touchRead` (T0, T2–T9); `hallRead` (only Arduino core 2.x, removed in 3.0, and only the original ESP32: the S2 / S3 / C3 have no Hall sensor); `temperatureRead()` = 53.3 °C (no working sensor on this chip, as on real WROOM-32 boards); start-up lines at 115200 baud |

The network is simulated inside the app (no real network calls): a school WiFi (`DUET-School`, password `stem2026` on the
router's sticker), `WiFi.begin` (connects after ~2.4 s; a wrong password never connects and the router says why; a wrong
name gives WL_NO_SSID_AVAIL), `WiFi.softAP` (the phone can join the ESP32's own network), `WebServer` (routes run in
`server.handleClient()`, `server.arg`, `sendHeader` + 3xx redirects, 404 "Not found: /x", time-outs when `loop()` never
calls `handleClient`) and `AsyncWebServer` (lambdas with `AsyncWebServerRequest *request`, `hasParam`, `getParam()->value()`,
no `handleClient` needed), `BluetoothSerial` (the phone's terminal app connects to the name given to `begin`).

The phone stands beside the bench: a 3D phone whose screen is a canvas. Its Browser shows the HTML the sketch sends
(headings, text, colours, links, buttons, `onclick="location.href='…'"`, `fetch('…')`, `<meta http-equiv="refresh">`, and
SVG rect / line / polyline / circle / text, so a sketch can draw a chart), with a keyboard on the screen to type the
ESP32's IP address; on a computer or tablet the real keyboard types into it too (a hidden text field takes the keys, so a
tablet's own keyboard opens). The first tap on the phone (or the toolbar's Phone button) brings it close; then taps work
its apps, and each new step turns the camera back to the board, so the student sees the LED answer. BT Terminal: devices, connect, buttons 1 / 0 / 2 / Hi and your own text, the ESP32's answers. WiFi:
the networks it sees. A tap reaches the screen through `view.pickRay` as region `phone@u,v`, so mouse, finger and a
headset's ray (XR) all work. Free build with an ESP32 shows the phone too.

| n | id | Lesson | Board | The student builds, codes and sees |
|---|---|---|---|---|
| 27 | `nano_meet` | Meet the Nano | Nano | taps its parts and both pin rows; Blink on pin 13 (the L LED) |
| 28 | `nano_traffic` | Traffic light: Uno → Nano | Uno, then Nano | the lesson-4 traffic light on the Uno; swaps to the Nano (board box or Board list), rewires D12/D11/D10 and GND from the Nano's strips; the same sketch runs |
| 29 | `mega_meet` | Meet the Mega 2560 | Mega | taps the chip, PWM pins, COMMUNICATION header, 22–53, A0–A15; wires TX1 → RX1; "Hello from Serial1" comes back through the wire |
| 30 | `mega_bar` | 10-LED bar graph on the Mega | Mega | LED bar graph + 10 × 220 Ω resistor network; wires pins 30 and 31; `leds[]` array and a for loop; a knob on A0 drives a level meter (0–10) |
| 31 | `esp_meet` | Meet the ESP32 | ESP32 | taps the WROOM module, antenna, USB, EN/BOOT, pin rows; 3.3 V logic; Blink on `LED_BUILTIN` (GPIO 2) at 115200 baud |
| 32 | `esp_knob` | ESP32 knob dimmer: 12-bit ADC and PWM | ESP32 | knob (on 3V3) to GPIO 34; `analogRead` 0–4095; `ledcSetup/ledcAttachPin/ledcWrite` dims the blue LED; sees the ADC's ends |
| 33 | `esp_touch` | Touch light switch | ESP32 | places a copper touch plate, wires it to T0 (GPIO 4); `touchRead` ~70 / ~15; touch toggles a lamp LED on GPIO 25 |
| 34 | `esp_wifi` | WiFi lamp: control it from a phone | ESP32 + phone | types the router's password into the sketch; joins WiFi, reads its IP; opens it on the phone; ON / OFF buttons switch the lamp (`WebServer`, handlers) |
| 35 | `esp_iot` | IoT temperature dashboard | ESP32 + phone | places and wires an LM35 (VIN, GPIO 34 = ADC1, GND); `analogReadMilliVolts`; a page with the reading and an SVG line chart of the last 20, refreshing every 2 s; warms the sensor to 40 °C and watches the line climb |
| 36 | `esp_bt` | Bluetooth lamp | ESP32 + phone | `BluetoothSerial`; the phone's BT Terminal connects to DUET-ESP32, sends 1 / 0; the lamp follows, the ESP32 answers |
| 37 | `esp_hall` | The ESP32's own sensors | ESP32 | `hallRead` with a magnet in a clamp stand (drag it down, tap its top to flip N/S); the lesson says it works only with core 2.x on the original ESP32; why `temperatureRead()` is always 53.3 °C on this chip |

(The numbers are given at load time, after the lessons before them: 27–37 with batches 2 and 3 in place, 47 lessons in all.)

### Files

- `js/boards4.js`: the three boards as data (pin positions, nets, what each pin does, regions, specs, compiler names such as
  `A0` = 54 on a Mega or `LED_BUILTIN` = 2 on an ESP32), the breadboard mount (pin → hole, covered holes), `LAB_HOOKS`.
- `js/mcu4.js`: `NanoMCU`, `MegaMCU` (pin numbers, 16 analog inputs, Serial1–3 and their wiring).
- `js/esp32.js`: `ESP32MCU` (pins, ADC, ledc, touch, Hall, temperatureRead, start-up lines), WiFi, `WebServer`,
  `AsyncWebServer`, `BluetoothSerial`, the simulated network (`netOf(lab)`: router, DHCP, the phone's requests, Bluetooth),
  and the 3.3 V clamps and warnings (a `LAB_HOOKS` entry).
- `js/lib4.js`: what the compiler knows of these libraries (types `o4:…`, globals `WiFi`, `Serial1–3`, constants, the ESP32
  functions, lambdas, `PROGMEM`); compile errors per board ("WiFi does not work on the Uno", "touchRead() is an ESP32 function").
- `js/parts4.js`, `js/models4.js`: LED bar graph (`bar10`), resistor network (`sip10`), touch plate (`touch4`), magnet in a
  clamp stand (`magnet4`); the three boards' 3D models (canvas-drawn PCB artwork, ESP32-WROOM-32 can and PCB antenna, TQFP
  chips, USB connectors, buttons, LEDs that light).
- `js/phone4.js`: the phone (model, screen UI, the small HTML/SVG renderer, BT Terminal, WiFi, keyboard) and the router.
- `js/app4.js`: the app's side: Board list (Free build, lessons with `boards`), the board box beside the bench (tap a board
  to swap; works with the headset's ray), board views, pin popups and region callouts for each board, the phone and router,
  warnings as toasts, the Serial Monitor's speed per lesson (`baud`), texts in English, Hindi and Hinglish.
- `js/lessons4.js`: the 11 lessons, added to `LESSONS` by `lessons.js` (`batch4(K)`).

Shared-file hooks are marked "batch 4": `sim.js` (`setBoard`, breadboard boards' pins in holes, logic voltage / 5 V
source / pull-up target per board, `LAB_HOOKS`, LED pin per board, only used GPIO nodes on big boards), `cpp.js`
(`compile(src, board)`, `LIB4` types / globals / constants / functions / lambdas, board constants, raw strings `R"(…)"`,
const text strings stay quoted), `mcu.js` (exports `SerialPort`), `boards.js`, `parts.js`, `models.js`, `lessons.js`
(registration), `lessonrt.js` (the lesson's board on open, ghost wires into a breadboard board's strips, `S.board()`),
`view.js` (`setBoard`, `pickExtra`, a region id from a function, a part's own `update`), `main.js` (`install4(this)`,
`compile(src, this.lab.def)`), `credits.html`.

### Tests

- `node devtools/test/robocore4.mjs`: pins and holes of each board, compiler board checks and names, ADC (12-bit ESP32 with
  its dead zone, 10-bit Uno / Mega A15 / Nano A7), 3.3 V vs 5 V and the warnings, WiFi (wrong password, IP, routes, 404,
  no handleClient → time-out), soft AP + AsyncWebServer, Bluetooth (connect, send, answer, restart drops the link), touch,
  Hall, temperatureRead, ledc both APIs, ADC2 with WiFi, Mega Serial1 loopback; then all 11 lessons end to end.
- `node devtools/test/robotest4.mjs [ids|all]`: every new lesson through the real UI in headless Chromium (puppeteer-core,
  port 8809): taps, the board box, drags, Check, Run, the password edit, knobs, the touch plate, the phone's screen
  (typing the IP on its keyboard, tapping ON / OFF, BT Terminal 1 / 0), the magnet's controls. `PHONE=1` for a phone screen.
- `node devtools/test/roboxr4.mjs [ids]`: a few lessons in an emulated Quest (IWER), the phone and the board box by ray.
- Last runs (17 Nov 2026): `robocore4.mjs` all passed; `robotest4.mjs` all 11 lessons complete, 0 page errors.
- The other batches' engine tests still pass with these hooks: `robocore.mjs`, `robocore2.mjs`, `robocore3.mjs`, `robocore5.mjs`.
- On a busy machine the software GPU (SwiftShader) can lose its WebGL context; the test counts it ("GL context lost") and
  the bench is then dark or blank in screenshots. `stage.js` does not rebuild the PMREM environment after a context restore
  (an open item for the shared stage).

Offline: done in Integration (below): `robotics/sw.js` / `offline.json` list every file; run
`python3 devtools/offline/build_sw.py . robotics` again after any change.

## Batch 3: school-lab modules and block coding

The modules Indian school ATL / STEM labs buy, each with a 3D model, its real pins, a simulation in the style of `sim.js`
and the Arduino library a student would use; ten projects built with them; and a block editor beside the C++ for Class 6–8.

### Block coding (`js/blocks.js`, our own code, no Blockly)

- A **Blocks / C++** switch in the code panel's tab bar. Each lesson says where it starts (`blocks: true` for the beginners'
  lessons); a student's choice is remembered per lesson. The C++ lessons can be switched to blocks too, and Free build.
- Blocks sit **beside the C++ they make** (the editor stays live and editable): a change to the blocks writes the C++ at
  once, and the same compiler and simulator run it; C++ typed by hand comes back as blocks (`cpp.js parse()`), comments
  included. What the blocks do not know (a `switch`, arrays, `rfid.uid…`) stays as a grey **C++** block, unchanged, so
  nothing is lost; a `#define` or a C++ mistake keeps the blocks away with the reason (and the line).
- While a block runs it glows (the MCU's running line, mapped to its block); a compile error marks its block.
- Palette groups: Pins (pinMode, digital / analog read and write, PWM), Control (wait ms / µs, if, if-else, repeat, count
  with a variable, while, break, return, millis), Maths (compare, + − × ÷ %, and / or / not, map, constrain, random, abs),
  Variables (declare, set, change, ++ / −−, the value), Serial (begin, print / println with HEX etc., available, read),
  Sound (tone, tone for ms, noTone), Servo, Displays (16×2 LCD I2C; OLED: begin, clear, text size and colour, cursor,
  print, rectangles, circles, display), Sensors (DHT, IR remote, keypad, RFID, SPI), Motors (stepper), C++.
  The `#include`s come with the blocks that need them. Devices and variables already in the program fill the new blocks.
- Big blocks (statements 38 px, values 28 px, choices as menus, numbers and words typed in place), drag by mouse, finger,
  pen or a Quest controller / hand in the browser (pointer events, no hover needed), a blue line or slot shows where it
  snaps, drop on the palette to delete, tap a palette block to add it at the usual place, Ctrl+Z, − / + zoom.
- Layout: side by side (blocks | C++) while the student codes (a lesson's edit and run steps, Free build); blocks above the
  C++ while they build on the bench or watch the scene, so the bench stays big. Phones: the code panel opens over the
  bench, side by side from 640 px wide. Words in English, Hindi and Hinglish.
- Hidden for the micro:bit (batch 5 has its own blocks and Python).

### Modules (`js/parts3.js`, `js/models3.js`, `js/libs3.js`)

| Module | Pins | What is simulated | Library |
|---|---|---|---|
| 16×2 LCD + PCF8574 I2C backpack (`lcd16`) | GND VCC SDA SCL | found at its address (0x27, or 0x3F by the A0–A2 pads) only when SDA→A4, SCL→A5 and powered; 5×8 characters, cursor, backlight, contrast knob (all boxes when the contrast is wrong or it is never initialised) | `LiquidCrystal_I2C` (init/begin, backlight, clear, home, setCursor, print/println, write, cursor/blink, display/noDisplay, scroll, createChar) |
| 0.96" OLED SSD1306 128×64 (`oled`) | GND VCC SCL SDA | the picture only changes on `display()`; 0x3C | `Adafruit_SSD1306` + GFX (begin, clearDisplay, setTextSize/Color, setCursor, print/println, drawPixel, lines, rectangles, round rectangles, circles, triangles, invertDisplay) |
| 7-segment, 1 digit, common cathode (`seg7`) | a–g, dp, COM ×2 | each segment is an LED through its own resistor; burns without one | digitalWrite |
| DHT11 (`dht11`) | DATA VCC GND | reads the room (temperature and humidity lag 2.5 s, 1 s between readings); `nan` when DATA is on another pin or unpowered | `DHT` (begin, readTemperature(°C / °F), readHumidity, computeHeatIndex) |
| Soil moisture probe + comparator (`soil`) | VCC GND DO AO | AO from the soil's resistance (dry ≈ 1000, wet ≈ 300), DO by the board's threshold | analogRead / digitalRead |
| PIR HC-SR501 (`pir`) | VCC OUT GND | warms up (HIGH for 2.5 s), holds 3 s, then ignores for 2.5 s; 3.3 V out | digitalRead |
| 1-channel relay KY-019 (`relay`) | S VCC GND, NO COM NC | 70 Ω coil, 8 ms pull-in, click; contacts switch the 230 V lamp / fan box (mains drawn safely in a closed box: the lesson teaches why the mains side is never touched) | digitalWrite |
| IR receiver VS1838B + remote (`irrx`) | OUT GND VCC | NEC codes of the common 21-key remote; the 3D remote's buttons, the panel, the headset's ray | `IRremote` 4.x (`IrReceiver.begin/decode/resume`, `decodedIRData.command`) and the 2.x style (`IRrecv`, `decode(&results)`, `results.value`) |
| 4×4 membrane keypad (`keypad`) | R1–R4 C1–C4 | real row/column scanning through the circuit: swapped wires give wrong keys | `Keypad` (makeKeymap, getKey, waitForKey, getState) |
| Joystick (batch 2's) | | used by the pan-tilt lesson | analogRead |
| 28BYJ-48 + ULN2003 (`stepper`) | IN1–IN4 GND VCC | 2048 steps a turn, the coil pattern must change in order (wrong order shakes, too fast hums without turning), LEDs A–D, sound | `Stepper` (setSpeed, step) and plain digitalWrite patterns |
| RC522 RFID + card + key tag (`rfid`) | SDA SCK MOSI MISO IRQ GND RST 3.3V | found only on the SPI pins (13/11/12, SS and RST as in the sketch); 5 V on its 3.3 V pin damages it; the card and tag have fixed UIDs | `MFRC522` (PCD_Init, PICC_IsNewCardPresent, PICC_ReadCardSerial, uid.size / uidByte, PICC_HaltA), `SPI` |
| MQ-2 gas sensor (`mq2`) | VCC GND DO AO | heater (33 Ω) warms in ~10 s, AO from the gas ppm (Rs/R0 curve), DO by its threshold | analogRead / digitalRead |
| Pump, 4×AA box, 230 V lamp / fan box | | the pump runs from its own battery through the relay (the Arduino's 5 V is not a pump supply) | |

Compile errors in plain words: a library used without its `#include`, a method the library does not have (with "did you
mean"), `makeKeymap` misuse.

### The lessons

| n | id | Class | Starts in | The student builds, codes and sees |
|---|---|---|---|---|
| 38 | `lcdtemp` | 6–8 | Blocks | DHT11 on the breadboard, LCD on I2C; temperature and humidity on the LCD; a cup of chai and their breath warm the sensor; puts their own name on the LCD; results: the room's reading, the highest the chai made, the name shown |
| 39 | `irrigate` | 6–8 | Blocks | soil probe in a tulsi pot, relay, pump on its own battery; the soil dries in the sun, the pump waters below `dry = 600`, the plant droops and recovers; changes the threshold; results: the dry and wet readings, mL poured, waterings |
| 40 | `homeauto` | 9–12 | C++ | IR receiver; two relays switch a 230 V lamp and a fan in a living room (safety first); the TV remote's buttons switch them; moves the fan to button 3 (its code, 71, read on the Serial Monitor); results: the keys they pressed and what answered |
| 41 | `burglar` | 6–8 | Blocks | PIR, LED, buzzer; a thief walks into the room, the alarm sounds; makes the siren sharper; a cat sets it off too; results: delay and alarm time |
| 42 | `rfidlock` | 9–12 | C++ | RC522 on SPI (3.3 V!), servo latch on a door; reads the card's UID on the Serial Monitor, puts it in the sketch; right card opens, the key tag is refused; results: which number opened and which was refused |
| 43 | `weather` | 9–12 | Blocks | DHT11 + OLED; temperature, humidity and a thermometer bar drawn on the OLED; changes the weather outside the window; shows °F (drags a Maths block in); results: the range seen |
| 44 | `keylock` | 9–12 | C++ | 4×4 keypad, servo locker, buzzer; types the password and #; a wrong code beeps; changes the password; results: the refused and the opening codes |
| 45 | `gasalarm` | 6–8 | Blocks | MQ-2, buzzer, LED in a kitchen with an LPG cylinder; warm-up, a small leak sets off the alarm, the window clears it; lowers the limit; results: clean-air reading, when the alarm began, the peak |
| 46 | `pantilt` | 9–12 | Blocks | joystick and two servos on a pan-tilt head with a laser; hits targets A and B on a board; flips an axis with `map()`; results: the angles of each hit |
| 47 | `turntable` | 6–8 | Blocks | 28BYJ-48 + ULN2003 turning a display turntable (a diya on it); quarter turns, then faster, then a full turn of 2048 steps; results: degrees per step |

(The numbers are given at load time, after the lessons before them.) Every step is in English, Hindi and Hinglish; the
last step of each lesson shows the student's own numbers.

### Files

- `js/libs3.js`: what the compiler knows of the libraries (types, constructors, methods, members, global objects
  `IrReceiver`, `Wire`, `SPI`, constants, `F()`, `makeKeymap`) and their run-time side, which finds its module through the
  real wiring (I2C on A4/A5 and the address, SPI pins, the keypad's rows and columns, the stepper's coil pattern).
- `js/parts3.js`: the modules as data with their electrical behaviour (`elec`, `dyn`, `onWrite`); test helpers
  (`irSend`, `rfidShow`, `keyPress`).
- `js/models3.js`: the 3D models (canvas-drawn screens and artwork; the LCD and OLED redraw only when their picture
  changes), animation through view.js's `userData.update` hook (batch 4's).
- `js/scenes3.js`: what stands beside the bench, as logic (room air and chai, garden soil and plant, living room, thief and
  cat, door and latch, locker, kitchen gas, pan-tilt targets, turntable) with the flags and results the steps check.
- `js/worlds3.js`: the 3D of those scenes (built over several frames, instanced leaves, merged static meshes, no
  shadow-casting lights), the `scene3` camera view.
- `js/lessons3.js`: the ten lessons, added to `LESSONS` by `lessons.js` (`batch3(K)`).
- `js/blocks.js`: the block editor (model, C++ ↔ blocks, the DOM editor).
- `js/app3.js`: the app's side (`install3(app)`): the modules' callout panels (contrast, address, temperature / humidity,
  moisture, the remote's buttons, the keypad, the card and tag, the gas), presses on the 3D keypad and remote, the block
  editor's hooks, test hooks (`window.robo3`).

Shared-file hooks are marked "batch 3": `cpp.js` (LIB3 types `o:…`, objects with constructor arguments, `&Wire`, globals,
library methods and members, `parse()` for the blocks), `mcu.js` (`lib()`), `sim.js` (the MCU knows its lab; a part's
`onWrite` and `dyn` hooks), `parts.js`, `models.js`, `lessons.js` (registration), `main.js` (`install3(this)`),
`credits.html`.

### Phones and headsets

The scenes are built from merged meshes and canvas textures (no new image files); the busiest scene keeps the draw calls
low (see the test's numbers). In the headset the scene's controls appear in the panel's Robot tab (xrui.js draws world
controls), the 3D remote, keypad and cards can be pointed at, and the Code tab's number −/+ and "Make the step's change"
work in Blocks lessons too (the blocks follow the C++ when the student leaves the headset).

### Tests

- `node devtools/test/robocore3.mjs [modules|lessons|blocks|<id>,...]`: every module wired on a virtual bench and driven
  through its library (also wrong address, swapped SDA/SCL, wrong pins, no power, too fast); every lesson built from its
  ghosts, checked, run and played to "complete"; the block editor: every lesson sketch of every batch goes C++ → blocks →
  C++ with the same program and comments, the beginners' lessons are blocks only, each of their edit steps is done in
  blocks (values typed, a Maths block dragged in), a program put together from the palette compiles and runs on the bench,
  and the beginners' lessons are played to the end with the C++ the blocks wrote.
- `node devtools/test/robotest3.mjs [ids|all]`: every lesson through the real page in headless Chromium (puppeteer-core,
  port 8808): drags parts and wires, Check, Run, the edits through the blocks UI (types values, drags palette blocks into
  slots) or as C++, the scene's acts (panel buttons and sliders, the 3D remote, the 3D keypad, the card, the joystick held
  on a target). `PHONE=1` for a phone screen, `HINDI=1`, `SHOTS=1`.
- The old tests still pass: `robocore.mjs`, `robocore2.mjs`.

Offline: done in Integration (below): `robotics/sw.js` / `offline.json` list every file; run
`python3 devtools/offline/build_sw.py . robotics` again after any change.

## Batch 5: the BBC micro:bit V2, in Python (and blocks)

Eleven lessons on a 3D BBC micro:bit V2 that sits on its own desk in the lab (x = −2600 mm, so the Uno bench stays as
it is), coded in Python (MicroPython's `microbit` API) or in blocks that write the Python. Python runs in our own small
interpreter (`py.js`), so nothing is sent anywhere and there is no Python download.

| id | Class | Lesson | The student builds, codes and sees |
|---|---|---|---|
| `mbmeet` | 6 | Meet the micro:bit | taps the LEDs, A, B, the touch logo, the pins; turns the board over and taps the processor, motion sensor, speaker, USB, battery socket, antenna; runs `display.scroll('Hi!')` |
| `mbbadge` | 6 | Name badge | the board on a lanyard with a battery pack; types own name into `display.scroll`; changes the speed (`delay=`); sees it scroll letter by letter |
| `mbheart` | 6 | Heart beat | `Image.HEART` / `Image.HEART_SMALL` in a `while True:` loop with `sleep`; makes the beat faster; the app measures the beat (ms per beat) from what the LEDs did |
| `mbcount` | 6–7 | Button counter | a variable, `button_a.was_pressed()`, `display.show(count)`; presses A on the 3D board (mouse, finger, Quest trigger), B resets |
| `mbsteps` | 7 | Step counter and dice | `accelerometer.get_x()`, `was_gesture('shake')`, `random.randint(1, 6)`; tilts the board by dragging it (or the phone, or the Quest controller), shakes it; steps counted |
| `mbtemp` | 7 | Thermometer | `temperature()` with `print`; warms the room (slider) and sees the reading follow, with the CPU's own +1.4 °C |
| `mbcompass` | 7–8 | Compass | `compass.calibrate()` (the real tilt-to-fill-the-screen game), `compass.heading()`; turns the board on a compass card; an arrow points north |
| `mbnight` | 7–8 | Night light | `display.read_light_level()` (the LEDs as a light sensor) and an `if`; dims the room; the display lights when it is dark |
| `mbrps` | 8 | Rock, paper, scissors by radio | two boards, `radio.on()`, `radio.config(group=…)`, `radio.send` / `receive`; shakes one, then the friend's; both see each other's choice and who won |
| `mbplant` | 8–9 | Plant waterer | clips crocodile leads: 3V → nail 1, P0 → nail 2 (soil as a resistor), P1 → LED, GND → LED; `pin0.read_analog()`; the soil dries over time; the LED warns; waters the plant |
| `mbgate` | 9 | Servo gate | a servo with a boom on P0 (clips to SIG, 3V, GND); `pin0.write_analog` / `set_analog_period(20)` pulses; A opens, B closes; the boom swings to the angle the pulse width makes |

(Their numbers are given at load time, after the lessons before them: 48–58 with batches 2–4 in place. Each has
`lang: 'py'`, `batch: 5` and `cls`, the school class.)

### Python (`js/py.js`), reusable by batch 6

- `compile(src, opts)` → `{ ok, errors, warnings, info: { serial, imports }, make(host) }` (the shape of `cpp.js`'s compile).
  The program becomes one JS generator: every statement first asks the runtime whether its time slice is used up, so
  `while True:` without a `sleep` never freezes the page, and `sleep(ms)` moves a virtual clock (µs, as the C++ MCU's).
- `make(host)` → `Task`; `task.run(until_us, wallEnd)` → `'ok' | 'wall' | 'done' | 'error'`, `task.line` is the running line,
  `task.err = { type, code, args, line }`. The host (the board) gives `{ modules, print, hint, names, builtins, input }`;
  the language knows nothing of the micro:bit. Batch 6 (Raspberry Pi) adds its own `modules` (`gpiozero`, `RPi.GPIO`, `time`).
- Language: int / float (32-bit, printed as MicroPython does), str (f-strings, `%`, `format`), list, tuple, dict, range,
  slices, comprehensions, `if/elif/else`, `while`/`for` with `break`/`continue`/`else`, `def` (defaults, keywords;
  `*args` gets a friendly "not in this Python"), `lambda`, `global`, `try/except/else/finally`, `raise`, `import`, `from x import *`, `random`, `math`, `time`.
- Errors in English, Hindi and Hinglish, with the line, in the words a child understands (and hints for C habits:
  `i++`, `&&`, `!x`, `//` comments, `else if`, `true`, `println`). They are `P_*` codes in `CPP` (`i18n`), so the app's
  error box shows them like the C++ ones.

### The board (`js/microbit.js`, `js/models5.js`, `js/mbworld5.js`)

- `MicroBit`: 5 × 5 display (brightness 0–9, images, `scroll`, `show` with `delay`/`wait`/`loop`), A / B / logo (`is_pressed`,
  `was_pressed`, `get_presses`), accelerometer (from the board's tilt, `get_x/y/z`, `get_values`, gestures up / down /
  left / right / face up / face down / shake / freefall), compass (heading from the board's turn, the calibrate game),
  `temperature()`, light level, microphone (`sound_level`, `was_event`), speaker (`music.play`, `pitch`, built-in tunes,
  `audio.play(Sound.…)`), radio (groups, queue, `send` / `receive` / `send_bytes`, two boards), edge pins P0 / P1 / P2
  (`write_digital`, `read_digital`, `write_analog`, `set_analog_period`, `read_analog`, `is_touched`: press a pad when
  nothing is there to clip to).
- Pins drive real circuits: each crocodile clip is a wire in `solver.js` (pin = 3.3 V source through 120 Ω, ADC 10-bit,
  the soil probe a resistor that changes with moisture, an LED, a buzzer, a servo that follows the pulse width).
- The 3D board is made in code, front and back (no brand artwork; text says "micro:bit V2 compatible"): gold edge with
  its five 4 mm holes, LEDs that glow, buttons that press, the touch logo, the processor, the motion sensor, the speaker,
  the microphone LED, USB, battery socket, reset button, the antenna. Few draw calls (merged geometry, instanced LEDs),
  no shadow-casting lights.
- `MBCore` is the world (`cfg.make` in the lesson): it compiles (`world.compile`), runs the boards, keeps what the
  student did (`flag(n)`, `val(n)`) for the lesson checks, and gives the panel's controls (A, B, logo, shake, tilt,
  room temperature, light, heading, water, the friend's board).
- `MBView`: the desk scene (mat, lanyard, watch strap, compass card, plant pot, servo gate, battery pack, USB cable) and
  input. Mouse / finger: tap buttons and pads, drag the board to tilt it, wave it to shake, tap a pad then a part to clip
  a lead (double tap removes). Phone: tilt the real phone (`deviceorientation`, the "phone" control). Quest: the
  controller's ray and trigger on A / B / pads; trigger on the board and turn the hand to tilt it, wave to shake.

### Blocks (`js/blocks5.js`)

MakeCode-like blocks, our own design (colours by category, icons, Hindi labels): basic, input, music, radio, pins, logic,
loops, variables, maths. A Blocks / Python switch above the editor; every change to the blocks writes the Python, and
Python typed by hand is read back (`py.js` `parse`), with grey Python blocks for what the blocks do not know. (Batch 3's
`blocks.js` is for Arduino C++ and turns itself off for `lang: 'py'` lessons.)

### Files

- `js/py.js`, `js/microbit.js`, `js/models5.js`, `js/mbworld5.js` (loaded when a micro:bit lesson opens), `js/blocks5.js`,
  `js/lessons5.js` (`batch5(K, n0)`).
- Shared-file hooks are marked "batch 5": `lessons.js` (import + push, in the browser only, so the C++ runners
  `robocore.mjs` / `robocore2.mjs` do not see Python lessons), `main.js` (`run()`: `world.compile` when the world has
  its own language; `setWorld`: `cfg.make`), `editor.js` (`editor.mode`: highlighting, indent, Tab for Python),
  `xr.js` (`centre()`: a world on its own desk), `credits.html`, `devtools/test/robotest.mjs` (skips `mb*` lessons).

### Tests

- `node devtools/test/robocore5.mjs`: the interpreter (numbers, strings, lists, dicts, loops, functions, recursion,
  exceptions, errors with line numbers in three languages, `while True` without `sleep` does not freeze), the micro:bit
  API (display, buttons, gestures, compass, music, pins and circuits), radio between two boards and groups, blocks
  ⇄ Python, then all 11 lessons end to end without a page.
- `node devtools/test/robotest5.mjs [ids|all] [outdir]`: every lesson in headless Chromium (port 8810) through the real
  UI: taps on the 3D board, drags to tilt, shakes, clips, the panel's sliders, Run / Check / Next. `PHONE=1` (touch, CPU
  ×4), `XR=1` (Meta Quest 3 emulated by IWER: controller ray and trigger on A / B, tilt by turning the controller, shake
  by waving it, clips), `SHOTS=1` for a screenshot per step. Fails on any page error. It waits by the board's clock, not
  the wall clock: in software WebGL on a busy machine a frame can take seconds, and the board's time moves only with frames.
- The old tests still pass: `robocore.mjs`, `robocore2.mjs`.

Offline: done in Integration (below): `robotics/sw.js` / `offline.json` list every file; run
`python3 devtools/offline/build_sw.py . robotics` again after any change.

## Integration (batches 2–5 together)

After the four batches were built side by side, the whole app was checked, finished and tested as one (Nov 2026).

### Fixed

- **Start-up.** `index.html` had lost batch 2's robot panel (`#world`, `#wlabels`, the 🏁 Robot button and their CSS), so
  `main.js` stopped at start. Cause: `commit_clean.sh` puts `robotics/index.html` back from HEAD after each commit of another
  app; **commit `robotics/index.html` before that script runs again.** Long values in the panel wrap. The lesson strip has
  sections (Arduino basics · Robots · Nano · Mega · ESP32 · School-lab projects · micro:bit). Hinglish titles of arm 4/5 and the Nano.
- **Installed Quest app.** It never started VR (start URL without `?app=vr`). VR now starts by itself with `?app=vr`, when
  opened by the Android app (`document.referrer` `android-app://…`) or in a Quest browser's standalone window; it retries
  every 3 s for 3 min and when the app comes back to the front, asks for 72 Hz, and shows one big "Enter VR" button if it
  cannot start and after VR ends (a click keeps trying ~10 s: a closing session blocks a new one for a few seconds). The
  headset panel has ☰ Lessons (every lesson by section, in pages, ✓ done, 🔒 locked, Free build), ☰ All lessons on a
  finished lesson, and ⏻ Exit (ends VR; the installed app also closes its window, or goes to the headset's home).
- **Headset frames.** World builds, shader warm-up, deferred parts and the page's ready mark waited on
  `window.requestAnimationFrame`, which an immersive session may stop (Quest Browser): they use `stage.nextFrame()`, the
  window's or the session's frame, whichever comes first.
- **Headset panel and ray.** Keypad keys, remote buttons and the RFID card can be pressed by ray and pinch (`app.press3`).
  Free build's Parts tab has pages. World controls: "→ Robot" on such steps, Next on the Robot tab. A pin click with the
  Select tool is a tap on that part of the board (it started a wire, and a half-made wire carried into the next lesson). The
  Wire tool reaches free holes past a Nano/ESP32, past a jumper arching over them, past a knob, and a module's own pins
  through it (LCD I2C pins, relay terminals). App messages and the Serial Monitor's last lines show on the panel; long
  labels shrink to fit. micro:bit shake: one hand point a frame (it was one a sim slice). Hands put down: the frozen hand goes.
- **Mouse and touch.** A step's ghost and both ends of a wire stay out from under the panels (`stage.fitGoal`); a handle
  behind a jumper wins the click (`view.handleBehind`); the innermost block slot takes a dropped value block; the ESP32 Hall
  magnet's N/S letters belong to its halves (pointing at the N took the whole stand). Arm 5's joystick has its own view.
- **Lost GPU** (memory pressure, app in the background): the room light is made again on `webglcontextrestored` and every
  2D canvas keeps its picture in memory, so the bench is no longer black afterwards.
- **Performance** (phone: `robophone.mjs`, CPU ×4, no parallel shader compile, as the Adreno 610). Drawer pictures: one kept
  renderer, one picture a frame, the next lesson's made while reading (was a new WebGL context per lesson, 3–9 s). Shaders:
  warmed one part a frame after start (`app.warmParts`); a robot, room or micro:bit desk compiles one material a frame
  (`stage.warm`); materials of a closed lesson are kept so their shaders stay. Sketch time: the 5 ms budget is checked every 8
  pin reads, sketch + robot get at most 9 ms a frame on a phone or headset; the circuit is solved again only when a pin
  really changes (a line follower solved it on every read). `tex.js` noise ~20× faster. The headset panel redraws live
  values at most twice a second.

### Tests (Nov 2026, software WebGL on a shared 2-CPU machine)

All on software WebGL (SwiftShader) on a shared 2-CPU machine; at the end another job took most of a CPU, so frame
rates and times there are far below a real phone or headset (the browser tests ran at nice −10).

- `robocore.mjs` … `robocore5.mjs` (no browser): all pass.
- `robotest3.mjs all` 10/10 · `robotest4.mjs all` 11/11 (+ esp_hall, esp_knob after the magnet fix) · `robotest5.mjs all`
  11/11, `XR=1` 11/11, `XR=1 HANDS=1` mbcount, mbsteps, mbplant 3/3.
- `robotest.mjs` (desktop, 47 lessons): each passed in this work, but the whole list was not run again after the last
  changes (circuit cache, headset panel, installed app).
- `roboxr.mjs` (36 lessons in the headset, arm1 and homeauto with hands): every lesson passed after its fix (25 in one run,
  then lcdtemp, irrigate, burglar, rfidlock, weather, keylock, gasalarm, pantilt, turntable, homeauto, linecar), and meet,
  knob, arm1, lcdtemp again after the panel changes. `roboxr4.mjs` 11/11 after the fixes (esp_bt with hands).
- `roboapp.mjs` (the installed Quest app) 5/5.
- `robophone.mjs all`: every lesson opens without an error on the emulated phone and in the Quest browser. The longest
  task while a lesson opens (phone, quiet machine) went from up to 9.3 s (lcdtemp 9310, homeauto 7627, irrigate 7092,
  keylock 6947, iralarm 5539, parking 4990, esp_touch 4540, btcar 4462, rfidlock 4349) to 0.07–2.7 s; JS a frame with the
  robot running from up to 392 ms (linecar; iralarm 100, button 70) to ≤ 14 ms. Draw calls ≤ 93, triangles ≤ 22 140,
  shader programs ≤ 44. The last full phone run and the Quest-browser run (`QUEST=1`) at the end: all 58
  lessons open without an error, but the machine gave them a median of 3 frames in 5 s, so their times are noise (lcdtemp
  4.4 s phone, 9.7 s Quest-browser, where the emulator's parallel shader compile blocks; a real Quest compiles in the
  background). fps to be measured on the headset.
- Offline: `robotics/sw.js` and `offline.json` list all 89 files of the app (5.6 MB); every file the tests loaded is in it.
- `dbgview` check: in all 195 place and wire steps of 38 lessons the ghost and both wire ends are on the canvas.

### Open

- Run `robotest.mjs all`, `roboxr.mjs all` and the phone runs (`PHONE=1` of robotest / robotest3 / robotest5) once more on
  a quiet machine; measure fps on the headset and the test phone (here only software GL).
- `commit_clean.sh` resets the index and checks out `robotics/index.html`, `sw.js` and `offline.json` from HEAD in the shared
  checkout: commit robotics (with its new files `git add`-ed) before another app is committed, then run `build_sw.py` again.
- In the headset these stay page-only: typing code (the panel changes numbers and makes a step's change), the block editors
  (a new variable asks with `prompt()`), the multimeter, the Serial Monitor's input box, the run speed, the board choice of
  Free build. No lesson needs them.
- Rare in the emulator: `window.requestAnimationFrame` stopping in an immersive session cannot be shown here; the fix is
  for the Quest Browser.
- No micro:bit in Free build.

## Batch 6: Raspberry Pi (Pico in MicroPython, Pi 4 in Python)

Twelve lessons, Class 8–12, on the two Raspberry Pi boards: the **Pico** (RP2040) plugs into the breadboard like the Nano
and runs MicroPython (`machine.Pin`, `PWM`, `ADC`, `time_pulse_us`); the **Pi 4 Model B** lies on the mat beside the
breadboard, its 40-pin header next to it, and runs Python 3 with **gpiozero** (also `RPi.GPIO`, `adafruit_dht`,
`signal.pause`, `input()`). Both reuse batch 5's interpreter (`py.js`) and the bench of batches 1–4 (breadboard, drawer,
ghosts, wires, Check, the multimeter, the headset's ray), so every bench tool works on them. The Pico's output is the
**Shell** (as in Thonny), the Pi's the **Terminal**, also shown on a small 5" HDMI screen left of the Pi, turned to the student (useful in VR).

| id | Class | Lesson | The student builds, codes and sees |
|---|---|---|---|
| `pico_blink` | 8 | Meet the Pico: blink its LED | taps the RP2040, BOOTSEL, the LED, the pin row; `Pin("LED", Pin.OUT)`, `toggle()`, `time.sleep`; makes it blink 5× faster |
| `pico_led` | 8 | An LED on GP15, with its resistor | LED + 330 Ω on the breadboard, GP15 and GND wired; `led.value(1)`; ≈ 4.5 mA explained; kind hints for a missing resistor, a reversed LED, no GND on the rail |
| `pico_button` | 8–9 | A push button with a pull-up | button on GP14 with `Pin.PULL_UP` (pressed reads 0); then a toggle switch (`led.toggle()` + debounce wait); hint when both wires sit on legs that are always joined |
| `pico_fade` | 9 | Breathing LED: PWM | `PWM(Pin(15))`, `freq(1000)`, `duty_u16` in two `for` loops; slows the breath |
| `pico_pot` | 9–10 | A knob, the ADC and print() | knob on 3V3(OUT) / GND / GP26; `ADC(26).read_u16()` printed with its voltage in the Shell; then the knob sets the LED's PWM; hint if a knob end is on VBUS (5 V into the ADC) |
| `pico_servo` | 10 | A servo: angles from pulses | SG90 on GP15, its + on VBUS; 50 Hz PWM, `def angle(a)` turns degrees into a 0.5–2.5 ms pulse; then a radar sweep in 10° steps |
| `pico_sonar` | 10–11 | Ultrasonic distance, safely at 3.3 V | HC-SR04 on VBUS; Trig → GP17; Echo through a 1 kΩ / 2.2 kΩ divider to GP16 (5 V → 3.4 V); `time_pulse_us`; then the Pico's LED warns under 20 cm; hints for Echo straight into GP16 and for swapped resistors |
| `pico_lamp` | 10–11 | Mini project: a smart night lamp | LDR + 10 kΩ divider on GP26; the lamp lights below a threshold as the room light (slider) falls; tunes the threshold (20000 → 32000) |
| `pi_led` | 9–10 | Raspberry Pi 4: an LED and a button (GPIO numbers) | taps the processor, header, USB-C; physical pin 11 = GPIO 17 (the pinout card on the mat); `LED(17).blink()` + `pause()`; a button on GPIO 27 with `when_pressed = led.on` |
| `pi_pir` | 10 | Motion alarm: PIR sensor and buzzer | PIR on 5 V (its OUT is 3.3 V, safe) → GPIO 4, active buzzer (new part `abuzz`) → GPIO 18; `wait_for_motion`, `beep(n=5)`; a visitor counter |
| `pi_dht` | 10–11 | Weather station in the terminal: DHT11 | DHT11 on GPIO 4 / 3.3V / GND; `adafruit_dht.DHT11(board.D4)`, f-string with `strftime`, `try/except RuntimeError` (a reading fails now and then, as on a real Pi); "Too hot!" over 35 °C |
| `pi_car` | 11–12 | A Raspberry Pi robot car | batch 2's car parts (L298N, battery, two motors) with IN1–IN4 on GPIO 5, 6, 20, 21; the student wires ENA → GPIO 12, ENB → GPIO 13 and the common ground; `Robot(left=Motor(5, 6, enable=12), right=…)`; a timed route that parks in P after the last `sleep` is made longer |

(Numbered at load time after the lessons before them: 59–70 with batches 2–5. Each has `lang: 'py'`, `batch: 6`, `cls`,
`baud: 115200`. Section "Raspberry Pi · Python" in the lesson strip and in the headset's ☰ Lessons.)

### The boards (`js/boards6.js`, `js/pi6.js`)

- **Pico**: 40 pins in rows c and h, columns 2–21, USB to the left; nets VBUS = 5 V, VSYS, 3V3(OUT), ADC_VREF, AGND, RUN;
  GP23/24/29 are inside the board (an error if used). 3.3 V logic (VIH 2.0 V), ADC on GP26–28 (12-bit, `read_u16`), channel 4
  is the temperature sensor; the green LED is GP25 / `"LED"`.
- **Pi 4**: the J8 header from the official drawing (pin 1 = 3V3 at the corner hole, odd pins inner row), placed at
  x = −98 turned a quarter so the header faces the breadboard and pin 1 is at the back. BCM numbers are the pin ids
  (`GPIO17`), the popup and the card give the physical number too. GPIO 2/3 have the board's 1.8 kΩ pull-ups. GPIO 28 is a
  stand-in for the ACT LED (not on the header).
- `PyMCU` (pi6.js) runs a `py.js` task on the MCU clock: interrupts / gpiozero callbacks between statements, a time-ordered
  queue for gpiozero's background jobs (`blink`, `beep`, `pulse`), the Pi's program ends (devices closed, a note if
  callbacks were set without `pause()`), the Pico keeps its timers and shows `>>>`. Errors are English tracebacks in the
  Shell / Terminal plus a kind hint in EN / HI / Hinglish (`N6_*`, `W6.*` in `CPP`): a pin in the code with no wire,
  `LED(11)` when the LED is on physical pin 11 ("write 17"), `GP` leg numbers, `DistanceSensor(23, 24)` swapped, a DHT22
  object on a DHT11, `machine` imported on the Pi or `gpiozero` on the Pico.
- Circuit hooks (`LAB_HOOKS`): clamp diodes on each used GPIO and a warning for 5 V on a GPIO / ADC pin (`W6.pin5v`), more
  than 12 mA (Pico) or 16 mA (Pi) from a pin; `env.vlogic` = 2.9 V so the L298N reads 3.3 V logic as HIGH.

### 3D (`js/models6.js`, our own work, no downloaded models)

Modelled in code from the official mechanical drawings: the Pico (51 × 21 × 1 mm, castellated pins, RP2040 QFN, flash,
crystal, BOOTSEL, LED, micro-USB with its cable) and the Pi 4 (85 × 56 mm, BCM2711 lid, LPDDR4, J8 with 40 gold pins, PoE,
2 × USB 3 blue + 2 × USB 2, Ethernet with LEDs, USB-C, 2 × micro-HDMI, audio, CSI / DSI, microSD, PWR / ACT LEDs). Printed
sides are canvas textures (≤ 1024 px; phones half), static pieces merged by material (~15–20 draw calls a board). Beside the
Pi: a printed GPIO card on the mat, row by row level with the header (odd pins left, even right, coloured 3V3 / 5V / GND /
GPIO, "3.3 V logic · never 5 V into a GPIO"), the 5" screen to its left (a canvas terminal, redrawn ≤ 5×/s when the text
changes; left, not behind, so Free build's board box has its place) and the cables. Views: `pi6` (screen, Pi, card,
breadboard) and `pi6w` (wiring: the Pi and the breadboard). The car lesson puts a light Pi 4 on the car plate (`CAR_BOARD.pi`). No logos; credited in `credits.html`.

### Files

- New: `js/boards6.js`, `js/pi6.js`, `js/parts6.js` (the active buzzer), `js/models6.js`, `js/lessons6.js`
  (`batch6(K, n0)`), `js/app6.js` (`install6(app)`), `devtools/test/robocore6.mjs`, `devtools/test/robotest6.mjs`.
- Shared-file hooks, each marked "batch 6": `boards.js` (`BOARDS6`), `sim.js` (`import './pi6.js'`), `cpp.js`
  (`compile` → `board.compile`), `parts.js` (`PARTS6`, `DRAWER6`), `parts2.js` (L298N: `env.vlogic`), `boards4.js`
  (`def.pinTitle` / `def.pinShort`), `models4.js` (`BUILD4` registry + helper exports), `models.js` (`buildPart6`,
  `setLite6`), `models2.js` (`CAR_BOARD`), `robots.js` (`CAR_CFG.pi`), `worlds.js` (the Pi car's HUD title and "parked"),
  `lessons.js` (import + push in the browser only), `main.js` (`install6`), `app4.js` (`STARTER` exported, board-box
  sizes for any board), `blocks.js` (no Arduino blocks on a Python board), `i18n.js` (`grp_pi`), `xrui.js` (the
  section in ☰ Lessons, four a row; `#` comments grey; PIR ✋ and DHT11 °C ± on the panel), `credits.html`,
  `devtools/test/robotest.mjs` (skips `pico_*` / `pi_*`).

### Tests

- `node devtools/test/robocore6.mjs [engine|lessons|ids]` (no browser): the boards (pins, holes, header), MicroPython on the
  Pico (Pin, PWM, ADC, temperature, `time_pulse_us` through a divider, irq, Timer, errors and hints), Python on the Pi
  (gpiozero LED / PWMLED / Button / MotionSensor / Buzzer / DistanceSensor / Servo / Motor / Robot with an L298N and the
  common ground, `pause()`, RPi.GPIO, adafruit_dht and its failed reading, `input()`), then all 12 lessons step by step
  as a student plays them (built at the ghosts, checked, run, edited, acted on; the car's route calibrated with `CarSim`),
  and the kind hints for the usual wiring mistakes.
- `node devtools/test/robotest6.mjs [ids|all] [outdir]` (port 8811): every lesson in headless Chromium through the real UI;
  `XR=1` in WebXR (IWER Quest 3) with the controller ray, `HANDS=1` with pinches; `SLOW=n` for a busy machine.

## Batch 7: thirty Arduino projects (games, alarms, meters, displays, home automation, mechanisms)

Thirty complete projects, Class 6–11, built only from parts the bench already had, on the Uno (27), the Mega (1) and the
ESP32 (1) (and the Uno's 7-segment, LCD, OLED, keypad, relay, stepper, L298N, IR remote …). Section "Arduino projects" in
the lesson strip and in the headset's ☰ Lessons. The ideas come from well-known school projects (an owner's "300+ Arduino
projects" pack was used as a list of ideas only: every circuit, sketch and text here is our own).

| id | Lesson | Board · parts | The student builds, codes and sees (and the realistic mistake the check explains) |
|---|---|---|---|
| `sos` | Morse code lighthouse | LED, buzzer | a `String code[26]` table; SOS in light and beeps, then their own name (LED reversed) |
| `melody` | Music box: play a tune | buzzer, button | notes[] / beats[] arrays; "Twinkle, twinkle"; tempo 300 → 150, the tune's length measured (buzzer on the wrong pin) |
| `theremin` | Light theremin | LDR divider, buzzer | `map()` light → pitch; the shadow plays low; the map turned round (LDR and resistor swapped: plays backwards) |
| `rgbtemp` | Colour thermometer | LM35, RGB LED | blue < 20 °C < green < 32 °C < red (LM35 turned round: floating, nonsense readings) |
| `crossing` | Zebra crossing with a WALK button | 3 LEDs, button, buzzer | press WALK: yellow, red with beeps for the blind; walkTime 5 → 8 (both button wires on one side: it walks by itself) |
| `quizbuzz` | Quiz buzzer for two teams | 2 buttons, 2 LEDs, buzzer | first press wins, the other is locked out for 5 s (team B on the wrong pin) |
| `reaction` | Reaction timer game | button, LED, LCD | `random()` wait, `millis()` stopwatch, "Too early!" (LCD on 3.3 V: blank) |
| `segcount` | Count 0 to 9 on a 7-segment display | 7-seg + 7 resistors | a `digits[10][7]` table; counts up, then down (COM on 5 V: nothing lights) |
| `dice` | Electronic dice | 7-seg, button | tumbling `random(1, 7)`; a 1–9 lucky-number picker (a segment without its resistor burns) |
| `countdown` | Rocket launch countdown | 7-seg, buzzer, servo | 9 … 0 in `setup()`, the launch arm swings up; start = 5 (servo on 3.3 V: it never moves) |
| `lcdnotice` | School notice board on an LCD | LCD | wires the I2C LCD; `substring()` window scrolls a notice; their own notice (SDA/SCL swapped: blank) |
| `lcddist` | Distance meter with an LCD | HC-SR04, LCD | cm and a # bar, "TOO CLOSE!"; warn 10 → 20 (Trig/Echo swapped: 0 cm) |
| `speedgun` | Speed gun: two light gates | 2 IR sensors, LCD | v = 10 cm ÷ t; a faster run (gate 2 not wired: its floating pin makes up a speed) |
| `visitors` | Classroom visitor counter | 2 IR sensors, LCD, LED | IN/OUT counting, "ROOM FULL!"; limit 5 → 3 (LED without resistor burns when full) |
| `radar` | Radar screen on an OLED | servo, HC-SR04, OLED | sweep, `cos/sin` dots; range 50 → 100 (OLED SDA/SCL swapped: the servo sweeps, the screen stays dark) |
| `sketch` | Etch-a-sketch with a joystick | joystick, OLED | drawPixel trail, the stick's switch wipes; a thicker pen (VRx/VRy swapped: right draws up) |
| `calc` | Pocket calculator | keypad, LCD | A–D = + − × ÷, # =; 7 ÷ 2 = 3 (whole numbers), ÷ 0 = Error (rows and columns swapped: wrong keys) |
| `mathquiz` | Times-table quiz master | keypad, LCD, buzzer | random questions, score, beeps; tables to 12 (buzzer on pin 11: silent) |
| `schoolbell` | Automatic school bell | LCD, active buzzer | hhmm timetable array, a fast clock, `sizeof`; adds the 12:00 lunch bell (active buzzer reversed: silent) |
| `lightmeter` | Light meter for your study desk | LDR, OLED | % and a bar, "Too dark"; limit 40 → 60 (divider swapped: bright reads dark) |
| `corridor` | Corridor light: only at night, only when someone passes | PIR, LDR, relay, 230 V lamp | `&&`, an off-timer with `millis()` (PIR on 3.3 V: dead) |
| `autofan` | Automatic fan for a hot classroom | LM35, relay, 230 V fan | on > 30 °C, off < 28 °C: hysteresis seen at 29 °C (relay on the wrong pin) |
| `stairtimer` | Staircase light timer | button, LCD, relay, 230 V lamp | the student wires the relay's 5 V side; countdown; 10 → 5 s (relay + on 3.3 V: it never clicks) |
| `sanitizer` | No-touch sanitizer dispenser | IR sensor, relay, pump, 4×AA | wires the pump's loop through COM/NO; one dose per hand; 500 → 800 ms (pump on NC: runs all the time) |
| `remotefan` | Fan regulator with a TV remote | IR receiver, transistor, motor | `switch` on the remote's codes → PWM speeds (receiver turned round: no power, deaf) |
| `railgate` | Railway level crossing | IR sensor, servo, 2 LEDs, buzzer | boom down, lamps flash in turn, opens 2 s after the train (servo on the wrong pin) |
| `blinds` | Automatic window blinds | LDR, 28BYJ-48 stepper | half a turn up at > 600, down at < 300 (IN2/IN3 swapped: it only shakes) |
| `jsdrive` | Joystick drive: test a robot's motors | joystick, L298N, 2 BO motors, 18650 | the common ground; tank mixing left = y + x, right = y − x (no common ground: wheels still) |
| `mega_chaser` | Light chaser on the Mega | Mega, 10-LED bar, knob | two for loops bounce one light; the knob sets the wait (wiper on A1: A0 floats, the speed jumps) |
| `esp_alarm` | ESP32 motion alarm | ESP32, PIR on VIN, LED, active buzzer | rising-edge visitor count at 115200 baud (PIR on 3V3: dead; its OUT floats) |

(Numbered at load time after the lessons registered before them, so the numbers move as batches are added. Each has `batch: 7` and `cls`.)

### What is new in shared files (each marked "batch 7")

- `lessonrt.js`: a lesson may have `tick(S, dt)`, called every frame; it keeps what it saw in `S.mem` (all runs) and
  `S.memRun` (this run, cleared by Run); `S.serLines` holds the Serial Monitor's last 80 lines. Batch 7's `tick7`
  records the LCD's lines, the 7-segment's digits (`segDigit`), the OLED's lit dots, the relay / 230 V load switching,
  tones, and `memRun.dtb` (the board's seconds since the last frame). Every time in a step check is the board's own clock
  (`lab.mcu.t`) or a part's own accumulator (the relay's `onT`), never the page's frame time, so slow frames (a phone,
  software GL) cannot make a lesson fail.
- `mcu.js`: an `INPUT_PULLUP` pin with nothing wired to it now reads a steady HIGH (it was treated as floating).
- `blocks.js`: an arithmetic block's precedence depends on its operator (× ÷ % bind tighter than + −), so `(t2 - t1) / 1000.0`
  keeps its brackets through C++ → blocks → C++ (it lost them before, which changed the program).
- `models.js` → `models7.js`: `load230 { show: true }` puts the bulb (it glows with the box's `b`) or a ceiling fan (its
  blades turn with `a`) on the closed 230 V box, so a bench-only project shows what the relay switched; `pump { mount:
  'bottle' }` is a sanitizer bottle with a stream while the pump runs.
- `lessons.js` (registration, in the page and in node), `i18n.js` (`grp_projects`), `xrui.js` (the section in ☰ Lessons).

### Tests

- `node devtools/test/robocore7.mjs [ids]`: every lesson built at its ghosts, checked, run, its act / watch steps done as
  a student does them (press, slide, wave, type on the keypad, the remote, the joystick), the edits, `done`; and one
  realistic mistake per lesson: the check's message (all three languages present) and what the bench then does.
- `node devtools/test/robotest7.mjs [ids|all] [outdir]` (port 8811, `CHROME`, `SLOW=n`, `SHOTS=1`): every lesson through
  the real page with the mouse; saves `<id>-complete.png`.


## The project factory, battery circuits, curriculum and AR (20 Nov 2026)

**Project factory (`robotics/js/factory.js`).** One line of plan, a *job* (a real use with its story in English, Hindi
and Hinglish), a *sensor* and an *output*, becomes a whole guided lesson on three boards:

- Arduino Uno (C++), ESP32 (C++, 3.3 V, GPIO 34 ADC, ledc for the buzzer) and Raspberry Pi Pico (MicroPython, GP26 ADC).
- The output is already wired on the bench (LED, buzzer, servo, relay with a 230 V lamp / fan / heater lamp, pump with its
  own battery, LCD, RGB LED); the student places and wires the sensor (button, PIR, IR, knob, LDR, LM35, ultrasonic,
  soil, MQ-2, DHT11 temperature / humidity).
- Steps: place, wire, Check, Run, make the sensor do its job on the bench (callout controls), see the output answer,
  let it rest, **edit** the limit (analog: more sensitive, proved with a reading between the old and new limit) or the
  hold time (digital: `millis()`, 1 s → 3 s), and prove the change.
- Real-life faults: the circuit checks name a missing or wrong wire; on the ESP32 / Pico a 3.3 V part on 5 V is refused
  (its signal would damage the GPIO); the simulator does the rest (shorts, burnt LEDs, overloaded pins).
- Thresholds per board were measured in the simulator (`/tmp` calibration sweeps): Uno 10-bit, ESP32 12-bit, Pico 16-bit.
- `devtools/test/robofactory.mjs` plays every factory lesson end to end and checks a wiring mistake (321 lessons,
  2,248 checks). The simulator change it needed: an IR module (FC-51 type) is powered from 3 V up (it works at 3.3 V).
- Not yet: the LCD on the ESP32 (the simulator's I2C is the Uno's A4/A5), a buzzer on the Pico (PWM at audio
  frequencies is not sounded), the gas sensor on the Pico / ESP32 (a 5 V heater, 5 V signal).

**Battery circuits (`robotics/js/circuits.js`, Classes 1–3).** 19 lessons with no code (an empty sketch, so Run is
harmless): light an LED, why the resistor (the LED burns, then the fix), torch, doorbell, fan, series, parallel, dimmer,
LED polarity (in the wrong way it stays dark), motor car, a motor both ways (swap the wires), burglar alarm (a door wire
that shorts out the buzzer), quiz board, RGB colour mixing (each colour wire a switch), lighthouse, traffic signal by
hand, a Morse key (S O S timed in `tick`), battery level by brightness (6 V box, then 9 V), and a short circuit (3D only:
the LED goes out, about 10 A flows, the battery heats; sim.js now measures a battery's current and warns `BAT_SHORT`).
`devtools/test/robocircuits.mjs`.

**micro:bit projects for Classes 2–5 (`lessons10.js`, `lessons8.js`, `lessons9.js`, `lessons11.js`; batches 10, 8, 9, 11; 65 lessons).**
Written for the curriculum's micro:bit sessions, all checked on a real MBCore with the real lesson runtime by
`devtools/test/robocore8.mjs` (every step comes true with what a student does on the panel; mistakes caught):
- Class 2 (11): smiley buttons, emotion badge, dance steps, music box (Ode to Joy, The Entertainer), countdown, calm
  breathing (Image.fill brightness), activity picker, love meter (touch pin, "the number is random"), hand-washing
  timer, banana keyboard (Sa Ga Pa on pins 0–2), hot potato. The world opens in blocks (`blocks: true`).
- Class 3 (23): rock-paper-scissors, reaction time (cheating caught), light meter (a bar), dice with dots, stopwatch,
  tug of LED, seven-second game, coin flipper, spirit level, clap lights (a threshold so talking doesn't count), noise
  meter, pet hamster, blow away the LEDs, poetry machine, steady-hand wire (pin 0), class survey (a % that divides by
  zero with no votes, as on a real board), snap the dot, magic 8-ball, guess my number, bike light with modes, Morse
  tapper (a dict), catch the falling dot, trundle wheel.
- Class 4 (18): radio between two boards (micro chat, mood radio, red light green light, multi dice, teleporting duck,
  voting machine with one vote each), clipped parts (waving arm and carton robot and automatic curtain on a servo, night
  lamp LED with a PWM glow, plant thirst alarm on two nails), and instruments (air guitar, step measurer, kick logger,
  traffic survey with a CSV line, compass treasure hunt, timing gates on pins 0 and 1), digital balance, fireflies by radio
  (they fall into step: a nudge only in the second half of the cycle, else the gap never closes), burglar alarm (motion
  and a buzzer clipped to pin 0).
- Class 5 (10): environment logger (CSV), solar spots (a list, max, index), egg drop and rocket loggers, flappy bird on
  5 × 5, an infection game by radio with a vaccine, binary stopwatch (overflow after 31), combination lock (3 wrong
  tries lock it), railway crossing with a servo barrier, and gesture recognition by machine learning (examples in two
  lists, the nearest average wins).
- microbit.js additions: `val('sound' | 'music' | 'tone' | 'friendText' | 'friendLit')`; panel controls for touching pins
  0–2 and the friend's A / B; PWM on a pin drives an LED with full 3.3 V pulses (brightness ∝ duty), so
  `write_analog(300)` glows instead of staying dark; a board reset forgets an old shake (its time lay in the future).
  blocks5.js: `(a - b) // c` keeps its brackets (a precedence bug).
- The curriculum: Class 1 13 of 18 project sessions live, Class 2 22 of 22, Class 3 26 of 26, Class 4 24 of 26, Class 5 24 of 26; the four simplest
  batch-5 lessons (badge, heart, night light, coin) moved to Class 2 and Class 3 got new ones in their places.

**Curriculum (`devtools/curriculum/`).** The idea bank (`ideabank.py`: 2,400+ project plans, 1,170+ distinct ideas, by
board, parts and class) and the Class 1–12 plan (`curriculum.py`: 32 sessions each), which writes
`robotics/js/curriculum.js`: the strip's **Class** picker shows that class's live lessons in session order (`?cls=7`),
and a search box finds lessons by any word of their title in any language.

**AR (`xr.js`).** *Enter AR* (shown where `immersive-ar` is supported): on a Quest the bench stands in the real room
(passthrough, the wooden desk hidden), worked as in VR; on a phone (ARCore) a ring follows the table the camera sees,
a tap puts the bench there at 1.5 × real size, then taps work the same panel. Tested on an emulated Quest 3 (IWER).

**Projects pack (`devtools/robopack/export.mjs`).** Every project as a folder for the pen drive: README (English and
Hindi: goal, parts, wiring table, steps), the code (`sketch.ino` / `main.py`), `wiring.csv`; `index.html` (search,
class and board filter, offline) and `projects.csv` at the top.

**Batch 12 (743 projects).**
- Class 1 circuits (`circuits.js`, 22 now): a conductor-or-insulator tester (the new `sample` part: a spoon, coin, pencil,
  ruler, eraser or ice-cream stick between two crocodile clips, swapped in its callout), a spinning top with Newton's
  colour disc (`motor { disc: true }`: four times the fan's inertia, so it coasts like a top; the disc blurs to grey-white
  when fast) and the steady-hand buzz-wire game (the new `buzzwire` part: drag the ring or use its slider; a bend taken
  faster than 0.16 lengths a second touches; the red-tape rests are insulators). Parts in `parts12.js`, models in
  `models12.js`; a part's own `controls(p, T, R)` / `bind(p, el, app)` give its callout (the app4.js hook).
- Class 6 on the Uno (`lessons12.js`, group "projects"): binary counter on 4 LEDs (count in twos: the 1s LED never
  lights), diode one-way street (take it out, put it in backwards: dark while pin 7 is HIGH), transistor as a switch
  (a three-LED lamp of 40 mA switched by about 4 mA of base current; pin 9 straight to the base is named and the
  simulator warns about the pin), servo dance from an array of angles, and a resistor colour-code reader (a 10 kΩ divider,
  snapped to the E12 series so a 1 kΩ that measures 988 Ω still reads brown, black, red), an Ohm's law tester (A0 above
  the resistor, A1 above a 100 Ω shunt: I = V(shunt) ÷ 100, R = V ÷ I) and Simon says (the pattern grows each round; the
  test watches the lights and plays it back). Class 6 is complete (26 of 26). Tests: `robocore12.mjs`.
- The factory (`factory.js`, 492 lessons): every LCD job also on the 0.96" OLED (Uno, ESP32); the ESP32 gets the RGB LED,
  the servo and the I2C LCD; the Pico gets the buzzer and the RGB LED. On the ESP32 the module covers breadboard rows
  b–i, so its pre-wired outputs start in row a or j. The Raspberry Pi 4 (57 lessons, Class 10): button, PIR, IR obstacle
  and DHT11 jobs in Python with gpiozero (Button, MotionSensor, DigitalInputDevice, adafruit_dht) to an LED, active
  buzzer, relay, pump, AngularServo (0.5–2.5 ms for an SG90) or RGB LED; the hold is in seconds (time.monotonic()).
  A lesson's `view` now takes effect (it sat behind a comment): wide for parts on the mat, else bb / esp4 / pi6w.
- Simulator: `#include <Servo.h>` on an ESP32 stops as the real IDE does (`E_SERVO_ESP`; use ESP32Servo.h, which is
  refused on other boards); I2C modules answer on a board's own SDA / SCL (`consts.SDA / SCL`: ESP32 21 / 22, Mega 20 /
  21); a Pico PWM pin at 100 Hz–20 kHz is a note (a buzzer on it sounds, an LED on it keeps its duty); a buzzer takes the
  note of the pin it is on when two pins play PWM.
- The class picker: after a class's sessions comes "More projects for this class" (every live lesson whose `cls` covers
  that class), so Class 8 shows its 18 sessions and about 200 more.
- The curriculum: 200 of 300 project sessions live (Class 1 16, Class 6 24 of 26).
- Last runs (20 Nov 2026, software GL on a shared 2-CPU machine, `SLOW=2`): `robocore.mjs` … `robocore7.mjs` all passed;
  `robotest7.mjs` 30/30 lessons complete, 0 page errors (two needed a fix found by the browser run: the reaction game now
  watches the button during the whole wait, and the test presses keypad keys in the keypad's card, because the 3D `0` key
  lies under the keypad's own wire bundle).
- Not done: headset (XR) runs of the new lessons; the IR remote and the keypad can be pointed at only where batch 3 made
  them pressable (the remote's buttons are in the receiver's card on the page, not in the headset panel).


**Batch 13 (747 projects): micro:bit for Classes 4 and 5 (`lessons13.js`, tests `robocore13.mjs`).** A dimmer (the new
clip-on `pot` part: a 10 kΩ knob on a foam block, its panel slider "Turn the knob"; read_analog on pin 1, PWM on pin 0;
night mode = knob // 4), hot or cold by radio signal strength (receive_full() now gives a real RSSI: about −45 dBm at
1 m, 25 dB weaker for every ten times the distance on the panel's "Distance between the boards" slider, 3 dB weaker for
each power step below 7; beyond −98 dBm a message is lost), a simple AI exercise coach (it keeps your best and sets the
next target = best + 2) and an inchworm robot (scene `worm`: the servo's swing moves it 0.25 mm a degree, shown on a
paper ruler that slides back under it). Classes 2–6 are complete; 207 of 300 sessions are live.


**Batch 14 (1,256 projects): the project bank grows, and comes to the micro:bit (`factory.js`, `factorymb.js`, tests
`robofactory.mjs`, `robofactorymb.mjs`).** 59 new jobs (160 in all), taken from the projects school labs and maker sites
build worldwide (ATL handbook ideas, science-fair lists, Arduino / micro:bit / Pi classroom projects) and written fresh for
DUET: a bus stop request bell, grandparent help button, canteen order sign, pet feeder, quiz buzzer, electronic
scarecrow, terrace monkey alarm, baby cot watcher, wild elephant warning, dustbin-full sensor, conveyor box counter,
goal-line sensor, over-speed and crane-angle warnings, a light-beam smoke detector, tower beacon, power-cut alarm,
headlight dipper, iron-left-on and transformer heat alarms, pipe-freeze warning, chick brooder, ride height check,
screen distance guard, platform edge warning, grain silo, sewer gas warning for workers, drunk-driving ignition lock,
fruit ripening watch, poultry shed cooling, museum humidity guard, mirror demister and more. Factory lessons: 923
(Uno 351, ESP32 299, Pico 178, Pi 4 95). New relay loads: garage fumes, poultry and drying-room fans; brooder and mirror
heaters.
- The micro:bit bank (`factorymb.js`, 135 lessons, Classes 3–6, group `bank`, ids `m_<job>_<out>`): every job whose
  sensor the micro:bit has (button A; the light level its LED screen reads, dark or bright; the chip's temperature, hot
  or cold; a knob on pin 1 by crocodile clips) to its speaker (a beep every 150 ms while on), its LED screen (a tick, or a
  cross for a warning: a job whose message has a capital word), an LED on pin 0 (relay jobs: the LED stands in for the
  lamp) or a servo on pin 0 (scene `gate`). The knob and the servo are never together (they would stand on the same
  spot). MicroPython that opens as blocks and back (comments go). Steps as the Arduino bank: clips, check, run, on, off,
  one edit (limit or hold = 1000 → 3000), and the proof. `lang: 'py'`; the pack exports them as micro:bit projects.
- Last runs (20 Nov 2026): `robofactory.mjs` 6462 ok, `robofactorymb.mjs` 330 ok, `robocore.mjs`, `robocore12.mjs`,
  `robocore13.mjs`, `robocircuits.mjs` all passed; three micro:bit bank lessons checked in the browser (clips, check,
  run, servo gate, knob and LED).
- The Class 7 robot cars (`lessons14.js`, group `robots`, tests `robocore14.mjs`): **edgecar** (a table robot on a
  1000 × 700 mm desk 750 mm above the floor, `buildDeskArena`; two "cliff" IR modules on an acrylic bar 50 mm ahead of
  the ball caster; a wheel or the caster past the edge and it falls, nose or side first, and lies on the floor until
  Start. At speed 120 drive(0, 0) lets it coast to a stop in time; at 255 it rolls over; reversing at once saves it),
  **lightcar** (two LDRs looking ±32°, their own lux on the bench: `p.state.ext` + `lux`, from a torch on a stand at A,
  B or C (panel), 40 lux at 1 m, cos^1.5 / d²; it spins to look when both eyes read dark; near = 940 stops ~220 mm from
  the torch, 860 ~380 mm; the torch is back at A on each Run), **dancecar** (a dance mat; `step()` routine; a spin is
  measured from the start to the end of turning on the spot: 600 ms ≈ 162°, 1350 ms ≈ 355°), **lapcar** (the line
  track with a black LAP marker inside the near straight; a third IR on the car's left at 58 mm sees only the marker;
  laps timed with millis()). `carFeed(sim, lab)` in robots.js writes these sensors into the bench, for worlds.js and the
  tests alike. Views `arenaedge`, `arenalight`, `arenadance`. Class 7 is complete: 211 of 300 sessions are live.
- Class 10 on the Raspberry Pi 4 (`lessons15.js`, batch 15, group `pi`, page only like batch 6; tests `robocore15.mjs`):
  traffic lights (red / amber / green on GPIO 22 / 27 / 17, the student adds the green; the tick follows the sequence
  R → RA → G → A → R and times the green), reaction game (uniform(2, 5) wait, time(), best of three, "Lightning fast!"
  under 0.3 s), distance with gpiozero's DistanceSensor (the 1 kΩ / 2.2 kΩ divider on Echo is the student's job; a
  buzzer on GPIO 18 when closer than 20 cm), a quiz buzzer for three teams (lists of Buttons and LEDs, the first press
  wins, `lock` seconds for the others) and a Morse code translator (input() in the terminal, a dictionary, one `unit`
  sets every timing). 216 of 300 sessions are live; 1,265 projects.
- The bank on more boards: the Pico reads a DHT11 (MicroPython's own `dht` module, now in pi6.js: `dht.DHT11(Pin(14))`,
  `measure()`, `temperature()`, `humidity()`; a missed reading is `OSError: [Errno 110] ETIMEDOUT`, which the sketch
  catches) — 19 lessons; the Pi 4 reads an HC-SR04 with gpiozero's DistanceSensor (Trig GPIO 25, Echo through a
  1 kΩ / 2.2 kΩ divider that the factory puts on the breadboard first, `preParts` / `preWires`, to GPIO 24) — 18
  lessons. `robofactory.mjs` 6721 ok. 1,302 projects.
- Every ESP32 job also as a web page on the phone (`EOUT.web`, `sketchWeb`, 134 lessons, Class 8–9): WiFi + WebServer,
  the sensor read five times a second in loop() without blocking, a page that refreshes itself every 2 s (meta
  refresh) with the reading and the job's message (red when on, green when off). An extra step opens the address on
  the phone; `isOn` looks at the page the phone last got. robofactory.mjs opens the page and refreshes it like the
  phone (7793 ok). Class 8 sessions: weather station → `f_heatwave_web_esp`, soil dashboard → `f_thirst_web_esp`.
  1,436 projects.
- The ESP32 reads an HC-SR04 too (`EIN.sonar`, 43 lessons: every distance job on its outputs and the web page): 5 V from
  VIN, Trig on GPIO 32, Echo through a ready-made 1 kΩ / 2.2 kΩ divider to GPIO 27. sim.js `pulse()` now also finds an
  Echo that reaches the pin through a divider (it reads the pin's voltage during and after the echo, as pi6.js does),
  so pulseIn() works on the 3.3 V boards. Class 8: tank level → `f_tankfull_web_esp`, dustbin full →
  `f_binfull_web_esp`. robofactory.mjs 8109 ok; robocore, robocore2, robocore4, robocore7 passed. 1,479 projects.
- Class 8 complete (`lessons16.js`, batch 16; tests `robocore16.mjs`, 26 of 26 sessions live):
  smart home with four switches (`smarthome4`, ESP32: Light / Fan / TV / Pump LEDs on GPIO 25 / 26 / 27 / 33, the
  student wires the four GPIOs; one handler `/switch?n=` flips one appliance with `server.arg("n")`, "All off", and every
  switch answers `303 → /` so a refresh never switches twice; the edit renames the Pump to Geyser in `names[]`),
  RFID attendance register (`attendance`, Uno: RC522 + I2C LCD, `ids[]` / `names[]` / `present[]`, an unknown card is
  shown with its number, the second tap says "Already marked"; scenes3.js `AttendScene` (kind `attend`) reads the LCD
  for its flags, worlds3.js draws the classroom door with a CLASS 8-A sign and no latch servo), Pong on an OLED with a
  knob (`pong`: `map()` of the knob to the paddle, Hit / Missed / GAME OVER on the Serial Monitor, the lesson's tick
  counts them; the edit narrows the paddle; mistakes: both knob ends on one rail, the wiper on A1) and gesture AI on the
  micro:bit (`mbgestureai`, `batch16mb`, page only: three gestures taught by example as [x, y, z, label], nearest
  neighbour by 3D distance, an untaught pose gets a wrong answer with a large distance, then `if d > 500: guess = "?"`;
  Run wipes the training, as RAM does). robocore3's own lessons are now `l.scene && !l.batch`. 1,483 projects.
- Class 9, first four (`lessons17.js`, batch 17; tests `robocore17.mjs`; 20 of 26 sessions live): a password lock on the
  Pico (`pico_keylock`: our own MicroPython keypad scan, rows GP6–GP9 driven HIGH one at a time, columns GP10–GP13
  pulled down; the servo latch by PWM at 50 Hz on GP15, 0.5–2.5 ms; stars instead of the password; three wrong tries
  lock it for 10 s; locker scene), a gas alarm on the Pico (`pico_gasalarm`: the MQ-2 on VBUS, its AO through a
  10 kΩ / 20 kΩ divider that the student places, GP26, a 20 s warm-up, ALARM 20000 / SAFE 12000 hysteresis; kitchen
  scene, whose panel now shows the MQ-2's volts on the Pico), a bank locker on the Uno (`banklocker`: RFID card AND PIN,
  keypad rows on A0–A3 because SPI takes 9–13; "Card first!", unknown card, 15 s to type, three wrong PINs = alarm;
  scenes3.js `BankScene` = the locker + card buttons) and a smart rooftop water tank (`smarttank`: scenes3.js
  `TankScene`, kind `tank`: 100 cm deep, the HC-SR04 8 cm above the brim so level % = 108 − cm, the pump's flow fills
  it from the sump, the taps drain it, an empty sump makes the pump run dry; the sketch starts at low = 30 %, stops at
  high = 90 %, and stops a dry pump when the level has not risen in 5 s; worlds3.js draws a clear tank on a brick stand,
  the sump, the pipe, the tap). 1,487 projects.
- The Class 7 cars on the Pico (`pico_linecar`, `pico_avoidcar`, batch 17): the L298N's IN1–IN4, ENA, ENB on GP16–GP21
  (setup wires go to the holes beside the Pico's pins, e.g. GP16 = `H:a21`), `wheel()` / `drive()` with PWM duty in %,
  the IR sensors on 3V3 (the check refuses VBUS), the HC-SR04's Echo through 1 kΩ (48g–52g) / 2.2 kΩ (48j) to GP13 and
  `time_pulse_us()`, the scan servo on GP15. robocore17.mjs drives the cars (CarSim) as worlds.js does; robocore2 now
  keeps to the Uno cars. Class 9: 22 of 26. 1,489 projects.
- Smart greenhouse (`greenhouse`, Uno, batch 17): scenes3.js `GreenhouseScene` extends the garden (same 3D): the sun
  heats the air towards 39 °C (night 24 °C), the fan (a DC motor through relay 2 and its own AA pack) takes 9 °C off,
  the DHT11 reads that air (lab.env), the LDR gets the sun as its own lux, led1 is the grow light; flags fanOn, cooled,
  growNight, held (the fan keeps the sunny house at ≤ 31 °C for 8 s). Note: a part's terminal takes one wire, so a
  second load needs its own pack (or a breadboard rail). Class 9: 23 of 26. 1,490 projects.
- The Pico gets I2C and SPI (pi6.js, batch 17): `machine.I2C(id, sda=, scl=)` checks the RP2040's pin table (I2C0 SDA
  0/4/8/12/16/20, SCL 1/5/9/13/17/21; I2C1 SDA 2/6/…/26, SCL 3/7/…/27), `SoftI2C` takes any two pins, `scan()` lists the
  powered modules wired to those GPIOs (the OLED at 0x3c, the LCD at 0x27); the `ssd1306` driver module
  (`SSD1306_I2C(128, 64, i2c)`: fill, pixel, text (the 5 × 7 font in 8-dot cells), hline, vline, line, rect, fill_rect,
  show (23 ms), invert, poweroff / on) writes the oled part as the Uno's library does; a module that does not answer is
  `OSError: [Errno 5] EIO`. The `mfrc522` driver (`MFRC522(spi_id=0, sck=2, miso=4, mosi=3, cs=1, rst=0)`: init,
  request(REQIDL / REQALL), SelectTagSN, anticoll, tohexstring) checks the SPI pins and reads the cards as the Uno's does
  (a card stays selected until it leaves). Lessons: `pico_weather` (DHT11 + OLED, Fahrenheit edit; SDA / SCL swapped
  stops with EIO) and `pico_rfidlock` (an ALLOWED list; the reader on VBUS is refused). Class 9: 25 of 26. 1,492 projects.
- The bank's OLED jobs on the Pico too (`POUT.oled`, factory.js): the OLED on I2C0 (SDA GP4, SCL GP5, VCC 3V3) with the
  ssd1306 driver; the job's name in up to two 16-letter lines, a rule, then its message. sketchPy now takes an output's
  own imports and lines made from the job (`py.on(job)`). 51 lessons (every LCD job with a Pico sensor); robofactory.mjs
  8466 ok. (No I2C LCD on the Pico: its backpack wants 5 V and pulls SDA / SCL up to 5 V, the wrong habit for a
  3.3 V board; the OLED is the Pico's screen.) 1,543 projects.
- Maze-solving robot (`mazecar`, Uno, batch 18, lessons18.js): robots.js `MAZE` = 4 × 3 rooms of 450 mm, plywood walls
  18 mm × 150 mm, given as the ways between rooms (every other side is a wall; `mazeWalls()` joins them into straight
  runs for CarSim's boxes). Maze A: all walls join the outside wall, FINISH (a black 300 mm square) in room (3, 0); maze
  B: FINISH inside a C of walls that touches nothing (an island). The car has an HC-SR04 at the nose (us1, pins 9 / 10,
  prewired), one on its left edge looking left (us2, pins 11 / 12, the student wires it: `CarSim.usFrom(lx, lz, dir)`),
  and an IR under the nose on pin 3 (irM) for FINISH. The sketch: a way on the left (> 30 cm) → curve left; else ahead
  clear (> 10 cm) → go on, steering the left wall to 15 cm; else spin right for 300 ms. Speed 130: START → dead end
  (2, 0) → FINISH in 22 s, no bump; 255: the timed turn overshoots and it bumps; 150: clean again; maze B: it goes
  round and back to START (flag `loop`). The panel swaps the maze (the arena is built again). robocore18.mjs plays it.
  Class 9: 26 of 26. 1,544 projects.
- The Class 10 robots on the Raspberry Pi 4 (batch 19, lessons19.js, gpiozero): the car's world takes `board: 'pi'`
  (models2.js `buildCar(kind, parts, opt)` puts the Pi on the plate; `fixed: true` = the avoid car's HC-SR04 fixed on a
  bracket, no servo). `pi_linecar`: two LineSensor eyes on GPIO 17 / 27 (3.3 V: the check refuses 5 V and swapped eyes),
  Robot.value = (left, right); sleep(0.3) between looks runs off the tape (flag lost), sleep(0.02) laps clean.
  `pi_avoidcar`: DistanceSensor (Trig 23, Echo through 1 kΩ / 2.2 kΩ to 24), random.choice of the side; safe = 30
  (cm for m) only backs and turns (flags back, no fwd). `pi_wallcar`: CAR_CFG.mazeR = maze A with the side HC-SR04 on the
  right (`CarSim.mazeSide()`, us2: Trig 16, Echo 26 through its own divider), a P controller (steer = kp × (right −
  15)); kp 0.03 / 0.04 reach FINISH by the right-hand wall (no dead end); kp 0.5 oscillates: CarSim flag `wobble` = 25
  hard left / right swings in a row, each within 0.7 s. robocore19.mjs plays them. Class 10: 17 of 26. 1,547 projects.
- Data on the Raspberry Pi 4 (batch 20, lessons20.js + pi20.js). py.js now has `with` (a context manager: R.enter /
  R.exit, the exit in a finally) and decorators (name = deco(function)), and next() on a csv reader or a file. pi20.js
  gives the Pi: open() on its SD card (lab.fs6, name → text; it lasts across Runs; a lesson's `files` are put there by
  LessonRT.open), file objects (read / readline / readlines / write (str only) / writelines / iteration / close, modes
  r / w / a / x, FileNotFoundError, closed file, wrong mode), os (getcwd, listdir, remove, path.exists / getsize), csv
  (writer: "\r\n" rows, quoting; reader), statistics (mean, median, stdev, correlation, linear_regression) and
  matplotlib.pyplot (figure, plot with a format string, scatter, bar, title, labels, grid, legend, lims, savefig, show,
  close; text values become categories in the order they come). `drawFigure()` paints a figure; app6.js shows the card's
  files as buttons under the terminal (#fs20) and a window (#win20) for a file or the figure (plt.show() opens it); the
  Pi's little screen shows the figure over the terminal. The Pi's clock goes on between runs (lab.epoch6). Lessons:
  `pi_csvlog` (a DHT11 row every 2 s, "a" grows the file, "w" wipes it and loses the header), `pi_plot` (72 hours of
  sample data; without float() the y axis is jumbled text; then humidity as a second line), `pi_predict` (a straight line
  through 14 daily maxima: day 15 ≈ 31 °C, 90 days ahead over 70 °C: extrapolation). robocore20.mjs plays them and checks the
  engine. Class 10: 20 of 26. 1,550 projects.
- The Pi on the network and with RFID (batch 21, lessons21.js). Flask (pi20.js): Flask(__name__), @app.route (with
  <name> / <int:n> parts), app.run(host, port) serves the phone (esp32.js Net: on a Pi 4 the phone's request goes to
  the Pi's address and port; only host="0.0.0.0" listens on the WiFi, else "refused"; the phone keeps :5000 in links and
  redirects; Pi-worded refused / timeout messages), Flask's banner and request log lines, 404 / 500, redirect(),
  request.args. SimpleMFRC522 (pi20.js): the RC522 on SPI0 (SDA GPIO 8, SCK 11, MOSI 10, MISO 9, RST 25), read() waits
  for a tap and gives (number, text), the number = the 4 UID bytes and their check byte (white card 701406916061, blue tag
  391623328800); no reader on those pins: read() waits and a hint names them. Lessons: `pi_flask` (the lamp from the
  phone; app.run(port=5000) → refused), `pi_rfidsheet` (attendance.csv, an unknown tag added to the dictionary, "already
  marked"), `pi_tripwire` (an LDR + 10 kΩ into GPIO 17, the pin's threshold as the comparator, when_deactivated; without
  pause() the program ends and the door is unguarded). Note: a resistor plugged into a rail needs a column with a rail
  hole (not 8, 14, 20, 26, 32, 38, 44, 50, 56). robocore21.mjs plays them. Class 10: 23 of 26. 1,553 projects.
- Small digital sensor modules (batch 22: parts22.js, models22.js, app22.js, lessons22.js). Eight school-kit boards with
  VCC / GND / OUT (DO, LOW while it senses, the second LED lit): flame (IR photodiode, a candle), sound (a clap: a 0.25 s
  pulse), reed (glass switch, a bar magnet), hall (A3144, a magnet), tilt (SW-520D ball switch), vibe (SW-420, a knock:
  a 0.35 s pulse), rain (a separate comb plate, drops on it), blink (IR pair on a spectacle frame: 😉 Blink is a 0.15 s
  pulse, 😑 Close the eyes holds). No power (under 3 V on VCC) → OUT reads nothing. The callout button does the sensing
  (sense22 / blink22). The board print reads upright for a module placed turned round (rot 2, pins to the board). The
  factory (factory.js DIG22) takes seven of them as inputs on the Uno (pin 7, 5 V), ESP32 (GPIO 27, 3.3 V), Pico (GP14,
  3V3) and Pi 4 (GPIO 27, DigitalInputDevice), with 14 new jobs (kitchen fire alarm, diya left burning, clap switch,
  library noise, tank-full float switch, gate closed, magnet-key box, cycle wheel turn, bike anti-theft, cooler tip-over
  cut-off, knock bell, classroom earthquake alarm, rain alert for clothes, window that closes in rain): 145 projects.
  Hand-made `drowsy` (Class 10, Uno): the eye sensor and a buzzer; sleepy = 0 beeps at every blink (a false alarm nobody
  keeps), sleepy = 2000 keeps blinks quiet and wakes the driver after 2 s; opening the eyes stops it. robocore22.mjs
  checks every module and plays it. Class 10: 24 of 26. 1,699 projects (231 hand-made + 1,468 bank).
  `smartfarm` (Class 10, ESP32 + phone): soil AO on GPIO 34, the rain module on GPIO 27 (both on 3.3 V; VIN is named
  by the check), the pump's relay on GPIO 33. Auto mode waters above dry = 3700 and stops below wet = 2300 (the ESP32's
  ADC reads a 0.35 field as about 3520); the lesson's tick is the field (the pump about 8 %/s, the rain 5 %/s), judged by
  the relay, not the water still running out after a Run. The first program pumps in the rain; the edit
  if (s > dry && !raining()) lets the rain water it; the phone's Pump on (manual) and Auto. robo4.go(path) opens a page
  of the board on the phone (screenshots). Class 10: 25 of 26. 1,700 projects.
  The cup anemometer (parts22.js `anemo`, models22.js): two leads A / B and a reed switch between them, closed half of
  each turn; 1 turn a second = 2.4 km/h (ANEMO_K), up to 50 km/h (about 21 turns a second, which the 60 Hz bench still
  samples without losing edges); a Wind km/h slider in its callout (wind22). Inputs change once a frame (the MCU runs
  the frame, then the circuit is solved), so a sketch counts edges by polling. `kisanws` (Class 10, ESP32 + phone):
  DHT11 on GPIO 27, rain on GPIO 26, the anemometer on GPIO 25 with INPUT_PULLUP; a page with temperature, humidity,
  rain, wind and the spraying advice (raining() || kmh > 15: "Do not spray"). The first program counts the level (every
  loop() pass while the switch is closed: thousands of km/h); the edit counts the HIGH-to-LOW edge. cpp.js: on the
  ESP32 an int (and unsigned int) is 32 bits, as on the real chip (the Uno's stays 16). Class 10: 26 of 26. 1,701 projects.
- Class 1 power without a battery (batch 22, circuits.js + parts22.js): `solar` (a 6 V panel: open-circuit 6.4 V and
  about 170 mA short-circuit in full sun, a Thevenin model; its own Sunlight % slider and "Cover it": covered = 0 V) and
  `lemon` (zinc nail −, copper coin +: 0.95 V with 600 Ω inside, so 1–3 lemons leave a red LED dark and 4 light it
  faintly, about 0.85 mA). Lessons `c_solar` (sun, a cloud at 20 %, night, morning) and `c_lemon` (one lemon is dark; the
  wire off; four in a row; a lemon turned round is named by the check). robocircuits.mjs plays them. Classes 1–10 are
  complete: 248 of 300 sessions. 1,703 projects.
- Factory batch 22b (factory.js): 35 more jobs, four for each module (stove left burning, godown sprinkler, forest
  watchtower, fire exit; baby cry, clap fan, noisy class, clap puppet; windows shut, model railway signal, helmet-buckle
  bike, lift floor; bike neutral light, laptop lid, trolley home, slider end stop; walking-stick fall, tipper body up,
  leaning pole, donation box; ATM tamper, machine vibration, footbridge, train coming; auto wiper, mandi grain, floor
  leak, umbrella sign) and seven for the DHT11 (bus-shelter mist, ice-cream cart, cattle shed, exam hall; tea drying,
  medicine store, library dehumidifier): 353 projects. 2,062 projects (235 hand-made + 1,827 bank).
- Class 11 robot arm (batch 23, lessons23.js; the arm of batch 2, ArmSim level 4). `armcopy`: four knobs on the
  breadboard (legs 2 columns apart: c, c + 2, c + 4; their ends on the top rails, which are numbered 1–50 along the rail,
  not by column) are the master; map() each wiper to a joint. The master's shoulder knob is the other way round
  (map(…, 180, 0): knob up, arm down); after the edit the knobs carry the block from A to B. `armrecord`: the same
  knobs pre-wired, RECORD (pin 2) and PLAY (pin 4) buttons; poses in four arrays of MAXP; glide() moves all joints
  together in 40 steps; MAXP = 3 says "Memory full!" (the job needs 7); MAXP = 10; PLAY repeats the job from memory
  with the knobs anywhere. `armbt` (ESP32 + phone): BluetoothSerial "DUET-Arm", ESP32Servo on GPIO 13, 14, 27, 26
  (GPIO 12 is named by the check: a strapping pin), the ESP32's GND on the adapter's − rail; commands like B140; one
  SerialBT.read() takes only "1" (base to 1°, the arm into the desk), SerialBT.parseInt() reads 140; a pick-and-place
  by commands. `delivery` (Uno car): robots.js CAR_CFG.deliv, the line track with three stations beside it on the
  car's left (the side IR at markX/markZ sees them; stationAt(), flags stopN after 1.5 s standing on one, passN when
  left behind without a stop; the arena draws STATION 1–3; the panel shows ■ / →). worlds.js now feeds the car's sensors
  at Run for this track too (or the side IR reads its default HIGH in the first loop: a phantom station 1). deliverTo = 0
  stops at every station; deliverTo = 2 only at 2. A side sensor on the wrong pin leaves pin 9 floating: phantom
  stations, and it never leaves START. robocore23.mjs plays all four. Class 11: 4 of 26. 2,066 projects.
- The bank's web-page output on the Raspberry Pi 4 too (factory.js `QWEB`, `sketchPiWeb`): gpiozero for the sensor and
  Flask for the page (`@app.route("/")`, `app.run(host="0.0.0.0", port=5000)`, a page that refreshes every 2 s). The Pi
  is not an Arduino loop: the warning is kept by the sensor's own callbacks (`when_pressed`/`when_released`,
  `when_motion`/`when_no_motion`, else `when_activated`/`when_deactivated`), both stamping `last = time.monotonic()`, so
  a short press still shows for `hold = 1.0` s after it ends. The steps say "open the address with :5000". Every digital
  job with a Pi input (`batchF`, `f_<job>_web_pi`): 94 projects. robofactory.mjs asks `:5000` on the Pi: 12,753 ok.
  2,160 projects (239 hand-made + 1,921 bank).
- The Pi 4's I2C screens (batch 24, pi24.js; pi6.js gives the Pi's Python these modules). `RPLCD`: `from RPLCD.i2c import
  CharLCD; lcd = CharLCD('PCF8574', 0x27, cols=16, rows=2)`, write_string ("\r" to the start of the row, "\n" down a row,
  a long line breaks at cols), clear, home, cursor_pos = (row, col) (a ValueError past the edge, so (col, row) the wrong
  way round is named), backlight_enabled, display_enabled, cursor_mode, shift_display, create_char, close. Like the real
  library it starts as a 20 × 4 LCD: without cols=16, rows=2 letters 17–20 land off the glass. `luma.oled`:
  `serial = i2c(port=1, address=0x3C); oled = ssd1306(serial); with canvas(oled) as draw:` draw.text (with
  `ImageFont.truetype("DejaVuSans.ttf", 20)`: the size picks how big the 5 × 7 letters are; a font the Pi does not have,
  such as arial.ttf, is Pillow's OSError), rectangle, line, point, ellipse, bounding_box; the picture goes to the OLED when
  the with block ends. The bus is GPIO 2 (SDA, pin 3) / GPIO 3 (SCL, pin 5); a module that is not powered, swapped, or
  at another address (a 0x3F backpack) gives OSError [Errno 121] Remote I/O error as smbus does; port=0 has no
  /dev/i2c-0. The 5 V LCD backpack's 4.7 kΩ pull-ups against the Pi's 1.8 kΩ hold SDA/SCL at about 3.8 V.
  Factory (factory.js `QOUT.lcd`, `QOUT.oled`; `sketchPi` takes job-made lines, `head`, `init` and the reading on row 0):
  every LCD job with a Pi input on both screens: 108 projects. robocore24.mjs plays the libraries and the mistakes.
- The Pico's 16×2 LCD (pi24.js `picoLcdMods`: the pico_i2c_lcd.py + lcd_api.py files every Pico LCD tutorial copies to the
  board): `I2cLcd(i2c, 0x27, 2, 16)`, putstr, putchar, move_to(col, row) — column first, and with no check, so move_to(1, 0)
  meant as "line 1" writes on line 0 at column 1, as the real file does —, clear, home, backlight_on/off, display_on/off,
  cursors, custom_char. A full line wraps (the last back to the first) and, as in lcd_api.py, a "\n" after a wrap is
  swallowed. Nothing at the address on that bus: OSError [Errno 5] EIO (pi6.js's I2C object). Factory `POUT.lcd`: VCC from
  VBUS (the back + rail), SDA GP4, SCL GP5; `sketchPy` takes `init` and `value` lines as `sketchPi` does: 76 projects.
- The MCP3008 (batch 24, parts24.js + models24.js): the 8-channel 10-bit SPI ADC in a DIP-16 across the gap (pin 1 = CH0
  at row f, pins 16–9 on row e, the notch and the print on top). gpiozero's `MCP3008(channel=0)` (pi24.js `adcClasses`,
  merged into pi6.js's gpiozero): raw_value 0–1023, value, voltage, close; each reading is (CH − AGND) / (VREF − AGND)
  × 1024 ± 1 count, from `lab.readNode()` (sim.js: the instant solve of any node, NaN when nothing anchors it; readPin
  uses it). As on a real Pi: CLK / DOUT / DIN / CS off GPIO 11 / 9 / 10 / 8 (or CE1 = GPIO 7 with device=1) or no VDD read
  0; VREF loose reads 1023; an input joined to nothing wanders (a hint); VDD from 5 V is warned about (DOUT would put 5 V
  on GPIO 9), and so is an input above VDD + 0.6 V; channel 8 is SPIBadChannel. Factory (factory.js `ADC_PRE`): the chip
  pre-wired at columns 5–12 (VDD and VREF to 3.3 V pin 17, AGND/DGND to −, SPI0 to GPIO 8–11); the student wires the knob,
  LDR (both kinds), LM35 (hot and cold) or soil sensor on 3.3 V (the LM35 on 5 V: it needs 4 V, its output stays small),
  and its output to `adc.CH0`; `raw_value` gives the Arduino's own numbers, `round(adc.voltage * 100)` the LM35's °C.
  Every such job on the Pi: 156 projects. robocore24.mjs plays the chip's mistakes; robofactory.mjs 15,133 ok.
- The ESP32's warning on the phone over Bluetooth (factory.js `EOUT.bt`): BluetoothSerial "DUET-ESP32" and the phone's BT
  Terminal app (phone4.js). `say(state, msg)` tells the phone when the state changes and again every 5 s, because what
  the ESP32 sends while no phone is connected is lost (esp32.js `btFromEsp`), as on a real one. The lesson adds two acts:
  connect in BT Terminal after Run, and again after the edit's Run (a restart drops the link). `isOn` is the last line the
  phone got since it connected. Every ESP32 job: 198 projects. robofactory.mjs connects the phone at those two acts:
  16,915 ok. 2,698 projects (239 hand-made + 2,459 bank).
- The Arduino's warning on the phone through an HC-05 (factory.js `OUT.bt`; esp32.js `Net`): the phone's BT Terminal now
  lists an HC-05 that has power (`hc05()`, `btDevices`), pairs it (`state.paired`, its LED blinks slowly) and keeps the link
  while the Uno restarts (only power loss drops it). mcu.js `SerialPort.flushTo` hands every byte of the main Serial to
  `Net.btFromUno`: the phone hears it when the HC-05's RXD reaches TX (pin 1) straight or through a resistor (the divider),
  at 9600 baud; at another speed it shows rubbish as it comes. The output: the HC-05 at 10j–15j, 1 kΩ 16f–20f and 2.2 kΩ
  16h–12h (RXD ≈ 3.4 V), pin 1 to column 20, TXD free so pin 0 stays free for uploading; `say()` on Serial (the readings
  share the line, so `isOn` is the last warning line the phone got). One connect act (no reconnect after the edit's Run).
  Every Uno job: 209 projects. robocore24.mjs: the phone sees it, 9600 works, 115200 is rubbish, no wire is silence.
- micro:bit radio (factorymb.js `MOUT.radio`, mbworld5.js scene `rpsknob`): every bank job also warns a friend's micro:bit
  by radio. The same program goes into both boards (two tasks on one MBCore): each sends "on" / "off" when its state
  changes and again each second (a message sent before the other board is listening is lost, as on real ones: the
  first version, sending only on change, lost the first "on" when the button was held from the start), and shows what
  the other says (`friendShown` is the check). Scene `rps` (two boards on batteries, labelled) or `rpsknob` (a knob on
  yours). The blocks round trip holds. 87 projects; robofactorymb.mjs 528 ok.
- The Pi's gas sensor (factory.js `QIN.gas`): the MQ-2's heater needs 5 V and its AO can reach about 4 V, so a 10 kΩ /
  20 kΩ divider (14g–18g, 18h–22h, its middle pre-wired to CH0) brings it under 3.3 V; AO straight to CH0 is named by the
  check (`XF.gasDiv`). × 2/3 against 3.3 V reads as an Uno against 5 V, so the limits (400, 250) stay. 25 projects.
  3,019 projects (239 hand-made + 2,780 bank).
- Class 11 water ATM (batch 24, lessons24.js `wateratm`; scenes3.js `AtmScene`, worlds3.js `atmSteps`): an RO kiosk
  (blue cabinet, sign, steel tap, drip tray, a glass that fills, the stream, a spill when over 300 mL; the card and tag
  step is now `cardsStep()`, shared with the door). A card shown puts a fresh glass under the tap; the scene measures
  what the pump really pours (its flow, mL/s): short < 225, full 225–275, over > 275. The LCD gives ready / low /
  unknown / "Bal: Rs n". The reader, LCD and pump with its 6 V battery through the relay's COM/NO are pre-wired; the
  student wires the relay (S pin 4, VCC, GND). pourMs = 4000 pours about 134 mL (33 mL/s): calibrate to 7600 (the edit
  accepts 7000–8200) for 255 mL; the blue tag (Rs 3) buys one glass and is refused the next with nothing poured.
  robocore24.mjs plays it, and the relay on pin 5 is named by the check. Class 11: 5 of 26.
- Class 11 vending machine (batch 24, lessons24.js `vending`; scenes3.js `VendScene`, worlds3.js `vendSteps`): a round
  tray of six compartments (chips, biscuits, juice, chocolate, peanuts, water; walls and numbers) on the 28BYJ-48's
  shaft, under a smoked cover with one door at the front and a SNACKS sign; compartment k is at the door at (k − 1) × 60°
  (the tray is drawn from the angle since Run: Run starts with compartment 1 at the door, as an operator homes it). The
  keypad (pins 2–9) and LCD are pre-wired; the student places the driver and wires IN1–IN4 to 10–13. The scene measures
  each move start to stop (`res.moves`) and what stopped at the door (within 6°, else jam). stepsPerSlot = 300 stops the
  juice at 105.6° (jam); 2048 ÷ 6 → 341 serves it at 119.9°; from 6 to 1 the tray goes −300° (longway); the short-way
  lines (moveSlots > 3 → −6, < −3 → +6) make it +60° (shortway). Keys pressed during the 2 s "Take your…" delay are
  missed, as on the real keypad. robocore24.mjs plays it. Class 11: 6 of 26.
- Class 11 dual-axis solar tracker (batch 24, lessons24.js `tracker`; parts24.js `ldr4`, models24.js `buildLdr4`;
  scenes3.js `TrackerScene`, worlds3.js `trackerSteps`): the 4-LDR sun sensor is a free part (a plug on the mat with
  VCC, GND, TL, TR, BL, BR; each LDR with its 10 kΩ, so 4 dividers; `state.ext` + `state.lux[4]` from the scene, else
  the room's light). The scene's sun goes from az +60° (9:00 at frac 0.25 starts at az 30°, 54° up) to −60°, 70° high at
  noon, a day in SUN.day = 60 s when "Play" is on. The panel's az = pan − 90, elevation = tilt − 90 (svP pin 9, svT pin
  10, mount 'pt'). Each quadrant's light: 25 + 1000 × share × 4 × cos(error) × (1 ± 2 % flicker); share from
  clamp(0.5 ± d / 24) per axis (the cross's shade), so one degree is about 6 counts. The first program turns the pan the
  wrong way (runaway to pan 1°); then with tol = 0 it hunts (hundreds of reversals in 10 s); tol = 25 (± 4°) is calm;
  the day played keeps within about 5° and makes about 27 % more energy than a fixed panel (az 0, 30° up) from 9:00.
  The 3D: the laser lesson's pan-tilt head with a 96 × 60 mm panel and the sensor on its top edge, the fixed panel
  beside it, a glowing sun; the whole sky is drawn turned half round about the stand so the sun crosses in front and the
  cells face the student. robocore24.mjs plays it. Class 11: 7 of 26.
- Class 11 mini lift (batch 24, lessons24.js `lift`; scenes3.js `LiftScene`, worlds3.js `liftSteps`): a three-floor
  shaft (LIFT.floor = 60 mm apart, drawn at 1.15 units a mm beside the bench, view scene3pt) with landing slabs, signs,
  the yellow car with a passenger on its cable from the pulley at the top, and the limit switch's red lever at the
  bottom. The car's height = 25 mm (the power cut, LIFT.h0) + the stepper's turn × π × 20 mm (persistent across Runs, as
  the real car is). The limit switch is a button (lim) on the breadboard that the scene presses when the car is down
  (h ≤ 0.5 mm); below −3 mm the car is on the buffer (crash). Call buttons c0–c2 (pins 2–4) are pressed for 0.3 s from the
  panel. The first program believes it starts at G: floor 1 stops at 85 mm (between). The student places the switch at
  40e (pin 5, GND) and adds homing in setup() (down 8 steps at a time while pin 5 is HIGH, then floorNow = 0): it stops
  at 0.3 mm, then 2 at 120.4 and 1 at 60.4. robocore24.mjs plays it. Class 11: 8 of 26.
- Class 11 conveyor belt (batch 24, lessons24.js `conveyor`; scenes3.js `ConveyorScene`, worlds3.js `convSteps`, view
  scene3cv): a rubber belt (its chevron texture runs) on two 30 mm rollers 240 mm apart in an aluminium frame, the
  28BYJ-48 drawn on the drive roller's near end (the `stepper` part with props.mount shows only its ULN2003 board and the
  5-wire cable; models3.js), the IR sensor on the near rail looking across the belt (the `ir` part with props.mount is a
  3-pin plug on the mat; models2.js, and view.js skips its obstacle block), the stamp on a bridge (the SG90, `servo` with
  mount: up at 0°, on the belt at 90°), cardboard boxes 30 mm long and 70 mm apart that drop on at the infeed end, the
  blue crate at the end. The belt moves π × 30 mm a turn (2.9 mm for 64 steps); the IR (CONV.ir 170 mm) sees a box while
  any part of it is in front; the stamp (CONV.stamp 155 mm) is half a box before it, so a box that has just reached the
  sensor is centred under it, and a box under it stops the servo at 36° (state.limit). The first program asks 25 rpm:
  a step every 1.2 ms, faster than the rotor follows (parts3.js STEP28.minUs 1.7 ms), so every step is missed: the
  motor hums (it shakes in 3D) and the belt stays still (stall). At 12 rpm the box is stamped 5 times and the bare belt
  5 more, counted 10 (the sensor stays LOW for 30 mm while each loop moves 2.9 mm). The fix waits while pin 2 is LOW:
  one stamp per box, within 3 mm of its middle, about 13 boxes a minute. robocore24.mjs plays it. Class 11: 9 of 26.
- Class 11 robot arm draws a square (batch 24, lessons24.js `armsquare`; robots.js `ArmSim` level 6 and `DRAW`,
  worlds.js `ArmWorld.paper/inkDraw`): the 4-servo arm of batch 2 holds a felt pen in the claw (ARMG.pen: its tip 80 mm
  past the wrist, along the forearm; armFK returns `pen`); the claw closes on it (state.limit for a 10 mm pen). A sheet
  (170 × 130 mm, ruled, the 80 mm target square pencilled 130–210 mm in front of the base) lies on the desk; the ink is
  a transparent canvas over 440 × 320 mm of desk, so ink off the paper shows. The pen writes while its tip is within
  1.5 mm of the paper (points between frames are filled in); 8 mm into the desk flags dig. When the pen has stayed up
  1.2 s the drawing is judged: ink off the paper (offPaper), the worst distance from the square's sides and the share of
  the sides with ink within 3 mm (crooked: worse than 4 mm or under 90 %; square: within 3 mm and at least 95 %). The
  sketch's penAt(x, y, z) is inverse kinematics (atan2, Pythagoras, the cosine rule with acos; cpp.js now has acos,
  asin, atan, degrees, radians; Servo.write(NaN) is 0). First the base gets radians (1.87 → 2°): ink on the desk at
  x ≈ 175 mm. With degrees(), corner-to-corner jumps (a joint move) draw 12 mm off the line with 38 % covered; lineTo()
  (40 steps through penAt: a linear move) draws within 1.8 mm, 96 % (gaps where whole degrees lift the tip). The lesson's
  live text reads robots.js ARMCUR. robocore24.mjs plays it. Class 11: 10 of 26.
- Class 11 camera slider (batch 24, lessons24.js `slider`; scenes3.js `SliderScene` and `SLIDE`, worlds3.js
  `slideSteps`, view scene3cv): a 2020 rail on two stands with a GT2 belt, the 28BYJ-48 and its 20-tooth pulley on the
  left end plate (the `stepper` part with mount: only the board on the mat), a carriage with a ball head and a small
  camera filming a row of model houses behind the rail. The carriage moves 40 mm a turn (20 teeth × 2 mm; 51.2 steps a
  mm). When it stops it rocks (0.6 mm at 9 Hz, dying away with τ = 0.15 s; drawn three times bigger). The camera clicks
  when the shutter LED (led1 on pin 7, standing for the optocoupler on the remote socket; the student places it and wires
  pin 7) lights: the photo is sharp if the camera moved under 0.1 mm in its 1/30 s (a carriage still moving, or just
  stopped, counts its full rocking). 12 photos 15 mm apart: with 2048 ÷ (π × 20) steps a mm they end at 114 mm (short);
  with 2048 ÷ 40.0 at 180 mm, but none is sharp (the shutter clicks as the carriage stops); delay(500) after the move
  makes all 12 sharp. robocore24.mjs plays it. Class 11: 11 of 26.
- Class 11 PID line follower (batch 24, lessons24.js `pidline`; robots.js `CAR_CFG.pid`, `CAR24`, `sensors5`; parts24.js
  `ir5`, models24.js `buildIr5`, models2.js buildCar kind 'pid'; worlds.js CarWorld): the line car with a bar of five
  TCRT5000 sensors 12 mm apart under its nose (S1 on the left; HIGH over the 19 mm tape, each with a red LED lit over
  white). The `ir5` part on the mat is its 7-pin plug board (VCC, GND, S1–S5; the student wires them to the rails and
  A0–A4); robots.js carFeed writes state.black. The 'pid' car's body lags its wheels (cfg.inertia: 0.25 s for speed,
  0.12 s for turning; only this car), so a P controller can overshoot as a real one does. The sim measures each lap's
  average distance from the line and the steering's swings a second (L.off, L.swings); zigzag = 3 or more swings a
  second for 3 s; fullLap = the second lap (the first starts part-way round); smooth = a full lap under 7 s with under
  3 swings a second and under 16 mm off. The sketch: error −2 … +2 from the sensors over the line (±2.5 when lost),
  turn = Kp·error + Kd·Δerror. Kp 90 at speed 150 zig-zags (3.3 swings a second); Kp 25: 8.3 s a lap, 1.1 swings;
  speed 210 with Kp 25 runs off a bend (lost); Kp 50 with Kd 150: 6.4 s a lap, 2.3 swings. The live texts read
  robots.js CARCUR. robocore24.mjs plays it. Class 11: 12 of 26.
- Class 11 pen plotter (batch 24, lessons24.js `plotter`; scenes3.js `PlotScene` and `PLOT`, worlds3.js `plotSteps`,
  view scene3cv): a white base with the paper (120 × 90 mm, a house pencilled on it), two steel rods for the Y gantry,
  the gantry with the X carriage, an SG90 and a felt pen; 28BYJ-48s at the back-left corner (Y) and on the gantry's left
  end (X), both on GT2 belts (51.2 steps a mm). The two steppers draw about half an amp, so they run from their own 5 V
  adapter (psu5) on the front rails, its − joined to GND1; the servo is on the Arduino's 5 V (back rails): with both
  motors on the Arduino's 5 V the supply sags and steps are lost silently. The pen writes while the servo is at 30° or
  less. The drawing is judged when the pen has stayed up for 1 s: the roof's worst distance from its slopes (stairs >
  6 mm), ink belonging to no line (drag > 15 mm), and house (roof within 2 mm, 95 % covered, under 5 mm stray). The
  sketch's lineTo() moves all of X then all of Y: the roof comes out as steps (14 mm off). stepBoth() (in the sketch:
  interleaved slices, as a CNC interpolates) makes it straight, but the pen then drags a 28 mm line to the door;
  penUp()/penDown() round that move draws a clean house. robocore24.mjs plays it. Class 11: 13 of 26.
  (Found with the plotter: sim.js gave every part a shallow copy of its state0, so two steppers shared one coil array
  and stepped each other's patterns; parts now get a deep copy, copyState().)
- Class 11 pick-and-place line (batch 24, lessons24.js `pickplace`; scenes3.js `PickScene` and `PICK`, worlds3.js
  `pickSteps` = convSteps({ pick: true }) + the arm, view scene3cv): the stamp lesson's conveyor without its stamp, a
  yellow stop plate across the belt's end (boxes stop there and queue; the belt slides under them), the IR sensor 4 mm
  before it, the blue crate beside the line, a post with a two-servo arm (the swing SG90 turns it from the belt, −z of
  the post, round to the crate, −x; the lift SG90 lowers the suction cup on its rod), the vacuum pump and its tube (the
  `pump` part with mount 'vac' behind relay rl1 on pin 4, on the AA battery). The cup holds while the pump runs and
  lets go 0.1 s after it stops; a box under the cup stops the lift at 40° (state.limit): asked for less, the servo
  strains and dents the box (press). Let go within 10° of 90° → in the crate (placed); over the belt → back on it;
  anywhere else → on the floor (dropped). The student wires the lift servo (pin 5). The first program lowers to 0°
  (press, a dent); lift.write(40) is gentle, but the pump stops as the swing starts (dropped, still counted as packed);
  delay(600) after swing.write(90) packs three (placed3). robocore24.mjs plays it. Class 11: 14 of 26.
- Class 11 sumo robot (batch 24, lessons24.js `sumo`; robots.js CAR_CFG.sumo, CarSim.sumo/ringEdge/usFoe; models2.js
  buildCar kind 'sumo', buildSumoFoe, buildArena opts.ring; worlds.js CarWorld; view arenasumo): a black ring 1540 mm
  across with a 50 mm white edge and two brown start lines; our car (the table robot's corner IR sensors, LOW over
  white, on pins 11 and 12, and a fixed HC-SR04 at the front, which the student places at j50 and wires to pins 9 and
  10) faces a 1 kg red practice dummy (200 mm, it does not drive). Pushing: the overlap is shared 60 % dummy, 40 % car,
  and the car loses speed. The 5-second rule: from 0.4 s (wheels coasting from the last bout do not count; Run now
  stops the wheels) to 5 s the car must not move (early). out = our car's middle past the edge (the bout ends, the car
  stops); foeOut; win = the dummy out and our car still in a second later. The first program charges at once (early);
  with delay(5000) it pushes the dummy out and follows it (the edge is read only when nothing is ahead: out); with the
  edge test first it backs off at the line (win). robocore24.mjs plays it. Class 11: 15 of 26.
- Class 11 wall-following robot (batch 24, lessons24.js `wallp`; robots.js CAR_CFG.wallp, CarSim.wallCheck; models2.js
  buildCar kind 'wallp', buildAlmirah; worlds.js CarWorld; view arenawall): a room 3 m × 2 m with a steel almirah
  (900 × 600 × 1800 mm, a box with kind 'almirah') in the far right corner; the car starts 15 cm from the near wall, the
  wall on its right. The front HC-SR04 (j50, pins 9/10) is ready; the student places the right one at j40 (pins 11/12),
  which sits at the car's right front corner, 100 mm ahead of the axle (cfg.sideZ). cfg.glance = 40: a ray that meets a
  wall more than 40° from square sends no echo (400), as a smooth wall does to a real HC-SR04 (usFrom; other cars are
  unchanged). Flags: zigzag (a 3 s window of driving on, no turn on the spot, with ≥ 1.5 steering swings a second; the
  swing rate is shown), whip (a right turn of more than 110° within 0.6 s), spin, stuck (4 s within 15 cm with the
  wheels driving), lapW (+330° of turning and back within 30 cm of the start; lapT, lapBumps). Bang-bang (±70)
  zig-zags at about 3 swings a second; P (Kp 8) is calm on the walls, but at the almirah's end the side reads 70 cm or
  400: error 55+, both wheels flat out opposite ways, it whips round about 125° (nose into the almirah, then stuck);
  constrain(right, 0, 25) keeps the turn under 80 and it laps in about 27 s with no bumps (hardest right turn about
  70°). Tuned over 20+ runs each (the HC-SR04 noise makes each run differ). robocore24.mjs plays it. Class 11: 16 of 26.
- Class 11 WiFi robot car with a web joystick (batch 24, lessons24.js `wificar`; robots.js CAR_CFG.wifi, wifiCheck;
  esp32.js Net.join/switchBack; phone4.js hold buttons and the no-internet banner; app4.js press-and-hold on the phone;
  models6.js CAR_BOARD.esp32 (espLite); worlds.js CarWorld; view arenabt): the Bluetooth car's yard, with an ESP32 in the
  breadboard (motor A pre-wired: ENA a8 = GPIO 14, IN1 a9 = 27, IN2 a10 = 26; the student wires ENB 32, IN3 25, IN4 33 and
  the common GND). pi6.js now gives the L298N a 2.9 V logic swing for the ESP32 too (env.vlogic), so 3.3 V is full speed.
  The sketch: WiFi.softAP("DUET-Car", "robocar123"), a page of buttons with ontouchstart="fetch('/go?d=F')" and
  ontouchend="fetch('/go?d=S')", handleGo() reads server.arg("d"). The phone's browser now runs press-and-hold
  (ontouchstart / onmousedown / onpointerdown, and the end ones): Phone.down/up/hold; a plain tap is a 0.4 s press; a held
  button looks pressed. Android's behaviour: on joining the ESP32's WiFi (only where a world sets net.noNetOn) a banner
  says it has no internet, with Stay connected; during a long straight run (1.2 s rolling, 5 s after joining) the phone
  goes back to DUET-School unless told to stay (switched). Then runaway (it hit or kept pushing on something before it
  stopped) or safeStop (stopped within 2 s; stopMm). The first program runs away; with if (WiFi.softAPgetStationNum()
  == 0) drive(0, 0); at the top of loop() it stops about 5 cm later; Stay connected, then park in P. The check names
  GPIO 34–39 (input only) if the L298N is wired there. robocore24.mjs plays it with the network calls the page makes.
  Class 11: 17 of 26.
