// DUET Robotics Lab 360, batch 20: data on the Raspberry Pi 4 (Class 10), written fresh for DUET. pi20.js gives the Pi's
// Python its SD card (open, with, csv, os), statistics and matplotlib; app6.js shows the files under the terminal and the
// figure in a window (and on the Pi's little screen):
//   pi_csvlog   a weather logger: a DHT11 row every 2 s into weather.csv (csv.writer, mode "a", a header row once).
//               Run it twice and the file grows; open it with "w" and the old rows are wiped (and the header is lost).
//   pi_plot     a graph with matplotlib of three school days (sample data on the card): numbers read from a CSV are text
//               until float(): plotted as text they come out as categories in a jumbled order
//   pi_predict  tomorrow's top temperature from two weeks of them: a straight line through the points
//               (statistics.linear_regression), and why the same line is nonsense 90 days ahead
// devtools/test/robocore20.mjs plays every one.
const t3 = (en, hi, hg) => ({ en, hi, hg });

// ------------------------------------------------------------------ sample data on the card (made here, the same each time)
function rnd(seed) { let s = seed >>> 0; return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const r1 = (v) => (Math.round(v * 10) / 10).toFixed(1);
export const SCHOOL_CSV = (() => { // three days of hourly readings on a school roof in November: cool nights, warm afternoons
  const r = rnd(20261117); const out = ['hour,temp_C,humidity'];
  for (let h = 0; h < 72; h++) { const d = Math.floor(h / 24), hh = h % 24; const base = 19 + d * 0.6 + 6.5 * Math.sin((hh - 9) / 24 * 2 * Math.PI); const t = base + (r() - 0.5) * 0.8; const hu = Math.round(Math.min(92, Math.max(30, 88 - (t - 13) * 3.2 + (r() - 0.5) * 4))); out.push(`${h},${r1(t)},${hu}`); }
  return out.join('\r\n') + '\r\n';
})();
export const DAILY_CSV = (() => { // two weeks of each day's highest temperature as spring warms up (February into March)
  const r = rnd(20260301); const out = ['day,max_C'];
  for (let d = 1; d <= 14; d++) out.push(`${d},${r1(24.2 + d * 0.45 + (r() - 0.5) * 1.6)}`);
  return out.join('\r\n') + '\r\n';
})();

export const PI_LOG = `# Weather logger: every 2 seconds the time, the temperature and the humidity
# go into a CSV file on the Pi's card (a spreadsheet can open it).
import adafruit_dht
import board
import csv
import os
from time import sleep, strftime

dht = adafruit_dht.DHT11(board.D4)
FILE = "weather.csv"
new = not os.path.exists(FILE)          # a new file needs a header row first

with open(FILE, "a") as f:              # "a": add to the end of the file
    w = csv.writer(f)
    if new:
        w.writerow(["time", "temp_C", "humidity"])
    for i in range(10):
        try:
            t = dht.temperature
            h = dht.humidity
            w.writerow([strftime("%H:%M:%S"), t, h])
            print(strftime("%H:%M:%S"), t, "C", h, "%")
        except RuntimeError as e:
            print("Reading failed:", e)
        sleep(2)
print("Saved in", FILE)
`;
export const PI_PLOT = `# A graph of three school days: the temperature every hour, from a CSV file
import csv
import matplotlib.pyplot as plt

hours = []
temps = []
with open("school_weather.csv") as f:
    r = csv.reader(f)
    next(r)                         # skip the header row
    for row in r:
        hours.append(int(row[0]))
        temps.append(float(row[1]))   # the file is text: make it a number

print(len(temps), "readings, from", min(temps), "to", max(temps), "C")
plt.plot(hours, temps, color="red", label="temperature")
plt.title("School roof, 3 days in November")
plt.xlabel("hour")
plt.ylabel("temperature (C)")
plt.grid(True)
plt.legend()
plt.savefig("temps.png")
plt.show()
`;
export const PI_PREDICT = `# Predict tomorrow's top temperature: a straight line through two weeks of them
import csv
import statistics
import matplotlib.pyplot as plt

days = []
maxes = []
with open("daily_max.csv") as f:
    r = csv.reader(f)
    next(r)
    for row in r:
        days.append(int(row[0]))
        maxes.append(float(row[1]))

fit = statistics.linear_regression(days, maxes)
print("Each day about", round(fit.slope, 2), "C warmer")
ahead = 1                                    # how many days after the last one
day = days[-1] + ahead
guess = fit.slope * day + fit.intercept
print("Day", day, "should reach about", round(guess, 1), "C")

line = [fit.slope * d + fit.intercept for d in days + [day]]
plt.scatter(days, maxes, label="measured")
plt.plot(days + [day], line, "--", label="straight line")
plt.scatter([day], [guess], color="red", label="prediction")
plt.title("Highest temperature each day")
plt.xlabel("day")
plt.ylabel("max temperature (C)")
plt.legend()
plt.show()
`;

export function batch20(K, n0) {
  const { P } = K;
  const E = t3('', '', '');
  const run = (see) => ({ k: 'run', do: t3('Press Run.', '"चलाइए" दबाइए।', 'Run dabaiye.'), see: see || E });
  const X = {
    toPin: t3('The {x} must be joined to {p}.', '{x} को {p} से जोड़िए।', '{x} ko {p} se jodiye.'),
    missing: t3('The {x} is not on the breadboard yet.', '{x} अभी ब्रेडबोर्ड पर नहीं है।', '{x} abhi breadboard par nahi hai.'),
  };
  const need = (a, b, x, p) => (S) => (S.conn(a, b) ? null : [X.toPin, { x, p }]);
  const file = (S, n) => (S.lab.fs6 && S.lab.fs6.get(n)) || null;
  const rows = (S, n) => { const t = file(S, n); return t === null ? null : t.split(/\r?\n/).filter((x) => x.length); };
  const dataRows = (S, n) => { const r = rows(S, n); return r ? r.filter((x) => /^\d\d:\d\d:\d\d,/.test(x)) : []; };
  const fig = (S) => S.lab.mcu && S.lab.mcu.fig6;
  const shown = (S) => !!(S.lab.mcu && S.lab.mcu.plt6 && S.lab.mcu.plt6.shown.length);
  const ended = (S) => S.runSrc !== null && S.lab.mcu.state === 'done';
  const outLines = (S) => (S.serLines || []).join('\n');
  const modeOf = (src) => { const m = /open\(FILE,\s*"(\w)"\)/.exec(src || ''); return m ? m[1] : null; };
  let n = n0;
  const L = [];

  // 1 ----------------------------------------------------------------------------------------------------- CSV logger
  L.push({ id: 'pi_csvlog', board: 'pi4', cls: '10', view: 'pi6', wview: 'pi6w', code: PI_LOG, drawer: ['dht11'], serial: true,
    title: t3('Weather logger to a CSV file', 'CSV फ़ाइल में मौसम का लॉग', 'CSV file mein mausam ka log'),
    goal: t3('A Raspberry Pi writes a reading every 2 seconds into a CSV file on its card, the way a weather station keeps its record: rows of comma-separated values that any spreadsheet opens. Then the mistake that wipes a whole day of data.', 'एक Raspberry Pi हर 2 सेकंड में एक रीडिंग अपने कार्ड पर एक CSV फ़ाइल में लिखता है, जैसे मौसम स्टेशन अपना रिकॉर्ड रखता है: कॉमा से अलग मानों की पंक्तियाँ, जिन्हें कोई भी स्प्रेडशीट खोल लेती है। फिर वह ग़लती जो पूरे दिन का डेटा मिटा देती है।', 'Ek Raspberry Pi har 2 second mein ek reading apne card par ek CSV file mein likhta hai, jaise mausam station apna record rakhta hai: comma se alag values ki rows, jinhe koi bhi spreadsheet khol leti hai. Phir woh galti jo poore din ka data mita deti hai.'),
    setup: { parts: [P('th1', 'dht11', {}, 'e40', 0)], wires: [['H:a40', 'B:GPIO4'], ['H:a41', 'B:3V3'], ['H:a42', 'B:GND1']] },
    steps: [
      { k: 'info', code: [12, 13, 14, 15, 16], do: t3('The DHT11 is on GPIO 4, as in the weather station. New here: with open(FILE, "a") as f: opens weather.csv on the Pi\'s card to add to its end, and csv.writer(f).writerow([…]) writes one row: the values with commas between them.', 'DHT11, GPIO 4 पर है, मौसम स्टेशन की तरह। यहाँ नया: with open(FILE, "a") as f: Pi के कार्ड पर weather.csv को आख़िर में जोड़ने के लिए खोलता है, और csv.writer(f).writerow([…]) एक पंक्ति लिखता है: मान, बीच में कॉमा के साथ।', 'DHT11, GPIO 4 par hai, mausam station ki tarah. Yahan naya: with open(FILE, "a") as f: Pi ke card par weather.csv ko aakhir mein jodne ke liye kholta hai, aur csv.writer(f).writerow([…]) ek row likhta hai: values, beech mein comma ke saath.'),
        see: t3('"with" closes the file by itself when the block ends, even if something goes wrong, so no row is lost.', '"with" ब्लॉक ख़त्म होते ही फ़ाइल अपने-आप बंद कर देता है, कुछ गड़बड़ हो तब भी, तो कोई पंक्ति नहीं खोती।', '"with" block khatam hote hi file apne aap band kar deta hai, kuch gadbad ho tab bhi, to koi row nahi khoti.') },
      run(t3('It logs 10 readings (20 seconds), then stops.', 'यह 10 रीडिंग लॉग करता है (20 सेकंड), फिर रुक जाता है।', 'Yeh 10 reading log karta hai (20 second), phir ruk jaata hai.')),
      { k: 'act', until: (S) => ended(S) && dataRows(S, 'weather.csv').some((x) => +x.split(',')[1] >= 33), do: t3('While it logs, warm the sensor: tap it and slide the temperature to 36 °C. Wait for "Saved in weather.csv".', 'जब यह लॉग कर रहा हो, सेंसर को गर्म कीजिए: उसे छूइए और तापमान 36 °C तक सरकाइए। "Saved in weather.csv" का इंतज़ार कीजिए।', 'Jab yeh log kar raha ho, sensor ko garam kijiye: use touch karo aur temperature 36 °C tak sarkaiye. "Saved in weather.csv" ka intezaar kijiye.'),
        see: t3('weather.csv appeared under the terminal. Tap it: a header row, then one row every 2 seconds, the warm-up in the middle. A failed reading wrote no row.', 'weather.csv टर्मिनल के नीचे आ गई। उसे छूइए: एक हेडर पंक्ति, फिर हर 2 सेकंड में एक पंक्ति, बीच में गर्म होना। जो रीडिंग फ़ेल हुई उसकी कोई पंक्ति नहीं लिखी गई।', 'weather.csv terminal ke neeche aa gayi. Use touch karo: ek header row, phir har 2 second mein ek row, beech mein garam hona. Jo reading fail hui uski koi row nahi likhi gayi.') },
      run(t3('Run it again: the same program, the same file.', 'इसे फिर चलाइए: वही प्रोग्राम, वही फ़ाइल।', 'Ise phir chalaiye: wahi program, wahi file.')),
      { k: 'watch', until: (S) => ended(S) && dataRows(S, 'weather.csv').length >= 14 && rows(S, 'weather.csv').filter((x) => /^time,/.test(x)).length === 1, do: t3('Watch weather.csv\'s number of lines.', 'weather.csv की पंक्तियों की गिनती देखिए।', 'weather.csv ki lines ki ginti dekhiye.'),
        see: t3('It grew: the new rows went on the end ("a"), and the header was written only once, because the file was already there.', 'यह बढ़ गई: नई पंक्तियाँ आख़िर में जुड़ीं ("a"), और हेडर एक ही बार लिखा गया, क्योंकि फ़ाइल पहले से थी।', 'Yeh badh gayi: nayi rows aakhir mein judi ("a"), aur header ek hi baar likha gaya, kyonki file pehle se thi.') },
      { k: 'edit', test: (src) => modeOf(src) === 'w', set: [[/open\(FILE, "a"\)/, 'open(FILE, "w")']], do: t3('A classmate writes "w" (for write). Change open(FILE, "a") to open(FILE, "w") and Run.', 'एक सहपाठी "w" (write के लिए) लिखता है। open(FILE, "a") को open(FILE, "w") कीजिए और "चलाइए"।', 'Ek classmate "w" (write ke liye) likhta hai. open(FILE, "a") ko open(FILE, "w") karo aur Run.'), see: E },
      { k: 'watch', until: (S) => ended(S) && modeOf(S.runSrc) === 'w' && dataRows(S, 'weather.csv').length <= 10, do: t3('Watch weather.csv again.', 'weather.csv फिर से देखिए।', 'weather.csv phir se dekhiye.'),
        see: t3('All the old rows are gone, and so is the header! "w" empties a file the moment it opens it. The header was skipped because the file existed. Real data loggers lose days of readings this way: append with "a".', 'सारी पुरानी पंक्तियाँ ग़ायब, और हेडर भी! "w" फ़ाइल खोलते ही उसे ख़ाली कर देता है। हेडर इसलिए छूटा क्योंकि फ़ाइल मौजूद थी। असली डेटा लॉगर ऐसे ही कई दिनों की रीडिंग खो देते हैं: जोड़ने के लिए "a"।', 'Saari purani rows gayab, aur header bhi! "w" file kholte hi use khaali kar deta hai. Header isliye chhoota kyonki file maujood thi. Asli data logger aise hi kai dinon ki reading kho dete hain: jodne ke liye "a".') },
      { k: 'edit', test: (src) => modeOf(src) === 'a' && /if new:/.test(src), set: [[/open\(FILE, "w"\)/, 'open(FILE, "a")']], do: t3('Put it back to "a" and Run once more.', 'इसे वापस "a" कीजिए और एक बार और "चलाइए"।', 'Ise wapas "a" karo aur ek baar aur Run.'), see: E },
      { k: 'watch', until: (S) => ended(S) && modeOf(S.runSrc) === 'a' && dataRows(S, 'weather.csv').length >= 14, do: t3('Watch the file grow again.', 'फ़ाइल को फिर बढ़ते देखिए।', 'File ko phir badhte dekhiye.'),
        see: t3('Growing again, but the header lost to "w" does not come back: the program writes it only for a new file. To start clean, delete the file (os.remove("weather.csv")). To start a fresh file each day, put the date in its name: f"weather_{strftime(\'%Y-%m-%d\')}.csv".', 'फिर से बढ़ रही है, पर "w" से खोया हेडर वापस नहीं आता: प्रोग्राम उसे सिर्फ़ नई फ़ाइल के लिए लिखता है। साफ़ शुरुआत के लिए फ़ाइल मिटाइए (os.remove("weather.csv"))। हर दिन नई फ़ाइल के लिए, नाम में तारीख़ रखिए: f"weather_{strftime(\'%Y-%m-%d\')}.csv"।', 'Phir se badh rahi hai, par "w" se khoya header wapas nahi aata: program use sirf nayi file ke liye likhta hai. Saaf shuruaat ke liye file mitaiye (os.remove("weather.csv")). Har din nayi file ke liye, naam mein date rakhiye: f"weather_{strftime(\'%Y-%m-%d\')}.csv".') },
    ],
    check: [need('th1.DATA', 'GPIO4', t3('DHT11\'s DATA', 'DHT11 का DATA', 'DHT11 ka DATA'), 'GPIO 4')],
    done: (S) => modeOf(S.runSrc) === 'a' && dataRows(S, 'weather.csv').length >= 14 });

  // 2 -------------------------------------------------------------------------------------------------- matplotlib
  L.push({ id: 'pi_plot', board: 'pi4', cls: '10', view: 'pi6', wview: 'pi6w', code: PI_PLOT, drawer: [], serial: true, files: { 'school_weather.csv': SCHOOL_CSV },
    title: t3('Plot sensor data with matplotlib', 'matplotlib से सेंसर डेटा का ग्राफ़', 'matplotlib se sensor data ka graph'),
    goal: t3('Turn a file of numbers into a picture: matplotlib draws three days of temperatures from a school roof (sample data on the Pi\'s card). A graph shows in a second what 72 rows of numbers hide: the cool nights, the warm afternoons, a slow warming.', 'संख्याओं की फ़ाइल को चित्र में बदलिए: matplotlib एक स्कूल की छत के तीन दिनों के तापमान बनाता है (Pi के कार्ड पर नमूना डेटा)। ग्राफ़ एक पल में वह दिखा देता है जो संख्याओं की 72 पंक्तियाँ छिपाती हैं: ठंडी रातें, गर्म दोपहर, धीरे-धीरे बढ़ती गर्मी।', 'Numbers ki file ko chitra mein badaliye: matplotlib ek school ki chhat ke teen dinon ke temperature banata hai (Pi ke card par sample data). Graph ek pal mein woh dikha deta hai jo numbers ki 72 rows chhupati hain: thandi raatein, garam dopahar, dheere dheere badhti garmi.'),
    setup: { parts: [], wires: [] },
    steps: [
      { k: 'info', do: t3('No circuit today: the data is already on the card. Tap school_weather.csv under the terminal: hour, temperature, humidity, one row an hour for 72 hours.', 'आज कोई सर्किट नहीं: डेटा पहले से कार्ड पर है। टर्मिनल के नीचे school_weather.csv छूइए: घंटा, तापमान, नमी, 72 घंटों तक हर घंटे एक पंक्ति।', 'Aaj koi circuit nahi: data pehle se card par hai. Terminal ke neeche school_weather.csv touch karo: ghanta, temperature, nami, 72 ghanton tak har ghante ek row.'), see: E },
      { k: 'info', code: [9, 10, 11, 12, 15, 16, 21, 22], do: t3('csv.reader gives each row as a list of texts; next(r) skips the header. plt.plot(x, y) draws the line, title / xlabel / ylabel name it, savefig keeps a picture, show() opens the window.', 'csv.reader हर पंक्ति को टेक्स्ट की लिस्ट के रूप में देता है; next(r) हेडर छोड़ देता है। plt.plot(x, y) रेखा बनाता है, title / xlabel / ylabel नाम देते हैं, savefig तस्वीर रखता है, show() खिड़की खोलता है।', 'csv.reader har row ko text ki list ke roop mein deta hai; next(r) header chhod deta hai. plt.plot(x, y) rekha banata hai, title / xlabel / ylabel naam dete hain, savefig tasveer rakhta hai, show() khidki kholta hai.'), see: E },
      run(),
      { k: 'watch', until: (S) => shown(S) && fig(S) && fig(S).series[0].y.length === 72 && fig(S).series[0].y.every((v) => typeof v === 'number'), do: t3('Watch the window that opens (it is on the Pi\'s little screen too).', 'जो खिड़की खुलती है उसे देखिए (यह Pi की छोटी स्क्रीन पर भी है)।', 'Jo khidki khulti hai use dekhiye (yeh Pi ki chhoti screen par bhi hai).'),
        see: t3('Three waves: cool at dawn, warm after lunch. Each afternoon is a little warmer than the one before. temps.png is on the card now too.', 'तीन लहरें: सुबह ठंडा, दोपहर बाद गर्म। हर दोपहर पिछली से थोड़ी गर्म। temps.png भी अब कार्ड पर है।', 'Teen leharein: subah thanda, dopahar baad garam. Har dopahar pichhli se thodi garam. temps.png bhi ab card par hai.') },
      { k: 'edit', test: (src) => /temps\.append\(\s*row\[1\]\s*\)/.test(src), set: [[/temps\.append\(float\(row\[1\]\)\)/, 'temps.append(row[1])']], do: t3('What does float() do? Change temps.append(float(row[1])) to temps.append(row[1]) and Run.', 'float() क्या करता है? temps.append(float(row[1])) को temps.append(row[1]) कीजिए और "चलाइए"।', 'float() kya karta hai? temps.append(float(row[1])) ko temps.append(row[1]) karo aur Run.'), see: E },
      { k: 'watch', until: (S) => shown(S) && fig(S) && fig(S).series[0].y.some((v) => typeof v === 'string'), do: t3('Look at the graph, and at its temperature axis.', 'ग्राफ़ देखिए, और उसकी तापमान वाली धुरी।', 'Graph dekhiye, aur uski temperature wali axis.'),
        see: t3('Nonsense! A CSV file is text, so each temperature is the word "21.4", not a number. matplotlib puts words on the axis in the order they come, so 21.4 may sit above 25.0. And min() and max() compared them as words. Data must be turned into numbers before it is used.', 'बेतुका! CSV फ़ाइल टेक्स्ट है, तो हर तापमान "21.4" शब्द है, संख्या नहीं। matplotlib शब्दों को जिस क्रम में आते हैं उसी में धुरी पर रखता है, तो 21.4, 25.0 के ऊपर आ सकता है। और min() व max() ने उन्हें शब्दों की तरह तुलना किया। डेटा इस्तेमाल से पहले संख्या में बदलना होता है।', 'Betuka! CSV file text hai, to har temperature "21.4" shabd hai, number nahi. matplotlib shabdon ko jis kram mein aate hain usi mein axis par rakhta hai, to 21.4, 25.0 ke upar aa sakta hai. Aur min() va max() ne unhe shabdon ki tarah compare kiya. Data use se pehle number mein badalna hota hai.') },
      { k: 'edit', test: (src) => /temps\.append\(\s*float\(row\[1\]\)\s*\)/.test(src) && /humid/.test(src) && /plt\.plot\([^)]*hum/.test(src),
        set: [[/temps\.append\(row\[1\]\)/, 'temps.append(float(row[1]))'], [/temps = \[\]\n/, 'temps = []\nhumid = []\n'], [/(        temps\.append\(float\(row\[1\]\)\)[^\n]*\n)/, '$1        humid.append(int(row[2]))\n'], [/(plt\.plot\(hours, temps[^\n]*\n)/, '$1plt.plot(hours, humid, color="blue", label="humidity %")\n']],
        do: t3('Put float() back, and add the humidity: a list humid = [], humid.append(int(row[2])) in the loop, and a second line plt.plot(hours, humid, color="blue", label="humidity %"). Run.', 'float() वापस लगाइए, और नमी जोड़िए: एक लिस्ट humid = [], लूप में humid.append(int(row[2])), और दूसरी रेखा plt.plot(hours, humid, color="blue", label="humidity %")। "चलाइए"।', 'float() wapas lagaiye, aur nami jodiye: ek list humid = [], loop mein humid.append(int(row[2])), aur doosri rekha plt.plot(hours, humid, color="blue", label="humidity %"). Run.'), see: E },
      { k: 'watch', until: (S) => shown(S) && fig(S) && fig(S).series.length >= 2 && fig(S).series.every((s2) => s2.y.every((v) => typeof v === 'number')), do: t3('Compare the two lines.', 'दोनों रेखाओं की तुलना कीजिए।', 'Dono rekhaon ki tulna kijiye.'),
        see: t3('When the temperature rises, the humidity falls: warm air holds more water, so the same water is a smaller part of what it could hold. A graph makes such a link easy to see.', 'जब तापमान बढ़ता है, नमी घटती है: गर्म हवा ज़्यादा पानी रख सकती है, तो वही पानी उसकी क्षमता का छोटा हिस्सा रह जाता है। ग्राफ़ ऐसा रिश्ता आसानी से दिखा देता है।', 'Jab temperature badhta hai, nami ghatti hai: garam hawa zyada paani rakh sakti hai, to wahi paani uski kshamta ka chhota hissa reh jaata hai. Graph aisa rishta aasaani se dikha deta hai.') },
    ],
    check: [],
    done: (S) => { const f = fig(S); return !!f && shown(S) && f.series.length >= 2 && f.series.every((s2) => s2.y.every((v) => typeof v === 'number')); } });

  // 3 ----------------------------------------------------------------------------------------------------- prediction
  L.push({ id: 'pi_predict', board: 'pi4', cls: '10', view: 'pi6', wview: 'pi6w', code: PI_PREDICT, drawer: [], serial: true, files: { 'daily_max.csv': DAILY_CSV },
    title: t3('Predict tomorrow\'s temperature from logged data', 'लॉग किए डेटा से कल के तापमान का अनुमान', 'Log kiye data se kal ke temperature ka anumaan'),
    goal: t3('Two weeks of each day\'s highest temperature are on the card (sample data). Fit a straight line through them with statistics.linear_regression and use it to guess tomorrow: the simplest kind of machine learning. Then see how far you can trust it.', 'कार्ड पर दो हफ़्तों का हर दिन का सबसे ज़्यादा तापमान है (नमूना डेटा)। statistics.linear_regression से उनके बीच से एक सीधी रेखा निकालिए और उससे कल का अनुमान लगाइए: मशीन लर्निंग का सबसे आसान रूप। फिर देखिए उस पर कितना भरोसा किया जा सकता है।', 'Card par do hafton ka har din ka sabse zyada temperature hai (sample data). statistics.linear_regression se unke beech se ek seedhi rekha nikaliye aur usse kal ka anumaan lagaiye: machine learning ka sabse aasaan roop. Phir dekhiye us par kitna bharosa kiya ja sakta hai.'),
    setup: { parts: [], wires: [] },
    steps: [
      { k: 'info', code: [16, 17, 18, 19, 20, 21], do: t3('linear_regression(days, maxes) finds the straight line that runs closest to all 14 points: its slope (how much warmer each day) and intercept. Tomorrow\'s guess is slope × day + intercept.', 'linear_regression(days, maxes) वह सीधी रेखा ढूँढता है जो सभी 14 बिंदुओं के सबसे पास से गुज़रे: उसका slope (हर दिन कितना ज़्यादा गर्म) और intercept। कल का अनुमान है slope × day + intercept।', 'linear_regression(days, maxes) woh seedhi rekha dhoondhta hai jo sabhi 14 points ke sabse paas se guzre: uska slope (har din kitna zyada garam) aur intercept. Kal ka anumaan hai slope × day + intercept.'), see: E },
      run(),
      { k: 'watch', until: (S) => shown(S) && /Day 15 should reach about 3\d\.\d C/.test(outLines(S)), do: t3('Read the terminal and look at the graph.', 'टर्मिनल पढ़िए और ग्राफ़ देखिए।', 'Terminal padhiye aur graph dekhiye.'),
        see: t3('About half a degree warmer each day, so day 15 should be near 31 °C. The points wobble round the line: weather is never exactly a straight line, so a forecast says "about".', 'हर दिन लगभग आधा डिग्री ज़्यादा गर्म, तो दिन 15 लगभग 31 °C के पास होना चाहिए। बिंदु रेखा के आसपास डोलते हैं: मौसम कभी बिल्कुल सीधी रेखा नहीं होता, इसलिए पूर्वानुमान "लगभग" कहता है।', 'Har din lagbhag aadha degree zyada garam, to din 15 lagbhag 31 °C ke paas hona chahiye. Points rekha ke aaspaas dolte hain: mausam kabhi bilkul seedhi rekha nahi hota, isliye forecast "lagbhag" kehta hai.') },
      { k: 'edit', test: (src) => { const m = /ahead = (\d+)/.exec(src); return !!m && +m[1] >= 60; }, set: [[/ahead = 1 /, 'ahead = 90']], do: t3('Use the same line for three months ahead: change ahead = 1 to ahead = 90 and Run.', 'उसी रेखा से तीन महीने आगे का अनुमान: ahead = 1 को ahead = 90 कीजिए और "चलाइए"।', 'Usi rekha se teen mahine aage ka anumaan: ahead = 1 ko ahead = 90 karo aur Run.'), see: E },
      { k: 'watch', until: (S) => shown(S) && /Day 104 should reach about [6-9]\d\.\d C/.test(outLines(S)), do: t3('Read the prediction.', 'अनुमान पढ़िए।', 'Anumaan padhiye.'),
        see: t3('Over 70 °C in June? The line only knows these two weeks of spring warming; it cannot know that summer levels off and the monsoon cools it. Going far past your data (extrapolating) gives nonsense: real forecasts use physics and many years of data, and still look only days ahead.', 'जून में 70 °C से ज़्यादा? रेखा सिर्फ़ वसंत के इन दो हफ़्तों की गर्मी जानती है; उसे नहीं पता कि गर्मी एक हद पर रुकती है और मानसून ठंडक लाता है। अपने डेटा से बहुत आगे जाना (extrapolation) बेतुके नतीजे देता है: असली पूर्वानुमान भौतिकी और कई सालों का डेटा इस्तेमाल करते हैं, और फिर भी कुछ ही दिन आगे देखते हैं।', 'June mein 70 °C se zyada? Rekha sirf vasant ke in do hafton ki garmi jaanti hai; use nahi pata ki garmi ek had par rukti hai aur monsoon thandak laata hai. Apne data se bahut aage jaana (extrapolation) betuke nateeje deta hai: asli forecast physics aur kai saalon ka data use karte hain, aur phir bhi kuch hi din aage dekhte hain.') },
      { k: 'edit', test: (src) => { const m = /ahead = (\d+)/.exec(src); return !!m && +m[1] >= 1 && +m[1] <= 3; }, set: [[/ahead = 90/, 'ahead = 2 ']], do: t3('Keep to the near future: ahead = 2 (the day after tomorrow), and Run.', 'पास के भविष्य तक रहिए: ahead = 2 (परसों), और "चलाइए"।', 'Paas ke bhavishya tak rahiye: ahead = 2 (parson), aur Run.'), see: E },
      { k: 'watch', until: (S) => shown(S) && /Day 16 should reach about 3\d\.\d C/.test(outLines(S)), do: t3('Read it once more.', 'एक बार और पढ़िए।', 'Ek baar aur padhiye.'),
        see: t3('A sensible guess again. Log your own maximum each day with the weather logger for two weeks, and check how close the line gets to the real tomorrow.', 'फिर से एक समझदार अनुमान। मौसम लॉगर से दो हफ़्ते तक हर दिन अपना अधिकतम तापमान लॉग कीजिए, और देखिए रेखा असली कल के कितने पास पहुँचती है।', 'Phir se ek samajhdaar anumaan. Mausam logger se do hafte tak har din apna adhiktam temperature log kijiye, aur dekhiye rekha asli kal ke kitne paas pahunchti hai.') },
    ],
    check: [],
    done: (S) => shown(S) && /Day 16 should reach about 3\d\.\d C/.test(outLines(S)) });

  for (const l of L) { l.n = ++n; l.lang = 'py'; l.batch = 20; }
  return L;
}
