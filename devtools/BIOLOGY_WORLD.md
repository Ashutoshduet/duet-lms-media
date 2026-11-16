# Science Lab 360: biology in real places (ecosystems)

Biology activities happen at real size in real places, like the physics ones (`PHYSICS_WORLD.md`): the student stands at
a village pond, in a grassland or on a forest path (Poly Haven 360° photos, CC0, in `maths/places/`) and works with real
3D plants and animals in front of them. Scenes and apparatus are in `bioworld1.js` (model library, pond, food-chain
board, pesticide tester) and `bioworld2.js` (energy pyramid, forest floor, sorting baskets); activities in
`experiments_bw1.js`, Hindi and Hinglish in `exp_i18n_bw1.js`.

| Class | Chapter (NCERT) | Activity | Place |
|---|---|---|---|
| 10 | 13 Our Environment | bw10_pond_chain: pick algae, a snail, a small fish and a kingfisher out of the pond and lay the food chain on a board; 10,000 → 10 kJ | pond (table) |
| 10 | 13 Our Environment | bw10_pesticide: DDT from a field drain, tested in water, algae, small fish, big fish, kingfisher; 0.000003 → 25 ppm | pond (table) |
| 10 | 13 Our Environment | bw10_energy_pyramid: grass, grasshopper, frog, snake, hawk on a five-step stand; energy passed up by hand, 10% law | grassland |
| 10 | 13 Our Environment | bw10_decomposers: a forest floor slid through eight weeks; leaves and a dead beetle become humus, plastic stays | forest |
| 10 | 13 Our Environment | bw10_food_web: a grassland patch with grass, grasshoppers, frogs, two rat snakes and a hawk; slide the calendar on, take the frogs out and watch grasshoppers triple, the grass go and the snakes leave | grassland |
| 6 | 10 Living Creatures | bw6_living_sort: snail, stone, mushroom, dead bark, fern, bottle into living / non-living baskets | forest (table) |

## The 3D models (`science/models/eco/`)
Real specimens scanned by museums and scientists, from Sketchfab through the Objaverse index (open licences only: CC0,
CC BY, CC BY-SA; never NC or ND), and Poly Haven plants (CC0). Each is listed with its author, licence, link and what we
changed in `science/models/eco/credits.json`, shown on `science/credits.html` (linked from the class picker).

How they were made ready (tools in a scratch folder, not in the repo; `@gltf-transform` + `meshoptimizer` + `sharp`):
- remove the colour-checker cube of the specimen scans (a 12-triangle mesh), join, weld;
- simplify to 12k–50k triangles (scans whose texture islands stop it stay larger: the frog, the snail, the rat snake;
  "permissive" simplification across texture seams smears the skin, so it is not used);
- add smooth normals where the scan has none, sit the model on the ground centred, WebP textures (512 or 1024),
  meshopt compression (the app has the decoder);
- Poly Haven foliage: the alpha map is put into the colour map (their glTF has a JPEG without it), alpha MASK; the
  grassland uses Poly Haven's own dry-grass colour map;
- the hare is repainted from an arctic hare's white winter coat to a grizzled brown Indian hare;
- the rat snake's white scanning rock is taken away (triangles under the rock's light, grey texture, smoothed over
  neighbours, then the largest pieces of snake kept), and the hawk's tall post cut down to a short stump (`hawk_low`).
In the app (`ECO` in `bioworld1.js`) each model has its real length or height and the way its head points, so it can be
placed at real size facing any way; scans with their own animation (fish, turtle) play it.

## Next
- Class 6: a pond and its plants and animals: adaptations (2 Diversity in the Living World).
- Class 8: microbes: curd, yeast in dough, a compost pit (2 Microorganisms).
- Class 9 / 12: the water and carbon cycles at the pond; a pond's food web with decomposers.

# Biology at the bench, batch BIO2 (plants, food, respiration, osmosis, tropisms)

Activities at the lab bench with real glassware, in `experiments_bio2.js` (Hindi and Hinglish in `exp_i18n_bio2.js`);
the living things and special apparatus are in `biobench2.js` (plants, the test leaf, sunlight, dark box, clock, baths,
food chemistry) and `biobench2b.js` (food samples, oil paper, seeds, fridge, raisins, Hydrilla, lamp, polythene bag,
red-ink twig, seedlings, respirometer). Nothing is scripted to a fixed result:
- the potted plants are built from real leaves and flowers (Poly Haven sadabahar, CC0; ambientCG Leaf001, CC0) on a real
  scanned clay pot; where a pot stands (sun patch / room / dark box) sets its light;
- the test leaf keeps its own starch map pixel by pixel: dark hours use the starch up, light makes it only where the
  black paper, the white (variegated) patches and the KOH bottle let photosynthesis happen; alcohol (in a water bath:
  heated on a flame it catches fire) removes chlorophyll at a rate set by its temperature; iodine shows the map;
- the shared chemistry engine gets new substances and rules from `biobench2.js` (no change to `chem.js`): starch–iodine,
  salivary amylase (best at 37 °C, slow in the cold, destroyed above 62 °C), the biuret violet, KOH taking up CO₂;
- time-lapse steps use a clock with a slider (`timeSlider`): the student drags it, or Do it moves it; the plants, seeds,
  raisins and seedlings follow the hours that really passed under the conditions they really had;
- each result step has a `check` that reads the real state and replaces "You see / Why" with what actually happened.

| Class | Chapter (NCERT) | id | What the student does |
|---|---|---|---|
| 6 | 3 Mindful Eating | bio6_starch_test | iodine drops on potato, boiled rice, bread, apple, cucumber (real photos) on a white tile |
| 6 | 3 Mindful Eating | bio6_fat_test | groundnuts, butter, mustard oil, cucumber on paper squares; dry; hold each to a lamp |
| 6 | 3 Mindful Eating | bio6_protein_test | copper sulphate + caustic soda drops in water, milk, besan, rice water: violet = protein |
| 6 | 10 Living Creatures | bio6_germination | moong on dry cotton / moist cotton / under water / moist in the fridge; slide 3 days |
| 7 | 9 Life Processes in Animals | bio7_saliva_rice | boiled rice and chewed rice in water, 10 min, iodine |
| 7 (10) | 10 Life Processes in Plants | bio7_leaf_light | destarch in the dark box, black paper strip, sun 6 h, boil, alcohol bath, iodine |
| 7 (10) | 10 Life Processes in Plants | bio7_moll_leaf | half a leaf into a KOH bottle (Moll's), sun, starch test |
| 7 (10) | 10 Life Processes in Plants | bio7_hydrilla_o2 | baking soda, funnel, tube; count bubbles at 10/20/30 cm and lamp off; glowing splint |
| 7 (10) | 10 Life Processes in Plants | bio7_xylem_ink | white sadabahar twig in red ink 24 h; veins and petals redden; stem slice under a lens |
| 7 | 10 Life Processes in Plants | bio7_growth_needs | three saplings: sun + water, sun only, water in the dark; slide 14 days |
| 9 | 2 Cell: the Building Block of Life | bio9_raisins | raisins in water and in strong sugar solution; then swollen ones into sugar |
| 10 | 5 Life Processes | bio10_variegated_leaf | destarch 3 days, sun, starch test of a green-and-white leaf |
| 10 (7) | 5 Life Processes | bio10_transpiration | polythene bags over a leafy and a leafless shoot, sun 3 h |
| 10 (7) | 5 Life Processes | bio10_saliva_temp | starch + saliva at 4, 37 and 100 °C (+ water control), 20 min, iodine |
| 10 | 5 Life Processes | bio10_seeds_co2 | sprouting seeds, KOH tube in one flask, bent tubes into coloured water, 2 h |
| 10 | 6 Control and Coordination | bio10_phototropism | bean seedlings on a flask in a box open to the window; 2 days; turn; 2 days |

Assets (credits in `science/models/bio2/credits.json`, shown on `credits.html`): `models/bio2/clay_pot.glb` (Poly Haven,
CC0), `bio2/sadabahar.webp`, `bio2/testleaf.webp` (Poly Haven periwinkle colour map, CC0), `bio2/leaf_ovate.webp`
(ambientCG Leaf001, CC0), `bio2/raisin_skin.webp` (Evan-Amos, CC0), `bio2/bread_slice.webp` (Famartin, CC BY-SA 4.0),
`bio2/apple_half.webp` (J.smith, CC BY-SA 3.0), `bio2/cucumber_slice.webp` (viZZZual.com, CC BY 2.0). The alarm clock and
magnifying glass are the lab's existing Poly Haven models. Cut-outs were made with numpy/PIL/scipy (alpha from the
background, leaves turned petiole-down and packed into an atlas); the pot was reduced and meshopt-compressed with gltf-transform.

Curd setting and the yeast balloon (Class 8, Ch 2) are done in the kitchen by batch BW3 (`bw8_curd`, `bw8_yeast`), so
they are not repeated here. Next for this bench: a hibiscus flower to dissect (needs a real flower scan with separable parts), Mendel's cross with
round and wrinkled peas, vegetative propagation (potato eyes, Bryophyllum), pulse before and after exercise.
