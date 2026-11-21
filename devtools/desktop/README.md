# DUET STEM desktop app (laptops: offline, and updating itself online)

`app/` is one Go program (Windows, macOS, Linux) that installs a DUET web app (Robotics Lab 360 first) on a laptop:
the app's files come inside it (`payload.zip`: exactly the website's files from `<app>/offline.json`), are unpacked into
the user's folder, served on `http://127.0.0.1:8761` (this computer only) and opened in Chrome or Edge as an app window
(own profile: closing the window ends the program). Online it updates itself from the website (only changed files,
checked by hash, switched in one step) and takes the newest `licences.json`. See the comment at the top of `app/main.go`.

    python3 devtools/desktop/build_desktop.py <published tree> <out> --app robotics --ver 1.0.0

Out: `DUET-RoboticsLab360-<ver>-Windows-Setup.exe` (one file: installs with Desktop + Start-menu shortcuts and a
Settings > Apps entry; `--uninstall`), `…-Mac.zip` (a universal .app: Apple silicon + Intel), `…-Linux.tar.gz` (x64 +
ARM64; the first start adds the menu and Desktop entries). Not signed: Windows SmartScreen says "More info → Run anyway";
macOS asks for right-click → Open (macOS 15: Settings → Privacy & Security → Open Anyway).

`winres/` makes the Windows icon, manifest and version information (`github.com/tc-hib/winres`).
Tested (21 Nov 2026) on Linux: install, serve, an update from a newer copy (only the changed file fetched), restart keeps
the update, a second start only opens the window, no paths outside the folder. Windows and macOS: built, not yet run on
a real machine.
