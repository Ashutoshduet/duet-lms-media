// DUET Robotics Lab 360: the project card, so a student can do every project alone, without a teacher.
//   📦 What you need     every item and how many (the board, each part with its value, wires, the USB cable), with its picture
//   🔌 How to connect    every part's place and every wire, from where to where, in plain words (and which are done already)
//   💻 The code          the finished program, line by line: what each line makes the board do
//   🎓 What you learned  the ideas this project used, and a 3-question quiz
// Made from the lesson itself (its parts, steps, wires and code), so every lesson has one, in English, Hindi and Hinglish.
import { tx } from './i18n.js';
import { PARTS, fmtOhm } from './parts.js';
import { BOARDS } from './boards.js';
import { BY_ID } from './lessons.js';
import { sheet, esc, t3 } from './schoolkit.js';

const S = {
  btn: t3('📋 Project card', '📋 प्रोजेक्ट कार्ड', '📋 Project card'),
  need: t3('📦 What you need', '📦 क्या चाहिए', '📦 Kya chahiye'), conn: t3('🔌 How to connect', '🔌 कैसे जोड़ें', '🔌 Kaise jodein'),
  code: t3('💻 The code', '💻 कोड', '💻 Code'), learn: t3('🎓 What you learn', '🎓 क्या सीखा', '🎓 Kya seekha'),
  item: t3('Item', 'सामान', 'Item'), qty: t3('How many', 'कितने', 'Kitne'), why: t3('What it does', 'यह क्या करता है', 'Ye kya karta hai'),
  ready: t3('already on the bench', 'बेंच पर पहले से', 'bench par pehle se'), you: t3('you do it', 'आप कीजिए', 'aap kijiye'),
  place: t3('Put the {p} at {at}', '{p} को {at} पर लगाइए', '{p} ko {at} par lagaiye'), wire: t3('Wire {a} → {b}', 'तार: {a} → {b}', 'Wire: {a} → {b}'),
  wires: t3('Jumper wires', 'जम्पर तार', 'Jumper wires'), usb: t3('USB cable (to the computer)', 'USB केबल (कंप्यूटर से)', 'USB cable (computer se)'),
  bb: t3('Breadboard', 'ब्रेडबोर्ड', 'Breadboard'), bbWhy: t3('Holds the parts and joins them without solder: the 5 holes of a row are one strip.', 'पुर्ज़ों को बिना सोल्डर के पकड़ता और जोड़ता है: एक पंक्ति के 5 छेद एक पट्टी हैं।', 'Parts ko bina solder ke pakadta aur jodta hai: ek row ke 5 chhed ek patti hain.'),
  wiresWhy: t3('Carry current between the board and the parts.', 'बोर्ड और पुर्ज़ों के बीच करंट ले जाते हैं।', 'Board aur parts ke beech current le jaate hain.'),
  usbWhy: t3('Powers the board and sends your program into it.', 'बोर्ड को बिजली देता है और आपका प्रोग्राम उसमें भेजता है।', 'Board ko power deta hai aur aapka program usme bhejta hai.'),
  safety: t3('Safety: connect wires with the USB unplugged, check them twice, then plug in.', 'सुरक्षा: USB निकाला हुआ हो तब तार जोड़िए, दो बार जाँचिए, फिर लगाइए।', 'Safety: USB nikala hua ho tab wire jodiye, do baar check kijiye, phir lagaiye.'),
  hole: t3('breadboard hole {h}', 'ब्रेडबोर्ड छेद {h}', 'breadboard chhed {h}'), rail: t3('the {s} rail', '{s} रेल', '{s} rail'),
  pin: t3('{b} pin {p}', '{b} पिन {p}', '{b} pin {p}'), noCode: t3('No program in this project: it is a circuit with a battery and switches.', 'इस प्रोजेक्ट में प्रोग्राम नहीं: यह बैटरी और स्विच वाला सर्किट है।', 'Is project me program nahi: ye battery aur switch wala circuit hai.'),
  quiz: t3('Quick quiz', 'छोटी प्रश्नोत्तरी', 'Chhota quiz'), right: t3('✓ Right!', '✓ सही!', '✓ Sahi!'), wrong: t3('✗ Not quite. ', '✗ सही नहीं। ', '✗ Sahi nahi. '),
  goal: t3('Goal', 'लक्ष्य', 'Goal'), lines: t3('line', 'पंक्ति', 'line'), all: t3('{n}/{m} right', '{n}/{m} सही', '{n}/{m} sahi'),
  open: t3('Open the project card', 'प्रोजेक्ट कार्ड खोलिए', 'Project card kholiye'),
};
// ------------------------------------------------------------ names
function partOfTag(L, tag) {
  for (const p of (L.setup && L.setup.parts) || []) if (p.tag === tag) return p;
  for (const s of L.steps || []) if (s.k === 'place' && s.place.tag === tag) return s.place;
  return null;
}
function partName(p) { if (!p || !PARTS[p.type]) return p ? p.type : '?'; let n = tx(PARTS[p.type].name); const pr = p.props || {}; if (p.type === 'resistor' && pr.ohms) n += ' ' + fmtOhm(pr.ohms); if ((p.type === 'led') && pr.color) n += ` (${pr.color})`; return n; }
const RAIL = { tp: t3('top +', 'ऊपर की +', 'upar ki +'), tn: t3('top −', 'ऊपर की −', 'upar ki −'), bp: t3('bottom +', 'नीचे की +', 'neeche ki +'), bn: t3('bottom −', 'नीचे की −', 'neeche ki −') };
const SHORT = { uno: 'Arduino Uno', nano: 'Arduino Nano', mega: 'Arduino Mega', esp32: 'ESP32', pico: 'Pico', pi4: 'Raspberry Pi' };
function nameOf(L, x) {
  const board = BOARDS[L.board || 'uno']; const bn = SHORT[L.board || 'uno'] || tx(board.name).split(' (')[0];
  let m;
  if ((m = /^rail:(tp|tn|bp|bn)/.exec(x)) || (m = /^H:(tp|tn|bp|bn)\d+$/.exec(x))) return tx(S.rail, { s: tx(RAIL[m[1]]) });
  if ((m = /^H:([a-j])(\d+)$/.exec(x))) return tx(S.hole, { h: m[2] + m[1] });
  if ((m = /^T:([^:]+):(.+)$/.exec(x)) || (m = /^([a-zA-Z_]\w*)\.(\w+)$/.exec(x))) {
    const p = partOfTag(L, m[1]); const def = p && PARTS[p.type]; const pin = def && def.pins.find((q) => q.id === m[2]);
    return (def ? tx(def.name).split(' (')[0] : m[1]) + ' · ' + (pin ? tx(pin.name).split(':')[0] : m[2]);
  }
  const id = x.replace(/^B:/, ''); const p = board.pins.find((q) => q.id === id) || board.pins.find((q) => q.id === id.replace(/\d$/, ''));
  if (p) return tx(S.pin, { b: bn, p: p.label || id });
  if (/^(GND|5V|3V3|VIN)/.test(id)) return tx(S.pin, { b: bn, p: id.replace(/\d$/, '') });
  return x;
}
// ------------------------------------------------------------ 📦 and 🔌
export function bom(L) {
  const items = new Map(); const add = (key, name, why, n = 1, img) => { const o = items.get(key) || { name, why, n: 0, img }; o.n += n; items.set(key, o); };
  const board = BOARDS[L.board || 'uno']; if (L.group !== 'circuits') add('board', tx(board.name), tx(board.info || { en: '' }) || '', 1, 'board');
  const all = [...((L.setup && L.setup.parts) || []).map((p) => [p, true]), ...(L.steps || []).filter((s) => s.k === 'place').map((s) => [s.place, false])];
  let usesBB = false;
  for (const [p] of all) { const def = PARTS[p.type]; if (!def) continue; if (p.at && p.at.hole) usesBB = true; add(p.type + '|' + partName(p), partName(p), tx(def.info || '').split(/(?<=[.।])\s/)[0], 1, p.type); }
  const wires = ((L.setup && L.setup.wires) || []).length + (L.steps || []).filter((s) => s.k === 'wire').length;
  if (usesBB || wires) add('bb', tx(S.bb), tx(S.bbWhy));
  if (wires) add('wires', tx(S.wires), tx(S.wiresWhy), wires);
  if (L.group !== 'circuits' && !/^pi/.test(L.board || '')) add('usb', tx(S.usb), tx(S.usbWhy));
  return [...items.values()];
}
export function connections(L) {
  const out = [];
  for (const p of (L.setup && L.setup.parts) || []) if (p.at && p.at.hole) out.push({ done: true, text: tx(S.place, { p: partName(p), at: tx(S.hole, { h: p.at.hole.replace(/^([a-j])(\d+)$/, '$2$1') }) }) });
  for (const [a, b] of (L.setup && L.setup.wires) || []) out.push({ done: true, text: tx(S.wire, { a: nameOf(L, a), b: nameOf(L, b) }) });
  for (const s of L.steps || []) {
    if (s.k === 'place') { const at = s.place.at || {}; out.push({ done: false, text: tx(S.place, { p: partName(s.place), at: at.hole ? tx(S.hole, { h: at.hole.replace(/^([a-j])(\d+)$/, '$2$1') }) : '—' }), tip: s.place.type === 'led' ? tx({ en: 'Long leg (+) towards the pin, short leg (−) towards GND.', hi: 'लंबा पैर (+) पिन की ओर, छोटा पैर (−) GND की ओर।', hg: 'Lamba pair (+) pin ki taraf, chhota pair (−) GND ki taraf.' }) : '' }); }
    if (s.k === 'wire') out.push({ done: false, text: tx(S.wire, { a: nameOf(L, s.wire[0]), b: nameOf(L, s.wire[1]) }) });
  }
  return out;
}
// ------------------------------------------------------------ 💻 the finished code, explained
export function finalCode(L) { let c = L.code || ''; for (const s of L.steps || []) if (s.k === 'edit' && Array.isArray(s.set)) for (const [re, rep] of s.set) { try { c = c.replace(re, rep); } catch (e) { /* */ } } return c; }
const X = [ // [pattern, explanation]: the first match explains a line ($1, $2 … are the pattern's groups)
  [/^\s*#include\s*<([\w.]+)>/, t3('Brings in the $1 library: ready-made code for a part.', '$1 लाइब्रेरी जोड़ता है: किसी पुर्ज़े के लिए तैयार कोड।', '$1 library jodta hai: kisi part ke liye taiyar code.')],
  [/^\s*(?:from|import)\s+([\w.]+)/, t3('Brings in $1: ready-made Python code for the board and its parts.', '$1 जोड़ता है: बोर्ड और पुर्ज़ों के लिए तैयार Python कोड।', '$1 jodta hai: board aur parts ke liye taiyar Python code.')],
  [/^\s*(?:const\s+)?int\s+(\w+)\s*=\s*(-?\d+)\s*;/, t3('A number box named $1 that starts at $2.', '$1 नाम का एक नंबर-डिब्बा, जो $2 से शुरू होता है।', '$1 naam ka number box, jo $2 se shuru hota hai.')],
  [/^\s*(?:float|long|unsigned long|bool|String|byte)\s+(\w+)/, t3('A variable named $1 to remember a value.', 'एक वेरिएबल $1, जो एक मान याद रखता है।', 'Ek variable $1, jo ek value yaad rakhta hai.')],
  [/^\s*void\s+setup\s*\(/, t3('setup() runs once, when the board starts: get the pins ready here.', 'setup() एक बार चलता है, बोर्ड चालू होते ही: पिन यहाँ तैयार करते हैं।', 'setup() ek baar chalta hai, board chalu hote hi: pins yahan ready karte hain.')],
  [/^\s*void\s+loop\s*\(/, t3('loop() runs again and again, for ever: the main work goes here.', 'loop() बार-बार हमेशा चलता है: मुख्य काम यहाँ होता है।', 'loop() baar-baar hamesha chalta hai: main kaam yahan hota hai.')],
  [/^\s*void\s+(\w+)\s*\(/, t3('Your own function $1(): a named group of steps you can call.', 'आपका अपना फ़ंक्शन $1(): क़दमों का नाम वाला समूह जिसे बुला सकते हैं।', 'Aapka apna function $1(): steps ka naam wala group jise bula sakte hain.')],
  [/pinMode\(\s*(\w+)\s*,\s*OUTPUT\s*\)/, t3('Makes pin $1 an OUTPUT: the board will send current out of it.', 'पिन $1 को OUTPUT बनाता है: बोर्ड इससे करंट बाहर भेजेगा।', 'Pin $1 ko OUTPUT banata hai: board isse current bahar bhejega.')],
  [/pinMode\(\s*(\w+)\s*,\s*INPUT_PULLUP\s*\)/, t3('Makes pin $1 an INPUT with a built-in pull-up: it reads HIGH until a button joins it to GND.', 'पिन $1 को अंदरूनी पुल-अप के साथ INPUT बनाता है: बटन दबाकर GND से जुड़ने तक यह HIGH पढ़ता है।', 'Pin $1 ko pull-up ke saath INPUT banata hai: button se GND judne tak ye HIGH padhta hai.')],
  [/pinMode\(\s*(\w+)\s*,\s*INPUT\s*\)/, t3('Makes pin $1 an INPUT: the board will read it.', 'पिन $1 को INPUT बनाता है: बोर्ड इसे पढ़ेगा।', 'Pin $1 ko INPUT banata hai: board ise padhega.')],
  [/digitalWrite\(\s*(\w+)\s*,\s*HIGH\s*\)/, t3('Pin $1 goes HIGH (5 V): whatever is on it switches on.', 'पिन $1 HIGH (5 V) होता है: उस पर लगा पुर्ज़ा चालू होता है।', 'Pin $1 HIGH (5 V) hota hai: us par laga part on hota hai.')],
  [/digitalWrite\(\s*(\w+)\s*,\s*LOW\s*\)/, t3('Pin $1 goes LOW (0 V): it switches off.', 'पिन $1 LOW (0 V) होता है: बंद हो जाता है।', 'Pin $1 LOW (0 V) hota hai: off ho jata hai.')],
  [/digitalWrite\(\s*(\w+)\s*,/, t3('Sets pin $1 HIGH or LOW.', 'पिन $1 को HIGH या LOW करता है।', 'Pin $1 ko HIGH ya LOW karta hai.')],
  [/digitalRead\(\s*(\w+)\s*\)/, t3('Reads pin $1: HIGH (1) or LOW (0).', 'पिन $1 पढ़ता है: HIGH (1) या LOW (0)।', 'Pin $1 padhta hai: HIGH (1) ya LOW (0).')],
  [/analogRead\(\s*(\w+)\s*\)/, t3('Reads the voltage on $1 as a number (0 to 1023 on an Uno).', '$1 पर वोल्टेज को एक संख्या के रूप में पढ़ता है (Uno पर 0 से 1023)।', '$1 par voltage ko number ki tarah padhta hai (Uno par 0 se 1023).')],
  [/analogWrite\(\s*(\w+)\s*,\s*([^)]+)\)/, t3('PWM on pin $1: switches it on and off very fast, so it looks $2/255 bright (or that fast).', 'पिन $1 पर PWM: बहुत तेज़ी से चालू-बंद, ताकि यह $2/255 जितना चमके (या उतना तेज़ चले)।', 'Pin $1 par PWM: bahut tez on-off, taki ye $2/255 jitna chamke (ya utna tez chale).')],
  [/delay\(\s*(\d+)\s*\)/, t3('Waits $1 milliseconds (1000 ms = 1 second) before the next line.', 'अगली पंक्ति से पहले $1 मिलीसेकंड रुकता है (1000 ms = 1 सेकंड)।', 'Agli line se pehle $1 millisecond rukta hai (1000 ms = 1 second).')],
  [/(?:time\.)?sleep(?:_ms)?\(\s*([\d.]+)\s*\)/, t3('Waits $1 before the next line.', 'अगली पंक्ति से पहले $1 रुकता है।', 'Agli line se pehle $1 rukta hai.')],
  [/Serial\.begin\(\s*(\d+)\s*\)/, t3('Starts talking to the computer at $1 baud (set the Serial Monitor to the same speed).', 'कंप्यूटर से $1 बॉड पर बात शुरू करता है (Serial Monitor की रफ़्तार भी यही रखिए)।', 'Computer se $1 baud par baat shuru karta hai (Serial Monitor ki speed bhi yahi rakhiye).')],
  [/Serial\.print(?:ln)?\(/, t3('Sends text or a number to the Serial Monitor.', 'Serial Monitor पर शब्द या संख्या भेजता है।', 'Serial Monitor par text ya number bhejta hai.')],
  [/^\s*print\(/, t3('Shows text or a number on the screen (the Shell).', 'स्क्रीन (Shell) पर शब्द या संख्या दिखाता है।', 'Screen (Shell) par text ya number dikhata hai.')],
  [/\.write\(\s*([^)]+)\)/, t3('Turns the servo to $1 degrees.', 'सर्वो को $1 डिग्री पर घुमाता है।', 'Servo ko $1 degree par ghumata hai.')],
  [/\.attach\(\s*(\w+)\s*\)/, t3('Connects the servo object to pin $1.', 'सर्वो को पिन $1 से जोड़ता है।', 'Servo ko pin $1 se jodta hai.')],
  [/\btone\(\s*(\w+)\s*,\s*(\w+)/, t3('Plays a note of $2 Hz on pin $1 (the buzzer sings).', 'पिन $1 पर $2 Hz का सुर बजाता है (बज़र गाता है)।', 'Pin $1 par $2 Hz ka sur bajata hai (buzzer gaata hai).')],
  [/\bnoTone\(/, t3('Stops the note.', 'सुर रोकता है।', 'Sur rokta hai.')],
  [/\bmap\(\s*(\w+)/, t3('Changes the range of $1 into a new range (e.g. 0–1023 into 0–180).', '$1 की सीमा को नई सीमा में बदलता है (जैसे 0–1023 से 0–180)।', '$1 ki range ko nayi range me badalta hai (jaise 0–1023 se 0–180).')],
  [/\bmillis\(\)/, t3('millis() is the time since the board started, in ms: a clock that never stops the program.', 'millis() बोर्ड चालू होने के बाद का समय (ms) है: ऐसी घड़ी जो प्रोग्राम को नहीं रोकती।', 'millis() board chalu hone ke baad ka time (ms) hai: aisi ghadi jo program ko nahi rokti.')],
  [/pulseIn\(/, t3('Measures how long the echo pulse lasts: the sound\'s travel time.', 'गूँज की पल्स कितनी देर रहती है, मापता है: आवाज़ के आने-जाने का समय।', 'Echo pulse kitni der rehti hai, maapta hai: awaaz ke aane-jaane ka time.')],
  [/^\s*(?:\}\s*)?else if\b|^\s*elif\b/, t3('Otherwise, if this other condition is true…', 'नहीं तो, अगर यह दूसरी शर्त सही है…', 'Nahi to, agar ye doosri shart sahi hai…')],
  [/^\s*if\s*\(?(.+?)\)?\s*[{:]?\s*$/, t3('A decision: the next lines run only if $1 is true.', 'एक फ़ैसला: अगली पंक्तियाँ तभी चलती हैं जब $1 सही हो।', 'Ek faisla: agli lines tabhi chalti hain jab $1 sahi ho.')],
  [/^\s*(?:\}\s*)?else\b/, t3('Otherwise (when the condition is false) these lines run.', 'नहीं तो (शर्त ग़लत होने पर) ये पंक्तियाँ चलती हैं।', 'Nahi to (shart galat hone par) ye lines chalti hain.')],
  [/^\s*for\s*\(/, t3('A loop: repeats the lines inside a set number of times.', 'एक लूप: अंदर की पंक्तियों को तय बार दोहराता है।', 'Ek loop: andar ki lines ko tay baar dohrata hai.')],
  [/^\s*for\s+\w+\s+in\b/, t3('A loop: repeats the lines inside for each item.', 'एक लूप: हर चीज़ के लिए अंदर की पंक्तियाँ दोहराता है।', 'Ek loop: har cheez ke liye andar ki lines dohrata hai.')],
  [/^\s*while\b/, t3('Repeats the lines inside while the condition stays true.', 'जब तक शर्त सही है, अंदर की पंक्तियाँ दोहराता है।', 'Jab tak shart sahi hai, andar ki lines dohrata hai.')],
  [/^\s*def\s+(\w+)/, t3('Your own function $1(): a named group of steps.', 'आपका अपना फ़ंक्शन $1(): क़दमों का नाम वाला समूह।', 'Aapka apna function $1(): steps ka naam wala group.')],
  [/(\w+)\s*=\s*(?:machine\.)?Pin\(\s*(\w+)\s*,\s*Pin\.OUT/, t3('$1 is pin $2, set as an output.', '$1 पिन $2 है, आउटपुट के रूप में।', '$1 pin $2 hai, output ki tarah.')],
  [/(\w+)\s*=\s*(?:machine\.)?Pin\(\s*(\w+)\s*,\s*Pin\.IN/, t3('$1 is pin $2, set as an input.', '$1 पिन $2 है, इनपुट के रूप में।', '$1 pin $2 hai, input ki tarah.')],
  [/(\w+)\s*=\s*(LED|Button|MotionSensor|Buzzer|DistanceSensor|AngularServo|Servo|PWMLED|Motor)\(\s*([^)]*)\)/, t3('$1 is a $2 on $3 (gpiozero makes the part easy to use).', '$1, $3 पर लगा एक $2 है (gpiozero पुर्ज़े को आसान बनाता है)।', '$1, $3 par laga ek $2 hai (gpiozero part ko aasan banata hai).')],
  [/\.(on|off|toggle|value)\(\)/, t3('Switches it: $1.', 'इसे बदलता है: $1।', 'Ise badalta hai: $1.')],
  [/\.read_u16\(\)/, t3('Reads the voltage as a number from 0 to 65535 (the Pico\'s ADC).', 'वोल्टेज को 0 से 65535 की संख्या में पढ़ता है (Pico का ADC)।', 'Voltage ko 0 se 65535 ke number me padhta hai (Pico ka ADC).')],
  [/display\.(show|scroll)\(/, t3('Shows a picture or text on the micro:bit\'s LEDs.', 'micro:bit की LED पर चित्र या शब्द दिखाता है।', 'micro:bit ki LED par picture ya text dikhata hai.')],
  [/button_([ab])\.(is|was)_pressed\(\)/, t3('Checks button $1 on the micro:bit.', 'micro:bit का बटन $1 जाँचता है।', 'micro:bit ka button $1 check karta hai.')],
  [/lcd\.(print|setCursor|clear|init|backlight)\(/, t3('Writes on the LCD screen ($1).', 'LCD स्क्रीन पर लिखता है ($1)।', 'LCD screen par likhta hai ($1).')],
];
export function explain(line) {
  const t = line.trim(); if (!t || t === '}' || t === '{' || /^(\/\/|#(?!include))/.test(t)) return '';
  for (const [re, e] of X) { const m = re.exec(line); if (m) return tx(e).replace(/\$(\d)/g, (_, k) => (m[+k] !== undefined ? m[+k].trim() : '')); }
  return '';
}
// ------------------------------------------------------------ 🎓 the ideas, and a quiz
const IDEAS = [
  { t: (c) => /digitalWrite|\.on\(\)|Pin\.OUT/.test(c), n: t3('Digital output: HIGH and LOW', 'डिजिटल आउटपुट: HIGH और LOW', 'Digital output: HIGH aur LOW'), d: t3('A pin is a switch the program flips: HIGH = 5 V (on), LOW = 0 V (off).', 'पिन एक स्विच है जिसे प्रोग्राम बदलता है: HIGH = 5 V (चालू), LOW = 0 V (बंद)।', 'Pin ek switch hai jise program badalta hai: HIGH = 5 V (on), LOW = 0 V (off).'),
    q: [t3('digitalWrite(13, HIGH) puts how many volts on pin 13 of an Uno?', 'Uno के पिन 13 पर digitalWrite(13, HIGH) कितने वोल्ट देता है?', 'Uno ke pin 13 par digitalWrite(13, HIGH) kitne volt deta hai?'), ['5 V', '0 V', '13 V'], 0] },
  { t: (c, L) => /resistor/.test(JSON.stringify(L.steps || []) + JSON.stringify(L.setup || {})) && /led/.test(JSON.stringify(L.steps || []) + JSON.stringify(L.setup || {})), n: t3('Why an LED needs a resistor', 'LED को रेज़िस्टर क्यों चाहिए', 'LED ko resistor kyun chahiye'), d: t3('The resistor limits the current (Ohm\'s law: I = V ÷ R). Without it the LED takes too much and burns.', 'रेज़िस्टर करंट सीमित करता है (ओम का नियम: I = V ÷ R)। इसके बिना LED बहुत करंट लेकर जल जाती है।', 'Resistor current limit karta hai (Ohm ka niyam: I = V ÷ R). Iske bina LED zyada current lekar jal jaati hai.'),
    q: [t3('What happens to an LED wired to 5 V with no resistor?', 'बिना रेज़िस्टर 5 V से जुड़ी LED का क्या होता है?', 'Bina resistor 5 V se judi LED ka kya hota hai?'), [t3('It burns out', 'वह जल जाती है', 'Wo jal jaati hai'), t3('It glows dimmer', 'वह धीमी जलती है', 'Wo dheemi jalti hai'), t3('Nothing changes', 'कुछ नहीं बदलता', 'Kuch nahi badalta')], 0] },
  { t: (c) => /delay\(|sleep/.test(c), n: t3('Timing with delay', 'delay से समय', 'delay se timing'), d: t3('The board does nothing during a delay; 1000 ms is one second.', 'delay के दौरान बोर्ड कुछ नहीं करता; 1000 ms एक सेकंड है।', 'delay ke dauran board kuch nahi karta; 1000 ms ek second hai.'),
    q: [t3('How long is delay(500)?', 'delay(500) कितना होता है?', 'delay(500) kitna hota hai?'), [t3('Half a second', 'आधा सेकंड', 'Aadha second'), t3('500 seconds', '500 सेकंड', '500 second'), t3('5 seconds', '5 सेकंड', '5 second')], 0] },
  { t: (c) => /digitalRead|is_pressed|Button\(|INPUT/.test(c), n: t3('Digital input: reading a button or sensor', 'डिजिटल इनपुट: बटन या सेंसर पढ़ना', 'Digital input: button ya sensor padhna'), d: t3('An input pin reads 1 or 0; with INPUT_PULLUP a pressed button reads LOW.', 'इनपुट पिन 1 या 0 पढ़ता है; INPUT_PULLUP में दबा बटन LOW पढ़ता है।', 'Input pin 1 ya 0 padhta hai; INPUT_PULLUP me daba button LOW padhta hai.'),
    q: [t3('With INPUT_PULLUP, what does a pressed button read?', 'INPUT_PULLUP में दबा हुआ बटन क्या पढ़ता है?', 'INPUT_PULLUP me daba button kya padhta hai?'), ['LOW', 'HIGH', '1023'], 0] },
  { t: (c) => /analogRead|read_u16|read_analog|\.value\b/.test(c), n: t3('Analog input: a number for a voltage', 'एनालॉग इनपुट: वोल्टेज की संख्या', 'Analog input: voltage ka number'), d: t3('An analog pin turns 0–5 V into 0–1023 (Uno), so a sensor gives a smooth number, not just on/off.', 'एनालॉग पिन 0–5 V को 0–1023 (Uno) में बदलता है, इसलिए सेंसर पूरी संख्या देता है, सिर्फ़ चालू/बंद नहीं।', 'Analog pin 0–5 V ko 0–1023 (Uno) me badalta hai, isliye sensor poora number deta hai, sirf on/off nahi.'),
    q: [t3('analogRead() on an Uno gives a number from…', 'Uno पर analogRead() किस सीमा में संख्या देता है?', 'Uno par analogRead() kis range me number deta hai?'), ['0 – 1023', '0 – 255', '0 – 5'], 0] },
  { t: (c) => /analogWrite|PWM|write_analog|duty/.test(c), n: t3('PWM: brightness and speed', 'PWM: चमक और रफ़्तार', 'PWM: chamak aur speed'), d: t3('PWM switches a pin very fast; the share of "on" time (0–255) sets brightness or motor speed.', 'PWM पिन को बहुत तेज़ी से चालू-बंद करता है; "चालू" समय का हिस्सा (0–255) चमक या मोटर की रफ़्तार तय करता है।', 'PWM pin ko bahut tez on-off karta hai; "on" time ka hissa (0–255) chamak ya motor ki speed tay karta hai.'),
    q: [t3('analogWrite(9, 255) is…', 'analogWrite(9, 255) का अर्थ…', 'analogWrite(9, 255) ka matlab…'), [t3('fully on', 'पूरा चालू', 'poora on'), t3('half on', 'आधा चालू', 'aadha on'), t3('off', 'बंद', 'off')], 0] },
  { t: (c) => /Servo|servo|\.angle/.test(c), n: t3('Servo angles', 'सर्वो के कोण', 'Servo ke angle'), d: t3('A servo turns to the angle you write (0°–180°) and holds it.', 'सर्वो आपके लिखे कोण (0°–180°) पर घूमकर रुकता है।', 'Servo aapke likhe angle (0°–180°) par ghoomkar rukta hai.'),
    q: [t3('A hobby servo SG90 can turn about…', 'SG90 सर्वो लगभग कितना घूम सकता है?', 'SG90 servo lagbhag kitna ghoom sakta hai?'), ['0° – 180°', '0° – 360° again and again', '0° – 45°'], 0] },
  { t: (c) => /Serial\.|print\(/.test(c), n: t3('Talking to the computer (Serial)', 'कंप्यूटर से बात (Serial)', 'Computer se baat (Serial)'), d: t3('The board sends numbers and words to the Serial Monitor; both sides must use the same baud rate.', 'बोर्ड Serial Monitor पर संख्या और शब्द भेजता है; दोनों तरफ़ बॉड रेट एक होना चाहिए।', 'Board Serial Monitor par number aur words bhejta hai; dono taraf baud rate same hona chahiye.'),
    q: [t3('The text on the Serial Monitor is rubbish. Most likely…', 'Serial Monitor पर बेकार अक्षर आ रहे हैं। सबसे संभावित कारण…', 'Serial Monitor par bekaar akshar aa rahe hain. Sabse sambhavit kaaran…'), [t3('the baud rate does not match', 'बॉड रेट मेल नहीं खाता', 'baud rate match nahi karta'), t3('the LED is reversed', 'LED उल्टी है', 'LED ulti hai'), t3('the USB is too long', 'USB बहुत लंबा है', 'USB bahut lamba hai')], 0] },
  { t: (c) => /\bif\b/.test(c), n: t3('Decisions with if / else', 'if / else से फ़ैसले', 'if / else se faisle'), d: t3('The program checks a condition and chooses what to do: the heart of every smart device.', 'प्रोग्राम शर्त जाँचकर चुनता है क्या करना है: हर स्मार्ट उपकरण का दिल।', 'Program shart check karke chunta hai kya karna hai: har smart device ka dil.'),
    q: [t3('In if (x > 500) { … }, the lines inside run when…', 'if (x > 500) { … } में अंदर की पंक्तियाँ कब चलती हैं?', 'if (x > 500) { … } me andar ki lines kab chalti hain?'), [t3('x is more than 500', 'x, 500 से ज़्यादा हो', 'x, 500 se zyada ho'), t3('always', 'हमेशा', 'hamesha'), t3('x is 500 or less', 'x, 500 या कम हो', 'x, 500 ya kam ho')], 0] },
  { t: (c) => /\bfor\b|\bwhile\b|repeat/.test(c), n: t3('Loops: repeating steps', 'लूप: क़दम दोहराना', 'Loop: steps dohrana'), d: t3('A loop repeats instructions, so you write them once.', 'लूप निर्देशों को दोहराता है, ताकि उन्हें एक ही बार लिखना पड़े।', 'Loop instructions ko dohrata hai, taki unhe ek hi baar likhna pade.'),
    q: [t3('for (int i = 0; i < 5; i++) repeats how many times?', 'for (int i = 0; i < 5; i++) कितनी बार दोहराता है?', 'for (int i = 0; i < 5; i++) kitni baar dohrata hai?'), ['5', '4', '6'], 0] },
  { t: (c) => /tone\(|music\.|Buzzer|buzzer/.test(c), n: t3('Sound: frequency makes the note', 'ध्वनि: आवृत्ति से सुर', 'Sound: frequency se sur'), d: t3('A buzzer vibrates at the frequency you give: more hertz = a higher note.', 'बज़र दी गई आवृत्ति पर कंपन करता है: ज़्यादा हर्ट्ज़ = ऊँचा सुर।', 'Buzzer di gayi frequency par vibrate karta hai: zyada hertz = ooncha sur.'),
    q: [t3('Which tone sounds higher?', 'कौन-सा सुर ऊँचा लगेगा?', 'Kaunsa sur ooncha lagega?'), ['tone(8, 880)', 'tone(8, 220)', t3('both the same', 'दोनों बराबर', 'dono barabar')], 0] },
  { t: (c) => /pulseIn|Distance|trig|echo/i.test(c), n: t3('Measuring distance with sound', 'ध्वनि से दूरी मापना', 'Awaaz se doori maapna'), d: t3('The ultrasonic sensor times an echo; distance = time × speed of sound ÷ 2.', 'अल्ट्रासोनिक सेंसर गूँज का समय मापता है; दूरी = समय × ध्वनि की गति ÷ 2।', 'Ultrasonic sensor echo ka time maapta hai; doori = time × awaaz ki speed ÷ 2.'),
    q: [t3('Why divide the echo time by 2?', 'गूँज के समय को 2 से क्यों भाग देते हैं?', 'Echo time ko 2 se kyun divide karte hain?'), [t3('The sound goes there and back', 'आवाज़ जाती और लौटती है', 'Awaaz jaati aur lautti hai'), t3('The sensor has 2 eyes', 'सेंसर की 2 आँखें हैं', 'Sensor ki 2 aankhen hain'), t3('To make it smaller', 'छोटा करने के लिए', 'Chhota karne ke liye')], 0] },
  { t: (c) => /millis\(\)|monotonic|ticks_ms/.test(c), n: t3('Timing without stopping: millis()', 'बिना रोके समय: millis()', 'Bina roke timing: millis()'), d: t3('Compare the clock with a saved time, so the board keeps reading sensors while it waits.', 'घड़ी की तुलना सहेजे समय से कीजिए, ताकि बोर्ड इंतज़ार में भी सेंसर पढ़ता रहे।', 'Ghadi ko saved time se compare kijiye, taki board wait me bhi sensor padhta rahe.'),
    q: [t3('Why use millis() instead of a long delay()?', 'लंबे delay() के बजाय millis() क्यों?', 'Lambe delay() ki jagah millis() kyun?'), [t3('The program keeps working while it waits', 'इंतज़ार में भी प्रोग्राम चलता रहता है', 'Wait me bhi program chalta rehta hai'), t3('It uses less power', 'कम बिजली लगती है', 'Kam bijli lagti hai'), t3('It is shorter to type', 'लिखने में छोटा है', 'Likhne me chhota hai')], 0] },
  { t: (c, L) => /relay/.test(JSON.stringify(L.setup || {}) + JSON.stringify(L.steps || [])), n: t3('A relay: a small signal switches a big load', 'रिले: छोटा संकेत, बड़ा भार', 'Relay: chhota signal, bada load'), d: t3('The board\'s 5 V signal moves a switch inside the relay that can turn a 230 V lamp or fan on and off safely.', 'बोर्ड का 5 V संकेत रिले के अंदर का स्विच हिलाता है, जो 230 V बल्ब या पंखा सुरक्षित चालू-बंद कर सकता है।', 'Board ka 5 V signal relay ke andar ka switch hilata hai, jo 230 V bulb ya pankha safely on-off kar sakta hai.'),
    q: [t3('Why not connect a 230 V fan straight to a board pin?', '230 V पंखे को सीधे बोर्ड के पिन से क्यों नहीं जोड़ते?', '230 V pankhe ko seedhe board ke pin se kyun nahi jodte?'), [t3('The pin gives only 5 V and a little current', 'पिन सिर्फ़ 5 V और थोड़ा करंट देता है', 'Pin sirf 5 V aur thoda current deta hai'), t3('Fans do not like code', 'पंखे को कोड पसंद नहीं', 'Pankhe ko code pasand nahi'), t3('It would be too fast', 'वह बहुत तेज़ हो जाएगा', 'Wo bahut tez ho jayega')], 0] },
  { t: (c, L) => /\b(ai|camera|yolo|classif|learn|gesture)\b/i.test(c + ' ' + (L.title.en || '')), n: t3('Machine learning: learning from examples', 'मशीन लर्निंग: उदाहरणों से सीखना', 'Machine learning: examples se seekhna'), d: t3('A model learns patterns from many labelled examples, then guesses the label of something new, with a confidence.', 'मॉडल बहुत से लेबल वाले उदाहरणों से पैटर्न सीखता है, फिर नई चीज़ का लेबल भरोसे के साथ अनुमान लगाता है।', 'Model bahut se labelled examples se pattern seekhta hai, phir nayi cheez ka label bharose ke saath guess karta hai.'),
    q: [t3('A model trained only on red apples sees a green apple. It may…', 'सिर्फ़ लाल सेबों पर सिखाया मॉडल हरा सेब देखता है। वह…', 'Sirf laal sebon par sikhaya model hara seb dekhta hai. Wo…'), [t3('get it wrong: it never saw one', 'ग़लत बता सकता है: उसने कभी देखा ही नहीं', 'galat bata sakta hai: usne kabhi dekha hi nahi'), t3('always be right', 'हमेशा सही होगा', 'hamesha sahi hoga'), t3('turn the apple red', 'सेब को लाल कर देगा', 'seb ko laal kar dega')], 0] },
  { t: (c, L) => L.group === 'circuits', n: t3('A closed circuit', 'बंद परिपथ', 'Band circuit'), d: t3('Current flows only in a complete loop from + through the part back to −. A switch opens or closes the loop.', 'करंट सिर्फ़ पूरे घेरे में बहता है: + से पुर्ज़े से होकर − तक। स्विच घेरा खोलता या बंद करता है।', 'Current sirf poore ghere me behta hai: + se part se hokar − tak. Switch ghera kholta ya band karta hai.'),
    q: [t3('The bulb is off when the switch is open because…', 'स्विच खुला हो तो बल्ब बंद रहता है क्योंकि…', 'Switch khula ho to bulb band rehta hai kyunki…'), [t3('the loop is broken', 'घेरा टूटा हुआ है', 'ghera toota hua hai'), t3('the battery is full', 'बैटरी भरी है', 'battery bhari hai'), t3('the wire is red', 'तार लाल है', 'taar laal hai')], 0] },
];
export function ideasOf(L) { const c = finalCode(L); return IDEAS.filter((i) => { try { return i.t(c, L); } catch (e) { return false; } }); }

// ------------------------------------------------------------ the sheet
export function openCard(app, tab = 'need') {
  const L = app.rt.lesson; if (!L) return;
  const tabs = ['need', 'conn', 'code', 'learn'];
  const body = () => {
    if (tab === 'need') { const B = bom(L); return `<p class="mute"><b>${esc(tx(S.goal))}:</b> ${esc(tx(L.goal))}</p><table><tr><th>${esc(tx(S.item))}</th><th>${esc(tx(S.qty))}</th><th>${esc(tx(S.why))}</th></tr>${B.map((b) => `<tr><td>${b.img && app.thumbs && app.thumbs[b.img === 'led' ? 'led_red' : b.img] ? `<img src="${app.thumbs[b.img === 'led' ? 'led_red' : b.img]}" style="width:46px;height:34px;object-fit:contain;vertical-align:middle;margin-right:6px">` : ''}<b>${esc(b.name)}</b></td><td style="font-size:17px;font-weight:700;text-align:center">${b.n}</td><td class="mute">${esc(b.why)}</td></tr>`).join('')}</table><p class="mute">⚠ ${esc(tx(S.safety))}</p>`; }
    if (tab === 'conn') { const C = connections(L); return `<table>${C.map((c, i) => `<tr><td style="width:34px;color:#7fd1ff;font-weight:700">${i + 1}</td><td>${esc(c.text)}${c.tip ? `<div class="mute">${esc(c.tip)}</div>` : ''}</td><td class="${c.done ? 'ok' : ''}" style="white-space:nowrap;font-size:12px">${esc(tx(c.done ? S.ready : S.you))}</td></tr>`).join('')}</table>`; }
    if (tab === 'code') { const code = finalCode(L); if (!code.trim() || L.group === 'circuits') return `<p class="mute">${esc(tx(S.noCode))}</p>`;
      return `<table style="font-size:13px">${code.split('\n').map((ln, i) => { const e = explain(ln); const com = /^\s*(\/\/|#(?!include))/.test(ln); return ln.trim() ? `<tr><td class="mute" style="width:30px;text-align:right;font-family:var(--mono,monospace)">${i + 1}</td><td style="font-family:var(--mono,monospace);white-space:pre-wrap;color:${com ? '#6f7a8c' : '#d8dee8'}">${esc(ln)}</td><td style="color:#9fd17a">${esc(e)}</td></tr>` : ''; }).join('')}</table>`; }
    const I = ideasOf(L); const qs = I.filter((i) => i.q).slice(0, 3);
    return `<p class="mute"><b>${esc(tx(S.goal))}:</b> ${esc(tx(L.goal))}</p>${I.map((i) => `<div class="card"><b>💡 ${esc(tx(i.n))}</b><p style="margin:4px 0 0">${esc(tx(i.d))}</p></div>`).join('')}
      ${qs.length ? `<h3>${esc(tx(S.quiz))}</h3>${qs.map((i, k) => `<div class="card" data-q="${k}"><b>${k + 1}. ${esc(tx(i.q[0]))}</b><div class="row">${shuffle(i.q[1].map((o, j) => [o, j]), k + L.n).map(([o, j]) => `<button class="btn sm" data-a="${j}">${esc(tx(o))}</button>`).join('')}</div><div class="mute" data-r></div></div>`).join('')}<p id="pc-sc" class="stars"></p>` : ''}`;
  };
  const html = () => `<h2>📋 ${esc(tx(L.title))}</h2><div class="row">${tabs.map((k) => `<button class="btn${k === tab ? ' pri' : ''}" data-tab="${k}">${esc(tx(S[k]))}</button>`).join('')}</div><div id="pc-b">${body()}</div>`;
  const box = sheet(html(), { wide: true });
  const bind = () => {
    for (const b of box.querySelectorAll('[data-tab]')) b.onclick = () => { tab = b.dataset.tab; box.querySelector('#pc-b').innerHTML = body(); for (const x of box.querySelectorAll('[data-tab]')) x.className = 'btn' + (x.dataset.tab === tab ? ' pri' : ''); bindQ(); };
    bindQ();
  };
  const bindQ = () => { let right = 0, answered = 0; const qs = ideasOf(L).filter((i) => i.q).slice(0, 3);
    for (const c of box.querySelectorAll('[data-q]')) { const q = qs[+c.dataset.q]; for (const b of c.querySelectorAll('[data-a]')) b.onclick = () => { if (c.dataset.done) return; c.dataset.done = 1; answered++; const good = +b.dataset.a === q.q[2]; if (good) right++; b.classList.add(good ? 'go' : 'pri'); c.querySelector('[data-r]').textContent = good ? tx(S.right) : tx(S.wrong) + tx(q.d); const sc = box.querySelector('#pc-sc'); if (answered === qs.length && sc) { sc.textContent = tx(S.all, { n: right, m: qs.length }) + ' ' + '★'.repeat(right); if (app.school && app.school.quiz) app.school.quiz(L.id, right, qs.length); } }; } };
  bind();
}
function shuffle(a, seed) { const r = a.slice(); let s = seed * 9301 + 49297; for (let i = r.length - 1; i > 0; i--) { s = (s * 9301 + 49297) % 233280; const j = Math.floor(s / 233280 * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; }

// ------------------------------------------------------------ in the lab: a button on the step card
export function installCard(app) {
  const bar = document.querySelector('#c-b'); if (!bar) return;
  const b = document.createElement('button'); b.className = 'btn'; b.id = 'b-card'; b.onclick = () => openCard(app, app.rt.i === 0 ? 'need' : app.rt.step && app.rt.step.k === 'wire' ? 'conn' : app.rt.step && (app.rt.step.k === 'edit' || app.rt.step.k === 'run') ? 'code' : app.rt.complete ? 'learn' : 'need');
  bar.insertBefore(b, bar.querySelector('#b-check'));
  const W = (name, f) => { const o = app[name].bind(app); app[name] = (...a) => f(o, ...a); };
  W('renderCard', (o) => { o(); b.textContent = tx(S.btn); b.title = tx(S.open); b.classList.toggle('pulse', !!app.rt.lesson && app.rt.i === 0); });
  app.projectCard = (tab) => openCard(app, tab);
}
export { BY_ID };
