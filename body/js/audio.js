// Body sounds (heartbeat, breathing) and the teacher narration (recorded mp3, with the device voice as a fallback).
const SILENT = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';

export class Audio {
  constructor() {
    this.ctx = null;
    this.sfx = true;
    this.voice = true;
    this.voices = [];
    this.na = new window.Audio();
    this.na.preload = 'auto';
    this.naToken = 0;
    if ('speechSynthesis' in window) {
      const load = () => { this.voices = speechSynthesis.getVoices(); };
      load(); speechSynthesis.onvoiceschanged = load;
    }
  }
  unlock() {
    if (!this.ctx) {
      const C = window.AudioContext || window.webkitAudioContext;
      if (C) {
        this.ctx = new C();
        this.master = this.ctx.createGain(); this.master.gain.value = 0.55; this.master.connect(this.ctx.destination);
        const len = this.ctx.sampleRate * 2; const b = this.ctx.createBuffer(1, len, this.ctx.sampleRate); const d = b.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
        this.noise = b;
      }
      // unlock the narration element inside this user gesture
      if (!this.na.src || this.na.src === location.href) { try { this.na.src = SILENT; this.na.play().catch(() => {}); } catch (e) {} }
      this.unlocked = true;
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  }
  duck(on) { if (this.master) this.master.gain.value = on ? 0.25 : 0.55; }
  thump(freq, gain, dur) {
    if (!this.ctx || !this.sfx) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(freq * 1.6, t); o.frequency.exponentialRampToValueAtTime(freq, t + 0.05);
    const g = this.ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    const f = this.ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 180;
    o.connect(f).connect(g).connect(this.master); o.start(t); o.stop(t + dur + 0.05);
  }
  lub() { this.thump(52, 0.9, 0.16); }
  dub() { this.thump(70, 0.55, 0.11); }
  breath(dur, inhale) {
    if (!this.ctx || !this.sfx) return;
    const t = this.ctx.currentTime;
    const s = this.ctx.createBufferSource(); s.buffer = this.noise; s.loop = true;
    const f = this.ctx.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 0.7;
    f.frequency.setValueAtTime(inhale ? 700 : 900, t); f.frequency.linearRampToValueAtTime(inhale ? 1300 : 500, t + dur);
    const g = this.ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(inhale ? 0.09 : 0.07, t + dur * 0.35); g.gain.linearRampToValueAtTime(0.0001, t + dur);
    s.connect(f).connect(g).connect(this.master); s.start(t); s.stop(t + dur + 0.1);
  }
  breathIn(d) { this.breath(d, true); }
  breathOut(d) { this.breath(d, false); }
  chime() {
    if (!this.ctx || !this.sfx) return;
    const t = this.ctx.currentTime;
    [660, 990].forEach((fr, i) => {
      const o = this.ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = fr;
      const g = this.ctx.createGain(); g.gain.setValueAtTime(0.0001, t + i * 0.07); g.gain.exponentialRampToValueAtTime(0.08, t + i * 0.07 + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.07 + 0.35);
      o.connect(g).connect(this.master); o.start(t + i * 0.07); o.stop(t + i * 0.07 + 0.4);
    });
  }
  // teacher narration: play the recorded file; if it is missing or fails, use the device voice.
  // resolves true when the narration finished playing, false when it could not play.
  narrate(url, text, lang) {
    this.stopSpeech();
    if (!this.voice) return Promise.resolve(false);
    const token = ++this.naToken;
    return new Promise((res) => {
      if (!url) { this.say(text, lang).then(res); return; }
      const a = this.na;
      let done = false;
      const finish = (ok) => { if (done) return; done = true; a.onended = a.onerror = null; this.duck(false); res(ok); };
      a.onended = () => finish(true);
      a.onerror = () => { if (token !== this.naToken) return finish(false); done = true; this.duck(false); this.say(text, lang).then(res); };
      a.src = url;
      a.currentTime = 0;
      this.duck(true);
      const p = a.play();
      if (p && p.catch) p.catch(() => { if (token !== this.naToken) return finish(false); done = true; this.duck(false); this.say(text, lang).then(res); });
    });
  }
  say(text, lang) {
    return new Promise((res) => {
      if (!this.voice || !('speechSynthesis' in window) || !text) return res(false);
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      const want = lang === 'en' ? ['en-IN', 'en-GB', 'en-US', 'en'] : ['hi-IN', 'hi'];
      const v = want.map((w) => this.voices.find((x) => x.lang && x.lang.replace('_', '-').startsWith(w))).find(Boolean);
      if (!v) return res(false);
      u.voice = v; u.lang = v.lang;
      u.rate = lang === 'en' ? 0.95 : 0.92;
      u.onend = () => res(true); u.onerror = () => res(false);
      speechSynthesis.speak(u);
    });
  }
  stopSpeech() {
    this.naToken++;
    try { this.na.onended = this.na.onerror = null; this.na.pause(); } catch (e) {}
    this.duck(false);
    if ('speechSynthesis' in window) speechSynthesis.cancel();
  }
}
