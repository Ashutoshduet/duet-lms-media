//go:build !windows

package main

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
)

func dataDir() string {
	h, _ := os.UserHomeDir()
	if runtime.GOOS == "darwin" {
		return filepath.Join(h, "Library", "Application Support", "DUET STEM", appName)
	}
	if x := os.Getenv("XDG_DATA_HOME"); x != "" {
		return filepath.Join(x, "duet-stem", appID)
	}
	return filepath.Join(h, ".local", "share", "duet-stem", appID)
}

func isFile(p string) bool { st, err := os.Stat(p); return err == nil && !st.IsDir() }

// install: macOS needs none (the .app is dragged to Applications). Linux: the first start from the unpacked folder copies
// the program, payload.zip and the icon into the app folder and makes the menu and Desktop entries.
func install(data string) (string, bool) {
	if runtime.GOOS == "darwin" {
		return "", false
	}
	exe, err := os.Executable()
	if err != nil {
		return "", false
	}
	if r, e := filepath.EvalSymlinks(exe); e == nil {
		exe = r
	}
	bin := filepath.Join(data, "bin")
	target := filepath.Join(bin, exeName)
	if filepath.Clean(exe) == filepath.Clean(target) {
		return "", false
	}
	src := filepath.Dir(exe)
	if !isFile(filepath.Join(src, "payload.zip")) { // run from somewhere else without its files: just run
		return "", false
	}
	if err := os.MkdirAll(bin, 0o755); err != nil {
		return "", false
	}
	for _, f := range []string{"payload.zip", "icon.png"} {
		if isFile(filepath.Join(src, f)) {
			_ = copyFile(filepath.Join(src, f), filepath.Join(bin, f+".new"))
			_ = os.Rename(filepath.Join(bin, f+".new"), filepath.Join(bin, f))
		}
	}
	if err := copyFile(exe, target+".new"); err != nil {
		return "", false
	}
	_ = os.Chmod(target+".new", 0o755)
	if err := os.Rename(target+".new", target); err != nil {
		return "", false
	}
	desk := fmt.Sprintf("[Desktop Entry]\nType=Application\nName=%s\nGenericName=DUET STEM\nComment=%s · DUET STEM (works offline)\nExec=\"%s\"\nIcon=%s\nTerminal=false\nCategories=Education;Science;\nStartupNotify=true\n",
		appName, appName, target, filepath.Join(bin, "icon.png"))
	h, _ := os.UserHomeDir()
	apps := filepath.Join(h, ".local", "share", "applications")
	_ = os.MkdirAll(apps, 0o755)
	_ = os.WriteFile(filepath.Join(apps, "duet-"+appID+".desktop"), []byte(desk), 0o755)
	if d := desktopDir(h); d != "" {
		p := filepath.Join(d, "duet-"+appID+".desktop")
		if os.WriteFile(p, []byte(desk), 0o755) == nil {
			_ = exec.Command("gio", "set", p, "metadata::trusted", "true").Run() // (GNOME: the icon can be started)
		}
	}
	return target, true
}

func desktopDir(home string) string {
	if out, err := exec.Command("xdg-user-dir", "DESKTOP").Output(); err == nil {
		if d := strings.TrimSpace(string(out)); d != "" && d != home {
			return d
		}
	}
	if st, err := os.Stat(filepath.Join(home, "Desktop")); err == nil && st.IsDir() {
		return filepath.Join(home, "Desktop")
	}
	return ""
}

func doUninstall(data string) {
	h, _ := os.UserHomeDir()
	_ = os.Remove(filepath.Join(h, ".local", "share", "applications", "duet-"+appID+".desktop"))
	if d := desktopDir(h); d != "" {
		_ = os.Remove(filepath.Join(d, "duet-"+appID+".desktop"))
	}
	_ = os.RemoveAll(data)
	if runtime.GOOS == "darwin" {
		alert(appName, appName+"'s files have been removed. Drag the app from Applications to the Bin to finish.")
		return
	}
	alert(appName, appName+" has been removed.")
}

func browsers() []string {
	var out []string
	if runtime.GOOS == "darwin" {
		h, _ := os.UserHomeDir()
		for _, a := range []string{"Google Chrome.app/Contents/MacOS/Google Chrome", "Microsoft Edge.app/Contents/MacOS/Microsoft Edge", "Chromium.app/Contents/MacOS/Chromium", "Brave Browser.app/Contents/MacOS/Brave Browser"} {
			for _, d := range []string{"/Applications", filepath.Join(h, "Applications")} {
				if p := filepath.Join(d, a); isFile(p) {
					out = append(out, p)
				}
			}
		}
		return out
	}
	for _, b := range []string{"google-chrome", "google-chrome-stable", "chromium", "chromium-browser", "microsoft-edge", "microsoft-edge-stable", "brave-browser"} {
		if p, err := exec.LookPath(b); err == nil {
			out = append(out, p)
		}
	}
	return out
}

func openDefault(url string) {
	if runtime.GOOS == "darwin" {
		_ = exec.Command("open", url).Start()
		return
	}
	for _, o := range []string{"xdg-open", "gio", "sensible-browser", "x-www-browser", "firefox"} {
		if p, err := exec.LookPath(o); err == nil {
			a := []string{url}
			if o == "gio" {
				a = []string{"open", url}
			}
			if exec.Command(p, a...).Start() == nil {
				return
			}
		}
	}
}

func hideWindow(c *exec.Cmd) {}

func alert(title, text string) {
	if runtime.GOOS == "darwin" {
		q := func(s string) string { return strings.ReplaceAll(strings.ReplaceAll(s, `\`, `\\`), `"`, `\"`) }
		_ = exec.Command("osascript", "-e", `display alert "`+q(title)+`" message "`+q(text)+`"`).Run()
		return
	}
	if p, err := exec.LookPath("zenity"); err == nil {
		_ = exec.Command(p, "--info", "--title="+title, "--text="+text).Run()
		return
	}
	fmt.Fprintln(os.Stderr, title+": "+text)
}
