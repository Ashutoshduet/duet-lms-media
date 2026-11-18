// DUET Robotics Lab 360, batch 4: the ESP32 (ESP32-WROOM-32 on a DevKit V1), as the Arduino-ESP32 core 2.x runs it.
//   3.3 V pins (a pin is HIGH above 2.5 V, LOW below 0.8 V); ESD clamp diodes to 3V3 and GND on every pin, so 5 V on a pin
//   pushes current into the board and the lab warns. GPIO 34–39 are input only; 6–11 belong to the flash chip.
//   analogRead: 12 bits (0–4095), not exact near 0 V and above about 3.1 V (as a real ESP32); analogReadMilliVolts() uses the
//   factory calibration; ADC2 pins read 0 while WiFi is on. PWM on every output pin: analogWrite, ledcSetup / ledcAttachPin /
//   ledcWrite (core 2.x) and ledcAttach / ledcWrite(pin, …) (core 3.x). touchRead on T0, T2–T9. hallRead (the chip's own
//   Hall sensor, core 2.x). temperatureRead() gives 53.3 °C: this chip has no working temperature sensor.
// The network is simulated here, nothing leaves the device: a school WiFi (its router is on the bench), the ESP32 joins it
// with WiFi.begin() and gets an address; WebServer and AsyncWebServer answer the phone's browser (phone4.js) from the
// sketch's own handlers; BluetoothSerial talks to the phone's Bluetooth terminal app.
import { MCU, RtError, SerialPort } from './mcu.js';
import { BOARDS4, ESP, LAB_HOOKS } from './boards4.js';
import { routeSerial } from './mcu4.js';

const t3 = (en, hi, hg) => ({ en, hi, hg });
export const SCHOOL = { ssid: 'DUET-School', pass: 'stem2026', sub: '192.168.1.', gw: '192.168.1.1' };
export const AP_IP = '192.168.4.1';
const ESPDEF = BOARDS4.esp32;
const PIN_OF = {}; for (const p of ESPDEF.pins) if (p.gpio !== undefined) PIN_OF[p.gpio] = p.id; // GPIO -> the board pin's id
export const espPinId = (g) => PIN_OF[g];
const noise = (a) => (Math.random() - 0.5) * 2 * a;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

class IPAddr { constructor(s) { this.s = s; } toString() { return this.s; } }

// ------------------------------------------------------------------ the microcontroller
export class ESP32MCU extends MCU {
  reset() {
    super.reset();
    this.adcMin = new Array(40).fill(4096); this.adcMax = new Array(40).fill(-1);
    this.adcBits = 12; this.ledc = { ch: {}, pin: {} }; this.g4 = {}; this.webs = []; this.asyncs = []; this.bt = null;
    this.ser2 = new SerialPort(this); this.wifi = { mode: 0, sta: null, ap: null }; this.touchSeen = {};
  }
  start() {
    super.start();
    if (this.state !== 'running') return;
    // what a real ESP32 says at 115200 baud when it starts (garbled if the Serial Monitor is at another speed)
    const txt = '\r\nets Jun  8 2016 00:22:57\r\n\r\nrst:0x1 (POWERON_RESET),boot:0x13 (SPI_FAST_FLASH_BOOT)\r\nentry 0x400805e4\r\n';
    this.ser.outq.push({ baud: 115200, bytes: [...txt].map((c) => c.charCodeAt(0)) });
  }
  wifiOn() { return this.wifi.mode !== 0; }
  pin(p, fn) {
    if (!(p >= 0 && p < 40) || p !== Math.floor(p) || ESP.none.includes(p)) throw new RtError('R_PIN_ESP', { pin: p, fn }, this.L);
    if (ESP.flash.includes(p)) throw new RtError('R_PIN_FLASH', { pin: p, fn }, this.L);
    if ((p === 1 || p === 3) && this.ser.on && !this.warned.has('serialpin')) { this.warned.add('serialpin'); this.note('N_SERIAL_PIN', { pin: p }); }
    return this.pins[p];
  }
  inOnly(p, fn) { if (!ESP.inOnly.includes(p)) return false; this.pin(p, fn); if (!this.warned.has('io' + p)) { this.warned.add('io' + p); this.note('N_INPUT_ONLY', { pin: p }); } return true; }
  pinMode(p, m) {
    if ((m === 1 || m === 2) && this.inOnly(p, 'pinMode')) m = 0;
    if (m === 1 && [12, 15].includes(p) && !this.warned.has('strap' + p)) { this.warned.add('strap' + p); this.note('N_STRAP', { pin: p }); }
    super.pinMode(p, m);
  }
  dw(p, v) { if (this.inOnly(p, 'digitalWrite')) { this.t += 1; return; } super.dw(p, v); }
  aw(p, v) { if (this.inOnly(p, 'analogWrite')) { this.t += 1; return; } super.aw(p, v); }
  dr(p) {
    const P = this.pin(p, 'digitalRead'); this.t += 1.2;
    if (P.mode === 1 && P.pwm < 0) return P.level >= 0.5 ? 1 : 0;
    if (p === 0 && !(this.lab && this.lab.used('N:G0'))) return this.bootDown > this.t ? 0 : 1; // GPIO 0: the BOOT button (pulled up on the board)
    const v = this.io.read ? this.io.read(p, this.t) : NaN;
    if (Number.isNaN(v)) { if (!this.warned.has('float' + p)) { this.warned.add('float' + p); this.note('N_FLOATING', { pin: p }); } return this.hum(p) > 2.5 ? 1 : 0; }
    if (v >= 2.48) return 1; if (v <= 0.83) return 0;
    return this.hum(p) * 0.66 > v ? 0 : 1;
  }
  // the ADC (11 dB, as analogRead sets it): about 0.075 V reads 0, about 3.15 V reads 4095
  adcV(p, fn) {
    this.pin(p, fn);
    const a1 = ESP.adc1[p], a2 = ESP.adc2[p];
    if (a1 === undefined && a2 === undefined) throw new RtError('R_ANALOG_ESP', { pin: p }, this.L);
    if (a2 !== undefined && this.wifiOn()) { if (!this.warned.has('adc2' + p)) { this.warned.add('adc2' + p); this.note('N_ADC2_WIFI', { pin: p }); } return null; }
    return this.io.read ? this.io.read(p, this.t, true) : NaN;
  }
  ar(p) {
    this.t += 40; const v = this.adcV(p, 'analogRead'); if (v === null) return 0;
    let raw = Number.isNaN(v) ? clamp(Math.round(1800 + 1700 * Math.sin(this.t / 1e6 * 314 + p) + noise(300)), 0, 4095) : v < 0.075 ? 0 : clamp(Math.round((v - 0.075) / 3.07 * 4095 + noise(6)), 0, 4095);
    if (raw < this.adcMin[p]) this.adcMin[p] = raw; if (raw > this.adcMax[p]) this.adcMax[p] = raw;
    const b = this.adcBits; return b >= 12 ? raw << (b - 12) : raw >> (12 - b);
  }
  analogReadMilliVolts(p) { this.t += 45; const v = this.adcV(p, 'analogReadMilliVolts'); if (v === null) return 0; if (Number.isNaN(v)) return clamp(Math.round(1500 + 1400 * Math.sin(this.t / 1e6 * 314 + p)), 0, 3300); return clamp(Math.round(Math.min(v, 3.13) * 1000 + noise(3)), 0, 3300); }
  analogReadResolution(bits) { this.adcBits = clamp(bits | 0, 9, 16); }
  dacWrite(p, v) { if (p !== 25 && p !== 26) { if (!this.warned.has('dac')) { this.warned.add('dac'); this.note('N_DAC_PIN', {}); } return; } this.aw(p, clamp(v | 0, 0, 255)); }
  // LEDC: channels (core 2.x) or pins (core 3.x)
  ledcSetup(ch, f, bits) { this.ledc.ch[ch] = { f, bits: clamp(bits | 0, 1, 16), duty: 0, pins: [] }; this.t += 20; return f; }
  ledcAttachPin(p, ch) { if (this.inOnly(p, 'ledcAttachPin')) return; this.pin(p, 'ledcAttachPin'); const c = this.ledc.ch[ch] || (this.ledc.ch[ch] = { f: 5000, bits: 8, duty: 0, pins: [] }); if (!c.pins.includes(p)) c.pins.push(p); this.apply(c); }
  ledcAttach(p, f, bits) { if (this.inOnly(p, 'ledcAttach')) return 0; this.pin(p, 'ledcAttach'); this.ledc.pin[p] = { f, bits: clamp(bits | 0, 1, 16), duty: 0, pins: [p] }; this.apply(this.ledc.pin[p]); return 1; }
  ledcAttachChannel(p, f, bits, ch) { const r = this.ledcAttach(p, f, bits); if (r) this.ledc.ch[ch] = this.ledc.pin[p]; return r; }
  ledcOf(x) { return this.ledc.pin[x] || this.ledc.ch[x] || null; }
  ledcWrite(x, duty) {
    const c = this.ledcOf(x); this.t += 8;
    if (!c) { if (!this.warned.has('ledc' + x)) { this.warned.add('ledc' + x); this.note('N_LEDC', { x }); } return 0; }
    c.duty = clamp(Math.round(duty), 0, 2 ** c.bits); c.tone = 0; this.apply(c); return 1;
  }
  ledcRead(x) { const c = this.ledcOf(x); return c ? c.duty : 0; }
  ledcWriteTone(x, f) { const c = this.ledcOf(x); if (!c) return 0; c.tone = f; for (const p of c.pins) { const P = this.pins[p]; P.mode = 1; P.pwm = -1; P.tone = f > 0 ? Math.min(65535, f) : 0; P.toneEnd = 0; this.setLevel(p, f > 0 ? 0.5 : 0); if (this.io.onPin) this.io.onPin(p, this.t); } return f; }
  ledcDetach(p) { delete this.ledc.pin[p]; for (const c of Object.values(this.ledc.ch)) c.pins = c.pins.filter((q) => q !== p); const P = this.pins[p]; if (P) { P.pwm = -1; this.setLevel(p, 0); } return 1; }
  apply(c) {
    const full = 2 ** c.bits - 1, k = clamp(c.duty / full, 0, 1);
    for (const p of c.pins) {
      const P = this.pins[p]; P.mode = 1; P.tone = 0;
      if (k <= 0 || k >= 1) { P.pwm = -1; this.setLevel(p, k >= 1 ? 1 : 0); } else { P.pwm = Math.max(1, Math.min(254, Math.round(k * 255))); this.setLevel(p, k); }
      if (this.io.onPin) this.io.onPin(p, this.t);
    }
  }
  // touch: about 70 untouched, 10–20 with a finger on the pad wired to the pin (core 2.x numbers)
  touchRead(p) {
    this.pin(p, 'touchRead'); this.t += 500;
    if (!ESP.touch[p]) { if (!this.warned.has('touch' + p)) { this.warned.add('touch' + p); this.note('N_TOUCH_PIN', { pin: p }); } return 0; }
    const lab = this.lab; let pad = false, touched = false;
    if (lab && PIN_OF[p]) for (const q of lab.parts) if (q.type === 'touch4' && lab.conn('T:' + q.uid + ':PAD', 'B:' + PIN_OF[p])) { pad = true; if (q.state.pressed) touched = true; }
    const v = touched ? 14 + noise(3) : (pad ? 66 : 74) + noise(2);
    const n = Math.max(1, Math.round(v)); this.touchSeen[p] = this.touchSeen[p] || { min: 999, max: 0 }; const s = this.touchSeen[p]; s.min = Math.min(s.min, n); s.max = Math.max(s.max, n);
    return n;
  }
  // the Hall sensor inside the chip, under the metal cover: a magnet's pole moves the number up (N) or down (S)
  hallRead() {
    this.t += 600; if (!this.warned.has('hall')) { this.warned.add('hall'); this.note('N_HALL_CORE3', {}); }
    let f = 0; const lab = this.lab;
    if (lab) for (const q of lab.parts) if (q.type === 'magnet4') { const d = Math.max(0, q.state.dist); f += (q.state.pole === 'S' ? -1 : 1) * 125 / Math.pow(1 + (d / 8) ** 2, 1.5); }
    const v = Math.round(18 + f + noise(5)); this.hallSeen = this.hallSeen || { min: 999, max: -999 }; this.hallSeen.min = Math.min(this.hallSeen.min, v); this.hallSeen.max = Math.max(this.hallSeen.max, v);
    return v;
  }
  temperatureRead() { this.t += 50; if (!this.warned.has('temp')) { this.warned.add('temp'); this.note('N_TEMP_NONE', {}); } return (128 - 32) / 1.8; }
  // the libraries (lib4.js): rt.lib4(type, args, line)
  lib4(type, args, line) {
    if (type[0] === '@') {
      if (this.g4[type]) return this.g4[type];
      if (type === '@WiFi') return (this.g4[type] = new WiFiRT(this));
      if (type === '@Serial2') return (this.g4[type] = this.ser2);
      if (type === '@Serial1') return (this.g4[type] = this.ser1 || (this.ser1 = new SerialPort(this)));
      throw new RtError('R_INTERNAL', { msg: 'no ' + type.slice(1) + ' on the ESP32' }, line);
    }
    switch (type) {
      case 'WebServer': return new WebRT(this, args);
      case 'AsyncWebServer': return new AsyncRT(this, args);
      case 'BluetoothSerial': return this.bt || (this.bt = new BTRT(this));
      case 'IPAddress': return new IPAddr(args.length === 4 ? args.join('.') : '0.0.0.0');
    }
    throw new RtError('R_INTERNAL', { msg: 'no library ' + type }, line);
  }
  run(ms) {
    if (this.state === 'running') this.pollAsync();
    const r = super.run(ms);
    if (this.bt) { this.bt.flushTo(this.t); const out = this.bt.take(); if (out.length && this.lab) netOf(this.lab).btFromEsp(this, out); }
    routeSerial(this, [{ ser: this.ser2, tx: 'TX2', rx: 'RX2' }]);
    return r;
  }
  // AsyncWebServer: its handlers run beside loop(), each to its end (they must be short)
  pollAsync() {
    for (const s of this.asyncs) {
      if (!s.began) continue;
      while (s.q.length) {
        const req = s.q.shift(); const R = new AsyncReq(this, req);
        const route = s.find(req); const fn = route ? route.fn : s.nf;
        if (!fn) { R.send(404, 'text/plain', 'Not found'); }
        else {
          const saveU = this.until, saveW = this.wallEnd; this.until = Infinity; this.wallEnd = Infinity;
          try { const g = fn(R); let n = 0; for (;;) { const x = g.next(); if (x.done) break; if (++n > 20000) throw new RtError('R_ASYNC_LOOP', {}, this.L); } }
          catch (e) { this.until = saveU; this.wallEnd = saveW; this.fail(e); return; }
          this.until = saveU; this.wallEnd = saveW;
        }
        if (req.res) netOf(this.lab).deliver(req);
      }
    }
  }
}
ESPDEF.mcuClass = ESP32MCU;

// ------------------------------------------------------------------ WiFi
class WiFiRT {
  constructor(m) { this.m = m; }
  get w() { return this.m.wifi; }
  begin(ssid, pass) { const w = this.w; w.mode |= 1; w.sta = { ssid: String(ssid), pass: pass === undefined ? '' : String(pass), at: this.m.t + 2.4e6, off: false }; this.m.t += 3000; return 6; }
  status() { this.m.t += 5; return staStatus(this.m); }
  isConnected() { return staStatus(this.m) === 3 ? 1 : 0; }
  localIP() { return new IPAddr(staStatus(this.m) === 3 ? SCHOOL.sub + netOf(this.m.lab).dhcp : '0.0.0.0'); }
  softAP(ssid, pass) { const p = pass === undefined ? '' : String(pass); if (p && p.length < 8) return 0; const w = this.w; w.mode |= 2; w.ap = { ssid: String(ssid), pass: p, at: this.m.t + 1.5e5 }; this.m.t += 2000; return 1; }
  softAPIP() { return new IPAddr(this.w.ap ? AP_IP : '0.0.0.0'); }
  softAPgetStationNum() { const n = this.m.lab && netOf(this.m.lab); return n && this.w.ap && n.phone.wifi === this.w.ap.ssid ? 1 : 0; }
  mode(m) { this.w.mode = m | 0; if (!(m & 1) && this.w.sta) this.w.sta.off = true; if (!(m & 2)) this.w.ap = null; return 1; }
  getMode() { return this.w.mode; }
  disconnect() { if (this.w.sta) this.w.sta.off = true; return 1; }
  reconnect() { const s = this.w.sta; if (s) { s.off = false; s.at = this.m.t + 2.4e6; } return 1; }
  RSSI() { return staStatus(this.m) === 3 ? -44 - Math.round(Math.random() * 7) : 0; }
  SSID() { return staStatus(this.m) === 3 ? this.w.sta.ssid : ''; }
  macAddress() { return '24:6F:28:B1:7C:3A'; }
  setHostname() { return 1; }
  *scanNetworks() { yield* this.m.delay(2100); return 2 + (this.w.ap ? 0 : 0); }
}
// WL_CONNECTED (3), WL_NO_SSID_AVAIL (1), WL_DISCONNECTED (6: still trying, or a wrong password), WL_NO_SHIELD (255: WiFi off)
export function staStatus(m) {
  const w = m.wifi, s = w && w.sta; if (!s || !(w.mode & 1)) return 255;
  if (s.off || m.t < s.at) return 6;
  if (s.ssid !== SCHOOL.ssid) return 1;
  if (s.pass !== SCHOOL.pass) { if (!s.told && m.lab) { s.told = true; m.lab.emit('warn', { msg: WARN.pass, args: { ssid: s.ssid } }); } return 6; }
  return 3;
}
export function apUp(m) { const a = m && m.wifi && m.wifi.ap; return !!a && (m.wifi.mode & 2) && m.t >= a.at; }

// ------------------------------------------------------------------ WebServer (WebServer.h): the sketch calls handleClient()
class WebRT {
  constructor(m, args) { this.m = m; this.port = args[0] || 80; this.routes = []; this.nf = null; this.began = false; this.q = []; this.cur = null; this.polled = false; m.webs.push(this); }
  on(path, a, b) { this.routes.push({ path: String(path), method: b ? a : 0, fn: b || a }); this.m.t += 5; }
  onNotFound(fn) { this.nf = fn; }
  begin() { this.began = true; this.m.t += 200; }
  close() { this.began = false; } stop() { this.began = false; }
  find(req) { return this.routes.find((r) => r.path === req.path && (!r.method || r.method === 127 || r.method === req.method)); }
  *handleClient() {
    const m = this.m; m.t += 25; this.polled = true;
    if (!this.began) return;
    const req = this.q.shift(); if (!req) return;
    m.t += 900; this.cur = req; const r = this.find(req);
    if (r) yield* r.fn(); else if (this.nf) yield* this.nf(); else this.send(404, 'text/plain', 'Not found: ' + req.path);
    this.cur = null; if (!req.res) req.res = { code: 0, type: 'text/plain', body: '' };
    netOf(m.lab).deliver(req);
  }
  send(code, type, body) { const req = this.cur; if (!req || req.res) return; const b = body === undefined ? '' : String(body); req.res = { code: code | 0, type: type === undefined ? 'text/plain' : String(type), body: b, headers: req.hdrs || {} }; this.m.t += 200 + b.length * 0.09; }
  send_P(code, type, body) { this.send(code, type, body); }
  sendHeader(n, v) { const req = this.cur; if (req) (req.hdrs || (req.hdrs = {}))[String(n)] = String(v); }
  arg(n) { const req = this.cur; if (!req) return ''; if (typeof n === 'number') { const k = Object.keys(req.args)[n]; return k === undefined ? '' : req.args[k]; } return req.args[n] !== undefined ? req.args[n] : ''; }
  hasArg(n) { const req = this.cur; return req && req.args[n] !== undefined ? 1 : 0; }
  args() { const req = this.cur; return req ? Object.keys(req.args).length : 0; }
  argName(i) { const req = this.cur; return req ? Object.keys(req.args)[i] || '' : ''; }
  uri() { return this.cur ? this.cur.path : ''; }
  method() { return this.cur ? this.cur.method : 0; }
}
// AsyncWebServer (ESPAsyncWebServer.h): no handleClient(); the handlers run as soon as a request comes in
class AsyncRT {
  constructor(m, args) { this.m = m; this.port = args[0] || 80; this.routes = []; this.nf = null; this.began = false; this.q = []; this.polled = true; m.asyncs.push(this); }
  on(path, a, b) { this.routes.push({ path: String(path), method: b ? a : 0, fn: b || a }); }
  onNotFound(fn) { this.nf = fn; }
  begin() { this.began = true; } end() { this.began = false; } reset() { this.routes = []; this.nf = null; }
  find(req) { return this.routes.find((r) => r.path === req.path && (!r.method || r.method === 127 || r.method === req.method)); }
}
class AsyncReq {
  constructor(m, req) { this.m = m; this.req = req; }
  send(code, type, body) { const r = this.req; if (r.res) return; const b = body === undefined ? '' : String(body); r.res = { code: code | 0, type: type === undefined ? 'text/plain' : String(type), body: b, headers: {} }; }
  redirect(url) { const r = this.req; if (!r.res) r.res = { code: 302, type: 'text/plain', body: '', headers: { Location: String(url) } }; }
  hasParam(n) { return this.req.args[n] !== undefined ? 1 : 0; }
  getParam(n) { const r = this.req; const k = typeof n === 'number' ? Object.keys(r.args)[n] : n; const v = k !== undefined && r.args[k] !== undefined ? r.args[k] : ''; return { value: () => v, name: () => String(k || '') }; }
  arg(n) { return this.req.args[n] !== undefined ? this.req.args[n] : ''; }
  hasArg(n) { return this.hasParam(n); }
  params() { return Object.keys(this.req.args).length; }
  url() { return this.req.path; }
  method() { return this.req.method; }
}

// ------------------------------------------------------------------ BluetoothSerial: Serial, over Bluetooth, to the phone
class BTRT extends SerialPort {
  constructor(m) { super(m); this.baud = 1e6; this.name = ''; }
  begin(name) { this.on = true; this.name = name === undefined ? 'ESP32' : String(name); this.m.t += 1200; return 1; }
  hasClient() { return this.m.lab && netOf(this.m.lab).bt.obj === this && netOf(this.m.lab).bt.conn ? 1 : 0; }
  connected() { return this.hasClient(); }
  setPin() { return 1; }
  isReady() { return this.on ? 1 : 0; }
}

// ------------------------------------------------------------------ the network: the router, the phone and Bluetooth
// One per lab (it outlives the sketch's runs). Time is the lab's own (seconds), so the tests are exact.
export function netOf(lab) { return lab.net4 || (lab.net4 = new Net(lab)); }
class Net {
  constructor(lab) { this.lab = lab; this.now = 0; this.dhcp = 23 + Math.floor(Math.random() * 70); this.phone = { wifi: SCHOOL.ssid }; this.reqs = []; this.bt = { conn: null, log: [], at: 0 }; this.ver = 0; this.seen = { pages: 0, codes: [] }; }
  esp() { const m = this.lab.mcu; return m instanceof ESP32MCU ? m : null; }
  running() { const m = this.esp(); return !!m && this.lab.powered && m.state === 'running'; }
  staIP() { const m = this.esp(); return m && this.running() && staStatus(m) === 3 ? SCHOOL.sub + this.dhcp : null; }
  apIP() { const m = this.esp(); return m && this.running() && apUp(m) ? AP_IP : null; }
  // WiFi networks the phone can see, and joining one
  networks() { const m = this.esp(); const out = [{ ssid: SCHOOL.ssid, lock: true, bars: 4 }]; if (m && this.running() && apUp(m)) out.push({ ssid: m.wifi.ap.ssid, lock: !!m.wifi.ap.pass, bars: 3, esp: true }); return out; }
  join(ssid, pass) {
    if (ssid === SCHOOL.ssid) { if (pass !== undefined && pass !== SCHOOL.pass) return 'pass'; this.phone.wifi = ssid; this.ver++; return 'ok'; }
    const m = this.esp(); const ap = m && this.running() && apUp(m) ? m.wifi.ap : null;
    if (!ap || ap.ssid !== ssid) return 'gone';
    if (ap.pass && pass !== ap.pass) return 'pass';
    this.phone.wifi = ssid; this.ver++; return 'ok';
  }
  // the phone's browser asks for a page: cb({ code, type, body, headers } | { error })
  request(url, cb) {
    const u = parseUrl(url); const req = { url, host: u.host, path: u.path, args: u.args, method: 1, t0: this.now, cb, res: null, srv: null };
    this.reqs.push(req); this.ver++;
    if (!u.host) { req.fail = 'name'; req.failAt = this.now + 0.3; return req; }
    if (!/^\d+\.\d+\.\d+\.\d+$/.test(u.host)) { req.fail = 'name'; req.failAt = this.now + 1.2; return req; }
    const m = this.esp(); const onAp = m && m.wifi.ap && this.phone.wifi === m.wifi.ap.ssid;
    if (onAp && !(this.running() && apUp(m))) this.phone.wifi = SCHOOL.ssid; // the ESP32's own network is gone: the phone goes back to the school WiFi
    const target = this.phone.wifi === SCHOOL.ssid ? this.staIP() : this.apIP();
    if (!m || !target || u.host !== target || (u.port && u.port !== 80)) { req.fail = 'timeout'; req.failAt = this.now + 4.0; return req; }
    const srv = [...m.webs, ...m.asyncs].find((s) => s.began && s.port === 80);
    if (!srv) { req.fail = 'refused'; req.failAt = this.now + 0.4; return req; }
    req.srv = srv; srv.q.push(req); return req;
  }
  deliver(req) { if (!req.doneAt) req.doneAt = this.now + 0.035; }
  tick(dt) {
    this.now += dt;
    for (let i = this.reqs.length - 1; i >= 0; i--) {
      const r = this.reqs[i]; let out = null;
      if (r.res && r.doneAt !== undefined && this.now >= r.doneAt) out = r.res;
      else if (r.fail && this.now >= r.failAt) out = { error: r.fail };
      else if (!r.res && this.now - r.t0 > 5) { out = { error: 'timeout' }; if (r.srv) { r.srv.q = r.srv.q.filter((x) => x !== r); if (!r.srv.polled) { const m = this.esp(); if (m && !m.warned.has('nohandle')) { m.warned.add('nohandle'); m.note('N_NO_HANDLE', {}); } } } }
      if (!out) continue;
      this.reqs.splice(i, 1); this.ver++;
      if (!out.error) { this.seen.pages++; this.seen.codes.push(out.code); if (this.seen.codes.length > 50) this.seen.codes.shift(); this.seen.last = { path: r.path, args: r.args, t: this.now, body: out.body }; (this.seen.paths || (this.seen.paths = {}))[r.path] = ((this.seen.paths || {})[r.path] || 0) + 1; }
      try { r.cb(out); } catch (e) { console.error(e); }
    }
    // Bluetooth: the link drops when the ESP32 restarts or stops
    if (this.bt.conn) { const m = this.esp(); if (!this.running() || !m.bt || !m.bt.on || m.bt !== this.bt.obj) { this.bt.conn = null; this.bt.log.push({ sys: 'lost' }); this.ver++; } }
  }
  // Bluetooth: the phone's terminal app
  btDevices() { const m = this.esp(); return m && this.running() && m.bt && m.bt.on ? [m.bt.name] : []; }
  btConnect(name) { if (!this.btDevices().includes(name)) return false; this.bt.conn = name; this.bt.obj = this.esp().bt; this.bt.log.push({ sys: 'conn', name }); this.ver++; return true; }
  btDisconnect() { if (this.bt.conn) { this.bt.conn = null; this.bt.log.push({ sys: 'disc' }); this.ver++; } }
  btSend(text) {
    const m = this.esp(); if (!this.bt.conn || !m || !m.bt) return false;
    m.bt.send(String(text) + '\r\n'); this.bt.log.push({ me: true, text: String(text) }); this.bt.sent = (this.bt.sent || 0) + 1; this.ver++;
    if (this.bt.log.length > 200) this.bt.log.splice(0, 50); return true;
  }
  btFromEsp(m, chunks) {
    if (!this.bt.conn || m.bt !== this.bt.obj) return; // nobody is listening: the bytes are lost
    let s = ''; for (const o of chunks) s += String.fromCharCode(...o.bytes);
    this.bt.part = (this.bt.part || '') + s.replace(/\r/g, ''); const lines = this.bt.part.split('\n'); this.bt.part = lines.pop();
    for (const ln of lines) this.bt.log.push({ text: ln }); this.bt.got = (this.bt.got || 0) + lines.length;
    if (this.bt.log.length > 200) this.bt.log.splice(0, 50); this.ver++;
  }
}
export function parseUrl(url) {
  let s = String(url || '').trim(); s = s.replace(/^https?:\/\//i, '');
  const slash = s.indexOf('/'); const hp = slash < 0 ? s : s.slice(0, slash); let rest = slash < 0 ? '/' : s.slice(slash);
  const [host, port] = hp.split(':'); const q = rest.indexOf('?'); const args = {};
  if (q >= 0) { for (const kv of rest.slice(q + 1).split('&')) { if (!kv) continue; const [k, v] = kv.split('='); try { args[decodeURIComponent(k)] = v === undefined ? '' : decodeURIComponent(v.replace(/\+/g, ' ')); } catch (e) { args[k] = v || ''; } } rest = rest.slice(0, q); }
  return { host: host.toLowerCase(), port: port ? +port : 0, path: rest || '/', args };
}

// ------------------------------------------------------------------ the board on the bench: pin clamps and 3.3 V warnings
export const WARN = {
  pin5v: t3('{v} V is reaching GPIO {pin}! ESP32 pins take at most 3.6 V: current is flowing into the chip. Use a 3.3 V part, or a divider (1 kΩ + 2 kΩ) on the signal.', 'GPIO {pin} पर {v} V आ रहा है! ESP32 के पिन ज़्यादा से ज़्यादा 3.6 V सहते हैं: करंट चिप के अंदर जा रहा है। 3.3 V वाला पुर्ज़ा लीजिए, या सिग्नल पर डिवाइडर (1 kΩ + 2 kΩ) लगाइए।', 'GPIO {pin} par {v} V aa raha hai! ESP32 ke pins zyada se zyada 3.6 V sehte hain: current chip ke andar ja raha hai. 3.3 V wala part lijiye, ya signal par divider (1 kΩ + 2 kΩ) lagaiye.'),
  vin33: t3('VIN (5 V) is joined to 3V3: that pushes 5 V into the ESP32 and can burn it. Remove that wire.', 'VIN (5 V), 3V3 से जुड़ गया है: इससे ESP32 में 5 V जाता है और वह जल सकता है। वह वायर हटाइए।', 'VIN (5 V), 3V3 se jud gaya hai: isse ESP32 mein 5 V jaata hai aur woh jal sakta hai. Woh wire hataiye.'),
  need5: t3('The {x} needs 5 V, but it gets only 3.3 V from the 3V3 pin. Wire its {p} to VIN (5 V from the USB).', '{x} को 5 V चाहिए, पर 3V3 पिन से इसे सिर्फ़ 3.3 V मिल रहा है। इसका {p} VIN (USB से 5 V) से जोड़िए।', '{x} ko 5 V chahiye, par 3V3 pin se ise sirf 3.3 V mil raha hai. Iska {p} VIN (USB se 5 V) se jodiye.'),
  pass: t3('The router says: the ESP32 tried to join "{ssid}" with a wrong password. Check the password in your sketch (it is on the router\'s sticker).', 'राउटर कहता है: ESP32 ने "{ssid}" से ग़लत पासवर्ड के साथ जुड़ने की कोशिश की। स्केच में पासवर्ड जाँचिए (वह राउटर के स्टिकर पर लिखा है)।', 'Router kehta hai: ESP32 ne "{ssid}" se galat password ke saath judne ki koshish ki. Sketch mein password check kijiye (woh router ke sticker par likha hai).'),
};
const FIVE = { hcsr04: ['VCC', t3('ultrasonic sensor', 'अल्ट्रासोनिक सेंसर', 'ultrasonic sensor')], servo: ['VP', t3('servo', 'सर्वो', 'servo')], lm35: ['VS', t3('LM35', 'LM35', 'LM35')], motor: ['P', t3('motor', 'मोटर', 'motor')], relay4: ['VCC', t3('relay module', 'रिले मॉड्यूल', 'relay module')] };
LAB_HOOKS.push({
  elements(lab, els, G) {
    if (!(lab.mcu instanceof ESP32MCU)) return;
    for (let i = 0; i < 40; i++) {
      if (!PIN_OF[i] || !lab.used('N:G' + i)) continue;
      const n = G('G' + i); els.push({ type: 'D', a: n, b: G('3V3'), vf: 0.6, rs: 30, role: 'clamp', pin: i }, { type: 'D', a: 0, b: n, vf: 0.6, rs: 30, role: 'clampg', pin: i });
    }
  },
  dynamics(lab, dt) {
    if (lab.net4) lab.net4.tick(dt);
    if (!(lab.mcu instanceof ESP32MCU) || !lab.powered) return;
    const once = (k, msg, args) => { const w = lab.warned4 || (lab.warned4 = new Set()); if (w.has(k)) return; w.add(k); lab.emit('warn', { msg, args }); };
    const V = lab.V; const vAt = (n) => (V && n < V.length ? V[n] : 0);
    for (const e of lab.els) if (e.role === 'clamp' && (e.iAvg || 0) > 0.0004) once('5v' + e.pin + ':' + lab.version, WARN.pin5v, { pin: e.pin, v: vAt(e.a).toFixed(1) });
    if (lab.conn('B:VIN', 'B:3V3')) once('vin33:' + lab.version, WARN.vin33, {});
    for (const p of lab.parts) {
      const f = FIVE[p.type]; if (!f || !p.ep || !p.ep[f[0]]) continue;
      if (lab.conn(p.ep[f[0]], 'B:3V3')) once('need5' + p.uid + ':' + lab.version, WARN.need5, { x: f[1], p: f[0] });
    }
  },
});
