"""Organ Lab 'arm' (Muscles and movement: the elbow, biceps and triceps, and the reflex arc) from Z-Anatomy (CC BY-SA 4.0).
The right arm hangs at the side (anatomical position). Writes /root/work/build3/labs/arm_raw.glb + body/models/labs/arm.json.
Each muscle that crosses the elbow is its own mesh (biceps_1 long head, biceps_2 short head, triceps_1..3, brachialis,
brachioradialis), so the app can stretch it between its origin (O) and insertion (I) when the elbow bends."""
import sys, json, re
import numpy as np, trimesh
sys.path.insert(0, '/root/work')
from labs import build
from process_v3 import resample, tube

OUT = '/home/claude/duet-lms-media/body/models/labs'
RAW = '/root/work/build3/labs'
objs = json.load(open('/root/work/za3/objects.json'))
curves = json.load(open('/root/work/za3/curves.json'))
D = np.load('/root/work/za3/mesh.npz'); VA, FA = D['V'], D['F']


def mesh(m):
    return VA[m['v0']:m['v0'] + m['nv']].astype(np.float64), FA[m['f0']:m['f0'] + m['nf']].astype(np.int64)


FLEX = r'^(Humero-ulnar head of flexor digitorum superficialis|Radial head of flexor digitorum superficialis|Flexor carpi radialis|Palmaris longus muscle|Humeral head of flexor carpi ulnaris|Ulnar head of flexor carpi ulnaris|Superficial head of pronator teres|Deep head of pronator teres|Flexor digitorum profundus|Flexor pollicis longus)\.r$'
EXT = r'^(Extensor digitorum|Extensor carpi radialis longus|Extensor carpi radialis brevis|Humeral head of extensor carpi ulnaris|Ulnar head of extensor carpi ulnaris|Extensor digiti minimi|Abductor pollicis longus|Extensor pollicis longus|Extensor pollicis brevis|Anconeus muscle)\.r$'
HAND = r'^(Capitate|Hamate|Lunate|Pisiform|Scaphoid|Trapezium|Trapezoid|Triquetrum) bone\.r$|metacarpal bone\.r$|phalanx of .* finger of hand\.r$'
RULES = [
    (r'^Humerus\.r$', 'humerus'), (r'^Radius\.r$', 'radius'), (r'^Ulna\.r$', 'ulna'), (r'^Scapula\.r$', 'scapula'), (r'^Clavicle\.r$', 'clavicle'),
    (HAND, 'hand_bones'),
    (r'^Long head of biceps brachii\.r$', 'biceps_1'), (r'^Short head of biceps brachii\.r$', 'biceps_2'),
    (r'^Long head of triceps brachii\.r$', 'triceps_1'), (r'^Lateral head of triceps brachii\.r$', 'triceps_2'), (r'^Medial head of triceps brachii\.r$', 'triceps_3'),
    (r'^Brachialis muscle\.r$', 'brachialis'), (r'^Brachioradialis muscle\.r$', 'brachioradialis'),
    (FLEX, 'forearm_flexors'), (EXT, 'forearm_extensors'),
    (r'^(Acromial|Clavicular|Scapular spinal) part of deltoid muscle\.r$', 'deltoid'),
    (r'^White matter of spinal cord$', 'spinal_cord'), (r'^(Anterior|Posterior) horn of spinal cord$', 'grey_matter'),
    (r'^Vertebra (C5|C6|C7)$|^Vertebra T1$', 'vertebrae'), (r'^Spinal ganglion\.r$', 'spinal_ganglion'),
]
NERVES = [(r'^Median nerve\.r$', 'median_nerve'), (r'^Musculocutaneous nerve\.r$', 'musculocutaneous_nerve'), (r'^Radial nerve\.r$', 'radial_nerve'),
          (r'^Ulnar nerve\.r$', 'ulnar_nerve'),
          (r'(Roots|trunk|division|cord) of brachial plexus\.r$|^(Superior|Middle|Inferior) trunk of brachial plexus\.r$|^(Lateral|Medial|Posterior) cord of brachial plexus\.r$', 'brachial_plexus'),
          (r'^(Anterior|Posterior) root of spinal nerve\.r$', 'spinal_nerves')]
CORD_Y = (1.405, 1.535)  # C5..T1 levels of the spinal cord


def crop_y(V, F, lo, hi):
    keep = (V[:, 1] > lo) & (V[:, 1] < hi); Fk = F[np.all(keep[F], axis=1)]
    return Fk


def items():
    out = []
    for m in objs:
        for pat, pid in RULES:
            if re.search(pat, m['name']):
                V, F = mesh(m)
                if pid in ('spinal_cord', 'grey_matter'): F = crop_y(V, F, *CORD_Y)
                if pid == 'spinal_ganglion': F = crop_y(V, F, CORD_Y[0] - 0.01, CORD_Y[1])
                if len(F): out.append((m['name'], pid, V, F))
                break
    for x in curves:
        for pat, pid in NERVES:
            if re.search(pat, x['name']):
                P = np.array(x['p'], float); R = np.array(x['r'], float)
                if pid == 'spinal_nerves':
                    keep = (P[:, 1] > CORD_Y[0]) & (P[:, 1] < CORD_Y[1]) & (P[:, 0] > -0.06)
                    if keep.sum() < 2: break
                    P, R = P[keep], R[keep]
                R = np.maximum(R * 1.8, 0.0012)  # thicker so they can be seen in the lab
                Q, RR = resample(P, R, 0.004)
                if Q is None: break
                V, F, N = tube(Q, RR, 6); out.append((x['name'], pid, V, F))
                break
    return out


def main():
    it = items()
    arm = np.concatenate([V for n, p, V, F in it if p in ('humerus', 'radius', 'ulna', 'hand_bones')])
    c = (arm.min(0) + arm.max(0)) / 2
    print('parts', sorted(set(p for _, p, _, _ in it)))
    build('arm', it, 150000, center=c)
    import shutil; shutil.copy(f'{RAW}/arm.json', f'{OUT}/arm.json')
    meta(c)


def load():
    s = trimesh.load(f'{RAW}/arm_raw.glb', force='scene', process=False)
    return {n: np.asarray(g.vertices, np.float64) for n, g in s.geometry.items()}


def ends(V):
    """origin (upper) and insertion (lower) end of a muscle: centroids of the 4% of vertices at each end of its long axis"""
    m = V.mean(0); u, s, vt = np.linalg.svd(V - m, full_matrices=False); a = vt[0]
    t = (V - m) @ a; lo, hi = np.quantile(t, 0.04), np.quantile(t, 0.96)
    A, B = V[t <= lo].mean(0), V[t >= hi].mean(0)
    return (A, B) if A[1] > B[1] else (B, A)


def r5(p): return np.round(np.asarray(p, float), 5).tolist()


def meta(c):
    M = load(); j = json.load(open(f'{OUT}/arm.json'))
    allV = np.concatenate(list(M.values()))
    j['bbox'] = [r5(allV.min(0)), r5(allV.max(0))]; j['mid'] = r5((allV.min(0) + allV.max(0)) / 2)
    j['centers'] = {}
    base = {}
    for n, V in M.items(): base.setdefault(re.sub(r'_\d+$', '', n), []).append(V)
    for b, Vs in base.items(): W = np.concatenate(Vs); j['centers'][b] = r5((W.min(0) + W.max(0)) / 2)
    # the elbow hinge: a side-to-side line through the middle of the rounded lower end of the humerus
    H = M['humerus']; y0 = H[:, 1].min(); low = H[H[:, 1] < y0 + 0.028]
    lo, hi = low[:, 0].min(), low[:, 0].max(); cz = (low[:, 2].min() + low[:, 2].max()) / 2
    ay = y0 + 0.0115
    j['axis'] = [r5([lo + 0.006, ay, cz]), r5([hi - 0.006, ay, cz])]
    # muscles: origin and insertion
    j['muscles'] = {}
    for n in M:
        if re.match(r'^(biceps_\d|triceps_\d|brachialis|brachioradialis)$', n):
            O, I = ends(M[n]); j['muscles'][n] = {'O': r5(O), 'I': r5(I)}
    # labels for the muscles: on the belly
    for b in ('biceps', 'triceps'):
        Vs = [V for n, V in M.items() if n.startswith(b + '_')]; W = np.concatenate(Vs)
        k = W[:, 1] > np.quantile(W[:, 1], 0.4); k &= W[:, 1] < np.quantile(W[:, 1], 0.7)
        j['centers'][b] = r5(W[k].mean(0) + (np.array([0, 0, 0.012]) if b == 'biceps' else np.array([0, 0, -0.012])))
    # reflex arc: fingertip -> median nerve -> plexus -> root -> cord (sensory), cord -> root -> musculocutaneous -> biceps (motor)
    def cpts(name):
        for x in curves:
            if x['name'] == name: return np.array(x['p'], float) - c
    med = cpts('Median nerve.r'); mc = cpts('Musculocutaneous nerve.r')
    hb = M['hand_bones']; tip = hb[np.argmin(hb[:, 1])]  # lowest point of the hand: tip of the middle finger
    cordV = M['spinal_cord']; cc = (cordV.min(0) + cordV.max(0)) / 2
    entry = np.array([cc[0] - 0.004, 1.47 - c[1], cc[2] - 0.003])  # dorsal side, C7 level
    exitp = np.array([cc[0] - 0.004, 1.48 - c[1], cc[2] + 0.004])  # ventral side, C6 level
    med_up = med[::-1]  # hand -> axilla
    sens = np.concatenate([[tip + np.array([0, 0.004, 0])], [(tip + med_up[0]) / 2], med_up, [np.array([-0.06, 1.455, -0.02]) - c], [np.array([-0.03, 1.465, -0.022]) - c], [entry]])
    bic = np.concatenate([V for n, V in M.items() if n.startswith('biceps_')]); bc = (bic.min(0) + bic.max(0)) / 2
    motor = np.concatenate([[exitp], [np.array([-0.03, 1.482, -0.012]) - c], [np.array([-0.06, 1.46, -0.016]) - c], [np.array([-0.12, 1.37, -0.015]) - c], mc[:int(len(mc) * 0.7)], [bc + np.array([0, 0.01, 0.01])]])
    pain = np.array([entry, entry + np.array([0, 0.03, 0]), entry + np.array([0.002, 0.07, 0.002]), [cc[0], cordV[:, 1].max() + 0.05, cc[2]]])
    relay = np.array([entry, (entry + exitp) / 2 + np.array([0.002, 0, 0]), exitp])
    j['paths'] = {'sensory': r5(sens), 'motor': r5(motor), 'pain': r5(pain), 'relay': r5(relay)}
    j['tip'] = r5(tip); j['cord'] = r5(cc)
    json.dump(j, open(f'{OUT}/arm.json', 'w'), separators=(',', ':'))
    print('axis', j['axis'], 'muscles', list(j['muscles']), 'tip', j['tip'])


if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1] == 'meta':
        it_c = json.load(open(f'{OUT}/arm.json'))['center']; meta(np.array(it_c))
    else: main()
