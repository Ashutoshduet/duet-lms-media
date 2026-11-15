"""New Organ Labs from NIH HRA reference organs (CC BY 4.0): gut (small + large intestine), mouth, knee, liver.
Writes /root/work/build3/labs/<lab>_raw.glb + <lab>.json (parts, objects, center, size) via labs.build, then
paths/centres (paths.py) and meshopt compression (compress.mjs)."""
import sys, re, json
import numpy as np, trimesh
sys.path.insert(0, '/root/work')
from labs import build
SRC = '/root/src/hra/glb'

def load(f):
    s = trimesh.load(f'{SRC}/{f}.glb', force='scene', process=False); out = []
    for node in s.graph.nodes_geometry:
        T, g = s.graph[node]; m = s.geometry[g]
        name = re.sub(r'^(VH_M_|VHM_|VH_F_)', '', node)
        out.append((name, trimesh.transform_points(m.vertices, T), np.asarray(m.faces)))
    return out

def collect(files, rules):
    items = []
    for f in files:
        for name, V, F in load(f):
            for pat, pid in rules:
                if re.search(pat, name): items.append((name, pid, V, F)); break
    return items

GUT = [(r'^duodenum_', 'duodenum'), (r'^(duodenal_ampulla|sphincter_of_hepatopancreatic_ampulla|papilla_of_santorini)$', 'bile_opening'),
       (r'^jejunum$', 'jejunum'), (r'^ileum(_terminal)?$', 'ileum'), (r'^ileocecal_valve$', 'ileocecal_valve'), (r'^caecum$', 'caecum'),
       (r'^vermiform_appendix$', 'appendix'), (r'^ascending_colon$', 'ascending_colon'),
       (r'^(transverse_colon|hepatic_flexure_of_colon|splenic_flexure_of_colon)$', 'transverse_colon'),
       (r'^descending_colon$', 'descending_colon'), (r'^sigmoid_colon$', 'sigmoid_colon'), (r'^rectum$', 'rectum')]
MOUTH = [(r'^set_of_(upper|lower)_jaw_teeth$', 'teeth'), (r'^(gingiva_of_lower_jaw|ginviva_of_upper_jaw)$', 'gums'),
         (r'^(dorsal_tongue|ventral_tongue|posterior_part_of_tongue)$', 'tongue'), (r'^(circumvallate|fungiform)_papillae$', 'taste_buds'),
         (r'^hard_palate$', 'hard_palate'), (r'^mucosa_of_soft_palate$', 'soft_palate'), (r'^parotid_gland_', 'parotid_gland'),
         (r'^submandibular_gland_', 'submandibular_gland'), (r'^sublingual_gland_', 'sublingual_gland'), (r'^buccal_mucosa$', 'cheek_lining'),
         (r'^mouth_floor$', 'mouth_floor'), (r'^mandible$', 'mandible')]
KNEE = [(r'^femur_L$', 'femur'), (r'^(lateral|medial)_condyle|^distal_most_point|^intercondylar_fossa|perichondular|^patellar_surface', 'femoral_condyles'),
        (r'^tibia_L$', 'tibia'), (r'^fibula_L$', 'fibula'), (r'^patella_L$', 'patella'), (r'^meniscus_L$', 'meniscus'),
        (r'^articular_cartilage_of_knee_L$', 'knee_cartilage'), (r'cruciate_enthesis', 'cruciate_ligaments'), (r'epicondylar_enthesis', 'collateral_ligaments')]
LIVER = [(r'^right_.*segment$', 'liver_right_lobe'), (r'^left_.*segment$', 'liver_left_lobe'), (r'^caudate_lobe', 'caudate_lobe'),
         (r'^quadrate_lobe', 'quadrate_lobe'), (r'(falciform|round_ligament|coronary_ligament|triangular_ligament|ligamentum_venosum|hepataduodenal)', 'liver_ligaments'),
         (r'^porta_hepatis$', 'porta_hepatis'), (r'impression_of_liver$', 'liver_impressions')]

def crop(items, c, r):
    out = []
    for n, p, V, F in items:
        keep = np.linalg.norm(V - c, axis=1) < r; Fk = F[np.all(keep[F], axis=1)]
        if not len(Fk): continue
        used = np.unique(Fk); remap = np.full(len(V), -1); remap[used] = np.arange(len(used))
        out.append((n, p, V[used], remap[Fk]))
    return out

def gut(): build('gut', collect(['small-intestine-male', 'large-intestine-male'], GUT), 60000)
def mouth(): build('mouth', collect(['mouth-male'], MOUTH), 90000)
def liver():
    it = collect(['liver-male'], LIVER); k = {}
    out = []
    for n, p, V, F in it:  # each segment its own piece (named pid_i), so it can have its own shade
        if p in ('liver_right_lobe', 'liver_left_lobe'): k[p] = k.get(p, 0) + 1; p = f'{p}_{k[p]}'
        out.append((n, p, V, F))
    build('liver', out, 40000)
def knee():
    it = collect(['knee-male-left'], KNEE)
    pc = np.concatenate([V for n, p, V, F in it if p == 'patella']); c = (pc.min(0) + pc.max(0)) / 2
    c = c + np.array([0, -0.02, -0.03])  # the joint lies behind and a little below the kneecap
    build('knee', crop(it, c, 0.1), 50000, center=c)

if __name__ == '__main__':
    for a in sys.argv[1:]: globals()[a]()
