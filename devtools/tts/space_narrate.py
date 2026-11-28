"""Space Lab narration (offline), every language:
   English   Piper TTS (MIT) with the LJSpeech voice (public domain), as in the other DUET apps
   Hindi, Hinglish   the DUET Hindi voice, Kokoro-82M (kokoro_hi.py, Apache-2.0)
(The first recordings used Piper's lessac voice, whose dataset is licensed for research only, and the CC BY-NC-SA Hindi
voice: neither may be used for DUET clips.)
   python3 devtools/tts/space_narrate.py [en|hi|hg] [id …]      (all languages / all clips when none is given)
Texts: devtools/tts/space_narration.json = {"en"|"hi"|"hg": {id: text}, "countdown": {"en"|"hi"|"hg": [words]}}.
Hindi and Hinglish are written in Devanagari (Hinglish too: English words spelled the way Indian teachers say them), with
numbers as words. Voices: $DUET_VOICES or ~/duet-voices (en_US-ljspeech-high.onnx and the Kokoro files).
Writes space/audio/<lang>/<id>.mp3 (mono 22050 Hz, 40 kbit/s).
ui-countdown is timed to the launch pad, which shows 10 … 0 one per second and lifts off at 9.8 s: each number starts on its
second (0.15 s + i), the last word at 11.4 s, 12.62 s in all. The line is spoken once (Kokoro reads single words poorly),
cut at its pauses, and each word is put on its beat."""
import json, os, re, subprocess, sys, tempfile, wave
import numpy as np
HERE = os.path.dirname(os.path.abspath(__file__)); REPO = os.path.abspath(os.path.join(HERE, '..', '..'))
sys.path.insert(0, HERE); from kokoro_hi import KokoroHindi, voices_dir
OUT = os.path.join(REPO, 'space', 'audio')
ONSETS = [0.15 + i for i in range(11)] + [11.4]; TOTAL = 12.617
# English: how the voice should say what the texts spell (espeak reads "23 August" as "twenty-three August", "NavIC" as "Nav Ike")
MONTHS = 'January|February|March|April|May|June|July|August|September|October|November|December'
SAY = [(r'\bNavIC\b', 'Navik'), (r'\bSpaDeX\b', 'Spadex'), (r'\bDelta II\b', 'Delta Two'), (r'\bSaturn V\b', 'Saturn Five'),
       (r'\bAriane 64\b', 'Ariane six four'), (r"\bChang'e\b", 'Chang-uh'), (r'\bShubhanshu\b', 'Shubanshu'),
       (r'\bBahubali\b', 'Baahu-bali'), (r'\b100th\b', 'hundredth'), (r'\b(ESCAPADE|LUPEX|JAXA|MAVEN|OSIRIS)\b', lambda m: m[1].title())]
def ordinal(n):
    n = int(n); return f"{n}{'th' if 10 <= n % 100 <= 20 else {1: 'st', 2: 'nd', 3: 'rd'}.get(n % 10, 'th')}"
def say(t):
    for a, b in SAY: t = re.sub(a, b, t)
    t = re.sub(rf'\b(\d{{1,2}}) ({MONTHS})\b', lambda m: f'the {ordinal(m[1])} of {m[2]}', t)  # 23 August -> the 23rd of August
    t = re.sub(rf'\b({MONTHS}) (\d{{1,2}})\b', lambda m: f'{m[1]} {ordinal(m[2])}', t)          # July 20 -> July 20th
    return re.sub(r'(?<![\d,.])(1[1-9])([1-9]\d)(?!\d|,\d)', r'\1 \2', t)  # 1969 -> nineteen sixty-nine, not nineteen hundred and …


class English:
    """Piper LJSpeech at the Space Lab's old pace (length 1.05, a quarter second between sentences)"""
    def __init__(self):
        from piper import PiperVoice, SynthesisConfig
        d = next((x for x in [os.environ.get('DUET_VOICES'), os.path.expanduser('~/duet-voices'), '/root/tts/voices'] if x and os.path.exists(os.path.join(x, 'en_US-ljspeech-high.onnx'))), None)
        if not d: sys.exit('en_US-ljspeech-high.onnx not found: run devtools/setup.sh or set DUET_VOICES')
        self.v = PiperVoice.load(os.path.join(d, 'en_US-ljspeech-high.onnx')); self.cfg = SynthesisConfig(length_scale=1.05); self.sr = 22050
    def synth(self, text, gap=0.25, speed=None):
        parts = []
        for c in self.v.synthesize(say(text), syn_config=self.cfg):
            if parts: parts.append(np.zeros(int(self.sr * gap), np.float32))
            parts.append(c.audio_float_array.astype(np.float32)); self.sr = c.sample_rate
        a = np.concatenate(parts); peak = float(np.abs(a).max())
        return a * (0.9 / peak) if peak > 0.9 else a  # headroom: at 0.98 some clips decoded above full scale


class Hindi:
    def __init__(self): self.k = KokoroHindi(voices_dir()); self.sr = 24000
    def synth(self, text, gap=None, speed=None): return self.k.synth(text, speed=speed) if gap is None else self.k.synth(text, speed=speed, gap=gap)


def encode(a, sr, out, af='highpass=f=60,afade=t=in:d=0.03'):
    with tempfile.TemporaryDirectory() as d:
        wav = os.path.join(d, 'a.wav'); tmp = out + '.tmp.mp3'  # written next to the clip, then renamed: never half-written
        with wave.open(wav, 'wb') as w:
            w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr); w.writeframes((np.clip(a, -0.98, 0.98) * 32767).astype(np.int16).tobytes())
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', wav, '-af', af, '-ac', '1', '-ar', '22050', '-b:a', '40k', tmp], check=True)
        os.replace(tmp, out)


def split_words(a, sr, n):
    """the n spoken words of a line read with pauses: 20 ms frames above 1/20 of the loudest, gaps under 120 ms bridged"""
    fr = int(sr * 0.02); m = len(a) // fr
    e = np.sqrt(np.mean(a[:m * fr].reshape(-1, fr) ** 2, axis=1)); on = e > 0.05 * e.max()
    segs, i = [], 0
    while i < m:
        if not on[i]: i += 1; continue
        j = i
        while j < m and (on[j] or on[j:j + 6].any()): j += 1
        if (j - i) * fr > sr * 0.08: segs.append((max(0, i * fr - fr), min(len(a), j * fr + fr)))
        i = j
    return [a[s:t] for s, t in segs] if len(segs) == n else None


def countdown(v, words):
    sr = v.sr; parts = split_words(v.synth(' '.join(w if w[-1] in '.!?' else w + '.' for w in words), gap=0.25), sr, len(words)) or [v.synth(w + '.', speed=0.9) for w in words]
    out = np.zeros(int(sr * TOTAL), np.float32)
    for i, p in enumerate(parts[:len(ONSETS)]):
        s = int(sr * ONSETS[i]); end = int(sr * ONSETS[i + 1]) - int(sr * 0.04) if i + 1 < len(ONSETS) else len(out)
        p = p[:end - s].copy(); fade = min(400, len(p)); p[-fade:] *= np.linspace(1, 0, fade)  # never runs into the next beat
        out[s:s + len(p)] += p
    return out


def main():
    texts = json.load(open(os.path.join(HERE, 'space_narration.json'), encoding='utf-8'))
    langs = [sys.argv[1]] if len(sys.argv) > 1 else ['en', 'hi', 'hg']; only = set(sys.argv[2:])
    hindi = None
    for L in langs:
        v = English() if L == 'en' else (hindi := hindi or Hindi())
        os.makedirs(os.path.join(OUT, L), exist_ok=True)
        for i, t in sorted(texts[L].items()):
            if only and i not in only: continue
            encode(v.synth(t), v.sr, os.path.join(OUT, L, i + '.mp3')); print(L, i, flush=True)
        if (not only or 'ui-countdown' in only) and texts.get('countdown', {}).get(L):
            encode(countdown(v, texts['countdown'][L]), v.sr, os.path.join(OUT, L, 'ui-countdown.mp3'), af='highpass=f=60'); print(L, 'ui-countdown', flush=True)


if __name__ == '__main__': main()
