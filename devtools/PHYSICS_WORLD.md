# Science Lab 360: physics in real places

The Science Lab's table-top physics experiments (`experiments_p*.js`) stay as they are. Next to them, physics
activities with `world: true` happen at real size in a real place, the same way the Maths Lab works: the student stands
in the school courtyard, on the playground, in a field or in a classroom, and does the experiment with their own hands.
The places are the Maths Lab's 360° photos and built rooms (`places.js`); `main.js setWorld()` swaps the lab for the
place and back. Apparatus is in `physworld*.js`, activities in `experiments_pw*.js`, Hindi in `exp_i18n_pw*.js`.

| Class | Chapter (NCERT; Classes 6–8 *Curiosity*) | Activity | Place |
|---|---|---|---|
| 6 | 4 Exploring Magnets | pw6_magnet_north: a freely hanging bar magnet settles North–South; an iron bar does not | courtyard (table) |
| 6 | 5 Measurement of Length and Motion | pw6_motion_kinds: a swing, a merry-go-round and a football draw an arc, a circle and a line | playground |
| 6 | 7 Temperature and its Measurement | pw6_sun_shade: thermometers in the sun and the shade from 8 a.m. to 2 p.m. | courtyard |
| 7 | 8 Measurement of Time and Motion | pw7_swing_pendulum: a swing timed over 5 oscillations, chains 2 m and 1.2 m | playground |
| 7 | 11 Light: Shadows and Reflections | pw7_torch_sheets: a torch through glass, butter paper and a cardboard star | classroom (table) |
| 7 | 12 Earth, Moon, and the Sun | pw7_stick_shadow: a 1 m stick's shadow from 8 a.m. to 4 p.m. (23° N, March) | field |
| 8 | 5 Exploring Forces | pw8_handcart: pulling a handcart through a spring balance; 25 N empty, 70 N loaded | courtyard |
| 8 | 6 Pressure, Winds, Storms, and Cyclones | pw8_brick_sand: a 30 N brick pressed into sand on each face; 1,190 to 3,640 Pa | playground |
| 9 | 7 Work, Energy and Simple Machines | pw9_pulley_roof: a 10 kg bucket lifted 5 m to a roof over a pulley; 490 J | courtyard |
| 9 | 10 Sound Waves | pw9_echo_wall: a clap and its echo from a wall 34 m away; 0.20 s, 340 m/s | playground |
| 10 | 9 Light – Reflection and Refraction | pw10_coin_bucket: a coin seems to rise as water is poured in; 30 cm looks 22.6 cm | kitchen (table) |
| 6 | 4 Exploring Magnets | pw6_compass_poles: an old magnet with worn-off marks (which end is N is chosen at random each time); slide a compass round it; the needle follows the real field (Earth 35 µT + the two poles) | courtyard (table) |
| 6 | 5 Measurement of Length and Motion | pw6_measure_class: glove hand spans along the teacher's table (16 cm vs teacher's 20 cm), a real 3 m tape hooked on its end (2.50 m), footsteps along the front wall (22 cm vs 27 cm) | classroom (table) |
| 7 | 7 Heat Transfer in Nature | pw7_sea_breeze: thermometers in the sand and the sea, an incense stick and a flag, clock 6 a.m.→2 p.m., then 6 p.m.→2 a.m. (the beach darkens); sea and land breeze, convection loop | beach (new place) |
| 7 | 11 Light: Shadows and Reflections | pw7_mirror_room: a 1.6 m mirror with a live reflection; a slate slid along a floor tape (image as far behind as the slate is in front); SCIENCE reversed, AMBULANCE card | classroom |
| 8 | 5 Exploring Forces | pw8_balloon_stream: rub a balloon on a woollen shawl (strokes add charge), bring it to a thin stream from the school taps; the stream bends; touching the water discharges it | courtyard |
| 8 | 10 Light: Mirrors and Lenses | pw8_periscope: a 2.2 m brick wall; tilt each mirror of a cardboard periscope; the eyepiece view is rendered live along the twice-reflected line of sight (only 45°/45° looks level over the wall) | courtyard |
| 9 | 4 Describing Motion Around Us | pw9_free_fall: a ball dropped 7.5 m and 3.75 m from the school block; the student starts/stops the stopwatch (own reaction time → own g); flat vs crumpled paper | courtyard |
| 9 | 6 How Forces Affect Motion | pw9_catch_ball: a 160 g ball at 14 m/s caught with glove hands; slider sets how far the hands give; F = Δp ÷ t, force–time graph of each catch; stiff hands: >1000 N, the ball bounces out | playground |
| 9 | 7 Work, Energy and Simple Machines | pw9_seesaw: a 30 kg sack at 1.0 m; slide a 20 kg sack until the see-saw rests level (1.5 m, real torque dynamics); a 10 kg bag cannot balance it anywhere | playground |
| 10 | 10 The Human Eye and the Colourful World | pw10_sprinkler_rainbow: a turning sprinkler at midday (Sun 50° up, behind you); every drop is coloured in the shader by its angle from the antisolar point (red 42.3°, violet 40.7°, faint second bow); pull it to the side and the bow is gone | playground |
| 10 | 11 Electricity | pw10_room_wiring: a house-wiring board (230 V, 10 A MCB, ammeter); three switches and bulbs in parallel (0.43 + 0.26 + 0.17 A); a 2000 W heater, then a 1000 W iron: the MCB trips | classroom (table) |

How PW3 is hands-on: each step is done only when the student has really done it (the handle at the far end, the
compass settled at the right place, the see-saw resting level for a second, the mirrors within 3° of 45°, the hands
stiff or pulled back as asked); results come from what they did (the compass needle from the field where the compass
is, the stream's path from the balloon's charge and distance, the catch force from the chosen give, the student's own
stopwatch time and g). Things can go wrong: the ball bounces out of stiff hands, a wet balloon loses its charge, an
overloaded circuit trips the MCB, a 10 kg bag cannot balance the see-saw. Hands are the app's own glove hands
(`lib/xr/hand-*.glb`, posed in code); the beach is registered from `physworld3.js` (Poly Haven `spiaggia_di_mondello`).

## Next
- Class 9: a string telephone across the playground: sound through a taut string, nothing through a slack one (10).
- Class 8: an electromagnet on a scrapyard crane lifting iron but not aluminium, dropping it when switched off (4).
- Class 9: Ohm's law on a real bench circuit in the classroom (only if it adds to p10_ohm); a pendulum's length vs period
  at real size is already pw7_swing_pendulum.
- Class 10: a torch's concave reflector, bulb at, inside and beyond the focus (9); a solar cooker's reflector (9).
- A night sky place for Class 7–8 (Moon phases, the Pole star) would need a new 360° night photo.
