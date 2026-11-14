"""Science Lab narration with Piper (offline). python3 gen.py <worker> <workers>. Files are named by a hash of the text,
so an existing file is never redone."""
import json, os, subprocess, tempfile, wave, time, sys
from piper import PiperVoice, SynthesisConfig
W, N = int(sys.argv[1]), int(sys.argv[2])
HERE = os.path.dirname(os.path.abspath(__file__)); REPO = os.path.abspath(os.path.join(HERE, '..', '..'))
OUT = os.path.join(REPO, 'science', 'voice')
VOICES = os.environ.get('DUET_VOICES', os.path.expanduser('~/duet-voices'))
jobs = json.load(open(os.path.join(HERE, 'jobs.json')))
todo = [j for j in jobs if not os.path.exists(f"{OUT}/{j['lang']}/{j['key']}.mp3")][W::N]
V = {'en': PiperVoice.load(os.path.join(VOICES, 'en_US-ljspeech-high.onnx')), 'hi': PiperVoice.load(os.path.join(VOICES, 'hi_IN-priyamvada-medium.onnx'))}
cfg = {'en': SynthesisConfig(length_scale=1.06), 'hi': SynthesisConfig(length_scale=1.08)}
# words the voices say badly: spell them for speech only (the screen text is unchanged)
FIX = {'en': [('pH', 'P H'), ('mL', 'millilitres'), ('°C', 'degrees Celsius'), ('→', 'gives'), ('·', ','), ('—', ','), ('NaOH', 'sodium hydroxide'), ('HCl', 'H C L'), ('CO₂', 'C O 2'), ('KMnO₄', 'potassium permanganate'), ('CuSO₄·5H₂O', 'copper sulphate penta-hydrate'), ('CuSO₄', 'copper sulphate'), ('NH₄Cl', 'ammonium chloride'), ('H₂', 'hydrogen')],
       'hi': [('pH', 'पी एच'), ('mL', 'मिलीलीटर'), ('°C', 'डिग्री सेल्सियस'), ('→', 'से'), ('·', ','), ('—', ','), ('CO₂', 'सी ओ टू'), ('CuSO₄·5H₂O', 'कॉपर सल्फेट पेंटाहाइड्रेट'), ('CuSO₄', 'कॉपर सल्फेट'), ('NaOH', 'सोडियम हाइड्रॉक्साइड'), ('HCl', 'एच सी एल'), ('KMnO₄', 'पोटैशियम परमैंगनेट'), ('NH₄Cl', 'अमोनियम क्लोराइड')]}
import re
# particle-view captions are full of formulas and ion symbols: say their names instead
IONS = {'en': [('FeS', 'iron sulphide'), ('H₂S', 'hydrogen sulphide'), ('Na₂S₂O₃', 'sodium thiosulphate'), ('CuSO₄·5H₂O', 'copper sulphate crystals'), ('2H₂O → 2H₂ + O₂', 'two water molecules give two hydrogen molecules and one oxygen molecule'), ('e⁻', 'electron'), ('C₆H₁₂O₆', 'glucose'), ('C₂H₅OH', 'alcohol'), ('C₁₀H₈', 'naphthalene'), ('H₂SO₄', 'sulphuric acid'), ('SO₄²⁻', 'sulphate ion'), ('CO₃²⁻', 'carbonate ion'), ('HCO₃⁻', 'hydrogen carbonate ion'), ('NO₃⁻', 'nitrate ion'), ('MnO₄⁻', 'permanganate ion'), ('OH⁻', 'hydroxide ion'), ('Cl⁻', 'chloride ion'), ('I⁻', 'iodide ion'), ('H⁺', 'hydrogen ion'), ('Na⁺', 'sodium ion'), ('K⁺', 'potassium ion'), ('Pb²⁺', 'lead ion'), ('Cu²⁺', 'copper ion'), ('Ba²⁺', 'barium ion'), ('Fe²⁺', 'iron ion'), ('Fe³⁺', 'iron ion'), ('Zn²⁺', 'zinc ion'), ('Ca²⁺', 'calcium ion'), ('Mg²⁺', 'magnesium ion'), ('Al³⁺', 'aluminium ion'),
              ('Pb(NO₃)₂', 'lead nitrate'), ('PbI₂', 'lead iodide'), ('PbO', 'lead oxide'), ('Na₂ZnO₂', 'sodium zincate'), ('Ca(OH)₂', 'calcium hydroxide'), ('CaCO₃', 'calcium carbonate'), ('CaO', 'calcium oxide'), ('BaSO₄', 'barium sulphate'), ('FeSO₄', 'iron sulphate'), ('Fe₂O₃·xH₂O', 'hydrated iron oxide'), ('Fe₂O₃', 'iron oxide'), ('xH₂O', 'water'), ('H₂O', 'water'), ('NaCl', 'sodium chloride'), ('MgO', 'magnesium oxide'), ('NO₂', 'nitrogen dioxide'), ('O₂', 'oxygen'), ('CO₃', 'carbonate'), ('SO₄', 'sulphate')],
        'hi': [('FeS', 'आयरन सल्फ़ाइड'), ('H₂S', 'हाइड्रोजन सल्फ़ाइड'), ('Na₂S₂O₃', 'सोडियम थायोसल्फ़ेट'), ('CuSO₄·5H₂O', 'कॉपर सल्फ़ेट के क्रिस्टल'), ('2H₂O → 2H₂ + O₂', 'पानी के दो अणु, हाइड्रोजन के दो अणु और ऑक्सीजन का एक अणु देते हैं'), ('e⁻', 'इलेक्ट्रॉन'), ('C₆H₁₂O₆', 'ग्लूकोज़'), ('C₂H₅OH', 'ऐल्कोहॉल'), ('C₁₀H₈', 'नैफ़्थलीन'), ('H₂SO₄', 'सल्फ्यूरिक अम्ल'), ('SO₄²⁻', 'सल्फेट आयन'), ('CO₃²⁻', 'कार्बोनेट आयन'), ('HCO₃⁻', 'हाइड्रोजन कार्बोनेट आयन'), ('NO₃⁻', 'नाइट्रेट आयन'), ('MnO₄⁻', 'परमैंगनेट आयन'), ('OH⁻', 'हाइड्रॉक्साइड आयन'), ('Cl⁻', 'क्लोराइड आयन'), ('I⁻', 'आयोडाइड आयन'), ('H⁺', 'हाइड्रोजन आयन'), ('Na⁺', 'सोडियम आयन'), ('K⁺', 'पोटैशियम आयन'), ('Pb²⁺', 'लेड आयन'), ('Cu²⁺', 'कॉपर आयन'), ('Ba²⁺', 'बेरियम आयन'), ('Fe²⁺', 'आयरन आयन'), ('Fe³⁺', 'आयरन आयन'), ('Zn²⁺', 'ज़िंक आयन'), ('Ca²⁺', 'कैल्शियम आयन'), ('Mg²⁺', 'मैग्नीशियम आयन'), ('Al³⁺', 'एल्युमिनियम आयन'),
              ('Pb(NO₃)₂', 'लेड नाइट्रेट'), ('PbI₂', 'लेड आयोडाइड'), ('PbO', 'लेड ऑक्साइड'), ('Na₂ZnO₂', 'सोडियम ज़िंकेट'), ('Ca(OH)₂', 'कैल्शियम हाइड्रॉक्साइड'), ('CaCO₃', 'कैल्शियम कार्बोनेट'), ('CaO', 'कैल्शियम ऑक्साइड'), ('BaSO₄', 'बेरियम सल्फेट'), ('FeSO₄', 'आयरन सल्फेट'), ('Fe₂O₃·xH₂O', 'जलयुक्त आयरन ऑक्साइड'), ('Fe₂O₃', 'आयरन ऑक्साइड'), ('xH₂O', 'पानी'), ('H₂O', 'पानी'), ('NaCl', 'सोडियम क्लोराइड'), ('MgO', 'मैग्नीशियम ऑक्साइड'), ('NO₂', 'नाइट्रोजन डाइऑक्साइड'), ('O₂', 'ऑक्सीजन'), ('CO₃', 'कार्बोनेट'), ('SO₄', 'सल्फेट')]}
ATOMS = {'en': {'Mg': 'magnesium', 'O': 'oxygen', 'H': 'hydrogen', 'Fe': 'iron', 'Cu': 'copper', 'Zn': 'zinc', 'Al': 'aluminium', 'Pb': 'lead', 'C': 'carbon', 'Na': 'sodium', 'Cl': 'chlorine', 'I': 'iodine', 'K': 'potassium', 'Ba': 'barium', 'Ca': 'calcium', 'S': 'sulphur', 'N': 'nitrogen'},
         'hi': {'Mg': 'मैग्नीशियम', 'O': 'ऑक्सीजन', 'H': 'हाइड्रोजन', 'Fe': 'आयरन', 'Cu': 'कॉपर', 'Zn': 'ज़िंक', 'Al': 'एल्युमिनियम', 'Pb': 'लेड', 'C': 'कार्बन', 'Na': 'सोडियम', 'Cl': 'क्लोरीन', 'I': 'आयोडीन', 'K': 'पोटैशियम', 'Ba': 'बेरियम', 'Ca': 'कैल्शियम', 'S': 'सल्फर', 'N': 'नाइट्रोजन'}}
FORMULA_IN_PARENS = re.compile(r'\s*\((?:[A-Z][a-z]?|[₀-₉²³⁺⁻()·x])+\)')

# physics symbols and units, said as words (numbers stay numbers)
PHYS = {'en': [(r'Ω m\b', ' ohm metre'), (r'(\d)\s*Ω', r'\1 ohms'), (r'Ω', ' ohm'), (r'(\d)\s*kPa\b', r'\1 kilopascals'), (r'(\d)\s*Hz\b', r'\1 hertz'), (r'(\d)\s*N\b', r'\1 newtons'), (r'(\d)\s*A\b', r'\1 amperes'), (r'(\d)\s*V\b', r'\1 volts'), (r'(\d)\s*D\b', r'\1 dioptres'),
               (r'(\d)\s*cm³', r'\1 cubic centimetres'), (r'g/cm³', 'grams per cubic centimetre'), (r'kg/m³', 'kilograms per cubic metre'), (r's²/m', 'seconds squared per metre'), (r'm/s²', 'metres per second squared'), (r'(\d)\s*cm\b', r'\1 centimetres'), (r'(\d)\s*mm\b', r'\1 millimetres'), (r'(\d)\s*kg\b', r'\1 kilograms'), (r'(\d)\s*g\b', r'\1 grams'), (r'(\d)\s*s\b', r'\1 seconds'), (r'(\d)\s*m\b', r'\1 metres'),
               (r'∠', 'angle '), (r'²', ' squared'), (r'³', ' cubed'), (r'≈', ' about '), (r'−', ' minus '), (r'×', ' times '), (r'÷', ' divided by '), (r'°', ' degrees'), (r'₁', ' 1'), (r'₂', ' 2'), (r'₃', ' 3'), (r'′', ' dash'), (r'…', ' to '), (r'√', 'square root of ')],
        'hi': [(r'Ω m\b', ' ओम मीटर'), (r'(\d)\s*Ω', r'\1 ओम'), (r'Ω', ' ओम'), (r'(\d)\s*kPa\b', r'\1 किलोपास्कल'), (r'(\d)\s*Hz\b', r'\1 हर्ट्ज़'), (r'(\d)\s*N\b', r'\1 न्यूटन'), (r'(\d)\s*A\b', r'\1 ऐम्पियर'), (r'(\d)\s*V\b', r'\1 वोल्ट'), (r'(\d)\s*D\b', r'\1 डायॉप्टर'),
               (r'(\d)\s*cm³', r'\1 घन सेंटीमीटर'), (r'g/cm³', 'ग्राम प्रति घन सेंटीमीटर'), (r'kg/m³', 'किलोग्राम प्रति घन मीटर'), (r's²/m', 'वर्ग सेकंड प्रति मीटर'), (r'm/s²', 'मीटर प्रति वर्ग सेकंड'), (r'(\d)\s*cm\b', r'\1 सेंटीमीटर'), (r'(\d)\s*mm\b', r'\1 मिलीमीटर'), (r'(\d)\s*kg\b', r'\1 किलोग्राम'), (r'(\d)\s*g\b', r'\1 ग्राम'), (r'(\d)\s*s\b', r'\1 सेकंड'), (r'(\d)\s*m\b', r'\1 मीटर'),
               (r'(\d)\s*सेमी', r'\1 सेंटीमीटर'), (r'∠', 'कोण '), (r'²', ' वर्ग'), (r'³', ' घन'), (r'≈', ' लगभग '), (r'−', ' माइनस '), (r'×', ' गुणा '), (r'÷', ' भाग '), (r'°', ' डिग्री'), (r'₁', ' 1'), (r'₂', ' 2'), (r'₃', ' 3'), (r'′', ' डैश'), (r'…', ' से '), (r'√', 'वर्गमूल ')]}
# maths: symbols said as words (applied before the physics list)
MATH = {'en': [(r'⅔ × ', 'two thirds of '), (r'⅔', 'two thirds'), (r'4/3', 'four thirds'), (r'(\d)ab\b', r'\1 a b'), (r'\bab\b', 'a b'), (r'θ', 'theta'), (r'⅓ πr²h', 'one third pi r squared h'), (r'πr²h', 'pi r squared h'), (r'πr²', 'pi r squared'), (r'πr', 'pi r'), (r'π', 'pi'), (r'⅓', 'one third'), (r'½', 'one half'), (r'¾', 'three quarters'), (r'¼', 'one quarter'), (r'⅛', 'one eighth'), (r'\)/\(', ') by ('), (r'(\d+)/(\d+)', r'\1 by \2'),
               (r'(\d)\s*cm²', r'\1 square centimetres'), (r'\bn³', 'n cubed'), (r' \+ ', ' plus '), (r' = ', ' equals '), (r'…\s*', ', and so on. ')],
        'hi': [(r'⅔', 'दो-तिहाई'), (r'4/3', 'चार-तिहाई'), (r'(\d)ab\b', r'\1 ए बी'), (r'\bab\b', 'ए बी'), (r'θ', 'थीटा'), (r'\btan\b', 'टैन'), (r'⅓ πr²h', 'एक-तिहाई पाई आर वर्ग एच'), (r'πr²h', 'पाई आर वर्ग एच'), (r'πr²', 'पाई आर वर्ग'), (r'πr', 'पाई आर'), (r'π', 'पाई'), (r'⅓', 'एक-तिहाई'), (r'½', 'एक बटा दो'), (r'¾', 'तीन बटा चार'), (r'¼', 'एक बटा चार'), (r'⅛', 'एक बटा आठ'), (r'\)/\(', ') बटा ('), (r'(\d+)/(\d+)', r'\1 बटा \2'),
               (r'(\d)\s*cm²', r'\1 वर्ग सेंटीमीटर'), (r' \+ ', ' प्लस '), (r' = ', ' बराबर '), (r'…\s*', ', इसी तरह आगे। ')]}
LETTERS_HI = {'a': 'ए', 'b': 'बी', 'c': 'सी', 'd': 'डी', 'x': 'एक्स', 'y': 'वाई', 'h': 'एच', 'l': 'एल', 'm': 'एम', 'n': 'एन', 'r': 'आर', 't': 'टी', 'A': 'ए', 'B': 'बी', 'C': 'सी', 'D': 'डी', 'H': 'एच', 'O': 'ओ', 'P': 'पी', 'Q': 'क्यू', 'V': 'वी'}
def speak(t, L):
    MULT = '×' in t
    t = FORMULA_IN_PARENS.sub('', t)  # "oxygen molecules (O₂)" -> "oxygen molecules"
    for a, b in IONS[L]: t = t.replace(a, b)
    for a, b in MATH[L]: t = re.sub(a, b, t)
    t = re.sub(r'10⁻([⁰¹²³⁴⁵⁶⁷⁸⁹]+)', lambda m: ('10 to the power minus ' if L == 'en' else '10 की घात माइनस ') + m.group(1).translate(str.maketrans('⁰¹²³⁴⁵⁶⁷⁸⁹', '0123456789')), t)
    for a, b in PHYS[L]: t = re.sub(a, b, t)
    t = re.sub(r'\s+', ' ', t).strip()
    for a, b in FIX[L]: t = t.replace(a, b)
    if L == 'hi': t = re.sub(r'(?<![A-Za-z])ABC(?![A-Za-z])', 'ए बी सी', t); t = re.sub(r'(?<![A-Za-z])([abcdxyhlmnrtABCDHOPQV])(?![A-Za-z])', lambda m: LETTERS_HI[m.group(1)], t)
    if L == 'en': t = re.sub(r'(?<![A-Za-z])(Mg|Fe|Cu|Zn|Al|Pb|Na|Cl|Ba|Ca|[OHCIKSN])(?![A-Za-z₀-₉])', lambda m: ATOMS[L][m.group(1)], t) if re.search(r'\b(?:atoms?|ions?|molecules?)\b', t) else t
    else: t = re.sub(r'(?<![A-Za-z])(Mg|Fe|Cu|Zn|Al|Pb|Na|Cl|Ba|Ca|[OHCIKSN])(?![A-Za-z₀-₉])', lambda m: ATOMS[L][m.group(1)], t) if re.search(r'(परमाणु|आयन|अणु|एटम|मॉलिक्यूल|आयनों)', t) else re.sub(r'(?<![A-Za-z])(Mg|Fe|Cu|Zn|Al|Pb|Na|Cl|Ba|Ca)(?![A-Za-z₀-₉])', lambda m: ATOMS[L][m.group(1)], t) # single letters (I, N, O, S, C …) are physics symbols unless atoms are being talked about
    t = re.sub(r'\bion (ions?)\b', r'\1', t); t = t.replace('आयन आयनों', 'आयनों').replace('आयन आयन', 'आयन')
    W = r'[\w\u0900-\u097F]'
    if not MULT: t = re.sub(rf'(?<!{W})({W}+(?: {W}+)?),? \1(?!{W})', r'\1', t)  # (not in sums like 3 × 3 × 8)  # "lead iodide, lead iodide" -> once
    return t
n = 0; t0 = time.time(); print(f'worker {W}: {len(todo)} jobs', flush=True)
for j in todo:
    out = f"{OUT}/{j['lang']}/{j['key']}.mp3"; os.makedirs(os.path.dirname(out), exist_ok=True)
    with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as tf: wav = tf.name
    try:
        with wave.open(wav, 'wb') as w: V[j['lang']].synthesize_wav(speak(j['text'], j['lang']), w, syn_config=cfg[j['lang']])
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', wav, '-af', 'highpass=f=60,afade=t=in:d=0.03', '-ac', '1', '-ar', '22050', '-b:a', '24k', out], check=True); n += 1
    except Exception as e: print('FAIL', j['key'], e, flush=True)
    finally: os.unlink(wav)
    if n % 25 == 0: print(f'w{W}: {n}/{len(todo)} in {time.time()-t0:.0f}s', flush=True)
print(f'w{W} ALL DONE {n}', flush=True)
