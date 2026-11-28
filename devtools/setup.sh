#!/usr/bin/env bash
# One-time setup in a fresh clone: commit hook, test tools, three.js for Node, and (if reachable) the narration voices.
set -e
REPO="$(cd "$(dirname "$0")/.." && pwd)"
cp "$REPO/devtools/hooks/pre-commit" "$REPO/.git/hooks/pre-commit" && chmod +x "$REPO/.git/hooks/pre-commit"
(cd "$REPO/devtools" && npm install --no-audit --no-fund >/dev/null)
# the app code imports 'three'; Node finds it here when the narration job list is built
(cd "$REPO" && npm install --no-save --no-audit --no-fund three@0.170.0 >/dev/null)
pip install --break-system-packages -q piper-tts onnxruntime phonemizer-fork espeakng-loader 2>/dev/null || echo "TTS packages not installed: narration can't be generated in this session"
V="${DUET_VOICES:-$HOME/duet-voices}"; mkdir -p "$V"
# English: Piper LJSpeech (public domain)
HF=https://huggingface.co/rhasspy/piper-voices/resolve/main
for f in en/en_US/ljspeech/high/en_US-ljspeech-high.onnx en/en_US/ljspeech/high/en_US-ljspeech-high.onnx.json; do
  [ -s "$V/$(basename $f)" ] || curl -fsSL -o "$V/$(basename $f)" "$HF/$f" || echo "could not download $(basename $f)"
done
# Hindi and Hinglish: Kokoro-82M (Apache-2.0), see devtools/tts/kokoro_hi.py. Never the Piper Hindi voices (CC BY-NC-SA).
KV=$(sed -n "s/^VOICE = '\([a-z_]*\)'.*/\1/p" "$REPO/devtools/tts/kokoro_hi.py")
K=https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX/resolve/main
[ -s "$V/kokoro-v1.0.onnx" ] || curl -fsSL -o "$V/kokoro-v1.0.onnx" "$K/onnx/model.onnx" || echo "could not download kokoro-v1.0.onnx"
[ -s "$V/kokoro-$KV.bin" ] || curl -fsSL -o "$V/kokoro-$KV.bin" "$K/voices/$KV.bin" || echo "could not download kokoro-$KV.bin"
[ -s "$V/kokoro-config.json" ] || curl -fsSL -o "$V/kokoro-config.json" https://huggingface.co/hexgrad/Kokoro-82M/resolve/main/config.json || echo "could not download kokoro-config.json"
echo "setup done (voices in $V)"
