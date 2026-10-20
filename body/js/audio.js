// Synthesised body sounds (heartbeat, breathing) and spoken narration.
export class Audio {
  constructor() {
    this.ctx = null;
    this.sfx = true;
    this.voice = true;
    this.lang = 'en';
    this.voices = [];
    if ('speechSynthesis' in window) {
      const load = () => { this.voices = speechSynthesis.getVoices(); };
      load(); speechSynthesis.onvoiceschanged = load;
    }
  }
  unlock() {
    if (!this.ctx) {
      const C = window.AudioContext || window.webkitAudioContext;
      if (!C) return;
      this.ctx = new C();
      this.master = this.ctx.createGain(); this.master.gain.value = 0.55; this.master.connect(this.ctx.destination);
      // shared noise buffer
      const len = this.ctx.sampleRate * 2; const b = this.ctx.createBuffer(1, len, this.ctx.sampleRate); const d = b.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      this.noise = b;
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }
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
  // narration; resolves when finished (or immediately if unavailable)
  say(text, lang) {
    return new Promise((res) => {
      if (!this.voice || !('speechSynthesis' in window) || !text) return res(false);
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      const want = lang === 'hi' ? ['hi-IN', 'hi'] : ['en-IN', 'en-GB', 'en-US', 'en'];
      const v = want.map((w) => this.voices.find((x) => x.lang && x.lang.replace('_', '-').startsWith(w))).find(Boolean);
      if (v) u.voice = v;
      u.lang = v ? v.lang : (lang === 'hi' ? 'hi-IN' : 'en-IN');
      u.rate = lang === 'hi' ? 0.92 : 0.95;
      u.onend = () => res(true); u.onerror = () => res(false);
      this.speaking = u;
      speechSynthesis.speak(u);
    });
  }
  hasVoice(lang) {
    const want = lang === 'hi' ? 'hi' : 'en';
    return this.voices.some((v) => v.lang && v.lang.startsWith(want));
  }
  stopSpeech() { if ('speechSynthesis' in window) speechSynthesis.cancel(); }
}
