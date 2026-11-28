"""Narration for the "Kyun?" theatre (offline), the same voices and word fixes as the Science Lab.
   python3 devtools/theatre/tts.py            (voices every new line, then writes theatre/voice/lengths.json)
Voices: $DUET_VOICES or ~/duet-voices: English Piper en_US-ljspeech-high (public domain), Hindi Kokoro-82M
(Apache-2.0, devtools/tts/kokoro_hi.py).
Files are named by a hash of the text (theatre/voice/<lang>/<key>.mp3), so an unchanged line is never redone, and the
player sets each beat's length from lengths.json. speak() and its word lists are read from devtools/tts/gen.py, so a fix
made there is used here too."""
import ast, json, os, subprocess, sys, tempfile, time, wave
HERE = os.path.dirname(os.path.abspath(__file__)); REPO = os.path.abspath(os.path.join(HERE, '..', '..'))
OUT = os.path.join(REPO, 'theatre', 'voice')
VOICES = os.environ.get('DUET_VOICES', os.path.expanduser('~/duet-voices'))

def load_speak():
    # take only speak() and the word lists from gen.py (it would start voicing the Science Lab if run as a whole)
    src = open(os.path.join(REPO, 'devtools', 'tts', 'gen.py'), encoding='utf-8').read(); tree = ast.parse(src)
    keep = {'FIX', 'IONS', 'ATOMS', 'FORMULA_IN_PARENS', 'PHYS', 'MATH', 'LETTERS_HI', 'speak'}
    body = [n for n in tree.body if (isinstance(n, ast.Import) and any(a.name == 're' for a in n.names))
            or (isinstance(n, ast.Assign) and any(isinstance(t, ast.Name) and t.id in keep for t in n.targets))
            or (isinstance(n, ast.FunctionDef) and n.name in keep)]
    ns = {}; exec(compile(ast.Module(body=[ast.parse('import re').body[0]] + body, type_ignores=[]), 'gen.py', 'exec'), ns); return ns['speak']

def duration(mp3):
    r = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', mp3], capture_output=True, text=True)
    return round(float(r.stdout.strip()), 3)

def main():
    speak = load_speak()
    jobs = json.loads(subprocess.run(['node', os.path.join(HERE, 'lines.mjs'), REPO], capture_output=True, text=True, check=True).stdout)
    todo = [j for j in jobs if not os.path.exists(f"{OUT}/{j['lang']}/{j['key']}.mp3")]
    print(f'{len(jobs)} lines, {len(todo)} to voice', flush=True)
    if todo:
        from piper import PiperVoice, SynthesisConfig
        sys.path.insert(0, os.path.join(REPO, 'devtools', 'tts')); from kokoro_hi import KokoroHindi, voices_dir
        V = {'en': PiperVoice.load(os.path.join(VOICES, 'en_US-ljspeech-high.onnx')), 'hi': KokoroHindi(voices_dir(VOICES))}
        cfg = {'en': SynthesisConfig(length_scale=1.06), 'hi': None}  # the Hindi pace is kokoro_hi.SPEED
        t0 = time.time()
        for n, j in enumerate(todo):
            out = f"{OUT}/{j['lang']}/{j['key']}.mp3"; os.makedirs(os.path.dirname(out), exist_ok=True)
            with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as tf: wav = tf.name
            try:
                with wave.open(wav, 'wb') as w: V[j['lang']].synthesize_wav(speak(j['text'], j['lang']), w, syn_config=cfg[j['lang']])
                subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', wav, '-af', 'highpass=f=60,afade=t=in:d=0.03', '-ac', '1', '-ar', '22050', '-b:a', '24k', out], check=True)
            except Exception as e: print('FAIL', j['key'], e, flush=True)
            finally: os.unlink(wav)
            if n % 10 == 9: print(f'{n + 1}/{len(todo)} in {time.time() - t0:.0f}s', flush=True)
    # every clip's length (the player times the beats with it); clips no longer used are removed
    used = {(j['lang'], j['key']) for j in jobs}; L = {'en': {}, 'hi': {}}
    for lang in ('en', 'hi'):
        d = os.path.join(OUT, lang)
        for f in sorted(os.listdir(d)) if os.path.isdir(d) else []:
            k = f[:-4]
            if (lang, k) not in used: os.remove(os.path.join(d, f)); continue
            L[lang][k] = duration(os.path.join(d, f))
    json.dump(L, open(os.path.join(OUT, 'lengths.json'), 'w'), separators=(',', ':'), sort_keys=True)
    print('lengths.json:', {k: len(v) for k, v in L.items()})

if __name__ == '__main__': main()
