"""Narration (Piper, offline) for the new Organ Lab steps: English and Hindi voices; Hinglish uses the Hindi recording."""
import json, os, re, subprocess, tempfile, wave, shutil, sys
from piper import PiperVoice, SynthesisConfig
APP = '/home/claude/duet-lms-media/body'
c = json.load(open(f'{APP}/models/content.json'))
ids = [k for k in c['steps'] if re.match(r'^lab-(mouth|gut|liver|knee)-\d+$', k)]
V = {'en': PiperVoice.load('/root/tts/voices/en_US-ljspeech-high.onnx'), 'hi': PiperVoice.load('/root/tts/voices/hi_IN-priyamvada-medium.onnx')}
cfg = {'en': SynthesisConfig(length_scale=1.06), 'hi': SynthesisConfig(length_scale=1.08)}
def en_say(s):
    s = s.replace('–', ' to ').replace('—', ', ').replace('%', ' percent').replace('&', ' and ').replace('ACL', 'A C L').replace('B12', 'B 12')
    s = re.sub(r'\(([^)]*)\)', r', \1,', s); s = re.sub(r'\s+', ' ', s).strip()
    return re.sub(r'\s+([,.])', r'\1', s).replace(',,', ',').replace('.,', '.')
HI = [('1.5 मीटर', 'डेढ़ मीटर'), ('2.5 मीटर', 'ढाई मीटर'), ('3.5 मीटर', 'साढ़े तीन मीटर'), ('6 मीटर', 'छह मीटर'), ('500', 'पाँच सौ'), ('32', 'बत्तीस'), ('20', 'बीस'),
      ('B12', 'बी बारह'), ('विटामिन K', 'विटामिन के'), ('ACL', 'ए सी एल'), (' X ', ' एक्स '), ('C आकार', 'सी आकार'), ('S आकार', 'एस आकार'), ('H अक्षर', 'एच अक्षर'), ('V आकार', 'वी आकार')]
def hi_say(s):
    for a, b in HI: s = s.replace(a, b)
    s = re.sub(r'\(([^)]*)\)', r', \1,', s); s = re.sub(r'\s+', ' ', s).strip()
    s = re.sub(r'\s+([,।])', r'\1', s).replace(',,', ',').replace('।,', '।')
    left = re.findall(r'[A-Za-z0-9]+', s)
    if left: print('  latin/digits left in', left)
    return s
aud = c.setdefault('audio', {})
for k in ids:
    st = c['steps'][k]
    for L in ('en', 'hi'):
        text = (en_say if L == 'en' else hi_say)(st['title'][L] + '. ' + st['text'][L])
        out = f'{APP}/audio/{L}/{k}.mp3'
        with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as tf: wav = tf.name
        with wave.open(wav, 'wb') as w: V[L].synthesize_wav(text, w, syn_config=cfg[L])
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', wav, '-af', 'highpass=f=60,afade=t=in:d=0.03', '-ac', '1', '-ar', '22050', '-b:a', '24k', out], check=True); os.unlink(wav)
    shutil.copy(f'{APP}/audio/hi/{k}.mp3', f'{APP}/audio/hg/{k}.mp3')
    aud[k] = ['en', 'hi', 'hg']; print(k, flush=True)
json.dump(c, open(f'{APP}/models/content.json', 'w'), ensure_ascii=False, separators=(',', ':'))
print('done', len(ids))
