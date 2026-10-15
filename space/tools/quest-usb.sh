#!/bin/sh
# Solar System 360 - Meta Quest over USB (macOS / Linux)
cd "$(dirname "$0")"
adb reverse tcp:8080 tcp:8080 || { echo "Quest not found: check cable, Developer Mode and USB debugging."; exit 1; }
echo "In the Quest Browser open http://localhost:8080 and wait for 'Saved on this device'."
python3 serve.py
