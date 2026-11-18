# DUET AR: the cards, the pad, the cube, 360°, VR box and Meta Quest

`ar/` is the DUET AR web app (https://ashutoshduet.github.io/duet-lms-media/ar/). A student prints a page, points a phone
at it, and the model stands on the paper.

## What the student does

- **DUET AR Cards** (`ar/print/duet-ar-cards-*.pdf`): 60 cards, 4 on an A4 page, grouped by subject (Human Body 16, Space 12,
  Science 16, Robotics 8, Maths 8), each PDF with a cover (how to use in English and Hindi, a 50 mm check bar, the QR code of the
  scanner). Print at 100 %, cut on the dashed lines.
  - Each card: a picture rendered from our own model, the name in English and Hindi, its own marker (5×5 cells), three corner
    dots, a QR code that opens DUET AR on that card, and "On Meta Quest: open DUET AR, choose …".
  - Scanning (the phone's camera app on the QR code, or "Scan a card" in DUET AR): the card is found by itself and its model
    stands on it, following the card as it moves or tilts. No menu.
  - On the model: tap a part to see its name and hear it (EN / HI / Hinglish); one finger turns, two fingers pinch to zoom
    and twist to turn; **Take apart** (models with parts); **Listen**; **Turn**; **360°** (gyro) and **VR** (phone VR box)
    with the same model, and back to the card.
  - A card laid on the DUET Pad brings its model onto the pad (steadier: six big markers), in scan mode and in pad mode.
- **DUET Pad** (A4/A3) and **DUET Cube**: any model chosen in the app (`?model=<id>&mode=pad|cube`).
- **Meta Quest**: the Quest browser gives web pages no camera. DUET AR sees the headset (WebXR immersive-ar) and shows the
  model list; choosing a card's name starts mixed reality: point at the real table and pull the trigger (or pinch) to put the
  model there; trigger on a part for its label and voice; buttons beside it: Turn, Take apart, Listen, Bigger, Smaller,
  Move, End; thumbstick turns and resizes; grip carries it. With no room set-up it goes in front of you.

## Files

| file | what |
|---|---|
| `ar/catalog.json` | every model; `card` = the card number (marker id 100 + card). One item per line. |
| `ar/js/markers.js` | the marker codes (pad/cube: 4×4 cells; cards: 72 codes of 5×5) and the pad, cube and card layouts |
| `ar/js/detect.js` | finds squares (js-aruco2), reads them on both grids, finds the cards' solid dots, sub-pixel edges |
| `ar/js/pose.js` | pose of a board from all its points; for cards the dots decide between the two mirror-image fits |
| `ar/js/detect.worker.js` | the worker: detection and poses off the main thread |
| `ar/js/tracker.js` | camera, frames to the worker (whole picture or a sharper crop round the target), One Euro smoothing, hold/fade, card confirmation, flip filter |
| `ar/js/modes.js` | the modes: scan, screen, pad, cube, anaglyph, anaglyph-pad, gyro360, vrbox; take apart, gestures, picking |
| `ar/js/viewer.js` | the page: home, scanner, card switching, labels, narration, buttons |
| `ar/js/info.js`, `ar/info.json` | names, jobs and clips of tapped parts (from the Human Body app) and of each card |
| `ar/js/procedural.js` | maths solids, molecules, the Sun (our own) |
| `ar/js/xr.js` | Meta Quest mixed reality |
| `ar/models/robo_*.glb` | the Robotics Lab's own models, saved as GLB |
| `ar/voice/en/*.mp3` | English narration for cards without a recorded clip elsewhere (`en.json`: the words) |
| `ar/borrow.json` | files used from `../body`, `../space`, `../science` (the offline worker saves them too) |

## Making the files again

Static server first: `python3 -m http.server 8817 --bind 127.0.0.1` (repo root), then `AR_BASE=http://127.0.0.1:8817/`.

1. `node devtools/ar/export_robo.mjs` — robotics GLBs (only when the Robotics Lab models change).
2. `node devtools/ar/make_info.mjs` — `ar/info.json` (after catalog or Human Body content changes).
3. `python3 devtools/ar/make_voice.py <piper voices dir>` — English clips for `say: "ar:…"` items.
4. `node devtools/ar/make_thumbs.mjs` — the app's thumbnails.
5. `node devtools/ar/make_cards.mjs` — card pictures (`pics`) and the card PDFs/PNGs (`pdf`).
6. `node devtools/ar/make_print.mjs` — pad and cube PDFs.
7. `node devtools/ar/make_offline.mjs` then `python3 devtools/offline/build_sw.py . ar` — the offline worker. Note:
   `build_sw.py` lists only files known to git, and `ar/` is outside this checkout's sparse patterns: add it with
   `git add --sparse ar` (or `git sparse-checkout add /ar/`) before running it.

## Tests

- `python3 devtools/ar/card_photos.py <scratch> 1200` then `node devtools/ar/card_test.mjs <scratch>`: synthetic phone photos
  of the printed pages (20–60 cm, 0–60° tilt, any turn; normal, dim, yellow and glare light; blur, noise, JPEG; 1280×720 and
  640×480) → detection rate, pose error and jitter (raw and smoothed) by distance, light, tilt and camera.
- `node devtools/ar/scan_test.mjs`: the page end to end with a fake camera video (`card_video.py`): each card found by itself,
  the model on it, tap/take apart/360°/VR, a card on the pad, a portrait phone with the CPU 4× slower. Screenshots.
- `node devtools/ar/quest_test.mjs`: mixed reality on an emulated Quest 3 (IWER).

## Rules kept

- Models are referenced from the app that owns them (never copied), except the robotics snapshots.
- Licences: CC0 / public domain / CC BY / CC BY-SA only (`ar/credits.json`, shown on `ar/credits.html`). The Human Body app's
  Hindi and Hinglish narration (played for body cards and parts) is CC BY-NC-SA (the Piper Priyamvada voice): see open items.
- Phones: detection runs in a worker. The whole picture is scaled to 480 px on its long side (130–175 k pixels), and the crop
  round the target is at most 130 k pixels at a higher resolution, which gives the precision.
