#!/usr/bin/env bash
# One-time setup in a fresh clone: commit hook, test tools, three.js for Node, and (if reachable) the narration voices.
set -e
REPO="$(cd "$(dirname "$0")/.." && pwd)"
cp "$REPO/devtools/hooks/pre-commit" "$REPO/.git/hooks/pre-commit" && chmod +x "$REPO/.git/hooks/pre-commit"
(cd "$REPO/devtools" && npm install --no-audit --no-fund >/dev/null)
# the app code imports 'three'; Node finds it here when the narration job list is built
(cd "$REPO" && npm install --no-save --no-audit --no-fund three@0.170.0 >/dev/null)
pip install --break-system-packages -q piper-tts 2>/dev/null || echo "piper-tts not installed: narration can't be generated in this session"
V="${DUET_VOICES:-$HOME/duet-voices}"; mkdir -p "$V"
HF=https://huggingface.co/rhasspy/piper-voices/resolve/main
for f in en/en_US/ljspeech/high/en_US-ljspeech-high.onnx en/en_US/ljspeech/high/en_US-ljspeech-high.onnx.json hi/hi_IN/priyamvada/medium/hi_IN-priyamvada-medium.onnx hi/hi_IN/priyamvada/medium/hi_IN-priyamvada-medium.onnx.json; do
  [ -s "$V/$(basename $f)" ] || curl -fsSL -o "$V/$(basename $f)" "$HF/$f" || echo "could not download $(basename $f)"
done
echo "setup done (voices in $V)"
