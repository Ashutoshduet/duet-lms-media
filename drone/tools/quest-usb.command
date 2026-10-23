#!/bin/sh
# DUET Drone Simulator - Meta Quest over USB (macOS: double-click in Finder; Linux: run in a terminal)
cd "$(dirname "$0")"
ADB=adb; [ -x "$HOME/Downloads/SolarSystem360-Quest/platform-tools/adb" ] && ADB="$HOME/Downloads/SolarSystem360-Quest/platform-tools/adb"
"$ADB" reverse tcp:8080 tcp:8080 || { echo "Quest not found: check the USB cable, Developer Mode and 'Allow USB debugging' in the headset."; exit 1; }
echo "In the Quest Browser open  http://localhost:8080  then press 'Fly in VR'."
python3 serve.py
