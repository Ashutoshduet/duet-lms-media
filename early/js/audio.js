// DUET Little Learners: the spoken clips (Piper voices made offline, early/voice/<lang>/<hash>.mp3) and two small sounds.
// say() takes one text or a list; each item is {en, hi} (the app's language is chosen) or only one of them (always that
// voice). A new say() stops the one before. When a clip is missing, the phone's own voice reads the text, if it has one.
export const vkey = (s) => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0; return h.toString(36); };

export class Audio {
  constructor(app) {
    this.app = app; this.set = null; this.el = new window.Audio(); this.el.preload = 'auto'; this.token = 0; this.muted = false; this.ctx = null; this.onText = null;
    this.ready = fetch('voice/manifest.json').then((r) => (r.ok ? r.json() : [])).then((a) => { this.set = new Set(a); }).catch(() => { this.set = new Set(); });
    this.played = []; // for the tests: every clip asked for, and whether it was found
  }
  unlock() {
    if (this.unlocked) return; this.unlocked = true;
    try { this.ctx = this.ctx || new (window.AudioContext || window.webkitAudioContext)(); this.ctx.resume(); } catch (e) { /* no web audio */ }
    try { this.el.muted = true; this.el.play().catch(() => {}); this.el.pause(); this.el.muted = false; } catch (e) { /* fine */ }
  }
  pick(item) { // -> [{lang, text}] for one item
    const L = this.app.lang; if (!item) return [];
    if (typeof item === 'string') return [{ lang: L, text: item }];
    if (item.en && item.hi) return [{ lang: L, text: item[L] }];
    if (item.hi) return [{ lang: 'hi', text: item.hi }]; if (item.en) return [{ lang: 'en', text: item.en }]; return [];
  }
  url(lang, text) { const k = vkey(text); return this.set && this.set.has(lang + '/' + k) ? `voice/${lang}/${k}.mp3` : null; }
  stop() { this.token++; try { this.el.pause(); } catch (e) { /* none */ } try { speechSynthesis.cancel(); } catch (e) { /* none */ } }
  async say(items, o = {}) {
    await this.ready; const my = ++this.token; try { this.el.pause(); } catch (e) { /* none */ }
    const list = [].concat(items).flatMap((it) => this.pick(it));
    for (const { lang, text } of list) {
      if (my !== this.token) return false;
      if (this.onText && o.caption !== false) this.onText(text, lang);
      const u = this.url(lang, text); this.played.push({ lang, text, found: !!u });
      if (this.muted) { await wait(Math.min(2500, 300 + text.length * 45)); continue; }
      if (u) await this.play(u, my); else await this.tts(text, lang, my);
    }
    return my === this.token;
  }
  play(u, my) {
    return new Promise((res) => { const el = this.el; let done = false; const end = () => { if (done) return; done = true; el.onended = el.onerror = null; clearTimeout(t); res(); };
      el.onended = end; el.onerror = end; el.src = u; const t = setTimeout(end, 20000); el.play().catch(end); const watch = setInterval(() => { if (my !== this.token) { clearInterval(watch); end(); } if (done) clearInterval(watch); }, 120); });
  }
  tts(text, lang, my) {
    return new Promise((res) => { try { const s = window.speechSynthesis; if (!s) return res(); const u = new SpeechSynthesisUtterance(text); u.lang = lang === 'hi' ? 'hi-IN' : 'en-IN'; u.rate = 0.92;
      const v = s.getVoices().find((x) => x.lang && x.lang.toLowerCase().startsWith(lang)); if (v) u.voice = v; u.onend = u.onerror = () => res(); s.speak(u); setTimeout(res, 300 + text.length * 90); } catch (e) { res(); } });
  }
  // little sounds made on the spot (no files)
  tone(freqs, dur = 0.12, type = 'sine', gain = 0.12) {
    if (!this.ctx || this.muted) return; const c = this.ctx, t0 = c.currentTime;
    freqs.forEach((f, i) => { const o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.value = f; const s = t0 + i * dur * 0.8;
      g.gain.setValueAtTime(0, s); g.gain.linearRampToValueAtTime(gain, s + 0.015); g.gain.exponentialRampToValueAtTime(0.0008, s + dur * 1.6); o.connect(g).connect(c.destination); o.start(s); o.stop(s + dur * 1.7); });
  }
  click() { this.tone([660], 0.05, 'triangle', 0.06); }
  yay() { this.tone([523, 659, 784, 1047], 0.13, 'triangle', 0.1); }
  oops() { this.tone([330, 262], 0.16, 'sine', 0.08); }
  plop() { this.tone([420 + Math.random() * 120], 0.07, 'sine', 0.09); }
  chop() { if (!this.ctx || this.muted) return; const c = this.ctx, n = c.createBufferSource(), b = c.createBuffer(1, 4000, c.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / 500); n.buffer = b; const g = c.createGain(); g.gain.value = 0.25; n.connect(g).connect(c.destination); n.start(); }
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
