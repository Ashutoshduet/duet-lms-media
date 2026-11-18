# DUET AR Card markers: picks the 5x5-cell code family (7x7 cells with the black border) used in ar/js/markers.js
# (CARD_CODES). Codes are far apart under every rotation (>= 8 cells), far from their own rotations, far from QR corner
# squares, and safe against the 4x4 pad/cube codes when read on the wrong grid. Usage: python3 devtools/ar/card_codes.py
# (writes card_codes.json in the current folder; the list in markers.js was copied from seed 0's first 72 codes).
import random, json, numpy as np
N5=5
def bits5(v): return [[(v>>(24-(r*5+c)))&1 for c in range(5)] for r in range(5)]
def val5(b): 
    v=0
    for r in range(5):
        for c in range(5): v=(v<<1)|b[r][c]
    return v
def rot5(v):
    b=bits5(v); return val5([[b[4-c][r] for c in range(5)] for r in range(5)])  # 90 deg clockwise
def rots5(v):
    a=[v]
    for i in range(3): a.append(rot5(a[-1]))
    return a
pc=lambda x: bin(x).count('1')
PAD=[0xb532,0x0f9a,0x332d,0x549e,0x79cd,0xc4f2,0xfeda,0xcf56,0x24b1,0x263e,0x6600,0xdd82]
def bits4(v): return [[(v>>(15-(r*4+c)))&1 for c in range(4)] for r in range(4)]
def val4(b):
    v=0
    for r in range(4):
        for c in range(4): v=(v<<1)|b[r][c]
    return v
def rot4(v):
    b=bits4(v); return val4([[b[3-c][r] for c in range(4)] for r in range(4)])
def rots4(v):
    a=[v]
    for i in range(3): a.append(rot4(a[-1]))
    return a
# 1) a 7x7-grid marker read on a 6x6 grid: cell centres of the 6-grid at (i+0.5)/6 -> which 7-grid cell
def cell7_of6(i): return int(((i+0.5)/6)*7)
def read_as6(v5):
    # 7x7 cells: border black (0), inner 5x5 = bits; 6-grid inner cells i=1..4 -> 7-grid cell index
    full=[[0]*7 for _ in range(7)]; b=bits5(v5)
    for r in range(5):
        for c in range(5): full[r+1][c+1]=b[r][c]
    # the 6-grid border must be all black for a read: check
    idx=[cell7_of6(i) for i in range(6)]
    border_ok=all(full[idx[r]][idx[c]]==0 for r in range(6) for c in range(6) if r in (0,5) or c in (0,5))
    return border_ok, val4([[full[idx[r]][idx[c]] for c in range(1,5)] for r in range(1,5)])
# 2) a 6x6-grid marker read on a 7x7 grid: cells at (i+0.5)/7*6; the middle one lands on a boundary -> both
def read_as7(v4):
    full=[[0]*6 for _ in range(6)]; b=bits4(v4)
    for r in range(4):
        for c in range(4): full[r+1][c+1]=b[r][c]
    outs=[]
    for amb in (0,1):
        idx=[]
        for i in range(7):
            x=(i+0.5)/7*6
            idx.append(int(x) if abs(x-round(x))>1e-9 else (int(round(x))-1+amb))
        outs.append(val5([[full[idx[r]][idx[c]] for c in range(1,6)] for r in range(1,6)]))
    return outs
pad_as7=[x for p in PAD for x in read_as7(p)]
QR=val5([[1,1,1,1,1],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[1,1,1,1,1]])  # QR finder read on the 7-grid (1 = white)
QR2=val5([[0,0,0,0,0],[0,1,1,1,0],[0,1,0,1,0],[0,1,1,1,0],[0,0,0,0,0]])
BAD=[0, (1<<25)-1, QR, QR2]
def d5(a,b): return min(pc(a^x) for x in rots5(b))
def d4(a,b): return min(pc(a^x) for x in rots4(b))
D=8
def ok(v):
    w=pc(v)
    if w<9 or w>16: return False
    r=rots5(v)
    if min(pc(v^r[i]) for i in (1,2,3))<D: return False
    if any(d5(v,b)<7 for b in BAD): return False
    bo,as6=read_as6(v)
    if bo and min(d4(as6,p) for p in PAD)<4: return False
    if any(d5(v,q)<6 for q in pad_as7): return False
    # rows/cols not all white/black (keeps the inside textured, easy to threshold)
    b=bits5(v)
    if any(sum(row) in (0,5) for row in b) or any(sum(b[r][c] for r in range(5)) in (0,5) for c in range(5)): return False
    return True
best=[]
for seed in range(6):
    rng=random.Random(seed); S=[]
    tries=0
    while len(S)<80 and tries<120000:
        tries+=1
        v=rng.getrandbits(25)
        if not ok(v): continue
        rv=rots5(v)
        if all(min(pc(s^x) for x in rv)>=D for s in S): S.append(v)
    print('seed',seed,'codes',len(S))
    if len(S)>len(best): best=S
print('min pairwise', min(d5(a,b) for i,a in enumerate(best) for b in best[i+1:]))
json.dump(best[:72], open('card_codes.json','w'))
print([hex(x) for x in best[:72]])
