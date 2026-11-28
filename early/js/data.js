// DUET Little Learners: everything the app shows and says, in English and Hindi. Our own words (facts are free).
// Every text a child hears is listed by allSpeech() so devtools/early/voices.mjs can make its clip.
export const L = (en, hi) => ({ en, hi });

// ------------------------------------------------------------------ the sections on the home page
export const SECTIONS = [
  { id: 'abc', icon: 'abc', title: L('ABC', 'ABC'), sub: L('English letters A to Z', 'अंग्रेज़ी के अक्षर A से Z'), color: '#e8603c' },
  { id: 'varna', icon: 'varna', title: L('अ आ इ', 'अ आ इ'), sub: L('Hindi letters अ to ज्ञ', 'हिंदी वर्णमाला, अ से ज्ञ'), color: '#d9488b' },
  { id: 'numbers', icon: 'numbers', title: L('Numbers 1 to 20', 'गिनती 1 से 20'), sub: L('Count, add and take away', 'गिनो, जोड़ो और घटाओ'), color: '#3c8de8' },
  { id: 'fruits', icon: 'fruits', title: L('Fruits', 'फल'), sub: L('12 fruits of India', 'भारत के 12 फल'), color: '#e8a23c' },
  { id: 'veg', icon: 'veg', title: L('Vegetables', 'सब्ज़ियाँ'), sub: L('13 vegetables we eat', 'हमारी 13 सब्ज़ियाँ'), color: '#4caf50' },
  { id: 'harappa', icon: 'harappa', title: L('Harappan City', 'हड़प्पा का शहर'), sub: L('Walk a 4,500-year-old lane', '4,500 साल पुरानी गली में घूमो'), color: '#b8673a' },
  { id: 'museum', icon: 'museum', title: L('Museum Tour', 'संग्रहालय की सैर'), sub: L('Great art from India and the world', 'भारत और दुनिया की महान कलाकृतियाँ'), color: '#8a6bd1' },
];

// ------------------------------------------------------------------ English letters
// [letter, word, Hindi word, Hindi in Latin letters, model]
export const ABC = [
  ['A', 'apple', 'सेब', 'seb', 'apple'], ['B', 'ball', 'गेंद', 'gend', 'ball'], ['C', 'cat', 'बिल्ली', 'billi', 'cat'], ['D', 'dog', 'कुत्ता', 'kutta', 'dog'],
  ['E', 'elephant', 'हाथी', 'haathi', 'elephant'], ['F', 'fish', 'मछली', 'machhli', 'fish'], ['G', 'goat', 'बकरी', 'bakri', 'goat'], ['H', 'hen', 'मुर्गी', 'murgi', 'hen'],
  ['I', 'ice cream', 'आइसक्रीम', 'icecream', 'icecream'], ['J', 'jug', 'जग', 'jag', 'jug'], ['K', 'kite', 'पतंग', 'patang', '@kite'], ['L', 'lion', 'शेर', 'sher', 'lion'],
  ['M', 'mango', 'आम', 'aam', 'mango'], ['N', 'nest', 'घोंसला', 'ghonsla', '@nest'], ['O', 'owl', 'उल्लू', 'ullu', 'owl'], ['P', 'parrot', 'तोता', 'tota', 'parrot'],
  ['Q', 'queen', 'रानी', 'rani', 'queen'], ['R', 'rabbit', 'खरगोश', 'khargosh', 'rabbit'], ['S', 'ship', 'जहाज़', 'jahaaz', 'ship'], ['T', 'tiger', 'बाघ', 'baagh', 'tiger'],
  ['U', 'umbrella', 'छाता', 'chhaata', 'umbrella'], ['V', 'vase', 'फूलदान', 'phooldaan', 'vase'], ['W', 'watermelon', 'तरबूज़', 'tarbooz', 'watermelon'], ['X', 'xylophone', 'ज़ाइलोफ़ोन', 'xylophone', 'xylophone'],
  ['Y', 'yak', 'याक', 'yaak', 'yak'], ['Z', 'zebra', 'ज़ेबरा', 'zebra', 'zebra'],
].map(([ch, word, hi, hiRoman, model]) => ({ ch, low: ch.toLowerCase(), word, hi, hiRoman, model,
  say: { en: `${ch}. ${ch} for ${word}.` }, name: L(word[0].toUpperCase() + word.slice(1), hi) }));
// the English letters' names, as a Hindi voice says them
export const HI_NAME = { A: 'ए', B: 'बी', C: 'सी', D: 'डी', E: 'ई', F: 'एफ़', G: 'जी', H: 'एच', I: 'आई', J: 'जे', K: 'के', L: 'एल', M: 'एम', N: 'एन', O: 'ओ', P: 'पी', Q: 'क्यू', R: 'आर', S: 'एस', T: 'टी', U: 'यू', V: 'वी', W: 'डब्ल्यू', X: 'एक्स', Y: 'वाई', Z: 'ज़ेड' };

// ------------------------------------------------------------------ Hindi letters (स्वर and व्यंजन)
// [letter, word, Latin spelling, English meaning, model, note]  model '' = no picture (the letter has no word of its own)
const V = [
  ['अ', 'अनार', 'anaar', 'pomegranate', 'pomegranate'], ['आ', 'आम', 'aam', 'mango', 'mango'], ['इ', 'इमली', 'imli', 'tamarind', '@tamarind'], ['ई', 'ईख', 'eekh', 'sugarcane', '@sugarcane'],
  ['उ', 'उल्लू', 'ullu', 'owl', 'owl'], ['ऊ', 'ऊन', 'oon', 'wool', '@wool'], ['ऋ', 'ऋषि', 'rishi', 'sage', 'sage'], ['ए', 'एकतारा', 'ektaara', 'one-string lute', '@ektara'],
  ['ऐ', 'ऐनक', 'ainak', 'spectacles', 'spectacles'], ['ओ', 'ओखली', 'okhli', 'mortar', 'mortar'], ['औ', 'औज़ार', 'auzaar', 'tool', 'hammer'], ['अं', 'अंगूर', 'angoor', 'grapes', 'grapes'],
  ['अः', 'प्रातः', 'praatah', 'morning', '', 'अः comes at the end of words, like प्रातः (morning).', 'अः शब्दों के अंत में आता है, जैसे प्रातः।'],
];
const C = [
  ['क', 'कबूतर', 'kabootar', 'pigeon', 'pigeon'], ['ख', 'खरगोश', 'khargosh', 'rabbit', 'rabbit'], ['ग', 'गमला', 'gamla', 'flower pot', 'flowerpot'], ['घ', 'घड़ी', 'ghadi', 'clock', 'clock'],
  ['ङ', 'पंखा', 'pankha', 'fan', 'fan', 'ङ comes inside words, like पङ्खा, the old way to write पंखा (fan).', 'ङ शब्दों के बीच में आता है, जैसे पङ्खा (पंखा)।'],
  ['च', 'चम्मच', 'chammach', 'spoon', 'spoon'], ['छ', 'छाता', 'chhaata', 'umbrella', 'umbrella'], ['ज', 'जहाज़', 'jahaaz', 'ship', 'ship'], ['झ', 'झंडा', 'jhanda', 'flag', '@flag'],
  ['ञ', 'मञ्च', 'manch', 'stage', '', 'ञ comes inside words, like मञ्च (stage).', 'ञ शब्दों के बीच में आता है, जैसे मञ्च।'],
  ['ट', 'टमाटर', 'tamaatar', 'tomato', 'tomato'], ['ठ', 'ठठेरा', 'thathera', 'brass and copper maker', 'pots'], ['ड', 'डमरू', 'damroo', 'little drum', '@damru'], ['ढ', 'ढोलक', 'dholak', 'drum', '@dholak'],
  ['ण', 'बाण', 'baan', 'arrow', '@arrow', 'ण comes at the end of words, like बाण (arrow).', 'ण शब्दों के अंत में आता है, जैसे बाण।'],
  ['त', 'तरबूज़', 'tarbooz', 'watermelon', 'watermelon'], ['थ', 'थरमस', 'tharmas', 'flask', 'thermos'], ['द', 'दवात', 'davaat', 'ink pot', 'inkpot'], ['ध', 'धनुष', 'dhanush', 'bow', '@bow'],
  ['न', 'नल', 'nal', 'tap', '@tap'], ['प', 'पतंग', 'patang', 'kite', '@kite'], ['फ', 'फल', 'phal', 'fruits', '@fruits'], ['ब', 'बतख', 'batakh', 'duck', 'duck'],
  ['भ', 'भालू', 'bhaalu', 'bear', 'bear'], ['म', 'मछली', 'machhli', 'fish', 'fish'], ['य', 'याक', 'yaak', 'yak', 'yak'], ['र', 'रस्सी', 'rassi', 'rope', '@rope'],
  ['ल', 'लट्टू', 'lattoo', 'spinning top', '@top'], ['व', 'वायुयान', 'vaayuyaan', 'aeroplane', 'plane'], ['श', 'शेर', 'sher', 'lion', 'lion'], ['ष', 'षट्कोण', 'shatkon', 'hexagon', '@hexagon'],
  ['स', 'सेब', 'seb', 'apple', 'apple'], ['ह', 'हाथी', 'haathi', 'elephant', 'elephant'], ['क्ष', 'क्षत्रिय', 'kshatriya', 'warrior', 'shield'], ['त्र', 'त्रिशूल', 'trishool', 'trident', '@trishul'],
  ['ज्ञ', 'ज्ञान', 'gyaan', 'knowledge', 'books'],
];
const hiItem = (kind) => ([ch, word, roman, en, model, noteEn, noteHi]) => ({ ch, kind, word, roman, en, model,
  note: noteEn ? L(noteEn, noteHi) : null,
  say: { hi: noteHi ? `${ch}। ${noteHi}` : `${ch}। ${ch} से ${word}।` },
  name: L(en[0].toUpperCase() + en.slice(1), word) });
export const VARNA = [...V.map(hiItem('swar')), ...C.map(hiItem('vyanjan'))];

// ------------------------------------------------------------------ numbers
const EN_N = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'];
const HI_N = ['शून्य', 'एक', 'दो', 'तीन', 'चार', 'पाँच', 'छह', 'सात', 'आठ', 'नौ', 'दस', 'ग्यारह', 'बारह', 'तेरह', 'चौदह', 'पंद्रह', 'सोलह', 'सत्रह', 'अठारह', 'उन्नीस', 'बीस'];
export const DEV_DIGITS = '०१२३४५६७८९';
export const devNum = (n) => String(n).split('').map((d) => DEV_DIGITS[+d]).join('');
export const COUNT_THINGS = [
  { id: 'mango', name: L('mangoes', 'आम'), one: L('mango', 'आम') },
  { id: 'marble', name: L('marbles', 'कंचे'), one: L('marble', 'कंचा') },
  { id: 'pencil', name: L('pencils', 'पेंसिलें'), one: L('pencil', 'पेंसिल') },
];
export const NUMBERS = Array.from({ length: 20 }, (_, i) => { const n = i + 1; return { n, en: EN_N[n], hi: HI_N[n], dev: devNum(n),
  say: L(`${n}. ${EN_N[n][0].toUpperCase() + EN_N[n].slice(1)}.`, `${HI_N[n]}।`), count: L(EN_N[n][0].toUpperCase() + EN_N[n].slice(1) + '.', HI_N[n] + '।') }; });
export const numWord = (n, lang) => (lang === 'hi' ? HI_N[n] : EN_N[n]);

// ------------------------------------------------------------------ fruits and vegetables
// part: root stem leaf flower fruit seed.  cut: which way the knife goes (x: top to bottom through the middle; z: across the long side)
export const PARTS = [
  { id: 'root', name: L('Root', 'जड़') }, { id: 'stem', name: L('Stem', 'तना') }, { id: 'leaf', name: L('Leaf', 'पत्ती') },
  { id: 'flower', name: L('Flower', 'फूल') }, { id: 'fruit', name: L('Fruit', 'फल') }, { id: 'seed', name: L('Seed', 'बीज') },
];
const P = (id, en, hi, part, fact, why, cut = 'x', model = id) => ({ id, model, name: L(en, hi), part, fact, why, cut });
export const FRUITS = [
  P('mango', 'Mango', 'आम', 'fruit', L('The mango is the national fruit of India. Inside is one big, flat seed.', 'आम भारत का राष्ट्रीय फल है। इसके अंदर एक बड़ी, चपटी गुठली होती है।'), null, 'z'),
  P('banana', 'Banana', 'केला', 'fruit', L('Bananas grow in big bunches. The tiny dots in the middle are seeds that never grow.', 'केले बड़े गुच्छों में उगते हैं। बीच के छोटे काले बिंदु बीज हैं।'), null, 'x'),
  P('guava', 'Guava', 'अमरूद', 'fruit', L('A guava has lots of small, hard seeds inside its soft middle.', 'अमरूद के नरम बीच वाले हिस्से में बहुत सारे छोटे, सख़्त बीज होते हैं।')),
  P('papaya', 'Papaya', 'पपीता', 'fruit', L('Cut a papaya and you will find many shiny black seeds in a hollow middle.', 'पपीते को काटो, तो बीच के खाली हिस्से में बहुत सारे चमकीले काले बीज मिलते हैं।'), null, 'z'),
  P('pomegranate', 'Pomegranate', 'अनार', 'fruit', L('A pomegranate is full of juicy red seeds, packed in tiny rooms.', 'अनार रसीले लाल दानों से भरा होता है, जो छोटे-छोटे खानों में रहते हैं।')),
  P('litchi', 'Litchi', 'लीची', 'fruit', L('A litchi has bumpy red skin, sweet white flesh and one shiny brown seed.', 'लीची का छिलका खुरदुरा और लाल होता है, गूदा मीठा और सफ़ेद, और एक चमकीला भूरा बीज।')),
  P('jamun', 'Jamun', 'जामुन', 'fruit', L('Jamun is a small purple fruit of the rainy season. It turns your tongue purple!', 'जामुन बरसात का छोटा बैंगनी फल है। इसे खाकर जीभ बैंगनी हो जाती है!'), null, 'x', '@jamun'),
  P('apple', 'Apple', 'सेब', 'fruit', L('Apples grow on trees in cold hills, like Kashmir and Himachal. Cut one and see a star of seeds.', 'सेब कश्मीर और हिमाचल जैसे ठंडे पहाड़ों के पेड़ों पर उगते हैं। काटो तो बीजों का तारा दिखता है।'), null, 'y'),
  P('grapes', 'Grapes', 'अंगूर', 'fruit', L('Grapes grow in bunches on a climbing plant called a vine.', 'अंगूर एक बेल पर गुच्छों में उगते हैं।'), null, null),
  P('watermelon', 'Watermelon', 'तरबूज़', 'fruit', L('A watermelon is mostly water. It keeps us cool in summer.', 'तरबूज़ में ज़्यादातर पानी होता है। यह गर्मी में हमें ठंडक देता है।')),
  P('orange', 'Orange', 'संतरा', 'fruit', L('An orange is made of juicy pieces called segments.', 'संतरा रसीली फाँकों से बना होता है।'), null, 'y'),
  P('coconut', 'Coconut', 'नारियल', 'fruit', L('A coconut has sweet water and white flesh inside a hard shell.', 'नारियल के सख़्त खोल के अंदर मीठा पानी और सफ़ेद गरी होती है।')),
];
export const VEG = [
  P('tomato', 'Tomato', 'टमाटर', 'fruit', L('A tomato is really a fruit of the tomato plant. It is full of little seeds.', 'टमाटर असल में टमाटर के पौधे का फल है। इसमें बहुत छोटे बीज होते हैं।'), L('We eat the fruit of the tomato plant.', 'हम टमाटर के पौधे का फल खाते हैं।'), 'y'),
  P('potato', 'Potato', 'आलू', 'stem', L('A potato grows under the ground. It is a fat stem that stores food.', 'आलू ज़मीन के नीचे उगता है। यह एक मोटा तना है जो भोजन जमा करता है।'), L('We eat the stem of the potato plant. It grows under the ground.', 'हम आलू के पौधे का तना खाते हैं। यह ज़मीन के नीचे उगता है।')),
  P('onion', 'Onion', 'प्याज़', 'leaf', L('An onion is made of thick, juicy layers. Each layer is a leaf.', 'प्याज़ मोटी, रसीली परतों से बना है। हर परत एक पत्ती है।'), L('We eat the thick leaves of the onion plant.', 'हम प्याज़ के पौधे की मोटी पत्तियाँ खाते हैं।'), 'y'),
  P('brinjal', 'Brinjal', 'बैंगन', 'fruit', L('A brinjal is a shiny purple fruit with soft seeds inside.', 'बैंगन एक चमकीला बैंगनी फल है, जिसके अंदर नरम बीज होते हैं।'), L('We eat the fruit of the brinjal plant.', 'हम बैंगन के पौधे का फल खाते हैं।'), 'z'),
  P('okra', 'Okra', 'भिंडी', 'fruit', L('Okra, or lady finger, has five sides and rows of round seeds inside.', 'भिंडी के पाँच किनारे होते हैं और अंदर गोल बीजों की कतारें।'), L('We eat the fruit of the okra plant.', 'हम भिंडी के पौधे का फल खाते हैं।'), 'z', '@okra'),
  P('cauliflower', 'Cauliflower', 'फूलगोभी', 'flower', L('A cauliflower is a big bunch of tiny white flower buds.', 'फूलगोभी छोटी-छोटी सफ़ेद कलियों का बड़ा गुच्छा है।'), L('We eat the flowers of the cauliflower plant.', 'हम फूलगोभी के पौधे के फूल खाते हैं।'), 'x'),
  P('lauki', 'Bottle gourd', 'लौकी', 'fruit', L('A bottle gourd grows on a climbing plant. It is light green and full of water.', 'लौकी एक बेल पर उगती है। यह हल्की हरी होती है और इसमें बहुत पानी होता है।'), L('We eat the fruit of the bottle gourd plant.', 'हम लौकी के पौधे का फल खाते हैं।'), 'z', '@lauki'),
  P('carrot', 'Carrot', 'गाजर', 'root', L('A carrot is a root. It grows down into the soil.', 'गाजर एक जड़ है। यह मिट्टी में नीचे की ओर बढ़ती है।'), L('We eat the root of the carrot plant.', 'हम गाजर के पौधे की जड़ खाते हैं।'), 'z'),
  P('peas', 'Peas', 'मटर', 'seed', L('Peas are seeds. They grow in a row inside a green pod.', 'मटर के दाने बीज हैं। ये हरी फली के अंदर कतार में उगते हैं।'), L('We eat the seeds of the pea plant.', 'हम मटर के पौधे के बीज खाते हैं।'), 'pod', '@peapod'),
  P('cabbage', 'Cabbage', 'पत्तागोभी', 'leaf', L('A cabbage is a tight ball of leaves.', 'पत्तागोभी पत्तियों की कसकर बंधी गेंद है।'), L('We eat the leaves of the cabbage plant.', 'हम पत्तागोभी के पौधे की पत्तियाँ खाते हैं।'), 'y'),
  P('cucumber', 'Cucumber', 'खीरा', 'fruit', L('A cucumber is cool and crunchy, with soft seeds in the middle.', 'खीरा ठंडा और कुरकुरा होता है, बीच में नरम बीज होते हैं।'), L('We eat the fruit of the cucumber plant.', 'हम खीरे के पौधे का फल खाते हैं।'), 'z'),
  P('pumpkin', 'Pumpkin', 'कद्दू', 'fruit', L('A pumpkin is a big fruit with a hollow middle full of seeds.', 'कद्दू एक बड़ा फल है, जिसके खाली बीच में बहुत सारे बीज होते हैं।'), L('We eat the fruit of the pumpkin plant.', 'हम कद्दू के पौधे का फल खाते हैं।'), 'y'),
  P('ginger', 'Ginger', 'अदरक', 'stem', L('Ginger grows under the ground. It is a stem, and it tastes hot!', 'अदरक ज़मीन के नीचे उगता है। यह एक तना है, और इसका स्वाद तीखा है!'), L('We eat the stem of the ginger plant. It grows under the ground.', 'हम अदरक के पौधे का तना खाते हैं। यह ज़मीन के नीचे उगता है।'), 'x'),
];
for (const f of FRUITS) f.why = f.why || L(`We eat the fruit of the ${f.name.en.toLowerCase()} plant.`, `हम ${f.name.hi} के पौधे का फल खाते हैं।`);
for (const f of FRUITS) f.kind = 'fruit'; for (const v of VEG) v.kind = 'veg';

// ------------------------------------------------------------------ Harappan city (NCERT Class 6, Exploring Society: India and Beyond)
// stops of the walk; at: where the camera stands, look: what it looks at (metres, the lane runs along -z)
export const HARAPPA_STOPS = [
  { id: 'lane', at: [0, 1.5, 6], look: [0, 1.3, -6], title: L('A city lane', 'शहर की एक गली'),
    say: L('About 4,500 years ago, people lived in big, planned cities like Mohenjo-daro, Harappa and Dholavira. The streets were straight and met at right angles.',
      'लगभग 4,500 साल पहले लोग मोहनजोदड़ो, हड़प्पा और धोलावीरा जैसे बड़े, योजना से बने शहरों में रहते थे। सड़कें सीधी थीं और एक-दूसरे को समकोण पर काटती थीं।') },
  { id: 'bricks', at: [-1.2, 1.4, 1.2], look: [-2.6, 1.0, 0.2], title: L('Baked bricks', 'पकी हुई ईंटें'),
    say: L('The houses were built with baked bricks. Bricks everywhere had the same shape: as long as four bricks are thick, and twice as wide as they are thick.',
      'घर पकी हुई ईंटों से बने थे। हर जगह ईंटों का आकार एक जैसा था: लंबाई मोटाई की चार गुना, और चौड़ाई मोटाई की दो गुना।') },
  { id: 'drain', at: [0.4, 1.3, -2.2], look: [1.3, 0.0, -4.4], title: L('Covered drains', 'ढकी हुई नालियाँ'),
    say: L('Every lane had a drain covered with bricks. Dirty water from the houses flowed into it, so the city stayed clean.',
      'हर गली में ईंटों से ढकी एक नाली थी। घरों का गंदा पानी उसमें बहता था, इसलिए शहर साफ़ रहता था।') },
  { id: 'well', at: [-0.6, 1.4, -6.2], look: [-2.2, 0.5, -8.2], title: L('A well', 'एक कुआँ'),
    say: L('Many houses had their own well, lined with wedge-shaped bricks. Mohenjo-daro had hundreds of wells.',
      'कई घरों का अपना कुआँ था, जिसकी दीवार पच्चर जैसी ईंटों से बनी थी। मोहनजोदड़ो में सैकड़ों कुएँ थे।') },
  { id: 'finds', at: [0.3, 1.35, -10.4], look: [1.6, 0.85, -11.6], title: L('Things people made', 'लोगों की बनाई चीज़ें'),
    say: L('Here are things found in Harappan cities. Tap one to pick it up and look at it closely.',
      'ये चीज़ें हड़प्पा के शहरों में मिली थीं। किसी एक को छूकर उठाओ और पास से देखो।') },
  { id: 'bath', at: [0, 2.6, -15.5], look: [0, 0.0, -22.5], title: L('The Great Bath', 'विशाल स्नानागार'),
    say: L('The Great Bath at Mohenjo-daro is a big pool made of bricks, with steps at both ends. A layer of natural tar, called bitumen, stopped the water from leaking.',
      'मोहनजोदड़ो का विशाल स्नानागार ईंटों से बना एक बड़ा कुंड है, जिसके दोनों सिरों पर सीढ़ियाँ हैं। बिटुमेन नाम के प्राकृतिक तारकोल की परत से पानी रिसता नहीं था।') },
];
// the things to pick up (model: our model id; '@x' = made here from photos and measurements)
export const ARTEFACTS = [
  { id: 'seal', model: '@seal', size: 0.034, title: L('Seal with a "unicorn"', '"एक सींग वाले पशु" की मुहर'),
    say: L('Seals were small, flat stones carved with an animal and signs. Nobody can read these signs yet. Traders pressed seals into clay to mark their goods.',
      'मुहरें छोटे, चपटे पत्थर थीं, जिन पर एक पशु और कुछ चिह्न खुदे होते थे। इन चिह्नों को अब तक कोई पढ़ नहीं पाया है। व्यापारी अपने सामान पर निशान लगाने के लिए मुहर को गीली मिट्टी पर दबाते थे।') },
  { id: 'pot', model: '@hpot', size: 0.32, title: L('Painted pot', 'रंगा हुआ घड़ा'),
    say: L('Potters made red pots on a wheel and painted them with black designs, like leaves, circles and fish scales.',
      'कुम्हार चाक पर लाल घड़े बनाते थे और उन पर काले रंग से पत्ते, गोले और मछली के छिलके जैसे डिज़ाइन बनाते थे।') },
  { id: 'beads', model: '@beads', size: 0.22, title: L('Carnelian beads', 'कार्नेलियन के मनके'),
    say: L('Bead makers shaped and drilled long beads of red carnelian stone. Harappan beads travelled as far as Mesopotamia.',
      'मनका बनाने वाले लाल कार्नेलियन पत्थर के लंबे मनके घिसकर उनमें छेद करते थे। हड़प्पा के मनके मेसोपोटामिया तक जाते थे।') },
  { id: 'cart', model: 'h_cart', size: 0.17, title: L('Toy cart', 'खिलौना गाड़ी'),
    say: L('Children played with clay toy carts, pulled by bulls, much like the bullock carts we still see today.',
      'बच्चे मिट्टी की खिलौना गाड़ियों से खेलते थे, जिन्हें बैल खींचते थे, बिल्कुल आज की बैलगाड़ी जैसी।') },
  { id: 'weights', model: '@weights', size: 0.14, title: L('Stone weights', 'पत्थर के बाट'),
    say: L('Traders weighed goods with stone cubes. Each weight was double the one before: one, two, four, eight, sixteen.',
      'व्यापारी पत्थर के घनों से सामान तौलते थे। हर बाट पिछले वाले का दोगुना था: एक, दो, चार, आठ, सोलह।') },
  { id: 'bull', model: 'h_bull', size: 0.1, title: L('Clay bull', 'मिट्टी का बैल'),
    say: L('People made animals of baked clay, like this bull. Some were toys.',
      'लोग पकी हुई मिट्टी से इस बैल जैसे जानवर बनाते थे। इनमें से कुछ खिलौने थे।') },
  { id: 'girl', model: '@girl', size: 0.105, title: L('The "dancing girl"', '"नर्तकी" की मूर्ति'),
    say: L('This little bronze statue of a girl wearing many bangles was found at Mohenjo-daro. It is only about ten centimetres tall, smaller than your hand! Today it is in the National Museum in New Delhi.',
      'चूड़ियों से भरी बाँह वाली लड़की की यह छोटी काँसे की मूर्ति मोहनजोदड़ो में मिली थी। यह सिर्फ़ लगभग दस सेंटीमीटर ऊँची है, तुम्हारे हाथ से भी छोटी! आज यह नई दिल्ली के राष्ट्रीय संग्रहालय में है।') },
  { id: 'king', model: '@king', size: 0.175, title: L('The "priest-king"', '"पुरोहित राजा"'),
    say: L('This stone figure of a man wears a shawl with a pattern of trefoils and a band on his forehead. People call him the "priest-king", but nobody knows who he really was.',
      'पत्थर की इस मूर्ति में एक आदमी तिपतिया डिज़ाइन वाली शॉल ओढ़े है और माथे पर एक पट्टी बाँधे है। लोग इसे "पुरोहित राजा" कहते हैं, पर कोई नहीं जानता कि वह असल में कौन था।') },
];

// ------------------------------------------------------------------ museum
// kind: painting (img: early/art/<id>.webp, w: width in metres) or sculpture (model, h: height in metres)
export const MUSEUM = [
  { id: 'varma_papa', kind: 'painting', w: 1.1, title: L('There Comes Papa', 'देखो, पापा आ रहे हैं'), who: L('Raja Ravi Varma, 1893', 'राजा रवि वर्मा, 1893'),
    say: L('Raja Ravi Varma painted this mother and child looking out for papa. He was one of the first Indian artists to paint with oil colours.', 'राजा रवि वर्मा ने यह चित्र बनाया, जिसमें माँ और बच्चा पापा की राह देख रहे हैं। वे तेल रंगों से चित्र बनाने वाले पहले भारतीय कलाकारों में से थे।') },
  { id: 'varma_damayanti', kind: 'painting', w: 1.0, title: L('Hamsa Damayanti', 'हंस और दमयंती'), who: L('Raja Ravi Varma, 1899', 'राजा रवि वर्मा, 1899'),
    say: L('In an old story, a swan carries messages between Princess Damayanti and King Nala. Here the swan talks to Damayanti.', 'एक पुरानी कहानी में एक हंस राजकुमारी दमयंती और राजा नल के बीच संदेश ले जाता है। यहाँ हंस दमयंती से बात कर रहा है।') },
  { id: 'varma_musicians', kind: 'painting', w: 1.4, title: L('Galaxy of Musicians', 'संगीतकारों की टोली'), who: L('Raja Ravi Varma, about 1889', 'राजा रवि वर्मा, लगभग 1889'),
    say: L('Eleven women from different parts of India play music together. Can you find the veena and the tabla?', 'भारत के अलग-अलग हिस्सों की ग्यारह महिलाएँ साथ में संगीत बजा रही हैं। क्या तुम वीणा और तबला ढूँढ सकते हो?') },
  { id: 'ajanta', kind: 'painting', w: 1.2, title: L('From the Ajanta caves', 'अजंता की गुफाओं से'), who: L('Copy of a wall painting, Ajanta, about 1,500 years old', 'अजंता के भित्ति चित्र की नकल, लगभग 1,500 साल पुराना'),
    say: L('The Ajanta caves in Maharashtra have wall paintings about 1,500 years old. Artists copied them so we can see them clearly.', 'महाराष्ट्र की अजंता गुफाओं में लगभग 1,500 साल पुराने भित्ति चित्र हैं। कलाकारों ने उनकी नकल बनाई ताकि हम उन्हें साफ़ देख सकें।') },
  { id: 'bharat_mata', kind: 'painting', w: 0.7, title: L('Bharat Mata', 'भारत माता'), who: L('Abanindranath Tagore, 1905', 'अवनीन्द्रनाथ टैगोर, 1905'),
    say: L('Abanindranath Tagore painted India as a calm mother with four arms, holding a book, rice, cloth and a rosary.', 'अवनीन्द्रनाथ टैगोर ने भारत को चार भुजाओं वाली एक शांत माँ के रूप में बनाया, जो किताब, धान, कपड़ा और माला लिए है।') },
  { id: 'nataraja', kind: 'sculpture', model: 'm_nataraja', h: 1.0, title: L('Shiva Nataraja', 'शिव नटराज'), who: L('Bronze, Tamil Nadu, Chola period, about 1,000 years old', 'काँसा, तमिलनाडु, चोल काल, लगभग 1,000 साल पुराना'),
    say: L('Shiva dances inside a ring of flames. Chola artists in Tamil Nadu made bronzes like this about a thousand years ago.', 'शिव आग की लपटों के घेरे में नाच रहे हैं। तमिलनाडु के चोल कलाकारों ने लगभग हज़ार साल पहले ऐसी काँसे की मूर्तियाँ बनाईं।') },
  { id: 'buddha', kind: 'sculpture', model: 'm_buddha', h: 1.1, title: L('Buddha from Gandhara', 'गांधार के बुद्ध'), who: L('Stone, Gandhara, about 1,800 years old', 'पत्थर, गांधार, लगभग 1,800 साल पुराना'),
    say: L('This calm Buddha was carved in Gandhara, in the north-west of old India. Look at the soft folds of his robe.', 'शांत बुद्ध की यह मूर्ति पुराने भारत के उत्तर-पश्चिम में गांधार में तराशी गई थी। उनके वस्त्र की मुलायम सिलवटें देखो।') },
  { id: 'ganesha', kind: 'sculpture', model: 'm_ganesha', h: 0.8, title: L('Ganesha', 'गणेश'), who: L('Stone, India, about 1,000 years old', 'पत्थर, भारत, लगभग 1,000 साल पुराना'),
    say: L('Ganesha, with the head of an elephant, is loved as the remover of obstacles. This one was carved in stone about a thousand years ago.', 'हाथी के सिर वाले गणेश को विघ्न दूर करने वाला माना जाता है। यह मूर्ति लगभग हज़ार साल पहले पत्थर में तराशी गई।') },
  { id: 'monalisa', kind: 'painting', w: 0.7, title: L('Mona Lisa', 'मोना लिसा'), who: L('Leonardo da Vinci, Italy, about 1503 to 1519', 'लियोनार्डो दा विंची, इटली, लगभग 1503 से 1519'),
    say: L('The Mona Lisa is the most famous painting in the world. Is she smiling? Look at her eyes and her lips.', 'मोना लिसा दुनिया का सबसे प्रसिद्ध चित्र है। क्या वह मुस्कुरा रही है? उसकी आँखें और होंठ देखो।') },
  { id: 'wave', kind: 'painting', w: 1.2, title: L('The Great Wave', 'विशाल लहर'), who: L('Katsushika Hokusai, Japan, about 1831', 'कात्सुशिका होकुसाई, जापान, लगभग 1831'),
    say: L('A huge wave rises over three boats. Can you see the small mountain, Mount Fuji, far away?', 'तीन नावों के ऊपर एक बहुत बड़ी लहर उठ रही है। क्या तुम्हें दूर छोटा सा फ़ूजी पर्वत दिखता है?') },
  { id: 'starry', kind: 'painting', w: 1.2, title: L('The Starry Night', 'तारों भरी रात'), who: L('Vincent van Gogh, 1889', 'विन्सेंट वैन गॉग, 1889'),
    say: L('Van Gogh painted a swirling night sky over a quiet village. The stars look like they are spinning.', 'वैन गॉग ने एक शांत गाँव के ऊपर घूमता हुआ रात का आसमान बनाया। तारे घूमते हुए लगते हैं।') },
  { id: 'jatte', kind: 'painting', w: 1.5, title: L('A Sunday on La Grande Jatte', 'ग्रांड जात द्वीप पर एक रविवार'), who: L('Georges Seurat, 1884 to 1886', 'जॉर्ज सरा, 1884 से 1886'),
    say: L('Seurat painted this park with millions of tiny dots of colour. Stand back, and the dots mix into one picture.', 'सरा ने यह पार्क रंग के लाखों छोटे बिंदुओं से बनाया। थोड़ा पीछे हटकर देखो, बिंदु मिलकर एक चित्र बन जाते हैं।') },
  { id: 'milkmaid', kind: 'painting', w: 0.8, title: L('The Milkmaid', 'दूधवाली'), who: L('Johannes Vermeer, about 1658', 'योहानेस वरमीर, लगभग 1658'),
    say: L('A woman pours milk slowly and carefully. Vermeer loved painting soft light coming through a window.', 'एक औरत धीरे-धीरे, ध्यान से दूध डाल रही है। वरमीर को खिड़की से आती कोमल रोशनी बनाना बहुत पसंद था।') },
  { id: 'venus', kind: 'sculpture', model: 'm_venus', h: 1.6, title: L('Venus de Milo', 'वीनस डी मिलो'), who: L('Marble, Greece, about 2,100 years old (a cast)', 'संगमरमर, यूनान, लगभग 2,100 साल पुरानी (प्रतिकृति)'),
    say: L('This marble statue from ancient Greece lost its arms long ago. Nobody knows what her hands were doing.', 'प्राचीन यूनान की इस संगमरमर की मूर्ति की बाँहें बहुत पहले टूट गईं। कोई नहीं जानता कि उसके हाथ क्या कर रहे थे।') },
  { id: 'discobolus', kind: 'sculpture', model: 'm_discobolus', h: 1.4, title: L('The Discus Thrower', 'चक्का फेंकने वाला'), who: L('After a Greek bronze by Myron, about 2,450 years ago (a cast)', 'मायरन की यूनानी काँसे की मूर्ति के अनुसार, लगभग 2,450 साल पहले (प्रतिकृति)'),
    say: L('An athlete is about to throw a discus. The sculptor caught him in the middle of the movement, like a photograph.', 'एक खिलाड़ी चक्का फेंकने ही वाला है। मूर्तिकार ने उसे हिलते हुए बीच में पकड़ लिया, जैसे एक फ़ोटो।') },
  { id: 'thinker', kind: 'sculpture', model: 'm_thinker', h: 1.2, title: L('The Thinker', 'विचारक'), who: L('Auguste Rodin, France, 1880s', 'ऑगस्त रोदां, फ़्रांस, 1880 के दशक'),
    say: L('A man sits with his chin on his hand, thinking hard. What do you think he is thinking about?', 'एक आदमी हाथ पर ठोड़ी टिकाए गहरी सोच में बैठा है। तुम्हें क्या लगता है, वह क्या सोच रहा है?') },
  { id: 'nefertiti', kind: 'sculpture', model: 'm_nefertiti', h: 0.7, title: L('Queen Nefertiti', 'रानी नेफ़रतीती'), who: L('A copy of a painted bust from Egypt, about 3,350 years old', 'मिस्र की एक रंगी हुई प्रतिमा की नकल, लगभग 3,350 साल पुरानी'),
    say: L('Nefertiti was a queen of ancient Egypt. Her painted bust still shows bright colours after more than three thousand years.', 'नेफ़रतीती प्राचीन मिस्र की रानी थी। तीन हज़ार साल से ज़्यादा बाद भी उसकी प्रतिमा के रंग चमकीले हैं।') },
  { id: 'stego', kind: 'sculpture', model: 'm_stego', h: 0.9, title: L('Stegosaurus', 'स्टेगोसॉरस'), who: L('A dinosaur that lived about 150 million years ago (a model)', 'लगभग 15 करोड़ साल पहले रहने वाला डायनासोर (एक मॉडल)'),
    say: L('Stegosaurus had big plates on its back and spikes on its tail. It ate only plants.', 'स्टेगोसॉरस की पीठ पर बड़ी प्लेटें और पूँछ पर काँटे थे। यह सिर्फ़ पौधे खाता था।') },
];

// ------------------------------------------------------------------ what the app says (instructions, praise)
export const PH = {
  welcome: L('Hello! Tap a picture to start.', 'नमस्ते! शुरू करने के लिए किसी चित्र को छुओ।'),
  abc: L('Tap the letter or the picture to hear it. Then try the letter game!', 'सुनने के लिए अक्षर या चित्र को छुओ। फिर अक्षर वाला खेल खेलो!'),
  varna: L('Tap the letter or the picture to hear it. Then try the letter game!', 'सुनने के लिए अक्षर या चित्र को छुओ। फिर अक्षर वाला खेल खेलो!'),
  findLetter: L('Find the letter', 'अक्षर ढूँढो'),
  numbers: L('Let us count! Watch them drop in, one by one.', 'चलो गिनें! देखो, एक-एक करके आ रहे हैं।'),
  howMany: L('How many?', 'कितने हैं?'),
  add: L('Put them together. How many now?', 'इन्हें मिलाओ। अब कितने हुए?'),
  takeAway: L('Some roll away. How many are left?', 'कुछ लुढ़क गए। कितने बचे?'),
  fruits: L('Tap a fruit to hear its name. Tap the knife to cut it in half.', 'नाम सुनने के लिए फल को छुओ। आधा काटने के लिए चाकू को छुओ।'),
  veg: L('Tap a vegetable to hear its name. Tap the knife to cut it in half.', 'नाम सुनने के लिए सब्ज़ी को छुओ। आधा काटने के लिए चाकू को छुओ।'),
  part: L('Which part of the plant do we eat?', 'हम पौधे का कौन सा भाग खाते हैं?'),
  sort: L('Put each one in the right basket: fruits or vegetables.', 'हर एक को सही टोकरी में रखो: फल या सब्ज़ी।'),
  sortFruit: L('Fruits', 'फल'), sortVeg: L('Vegetables', 'सब्ज़ियाँ'),
  harappa: L('Walk with the joystick, or tap Next to go to the next place.', 'जॉयस्टिक से चलो, या अगली जगह जाने के लिए आगे वाला बटन छुओ।'),
  museum: L('Walk around and tap a painting or a statue to hear its story.', 'घूमो, और किसी चित्र या मूर्ति की कहानी सुनने के लिए उसे छुओ।'),
  good: [L('Well done!', 'शाबाश!'), L('Yes, that is right!', 'हाँ, बिल्कुल सही!'), L('Super!', 'बहुत बढ़िया!')],
  again: [L('Try again!', 'फिर से कोशिश करो!'), L('Not this one. Look again.', 'यह नहीं। फिर से देखो।')],
  allDone: L('You did it! All done.', 'तुमने कर दिखाया! सब हो गया।'),
  vrbox: L('Put the phone in the VR box. Look at something and wait, or press the button, to choose it.', 'फ़ोन को VR बॉक्स में रखो। किसी चीज़ को देखते रहो, या बटन दबाओ, तो वह चुनी जाएगी।'),
  cutDone: L('Look inside!', 'अंदर देखो!'),
  pickUp: L('Turn it around to look at every side.', 'इसे घुमाकर हर तरफ़ से देखो।'),
};
export const UI = {
  home: L('Home', 'होम'), back: L('Back', 'वापस'), next: L('Next', 'आगे'), prev: L('Back', 'पीछे'), listen: L('Listen', 'सुनो'),
  game: L('Letter game', 'अक्षर खेल'), cut: L('Cut', 'काटो'), join: L('Join', 'जोड़ो'), part: L('Which part?', 'कौन सा भाग?'), sort: L('Baskets', 'टोकरी खेल'),
  count: L('Count', 'गिनो'), add: L('Add', 'जोड़ो'), take: L('Take away', 'घटाओ'), vrbox: L('VR box', 'VR बॉक्स'), vr: L('Enter VR', 'VR में जाओ'),
  credits: L('Credits', 'आभार'), loading: L('Getting ready…', 'तैयार हो रहा है…'), stops: L('Places', 'जगहें'), put: L('Put down', 'नीचे रखो'),
  title: L('DUET Little Learners', 'DUET नन्हे सीखने वाले'), tag: L('Letters, numbers, food, history and art, in real 3D', 'अक्षर, गिनती, खाना, इतिहास और कला, असली जैसे 3D में'),
  swar: L('Vowels', 'स्वर'), vyanjan: L('Consonants', 'व्यंजन'), sound: L('Sound', 'आवाज़'), exit: L('Exit', 'बाहर'),
};

// every text that is spoken, as [lang, text] (for the narration generator)
export function allSpeech() {
  const out = []; const add = (o) => { if (!o) return; for (const k of ['en', 'hi']) if (o[k]) out.push([k, o[k]]); };
  for (const s of SECTIONS) add(s.title);
  for (const a of ABC) { add(a.say); add({ hi: a.hi + '।' }); add({ en: a.name.en + '.' }); }
  for (const v of VARNA) { add(v.say); add({ en: v.name.en + '.', hi: v.word + '।' }); }
  for (const n of NUMBERS) { add(n.say); add(n.count); }
  for (const c of COUNT_THINGS) for (let n = 1; n <= 20; n++) add(countLine(n, c));
  for (const f of [...FRUITS, ...VEG]) { add({ en: f.name.en + '.', hi: f.name.hi + '।' }); add(f.fact); add(f.why); }
  for (const p of PARTS) add({ en: p.name.en + '.', hi: p.name.hi + '।' });
  for (const s of HARAPPA_STOPS) { add(s.title); add(s.say); }
  for (const a of ARTEFACTS) { add(a.title); add(a.say); }
  for (const m of MUSEUM) { add(m.title); add(m.say); }
  for (const v of Object.values(PH)) Array.isArray(v) ? v.forEach(add) : add(v);
  for (const a of ABC) add(findLine(a.ch, 'en')); for (const v of VARNA) add(findLine(v.ch, 'hi'));
  for (let a = 1; a < 10; a++) for (let b = 1; a + b <= 10; b++) add(sumLine(a, b, '+'));
  for (let a = 2; a <= 10; a++) for (let b = 1; b < a; b++) add(sumLine(a, b, '-'));
  // an English voice cannot read Devanagari, and a Hindi voice should not read English: such pairs are never played
  const ok = ([l, t]) => (l === 'en' ? !/[\u0900-\u097F]/.test(t) : !/^[\x00-\x7F]+$/.test(t));
  const seen = new Set(); return out.filter(([l, t]) => { const k = l + '|' + t; if (seen.has(k) || !ok([l, t])) return false; seen.add(k); return true; });
}
export const countLine = (n, c) => L(`${EN_N[n][0].toUpperCase() + EN_N[n].slice(1)} ${n === 1 ? c.one.en : c.name.en}.`, `${HI_N[n]} ${n === 1 ? c.one.hi : c.name.hi}।`);
// the letter game's question: English letters in either voice, Hindi letters always in the Hindi voice
export const findLine = (ch, script) => (script === 'hi' ? { hi: `अक्षर ${ch} ढूँढो।` } : L(`Find the letter ${ch}.`, `अक्षर ${HI_NAME[ch]} ढूँढो।`));
export const sumLine = (a, b, op) => op === '+' ? L(`${EN_N[a]} and ${EN_N[b]} make ${EN_N[a + b]}.`.replace(/^./, (c) => c.toUpperCase()), `${HI_N[a]} और ${HI_N[b]}, ${HI_N[a + b]}।`)
  : L(`${EN_N[a]} take away ${EN_N[b]} leaves ${EN_N[a - b]}.`.replace(/^./, (c) => c.toUpperCase()), `${HI_N[a]} में से ${HI_N[b]} गए, ${HI_N[a - b]} बचे।`);
