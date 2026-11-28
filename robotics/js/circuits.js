// DUET Robotics Lab 360: battery circuits for Classes 1-3 (19 lessons). No code: a 6 V battery box powers the parts, and the
// circuit works (or fails) exactly as it would on a real bench: an LED without its resistor burns out, a series circuit
// goes dark when one LED is taken out, a knob dims the light. The Arduino rests on the bench today.
// Our own lessons; checked end to end by devtools/test/robofactory.mjs (circuits part).
const t3 = (en, hi, hg) => ({ en, hi, hg });
const P = (tag, type, props, hole, rot) => ({ tag, type, props: props || {}, at: { hole }, rot: rot || 0 });
const F = (tag, type, props, x, z, rot) => ({ tag, type, props: props || {}, at: { x, z }, rot: rot || 0 });
const w = (a, b, en, hi, hg, see) => ({ k: 'wire', wire: [a, b], do: t3(en, hi, hg), see: see || t3('', '', '') });
const place = (p, en, hi, hg, see) => ({ k: 'place', place: p, do: t3(en, hi, hg), see: see || t3('', '', '') });
const info = (en, hi, hg, sen, shi, shg) => ({ k: 'info', do: t3(en, hi, hg), see: t3(sen || '', shi || '', shg || '') });
const act = (until, en, hi, hg, sen, shi, shg) => ({ k: 'act', until, do: t3(en, hi, hg), see: t3(sen || '', shi || '', shg || '') });
const watch = (until, en, hi, hg, sen, shi, shg) => ({ k: 'watch', until, do: t3(en, hi, hg), see: t3(sen || '', shi || '', shg || '') });
const CODE = '// No code today: a battery powers this circuit by itself.\n// The Arduino rests (this empty sketch does nothing). Build the circuit on the breadboard and watch it work.\n\nvoid setup() {\n}\n\nvoid loop() {\n}\n';
const BAT = F('bat', 'aa4', {}, -40, 150, 0);
const BATW = [['T:bat:P', 'H:tp45'], ['T:bat:N', 'H:tn45']]; // the battery box wired to the back rails (most lessons start so)
const LED1 = P('led1', 'led', { color: 'red' }, 'e22', 0), R1 = P('r1', 'resistor', { ohms: 220 }, 'b22', 3);
const lit = (S, tag) => S.ledLit(tag);
const pressed = (S) => !!(S.part('b1') && S.part('b1').state.pressed);
const burnt = (S, tag) => !!(S.part(tag) && S.part(tag).state.burnt);

const BAT_STEPS = [
  info('A 6 V battery box (four AA cells) will power the circuit. Electricity flows only around a closed loop: out of +, through the parts, and back into −.',
    '6 V का बैटरी बॉक्स (चार AA सेल) सर्किट को बिजली देगा। बिजली सिर्फ़ बंद रास्ते में बहती है: + से निकलकर, पुर्ज़ों से होकर, वापस − में।',
    '6 V ka battery box (chaar AA cell) circuit ko bijli dega. Bijli sirf band raaste mein behti hai: + se nikalkar, parts se hokar, wapas − mein.'),
  w('bat.P', 'rail:tp', 'Wire the battery\'s red (+) wire to the + rail at the top (the red line).', 'बैटरी के लाल (+) तार को ऊपर की + रेल (लाल लाइन) से जोड़िए।', 'Battery ke laal (+) wire ko upar ki + rail (laal line) se jodiye.'),
  w('bat.N', 'rail:tn', 'Wire its black (−) wire to the − rail (the blue line).', 'इसके काले (−) तार को − रेल (नीली लाइन) से जोड़िए।', 'Iske kaale (−) wire ko − rail (neeli line) se jodiye.'),
];
const batChecks = (K) => [(S) => (S.conn('bat.P', 'bat.N') ? [K.W.short] : null), (S) => (S.conn('bat.P', 'rail:tp') ? null : [K.W.join, { a: t3('The battery\'s red wire', 'बैटरी का लाल तार', 'Battery ka laal wire'), b: t3('the + rail', '+ रेल', '+ rail') }]),
  (S) => (S.conn('bat.N', 'rail:tn') ? null : [K.W.join, { a: t3('The battery\'s black wire', 'बैटरी का काला तार', 'Battery ka kaala wire'), b: t3('the − rail', '− रेल', '− rail') }])];
const ledChecks = (K, tag = 'led1') => [(S) => (S.has(tag) ? null : [K.W.missing, { x: t3('LED', 'एलईडी', 'LED') }]), (S) => (S.conn(tag + '.K', 'bat.P') ? [K.W.ledRev] : null)];

export function batchC(K, n0) {
  let n = n0; const L = [];
  const add = (o) => { L.push(Object.assign({ n: ++n, batch: 'C', board: undefined, code: CODE, serial: false, blocks: false }, o)); };

  // 1 -------------------------------------------------------------------------------------------------- light an LED
  add({ id: 'c_light', cls: '1–2', view: 'wide', drawer: ['led', 'resistor'],
    title: t3('Light an LED with a battery', 'बैटरी से एलईडी जलाइए', 'Battery se LED jalaiye'),
    goal: t3('Make a closed loop from the battery through a resistor and an LED, and see the LED glow.', 'बैटरी से रेज़िस्टर और एलईडी होकर बंद रास्ता बनाइए, और एलईडी को चमकते देखिए।', 'Battery se resistor aur LED hokar band raasta banaiye, aur LED ko chamakte dekhiye.'),
    setup: { parts: [BAT], wires: [] },
    steps: [...BAT_STEPS,
      place(LED1, 'Put the red LED at the ghost: its long leg (+) on the right, in column 23.', 'लाल एलईडी को नीली आकृति पर लगाइए: लंबा पैर (+) दाईं तरफ़, कॉलम 23 में।', 'Laal LED ko neeli shape par lagaiye: lamba pair (+) right taraf, column 23 mein.'),
      place(R1, 'Put the 220 Ω resistor from column 22 down to the − rail.', '220 Ω रेज़िस्टर को कॉलम 22 से नीचे − रेल तक लगाइए।', '220 Ω resistor ko column 22 se neeche − rail tak lagaiye.', t3('The resistor keeps the current small, so the LED does not burn.', 'रेज़िस्टर करंट को कम रखता है, ताकि एलईडी न जले।', 'Resistor current ko kam rakhta hai, taaki LED na jale.')),
      w('rail:tp', 'led1.A', 'Close the loop: wire the + rail to the LED\'s long leg (column 23).', 'रास्ता बंद कीजिए: + रेल को एलईडी के लंबे पैर (कॉलम 23) से जोड़िए।', 'Raasta band kijiye: + rail ko LED ke lambe pair (column 23) se jodiye.'),
      { k: 'check', do: t3('Check your circuit.', 'अपना सर्किट जाँचिए।', 'Apna circuit check karo.'), see: t3('', '', '') },
      watch((S) => lit(S, 'led1'), 'Look at the LED.', 'एलईडी को देखिए।', 'LED ko dekhiye.', 'It glows! Current flows from + through the LED and the resistor back to −.', 'यह चमक रही है! करंट + से एलईडी और रेज़िस्टर होकर वापस − में जाता है।', 'Yeh chamak rahi hai! Current + se LED aur resistor hokar wapas − mein jaata hai.')],
    check: [...batChecks(K), ...ledChecks(K), (S) => (S.conn('led1.A', 'bat.P') ? null : [K.W.join, { a: t3('The LED\'s long leg', 'एलईडी का लंबा पैर', 'LED ka lamba pair'), b: t3('the + rail', '+ रेल', '+ rail') }])],
    done: (S) => lit(S, 'led1') });

  // 2 -------------------------------------------------------------------------------------------------- why the resistor
  add({ id: 'c_resistor', cls: '1–3', view: 'wide', drawer: ['led', 'resistor'],
    title: t3('Why the resistor? Save the LED', 'रेज़िस्टर क्यों? एलईडी बचाइए', 'Resistor kyon? LED bachaiye'),
    goal: t3('See (safely, in 3D) what happens to an LED without a resistor, then fix the circuit.', '3D में सुरक्षित रूप से देखिए कि बिना रेज़िस्टर के एलईडी का क्या होता है, फिर सर्किट ठीक कीजिए।', '3D mein safe tarike se dekhiye ki bina resistor ke LED ka kya hota hai, phir circuit theek kijiye.'),
    setup: { parts: [BAT], wires: BATW },
    steps: [
      info('The battery is already wired to the rails. An LED can take only about 20 mA. Let us try it without a resistor, here in 3D, never on the real bench.', 'बैटरी पहले से रेलों से जुड़ी है। एलईडी सिर्फ़ लगभग 20 mA सह सकती है। चलिए बिना रेज़िस्टर के आज़माते हैं, यहीं 3D में, असली बेंच पर कभी नहीं।', 'Battery pehle se rails se judi hai. LED sirf lagbhag 20 mA seh sakti hai. Chaliye bina resistor ke aazmaate hain, yahin 3D mein, asli bench par kabhi nahi.'),
      place(LED1, 'Put the red LED at the ghost, long leg on the right.', 'लाल एलईडी को नीली आकृति पर लगाइए, लंबा पैर दाईं तरफ़।', 'Laal LED ko neeli shape par lagaiye, lamba pair right taraf.'),
      w('led1.K', 'rail:tn', 'Wire its short leg (column 22) straight to the − rail.', 'इसके छोटे पैर (कॉलम 22) को सीधे − रेल से जोड़िए।', 'Iske chhote pair (column 22) ko seedhe − rail se jodiye.'),
      w('rail:tp', 'led1.A', 'Wire the + rail to its long leg (column 23)…', '+ रेल को इसके लंबे पैर (कॉलम 23) से जोड़िए…', '+ rail ko iske lambe pair (column 23) se jodiye…'),
      watch((S) => burnt(S, 'led1'), 'Watch the LED.', 'एलईडी को देखिए।', 'LED ko dekhiye.', 'Pop! Far too much current flowed and the LED burnt out. A real one would be ruined.', 'फट! बहुत ज़्यादा करंट बहा और एलईडी जल गई। असली एलईडी बर्बाद हो जाती।', 'Phat! Bahut zyada current baha aur LED jal gayi. Asli LED barbaad ho jaati.'),
      act((S) => !S.conn('led1.K', 'bat.N'), 'Remove the wire from the short leg to the − rail (tap the wire, then delete it).', 'छोटे पैर से − रेल वाला तार हटाइए (तार को छूइए, फिर मिटाइए)।', 'Chhote pair se − rail wala wire hataiye (wire ko touch karo, phir mitaiye).'),
      place(R1, 'Put the 220 Ω resistor from column 22 down to the − rail.', '220 Ω रेज़िस्टर को कॉलम 22 से नीचे − रेल तक लगाइए।', '220 Ω resistor ko column 22 se neeche − rail tak lagaiye.'),
      act((S) => lit(S, 'led1') && !burnt(S, 'led1'), 'Press "Replace burnt parts" to get a new LED.', '"जले पुर्ज़े बदलिए" दबाकर नई एलईडी लीजिए।', '"Jale parts badliye" dabaakar nayi LED lijiye.', 'Now it glows and stays cool: the resistor lets only about 18 mA through.', 'अब यह चमकती है और ठंडी रहती है: रेज़िस्टर सिर्फ़ लगभग 18 mA जाने देता है।', 'Ab yeh chamakti hai aur thandi rehti hai: resistor sirf lagbhag 18 mA jaane deta hai.')],
    check: [...batChecks(K), ...ledChecks(K)],
    done: (S) => lit(S, 'led1') && !burnt(S, 'led1') && S.has('r1') });

  // 3 -------------------------------------------------------------------------------------------------- torch with a switch
  const SWITCH = [place(P('b1', 'button', {}, 'e40', 0), 'Push the button into 40e–42e, across the middle gap.', 'बटन को 40e–42e में, बीच की खाली जगह के आर-पार लगाइए।', 'Button ko 40e–42e mein, beech ki khaali jagah ke aar-paar lagaiye.', t3('A push button is a switch: pressed, it closes the loop; let go, it opens it.', 'पुश बटन एक स्विच है: दबाने पर रास्ता बंद होता है; छोड़ने पर खुल जाता है।', 'Push button ek switch hai: dabane par raasta band hota hai; chhodne par khul jaata hai.')),
    w('rail:tp', 'b1.L1', 'Wire the + rail to the button\'s left leg (column 40).', '+ रेल को बटन के बाएँ पैर (कॉलम 40) से जोड़िए।', '+ rail ko button ke left pair (column 40) se jodiye.')];
  add({ id: 'c_torch', cls: '1–2', view: 'wide', drawer: ['led', 'resistor', 'button'],
    title: t3('Torch with a switch', 'स्विच वाली टॉर्च', 'Switch wali torch'),
    goal: t3('Put a switch in the loop: the torch shines only while you press it.', 'रास्ते में एक स्विच लगाइए: टॉर्च तभी जलती है जब आप उसे दबाते हैं।', 'Raaste mein ek switch lagaiye: torch tabhi jalti hai jab aap use dabate hain.'),
    setup: { parts: [BAT], wires: BATW },
    steps: [
      info('The battery is already wired to the rails. A torch is a battery, a switch and a lamp in one loop.', 'बैटरी पहले से रेलों से जुड़ी है। टॉर्च एक ही रास्ते में बैटरी, स्विच और लैंप है।', 'Battery pehle se rails se judi hai. Torch ek hi raaste mein battery, switch aur lamp hai.'),
      place(LED1, 'Put the red LED at the ghost, long leg on the right.', 'लाल एलईडी को नीली आकृति पर लगाइए, लंबा पैर दाईं तरफ़।', 'Laal LED ko neeli shape par lagaiye, lamba pair right taraf.'),
      place(R1, 'Put the 220 Ω resistor from column 22 down to the − rail.', '220 Ω रेज़िस्टर को कॉलम 22 से नीचे − रेल तक लगाइए।', '220 Ω resistor ko column 22 se neeche − rail tak lagaiye.'),
      ...SWITCH,
      w('b1.L3', 'led1.A', 'Wire the button\'s right leg (column 42) to the LED\'s long leg (column 23).', 'बटन के दाएँ पैर (कॉलम 42) को एलईडी के लंबे पैर (कॉलम 23) से जोड़िए।', 'Button ke right pair (column 42) ko LED ke lambe pair (column 23) se jodiye.'),
      { k: 'check', do: t3('Check your circuit.', 'अपना सर्किट जाँचिए।', 'Apna circuit check karo.'), see: t3('', '', '') },
      act((S) => pressed(S) && lit(S, 'led1'), 'Press and hold the button (tap it).', 'बटन दबाकर रखिए (उसे छूइए)।', 'Button dabaakar rakhiye (use touch karo).', 'The loop is closed: the torch shines.', 'रास्ता बंद है: टॉर्च जलती है।', 'Raasta band hai: torch jalti hai.'),
      act((S) => !pressed(S) && !lit(S, 'led1') && S.flag('pressLit'), 'Let go.', 'छोड़ दीजिए।', 'Chhod dijiye.', 'The loop is open again: no current, no light.', 'रास्ता फिर खुला है: करंट नहीं, रोशनी नहीं।', 'Raasta phir khula hai: current nahi, roshni nahi.')],
    check: [...batChecks(K), ...ledChecks(K), (S) => (S.has('b1') ? null : [K.W.missing, { x: t3('button', 'बटन', 'button') }]), (S) => (S.conn('b1.L1', 'bat.P') ? null : [K.W.join, { a: t3('The button\'s left leg', 'बटन का बायाँ पैर', 'Button ka left pair'), b: t3('the + rail', '+ रेल', '+ rail') }]), (S) => (S.conn('b1.L3', 'led1.A') ? null : [K.W.join, { a: t3('The button\'s right leg', 'बटन का दायाँ पैर', 'Button ka right pair'), b: t3('the LED\'s long leg', 'एलईडी का लंबा पैर', 'LED ka lamba pair') }])],
    done: (S) => S.flag('pressLit') && !lit(S, 'led1') });

  // 4 -------------------------------------------------------------------------------------------------- doorbell
  add({ id: 'c_doorbell', cls: '1–2', view: 'wide', drawer: ['abuzz', 'button'],
    title: t3('Doorbell with a battery', 'बैटरी वाली घंटी', 'Battery wali ghanti'),
    goal: t3('A button and a buzzer in one loop make a doorbell.', 'एक ही रास्ते में बटन और बज़र से घंटी बनती है।', 'Ek hi raaste mein button aur buzzer se ghanti banti hai.'),
    setup: { parts: [BAT], wires: BATW },
    steps: [
      info('The battery is already wired to the rails. This buzzer beeps by itself whenever current flows through it.', 'बैटरी पहले से रेलों से जुड़ी है। यह बज़र करंट बहते ही अपने-आप बजता है।', 'Battery pehle se rails se judi hai. Yeh buzzer current behte hi apne aap bajta hai.'),
      place(P('ab1', 'abuzz', {}, 'e30', 0), 'Put the buzzer at the ghost: its + leg in column 30.', 'बज़र को नीली आकृति पर लगाइए: इसका + पैर कॉलम 30 में।', 'Buzzer ko neeli shape par lagaiye: iska + pair column 30 mein.'),
      w('ab1.N', 'rail:tn', 'Wire its − leg (column 33) to the − rail.', 'इसके − पैर (कॉलम 33) को − रेल से जोड़िए।', 'Iske − pair (column 33) ko − rail se jodiye.'),
      ...SWITCH,
      w('b1.L3', 'ab1.P', 'Wire the button\'s right leg (column 42) to the buzzer\'s + leg (column 30).', 'बटन के दाएँ पैर (कॉलम 42) को बज़र के + पैर (कॉलम 30) से जोड़िए।', 'Button ke right pair (column 42) ko buzzer ke + pair (column 30) se jodiye.'),
      { k: 'check', do: t3('Check your circuit.', 'अपना सर्किट जाँचिए।', 'Apna circuit check karo.'), see: t3('', '', '') },
      act((S) => pressed(S) && S.part('ab1') && S.part('ab1').state.on && (S.memRun.rang = true), 'Ring the bell: press the button.', 'घंटी बजाइए: बटन दबाइए।', 'Ghanti bajaiye: button dabaiye.', 'Beep! Someone is at the door.', 'बीप! दरवाज़े पर कोई है।', 'Beep! Darwaze par koi hai.'),
      act((S) => S.memRun.rang && !pressed(S) && S.part('ab1') && !S.part('ab1').state.on, 'Let go.', 'छोड़ दीजिए।', 'Chhod dijiye.', 'Quiet: the switch opened the loop.', 'शांति: स्विच ने रास्ता खोल दिया।', 'Shaanti: switch ne raasta khol diya.')],
    check: [...batChecks(K), (S) => (S.has('ab1') ? null : [K.W.missing, { x: t3('buzzer', 'बज़र', 'buzzer') }]), (S) => (S.conn('ab1.N', 'bat.N') ? null : [K.W.join, { a: t3('The buzzer\'s − leg', 'बज़र का − पैर', 'Buzzer ka − pair'), b: t3('the − rail', '− रेल', '− rail') }]), (S) => (S.conn('b1.L3', 'ab1.P') ? null : [K.W.join, { a: t3('The button\'s right leg', 'बटन का दायाँ पैर', 'Button ka right pair'), b: t3('the buzzer\'s + leg', 'बज़र का + पैर', 'Buzzer ka + pair') }])],
    done: (S) => !!S.memRun.rang });

  // 5 -------------------------------------------------------------------------------------------------- fan with a switch
  add({ id: 'c_fan', cls: '1–2', view: 'wide', drawer: ['motor', 'button'],
    title: t3('Fan with a switch', 'स्विच वाला पंखा', 'Switch wala pankha'),
    goal: t3('A motor turns electricity into movement: switch the fan on with a button.', 'मोटर बिजली को गति में बदलती है: बटन से पंखा चलाइए।', 'Motor bijli ko gati mein badalti hai: button se pankha chalaiye.'),
    setup: { parts: [BAT], wires: BATW },
    steps: [
      info('The battery is already wired to the rails. A motor spins when current flows through its coil.', 'बैटरी पहले से रेलों से जुड़ी है। मोटर की कुंडली से करंट बहने पर वह घूमती है।', 'Battery pehle se rails se judi hai. Motor ki kundali se current behne par woh ghoomti hai.'),
      place(F('m1', 'motor', {}, 95, 160, 0), 'Put the fan motor on the mat at the ghost.', 'पंखे वाली मोटर को मैट पर नीली आकृति पर रखिए।', 'Pankhe wali motor ko mat par neeli shape par rakhiye.'),
      w('m1.N', 'rail:tn', 'Wire the motor\'s black wire to the − rail.', 'मोटर के काले तार को − रेल से जोड़िए।', 'Motor ke kaale wire ko − rail se jodiye.'),
      ...SWITCH,
      w('b1.L3', 'm1.P', 'Wire the button\'s right leg (column 42) to the motor\'s red wire.', 'बटन के दाएँ पैर (कॉलम 42) को मोटर के लाल तार से जोड़िए।', 'Button ke right pair (column 42) ko motor ke laal wire se jodiye.'),
      { k: 'check', do: t3('Check your circuit.', 'अपना सर्किट जाँचिए।', 'Apna circuit check karo.'), see: t3('', '', '') },
      act((S) => pressed(S) && S.motorMax('m1') > 500 && (S.memRun.spun = true), 'Press and hold the button.', 'बटन दबाकर रखिए।', 'Button dabaakar rakhiye.', 'Whirr! The fan spins as long as the loop is closed.', 'घर्र! जब तक रास्ता बंद है, पंखा घूमता है।', 'Gharr! Jab tak raasta band hai, pankha ghoomta hai.'),
      act((S) => S.memRun.spun && !pressed(S), 'Let go and watch it slow down.', 'छोड़िए और उसे धीमा होते देखिए।', 'Chhodiye aur use dheema hote dekhiye.', 'It keeps turning a moment by itself: a spinning fan has momentum.', 'यह एक पल अपने-आप घूमता रहता है: घूमते पंखे में संवेग होता है।', 'Yeh ek pal apne aap ghoomta rehta hai: ghoomte pankhe mein sanveg hota hai.')],
    check: [...batChecks(K), (S) => (S.has('m1') ? null : [K.W.missing, { x: t3('motor', 'मोटर', 'motor') }]), (S) => (S.conn('m1.N', 'bat.N') ? null : [K.W.join, { a: t3('The motor\'s black wire', 'मोटर का काला तार', 'Motor ka kaala wire'), b: t3('the − rail', '− रेल', '− rail') }]), (S) => (S.conn('b1.L3', 'm1.P') ? null : [K.W.join, { a: t3('The button\'s right leg', 'बटन का दायाँ पैर', 'Button ka right pair'), b: t3('the motor\'s red wire', 'मोटर का लाल तार', 'Motor ka laal wire') }])],
    done: (S) => !!S.memRun.spun });

  // 6 -------------------------------------------------------------------------------------------------- two LEDs in series
  add({ id: 'c_series', cls: '2–3', view: 'wide', drawer: ['led', 'resistor'],
    title: t3('Two LEDs in series', 'श्रेणी में दो एलईडी', 'Series mein do LED'),
    goal: t3('Put two LEDs one after the other in a single loop, and find out what happens when one is taken out.', 'एक ही रास्ते में दो एलईडी एक के बाद एक लगाइए, और देखिए कि एक निकालने पर क्या होता है।', 'Ek hi raaste mein do LED ek ke baad ek lagaiye, aur dekhiye ki ek nikalne par kya hota hai.'),
    setup: { parts: [BAT], wires: BATW },
    steps: [
      info('The battery is already wired to the rails. In a series circuit there is only one path: the current goes through every part in turn.', 'बैटरी पहले से रेलों से जुड़ी है। श्रेणी सर्किट में सिर्फ़ एक रास्ता होता है: करंट बारी-बारी से हर पुर्ज़े से होकर जाता है।', 'Battery pehle se rails se judi hai. Series circuit mein sirf ek raasta hota hai: current baari-baari se har part se hokar jaata hai.'),
      place(LED1, 'Put the first red LED at the ghost (columns 22–23).', 'पहली लाल एलईडी को नीली आकृति पर लगाइए (कॉलम 22–23)।', 'Pehli laal LED ko neeli shape par lagaiye (column 22–23).'),
      place(R1, 'Put the 220 Ω resistor from column 22 down to the − rail.', '220 Ω रेज़िस्टर को कॉलम 22 से नीचे − रेल तक लगाइए।', '220 Ω resistor ko column 22 se neeche − rail tak lagaiye.'),
      place(P('led2', 'led', { color: 'red' }, 'e26', 0), 'Put the second red LED at the ghost (columns 26–27).', 'दूसरी लाल एलईडी को नीली आकृति पर लगाइए (कॉलम 26–27)।', 'Doosri laal LED ko neeli shape par lagaiye (column 26–27).'),
      w('led2.K', 'led1.A', 'Wire the second LED\'s short leg (column 26) to the first LED\'s long leg (column 23).', 'दूसरी एलईडी के छोटे पैर (कॉलम 26) को पहली एलईडी के लंबे पैर (कॉलम 23) से जोड़िए।', 'Doosri LED ke chhote pair (column 26) ko pehli LED ke lambe pair (column 23) se jodiye.'),
      w('rail:tp', 'led2.A', 'Wire the + rail to the second LED\'s long leg (column 27).', '+ रेल को दूसरी एलईडी के लंबे पैर (कॉलम 27) से जोड़िए।', '+ rail ko doosri LED ke lambe pair (column 27) se jodiye.'),
      { k: 'check', do: t3('Check your circuit.', 'अपना सर्किट जाँचिए।', 'Apna circuit check karo.'), see: t3('', '', '') },
      watch((S) => lit(S, 'led1') && lit(S, 'led2') && (S.memRun.both = true), 'Look at both LEDs.', 'दोनों एलईडी देखिए।', 'Dono LED dekhiye.', 'Both glow, a little dimmer than one alone: they share the battery\'s 6 V.', 'दोनों चमकती हैं, अकेली एक से थोड़ी कम: वे बैटरी के 6 V बाँटती हैं।', 'Dono chamakti hain, akeli ek se thodi kam: woh battery ke 6 V baant-ti hain.'),
      act((S) => S.memRun.both && !S.has('led2') && !lit(S, 'led1'), 'Take the second LED out (tap it, then delete it).', 'दूसरी एलईडी निकालिए (उसे छूइए, फिर मिटाइए)।', 'Doosri LED nikaaliye (use touch karo, phir mitaiye).', 'The first LED goes dark too: the only path is broken. Old festival light strings worked like this.', 'पहली एलईडी भी बुझ जाती है: इकलौता रास्ता टूट गया। पुरानी झालरें ऐसे ही चलती थीं।', 'Pehli LED bhi bujh jaati hai: iklauta raasta toot gaya. Purani jhaalarein aise hi chalti thin.')],
    check: [...batChecks(K), ...ledChecks(K), ...ledChecks(K, 'led2'), (S) => (S.conn('led2.K', 'led1.A') ? null : [K.W.join, { a: t3('The second LED\'s short leg', 'दूसरी एलईडी का छोटा पैर', 'Doosri LED ka chhota pair'), b: t3('the first LED\'s long leg', 'पहली एलईडी का लंबा पैर', 'Pehli LED ka lamba pair') }])],
    done: (S) => S.memRun.both && !S.has('led2') && !lit(S, 'led1') });

  // 7 -------------------------------------------------------------------------------------------------- two LEDs in parallel
  add({ id: 'c_parallel', cls: '2–3', view: 'wide', drawer: ['led', 'resistor'],
    title: t3('Two LEDs in parallel', 'समानांतर में दो एलईडी', 'Parallel mein do LED'),
    goal: t3('Give each LED its own path from + to −, and see that one keeps shining when the other is taken out.', 'हर एलईडी को + से − तक अपना रास्ता दीजिए, और देखिए कि एक निकालने पर भी दूसरी जलती रहती है।', 'Har LED ko + se − tak apna raasta dijiye, aur dekhiye ki ek nikalne par bhi doosri jalti rehti hai.'),
    setup: { parts: [BAT], wires: BATW },
    steps: [
      info('The battery is already wired to the rails. In a parallel circuit each part has its own path: this is how the lights in your home are wired.', 'बैटरी पहले से रेलों से जुड़ी है। समानांतर सर्किट में हर पुर्ज़े का अपना रास्ता होता है: आपके घर की बत्तियाँ ऐसे ही जुड़ी होती हैं।', 'Battery pehle se rails se judi hai. Parallel circuit mein har part ka apna raasta hota hai: aapke ghar ki battiyan aise hi judi hoti hain.'),
      place(LED1, 'Put the first red LED at the ghost (columns 22–23).', 'पहली लाल एलईडी को नीली आकृति पर लगाइए (कॉलम 22–23)।', 'Pehli laal LED ko neeli shape par lagaiye (column 22–23).'),
      place(R1, 'Put its 220 Ω resistor from column 22 down to the − rail.', 'इसका 220 Ω रेज़िस्टर कॉलम 22 से नीचे − रेल तक लगाइए।', 'Iska 220 Ω resistor column 22 se neeche − rail tak lagaiye.'),
      place(P('led2', 'led', { color: 'green' }, 'e28', 0), 'Put the green LED at the ghost (columns 28–29).', 'हरी एलईडी को नीली आकृति पर लगाइए (कॉलम 28–29)।', 'Hari LED ko neeli shape par lagaiye (column 28–29).'),
      place(P('r2', 'resistor', { ohms: 220 }, 'b28', 3), 'Put its own 220 Ω resistor from column 28 down to the − rail.', 'इसका अपना 220 Ω रेज़िस्टर कॉलम 28 से नीचे − रेल तक लगाइए।', 'Iska apna 220 Ω resistor column 28 se neeche − rail tak lagaiye.'),
      w('rail:tp', 'led1.A', 'Wire the + rail to the red LED\'s long leg (column 23).', '+ रेल को लाल एलईडी के लंबे पैर (कॉलम 23) से जोड़िए।', '+ rail ko laal LED ke lambe pair (column 23) se jodiye.'),
      w('rail:tp', 'led2.A', 'And another wire from the + rail to the green LED\'s long leg (column 29).', 'और एक और तार + रेल से हरी एलईडी के लंबे पैर (कॉलम 29) तक।', 'Aur ek aur wire + rail se hari LED ke lambe pair (column 29) tak.'),
      { k: 'check', do: t3('Check your circuit.', 'अपना सर्किट जाँचिए।', 'Apna circuit check karo.'), see: t3('', '', '') },
      watch((S) => lit(S, 'led1') && lit(S, 'led2') && (S.memRun.both = true), 'Look at both LEDs.', 'दोनों एलईडी देखिए।', 'Dono LED dekhiye.', 'Both glow brightly: each has the full 6 V across its own path.', 'दोनों तेज़ चमकती हैं: हर एक के अपने रास्ते पर पूरे 6 V हैं।', 'Dono tez chamakti hain: har ek ke apne raaste par poore 6 V hain.'),
      act((S) => S.memRun.both && !S.has('led2') && lit(S, 'led1'), 'Take the green LED out (tap it, then delete it).', 'हरी एलईडी निकालिए (उसे छूइए, फिर मिटाइए)।', 'Hari LED nikaaliye (use touch karo, phir mitaiye).', 'The red one keeps shining: its own path is still closed. That is why one fused bulb at home does not switch off the others.', 'लाल जलती रहती है: उसका अपना रास्ता अब भी बंद है। इसीलिए घर में एक बल्ब फ़्यूज़ होने से बाक़ी बंद नहीं होते।', 'Laal jalti rehti hai: uska apna raasta ab bhi band hai. Isiliye ghar mein ek bulb fuse hone se baaki band nahi hote.')],
    check: [...batChecks(K), ...ledChecks(K), ...ledChecks(K, 'led2'), (S) => (S.conn('led2.A', 'bat.P') ? null : [K.W.join, { a: t3('The green LED\'s long leg', 'हरी एलईडी का लंबा पैर', 'Hari LED ka lamba pair'), b: t3('the + rail', '+ रेल', '+ rail') }])],
    done: (S) => S.memRun.both && !S.has('led2') && lit(S, 'led1') });

  // 8 -------------------------------------------------------------------------------------------------- dimmer with a knob
  add({ id: 'c_dimmer', cls: '2–3', view: 'wide', drawer: ['led', 'resistor', 'pot'],
    title: t3('Dimmer with a knob', 'नॉब वाला डिमर', 'Knob wala dimmer'),
    goal: t3('A knob is a resistor you can change: turn it and the LED gets brighter or dimmer.', 'नॉब एक ऐसा रेज़िस्टर है जिसे बदल सकते हैं: घुमाइए और एलईडी तेज़ या धीमी होती है।', 'Knob ek aisa resistor hai jise badal sakte hain: ghumaiye aur LED tez ya dheemi hoti hai.'),
    setup: { parts: [BAT], wires: BATW },
    tick: (S) => { const p = S.part('led1'); if (!p) return; const b = p.state.b || 0; const R = S.memRun; R.bmin = Math.min(R.bmin ?? 9, b); R.bmax = Math.max(R.bmax ?? 0, b); },
    steps: [
      info('The battery is already wired to the rails. The knob (potentiometer) adds more or less resistance as you turn it.', 'बैटरी पहले से रेलों से जुड़ी है। नॉब (पोटेंशियोमीटर) घुमाने पर कम या ज़्यादा प्रतिरोध जोड़ता है।', 'Battery pehle se rails se judi hai. Knob (potentiometer) ghumaane par kam ya zyada pratirodh jodta hai.'),
      place(LED1, 'Put the red LED at the ghost, long leg on the right.', 'लाल एलईडी को नीली आकृति पर लगाइए, लंबा पैर दाईं तरफ़।', 'Laal LED ko neeli shape par lagaiye, lamba pair right taraf.'),
      place(R1, 'Put the 220 Ω resistor from column 22 down to the − rail.', '220 Ω रेज़िस्टर को कॉलम 22 से नीचे − रेल तक लगाइए।', '220 Ω resistor ko column 22 se neeche − rail tak lagaiye.'),
      place(P('pot1', 'pot', {}, 'e45', 0), 'Put the knob into 45e–47e.', 'नॉब को 45e–47e में लगाइए।', 'Knob ko 45e–47e mein lagaiye.'),
      w('rail:tp', 'pot1.1', 'Wire the + rail to the knob\'s left leg (column 45).', '+ रेल को नॉब के बाएँ पैर (कॉलम 45) से जोड़िए।', '+ rail ko knob ke left pair (column 45) se jodiye.'),
      w('pot1.W', 'led1.A', 'Wire the knob\'s middle leg (column 46) to the LED\'s long leg (column 23).', 'नॉब के बीच वाले पैर (कॉलम 46) को एलईडी के लंबे पैर (कॉलम 23) से जोड़िए।', 'Knob ke beech wale pair (column 46) ko LED ke lambe pair (column 23) se jodiye.'),
      { k: 'check', do: t3('Check your circuit.', 'अपना सर्किट जाँचिए।', 'Apna circuit check karo.'), see: t3('', '', '') },
      act((S) => (S.memRun.bmax ?? 0) > 0.6 && (S.memRun.bmin ?? 9) < 0.15, 'Tap the knob and turn it all the way one way, then all the way back.', 'नॉब को छूइए और पूरा एक तरफ़, फिर पूरा वापस घुमाइए।', 'Knob ko touch karo aur poora ek taraf, phir poora wapas ghumaiye.', 'Bright, then dim: more resistance lets less current through. Fan regulators and old dimmers work this way.', 'तेज़, फिर धीमी: ज़्यादा प्रतिरोध कम करंट जाने देता है। पंखे के रेगुलेटर और पुराने डिमर ऐसे ही चलते हैं।', 'Tez, phir dheemi: zyada pratirodh kam current jaane deta hai. Pankhe ke regulator aur purane dimmer aise hi chalte hain.')],
    check: [...batChecks(K), ...ledChecks(K), (S) => (S.has('pot1') ? null : [K.W.missing, { x: t3('knob', 'नॉब', 'knob') }]), (S) => (S.conn('pot1.1', 'bat.P') || S.conn('pot1.3', 'bat.P') ? null : [K.W.join, { a: t3('A knob\'s outer leg', 'नॉब का बाहरी पैर', 'Knob ka bahari pair'), b: t3('the + rail', '+ रेल', '+ rail') }]), (S) => (S.conn('pot1.W', 'led1.A') ? null : [K.W.join, { a: t3('The knob\'s middle leg', 'नॉब का बीच वाला पैर', 'Knob ka beech wala pair'), b: t3('the LED\'s long leg', 'एलईडी का लंबा पैर', 'LED ka lamba pair') }])],
    done: (S) => (S.memRun.bmax ?? 0) > 0.6 && (S.memRun.bmin ?? 9) < 0.15 });

  const CHECK = { k: 'check', do: t3('Check your circuit.', 'अपना सर्किट जाँचिए।', 'Apna circuit check karo.'), see: t3('', '', '') };
  const join = (a, b, an, bn) => (S) => (S.conn(a, b) ? null : [K.W.join, { a: an, b: bn }]);
  const has = (tag, x) => (S) => (S.has(tag) ? null : [K.W.missing, { x }]);
  const isPressed = (S, tag) => !!(S.part(tag) && S.part(tag).state.pressed);
  const ch = (S, tag, c) => { const p = S.part(tag); return p && p.state.ch ? (p.state.ch[c] || 0) : 0; }; // a channel's current (A)
  const motorW = (S, tag) => { const p = S.part(tag); return p ? p.state.w || 0 : 0; };

  // 9 -------------------------------------------------------------------------------------------------- LED polarity
  add({ id: 'c_polarity', cls: '1', view: 'wide', drawer: ['led', 'resistor'],
    title: t3('Which way round? LED polarity', 'कौन-सी तरफ़? एलईडी की दिशा', 'Kaun si taraf? LED ki disha'),
    goal: t3('Put an LED in the wrong way round and see that it stays dark; turn it round and it lights.', 'एलईडी उल्टी लगाइए और देखिए कि वह अँधेरी रहती है; उसे पलटिए और वह जल उठती है।', 'LED ulti lagaiye aur dekhiye ki woh andheri rehti hai; use palatiye aur woh jal uthti hai.'),
    setup: { parts: [BAT, R1], wires: BATW },
    tick: (S, dt) => { const m = S.memRun; const p = S.part('led1'); if (p && S.conn('led1.K', 'bat.P') && !lit(S, 'led1')) m.dark = (m.dark || 0) + dt; },
    steps: [
      info('An LED lets current through one way only, like a one-way gate. Its long leg (+) must go towards the + of the battery. The battery and the resistor are ready.', 'एलईडी करंट को सिर्फ़ एक तरफ़ जाने देती है, एकतरफ़ा फाटक की तरह। उसका लंबा पैर (+) बैटरी के + की ओर होना चाहिए। बैटरी और रेज़िस्टर तैयार हैं।', 'LED current ko sirf ek taraf jaane deti hai, ektarfa phaatak ki tarah. Uska lamba pair (+) battery ke + ki taraf hona chahiye. Battery aur resistor taiyaar hain.'),
      place(P('led1', 'led', { color: 'red' }, 'e23', 2), 'Put the red LED in the WRONG way, on purpose: its long leg on the left (column 22).', 'लाल एलईडी जानबूझकर उल्टी लगाइए: लंबा पैर बाईं तरफ़ (कॉलम 22)।', 'Laal LED jaanboojh kar ulti lagaiye: lamba pair left taraf (column 22).'),
      w('rail:tp', 'led1.K', 'Wire the + rail to column 23 (the LED\'s short leg).', '+ रेल को कॉलम 23 (एलईडी का छोटा पैर) से जोड़िए।', '+ rail ko column 23 (LED ka chhota pair) se jodiye.'),
      watch((S) => (S.memRun.dark || 0) > 1.5, 'Look at the LED.', 'एलईडी को देखिए।', 'LED ko dekhiye.', 'Dark. The loop is closed, but the LED blocks current going the wrong way.', 'अँधेरा। रास्ता बंद है, पर एलईडी उल्टी दिशा का करंट रोक देती है।', 'Andhera. Raasta band hai, par LED ulti disha ka current rok deti hai.'),
      act((S) => !S.has('led1'), 'Take the LED out (tap it, then delete it).', 'एलईडी निकालिए (उसे छूइए, फिर मिटाइए)।', 'LED nikaaliye (use touch karo, phir mitaiye).'),
      place(P('led2', 'led', { color: 'red' }, 'e22', 0), 'Put it back the right way: long leg on the right (column 23).', 'इसे सही तरफ़ से वापस लगाइए: लंबा पैर दाईं तरफ़ (कॉलम 23)।', 'Ise sahi taraf se wapas lagaiye: lamba pair right taraf (column 23).'),
      watch((S) => lit(S, 'led2'), 'Look again.', 'फिर देखिए।', 'Phir dekhiye.', 'It lights! Remember: long leg to +. The flat edge of the rim marks the short leg (−).', 'जल गई! याद रखिए: लंबा पैर + की ओर। किनारे का चपटा हिस्सा छोटे पैर (−) का निशान है।', 'Jal gayi! Yaad rakhiye: lamba pair + ki taraf. Kinare ka chapta hissa chhote pair (−) ka nishaan hai.')],
    check: [...batChecks(K)],
    done: (S) => lit(S, 'led2') });

  // 10 ------------------------------------------------------------------------------------------------- motor car with a switch
  add({ id: 'c_car', cls: '1', view: 'wide', drawer: ['bomotor', 'button'],
    title: t3('Simple motor car with a switch', 'स्विच वाली साधारण मोटर कार', 'Switch wali simple motor car'),
    goal: t3('A gear motor with a wheel, a battery and a switch: the start of every toy car.', 'पहिये वाली गियर मोटर, बैटरी और स्विच: हर खिलौना कार की शुरुआत।', 'Pahiye wali gear motor, battery aur switch: har toy car ki shuruaat.'),
    setup: { parts: [BAT], wires: BATW },
    tick: (S) => { if (isPressed(S, 'b1') && Math.abs(motorW(S, 'm1')) > 3) S.memRun.ran = true; },
    steps: [
      info('A gear motor has small gears inside: the motor spins fast, the gears make the wheel turn slower but much stronger, strong enough to push a car.', 'गियर मोटर के अंदर छोटे गियर होते हैं: मोटर तेज़ घूमती है, गियर पहिये को धीमा पर कहीं ज़्यादा ताक़तवर घुमाते हैं, कार धकेलने लायक़।', 'Gear motor ke andar chhote gear hote hain: motor tez ghoomti hai, gear pahiye ko dheema par kahin zyada taaqatwar ghumate hain, car dhakelne laayak.'),
      place(F('m1', 'bomotor', { side: 'L' }, 95, 160, 0), 'Put the gear motor with its wheel on the mat at the ghost.', 'पहिये वाली गियर मोटर को मैट पर नीली आकृति पर रखिए।', 'Pahiye wali gear motor ko mat par neeli shape par rakhiye.'),
      w('m1.N', 'rail:tn', 'Wire the motor\'s black wire to the − rail.', 'मोटर के काले तार को − रेल से जोड़िए।', 'Motor ke kaale wire ko − rail se jodiye.'),
      ...SWITCH,
      w('b1.L3', 'm1.P', 'Wire the button\'s right leg (column 42) to the motor\'s red wire.', 'बटन के दाएँ पैर (कॉलम 42) को मोटर के लाल तार से जोड़िए।', 'Button ke right pair (column 42) ko motor ke laal wire se jodiye.'),
      CHECK,
      act((S) => !!S.memRun.ran, 'Press and hold the button: drive!', 'बटन दबाकर रखिए: चलाइए!', 'Button dabaakar rakhiye: chalaiye!', 'The wheel turns. Two of these motors, a battery box and a cardboard body make a car.', 'पहिया घूमता है। ऐसी दो मोटरें, बैटरी बॉक्स और गत्ते की बॉडी से कार बन जाती है।', 'Pahiya ghoomta hai. Aisi do motors, battery box aur gatte ki body se car ban jaati hai.'),
      act((S) => S.memRun.ran && !isPressed(S, 'b1'), 'Let go.', 'छोड़ दीजिए।', 'Chhod dijiye.', 'It stops: no closed loop, no current.', 'रुक जाती है: बंद रास्ता नहीं, करंट नहीं।', 'Ruk jaati hai: band raasta nahi, current nahi.')],
    check: [...batChecks(K), has('m1', t3('motor', 'मोटर', 'motor')), join('m1.N', 'bat.N', t3('The motor\'s black wire', 'मोटर का काला तार', 'Motor ka kaala wire'), t3('the − rail', '− रेल', '− rail')), join('b1.L3', 'm1.P', t3('The button\'s right leg', 'बटन का दायाँ पैर', 'Button ka right pair'), t3('the motor\'s red wire', 'मोटर का लाल तार', 'Motor ka laal wire'))],
    done: (S) => !!S.memRun.ran });

  // 11 ------------------------------------------------------------------------------------------------- motor both ways
  add({ id: 'c_bothways', cls: '1', view: 'wide', drawer: ['motor'],
    title: t3('Motor that runs both ways (swap wires)', 'दोनों तरफ़ घूमने वाली मोटर (तार बदलिए)', 'Dono taraf ghoomne wali motor (wire badliye)'),
    goal: t3('Swap a motor\'s two wires and it spins the other way: that is how a toy car reverses.', 'मोटर के दोनों तार आपस में बदलिए और वह उल्टी घूमती है: खिलौना कार ऐसे ही पीछे चलती है।', 'Motor ke dono wire aapas mein badliye aur woh ulti ghoomti hai: toy car aise hi peeche chalti hai.'),
    setup: { parts: [BAT, F('m1', 'motor', {}, 95, 160, 0)], wires: BATW },
    tick: (S) => { const wv = motorW(S, 'm1'); if (wv > 30) S.memRun.fwd = true; if (wv < -30) S.memRun.back = true; },
    steps: [
      info('The battery and the fan motor are ready. Current flowing one way through the motor\'s coil turns it one way; flowing the other way turns it back.', 'बैटरी और पंखे वाली मोटर तैयार हैं। कुंडली में करंट एक तरफ़ बहे तो मोटर एक तरफ़ घूमती है; दूसरी तरफ़ बहे तो उल्टी।', 'Battery aur pankhe wali motor taiyaar hain. Kundali mein current ek taraf bahe to motor ek taraf ghoomti hai; doosri taraf bahe to ulti.'),
      w('m1.P', 'rail:tp', 'Wire the motor\'s red wire to the + rail.', 'मोटर के लाल तार को + रेल से जोड़िए।', 'Motor ke laal wire ko + rail se jodiye.'),
      w('m1.N', 'rail:tn', 'Wire its black wire to the − rail.', 'इसके काले तार को − रेल से जोड़िए।', 'Iske kaale wire ko − rail se jodiye.'),
      watch((S) => !!S.memRun.fwd, 'Watch the fan.', 'पंखा देखिए।', 'Pankha dekhiye.', 'It spins one way: blowing air towards you.', 'यह एक तरफ़ घूमता है: हवा आपकी ओर।', 'Yeh ek taraf ghoomta hai: hawa aapki taraf.'),
      act((S) => !S.conn('m1.P', 'bat.P') && !S.conn('m1.N', 'bat.N'), 'Take both motor wires off (tap each wire, then delete it).', 'मोटर के दोनों तार हटाइए (हर तार को छूइए, फिर मिटाइए)।', 'Motor ke dono wire hataiye (har wire ko touch karo, phir mitaiye).'),
      w('m1.P', 'rail:tn', 'Now swap: wire the red wire to the − rail…', 'अब बदलिए: लाल तार को − रेल से जोड़िए…', 'Ab badliye: laal wire ko − rail se jodiye…'),
      w('m1.N', 'rail:tp', '…and the black wire to the + rail.', '…और काले तार को + रेल से।', '…aur kaale wire ko + rail se.'),
      watch((S) => !!S.memRun.back, 'Watch the fan again.', 'फिर पंखा देखिए।', 'Phir pankha dekhiye.', 'The other way: now it sucks air away from you. Remote-control cars swap the current with a switch to go backwards.', 'दूसरी तरफ़: अब यह हवा आपसे दूर खींचता है। रिमोट वाली कारें पीछे जाने के लिए स्विच से करंट बदलती हैं।', 'Doosri taraf: ab yeh hawa aapse door kheenchta hai. Remote wali cars peeche jaane ke liye switch se current badalti hain.')],
    check: [...batChecks(K)],
    done: (S) => !!S.memRun.back });

  // 12 ------------------------------------------------------------------------------------------------- burglar alarm
  add({ id: 'c_burglar', cls: '1', view: 'wide', drawer: ['abuzz', 'resistor'],
    title: t3('Burglar alarm with a door wire', 'दरवाज़े के तार वाला चोर अलार्म', 'Darwaze ke wire wala chor alarm'),
    goal: t3('A thin wire across a door keeps the buzzer quiet; break it (open the door) and the alarm sounds.', 'दरवाज़े पर लगा पतला तार बज़र को चुप रखता है; उसे तोड़िए (दरवाज़ा खोलिए) और अलार्म बजता है।', 'Darwaze par laga patla wire buzzer ko chup rakhta hai; use todiye (darwaza kholiye) aur alarm bajta hai.'),
    setup: { parts: [BAT], wires: BATW },
    tick: (S) => { const b = S.part('ab1'); if (b && b.state.on && !S.conn('ab1.P', 'bat.N') && S.memRun.quiet) S.memRun.alarm = true; },
    steps: [
      info('A trick circuit: the door wire is a short cut around the buzzer. While it is there, the current takes the short cut and the buzzer gets nothing.', 'एक चालाक सर्किट: दरवाज़े का तार बज़र के चारों ओर छोटा रास्ता है। जब तक वह है, करंट छोटा रास्ता लेता है और बज़र को कुछ नहीं मिलता।', 'Ek chaalaak circuit: darwaze ka wire buzzer ke chaaron or chhota raasta hai. Jab tak woh hai, current chhota raasta leta hai aur buzzer ko kuch nahi milta.'),
      place(P('r1', 'resistor', { ohms: 220 }, 'a26', 0), 'Put the 220 Ω resistor from 26a to 30a.', '220 Ω रेज़िस्टर को 26a से 30a तक लगाइए।', '220 Ω resistor ko 26a se 30a tak lagaiye.', t3('It keeps the current small while the door wire is in place.', 'दरवाज़े का तार लगे रहने पर यह करंट कम रखता है।', 'Darwaze ka wire lage rehne par yeh current kam rakhta hai.')),
      w('rail:tp', 'r1.1', 'Wire the + rail to the resistor\'s left leg (column 26).', '+ रेल को रेज़िस्टर के बाएँ पैर (कॉलम 26) से जोड़िए।', '+ rail ko resistor ke left pair (column 26) se jodiye.'),
      place(P('ab1', 'abuzz', {}, 'e30', 0), 'Put the buzzer at the ghost: its + leg in column 30.', 'बज़र को नीली आकृति पर लगाइए: इसका + पैर कॉलम 30 में।', 'Buzzer ko neeli shape par lagaiye: iska + pair column 30 mein.'),
      w('ab1.N', 'rail:tn', 'Wire the buzzer\'s − leg (column 33) to the − rail.', 'बज़र के − पैर (कॉलम 33) को − रेल से जोड़िए।', 'Buzzer ke − pair (column 33) ko − rail se jodiye.'),
      watch((S) => S.part('ab1') && S.part('ab1').state.on, 'Listen.', 'सुनिए।', 'Suniye.', 'It beeps: no door wire yet.', 'यह बजता है: अभी दरवाज़े का तार नहीं है।', 'Yeh bajta hai: abhi darwaze ka wire nahi hai.'),
      w('ab1.P', 'rail:tn', 'Now the door wire: from column 30 straight to the − rail. (On a real door it runs across the gap and snaps when the door opens.)', 'अब दरवाज़े का तार: कॉलम 30 से सीधे − रेल तक। (असली दरवाज़े पर यह खाली जगह के पार जाता है और दरवाज़ा खुलते ही टूटता है।)', 'Ab darwaze ka wire: column 30 se seedhe − rail tak. (Asli darwaze par yeh khaali jagah ke paar jaata hai aur darwaza khulte hi toot-ta hai.)'),
      watch((S) => S.part('ab1') && !S.part('ab1').state.on && (S.memRun.quiet = true), 'Listen again.', 'फिर सुनिए।', 'Phir suniye.', 'Quiet: the alarm is armed.', 'शांत: अलार्म तैयार है।', 'Shaant: alarm taiyaar hai.'),
      act((S) => !!S.memRun.alarm, 'A burglar opens the door: remove the door wire.', 'चोर दरवाज़ा खोलता है: दरवाज़े वाला तार हटाइए।', 'Chor darwaza kholta hai: darwaze wala wire hataiye.', 'BEEP! The short cut is gone, so the current goes through the buzzer. Cutting the wire can\'t stop it: that sets it off too.', 'बीप! छोटा रास्ता गया, तो करंट बज़र से होकर जाता है। तार काटकर इसे रोका नहीं जा सकता: उससे भी बजता है।', 'BEEP! Chhota raasta gaya, to current buzzer se hokar jaata hai. Wire kaat kar ise roka nahi ja sakta: usse bhi bajta hai.')],
    check: [...batChecks(K), has('ab1', t3('buzzer', 'बज़र', 'buzzer')), join('r1.1', 'bat.P', t3('The resistor\'s left leg', 'रेज़िस्टर का बायाँ पैर', 'Resistor ka left pair'), t3('the + rail', '+ रेल', '+ rail')), join('ab1.N', 'bat.N', t3('The buzzer\'s − leg', 'बज़र का − पैर', 'Buzzer ka − pair'), t3('the − rail', '− रेल', '− rail'))],
    done: (S) => !!S.memRun.alarm });

  // 13 ------------------------------------------------------------------------------------------------- quiz board
  const RG = P('r1', 'resistor', { ohms: 220 }, 'b22', 3), RR = P('r2', 'resistor', { ohms: 220 }, 'b28', 3);
  add({ id: 'c_quiz', cls: '1', view: 'wide', drawer: ['led', 'button'],
    title: t3('Electric quiz board', 'बिजली वाला क्विज़ बोर्ड', 'Bijli wala quiz board'),
    goal: t3('Two answer buttons: the right one lights green, the wrong one red. The wiring knows the answer.', 'जवाब के दो बटन: सही वाला हरा जलाता है, ग़लत वाला लाल। वायरिंग को जवाब पता है।', 'Jawaab ke do button: sahi wala hara jalata hai, galat wala laal. Wiring ko jawaab pata hai.'),
    setup: { parts: [BAT, RG, RR, P('b1', 'button', {}, 'e40', 0), P('b2', 'button', {}, 'e46', 0)], wires: [...BATW, ['H:tp38', 'H:a40'], ['H:tp44', 'H:a46']] },
    tick: (S) => { if (isPressed(S, 'b1') && lit(S, 'led1') && !lit(S, 'led2')) S.memRun.right = true; if (isPressed(S, 'b2') && lit(S, 'led2') && !lit(S, 'led1')) S.memRun.wrong = true; },
    steps: [
      info('The question: "Which is the biggest planet?" Button 1 is Jupiter, button 2 is Mars. The buttons are already joined to the + rail.', 'सवाल: "सबसे बड़ा ग्रह कौन-सा है?" बटन 1 बृहस्पति है, बटन 2 मंगल। बटन पहले से + रेल से जुड़े हैं।', 'Sawaal: "Sabse bada grah kaun sa hai?" Button 1 Brihaspati (Jupiter) hai, button 2 Mangal (Mars). Button pehle se + rail se jude hain.'),
      place(P('led1', 'led', { color: 'green' }, 'e22', 0), 'Put the green LED at the ghost (columns 22–23).', 'हरी एलईडी को नीली आकृति पर लगाइए (कॉलम 22–23)।', 'Hari LED ko neeli shape par lagaiye (column 22–23).'),
      place(P('led2', 'led', { color: 'red' }, 'e28', 0), 'Put the red LED at the ghost (columns 28–29).', 'लाल एलईडी को नीली आकृति पर लगाइए (कॉलम 28–29)।', 'Laal LED ko neeli shape par lagaiye (column 28–29).'),
      w('b1.L3', 'led1.A', 'Wire button 1\'s right leg (column 42) to the green LED (column 23): Jupiter is right.', 'बटन 1 के दाएँ पैर (कॉलम 42) को हरी एलईडी (कॉलम 23) से जोड़िए: बृहस्पति सही है।', 'Button 1 ke right pair (column 42) ko hari LED (column 23) se jodiye: Brihaspati sahi hai.'),
      w('b2.L3', 'led2.A', 'Wire button 2\'s right leg (column 48) to the red LED (column 29).', 'बटन 2 के दाएँ पैर (कॉलम 48) को लाल एलईडी (कॉलम 29) से जोड़िए।', 'Button 2 ke right pair (column 48) ko laal LED (column 29) se jodiye.'),
      CHECK,
      act((S) => !!S.memRun.wrong, 'A friend answers Mars: press button 2.', 'एक दोस्त मंगल कहता है: बटन 2 दबाइए।', 'Ek dost Mangal kehta hai: button 2 dabaiye.', 'Red: wrong!', 'लाल: ग़लत!', 'Laal: galat!'),
      act((S) => !!S.memRun.right, 'Another friend answers Jupiter: press button 1.', 'दूसरा दोस्त बृहस्पति कहता है: बटन 1 दबाइए।', 'Doosra dost Brihaspati kehta hai: button 1 dabaiye.', 'Green: right! Make a card with questions and stick it on the board: the wires hide the answers.', 'हरा: सही! सवालों का कार्ड बनाकर बोर्ड पर चिपकाइए: तार जवाब छिपाते हैं।', 'Hara: sahi! Sawaalon ka card banakar board par chipkaiye: wire jawaab chhupate hain.')],
    check: [...batChecks(K), ...ledChecks(K), ...ledChecks(K, 'led2'), join('b1.L3', 'led1.A', t3('Button 1\'s right leg', 'बटन 1 का दायाँ पैर', 'Button 1 ka right pair'), t3('the green LED\'s long leg', 'हरी एलईडी का लंबा पैर', 'Hari LED ka lamba pair')), join('b2.L3', 'led2.A', t3('Button 2\'s right leg', 'बटन 2 का दायाँ पैर', 'Button 2 ka right pair'), t3('the red LED\'s long leg', 'लाल एलईडी का लंबा पैर', 'Laal LED ka lamba pair'))],
    done: (S) => !!S.memRun.right && !!S.memRun.wrong });

  // 14 ------------------------------------------------------------------------------------------------- colour mixing
  add({ id: 'c_rgbmix', cls: '1', view: 'wide', drawer: ['rgb', 'resistor'],
    title: t3('Colour mixing with three switches', 'तीन स्विच से रंग मिलाइए', 'Teen switch se rang milaiye'),
    goal: t3('An RGB LED has a red, a green and a blue light inside. Switch them on with wires and mix new colours.', 'RGB एलईडी के अंदर लाल, हरी और नीली रोशनी होती है। तारों से उन्हें चालू कीजिए और नए रंग मिलाइए।', 'RGB LED ke andar laal, hari aur neeli roshni hoti hai. Wires se unhe chalu kijiye aur naye rang milaiye.'),
    setup: { parts: [BAT, P('r1', 'resistor', { ohms: 220 }, 'a18', 0), P('r2', 'resistor', { ohms: 220 }, 'b20', 0), P('r3', 'resistor', { ohms: 220 }, 'c21', 0)], wires: BATW },
    steps: [
      info('Three resistors are ready, one for each colour. Each wire you add from the + rail is a switch for one colour.', 'तीन रेज़िस्टर तैयार हैं, हर रंग के लिए एक। + रेल से जोड़ा हर तार एक रंग का स्विच है।', 'Teen resistor taiyaar hain, har rang ke liye ek. + rail se joda har wire ek rang ka switch hai.'),
      place(P('rgb1', 'rgb', {}, 'e22', 0), 'Put the RGB LED at the ghost: its longest leg (−) in column 23.', 'RGB एलईडी को नीली आकृति पर लगाइए: सबसे लंबा पैर (−) कॉलम 23 में।', 'RGB LED ko neeli shape par lagaiye: sabse lamba pair (−) column 23 mein.'),
      w('rgb1.K', 'rail:tn', 'Wire column 23 (the longest leg) to the − rail.', 'कॉलम 23 (सबसे लंबा पैर) को − रेल से जोड़िए।', 'Column 23 (sabse lamba pair) ko − rail se jodiye.'),
      w('rail:tp', 'r1.1', 'Red switch: wire the + rail to column 18.', 'लाल स्विच: + रेल को कॉलम 18 से जोड़िए।', 'Laal switch: + rail ko column 18 se jodiye.'),
      watch((S) => ch(S, 'rgb1', 'R') > 0.002 && ch(S, 'rgb1', 'G') < 0.0005, 'Look.', 'देखिए।', 'Dekhiye.', 'Red.', 'लाल।', 'Laal.'),
      w('rail:tp', 'r2.1', 'Green switch: wire the + rail to column 20.', 'हरा स्विच: + रेल को कॉलम 20 से जोड़िए।', 'Hara switch: + rail ko column 20 se jodiye.'),
      watch((S) => ch(S, 'rgb1', 'R') > 0.002 && ch(S, 'rgb1', 'G') > 0.002 && ch(S, 'rgb1', 'B') < 0.0005, 'Look.', 'देखिए।', 'Dekhiye.', 'Red and green light together look yellow!', 'लाल और हरी रोशनी साथ में पीली दिखती है!', 'Laal aur hari roshni saath mein peeli dikhti hai!'),
      w('rail:tp', 'r3.1', 'Blue switch: wire the + rail to column 21.', 'नीला स्विच: + रेल को कॉलम 21 से जोड़िए।', 'Neela switch: + rail ko column 21 se jodiye.'),
      watch((S) => ch(S, 'rgb1', 'R') > 0.002 && ch(S, 'rgb1', 'G') > 0.002 && ch(S, 'rgb1', 'B') > 0.002, 'Look.', 'देखिए।', 'Dekhiye.', 'All three: white. Every colour on a phone screen is made of tiny red, green and blue lights.', 'तीनों: सफ़ेद। फ़ोन की स्क्रीन का हर रंग छोटी लाल, हरी और नीली रोशनियों से बनता है।', 'Teeno: safed. Phone ki screen ka har rang chhoti laal, hari aur neeli roshniyon se banta hai.'),
      act((S) => ch(S, 'rgb1', 'R') < 0.0005 && ch(S, 'rgb1', 'G') > 0.002 && ch(S, 'rgb1', 'B') > 0.002, 'Switch red off: remove the wire to column 18.', 'लाल बंद कीजिए: कॉलम 18 वाला तार हटाइए।', 'Laal band kijiye: column 18 wala wire hataiye.', 'Green and blue: a sky colour called cyan.', 'हरा और नीला: आसमानी रंग, जिसे सियान कहते हैं।', 'Hara aur neela: aasmaani rang, jise cyan kehte hain.')],
    check: [...batChecks(K), has('rgb1', t3('RGB LED', 'RGB एलईडी', 'RGB LED')), join('rgb1.K', 'bat.N', t3('The RGB LED\'s longest leg', 'RGB एलईडी का सबसे लंबा पैर', 'RGB LED ka sabse lamba pair'), t3('the − rail', '− रेल', '− rail'))],
    done: (S) => ch(S, 'rgb1', 'G') > 0.002 && ch(S, 'rgb1', 'B') > 0.002 });

  // 15 ------------------------------------------------------------------------------------------------- lighthouse
  add({ id: 'c_lighthouse', cls: '1', view: 'wide', drawer: ['led', 'resistor', 'button'],
    title: t3('Lighthouse model', 'लाइटहाउस का मॉडल', 'Lighthouse ka model'),
    goal: t3('Build the lamp of a lighthouse and flash its signal by hand, three flashes, the way each real lighthouse has its own pattern.', 'लाइटहाउस का लैंप बनाइए और हाथ से उसका संकेत चमकाइए, तीन बार, जैसे हर असली लाइटहाउस का अपना पैटर्न होता है।', 'Lighthouse ka lamp banaiye aur haath se uska sanket chamkaiye, teen baar, jaise har asli lighthouse ka apna pattern hota hai.'),
    setup: { parts: [BAT, R1], wires: BATW },
    tick: (S) => { const m = S.memRun; const on = lit(S, 'led1'); if (on && !m.on) m.flashes = (m.flashes || 0) + 1; m.on = on; },
    steps: [
      info('Ships at night see a lighthouse flash. Each lighthouse flashes its own pattern, so sailors know which one it is. The battery and the resistor are ready.', 'रात में जहाज़ लाइटहाउस की चमक देखते हैं। हर लाइटहाउस अपने पैटर्न में चमकता है, ताकि नाविक पहचान सकें कौन-सा है। बैटरी और रेज़िस्टर तैयार हैं।', 'Raat mein jahaaz lighthouse ki chamak dekhte hain. Har lighthouse apne pattern mein chamakta hai, taaki naavik pehchaan sakein kaun sa hai. Battery aur resistor taiyaar hain.'),
      place(P('led1', 'led', { color: 'yellow' }, 'e22', 0), 'Put the yellow LED at the ghost, long leg on the right.', 'पीली एलईडी को नीली आकृति पर लगाइए, लंबा पैर दाईं तरफ़।', 'Peeli LED ko neeli shape par lagaiye, lamba pair right taraf.'),
      ...SWITCH,
      w('b1.L3', 'led1.A', 'Wire the button\'s right leg (column 42) to the LED\'s long leg (column 23).', 'बटन के दाएँ पैर (कॉलम 42) को एलईडी के लंबे पैर (कॉलम 23) से जोड़िए।', 'Button ke right pair (column 42) ko LED ke lambe pair (column 23) se jodiye.'),
      CHECK,
      act((S) => (S.memRun.flashes || 0) >= 3, 'Flash the signal: press and let go three times.', 'संकेत चमकाइए: तीन बार दबाइए और छोड़िए।', 'Sanket chamkaiye: teen baar dabaiye aur chhodiye.', 'Flash, flash, flash. Put the LED on top of a paper tower and your lighthouse is ready.', 'चमक, चमक, चमक। एलईडी को काग़ज़ की मीनार पर लगाइए और आपका लाइटहाउस तैयार।', 'Chamak, chamak, chamak. LED ko kaagaz ki meenaar par lagaiye aur aapka lighthouse taiyaar.')],
    check: [...batChecks(K), ...ledChecks(K), join('b1.L1', 'bat.P', t3('The button\'s left leg', 'बटन का बायाँ पैर', 'Button ka left pair'), t3('the + rail', '+ रेल', '+ rail')), join('b1.L3', 'led1.A', t3('The button\'s right leg', 'बटन का दायाँ पैर', 'Button ka right pair'), t3('the LED\'s long leg', 'एलईडी का लंबा पैर', 'LED ka lamba pair'))],
    done: (S) => (S.memRun.flashes || 0) >= 3 });

  // 16 ------------------------------------------------------------------------------------------------- traffic signal by hand
  const TB = [P('b1', 'button', {}, 'e40', 0), P('b2', 'button', {}, 'e46', 0), P('b3', 'button', {}, 'e52', 0)];
  add({ id: 'c_traffic', cls: '2', view: 'wide', drawer: ['led', 'button'],
    title: t3('Traffic signal by hand (three switches)', 'हाथ से चलने वाला ट्रैफ़िक सिग्नल (तीन स्विच)', 'Haath se chalne wala traffic signal (teen switch)'),
    goal: t3('Red, yellow and green lamps, each with its own switch: be the traffic police and run the signal in the right order.', 'लाल, पीली और हरी बत्ती, हर एक का अपना स्विच: ट्रैफ़िक पुलिस बनिए और सिग्नल सही क्रम में चलाइए।', 'Laal, peeli aur hari batti, har ek ka apna switch: traffic police baniye aur signal sahi kram mein chalaiye.'),
    setup: { parts: [BAT, P('r1', 'resistor', { ohms: 220 }, 'b22', 3), P('r2', 'resistor', { ohms: 220 }, 'b28', 3), P('r3', 'resistor', { ohms: 220 }, 'b34', 3), P('led1', 'led', { color: 'red' }, 'e22', 0), P('led2', 'led', { color: 'yellow' }, 'e28', 0), P('led3', 'led', { color: 'green' }, 'e34', 0), ...TB],
      wires: [...BATW, ['H:tp38', 'H:a40'], ['H:tp44', 'H:a46'], ['H:tp50', 'H:a52']] },
    tick: (S) => { const m = S.memRun; const k = lit(S, 'led1') ? 'R' : lit(S, 'led3') ? 'G' : lit(S, 'led2') ? 'Y' : null; if (k && k !== m.last) { m.seq = ((m.seq || '') + k).slice(-6); m.last = k; } },
    steps: [
      info('The three lamps, their resistors and three switches are ready, and the switches are joined to the + rail. Each lamp is its own loop.', 'तीनों बत्तियाँ, उनके रेज़िस्टर और तीन स्विच तैयार हैं, और स्विच + रेल से जुड़े हैं। हर बत्ती का अपना रास्ता है।', 'Teeno battiyan, unke resistor aur teen switch taiyaar hain, aur switch + rail se jude hain. Har batti ka apna raasta hai.'),
      w('b1.L3', 'led1.A', 'Wire switch 1 (column 42) to the red lamp (column 23).', 'स्विच 1 (कॉलम 42) को लाल बत्ती (कॉलम 23) से जोड़िए।', 'Switch 1 (column 42) ko laal batti (column 23) se jodiye.'),
      w('b2.L3', 'led2.A', 'Wire switch 2 (column 48) to the yellow lamp (column 29).', 'स्विच 2 (कॉलम 48) को पीली बत्ती (कॉलम 29) से जोड़िए।', 'Switch 2 (column 48) ko peeli batti (column 29) se jodiye.'),
      w('b3.L3', 'led3.A', 'Wire switch 3 (column 54) to the green lamp (column 35).', 'स्विच 3 (कॉलम 54) को हरी बत्ती (कॉलम 35) से जोड़िए।', 'Switch 3 (column 54) ko hari batti (column 35) se jodiye.'),
      CHECK,
      act((S) => /RGY/.test(S.memRun.seq || ''), 'Run the signal: red (switch 1), then green (switch 3), then yellow (switch 2).', 'सिग्नल चलाइए: लाल (स्विच 1), फिर हरा (स्विच 3), फिर पीला (स्विच 2)।', 'Signal chalaiye: laal (switch 1), phir hara (switch 3), phir peela (switch 2).', 'Stop, go, get ready to stop. A real signal does this by itself with a timer: you will build that one with code.', 'रुको, चलो, रुकने को तैयार। असली सिग्नल टाइमर से यह अपने आप करता है: वह आप कोड से बनाएँगे।', 'Ruko, chalo, rukne ko taiyaar. Asli signal timer se yeh apne aap karta hai: woh aap code se banayenge.')],
    check: [...batChecks(K), join('b1.L3', 'led1.A', t3('Switch 1', 'स्विच 1', 'Switch 1'), t3('the red lamp', 'लाल बत्ती', 'laal batti')), join('b2.L3', 'led2.A', t3('Switch 2', 'स्विच 2', 'Switch 2'), t3('the yellow lamp', 'पीली बत्ती', 'peeli batti')), join('b3.L3', 'led3.A', t3('Switch 3', 'स्विच 3', 'Switch 3'), t3('the green lamp', 'हरी बत्ती', 'hari batti'))],
    done: (S) => /RGY/.test(S.memRun.seq || '') });

  // 17 ------------------------------------------------------------------------------------------------- Morse tapper
  add({ id: 'c_morse', cls: '2', view: 'wide', drawer: ['abuzz', 'led', 'button'],
    title: t3('Morse tapper (no board)', 'मोर्स टैपर (बिना बोर्ड)', 'Morse tapper (bina board)'),
    goal: t3('A key, a buzzer and a lamp: tap out S O S in Morse code, short and long beeps.', 'एक की, एक बज़र और एक लैंप: मोर्स कोड में S O S बजाइए, छोटी और लंबी बीप।', 'Ek key, ek buzzer aur ek lamp: Morse code mein S O S bajaiye, chhoti aur lambi beep.'),
    setup: { parts: [BAT, R1, P('b1', 'button', {}, 'e40', 0)], wires: [...BATW, ['H:tp38', 'H:a40']] },
    tick: (S) => { const m = S.memRun; const on = isPressed(S, 'b1') && S.part('ab1') && S.part('ab1').state.on; if (on && m.t0 === undefined) m.t0 = S.t; if (!on && m.t0 !== undefined) { const d = S.t - m.t0; m.code = ((m.code || '') + (d < 0.4 ? '.' : '-')).slice(-12); m.t0 = undefined; m.gapAt = S.t; } if (m.code && /\.\.\.---\.\.\.$/.test(m.code)) m.sos = true; },
    steps: [
      info('A Morse key is just a switch. The battery, the key (button) and a resistor are ready.', 'मोर्स की बस एक स्विच है। बैटरी, की (बटन) और रेज़िस्टर तैयार हैं।', 'Morse key bas ek switch hai. Battery, key (button) aur resistor taiyaar hain.'),
      place(P('ab1', 'abuzz', {}, 'e30', 0), 'Put the buzzer at the ghost: its + leg in column 30.', 'बज़र को नीली आकृति पर लगाइए: इसका + पैर कॉलम 30 में।', 'Buzzer ko neeli shape par lagaiye: iska + pair column 30 mein.'),
      w('ab1.N', 'rail:tn', 'Wire the buzzer\'s − leg (column 33) to the − rail.', 'बज़र के − पैर (कॉलम 33) को − रेल से जोड़िए।', 'Buzzer ke − pair (column 33) ko − rail se jodiye.'),
      w('b1.L3', 'ab1.P', 'Wire the key\'s right leg (column 42) to the buzzer\'s + leg (column 30).', 'की के दाएँ पैर (कॉलम 42) को बज़र के + पैर (कॉलम 30) से जोड़िए।', 'Key ke right pair (column 42) ko buzzer ke + pair (column 30) se jodiye.'),
      place(P('led1', 'led', { color: 'red' }, 'e22', 0), 'Add a lamp for ships that can\'t hear: the red LED at the ghost.', 'जो जहाज़ सुन न सकें उनके लिए लैंप: लाल एलईडी नीली आकृति पर।', 'Jo jahaaz sun na sakein unke liye lamp: laal LED neeli shape par.'),
      w('ab1.P', 'led1.A', 'Wire column 30 to the LED\'s long leg (column 23): the lamp shares the key.', 'कॉलम 30 को एलईडी के लंबे पैर (कॉलम 23) से जोड़िए: लैंप भी उसी की से चलता है।', 'Column 30 ko LED ke lambe pair (column 23) se jodiye: lamp bhi usi key se chalta hai.'),
      CHECK,
      act((S) => !!S.memRun.sos, 'Tap S O S: three short taps, three long presses, three short taps (· · · − − − · · ·).', 'S O S बजाइए: तीन छोटे टैप, तीन लंबे दबाव, तीन छोटे टैप (· · · − − − · · ·)।', 'S O S bajaiye: teen chhote tap, teen lambe dabaav, teen chhote tap (· · · − − − · · ·).', 'SOS: "help!" in every language. Ships sent it by radio, and it still works with a torch or a whistle.', 'SOS: हर भाषा में "मदद!"। जहाज़ इसे रेडियो से भेजते थे, और यह टॉर्च या सीटी से आज भी काम करता है।', 'SOS: har bhasha mein "madad!". Jahaaz ise radio se bhejte the, aur yeh torch ya seeti se aaj bhi kaam karta hai.')],
    check: [...batChecks(K), ...ledChecks(K), has('ab1', t3('buzzer', 'बज़र', 'buzzer')), join('ab1.N', 'bat.N', t3('The buzzer\'s − leg', 'बज़र का − पैर', 'Buzzer ka − pair'), t3('the − rail', '− रेल', '− rail')), join('b1.L3', 'ab1.P', t3('The key\'s right leg', 'की का दायाँ पैर', 'Key ka right pair'), t3('the buzzer\'s + leg', 'बज़र का + पैर', 'Buzzer ka + pair'))],
    done: (S) => !!S.memRun.sos });

  // 18 ------------------------------------------------------------------------------------------------- battery level
  add({ id: 'c_battlevel', cls: '2', view: 'wide', drawer: ['led', 'resistor', 'battery'],
    title: t3('Battery level by brightness', 'चमक से बैटरी का स्तर', 'Chamak se battery ka level'),
    goal: t3('The same LED and resistor on a 6 V box, then on a 9 V battery: more volts push more current, and the LED is brighter.', 'वही एलईडी और रेज़िस्टर पहले 6 V बॉक्स पर, फिर 9 V बैटरी पर: ज़्यादा वोल्ट ज़्यादा करंट धकेलते हैं, और एलईडी ज़्यादा चमकती है।', 'Wahi LED aur resistor pehle 6 V box par, phir 9 V battery par: zyada volt zyada current dhakelte hain, aur LED zyada chamakti hai.'),
    setup: { parts: [BAT, P('r1', 'resistor', { ohms: 330 }, 'b22', 3), P('led1', 'led', { color: 'red' }, 'e22', 0)], wires: BATW },
    tick: (S) => { const p = S.part('led1'); if (!p) return; const b = p.state.b || 0; const m = S.memRun; if (S.conn('led1.A', 'bat.P') && b > 0.1) m.b6 = Math.max(m.b6 || 0, b); if (S.has('b9') && S.conn('led1.A', 'b9.P') && b > 0.1) m.b9 = Math.max(m.b9 || 0, b); },
    steps: [
      info('The 6 V box, an LED and a 330 Ω resistor are ready. A battery\'s volts are how hard it pushes the current. A tired battery pushes less, so its lamp is dimmer.', '6 V बॉक्स, एलईडी और 330 Ω रेज़िस्टर तैयार हैं। बैटरी के वोल्ट बताते हैं वह करंट को कितनी ज़ोर से धकेलती है। थकी बैटरी कम धकेलती है, तो उसका लैंप धीमा होता है।', '6 V box, LED aur 330 Ω resistor taiyaar hain. Battery ke volt batate hain woh current ko kitni zor se dhakelti hai. Thaki battery kam dhakelti hai, to uska lamp dheema hota hai.'),
      w('rail:tp', 'led1.A', 'Wire the + rail to the LED\'s long leg (column 23).', '+ रेल को एलईडी के लंबे पैर (कॉलम 23) से जोड़िए।', '+ rail ko LED ke lambe pair (column 23) se jodiye.'),
      watch((S) => (S.memRun.b6 || 0) > 0.3, 'Look at the LED.', 'एलईडी देखिए।', 'LED dekhiye.', 'On 6 V: about 12 mA, a nice glow.', '6 V पर: लगभग 12 mA, अच्छी चमक।', '6 V par: lagbhag 12 mA, achhi chamak.'),
      act((S) => !S.conn('led1.A', 'bat.P'), 'Take the LED\'s wire off the + rail.', 'एलईडी का तार + रेल से हटाइए।', 'LED ka wire + rail se hataiye.'),
      place(F('b9', 'battery', {}, 40, 150, 0), 'Put the 9 V battery on the mat at the ghost.', '9 V बैटरी को मैट पर नीली आकृति पर रखिए।', '9 V battery ko mat par neeli shape par rakhiye.'),
      w('b9.N', 'rail:tn', 'Wire its black (−) wire to the − rail.', 'इसके काले (−) तार को − रेल से जोड़िए।', 'Iske kaale (−) wire ko − rail se jodiye.'),
      w('b9.P', 'led1.A', 'Wire its red (+) wire straight to the LED\'s long leg (column 23).', 'इसके लाल (+) तार को सीधे एलईडी के लंबे पैर (कॉलम 23) से जोड़िए।', 'Iske laal (+) wire ko seedhe LED ke lambe pair (column 23) se jodiye.'),
      watch((S) => (S.memRun.b9 || 0) > (S.memRun.b6 || 0) + 0.1, 'Look again.', 'फिर देखिए।', 'Phir dekhiye.', 'Brighter: about 20 mA. A shop tester for cells does the same: the brighter its lamp, the fuller the cell.', 'ज़्यादा चमक: लगभग 20 mA। दुकान का सेल टेस्टर यही करता है: लैंप जितना तेज़, सेल उतना भरा।', 'Zyada chamak: lagbhag 20 mA. Dukaan ka cell tester yahi karta hai: lamp jitna tez, cell utna bhara.')],
    check: [...batChecks(K), ...ledChecks(K)],
    done: (S) => (S.memRun.b9 || 0) > (S.memRun.b6 || 0) + 0.1 });

  // 19 ------------------------------------------------------------------------------------------------- short circuit
  add({ id: 'c_short', cls: '1', view: 'wide', drawer: ['led', 'resistor'],
    title: t3('Short circuit: what goes wrong and why', 'शॉर्ट सर्किट: क्या गड़बड़ होता है और क्यों', 'Short circuit: kya gadbad hota hai aur kyun'),
    goal: t3('See, safely in 3D, what a short circuit does: the lamp goes out, a huge current flows and the battery heats up. Then fix it.', '3D में सुरक्षित रूप से देखिए कि शॉर्ट सर्किट क्या करता है: लैंप बुझ जाता है, बहुत बड़ा करंट बहता है और बैटरी गर्म होती है। फिर ठीक कीजिए।', '3D mein surakshit roop se dekhiye ki short circuit kya karta hai: lamp bujh jaata hai, bahut bada current behta hai aur battery garam hoti hai. Phir theek kijiye.'),
    setup: { parts: [BAT, LED1, R1], wires: [...BATW, ['H:tp30', 'H:a23']] },
    tick: (S) => { const b = S.part('bat'); if (b && b.state.hot && !lit(S, 'led1')) S.memRun.hot = true; if (S.memRun.hot && b && !b.state.hot && lit(S, 'led1')) S.memRun.fixed = true; },
    steps: [
      info('The lamp circuit is ready and glowing: the current goes from + through the LED and the resistor, which keep it small, back to −.', 'लैंप का सर्किट तैयार है और चमक रहा है: करंट + से एलईडी और रेज़िस्टर होकर, जो उसे छोटा रखते हैं, वापस − में जाता है।', 'Lamp ka circuit taiyaar hai aur chamak raha hai: current + se LED aur resistor hokar, jo use chhota rakhte hain, wapas − mein jaata hai.'),
      watch((S) => lit(S, 'led1'), 'Look at the LED.', 'एलईडी देखिए।', 'LED dekhiye.', 'It glows: about 18 mA.', 'चमक रही है: लगभग 18 mA।', 'Chamak rahi hai: lagbhag 18 mA.'),
      w('rail:tp', 'rail:tn', 'Only here in 3D, never with a real battery: wire the + rail straight to the − rail.', 'सिर्फ़ यहाँ 3D में, असली बैटरी के साथ कभी नहीं: + रेल को सीधे − रेल से जोड़िए।', 'Sirf yahan 3D mein, asli battery ke saath kabhi nahi: + rail ko seedhe − rail se jodiye.'),
      watch((S) => !!S.memRun.hot, 'Watch the LED, and read the warning.', 'एलईडी देखिए, और चेतावनी पढ़िए।', 'LED dekhiye, aur chetavani padhiye.', 'The LED goes out: the current takes the easy path, the bare wire, with nothing to slow it: about 10 A, 500 times the LED\'s. A real battery gets hot and can leak or catch fire; the wire gets hot too.', 'एलईडी बुझ जाती है: करंट आसान रास्ता लेता है, नंगा तार, जिसमें उसे रोकने को कुछ नहीं: लगभग 10 A, एलईडी के करंट का 500 गुना। असली बैटरी गर्म होकर रिस सकती है या आग पकड़ सकती है; तार भी गर्म होता है।', 'LED bujh jaati hai: current aasaan raasta leta hai, nanga wire, jismein use rokne ko kuch nahi: lagbhag 10 A, LED ke current ka 500 guna. Asli battery garam hokar ris sakti hai ya aag pakad sakti hai; wire bhi garam hota hai.'),
      act((S) => !!S.memRun.fixed, 'Fix it: take the short wire out (tap it, then delete it).', 'ठीक कीजिए: छोटा रास्ता बनाने वाला तार निकालिए (उसे छूइए, फिर मिटाइए)।', 'Theek kijiye: chhota raasta banane wala wire nikaaliye (use touch karo, phir mitaiye).', 'The LED shines again and the battery cools. At home, a fuse or an MCB switches off a short circuit before the wires can burn.', 'एलईडी फिर चमकती है और बैटरी ठंडी होती है। घर में फ़्यूज़ या MCB तार जलने से पहले शॉर्ट सर्किट बंद कर देते हैं।', 'LED phir chamakti hai aur battery thandi hoti hai. Ghar mein fuse ya MCB wire jalne se pehle short circuit band kar dete hain.')],
    check: [...batChecks(K)],
    done: (S) => !!S.memRun.fixed });

  return L;
}
