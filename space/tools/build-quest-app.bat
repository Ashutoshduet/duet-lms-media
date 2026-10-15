@echo off
setlocal
title Solar System 360 - build the Meta Quest app (APK)
echo ==============================================================
echo   Solar System 360 - Meta Quest app builder
echo   Before you start:
echo    1. The site folder is already uploaded to an https:// address
echo    2. Node.js 18 or newer is installed (https://nodejs.org)
echo    3. This PC has internet (the first run downloads Java + Android tools)
echo ==============================================================
echo.
where node >nul 2>nul || (echo Node.js was not found. Install it from https://nodejs.org and run this again.& pause & exit /b 1)

set "SITE=https://duetpower.in/space"
set /p "SITE=Web address of the uploaded site [%SITE%]: "
if "%SITE:~-1%"=="/" set "SITE=%SITE:~0,-1%"

echo.
echo Installing Meta's Bubblewrap tool...
call npm install --global @meta-quest/bubblewrap-cli
if errorlevel 1 (echo Install failed. Check the internet connection and try again.& pause & exit /b 1)

rem The Android project is created NEXT TO the site folder, so it never gets uploaded by mistake.
cd /d "%~dp0\..\.."
if not exist solar-system-quest-app mkdir solar-system-quest-app
cd solar-system-quest-app

echo.
echo --------------------------------------------------------------
echo  Bubblewrap will now ask some questions. Answer like this:
echo    Install / download JDK and Android tools?  Yes
echo    App mode ........................ 2D
echo    Application ID (package) ........ in.duetpower.solarsystem
echo    Display ......................... standalone, landscape
echo    Horizon Billing ................. No
echo    Signing key ..................... create a new one
echo  WRITE DOWN the two passwords. Every update needs the same key.
echo  (Full list: QUEST-APP-GUIDE.txt)
echo --------------------------------------------------------------
pause
call bubblewrap init --manifest=%SITE%/manifest.webmanifest --metaquest
if errorlevel 1 (echo Setup stopped. Fix the message above and run this again.& pause & exit /b 1)

call bubblewrap build
if errorlevel 1 (echo Build stopped. Fix the message above and run this again.& pause & exit /b 1)

echo.
echo ==============================================================
echo  APK ready:  %CD%\app-release-signed.apk
if exist assetlinks.json (
  echo  Upload assetlinks.json from this folder to your domain root:
  echo    https://YOUR-DOMAIN/.well-known/assetlinks.json
  echo  Without it the app shows a browser bar.
) else (
  echo  Create assetlinks.json: see step 6 in QUEST-APP-GUIDE.txt
)
echo ==============================================================
echo.
where adb >nul 2>nul
if errorlevel 1 (
  echo adb was not found. Install the APK with SideQuest instead
  echo ^(drag app-release-signed.apk onto SideQuest with the Quest connected^).
  pause & exit /b 0
)
set /p "GO=Quest connected by USB with Developer Mode on? Install now (Y/N): "
if /i "%GO%"=="Y" (
  adb install -r app-release-signed.apk && echo Installed. In the Quest: Library ^> Unknown Sources ^> Solar System 360
)
pause
