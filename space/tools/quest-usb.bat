@echo off
title Solar System 360 - Meta Quest over USB
cd /d "%~dp0"
echo Linking the Quest over USB...
adb reverse tcp:8080 tcp:8080
if errorlevel 1 (
  echo.
  echo Could not reach the Quest. Check: USB cable connected, Developer Mode on,
  echo and "Allow USB debugging" accepted inside the headset. Then run this again.
  pause
  exit /b
)
echo.
echo Now, inside the Quest, open the Browser and go to:   http://localhost:8080
echo Keep this window open until the site shows "Saved on this device - works offline".
echo After that you can close this window and unplug the cable.
echo.
where python >nul 2>nul && (python serve.py) || (py serve.py)
pause
