// Hindi and Hinglish text for maths batch 9, keyed by the English sentence (same spoken style as exp_i18n_m8.js).
// Lines that are only maths (numbers and symbols) are not listed: they read the same in every language.
// The scissors safety line is already in exp_i18n_m3.js.
export const DICT_M9 = {
  // ---------------------------------------------------------------- labels
  "A twin of ABC?": { hi: "ABC का जुड़वाँ?", hg: "ABC ka judwaan?" },
  "Does not fit!": { hi: "फ़िट नहीं होता!", hg: "Fit nahin hota!" },
  "Fits exactly": { hi: "बिलकुल फ़िट होता है", hg: "Bilkul fit hota hai" },
  "Bigger: not a twin": { hi: "बड़ा है: जुड़वाँ नहीं", hg: "Bada hai: judwaan nahin" },
  "5 columns": { hi: "5 कॉलम", hg: "5 columns" },
  "Each column: 8 cubes": { hi: "हर कॉलम: 8 क्यूब", hg: "Har column: 8 cubes" },
  "A rectangle": { hi: "एक आयत (rectangle)", hg: "Ek rectangle" },
  "Congruent triangles": { hi: "सर्वांगसम त्रिभुज (congruent triangles)", hg: "Congruent triangles (sarvangsam tribhuj)" },
  "Sum of the first n terms of an AP": { hi: "AP के पहले n पदों का योग", hg: "AP ke pehle n terms ka sum" },
  // ---------------------------------------------------------------- Class 7: twin triangles
  "Three paper triangles to compare": { hi: "तुलना के लिए काग़ज़ के तीन त्रिभुज", hg: "Compare karne ke liye kaagaz ke teen triangles" },
  "Twin triangles: placing one triangle on another": { hi: "जुड़वाँ त्रिभुज: एक त्रिभुज को दूसरे पर रखना", hg: "Judwaan triangles: ek triangle ko doosre par rakhna" },
  "To find out which paper triangles are exact copies (congruent) of triangle ABC by placing one on the other, and to see that equal sides make twin triangles.": {
    hi: "एक त्रिभुज को दूसरे पर रखकर पता करना कि कौन-से काग़ज़ के त्रिभुज, त्रिभुज ABC की हूबहू कॉपी (सर्वांगसम, congruent) हैं, और यह देखना कि बराबर भुजाएँ जुड़वाँ त्रिभुज बनाती हैं।",
    hg: "Ek triangle ko doosre par rakh kar pata karna ki kaun-se kaagaz ke triangles, triangle ABC ki hoobahoo copy (congruent) hain, aur yeh dekhna ki barabar sides judwaan triangles banaati hain." },
  "Congruence by superposition": { hi: "एक को दूसरे पर रखकर सर्वांगसमता (superposition)", hg: "Superposition se congruence" },
  "Look at the three paper triangles ABC, PQR and XYZ.": {
    hi: "काग़ज़ के तीन त्रिभुज ABC, PQR और XYZ देखिए।",
    hg: "Kaagaz ke teen triangles ABC, PQR aur XYZ dekho." },
  "PQR is turned a different way, and XYZ looks bigger. Which of them is an exact copy of ABC?": {
    hi: "PQR दूसरी तरफ़ घूमा हुआ है, और XYZ बड़ा दिखता है। इनमें से कौन-सा ABC की हूबहू कॉपी है?",
    hg: "PQR doosri taraf ghooma hua hai, aur XYZ bada dikhta hai. Inmein se kaun-sa ABC ki hoobahoo copy hai?" },
  "Measure the three sides of each triangle with a ruler.": {
    hi: "स्केल (ruler) से हर त्रिभुज की तीनों भुजाएँ नापिए।",
    hg: "Ruler se har triangle ki teenon sides naapo." },
  "ABC and PQR both have sides of 6 cm, 5 cm and 4 cm. The sides of XYZ are longer: 9 cm, 7.5 cm and 6 cm.": {
    hi: "ABC और PQR, दोनों की भुजाएँ 6 cm, 5 cm और 4 cm हैं। XYZ की भुजाएँ लंबी हैं: 9 cm, 7.5 cm और 6 cm।",
    hg: "ABC aur PQR, dono ki sides 6 cm, 5 cm aur 4 cm hain. XYZ ki sides lambi hain: 9 cm, 7.5 cm aur 6 cm." },
  "Lift triangle PQR, turn it and lay it on triangle ABC.": {
    hi: "त्रिभुज PQR को उठाइए, घुमाइए और त्रिभुज ABC पर रखिए।",
    hg: "Triangle PQR ko uthao, ghumao aur triangle ABC par rakho." },
  "However we turn it, PQR does not cover ABC. Its corners stick out on the wrong sides.": {
    hi: "हम इसे कैसे भी घुमाएँ, PQR, ABC को पूरा नहीं ढकता। इसके कोने ग़लत तरफ़ बाहर निकलते हैं।",
    hg: "Hum ise kaise bhi ghumaayein, PQR, ABC ko poora nahin dhakta. Iske kone galat taraf baahar nikalte hain." },
  "PQR is lying the other side up. It is a mirror image of ABC on the table.": {
    hi: "PQR उल्टी तरफ़ से रखा है। मेज़ पर यह ABC का दर्पण प्रतिबिंब (mirror image) है।",
    hg: "PQR ulti taraf se rakha hai. Table par yeh ABC ka mirror image hai." },
  "Now flip PQR over, and lay it on ABC again.": {
    hi: "अब PQR को पलटिए, और फिर से ABC पर रखिए।",
    hg: "Ab PQR ko palto, aur phir se ABC par rakho." },
  "Now PQR covers ABC exactly. P lies on A, Q on B and R on C. The two triangles are twins: they are congruent.": {
    hi: "अब PQR, ABC को बिलकुल ठीक ढक लेता है। P, A पर है, Q, B पर और R, C पर। दोनों त्रिभुज जुड़वाँ हैं: ये सर्वांगसम (congruent) हैं।",
    hg: "Ab PQR, ABC ko bilkul theek dhak leta hai. P, A par hai, Q, B par aur R, C par. Dono triangles judwaan hain: yeh congruent hain." },
  "Turning or flipping a shape does not change its sides or its angles, so it is still the same shape.": {
    hi: "किसी आकृति को घुमाने या पलटने से उसकी भुजाएँ और कोण नहीं बदलते, इसलिए वह वही आकृति रहती है।",
    hg: "Kisi shape ko ghumaane ya palatne se uski sides aur angles nahin badalte, isliye woh wahi shape rehti hai." },
  "Put PQR back. Lay ABC on XYZ, with corner A on corner X.": {
    hi: "PQR को वापस रखिए। ABC को XYZ पर रखिए, कोना A, कोने X पर।",
    hg: "PQR ko wapas rakho. ABC ko XYZ par rakho, kona A, kone X par." },
  "The corners of ABC fit the corners of XYZ, so the angles are the same. But XYZ sticks out all round: it is bigger, so it is not a twin.": {
    hi: "ABC के कोने XYZ के कोनों में फ़िट होते हैं, इसलिए कोण बराबर हैं। पर XYZ चारों ओर बाहर निकलता है: यह बड़ा है, इसलिए जुड़वाँ नहीं है।",
    hg: "ABC ke kone XYZ ke konon mein fit hote hain, isliye angles barabar hain. Par XYZ chaaron or baahar nikalta hai: yeh bada hai, isliye judwaan nahin hai." },
  "Write down the twins with their matching corners.": {
    hi: "जुड़वाँ त्रिभुजों को उनके मिलते हुए कोनों के साथ लिखिए।",
    hg: "Judwaan triangles ko unke milte hue konon ke saath likho." },
  "Triangle ABC is congruent to triangle PQR. We write the matching corners in the same order.": {
    hi: "त्रिभुज ABC, त्रिभुज PQR के सर्वांगसम है। मिलते हुए कोनों को हम एक ही क्रम में लिखते हैं।",
    hg: "Triangle ABC, triangle PQR ke congruent hai. Milte hue konon ko hum ek hi order mein likhte hain." },
  "If the three sides of one triangle are equal to the three sides of another, the two triangles are congruent. This is the SSS condition.": {
    hi: "अगर एक त्रिभुज की तीनों भुजाएँ दूसरे त्रिभुज की तीनों भुजाओं के बराबर हों, तो दोनों त्रिभुज सर्वांगसम होते हैं। यह SSS शर्त (भुजा-भुजा-भुजा) है।",
    hg: "Agar ek triangle ki teenon sides doosre triangle ki teenon sides ke barabar hon, toh dono triangles congruent hote hain. Yeh SSS condition (side-side-side) hai." },
  "PQR covered ABC exactly only after it was flipped over. XYZ had the same angles as ABC but was bigger.": {
    hi: "PQR ने ABC को पलटने के बाद ही बिलकुल ठीक ढका। XYZ के कोण ABC जैसे थे, पर वह बड़ा था।",
    hg: "PQR ne ABC ko palatne ke baad hi bilkul theek dhaka. XYZ ke angles ABC jaise the, par woh bada tha." },
  "Two figures are congruent when one can be placed exactly on the other, even if we have to turn or flip it. Triangles with three equal sides are congruent, but triangles with only equal angles need not be.": {
    hi: "दो आकृतियाँ सर्वांगसम होती हैं जब एक को दूसरी पर बिलकुल ठीक रखा जा सके, चाहे उसे घुमाना या पलटना पड़े। तीनों भुजाएँ बराबर वाले त्रिभुज सर्वांगसम होते हैं, पर सिर्फ़ बराबर कोणों वाले त्रिभुज ज़रूरी नहीं।",
    hg: "Do shapes congruent hoti hain jab ek ko doosri par bilkul theek rakha ja sake, chahe use ghumaana ya palatna pade. Teenon sides barabar waale triangles congruent hote hain, par sirf barabar angles waale triangles zaroori nahin." },
  "What does congruent mean?": { hi: "सर्वांगसम (congruent) का क्या मतलब है?", hg: "Congruent ka kya matlab hai?" },
  "Exactly the same shape and size, so that one figure can be placed on the other and cover it exactly.": {
    hi: "बिलकुल एक जैसा आकार और माप, जिससे एक आकृति को दूसरी पर रखें तो वह उसे पूरा ढक ले।",
    hg: "Bilkul ek jaisa shape aur size, jisse ek shape ko doosri par rakhein toh woh use poora dhak le." },
  "Are two triangles with the same three angles always congruent?": {
    hi: "क्या तीनों कोण बराबर वाले दो त्रिभुज हमेशा सर्वांगसम होते हैं?",
    hg: "Kya teenon angles barabar waale do triangles hamesha congruent hote hain?" },
  "No. One can be a bigger copy of the other, like XYZ and ABC.": {
    hi: "नहीं। एक, दूसरे की बड़ी कॉपी हो सकता है, जैसे XYZ और ABC।",
    hg: "Nahin. Ek, doosre ki badi copy ho sakta hai, jaise XYZ aur ABC." },
  "If ΔABC ≅ ΔPQR, which side is equal to BC?": {
    hi: "अगर ΔABC ≅ ΔPQR, तो कौन-सी भुजा BC के बराबर है?",
    hg: "Agar ΔABC ≅ ΔPQR, toh kaun-si side BC ke barabar hai?" },
  "QR, because B matches Q and C matches R.": {
    hi: "QR, क्योंकि B, Q से मिलता है और C, R से।",
    hg: "QR, kyonki B, Q se milta hai aur C, R se." },
  // ---------------------------------------------------------------- Class 10: sum of an AP
  "Unit cubes for two staircases": { hi: "दो सीढ़ियों के लिए इकाई घन", hg: "Do seedhiyon ke liye unit cubes" },
  "Sum of an AP with two staircases of cubes": { hi: "क्यूब की दो सीढ़ियों से AP का योग", hg: "Cubes ki do seedhiyon se AP ka sum" },
  "To find the sum of the first n terms of an AP by fitting two equal staircases of unit cubes into a rectangle.": {
    hi: "इकाई घनों (unit cubes) की दो बराबर सीढ़ियों को जोड़कर आयत बनाना, और इससे AP के पहले n पदों का योग निकालना।",
    hg: "Unit cubes ki do barabar seedhiyon ko jod kar rectangle banaana, aur isse AP ke pehle n terms ka sum nikaalna." },
  "Make columns of 2, 3, 4, 5 and 6 unit cubes, side by side. Each column has 1 cube more than the one before.": {
    hi: "पास-पास 2, 3, 4, 5 और 6 इकाई घनों के कॉलम बनाइए। हर कॉलम में पिछले कॉलम से 1 क्यूब ज़्यादा है।",
    hg: "Paas-paas 2, 3, 4, 5 aur 6 unit cubes ke columns banao. Har column mein pichhle column se 1 cube zyaada hai." },
  "The columns make a staircase. The numbers of cubes, 2, 3, 4, 5, 6, are the first 5 terms of an AP with first term 2 and common difference 1.": {
    hi: "कॉलम एक सीढ़ी बनाते हैं। क्यूब की संख्याएँ 2, 3, 4, 5, 6 एक AP के पहले 5 पद हैं, जिसका पहला पद 2 और सार्व अंतर (common difference) 1 है।",
    hg: "Columns ek seedhi banaate hain. Cubes ki sankhyaayein 2, 3, 4, 5, 6 ek AP ke pehle 5 terms hain, jiska pehla term 2 aur common difference 1 hai." },
  "We want the total number of cubes. Make a second staircase, just the same, with blue cubes.": {
    hi: "हमें कुल क्यूब की संख्या चाहिए। नीले क्यूब से बिलकुल वैसी ही दूसरी सीढ़ी बनाइए।",
    hg: "Humein total cubes ki sankhya chahiye. Neele cubes se bilkul waisi hi doosri seedhi banao." },
  "Both staircases have the same number of cubes: the sum of the first 5 terms.": {
    hi: "दोनों सीढ़ियों में क्यूब की संख्या बराबर है: पहले 5 पदों का योग।",
    hg: "Dono seedhiyon mein cubes ki sankhya barabar hai: pehle 5 terms ka sum." },
  "Turn the blue staircase half round, and fit it on the first one.": {
    hi: "नीली सीढ़ी को आधा चक्कर घुमाइए, और पहली सीढ़ी पर फ़िट कीजिए।",
    hg: "Neeli seedhi ko aadha chakkar ghumao, aur pehli seedhi par fit karo." },
  "The two staircases fit together exactly and make a rectangle.": {
    hi: "दोनों सीढ़ियाँ बिलकुल ठीक जुड़ जाती हैं और एक आयत (rectangle) बनाती हैं।",
    hg: "Dono seedhiyan bilkul theek jud jaati hain aur ek rectangle banaati hain." },
  "Where one staircase is short, the turned one is tall, so every column is filled to the same height.": {
    hi: "जहाँ एक सीढ़ी छोटी है, वहाँ घुमाई हुई सीढ़ी लंबी है, इसलिए हर कॉलम एक ही ऊँचाई तक भर जाता है।",
    hg: "Jahaan ek seedhi chhoti hai, wahaan ghumaai hui seedhi lambi hai, isliye har column ek hi oonchaai tak bhar jaata hai." },
  "Count the cubes in each column of the rectangle.": {
    hi: "आयत के हर कॉलम में क्यूब गिनिए।",
    hg: "Rectangle ke har column mein cubes gino." },
  "Every column has 8 cubes: the first term 2 plus the last term 6. The rectangle has 5 columns, so 5 × 8 = 40 cubes.": {
    hi: "हर कॉलम में 8 क्यूब हैं: पहला पद 2 और अंतिम पद 6 का जोड़। आयत में 5 कॉलम हैं, इसलिए 5 × 8 = 40 क्यूब।",
    hg: "Har column mein 8 cubes hain: pehla term 2 aur last term 6 ka jod. Rectangle mein 5 columns hain, isliye 5 × 8 = 40 cubes." },
  "Take half of the rectangle to find the sum.": {
    hi: "योग निकालने के लिए आयत का आधा लीजिए।",
    hg: "Sum nikaalne ke liye rectangle ka aadha lo." },
  "One staircase is half of the rectangle, so 2 + 3 + 4 + 5 + 6 = 20.": {
    hi: "एक सीढ़ी आयत का आधा है, इसलिए 2 + 3 + 4 + 5 + 6 = 20।",
    hg: "Ek seedhi rectangle ka aadha hai, isliye 2 + 3 + 4 + 5 + 6 = 20." },
  "Write the formula for the sum of the first n terms.": {
    hi: "पहले n पदों के योग का सूत्र (formula) लिखिए।",
    hg: "Pehle n terms ke sum ka formula likho." },
  "For n terms, the rectangle has n columns, each of height first term plus last term, that is 2a + (n − 1)d. The sum is half of it.": {
    hi: "n पदों के लिए आयत में n कॉलम होते हैं, हर एक की ऊँचाई पहला पद और अंतिम पद का जोड़, यानी 2a + (n − 1)d। योग इसका आधा है।",
    hg: "n terms ke liye rectangle mein n columns hote hain, har ek ki oonchaai pehla term aur last term ka jod, yaani 2a + (n − 1)d. Sum iska aadha hai." },
  "The two staircases made a rectangle of 5 columns with 8 cubes in each, 40 cubes in all.": {
    hi: "दोनों सीढ़ियों ने 5 कॉलम का आयत बनाया, हर कॉलम में 8 क्यूब, कुल 40 क्यूब।",
    hg: "Dono seedhiyon ne 5 columns ka rectangle banaaya, har column mein 8 cubes, total 40 cubes." },
  "The sum of the first n terms of an AP is half of n × (2a + (n − 1)d), that is, half of n × (the first term + the last term). Here 2 + 3 + 4 + 5 + 6 = 20.": {
    hi: "AP के पहले n पदों का योग, n × (2a + (n − 1)d) का आधा है, यानी n × (पहला पद + अंतिम पद) का आधा। यहाँ 2 + 3 + 4 + 5 + 6 = 20।",
    hg: "AP ke pehle n terms ka sum, n × (2a + (n − 1)d) ka aadha hai, yaani n × (pehla term + last term) ka aadha. Yahaan 2 + 3 + 4 + 5 + 6 = 20." },
  "Keep the cubes on the tray so that they do not fall and get lost.": {
    hi: "क्यूब ट्रे पर ही रखिए ताकि वे गिरकर खो न जाएँ।",
    hg: "Cubes tray par hi rakho taaki woh gir kar kho na jaayein." },
  "Find the sum 1 + 2 + 3 + … + 10 with the same idea.": {
    hi: "इसी तरीके से योग 1 + 2 + 3 + … + 10 निकालिए।",
    hg: "Isi tareeke se sum 1 + 2 + 3 + … + 10 nikaalo." },
  "Two staircases make 10 columns of 11 cubes, 110 cubes. Half of it is 55.": {
    hi: "दो सीढ़ियाँ 11-11 क्यूब के 10 कॉलम बनाती हैं, यानी 110 क्यूब। इसका आधा 55 है।",
    hg: "Do seedhiyan 11-11 cubes ke 10 columns banaati hain, yaani 110 cubes. Iska aadha 55 hai." },
  "Why does every column of the rectangle have the same height?": {
    hi: "आयत के हर कॉलम की ऊँचाई बराबर क्यों है?",
    hg: "Rectangle ke har column ki oonchaai barabar kyon hai?" },
  "Because one staircase goes up by d in each column and the turned one goes down by d, so their total stays the same.": {
    hi: "क्योंकि एक सीढ़ी हर कॉलम में d बढ़ती है और घुमाई हुई सीढ़ी d घटती है, इसलिए उनका जोड़ वही रहता है।",
    hg: "Kyonki ek seedhi har column mein d badhti hai aur ghumaai hui seedhi d ghat-ti hai, isliye unka jod wahi rehta hai." },
  "Write the sum using the first term a and the last term l.": {
    hi: "पहले पद a और अंतिम पद l से योग लिखिए।",
    hg: "Pehle term a aur last term l se sum likho." },
};
