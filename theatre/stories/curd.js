// Kyun? · Why does milk turn into curd?
export default {
  id: "curd", subject: "biology", classes: [8],
  q: { en: "Why does milk turn into curd?", hi: "दूध दही में कैसे बदल जाता है?", hg: "Doodh dahi mein kaise badal jaata hai?" },
  chapter: { en: "Class 8 · Ch 2 The Invisible Living World", hi: "कक्षा 8 · अध्याय 2 सूक्ष्मजीवों का अदृश्य संसार", hg: "Class 8 · Ch 2 The Invisible Living World" },
  links: [{ app: "science", exp: "bw8_curd", title: { en: "Setting curd: what do the bacteria need?", hi: "दही जमाना: बैक्टीरिया को क्या चाहिए?", hg: "Dahi jamaana: bacteria ko kya chahiye?" } },
    { app: "science", exp: "bio8_curd_bacteria", title: { en: "Bacteria in curd under the microscope", hi: "माइक्रोस्कोप में दही के बैक्टीरिया", hg: "Microscope mein dahi ke bacteria" } }],
  async build(K) { await K.setPlace('courtyard'); return {}; },
  cam0: { p: [0, 1.4, 2], at: [0, 1, 0], fov: 50 },
  beats: [
    { say: { en: "Why does milk turn into curd?", hi: "दूध दही में कैसे बदल जाता है?", hg: "Doodh dahi mein kaise badal jaata hai?" } },
    { say: { en: "In the evening, warm some milk until it is just lukewarm. Then stir in one spoon of curd.", hi: "शाम को थोड़ा दूध गरम करो, जब तक वह बस गुनगुना न हो जाए। फिर उसमें एक चम्मच दही मिला दो।", hg: "Shaam ko thoda doodh garam karo, jab tak woh bas gunguna na ho jaaye. Phir usmein ek chammach dahi mila do." } },
    { say: { en: "Cover it, and keep it in a warm place overnight. By morning, the runny milk has become thick, sour curd. What happened?", hi: "उसे ढककर रात भर किसी गरम जगह रख दो। सुबह तक पतला दूध गाढ़ा, खट्टा दही बन जाता है। क्या हुआ?", hg: "Use dhakkar raat bhar kisi garam jagah rakh do. Subah tak patla doodh gaadha, khatta dahi ban jaata hai. Kya hua?" } },
    { say: { en: "That spoon of curd was full of living things, too small to see. They are bacteria, called Lactobacillus.", hi: "दही के उस चम्मच में ऐसे जीव भरे थे, जो इतने छोटे हैं कि आँख से दिखते नहीं। ये बैक्टीरिया हैं, जिन्हें लैक्टोबैसिलस कहते हैं।", hg: "Dahi ke us chammach mein aise jeev bhare the, jo itne chhote hain ki aankh se dikhte nahi. Yeh bacteria hain, jinhe Lactobacillus kehte hain." } },
    { say: { en: "In the warm milk, they feed on milk sugar, called lactose, and multiply fast. One becomes two, and two become four.", hi: "गुनगुने दूध में वे दूध की शक्कर खाते हैं, जिसे लैक्टोज़ कहते हैं, और तेज़ी से बढ़ते हैं। एक से दो, और दो से चार।", hg: "Gungune doodh mein woh doodh ki shakkar khaate hain, jise lactose kehte hain, aur tezi se badhte hain. Ek se do, aur do se chaar." } },
    { say: { en: "As they feed, they make lactic acid. That is what makes curd taste sour.", hi: "खाते हुए वे लैक्टिक अम्ल बनाते हैं। इसी से दही खट्टा लगता है।", hg: "Khaate hue woh lactic acid banate hain. Isi se dahi khatta lagta hai." } },
    { say: { en: "The acid makes the milk proteins clump together into a soft net. The net traps the water, so the milk sets into thick curd.", hi: "यह अम्ल दूध के प्रोटीन को आपस में जोड़कर एक मुलायम जाल बना देता है। जाल पानी को पकड़ लेता है, और दूध जमकर गाढ़ा दही बन जाता है।", hg: "Yeh acid doodh ke protein ko aapas mein jodkar ek mulaayam jaal bana deta hai. Jaal paani ko pakad leta hai, aur doodh jamkar gaadha dahi ban jaata hai." } },
    { say: { en: "Why lukewarm milk? The bacteria work best when it is warm. In a cold fridge they slow down, and in very hot milk they die.", hi: "गुनगुना दूध क्यों? बैक्टीरिया गर्माहट में सबसे अच्छा काम करते हैं। ठंडे फ़्रिज में वे धीमे पड़ जाते हैं, और बहुत गरम दूध में मर जाते हैं।", hg: "Gunguna doodh kyun? Bacteria garmaahat mein sabse achha kaam karte hain. Thande fridge mein woh dheeme pad jaate hain, aur bahut garam doodh mein mar jaate hain." } },
    { say: { en: "Now try it yourself: set curd and find out what the bacteria need.", hi: "अब खुद करके देखो: दही जमाओ और पता करो कि बैक्टीरिया को क्या चाहिए।", hg: "Ab khud karke dekho: dahi jamaao aur pata karo ki bacteria ko kya chahiye." } },
  ],
};
