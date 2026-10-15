"""Serve Solar System 360 on http://localhost:8080 (for Meta Quest over USB, or testing on this PC)."""
import http.server, socketserver, os
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
H = http.server.SimpleHTTPRequestHandler
H.extensions_map.update({".js": "text/javascript", ".webmanifest": "application/manifest+json", ".woff2": "font/woff2",
                         ".css": "text/css", ".json": "application/json", ".png": "image/png", ".jpg": "image/jpeg", ".html": "text/html"})
socketserver.TCPServer.allow_reuse_address = True
with socketserver.TCPServer(("127.0.0.1", 8080), H) as s:
    print("Solar System 360 is running at http://localhost:8080   (close this window to stop)")
    s.serve_forever()
