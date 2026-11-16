"""Piper narration (offline) for the new lab steps, journey steps and parts: English and Hindi voices; Hinglish plays the Hindi
recording (as for the other Organ Labs). Usage: narrate3.py <worker> <workers>; then narrate3.py index (writes content.json audio)."""
import json, os, re, subprocess, tempfile, wave, shutil, sys, hashlib
APP = '/home/claude/duet-lms-media/body'
c = json.load(open(f'{APP}/models/content.json'))
STEP = re.compile(r'^(lab-(arm|urinary|pancreas|leg)|reflex|hormones)-\d+$')
mine = json.load(open('/root/work/labs3/added_parts.json'))
LBL = {'en': ('Function', 'How it works'), 'hi': ('काम', 'प्रक्रिया')}
def jobs():
    out = []
    for k, v in c['steps'].items():
        if STEP.match(k):
            for L in ('en', 'hi'): out.append((k, L, v['title'][L] + '. ' + v['text'][L]))
    for pid in mine:
        p = c['parts'][pid]
        for L in ('en', 'hi'): out.append(('part-' + pid, L, f"{p['name'][L]}. {LBL[L][0]}: {p['job'][L]} {LBL[L][1]}: {p['process'][L]}"))
    return out
def en_say(s):
    s = s.replace('–', ' to ').replace('—', ', ').replace('%', ' percent').replace('&', ' and ')
    s = re.sub(r'\(([^)]*)\)', r', \1,', s); s = re.sub(r'\s+', ' ', s).strip()
    return re.sub(r'\s+([,.])', r'\1', s).replace(',,', ',').replace('.,', '.')
HI = [('C आकार', 'सी आकार'), ('(G)', ''), ('(E)', '')]
def hi_say(s):
    for a, b in HI: s = s.replace(a, b)
    s = re.sub(r'\(([^)]*)\)', r', \1,', s); s = re.sub(r'\s+', ' ', s).strip()
    s = re.sub(r'\s+([,।])', r'\1', s).replace(',,', ',').replace('।,', '।').replace(':,', ':')
    left = re.findall(r'[A-Za-z0-9]+', s)
    if left: print('  latin/digits left in', left, s[:60])
    return s
h = lambda t: hashlib.md5(t.encode()).hexdigest()[:12]
if sys.argv[1] == 'index':
    aud = c.setdefault('audio', {})
    ids = sorted(set(k for k, L, t in jobs()))
    for k in ids:
        if all(os.path.exists(f'{APP}/audio/{L}/{k}.mp3') for L in ('en', 'hi')):
            shutil.copy(f'{APP}/audio/hi/{k}.mp3', f'{APP}/audio/hg/{k}.mp3'); aud[k] = ['en', 'hi', 'hg']
        else: print('missing', k)
    json.dump(c, open(f'{APP}/models/content.json', 'w'), ensure_ascii=False, separators=(',', ':'))
    print('indexed', len(ids)); sys.exit()
from piper import PiperVoice, SynthesisConfig
W, N = int(sys.argv[1]), int(sys.argv[2])
import glob
done = {}
for f in glob.glob('/root/work/labs3/narr_done_*.json'): done.update(json.load(open(f)))
dp = f'/root/work/labs3/narr_done_{W}.json'; mine_d = json.load(open(dp)) if os.path.exists(dp) else {}
V = {'en': PiperVoice.load('/root/tts/voices/en_US-ljspeech-high.onnx'), 'hi': PiperVoice.load('/root/tts/voices/hi_IN-priyamvada-medium.onnx')}
cfg = {'en': SynthesisConfig(length_scale=1.06), 'hi': SynthesisConfig(length_scale=1.08)}
todo = jobs()[W::N]; n = 0
for k, L, text in todo:
    text = (en_say if L == 'en' else hi_say)(text); key = f'{k}|{L}'
    out = f'{APP}/audio/{L}/{k}.mp3'
    if done.get(key) == h(text) and os.path.exists(out): continue
    with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as tf: wav = tf.name
    with wave.open(wav, 'wb') as w: V[L].synthesize_wav(text, w, syn_config=cfg[L])
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', wav, '-af', 'highpass=f=60,afade=t=in:d=0.03', '-ac', '1', '-ar', '22050', '-b:a', '24k', out], check=True); os.unlink(wav)
    mine_d[key] = h(text); n += 1
    json.dump(mine_d, open(dp, 'w'))
    print(W, n, key, flush=True)
print('worker', W, 'done', n)
