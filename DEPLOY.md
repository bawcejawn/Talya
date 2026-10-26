# Getting Talya onto phones and into the app stores

Talya is one codebase (`src/`) packaged three ways:

| Version | Where people get it | Cost | Status |
|---|---|---|---|
| Website | https://bawcejawn.github.io/Talya/ (add to home screen) | $0 | Live |
| Android test app | Download link on GitHub (below) | $0 | Built automatically on every change |
| Google Play | Play Store | $25 once | Needs your developer account |
| Apple App Store | App Store / TestFlight | $99 a year | Needs your developer account |

Requirements checked October 2026. Stores change their rules often, so recheck anything marked *verify*.

---

## Stage 0 — Use it on your phone today (free)

**iPhone:** open the website in Safari → Share button → **Add to Home Screen**. Talya opens like an app, and the microphone works. A real App Store app needs Stage 2.

**Android:** on your phone, open
`https://github.com/bawcejawn/Talya/releases/download/android-beta/talya-beta.apk`
1. Tap the file when it finishes downloading.
2. If asked, allow your browser to **install unknown apps**.
3. Tap **Install**, then open Talya and allow the microphone.

New builds install over the old one, so your results are kept. Google plans to require developer verification for apps installed this way, starting in four countries (Brazil, Indonesia, Singapore, Thailand) on September 30, 2026 and worldwide in 2027. US testers are not affected yet.

---

## Stage 1 — Google Play (about 3–4 weeks, $25)

Most of the time is a required 14-day test.

### 1. Create your developer account (day 1)
- Go to **play.google.com/console** and sign in with a Google account. A new Gmail made just for Talya is best.
- Choose a **Personal** account. An Organization account needs a registered business and a D-U-N-S number, but it skips the 12-tester rule below.
- Pay the **$25 one-time fee**. Prepaid cards are not accepted.
- Verify your identity with a government ID, and verify you own an Android phone through the **Play Console** app.
- Approval usually takes a few days.

### 2. Create your upload key (day 1, with me)
Google signs the app it sends to users. You sign uploads with your own private key, which must never go into the public repo.
- I can generate the key for you. You then save the file and password somewhere safe, like a password manager.
- Then add 4 secrets in GitHub: repo → **Settings → Secrets and variables → Actions → New repository secret**:
  `TALYA_KEYSTORE_BASE64`, `TALYA_KEYSTORE_PASSWORD`, `TALYA_KEY_ALIAS`, `TALYA_KEY_PASSWORD`
- After that, every build also produces `talya-play.aab`, the file Google Play needs. Download it from the build's **Artifacts** on the Actions tab.
- If you ever lose this key, Google can reset it, because Play App Signing keeps the real signing key.

### 3. Create the app in Play Console (day 2)
- **Create app** → name "Talya" (or the final name) → App → Free.
- **Store listing:** copy the text from `STORE_LISTING.md`, and upload images from `store/android/`: the icon, feature graphic, and 4–5 phone screenshots.
- **App content:** fill in these forms (answers are in `STORE_LISTING.md`):
  - Privacy policy URL: `https://bawcejawn.github.io/Talya/privacy.html`
  - Data safety: no data collected or shared. Audio is processed only on the device.
  - Content rating questionnaire (IARC)
  - Target audience: 18 and over
  - Ads: none
- **App category:** Lifestyle.

### 4. Closed test: 12 testers for 14 days (days 3–17)
Personal accounts created after November 13, 2023 must run a closed test before going public:
- At least **12 testers** must stay opted in for **14 days in a row**. A tester who leaves and rejoins restarts the count.
- Steps: **Testing → Closed testing → Create track** → upload `talya-play.aab` → add testers (an email list, or a Google Group they join) → share the opt-in link.
- Testers need an Android phone and a Google account. Ask for 15–20 so dropouts don't reset you.
- The recruiting post in `RECRUITING.md` covers this. Friends and family count.
- Ask testers to open the app several times. Google asks about tester engagement when you apply.

### 5. Apply for production (day 18 onward)
- **Dashboard → Apply for production.** Answer the questions about your test and what you changed.
- Review usually takes about 7 days or less, then you can publish.
- Rule to keep in mind: new apps and updates must target **Android 16 (API level 36)**. Talya already does.

---

## Stage 2 — Apple App Store (about 1–2 weeks, $99/year)

### 1. Join the Apple Developer Program
- Go to **developer.apple.com/programs** and enroll as an **Individual**. You need an Apple ID with two-factor authentication.
- **$99 per year.** Approval is often 1–2 days.
- Your legal name appears as the seller on the App Store. Enrolling as an Organization shows a company name, but needs a registered business and D-U-N-S number.

### 2. No Mac needed
Apple requires apps to be built with **Xcode 26 or later** (since April 28, 2026). Xcode only runs on Macs. Two options:
- **Free:** GitHub's Mac build machines already compile the iPhone project on every change (the "ios" job). Once you have an Apple account, I add an **App Store Connect API key** as GitHub secrets, and the build uploads straight to TestFlight.
- **With a Mac:** run `npx cap open ios` and use Xcode → Product → Archive.

### 3. Set up the app in App Store Connect
- Go to **appstoreconnect.apple.com → Apps → +** and choose **New App**.
- Bundle ID: `io.github.bawcejawn.talya`. Name, primary language, and SKU (any text, e.g. `talya1`).
- **App Privacy:** choose **Data Not Collected**, which matches the privacy policy.
- **Age rating:** fill in the questionnaire. Talya has no objectionable content.
- **Category:** Lifestyle. Support URL: the GitHub issues page. Privacy policy URL as above.
- Screenshots: `store/iphone/` (1320 × 2868, the required 6.9-inch size).

### 4. TestFlight (optional but smart)
- **Internal testers** (up to 100 people on your team) get builds right away.
- **External testers** (up to 10,000) join with a public link after a short beta review.

### 5. Submit for review
- Review is usually 1–3 days.
- **Biggest rejection risk:** guideline 4.2 ("minimum functionality"), which Apple uses against apps that are just a website in a wrapper. Talya has a fair case: it uses the microphone, works offline, and stores progress. To be safe, the notes to the reviewer should explain the on-device voice analysis, and we may add a native touch first (reminders or haptics).
- Avoid health claims in the listing. Never say "therapy," "diagnose," or "treat." `STORE_LISTING.md` follows this.

---

## Costs at a glance

| Item | Cost | When |
|---|---|---|
| Website, GitHub builds, Android test app | $0 | Now |
| Google Play developer account | $25 once | When you're ready for Play |
| Apple Developer Program | $99 a year | When you're ready for iPhone |
| Mac | $0 (GitHub builds it) | — |

## Not tested yet
- The Android app is built automatically but has not been run on a real phone yet. Please install the test APK and try recording.
- The iPhone project compiles on GitHub, but microphone recording inside the iPhone app can only be tested once it is signed and installed (TestFlight).
