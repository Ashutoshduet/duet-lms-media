#!/usr/bin/env python3
"""Machine translation of the apps' English texts into 8 Indian languages with IndicTrans2 (AI4Bharat, MIT licence;
the distilled 200M English→Indic model in CTranslate2 form, run on the CPU).
usage: translate.py <texts.json> <out_dir> <lang> [lang ...]      langs: bn mr ta te gu kn ml or
<out_dir>/<lang>.json maps each English text to its translation; texts already there are kept (the run can resume).
Formulas, maths, numbers with units and placeholders such as {n} are kept exactly as they are (they go through the
model as <IDn> markers); long texts are translated sentence by sentence; the colon the model turns into a visarga is put
back."""
import json, os, re, sys, time
sys.path.insert(0, os.path.join(os.path.dirname(__file__)))
M = os.environ.get('IT2_MODEL', '/root/it2/m')
CODE = {'bn': 'ben_Beng', 'mr': 'mar_Deva', 'ta': 'tam_Taml', 'te': 'tel_Telu', 'gu': 'guj_Gujr', 'kn': 'kan_Knda', 'ml': 'mal_Mlym', 'or': 'ory_Orya'}

SUP = '₀₁₂₃₄₅₆₇₈₉⁰¹²³⁴⁵⁶⁷⁸⁹'
UNITS = r'(?:kWh|kJ|mL|ml|cm²|cm³|m²|m³|km/h|m/s²|m/s|cm|mm|km|kg|mg|kPa|Pa|ppm|Hz|°C|°F|kΩ|Ω|mA|mV|kW|W|V|A|N|J|L|g|m|s|h|K|min|°|%)'
NUM = r'\d(?:[\d,]*\d)?(?:\.\d+)?'
OPND = r'(?:√?' + NUM + r'(?:[' + SUP + r'°%]+|(?![A-Za-z]))|(?:sin|cos|tan)\s?(?:\d+°|θ)|(?<![A-Za-z])\d*[A-Za-zθπαβ√][A-Za-zθπαβ√' + SUP + r']{0,5}(?![A-Za-z])|\([^()]{1,20}\))'
PROTECT = [
    re.compile(r'\{[a-z0-9_]+\}'),                                                     # {n}, {c} … filled in by the app
    re.compile(OPND + r'(?:\s*[+−×÷=≤≥→/]\s*' + OPND + r')+(?:\s?' + UNITS + r'(?![A-Za-z]))?'),  # a² + b² = c², 20 × tan 45° = 20 m, 3/4
    re.compile(r'(?<![\w])[−-]?' + NUM + r'\s?' + UNITS + r'(?![A-Za-z])'),      # 10 kJ, 340 m/s, 25 ppm, 100 °C
    re.compile(r'[A-Za-z0-9()]*[' + SUP + r'·√][A-Za-z0-9()' + SUP + r'·√]*'),        # CuSO₄·5H₂O, a², √2
]
def protect(s):
    spans = []
    for k, rx in enumerate(PROTECT):
        for m in rx.finditer(s):
            a, b = m.span(); t = s[a:b].strip()
            if not t or not re.search(r'[\d' + SUP + r'{√=+×÷−/]', t): continue
            if re.fullmatch(r'[A-Za-z]+/[A-Za-z]+', t): continue                       # air/oxygen: words, translate them
            if k == 1 and any(len(w) >= 4 for w in re.findall(r'[A-Za-z]+', t)): continue  # words in it ("Area = length × breadth"): translate them
            spans.append((a, b))
    spans.sort(key=lambda x: (x[0], -(x[1] - x[0]))); keep = []; out = []; pos = 0
    for a, b in spans:
        if a < pos: continue
        t = s[a:b]; lead = len(t) - len(t.lstrip()); trail = len(t) - len(t.rstrip())
        out.append(s[pos:a + lead]); keep.append(t.strip()); out.append(f' <ID{len(keep)}> '); pos = b - trail
    out.append(s[pos:])
    return re.sub(r'\s+', ' ', ''.join(out)).strip(), keep
def restore(s, keep):
    def sub(m):
        i = int(m.group(1)) - 1; return keep[i] if 0 <= i < len(keep) else m.group(0)
    s = re.sub(r'<\s*[^<>\d]{0,12}?\s*(\d{1,2})\s*>', sub, s)
    return s
VIS = 'ःঃஃఃಃഃଃઃ'
def fix_colon(src, out):
    n = src.count(':');
    if not n: return out
    return re.sub('[' + VIS + r'](?=\s|$)', ':', out, count=n)
def sentences(text):
    parts = []
    for line in text.split('\n'):
        if not line.strip(): parts.append(('', '\n')); continue
        bits = re.split(r'(?<=[.?!])\s+(?=[A-Z0-9“"(])', line)
        for i, b in enumerate(bits): parts.append((b, ' ' if i < len(bits) - 1 else '\n'))
    if parts and parts[-1][1] == '\n': parts[-1] = (parts[-1][0], '')
    return parts

def main():
    src, outdir, langs = sys.argv[1], sys.argv[2], sys.argv[3:]
    texts = list(json.load(open(src)).keys()); os.makedirs(outdir, exist_ok=True)
    from ip import IndicProcessor
    import ctranslate2, sentencepiece as spm
    ip = IndicProcessor(inference=True)
    sp_src = spm.SentencePieceProcessor(model_file=M + '/vocab/model.SRC'); sp_tgt = spm.SentencePieceProcessor(model_file=M + '/vocab/model.TGT')
    tr = ctranslate2.Translator(M, device='cpu', compute_type='int8', inter_threads=1, intra_threads=os.cpu_count() or 2)
    for L in langs:
        tgt = CODE[L]; path = os.path.join(outdir, L + '.json')
        done = json.load(open(path)) if os.path.exists(path) else {}
        todo = [t for t in texts if t not in done]
        print(L, 'to do', len(todo), 'of', len(texts), flush=True)
        # every sentence of every text, once
        segs = {}; plan = {}
        for t in todo:
            p = sentences(t); plan[t] = p
            for s, _ in p:
                if s.strip() and s not in segs: segs[s] = protect(s)
        uniq = sorted(segs.keys(), key=lambda s: len(segs[s][0])); res = {}; t0 = time.time(); B = 24
        for k in range(0, len(uniq), B):
            chunk = uniq[k:k + B]; prot = [segs[s][0] for s in chunk]
            pre = ip.preprocess_batch(prot, src_lang='eng_Latn', tgt_lang=tgt)
            toks = [x.split(' ', 2)[:2] + sp_src.encode(x.split(' ', 2)[2] if x.count(' ') >= 2 else '', out_type=str) for x in pre]
            r = tr.translate_batch(toks, beam_size=4, max_decoding_length=300, max_batch_size=B)
            outs = ip.postprocess_batch([sp_tgt.decode(x.hypotheses[0]) for x in r], lang=tgt)
            for s, o in zip(chunk, outs): res[s] = fix_colon(s, restore(o, segs[s][1]))
            if (k // B) % 40 == 0: print(L, k + len(chunk), '/', len(uniq), f'{time.time() - t0:.0f}s', flush=True)
            if (k // B) % 100 == 99:  # save as we go
                for t in todo:
                    if t not in done and all((not s.strip()) or s in res for s, _ in plan[t]): done[t] = ''.join((res.get(s, '') if s.strip() else '') + sep for s, sep in plan[t])
                json.dump(done, open(path, 'w'), ensure_ascii=False)
        for t in todo: done[t] = ''.join((res.get(s, '') if s.strip() else '') + sep for s, sep in plan[t])
        json.dump(done, open(path, 'w'), ensure_ascii=False); print(L, 'done', len(done), f'{time.time() - t0:.0f}s', flush=True)
main()
