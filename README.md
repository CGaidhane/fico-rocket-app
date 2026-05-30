# SAP FICO Rocket App 🚀

An interactive, gamified learning dashboard for **SAP FICO and S/4HANA interview preparation**.

Built as a static HTML/Tailwind single-file application using Vite, wrapped into a native Android application using Capacitor.

## 📱 Direct Android Installation

**Ready to use!** Download the pre-compiled APK directly from the repository:

- **[Download fico-rocket-app.apk](./release/fico-rocket-app.apk)**

Install on your Android device (enable "Install from unknown sources" if prompted). The app works completely offline.

## ✨ Features

- **Gamified Learning** — Progress through consultant, senior consultant, and manager realms with XP, streaks, and achievements
- **Synthesized Audio** — Self-contained audio feedback using Web Audio API (no external sound files)
- **Haptic Feedback** — Native vibration support via `navigator.vibrate`
- **Permanent Memory Persistence** — Progress is saved reliably across app restarts and device reboots
  - Achieved by overriding Android WebView settings in the native layer (`setDomStorageEnabled(true)` and `setDatabaseEnabled(true)` in [MainActivity.java](android/app/src/main/java/com/ficorocket/app/MainActivity.java))
- **Interview Mode** — Realistic SAP FICO / S/4HANA question drills with instant feedback
- **Fully Offline** — No backend, no tracking, no network calls required

## 🛠 Tech Stack

- **Frontend**: Static HTML + Tailwind CSS (via Vite)
- **Native Wrapper**: Capacitor 8 + Android
- **Persistence**: WebView DOM Storage + native configuration

## 🚀 How to Setup Locally

```bash
# 1. Install dependencies
npm install

# 2. Build the web assets
npm run build

# 3. Sync web assets into the native Android project
npx cap sync

# 4. Open the project in Android Studio
npx cap open android
```

Then build and run the app from Android Studio (or use `./gradlew assembleDebug` from the `android/` folder).

## 📁 Project Structure

```
fico-rocket-app/
├── index.html          # Main application (self-contained gamified dashboard)
├── src/                # Vite source (minimal)
├── android/            # Capacitor Android project (native wrapper + persistence)
│   └── app/src/main/java/com/ficorocket/app/MainActivity.java
├── release/
│   └── fico-rocket-app.apk   # Pre-built installable APK (tracked)
├── capacitor.config.ts
└── package.json
```

## 📄 License

This project is provided as-is for personal learning and interview preparation purposes.

---

**Made for SAP FICO aspirants who want to practice in a fun, memorable way.** Good luck with your interviews! 🎯
