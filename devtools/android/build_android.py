#!/usr/bin/env python3
"""Build the Play Store bundle (.aab) and a test APK for one DUET STEM app, with the whole web app inside.
Usage: build_android.py <app> [versionCode] [versionName]"""
import json, os, shutil, subprocess, sys
from PIL import Image, ImageDraw, ImageFont
REPO = os.environ.get('DUET_REPO', '/home/claude/duet-lms-media');  # DUET_REPO: build from a clean copy of the published site
R = os.path.dirname(os.path.abspath(__file__)); OUT = '/root/work/android-out'
APPS = {
  'science': dict(id='in.duetpower.stem.sciencelab', name='Science Lab 360', icon=(('/root/work/sci_art/DUET-ScienceLab360-icon.png') if os.path.exists('/root/work/sci_art/DUET-ScienceLab360-icon.png') else REPO + '/science/icons/icon-512.png'), fit=0.70, bg='#0d1118'),
  'body':    dict(id='in.duetpower.stem.humanbody', name='Human Body 360', icon=REPO + '/body/icons/icon-512.png', fit=1.0, bg='#0b0f17'),
  'space':   dict(id='in.duetpower.stem.solarsystem', name='Solar System 360', icon=REPO + '/space/icons/maskable-512.png', fit=1.0, bg='#05060c'),
  'drone':   dict(id='in.duetpower.stem.dronesim', name='Drone Simulator', icon=REPO + '/drone/icons/maskable-512.png', fit=1.0, bg='#0b0f17'),
  # Maths Lab 360 runs the Science Lab's code: inside the app the files sit at app/science/ and app/maths/ as on the website
  # Robotics Lab 360 is signed with the same upload key as every other DUET app (Nov 2026: a build of 20 Nov used a separate
  # key, which made 1.0.8 unable to replace 1.0.11 on panels and phones; 1.0.12 returns to the common key)
  'robotics': dict(id='in.duetpower.stem.roboticslab', name='Robotics Lab 360', icon=REPO + '/robotics/icons/maskable-512.png', fit=1.0, bg='#0b0f17'),
  'maths':   dict(id='in.duetpower.stem.mathslab', name='Maths Lab 360', icon=REPO + '/maths/icons/icon-512.png', fit=1.0, bg='#0d1118', updates=False),
  # the one-subject labs run the Science Lab's code too (their pages have <base href="../science/">), laid out like Maths
  'physics':   dict(id='in.duetpower.stem.physicslab', name='Physics Lab 360', icon=REPO + '/physics/icons/icon-512.png', fit=1.0, bg='#0d1118', updates=False),
  'chemistry': dict(id='in.duetpower.stem.chemistrylab', name='Chemistry Lab 360', icon=REPO + '/chemistry/icons/icon-512.png', fit=1.0, bg='#0d1118', updates=False),
  'biology':   dict(id='in.duetpower.stem.biologylab', name='Biology Lab 360', icon=REPO + '/biology/icons/icon-512.png', fit=1.0, bg='#0d1118', updates=False),
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

def banner(c):
    # 320 x 180 TV banner: the icon on the left, the app's name on the right
    res = os.path.join(R, 'app/src/main/res/drawable-xhdpi'); os.makedirs(res, exist_ok=True)
    b = Image.new('RGBA', (320, 180), c['bg']); im = Image.open(c['icon']).convert('RGBA').resize((120, 120), Image.LANCZOS)
    b.alpha_composite(im, (20, 30)); d = ImageDraw.Draw(b)
    try: f1 = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 22); f2 = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 15)
    except Exception: f1 = f2 = ImageFont.load_default()
    lines = []  # wrap the name into the 156 px beside the icon
    for w in c['name'].split():
        t = (lines[-1] + ' ' + w) if lines else w
        if lines and d.textlength(t, font=f1) <= 156: lines[-1] = t
        else: lines.append(w)
    y = 90 - 14 * len(lines) - 8
    for ln in lines: d.text((152, y), ln, font=f1, fill='#ffffff'); y += 28
    d.text((152, y + 4), 'DUET STEM', font=f2, fill='#9fb3c8')
    b.convert('RGB').save(f'{res}/tv_banner.png')

def content(app):
    dst = os.path.join(R, 'webcontent/src/main/assets'); shutil.rmtree(dst, ignore_errors=True); os.makedirs(dst + '/app')
    if app in ('maths', 'physics', 'chemistry', 'biology'): return content_maths(dst, app)
    man = json.load(open(f'{REPO}/{app}/offline.json'))
    for p in man['files']:
        os.makedirs(os.path.dirname(f'{dst}/app/{p}'), exist_ok=True); shutil.copy2(f'{REPO}/{app}/{p}', f'{dst}/app/{p}')
    shutil.copy2(f'{REPO}/{app}/offline.json', f'{dst}/app/offline.json'); shutil.copy2(f'{REPO}/licences.json', f'{dst}/licences.json')
    return man

def content_maths(dst, sub='maths'):
    man = json.load(open(f'{REPO}/{sub}/offline.json')); files = {}
    for p, v in man['files'].items():
        if p.startswith('../science/'): rel = 'science/' + p[len('../science/'):]
        elif p == '../licences.json': continue                  # the licence list goes next to app/ (below)
        elif p.startswith('../'): rel = p[3:]                    # shared places and textures (../maths/places/...)
        else: rel = sub + '/' + p
        src = os.path.normpath(f'{REPO}/{sub}/{p}')
        os.makedirs(os.path.dirname(f'{dst}/app/{rel}'), exist_ok=True); shutil.copy2(src, f'{dst}/app/{rel}'); files[rel] = v
    # the start page opens the maths page (its <base> points at ../science/)
    open(f'{dst}/app/index.html', 'w').write('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
        '<style>html,body{margin:0;background:#0d1118}</style><script>location.replace("' + sub + '/index.html")</script>')
    files['index.html'] = ['start', 0]
    out = {'v': man['v'], 't': man.get('t', 0), 'files': files}
    json.dump(out, open(f'{dst}/app/offline.json', 'w')); shutil.copy2(f'{REPO}/licences.json', f'{dst}/licences.json')
    return out

def main():
    app = sys.argv[1]; vc = sys.argv[2] if len(sys.argv) > 2 else '1'; vn = sys.argv[3] if len(sys.argv) > 3 else '1.0.0'; c = APPS[app]
    subprocess.run(['python3', REPO + '/devtools/offline/build_sw.py', REPO] + (['science', app] if app in ('maths', 'physics', 'chemistry', 'biology') else [app]), check=True)
    man = content(app); icons(c); banner(c)
    open(os.path.join(R, 'app.properties'), 'w').write(f"applicationId={c['id']}\nappName={c['name']}\nappDir={app}\nversionCode={vc}\nversionName={vn}\norientation=sensorLandscape\nbg={c['bg']}\nupdates={'false' if c.get('updates') is False else 'true'}\n" + (f"keyProps={c['keys']}\n" if c.get('keys') else ''))
    subprocess.run(['/opt/gradle/bin/gradle', '-q', '--no-daemon', ':app:bundleRelease'], cwd=R, check=True)
    od = f'{OUT}/{app}'; os.makedirs(od, exist_ok=True)
    aab = f'{od}/{c["id"]}-{vn}-{vc}.aab'; shutil.copy2(os.path.join(R, 'app/build/outputs/bundle/release/app-release.aab'), aab)
    kprops = c.get('keys', '/root/work/android-keys/upload.properties'); kp = dict(l.strip().split('=', 1) for l in open(kprops) if '=' in l)
    if not os.path.exists('/root/work/bundletool.jar'):  # no bundletool here: the Android Gradle plugin makes the same universal APK from the bundle
        subprocess.run(['/opt/gradle/bin/gradle', '-q', '--no-daemon', ':app:packageReleaseUniversalApk'], cwd=R, check=True)
        apk = f'{od}/{c["id"]}-{vn}-{vc}-test.apk'; shutil.copy2(os.path.join(R, 'app/build/outputs/apk_from_bundle/release/app-release-universal.apk'), apk)
        print(f'{app}: {len(man["files"])} files · aab {os.path.getsize(aab)/1e6:.1f} MB · apk {os.path.getsize(apk)/1e6:.1f} MB\n  {aab}\n  {apk}'); return
    apks = f'{od}/universal.apks'
    if os.path.exists(apks): os.remove(apks)
    r = subprocess.run(['java', '-jar', '/root/work/bundletool.jar', 'build-apks', '--bundle=' + aab, '--output=' + apks, '--mode=universal',
                        '--ks=' + kp['storeFile'], '--ks-key-alias=' + kp['keyAlias'], '--ks-pass=file:' + os.path.join(os.path.dirname(kprops), 'upload.pass'),
                        '--key-pass=file:' + os.path.join(os.path.dirname(kprops), 'upload.pass')], capture_output=True, text=True)
    if r.returncode: print('bundletool failed:', (r.stderr or r.stdout)[-1500:]); sys.exit(1)
    subprocess.run(['unzip', '-o', '-q', apks, 'universal.apk', '-d', od], check=True)
    apk = f'{od}/{c["id"]}-{vn}-{vc}-test.apk'; os.replace(f'{od}/universal.apk', apk); os.remove(apks)
    print(f'{app}: {len(man["files"])} files · aab {os.path.getsize(aab)/1e6:.1f} MB · apk {os.path.getsize(apk)/1e6:.1f} MB\n  {aab}\n  {apk}')

if __name__ == '__main__': main()
