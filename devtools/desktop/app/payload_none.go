//go:build !embedpayload

package main

// macOS and Linux: payload.zip lies next to the program (the Mac app's Resources)
var embedded []byte
