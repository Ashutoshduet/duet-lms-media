"""English narration clips for the DUET AR items that have no recorded clip in another app (say "ar:<id>" in catalog.json):
ar/voice/en/<id>.mp3, read from the item's name and "about" text with Piper and the public-domain LJSpeech voice (the same
settings as devtools/tts/gen.py). Hindi and Hinglish are read by the device's own voice: the Piper Hindi voices are
CC BY-NC-SA, which DUET AR does not use for new files.
Usage: python3 devtools/ar/make_voice.py [voices dir (default ~/duet-voices)]"""
import json, os, re, subprocess, sys, tempfile, wave
from piper import PiperVoice, SynthesisConfig
HERE = os.path.dirname(os.path.abspath(__file__)); REPO = os.path.abspath(os.path.join(HERE, '..', '..'))
VOICES = sys.argv[1] if len(sys.argv) > 1 else os.environ.get('DUET_VOICES', os.path.expanduser('~/duet-voices'))
V = PiperVoice.load(os.path.join(VOICES, 'en_US-ljspeech-high.onnx')); cfg = SynthesisConfig(length_scale=1.06)
SAY = [('H₂O', 'H 2 O'), ('CO₂', 'C O 2'), ('CH₄', 'C H 4'), ('NH₃', 'N H 3'), ('NaCl', 'N A C L'), ('πr²h', 'pi r squared h'), ('⅓πr²h', 'one third pi r squared h'),
       ('4/3 πr³', 'four thirds pi r cubed'), ('⅔πr³', 'two thirds pi r cubed'), ('104.5°', '104.5 degrees'), ('0° to 180°', '0 to 180 degrees'), ('−', 'minus'),
       ('HC-SR04', 'H C S R zero four'), ('L298N', 'L 2 9 8 N'), ('SG90', 'S G 90'), ('IR ', 'I R '), ('LED', 'L E D'), ('(', ', '), (')', ', '), ("'", '')]
cat = json.load(open(os.path.join(REPO, 'ar', 'catalog.json')))
out_dir = os.path.join(REPO, 'ar', 'voice', 'en'); os.makedirs(out_dir, exist_ok=True)
said_f = os.path.join(REPO, 'ar', 'voice', 'en.json')   # what each clip says (the transcript; a changed text is read again)
said = json.load(open(said_f)) if os.path.exists(said_f) else {}
n = 0
for it in cat['items']:
    say = it.get('say', '')
    if not say.startswith('ar:'): continue
    key = say[3:]; out = os.path.join(out_dir, key + '.mp3')
    text = it['name']['en'] + '. ' + it['about']['en']
    for a, b in SAY: text = text.replace(a, b)
    text = re.sub(r'\s+,', ',', re.sub(r',\s*,', ',', text)).replace(' .', '.')
    if os.path.exists(out) and said.get(key) == text: continue
    with tempfile.TemporaryDirectory() as td:
        wav = os.path.join(td, 'a.wav')
        with wave.open(wav, 'wb') as w: V.synthesize_wav(text, w, syn_config=cfg)
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', wav, '-af', 'highpass=f=60,afade=t=in:d=0.03', '-ac', '1', '-ar', '22050', '-b:a', '32k', out], check=True)
    said[key] = text; n += 1
    print(key, round(os.path.getsize(out) / 1024), 'KB')
json.dump(said, open(said_f, 'w'), ensure_ascii=False, indent=0)
print('made', n)
