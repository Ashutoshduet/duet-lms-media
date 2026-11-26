#!/usr/bin/env python3
"""Write media-manifest.json: every LMS media file that duetpower.in/lms/media/library/ keeps a copy of.

Usage: python3 build_manifest.py <duet-lms-media clone> <duet-lms-media-2 clone> [out.json]

- duet-lms-media: the files on the media-archive branch (lesson videos, walkthrough/, assets/, plates.js), copied from
  raw.githubusercontent.com (they are no longer on the GitHub Pages site).
- duet-lms-media-2: every file on its default branch, copied from its GitHub Pages site, into library/2/.
Commit the result to the media-archive branch as media-manifest.json, then open
https://duetpower.in/lms/media/library/media-sync.php: it copies whatever is new or changed and checks each file (SHA-1).
"""
import hashlib, json, subprocess, sys

def blobs(repo, ref):
    out = subprocess.run(['git', '-C', repo, 'ls-tree', '-r', '-l', ref], capture_output=True, text=True, check=True).stdout
    for line in out.splitlines():
        meta, path = line.split('\t', 1)
        _, typ, sha, size = meta.split()
        if typ == 'blob':
            yield path, sha, int(size)

def sha1_of(repo, sha):
    return hashlib.sha1(subprocess.run(['git', '-C', repo, 'cat-file', 'blob', sha], capture_output=True, check=True).stdout).hexdigest()

def main():
    r1, r2 = sys.argv[1], sys.argv[2]
    out = sys.argv[3] if len(sys.argv) > 3 else 'media-manifest.json'
    files = []
    for p, sha, size in blobs(r1, 'origin/media-archive'):
        if p in ('README.md', 'media-manifest.json'):
            continue
        files.append({'p': p, 's': size, 'h': sha1_of(r1, sha),
                      'u': 'https://raw.githubusercontent.com/Ashutoshduet/duet-lms-media/media-archive/' + p})
    for p, sha, size in blobs(r2, 'HEAD'):
        if p.split('/')[-1].startswith('.'):
            continue
        files.append({'p': '2/' + p, 's': size, 'h': sha1_of(r2, sha),
                      'u': 'https://ashutoshduet.github.io/duet-lms-media-2/' + p})
    json.dump({'v': 1, 'files': files}, open(out, 'w'), separators=(',', ':'))
    print(len(files), 'files,', round(sum(f['s'] for f in files) / 1048576, 1), 'MB ->', out)

if __name__ == '__main__':
    main()
