# Odogwu for Android

The Android app is a **Trusted Web Activity**: a real Play Store app that opens odogwu.online full screen in Chrome, with no browser bar. Everything (spraying, Paystack, the wall, dashboards, help) is the website, so every web update reaches the app instantly. You only rebuild the app to change its icon, name or package.

Links to odogwu.online (QR codes, WhatsApp links, emails) open straight in the app when it's installed.

## 1. Decide: update the old listing, or a new one?

**Update the old Odogwu listing (recommended).** It keeps its downloads, reviews and ranking. You need:
- The old app's **package name**: open its Play Store page; it's the part after `id=` in the address (e.g. `com.something.odogwu`).
- Access to its **Play Console**.
- Its **upload key**. If it was built with Expo/EAS, run `eas credentials` and download the Android keystore. If you can't find it: Play Console → the app → *Test and release → App integrity → Upload key certificate → Request upload key reset*, and upload `upload_certificate.pem` from the key pack. Google usually approves within 2 days, and from then on the new key in the key pack works for the old listing.

**New listing.** Use the package `online.odogwu.app` and the new key from the key pack. If your Play developer account is a *personal* account made after November 2023, Google requires a closed test with 12 testers for 14 days before you can publish to everyone.

## 2. Set up GitHub (once)

Repo → *Settings → Secrets and variables → Actions*:

| Type | Name | Value |
|---|---|---|
| Secret | `ANDROID_KEYSTORE_BASE64` | contents of `keystore-base64.txt` (or your old keystore, base64) |
| Secret | `ANDROID_KEYSTORE_PASSWORD` | keystore password |
| Secret | `ANDROID_KEY_ALIAS` | key alias (`upload` for the new key) |
| Secret | `ANDROID_KEY_PASSWORD` | key password |
| Variable | `ANDROID_APP_ID` | the old app's package name, if you're updating the old listing |

To base64 an old keystore on Windows (PowerShell):
```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("C:\path\to\old.keystore")) | Set-Clipboard
```

## 3. Build

GitHub → *Actions → Android app → Run workflow*. Set **Version code** higher than every version the old app ever shipped (the default 100 is safe for most apps; Play Console shows the old codes under *App bundle explorer*). About 5 minutes later, download from the run page:
- **odogwu-play-bundle**: the `.aab` to upload to Google Play
- **odogwu-test-apk**: install on your phone to try it first

The run summary shows the package name and the upload key's SHA-256.

## 4. Connect the app to the site (so there's no browser bar)

Play Console → the app → *Test and release → App integrity → App signing*. Copy both SHA-256 fingerprints: **App signing key** and **Upload key**. In Vercel add:

```
ANDROID_PACKAGE = the package name
ANDROID_SHA256  = APP_SIGNING_SHA256,UPLOAD_SHA256
```

Redeploy, then check https://odogwu.online/.well-known/assetlinks.json shows them. Until this is done the app still works, but shows a small address bar at the top.

## 5. Publish

Play Console → *Test and release → Production (or Internal testing first) → Create new release* → upload the `.aab`. Listing text and images are in the store pack (`Odogwu-Play-Store` folder).

Once it's live, add the Play link to Vercel as `NEXT_PUBLIC_PLAY_STORE_URL` and redeploy: Android visitors to the website then get a "Get the Android app" button.

## Changing the app later

`twa-manifest.json` records the settings this project was generated from (Bubblewrap). Colours and names live in `app/build.gradle` (the `twaManifest` block); icons in `app/src/main/res`. Bump the version code every upload.
