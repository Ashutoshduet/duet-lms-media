//go:build embedpayload

package main

import _ "embed"

// the Windows Setup carries the app's files inside the program (one file to download or copy)
//
//go:embed payload.zip
var embedded []byte
