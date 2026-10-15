SOLAR SYSTEM 360 - OFFLINE EDITION (Meta Quest, phones, PCs)
============================================================

LIVE SITE (already online, nothing to upload):
  https://ashutoshduet.github.io/duet-lms-media/space/

Everything the site needs is inside this folder: three.js, fonts, planet and moon
textures, NASA's 8K star map, star catalogues, 16 spacecraft 3D models and all
177 photos. On the first visit the site saves itself on the device (about 75 MB).
After that it opens with Wi-Fi switched off.

Important: do NOT open index.html by double-clicking or from a file manager (file://).
Browsers block 3D textures and offline saving for files. Use route A, B or C below.


ROUTE A - Meta Quest + the live site  (easiest, no computer needed)
-------------------------------------------------------------------
1. Put on the Quest and open the Browser.
2. Type  ashutoshduet.github.io/duet-lms-media/space  and open it.
3. Wait until the bottom of the page says "Saved on this device · works offline".
   Keep the page open until then (1-3 minutes on good Wi-Fi).
4. Bookmark the page (the star/bookmark button next to the address).
   If the Browser offers to install it as an app, accept.
5. Tap "AR / VR" at the top, then:
     VR · Deep space            you stand inside the Solar System
     Mixed reality · Your room  your real room, planets floating in it
6. From now on it works even without internet: Browser > Bookmarks > Solar System 360.


ROUTE B - Your own website
---------------------------
1. Upload the whole folder to your hosting, for example public_html/space/
   (keep the structure; include the hidden .htaccess file).
2. Open https://your-domain/space/ in the Quest Browser and follow route A from step 3.


ROUTE C - No internet at all, only a laptop + USB cable
--------------------------------------------------------
Needs: Quest Developer Mode, adb (Android Platform Tools) and Python on the laptop.
1. In the Meta Horizon phone app: Devices > your headset > Headset settings >
   Developer Mode > On. (Meta asks you to create a free developer organisation once.)
2. Install Android Platform Tools (adb) and Python 3 on the laptop.
3. Connect the Quest by USB. Inside the headset accept "Allow USB debugging".
4. Windows: double-click tools\quest-usb.bat     Mac/Linux: run tools/quest-usb.sh
5. In the Quest Browser open  http://localhost:8080  and wait for "Saved on this device".
6. Bookmark it, close the helper window and unplug. The bookmark keeps working offline.


QUEST CONTROLLERS (inside VR / mixed reality)
  Trigger (or pinch)  open or close a planet's card
  Grip                grab and move the whole model
  Thumbstick up/down  make the model bigger or smaller
  A / X               change the speed of time
  B / Y               bring the model back in front of you
  Meta button         leave the immersive view


BLUETOOTH GAMEPAD, KEYBOARD OR REMOTE
  Works with Xbox, PlayStation, 8BitDo and most Bluetooth gamepads, Bluetooth
  keyboards, presenter clickers and "VR box" remotes (game mode).
  Pair it first:  Quest: Quick Settings (clock) > Settings > Devices > Bluetooth >
                         Pair > put the gamepad in pairing mode > Pair a new device
                  Phone: Settings > Bluetooth          PC: Bluetooth settings
  Then open the site and press any button: "controller connected" appears.

    Left stick            turn the view / look around
    Right stick, LT / RT  zoom in and out (bigger / smaller in VR)
    LB / RB               previous / next planet, spacecraft or sky sight
    A                     open / select (in VR: the planet you look at)
    B                     go back / close
    X                     speed of time
    Y                     reset the view / bring the model back
    D-pad                 move the orange highlight between buttons and links
    Menu (Start)          AR & VR page
    View (Select)         button guide on screen

  Keyboard / remote: arrows or W A S D turn · + / - or Q / E zoom · Enter pick ·
  Esc close · [ ] previous / next · P speed · R reset · H guide

  Note: a browser lets VR start only from a tap, a click or the Quest controller,
  so press "VR · Deep space" with the Quest controller or your hand once.
  After that the Bluetooth gamepad works inside VR on browsers that pass it through.


OTHER DEVICES
  AR on your floor   Android phone, Chrome, Google Play Services for AR
  Phone VR box       any phone in a Cardboard-style viewer (A button = open planet)
  Camera AR          any phone with a camera, including iPhone
  iPhone Safari has no WebXR, so iPhones use "Phone VR box" and "Camera AR".

UPDATING
  If a file changes, upload the new folder. The offline copy updates the next
  time the device opens the site while online.

CREDITS
  Planet textures: Solar System Scope (CC BY 4.0) and three.js example textures,
  based on NASA imagery. Photos: NASA, ESA, JAXA and mission teams, credited on each
  photo inside the site. Star map: NASA SVS Deep Star Maps 2020. Fonts: Big Shoulders
  Display and IBM Plex (SIL Open Font License), via Fontsource. 3D engine: three.js r128
  (MIT). Full list: ORIGINAL-SOURCES.txt
