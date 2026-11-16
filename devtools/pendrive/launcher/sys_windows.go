//go:build windows

package main

import (
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"syscall"
	"unsafe"
)

var kernel32 = syscall.NewLazyDLL("kernel32.dll")

// machineID: HKLM\SOFTWARE\Microsoft\Cryptography\MachineGuid (the 64-bit view, also from the 32-bit program)
func machineID() string {
	var h syscall.Handle
	key, _ := syscall.UTF16PtrFromString(`SOFTWARE\Microsoft\Cryptography`)
	if syscall.RegOpenKeyEx(syscall.HKEY_LOCAL_MACHINE, key, 0, syscall.KEY_READ|syscall.KEY_WOW64_64KEY, &h) != nil {
		if syscall.RegOpenKeyEx(syscall.HKEY_LOCAL_MACHINE, key, 0, syscall.KEY_READ, &h) != nil {
			return ""
		}
	}
	defer syscall.RegCloseKey(h)
	name, _ := syscall.UTF16PtrFromString("MachineGuid")
	var typ uint32
	buf := make([]uint16, 128)
	n := uint32(len(buf) * 2)
	if syscall.RegQueryValueEx(h, name, nil, &typ, (*byte)(unsafe.Pointer(&buf[0])), &n) != nil {
		return ""
	}
	return strings.ToLower(strings.TrimSpace(syscall.UTF16ToString(buf)))
}

func setTitle(t string) {
	p, err := syscall.UTF16PtrFromString(t)
	if err != nil {
		return
	}
	_, _, _ = kernel32.NewProc("SetConsoleTitleW").Call(uintptr(unsafe.Pointer(p)))
}

// hideFile: hidden, system and read-only, so the lock is not deleted by mistake
func hideFile(p string) {
	if u, err := syscall.UTF16PtrFromString(p); err == nil {
		_ = syscall.SetFileAttributes(u, syscall.FILE_ATTRIBUTE_HIDDEN|syscall.FILE_ATTRIBUTE_SYSTEM|syscall.FILE_ATTRIBUTE_READONLY)
	}
}

// openBrowser: Chrome or Edge as an app window (no address bar, no tabs), else the default browser
func openBrowser(url string, full bool) {
	var dirs []string
	for _, k := range []string{"ProgramFiles", "ProgramW6432", "ProgramFiles(x86)", "LocalAppData"} {
		if v := os.Getenv(k); v != "" {
			dirs = append(dirs, v)
		}
	}
	var cands []string
	for _, d := range dirs {
		cands = append(cands, filepath.Join(d, `Google\Chrome\Application\chrome.exe`))
	}
	for _, d := range dirs {
		cands = append(cands, filepath.Join(d, `Microsoft\Edge\Application\msedge.exe`))
	}
	args := []string{"--app=" + url, "--start-maximized", "--no-first-run", "--disable-features=Translate"}
	if full {
		args = append(args, "--start-fullscreen")
	}
	for _, c := range cands {
		if isFile(c) {
			if exec.Command(c, args...).Start() == nil {
				return
			}
		}
	}
	_ = exec.Command("rundll32", "url.dll,FileProtocolHandler", url).Start()
}
