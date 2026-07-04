# FatafatDecor Partner — Android & iOS Release Process

App: **FatafatDecor Partner** · package/bundle `in.co.ylo.fatafatdecor.decorator`
EAS project: `fatafatdecor-decorator` (id `7b8c5081-81be-4324-9dfe-218c36f69c00`, owner `kunal_ylo`)
Repo: https://github.com/kunalylo/decorator-mobile (branch `master`)

---

## ✅ Already done (state as of 2026-07-03)

- EAS project created & linked; Android keystore generated and stored on EAS servers.
- **Android test APK (v1.0.0, versionCode 1)** — install directly on phones:
  https://expo.dev/artifacts/eas/Fc_GJBoB0dwsPfY3fGrBqSs0cUsL5hUDa4X54Jayjxo.apk
- **Android Play Store AAB (v1.0.0, versionCode 1)**:
  https://expo.dev/artifacts/eas/cORHDekNlRDN9Ike37zfFBR0XlQzMIZqDDRN__e1ff8.aab
- iOS submit config in `eas.json` (Apple ID `fatafatdecor4@gmail.com`, team `7SW2LHDSCG`).

---

## 🤖 ANDROID — full process

### A. Direct install (testing/training) — DONE
1. Build: `npx eas-cli build -p android --profile preview` → produces an APK.
2. Share the APK link/QR with decorators → download → allow unknown sources → install.

### B. Play Store first release (one-time, ~1–2 hours of form filling)
1. **Play Console** (https://play.google.com/console, same account as the customer app)
   → **Create app** → name **FatafatDecor Partner** → App (not game) → Free.
2. **App content** (Policy section — all mandatory):
   - Privacy policy URL — reuse the customer app's.
   - **App access**: "All or some functionality is restricted" → add credentials for review:
     create a dedicated review decorator (e.g. phone `9999999901`, password) — reviewers
     must be able to log in.
   - Ads: No · Content rating questionnaire: Utility, no objectionable content →
     Everyone · Target audience: 18+ · Data safety: collects phone/location(foreground,
     for job tracking)/photos(uploaded as work proof); data encrypted in transit; no ads/sharing.
3. **Store listing**: short description (80 ch), full description, app icon 512×512
   (`assets/icon.png` upscaled), feature graphic 1024×500, ≥2 phone screenshots
   (take on a phone from the installed APK: dashboard, order detail, gift, earnings).
4. **Release**: Testing → **Internal testing** → Create release → upload the **AAB** →
   add tester emails → roll out. Verify install via the opt-in link.
5. Promote to **Production** → roll out → Google review (usually 1–7 days) → live.

### C. Android updates (every future release)
1. Bump in `app.json`: `expo.version` (e.g. 1.0.1) and `expo.android.versionCode` (+1 — REQUIRED).
2. `npx eas-cli build -p android --profile production --non-interactive`
3. Play Console → Production → New release → upload new AAB → roll out.
   (Optional automation: Play Console → API access → create a service account JSON →
   save as `google-play-key.json` → then `npx eas-cli submit -p android --latest` does step 3.)

---

## 🍎 iOS — full process

### A. One-time credential setup (ONLY step needing a human — Apple 2FA)
```bash
cd fatafatdecor-decorator-mobile
npx eas-cli build -p ios --profile production
```
- Log in with **fatafatdecor4@gmail.com** (approve 2FA on the Apple device).
- Answer **Yes** to: register bundle ID `in.co.ylo.fatafatdecor.decorator`,
  generate Distribution Certificate, generate Provisioning Profile.
- This stores everything on EAS **and starts the first iOS build** (~15–30 min).
- All later iOS builds run non-interactively.

### B. App Store Connect app record (one-time)
1. https://appstoreconnect.apple.com → My Apps → **+** → New App:
   platform iOS · name **FatafatDecor Partner** · language English (India) ·
   bundle ID `in.co.ylo.fatafatdecor.decorator` · SKU `fatafatdecor-partner`.
2. Note the **Apple ID (ascAppId)** number of the new app → add it to `eas.json`
   under `submit.production.ios.ascAppId` (enables non-interactive submits).

### C. TestFlight (testing on iPhones)
1. `npx eas-cli submit -p ios --latest` → uploads the build to App Store Connect.
2. App Store Connect → TestFlight → wait for processing (~10 min) → answer the export
   compliance question (uses standard HTTPS only → exempt; `ITSAppUsesNonExemptEncryption`
   is already false in app.json so this is usually auto).
3. Add Internal Testers (your team's Apple IDs) → they install via the TestFlight app.

### D. App Store release
1. App Store Connect → App Store tab → prepare the version:
   screenshots (6.7" iPhone required; take from TestFlight run), description, keywords,
   support URL, privacy policy URL (same as customer app).
2. **App Privacy** questionnaire (same answers as Play data safety).
3. **App Review Information**: provide the demo decorator login (phone + password) and a
   note: "Partner app for FatafatDecor decorators. Accounts are created by the business.
   Use the provided demo account."
4. Select the TestFlight build → Submit for Review → typically 1–3 days → Release.

### E. iOS updates (every future release)
1. Bump `expo.version` and `expo.ios.buildNumber` (+1) in `app.json`.
2. `npx eas-cli build -p ios --profile production --non-interactive`
3. `npx eas-cli submit -p ios --latest` → new TestFlight build → submit the version update.

---

## Gotchas / lessons learned
- `babel-preset-expo` must stay a devDependency pinned to the SDK line (`~54.0.0`).
  Missing → EAS "Bundle JavaScript" phase fails; wrong major (57.x) → hermesc
  "private properties are not supported". Sanity check before building:
  `npx expo export --platform android` must complete.
- EAS requires the project to be a git repo (it is now).
- Play + Apple BOTH require working review credentials (the app is login-gated) —
  keep a dedicated review decorator account active.
- versionCode (Android) / buildNumber (iOS) must increase on every store upload.
