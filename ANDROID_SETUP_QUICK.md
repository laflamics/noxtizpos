# 🚀 Android Build - Quick Setup

## ⚠️ PREREQUISITES (WAJIB!)

### 1. Install Java JDK
- Download: https://adoptium.net/ (pilih JDK 11 atau 17)
- Install JDK (bukan JRE!)
- Catat lokasi install (contoh: `C:\Program Files\Java\jdk-17`)

### 2. Install Android Studio
- Download: https://developer.android.com/studio
- Install dan buka Android Studio
- Setup SDK melalui Android Studio SDK Manager
- Catat lokasi SDK (biasanya `C:\Users\YourName\AppData\Local\Android\Sdk`)

---

## 🔧 Setup Environment Variables (PowerShell)

### Opsi 1: Temporary (untuk session ini saja)

```powershell
# Set JAVA_HOME (GANTI dengan path JDK kamu!)
$env:JAVA_HOME = "C:\Program Files\Java\jdk-17"

# Set ANDROID_HOME
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"

# Add to PATH
$env:PATH += ";$env:JAVA_HOME\bin"
$env:PATH += ";$env:ANDROID_HOME\platform-tools"
$env:PATH += ";$env:ANDROID_HOME\tools"
$env:PATH += ";$env:ANDROID_HOME\tools\bin"

# Verify
java -version
echo $env:JAVA_HOME
echo $env:ANDROID_HOME
```

### Opsi 2: Permanent (Recommended)

1. Buka **System Properties** > **Environment Variables**
2. Klik **New** di **User variables**:
   - Variable name: `JAVA_HOME`
   - Variable value: `C:\Program Files\Java\jdk-17` (sesuaikan path)
3. Klik **New** lagi:
   - Variable name: `ANDROID_HOME`
   - Variable value: `C:\Users\YourName\AppData\Local\Android\Sdk` (sesuaikan path)
4. Edit **PATH** variable, tambahkan:
   - `%JAVA_HOME%\bin`
   - `%ANDROID_HOME%\platform-tools`
   - `%ANDROID_HOME%\tools`
   - `%ANDROID_HOME%\tools\bin`
5. **Restart PowerShell**
6. Verify:
   ```powershell
   java -version
   echo $env:JAVA_HOME
   echo $env:ANDROID_HOME
   ```

---

## 📱 Build Android APK

### Quick Build (All-in-One):
```powershell
npm run build:android
```

Ini akan:
1. Build Electron
2. Build web app
3. Sync ke Android
4. Build APK release

### Manual Build (Step by Step):
```powershell
# 1. Build Electron
npm run build:electron

# 2. Build web app
npm run build

# 3. Sync ke Android
npx cap sync android

# 4. Build APK
cd android
.\gradlew.bat assembleRelease
```

### Output:
APK akan ada di:
```
android/app/build/outputs/apk/release/app-release.apk
```

---

## 🐛 Troubleshooting

### Error: `JAVA_HOME is not set`
**Fix:** Set `JAVA_HOME` seperti di atas.

### Warning: `Cannot run init for a project using a non-JSON configuration file`
**Fix:** **IGNORE** - File `capacitor.config.ts` itu normal, tidak perlu dihapus.

### Warning: `android platform already exists`
**Fix:** **IGNORE** - Folder `android/` sudah ada, langsung build saja.

---

## ✅ Checklist

- [ ] Java JDK terinstall
- [ ] Android Studio terinstall
- [ ] `JAVA_HOME` sudah di-set
- [ ] `ANDROID_HOME` sudah di-set
- [ ] `java -version` berhasil
- [ ] `npx cap doctor` tidak ada error
- [ ] Build web app berhasil (`npm run build`)
- [ ] Build Android berhasil (`npm run build:android`)

