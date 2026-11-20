// DUET Robotics Lab 360, batch 37: AI with a camera on the Raspberry Pi 4, the way Pi projects on the internet do it
// (pi6.js gives these modules to the Pi's Python):
//   picamera2    from picamera2 import Picamera2; picam2 = Picamera2(); picam2.configure(picam2.create_preview_configuration(
//                main={"format": "RGB888", "size": (640, 480)})); picam2.start(); frame = picam2.capture_array(); stop(),
//                close(), capture_file("photo.jpg"). With no camera found (the ribbon's contacts the wrong way round, or no
//                camera) Picamera2() fails as the real one does: IndexError: list index out of range. Capturing before
//                start() is a RuntimeError. A frame is an array of shape (480, 640, 3): what the camera sees at that moment.
//   ultralytics  from ultralytics import YOLO; model = YOLO("yolov8n.pt") (or "yolo11n.pt": the 80 COCO classes); results =
//                model(frame, conf=0.25, imgsz=640, verbose=True): a list with one Results; results[0].boxes (iterable,
//                len()) of boxes with .cls, .conf (floats: int(box.cls), float(box.conf)), .xyxy[0] = [x1, y1, x2, y2] (px);
//                model.names = {0: "person", …}; results[0].names; results[0].speed. One frame takes about 450 ms on a Pi 4
//                at imgsz=640 (130 ms at 320), and verbose=True prints ultralytics' own line for every frame, as it does.
//                A model file the Pi does not have is a FileNotFoundError.
// What the camera sees comes from the scene (scenes3.js AiCamScene): it puts lab.cam37 = { ok, objects() } on the bench.
import { Nat, Mod, Flt, tup, str, typeName, Dict } from './py.js';
import { fsOf } from './pi20.js';

const t3 = (en, hi, hg) => ({ en, hi, hg });
const absent = (v) => typeof v === 'symbol';
const isNone = (v) => v === null || v === undefined || absent(v);
const nat = (name, sig, fn, o) => new Nat(name, sig, fn, o);
const num = (R, v, fn) => { if (typeof v === 'number') return v; if (typeof v === 'boolean') return +v; if (v instanceof Flt) return v.v; throw R.err('TypeError', 'P_NEED_NUM', { fn: fn || '?', t: typeName(v) }); };
const tick = (m, R, us) => { m.sync(R); m.t += us; m.back(R); };
const F = (v) => new Flt(v);
class Obj {
  constructor(type) { this._type = type; this.pyName = type; this._m = null; }
  get pyType() { return this._type; }
  pyNames() { return [...Object.keys(this.methods()), ...Object.keys(this.props())]; }
  pyGet(n, R) { const pr = this.props(); if (n in pr) return pr[n](R); const ms = this._m || (this._m = this.methods()); return ms[n]; }
  pySet() { return false; }
  methods() { return {}; } props() { return {}; }
  pyStr() { return `<${this._type} object>`; }
}
const klass = (name, make) => ({ pyType: 'type', pyName: name, pyCall: (R, a, kw) => make(R, a, kw || {}), pyGet: () => undefined, pyNames: () => [], pyStr: () => `<class '${name}'>` });
const arg = (a, kw, i, name, def) => (kw && name in kw ? kw[name] : a.length > i ? a[i] : def);

// the 80 COCO classes, as model.names gives them
export const COCO = ['person', 'bicycle', 'car', 'motorcycle', 'airplane', 'bus', 'train', 'truck', 'boat', 'traffic light', 'fire hydrant', 'stop sign', 'parking meter', 'bench', 'bird', 'cat', 'dog', 'horse', 'sheep', 'cow',
  'elephant', 'bear', 'zebra', 'giraffe', 'backpack', 'umbrella', 'handbag', 'tie', 'suitcase', 'frisbee', 'skis', 'snowboard', 'sports ball', 'kite', 'baseball bat', 'baseball glove', 'skateboard', 'surfboard', 'tennis racket', 'bottle',
  'wine glass', 'cup', 'fork', 'knife', 'spoon', 'bowl', 'banana', 'apple', 'sandwich', 'orange', 'broccoli', 'carrot', 'hot dog', 'pizza', 'donut', 'cake', 'chair', 'couch', 'potted plant', 'bed',
  'dining table', 'toilet', 'tv', 'laptop', 'mouse', 'remote', 'keyboard', 'cell phone', 'microwave', 'oven', 'toaster', 'sink', 'refrigerator', 'book', 'clock', 'vase', 'scissors', 'teddy bear', 'hair drier', 'toothbrush'];
const MODELS = { 'yolov8n.pt': 450, 'yolo11n.pt': 420, 'yolov8s.pt': 1300, 'yolo11s.pt': 1150, 'yolov5nu.pt': 480 }; // (ms a frame on a Pi 4 at imgsz=640)

// a frame: what the camera saw when it was captured
class Frame extends Obj {
  constructor(det, w, h) { super('ndarray'); this.det = det; this.w = w; this.h = h; }
  props() { const me = this; return { shape: () => tup([me.h, me.w, 3]), dtype: () => 'uint8', size: () => me.h * me.w * 3 }; }
  pyStr() { return `array(shape=(${this.h}, ${this.w}, 3), dtype=uint8)`; }
  pyLen() { return this.h; }
}

export function aiModules(m) {
  const cam = () => (m.lab && m.lab.cam37) || null;
  // ---------------------------------------------------------------- picamera2
  const picamera2 = () => {
    class Picamera2 extends Obj {
      constructor() { super('Picamera2'); this.cfg = null; this.started = false; this.size = [640, 480]; }
      methods() { const me = this;
        const mkcfg = (name) => nat(name, '*', (R, a, kw) => { const d = new Dict(); const main = kw && kw.main; let size = [640, 480];
          if (main instanceof Dict && main.has('size')) { const s = main.get('size'); if (s && s.length === 2) size = [Math.round(num(R, s[0])), Math.round(num(R, s[1]))]; }
          const mm = new Dict(); mm.set('format', main instanceof Dict && main.has('format') ? main.get('format') : 'XBGR8888'); mm.set('size', tup(size)); d.set('main', mm); d.set('use_case', name === 'create_still_configuration' ? 'still' : 'preview'); return d; });
        return {
          create_preview_configuration: mkcfg('create_preview_configuration'), create_still_configuration: mkcfg('create_still_configuration'), create_video_configuration: mkcfg('create_video_configuration'),
          configure: nat('configure', ['camera_config=None'], (R, c) => { if (me.started) throw R.err('RuntimeError', 'N37_CFG_RUNNING', {}); me.cfg = c; if (c instanceof Dict && c.get('main') instanceof Dict) { const s = c.get('main').get('size'); if (s && s.length === 2) me.size = [num(R, s[0]), num(R, s[1])]; } tick(m, R, 60000); return null; }),
          start: nat('start', ['config=None', 'show_preview=False'], (R) => { me.started = true; const c = cam(); if (c) c.started = true; tick(m, R, 300000); return null; }),
          stop: nat('stop', [], (R) => { me.started = false; const c = cam(); if (c) c.started = false; tick(m, R, 20000); return null; }),
          close: nat('close', [], () => { me.started = false; return null; }),
          capture_array: nat('capture_array', ['name=main'], (R) => {
            if (!me.started) throw R.err('RuntimeError', 'N37_NOT_STARTED', {});
            const c = cam(); tick(m, R, Math.round(12000 + 21000 * me.size[0] * me.size[1] / (640 * 480))); const det = c && c.objects ? c.objects(me.size[0], me.size[1]) : []; const f = new Frame(det, me.size[0], me.size[1]); f.at = c && c.snap ? c.snap() : null; return f; }),
          capture_file: nat('capture_file', ['name'], (R, name) => {
            if (!me.started) throw R.err('RuntimeError', 'N37_NOT_STARTED', {}); tick(m, R, 180000); fsOf(m).set(str(name), `ÿØ JPEG ${me.size[0]}x${me.size[1]} (a photo)`); return null; }),
        }; }
      props() { const me = this; return { camera_config: () => me.cfg, started: () => me.started }; }
    }
    return new Mod('picamera2', { Picamera2: klass('Picamera2', (R) => { const c = cam(); tick(m, R, 250000); if (!c || !c.ok()) throw R.err('IndexError', 'N37_NO_CAMERA', {}); return new Picamera2(); }) });
  };
  // ---------------------------------------------------------------- ultralytics
  const ultralytics = () => {
    const namesDict = () => { const d = new Dict(); COCO.forEach((n, i) => d.set(i, n)); return d; };
    class Box extends Obj {
      constructor(b) { super('Boxes'); this.b = b; }
      props() { const b = this.b; return { cls: () => F(b.cls), conf: () => F(b.conf), xyxy: () => [b.xyxy.map(F)], xywh: () => [[F((b.xyxy[0] + b.xyxy[2]) / 2), F((b.xyxy[1] + b.xyxy[3]) / 2), F(b.xyxy[2] - b.xyxy[0]), F(b.xyxy[3] - b.xyxy[1])]], id: () => null }; }
      pyStr() { return `ultralytics Box: cls=${this.b.cls}. conf=${this.b.conf.toFixed(4)} xyxy=[${this.b.xyxy.map((v) => v.toFixed(1)).join(', ')}]`; }
    }
    class Boxes extends Obj {
      constructor(list) { super('Boxes'); this.list = list; }
      pyLen() { return this.list.length; }
      pyIter() { return this.list.map((b) => new Box(b))[Symbol.iterator](); }
      pyGetItem(k, R) { const i = Math.trunc(num(R, k)); const j = i < 0 ? this.list.length + i : i; if (j < 0 || j >= this.list.length) throw R.err('IndexError', 'N37_BOX_INDEX', { i, n: this.list.length }); return new Box(this.list[j]); }
      props() { const L = this.list; return { cls: () => L.map((b) => F(b.cls)), conf: () => L.map((b) => F(b.conf)), xyxy: () => L.map((b) => b.xyxy.map(F)), shape: () => tup([L.length, 6]) }; }
      pyStr() { return `ultralytics Boxes: ${this.list.length} boxes`; }
    }
    class Results extends Obj {
      constructor(list, ms, frame) { super('Results'); this.list = list; this.ms = ms; this.frame = frame; }
      props() { const me = this; return { boxes: () => new Boxes(me.list), names: () => namesDict(), speed: () => { const d = new Dict(); d.set('preprocess', F(3.1)); d.set('inference', F(me.ms)); d.set('postprocess', F(1.9)); return d; }, orig_shape: () => tup([me.frame.h, me.frame.w]) }; }
      methods() { const me = this; return { plot: nat('plot', '*', () => me.frame), save: nat('save', ['filename=result.jpg'], (R, n) => { fsOf(m).set(str(n), 'ÿØ JPEG (boxes drawn)'); return str(n); }) }; }
      pyStr() { return `ultralytics Results: ${this.list.length} boxes`; }
    }
    class YOLO extends Obj {
      constructor(file, ms) { super('YOLO'); this.file = file; this.ms0 = ms; }
      run(R, a, kw) {
        const src = arg(a, kw, 0, 'source', null); if (!(src instanceof Frame)) throw R.err('TypeError', 'N37_SOURCE', { t: typeName(src) });
        const conf = num(R, arg(a, kw, 99, 'conf', F(0.25))), imgsz = Math.round(num(R, arg(a, kw, 99, 'imgsz', 640))); const verbose = arg(a, kw, 99, 'verbose', true);
        const ms = this.ms0 * Math.pow(imgsz / 640, 2) * (0.95 + Math.random() * 0.1); tick(m, R, Math.round(ms * 1000 + 6000));
        const small = imgsz < 480 ? 0.07 : 0; // (a smaller picture: the small and far objects come out a little less sure)
        const list = src.det.map((d) => Object.assign({}, d, { conf: Math.max(0, d.conf - (d.small ? small * 2 : small)) })).filter((d) => d.conf >= conf).sort((x, y) => y.conf - x.conf);
        const cam37 = cam(); if (cam37) { cam37.frames = (cam37.frames || 0) + 1; cam37.lastMs = ms; }
        if (verbose !== false && verbose !== 0) { const cnt = {}; for (const d of list) cnt[COCO[d.cls]] = (cnt[COCO[d.cls]] || 0) + 1; const words = Object.entries(cnt).map(([n, k]) => `${k} ${n}${k > 1 ? (n.endsWith('s') ? 'es' : 's') : ''}`).join(', ');
          R.print(`\n0: ${imgsz * 3 / 4}x${imgsz} ${words || '(no detections)'}, ${ms.toFixed(1)}ms\nSpeed: 3.1ms preprocess, ${ms.toFixed(1)}ms inference, 1.9ms postprocess per image at shape (1, 3, ${imgsz * 3 / 4}, ${imgsz})\n`); }
        return [new Results(list, ms, src)];
      }
      pyCall(R, a, kw) { return this.run(R, a, kw || {}); }
      methods() { const me = this; return { predict: nat('predict', '*', (R, a, kw) => me.run(R, a, kw || {})) }; }
      props() { return { names: () => namesDict() }; }
      pyStr() { return `YOLO("${this.file}")`; }
    }
    return new Mod('ultralytics', { YOLO: klass('YOLO', (R, a, kw) => { const f = str(arg(a, kw, 0, 'model', 'yolov8n.pt')); const ms = MODELS[f]; if (!ms) throw R.err('FileNotFoundError', 'N37_MODEL', { f }); tick(m, R, 1800000); return new YOLO(f, ms); }) });
  };
  // ---------------------------------------------------------------- cv2 (batch 38): the little of OpenCV a face tracker uses
  // cvtColor to grey, CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml"), detectMultiScale
  // (about 160 ms for 640 × 480 on a Pi 4, 45 ms for 320 × 240): a list of (x, y, w, h). A cascade file that is not there
  // leaves the classifier empty, and detectMultiScale then fails as OpenCV does. rectangle / putText / imshow / waitKey /
  // destroyAllWindows draw nothing here (the Pi has no screen on this bench).
  const cv2 = () => {
    class Cascade extends Obj {
      constructor(file, ok) { super('CascadeClassifier'); this.file = file; this.ok = ok; }
      methods() { const me = this; return {
        empty: nat('empty', [], () => !me.ok),
        detectMultiScale: nat('detectMultiScale', '*', (R, a, kw) => {
          if (!me.ok) throw R.err('cv2.error', 'N38_EMPTY', {});
          const img = arg(a, kw, 0, 'image', null); if (!(img instanceof Frame)) throw R.err('TypeError', 'N37_SOURCE', { t: typeName(img) });
          const sf = num(R, arg(a, kw, 1, 'scaleFactor', F(1.1))), mn = Math.round(num(R, arg(a, kw, 2, 'minNeighbors', 3)));
          tick(m, R, Math.round(160000 * (img.w * img.h) / (640 * 480) * 1.1 / Math.max(1.01, sf))); // (a bigger scaleFactor tries fewer sizes: faster)
          const c = cam(); const faces = c && c.faces ? c.faces(img.w, img.h, img.at, mn) : [];
          return faces.map((f) => tup(f.map((v) => Math.round(v))));
        }),
      }; }
    }
    const data = new Mod('cv2.data', { haarcascades: '/usr/share/opencv4/haarcascades/' });
    return new Mod('cv2', {
      COLOR_RGB2GRAY: 7, COLOR_BGR2GRAY: 6, COLOR_RGB2BGR: 4, COLOR_BGR2RGB: 4, FONT_HERSHEY_SIMPLEX: 0, data,
      cvtColor: nat('cvtColor', ['src', 'code'], (R, src, code) => { if (!(src instanceof Frame)) throw R.err('TypeError', 'N37_SOURCE', { t: typeName(src) }); tick(m, R, Math.round(4000 * src.w * src.h / (640 * 480))); const g = new Frame(src.det, src.w, src.h); g.at = src.at; g.gray = code === 6 || code === 7; return g; }),
      CascadeClassifier: klass('CascadeClassifier', (R, a, kw) => { const f = str(arg(a, kw, 0, 'filename', '')); tick(m, R, 40000); return new Cascade(f, /haarcascades\/haarcascade_frontalface_(default|alt|alt2)\.xml$/.test(f)); }),
      rectangle: nat('rectangle', '*', (R, a) => a[0] || null), putText: nat('putText', '*', (R, a) => a[0] || null), circle: nat('circle', '*', (R, a) => a[0] || null),
      imshow: nat('imshow', '*', () => null), waitKey: nat('waitKey', ['delay=0'], (R, d) => { tick(m, R, Math.max(1, num(R, d)) * 1000); return -1; }), destroyAllWindows: nat('destroyAllWindows', [], () => null),
      resize: nat('resize', '*', (R, a, kw) => { const src = a[0]; const sz = a[1]; if (!(src instanceof Frame) || !sz || sz.length !== 2) throw R.err('TypeError', 'N37_SOURCE', { t: typeName(src) }); const g = new Frame(src.det, Math.round(num(R, sz[0])), Math.round(num(R, sz[1]))); g.at = src.at; tick(m, R, 3000); return g; }),
    });
  };
  return { picamera2, ultralytics, cv2 };
}

export const MSG37 = {
  N37_NO_CAMERA: t3('IndexError: list index out of range. Picamera2 found no camera: libcamera sees nothing on the CSI port. Is the ribbon cable in all the way, with its silver contacts facing the right side (on a Pi 4: towards the HDMI ports), and its latch pushed down?',
    'IndexError: list index out of range। Picamera2 को कोई कैमरा नहीं मिला: libcamera को CSI पोर्ट पर कुछ नहीं दिखता। क्या रिबन केबल पूरी अंदर है, उसके चाँदी जैसे कॉन्टैक्ट सही ओर (Pi 4 पर: HDMI पोर्ट की ओर), और उसकी कुंडी नीचे दबी है?',
    'IndexError: list index out of range. Picamera2 ko koi camera nahi mila: libcamera ko CSI port par kuch nahi dikhta. Kya ribbon cable poori andar hai, uske silver contacts sahi taraf (Pi 4 par: HDMI ports ki or), aur uski latch neeche dabi hai?'),
  N37_NOT_STARTED: t3('RuntimeError: Camera must be started before capturing. Call picam2.start() first.', 'RuntimeError: Camera must be started before capturing। पहले picam2.start() कीजिए।', 'RuntimeError: Camera must be started before capturing. Pehle picam2.start() kijiye.'),
  N37_CFG_RUNNING: t3('RuntimeError: Camera must be stopped before configuring.', 'RuntimeError: Camera must be stopped before configuring।', 'RuntimeError: Camera must be stopped before configuring.'),
  N37_MODEL: t3('FileNotFoundError: {f} does not exist. This Pi has yolov8n.pt and yolo11n.pt (and the s sizes): the n models are the ones a Pi 4 can run.', 'FileNotFoundError: {f} नहीं है। इस Pi पर yolov8n.pt और yolo11n.pt (और s वाले) हैं: Pi 4 n मॉडल ही चला पाता है।', 'FileNotFoundError: {f} nahi hai. Is Pi par yolov8n.pt aur yolo11n.pt (aur s wale) hain: Pi 4 n models hi chala paata hai.'),
  N37_SOURCE: t3('TypeError: the model wants a picture: a frame from picam2.capture_array(), not a {t}.', 'TypeError: मॉडल को तस्वीर चाहिए: picam2.capture_array() से आया फ़्रेम, {t} नहीं।', 'TypeError: model ko tasveer chahiye: picam2.capture_array() se aaya frame, {t} nahi.'),
  N38_EMPTY: t3('cv2.error: OpenCV(4.6.0) (-215:Assertion failed) !empty() in function \'detectMultiScale\'. The cascade file was not found, so the classifier is empty: use cv2.data.haarcascades + "haarcascade_frontalface_default.xml".', 'cv2.error: OpenCV(4.6.0) (-215:Assertion failed) !empty() in function \'detectMultiScale\'। कैस्केड फ़ाइल नहीं मिली, तो क्लासिफ़ायर ख़ाली है: cv2.data.haarcascades + "haarcascade_frontalface_default.xml" लिखिए।', 'cv2.error: OpenCV(4.6.0) (-215:Assertion failed) !empty() in function \'detectMultiScale\'. Cascade file nahi mili, to classifier khaali hai: cv2.data.haarcascades + "haarcascade_frontalface_default.xml" likhiye.'),
  N37_BOX_INDEX: t3('IndexError: index {i} is out of bounds: there are {n} boxes.', 'IndexError: इंडेक्स {i} सीमा से बाहर: {n} बॉक्स हैं।', 'IndexError: index {i} seema se bahar: {n} box hain.'),
};
