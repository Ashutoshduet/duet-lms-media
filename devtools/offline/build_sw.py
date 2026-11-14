#!/usr/bin/env python3
"""Write sw.js (offline worker with the full file list and hashes) for DUET STEM web apps.
Usage: build_sw.py <repo> [app ...]   (default apps: science body drone maths)"""
import hashlib, json, os, re, subprocess, sys
APPS = {'science': 'sl360', 'body': 'hb360', 'drone': 'dsim', 'space': 'ss360', 'maths': 'ml360'}
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

# DUET Maths Lab 360 (maths/) runs the Science Lab's code (maths/index.html is science/index.html with <base href="../science/">):
# its worker also saves the Science Lab files it uses, as ../science/…, but only the maths narration (maths/voices.json)
MATHS_FROM_SCIENCE = ('js/', 'lib/', 'fonts/', 'brand/', 'tex/', 'duetoffline.js', 'voice/manifest.json')

def maths_index(repo):
    src = open(os.path.join(repo, 'science', 'index.html'), encoding='utf-8').read()
    t = src.replace('<head>', '<head>\n<base href="../science/">\n<script>window.DUET_APP = \'maths\'</script>', 1)
    t = re.sub(r'<title>[^<]*</title>', '<title>DUET Maths Lab 360</title>', t, count=1)
    t = re.sub(r'<meta name="description" content="[^"]*">', '<meta name="description" content="Maths in real places, in 3D and VR: measure a flagpole in a school courtyard, find parallel lines on a railway track, cut a roti to find the area of a circle. NCERT Class 6–10, in English, Hindi and Hinglish.">', t, count=1)
    t = t.replace('<link rel="icon" href="icons/icon-192.png">', '<link rel="icon" href="../maths/icons/icon-192.png">', 1)
    t = t.replace('<link rel="manifest" href="manifest.webmanifest">', '<link rel="manifest" href="../maths/manifest.webmanifest">', 1)
    t = t.replace('<h1>Science Lab 360</h1><p>Chemistry · Class 6–10</p>', '<h1>Maths Lab 360</h1><p>Maths in real places · Class 6–10</p>', 1)
    t = t.replace('</style>', '#subjects{display:none!important}\n</style>', 1)
    out = os.path.join(repo, 'maths', 'index.html')
    if not os.path.exists(out) or open(out, encoding='utf-8').read() != t: open(out, 'w', encoding='utf-8').write(t)

def maths_extra(repo):
    sci = os.path.join(repo, 'science'); allf = files_of(sci); out = {}
    try: voices = set(json.load(open(os.path.join(repo, 'maths', 'voices.json'))))
    except Exception: voices = None
    for p, v in allf.items():
        if p.startswith(MATHS_FROM_SCIENCE) or (p.startswith('voice/') and p.endswith('.mp3') and (voices is None or p[6:-4] in voices)):
            out['../science/' + p] = v
    lic = os.path.join(repo, 'licences.json')
    if os.path.exists(lic): d = open(lic, 'rb').read(); out['../licences.json'] = [hashlib.sha1(d).hexdigest()[:12], len(d)]
    return out

def build(repo, app):
    root = os.path.join(repo, app)
    if app == 'maths':
        try: subprocess.run(['node', os.path.join(repo, 'devtools', 'tts', 'maths_voices.mjs')], capture_output=True, timeout=120)
        except Exception: pass
        maths_index(repo)
    files = files_of(root)
    if app == 'maths':
        files.update(maths_extra(repo))
        for g in ('index.html', 'voices.json'):  # written just now: listed even before git has them
            d = open(os.path.join(root, g), 'rb').read(); files[g] = [hashlib.sha1(d).hexdigest()[:12], len(d)]
    ver = APPS[app] + '-' + hashlib.sha1(json.dumps(files, sort_keys=True).encode()).hexdigest()[:10]
    src = open(TEMPLATE).read().replace('__PREFIX__', APPS[app]).replace('__VERSION__', ver).replace('__FILES__', json.dumps(files, separators=(',', ':')))
    # the same list for the Android app, which updates its bundled copy from it
    man = json.dumps({'v': ver, 'files': files}, separators=(',', ':'))
    mp = os.path.join(root, 'offline.json')
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
    # HASH (md5, which tells the worker what it can copy across from the older version) is refreshed. Files on the website
    # that the lists miss (such as new models) are added to MEDIA.
    path = os.path.join(root, 'sw.js'); s = open(path).read()
    core = json.loads(re.search(r'const CORE=(\[.*?\]);', s).group(1)); media = json.loads(re.search(r'const MEDIA=(\[.*?\]);', s).group(1))
    listed = set(core) | set(media)
    for p in sorted(files):
        if p not in listed and p.endswith('.glb'): media.append(p)
    media = [p for p in media if p in files]
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
