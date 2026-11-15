package in.duetpower.stem.shell;

import android.Manifest;
import android.annotation.SuppressLint;
import android.content.pm.PackageManager;
import android.webkit.PermissionRequest;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.core.content.ContextCompat;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.view.KeyEvent;
import android.view.View;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import androidx.activity.ComponentActivity;
import androidx.activity.OnBackPressedCallback;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;

/** One full-screen web view showing the DUET STEM app that ships inside this install: no internet needed. */
public class MainActivity extends ComponentActivity {
    private WebView web;
    private ContentServer server;
    private PermissionRequest pendingCam;
    private volatile boolean vrBox; // the page is in VR box mode: the volume buttons press instead of changing the volume
    // the camera for "Camera AR": Android asks the student once; the page gets the camera only after that
    private final ActivityResultLauncher<String> askCamera = registerForActivityResult(new ActivityResultContracts.RequestPermission(), (ok) -> {
        PermissionRequest r = pendingCam; pendingCam = null; if (r == null) return;
        if (ok) r.grant(new String[]{PermissionRequest.RESOURCE_VIDEO_CAPTURE}); else r.deny();
    });

    @SuppressLint({"SetJavaScriptEnabled", "AddJavascriptInterface"})
    @Override protected void onCreate(Bundle saved) {
        super.onCreate(saved);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        server = new ContentServer(this);
        web = new WebView(this);
        web.setBackgroundColor(Color.parseColor(BuildConfig.BG));
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        s.setSupportZoom(false);
        s.setTextZoom(100);
        s.setLoadWithOverviewMode(true);
        s.setUseWideViewPort(true);
        s.setOffscreenPreRaster(true);
        web.addJavascriptInterface(new Bridge(), "DuetNative");
        web.setWebChromeClient(new WebChromeClient() {
            @Override public void onPermissionRequest(final PermissionRequest r) {
                runOnUiThread(() -> {
                    boolean cam = false; for (String res : r.getResources()) if (PermissionRequest.RESOURCE_VIDEO_CAPTURE.equals(res)) cam = true;
                    if (!cam || !ContentServer.HOST.equals(r.getOrigin().getHost())) { r.deny(); return; } // only our own pages, only the camera
                    if (ContextCompat.checkSelfPermission(MainActivity.this, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED) r.grant(new String[]{PermissionRequest.RESOURCE_VIDEO_CAPTURE});
                    else { if (pendingCam != null) pendingCam.deny(); pendingCam = r; askCamera.launch(Manifest.permission.CAMERA); }
                });
            }
        });
        web.setWebViewClient(new WebViewClient() {
            @Override public WebResourceResponse shouldInterceptRequest(WebView v, WebResourceRequest r) {
                if (ContentServer.HOST.equals(r.getUrl().getHost())) return server.serve(r);
                return null;
            }
            @Override public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest r) {
                Uri u = r.getUrl();
                if (ContentServer.HOST.equals(u.getHost())) return false;
                try { startActivity(new Intent(Intent.ACTION_VIEW, u)); } catch (ActivityNotFoundException ignored) { /* no browser */ }
                return true; // other web pages (privacy, support) open in the phone's browser
            }
        });
        setContentView(web);
        hideBars();
        if (saved != null) web.restoreState(saved); else web.loadUrl(ContentServer.START);
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override public void handleOnBackPressed() { if (web.canGoBack()) web.goBack(); else finish(); }
        });
        // look for newer lessons in the background; they are used from the next start
        Thread t = new Thread(() -> Updater.run(getApplicationContext()), "duet-update");
        t.setPriority(Thread.MIN_PRIORITY); t.start();
    }

    private void hideBars() {
        WindowInsetsControllerCompat c = WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
        c.hide(WindowInsetsCompat.Type.systemBars());
        c.setSystemBarsBehavior(WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
    }

    @Override public boolean dispatchKeyEvent(KeyEvent e) {
        int k = e.getKeyCode();
        if (vrBox && web != null && (k == KeyEvent.KEYCODE_VOLUME_UP || k == KeyEvent.KEYCODE_VOLUME_DOWN)) {
            if (e.getAction() == KeyEvent.ACTION_DOWN && e.getRepeatCount() == 0) {
                String key = k == KeyEvent.KEYCODE_VOLUME_UP ? "AudioVolumeUp" : "AudioVolumeDown";
                web.evaluateJavascript("dispatchEvent(new KeyboardEvent('keydown',{key:'" + key + "',code:'" + key + "'}))", null);
            }
            return true;
        }
        return super.dispatchKeyEvent(e);
    }

    @Override public void onWindowFocusChanged(boolean hasFocus) { super.onWindowFocusChanged(hasFocus); if (hasFocus) hideBars(); }
    @Override protected void onSaveInstanceState(Bundle out) { super.onSaveInstanceState(out); web.saveState(out); }
    @Override protected void onPause() { super.onPause(); web.onPause(); }
    @Override protected void onResume() { super.onResume(); web.onResume(); }
    @Override protected void onDestroy() { if (web != null) { web.destroy(); } super.onDestroy(); }

    /** lets the page know it runs inside the Android app */
    final class Bridge {
        @JavascriptInterface public String platform() { return "android"; }
        @JavascriptInterface public String version() { return BuildConfig.VERSION_NAME; }
        @JavascriptInterface public void vrMode(boolean on) { vrBox = on; }
        @JavascriptInterface public void openExternal(String url) {
            runOnUiThread(() -> { try { startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url))); } catch (Exception ignored) { /* none */ } });
        }
    }
}
