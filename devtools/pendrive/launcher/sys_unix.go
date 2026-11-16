//go:build !windows

package main

import (
	"os"
	"os/exec"
	"regexp"
	"runtime"
	"strings"
)

// machineID: /etc/machine-id (Linux), the IOPlatformUUID (macOS)
func machineID() string {
	if runtime.GOOS == "darwin" {
		out, err := exec.Command("/usr/sbin/ioreg", "-rd1", "-c", "IOPlatformExpertDevice").Output()
		if err == nil {
			if m := regexp.MustCompile(`"IOPlatformUUID"\s*=\s*"([^"]+)"`).FindSubmatch(out); m != nil {
				return strings.ToLower(string(m[1]))
			}
		}
		return ""
	}
	for _, p := range []string{"/etc/machine-id", "/var/lib/dbus/machine-id"} {
		if b, err := os.ReadFile(p); err == nil {
			if v := strings.ToLower(strings.TrimSpace(string(b))); v != "" {
				return v
			}
		}
	}
	return ""
}

func setTitle(t string) { // a terminal's title (not into a log file)
	if st, err := os.Stdout.Stat(); err == nil && st.Mode()&os.ModeCharDevice != 0 {
		_, _ = os.Stdout.WriteString("\x1b]0;" + t + "\x07")
	}
}

func hideFile(p string) {}

// openBrowser: Chrome, Chromium or Edge as an app window (no address bar, no tabs), else the default browser
func openBrowser(url string, full bool) {
	args := []string{"--app=" + url, "--start-maximized", "--no-first-run"}
	if full {
		args = append(args, "--start-fullscreen")
	}
	if runtime.GOOS == "darwin" {
		for _, app := range []string{"Google Chrome", "Microsoft Edge", "Chromium"} {
			if _, err := os.Stat("/Applications/" + app + ".app"); err == nil {
				if exec.Command("open", append([]string{"-na", app, "--args"}, args...)...).Start() == nil {
					return
				}
			}
		}
		_ = exec.Command("open", url).Start()
		return
	}
	for _, b := range []string{"google-chrome", "google-chrome-stable", "chromium", "chromium-browser", "microsoft-edge", "microsoft-edge-stable"} {
		if p, err := exec.LookPath(b); err == nil {
			c := exec.Command(p, args...)
			c.Stdout, c.Stderr = nil, nil
			if c.Start() == nil {
				go func() { _ = c.Wait() }()
				return
			}
		}
	}
	for _, o := range []string{"xdg-open", "gio", "sensible-browser", "x-www-browser", "firefox"} {
		if p, err := exec.LookPath(o); err == nil {
			a := []string{url}
			if o == "gio" {
				a = []string{"open", url}
			}
			c := exec.Command(p, a...)
			if c.Start() == nil {
				go func() { _ = c.Wait() }()
				return
			}
		}
	}
}
