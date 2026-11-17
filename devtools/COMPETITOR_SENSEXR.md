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

## Their catalogue vs ours (17 Nov 2026)

- **Their catalogue:** 150 items, pulled from the phone's cached catalogue file. 61 are free and 91 premium.
- **Their app:** 273 MB from the Play Store, plus 7–172 MB downloaded per item.
- **Ways to use each item:** AR on their printed mat ("3D Pad"), a 6DOF controller, a VR headset, "3D", and red-cyan glasses (anaglyph). Most items allow all of these.
- **Ours:** about 450 activities.
  - Chemistry 86, physics 127, maths 128 and biology 54 (Science / Maths / Physics / Chemistry / Biology Lab).
  - Human Body: 16 labs and 9 journeys.
  - Solar System: 17 VR scenes.
  - Robotics: 16 lessons.
  - Drone simulator.

| Their subject | Items | We have it (or better) | Partly | Missing |
|---|---|---|---|---|
| Biology | 39 | 22 | 9 | 8 |
| Chemistry | 17 | 12 | 2 | 3 |
| Physics | 53 | 38 | 4 | 11 |
| Astronomy | 5 | 5 | 0 | 0 |
| Mathematics | 14 | 10 | 1 | 3 (two are Class 11–12) |
| Geography | 5 | 1 | 2 | 2 |
| Games / misc. / simulations | 17 | drone, robotics, rocket game, space quiz | – | pre-primary (alphabet, numbers, fruits, vegetables), Harappa, excavator, brick builder |

### Still to build so we have everything they have, plus more
- **Physics:**
  - devices: electric bell, DC motor, Van de Graaff generator, gold-leaf electroscope;
  - weather: lightning and the lightning conductor, cyclone;
  - light: total internal reflection (optical fibre), why the sky is blue (scattering), Newton's colour disc;
  - motion and the eye: inertia (coin on a card), eye defects and their correcting lenses, regular vs diffuse reflection;
  - space: the Goldilocks zone, Kepler's laws (from the Solar System orbits scene).
- **Biology:**
  - life cycles: butterfly, chicken;
  - heredity and evolution: Mendel's pea plants, variation and natural selection, a dinosaur and fossil world;
  - health: how diseases spread (germs, mosquitoes, washing hands);
  - plants: meristems and plant growth, a parts-of-a-plant explorer;
  - cells and body: a 3D cell with its organelles, adolescence, reproduction in animals (NCERT Class 8);
  - a bird sanctuary.
- **Chemistry:**
  - a biogas plant;
  - crystal lattices (simple, body-centred and face-centred cubic);
  - fibre to fabric (weaving);
  - density of a liquid (hydrometer);
  - a molecule-model explorer.
- **Geography:** rocks and minerals, landforms, how rivers shape the land, seasons (motion of the Earth).
- **Maths:** sum of the first n squares, a³ − b³.

### Ways to use the content: theirs vs ours
- **Already ours:**
  - the screen (touch, mouse);
  - a phone VR box with a Bluetooth controller;
  - Meta Quest (WebXR);
  - 65/75-inch classroom panels (pen drive);
  - Hindi, English and Hinglish.
- **To add (in the new DUET STEM 360 hub app, without changing the old apps):**
  - AR on a printed DUET pad and a hand-held DUET cube, scanned by the phone camera: our own printable design with ArUco markers, tracked in JavaScript;
  - red-cyan 3D glasses (anaglyph);
  - looking around by moving the phone (gyro 360);
  - Bluetooth controller buttons in every view.
