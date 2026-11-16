"""Organ Labs 'urinary' (kidneys, ureters, bladder, urethra with the aorta and vena cava) and 'pancreas' (pancreas, its duct,
the bile duct, duodenum, gallbladder and spleen with its vessels) from the NIH HRA united male reference body (CC BY 4.0).
Reads the meshes extracted by hra_peek.py (/tmp/claude-0/agent-body/hra_sel.pkl). Writes /root/work/build3/labs/<lab>_raw.glb and
body/models/labs/<lab>.json (parts, centres, flow paths)."""
import sys, json, re, pickle, shutil
import numpy as np, trimesh
sys.path.insert(0, '/root/work'); sys.path.insert(0, '/root/work/labs2')
from labs import build
from paths import ring_line
OUT = '/home/claude/duet-lms-media/body/models/labs'
RAW = '/root/work/build3/labs'
M0 = pickle.load(open('/tmp/claude-0/agent-body/hra_sel.pkl', 'rb'))


def collect(rules, crop=None):
    items = []
    for name, (V, F) in M0.items():
        for pat, pid in rules:
            if re.search(pat, name):
                V = V.astype(np.float64); F = np.asarray(F)
                if crop and pid in crop:
                    keep = crop[pid](V); F = F[np.all(keep[F], axis=1)]
                if len(F): items.append((name, pid, V, F))
                break
    return items


URINARY = [(r'^kidney_capsule_', 'renal_capsule'), (r'^outer_cortex_of_kidney_', 'renal_cortex'), (r'^renal_column_', 'renal_columns'),
           (r'^renal_pyramid_', 'renal_medulla'), (r'^renal_papilla_', 'renal_papillae'), (r'^renal_pelvis_', 'renal_pelvis'),
           (r'^ureter_', 'ureters'), (r'^(fundus_of_urinary_bladder_|trigone_of_urinary_bladder|urinary_bladder_neck|ureteral_orifice_)', 'bladder'),
           (r'^(prostatic_urethra|other_urethra)$', 'urethra'), (r'^descending_aorta_b$', 'aorta'), (r'^inferior_vena_cava_b$', 'inferior_vena_cava'),
           (r'^(right|left)_renal_artery$', 'renal_arteries'), (r'^renal_vein_', 'renal_veins'),
           (r'^common_iliac_vein_', 'iliac_veins')]
PANCREAS = [(r'^(head_of_pancreas|uncinate_process_of_the_pancreas)$', 'pancreas_head'), (r'^(neck_of_pancreas|body_of_pancreas)$', 'pancreas_body'),
            (r'^tail_of_pancreas$', 'pancreas_tail'), (r'^(ventral|dorsal)_pancreatic_duct$', 'pancreatic_duct'),
            (r'^(common_bile_duct|cystic_duct|common_hepatic_duct)$', 'bile_duct'), (r'^gallbladder$', 'gallbladder'),
            (r'^(hepatopancreatic_ampulla|sphincter_of_hepatopancreatic_ampulla)$', 'bile_opening'),
            (r'^duodenum_|^duodenal_ampulla$', 'duodenum'), (r'_surface_of_spleen$|^hilum_of_spleen$', 'spleen'),
            (r'^splenic_artery$|^celiac_trunk$', 'splenic_artery'), (r'^splenic_vein$', 'splenic_vein'), (r'^(portal_vein|hepatic_portal_vein)$', 'portal_vein'),
            (r'^superior_mesenteric_vein$', 'portal_vein')]


def r5(p): return np.round(np.asarray(p, float), 5).tolist()
def ctr(V): return (V.min(0) + V.max(0)) / 2


def raw(lab):
    s = trimesh.load(f'{RAW}/{lab}_raw.glb', force='scene', process=False)
    return {n: (np.asarray(g.vertices, float), np.asarray(g.faces)) for n, g in s.geometry.items()}


def chain(V, start, step=0.004):
    """points along a thin vessel from the end nearest `start`: slices by distance from that end"""
    d = np.linalg.norm(V - start, axis=1); a = V[np.argmin(d)]
    d = np.linalg.norm(V - a, axis=1); out = []
    for t in np.arange(0, d.max() + step, step):
        m = (d >= t) & (d < t + step)
        if m.sum() >= 2: out.append(V[m].mean(0))
    return np.array(out)


def finish(lab, M, paths, extra=None):
    j = json.load(open(f'{OUT}/{lab}.json'))
    allV = np.concatenate([V for V, F in M.values()])
    j['bbox'] = [r5(allV.min(0)), r5(allV.max(0))]; j['mid'] = r5(ctr(allV))
    j['centers'] = {n: r5(ctr(V)) for n, (V, F) in M.items()}
    j['paths'] = {k: r5(v) for k, v in paths.items()}
    if extra: j.update(extra)
    json.dump(j, open(f'{OUT}/{lab}.json', 'w'), separators=(',', ':'))
    print(lab, 'paths', list(paths), 'parts', list(M))


def urinary():
    crop = {'aorta': lambda V: V[:, 1] < 0.36, 'inferior_vena_cava': lambda V: V[:, 1] < 0.36,
            'urethra': lambda V: (V[:, 1] > -0.035) & (V[:, 2] < 0.012), 'iliac_veins': lambda V: V[:, 1] > 0.12}
    it = collect(URINARY, crop)
    kid = np.concatenate([V for n, p, V, F in it if p in ('renal_capsule', 'bladder')]); c = ctr(kid)
    build('urinary', it, 80000, center=c)
    shutil.copy(f'{RAW}/urinary.json', f'{OUT}/urinary.json')
    M = raw('urinary'); paths = {}
    cap = M['renal_capsule'][0]; L_ = cap[cap[:, 0] > 0]; R_ = cap[cap[:, 0] < 0]
    ao, aoF = M['aorta']; ivc, ivF = M['inferior_vena_cava']
    paths['aorta'] = ring_line(ao, aoF, ao[np.argmax(ao[:, 1])], 0.006)
    paths['ivc'] = ring_line(ivc, ivF, ivc[np.argmin(ivc[:, 1])], 0.006)
    ra = M['renal_arteries'][0]; rv = M['renal_veins'][0]; ur, urF = M['ureters']; pel = M['renal_pelvis'][0]
    for side, K, sg in (('l', L_, 1), ('r', R_, -1)):
        kc = ctr(K); hil = np.array([kc[0] - sg * 0.022, kc[1] - 0.004, kc[2] + 0.008])
        A = ra[np.sign(ra[:, 0] - (ao[:, 0].mean())) == sg]; aa = chain(A, np.array([ao[:, 0].mean(), A[:, 1].mean(), ao[:, 2].mean()]))
        paths['art_' + side] = np.concatenate([[aa[0] + np.array([-sg * 0.004, 0.01, 0])], aa, [hil, kc + np.array([-sg * 0.006, 0.01, 0])]])
        Vv = rv[np.sign(rv[:, 0] - ivc[:, 0].mean()) == sg]; vv = chain(Vv, hil)
        paths['vein_' + side] = np.concatenate([[kc + np.array([-sg * 0.006, -0.012, 0])], [hil], vv, [vv[-1] + np.array([0, -0.012, 0])]])
        U = ur[np.sign(ur[:, 0] - c[0] * 0 - (ao[:, 0].mean())) == sg]; Pl = pel[np.sign(pel[:, 0]) == sg]
        uu = chain(U, ctr(Pl), 0.006)
        paths['ureter_' + side] = np.concatenate([[ctr(Pl)], uu])
        # urine from the cortex down into the pelvis
        for k in range(4):
            a = kc + np.array([sg * 0.012, (k - 1.5) * 0.022, 0.0])
            paths[f'urine_{side}{k}'] = np.array([a, (a + ctr(Pl)) / 2, ctr(Pl)])
    ut, utF = M['urethra']; paths['urethra'] = chain(ut, ut[np.argmax(ut[:, 1])], 0.004)
    bl = M['bladder'][0]
    finish('urinary', M, paths, {'bladderBase': r5([ctr(bl)[0], bl[:, 1].min(), ctr(bl)[2]]), 'cutc': float(np.round(ctr(L_)[2] * 0.5 + ctr(R_)[2] * 0.5, 4)), 'kidneyL': r5(ctr(L_)), 'kidneyR': r5(ctr(R_))})


def pancreas():
    crop = {'portal_vein': lambda V: V[:, 1] > 0.3}
    it = collect(PANCREAS, crop)
    core = np.concatenate([V for n, p, V, F in it if p in ('pancreas_head', 'pancreas_body', 'pancreas_tail', 'spleen', 'duodenum')]); c = ctr(core)
    build('pancreas', it, 70000, center=c)
    shutil.copy(f'{RAW}/pancreas.json', f'{OUT}/pancreas.json')
    M = raw('pancreas'); paths = {}
    amp = ctr(M['bile_opening'][0])
    pd = M['pancreatic_duct'][0]; tail = pd[np.argmax(pd[:, 0])]
    pdl = chain(pd, tail, 0.004)
    # keep the duct line that leads to the ampulla (the ventral duct): stop where it comes closest to the ampulla
    k = int(np.argmin(np.linalg.norm(pdl - amp, axis=1))); paths['pjuice'] = np.concatenate([pdl[:k + 1], [amp]])
    bd = M['bile_duct'][0]; gb = ctr(M['gallbladder'][0]); bl = chain(bd, bd[np.argmax(bd[:, 1])], 0.004)
    k = int(np.argmin(np.linalg.norm(bl - amp, axis=1))); paths['bile'] = np.concatenate([[gb], bl[:k + 1], [amp]])
    du, duF = M['duodenum']; top = du[np.argmax(du[:, 1])]
    try: paths['duodenum'] = ring_line(du, duF, top, 0.006)
    except Exception as e: print('duodenum line', e)
    sa = M['splenic_artery'][0]; sv = M['splenic_vein'][0]; sp = ctr(M['spleen'][0])
    paths['splenic_art'] = chain(sa, sa[np.argmin(sa[:, 0])], 0.005)
    svl = chain(sv, sp, 0.005); paths['splenic_vein'] = svl
    pv = M['portal_vein'][0]; paths['portal'] = chain(pv, svl[-1], 0.005)
    # insulin: from the islets (in the body and tail) into the splenic vein and on to the portal vein
    isl = [ctr(M['pancreas_body'][0]), ctr(M['pancreas_tail'][0]), ctr(M['pancreas_head'][0])]
    for i, p in enumerate(isl):
        q = svl[np.argmin(np.linalg.norm(svl - p, axis=1))]; paths[f'insulin{i}'] = np.concatenate([[p, (p + q) / 2 + np.array([0, 0.004, 0.004]), q], svl[np.argmin(np.linalg.norm(svl - q, axis=1)):]])
    finish('pancreas', M, paths, {'islets': r5(isl)})


if __name__ == '__main__':
    for a in sys.argv[1:]: globals()[a]()
