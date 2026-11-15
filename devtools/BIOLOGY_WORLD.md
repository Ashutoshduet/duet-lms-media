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
