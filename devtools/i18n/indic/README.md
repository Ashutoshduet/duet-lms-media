# Eight more Indian languages

Bengali (bn), Marathi (mr), Tamil (ta), Telugu (te), Gujarati (gu), Kannada (kn), Malayalam (ml), Odia (or), in
Science Lab 360, Maths Lab 360 and Human Body 360, beside English, Hindi and Hinglish.

## How the apps use them
- `science/js/xlang.js` (copied to `body/js/` by the pre-commit hook). Every text in the apps is an object
  `{ en, hi, hg }`. xlang.js puts a getter for `bn`, `mr` … on `Object.prototype` that answers from
  `i18n/<code>.json` (English text → translation) once that file is loaded, so `o[L] || o.en` everywhere just works;
  a text without a translation shows in English. Texts built from other texts use `joinT()` / `fillT()`.
- The file loads when the language is chosen (the 🌐 menu on the screen; on the headset, the 🌐 button on the menu
  panel opens a page of all eleven languages). Its letters come from Noto Sans (OFL) files in `fonts/`, declared under
  the family name the apps already use ("Noto Sans Devanagari") with a `unicode-range`, so a script's file loads only
  when its letters are shown, and the canvas panels in the headset draw them too.
- Narration: the recorded voices are English and Hindi. In the other languages the narrator uses the device's own
  voice for that language when it has one (Android phones usually do); otherwise the text stays on screen.

## How the texts were made
1. `node extract.mjs <repo> science|body <out.json>`: every English text the app can show (the `en` of every
   `{ en: … }` in its code, every `X('…')` activity text, every key of the Hindi dictionaries; for Human Body also
   `models/content.json`).
2. `python3 translate.py <texts.json> <out_dir> bn mr ta te gu kn ml or`: IndicTrans2 (AI4Bharat, MIT licence), the
   distilled 200M English→Indic model in CTranslate2 form (`adalat-ai/ct2-rotary-indictrans2-en-indic-dist-200M` on
   Hugging Face), on the CPU, about 12 minutes a language. Formulas, maths, numbers with units and `{placeholders}` go
   through untouched; texts are translated sentence by sentence; it resumes where it stopped.
   (`ip.py` loads IndicTransToolkit's processor without its package `__init__`, which needs a newer transformers.)
3. `python3 split.py <repo> <out_dir> bn …`: each app's `i18n/<code>.json`, dropping broken results.

These are machine translations: good enough to follow every activity, not yet the hand-written quality of the Hindi.
Fixes go straight into the JSON files (or a reviewer's list fed back through step 3).
