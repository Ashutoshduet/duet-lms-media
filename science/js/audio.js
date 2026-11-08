// Lab sounds made in WebAudio (no files): pouring, glass clink, hydrogen pop, lamp lighting, fizz, crackle, hiss.
// Narration uses recorded mp3 files when present, otherwise the device voice.
const SILENT = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';

export class Audio {
  constructor() { this.ctx = null; this.sfx = true; this.voice = true; this.rate = 1; this.na = new window.Audio(); this.na.preload = 'auto'; this.tok = 0; this.pourT = 0; }
  unlock() {
    if (!this.ctx) {
      const C = window.AudioContext || window.webkitAudioContext; if (!C) return;
      this.ctx = new C(); this.master = this.ctx.createGain(); this.master.gain.value = 0.6; this.master.connect(this.ctx.destination);
      const len = this.ctx.sampleRate * 2; const b = this.ctx.createBuffer(1, len, this.ctx.sampleRate); const d = b.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1; this.noise = b;
      // continuous pour + fizz voices, gated per frame
      const mk = (type, f, q) => { const s = this.ctx.createBufferSource(); s.buffer = b; s.loop = true; const fl = this.ctx.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q; const g = this.ctx.createGain(); g.gain.value = 0; s.connect(fl).connect(g).connect(this.master); s.start(); return g; };
      this.pourG = mk('bandpass', 900, 1.2); this.fizzG = mk('highpass', 4200, 0.7);
      try { this.na.src = SILENT; this.na.play().catch(() => {}); } catch (e) {}
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }
  tone(freq, dur, gain = 0.2, type = 'sine', f2) {
    if (!this.ctx || !this.sfx) return; const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(freq, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    const g = this.ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.master); o.start(t); o.stop(t + dur + 0.02);
  }
  burst(dur, f, gain, type = 'lowpass') {
    if (!this.ctx || !this.sfx) return; const t = this.ctx.currentTime;
    const s = this.ctx.createBufferSource(); s.buffer = this.noise; const fl = this.ctx.createBiquadFilter(); fl.type = type; fl.frequency.value = f;
    const g = this.ctx.createGain(); g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(fl).connect(g).connect(this.master); s.start(t, Math.random()); s.stop(t + dur + 0.02);
  }
  clink() { this.tone(2600 + Math.random() * 600, 0.25, 0.08, 'sine'); this.tone(4100, 0.15, 0.04, 'sine'); }
  pop() { this.burst(0.18, 2200, 0.9); this.tone(180, 0.12, 0.5, 'sine', 60); }
  whoosh() { this.burst(0.5, 600, 0.25, 'bandpass'); }
  crackle() { for (let i = 0; i < 3; i++) setTimeout(() => this.burst(0.03, 3000, 0.25, 'highpass'), i * 40 + Math.random() * 60); }
  hiss() { this.burst(0.8, 5000, 0.12, 'highpass'); }
  // per-frame levels
  frame(pouring, bubbles) {
    if (!this.ctx) return; const t = this.ctx.currentTime;
    this.pourG.gain.setTargetAtTime(this.sfx && pouring ? 0.22 : 0, t, 0.05);
    this.fizzG.gain.setTargetAtTime(this.sfx ? Math.min(0.12, bubbles * 0.0006) : 0, t, 0.1);
  }
  pour() { this.pourT = 0.08; }
  // narration
  stop() { this.tok++; if (this._res) { const r = this._res; this._res = null; r(); } try { this.na.pause(); } catch (e) {} if ('speechSynthesis' in window) speechSynthesis.cancel(); }
  say(url, text, lang) {
    this.stop(); if (!this.voice) return Promise.resolve();
    const tok = this.tok;
    return new Promise((res0) => {
      const res = () => { if (this._res === res) this._res = null; res0(); }; this._res = res;
      const fallback = () => {
        if (tok !== this.tok || !('speechSynthesis' in window) || !text) return res();
        const u = new SpeechSynthesisUtterance(text); u.lang = lang === 'en' ? 'en-IN' : 'hi-IN'; u.rate = 0.95 * this.rate;
        const v = speechSynthesis.getVoices().find((x) => x.lang && x.lang.toLowerCase().startsWith(u.lang.slice(0, 2))); if (v) u.voice = v;
        u.onend = u.onerror = () => res(); speechSynthesis.speak(u);
      };
      if (!url) return fallback();
      this.na.src = url; this.na.playbackRate = this.rate; this.na.onended = () => res(); this.na.onerror = () => fallback();
      this.na.play().catch(() => fallback());
    });
  }
}
