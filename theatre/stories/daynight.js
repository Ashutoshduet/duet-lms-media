// Kyun? · Why do we have day and night?
export default {
  id: "daynight", subject: "space", classes: [6, 7],
  q: { en: "Why do we have day and night?", hi: "दिन और रात क्यों होते हैं?", hg: "Din aur raat kyun hote hain?" },
  chapter: { en: "Class 7 · Ch 12 Earth, Moon, and the Sun", hi: "कक्षा 7 · अध्याय 12 पृथ्वी, चंद्रमा और सूर्य", hg: "Class 7 · Ch 12 Earth, Moon aur Sun" },
  links: [{ app: "science", exp: "p7_globe", title: { en: "Day and night on a globe", hi: "ग्लोब पर दिन और रात", hg: "Globe par din aur raat" } },
    { app: "space", go: "planets", hash: "earth", title: { en: "The Earth in the Solar System lab", hi: "सौरमंडल लैब में पृथ्वी", hg: "Solar System lab mein Earth" } }],
  async build(K) { await K.setPlace('courtyard'); return {}; },
  cam0: { p: [0, 1.4, 2], at: [0, 1, 0], fov: 50 },
  beats: [
    { say: { en: "Why do we have day and night?", hi: "दिन और रात क्यों होते हैं?", hg: "Din aur raat kyun hote hain?" } },
    { say: { en: "Every morning the Sun seems to rise in the east, and every evening it seems to set in the west. But the Sun is not going around us.", hi: "हर सुबह सूरज पूरब में उगता हुआ लगता है, और हर शाम पश्चिम में डूबता हुआ। लेकिन सूरज हमारे चारों ओर नहीं घूम रहा।", hg: "Har subah suraj poorab mein ugta hua lagta hai, aur har shaam paschim mein doobta hua. Lekin suraj hamare chaaron or nahi ghoom raha." } },
    { say: { en: "The Earth is a huge ball, and it spins like a top. It turns from west to east, once in about twenty four hours.", hi: "पृथ्वी एक विशाल गेंद है, और वह लट्टू की तरह घूमती है। वह पश्चिम से पूरब की ओर, लगभग चौबीस घंटे में एक चक्कर पूरा करती है।", hg: "Prithvi ek vishaal gend hai, aur woh lattu ki tarah ghoomti hai. Woh paschim se poorab ki or, lagbhag chaubees ghante mein ek chakkar poora karti hai." } },
    { say: { en: "The Sun can light up only one half of the ball at a time. On that half, it is day.", hi: "सूरज एक समय में गेंद का सिर्फ़ आधा हिस्सा रोशन कर सकता है। उस आधे हिस्से पर दिन होता है।", hg: "Suraj ek samay mein gend ka sirf aadha hissa roshan kar sakta hai. Us aadhe hisse par din hota hai." } },
    { say: { en: "The other half faces away from the Sun, into dark space. There, it is night.", hi: "दूसरा आधा हिस्सा सूरज से उल्टी ओर, अंधेरे अंतरिक्ष की तरफ़ होता है। वहाँ रात होती है।", hg: "Doosra aadha hissa suraj se ulti or, andhere antariksh ki taraf hota hai. Wahan raat hoti hai." } },
    { say: { en: "Watch India. As the Earth turns, India moves into the sunlight. That is sunrise. Later it turns away from the Sun. That is sunset.", hi: "भारत को देखो। पृथ्वी घूमती है, तो भारत धूप में आ जाता है। वही सूर्योदय है। बाद में वह सूरज से दूर घूम जाता है। वही सूर्यास्त है।", hg: "Bharat ko dekho. Prithvi ghoomti hai, to Bharat dhoop mein aa jaata hai. Wahi suryoday hai. Baad mein woh suraj se door ghoom jaata hai. Wahi suryast hai." } },
    { say: { en: "At night, city lights shine on the dark side. At that very moment, it is daytime in America, on the other side of the Earth.", hi: "रात में, अंधेरे हिस्से पर शहरों की बत्तियाँ चमकती हैं। ठीक उसी समय, पृथ्वी की दूसरी ओर, अमेरिका में दिन होता है।", hg: "Raat mein, andhere hisse par shehron ki battiyan chamakti hain. Theek usi samay, prithvi ki doosri or, America mein din hota hai." } },
    { say: { en: "So day and night happen because the Earth spins on its axis. This spinning is called rotation.", hi: "तो दिन और रात इसलिए होते हैं क्योंकि पृथ्वी अपनी धुरी पर घूमती है। इस घूमने को घूर्णन कहते हैं।", hg: "To din aur raat isliye hote hain kyunki prithvi apni dhuri par ghoomti hai. Is ghoomne ko rotation kehte hain." } },
    { say: { en: "Now try it yourself: make day and night with a globe and a torch.", hi: "अब खुद करके देखो: ग्लोब और टॉर्च से दिन और रात बनाओ।", hg: "Ab khud karke dekho: globe aur torch se din aur raat banao." } },
  ],
};
