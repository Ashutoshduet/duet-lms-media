#!/usr/bin/env python3
"""Write sw.js (offline worker with the full file list and hashes) for DUET STEM web apps.
Usage: build_sw.py <repo> [app ...]   (default apps: science body drone)"""
import hashlib, json, os, subprocess, sys
APPS = {'science': 'sl360', 'body': 'hb360', 'drone': 'dsim', 'space': 'ss360'}
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

def build(repo, app):
    root = os.path.join(repo, app); files = files_of(root)
    ver = APPS[app] + '-' + hashlib.sha1(json.dumps(files, sort_keys=True).encode()).hexdigest()[:10]
    src = open(TEMPLATE).read().replace('__PREFIX__', APPS[app]).replace('__VERSION__', ver).replace('__FILES__', json.dumps(files, separators=(',', ':')))
    # the same list for the Android app, which updates its bundled copy from it
    man = json.dumps({'v': ver, 'files': files}, separators=(',', ':'))
    mp = os.path.join(root, 'offline.json')
    if not os.path.exists(mp) or open(mp).read() != man: open(mp, 'w').write(man)
    path = os.path.join(root, 'sw.js')
    if app in MANIFEST_ONLY:
        print(f'{app}: {len(files)} files, {sum(v[1] for v in files.values())/1e6:.1f} MB (file list only)'); return
    old = open(path).read() if os.path.exists(path) else ''
    if old != src: open(path, 'w').write(src)
    mb = sum(v[1] for v in files.values()) / 1e6
    print(f'{app}: {len(files)} files, {mb:.1f} MB, {ver}{"" if old != src else " (unchanged)"}')

if __name__ == '__main__':
    repo = sys.argv[1]; apps = sys.argv[2:] or [a for a in APPS if a not in MANIFEST_ONLY]
    for a in apps: build(repo, a)
