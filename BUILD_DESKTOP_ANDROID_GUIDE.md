# 📱 Guide Build Desktop & Android - Noxtiz POS

## 🎯 Platform yang Didukung

### ✅ Desktop
- **Windows** (PC) - `.exe` installer + portable
- **macOS** (Mac) - `.dmg` + `.zip`
- **Linux** - `.AppImage`, `.deb`, `.rpm`

### ✅ Mobile
- **Android** (Tablet & HP) - `.apk` via Capacitor

---

## 🖥️ BUILD UNTUK DESKTOP (Windows, Mac, Linux)

### Build Semua Desktop Sekaligus:
```bash
npm run build:desktop
```

### Build Per Platform:
```bash
# Windows saja
npm run build:win

# Mac saja (harus di Mac)
npm run build:mac

# Linux saja
npm run build:linux
```

### Output Desktop:
Setelah build, file ada di folder `dist/`:

**Windows:**
- `Noxtiz POS Setup 1.0.0.exe` - Installer
- `Noxtiz POS 1.0.0.exe` - Portable version
- `latest.yml` - Update metadata

**Mac:**
- `Noxtiz POS-1.0.0.dmg` - Disk image
- `Noxtiz POS-1.0.0-mac.zip` - Zip archive
- `latest-mac.yml` - Update metadata

**Linux:**
- `Noxtiz POS-1.0.0.AppImage` - AppImage (universal)
- `Noxtiz POS_1.0.0_amd64.deb` - Debian/Ubuntu
- `Noxtiz POS-1.0.0.x86_64.rpm` - RedHat/Fedora
- `latest-linux.yml` - Update metadata

---

## 📱 BUILD UNTUK ANDROID (Tablet & HP)

### Prerequisites:
1. Install Android Studio
2. Install Java JDK (minimal JDK 11)
3. Set environment variables:
   - `ANDROID_HOME` = path ke Android SDK
   - `JAVA_HOME` = path ke JDK

### Setup Capacitor (Pertama Kali):

> **Note:** Jika folder `android/` sudah ada, skip step 2-3. Langsung ke step 4.

#### 1. Install Dependencies (sudah terinstall)
```bash
npm install @capacitor/core @capacitor/cli
npm install @capacitor/android
```

#### 2. Initialize Capacitor (jika belum ada `capacitor.config.ts`)
```bash
npx cap init "Noxtiz POS" "com.noxtiz.pos"
```

> **Note:** File `capacitor.config.ts` itu **NORMAL** dan **TIDAK PERLU DIHAPUS**. Capacitor support TypeScript config.

#### 3. Add Android Platform (jika folder `android/` belum ada)
```bash
npx cap add android
```

> **Note:** Jika error "android platform already exists", berarti sudah ada. Skip step ini.

#### 4. Sync Files
```bash
# Build web app dulu
npm run build:electron && vite build

# Sync ke Android
npx cap sync android
```

### Build APK:

#### Opsi 1: Via Command Line (Recommended)

**Windows PowerShell:**
```powershell
# Build web app dulu
npm run build:electron
npm run build

# Sync ke Android
npx cap sync android

# Build APK
npm run build:android:gradle
```

**Atau pakai script (cross-platform):**
```bash
npm run build:android
```

Ini akan:
1. Build Electron
2. Build web app (vite build)
3. Sync ke Android
4. Build APK release

#### Opsi 2: Via Android Studio

**Windows PowerShell:**
```powershell
# Build web app dulu
npm run build:electron
npm run build

# Sync ke Android
npx cap sync android

# Buka Android Studio
npx cap open android
```

**Di Android Studio:**
1. Tunggu Gradle sync selesai
2. Build > Generate Signed Bundle / APK
3. Pilih APK
4. Create new keystore (atau gunakan existing)
5. Build

**Atau build langsung di Android Studio:**
- Build > Build Bundle(s) / APK(s) > Build APK(s)
- APK akan ada di `android/app/build/outputs/apk/debug/` atau `release/`

### Output Android:
APK akan ada di:
```
android/app/build/outputs/apk/release/app-release.apk
```

---

## 🚀 BUILD SEMUA PLATFORM SEKALIGUS

### Command:
```bash
npm run build:all
```

Ini akan build:
- ✅ Windows
- ✅ macOS
- ✅ Linux
- ✅ Android

**Note:** Build semua platform butuh waktu lama (10-30 menit tergantung spesifikasi PC).

---

## 📦 Upload ke Server

### Struktur Folder di Server:
```
noxtiz.com/updates/
  ├── windows/
  │   ├── latest.yml
  │   ├── Noxtiz POS Setup 1.0.0.exe
  │   └── Noxtiz POS 1.0.0.exe
  ├── mac/
  │   ├── latest-mac.yml
  │   ├── Noxtiz POS-1.0.0.dmg
  │   └── Noxtiz POS-1.0.0-mac.zip
  ├── linux/
  │   ├── latest-linux.yml
  │   ├── Noxtiz POS-1.0.0.AppImage
  │   ├── Noxtiz POS_1.0.0_amd64.deb
  │   └── Noxtiz POS-1.0.0.x86_64.rpm
  └── android/
      └── app-release.apk
```

### Upload Steps:

#### 1. Desktop Files
```bash
# Upload semua file dari dist/ ke folder sesuai platform
# Windows → noxtiz.com/updates/windows/
# Mac → noxtiz.com/updates/mac/
# Linux → noxtiz.com/updates/linux/
```

#### 2. Android APK
```bash
# Upload APK ke
# noxtiz.com/updates/android/app-release.apk
```

---

## 🔧 Setup Android Environment

### ⚠️ PREREQUISITES (WAJIB!)

1. **Install Java JDK 11 atau 17**
   - Download: https://adoptium.net/ atau https://www.oracle.com/java/technologies/downloads/
   - Install JDK (bukan JRE)
   - Catat lokasi install (biasanya `C:\Program Files\Java\jdk-11` atau `C:\Program Files\Java\jdk-17`)

2. **Install Android Studio**
   - Download: https://developer.android.com/studio
   - Install dan buka Android Studio
   - Setup SDK melalui Android Studio SDK Manager
   - Catat lokasi SDK (biasanya `C:\Users\YourName\AppData\Local\Android\Sdk`)

### Windows PowerShell - Setup Environment Variables:

**Opsi 1: Temporary (untuk session ini saja)**
```powershell
# Cek lokasi JDK (sesuaikan dengan versi yang terinstall)
# Biasanya ada di: C:\Program Files\Java\jdk-11 atau jdk-17
$env:JAVA_HOME = "C:\Program Files\Java\jdk-17"  # GANTI dengan path JDK kamu!

# Cek lokasi Android SDK
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"  # Atau path custom kamu

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

**Opsi 2: Permanent (Recommended)**
1. Buka **System Properties** > **Environment Variables**
2. Di **User variables** atau **System variables**, klik **New**:
   - Variable name: `JAVA_HOME`
   - Variable value: `C:\Program Files\Java\jdk-17` (sesuaikan dengan path JDK kamu)
3. Klik **New** lagi:
   - Variable name: `ANDROID_HOME`
   - Variable value: `C:\Users\YourName\AppData\Local\Android\Sdk` (sesuaikan dengan path SDK kamu)
4. Edit **PATH** variable, tambahkan:
   - `%JAVA_HOME%\bin`
   - `%ANDROID_HOME%\platform-tools`
   - `%ANDROID_HOME%\tools`
   - `%ANDROID_HOME%\tools\bin`
5. **Restart PowerShell** atau buka terminal baru
6. Verify:
   ```powershell
   java -version
   echo $env:JAVA_HOME
   echo $env:ANDROID_HOME
   ```

### Mac/Linux:
```bash
# Install Android Studio
# Set environment variables di ~/.bashrc atau ~/.zshrc:
export ANDROID_HOME=$HOME/Library/Android/sdk
export JAVA_HOME=/Library/Java/JavaVirtualMachines/jdk-11.jdk/Contents/Home
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/tools
```

### Verify Setup:
```bash
# Check Android SDK
adb version

# Check Java
java -version

# Check Capacitor
npx cap doctor
```

---

## 📝 Capacitor Configuration

### File: `capacitor.config.ts` (create if not exists)
```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.noxtiz.pos',
  appName: 'Noxtiz POS',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
```

### Android Manifest (auto-generated):
File: `android/app/src/main/AndroidManifest.xml`
- Auto-generated oleh Capacitor
- Bisa di-edit untuk custom permissions

---

## 🐛 Troubleshooting

### ❌ Error: `JAVA_HOME is not set and no 'java' command could be found`

**Penyebab:** Java JDK belum terinstall atau `JAVA_HOME` belum di-set.

**Solusi:**
1. **Install Java JDK 11 atau 17:**
   - Download: https://adoptium.net/ (recommended) atau https://www.oracle.com/java/technologies/downloads/
   - Install JDK (bukan JRE!)
   - Catat lokasi install (contoh: `C:\Program Files\Java\jdk-17`)

2. **Set JAVA_HOME (PowerShell - temporary):**
   ```powershell
   $env:JAVA_HOME = "C:\Program Files\Java\jdk-17"  # GANTI dengan path JDK kamu!
   $env:PATH += ";$env:JAVA_HOME\bin"
   ```

3. **Set JAVA_HOME (Permanent):**
   - Buka **System Properties** > **Environment Variables**
   - Add variable: `JAVA_HOME` = `C:\Program Files\Java\jdk-17` (sesuaikan path)
   - Edit **PATH**, tambahkan: `%JAVA_HOME%\bin`
   - **Restart PowerShell**

4. **Verify:**
   ```powershell
   java -version
   echo $env:JAVA_HOME
   ```

### ⚠️ Warning: `Cannot run init for a project using a non-JSON configuration file`

**Penyebab:** Ini **BUKAN ERROR**, hanya warning. Capacitor support TypeScript config (`capacitor.config.ts`).

**Solusi:** **IGNORE** warning ini. File `capacitor.config.ts` itu **NORMAL** dan **TIDAK PERLU DIHAPUS**. Capacitor akan otomatis pakai file ini.

### ⚠️ Warning: `android platform already exists`

**Penyebab:** Folder `android/` sudah ada dari setup sebelumnya.

**Solusi:** **IGNORE** warning ini. Jika folder `android/` sudah ada, berarti setup sudah selesai. Langsung lanjut ke build:
```powershell
npm run build:android
```

### Problem: Android build gagal
**Solusi:**
- Pastikan Android Studio terinstall
- Check `ANDROID_HOME` dan `JAVA_HOME` sudah set
- Run `npx cap doctor` untuk check issues
- **Windows:** Pastikan Gradle bisa jalan: `cd android && gradlew.bat --version`
- **Linux/Mac:** Pastikan Gradle bisa jalan: `cd android && ./gradlew --version`
- Pastikan `dist/` folder ada (build web app dulu sebelum sync)

### Problem: APK tidak bisa diinstall
**Solusi:**
- Enable "Install from Unknown Sources" di Android
- Check APK signature
- Pastikan minSdkVersion sesuai (default 22)

### Problem: Capacitor sync error
**Solusi:**
- Pastikan `dist/` folder ada (build web app dulu)
- Check `capacitor.config.ts` sudah benar
- Delete `android/` folder dan `npx cap add android` lagi (hanya jika benar-benar perlu)

### Problem: Desktop build gagal untuk Mac/Linux
**Solusi:**
- Mac: Harus build di Mac (atau use CI/CD)
- Linux: Install dependencies sesuai distro
- Consider use GitHub Actions untuk cross-platform build

---

## ✅ Checklist Build

### Desktop:
- [ ] Build Electron: `npm run build:electron`
- [ ] Build web: `vite build`
- [ ] Build desktop: `npm run build:desktop`
- [ ] Test installer Windows
- [ ] Test DMG Mac (jika ada Mac)
- [ ] Test AppImage Linux
- [ ] Upload ke server

### Android:
- [ ] Install Android Studio
- [ ] Set environment variables
- [ ] Install Capacitor: `npm install @capacitor/core @capacitor/cli @capacitor/android`
- [ ] Initialize: `npx cap init`
- [ ] Add platform: `npx cap add android`
- [ ] Build web: `npm run build:electron && vite build`
- [ ] Sync: `npx cap sync android`
- [ ] Build APK: `npm run build:android`
- [ ] Test APK di device/emulator
- [ ] Upload ke server

---

## 🎯 Quick Commands

```bash
# Build semua desktop
npm run build:desktop

# Build Android
npm run build:android

# Build semua (desktop + Android)
npm run build:all

# Sync Android (setelah update code)
npx cap sync android

# Open Android Studio
npx cap open android

# Check Capacitor setup
npx cap doctor
```

---

## 📌 Notes

- **Android Build:** Butuh Android Studio dan JDK
- **Mac Build:** Harus di Mac atau use CI/CD
- **Version:** Update version di `package.json` sebelum build
- **Signing:** Android APK perlu di-sign untuk production (opsional untuk testing)
- **Testing:** Test di real device untuk Android, bukan hanya emulator

---

**Selamat Build! 🚀**

