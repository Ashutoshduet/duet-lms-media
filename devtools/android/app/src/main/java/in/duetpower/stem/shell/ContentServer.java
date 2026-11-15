package in.duetpower.stem.shell;

import android.content.Context;
import android.content.res.AssetManager;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;

import org.json.JSONObject;

import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FilterInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

/**
 * Serves the web app from inside the install, at https://appassets.androidplatform.net/app/...
 * Files come from the bundled copy, or from a newer version the Updater saved earlier (only the files that
 * changed). The school code list is read live when online and from the bundled copy otherwise.
 */
final class ContentServer {
    static final String HOST = "appassets.androidplatform.net";
    static final String START = "https://" + HOST + "/app/index.html";

    private final AssetManager assets;
    private final Map<String, String> bundled;   // path -> hash of the copy inside the install
    private final Map<String, String> overlay;   // path -> hash of the newer saved copy (empty if none)
    private final File overlayDir;
    private final File lastList;                 // the code list as last seen online
    private final android.net.ConnectivityManager net;

    ContentServer(Context ctx) {
        assets = ctx.getAssets();
        lastList = new File(ctx.getFilesDir(), "licences-last.json");
        net = (android.net.ConnectivityManager) ctx.getSystemService(Context.CONNECTIVITY_SERVICE);
        String bt = Updater.readAsset(assets, "app/offline.json");
        bundled = Updater.readFiles(bt);
        String bv = ""; try { bv = new JSONObject(bt).getString("v"); } catch (Exception ignored) { /* none */ }
        Updater.Active a = Updater.active(ctx, bv);
        overlay = a == null ? new HashMap<>() : a.files;
        overlayDir = a == null ? null : a.dir;
    }

    WebResourceResponse serve(WebResourceRequest req) {
        String path = req.getUrl().getPath();
        if (path == null) return null;
        try {
            if (path.equals("/licences.json")) return licences("1".equals(req.getUrl().getQueryParameter("live")));
            if (!path.startsWith("/app/")) return notFound();
            String rel = path.substring(5);
            if (rel.isEmpty() || rel.endsWith("/")) rel += "index.html";
            if (rel.equals("sw.js")) return notFound(); // the app itself keeps the files: no service worker
            InputStream in; long size;
            String oh = overlay.get(rel);
            if (oh != null && overlayDir != null && !oh.equals(bundled.get(rel))) {
                File f = new File(overlayDir, rel);
                in = new FileInputStream(f); size = f.length();
            } else {
                try { in = assets.open("app/" + rel, AssetManager.ACCESS_STREAMING); } catch (IOException e) { return notFound(); }
                size = -1;
                try (android.content.res.AssetFileDescriptor fd = assets.openFd("app/" + rel)) { size = fd.getLength(); } catch (IOException ignored) { /* compressed: size unknown */ }
            }
            return respond(req, rel, in, size);
        } catch (Exception e) {
            return notFound();
        }
    }

    private WebResourceResponse respond(WebResourceRequest req, String rel, InputStream in, long size) throws IOException {
        Map<String, String> h = new HashMap<>();
        h.put("Cache-Control", "no-cache");
        h.put("Access-Control-Allow-Origin", "*");
        String range = req.getRequestHeaders() == null ? null : req.getRequestHeaders().get("Range");
        if (range == null) range = req.getRequestHeaders() == null ? null : req.getRequestHeaders().get("range");
        if (range != null && size > 0) { // video and audio seek inside the file
            java.util.regex.Matcher m = java.util.regex.Pattern.compile("bytes=(\\d*)-(\\d*)").matcher(range);
            if (m.find()) {
                long s = m.group(1).isEmpty() ? 0 : Long.parseLong(m.group(1));
                long e = m.group(2).isEmpty() ? size - 1 : Math.min(Long.parseLong(m.group(2)), size - 1);
                long skipped = 0; while (skipped < s) { long k = in.skip(s - skipped); if (k <= 0) break; skipped += k; }
                h.put("Content-Range", "bytes " + s + "-" + e + "/" + size);
                h.put("Accept-Ranges", "bytes");
                h.put("Content-Length", String.valueOf(e - s + 1));
                return new WebResourceResponse(mime(rel), null, 206, "Partial Content", h, new Limited(in, e - s + 1));
            }
        }
        if (size > 0) { h.put("Content-Length", String.valueOf(size)); h.put("Accept-Ranges", "bytes"); }
        return new WebResourceResponse(mime(rel), null, 200, "OK", h, in);
    }

    /** The list of school codes (renewals, new schools). The app's own checks get, at once, the last list seen online (or the
     *  bundled one) while a newer one is fetched in the background for next time: starting never waits for the network.
     *  A code being typed in (live) gets the list from the internet, with a time limit, and the saved copy if that fails. */
    private WebResourceResponse licences(boolean live) {
        byte[] body = null;
        if (live) body = fetchList();
        else if (refreshing.compareAndSet(false, true)) new Thread(() -> { try { fetchList(); } finally { refreshing.set(false); } }, "duet-list").start();
        if (body == null && lastList.exists()) try { body = Updater.readFile(lastList); new JSONObject(new String(body, "UTF-8")); } catch (Exception e) { body = null; }
        if (body == null) {
            try (InputStream in = assets.open("licences.json")) { body = Updater.readAll(in); } catch (IOException e) { return notFound(); }
        }
        Map<String, String> h = new HashMap<>(); h.put("Cache-Control", "no-store");
        return new WebResourceResponse("application/json", "utf-8", 200, "OK", h, new ByteArrayInputStream(body));
    }

    private final java.util.concurrent.atomic.AtomicBoolean refreshing = new java.util.concurrent.atomic.AtomicBoolean();
    /** the list from the internet, saved for the next start; null when offline or it takes too long */
    private synchronized byte[] fetchList() {
        if (!online()) return null;
        try {
            HttpURLConnection c = (HttpURLConnection) new URL(BuildConfig.REMOTE_BASE + "licences.json?t=" + System.currentTimeMillis()).openConnection();
            c.setConnectTimeout(4000); c.setReadTimeout(4000); c.setUseCaches(false);
            byte[] body = null;
            if (c.getResponseCode() == 200) { try (InputStream in = c.getInputStream()) { body = Updater.readAll(in); } new JSONObject(new String(body, "UTF-8")); }
            c.disconnect();
            if (body != null) {
                File tmp = new File(lastList.getPath() + ".tmp");
                try (java.io.OutputStream os = new java.io.FileOutputStream(tmp)) { os.write(body); }
                if (!tmp.renameTo(lastList)) tmp.delete();
            }
            return body;
        } catch (Exception e) { return null; }
    }

    /** a network that reaches the internet (Wi-Fi without internet, or no network at all: false) */
    private boolean online() {
        try {
            if (net == null) return true;
            android.net.Network n = net.getActiveNetwork(); if (n == null) return false;
            android.net.NetworkCapabilities c = net.getNetworkCapabilities(n);
            return c != null && c.hasCapability(android.net.NetworkCapabilities.NET_CAPABILITY_INTERNET) && c.hasCapability(android.net.NetworkCapabilities.NET_CAPABILITY_VALIDATED);
        } catch (Exception e) { return true; }
    }

    private static WebResourceResponse notFound() {
        return new WebResourceResponse("text/plain", "utf-8", 404, "Not Found", new HashMap<>(), new ByteArrayInputStream(new byte[0]));
    }

    static String mime(String p) {
        String x = p.substring(p.lastIndexOf('.') + 1).toLowerCase(Locale.ROOT);
        switch (x) {
            case "html": case "htm": return "text/html";
            case "js": case "mjs": return "text/javascript";
            case "json": return "application/json";
            case "webmanifest": return "application/manifest+json";
            case "css": return "text/css";
            case "svg": return "image/svg+xml";
            case "png": return "image/png";
            case "jpg": case "jpeg": return "image/jpeg";
            case "webp": return "image/webp";
            case "gif": return "image/gif";
            case "ico": return "image/x-icon";
            case "glb": return "model/gltf-binary";
            case "gltf": return "model/gltf+json";
            case "bin": return "application/octet-stream";
            case "mp3": return "audio/mpeg";
            case "ogg": return "audio/ogg";
            case "wav": return "audio/wav";
            case "mp4": return "video/mp4";
            case "webm": return "video/webm";
            case "woff2": return "font/woff2";
            case "woff": return "font/woff";
            case "ttf": return "font/ttf";
            case "wasm": return "application/wasm";
            case "txt": return "text/plain";
            default: return "application/octet-stream";
        }
    }

    /** reads at most n bytes */
    private static final class Limited extends FilterInputStream {
        private long left;
        Limited(InputStream in, long n) { super(in); left = n; }
        @Override public int read() throws IOException { if (left <= 0) return -1; int b = super.read(); if (b >= 0) left--; return b; }
        @Override public int read(byte[] b, int off, int len) throws IOException {
            if (left <= 0) return -1; int n = super.read(b, off, (int) Math.min(len, left)); if (n > 0) left -= n; return n;
        }
    }
}
