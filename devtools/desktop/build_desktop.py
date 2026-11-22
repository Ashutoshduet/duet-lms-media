#!/usr/bin/env python3
"""Build the DUET STEM desktop app (Windows Setup, Mac app, Linux) for one web app, from a published tree.

  python3 devtools/desktop/build_desktop.py <repo or clean worktree> <out dir> --app robotics --ver 1.0.0

The tree must have <app>/offline.json from devtools/offline/build_sw.py (the files and their hashes): the payload is
exactly the website's files, so the installed app and the website are the same version, and the app's own updater
(devtools/desktop/app) later fetches only what changed. Needs Go (/usr/local/go/bin/go) and Pillow.

Out:  DUET-<Name>-<ver>-Windows-Setup.exe   Windows 10/11 64-bit (one file: double-click to install and start)
      DUET-<Name>-<ver>-Mac.zip             macOS 11+ (Apple silicon and Intel in one app)
      DUET-<Name>-<ver>-Linux.tar.gz        Linux x64 and ARM64
"""
import argparse, hashlib, io, json, os, shutil, struct, subprocess, sys, tarfile, tempfile, zipfile
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
GO = shutil.which('go') or '/usr/local/go/bin/go'
APPS = {  # id: (name, exe name, port, bundle id); each app its own port, so several can run side by side
    'robotics':  ('Robotics Lab 360', 'RoboticsLab360', 8761, 'in.duetstem.roboticslab360.desktop'),
    'science':   ('Science Lab 360', 'ScienceLab360', 8762, 'in.duetstem.sciencelab360.desktop'),
    'maths':     ('Maths Lab 360', 'MathsLab360', 8763, 'in.duetstem.mathslab360.desktop'),
    'physics':   ('Physics Lab 360', 'PhysicsLab360', 8764, 'in.duetstem.physicslab360.desktop'),
    'chemistry': ('Chemistry Lab 360', 'ChemistryLab360', 8765, 'in.duetstem.chemistrylab360.desktop'),
    'biology':   ('Biology Lab 360', 'BiologyLab360', 8766, 'in.duetstem.biologylab360.desktop'),
    'body':      ('Human Body 360', 'HumanBody360', 8767, 'in.duetstem.humanbody360.desktop'),
    'space':     ('Solar System 360', 'SolarSystem360', 8768, 'in.duetstem.solarsystem360.desktop'),
    'drone':     ('Drone Simulator', 'DroneSimulator', 8769, 'in.duetstem.dronesimulator.desktop'),
}
STORED = ('.png', '.jpg', '.jpeg', '.webp', '.woff2', '.mp3', '.mp4', '.webm', '.glb', '.ktx2', '.gz', '.zip')

def payload(tree, app):
    man = json.load(open(os.path.join(tree, app, 'offline.json')))
    # the one-subject labs and Maths list the Science Lab's shared code as ../science/...: stored at science/... in the payload
    files = [os.path.normpath(f'{app}/{k}').replace(os.sep, '/') for k in man['files']] + [f'{app}/offline.json', f'{app}/sw.js']
    key = {os.path.normpath(f'{app}/{k}').replace(os.sep, '/'): k for k in man['files']}
    for extra in ('licences.json', 'support.html'):
        if os.path.exists(os.path.join(tree, extra)): files.append(extra)
    files = list(dict.fromkeys(files))  # ../licences.json in a list is the same file as licences.json
    buf = io.BytesIO(); n = 0
    with zipfile.ZipFile(buf, 'w') as z:
        for rel in files:
            p = os.path.join(tree, rel)
            if not os.path.exists(p): sys.exit(f'missing in the tree: {rel}')
            data = open(p, 'rb').read()
            if rel in key:
                want = man['files'][key[rel]][0]
                if hashlib.sha1(data).hexdigest()[:12] != want: sys.exit(f'{rel}: not the file offline.json lists (build_sw first)')
            zi = zipfile.ZipInfo(rel, date_time=(2026, 1, 1, 0, 0, 0)); zi.external_attr = 0o644 << 16
            zi.compress_type = zipfile.ZIP_STORED if rel.lower().endswith(STORED) else zipfile.ZIP_DEFLATED
            z.writestr(zi, data, compresslevel=9); n += 1
    return buf.getvalue(), man, n

def icons(png, work):
    im = Image.open(png).convert('RGBA')
    ico = os.path.join(work, 'icon.ico'); im.save(ico, sizes=[(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)])
    # .icns: PNG entries (ic07 128, ic08 256, ic09 512, ic10 1024)
    chunks = b''
    for tag, s in ((b'ic07', 128), (b'ic08', 256), (b'ic09', 512), (b'ic10', 1024)):
        b = io.BytesIO(); im.resize((s, s), Image.LANCZOS).save(b, 'PNG'); d = b.getvalue(); chunks += tag + struct.pack('>I', len(d) + 8) + d
    icns = os.path.join(work, 'icon.icns'); open(icns, 'wb').write(b'icns' + struct.pack('>I', len(chunks) + 8) + chunks)
    p256 = os.path.join(work, 'icon.png'); im.resize((256, 256), Image.LANCZOS).save(p256)
    return ico, icns, p256

def go_build(src, out, goos, goarch, ldflags, tags=''):
    env = dict(os.environ, GOOS=goos, GOARCH=goarch, CGO_ENABLED='0')
    cmd = [GO, 'build', '-trimpath', '-ldflags', ldflags, '-o', out]
    if tags: cmd[2:2] = ['-tags', tags]
    subprocess.run(cmd + ['.'], cwd=src, env=env, check=True)

def fat(arm64, amd64, out):
    """a universal Mach-O (the two slices as they are; each keeps its own ad-hoc signature)"""
    a, b = open(amd64, 'rb').read(), open(arm64, 'rb').read()
    # (cputype, subtype, data, align 2^n): x86_64 7/3, arm64 0x0100000C/0
    slices = [(0x01000007, 3, a, 12), (0x0100000C, 0, b, 14)]
    head = struct.pack('>II', 0xCAFEBABE, len(slices)); off = 4096; body = b''; table = b''; pos = off
    for ct, st, data, al in slices:
        pos = (pos + (1 << al) - 1) // (1 << al) * (1 << al)
        table += struct.pack('>IIIII', ct, st, pos, len(data), al)
        body += b'\0' * (pos - off - len(body)) + data; pos += len(data)
    open(out, 'wb').write((head + table).ljust(off, b'\0') + body); os.chmod(out, 0o755)

PLIST = """<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>CFBundleName</key><string>{name}</string><key>CFBundleDisplayName</key><string>{name}</string>
<key>CFBundleIdentifier</key><string>{bid}</string><key>CFBundleVersion</key><string>{ver}</string>
<key>CFBundleShortVersionString</key><string>{ver}</string><key>CFBundlePackageType</key><string>APPL</string>
<key>CFBundleExecutable</key><string>{exe}</string><key>CFBundleIconFile</key><string>icon</string>
<key>LSMinimumSystemVersion</key><string>11.0</string><key>LSUIElement</key><true/>
<key>NSHumanReadableCopyright</key><string>© DUET STEM</string><key>LSApplicationCategoryType</key><string>public.app-category.education</string>
</dict></plist>
"""

def zip_tree(root, base, out):
    with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED) as z:
        for d, _, fs in os.walk(os.path.join(root, base)):
            for f in sorted(fs):
                p = os.path.join(d, f); rel = os.path.relpath(p, root)
                zi = zipfile.ZipInfo(rel, date_time=(2026, 1, 1, 0, 0, 0)); zi.create_system = 3
                zi.external_attr = ((0o755 if os.access(p, os.X_OK) else 0o644) | 0o100000) << 16
                zi.compress_type = zipfile.ZIP_STORED if f == 'payload.zip' else zipfile.ZIP_DEFLATED
                z.writestr(zi, open(p, 'rb').read())

def main():
    ap = argparse.ArgumentParser(); ap.add_argument('tree'); ap.add_argument('out'); ap.add_argument('--app', default='robotics')
    ap.add_argument('--ver', default='1.0.0'); ap.add_argument('--only', default='win,mac,linux')
    a = ap.parse_args(); name, exe, port, bid = APPS[a.app]; os.makedirs(a.out, exist_ok=True)
    tag = 'DUET-' + name.replace(' ', '')
    work = tempfile.mkdtemp(prefix='duetdesk-'); src = os.path.join(work, 'app')
    shutil.copytree(os.path.join(HERE, 'app'), src)
    data, man, n = payload(a.tree, a.app); open(os.path.join(src, 'payload.zip'), 'wb').write(data)
    print(f'payload: {n} files, {len(data) / 1e6:.1f} MB, files version {man["v"]}')
    ico, icns, png = icons(os.path.join(a.tree, a.app, 'icons', 'icon-512.png'), work)
    ld = f'-s -w -X main.appID={a.app} -X "main.appName={name}" -X main.exeName={exe} -X main.port={port} -X main.version={a.ver}'
    outs = []
    if 'win' in a.only:
        subprocess.run([GO, 'run', '.', '-ico', ico, '-out', os.path.join(src, 'rsrc_windows_amd64.syso'), '-name', name, '-exe', exe, '-ver', a.ver],
                       cwd=os.path.join(HERE, 'winres'), check=True)
        o = os.path.join(a.out, f'{tag}-{a.ver}-Windows-Setup.exe'); go_build(src, o, 'windows', 'amd64', ld + ' -H windowsgui', 'embedpayload'); outs.append(o)
        os.remove(os.path.join(src, 'rsrc_windows_amd64.syso'))
    if 'mac' in a.only:
        appdir = os.path.join(work, 'mac', name + '.app'); mo = os.path.join(appdir, 'Contents', 'MacOS'); rs = os.path.join(appdir, 'Contents', 'Resources')
        os.makedirs(mo); os.makedirs(rs)
        for arch in ('arm64', 'amd64'): go_build(src, os.path.join(work, 'mac-' + arch), 'darwin', arch, ld)
        fat(os.path.join(work, 'mac-arm64'), os.path.join(work, 'mac-amd64'), os.path.join(mo, exe))
        shutil.copy(os.path.join(src, 'payload.zip'), rs); shutil.copy(icns, os.path.join(rs, 'icon.icns'))
        open(os.path.join(appdir, 'Contents', 'Info.plist'), 'w').write(PLIST.format(name=name, bid=bid, ver=a.ver, exe=exe))
        open(os.path.join(work, 'mac', 'READ ME FIRST.txt'), 'w').write(
            f'{name} for Mac (DUET STEM)\n\n1. Drag "{name}" into Applications.\n2. The first time: right-click it > Open > Open\n'
            f'   (on macOS 15 and newer: open it once, then System Settings > Privacy & Security > "Open Anyway").\n'
            f'3. It opens in Google Chrome or Microsoft Edge if one is installed (best), otherwise in Safari.\n'
            'It works without the internet. When the Mac is online it updates itself.\n')
        o = os.path.join(a.out, f'{tag}-{a.ver}-Mac.zip'); zip_tree(os.path.join(work, 'mac'), '', o); outs.append(o)
    if 'linux' in a.only:
        base = f'{tag}-Linux'; ld0 = os.path.join(work, 'linux', base); os.makedirs(ld0)
        go_build(src, os.path.join(ld0, exe), 'linux', 'amd64', ld); go_build(src, os.path.join(ld0, exe + '-arm64'), 'linux', 'arm64', ld)
        shutil.copy(os.path.join(src, 'payload.zip'), ld0); shutil.copy(png, os.path.join(ld0, 'icon.png'))
        open(os.path.join(ld0, 'README.txt'), 'w').write(f'{name} for Linux (DUET STEM)\n\nRun ./{exe} (64-bit PCs) or ./{exe}-arm64 (ARM).\n'
            'The first start installs it for this user (menu and Desktop icon) and opens it in Chrome / Chromium / Edge.\n'
            'It works without the internet. When the computer is online it updates itself.\n')
        o = os.path.join(a.out, f'{tag}-{a.ver}-Linux.tar.gz')
        with tarfile.open(o, 'w:gz') as t: t.add(ld0, base)
        outs.append(o)
    for o in outs: print(f'{os.path.getsize(o) / 1e6:6.1f} MB  {o}')
    shutil.rmtree(work)

if __name__ == '__main__':
    main()
