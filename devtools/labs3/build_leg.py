"""Organ Lab 'leg' (knee extension: quadriceps and hamstrings, knee-jerk reflex) from Z-Anatomy (CC BY-SA 4.0); based on build_arm.py.
Organ Lab 'arm' (Muscles and movement: the elbow, biceps and triceps, and the reflex arc) from Z-Anatomy (CC BY-SA 4.0).
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


FOOT = r'^(Calcaneus|Talus|Navicular|Cuboid|(Medial|Intermediate|Lateral) cuneiform)( bone)?\.r$|metatarsal bone\.r$|phalanx of .* finger of foot\.r$'
RULES = [
    (r'^Hip bone\.r$', 'hip_bone'), (r'^Femur\.r$', 'femur'), (r'^Patella\.r$', 'patella'), (r'^Tibia\.r$', 'tibia'), (r'^Fibula\.r$', 'fibula'), (FOOT, 'foot_bones'),
    (r'^Rectus femoris muscle\.r$', 'quadriceps_1'), (r'^Vastus lateralis muscle\.r$', 'quadriceps_2'), (r'^Vastus medialis muscle\.r$', 'quadriceps_3'), (r'^Vastus intermedius muscle\.r$', 'quadriceps_4'),
    (r'^Long head of biceps femoris\.r$', 'hamstrings_1'), (r'^Short head of biceps femoris\.r$', 'hamstrings_2'), (r'^Semitendinosus muscle\.r$', 'hamstrings_3'), (r'^Semimembranosus muscle\.r$', 'hamstrings_4'),
    (r'^Lateral head of gastrocnemius\.r$', 'gastrocnemius_1'), (r'^Medial head of gastrocnemius\.r$', 'gastrocnemius_2'), (r'^Soleus muscle\.r$', 'soleus'), (r'^Calcaneal tendon\.r$', 'achilles_tendon'),
]
NERVES = [(r'^Femoral nerve\.r$', 'femoral_obturator_nerves')]
def crop_y(V, F, lo, hi):
    keep = (V[:, 1] > lo) & (V[:, 1] < hi); Fk = F[np.all(keep[F], axis=1)]
    return Fk


def items():
    out = []
    pat_y = None
    for m in objs:
        if m['name'] == 'Patella.r': V, F = mesh(m); pat_y = (V[:, 1].min() + V[:, 1].max()) / 2
    for m in objs:
        for pat, pid in RULES:
            if re.search(pat, m['name']):
                V, F = mesh(m)
                if pid.startswith('quadriceps'): F = crop_y(V, F, pat_y + 0.004, 9)  # the tendon below the kneecap is drawn by the app
                if pid == 'hip_bone': F = crop_y(V, F, -9, 0.97)
                if len(F): out.append((m['name'], pid, V, F))
                break
    for x in curves:
        for pat, pid in NERVES:
            if re.search(pat, x['name']) and len(x['p']) > 40:
                P = np.array(x['p'], float); R = np.array(x['r'], float)
                keep = P[:, 1] < 0.99; P, R = P[keep], R[keep]
                R = np.maximum(R * 1.8, 0.0014)
                Q, RR = resample(P, R, 0.004)
                if Q is None: break
                V, F, N = tube(Q, RR, 6); out.append((x['name'], pid, V, F))
                break
    return out


def main():
    it = items()
    leg = np.concatenate([V for n, p, V, F in it if p in ('femur', 'tibia', 'patella', 'fibula')])
    c = (leg.min(0) + leg.max(0)) / 2
    print('parts', sorted(set(p for _, p, _, _ in it)))
    build('leg', it, 130000, center=c)
    import shutil; shutil.copy(f'{RAW}/leg.json', f'{OUT}/leg.json')
    meta(c)


def load():
    s = trimesh.load(f'{RAW}/leg_raw.glb', force='scene', process=False)
    return {n: np.asarray(g.vertices, np.float64) for n, g in s.geometry.items()}


def ends(V):
    m = V.mean(0); u, s, vt = np.linalg.svd(V - m, full_matrices=False); a = vt[0]
    t = (V - m) @ a; lo, hi = np.quantile(t, 0.04), np.quantile(t, 0.96)
    A, B = V[t <= lo].mean(0), V[t >= hi].mean(0)
    return (A, B) if A[1] > B[1] else (B, A)


def r5(p): return np.round(np.asarray(p, float), 5).tolist()


def meta(c):
    M = load(); j = json.load(open(f'{OUT}/leg.json'))
    allV = np.concatenate(list(M.values()))
    j['bbox'] = [r5(allV.min(0)), r5(allV.max(0))]; j['mid'] = r5((allV.min(0) + allV.max(0)) / 2)
    j['centers'] = {}
    base = {}
    for n, V in M.items(): base.setdefault(re.sub(r'_\d+$', '', n), []).append(V)
    for b, Vs in base.items(): W = np.concatenate(Vs); j['centers'][b] = r5((W.min(0) + W.max(0)) / 2)
    # the knee hinge: a side-to-side line through the back of the thigh bone's rounded knuckles
    Fm = M['femur']; y0 = Fm[:, 1].min(); low = Fm[Fm[:, 1] < y0 + 0.035]
    lo, hi = low[:, 0].min(), low[:, 0].max(); cz = (low[:, 2].min() + low[:, 2].max()) / 2 - 0.004
    j['axis'] = [r5([lo + 0.008, y0 + 0.021, cz]), r5([hi - 0.008, y0 + 0.021, cz])]
    j['muscles'] = {}
    for n in M:
        if re.match(r'^(quadriceps|hamstrings|gastrocnemius)_\d$', n):
            O, I = ends(M[n]); j['muscles'][n] = {'O': r5(O), 'I': r5(I)}
    for b, dz in (('quadriceps', 0.015), ('hamstrings', -0.015), ('gastrocnemius', -0.012)):
        W = np.concatenate([V for n, V in M.items() if n.startswith(b + '_')])
        k = (W[:, 1] > np.quantile(W[:, 1], 0.4)) & (W[:, 1] < np.quantile(W[:, 1], 0.7))
        j['centers'][b] = r5(W[k].mean(0) + np.array([0, 0, dz]))
    P = M['patella']; T = M['tibia']; tt = T[:, 1].max()
    band = T[(T[:, 1] < tt - 0.03) & (T[:, 1] > tt - 0.075)]; tub = band[np.argmax(band[:, 2])]
    pl = P[np.argmin(P[:, 1])]; pc = (P.min(0) + P.max(0)) / 2
    j['tendon'] = [r5(pl + np.array([0, 0.004, -0.004])), r5(tub + np.array([0, 0.004, -0.004]))]
    j['centers']['patellar_ligament'] = r5((pl + tub) / 2 + np.array([0, 0, 0.004]))
    j['tap'] = r5((pl + tub) / 2 + np.array([0, 0, 0.006]))
    # knee-jerk reflex: tap -> up the thigh to the femoral nerve -> up to the spine (off the top); back down -> quadriceps
    fem = None
    for x in curves:
        if x['name'] == 'Femoral nerve.r' and len(x['p']) > 40: fem = np.array(x['p'], float) - c
    fem = fem[fem[:, 1] < 0.99 - c[1]]
    up = fem[::-1]  # knee end -> hip
    top = up[-1] + np.array([0.01, 0.06, -0.02])
    q = np.concatenate([V for n, V in M.items() if n.startswith('quadriceps_')]); qc = (q.min(0) + q.max(0)) / 2 + np.array([0, -0.05, 0.02])
    sens = np.concatenate([[j['tap']], [(np.array(j['tap']) + up[0]) / 2 + np.array([0, 0, 0.01])], up, [top]])
    motor = np.concatenate([[top + np.array([0.004, 0, 0.004])], fem[:int(len(fem) * 0.6)] + np.array([0.004, 0, 0.004]), [qc]])
    j['paths'] = {'sensory': r5(sens), 'motor': r5(motor)}
    j['top'] = r5(top)
    json.dump(j, open(f'{OUT}/leg.json', 'w'), separators=(',', ':'))
    print('axis', j['axis'], 'muscles', list(j['muscles']), 'tendon', j['tendon'])


if __name__ == '__main__':
    main()
