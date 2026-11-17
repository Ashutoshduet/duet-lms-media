# Science Lab 360: biology in real places (ecosystems)

Biology activities happen at real size in real places, like the physics ones (`PHYSICS_WORLD.md`): the student stands at
a village pond, in a grassland or on a forest path (Poly Haven 360° photos, CC0, in `maths/places/`) and works with real
3D plants and animals in front of them. Scenes and apparatus are in `bioworld1.js` (model library, pond, food-chain
board, pesticide tester) and `bioworld2.js` (energy pyramid, forest floor, sorting baskets); activities in
`experiments_bw1.js`, Hindi and Hinglish in `exp_i18n_bw1.js`. Batch BW2 (the grassland food web) is in `bioworld3.js` /
`experiments_bw2.js`; batch BW3 (nature and ecosystems, below) in `bioworld4.js` / `experiments_bw3.js` / `exp_i18n_bw3.js`.
BW3 adds two places from its own module (`PLACES.desert`: Goegap, Namaqualand; `PLACES.snow`: a snowy forest path) and
its models to `ECO` at load time, so `places.js` and the `ECO` table in `bioworld1.js` are not edited.

| Class | Chapter (NCERT) | Activity | Place |
|---|---|---|---|
| 10 | 13 Our Environment | bw10_pond_chain: pick algae, a snail, a small fish and a kingfisher out of the pond and lay the food chain on a board; 10,000 → 10 kJ | pond (table) |
| 10 | 13 Our Environment | bw10_pesticide: DDT from a field drain, tested in water, algae, small fish, big fish, kingfisher; 0.000003 → 25 ppm | pond (table) |
| 10 | 13 Our Environment | bw10_energy_pyramid: grass, grasshopper, frog, snake, hawk on a five-step stand; energy passed up by hand, 10% law | grassland |
| 10 | 13 Our Environment | bw10_decomposers: a forest floor slid through eight weeks; leaves and a dead beetle become humus, plastic stays | forest |
| 10 | 13 Our Environment | bw10_food_web: a grassland patch with grass, grasshoppers, frogs, two rat snakes and a hawk; slide the calendar on, take the frogs out and watch grasshoppers triple, the grass go and the snakes leave | grassland |
| 6 | 10 Living Creatures | bw6_living_sort: snail, stone, mushroom, dead bark, fern, bottle into living / non-living baskets | forest (table) |
| 6 | 2 Diversity in the Living World | bw6_pond_adapt: pour water from a lota on a lotus leaf (beads roll off) and a peepal leaf (it wets), cut a lotus stalk (air channels), push it under water (it floats), look at a fish (streamlined, gills) | pond (table) |
| 6 | 2 Diversity in the Living World | bw6_desert: a thermometer on the sand (62 °C) and on a hook at a camel's body height (41 °C), cut a cactus stem (stored water), bag a leafy plant and a cactus in the sun for four hours (only the leafy one mists) | desert (table) |
| 6 | 2 Diversity in the Living World | bw6_snow_trees: set a fir branch level, let it snow (it piles up, the branch bends and cracks), slope it down (snow slides off); needle leaves | snowy forest |
| 6 | 8 A Journey through States of Water | bw6_water_cycle: cover a basin of muddy pond water with a sheet, a stone over a katori, bag a plant, slide 10 am → 3 pm: clean water drips into the katori (only with the stone); ice in a steel glass sweats | pond (table) |
| 7 | 10 Life Processes in Plants | bw7_gas_balance: snails and Hydrilla dropped into tubes of carbon dioxide indicator, tube D in a black sleeve, six hours: yellow / purple / red / yellow follow what is in each tube | pond (table) |
| 8 | 2 The Invisible Living World | bw8_curd: a spoonful of curd into warm milk (A, B), B into the ice box, C nothing; overnight only A sets; tested with the spoon | kitchen (table) |
| 8 | 2 The Invisible Living World | bw8_yeast: yeast into one of two bottles of sugar water, balloons on both, two hours: one balloon blows up, its gas turns lime water milky; dough with yeast doubles | kitchen (table) |
| 8 | 12 How Nature Works in Harmony | bw8_seeds: aak, drumstick and mango seeds let go in the wind from the student's hand (distance from where and how high they were let go), a coconut floats in a tub, a hare carried through a gokhru bush takes the burrs away | grassland |
| 8 (10) | 12 How Nature Works in Harmony (10: 7 How do Organisms Reproduce?) | bw8_pollination: a scanned bumblebee carried from sunflower to sunflower; a flower gets seeds only if the bee came from another plant; the bagged flower stays empty after three weeks | field |
| 8 | 12 How Nature Works in Harmony | bw8_erosion: pull the plants out of one of two plots on a forest slope, an hour of heavy rain: muddy runoff, gullies and a bucket of soil below the bare plot, little clear water below the other | forest |

In BW3 each hands-on step works with the mouse, touch, a VR box controller or a Quest hand: things are carried and let go
over a glowing ring (`carry()` in `bioworld4.js`), knobs are slid or pushed; "Do it" plays the same action. What happens is
worked out from what the student actually did (which bowl got curd, which tube got a snail, the branch's angle, where a
seed was let go, which flowers the bee visited, how many plants were pulled out); where it differs from the book a step's
`check` shows what really happened and why.

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
- BW3: the cactus scan's flower pot is cut away (triangles below the soil line; it stands in the sand or in a clay pot
  drawn in code); only the stem and leaves of the CG sunflower are kept and the scanned sunflower head is put on them; one
  of Poly Haven's three fir saplings is kept (needles are real geometry: reduced to 30k triangles they still read as a
  young fir); the bumblebee is a museum scan (Virginia Tech), 2.2 cm long.
In the app (`ECO` in `bioworld1.js`) each model has its real length or height and the way its head points, so it can be
placed at real size facing any way; scans with their own animation (fish, turtle) play it.

## Next
- Class 8 (2 The Invisible Living World, Q4): two compost pits, peels with and without dry leaves, over four weeks (a
  `deep: true` copy of the farm place, so the pits can go below the photo's ground).
- Class 6 / 8: a habitats sorter (desert, mountain, pond, grassland) with the camel, fir, lotus, fish and frog models.
- Class 8 (13): a sanctuary walk with camera traps; needs open-licence scans of a deer, a langur and a tiger (none good
  in the Objaverse index; the yak and snow leopard there are cartoons).
- Real scans still wanted: a camel without a saddle cloth, a lotus plant, Hydrilla, an aak (Calotropis) plant.

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

# The ocean and animals, batch BW4

Nine activities about life in the sea and the groups and adaptations of animals, in `experiments_bw4.js` (reef, shark
and dolphin, ocean zones) and `experiments_bw4b.js` (the rest); scenes in `oceanworld1.js` (models, the two underwater
places, the shared material, the zoom bubble, the reef and open-sea activities), `oceanworld2.js` (vertebrates, life
cycles, birds, camouflage) and `oceanworld3.js` (the beach: salt pan, blubber); Hindi and Hinglish in `exp_i18n_bw4.js`.
All are under the biology topic `ocean` ("The ocean and animals"). Every activity opens with one everyday question
("Kyun? …"), narrated, and every hands-on step works with the mouse, touch, a VR box controller or a Quest hand
(`carry()` for things that are carried and let go over a ring, `slideKnob` / `pushKnob` for levers, clocks and buttons).
What happens follows what the student did, and each result step has a `check` that reads it.

| Class | Chapter (NCERT) | Activity | Place |
|---|---|---|---|
| 9 (6) | 7 Diversity in Living Organisms (older NCERT) | bw9_reef_phyla: pick up a sponge, brain coral, jellyfish, octopus, turban snail, crab, starfish, brittle star, a parrotfish swimming round and a flatfish hidden on the sand, and put each in one of six phylum trays; a zoom bubble shows the feature (pores, polyps, tube feet…); a sea turtle comes past ("a backbone, but is it a fish?") | coral reef (built) |
| 9 (6) | 7 Diversity in Living Organisms | bw9_shark_dolphin: let a glowing tag go on the tail of a swimming shark and a dolphin (the trail goes side to side / up and down, read from the bone the tag stuck to), hold a thermometer against each (26 / 36.5 °C), slide the clock 6 minutes (the dolphin blows every 2 minutes; the bubble shows the gill slits and the blowhole) | coral reef (built) |
| 6 (8) | 2 Diversity in the Living World | bw6_ocean_zones: a submersible; a thermocol cup in the basket outside or on the shelf inside, a lever down to 200, 1000 and 3000 m (colour cards lose red first, light 1 % at 200 m, temperature and pressure gauges, sardines → squid and lanternfish → anglerfish with its lure), the lamp shows the anglerfish is red; back up, the cup outside has shrunk | open ocean (built) |
| 9 (6) | 7 Diversity in Living Organisms | bw9_vertebrates: an infrared thermometer to a fish, frog, gecko, kingfisher and hare on a 15 °C morning, a hand lens on their skin (bubble), then each onto the mat of its class | pond (table) |
| 8 (10) | 3 Health: The Ultimate Treasure | bw8_life_cycles: frog spawn into a tank of pond water, tip out a tyre or a pot of rain water, slide two weeks (wrigglers, pupae and mosquitoes only in what was left full), tip out the other, slide to 8 and 16 weeks (tadpoles grow back legs, then froglets climb out) | pond (table) |
| 6 | 2 Diversity in the Living World | bw6_beaks_feet: carry grain, a fish, grubs in bark, a lizard and snails to a sparrow, kingfisher, woodpecker, hawk and duck; put "perching / swimming / climbing / catching prey" cards at their feet | pond (table) |
| 6 | 2 Diversity in the Living World | bw6_camouflage: find a stick insect, a grasshopper, a gecko and a chameleon on a forest path, move two of them anywhere, push the button: a crow catches whatever sits on a background of another colour | forest |
| 6 | 9 Methods of Separation in Everyday Life | bw6_sea_salt: lift the gate of a salt pan beside the sea, shut it at 10 cm (160 litres), slide 12 days (1 cm a day, brine turns pink, crystals at 26 %), rake the salt into a heap (35 g per litre: about 5.6 kg); a bowl of sea water and one of tap water dry on the table | beach |
| 6 (7) | 2 Diversity in the Living World | bw6_blubber: a whale blows far out at sea; three cans of 37 °C water (bare, wrapped in fat, in a woollen sock) into a tub of ice water, slide 10 minutes: about 4, 32 and 17 °C | beach (table) |

## The underwater places
There is no open-licence underwater 360° photo, so `PLACES.reef` (a lagoon 3 m deep, as off Lakshadweep) and
`PLACES.ocean` (the open Indian Ocean) are built in code (`buildWater()` in `oceanworld1.js`): a dome showing the bright
surface from below (Snell's window) fading to the deep colour, drifting "marine snow" points, light shafts on desktop
only, and on the reef a sand floor (Poly Haven coast_sand_01 colour map, CC0), sea grass and boulders with light coral
copies on them. The water itself is not a layer: one shared material (`lm()`: MeshLambertMaterial + colour map + injected
code, program key `bw4-uw-2`) loses each colour with depth (red first), hazes into the water's colour with distance, adds
caustics on what faces up and a lamp at the eye, and makes fish swim, coral sway and jellyfish pulse in the vertex shader.
All of it is uniforms, so the depth of the submersible, the lamp and the dry cabin change no program; only skinned,
instanced and see-through meshes add a variant. No light is added, no shadow light, no PBR on big surfaces (the beach sea
in `oceanworld3.js` uses the same Lambert material, not the standard one). The zoom bubble is a small render target drawn
when its disc is drawn (every second frame on phones).

## The 3D models (BW4)
All from Sketchfab via the Objaverse index (CC BY 4.0; one CC0) or the Smithsonian Open Access 3D API (CC0), credited in
`science/models/eco/credits.json` (shown on `credits.html`): sponge (Smithsonian, *Spongia graminea*), brain coral
(jordanmakesmaps), coral and *Corallium* (RISD Nature Lab; Smithsonian), yellow pencil coral (Smithsonian, *Madracis
auretenra*), jellyfish (n-), octopus, turban shell, crab, starfish, brittle star, parrotfish, puffer, sardine, squid,
lanternfish, anglerfish, flatfish, tadpole and stick insect (ffishAsia & floraZia specimen scans), dolphin, blacktip
shark, southern right whale, green sea turtle and house gecko with their own swim / walk clips (DigitalLife3D),
chameleon (dashdu), redhead duck and pileated woodpecker (cmp_innovation_studio), golden-crowned sparrow (ACEPrinceRupert).
The pond's frog and snail got lighter copies (`frog_lo`, `snail_lo`). Sizes: 12k–40k triangles, the decor corals and the
shoal sardine 1.5k–5k; WebP 256–1024; meshopt.

Most specimen scans are thousands of small texture islands, which stop ordinary simplification at about 110k
triangles. They were rebuilt instead (`rebake.mjs`, scratch tool: gltf-transform, meshoptimizer, xatlas, three-mesh-bvh,
sharp): weld by position and simplify the shape alone; unwrap a smoothed copy with xatlas (fewer, larger charts); for
each texel of the new atlas cast a ray along the normal into the full scan (`MeshBVH` with `indirect: true`, so the
index order, and with it each triangle's material, is kept) and take the colour there; dilate; one WebP. Other changes:
the brain coral's scanned base sheet cut away, the jellyfish turned upright with see-through tentacles, the whale's
specular-glossiness materials converted to metal-roughness, and normal / roughness maps the Lambert material does not
use removed from the skinned models.

## Not done yet (BW4)
- Plankton under the microscope and an ocean food chain (Class 8 / 10): needs CC0 / CC BY micrographs of diatoms,
  copepods and larvae (Wikimedia Commons was rate-limited while sourcing; the Biodiversity Heritage Library Flickr plates
  are an option).
- The three pond activities (vertebrates, life cycles, beaks and feet) stand in BW1's `pondScene`, which is heavy: in the
  phone check (light mode, 1369×648, CPU slowed 4×) the first pond activity of a session freezes about 2 s while the
  pond's own materials compile and its textures upload (BW3's bw6_pond_adapt: 2.0 s; bw9_vertebrates: 2.2 s), and draws
  610k–880k triangles in 165–260 draw calls a frame. The other BW4 activities open in 0.1–0.9 s (the forest and beach
  photos are most of it) with 30–80 draw calls. A lighter pond (fewer reeds and fish, the shared Lambert material) would
  help every pond activity, BW1 and BW3 too.
- A tide pool (sea anemones, barnacles, limpets) and a mangrove (mudskipper, breathing roots) would use the same water
  material; real scans of an anemone and a mudskipper are still wanted.
