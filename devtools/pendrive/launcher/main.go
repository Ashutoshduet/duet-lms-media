// START-DUET-STEM: the launcher on a DUET STEM pen drive.
//
// It serves the drive's DUET-STEM folder to this computer only (http://127.0.0.1:8740, the same port every time so
// the browser keeps the apps' settings and the school's activation; the next free port only when 8740 is taken),
// then opens the apps in Chrome or Edge (an app window without the address bar), or in the default browser.
// No internet is needed. Nothing is written outside the drive (apart from the browser's own data); on the drive it
// writes DUET-STEM/.duet-lock (which computer the drive belongs to) and licences-last.json (the newest code list).
//
// The drive belongs to the first computer it is started on: .duet-lock holds an HMAC of that computer's id and the
// drive's school code. On another computer the apps do not open; a page says the drive is activated elsewhere.
// /school.json (the school code, which the apps activate from without the internet) is served only on the drive's
// own computer. /licences.json is the internet copy when the computer is online (so a withdrawn code stops),
// otherwise the last copy saved on the drive, otherwise the one the drive was built with.
//
// Build: see devtools/pendrive/build_pendrive.py (it sets main.lockKey and main.version with -ldflags -X).
package main

import (
	"bytes"
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"flag"
	"fmt"
	"io"
	"net"
	"net/http"
	"os"
	"path"
	"path/filepath"
	"strconv"
	"strings"
	"sync"
	"time"
)

var (
	lockKey    = "duet-stem-pendrive-dev-key" // a build sets the real key: -ldflags "-X main.lockKey=…"
	version    = "dev"
	remoteBase = "https://ashutoshduet.github.io/duet-lms-media/" // the website (the Android apps use the same, REMOTE_BASE)
	// test builds only (-ldflags "-X main.testIDEnv=DUET_TEST_MACHINE_ID"): the machine id from that environment
	// variable, to play a second computer. A drive's launchers are built without it, so the variable does nothing there.
	testIDEnv = ""
)

const (
	firstPort = 8740
	portTries = 20 // 8740…8759
	lockName  = ".duet-lock"
	signature = "duet-stem-pendrive"
)

type schoolFile struct {
	Code   string `json:"code"`
	School string `json:"school"`
}

type server struct {
	root     string
	school   *schoolFile
	allowed  bool   // this computer may open the apps
	blocked  bool   // the drive belongs to another computer
	dev      string // this computer's id for the DUET STEM register (not the raw machine id)
	schoolJS []byte
	lic      licences
}

func main() {
	rootFlag := flag.String("root", "", "the DUET-STEM folder (default: next to this program)")
	portFlag := flag.Int("port", firstPort, "first port to try")
	noBrowser := flag.Bool("no-browser", false, "do not open a browser")
	fullscreen := flag.Bool("fullscreen", false, "open the browser window in full screen (kiosk-like)")
	remote := flag.String("remote", remoteBase, "the website to take the newest licences.json from ('' = never)")
	flag.Parse()

	setTitle("DUET STEM")
	root, err := findRoot(*rootFlag)
	if err != nil {
		say("The DUET-STEM folder was not found next to this program. Copy the whole pen drive again.",
			"DUET-STEM फ़ोल्डर नहीं मिला। पूरी पेन ड्राइव फिर से कॉपी कीजिए।")
		waitAndExit(1)
	}
	s := &server{root: root}
	s.lic.remote = strings.TrimRight(*remote, "/")
	s.checkLock()

	// a second start (the teacher clicked twice): the drive is already being served, just open the browser
	ln, port, already := listen(*portFlag, root)
	url := fmt.Sprintf("http://127.0.0.1:%d/", port)
	if already {
		say("DUET STEM is already running. Opening it in the browser…", "DUET STEM पहले से चल रहा है। ब्राउज़र में खोल रहे हैं…")
		if !*noBrowser {
			openBrowser(url, *fullscreen)
		}
		time.Sleep(3 * time.Second)
		return
	}
	if ln == nil {
		say("Could not start: the ports 8740–8759 on this computer are all in use.", "शुरू नहीं हो सका: इस कंप्यूटर के पोर्ट 8740–8759 सब व्यस्त हैं।")
		waitAndExit(1)
	}
	if s.lic.remote != "" {
		go s.lic.refresh(s.root) // the newest code list, in the background (no internet: nothing happens)
	}
	srv := &http.Server{Handler: s, ReadHeaderTimeout: 20 * time.Second}
	go func() {
		if err := srv.Serve(ln); err != nil && !errors.Is(err, http.ErrServerClosed) {
			fmt.Println("Server stopped:", err)
		}
	}()

	fmt.Println()
	fmt.Println("  ==============================================================")
	if s.blocked {
		say("  This pen drive is already activated on another computer or panel.",
			"  यह पेन ड्राइव पहले से किसी दूसरे कंप्यूटर या पैनल पर चालू है।")
		say("  It works only on that one. Please contact DUET STEM: info@duetpower.in",
			"  यह केवल उसी पर चलती है। कृपया DUET STEM से संपर्क कीजिए: info@duetpower.in")
		fmt.Println("  (Yeh pen drive sirf usi computer/panel par chalti hai jahan pehli baar chalayi gayi thi.)")
	} else {
		say("  DUET STEM is running", "  DUET STEM चालू है")
		fmt.Println("  Address / पता:  " + url)
		fmt.Println()
		say("  Keep this window open while you teach (you may minimise it).",
			"  पढ़ाते समय यह खिड़की खुली रहने दीजिए (छोटी कर सकते हैं)।")
		say("  Close it when you have finished.", "  काम पूरा होने पर इसे बंद कर दीजिए।")
		fmt.Println("  (Padhate samay yeh window khuli rehne dijiye. Kaam poora hone par band kar dijiye.)")
	}
	fmt.Println("  ==============================================================")
	fmt.Println()
	if !*noBrowser {
		openBrowser(url, *fullscreen)
	}
	select {} // until the window is closed
}

// say prints a line in English and its Hindi line under it
func say(en, hi string) { fmt.Println(en); fmt.Println(hi) }

func waitAndExit(code int) {
	fmt.Println()
	fmt.Println("Press Enter to close · बंद करने के लिए Enter दबाइए")
	done := make(chan struct{})
	go func() { b := make([]byte, 1); _, _ = os.Stdin.Read(b); close(done) }()
	select {
	case <-done:
	case <-time.After(5 * time.Minute):
	}
	os.Exit(code)
}

func isFile(p string) bool { st, err := os.Stat(p); return err == nil && !st.IsDir() }

// findRoot: the DUET-STEM folder next to this program (or the folder it is in, or above it)
func findRoot(flagRoot string) (string, error) {
	var cands []string
	if flagRoot != "" {
		cands = append(cands, flagRoot)
	}
	if exe, err := os.Executable(); err == nil {
		if r, e := filepath.EvalSymlinks(exe); e == nil {
			exe = r
		}
		d := filepath.Dir(exe)
		cands = append(cands, filepath.Join(d, "DUET-STEM"), d, filepath.Dir(d), filepath.Join(filepath.Dir(d), "DUET-STEM"))
	}
	if wd, err := os.Getwd(); err == nil {
		cands = append(cands, filepath.Join(wd, "DUET-STEM"), wd)
	}
	for _, c := range cands {
		if isFile(filepath.Join(c, "pendrive.json")) {
			return filepath.Abs(c)
		}
	}
	return "", errors.New("not found")
}

// listen on 127.0.0.1 (this computer only: no firewall question, nothing reachable from the network).
// already: our launcher answers on that port already (the same drive started twice).
func listen(first int, root string) (net.Listener, int, bool) {
	for p := first; p < first+portTries; p++ {
		ln, err := net.Listen("tcp4", "127.0.0.1:"+strconv.Itoa(p))
		if err == nil {
			return ln, p, false
		}
		if ours(p, root) {
			return nil, p, true
		}
	}
	return nil, 0, false
}

// ours: this drive's launcher answers on that port (the same pendrive.json: another drive's goes on to the next port)
func ours(port int, root string) bool {
	c := http.Client{Timeout: 1500 * time.Millisecond}
	r, err := c.Get(fmt.Sprintf("http://127.0.0.1:%d/pendrive.json", port))
	if err != nil {
		return false
	}
	defer r.Body.Close()
	got, _ := io.ReadAll(io.LimitReader(r.Body, 1<<16))
	mine, _ := os.ReadFile(filepath.Join(root, "pendrive.json"))
	return r.Header.Get("X-Duet") == signature && bytes.Equal(bytes.TrimSpace(got), bytes.TrimSpace(mine))
}

// ------------------------------------------------------------------ the drive's computer

func (s *server) checkLock() {
	b, err := os.ReadFile(filepath.Join(s.root, "school.json"))
	if err != nil {
		s.allowed = true // a drive without its own code: the apps open as a free demo (or with a typed code)
		return
	}
	var sc schoolFile
	if json.Unmarshal(b, &sc) != nil || strings.TrimSpace(sc.Code) == "" {
		s.allowed = true
		return
	}
	s.school = &sc
	mid := machineID()
	if testIDEnv != "" && os.Getenv(testIDEnv) != "" {
		mid = os.Getenv(testIDEnv)
		fmt.Println("(TEST BUILD: machine id from " + testIDEnv + ")")
	}
	if mid == "" {
		h, _ := os.Hostname()
		mid = "host:" + h
		fmt.Println("(This computer's id could not be read; its name is used instead.)")
	}
	sum := sha256.Sum256([]byte("duet-dev|" + mid))
	s.dev = hex.EncodeToString(sum[:])[:24]
	m := hmac.New(sha256.New, []byte(lockKey))
	m.Write([]byte(mid + "|" + sc.Code))
	want := hex.EncodeToString(m.Sum(nil))
	lp := filepath.Join(s.root, lockName)
	if have, err := os.ReadFile(lp); err == nil {
		if hmac.Equal([]byte(strings.TrimSpace(string(have))), []byte(want)) {
			s.allowed = true
		} else {
			s.blocked = true
		}
	} else if errors.Is(err, os.ErrNotExist) {
		// the first start: this computer becomes the drive's computer
		f, err := os.OpenFile(lp, os.O_WRONLY|os.O_CREATE|os.O_EXCL, 0o444)
		if err == nil {
			_, err = f.WriteString(want + "\n")
			if cerr := f.Close(); err == nil {
				err = cerr
			}
		}
		if err != nil {
			fmt.Println("(Note: the pen drive is read-only, so it could not be tied to this computer: " + err.Error() + ")")
		} else {
			hideFile(lp)
			fmt.Println("This pen drive is now activated on this computer. · यह पेन ड्राइव अब इसी कंप्यूटर पर चालू है।")
		}
		s.allowed = true
	} else {
		fmt.Println("(Note: could not read " + lockName + ": " + err.Error() + ")")
		s.allowed = true
	}
	if s.allowed {
		s.schoolJS, _ = json.Marshal(map[string]string{"code": sc.Code, "school": sc.School, "dev": s.dev})
	}
}

// ------------------------------------------------------------------ the newest code list (licences.json)

type licences struct {
	remote  string
	mu      sync.Mutex
	data    []byte    // the internet copy
	at      time.Time // when it was fetched
	failAt  time.Time // the last try that failed (no internet)
	running chan struct{}
}

// refresh fetches the internet copy (4 s at most), keeps it and saves it on the drive
func (l *licences) refresh(root string) {
	l.mu.Lock()
	if l.running != nil {
		ch := l.running
		l.mu.Unlock()
		<-ch
		return
	}
	ch := make(chan struct{})
	l.running = ch
	l.mu.Unlock()
	data, err := fetchList(l.remote + "/licences.json")
	l.mu.Lock()
	if err == nil {
		l.data, l.at = data, time.Now()
	} else {
		l.failAt = time.Now()
	}
	l.running = nil
	l.mu.Unlock()
	close(ch)
	if err == nil {
		tmp := filepath.Join(root, "licences-last.json.tmp")
		if os.WriteFile(tmp, data, 0o644) == nil {
			if os.Rename(tmp, filepath.Join(root, "licences-last.json")) != nil {
				_ = os.Remove(tmp)
			}
		}
	}
}

func fetchList(u string) ([]byte, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 4*time.Second)
	defer cancel()
	req, err := http.NewRequestWithContext(ctx, "GET", u+"?t="+strconv.FormatInt(time.Now().Unix(), 10), nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Cache-Control", "no-cache")
	r, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer r.Body.Close()
	if r.StatusCode != 200 {
		return nil, fmt.Errorf("status %d", r.StatusCode)
	}
	b, err := io.ReadAll(io.LimitReader(r.Body, 8<<20))
	if err != nil {
		return nil, err
	}
	var j struct {
		Codes map[string]json.RawMessage `json:"codes"`
	}
	if json.Unmarshal(b, &j) != nil || j.Codes == nil { // a school Wi-Fi login page is not a code list
		return nil, errors.New("not a code list")
	}
	return b, nil
}

// current: the internet copy when there is one (fresh, or fetched now when the last try was more than a minute
// ago), else the last copy saved on the drive, else the drive's own
func (s *server) currentList() []byte {
	l := &s.lic
	if l.remote != "" {
		l.mu.Lock()
		fresh := l.data != nil && time.Since(l.at) < 5*time.Minute
		tryNow := !fresh && time.Since(l.failAt) > time.Minute
		l.mu.Unlock()
		if tryNow {
			l.refresh(s.root)
		}
		l.mu.Lock()
		d := l.data
		l.mu.Unlock()
		if d != nil {
			return d
		}
	}
	for _, n := range []string{"licences-last.json", "licences.json"} {
		if b, err := os.ReadFile(filepath.Join(s.root, n)); err == nil {
			return b
		}
	}
	return nil
}

// ------------------------------------------------------------------ serving the files

var mimeTypes = map[string]string{
	".html": "text/html; charset=utf-8", ".htm": "text/html; charset=utf-8",
	".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript; charset=utf-8", ".cjs": "text/javascript; charset=utf-8",
	".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8", ".map": "application/json; charset=utf-8",
	".webmanifest": "application/manifest+json; charset=utf-8", ".txt": "text/plain; charset=utf-8", ".xml": "application/xml",
	".csv": "text/csv; charset=utf-8", ".vtt": "text/vtt; charset=utf-8", ".md": "text/plain; charset=utf-8",
	".wasm": "application/wasm", ".glb": "model/gltf-binary", ".gltf": "model/gltf+json", ".bin": "application/octet-stream",
	".hdr": "image/vnd.radiance", ".exr": "image/x-exr", ".ktx2": "image/ktx2", ".basis": "application/octet-stream", ".drc": "application/octet-stream",
	".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".avif": "image/avif",
	".gif": "image/gif", ".svg": "image/svg+xml", ".ico": "image/x-icon", ".bmp": "image/bmp",
	".mp3": "audio/mpeg", ".ogg": "audio/ogg", ".oga": "audio/ogg", ".opus": "audio/ogg", ".wav": "audio/wav", ".m4a": "audio/mp4", ".aac": "audio/aac", ".flac": "audio/flac",
	".mp4": "video/mp4", ".m4v": "video/mp4", ".webm": "video/webm", ".ogv": "video/ogg", ".mov": "video/quicktime",
	".woff2": "font/woff2", ".woff": "font/woff", ".ttf": "font/ttf", ".otf": "font/otf",
	".pdf": "application/pdf", ".zip": "application/zip", ".apk": "application/vnd.android.package-archive",
}

func (s *server) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	h := w.Header()
	h.Set("X-Duet", signature)
	h.Set("X-Content-Type-Options", "nosniff")
	h.Set("Referrer-Policy", "no-referrer")
	if r.Method != http.MethodGet && r.Method != http.MethodHead {
		h.Set("Allow", "GET, HEAD")
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	// another computer's drive: only the page that says so
	if s.blocked {
		p := r.URL.Path
		if p == "/" || strings.HasSuffix(p, "/") || strings.HasSuffix(p, ".html") {
			h.Set("Content-Type", "text/html; charset=utf-8")
			h.Set("Cache-Control", "no-store")
			_, _ = w.Write([]byte(blockedPage))
			return
		}
		if p == "/pendrive.json" {
			s.serveFile(w, r)
			return
		}
		http.Error(w, "This pen drive is activated on another computer.", http.StatusForbidden)
		return
	}
	switch r.URL.Path { // (the query, such as ?t=… or &live=1, is not looked at)
	case "/school.json":
		if !s.allowed || s.schoolJS == nil {
			http.Error(w, "forbidden", http.StatusForbidden)
			return
		}
		h.Set("Content-Type", "application/json; charset=utf-8")
		h.Set("Cache-Control", "no-store")
		_, _ = w.Write(s.schoolJS)
		return
	case "/licences.json":
		b := s.currentList()
		if b == nil {
			http.NotFound(w, r)
			return
		}
		h.Set("Content-Type", "application/json; charset=utf-8")
		h.Set("Cache-Control", "no-store")
		http.ServeContent(w, r, "licences.json", time.Time{}, bytes.NewReader(b))
		return
	}
	s.serveFile(w, r)
}

func (s *server) serveFile(w http.ResponseWriter, r *http.Request) {
	p := r.URL.Path
	if !strings.HasPrefix(p, "/") || strings.ContainsAny(p, "\\\x00:") {
		http.NotFound(w, r)
		return
	}
	clean := path.Clean(p)
	parts := strings.Split(strings.TrimPrefix(clean, "/"), "/")
	if strings.EqualFold(parts[0], "launcher") { // the programs for the other computers are not web files
		http.NotFound(w, r)
		return
	}
	for _, part := range parts {
		if strings.HasPrefix(part, ".") || strings.HasSuffix(part, ".tmp") { // .duet-lock, half-written files
			http.NotFound(w, r)
			return
		}
	}
	full := filepath.Join(s.root, filepath.FromSlash(strings.TrimPrefix(clean, "/")))
	if rel, err := filepath.Rel(s.root, full); err != nil || strings.HasPrefix(rel, "..") {
		http.NotFound(w, r)
		return
	}
	st, err := os.Stat(full)
	if err == nil && st.IsDir() {
		if !strings.HasSuffix(p, "/") { // a folder: its index.html (never a list of files)
			http.Redirect(w, r, p+"/", http.StatusMovedPermanently)
			return
		}
		full = filepath.Join(full, "index.html")
		st, err = os.Stat(full)
	}
	if err != nil || st.IsDir() {
		http.NotFound(w, r)
		return
	}
	f, err := os.Open(full)
	if err != nil {
		http.NotFound(w, r)
		return
	}
	defer f.Close()
	ext := strings.ToLower(filepath.Ext(full))
	ct, ok := mimeTypes[ext]
	if !ok {
		ct = "application/octet-stream"
	}
	h := w.Header()
	h.Set("Content-Type", ct) // our own list: a Windows computer's registry can say text/plain for .js, which stops the apps
	h.Set("Cache-Control", "no-cache")
	http.ServeContent(w, r, filepath.Base(full), st.ModTime(), f) // Range requests (audio, video), If-Modified-Since
}

const blockedPage = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>DUET STEM · pen drive</title><style>
body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0c111b;color:#f2ede4;font:18px/1.5 "Noto Sans Devanagari","Noto Sans",system-ui,sans-serif}
.c{max-width:760px;margin:24px;padding:32px 36px;border-radius:20px;background:#151c29;border:1px solid rgba(255,255,255,.14)}
h1{font-size:28px;margin:0 0 12px;color:#f0a65a}h2{font-size:24px;margin:26px 0 10px;color:#f0a65a}p{margin:0 0 10px}b{color:#fff}a{color:#7fd1ff}
</style></head><body><div class="c">
<h1>This pen drive is activated on another computer</h1>
<p>A DUET STEM pen drive works only on the first computer or classroom panel it was started on. This is a different computer, so the apps do not open here.</p>
<p>Please use the pen drive on its own computer or panel, or contact DUET STEM: <b>info@duetpower.in</b></p>
<h2 lang="hi">यह पेन ड्राइव किसी दूसरे कंप्यूटर पर चालू है</h2>
<p lang="hi">DUET STEM पेन ड्राइव केवल उसी कंप्यूटर या कक्षा के पैनल पर चलती है जिस पर इसे पहली बार चलाया गया था। यह दूसरा कंप्यूटर है, इसलिए यहाँ ऐप नहीं खुलेंगे।</p>
<p lang="hi">पेन ड्राइव को उसी कंप्यूटर या पैनल पर लगाइए, या DUET STEM से संपर्क कीजिए: <b>info@duetpower.in</b></p>
</div></body></html>`
