"""The Hindi / Hinglish narration voice of every DUET app: Kokoro-82M (hexgrad, Apache-2.0), Hindi voice VOICE below,
run offline with ONNX Runtime. Drop-in for a Piper voice: KokoroHindi(dir).synthesize_wav(text, wave_writer).

Licence: model weights Apache-2.0 (https://huggingface.co/hexgrad/Kokoro-82M), ONNX export of the same weights
Apache-2.0 (https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX). Commercial use allowed; credit "Kokoro-82M by hexgrad".
(The Piper Hindi voices are CC BY-NC-SA 4.0, non-commercial: never use them for DUET clips.)

Files (devtools/setup.sh downloads them into $DUET_VOICES or ~/duet-voices):
  kokoro-v1.0.onnx         onnx-community/Kokoro-82M-v1.0-ONNX  onnx/model.onnx (fp32; the int8 file is slower on CPU)
  kokoro-<VOICE>.bin       onnx-community/Kokoro-82M-v1.0-ONNX  voices/<VOICE>.bin
  kokoro-config.json       hexgrad/Kokoro-82M                   config.json (the phoneme vocabulary)
Python: pip install onnxruntime numpy phonemizer-fork espeakng-loader

Text to phonemes is Kokoro's own Hindi front end (misaki EspeakG2P: espeak-ng 'hi', the same rules the voice was trained
on), with two DUET additions: the Hindi full stop । is made a sentence end (espeak drops it, so sentences ran together),
and long texts are cut at sentence ends into chunks the model handles well (Kokoro reads at most 510 phonemes at once
and rushes long inputs). Each chunk comes with about half a second of silence at both ends: it is trimmed, and chunks
are joined with PAUSE, the voice's own pause between sentences (untrimmed joins gave 1.2 s gaps). Peaks are kept at
PEAK, so the mp3 encoder never clips.

Chosen in Nov 2026 over the other Kokoro Hindi voices (hf_alpha, hf_beta, hm_psi) and the old voice by Whisper-medium
word / character error rate on 15 Hindi + 15 Hinglish clip texts: hm_omega Hindi 24.8 % / 8.6 %, Hinglish 25.6 % / 7.6 %;
old voice 35.6 % / 12.0 % and 38.9 % / 13.6 %. hf_alpha is the closest female voice (30.6 / 9.6, 27.0 / 7.5)."""
import json, os, re
import numpy as np

VOICE = 'hm_omega'
SPEED = 1.0          # 1.0 is about the pace of the old voice at length_scale 1.08
SR = 24000
PAUSE = 0.4          # seconds between chunks, as between sentences inside a chunk
PEAK = 0.9           # headroom for the mp3 encoder (at 0.98 some clips decoded above full scale)


def hp_peak(a, f=60.0):
    """peak after the 60 Hz high-pass every DUET generator applies (ffmpeg highpass=f=60): a plosive's low thump can
    turn into a spike above the raw peak"""
    w0 = 2 * np.pi * f / SR; al = np.sin(w0) / (2 * 0.7071); c = np.cos(w0); a0 = 1 + al
    b, den = np.array([(1 + c) / 2, -(1 + c), (1 + c) / 2]) / a0, np.array([1, -2 * c / a0, (1 - al) / a0])
    try:
        from scipy.signal import lfilter; y = lfilter(b, den, a)
    except ImportError:  # plain loop: about a second for a 30 s clip
        y = np.empty(len(a)); x1 = x2 = y1 = y2 = 0.0
        for n, xn in enumerate(a.tolist()):
            yn = b[0] * xn + b[1] * x1 + b[2] * x2 - den[1] * y1 - den[2] * y2; x2, x1, y2, y1 = x1, xn, y1, yn; y[n] = yn
    return float(np.abs(y).max())
FILES = {'model': 'kokoro-v1.0.onnx', 'config': 'kokoro-config.json', 'voice': f'kokoro-{VOICE}.bin'}
E2M = sorted({'a^ɪ': 'I', 'a^ʊ': 'W', 'd^z': 'ʣ', 'd^ʒ': 'ʤ', 'e^ɪ': 'A', 'o^ʊ': 'O', 'ə^ʊ': 'Q', 's^s': 'S', 't^s': 'ʦ', 't^ʃ': 'ʧ', 'ɔ^ɪ': 'Y'}.items())


def voices_dir(*extra):
    """the first folder that holds the Kokoro files: $DUET_VOICES, ~/duet-voices, /root/tts/voices, or one given"""
    for d in [*extra, os.environ.get('DUET_VOICES'), os.path.expanduser('~/duet-voices'), '/root/tts/voices']:
        if d and all(os.path.exists(os.path.join(d, f)) for f in FILES.values()): return d
    raise SystemExit(f'Kokoro files not found ({", ".join(FILES.values())}): run devtools/setup.sh or set DUET_VOICES')


def front(t):
    """text fixes for this voice only (the screen text and the generators' own word lists are unchanged)"""
    return re.sub(r'\s+', ' ', t.replace('॥', '.').replace('।', '.')).strip()


class KokoroHindi:
    def __init__(self, folder=None, speed=SPEED, threads=1):
        import espeakng_loader, onnxruntime as ort
        from phonemizer.backend.espeak.wrapper import EspeakWrapper
        EspeakWrapper.set_library(espeakng_loader.get_library_path()); EspeakWrapper.set_data_path(espeakng_loader.get_data_path())
        from phonemizer.backend import EspeakBackend
        d = folder or voices_dir()
        self.vocab = json.load(open(os.path.join(d, FILES['config'])))['vocab']
        self.style = np.fromfile(os.path.join(d, FILES['voice']), dtype=np.float32).reshape(-1, 256)
        so = ort.SessionOptions(); so.intra_op_num_threads = threads; so.inter_op_num_threads = 1
        self.sess = ort.InferenceSession(os.path.join(d, FILES['model']), so, providers=['CPUExecutionProvider'])
        self.be = EspeakBackend(language='hi', preserve_punctuation=True, with_stress=True, tie='^', language_switch='remove-flags')
        self.speed = speed

    def g2p(self, text):
        text = text.replace('«', chr(8220)).replace('»', chr(8221)).replace('(', '«').replace(')', '»')
        ps = self.be.phonemize([text]); ps = ps[0].strip() if ps else ''
        for a, b in E2M: ps = ps.replace(a, b)
        # ड़ / ढ़ stay as espeak writes them ("r.", "r.h"): the voice was trained on that, and Kokoro's own ɽ tested worse
        return ps.replace('^', '').replace('-', '').replace('«', '(').replace('»', ')')

    def chunks(self, text, maxtok=300):
        """sentences grouped up to maxtok phonemes; a sentence over 500 is cut at commas"""
        pieces = []
        for s in [s for s in re.split(r'(?<=[.!?])\s+', text) if s.strip()]:
            ps = self.g2p(s)
            if len(ps) <= 500: pieces.append(ps); continue
            cur = ''
            for p in [p for p in re.split(r'(?<=[,;:])\s+', s) if p.strip()]:
                if cur and len(self.g2p(cur + ' ' + p)) > 480: pieces.append(self.g2p(cur)); cur = p
                else: cur = (cur + ' ' + p).strip()
            if cur: pieces.append(self.g2p(cur))
        out, cur = [], ''
        for ps in pieces:
            if cur and len(cur) + 1 + len(ps) > maxtok: out.append(cur); cur = ps
            else: cur = (cur + ' ' + ps).strip()
        return out + ([cur] if cur else [])

    @staticmethod
    def trim(w, lead=0.08, tail=0.15, thr=0.004):
        """cut the silence Kokoro puts at both ends of a chunk, keeping a little before the first and after the last sound"""
        fr = int(SR * 0.01); e = np.sqrt(np.mean(w[:len(w) // fr * fr].reshape(-1, fr) ** 2, axis=1)); v = np.where(e > thr)[0]
        if not len(v): return w
        return w[max(0, v[0] * fr - int(SR * lead)):min(len(w), (v[-1] + 1) * fr + int(SR * tail))]

    def synth(self, text, speed=None, gap=PAUSE):
        """float32 audio at 24 kHz, peak at most PEAK (also after the 60 Hz high-pass); chunks trimmed, joined with gap seconds of silence"""
        parts = []
        for i, ps in enumerate(self.chunks(front(text))):
            ids = [self.vocab[c] for c in ps if c in self.vocab][:510]
            if not ids: continue
            if parts: parts.append(np.zeros(int(SR * gap), np.float32))
            wav = self.sess.run(None, {'input_ids': np.array([[0] + ids + [0]], dtype=np.int64), 'style': self.style[len(ids)][None, :],
                                       'speed': np.array([speed or self.speed], dtype=np.float32)})[0]
            parts.append(self.trim(wav.reshape(-1).astype(np.float32)))
        a = np.concatenate(parts) if parts else np.zeros(0, np.float32)
        if len(a) < SR * 0.2 or float(np.abs(a).max()) < 0.01: raise RuntimeError(f'empty or silent clip for: {text[:60]}')
        peak = max(float(np.abs(a).max()), hp_peak(a))
        return a * (PEAK / peak) if peak > PEAK else a

    def synthesize_wav(self, text, wav_file, syn_config=None):
        """same call as piper.PiperVoice.synthesize_wav (syn_config is ignored: the pace is set by SPEED)"""
        a = self.synth(text)
        wav_file.setnchannels(1); wav_file.setsampwidth(2); wav_file.setframerate(SR)
        wav_file.writeframes((a * 32767).astype(np.int16).tobytes())
