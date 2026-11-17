// DUET Science Lab 360, biology in real places, batch BW4: the ocean and animals. A coral reef to sort into groups, a
// shark and a dolphin, a dive through the ocean's zones, the five classes of animals with a backbone, life cycles in
// still water, the beaks and feet of birds, animals hidden by their colours, salt from the sea and a whale's blubber.
// Every activity opens with one everyday question ("Kyun?"); the student does each step with their own hand, and what
// happens follows what they did. Scenes are in oceanworld1.js … oceanworld3.js; Hindi and Hinglish in exp_i18n_bw4.js.
import { DICT } from './exp_i18n.js';
import { DICT_BW4 } from './exp_i18n_bw4.js';
import * as MW from './mathworld.js';
import * as B4 from './bioworld4.js';
import * as O1 from './oceanworld1.js';
import { EXPERIMENTS_BW4B } from './experiments_bw4b.js';
Object.assign(DICT, DICT_BW4);
const X = (en) => ({ en, ...(DICT[en] || {}) });
const N = (en, hi, hg) => ({ en, hi, hg: hg || en });
const tl = (K, x) => (x && (x[K.app.lang] || x.en)) || '';
const t3 = (L, x) => (x && (x[L] || x.en)) || '';
const Wd = (K) => (k) => tl(K, X(k));
// a sentence made in all three languages from its parts: f(L, w) where w(k) translates a short English text
const F3 = (f) => ({ en: f('en', (k) => t3('en', X(k))), hi: f('hi', (k) => t3('hi', X(k))), hg: f('hg', (k) => t3('hg', X(k))) });
const OK = '#8be07a', WARN = '#ffb46b';
const run = (f) => new Promise((r) => { if (f(r) === false) r(); });
const camBy = (it, app, views) => { const u0 = it.update; let last = -1; it.update = (dt, t) => { const i = app.runner.i; if (i !== last) { last = i; const v = views[i]; if (v) it.camView = typeof v === 'function' ? v() : v; } if (u0) u0.call(it, dt, t); }; it.camView = views[0] || it.camView; };
const emit = (K, it, type) => () => K.lab.emit(type, { obj: it.id });
const C9D = N('Ch 7 · Diversity in Living Organisms (older NCERT, Class 9)', 'अध्याय 7 · जीवों में विविधता (पुरानी NCERT, कक्षा 9)', 'Ch 7 · Jeevon mein vividhta (purani NCERT, Class 9)');
const C6d = N('Ch 2 · Diversity in the Living World', 'अध्याय 2 · सजीव जगत में विविधता', 'Ch 2 · Living world mein diversity');

// ------------------------------------------------------------------ the reef's animals (names, groups, why)
const AN = {
  sponge: N('Sponge', 'स्पंज', 'Sponge'), braincoral: N('Brain coral', 'ब्रेन कोरल (मूँगा)', 'Brain coral'), jellyfish: N('Jellyfish', 'जेलीफ़िश', 'Jellyfish'),
  octopus: N('Octopus', 'ऑक्टोपस', 'Octopus'), turban: N('Turban snail', 'टर्बन घोंघा', 'Turban snail (ghongha)'), crab: N('Crab', 'केकड़ा', 'Kekda (crab)'),
  starfish: N('Starfish', 'तारामछली', 'Starfish (taaramachhli)'), brittlestar: N('Brittle star', 'भंगुर तारा', 'Brittle star'), parrotfish: N('Parrotfish', 'तोता मछली', 'Parrotfish (tota machhli)'), halibut: N('Flatfish', 'चपटी मछली', 'Flatfish (chapti machhli)'),
};
const PH = { porifera: N('Porifera', 'पोरिफ़ेरा', 'Porifera'), cnidaria: N('Cnidaria', 'नाइडेरिया', 'Cnidaria'), mollusca: N('Mollusca', 'मोलस्का', 'Mollusca'), arthropoda: N('Arthropoda', 'आर्थ्रोपोडा', 'Arthropoda'), echino: N('Echinodermata', 'इकाइनोडर्मेटा', 'Echinodermata'), chordata: N('Chordata (fish)', 'कॉर्डेटा (मछली)', 'Chordata (machhli)') };
const WHY = {
  sponge: X('A sponge has no organs; water flows in through the pores all over its body: Porifera.'),
  braincoral: X('A coral is a colony of tiny polyps, each a hollow body with stinging tentacles round its mouth: Cnidaria.'),
  jellyfish: X('A jellyfish is a hollow bag with stinging tentacles round its mouth, like the coral polyps: Cnidaria. It has no backbone, so it is not a fish.'),
  octopus: X('An octopus has a soft body with no bones and no jointed legs; its shell has been lost: Mollusca.'),
  turban: X('A snail has a soft body with a muscular foot inside a shell: Mollusca.'),
  crab: X('A crab has jointed legs and a hard outer skeleton: Arthropoda, like insects and spiders.'),
  starfish: X('A starfish has a spiny skin and a body in five parts, with tiny tube feet underneath: Echinodermata. It is not a fish.'),
  brittlestar: X('A brittle star also has five arms round a central disc and a spiny skin: Echinodermata.'),
  parrotfish: X('A fish has a backbone, fins and scales, and breathes with gills: Chordata.'),
  halibut: X('A flatfish is a real fish (backbone, fins, gills); it lies on one side, with both eyes on top: Chordata.'),
};
const SORT = [['sponge', 'braincoral', 'jellyfish'], ['octopus', 'turban', 'crab'], ['starfish', 'brittlestar'], ['parrotfish', 'halibut']];
// what a sorting step got: animals in the wrong tray
function sortCheck(i) {
  return (K, o) => { const bad = SORT[i].filter((n) => o[n].tray !== O1.PHYLA.indexOf(o[n].phylum)); if (!bad.length) return null;
    const lst = (L, w) => bad.map((n) => `${t3(L, AN[n])} → ${t3(L, PH[O1.PHYLA[o[n].tray]])}`).join(', ');
    return { ok: false, see: F3((L, w) => `${w('In the wrong tray')}: ${lst(L, w)}.`), why: F3((L) => bad.map((n) => t3(L, WHY[n])).join(' ') + ' ' + t3(L, X('Pick it up again and put it in the right tray.'))) }; };
}

export const EXPERIMENTS_BW4 = [
  // ============================================================ Class 9 (6) · the coral reef: sorting animals into groups
  {
    id: 'bw9_reef_phyla', subj: 'biology', cls: 9, also: [6], ch: C9D, world: true, place: 'reef', table: false, topic: 'ocean',
    title: X('A coral reef: sort its animals into their groups'),
    aim: X('To stand on a coral reef, pick up its animals with your own hand, sort them into groups (phyla) by their body features, and find out which of the "fish" of the sea are really fish.'),
    kind: X('Classification of animals: Porifera to Chordata'),
    setup(K) {
      const W = Wd(K); const rs = K.add(O1.reefSort({ W }), 0, 0, { y: 0 }); const o = { rs };
      for (const n of Object.keys(O1.REEF_ANIMALS)) { const A = O1.REEF_ANIMALS[n]; o[n] = K.add(O1.reefAnimal(n, AN[n]), A.at[0], A.at[2], { y: A.at[1] }); }
      const animals = Object.keys(O1.REEF_ANIMALS).map((n) => o[n]);
      const b = O1.bindReef(rs, animals, K.app, 1, SORT, { put: (a, ti) => {
        rs.label(ti, `${tl(K, AN[a.animal])}`); const r = K.app.runner, si = r.i - 1;
        if (si >= 0 && si < SORT.length && b.inAll(si) && r.state === 'todo') K.lab.emit('sorted', { obj: rs.id });
        const own = b.stepOf(a.animal) + 1; if (r.done && r.done.has(own)) { r.judge(own); r.changed(); } } });
      o.fin = emit(K, rs, 'sorted');
      camBy(rs, K.app, [rs.views.reef, rs.views.left, rs.views.right, rs.views.all, rs.views.sand, rs.views.turtle]);
      return o;
    },
    steps: [
      { do: X('Kyun? A starfish, a jellyfish and a cuttlefish are all called "fish". Are they really fish? Look around the reef first.'), target: 'rs',
        act: async (K, o) => { K.lab.emit('look', { obj: o.rs.id }); await K.sleep(4); }, ev: { type: 'look' },
        see: X('Coral, sponges, sea grass and many animals live on this shallow reef. Six trays stand in front of you, one for each big group of animals, with its main feature written above it.') },
      ...SORT.map((names, i) => ({
        do: [X('Pick up the sponge, the brain coral and the jellyfish, and put each in the tray of its group.'), X('Now the octopus, the turban snail and the crab: put each in the tray of its group.'),
          X('Now the starfish and the brittle star.'), X('Two fish live here: one swims round you, the other lies hidden on the sand at your feet. Find both and sort them.')][i],
        target: names[0],
        act: async (K, o) => { for (const n of names) { const a = o[n]; const want = O1.PHYLA.indexOf(a.phylum); if (a.tray !== want) await new Promise((r) => o.rs.place(a, want, r)); } K.lab.emit('sorted', { obj: o.rs.id }); },
        ev: { type: 'sorted' }, check: sortCheck(i),
        see: [X('The sponge goes to Porifera (pores all over it). The coral and the jellyfish both go to Cnidaria: soft hollow bodies with stinging tentacles.'),
          X('The octopus and the snail go to Mollusca: soft bodies, the snail inside a shell. The crab goes to Arthropoda: jointed legs and a hard outer skin.'),
          X('Both go to Echinodermata: spiny skin and a body built in five parts round the middle.'),
          X('Both go to Chordata. The flatfish was almost invisible on the sand: its back has the colour and the speckles of the sand.')][i],
        why: [X('Sponges are the simplest animals: no organs, just pores for water. Cnidarians catch food with stinging cells on their tentacles.'),
          X('Most of the animals on Earth are arthropods. Molluscs are the second biggest group; an octopus is a mollusc that has lost its shell.'),
          X('Echinoderms live only in the sea. They move on hundreds of tiny tube feet, worked by water pumped inside the body.'),
          X('Only the fish have a backbone. A starfish, a jellyfish and a cuttlefish are not fish at all.')][i] })),
      { do: X('A green sea turtle swims past. It has a backbone too. Is it a fish?'), target: 'rs',
        act: async (K, o) => { o.rs.turtle.visible = true; K.lab.emit('look2', { obj: o.rs.id }); await K.sleep(6); }, ev: { type: 'look2' },
        see: X('The turtle is in Chordata, like the fish, but it is not a fish: it has lungs and must come up to the surface to breathe, and it lays its eggs on land.'),
        why: X('Chordata are divided into classes: fish, amphibians, reptiles, birds and mammals. A turtle is a reptile.') },
    ],
    eq: { word: 'Groups of animals', sym: 'Porifera · Cnidaria · Mollusca · Arthropoda · Echinodermata · Chordata' },
    result: { obs: X('The sponge went to Porifera; the coral and the jellyfish to Cnidaria; the octopus and the snail to Mollusca; the crab to Arthropoda; the starfish and the brittle star to Echinodermata; the two fish to Chordata.'),
      concl: X('Animals are grouped by the plan of their body: pores, stinging tentacles, a soft body, jointed legs, a spiny five-part body, or a backbone. Of the reef\'s "fish", only the parrotfish and the flatfish are fish.'),
      safety: X('Never touch corals, jellyfish or sea urchins when you swim: many sting or cut, and corals die when they are touched or broken.'),
      viva: [{ q: X('To which group does a starfish belong?'), a: X('Echinodermata.') }, { q: X('What is common to a coral and a jellyfish?'), a: X('Both are Cnidaria: a hollow body with stinging tentacles.') },
        { q: X('Why is an octopus put with the snails?'), a: X('Both are molluscs: soft-bodied animals, most of them with a shell.') }] },
  },
  // ============================================================ Class 9 · a shark and a dolphin: fish and mammal
  {
    id: 'bw9_shark_dolphin', subj: 'biology', cls: 9, also: [6], ch: C9D, world: true, place: 'reef', table: false, topic: 'ocean',
    title: X('A shark and a dolphin: which one is a fish?'),
    aim: X('To tag the tails of a swimming shark and a dolphin, take their temperature, and time their breathing with your own hand, and find out why a dolphin is a mammal and not a fish.'),
    kind: X('Vertebrates: Pisces and Mammalia'),
    setup(K) {
      const W = Wd(K); const sd = K.add(O1.sharkDolphin({ W }), 0, 0, { y: 0 });
      const tags = [0, 1].map((i) => K.add(O1.thing(N('Glowing tag', 'चमकता टैग', 'Glowing tag'), O1.glowTag(), { hitR: 0.06, hitY: 0.02 }), -0.3 + i * 0.12, -0.5, { y: 0.88 }));
      const thermo = K.add(O1.thing(N('Thermometer', 'थर्मामीटर', 'Thermometer'), B4.thermometer(), { hitR: 0.07, hitY: 0.01 }), 0.25, -0.5, { y: 0.88 });
      const knob = K.add(MW.pullTab(), 0, -0.45);
      O1.bindSharkDolphin(sd, { tags, thermo, knob }, K.app, { tag1: 1, tag2: 2, t1: 3, t2: 4, clock: 5 }, { tagged: emit(K, sd, 'tagged'), temp: emit(K, sd, 'temp'), clock: emit(K, sd, 'm6') });
      camBy(sd, K.app, [sd.views.all, sd.views.shark, sd.views.dolphin, sd.views.shark, sd.views.dolphin, sd.views.up]);
      return { sd, tag1: tags[0], tag2: tags[1], thermo, knob };
    },
    steps: [
      { do: X('Kyun? A dolphin lives in the sea all its life and swims like a fish. So is a dolphin a fish? Watch the shark and the dolphin swim round in front of you.'), target: 'sd',
        act: async (K, o) => { K.lab.emit('look', { obj: o.sd.id }); await K.sleep(4); }, ev: { type: 'look' },
        see: X('Both have a smooth, streamlined body, fins and a strong tail. From far away they look alike.') },
      { do: X('Pick up a glowing tag and let it go on the shark\'s tail as it swims past. Watch the trail it leaves.'), target: 'tag1',
        act: async (K, o) => { await run((r) => o.sd.tagNow('shark', o.tag1, r)); K.lab.emit('tagged', { obj: o.sd.id }); }, ev: { type: 'tagged' },
        check: (K, o) => O1.tagCheck(o.sd, 'shark'),
        see: X('The trail snakes from side to side: the shark\'s tail beats sideways, left and right.'), why: X('A fish\'s tail fin stands upright and sweeps from side to side.') },
      { do: X('Now put the second tag on the dolphin\'s tail.'), target: 'tag2',
        act: async (K, o) => { await run((r) => o.sd.tagNow('dolphin', o.tag2, r)); K.lab.emit('tagged', { obj: o.sd.id }); }, ev: { type: 'tagged' },
        check: (K, o) => O1.tagCheck(o.sd, 'dolphin'),
        see: X('This trail goes up and down: the dolphin\'s tail flukes beat up and down.'), why: X('A dolphin\'s tail flukes lie flat and move up and down, the way a running mammal bends its back.') },
      { do: X('Hold the thermometer against the shark.'), target: 'thermo',
        act: async (K, o) => { await run((r) => o.sd.measure('shark', o.thermo, r)); K.lab.emit('temp', { obj: o.sd.id }); }, ev: { type: 'temp' },
        check: (K, o) => O1.tempCheck(o.sd, 'shark'),
        see: X('It reads 26 °C, the same as the water around it.'), why: X('A shark is cold-blooded: its body is as warm as the water it swims in.') },
      { do: X('Now hold the thermometer against the dolphin.'), target: 'thermo',
        act: async (K, o) => { await run((r) => o.sd.measure('dolphin', o.thermo, r)); K.lab.emit('temp', { obj: o.sd.id }); }, ev: { type: 'temp' },
        check: (K, o) => O1.tempCheck(o.sd, 'dolphin'),
        see: X('It reads about 36.5 °C, far warmer than the water.'), why: X('A dolphin is warm-blooded, like us. A layer of fat (blubber) under its skin keeps the heat in.') },
      { do: X('Slide the clock on 6 minutes and watch who comes up to breathe. The bubble shows each one\'s head up close.'), target: 'knob',
        act: async (K, o) => { await K.tween(8, (k) => o.sd.setT(6 * k)); o.sd.setT(6); await K.sleep(1.5); K.lab.emit('m6', { obj: o.sd.id }); }, ev: { type: 'm6' },
        check: (K, o) => (o.sd.breaths < 3 ? { ok: false, see: F3((L, w) => `${w('The dolphin breathed')} ${o.sd.breaths} ${w('times so far')}.`), why: X('Run the clock all the way to 6 minutes.') } : null),
        see: X('Every two minutes the dolphin swims up, puts its blowhole out of the water and breathes out with a spout of spray. The shark never comes up.'),
        why: X('A dolphin has lungs and breathes air through the blowhole on top of its head. A shark has gills behind its head (the slits in the bubble): they take oxygen out of the water as it flows through.') },
    ],
    eq: { word: 'Shark and dolphin', sym: 'shark: gills, cold-blooded, tail side to side · dolphin: lungs, warm-blooded, tail up and down' },
    result: { obs: X('The shark\'s tail beat from side to side, its body was 26 °C like the water, and it never came up. The dolphin\'s tail beat up and down, its body was 36.5 °C, and it came up to breathe every two minutes.'),
      concl: X('A shark is a fish (Pisces): gills, cold-blooded, an upright tail fin. A dolphin is a mammal (Mammalia): lungs, warm-blooded, flat tail flukes; it also gives birth to live young and feeds them on milk.'),
      safety: X('Never feed or chase wild dolphins or sharks. Watch them from a boat with a trained guide.'),
      viva: [{ q: X('How does a dolphin breathe?'), a: X('With lungs, through the blowhole on top of its head.') }, { q: X('Is a dolphin cold-blooded or warm-blooded?'), a: X('Warm-blooded.') },
        { q: X('Which way does a fish\'s tail move?'), a: X('From side to side.') }] },
  },
  // ============================================================ Class 6 (8) · the ocean's zones, in a submersible
  {
    id: 'bw6_ocean_zones', subj: 'biology', cls: 6, also: [8], ch: C6d, world: true, place: 'ocean', table: false, topic: 'ocean',
    title: X('Down into the deep sea in a submersible'),
    aim: X('To take a submersible down through the sunlit, twilight and midnight zones of the ocean with your own hand, read the light, temperature and pressure at each depth, and find out how deep-sea animals are suited to the dark, the cold and the crushing pressure.'),
    kind: X('Habitats: the zones of the ocean'),
    setup(K) {
      const W = Wd(K); const sd = K.add(O1.subDive({ W }), 0, 0, { y: 0 });
      const cup = K.add(O1.thing(N('Foam cup', 'थर्मोकोल का कप', 'Thermocol cup'), O1.foamCup(), { hitR: 0.07, hitY: 0.04 }), -0.2, -0.45, { y: 0.9 });
      const lever = K.add(MW.pullTab(), -0.32, -0.56, { y: 0.93 }); const lamp = K.add(MW.pullTab(), 0.42, -0.62, { y: 0.93 });
      O1.bindDive(sd, { cup, lever, lamp }, K.app, { cup: 1, d1: 2, d2: 3, d3: 4, lamp: 5, up: 6 }, { cup: emit(K, sd, 'cup'), depth: emit(K, sd, 'depth'), lamp: emit(K, sd, 'lamp') });
      camBy(sd, K.app, [sd.views.up, sd.views.panel, sd.views.cards, sd.views.all, sd.views.all, sd.views.all, sd.views.panel]);
      return { sd, cup, lever, lamp };
    },
    steps: [
      { do: X('Kyun? Why is the deep sea dark and cold, and why do so many deep-sea animals make their own light? You are in a small submersible at the surface of the Indian Ocean. Look around.'), target: 'sd',
        act: async (K, o) => { K.lab.emit('look', { obj: o.sd.id }); await K.sleep(4); }, ev: { type: 'look' },
        see: X('Sunlight flickers down through the waves. Sardines, a sea turtle and dolphins swim near the surface. The gauges read 0 m, 100 % light, 28 °C and 1 atmosphere.') },
      { do: X('Take the foam cup and put it in the steel basket outside the window, on the submersible\'s arm.'), target: 'cup',
        act: async (K, o) => { await run((r) => o.sd.putCup(o.cup, 'out', r)); K.lab.emit('cup', { obj: o.sd.id }); }, ev: { type: 'cup' },
        check: (K, o) => (o.sd.cupWhere === 'in' ? { ok: false, see: X('Your cup is on the shelf inside the cabin.'), why: X('Inside the cabin the air stays at 1 atmosphere, whatever the depth. The steps that follow work with the cup either way; watch what happens to it.') } : null),
        see: X('The cup sits in the basket, in the sea water outside.') },
      { do: X('Push the lever forward: dive to 200 m, the bottom of the sunlit zone. Watch the colour cards outside.'), target: 'lever',
        act: async (K, o) => { await K.tween(6, (k) => o.sd.setDepth(200 * k)); o.sd.setDepth(200); K.lab.emit('depth', { obj: o.sd.id }); }, ev: { type: 'depth' },
        see: X('The red card goes dark first, by about 20 m, then the orange and yellow ones. At 200 m only a dim blue light is left, about 1 % of the light at the surface, and the water is about 20 °C. The pressure is 21 atmospheres.'),
        why: X('Water soaks up sunlight: red first, blue last. Below 200 m there is too little light for seaweed and plankton to make food, so the sunlit zone is where nearly all the ocean\'s food is made.') },
      { do: X('Dive on to 1000 m, through the twilight zone.'), target: 'lever',
        act: async (K, o) => { await K.tween(6, (k) => o.sd.setDepth(200 + 800 * k)); o.sd.setDepth(1000); K.lab.emit('depth', { obj: o.sd.id }); }, ev: { type: 'depth' },
        see: X('It gets darker and colder: 5 °C at 1000 m. A squid and lanternfish swim past; rows of tiny blue lights glow along the lanternfish\'s body.'),
        why: X('Many twilight-zone animals make their own light (bioluminescence) to find each other, to fool hunters and to hide their shadow against the faint light from above.') },
      { do: X('Dive on to 3000 m, into the midnight zone.'), target: 'lever',
        act: async (K, o) => { await K.tween(6, (k) => o.sd.setDepth(1000 + 2000 * k)); o.sd.setDepth(3000); K.lab.emit('depth', { obj: o.sd.id }); }, ev: { type: 'depth' },
        see: X('Total darkness. The water is 3 °C and the pressure is 301 atmospheres: like a car standing on every coin-sized piece of the hull. Only a small glowing light moves outside: the lure of an anglerfish.'),
        why: X('No sunlight reaches here at all. Animals that live here are slow, many are red or black, and some, like the anglerfish, use a glowing lure to bring their food to them.') },
      { do: X('Switch on the submersible\'s lamp: push the button on the right.'), target: 'lamp',
        act: async (K, o) => { o.sd.setLamp(true); K.lab.emit('lamp', { obj: o.sd.id }); await K.sleep(1); }, ev: { type: 'lamp' },
        see: X('In the white lamp light the anglerfish is pinkish red, with a big mouth and a fishing rod over its head.'),
        why: X('Red animals look black in the deep sea, because no red light reaches it: being red is as good as being invisible there.') },
      { do: X('Pull the lever all the way back to go up to the surface, and look at the foam cup.'), target: 'lever',
        act: async (K, o) => { o.sd.setLamp(false); await K.tween(7, (k) => o.sd.setDepth(3000 * (1 - k))); o.sd.setDepth(0); K.lab.emit('depth', { obj: o.sd.id }); }, ev: { type: 'depth' },
        check: (K, o) => (o.sd.cupWhere === 'in' ? { ok: false, see: X('Your cup is as big as it was: it rode inside the cabin, at 1 atmosphere.'), why: X('A cup carried outside, in the sea water, comes back shrunk to about half its size: the huge pressure squeezes the air out of the foam.') } : null),
        see: X('The cup has shrunk to about half its size and stays small: the pressure of the deep sea squeezed the air out of the foam.'),
        why: X('Every 10 m of water adds about 1 atmosphere of pressure. Deep-sea animals have no air spaces to be crushed: their bodies are soft and full of water.') },
    ],
    eq: { word: 'Zones of the ocean', sym: 'sunlit 0–200 m · twilight 200–1000 m · midnight below 1000 m' },
    result: { obs: X('Going down, the light fell to 1 % at 200 m and to nothing below 1000 m; the water cooled from 28 °C to 3 °C; the pressure rose by 1 atmosphere every 10 m. Lanternfish and the anglerfish made their own light. The foam cup outside came back shrunk.'),
      concl: X('Each zone of the ocean is a different habitat: plenty of light and food near the surface, dim light in the twilight zone, and darkness, cold and great pressure in the midnight zone. Deep-sea animals are adapted with their own light, soft watery bodies and red or black colours.'),
      safety: X('Real deep-sea dives are made only in specially built submersibles with trained pilots.'),
      viva: [{ q: X('Which colour of sunlight is lost first in water?'), a: X('Red.') }, { q: X('Why do deep-sea animals make their own light?'), a: X('No sunlight reaches the deep sea; they use light to find food and mates and to hide.') },
        { q: X('Why did the foam cup shrink?'), a: X('The pressure of the deep water squeezed the air out of the foam.') }] },
  },
  ...EXPERIMENTS_BW4B,
];
