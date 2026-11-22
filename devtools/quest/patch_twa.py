#!/usr/bin/env python3
"""Make a Quest TWA meet Meta's store packaging rules (Nov 2026): minSdk 32, targetSdk 34, installLocation auto,
excludeFromRecents on the launcher, com.oculus.supportedDevices, head tracking required for immersive apps,
no placeholder OCULUS_APP_ID, no app backup; versionCode + 1. Usage: patch.py <decoded dir>"""
import sys, re, pathlib
d = pathlib.Path(sys.argv[1]); m = (d / 'AndroidManifest.xml').read_text(); y = (d / 'apktool.yml').read_text()
vr = 'com.oculus.intent.category.VR' in m
m = re.sub(r'(<manifest [^>]*?)( package=)', r'\1 android:installLocation="auto"\2', m, count=1) if 'installLocation' not in m else m
m = re.sub(r'<uses-feature android:name="android.hardware.vr.headtracking"[^>]*/>',
           f'<uses-feature android:name="android.hardware.vr.headtracking" android:required="{"true" if vr else "false"}" android:version="1"/>', m)
m = re.sub(r'\s*<meta-data android:name="com.meta.horizon.platform.ovr.OCULUS_APP_ID"[^>]*/>', '', m)
m = m.replace('android:allowBackup="true"', 'android:allowBackup="false"')
m = re.sub(r'android:compileSdkVersion="\d+"', 'android:compileSdkVersion="34"', m); m = re.sub(r'android:compileSdkVersionCodename="[^"]*"', 'android:compileSdkVersionCodename="14"', m)
m = re.sub(r'platformBuildVersionCode="\d+"', 'platformBuildVersionCode="34"', m); m = re.sub(r'platformBuildVersionName="[^"]*"', 'platformBuildVersionName="14"', m)
if 'com.oculus.supportedDevices' not in m:
    m = re.sub(r'(<application [^>]*>)', r'\1\n        <meta-data android:name="com.oculus.supportedDevices" android:value="quest2|questpro|quest3|quest3s"/>', m, count=1)
m = re.sub(r'(<activity [^>]*android:name="[^"]*LauncherActivity")', lambda x: x.group(1) if 'excludeFromRecents' in x.group(1) else x.group(1).replace('<activity ', '<activity android:excludeFromRecents="true" '), m, count=1)
y = re.sub(r'minSdkVersion: \S+', 'minSdkVersion: 32', y); y = re.sub(r'targetSdkVersion: \S+', 'targetSdkVersion: 34', y)
vc = int(re.search(r"versionCode: '?(\d+)", y).group(1)) + 1
y = re.sub(r"versionCode: '?\d+'?", f"versionCode: {vc}", y)
vn = re.search(r"versionName: (\S+)", y).group(1).strip("'")
parts = vn.split('.'); parts[-1] = str(int(parts[-1]) + 1) if parts[-1].isdigit() else parts[-1] + '.1'; vn2 = '.'.join(parts)
y = re.sub(r"versionName: \S+", f"versionName: {vn2}", y)
(d / 'AndroidManifest.xml').write_text(m); (d / 'apktool.yml').write_text(y)
print(d.name, 'vr' if vr else '2d', vn, '->', vn2, 'code', vc)
