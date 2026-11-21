// DUET STEM desktop app (Robotics Lab 360 first): the website, installed on a laptop as a program.
//
// It works without the internet: the app's files come with the program (payload.zip, inside the Windows Setup or in
// the Mac app's Resources / next to the Linux program) and are unpacked into the user's own folder:
//   Windows  %LOCALAPPDATA%\DUET STEM\<App>        macOS  ~/Library/Application Support/DUET STEM/<App>
//   Linux    ~/.local/share/duet-stem/<app>
// It serves them to this computer only (http://127.0.0.1:8761 for the Robotics Lab, the same port every time so the
// browser keeps the students' work), and opens them in Chrome or Edge as an app window (own icon in the taskbar, no
// address bar), with its own browser profile: closing that window ends the program.
// Online, it updates itself in the background from the website (the files whose hash changed in <app>/offline.json,
// checked, then switched to in one step) and takes the newest licences.json (the school codes), so the installed app
// gets every new lesson and feature, and a withdrawn or renewed code takes effect. No internet: nothing changes.
//
// Windows: the first start (the Setup) copies the program into the app folder, makes the Desktop and Start-menu
// shortcuts and an entry in Settings > Apps (uninstall). RoboticsLab360.exe --uninstall removes all of it.
// Linux: the first start makes the menu and Desktop entries. macOS: the .app is dragged to Applications.
//
// Build: devtools/desktop/build_desktop.py (sets main.appID, main.appName, main.port, main.version with -ldflags -X).
package main

import (
	"archive/zip"
	"bytes"
	"context"
	"crypto/sha1"
	"encoding/hex"
	"encoding/json"
	"errors"
	"flag"
	"fmt"
	"io"
	"net"
	"net/http"
	"os"
	"os/exec"
	"path"
	"path/filepath"
	"runtime"
	"sort"
	"strconv"
	"strings"
	"sync"
	"sync/atomic"
	"time"
)

var (
	appID      = "robotics"
	appName    = "Robotics Lab 360"
	exeName    = "RoboticsLab360"
	port       = "8761"
	version    = "dev" // the program's own version (the files' version is in <app>/offline.json)
	remoteBase = "https://ashutoshduet.github.io/duet-lms-media/"
)

type manifest struct {
	V     string                    `json:"v"`
	T     int64                     `json:"t"`
	Files map[string][2]interface{} `json:"files"` // path: [sha1 (12), size]
}

func fh(v [2]interface{}) string { s, _ := v[0].(string); return s }
func fsz(v [2]interface{}) int64 {
	if n, ok := v[1].(json.Number); ok {
		i, _ := n.Int64()
		return i
	}
	if f, ok := v[1].(float64); ok {
		return int64(f)
	}
	return 0
}

type app struct {
	data    string // the user's app folder
	root    atomic.Value
	lastHit atomic.Int64
	mu      sync.Mutex
	upd     string // "", "checking", "downloading 40%", "ready v…", "offline", "up to date"
}

func (a *app) web() string { return a.root.Load().(string) }

func main() {
	uninstall := flag.Bool("uninstall", false, "remove the app, its shortcuts and its files")
	noBrowser := flag.Bool("no-browser", false, "only serve (for tests)")
	noUpdate := flag.Bool("no-update", false, "never look for updates")
	dataFlag := flag.String("data", "", "the app folder (default: the user's own folder)")
	remote := flag.String("remote", remoteBase, "the website to update from ('' = never)")
	flag.Parse()
	remoteBase = strings.TrimRight(*remote, "/")
	if remoteBase != "" {
		remoteBase += "/"
	}

	data := *dataFlag
	if data == "" {
		data = dataDir()
	}
	if *uninstall {
		doUninstall(data)
		return
	}
	if err := os.MkdirAll(data, 0o755); err != nil {
		fail("Could not make the app's folder: "+err.Error(), "ऐप का फ़ोल्डर नहीं बन सका: "+err.Error())
	}
	// Windows / Linux: the first start installs the program into the app folder (and shortcuts); from then on it starts there
	if exe, done := install(data); done {
		start(exe, os.Args[1:])
		return
	}
	a := &app{data: data}
	web, err := a.ensureWeb()
	if err != nil {
		fail("The app's files could not be unpacked: "+err.Error(), "ऐप की फ़ाइलें नहीं खुल सकीं: "+err.Error())
	}
	a.root.Store(web)
	a.lastHit.Store(time.Now().Unix())

	ln, url, already := listen()
	if already {
		if !*noBrowser {
			openApp(url, data, false)
		}
		return
	}
	if ln == nil {
		fail("Could not start: the ports "+port+"… on this computer are in use.", "शुरू नहीं हो सका: इस कंप्यूटर के पोर्ट व्यस्त हैं।")
	}
	srv := &http.Server{Handler: a, ReadHeaderTimeout: 20 * time.Second}
	go func() { _ = srv.Serve(ln) }()
	if remoteBase != "" && !*noUpdate {
		go a.update()
	}
	if *noBrowser {
		select {}
	}
	tracked := openApp(url, data, true) // waits while its window is open
	if !tracked {                         // the default browser: we cannot see it close; stop after 45 minutes unused
		for time.Since(time.Unix(a.lastHit.Load(), 0)) < 45*time.Minute {
			time.Sleep(time.Minute)
		}
	}
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()
	_ = srv.Shutdown(ctx)
}

// ------------------------------------------------------------ the files: unpack the program's own, switch to an update
func (a *app) current() (string, *manifest) {
	b, err := os.ReadFile(filepath.Join(a.data, "current.txt"))
	if err != nil {
		return "", nil
	}
	dir := filepath.Join(a.data, strings.TrimSpace(string(b)))
	m, err := readManifest(filepath.Join(dir, appID, "offline.json"))
	if err != nil {
		return "", nil
	}
	return dir, m
}

func readManifest(p string) (*manifest, error) {
	b, err := os.ReadFile(p)
	if err != nil {
		return nil, err
	}
	var m manifest
	d := json.NewDecoder(bytes.NewReader(b))
	d.UseNumber()
	if err := d.Decode(&m); err != nil {
		return nil, err
	}
	return &m, nil
}

// the files that came with the program, unpacked when they are newer than what the folder has (or it has none)
func (a *app) ensureWeb() (string, error) {
	cur, cm := a.current()
	z, err := payload()
	if err != nil {
		if cur != "" {
			return cur, nil
		}
		return "", err
	}
	pm, err := zipManifest(z)
	if err != nil {
		if cur != "" {
			return cur, nil
		}
		return "", err
	}
	if cur != "" && cm != nil && cm.T >= pm.T {
		return cur, nil
	}
	name := "web-" + safe(pm.V)
	dir := filepath.Join(a.data, name)
	_ = os.RemoveAll(dir + ".part")
	if err := unzip(z, dir+".part"); err != nil {
		return "", err
	}
	_ = os.RemoveAll(dir)
	if err := os.Rename(dir+".part", dir); err != nil {
		return "", err
	}
	if err := a.switchTo(name); err != nil {
		return "", err
	}
	return dir, nil
}

func (a *app) switchTo(name string) error {
	tmp := filepath.Join(a.data, "current.txt.part")
	if err := os.WriteFile(tmp, []byte(name), 0o644); err != nil {
		return err
	}
	if err := os.Rename(tmp, filepath.Join(a.data, "current.txt")); err != nil {
		return err
	}
	a.root.Store(filepath.Join(a.data, name))
	// the older copies go (the newest two stay: one may still be read by an open window)
	ents, _ := os.ReadDir(a.data)
	var webs []string
	for _, e := range ents {
		if e.IsDir() && strings.HasPrefix(e.Name(), "web-") && !strings.HasSuffix(e.Name(), ".part") && e.Name() != name {
			webs = append(webs, e.Name())
		}
	}
	sort.Slice(webs, func(i, j int) bool { return modTime(filepath.Join(a.data, webs[i])) > modTime(filepath.Join(a.data, webs[j])) })
	for i, w := range webs {
		if i >= 1 {
			_ = os.RemoveAll(filepath.Join(a.data, w))
		}
	}
	return nil
}

func modTime(p string) int64 { st, err := os.Stat(p); if err != nil { return 0 }; return st.ModTime().Unix() }
func safe(s string) string {
	var b strings.Builder
	for _, c := range s {
		if (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || (c >= '0' && c <= '9') || c == '-' {
			b.WriteRune(c)
		}
	}
	if b.Len() == 0 {
		return "x"
	}
	return b.String()
}

// payload: inside the program (Windows), else payload.zip next to it or in the Mac app's Resources
func payload() (*zip.Reader, error) {
	if len(embedded) > 0 {
		return zip.NewReader(bytes.NewReader(embedded), int64(len(embedded)))
	}
	exe, err := os.Executable()
	if err != nil {
		return nil, err
	}
	if r, e := filepath.EvalSymlinks(exe); e == nil {
		exe = r
	}
	d := filepath.Dir(exe)
	for _, p := range []string{filepath.Join(d, "payload.zip"), filepath.Join(d, "..", "Resources", "payload.zip"), filepath.Join(d, "..", "payload.zip")} {
		if b, err := os.ReadFile(p); err == nil {
			return zip.NewReader(bytes.NewReader(b), int64(len(b)))
		}
	}
	return nil, errors.New("payload.zip not found")
}

func zipManifest(z *zip.Reader) (*manifest, error) {
	for _, f := range z.File {
		if f.Name == appID+"/offline.json" {
			r, err := f.Open()
			if err != nil {
				return nil, err
			}
			defer r.Close()
			var m manifest
			d := json.NewDecoder(r)
			d.UseNumber()
			if err := d.Decode(&m); err != nil {
				return nil, err
			}
			return &m, nil
		}
	}
	return nil, errors.New("no offline.json in the payload")
}

func unzip(z *zip.Reader, dir string) error {
	for _, f := range z.File {
		name := path.Clean(f.Name)
		if strings.HasPrefix(name, "../") || strings.HasPrefix(name, "/") || strings.Contains(name, "/../") {
			continue
		}
		p := filepath.Join(dir, filepath.FromSlash(name))
		if f.FileInfo().IsDir() {
			if err := os.MkdirAll(p, 0o755); err != nil {
				return err
			}
			continue
		}
		if err := os.MkdirAll(filepath.Dir(p), 0o755); err != nil {
			return err
		}
		r, err := f.Open()
		if err != nil {
			return err
		}
		w, err := os.Create(p)
		if err != nil {
			r.Close()
			return err
		}
		_, err = io.Copy(w, r)
		r.Close()
		if e := w.Close(); err == nil {
			err = e
		}
		if err != nil {
			return err
		}
	}
	return nil
}

// ------------------------------------------------------------ online: the newest files and code list
var client = &http.Client{Timeout: 60 * time.Second}

func get(u string) ([]byte, error) {
	r, err := client.Get(u)
	if err != nil {
		return nil, err
	}
	defer r.Body.Close()
	if r.StatusCode != 200 {
		return nil, fmt.Errorf("%s: %s", u, r.Status)
	}
	return io.ReadAll(io.LimitReader(r.Body, 200<<20))
}

func (a *app) setUpd(s string) { a.mu.Lock(); a.upd = s; a.mu.Unlock() }

func (a *app) update() {
	time.Sleep(4 * time.Second) // the window opens first
	a.setUpd("checking")
	if b, err := get(remoteBase + "licences.json?t=" + strconv.FormatInt(time.Now().Unix(), 10)); err == nil && json.Valid(b) {
		_ = os.WriteFile(filepath.Join(a.data, "licences.json"), b, 0o644)
	}
	b, err := get(remoteBase + appID + "/offline.json?t=" + strconv.FormatInt(time.Now().Unix(), 10))
	if err != nil {
		a.setUpd("offline")
		return
	}
	var rm manifest
	d := json.NewDecoder(bytes.NewReader(b))
	d.UseNumber()
	if d.Decode(&rm) != nil || len(rm.Files) == 0 {
		a.setUpd("offline")
		return
	}
	curDir, cm := a.current()
	if cm != nil && cm.T >= rm.T {
		a.setUpd("up to date")
		return
	}
	name := "web-" + safe(rm.V)
	dir := filepath.Join(a.data, name)
	part := dir + ".part"
	_ = os.RemoveAll(part)
	// the files outside the app folder (licences.json, support.html …) come as they are
	if err := copyTree(curDir, part, func(rel string) bool { return !strings.HasPrefix(rel, appID+"/") }); err != nil {
		a.setUpd("failed")
		return
	}
	keys := make([]string, 0, len(rm.Files))
	for k := range rm.Files {
		keys = append(keys, k)
	}
	sort.Strings(keys)
	var total, done int64
	for _, k := range keys {
		total += fsz(rm.Files[k])
	}
	for _, k := range keys {
		want, n := fh(rm.Files[k]), fsz(rm.Files[k])
		dst := filepath.Join(part, appID, filepath.FromSlash(k))
		if err := os.MkdirAll(filepath.Dir(dst), 0o755); err != nil {
			a.setUpd("failed")
			return
		}
		// unchanged: copied from the files in use
		if cm != nil {
			if old, ok := cm.Files[k]; ok && fh(old) == want {
				if copyFile(filepath.Join(curDir, appID, filepath.FromSlash(k)), dst) == nil {
					done += n
					continue
				}
			}
		}
		var body []byte
		var err error
		for try := 0; try < 3; try++ {
			body, err = get(remoteBase + appID + "/" + escPath(k) + "?v=" + want)
			if err == nil && sum(body) == want {
				break
			}
			if err == nil {
				err = errors.New("hash")
			}
			time.Sleep(2 * time.Second)
		}
		if err != nil {
			a.setUpd("failed")
			_ = os.RemoveAll(part)
			return
		}
		if os.WriteFile(dst, body, 0o644) != nil {
			a.setUpd("failed")
			return
		}
		done += n
		if total > 0 {
			a.setUpd(fmt.Sprintf("downloading %d%%", done*100/total))
		}
	}
	if os.WriteFile(filepath.Join(part, appID, "offline.json"), b, 0o644) != nil {
		a.setUpd("failed")
		return
	}
	if sw, err := get(remoteBase + appID + "/sw.js?v=" + safe(rm.V)); err == nil {
		_ = os.WriteFile(filepath.Join(part, appID, "sw.js"), sw, 0o644)
	}
	_ = os.RemoveAll(dir)
	if os.Rename(part, dir) != nil {
		a.setUpd("failed")
		return
	}
	if a.switchTo(name) == nil {
		a.setUpd("ready " + rm.V)
	}
}

func escPath(k string) string {
	parts := strings.Split(k, "/")
	for i, p := range parts {
		parts[i] = strings.ReplaceAll(urlEscape(p), "+", "%20")
	}
	return strings.Join(parts, "/")
}
func urlEscape(s string) string {
	var b strings.Builder
	for i := 0; i < len(s); i++ {
		c := s[i]
		if (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || (c >= '0' && c <= '9') || strings.IndexByte("-_.~", c) >= 0 {
			b.WriteByte(c)
		} else {
			fmt.Fprintf(&b, "%%%02X", c)
		}
	}
	return b.String()
}
func sum(b []byte) string { h := sha1.Sum(b); return hex.EncodeToString(h[:])[:12] }

func copyFile(src, dst string) error {
	in, err := os.Open(src)
	if err != nil {
		return err
	}
	defer in.Close()
	out, err := os.Create(dst)
	if err != nil {
		return err
	}
	if _, err := io.Copy(out, in); err != nil {
		out.Close()
		return err
	}
	return out.Close()
}

func copyTree(src, dst string, want func(rel string) bool) error {
	if src == "" {
		return os.MkdirAll(dst, 0o755)
	}
	return filepath.Walk(src, func(p string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		rel, _ := filepath.Rel(src, p)
		rel = filepath.ToSlash(rel)
		if info.IsDir() {
			return os.MkdirAll(filepath.Join(dst, rel), 0o755)
		}
		if !want(rel) {
			return nil
		}
		return copyFile(p, filepath.Join(dst, rel))
	})
}

// ------------------------------------------------------------ serving (this computer only)
func listen() (net.Listener, string, bool) {
	first, _ := strconv.Atoi(port)
	for p := first; p < first+10; p++ {
		url := fmt.Sprintf("http://127.0.0.1:%d/%s/", p, appID)
		ln, err := net.Listen("tcp4", "127.0.0.1:"+strconv.Itoa(p))
		if err == nil {
			return ln, url, false
		}
		c := http.Client{Timeout: 1500 * time.Millisecond}
		if r, err := c.Get(fmt.Sprintf("http://127.0.0.1:%d/__duet.json", p)); err == nil {
			b, _ := io.ReadAll(io.LimitReader(r.Body, 4096))
			r.Body.Close()
			if bytes.Contains(b, []byte(`"app":"`+appID+`"`)) {
				return nil, url, true
			}
		}
	}
	return nil, "", false
}

var mimes = map[string]string{
	".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript; charset=utf-8",
	".json": "application/json", ".webmanifest": "application/manifest+json", ".css": "text/css; charset=utf-8",
	".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".svg": "image/svg+xml",
	".gif": "image/gif", ".ico": "image/x-icon", ".woff2": "font/woff2", ".woff": "font/woff", ".ttf": "font/ttf",
	".hdr": "application/octet-stream", ".glb": "model/gltf-binary", ".gltf": "model/gltf+json", ".bin": "application/octet-stream",
	".wasm": "application/wasm", ".mp3": "audio/mpeg", ".mp4": "video/mp4", ".webm": "video/webm", ".ktx2": "image/ktx2",
	".txt": "text/plain; charset=utf-8", ".csv": "text/csv; charset=utf-8", ".py": "text/plain; charset=utf-8", ".ino": "text/plain; charset=utf-8",
}

func (a *app) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	a.lastHit.Store(time.Now().Unix())
	if r.Method != http.MethodGet && r.Method != http.MethodHead {
		http.Error(w, "method", http.StatusMethodNotAllowed)
		return
	}
	p := path.Clean("/" + r.URL.Path)
	h := w.Header()
	h.Set("X-Content-Type-Options", "nosniff")
	switch {
	case p == "/":
		http.Redirect(w, r, "/"+appID+"/", http.StatusFound)
		return
	case p == "/__duet.json":
		a.mu.Lock()
		u := a.upd
		a.mu.Unlock()
		h.Set("Content-Type", "application/json")
		h.Set("Cache-Control", "no-store")
		_ = json.NewEncoder(w).Encode(map[string]string{"app": appID, "name": appName, "version": version, "update": u, "os": runtime.GOOS})
		return
	case p == "/licences.json":
		h.Set("Content-Type", "application/json")
		h.Set("Cache-Control", "no-store")
		for _, f := range []string{filepath.Join(a.data, "licences.json"), filepath.Join(a.web(), "licences.json")} {
			if b, err := os.ReadFile(f); err == nil && json.Valid(b) {
				_, _ = w.Write(b)
				return
			}
		}
		_, _ = w.Write([]byte("{}"))
		return
	}
	for _, seg := range strings.Split(p, "/") {
		if strings.HasPrefix(seg, ".") {
			http.NotFound(w, r)
			return
		}
	}
	f := filepath.Join(a.web(), filepath.FromSlash(strings.TrimPrefix(p, "/")))
	st, err := os.Stat(f)
	if err == nil && st.IsDir() {
		if !strings.HasSuffix(r.URL.Path, "/") {
			http.Redirect(w, r, r.URL.Path+"/", http.StatusMovedPermanently)
			return
		}
		f = filepath.Join(f, "index.html")
		st, err = os.Stat(f)
	}
	if err != nil || st.IsDir() {
		http.NotFound(w, r)
		return
	}
	if m, ok := mimes[strings.ToLower(filepath.Ext(f))]; ok {
		h.Set("Content-Type", m)
	} else {
		h.Set("Content-Type", "application/octet-stream")
	}
	if strings.HasSuffix(f, "sw.js") || strings.HasSuffix(f, "offline.json") || strings.HasSuffix(f, ".html") {
		h.Set("Cache-Control", "no-cache")
	}
	fh, err := os.Open(f)
	if err != nil {
		http.NotFound(w, r)
		return
	}
	defer fh.Close()
	http.ServeContent(w, r, "", st.ModTime(), fh) // (Range for audio and video)
}

// ------------------------------------------------------------ helpers
func start(exe string, args []string) {
	c := exec.Command(exe, args...)
	hideWindow(c)
	_ = c.Start()
}

// chromium: the browsers that can open an app window, in order
func browserArgs(url, data string) []string {
	return []string{"--app=" + url, "--user-data-dir=" + filepath.Join(data, "browser"), "--no-first-run", "--no-default-browser-check",
		"--disable-features=Translate,SigninInterceptBubble", "--start-maximized", "--autoplay-policy=no-user-gesture-required"}
}

// openApp: the app window. wait: block while it is open (true when the window could be followed)
func openApp(url, data string, wait bool) bool {
	for _, b := range browsers() {
		c := exec.Command(b, browserArgs(url, data)...)
		if c.Start() != nil {
			continue
		}
		if !wait {
			go func() { _ = c.Wait() }()
			return true
		}
		t0 := time.Now()
		_ = c.Wait()
		// a quick end: the window was handed to a browser that was already running (we cannot see it close; the caller
		// then serves while the app is in use)
		return time.Since(t0) > 4*time.Second
	}
	openDefault(url)
	return false
}

func fail(en, hi string) {
	alert(appName, en+"\n\n"+hi)
	os.Exit(1)
}
