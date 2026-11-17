#!/usr/bin/env python3
"""Write sw.js (offline worker with the full file list and hashes) for DUET STEM web apps.
Usage: build_sw.py <repo> [app ...]   (default apps: science body drone maths robotics physics chemistry biology)"""
import hashlib, json, os, re, subprocess, sys, time
APPS = {'science': 'sl360', 'body': 'hb360', 'drone': 'dsim', 'space': 'ss360', 'maths': 'ml360', 'robotics': 'rl360',
        'physics': 'pl360', 'chemistry': 'cl360', 'biology': 'bl360', 'hub': 'dh360'}
MANIFEST_ONLY = {'space'}  # keeps its own offline worker; only the file list for the Android app
SKIP_DIRS = {'tools', 'store-art', 'test', '.git', '__pycache__'}
SKIP_FILES = {'sw.js', 'offline.json', '.DS_Store'}
SKIP_EXT = ('.txt', '.md', '.py', '.bat', '.sh', '.map', '.command')
TEMPLATE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'sw_template.js')

def published(root):
    # only files that are in git (committed or staged) go on the website: a local test file left in the
    # folder must not enter the list, or the offline copy waits for it forever and updates never apply
    try:
        r = subprocess.run(['git', '-C', root, 'ls-files', '-z', '--', '.'], capture_output=True, check=True)
        return {x.decode() for x in r.stdout.split(b'\0') if x}
    except Exception:
        return None

def files_of(root):
    out = {}; pub = published(root)
    for d, dirs, fs in os.walk(root):
        dirs[:] = sorted(x for x in dirs if x not in SKIP_DIRS and not x.startswith('.'))
        for f in sorted(fs):
            if f in SKIP_FILES or f.endswith(SKIP_EXT) or f.startswith('.'): continue
            full = os.path.join(d, f); rel = os.path.relpath(full, root).replace(os.sep, '/')
            if pub is not None and rel not in pub: continue
            data = open(full, 'rb').read()
            out[rel] = [hashlib.sha1(data).hexdigest()[:12], len(data)]
    return out

# The one-subject apps run the Science Lab's code: <subject>/index.html is science/index.html with <base href="../science/">
# and window.DUET_APP = '<subject>'. Their workers also save the Science Lab files they use, as ../science/…, with only their
# own narration (<subject>/voices.json, written by devtools/tts/) and the 360° places their activities use (<subject>/places.json).
SUBJECT_APPS = {
  'maths': dict(title='DUET Maths Lab 360', h1='Maths Lab 360', tag='Maths in real places · Class 6–10', voices='maths_voices.mjs',
                desc='Maths in real places, in 3D and VR: measure a flagpole in a school courtyard, find parallel lines on a railway track, cut a roti to find the area of a circle. NCERT Class 6–10, in English, Hindi and Hinglish.'),
  'physics': dict(title='DUET Physics Lab 360', h1='Physics Lab 360', tag='Physics · Class 6–10', voices='subject_voices.mjs',
                  desc='Physics in 3D and VR: light, sound, force, motion, electricity and magnets, on a real lab bench and in real places. NCERT Class 6–10, in English, Hindi and Hinglish.'),
  'chemistry': dict(title='DUET Chemistry Lab 360', h1='Chemistry Lab 360', tag='Chemistry · Class 6–10', voices='subject_voices.mjs',
                    desc='Chemistry in 3D and VR: real reactions, acids and bases, metals, carbon and salts on a real lab bench. NCERT Class 6–10, in English, Hindi and Hinglish.'),
  'biology': dict(title='DUET Biology Lab 360', h1='Biology Lab 360', tag='Biology · Class 6–10', voices='subject_voices.mjs',
                  desc='Biology in 3D and VR: cells under a real microscope, plants, food chains and ecosystems in real places. NCERT Class 6–10, in English, Hindi and Hinglish.'),
}
FROM_SCIENCE = ('js/', 'lib/', 'fonts/', 'brand/', 'tex/', 'duetoffline.js', 'duetperf.js', 'duetboard.js', 'voice/manifest.json')
MATHS_FROM_SCIENCE = FROM_SCIENCE  # (kept for older scripts)
# Physics, Chemistry and Biology Lab also need the lab's light, the languages, the shared models, the product photos and
# the microscope plates. Only Biology Lab carries the ecosystem and plant models.
LAB_FROM_SCIENCE = ('env/', 'i18n/', 'products/', 'micro/', 'models/credits.json')
ONLY_FOR = {'models/eco/': 'biology', 'models/bio2/': 'biology', 'bio2/': 'biology', 'models/phys3/': 'physics'}

def science_wants(app, p):
    if p.startswith(FROM_SCIENCE): return True
    if app == 'maths': return False
    for k, a in ONLY_FOR.items():
        if p.startswith(k): return a == app
    if p.startswith(LAB_FROM_SCIENCE): return True
    return p.startswith('models/') and p.count('/') == 1  # the shared models (glassware, microscope, torch …)

def subject_index(repo, app):
    c = SUBJECT_APPS[app]; src = open(os.path.join(repo, 'science', 'index.html'), encoding='utf-8').read()
    t = src.replace('<head>', f'<head>\n<base href="../science/">\n<script>window.DUET_APP = \'{app}\'</script>', 1)
    t = re.sub(r'<title>[^<]*</title>', f'<title>{c["title"]}</title>', t, count=1)
    t = re.sub(r'<meta name="description" content="[^"]*">', lambda m: f'<meta name="description" content="{c["desc"]}">', t, count=1)
    t = t.replace('<link rel="icon" href="icons/icon-192.png">', f'<link rel="icon" href="../{app}/icons/icon-192.png">', 1)
    t = t.replace('<link rel="manifest" href="manifest.webmanifest">', f'<link rel="manifest" href="../{app}/manifest.webmanifest">', 1)
    t = t.replace('<h1>Science Lab 360</h1><p>Chemistry · Class 6–10</p>', f'<h1>{c["h1"]}</h1><p>{c["tag"]}</p>', 1)
    t = t.replace('</style>', '#subjects{display:none!important}\n</style>', 1)
    out = os.path.join(repo, app, 'index.html')
    if not os.path.exists(out) or open(out, encoding='utf-8').read() != t: open(out, 'w', encoding='utf-8').write(t)

def maths_index(repo): subject_index(repo, 'maths')

def subject_extra(repo, app):
    sci = os.path.join(repo, 'science'); allf = files_of(sci); out = {}
    try: voices = set(json.load(open(os.path.join(repo, app, 'voices.json'))))
    except Exception: voices = None
    for p, v in allf.items():
        if science_wants(app, p) or (p.startswith('voice/') and p.endswith('.mp3') and (voices is None or p[6:-4] in voices)):
            out['../science/' + p] = v
    if app != 'maths':  # the real places and the table textures, from the Maths Lab's folder
        try: imgs = set(json.load(open(os.path.join(repo, app, 'places.json'))))
        except Exception: imgs = set()
        for sub in ('places', 'tex'):
            d = os.path.join(repo, 'maths', sub)
            if not os.path.isdir(d): continue
            for p, v in files_of(d).items():
                if sub == 'tex' or re.sub(r'(_1k)?\.(jpg|hdr)$', '', p) in imgs: out['../maths/' + sub + '/' + p] = v
    lic = os.path.join(repo, 'licences.json')
    if os.path.exists(lic): d = open(lic, 'rb').read(); out['../licences.json'] = [hashlib.sha1(d).hexdigest()[:12], len(d)]
    return out

def maths_extra(repo): return subject_extra(repo, 'maths')

# the Science Lab's activities in real places (physics, biology) use the Maths Lab's 360° photos and table textures
# (../maths/places/, ../maths/tex/): its worker saves them too, so they work offline
def science_extra(repo):
    out = {}
    for sub in ('places', 'tex'):
        d = os.path.join(repo, 'maths', sub)
        if not os.path.isdir(d): continue
        for p, v in files_of(d).items(): out['../maths/' + sub + '/' + p] = v
    return out

def build(repo, app):
    root = os.path.join(repo, app)
    if app in SUBJECT_APPS:
        c = SUBJECT_APPS[app]; args = [] if app == 'maths' else [app]
        try: subprocess.run(['node', os.path.join(repo, 'devtools', 'tts', c['voices'])] + args, capture_output=True, timeout=120)
        except Exception: pass
        subject_index(repo, app)
    files = files_of(root)
    if app == 'science': files.update(science_extra(repo))
    if app in SUBJECT_APPS:
        files.update(subject_extra(repo, app))
        for g in ('index.html', 'voices.json', 'places.json'):  # written just now: listed even before git has them
            f = os.path.join(root, g)
            if not os.path.exists(f) or (g == 'places.json' and app == 'maths'): continue
            d = open(f, 'rb').read(); files[g] = [hashlib.sha1(d).hexdigest()[:12], len(d)]
    ver = APPS[app] + '-' + hashlib.sha1(json.dumps(files, sort_keys=True).encode()).hexdigest()[:10]
    src = open(TEMPLATE).read().replace('__PREFIX__', APPS[app]).replace('__VERSION__', ver).replace('__FILES__', json.dumps(files, separators=(',', ':')))
    # the same list for the Android app, which updates its bundled copy from it
    # 't': when this version was first built. The Android app only takes a published version that is newer than the
    # one inside the install, so an older website can never roll a newer app back.
    mp = os.path.join(root, 'offline.json')
    t = int(time.time())
    try:
        prev = json.load(open(mp))
        if prev.get('v') == ver and prev.get('t'): t = prev['t']
    except Exception: pass
    man = json.dumps({'v': ver, 't': t, 'files': files}, separators=(',', ':'))
    if not os.path.exists(mp) or open(mp).read() != man: open(mp, 'w').write(man)
    path = os.path.join(root, 'sw.js')
    if app in MANIFEST_ONLY:
        sv = space_version(root, files) if app == 'space' else ''
        print(f'{app}: {len(files)} files, {sum(v[1] for v in files.values())/1e6:.1f} MB (file list only){sv}'); return
    old = open(path).read() if os.path.exists(path) else ''
    if old != src: open(path, 'w').write(src)
    mb = sum(v[1] for v in files.values()) / 1e6
    print(f'{app}: {len(files)} files, {mb:.1f} MB, {ver}{"" if old != src else " (unchanged)"}')

def space_version(root, files):
    # Space keeps its own worker (sw.js: CORE files saved at install, MEDIA filled in behind). It opens from the saved copy,
    # so a changed file reaches a device only when VERSION changes: VERSION follows the content of every listed file, and
    # HASH (md5, which tells the worker what it can copy across from the older version) is refreshed. Every other file on
    # the website (narration, photos, 360 views, videos) is added to MEDIA too, so after the first full download the whole
    # app runs offline, not only the scenes already visited. Small files first, so narration and photos are ready long
    # before the big 360 views and videos.
    path = os.path.join(root, 'sw.js'); s = open(path).read()
    core = json.loads(re.search(r'const CORE=(\[.*?\]);', s).group(1)); media = json.loads(re.search(r'const MEDIA=(\[.*?\]);', s).group(1))
    media = [p for p in media if p in files and p not in core]
    listed = set(core) | set(media)
    media += sorted((p for p in files if p not in listed and p != 'index.html'), key=lambda p: (files[p][1] > 4_000_000, files[p][1], p))
    md5 = lambda p: hashlib.md5(open(os.path.join(root, p), 'rb').read()).hexdigest()[:12]
    H = {p: md5(p) for p in media}
    h = hashlib.sha1()
    for p in core: h.update(((p if p != './' else 'index.html') + ':' + md5(p if p != './' else 'index.html') + ';').encode())
    for p in media: h.update((p + ':' + H[p] + ';').encode())
    ver = 'solarsystem-' + h.hexdigest()[:10]
    t = re.sub(r'const VERSION="[^"]*";', lambda m: f'const VERSION="{ver}";', s, count=1)
    t = re.sub(r'const MEDIA=\[.*?\];', lambda m: 'const MEDIA=' + json.dumps(media) + ';', t, count=1)
    t = re.sub(r'const HASH=\{.*?\};', lambda m: 'const HASH=' + json.dumps(H, separators=(',', ':')) + ';', t, count=1)
    if t != s: open(path, 'w').write(t)
    return f', worker {ver}' + ('' if t != s else ' (unchanged)')

if __name__ == '__main__':
    repo = sys.argv[1]; apps = sys.argv[2:] or [a for a in APPS if a not in MANIFEST_ONLY]
    for a in apps: build(repo, a)
