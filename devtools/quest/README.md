# Quest apps (Trusted Web Activities): meeting Meta's store packaging rules

The Quest apps are TWAs made with Meta's Bubblewrap fork. Checked on 22 Nov 2026 against Meta's rules for apps created
after 1 March 2026 (developers.meta.com/horizon/resources/publish-mobile-manifest): minSdk 32 (29–34 allowed),
targetSdk 34, `android:installLocation="auto"`, `android:excludeFromRecents="true"` on the launcher,
`com.oculus.supportedDevices`, and `android.hardware.vr.headtracking` required for immersive (VR) apps.
The builds of Oct–Nov 2026 had minSdk 23 / targetSdk 32 and none of the others.

`patch_twa.py` fixes a built APK without its Bubblewrap project:

    java -jar apktool.jar d -o app DUET-Something.apk        # apktool 2.12+
    python3 devtools/quest/patch_twa.py app                  # also raises versionCode by 1
    java -jar apktool.jar b -o app-unsigned.apk app
    zipalign -f -P 16 4 app-unsigned.apk app-aligned.apk
    apksigner sign --ks <the app's own keystore> --ks-key-alias <alias> --ks-pass env:PW --key-pass env:PW \
      --v1-signing-enabled false --out DUET-Something-x.y.apk app-aligned.apk

Sign each app with its own key (the keys live on the Mac in `~/Downloads/SolarSystem360-Quest/keys/`, never in this
repository): an update signed with another key will not install over the app on a headset or in the Store.
With `apksigner`, give the passwords as `env:` (two `file:` options naming the same file make it read the second
line for the key password).
