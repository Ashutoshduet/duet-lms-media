// DUET Robotics Lab 360: sounds. A passive buzzer driven by tone() (a square wave through a small speaker's filter),
// the servo's gears, the motor's hum, the pop of a burnt LED and the click of a button. WebAudio, made in code.
export class Sound {
  constructor() { this.on = true; this.ctx = null; this.voices = new Map(); }
  unlock() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {}); return; }
    const C = window.AudioContext || window.webkitAudioContext; if (!C) return;
    try { this.ctx = new C(); this.master = this.ctx.createGain(); this.master.gain.value = 0.5; this.master.connect(this.ctx.destination); } catch (e) { this.ctx = null; }
  }
  voice(id, kind) {
    let v = this.voices.get(id); if (v) return v;
    const c = this.ctx; const o = c.createOscillator(), f = c.createBiquadFilter(), g = c.createGain();
    o.type = kind === 'tone' ? 'square' : 'sawtooth';
    f.type = kind === 'tone' ? 'bandpass' : 'lowpass'; f.frequency.value = kind === 'tone' ? 2700 : 600; f.Q.value = kind === 'tone' ? 0.6 : 0.8;
    g.gain.value = 0; o.connect(f); f.connect(g); g.connect(this.master); o.start();
    v = { o, f, g, kind, seen: 0 }; this.voices.set(id, v); return v;
  }
  // every frame: the sounds the bench makes now ([{ id, kind, f, amp }])
  update(list, speed) {
    if (!this.ctx || !this.on) { if (this.ctx) for (const v of this.voices.values()) v.g.gain.value = 0; return; }
    const t = this.ctx.currentTime, seen = new Set();
    for (const s of list) {
      const v = this.voice(s.id + s.kind, s.kind); seen.add(s.id + s.kind);
      const f = s.kind === 'servo' ? 140 + 40 * Math.random() : Math.max(20, Math.min(12000, s.f));
      v.o.frequency.setTargetAtTime(f, t, s.kind === 'tone' ? 0.002 : 0.05);
      const g = s.kind === 'tone' ? 0.16 * s.amp : s.kind === 'motor' ? 0.05 * s.amp : 0.035;
      v.g.gain.setTargetAtTime(g, t, 0.006);
    }
    for (const [k, v] of this.voices) if (!seen.has(k)) v.g.gain.setTargetAtTime(0, t, 0.01);
  }
  silence() { if (!this.ctx) return; for (const v of this.voices.values()) v.g.gain.setTargetAtTime(0, this.ctx.currentTime, 0.01); }
  pop() { // a burnt LED: a sharp crack of noise
    if (!this.ctx || !this.on) return; const c = this.ctx, n = c.sampleRate * 0.25, b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 6);
    const s = c.createBufferSource(), g = c.createGain(), f = c.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 900; g.gain.value = 0.9; s.buffer = b; s.connect(f); f.connect(g); g.connect(this.master); s.start();
  }
  click() { if (!this.ctx || !this.on) return; const c = this.ctx, o = c.createOscillator(), g = c.createGain(); o.frequency.value = 2400; g.gain.setValueAtTime(0.08, c.currentTime); g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.03); o.connect(g); g.connect(this.master); o.start(); o.stop(c.currentTime + 0.04); }
}
