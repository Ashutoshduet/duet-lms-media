// DUET Robotics Lab 360, batch 6: the Raspberry Pi. Eight lessons on the Pico (MicroPython: machine.Pin, PWM, ADC) and four
// on the Raspberry Pi 4 (Python 3 with gpiozero), Class 8–12. Same shape as lessons.js; a lesson also has
//   board 'pico' | 'pi4', lang 'py', baud 115200 (the Shell / terminal), cls (the school class)
// The circuit checks speak in the Pi's words (GP15, GPIO 17 / physical pin 11, 3.3 V); safety comes first: a resistor with
// every LED, never 5 V into a GPIO pin (a divider on a 5 V signal). The helpers (t3, P, F, W) come from lessons.js.

// a hole of a power rail at a breadboard column (the rails have a gap after every five holes)
const rail = (r, col) => { for (let i = 0; i < 50; i++) if (3 + i + Math.floor(i / 5) === col) return 'H:' + r + (i + 1); throw new Error('no rail hole at column ' + col); };

// ------------------------------------------------------------------ the programs
const P_BLINK = `# Blink: the green LED on the Pico
from machine import Pin
import time

led = Pin("LED", Pin.OUT)    # the LED on the board (GP25)

while True:
    led.toggle()             # on -> off, off -> on
    time.sleep(0.5)          # wait half a second
`;
const P_LED = `# An LED on GP15, with a 330 ohm resistor
from machine import Pin
import time

led = Pin(15, Pin.OUT)

while True:
    led.value(1)       # 3.3 V on GP15: the LED lights
    time.sleep(1)
    led.value(0)       # 0 V: off
    time.sleep(1)
`;
const P_BUTTON = `# A push button on GP14 switches the LED on GP15
from machine import Pin
import time

led = Pin(15, Pin.OUT)
button = Pin(14, Pin.IN, Pin.PULL_UP)   # free: 1, pressed: 0

while True:
    if button.value() == 0:      # pressed: joined to GND
        led.value(1)
    else:
        led.value(0)
    time.sleep(0.02)
`;
const P_FADE = `# Breathing LED: PWM on GP15 fades it in and out
from machine import Pin, PWM
import time

led = PWM(Pin(15))
led.freq(1000)                 # 1000 pulses a second: too fast to see

while True:
    for duty in range(0, 65536, 2048):      # brighter
        led.duty_u16(duty)
        time.sleep(0.02)
    for duty in range(65535, -1, -2048):    # dimmer
        led.duty_u16(duty)
        time.sleep(0.02)
`;
const P_POT = `# A knob on GP26 (ADC0): read it as 0 to 65535 and print it
from machine import ADC
import time

knob = ADC(26)

while True:
    value = knob.read_u16()          # 0 V -> 0, 3.3 V -> 65535
    volts = value * 3.3 / 65535
    print(value, round(volts, 2), "V")
    time.sleep(0.2)
`;
const P_SERVO = `# A servo on GP15: 50 pulses a second, the pulse's length sets the angle
from machine import Pin, PWM
import time

servo = PWM(Pin(15))
servo.freq(50)                   # one pulse every 20 ms

def angle(a):
    pulse_ms = 0.5 + a / 180 * 2     # 0 degrees: 0.5 ms ... 180 degrees: 2.5 ms
    servo.duty_u16(int(pulse_ms / 20 * 65535))

while True:
    angle(0)
    time.sleep(1)
    angle(90)
    time.sleep(1)
    angle(180)
    time.sleep(1)
`;
const P_SONAR = `# Distance with an HC-SR04: Trig on GP17, Echo on GP16 (through a divider)
from machine import Pin, time_pulse_us
import time

trig = Pin(17, Pin.OUT)
echo = Pin(16, Pin.IN)

while True:
    trig.low()
    time.sleep_us(2)
    trig.high()
    time.sleep_us(10)                # a 10 microsecond pulse starts a measurement
    trig.low()
    t = time_pulse_us(echo, 1, 30000)    # how long Echo stays HIGH (microseconds)
    cm = t * 0.0343 / 2                  # sound: 0.0343 cm a microsecond, there and back
    print(round(cm, 1))
    time.sleep(0.2)
`;
const P_LAMP = `# Smart night lamp: an LDR feels the light, the LED glows in the dark
from machine import Pin, ADC, PWM
import time

ldr = ADC(26)                # bright: a big number, dark: a small number
led = PWM(Pin(15))
led.freq(1000)

while True:
    light = ldr.read_u16()
    print(light)
    if light < 20000:        # dark
        led.duty_u16(65535)
    else:
        led.duty_u16(0)
    time.sleep(0.2)
`;
const R_LED = `# An LED on GPIO 17 (physical pin 11) blinks
from gpiozero import LED
from signal import pause

led = LED(17)            # GPIO number 17, not pin number 11!
led.blink(on_time=0.5, off_time=0.5)

pause()                  # keep the program running
`;
const R_LED2 = `# A button on GPIO 27 switches the LED on GPIO 17
from gpiozero import LED, Button
from signal import pause

led = LED(17)
button = Button(27)      # GPIO 27 (physical pin 13); its other leg goes to GND

button.when_pressed = led.on
button.when_released = led.off

pause()
`;
const R_PIR = `# Motion alarm: a PIR sensor on GPIO 4 and a buzzer on GPIO 18
from gpiozero import MotionSensor, Buzzer
from time import sleep

pir = MotionSensor(4)
buzzer = Buzzer(18)

print("Warming up...")
pir.wait_for_no_motion()        # the PIR needs a moment to learn the room
print("Ready")

while True:
    pir.wait_for_motion()
    print("Motion detected!")
    buzzer.beep(on_time=0.2, off_time=0.2, n=5, background=False)
    pir.wait_for_no_motion()
`;
const R_DHT = `# Temperature and humidity from a DHT11 on GPIO 4, in the terminal
import time
import board
import adafruit_dht

dht = adafruit_dht.DHT11(board.D4)

while True:
    try:
        t = dht.temperature
        h = dht.humidity
        print(f"{time.strftime('%H:%M:%S')}  Temp: {t:.1f} C   Humidity: {h} %")
    except RuntimeError as error:
        print("Reading failed, trying again:", error.args[0])
    time.sleep(2)
`;
const R_CAR = `# A Raspberry Pi robot car: two motors on an L298N, driven with gpiozero's Robot
from gpiozero import Robot, Motor
from time import sleep

robot = Robot(left=Motor(5, 6, enable=12), right=Motor(20, 21, enable=13))

robot.forward(0.6)       # both wheels forward at 60 % speed
sleep(2.5)
robot.left(0.5)          # spin left on the spot: a quarter turn
sleep(0.5)
robot.forward(0.6)
sleep(1.0)
robot.stop()
`;
export const PI_CODES = { P_BLINK, P_LED, P_BUTTON, P_FADE, P_POT, P_SERVO, P_SONAR, P_LAMP, R_LED, R_LED2, R_PIR, R_DHT, R_CAR };

export function batch6(K, n0) {
  const { t3, P, F, W } = K;
  const run = (see) => ({ k: 'run', do: t3('Press Run.', '"चलाइए" दबाइए।', 'Run dabaiye.'), see: see || t3('', '', '') });
  const check = { k: 'check', do: t3('Press "Check my circuit".', '"मेरा सर्किट जाँचिए" दबाइए।', '"Mera circuit check karo" dabaiye.'), see: t3('', '', '') };
  const X = { // the circuit checks' words: the Pi's pins, kind and exact
    ledShort: W.ledShort,
    ledRev: t3('The LED is the wrong way round: its long leg (+) goes towards {p}, its short leg (−) towards GND.', 'एलईडी उल्टी लगी है: लंबा पैर (+) {p} की तरफ़, छोटा पैर (−) GND की तरफ़।', 'LED ulti lagi hai: lamba pair (+) {p} ki taraf, chhota pair (−) GND ki taraf.'),
    noRes: t3('There is no resistor in the LED\'s path: too much current would flow out of {p}. Every LED needs its resistor (330 Ω).', 'एलईडी के रास्ते में रेज़िस्टर नहीं है: {p} से बहुत ज़्यादा करंट निकलेगा। हर एलईडी के साथ उसका रेज़िस्टर (330 Ω) चाहिए।', 'LED ke raaste mein resistor nahi hai: {p} se bahut zyada current niklega. Har LED ke saath uska resistor (330 Ω) chahiye.'),
    gndRail: t3('The blue − rail is not joined to the {b}\'s GND yet: add a wire from a GND pin to the − rail.', 'नीली − रेल अभी {b} के GND से नहीं जुड़ी: किसी GND पिन से − रेल तक वायर लगाइए।', 'Neeli − rail abhi {b} ke GND se nahi judi: kisi GND pin se − rail tak wire lagaiye.'),
    toPin: t3('The {x} must be joined to {p}.', '{x} को {p} से जोड़िए।', '{x} ko {p} se jodiye.'),
    missing: W.missing,
    short33: t3('3.3 V is joined straight to GND: a short circuit! Remove that wire.', '3.3 V सीधे GND से जुड़ गया है: शॉर्ट सर्किट! वह वायर हटाइए।', '3.3 V seedhe GND se jud gaya hai: short circuit! Woh wire hataiye.'),
    short5: t3('5 V is joined straight to GND: a short circuit! Remove that wire.', '5 V सीधे GND से जुड़ गया है: शॉर्ट सर्किट! वह वायर हटाइए।', '5 V seedhe GND se jud gaya hai: short circuit! Woh wire hataiye.'),
    fiveIn: t3('{p} is joined to 5 V! A Raspberry Pi pin takes at most 3.3 V. Take that wire off.', '{p} 5 V से जुड़ गया है! Raspberry Pi का पिन ज़्यादा से ज़्यादा 3.3 V सहता है। वह वायर हटाइए।', '{p} 5 V se jud gaya hai! Raspberry Pi ka pin zyada se zyada 3.3 V sehta hai. Woh wire hataiye.'),
    btnSide: t3('Both wires are on legs that are always joined (the same column of the button), so pressing changes nothing. Move one wire to the button\'s other column.', 'दोनों वायर ऐसे पैरों पर हैं जो हमेशा जुड़े रहते हैं (बटन का एक ही कॉलम), तो दबाने से कुछ नहीं बदलता। एक वायर बटन के दूसरे कॉलम में लगाइए।', 'Dono wire aise pairon par hain jo hamesha jude rehte hain (button ka ek hi column), to dabane se kuch nahi badalta. Ek wire button ke doosre column mein lagaiye.'),
    btnPin: t3('One side of the button must go to {p}, the other side to GND.', 'बटन की एक तरफ़ {p} से और दूसरी तरफ़ GND से जुड़नी चाहिए।', 'Button ki ek taraf {p} se aur doosri taraf GND se judni chahiye.'),
    pot5: t3('A knob end is on VBUS, which is 5 V: the ADC on GP26 would get up to 5 V and could be damaged. Use 3V3(OUT) (pin 36) instead.', 'नॉब का एक सिरा VBUS पर है, जो 5 V है: GP26 के ADC को 5 V तक मिलेगा और वह ख़राब हो सकता है। इसकी जगह 3V3(OUT) (पिन 36) लीजिए।', 'Knob ka ek sira VBUS par hai, jo 5 V hai: GP26 ke ADC ko 5 V tak milega aur woh kharab ho sakta hai. Iski jagah 3V3(OUT) (pin 36) lijiye.'),
    potEnds: t3('The knob\'s outer legs go to 3V3 and GND, its middle leg to GP26.', 'नॉब के बाहरी पैर 3V3 और GND पर, बीच वाला पैर GP26 पर।', 'Knob ke bahari pair 3V3 aur GND par, beech wala pair GP26 par.'),
    servo5: t3('The servo\'s red (+) wire needs 5 V: join it to VBUS (pin 40). On 3.3 V it is too weak to turn.', 'सर्वो के लाल (+) तार को 5 V चाहिए: इसे VBUS (पिन 40) से जोड़िए। 3.3 V पर यह घूमने के लिए बहुत कमज़ोर है।', 'Servo ke red (+) wire ko 5 V chahiye: ise VBUS (pin 40) se jodiye. 3.3 V par yeh ghoomne ke liye bahut kamzor hai.'),
    echoDirect: t3('Echo goes straight to GP16: the HC-SR04 sends 5 V back, too much for the Pico. Put the divider in: 1 kΩ from Echo, 2.2 kΩ to GND, and take GP16 from the middle.', 'Echo सीधे GP16 पर है: HC-SR04 वापस 5 V भेजता है, Pico के लिए बहुत ज़्यादा। डिवाइडर लगाइए: Echo से 1 kΩ, GND तक 2.2 kΩ, और GP16 बीच से लीजिए।', 'Echo seedhe GP16 par hai: HC-SR04 wapas 5 V bhejta hai, Pico ke liye bahut zyada. Divider lagaiye: Echo se 1 kΩ, GND tak 2.2 kΩ, aur GP16 beech se lijiye.'),
    divider: t3('The divider is not right yet: Echo → 1 kΩ → the middle → 2.2 kΩ → GND, and the middle to GP16.', 'डिवाइडर अभी ठीक नहीं: Echo → 1 kΩ → बीच → 2.2 kΩ → GND, और बीच से GP16।', 'Divider abhi theek nahi: Echo → 1 kΩ → beech → 2.2 kΩ → GND, aur beech se GP16.'),
    divSwap: t3('The two resistors are swapped: 2.2 kΩ from Echo and 1 kΩ to GND gives only 1.6 V. The 1 kΩ goes next to Echo.', 'दोनों रेज़िस्टर उल्टे लगे हैं: Echo से 2.2 kΩ और GND तक 1 kΩ सिर्फ़ 1.6 V देता है। 1 kΩ, Echo के पास लगता है।', 'Dono resistor ulte lage hain: Echo se 2.2 kΩ aur GND tak 1 kΩ sirf 1.6 V deta hai. 1 kΩ, Echo ke paas lagta hai.'),
    ldr: t3('The light sensor\'s divider: LDR from 3V3 to the middle, 10 kΩ from the middle to GND, the middle to GP26.', 'लाइट सेंसर का डिवाइडर: LDR 3V3 से बीच तक, 10 kΩ बीच से GND तक, बीच से GP26।', 'Light sensor ka divider: LDR 3V3 se beech tak, 10 kΩ beech se GND tak, beech se GP26.'),
    pir5: t3('The PIR needs 5 V on VCC (pin 2 or 4); its OUT gives only 3.3 V, so it is safe for GPIO 4.', 'PIR के VCC को 5 V (पिन 2 या 4) चाहिए; इसका OUT सिर्फ़ 3.3 V देता है, इसलिए GPIO 4 के लिए सुरक्षित है।', 'PIR ke VCC ko 5 V (pin 2 ya 4) chahiye; iska OUT sirf 3.3 V deta hai, isliye GPIO 4 ke liye safe hai.'),
    drvGnd: t3('The L298N\'s GND is not joined to the Pi\'s GND: without a common ground the Pi\'s 3.3 V signals mean nothing to the driver, and the motors will not move.', 'L298N का GND, Pi के GND से नहीं जुड़ा: साझा ग्राउंड के बिना Pi के 3.3 V सिग्नल ड्राइवर के लिए कुछ नहीं हैं, और मोटर नहीं चलेंगी।', 'L298N ka GND, Pi ke GND se nahi juda: common ground ke bina Pi ke 3.3 V signals driver ke liye kuch nahi hain, aur motors nahi chalengi.'),
  };
  const NM = { led: t3('LED', 'एलईडी', 'LED'), res: t3('resistor', 'रेज़िस्टर', 'resistor'), long: t3('LED\'s long leg (+)', 'एलईडी का लंबा पैर (+)', 'LED ka lamba pair (+)'), btn: t3('push button', 'पुश बटन', 'push button'), pot: t3('knob', 'नॉब', 'knob'), servo: t3('servo', 'सर्वो', 'servo'), wiper: t3('knob\'s middle leg', 'नॉब का बीच वाला पैर', 'knob ka beech wala pair') };
  const pinNm = (p) => t3(p, p, p);
  const has = (tag, nm) => (S) => (S.has(tag) ? null : [X.missing, { x: nm }]);
  const need = (a, b, x, p) => (S) => (S.conn(a, b) ? null : [X.toPin, { x, p }]);
  const noShort = (board) => (S) => (S.conn('3V3', 'GND') ? [X.short33] : S.conn(board === 'pico' ? 'VBUS' : '5V', 'GND') ? [X.short5] : null);
  const no5 = (pin, five) => (S) => (S.conn(pin, five) ? [X.fiveIn, { p: pin }] : null);
  // an LED and its resistor between a pin and GND (either order), as lessons.js's ledUnit, in the Pi's words
  const ledOk = (pin, b) => (S) => {
    if (!S.has('led1')) return [X.missing, { x: NM.led }];
    if (S.sameStrip('led1.A', 'led1.K')) return [X.ledShort];
    if (S.chain(pin, [['led1', 'A', 'K'], ['r1']], 'GND')) return null;
    if (S.chain(pin, [['led1', 'K', 'A'], ['r1']], 'GND')) return [X.ledRev, { p: pinNm(pin) }];
    if (S.conn('led1.A', pin) && S.conn('led1.K', 'GND')) return [X.noRes, { p: pinNm(pin) }];
    if (!S.has('r1')) return [X.missing, { x: NM.res }];
    if (!S.conn('rail:bn', 'GND') && (S.connAny('r1', 'rail:bn') || S.connAny('led1', 'rail:bn'))) return [X.gndRail, { b }];
    if (!S.conn('led1.A', pin) && !S.connAny('r1', pin)) return [X.toPin, { x: NM.long, p: pinNm(pin) }];
    return [X.toPin, { x: t3('resistor (or the LED\'s short leg)', 'रेज़िस्टर (या एलईडी का छोटा पैर)', 'resistor (ya LED ka chhota pair)'), p: pinNm('GND') }];
  };
  const btnOk = (pin) => (S) => {
    if (!S.has('b1')) return [X.missing, { x: NM.btn }];
    const A = ['b1.L1', 'b1.L2'], B2 = ['b1.L3', 'b1.L4']; const on = (side, x) => side.some((l) => S.conn(l, x));
    if ((on(A, pin) && on(A, 'GND')) || (on(B2, pin) && on(B2, 'GND'))) return [X.btnSide];
    if ((on(A, pin) && on(B2, 'GND')) || (on(B2, pin) && on(A, 'GND'))) return null;
    return [X.btnPin, { p: pinNm(pin) }];
  };
  const PICO_LED = { parts: [P('led1', 'led', { color: 'red' }, 'f31', 0), P('r1', 'resistor', { ohms: 330 }, 'j31', 1)], wires: [['H:j19', rail('bn', 19)], ['H:i21', 'H:j32']] }; // GP15 → LED → 330 Ω → − rail ← GND
  const merge = (...u) => ({ parts: u.flatMap((x) => x.parts || []), wires: u.flatMap((x) => x.wires || []) });
  const runSee = t3('Thonny\'s Shell (the panel on the right) shows "MPY: soft reboot": the program is on the Pico and running.', 'Thonny का Shell (दाईं ओर का पैनल) "MPY: soft reboot" दिखाता है: प्रोग्राम Pico पर पहुँचकर चल रहा है।', 'Thonny ka Shell (right side ka panel) "MPY: soft reboot" dikhata hai: program Pico par pahunch kar chal raha hai.');
  const runPi = t3('The terminal shows "python3 main.py": the Pi runs your program.', 'टर्मिनल "python3 main.py" दिखाता है: Pi आपका प्रोग्राम चला रहा है।', 'Terminal "python3 main.py" dikhata hai: Pi aapka program chala raha hai.');
  const obs = (S) => (S.lab.mcu.obs6 || { events: {}, duty: {}, dist: [], dht: [], lines: [], angles: new Set() });
  const outLines = (S) => obs(S).lines.join('\n'); // what the program printed (this run)
  // how often the program switched a pin, and the mean time between switches (s), by the board's own clock: a fast blink
  // stays a blink even when the screen draws few frames (on a slow phone the LED would only look dim)
  const flips = (S, g) => { const f = (S.lab.mcu.obs6 && S.lab.mcu.obs6.flips[g]) || { n: 0, per: [] }; const p = f.per.slice(1); return { n: f.n, per: p.length ? p.reduce((a, b) => a + b, 0) / p.length : 9 }; };
  const lit = (S, tag) => { const o = S.ob(tag); return !!o && o.maxI > 0.002; }; // current went through it (the circuit works)
  const L = [
    // ---------------------------------------------------------------------------------------------------- Pico 1
    { id: 'pico_blink', board: 'pico', view: 'board', code: P_BLINK, drawer: [], icon: '◫',
      title: t3('Meet the Pico: blink its LED', 'Pico से मिलिए: इसकी एलईडी जलाइए-बुझाइए', 'Pico se miliye: iski LED blink karo'),
      goal: t3('Find the parts of a Raspberry Pi Pico and blink its own green LED with MicroPython.', 'Raspberry Pi Pico के हिस्से पहचानिए और MicroPython से इसकी अपनी हरी एलईडी जलाइए-बुझाइए।', 'Raspberry Pi Pico ke parts pehchaniye aur MicroPython se iski apni green LED blink kijiye.'),
      setup: { parts: [], wires: [] },
      steps: [
        { k: 'info', do: t3('This is a Raspberry Pi Pico: a microcontroller board, 51 × 21 mm, that you program in MicroPython. It sits across the middle of the breadboard, so each of its 40 legs has its own column.', 'यह Raspberry Pi Pico है: 51 × 21 mm का माइक्रोकंट्रोलर बोर्ड, जिसे आप MicroPython में प्रोग्राम करते हैं। यह ब्रेडबोर्ड के बीच के आर-पार लगा है, इसलिए इसके 40 पैरों में से हर एक का अपना कॉलम है।', 'Yeh Raspberry Pi Pico hai: 51 × 21 mm ka microcontroller board, jise aap MicroPython mein program karte hain. Yeh breadboard ke beech ke aar-paar laga hai, isliye iske 40 pairon mein se har ek ka apna column hai.'),
          see: t3('Drag to look round it; scroll or pinch to zoom.', 'खींचकर चारों ओर देखिए; ज़ूम के लिए स्क्रॉल कीजिए या दो उँगलियों से फैलाइए।', 'Kheench kar chaaron taraf dekhiye; zoom ke liye scroll kijiye ya do ungliyon se failaiye.') },
        { k: 'tap', region: 'p_rp2040', do: t3('Tap the black square chip in the middle.', 'बीच की काली चौकोर चिप को छूइए।', 'Beech ki kaali chaukor chip ko touch karo.'), see: t3('The RP2040: two processor cores at 133 MHz and 264 KB of memory. The small chip next to it keeps your program (2 MB flash).', 'RP2040: 133 MHz के दो प्रोसेसर कोर और 264 KB मेमोरी। इसके पास वाली छोटी चिप आपका प्रोग्राम रखती है (2 MB फ़्लैश)।', 'RP2040: 133 MHz ke do processor core aur 264 KB memory. Iske paas wali chhoti chip aapka program rakhti hai (2 MB flash).') },
        { k: 'tap', region: 'p_bootsel', do: t3('Tap the white BOOTSEL button.', 'सफ़ेद BOOTSEL बटन को छूइए।', 'White BOOTSEL button ko touch karo.'), see: t3('Hold it while you plug the USB in, and the Pico shows up as a drive: copy the MicroPython file (.uf2) onto it once. After that, Thonny sends your programs.', 'USB लगाते समय इसे दबाए रखिए, तो Pico एक ड्राइव की तरह दिखता है: उस पर एक बार MicroPython फ़ाइल (.uf2) कॉपी कीजिए। उसके बाद Thonny आपके प्रोग्राम भेजता है।', 'USB lagate waqt ise dabaye rakhiye, to Pico ek drive ki tarah dikhta hai: uspar ek baar MicroPython file (.uf2) copy kijiye. Uske baad Thonny aapke programs bhejta hai.') },
        { k: 'tap', region: 'p_led', do: t3('Tap the tiny LED next to the USB socket.', 'USB सॉकेट के पास वाली छोटी एलईडी को छूइए।', 'USB socket ke paas wali chhoti LED ko touch karo.'), see: t3('A green LED joined to GP25 inside the board. In MicroPython its name is "LED".', 'बोर्ड के अंदर GP25 से जुड़ी हरी एलईडी। MicroPython में इसका नाम "LED" है।', 'Board ke andar GP25 se judi green LED. MicroPython mein iska naam "LED" hai.') },
        { k: 'tap', region: 'p_front', do: t3('Tap the row of pins nearest you.', 'आपके सबसे पास वाली पिनों की कतार को छूइए।', 'Aapke sabse paas wali pins ki line ko touch karo.'), see: t3('GP0 to GP15 and GND. Every GP pin works at 3.3 V: never put 5 V into one. Hover a pin (or point at it) to see its name.', 'GP0 से GP15 और GND। हर GP पिन 3.3 V पर काम करता है: इनमें कभी 5 V मत डालिए। किसी पिन पर पॉइंटर रखिए तो उसका नाम दिखेगा।', 'GP0 se GP15 aur GND. Har GP pin 3.3 V par kaam karta hai: inmein kabhi 5 V mat daaliye. Kisi pin par pointer rakhiye to uska naam dikhega.') },
        { k: 'info', code: [2, 5, 8, 9], do: t3('Read the program. from machine import Pin gives you the pins. Pin("LED", Pin.OUT) makes the LED an output. toggle() switches it over, and time.sleep(0.5) waits half a second. while True: repeats it for ever.', 'प्रोग्राम पढ़िए। from machine import Pin आपको पिन देता है। Pin("LED", Pin.OUT) एलईडी को आउटपुट बनाता है। toggle() उसे पलट देता है, और time.sleep(0.5) आधा सेकंड रुकता है। while True: इसे हमेशा दोहराता है।', 'Program padhiye. from machine import Pin aapko pins deta hai. Pin("LED", Pin.OUT) LED ko output banata hai. toggle() use palat deta hai, aur time.sleep(0.5) aadha second rukta hai. while True: ise hamesha dohrata hai.'),
          see: t3('Lines that start with # are notes for people.', '# से शुरू होने वाली लाइनें लोगों के लिए नोट हैं।', '# se shuru hone wali lines logon ke liye notes hain.') },
        run(runSee),
        { k: 'watch', until: (S) => S.toggles('L') >= 4, do: t3('Watch the green LED.', 'हरी एलईडी देखिए।', 'Green LED dekhiye.'), see: t3('On for half a second, off for half a second: your first MicroPython program works.', 'आधा सेकंड जली, आधा सेकंड बुझी: आपका पहला MicroPython प्रोग्राम चल गया।', 'Aadha second jali, aadha second bujhi: aapka pehla MicroPython program chal gaya.') },
        { k: 'edit', test: (src) => { const m = /time\.sleep\(\s*([\d.]+)\s*\)/.exec(src); return !!m && +m[1] > 0 && +m[1] <= 0.2; }, set: [[/time\.sleep\(0\.5\)/, 'time.sleep(0.1)']],
          do: t3('Make it blink fast: change time.sleep(0.5) to time.sleep(0.1), then press Run.', 'इसे तेज़ जलाइए-बुझाइए: time.sleep(0.5) को time.sleep(0.1) कीजिए, फिर "चलाइए" दबाइए।', 'Ise tez blink karo: time.sleep(0.5) ko time.sleep(0.1) karo, phir Run dabaiye.'), see: t3('Running a new program stops the old one, as Thonny does.', 'नया प्रोग्राम चलाने पर पुराना रुक जाता है, जैसे Thonny में।', 'Naya program chalane par purana ruk jaata hai, jaise Thonny mein.') },
        { k: 'watch', until: (S) => flips(S, 25).n >= 6 && flips(S, 25).per < 0.25, do: t3('Watch it now.', 'अब देखिए।', 'Ab dekhiye.'), see: t3('Five blinks a second. Time is in seconds here: 0.1 is a tenth of a second.', 'एक सेकंड में पाँच बार। यहाँ समय सेकंड में है: 0.1 यानी सेकंड का दसवाँ हिस्सा।', 'Ek second mein paanch baar. Yahan time second mein hai: 0.1 matlab second ka dasvaan hissa.') },
      ],
      done: (S) => flips(S, 25).n >= 6 && flips(S, 25).per < 0.25 },
    // ---------------------------------------------------------------------------------------------------- Pico 2
    { id: 'pico_led', board: 'pico', view: 'bb', code: P_LED, drawer: ['led', 'resistor'],
      title: t3('An LED on GP15, with its resistor', 'GP15 पर एलईडी, अपने रेज़िस्टर के साथ', 'GP15 par LED, apne resistor ke saath'),
      goal: t3('Build an LED circuit on the breadboard, safely, and switch it from MicroPython.', 'ब्रेडबोर्ड पर एलईडी का सर्किट सुरक्षित तरीक़े से बनाइए और उसे MicroPython से चलाइए।', 'Breadboard par LED ka circuit safe tareeke se banaiye aur use MicroPython se chalaiye.'),
      setup: { parts: [], wires: [] },
      steps: [
        { k: 'info', do: t3('Safety first: a GP pin gives 3.3 V, and an LED on its own would let too much current through. A resistor in the path keeps the current small. Every LED gets its resistor.', 'पहले सुरक्षा: GP पिन 3.3 V देता है, और अकेली एलईडी बहुत ज़्यादा करंट जाने देगी। रास्ते में लगा रेज़िस्टर करंट को कम रखता है। हर एलईडी के साथ उसका रेज़िस्टर लगता है।', 'Pehle safety: GP pin 3.3 V deta hai, aur akeli LED bahut zyada current jaane degi. Raaste mein laga resistor current ko kam rakhta hai. Har LED ke saath uska resistor lagta hai.'), see: t3('', '', '') },
        { k: 'place', place: P('led1', 'led', { color: 'red' }, 'f31', 0), do: t3('Put the red LED in 31f–32f, its long leg (+) in column 32.', 'लाल एलईडी को 31f–32f में लगाइए, लंबा पैर (+) कॉलम 32 में।', 'Red LED ko 31f–32f mein lagaiye, lamba pair (+) column 32 mein.'), see: t3('', '', '') },
        { k: 'place', place: P('r1', 'resistor', { ohms: 330 }, 'j31', 1), do: t3('Put the 330 Ω resistor from 31j down into the blue − rail.', '330 Ω रेज़िस्टर को 31j से नीचे नीली − रेल में लगाइए।', '330 Ω resistor ko 31j se neeche neeli − rail mein lagaiye.'), see: t3('Its bands: orange, orange, brown = 330 Ω.', 'इसकी पट्टियाँ: नारंगी, नारंगी, भूरा = 330 Ω।', 'Iski bands: orange, orange, brown = 330 Ω.') },
        { k: 'wire', wire: ['led1.A', 'GP15'], do: t3('Wire GP15 (the last pin of the front row, column 21) to the LED\'s long leg (column 32).', 'GP15 (आगे की कतार का आख़िरी पिन, कॉलम 21) से एलईडी के लंबे पैर (कॉलम 32) तक वायर लगाइए।', 'GP15 (aage ki line ka aakhri pin, column 21) se LED ke lambe pair (column 32) tak wire lagaiye.'), see: t3('Use a free hole of column 21 (rows i, j): the Pico\'s pin is joined to them.', 'कॉलम 21 का कोई ख़ाली छेद (पंक्ति i, j) लीजिए: Pico का पिन उनसे जुड़ा है।', 'Column 21 ka koi khaali hole (row i, j) lijiye: Pico ka pin unse juda hai.') },
        { k: 'wire', wire: ['GND', 'rail:bn'], do: t3('Wire a GND pin (column 19) to the blue − rail.', 'एक GND पिन (कॉलम 19) से नीली − रेल तक वायर लगाइए।', 'Ek GND pin (column 19) se neeli − rail tak wire lagaiye.'), see: t3('Now the current has a way back: GP15 → LED → resistor → GND.', 'अब करंट के लौटने का रास्ता है: GP15 → एलईडी → रेज़िस्टर → GND।', 'Ab current ke lautne ka raasta hai: GP15 → LED → resistor → GND.') },
        check,
        { k: 'info', code: [5, 8], do: t3('Pin(15, Pin.OUT) makes GP15 an output. led.value(1) puts 3.3 V on it. The current is (3.3 V − 1.8 V) ÷ 330 Ω ≈ 4.5 mA: bright enough, and easy for the pin.', 'Pin(15, Pin.OUT) GP15 को आउटपुट बनाता है। led.value(1) उस पर 3.3 V देता है। करंट (3.3 V − 1.8 V) ÷ 330 Ω ≈ 4.5 mA: काफ़ी रोशनी, और पिन के लिए आसान।', 'Pin(15, Pin.OUT) GP15 ko output banata hai. led.value(1) uspar 3.3 V deta hai. Current (3.3 V − 1.8 V) ÷ 330 Ω ≈ 4.5 mA: kaafi roshni, aur pin ke liye aasaan.'), see: t3('In Pin(15, …), 15 is the GP number, not the leg number: GP15 is leg 20.', 'Pin(15, …) में 15, GP नंबर है, पैर का नंबर नहीं: GP15 पैर 20 है।', 'Pin(15, …) mein 15, GP number hai, pair ka number nahi: GP15 pair 20 hai.') },
        run(runSee),
        { k: 'watch', until: (S) => S.toggles('led1') >= 3, do: t3('Watch the LED.', 'एलईडी देखिए।', 'LED dekhiye.'), see: t3('One second on, one second off. Hover the LED to see its current.', 'एक सेकंड जली, एक सेकंड बुझी। उसका करंट देखने के लिए एलईडी पर पॉइंटर रखिए।', 'Ek second jali, ek second bujhi. Uska current dekhne ke liye LED par pointer rakhiye.') },
        { k: 'edit', test: (src) => { const d = [...src.matchAll(/time\.sleep\(\s*([\d.]+)\s*\)/g)].map((m) => +m[1]); return d.length >= 2 && d.every((x) => x > 0 && x <= 0.3); }, set: [[/time\.sleep\(1\)/g, 'time.sleep(0.2)']],
          do: t3('A warning light flashes fast: change both time.sleep(1) to time.sleep(0.2), then Run.', 'चेतावनी वाली बत्ती तेज़ चमकती है: दोनों time.sleep(1) को time.sleep(0.2) कीजिए, फिर "चलाइए"।', 'Warning light tez chamakti hai: dono time.sleep(1) ko time.sleep(0.2) karo, phir Run.'), see: t3('', '', '') },
        { k: 'watch', until: (S) => flips(S, 15).n >= 6 && flips(S, 15).per < 0.35 && lit(S, 'led1'), do: t3('Watch it flash.', 'इसे चमकते देखिए।', 'Ise chamakte dekhiye.'), see: t3('The same circuit, a different program: that is the power of code.', 'वही सर्किट, अलग प्रोग्राम: यही कोड की ताक़त है।', 'Wahi circuit, alag program: yahi code ki taakat hai.') },
      ],
      check: [noShort('pico'), ledOk('GP15', 'Pico')],
      done: (S) => flips(S, 15).n >= 6 && flips(S, 15).per < 0.35 && lit(S, 'led1') },
    // ---------------------------------------------------------------------------------------------------- Pico 3
    { id: 'pico_button', board: 'pico', view: 'bb', code: P_BUTTON, drawer: ['button'],
      title: t3('A push button with a pull-up', 'पुल-अप के साथ पुश बटन', 'Pull-up ke saath push button'),
      goal: t3('Read a push button on GP14 with the Pico\'s pull-up resistor, and make the LED follow it, then toggle.', 'Pico के पुल-अप रेज़िस्टर से GP14 पर पुश बटन पढ़िए, एलईडी को उसके साथ चलाइए, फिर toggle कीजिए।', 'Pico ke pull-up resistor se GP14 par push button padhiye, LED ko uske saath chalaiye, phir toggle kijiye.'),
      setup: PICO_LED,
      steps: [
        { k: 'info', do: t3('The LED from the last lesson is ready on GP15. A button joins two legs when pressed. Pin.PULL_UP joins GP14 to 3.3 V through a resistor inside the chip, so it reads 1; pressing joins it to GND, and it reads 0.', 'पिछले पाठ वाली एलईडी GP15 पर तैयार है। बटन दबाने पर दो पैर जुड़ते हैं। Pin.PULL_UP चिप के अंदर के रेज़िस्टर से GP14 को 3.3 V से जोड़ता है, तो यह 1 पढ़ता है; दबाने पर यह GND से जुड़ता है और 0 पढ़ता है।', 'Pichle lesson wali LED GP15 par ready hai. Button dabane par do pair judte hain. Pin.PULL_UP chip ke andar ke resistor se GP14 ko 3.3 V se jodta hai, to yeh 1 padhta hai; dabane par yeh GND se judta hai aur 0 padhta hai.'), see: t3('Without the pull-up, a free pin reads 0 and 1 at random.', 'पुल-अप के बिना ख़ाली पिन अपने-आप 0 और 1 पढ़ता है।', 'Pull-up ke bina khaali pin apne-aap 0 aur 1 padhta hai.') },
        { k: 'place', place: P('b1', 'button', {}, 'e40', 0), do: t3('Put the push button across the middle gap at 40e–42f.', 'पुश बटन को बीच की खाली जगह के आर-पार 40e–42f पर लगाइए।', 'Push button ko beech ke gap ke aar-paar 40e–42f par lagaiye.'), see: t3('', '', '') },
        { k: 'wire', wire: ['b1.L2', 'GP14'], do: t3('Wire GP14 (column 20, front) to the button\'s leg in column 40 (rows g–j).', 'GP14 (कॉलम 20, आगे) से बटन के कॉलम 40 वाले पैर (पंक्ति g–j) तक वायर।', 'GP14 (column 20, aage) se button ke column 40 wale pair (row g–j) tak wire.'), see: t3('', '', '') },
        { k: 'wire', wire: ['b1.L4', 'rail:bn'], do: t3('Wire the button\'s other leg (column 42) to the blue − rail (GND).', 'बटन के दूसरे पैर (कॉलम 42) से नीली − रेल (GND) तक वायर।', 'Button ke doosre pair (column 42) se neeli − rail (GND) tak wire.'), see: t3('', '', '') },
        check,
        run(runSee),
        { k: 'act', until: (S) => S.flag('pressLit') && S.flag('releaseDark'), do: t3('Press and hold the button, then let go.', 'बटन दबाकर रखिए, फिर छोड़िए।', 'Button daba kar rakhiye, phir chhodiye.'), see: t3('Pressed: GP14 reads 0, the LED lights. Free: 1, dark.', 'दबा हुआ: GP14, 0 पढ़ता है, एलईडी जलती है। छूटा: 1, अँधेरा।', 'Daba hua: GP14, 0 padhta hai, LED jalti hai. Chhoota: 1, andhera.') },
        { k: 'edit', test: (src) => /led\.toggle\(\)/.test(src) && /button\.value\(\)\s*==\s*0/.test(src), set: [[/        led\.value\(1\)\n    else:\n        led\.value\(0\)\n    time\.sleep\(0\.02\)/, '        led.toggle()\n        time.sleep(0.3)        # one press, one toggle\n    time.sleep(0.02)']],
          do: t3('Make a light switch: inside the if, put led.toggle() and time.sleep(0.3); delete the else and its line. Run.', 'लाइट स्विच बनाइए: if के अंदर led.toggle() और time.sleep(0.3) लिखिए; else और उसकी लाइन हटाइए। "चलाइए"।', 'Light switch banaiye: if ke andar led.toggle() aur time.sleep(0.3) likhiye; else aur uski line hataiye. Run.'), see: t3('', '', '') },
        { k: 'act', until: (S) => S.toggles('led1') >= 2 && !S.ledLit('led1'), do: t3('Press the button once (the LED stays on), then again (off).', 'बटन एक बार दबाइए (एलईडी जली रहती है), फिर दोबारा (बुझ जाती है)।', 'Button ek baar dabaiye (LED jali rehti hai), phir dobara (bujh jaati hai).'), see: t3('time.sleep(0.3) waits for your finger, so one press is one toggle, like a room\'s light switch.', 'time.sleep(0.3) आपकी उँगली का इंतज़ार करता है, इसलिए एक बार दबाना एक बार पलटना है, कमरे के स्विच जैसा।', 'time.sleep(0.3) aapki ungli ka intezaar karta hai, isliye ek baar dabana ek baar palatna hai, kamre ke switch jaisa.') },
      ],
      check: [noShort('pico'), btnOk('GP14'), ledOk('GP15', 'Pico')],
      done: (S) => S.toggles('led1') >= 2 && !S.ledLit('led1') },
    // ---------------------------------------------------------------------------------------------------- Pico 4
    { id: 'pico_fade', board: 'pico', view: 'bb', code: P_FADE, drawer: [],
      title: t3('Breathing LED: PWM', 'साँस लेती एलईडी: PWM', 'Saans leti LED: PWM'),
      goal: t3('Fade an LED in and out with PWM (pulse width modulation) on GP15.', 'GP15 पर PWM (पल्स विड्थ मॉड्यूलेशन) से एलईडी को धीरे-धीरे जलाइए और बुझाइए।', 'GP15 par PWM (pulse width modulation) se LED ko dheere-dheere jalaiye aur bujhaiye.'),
      setup: PICO_LED,
      steps: [
        { k: 'info', do: t3('A pin is either 3.3 V or 0 V. PWM switches it on and off very fast: on for half of each pulse looks like half brightness. duty_u16 sets how much of each pulse is on: 0 to 65535.', 'पिन या तो 3.3 V होता है या 0 V। PWM उसे बहुत तेज़ी से चालू-बंद करता है: हर पल्स में आधा समय चालू यानी आधी चमक जैसा दिखता है। duty_u16 बताता है कि हर पल्स का कितना हिस्सा चालू है: 0 से 65535।', 'Pin ya to 3.3 V hota hai ya 0 V. PWM use bahut tezi se on-off karta hai: har pulse mein aadha time on matlab aadhi chamak jaisa dikhta hai. duty_u16 batata hai ki har pulse ka kitna hissa on hai: 0 se 65535.'), see: t3('32768 is half: 50 %.', '32768 आधा है: 50 %।', '32768 aadha hai: 50 %.') },
        { k: 'info', code: [5, 6, 9, 10], do: t3('PWM(Pin(15)) turns GP15 into a PWM pin; freq(1000) makes 1000 pulses a second. The for loop climbs from 0 to 65535 in steps of 2048, a little brighter every 20 ms.', 'PWM(Pin(15)) GP15 को PWM पिन बनाता है; freq(1000) एक सेकंड में 1000 पल्स बनाता है। for लूप 0 से 65535 तक 2048 के क़दमों में चढ़ता है, हर 20 ms पर थोड़ा और तेज़।', 'PWM(Pin(15)) GP15 ko PWM pin banata hai; freq(1000) ek second mein 1000 pulse banata hai. for loop 0 se 65535 tak 2048 ke steps mein chadhta hai, har 20 ms par thoda aur tez.'), see: t3('', '', '') },
        run(runSee),
        { k: 'watch', until: (S) => S.levels('led1') >= 3, do: t3('Watch the LED breathe.', 'एलईडी को साँस लेते देखिए।', 'LED ko saans lete dekhiye.'), see: t3('Bright, dim, bright: hover GP15 to see the pulses get wider and narrower.', 'तेज़, धीमी, तेज़: पल्स चौड़ी और पतली होते देखने के लिए GP15 पर पॉइंटर रखिए।', 'Tez, dheemi, tez: pulse chaudi aur patli hote dekhne ke liye GP15 par pointer rakhiye.') },
        { k: 'edit', test: (src) => { const d = [...src.matchAll(/time\.sleep\(\s*([\d.]+)\s*\)/g)].map((m) => +m[1]); return d.length >= 2 && d.every((x) => x >= 0.04 && x <= 0.2); }, set: [[/time\.sleep\(0\.02\)/g, 'time.sleep(0.05)']],
          do: t3('Breathe slowly, as when you sleep: change both time.sleep(0.02) to time.sleep(0.05). Run.', 'धीरे साँस, जैसे सोते समय: दोनों time.sleep(0.02) को time.sleep(0.05) कीजिए। "चलाइए"।', 'Dheere saans, jaise sote waqt: dono time.sleep(0.02) ko time.sleep(0.05) karo. Run.'), see: t3('', '', '') },
        { k: 'watch', until: (S) => S.levels('led1') >= 3 && (obs(S).duty[15] || new Set()).size >= 8, do: t3('Watch it again.', 'फिर देखिए।', 'Phir dekhiye.'), see: t3('32 steps up and 32 down, 50 ms each: one breath every 3.2 seconds. Phone chargers and laptops breathe their lights like this.', '32 क़दम ऊपर और 32 नीचे, हर एक 50 ms: हर 3.2 सेकंड में एक साँस। फ़ोन चार्जर और लैपटॉप अपनी बत्ती ऐसे ही जलाते हैं।', '32 steps upar aur 32 neeche, har ek 50 ms: har 3.2 second mein ek saans. Phone charger aur laptop apni batti aise hi jalate hain.') },
      ],
      done: (S) => S.levels('led1') >= 3 && /sleep\(0\.0[4-9]|sleep\(0\.1/.test(S.runSrc || '') },
    // ---------------------------------------------------------------------------------------------------- Pico 5
    { id: 'pico_pot', board: 'pico', view: 'bb', code: P_POT, drawer: ['pot'],
      title: t3('A knob, the ADC and print()', 'नॉब, ADC और print()', 'Knob, ADC aur print()'),
      goal: t3('Read a knob with the Pico\'s ADC on GP26, print the numbers in the Shell, then let it set the LED\'s brightness.', 'Pico के ADC से GP26 पर नॉब पढ़िए, संख्याएँ Shell में print कीजिए, फिर उससे एलईडी की चमक तय कीजिए।', 'Pico ke ADC se GP26 par knob padhiye, numbers Shell mein print kijiye, phir usse LED ki chamak tay kijiye.'),
      setup: PICO_LED, serial: true,
      steps: [
        { k: 'info', do: t3('A knob (potentiometer) between 3.3 V and GND gives any voltage between them on its middle leg. GP26, GP27 and GP28 have an ADC: it turns a voltage into a number.', '3.3 V और GND के बीच लगा नॉब (पोटेंशियोमीटर) अपने बीच वाले पैर पर उनके बीच का कोई भी वोल्टेज देता है। GP26, GP27 और GP28 में ADC है: यह वोल्टेज को संख्या में बदलता है।', '3.3 V aur GND ke beech laga knob (potentiometer) apne beech wale pair par unke beech ka koi bhi voltage deta hai. GP26, GP27 aur GP28 mein ADC hai: yeh voltage ko number mein badalta hai.'), see: t3('Use 3V3(OUT), never VBUS (5 V): an ADC pin takes at most 3.3 V.', '3V3(OUT) लीजिए, VBUS (5 V) कभी नहीं: ADC पिन ज़्यादा से ज़्यादा 3.3 V सहता है।', '3V3(OUT) lijiye, VBUS (5 V) kabhi nahi: ADC pin zyada se zyada 3.3 V sehta hai.') },
        { k: 'place', place: P('pot1', 'pot', {}, 'a40', 0), do: t3('Put the knob at 40a, 42a and 44a.', 'नॉब को 40a, 42a और 44a पर लगाइए।', 'Knob ko 40a, 42a aur 44a par lagaiye.'), see: t3('', '', '') },
        { k: 'wire', wire: ['pot1.1', 'GND'], do: t3('Wire its left leg (column 40) to a GND pin (column 19, back row).', 'इसके बाएँ पैर (कॉलम 40) से किसी GND पिन (कॉलम 19, पीछे की कतार) तक वायर।', 'Iske left pair (column 40) se kisi GND pin (column 19, peeche ki line) tak wire.'), see: t3('', '', '') },
        { k: 'wire', wire: ['pot1.3', '3V3'], do: t3('Wire its right leg (column 44) to 3V3(OUT), the Pico\'s pin in column 6 of the back row.', 'इसके दाएँ पैर (कॉलम 44) से 3V3(OUT) तक वायर, Pico की पीछे की कतार में कॉलम 6 वाला पिन।', 'Iske right pair (column 44) se 3V3(OUT) tak wire, Pico ki peeche ki line mein column 6 wala pin.'), see: t3('Now turning it up (clockwise) gives a bigger number.', 'अब इसे ऊपर (घड़ी की दिशा में) घुमाने पर संख्या बढ़ेगी।', 'Ab ise upar (clockwise) ghumane par number badhega.') },
        { k: 'wire', wire: ['pot1.W', 'GP26'], do: t3('Wire its middle leg (column 42) to GP26 (column 11, back row).', 'इसके बीच वाले पैर (कॉलम 42) से GP26 (कॉलम 11, पीछे की कतार) तक वायर।', 'Iske beech wale pair (column 42) se GP26 (column 11, peeche ki line) tak wire.'), see: t3('GP26 is ADC0.', 'GP26 यानी ADC0।', 'GP26 matlab ADC0.') },
        check,
        run(t3('The Shell prints the number, and the voltage it means, five times a second.', 'Shell हर सेकंड में पाँच बार संख्या और उसका वोल्टेज print करता है।', 'Shell har second mein paanch baar number aur uska voltage print karta hai.')),
        { k: 'act', until: (S) => S.adcMax(26) > 60000, do: t3('Turn the knob all the way up (drag it, or tap it and use its slider).', 'नॉब को पूरा ऊपर घुमाइए (खींचकर, या छूकर उसका स्लाइडर)।', 'Knob ko poora upar ghumaiye (kheench kar, ya touch karke uska slider).'), see: t3('Near 65535 and 3.3 V. The ADC really has 12 bits (0–4095); read_u16() scales it to 16 bits.', '65535 और 3.3 V के पास। ADC असल में 12 बिट का है (0–4095); read_u16() उसे 16 बिट तक फैलाता है।', '65535 aur 3.3 V ke paas. ADC asal mein 12 bit ka hai (0–4095); read_u16() use 16 bit tak failata hai.') },
        { k: 'act', until: (S) => S.adcMax(26) > 60000 && S.adcMin(26) < 2000, do: t3('Now turn it all the way down.', 'अब इसे पूरा नीचे घुमाइए।', 'Ab ise poora neeche ghumaiye.'), see: t3('Near 0. Every position in between gives its own number: that is an analog input.', '0 के पास। बीच की हर जगह अपनी संख्या देती है: यही एनालॉग इनपुट है।', '0 ke paas. Beech ki har jagah apna number deti hai: yahi analog input hai.') },
        { k: 'edit', test: (src) => /PWM\(\s*Pin\(\s*15\s*\)\s*\)/.test(src) && /duty_u16\(\s*value\s*\)/.test(src), set: [[/from machine import ADC\n/, 'from machine import ADC, Pin, PWM\n'], [/knob = ADC\(26\)\n/, 'knob = ADC(26)\nled = PWM(Pin(15))\nled.freq(1000)\n'], [/    volts = /, '    led.duty_u16(value)       # the knob sets the brightness\n    volts = ']],
          do: t3('Let the knob dim the LED: import Pin and PWM too, add led = PWM(Pin(15)) and led.freq(1000) under knob = ADC(26), and led.duty_u16(value) in the loop. Run.', 'नॉब से एलईडी धीमी कीजिए: Pin और PWM भी import कीजिए, knob = ADC(26) के नीचे led = PWM(Pin(15)) और led.freq(1000) लिखिए, और लूप में led.duty_u16(value)। "चलाइए"।', 'Knob se LED dheemi kijiye: Pin aur PWM bhi import kijiye, knob = ADC(26) ke neeche led = PWM(Pin(15)) aur led.freq(1000) likhiye, aur loop mein led.duty_u16(value). Run.'), see: t3('Both use 0 to 65535, so the reading goes straight in.', 'दोनों 0 से 65535 लेते हैं, इसलिए रीडिंग सीधे लग जाती है।', 'Dono 0 se 65535 lete hain, isliye reading seedhe lag jaati hai.') },
        { k: 'act', until: (S) => (obs(S).duty[15] || new Set()).size >= 4 && S.adcMax(26) - S.adcMin(26) > 30000 && lit(S, 'led1'), do: t3('Turn the knob slowly up and down.', 'नॉब को धीरे-धीरे ऊपर-नीचे घुमाइए।', 'Knob ko dheere-dheere upar-neeche ghumaiye.'), see: t3('A dimmer, as on a fan regulator: the input sets the output.', 'एक डिमर, पंखे के रेगुलेटर जैसा: इनपुट आउटपुट तय करता है।', 'Ek dimmer, pankhe ke regulator jaisa: input output tay karta hai.') },
      ],
      check: [noShort('pico'), (S) => (S.conn('pot1.1', 'VBUS') || S.conn('pot1.3', 'VBUS') ? [X.pot5] : null), has('pot1', NM.pot), need('pot1.W', 'GP26', NM.wiper, pinNm('GP26')), (S) => ((S.conn('pot1.1', '3V3') && S.conn('pot1.3', 'GND')) || (S.conn('pot1.3', '3V3') && S.conn('pot1.1', 'GND')) ? null : [X.potEnds])],
      done: (S) => (obs(S).duty[15] || new Set()).size >= 4 && S.adcMax(26) - S.adcMin(26) > 30000 && lit(S, 'led1') && /duty_u16\(\s*value\s*\)/.test(S.runSrc || '') }, // (the knob set several brightnesses)
    // ---------------------------------------------------------------------------------------------------- Pico 6
    { id: 'pico_servo', board: 'pico', view: 'wide', wview: 'wide', code: P_SERVO, drawer: ['servo'],
      title: t3('A servo: angles from pulses', 'सर्वो: पल्स से कोण', 'Servo: pulse se angle'),
      goal: t3('Turn an SG90 servo to 0°, 90° and 180° with 50 Hz PWM from GP15, then sweep it like a radar.', 'GP15 से 50 Hz PWM देकर SG90 सर्वो को 0°, 90° और 180° पर घुमाइए, फिर उसे रडार की तरह घुमाइए।', 'GP15 se 50 Hz PWM dekar SG90 servo ko 0°, 90° aur 180° par ghumaiye, phir use radar ki tarah ghumaiye.'),
      setup: { parts: [], wires: [] },
      steps: [
        { k: 'info', do: t3('A servo listens for one pulse every 20 ms (50 Hz). A 0.5 ms pulse means 0°, 1.5 ms means 90°, 2.5 ms means 180°. Its motor needs 5 V; the signal can be 3.3 V.', 'सर्वो हर 20 ms पर एक पल्स सुनता है (50 Hz)। 0.5 ms की पल्स यानी 0°, 1.5 ms यानी 90°, 2.5 ms यानी 180°। इसकी मोटर को 5 V चाहिए; सिग्नल 3.3 V का हो सकता है।', 'Servo har 20 ms par ek pulse sunta hai (50 Hz). 0.5 ms ki pulse matlab 0°, 1.5 ms matlab 90°, 2.5 ms matlab 180°. Iski motor ko 5 V chahiye; signal 3.3 V ka ho sakta hai.'), see: t3('', '', '') },
        { k: 'place', place: F('sv1', 'servo', {}, 60, 112, 0), do: t3('Put the servo on the mat at the ghost.', 'सर्वो को मैट पर नीली आकृति पर रखिए।', 'Servo ko mat par neeli shape par rakhiye.'), see: t3('', '', '') },
        { k: 'wire', wire: ['sv1.SIG', 'GP15'], do: t3('Wire the orange signal pin to GP15.', 'नारंगी सिग्नल पिन से GP15 तक वायर।', 'Orange signal pin se GP15 tak wire.'), see: t3('', '', '') },
        { k: 'wire', wire: ['sv1.VP', 'VBUS'], do: t3('Wire the red pin to VBUS (5 V from the USB, column 2 of the back row).', 'लाल पिन से VBUS (USB से 5 V, पीछे की कतार का कॉलम 2) तक वायर।', 'Red pin se VBUS (USB se 5 V, peeche ki line ka column 2) tak wire.'), see: t3('VBUS is for power only, never into a GP pin.', 'VBUS सिर्फ़ बिजली के लिए है, कभी GP पिन में नहीं।', 'VBUS sirf power ke liye hai, kabhi GP pin mein nahi.') },
        { k: 'wire', wire: ['sv1.GND', 'GND'], do: t3('Wire the brown pin to GND.', 'भूरे पिन से GND तक वायर।', 'Brown pin se GND tak wire.'), see: t3('', '', '') },
        check,
        { k: 'info', code: [8, 9, 10], do: t3('def angle(a): turns an angle into a pulse: 0.5 + a ÷ 180 × 2 ms, then into duty_u16: pulse ÷ 20 ms × 65535. angle(90) gives 1.5 ms: 4915.', 'def angle(a): कोण को पल्स में बदलता है: 0.5 + a ÷ 180 × 2 ms, फिर duty_u16 में: पल्स ÷ 20 ms × 65535। angle(90) देता है 1.5 ms: 4915।', 'def angle(a): angle ko pulse mein badalta hai: 0.5 + a ÷ 180 × 2 ms, phir duty_u16 mein: pulse ÷ 20 ms × 65535. angle(90) deta hai 1.5 ms: 4915.'), see: t3('', '', '') },
        run(runSee),
        { k: 'watch', until: (S) => S.servoRange('sv1') >= 170, do: t3('Watch the horn turn.', 'हॉर्न को घूमते देखिए।', 'Horn ko ghoomte dekhiye.'), see: t3('0°, 90°, 180°, one second each. Hover GP15 to see the short pulses.', '0°, 90°, 180°, हर एक पर एक सेकंड। छोटी पल्स देखने के लिए GP15 पर पॉइंटर रखिए।', '0°, 90°, 180°, har ek par ek second. Chhoti pulse dekhne ke liye GP15 par pointer rakhiye.') },
        { k: 'edit', test: (src) => /for\s+\w+\s+in\s+range\(\s*0\s*,\s*18[01]\s*,\s*\d+\s*\)/.test(src) && /angle\(\s*\w+\s*\)/.test(src), set: [[/while True:\n[\s\S]*$/, 'while True:\n    for a in range(0, 181, 10):      # sweep like a radar\n        angle(a)\n        time.sleep(0.1)\n    for a in range(180, -1, -10):\n        angle(a)\n        time.sleep(0.1)\n']],
          do: t3('Sweep like a radar: replace the loop with for a in range(0, 181, 10): angle(a) and time.sleep(0.1), then the same back from 180 to 0. Run.', 'रडार की तरह घुमाइए: लूप की जगह for a in range(0, 181, 10): angle(a) और time.sleep(0.1) लिखिए, फिर वैसे ही 180 से 0 तक वापस। "चलाइए"।', 'Radar ki tarah ghumaiye: loop ki jagah for a in range(0, 181, 10): angle(a) aur time.sleep(0.1) likhiye, phir waise hi 180 se 0 tak wapas. Run.'), see: t3('', '', '') },
        { k: 'watch', until: (S) => obs(S).angles.size >= 10, do: t3('Watch it sweep.', 'इसे घूमते देखिए।', 'Ise ghoomte dekhiye.'), see: t3('19 angles, 10° apart: smooth movement is many small steps. Robot arms and the CCTV cameras that pan work this way.', '19 कोण, 10° के अंतर पर: सहज हरकत बहुत से छोटे क़दम है। रोबोट आर्म और घूमने वाले CCTV कैमरे ऐसे ही चलते हैं।', '19 angles, 10° ke antar par: smooth movement bahut se chhote steps hai. Robot arm aur ghoomne wale CCTV camera aise hi chalte hain.') },
      ],
      check: [noShort('pico'), has('sv1', NM.servo), need('sv1.SIG', 'GP15', t3('servo\'s orange (signal) pin', 'सर्वो का नारंगी (सिग्नल) पिन', 'servo ka orange (signal) pin'), pinNm('GP15')), (S) => (S.conn('sv1.VP', 'VBUS') ? null : [X.servo5]), need('sv1.GND', 'GND', t3('servo\'s brown pin', 'सर्वो का भूरा पिन', 'servo ka brown pin'), pinNm('GND'))],
      done: (S) => obs(S).angles.size >= 10 },
    // ---------------------------------------------------------------------------------------------------- Pico 7
    { id: 'pico_sonar', board: 'pico', view: 'bb', code: P_SONAR, drawer: ['resistor'], serial: true,
      title: t3('Ultrasonic distance, safely at 3.3 V', 'अल्ट्रासोनिक दूरी, 3.3 V पर सुरक्षित', 'Ultrasonic doori, 3.3 V par safe'),
      goal: t3('Measure distance with an HC-SR04: a 5 V sensor whose Echo you bring down to 3.3 V with a voltage divider.', 'HC-SR04 से दूरी नापिए: यह 5 V का सेंसर है, जिसके Echo को आप वोल्टेज डिवाइडर से 3.3 V तक लाते हैं।', 'HC-SR04 se doori naapiye: yeh 5 V ka sensor hai, jiske Echo ko aap voltage divider se 3.3 V tak laate hain.'),
      setup: { parts: [P('us1', 'hcsr04', {}, 'j45', 0)], wires: [['H:a2', rail('tp', 3)], [rail('tp', 43), 'H:f45'], ['H:i19', rail('bn', 19)], [rail('bn', 49), 'H:f48']] },
      steps: [
        { k: 'info', do: t3('The HC-SR04 is powered from VBUS (5 V, the red + rail) and GND. Its Echo pin answers with 5 V: straight into the Pico that would push current into the chip. A divider of 1 kΩ and 2.2 kΩ brings 5 V down to 5 × 2.2 ÷ 3.2 ≈ 3.4 V.', 'HC-SR04 को VBUS (5 V, लाल + रेल) और GND से बिजली मिलती है। इसका Echo पिन 5 V से जवाब देता है: सीधे Pico में यह चिप में करंट धकेलेगा। 1 kΩ और 2.2 kΩ का डिवाइडर 5 V को 5 × 2.2 ÷ 3.2 ≈ 3.4 V तक लाता है।', 'HC-SR04 ko VBUS (5 V, red + rail) aur GND se power milti hai. Iska Echo pin 5 V se jawab deta hai: seedhe Pico mein yeh chip mein current dhakelega. 1 kΩ aur 2.2 kΩ ka divider 5 V ko 5 × 2.2 ÷ 3.2 ≈ 3.4 V tak laata hai.'), see: t3('Trig only listens, so 3.3 V from the Pico is enough to start it.', 'Trig सिर्फ़ सुनता है, इसलिए Pico का 3.3 V इसे शुरू करने के लिए काफ़ी है।', 'Trig sirf sunta hai, isliye Pico ka 3.3 V ise shuru karne ke liye kaafi hai.') },
        { k: 'wire', wire: ['us1.TRIG', 'GP17'], do: t3('Wire Trig (column 46) to GP17 (column 20, back row).', 'Trig (कॉलम 46) से GP17 (कॉलम 20, पीछे की कतार) तक वायर।', 'Trig (column 46) se GP17 (column 20, peeche ki line) tak wire.'), see: t3('', '', '') },
        { k: 'place', place: P('r1', 'resistor', { ohms: 1000 }, 'g47', 2), do: t3('Put the 1 kΩ resistor (brown, black, red) from Echo\'s column 47 to column 43, in row g.', '1 kΩ रेज़िस्टर (भूरा, काला, लाल) को Echo के कॉलम 47 से कॉलम 43 तक, पंक्ति g में लगाइए।', '1 kΩ resistor (brown, black, red) ko Echo ke column 47 se column 43 tak, row g mein lagaiye.'), see: t3('', '', '') },
        { k: 'place', place: P('r2', 'resistor', { ohms: 2200 }, 'j43', 1), do: t3('Put the 2.2 kΩ resistor (red, red, red) from 43j down into the − rail.', '2.2 kΩ रेज़िस्टर (लाल, लाल, लाल) को 43j से नीचे − रेल में लगाइए।', '2.2 kΩ resistor (red, red, red) ko 43j se neeche − rail mein lagaiye.'), see: t3('', '', '') },
        { k: 'wire', wire: ['r2.1', 'GP16'], do: t3('Wire the middle of the divider (column 43) to GP16 (column 21, back row).', 'डिवाइडर के बीच (कॉलम 43) से GP16 (कॉलम 21, पीछे की कतार) तक वायर।', 'Divider ke beech (column 43) se GP16 (column 21, peeche ki line) tak wire.'), see: t3('Hover column 43 after Run: it never goes above about 3.4 V.', '"चलाइए" के बाद कॉलम 43 पर पॉइंटर रखिए: यह लगभग 3.4 V से ऊपर नहीं जाता।', 'Run ke baad column 43 par pointer rakhiye: yeh lagbhag 3.4 V se upar nahi jaata.') },
        check,
        { k: 'info', code: [9, 10, 11, 12, 13, 14, 15], do: t3('A 10 µs pulse on Trig sends a burst of sound. time_pulse_us(echo, 1, 30000) measures how long Echo stays HIGH: the time for the sound to go and come back. Sound goes 0.0343 cm a microsecond, so cm = t × 0.0343 ÷ 2.', 'Trig पर 10 µs की पल्स आवाज़ का झोंका भेजती है। time_pulse_us(echo, 1, 30000) नापता है कि Echo कितनी देर HIGH रहा: आवाज़ के जाने और लौटने का समय। आवाज़ एक माइक्रोसेकंड में 0.0343 cm चलती है, इसलिए cm = t × 0.0343 ÷ 2।', 'Trig par 10 µs ki pulse awaaz ka jhonka bhejti hai. time_pulse_us(echo, 1, 30000) naapta hai ki Echo kitni der HIGH raha: awaaz ke jaane aur lautne ka time. Awaaz ek microsecond mein 0.0343 cm chalti hai, isliye cm = t × 0.0343 ÷ 2.'), see: t3('', '', '') },
        run(t3('The Shell prints the distance to the wooden block, five times a second.', 'Shell लकड़ी के ब्लॉक की दूरी हर सेकंड में पाँच बार print करता है।', 'Shell wooden block ki doori har second mein paanch baar print karta hai.')),
        { k: 'act', until: (S) => S.distSeen('us1', 2, 15), do: t3('Tap the sensor and slide the block closer than 15 cm.', 'सेंसर को छूइए और ब्लॉक को 15 cm से पास लाइए।', 'Sensor ko touch karo aur block ko 15 cm se paas laiye.'), see: t3('', '', '') },
        { k: 'act', until: (S) => S.distSeen('us1', 2, 15) && S.distSeen('us1', 60, 400), do: t3('Now move it far away, over 60 cm.', 'अब इसे दूर ले जाइए, 60 cm से ज़्यादा।', 'Ab ise door le jaiye, 60 cm se zyada.'), see: t3('The numbers follow the block, to within a few millimetres.', 'संख्याएँ ब्लॉक के साथ चलती हैं, कुछ मिलीमीटर तक सही।', 'Numbers block ke saath chalte hain, kuch millimetre tak sahi.') },
        { k: 'edit', test: (src) => /Pin\(\s*["']LED["']/.test(src) && /cm\s*<\s*\d+/.test(src), set: [[/echo = Pin\(16, Pin\.IN\)\n/, 'echo = Pin(16, Pin.IN)\nled = Pin("LED", Pin.OUT)\n'], [/    print\(round\(cm, 1\)\)\n/, '    print(round(cm, 1))\n    led.value(1 if cm < 20 else 0)    # too close: the LED warns\n']],
          do: t3('Add a warning: under echo = …, write led = Pin("LED", Pin.OUT); under the print, write led.value(1 if cm < 20 else 0). Run.', 'चेतावनी जोड़िए: echo = … के नीचे led = Pin("LED", Pin.OUT) लिखिए; print के नीचे led.value(1 if cm < 20 else 0)। "चलाइए"।', 'Warning jodiye: echo = … ke neeche led = Pin("LED", Pin.OUT) likhiye; print ke neeche led.value(1 if cm < 20 else 0). Run.'), see: t3('', '', '') },
        { k: 'act', until: (S) => (S.lab.ledL || 0) > 0.5 && S.part('us1') && S.part('us1').state.dist < 20, do: t3('Bring the block closer than 20 cm.', 'ब्लॉक को 20 cm से पास लाइए।', 'Block ko 20 cm se paas laiye.'), see: t3('The Pico\'s LED warns you: a parking sensor, built from a sensor, two resistors and 15 lines of Python.', 'Pico की एलईडी आपको चेतावनी देती है: एक पार्किंग सेंसर, जो एक सेंसर, दो रेज़िस्टर और Python की 15 लाइनों से बना।', 'Pico ki LED aapko warning deti hai: ek parking sensor, jo ek sensor, do resistor aur Python ki 15 lines se bana.') },
      ],
      check: [noShort('pico'), need('us1.TRIG', 'GP17', t3('sensor\'s Trig', 'सेंसर का Trig', 'sensor ka Trig'), pinNm('GP17')), (S) => (S.conn('us1.ECHO', 'GP16') ? [X.echoDirect] : null),
        (S) => { // Echo -> 1 kΩ -> GP16 -> 2.2 kΩ -> GND (the bigger one below)
          if (!S.has('r1') || !S.has('r2')) return [X.divider];
          for (const [hi, lo] of [['r1', 'r2'], ['r2', 'r1']]) if (S.chain('us1.ECHO', [[hi]], 'GP16') && S.chain('GP16', [[lo]], 'GND')) return S.part(hi).props.ohms > S.part(lo).props.ohms ? [X.divSwap] : null;
          return [X.divider];
        }],
      done: (S) => (S.lab.ledL || 0) > 0.5 && S.part('us1').state.dist < 20 && /Pin\(\s*["']LED["']/.test(S.runSrc || '') },
    // ---------------------------------------------------------------------------------------------------- Pico 8
    { id: 'pico_lamp', board: 'pico', view: 'bb', code: P_LAMP, drawer: ['ldr', 'resistor'], serial: true,
      title: t3('Mini project: a smart night lamp', 'मिनी प्रोजेक्ट: स्मार्ट रात की बत्ती', 'Mini project: smart night lamp'),
      goal: t3('Build a light sensor from an LDR and a resistor, read it on GP26, and light the LED by itself when the room gets dark.', 'LDR और रेज़िस्टर से लाइट सेंसर बनाइए, उसे GP26 पर पढ़िए, और कमरे में अँधेरा होने पर एलईडी अपने-आप जलाइए।', 'LDR aur resistor se light sensor banaiye, use GP26 par padhiye, aur kamre mein andhera hone par LED apne-aap jalaiye.'),
      setup: PICO_LED,
      steps: [
        { k: 'info', do: t3('An LDR\'s resistance falls in bright light. With a 10 kΩ resistor below it, the voltage between them is high in light and low in the dark: GP26 can read it.', 'तेज़ रोशनी में LDR का प्रतिरोध घटता है। इसके नीचे 10 kΩ रेज़िस्टर लगाने पर, दोनों के बीच का वोल्टेज रोशनी में ज़्यादा और अँधेरे में कम होता है: GP26 इसे पढ़ सकता है।', 'Tez roshni mein LDR ka resistance ghatta hai. Iske neeche 10 kΩ resistor lagane par, dono ke beech ka voltage roshni mein zyada aur andhere mein kam hota hai: GP26 ise padh sakta hai.'), see: t3('', '', '') },
        { k: 'place', place: P('ldr1', 'ldr', {}, 'a40', 0), do: t3('Put the LDR at 40a–42a.', 'LDR को 40a–42a पर लगाइए।', 'LDR ko 40a–42a par lagaiye.'), see: t3('', '', '') },
        { k: 'place', place: P('r2', 'resistor', { ohms: 10000 }, 'b42', 3), do: t3('Put the 10 kΩ resistor from 42b up into the back − rail.', '10 kΩ रेज़िस्टर को 42b से ऊपर पीछे वाली − रेल में लगाइए।', '10 kΩ resistor ko 42b se upar peeche wali − rail mein lagaiye.'), see: t3('Brown, black, orange: 10 kΩ.', 'भूरा, काला, नारंगी: 10 kΩ।', 'Brown, black, orange: 10 kΩ.') },
        { k: 'wire', wire: ['ldr1.1', '3V3'], do: t3('Wire the LDR\'s left leg (column 40) to 3V3(OUT) (column 6, back row).', 'LDR के बाएँ पैर (कॉलम 40) से 3V3(OUT) (कॉलम 6, पीछे की कतार) तक वायर।', 'LDR ke left pair (column 40) se 3V3(OUT) (column 6, peeche ki line) tak wire.'), see: t3('', '', '') },
        { k: 'wire', wire: ['ldr1.2', 'GP26'], do: t3('Wire the middle (column 42) to GP26 (column 11, back row).', 'बीच (कॉलम 42) से GP26 (कॉलम 11, पीछे की कतार) तक वायर।', 'Beech (column 42) se GP26 (column 11, peeche ki line) tak wire.'), see: t3('', '', '') },
        { k: 'wire', wire: ['GND', 'rail:tn'], do: t3('Wire a GND pin of the back row to the back − rail.', 'पीछे की कतार के किसी GND पिन से पीछे वाली − रेल तक वायर।', 'Peeche ki line ke kisi GND pin se peeche wali − rail tak wire.'), see: t3('', '', '') },
        check,
        run(t3('The Shell prints the light reading: a big number in this bright room.', 'Shell रोशनी की रीडिंग print करता है: इस उजले कमरे में बड़ी संख्या।', 'Shell roshni ki reading print karta hai: is ujle kamre mein badi sankhya.')),
        { k: 'act', until: (S) => S.flag('darkLit'), do: t3('Make the room dark: slide the 💡 light in the tool bar down below 30 %.', 'कमरे में अँधेरा कीजिए: टूल बार की 💡 लाइट को 30 % से नीचे सरकाइए।', 'Kamre mein andhera kijiye: tool bar ki 💡 light ko 30 % se neeche sarkaiye.'), see: t3('The reading drops below 20000 and the lamp comes on.', 'रीडिंग 20000 से नीचे जाती है और बत्ती जल जाती है।', 'Reading 20000 se neeche jaati hai aur batti jal jaati hai.') },
        { k: 'act', until: (S) => S.flag('brightDark'), do: t3('Turn the light back up.', 'रोशनी फिर बढ़ाइए।', 'Roshni phir badhaiye.'), see: t3('Daylight: the lamp goes off by itself, and saves power.', 'दिन की रोशनी: बत्ती अपने-आप बुझ जाती है और बिजली बचाती है।', 'Din ki roshni: batti apne-aap bujh jaati hai aur bijli bachati hai.') },
        { k: 'edit', test: (src) => { const m = /light\s*<\s*(\d+)/.exec(src); return !!m && +m[1] >= 25000 && +m[1] <= 45000; }, set: [[/light < 20000/, 'light < 32000']],
          do: t3('For a darker corner of the classroom, switch on earlier: change 20000 to 32000. Run.', 'कक्षा के ज़्यादा अँधेरे कोने के लिए, बत्ती पहले जलाइए: 20000 को 32000 कीजिए। "चलाइए"।', 'Class ke zyada andhere kone ke liye, batti pehle jalaiye: 20000 ko 32000 karo. Run.'), see: t3('', '', '') },
        { k: 'act', until: (S) => S.lab.env.light > 0.4 && S.lab.env.light < 0.6 && S.ledLit('led1'), do: t3('Dim the room to about half (45 %).', 'कमरे की रोशनी लगभग आधी (45 %) कीजिए।', 'Kamre ki roshni lagbhag aadhi (45 %) kijiye.'), see: t3('Now the lamp comes on at dusk already: you tuned a sensor with one number. Street lights are set like this.', 'अब बत्ती शाम होते ही जल जाती है: आपने एक संख्या से सेंसर को सेट किया। सड़क की बत्तियाँ ऐसे ही सेट होती हैं।', 'Ab batti shaam hote hi jal jaati hai: aapne ek number se sensor ko set kiya. Sadak ki battiyan aise hi set hoti hain.') },
      ],
      check: [noShort('pico'), has('ldr1', t3('LDR', 'एलडीआर', 'LDR')), (S) => (S.chain('3V3', [['ldr1']], 'GP26') && S.chain('GP26', [['r2']], 'GND') ? null : [X.ldr]), ledOk('GP15', 'Pico')],
      done: (S) => S.lab.env.light > 0.4 && S.lab.env.light < 0.6 && S.ledLit('led1') && /light\s*<\s*(2[5-9]|3\d|4[0-5])\d{3}/.test(S.runSrc || '') }, // (a new Run starts the flags again: the tuned lamp, lit at dusk)
    // ---------------------------------------------------------------------------------------------------- Pi 4: 1
    { id: 'pi_led', board: 'pi4', view: 'pi6', wview: 'pi6w', code: R_LED, drawer: ['led', 'resistor', 'button'],
      title: t3('Raspberry Pi 4: an LED and a button (GPIO numbers)', 'Raspberry Pi 4: एलईडी और बटन (GPIO नंबर)', 'Raspberry Pi 4: LED aur button (GPIO number)'),
      goal: t3('Meet the Raspberry Pi 4 and its 40-pin header, and learn GPIO numbers: wire an LED and a button, and control them with gpiozero.', 'Raspberry Pi 4 और उसके 40-पिन हेडर से मिलिए, और GPIO नंबर सीखिए: एलईडी और बटन जोड़िए और उन्हें gpiozero से चलाइए।', 'Raspberry Pi 4 aur uske 40-pin header se miliye, aur GPIO number seekhiye: LED aur button jodiye aur unhe gpiozero se chalaiye.'),
      setup: { parts: [], wires: [] },
      steps: [
        { k: 'info', do: t3('A Raspberry Pi 4 is a whole computer: four cores at 1.8 GHz, Linux, USB, WiFi, two screens. On its edge is the 40-pin header: 26 GPIO pins your Python can switch, plus 3.3 V, 5 V and GND.', 'Raspberry Pi 4 एक पूरा कंप्यूटर है: 1.8 GHz के चार कोर, Linux, USB, WiFi, दो स्क्रीन। इसके किनारे पर 40-पिन हेडर है: 26 GPIO पिन जिन्हें आपका Python चालू-बंद कर सकता है, और 3.3 V, 5 V और GND।', 'Raspberry Pi 4 ek poora computer hai: 1.8 GHz ke chaar core, Linux, USB, WiFi, do screen. Iske kinare par 40-pin header hai: 26 GPIO pins jinhe aapka Python on-off kar sakta hai, aur 3.3 V, 5 V aur GND.'), see: t3('The little screen behind it shows its terminal.', 'इसके पीछे की छोटी स्क्रीन इसका टर्मिनल दिखाती है।', 'Iske peeche ki chhoti screen iska terminal dikhati hai.') },
        { k: 'act', until: (S) => ['q_soc', 'q_header', 'q_usbc'].every((r) => S.tapped(r)), do: t3('Tap the processor (the metal square), the 40-pin header and the USB-C power socket.', 'प्रोसेसर (धातु का चौकोर), 40-पिन हेडर और USB-C पावर सॉकेट को छूइए।', 'Processor (dhaatu ka chaukor), 40-pin header aur USB-C power socket ko touch karo.'), see: t3('Its power supply gives 5 V, 3 A. The GPIO pins themselves work at 3.3 V.', 'इसकी पावर सप्लाई 5 V, 3 A देती है। GPIO पिन ख़ुद 3.3 V पर काम करते हैं।', 'Iski power supply 5 V, 3 A deti hai. GPIO pins khud 3.3 V par kaam karte hain.') },
        { k: 'info', do: t3('Two ways to count the pins: physical numbers (1 to 40, as they sit on the header) and GPIO numbers (the chip\'s names). Physical pin 11 is GPIO 17. gpiozero uses GPIO numbers: LED(17). Never put 5 V (pins 2, 4) into a GPIO pin.', 'पिन गिनने के दो तरीक़े: फ़िज़िकल नंबर (हेडर पर जैसे लगे हैं, 1 से 40) और GPIO नंबर (चिप के नाम)। फ़िज़िकल पिन 11 यानी GPIO 17। gpiozero GPIO नंबर लेता है: LED(17)। GPIO पिन में 5 V (पिन 2, 4) कभी मत डालिए।', 'Pin ginne ke do tareeke: physical number (header par jaise lage hain, 1 se 40) aur GPIO number (chip ke naam). Physical pin 11 matlab GPIO 17. gpiozero GPIO number leta hai: LED(17). GPIO pin mein 5 V (pin 2, 4) kabhi mat daaliye.'), see: t3('Point at any header pin to see both its numbers.', 'किसी भी हेडर पिन पर पॉइंट कीजिए, उसके दोनों नंबर दिखेंगे।', 'Kisi bhi header pin par point kijiye, uske dono number dikhenge.') },
        { k: 'place', place: P('led1', 'led', { color: 'red' }, 'f31', 0), do: t3('Put the red LED in 31f–32f, its long leg in column 32.', 'लाल एलईडी को 31f–32f में लगाइए, लंबा पैर कॉलम 32 में।', 'Red LED ko 31f–32f mein lagaiye, lamba pair column 32 mein.'), see: t3('', '', '') },
        { k: 'place', place: P('r1', 'resistor', { ohms: 330 }, 'j31', 1), do: t3('Put the 330 Ω resistor from 31j into the blue − rail.', '330 Ω रेज़िस्टर को 31j से नीली − रेल में लगाइए।', '330 Ω resistor ko 31j se neeli − rail mein lagaiye.'), see: t3('', '', '') },
        { k: 'wire', wire: ['led1.A', 'GPIO17'], do: t3('Wire GPIO 17 (physical pin 11) to the LED\'s long leg.', 'GPIO 17 (फ़िज़िकल पिन 11) से एलईडी के लंबे पैर तक वायर।', 'GPIO 17 (physical pin 11) se LED ke lambe pair tak wire.'), see: t3('Count from pin 1 (3.3 V, at the back): 1, 3, 5, 7, 9, 11 down the inner row.', 'पिन 1 (3.3 V, पीछे की तरफ़) से गिनिए: अंदर वाली कतार में 1, 3, 5, 7, 9, 11।', 'Pin 1 (3.3 V, peeche ki taraf) se giniye: andar wali line mein 1, 3, 5, 7, 9, 11.') },
        { k: 'wire', wire: ['GND', 'rail:bn'], do: t3('Wire a GND pin of the header to the blue − rail.', 'हेडर के किसी GND पिन से नीली − रेल तक वायर।', 'Header ke kisi GND pin se neeli − rail tak wire.'), see: t3('', '', '') },
        check,
        run(runPi),
        { k: 'watch', until: (S) => S.toggles('led1') >= 3, do: t3('Watch the LED.', 'एलईडी देखिए।', 'LED dekhiye.'), see: t3('blink() runs in the background, and pause() keeps Python alive. Without pause() the program would end at once and gpiozero would switch everything off.', 'blink() पीछे चलता रहता है, और pause() Python को चालू रखता है। pause() के बिना प्रोग्राम तुरंत ख़त्म होता और gpiozero सब बंद कर देता।', 'blink() peeche chalta rehta hai, aur pause() Python ko chalu rakhta hai. pause() ke bina program turant khatam hota aur gpiozero sab band kar deta.') },
        { k: 'place', place: P('b1', 'button', {}, 'e44', 0), do: t3('Now a button: put it across the gap at 44e–46f.', 'अब एक बटन: इसे बीच की खाली जगह के आर-पार 44e–46f पर लगाइए।', 'Ab ek button: ise beech ke gap ke aar-paar 44e–46f par lagaiye.'), see: t3('', '', '') },
        { k: 'wire', wire: ['b1.L2', 'GPIO27'], do: t3('Wire GPIO 27 (physical pin 13) to the button\'s leg in column 44 (rows g–j).', 'GPIO 27 (फ़िज़िकल पिन 13) से बटन के कॉलम 44 वाले पैर (पंक्ति g–j) तक वायर।', 'GPIO 27 (physical pin 13) se button ke column 44 wale pair (row g–j) tak wire.'), see: t3('', '', '') },
        { k: 'wire', wire: ['b1.L4', 'rail:bn'], do: t3('Wire its other leg (column 46) to the − rail.', 'इसके दूसरे पैर (कॉलम 46) से − रेल तक वायर।', 'Iske doosre pair (column 46) se − rail tak wire.'), see: t3('gpiozero\'s Button turns on the Pi\'s own pull-up, so no resistor is needed.', 'gpiozero का Button, Pi का अपना पुल-अप चालू करता है, इसलिए रेज़िस्टर की ज़रूरत नहीं।', 'gpiozero ka Button, Pi ka apna pull-up on karta hai, isliye resistor ki zaroorat nahi.') },
        { k: 'edit', test: (src) => /Button\(\s*27\s*\)/.test(src) && /when_pressed\s*=\s*led\.on\b/.test(src) && /when_released\s*=\s*led\.off\b/.test(src) && /import[^\n]*\bButton\b/.test(src), set: [[/[\s\S]*/, R_LED2]],
          do: t3('Import Button as well (from gpiozero import LED, Button), delete the blink line, and add: button = Button(27), button.when_pressed = led.on, button.when_released = led.off. Run.', 'Button भी import कीजिए (from gpiozero import LED, Button), blink वाली लाइन हटाइए, और लिखिए: button = Button(27), button.when_pressed = led.on, button.when_released = led.off। "चलाइए"।', 'Button bhi import kijiye (from gpiozero import LED, Button), blink wali line hataiye, aur likhiye: button = Button(27), button.when_pressed = led.on, button.when_released = led.off. Run.'), see: t3('led.on without brackets: you give the button the function, it calls it when you press.', 'led.on बिना कोष्ठक के: आप बटन को फ़ंक्शन देते हैं, दबाने पर वह उसे बुलाता है।', 'led.on bina bracket ke: aap button ko function dete hain, dabane par woh use bulata hai.') },
        { k: 'act', until: (S) => S.flag('pressLit') && S.flag('releaseDark'), do: t3('Press and hold the button, then let go.', 'बटन दबाकर रखिए, फिर छोड़िए।', 'Button daba kar rakhiye, phir chhodiye.'), see: t3('Events: Python waits in pause(), and gpiozero calls led.on and led.off when the button changes.', 'इवेंट: Python, pause() में इंतज़ार करता है, और बटन बदलने पर gpiozero, led.on और led.off को बुलाता है।', 'Events: Python, pause() mein intezaar karta hai, aur button badalne par gpiozero, led.on aur led.off ko bulata hai.') },
      ],
      check: [noShort('pi4'), no5('GPIO17', '5V'), ledOk('GPIO17', 'Pi'), (S) => (S.has('b1') ? btnOk('GPIO27')(S) : null)],
      done: (S) => S.flag('pressLit') && S.flag('releaseDark') },
    // ---------------------------------------------------------------------------------------------------- Pi 4: 2
    { id: 'pi_pir', board: 'pi4', view: 'pi6', wview: 'pi6w', code: R_PIR, drawer: ['pir'], serial: true,
      title: t3('Motion alarm: PIR sensor and buzzer', 'मोशन अलार्म: PIR सेंसर और बज़र', 'Motion alarm: PIR sensor aur buzzer'),
      goal: t3('Wire a PIR motion sensor and an active buzzer to the Pi, and sound an alarm when someone walks past.', 'Pi से PIR मोशन सेंसर और एक्टिव बज़र जोड़िए, और किसी के पास से गुज़रने पर अलार्म बजाइए।', 'Pi se PIR motion sensor aur active buzzer jodiye, aur kisi ke paas se guzarne par alarm bajaiye.'),
      setup: { parts: [P('bz1', 'abuzz', {}, 'e50', 0)], wires: [['B:GND5', 'H:a53']] },
      steps: [
        { k: 'info', do: t3('The PIR feels the warmth of a moving person. It needs 5 V to work, but its OUT pin gives only 3.3 V: safe for a GPIO pin. The active buzzer beeps by itself when its + leg gets 3.3 V.', 'PIR हिलते इंसान की गर्मी महसूस करता है। इसे चलने के लिए 5 V चाहिए, पर इसका OUT पिन सिर्फ़ 3.3 V देता है: GPIO पिन के लिए सुरक्षित। एक्टिव बज़र अपने + पैर पर 3.3 V मिलते ही ख़ुद बीप करता है।', 'PIR hilte insaan ki garmi mehsoos karta hai. Ise chalne ke liye 5 V chahiye, par iska OUT pin sirf 3.3 V deta hai: GPIO pin ke liye safe. Active buzzer apne + pair par 3.3 V milte hi khud beep karta hai.'), see: t3('The buzzer is on the breadboard, its − leg already on GND.', 'बज़र ब्रेडबोर्ड पर है, उसका − पैर पहले से GND पर।', 'Buzzer breadboard par hai, uska − pair pehle se GND par.') },
        { k: 'wire', wire: ['bz1.P', 'GPIO18'], do: t3('Wire GPIO 18 (physical pin 12) to the buzzer\'s + leg (column 50).', 'GPIO 18 (फ़िज़िकल पिन 12) से बज़र के + पैर (कॉलम 50) तक वायर।', 'GPIO 18 (physical pin 12) se buzzer ke + pair (column 50) tak wire.'), see: t3('', '', '') },
        { k: 'place', place: F('pir1', 'pir', {}, 30, 118, 0), do: t3('Put the PIR sensor on the mat at the ghost, its dome facing the room.', 'PIR सेंसर को मैट पर नीली आकृति पर रखिए, गुंबद कमरे की तरफ़।', 'PIR sensor ko mat par neeli shape par rakhiye, dome kamre ki taraf.'), see: t3('', '', '') },
        { k: 'wire', wire: ['pir1.VCC', '5V'], do: t3('Wire its VCC to 5V (physical pin 2).', 'इसके VCC से 5V (फ़िज़िकल पिन 2) तक वायर।', 'Iske VCC se 5V (physical pin 2) tak wire.'), see: t3('5 V is fine here: it powers the sensor, it does not go into a GPIO.', 'यहाँ 5 V ठीक है: यह सेंसर को बिजली देता है, किसी GPIO में नहीं जाता।', 'Yahan 5 V theek hai: yeh sensor ko power deta hai, kisi GPIO mein nahi jaata.') },
        { k: 'wire', wire: ['pir1.GND', 'GND'], do: t3('Wire its GND to a GND pin.', 'इसके GND से किसी GND पिन तक वायर।', 'Iske GND se kisi GND pin tak wire.'), see: t3('', '', '') },
        { k: 'wire', wire: ['pir1.OUT', 'GPIO4'], do: t3('Wire its OUT to GPIO 4 (physical pin 7).', 'इसके OUT से GPIO 4 (फ़िज़िकल पिन 7) तक वायर।', 'Iske OUT se GPIO 4 (physical pin 7) tak wire.'), see: t3('', '', '') },
        check,
        run(t3('The terminal says "Warming up...", then "Ready": a PIR needs a few seconds to learn the room.', 'टर्मिनल "Warming up..." और फिर "Ready" कहता है: PIR को कमरा समझने में कुछ सेकंड लगते हैं।', 'Terminal "Warming up..." aur phir "Ready" kehta hai: PIR ko kamra samajhne mein kuch second lagte hain.')),
        { k: 'act', until: (S) => (obs(S).events.motion || 0) >= 1 && S.part('bz1') && (S.part('bz1').state.beeps || 0) >= 3, do: t3('Wave a hand in front of the PIR: tap it and press ✋ Wave.', 'PIR के सामने हाथ हिलाइए: उसे छूइए और ✋ हाथ हिलाइए दबाइए।', 'PIR ke saamne haath hilaiye: use touch karo aur ✋ Wave dabaiye.'), see: t3('"Motion detected!" and five beeps.', '"Motion detected!" और पाँच बीप।', '"Motion detected!" aur paanch beep.') },
        { k: 'edit', test: (src) => /count\s*(\+=\s*1|=\s*count\s*\+\s*1)/.test(src) && /print\([^)]*count/.test(src), set: [[/while True:\n/, 'count = 0\nwhile True:\n'], [/    print\("Motion detected!"\)\n/, '    count += 1\n    print("Motion detected!", count)\n']],
          do: t3('Count the visitors: put count = 0 above while True:, then count += 1 after wait_for_motion(), and print("Motion detected!", count). Run.', 'आने वालों को गिनिए: while True: के ऊपर count = 0 लिखिए, फिर wait_for_motion() के बाद count += 1, और print("Motion detected!", count)। "चलाइए"।', 'Aane walon ko giniye: while True: ke upar count = 0 likhiye, phir wait_for_motion() ke baad count += 1, aur print("Motion detected!", count). Run.'), see: t3('', '', '') },
        { k: 'act', until: (S) => S.nums.includes(2), do: t3('Wave twice more, about 6 seconds apart: after a wave the PIR stays HIGH for 3 s, then rests for 2.5 s.', 'दो बार और हाथ हिलाइए, लगभग 6 सेकंड के अंतर पर: हाथ हिलाने के बाद PIR 3 s तक HIGH रहता है, फिर 2.5 s आराम करता है।', 'Do baar aur haath hilaiye, lagbhag 6 second ke antar par: haath hilane ke baad PIR 3 s tak HIGH rehta hai, phir 2.5 s aaram karta hai.'), see: t3('"Motion detected! 2": a visitor counter, like the ones at a museum door.', '"Motion detected! 2": आने वालों का काउंटर, जैसा संग्रहालय के दरवाज़े पर होता है।', '"Motion detected! 2": aane walon ka counter, jaisa museum ke darwaze par hota hai.') },
      ],
      check: [noShort('pi4'), no5('GPIO4', '5V'), (S) => (S.has('pir1') ? null : [X.missing, { x: t3('PIR sensor', 'PIR सेंसर', 'PIR sensor') }]), (S) => (S.conn('pir1.VCC', '5V') ? null : [X.pir5]), need('pir1.GND', 'GND', t3('PIR\'s GND', 'PIR का GND', 'PIR ka GND'), pinNm('GND')), need('pir1.OUT', 'GPIO4', t3('PIR\'s OUT', 'PIR का OUT', 'PIR ka OUT'), pinNm('GPIO 4')), need('bz1.P', 'GPIO18', t3('buzzer\'s + leg', 'बज़र का + पैर', 'buzzer ka + pair'), pinNm('GPIO 18'))],
      done: (S) => (obs(S).events.motion || 0) >= 2 && S.nums.includes(2) },
    // ---------------------------------------------------------------------------------------------------- Pi 4: 3
    { id: 'pi_dht', board: 'pi4', view: 'pi6', wview: 'pi6w', code: R_DHT, drawer: ['dht11'], serial: true,
      title: t3('Weather station in the terminal: DHT11', 'टर्मिनल में मौसम स्टेशन: DHT11', 'Terminal mein mausam station: DHT11'),
      goal: t3('Read temperature and humidity from a DHT11 with adafruit_dht, print them with the time, and handle the readings that fail.', 'adafruit_dht से DHT11 का तापमान और नमी पढ़िए, उन्हें समय के साथ print कीजिए, और फ़ेल होने वाली रीडिंग सँभालिए।', 'adafruit_dht se DHT11 ka temperature aur nami padhiye, unhe time ke saath print kijiye, aur fail hone wali reading sambhaliye.'),
      setup: { parts: [], wires: [] },
      steps: [
        { k: 'info', do: t3('The DHT11 (blue) measures temperature and humidity and sends both as numbers on one wire, DATA. It works on 3.3 V, so DATA is safe for the Pi.', 'DHT11 (नीला) तापमान और नमी नापता है और दोनों को संख्याओं में एक ही तार, DATA, पर भेजता है। यह 3.3 V पर चलता है, इसलिए DATA, Pi के लिए सुरक्षित है।', 'DHT11 (blue) temperature aur nami naapta hai aur dono ko numbers mein ek hi wire, DATA, par bhejta hai. Yeh 3.3 V par chalta hai, isliye DATA, Pi ke liye safe hai.'), see: t3('', '', '') },
        { k: 'place', place: P('th1', 'dht11', {}, 'e40', 0), do: t3('Put the DHT11 in 40e–42e, its grille facing you.', 'DHT11 को 40e–42e में लगाइए, जाली आपकी तरफ़।', 'DHT11 ko 40e–42e mein lagaiye, jaali aapki taraf.'), see: t3('Left to right: DATA (S), VCC (+), GND (−).', 'बाएँ से दाएँ: DATA (S), VCC (+), GND (−)।', 'Left se right: DATA (S), VCC (+), GND (−).') },
        { k: 'wire', wire: ['th1.DATA', 'GPIO4'], do: t3('Wire DATA (column 40) to GPIO 4 (physical pin 7).', 'DATA (कॉलम 40) से GPIO 4 (फ़िज़िकल पिन 7) तक वायर।', 'DATA (column 40) se GPIO 4 (physical pin 7) tak wire.'), see: t3('', '', '') },
        { k: 'wire', wire: ['th1.VCC', '3V3'], do: t3('Wire VCC (column 41) to 3.3V (physical pin 1).', 'VCC (कॉलम 41) से 3.3V (फ़िज़िकल पिन 1) तक वायर।', 'VCC (column 41) se 3.3V (physical pin 1) tak wire.'), see: t3('', '', '') },
        { k: 'wire', wire: ['th1.GND', 'GND'], do: t3('Wire GND (column 42) to a GND pin.', 'GND (कॉलम 42) से किसी GND पिन तक वायर।', 'GND (column 42) se kisi GND pin tak wire.'), see: t3('', '', '') },
        check,
        { k: 'info', code: [3, 4, 6, 9, 10, 11, 13], do: t3('board.D4 is GPIO 4. dht.temperature and dht.humidity ask the sensor. Now and then a DHT reading fails: try / except RuntimeError catches it, prints why, and the loop tries again 2 s later.', 'board.D4 यानी GPIO 4। dht.temperature और dht.humidity सेंसर से पूछते हैं। कभी-कभी DHT की रीडिंग फ़ेल होती है: try / except RuntimeError उसे पकड़ता है, कारण print करता है, और लूप 2 s बाद फिर कोशिश करता है।', 'board.D4 matlab GPIO 4. dht.temperature aur dht.humidity sensor se poochte hain. Kabhi-kabhi DHT ki reading fail hoti hai: try / except RuntimeError use pakadta hai, kaaran print karta hai, aur loop 2 s baad phir koshish karta hai.'), see: t3('Without try, one failed reading would stop the whole program.', 'try के बिना एक फ़ेल रीडिंग पूरा प्रोग्राम रोक देती।', 'try ke bina ek fail reading poora program rok deti.') },
        run(runPi),
        { k: 'watch', until: (S) => obs(S).dht.length >= 3, do: t3('Watch the terminal (and the Pi\'s little screen).', 'टर्मिनल (और Pi की छोटी स्क्रीन) देखिए।', 'Terminal (aur Pi ki chhoti screen) dekhiye.'), see: t3('The time, about 26 °C and 55 %, every 2 seconds. Did a "Reading failed" line appear? The program went on.', 'समय, लगभग 26 °C और 55 %, हर 2 सेकंड पर। क्या "Reading failed" वाली लाइन आई? प्रोग्राम चलता रहा।', 'Time, lagbhag 26 °C aur 55 %, har 2 second par. Kya "Reading failed" wali line aayi? Program chalta raha.') },
        { k: 'act', until: (S) => obs(S).dht.some(([t]) => t >= 34), do: t3('Warm the sensor: tap it and slide the temperature to 40 °C (a hot afternoon).', 'सेंसर को गर्म कीजिए: उसे छूइए और तापमान 40 °C तक सरकाइए (गर्म दोपहर)।', 'Sensor ko garam kijiye: use touch karo aur temperature 40 °C tak sarkaiye (garam dopahar).'), see: t3('The numbers climb over a few seconds: the sensor takes time to warm up, as a real one does.', 'संख्याएँ कुछ सेकंड में चढ़ती हैं: असली सेंसर की तरह इसे भी गर्म होने में समय लगता है।', 'Numbers kuch second mein chadhte hain: asli sensor ki tarah ise bhi garam hone mein time lagta hai.') },
        { k: 'edit', test: (src) => /if\s+t\s*>\s*3\d/.test(src) && /print\([^)]*[Hh]ot/.test(src), set: [[/(        print\(f"[^\n]*\n)/, '$1        if t > 35:\n            print("Too hot! Drink water.")\n']],
          do: t3('Add a heat warning under the print: if t > 35: and, pushed in under it, print("Too hot! Drink water."). Run.', 'print के नीचे गर्मी की चेतावनी जोड़िए: if t > 35: और उसके नीचे अंदर खिसकाकर print("Too hot! Drink water.")। "चलाइए"।', 'Print ke neeche garmi ki warning jodiye: if t > 35: aur uske neeche andar khiska kar print("Too hot! Drink water."). Run.'), see: t3('', '', '') },
        { k: 'watch', until: (S) => /Too hot/.test(outLines(S)), do: t3('Keep the sensor warm and watch.', 'सेंसर को गर्म रखिए और देखिए।', 'Sensor ko garam rakhiye aur dekhiye.'), see: t3('"Too hot! Drink water." Weather stations, greenhouses and server rooms use the same few lines.', '"Too hot! Drink water."। मौसम स्टेशन, ग्रीनहाउस और सर्वर रूम यही कुछ लाइनें इस्तेमाल करते हैं।', '"Too hot! Drink water.". Mausam station, greenhouse aur server room yahi kuch lines use karte hain.') },
      ],
      check: [noShort('pi4'), (S) => (S.has('th1') ? null : [X.missing, { x: t3('DHT11', 'DHT11', 'DHT11') }]), need('th1.DATA', 'GPIO4', t3('DHT11\'s DATA', 'DHT11 का DATA', 'DHT11 ka DATA'), pinNm('GPIO 4')), (S) => (S.conn('th1.VCC', '3V3') || S.conn('th1.VCC', '5V') ? null : [X.toPin, { x: t3('DHT11\'s VCC', 'DHT11 का VCC', 'DHT11 ka VCC'), p: pinNm('3.3V') }]), need('th1.GND', 'GND', t3('DHT11\'s GND', 'DHT11 का GND', 'DHT11 ka GND'), pinNm('GND'))],
      done: (S) => obs(S).dht.some(([t]) => t >= 34) && /Too hot/.test(outLines(S)) },
    // ---------------------------------------------------------------------------------------------------- Pi 4: 4
    { id: 'pi_car', board: 'pi4', view: 'carbench', wview: 'carbench', rview: 'arenapi', code: R_CAR, drawer: [], world: { kind: 'car', car: 'pi' },
      title: t3('A Raspberry Pi robot car', 'Raspberry Pi रोबोट कार', 'Raspberry Pi robot car'),
      goal: t3('Drive a two-motor car with an L298N and gpiozero\'s Robot, and program a route that parks it in P.', 'L298N और gpiozero के Robot से दो मोटर वाली कार चलाइए, और ऐसा रास्ता प्रोग्राम कीजिए जो उसे P में पार्क करे।', 'L298N aur gpiozero ke Robot se do motor wali car chalaiye, aur aisa raasta program kijiye jo use P mein park kare.'),
      setup: { parts: [F('drv', 'l298n', {}, -35, 105, 0), F('bat', 'bat18650', {}, -190, 108, 0), F('mL', 'bomotor', { side: 'L' }, -80, 152, 3), F('mR', 'bomotor', { side: 'R' }, 10, 152, 1)],
        wires: [['T:bat:P', 'T:drv:VS'], ['T:bat:N', 'T:drv:GND'], ['T:mL:P', 'T:drv:OUT1'], ['T:mL:N', 'T:drv:OUT2'], ['T:mR:P', 'T:drv:OUT3'], ['T:mR:N', 'T:drv:OUT4'], ['T:drv:IN1', 'GPIO5'], ['T:drv:IN2', 'GPIO6'], ['T:drv:IN3', 'GPIO20'], ['T:drv:IN4', 'GPIO21']] },
      steps: [
        { k: 'info', do: t3('The car\'s drive is on the bench (its twin is on the floor: 🏁 Robot view). The battery (7.4 V) feeds the L298N, the L298N feeds the motors. IN1–IN4 are wired to GPIO 5, 6, 20 and 21: they choose each wheel\'s direction.', 'कार की ड्राइव बेंच पर है (इसकी जुड़वाँ फ़र्श पर है: 🏁 रोबोट व्यू)। बैटरी (7.4 V), L298N को बिजली देती है, L298N मोटरों को। IN1–IN4, GPIO 5, 6, 20 और 21 से जुड़े हैं: ये हर पहिये की दिशा चुनते हैं।', 'Car ki drive bench par hai (iski judwaan floor par hai: 🏁 Robot view). Battery (7.4 V), L298N ko power deti hai, L298N motors ko. IN1–IN4, GPIO 5, 6, 20 aur 21 se jude hain: yeh har pahiye ki disha chunte hain.'), see: t3('The motors never take their current from the Pi: a GPIO pin gives a few milliamps, a motor wants hundreds.', 'मोटरें कभी Pi से करंट नहीं लेतीं: GPIO पिन कुछ मिलीएम्पियर देता है, मोटर को सैकड़ों चाहिए।', 'Motors kabhi Pi se current nahi letin: GPIO pin kuch milliamp deta hai, motor ko saikdon chahiye.') },
        { k: 'wire', wire: ['drv.ENA', 'GPIO12'], do: t3('Wire the L298N\'s ENA pin to GPIO 12 (physical pin 32).', 'L298N के ENA पिन से GPIO 12 (फ़िज़िकल पिन 32) तक वायर।', 'L298N ke ENA pin se GPIO 12 (physical pin 32) tak wire.'), see: t3('ENA switches motor A on; PWM on it sets the speed.', 'ENA मोटर A को चालू करता है; उस पर PWM रफ़्तार तय करता है।', 'ENA motor A ko on karta hai; uspar PWM speed tay karta hai.') },
        { k: 'wire', wire: ['drv.ENB', 'GPIO13'], do: t3('Wire ENB to GPIO 13 (physical pin 33).', 'ENB से GPIO 13 (फ़िज़िकल पिन 33) तक वायर।', 'ENB se GPIO 13 (physical pin 33) tak wire.'), see: t3('', '', '') },
        { k: 'wire', wire: ['drv.GND', 'GND'], do: t3('The common ground: wire the L298N\'s GND terminal to a GND pin of the Pi.', 'साझा ग्राउंड: L298N के GND टर्मिनल से Pi के किसी GND पिन तक वायर।', 'Common ground: L298N ke GND terminal se Pi ke kisi GND pin tak wire.'), see: t3('A 3.3 V signal is 3.3 V above the Pi\'s GND: the driver must share that GND to understand it.', '3.3 V का सिग्नल Pi के GND से 3.3 V ऊपर होता है: उसे समझने के लिए ड्राइवर का GND वही होना चाहिए।', '3.3 V ka signal Pi ke GND se 3.3 V upar hota hai: use samajhne ke liye driver ka GND wahi hona chahiye.') },
        check,
        { k: 'info', code: [5, 7, 8, 9, 10, 11, 12, 13], do: t3('Robot(left=Motor(5, 6, enable=12), right=Motor(20, 21, enable=13)) is the whole car. forward(0.6) drives both wheels at 60 %, left(0.5) spins on the spot, sleep() decides how long each move lasts.', 'Robot(left=Motor(5, 6, enable=12), right=Motor(20, 21, enable=13)) पूरी कार है। forward(0.6) दोनों पहियों को 60 % पर चलाता है, left(0.5) अपनी जगह पर घूमता है, sleep() तय करता है कि हर हरकत कितनी देर चले।', 'Robot(left=Motor(5, 6, enable=12), right=Motor(20, 21, enable=13)) poori car hai. forward(0.6) dono pahiyon ko 60 % par chalata hai, left(0.5) apni jagah par ghoomta hai, sleep() tay karta hai ki har harkat kitni der chale.'), see: t3('No camera, no sensor: a route by time, like counting steps with your eyes shut.', 'न कैमरा, न सेंसर: समय से बना रास्ता, जैसे आँखें बंद करके क़दम गिनना।', 'Na camera, na sensor: time se bana raasta, jaise aankhein band karke kadam ginna.') },
        run(t3('The car drives on the floor: watch it in the 🏁 Robot view.', 'कार फ़र्श पर चलती है: 🏁 रोबोट व्यू में देखिए।', 'Car floor par chalti hai: 🏁 Robot view mein dekhiye.')),
        { k: 'watch', until: (S) => S.wv('odo') > 900 && S.lab.mcu.state === 'done', do: t3('Watch the whole route.', 'पूरा रास्ता देखिए।', 'Poora raasta dekhiye.'), see: t3('Forward, a left turn, forward, stop… but it stops short of P.', 'आगे, बाएँ मुड़ना, आगे, रुकना… पर यह P से पहले रुक जाती है।', 'Aage, left mudna, aage, rukna… par yeh P se pehle ruk jaati hai.') },
        { k: 'edit', test: (src) => { const s = [...src.matchAll(/sleep\(\s*([\d.]+)\s*\)/g)].map((m) => +m[1]); return s.length >= 3 && s[2] >= 1.6 && s[2] <= 2.6; }, set: [[/sleep\(1\.0\)/, 'sleep(2.0)']],
          do: t3('The last straight is too short. Change the third sleep(1.0) to a longer time (try 2.0) and Run again. The car starts again from its start.', 'आख़िरी सीधा रास्ता छोटा है। तीसरे sleep(1.0) को लंबा कीजिए (2.0 आज़माइए) और फिर "चलाइए"। कार फिर से शुरू से चलती है।', 'Aakhri seedha raasta chhota hai. Teesre sleep(1.0) ko lamba kijiye (2.0 aazmaiye) aur phir Run. Car phir se shuru se chalti hai.'), see: t3('', '', '') },
        { k: 'watch', until: (S) => S.w('parked'), do: t3('Watch it drive into P.', 'इसे P में जाते देखिए।', 'Ise P mein jaate dekhiye.'), see: t3('Parked! Real robots add sensors (a line, a distance) because wheels slip and batteries run down: time alone is never exact.', 'पार्क हो गई! असली रोबोट सेंसर भी लगाते हैं (लाइन, दूरी), क्योंकि पहिये फिसलते हैं और बैटरी कमज़ोर होती है: सिर्फ़ समय कभी एकदम सही नहीं होता।', 'Park ho gayi! Asli robots sensors bhi lagate hain (line, doori), kyunki pahiye fisalte hain aur battery kamzor hoti hai: sirf time kabhi ekdum sahi nahi hota.') },
      ],
      check: [noShort('pi4'), (S) => (S.conn('drv.GND', 'GND') ? null : [X.drvGnd]), ...[['ENA', 12], ['ENB', 13], ['IN1', 5], ['IN2', 6], ['IN3', 20], ['IN4', 21]].map(([a, g]) => need('drv.' + a, 'GPIO' + g, 'L298N ' + a, pinNm('GPIO ' + g)))],
      done: (S) => S.w('parked') },
  ];
  // the school class each lesson is made for
  const CLS = { pico_blink: '8', pico_led: '8', pico_button: '8–9', pico_fade: '9', pico_pot: '9–10', pico_servo: '10', pico_sonar: '10–11', pico_lamp: '10–11', pi_led: '9–10', pi_pir: '10', pi_dht: '10–11', pi_car: '11–12' };
  L.forEach((l, i) => { l.n = n0 + i + 1; l.lang = 'py'; l.batch = 6; l.cls = CLS[l.id]; l.baud = 115200; });
  return L;
}
export { rail };
