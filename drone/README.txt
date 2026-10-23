DUET DRONE SIMULATOR · DUET STEM
================================
A realistic quadcopter simulator for schools, laptops, phones and Meta Quest (VR).
Works offline after the first visit.

WHAT IS INSIDE
  Maps            Village & Fields (village, farm plots, pond, power lines, race track),
                  Solar Park & Substation (4 panel blocks, 220 kV line 1.6 km long, 11 kV lines,
                  canal), Himalayan Valley (river, pine slopes, terraced village, footbridge, snow).
  Aircraft        FPV Racer 5" (Angle, Horizon, Acro), Camera Drone with GPS (C / N / S modes
                  like DJI, ATTI; auto take-off, land, return home, obstacle braking, 120 m limit,
                  smart low-battery return), Tiny Whoop 65 mm. Detailed models.
  Physics         4 motors with spin-up delay, thrust and torque mixing, battery voltage sag,
                  wind and gusts, prop wash, ground effect, collisions (wires too) and crashes.
  Radio link      Signal falls with distance and is blocked by hills, buildings and trees.
                  Digital video freezes and blocks up, analog video gets noisy; failsafe.
  Camera          DJI-style camera screen, FPV goggles OSD, gimbal, zoom, photos, video,
                  picture-in-picture, AR home point and waypoints.
  Missions        Free flight, Race with ghost, Training lesson, Solar inspection,
                  Search and rescue 1 km up the valley.
  Replays         Replay any flight (V) with scrubbing and slow motion.
  Views           Camera / FPV, chase, line of sight (standing next to the pilot), free orbit.
  Multiplayer and shared leaderboards work in the claude.ai version only.

PUT IT ON THE QUEST
  Route A (any time, no cable): the folder must be on an https:// address.
    1. Upload this folder, e.g. https://ashutoshduet.github.io/duet-lms-media/drone/
    2. Open that address once in the Quest Browser with internet. It saves itself.
    3. Press "Fly in VR".
  Route B (USB cable, no upload): on the Mac double-click tools/quest-usb.command,
    then open http://localhost:8080 in the Quest Browser and press "Fly in VR".
  App with its own icon (APK): see QUEST-APP-GUIDE.txt.

CONTROLS
  Keyboard    W/S throttle, A/D yaw, arrows pitch/roll, Enter arm, T/L/H take-off/land/home,
              Space brake, C view, R reset, 1-4 flight mode, [ ] camera tilt, Z zoom,
              K photo, J video, Y gallery, V replay, B beeper, X turtle mode.
  Gamepad     Mode 2 sticks, A arm, B reset, Y view, X flight mode.
  RC radio    USB joystick (HID) mode on the radio; Settings > Radio to map sticks and the
              SA arm, SB mode, SC beeper and SD turtle switches.
  Quest       Left stick throttle/yaw, right stick pitch/roll, A arm, B reset, X view, Y flight mode.
  Phone       On-screen sticks.

GRAPHICS
  Settings > Graphics quality: High (PC), Medium (laptops, phones), Meta Quest.
  The Quest profile is chosen automatically in the Quest Browser.

CREDITS
  three.js (MIT). Fonts: Chakra Petch, IBM Plex Sans and Mono (SIL OFL).
  All 3D models, textures and trees are generated in code by DUET STEM.
