# voice/manifest.json = every narration clip the app can play now; Hindi clips no longer used by any text are removed
import json, os
HERE = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(HERE, '..', '..', 'science', 'voice')
jobs = json.load(open(os.path.join(HERE, 'jobs.json')))
want = {f"{j['lang']}/{j['key']}" for j in jobs}
have = {f"{l}/{f[:-4]}" for l in ('en', 'hi') for f in os.listdir(f'{OUT}/{l}') if f.endswith('.mp3')}
missing = sorted(want - have); stale = sorted(have - want)
for k in stale:
    if k.startswith('hi/'): os.remove(f'{OUT}/{k}.mp3')
man = sorted(want & have)
json.dump(man, open(f'{OUT}/manifest.json', 'w'))
print('clips', len(man), 'missing', len(missing), 'stale removed', sum(1 for k in stale if k.startswith('hi/')), 'stale en kept', sum(1 for k in stale if k.startswith('en/')))
