"""Centres and flow paths for the new Organ Labs (coordinates of the raw lab GLB)."""
import sys, json
import numpy as np, trimesh
from scipy.sparse.csgraph import minimum_spanning_tree, shortest_path
from scipy.spatial import cKDTree
sys.path.insert(0, '/root/work')
from labpaths import load, kmeans, ctr, flat, finish, region

def centreline(V, step, start=None, end=None):
    """an ordered centre line of a tube-like cloud: k-means points, their minimum spanning tree, the longest path
    through it (or the path between the points nearest start and end)"""
    k = int(max(8, min(600, len(V) / 12)))
    C, _ = kmeans(V, k, it=20)
    T = cKDTree(C); d, j = T.query(C, k=min(8, len(C)))
    n = len(C); W = np.zeros((n, n))
    for i in range(n):
        for dd, jj in zip(d[i][1:], j[i][1:]):
            if dd < step * 3.5: W[i, jj] = W[jj, i] = dd
    M = minimum_spanning_tree(W); M = M + M.T
    D, Pr = shortest_path(M, directed=False, return_predecessors=True)
    D[np.isinf(D)] = -1
    if start is not None: a = int(np.argmin(np.linalg.norm(C - start, axis=1)))
    else: a = int(np.unravel_index(np.argmax(D), D.shape)[0])
    b = int(np.argmin(np.linalg.norm(C - end, axis=1))) if end is not None else int(np.argmax(D[a]))
    path = [b]
    while path[-1] != a and Pr[a, path[-1]] >= 0: path.append(Pr[a, path[-1]])
    pts = C[path[::-1]]
    # thin to an even spacing
    out = [pts[0]]
    for p in pts[1:]:
        if np.linalg.norm(p - out[-1]) >= step: out.append(p)
    return np.array(out)

from scipy.sparse import coo_matrix
from scipy.sparse.csgraph import dijkstra, connected_components
def meshes(lab):
    s = trimesh.load(f'/root/work/build3/labs/{lab}_raw.glb', force='scene', process=False)
    return {n: (np.asarray(g.vertices, float), np.asarray(g.faces)) for n, g in s.geometry.items()}
def ring_line(V, F, start, step, end=None):
    """centre line of a tube mesh: rings of equal distance (along the surface) from the end nearest `start`"""
    tm = trimesh.Trimesh(V, F, process=True); V, E = tm.vertices, tm.edges_unique; w = tm.edges_unique_length
    G = coo_matrix((np.r_[w, w], (np.r_[E[:, 0], E[:, 1]], np.r_[E[:, 1], E[:, 0]])), shape=(len(V), len(V))).tocsr()
    nc, lab = connected_components(G, directed=False); big = np.bincount(lab).argmax(); idx = np.where(lab == big)[0]
    a = idx[np.argmin(np.linalg.norm(V[idx] - start, axis=1))]
    d = dijkstra(G, indices=a); ok = np.isfinite(d)
    # the far end, then measure from the end nearest `start` among the two extremes
    out = []
    for t in np.arange(0, d[ok].max(), step):
        m = ok & (d >= t) & (d < t + step)
        if m.sum() >= 3: out.append(V[m].mean(0))
    out = np.array(out)
    if end is not None and len(out) > 2:
        k = int(np.argmin(np.linalg.norm(out - end, axis=1))); out = out[:k + 1]
    # smooth a little
    if len(out) > 4: out = np.array([out[max(0, i - 1):i + 2].mean(0) for i in range(len(out))])
    return out

def gut():
    M = load('gut'); c = {n: ctr(V) for n, V in M.items()}; paths = {}
    s = 0.006; MM = meshes('gut')
    D = MM['duodenum']; top = D[0][np.argmax(D[0][:, 1])]  # the duodenum starts at its top (from the stomach)
    du = ring_line(*D, top, s)
    je = ring_line(*MM['jejunum'], du[-1], s); il = ring_line(*MM['ileum'], je[-1], s, end=c['ileocecal_valve'])
    asc = ring_line(*MM['ascending_colon'], c['caecum'], s * 1.6); tr = ring_line(*MM['transverse_colon'], asc[-1], s * 1.6)
    de = ring_line(*MM['descending_colon'], tr[-1], s * 1.6); sg = ring_line(*MM['sigmoid_colon'], de[-1], s * 1.6); re_ = ring_line(*MM['rectum'], sg[-1], s * 1.6)
    paths.update(duodenum=du, jejunum=je, ileum=il, colon=np.concatenate([[c['caecum']], asc, tr, de, sg, re_]))
    # bile and pancreatic juice: into the duodenum at the ampulla
    amp = c['bile_opening']; paths['bile'] = np.array([amp + np.array([0.03, 0.03, 0.0]), amp + np.array([0.012, 0.012, 0]), amp])
    finish('gut', M, paths)

def liver():
    M = load('liver'); finish('liver', M, {})
    j = json.load(open('/home/claude/duet-lms-media/body/models/labs/liver.json'))
    import re as _re
    base = {}
    for n, V in M.items(): base.setdefault(_re.sub(r'_\d+$', '', n), []).append(V)
    for b, Vs in base.items(): j['centers'][b] = np.round(ctr(np.concatenate(Vs)), 5).tolist()
    j['parts'] = sorted(set(_re.sub(r'_\d+$', '', p) for p in j['parts']))
    json.dump(j, open('/home/claude/duet-lms-media/body/models/labs/liver.json', 'w'), separators=(',', ':'))

def knee():
    M = load('knee'); c = {n: ctr(V) for n, V in M.items()}
    # the bending axis: across the back of the femoral condyles (from side to side)
    fc = M['femoral_condyles']; lo, hi = fc[:, 0].min(), fc[:, 0].max()
    ax = [np.array([lo, fc[:, 1].min() + 0.02, ctr(fc)[2] - 0.005]), np.array([hi, fc[:, 1].min() + 0.02, ctr(fc)[2] - 0.005])]
    finish('knee', M, {}, {'axis': flat(ax)})

def mouth():
    M = load('mouth'); c = {n: ctr(V) for n, V in M.items()}; paths = {}
    T = M['tongue']; tc = ctr(T)
    # the tongue's back surface: the highest points along the midline, from the tip to the back
    mid = T[np.abs(T[:, 0] - tc[0]) < 0.006]
    zs = np.linspace(mid[:, 2].max() - 0.004, mid[:, 2].min() + 0.004, 12); top = []
    for z in zs:
        sl = mid[np.abs(mid[:, 2] - z) < 0.004]
        if len(sl): top.append([tc[0], sl[:, 1].max() + 0.003, z])
    top = np.array(top); back = top[-1] + np.array([0, -0.025, -0.02])
    paths['bolus'] = np.concatenate([top, [back]])
    # saliva: each gland to where its duct opens
    teeth = M['teeth']; tt = ctr(teeth)
    for side, sg in (('l', 1), ('r', -1)):
        P = M['parotid_gland']; Ps = P[np.sign(P[:, 0] - tc[0]) == sg]; pc = ctr(Ps)
        mol = teeth[(np.sign(teeth[:, 0] - tc[0]) == sg) & (teeth[:, 1] > tt[1])]; mo = mol[np.argmin(mol[:, 2])] if len(mol) else tt
        paths['saliva_p' + side] = np.array([pc, (pc + mo) / 2 + np.array([0, 0, 0.01]), mo + np.array([-sg * 0.004, 0, 0])])
        for g in ('submandibular_gland', 'sublingual_gland'):
            G = M[g]; Gs = G[np.sign(G[:, 0] - tc[0]) == sg]
            if not len(Gs): continue
            gc = ctr(Gs); tip = np.array([tc[0] + sg * 0.004, T[:, 1].min() + 0.004, T[:, 2].max() - 0.012])
            paths[('saliva_m' if g[2] == 'b' else 'saliva_s') + side] = np.array([gc, (gc + tip) / 2 + np.array([0, 0.004, 0]), tip])
    finish('mouth', M, paths)

if __name__ == '__main__':
    for a in sys.argv[1:]: globals()[a]()
