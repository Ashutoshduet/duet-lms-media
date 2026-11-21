//go:build windows

package main

import (
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"syscall"
	"unsafe"

	ole "github.com/go-ole/go-ole"
	"github.com/go-ole/go-ole/oleutil"
	"golang.org/x/sys/windows"
	"golang.org/x/sys/windows/registry"
)

var user32 = syscall.NewLazyDLL("user32.dll")

const uninstKey = `Software\Microsoft\Windows\CurrentVersion\Uninstall\DUET-`

func dataDir() string {
	b := os.Getenv("LOCALAPPDATA")
	if b == "" {
		b, _ = os.UserConfigDir()
	}
	return filepath.Join(b, "DUET STEM", appName)
}

// install: a start from anywhere but the app folder is the Setup: the program goes into the app folder (an older one is
// replaced), with its shortcuts and its Settings > Apps entry. Then the installed program starts.
func install(data string) (string, bool) {
	exe, err := os.Executable()
	if err != nil {
		return "", false
	}
	if r, e := filepath.EvalSymlinks(exe); e == nil {
		exe = r
	}
	bin := filepath.Join(data, "bin")
	target := filepath.Join(bin, exeName+".exe")
	if strings.EqualFold(filepath.Clean(exe), filepath.Clean(target)) {
		return "", false
	}
	if err := os.MkdirAll(bin, 0o755); err != nil {
		fail("Could not install: "+err.Error(), "इंस्टॉल नहीं हो सका: "+err.Error())
	}
	if err := copyFile(exe, target+".new"); err != nil {
		fail("Could not install: "+err.Error(), "इंस्टॉल नहीं हो सका: "+err.Error())
	}
	_ = os.Remove(target)
	if err := os.Rename(target+".new", target); err != nil {
		_ = os.Remove(target + ".new")
		fail(appName+" is open. Close its window, then run the Setup again.", appName+" खुला है। उसकी खिड़की बंद कीजिए, फिर Setup दोबारा चलाइए।")
	}
	shortcuts(target, bin)
	uninstallEntry(target, data)
	return target, true
}

func knownFolder(id *windows.KNOWNFOLDERID) string {
	p, err := windows.KnownFolderPath(id, 0)
	if err != nil {
		return ""
	}
	return p
}

func shortcutPaths() []string {
	var out []string
	if d := knownFolder(windows.FOLDERID_Desktop); d != "" {
		out = append(out, filepath.Join(d, appName+".lnk"))
	}
	if d := knownFolder(windows.FOLDERID_Programs); d != "" {
		out = append(out, filepath.Join(d, "DUET STEM", appName+".lnk"))
	}
	return out
}

func shortcuts(target, dir string) {
	if err := ole.CoInitializeEx(0, ole.COINIT_APARTMENTTHREADED); err != nil {
		if oe, ok := err.(*ole.OleError); !ok || (oe.Code() != 1 && oe.Code() != 0) { // S_FALSE: already
			return
		}
	}
	defer ole.CoUninitialize()
	u, err := oleutil.CreateObject("WScript.Shell")
	if err != nil {
		return
	}
	defer u.Release()
	sh, err := u.QueryInterface(ole.IID_IDispatch)
	if err != nil {
		return
	}
	defer sh.Release()
	for _, lnk := range shortcutPaths() {
		_ = os.MkdirAll(filepath.Dir(lnk), 0o755)
		v, err := oleutil.CallMethod(sh, "CreateShortcut", lnk)
		if err != nil {
			continue
		}
		s := v.ToIDispatch()
		_, _ = oleutil.PutProperty(s, "TargetPath", target)
		_, _ = oleutil.PutProperty(s, "WorkingDirectory", dir)
		_, _ = oleutil.PutProperty(s, "IconLocation", target+",0")
		_, _ = oleutil.PutProperty(s, "Description", appName+" · DUET STEM")
		_, _ = oleutil.CallMethod(s, "Save")
		s.Release()
	}
}

func uninstallEntry(target, data string) {
	k, _, err := registry.CreateKey(registry.CURRENT_USER, uninstKey+exeName, registry.ALL_ACCESS)
	if err != nil {
		return
	}
	defer k.Close()
	_ = k.SetStringValue("DisplayName", appName+" (DUET STEM)")
	_ = k.SetStringValue("DisplayIcon", target+",0")
	_ = k.SetStringValue("DisplayVersion", version)
	_ = k.SetStringValue("Publisher", "DUET STEM")
	_ = k.SetStringValue("URLInfoAbout", remoteBase+appID+"/")
	_ = k.SetStringValue("InstallLocation", data)
	_ = k.SetStringValue("UninstallString", `"`+target+`" --uninstall`)
	_ = k.SetDWordValue("NoModify", 1)
	_ = k.SetDWordValue("NoRepair", 1)
	if st, err := os.Stat(target); err == nil {
		_ = k.SetDWordValue("EstimatedSize", uint32(st.Size()/1024*3))
	}
}

func doUninstall(data string) {
	if !confirm(appName, "Remove "+appName+" from this computer?\nThe students' saved work on this computer is removed too.\n\n"+
		appName+" को इस कंप्यूटर से हटाएँ?\nइस कंप्यूटर पर सहेजा गया विद्यार्थियों का काम भी हट जाएगा।") {
		return
	}
	for _, l := range shortcutPaths() {
		_ = os.Remove(l)
	}
	if d := knownFolder(windows.FOLDERID_Programs); d != "" {
		_ = os.Remove(filepath.Join(d, "DUET STEM")) // (only when empty)
	}
	_ = registry.DeleteKey(registry.CURRENT_USER, uninstKey+exeName)
	// the running program is in the folder: a hidden cmd removes it a moment after this program ends
	c := exec.Command("cmd", "/c", "ping 127.0.0.1 -n 3 >nul & rmdir /s /q \""+data+"\"")
	c.SysProcAttr = &syscall.SysProcAttr{HideWindow: true, CreationFlags: 0x08000000 | 0x00000008} // CREATE_NO_WINDOW | DETACHED_PROCESS
	_ = c.Start()
	alert(appName, appName+" has been removed.\n"+appName+" हटा दिया गया।")
}

func browsers() []string {
	var dirs []string
	for _, k := range []string{"ProgramFiles", "ProgramW6432", "ProgramFiles(x86)", "LocalAppData"} {
		if v := os.Getenv(k); v != "" {
			dirs = append(dirs, v)
		}
	}
	var out []string
	for _, rel := range []string{`Google\Chrome\Application\chrome.exe`, `Microsoft\Edge\Application\msedge.exe`, `BraveSoftware\Brave-Browser\Application\brave.exe`} {
		for _, d := range dirs {
			if p := filepath.Join(d, rel); isFile(p) {
				out = append(out, p)
			}
		}
	}
	return out
}

func isFile(p string) bool { st, err := os.Stat(p); return err == nil && !st.IsDir() }

func openDefault(url string) { _ = exec.Command("rundll32", "url.dll,FileProtocolHandler", url).Start() }

func hideWindow(c *exec.Cmd) { c.SysProcAttr = &syscall.SysProcAttr{HideWindow: true} }

func msgBox(title, text string, flags uintptr) int {
	t, _ := syscall.UTF16PtrFromString(title)
	m, _ := syscall.UTF16PtrFromString(text)
	r, _, _ := user32.NewProc("MessageBoxW").Call(0, uintptr(unsafe.Pointer(m)), uintptr(unsafe.Pointer(t)), flags)
	return int(r)
}

func alert(title, text string) { msgBox(title, text, 0x40|0x10000) } // MB_ICONINFORMATION | MB_SETFOREGROUND

func confirm(title, text string) bool { return msgBox(title, text, 0x4|0x20|0x10000) == 6 } // MB_YESNO | MB_ICONQUESTION -> IDYES
