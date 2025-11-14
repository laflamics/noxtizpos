# ⚡ Quick Start Build - Noxtiz POS

## 🖥️ Build Desktop (Windows, Mac, Linux)

```bash
npm run build:desktop
```

File hasil ada di folder `dist/`

---

## 📱 Build Android (Setup Pertama Kali)

### Step 1: Install Dependencies
```bash
npm install @capacitor/core @capacitor/cli @capacitor/android
```

### Step 2: Initialize Capacitor
```bash
npx cap init "Noxtiz POS" "com.noxtiz.pos"
```

### Step 3: Add Android Platform
```bash
npx cap add android
```

### Step 4: Build Web App
**Windows PowerShell:**
```powershell
npm run build:electron
npm run build
```

**Linux/Mac:**
```bash
npm run build:electron && vite build
```

### Step 5: Sync ke Android
```bash
npx cap sync android
```

### Step 6: Build APK

**Opsi A: Via Command Line (Windows)**
```powershell
cd android
.\gradlew.bat assembleRelease
```

**Opsi B: Via Android Studio**
```bash
npx cap open android
```
Lalu di Android Studio: Build > Build Bundle(s) / APK(s) > Build APK(s)

APK ada di: `android/app/build/outputs/apk/release/app-release.apk`

---

## 🚀 Build Semua (Desktop + Android)

```bash
npm run build:all
```

**Note:** Di Windows PowerShell, jika ada error dengan `&&`, run commands secara terpisah.

---

## ✅ Checklist Cepat

### Desktop:
- [ ] `npm run build:desktop`
- [ ] Check file di `dist/`
- [ ] Upload ke server

### Android:
- [ ] Install Android Studio
- [ ] Set ANDROID_HOME dan JAVA_HOME
- [ ] `npm install @capacitor/core @capacitor/cli @capacitor/android`
- [ ] `npx cap init "Noxtiz POS" "com.noxtiz.pos"`
- [ ] `npx cap add android`
- [ ] `npm run build:electron` + `npm run build`
- [ ] `npx cap sync android`
- [ ] Build APK (via command atau Android Studio)
- [ ] Test APK
- [ ] Upload ke server

---

## 🐛 Troubleshooting

### PowerShell: `&&` tidak work
**Fix:** Run commands secara terpisah:
```powershell
npm run build:electron
npm run build
npx cap sync android
```

### Error: "missing dist directory"
**Fix:** Build web app dulu sebelum sync:
```powershell
npm run build:electron
npm run build
npx cap sync android
```

### Error: Gradle tidak ditemukan
**Fix:** 
- Windows: Pakai `gradlew.bat` (bukan `./gradlew`)
- Pastikan Android Studio terinstall
- Check `ANDROID_HOME` sudah set

---

**Untuk detail lengkap, lihat `BUILD_DESKTOP_ANDROID_GUIDE.md`**

