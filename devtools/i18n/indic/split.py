#!/usr/bin/env python3
"""Write each app's i18n/<lang>.json from the translations: only the texts the app has, and only translations that look
whole (none with the model's unknown-word mark, an English-only result for a real sentence, or a runaway repetition).
usage: split.py <repo> <translations_dir> <lang> [lang ...]"""
import json, os, re, subprocess, sys
repo, tdir, langs = sys.argv[1], sys.argv[2], sys.argv[3:]
SCRIPT = {'bn': 'ঀ-৿', 'mr': 'ऀ-ॿ', 'ta': '஀-௿', 'te': 'ఀ-౿', 'gu': '઀-૿', 'kn': 'ಀ-೿', 'ml': 'ഀ-ൿ', 'or': '଀-୿'}
ext = os.path.join(repo, 'devtools/i18n/indic/extract.mjs')
keys = {}
for app in ('science', 'body'):
    out = f'/tmp/_{app}_en.json'; subprocess.run(['node', ext, repo, app, out], check=True, capture_output=True); keys[app] = list(json.load(open(out)).keys())
def good(en, tr, L):
    if not tr or '⁇' in tr: return False
    if not re.search('[' + SCRIPT[L] + ']', tr): return len(re.findall(r'[A-Za-z]{3,}', en)) < 2  # no letters of the language: only for names, numbers, formulas
    if len(tr) > 4 * len(en) + 40: return False                                                       # ran away
    if re.search(r'(\b\S{3,}\b)(?:\s+\1){3,}', tr): return False                                     # the same word over and over
    return True
for L in langs:
    T = json.load(open(os.path.join(tdir, L + '.json')))
    for app in ('science', 'body'):
        d = {k: T[k] for k in keys[app] if k in T and good(k, T[k], L) and T[k] != k}
        os.makedirs(os.path.join(repo, app, 'i18n'), exist_ok=True)
        json.dump(d, open(os.path.join(repo, app, 'i18n', L + '.json'), 'w'), ensure_ascii=False, separators=(',', ':'))
        print(L, app, len(d), 'of', len(keys[app]))
