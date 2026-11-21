// Makes the Windows resources of the DUET STEM desktop app (rsrc_windows_amd64.syso): its icon, its manifest
// (no admin rights, sharp on high-DPI screens, the modern message boxes) and its version information.
//   go run . -ico icon.ico -out ../app/rsrc_windows_amd64.syso -name "Robotics Lab 360" -exe RoboticsLab360 -ver 1.0.0
package main

import (
	"flag"
	"log"
	"os"
	"strconv"
	"strings"

	"github.com/tc-hib/winres"
	"github.com/tc-hib/winres/version"
)

func main() {
	ico := flag.String("ico", "", "the icon (.ico)")
	out := flag.String("out", "rsrc_windows_amd64.syso", "the .syso file")
	name := flag.String("name", "Robotics Lab 360", "product name")
	exe := flag.String("exe", "RoboticsLab360", "file name without .exe")
	ver := flag.String("ver", "1.0.0", "version a.b.c")
	flag.Parse()
	rs := winres.ResourceSet{}
	f, err := os.Open(*ico)
	if err != nil {
		log.Fatal(err)
	}
	icon, err := winres.LoadICO(f)
	f.Close()
	if err != nil {
		log.Fatal(err)
	}
	if err := rs.SetIcon(winres.Name("APPICON"), icon); err != nil {
		log.Fatal(err)
	}
	rs.SetManifest(winres.AppManifest{
		Identity:            winres.AssemblyIdentity{Name: "DUETSTEM." + *exe},
		Description:         *name,
		ExecutionLevel:      winres.AsInvoker,
		DPIAwareness:        winres.DPIPerMonitorV2,
		UseCommonControlsV6: true,
	})
	p := [4]uint16{}
	for i, s := range strings.Split(*ver, ".") {
		if i < 4 {
			n, _ := strconv.Atoi(s)
			p[i] = uint16(n)
		}
	}
	v := version.Info{}
	v.SetFileVersion(*ver)
	v.SetProductVersion(*ver)
	v.FileVersion = p
	v.ProductVersion = p
	for k, s := range map[string]string{
		version.CompanyName: "DUET STEM (AIVAN360 Solution Pvt Ltd)", version.FileDescription: *name + " · DUET STEM",
		version.ProductName: *name, version.OriginalFilename: *exe + ".exe", version.InternalName: *exe,
		version.LegalCopyright: "© DUET STEM", version.FileVersion: *ver, version.ProductVersion: *ver,
	} {
		_ = v.Set(0x0409, k, s)
	}
	rs.SetVersionInfo(v)
	w, err := os.Create(*out)
	if err != nil {
		log.Fatal(err)
	}
	defer w.Close()
	if err := rs.WriteObject(w, winres.ArchAMD64); err != nil {
		log.Fatal(err)
	}
}
