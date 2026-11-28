#!/usr/bin/env python3
"""DUET Little Learners narration, offline (same voices and settings as devtools/tts/gen.py: English Piper LJSpeech,
Hindi Kokoro-82M via devtools/tts/kokoro_hi.py).
Reads devtools/early/voice_jobs.json (node devtools/early/voices.mjs), writes early/voice/<lang>/<key>.mp3 and
early/voice/manifest.json. A clip that exists is never redone. usage: python3 gen_voice.py [worker workers]"""
import json, os, subprocess, sys, tempfile, time, wave, re
from piper import PiperVoice, SynthesisConfig
W, N = (int(sys.argv[1]), int(sys.argv[2])) if len(sys.argv) > 2 else (0, 1)
HERE = os.path.dirname(os.path.abspath(__file__)); REPO = os.path.abspath(os.path.join(HERE, '..', '..'))
OUT = os.path.join(REPO, 'early', 'voice')
sys.path.insert(0, os.path.join(REPO, 'devtools', 'tts')); from kokoro_hi import KokoroHindi, voices_dir, SPEED
VOICES = next((d for d in [os.environ.get('DUET_VOICES'), os.path.expanduser('~/duet-voices'), '/root/tts/voices'] if d and os.path.exists(os.path.join(d, 'en_US-ljspeech-high.onnx'))), None)
if not VOICES: sys.exit('Piper voice not found: set DUET_VOICES to the folder with en_US-ljspeech-high.onnx (and the Kokoro files, see devtools/tts/kokoro_hi.py)')
jobs = json.load(open(os.path.join(HERE, 'voice_jobs.json')))
todo = [j for j in jobs if not os.path.exists(f"{OUT}/{j['lang']}/{j['key']}.mp3")][W::N]
# a little slower than the lab apps: the listeners are 3 to 8 years old
V = {'en': PiperVoice.load(os.path.join(VOICES, 'en_US-ljspeech-high.onnx')), 'hi': KokoroHindi(voices_dir(VOICES), speed=round(SPEED * 0.95, 3))}
cfg = {'en': SynthesisConfig(length_scale=1.12), 'hi': None}
FIX = {'en': [('Mohenjo-daro', 'Mo-hen-jo daro'), ('Dholavira', 'Dhola-veera'), ('Harappan', 'Ha-rup-pun'), ('Harappa', 'Ha-rup-pa'), ('Nataraja', 'Nata-raaja'), ('Damayanti', 'Da-ma-yunti'),
               ('Ravi Varma', 'Ravi Vurma'), ('Ajanta', 'Ajunta'), ('Gandhara', 'Gun-dhaara'), ('Ganesha', 'Ga-naysha'), ('Chola', 'Chola'), ('Bharat Mata', 'Bha-rut Maata'), ('Abanindranath', 'O-bo-nin-dro-nath'),
               ('jamun', 'jaa-moon'), ('Jamun', 'Jaa-moon'), ('litchi', 'lee-chee'), ('Litchi', 'Lee-chee'), ('Okra', 'Oak-ra'), ('—', ','), ('"', '')],
       'hi': [('—', ','), ('"', '')]}
def speak(t, L):
    for a, b in FIX[L]: t = t.replace(a, b)
    return re.sub(r'\s+', ' ', t).strip()
n = 0; t0 = time.time(); print(f'worker {W}: {len(todo)} clips', flush=True)
for j in todo:
    out = f"{OUT}/{j['lang']}/{j['key']}.mp3"; os.makedirs(os.path.dirname(out), exist_ok=True)
    with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as tf: wav = tf.name
    try:
        with wave.open(wav, 'wb') as w: V[j['lang']].synthesize_wav(speak(j['text'], j['lang']), w, syn_config=cfg[j['lang']])
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', wav, '-af', 'highpass=f=60,afade=t=in:d=0.03,apad=pad_dur=0.12', '-ac', '1', '-ar', '22050', '-b:a', '32k', out], check=True); n += 1
    except Exception as e: print('FAIL', j['key'], e, flush=True)
    finally: os.unlink(wav)
    if n % 50 == 0: print(f'w{W}: {n}/{len(todo)} in {time.time()-t0:.0f}s', flush=True)
have = sorted(f"{L}/{f[:-4]}" for L in ('en', 'hi') if os.path.isdir(f'{OUT}/{L}') for f in os.listdir(f'{OUT}/{L}') if f.endswith('.mp3'))
want = {f"{j['lang']}/{j['key']}" for j in jobs}
json.dump([k for k in have if k in want], open(f'{OUT}/manifest.json', 'w'))
print(f'w{W} done {n}; manifest {len(want & set(have))}/{len(want)}', flush=True)
