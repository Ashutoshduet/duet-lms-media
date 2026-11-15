#!/usr/bin/env python3
"""Build the Play Store bundle (.aab) and a test APK for one DUET STEM app, with the whole web app inside.
Usage: build_android.py <app> [versionCode] [versionName]"""
import json, os, shutil, subprocess, sys
from PIL import Image, ImageDraw
REPO = '/home/claude/duet-lms-media'; R = os.path.dirname(os.path.abspath(__file__)); OUT = '/root/work/android-out'
APPS = {
  'science': dict(id='in.duetpower.stem.sciencelab', name='Science Lab 360', icon='/root/work/sci_art/DUET-ScienceLab360-icon.png', fit=0.70, bg='#0d1118'),
  'body':    dict(id='in.duetpower.stem.humanbody', name='Human Body 360', icon=REPO + '/body/icons/icon-512.png', fit=1.0, bg='#0b0f17'),
  'space':   dict(id='in.duetpower.stem.solarsystem', name='Solar System 360', icon=REPO + '/space/icons/maskable-512.png', fit=1.0, bg='#05060c'),
  'drone':   dict(id='in.duetpower.stem.dronesim', name='Drone Simulator', icon=REPO + '/drone/icons/maskable-512.png', fit=1.0, bg='#0b0f17'),
}
DENS = {'mdpi': 1, 'hdpi': 1.5, 'xhdpi': 2, 'xxhdpi': 3, 'xxxhdpi': 4}

def icons(c):
    res = os.path.join(R, 'app/src/main/res')
    for d in os.listdir(res):
        if d.startswith('mipmap'): shutil.rmtree(os.path.join(res, d))
    src = Image.open(c['icon']).convert('RGBA')
    for d, k in DENS.items():
        n = int(108 * k); bg = Image.new('RGBA', (n, n), c['bg'])
        s = int(n * c['fit']); im = src.resize((s, s), Image.LANCZOS)
        if c['fit'] < 1:  # a picture with text: rounded tile inside the safe zone
            m = Image.new('L', (s, s), 0); ImageDraw.Draw(m).rounded_rectangle((0, 0, s - 1, s - 1), radius=int(s * 0.12), fill=255); im.putalpha(m)
        bg.alpha_composite(im, ((n - s) // 2, (n - s) // 2))
        os.makedirs(f'{res}/mipmap-{d}', exist_ok=True); bg.convert('RGB').save(f'{res}/mipmap-{d}/ic_launcher_bg.png')
        leg = bg.resize((int(48 * k), int(48 * k)), Image.LANCZOS); leg.convert('RGB').save(f'{res}/mipmap-{d}/ic_launcher.png')
    os.makedirs(f'{res}/mipmap-anydpi-v26', exist_ok=True)
    open(f'{res}/mipmap-anydpi-v26/ic_launcher.xml', 'w').write('<?xml version="1.0" encoding="utf-8"?>\n<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">\n  <background android:drawable="@mipmap/ic_launcher_bg" />\n  <foreground android:drawable="@android:color/transparent" />\n</adaptive-icon>\n')

def content(app):
    dst = os.path.join(R, 'webcontent/src/main/assets'); shutil.rmtree(dst, ignore_errors=True); os.makedirs(dst + '/app')
    man = json.load(open(f'{REPO}/{app}/offline.json'))
    for p in man['files']:
        os.makedirs(os.path.dirname(f'{dst}/app/{p}'), exist_ok=True); shutil.copy2(f'{REPO}/{app}/{p}', f'{dst}/app/{p}')
    shutil.copy2(f'{REPO}/{app}/offline.json', f'{dst}/app/offline.json'); shutil.copy2(f'{REPO}/licences.json', f'{dst}/licences.json')
    return man

def main():
    app = sys.argv[1]; vc = sys.argv[2] if len(sys.argv) > 2 else '1'; vn = sys.argv[3] if len(sys.argv) > 3 else '1.0.0'; c = APPS[app]
    subprocess.run(['python3', REPO + '/devtools/offline/build_sw.py', REPO, app], check=True)
    man = content(app); icons(c)
    open(os.path.join(R, 'app.properties'), 'w').write(f"applicationId={c['id']}\nappName={c['name']}\nappDir={app}\nversionCode={vc}\nversionName={vn}\norientation=sensorLandscape\nbg={c['bg']}\n")
    subprocess.run(['/opt/gradle/bin/gradle', '-q', '--no-daemon', ':app:bundleRelease'], cwd=R, check=True)
    od = f'{OUT}/{app}'; os.makedirs(od, exist_ok=True)
    aab = f'{od}/{c["id"]}-{vn}-{vc}.aab'; shutil.copy2(os.path.join(R, 'app/build/outputs/bundle/release/app-release.aab'), aab)
    kp = dict(l.strip().split('=', 1) for l in open('/root/work/android-keys/upload.properties') if '=' in l)
    apks = f'{od}/universal.apks'
    if os.path.exists(apks): os.remove(apks)
    r = subprocess.run(['java', '-jar', '/root/work/bundletool.jar', 'build-apks', '--bundle=' + aab, '--output=' + apks, '--mode=universal',
                        '--ks=' + kp['storeFile'], '--ks-key-alias=' + kp['keyAlias'], '--ks-pass=file:/root/work/android-keys/upload.pass',
                        '--key-pass=file:/root/work/android-keys/upload.pass'], capture_output=True, text=True)
    if r.returncode: print('bundletool failed:', (r.stderr or r.stdout)[-1500:]); sys.exit(1)
    subprocess.run(['unzip', '-o', '-q', apks, 'universal.apk', '-d', od], check=True)
    apk = f'{od}/{c["id"]}-{vn}-{vc}-test.apk'; os.replace(f'{od}/universal.apk', apk); os.remove(apks)
    print(f'{app}: {len(man["files"])} files · aab {os.path.getsize(aab)/1e6:.1f} MB · apk {os.path.getsize(apk)/1e6:.1f} MB\n  {aab}\n  {apk}')

if __name__ == '__main__': main()
