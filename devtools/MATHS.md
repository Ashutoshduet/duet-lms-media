# Adding Maths activities to Science Lab 360

Science Lab 360 (`science/`) runs NCERT activities in a 3D lab: in VR on Meta Quest, and with touch or a mouse on
phones and laptops. Each activity is a short list of steps; the app animates every step, shows the text in English,
Hindi and Hinglish, and plays a recorded voice (English and Hindi).

## Where things are

| File | What it holds |
|---|---|
| `science/js/mathlab.js`, `mathlab2.js` | the maths apparatus: paper shapes, tiles, cubes, cones, a clinometer… Each export returns an `Item` (or a `Vessel` for things that hold water) with methods the steps call (`place(i, k)`, `fold(k)`, `at(name)`…) |
| `science/js/experiments_m1.js`, `experiments_m2.js` | the activities (5 to 7 per batch) |
| `science/js/exp_i18n_m.js`, `exp_i18n_m2.js` | Hindi (`hi`) and Hinglish (`hg`) for every English sentence, keyed by the English text |
| `science/js/actions_phys.js` | registers apparatus modules on the kit (`K.MT`, `K.MT2`…) |
| `science/js/experiments.js` | imports each batch and pushes it onto `EXPERIMENTS` |
| `science/js/topics.js` | maths topics (numbers, algebra, geometry, mensuration, data) matched by chapter name |
| `science/voice/` | narration clips, named by a hash of the text (`devtools/tts`) |

## An activity

Copy the shape of the activities in `experiments_m2.js`:

```js
{
  id: 'm7_example', subj: 'maths', cls: 7, ch: N('Ch 5 · …', 'अध्याय 5 · …', 'Ch 5 · …'), title: X('…'),
  aim: X('To …'), kind: X('…'),
  setup(K) { const board = K.add(K.MT3.something(), 0, -0.56); view(K, board, 0.3, 0.38); return { board }; },
  steps: [
    { do: X('What the student does.'), target: 'board',
      act: async (K, o) => { await K.tween(2, (k) => o.board.move(k)); K.lab.emit('move', { obj: o.board.id }); await tagAt(K, o.board.at('x'), 'a label', 3); },
      ev: { type: 'move' }, see: X('What they see.'), why: X('Why it happens (optional).') },
  ],
  eq: { word: '…', sym: '…' },
  result: { obs: X('…'), concl: X('…'), safety: X('…'), viva: [{ q: X('…'), a: X('…') }, …] },
}
```

- Every `act` must emit the event named in `ev` (`K.lab.emit(type, …)`), or the step never completes.
- Useful kit calls: `K.add(item, x, z)`, `K.tween(seconds, (k) => …)`, `K.sleep(s)`, `K.showTag(text, worldPoint, offset, seconds)`,
  `K.beaker(x, z, 'water', ml, size)`, `K.pour(from, to, ml)`, `K.lab.fill(vessel, 'ink', ml)`.
- Flat apparatus is drawn in (u, v) on the table: world x = u, world z = −v. Give items `noGrab = true`, `height`, `radius`, `grabY`.
- `camView` on the main item aims the camera (see `view()` in the batch files).
- Use the chapter names of the books in use: Classes 6–8 *Ganita Prakash*, Class 9 *Ganita Manjari* (2026–27),
  Class 10 the rationalised NCERT book. Check a chapter name on the web before using it.
- Hindi: spoken classroom Hindi with common English science words (in Devanagari where natural) and the NCERT term in
  brackets where it helps. Hinglish: the same in Roman script. Lines that are only maths need no entry.
- Prefer hands-on activities from the NCERT book or lab manual that look good in 3D (folding, cutting, tiles, pouring,
  measuring). Do not repeat an existing activity (`grep "id: 'm" science/js/experiments_m*.js`).

## Check, narrate, publish

```sh
./devtools/setup.sh                                   # once per fresh clone
python3 -m http.server 8767 --bind 127.0.0.1 &        # from the repo root
cd devtools/test
PORT=8767 APPDIR=/science node exptest.mjs /tmp/shots m7_example,m8_other        # runs every step; screenshots per step
PORT=8767 APPDIR=/science node exptest.mjs /tmp/shots m7_example "mute&speed=4&fast&lang=hi"
PORT=8767 APPDIR=/science node openall.mjs            # every experiment must open: "bad":[] and no page errors
cd ../tts && node jobs.mjs && python3 gen.py 0 1 && python3 manifest.py   # narration for new sentences
```

Look at the screenshots: the apparatus must be in view and readable, nothing hidden behind the step card.
Commit with a clear message (the hook updates `sw.js` / `offline.json`, which is how installed apps update over the
air) and push to `main`. GitHub Pages publishes it in about 3 minutes.

Only push to `main` when every new activity finishes all its steps in English and Hindi and `openall` reports no
failures. Otherwise push to a branch named `maths-draft-<date>` and say what is unfinished.
