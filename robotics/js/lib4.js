// DUET Robotics Lab 360, batch 4: what the compiler (cpp.js) knows about the new boards' libraries. No imports (cpp.js
// imports this file), so it adds no import loop. The runtime of these objects is in esp32.js (ESP32) and mcu4.js (Mega).
//   WiFi (WiFi.h), HTTPClient (HTTPClient.h: batch 27, to the simulated cloud), WebServer (WebServer.h), AsyncWebServer / AsyncWebServerRequest (ESPAsyncWebServer.h), BluetoothSerial,
//   IPAddress, Serial1–3 (Mega; Serial2 on the ESP32), and the ESP32 functions: touchRead, hallRead, temperatureRead,
//   analogReadResolution, analogReadMilliVolts, ledcSetup / ledcAttachPin / ledcAttach / ledcWrite, dacWrite.
//   Lambdas ([](){ … } and [](AsyncWebServerRequest *request){ … }) for web routes, and raw strings R"(…)".
// A library object's type is 'o4:Name' in the compiler; the sketch makes it with rt.lib4(name, args, line).
const t3 = (en, hi, hg) => ({ en, hi, hg });

// methods: name -> [min args, max args, return type, flags]   flags: p = print-like, y = takes time (a generator),
//   h = its last argument is a handler (a function name or a lambda), n = the handler gets the request (async)
const SER = { begin: [1, 4, 'void'], end: [0, 0, 'void'], available: [0, 0, 'int'], read: [0, 0, 'int'], peek: [0, 0, 'int'], print: [0, 2, 'void', 'py'], println: [0, 2, 'void', 'py'],
  write: [1, 1, 'int', 'y'], readString: [0, 0, 'str', 'y'], readStringUntil: [1, 1, 'str', 'y'], parseInt: [0, 0, 'long', 'y'], parseFloat: [0, 0, 'float', 'y'], flush: [0, 0, 'void', 'y'], setTimeout: [1, 1, 'void'] };
const TYPES = {
  WebServer: { inc: ['WebServer.h'], need: 'wifi', ctor: [0, 1], methods: { on: [2, 3, 'void', 'h'], onNotFound: [1, 1, 'void', 'h'], begin: [0, 1, 'void'], close: [0, 0, 'void'], stop: [0, 0, 'void'],
    handleClient: [0, 0, 'void', 'y'], send: [1, 3, 'void'], send_P: [3, 3, 'void'], arg: [1, 1, 'str'], hasArg: [1, 1, 'bool'], args: [0, 0, 'int'], argName: [1, 1, 'str'], uri: [0, 0, 'str'], method: [0, 0, 'int'], sendHeader: [2, 3, 'void'] } },
  AsyncWebServer: { inc: ['ESPAsyncWebServer.h'], need: 'wifi', ctor: [1, 1], methods: { on: [2, 3, 'void', 'hn'], onNotFound: [1, 1, 'void', 'hn'], begin: [0, 0, 'void'], end: [0, 0, 'void'], reset: [0, 0, 'void'] } },
  AsyncWebServerRequest: { ptr: true, methods: { send: [1, 3, 'void'], hasParam: [1, 2, 'bool'], getParam: [1, 2, 'o4:AsyncWebParameter'], arg: [1, 1, 'str'], hasArg: [1, 1, 'bool'], url: [0, 0, 'str'], method: [0, 0, 'int'], params: [0, 0, 'int'], redirect: [1, 1, 'void'] } },
  AsyncWebParameter: { ptr: true, methods: { value: [0, 0, 'str'], name: [0, 0, 'str'] } },
  BluetoothSerial: { inc: ['BluetoothSerial.h'], need: 'bt', ctor: [0, 0], methods: Object.assign({}, SER, { begin: [0, 2, 'bool'], hasClient: [0, 0, 'bool'], connected: [0, 1, 'bool'], setPin: [1, 1, 'bool'], isReady: [0, 2, 'bool'] }) },
  HTTPClient: { inc: ['HTTPClient.h'], need: 'wifi', ctor: [0, 0], methods: { begin: [1, 2, 'bool'], GET: [0, 0, 'int', 'y'], POST: [1, 1, 'int', 'y'], getString: [0, 0, 'str'], end: [0, 0, 'void'], addHeader: [2, 3, 'void'], setTimeout: [1, 1, 'void'], errorToString: [1, 1, 'str'], getSize: [0, 0, 'int'] } }, // (batch 27: the cloud, esp32.js HTTPRT)
  IPAddress: { ctor: [0, 4], methods: { toString: [0, 0, 'str'] } },
  WiFiClass: { methods: { begin: [1, 3, 'int'], status: [0, 0, 'int'], localIP: [0, 0, 'o4:IPAddress'], softAP: [1, 4, 'bool'], softAPIP: [0, 0, 'o4:IPAddress'], mode: [1, 1, 'bool'], getMode: [0, 0, 'int'],
    disconnect: [0, 2, 'bool'], reconnect: [0, 0, 'bool'], isConnected: [0, 0, 'bool'], RSSI: [0, 0, 'int'], SSID: [0, 0, 'str'], macAddress: [0, 0, 'str'], setHostname: [1, 1, 'bool'], softAPgetStationNum: [0, 0, 'int'], scanNetworks: [0, 0, 'int', 'y'] } },
  HardwareSerial: { methods: SER },
};
// global objects: name -> [type, includes, what the board needs]
const GLOBALS = { WiFi: ['WiFiClass', ['WiFi.h'], 'wifi'], Serial1: ['HardwareSerial', null, 'ser1'], Serial2: ['HardwareSerial', null, 'ser2'], Serial3: ['HardwareSerial', null, 'ser3'] };
const CONSTS = {
  WL_IDLE_STATUS: [0, 'int'], WL_NO_SSID_AVAIL: [1, 'int'], WL_SCAN_COMPLETED: [2, 'int'], WL_CONNECTED: [3, 'int'], WL_CONNECT_FAILED: [4, 'int'], WL_CONNECTION_LOST: [5, 'int'], WL_DISCONNECTED: [6, 'int'],
  WIFI_OFF: [0, 'int'], WIFI_STA: [1, 'int'], WIFI_AP: [2, 'int'], WIFI_AP_STA: [3, 'int'],
  HTTP_GET: [1, 'int'], HTTP_POST: [3, 'int'], HTTP_PUT: [4, 'int'], HTTP_DELETE: [8, 'int'], HTTP_ANY: [127, 'int'],
  T0: [4, 'int'], T1: [0, 'int'], T2: [2, 'int'], T3: [15, 'int'], T4: [13, 'int'], T5: [12, 'int'], T6: [14, 'int'], T7: [27, 'int'], T8: [33, 'int'], T9: [32, 'int'],
  HTTP_CODE_OK: [200, 'int'], HTTPC_ERROR_CONNECTION_REFUSED: [-1, 'int'], HTTPC_ERROR_NOT_CONNECTED: [-4, 'int'], HTTPC_ERROR_READ_TIMEOUT: [-11, 'int'],
  ADC_0db: [0, 'int'], ADC_2_5db: [1, 'int'], ADC_6db: [2, 'int'], ADC_11db: [3, 'int'], SERIAL_8N1: [0x800001c, 'long'],
};
const INCLUDES = ['WiFi.h', 'HTTPClient.h', 'WebServer.h', 'ESPAsyncWebServer.h', 'AsyncTCP.h', 'BluetoothSerial.h', 'WiFiClient.h', 'WiFiAP.h', 'ESPmDNS.h', 'HardwareSerial.h', 'esp32-hal-ledc.h'];
// the ESP32's own functions: [min, max, return type, emit, timed, the board must have]
const fn = (name) => (a) => `rt.${name}(${a.map((x) => x.c)})`;
const FUNCS = {
  touchRead: [1, 1, 'uint', fn('touchRead'), false, 'esp32'], hallRead: [0, 0, 'int', fn('hallRead'), false, 'esp32'], temperatureRead: [0, 0, 'float', fn('temperatureRead'), false, 'esp32'],
  analogReadResolution: [1, 1, 'void', fn('analogReadResolution'), false, 'esp32'], analogSetAttenuation: [1, 1, 'void', () => '0', false, 'esp32'], analogSetPinAttenuation: [2, 2, 'void', () => '0', false, 'esp32'],
  analogReadMilliVolts: [1, 1, 'ulong', fn('analogReadMilliVolts'), false, 'esp32'], dacWrite: [2, 2, 'void', fn('dacWrite'), false, 'esp32'],
  ledcSetup: [3, 3, 'ulong', fn('ledcSetup'), false, 'esp32'], ledcAttachPin: [2, 2, 'void', fn('ledcAttachPin'), false, 'esp32'], ledcAttach: [3, 3, 'bool', fn('ledcAttach'), false, 'esp32'],
  ledcAttachChannel: [4, 4, 'bool', fn('ledcAttachChannel'), false, 'esp32'], ledcWrite: [2, 2, 'bool', fn('ledcWrite'), false, 'esp32'], ledcRead: [1, 1, 'ulong', fn('ledcRead'), false, 'esp32'],
  ledcWriteTone: [2, 2, 'ulong', fn('ledcWriteTone'), false, 'esp32'], ledcDetachPin: [1, 1, 'void', fn('ledcDetach'), false, 'esp32'], ledcDetach: [1, 1, 'bool', fn('ledcDetach'), false, 'esp32'],
};
const isO4 = (t) => typeof t === 'string' && t.startsWith('o4:');

export const LIB4 = {
  types: TYPES, globals: GLOBALS, consts: CONSTS, includes: INCLUDES, funcs: FUNCS, macros: { PROGMEM: [], ICACHE_RAM_ATTR: [], IRAM_ATTR: [] },
  isType: (name) => !!(TYPES[name] && (TYPES[name].ctor || TYPES[name].ptr)),
  // the board can run it? (an Uno has no WiFi; only a Mega has Serial1–3; the ESP32 has Serial2)
  needBoard(G, need, what, line) {
    const b = G.info.board; if (!b || !need) return;
    const ok = need === 'ser1' || need === 'ser3' ? b.id === 'mega' : need === 'ser2' ? b.id === 'mega' || b.id === 'esp32' : !!b[need];
    if (!ok) G.err('E_BOARD_LIB', line, { lib: what, board: b.short });
  },
  needInc(G, ty, inc, line) { if (inc && !inc.some((h) => G.info.includes.includes(h))) G.err('E_LIB4_INCLUDE', line, { type: ty, lib: inc[0] }); },
  decl(G, ty, v) {
    const T = TYPES[ty]; if (!T.ctor) G.err('E_LIB4_PTR', v.line, { type: ty });
    const args = v.ctorArgs || (v.init ? [v.init] : []);
    this.needInc(G, ty, T.inc, v.line); this.needBoard(G, T.need, ty, v.line);
    if (args.length < T.ctor[0] || args.length > T.ctor[1]) G.err('E_ARGS', v.line, { name: ty, min: T.ctor[0], max: T.ctor[1], got: args.length });
    const xs = args.map((a) => { const x = G.ex(a); if (x.t === 'void' || isO4(x.t)) G.err('E_VOID_VALUE', v.line, { name: x.fname || '' }); return x.c; });
    return `rt.lib4(${JSON.stringify(ty)},[${xs}],${v.line})`;
  },
  global(G, name, line) {
    const [ty, inc, need] = GLOBALS[name]; this.needInc(G, name, inc, line); this.needBoard(G, need, name, line);
    return { c: `rt.lib4("@${name}",[],${line})`, t: 'o4:' + ty };
  },
  // a handler: the name of a function of the sketch, or a lambda; `n`: it gets the request (AsyncWebServer)
  handler(G, x, withReq, line) {
    if (x.k === 'id' && !G.lookup(x.name) && G.funcs.has(x.name)) {
      const f = G.funcs.get(x.name);
      if (f.params.length !== (withReq ? 1 : 0)) G.err('E_HANDLER', line, { name: x.name, n: withReq ? 1 : 0 });
      return f.js;
    }
    if (x.k === 'lambda') { if (x.params.length !== (withReq ? 1 : 0)) G.err('E_HANDLER', line, { name: '[](…)', n: withReq ? 1 : 0 }); return G.ex(x).c; }
    G.err('E_HANDLER', line, { name: x.k === 'id' ? x.name : '…', n: withReq ? 1 : 0 });
  },
  method(G, e, obj, oname) {
    const ty = obj.t.slice(3), T = TYPES[ty], m = e.f.m; const B = T && T.methods[m];
    if (!B) G.err('E_LIB4_METHOD', e.line, { name: m, type: ty });
    const [mn, mx, ret, fl = ''] = B;
    if (e.args.length < mn || e.args.length > mx) G.err('E_ARGS', e.line, { name: (oname || ty) + '.' + m, min: mn, max: mx, got: e.args.length });
    if (fl.includes('p')) { // print / println, as Serial does it
      const nl = m === 'println' ? '+"\\r\\n"' : '';
      if (!e.args.length) return { c: `(yield* ${obj.c}.out("\\r\\n"))`, t: 'void' };
      const a = G.ex(e.args[0]); if (a.t === 'void') G.err('E_VOID_VALUE', e.line, { name: a.fname || '' });
      const f = e.args[1] ? G.ex(e.args[1]).c : 'undefined';
      return { c: `(yield* ${obj.c}.out(rt.fmt(${a.c},'${typeof a.t === 'string' ? a.t : 'arr'}',${f})${nl}))`, t: 'void' };
    }
    if (ty !== 'WebServer' && ty !== 'AsyncWebServer' && m === 'write') { const a = G.ex(e.args[0]); return { c: `(yield* ${obj.c}.out(${a.t === 'str' ? a.c : `String.fromCharCode((${a.c})&255)`}))`, t: 'int' }; }
    const xs = e.args.map((x, i) => {
      if (fl.includes('h') && i === e.args.length - 1) return this.handler(G, x, fl.includes('n'), e.line);
      const a = G.ex(x); if (a.t === 'void') G.err('E_VOID_VALUE', e.line, { name: a.fname || '' });
      if (a.t && a.t.arr) G.err('E_ARRAY_VALUE', e.line);
      return a.c;
    });
    let c = `${obj.c}.${m}(${xs})`; if (fl.includes('y')) c = `(yield* ${c})`;
    return { c, t: ret };
  },
  // [](){ … } or [](AsyncWebServerRequest *request){ … }: parsed in Parser.primary, as an expression
  lambda(P) {
    const t = P.next(); // [
    while (!P.is(']')) { if (P.tok.t === 'eof') P.expect(']'); P.next(); }
    P.next();
    const params = [];
    if (P.eat('(')) { if (!P.is(')')) do { const pt = P.type(); const pn = P.ident('parameter'); params.push({ name: pn.v, t: pt.t, line: pn.line }); } while (P.eat(',')); P.expect(')'); }
    if (P.eat('->')) P.type();
    const body = P.block();
    return { k: 'lambda', params, body, line: t.line };
  },
  // a lambda becomes a generator function in place (it sees the sketch's global variables)
  genLambda(G, e) {
    const sFn = G.fn, sLoops = G.loops, sSw = G.sw;
    G.fn = { tmps: [], ret: 'void', name: 'lambda' }; G.loops = 0; G.sw = 0;
    G.push(); const ps = e.params.map((p) => G.declare(p.name, { name: p.name, t: p.t, isParam: true }, p.line));
    const body = G.stmts(e.body.body); G.pop();
    const pre = G.fn.tmps.length ? 'let ' + G.fn.tmps.join(',') + ';' : '';
    G.fn = sFn; G.loops = sLoops; G.sw = sSw;
    return { c: `(function*(${ps.map((p) => p.js).join(',')}){if(rt.enter(${e.line}))yield 0;try{${pre}\n${body}\n}finally{rt.depth--;}})`, t: 'o4:lambda' };
  },
};

// compiler and runtime messages (i18n.js CPP gets them from app4.js)
export const MSG4 = {
  E_BOARD_LIB: t3('{lib} does not work on the {board}. It needs an ESP32 (WiFi, Bluetooth) or a Mega (Serial1–3): choose the board first.', '{lib}, {board} पर नहीं चलता। इसके लिए ESP32 (WiFi, Bluetooth) या Mega (Serial1–3) चाहिए: पहले बोर्ड चुनिए।', '{lib}, {board} par nahi chalta. Iske liye ESP32 (WiFi, Bluetooth) ya Mega (Serial1–3) chahiye: pehle board chuniye.'),
  E_BOARD_FUNC: t3('{name}() is an ESP32 function: the {board} does not have it.', '{name}() ESP32 का फ़ंक्शन है: {board} में यह नहीं होता।', '{name}() ESP32 ka function hai: {board} mein yeh nahi hota.'),
  E_LIB4_INCLUDE: t3('To use {type}, put #include <{lib}> at the top of the sketch.', '{type} के लिए स्केच में सबसे ऊपर #include <{lib}> लिखिए।', '{type} ke liye sketch mein sabse upar #include <{lib}> likhiye.'),
  E_LIB4_METHOD: t3('A {type} has no "{name}".', '{type} में "{name}" नहीं होता।', '{type} mein "{name}" nahi hota.'),
  E_LIB4_PTR: t3('You cannot make a {type} yourself: the web server gives it to your handler.', '{type} आप ख़ुद नहीं बना सकते: वेब सर्वर इसे आपके हैंडलर को देता है।', '{type} aap khud nahi bana sakte: web server ise aapke handler ko deta hai.'),
  E_HANDLER: t3('"{name}" must be a function with {n} parameter(s): the page handler, like void handleRoot() { … }.', '"{name}" ऐसा फ़ंक्शन होना चाहिए जिसमें {n} पैरामीटर हों: पेज हैंडलर, जैसे void handleRoot() { … }।', '"{name}" aisa function hona chahiye jismein {n} parameter hon: page handler, jaise void handleRoot() { … }.'),
  R_PIN_ESP: t3('The ESP32 DevKit has no GPIO {pin} on its pins. Use the numbers printed on the board: 2, 4, 5, 12–19, 21–23, 25–27, 32–36, 39.', 'ESP32 DevKit के पिनों पर GPIO {pin} नहीं है। बोर्ड पर छपे नंबर लीजिए: 2, 4, 5, 12–19, 21–23, 25–27, 32–36, 39।', 'ESP32 DevKit ke pins par GPIO {pin} nahi hai. Board par chhape number lijiye: 2, 4, 5, 12–19, 21–23, 25–27, 32–36, 39.'),
  R_PIN_FLASH: t3('GPIO {pin} is wired to the ESP32\'s flash memory chip inside: using it stops the sketch. Pick another pin.', 'GPIO {pin} अंदर ESP32 की फ़्लैश मेमोरी चिप से जुड़ा है: इसे लेने से स्केच रुक जाता है। दूसरा पिन चुनिए।', 'GPIO {pin} andar ESP32 ki flash memory chip se juda hai: ise lene se sketch ruk jaata hai. Doosra pin chuniye.'),
  R_PIN_MEGA: t3('There is no pin {pin} on the Mega. Use 0–53 or A0–A15.', 'Mega पर पिन {pin} नहीं है। 0–53 या A0–A15 लिखिए।', 'Mega par pin {pin} nahi hai. 0–53 ya A0–A15 likhiye.'),
  R_PIN_NANO: t3('There is no pin {pin} on the Nano. Use 0–13 or A0–A7.', 'Nano पर पिन {pin} नहीं है। 0–13 या A0–A7 लिखिए।', 'Nano par pin {pin} nahi hai. 0–13 ya A0–A7 likhiye.'),
  R_ANALOG_ESP: t3('GPIO {pin} cannot read analog. ADC pins: 32–36, 39 (ADC1), and 2, 4, 12–15, 25–27 (ADC2).', 'GPIO {pin} एनालॉग नहीं पढ़ सकता। ADC पिन: 32–36, 39 (ADC1), और 2, 4, 12–15, 25–27 (ADC2)।', 'GPIO {pin} analog nahi padh sakta. ADC pins: 32–36, 39 (ADC1), aur 2, 4, 12–15, 25–27 (ADC2).'),
  R_ANALOG_MEGA: t3('analogRead() works on A0–A15 only.', 'analogRead() सिर्फ़ A0–A15 पर चलता है।', 'analogRead() sirf A0–A15 par chalta hai.'),
  R_ASYNC_LOOP: t3('A web page handler never finished. Handlers must answer quickly: no long loops or delay() in them.', 'एक वेब पेज हैंडलर ख़त्म ही नहीं हुआ। हैंडलर जल्दी जवाब दें: इनमें लंबे लूप या delay() मत लिखिए।', 'Ek web page handler khatam hi nahi hua. Handlers jaldi jawab dein: inmein lambe loop ya delay() mat likhiye.'),
  N_INPUT_ONLY: t3('GPIO {pin} is INPUT only (34–39 have no output and no pull-up): it cannot light an LED.', 'GPIO {pin} सिर्फ़ INPUT है (34–39 में आउटपुट और pull-up नहीं): यह एलईडी नहीं जला सकता।', 'GPIO {pin} sirf INPUT hai (34–39 mein output aur pull-up nahi): yeh LED nahi jala sakta.'),
  N_ADC2_WIFI: t3('GPIO {pin} is an ADC2 pin: while WiFi is on, analogRead() cannot use it (it gives 0). Use an ADC1 pin: 32–36 or 39.', 'GPIO {pin} ADC2 पिन है: WiFi चालू रहते analogRead() इसे नहीं पढ़ सकता (0 देता है)। ADC1 पिन लीजिए: 32–36 या 39।', 'GPIO {pin} ADC2 pin hai: WiFi on rehte analogRead() ise nahi padh sakta (0 deta hai). ADC1 pin lijiye: 32–36 ya 39.'),
  N_TOUCH_PIN: t3('GPIO {pin} is not a touch pin. Touch pins: T0 = 4, T2 = 2, T3 = 15, T4 = 13, T5 = 12, T6 = 14, T7 = 27, T8 = 33, T9 = 32.', 'GPIO {pin} टच पिन नहीं है। टच पिन: T0 = 4, T2 = 2, T3 = 15, T4 = 13, T5 = 12, T6 = 14, T7 = 27, T8 = 33, T9 = 32।', 'GPIO {pin} touch pin nahi hai. Touch pins: T0 = 4, T2 = 2, T3 = 15, T4 = 13, T5 = 12, T6 = 14, T7 = 27, T8 = 33, T9 = 32.'),
  N_STRAP: t3('GPIO {pin} is a boot pin: if something pulls it the wrong way while the ESP32 starts, it may not start. It is fine for an LED.', 'GPIO {pin} बूट पिन है: ESP32 शुरू होते समय कोई चीज़ इसे ग़लत तरफ़ खींचे तो बोर्ड शुरू नहीं होगा। एलईडी के लिए ठीक है।', 'GPIO {pin} boot pin hai: ESP32 start hote waqt koi cheez ise galat taraf kheenche to board start nahi hoga. LED ke liye theek hai.'),
  N_DAC_PIN: t3('dacWrite() works on GPIO 25 and 26 only.', 'dacWrite() सिर्फ़ GPIO 25 और 26 पर चलता है।', 'dacWrite() sirf GPIO 25 aur 26 par chalta hai.'),
  N_LEDC: t3('ledcWrite({x}): nothing is attached there. Call ledcAttach(pin, 5000, 8) (or ledcSetup + ledcAttachPin) in setup().', 'ledcWrite({x}): वहाँ कुछ नहीं जुड़ा। setup() में ledcAttach(pin, 5000, 8) (या ledcSetup + ledcAttachPin) लिखिए।', 'ledcWrite({x}): wahan kuch nahi juda. setup() mein ledcAttach(pin, 5000, 8) (ya ledcSetup + ledcAttachPin) likhiye.'),
  N_HALL_CORE3: t3('hallRead() works only in the ESP32 Arduino core 2.x (the one the lab runs; core 3.0 removed it) and only on the original ESP32: the ESP32-S2, S3 and C3 have no Hall sensor.', 'hallRead() सिर्फ़ ESP32 Arduino core 2.x में चलता है (लैब यही चलाती है; core 3.0 में इसे हटा दिया गया) और सिर्फ़ ओरिजिनल ESP32 पर: ESP32-S2, S3 और C3 में हॉल सेंसर नहीं है।', 'hallRead() sirf ESP32 Arduino core 2.x mein chalta hai (lab yahi chalati hai; core 3.0 mein ise hata diya gaya) aur sirf original ESP32 par: ESP32-S2, S3 aur C3 mein Hall sensor nahi hai.'),
  N_TEMP_NONE: t3('temperatureRead() gives 53.3 °C on this chip: the ESP32-WROOM-32 has no working temperature sensor inside. Use an LM35 or DHT11 for the room.', 'temperatureRead() इस चिप पर 53.3 °C देता है: ESP32-WROOM-32 में अंदर का तापमान सेंसर काम नहीं करता। कमरे के लिए LM35 या DHT11 लीजिए।', 'temperatureRead() is chip par 53.3 °C deta hai: ESP32-WROOM-32 mein andar ka temperature sensor kaam nahi karta. Room ke liye LM35 ya DHT11 lijiye.'),
  N_NO_HANDLE: t3('The phone asked for a page, but loop() never calls server.handleClient(): the page cannot load.', 'फ़ोन ने पेज माँगा, पर loop() कभी server.handleClient() नहीं बुलाता: पेज नहीं खुलेगा।', 'Phone ne page maanga, par loop() kabhi server.handleClient() nahi bulata: page nahi khulega.'),
  N_SERIAL_PORT: t3('Serial{n}.print(): nothing was sent, because Serial{n}.begin() was not called.', 'Serial{n}.print(): कुछ नहीं भेजा गया, क्योंकि Serial{n}.begin() नहीं बुलाया।', 'Serial{n}.print(): kuch nahi bheja gaya, kyunki Serial{n}.begin() nahi bulaya.'),
};
