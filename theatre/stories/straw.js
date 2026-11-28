// Kyun? 1 · Why does a straw look bent in water? (refraction) · NCERT Class 10 Ch 9 (Light), Class 8 light
export default {
  id: 'straw', subject: 'physics', classes: [8, 10],
  q: { en: 'Why does a straw look bent in water?', hi: 'पानी में स्ट्रॉ मुड़ी हुई क्यों दिखती है?', hg: 'Paani mein straw mudi hui kyun dikhti hai?' },
  chapter: { en: 'Class 10 · Ch 9 Light – Reflection and Refraction', hi: 'कक्षा 10 · अध्याय 9 प्रकाश – परावर्तन तथा अपवर्तन', hg: 'Class 10 · Ch 9 Light – Reflection aur Refraction' },
  links: [{ app: 'science', exp: 'p10_coin_bowl', title: { en: 'The coin that reappears: refraction at water', hi: 'फिर से दिखने वाला सिक्का: पानी में अपवर्तन', hg: 'Wapas dikhne wala sikka: paani mein refraction' } },
    { app: 'science', exp: 'pw10_coin_bucket', title: { en: 'A coin in a bucket seems to rise', hi: 'बाल्टी में सिक्का ऊपर उठा हुआ दिखता है', hg: 'Balti mein sikka upar utha hua dikhta hai' } }],
  place: 'courtyard', thumb: [3, 0.7],
  async build(K) {
    const { THREE } = K; const { glassOfWater, straw, caustics, eye } = K.parts;
    await K.setPlace('courtyard');
    const set = await K.model('models/outdoor_table.glb', { lambert: true });
    set.rotation.y = Math.PI / 2; K.add(set);
    const TY = K.surfaceY(set, 0, 0);
    const blobT = K.blob(0.5); blobT.position.set(0, 0.003, 0); blobT.scale.set(1.25, 1, 0.8);
    // the glass on the table, the sunlight it focuses, its soft shadow
    const G = glassOfWater(K, { r: 0.036, h: 0.12, level: 0.7, opacity: 0.22, color: 0x86c6d8 }); G.group.position.set(0, TY, 0);
    const cau = caustics(K, 0.2); cau.position.set(0.07, TY + 0.0015, 0.035);
    const gb = K.blob(0.05); gb.position.set(0.012, TY + 0.001, 0.008);
    const WY = TY + G.waterY;
    // the straw: one piece above the water and one below; the part below sits in "seen" (the picture the light makes)
    const S = straw(K, 0.21); const tilt = THREE.MathUtils.degToRad(24), base = new THREE.Vector3(-0.017, TY + 0.0105, 0.004);
    const sw = (WY - base.y) / Math.cos(tilt); // length of straw under the water
    const up = new THREE.Mesh(new THREE.CylinderGeometry(S.r, S.r, S.len - sw, 20, 8, true).translate(0, sw + (S.len - sw) / 2, 0), S.mat);
    const lo = new THREE.Mesh(new THREE.CylinderGeometry(S.r, S.r, sw, 20, 8, true).translate(0, sw / 2, 0), S.mat);
    const strawUp = K.group(); strawUp.position.copy(base); strawUp.rotation.z = -tilt; strawUp.add(up);
    const seen = K.group(); seen.position.set(0, WY, 0); // scaled about the glass's axis and the water line
    const loHold = new THREE.Group(); loHold.position.copy(base).sub(seen.position); loHold.rotation.z = -tilt; loHold.add(lo); seen.add(loHold);
    // where the straw really is (shown later, as a see-through ghost)
    const ghost = new THREE.Mesh(lo.geometry, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35, depthWrite: false, toneMapped: false })); const gh = K.group(); gh.position.copy(base); gh.rotation.z = -tilt; gh.add(ghost); gh.visible = false;
    const cross = new THREE.Vector3(base.x + Math.sin(tilt) * sw, WY, base.z);
    const lSeen = K.label({ en: 'what we see', hi: 'जो दिखता है', hg: 'jo dikhta hai' }, { size: 0.012, bg: 'rgba(240,166,90,0.92)', color: '#1b1206' }); lSeen.position.set(-0.07, TY + 0.03, 0.04); lSeen.visible = false;
    const lReal = K.label({ en: 'where it really is', hi: 'असल में कहाँ है', hg: 'asal mein kahan hai' }, { size: 0.012 }); lReal.position.set(0.07, TY + 0.025, 0.04); lReal.visible = false;

    // ---------------- the zoom bubble: light from the straw's tip, through the water, into the air, to the eye
    const M = K.micro; K.microBg(0x0c1626);
    const dia = new THREE.Group(); M.add(dia);
    const air = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 1.4), new THREE.MeshBasicMaterial({ color: 0x1c3550 })); air.position.set(0, 0.7, -0.4); dia.add(air);
    const wat = new THREE.Mesh(new THREE.BoxGeometry(3.4, 1.2, 0.6), new THREE.MeshStandardMaterial({ color: 0x2a86c8, roughness: 0.25, transparent: true, opacity: 0.72, depthWrite: false })); wat.position.y = -0.6; dia.add(wat);
    const surf = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.014, 0.62), new THREE.MeshBasicMaterial({ color: 0xcfeeff, toneMapped: false })); dia.add(surf);
    const tipP = new THREE.Vector3(-0.55, -0.62, 0), S0 = new THREE.Vector3(-0.2, 0, 0);
    const dw = S0.clone().sub(tipP).normalize(); const sinA = Math.min(0.99, 1.33 * dw.x); const da = new THREE.Vector3(sinA, Math.sqrt(1 - sinA * sinA), 0);
    const E = S0.clone().addScaledVector(da, 0.74);
    const st2 = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.9, 20, 1).translate(0, -0.45, 0), S.mat); st2.position.copy(tipP); st2.rotation.z = Math.PI - 0.42; dia.add(st2);
    const r1 = K.ray([tipP.toArray(), S0.toArray()], { r: 0.02, color: 0xffd35a }, dia); r1.userData.grow = 0;
    const r2 = K.ray([S0.toArray(), E.toArray()], { r: 0.02, color: 0xffd35a }, dia); r2.userData.grow = 0;
    const nrm = K.dashed([S0.x, -0.45, 0.05], [S0.x, 0.55, 0.05], { dash: 0.05, gap: 0.035, opacity: 0.75 }, dia); nrm.visible = false;
    const back = S0.clone().addScaledVector(da, -0.6); const ext = K.dashed(S0.toArray(), back.toArray(), { color: 0xffd28a, dash: 0.05, gap: 0.03 }, dia); ext.visible = false;
    const ghostTip = K.glow(0xffe0a0, 0.36, dia); ghostTip.position.copy(back); ghostTip.visible = false;
    const realTip = K.glow(0xff7a4a, 0.3, dia); realTip.position.copy(tipP);
    const ey = eye(K, 0.4, dia); ey.position.copy(E).add(new THREE.Vector3(0.12, 0.06, 0.1));
    const lAir = K.label({ en: 'air', hi: 'हवा', hg: 'hawa' }, { size: 0.13, bg: null }, dia); lAir.position.set(-1.1, 0.25, 0.3);
    const lWat = K.label({ en: 'water', hi: 'पानी', hg: 'paani' }, { size: 0.13, bg: null }, dia); lWat.position.set(-1.05, -0.24, 0.32);
    const lBend = K.label({ en: 'light bends here', hi: 'रोशनी यहाँ मुड़ती है', hg: 'roshni yahan mudti hai' }, { size: 0.13, bg: 'rgba(240,166,90,0.95)', color: '#1b1206' }, dia); lBend.position.set(0.62, -0.16, 0.3); lBend.visible = false;
    const lSeen2 = K.label({ en: 'seen here', hi: 'यहाँ दिखती है', hg: 'yahan dikhti hai' }, { size: 0.12, bg: 'rgba(255,224,160,0.95)', color: '#1b1206' }, dia); lSeen2.position.copy(back).add(new THREE.Vector3(-0.42, 0.1, 0.3)); lSeen2.visible = false;
    const lReal3 = K.label({ en: 'really here', hi: 'असल में यहाँ', hg: 'asal mein yahan' }, { size: 0.12 }, dia); lReal3.position.copy(tipP).add(new THREE.Vector3(-0.42, -0.14, 0.3)); lReal3.visible = false;
    // a pond: the bottom looks higher than it is
    const pond = new THREE.Group(); pond.visible = false; M.add(pond);
    const pAir = air.clone(); pond.add(pAir);
    const pw = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.86, 0.6), wat.material); pw.position.y = -0.43; pond.add(pw);
    const bed = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.16, 0.6), new THREE.MeshStandardMaterial({ color: 0xb8945e, roughness: 0.9 })); bed.position.y = -0.94; pond.add(bed);
    for (let i = 0; i < 9; i++) { const pb = new THREE.Mesh(new THREE.SphereGeometry(0.05 + (i % 3) * 0.02, 12, 8), new THREE.MeshStandardMaterial({ color: [0x8a7a68, 0x6f6658, 0xa39280][i % 3], roughness: 0.8 })); pb.scale.y = 0.6; pb.position.set(-1.3 + i * 0.33, -0.85, 0.1 + (i % 2) * 0.1); pond.add(pb); }
    const s2 = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.014, 0.62), surf.material); pond.add(s2);
    K.dashed([-1.5, -0.6, 0.32], [1.5, -0.6, 0.32], { color: 0xffd28a, dash: 0.07, gap: 0.045 }, pond);
    const lDeep = K.label({ en: 'looks this deep', hi: 'इतना गहरा दिखता है', hg: 'itna gehra dikhta hai' }, { size: 0.12, bg: 'rgba(255,224,160,0.95)', color: '#1b1206' }, pond); lDeep.position.set(0.55, -0.48, 0.35);
    const lReal2 = K.label({ en: 'really this deep', hi: 'असल में इतना गहरा', hg: 'asal mein itna gehra' }, { size: 0.12 }, pond); lReal2.position.set(0.55, -0.74, 0.4);
    const ey2 = eye(K, 0.4, pond); ey2.position.set(-0.9, 0.55, 0.2);
    K.mcam.position.set(0, -0.05, 2.75); K.mcam.lookAt(0, -0.05, 0);

    return { TY, WY, set, G, cau, strawUp, seen, loHold, gh, ghost, cross, lSeen, lReal, dia, r1, r2, nrm, ext, ghostTip, lBend, lSeen2, lReal3, pond };
  },
  cam0: (o) => ({ p: [0.05, o.TY + 0.5, 1.25], at: [0, o.TY + 0.05, 0], fov: 45 }),
  beats: [
    { say: { en: 'Why does a straw look bent in water?', hi: 'पानी में स्ट्रॉ मुड़ी हुई क्यों दिखती है?', hg: 'Paani mein straw mudi hui kyun dikhti hai?' }, hold: 0.6,
      cam: (o) => ({ p: [0.09, o.TY + 0.24, 0.6], at: [0.02, o.TY + 0.06, 0], fov: 42, len: 1 }),
      do: (o, K) => lay(o, K, 0) },
    { say: { en: 'Put a straight straw in a glass of water. Look from the side. At the surface of the water, it seems to break and bend.', hi: 'एक सीधी स्ट्रॉ को पानी के गिलास में रखो। बगल से देखो। पानी की सतह पर वह टूटी और मुड़ी हुई लगती है।', hg: 'Ek seedhi straw ko paani ke glass mein rakho. Bagal se dekho. Paani ki satah par woh tooti aur mudi hui lagti hai.' },
      cam: (o) => ({ p: [0.0, o.TY + 0.118, 0.3], at: [0, o.TY + 0.072, 0], fov: 38, len: 0.5 }),
      do: (o, K) => [...hold(o, K, [-0.03, o.TY + 0.17, 0.004], -0.42, 0.04, 0.22), ...hold(o, K, [-0.017, o.TY + 0.0105, 0.004], -0.42, 0.28, 0.2), K.scale(o.seen, BENT, 0.42, 0.14)] },
    { say: { en: 'Take it out, and it is perfectly straight. So the straw did not bend. Something happened to the light.', hi: 'बाहर निकालो, तो वह बिल्कुल सीधी है। यानी स्ट्रॉ नहीं मुड़ी। रोशनी के साथ कुछ हुआ।', hg: 'Bahar nikalo, to woh bilkul seedhi hai. Yaani straw nahi mudi. Roshni ke saath kuch hua.' },
      cam: (o) => ({ p: [0.02, o.TY + 0.15, 0.38], at: [0, o.TY + 0.1, 0], fov: 40, len: 0.4 }),
      do: (o, K) => [K.scale(o.seen, [1, 1, 1], 0.04, 0.1), ...hold(o, K, [-0.017, o.TY + 0.135, 0.004], -0.42, 0.05, 0.25),
        ...hold(o, K, [-0.017, o.TY + 0.0105, 0.004], -0.42, 0.74, 0.2), K.scale(o.seen, BENT, 0.88, 0.1)] },
    { say: { en: 'We see a thing when light from it reaches our eyes. Light from the lower part of the straw travels up through the water, and then into the air.', hi: 'हम किसी चीज़ को तब देखते हैं जब उससे आई रोशनी हमारी आँखों तक पहुँचती है। स्ट्रॉ के निचले हिस्से की रोशनी पहले पानी में ऊपर आती है, फिर हवा में निकलती है।', hg: 'Hum kisi cheez ko tab dekhte hain jab usse aayi roshni hamari aankhon tak pahunchti hai. Straw ke nichle hisse ki roshni pehle paani mein upar aati hai, phir hawa mein nikalti hai.' },
      cam: (o) => ({ p: [0.1, o.TY + 0.11, 0.36], at: [0.02, o.TY + 0.07, 0], fov: 40, len: 0.5 }),
      do: (o, K) => [K.bubble({ focus: o.cross.toArray(), side: 'right', size: 0.24, off: 0.2, label: { en: 'inside the glass, up close', hi: 'गिलास के अंदर, पास से', hg: 'glass ke andar, paas se' } }, 0.08, 0.1),
        K.val(o.r1.userData, 'grow', 1, 0.45, 0.3)] },
    { say: { en: 'Light goes slower in water than in air. So when it crosses from water into air at a slant, it changes direction. This bending of light is called refraction.', hi: 'रोशनी पानी में हवा से धीमी चलती है। इसलिए जब वह तिरछी होकर पानी से हवा में जाती है, तो अपनी दिशा बदल लेती है। रोशनी के इस मुड़ने को अपवर्तन, यानी रिफ़्रैक्शन, कहते हैं।', hg: 'Roshni paani mein hawa se dheemi chalti hai. Isliye jab woh tirchhi hokar paani se hawa mein jaati hai, to apni disha badal leti hai. Roshni ke is mudne ko refraction kehte hain.' },
      cam: (o) => ({ p: [0.12, o.TY + 0.105, 0.34], at: [0.02, o.TY + 0.07, 0], fov: 40, orbit: 6 }),
      do: (o, K) => [K.show(o.nrm, 0.2), K.val(o.r2.userData, 'grow', 1, 0.3, 0.3), K.show(o.lBend, 0.6)] },
    { say: { en: 'Look closely. Our eyes think light always travels in a straight line, so they trace it back along a straight line.', hi: 'ध्यान से देखो। हमारी आँखें मानती हैं कि रोशनी हमेशा सीधी चलती है, इसलिए वे उसे सीधी रेखा में पीछे की ओर देखती हैं।', hg: 'Dhyaan se dekho. Hamari aankhein maanti hain ki roshni hamesha seedhi chalti hai, isliye woh use seedhi rekha mein peeche ki or dekhti hain.' },
      do: (o, K) => [K.hide(o.lBend, 0), K.show(o.ext, 0.3), K.pop(o.ghostTip, 0.55, 0.1)] },
    { say: { en: 'That line points to a place a little higher than the real straw. So the part under the water looks raised, and the straw looks bent.', hi: 'वह रेखा असली स्ट्रॉ से थोड़ी ऊपर की जगह दिखाती है। इसलिए पानी के अंदर वाला हिस्सा ऊपर उठा हुआ दिखता है, और स्ट्रॉ मुड़ी हुई लगती है।', hg: 'Woh rekha asli straw se thodi upar ki jagah dikhati hai. Isliye paani ke andar wala hissa upar utha hua dikhta hai, aur straw mudi hui lagti hai.' },
      cam: (o) => ({ p: [-0.02, o.TY + 0.1, 0.27], at: [0, o.TY + 0.055, 0], fov: 40, len: 0.5 }),
      do: (o, K) => [K.show(o.lSeen2, 0.05), K.show(o.lReal3, 0.15), K.show(o.gh, 0.35), K.show(o.lSeen, 0.45), K.show(o.lReal, 0.55)] },
    { say: { en: 'The same thing makes a pond look shallower than it really is. So be careful before you step into water!', hi: 'इसी वजह से तालाब असल से कम गहरा दिखता है। इसलिए पानी में उतरने से पहले सावधान रहो!', hg: 'Isi wajah se taalaab asal se kam gehra dikhta hai. Isliye paani mein utarne se pehle saavdhaan raho!' },
      cam: (o) => ({ p: [0.05, o.TY + 0.32, 0.36], at: [0, o.TY + 0.03, 0], fov: 42, len: 0.6 }),
      do: (o, K) => [K.hide(o.lSeen, 0), K.hide(o.lReal, 0), K.hide(o.gh, 0), K.hide(o.dia, 0.12), K.show(o.pond, 0.12),
        K.bubble({ focus: o.cross.toArray(), side: 'right', size: 0.24, off: 0.2, label: { en: 'a pond, seen from the side', hi: 'तालाब, बगल से', hg: 'taalaab, bagal se' } }, 0.1, 0)] },
    { say: { en: 'Now try it yourself: make a hidden coin appear in a bowl of water.', hi: 'अब खुद करके देखो: पानी के कटोरे में छिपा सिक्का दिखाओ।', hg: 'Ab khud karke dekho: paani ke katore mein chhipa sikka dikhao.' }, hold: 0.8,
      cam: (o) => ({ p: [0.5, o.TY + 0.32, 0.78], at: [0, o.TY + 0.07, 0], fov: 40, len: 0.7, orbit: -14 }),
      do: (o, K) => [K.bubble(false, 0, 0.15)] },
  ],
};
// the straw's two halves move together: the part above the water, and the part below (inside "seen")
const BENT = [1.45, 0.74, 1.45];
function hold(o, K, base, rz, at, len) {
  const lo = [base[0], base[1] - o.WY, base[2]];
  return [K.move(o.strawUp, base, at, len), K.move(o.loHold, lo, at, len), K.turn(o.strawUp, [0, 0, rz], at, len), K.turn(o.loHold, [0, 0, rz], at, len)];
}
// lying on the table beside the glass
function lay(o, K, at) { return hold(o, K, [0.045, o.TY + 0.0036, 0.07], -Math.PI / 2, at, 0); }
