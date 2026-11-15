package in.duetpower.stem.shell;

import android.content.Context;
import android.content.res.AssetManager;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.security.MessageDigest;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;

/**
 * Keeps the app's content up to date without a store update. When online, it compares the published file
 * list (offline.json) with what the device has, downloads only the files that changed (checked by hash) into
 * a new folder, and switches to it when every file is in. The switch takes effect the next time the app opens,
 * so a lesson in progress never mixes old and new files. With no internet nothing happens: the bundled copy
 * (or the last complete update) keeps working.
 */
final class Updater {
    static final class Active { String v, base; Map<String, String> files; File dir; }

    /** the last complete update, if it was made for the copy inside this install (after a store update it is dropped) */
    static Active active(Context ctx, String bundledV) {
        try {
            File root = new File(ctx.getFilesDir(), "content");
            File cur = new File(root, "current.json");
            if (!cur.exists()) return null;
            JSONObject o = new JSONObject(new String(readFile(cur), "UTF-8"));
            Active a = new Active();
            a.v = o.getString("v"); a.base = o.optString("base", ""); a.dir = new File(root, o.getString("dir"));
            if (!a.base.equals(bundledV)) return null;
            a.files = readFiles(new String(readFile(new File(a.dir, "offline.json")), "UTF-8"));
            if (!a.dir.isDirectory()) return null;
            return a;
        } catch (Exception e) { return null; }
    }

    static void run(Context ctx) {
        try {
            String base = BuildConfig.REMOTE_BASE + BuildConfig.APP_DIR + "/";
            String remoteText = new String(get(base + "offline.json?t=" + System.currentTimeMillis(), 8000), "UTF-8");
            JSONObject remote = new JSONObject(remoteText);
            String rv = remote.getString("v");
            Map<String, String> rfiles = readFiles(remoteText);
            AssetManager am = ctx.getAssets();
            String bundledText = readAsset(am, "app/offline.json");
            String bv = new JSONObject(bundledText).getString("v");
            Map<String, String> bfiles = readFiles(bundledText);
            Active act = active(ctx, bv);
            File root = new File(ctx.getFilesDir(), "content");
            if (rv.equals(bv)) { new File(root, "current.json").delete(); return; } // the install itself is the newest: the saved update is dropped (its folder goes at the next start)
            // only a version built after the one inside this install: an older website must never roll the app back
            long bt = new JSONObject(bundledText).optLong("t", 0), rt = remote.optLong("t", 0);
            if (rt <= bt) return;
            if (act != null && rv.equals(act.v)) return;
            File stage = new File(root, "v-" + rv);
            stage.mkdirs();
            for (Iterator<String> it = rfiles.keySet().iterator(); it.hasNext(); ) {
                String p = it.next(), h = rfiles.get(p);
                if (h.equals(bfiles.get(p))) continue;                     // same as the bundled copy
                File out = new File(stage, p);
                if (out.exists() && h.equals(sha12(out))) continue;            // saved on an earlier try
                out.getParentFile().mkdirs();
                boolean ok = false;
                if (act != null && h.equals(act.files.get(p))) { File f = new File(act.dir, p); if (f.exists()) ok = copy(new FileInputStream(f), out, h); }
                if (!ok) ok = download(base + encode(p) + "?v=" + h, out, h);
                if (!ok) return;                                               // offline, or the site is mid-update: try next time
            }
            try (OutputStream os = new FileOutputStream(new File(stage, "offline.json"))) { os.write(remoteText.getBytes("UTF-8")); }
            File tmp = new File(root, "current.tmp");
            try (OutputStream os = new FileOutputStream(tmp)) { os.write(new JSONObject().put("v", rv).put("base", bv).put("dir", stage.getName()).toString().getBytes("UTF-8")); }
            if (!tmp.renameTo(new File(root, "current.json"))) return;
            // older folders are removed at the next start (cleanup), never while the app may still be reading from one
        } catch (Exception e) { /* no internet or a hiccup: the current copy keeps working */ }
    }

    /** at start, before anything is served: removes saved folders that are no longer the current update */
    static void cleanup(Context ctx) {
        try {
            File root = new File(ctx.getFilesDir(), "content");
            File[] ds = root.listFiles(); if (ds == null) return;
            String keep = null;
            File cur = new File(root, "current.json");
            if (cur.exists()) keep = new JSONObject(new String(readFile(cur), "UTF-8")).optString("dir", null);
            File partial = null; // the newest other folder may be an update still coming in: it is kept to finish later
            for (File d : ds) if (d.isDirectory() && !d.getName().equals(keep) && (partial == null || d.lastModified() > partial.lastModified())) partial = d;
            for (File d : ds) if (d.isDirectory() && !d.getName().equals(keep) && d != partial) deleteTree(d);
        } catch (Exception e) { /* keep what is there */ }
    }

    /** streams a file to disk (never the whole file in memory) and keeps it only if its hash matches */
    static boolean download(String url, File out, String h) {
        try {
            HttpURLConnection c = (HttpURLConnection) new URL(url).openConnection();
            c.setConnectTimeout(30000); c.setReadTimeout(30000); c.setUseCaches(false);
            try { if (c.getResponseCode() != 200) return false; return copy(c.getInputStream(), out, h); } finally { c.disconnect(); }
        } catch (Exception e) { return false; }
    }
    static boolean copy(InputStream in, File out, String h) {
        File tmp = new File(out.getPath() + ".part");
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-1");
            try (InputStream i = in; OutputStream os = new FileOutputStream(tmp)) {
                byte[] b = new byte[65536]; int n;
                while ((n = i.read(b)) > 0) { md.update(b, 0, n); os.write(b, 0, n); }
            }
            if (!h.equals(hex6(md.digest()))) { tmp.delete(); return false; }
            out.delete(); return tmp.renameTo(out);
        } catch (Exception e) { tmp.delete(); return false; }
    }
    static String sha12(File f) {
        try (InputStream in = new FileInputStream(f)) {
            MessageDigest md = MessageDigest.getInstance("SHA-1"); byte[] b = new byte[65536]; int n;
            while ((n = in.read(b)) > 0) md.update(b, 0, n);
            return hex6(md.digest());
        } catch (Exception e) { return ""; }
    }
    static String hex6(byte[] h) { StringBuilder s = new StringBuilder(); for (int i = 0; i < 6; i++) s.append(String.format("%02x", h[i])); return s.toString(); }

    static Map<String, String> readFiles(String text) {
        Map<String, String> m = new HashMap<>();
        try {
            JSONObject f = new JSONObject(text).getJSONObject("files");
            for (Iterator<String> it = f.keys(); it.hasNext(); ) { String k = it.next(); JSONArray a = f.getJSONArray(k); m.put(k, a.getString(0)); }
        } catch (Exception ignored) { /* empty */ }
        return m;
    }
    static String readAsset(AssetManager am, String name) { try (InputStream in = am.open(name)) { return new String(readAll(in), "UTF-8"); } catch (IOException e) { return "{}"; } }
    static byte[] readFile(File f) throws IOException { try (InputStream in = new FileInputStream(f)) { return readAll(in); } }
    static byte[] readAll(InputStream in) throws IOException {
        ByteArrayOutputStream bo = new ByteArrayOutputStream(); byte[] b = new byte[65536]; int n;
        while ((n = in.read(b)) > 0) bo.write(b, 0, n); return bo.toByteArray();
    }
    static byte[] get(String url, int timeout) throws IOException {
        HttpURLConnection c = (HttpURLConnection) new URL(url).openConnection();
        c.setConnectTimeout(timeout); c.setReadTimeout(timeout); c.setUseCaches(false);
        try { if (c.getResponseCode() != 200) throw new IOException("HTTP " + c.getResponseCode()); try (InputStream in = c.getInputStream()) { return readAll(in); } } finally { c.disconnect(); }
    }
    static String sha12(byte[] d) {
        try { byte[] h = MessageDigest.getInstance("SHA-1").digest(d); StringBuilder s = new StringBuilder(); for (int i = 0; i < 6; i++) s.append(String.format("%02x", h[i])); return s.toString(); }
        catch (Exception e) { return ""; }
    }
    static String encode(String p) {
        StringBuilder s = new StringBuilder();
        for (String part : p.split("/")) { if (s.length() > 0) s.append('/'); try { s.append(java.net.URLEncoder.encode(part, "UTF-8").replace("+", "%20")); } catch (Exception e) { s.append(part); } }
        return s.toString();
    }
    static void deleteTree(File f) { if (f == null) return; File[] k = f.listFiles(); if (k != null) for (File c : k) deleteTree(c); f.delete(); }
}
