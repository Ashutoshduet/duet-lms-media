// Bluetooth controllers in every DUET AR mode: the small VR-box remotes and ordinary gamepads.
// Depending on its switch, a remote shows up as a Gamepad (game mode), as arrow/Enter keys (key mode) or as media and
// volume keys (music mode); this reads all three and turns them into the same few actions.
//
//   const pad = new BtPad({ onAction: (name, value) => … });  pad.start();   every frame: pad.update(dt);   pad.stop();
//
// Actions: 'turn' (value: radians, + = to the right), 'tilt' (radians, + = top towards you), 'zoom' (factor > 1 = bigger),
// 'next', 'prev', 'play' (play / pause), 'recenter', 'back', 'help'.
// Our mapping (designed for children: the stick or arrows always turn the model, the big button plays):
//   stick / arrows / D-pad left-right ... turn          stick / arrows up-down ... tilt
//   right stick up-down, RT / LT, D-pad up-down, + / -, volume up / down ... zoom in / out
//   A, Enter, Space, play/pause key ... play / pause     B, R, Home ... recenter
//   X, LB, previous-track key, P ... previous model        Y, RB, next-track key, N ... next model
//   Select / Back, Esc, Backspace ... back                 Start, H, ? ... help
// The phone's volume keys reach the page only inside the DUET app, and only while captureVolume(true) is on
// (the app's DuetNative.vrMode bridge); in a normal browser they keep changing the volume.

export const KEYS = {
  ArrowLeft: 'turnL', ArrowRight: 'turnR', ArrowUp: 'tiltU', ArrowDown: 'tiltD', a: 'turnL', d: 'turnR', w: 'tiltU', s: 'tiltD',
  '+': 'zoomI', '=': 'zoomI', '-': 'zoomO', _: 'zoomO', PageUp: 'zoomI', PageDown: 'zoomO', AudioVolumeUp: 'zoomI', AudioVolumeDown: 'zoomO', VolumeUp: 'zoomI', VolumeDown: 'zoomO',
  Enter: 'play', ' ': 'play', MediaPlayPause: 'play', MediaPlay: 'play', MediaPause: 'play', k: 'play',
  MediaTrackNext: 'next', MediaFastForward: 'next', n: 'next', MediaTrackPrevious: 'prev', MediaRewind: 'prev', p: 'prev',
  r: 'recenter', Home: 'recenter', c: 'recenter', Escape: 'back', Backspace: 'back', BrowserBack: 'back', GoBack: 'back', h: 'help', '?': 'help', F1: 'help',
};
// Gamepad buttons in the browser's "standard" layout (most remotes in game mode use the same numbers)
export const BUTTONS = { 0: 'play', 1: 'recenter', 2: 'prev', 3: 'next', 4: 'prev', 5: 'next', 6: 'zoomO', 7: 'zoomI', 8: 'back', 9: 'help', 10: 'recenter', 11: 'recenter', 12: 'zoomI', 13: 'zoomO', 14: 'turnL', 15: 'turnR', 16: 'recenter' };

const HOLD = { turnL: 1, turnR: 1, tiltU: 1, tiltD: 1, zoomI: 1, zoomO: 1 };   // these keep going while held
const STEP = { turn: Math.PI / 12, tilt: Math.PI / 18, zoom: 1.12 };          // one tap: 15°, 10°, ×1.12
const RATE = { turn: Math.PI / 2, tilt: Math.PI / 3, zoom: 1.8 };             // held: 90°/s, 60°/s, ×1.8 per second
const DEAD = 0.22;

export class BtPad {
  constructor(o = {}) {
    this.o = o; this.held = new Map(); this.prevButtons = new Map(); this.on = false; this.last = '';
    this.connected = false;
    this._kd = (e) => this.key(e, true); this._ku = (e) => this.key(e, false);
    this._gc = () => { this.connected = true; o.onConnect && o.onConnect(true); };
    this._gd = () => { this.connected = [...this.pads()].length > 0; o.onConnect && o.onConnect(this.connected); };
  }
  start() {
    if (this.on) return; this.on = true;
    addEventListener('keydown', this._kd, true); addEventListener('keyup', this._ku, true);
    addEventListener('gamepadconnected', this._gc); addEventListener('gamepaddisconnected', this._gd);
  }
  stop() {
    this.on = false; this.held.clear(); this.captureVolume(false);
    removeEventListener('keydown', this._kd, true); removeEventListener('keyup', this._ku, true);
    removeEventListener('gamepadconnected', this._gc); removeEventListener('gamepaddisconnected', this._gd);
  }
  /** inside the DUET Android app: the volume keys press instead of changing the volume (the app forwards them) */
  captureVolume(on) { try { if (window.DuetNative && window.DuetNative.vrMode) window.DuetNative.vrMode(!!on); } catch (e) { /* not in the app */ } this.volume = !!on; }
  fire(name, value) { this.last = name; if (this.o.onAction) this.o.onAction(name, value); }
  /** a named control: turnL/turnR/tiltU/tiltD/zoomI/zoomO (one step now) or a one-shot action */
  press(c) {
    if (c === 'turnL') this.fire('turn', -STEP.turn); else if (c === 'turnR') this.fire('turn', STEP.turn);
    else if (c === 'tiltU') this.fire('tilt', -STEP.tilt); else if (c === 'tiltD') this.fire('tilt', STEP.tilt);
    else if (c === 'zoomI') this.fire('zoom', STEP.zoom); else if (c === 'zoomO') this.fire('zoom', 1 / STEP.zoom);
    else this.fire(c);
  }
  key(e, down) {
    const t = e.target; if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
    const c = KEYS[e.key] || KEYS[e.code] || (e.key && KEYS[e.key.toLowerCase()]);
    if (!c) return;
    e.preventDefault(); e.stopPropagation();
    if (!down) { this.held.delete(c); return; }
    if (e.repeat && this.held.has(c)) return;       // auto-repeat: the held-key timer below does the moving
    if (HOLD[c]) this.held.set(c, performance.now());
    this.press(c);
  }
  *pads() { const g = navigator.getGamepads ? navigator.getGamepads() : []; for (const p of g) if (p && p.connected !== false) yield p; }
  /** call every frame: held keys and the gamepads' sticks move smoothly */
  update(dt) {
    if (!this.on) return;
    const now = performance.now();
    let turn = 0, tilt = 0, zoom = 0;
    for (const [c, t0] of this.held) {
      if (now - t0 < 260) continue;                  // a tap is one step; holding longer keeps it going
      if (c === 'turnL') turn -= 1; else if (c === 'turnR') turn += 1; else if (c === 'tiltU') tilt -= 1; else if (c === 'tiltD') tilt += 1; else if (c === 'zoomI') zoom += 1; else if (c === 'zoomO') zoom -= 1;
    }
    for (const p of this.pads()) {
      this.connected = true;
      const ax = p.axes || [], dz = (v) => (Math.abs(v || 0) < DEAD ? 0 : (v - Math.sign(v) * DEAD) / (1 - DEAD));
      turn += dz(ax[0]); tilt += dz(ax[1]);
      if (ax.length >= 4) { turn += dz(ax[2]); zoom -= dz(ax[3]); }
      const prev = this.prevButtons.get(p.index) || [];
      (p.buttons || []).forEach((b, i) => {
        const v = typeof b === 'object' ? b.value || (b.pressed ? 1 : 0) : b, down = v > 0.5, was = prev[i];
        const c = BUTTONS[i]; if (!c) return;
        if (HOLD[c]) { if (down) { if (c === 'turnL') turn -= 1; else if (c === 'turnR') turn += 1; else if (c === 'zoomI') zoom += 1; else if (c === 'zoomO') zoom -= 1; } }
        else if (down && !was) this.press(c);
      });
      this.prevButtons.set(p.index, (p.buttons || []).map((b) => (typeof b === 'object' ? (b.value || (b.pressed ? 1 : 0)) : b) > 0.5));
    }
    if (turn) this.fire('turn', turn * RATE.turn * dt);
    if (tilt) this.fire('tilt', tilt * RATE.tilt * dt);
    if (zoom) this.fire('zoom', Math.pow(RATE.zoom, zoom * dt));
  }
}

/** the mapping as rows for a help panel: [what, how in English, Hindi, Hinglish] */
export const HELP = [
  { act: { en: 'Turn the model', hi: 'मॉडल घुमाएँ', hg: 'Model ghumao' }, how: 'Stick · ← → · D-pad' },
  { act: { en: 'Tilt', hi: 'झुकाएँ', hg: 'Jhukao' }, how: 'Stick · ↑ ↓' },
  { act: { en: 'Zoom in / out', hi: 'बड़ा / छोटा', hg: 'Bada / chhota' }, how: 'RT / LT · Vol + / − · + / −' },
  { act: { en: 'Play / pause', hi: 'चलाएँ / रोकें', hg: 'Chalao / roko' }, how: 'A · Enter · ⏯' },
  { act: { en: 'Next / previous model', hi: 'अगला / पिछला मॉडल', hg: 'Agla / pichhla model' }, how: 'Y / X · RB / LB · ⏭ / ⏮' },
  { act: { en: 'Recenter', hi: 'बीच में लाएँ', hg: 'Beech mein lao' }, how: 'B · R · Home' },
  { act: { en: 'Back', hi: 'वापस', hg: 'Wapas' }, how: 'Select · Esc' },
];
