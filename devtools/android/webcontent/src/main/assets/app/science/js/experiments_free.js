// Open labs: no steps to follow. The bench is set with real apparatus and chemicals; students pick up anything and try
// whatever they like. Every reaction, light ray, magnet and fall is worked out by the simulation, so a mistake gives the
// result a real mistake would give (a wrong mix, a cracked or dropped glass, a beam that misses).
import { DICT } from './exp_i18n.js';
import './actions_phys.js';
const X = (en) => ({ en, ...(DICT[en] || {}) });
const N = (en, hi, hg) => ({ en, hi, hg: hg || en });
const CH = N('Open Lab', 'ओपन लैब', 'Open Lab');
const ALL = [7, 8, 9, 10];
const OPEN = N('This is an open lab: there are no steps. Pick things up, pour, mix, heat, test and observe whatever you like. Be careful — glass can break and mistakes give real results.',
  'यह ओपन लैब है: इसमें कोई स्टेप नहीं हैं। चीज़ें उठाइए, डालिए, मिलाइए, गरम कीजिए, टेस्ट कीजिए और जो चाहें देखिए। ध्यान रखिए — काँच टूट सकता है और ग़लती का नतीजा भी असली लैब जैसा ही होगा।',
  'Ye open lab hai: isme koi steps nahi hain. Cheezein uthaiye, daaliye, milaiye, garam kijiye, test kijiye aur jo chahein dekhiye. Dhyaan rakhiye — glass toot sakta hai aur galti ka result bhi bilkul real lab jaisa hoga.');
const step = (see) => ({ do: OPEN, target: null, act: (K) => K.sleep(0.4), ev: { type: 'never' }, see });

export const EXPERIMENTS_FREE = [
  {
    id: 'open_chem', subj: 'chemistry', cls: 6, also: ALL, ch: CH, title: N('Open chemistry lab', 'ओपन केमिस्ट्री लैब', 'Open chemistry lab'),
    aim: N('To explore freely with common laboratory chemicals and apparatus.', 'यहाँ हम लैब के आम केमिकल और उपकरणों से खुलकर प्रयोग करेंगे।', 'Yahan hum lab ke common chemicals aur apparatus se khulkar experiment karenge.'),
    kind: N('Free experimenting', 'अपनी मर्ज़ी से प्रयोग', 'Free experimenting'),
    setup(K) {
      const rk = K.rack(-0.42, -0.62); for (let i = 0; i < 5; i++) K.tube(rk, i, null, 0);
      const subs = ['water', 'hcl', 'naoh', 'cuso4', 'limewater', 'vinegar', 'nacl'];
      subs.forEach((s, i) => K.bottle(s, -0.62 + i * 0.13, -1.0, { shelf: 0 }));
      ['phenol', 'methylorange', 'universal'].forEach((s, i) => K.bottle(s, 0.3 + i * 0.1, -1.0, { shelf: 1, dropper: true }));
      K.beaker(-0.2, -0.6, 'water', 80, 100); K.beaker(-0.05, -0.6, null, 0, 250); K.flask(0.1, -0.62, null, 0); K.cylinder(0.24, -0.66, 100);
      K.solid('zn', 0.38, -0.56); K.solid('mg', 0.48, -0.6); K.solid('caco3', 0.38, -0.7); K.solid('nahco3', 0.5, -0.72);
      K.burner(0.62, -0.62); K.thermo(0.25, -0.46); K.splint(0.05, -0.45); K.strip('blue', -0.15, -0.45); K.strip('red', -0.08, -0.45);
      // a second corner of the bench: water and four everyday solids to test what dissolves, a glass rod to stir
      K.beaker(-0.74, -0.72, 'water', 70); K.beaker(-0.6, -0.72, 'water', 70);
      [['sugar', -0.78], ['salt', -0.68], ['chalk', -0.58], ['sand', -0.48]].forEach(([c, x]) => K.solid(c, x, -0.5)); K.rod(-0.32, -0.44);
      return {};
    },
    steps: [step(N('Whatever you do happens as it would in a real lab.', 'आप जो भी करेंगे, वैसा ही होगा जैसा असली लैब में होता है।', 'Aap jo bhi karenge, waisa hi hoga jaisa real lab mein hota hai.'))],
    eq: { word: N('Open lab', 'ओपन लैब', 'Open lab'), sym: '—' },
    result: { obs: N('Your own observations.', 'जो आपको खुद दिखा।', 'Aapke apne observations.'), concl: N('Your own conclusions.', 'आपके अपने नतीजे।', 'Aapke apne conclusions.'),
      safety: N('Acids and alkalis are corrosive; heat test tubes pointing away from people; never pour cold water onto very hot glass.', 'एसिड और क्षार संक्षारक होते हैं, यानी त्वचा को जला सकते हैं; टेस्ट ट्यूब गरम करते समय उसका मुँह लोगों की तरफ़ मत रखिए; बहुत गरम काँच पर ठंडा पानी कभी मत डालिए।', 'Acid aur alkali corrosive hote hain; test tube garam karte waqt uska muh logon ki taraf mat rakhiye; bahut garam glass par thanda paani kabhi mat daaliye.'), viva: [] },
  },
  {
    id: 'open_phys', subj: 'physics', cls: 6, also: ALL, ch: CH, title: N('Open physics lab', 'ओपन फ़िज़िक्स लैब', 'Open physics lab'),
    aim: N('To explore light, magnets and motion freely.', 'यहाँ हम प्रकाश, चुंबक और गति से जुड़े प्रयोग खुलकर करेंगे।', 'Yahan hum light, magnets aur motion se jude experiment khulkar karenge.'),
    kind: N('Free experimenting', 'अपनी मर्ज़ी से प्रयोग', 'Free experimenting'),
    setup(K) {
      const bd = K.add(K.L2.opticsDisc({ disc: false }), -0.25, -0.66); const rb = K.add(K.L2.rayBox2({ slits: 3 }), -0.5, -0.5); rb.setOn && rb.setOn(true);
      const opt = [K.L2.mirrorStrip('plane', { len: 0.09 }), K.L2.mirrorStrip('concave', { len: 0.09, R: 0.16 }), K.L2.mirrorStrip('convex', { len: 0.09, R: 0.16 }), K.L2.cylLens('convex'), K.L2.cylLens('concave'), K.L2.cylLens('slab')].map((it, i) => K.add(it, -0.48 + (i % 3) * 0.09, -0.42 - Math.floor(i / 3) * 0.08));
      const tr = new K.L2.BeamTracer(K.app.scene, bd); tr.items = opt; tr.boxes = [rb]; K.solver(() => tr.update()); K.extras.push({ get parent() { tr.dispose(); return null; } });
      K.add(K.MG.barMagnet(), 0.12, -0.5); K.add(K.MG.barMagnet(), 0.12, -0.56); K.add(K.MG.compass(), 0.25, -0.6); K.add(K.M3.clipPile(12), 0.36, -0.52); K.add(K.M7.ironNail(), 0.22, -0.48);
      K.add(K.MC.pendulum({ L: 0.4 }), 0.55, -0.7); K.add(K.MC.stopwatch(), 0.45, -0.46); K.add(K.L2.handLens(), 0.05, -0.44);
      return {};
    },
    steps: [step(N('Light, magnets and things you drop behave exactly as the real ones do.', 'प्रकाश, चुंबक और गिराई गई चीज़ें बिल्कुल असली जैसा ही बर्ताव करती हैं।', 'Light, magnets aur giraayi hui cheezein bilkul real jaisa behave karti hain.'))],
    eq: { word: N('Open lab', 'ओपन लैब', 'Open lab'), sym: '—' },
    result: { obs: N('Your own observations.', 'जो आपको खुद दिखा।', 'Aapke apne observations.'), concl: N('Your own conclusions.', 'आपके अपने नतीजे।', 'Aapke apne conclusions.'),
      safety: N('Do not look straight into the ray box; keep magnets away from phones.', 'रे बॉक्स में सीधे मत देखिए; चुंबकों को फ़ोन से दूर रखिए।', 'Ray box mein seedha mat dekhiye; magnets ko phone se door rakhiye.'), viva: [] },
  },
  {
    id: 'open_elec', subj: 'physics', cls: 6, also: ALL, ch: CH, title: N('Open electricity lab', 'ओपन इलेक्ट्रिसिटी लैब', 'Open electricity lab'),
    aim: N('To make circuits of your own and see what happens.', 'यहाँ आप अपने खुद के सर्किट बनाकर देखेंगे कि क्या होता है।', 'Yahan aap apne khud ke circuits banakar dekhenge ki kya hota hai.'),
    kind: N('Free experimenting', 'अपनी मर्ज़ी से प्रयोग', 'Free experimenting'),
    setup(K) {
      K.wires([]); // the circuit solver runs from the start; every wire the student clips on joins in
      K.add(K.M5.cellHolder(), -0.42, -0.6); K.add(K.M5.cellHolder(), -0.42, -0.68); K.add(K.M7.battery9v(), -0.5, -0.5);
      K.add(K.M5.lampHolder(), -0.24, -0.62); K.add(K.M5.lampHolder(), -0.14, -0.7); K.add(K.M3.ledDiode(), -0.06, -0.6); K.add(K.M5.pinSwitch(), -0.3, -0.5);
      K.add(K.EL.resistorBoard(10), 0.06, -0.66); K.add(K.EL.meter('A', 1.5), 0.2, -0.62); K.add(K.EL.meter('V', 10), 0.34, -0.62);
      ['clip', 'key', 'coin', 'eraser', 'wood', 'foil', 'lead', 'glass'].forEach((k, i) => K.add(K.M5.thing(k), 0.04 + i * 0.06, -0.48));
      return {};
    },
    steps: [step(N('To join two terminals with a wire, tap (or point at and press) one terminal and then the other; tap a terminal twice to unclip its wire. Cells, lamps, LEDs and meters behave like real ones — too much voltage burns a lamp or an LED out.', 'दो टर्मिनलों को तार से जोड़ने के लिए पहले एक टर्मिनल को छूइए (या उस पर पॉइंट करके बटन दबाइए), फिर दूसरे को। किसी टर्मिनल को दो बार छूने से उसका तार निकल जाता है। सेल, लैंप, LED और मीटर असली जैसे ही काम करते हैं — ज़्यादा वोल्टेज से लैंप या LED फ़्यूज़ हो जाता है।', 'Do terminals ko wire se jodne ke liye pehle ek terminal ko tap kijiye (ya us par point karke button dabaiye), phir doosre ko. Kisi terminal ko do baar tap karne se uska wire nikal jaata hai. Cells, lamps, LEDs aur meters bilkul real jaise kaam karte hain — zyada voltage se lamp ya LED fuse ho jaata hai.'))],
    eq: { word: N('Open lab', 'ओपन लैब', 'Open lab'), sym: '—' },
    result: { obs: N('Your own observations.', 'जो आपको खुद दिखा।', 'Aapke apne observations.'), concl: N('Your own conclusions.', 'आपके अपने नतीजे।', 'Aapke apne conclusions.'),
      safety: N('Never connect the two terminals of a cell or battery directly with a wire (short circuit). Never use mains electricity for experiments.', 'सेल या बैटरी के दोनों टर्मिनलों को कभी भी सीधे तार से मत जोड़िए (इसे शॉर्ट सर्किट कहते हैं)। प्रयोग के लिए घर की बिजली का इस्तेमाल कभी मत कीजिए।', 'Cell ya battery ke dono terminals ko kabhi bhi seedhe wire se mat jodiye (short circuit). Experiment ke liye ghar ki bijli kabhi use mat kijiye.'), viva: [] },
  },
];
void X;