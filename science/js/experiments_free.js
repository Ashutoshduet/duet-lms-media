// Open labs: no steps to follow. The bench is set with real apparatus and chemicals; students pick up anything and try
// whatever they like. Every reaction, light ray, magnet and fall is worked out by the simulation, so a mistake gives the
// result a real mistake would give (a wrong mix, a cracked or dropped glass, a beam that misses).
import { DICT } from './exp_i18n.js';
import './actions_phys.js';
const X = (en) => ({ en, ...(DICT[en] || {}) });
const N = (en, hi, hg) => ({ en, hi, hg: hg || en });
const CH = N('Open Lab', 'खुली प्रयोगशाला', 'Open Lab');
const ALL = [7, 8, 9, 10];
const OPEN = N('This is an open lab: there are no steps. Pick things up, pour, mix, heat, test and observe whatever you like. Be careful — glass can break and mistakes give real results.',
  'यह खुली प्रयोगशाला है: इसमें कोई चरण नहीं हैं। चीज़ें उठाइए, उँडेलिए, मिलाइए, गरम कीजिए, जाँचिए और जो चाहें देखिए। सावधान रहिए — काँच टूट सकता है और ग़लती का नतीजा भी असली जैसा ही होगा।',
  'Ye open lab hai: isme koi steps nahi hain. Cheezein uthaiye, pour kijiye, mix kijiye, garam kijiye, test kijiye aur jo chahe dekhiye. Dhyaan rakhiye — glass toot sakta hai aur galti ka result bhi bilkul real jaisa hoga.');
const step = (see) => ({ do: OPEN, target: null, act: (K) => K.sleep(0.4), ev: { type: 'never' }, see });

export const EXPERIMENTS_FREE = [
  {
    id: 'open_chem', subj: 'chemistry', cls: 6, also: ALL, ch: CH, title: N('Open chemistry lab', 'खुली रसायन प्रयोगशाला', 'Open chemistry lab'),
    aim: N('To explore freely with common laboratory chemicals and apparatus.', 'सामान्य प्रयोगशाला रसायनों और उपकरणों के साथ स्वतंत्र रूप से प्रयोग करना।', 'Common lab chemicals aur apparatus ke saath free hokar explore karna.'),
    kind: N('Free experimenting', 'स्वतंत्र प्रयोग', 'Free experimenting'),
    setup(K) {
      const rk = K.rack(-0.42, -0.62); for (let i = 0; i < 5; i++) K.tube(rk, i, null, 0);
      const subs = ['water', 'hcl', 'naoh', 'cuso4', 'limewater', 'vinegar', 'nacl'];
      subs.forEach((s, i) => K.bottle(s, -0.62 + i * 0.13, -1.0, { shelf: 0 }));
      ['phenol', 'methylorange', 'universal'].forEach((s, i) => K.bottle(s, 0.3 + i * 0.1, -1.0, { shelf: 1, dropper: true }));
      K.beaker(-0.2, -0.6, 'water', 80, 100); K.beaker(-0.05, -0.6, null, 0, 250); K.flask(0.1, -0.62, null, 0); K.cylinder(0.24, -0.66, 100);
      K.solid('zn', 0.38, -0.56); K.solid('mg', 0.48, -0.6); K.solid('caco3', 0.38, -0.7); K.solid('nahco3', 0.5, -0.72);
      K.burner(0.62, -0.62); K.thermo(0.25, -0.46); K.splint(0.05, -0.45); K.strip('blue', -0.15, -0.45); K.strip('red', -0.08, -0.45);
      return {};
    },
    steps: [step(N('Whatever you do happens as it would in a real lab.', 'आप जो भी करेंगे, वह वैसे ही होगा जैसे असली प्रयोगशाला में होता।', 'Aap jo bhi karenge, waisa hi hoga jaise real lab mein hota.'))],
    eq: { word: N('Open lab', 'खुली प्रयोगशाला', 'Open lab'), sym: '—' },
    result: { obs: N('Your own observations.', 'आपके अपने प्रेक्षण।', 'Aapke apne observations.'), concl: N('Your own conclusions.', 'आपके अपने निष्कर्ष।', 'Aapke apne conclusions.'),
      safety: N('Acids and alkalis are corrosive; heat test tubes pointing away from people; never pour cold water onto very hot glass.', 'अम्ल और क्षार संक्षारक होते हैं; परखनली को गरम करते समय उसका मुँह लोगों से दूर रखिए; बहुत गरम काँच पर ठंडा पानी कभी न डालिए।', 'Acid aur alkali corrosive hote hain; test tube garam karte waqt uska muh logon se door rakhiye; bahut garam glass par thanda paani kabhi mat daaliye.'), viva: [] },
  },
  {
    id: 'open_phys', subj: 'physics', cls: 6, also: ALL, ch: CH, title: N('Open physics lab', 'खुली भौतिकी प्रयोगशाला', 'Open physics lab'),
    aim: N('To explore light, magnets and motion freely.', 'प्रकाश, चुंबक और गति के साथ स्वतंत्र रूप से प्रयोग करना।', 'Light, magnets aur motion ke saath free hokar explore karna.'),
    kind: N('Free experimenting', 'स्वतंत्र प्रयोग', 'Free experimenting'),
    setup(K) {
      const bd = K.add(K.L2.opticsDisc({ disc: false }), -0.25, -0.66); const rb = K.add(K.L2.rayBox2({ slits: 3 }), -0.5, -0.5); rb.setOn && rb.setOn(true);
      const opt = [K.L2.mirrorStrip('plane', { len: 0.09 }), K.L2.mirrorStrip('concave', { len: 0.09, R: 0.16 }), K.L2.mirrorStrip('convex', { len: 0.09, R: 0.16 }), K.L2.cylLens('convex'), K.L2.cylLens('concave'), K.L2.cylLens('slab')].map((it, i) => K.add(it, -0.48 + (i % 3) * 0.09, -0.42 - Math.floor(i / 3) * 0.08));
      const tr = new K.L2.BeamTracer(K.app.scene, bd); tr.items = opt; tr.boxes = [rb]; K.solver(() => tr.update()); K.extras.push({ get parent() { tr.dispose(); return null; } });
      K.add(K.MG.barMagnet(), 0.12, -0.5); K.add(K.MG.barMagnet(), 0.12, -0.56); K.add(K.MG.compass(), 0.25, -0.6); K.add(K.M3.clipPile(12), 0.36, -0.52); K.add(K.M7.ironNail(), 0.22, -0.48);
      K.add(K.MC.pendulum({ L: 0.4 }), 0.55, -0.7); K.add(K.MC.stopwatch(), 0.45, -0.46); K.add(K.L2.handLens(), 0.05, -0.44);
      return {};
    },
    steps: [step(N('Light, magnets and things you drop behave exactly as the real ones do.', 'प्रकाश, चुंबक और गिराई गई चीज़ें बिल्कुल असली जैसी ही व्यवहार करती हैं।', 'Light, magnets aur giraayi hui cheezein bilkul real jaisa behave karti hain.'))],
    eq: { word: N('Open lab', 'खुली प्रयोगशाला', 'Open lab'), sym: '—' },
    result: { obs: N('Your own observations.', 'आपके अपने प्रेक्षण।', 'Aapke apne observations.'), concl: N('Your own conclusions.', 'आपके अपने निष्कर्ष।', 'Aapke apne conclusions.'),
      safety: N('Do not look straight into the ray box; keep magnets away from phones.', 'किरण बॉक्स में सीधे मत देखिए; चुंबकों को फ़ोन से दूर रखिए।', 'Ray box mein seedha mat dekhiye; magnets ko phone se door rakhiye.'), viva: [] },
  },
  {
    id: 'open_elec', subj: 'physics', cls: 6, also: ALL, ch: CH, title: N('Open electricity lab', 'खुली विद्युत प्रयोगशाला', 'Open electricity lab'),
    aim: N('To make circuits of your own and see what happens.', 'अपने खुद के परिपथ बनाकर देखना कि क्या होता है।', 'Apne khud ke circuits bana kar dekhna ki kya hota hai.'),
    kind: N('Free experimenting', 'स्वतंत्र प्रयोग', 'Free experimenting'),
    setup(K) {
      K.wires([]); // the circuit solver runs from the start; every wire the student clips on joins in
      K.add(K.M5.cellHolder(), -0.42, -0.6); K.add(K.M5.cellHolder(), -0.42, -0.68); K.add(K.M7.battery9v(), -0.5, -0.5);
      K.add(K.M5.lampHolder(), -0.24, -0.62); K.add(K.M5.lampHolder(), -0.14, -0.7); K.add(K.M3.ledDiode(), -0.06, -0.6); K.add(K.M5.pinSwitch(), -0.3, -0.5);
      K.add(K.EL.resistorBoard(10), 0.06, -0.66); K.add(K.EL.meter('A', 1.5), 0.2, -0.62); K.add(K.EL.meter('V', 10), 0.34, -0.62);
      ['clip', 'key', 'coin', 'eraser', 'wood', 'foil', 'lead', 'glass'].forEach((k, i) => K.add(K.M5.thing(k), 0.04 + i * 0.06, -0.48));
      return {};
    },
    steps: [step(N('To join two terminals with a wire, tap (or point at and press) one terminal and then the other; tap a terminal twice to unclip its wire. Cells, lamps, LEDs and meters behave like real ones — too much voltage burns a lamp or an LED out.', 'दो टर्मिनलों को तार से जोड़ने के लिए एक टर्मिनल को छूइए (या उस पर इशारा करके बटन दबाइए) और फिर दूसरे को; किसी टर्मिनल को दो बार छूने से उसका तार हट जाता है। सेल, लैंप, LED और मीटर असली जैसे ही काम करते हैं — अधिक वोल्टता से लैंप या LED जल जाता है।', 'Do terminals ko wire se jodne ke liye ek terminal ko tap kijiye (ya us par point karke button dabaiye) aur phir doosre ko; kisi terminal ko do baar tap karne se uska wire hat jaata hai. Cells, lamps, LEDs aur meters bilkul real jaise kaam karte hain — zyada voltage se lamp ya LED jal jaata hai.'))],
    eq: { word: N('Open lab', 'खुली प्रयोगशाला', 'Open lab'), sym: '—' },
    result: { obs: N('Your own observations.', 'आपके अपने प्रेक्षण।', 'Aapke apne observations.'), concl: N('Your own conclusions.', 'आपके अपने निष्कर्ष।', 'Aapke apne conclusions.'),
      safety: N('Never connect the two terminals of a cell or battery directly with a wire (short circuit). Never use mains electricity for experiments.', 'किसी सेल या बैटरी के दोनों टर्मिनलों को कभी सीधे तार से न जोड़िए (लघुपथन)। प्रयोगों के लिए घर की बिजली का कभी उपयोग न कीजिए।', 'Kisi cell ya battery ke dono terminals ko kabhi seedhe wire se mat jodiye (short circuit). Experiments ke liye ghar ki bijli kabhi use mat kijiye.'), viva: [] },
  },
];
void X;