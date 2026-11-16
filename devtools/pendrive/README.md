# DUET STEM pen drive (classroom panels, projectors, computers — offline)

A pen drive that a teacher plugs into a classroom interactive flat panel (or a Windows / Linux / Mac computer with a
projector) to teach with the DUET STEM 3D apps without the internet: Science Lab 360, Maths Lab 360, Human Body 360,
Solar System 360 and the Drone Simulator. Android-only panels install the Android apps from the drive instead.

## Build a drive

```sh
# 1. one code per pen drive, issued first; it goes into licences.json: commit and publish it BEFORE the drive is used
#    on a computer that is online (online, the launcher serves the website's list, and a code missing there is dropped)
node devtools/licence-server/duetlic.mjs issue --name "School name, District" --until 2027-03-31 --apps '*' --pendrive

# 2. build the drive's contents into an empty folder (or straight onto the mounted USB drive)
python3 devtools/pendrive/build_pendrive.py /path/to/out --code DUET-XXXX-XXXX-XXXX --school "School name, District" \
    --apk-dir /mnt/user-data/outputs/apk110

# 3. copy the ONE folder /path/to/out/DUET-STEM-Smart-Class to the pen drive (FAT32 or exFAT, 4 GB or more), eject
#    safely: everything is inside it (START programs, guide, code, Android apps, the web apps)
```

Build from a committed tree (after `python3 devtools/offline/build_sw.py .`, which also makes `maths/index.html`; the
builder makes the drive's `maths/index.html` from `science/index.html` itself in any case).
The builder needs Go (`/usr/local/go/bin/go`) to make the launchers; they are cached in `~/.cache/duet-stem-pendrive/`.
Go 1.21+ makes Windows programs for Windows 10 and newer only, so the launcher for old Windows (7, 8, 32-bit) is made
with Go 1.20 when one is found (`DUET_GO120=/path/to/go1.20/bin/go`, `/usr/local/go1.20/bin/go` or
`~/sdk/go1.20.14/bin/go`); without it that launcher needs 32-bit Windows 10.
`--link` makes a quick test build with symlinks (never for a real drive).

About 1.75 GB in all (web apps ≈ 0.8 GB, Android apps ≈ 0.9 GB), about 12 000 files (most are short narration MP3s,
up to ~5 900 in one folder; copying them to a FAT32 drive takes a few minutes). All names are FAT32/exFAT-safe; the
longest path is 75 characters. A 4 GB drive is enough.

The builder takes each app's files from its `offline.json` and from the app folder itself (only files in git, by the
rules of `build_sw.py`, so a file added since `offline.json` was made is not missed; `--untracked` also takes files
not yet in git, for a test before a commit).

### The apps (one place: `apps.json`)

`apps.json` lists the apps on a drive, in the order of the home page: id (= the repo folder), title and Hindi title,
one line about it (English, Hindi), `classes` (Class 6–10 quick links, `?cls=`), `apk` (the APK's name part) and
`needs` (the Maths Lab needs the Science Lab's files). The builder takes every app of the list whose folder has an
`index.html`; the home page, the guide and the Android page are made from it. **Robotics Lab 360** later: one line
`{"id": "robotics", "title": "Robotics Lab 360", "hi": "रोबोटिक्स लैब 360", "about": "…", "about_hi": "…", "apk": "RoboticsLab360"}`
(+ its icon at `robotics/icons/icon-512.png`, its `offline.json`, and for the bigger text a `robotics:` line in the
`CFG` of `duetboard.js`; without it the app still gets the pen and the toolbar).

### What is on the drive

| | |
|---|---|
| `START-DUET-STEM.exe` | Windows 10/11, 64-bit (double-click) |
| `START-DUET-STEM-Linux.sh` | Linux x64 / ARM64 (Run as a Program, or `sh START-DUET-STEM-Linux.sh`) |
| `START-DUET-STEM-Mac.command` | macOS (Apple Silicon / Intel) |
| `TEACHER-GUIDE.html` | the teacher guide, English + Hindi; its first page has the school code (print it) |
| `CODE.txt` | the school code, for typing into the Android apps |
| `ANDROID/` | the Android apps (APKs) and `INSTALL.html` |
| `DUET-STEM/` | what the launcher serves: home page `index.html`, `guide.html`, the five apps, `licences.json`, `school.json`, `pendrive.json`; `launcher/` holds the old-Windows (7/8/32-bit), Linux and macOS programs |

## The launcher (`launcher/`, Go, no dependencies)

* Serves `DUET-STEM/` on **http://127.0.0.1:8740** — this computer only (no firewall prompt), the same port every time
  (browser storage is per port, so the teacher's settings and the activation stay); 8741…8759 only if 8740 is taken.
  Started twice, the second start just opens the browser.
* Own MIME table (`.js`/`.mjs`, `.wasm`, `.glb`, `.hdr`, `.webp`, `.mp3`, `.json`, …: a Windows registry can say
  `text/plain` for `.js`, which would stop the ES modules), HTTP Range (audio/video), no directory listings, nothing
  outside the folder, no dot-files, `launcher/` not served.
* Opens Chrome, else Edge, as an app window (`--app=URL --start-maximized`, no address bar) — else the default browser.
  `-fullscreen` adds `--start-fullscreen` (not the default: a browser-level full screen cannot be left from a touch
  screen without a keyboard; the teacher toolbar has its own Full screen button, which can).
* Console message in English and Hindi (+ Hinglish line for consoles without Devanagari fonts). No network is needed.
* Sizes (Go, static, stripped): Windows x64 6.7 MB, old Windows (386, Go 1.20) 5.4 MB, Linux x64 6.5 MB, Linux ARM64
  6.1 MB, macOS ARM64 6.5 MB, macOS x64 6.9 MB.
* Test builds only: `-ldflags "-X main.testIDEnv=DUET_TEST_MACHINE_ID"` takes the machine id from that variable, to play
  a second computer. The builder never sets it, so on a drive the variable does nothing.
* Writes only on the drive: `DUET-STEM/.duet-lock` and `DUET-STEM/licences-last.json`.

### Licences on a pen drive (owner's decision)

* **Every drive has its own pen-drive code** (`--pendrive`: `n: 1, o: 1` in `licences.json`, works without the
  internet). `build_pendrive.py` checks the code is in `licences.json`, not withdrawn and not ended, and writes
  `DUET-STEM/school.json` = `{"code", "school"}`, `CODE.txt` and the guide's first page.
* **The drive works only on the first computer it is started on.** First start: the launcher reads the machine id
  (Windows `HKLM\SOFTWARE\Microsoft\Cryptography\MachineGuid`, 64-bit view; Linux `/etc/machine-id`, else
  `/var/lib/dbus/machine-id`; macOS `IOPlatformUUID`; else the host name) and writes
  `DUET-STEM/.duet-lock` = hex(HMAC-SHA256(key, machineId + "|" + code)) (hidden + system + read-only on Windows).
  Later starts: a lock for another machine → the apps do not open; the console and every page say the drive is
  activated on another computer (contact info@duetpower.in) and `/school.json` is 403. A read-only drive: served,
  with a note in the console.
* `/school.json` (only with a valid lock) = `{"code", "school", "dev"}`, `dev` = first 24 hex of
  SHA-256("duet-dev|" + machineId) (the raw machine id is never sent). The apps fetch `../school.json` on
  127.0.0.1/localhost and activate from it offline; `dev` is this computer's id in the DUET STEM register (Chrome and
  Edge on one panel count as one device).
* `/licences.json`: the website's copy (`https://ashutoshduet.github.io/duet-lms-media/licences.json`, 4 s timeout,
  checked again after 5 minutes; after a failure the drive's copy is served at once for a minute), saved to
  `licences-last.json`; offline: `licences-last.json`, else the bundled `licences.json`. A captive-portal page is not
  taken for a list. So a withdrawn code stops on a panel that is sometimes online.
* The lock key: `DUET_PENDRIVE_KEY`, or `~/.config/duet-stem/pendrive-lock.key` (made once at random). It is compiled
  into the launchers (`-X main.lockKey`) and is never in the repo. Without it (`go build` by hand) a dev key is used.
* Limits (client-side only): someone who deletes the hidden `.duet-lock`, or copies the drive before its first start,
  can start it on another computer. The online register (the apps' claim with `dev`) is what finally stops a code that
  is used twice, the first time those computers are online.
* Other codes on panels: a normal code with `n: 0` works offline on any number of devices; a code with `n > 0` that is
  not a pen-drive code needs the internet once per device to take its place in the register.
* Android-only panels: install the APKs from `ANDROID/`, type the code from `CODE.txt` once per app (works offline; the
  first device keeps the code and registers it when it is first online).

## Teacher / panel mode (`duetboard.js`)

Master copy `science/duetboard.js`, identical copies in `body/`, `space/`, `drone/` (the Maths Lab loads the
Science Lab's). Plain JS, no dependencies, one script tag next to `duetperf.js`.

* On by itself on a large touch screen (touch and min(screen width, height) ≥ 1000 CSS px; not iPad, not headsets),
  or with `?panel=1`; `?panel=0` turns it off (both remembered: `localStorage['duet.board.v1']`). Elsewhere (not on
  phones) a small tab on the right edge turns it on. The pen drive's home page has Auto / On / Off.
* Bigger overlay: the app's own panels get CSS `zoom` (`[data-dbz]`), as if the screen were a 1280 × 720 laptop
  (1.5× at 1920 × 1080, 3× at 4K/100 %), A− / A+ from 70 % to 150 % of that. Parts that hold a canvas, and label/tip
  layers placed by the app's code, are never zoomed; the WebGL canvas keeps its resolution. Per app (`CFG` at the top
  of the file): `zoom` (which panels), `avoid` (more controls the toolbar keeps clear of: touch sticks, minimap),
  `xr` (when to hide), `css` (Space: its 3D stages' px height caps grow with the zoom, so the bigger texts over them
  still fit at 4K).
* Toolbar: at first only a round Teacher button; open, a compact two-column bar: Pen (6 colours, 3 sizes, eraser,
  undo, clear; finger, stylus or mouse, several fingers at once), Spotlight, All apps (pen drive only), Full screen,
  A− / A+, Close, Teacher mode off. It places itself where it covers the least of the app's (zoomed) panels: bottom
  right, else right middle, bottom left, left middle, …; it stays there while open (no jumping), and the teacher can
  drag it by its top bar (remembered). The pen's colours open beside it on the side with room (above or under it when
  neither side has room), never off the screen. The drawing canvas takes touches only while the pen is on, and is not
  shown at all when empty. Esc ends the pen or the spotlight.
* Hidden during WebXR sessions (any app: `navigator.xr.requestSession` is observed), the phone VR box / Camera AR
  (`body.pxr-on`), `body.in-vr` / `in-ar` / `in-xr`, Space's `.xr-full`, and when one of the app's own elements is in
  full screen.
* Words follow the app's language (en / hi / hg); Space and Drone show English + Hindi.
* On the pen drive (`/pendrive.json` answers on 127.0.0.1) it adds "All apps" and hides the apps' "save for offline"
  buttons. The drive's `sw.js` in each app is a stub (no caching: everything is on the drive).
* `DuetBoard.info()` (with `cover`: how much of the app's panels each part of the board covers, in px², and whether
  it is all on the screen), `DuetBoard.set(true|false)`, `DuetBoard.pen(true|false)` for tests.

## Test

```sh
# a test code in a test copy of the list (never the repo's), then a symlinked test drive (no second copy of the apps)
python3 devtools/pendrive/build_pendrive.py /tmp/pd --code DUET-TEST-… --school "Test" --link --untracked --licences /tmp/test-licences.json
/tmp/pd/DUET-STEM/launcher/start-duet-stem-linux-x64 -no-browser -remote ''        # offline: serves http://127.0.0.1:8740/
# a second computer: a launcher built with -X main.testIDEnv=DUET_TEST_MACHINE_ID, started with DUET_TEST_MACHINE_ID=other
```
Behind a TLS-inspecting proxy (as in the build sandbox) the online test needs `SSL_CERT_FILE` set to the proxy's CA.
