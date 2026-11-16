import trimesh, re, json, sys, numpy as np, pickle
s = trimesh.load('/root/src/hra/glb/united-male.glb', force='scene', process=False)
pat = re.compile(sys.argv[1])
out = {}
for node in s.graph.nodes_geometry:
    if not pat.search(node): continue
    T, g = s.graph[node]; m = s.geometry[g]
    V = trimesh.transform_points(m.vertices, T); out[node.replace('VH_M_', '')] = (V.astype(np.float32), np.asarray(m.faces))
pickle.dump(out, open(sys.argv[2], 'wb'))
for k, (V, F) in out.items(): print(k, len(F), V.min(0).round(3), V.max(0).round(3))
