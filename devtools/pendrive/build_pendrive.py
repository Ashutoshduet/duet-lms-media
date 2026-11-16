#!/usr/bin/env python3
"""Build a DUET STEM pen drive for classroom panels, projectors and computers (works without the internet).

Usage:
  build_pendrive.py OUTDIR --code DUET-XXXX-XXXX-XXXX --school "School name" [options]

  OUTDIR       an empty folder (or the USB drive itself, e.g. /media/me/DUETSTEM or E:\\); its contents go on the
               drive as they are (the drive: FAT32 or exFAT, 4 GB or more)
  --code       the drive's own school code: one code per pen drive, issued first with
               node devtools/licence-server/duetlic.mjs issue --name "School" --until 2027-03-31 --apps '*' --pendrive
               (it must be in licences.json before the drive is built). Without --code: a demo drive (the apps ask
               for a code, or run their free demo).
  --school     the school's name (shown in the guide and on the home page)
  --apk-dir    folder with the Android apps, DUET-*.apk (default: /mnt/user-data/outputs/apk109)
  --apps       science,maths,body,space,drone (default: every app in devtools/pendrive/apps.json whose folder is
               in the repo; a new app, such as robotics/, is one more line in apps.json)
  --link       symlink the app files instead of copying (a quick test build on this machine; never for a drive)
  --launchers  a folder with already built launchers (default: build them with Go, cached)
  --force      write into a folder that is not empty
  --untracked  also take the apps' files that are not in git yet (a test build before a commit; never for a drive)

The layout of the drive: ONE folder, DUET-STEM-Smart-Class/ (--top), with everything inside it, so the drive's root
holds nothing else and a teacher copies or finds a single folder:
  DUET-STEM-Smart-Class/
  START-DUET-STEM.exe          Windows 10/11 (64-bit): double-click
  START-DUET-STEM-Linux.sh     Linux (x64 or ARM64)
  START-DUET-STEM-Mac.command  macOS
  TEACHER-GUIDE.html           the teacher guide (English + Hindi)
  CODE.txt                     the school code (for the Android apps on an Android-only panel)
  ANDROID/                     the Android apps + INSTALL.html
  DUET-STEM/                   the web apps the launcher serves (home page index.html, guide.html, school.json,
                               licences.json, pendrive.json; launcher/ holds the programs for the other systems)

The launcher's lock key (which ties a drive to its first computer) comes from the environment variable
DUET_PENDRIVE_KEY or the file ~/.config/duet-stem/pendrive-lock.key (made once, at random); it is never in the repo.
"""
import argparse, datetime, hashlib, html, json, os, re, secrets, shutil, stat, subprocess, sys, tempfile
sys.dont_write_bytecode = True  # no __pycache__ in the repo from importing pages.py / build_sw.py

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(os.path.dirname(HERE))
REGISTRY = json.load(open(os.path.join(HERE, 'apps.json'), encoding='utf-8'))  # the apps (one line each): devtools/pendrive/apps.json
APPS = [a['id'] for a in REGISTRY]
NEEDS = {a['id']: a['needs'] for a in REGISTRY if a.get('needs')}  # the Maths Lab runs the Science Lab's code
ALWAYS = ['index.html', 'duetboard.js', 'duetperf.js', 'duetgate.js', 'duetoffline.js', 'manifest.webmanifest', 'privacy.html', 'credits.html']
ALPHA = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'
GO = shutil.which('go') or '/usr/local/go/bin/go'
# Go 1.21 and newer make programs for Windows 10 and newer only: the launcher for old Windows (7, 8, 32-bit) is made
# with Go 1.20 when it is here (DUET_GO120, or one of these places), else with the usual Go (then: 32-bit Windows 10)
GO120 = [os.environ.get('DUET_GO120', ''), '/usr/local/go1.20/bin/go', os.path.expanduser('~/sdk/go1.20.14/bin/go')]
TARGETS = [  # (GOOS, GOARCH, file on the drive)
    ('windows', 'amd64', 'START-DUET-STEM.exe'),
    ('windows', '386', 'DUET-STEM/launcher/START-DUET-STEM-old-Windows.exe'),
    ('linux', 'amd64', 'DUET-STEM/launcher/start-duet-stem-linux-x64'),
    ('linux', 'arm64', 'DUET-STEM/launcher/start-duet-stem-linux-arm64'),
    ('darwin', 'arm64', 'DUET-STEM/launcher/start-duet-stem-mac-arm64'),
    ('darwin', 'amd64', 'DUET-STEM/launcher/start-duet-stem-mac-x64'),
]
FAT_BAD = re.compile(r'[<>:"\\|?*\x00-\x1f]')

# the apps' offline worker is replaced on the drive: every file is on the drive already, so nothing is saved in the
# browser (the worker answers "all saved", so no app shows a "saving for offline" card)
SW_STUB = """// DUET STEM pen drive: every file is on the drive, so nothing is saved in the browser.
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.map(function (k) { return caches.delete(k); })); }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('message', function (e) {
  try { if (e.source) e.source.postMessage({ type: 'ready', ready: true, have: 1, total: 1, done: 1, bytes: 1, bytesTotal: 1, pendrive: true }); } catch (err) {}
});
"""

def norm_code(s):
    t = re.sub(r'[^0-9A-Z]', '', str(s).upper()).replace('O', '0').replace('I', '1').replace('L', '1')
    if t.startswith('DUET'): t = t[4:]
    return ''.join(c for c in t if c in ALPHA)

def code_hash(code): return hashlib.sha256(('duet-lic|' + norm_code(code)).encode()).hexdigest()

def lock_key():
    k = os.environ.get('DUET_PENDRIVE_KEY', '').strip()
    if k: return k
    p = os.path.expanduser('~/.config/duet-stem/pendrive-lock.key')
    if not os.path.exists(p):
        os.makedirs(os.path.dirname(p), exist_ok=True)
        with open(p, 'w') as f: f.write(secrets.token_hex(32) + '\n')
        os.chmod(p, 0o600)
        print(f'made a new launcher key: {p} (keep it: every drive built with it has the same lock key)')
    return open(p).read().strip()

def build_launchers(key):
    src = os.path.join(HERE, 'launcher')
    h = hashlib.sha256()
    for f in sorted(os.listdir(src)):
        if f.endswith(('.go', '.mod')): h.update(f.encode()); h.update(open(os.path.join(src, f), 'rb').read())
    h.update(key.encode())
    cache = os.path.join(os.path.expanduser('~/.cache/duet-stem-pendrive'), h.hexdigest()[:16])
    os.makedirs(cache, exist_ok=True)
    env = dict(os.environ, CGO_ENABLED='0', GOFLAGS='-mod=mod')
    env['PATH'] = os.path.dirname(GO) + os.pathsep + env.get('PATH', '')
    out = {}
    old = next((g for g in GO120 if g and os.path.exists(g)), '')
    if not old: print('  (no Go 1.20: the launcher for old Windows will need Windows 10; see README.md)')
    for goos, arch, dest in TARGETS:
        go = old if (goos, arch) == ('windows', '386') and old else GO
        b = os.path.join(cache, f'{goos}-{arch}' + ('-go120' if go == old else '') + ('.exe' if goos == 'windows' else ''))
        if not os.path.exists(b):
            print(f'  go build {goos}/{arch}' + (' (Go 1.20: Windows 7 and newer)' if go == old else '') + '…', flush=True)
            e = dict(env, GOOS=goos, GOARCH=arch)
            e['PATH'] = os.path.dirname(go) + os.pathsep + env.get('PATH', '')
            if go == old: e['GOROOT'] = os.path.dirname(os.path.dirname(go)); e['GOTOOLCHAIN'] = 'local'
            subprocess.run([go, 'build', '-trimpath', '-ldflags', f'-s -w -X main.lockKey={key} -X main.version={h.hexdigest()[:12]}', '-o', b, '.'],
                           cwd=src, env=e, check=True)
        out[dest] = b
    return out

def walk(app, untracked):
    """the app folder's own web files now, by the rules of devtools/offline/build_sw.py (only files in git, unless
    untracked), so a file added since offline.json was last made is not missed"""
    sys.path.insert(0, os.path.join(REPO, 'devtools', 'offline'))
    import build_sw
    root = os.path.join(REPO, app); pub = None if untracked else build_sw.published(root); out = []
    for d, dirs, fs in os.walk(root):
        dirs[:] = sorted(x for x in dirs if x not in build_sw.SKIP_DIRS and not x.startswith('.'))
        for f in sorted(fs):
            if f in build_sw.SKIP_FILES or f.endswith(build_sw.SKIP_EXT) or f.startswith('.'): continue
            rel = os.path.relpath(os.path.join(d, f), root).replace(os.sep, '/')
            if pub is None or rel in pub: out.append(rel)
    return out

def files_for(app, untracked=False):
    """the app's files (offline.json's list, the folder's files now, and the few every app needs), as paths under
    DUET-STEM/"""
    root = os.path.join(REPO, app)
    try: listed = list(json.load(open(os.path.join(root, 'offline.json')))['files'])
    except Exception: listed = []
    have = set(listed)
    for a in walk(app, untracked) + ALWAYS:
        if a not in have and os.path.exists(os.path.join(root, a)): listed.append(a); have.add(a)
    out = []
    for p in listed:
        rel = os.path.normpath(os.path.join(app, p)).replace(os.sep, '/')
        if rel.startswith('..') or rel.endswith('/sw.js') or rel == app + '/sw.js': continue
        out.append(rel)
    return out

def maths_index_now():
    """maths/index.html made from science/index.html now (as devtools/offline/build_sw.py makes it), so the drive
    has the Science Lab's newest page even when build_sw.py has not run since"""
    sys.path.insert(0, os.path.join(REPO, 'devtools', 'offline'))
    import build_sw
    with tempfile.TemporaryDirectory() as t:
        os.makedirs(os.path.join(t, 'science')); os.makedirs(os.path.join(t, 'maths'))
        shutil.copy(os.path.join(REPO, 'science', 'index.html'), os.path.join(t, 'science', 'index.html'))
        build_sw.maths_index(t)
        return open(os.path.join(t, 'maths', 'index.html'), encoding='utf-8').read()

def put_file(src, dst, link):
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    if os.path.lexists(dst): os.remove(dst)
    if link: os.symlink(os.path.abspath(src), dst)
    else: shutil.copyfile(src, dst)

def write(dst, text, mode=None):
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    if os.path.lexists(dst): os.remove(dst)
    with open(dst, 'w', encoding='utf-8', newline='\n') as f: f.write(text)
    if mode: os.chmod(dst, mode)

def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('outdir'); ap.add_argument('--code', default=''); ap.add_argument('--school', default='')
    ap.add_argument('--apk-dir', default='/mnt/user-data/outputs/apk110'); ap.add_argument('--top', default='DUET-STEM-Smart-Class', help='the one folder on the drive that holds everything'); ap.add_argument('--apps', default='')
    ap.add_argument('--link', action='store_true'); ap.add_argument('--launchers', default=''); ap.add_argument('--force', action='store_true')
    ap.add_argument('--untracked', action='store_true', help='also files not yet in git (a test build before a commit)')
    ap.add_argument('--licences', default=os.path.join(REPO, 'licences.json'), help=argparse.SUPPRESS)  # tests only: another code list
    a = ap.parse_args()
    out = os.path.join(os.path.abspath(a.outdir), a.top); web = os.path.join(out, 'DUET-STEM')  # everything in one folder
    # every app of apps.json whose folder is in the repo (or the ones asked for), in the order of apps.json
    asked = [x for x in a.apps.split(',') if x] or [x for x in APPS if os.path.exists(os.path.join(REPO, x, 'index.html'))]
    for x in list(asked):
        if x not in APPS: sys.exit(f'{x} is not in devtools/pendrive/apps.json')
        if NEEDS.get(x) and NEEDS[x] not in asked: asked.append(NEEDS[x])
    apps = [x for x in APPS if x in asked]
    os.makedirs(out, exist_ok=True)
    if os.listdir(out) and not a.force and not os.path.exists(os.path.join(web, 'pendrive.json')):
        sys.exit(f'{out} is not empty (use --force)')

    # ---------------------------------------------------------------- the school code
    lic = json.load(open(a.licences))
    code = ''
    if a.code:
        n = norm_code(a.code)
        if len(n) != 12: sys.exit('the code must have 12 letters and numbers: DUET-XXXX-XXXX-XXXX')
        code = f'DUET-{n[0:4]}-{n[4:8]}-{n[8:12]}'
        e = lic.get('codes', {}).get(code_hash(code))
        if not e: sys.exit(f'{code} is not in licences.json: issue it first (duetlic.mjs issue … --pendrive), then build the drive')
        if e.get('r'): sys.exit(f'{code} is withdrawn in licences.json')
        if e.get('u', '') < datetime.date.today().isoformat(): sys.exit(f'{code} ended on {e.get("u")}')
        if not e.get('o'): print(f'WARNING: {code} is not a pen-drive code (o: 1): it will need the internet once to activate' + (' and works on only ' + str(e.get('n')) + ' device(s)' if e.get('n') else ''))
        miss = [x for x in apps if not ('*' in e.get('a', []) or x in e.get('a', []) or (x == 'maths' and 'science' in e.get('a', [])))]
        if miss: print('WARNING: the code does not open: ' + ', '.join(miss))
        valid_until = e.get('u', '')
    else:
        valid_until = ''
        print('No --code: a demo drive (the apps open their free demo, or ask for a code).')
    school = a.school.strip()

    # ---------------------------------------------------------------- the web apps
    print('copying the apps…', flush=True)
    want = []
    for app in apps: want += files_for(app, a.untracked)
    want = sorted(set(want))
    nbytes = 0
    for rel in want:
        src = os.path.join(REPO, rel)
        if not os.path.exists(src): print('  missing in the repo (skipped):', rel); continue
        put_file(src, os.path.join(web, rel), a.link); nbytes += os.path.getsize(src)
    if 'maths' in apps:
        t = maths_index_now()
        write(os.path.join(web, 'maths', 'index.html'), t)
    for app in apps: write(os.path.join(web, app, 'sw.js'), SW_STUB)
    put_file(a.licences, os.path.join(web, 'licences.json'), False)
    if os.path.exists(os.path.join(REPO, 'support.html')): put_file(os.path.join(REPO, 'support.html'), os.path.join(web, 'support.html'), False)
    build_id = datetime.datetime.now().strftime('%Y%m%d-%H%M%S') + '-' + secrets.token_hex(4)
    write(os.path.join(web, 'pendrive.json'), json.dumps({'duet': 1, 'id': build_id, 'apps': apps}) + '\n')
    if code: write(os.path.join(web, 'school.json'), json.dumps({'code': code, 'school': school}, ensure_ascii=False) + '\n')
    elif os.path.exists(os.path.join(web, 'school.json')): os.remove(os.path.join(web, 'school.json'))
    for stale in ('.duet-lock', 'licences-last.json'):  # a rebuilt drive starts fresh
        if os.path.lexists(os.path.join(web, stale)): os.chmod(os.path.join(web, stale), 0o644); os.remove(os.path.join(web, stale))

    # ---------------------------------------------------------------- home page, guide, Android page
    sys.path.insert(0, HERE)
    import pages
    write(os.path.join(web, 'index.html'), pages.home(apps))
    guide = pages.guide(code, school, valid_until, apps)
    write(os.path.join(web, 'guide.html'), guide)
    write(os.path.join(out, 'TEACHER-GUIDE.html'), guide)
    if code:
        write(os.path.join(out, 'CODE.txt'), pages.code_txt(code, school, valid_until).replace('\n', '\r\n'))
    elif os.path.exists(os.path.join(out, 'CODE.txt')): os.remove(os.path.join(out, 'CODE.txt'))

    # ---------------------------------------------------------------- Android apps
    adir = os.path.join(out, 'ANDROID'); apks = []
    if a.apk_dir and os.path.isdir(a.apk_dir):
        for f in sorted(os.listdir(a.apk_dir)):
            if f.endswith('.apk') and f.startswith('DUET-'):
                put_file(os.path.join(a.apk_dir, f), os.path.join(adir, f), a.link); apks.append(f)
    else: print('WARNING: no Android apps (--apk-dir)')
    write(os.path.join(adir, 'INSTALL.html'), pages.android(apks, code, school))

    # ---------------------------------------------------------------- the launchers
    print('launchers…', flush=True)
    if a.launchers: bins = {dest: os.path.join(a.launchers, os.path.basename(dest)) for _, _, dest in TARGETS}
    else: bins = build_launchers(lock_key())
    for dest, b in bins.items():
        if not os.path.exists(b): print('  missing launcher:', b); continue
        put_file(b, os.path.join(out, dest), False)
        os.chmod(os.path.join(out, dest), 0o755)
    write(os.path.join(out, 'START-DUET-STEM-Linux.sh'), pages.unix_script('linux'), 0o755)
    write(os.path.join(out, 'START-DUET-STEM-Mac.command'), pages.unix_script('mac'), 0o755)

    # ---------------------------------------------------------------- checks: names a FAT32/exFAT drive takes, sizes
    longest, bad, count, total, big = '', [], 0, 0, []
    for d, dirs, fs in os.walk(out):
        for f in fs:
            p = os.path.join(d, f); rel = os.path.relpath(p, out).replace(os.sep, '/')
            count += 1; sz = os.path.getsize(p); total += sz
            if len(rel) > len(longest): longest = rel
            if FAT_BAD.search(f) or f.endswith(('.', ' ')): bad.append(rel)
            if sz >= 4 * 1024 ** 3: big.append(rel)
    if bad: print('WARNING: names a FAT32/exFAT drive does not take:', bad[:10])
    if big: print('WARNING: files of 4 GB or more (FAT32 cannot hold them; use exFAT):', big)
    print(f'done: {out}\n  {count} files, {total / 1e9:.2f} GB (web apps {nbytes / 1e9:.2f} GB), longest path {len(longest)} characters: {longest}')
    if code: print(f'  school code {code}' + (f' · {school}' if school else '') + (f' · valid until {valid_until}' if valid_until else ''))
    print(f'  Copy the folder {a.top} to the pen drive (FAT32 or exFAT), then eject it safely.' if not a.link else '  (test build with symlinks: not for a drive)')

if __name__ == '__main__':
    main()
