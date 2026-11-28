// DUET STEM 360 (the hub app): the catalogue of every activity in every DUET STEM app, one item each.
// Written to hub/catalog.json from the apps' own data (titles, aims, chapters, narration texts), plus a few
// descriptions of our own where an app has none (the Solar System's VR scenes, the drone, the planets in Hindi).
// The download size of each item comes from hub/packs.json (devtools/hub/packs.mjs), when it has been built.
// Usage: node devtools/hub/catalog.mjs
import fs from 'fs';
const REPO = new URL('../../', import.meta.url);
const R = (p) => new URL(p, REPO);
const read = (p) => fs.readFileSync(R(p), 'utf8');
const L3 = (en, hi, hg) => ({ en, hi: hi || en, hg: hg || en });
const tr = (o) => (o ? { en: o.en || '', hi: o.hi || o.en || '', hg: o.hg || o.en || '' } : null);

// a short description: whole sentences, about 2–3 lines on a card
function short(s, max = 230) {
  s = String(s || '').replace(/\s+/g, ' ').trim(); if (s.length <= max) return s;
  const parts = s.match(/[^.!?।]+[.!?।]+["”’)]*\s*/g) || [s]; let out = '';
  for (const p of parts) { if ((out + p).trim().length > max && out) break; out += p; }
  out = out.trim(); if (out.length > max + 40) out = out.slice(0, max).replace(/\s+\S*$/, '') + '…';
  return out;
}
const shortL = (o, max) => ({ en: short(o.en, max), hi: short(o.hi, max), hg: short(o.hg, max) });
const join = (a, b) => { const o = {}; for (const L of ['en', 'hi', 'hg']) o[L] = [a && a[L], b && b[L]].filter(Boolean).join(' '); return o; };

export const SUBJECTS = [
  { id: 'physics', name: L3('Physics', 'भौतिकी (फ़िज़िक्स)', 'Physics'), color: '#4f9cf0' },
  { id: 'chemistry', name: L3('Chemistry', 'रसायन (केमिस्ट्री)', 'Chemistry'), color: '#f0a33a' },
  { id: 'biology', name: L3('Biology', 'जीव विज्ञान (बायोलॉजी)', 'Biology'), color: '#5cc479' },
  { id: 'body', name: L3('Human Body', 'मानव शरीर', 'Human Body'), color: '#e85a5a' },
  { id: 'maths', name: L3('Maths', 'गणित', 'Maths'), color: '#b48cf0' },
  { id: 'space', name: L3('Space', 'अंतरिक्ष', 'Space'), color: '#7fd0e8' },
  { id: 'robotics', name: L3('Robotics & Drones', 'रोबोटिक्स और ड्रोन', 'Robotics aur Drones'), color: '#e8c25a' },
];
export const APPS = {
  science: { name: L3('Science Lab 360', 'साइंस लैब 360', 'Science Lab 360'), page: 'science/index.html', lang: 'url' },
  maths: { name: L3('Maths Lab 360', 'मैथ्स लैब 360', 'Maths Lab 360'), page: 'maths/index.html', lang: 'url' },
  body: { name: L3('Human Body 360', 'ह्यूमन बॉडी 360', 'Human Body 360'), page: 'body/index.html', lang: 'store:hb_lang' },
  space: { name: L3('Solar System 360', 'सोलर सिस्टम 360', 'Solar System 360'), page: 'space/index.html', lang: 'store:ss360-narr',
    // a way of use that works differently in this app than the table above says
    howto: { box: L3('Phone VR box: the activity opens straight in VR box mode. Put the phone in the box and look around.', 'फ़ोन VR बॉक्स: गतिविधि सीधे VR बॉक्स मोड में खुलती है। फ़ोन को बॉक्स में रखिए और चारों ओर देखिए।', 'Phone VR box: activity seedhe VR box mode mein khulti hai. Phone ko box mein rakhiye aur chaaron taraf dekhiye.') } },
  robotics: { name: L3('Robotics Lab 360', 'रोबोटिक्स लैब 360', 'Robotics Lab 360'), page: 'robotics/index.html', lang: 'url' },
  drone: { name: L3('Drone Simulator', 'ड्रोन सिम्युलेटर', 'Drone Simulator'), page: 'drone/index.html' },
};
// Ways to use an item, as data: the hub draws its mode tabs and each item's "Ways to use" from this table and from the
// item's list of mode ids. A new way (AR on the printed DUET pad, the DUET cube, red-cyan glasses, looking around by moving
// the phone) is added here and to the items that support it; the hub's code does not change. tab: shown as a tab at the
// top of the hub; planned: not built yet (never shown until an item lists it).
export const MODES = [
  { id: 'screen', icon: 'phone', tab: true, name: L3('Screen', 'स्क्रीन', 'Screen'),
    desc: L3('Phone or tablet: drag to turn, pinch to zoom, tap to pick.', 'फ़ोन या टैबलेट: घुमाने के लिए खींचिए, ज़ूम के लिए दो उँगलियाँ फैलाइए, चुनने के लिए छूइए।', 'Phone ya tablet: ghumane ke liye kheenchiye, zoom ke liye do ungliyan failaiye, chunne ke liye touch kijiye.') },
  { id: 'box', icon: 'vrbox', tab: true, name: L3('VR box', 'VR बॉक्स', 'VR box'),
    desc: L3('Phone VR box: tap “VR box” in the activity, put the phone in the box and look around. A Bluetooth controller works too.', 'फ़ोन VR बॉक्स: गतिविधि में “VR box” दबाइए, फ़ोन को बॉक्स में रखिए और चारों ओर देखिए। ब्लूटूथ कंट्रोलर भी चलता है।', 'Phone VR box: activity mein “VR box” dabaiye, phone ko box mein rakhiye aur chaaron taraf dekhiye. Bluetooth controller bhi chalta hai.') },
  { id: 'quest', icon: 'headset', tab: true, name: L3('Headset', 'हेडसेट', 'Headset'),
    desc: L3('Meta Quest: open it in the DUET app or the Quest browser and press “Enter VR”. Pick things up with the controllers or your hands.', 'मेटा क्वेस्ट: DUET ऐप या क्वेस्ट ब्राउज़र में खोलिए और “Enter VR” दबाइए। कंट्रोलर या हाथों से चीज़ें उठाइए।', 'Meta Quest: DUET app ya Quest browser mein kholiye aur “Enter VR” dabaiye. Controllers ya haathon se cheezein uthaiye.') },
  { id: 'panel', icon: 'panel', tab: false, name: L3('Classroom panel', 'क्लास पैनल', 'Class panel'),
    desc: L3('65/75-inch classroom panel: touch it, or use the remote\'s arrow keys and OK.', '65/75 इंच का क्लास पैनल: छूकर चलाइए, या रिमोट के तीर वाले बटन और OK से।', '65/75 inch class panel: touch karke chalaiye, ya remote ke arrow buttons aur OK se.') },
  { id: 'ar_pad', icon: 'pad', planned: true, name: L3('AR pad', 'AR पैड', 'AR pad'),
    desc: L3('Point the phone camera at the printed DUET pad: the model stands on it.', 'फ़ोन का कैमरा छपे हुए DUET पैड पर रखिए: मॉडल उस पर खड़ा दिखेगा।', 'Phone ka camera printed DUET pad par rakhiye: model us par khada dikhega.') },
  { id: 'ar_cube', icon: 'cube', planned: true, name: L3('AR cube', 'AR क्यूब', 'AR cube'),
    desc: L3('Hold the DUET cube in front of the camera and turn the model in your hand.', 'DUET क्यूब को कैमरे के सामने पकड़िए और मॉडल को हाथ में घुमाइए।', 'DUET cube ko camera ke saamne pakdiye aur model ko haath mein ghumaiye.') },
  { id: 'anaglyph', icon: 'glasses', planned: true, name: L3('3D glasses', '3D चश्मा', '3D glasses'),
    desc: L3('Red-cyan 3D glasses: the picture comes out of the screen.', 'लाल-नीला 3D चश्मा: तस्वीर स्क्रीन से बाहर आती दिखती है।', 'Red-cyan 3D glasses: picture screen se bahar aati dikhti hai.') },
  { id: 'gyro360', icon: 'gyro', planned: true, name: L3('Move to look', 'घुमाकर देखिए', 'Ghuma kar dekhiye'),
    desc: L3('Move the phone around you to look around the scene.', 'फ़ोन को अपने चारों ओर घुमाइए और दृश्य में चारों ओर देखिए।', 'Phone ko apne chaaron taraf ghumaiye aur scene mein chaaron taraf dekhiye.') },
];
const ALL4 = ['screen', 'box', 'quest', 'panel'];

export async function buildItems() {
  const items = [];
  // ------------------------------------------------------------------ Science Lab 360 and Maths Lab 360
  const { ALL_EXPERIMENTS, subjOf } = await import(R('science/js/experiments.js'));
  const { demoIds } = await import(R('science/js/topics.js'));
  const free = demoIds();
  const repl = new Set(ALL_EXPERIMENTS.filter((e) => e.world && e.replaces).map((e) => e.replaces));
  const CH = new Map(); // chapter strings of the apps (with their Hindi and Hinglish), reused for the other apps below
  for (const e of ALL_EXPERIMENTS) CH.set(e.cls + '|' + e.ch.en, tr(e.ch));
  for (const e of ALL_EXPERIMENTS) {
    const sub = subjOf(e);
    if (sub === 'maths' && repl.has(e.id)) continue; // the Maths Lab shows the real-place version in its place
    const app = sub === 'maths' ? 'maths' : 'science';
    const classes = [e.cls, ...(e.also || [])].filter((c, i, a) => a.indexOf(c) === i);
    const desc = e.result && e.result.concl ? join(tr(e.aim), tr(e.result.concl)) : tr(e.aim);
    items.push({
      id: `${app}.${e.id}`, app, url: `${app}/index.html?exp=${e.id}`, subject: sub, classes, chapter: tr(e.ch),
      type: 'experiment', modes: ALL4, title: tr(e.title), desc: shortL(desc), kind: tr(e.kind),
      place: e.world ? e.place || null : null, open: e.id.startsWith('open_') || undefined, free: free.has(e.id) || undefined,
    });
  }
  const ch = (cls, en) => CH.get(cls + '|' + en) || null;

  // ------------------------------------------------------------------ Human Body 360: organ labs, journeys, free explore
  const content = JSON.parse(read('body/models/content.json'));
  const { JOURNEYS } = await import(R('body/js/data.js'));
  const labSrc = read('body/js/lab.js');
  const LAB_IDS = new Function('return ' + /export const LAB_IDS = (\[[^\]]*\]);/.exec(labSrc)[1])();
  const labsTxt = /export const LABS = (\{[\s\S]*?\n\});/.exec(labSrc)[1];
  const LABS = new Function('return ' + labsTxt)();
  const C10L = ch(10, 'Ch 5 · Life Processes'), C10C = ch(10, 'Ch 6 · Control and Coordination'), C10E = ch(10, 'Ch 10 · The Human Eye and the Colourful World');
  const C7A = ch(7, 'Ch 9 · Life Processes in Animals'), C9S = ch(9, 'Ch 10 · Sound Waves: Characteristics and Applications');
  const MOVE = L3('Body movements (older NCERT, Class 6)', 'शरीर में गति (पुरानी NCERT, कक्षा 6)', 'Body movements (purani NCERT, Class 6)');
  const BODY_CH = { // NCERT chapter and classes of each lab and journey (our own mapping)
    heart: [C10L, [10]], eye: [C10E, [10]], ear: [C9S, [9]], brain: [C10C, [10]], lungs: [C10L, [7, 10]], kidney: [C10L, [10]],
    urinary: [C10L, [10]], tooth: [C7A, [7]], skin: [C10C, [8, 10]], mouth: [C7A, [7, 10]], gut: [C7A, [7, 10]], liver: [C10L, [7, 10]],
    pancreas: [C10L, [10]], knee: [MOVE, [6, 7]], arm: [C10C, [10]], leg: [C10C, [10]],
    'j:breathing': [C10L, [7, 10]], 'j:digestion': [C7A, [7, 10]], 'j:circulation': [C10L, [10]], 'j:heart': [C10L, [10]], 'j:kidney': [C10L, [10]],
    'j:nerves': [C10C, [10]], 'j:bones': [MOVE, [6, 7]], 'j:reflex': [C10C, [10]], 'j:hormones': [C10C, [10]],
  };
  for (const id of LAB_IDS) {
    const l = LABS[id]; const s1 = content.steps[`lab-${id}-1`] || {};
    const [chp, cls] = BODY_CH[id] || [null, [10]];
    items.push({ id: `body.lab-${id}`, app: 'body', url: `body/index.html?lab=${id}`, subject: 'body', classes: cls, chapter: chp,
      type: 'demonstration', modes: ALL4, title: { en: `${l.title.en} lab`, hi: `${l.title.hi} लैब`, hg: `${l.title.hg || l.title.en} lab` },
      desc: shortL(tr(s1.text || { en: '' })), steps: l.n, free: id === 'heart' || undefined });
  }
  for (const j of JOURNEYS) {
    const t = { ...j.title, ...(content.journeys[j.id] || {}) }; const s1 = content.steps[`${j.id}-1`] || {};
    const [chp, cls] = BODY_CH['j:' + j.id] || [null, [10]];
    items.push({ id: `body.j-${j.id}`, app: 'body', url: `body/index.html?j=${j.id}`, subject: 'body', classes: cls, chapter: chp,
      type: 'journey', modes: ALL4, title: tr(t), desc: shortL(tr(s1.text || { en: '' })), steps: j.steps.length, free: j.id === 'heart' || undefined });
  }
  items.push({ id: 'body.explore', app: 'body', url: 'body/index.html', subject: 'body', classes: [6, 7, 8, 9, 10], chapter: null, type: 'demonstration', modes: ALL4,
    title: L3('Explore the human body', 'मानव शरीर को खोलकर देखिए', 'Human body explore kijiye'),
    desc: L3('A see-through body in 3D: switch on the skeleton, muscles, organs, blood vessels and nerves one layer at a time, and tap any part to hear what it does.',
      'पारदर्शी शरीर 3D में: कंकाल, मांसपेशियाँ, अंग, रक्त वाहिकाएँ और नसें एक-एक परत करके दिखाइए, और किसी भी हिस्से को छूकर सुनिए कि वह क्या काम करता है।',
      'See-through body 3D mein: skeleton, muscles, organs, blood vessels aur nerves ek-ek layer karke dikhaiye, aur kisi bhi part ko touch karke suniye ki woh kya kaam karta hai.') });

  // ------------------------------------------------------------------ Solar System 360: VR scenes (phone VR box, Quest) and the 3D pages (screen)
  const C7S = ch(7, 'Ch 12 · Earth, Moon, and the Sun'), C8S = ch(8, 'Ch 11 · Keeping Time with the Skies');
  const SOLAR_CH = L3('Stars and the Solar System (older NCERT, Class 8)', 'तारे एवं सौर परिवार (पुरानी NCERT, कक्षा 8)', 'Stars aur Solar System (purani NCERT, Class 8)');
  const SP = (id, scene, flat, type, cls, chp, title, desc, extra = {}) => {
    const modes = []; if (flat) modes.push('screen'); if (scene) modes.push('box', 'quest'); if (flat) modes.push('panel');
    const urls = {}; if (flat) urls.screen = urls.panel = `space/index.html#${flat}`;
    if (scene) { urls.box = `space/index.html?app=box&go=${scene}`; urls.quest = `space/index.html?app=vr&go=${scene}`; }
    items.push({ id: `space.${id}`, app: 'space', url: urls.screen || urls.box, urls, subject: 'space', classes: cls, chapter: chp, type, modes, title, desc, scene: scene || undefined, view: flat || undefined, ...extra });
  };
  SP('solar', 'space', 'home', 'tour', [6, 7, 8], SOLAR_CH, L3('The Solar System in 3D', 'सौरमंडल 3D में', 'Solar System 3D mein'),
    L3('Fly through the Solar System with every planet where it really is today. Turn it, zoom in and open any world.',
      'सौरमंडल में उड़िए: हर ग्रह आज जहाँ सच में है, वहीं दिखता है। घुमाइए, ज़ूम कीजिए और किसी भी ग्रह को खोलिए।',
      'Solar System mein udiye: har planet aaj jahan sach mein hai, wahin dikhta hai. Ghumaiye, zoom kijiye aur kisi bhi planet ko kholiye.'), { free: true });
  SP('planets', 'planets', 'planets', 'demonstration', [6, 7, 8], SOLAR_CH, L3('Planets and moons', 'ग्रह और चंद्रमा', 'Planets aur moons'),
    L3('Every planet and its main moons up close, with real surface maps, sizes and temperatures, and a fact card for each one.',
      'हर ग्रह और उसके मुख्य चंद्रमा पास से: असली सतह, आकार और तापमान, और हर एक का फ़ैक्ट कार्ड।',
      'Har planet aur uske main moons paas se: asli surface, size aur temperature, aur har ek ka fact card.'), { free: true });
  SP('compare', 'compare', 'compare', 'demonstration', [6, 7, 8], SOLAR_CH, L3('Compare sizes', 'आकार की तुलना', 'Size compare kijiye'),
    L3('Put the Sun, the planets and the Moon side by side at true scale and see how small the Earth really is.',
      'सूर्य, ग्रहों और चंद्रमा को सही अनुपात में साथ-साथ रखिए और देखिए कि पृथ्वी असल में कितनी छोटी है।',
      'Sun, planets aur Moon ko sahi scale mein saath-saath rakhiye aur dekhiye ki Earth asal mein kitni chhoti hai.'));
  SP('stars', 'stars', 'sky', 'tour', [7, 8], C8S, L3('Stars and the Milky Way', 'तारे और आकाशगंगा', 'Stars aur Milky Way'),
    L3('The night sky with real star positions and constellations, the Milky Way, and the stars nearest to the Sun.',
      'असली तारों और तारामंडलों वाला रात का आसमान, आकाशगंगा (मिल्की वे) और सूर्य के सबसे पास के तारे।',
      'Asli stars aur constellations wala raat ka aasmaan, Milky Way aur Sun ke sabse paas ke stars.'));
  SP('craft', 'craft', 'craft', 'demonstration', [6, 7, 8, 9, 10], null, L3('Spacecraft and India in space', 'अंतरिक्ष यान और भारत', 'Spacecraft aur India space mein'),
    L3('Real 3D models of spacecraft, from Aryabhata and Chandrayaan to Voyager and the James Webb telescope, and what each one did.',
      'अंतरिक्ष यानों के असली 3D मॉडल, आर्यभट और चंद्रयान से लेकर वॉयेजर और जेम्स वेब टेलीस्कोप तक, और हर एक ने क्या किया।',
      'Spacecraft ke asli 3D models, Aryabhata aur Chandrayaan se lekar Voyager aur James Webb telescope tak, aur har ek ne kya kiya.'));
  SP('land360', 'land360', 'land', 'tour', [6, 7, 8], C7S, L3('Landing sites in 360°', 'लैंडिंग स्थल 360° में', 'Landing sites 360° mein'),
    L3('Stand where rovers and landers touched down on the Moon and Mars, in real 360° photos taken there.',
      'चंद्रमा और मंगल पर जहाँ रोवर और लैंडर उतरे, वहीं खड़े होइए, वहीं खींची गई असली 360° तस्वीरों में।',
      'Moon aur Mars par jahan rovers aur landers utre, wahin khade hoiye, wahin kheenchi gayi asli 360° photos mein.'));
  SP('tools', 'tools', 'tools', 'experiment', [6, 7, 8, 9], ch(9, 'Ch 6 · How Forces Affect Motion'), L3('Your weight and age on other worlds', 'दूसरे ग्रहों पर आपका वज़न और उम्र', 'Doosre planets par aapka weight aur age'),
    L3('Find your weight on other planets and your age in their years: gravity and orbits, worked out with your own numbers.',
      'दूसरे ग्रहों पर अपना वज़न और वहाँ के सालों में अपनी उम्र निकालिए: गुरुत्वाकर्षण (ग्रैविटी) और कक्षा, आपकी अपनी संख्याओं से।',
      'Doosre planets par apna weight aur wahan ke saalon mein apni age nikaliye: gravity aur orbit, aapke apne numbers se.'));
  SP('sgame', 'sgame', null, 'experiment', [6, 7, 8], SOLAR_CH, L3('Planet puzzle', 'खेल: ग्रह सजाओ', 'Game: planets sajao'),
    L3('A game: put the planets back in their order around the Sun. Every right move tells you something about that world.',
      'एक खेल: ग्रहों को सूर्य के चारों ओर सही क्रम में वापस रखिए। हर सही चाल पर उस ग्रह के बारे में कुछ नया पता चलता है।',
      'Ek game: planets ko Sun ke chaaron taraf sahi order mein wapas rakhiye. Har sahi move par us planet ke baare mein kuch naya pata chalta hai.'));
  SP('ch3', 'ch3', 'land-chandrayaan3', 'tour', [6, 7, 8, 9, 10], C7S, L3('Chandrayaan-3 on the Moon', 'चंद्रयान-3 चंद्रमा पर', 'Chandrayaan-3 Moon par'),
    L3('Walk the Chandrayaan-3 landing site near the Moon\'s south pole at real size, with Vikram, Pragyan and the mission\'s own videos.',
      'चंद्रमा के दक्षिणी ध्रुव के पास चंद्रयान-3 के उतरने की जगह पर असली आकार में घूमिए, विक्रम, प्रज्ञान और मिशन के असली वीडियो के साथ।',
      'Moon ke south pole ke paas Chandrayaan-3 ki landing site par asli size mein ghoomiye, Vikram, Pragyan aur mission ke asli videos ke saath.'));
  SP('pad', 'pad', null, 'simulator', [6, 7, 8, 9], ch(9, 'Ch 6 · How Forces Affect Motion'), L3('Launch pad', 'लॉन्च पैड', 'Launch pad'),
    L3('Stand at the launch pad and send a rocket up yourself: the countdown, the lift-off and each stage falling away.',
      'लॉन्च पैड पर खड़े होकर ख़ुद रॉकेट छोड़िए: काउंटडाउन, लिफ़्ट-ऑफ़ और एक-एक करके अलग होते स्टेज।',
      'Launch pad par khade hokar khud rocket chhodiye: countdown, lift-off aur ek-ek karke alag hote stages.'));
  SP('rgame', 'rgame', null, 'experiment', [6, 7, 8, 9], null, L3('Build a rocket', 'खेल: रॉकेट बनाओ', 'Game: rocket banao'),
    L3('A game: stack the stages of a real rocket in the right order, then launch it.',
      'एक खेल: असली रॉकेट के स्टेज सही क्रम में जोड़िए, फिर उसे लॉन्च कीजिए।', 'Ek game: asli rocket ke stages sahi order mein jodiye, phir use launch kijiye.'));
  SP('rsizes', 'rsizes', null, 'demonstration', [6, 7, 8, 9, 10], null, L3('Rocket sizes', 'रॉकेटों की तुलना', 'Rockets ki tulna'),
    L3('India\'s rockets, from SLV-3 to PSLV, GSLV and LVM3, beside the world\'s biggest, at their real height.',
      'भारत के रॉकेट, SLV-3 से PSLV, GSLV और LVM3 तक, दुनिया के सबसे बड़े रॉकेटों के साथ, असली ऊँचाई में।',
      'India ke rockets, SLV-3 se PSLV, GSLV aur LVM3 tak, duniya ke sabse bade rockets ke saath, asli height mein.'));
  SP('museum', 'museum', null, 'demonstration', [6, 7, 8, 9, 10], null, L3('3D space museum', '3D अंतरिक्ष संग्रहालय', '3D space museum'),
    L3('Walk through a museum of rockets, rovers and spacecraft in 3D. Pick any one up and turn it around.',
      'रॉकेट, रोवर और अंतरिक्ष यानों के 3D संग्रहालय (म्यूज़ियम) में घूमिए। किसी को भी उठाकर घुमाइए।',
      'Rockets, rovers aur spacecraft ke 3D museum mein ghoomiye. Kisi ko bhi utha kar ghumaiye.'));
  SP('tours', 'tours', null, 'tour', [6, 7, 8, 9, 10], null, L3('360° space tours', '360° अंतरिक्ष सैर', '360° space tours'),
    L3('360° photos and videos of real places: a launch pad, mission control, the inside of the space shuttle and more.',
      'असली जगहों की 360° तस्वीरें और वीडियो: लॉन्च पैड, मिशन कंट्रोल, स्पेस शटल के अंदर और भी बहुत कुछ।',
      'Asli jagahon ki 360° photos aur videos: launch pad, mission control, space shuttle ke andar aur bhi bahut kuch.'));
  SP('orbits', 'orbits', null, 'demonstration', [8, 9, 10], null, L3('Orbits of satellites', 'उपग्रहों की कक्षाएँ', 'Satellites ke orbits'),
    L3('See how satellites circle the Earth: low orbit, polar orbit, geostationary orbit and the path to the Moon.',
      'देखिए उपग्रह (सैटेलाइट) पृथ्वी के चारों ओर कैसे घूमते हैं: निचली कक्षा, ध्रुवीय कक्षा, भूस्थिर कक्षा और चंद्रमा तक का रास्ता।',
      'Dekhiye satellites Earth ke chaaron taraf kaise ghoomte hain: low orbit, polar orbit, geostationary orbit aur Moon tak ka raasta.'));
  SP('imissions', 'imissions', 'missions', 'demonstration', [6, 7, 8, 9, 10], null, L3('India\'s space missions', 'भारत के अंतरिक्ष मिशन', 'India ke space missions'),
    L3('ISRO\'s missions from Aryabhata to Chandrayaan-3 and Aditya-L1: when each one flew and what it found.',
      'आर्यभट से चंद्रयान-3 और आदित्य-L1 तक इसरो के मिशन: हर एक कब गया और उसने क्या खोजा।',
      'Aryabhata se Chandrayaan-3 aur Aditya-L1 tak ISRO ke missions: har ek kab gaya aur usne kya khoja.'));
  SP('moons', null, 'moons', 'demonstration', [6, 7, 8], SOLAR_CH, L3('Moons of the Solar System', 'सौरमंडल के चंद्रमा', 'Solar System ke moons'),
    L3('The main moons of every planet in real images: the volcanoes of Io, the ice of Europa, the haze of Titan and more.',
      'हर ग्रह के मुख्य चंद्रमा असली तस्वीरों में: आयो के ज्वालामुखी, यूरोपा की बर्फ़, टाइटन की धुंध और भी बहुत कुछ।',
      'Har planet ke main moons asli photos mein: Io ke volcanoes, Europa ki barf, Titan ki dhundh aur bhi bahut kuch.'));
  SP('gallery', null, 'gallery', 'tour', [6, 7, 8, 9, 10], null, L3('Space photo gallery', 'अंतरिक्ष की तस्वीरें', 'Space photo gallery'),
    L3('Real photos from space missions: the Sun, every planet, the Moon, comets, asteroids and the Milky Way.',
      'अंतरिक्ष मिशनों की असली तस्वीरें: सूर्य, हर ग्रह, चंद्रमा, धूमकेतु, क्षुद्रग्रह और आकाशगंगा।',
      'Space missions ki asli photos: Sun, har planet, Moon, comets, asteroids aur Milky Way.'));
  // one page for each world of the Solar System: the app's own English summary, our own Hindi and Hinglish
  const src = read('space/index.html');
  const bodies = [...src.matchAll(/\{id:"([a-z]+)",name:"([^"]+)",hi:"([^"]+)",hiR:"[^"]*",kind:"[^"]*"[\s\S]*?short:"([^"]+)"/g)].map((m) => ({ id: m[1], name: m[2], hi: m[3], short: m[4] }));
  const BODY_HI = {
    sun: ['सूर्य सौरमंडल के बीच का तारा है। इसका गुरुत्वाकर्षण हर ग्रह को उसकी कक्षा में रखता है, और इसके केंद्र में नाभिकीय संलयन (न्यूक्लियर फ़्यूज़न) से रोशनी और गर्मी बनती है।', 'Sun Solar System ke beech ka star hai. Iski gravity har planet ko uske orbit mein rakhti hai, aur iske core mein nuclear fusion se roshni aur garmi banti hai.'],
    mercury: ['बुध सबसे छोटा ग्रह है और सूर्य के सबसे पास है। इसका एक साल सिर्फ़ 88 दिन का है, और हवा न होने से दिन में 430 °C और रात में −180 °C हो जाता है।', 'Mercury sabse chhota planet hai aur Sun ke sabse paas hai. Iska ek saal sirf 88 din ka hai, aur hawa na hone se din mein 430 °C aur raat mein −180 °C ho jaata hai.'],
    venus: ['शुक्र सबसे गर्म ग्रह है। कार्बन डाइऑक्साइड की मोटी परत गर्मी को रोक लेती है, इसलिए इसकी सतह सीसे को भी पिघला दे इतनी गर्म है।', 'Venus sabse garam planet hai. Carbon dioxide ki moti layer garmi ko rok leti hai, isliye iski surface lead ko bhi pighla de itni garam hai.'],
    earth: ['पृथ्वी हमारा घर है, अकेला ग्रह जहाँ जीवन और सतह पर बहता पानी मिलता है। हवा की परत और चुंबकीय क्षेत्र हमें सूर्य की तेज़ किरणों से बचाते हैं।', 'Earth hamara ghar hai, akela planet jahan life aur surface par behta paani milta hai. Hawa ki layer aur magnetic field humein Sun ki tez rays se bachaate hain.'],
    moon: ['चंद्रमा पृथ्वी का अकेला प्राकृतिक उपग्रह है। इसकी कलाएँ, ग्रहण और समुद्र के ज्वार इसी की वजह से होते हैं, और चंद्रयान-3 इसके दक्षिणी ध्रुव के पास उतरा।', 'Moon Earth ka akela natural satellite hai. Iski phases, grahan aur samudra ke jwaar isi ki wajah se hote hain, aur Chandrayaan-3 iske south pole ke paas utra.'],
    mars: ['मंगल लाल ग्रह है: इसकी मिट्टी में लोहे का ज़ंग है। यहाँ सौरमंडल का सबसे ऊँचा ज्वालामुखी है, और भारत का मंगलयान इसकी कक्षा में पहुँचा था।', 'Mars laal planet hai: iski mitti mein lohe ka zang hai. Yahan Solar System ka sabse uncha volcano hai, aur India ka Mangalyaan iske orbit mein pahuncha tha.'],
    jupiter: ['बृहस्पति सबसे बड़ा ग्रह है, गैस का एक विशाल गोला। इसका ग्रेट रेड स्पॉट पृथ्वी से भी बड़ा तूफ़ान है जो सैकड़ों साल से चल रहा है।', 'Jupiter sabse bada planet hai, gas ka ek vishaal gola. Iska Great Red Spot Earth se bhi bada toofan hai jo saikdon saal se chal raha hai.'],
    saturn: ['शनि अपने चमकीले छल्लों के लिए जाना जाता है, जो बर्फ़ और चट्टान के अरबों टुकड़ों से बने हैं। यह इतना हल्का है कि पानी में तैर सकता है।', 'Saturn apne chamkeele rings ke liye jaana jaata hai, jo barf aur chattan ke arbon tukdon se bane hain. Yeh itna halka hai ki paani mein tair sakta hai.'],
    uranus: ['अरुण (यूरेनस) अपनी करवट पर लेटा हुआ घूमता है। इसका नीला-हरा रंग मीथेन गैस से आता है, और यहाँ बहुत ठंड है।', 'Uranus apni karwat par leta hua ghoomta hai. Iska neela-hara rang methane gas se aata hai, aur yahan bahut thand hai.'],
    neptune: ['वरुण (नेपच्यून) सूर्य से सबसे दूर का ग्रह है। यहाँ सौरमंडल की सबसे तेज़ हवाएँ चलती हैं, और इसे दूरबीन से नहीं, गणित से खोजा गया था।', 'Neptune Sun se sabse door ka planet hai. Yahan Solar System ki sabse tez hawayein chalti hain, aur ise telescope se nahi, maths se khoja gaya tha.'],
    pluto: ['प्लूटो एक बौना ग्रह है, नेपच्यून से भी आगे बर्फ़ीली दुनिया में। 2015 में न्यू होराइज़न्स यान ने इसकी सतह पर दिल के आकार का बर्फ़ीला मैदान देखा।', 'Pluto ek dwarf planet hai, Neptune se bhi aage barfeeli duniya mein. 2015 mein New Horizons yaan ne iski surface par dil ke shape ka barfeela maidan dekha.'],
  };
  for (const b of bodies) {
    if (items.some((x) => x.id === 'space.' + b.id) || !BODY_HI[b.id]) continue;
    const [hi, hg] = BODY_HI[b.id];
    SP(b.id, null, b.id, 'demonstration', b.id === 'moon' || b.id === 'earth' || b.id === 'sun' ? [6, 7, 8] : [6, 7, 8], b.id === 'moon' || b.id === 'earth' || b.id === 'sun' ? C7S : SOLAR_CH,
      L3(b.name, b.hi, b.name), L3(short(b.short.replace(/<[^>]+>/g, ''), 230), hi, hg), { free: ['earth', 'moon'].includes(b.id) || undefined });
  }

  // ------------------------------------------------------------------ Robotics Lab 360 and the Drone Simulator
  const { LESSONS } = await import(R('robotics/js/lessons.js'));
  for (const l of LESSONS) {
    items.push({ id: `robotics.${l.id}`, app: 'robotics', url: `robotics/index.html?lesson=${l.id}`, subject: 'robotics', classes: [6, 7, 8, 9, 10],
      chapter: L3('Arduino basics · lesson ' + l.n, 'Arduino की शुरुआत · पाठ ' + l.n, 'Arduino basics · lesson ' + l.n), type: 'lesson', modes: ['screen', 'quest', 'panel'],
      title: tr(l.title), desc: shortL(tr(l.goal)), steps: (l.steps || []).length, free: l.free || undefined });
  }
  items.push({ id: 'drone.sim', app: 'drone', url: 'drone/index.html', subject: 'robotics', classes: [6, 7, 8, 9, 10], chapter: null, type: 'simulator', modes: ['screen', 'quest', 'panel'],
    title: L3('Drone Simulator', 'ड्रोन सिम्युलेटर', 'Drone Simulator'),
    desc: L3('Fly an FPV racer, a GPS camera drone or a tiny whoop over a village, a solar park and a Himalayan valley, with real flight physics and a camera screen like a real remote.',
      'FPV रेसर, GPS कैमरा ड्रोन या छोटा व्हूप उड़ाइए, एक गाँव, सोलर पार्क और हिमालय की घाटी के ऊपर, असली उड़ान की फ़िज़िक्स और असली रिमोट जैसी कैमरा स्क्रीन के साथ।',
      'FPV racer, GPS camera drone ya chhota whoop udaiye, ek gaon, solar park aur Himalaya ki ghaati ke upar, asli flight physics aur asli remote jaisi camera screen ke saath.'),
    free: true });
  return items;
}

async function main() {
  const items = await buildItems();
  let packs = null; try { packs = JSON.parse(read('hub/packs.json')); } catch (e) { /* not built yet */ }
  const apps = {};
  for (const [k, a] of Object.entries(APPS)) apps[k] = { ...a, baseMB: packs && packs.apps[k] ? +(packs.apps[k].bytes / 1e6).toFixed(1) : null };
  for (const it of items) {
    const p = packs && packs.items[it.id];
    if (p) { it.bytes = p.bytes; it.mb = +(p.bytes / 1e6).toFixed(1); it.files = p.files.length; if (p.models && p.models.length) it.models = p.models; }
    it.thumb = `thumbs/${it.id}.webp`;
    if (!fs.existsSync(R('hub/' + it.thumb))) it.thumb = null;
    for (const k of Object.keys(it)) if (it[k] === undefined) delete it[k];
  }
  const out = { v: 1, built: new Date().toISOString().slice(0, 10), modes: MODES, subjects: SUBJECTS, apps, items };
  fs.mkdirSync(R('hub/'), { recursive: true });
  fs.writeFileSync(R('hub/catalog.json'), JSON.stringify(out));
  const per = {}; for (const it of items) per[it.app] = (per[it.app] || 0) + 1;
  console.log(`hub/catalog.json: ${items.length} items`, per, packs ? '' : '(no packs.json yet: sizes left out)');
}
if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop())) await main();
