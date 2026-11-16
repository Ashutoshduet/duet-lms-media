# What we learned from SenseXR Play (TechXR), November 2026

Studied on the test phone (OPPO CPH2461, app `com.TechXR.SenseXRExperiences`, version 17). Only the layout and the
ideas are noted here. We copy none of their pictures, models, films, text or names.

## How their app is organised

- Three hardware modes as tabs at the top of every page: their AR mat ("3D Pad"; you point the phone at a printed mat),
  a 6DOF controller, and a phone VR headset. Every item says which modes it supports.
- Filters: age (3–6, 7–9, 10–12, 13–15, 15+) and subject (Biology, Physics, Chemistry, Maths, Simulations).
- Four content types, each a bottom tab:
  - **Experiments**: "try it and see what happens". There are 5–35 per subject and each is 1–62 MB.
  - **Demonstrations**: bundles of 3D models "you watch work". Examples are Human Anatomy (9 items, 76 MB), Water World
    (sea animals) and Reptile Kingdom. There are 349 in all.
  - **3D Theatre**: 1-minute "Why …?" films for a VR headset, 18 MB each, for example why a straw looks bent. Each one
    asks one everyday question, answers it in about 66 s and plays offline.
  - **Store**: their mat and a Premium plan.
- Home shows the count of compatible items (382 for the mat), then one strip per subject with a "View all" button.
- Every item is a separate download. A downloaded item shows "Downloaded · plays offline" with a delete button. This
  keeps the base app small.
- The detail page has:
  - a big hero picture or carousel, with a round "zoom bubble" showing the science up close (rays at the water surface);
  - the subject, the ages and the size;
  - a 3–4 line description;
  - "Ways to play" (one tile per mode);
  - "How to play" (a video) and "Watch tutorial".
- The films start with a 2-step card ("put your phone in the headset", "adjust the lenses"), count down 3-2-1 and then
  play in stereo with a close (X) and a settings button.

## Where they are weak

- Many cards had no picture (blank white tiles).
- An experiment would not start without their mat. It sat on "Opening…".
- The Unity UI ignored the Android back key during loading.
- The films are video, so they are big (18 MB per minute) and you can only watch.
- English only.

## What we do instead (our own content, our own engine)

1. **Subject apps** (DUET Physics Lab, Chemistry Lab, Biology Lab and Maths Lab), built from the same code as Science
   Lab 360. Each one carries only its own narration, places and models, so it is smaller.
2. **"Kyun?" theatre**: 60–90 s narrated 3D stories (real-time three.js, not video) about one everyday question each.
   - Each is a few KB of script plus shared models, instead of 18 MB of video.
   - They work on a flat screen, in a phone VR box and on Quest.
   - You can pause one and turn the scene around. They are in Hindi and English.
   - Each one ends by opening the matching experiment ("now try it yourself").
3. **Zoom bubble**: in experiments and stories, a round inset that shows the hidden level (molecules, rays, cells)
   beside the real object.
4. **Cards always have a picture**: thumbnails rendered from our own scenes.
5. **Age and class filters** next to the subject filters, plus a mode badge on every card (Screen, VR box, Quest, TFT).
6. **Ocean and animals**: our next content gap, made from our own CC0 or CC-BY models.
