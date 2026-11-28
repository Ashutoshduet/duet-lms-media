// Hindi and Hinglish text for maths batch 5, keyed by the English sentence (same spoken style as exp_i18n_m4.js).
// Lines that are only maths (numbers and symbols) are not listed: they read the same in every language.
export const DICT_M5 = {
  // ---------------------------------------------------------------- labels
  "No gap, no overlap": { hi: "न कोई जगह खाली, न कोई टाइल ऊपर", hg: "Na koi gap, na koi overlap" },
  "A gap of 36°": { hi: "36° की खाली जगह", hg: "36° ka gap" },
  "Overlap": { hi: "टाइल ऊपर चढ़ गई (overlap)", hg: "Overlap: tile upar chadh gayi" },
  "A full turn": { hi: "पूरा एक चक्कर", hg: "Poora ek chakkar" },
  "Two triangles": { hi: "दो त्रिभुज", hg: "Do triangle" },
  "Regular polygons that tile a floor": { hi: "फ़र्श को ढकने वाले सम बहुभुज", hg: "Floor ko dhakne wale regular polygons" },
  "Angle sum of a quadrilateral": { hi: "चतुर्भुज के कोणों का योग", hg: "Quadrilateral ke angles ka jod" },
  // ---------------------------------------------------------------- Class 7: tiling with regular polygons
  "Which regular polygons tile a floor?": { hi: "कौन-से सम बहुभुज फ़र्श को पूरा ढक सकते हैं?", hg: "Kaun-se regular polygons floor ko poora dhak sakte hain?" },
  "To fit regular tiles round one point, and to find out which regular polygons can cover a floor with no gaps and no overlaps.": {
    hi: "सम बहुभुज (regular polygon) वाली टाइलों को एक बिंदु के चारों ओर लगाना, और पता करना कि कौन-से सम बहुभुज फ़र्श को बिना खाली जगह और बिना एक-दूसरे पर चढ़े पूरा ढक सकते हैं।",
    hg: "Regular polygon wali tiles ko ek point ke chaaron or lagana, aur pata karna ki kaun-se regular polygons floor ko bina gap aur bina overlap ke poora dhak sakte hain." },
  "Tiling with regular polygons": { hi: "सम बहुभुजों से टाइलिंग", hg: "Regular polygons se tiling" },
  "Take equal equilateral triangles. Fit them round a point P, corner to corner, until the space round P is filled.": {
    hi: "एक जैसे समबाहु त्रिभुज (equilateral triangle) लीजिए। उन्हें बिंदु P के चारों ओर, कोने से कोना मिलाकर लगाइए, जब तक P के चारों ओर की जगह भर न जाए।",
    hg: "Ek jaise equilateral triangles lo. Unhe point P ke chaaron or, kone se kona milakar lagao, jab tak P ke chaaron or ki jagah bhar na jaaye." },
  "Exactly 6 triangles fit round P, with no gap and no overlap.": {
    hi: "P के चारों ओर ठीक 6 त्रिभुज आ जाते हैं, न कोई जगह खाली रहती है, न कोई त्रिभुज दूसरे पर चढ़ता है।",
    hg: "P ke chaaron or theek 6 triangle aa jaate hain, na koi gap rehta hai, na koi overlap hota hai." },
  "Each corner of an equilateral triangle is 60°, and 6 × 60° = 360°, a full turn round the point.": {
    hi: "समबाहु त्रिभुज का हर कोण 60° होता है, और 6 × 60° = 360°, यानी बिंदु के चारों ओर पूरा एक चक्कर।",
    hg: "Equilateral triangle ka har angle 60° hota hai, aur 6 × 60° = 360°, yaani point ke chaaron or poora ek chakkar." },
  "Take the triangles away. Now fit equal squares round P.": {
    hi: "त्रिभुज हटा दीजिए। अब एक जैसे वर्ग (square) P के चारों ओर लगाइए।",
    hg: "Triangles hata do. Ab ek jaise squares P ke chaaron or lagao." },
  "4 squares fit exactly round P, like the tiles of a floor.": {
    hi: "P के चारों ओर ठीक 4 वर्ग आ जाते हैं, बिल्कुल फ़र्श की टाइलों की तरह।",
    hg: "P ke chaaron or theek 4 squares aa jaate hain, bilkul floor ki tiles ki tarah." },
  "Each corner of a square is 90°, and 4 × 90° = 360°.": {
    hi: "वर्ग का हर कोण 90° होता है, और 4 × 90° = 360°।",
    hg: "Square ka har angle 90° hota hai, aur 4 × 90° = 360°." },
  "Take the squares away. Now fit regular hexagons round P.": {
    hi: "वर्ग हटा दीजिए। अब सम षट्भुज (regular hexagon) P के चारों ओर लगाइए।",
    hg: "Squares hata do. Ab regular hexagons P ke chaaron or lagao." },
  "3 hexagons fit exactly round P. This is the pattern of a honeycomb.": {
    hi: "P के चारों ओर ठीक 3 षट्भुज आ जाते हैं। मधुमक्खी के छत्ते में यही पैटर्न होता है।",
    hg: "P ke chaaron or theek 3 hexagon aa jaate hain. Madhumakkhi ke chhatte mein yahi pattern hota hai." },
  "Each corner of a regular hexagon is 120°, and 3 × 120° = 360°.": {
    hi: "सम षट्भुज का हर कोण 120° होता है, और 3 × 120° = 360°।",
    hg: "Regular hexagon ka har angle 120° hota hai, aur 3 × 120° = 360°." },
  "Take the hexagons away. Now try regular pentagons round P.": {
    hi: "षट्भुज हटा दीजिए। अब सम पंचभुज (regular pentagon) P के चारों ओर लगाकर देखिए।",
    hg: "Hexagons hata do. Ab regular pentagons P ke chaaron or lagakar dekho." },
  "After 3 pentagons, a gap of 36° is left at P. The gap is too small for another pentagon.": {
    hi: "3 पंचभुज लगाने के बाद P पर 36° की जगह खाली रह जाती है। यह जगह एक और पंचभुज के लिए बहुत छोटी है।",
    hg: "3 pentagon lagane ke baad P par 36° ka gap reh jaata hai. Yeh gap ek aur pentagon ke liye bahut chhota hai." },
  "Each corner of a regular pentagon is 108°. 3 × 108° = 324° is less than 360°, and 4 × 108° = 432° is more than 360°.": {
    hi: "सम पंचभुज का हर कोण 108° होता है। 3 × 108° = 324°, जो 360° से कम है, और 4 × 108° = 432°, जो 360° से ज़्यादा है।",
    hg: "Regular pentagon ka har angle 108° hota hai. 3 × 108° = 324°, jo 360° se kam hai, aur 4 × 108° = 432°, jo 360° se zyada hai." },
  "Push a fourth pentagon into the gap.": {
    hi: "चौथा पंचभुज उस खाली जगह में लगाकर देखिए।",
    hg: "Chautha pentagon us gap mein lagakar dekho." },
  "The fourth pentagon lies over the first one. Regular pentagons cannot cover a floor without gaps or overlaps.": {
    hi: "चौथा पंचभुज पहले वाले के ऊपर चढ़ जाता है। सम पंचभुज फ़र्श को बिना खाली जगह या बिना एक-दूसरे पर चढ़े नहीं ढक सकते।",
    hg: "Chautha pentagon pehle wale ke upar chadh jaata hai. Regular pentagons floor ko bina gap ya bina overlap ke nahi dhak sakte." },
  "A regular polygon can tile a floor only if its corner angle divides 360° exactly. Among regular polygons, only the triangle, the square and the hexagon do this.": {
    hi: "कोई सम बहुभुज फ़र्श को तभी ढक सकता है जब उसका कोण 360° को पूरा-पूरा बाँट दे। सम बहुभुजों में ऐसा सिर्फ़ त्रिभुज, वर्ग और षट्भुज करते हैं।",
    hg: "Koi regular polygon floor ko tabhi dhak sakta hai jab uska angle 360° ko poora-poora divide kar de. Regular polygons mein aisa sirf triangle, square aur hexagon karte hain." },
  "6 equilateral triangles, 4 squares and 3 regular hexagons each filled the space round a point exactly. 3 regular pentagons left a gap of 36°, and a fourth one overlapped.": {
    hi: "6 समबाहु त्रिभुज, 4 वर्ग और 3 सम षट्भुज, हर बार एक बिंदु के चारों ओर की जगह ठीक-ठीक भर गए। 3 सम पंचभुजों से 36° की जगह खाली रही, और चौथा पंचभुज ऊपर चढ़ गया।",
    hg: "6 equilateral triangles, 4 squares aur 3 regular hexagons, har baar ek point ke chaaron or ki jagah theek-theek bhar gaye. 3 regular pentagons se 36° ka gap reh gaya, aur chautha pentagon overlap ho gaya." },
  "Copies of a regular polygon tile a floor only when its corner angle divides 360° exactly. So only equilateral triangles, squares and regular hexagons can tile a floor by themselves.": {
    hi: "एक ही सम बहुभुज की टाइलें फ़र्श को तभी ढकती हैं जब उसका कोण 360° को पूरा-पूरा बाँट दे। इसलिए अकेले सिर्फ़ समबाहु त्रिभुज, वर्ग और सम षट्भुज ही फ़र्श को ढक सकते हैं (टाइलिंग)।",
    hg: "Ek hi regular polygon ki tiles floor ko tabhi dhakti hain jab uska angle 360° ko poora-poora divide kar de. Isliye akele sirf equilateral triangle, square aur regular hexagon hi floor ki tiling kar sakte hain." },
  "If you cut the tiles from card, use scissors with rounded tips and cut away from your hand.": {
    hi: "अगर टाइलें गत्ते से काट रहे हैं, तो गोल नोक वाली कैंची लीजिए और हाथ से दूर की तरफ़ काटिए।",
    hg: "Agar tiles gatte se kaat rahe ho, to gol nok wali kainchi lo aur haath se door ki taraf kaato." },
  "Why can regular octagons not tile a floor by themselves?": {
    hi: "अकेले सम अष्टभुज (regular octagon) फ़र्श को क्यों नहीं ढक सकते?",
    hg: "Akele regular octagons floor ko kyon nahi dhak sakte?" },
  "Each corner of a regular octagon is 135°. 2 × 135° = 270° is less than 360° and 3 × 135° = 405° is more, so they leave gaps or overlap.": {
    hi: "सम अष्टभुज का हर कोण 135° होता है। 2 × 135° = 270°, जो 360° से कम है, और 3 × 135° = 405°, जो ज़्यादा है। इसलिए या तो जगह खाली रहती है या टाइलें ऊपर चढ़ती हैं।",
    hg: "Regular octagon ka har angle 135° hota hai. 2 × 135° = 270°, jo 360° se kam hai, aur 3 × 135° = 405°, jo zyada hai. Isliye ya to gap rehta hai ya overlap hota hai." },
  "Why do bees build hexagonal cells?": { hi: "मधुमक्खियाँ षट्भुज आकार के खाने क्यों बनाती हैं?", hg: "Madhumakkhiyan hexagon shape ke khaane kyon banati hain?" },
  "Hexagons fit together with no gaps, and they hold the most honey for the wax used to make the walls.": {
    hi: "षट्भुज बिना खाली जगह के आपस में जुड़ जाते हैं, और दीवारों में लगे मोम के हिसाब से इनमें सबसे ज़्यादा शहद आता है।",
    hg: "Hexagons bina gap ke aapas mein jud jaate hain, aur deewaron mein lage wax ke hisaab se inme sabse zyada shahad aata hai." },
  "Where do you see square and hexagonal tilings around you?": { hi: "अपने आस-पास आप वर्ग और षट्भुज वाली टाइलिंग कहाँ देखते हैं?", hg: "Apne aas-paas aap square aur hexagon wali tiling kahan dekhte ho?" },
  "In floor tiles, paving blocks, a chessboard and a honeycomb.": { hi: "फ़र्श की टाइलों में, सड़क के पेविंग ब्लॉक में, शतरंज की बिसात में और मधुमक्खी के छत्ते में।", hg: "Floor ki tiles mein, sadak ke paving blocks mein, chessboard mein aur madhumakkhi ke chhatte mein." },
  // ---------------------------------------------------------------- Class 8: angle sum of a quadrilateral
  "Angle sum of a quadrilateral by tearing its corners": { hi: "कोने फाड़कर चतुर्भुज के कोणों का योग", hg: "Kone faadkar quadrilateral ke angles ka jod" },
  "To tear off the four corners of a paper quadrilateral and put them together round one point, and to see that the angles of a quadrilateral add up to 360°.": {
    hi: "काग़ज़ के चतुर्भुज (quadrilateral) के चारों कोने फाड़कर उन्हें एक बिंदु के चारों ओर मिलाना, और देखना कि चतुर्भुज के कोणों का योग 360° होता है।",
    hg: "Kaagaz ke quadrilateral ke chaaron kone faadkar unhe ek point ke chaaron or milana, aur dekhna ki quadrilateral ke angles ka jod 360° hota hai." },
  "Angles of a quadrilateral": { hi: "चतुर्भुज के कोण", hg: "Quadrilateral ke angles" },
  "Draw a quadrilateral ABCD on a sheet of paper, cut it out, and colour its four corners in four colours.": {
    hi: "काग़ज़ पर एक चतुर्भुज ABCD बनाइए, उसे काटकर निकालिए, और उसके चारों कोनों को चार अलग रंगों से रंगिए।",
    hg: "Kaagaz par ek quadrilateral ABCD banao, use kaatkar nikalo, aur uske chaaron kono ko chaar alag rangon se rango." },
  "The quadrilateral has four corners, A, B, C and D, each in a different colour.": {
    hi: "चतुर्भुज के चार कोने हैं, A, B, C और D, और हर कोना अलग रंग का है।",
    hg: "Quadrilateral ke chaar kone hain, A, B, C aur D, aur har kona alag rang ka hai." },
  "Measure each angle with a protractor and add the four angles.": {
    hi: "चाँदे (protractor) से हर कोण नापिए और चारों कोणों को जोड़िए।",
    hg: "Protractor se har angle naapo aur chaaron angles ko jodo." },
  "The angles are 70°, 105°, 95° and 90°. Together they make 360°.": {
    hi: "कोण 70°, 105°, 95° और 90° हैं। इन सबका योग 360° है।",
    hg: "Angles 70°, 105°, 95° aur 90° hain. In sabka jod 360° hai." },
  "Tear off the four coloured corners.": { hi: "चारों रंगीन कोनों को फाड़कर अलग कीजिए।", hg: "Chaaron rangeen kono ko faadkar alag karo." },
  "Four coloured corner pieces come off, and each one keeps its angle.": {
    hi: "चार रंगीन टुकड़े अलग हो जाते हैं, और हर टुकड़े में उसका कोण वैसा ही रहता है।",
    hg: "Chaar rangeen tukde alag ho jaate hain, aur har tukde mein uska angle waisa hi rehta hai." },
  "Place the four corners at a point P, one beside the other, so that their tips meet at P and their edges touch.": {
    hi: "चारों कोनों को एक बिंदु P पर एक-दूसरे के बगल में रखिए, ताकि सबकी नोक P पर मिले और उनके किनारे आपस में सटे रहें।",
    hg: "Chaaron kono ko ek point P par ek-doosre ke bagal mein rakho, taaki sabki nok P par mile aur unke kinaare aapas mein sate rahein." },
  "The four corners fill the whole space round P with no gap and no overlap: a full turn of 360°.": {
    hi: "चारों कोने P के चारों ओर की पूरी जगह भर देते हैं, न कोई जगह खाली, न कोई टुकड़ा ऊपर: पूरा एक चक्कर, यानी 360°।",
    hg: "Chaaron kone P ke chaaron or ki poori jagah bhar dete hain, na koi gap, na koi overlap: poora ek chakkar, yaani 360°." },
  "The angles round a point add up to 360°. Since the four corners fill a full turn exactly, the angles of the quadrilateral add up to 360°.": {
    hi: "एक बिंदु के चारों ओर के कोणों का योग 360° होता है। चारों कोने पूरा चक्कर ठीक-ठीक भर देते हैं, इसलिए चतुर्भुज के कोणों का योग 360° है।",
    hg: "Ek point ke chaaron or ke angles ka jod 360° hota hai. Chaaron kone poora chakkar theek-theek bhar dete hain, isliye quadrilateral ke angles ka jod 360° hai." },
  "Draw the diagonal AC on what is left of the quadrilateral.": {
    hi: "चतुर्भुज के बचे हुए हिस्से पर विकर्ण (diagonal) AC खींचिए।",
    hg: "Quadrilateral ke bache hue hisse par diagonal AC kheencho." },
  "The diagonal AC splits the quadrilateral into two triangles, ABC and ACD.": {
    hi: "विकर्ण AC चतुर्भुज को दो त्रिभुजों, ABC और ACD, में बाँट देता है।",
    hg: "Diagonal AC quadrilateral ko do triangles, ABC aur ACD, mein baant deta hai." },
  "The angles of each triangle add up to 180°, and together the angles of the two triangles make up the four angles of the quadrilateral: 180° + 180° = 360°.": {
    hi: "हर त्रिभुज के कोणों का योग 180° होता है, और दोनों त्रिभुजों के कोण मिलकर चतुर्भुज के चारों कोण बनाते हैं: 180° + 180° = 360°।",
    hg: "Har triangle ke angles ka jod 180° hota hai, aur dono triangles ke angles milkar quadrilateral ke chaaron angles banate hain: 180° + 180° = 360°." },
  "The angles of ABCD were 70°, 105°, 95° and 90°. The four torn corners, placed round P, filled a full turn with no gap and no overlap.": {
    hi: "ABCD के कोण 70°, 105°, 95° और 90° थे। फाड़े गए चारों कोनों ने P के चारों ओर बिना खाली जगह और बिना ऊपर चढ़े पूरा एक चक्कर भर दिया।",
    hg: "ABCD ke angles 70°, 105°, 95° aur 90° the. Faade gaye chaaron kono ne P ke chaaron or bina gap aur bina overlap ke poora ek chakkar bhar diya." },
  "The four angles of any quadrilateral add up to 360°, because a diagonal splits it into two triangles, each with an angle sum of 180°.": {
    hi: "किसी भी चतुर्भुज के चारों कोणों का योग 360° होता है, क्योंकि एक विकर्ण उसे दो त्रिभुजों में बाँट देता है, और हर त्रिभुज के कोणों का योग 180° होता है।",
    hg: "Kisi bhi quadrilateral ke chaaron angles ka jod 360° hota hai, kyonki ek diagonal use do triangles mein baant deta hai, aur har triangle ke angles ka jod 180° hota hai." },
  "Use scissors with rounded tips and keep your fingers away from the blades.": {
    hi: "गोल नोक वाली कैंची इस्तेमाल कीजिए और उँगलियाँ ब्लेड से दूर रखिए।",
    hg: "Gol nok wali kainchi use karo aur ungliyan blade se door rakho." },
  "Three angles of a quadrilateral are 80°, 100° and 120°. Find the fourth angle.": {
    hi: "किसी चतुर्भुज के तीन कोण 80°, 100° और 120° हैं। चौथा कोण निकालिए।",
    hg: "Kisi quadrilateral ke teen angles 80°, 100° aur 120° hain. Chautha angle nikalo." },
  "Can a quadrilateral have all four angles of 100°?": { hi: "क्या किसी चतुर्भुज के चारों कोण 100° के हो सकते हैं?", hg: "Kya kisi quadrilateral ke chaaron angles 100° ke ho sakte hain?" },
  "No, because 4 × 100° = 400°, which is more than 360°.": { hi: "नहीं, क्योंकि 4 × 100° = 400°, जो 360° से ज़्यादा है।", hg: "Nahi, kyonki 4 × 100° = 400°, jo 360° se zyada hai." },
  "What is the angle sum of a pentagon?": { hi: "पंचभुज (pentagon) के कोणों का योग कितना होता है?", hg: "Pentagon ke angles ka jod kitna hota hai?" },
  "Diagonals from one corner split a pentagon into 3 triangles, so its angles add up to 3 × 180° = 540°.": {
    hi: "एक कोने से खींचे गए विकर्ण पंचभुज को 3 त्रिभुजों में बाँट देते हैं, इसलिए इसके कोणों का योग 3 × 180° = 540° होता है।",
    hg: "Ek kone se kheenche gaye diagonals pentagon ko 3 triangles mein baant dete hain, isliye iske angles ka jod 3 × 180° = 540° hota hai." },
};
